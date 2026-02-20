// Luminance extraction: HDR → log2(luminance) at quarter resolution
// Bilinear sampling provides natural 2x2 downscale

@group(0) @binding(0) var hdrTex: texture_2d<f32>;
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
  let color = textureSampleLevel(hdrTex, linearSampler, input.uv, 0.0).rgb;
  let luminance = dot(color, vec3f(0.2126, 0.7152, 0.0722));
  let logLum = log2(luminance + 0.0001);
  return vec4f(logLum, 0.0, 0.0, 1.0);
}
