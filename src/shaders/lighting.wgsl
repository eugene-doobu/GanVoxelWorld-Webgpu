// ======================== Deferred PBR Lighting ========================
// Cook-Torrance BRDF with shadow mapping, SSAO, and day-night cycle

#include "common/scene_uniforms.wgsl"

struct ShadowUniforms {
  lightViewProj: array<mat4x4<f32>, 3>,  // 192
  cascadeSplits: vec4<f32>,               // 16 (x,y,z = split distances)
};

@group(0) @binding(0) var<uniform> scene: SceneUniforms;

// G-Buffer textures
@group(1) @binding(0) var gAlbedo: texture_2d<f32>;
@group(1) @binding(1) var gNormal: texture_2d<f32>;
@group(1) @binding(2) var gMaterial: texture_2d<f32>;
@group(1) @binding(3) var gDepth: texture_depth_2d;

// Shadow + SSAO
@group(2) @binding(0) var<uniform> shadow: ShadowUniforms;
@group(2) @binding(1) var shadowMap: texture_depth_2d_array;
@group(2) @binding(2) var shadowSampler: sampler_comparison;
@group(2) @binding(3) var ssaoTexture: texture_2d<f32>;
@group(2) @binding(4) var linearSampler: sampler;

// Point Lights
struct PointLight {
  position: vec3f,
  radius: f32,
  color: vec3f,
  intensity: f32,
};

struct PointLightBuffer {
  count: u32,
  _pad0: u32,
  _pad1: u32,
  _pad2: u32,
  lights: array<PointLight, 128>,
};

@group(3) @binding(0) var<storage, read> pointLights: PointLightBuffer;

// ====================== Constants ======================
const PI: f32 = 3.14159265359;

// ====================== Atmospheric Scattering (Fog) ======================
#include "common/phase_functions.wgsl"

fn atmosphericFogColor(viewDir: vec3f, sunDir: vec3f) -> vec3f {
  let cosTheta = dot(normalize(viewDir), sunDir);
  // trueSunHeight: CPU-computed, immune to day/night lightDir switching
  let trueSunHeight = scene.skyNightParams.w;
  // Rayleigh (blue sky)
  let rayleigh = rayleighPhase(cosTheta);
  let rayleighColor = vec3f(0.3, 0.55, 0.95) * rayleigh;
  // Mie (warm forward scatter)
  let mie = hgPhase(cosTheta, 0.76);
  let mieColor = vec3f(1.0, 0.95, 0.85) * mie * 0.02;
  // Horizon base + scattering
  var fogColor = vec3f(0.60, 0.75, 0.92) + rayleighColor * 0.8 + mieColor;
  // Sunset warming
  let sunsetFactor = 1.0 - clamp(abs(trueSunHeight) * 3.0, 0.0, 1.0);
  fogColor += vec3f(1.2, 0.5, 0.15) * sunsetFactor * max(cosTheta, 0.0) * 0.5;
  // Night darkening
  let dayFactor = smoothstep(-0.15, 0.1, trueSunHeight);
  fogColor *= dayFactor;
  // Night fog: ambient base + moonlight Mie forward scattering
  let nightFogColor = scene.ambientColor.rgb * 0.3;
  let moonMie = hgPhase(cosTheta, 0.76) * 0.03;
  let nightMoonFog = vec3f(0.15, 0.18, 0.30) * moonMie * scene.skyNightParams.y;
  fogColor += (nightFogColor + nightMoonFog) * (1.0 - dayFactor);
  return fogColor;
}

// ====================== Fullscreen Vertex ======================
#include "common/fullscreen_vert.wgsl"

// ====================== World position reconstruction ======================
#include "common/reconstruct.wgsl"

// ====================== PBR Functions ======================

// GGX/Trowbridge-Reitz Normal Distribution
fn distributionGGX(NdotH: f32, roughness: f32) -> f32 {
  let a = roughness * roughness;
  let a2 = a * a;
  let denom = NdotH * NdotH * (a2 - 1.0) + 1.0;
  return a2 / (PI * denom * denom);
}

// Smith-Schlick Geometry Function
fn geometrySmithSchlick(NdotV: f32, NdotL: f32, roughness: f32) -> f32 {
  let r = roughness + 1.0;
  let k = (r * r) / 8.0;
  let ggx1 = NdotV / (NdotV * (1.0 - k) + k);
  let ggx2 = NdotL / (NdotL * (1.0 - k) + k);
  return ggx1 * ggx2;
}

// Schlick Fresnel Approximation
fn fresnelSchlick(cosTheta: f32, F0: vec3<f32>) -> vec3<f32> {
  return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

// ====================== Shadow Sampling ======================
fn sampleShadow(worldPos: vec3<f32>, viewDist: f32) -> f32 {
  let splits = shadow.cascadeSplits;

  var cascadeIdx = 0u;
  if (viewDist > splits.y) {
    cascadeIdx = 2u;
  } else if (viewDist > splits.x) {
    cascadeIdx = 1u;
  }

  let lightSpacePos = shadow.lightViewProj[cascadeIdx] * vec4<f32>(worldPos, 1.0);
  let projCoords = lightSpacePos.xyz / lightSpacePos.w;
  let shadowUV = vec2<f32>(projCoords.x * 0.5 + 0.5, 1.0 - (projCoords.y * 0.5 + 0.5));

  if (shadowUV.x < 0.0 || shadowUV.x > 1.0 || shadowUV.y < 0.0 || shadowUV.y > 1.0) {
    return 1.0;
  }

  let currentDepth = projCoords.z;
  if (currentDepth > 1.0 || currentDepth < 0.0) {
    return 1.0;
  }

  // PCSS (Percentage Closer Soft Shadows)
  let texelSize = 1.0 / 2048.0;
  // TODO: connect lightSize to Config.data.rendering.shadows.pcss.lightSize
  let lightSize = 3.0; // light source size in texels
  let bias = 0.002;

  // Poisson disk samples (16 points)
  let poissonDisk = array<vec2f, 16>(
    vec2f(-0.94201624, -0.39906216), vec2f(0.94558609, -0.76890725),
    vec2f(-0.09418410, -0.92938870), vec2f(0.34495938, 0.29387760),
    vec2f(-0.91588581, 0.45771432), vec2f(-0.81544232, -0.87912464),
    vec2f(-0.38277543, 0.27676845), vec2f(0.97484398, 0.75648379),
    vec2f(0.44323325, -0.97511554), vec2f(0.53742981, -0.47373420),
    vec2f(-0.26496911, -0.41893023), vec2f(0.79197514, 0.19090188),
    vec2f(-0.24188840, 0.99706507), vec2f(-0.81409955, 0.91437590),
    vec2f(0.19984126, 0.78641367), vec2f(0.14383161, -0.14100790)
  );

  // Step 1: Blocker search — estimate average blocker ratio
  let searchRadius = lightSize * texelSize;
  var blockerCount = 0.0;
  for (var i = 0; i < 16; i++) {
    let sampleUV = shadowUV + poissonDisk[i] * searchRadius;
    let lit = textureSampleCompareLevel(
      shadowMap, shadowSampler, sampleUV, i32(cascadeIdx), currentDepth - bias
    );
    if (lit < 0.5) {
      blockerCount += 1.0;
    }
  }

  // No blockers — fully lit
  if (blockerCount < 0.5) { return 1.0; }

  // Step 2: Penumbra estimation — more blockers = wider penumbra
  let blockerRatio = blockerCount / 16.0;
  let penumbraWidth = lightSize * blockerRatio;

  // Step 3: Variable-size PCF filtering with Poisson disk
  let filterRadius = max(penumbraWidth * texelSize, texelSize);
  var shadowFactor = 0.0;
  for (var i = 0; i < 16; i++) {
    let sampleUV = shadowUV + poissonDisk[i] * filterRadius;
    shadowFactor += textureSampleCompareLevel(
      shadowMap, shadowSampler, sampleUV, i32(cascadeIdx), currentDepth - bias
    );
  }
  return shadowFactor / 16.0;
}

// ====================== Contact Shadow ======================
fn contactShadow(worldPos: vec3f, sunDir: vec3f) -> f32 {
  let enabled = scene.contactShadowParams.x;
  if (enabled < 0.5) {
    return 1.0;
  }

  let maxSteps = i32(scene.contactShadowParams.y);
  let rayLength = scene.contactShadowParams.z;
  let thickness = scene.contactShadowParams.w;
  let dims = textureDimensions(gDepth);

  // March along sunDir in world space, project each sample to screen
  let stepSize = rayLength / f32(maxSteps);

  for (var i = 1; i <= maxSteps; i++) {
    let samplePos = worldPos + sunDir * stepSize * f32(i);

    // Project to clip space using unjittered viewProj
    let clipPos = scene.viewProj * vec4f(samplePos, 1.0);
    let ndc = clipPos.xyz / clipPos.w;

    // NDC to UV (flip Y for WebGPU)
    let uv = vec2f(ndc.x * 0.5 + 0.5, 0.5 - ndc.y * 0.5);

    // Skip if outside screen
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      continue;
    }

    let texCoord = vec2i(vec2f(f32(dims.x), f32(dims.y)) * uv);
    let sceneDepth = textureLoad(gDepth, texCoord, 0);

    // Compare: ray depth vs scene depth
    let rayDepth = ndc.z;
    let depthDiff = rayDepth - sceneDepth;

    // Occluded if ray is behind surface within thickness
    if (depthDiff > 0.0 && depthDiff < thickness) {
      // Fade based on march distance
      let t = f32(i) / f32(maxSteps);
      return mix(0.3, 1.0, t * t);
    }
  }

  return 1.0;
}

// ====================== Water Caustics ======================
fn waterCaustics(worldPos: vec3f, time: f32, underwaterDepth: f32) -> f32 {
  // Eclipse-style: project underwater position to water surface along sun direction
  let sunDir = normalize(scene.lightDir.xyz);
  let waterLevel = scene.cameraPos.w;
  let projectedPos = worldPos.xz + sunDir.xz / max(abs(sunDir.y), 0.01) * underwaterDepth;

  // Domain warping for organic patterns
  let rawP = projectedPos;
  let warpedP = rawP + vec2f(
    sin(rawP.y * 0.3 + time * 0.2),
    cos(rawP.x * 0.3 + time * 0.15)
  ) * 0.5;

  // Depth-dependent frequency: shallow = sharper/finer, deep = softer/larger
  let freqScale = mix(1.5, 0.5, smoothstep(0.0, 5.0, underwaterDepth));
  let p = warpedP * freqScale;

  // Octave 1: large slow waves
  var wave1 = 0.0;
  wave1 += sin(dot(p, vec2f(0.8, 0.6)) * 0.4 + time * 0.6);
  wave1 += sin(dot(p, vec2f(-0.5, 0.9)) * 0.5 + time * 0.45);
  wave1 += sin(dot(p, vec2f(0.9, -0.4)) * 0.35 + time * 0.55);
  let c1 = pow(1.0 - abs(sin(wave1 * 1.2)), 2.0);

  // Octave 2: medium fast detail
  var wave2 = 0.0;
  wave2 += sin(dot(p, vec2f(1.2, -0.8)) * 0.9 + time * 1.1);
  wave2 += sin(dot(p, vec2f(-0.7, 1.3)) * 1.1 + time * 0.9);
  wave2 += sin(dot(p, vec2f(0.6, 1.1)) * 0.8 + time * 1.3);
  let c2 = pow(1.0 - abs(sin(wave2 * 1.5)), 2.0);

  // Octave 3: fine high-frequency detail
  var wave3 = 0.0;
  wave3 += sin(dot(p, vec2f(1.8, -1.2)) * 1.6 + time * 1.8);
  wave3 += sin(dot(p, vec2f(-1.1, 1.7)) * 1.9 + time * 1.5);
  wave3 += sin(dot(p, vec2f(1.4, 1.5)) * 1.4 + time * 2.0);
  let c3 = pow(1.0 - abs(sin(wave3 * 1.8)), 2.0);

  // Weighted combination with minimum brightness floor
  let combined = c1 * 0.5 + c2 * 0.35 + c3 * 0.15;

  // Temporal shimmer
  let shimmer = 0.9 + 0.1 * sin(time * 3.0 + rawP.x * 0.5);

  // Minimum brightness floor so dark areas aren't completely black
  return max(combined * shimmer, 0.05);
}

// ====================== Fragment Shader ======================
@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let pixelCoord = vec2<i32>(input.position.xy);
  let dims = textureDimensions(gAlbedo);

  // Sample G-Buffer
  let albedoSample = textureLoad(gAlbedo, pixelCoord, 0);
  let normalSample = textureLoad(gNormal, pixelCoord, 0);
  let materialSample = textureLoad(gMaterial, pixelCoord, 0);
  let depth = textureLoad(gDepth, pixelCoord, 0);

  // Early sky detection (nothing written to G-Buffer)
  if (depth >= 1.0) {
    discard;
  }

  // sRGB → linear approximation (slightly lifted for voxel aesthetic)
  let albedo = pow(albedoSample.rgb, vec3<f32>(2.2));
  let emissive = albedoSample.a;
  let normal = normalize(normalSample.rgb * 2.0 - 1.0);
  let roughness = materialSample.r;
  let metallic = materialSample.g;

  // Sample SSAO
  let uv = input.uv;
  let ao = textureSampleLevel(ssaoTexture, linearSampler, uv, 0.0).r;

  // Reconstruct world position
  let worldPos = reconstructWorldPos(uv, depth, scene.invViewProj);
  let V = normalize(scene.cameraPos.xyz - worldPos);
  let N = normal;
  let L = normalize(scene.lightDir.xyz);
  let H = normalize(V + L);

  let NdotL = max(dot(N, L), 0.0);
  let NdotV = max(dot(N, V), 0.001);
  let NdotH = max(dot(N, H), 0.0);
  let HdotV = max(dot(H, V), 0.0);

  // Metallic workflow: F0
  let F0 = mix(vec3<f32>(0.04), albedo, metallic);

  // Cook-Torrance Specular BRDF
  let D = distributionGGX(NdotH, roughness);
  let G = geometrySmithSchlick(NdotV, NdotL, roughness);
  let F = fresnelSchlick(HdotV, F0);

  let numerator = D * G * F;
  let denominator = 4.0 * NdotV * NdotL + 0.0001;
  let specular = numerator / denominator;

  // Energy-conserving diffuse
  let kD = (vec3<f32>(1.0) - F) * (1.0 - metallic);
  let diffuse = kD * albedo / PI;

  // Shadow
  let viewDist = distance(scene.cameraPos.xyz, worldPos);
  let shadowFactor = sampleShadow(worldPos, viewDist);

  // Contact shadow
  let contactFactor = contactShadow(worldPos, L);

  // Direct lighting
  let sunColor = scene.sunColor.rgb * scene.sunColor.w;
  let directLight = (diffuse + specular) * sunColor * NdotL * shadowFactor * contactFactor;

  // Hemisphere ambient
  let skyAmbient = scene.ambientColor.rgb;
  let groundAmbient = skyAmbient * scene.ambientColor.w;
  let ambientBlend = dot(N, vec3<f32>(0.0, 1.0, 0.0)) * 0.5 + 0.5;
  let ambient = mix(groundAmbient, skyAmbient, ambientBlend) * albedo * ao;

  // Emissive
  let emissiveColor = albedo * emissive * 5.0;

  // Point Lights
  var pointLightContrib = vec3<f32>(0.0, 0.0, 0.0);
  let lightCount = min(pointLights.count, 128u);
  for (var i = 0u; i < lightCount; i++) {
    let light = pointLights.lights[i];
    let lightVec = light.position - worldPos;
    let dist = length(lightVec);
    if (dist > light.radius) { continue; }

    let L_p = normalize(lightVec);
    let falloff = dist / light.radius;
    let attenuation = (1.0 - falloff * falloff) * (1.0 - falloff * falloff) / (1.0 + dist * dist * 0.15);
    let NdotL_p = max(dot(N, L_p), 0.0);

    // Diffuse contribution
    let pointDiffuse = albedo * light.color * light.intensity * NdotL_p * attenuation;

    // Simple specular (Blinn-Phong for point lights to keep cost low)
    let H_p = normalize(V + L_p);
    let NdotH_p = max(dot(N, H_p), 0.0);
    let specPower = mix(8.0, 64.0, 1.0 - roughness);
    let pointSpecular = light.color * light.intensity * pow(NdotH_p, specPower) * attenuation * (1.0 - roughness) * 0.3;

    pointLightContrib += pointDiffuse + pointSpecular;
  }

  var finalColor = directLight + ambient + emissiveColor + pointLightContrib;

  // Water caustics (underwater surfaces only)
  let waterLevel = scene.cameraPos.w;
  let waterTime = scene.lightDir.w;
  if (worldPos.y < waterLevel) {
    let underwaterDepth = waterLevel - worldPos.y;
    let shoreFade = smoothstep(0.0, 0.5, underwaterDepth);
    let depthAtten = exp(-underwaterDepth * 0.15) * shoreFade;
    let normalUp = max(dot(N, vec3f(0.0, 1.0, 0.0)), 0.0);
    let causticPattern = waterCaustics(worldPos, waterTime, underwaterDepth);
    // Sun angle influence: stronger when sun is high, weaker at sunset/night
    let sunHeightFactor = smoothstep(-0.1, 0.5, L.y);
    let causticLight = sunColor * causticPattern * depthAtten * normalUp * shadowFactor * sunHeightFactor * 0.35;
    finalColor += causticLight;
  }

  // Fog: smooth blend between atmospheric and underwater (0.3-unit transition zone)
  let camDepthBelow = scene.cameraPos.w - scene.cameraPos.y;
  let uwBlend = smoothstep(-0.3, 0.3, camDepthBelow);

  // Atmospheric scattering fog (always computed)
  let fogStart = scene.fogParams.x;
  let fogEnd = scene.fogParams.y;
  let fogFactor = clamp((viewDist - fogStart) / (fogEnd - fogStart), 0.0, 1.0);
  let viewDir = worldPos - scene.cameraPos.xyz;
  let sunDir3 = normalize(scene.lightDir.xyz);
  let fogColor = atmosphericFogColor(viewDir, sunDir3);
  let atmosResult = mix(finalColor, fogColor, fogFactor);

  // Underwater Beer-Lambert absorption + scattering
  let uwAbsorb = vec3f(0.39, 0.11, 0.07);
  let uwTransmittance = exp(-uwAbsorb * min(viewDist, 60.0));
  let uwDayFactor = smoothstep(-0.1, 0.3, sunDir3.y);
  let uwScatterColor = vec3f(0.0, 0.03, 0.07) * uwDayFactor;
  let uwResult = (finalColor * uwTransmittance + uwScatterColor * (1.0 - uwTransmittance.b))
               * exp(-max(camDepthBelow, 0.0) * 0.06);

  finalColor = mix(atmosResult, uwResult, uwBlend);

  return vec4<f32>(finalColor, 1.0);
}
