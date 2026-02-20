// Atmospheric scattering sky with day-night cycle
// Uses the same SceneUniforms as lighting.wgsl

struct SceneUniforms {
  invViewProj: mat4x4<f32>,
  cameraPos: vec4<f32>,
  sunDir: vec4<f32>,
  sunColor: vec4<f32>,
  ambientColor: vec4<f32>,
  fogParams: vec4<f32>,            // z = timeOfDay, w = cloudCoverage
  cloudParams: vec4<f32>,          // x = baseNoiseScale, y = extinction, z = multiScatterFloor, w = detailStrength
  viewProj: mat4x4<f32>,          // unused in sky, layout must match lighting
  contactShadowParams: vec4<f32>,  // unused in sky, layout must match lighting
};

@group(0) @binding(0) var<uniform> scene: SceneUniforms;
@group(0) @binding(1) var gDepth: texture_depth_2d;

const PI: f32 = 3.14159265359;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) screenUV: vec2<f32>,
};

@vertex
fn vs_main(@builtin(vertex_index) vid: u32) -> VertexOutput {
  var output: VertexOutput;
  let x = f32(i32(vid & 1u)) * 4.0 - 1.0;
  let y = f32(i32(vid >> 1u)) * 4.0 - 1.0;
  output.position = vec4<f32>(x, y, 0.0, 1.0);
  output.screenUV = vec2<f32>(x * 0.5 + 0.5, 1.0 - (y * 0.5 + 0.5));
  return output;
}

// Rayleigh phase function
fn rayleighPhase(cosTheta: f32) -> f32 {
  return 3.0 / (16.0 * PI) * (1.0 + cosTheta * cosTheta);
}

// Henyey-Greenstein phase function (Mie scattering)
fn hgPhase(cosTheta: f32, g: f32) -> f32 {
  let g2 = g * g;
  let num = 1.0 - g2;
  let denom = 4.0 * PI * pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5);
  return num / denom;
}

// Simple hash for star field
fn hash(p: vec2<f32>) -> f32 {
  var p3 = fract(vec3<f32>(p.x, p.y, p.x) * 0.1031);
  p3 += dot(p3, vec3<f32>(p3.y + 33.33, p3.z + 33.33, p3.x + 33.33));
  return fract((p3.x + p3.y) * p3.z);
}

// === 3D Simplex Noise (Ashima Arts / Stefan Gustavson) ===

fn mod289_3(x: vec3<f32>) -> vec3<f32> { return x - floor(x * (1.0 / 289.0)) * 289.0; }
fn mod289_4(x: vec4<f32>) -> vec4<f32> { return x - floor(x * (1.0 / 289.0)) * 289.0; }
fn permute4(x: vec4<f32>) -> vec4<f32> { return mod289_4(((x * 34.0) + 10.0) * x); }
fn taylorInvSqrt4(r: vec4<f32>) -> vec4<f32> { return 1.79284291400159 - 0.85373472095314 * r; }

fn snoise3d(v: vec3<f32>) -> f32 {
  let C = vec2<f32>(1.0 / 6.0, 1.0 / 3.0);
  let D = vec4<f32>(0.0, 0.5, 1.0, 2.0);

  // First corner
  var i = floor(v + dot(v, vec3<f32>(C.y)));
  let x0 = v - i + dot(i, vec3<f32>(C.x));

  // Other corners
  let g = step(x0.yzx, x0.xyz);
  let l = 1.0 - g;
  let i1 = min(g.xyz, l.zxy);
  let i2 = max(g.xyz, l.zxy);

  let x1 = x0 - i1 + C.x;
  let x2 = x0 - i2 + C.y;   // 2.0 * C.x = 1/3
  let x3 = x0 - D.yyy;       // -1.0 + 3.0 * C.x = -0.5

  // Permutations
  i = mod289_3(i);
  let p = permute4(permute4(permute4(
    i.z + vec4<f32>(0.0, i1.z, i2.z, 1.0))
  + i.y + vec4<f32>(0.0, i1.y, i2.y, 1.0))
  + i.x + vec4<f32>(0.0, i1.x, i2.x, 1.0));

  // Gradients: 7x7 points over a square, mapped onto an octahedron
  let n_ = 0.142857142857; // 1.0 / 7.0
  let ns = n_ * D.wyz - D.xzx;

  let j = p - 49.0 * floor(p * ns.z * ns.z);

  let x_ = floor(j * ns.z);
  let y_ = floor(j - 7.0 * x_);

  let x = x_ * ns.x + ns.y;
  let y = y_ * ns.x + ns.y;
  let h = 1.0 - abs(x) - abs(y);

  let b0 = vec4<f32>(x.xy, y.xy);
  let b1 = vec4<f32>(x.zw, y.zw);

  let s0 = floor(b0) * 2.0 + 1.0;
  let s1 = floor(b1) * 2.0 + 1.0;
  let sh = -step(h, vec4<f32>(0.0));

  let a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  let a1 = b1.xzyw + s1.xzyw * sh.zzww;

  var p0 = vec3<f32>(a0.xy, h.x);
  var p1 = vec3<f32>(a0.zw, h.y);
  var p2 = vec3<f32>(a1.xy, h.z);
  var p3 = vec3<f32>(a1.zw, h.w);

  // Normalise gradients
  let norm = taylorInvSqrt4(vec4<f32>(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // Mix final noise value
  var m = max(vec4<f32>(0.6) - vec4<f32>(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), vec4<f32>(0.0));
  m = m * m;
  // Returns [-1, 1], remap to [0, 1]
  return 42.0 * dot(m * m, vec4<f32>(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3))) * 0.5 + 0.5;
}

// === Volumetric cloud functions ===
const CLOUD_MIN_Y: f32 = 300.0;
const CLOUD_MAX_Y: f32 = 500.0;
const CLOUD_STEPS: u32 = 40u;
const CLOUD_LIGHT_STEPS: u32 = 5u;

fn remap01(v: f32, low: f32, high: f32) -> f32 {
  return clamp((v - low) / (high - low), 0.0, 1.0);
}

fn cloudHeightGradient(h: f32) -> f32 {
  return smoothstep(0.0, 0.15, h) * smoothstep(1.0, 0.5, h);
}

fn sampleCloudDensity(worldPos: vec3<f32>, time: f32, cheap: bool) -> f32 {
  let heightFrac = clamp((worldPos.y - CLOUD_MIN_Y) / (CLOUD_MAX_Y - CLOUD_MIN_Y), 0.0, 1.0);
  let hGrad = cloudHeightGradient(heightFrac);
  if (hGrad < 0.001) { return 0.0; }

  let wind = vec3<f32>(time * 5.0, time * 0.3, time * 2.0);

  // Base shape: 3-octave FBM — higher freq for less blobby clouds
  let bp = (worldPos + wind) * scene.cloudParams.x;
  var shape = snoise3d(bp)         * 0.625
            + snoise3d(bp * 2.03)  * 0.25
            + snoise3d(bp * 4.01)  * 0.125;

  // Coverage controlled by uniform (0 = clear sky, 1 = overcast)
  let coverage = scene.fogParams.w;
  let threshold = 1.0 - coverage;              // high threshold = sparse
  shape = remap01(shape, threshold, threshold + 0.35);
  var density = shape * hGrad;

  if (density < 0.01) { return 0.0; }

  // Detail erosion breaks up solid blobs
  if (!cheap) {
    let dp = (worldPos + wind * 0.3) * 0.008;
    let detail = snoise3d(dp)          * 0.5
               + snoise3d(dp * 2.37)   * 0.3
               + snoise3d(dp * 5.09)   * 0.2;
    density -= detail * scene.cloudParams.w;
    density = max(density, 0.0);
  }

  return density;
}

fn raymarchClouds(rayOrigin: vec3<f32>, rayDir: vec3<f32>, sunDir: vec3<f32>, sunColor: vec3<f32>, time: f32) -> vec4<f32> {
  if (rayDir.y <= 0.002) {
    return vec4<f32>(0.0);
  }

  let tMin = (CLOUD_MIN_Y - rayOrigin.y) / rayDir.y;
  let tMax = (CLOUD_MAX_Y - rayOrigin.y) / rayDir.y;

  if (tMin > tMax || tMax < 0.0) {
    return vec4<f32>(0.0);
  }

  let tStart = max(tMin, 0.0);
  let tEnd = min(tMax, 8000.0);
  let stepSize = (tEnd - tStart) / f32(CLOUD_STEPS);

  let cosTheta = dot(rayDir, sunDir);
  let silverLining = pow(clamp(cosTheta, 0.0, 1.0), 5.0);

  var transmittance = 1.0;
  var scatteredLight = vec3<f32>(0.0);
  let lightStepSize = 35.0;

  // Cloud palette — shadow matches sky, lit matches sunlight
  let shadowColor = vec3<f32>(0.55, 0.65, 0.85);
  let litColor = sunColor * 0.95 + vec3<f32>(0.05);

  for (var i = 0u; i < CLOUD_STEPS; i++) {
    let t = tStart + (f32(i) + 0.5) * stepSize;
    let pos = rayOrigin + rayDir * t;

    let density = sampleCloudDensity(pos, time, false);
    if (density < 0.01) { continue; }

    let extinction = density * scene.cloudParams.y;

    // Light march toward sun
    var lightOD = 0.0;
    for (var j = 1u; j <= CLOUD_LIGHT_STEPS; j++) {
      let lPos = pos + sunDir * lightStepSize * f32(j);
      lightOD += sampleCloudDensity(lPos, time, true) * lightStepSize;
    }

    // Beer-Lambert with gentle absorption
    let beer = exp(-lightOD * 0.15);

    // Multi-scatter floor: deep cloud interiors stay bright
    let msFloor = scene.cloudParams.z;
    let brightness = beer * (1.0 - msFloor) + msFloor;

    // Warm sunlit ↔ cool sky-blue shadow
    var cloudColor = mix(shadowColor, litColor, beer) * brightness;

    // Silver lining: bright sun-colored rim on backlit edges
    cloudColor += sunColor * silverLining * beer * 0.5;

    let sampleTrans = exp(-extinction * stepSize);

    // Energy-conserving integration
    let sampleScatter = cloudColor * density;
    scatteredLight += transmittance * sampleScatter * (1.0 - sampleTrans) / max(extinction, 0.0001);
    transmittance *= sampleTrans;

    if (transmittance < 0.01) { break; }
  }

  // Aerial perspective — distant clouds fade toward sky
  let avgDist = (tStart + tEnd) * 0.5;
  let aerialFade = exp(-avgDist * 0.0001);
  let alpha = (1.0 - transmittance) * aerialFade;

  return vec4<f32>(scatteredLight, alpha);
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  // Only render where depth == 1.0 (sky pixels)
  let pixelCoord = vec2<i32>(input.position.xy);
  let depth = textureLoad(gDepth, pixelCoord, 0);
  if (depth < 1.0) {
    discard;
  }

  // Reconstruct ray direction
  let ndc = vec4<f32>(
    input.screenUV.x * 2.0 - 1.0,
    -(input.screenUV.y * 2.0 - 1.0),
    1.0,
    1.0
  );
  let worldH = scene.invViewProj * ndc;
  let rayDir = normalize(worldH.xyz / worldH.w - scene.cameraPos.xyz);

  let sunDir = normalize(scene.sunDir.xyz);
  let up = rayDir.y;
  let cosTheta = dot(rayDir, sunDir);
  let sunHeight = sunDir.y;
  let timeOfDay = scene.fogParams.z;

  // True sun height from timeOfDay (immune to CPU sunDir negation at night)
  let trueSunHeight = sin((timeOfDay - 0.25) * 2.0 * PI);
  let dayFactor = smoothstep(-0.15, 0.1, trueSunHeight);
  let nightFactor = 1.0 - dayFactor;

  // === Rayleigh scattering ===
  let rayleighCoeff = vec3<f32>(5.5e-6, 13.0e-6, 22.4e-6); // wavelength-dependent
  let rayleigh = rayleighPhase(cosTheta);

  // Optical depth approximation (simplified single-scatter)
  let altitude = max(up, 0.0);
  let opticalDepth = exp(-altitude * 4.0);

  let rayleighColor = vec3<f32>(0.3, 0.55, 0.95) * rayleigh * opticalDepth;

  // === Mie scattering (sun halo) ===
  let mie = hgPhase(cosTheta, 0.76);
  let mieColor = vec3<f32>(1.0, 0.95, 0.85) * mie * 0.02;

  // === Day sky ===
  let zenithColor = vec3<f32>(0.22, 0.40, 0.85);
  let horizonColor = vec3<f32>(0.60, 0.75, 0.92);

  var skyColor: vec3<f32>;
  if (up > 0.0) {
    let t = pow(up, 0.45);
    skyColor = mix(horizonColor, zenithColor, t);
  } else {
    let groundColor = vec3<f32>(0.55, 0.62, 0.70);
    let t = pow(-up, 0.7);
    skyColor = mix(horizonColor, groundColor, t);
  }

  // Add atmospheric scattering
  skyColor += rayleighColor * 0.8 + mieColor;

  // === Horizon warming (sunset/sunrise tint) ===
  let sunsetFactor = 1.0 - clamp(abs(trueSunHeight) * 3.0, 0.0, 1.0);
  let horizonWarm = vec3<f32>(1.2, 0.5, 0.15) * sunsetFactor * max(cosTheta, 0.0) * 0.5;
  let horizonBand = exp(-abs(up) * 8.0);
  skyColor += horizonWarm * horizonBand;

  // Dim day sky toward night
  skyColor *= dayFactor;

  // === Voxel Sun (square) ===
  // Project ray onto sun-local tangent plane for square shape
  let sunRight = normalize(cross(sunDir, vec3<f32>(0.0, 1.0, 0.001)));
  let sunUp = normalize(cross(sunRight, sunDir));
  let sunLocalX = dot(rayDir - sunDir * cosTheta, sunRight);
  let sunLocalY = dot(rayDir - sunDir * cosTheta, sunUp);
  let sunDist = max(abs(sunLocalX), abs(sunLocalY)); // Chebyshev → square
  let sunSize = 0.038;

  if (sunDist < sunSize && cosTheta > 0.9 && dayFactor > 0.01) {
    let edge = smoothstep(sunSize, sunSize * 0.85, sunDist);
    let sunDiscColor = vec3<f32>(10.0, 8.0, 5.0) * dayFactor;
    skyColor = mix(skyColor, sunDiscColor, edge);
  }

  // Sun glow (round, soft)
  let glowRadius = 0.97;
  if (cosTheta > glowRadius && dayFactor > 0.01) {
    let t = (cosTheta - glowRadius) / (1.0 - glowRadius);
    let glowStr = t * t * 0.6 * max(trueSunHeight + 0.1, 0.0);
    let glowColor = mix(vec3<f32>(1.2, 0.6, 0.2), vec3<f32>(1.5, 1.3, 0.9), clamp(sunHeight * 3.0, 0.0, 1.0));
    skyColor += glowColor * glowStr;
  }

  // === Volumetric clouds ===
  let elapsedTime = scene.sunDir.w;  // accumulated seconds
  let cloud = raymarchClouds(scene.cameraPos.xyz, rayDir, sunDir, scene.sunColor.xyz, elapsedTime);
  let cloudBrightness = max(dayFactor, 0.03);
  skyColor = mix(skyColor, cloud.rgb * cloudBrightness, cloud.a);

  // === Night sky (additive — base sky already dimmed by dayFactor) ===
  if (nightFactor > 0.01) {
    // Dark blue base
    skyColor += vec3f(0.005, 0.007, 0.02) * nightFactor;

    // Stars
    if (up > 0.0) {
      let starCoord = floor(rayDir.xz / max(up, 0.01) * 200.0);
      let starHash = hash(starCoord);
      if (starHash > 0.985) {
        let brightness = (starHash - 0.985) / 0.015;
        let twinkle = sin(timeOfDay * 6.28 * 50.0 + starHash * 100.0) * 0.3 + 0.7;
        skyColor += vec3f(brightness * twinkle * 2.0) * nightFactor;
      }
    }

    // Voxel Moon (sunDir = moon direction at night, CPU already negated)
    let moonDir = sunDir;
    let moonDot = dot(rayDir, moonDir);
    let moonRight = normalize(cross(moonDir, vec3<f32>(0.0, 1.0, 0.001)));
    let moonUp = normalize(cross(moonRight, moonDir));
    let moonLocalX = dot(rayDir - moonDir * moonDot, moonRight);
    let moonLocalY = dot(rayDir - moonDir * moonDot, moonUp);
    let moonDist = max(abs(moonLocalX), abs(moonLocalY));
    let moonSize = 0.030;

    if (moonDist < moonSize && moonDot > 0.9) {
      let edge = smoothstep(moonSize, moonSize * 0.85, moonDist);
      let moonColor = vec3<f32>(0.8, 0.85, 1.0);
      skyColor += moonColor * edge * 2.0 * nightFactor;
    }

    // Moon glow (round, soft)
    if (moonDot > 0.995) {
      let t = (moonDot - 0.995) / 0.005;
      skyColor += vec3<f32>(0.1, 0.12, 0.2) * t * t * nightFactor;
    }
  }

  return vec4<f32>(skyColor, 1.0);
}
