// Atmospheric scattering sky with day-night cycle — orchestrator

#include "common/scene_uniforms.wgsl"

@group(0) @binding(0) var<uniform> scene: SceneUniforms;
@group(0) @binding(1) var gDepth: texture_depth_2d;

const PI: f32 = 3.14159265359;
const AURORA_SPEED: f32 = 0.03;

#include "common/fullscreen_vert.wgsl"
#include "common/phase_functions.wgsl"
#include "common/sky_hash.wgsl"
#include "common/noise.wgsl"
#include "common/stars.wgsl"
#include "common/nebula.wgsl"
#include "common/moon.wgsl"
#include "common/meteor.wgsl"
#include "common/aurora.wgsl"
#include "common/clouds.wgsl"

// Night sky gradient (zenith to horizon)
fn nightSkyGradient(up: f32) -> vec3<f32> {
  let zenith = vec3<f32>(0.003, 0.005, 0.018);
  let horizon = vec3<f32>(0.012, 0.015, 0.028);
  return mix(horizon, zenith, pow(max(up, 0.0), 0.5));
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  // Only render where depth == 1.0 (sky pixels)
  let pixelCoord = vec2<i32>(input.position.xy);
  let depth = textureLoad(gDepth, pixelCoord, 0);
  if (depth < 1.0) {
    discard;
  }

  // Reconstruct ray direction
  let ndc = vec4<f32>(
    input.uv.x * 2.0 - 1.0,
    -(input.uv.y * 2.0 - 1.0),
    1.0,
    1.0
  );
  let worldH = scene.invViewProj * ndc;
  let rayDir = normalize(worldH.xyz / worldH.w - scene.cameraPos.xyz);

  let lightDir = normalize(scene.lightDir.xyz);
  let up = rayDir.y;
  let cosTheta = dot(rayDir, lightDir);
  let lightHeight = lightDir.y;

  // trueSunHeight: CPU-computed real sun position, immune to day/night lightDir switching
  let trueSunHeight = scene.skyNightParams.w;
  let dayFactor = smoothstep(-0.15, 0.1, trueSunHeight);
  let nightFactor = 1.0 - dayFactor;

  // === Rayleigh scattering ===
  let rayleigh = rayleighPhase(cosTheta);
  let altitude = max(up, 0.0);
  let opticalDepth = exp(-altitude * 4.0);
  let rayleighColor = vec3<f32>(0.3, 0.55, 0.95) * rayleigh * opticalDepth;

  // === Mie scattering (sun halo) ===
  let mie = hgPhase(cosTheta, 0.76);
  let mieColor = vec3<f32>(1.0, 0.95, 0.85) * mie * 0.02;

  // === Day sky ===
  let zenithColor = vec3<f32>(0.22, 0.40, 0.85);
  let horizonColor = vec3<f32>(0.60, 0.75, 0.92);

  var skyColor: vec3<f32>;
  if (up > 0.0) {
    let t = pow(up, 0.45);
    skyColor = mix(horizonColor, zenithColor, t);
  } else {
    let groundColor = vec3<f32>(0.55, 0.62, 0.70);
    let t = pow(-up, 0.7);
    skyColor = mix(horizonColor, groundColor, t);
  }

  skyColor += rayleighColor * 0.8 + mieColor;

  // === Horizon warming (sunset/sunrise tint) ===
  let sunsetFactor = 1.0 - clamp(abs(trueSunHeight) * 3.0, 0.0, 1.0);
  let horizonWarm = vec3<f32>(1.2, 0.5, 0.15) * sunsetFactor * max(cosTheta, 0.0) * 0.5;
  let horizonBand = exp(-abs(up) * 8.0);
  skyColor += horizonWarm * horizonBand;

  // Dim day sky toward night
  skyColor *= dayFactor;

  // === Voxel Sun (square) ===
  let sunRight = normalize(cross(lightDir, vec3<f32>(0.0, 1.0, 0.001)));
  let sunUp = normalize(cross(sunRight, lightDir));
  let sunLocalX = dot(rayDir - lightDir * cosTheta, sunRight);
  let sunLocalY = dot(rayDir - lightDir * cosTheta, sunUp);
  let sunDist = max(abs(sunLocalX), abs(sunLocalY));
  let sunSize = 0.038;

  if (sunDist < sunSize && cosTheta > 0.9 && dayFactor > 0.01) {
    let edge = smoothstep(sunSize, sunSize * 0.85, sunDist);
    let sunDiscColor = vec3<f32>(10.0, 8.0, 5.0) * dayFactor;
    skyColor = mix(skyColor, sunDiscColor, edge);
  }

  // Sun glow (round, soft)
  let glowRadius = 0.97;
  if (cosTheta > glowRadius && dayFactor > 0.01) {
    let t = (cosTheta - glowRadius) / (1.0 - glowRadius);
    let glowStr = t * t * 0.6 * max(trueSunHeight + 0.1, 0.0);
    let glowColor = mix(vec3<f32>(1.2, 0.6, 0.2), vec3<f32>(1.5, 1.3, 0.9), clamp(lightHeight * 3.0, 0.0, 1.0));
    skyColor += glowColor * glowStr;
  }

  // === Volumetric clouds ===
  let elapsedTime = scene.lightDir.w;
  let cloud = raymarchClouds(scene.cameraPos.xyz, rayDir, lightDir, scene.sunColor.xyz, elapsedTime, dayFactor);
  skyColor = mix(skyColor, cloud.rgb, cloud.a);

  // === SEUS-style night sky ===
  if (nightFactor > 0.01) {
    let moonPhase = scene.skyNightParams.x;
    let moonBright = scene.skyNightParams.y;
    let starTime = scene.skyNightParams.z;

    let cloudOcclusion = 1.0 - cloud.a;

    // Moon disc mask (early computation so stars don't render over moon)
    let moonDir = lightDir;
    let moonDot2 = dot(rayDir, moonDir);
    let moonRight = normalize(cross(moonDir, vec3<f32>(0.0, 1.0, 0.001)));
    let moonUpDir = normalize(cross(moonRight, moonDir));
    let moonLocalX = dot(rayDir - moonDir * moonDot2, moonRight);
    let moonLocalY = dot(rayDir - moonDir * moonDot2, moonUpDir);
    let moonDist = length(vec2<f32>(moonLocalX, moonLocalY));
    let moonSize = 0.030;
    var moonEdge = 0.0;
    if (moonDist < moonSize && moonDot2 > 0.9) {
      moonEdge = smoothstep(moonSize, moonSize * 0.9, moonDist);
    }
    let moonOcclusion = 1.0 - moonEdge;
    let bgOcclusion = cloudOcclusion * moonOcclusion;

    // Night sky gradient
    skyColor += nightSkyGradient(up) * nightFactor;

    // Horizon atmospheric glow
    let horizAtmo = exp(-abs(up) * 5.0);
    let horizGlowColor = vec3<f32>(0.010, 0.013, 0.028) + vec3<f32>(0.005, 0.006, 0.010) * moonBright;
    skyColor += horizGlowColor * horizAtmo * nightFactor;

    // Unpack sky params from fogParams.z (2x f16 packed as u32)
    let skyPacked = unpack2x16float(bitcast<u32>(scene.fogParams.z));
    let starBrightness = skyPacked.x;
    let nebulaIntensity = skyPacked.y;

    // Nebula / Milky Way
    if (up > 0.05 && nebulaIntensity > 0.001) {
      var nebulaColor = sampleNebula(rayDir, starTime);
      nebulaColor *= 1.0 - 0.3 * moonBright;
      skyColor += nebulaColor * nightFactor * bgOcclusion * nebulaIntensity;
    }

    // Stars
    if (up > 0.0 && starBrightness > 0.001) {
      var starFieldColor = sampleStarField(rayDir, starTime);
      let horizFade = smoothstep(0.0, 0.15, up);
      starFieldColor *= horizFade;
      starFieldColor *= 1.0 - 0.4 * moonBright;
      skyColor += starFieldColor * nightFactor * bgOcclusion * starBrightness;
    }

    // Meteors
    if (up > 0.05) {
      skyColor += sampleMeteor(rayDir, starTime) * nightFactor * bgOcclusion;
    }

    // Aurora Borealis
    if (up > 0.05) {
      let aurora = sampleAurora(rayDir, scene.cameraPos.xyz, starTime);
      if (aurora.a > 0.001) {
        let auroraIntensity = nightFactor * (1.0 - 0.2 * moonBright);
        let auroraColor = aurora.rgb * auroraIntensity;
        skyColor += auroraColor * aurora.a * bgOcclusion;
      }
    }

    // Moon disc
    if (moonEdge > 0.0) {
      let normX = moonLocalX / moonSize;
      let normY = moonLocalY / moonSize;
      let moonColor = moonShading(normX, normY, moonPhase);
      skyColor += moonColor * moonEdge * nightFactor * cloudOcclusion;
    }

    // Moon glow
    skyColor += moonGlow(moonDot2, moonBright) * nightFactor * cloudOcclusion;
  }

  return vec4<f32>(skyColor, 1.0);
}
