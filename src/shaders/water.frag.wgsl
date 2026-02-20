// ======================== Water Fragment Shader ========================
// Eclipse/SEUS-style: Beer-Lambert RGB absorption, screen-space refraction
// with chromatic dispersion, Snell's window, edge foam, Fresnel reflection

struct FragUniforms {
  cameraPos: vec3f,
  time: f32,
  sunDirection: vec3f,
  sunIntensity: f32,
  sunColor: vec3f,
  nearPlane: f32,
  fogColor: vec3f,
  farPlane: f32,
  fogStart: f32,
  fogEnd: f32,
  screenSize: vec2f,
  waterLevel: f32,
  pad0: f32,
  pad1: f32,
  pad2: f32,
}

@group(0) @binding(1) var<uniform> frag: FragUniforms;
@group(0) @binding(2) var sceneColorTex: texture_2d<f32>;
@group(0) @binding(3) var sceneDepthTex: texture_depth_2d;
@group(0) @binding(4) var texSampler: sampler;

struct FragInput {
  @builtin(position) position: vec4f,
  @location(0) worldPos: vec3f,
  @location(1) uv: vec2f,
}

// Physically-based water absorption (red absorbs fastest, blue slowest)
const WATER_ABSORB = vec3f(0.39, 0.11, 0.07);

fn linearizeDepth(d: f32) -> f32 {
  let near = frag.nearPlane;
  let far = frag.farPlane;
  return near * far / (far - d * (far - near));
}

// Analytical derivative of vertex wave for consistent normals
fn waterNormal(pos: vec3f, t: f32) -> vec3f {
  let dhdx = cos(pos.x * 0.8 + t * 1.2) * 0.064
           + cos((pos.x + pos.z) * 2.0 + t * 2.5) * 0.06
           + cos((pos.x - pos.z) * 3.0 + t * 1.8) * 0.045;
  let dhdz = cos(pos.z * 1.2 + t * 0.9) * 0.072
           + cos((pos.x + pos.z) * 2.0 + t * 2.5) * 0.06
           - cos((pos.x - pos.z) * 3.0 + t * 1.8) * 0.045;
  return normalize(vec3f(-dhdx, 1.0, -dhdz));
}

@fragment
fn main(input: FragInput) -> @location(0) vec4f {
  let pixelCoord = vec2i(input.position.xy);
  let screenUV = input.position.xy / frag.screenSize;

  // ==================== Common Setup ====================
  let rawSceneDepth = textureLoad(sceneDepthTex, pixelCoord, 0);
  let linearScene = linearizeDepth(rawSceneDepth);
  let linearWater = linearizeDepth(input.position.z);
  let waterDepth = max(linearScene - linearWater, 0.0);

  let N = waterNormal(input.worldPos, frag.time);
  let V = normalize(frag.cameraPos - input.worldPos);
  let viewDist = length(frag.cameraPos - input.worldPos);
  let isUnderwater = frag.cameraPos.y < frag.waterLevel;
  let dayFactor = smoothstep(0.2, 0.6, frag.sunIntensity);

  // ==================== Sun Specular (shared) ====================
  let L = normalize(frag.sunDirection);
  let R = reflect(-V, N);
  let sunReflect = max(dot(R, L), 0.0);
  let specular = frag.sunColor * frag.sunIntensity
    * (pow(sunReflect, 256.0) * 2.0 + pow(sunReflect, 32.0) * 0.15);

  // Sky reflection color
  let skyGradient = clamp(R.y * 0.5 + 0.5, 0.0, 1.0);
  let horizonColor = mix(vec3f(0.015, 0.02, 0.035), vec3f(0.35, 0.45, 0.6), dayFactor);
  let zenithColor = mix(vec3f(0.005, 0.008, 0.025), vec3f(0.15, 0.3, 0.65), dayFactor);
  let skyColor = mix(horizonColor, zenithColor, skyGradient);
  let reflection = skyColor + specular;

  // Deep water base color
  let deepColor = mix(vec3f(0.0, 0.01, 0.03), vec3f(0.0, 0.04, 0.12), dayFactor);

  var color: vec3f;
  var alpha: f32;

  if (isUnderwater) {
    // ==================== UNDERWATER VIEW ====================
    // Camera below water, looking up at the water surface

    // Sample above-water scene through refraction
    let aboveScene = textureSampleLevel(sceneColorTex, texSampler, screenUV, 0.0).rgb;

    // Snell's window: total internal reflection outside critical angle (~48.6 deg)
    // |dot(N,V)| = cos(angle): 1.0 = looking straight up, 0.0 = grazing
    let cosAngle = abs(dot(N, V));
    let snellsWindow = smoothstep(0.55, 0.75, cosAngle);

    // Inside window: see above-water world
    // Outside window: total internal reflection -> dark water + specular glints
    let tirColor = deepColor * 0.3 + specular * 0.5;
    color = mix(tirColor, aboveScene, snellsWindow);

    // Beer-Lambert absorption from camera to water surface
    let uwDist = min(viewDist, 30.0);
    color *= exp(-WATER_ABSORB * uwDist * 0.3);

    // Depth darkening: deeper camera = darker overall
    let depthBelowSurface = frag.waterLevel - frag.cameraPos.y;
    color *= exp(-depthBelowSurface * 0.08);

    alpha = 0.95;

  } else {
    // ==================== ABOVE-WATER VIEW ====================
    // Camera above water, looking down at the surface

    // Screen-space refraction with chromatic dispersion
    let refractStrength = 0.025 * clamp(waterDepth, 0.0, 1.0);
    let distAtten = 1.0 / (1.0 + viewDist * 0.02);
    let refractOffset = N.xz * refractStrength * distAtten;
    let refractUV = clamp(screenUV + refractOffset, vec2f(0.002), vec2f(0.998));
    let dispersion = refractOffset * 0.3;

    let refractR = textureSampleLevel(sceneColorTex, texSampler, refractUV + dispersion, 0.0).r;
    let refractG = textureSampleLevel(sceneColorTex, texSampler, refractUV, 0.0).g;
    let refractB = textureSampleLevel(sceneColorTex, texSampler, refractUV - dispersion, 0.0).b;
    let sceneColor = vec3f(refractR, refractG, refractB);

    // Beer's Law absorption (physically-based RGB coefficients)
    let transmittance = exp(-WATER_ABSORB * waterDepth);
    let absorbedScene = sceneColor * transmittance;

    // Blend: absorbed scene at shallow, deep color at depth
    color = mix(deepColor, absorbedScene, clamp(transmittance.b, 0.0, 1.0));

    // Edge foam (shoreline)
    let foamLine = smoothstep(0.5, 0.0, waterDepth);
    let foamWave = sin(input.worldPos.x * 8.0 + frag.time * 2.0) * 0.5 + 0.5;
    let foamWave2 = sin(input.worldPos.z * 6.0 + frag.time * 1.5) * 0.5 + 0.5;
    let foam = foamLine * (0.5 + 0.5 * foamWave * foamWave2) * dayFactor;
    color += vec3f(foam * 0.7, foam * 0.75, foam * 0.8);

    // Fresnel reflection
    let NdotV = max(dot(N, V), 0.0);
    let F0 = 0.02;
    let fresnel = F0 + (1.0 - F0) * pow(1.0 - NdotV, 5.0);
    color = mix(color, reflection, clamp(fresnel, 0.0, 1.0));

    // Alpha (more opaque at depth)
    alpha = clamp(waterDepth * 0.5 + 0.4, 0.4, 0.95);
  }

  // ==================== Distance Fog ====================
  if (!isUnderwater) {
    let fogFactor = clamp((viewDist - frag.fogStart) / (frag.fogEnd - frag.fogStart), 0.0, 1.0);
    color = mix(color, frag.fogColor, fogFactor);
    alpha = mix(alpha, 1.0, fogFactor);
  }
  // Underwater distance fog handled by Beer-Lambert absorption above

  return vec4f(color, alpha);
}
