# Phase 1: 전체 흐름 파악 (Engine Overview)

> 이 문서는 GanVoxelWorld-Webgpu 코드베이스를 처음 접하는 사람이 **엔진의 전체 구조와 데이터 흐름**을 빠르게 이해할 수 있도록 작성되었다.
> 모든 설명은 실제 코드에 기반하며, `파일:라인` 형식으로 참조를 표기한다.

---

## 1. 프로젝트 구조

### 1.1 디렉토리 트리

```
GanVoxelWorld-Webgpu/
├── index.html              # 엔트리 HTML - canvas, HUD, crosshair, WebGPU 미지원 안내
├── package.json            # 의존성, 스크립트 정의
├── vite.config.ts          # Vite 빌드 설정
├── tsconfig.json           # TypeScript 컴파일러 설정
│
└── src/
    ├── main.ts             # 앱 엔트리 포인트 - 초기화 + 게임 루프
    ├── constants.ts        # GPU/구조적 상수 (chunk 크기, 텍스처 포맷 등)
    ├── vite-env.d.ts       # WGSL import를 위한 타입 선언
    │
    ├── config/
    │   └── Config.ts       # 중앙 설정 관리자 - 싱글턴, pub/sub, dirty tracking
    │
    ├── camera/
    │   └── FlyCamera.ts    # FPS 스타일 비행 카메라
    │
    ├── terrain/
    │   ├── BlockTypes.ts       # 블록 타입 enum/정의
    │   ├── BiomeTypes.ts       # 바이옴 타입 정의
    │   ├── Chunk.ts            # 단일 청크 데이터 구조
    │   ├── ChunkManager.ts     # 청크 로드/언로드, 드로우콜 관리
    │   ├── TerrainGenerator.ts # Simplex noise 기반 지형 생성
    │   ├── CaveGenerator.ts    # 동굴 생성기
    │   ├── OreGenerator.ts     # 광석 배치
    │   ├── TreeGenerator.ts    # 나무 생성기
    │   ├── VegetationGenerator.ts # 풀/꽃 등 식생
    │   └── WaterSimulator.ts   # 물 시뮬레이션/배치
    │
    ├── meshing/
    │   └── MeshBuilder.ts  # 청크 복셀 → GPU vertex 변환 (AO, face culling)
    │
    ├── noise/
    │   ├── SimplexNoise.ts # CPU용 Simplex Noise (seeded permutation table)
    │   └── SeededRandom.ts # 시드 기반 난수 생성기
    │
    ├── renderer/
    │   ├── WebGPUContext.ts     # GPUDevice, GPUCanvasContext 래퍼
    │   ├── DeferredPipeline.ts  # Deferred rendering 전체 파이프라인
    │   ├── GBuffer.ts           # G-Buffer 텍스처 관리
    │   ├── ShadowMap.ts         # Cascaded Shadow Map
    │   ├── SSAO.ts              # Screen-Space Ambient Occlusion
    │   ├── PostProcess.ts       # Bloom, tone mapping 등 후처리
    │   ├── TAA.ts               # Temporal Anti-Aliasing
    │   ├── TextureAtlas.ts      # 블록 텍스처 아틀라스 생성
    │   └── shaderCheck.ts       # 셰이더 컴파일 검증 유틸리티
    │
    ├── shaders/                 # 모든 WGSL 셰이더 파일
    │   ├── gbuffer.vert.wgsl    # G-Buffer 정점 셰이더
    │   ├── gbuffer.frag.wgsl    # G-Buffer 프래그먼트 셰이더
    │   ├── lighting.wgsl        # Deferred lighting pass
    │   ├── shadow.vert.wgsl     # 그림자 맵 정점 셰이더
    │   ├── shadow_cutout.*      # Alpha cutout 그림자
    │   ├── sky.wgsl             # 하늘 렌더링 (대기 산란, 구름)
    │   ├── water.*              # 수면 렌더링
    │   ├── ssao.wgsl            # SSAO 계산
    │   ├── ssao_blur.wgsl       # SSAO 블러
    │   ├── bloom_*.wgsl         # Bloom 3단계 (threshold → downsample → upsample)
    │   ├── tonemap.wgsl         # HDR → SDR 톤매핑 + 후처리
    │   ├── taa_resolve.wgsl     # TAA resolve
    │   ├── velocity.wgsl        # 모션 벡터
    │   ├── lum_*.wgsl           # 자동 노출 (luminance 추출/다운샘플/적응)
    │   ├── volumetric.wgsl      # 볼류메트릭 라이팅
    │   ├── weather.wgsl         # 날씨 파티클 (비/눈)
    │   ├── motionblur.wgsl      # 모션 블러
    │   ├── dof.wgsl             # Depth of Field
    │   └── ssr.wgsl             # Screen-Space Reflections
    │
    ├── world/
    │   ├── DayNightCycle.ts # 낮/밤 주기, 태양/달 위치
    │   └── WeatherSystem.ts # 날씨 시스템 (비, 눈, 안개 밀도)
    │
    └── ui/
        ├── HUD.ts               # 좌상단 디버그 HUD (좌표, FPS, 청크 수 등)
        └── inspector/
            ├── InspectorPanel.ts   # Unity-style 설정 패널 컨테이너
            ├── InspectorTab.ts     # 탭 추상 클래스
            ├── InspectorSection.ts # 접이식 섹션
            ├── InspectorField.ts   # 개별 입력 필드 (슬라이더, 체크박스 등)
            ├── InspectorStyles.ts  # CSS 스타일
            ├── TerrainTab.ts       # Terrain 설정 탭
            ├── RenderingTab.ts     # Rendering 설정 탭
            ├── CameraTab.ts        # Camera 설정 탭
            └── EnvironmentTab.ts   # Environment 설정 탭
```

### 1.2 빌드 시스템: Vite + TypeScript

**Vite** (`vite.config.ts`)가 개발 서버와 프로덕션 빌드를 담당한다.

```ts
// vite.config.ts
export default defineConfig({
  build: {
    target: 'esnext',       // 최신 ES 기능 사용 (top-level await 등)
  },
  assetsInclude: ['**/*.wgsl'],  // WGSL 셰이더 파일을 에셋으로 인식
});
```

핵심 빌드 설정:

| 항목 | 값 | 의미 |
|------|-----|------|
| `build.target` | `'esnext'` | WebGPU를 지원하는 최신 브라우저만 대상. 하위 호환 트랜스파일 없음 |
| `assetsInclude` | `['**/*.wgsl']` | `.wgsl` 파일을 Vite 에셋으로 등록하여 import 가능하게 함 |

**TypeScript** (`tsconfig.json`) 설정:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",   // Vite bundler 해석 방식 사용
    "strict": true,                  // strict 모드 전체 활성화
    "noEmit": true,                  // tsc는 타입 체크만, 번들은 Vite가 담당
    "types": ["@webgpu/types"]       // WebGPU API 타입 정의
  },
  "include": ["src"]
}
```

**WGSL import 방식** (`src/vite-env.d.ts`):

```ts
// WGSL 파일을 ?raw 쿼리로 import하면 문자열로 가져옴
declare module '*.wgsl?raw' {
  const content: string;
  export default content;
}
```

셰이더 파일을 TypeScript에서 이렇게 사용한다:
```ts
import gbufferVertSrc from '../shaders/gbuffer.vert.wgsl?raw';
// gbufferVertSrc는 WGSL 소스코드 문자열
```

빌드 스크립트 (`package.json:7-9`):

| 명령 | 동작 |
|------|------|
| `npm run dev` | Vite 개발 서버 (HMR 지원) |
| `npm run build` | `tsc` 타입 체크 후 `vite build` 프로덕션 빌드 |
| `npm run preview` | 빌드 결과물 로컬 프리뷰 |

### 1.3 의존성

| 패키지 | 종류 | 용도 |
|--------|------|------|
| `gl-matrix` ^3.4.3 | runtime | 벡터/행렬 연산 (vec3, mat4 등). 카메라 변환, 투영 행렬 계산에 사용 |
| `typescript` ^5.7.0 | dev | TypeScript 컴파일러 |
| `vite` ^6.0.0 | dev | 번들러 + 개발 서버 |
| `@webgpu/types` ^0.1.51 | dev | WebGPU API 타입 정의 (`GPUDevice`, `GPUTexture` 등) |

> **특징**: 런타임 의존성이 `gl-matrix` 하나뿐이다. 렌더링, 지형 생성, UI 모두 자체 구현이며, Three.js 같은 엔진 라이브러리를 사용하지 않는다.

---

## 2. 엔트리 포인트 (main.ts)

`src/main.ts`는 전체 엔진의 시작점이다. `async function main()`으로 시작하여 WebGPU 초기화, 시스템 생성, 게임 루프 등록까지 하나의 함수에서 순차적으로 진행된다.

### 2.1 초기화 순서

```
main() 호출
  │
  ├─ 1. Canvas 요소 획득
  ├─ 2. WebGPU 지원 확인 (navigator.gpu)
  │     └─ 미지원 시 #no-webgpu 표시 후 return
  ├─ 3. WebGPUContext 생성 (GPUDevice + GPUCanvasContext)
  │     └─ 실패 시 에러 표시 후 return
  ├─ 4. ctx.resize() — 초기 캔버스 크기 설정
  │
  ├─ 5. DayNightCycle 생성
  ├─ 6. WeatherSystem 생성
  ├─ 7. DeferredPipeline 생성 + init() (셰이더 컴파일 대기)
  │     └─ pipeline.setWeatherSystem(weatherSystem)
  ├─ 8. TextureAtlas 생성 → pipeline에 등록
  │
  ├─ 9. FlyCamera 생성 (시작 위치: 청크 중앙, 높이 75%)
  ├─ 10. ChunkManager 생성 (seed=0)
  ├─ 11. HUD 생성
  │
  ├─ 12. InspectorPanel + 4개 탭 구성
  │     ├─ TerrainTab (regenerate 콜백 포함)
  │     ├─ RenderingTab
  │     ├─ CameraTab
  │     └─ EnvironmentTab
  │
  ├─ 13. 키보드 이벤트 등록 (H키 = HUD 토글)
  ├─ 14. Config.onChange() 리액티브 바인딩
  ├─ 15. window resize 이벤트 등록
  ├─ 16. cleanup 함수 정의
  │
  └─ 17. requestAnimationFrame(frame) — 게임 루프 시작
```

코드로 보는 초기화 흐름 (`main.ts:19-96`):

```ts
async function main() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;

  // WebGPU 사용 가능 여부 체크
  if (!navigator.gpu) { /* 에러 UI 표시 후 return */ }

  // WebGPU 컨텍스트 생성 (어댑터 요청 → 디바이스 요청 → 캔버스 컨텍스트 설정)
  let ctx: WebGPUContext;
  try {
    ctx = await WebGPUContext.create(canvas);
  } catch (e) { /* 에러 표시 후 return */ }

  ctx.resize();  // 초기 캔버스 크기에 맞춰 텍스처 재생성

  // 월드 시스템
  const dayNightCycle = new DayNightCycle();
  const weatherSystem = new WeatherSystem();

  // 렌더링 파이프라인 (모든 셰이더 컴파일을 여기서 await)
  const pipeline = new DeferredPipeline(ctx, dayNightCycle);
  await pipeline.init();
  pipeline.setWeatherSystem(weatherSystem);

  // 텍스처 아틀라스 → 파이프라인에 바인딩
  const atlas = new TextureAtlas(ctx);
  pipeline.setAtlasTexture(atlas.texture, atlas.materialTexture, atlas.normalTexture);

  // 카메라 초기 위치: 청크(0,0)의 중앙, 높이 = CHUNK_HEIGHT * 0.75
  const startX = 0 * CHUNK_WIDTH + CHUNK_WIDTH / 2;  // = 8
  const startZ = 0 * CHUNK_WIDTH + CHUNK_WIDTH / 2;  // = 8
  const camera = new FlyCamera(canvas, vec3.fromValues(startX, CHUNK_HEIGHT * 0.75, startZ));

  let chunkManager = new ChunkManager(ctx, seed);
  const hud = new HUD();
  // ... Inspector 등록, 이벤트 바인딩 ...
}
```

### 2.2 게임 루프 구조

`requestAnimationFrame`을 사용한 표준 게임 루프 패턴이다 (`main.ts:113-173`).

```ts
let lastTime = performance.now();
let frameCount = 0;

function frame() {
  frameCount++;
  const now = performance.now();
  const dt = Math.min((now - lastTime) / 1000, 0.1);  // ← 100ms 캡
  lastTime = now;

  // === 프레임 처리 ===
  ctx.resize();
  camera.update(dt);
  dayNightCycle.update(dt);
  weatherSystem.update(dt);
  envTab.updateTime();

  // 카메라 행렬 계산 + 렌더링 파이프라인 업데이트
  const viewProj = camera.getViewProjection(ctx.aspectRatio);
  pipeline.updateCamera(viewProj, projection, view, camera.position, ...);

  // 청크 업데이트 (로드/언로드/메싱)
  chunkManager.update(camera.position, viewProj);

  // 포인트 라이트 수집 + 드로우콜 수집
  const pointLights = chunkManager.getPointLights(camera.position);
  pipeline.updatePointLights(pointLights);
  const drawCalls = chunkManager.getDrawCalls();
  const waterDrawCalls = chunkManager.getWaterDrawCalls();
  const vegDrawCalls = chunkManager.getVegetationDrawCalls();

  // 렌더링 실행
  pipeline.render(drawCalls, waterDrawCalls, vegDrawCalls);

  // HUD 업데이트
  hud.update(camera.position, chunkManager.totalChunks, seed, ...);

  requestAnimationFrame(frame);  // 다음 프레임 예약
}

requestAnimationFrame(frame);  // 최초 프레임 시작
```

### 2.3 프레임별 실행 흐름

매 프레임마다 실행되는 순서를 시각적으로 표현하면:

```
requestAnimationFrame(frame)
  │
  ├─ [1] Delta Time 계산
  │     dt = min((now - lastTime) / 1000, 0.1)
  │     └─ 100ms 캡: 탭 전환/디버거 중단 시 물리 폭발 방지
  │
  ├─ [2] ctx.resize()
  │     └─ 캔버스 크기 변경 감지 → G-Buffer, 깊이 버퍼 등 재생성
  │
  ├─ [3] 시스템 업데이트 (dt 전달)
  │     ├─ camera.update(dt)       → 입력 처리, 위치/방향 갱신
  │     ├─ dayNightCycle.update(dt) → 시간 경과, 태양 각도 계산
  │     └─ weatherSystem.update(dt) → 날씨 상태 전이, 파티클 갱신
  │
  ├─ [4] 카메라 행렬 계산
  │     ├─ viewProj = camera.getViewProjection(ctx.aspectRatio)
  │     ├─ projection = camera.getProjection()
  │     └─ view = camera.getView()
  │
  ├─ [5] 안개 거리 계산
  │     fogDist = renderDistance * CHUNK_WIDTH
  │     fogStart = fogDist * fog.startRatio / fogMul   ← 날씨가 안개 밀도 조절
  │     fogEnd   = fogDist * fog.endRatio   / fogMul
  │
  ├─ [6] pipeline.updateCamera(...)
  │     └─ GPU uniform buffer에 카메라/안개 데이터 기록
  │
  ├─ [7] chunkManager.update(camera.position, viewProj)
  │     └─ 카메라 주변 청크 로드, 멀리 있는 청크 언로드, 메싱 큐 처리
  │
  ├─ [8] 포인트 라이트 + 드로우콜 수집
  │     ├─ pointLights = chunkManager.getPointLights(camera.position)
  │     ├─ drawCalls = chunkManager.getDrawCalls()        (불투명 블록)
  │     ├─ waterDrawCalls = chunkManager.getWaterDrawCalls() (수면)
  │     └─ vegDrawCalls = chunkManager.getVegetationDrawCalls() (식생)
  │
  ├─ [9] pipeline.render(drawCalls, waterDrawCalls, vegDrawCalls)
  │     └─ G-Buffer Pass → Shadow Pass → SSAO → Lighting →
  │        Water → Sky → Volumetric → Bloom → TAA → Tonemap → Present
  │
  └─ [10] hud.update(...)
        └─ 좌표, 청크 수, seed, 속도, 시각 정보 표시
```

### 2.4 Config.onChange() 리액티브 바인딩

설정 변경이 즉시 반영되어야 하는 항목들을 `Config.onChange()`로 구독한다 (`main.ts:88-96`):

```ts
const onConfigChange: (path: string, value: unknown) => void = (path) => {
  // renderDistance 변경 → ChunkManager에 즉시 전파
  if (path === 'rendering.general.renderDistance') {
    chunkManager.renderDistance = Config.data.rendering.general.renderDistance;
  }
  // bloom/autoExposure 변경 → 파이프라인 파라미터 즉시 업데이트
  if (path.startsWith('rendering.bloom.') || path.startsWith('rendering.autoExposure.')) {
    pipeline.updateBloomParams();
  }
};
Config.onChange(onConfigChange);
```

여기서 등록한 핸들러는 cleanup 시 반드시 제거해야 한다 (`main.ts:108`):
```ts
Config.removeHandler(onConfigChange);
```

### 2.5 Delta Time 관리

```ts
const dt = Math.min((now - lastTime) / 1000, 0.1); // cap at 100ms
```

| 요소 | 설명 |
|------|------|
| `performance.now()` | 밀리초 단위의 고정밀 타이머 |
| `/ 1000` | 밀리초 → 초 변환. 물리/로직에서 `dt`는 항상 **초** 단위 |
| `Math.min(..., 0.1)` | **100ms 캡**. 탭 비활성, 디버거 중단 등으로 긴 시간이 경과한 경우 한 프레임에 dt=5초 같은 값이 들어오는 것을 방지. 이 없으면 물리 시뮬레이션이 한 번에 수 미터 이동하는 등의 문제가 발생한다 |

---

## 3. Config 시스템 (Config.ts)

`src/config/Config.ts`는 엔진의 모든 동적 설정을 관리하는 **중앙 집중식 설정 시스템**이다.

### 3.1 싱글턴 아키텍처

```ts
// Config.ts:332
class ConfigManager {
  data: AppConfig;
  private handlers: ChangeHandler[] = [];
  private dirtyGroups = new Set<ConfigGroup>();
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  // ...
}

// Config.ts:525 - 모듈 레벨에서 단일 인스턴스 export
export const Config = new ConfigManager();
```

`Config`는 `ConfigManager` 클래스의 **유일한 인스턴스**로, `export const`로 내보내진다. 어떤 모듈에서든 `import { Config } from './config/Config'`로 동일한 인스턴스에 접근한다.

생성자에서 두 가지 일이 일어난다 (`Config.ts:338-341`):
1. `this.getDefaults()` — 모든 설정값의 기본값으로 초기화
2. `this.loadFromStorage()` — localStorage에 저장된 값이 있으면 덮어씌움 (deep merge)

### 3.2 4대 설정 그룹

`AppConfig` 인터페이스는 4개의 최상위 그룹으로 구성된다 (`Config.ts:183-188`):

```ts
export interface AppConfig {
  terrain: TerrainConfig;
  rendering: RenderingConfig;
  camera: CameraConfig;
  environment: EnvironmentConfig;
}
```

| 그룹 | 변경 방식 | 적용 타이밍 |
|------|-----------|-------------|
| `terrain` | Deferred (Regenerate 버튼) | 지형 재생성 시에만 반영 |
| `rendering` | Immediate | 매 프레임 렌더링 시 Config.data에서 직접 읽음 |
| `camera` | Immediate | 매 프레임 camera.update()에서 읽음 |
| `environment` | Immediate | 매 프레임 dayNightCycle/weatherSystem에서 읽음 |

### 3.3 모든 설정값의 기본값과 의미

#### terrain.noise (Simplex FBM 파라미터)

| 경로 | 기본값 | 범위 | 의미 |
|------|--------|------|------|
| `terrain.noise.octaves` | 4 | 1-8 | FBM 옥타브 수. 높을수록 세밀한 디테일 |
| `terrain.noise.persistence` | 0.5 | 0.01-1 | 각 옥타브의 진폭 감소율 |
| `terrain.noise.lacunarity` | 2.0 | 1-4 | 각 옥타브의 주파수 증가율 |
| `terrain.noise.scale` | 50.0 | 1-500 | 노이즈 전체 스케일 (클수록 완만한 지형) |

#### terrain.height (높이맵 파라미터)

| 경로 | 기본값 | 범위 | 의미 |
|------|--------|------|------|
| `terrain.height.seaLevel` | 50 | 0-255 | 해수면 높이. 이 아래는 물로 채워짐 |
| `terrain.height.minHeight` | 1 | 1-255 | 지형 최소 높이 |
| `terrain.height.maxHeight` | 100 | 1-255 | 지형 최대 높이 (minHeight보다 커야 함) |
| `terrain.height.dirtLayerDepth` | 4 | 1-20 | 표면 흙 층 두께 |

#### terrain.biomes (바이옴 생성 파라미터)

| 경로 | 기본값 | 범위 | 의미 |
|------|--------|------|------|
| `terrain.biomes.temperatureScale` | 200.0 | 10-2000 | 온도 노이즈 스케일 |
| `terrain.biomes.humidityScale` | 200.0 | 10-2000 | 습도 노이즈 스케일 |
| `terrain.biomes.continentalnessScale` | 400.0 | 10-2000 | 대륙성 노이즈 스케일 (해양/육지 구분) |
| `terrain.biomes.heightVariationScale` | 30.0 | 1-200 | 바이옴별 높이 변화 스케일 |
| `terrain.biomes.oceanThreshold` | 0.3 | 0-1 | 대륙성 값이 이 이하면 해양 |

#### terrain.caves (동굴 시스템)

| 경로 | 기본값 | 범위 | 의미 |
|------|--------|------|------|
| `terrain.caves.count` | 8 | 0-50 | 청크당 동굴 worm 개수 |
| `terrain.caves.minLength` | 50 | 1-500 | 동굴 최소 길이 |
| `terrain.caves.maxLength` | 150 | 1-500 | 동굴 최대 길이 |
| `terrain.caves.minRadius` | 1.5 | 0.5-10 | 동굴 최소 반지름 |
| `terrain.caves.maxRadius` | 4.0 | 0.5-20 | 동굴 최대 반지름 |
| `terrain.caves.minY` | 10 | 0-255 | 동굴 생성 최소 높이 |
| `terrain.caves.maxY` | 60 | 0-255 | 동굴 생성 최대 높이 |

#### terrain.ores (광석 배치)

| 경로 | 기본값 | 의미 |
|------|--------|------|
| `terrain.ores.coal` | `{ minY:5, maxY:128, attempts:20, veinSize:8 }` | 석탄 |
| `terrain.ores.iron` | `{ minY:5, maxY:64, attempts:20, veinSize:6 }` | 철 |
| `terrain.ores.gold` | `{ minY:5, maxY:32, attempts:2, veinSize:5 }` | 금 |
| `terrain.ores.diamond` | `{ minY:5, maxY:16, attempts:1, veinSize:4 }` | 다이아몬드 |

> 각 광석의 `attempts`는 청크당 생성 시도 횟수, `veinSize`는 광맥의 블록 수이다. 희귀 광석일수록 `maxY`가 낮고 `attempts`가 적다.

#### terrain.trees (나무 생성)

| 경로 | 기본값 | 범위 | 의미 |
|------|--------|------|------|
| `terrain.trees.perChunk` | 3 | 0-20 | 청크당 나무 수 |
| `terrain.trees.minTrunkHeight` | 4 | 1-20 | 줄기 최소 높이 |
| `terrain.trees.maxTrunkHeight` | 6 | 1-30 | 줄기 최대 높이 |
| `terrain.trees.leafDecayChance` | 0.2 | 0-1 | 잎 블록 alpha cutout 확률 |

#### rendering.general (렌더링 일반)

| 경로 | 기본값 | 범위 | 의미 |
|------|--------|------|------|
| `rendering.general.renderDistance` | 10 | 1-32 | 청크 렌더 거리 (반지름, 단위: 청크) |
| `rendering.general.chunksPerFrame` | 2 | 1-10 | 프레임당 메싱 처리할 청크 수 |

#### rendering.shadows (Cascaded Shadow Map)

| 경로 | 기본값 | 범위 | 의미 |
|------|--------|------|------|
| `rendering.shadows.cascadeCount` | 3 | 1-8 | 캐스케이드 단계 수 |
| `rendering.shadows.mapSize` | 2048 | 256-8192 | 섀도우 맵 해상도 (px) |
| `rendering.shadows.cascadeSplits` | [20, 60, 160] | (오름차순) | 각 캐스케이드의 거리 분할점 |

#### rendering.ssao (Screen-Space Ambient Occlusion)

| 경로 | 기본값 | 범위 | 의미 |
|------|--------|------|------|
| `rendering.ssao.kernelSize` | 16 | 4-64 | 샘플 커널 크기 |
| `rendering.ssao.radius` | 1.5 | 0.01-10 | 샘플링 반지름 |
| `rendering.ssao.bias` | 0.025 | 0-1 | 자기 차폐 방지 바이어스 |

#### rendering.bloom (Bloom 효과)

| 경로 | 기본값 | 범위 | 의미 |
|------|--------|------|------|
| `rendering.bloom.mipLevels` | 5 | 1-10 | 다운샘플 단계 수 |
| `rendering.bloom.threshold` | 1.0 | 0-10 | HDR 밝기 임계값 |
| `rendering.bloom.intensity` | 0.3 | 0-5 | 블룸 강도 |

#### rendering.fog (안개)

| 경로 | 기본값 | 범위 | 의미 |
|------|--------|------|------|
| `rendering.fog.startRatio` | 0.85 | 0-5 | 안개 시작 거리 비율 (renderDistance 기준) |
| `rendering.fog.endRatio` | 1.15 | 0-5 | 안개 완전 불투명 거리 비율 |

#### rendering.contactShadows (Contact Shadows)

| 경로 | 기본값 | 범위 | 의미 |
|------|--------|------|------|
| `rendering.contactShadows.enabled` | false | - | 활성화 여부 |
| `rendering.contactShadows.maxSteps` | 16 | 1-64 | 레이마칭 최대 스텝 수 |
| `rendering.contactShadows.rayLength` | 0.5 | 0.01-10 | 레이 최대 길이 |
| `rendering.contactShadows.thickness` | 0.3 | 0.01-5 | 차폐 판정 두께 |

#### rendering.taa (Temporal Anti-Aliasing)

| 경로 | 기본값 | 범위 | 의미 |
|------|--------|------|------|
| `rendering.taa.enabled` | true | - | TAA 활성화 여부 |
| `rendering.taa.blendFactor` | 0.9 | 0-1 | 이전 프레임과의 블렌딩 비율 (높을수록 안정적) |

#### rendering.autoExposure (자동 노출)

| 경로 | 기본값 | 범위 | 의미 |
|------|--------|------|------|
| `rendering.autoExposure.enabled` | true | - | 활성화 여부 |
| `rendering.autoExposure.adaptSpeed` | 1.5 | 0.01-10 | 노출 적응 속도 (초당) |
| `rendering.autoExposure.keyValue` | 0.18 | 0.01-1 | 목표 key value (18% 회색) |
| `rendering.autoExposure.minExposure` | 0.1 | 0.001-10 | 최소 노출 값 |
| `rendering.autoExposure.maxExposure` | 5.0 | 0.01-100 | 최대 노출 값 |

#### rendering.postProcess (후처리 효과)

| 경로 | 기본값 | 범위 | 의미 |
|------|--------|------|------|
| `rendering.postProcess.vignette.enabled` | true | - | 비네팅 활성화 |
| `rendering.postProcess.vignette.intensity` | 0.4 | 0-2 | 비네팅 강도 |
| `rendering.postProcess.chromaticAberration.enabled` | true | - | 색수차 활성화 |
| `rendering.postProcess.chromaticAberration.intensity` | 0.002 | 0-0.05 | 색수차 강도 |

#### rendering.motionBlur (모션 블러)

| 경로 | 기본값 | 범위 | 의미 |
|------|--------|------|------|
| `rendering.motionBlur.enabled` | false | - | 모션 블러 활성화 |
| `rendering.motionBlur.strength` | 0.5 | 0-2 | 블러 강도 |

#### rendering.dof (Depth of Field)

| 경로 | 기본값 | 범위 | 의미 |
|------|--------|------|------|
| `rendering.dof.enabled` | false | - | DoF 활성화 |
| `rendering.dof.focusDistance` | 50.0 | 0.1-1000 | 초점 거리 |
| `rendering.dof.aperture` | 0.05 | 0.001-1 | 조리개 크기 (클수록 얕은 피사계 심도) |
| `rendering.dof.maxBlur` | 10.0 | 0-50 | 최대 블러 반지름 |

#### rendering.pcss (Percentage-Closer Soft Shadows)

| 경로 | 기본값 | 범위 | 의미 |
|------|--------|------|------|
| `rendering.pcss.enabled` | true | - | PCSS 활성화 |
| `rendering.pcss.lightSize` | 3.0 | 0.1-20 | 광원 크기 (클수록 소프트 섀도우) |

#### camera (카메라)

| 경로 | 기본값 | 범위 | 의미 |
|------|--------|------|------|
| `camera.speed` | 20.0 | 0.1-500 | 기본 이동 속도 (블록/초) |
| `camera.fastSpeed` | 60.0 | 0.1-1000 | Shift 이동 속도 |
| `camera.mouseSensitivity` | 0.002 | 0.0001-0.05 | 마우스 감도 |
| `camera.fov` | 1.2217 (70deg) | 0.1-3.14 | 시야각 (라디안) |
| `camera.near` | 0.1 | 0.01-10 | 근평면 거리 |
| `camera.far` | 1000.0 | 10-100000 | 원평면 거리 |

> `fov`의 기본값은 `70 * (Math.PI / 180)` = 약 1.2217 라디안이다.

#### environment (환경)

| 경로 | 기본값 | 범위 | 의미 |
|------|--------|------|------|
| `environment.dayDurationSeconds` | 1200 | 10-36000 | 하루 주기 (초). 1200 = 20분 |
| `environment.cloudCoverage` | 0.35 | 0-1 | 구름 커버리지 (legacy) |
| `environment.cloud.coverage` | 0.35 | 0-1 | 구름 커버리지 |
| `environment.cloud.baseNoiseScale` | 0.0018 | 0.0001-0.1 | 구름 노이즈 스케일 |
| `environment.cloud.extinction` | 0.3 | 0.01-5 | 구름 소멸 계수 |
| `environment.cloud.multiScatterFloor` | 0.35 | 0-1 | 다중 산란 최소값 |
| `environment.cloud.detailStrength` | 0.15 | 0-1 | 디테일 노이즈 강도 |

### 3.4 get()/set() 동작 방식

#### get() - dot-notation 경로로 값 읽기

```ts
// Config.ts:428-430
get(path: string): unknown {
  return getNestedValue(this.data as unknown as Record<string, unknown>, path);
}
```

내부의 `getNestedValue()` 함수가 점(`.`)으로 구분된 경로를 따라 중첩 객체를 탐색한다 (`Config.ts:298-306`):

```ts
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}
```

사용 예시:
```ts
Config.get('terrain.noise.octaves')   // → 4
Config.get('rendering.bloom.threshold') // → 1.0
Config.get('camera.fov')              // → 1.2217...
```

#### set() - 검증 + 변경 + 알림 + 저장

`set()`은 단순 값 설정이 아니라, 다단계 검증 파이프라인을 통과해야 한다 (`Config.ts:432-497`):

```
set(path, value)
  │
  ├─ [1] 타입 검증
  │     ├─ 기존값이 number인데 새 값이 number가 아니거나 Infinity/NaN → 거부
  │     └─ 기존값이 boolean인데 새 값이 boolean이 아님 → 거부
  │
  ├─ [2] 범위 검증 (VALIDATION_RULES)
  │     └─ 숫자값이 정의된 [min, max] 범위를 벗어나면 → 거부
  │
  ├─ [3] 교차 제약 검증 (CROSS_CONSTRAINTS)
  │     └─ 예: minHeight > maxHeight가 되면 → 거부
  │
  ├─ [4] 특수 검증 (cascadeSplits 오름차순 확인)
  │
  ├─ [5] 값 적용
  │     setNestedValue(this.data, path, value)
  │
  ├─ [6] Dirty 그룹 마킹
  │     dirtyGroups.add(path.split('.')[0])  // 'terrain', 'rendering' 등
  │
  ├─ [7] 모든 onChange 핸들러 호출
  │     for (const handler of this.handlers) handler(path, value);
  │
  └─ [8] localStorage 저장 스케줄링 (500ms debounce)
```

반환값은 `SetResult` 타입이다:
```ts
interface SetResult {
  success: boolean;
  error?: string;  // 실패 시 에러 메시지
}
```

### 3.5 onChange() pub/sub 패턴

핵심 메커니즘: `set()`이 호출될 때마다 등록된 모든 핸들러에 `(경로, 새 값)`을 전달한다.

```ts
// 핸들러 등록
Config.onChange((path: string, value: unknown) => {
  if (path === 'rendering.general.renderDistance') {
    chunkManager.renderDistance = value as number;
  }
});

// 핸들러 제거 (cleanup 시 필수)
Config.removeHandler(handler);
```

`resetToDefaults()` 호출 시에는 특별한 와일드카드 알림이 전송된다 (`Config.ts:519-520`):
```ts
for (const handler of this.handlers) {
  handler('*', undefined);  // path='*'는 "모든 것이 변경됨"을 의미
}
```

### 3.6 isDirty()/clearDirty() 더티 추적

Terrain 설정처럼 **즉시 적용이 비싼** 변경은 dirty flag 패턴으로 관리한다:

```ts
// set() 내부에서 자동으로 dirty 마킹
const group = path.split('.')[0] as ConfigGroup; // 'terrain'
this.dirtyGroups.add(group);

// 외부에서 체크
if (Config.isDirty('terrain')) {
  // 지형 재생성 로직 실행
  Config.clearDirty('terrain');
}
```

실제로 terrain 그룹은 Inspector의 "Regenerate" 버튼을 눌러야만 반영된다. 버튼 클릭 시:
1. `Config.isDirty('terrain')` 확인
2. 새 seed로 `chunkManager.regenerate(seed)` 호출
3. `Config.clearDirty('terrain')`

### 3.7 타입 검증 로직

세 가지 레벨의 검증이 있다:

**1단계: 타입 일치 확인** (`Config.ts:434-444`)
```ts
const existing = this.get(path);
if (typeof existing === 'number') {
  if (typeof value !== 'number' || !Number.isFinite(value))
    return { success: false, error: `expected finite number` };
}
if (typeof existing === 'boolean' && typeof value !== 'boolean')
  return { success: false, error: `expected boolean` };
```

**2단계: 범위 검증** (`Config.ts:447-454`)
```ts
const rule = VALIDATION_RULES[path];  // { min, max }
if (rule && (value < rule.min || value > rule.max))
  return { success: false, error: `out of range [${rule.min}, ${rule.max}]` };
```

VALIDATION_RULES는 모든 숫자 설정의 허용 범위를 정의한 flat map이다 (`Config.ts:204-286`).

**3단계: 교차 제약** (`Config.ts:457-471`)
```ts
// CROSS_CONSTRAINTS 예시:
// ['terrain.height.minHeight', 'terrain.height.maxHeight']
// → minHeight 설정 시 maxHeight보다 크면 거부
// → maxHeight 설정 시 minHeight보다 작으면 거부
```

6쌍의 교차 제약이 정의되어 있다 (`Config.ts:289-296`):
- `minHeight` < `maxHeight`
- `minTrunkHeight` < `maxTrunkHeight`
- `caves.minLength` < `caves.maxLength`
- `caves.minRadius` < `caves.maxRadius`
- `caves.minY` < `caves.maxY`
- `autoExposure.minExposure` < `autoExposure.maxExposure`

### 3.8 localStorage 영속성

**저장**: `set()` 호출 시 500ms debounce로 저장 스케줄링 (`Config.ts:416-426`)
```ts
private scheduleSave(): void {
  if (this.saveTimer !== null) clearTimeout(this.saveTimer);
  this.saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch { /* Storage full or unavailable */ }
    this.saveTimer = null;
  }, 500);  // 500ms 동안 추가 변경이 없을 때 한 번만 저장
}
```

**복원**: 생성자에서 `loadFromStorage()` 호출 (`Config.ts:402-414`)
```ts
private loadFromStorage(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);  // key: 'voxelEngineConfig'
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved && typeof saved === 'object') {
        deepMerge(this.data, saved);  // 기본값 위에 저장된 값을 덮어씌움
      }
    }
  } catch { /* Corrupted → 기본값 유지 */ }
}
```

`deepMerge()`는 중첩 객체를 재귀적으로 병합한다. 저장된 설정에 새 버전에서 추가된 필드가 없어도 기본값이 유지되므로, 버전 간 호환성이 보장된다.

**리셋**: (`Config.ts:516-522`)
```ts
resetToDefaults(): void {
  this.data = this.getDefaults();
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  for (const handler of this.handlers) {
    handler('*', undefined);  // 모든 구독자에게 리셋 알림
  }
}
```

---

## 4. 상수 (constants.ts)

`src/constants.ts`에는 **런타임에 변경되지 않는 GPU/구조적 상수**만 정의한다. Config에 넣기 부적절한 값들이다.

### 4.1 청크 크기

```ts
export const CHUNK_WIDTH  = 16;   // X축 블록 수
export const CHUNK_HEIGHT = 128;  // Y축 블록 수
export const CHUNK_DEPTH  = 16;   // Z축 블록 수
export const CHUNK_TOTAL_BLOCKS = CHUNK_WIDTH * CHUNK_HEIGHT * CHUNK_DEPTH; // = 32,768
```

한 청크는 16x128x16 = **32,768개의 블록**으로 구성된다. XZ 평면은 Minecraft와 동일한 16x16이고, 높이는 128이다.

이 값들이 상수인 이유: 청크 크기는 메모리 레이아웃, GPU 버퍼 사이즈, 인덱싱 연산에 직접 연관되므로 런타임 변경이 불가능하다.

### 4.2 텍스처 아틀라스

```ts
export const TILE_SIZE = 16;       // 하나의 블록 텍스처 크기 (16x16 픽셀)
export const ATLAS_TILES = 16;     // 아틀라스 한 변의 타일 수 (16x16 그리드)
export const ATLAS_PIXEL_SIZE = TILE_SIZE * ATLAS_TILES;  // = 256 (아틀라스 전체 256x256 px)
```

텍스처 아틀라스 구조:
```
256px (ATLAS_PIXEL_SIZE)
┌─────────────────────────────┐
│ [0,0] [1,0] [2,0] ... [15,0]│  ← 16개 타일
│ [0,1] [1,1] [2,1] ... [15,1]│
│  ...                        │  총 16x16 = 256 슬롯
│ [0,15][1,15][2,15]...[15,15]│
└─────────────────────────────┘
각 타일: 16x16 픽셀
```

### 4.3 GPU 텍스처 포맷

| 상수 | 값 | 용도 |
|------|-----|------|
| `GBUFFER_ALBEDO_FORMAT` | `'rgba8unorm'` | G-Buffer albedo (색상). 8bit x 4채널 |
| `GBUFFER_NORMAL_FORMAT` | `'rgba16float'` | G-Buffer normal. 16bit float로 정밀한 법선 저장 |
| `GBUFFER_MATERIAL_FORMAT` | `'rgba8unorm'` | G-Buffer material (roughness, metallic 등) |
| `DEPTH_FORMAT` | `'depth32float'` | 깊이 버퍼. 32bit float 정밀도 |
| `HDR_FORMAT` | `'rgba16float'` | HDR 렌더 타겟. 톤매핑 전 고범위 색상 저장 |
| `SSAO_NOISE_SIZE` | `4` | SSAO 노이즈 텍스처 4x4 |
| `VELOCITY_FORMAT` | `'rg16float'` | TAA 모션 벡터. RG 2채널 16bit float |
| `LUMINANCE_FORMAT` | `'r16float'` | 자동 노출 luminance 텍스처 |

### 4.4 포인트 라이트

```ts
export const MAX_POINT_LIGHTS = 128;
```

동시에 활성화 가능한 포인트 라이트 최대 수. GPU 버퍼 크기를 결정한다. 발광 블록(용암, 글로우스톤 등)에서 생성되는 동적 조명이 이 제한에 걸린다.

---

## 5. 시스템 간 의존성 다이어그램

### 5.1 초기화 시점 의존성

```
index.html
  └─ <script src="/src/main.ts">
       │
       ▼
     main()
       │
       ├─ WebGPUContext.create(canvas)    ← GPU 어댑터/디바이스 초기화
       │    │
       │    ▼
       ├─ DeferredPipeline(ctx, dayNightCycle)
       │    ├─ .init()                    ← 모든 셰이더 컴파일 (async)
       │    ├─ .setWeatherSystem()
       │    └─ .setAtlasTexture()         ← TextureAtlas 바인딩
       │         ▲
       │         │
       ├─ TextureAtlas(ctx)              ← GPU에 블록 텍스처 업로드
       │
       ├─ FlyCamera(canvas, startPos)    ← 입력 이벤트 바인딩
       │
       ├─ ChunkManager(ctx, seed)        ← 지형 생성 시작
       │
       ├─ HUD()                          ← DOM 요소 참조
       │
       └─ InspectorPanel()               ← UI DOM 생성
            ├─ TerrainTab
            ├─ RenderingTab
            ├─ CameraTab
            └─ EnvironmentTab
```

### 5.2 런타임 데이터 흐름 (매 프레임)

```
                    ┌──────────────────────┐
                    │      Config          │
                    │  (중앙 설정 저장소)     │
                    └──────┬───────────────┘
           ┌───────────────┼────────────────────────────┐
           │               │                            │
           ▼               ▼                            ▼
    ┌─────────────┐ ┌──────────────┐           ┌──────────────────┐
    │  FlyCamera  │ │ ChunkManager │           │  DeferredPipeline │
    │             │ │              │           │                  │
    │ .speed      │ │ .renderDist  │           │ bloom params     │
    │ .fov        │ │ .chunksPerFr │           │ ssao params      │
    │ .sensitivity│ │              │           │ shadow params    │
    └──────┬──────┘ └──────┬───────┘           └────────┬─────────┘
           │               │                            │
           │        ┌──────┴───────────┐                │
           │        │                  │                │
           ▼        ▼                  ▼                │
    ┌──────────┐ ┌───────────┐ ┌─────────────┐         │
    │ viewProj │ │ drawCalls │ │ pointLights │         │
    │ view     │ │ waterDraw │ │             │         │
    │ proj     │ │ vegDraw   │ └──────┬──────┘         │
    └────┬─────┘ └─────┬─────┘       │                 │
         │             │             │                 │
         └─────────────┼─────────────┘                 │
                       │                               │
                       ▼                               │
              ┌──────────────────┐                     │
              │ pipeline.render()│◄────────────────────┘
              │                  │
              │ G-Buffer → Shadow → SSAO → Lighting    │
              │ → Water → Sky → Volumetric             │
              │ → Bloom → TAA → Tonemap → Present      │
              └──────────┬───────┘
                         │
                         ▼
                    ┌──────────┐
                    │  Canvas  │
                    │ (화면)    │
                    └──────────┘
```

### 5.3 Config 중심 데이터 흐름

```
                          ┌─────────────────────────┐
                          │     Inspector Panel      │
                          │  (사용자 입력 UI)          │
                          └────────────┬────────────┘
                                       │ Config.set(path, value)
                                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                        Config (싱글턴)                            │
│                                                                  │
│  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ terrain  │  │ rendering  │  │  camera  │  │ environment  │  │
│  └──────────┘  └────────────┘  └──────────┘  └───────────────┘  │
│                                                                  │
│  onChange() ──→ 핸들러 목록    isDirty() ──→ dirtyGroups Set      │
│  scheduleSave() ──→ localStorage (500ms debounce)                │
└────────┬──────────┬────────────┬──────────────┬──────────────────┘
         │          │            │              │
    ┌────▼──┐  ┌───▼─────┐  ┌──▼──────┐  ┌───▼────────────┐
    │Terrain│  │Deferred │  │FlyCamera│  │DayNightCycle  │
    │Gener. │  │Pipeline │  │         │  │WeatherSystem  │
    │Cave   │  │PostProc │  └─────────┘  └───────────────┘
    │Ore    │  │ShadowMap│
    │Tree   │  │SSAO     │
    │Water  │  │TAA      │
    └───────┘  └─────────┘

    읽는 시점:          읽는 시점:         읽는 시점:        읽는 시점:
    regenerate()시     매 프레임          매 프레임         매 프레임
    (생성자에서 읽음)   render time        update(dt)       update(dt)
```

### 5.4 읽기 패턴 요약

| 소비자 | 읽는 Config 경로 | 시점 |
|--------|------------------|------|
| TerrainGenerator | `terrain.noise.*`, `terrain.height.*`, `terrain.biomes.*` | 생성자 (regenerate 시 새 인스턴스) |
| CaveGenerator | `terrain.caves.*` | 생성자 |
| OreGenerator | `terrain.ores.*` | 생성자 |
| TreeGenerator | `terrain.trees.*` | 생성자 |
| WaterSimulator | `terrain.height.seaLevel` | 생성자 |
| ChunkManager | `rendering.general.renderDistance`, `chunksPerFrame` | onChange + 매 프레임 |
| FlyCamera | `camera.*` | 매 프레임 `update(dt)` |
| DeferredPipeline/PostProcess | `rendering.bloom.*`, `rendering.autoExposure.*` | `updateBloomParams()` 호출 시 |
| ShadowMap | `rendering.shadows.*` | 렌더 시 |
| SSAO | `rendering.ssao.*` | 렌더 시 |
| DayNightCycle | `environment.dayDurationSeconds` | 매 프레임 `update(dt)` |
| main.ts | `rendering.fog.*` | 매 프레임 (안개 거리 계산) |

> **핵심 설계 원칙**: terrain 설정은 **생성자에서 읽으므로** `regenerate()` 호출 시 새 생성자가 만들어지면서 최신 Config 값을 자동으로 반영한다. 반면 렌더링/카메라/환경 설정은 **매 프레임 Config.data에서 직접 읽으므로** 설정 변경이 즉시 반영된다.

---

> **다음 Phase**: Phase 2에서는 렌더링 파이프라인(DeferredPipeline)의 내부 구조 -- G-Buffer, Shadow, SSAO, Lighting, Post-processing 각 패스의 동작을 상세히 다룰 예정이다.
