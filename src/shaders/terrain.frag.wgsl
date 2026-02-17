struct VertexOutput {
  @builtin(position) clipPos: vec4<f32>,
  @location(0) texCoord: vec2<f32>,
  @location(1) lighting: f32,
  @location(2) fogFactor: f32,
};

@group(1) @binding(0) var atlasSampler: sampler;
@group(1) @binding(1) var atlasTexture: texture_2d<f32>;

// Bright horizon color for fog blending
const FOG_COLOR = vec3<f32>(0.75, 0.85, 0.95);

@fragment
fn main(input: VertexOutput) -> @location(0) vec4<f32> {
  let texColor = textureSample(atlasTexture, atlasSampler, input.texCoord);
  let lit = texColor.rgb * input.lighting;
  let finalColor = mix(lit, FOG_COLOR, input.fogFactor);
  return vec4<f32>(finalColor, texColor.a);
}
