// Alpha cutout for leaves (51), vegetation (80-82), and torches (93).
// Atlas alpha is baked at texture generation time for stable, flicker-free results.
// Requires: atlasSampler, atlasTexture bindings declared before inclusion.

fn applyCutout(blockType: u32, texCoord: vec2<f32>) {
  if (blockType == 51u || (blockType >= 80u && blockType <= 82u) || blockType == 93u) {
    let cutoutAlpha = textureSampleLevel(atlasTexture, atlasSampler, texCoord, 0.0).a;
    if (cutoutAlpha < 0.5) { discard; }
  }
}
