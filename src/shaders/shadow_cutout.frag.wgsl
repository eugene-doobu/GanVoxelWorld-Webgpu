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

  // Leaves cutout — texCoord-based hash (matches gbuffer.frag.wgsl)
  if (blockType == 51u) {
    let faceIdx = input.normalIndex & 0xFFu;
    let tileUV = fract(input.texCoord * 16.0);
    let cell = floor(tileUV * 4.0);
    let bp = floor(input.worldPos);
    let seed = cell.x * 12.9898 + cell.y * 78.233
             + bp.x * 45.164 + bp.y * 93.72 + bp.z * 27.56
             + f32(faceIdx) * 61.37;
    let pattern = fract(sin(seed) * 43758.5453);
    if (pattern < 0.35) { discard; }
  }

  // Vegetation cutout (TALL_GRASS=80, POPPY=81, DANDELION=82)
  if (blockType >= 80u && blockType <= 82u) {
    let alpha = textureSampleLevel(atlasTexture, atlasSampler, input.texCoord, 0.0).a;
    if (alpha < 0.5) { discard; }
  }
}
