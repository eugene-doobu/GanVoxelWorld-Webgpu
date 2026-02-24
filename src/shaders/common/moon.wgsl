// Procedural moon: albedo, N·L shading, Mie glow
// Requires: snoise3d(), PI

fn moonAlbedo(sp: vec3<f32>) -> vec3<f32> {
  let highland = vec3<f32>(0.75, 0.73, 0.70);
  let maria = vec3<f32>(0.35, 0.33, 0.30);

  let m1 = snoise3d(sp * 1.8 + vec3<f32>(42.0, 17.0, 0.0));
  let m2 = snoise3d(sp * 0.9 + vec3<f32>(7.0, 31.0, 0.0));
  let mariaMask = smoothstep(0.35, 0.65, m1 * 0.6 + m2 * 0.4);
  var albedo = mix(maria, highland, mariaMask);

  let c1 = snoise3d(sp * 5.0 + vec3<f32>(100.0, 0.0, 0.0));
  albedo += vec3<f32>(smoothstep(0.42, 0.48, c1) * 0.15);
  let c2 = snoise3d(sp * 12.0 + vec3<f32>(0.0, 100.0, 0.0));
  albedo += vec3<f32>(smoothstep(0.40, 0.50, c2) * 0.10);
  albedo += vec3<f32>((snoise3d(sp * 25.0 + vec3<f32>(0.0, 0.0, 100.0)) - 0.5) * 0.08);

  return albedo;
}

// Moon shading: N·L diffuse on sphere — phase + 3D shape in one
fn moonShading(nx: f32, ny: f32, moonPhase: f32) -> vec3<f32> {
  let r2 = nx * nx + ny * ny;
  if (r2 > 1.0) { return vec3<f32>(0.0); }

  let nz = sqrt(1.0 - r2);
  let N = vec3<f32>(nx, ny, nz);

  // Light direction from phase (moon-local space)
  let L = vec3<f32>(sin(moonPhase * 2.0 * PI), 0.0, -cos(moonPhase * 2.0 * PI));

  let NdotL = dot(N, L);
  let diffuse = smoothstep(-0.02, 0.08, NdotL);

  let albedo = moonAlbedo(N);
  let litColor = albedo * vec3<f32>(1.1, 1.15, 1.3) * diffuse * 2.2;
  let earthshine = albedo * vec3<f32>(0.012, 0.013, 0.018) * (1.0 - diffuse);

  return litColor + earthshine;
}

// Continuous Mie-based moon glow (no discontinuities)
fn moonGlow(moonDot: f32, moonBrightness: f32) -> vec3<f32> {
  let angle = acos(clamp(moonDot, -1.0, 1.0));
  let inner = exp(-angle * angle * 8000.0) * vec3<f32>(0.20, 0.22, 0.30);
  let corona = exp(-angle * angle * 800.0) * vec3<f32>(0.08, 0.09, 0.15);
  let halo = exp(-angle * 60.0) * vec3<f32>(0.015, 0.018, 0.035);
  return (inner + corona + halo) * moonBrightness;
}
