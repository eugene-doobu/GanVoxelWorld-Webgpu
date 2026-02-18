// Bloom brightness extraction

struct BloomParams {
  threshold: f32,
  knee: f32,
  _pad0: f32,
  _pad1: f32,
};

@group(0) @binding(0) var inputTex: texture_2d<f32>;
@group(0) @binding(1) var linearSampler: sampler;
@group(0) @binding(2) var<uniform> params: BloomParams;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex
fn vs_main(@builtin(vertex_index) vid: u32) -> VertexOutput {
  var output: VertexOutput;
  let x = f32(i32(vid & 1u)) * 4.0 - 1.0;
  let y = f32(i32(vid >> 1u)) * 4.0 - 1.0;
  output.position = vec4<f32>(x, y, 0.0, 1.0);
  output.uv = vec2<f32>(x * 0.5 + 0.5, 1.0 - (y * 0.5 + 0.5));
  return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let color = textureSampleLevel(inputTex, linearSampler, input.uv, 0.0).rgb;
  let brightness = dot(color, vec3<f32>(0.2126, 0.7152, 0.0722));
  let contribution = max(brightness - params.threshold, 0.0);
  let softKnee = contribution / (contribution + params.knee + 0.0001);
  return vec4<f32>(color * softKnee, 1.0);
}
