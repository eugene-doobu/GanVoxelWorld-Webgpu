struct Uniforms {
  viewProjection: mat4x4f,
  time: f32,
}
@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexInput {
  @location(0) position: vec3f,
  @location(1) uv: vec2f,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) worldPos: vec3f,
  @location(1) uv: vec2f,
}

@vertex
fn main(input: VertexInput) -> VertexOutput {
  var out: VertexOutput;
  var pos = input.position;

  // Wave animation (vertical displacement)
  let wave = sin(pos.x * 1.5 + uniforms.time * 2.0) * 0.05
           + sin(pos.z * 2.0 + uniforms.time * 1.5) * 0.04;
  pos.y += wave;

  out.position = uniforms.viewProjection * vec4f(pos, 1.0);
  out.worldPos = pos;
  out.uv = input.uv;
  return out;
}
