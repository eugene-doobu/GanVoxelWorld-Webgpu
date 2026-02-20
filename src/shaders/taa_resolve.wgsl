// TAA Resolve: blend current frame with clamped history

struct TAAUniforms {
  blendFactor: f32,
  _pad0: f32,
  _pad1: f32,
  _pad2: f32,
};

@group(0) @binding(0) var<uniform> uniforms: TAAUniforms;
@group(0) @binding(1) var currentTex: texture_2d<f32>;
@group(0) @binding(2) var historyTex: texture_2d<f32>;
@group(0) @binding(3) var velocityTex: texture_2d<f32>;
@group(0) @binding(4) var linearSampler: sampler;

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

// Clip color to AABB (Playdead-style)
fn clipAABB(aabbMin: vec3<f32>, aabbMax: vec3<f32>, color: vec3<f32>) -> vec3<f32> {
  let center = (aabbMin + aabbMax) * 0.5;
  let extent = (aabbMax - aabbMin) * 0.5 + vec3<f32>(0.0001);
  let offset = color - center;
  let ts = abs(extent / (abs(offset) + vec3<f32>(0.0001)));
  let t = min(min(ts.x, ts.y), ts.z);
  if (t < 1.0) {
    return center + offset * t;
  }
  return color;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let pixelCoord = vec2<i32>(input.position.xy);
  let dims = textureDimensions(currentTex);

  // Current color
  let currentColor = textureLoad(currentTex, pixelCoord, 0).rgb;

  // Velocity
  let velocity = textureLoad(velocityTex, pixelCoord, 0).rg;

  // History UV (reprojected)
  let historyUV = input.uv - velocity;

  // Check if history UV is valid
  if (historyUV.x < 0.0 || historyUV.x > 1.0 || historyUV.y < 0.0 || historyUV.y > 1.0) {
    return vec4<f32>(currentColor, 1.0);
  }

  // Sample history (bilinear)
  let historyColor = textureSampleLevel(historyTex, linearSampler, historyUV, 0.0).rgb;

  // 3x3 neighborhood min/max for anti-ghosting
  var nMin = currentColor;
  var nMax = currentColor;

  for (var ox = -1i; ox <= 1i; ox++) {
    for (var oy = -1i; oy <= 1i; oy++) {
      let coord = clamp(pixelCoord + vec2<i32>(ox, oy), vec2<i32>(0), vec2<i32>(dims) - vec2<i32>(1));
      let s = textureLoad(currentTex, coord, 0).rgb;
      nMin = min(nMin, s);
      nMax = max(nMax, s);
    }
  }

  // Clip history to neighborhood AABB
  let clampedHistory = clipAABB(nMin, nMax, historyColor);

  // Blend
  let result = mix(currentColor, clampedHistory, uniforms.blendFactor);

  return vec4<f32>(result, 1.0);
}
