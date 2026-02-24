// ======================== Water Fragment Shader ========================
// Physical water rendering: SSR reflections (blocks + sky/clouds),
// procedural refraction, Fresnel compositing, Snell's window, edge foam
//
// sceneColorTex 사용 규칙 (SSAO artifact 방지):
//   - 굴절(아래 보기): 절대 금지 → procedural 색상만 사용
//   - SSR 반사(ray-march hit): OK → 수면 위 지오메트리의 SSAO는 로컬하게 올바름
//   - 하늘/구름 반사(depth>0.999): OK → 하늘 픽셀에는 SSAO 없음
//   - 수중 Snell's window: OK → 위를 올려다보는 것이므로 정상

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
  viewProjection: mat4x4f,
  invViewProjection: mat4x4f,
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

const WATER_ABSORB = vec3f(0.39, 0.11, 0.07);

fn linearizeDepth(d: f32) -> f32 {
  let near = frag.nearPlane;
  let far = frag.farPlane;
  return near * far / (far - d * (far - near));
}

// ---- Noise functions for organic water normals ----

fn hash2d(p: vec2f) -> f32 {
  var p3 = fract(vec3f(p.x, p.y, p.x) * vec3f(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

fn smoothNoise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

  let a = hash2d(i);
  let b = hash2d(i + vec2f(1.0, 0.0));
  let c = hash2d(i + vec2f(0.0, 1.0));
  let d = hash2d(i + vec2f(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

fn waterFBM(p: vec2f) -> f32 {
  var value = 0.0;
  var amplitude = 0.5;
  var pos = p;
  let rot = mat2x2f(0.8, 0.6, -0.6, 0.8);

  for (var i = 0; i < 4; i = i + 1) {
    value += amplitude * smoothNoise(pos);
    pos = rot * pos * 2.05 + vec2f(1.7, 9.2);
    amplitude *= 0.5;
  }
  return value;
}

fn waterNormal(pos: vec3f, t: f32) -> vec3f {
  let eps = 0.08;
  let strength = 0.35;

  let flow1 = vec2f(t * 0.4, t * 0.3);
  let flow2 = vec2f(-t * 0.25, t * 0.35);
  let scale1 = 0.8;
  let scale2 = 1.6;
  let uv = pos.xz;

  let h00 = waterFBM(uv * scale1 + flow1) * 0.7
           + waterFBM(uv * scale2 + flow2) * 0.3;
  let h10 = waterFBM((uv + vec2f(eps, 0.0)) * scale1 + flow1) * 0.7
           + waterFBM((uv + vec2f(eps, 0.0)) * scale2 + flow2) * 0.3;
  let h01 = waterFBM((uv + vec2f(0.0, eps)) * scale1 + flow1) * 0.7
           + waterFBM((uv + vec2f(0.0, eps)) * scale2 + flow2) * 0.3;

  let dhdx = (h10 - h00) / eps * strength;
  let dhdz = (h01 - h00) / eps * strength;

  return normalize(vec3f(-dhdx, 1.0, -dhdz));
}

// ---- SSR ----

// Project world position → screen UV + NDC depth
fn worldToScreen(wp: vec3f) -> vec3f {
  let clip = frag.viewProjection * vec4f(wp, 1.0);
  // Behind camera guard
  if (clip.w <= 0.0) { return vec3f(-1.0, -1.0, 0.0); }
  let ndc = clip.xyz / clip.w;
  // WebGPU framebuffer: (0,0) = top-left, Y flipped from NDC
  let uv = vec2f(ndc.x * 0.5 + 0.5, 1.0 - (ndc.y * 0.5 + 0.5));
  return vec3f(uv, ndc.z);
}

// SSR ray march — returns (reflectedColor, confidence)
// Only hits above-water geometry → sceneColorTex safe (SSAO locally correct)
fn waterSSR(worldPos: vec3f, N: vec3f, V: vec3f) -> vec4f {
  let R = reflect(-V, N);

  // Skip downward / nearly-horizontal reflections
  if (R.y < 0.02) { return vec4f(0.0); }

  // --- Parameters ---
  let THICKNESS = 0.5;  // world-space units (compared in linear depth)

  var rayPos = worldPos;
  var prevRayPos = rayPos;
  var stepSize = 0.4;
  var hit = false;
  var hitUV = vec2f(0.0);

  // --- Linear march ---
  for (var i = 0; i < 48; i = i + 1) {
    prevRayPos = rayPos;
    rayPos += R * stepSize;
    stepSize *= 1.08;

    let scr = worldToScreen(rayPos);

    // Off-screen → stop
    if (scr.x < 0.0 || scr.x > 1.0 || scr.y < 0.0 || scr.y > 1.0) { break; }

    let sceneDepthRaw = textureLoad(sceneDepthTex, vec2i(scr.xy * frag.screenSize), 0);

    // Sky pixel (depth ≈ 1.0) → no solid geometry, skip
    if (sceneDepthRaw > 0.999) { continue; }

    // Compare in LINEAR depth (world-space units)
    let linearRay = linearizeDepth(scr.z);
    let linearScene = linearizeDepth(sceneDepthRaw);
    let diff = linearRay - linearScene;

    if (diff > 0.0 && diff < THICKNESS) {
      // --- Binary refinement (lo/hi bisection) ---
      var lo = prevRayPos;
      var hi = rayPos;
      for (var j = 0; j < 5; j = j + 1) {
        let mid = (lo + hi) * 0.5;
        let ms = worldToScreen(mid);
        let md = textureLoad(sceneDepthTex, vec2i(ms.xy * frag.screenSize), 0);
        if (linearizeDepth(ms.z) > linearizeDepth(md)) {
          hi = mid;  // ray behind surface → move backward
        } else {
          lo = mid;  // ray in front → move forward
        }
      }
      let hitScr = worldToScreen((lo + hi) * 0.5);
      hitUV = hitScr.xy;
      hit = true;
      break;
    }
  }

  if (!hit) { return vec4f(0.0); }

  // --- Confidence (fade-outs) ---
  // Screen-edge fade (5% margin)
  let edgeFade = smoothstep(0.0, 0.05, hitUV.x)
               * smoothstep(1.0, 0.95, hitUV.x)
               * smoothstep(0.0, 0.05, hitUV.y)
               * smoothstep(1.0, 0.95, hitUV.y);
  // Distance fade (40–80 world units)
  let rayDist = length(rayPos - worldPos);
  let distFade = 1.0 - smoothstep(40.0, 80.0, rayDist);
  // Direction fade (nearly-horizontal reflections less reliable)
  let dirFade = smoothstep(0.02, 0.15, R.y);

  let confidence = edgeFade * distFade * dirFade;

  // Sample scene color at geometrically-correct hit position
  let reflectedColor = textureSampleLevel(sceneColorTex, texSampler, hitUV, 0.0).rgb;
  return vec4f(reflectedColor, confidence);
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
  let dayFactor = smoothstep(0.2, 0.6, frag.sunIntensity);

  // ==================== Sun Specular ====================
  let L = normalize(frag.sunDirection);
  let R = reflect(-V, N);
  let sunReflect = max(dot(R, L), 0.0);
  let specular = frag.sunColor * frag.sunIntensity
    * (pow(sunReflect, 512.0) * 1.5 + pow(sunReflect, 64.0) * 0.1);

  // ==================== Analytical Sky (gradient fallback) ====================
  let skyGradient = clamp(R.y * 0.5 + 0.5, 0.0, 1.0);
  let horizonColor = mix(vec3f(0.015, 0.02, 0.035), vec3f(0.35, 0.45, 0.6), dayFactor);
  let zenithColor = mix(vec3f(0.005, 0.008, 0.025), vec3f(0.15, 0.3, 0.65), dayFactor);
  let analyticalSky = mix(horizonColor, zenithColor, skyGradient);

  let deepColor = mix(vec3f(0.0, 0.01, 0.03), vec3f(0.0, 0.04, 0.12), dayFactor);

  // Smooth underwater transition (0.3-unit transition zone instead of hard binary switch)
  let uwBlend = smoothstep(frag.waterLevel + 0.3, frag.waterLevel - 0.3, frag.cameraPos.y);

  // ==================== ABOVE-WATER PATH ====================
  // Refraction (procedural only — no sceneColorTex, SSAO artifact 방지)
  let shallowColor = mix(vec3f(0.0, 0.15, 0.25), vec3f(0.05, 0.25, 0.35), dayFactor);
  let refraction = mix(shallowColor, deepColor, smoothstep(0.0, 5.0, waterDepth));

  // Reflection (SSR + sky fallback) — skip expensive SSR when fully underwater
  var ssrResult = vec4f(0.0);
  var envReflection = analyticalSky;
  if (uwBlend < 0.99) {
    ssrResult = waterSSR(input.worldPos, N, V);
    for (var sd = 1; sd <= 5; sd = sd + 1) {
      let dist = f32(sd) * 50.0;
      let skyPt = input.worldPos + R * dist;
      let skyScr = worldToScreen(skyPt);
      if (skyScr.x > 0.01 && skyScr.x < 0.99 && skyScr.y > 0.01 && skyScr.y < 0.99) {
        let skyD = textureLoad(sceneDepthTex, vec2i(skyScr.xy * frag.screenSize), 0);
        if (skyD > 0.999) {
          envReflection = textureSampleLevel(sceneColorTex, texSampler, skyScr.xy, 0.0).rgb;
          break;
        }
      }
    }
  }
  let reflection = mix(envReflection, ssrResult.rgb, ssrResult.a) + specular;

  let NdotV = max(dot(N, V), 0.0);
  let F0 = 0.04;
  let fresnel = F0 + (1.0 - F0) * pow(1.0 - NdotV, 5.0);
  let depthBoost = smoothstep(0.0, 3.0, waterDepth) * 0.15;
  let finalFresnel = clamp(fresnel + depthBoost, 0.0, 0.85);
  var aboveColor = mix(refraction, reflection, finalFresnel);

  // Edge foam
  let foamLine = smoothstep(0.5, 0.0, waterDepth);
  let foamWave = sin(input.worldPos.x * 8.0 + frag.time * 2.0) * 0.5 + 0.5;
  let foamWave2 = sin(input.worldPos.z * 6.0 + frag.time * 1.5) * 0.5 + 0.5;
  let foam = foamLine * (0.5 + 0.5 * foamWave * foamWave2) * dayFactor;
  aboveColor += vec3f(foam * 0.7, foam * 0.75, foam * 0.8);

  // Distance fog (above-water path only)
  let fogFactor = clamp((viewDist - frag.fogStart) / (frag.fogEnd - frag.fogStart), 0.0, 1.0);
  aboveColor = mix(aboveColor, frag.fogColor, fogFactor);

  // ==================== UNDERWATER PATH ====================
  // sceneColorTex OK — looking up through water surface, SSAO is natural
  let aboveScene = textureSampleLevel(sceneColorTex, texSampler, screenUV, 0.0).rgb;
  let cosAngle = abs(dot(N, V));
  let snellsWindow = smoothstep(0.55, 0.75, cosAngle);
  let tirColor = deepColor * 0.3 + specular * 0.5;
  var belowColor = mix(tirColor, aboveScene, snellsWindow);

  let uwDist = min(viewDist, 30.0);
  belowColor *= exp(-WATER_ABSORB * uwDist * 0.3);
  let depthBelowSurface = max(frag.waterLevel - frag.cameraPos.y, 0.0);
  belowColor *= exp(-depthBelowSurface * 0.08);

  // ==================== BLEND ====================
  var color = mix(aboveColor, belowColor, uwBlend);
  var alpha = mix(1.0, 0.95, uwBlend);

  return vec4f(color, alpha);
}
