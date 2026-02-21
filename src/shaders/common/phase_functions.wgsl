// Atmospheric scattering phase functions

const PI_PHASE: f32 = 3.14159265359;

fn rayleighPhase(cosTheta: f32) -> f32 {
  return 3.0 / (16.0 * PI_PHASE) * (1.0 + cosTheta * cosTheta);
}

fn hgPhase(cosTheta: f32, g: f32) -> f32 {
  let g2 = g * g;
  let num = 1.0 - g2;
  let denom = 4.0 * PI_PHASE * pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5);
  return num / denom;
}
