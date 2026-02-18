// Bloom upsample (tent filter with additive blending)

struct BloomUpParams {
  filterRadius: f32,
  _pad0: f32,
  _pad1: f32,
  _pad2: f32,
};

@group(0) @binding(0) var inputTex: texture_2d<f32>;
@group(0) @binding(1) var linearSampler: sampler;
@group(0) @binding(2) var<uniform> params: BloomUpParams;

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
  let r = params.filterRadius;
  let texelSize = 1.0 / vec2<f32>(textureDimensions(inputTex));

  // 9-tap tent filter
  var result = vec3<f32>(0.0);
  result += textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>(-r, -r) * texelSize, 0.0).rgb * 1.0;
  result += textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>( 0.0, -r) * texelSize, 0.0).rgb * 2.0;
  result += textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>( r, -r) * texelSize, 0.0).rgb * 1.0;
  result += textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>(-r,  0.0) * texelSize, 0.0).rgb * 2.0;
  result += textureSampleLevel(inputTex, linearSampler, input.uv, 0.0).rgb * 4.0;
  result += textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>( r,  0.0) * texelSize, 0.0).rgb * 2.0;
  result += textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>(-r,  r) * texelSize, 0.0).rgb * 1.0;
  result += textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>( 0.0,  r) * texelSize, 0.0).rgb * 2.0;
  result += textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>( r,  r) * texelSize, 0.0).rgb * 1.0;
  result /= 16.0;

  return vec4<f32>(result, 1.0);
}
