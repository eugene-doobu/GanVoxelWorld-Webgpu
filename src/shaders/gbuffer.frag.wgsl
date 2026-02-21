struct GBufferOutput {
  @location(0) albedo: vec4<f32>,    // RGB=albedo, A=emissive
  @location(1) normal: vec4<f32>,    // RGB=world normal (signed)
  @location(2) material: vec4<f32>,  // R=roughness, G=metallic, B=AO(1.0 default)
};

@group(1) @binding(0) var atlasSampler: sampler;
@group(1) @binding(1) var atlasTexture: texture_2d<f32>;
@group(1) @binding(2) var materialAtlas: texture_2d<f32>;
@group(1) @binding(3) var normalAtlas: texture_2d<f32>;

#include "common/alpha_cutout.wgsl"

// Face normals: TOP, BOTTOM, NORTH(+Z), SOUTH(-Z), EAST(+X), WEST(-X)
const FACE_NORMALS = array<vec3<f32>, 6>(
  vec3<f32>(0.0, 1.0, 0.0),
  vec3<f32>(0.0, -1.0, 0.0),
  vec3<f32>(0.0, 0.0, 1.0),
  vec3<f32>(0.0, 0.0, -1.0),
  vec3<f32>(1.0, 0.0, 0.0),
  vec3<f32>(-1.0, 0.0, 0.0),
);

// Build TBN matrix from face index
fn buildTBN(faceIdx: u32) -> mat3x3<f32> {
  var N: vec3<f32>;
  var T: vec3<f32>;
  var B: vec3<f32>;

  switch(faceIdx) {
    case 0u: { N = vec3f(0,1,0); T = vec3f(1,0,0); B = vec3f(0,0,1); }   // TOP
    case 1u: { N = vec3f(0,-1,0); T = vec3f(1,0,0); B = vec3f(0,0,-1); }  // BOTTOM
    case 2u: { N = vec3f(0,0,1); T = vec3f(-1,0,0); B = vec3f(0,1,0); }   // NORTH (+Z)
    case 3u: { N = vec3f(0,0,-1); T = vec3f(1,0,0); B = vec3f(0,1,0); }   // SOUTH (-Z)
    case 4u: { N = vec3f(1,0,0); T = vec3f(0,0,1); B = vec3f(0,1,0); }    // EAST (+X)
    case 5u: { N = vec3f(-1,0,0); T = vec3f(0,0,-1); B = vec3f(0,1,0); }  // WEST (-X)
    default: { N = vec3f(0,1,0); T = vec3f(1,0,0); B = vec3f(0,0,1); }
  }
  return mat3x3<f32>(T, B, N);
}

struct VertexOutput {
  @builtin(position) clipPos: vec4<f32>,
  @location(0) worldPos: vec3<f32>,
  @location(1) texCoord: vec2<f32>,
  @location(2) @interpolate(flat) normalIndex: u32,
  @location(3) ao: f32,
};

@fragment
fn main(input: VertexOutput, @builtin(front_facing) frontFacing: bool) -> GBufferOutput {
  var output: GBufferOutput;

  // Extract face index and block type from packed normalIndex
  let faceIdx = input.normalIndex & 0xFFu;
  let blockType = input.normalIndex >> 8u;

  // Alpha cutout: leaves (51) and vegetation (80-82) use atlas texture alpha.
  applyCutout(blockType, input.texCoord);

  let albedo = textureSampleLevel(atlasTexture, atlasSampler, input.texCoord, 0.0);
  let mat = textureSampleLevel(materialAtlas, atlasSampler, input.texCoord, 0.0);
  let normalSample = textureSampleLevel(normalAtlas, atlasSampler, input.texCoord, 0.0).rgb;

  let idx = min(faceIdx, 5u);

  var worldNormal: vec3<f32>;
  if (blockType >= 80u && blockType <= 82u) {
    // Vegetation: use face normal from geometry, oriented toward camera
    // For cross-mesh (X-shaped quads), the geometric normal is meaningful
    // and we negate it for back faces so both sides shade consistently
    worldNormal = FACE_NORMALS[idx];
    if (!frontFacing) { worldNormal = -worldNormal; }
  } else {
    // Solid blocks: transform tangent-space normal via TBN
    let tangentNormal = normalSample * 2.0 - 1.0;
    let tbn = buildTBN(idx);
    worldNormal = normalize(tbn * tangentNormal);
  }

  output.albedo = vec4<f32>(albedo.rgb, mat.b);  // A = emissive
  output.normal = vec4<f32>(worldNormal * 0.5 + 0.5, 1.0);
  output.material = vec4<f32>(mat.r, mat.g, input.ao, 1.0);  // B=vertex AO

  return output;
}
