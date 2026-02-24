// Deterministic meteor (shooting star) system — no state needed
// Requires: hash2(), PI

fn sampleMeteor(rayDir: vec3<f32>, time: f32) -> vec3<f32> {
  var result = vec3<f32>(0.0);
  for (var i = 0u; i < 4u; i++) {
    let slot = f32(i);
    // Per-slot period: 15~25 second intervals
    let period = 18.0 + slot * 3.7;
    let phase = floor(time / period);
    let localT = fract(time / period);
    // Active window: 0.0~0.08 (~8% of period = ~1.5s visible)
    if (localT > 0.08) { continue; }
    let t = localT / 0.08; // 0→1 over lifetime

    // Start point: hash-determined on upper hemisphere
    let h = hash2(vec2<f32>(phase * 17.3 + slot * 7.1, slot * 13.7 + 0.5));
    let theta0 = h.x * 2.0 * PI;
    let phi0 = 0.3 + h.y * 0.5; // elevation 17°~46°
    let startDir = vec3<f32>(cos(theta0) * cos(phi0), sin(phi0), sin(theta0) * cos(phi0));

    // Drift direction (slightly downward)
    let h2 = hash2(vec2<f32>(phase * 31.1 + slot, slot * 23.3));
    let drift = normalize(vec3<f32>(h2.x - 0.5, -0.3, h2.y - 0.5));
    let trailLen = 0.06;
    let headPos = normalize(startDir + drift * t * 0.3);

    let headDot = dot(rayDir, headPos);
    let headAngle = acos(clamp(headDot, -1.0, 1.0));

    let tailPos = normalize(startDir + drift * max(t - trailLen, 0.0) * 0.3);

    let brightness = smoothstep(0.0, 0.15, t) * smoothstep(1.0, 0.5, t);
    let glow = exp(-headAngle * headAngle * 15000.0) * brightness * 3.0;

    let midPos = normalize(mix(headPos, tailPos, 0.5));
    let midDot = dot(rayDir, midPos);
    let midAngle = acos(clamp(midDot, -1.0, 1.0));
    let tailGlow = exp(-midAngle * midAngle * 5000.0) * brightness * 1.0;

    let meteorColor = vec3<f32>(0.9, 0.85, 0.7);
    result += meteorColor * (glow + tailGlow);
  }
  return result;
}
