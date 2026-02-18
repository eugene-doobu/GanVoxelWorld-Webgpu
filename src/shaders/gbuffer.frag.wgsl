struct GBufferOutput {
  @location(0) albedo: vec4<f32>,    // RGB=albedo, A=emissive
  @location(1) normal: vec4<f32>,    // RGB=world normal (signed)
  @location(2) material: vec4<f32>,  // R=roughness, G=metallic, B=AO(1.0 default)
};

@group(1) @binding(0) var atlasSampler: sampler;
@group(1) @binding(1) var atlasTexture: texture_2d<f32>;
@group(1) @binding(2) var materialAtlas: texture_2d<f32>;

// Face normals: TOP, BOTTOM, NORTH(+Z), SOUTH(-Z), EAST(+X), WEST(-X)
const FACE_NORMALS = array<vec3<f32>, 6>(
  vec3<f32>(0.0, 1.0, 0.0),
  vec3<f32>(0.0, -1.0, 0.0),
  vec3<f32>(0.0, 0.0, 1.0),
  vec3<f32>(0.0, 0.0, -1.0),
  vec3<f32>(1.0, 0.0, 0.0),
  vec3<f32>(-1.0, 0.0, 0.0),
);

struct VertexOutput {
  @builtin(position) clipPos: vec4<f32>,
  @location(0) worldPos: vec3<f32>,
  @location(1) texCoord: vec2<f32>,
  @location(2) @interpolate(flat) normalIndex: u32,
};

@fragment
fn main(input: VertexOutput) -> GBufferOutput {
  var output: GBufferOutput;

  let albedo = textureSample(atlasTexture, atlasSampler, input.texCoord);
  let mat = textureSample(materialAtlas, atlasSampler, input.texCoord);

  let idx = min(input.normalIndex, 5u);
  let normal = FACE_NORMALS[idx];

  output.albedo = vec4<f32>(albedo.rgb, mat.b);  // A = emissive
  output.normal = vec4<f32>(normal * 0.5 + 0.5, 1.0);
  output.material = vec4<f32>(mat.r, mat.g, 1.0, 1.0);  // B=AO defaults to 1.0

  return output;
}
