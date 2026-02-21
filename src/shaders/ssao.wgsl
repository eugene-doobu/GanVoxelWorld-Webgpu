// SSAO - Screen-Space Ambient Occlusion (half resolution)

struct SSAOParams {
  projection: mat4x4<f32>,  // 64
  invProjection: mat4x4<f32>,  // 64
  kernelSamples: array<vec4<f32>, 16>,  // 256
  noiseScale: vec2<f32>,  // 8
  radius: f32,            // 4
  bias: f32,              // 4
};

@group(0) @binding(0) var<uniform> params: SSAOParams;
@group(0) @binding(1) var depthTex: texture_depth_2d;
@group(0) @binding(2) var normalTex: texture_2d<f32>;
@group(0) @binding(3) var noiseTex: texture_2d<f32>;
@group(0) @binding(4) var pointSampler: sampler;

#include "common/fullscreen_vert.wgsl"

fn viewPosFromDepth(uv: vec2<f32>, depth: f32) -> vec3<f32> {
  let ndc = vec4<f32>(uv * 2.0 - 1.0, depth, 1.0);
  let ndcFlipped = vec4<f32>(ndc.x, -ndc.y, ndc.z, 1.0);
  let viewH = params.invProjection * ndcFlipped;
  return viewH.xyz / viewH.w;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let fullDims = textureDimensions(depthTex);
  // Sample depth at full-res coords matching our half-res UV
  let fullPixel = vec2<i32>(vec2<f32>(fullDims) * input.uv);
  let depth = textureLoad(depthTex, fullPixel, 0);

  if (depth >= 1.0) {
    return vec4<f32>(1.0);
  }

  let fragPos = viewPosFromDepth(input.uv, depth);
  let normalSample = textureLoad(normalTex, fullPixel, 0);
  let normal = normalize(normalSample.rgb * 2.0 - 1.0);

  // Random rotation from noise texture
  let noiseCoord = input.uv * params.noiseScale;
  let randomVec = textureSampleLevel(noiseTex, pointSampler, noiseCoord, 0.0).rgb * 2.0 - 1.0;

  // TBN matrix
  let tangent = normalize(randomVec - normal * dot(randomVec, normal));
  let bitangent = cross(normal, tangent);
  let TBN = mat3x3<f32>(tangent, bitangent, normal);

  var occlusion = 0.0;
  for (var i = 0u; i < 16u; i++) {
    let sampleDir = TBN * params.kernelSamples[i].xyz;
    let samplePos = fragPos + sampleDir * params.radius;

    // Project sample to screen space
    let offset = params.projection * vec4<f32>(samplePos, 1.0);
    let projXY = offset.xy / offset.w;
    let sampleUV = vec2<f32>(projXY.x * 0.5 + 0.5, 1.0 - (projXY.y * 0.5 + 0.5));

    // Sample depth at projected position
    let samplePixel = vec2<i32>(vec2<f32>(fullDims) * sampleUV);
    let sampleDepth = textureLoad(depthTex, clamp(samplePixel, vec2<i32>(0), vec2<i32>(fullDims) - vec2<i32>(1)), 0);
    let sampleViewPos = viewPosFromDepth(sampleUV, sampleDepth);

    let rangeCheck = smoothstep(0.0, 1.0, params.radius / (abs(fragPos.z - sampleViewPos.z) + 0.0001));
    occlusion += select(0.0, 1.0, sampleViewPos.z >= samplePos.z + params.bias) * rangeCheck;
  }

  let ao = 1.0 - (occlusion / 16.0);
  return vec4<f32>(ao, ao, ao, 1.0);
}
