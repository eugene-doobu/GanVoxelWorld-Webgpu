// ======================== Deferred PBR Lighting ========================
// Cook-Torrance BRDF with shadow mapping, SSAO, and day-night cycle

struct SceneUniforms {
  invViewProj: mat4x4<f32>,  // 64
  cameraPos: vec4<f32>,      // 16
  sunDir: vec4<f32>,         // 16  (xyz=direction, w=unused)
  sunColor: vec4<f32>,       // 16  (rgb=color, w=intensity)
  ambientColor: vec4<f32>,   // 16  (rgb=sky ambient, w=ground factor)
  fogParams: vec4<f32>,      // 16  (x=start, y=end, z=timeOfDay, w=unused)
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

// ====================== Constants ======================
const PI: f32 = 3.14159265359;
const FOG_COLOR_DAY = vec3<f32>(0.75, 0.85, 0.95);
const FOG_COLOR_NIGHT = vec3<f32>(0.02, 0.02, 0.05);

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
  let albedo = pow(albedoSample.rgb, vec3<f32>(1.8));
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

  // Direct lighting
  let sunColor = scene.sunColor.rgb * scene.sunColor.w;
  let directLight = (diffuse + specular) * sunColor * NdotL * shadowFactor;

  // Hemisphere ambient
  let skyAmbient = scene.ambientColor.rgb;
  let groundAmbient = skyAmbient * scene.ambientColor.w;
  let ambientBlend = dot(N, vec3<f32>(0.0, 1.0, 0.0)) * 0.5 + 0.5;
  let ambient = mix(groundAmbient, skyAmbient, ambientBlend) * albedo * ao;

  // Emissive
  let emissiveColor = albedo * emissive * 5.0;

  var finalColor = directLight + ambient + emissiveColor;

  // Fog
  let fogStart = scene.fogParams.x;
  let fogEnd = scene.fogParams.y;
  let timeOfDay = scene.fogParams.z;
  let fogFactor = clamp((viewDist - fogStart) / (fogEnd - fogStart), 0.0, 1.0);
  let dayFactor = clamp(1.0 - abs(timeOfDay - 0.5) * 4.0, 0.0, 1.0);
  let fogColor = mix(FOG_COLOR_NIGHT, FOG_COLOR_DAY, dayFactor);
  finalColor = mix(finalColor, fogColor, fogFactor);

  return vec4<f32>(finalColor, 1.0);
}
