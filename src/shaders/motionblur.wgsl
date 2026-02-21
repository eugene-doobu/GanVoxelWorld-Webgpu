// Per-pixel Motion Blur with center-weighted, velocity-adaptive sampling

struct MotionBlurParams {
  strength: f32,
  samples: f32,  // max number of samples (8)
  _pad0: f32,
  _pad1: f32,
};

@group(0) @binding(0) var hdrTex: texture_2d<f32>;
@group(0) @binding(1) var velocityTex: texture_2d<f32>;
@group(0) @binding(2) var linearSampler: sampler;
@group(0) @binding(3) var<uniform> params: MotionBlurParams;

#include "common/fullscreen_vert.wgsl"

// Soft maximum blur radius in UV space to prevent excessive stretching
const MAX_BLUR_RADIUS: f32 = 0.05;

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let centerColor = textureSampleLevel(hdrTex, linearSampler, input.uv, 0.0);
  let velocity = textureSampleLevel(velocityTex, linearSampler, input.uv, 0.0).rg;
  let speed = length(velocity);

  // Early-out for static or near-static pixels
  if (speed < 0.002) {
    return centerColor;
  }

  // Scale velocity by strength, then soft-clamp magnitude
  var scaledVelocity = velocity * params.strength;
  let scaledSpeed = length(scaledVelocity);

  // Soft clamp: smoothly limit blur radius to MAX_BLUR_RADIUS
  // Uses tanh-like curve: r * maxR / (r + maxR) approaches maxR asymptotically
  let clampedSpeed = scaledSpeed * MAX_BLUR_RADIUS / (scaledSpeed + MAX_BLUR_RADIUS);
  scaledVelocity = scaledVelocity * (clampedSpeed / max(scaledSpeed, 0.0001));

  // Adaptive sample count: scale with velocity magnitude
  // Fewer samples for slow motion, full samples for fast motion
  let maxSamples = i32(params.samples);
  let adaptiveFactor = clamp(scaledSpeed / MAX_BLUR_RADIUS, 0.0, 1.0);
  let numSamples = max(3, i32(f32(maxSamples) * adaptiveFactor));

  let halfSamples = f32(numSamples - 1) * 0.5;

  // Center-weighted accumulation with triangle filter kernel
  var colorAccum = vec3f(0.0);
  var weightAccum = 0.0;
  let centerVelocity = velocity;

  for (var i = 0; i < numSamples; i++) {
    let t = (f32(i) / f32(numSamples - 1)) - 0.5; // range: -0.5 to 0.5
    let sampleUV = clamp(input.uv + scaledVelocity * t, vec2f(0.0), vec2f(1.0));

    // Triangle weight: peaks at center (t=0), falls linearly to edges
    let dist = abs(t) * 2.0; // 0 at center, 1 at edges
    var weight = 1.0 - dist * 0.7; // center=1.0, edges=0.3

    // Velocity-based edge detection: compare sample velocity to center velocity
    // Large velocity difference indicates a depth discontinuity (foreground/background edge)
    let sampleVelocity = textureSampleLevel(velocityTex, linearSampler, sampleUV, 0.0).rg;
    let velocityDiff = length(sampleVelocity - centerVelocity);
    // Reduce weight for samples across velocity discontinuities
    let edgeFade = 1.0 / (1.0 + velocityDiff * 200.0);
    weight *= edgeFade;

    let sampleColor = textureSampleLevel(hdrTex, linearSampler, sampleUV, 0.0).rgb;
    colorAccum += sampleColor * weight;
    weightAccum += weight;
  }

  let blurredColor = colorAccum / max(weightAccum, 0.001);

  return vec4f(blurredColor, 1.0);
}
