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

  // Multi-frequency wave displacement (matches fragment normal derivatives)
  let t = uniforms.time;
  let wave = sin(pos.x * 0.8 + t * 1.2) * 0.08
           + sin(pos.z * 1.2 + t * 0.9) * 0.06
           + sin((pos.x + pos.z) * 2.0 + t * 2.5) * 0.03
           + sin((pos.x - pos.z) * 3.0 + t * 1.8) * 0.015
           // Medium-frequency ripples
           + sin(pos.x * 5.3 + pos.z * 1.7 + t * 3.1) * 0.005
           + sin(pos.z * 4.9 - pos.x * 2.3 + t * 2.7) * 0.005;
  pos.y += wave;

  out.position = uniforms.viewProjection * vec4f(pos, 1.0);
  out.worldPos = pos;
  out.uv = input.uv;
  return out;
}
