@group(1) @binding(0) var atlasSampler: sampler;
@group(1) @binding(1) var atlasTexture: texture_2d<f32>;

struct FragInput {
  @location(0) texCoord: vec2<f32>,
  @location(1) worldPos: vec3<f32>,
  @location(2) @interpolate(flat) normalIndex: u32,
};

@fragment
fn main(input: FragInput) {
  let blockType = input.normalIndex >> 8u;

  // Leaves (51) and vegetation (80-82): atlas texture alpha cutout
  if (blockType == 51u || (blockType >= 80u && blockType <= 82u)) {
    let alpha = textureSampleLevel(atlasTexture, atlasSampler, input.texCoord, 0.0).a;
    if (alpha < 0.5) { discard; }
  }
}
