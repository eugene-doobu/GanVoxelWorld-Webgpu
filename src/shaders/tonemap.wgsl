// ACES Filmic Tone Mapping + Color Grading + Gamma Correction

struct TonemapParams {
  bloomIntensity: f32,
  exposure: f32,
  timeOfDay: f32,  // 0=midnight, 0.25=sunrise, 0.5=noon, 0.75=sunset
  autoExposureEnabled: f32,
};

@group(0) @binding(0) var hdrTex: texture_2d<f32>;
@group(0) @binding(1) var bloomTex: texture_2d<f32>;
@group(0) @binding(2) var linearSampler: sampler;
@group(0) @binding(3) var<uniform> params: TonemapParams;
@group(0) @binding(4) var adaptedLumTex: texture_2d<f32>;

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

// ACES Filmic Tone Mapping (Narkowicz approximation)
fn acesFilm(x: vec3<f32>) -> vec3<f32> {
  let a = 2.51;
  let b = 0.03;
  let c = 2.43;
  let d = 0.59;
  let e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), vec3<f32>(0.0), vec3<f32>(1.0));
}

// Complementary Reimagined-style cinematic color grading
fn colorGrade(color: vec3f, timeOfDay: f32) -> vec3f {
  var c = color;

  // 1. Color temperature: warm golden during day, stronger cool blue at night
  let dayFactor = smoothstep(0.2, 0.3, timeOfDay) * (1.0 - smoothstep(0.7, 0.8, timeOfDay));
  let warmth = mix(vec3f(0.85, 0.9, 1.2), vec3f(1.05, 1.02, 0.95), dayFactor);
  c *= warmth;

  // 2. Sunrise/sunset golden hour tint
  let sunriseFactor = exp(-pow((timeOfDay - 0.25) * 12.0, 2.0));
  let sunsetFactor = exp(-pow((timeOfDay - 0.75) * 12.0, 2.0));
  let goldenHour = sunriseFactor + sunsetFactor;
  c = mix(c, c * vec3f(1.15, 0.95, 0.8), goldenHour * 0.4);

  // 3. Vibrance with scotopic effect (reduced saturation at night)
  let luminance = dot(c, vec3f(0.2126, 0.7152, 0.0722));
  let nightAmount = 1.0 - dayFactor;
  let saturationBoost = mix(0.85, 1.15, dayFactor);
  c = mix(vec3f(luminance), c, saturationBoost);

  // 4. Soft contrast S-curve
  c = c - 0.5;
  c = c * 1.05;
  c = c + 0.5;

  // 5. Lift/Gamma/Gain — extra blue lift at night for moonlit atmosphere
  let nightBlueLift = vec3f(0.0, 0.0, 0.02) * nightAmount;
  let lift = vec3f(0.01, 0.01, 0.015) + nightBlueLift;
  let gain = vec3f(1.0, 0.99, 0.97);
  c = max(vec3f(0.0), c * gain + lift);

  return c;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let hdrColor = textureSampleLevel(hdrTex, linearSampler, input.uv, 0.0).rgb;
  let bloomColor = textureSampleLevel(bloomTex, linearSampler, input.uv, 0.0).rgb;

  var color = hdrColor + bloomColor * params.bloomIntensity;
  let autoExp = textureSampleLevel(adaptedLumTex, linearSampler, vec2f(0.5), 0.0).r;
  let exposure = select(params.exposure, autoExp, params.autoExposureEnabled > 0.5);

  // Night exposure boost: raise exposure at night so moonlit scenes have adequate brightness
  let nightFactor = 1.0 - smoothstep(0.2, 0.3, params.timeOfDay) * (1.0 - smoothstep(0.7, 0.8, params.timeOfDay));
  let nightExposureBoost = mix(1.0, 1.8, nightFactor);
  color *= exposure * nightExposureBoost;

  // ACES tone mapping
  color = acesFilm(color);

  // Color grading (after tonemapping, before gamma)
  color = colorGrade(color, params.timeOfDay);

  // Gamma correction (linear → sRGB)
  color = pow(color, vec3<f32>(1.0 / 2.2));

  return vec4<f32>(color, 1.0);
}
