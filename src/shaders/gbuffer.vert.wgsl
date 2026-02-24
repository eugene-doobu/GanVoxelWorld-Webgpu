struct Camera {
  viewProj: mat4x4<f32>,
  cameraPos: vec4<f32>,
  fogParams: vec4<f32>,
  time: vec4<f32>,
};

@group(0) @binding(0) var<uniform> camera: Camera;

struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) normalIndex: u32,
  @location(2) texCoord: vec2<f32>,
  @location(3) ao: f32,
};

struct VertexOutput {
  @builtin(position) clipPos: vec4<f32>,
  @location(0) worldPos: vec3<f32>,
  @location(1) texCoord: vec2<f32>,
  @location(2) @interpolate(flat) normalIndex: u32,
  @location(3) ao: f32,
};

@vertex
fn main(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;

  let faceIdx = input.normalIndex & 0xFFu;
  let blockType = input.normalIndex >> 8u;

  var worldPos = input.position;

  // Leaves wind animation (BlockType.LEAVES = 51)
  if (blockType == 51u) {
    let windTime = camera.time.x % 628.318; // wrap to avoid sin() precision loss
    let windStrength = 0.03;
    let freq1 = worldPos.x * 0.8 + worldPos.z * 0.4 + windTime * 1.2;
    let freq2 = worldPos.x * 0.5 + worldPos.z * 0.7 + windTime * 0.9;
    worldPos.x += sin(freq1) * windStrength;
    worldPos.z += cos(freq2) * windStrength * 0.7;
    worldPos.y += sin(freq1 + freq2) * windStrength * 0.2;
  }

  // Vegetation wind animation (TALL_GRASS=80, POPPY=81, DANDELION=82)
  if (blockType >= 80u && blockType <= 82u) {
    let windTime = camera.time.x % 628.318; // wrap to avoid sin() precision loss
    // Use original Y for height factor (stable, pre-wind)
    let heightFactor = fract(input.position.y); // ~0.01 at bottom, ~0.99 at top
    let windStrength = 0.12 * heightFactor;
    let freq1 = input.position.x * 1.8 + input.position.z * 0.9 + windTime * 3.0;
    let freq2 = input.position.x * 0.6 + input.position.z * 1.6 + windTime * 2.2;
    worldPos.x += sin(freq1) * windStrength;
    worldPos.z += cos(freq2) * windStrength * 0.8;
  }

  // Torch flame flicker animation (BlockType.TORCH = 93)
  if (blockType == 93u) {
    let windTime = camera.time.x % 628.318;
    let heightFactor = fract(input.position.y); // ~0.01 at bottom, ~0.99 at top
    let flickerStrength = 0.04 * heightFactor;
    let freq1 = input.position.x * 5.0 + input.position.z * 3.0 + windTime * 8.0;
    let freq2 = input.position.x * 4.0 + input.position.z * 5.5 + windTime * 6.5;
    worldPos.x += sin(freq1) * flickerStrength;
    worldPos.z += cos(freq2) * flickerStrength * 0.6;
  }

  output.clipPos = camera.viewProj * vec4<f32>(worldPos, 1.0);
  output.worldPos = worldPos;
  output.texCoord = input.texCoord;
  output.normalIndex = input.normalIndex;
  output.ao = input.ao;
  return output;
}
