// ======================== Water Fragment Shader ========================
// Screen-space refraction, depth-based color, edge foam, Fresnel reflection

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

// Linearize depth from [0,1] (perspectiveZO) to view-space distance
fn linearizeDepth(d: f32) -> f32 {
  let near = frag.nearPlane;
  let far = frag.farPlane;
  return near * far / (far - d * (far - near));
}

// Multi-layer animated water normal (4 octaves, cross-directional)
fn waterNormal(pos: vec3f, t: f32) -> vec3f {
  var nx = 0.0;
  var nz = 0.0;

  // Layer 1: large slow swells
  nx += cos(pos.x * 0.4 + t * 0.5 + pos.z * 0.1) * 0.15;
  nz += cos(pos.z * 0.5 + t * 0.4 - pos.x * 0.1) * 0.15;

  // Layer 2: medium waves (cross direction)
  nx += cos(pos.x * 1.8 - t * 1.1 + pos.z * 0.3) * 0.08;
  nz += cos(pos.z * 2.0 + t * 0.9 + pos.x * 0.2) * 0.08;

  // Layer 3: small choppy detail
  nx += cos(pos.x * 4.0 + t * 2.0 - pos.z * 0.5) * 0.04;
  nz += cos(pos.z * 3.5 - t * 1.7 + pos.x * 0.4) * 0.04;

  // Layer 4: fine ripples
  nx += cos(pos.x * 8.0 + t * 3.0) * 0.015;
  nz += cos(pos.z * 7.0 - t * 2.5) * 0.015;

  return normalize(vec3f(nx, 1.0, nz));
}

@fragment
fn main(input: FragInput) -> @location(0) vec4f {
  let pixelCoord = vec2i(input.position.xy);
  let screenUV = input.position.xy / frag.screenSize;
  let V = normalize(frag.cameraPos - input.worldPos);
  let N = waterNormal(input.worldPos, frag.time);

  // ==================== Water Depth ====================
  let rawSceneDepth = textureLoad(sceneDepthTex, pixelCoord, 0);
  let linearScene = linearizeDepth(rawSceneDepth);
  let linearWater = linearizeDepth(input.position.z);
  let waterDepth = max(linearScene - linearWater, 0.0);

  // ==================== Screen-Space Refraction ====================
  // Distort UV by water normal, scaled by depth (no distortion at edges)
  let refractionStrength = 0.025 * clamp(waterDepth, 0.0, 1.0);
  let refractionUV = clamp(screenUV + N.xz * refractionStrength, vec2f(0.001), vec2f(0.999));
  var refractionColor = textureSampleLevel(sceneColorTex, texSampler, refractionUV, 0.0).rgb;

  // ==================== Beer's Law Absorption ====================
  // Light traveling through water: red absorbed fastest, blue slowest
  // +0.8 base depth ensures visible blue tint even at very shallow water
  let absorbCoeff = vec3f(0.45, 0.12, 0.06);
  let effectiveDepth = waterDepth + 0.8;
  let transmittance = exp(-absorbCoeff * effectiveDepth);
  let waterBaseColor = vec3f(0.0, 0.12, 0.32);
  refractionColor = refractionColor * transmittance + waterBaseColor * (1.0 - transmittance);

  // ==================== Fresnel (Schlick) ====================
  let NdotV = max(dot(N, V), 0.0);
  let F0 = 0.02; // Water IOR ~1.33
  let fresnel = F0 + (1.0 - F0) * pow(1.0 - NdotV, 5.0);

  // ==================== Reflection ====================
  let R = reflect(-V, N);

  // Sky gradient based on reflection direction
  let skyGradient = clamp(R.y * 0.5 + 0.5, 0.0, 1.0);
  let horizonColor = vec3f(0.35, 0.45, 0.6);
  let zenithColor = vec3f(0.15, 0.3, 0.65);
  let skyColor = mix(horizonColor, zenithColor, skyGradient);

  // Sun specular: sharp core + soft halo (dual-lobe)
  let L = normalize(frag.sunDirection);
  let sunReflect = max(dot(R, L), 0.0);
  let sunCore = pow(sunReflect, 512.0) * 4.0;
  let sunHalo = pow(sunReflect, 32.0) * 0.25;
  let specular = frag.sunColor * frag.sunIntensity * (sunCore + sunHalo);

  let reflection = skyColor + specular;

  // ==================== Combine Refraction + Reflection ====================
  var color = mix(refractionColor, reflection, clamp(fresnel, 0.0, 1.0));

  // ==================== Edge Foam ====================
  let foamEdge = smoothstep(0.6, 0.0, waterDepth);
  // Animated foam pattern (two overlapping frequencies)
  let fp1 = sin(input.worldPos.x * 8.0 + frag.time * 1.5)
          * sin(input.worldPos.z * 9.0 + frag.time * 1.2);
  let fp2 = sin(input.worldPos.x * 12.0 - frag.time * 0.8)
          * sin(input.worldPos.z * 11.0 + frag.time * 1.0);
  let foamPattern = max(fp1 * 0.5 + 0.3, 0.0) + max(fp2 * 0.3, 0.0);
  let foam = foamEdge * foamPattern * 0.7;
  color = mix(color, vec3f(0.85, 0.9, 0.95), clamp(foam, 0.0, 0.6));

  // ==================== Alpha ====================
  // Always visible (min 0.55), deeper = more opaque
  let baseAlpha = clamp(waterDepth / 4.0 + 0.55, 0.55, 0.95);
  let alpha = max(baseAlpha, clamp(fresnel + foam * 0.5, 0.0, 0.95));

  // ==================== Distance Fog ====================
  let dist = length(frag.cameraPos - input.worldPos);
  let fogFactor = clamp((dist - frag.fogStart) / (frag.fogEnd - frag.fogStart), 0.0, 1.0);
  let finalColor = mix(color, frag.fogColor, fogFactor);
  let finalAlpha = mix(alpha, 1.0, fogFactor);

  return vec4f(finalColor, finalAlpha);
}
