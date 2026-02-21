@group(1) @binding(0) var atlasSampler: sampler;
@group(1) @binding(1) var atlasTexture: texture_2d<f32>;

#include "common/alpha_cutout.wgsl"

struct FragInput {
  @location(0) texCoord: vec2<f32>,
  @location(1) worldPos: vec3<f32>,
  @location(2) @interpolate(flat) normalIndex: u32,
};

@fragment
fn main(input: FragInput) {
  let blockType = input.normalIndex >> 8u;
  applyCutout(blockType, input.texCoord);
}
