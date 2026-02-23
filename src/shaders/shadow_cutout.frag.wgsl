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

  // Cutout blocks (leaves/veg) use direct atlas UV, but in shadow pass they
  // always come through the cutout pipeline which only renders cutout blocks.
  // These blocks are emitted with atlas UV (not tiled), so use texCoord directly.
  applyCutout(blockType, input.texCoord);
}
