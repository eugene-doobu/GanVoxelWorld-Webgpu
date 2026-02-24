// Shared SceneUniforms struct — included by sky.wgsl, lighting.wgsl, etc.
// Total size: 256 bytes (16-byte aligned)

struct SceneUniforms {
  invViewProj: mat4x4<f32>,          // 64  bytes (offset 0)
  cameraPos: vec4<f32>,              // 16  bytes (offset 64)  — xyz=position, w=waterLevel
  lightDir: vec4<f32>,               // 16  bytes (offset 80)  — xyz=sun(day)/moon(night), w=elapsedTime
  sunColor: vec4<f32>,               // 16  bytes (offset 96)  — rgb=color, w=intensity
  ambientColor: vec4<f32>,           // 16  bytes (offset 112) — rgb=ambient, w=groundFactor
  fogParams: vec4<f32>,              // 16  bytes (offset 128) — x=start, y=end, z=skyPackedParams, w=cloudCoverage
  cloudParams: vec4<f32>,            // 16  bytes (offset 144) — x=baseNoiseScale, y=extinction, z=multiScatterFloor, w=detailStrength
  viewProj: mat4x4<f32>,            // 64  bytes (offset 160) — unjittered viewProj for contact shadow / velocity
  contactShadowParams: vec4<f32>,    // 16  bytes (offset 224) — x=enabled, y=maxSteps, z=rayLength, w=thickness
  skyNightParams: vec4<f32>,         // 16  bytes (offset 240) — x=moonPhase, y=moonBrightness, z=elapsedTime, w=trueSunHeight
};
