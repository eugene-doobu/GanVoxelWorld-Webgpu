// Bloom downsample (Karis average for first pass, box filter for subsequent)

@group(0) @binding(0) var inputTex: texture_2d<f32>;
@group(0) @binding(1) var linearSampler: sampler;

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
  let texelSize = 1.0 / vec2<f32>(textureDimensions(inputTex));

  // 13-tap downsample (from Call of Duty method)
  let a = textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>(-2.0, -2.0) * texelSize, 0.0).rgb;
  let b = textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>( 0.0, -2.0) * texelSize, 0.0).rgb;
  let c = textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>( 2.0, -2.0) * texelSize, 0.0).rgb;
  let d = textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>(-2.0,  0.0) * texelSize, 0.0).rgb;
  let e = textureSampleLevel(inputTex, linearSampler, input.uv, 0.0).rgb;
  let f = textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>( 2.0,  0.0) * texelSize, 0.0).rgb;
  let g = textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>(-2.0,  2.0) * texelSize, 0.0).rgb;
  let h = textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>( 0.0,  2.0) * texelSize, 0.0).rgb;
  let i = textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>( 2.0,  2.0) * texelSize, 0.0).rgb;
  let j = textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>(-1.0, -1.0) * texelSize, 0.0).rgb;
  let k = textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>( 1.0, -1.0) * texelSize, 0.0).rgb;
  let l = textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>(-1.0,  1.0) * texelSize, 0.0).rgb;
  let m = textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>( 1.0,  1.0) * texelSize, 0.0).rgb;

  var result = e * 0.125;
  result += (a + c + g + i) * 0.03125;
  result += (b + d + f + h) * 0.0625;
  result += (j + k + l + m) * 0.125;

  return vec4<f32>(result, 1.0);
}
