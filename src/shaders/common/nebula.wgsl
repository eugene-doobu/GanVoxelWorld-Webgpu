// Night Nebula / Milky Way (3-layer FBM Simplex)
// Requires: snoise3d()

fn sampleNebula(rayDir: vec3<f32>, time: f32) -> vec3<f32> {
  if (rayDir.y < 0.05) { return vec3<f32>(0.0); }

  // Galactic plane: tilted band across the sky (Milky Way-like)
  let galacticNormal = normalize(vec3<f32>(0.35, 0.7, 0.55));
  let galacticDist = abs(dot(rayDir, galacticNormal));
  let bandMask = smoothstep(0.55, 0.15, galacticDist);
  if (bandMask < 0.01) { return vec3<f32>(0.0); }

  // Use ray direction as 3D noise coordinate (seamless on sphere)
  let coord = rayDir * 3.0;
  let t = time * 0.004;

  // Layer 1: Deep blue-violet (dominant nebula mass)
  let p1 = coord + vec3<f32>(0.0, 0.0, t);
  var n1 = snoise3d(p1)         * 0.5
         + snoise3d(p1 * 2.03)  * 0.25
         + snoise3d(p1 * 4.01)  * 0.125
         + snoise3d(p1 * 8.05)  * 0.0625;
  n1 = smoothstep(0.38, 0.65, n1);

  // Layer 2: Warm emission pockets (amber/orange)
  let p2 = coord * 1.3 + vec3<f32>(43.0, 17.0, t * 0.7);
  var n2 = snoise3d(p2)         * 0.5
         + snoise3d(p2 * 1.97)  * 0.25
         + snoise3d(p2 * 3.89)  * 0.125
         + snoise3d(p2 * 7.83)  * 0.0625;
  n2 = smoothstep(0.42, 0.7, n2);

  // Layer 3: Bright blue-white core (star-forming regions, finer detail)
  let p3 = coord * 0.8 + vec3<f32>(91.0, 53.0, t * 0.5);
  var n3 = snoise3d(p3)         * 0.5
         + snoise3d(p3 * 2.11)  * 0.25
         + snoise3d(p3 * 4.27)  * 0.125
         + snoise3d(p3 * 8.53)  * 0.0625
         + snoise3d(p3 * 17.1)  * 0.03125;
  n3 = smoothstep(0.4, 0.68, n3);

  // Color composition
  let col1 = vec3<f32>(0.06, 0.03, 0.14) * n1;  // blue-violet
  let col2 = vec3<f32>(0.10, 0.05, 0.02) * n2;  // warm amber
  let col3 = vec3<f32>(0.05, 0.06, 0.10) * n3;  // blue-white

  // Horizon atmospheric extinction
  let horizFade = smoothstep(0.05, 0.25, rayDir.y);

  return (col1 + col2 + col3) * bandMask * horizFade;
}
