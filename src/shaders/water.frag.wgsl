// ======================== Water Fragment Shader ========================
// Beer's law depth color + Fresnel reflection + fog (no screen-space refraction)

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

fn linearizeDepth(d: f32) -> f32 {
  let near = frag.nearPlane;
  let far = frag.farPlane;
  return near * far / (far - d * (far - near));
}

// Analytical derivative of vertex wave for consistent normals
fn waterNormal(pos: vec3f, t: f32) -> vec3f {
  let dhdx = cos(pos.x * 0.8 + t * 1.2) * 0.064
           + cos((pos.x + pos.z) * 2.0 + t * 2.5) * 0.06
           + cos((pos.x - pos.z) * 3.0 + t * 1.8) * 0.045;
  let dhdz = cos(pos.z * 1.2 + t * 0.9) * 0.072
           + cos((pos.x + pos.z) * 2.0 + t * 2.5) * 0.06
           - cos((pos.x - pos.z) * 3.0 + t * 1.8) * 0.045;
  return normalize(vec3f(-dhdx, 1.0, -dhdz));
}

@fragment
fn main(input: FragInput) -> @location(0) vec4f {
  let pixelCoord = vec2i(input.position.xy);

  // ==================== Water Depth ====================
  let rawSceneDepth = textureLoad(sceneDepthTex, pixelCoord, 0);
  let linearScene = linearizeDepth(rawSceneDepth);
  let linearWater = linearizeDepth(input.position.z);
  let waterDepth = max(linearScene - linearWater, 0.0);

  // ==================== Water Normal & View ====================
  let N = waterNormal(input.worldPos, frag.time);
  let V = normalize(frag.cameraPos - input.worldPos);

  // ==================== Beer's Law Absorption ====================
  let absorbCoeff = vec3f(0.45, 0.08, 0.04);
  let transmittance = exp(-absorbCoeff * (waterDepth + 0.6));
  let dayFactor = smoothstep(0.2, 0.6, frag.sunIntensity);
  let shallowColor = mix(vec3f(0.0, 0.04, 0.10), vec3f(0.02, 0.18, 0.35), dayFactor);
  let deepColor    = mix(vec3f(0.0, 0.01, 0.03), vec3f(0.0, 0.05, 0.18), dayFactor);
  let depthBlend = clamp(waterDepth / 6.0, 0.0, 1.0);
  let waterBaseColor = mix(shallowColor, deepColor, depthBlend);
  var color = waterBaseColor;

  // ==================== Fresnel Reflection ====================
  let NdotV = max(dot(N, V), 0.0);
  let F0 = 0.02;
  let fresnel = F0 + (1.0 - F0) * pow(1.0 - NdotV, 5.0);

  let R = reflect(-V, N);
  let skyGradient = clamp(R.y * 0.5 + 0.5, 0.0, 1.0);
  let horizonColor = mix(vec3f(0.15, 0.18, 0.25), vec3f(0.35, 0.45, 0.6), dayFactor);
  let zenithColor = mix(vec3f(0.03, 0.05, 0.12), vec3f(0.15, 0.3, 0.65), dayFactor);
  let skyColor = mix(horizonColor, zenithColor, skyGradient);

  // Sun specular
  let L = normalize(frag.sunDirection);
  let sunReflect = max(dot(R, L), 0.0);
  let specular = frag.sunColor * frag.sunIntensity * (pow(sunReflect, 256.0) * 2.0 + pow(sunReflect, 32.0) * 0.15);

  let reflection = skyColor + specular;
  color = mix(color, reflection, clamp(fresnel, 0.0, 1.0));

  // ==================== Alpha ====================
  let alpha = clamp(waterDepth * 0.35 + 0.5, 0.5, 0.95);

  // ==================== Distance Fog ====================
  let dist = length(frag.cameraPos - input.worldPos);
  let fogFactor = clamp((dist - frag.fogStart) / (frag.fogEnd - frag.fogStart), 0.0, 1.0);
  let finalColor = mix(color, frag.fogColor, fogFactor);
  let finalAlpha = mix(alpha, 1.0, fogFactor);

  return vec4f(finalColor, finalAlpha);
}
