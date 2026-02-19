// Screen-Space Reflections (SSR)
// Ray marches in screen space using G-Buffer depth to find reflected geometry.
// Only active for low-roughness surfaces (ice, wet stone, etc.)

struct SSRUniforms {
  viewProjection: mat4x4<f32>,   // 64
  invViewProjection: mat4x4<f32>, // 64
  cameraPos: vec4<f32>,           // 16  (xyz=pos, w=unused)
  screenSize: vec4<f32>,          // 16  (xy=width/height, zw=unused)
};

@group(0) @binding(0) var<uniform> ssr: SSRUniforms;
@group(0) @binding(1) var gNormal: texture_2d<f32>;
@group(0) @binding(2) var gMaterial: texture_2d<f32>;
@group(0) @binding(3) var gDepth: texture_depth_2d;
@group(0) @binding(4) var hdrInput: texture_2d<f32>;
@group(0) @binding(5) var linearSampler: sampler;

const MAX_STEPS: u32 = 32u;
const STEP_SIZE: f32 = 0.5;
const BINARY_STEPS: u32 = 5u;
const THICKNESS: f32 = 0.3;
const ROUGHNESS_CUTOFF: f32 = 0.5;

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

fn reconstructWorldPos(uv: vec2<f32>, depth: f32) -> vec3<f32> {
  let ndc = vec4<f32>(uv * 2.0 - 1.0, depth, 1.0);
  let ndcFlipped = vec4<f32>(ndc.x, -ndc.y, ndc.z, 1.0);
  let worldH = ssr.invViewProjection * ndcFlipped;
  return worldH.xyz / worldH.w;
}

fn worldToScreen(worldPos: vec3<f32>) -> vec3<f32> {
  let clip = ssr.viewProjection * vec4<f32>(worldPos, 1.0);
  let ndc = clip.xyz / clip.w;
  // ndc.xy: -1..1, ndc.z: 0..1 (depth)
  let screenUV = vec2<f32>(ndc.x * 0.5 + 0.5, 1.0 - (ndc.y * 0.5 + 0.5));
  return vec3<f32>(screenUV, ndc.z);
}

fn fresnelSchlick(cosTheta: f32, F0: vec3<f32>) -> vec3<f32> {
  return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let pixelCoord = vec2<i32>(input.position.xy);
  let screenSize = ssr.screenSize.xy;

  // Read material roughness
  let materialSample = textureLoad(gMaterial, pixelCoord, 0);
  let roughness = materialSample.r;
  let metallic = materialSample.g;

  // Early exit for rough surfaces
  if (roughness > ROUGHNESS_CUTOFF) {
    return vec4<f32>(0.0, 0.0, 0.0, 0.0);
  }

  // Read depth
  let depth = textureLoad(gDepth, pixelCoord, 0);
  if (depth >= 1.0) {
    return vec4<f32>(0.0, 0.0, 0.0, 0.0);
  }

  // Read normal
  let normalSample = textureLoad(gNormal, pixelCoord, 0);
  let normal = normalize(normalSample.rgb * 2.0 - 1.0);

  // Reconstruct world position
  let worldPos = reconstructWorldPos(input.uv, depth);
  let viewDir = normalize(ssr.cameraPos.xyz - worldPos);

  // Reflection direction
  let reflectDir = reflect(-viewDir, normal);

  // Fresnel for reflection intensity
  let albedoSample = vec3<f32>(0.04); // approximate F0 for dielectrics
  let F0 = mix(albedoSample, vec3<f32>(1.0), metallic);
  let NdotV = max(dot(normal, viewDir), 0.0);
  let fresnel = fresnelSchlick(NdotV, F0);

  // Roughness-based fade: smoother surfaces reflect more
  let roughnessFade = 1.0 - smoothstep(0.0, ROUGHNESS_CUTOFF, roughness);

  // Ray march in world space, project to screen space each step
  var rayPos = worldPos + reflectDir * 0.1; // offset to avoid self-intersection

  var hitColor = vec4<f32>(0.0);
  var stepSize = STEP_SIZE;

  for (var i = 0u; i < MAX_STEPS; i++) {
    rayPos += reflectDir * stepSize;

    // Project to screen
    let screenCoord = worldToScreen(rayPos);
    let rayUV = screenCoord.xy;
    let rayDepth = screenCoord.z;

    // Check screen bounds
    if (rayUV.x < 0.0 || rayUV.x > 1.0 || rayUV.y < 0.0 || rayUV.y > 1.0) {
      break;
    }

    // Sample scene depth at this screen position
    let sampleCoord = vec2<i32>(rayUV * screenSize);
    let sceneDepth = textureLoad(gDepth, sampleCoord, 0);

    // Compare depths: ray went behind scene geometry
    if (rayDepth > sceneDepth && sceneDepth > 0.0) {
      // Check thickness: only count as hit if ray is close to surface
      let hitWorldPos = reconstructWorldPos(rayUV, sceneDepth);
      let diff = distance(rayPos, hitWorldPos);
      if (diff < THICKNESS * stepSize * f32(i + 1u) * 0.5 + THICKNESS) {
        // Binary refinement for precision
        var refinedPos = rayPos - reflectDir * stepSize;
        var refinedStep = stepSize * 0.5;
        for (var j = 0u; j < BINARY_STEPS; j++) {
          refinedPos += reflectDir * refinedStep;
          let refScreen = worldToScreen(refinedPos);
          let refSampleCoord = vec2<i32>(refScreen.xy * screenSize);
          if (refScreen.x < 0.0 || refScreen.x > 1.0 || refScreen.y < 0.0 || refScreen.y > 1.0) {
            break;
          }
          let refSceneDepth = textureLoad(gDepth, refSampleCoord, 0);
          if (refScreen.z > refSceneDepth) {
            refinedPos -= reflectDir * refinedStep;
          }
          refinedStep *= 0.5;
        }

        // Sample HDR color at refined hit point
        let finalScreen = worldToScreen(refinedPos);
        let finalUV = finalScreen.xy;
        if (finalUV.x >= 0.0 && finalUV.x <= 1.0 && finalUV.y >= 0.0 && finalUV.y <= 1.0) {
          let reflectedColor = textureSampleLevel(hdrInput, linearSampler, finalUV, 0.0).rgb;

          // Edge fade: fade out reflections near screen edges
          let edgeFade = 1.0 - pow(max(abs(finalUV.x * 2.0 - 1.0), abs(finalUV.y * 2.0 - 1.0)), 4.0);

          let alpha = clamp(edgeFade * roughnessFade, 0.0, 1.0);
          let tintedColor = reflectedColor * fresnel;
          hitColor = vec4<f32>(tintedColor, alpha);
        }
        break;
      }
    }

    // Increase step size slightly for distant rays (acceleration)
    stepSize *= 1.05;
  }

  return hitColor;
}
