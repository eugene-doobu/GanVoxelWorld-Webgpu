// GPU Frustum Culling Compute Shader
// Tests chunk AABBs against 6 frustum planes and writes indirect draw arguments.

struct ChunkMeta {
  // AABB: min(xyz) + indexCount in w
  aabbMin: vec4<f32>,
  // AABB: max(xyz) + firstIndex as u32 bits in w
  aabbMax: vec4<f32>,
  // indexOffset (byte offset into index buffer for baseIndex calculation)
  // vertexOffset, firstIndex, padding
  offsets: vec4<u32>,
};

struct FrustumPlanes {
  planes: array<vec4<f32>, 6>,
};

struct DrawIndexedIndirectArgs {
  indexCount: u32,
  instanceCount: u32,
  firstIndex: u32,
  baseVertex: i32,
  firstInstance: u32,
};

@group(0) @binding(0) var<storage, read> chunkMetas: array<ChunkMeta>;
@group(0) @binding(1) var<uniform> frustum: FrustumPlanes;
@group(0) @binding(2) var<storage, read_write> indirectArgs: array<DrawIndexedIndirectArgs>;
@group(0) @binding(3) var<uniform> params: vec4<u32>; // x = chunkCount

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let idx = gid.x;
  if (idx >= params.x) { return; }

  let meta = chunkMetas[idx];
  let aabbMin = meta.aabbMin.xyz;
  let aabbMax = meta.aabbMax.xyz;
  let indexCount = bitcast<u32>(meta.aabbMin.w);

  // Skip empty chunks
  if (indexCount == 0u) {
    indirectArgs[idx].indexCount = 0u;
    indirectArgs[idx].instanceCount = 0u;
    return;
  }

  // Frustum culling: test AABB against 6 planes
  var visible = true;
  for (var p = 0u; p < 6u; p = p + 1u) {
    let plane = frustum.planes[p];
    // Positive vertex: the corner most in the direction of the plane normal
    let px = select(aabbMin.x, aabbMax.x, plane.x > 0.0);
    let py = select(aabbMin.y, aabbMax.y, plane.y > 0.0);
    let pz = select(aabbMin.z, aabbMax.z, plane.z > 0.0);
    if (plane.x * px + plane.y * py + plane.z * pz + plane.w < 0.0) {
      visible = false;
      break;
    }
  }

  if (visible) {
    indirectArgs[idx].indexCount = indexCount;
    indirectArgs[idx].instanceCount = 1u;
    indirectArgs[idx].firstIndex = meta.offsets.x;
    indirectArgs[idx].baseVertex = bitcast<i32>(meta.offsets.y);
    indirectArgs[idx].firstInstance = 0u;
  } else {
    indirectArgs[idx].indexCount = 0u;
    indirectArgs[idx].instanceCount = 0u;
    indirectArgs[idx].firstIndex = 0u;
    indirectArgs[idx].baseVertex = 0i;
    indirectArgs[idx].firstInstance = 0u;
  }
}
