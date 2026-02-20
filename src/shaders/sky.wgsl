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
  skyNightParams: vec4<f32>,       // x=moonPhase, y=moonBrightness, z=elapsedTime, w=reserved
};

@group(0) @binding(0) var<uniform> scene: SceneUniforms;
@group(0) @binding(1) var gDepth: texture_depth_2d;

const PI: f32 = 3.14159265359;
const AURORA_SPEED: f32 = 0.03;

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

// hash returning vec2 for star field randomization
fn hash2(p: vec2<f32>) -> vec2<f32> {
  var p3 = fract(vec3<f32>(p.x, p.y, p.x) * vec3<f32>(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract(vec2<f32>((p3.x + p3.y) * p3.z, (p3.x + p3.z) * p3.y));
}

// Star color temperature (spectral type)
fn starColor(h: f32) -> vec3<f32> {
  if (h < 0.15) { return vec3<f32>(0.7, 0.8, 1.0); }       // blue-white (B/A)
  else if (h < 0.60) { return vec3<f32>(1.0, 1.0, 0.95); }  // white (F/G)
  else if (h < 0.85) { return vec3<f32>(1.0, 0.9, 0.7); }   // yellow-white (G/K)
  else { return vec3<f32>(1.0, 0.75, 0.5); }                 // orange (K/M)
}

// Multi-layer star field with color temperature and twinkling
fn sampleStarField(rayDir: vec3<f32>, elapsedTime: f32) -> vec3<f32> {
  // Spherical coordinates for uniform distribution
  let theta = atan2(rayDir.z, rayDir.x); // azimuth
  let phi = asin(clamp(rayDir.y, -1.0, 1.0));   // elevation
  let starTime = elapsedTime % 628.318; // wrap to avoid sin() precision loss

  var stars = vec3<f32>(0.0);

  // Layer 1: bright stars (large cells, ~3% density)
  let scale1 = 80.0;
  let uv1 = vec2<f32>(theta * scale1 / PI, phi * scale1 / (PI * 0.5));
  let cell1 = floor(uv1);
  let h1 = hash2(cell1);
  let offset1 = h1 - 0.5; // random offset within cell
  let cellCenter1 = cell1 + 0.5 + offset1 * 0.8;
  let dist1 = length(uv1 - cellCenter1);
  let brightness1 = hash(cell1 + vec2<f32>(7.31, 3.17));
  if (brightness1 > 0.97) {
    let falloff1 = exp(-dist1 * dist1 * 80.0);
    let colorHash1 = hash(cell1 + vec2<f32>(13.7, 29.3));
    let col1 = starColor(colorHash1);
    let twinkle1 = sin(starTime * 1.5 + brightness1 * 100.0) * 0.3 + 0.7;
    let intensity1 = (brightness1 - 0.97) / 0.03 * 2.5;
    stars += col1 * falloff1 * twinkle1 * intensity1;
  }

  // Layer 2: dim stars (small cells, ~1.5% density)
  let scale2 = 250.0;
  let uv2 = vec2<f32>(theta * scale2 / PI, phi * scale2 / (PI * 0.5));
  let cell2 = floor(uv2);
  let h2 = hash2(cell2);
  let offset2 = h2 - 0.5;
  let cellCenter2 = cell2 + 0.5 + offset2 * 0.8;
  let dist2 = length(uv2 - cellCenter2);
  let brightness2 = hash(cell2 + vec2<f32>(11.13, 5.71));
  if (brightness2 > 0.985) {
    let falloff2 = exp(-dist2 * dist2 * 120.0);
    let colorHash2 = hash(cell2 + vec2<f32>(17.1, 23.9));
    let col2 = starColor(colorHash2);
    let twinkle2 = sin(starTime * 2.3 + brightness2 * 77.0) * 0.25 + 0.75;
    let intensity2 = (brightness2 - 0.985) / 0.015 * 1.2;
    stars += col2 * falloff2 * twinkle2 * intensity2;
  }

  return stars;
}

// === Night Nebula / Milky Way (3-layer FBM Simplex) ===
fn sampleNebula(rayDir: vec3<f32>, time: f32) -> vec3<f32> {
  if (rayDir.y < 0.05) { return vec3<f32>(0.0); }

  // Galactic plane: tilted band across the sky (Milky Way-like)
  let galacticNormal = normalize(vec3<f32>(0.35, 0.7, 0.55));
  let galacticDist = abs(dot(rayDir, galacticNormal));
  let bandMask = smoothstep(0.55, 0.15, galacticDist);
  if (bandMask < 0.01) { return vec3<f32>(0.0); }

  // Use ray direction as 3D noise coordinate (seamless on sphere)
  let coord = rayDir * 3.0;
  let t = time * 0.004;

  // Layer 1: Deep blue-violet (dominant nebula mass)
  let p1 = coord + vec3<f32>(0.0, 0.0, t);
  var n1 = snoise3d(p1)         * 0.5
         + snoise3d(p1 * 2.03)  * 0.25
         + snoise3d(p1 * 4.01)  * 0.125
         + snoise3d(p1 * 8.05)  * 0.0625;
  n1 = smoothstep(0.38, 0.65, n1);

  // Layer 2: Warm emission pockets (amber/orange)
  let p2 = coord * 1.3 + vec3<f32>(43.0, 17.0, t * 0.7);
  var n2 = snoise3d(p2)         * 0.5
         + snoise3d(p2 * 1.97)  * 0.25
         + snoise3d(p2 * 3.89)  * 0.125
         + snoise3d(p2 * 7.83)  * 0.0625;
  n2 = smoothstep(0.42, 0.7, n2);

  // Layer 3: Bright blue-white core (star-forming regions, finer detail)
  let p3 = coord * 0.8 + vec3<f32>(91.0, 53.0, t * 0.5);
  var n3 = snoise3d(p3)         * 0.5
         + snoise3d(p3 * 2.11)  * 0.25
         + snoise3d(p3 * 4.27)  * 0.125
         + snoise3d(p3 * 8.53)  * 0.0625
         + snoise3d(p3 * 17.1)  * 0.03125;
  n3 = smoothstep(0.4, 0.68, n3);

  // Color composition
  let col1 = vec3<f32>(0.06, 0.03, 0.14) * n1;  // blue-violet
  let col2 = vec3<f32>(0.10, 0.05, 0.02) * n2;  // warm amber
  let col3 = vec3<f32>(0.05, 0.06, 0.10) * n3;  // blue-white

  // Horizon atmospheric extinction
  let horizFade = smoothstep(0.05, 0.25, rayDir.y);

  return (col1 + col2 + col3) * bandMask * horizFade;
}

// Night sky gradient (zenith to horizon)
fn nightSkyGradient(up: f32) -> vec3<f32> {
  let zenith = vec3<f32>(0.003, 0.005, 0.018);
  let horizon = vec3<f32>(0.012, 0.015, 0.028);
  return mix(horizon, zenith, pow(max(up, 0.0), 0.5));
}

// Moon phase terminator mask
fn moonPhaseMask(localX: f32, localY: f32, moonPhase: f32) -> f32 {
  let r2 = localX * localX + localY * localY;
  let r = sqrt(r2);
  if (r > 1.0) { return 0.0; }

  // Terminator position: cos(phase * 2PI) maps phase to shadow edge
  let terminatorX = cos(moonPhase * 2.0 * PI);

  var lit: f32;
  if (moonPhase < 0.5) {
    // Waxing: right side lights up first (localX > terminatorX)
    lit = smoothstep(terminatorX - 0.1, terminatorX + 0.1, localX);
  } else {
    // Waning: right side goes dark (localX < terminatorX)
    lit = smoothstep(terminatorX + 0.1, terminatorX - 0.1, localX);
  }

  // Limb darkening
  let limbDark = 1.0 - r2 * 0.3;

  return lit * limbDark;
}

// Multi-layer moon glow
fn moonGlow(moonDot: f32, moonBrightness: f32) -> vec3<f32> {
  var glow = vec3<f32>(0.0);

  // Inner glow (close to moon disc)
  if (moonDot > 0.998) {
    let t = (moonDot - 0.998) / 0.002;
    glow += vec3<f32>(0.15, 0.17, 0.25) * t * t * moonBrightness;
  }

  // Mid halo (Mie scattering)
  if (moonDot > 0.990) {
    let t = (moonDot - 0.990) / 0.010;
    glow += vec3<f32>(0.06, 0.07, 0.12) * t * t * moonBrightness;
  }

  // Outer atmospheric glow (wide, faint)
  if (moonDot > 0.970) {
    let t = (moonDot - 0.970) / 0.030;
    glow += vec3<f32>(0.015, 0.018, 0.035) * t * moonBrightness;
  }

  return glow;
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

// === Aurora Borealis (curtain style) ===
// Physical model: aurora is a thin vertical SHEET hanging in the sky.
// Bright where you look along the sheet edge-on (fold lines),
// dim where you look through it face-on.
// Ray-march vertical extrusion → fold lines become hanging curtain drapes.

fn sampleAurora(rayDir: vec3<f32>, cameraPos: vec3<f32>, time: f32) -> vec4<f32> {
  let up = rayDir.y;
  if (up < 0.1) { return vec4<f32>(0.0); }

  // Elevation mask — visible between ~10° and ~55°
  let elevMask = smoothstep(0.1, 0.25, up) * smoothstep(0.85, 0.5, up);
  if (elevMask < 0.01) { return vec4<f32>(0.0); }

  let t = time * AURORA_SPEED;
  var col = vec3<f32>(0.0);
  var totalAlpha = 0.0;

  for (var i = 0u; i < 16u; i++) {
    let fi = f32(i);
    let layerT = fi / 15.0;

    // Ray-plane intersection — each step = a horizontal slice of the curtain
    let height = 0.8 + fi * 0.04;
    let pt = height / (up * 2.0 + 0.4);

    // Project ray onto horizontal plane → planeUV.x = depth, planeUV.y = lateral
    let planeUV = vec2<f32>(rayDir.z, rayDir.x) * pt + cameraPos.xz * 0.00005;

    // === Curtain structure: 1D fold pattern along Y, draped by X ===

    // Drape warp: the fold position shifts along X (depth) → draped hanging shape
    let drape = snoise3d(vec3<f32>(planeUV.x * 0.12, planeUV.y * 0.06, t * 0.2));
    // Large-scale sway: entire curtain swings gently over time
    let sway = snoise3d(vec3<f32>(planeUV.y * 0.04 + 20.0, 0.0, t * 0.15));
    let warpedY = planeUV.y + (drape - 0.5) * 4.0 + (sway - 0.5) * 5.0;

    // Fold noise: primarily 1D along lateral axis (Y)
    // Very weak X dependency → folds are tall, continuous vertical lines
    let n1 = snoise3d(vec3<f32>(planeUV.x * 0.02, warpedY * 0.5, t * 0.5 + fi * 0.06));
    let n2 = snoise3d(vec3<f32>(planeUV.x * 0.04 + 50.0, warpedY * 1.1, t * 0.8));
    var val = n1 * 0.6 + n2 * 0.4;

    // Fold ridges: bright where noise ≈ 0.5 → visible curtain fold lines
    val = max(1.0 - 1.5 * abs(val - 0.5), 0.0);
    val *= val;

    if (val < 0.005) { continue; }

    // Color: bright green-cyan at bottom → purple-magenta at top
    let green  = vec3<f32>(0.15, 1.3, 0.4);
    let purple = vec3<f32>(0.45, 0.12, 0.55);
    let layerColor = mix(green, purple, smoothstep(0.1, 0.9, layerT));

    // Accumulate — brighter layers near top, fade-in at start
    let weight = exp2(-fi * 0.1 - 1.8) * smoothstep(0.0, 3.0, fi);
    col += layerColor * val * weight;
    totalAlpha += val * weight;
  }

  // Bottom edge brighter (curtain hem glow)
  let bottomGlow = smoothstep(0.4, 0.15, up) * 0.4 + 1.0;
  col *= elevMask * bottomGlow;
  totalAlpha = clamp(totalAlpha * 3.0, 0.0, 1.0) * elevMask;

  return vec4<f32>(col, totalAlpha);
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

fn raymarchClouds(rayOrigin: vec3<f32>, rayDir: vec3<f32>, sunDir: vec3<f32>, sunColor: vec3<f32>, time: f32, dayFactor: f32) -> vec4<f32> {
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

  // Day palette: warm sunlight ↔ sky-blue shadow
  let dayShadow = vec3<f32>(0.55, 0.65, 0.85);
  let dayLit = sunColor * 0.95 + vec3<f32>(0.05);

  // Night palette: near-black shadow ↔ dim silver-blue moonlight
  let nightShadow = vec3<f32>(0.01, 0.012, 0.025);
  let nightLit = vec3<f32>(0.08, 0.1, 0.18);

  // Blend palettes by dayFactor
  let shadowColor = mix(nightShadow, dayShadow, dayFactor);
  let litColor = mix(nightLit, dayLit, dayFactor);
  let silverStr = mix(0.15, 0.5, dayFactor);

  for (var i = 0u; i < CLOUD_STEPS; i++) {
    let t = tStart + (f32(i) + 0.5) * stepSize;
    let pos = rayOrigin + rayDir * t;

    let density = sampleCloudDensity(pos, time, false);
    if (density < 0.01) { continue; }

    let extinction = density * scene.cloudParams.y;

    // Light march toward sun (or moon at night)
    var lightOD = 0.0;
    for (var j = 1u; j <= CLOUD_LIGHT_STEPS; j++) {
      let lPos = pos + sunDir * lightStepSize * f32(j);
      lightOD += sampleCloudDensity(lPos, time, true) * lightStepSize;
    }

    // Beer-Lambert with gentle absorption
    let beer = exp(-lightOD * 0.15);

    // Multi-scatter floor
    let msFloor = scene.cloudParams.z;
    let brightness = beer * (1.0 - msFloor) + msFloor;

    // Lit ↔ shadow blend + silver lining
    var cloudColor = mix(shadowColor, litColor, beer) * brightness;
    cloudColor += litColor * silverLining * beer * silverStr;

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
  let cloud = raymarchClouds(scene.cameraPos.xyz, rayDir, sunDir, scene.sunColor.xyz, elapsedTime, dayFactor);
  skyColor = mix(skyColor, cloud.rgb, cloud.a);

  // === SEUS-style night sky (additive — base sky already dimmed by dayFactor) ===
  if (nightFactor > 0.01) {
    // Read moon phase uniforms
    let moonPhase = scene.skyNightParams.x;
    let moonBright = scene.skyNightParams.y;
    let starTime = scene.skyNightParams.z;

    // Night sky gradient (zenith dark → horizon atmospheric glow)
    skyColor += nightSkyGradient(up) * nightFactor;

    // Horizon atmospheric glow (subtle warm band at horizon)
    let horizAtmo = exp(-abs(up) * 6.0);
    skyColor += vec3<f32>(0.008, 0.010, 0.020) * horizAtmo * nightFactor;

    // Night nebula / Milky Way band
    if (up > 0.05) {
      var nebulaColor = sampleNebula(rayDir, starTime);
      // Moonlight washes out faint nebula
      nebulaColor *= 1.0 - 0.3 * moonBright;
      skyColor += nebulaColor * nightFactor;
    }

    // Multi-layer star field
    if (up > 0.0) {
      var starFieldColor = sampleStarField(rayDir, starTime);
      // Atmospheric extinction near horizon
      let horizFade = smoothstep(0.0, 0.15, up);
      starFieldColor *= horizFade;
      // Moonlight dims stars (bright moon → 40% reduction)
      starFieldColor *= 1.0 - 0.4 * moonBright;
      skyColor += starFieldColor * nightFactor;
    }

    // === Aurora Borealis ===
    if (up > 0.1) {
      let aurora = sampleAurora(rayDir, scene.cameraPos.xyz, starTime);
      if (aurora.a > 0.001) {
        let auroraIntensity = nightFactor * (1.0 - 0.2 * moonBright);
        let auroraColor = aurora.rgb * auroraIntensity;
        // Soft additive blend — aurora glows over stars without harsh replacement
        skyColor += auroraColor * aurora.a;
      }
    }

    // Voxel Moon with phase mask (sunDir = moon direction at night, CPU already negated)
    let moonDir = sunDir;
    let moonDot2 = dot(rayDir, moonDir);
    let moonRight = normalize(cross(moonDir, vec3<f32>(0.0, 1.0, 0.001)));
    let moonUpDir = normalize(cross(moonRight, moonDir));
    let moonLocalX = dot(rayDir - moonDir * moonDot2, moonRight);
    let moonLocalY = dot(rayDir - moonDir * moonDot2, moonUpDir);
    let moonDist = max(abs(moonLocalX), abs(moonLocalY)); // square shape
    let moonSize = 0.030;

    if (moonDist < moonSize && moonDot2 > 0.9) {
      let edge = smoothstep(moonSize, moonSize * 0.85, moonDist);
      // Normalized coordinates for phase mask (-1 to 1)
      let normX = moonLocalX / moonSize;
      let normY = moonLocalY / moonSize;
      let phaseMask = moonPhaseMask(normX, normY, moonPhase);
      // Lit face: bright moonlight color
      let litColor = vec3<f32>(0.8, 0.85, 1.0) * phaseMask * 2.0;
      // Earthshine on shadow face: very faint
      let earthshine = vec3<f32>(0.04, 0.045, 0.06) * (1.0 - phaseMask);
      skyColor += (litColor + earthshine) * edge * nightFactor;
    }

    // Multi-layer moon glow (wider and phase-dependent)
    skyColor += moonGlow(moonDot2, moonBright) * nightFactor;
  }

  return vec4<f32>(skyColor, 1.0);
}
