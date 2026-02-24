// Multi-layer star field with color temperature and Kolmogorov twinkling
// Requires: hash(), hash2(), PI

fn starColor(h: f32) -> vec3<f32> {
  if (h < 0.15) { return vec3<f32>(0.7, 0.8, 1.0); }       // blue-white (B/A)
  else if (h < 0.60) { return vec3<f32>(1.0, 1.0, 0.95); }  // white (F/G)
  else if (h < 0.85) { return vec3<f32>(1.0, 0.9, 0.7); }   // yellow-white (G/K)
  else { return vec3<f32>(1.0, 0.75, 0.5); }                 // orange (K/M)
}

// Multi-frequency star scintillation (Kolmogorov spectrum approximation)
fn starTwinkle(starTime: f32, phase: f32, elevation: f32) -> f32 {
  var t = sin(starTime * 1.7 + phase) * 0.35;
  t += sin(starTime * 4.3 + phase * 2.1) * 0.2;
  t += sin(starTime * 7.1 + phase * 3.7) * 0.12;
  t += sin(starTime * 13.0 + phase * 5.3) * 0.08;
  let elevFactor = mix(1.5, 0.5, smoothstep(0.0, 0.5, elevation));
  return clamp(0.75 + t * elevFactor, 0.3, 1.4);
}

fn sampleStarField(rayDir: vec3<f32>, elapsedTime: f32) -> vec3<f32> {
  let theta = atan2(rayDir.z, rayDir.x);
  let phi = asin(clamp(rayDir.y, -1.0, 1.0));
  let starTime = elapsedTime % 628.318;
  let elevation = max(rayDir.y, 0.0);

  var stars = vec3<f32>(0.0);

  // Layer 1: bright stars (large cells, ~6% density)
  let scale1 = 70.0;
  let uv1 = vec2<f32>(theta * scale1 / PI, phi * scale1 / (PI * 0.5));
  let cell1 = floor(uv1);
  let h1 = hash2(cell1);
  let offset1 = h1 - 0.5;
  let cellCenter1 = cell1 + 0.5 + offset1 * 0.8;
  let dist1 = length(uv1 - cellCenter1);
  let brightness1 = hash(cell1 + vec2<f32>(7.31, 3.17));
  if (brightness1 > 0.94) {
    let falloff1 = exp(-dist1 * dist1 * 80.0);
    let colorHash1 = hash(cell1 + vec2<f32>(13.7, 29.3));
    let col1 = starColor(colorHash1);
    let twinkle1 = starTwinkle(starTime, brightness1 * 100.0, elevation);
    let intensity1 = (brightness1 - 0.94) / 0.06 * 2.5;
    stars += col1 * falloff1 * twinkle1 * intensity1;
  }

  // Layer 2: medium stars (medium cells, ~3% density)
  let scale2 = 200.0;
  let uv2 = vec2<f32>(theta * scale2 / PI, phi * scale2 / (PI * 0.5));
  let cell2 = floor(uv2);
  let h2 = hash2(cell2);
  let offset2 = h2 - 0.5;
  let cellCenter2 = cell2 + 0.5 + offset2 * 0.8;
  let dist2 = length(uv2 - cellCenter2);
  let brightness2 = hash(cell2 + vec2<f32>(11.13, 5.71));
  if (brightness2 > 0.97) {
    let falloff2 = exp(-dist2 * dist2 * 120.0);
    let colorHash2 = hash(cell2 + vec2<f32>(17.1, 23.9));
    let col2 = starColor(colorHash2);
    let twinkle2 = starTwinkle(starTime, brightness2 * 77.0, elevation);
    let intensity2 = (brightness2 - 0.97) / 0.03 * 1.2;
    stars += col2 * falloff2 * twinkle2 * intensity2;
  }

  // Layer 3: star dust (fine cells, ~4% density, no twinkling)
  let scale3 = 500.0;
  let uv3 = vec2<f32>(theta * scale3 / PI, phi * scale3 / (PI * 0.5));
  let cell3 = floor(uv3);
  let h3 = hash2(cell3);
  let offset3 = h3 - 0.5;
  let cellCenter3 = cell3 + 0.5 + offset3 * 0.8;
  let dist3 = length(uv3 - cellCenter3);
  let brightness3 = hash(cell3 + vec2<f32>(19.37, 7.93));
  if (brightness3 > 0.96) {
    let falloff3 = exp(-dist3 * dist3 * 200.0);
    let intensity3 = (brightness3 - 0.96) / 0.04 * 0.3;
    stars += vec3<f32>(0.9, 0.92, 1.0) * falloff3 * intensity3;
  }

  return stars;
}
