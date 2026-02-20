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

  // Leaves cutout — worldPos-based hash (matches gbuffer.frag.wgsl)
  if (blockType == 51u) {
    let wp = input.worldPos;
    let h1 = fract(sin(dot(wp * 3.7, vec3f(127.1, 311.7, 74.7))) * 43758.5453);
    let h2 = fract(sin(dot(wp * 7.3, vec3f(269.5, 183.3, 246.1))) * 43758.5453);
    let pattern = h1 * 0.6 + h2 * 0.4;
    if (pattern < 0.35) { discard; }
  }

  // Vegetation cutout (TALL_GRASS=80, POPPY=81, DANDELION=82)
  if (blockType >= 80u && blockType <= 82u) {
    let alpha = textureSampleLevel(atlasTexture, atlasSampler, input.texCoord, 0.0).a;
    if (alpha < 0.5) { discard; }
  }
}
