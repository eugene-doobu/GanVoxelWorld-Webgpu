// Depth of Field with signed Circle of Confusion (near/far separation)

struct DoFParams {
  focusDistance: f32,  // world-space focus distance
  aperture: f32,      // aperture size (controls blur amount)
  maxBlur: f32,       // max blur radius in pixels
  nearPlane: f32,
  farPlane: f32,
  _pad0: f32,
  _pad1: f32,
  _pad2: f32,
};

@group(0) @binding(0) var hdrTex: texture_2d<f32>;
@group(0) @binding(1) var depthTex: texture_depth_2d;
@group(0) @binding(2) var linearSampler: sampler;
@group(0) @binding(3) var<uniform> params: DoFParams;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex
fn vs_main(@builtin(vertex_index) vid: u32) -> VertexOutput {
  var output: VertexOutput;
  let x = f32(i32(vid & 1u)) * 4.0 - 1.0;
  let y = f32(i32(vid >> 1u)) * 4.0 - 1.0;
  output.position = vec4<f32>(x, y, 0.0, 1.0);
  output.uv = vec2<f32>(x * 0.5 + 0.5, 1.0 - (y * 0.5 + 0.5));
  return output;
}

fn linearizeDepth(d: f32) -> f32 {
  let near = params.nearPlane;
  let far = params.farPlane;
  return near * far / (far - d * (far - near));
}

// Signed CoC: negative = foreground (near), positive = background (far)
fn calcSignedCoC(linearDepth: f32) -> f32 {
  return (linearDepth - params.focusDistance) * params.aperture / linearDepth;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let pixelCoord = vec2i(input.position.xy);
  let rawDepth = textureLoad(depthTex, pixelCoord, 0);
  let linearDepth = linearizeDepth(rawDepth);
  let dims = vec2f(textureDimensions(hdrTex));
  let texelSize = 1.0 / dims;

  // Sky detection: raw depth ~1.0 means infinitely far
  let isSky = rawDepth >= 0.999;

  // Signed CoC for this pixel
  var signedCoC: f32;
  if (isSky) {
    // Sky is infinitely far -> max far CoC
    signedCoC = params.maxBlur;
  } else {
    signedCoC = calcSignedCoC(linearDepth);
  }

  let absCoC = min(abs(signedCoC), params.maxBlur);

  // Skip blur if well within focus
  if (absCoC < 0.5) {
    return textureSampleLevel(hdrTex, linearSampler, input.uv, 0.0);
  }

  let centerIsNear = signedCoC < 0.0;

  // 32-sample Fibonacci spiral disc sampling
  let goldenAngle = 2.39996323;
  let numSamples = 32;

  var nearColor  = vec3f(0.0);
  var nearWeight = 0.0;
  var farColor   = vec3f(0.0);
  var farWeight  = 0.0;

  for (var i = 0; i < numSamples; i++) {
    // Uniform disc distribution via square-root spacing
    let fi = f32(i);
    let fn = f32(numSamples);
    let r = sqrt((fi + 0.5) / fn);
    let theta = fi * goldenAngle;
    let unitOffset = vec2f(cos(theta), sin(theta)) * r;

    let sampleOffset = unitOffset * absCoC * texelSize;
    let sampleUV = clamp(input.uv + sampleOffset, vec2f(0.001), vec2f(0.999));

    // Read sample color and depth
    let sampleColor = textureSampleLevel(hdrTex, linearSampler, sampleUV, 0.0).rgb;
    let samplePixel = vec2i(sampleUV * dims);
    let sampleRawDepth = textureLoad(depthTex, samplePixel, 0);
    let sampleLinear = linearizeDepth(sampleRawDepth);
    let sampleIsSky = sampleRawDepth >= 0.999;

    // Signed CoC of the sample
    var sampleSCoC: f32;
    if (sampleIsSky) {
      sampleSCoC = params.maxBlur;
    } else {
      sampleSCoC = calcSignedCoC(sampleLinear);
    }
    let sampleAbsCoC = min(abs(sampleSCoC), params.maxBlur);

    // Soft circular kernel weight: attenuate samples near disc edge
    let kernelWeight = 1.0 - smoothstep(0.8, 1.0, r);

    // Near field (foreground): spreads OVER in-focus regions
    // Use max(sampleCoC, centerCoC) trick so foreground bokeh bleeds outward
    if (sampleSCoC < 0.0 || centerIsNear) {
      let nearCoC = select(absCoC, max(sampleAbsCoC, absCoC), sampleSCoC < 0.0);
      let w = kernelWeight * smoothstep(0.0, 2.0, nearCoC);
      nearColor += sampleColor * w;
      nearWeight += w;
    }

    // Far field (background): only gather from background or in-focus pixels
    if (sampleSCoC >= 0.0) {
      let w = kernelWeight * smoothstep(0.0, 2.0, sampleAbsCoC);
      farColor += sampleColor * w;
      farWeight += w;
    }
  }

  // Normalize accumulated colors
  if (nearWeight > 0.0) {
    nearColor /= nearWeight;
  }
  if (farWeight > 0.0) {
    farColor /= farWeight;
  }

  // Compose near and far layers
  var blurred: vec3f;
  if (centerIsNear) {
    // Foreground pixel: near field dominates, blend in far if available
    let farMix = select(0.0, 0.3, farWeight > 0.0);
    blurred = mix(nearColor, farColor, farMix);
  } else {
    // Background pixel: far field dominates, near can bleed over
    if (nearWeight > 0.0 && nearWeight > farWeight * 0.5) {
      // Strong foreground presence -> blend near over far
      let nearInfluence = saturate(nearWeight / (nearWeight + farWeight));
      blurred = mix(farColor, nearColor, nearInfluence * 0.6);
    } else {
      blurred = farColor;
    }
  }

  // Handle edge case where no samples accumulated
  let hasAny = (nearWeight + farWeight) > 0.0;
  if (!hasAny) {
    blurred = textureSampleLevel(hdrTex, linearSampler, input.uv, 0.0).rgb;
  }

  // Smooth transition from sharp to blurred (wider range avoids hard edges)
  let original = textureSampleLevel(hdrTex, linearSampler, input.uv, 0.0).rgb;
  let blendFactor = smoothstep(0.5, 3.0, absCoC);
  let finalColor = mix(original, blurred, blendFactor);

  return vec4f(finalColor, 1.0);
}
