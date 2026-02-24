// Aurora Borealis — analytic curtain sheet + vertical rays
// Requires: snoise3d(), AURORA_SPEED

fn sampleAurora(rayDir: vec3<f32>, cameraPos: vec3<f32>, time: f32) -> vec4<f32> {
  let up = rayDir.y;
  if (up < 0.05) { return vec4<f32>(0.0); }

  // Elevation envelope: ~3°~50° range
  let elevMask = smoothstep(0.05, 0.15, up) * smoothstep(0.85, 0.45, up);
  if (elevMask < 0.001) { return vec4<f32>(0.0); }

  let t = time * AURORA_SPEED;
  let azimuth = atan2(rayDir.x, rayDir.z);

  // Curtain ribbon position (low-freq wobble)
  let curtainBaseElev = 0.32;
  let wobble1 = (snoise3d(vec3<f32>(azimuth * 0.4, t * 0.08, 0.0)) - 0.5) * 0.24;
  let wobble2 = (snoise3d(vec3<f32>(azimuth * 0.15 + 5.0, t * 0.05, 3.0)) - 0.5) * 0.12;
  let curtainCenter = curtainBaseElev + wobble1 + wobble2;
  let distToCurtain = up - curtainCenter;

  // Vertical profile: sharp cutoff below curtain, exp decay above
  let belowCutoff = smoothstep(-0.02, 0.0, distToCurtain);
  let verticalDecay = exp(-max(distToCurtain, 0.0) * 4.5);
  let verticalProfile = belowCutoff * verticalDecay;
  if (verticalProfile < 0.005) { return vec4<f32>(0.0); }

  // Curtain fold brightness modulation
  let foldNoise = snoise3d(vec3<f32>(azimuth * 1.5, t * 0.12, 7.0));
  let foldIntensity = foldNoise * 0.7 + 0.3;

  // Vertical ray structure (high-freq 1D ridge detection)
  let rayN1 = snoise3d(vec3<f32>(azimuth * 8.0, t * 0.3, 13.0));
  let rayN2 = snoise3d(vec3<f32>(azimuth * 22.0 + 50.0, t * 0.6, 17.0));
  let ray1 = pow(max(1.0 - 2.5 * abs(rayN1 - 0.5), 0.0), 1.5);
  let ray2 = pow(max(1.0 - 3.0 * abs(rayN2 - 0.5), 0.0), 2.0);
  let rayStructure = ray1 * 0.7 + ray2 * 0.3;
  let raySharpness = mix(rayStructure, 0.5 * (rayStructure + 0.5),
                         smoothstep(0.0, 0.3, distToCurtain));

  // Temporal shimmer
  let shimmer = snoise3d(vec3<f32>(azimuth * 4.0, t * 1.2, 23.0));
  let shimmerFactor = 0.7 + shimmer * 0.3;

  let intensity = verticalProfile * raySharpness * foldIntensity * shimmerFactor;

  // Altitude-based color (green → cyan → magenta → red)
  let heightFrac = clamp(distToCurtain / 0.35, 0.0, 1.0);
  let green   = vec3<f32>(0.2, 1.0, 0.3);
  let cyan    = vec3<f32>(0.1, 0.6, 0.4);
  let magenta = vec3<f32>(0.5, 0.1, 0.4);
  let red     = vec3<f32>(0.4, 0.05, 0.15);
  var auroraColor: vec3<f32>;
  if (heightFrac < 0.3) {
    auroraColor = mix(green, cyan, heightFrac / 0.3);
  } else if (heightFrac < 0.65) {
    auroraColor = mix(cyan, magenta, (heightFrac - 0.3) / 0.35);
  } else {
    auroraColor = mix(magenta, red, (heightFrac - 0.65) / 0.35);
  }

  // Subtle green hem glow at bottom edge (557.7nm atomic O emission peak)
  let hemGlow = exp(-max(distToCurtain, 0.0) * 20.0) * 0.5;
  auroraColor += green * hemGlow;

  let finalColor = auroraColor * intensity * 0.5 * elevMask;
  let alpha = clamp(intensity * 0.8, 0.0, 1.0) * elevMask;
  return vec4<f32>(finalColor, alpha);
}
