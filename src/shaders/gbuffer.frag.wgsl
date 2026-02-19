struct GBufferOutput {
  @location(0) albedo: vec4<f32>,    // RGB=albedo, A=emissive
  @location(1) normal: vec4<f32>,    // RGB=world normal (signed)
  @location(2) material: vec4<f32>,  // R=roughness, G=metallic, B=AO(1.0 default)
};

@group(1) @binding(0) var atlasSampler: sampler;
@group(1) @binding(1) var atlasTexture: texture_2d<f32>;
@group(1) @binding(2) var materialAtlas: texture_2d<f32>;
@group(1) @binding(3) var normalAtlas: texture_2d<f32>;

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
fn main(input: VertexOutput) -> GBufferOutput {
  var output: GBufferOutput;

  // Extract face index and block type from packed normalIndex
  let faceIdx = input.normalIndex & 0xFFu;
  let blockType = input.normalIndex >> 8u;

  // Leaves alpha cutout (BlockType.LEAVES = 51)
  if (blockType == 51u) {
    let checkerSize = 3.0;
    let cx = floor(input.texCoord.x * 16.0 / checkerSize);
    let cy = floor(input.texCoord.y * 16.0 / checkerSize);
    let pattern = fract(sin(cx * 12.9898 + cy * 78.233) * 43758.5453);
    if (pattern < 0.35) { discard; }
  }

  let albedo = textureSample(atlasTexture, atlasSampler, input.texCoord);
  let mat = textureSample(materialAtlas, atlasSampler, input.texCoord);

  let idx = min(faceIdx, 5u);

  // Sample tangent-space normal from normal atlas and transform to world space
  let normalSample = textureSample(normalAtlas, atlasSampler, input.texCoord).rgb;
  let tangentNormal = normalSample * 2.0 - 1.0;
  let tbn = buildTBN(idx);
  let worldNormal = normalize(tbn * tangentNormal);

  output.albedo = vec4<f32>(albedo.rgb, mat.b);  // A = emissive
  output.normal = vec4<f32>(worldNormal * 0.5 + 0.5, 1.0);
  output.material = vec4<f32>(mat.r, mat.g, input.ao, 1.0);  // B=vertex AO

  return output;
}
