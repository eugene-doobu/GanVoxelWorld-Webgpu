// Velocity pass: compute per-pixel motion vectors from depth reprojection

struct VelocityUniforms {
  invViewProj: mat4x4<f32>,      // current frame (unjittered)
  prevViewProj: mat4x4<f32>,     // previous frame (unjittered)
};

@group(0) @binding(0) var<uniform> uniforms: VelocityUniforms;
@group(0) @binding(1) var depthTex: texture_depth_2d;

#include "common/fullscreen_vert.wgsl"

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec2<f32> {
  let pixelCoord = vec2<i32>(input.position.xy);
  let depth = textureLoad(depthTex, pixelCoord, 0);

  // Sky pixels: zero velocity
  if (depth >= 1.0) {
    return vec2<f32>(0.0, 0.0);
  }

  // Reconstruct world position from depth (unjittered)
  let ndc = vec4<f32>(
    input.uv.x * 2.0 - 1.0,
    -(input.uv.y * 2.0 - 1.0),
    depth,
    1.0
  );
  let worldH = uniforms.invViewProj * ndc;
  let worldPos = worldH.xyz / worldH.w;

  // Reproject to previous frame
  let prevClip = uniforms.prevViewProj * vec4<f32>(worldPos, 1.0);
  let prevNDC = prevClip.xyz / prevClip.w;
  let prevUV = vec2<f32>(prevNDC.x * 0.5 + 0.5, 0.5 - prevNDC.y * 0.5);

  // Velocity = current UV - previous UV
  let velocity = input.uv - prevUV;

  return velocity;
}
