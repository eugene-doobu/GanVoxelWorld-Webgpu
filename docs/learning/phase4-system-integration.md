# Phase 4: 시스템 연동 (System Integration)

본 문서는 WebGPU 복셀 엔진의 보조 시스템들 -- Day/Night 사이클, 날씨, 텍스처 아틀라스, 카메라, HUD, Inspector 패널 -- 이 어떻게 구현되고 서로 연결되는지를 설명한다. 각 시스템의 내부 동작 원리와, 중앙 Config 시스템을 통한 반응형 데이터 흐름을 다룬다.

---

## 목차

1. [Day/Night 사이클](#1-daynight-사이클)
2. [날씨 시스템](#2-날씨-시스템)
3. [텍스처 아틀라스](#3-텍스처-아틀라스)
4. [카메라 시스템](#4-카메라-시스템)
5. [WebGPU 컨텍스트](#5-webgpu-컨텍스트)
6. [HUD](#6-hud)
7. [Inspector 패널 시스템](#7-inspector-패널-시스템)
8. [시스템 간 데이터 흐름](#8-시스템-간-데이터-흐름)

---

## 1. Day/Night 사이클

> 파일: `src/world/DayNightCycle.ts`

DayNightCycle 클래스는 하루의 시간 흐름을 시뮬레이션하여 태양 위치, 조명 색상, 달 위상을 관리한다.

### 1.1 시간 시스템

`timeOfDay`는 `[0, 1]` 범위의 정규화된 시간값이다.

| 값 | 시각 | 의미 |
|---|---|---|
| 0.0 | 00:00 | 자정 |
| 0.25 | 06:00 | 일출 |
| 0.5 | 12:00 | 정오 |
| 0.75 | 18:00 | 일몰 |

**시작값은 `0.35` (~08:24, 아침)** 으로, 처음 실행 시 밝은 조명 상태를 보여준다.

시간은 매 프레임 `dt` 기반으로 진행된다:

```typescript
// DayNightCycle.update()
this.timeOfDay += dt / Config.data.environment.dayDurationSeconds;
this.timeOfDay -= Math.floor(this.timeOfDay); // [0,1) 래핑
```

`dayDurationSeconds`(기본 1200초 = 20분)가 현실 시간 대비 하루 길이를 결정한다. Config에서 실시간으로 변경 가능하다.

### 1.2 태양 위치 계산

태양은 XY 평면(Y=up, X=east-west) 상의 원 궤도를 따른다:

```typescript
private updateSunPosition(): void {
  const angle = (this.timeOfDay - 0.25) * Math.PI * 2;
  const sunX = Math.cos(angle) * 0.5;
  const sunY = Math.sin(angle);
  const sunZ = Math.cos(angle) * 0.3;
  vec3.normalize(this.sunDir, vec3.fromValues(sunX, sunY, sunZ));
}
```

**각도 변환 논리:**
- `timeOfDay = 0.25`(06:00)일 때 `angle = 0` -> 태양이 수평선에 위치
- `timeOfDay = 0.5`(정오)일 때 `angle = PI/2` -> 태양이 천정에 위치
- `timeOfDay = 0.75`(18:00)일 때 `angle = PI` -> 태양이 반대편 수평선에 위치
- `timeOfDay = 0.0`(자정)일 때 `angle = -PI/2` -> 태양이 최저점에 위치

`sunHeight`는 정규화된 `sunDir[1]` 성분으로, -1(직하) ~ +1(직상) 범위이다.

### 1.3 조명 전환 (3단계)

`sunHeight` 값에 따라 3개의 조명 모드로 분기된다:

```
sunHeight:  -1.0      -0.1   0.0   0.1      1.0
             |--야간--|--전환--|--주간--|
                      ← 0.2 →
```

#### 주간 (sunHeight > 0.1)

```typescript
const dayFactor = Math.min((sunHeight - 0.1) / 0.3, 1.0);
this.sunIntensity = 0.9 + 0.3 * dayFactor;  // 0.9 ~ 1.2
// 따뜻한 백색: R=1.0, G=0.92~1.0, B=0.80~0.95
```

- `dayFactor`가 0(수평선 근처)에서 1(높이 올라감)로 보간
- 태양 색상은 약간 따뜻한 백색 (`[1.0, 0.92+, 0.80+]`)
- ambient 색상도 밝은 하늘빛으로 전환

#### 일출/일몰 전환 (sunHeight: -0.1 ~ 0.1)

```typescript
const t = (sunHeight + 0.1) / 0.2; // 0(-0.1) ~ 1(0.1)
this.sunColor[0] = 0.35 + 0.65 * t;  // 달빛 파란 → 따뜻한 주황
this.sunColor[1] = 0.45 + 0.47 * t;
this.sunColor[2] = 0.70 + 0.10 * t;
this.sunIntensity = 0.15 + 0.85 * t;  // 달빛 세기 → 낮 세기
```

`t` 파라미터가 야간 색상(차가운 파란)과 주간 색상(따뜻한 백색)을 부드럽게 블렌딩한다.

#### 야간 (sunHeight < -0.1)

```typescript
// moonDir은 updateSunPosition()에서 -sunDir로 사전 계산됨
// DeferredPipeline이 lightDir getter로 sunDir/moonDir 중 적절한 것을 선택

this.sunColor[0] = 0.35;
this.sunColor[1] = 0.45;
this.sunColor[2] = 0.70;
this.sunIntensity = 0.03 + 0.12 * this.moonBrightness; // 0.03~0.15
```

핵심: CPU에서 `lightDir` getter가 `sunHeight > -0.1`이면 `sunDir`, 아니면 `moonDir`을 반환한다. 셰이더의 `scene.lightDir`은 낮에는 태양 방향, 밤에는 달 방향을 자동으로 가리킨다. `trueSunHeight`는 `skyNightParams.w`로 별도 전달되어 shader가 진짜 태양 위치를 항상 알 수 있다. intensity는 달 위상에 따라 0.03(신월) ~ 0.15(보름달)까지 변한다.

### 1.4 달 위상 (8일 주기)

```typescript
private updateMoonPhase(): void {
  this.moonPhase = (this.dayCount % 8) / 8.0;  // [0, 1)
  // cosine ramp: 신월(0)=0, 보름달(0.5)=1
  this.moonBrightness = 0.5 * (1.0 - Math.cos(this.moonPhase * Math.PI * 2.0));
}
```

```
달 위상 다이어그램:

moonPhase:   0    0.125  0.25  0.375  0.5   0.625  0.75  0.875  1.0
brightness:  0     0.15  0.5   0.85   1.0   0.85   0.5   0.15   0
             신월  초승   상현   철현   보름   철현   하현   그믐   신월
                         ↑ cosine curve ↑
```

`dayCount`는 자정(midnight) 통과를 감지하여 증가한다:

```typescript
// 자정 통과 감지: 이전 값이 0.9 이상이고 현재 값이 0.1 미만
if (prev > 0.9 && this.timeOfDay < 0.1) {
  this.dayCount++;
}
```

시작값 `dayCount = 4`이므로 `moonPhase = 4 % 8 / 8 = 0.5` (보름달)로 시작한다.

### 1.5 직접 제어

```typescript
// 특정 시간으로 즉시 이동 (pause 상태로 전환)
setTime(t: number): void {
  this.dayCount = Math.floor(t);
  this.timeOfDay = t - this.dayCount;
  this.paused = true;
  // 즉시 모든 조명 재계산
  this.updateMoonPhase();
  this.updateSunPosition();
  this.updateLighting();
}

// HUD 표시용 시간 문자열
getTimeString(): string {
  const totalMinutes = Math.floor(this.timeOfDay * 24 * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
```

`setTime()`은 Inspector 패널의 시간 슬라이더에서 호출되며, 호출 시 자동으로 `paused = true`가 된다. 더블클릭으로 재개(resume)한다.

---

## 2. 날씨 시스템

> 파일: `src/world/WeatherSystem.ts`

날씨 시스템은 안개 밀도와 ambient 감쇠를 통해 시각적 분위기를 제어한다.

### 2.1 WeatherType enum

```typescript
export const enum WeatherType {
  CLEAR = 0,
  RAIN  = 1,
  SNOW  = 2
}
```

`const enum`이므로 컴파일 시 숫자 리터럴로 인라인된다.

### 2.2 자동 날씨 전환

`autoWeather = true`일 때, 타이머 기반으로 날씨가 랜덤 전환된다:

```typescript
update(dt: number): void {
  if (this.autoWeather) {
    this.weatherTimer += dt;
    if (this.weatherTimer >= this.weatherDuration) {
      this.weatherTimer = 0;
      const r = Math.random();
      if (r < 0.6) {          // 60% 확률: 맑음
        this.currentWeather = WeatherType.CLEAR;
        this.targetIntensity = 0;
      } else if (r < 0.85) {  // 25% 확률: 비
        this.currentWeather = WeatherType.RAIN;
        this.targetIntensity = 0.5 + Math.random() * 0.5; // 0.5~1.0
      } else {                 // 15% 확률: 눈
        this.currentWeather = WeatherType.SNOW;
        this.targetIntensity = 0.3 + Math.random() * 0.4; // 0.3~0.7
      }
      this.weatherDuration = 30 + Math.random() * 90; // 30~120초
    }
  }
  // 지수 감쇠를 통한 부드러운 전환
  this.intensity += (this.targetIntensity - this.intensity)
                    * Math.min(1, dt * this.transitionSpeed);
}
```

```
날씨 확률 분포:

|===================|  60%  맑음 (Clear)
|========|             25%  비 (Rain)
|====|                 15%  눈 (Snow)
```

### 2.3 Intensity 전환

`intensity`는 `targetIntensity`로 지수 감쇠(exponential decay) 보간된다:

```
intensity += (target - intensity) * min(1, dt * transitionSpeed)
```

`transitionSpeed = 0.3`이므로 약 3초(1/0.3)에 걸쳐 목표값에 수렴한다. Inspector에서 조절 가능하다.

### 2.4 렌더링 영향

```typescript
getFogDensityMultiplier(): number {
  return 1.0 + this.intensity * 1.5;  // 1.0(맑음) ~ 2.5(폭풍)
}

getAmbientDarkening(): number {
  return 1.0 - this.intensity * 0.3;  // 1.0(맑음) ~ 0.7(폭풍)
}
```

`main.ts`에서 이 값들을 fog 거리 계산에 적용한다:

```typescript
const fogMul = weatherSystem.getFogDensityMultiplier();
pipeline.updateCamera(
  viewProj, projection, view, cameraPos,
  fogDist * fog.startRatio / fogMul,  // 안개 시작 거리 축소
  fogDist * fog.endRatio / fogMul,    // 안개 종료 거리 축소
  dt,
);
```

### 2.5 수동 제어

Inspector의 Weather 섹션에서 `autoWeather`를 끄고 타입/intensity를 직접 설정할 수 있다. 날씨 파티클 렌더링은 `DeferredPipeline`의 weather pass에서 `intensity > 0.001`일 때만 활성화된다.

---

## 3. 텍스처 아틀라스

> 파일: `src/renderer/TextureAtlas.ts`

TextureAtlas는 모든 블록 텍스처를 **코드로 프로시저럴 생성**한다. 외부 이미지 파일 없이, 해시 함수 기반 패턴으로 각 블록의 시각적 디테일을 만든다.

### 3.1 아틀라스 구조

```
상수 (src/constants.ts):
  TILE_SIZE      = 16      // 한 타일의 가로/세로 픽셀 수
  ATLAS_TILES    = 16      // 가로/세로 타일 수
  ATLAS_PIXEL_SIZE = 256   // 전체 아틀라스 크기 (16 * 16)
```

```
아틀라스 레이아웃 (16x16 그리드):

     0   1   2   3   4   5   6   7   ...  15
  +---+---+---+---+---+---+---+---+ ... +---+
0 |AIR|STN|DRT|GRS|SND|SST|LOG|LEA|     |   |  <- 행 0
  +---+---+---+---+---+---+---+---+ ... +---+
1 |WAT|FLW|BDR|GRV|CLY|SNW|ICE|LAV|     |   |  <- 행 1
  +---+---+---+---+---+---+---+---+ ... +---+
  ...
  +---+---+---+---+---+---+---+---+ ... +---+
5 |TGR|PPY|DND|   |   |   |   |   |     |   |  <- 행 5 (식물)
  +---+---+---+---+---+---+---+---+ ... +---+

각 타일 = 16x16 픽셀, BlockType 값이 인덱스
타일 좌표: tileX = blockType % 16, tileY = blockType / 16
```

### 3.2 3개 텍스처 맵

TextureAtlas는 생성자에서 3개의 GPU 텍스처를 만든다:

```typescript
constructor(ctx: WebGPUContext) {
  const pixels = this.generateAtlasPixels();        // Albedo (색상)
  this.gpuTexture = this.uploadTexture(ctx, pixels);

  const materialPixels = this.generateMaterialPixels(); // Material (PBR)
  this.gpuMaterialTexture = this.uploadTexture(ctx, materialPixels);

  const normalPixels = this.generateNormalPixels();     // Normal Map
  this.gpuNormalTexture = this.uploadTexture(ctx, normalPixels);
}
```

| 텍스처 | 채널 | 용도 |
|--------|------|------|
| **Albedo** | RGBA | R=빨강, G=초록, B=파랑, A=알파 (cutout용) |
| **Material** | RGBA | R=roughness, G=metallic, B=emissive, A=255 |
| **Normal** | RGBA | R=nx, G=ny, B=nz (탄젠트 공간), A=255 |

### 3.3 해시 함수 기반 색상 변화

모든 패턴 생성의 핵심은 결정론적 정수 해시 함수이다:

```typescript
function hash(x: number, y: number, seed: number): number {
  let h = (seed + x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296; // [0, 1]
}
```

- 입력: 픽셀 좌표 `(x, y)` + seed (블록 타입별 다른 값)
- 출력: `[0, 1]` 범위의 결정론적 난수
- 같은 입력에 대해 항상 같은 출력 -> **프레임 간 안정적**

각 블록 타입별 패턴 함수가 이 해시를 활용한다:

```typescript
// 돌(Stone) 패턴 예시
function patternStone(px, py, br, bg, bb) {
  const h1 = hash(px, py, 1);   // 밝기 변화
  const h2 = hash(px, py, 2);   // 특수 효과
  let f = (h1 - 0.5) * 0.25;    // 미묘한 밝기 변화 (-0.125 ~ +0.125)
  if (h2 < 0.08) f = -0.15;     // 어두운 균열 점 (8% 확률)
  if (h2 > 0.92) f = 0.10;      // 밝은 반점 (8% 확률)
  return mixColor(br, bg, bb, f); // 기본색에 변화 적용
}
```

`mixColor(r, g, b, factor)`는 factor가 양수면 밝게, 음수면 어둡게 조절한다.

### 3.4 높이맵 -> 노멀맵 변환

노멀맵은 2단계로 생성된다:

**1단계: 블록별 높이맵 생성** (`generateHeightMap`)

```typescript
// 돌 표면: 거친 기복 + 균열 자국
case BlockType.STONE: {
  for (let y = 0; y < TILE_SIZE; y++)
    for (let x = 0; x < TILE_SIZE; x++) {
      const h1 = hash(x, y, 301);
      const h2 = hash(x, y, 302);
      h[y][x] = h1 * 0.6 + (h2 > 0.92 ? -0.3 : h2 < 0.08 ? 0.3 : 0);
    }
  break;
}
```

**2단계: Finite Differences로 노멀 계산** (`heightToNormal`)

```typescript
function heightToNormal(heightMap, x, y, strength) {
  // 이웃 픽셀의 높이차로 기울기 계산
  const left  = heightMap[y][(x - 1 + TILE_SIZE) % TILE_SIZE];
  const right = heightMap[y][(x + 1) % TILE_SIZE];
  const up    = heightMap[(y - 1 + TILE_SIZE) % TILE_SIZE][x];
  const down  = heightMap[(y + 1) % TILE_SIZE][x];

  const dx = (left - right) * strength;
  const dy = (up - down) * strength;
  const dz = 1.0;
  const len = Math.sqrt(dx*dx + dy*dy + dz*dz);
  return [dx/len, dy/len, dz/len]; // 정규화된 탄젠트 공간 노멀
}
```

```
노멀 계산 다이어그램:

         up
          |
  left ---+--- right    dx = (left - right) * strength
          |              dy = (up - down) * strength
         down            dz = 1.0 (기본 위 방향)

노멀 강도(strength) 예시:
  Bedrock: 2.5 (매우 거친)
  Cobblestone: 2.0
  Stone: 1.5
  Sand: 0.4 (매우 매끈)
  Snow: 0.2 (거의 평탄)
```

노멀 벡터는 `[-1,1]` -> `[0,255]`로 인코딩된다: `pixel = (normal * 0.5 + 0.5) * 255`

### 3.5 Material 맵 패킹

Material 텍스처의 각 채널에 PBR 파라미터가 패킹된다:

```typescript
// 기본 패턴: 해시 기반 미세 변화
const h1 = hash(px, py, 200 + blockType);
const variation = (h1 - 0.5) * 20; // +-10 (0-255 범위)

// 특수 블록 예시: 용암(Lava)
case BlockType.LAVA: {
  const crackVal = Math.min(crack1, crack2);
  const emissive = crackVal < 0.3 ? 255 : baseE * 0.4; // 균열=발광, 표면=어두움
  return [baseR + variation, baseM, emissive];
}

// 다이아몬드 광석: 광석 부분은 매끄럽고 약간 발광
if (isOrePart) {
  return [50 + variation,  // roughness ↓ (반짝임)
          30 + variation,  // metallic 약간
          40 + variation]; // emissive 약간 발광
}
```

### 3.6 Alpha Cutout 베이킹

**프로젝트 핵심 정책**: 셰이더에서 procedural hash로 discard 판정하면 보간값 위에서 불안정하다. 따라서 **아틀라스 텍스처의 alpha 채널에 미리 베이킹**한다.

```typescript
// 나뭇잎: ~20% 투명 구멍
if (blockType === BlockType.LEAVES) {
  const h2 = hash(x, y, 61);
  pixels[pixelIndex + 3] = h2 < 0.20 ? 0 : 255; // alpha = 0 또는 255
}

// 식물 (TALL_GRASS, POPPY, DANDELION): 패턴 함수가 RGBA 반환
if (isBlockCrossMesh(blockType)) {
  let rgba = patternTallGrass(x, y); // 배경은 [0,0,0,0]
  pixels[pixelIndex + 3] = rgba[3];  // alpha = 0 (투명) 또는 255 (불투명)
}
```

셰이더에서는 단 한 줄로 cutout을 처리한다:

```wgsl
if (textureSampleLevel(atlas, samp, uv, 0.0).a < 0.5) { discard; }
```

### 3.7 GPU 업로드

```typescript
private uploadTexture(ctx: WebGPUContext, pixels: Uint8Array): GPUTexture {
  const texture = ctx.device.createTexture({
    size: [ATLAS_PIXEL_SIZE, ATLAS_PIXEL_SIZE], // 256x256
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
  });
  ctx.device.queue.writeTexture(
    { texture },
    pixels.buffer,
    { bytesPerRow: ATLAS_PIXEL_SIZE * 4, rowsPerImage: ATLAS_PIXEL_SIZE },
    [ATLAS_PIXEL_SIZE, ATLAS_PIXEL_SIZE],
  );
  return texture;
}
```

nearest 샘플러 사용: Minecraft 스타일의 픽셀 아트 미학을 유지한다.

```typescript
// DeferredPipeline에서 설정
this.atlasSampler = ctx.device.createSampler({
  magFilter: 'nearest',
  minFilter: 'nearest',
  mipmapFilter: 'nearest',
  addressModeU: 'clamp-to-edge',
  addressModeV: 'clamp-to-edge',
});
```

---

## 4. 카메라 시스템

> 파일: `src/camera/FlyCamera.ts`

FlyCamera는 Euler 각도(yaw/pitch) 기반의 1인칭 자유 비행 카메라이다. 물리 충돌 없이 월드를 자유롭게 탐색한다.

### 4.1 Euler 각도와 방향 벡터

```typescript
yaw = -Math.PI / 2;  // 초기 방향: -Z (forward)
pitch = -0.3;         // 약간 아래를 바라봄
```

매 프레임 `update(dt)`에서 forward/right 벡터를 계산한다:

```typescript
update(dt: number): void {
  const forward = vec3.fromValues(
    Math.cos(this.pitch) * Math.cos(this.yaw),  // X
    Math.sin(this.pitch),                         // Y
    Math.cos(this.pitch) * Math.sin(this.yaw),   // Z
  );
  vec3.normalize(forward, forward);

  const right = vec3.create();
  vec3.cross(right, forward, [0, 1, 0]);
  vec3.normalize(right, right);
  // ...
}
```

```
카메라 좌표계:

     Y (up)
     |
     |  / forward (yaw, pitch로 결정)
     | /
     +-------> X (east)
    /
   Z (south)

forward = (cos(pitch)*cos(yaw), sin(pitch), cos(pitch)*sin(yaw))
right   = normalize(forward x [0,1,0])
```

### 4.2 조작 체계

| 입력 | 동작 | 구현 |
|------|------|------|
| **W/A/S/D** | 전진/좌/후진/우 이동 | `forward`, `right` 벡터 기반 |
| **E/Space** | 상승 | `move[1] += spd` |
| **Q/C** | 하강 | `move[1] -= spd` |
| **우클릭 + 마우스** | 시점 회전 | pointerLock 모드, `movementX/Y` |
| **마우스 휠** | 속도 조절 | x1.2 / /1.2 스케일, 범위 [1, 200] |
| **Shift** | 빠른 이동 | `Config.data.camera.fastSpeed` 사용 |

```typescript
// 마우스 시점 회전
this.onMouseMove = (e: MouseEvent) => {
  if (!this.rightMouseDown) return;
  this.yaw += e.movementX * Config.data.camera.mouseSensitivity;
  this.pitch -= e.movementY * Config.data.camera.mouseSensitivity;
  // 짐벌 록 방지: ±(PI/2 - 0.01)로 클램프
  this.pitch = Math.max(-Math.PI/2 + 0.01, Math.min(Math.PI/2 - 0.01, this.pitch));
};

// 마우스 휠 속도 조절
this.onWheel = (e: WheelEvent) => {
  e.preventDefault();
  this.speed *= e.deltaY < 0 ? 1.2 : 1 / 1.2;
  this.speed = Math.max(1, Math.min(200, this.speed));
};
```

**pitch 클램프**는 `±(PI/2 - 0.01)` 범위로, 정확히 수직을 바라볼 때 발생하는 짐벌 록(gimbal lock)을 방지한다.

### 4.3 perspectiveZO: WebGPU 깊이 [0,1] 투영

WebGPU는 OpenGL(-1~1)과 달리 **깊이 범위 [0,1]** (Zero-to-One)을 사용한다. gl-matrix의 기본 `perspective()`는 OpenGL 규격이므로, 커스텀 `perspectiveZO()`를 사용한다:

```typescript
function perspectiveZO(out: mat4, fovy, aspect, near, far): mat4 {
  const f = 1.0 / Math.tan(fovy / 2);
  out[0]  = f / aspect;  // X 스케일
  out[5]  = f;            // Y 스케일
  out[10] = far / (near - far);           // Z 매핑: [near,far] → [0,1]
  out[11] = -1;                           // W = -Z (perspective divide)
  out[14] = (near * far) / (near - far);  // Z 오프셋
  // 나머지 = 0
  return out;
}
```

```
깊이 매핑 비교:

OpenGL:    near → -1,  far → +1  (NDC Z = [-1, 1])
WebGPU:    near →  0,  far → +1  (NDC Z = [0, 1])

perspectiveZO는 out[10], out[14] 계산이 다르다.
```

### 4.4 Config 연동

카메라는 Config에서 파라미터를 **프레임마다 실시간으로** 읽는다:

```typescript
// 이동 속도: Shift면 Config.fastSpeed, 아니면 로컬 this.speed (휠로 조절)
const spd = (isShift ? Config.data.camera.fastSpeed : this.speed) * dt;

// 시점 감도
this.yaw += e.movementX * Config.data.camera.mouseSensitivity;

// 투영 행렬: FOV, near, far
perspectiveZO(this.projection, Config.data.camera.fov, aspect,
              Config.data.camera.near, Config.data.camera.far);
```

Inspector에서 슬라이더를 움직이면 즉시 반영된다.

### 4.5 리소스 정리

```typescript
destroy(): void {
  document.removeEventListener('keydown', this.onKeyDown);
  document.removeEventListener('keyup', this.onKeyUp);
  this.canvas.removeEventListener('mousedown', this.onMouseDown);
  document.removeEventListener('mouseup', this.onMouseUp);
  this.canvas.removeEventListener('contextmenu', this.onContextMenu);
  document.removeEventListener('mousemove', this.onMouseMove);
  this.canvas.removeEventListener('wheel', this.onWheel);
  this.keys.clear();
}
```

모든 이벤트 리스너 참조를 멤버 변수로 저장하여, `destroy()` 시 정확히 제거할 수 있다.

---

## 5. WebGPU 컨텍스트

> 파일: `src/renderer/WebGPUContext.ts`

WebGPUContext는 GPU 초기화와 캔버스 관리를 캡슐화하는 싱글 인스턴스 클래스이다.

### 5.1 GPU 초기화 (팩토리 패턴)

```typescript
static async create(canvas: HTMLCanvasElement): Promise<WebGPUContext> {
  const ctx = new WebGPUContext(); // private constructor
  ctx.canvas = canvas;

  // 1. WebGPU 지원 확인
  if (!navigator.gpu) throw new Error('WebGPU not supported');

  // 2. 어댑터 요청 (고성능 선호)
  const adapter = await navigator.gpu.requestAdapter({
    powerPreference: 'high-performance'
  });
  if (!adapter) throw new Error('No GPUAdapter found');

  // 3. 디바이스 요청 (확장 버퍼 제한)
  ctx.device = await adapter.requestDevice({
    requiredLimits: {
      maxBufferSize: 256 * 1024 * 1024,          // 256MB
      maxStorageBufferBindingSize: 128 * 1024 * 1024, // 128MB
    },
  });

  // 4. 캔버스 surface 설정
  ctx.context = canvas.getContext('webgpu')!;
  ctx.format = navigator.gpu.getPreferredCanvasFormat();
  ctx.context.configure({
    device: ctx.device,
    format: ctx.format,
    alphaMode: 'premultiplied',
  });

  // 5. 깊이 텍스처 생성
  ctx.createDepthTexture();
  return ctx;
}
```

```
WebGPU 초기화 파이프라인:

  navigator.gpu  ─→  requestAdapter()  ─→  requestDevice()
                      (GPU 선택)            (논리 디바이스)
                                                │
  canvas.getContext('webgpu')  ──────────────→  configure()
                                                │
  createDepthTexture()  ←───────────────────────┘
```

### 5.2 에러 핸들링

```typescript
// 디바이스 분실 감지 (드라이버 크래시, GPU 리셋 등)
ctx.device.lost.then((info) => {
  console.error('WebGPU device lost:', info.message);
});

// GPU 유효성 검사 오류 캡처 (셰이더 오류, 버퍼 범위 초과 등)
ctx.device.addEventListener('uncapturederror', (event: Event) => {
  console.error('[WebGPU Error]',
    (event as GPUUncapturedErrorEvent).error.message);
});
```

### 5.3 리사이즈 관리

```typescript
resize(): boolean {
  const dpr = window.devicePixelRatio || 1;
  const w = Math.floor(this.canvas.clientWidth * dpr);
  const h = Math.floor(this.canvas.clientHeight * dpr);
  if (this.canvas.width !== w || this.canvas.height !== h) {
    this.canvas.width = w;
    this.canvas.height = h;
    this.createDepthTexture();  // 깊이 텍스처 재생성
    if (this.onResize) this.onResize(); // 콜백 (G-Buffer 재생성 등)
    return true;
  }
  return false;
}

get aspectRatio(): number {
  return this.canvas.width / this.canvas.height;
}
```

`resize()`는 매 프레임 `frame()` 시작에서 호출된다. DPR(Device Pixel Ratio)을 고려하여 Retina/HiDPI 디스플레이에서도 선명한 렌더링을 보장한다. 크기가 변경될 때만 깊이 텍스처와 G-Buffer를 재생성하여 불필요한 GPU 자원 할당을 피한다.

---

## 6. HUD

> 파일: `src/ui/HUD.ts`

HUD는 화면 좌상단에 표시되는 디버그 정보 오버레이이다.

### 6.1 FPS 카운터

```typescript
update(cameraPos, chunkCount, seed, speed, timeStr?): void {
  this.frames++;
  const now = performance.now();
  if (now - this.lastFpsTime >= 1000) {  // 1초 윈도우
    this.fps = this.frames;
    this.frames = 0;
    this.lastFpsTime = now;
  }
  // ...
}
```

1초마다 누적 프레임 수를 FPS로 갱신한다. 평균 FPS가 아닌 **순간(last-second) FPS**를 보여준다.

### 6.2 표시 정보

```typescript
this.el.innerHTML =
  `FPS: ${this.fps}<br>` +
  `Pos: ${cameraPos[0].toFixed(1)}, ${cameraPos[1].toFixed(1)}, ${cameraPos[2].toFixed(1)}<br>` +
  `Chunks: ${chunkCount}<br>` +
  `${this.drawInfo}<br>` +          // "Draws: N Water: M"
  `Seed: ${seed}<br>` +
  `Speed: ${speed.toFixed(1)}` +
  (timeStr ? `<br>Time: ${timeStr}` : '') +
  (this.lastError ? `<br><span style="color:red">${this.lastError}</span>` : '');
```

| 항목 | 소스 | 예시 |
|------|------|------|
| FPS | 내부 카운터 | `FPS: 60` |
| Pos | `camera.position` | `Pos: 128.0, 90.0, 128.0` |
| Chunks | `chunkManager.totalChunks` | `Chunks: 441` |
| Draws | `setDrawInfo()` | `Draws: 156 Water: 23` |
| Seed | `main.ts` 로컬 변수 | `Seed: 42` |
| Speed | `camera.getSpeed()` | `Speed: 20.0` |
| Time | `dayNightCycle.getTimeString()` | `Time: 08:24` |
| Error | `setError()` | 빨간색 텍스트 |

### 6.3 토글

```typescript
// H키로 HUD 표시/숨김 (Inspector 입력 중에는 무시)
const onHudToggle = (e: KeyboardEvent) => {
  if (e.code === 'KeyH' &&
      !(e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement ||
        e.target instanceof HTMLTextAreaElement)) {
    hud.toggle();
  }
};
```

`visible` 프로퍼티로 상태를 추적하며, `display: none`으로 DOM 요소를 숨긴다.

---

## 7. Inspector 패널 시스템

Inspector는 Unity 에디터 스타일의 설정 패널로, 4개의 탭을 통해 엔진의 모든 파라미터를 실시간으로 조절할 수 있다.

### 7.1 InspectorPanel

> 파일: `src/ui/inspector/InspectorPanel.ts`

```
화면 레이아웃:

+-------------------------------------+--------+
|                                     | [Gear] |  <- 토글 버튼 (32x32px)
|          Canvas (WebGPU)            +--------+
|                                     |Inspector|
|                                     | Panel   |
|                                     | (320px) |
|                                     |         |
|                                     | [Tabs]  |
|                                     | [Content]
+-------------------------------------+---------+
```

```typescript
export class InspectorPanel {
  private panel: HTMLElement;       // 320px 고정 너비 패널
  private toggleBtn: HTMLElement;   // 기어 아이콘 버튼 (우상단)
  private tabBar: HTMLElement;      // 탭 버튼 바
  private tabs = new Map<string, { btn: HTMLElement; tab: InspectorTab }>();
  private activeTab: string | null = null;
  private isOpen = false;
}
```

**토글 동작:**

```typescript
toggle(): void {
  this.isOpen = !this.isOpen;
  this.panel.classList.toggle('hidden', !this.isOpen);
  this.toggleBtn.classList.toggle('open', this.isOpen);
}
```

- **F1 키**: 전역 단축키로 패널 토글
- **기어 아이콘**: 클릭으로 패널 토글
- 열릴 때 `transform: translateX(0)`, 닫힐 때 `transform: translateX(100%)` (CSS transition 0.2s)
- 기어 버튼은 열릴 때 `right: 328px`으로 이동하여 패널 왼쪽에 위치

**탭 전환:**

```typescript
selectTab(name: string): void {
  for (const [n, entry] of this.tabs) {
    if (n === name) {
      entry.btn.classList.add('active');
      entry.tab.show();  // display: ''
    } else {
      entry.btn.classList.remove('active');
      entry.tab.hide();  // display: 'none'
    }
  }
  this.activeTab = name;
}
```

### 7.2 InspectorTab / InspectorSection

> 파일: `src/ui/inspector/InspectorTab.ts`, `src/ui/inspector/InspectorSection.ts`

**InspectorTab**: 섹션과 버튼을 담는 컨테이너

```typescript
class InspectorTab {
  el: HTMLElement;  // display: flex + overflow-y: auto (스크롤)

  addSection(title: string, collapsed = false): InspectorSection { ... }
  addButton(text: string, onClick: () => void): HTMLButtonElement { ... }
  show(): void { this.el.style.display = ''; }
  hide(): void { this.el.style.display = 'none'; }
}
```

**InspectorSection**: 접이식 헤더 + 필드 본문

```typescript
class InspectorSection {
  constructor(title: string, collapsed = false, isSubSection = false) {
    this.header = document.createElement('div');
    this.header.innerHTML = `<span class="inspector-section-arrow">▼</span>${title}`;

    // 클릭 시 접기/펼치기
    this.header.addEventListener('click', () => {
      const isCollapsed = this.header.classList.toggle('collapsed');
      this.body.classList.toggle('collapsed', isCollapsed);
    });
  }

  addField(opts: FieldOptions): HTMLElement { ... }
  addSubSection(title: string, collapsed = true): InspectorSection { ... }
}
```

```
섹션 구조:

▼ Noise                  <- 헤더 (클릭으로 접기)
  Octaves     [====o====] 4    <- 필드 (슬라이더)
  Persistence [==o======] 0.50
  Lacunarity  [====o====] 2.0
  Scale       [=====o===] 50

▶ Caves (접힌 상태)       <- 접힌 헤더 (화살표 -90도 회전)

▼ Ores
  ▶ Coal                  <- 서브섹션 (들여쓰기 + 더 작은 폰트)
  ▶ Iron
  ▶ Gold
  ▶ Diamond
```

서브섹션은 `isSubSection = true`로 생성되며, `margin-left: 8px` 들여쓰기와 작은 헤더 스타일이 적용된다.

### 7.3 InspectorField

> 파일: `src/ui/inspector/InspectorField.ts`

`createField()` 팩토리 함수는 4가지 필드 타입을 생성한다:

```typescript
export interface FieldOptions {
  type: 'slider' | 'number' | 'toggle' | 'dropdown';
  label: string;
  configPath: string;         // 예: 'terrain.noise.octaves'
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string | number }[];
  toDisplay?: (v: number) => number;   // 내부값 → 표시값 변환
  fromDisplay?: (v: number) => number; // 표시값 → 내부값 변환
}
```

**Config 자동 바인딩 패턴:**

```typescript
export function createField(opts: FieldOptions): HTMLElement {
  // 1. Config에서 현재값 읽기
  const rawValue = Config.get(opts.configPath);
  const currentValue = toDisplay(rawValue as number);

  // 2. 슬라이더 예시
  case 'slider': {
    const input = document.createElement('input');
    input.type = 'range';
    input.value = String(currentValue);

    // 3. 변경 시 Config에 쓰기
    input.addEventListener('input', () => {
      const v = parseFloat(input.value);
      const result = Config.set(opts.configPath, fromDisplay(v));
      if (result.success) {
        valSpan.textContent = formatVal(v, opts.step);
      } else {
        showFieldError(row, result); // 빨간 플래시 애니메이션
      }
    });
  }
}
```

**값 포맷팅:**

```typescript
function formatVal(v: number, step?: number): string {
  if (step != null && step < 1) {
    const decimals = Math.max(1, Math.ceil(-Math.log10(step)));
    return v.toFixed(decimals);
  }
  if (v === Math.floor(v)) return String(v);
  return v.toFixed(2);
}
```

step=0.05 -> 소수점 2자리, step=0.001 -> 소수점 3자리.

**에러 처리**: Config.set()이 실패하면 (범위 초과 등) 필드에 0.8초간 빨간색 플래시 애니메이션이 표시된다.

**toDisplay/fromDisplay 변환 예시 (FOV):**

```typescript
// CameraTab.ts
section.addField({
  type: 'slider', label: 'FOV (deg)', configPath: 'camera.fov',
  min: 30, max: 120, step: 1,
  toDisplay: (rad) => Math.round(rad * 180 / Math.PI),  // 라디안 → 도
  fromDisplay: (deg) => deg * Math.PI / 180,             // 도 → 라디안
});
```

Config 내부적으로는 라디안을 저장하지만, 사용자에게는 도(degree) 단위로 보여준다.

### 7.4 TerrainTab

> 파일: `src/ui/inspector/TerrainTab.ts`

```typescript
export class TerrainTab extends InspectorTab {
  seedInput: HTMLInputElement | null = null; // 외부 접근용 public 프로퍼티
}
```

**섹션 구성:**

| 섹션 | 초기 상태 | 주요 필드 |
|------|-----------|-----------|
| Noise | 열림 | Octaves, Persistence, Lacunarity, Scale |
| Height | 열림 | Sea Level, Min/Max Height, Dirt Depth |
| Biomes | 접힘 | Temp Scale, Humid Scale, Continentalness, Ocean Threshold |
| Caves | 접힘 | Count, Length, Radius, Y Range |
| Ores | 접힘 | Coal/Iron/Gold/Diamond (서브섹션별 Min/Max Y, Attempts, Vein Size) |
| Trees | 접힘 | Per Chunk, Trunk Height, Leaf Decay |

**Seed 입력 + Regenerate 버튼:**

```typescript
const regenBtn = tab.addButton('Regenerate Terrain', () => {
  const seed = parseInt(seedInput.value) || 0;
  onRegenerate(seed);           // chunkManager.regenerate(seed) 호출
  Config.clearDirty('terrain'); // dirty 플래그 해제
  regenBtn.classList.remove('dirty'); // 오렌지 하이라이트 제거
});

// terrain.* 경로 변경 감지 → 버튼 dirty 상태로 전환
Config.onChange((path) => {
  if (path.startsWith('terrain.')) {
    regenBtn.classList.add('dirty'); // CSS: background: #a65d00
  }
});
```

```
Regenerate 버튼 상태:

  [Regenerate Terrain]     <- 기본 (어두운 파란)
  값 변경 후:
  [Regenerate Terrain]     <- dirty (오렌지: #a65d00)
  클릭 후:
  [Regenerate Terrain]     <- 원래대로 복귀
```

**핵심 설계**: 지형 파라미터는 변경 즉시 적용되지 않는다. 사용자가 여러 값을 조정한 후 Regenerate를 눌러야만 실제 지형이 재생성된다.

### 7.5 RenderingTab

> 파일: `src/ui/inspector/RenderingTab.ts`

렌더링 파라미터는 Config를 통해 **즉시 반영**된다 (지형과 달리 Regenerate 불필요).

```typescript
export function buildRenderingTab(): InspectorTab {
  const tab = new InspectorTab();

  // General
  const general = tab.addSection('General');
  general.addField({ type: 'slider', label: 'Render Dist',
    configPath: 'rendering.general.renderDistance', min: 2, max: 24, step: 1 });
  general.addField({ type: 'slider', label: 'Chunks/Frame',
    configPath: 'rendering.general.chunksPerFrame', min: 1, max: 8, step: 1 });

  // Shadows, SSAO, Bloom, Fog, Contact Shadows, TAA,
  // Auto Exposure, PCSS, Post Process, Motion Blur, DoF
  // ... (각 섹션별 필드들)
}
```

**전체 섹션 목록:**

| 섹션 | 필드 수 | 주요 파라미터 |
|------|---------|--------------|
| General | 2 | renderDistance, chunksPerFrame |
| Shadows | 2 | cascadeCount, mapSize |
| SSAO | 3 | radius, bias, kernelSize |
| Bloom | 3 | threshold, intensity, mipLevels |
| Fog | 2 | startRatio, endRatio |
| Contact Shadows | 4 | enabled, maxSteps, rayLength, thickness |
| TAA | 2 | enabled, blendFactor |
| Auto Exposure | 5 | enabled, adaptSpeed, keyValue, minExposure, maxExposure |
| PCSS Shadows | 2 | enabled, lightSize |
| Post Process | 4 | vignette enabled/intensity, CA enabled/intensity |
| Motion Blur | 2 | enabled, strength |
| Depth of Field | 4 | enabled, focusDistance, aperture, maxBlur |

### 7.6 CameraTab

> 파일: `src/ui/inspector/CameraTab.ts`

```typescript
export function buildCameraTab(): InspectorTab {
  const tab = new InspectorTab();
  const section = tab.addSection('Camera');

  section.addField({ type: 'slider', label: 'Speed',
    configPath: 'camera.speed', min: 1, max: 200, step: 1 });
  section.addField({ type: 'slider', label: 'Fast Speed',
    configPath: 'camera.fastSpeed', min: 10, max: 300, step: 5 });
  section.addField({ type: 'slider', label: 'Sensitivity',
    configPath: 'camera.mouseSensitivity', min: 0.0005, max: 0.01, step: 0.0005 });
  section.addField({
    type: 'slider', label: 'FOV (deg)', configPath: 'camera.fov',
    min: 30, max: 120, step: 1,
    toDisplay: (rad) => Math.round(rad * 180 / Math.PI),
    fromDisplay: (deg) => deg * Math.PI / 180,
  });
  section.addField({ type: 'number', label: 'Near',
    configPath: 'camera.near', min: 0.01, max: 10, step: 0.01 });
  section.addField({ type: 'number', label: 'Far',
    configPath: 'camera.far', min: 100, max: 5000, step: 100 });

  return tab;
}
```

카메라 탭은 단일 섹션에 6개 필드로 구성된다. FOV 필드는 `toDisplay`/`fromDisplay` 변환을 사용하여 내부 라디안 값을 도(degree) 단위로 표시한다.

### 7.7 EnvironmentTab

> 파일: `src/ui/inspector/EnvironmentTab.ts`

EnvironmentTab은 DayNightCycle과 WeatherSystem에 **직접 접근**하여 상태를 제어한다 (Config를 경유하지 않는 제어도 포함).

```typescript
export class EnvironmentTab extends InspectorTab {
  _updateTimeFn: (() => void) | null = null;

  updateTime(): void {
    if (this._updateTimeFn) this._updateTimeFn();
  }
}
```

**Day/Night 섹션 -- 시간 슬라이더:**

```typescript
// 슬라이더: 0~100 (= timeOfDay 0~1)
timeSlider.addEventListener('input', () => {
  const t = parseInt(timeSlider.value) / 100;
  dayNightCycle.setTime(t);            // 직접 제어 → pause됨
  timeVal.textContent = dayNightCycle.getTimeString();
});

// 더블클릭: 시간 흐름 재개
timeSlider.addEventListener('dblclick', () => {
  dayNightCycle.paused = false;
});
```

**Day Duration**: Config 경유 (`environment.dayDurationSeconds`), 60~3600초 범위.

**Cloud 섹션**: 5개 Config 필드 (coverage, baseNoiseScale, extinction, multiScatterFloor, detailStrength).

```typescript
// cloud.coverage → cloudCoverage 동기화 (legacy uniform 경로 호환)
Config.onChange((path) => {
  if (path === 'environment.cloud.coverage') {
    Config.data.environment.cloudCoverage = Config.data.environment.cloud.coverage;
  }
});
```

**Weather 섹션**: 직접 제어 (Config 경유하지 않음)

```typescript
// Auto Weather 토글
autoCheck.addEventListener('change', () => {
  weatherSystem.autoWeather = autoCheck.checked;
  if (autoCheck.checked) {
    weatherSystem.weatherTimer = 0;
    weatherSystem.weatherDuration = 10 + Math.random() * 30; // 빠른 첫 전환
  }
});

// 날씨 타입 드롭다운 (수동 선택 시 auto 해제)
weatherSelect.addEventListener('change', () => {
  weatherSystem.autoWeather = false;
  autoCheck.checked = false;
  const type = parseInt(weatherSelect.value) as WeatherType;
  weatherSystem.currentWeather = type;
  if (type === WeatherType.CLEAR) {
    weatherSystem.targetIntensity = 0;
    weatherSystem.intensity = 0;
  } else {
    weatherSystem.targetIntensity = 0.7;
    weatherSystem.intensity = 0.7;
  }
});

// Intensity 슬라이더 (수동 조절 시 auto 해제)
intSlider.addEventListener('input', () => {
  weatherSystem.autoWeather = false;
  autoCheck.checked = false;
  const v = parseFloat(intSlider.value);
  weatherSystem.targetIntensity = v;
  weatherSystem.intensity = v;   // 즉시 적용 (전환 없이)
  intVal.textContent = v.toFixed(2);
});
```

**실시간 동기화 (`_updateTimeFn`):**

```typescript
tab._updateTimeFn = () => {
  // 1. 시간 슬라이더 역방향 동기화
  if (!dayNightCycle.paused) {
    timeSlider.value = String(Math.round(dayNightCycle.timeOfDay * 100));
    timeVal.textContent = dayNightCycle.getTimeString();
  }
  // 2. 날씨 UI 역방향 동기화 (auto 모드에서 시스템 값 반영)
  weatherSelect.value = String(weatherSystem.currentWeather as number);
  intSlider.value = String(weatherSystem.intensity);
  intVal.textContent = weatherSystem.intensity.toFixed(2);
};
```

이 함수는 `main.ts`의 프레임 루프에서 매 프레임 호출된다: `envTab.updateTime()`.

### 7.8 InspectorStyles

> 파일: `src/ui/inspector/InspectorStyles.ts`

CSS-in-JS 패턴으로, 전체 Inspector UI의 스타일을 하나의 `<style>` 태그로 DOM에 삽입한다.

```typescript
const CSS = `
.inspector-panel {
  position: fixed; top: 0; right: 0;
  width: 320px; height: 100vh;
  background: #383838;       /* 다크 테마 기본 배경 */
  color: #ddd;
  font-family: 'Segoe UI', system-ui, sans-serif;
  font-size: 12px;
  transition: transform 0.2s ease;  /* 슬라이드 애니메이션 */
}
.inspector-panel.hidden {
  transform: translateX(100%);       /* 화면 밖으로 밀기 */
  pointer-events: none;
}
// ... (약 120줄의 CSS)
`;

let injected = false;
export function injectStyles(): void {
  if (injected) return;       // 중복 삽입 방지
  injected = true;
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
}
```

**주요 디자인 토큰:**

| 요소 | 색상 | 용도 |
|------|------|------|
| 패널 배경 | `#383838` | 다크 그레이 기본 배경 |
| 탭 바 | `#2d2d2d` | 더 어두운 배경 |
| 활성 탭 | `#5b9bd5` (하단 보더) | 파란색 강조 |
| 슬라이더 thumb | `#8ab4f8` | 밝은 파란 |
| 값 표시 | `#8ab4f8` (Consolas) | 고정폭 폰트 |
| dirty 버튼 | `#a65d00` | 오렌지 (변경 표시) |
| 에러 플래시 | `rgba(220, 50, 50, 0.35)` | 빨간 펄스 |
| 입력 필드 | `#2d2d2d` bg + `#555` border | 어두운 입력 영역 |

---

## 8. 시스템 간 데이터 흐름

### 8.1 전체 아키텍처 다이어그램

```
+------------------------------------------------------------------+
|                          main.ts (프레임 루프)                      |
|                                                                    |
|  requestAnimationFrame(frame)                                      |
|    |                                                               |
|    |  1. ctx.resize()                                              |
|    |  2. camera.update(dt)                                         |
|    |  3. dayNightCycle.update(dt)                                  |
|    |  4. weatherSystem.update(dt)                                  |
|    |  5. envTab.updateTime()      <-- UI 역방향 동기화              |
|    |  6. pipeline.updateCamera(viewProj, ..., fogStart, fogEnd, dt)|
|    |  7. chunkManager.update(cameraPos, viewProj)                  |
|    |  8. pipeline.render(drawCalls, waterDrawCalls, vegDrawCalls)   |
|    |  9. hud.update(cameraPos, chunks, seed, speed, timeStr)       |
|    |                                                               |
+------------------------------------------------------------------+
```

### 8.2 Config 중심 데이터 흐름

```
+------------------+
|  Config (싱글턴)   |   <-- localStorage 저장/로드
|  .data: AppConfig |
|  .set(path, val)  |---→ 유효성 검증 → handlers 호출 → scheduleSave()
|  .get(path)       |
|  .onChange(fn)     |
+--------+---------+
         |
         | Config.data.* 직접 참조 (매 프레임)
         |
    +----+----+----+----+----+----+----+
    |    |    |    |    |    |    |    |
    v    v    v    v    v    v    v    v
  Camera DNC  Fog  Bloom SSAO Shad TAA  Cloud
  (fov,  (day (start (thres (rad (map (ena (cover
   spd,  Dur  End)  int)   bias) Size) bled age)
   sens)  Sec)                             blend)
```

### 8.3 Inspector UI -> Config -> System 반응형 체인

```
사용자 입력 흐름:

  Inspector 슬라이더 드래그
          |
          v
  createField() input handler
          |
          v
  Config.set('rendering.bloom.threshold', 1.5)
          |
          +--→ 유효성 검증 (VALIDATION_RULES)
          +--→ 교차 제약 조건 검사 (CROSS_CONSTRAINTS)
          |
          v (성공 시)
  setNestedValue(data, path, value)
          |
          v
  for (handler of handlers) handler(path, value)
          |
          +--→ main.ts onConfigChange: bloom 파라미터 업데이트
          +--→ TerrainTab onChange: dirty 플래그 설정
          +--→ EnvironmentTab onChange: cloudCoverage 동기화
          |
          v
  scheduleSave() → 500ms 디바운스 → localStorage 저장
```

### 8.4 즉시 반영 vs 지연 반영

```
즉시 반영 (매 프레임 Config.data 읽기):
+-------------------------------------------------------------------+
| 카메라 (fov, sensitivity, near, far)                                |
| 렌더링 전체 (fog, bloom, SSAO, shadows, TAA, contact shadows, ...) |
| 환경 (dayDurationSeconds, cloud.*)                                 |
+-------------------------------------------------------------------+

지연 반영 (Regenerate 버튼 필요):
+-------------------------------------------------------------------+
| 지형 전체 (noise, height, biomes, caves, ores, trees)               |
| → Config.set() 시 dirty 플래그만 설정                               |
| → Regenerate 클릭 시 chunkManager.regenerate(seed)                  |
| → Config.clearDirty('terrain')                                     |
+-------------------------------------------------------------------+
```

이유: 지형 재생성은 수십만 개의 블록을 다시 계산해야 하므로 비용이 높다. 반면 렌더링 파라미터는 uniform buffer에 새 값을 쓰기만 하면 되므로 즉시 반영이 가능하다.

### 8.5 DayNightCycle / WeatherSystem -> DeferredPipeline -> Shader Uniform 전달 경로

```
DayNightCycle                    DeferredPipeline.updateCamera()
  .lightDir[3]     ─────────→    sceneF32[20..22]  → lightDir (vec3)
  .sunColor[3]     ─────────→    sceneF32[24..26]  → sunColor (vec3)
  .sunIntensity    ─────────→    sceneF32[27]      → sunColor.w
  .ambientColor[3] ─────────→    sceneF32[28..30]  → ambientColor (vec3)
  .ambientGroundFactor ─────→    sceneF32[31]      → ambientColor.w
  .timeOfDay       ─────────→    sceneF32[34]      → fogParams.z
  .moonPhase       ─────────→    sceneF32[60]      → skyNightParams.x
  .moonBrightness  ─────────→    sceneF32[61]      → skyNightParams.y

WeatherSystem                    DeferredPipeline.updateCamera()
  .currentWeather  ─────────→    weatherF32[21]    → weatherType (f32)
  .intensity       ─────────→    weatherF32[22]    → intensity (f32)
  .getFogDensityMultiplier() →   main.ts에서 fogStart/fogEnd 계산에 적용

Config.data.environment.cloud
  .baseNoiseScale  ─────────→    sceneF32[36]      → cloudParams.x
  .extinction      ─────────→    sceneF32[37]      → cloudParams.y
  .multiScatterFloor ───────→    sceneF32[38]      → cloudParams.z
  .detailStrength  ─────────→    sceneF32[39]      → cloudParams.w
  .coverage (→cloudCoverage) →   sceneF32[35]      → fogParams.w
```

### 8.6 Uniform Buffer 레이아웃

DeferredPipeline의 Scene Uniform (256 bytes)은 다음과 같이 구성된다:

```
Byte    Offset   Float32Index   내용
0-63    0        [0..15]        invViewProj (mat4x4)
64-79   64       [16..19]       cameraPos (vec3) + waterLevel (f32)
80-95   80       [20..23]       lightDir (vec3) + elapsedTime (f32)
96-111  96       [24..27]       sunColor (vec3) + sunIntensity (f32)
112-127 112      [28..31]       ambientColor (vec3) + ambientGroundFactor (f32)
128-143 128      [32..35]       fogStart, fogEnd, timeOfDay, cloudCoverage
144-159 144      [36..39]       cloudParams (baseNoiseScale, extinction, msFloor, detail)
160-223 160      [40..55]       viewProj (mat4x4, unjittered)
224-239 224      [56..59]       contactShadowParams (enabled, maxSteps, rayLength, thickness)
240-255 240      [60..63]       skyNightParams (moonPhase, moonBrightness, elapsedTime, reserved)
```

### 8.7 프레임 루프 상세 업데이트 순서

```
frame() 호출 순서:

1. ctx.resize()                  // 캔버스 크기 확인/조정
   |
2. camera.update(dt)             // 입력 처리, 위치 이동
   |                             // Config.data.camera.* 읽기
   |
3. dayNightCycle.update(dt)      // timeOfDay 진행
   |                             // Config.data.environment.dayDurationSeconds 읽기
   |                             // sunDir, sunColor, sunIntensity, ambientColor 계산
   |                             // moonPhase, moonBrightness 계산
   |
4. weatherSystem.update(dt)      // 자동 날씨 전환 / intensity 감쇠
   |
5. envTab.updateTime()           // Inspector UI 역방향 동기화
   |                             // 시간 슬라이더 값 갱신
   |                             // 날씨 UI 상태 갱신
   |
6. camera.getViewProjection()    // 투영/뷰 행렬 계산
   |
7. fog 계산                       // Config.data.rendering.fog + weather 보정
   |
8. pipeline.updateCamera(...)    // 모든 uniform buffer 갱신
   |   |                         // DayNightCycle → Scene Uniform 복사
   |   |                         // Weather → Weather Uniform 복사
   |   |                         // Camera → Camera Uniform 복사
   |   |                         // Shadow 행렬 업데이트
   |   |                         // SSAO/Volumetric/SSR/TAA uniform 업데이트
   |
9. chunkManager.update(...)      // 청크 로드/언로드/메시 빌드
   |
10. pipeline.render(...)         // G-Buffer → Shadow → SSAO → Lighting
    |                            //  → Sky → Water → Weather → Post-Process
    |
11. hud.update(...)              // HUD 텍스트 갱신
    |
12. requestAnimationFrame(frame) // 다음 프레임 예약
```

### 8.8 완전한 시스템 연결 다이어그램

```
+-------------+     +---------------+     +------------------+
| Inspector   |     |    Config     |     |   DeferredPipeline|
| Panel (UI)  |     | (싱글턴 저장소) |     |   (GPU 렌더링)    |
+------+------+     +-------+-------+     +--------+---------+
       |                    |                       |
       | createField()      |                       |
       | .set(path, val)    |                       |
       |  ────────────→     |                       |
       |                    |  .data.rendering.*    |
       |                    |  ──────────────→      |  uniform buffer 갱신
       |                    |                       |  ──→ GPU 셰이더
       |                    |                       |
+------+------+     +-------+-------+     +--------+---------+
| TerrainTab  |     |  ChunkManager |     |   lighting.wgsl  |
| [Regenerate]|     |  .regenerate()|     |   sky.wgsl       |
|  ──────────────→  |  ←────────    |     |   weather.wgsl   |
+-------------+     +-------+-------+     +------------------+
                            |
+-------------+     +-------+-------+     +------------------+
|EnvironmentTab|    | DayNightCycle |     |  WeatherSystem   |
| .updateTime()|    | .timeOfDay    |     |  .intensity      |
|  ←──────────────  | .sunDir       |     |  .currentWeather |
| 시간 슬라이더  |    | .sunColor     |     |  .getFogDensity()|
| 날씨 드롭다운  |    |  ──────→ pipeline.sceneF32           |
+-------------+     +---------------+     +------------------+
                                                    |
+-------------+     +---------------+               |
|   FlyCamera |     |     HUD       |               |
|  .position  |     | .update()     |←── main.ts ───┘
|  .getVP()   |──→  | FPS, Pos,     |     fogStart/fogEnd
|  Config 읽기 |     | Time, Draws   |     = fogDist / weatherMul
+-------------+     +---------------+
```

---

## 요약

| 시스템 | 파일 | Config 경유 | 업데이트 시점 |
|--------|------|------------|--------------|
| DayNightCycle | `src/world/DayNightCycle.ts` | `environment.dayDurationSeconds` 읽기 | 매 프레임 |
| WeatherSystem | `src/world/WeatherSystem.ts` | 직접 제어 (Inspector에서) | 매 프레임 |
| TextureAtlas | `src/renderer/TextureAtlas.ts` | 없음 (초기화 시 1회) | 생성자에서 1회 |
| FlyCamera | `src/camera/FlyCamera.ts` | `camera.*` 읽기 | 매 프레임 |
| WebGPUContext | `src/renderer/WebGPUContext.ts` | 없음 | 초기화 + resize |
| HUD | `src/ui/HUD.ts` | 없음 (main.ts에서 직접 전달) | 매 프레임 |
| InspectorPanel | `src/ui/inspector/*.ts` | Config.set() / Config.get() | 사용자 입력 시 |
| DeferredPipeline | `src/renderer/DeferredPipeline.ts` | `rendering.*`, `environment.*` 읽기 | 매 프레임 |

핵심 설계 원칙:
- **Config 싱글턴**: 모든 조정 가능한 값의 단일 출처 (Single Source of Truth)
- **pub/sub**: `Config.onChange()` 핸들러로 변경사항 전파
- **dirty 추적**: 비용이 높은 작업(지형 재생성)은 dirty 플래그로 지연 처리
- **즉시/지연 분리**: 렌더링 파라미터는 즉시, 지형 파라미터는 Regenerate 버튼으로 분리
- **역방향 동기화**: EnvironmentTab의 `updateTime()`이 시스템 상태를 UI에 다시 반영
- **localStorage 지속성**: Config 변경 시 500ms 디바운스 후 자동 저장, 새로고침 시 복원
