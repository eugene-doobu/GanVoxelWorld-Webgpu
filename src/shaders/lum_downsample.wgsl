// Simple bilinear downsample for luminance mip chain (r16float)

@group(0) @binding(0) var srcTex: texture_2d<f32>;
@group(0) @binding(1) var linearSampler: sampler;

#include "common/fullscreen_vert.wgsl"

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let val = textureSampleLevel(srcTex, linearSampler, input.uv, 0.0).r;
  return vec4f(val, 0.0, 0.0, 1.0);
}
