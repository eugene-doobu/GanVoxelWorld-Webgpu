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

const PI: f32 = 3.14159265359;

// Henyey-Greenstein phase function
fn henyeyGreenstein(cosTheta: f32, g: f32) -> f32 {
  let g2 = g * g;
  return (1.0 - g2) / (4.0 * PI * pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5));
}

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

// Reconstruct world position from depth
fn reconstructWorldPos(uv: vec2<f32>, depth: f32) -> vec3<f32> {
  let ndc = vec4<f32>(uv * 2.0 - 1.0, depth, 1.0);
  let ndcFlipped = vec4<f32>(ndc.x, -ndc.y, ndc.z, 1.0);
  let worldH = uniforms.invViewProj * ndcFlipped;
  return worldH.xyz / worldH.w;
}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex
fn vs_main(@builtin(vertex_index) vid: u32) -> VertexOutput {
  var output: VertexOutput;
  let x = f32(i32(vid & 1u)) * 4.0 - 1.0;
  let y = f32(i32(vid >> 1u)) * 4.0 - 1.0;
  output.position = vec4<f32>(x, y, 0.0, 1.0);
  output.uv = vec2<f32>(x * 0.5 + 0.5, 1.0 - (y * 0.5 + 0.5));
  return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let depth = textureLoad(depthTex, vec2<i32>(input.position.xy), 0);

  let density = uniforms.params.x;
  let g = uniforms.params.y;
  let maxDist = uniforms.params.z;
  let numSteps = i32(uniforms.params.w);

  // Reconstruct world position of pixel
  let worldPos = reconstructWorldPos(input.uv, depth);
  let camPos = uniforms.cameraPos.xyz;

  // Ray from camera to pixel
  let rayDir = worldPos - camPos;
  let rayLength = length(rayDir);
  let rayDirNorm = rayDir / max(rayLength, 0.001);

  // Clamp march distance
  let marchDist = min(rayLength, maxDist);
  let stepSize = marchDist / f32(numSteps);

  // Phase function: angle between view ray and sun direction
  let sunDir = normalize(uniforms.sunDir.xyz);
  let cosTheta = dot(rayDirNorm, sunDir);
  let phase = henyeyGreenstein(cosTheta, g);

  // Accumulate scattered light via ray marching
  var scatteredLight = 0.0;
  // Temporal dithered start offset to reduce banding
  let frameIndex = uniforms.sunDir.w;
  let ditherPattern = fract(dot(input.position.xy, vec2<f32>(0.7548776662, 0.56984029)) + fract(frameIndex * 0.7548));
  let startOffset = ditherPattern * stepSize;

  for (var i = 0; i < numSteps; i++) {
    let t = startOffset + f32(i) * stepSize;
    let samplePos = camPos + rayDirNorm * t;

    // Height-based density falloff (fog is denser near sea level)
    let seaLevel = uniforms.cameraPos.w;
    let heightFactor = exp(-max(samplePos.y - seaLevel, 0.0) * 0.02);

    let shadowVal = sampleShadowAt(samplePos);
    scatteredLight += shadowVal * heightFactor;
  }

  scatteredLight *= density * stepSize * phase;

  // Apply sun color and intensity
  let sunColor = uniforms.sunColor.rgb * uniforms.sunColor.w;
  let volumetricColor = sunColor * scatteredLight;

  return vec4<f32>(volumetricColor, 1.0);
}
