struct Camera {
  viewProj: mat4x4<f32>,
  cameraPos: vec4<f32>,
  fogParams: vec4<f32>,
};

@group(0) @binding(0) var<uniform> camera: Camera;

struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) normalIndex: u32,
  @location(2) texCoord: vec2<f32>,
};

struct VertexOutput {
  @builtin(position) clipPos: vec4<f32>,
  @location(0) worldPos: vec3<f32>,
  @location(1) texCoord: vec2<f32>,
  @location(2) @interpolate(flat) normalIndex: u32,
};

@vertex
fn main(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  output.clipPos = camera.viewProj * vec4<f32>(input.position, 1.0);
  output.worldPos = input.position;
  output.texCoord = input.texCoord;
  output.normalIndex = input.normalIndex;
  return output;
}
