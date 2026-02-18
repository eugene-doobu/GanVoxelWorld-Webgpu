// Bilateral blur for SSAO (depth-edge preserving)

@group(0) @binding(0) var inputTex: texture_2d<f32>;
@group(0) @binding(1) var depthTex: texture_depth_2d;
@group(0) @binding(2) var linearSampler: sampler;

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
  let dims = vec2<f32>(textureDimensions(inputTex));
  let texelSize = 1.0 / dims;
  let pixelCoord = vec2<i32>(input.position.xy);

  let centerAO = textureLoad(inputTex, pixelCoord, 0).r;

  // Sample depth at full resolution matching this UV
  let depthDims = textureDimensions(depthTex);
  let depthPixel = vec2<i32>(vec2<f32>(depthDims) * input.uv);
  let centerDepth = textureLoad(depthTex, depthPixel, 0);

  var result = 0.0;
  var totalWeight = 0.0;

  // 5x5 bilateral blur
  for (var ox = -2i; ox <= 2i; ox++) {
    for (var oy = -2i; oy <= 2i; oy++) {
      let sampleCoord = pixelCoord + vec2<i32>(ox, oy);
      let sampleUV = (vec2<f32>(sampleCoord) + 0.5) / dims;

      let aoSample = textureLoad(inputTex, clamp(sampleCoord, vec2<i32>(0), vec2<i32>(dims) - vec2<i32>(1)), 0).r;

      let sDepthPixel = vec2<i32>(vec2<f32>(depthDims) * sampleUV);
      let sampleDepth = textureLoad(depthTex, clamp(sDepthPixel, vec2<i32>(0), vec2<i32>(depthDims) - vec2<i32>(1)), 0);

      // Depth-based weight (bilateral)
      let depthDiff = abs(centerDepth - sampleDepth);
      let depthWeight = exp(-depthDiff * 1000.0);

      // Spatial weight (gaussian-like)
      let dist = f32(ox * ox + oy * oy);
      let spatialWeight = exp(-dist * 0.2);

      let w = depthWeight * spatialWeight;
      result += aoSample * w;
      totalWeight += w;
    }
  }

  let finalAO = result / max(totalWeight, 0.0001);
  return vec4<f32>(finalAO, finalAO, finalAO, 1.0);
}
