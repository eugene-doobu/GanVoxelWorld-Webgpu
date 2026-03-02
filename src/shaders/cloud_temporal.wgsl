// Temporal reprojection for volumetric clouds (half-res fullscreen fragment)
// Blends current frame with reprojected history using neighborhood clamping.

struct TemporalUniforms {
  invViewProj: mat4x4<f32>,     // 0: current frame
  prevViewProj: mat4x4<f32>,    // 64: previous frame
  screenSize: vec4<f32>,        // 128: x=halfW, y=halfH, z=1/halfW, w=1/halfH
  pad: vec4<f32>,               // 144
};

@group(0) @binding(0) var<uniform> temporal: TemporalUniforms;
@group(0) @binding(1) var cloudRaw: texture_2d<f32>;
@group(0) @binding(2) var cloudHistory: texture_2d<f32>;
@group(0) @binding(3) var linearSampler: sampler;

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
  let current = textureSampleLevel(cloudRaw, linearSampler, input.uv, 0.0);

  // Reconstruct world position on far plane from current UV
  let ndc = vec4<f32>(
    input.uv.x * 2.0 - 1.0,
    -(input.uv.y * 2.0 - 1.0),
    1.0,
    1.0,
  );
  let worldH = temporal.invViewProj * ndc;
  let worldPos = worldH.xyz / worldH.w;

  // Reproject world position into previous frame's screen space
  let prevClip = temporal.prevViewProj * vec4<f32>(worldPos, 1.0);
  let prevNDC = prevClip.xy / prevClip.w;
  let prevUV = vec2<f32>(prevNDC.x * 0.5 + 0.5, 1.0 - (prevNDC.y * 0.5 + 0.5));

  // Out-of-bounds check — use current only
  if (prevUV.x < 0.0 || prevUV.x > 1.0 || prevUV.y < 0.0 || prevUV.y > 1.0) {
    return current;
  }

  // Sample history at reprojected UV
  var history = textureSampleLevel(cloudHistory, linearSampler, prevUV, 0.0);

  // Neighborhood clamping (3x3 AABB of current frame)
  let texelSize = temporal.screenSize.zw;
  var minColor = current;
  var maxColor = current;

  for (var dy = -1; dy <= 1; dy++) {
    for (var dx = -1; dx <= 1; dx++) {
      if (dx == 0 && dy == 0) { continue; }
      let offset = vec2<f32>(f32(dx), f32(dy)) * texelSize;
      let neighbor = textureSampleLevel(cloudRaw, linearSampler, input.uv + offset, 0.0);
      minColor = min(minColor, neighbor);
      maxColor = max(maxColor, neighbor);
    }
  }

  // Clamp history to neighborhood AABB
  history = clamp(history, minColor, maxColor);

  // Blend: 5% current, 95% history for temporal stability
  return mix(history, current, 0.05);
}
