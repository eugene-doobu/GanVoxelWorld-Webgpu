// ======================== Water Fragment Shader ========================
// Minimal: screen-space refraction + Beer's law depth color + fog

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

@fragment
fn main(input: FragInput) -> @location(0) vec4f {
  let pixelCoord = vec2i(input.position.xy);
  let screenUV = input.position.xy / frag.screenSize;

  // ==================== Water Depth ====================
  let rawSceneDepth = textureLoad(sceneDepthTex, pixelCoord, 0);
  let linearScene = linearizeDepth(rawSceneDepth);
  let linearWater = linearizeDepth(input.position.z);
  let waterDepth = max(linearScene - linearWater, 0.0);

  // ==================== Screen-Space Refraction ====================
  let t = frag.time;
  let distX = cos(input.worldPos.x * 1.2 + input.worldPos.z * 1.6 - t * 1.1) * 0.006
            + cos(input.worldPos.x * 2.5 + input.worldPos.z * 3.8 + t * 2.0) * 0.003;
  let distZ = cos(-input.worldPos.x * 1.5 + input.worldPos.z * 1.1 + t * 0.85) * 0.006
            + cos(input.worldPos.x * 3.2 - input.worldPos.z * 2.3 - t * 1.6) * 0.003;
  let distortion = vec2f(distX, distZ) * clamp(waterDepth, 0.0, 1.0);
  let refractionUV = clamp(screenUV + distortion, vec2f(0.001), vec2f(0.999));
  var color = textureSampleLevel(sceneColorTex, texSampler, refractionUV, 0.0).rgb;

  // ==================== Beer's Law Absorption ====================
  let absorbCoeff = vec3f(0.45, 0.08, 0.04);
  let transmittance = exp(-absorbCoeff * (waterDepth + 0.6));
  let dayFactor = smoothstep(0.2, 0.6, frag.sunIntensity);
  let shallowColor = mix(vec3f(0.0, 0.04, 0.10), vec3f(0.02, 0.18, 0.35), dayFactor);
  let deepColor    = mix(vec3f(0.0, 0.01, 0.03), vec3f(0.0, 0.05, 0.18), dayFactor);
  let depthBlend = clamp(waterDepth / 6.0, 0.0, 1.0);
  let waterBaseColor = mix(shallowColor, deepColor, depthBlend);
  color = color * transmittance + waterBaseColor * (1.0 - transmittance);

  // ==================== Alpha ====================
  let alpha = clamp(waterDepth * 0.35 + 0.5, 0.5, 0.95);

  // ==================== Distance Fog ====================
  let dist = length(frag.cameraPos - input.worldPos);
  let fogFactor = clamp((dist - frag.fogStart) / (frag.fogEnd - frag.fogStart), 0.0, 1.0);
  let finalColor = mix(color, frag.fogColor, fogFactor);
  let finalAlpha = mix(alpha, 1.0, fogFactor);

  return vec4f(finalColor, finalAlpha);
}
