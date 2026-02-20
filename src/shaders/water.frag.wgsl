// ======================== Water Fragment Shader ========================
// Beer's law absorption, Fresnel reflection, atmospheric sky reflection,
// energy-conserving specular, noise-based shore foam

struct FragUniforms {
  cameraPos: vec3f,
  time: f32,
  sunDirection: vec3f,
  sunIntensity: f32,
  sunColor: vec3f,
  nearPlane: f32,
  fogColor: vec3f,
  farPlane: f32,
  fogStart: f32,
  fogEnd: f32,
  screenSize: vec2f,
}

@group(0) @binding(1) var<uniform> frag: FragUniforms;
@group(0) @binding(2) var sceneColorTex: texture_2d<f32>;
@group(0) @binding(3) var sceneDepthTex: texture_depth_2d;
@group(0) @binding(4) var texSampler: sampler;

struct FragInput {
  @builtin(position) position: vec4f,
  @location(0) worldPos: vec3f,
  @location(1) uv: vec2f,
}

const PI: f32 = 3.14159265359;

// Linearize depth from [0,1] (perspectiveZO) to view-space distance
fn linearizeDepth(d: f32) -> f32 {
  let near = frag.nearPlane;
  let far = frag.farPlane;
  return near * far / (far - d * (far - near));
}

// Multi-layer animated water normal — diagonal wave directions to avoid grid artifacts
fn waterNormal(pos: vec3f, t: f32) -> vec3f {
  var nx = 0.0;
  var nz = 0.0;

  // Layer 1: large slow swells along ~30 deg diagonal
  let d1 = pos.x * 0.35 + pos.z * 0.48;
  let d1b = pos.x * 0.42 - pos.z * 0.30;
  nx += cos(d1 + t * 0.5) * 0.12;
  nz += cos(d1b + t * 0.38) * 0.12;

  // Layer 2: medium waves along ~55 deg diagonal
  let d2 = pos.x * 1.2 + pos.z * 1.6;
  let d2b = -pos.x * 1.5 + pos.z * 1.1;
  nx += cos(d2 - t * 1.1) * 0.06;
  nz += cos(d2b + t * 0.85) * 0.06;

  // Layer 3: small choppy detail along ~70 deg diagonal
  let d3 = pos.x * 2.5 + pos.z * 3.8;
  let d3b = pos.x * 3.2 - pos.z * 2.3;
  nx += cos(d3 + t * 2.0) * 0.03;
  nz += cos(d3b - t * 1.6) * 0.03;

  // Layer 4: fine ripples along ~40 deg diagonal
  let d4 = pos.x * 5.5 + pos.z * 6.8;
  let d4b = -pos.x * 6.2 + pos.z * 5.0;
  nx += cos(d4 + t * 2.8) * 0.012;
  nz += cos(d4b - t * 2.2) * 0.012;

  return normalize(vec3f(nx, 1.0, nz));
}

// ======================== Utility Functions ========================

fn hash2d(p: vec2f) -> f32 {
  var p3 = fract(vec3f(p.x, p.y, p.x) * 0.1031);
  p3 += dot(p3, vec3f(p3.y + 33.33, p3.z + 33.33, p3.x + 33.33));
  return fract((p3.x + p3.y) * p3.z);
}

fn valueNoise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  let a = hash2d(i);
  let b = hash2d(i + vec2f(1.0, 0.0));
  let c = hash2d(i + vec2f(0.0, 1.0));
  let d = hash2d(i + vec2f(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// FBM foam noise — 3 rotated octaves for natural irregular pattern
fn foamNoise(p: vec2f, t: f32) -> f32 {
  let drift = vec2f(t * 0.08, t * 0.05);

  // Octave 1 — large foam blobs
  let p1 = p + drift;
  var val = valueNoise(p1) * 0.55;

  // Octave 2 — medium detail, rotated 40 deg
  let p2 = vec2f(p.x * 0.766 - p.y * 0.643, p.x * 0.643 + p.y * 0.766) * 2.2 + drift * 1.5;
  val += valueNoise(p2) * 0.3;

  // Octave 3 — fine detail, rotated 75 deg
  let p3 = vec2f(p.x * 0.259 - p.y * 0.966, p.x * 0.966 + p.y * 0.259) * 4.7 + drift * 2.5;
  val += valueNoise(p3) * 0.15;

  return val;
}

// Sky color for reflection direction (matches sky.wgsl atmospheric model)
fn evalSkyReflection(dir: vec3f, L: vec3f, dayFactor: f32) -> vec3f {
  let up = dir.y;
  let cosTheta = dot(dir, L);

  // Base sky gradient (zenith - horizon)
  let zenith = vec3f(0.22, 0.40, 0.85);
  let horizon = vec3f(0.60, 0.75, 0.92);
  var sky: vec3f;
  if (up > 0.0) {
    sky = mix(horizon, zenith, pow(up, 0.45));
  } else {
    let ground = vec3f(0.55, 0.62, 0.70);
    sky = mix(horizon, ground, pow(min(-up, 1.0), 0.7));
  }

  // Rayleigh scattering
  let rayleigh = 3.0 / (16.0 * PI) * (1.0 + cosTheta * cosTheta);
  let altitude = max(up, 0.0);
  sky += vec3f(0.3, 0.55, 0.95) * rayleigh * exp(-altitude * 4.0) * 0.8;

  // Mie scattering (sun halo in reflection)
  let g = 0.76;
  let g2 = g * g;
  let mie = (1.0 - g2) / (4.0 * PI * pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5));
  sky += vec3f(1.0, 0.95, 0.85) * mie * 0.02;

  // Sunset/sunrise horizon warmth
  let sunsetAmount = 1.0 - clamp(abs(L.y) * 3.0, 0.0, 1.0);
  let horizonBand = exp(-abs(up) * 8.0);
  sky += vec3f(1.2, 0.5, 0.15) * sunsetAmount * max(cosTheta, 0.0) * 0.5 * horizonBand;

  // Day/night transition
  let nightSky = vec3f(0.005, 0.007, 0.02);
  return mix(nightSky, sky, dayFactor);
}

// ======================== Main Fragment ========================

@fragment
fn main(input: FragInput) -> @location(0) vec4f {
  let pixelCoord = vec2i(input.position.xy);
  let screenUV = input.position.xy / frag.screenSize;
  let V = normalize(frag.cameraPos - input.worldPos);
  let N = waterNormal(input.worldPos, frag.time);
  let L = normalize(frag.sunDirection);

  // ==================== Water Depth ====================
  let rawSceneDepth = textureLoad(sceneDepthTex, pixelCoord, 0);
  let linearScene = linearizeDepth(rawSceneDepth);
  let linearWater = linearizeDepth(input.position.z);
  let waterDepth = max(linearScene - linearWater, 0.0);

  // ==================== Screen-Space Refraction ====================
  let refractionStrength = 0.025 * clamp(waterDepth, 0.0, 1.0);
  let refractionUV = clamp(screenUV + N.xz * refractionStrength, vec2f(0.001), vec2f(0.999));
  var refractionColor = textureSampleLevel(sceneColorTex, texSampler, refractionUV, 0.0).rgb;

  // ==================== Beer's Law Absorption ====================
  let absorbCoeff = vec3f(0.45, 0.12, 0.06);
  let effectiveDepth = waterDepth + 0.8;
  let transmittance = exp(-absorbCoeff * effectiveDepth);
  let dayFactor = smoothstep(0.2, 0.6, frag.sunIntensity);
  let waterBaseColor = mix(vec3f(0.0, 0.02, 0.06), vec3f(0.0, 0.12, 0.32), dayFactor);
  refractionColor = refractionColor * transmittance + waterBaseColor * (1.0 - transmittance);

  // ==================== Fresnel (Schlick) ====================
  let NdotV = max(dot(N, V), 0.0);
  let fresnel = 0.02 + 0.98 * pow(1.0 - NdotV, 5.0);

  // ==================== Sky Reflection ====================
  let R = reflect(-V, N);
  let skyReflection = evalSkyReflection(R, L, dayFactor);

  // ==================== Sun/Moon Specular ====================
  // Energy-conserving Blinn-Phong: sharper highlight during day, broader moon path at night
  let H = normalize(V + L);
  let NdotH = max(dot(N, H), 0.0);
  let specPower = mix(80.0, 350.0, dayFactor);
  let normFactor = (specPower + 2.0) / (8.0 * PI);
  let specular = frag.sunColor * frag.sunIntensity * pow(NdotH, specPower) * normFactor;

  let reflection = skyReflection + specular;

  // ==================== Combine Refraction + Reflection ====================
  var color = mix(refractionColor, reflection, clamp(fresnel, 0.0, 1.0));

  // ==================== Subsurface Scattering ====================
  // Light transmission through shallow water edges — turquoise glow toward sun
  let sssDepth = clamp(1.0 - waterDepth / 2.0, 0.0, 1.0);
  let sssFactor = sssDepth * pow(max(dot(L, -V), 0.0), 3.0) * 0.4;
  color += vec3f(0.0, 0.2, 0.15) * sssFactor * frag.sunIntensity * dayFactor;

  // ==================== Shore Foam ====================
  let foamMask = smoothstep(1.2, 0.0, waterDepth);
  let foamVal = foamNoise(input.worldPos.xz * 2.0, frag.time);
  let foamThreshold = mix(0.25, 0.5, clamp(waterDepth / 1.2, 0.0, 1.0));
  let foam = foamMask * smoothstep(foamThreshold, foamThreshold + 0.12, foamVal);
  let foamBrightness = mix(vec3f(0.15, 0.17, 0.25), vec3f(0.9, 0.93, 0.95), dayFactor);
  color = mix(color, foamBrightness, clamp(foam, 0.0, 0.65));

  // ==================== Alpha ====================
  let depthAlpha = clamp(waterDepth * 0.35 + 0.5, 0.5, 0.95);
  let alpha = max(depthAlpha, clamp(fresnel + foam * 0.4, 0.0, 0.95));

  // ==================== Distance Fog ====================
  let dist = length(frag.cameraPos - input.worldPos);
  let fogFactor = clamp((dist - frag.fogStart) / (frag.fogEnd - frag.fogStart), 0.0, 1.0);
  let finalColor = mix(color, frag.fogColor, fogFactor);
  let finalAlpha = mix(alpha, 1.0, fogFactor);

  return vec4f(finalColor, finalAlpha);
}
