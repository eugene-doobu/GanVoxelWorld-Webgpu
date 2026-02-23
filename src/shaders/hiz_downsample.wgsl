// Hi-Z Downsample Compute Shader
// Takes a depth texture (or previous mip) and produces a max-depth mip.
// Each texel takes the maximum depth from the 4 source texels (conservative depth).

@group(0) @binding(0) var srcTex: texture_2d<f32>;
@group(0) @binding(1) var dstTex: texture_storage_2d<r32float, write>;
@group(0) @binding(2) var<uniform> params: vec4<u32>; // xy = dst size

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let dstSize = params.xy;
  if (gid.x >= dstSize.x || gid.y >= dstSize.y) { return; }

  // Sample 4 source texels (2×2 block)
  let srcCoord = vec2<i32>(gid.xy) * 2;
  let d00 = textureLoad(srcTex, srcCoord + vec2<i32>(0, 0), 0).r;
  let d10 = textureLoad(srcTex, srcCoord + vec2<i32>(1, 0), 0).r;
  let d01 = textureLoad(srcTex, srcCoord + vec2<i32>(0, 1), 0).r;
  let d11 = textureLoad(srcTex, srcCoord + vec2<i32>(1, 1), 0).r;

  // Max depth (conservative: if any pixel is behind, the whole region is "behind")
  let maxDepth = max(max(d00, d10), max(d01, d11));

  textureStorageBarrier();
  textureStore(dstTex, vec2<i32>(gid.xy), vec4<f32>(maxDepth, 0.0, 0.0, 0.0));
}
