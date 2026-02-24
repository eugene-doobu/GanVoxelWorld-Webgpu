# Phase 2: 렌더링 파이프라인

> WebGPU 복셀 엔진의 디퍼드 렌더링 파이프라인 완전 해설.
> 모든 파일 경로는 프로젝트 루트(`src/`) 기준이다.

---

## 1. 디퍼드 렌더링 개요

### 1.1 왜 디퍼드인가 (Forward vs Deferred)

**Forward Rendering** 은 각 오브젝트를 그릴 때마다 모든 광원을 계산한다. 복셀 월드에서 최대 128개의 포인트 라이트, 캐스케이드 그림자, SSAO 를 모두 포워드로 처리하면 오버드로(overdraw) 때문에 동일한 조명 연산이 가려진 픽셀에도 반복된다.

**Deferred Rendering** 은 기하 정보를 먼저 G-Buffer 에 기록하고, 라이팅은 화면 공간에서 1회만 수행한다. 이 엔진은 아래 장점 때문에 디퍼드를 선택했다:

| 항목 | Forward | Deferred (본 엔진) |
|------|---------|-------------------|
| 광원 복잡도 | O(objects x lights) | O(pixels x lights) |
| 오버드로 비용 | 조명까지 반복 | G-Buffer 기록만 반복 |
| 후처리 통합 | 어려움 | 자연스러움 (depth, normal 재사용) |
| 투명체 | 자연 지원 | 별도 포워드 패스 필요 |

물(water)과 날씨 파티클은 투명체이므로 **별도 포워드 패스**에서 알파 블렌딩으로 처리한다.

### 1.2 G-Buffer 구조

G-Buffer 는 4장의 텍스처로 구성된다. 포맷은 `src/constants.ts` 에 정의되어 있다:

```
┌──────────────┬─────────────────┬───────────────────────────────────┐
│   텍스처      │   포맷           │   채널 의미                        │
├──────────────┼─────────────────┼───────────────────────────────────┤
│ Albedo       │ rgba8unorm      │ R=red, G=green, B=blue, A=emissive│
│ Normal       │ rgba16float     │ R=Nx, G=Ny, B=Nz (0.5 + 0.5)     │
│ Material     │ rgba8unorm      │ R=roughness, G=metallic, B=AO     │
│ Depth        │ depth32float    │ 하드웨어 depth (0=near, 1=far)     │
└──────────────┴─────────────────┴───────────────────────────────────┘
```

**핵심 패킹 규칙:**
- **Albedo.a** = emissive 강도 (material atlas 의 blue 채널에서 가져옴)
- **Normal** = `worldNormal * 0.5 + 0.5` 로 인코딩 → 라이팅에서 `* 2.0 - 1.0` 으로 디코딩
- **Material.b** = 정점 AO (`input.ao`), SSAO 와 별도로 조합
- **Depth** = WebGPU 하드웨어 depth32float, `depthCompare: 'less'`, 0=near, 1=far

G-Buffer 생성은 `src/renderer/GBuffer.ts` 에서 관리한다. 리사이즈 시 모든 텍스처를 재생성한다.

---

## 2. 렌더 패스 순서 (전체 프레임 파이프라인)

`DeferredPipeline.render()` (`src/renderer/DeferredPipeline.ts:830`) 에서 매 프레임 실행되는 전체 패스 순서:

```
┌─────────────────────────────────────────────────────────────────────┐
│                      DeferredPipeline.render()                      │
│                                                                     │
│  1. Shadow Pass ─────────────────────> Shadow Depth Map (2d-array)  │
│       ↓                                                             │
│  2. G-Buffer Pass ───────────────────> Albedo + Normal + Material   │
│       ↓                                    + Depth                  │
│  3. SSAO Pass ───────────────────────> SSAO Texture (half-res)     │
│       ↓                                                             │
│  4. Deferred Lighting ──────────────> HDR Texture                  │
│       ↓                                                             │
│  5. SSR Composite ──────────────────> HDR Texture (ping-pong)      │
│       ↓                                                             │
│  6. Sky Pass ───────────────────────> HDR Texture (depth==1.0만)    │
│       ↓                                                             │
│  7. Water Forward Pass ─────────────> HDR Texture (alpha blend)    │
│       ↓                                                             │
│  8. Volumetric Light Shafts ────────> HDR Texture (additive)       │
│       ↓                                                             │
│  8.5 Weather Particles ─────────────> HDR Texture (alpha blend)    │
│       ↓                                                             │
│  9. TAA (Velocity + Resolve) ───────> HDR Texture (resolved)       │
│       ↓                                                             │
│  9.5 Motion Blur ───────────────────> HDR Texture (ping-pong)      │
│       ↓                                                             │
│  9.6 Depth of Field ────────────────> HDR Texture (ping-pong)      │
│       ↓                                                             │
│ 10. Auto Exposure ──────────────────> Adapted Luminance (1x1)      │
│       ↓                                                             │
│ 11+12. Bloom + Tonemap ─────────────> Swapchain (sRGB)             │
└─────────────────────────────────────────────────────────────────────┘
```

### 각 패스의 입출력 요약

| 패스 | 입력 | 출력 |
|------|------|------|
| Shadow | 청크 VBO/IBO, lightViewProj | depth32float 2d-array (3 cascades) |
| G-Buffer | 청크 VBO/IBO, camera UBO, atlas texture | albedo + normal + material + depth |
| SSAO | depth, normal, noise, kernel | r8unorm half-res AO |
| Lighting | G-Buffer 4장, shadow map, SSAO, scene UBO, point lights | rgba16float HDR |
| SSR | G-Buffer (normal, material, depth), HDR input | HDR (ping-pong swap) |
| Sky | depth (sky mask), scene UBO | HDR (load + sky pixels) |
| Water | HDR copy (refraction), depth, water UBO | HDR (alpha blend) |
| Volumetric | depth, shadow map, volumetric UBO | HDR (additive blend) |
| Weather | weather UBO, depth | HDR (alpha blend) |
| TAA | depth, HDR, velocity, history | HDR (resolved + copy) |
| Auto Exposure | HDR → lum mip chain → adapt | r16float 1x1 adapted luminance |
| Bloom+Tonemap | HDR, bloom mip chain, adapted lum | swapchain bgra8unorm |

---

## 3. Uniform 버퍼 레이아웃

### 3.1 Scene Uniform (256 bytes)

`src/shaders/common/scene_uniforms.wgsl` 에 struct 정의, 라이팅 패스와 스카이 패스에서 `#include` 로 공유.

```wgsl
struct SceneUniforms {                          // offset (bytes)
  invViewProj:          mat4x4<f32>,            //   0 - 63   (64)
  cameraPos:            vec4<f32>,              //  64 - 79   (xyz=pos, w=waterLevel)
  lightDir:             vec4<f32>,              //  80 - 95   (xyz=sun/moon dir, w=elapsedTime)
  sunColor:             vec4<f32>,              //  96 - 111  (rgb=color, w=intensity)
  ambientColor:         vec4<f32>,              // 112 - 127  (rgb=sky, w=groundFactor)
  fogParams:            vec4<f32>,              // 128 - 143  (x=start, y=end, z=skyPackedParams, w=cloudCoverage)
  cloudParams:          vec4<f32>,              // 144 - 159  (x=baseNoiseScale, y=extinction, z=msFloor, w=detailStrength)
  viewProj:             mat4x4<f32>,            // 160 - 223  (unjittered, contact shadow용)
  contactShadowParams:  vec4<f32>,              // 224 - 239  (x=enabled, y=maxSteps, z=rayLength, w=thickness)
  skyNightParams:       vec4<f32>,              // 240 - 255  (x=moonPhase, y=moonBrightness, z=elapsedTime, w=trueSunHeight)
};
```

**주요 패킹 트릭:**
- `cameraPos.w` 에 `waterLevel` 을 숨김 — caustics 계산에 사용
- `lightDir.w` 에 `elapsedTime` 을 숨김 — water caustics 및 구름 애니메이션
- `lightDir.xyz` — 낮에는 sunDir, 밤에는 moonDir (sunHeight > -0.1 기준 전환)
- `fogParams.z` 에 `pack2x16float(starBrightness, nebulaIntensity)` — f16 2개를 f32 1개에 패킹
- `fogParams.w` 에 `cloudCoverage` — CPU에서 time-varying Simplex noise 포함하여 사전 계산
- `skyNightParams.w` 에 `trueSunHeight` — CPU에서 `sin((timeOfDay - 0.25) * 2π)` 계산, shader workaround 불필요

### 3.2 Camera Uniform (112 bytes)

G-Buffer 패스에서만 사용. `DeferredPipeline.ts:33` 에 정의.

```
offset 0:   viewProj         mat4x4<f32>   (64 bytes) — jittered (TAA 적용)
offset 64:  cameraPos         vec4<f32>     (16 bytes) — xyz=position, w=0
offset 80:  fogParams         vec4<f32>     (16 bytes) — x=fogStart, y=fogEnd
offset 96:  time              vec4<f32>     (16 bytes) — x=waterTime (바람 애니메이션)
```

**중요:** Camera uniform 의 `viewProj` 는 TAA 지터가 적용된 행렬이다. 라이팅에서 월드 위치를 재구성할 때는 Scene uniform 의 `invViewProj` (unjittered 역행렬)를 사용한다.

### 3.3 Shadow Uniform (208 bytes)

```wgsl
struct ShadowUniforms {
  lightViewProj: array<mat4x4<f32>, 3>,  // 0 - 191  (3 x 64 = 192 bytes)
  cascadeSplits: vec4<f32>,               // 192 - 207 (x,y,z = 분할 거리)
};
```

### 3.4 Point Light Storage Buffer (4112 bytes)

```wgsl
struct PointLightBuffer {
  count:   u32,                           // 0 - 3
  _pad:    u32 x 3,                       // 4 - 15
  lights:  array<PointLight, 128>,        // 16 - 4111
};
// PointLight: position(vec3f)+radius(f32)+color(vec3f)+intensity(f32) = 32 bytes
```

---

## 4. G-Buffer 패스

**파일:** `src/shaders/gbuffer.vert.wgsl`, `src/shaders/gbuffer.frag.wgsl`
**파이프라인:** `DeferredPipeline.ts:236-283`

### 4.1 Vertex Shader

```
입력 정점 레이아웃 (arrayStride = 28 bytes):
  location 0:  position      float32x3  (12 bytes)
  location 1:  normalIndex   uint32     (4 bytes)  — 하위 8비트=faceIdx, 상위 비트=blockType
  location 2:  texCoord      float32x2  (8 bytes)
  location 3:  ao            float32    (4 bytes)  — 정점 AO
```

**normalIndex 패킹:**
```wgsl
let faceIdx  = input.normalIndex & 0xFFu;    // 0~5: TOP/BOTTOM/NORTH/SOUTH/EAST/WEST
let blockType = input.normalIndex >> 8u;      // 블록 타입 ID
```

**바람 애니메이션:**

1. **나뭇잎 (blockType == 51):** 미세한 흔들림 (windStrength = 0.03)
   - X, Z, Y 축 모두 독립적 sin/cos 주파수로 움직임
   - `camera.time.x` 를 `% 628.318` 로 wrap — `sin()` 정밀도 손실 방지

2. **식물 (blockType 80~82):** 높이 기반 흔들림 (windStrength = 0.12 * heightFactor)
   - `fract(input.position.y)` 로 식물의 높이를 판별
   - 바닥(0.01) 은 거의 고정, 꼭대기(0.99) 는 크게 흔들림
   - `input.position` (원래 위치)를 주파수 입력에 사용하여 안정적 애니메이션

최종 clip position:
```wgsl
output.clipPos = camera.viewProj * vec4<f32>(worldPos, 1.0);  // jittered viewProj
```

### 4.2 Fragment Shader

**Alpha Cutout:**
```wgsl
if (blockType == 51u || (blockType >= 80u && blockType <= 82u)) {
    let cutoutAlpha = textureSampleLevel(atlasTexture, atlasSampler, input.texCoord, 0.0).a;
    if (cutoutAlpha < 0.5) { discard; }
}
```
아틀라스 텍스처 alpha 에 미리 bake 된 값으로 판정 — 프레임 간 완벽 안정성 보장.

**TBN 매트릭스 (Normal Mapping):**

솔리드 블록은 face index 에 따라 TBN 매트릭스를 구성한다:

```wgsl
fn buildTBN(faceIdx: u32) -> mat3x3<f32> {
  switch(faceIdx) {
    case 0u: { N = vec3f(0,1,0); T = vec3f(1,0,0); B = vec3f(0,0,1); }   // TOP
    case 1u: { N = vec3f(0,-1,0); T = vec3f(1,0,0); B = vec3f(0,0,-1); }  // BOTTOM
    case 2u: { N = vec3f(0,0,1); T = vec3f(-1,0,0); B = vec3f(0,1,0); }   // NORTH
    // ... 이하 6면 각각 정의
  }
  return mat3x3<f32>(T, B, N);
}
```

식물(blockType 80~82)은 normal atlas 를 사용하지 않고 face normal 그대로 사용하며, `front_facing` builtin 으로 뒷면 법선을 반전한다.

**G-Buffer 출력:**

```wgsl
output.albedo  = vec4<f32>(albedo.rgb, mat.b);           // A = emissive
output.normal  = vec4<f32>(worldNormal * 0.5 + 0.5, 1.0); // 인코딩
output.material = vec4<f32>(mat.r, mat.g, input.ao, 1.0); // R=roughness, G=metallic, B=vertexAO
```

### 4.3 파이프라인 설정

두 가지 파이프라인이 존재하며, 같은 셰이더를 공유:

| 파이프라인 | cullMode | 용도 |
|-----------|----------|------|
| `gbufferPipeline` | `'back'` | 솔리드 블록 (단면) |
| `gbufferVegetationPipeline` | `'none'` | 식물 (양면 렌더링) |

둘 다 `frontFace: 'ccw'` 이다 (WebGPU 표준).

---

## 5. 그림자 시스템

**파일:** `src/renderer/ShadowMap.ts`, `src/shaders/shadow.vert.wgsl`, `src/shaders/shadow_cutout.vert.wgsl`, `src/shaders/shadow_cutout.frag.wgsl`

### 5.1 Cascaded Shadow Mapping

3개의 캐스케이드를 사용한다. 각 캐스케이드는 하나의 2D array layer 에 depth 를 렌더링한다.

```
┌──────────────────────────────────────────┐
│  Shadow Texture: depth32float 2d-array   │
│  size: mapSize x mapSize x 3             │
│  ┌──────────┬──────────┬──────────┐      │
│  │ cascade 0│ cascade 1│ cascade 2│      │
│  │ 근거리    │ 중거리    │ 원거리    │      │
│  └──────────┴──────────┴──────────┘      │
└──────────────────────────────────────────┘
```

**캐스케이드 행렬 계산** (`ShadowMap.computeCascadeMatrix`):

1. 카메라 위치 중심으로 직교 투영(orthographic) 생성
2. `orthoZO` 사용 — WebGPU depth range [0, 1] (GL 의 [-1,1] 아님)
3. **텍셀 스냅핑**: 카메라가 서브텍셀 단위로 이동해도 그림자 맵이 떨리지 않도록, 투영 행렬의 translation 을 shadow map 텍셀 단위로 반올림
4. `depthBias: 2`, `depthBiasSlopeScale: 1.5` 로 shadow acne 방지

### 5.2 솔리드 vs 컷아웃 파이프라인

| 파이프라인 | Fragment Shader | 용도 |
|-----------|----------------|------|
| `pipeline` | 없음 (depth-only) | 솔리드 블록 |
| `cutoutPipeline` | `shadow_cutout.frag.wgsl` | 나뭇잎 + 식물 |

**솔리드 파이프라인 (`shadow.vert.wgsl`):**
```wgsl
@vertex
fn main(input: VertexInput) -> @builtin(position) vec4<f32> {
  return shadow.lightViewProj[cascade.index] * vec4<f32>(input.position, 1.0);
}
```
Fragment shader 가 없으므로 depth 만 기록된다.

**컷아웃 파이프라인 (`shadow_cutout.frag.wgsl`):**
```wgsl
@fragment
fn main(input: FragInput) {
  let blockType = input.normalIndex >> 8u;
  if (blockType == 51u || (blockType >= 80u && blockType <= 82u)) {
    let alpha = textureSampleLevel(atlasTexture, atlasSampler, input.texCoord, 0.0).a;
    if (alpha < 0.5) { discard; }
  }
}
```
아틀라스 alpha 로 투명 부분을 discard 하여 식물 그림자가 정확한 실루엣을 갖게 한다.

**렌더 순서 (캐스케이드당):**
1. 솔리드 draw calls 를 `pipeline` 으로 렌더
2. 식물 draw calls 를 `cutoutPipeline` 으로 렌더 (atlas bind group 추가)

---

## 6. SSAO (Screen-Space Ambient Occlusion)

**파일:** `src/renderer/SSAO.ts`, `src/shaders/ssao.wgsl`, `src/shaders/ssao_blur.wgsl`

### 6.1 반해상도 계산

성능 최적화를 위해 SSAO 는 **화면의 절반 해상도**에서 계산된다:
```typescript
this.halfWidth = Math.max(1, Math.floor(this.ctx.canvas.width / 2));
this.halfHeight = Math.max(1, Math.floor(this.ctx.canvas.height / 2));
```
출력 포맷은 `r8unorm` — 단일 채널 AO 값 (0=완전 차폐, 1=차폐 없음).

### 6.2 커널과 노이즈

**16-샘플 반구 커널** (`SSAO.ts:106-123`):
- 랜덤 방향을 반구(z >= 0)에 분포
- **가속 보간**: 원점에 가까운 샘플일수록 밀도가 높음 (scale = 0.1 + scale^2 * 0.9)
- Uniform buffer offset 128 에 기록 (`array<vec4<f32>, 16>`)

**4x4 노이즈 텍스처** (`SSAO_NOISE_SIZE = 4`):
- 랜덤 회전 벡터를 rgba8unorm 으로 인코딩
- `addressMode: 'repeat'` 로 타일링 → 커널 방향을 픽셀마다 무작위 회전

### 6.3 SSAO 셰이더 (`ssao.wgsl`)

```
1. depth 에서 view-space 위치 재구성 (invProjection 사용)
2. 노이즈 텍스처에서 랜덤 회전 벡터 → TBN 매트릭스 구성
3. 16개 커널 샘플 루프:
   a. TBN * kernelSample → view-space 방향
   b. fragPos + sampleDir * radius → 샘플 위치
   c. projection 으로 스크린 투영 → 해당 위치의 depth 샘플
   d. 샘플 depth 가 더 가까우면(sampleViewPos.z >= samplePos.z + bias) → 차폐
   e. rangeCheck 로 거리 기반 가중치 적용
4. ao = 1.0 - (occlusion / 16.0)
```

### 6.4 블러 패스 (`ssao_blur.wgsl`)

**분리형 양측 블러 (Separable Bilateral Blur):**
- 2-패스: 수평(direction=1,0) → 중간 텍스처 → 수직(direction=0,1) → 최종 텍스처
- 5-tap 커널 (offset -2 ~ +2)
- **깊이 기반 가중치**: `exp(-depthDiff * 1000.0)` — 깊이 차이가 큰 경계에서 블러를 억제하여 엣지 보존
- **공간 가중치**: `exp(-dist * 0.2)` — 가우시안 유사 감쇠

---

## 7. 디퍼드 라이팅

**파일:** `src/shaders/lighting.wgsl`

이 셰이더는 전체 화면 삼각형(fullscreen triangle) 위에서 실행된다. G-Buffer 4장과 그림자맵, SSAO 를 읽어 최종 HDR 라이팅을 계산한다.

### 7.1 풀스크린 삼각형 기법

```wgsl
@vertex
fn vs_main(@builtin(vertex_index) vid: u32) -> VertexOutput {
  let x = f32(i32(vid & 1u)) * 4.0 - 1.0;
  let y = f32(i32(vid >> 1u)) * 4.0 - 1.0;
  output.position = vec4<f32>(x, y, 0.0, 1.0);
  output.uv = vec2<f32>(x * 0.5 + 0.5, 1.0 - (y * 0.5 + 0.5));
}
```
정점 3개로 화면 전체를 덮는 oversized triangle 을 생성. UV 는 Y 플립 적용 (WebGPU UV 원점 = 좌상단).

### 7.2 G-Buffer 언패킹

```wgsl
// 월드 위치 재구성 (depth + invViewProj)
fn reconstructWorldPos(uv: vec2<f32>, depth: f32) -> vec3<f32> {
  let ndc = vec4<f32>(uv * 2.0 - 1.0, depth, 1.0);
  let ndcFlipped = vec4<f32>(ndc.x, -ndc.y, ndc.z, 1.0);  // Y 플립
  let worldH = scene.invViewProj * ndcFlipped;
  return worldH.xyz / worldH.w;
}

// 노멀 디코딩
let normal = normalize(normalSample.rgb * 2.0 - 1.0);

// 머티리얼 분리
let roughness = materialSample.r;
let metallic = materialSample.g;

// SSAO 샘플링 (반해상도이므로 bilinear sampler 사용)
let ao = textureSampleLevel(ssaoTexture, linearSampler, uv, 0.0).r;

// Albedo: sRGB → linear 변환
let albedo = pow(albedoSample.rgb, vec3<f32>(2.2));
let emissive = albedoSample.a;
```

**depth == 1.0 인 픽셀은 sky 이므로 early discard:**
```wgsl
if (depth >= 1.0) { discard; }
```

### 7.3 Cook-Torrance PBR

**GGX Normal Distribution Function (NDF):**
```wgsl
fn distributionGGX(NdotH: f32, roughness: f32) -> f32 {
  let a = roughness * roughness;
  let a2 = a * a;
  let denom = NdotH * NdotH * (a2 - 1.0) + 1.0;
  return a2 / (PI * denom * denom);
}
```

**Smith-Schlick Geometry Function:**
```wgsl
fn geometrySmithSchlick(NdotV: f32, NdotL: f32, roughness: f32) -> f32 {
  let r = roughness + 1.0;
  let k = (r * r) / 8.0;
  let ggx1 = NdotV / (NdotV * (1.0 - k) + k);
  let ggx2 = NdotL / (NdotL * (1.0 - k) + k);
  return ggx1 * ggx2;
}
```

**Schlick Fresnel:**
```wgsl
fn fresnelSchlick(cosTheta: f32, F0: vec3<f32>) -> vec3<f32> {
  return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}
```

**최종 직접광 조합:**
```wgsl
let F0 = mix(vec3<f32>(0.04), albedo, metallic);  // 메탈릭 워크플로우
let specular = (D * G * F) / (4.0 * NdotV * NdotL + 0.0001);
let kD = (vec3<f32>(1.0) - F) * (1.0 - metallic);  // 에너지 보존
let diffuse = kD * albedo / PI;
let directLight = (diffuse + specular) * sunColor * NdotL * shadowFactor * contactFactor;
```

### 7.4 태양광 + 포인트 라이트 루프

**태양광** = Cook-Torrance BRDF * shadow * contact shadow

**포인트 라이트 (최대 128개):**
```wgsl
for (var i = 0u; i < lightCount; i++) {
    let light = pointLights.lights[i];
    // ...radius check, attenuation...
    let attenuation = smoothstep(light.radius, 0.0, dist) / (1.0 + dist * dist);
    // Diffuse + Blinn-Phong specular (성능을 위해 Cook-Torrance 대신)
    pointLightContrib += pointDiffuse + pointSpecular;
}
```

포인트 라이트는 Cook-Torrance 대신 **Blinn-Phong specular** 를 사용하여 성능을 확보한다.

### 7.5 Contact Shadows (레이마칭)

화면 공간에서 태양 방향으로 레이마칭하여 미세한 접촉 그림자를 생성한다.

```wgsl
fn contactShadow(worldPos: vec3f, sunDir: vec3f) -> f32 {
    for (var i = 1; i <= maxSteps; i++) {
        let samplePos = worldPos + sunDir * stepSize * f32(i);
        // unjittered viewProj 로 클립 공간에 투영
        let clipPos = scene.viewProj * vec4f(samplePos, 1.0);
        // depth buffer 와 비교
        if (depthDiff > 0.0 && depthDiff < thickness) {
            return mix(0.3, 1.0, t * t);  // 거리 기반 페이드
        }
    }
    return 1.0;
}
```

`contactShadowParams` uniform 으로 enable/disable, maxSteps, rayLength, thickness 를 제어한다.

### 7.6 Water Caustics (수중 패턴)

`worldPos.y < waterLevel` 인 수중 표면에 caustics 패턴을 추가한다:

```wgsl
fn waterCaustics(worldPos: vec3f, time: f32, underwaterDepth: f32) -> f32 {
    // 1. 태양 방향을 따라 수면 위치로 투영
    // 2. Domain warping 으로 유기적 패턴
    // 3. 깊이 기반 주파수 스케일 (얕은 곳 = 선명, 깊은 곳 = 부드러움)
    // 4. 3 옥타브 사인파 합산
    // 5. 시간 기반 반짝임 (shimmer)
}
```

Caustics 밝기는 수심에 따라 지수적으로 감쇠(`exp(-underwaterDepth * 0.15)`)하며, 표면 법선의 상향 성분(`normalUp`)과 그림자 팩터를 곱한다.

### 7.7 Atmospheric Fog (거리 + 높이 기반)

수면 위/아래에 따라 서로 다른 안개 모델 적용:

**수면 위 (대기 산란):**
```wgsl
let fogFactor = clamp((viewDist - fogStart) / (fogEnd - fogStart), 0.0, 1.0);
let fogColor = atmosphericFogColor(viewDir, sunDir3, timeOfDay);
finalColor = mix(finalColor, fogColor, fogFactor);
```

`atmosphericFogColor` 함수는:
1. Rayleigh phase → 파란 산란
2. Henyey-Greenstein Mie phase (g=0.76) → 따뜻한 전방 산란
3. 석양 워밍 (sunset warming)
4. 밤 어둡게 (dayFactor smooth transition)
5. 야간 안개색 = ambient * 0.2 (안개가 ambient 보다 밝지 않도록)

**수면 아래 (Beer-Lambert):**
```wgsl
let uwAbsorb = vec3f(0.39, 0.11, 0.07);
let uwTransmittance = exp(-uwAbsorb * min(viewDist, 60.0));
finalColor = finalColor * uwTransmittance + uwScatterColor * (1.0 - uwTransmittance.b);
finalColor *= exp(-camDepthBelow * 0.06);  // 깊이 어둡게
```

---

## 8. 하늘 렌더링

**파일:** `src/shaders/sky.wgsl` (오케스트레이터), `src/shaders/common/` (모듈별 분리)

하늘 셰이더는 다음 모듈로 분리되어 `#include` 로 조립된다:

| 모듈 | 파일 | 내용 |
|------|------|------|
| Hash | `common/sky_hash.wgsl` | `hash()`, `hash2()` |
| Noise | `common/noise.wgsl` | Ashima Arts Simplex `snoise3d()` |
| Stars | `common/stars.wgsl` | `starColor()`, `starTwinkle()`, `sampleStarField()` |
| Nebula | `common/nebula.wgsl` | `sampleNebula()` |
| Moon | `common/moon.wgsl` | `moonAlbedo()`, `moonShading()`, `moonGlow()` |
| Meteor | `common/meteor.wgsl` | `sampleMeteor()` |
| Aurora | `common/aurora.wgsl` | `sampleAurora()` |
| Clouds | `common/clouds.wgsl` | `sampleCloudDensity()`, `raymarchClouds()` |
| Phase | `common/phase_functions.wgsl` | `rayleighPhase()`, `hgPhase()` |

### 8.1 depth==1.0 필터링

Sky pass 는 HDR 텍스처 위에 `loadOp: 'load'` 로 실행되며, 라이팅 결과가 기록된 불투명 픽셀은 보존한다:
```wgsl
let depth = textureLoad(gDepth, pixelCoord, 0);
if (depth < 1.0) { discard; }  // 불투명 픽셀은 건너뜀
```

레이 방향 재구성:
```wgsl
let worldH = scene.invViewProj * ndc;
let rayDir = normalize(worldH.xyz / worldH.w - scene.cameraPos.xyz);
```

### 8.2 주야간 전환

`trueSunHeight` (CPU에서 `sin((timeOfDay - 0.25) * 2π)` 계산)로 dayFactor/nightFactor를 결정:
```wgsl
let trueSunHeight = scene.skyNightParams.w;
let dayFactor = smoothstep(-0.15, 0.1, trueSunHeight);
let nightFactor = 1.0 - dayFactor;
```

`lightDir` 는 낮에는 sunDir, 밤에는 moonDir을 가리키며, CPU에서 sunHeight > -0.1 기준으로 전환한다.

### 8.3 Rayleigh / Mie 산란

```wgsl
// Rayleigh (파란 하늘)
let rayleighColor = vec3<f32>(0.3, 0.55, 0.95) * rayleigh * opticalDepth;

// Mie (태양 주변 헤일로)
let mie = hgPhase(cosTheta, 0.76);
let mieColor = vec3<f32>(1.0, 0.95, 0.85) * mie * 0.02;

// 합성: 기본 스카이 그라디언트 + 산란
skyColor += rayleighColor * 0.8 + mieColor;
```

Horizon warming (sunset/sunrise tint)은 `trueSunHeight` 가 0 근처일 때 활성화.

### 8.4 별 (3-레이어 해시 격자 + Kolmogorov Twinkling)

`sampleStarField()` 함수에서 구면 좌표계(theta/phi)를 격자로 분할한다:

| 레이어 | 격자 스케일 | 밀도 | 크기 |
|--------|-----------|------|------|
| Layer 1 (밝은 별) | 70.0 | ~3% (hash > 0.97) | 큰 falloff 반경 |
| Layer 2 (중간 별) | 200.0 | ~2% (hash > 0.98) | 중간 falloff 반경 |
| Layer 3 (어두운 별) | 500.0 | ~1.5% (hash > 0.985) | 작은 falloff 반경 |

```wgsl
let falloff = exp(-dist * dist * 80.0);  // 가우시안 형태 별 모양
```

**Kolmogorov twinkling** (`starTwinkle`): 멀티 스케일 sin 합산 — 자연적 대기 난류 효과 모방.

**별 색온도** (`starColor`): hash 값에 따라 B/A형(청백), F/G형(백), G/K형(황백), K/M형(주황)으로 분류.

**Inspector 제어**: `environment.sky.starBrightness` (0~2) — `fogParams.z` 에 f16 패킹.

달빛이 밝으면 별 밝기 40% 감소: `starFieldColor *= 1.0 - 0.4 * moonBright`

### 8.5 성운 / 은하수 (Milky Way)

`sampleNebula()` 는 3-layer FBM Simplex noise로 은하수 구조를 생성한다:

```
알고리즘:
1. 은하면 마스크: rayDir 기반 적도 밴드 + 기울기
2. 3-octave Simplex FBM으로 성운 밀도 계산
3. 보라-파랑-시안 색상 그라디언트
4. 달빛이 밝으면 30% 감쇠
```

**Inspector 제어**: `environment.sky.nebulaIntensity` (0~2) — `fogParams.z` 에 f16 패킹 (starBrightness와 함께).

### 8.6 달 (원형 + 3D N·L 라이팅 + 위상 마스크)

원형 Euclidean distance로 달 모양 생성:
```wgsl
let moonDist = length(vec2<f32>(moonLocalX, moonLocalY));
let moonSize = 0.030;
```

**Procedural 표면** (`moonAlbedo`): Simplex noise 기반 크레이터 + 마레(바다) 패턴.

**3D 라이팅** (`moonShading`): 구면 법선 `N = (normX, normY, sqrt(1 - r²))` 과 `N·L` 내적으로 반구형 음영.

**위상 마스크** (`moonPhaseMask`):
- `moonPhase` (0~1) 에 따라 terminator line 위치 계산
- `cos(moonPhase * 2π)` 로 terminator X 좌표 결정
- 전반(waxing): 오른쪽부터 밝아짐 / 후반(waning): 오른쪽부터 어두워짐
- `smoothstep` 로 부드러운 terminator edge

**Earthshine:** 그림자 면에 미약한 빛 (`vec3(0.04, 0.045, 0.06)`)

**달 글로우** (`moonGlow`): 3단계 감쇠 — inner (0.998+), mid Mie (0.990+), outer (0.970+)

### 8.7 유성 (Deterministic Slot System)

`sampleMeteor()` 는 4슬롯 결정론적 유성 시스템:

```
알고리즘:
1. 시간을 슬롯으로 분할 (각 슬롯 = 4초 주기)
2. hash로 슬롯별 출현 확률 (~15%), 시작점, 방향, 속도 결정
3. 유성 trail: rayDir과 유성 벡터 간 거리 기반 밝기
4. trail 길이에 따른 감쇠 + 헤드 밝기 증폭
```

### 8.8 오로라 (Analytic Simplex 커튼)

`sampleAurora()` 는 BSL/AstraLex 스타일의 수직 커튼 오로라를 구현한다:

```
알고리즘:
1. 고도 마스크: 10° ~ 55° 사이에서만 가시
2. 분석적 수평 슬라이스 (레이-평면 교차)
3. 각 슬라이스에서:
   a. Simplex 노이즈로 drape warp (커튼이 접히는 형태)
   b. Simplex 노이즈로 sway (전체 흔들림)
   c. 1D fold 패턴: noise ≈ 0.5 지점에서 밝아짐 (커튼 주름 라인)
4. 색상: 하단 = 초록-시안, 상단 = 보라-마젠타
5. 총 6회 snoise3d 호출 (분석적 방식)
```

### 8.9 볼류메트릭 구름

`raymarchClouds()` 에서 적응형 레이마칭:

```
Cloud Layer: Y = 300 ~ 500
Ray March Steps: 16 ~ 40 (적응형 — 수직 레이는 구름층을 빨리 통과하므로 적은 스텝)
Light March Steps: 5 (근거리) / 3 (t > 5000, 원거리)

밀도 함수 (sampleCloudDensity):
1. 높이 그라디언트: smoothstep(0.0, 0.15, h) * smoothstep(1.0, 0.5, h)
2. 바람 이동: wind = vec3(time*15, time*0.9, time*6)
3. 기본 형태: 3-octave FBM Simplex noise (0.625 + 0.25 + 0.125)
4. Coverage: CPU에서 base + time-varying Simplex noise 사전 계산
5. 디테일 침식: 3-octave Simplex (0.5 + 0.3 + 0.2) * detailStrength

라이팅:
- 각 샘플에서 lightDir 방향으로 light march → optical depth 계산
- Beer-Lambert: beer = exp(-lightOD * 0.15)
- Multi-scatter floor: 완전 어둠 방지
- Shadow ↔ Lit 색상 블렌딩 + silver lining
- Energy-conserving integration
- 조기 종료: transmittance < 0.03

Day/Night 팔레트:
- Day: warm sunlight ↔ sky-blue shadow
- Night: near-black ↔ dim silver-blue moonlight (moonBrightness 의존)
- dayFactor 로 블렌딩

성능 최적화:
- 적응형 스텝: rayDir.y 기반 16~40 스텝 (수직 = 적은 스텝)
- 원거리 라이트 스텝 축소: t > 5000 → 3스텝
- 커버리지 노이즈 CPU 사전 계산 (GPU 픽셀당 2x snoise3d 제거)
- 조기 종료 임계치 0.03 (시각 차이 미미)
```

---

## 9. 물 렌더링

**파일:** `src/shaders/water.vert.wgsl`, `src/shaders/water.frag.wgsl`

물은 **포워드 패스**로 HDR 텍스처 위에 알파 블렌딩 렌더링된다. 렌더 직전에 현재 HDR 텍스처를 별도 텍스처로 복사하여 굴절(refraction) 소스로 사용한다.

### 9.1 정점 셰이더: 코사인 파동 합산

```wgsl
let wave = sin(pos.x * 0.8 + t * 1.2) * 0.08     // 큰 느린 파동
         + sin(pos.z * 1.2 + t * 0.9) * 0.06      // 직교 파동
         + sin((pos.x + pos.z) * 2.0 + t * 2.5) * 0.03   // 대각선 빠른 파동
         + sin((pos.x - pos.z) * 3.0 + t * 1.8) * 0.015; // 미세 디테일
pos.y += wave;
```

4 옥타브의 사인파를 합산하여 자연스러운 수면 파형을 생성한다. 각 옥타브는 방향, 주파수, 속도, 진폭이 다르다.

### 9.2 프래그먼트 셰이더

**수면 위 (위에서 내려다보는 시점):**

1. **Screen-space refraction with chromatic dispersion:**
```wgsl
let refractOffset = N.xz * refractStrength * distAtten;
let dispersion = refractOffset * 0.3;
let refractR = textureSampleLevel(sceneColorTex, texSampler, refractUV + dispersion, 0.0).r;
let refractG = textureSampleLevel(sceneColorTex, texSampler, refractUV, 0.0).g;
let refractB = textureSampleLevel(sceneColorTex, texSampler, refractUV - dispersion, 0.0).b;
```

2. **Beer's Law 흡수:**
```wgsl
const WATER_ABSORB = vec3f(0.39, 0.11, 0.07);  // 빨강 >> 초록 >> 파랑
let transmittance = exp(-WATER_ABSORB * waterDepth);
```

3. **Edge foam (해안선):** `smoothstep(0.5, 0.0, waterDepth)` + 사인파 변조

4. **Fresnel 반사:**
```wgsl
let F0 = 0.02;
let fresnel = F0 + (1.0 - F0) * pow(1.0 - NdotV, 5.0);
color = mix(color, reflection, fresnel);
```

5. **하늘 반사 (그라디언트 기반):**
```wgsl
let skyGradient = clamp(R.y * 0.5 + 0.5, 0.0, 1.0);
let skyColor = mix(horizonColor, zenithColor, skyGradient);
let reflection = skyColor + specular;  // specular = 태양 반사
```

**수면 아래 (카메라가 물속):**

1. Snell's window: `smoothstep(0.55, 0.75, cosAngle)` — 임계각(~48.6도) 밖은 전반사
2. 전반사 영역: 어두운 물 색상 + specular 글린트
3. Beer-Lambert 흡수: 카메라→수면 거리에 따른 색 감쇠
4. 깊이 어둡게: `exp(-depthBelowSurface * 0.08)`

### 9.3 파이프라인 설정

```typescript
// 양면 렌더링 (수면 아래에서도 보임)
cullMode: 'none'
// depth 쓰기 비활성 (투명체)
depthWriteEnabled: false
depthCompare: 'less-equal'
// Alpha blending
blend: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' }
```

---

## 10. 볼류메트릭 이펙트 (God Rays)

**파일:** `src/shaders/volumetric.wgsl`, `src/renderer/PostProcess.ts`

### 10.1 화면 공간 레이마칭

카메라에서 각 픽셀의 월드 위치까지 레이마칭하며, 각 샘플 지점에서 그림자 맵을 조회한다.

```wgsl
for (var i = 0; i < numSteps; i++) {
    let t = startOffset + f32(i) * stepSize;
    let samplePos = camPos + rayDirNorm * t;
    let fogDens = heightFogDensity(samplePos.y, seaLevel);
    let shadowVal = sampleShadowAt(samplePos);
    sunAccum += shadowVal * effectiveDensity;  // 그림자 안 = 0, 빛 = 1
    ambientAccum += effectiveDensity;
}
```

### 10.2 그림자 맵 샘플링

`sampleShadowAt()` 는 간소화된 캐스케이드 선택 + **단일 탭** (PCF 없음, 성능 우선):
```wgsl
return textureSampleCompareLevel(
    shadowMap, shadowSampler, shadowUV, i32(cascadeIdx), currentDepth - 0.003
);
```

### 10.3 높이 기반 밀도 감쇠

```wgsl
fn heightFogDensity(height: f32, seaLevel: f32) -> f32 {
    let heightAboveSea = height - seaLevel;
    if (heightAboveSea <= 0.0) {
        return 0.6 * (1.0 + min(-heightAboveSea * 0.02, 0.4));  // 수면 아래: 더 짙음
    }
    return 0.6 * exp(-0.08 * heightAboveSea);  // 수면 위: 지수 감쇠
}
```

### 10.4 Temporal Dither (frameIndex)

밴딩 아티팩트를 줄이기 위한 시간적 디더링:
```wgsl
let ditherPattern = fract(dot(input.position.xy, vec2f(0.7548776662, 0.56984029))
                   + fract(frameIndex * 0.7548));
let startOffset = ditherPattern * stepSize;
```
`frameIndex` 가 매 프레임 증가하므로 디더 패턴이 시간적으로 회전하며, TAA 가 이를 평균화한다.

### 10.5 위상 함수와 안개 색상

**Dual-lobe Henyey-Greenstein:**
```wgsl
fn dualLobeHG(cosTheta: f32) -> f32 {
    let forward = henyeyGreenstein(cosTheta, 0.75);   // 전방 산란
    let back    = henyeyGreenstein(cosTheta, -0.3);    // 후방 산란
    return mix(back, forward, 0.7);
}
```

안개 색상: 태양 쪽은 따뜻한 색 (`vec3f(0.85, 0.75, 0.55)`), 반대쪽은 차가운 색 (`vec3f(0.45, 0.5, 0.65)`)

**블렌딩:** `additive blend` (HDR 텍스처에 더해짐)
```typescript
blend: {
    color: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
    alpha: { srcFactor: 'zero', dstFactor: 'one', operation: 'add' },
}
```

---

## 11. 날씨 파티클

**파일:** `src/shaders/weather.wgsl`

### 11.1 비/눈 파티클 시스템

GPU 인스턴싱으로 64x64 = 4096 개의 파티클을 렌더링한다. 정점 버퍼 없이 `vertex_index` 와 `instance_index` 만으로 생성.

```typescript
pass.draw(6, WEATHER_PARTICLE_COUNT);  // 6 vertices per quad, 4096 instances
```

### 11.2 그리드 기반 스폰

```wgsl
let snapX = floor(u.cameraPos.x / spacing) * spacing;
let snapZ = floor(u.cameraPos.z / spacing) * spacing;
let baseX = snapX + (f32(ix) - f32(gridSize) / 2.0) * spacing + hash1 * spacing;
```

카메라 위치에 스냅된 격자 → 플레이어 주변에 항상 파티클이 존재. per-instance hash 로 랜덤 오프셋.

**비 vs 눈:**

| 속성 | 비 (type=1) | 눈 (type=2) |
|------|------------|------------|
| 낙하 속도 | 8.0 | 1.5 |
| 파티클 크기 X | 0.015 | 0.04 |
| 파티클 크기 Y | 0.25 | 0.04 |
| 수평 표류 | 없음 | sin/cos 기반 |
| 형태 | 세로 줄무늬 | 원형 도트 |
| 색상 | 약간 푸른 흰색 | 순백 |

**거리 페이드:** `1.0 - smoothstep(20.0, 30.0, dist)`

---

## 12. TAA (Temporal Anti-Aliasing)

**파일:** `src/renderer/TAA.ts`, `src/shaders/velocity.wgsl`, `src/shaders/taa_resolve.wgsl`

### 12.1 Halton 시퀀스 지터

```typescript
function halton(index: number, base: number): number {
    let result = 0, f = 1 / base, i = index;
    while (i > 0) {
        result += f * (i % base);
        i = Math.floor(i / base);
        f /= base;
    }
    return result;
}
```

**적용:** 프레임마다 Halton(2), Halton(3) 시퀀스로 서브픽셀 오프셋을 생성하여 projection 행렬에 적용:
```typescript
const [jx, jy] = this.taa.getJitter(width, height);
jitteredProj[8] += jx;   // projection[2][0]
jitteredProj[9] += jy;   // projection[2][1]
```
16 프레임 주기로 순환 (`frameIndex % 16 + 1`).

### 12.2 Velocity 버퍼 (`velocity.wgsl`)

각 픽셀의 motion vector 를 계산한다:

```wgsl
// 1. 현재 프레임의 unjittered invViewProj 로 월드 위치 재구성
let worldH = uniforms.invViewProj * ndc;
let worldPos = worldH.xyz / worldH.w;

// 2. 이전 프레임의 viewProj 로 재투영
let prevClip = uniforms.prevViewProj * vec4<f32>(worldPos, 1.0);
let prevUV = vec2f(prevNDC.x * 0.5 + 0.5, 0.5 - prevNDC.y * 0.5);

// 3. velocity = currentUV - prevUV
return input.uv - prevUV;
```

출력 포맷: `rg16float` (2채널 16비트 float).

### 12.3 History Reprojection + Neighborhood Clamping (`taa_resolve.wgsl`)

```wgsl
// 1. 현재 프레임 색상 로드
let currentColor = textureLoad(currentTex, pixelCoord, 0).rgb;

// 2. velocity 로 히스토리 UV 계산
let historyUV = input.uv - velocity;

// 3. 히스토리 샘플 (bilinear)
let historyColor = textureSampleLevel(historyTex, linearSampler, historyUV, 0.0).rgb;

// 4. 3x3 neighborhood min/max → AABB clamping (anti-ghosting)
// Playdead-style clipAABB
let clampedHistory = clipAABB(nMin, nMax, historyColor);

// 5. 블렌딩
let result = mix(currentColor, clampedHistory, blendFactor);
```

**clipAABB (Playdead 스타일):**
```wgsl
fn clipAABB(aabbMin: vec3f, aabbMax: vec3f, color: vec3f) -> vec3f {
    let center = (aabbMin + aabbMax) * 0.5;
    let extent = (aabbMax - aabbMin) * 0.5 + 0.0001;
    let offset = color - center;
    let ts = abs(extent / (abs(offset) + 0.0001));
    let t = min(min(ts.x, ts.y), ts.z);
    if (t < 1.0) { return center + offset * t; }
    return color;
}
```

### 12.4 Ping-pong 히스토리 버퍼

```
┌────────────────────────────────────────────────┐
│   Frame N                                       │
│                                                  │
│   historyB (이전 결과) ───read──→ TAA Resolve   │
│                                    ↓             │
│   resolveTarget ←──────── 결과 기록              │
│       │                                          │
│       ├──copy──→ HDR texture (후처리에 사용)      │
│       └──copy──→ historyA (다음 프레임 히스토리)  │
│                                                  │
│   pingPong = 0→1 (swap)                          │
│                                                  │
│   Frame N+1                                      │
│   historyA (이전 결과) ───read──→ TAA Resolve    │
│   ...                                            │
└────────────────────────────────────────────────┘
```

---

## 13. 자동 노출 (Auto Exposure)

**파일:** `src/shaders/lum_extract.wgsl`, `src/shaders/lum_downsample.wgsl`, `src/shaders/lum_adapt.wgsl`

### 13.1 휘도 추출 (`lum_extract.wgsl`)

HDR 텍스처에서 1/4 해상도로 log2 luminance 를 추출:
```wgsl
let luminance = dot(color, vec3f(0.2126, 0.7152, 0.0722));
let logLum = log2(luminance + 0.0001);
return vec4f(logLum, 0.0, 0.0, 1.0);
```
포맷: `r16float`

### 13.2 다운샘플 체인 (`lum_downsample.wgsl`)

1/4 해상도에서 시작하여 1x1 이 될 때까지 bilinear 다운샘플을 반복:
```wgsl
let val = textureSampleLevel(srcTex, linearSampler, input.uv, 0.0).r;
```

### 13.3 지수 적응 (`lum_adapt.wgsl`)

```wgsl
// 평균 휘도에서 목표 노출 계산
let avgLum = exp2(logLum);
let targetExposure = clamp(keyValue / (avgLum + 0.0001), minExposure, maxExposure);

// 이전 프레임 노출과 지수 보간
let alpha = 1.0 - exp(-adaptSpeed * dt);
adaptedExposure = mix(prevExposure, targetExposure, alpha);
```

첫 프레임(prevExposure ≈ 0)은 즉시 스냅. 이후는 `adaptSpeed` 와 `dt` 로 부드러운 전환.

### 13.4 Ping-pong Adapted Luminance

```
Frame N: adaptedLum[0] (read) → adaptedLum[1] (write)
Frame N+1: adaptedLum[1] (read) → adaptedLum[0] (write)
```

Tonemap pass 에서 `adaptedLumTex` 를 읽어 최종 노출 값으로 사용.

---

## 14. 블룸 (Bloom)

**파일:** `src/shaders/bloom_threshold.wgsl`, `src/shaders/bloom_downsample.wgsl`, `src/shaders/bloom_upsample.wgsl`

### 14.1 밝기 임계값 추출 (`bloom_threshold.wgsl`)

```wgsl
let brightness = dot(color, vec3f(0.2126, 0.7152, 0.0722));
let contribution = max(brightness - params.threshold, 0.0);
let softKnee = contribution / (contribution + params.knee + 0.0001);
return vec4f(color * softKnee, 1.0);
```
`softKnee` 로 임계값 경계를 부드럽게 처리하여 블룸 경계의 하드 컷오프를 방지한다.

### 14.2 Mip 체인 다운샘플링 (`bloom_downsample.wgsl`)

**13-tap 다운샘플** (Call of Duty 방법):
```
가중치 분포:
  코너 4개:      0.03125 each  (a, c, g, i)
  십자 4개:      0.0625 each   (b, d, f, h)
  내부 4개:      0.125 each    (j, k, l, m)
  중앙 1개:      0.125         (e)
```

이 방법은 체커보드 아티팩트를 방지하며 자연스러운 가우시안 유사 다운샘플을 제공한다.

```
Mip 체인 흐름:
  HDR (full res)
    → bloomMip[0] (half)     ← threshold 추출
    → bloomMip[1] (quarter)  ← downsample
    → bloomMip[2] (1/8)      ← downsample
    → ...
    → bloomMip[N-1]          ← 최소 크기
```

### 14.3 가우시안 업샘플링 합성 (`bloom_upsample.wgsl`)

**9-tap tent 필터:**
```wgsl
// 가중치: 1 2 1  →  합계 = 16
//         2 4 2
//         1 2 1
result /= 16.0;
```

**Additive blend:**
```typescript
blend: {
    color: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
    alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
}
```

업샘플 결과를 이전 mip 에 additive 로 합산 → 최종 bloomMip[0] 에 모든 레벨의 블룸이 축적.

```
업샘플 흐름 (역순):
  bloomMip[N-1] → bloomMip[N-2] += upsample(bloomMip[N-1])
                → bloomMip[N-3] += upsample(bloomMip[N-2])
                → ...
                → bloomMip[0]   += upsample(bloomMip[1])   ← 최종 블룸
```

---

## 15. 톤매핑

**파일:** `src/shaders/tonemap.wgsl`

### 15.1 Chromatic Aberration

톤매핑 전에 색수차(chromatic aberration)를 적용:
```wgsl
let caDir = (input.uv - 0.5) * 0.002;  // 화면 중심에서 방사형 오프셋
let hdrR = textureSampleLevel(hdrTex, linearSampler, input.uv + caDir, 0.0).r;
let hdrG = textureSampleLevel(hdrTex, linearSampler, input.uv, 0.0).g;
let hdrB = textureSampleLevel(hdrTex, linearSampler, input.uv - caDir, 0.0).b;
```
R, G, B 채널을 방사형으로 미세하게 분리.

### 15.2 ACES Filmic 톤매핑

Narkowicz 근사:
```wgsl
fn acesFilm(x: vec3f) -> vec3f {
    let a = 2.51; let b = 0.03; let c = 2.43; let d = 0.59; let e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), vec3f(0.0), vec3f(1.0));
}
```

### 15.3 색 보정 (`colorGrade`)

```
1. Color Temperature: 낮=따뜻한 톤(1.05, 1.02, 0.95), 밤=차가운 톤(0.85, 0.9, 1.2)
2. Golden Hour: sunHeight 기반 goldenHour factor → 노을 황금빛 틴트
3. Vibrance + Scotopic: 밤에는 채도 감소(saturationBoost = 0.85), 낮에는 채도 증가(1.15)
4. Soft Contrast S-curve: (color - 0.5) * 1.05 + 0.5
5. Lift/Gamma/Gain: 야간 blue lift (0.0, 0.0, 0.02)
```

### 15.4 야간 노출 부스트

```wgsl
let nightFactor = 1.0 - smoothstep(0.2, 0.3, timeOfDay) * (1.0 - smoothstep(0.7, 0.8, timeOfDay));
let nightExposureBoost = mix(1.0, 1.4, nightFactor);
color *= exposure * nightExposureBoost;
```

### 15.5 Vignette

```wgsl
let vignetteDist = length(vignetteCoord);
let vignette = 1.0 - smoothstep(0.5, 1.5, vignetteDist);
color *= mix(1.0, vignette, 0.4);
```

### 15.6 수중 후처리

```wgsl
if (params.underwaterDepth > 0.0) {
    // 강한 비네트 (수면 빛 원뿔 시뮬레이션)
    color *= mix(1.0, uwVignette, uwVignetteStrength);
    // 청녹 틴트
    color = mix(color, color * vec3f(0.7, 0.9, 1.0), tintStrength);
}
```

### 15.7 감마 보정

```wgsl
color = pow(color, vec3<f32>(1.0 / 2.2));  // linear → sRGB
```

출력 포맷: swapchain 의 기본 포맷 (`navigator.gpu.getPreferredCanvasFormat()`, 보통 `bgra8unorm`).

---

## 16. SSR (Screen-Space Reflections)

**파일:** `src/shaders/ssr.wgsl`

### 16.1 화면 공간 레이마칭

저 roughness 표면(roughness < 0.5)만 처리. 나머지는 base color 를 그대로 패스스루한다.

```wgsl
const MAX_STEPS: u32 = 32u;
const STEP_SIZE: f32 = 0.5;
const BINARY_STEPS: u32 = 5u;
const THICKNESS: f32 = 0.3;
const ROUGHNESS_CUTOFF: f32 = 0.5;
```

**레이마칭 루프:**
```wgsl
for (var i = 0u; i < MAX_STEPS; i++) {
    rayPos += reflectDir * stepSize;
    let screenCoord = worldToScreen(rayPos);

    // 스크린 범위 체크
    if (rayUV out of [0,1]) { break; }

    // depth 비교: 레이가 장면 지오메트리 뒤로 간 경우
    if (rayDepth > sceneDepth && sceneDepth > 0.0) {
        // thickness 체크 → binary refinement → hit
    }

    stepSize *= 1.05;  // 원거리 가속
}
```

### 16.2 Binary Search Refinement

히트 지점을 정밀하게 찾기 위한 5-step binary search:
```wgsl
var refinedPos = rayPos - reflectDir * stepSize;
var refinedStep = stepSize * 0.5;
for (var j = 0u; j < BINARY_STEPS; j++) {
    refinedPos += reflectDir * refinedStep;
    // depth 비교 → 앞으로/뒤로 반복
    refinedStep *= 0.5;
}
```

### 16.3 화면 경계 페이드

```wgsl
let edgeFade = 1.0 - pow(max(abs(finalUV.x * 2.0 - 1.0), abs(finalUV.y * 2.0 - 1.0)), 4.0);
```
반사가 화면 가장자리에서 자연스럽게 사라진다.

**Fresnel 기반 반사 강도:**
```wgsl
let fresnel = fresnelSchlick(NdotV, F0);
hitColor = reflectedColor * fresnel;
```

**핑퐁 합성:**
SSR 은 현재 HDR 을 읽고 결과를 "other" HDR 에 기록한 뒤 `swapHdr()` 호출:
```wgsl
let composited = mix(baseColor.rgb, hitColor, hitAlpha);
```

---

## 부록: 주요 파일 참조

| 파일 | 역할 |
|------|------|
| `src/renderer/DeferredPipeline.ts` | 전체 프레임 오케스트레이션, uniform 업데이트 |
| `src/renderer/GBuffer.ts` | G-Buffer 텍스처 생성/리사이즈 |
| `src/renderer/ShadowMap.ts` | CSM 행렬, 솔리드/컷아웃 shadow 렌더 |
| `src/renderer/SSAO.ts` | 반해상도 SSAO + bilateral blur |
| `src/renderer/PostProcess.ts` | 블룸, 톤맵, 볼류메트릭, SSR, 자동 노출, DoF, Motion Blur |
| `src/renderer/TAA.ts` | Halton 지터, velocity, resolve, 히스토리 관리 |
| `src/renderer/WebGPUContext.ts` | WebGPU 초기화, depth 텍스처, 리사이즈 |
| `src/constants.ts` | GPU 텍스처 포맷, 구조 상수 |
| `src/shaders/gbuffer.vert.wgsl` | G-Buffer 정점 (바람 애니메이션) |
| `src/shaders/gbuffer.frag.wgsl` | G-Buffer 프래그먼트 (TBN, cutout) |
| `src/shaders/lighting.wgsl` | PBR 라이팅, 그림자, fog, caustics |
| `src/shaders/sky.wgsl` | 하늘, 별, 달, 오로라, 구름 |
| `src/shaders/shadow.vert.wgsl` | 솔리드 shadow depth-only |
| `src/shaders/shadow_cutout.*.wgsl` | 컷아웃 shadow (alpha test) |
| `src/shaders/ssao.wgsl` | SSAO 반구 샘플링 |
| `src/shaders/ssao_blur.wgsl` | 분리형 양측 블러 |
| `src/shaders/ssr.wgsl` | 화면 공간 반사 |
| `src/shaders/volumetric.wgsl` | God rays 레이마칭 |
| `src/shaders/water.vert.wgsl` | 수면 파동 |
| `src/shaders/water.frag.wgsl` | 물 프래그먼트 (Beer, Fresnel, Snell) |
| `src/shaders/weather.wgsl` | 비/눈 파티클 |
| `src/shaders/velocity.wgsl` | Motion vector 계산 |
| `src/shaders/taa_resolve.wgsl` | TAA resolve + neighborhood clamping |
| `src/shaders/lum_extract.wgsl` | Log luminance 추출 |
| `src/shaders/lum_downsample.wgsl` | Luminance mip 다운샘플 |
| `src/shaders/lum_adapt.wgsl` | 지수 적응 노출 |
| `src/shaders/bloom_threshold.wgsl` | 밝기 임계값 + soft knee |
| `src/shaders/bloom_downsample.wgsl` | 13-tap CoD 다운샘플 |
| `src/shaders/bloom_upsample.wgsl` | 9-tap tent 업샘플 |
| `src/shaders/tonemap.wgsl` | ACES, 색 보정, 감마, 비네트 |
