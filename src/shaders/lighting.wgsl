// ======================== Deferred PBR Lighting ========================
// Cook-Torrance BRDF with shadow mapping, SSAO, and day-night cycle

struct SceneUniforms {
  invViewProj: mat4x4<f32>,        // 64
  cameraPos: vec4<f32>,            // 16
  sunDir: vec4<f32>,               // 16  (xyz=direction, w=unused)
  sunColor: vec4<f32>,             // 16  (rgb=color, w=intensity)
  ambientColor: vec4<f32>,         // 16  (rgb=sky ambient, w=ground factor)
  fogParams: vec4<f32>,            // 16  (x=start, y=end, z=timeOfDay, w=unused)
  cloudParams: vec4<f32>,          // 16  (x=baseNoiseScale, y=extinction, z=multiScatterFloor, w=detailStrength)
  viewProj: mat4x4<f32>,          // 64  (unjittered viewProj for contact shadow)
  contactShadowParams: vec4<f32>,  // 16  (x=enabled, y=maxSteps, z=rayLength, w=thickness)
  skyNightParams: vec4<f32>,       // 16  (x=moonPhase, y=moonBrightness, z=elapsedTime, w=reserved)
};

struct ShadowUniforms {
  lightViewProj: array<mat4x4<f32>, 3>,  // 192
  cascadeSplits: vec4<f32>,               // 16 (x,y,z = split distances)
};

@group(0) @binding(0) var<uniform> scene: SceneUniforms;

// G-Buffer textures
@group(1) @binding(0) var gAlbedo: texture_2d<f32>;
@group(1) @binding(1) var gNormal: texture_2d<f32>;
@group(1) @binding(2) var gMaterial: texture_2d<f32>;
@group(1) @binding(3) var gDepth: texture_depth_2d;

// Shadow + SSAO
@group(2) @binding(0) var<uniform> shadow: ShadowUniforms;
@group(2) @binding(1) var shadowMap: texture_depth_2d_array;
@group(2) @binding(2) var shadowSampler: sampler_comparison;
@group(2) @binding(3) var ssaoTexture: texture_2d<f32>;
@group(2) @binding(4) var linearSampler: sampler;

// Point Lights
struct PointLight {
  position: vec3f,
  radius: f32,
  color: vec3f,
  intensity: f32,
};

struct PointLightBuffer {
  count: u32,
  _pad0: u32,
  _pad1: u32,
  _pad2: u32,
  lights: array<PointLight, 128>,
};

@group(3) @binding(0) var<storage, read> pointLights: PointLightBuffer;

// ====================== Constants ======================
const PI: f32 = 3.14159265359;

// ====================== Atmospheric Scattering (Fog) ======================
fn rayleighPhase(cosTheta: f32) -> f32 {
  return 3.0 / (16.0 * PI) * (1.0 + cosTheta * cosTheta);
}

fn hgPhase(cosTheta: f32, g: f32) -> f32 {
  let g2 = g * g;
  let num = 1.0 - g2;
  let denom = 4.0 * PI * pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5);
  return num / denom;
}

fn atmosphericFogColor(viewDir: vec3f, sunDir: vec3f, timeOfDay: f32) -> vec3f {
  let cosTheta = dot(normalize(viewDir), sunDir);
  // True sun height (immune to CPU sunDir negation at night)
  let trueSunHeight = sin((timeOfDay - 0.25) * 2.0 * PI);
  // Rayleigh (blue sky)
  let rayleigh = rayleighPhase(cosTheta);
  let rayleighColor = vec3f(0.3, 0.55, 0.95) * rayleigh;
  // Mie (warm forward scatter)
  let mie = hgPhase(cosTheta, 0.76);
  let mieColor = vec3f(1.0, 0.95, 0.85) * mie * 0.02;
  // Horizon base + scattering
  var fogColor = vec3f(0.60, 0.75, 0.92) + rayleighColor * 0.8 + mieColor;
  // Sunset warming
  let sunsetFactor = 1.0 - clamp(abs(trueSunHeight) * 3.0, 0.0, 1.0);
  fogColor += vec3f(1.2, 0.5, 0.15) * sunsetFactor * max(cosTheta, 0.0) * 0.5;
  // Night darkening
  let dayFactor = smoothstep(-0.15, 0.1, trueSunHeight);
  fogColor *= dayFactor;
  // Night fog: derive from ambient so fog never outshines ambient-lit objects
  let nightFogColor = scene.ambientColor.rgb * 0.2;
  fogColor += nightFogColor * (1.0 - dayFactor);
  return fogColor;
}

// ====================== Fullscreen Vertex ======================
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

// ====================== World position reconstruction ======================
fn reconstructWorldPos(uv: vec2<f32>, depth: f32) -> vec3<f32> {
  let ndc = vec4<f32>(uv * 2.0 - 1.0, depth, 1.0);
  let ndcFlipped = vec4<f32>(ndc.x, -ndc.y, ndc.z, 1.0);
  let worldH = scene.invViewProj * ndcFlipped;
  return worldH.xyz / worldH.w;
}

// ====================== PBR Functions ======================

// GGX/Trowbridge-Reitz Normal Distribution
fn distributionGGX(NdotH: f32, roughness: f32) -> f32 {
  let a = roughness * roughness;
  let a2 = a * a;
  let denom = NdotH * NdotH * (a2 - 1.0) + 1.0;
  return a2 / (PI * denom * denom);
}

// Smith-Schlick Geometry Function
fn geometrySmithSchlick(NdotV: f32, NdotL: f32, roughness: f32) -> f32 {
  let r = roughness + 1.0;
  let k = (r * r) / 8.0;
  let ggx1 = NdotV / (NdotV * (1.0 - k) + k);
  let ggx2 = NdotL / (NdotL * (1.0 - k) + k);
  return ggx1 * ggx2;
}

// Schlick Fresnel Approximation
fn fresnelSchlick(cosTheta: f32, F0: vec3<f32>) -> vec3<f32> {
  return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

// ====================== Shadow Sampling ======================
fn sampleShadow(worldPos: vec3<f32>, viewDist: f32) -> f32 {
  let splits = shadow.cascadeSplits;

  var cascadeIdx = 0u;
  if (viewDist > splits.y) {
    cascadeIdx = 2u;
  } else if (viewDist > splits.x) {
    cascadeIdx = 1u;
  }

  let lightSpacePos = shadow.lightViewProj[cascadeIdx] * vec4<f32>(worldPos, 1.0);
  let projCoords = lightSpacePos.xyz / lightSpacePos.w;
  let shadowUV = vec2<f32>(projCoords.x * 0.5 + 0.5, 1.0 - (projCoords.y * 0.5 + 0.5));

  if (shadowUV.x < 0.0 || shadowUV.x > 1.0 || shadowUV.y < 0.0 || shadowUV.y > 1.0) {
    return 1.0;
  }

  let currentDepth = projCoords.z;
  if (currentDepth > 1.0 || currentDepth < 0.0) {
    return 1.0;
  }

  // PCF 3x3
  let texelSize = 1.0 / 2048.0;
  var shadowFactor = 0.0;
  for (var ox = -1i; ox <= 1i; ox++) {
    for (var oy = -1i; oy <= 1i; oy++) {
      let offset = vec2<f32>(f32(ox), f32(oy)) * texelSize;
      shadowFactor += textureSampleCompareLevel(
        shadowMap, shadowSampler,
        shadowUV + offset,
        i32(cascadeIdx),
        currentDepth - 0.002
      );
    }
  }
  return shadowFactor / 9.0;
}

// ====================== Contact Shadow ======================
fn contactShadow(worldPos: vec3f, sunDir: vec3f) -> f32 {
  let enabled = scene.contactShadowParams.x;
  if (enabled < 0.5) {
    return 1.0;
  }

  let maxSteps = i32(scene.contactShadowParams.y);
  let rayLength = scene.contactShadowParams.z;
  let thickness = scene.contactShadowParams.w;
  let dims = textureDimensions(gDepth);

  // March along sunDir in world space, project each sample to screen
  let stepSize = rayLength / f32(maxSteps);

  for (var i = 1; i <= maxSteps; i++) {
    let samplePos = worldPos + sunDir * stepSize * f32(i);

    // Project to clip space using unjittered viewProj
    let clipPos = scene.viewProj * vec4f(samplePos, 1.0);
    let ndc = clipPos.xyz / clipPos.w;

    // NDC to UV (flip Y for WebGPU)
    let uv = vec2f(ndc.x * 0.5 + 0.5, 0.5 - ndc.y * 0.5);

    // Skip if outside screen
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      continue;
    }

    let texCoord = vec2i(vec2f(f32(dims.x), f32(dims.y)) * uv);
    let sceneDepth = textureLoad(gDepth, texCoord, 0);

    // Compare: ray depth vs scene depth
    let rayDepth = ndc.z;
    let depthDiff = rayDepth - sceneDepth;

    // Occluded if ray is behind surface within thickness
    if (depthDiff > 0.0 && depthDiff < thickness) {
      // Fade based on march distance
      let t = f32(i) / f32(maxSteps);
      return mix(0.3, 1.0, t * t);
    }
  }

  return 1.0;
}

// ====================== Water Caustics ======================
fn waterCaustics(worldPos: vec3f, time: f32) -> f32 {
  let p = worldPos.xz;

  // Octave 1: large slow waves
  var wave1 = 0.0;
  wave1 += sin(dot(p, vec2f(0.8, 0.6)) * 0.4 + time * 0.6);
  wave1 += sin(dot(p, vec2f(-0.5, 0.9)) * 0.5 + time * 0.45);
  wave1 += sin(dot(p, vec2f(0.9, -0.4)) * 0.35 + time * 0.55);
  let c1 = 1.0 - abs(sin(wave1 * 1.2));

  // Octave 2: small fast detail
  var wave2 = 0.0;
  wave2 += sin(dot(p, vec2f(1.2, -0.8)) * 0.9 + time * 1.1);
  wave2 += sin(dot(p, vec2f(-0.7, 1.3)) * 1.1 + time * 0.9);
  wave2 += sin(dot(p, vec2f(0.6, 1.1)) * 0.8 + time * 1.3);
  let c2 = 1.0 - abs(sin(wave2 * 1.5));

  // Combine: intersection of caustic lines creates bright spots
  return c1 * c2;
}

// ====================== Fragment Shader ======================
@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let pixelCoord = vec2<i32>(input.position.xy);
  let dims = textureDimensions(gAlbedo);

  // Sample G-Buffer
  let albedoSample = textureLoad(gAlbedo, pixelCoord, 0);
  let normalSample = textureLoad(gNormal, pixelCoord, 0);
  let materialSample = textureLoad(gMaterial, pixelCoord, 0);
  let depth = textureLoad(gDepth, pixelCoord, 0);

  // Early sky detection (nothing written to G-Buffer)
  if (depth >= 1.0) {
    discard;
  }

  // sRGB → linear approximation (slightly lifted for voxel aesthetic)
  let albedo = pow(albedoSample.rgb, vec3<f32>(2.2));
  let emissive = albedoSample.a;
  let normal = normalize(normalSample.rgb * 2.0 - 1.0);
  let roughness = materialSample.r;
  let metallic = materialSample.g;

  // Sample SSAO
  let uv = input.uv;
  let ao = textureSampleLevel(ssaoTexture, linearSampler, uv, 0.0).r;

  // Reconstruct world position
  let worldPos = reconstructWorldPos(uv, depth);
  let V = normalize(scene.cameraPos.xyz - worldPos);
  let N = normal;
  let L = normalize(scene.sunDir.xyz);
  let H = normalize(V + L);

  let NdotL = max(dot(N, L), 0.0);
  let NdotV = max(dot(N, V), 0.001);
  let NdotH = max(dot(N, H), 0.0);
  let HdotV = max(dot(H, V), 0.0);

  // Metallic workflow: F0
  let F0 = mix(vec3<f32>(0.04), albedo, metallic);

  // Cook-Torrance Specular BRDF
  let D = distributionGGX(NdotH, roughness);
  let G = geometrySmithSchlick(NdotV, NdotL, roughness);
  let F = fresnelSchlick(HdotV, F0);

  let numerator = D * G * F;
  let denominator = 4.0 * NdotV * NdotL + 0.0001;
  let specular = numerator / denominator;

  // Energy-conserving diffuse
  let kD = (vec3<f32>(1.0) - F) * (1.0 - metallic);
  let diffuse = kD * albedo / PI;

  // Shadow
  let viewDist = distance(scene.cameraPos.xyz, worldPos);
  let shadowFactor = sampleShadow(worldPos, viewDist);

  // Contact shadow
  let contactFactor = contactShadow(worldPos, L);

  // Direct lighting
  let sunColor = scene.sunColor.rgb * scene.sunColor.w;
  let directLight = (diffuse + specular) * sunColor * NdotL * shadowFactor * contactFactor;

  // Hemisphere ambient
  let skyAmbient = scene.ambientColor.rgb;
  let groundAmbient = skyAmbient * scene.ambientColor.w;
  let ambientBlend = dot(N, vec3<f32>(0.0, 1.0, 0.0)) * 0.5 + 0.5;
  let ambient = mix(groundAmbient, skyAmbient, ambientBlend) * albedo * ao;

  // Emissive
  let emissiveColor = albedo * emissive * 5.0;

  // Point Lights
  var pointLightContrib = vec3<f32>(0.0, 0.0, 0.0);
  let lightCount = min(pointLights.count, 128u);
  for (var i = 0u; i < lightCount; i++) {
    let light = pointLights.lights[i];
    let lightVec = light.position - worldPos;
    let dist = length(lightVec);
    if (dist > light.radius) { continue; }

    let L_p = normalize(lightVec);
    let attenuation = smoothstep(light.radius, 0.0, dist) / (1.0 + dist * dist);
    let NdotL_p = max(dot(N, L_p), 0.0);

    // Diffuse contribution
    let pointDiffuse = albedo * light.color * light.intensity * NdotL_p * attenuation;

    // Simple specular (Blinn-Phong for point lights to keep cost low)
    let H_p = normalize(V + L_p);
    let NdotH_p = max(dot(N, H_p), 0.0);
    let specPower = mix(8.0, 64.0, 1.0 - roughness);
    let pointSpecular = light.color * light.intensity * pow(NdotH_p, specPower) * attenuation * (1.0 - roughness) * 0.3;

    pointLightContrib += pointDiffuse + pointSpecular;
  }

  var finalColor = directLight + ambient + emissiveColor + pointLightContrib;

  // Water caustics (underwater surfaces only)
  let waterLevel = scene.cameraPos.w;
  let waterTime = scene.sunDir.w;
  if (worldPos.y < waterLevel) {
    let underwaterDepth = waterLevel - worldPos.y;
    let shoreFade = smoothstep(0.0, 0.5, underwaterDepth);
    let depthAtten = exp(-underwaterDepth * 0.15) * shoreFade;
    let normalUp = max(dot(N, vec3f(0.0, 1.0, 0.0)), 0.0);
    let causticPattern = waterCaustics(worldPos, waterTime);
    let causticLight = sunColor * causticPattern * depthAtten * normalUp * shadowFactor * 0.35;
    finalColor += causticLight;
  }

  // Atmospheric scattering fog
  let fogStart = scene.fogParams.x;
  let fogEnd = scene.fogParams.y;
  let fogFactor = clamp((viewDist - fogStart) / (fogEnd - fogStart), 0.0, 1.0);
  let viewDir = worldPos - scene.cameraPos.xyz;
  let sunDir3 = normalize(scene.sunDir.xyz);
  let fogColor = atmosphericFogColor(viewDir, sunDir3, scene.fogParams.z);
  finalColor = mix(finalColor, fogColor, fogFactor);

  return vec4<f32>(finalColor, 1.0);
}
