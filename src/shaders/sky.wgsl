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

#include "common/fullscreen_vert.wgsl"
#include "common/phase_functions.wgsl"

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

// Multi-frequency star scintillation (Kolmogorov spectrum approximation)
fn starTwinkle(starTime: f32, phase: f32, elevation: f32) -> f32 {
  // 4 frequency summation
  var t = sin(starTime * 1.7 + phase) * 0.35;
  t += sin(starTime * 4.3 + phase * 2.1) * 0.2;
  t += sin(starTime * 7.1 + phase * 3.7) * 0.12;
  t += sin(starTime * 13.0 + phase * 5.3) * 0.08;
  // Near-horizon: more twinkling (thicker atmosphere)
  let elevFactor = mix(1.5, 0.5, smoothstep(0.0, 0.5, elevation));
  return clamp(0.75 + t * elevFactor, 0.3, 1.4);
}

// Multi-layer star field with color temperature and twinkling
fn sampleStarField(rayDir: vec3<f32>, elapsedTime: f32) -> vec3<f32> {
  // Spherical coordinates for uniform distribution
  let theta = atan2(rayDir.z, rayDir.x); // azimuth
  let phi = asin(clamp(rayDir.y, -1.0, 1.0));   // elevation
  let starTime = elapsedTime % 628.318; // wrap to avoid sin() precision loss
  let elevation = max(rayDir.y, 0.0);

  var stars = vec3<f32>(0.0);

  // Layer 1: bright stars (large cells, ~6% density)
  let scale1 = 70.0;
  let uv1 = vec2<f32>(theta * scale1 / PI, phi * scale1 / (PI * 0.5));
  let cell1 = floor(uv1);
  let h1 = hash2(cell1);
  let offset1 = h1 - 0.5; // random offset within cell
  let cellCenter1 = cell1 + 0.5 + offset1 * 0.8;
  let dist1 = length(uv1 - cellCenter1);
  let brightness1 = hash(cell1 + vec2<f32>(7.31, 3.17));
  if (brightness1 > 0.94) {
    let falloff1 = exp(-dist1 * dist1 * 80.0);
    let colorHash1 = hash(cell1 + vec2<f32>(13.7, 29.3));
    let col1 = starColor(colorHash1);
    let twinkle1 = starTwinkle(starTime, brightness1 * 100.0, elevation);
    let intensity1 = (brightness1 - 0.94) / 0.06 * 2.5;
    stars += col1 * falloff1 * twinkle1 * intensity1;
  }

  // Layer 2: medium stars (medium cells, ~3% density)
  let scale2 = 200.0;
  let uv2 = vec2<f32>(theta * scale2 / PI, phi * scale2 / (PI * 0.5));
  let cell2 = floor(uv2);
  let h2 = hash2(cell2);
  let offset2 = h2 - 0.5;
  let cellCenter2 = cell2 + 0.5 + offset2 * 0.8;
  let dist2 = length(uv2 - cellCenter2);
  let brightness2 = hash(cell2 + vec2<f32>(11.13, 5.71));
  if (brightness2 > 0.97) {
    let falloff2 = exp(-dist2 * dist2 * 120.0);
    let colorHash2 = hash(cell2 + vec2<f32>(17.1, 23.9));
    let col2 = starColor(colorHash2);
    let twinkle2 = starTwinkle(starTime, brightness2 * 77.0, elevation);
    let intensity2 = (brightness2 - 0.97) / 0.03 * 1.2;
    stars += col2 * falloff2 * twinkle2 * intensity2;
  }

  // Layer 3: star dust (fine cells, ~4% density, no twinkling)
  let scale3 = 500.0;
  let uv3 = vec2<f32>(theta * scale3 / PI, phi * scale3 / (PI * 0.5));
  let cell3 = floor(uv3);
  let h3 = hash2(cell3);
  let offset3 = h3 - 0.5;
  let cellCenter3 = cell3 + 0.5 + offset3 * 0.8;
  let dist3 = length(uv3 - cellCenter3);
  let brightness3 = hash(cell3 + vec2<f32>(19.37, 7.93));
  if (brightness3 > 0.96) {
    let falloff3 = exp(-dist3 * dist3 * 200.0);
    let intensity3 = (brightness3 - 0.96) / 0.04 * 0.3;
    stars += vec3<f32>(0.9, 0.92, 1.0) * falloff3 * intensity3;
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

// Continuous Mie-based moon glow (no discontinuities)
fn moonGlow(moonDot: f32, moonBrightness: f32) -> vec3<f32> {
  let angle = acos(clamp(moonDot, -1.0, 1.0));
  // Inner aureole (Mie forward scattering, tight peak)
  let inner = exp(-angle * angle * 8000.0) * vec3<f32>(0.20, 0.22, 0.30);
  // Corona (medium spread)
  let corona = exp(-angle * angle * 800.0) * vec3<f32>(0.08, 0.09, 0.15);
  // Wide atmospheric halo
  let halo = exp(-angle * 60.0) * vec3<f32>(0.015, 0.018, 0.035);
  return (inner + corona + halo) * moonBrightness;
}

// Deterministic meteor (shooting star) system — no state needed
fn sampleMeteor(rayDir: vec3<f32>, time: f32) -> vec3<f32> {
  var result = vec3<f32>(0.0);
  for (var i = 0u; i < 4u; i++) {
    let slot = f32(i);
    // Per-slot period: 15~25 second intervals
    let period = 18.0 + slot * 3.7;
    let phase = floor(time / period);
    let localT = fract(time / period);
    // Active window: 0.0~0.08 (~8% of period = ~1.5s visible)
    if (localT > 0.08) { continue; }
    let t = localT / 0.08; // 0→1 over lifetime

    // Start point: hash-determined on upper hemisphere
    let h = hash2(vec2<f32>(phase * 17.3 + slot * 7.1, slot * 13.7 + 0.5));
    let theta0 = h.x * 2.0 * PI;
    let phi0 = 0.3 + h.y * 0.5; // elevation 17°~46°
    let startDir = vec3<f32>(cos(theta0) * cos(phi0), sin(phi0), sin(theta0) * cos(phi0));

    // Drift direction (slightly downward)
    let h2 = hash2(vec2<f32>(phase * 31.1 + slot, slot * 23.3));
    let drift = normalize(vec3<f32>(h2.x - 0.5, -0.3, h2.y - 0.5));
    let trailLen = 0.06;
    let headPos = normalize(startDir + drift * t * 0.3);

    // Distance from ray to head
    let headDot = dot(rayDir, headPos);
    let headAngle = acos(clamp(headDot, -1.0, 1.0));

    // Tail position
    let tailPos = normalize(startDir + drift * max(t - trailLen, 0.0) * 0.3);

    // Head brightness (fade in→out)
    let brightness = smoothstep(0.0, 0.15, t) * smoothstep(1.0, 0.5, t);
    let glow = exp(-headAngle * headAngle * 15000.0) * brightness * 3.0;

    // Tail glow (wider, dimmer)
    let midPos = normalize(mix(headPos, tailPos, 0.5));
    let midDot = dot(rayDir, midPos);
    let midAngle = acos(clamp(midDot, -1.0, 1.0));
    let tailGlow = exp(-midAngle * midAngle * 5000.0) * brightness * 1.0;

    let meteorColor = vec3<f32>(0.9, 0.85, 0.7); // warm white
    result += meteorColor * (glow + tailGlow);
  }
  return result;
}

// === 3D Simplex Noise ===
#include "common/noise.wgsl"

// === Aurora Borealis (analytic curtain sheet + vertical rays) ===
// No ray-march loop. Aurora modeled as a thin luminous sheet:
// - Low-freq noise → horizontal ribbon (curtain) position
// - High-freq 1D noise → vertical ray structure
// - Altitude-based decay → bright bottom edge, upper fade
// snoise3d calls: 6 (down from 64)

fn sampleAurora(rayDir: vec3<f32>, cameraPos: vec3<f32>, time: f32) -> vec4<f32> {
  let up = rayDir.y;
  if (up < 0.05) { return vec4<f32>(0.0); }

  // Elevation envelope: ~3°~50° range
  let elevMask = smoothstep(0.05, 0.15, up) * smoothstep(0.85, 0.45, up);
  if (elevMask < 0.001) { return vec4<f32>(0.0); }

  let t = time * AURORA_SPEED;
  let azimuth = atan2(rayDir.x, rayDir.z); // [-PI, PI]

  // Curtain ribbon position (low-freq wobble)
  let curtainBaseElev = 0.32;
  let wobble1 = (snoise3d(vec3<f32>(azimuth * 0.4, t * 0.08, 0.0)) - 0.5) * 0.24;
  let wobble2 = (snoise3d(vec3<f32>(azimuth * 0.15 + 5.0, t * 0.05, 3.0)) - 0.5) * 0.12;
  let curtainCenter = curtainBaseElev + wobble1 + wobble2;
  let distToCurtain = up - curtainCenter;

  // Vertical profile: sharp cutoff below curtain, exp decay above
  let belowCutoff = smoothstep(-0.02, 0.0, distToCurtain);
  let verticalDecay = exp(-max(distToCurtain, 0.0) * 4.5);
  let verticalProfile = belowCutoff * verticalDecay;
  if (verticalProfile < 0.005) { return vec4<f32>(0.0); }

  // Curtain fold brightness modulation — edge-on is brighter
  let foldNoise = snoise3d(vec3<f32>(azimuth * 1.5, t * 0.12, 7.0));
  let foldIntensity = foldNoise * 0.7 + 0.3;  // [0.3, 1.0]

  // Vertical ray structure (high-freq 1D ridge detection)
  let rayN1 = snoise3d(vec3<f32>(azimuth * 8.0, t * 0.3, 13.0));
  let rayN2 = snoise3d(vec3<f32>(azimuth * 22.0 + 50.0, t * 0.6, 17.0));
  let ray1 = pow(max(1.0 - 2.5 * abs(rayN1 - 0.5), 0.0), 1.5);
  let ray2 = pow(max(1.0 - 3.0 * abs(rayN2 - 0.5), 0.0), 2.0);
  let rayStructure = ray1 * 0.7 + ray2 * 0.3;
  // Upper part: rays become more diffuse
  let raySharpness = mix(rayStructure, 0.5 * (rayStructure + 0.5),
                         smoothstep(0.0, 0.3, distToCurtain));

  // Temporal shimmer
  let shimmer = snoise3d(vec3<f32>(azimuth * 4.0, t * 1.2, 23.0));
  let shimmerFactor = 0.7 + shimmer * 0.3;

  // Combined intensity
  let intensity = verticalProfile * raySharpness * foldIntensity * shimmerFactor;

  // Altitude-based color (green → cyan → magenta → red)
  let heightFrac = clamp(distToCurtain / 0.35, 0.0, 1.0);
  let green   = vec3<f32>(0.2, 1.0, 0.3);
  let cyan    = vec3<f32>(0.1, 0.6, 0.4);
  let magenta = vec3<f32>(0.5, 0.1, 0.4);
  let red     = vec3<f32>(0.4, 0.05, 0.15);
  var auroraColor: vec3<f32>;
  if (heightFrac < 0.3) {
    auroraColor = mix(green, cyan, heightFrac / 0.3);
  } else if (heightFrac < 0.65) {
    auroraColor = mix(cyan, magenta, (heightFrac - 0.3) / 0.35);
  } else {
    auroraColor = mix(magenta, red, (heightFrac - 0.65) / 0.35);
  }

  // Subtle green hem glow at bottom edge (557.7nm atomic O emission peak)
  let hemGlow = exp(-max(distToCurtain, 0.0) * 20.0) * 0.5;
  auroraColor += green * hemGlow;

  let finalColor = auroraColor * intensity * 0.5 * elevMask;
  let alpha = clamp(intensity * 0.8, 0.0, 1.0) * elevMask;
  return vec4<f32>(finalColor, alpha);
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

fn sampleCloudDensity(worldPos: vec3<f32>, time: f32, cheap: bool, coverage: f32) -> f32 {
  let heightFrac = clamp((worldPos.y - CLOUD_MIN_Y) / (CLOUD_MAX_Y - CLOUD_MIN_Y), 0.0, 1.0);
  let hGrad = cloudHeightGradient(heightFrac);
  if (hGrad < 0.001) { return 0.0; }

  let wind = vec3<f32>(time * 15.0, time * 0.9, time * 6.0);

  // Base shape: 3-octave FBM — higher freq for less blobby clouds
  let bp = (worldPos + wind) * scene.cloudParams.x;
  var shape = snoise3d(bp)         * 0.625
            + snoise3d(bp * 2.03)  * 0.25
            + snoise3d(bp * 4.01)  * 0.125;

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

  // Time-varying coverage: slow simplex noise modulates base coverage
  let baseCoverage = scene.fogParams.w;
  let coverageNoise = snoise3d(vec3<f32>(time * 0.015, time * 0.007, 0.0)) * 0.25
                    + snoise3d(vec3<f32>(time * 0.004, 0.0, time * 0.003)) * 0.15;
  let coverage = clamp(baseCoverage + coverageNoise, 0.05, 0.9);

  let cosTheta = dot(rayDir, sunDir);
  let silverLining = pow(clamp(cosTheta, 0.0, 1.0), 5.0);

  var transmittance = 1.0;
  var scatteredLight = vec3<f32>(0.0);
  let lightStepSize = 35.0;

  // Day palette: warm sunlight ↔ sky-blue shadow
  let dayShadow = vec3<f32>(0.55, 0.65, 0.85);
  let dayLit = sunColor * 0.95 + vec3<f32>(0.05);

  // Night palette: moonBrightness-dependent (brighter clouds under full moon)
  let mb = scene.skyNightParams.y;
  let nightShadow = vec3<f32>(0.012, 0.015, 0.030) + vec3<f32>(0.008, 0.010, 0.015) * mb;
  let nightLit = vec3<f32>(0.08, 0.10, 0.18) + vec3<f32>(0.06, 0.07, 0.10) * mb;

  // Blend palettes by dayFactor
  let shadowColor = mix(nightShadow, dayShadow, dayFactor);
  let litColor = mix(nightLit, dayLit, dayFactor);
  let silverStr = mix(0.15, 0.5, dayFactor);

  for (var i = 0u; i < CLOUD_STEPS; i++) {
    let t = tStart + (f32(i) + 0.5) * stepSize;
    let pos = rayOrigin + rayDir * t;

    let density = sampleCloudDensity(pos, time, false, coverage);
    if (density < 0.01) { continue; }

    let extinction = density * scene.cloudParams.y;

    // Light march toward sun (or moon at night)
    var lightOD = 0.0;
    for (var j = 1u; j <= CLOUD_LIGHT_STEPS; j++) {
      let lPos = pos + sunDir * lightStepSize * f32(j);
      lightOD += sampleCloudDensity(lPos, time, true, coverage) * lightStepSize;
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
    input.uv.x * 2.0 - 1.0,
    -(input.uv.y * 2.0 - 1.0),
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

    // Clouds occlude background night elements (stars, nebula, meteors, aurora)
    let cloudOcclusion = 1.0 - cloud.a;

    // Night sky gradient (zenith dark → horizon atmospheric glow)
    skyColor += nightSkyGradient(up) * nightFactor;

    // Horizon atmospheric glow (moonlight-dependent)
    let horizAtmo = exp(-abs(up) * 5.0);
    let horizGlowColor = vec3<f32>(0.010, 0.013, 0.028) + vec3<f32>(0.005, 0.006, 0.010) * moonBright;
    skyColor += horizGlowColor * horizAtmo * nightFactor;

    // Night nebula / Milky Way band
    if (up > 0.05) {
      var nebulaColor = sampleNebula(rayDir, starTime);
      // Moonlight washes out faint nebula
      nebulaColor *= 1.0 - 0.3 * moonBright;
      skyColor += nebulaColor * nightFactor * cloudOcclusion;
    }

    // Multi-layer star field
    if (up > 0.0) {
      var starFieldColor = sampleStarField(rayDir, starTime);
      // Atmospheric extinction near horizon
      let horizFade = smoothstep(0.0, 0.15, up);
      starFieldColor *= horizFade;
      // Moonlight dims stars (bright moon → 40% reduction)
      starFieldColor *= 1.0 - 0.4 * moonBright;
      skyColor += starFieldColor * nightFactor * cloudOcclusion;
    }

    // Meteors (shooting stars)
    if (up > 0.05) {
      skyColor += sampleMeteor(rayDir, starTime) * nightFactor * cloudOcclusion;
    }

    // === Aurora Borealis ===
    if (up > 0.05) {
      let aurora = sampleAurora(rayDir, scene.cameraPos.xyz, starTime);
      if (aurora.a > 0.001) {
        let auroraIntensity = nightFactor * (1.0 - 0.2 * moonBright);
        let auroraColor = aurora.rgb * auroraIntensity;
        // Soft additive blend — aurora glows over stars without harsh replacement
        skyColor += auroraColor * aurora.a * cloudOcclusion;
      }
    }

    // Round Moon with phase mask (sunDir = moon direction at night, CPU already negated)
    let moonDir = sunDir;
    let moonDot2 = dot(rayDir, moonDir);
    let moonRight = normalize(cross(moonDir, vec3<f32>(0.0, 1.0, 0.001)));
    let moonUpDir = normalize(cross(moonRight, moonDir));
    let moonLocalX = dot(rayDir - moonDir * moonDot2, moonRight);
    let moonLocalY = dot(rayDir - moonDir * moonDot2, moonUpDir);
    let moonDist = length(vec2<f32>(moonLocalX, moonLocalY)); // round shape
    let moonSize = 0.030;

    if (moonDist < moonSize && moonDot2 > 0.9) {
      let edge = smoothstep(moonSize, moonSize * 0.9, moonDist);
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
