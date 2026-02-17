struct Camera {
  viewProj: mat4x4<f32>,   // offset 0,  size 64
  cameraPos: vec4<f32>,    // offset 64, size 16 (w unused)
  fogParams: vec4<f32>,    // offset 80, size 16 (x=fogStart, y=fogEnd)
};

@group(0) @binding(0) var<uniform> camera: Camera;

struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) normalIndex: u32,
  @location(2) texCoord: vec2<f32>,
};

struct VertexOutput {
  @builtin(position) clipPos: vec4<f32>,
  @location(0) texCoord: vec2<f32>,
  @location(1) lighting: f32,
  @location(2) fogFactor: f32,
};

@vertex
fn main(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  output.clipPos = camera.viewProj * vec4<f32>(input.position, 1.0);
  output.texCoord = input.texCoord;

  // Face-based lighting
  let faceLight = array<f32, 6>(
    1.0,   // TOP
    0.5,   // BOTTOM
    0.8,   // NORTH (+Z)
    0.8,   // SOUTH (-Z)
    0.7,   // EAST (+X)
    0.7    // WEST (-X)
  );
  let idx = min(input.normalIndex, 5u);
  output.lighting = faceLight[idx];

  // Fog: distance from camera
  let worldDist = distance(input.position, camera.cameraPos.xyz);
  let fogStart = camera.fogParams.x;
  let fogEnd = camera.fogParams.y;
  output.fogFactor = clamp((worldDist - fogStart) / (fogEnd - fogStart), 0.0, 1.0);

  return output;
}
