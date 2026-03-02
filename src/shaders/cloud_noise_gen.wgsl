// 3D Cloud noise texture generator (compute shader)
// Generates multi-octave FBM based on Simplex noise into 3D textures.
// FBM is centered: snoise3d [0,1] → [-1,1] → sum → remap [0,1]
// This gives wider distribution (std ≈ 0.25) vs the uncentered version (std ≈ 0.05).

#include "common/noise.wgsl"

@group(0) @binding(0) var outputTex: texture_storage_3d<rgba8unorm, write>;

struct Params {
  texSize: f32,
  baseFreq: f32,
  isDetail: f32,  // 0 = shape, 1 = detail
  pad: f32,
};
@group(0) @binding(1) var<uniform> params: Params;

fn fbm4(p: vec3<f32>, freq: f32) -> f32 {
  var value = 0.0;
  var amplitude = 0.5;
  var pos = p * freq;
  for (var i = 0u; i < 4u; i++) {
    let n = snoise3d(pos) * 2.0 - 1.0;
    value += n * amplitude;
    pos *= 2.0;
    amplitude *= 0.5;
  }
  return clamp(value * 0.5 + 0.5, 0.0, 1.0);
}

@compute @workgroup_size(4, 4, 4)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let size = u32(params.texSize);
  if (id.x >= size || id.y >= size || id.z >= size) {
    return;
  }

  let uvw = vec3<f32>(id) / params.texSize;
  let freq = params.baseFreq;

  var result: vec4<f32>;
  if (params.isDetail < 0.5) {
    // Shape noise (128^3): 4 channels at increasing frequencies
    result = vec4<f32>(
      fbm4(uvw, freq * 4.0),    // R: base shape
      fbm4(uvw, freq * 8.0),    // G: mid detail
      fbm4(uvw, freq * 16.0),   // B: fine detail
      fbm4(uvw, freq * 2.0),    // A: coverage modulation
    );
  } else {
    // Detail noise (32^3): high-frequency FBM
    result = vec4<f32>(
      fbm4(uvw, freq * 8.0),
      fbm4(uvw, freq * 16.0),
      fbm4(uvw, freq * 32.0),
      1.0,
    );
  }

  textureStore(outputTex, id, result);
}
