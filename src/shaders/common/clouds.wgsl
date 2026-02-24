// Volumetric cloud ray marching
// Requires: snoise3d(), scene uniform (cloudParams, fogParams, skyNightParams)

const CLOUD_MIN_Y: f32 = 300.0;
const CLOUD_MAX_Y: f32 = 500.0;
const CLOUD_MAX_STEPS: u32 = 40u;
const CLOUD_MIN_STEPS: u32 = 16u;
const CLOUD_LIGHT_STEPS: u32 = 5u;
const CLOUD_LIGHT_STEPS_FAR: u32 = 3u;
const CLOUD_FAR_THRESHOLD: f32 = 5000.0;

fn remap01(v: f32, low: f32, high: f32) -> f32 {
  return clamp((v - low) / (high - low), 0.0, 1.0);
}

fn cloudHeightGradient(h: f32) -> f32 {
  return smoothstep(0.0, 0.15, h) * smoothstep(1.0, 0.5, h);
}

fn sampleCloudDensity(worldPos: vec3<f32>, time: f32, cheap: bool, coverage: f32) -> f32 {
  let heightFrac = clamp((worldPos.y - CLOUD_MIN_Y) / (CLOUD_MAX_Y - CLOUD_MIN_Y), 0.0, 1.0);
  let hGrad = cloudHeightGradient(heightFrac);
  if (hGrad < 0.001) { return 0.0; }

  let wind = vec3<f32>(time * 15.0, time * 0.9, time * 6.0);

  // Base shape: 3-octave FBM
  let bp = (worldPos + wind) * scene.cloudParams.x;
  var shape = snoise3d(bp)         * 0.625
            + snoise3d(bp * 2.03)  * 0.25
            + snoise3d(bp * 4.01)  * 0.125;

  let threshold = 1.0 - coverage;
  shape = remap01(shape, threshold, threshold + 0.35);
  var density = shape * hGrad;

  if (density < 0.01) { return 0.0; }

  // Detail erosion
  if (!cheap) {
    let dp = (worldPos + wind * 0.3) * 0.008;
    let detail = snoise3d(dp)          * 0.5
               + snoise3d(dp * 2.37)   * 0.3
               + snoise3d(dp * 5.09)   * 0.2;
    density -= detail * scene.cloudParams.w;
    density = max(density, 0.0);
  }

  return density;
}

fn raymarchClouds(rayOrigin: vec3<f32>, rayDir: vec3<f32>, lightDir: vec3<f32>, sunColor: vec3<f32>, time: f32, dayFactor: f32) -> vec4<f32> {
  if (rayDir.y <= 0.002) {
    return vec4<f32>(0.0);
  }

  let tMin = (CLOUD_MIN_Y - rayOrigin.y) / rayDir.y;
  let tMax = (CLOUD_MAX_Y - rayOrigin.y) / rayDir.y;

  if (tMin > tMax || tMax < 0.0) {
    return vec4<f32>(0.0);
  }

  let tStart = max(tMin, 0.0);
  let tEnd = min(tMax, 8000.0);

  // Adaptive step count: steep rays traverse cloud layer faster → fewer steps needed
  let verticalFrac = clamp(rayDir.y * 5.0, 0.0, 1.0);  // 0 at horizon, 1 at ~11.5°+
  let numSteps = u32(mix(f32(CLOUD_MAX_STEPS), f32(CLOUD_MIN_STEPS), verticalFrac));
  let stepSize = (tEnd - tStart) / f32(numSteps);

  // Coverage pre-computed on CPU (includes time-varying noise)
  let coverage = scene.fogParams.w;

  let cosTheta = dot(rayDir, lightDir);
  let silverLining = pow(clamp(cosTheta, 0.0, 1.0), 5.0);

  var transmittance = 1.0;
  var scatteredLight = vec3<f32>(0.0);
  let lightStepSize = 35.0;

  // Day palette
  let dayShadow = vec3<f32>(0.55, 0.65, 0.85);
  let dayLit = sunColor * 0.95 + vec3<f32>(0.05);

  // Night palette: moonBrightness-dependent
  let mb = scene.skyNightParams.y;
  let nightShadow = vec3<f32>(0.012, 0.015, 0.030) + vec3<f32>(0.008, 0.010, 0.015) * mb;
  let nightLit = vec3<f32>(0.08, 0.10, 0.18) + vec3<f32>(0.06, 0.07, 0.10) * mb;

  let shadowColor = mix(nightShadow, dayShadow, dayFactor);
  let litColor = mix(nightLit, dayLit, dayFactor);
  let silverStr = mix(0.15, 0.5, dayFactor);

  for (var i = 0u; i < numSteps; i++) {
    let t = tStart + (f32(i) + 0.5) * stepSize;
    let pos = rayOrigin + rayDir * t;

    let density = sampleCloudDensity(pos, time, false, coverage);
    if (density < 0.01) { continue; }

    let extinction = density * scene.cloudParams.y;

    // Light march — fewer steps for distant samples
    let lightSteps = select(CLOUD_LIGHT_STEPS, CLOUD_LIGHT_STEPS_FAR, t > CLOUD_FAR_THRESHOLD);
    var lightOD = 0.0;
    for (var j = 1u; j <= lightSteps; j++) {
      let lPos = pos + lightDir * lightStepSize * f32(j);
      lightOD += sampleCloudDensity(lPos, time, true, coverage) * lightStepSize;
    }

    let beer = exp(-lightOD * 0.15);
    let msFloor = scene.cloudParams.z;
    let brightness = beer * (1.0 - msFloor) + msFloor;

    var cloudColor = mix(shadowColor, litColor, beer) * brightness;
    cloudColor += litColor * silverLining * beer * silverStr;

    let sampleTrans = exp(-extinction * stepSize);

    let sampleScatter = cloudColor * density;
    scatteredLight += transmittance * sampleScatter * (1.0 - sampleTrans) / max(extinction, 0.0001);
    transmittance *= sampleTrans;

    if (transmittance < 0.03) { break; }
  }

  let avgDist = (tStart + tEnd) * 0.5;
  let aerialFade = exp(-avgDist * 0.0001);
  let alpha = (1.0 - transmittance) * aerialFade;

  return vec4<f32>(scatteredLight, alpha);
}
