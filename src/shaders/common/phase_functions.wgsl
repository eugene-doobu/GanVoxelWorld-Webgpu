// Atmospheric scattering phase functions
// Requires: PI (from common/constants.wgsl)

fn rayleighPhase(cosTheta: f32) -> f32 {
  return 3.0 / (16.0 * PI) * (1.0 + cosTheta * cosTheta);
}

fn hgPhase(cosTheta: f32, g: f32) -> f32 {
  let g2 = g * g;
  let num = 1.0 - g2;
  let base = max(1.0 + g2 - 2.0 * g * cosTheta, 0.0);
  let denom = max(4.0 * PI * pow(base, 1.5), 0.0001);
  return num / denom;
}
