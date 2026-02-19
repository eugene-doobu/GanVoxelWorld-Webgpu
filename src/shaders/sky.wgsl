// Atmospheric scattering sky with day-night cycle
// Uses the same SceneUniforms as lighting.wgsl

struct SceneUniforms {
  invViewProj: mat4x4<f32>,
  cameraPos: vec4<f32>,
  sunDir: vec4<f32>,
  sunColor: vec4<f32>,
  ambientColor: vec4<f32>,
  fogParams: vec4<f32>,       // z = timeOfDay
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

// === Volumetric cloud functions ===
const CLOUD_MIN_Y: f32 = 200.0;
const CLOUD_MAX_Y: f32 = 350.0;
const CLOUD_STEPS: u32 = 16u;

fn hash3d(p: vec3<f32>) -> f32 {
  var p3 = fract(p * vec3<f32>(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yxz + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

fn cloudNoise(p: vec3<f32>) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(mix(hash3d(i), hash3d(i + vec3<f32>(1.0, 0.0, 0.0)), u.x),
        mix(hash3d(i + vec3<f32>(0.0, 1.0, 0.0)), hash3d(i + vec3<f32>(1.0, 1.0, 0.0)), u.x), u.y),
    mix(mix(hash3d(i + vec3<f32>(0.0, 0.0, 1.0)), hash3d(i + vec3<f32>(1.0, 0.0, 1.0)), u.x),
        mix(hash3d(i + vec3<f32>(0.0, 1.0, 1.0)), hash3d(i + vec3<f32>(1.0, 1.0, 1.0)), u.x), u.y),
    u.z
  );
}

fn fbmCloud(p: vec3<f32>) -> f32 {
  var val = 0.0;
  var amp = 0.5;
  var pos = p;
  for (var i = 0; i < 4; i++) {
    val += amp * cloudNoise(pos);
    pos *= 2.0;
    amp *= 0.5;
  }
  return val;
}

fn sampleCloudDensity(worldPos: vec3<f32>, time: f32) -> f32 {
  let windOffset = vec3<f32>(time * 5.0, 0.0, time * 2.0);
  let p = (worldPos + windOffset) * 0.005;

  let noise = fbmCloud(p);
  let density = smoothstep(0.4, 0.7, noise);

  let heightFraction = (worldPos.y - CLOUD_MIN_Y) / (CLOUD_MAX_Y - CLOUD_MIN_Y);
  let heightFade = smoothstep(0.0, 0.2, heightFraction) * smoothstep(1.0, 0.8, heightFraction);

  return density * heightFade;
}

fn raymarchClouds(rayOrigin: vec3<f32>, rayDir: vec3<f32>, sunDir: vec3<f32>, sunColor: vec3<f32>, time: f32) -> vec4<f32> {
  if (rayDir.y <= 0.001) {
    return vec4<f32>(0.0);
  }

  let tMin = (CLOUD_MIN_Y - rayOrigin.y) / rayDir.y;
  let tMax = (CLOUD_MAX_Y - rayOrigin.y) / rayDir.y;

  if (tMin > tMax || tMax < 0.0) {
    return vec4<f32>(0.0);
  }

  let tStart = max(tMin, 0.0);
  let tEnd = min(tMax, 5000.0);
  let stepSize = (tEnd - tStart) / f32(CLOUD_STEPS);

  var transmittance = 1.0;
  var lightEnergy = 0.0;

  for (var i = 0u; i < CLOUD_STEPS; i++) {
    let t = tStart + (f32(i) + 0.5) * stepSize;
    let pos = rayOrigin + rayDir * t;

    let density = sampleCloudDensity(pos, time);
    if (density < 0.01) {
      continue;
    }

    let extinction = density * 0.8;
    let sampleTransmittance = exp(-extinction * stepSize);

    // Sun-direction light marching (3 steps)
    var lightDensity = 0.0;
    let lightStep = 30.0;
    for (var j = 1u; j <= 3u; j++) {
      let lightPos = pos + sunDir * lightStep * f32(j);
      lightDensity += sampleCloudDensity(lightPos, time);
    }
    let lightTransmittance = exp(-lightDensity * 0.5);

    lightEnergy += density * transmittance * lightTransmittance * stepSize;
    transmittance *= sampleTransmittance;

    if (transmittance < 0.01) {
      break;
    }
  }

  let cloudColor = sunColor * lightEnergy * 0.15 + vec3<f32>(0.7, 0.75, 0.8) * lightEnergy * 0.05;
  let alpha = 1.0 - transmittance;

  return vec4<f32>(cloudColor, alpha);
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
  let sunsetFactor = 1.0 - clamp(abs(sunHeight) * 3.0, 0.0, 1.0);
  let horizonWarm = vec3<f32>(1.2, 0.5, 0.15) * sunsetFactor * max(cosTheta, 0.0) * 0.5;
  let horizonBand = exp(-abs(up) * 8.0);
  skyColor += horizonWarm * horizonBand;

  // === Voxel Sun (square) ===
  // Project ray onto sun-local tangent plane for square shape
  let sunRight = normalize(cross(sunDir, vec3<f32>(0.0, 1.0, 0.001)));
  let sunUp = normalize(cross(sunRight, sunDir));
  let sunLocalX = dot(rayDir - sunDir * cosTheta, sunRight);
  let sunLocalY = dot(rayDir - sunDir * cosTheta, sunUp);
  let sunDist = max(abs(sunLocalX), abs(sunLocalY)); // Chebyshev → square
  let sunSize = 0.038;

  if (sunDist < sunSize && cosTheta > 0.9 && sunHeight > -0.05) {
    let edge = smoothstep(sunSize, sunSize * 0.85, sunDist);
    let sunDiscColor = vec3<f32>(10.0, 8.0, 5.0); // HDR sun
    skyColor = mix(skyColor, sunDiscColor, edge);
  }

  // Sun glow (round, soft)
  let glowRadius = 0.97;
  if (cosTheta > glowRadius && sunHeight > -0.05) {
    let t = (cosTheta - glowRadius) / (1.0 - glowRadius);
    let glowStr = t * t * 0.6 * max(sunHeight + 0.1, 0.0);
    let glowColor = mix(vec3<f32>(1.2, 0.6, 0.2), vec3<f32>(1.5, 1.3, 0.9), clamp(sunHeight * 3.0, 0.0, 1.0));
    skyColor += glowColor * glowStr;
  }

  // === Volumetric clouds ===
  let cloud = raymarchClouds(scene.cameraPos.xyz, rayDir, sunDir, scene.sunColor.xyz, timeOfDay);
  skyColor = mix(skyColor, cloud.rgb, cloud.a);

  // === Night sky ===
  let nightFactor = clamp(-sunHeight * 4.0 - 0.2, 0.0, 1.0);
  if (nightFactor > 0.0) {
    var nightSky = vec3<f32>(0.005, 0.007, 0.02);

    // Stars
    if (up > 0.0) {
      let starCoord = floor(rayDir.xz / max(up, 0.01) * 200.0);
      let starHash = hash(starCoord);
      if (starHash > 0.985) {
        let brightness = (starHash - 0.985) / 0.015;
        let twinkle = sin(timeOfDay * 6.28 * 50.0 + starHash * 100.0) * 0.3 + 0.7;
        nightSky += vec3<f32>(brightness * twinkle * 2.0);
      }
    }

    // Voxel Moon (square, opposite to sun)
    let moonDir = -sunDir;
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
      nightSky += moonColor * edge * 2.0;
    }

    // Moon glow (round, soft)
    if (moonDot > 0.995) {
      let t = (moonDot - 0.995) / 0.005;
      nightSky += vec3<f32>(0.1, 0.12, 0.2) * t * t;
    }

    skyColor = mix(skyColor, nightSky, nightFactor);
  }

  return vec4<f32>(skyColor, 1.0);
}
