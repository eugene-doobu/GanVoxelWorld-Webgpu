// Reconstruct world position from screen UV + depth + inverse view-projection matrix.

fn reconstructWorldPos(uv: vec2<f32>, depth: f32, invViewProj: mat4x4<f32>) -> vec3<f32> {
  let ndc = vec4<f32>(uv * 2.0 - 1.0, depth, 1.0);
  let ndcFlipped = vec4<f32>(ndc.x, -ndc.y, ndc.z, 1.0);
  let worldH = invViewProj * ndcFlipped;
  return worldH.xyz / worldH.w;
}
