// Temporal adaptation: smoothly adjust exposure based on scene luminance

struct AdaptParams {
  adaptSpeed: f32,
  keyValue: f32,
  minExposure: f32,
  maxExposure: f32,
  dt: f32,
  _pad0: f32,
  _pad1: f32,
  _pad2: f32,
};

@group(0) @binding(0) var currentLumTex: texture_2d<f32>;
@group(0) @binding(1) var prevAdaptedTex: texture_2d<f32>;
@group(0) @binding(2) var linearSampler: sampler;
@group(0) @binding(3) var<uniform> params: AdaptParams;

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
  let logLum = textureSampleLevel(currentLumTex, linearSampler, vec2f(0.5), 0.0).r;
  let avgLum = exp2(logLum);
  let targetExposure = clamp(
    params.keyValue / (avgLum + 0.0001),
    params.minExposure,
    params.maxExposure,
  );

  let prevExposure = textureSampleLevel(prevAdaptedTex, linearSampler, vec2f(0.5), 0.0).r;

  // First frame: snap immediately (prevExposure is 0 from cleared texture)
  var adaptedExposure: f32;
  if (prevExposure < 0.001) {
    adaptedExposure = targetExposure;
  } else {
    let alpha = 1.0 - exp(-params.adaptSpeed * params.dt);
    adaptedExposure = mix(prevExposure, targetExposure, alpha);
  }

  return vec4f(adaptedExposure, 0.0, 0.0, 1.0);
}
