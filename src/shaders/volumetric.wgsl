// ======================== Volumetric Light Shafts (God Rays) ========================
// Screen-space ray marching with shadow map sampling

struct VolumetricUniforms {
  invViewProj: mat4x4<f32>,       // 64
  cameraPos: vec4<f32>,           // 16  (xyz=position, w=seaLevel)
  sunDir: vec4<f32>,              // 16  (xyz=direction, w=frameIndex)
  sunColor: vec4<f32>,            // 16  (rgb=color, w=intensity)
  params: vec4<f32>,              // 16  (x=density, y=scatterG, z=maxDist, w=numSteps)
};

struct ShadowUniforms {
  lightViewProj: array<mat4x4<f32>, 3>,  // 192
  cascadeSplits: vec4<f32>,               // 16
};

@group(0) @binding(0) var<uniform> uniforms: VolumetricUniforms;
@group(0) @binding(1) var depthTex: texture_depth_2d;
@group(0) @binding(2) var<uniform> shadow: ShadowUniforms;
@group(0) @binding(3) var shadowMap: texture_depth_2d_array;
@group(0) @binding(4) var shadowSampler: sampler_comparison;
@group(0) @binding(5) var linearSampler: sampler;

#include "common/phase_functions.wgsl"

// Sample shadow map at world position (simplified, single cascade lookup)
fn sampleShadowAt(worldPos: vec3<f32>) -> f32 {
  let camDist = distance(uniforms.cameraPos.xyz, worldPos);
  let splits = shadow.cascadeSplits;

  var cascadeIdx = 0u;
  if (camDist > splits.y) {
    cascadeIdx = 2u;
  } else if (camDist > splits.x) {
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

  // Single tap (no PCF for volumetric, performance)
  return textureSampleCompareLevel(
    shadowMap, shadowSampler,
    shadowUV,
    i32(cascadeIdx),
    currentDepth - 0.003
  );
}

#include "common/reconstruct.wgsl"

#include "common/fullscreen_vert.wgsl"

// Dual-lobe Henyey-Greenstein: forward scatter + back scatter
fn dualLobeHG(cosTheta: f32) -> f32 {
  let forward = hgPhase(cosTheta, 0.75);
  let back    = hgPhase(cosTheta, -0.3);
  return mix(back, forward, 0.7);
}

// Exponential height fog density
fn heightFogDensity(height: f32, seaLevel: f32) -> f32 {
  let heightAboveSea = height - seaLevel;
  let heightFalloff = 0.08;       // steeper falloff — fog clears faster above sea level
  let referenceDensity = 0.6;     // reduced from 1.0 to prevent washout
  if (heightAboveSea <= 0.0) {
    // Below sea level: denser, but not full 1.0 (let density param control overall)
    return referenceDensity * (1.0 + min(-heightAboveSea * 0.02, 0.4));
  }
  return referenceDensity * exp(-heightFalloff * heightAboveSea);
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let depth = textureLoad(depthTex, vec2<i32>(input.position.xy), 0);

  let density = uniforms.params.x;
  let maxDist = uniforms.params.z;
  let numSteps = i32(uniforms.params.w);

  let seaLevel = uniforms.cameraPos.w;

  // Reconstruct world position of pixel
  let worldPos = reconstructWorldPos(input.uv, depth, uniforms.invViewProj);
  let camPos = uniforms.cameraPos.xyz;

  // Ray from camera to pixel
  let rayDir = worldPos - camPos;
  let rayLength = length(rayDir);
  let rayDirNorm = rayDir / max(rayLength, 0.001);

  // Clamp march distance
  let marchDist = min(rayLength, maxDist);
  let stepSize = marchDist / f32(numSteps);

  // Phase function with dual-lobe HG
  let sunDir = normalize(uniforms.sunDir.xyz);
  let cosTheta = dot(rayDirNorm, sunDir);
  let phase = dualLobeHG(cosTheta);

  // Fog color variation: warm near sun, cool away from sun (kept dim to avoid over-brightening)
  let warmFogColor = vec3<f32>(0.85, 0.75, 0.55);
  let coolFogColor = vec3<f32>(0.45, 0.5, 0.65);
  // Use a 0-1 blend based on phase contribution (normalized roughly)
  let phaseNorm = saturate((phase - 0.05) / 0.4);
  let fogTint = mix(coolFogColor, warmFogColor, phaseNorm);

  // Ambient scattering constant (keep very subtle to avoid washout)
  let ambientAmount = 0.03;

  // Underwater suppression: if camera is below sea level, reduce volumetric
  let camUnderwaterFactor = saturate(1.0 - saturate((seaLevel - camPos.y) * 0.1));

  // Accumulate scattered light via ray marching
  var sunAccum = 0.0;
  var ambientAccum = 0.0;

  // Temporal dithered start offset to reduce banding
  let frameIndex = uniforms.sunDir.w;
  let ditherPattern = fract(dot(input.position.xy, vec2<f32>(0.7548776662, 0.56984029)) + fract(frameIndex * 0.7548));
  let startOffset = ditherPattern * stepSize;

  for (var i = 0; i < numSteps; i++) {
    let t = startOffset + f32(i) * stepSize;
    let samplePos = camPos + rayDirNorm * t;

    // Exponential height-based density
    let fogDens = heightFogDensity(samplePos.y, seaLevel);

    // Underwater suppression for sample points below sea level
    let sampleUnderwaterSuppression = saturate(1.0 + (samplePos.y - seaLevel) * 0.05);
    let effectiveDensity = fogDens * mix(0.2, 1.0, sampleUnderwaterSuppression);

    let shadowVal = sampleShadowAt(samplePos);

    // Sun-directed scattering (modulated by shadow visibility)
    sunAccum += shadowVal * effectiveDensity;

    // Ambient scattering (always present, independent of shadow)
    ambientAccum += effectiveDensity;
  }

  sunAccum *= density * stepSize * phase;
  ambientAccum *= density * stepSize * ambientAmount;

  // Apply sun color and intensity
  let sunColor = uniforms.sunColor.rgb * uniforms.sunColor.w;

  // Sun-directed contribution tinted by fog color
  let sunContrib = sunColor * fogTint * sunAccum;
  // Ambient contribution with cool fog tint
  let ambientContrib = sunColor * coolFogColor * ambientAccum;

  let volumetricColor = (sunContrib + ambientContrib) * camUnderwaterFactor;

  return vec4<f32>(volumetricColor, 1.0);
}
