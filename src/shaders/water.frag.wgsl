// ======================== Water Fragment Shader ========================
// Beer-Lambert RGB absorption, screen-space refraction with chromatic dispersion,
// Snell's window, edge foam, Fresnel reflection with scene-based reflections

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
  waterLevel: f32,
  pad0: f32,
  pad1: f32,
  pad2: f32,
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

const WATER_ABSORB = vec3f(0.39, 0.11, 0.07);

fn linearizeDepth(d: f32) -> f32 {
  let near = frag.nearPlane;
  let far = frag.farPlane;
  return near * far / (far - d * (far - near));
}

// ---- Noise functions for organic water normals ----

fn hash2d(p: vec2f) -> f32 {
  var p3 = fract(vec3f(p.x, p.y, p.x) * vec3f(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

fn smoothNoise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  // Quintic interpolation for smoother derivatives
  let u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

  let a = hash2d(i);
  let b = hash2d(i + vec2f(1.0, 0.0));
  let c = hash2d(i + vec2f(0.0, 1.0));
  let d = hash2d(i + vec2f(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// FBM with 4 octaves — produces organic, non-repeating height field
fn waterFBM(p: vec2f) -> f32 {
  var value = 0.0;
  var amplitude = 0.5;
  var pos = p;
  // Rotation matrix per octave to decorrelate layers
  let rot = mat2x2f(0.8, 0.6, -0.6, 0.8);

  for (var i = 0; i < 4; i = i + 1) {
    value += amplitude * smoothNoise(pos);
    pos = rot * pos * 2.05 + vec2f(1.7, 9.2);
    amplitude *= 0.5;
  }
  return value;
}

// Water normal via finite-difference of FBM height field
// This produces completely organic, non-repeating normals
fn waterNormal(pos: vec3f, t: f32) -> vec3f {
  let eps = 0.08; // finite difference step
  let strength = 0.35; // normal intensity

  // Animate: flow in two directions with different speeds
  let flow1 = vec2f(t * 0.4, t * 0.3);
  let flow2 = vec2f(-t * 0.25, t * 0.35);

  // Two FBM layers at different scales and flow directions
  let scale1 = 0.8;
  let scale2 = 1.6;

  let uv = pos.xz;

  // Sample heights for finite difference
  let h00 = waterFBM(uv * scale1 + flow1) * 0.7
           + waterFBM(uv * scale2 + flow2) * 0.3;
  let h10 = waterFBM((uv + vec2f(eps, 0.0)) * scale1 + flow1) * 0.7
           + waterFBM((uv + vec2f(eps, 0.0)) * scale2 + flow2) * 0.3;
  let h01 = waterFBM((uv + vec2f(0.0, eps)) * scale1 + flow1) * 0.7
           + waterFBM((uv + vec2f(0.0, eps)) * scale2 + flow2) * 0.3;

  let dhdx = (h10 - h00) / eps * strength;
  let dhdz = (h01 - h00) / eps * strength;

  return normalize(vec3f(-dhdx, 1.0, -dhdz));
}

// Approximate screen-space reflection for water
fn waterReflection(screenUV: vec2f, worldPos: vec3f, N: vec3f, V: vec3f) -> vec4f {
  let R = reflect(-V, N);
  if (R.y < 0.05) { return vec4f(0.0); }

  // Planar reflection: offset UV based on normal perturbation
  let NdotV = max(dot(N, V), 0.001);
  let reflectOffset = N.xz * 0.04 / NdotV;
  let heightAboveWater = max(worldPos.y - frag.waterLevel, 0.0);

  let reflectUV = vec2f(
    screenUV.x + reflectOffset.x,
    screenUV.y - abs(reflectOffset.y) - heightAboveWater * 0.003
  );

  if (reflectUV.x < 0.01 || reflectUV.x > 0.99 || reflectUV.y < 0.01 || reflectUV.y > 0.99) {
    return vec4f(0.0);
  }

  let reflectedColor = textureSampleLevel(sceneColorTex, texSampler, reflectUV, 0.0).rgb;

  // Edge + distance fade
  let edgeFade = smoothstep(0.0, 0.05, reflectUV.x)
               * smoothstep(1.0, 0.95, reflectUV.x)
               * smoothstep(0.0, 0.05, reflectUV.y)
               * smoothstep(1.0, 0.95, reflectUV.y);
  let viewDist = length(frag.cameraPos - worldPos);
  let distFade = 1.0 - smoothstep(30.0, 80.0, viewDist);

  return vec4f(reflectedColor, edgeFade * distFade);
}

@fragment
fn main(input: FragInput) -> @location(0) vec4f {
  let pixelCoord = vec2i(input.position.xy);
  let screenUV = input.position.xy / frag.screenSize;

  // ==================== Common Setup ====================
  let rawSceneDepth = textureLoad(sceneDepthTex, pixelCoord, 0);
  let linearScene = linearizeDepth(rawSceneDepth);
  let linearWater = linearizeDepth(input.position.z);
  let waterDepth = max(linearScene - linearWater, 0.0);

  let N = waterNormal(input.worldPos, frag.time);
  let V = normalize(frag.cameraPos - input.worldPos);
  let viewDist = length(frag.cameraPos - input.worldPos);
  let isUnderwater = frag.cameraPos.y < frag.waterLevel;
  let dayFactor = smoothstep(0.2, 0.6, frag.sunIntensity);

  // ==================== Sun Specular ====================
  let L = normalize(frag.sunDirection);
  let R = reflect(-V, N);
  let sunReflect = max(dot(R, L), 0.0);
  let specular = frag.sunColor * frag.sunIntensity
    * (pow(sunReflect, 512.0) * 1.5 + pow(sunReflect, 64.0) * 0.1);

  // Sky reflection color (analytical fallback)
  let skyGradient = clamp(R.y * 0.5 + 0.5, 0.0, 1.0);
  let horizonColor = mix(vec3f(0.015, 0.02, 0.035), vec3f(0.35, 0.45, 0.6), dayFactor);
  let zenithColor = mix(vec3f(0.005, 0.008, 0.025), vec3f(0.15, 0.3, 0.65), dayFactor);
  let skyColor = mix(horizonColor, zenithColor, skyGradient);

  // Pure analytical sky reflection only (no scene sampling to avoid SSAO artifacts)
  let reflection = skyColor + specular;

  let deepColor = mix(vec3f(0.0, 0.01, 0.03), vec3f(0.0, 0.04, 0.12), dayFactor);

  var color: vec3f;
  var alpha: f32;

  if (isUnderwater) {
    // ==================== UNDERWATER VIEW ====================
    let aboveScene = textureSampleLevel(sceneColorTex, texSampler, screenUV, 0.0).rgb;
    let cosAngle = abs(dot(N, V));
    let snellsWindow = smoothstep(0.55, 0.75, cosAngle);
    let tirColor = deepColor * 0.3 + specular * 0.5;
    color = mix(tirColor, aboveScene, snellsWindow);

    let uwDist = min(viewDist, 30.0);
    color *= exp(-WATER_ABSORB * uwDist * 0.3);
    let depthBelowSurface = frag.waterLevel - frag.cameraPos.y;
    color *= exp(-depthBelowSurface * 0.08);
    alpha = 0.95;

  } else {
    // ==================== ABOVE-WATER VIEW ====================
    // DEBUG: minimal mode — only flat blue + waterDepth visualization
    // No refraction, no foam, no fresnel, no reflection
    // This isolates whether circles come from the water shader or post-processing

    // Procedural underwater color based on depth (no scene sampling = no SSAO artifacts)
    let shallowColor = mix(vec3f(0.0, 0.15, 0.25), vec3f(0.05, 0.25, 0.35), dayFactor);
    color = mix(shallowColor, deepColor, smoothstep(0.0, 5.0, waterDepth));

    // Edge foam
    let foamLine = smoothstep(0.5, 0.0, waterDepth);
    let foamWave = sin(input.worldPos.x * 8.0 + frag.time * 2.0) * 0.5 + 0.5;
    let foamWave2 = sin(input.worldPos.z * 6.0 + frag.time * 1.5) * 0.5 + 0.5;
    let foam = foamLine * (0.5 + 0.5 * foamWave * foamWave2) * dayFactor;
    color += vec3f(foam * 0.7, foam * 0.75, foam * 0.8);

    // Fresnel reflection
    let NdotV = max(dot(N, V), 0.0);
    let F0 = 0.08;
    let fresnel = F0 + (1.0 - F0) * pow(1.0 - NdotV, 4.0);
    let depthReflectBoost = smoothstep(0.0, 3.0, waterDepth) * 0.15;
    let finalFresnel = clamp(fresnel + depthReflectBoost, 0.0, 1.0);
    color = mix(color, reflection, finalFresnel);

    alpha = 1.0;
  }

  // ==================== Distance Fog ====================
  if (!isUnderwater) {
    let fogFactor = clamp((viewDist - frag.fogStart) / (frag.fogEnd - frag.fogStart), 0.0, 1.0);
    color = mix(color, frag.fogColor, fogFactor);
    alpha = mix(alpha, 1.0, fogFactor);
  }

  return vec4f(color, alpha);
}
