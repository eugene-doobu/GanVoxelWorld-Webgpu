struct ShadowUniforms {
  lightViewProj: array<mat4x4<f32>, 3>,
  cascadeSplits: vec4<f32>,
};

@group(0) @binding(0) var<uniform> shadow: ShadowUniforms;

// Push constant equivalent via dynamic offset - cascade index passed as uniform
struct CascadeIndex {
  index: u32,
};

@group(0) @binding(1) var<uniform> cascade: CascadeIndex;

struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) normalIndex: u32,
  @location(2) texCoord: vec2<f32>,
};

@vertex
fn main(input: VertexInput) -> @builtin(position) vec4<f32> {
  return shadow.lightViewProj[cascade.index] * vec4<f32>(input.position, 1.0);
}
