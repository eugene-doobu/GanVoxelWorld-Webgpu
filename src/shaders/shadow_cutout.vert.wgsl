struct ShadowUniforms {
  lightViewProj: array<mat4x4<f32>, 3>,
  cascadeSplits: vec4<f32>,
};

@group(0) @binding(0) var<uniform> shadow: ShadowUniforms;

struct CascadeIndex {
  index: u32,
};

@group(0) @binding(1) var<uniform> cascade: CascadeIndex;

struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) normalIndex: u32,
  @location(2) texCoord: vec2<f32>,
};

struct VertexOutput {
  @builtin(position) clipPos: vec4<f32>,
  @location(0) texCoord: vec2<f32>,
  @location(1) worldPos: vec3<f32>,
  @location(2) @interpolate(flat) normalIndex: u32,
};

@vertex
fn main(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  output.clipPos = shadow.lightViewProj[cascade.index] * vec4<f32>(input.position, 1.0);
  output.texCoord = input.texCoord;
  output.worldPos = input.position;
  output.normalIndex = input.normalIndex;
  return output;
}
