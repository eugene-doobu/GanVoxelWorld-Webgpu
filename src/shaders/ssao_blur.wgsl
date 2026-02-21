// Separable bilateral blur for SSAO (depth-edge preserving)
// Run twice: once with direction=(1,0) for horizontal, once with (0,1) for vertical

struct BlurParams {
  direction: vec2<f32>,
};

@group(0) @binding(0) var inputTex: texture_2d<f32>;
@group(0) @binding(1) var depthTex: texture_depth_2d;
@group(0) @binding(2) var linearSampler: sampler;
@group(0) @binding(3) var<uniform> blurParams: BlurParams;

#include "common/fullscreen_vert.wgsl"

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let dims = vec2<f32>(textureDimensions(inputTex));
  let pixelCoord = vec2<i32>(input.position.xy);
  let step = vec2<i32>(blurParams.direction);

  let centerAO = textureLoad(inputTex, pixelCoord, 0).r;

  // Sample depth at full resolution matching this UV
  let depthDims = textureDimensions(depthTex);
  let depthPixel = vec2<i32>(vec2<f32>(depthDims) * input.uv);
  let centerDepth = textureLoad(depthTex, depthPixel, 0);

  var result = 0.0;
  var totalWeight = 0.0;

  // 5-tap 1D bilateral blur along direction
  for (var i = -2i; i <= 2i; i++) {
    let sampleCoord = pixelCoord + step * i;
    let sampleUV = (vec2<f32>(sampleCoord) + 0.5) / dims;

    let aoSample = textureLoad(inputTex, clamp(sampleCoord, vec2<i32>(0), vec2<i32>(dims) - vec2<i32>(1)), 0).r;

    let sDepthPixel = vec2<i32>(vec2<f32>(depthDims) * sampleUV);
    let sampleDepth = textureLoad(depthTex, clamp(sDepthPixel, vec2<i32>(0), vec2<i32>(depthDims) - vec2<i32>(1)), 0);

    // Depth-based weight (bilateral)
    let depthDiff = abs(centerDepth - sampleDepth);
    let depthWeight = exp(-depthDiff * 1000.0);

    // Spatial weight (gaussian-like)
    let dist = f32(i * i);
    let spatialWeight = exp(-dist * 0.2);

    let w = depthWeight * spatialWeight;
    result += aoSample * w;
    totalWeight += w;
  }

  let finalAO = result / max(totalWeight, 0.0001);
  return vec4<f32>(finalAO, finalAO, finalAO, 1.0);
}
