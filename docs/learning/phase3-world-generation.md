# Phase 3: 월드 생성 (World Generation)

> **대상 파일:** `src/terrain/`, `src/meshing/MeshBuilder.ts`, `src/noise/`
>
> 이 문서는 WebGPU 복셀 엔진의 월드 생성 파이프라인 전체를 다룬다.
> 청크 구조부터 노이즈, 바이옴, 지형, 동굴, 광석, 나무, 식물, 물 시뮬레이션,
> 그리고 최종 메시 빌딩까지 **실제 코드 기반**으로 설명한다.

---

## 1. 월드 구조 개요

### 1.1 청크 기반 월드

월드는 **16 x 128 x 16** 크기의 청크(Chunk) 단위로 분할된다.
각 청크는 X(폭) x Y(높이) x Z(깊이) 복셀 격자이며, 하나의 `Uint8Array`에 모든 블록 데이터를 저장한다.

```
src/constants.ts
────────────────
CHUNK_WIDTH  = 16
CHUNK_HEIGHT = 128
CHUNK_DEPTH  = 16
CHUNK_TOTAL_BLOCKS = 16 * 128 * 16 = 32,768
```

| 항목 | 값 |
|------|-----|
| 청크 크기 | 16 x 128 x 16 복셀 |
| 블록 데이터 타입 | `Uint8Array` (1 byte/block) |
| 청크당 메모리 | 32,768 bytes (= 32 KB) |
| 최대 블록 ID | 255 (0 = AIR) |

### 1.2 블록 인덱스 계산

`src/terrain/Chunk.ts`의 `Chunk.index()` 정적 메서드가 3D 좌표를 1D 배열 인덱스로 변환한다:

```typescript
// src/terrain/Chunk.ts
static index(x: number, y: number, z: number): number {
  return x + (y * CHUNK_WIDTH) + (z * CHUNK_WIDTH * CHUNK_HEIGHT);
}
```

**레이아웃 순서:** X가 가장 빠르게 변하고, Y가 중간, Z가 가장 느리게 변한다.
이는 Y 컬럼 단위 접근에 최적화된 배치로, 지형 생성 시 `generateColumn()`이 (x, z) 좌표를 고정하고 전체 Y 범위를 순회하는 패턴과 일치한다.

### 1.3 청크 좌표 vs 월드 좌표

```
월드 좌표 (worldX, worldZ)  →  청크 좌표 (chunkX, chunkZ)
────────────────────────────────────────────────────────────
chunkX = Math.floor(worldX / CHUNK_WIDTH)
chunkZ = Math.floor(worldZ / CHUNK_DEPTH)

청크 좌표  →  월드 오프셋
────────────────────────
worldOffsetX = chunkX * CHUNK_WIDTH
worldOffsetZ = chunkZ * CHUNK_DEPTH
```

`Chunk` 클래스는 `worldOffsetX`와 `worldOffsetZ`를 getter로 제공한다:

```typescript
// src/terrain/Chunk.ts
get worldOffsetX(): number { return this.chunkX * CHUNK_WIDTH; }
get worldOffsetZ(): number { return this.chunkZ * CHUNK_DEPTH; }
```

### 1.4 청크 GPU 리소스

각 청크는 3세트의 GPU 버퍼를 보유한다:

| 메시 종류 | Vertex Buffer | Index Buffer | 용도 |
|-----------|---------------|--------------|------|
| 솔리드 | `vertexBuffer` | `indexBuffer` | 불투명 블록 (STONE, DIRT 등) |
| 물 | `waterVertexBuffer` | `waterIndexBuffer` | 물 표면 (forward pass) |
| 식물 | `vegVertexBuffer` | `vegIndexBuffer` | 크로스 메시 (cullMode: 'none') |

---

## 2. 블록 타입 (BlockTypes.ts)

> **파일:** `src/terrain/BlockTypes.ts`

### 2.1 블록 타입 열거형

`BlockType`은 `const enum`으로 정의되며, 컴파일 시 숫자 리터럴로 인라인된다:

| ID | 이름 | 카테고리 |
|----|------|----------|
| 0 | `AIR` | 공기 |
| 1 | `STONE` | 지형 |
| 2 | `DIRT` | 지형 |
| 3 | `GRASS_BLOCK` | 지형 |
| 4 | `BEDROCK` | 지형 |
| 10 | `SAND` | 모래/자갈 |
| 11 | `SANDSTONE` | 모래/자갈 |
| 12 | `GRAVEL` | 모래/자갈 |
| 13 | `CLAY` | 모래/자갈 |
| 20 | `WATER` | 유체 |
| 21 | `LAVA` | 유체 |
| 22 | `FLOWING_WATER` | 유체 |
| 30 | `SNOW` | 눈/얼음 |
| 31 | `ICE` | 눈/얼음 |
| 40 | `COAL_ORE` | 광석 |
| 41 | `IRON_ORE` | 광석 |
| 42 | `GOLD_ORE` | 광석 |
| 43 | `DIAMOND_ORE` | 광석 |
| 50 | `LOG` | 나무 |
| 51 | `LEAVES` | 나무 |
| 60 | `COBBLESTONE` | 돌 변형 |
| 61 | `MOSSY_COBBLESTONE` | 돌 변형 |
| 70 | `SPAWNER` | 특수 |
| 71 | `CHEST` | 특수 |
| 80 | `TALL_GRASS` | 식물 |
| 81 | `POPPY` | 식물 |
| 82 | `DANDELION` | 식물 |

### 2.2 블록 속성 (BlockData)

각 블록은 `BlockData` 인터페이스로 정의된 속성을 가진다:

```typescript
// src/terrain/BlockTypes.ts
export interface BlockData {
  isSolid: boolean;
  color: [number, number, number, number]; // RGBA 0-255
  roughness: number;  // 0.0 (smooth) - 1.0 (rough)
  metallic: number;   // 0.0 (dielectric) - 1.0 (metal)
  emissive: number;   // 0.0 - 1.0 자체 발광 강도
}
```

**주요 속성 분류:**

| 블록 | isSolid | roughness | metallic | emissive | 특이사항 |
|------|---------|-----------|----------|----------|----------|
| WATER | `false` | 0.10 | 0.0 | 0.0 | 비고체, 별도 메시 |
| LAVA | `true` | 0.90 | 0.0 | **1.0** | 최대 발광 |
| DIAMOND_ORE | `true` | 0.20 | 0.1 | **0.15** | 미세 발광 |
| GOLD_ORE | `true` | 0.50 | **0.7** | 0.0 | 금속성 |
| ICE | `true` | 0.15 | 0.0 | 0.0 | translucent |
| TALL_GRASS | `false` | 0.95 | 0.0 | 0.0 | cross-mesh |
| LEAVES | `true` | 0.85 | 0.0 | 0.0 | cutout (alpha) |

### 2.3 블록 분류 헬퍼 함수

```typescript
isBlockSolid(type)      // isSolid === true
isBlockAir(type)        // type === AIR (0)
isBlockWater(type)      // WATER 또는 FLOWING_WATER
isBlockCutout(type)     // LEAVES, TALL_GRASS, POPPY, DANDELION
isBlockCrossMesh(type)  // TALL_GRASS, POPPY, DANDELION
isBlockTranslucent(type) // ICE
```

### 2.4 텍스처 UV 매핑

블록별 텍스처 UV 좌표는 **블록 ID를 그대로 타일 인덱스로 사용**한다.
16x16 아틀라스에서의 좌표:

```typescript
// src/meshing/MeshBuilder.ts
const uvSize = 1.0 / ATLAS_TILES;  // 1/16 = 0.0625
const tileIndex = blockType;
const tileU = (tileIndex % ATLAS_TILES) * uvSize;
const tileV = Math.floor(tileIndex / ATLAS_TILES) * uvSize;
```

예: `GRASS_BLOCK(3)` → `tileU = 3/16`, `tileV = 0/16`
예: `COAL_ORE(40)` → `tileU = 8/16`, `tileV = 2/16`

---

## 3. 바이옴 시스템 (BiomeTypes.ts + TerrainGenerator.ts)

> **파일:** `src/terrain/BiomeTypes.ts`, `src/terrain/TerrainGenerator.ts`

### 3.1 6가지 바이옴

```typescript
// src/terrain/BiomeTypes.ts
export const enum BiomeType {
  PLAINS    = 0,  // 평원
  FOREST    = 1,  // 숲
  DESERT    = 2,  // 사막
  TUNDRA    = 3,  // 툰드라
  MOUNTAINS = 4,  // 산악
  OCEAN     = 5,  // 해양
}
```

### 3.2 바이옴 파라미터

각 바이옴은 3D 파라미터 공간 `(temperature, humidity, continentalness)` 에서 고유한 좌표를 가진다:

| 바이옴 | temperature | humidity | continentalness |
|--------|-------------|----------|-----------------|
| OCEAN | 0.0 | 0.5 | **-0.7** |
| PLAINS | 0.3 | 0.0 | 0.2 |
| FOREST | 0.2 | **0.6** | 0.3 |
| DESERT | **0.8** | **-0.7** | 0.4 |
| TUNDRA | **-0.8** | 0.0 | 0.3 |
| MOUNTAINS | -0.2 | 0.2 | **0.8** |

파라미터 범위는 모두 `[-1, 1]` 이다.

### 3.3 바이옴 선택 알고리즘

`TerrainGenerator.getBiome()`은 다음 절차를 따른다:

1. **해양 강제 판정:** `continentalness < oceanThreshold(0.3)` 이면 즉시 `OCEAN` 반환
2. **노이즈 샘플링:** temperature, humidity 노이즈를 `[0,1]`에서 `[-1,1]`로 변환
3. **유클리드 최근접:** 6개 바이옴의 파라미터 좌표와의 3D 거리 계산, 가장 가까운 바이옴 선택

```typescript
// src/terrain/TerrainGenerator.ts (getBiome 핵심 로직)
const t = temperature * 2 - 1;    // [0,1] → [-1,1]
const h = humidity * 2 - 1;
const cont = continentalness * 2 - 1;

let bestBiome = BiomeType.PLAINS;
let bestDist = Infinity;

for (const entry of BIOME_PARAMS) {
  const dt = t - entry.params.temperature;
  const dh = h - entry.params.humidity;
  const dc = cont - entry.params.continentalness;
  const dist = dt * dt + dh * dh + dc * dc;  // 유클리드 거리 제곱
  if (dist < bestDist) {
    bestDist = dist;
    bestBiome = entry.biome;
  }
}
```

### 3.4 Continentalness → 높이 스플라인

`continentalness` 값 `[0, 1]`을 5단계 구간의 구간 선형(piecewise linear) 함수로 높이에 매핑한다:

```typescript
// src/terrain/TerrainGenerator.ts
private continentalnessToHeight(c: number): number {
  if (c < 0.3)       return 30 + (c / 0.3) * 18;              // 심해→얕은바다: 30~48
  else if (c < 0.45) return 48 + ((c - 0.3) / 0.15) * 4;      // 해안 전이: 48~52
  else if (c < 0.7)  return 52 + ((c - 0.45) / 0.25) * 13;    // 평원/저지대: 52~65
  else if (c < 0.85) return 65 + ((c - 0.7) / 0.15) * 15;     // 언덕: 65~80
  else               return 80 + ((c - 0.85) / 0.15) * 20;    // 산악: 80~100
}
```

| Continentalness 구간 | 지형 유형 | 높이 범위 |
|----------------------|-----------|-----------|
| `0.00 ~ 0.30` | 심해 → 얕은 바다 | 30 ~ 48 |
| `0.30 ~ 0.45` | 해안 전이대 | 48 ~ 52 |
| `0.45 ~ 0.70` | 평원 / 저지대 | 52 ~ 65 |
| `0.70 ~ 0.85` | 언덕 | 65 ~ 80 |
| `0.85 ~ 1.00` | 산악 | 80 ~ 100 |

`seaLevel = 50`이므로, continentalness < ~0.35 부근이 수면 아래가 된다.

### 3.5 바이옴별 표면/지하 블록

| 바이옴 | 표면 블록 | 지하 블록 | 특이사항 |
|--------|-----------|-----------|----------|
| PLAINS | GRASS_BLOCK | DIRT | - |
| FOREST | GRASS_BLOCK | DIRT | - |
| DESERT | SAND | SANDSTONE | - |
| TUNDRA | SNOW | DIRT | - |
| MOUNTAINS | STONE / GRASS_BLOCK | DIRT | 높이 85 이상이면 STONE |
| OCEAN | SAND | SAND | 수면 아래는 항상 SAND |

---

## 4. 노이즈 시스템 (SimplexNoise.ts + SeededRandom.ts)

> **파일:** `src/noise/SimplexNoise.ts`, `src/noise/SeededRandom.ts`

### 4.1 Simplex Noise 구현

**프로젝트 정책: Simplex Noise만 사용 (Value Noise 금지)**

`SimplexNoise` 클래스는 Stefan Gustavson의 Simplex noise 알고리즘을 시드 기반으로 구현한다.

#### 기울기 테이블

```typescript
// 2D: 12방향 (실제로는 8방향 + 4방향 반복)
const GRAD2 = [
  1, 1, -1, 1, 1, -1, -1, -1,
  1, 0, -1, 0, 0, 1, 0, -1,
  1, 0, -1, 0, 0, 1, 0, -1,
];

// 3D: 큐브의 12개 엣지 방향
const GRAD3 = [
  1, 1, 0,  -1, 1, 0,  1, -1, 0,  -1, -1, 0,
  1, 0, 1,  -1, 0, 1,  1, 0, -1,  -1, 0, -1,
  0, 1, 1,   0, -1, 1,  0, 1, -1,   0, -1, -1,
];
```

#### 스큐/언스큐 상수

```typescript
// 2D
const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);  // ≈ 0.3660
const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;  // ≈ 0.2113

// 3D
const F3 = 1.0 / 3.0;   // ≈ 0.3333
const G3 = 1.0 / 6.0;   // ≈ 0.1667
```

#### 기여 계산 (2D 예시)

```typescript
// src/noise/SimplexNoise.ts - noise2D 핵심
let t0 = 0.5 - x0 * x0 - y0 * y0;
if (t0 >= 0) {
  const gi0 = pm12[p[ii + p[jj]] & 255] * 2;
  t0 *= t0;
  n0 = t0 * t0 * (GRAD2[gi0] * x0 + GRAD2[gi0 + 1] * y0);
}
// ... n1, n2 도 동일 패턴
return (70.0 * (n0 + n1 + n2) + 1.0) * 0.5;  // [-1,1] → [0,1]
```

2D는 삼각형 simplex의 3개 꼭짓점에서 기여를 합산하고, 3D는 4면체의 4개 꼭짓점에서 합산한다.

### 4.2 시드 기반 순열 테이블

```typescript
// src/noise/SimplexNoise.ts
private static generatePermutation(seed: number) {
  const source = new Int32Array(256);
  for (let i = 0; i < 256; i++) source[i] = i;

  // Fisher-Yates 셔플 (LCG 난수 사용)
  let s = seed | 0;
  const rand = (): number => {
    s = Math.imul(s, 1103515245) + 12345;
    return ((s >>> 16) & 0x7FFF);
  };

  for (let i = 255; i > 0; i--) {
    const j = rand() % (i + 1);
    [source[i], source[j]] = [source[j], source[i]];
  }

  // 512 크기 배열로 확장 (모듈로 연산 제거 최적화)
  const perm = new Int32Array(512);
  const permMod12 = new Int32Array(512);
  for (let i = 0; i < 512; i++) {
    perm[i] = source[i & 255];
    permMod12[i] = perm[i] % 12;
  }
  return { perm, permMod12 };
}
```

**핵심:** 동일 시드 → 동일 순열 테이블 → 동일 노이즈 패턴 = **결정론적 월드 생성**

### 4.3 FBM (Fractal Brownian Motion)

`FractalNoise` 클래스가 여러 옥타브의 Simplex noise를 합산한다:

```typescript
// src/noise/SimplexNoise.ts
export class FractalNoise {
  sample(x: number, y: number): number {
    let total = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < this.octaves; i++) {
      const sx = (x / this.scale) * frequency;
      const sy = (y / this.scale) * frequency;
      total += this.noise.noise2D(sx, sy) * amplitude;
      maxValue += amplitude;
      amplitude *= this.persistence;   // 진폭 감쇠
      frequency *= this.lacunarity;    // 주파수 증가
    }

    return total / maxValue;  // 정규화 [0, 1]
  }
}
```

| 파라미터 | 기본값 | 설명 |
|----------|--------|------|
| `octaves` | 4 | 합산할 노이즈 레이어 수 |
| `persistence` | 0.5 | 옥타브 간 진폭 감쇠율 |
| `lacunarity` | 2.0 | 옥타브 간 주파수 배수 |
| `scale` | 가변 | 입력 좌표 스케일링 |

### 4.4 SeededRandom: Mulberry32 PRNG

```typescript
// src/noise/SeededRandom.ts
export class SeededRandom {
  private state: number;

  next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6D2B79F5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;  // [0, 1)
  }

  nextInt(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min));
  }
}
```

Mulberry32는 32비트 정수 연산 기반의 경량 PRNG로, `Math.imul()`과 비트 연산만 사용하여 빠르다. 동일 시드에서 동일 시퀀스를 보장한다.

### 4.5 노이즈 인스턴스별 역할

`TerrainGenerator`는 4개의 독립적인 `FractalNoise` 인스턴스를 생성한다:

| 인스턴스 | 시드 오프셋 | 스케일 | 역할 |
|----------|------------|--------|------|
| `continentalnessNoise` | `seed` | 400.0 | 대륙성 → 기본 높이 결정 |
| `temperatureNoise` | `seed + 1000` | 200.0 | 온도 → 바이옴 선택 |
| `humidityNoise` | `seed + 2000` | 200.0 | 습도 → 바이옴 선택 |
| `heightVariationNoise` | `seed + 3000` | 30.0 | 지형 세부 높이 변화 |

시드를 오프셋하여 각 노이즈 필드가 서로 독립적인 패턴을 가지도록 한다.

---

## 5. 지형 생성 (TerrainGenerator.ts)

> **파일:** `src/terrain/TerrainGenerator.ts`

### 5.1 컬럼 기반 생성

`generate()` 메서드는 청크 내 모든 (x, z) 위치에 대해 `generateColumn()`을 호출한다:

```typescript
// src/terrain/TerrainGenerator.ts
generate(chunk: Chunk): void {
  for (let x = 0; x < CHUNK_WIDTH; x++) {
    for (let z = 0; z < CHUNK_DEPTH; z++) {
      const worldX = chunk.worldOffsetX + x;
      const worldZ = chunk.worldOffsetZ + z;
      this.generateColumn(chunk, x, z, worldX, worldZ);
    }
  }
}
```

256개 컬럼 (16 x 16) x 128 블록 높이 = 32,768 블록 설정.

### 5.2 높이 계산

```typescript
private generateColumn(chunk, localX, localZ, worldX, worldZ): void {
  const continentalness = this.continentalnessNoise.sample(worldX, worldZ);
  const heightVariation = this.heightVariationNoise.sample(worldX, worldZ);

  const baseHeight = this.continentalnessToHeight(continentalness);
  let height = Math.floor(baseHeight + (heightVariation - 0.5) * 10);
  height = Math.max(1, Math.min(CHUNK_HEIGHT - 1, height));
  // ...
}
```

**높이 결정 공식:**

```
height = floor(continentalnessToHeight(c) + (heightVariation - 0.5) * 10)
```

- `continentalnessToHeight(c)`: 30 ~ 100 범위의 기본 높이
- `(heightVariation - 0.5) * 10`: -5 ~ +5 범위의 세부 변화
- 최종 높이: `[1, 127]`로 클램핑

### 5.3 블록 배치

각 컬럼의 모든 Y 레벨에 블록을 배치한다:

```typescript
private getBlockType(y: number, surfaceHeight: number, biome: BiomeType): number {
  const seaLevel = Config.data.terrain.height.seaLevel;   // 기본: 50
  const dirtDepth = Config.data.terrain.height.dirtLayerDepth; // 기본: 4

  if (y === 0) return BlockType.BEDROCK;              // 최하층: 기반암

  if (y > surfaceHeight) {
    if (y <= seaLevel) return BlockType.WATER;          // 수면 이하 빈공간: 물
    return BlockType.AIR;                               // 지상: 공기
  }

  if (y === surfaceHeight) return this.getSurfaceBlock(biome, surfaceHeight);
  if (y >= surfaceHeight - dirtDepth) return this.getSubSurfaceBlock(biome);
  return BlockType.STONE;                              // 깊은 곳: 돌
}
```

**컬럼 단면 (예: PLAINS, surfaceHeight=55, seaLevel=50):**

```
Y 레벨    블록
────────────────────
127       AIR
 ...      AIR
 56       AIR
 55       GRASS_BLOCK  ← 표면
 54       DIRT         ← dirtLayerDepth(4)
 53       DIRT
 52       DIRT
 51       DIRT
 50       STONE
 ...      STONE
  1       STONE
  0       BEDROCK      ← 최하층
```

---

## 6. 동굴 생성 (CaveGenerator.ts)

> **파일:** `src/terrain/CaveGenerator.ts`

### 6.1 웜(Worm) 알고리즘

동굴 생성은 3D 공간에서 "웜"이 이동하며 경로를 파내는 방식이다.

```typescript
// src/terrain/CaveGenerator.ts
generate(chunk: Chunk): void {
  const caves = Config.data.terrain.caves;
  const chunkSeed = (this.seed ^ (chunk.chunkX * 73856093) ^ (chunk.chunkZ * 19349663)) | 0;
  const rng = new SeededRandom(chunkSeed);

  for (let i = 0; i < caves.count; i++) {  // 기본 8회
    this.generateWorm(chunk, rng);
  }
}
```

청크별 시드는 월드 시드와 청크 좌표의 XOR 해시로 결정된다.

### 6.2 웜 파라미터

| 파라미터 | 기본값 | 설명 |
|----------|--------|------|
| `count` | 8 | 청크당 웜 수 |
| `minLength` | 50 | 최소 스텝 수 |
| `maxLength` | 150 | 최대 스텝 수 |
| `minRadius` | 1.5 | 최소 카빙 반지름 |
| `maxRadius` | 4.0 | 최대 카빙 반지름 |
| `minY` | 10 | 최소 Y 좌표 |
| `maxY` | 60 | 최대 Y 좌표 |

### 6.3 사인-노이즈 방향성

웜의 이동 방향은 Simplex noise로 결정되어 자연스러운 곡선 경로를 만든다:

```typescript
// src/terrain/CaveGenerator.ts
private generateWorm(chunk: Chunk, rng: SeededRandom): void {
  let x = rng.nextInt(0, CHUNK_WIDTH);
  let y = rng.nextInt(caves.minY, caves.maxY);
  let z = rng.nextInt(0, CHUNK_DEPTH);
  const length = rng.nextInt(caves.minLength, caves.maxLength);
  const noiseOffset = rng.next() * 1000;

  for (let step = 0; step < length; step++) {
    const t = step * 0.1 + noiseOffset;

    // 노이즈 기반 반지름
    const radius = caves.minRadius + (caves.maxRadius - caves.minRadius)
                   * this.radiusNoise.noise2D(t, 0);
    this.carveSphere(chunk, x, y, z, radius);

    // 노이즈 기반 방향
    const angleXZ = this.dirNoiseX.noise2D(t, 0) * Math.PI * 2;
    const angleY = (this.dirNoiseY.noise2D(0, t) - 0.5) * Math.PI * 0.5;

    x += Math.cos(angleXZ) * Math.cos(angleY);
    y += Math.sin(angleY) * 0.3;              // Y 변화량 감쇠 (0.3배)
    z += Math.sin(angleXZ) * Math.cos(angleY);

    y = Math.max(caves.minY, Math.min(caves.maxY, y));  // Y 클램핑
  }
}
```

**핵심 특성:**
- XZ 평면의 각도 `angleXZ`: `[0, 2PI]` 범위로 모든 수평 방향 가능
- Y 축 각도 `angleY`: `[-PI/4, PI/4]` 범위로 수직 변화 제한
- Y 이동량에 `* 0.3` 감쇠를 적용하여 수평 동굴을 선호

### 6.4 구(Sphere) 카빙

각 스텝에서 현재 위치 주변을 구 형태로 파낸다:

```typescript
private carveSphere(chunk, cx, cy, cz, radius): void {
  const r2 = radius * radius;
  for (let x = floor(cx-r); x <= ceil(cx+r); x++) {
    for (let y = floor(cy-r); y <= ceil(cy+r); y++) {
      for (let z = floor(cz-r); z <= ceil(cz+r); z++) {
        if (!chunk.isInBounds(x, y, z) || y <= 0) continue;
        const dx = x - cx, dy = y - cy, dz = z - cz;
        if (dx*dx + dy*dy + dz*dz <= r2) {
          const cur = chunk.getBlock(x, y, z);
          // BEDROCK, WATER 보존
          if (cur !== BlockType.BEDROCK && cur !== BlockType.WATER
              && cur !== BlockType.FLOWING_WATER) {
            chunk.setBlock(x, y, z, BlockType.AIR);
          }
        }
      }
    }
  }
}
```

**보존 규칙:**
- `BEDROCK` (y=0): 절대 파내지 않음
- `WATER` / `FLOWING_WATER`: 물 블록 보존 (나중에 WaterSimulator가 처리)
- `y <= 0`: 바닥 레이어 보호

---

## 7. 광석 생성 (OreGenerator.ts)

> **파일:** `src/terrain/OreGenerator.ts`

### 7.1 광석 타입별 설정

| 광석 | BlockType | minY | maxY | attempts | veinSize |
|------|-----------|------|------|----------|----------|
| Coal (석탄) | `COAL_ORE(40)` | 5 | 128 | 20 | 8 |
| Iron (철) | `IRON_ORE(41)` | 5 | 64 | 20 | 6 |
| Gold (금) | `GOLD_ORE(42)` | 5 | 32 | 2 | 5 |
| Diamond (다이아몬드) | `DIAMOND_ORE(43)` | 5 | 16 | 1 | 4 |

**희귀도 설계 원칙:**
- 높은 등급의 광석일수록 → 낮은 maxY, 적은 attempts, 작은 veinSize
- 석탄은 거의 모든 높이에서 풍부하게 생성
- 다이아몬드는 Y=5~16에서 청크당 1회만 시도

### 7.2 생성 순서: 광석 → 동굴

```typescript
// src/terrain/ChunkManager.ts - update() 내
this.terrainGen.generate(entry.chunk);
this.oreGen.generate(entry.chunk);      // 광석 먼저!
this.caveGen.generate(entry.chunk);     // 동굴은 나중에
```

**이유:** 광석을 먼저 배치하고 동굴을 나중에 파면, 동굴 벽면에 광석이 자연스럽게 노출된다.

### 7.3 Random Walk 맥(Vein) 알고리즘

```typescript
// src/terrain/OreGenerator.ts
private generateVein(chunk, sx, sy, sz, oreType, size, rng, minY, maxY): void {
  let x = sx, y = sy, z = sz;
  chunk.setBlock(x, y, z, oreType);     // 시작점 배치

  for (let i = 1; i < size; i++) {
    x += rng.nextInt(-1, 2);            // -1, 0, 1 중 랜덤
    y += rng.nextInt(-1, 2);
    z += rng.nextInt(-1, 2);

    if (!chunk.isInBounds(x, y, z)) continue;
    if (y < minY || y >= maxY) continue;
    if (chunk.getBlock(x, y, z) === BlockType.STONE) {
      chunk.setBlock(x, y, z, oreType);
    }
  }
}
```

**Random walk 특성:**
- 각 스텝에서 X, Y, Z 각각 {-1, 0, +1} 중 하나를 선택
- `STONE` 블록만 광석으로 교체 (이미 다른 광석이나 DIRT 등은 덮어쓰지 않음)
- veinSize만큼 반복하여 불규칙한 광맥 형태를 생성

### 7.4 생성 시도 (Attempts)

```typescript
private generateOre(chunk, settings, rng): void {
  for (let i = 0; i < settings.attemptsPerChunk; i++) {
    const x = rng.nextInt(0, CHUNK_WIDTH);
    const y = rng.nextInt(settings.minY, Math.min(settings.maxY, CHUNK_HEIGHT));
    const z = rng.nextInt(0, CHUNK_DEPTH);

    if (chunk.getBlock(x, y, z) !== BlockType.STONE) continue;  // STONE이 아니면 스킵
    this.generateVein(chunk, x, y, z, ...);
  }
}
```

시작점이 `STONE`이 아니면 (예: AIR, DIRT) 해당 시도는 건너뛴다. 따라서 실제 생성된 맥의 수는 `attempts`보다 적을 수 있다.

---

## 8. 나무 생성 (TreeGenerator.ts)

> **파일:** `src/terrain/TreeGenerator.ts`

### 8.1 바이옴별 나무 밀도

```typescript
// src/terrain/TreeGenerator.ts
private getMaxTreesForChunk(chunk, rng): number {
  const perChunk = Config.data.terrain.trees.perChunk; // 기본: 3

  switch (biome) {
    case BiomeType.FOREST:    return perChunk * 3;  // 9그루 (숲은 3배)
    case BiomeType.PLAINS:    return perChunk;       // 3그루
    case BiomeType.TUNDRA:    return perChunk >> 1;  // 1그루 (반으로)
    case BiomeType.MOUNTAINS: return perChunk >> 1;  // 1그루
    case BiomeType.DESERT:    return 0;              // 없음
    case BiomeType.OCEAN:     return 0;              // 없음
  }
}
```

### 8.2 배치 조건

나무를 배치하기 전 두 가지 조건을 검사한다:

**1. 표면 블록 검사 (`findSurfaceY`):**
청크의 최상단(Y=127)부터 아래로 스캔하여 `GRASS_BLOCK`, `DIRT`, `SNOW` 중 하나를 찾는다.

**2. 배치 가능 여부 (`canPlaceTree`):**
```typescript
private canPlaceTree(chunk, x, surfaceY, z): boolean {
  const surfaceBlock = chunk.getBlock(x, surfaceY, z);
  if (surfaceBlock !== BlockType.GRASS_BLOCK && surfaceBlock !== BlockType.SNOW) return false;

  // 트렁크 위 8블록이 모두 AIR여야 함
  for (let y = surfaceY + 1; y < surfaceY + 8 && y < CHUNK_HEIGHT; y++) {
    if (chunk.getBlock(x, y, z) !== BlockType.AIR) return false;
  }
  return true;
}
```

추가로 바이옴별 확률 검사도 수행한다:

| 바이옴 | 배치 확률 |
|--------|-----------|
| DESERT | 0% (불가) |
| OCEAN | 0% (불가) |
| TUNDRA | 50% |
| MOUNTAINS | 70% |
| 기타 | 100% |

### 8.3 트렁크 생성

```typescript
private placeOakTree(chunk, x, baseY, z, trunkHeight, rng): void {
  chunk.setBlock(x, baseY - 1, z, BlockType.DIRT);  // 뿌리 아래를 DIRT로

  for (let y = 0; y < trunkHeight; y++) {
    chunk.setBlock(x, baseY + y, z, BlockType.LOG);  // LOG 블록 수직 배치
  }
  // ...
}
```

- 트렁크 높이: 4 ~ 6 블록 (랜덤)
- 나무 아래 블록을 `DIRT`로 교체 (GRASS_BLOCK이 LOG 아래 보이지 않도록)

### 8.4 캐노피: 3층 리프 구조

```
레이어    반경    형태
──────────────────────────────────
layer 3   top     중앙 + 4방향(감쇠)
layer 2   r=1     3x3 - 코너 감쇠
layer 1   r=2     5x5 - 코너 20% 감쇠
layer 0   r=2     5x5 - 코너 20% 감쇠
```

```typescript
const leafBaseY = baseY + trunkHeight - 2;
this.placeLeafLayer(chunk, x, leafBaseY,     z, 2, rng, leafDecay);  // layer 0
this.placeLeafLayer(chunk, x, leafBaseY + 1, z, 2, rng, leafDecay);  // layer 1
this.placeLeafLayer(chunk, x, leafBaseY + 2, z, 1, rng, leafDecay);  // layer 2
this.placeLeafLayerTop(chunk, x, leafBaseY + 3, z, rng, leafDecay);  // layer 3
```

**코너 감쇠:**
```typescript
// 4 코너에서 leafDecay(기본 0.2) 확률로 리프 생략
if (Math.abs(dx) === radius && Math.abs(dz) === radius) {
  if (rng.next() < leafDecay) continue;  // 20% 확률로 빠짐
}
```

**최상단 (layer 3):**
중앙 1개 + 동서남북 각각 `1 - leafDecay = 80%` 확률로 배치.

### 8.5 나뭇잎 블록 특성

- `LEAVES(51)`: `isSolid = true`, `isBlockCutout() = true`
- 불투명 블록처럼 다른 면을 가리지만, cutout 블록이므로 **atlas alpha 기반 discard** 적용
- Cutout-cutout 인접면 (나뭇잎-나뭇잎): `face % 2 === 0`인 면만 렌더링하여 z-fighting 방지

---

## 9. 식물 생성 (VegetationGenerator.ts)

> **파일:** `src/terrain/VegetationGenerator.ts`

### 9.1 크로스 메시 식물

식물 블록은 일반 큐브가 아닌 **X자형 2-quad** 크로스 메시로 렌더링된다:

| ID | 블록 | 설명 |
|----|------|------|
| 80 | `TALL_GRASS` | 키 큰 풀 |
| 81 | `POPPY` | 양귀비 |
| 82 | `DANDELION` | 민들레 |

모두 `isSolid = false`, `isBlockCrossMesh() = true` 이다.

### 9.2 밀도 30%, 바이옴 필터링

```typescript
// src/terrain/VegetationGenerator.ts
generate(chunk: Chunk): void {
  for (let x = 0; x < CHUNK_WIDTH; x++) {
    for (let z = 0; z < CHUNK_DEPTH; z++) {
      const surfaceY = this.findGrassSurface(chunk, x, z);
      if (surfaceY < 0) continue;                      // GRASS_BLOCK 없으면 스킵
      if (surfaceY + 1 >= CHUNK_HEIGHT) continue;

      if (!this.canPlaceVegetation(worldX, worldZ, surfaceY)) continue;
      if (rng.next() > 0.30) continue;                 // 30% 밀도
      if (chunk.getBlock(x, surfaceY + 1, z) !== BlockType.AIR) continue;

      // 분포 비율
      const roll = rng.next();
      if (roll < 0.80)      vegType = BlockType.TALL_GRASS;   // 80%
      else if (roll < 0.90) vegType = BlockType.POPPY;         // 10%
      else                  vegType = BlockType.DANDELION;     // 10%

      chunk.setBlock(x, surfaceY + 1, z, vegType);
    }
  }
}
```

**바이옴 필터링:**

| 바이옴 | 식물 생성 |
|--------|-----------|
| PLAINS | O |
| FOREST | O |
| DESERT | X |
| OCEAN | X |
| TUNDRA | X |
| MOUNTAINS | X |

### 9.3 분포 비율

```
TALL_GRASS : POPPY : DANDELION = 80% : 10% : 10%
```

풀이 압도적으로 많고, 꽃은 간헐적으로 배치되어 자연스러운 초원을 연출한다.

---

## 10. 물 시뮬레이션 (WaterSimulator.ts)

> **파일:** `src/terrain/WaterSimulator.ts`

### 10.1 4단계 시뮬레이션

물 시뮬레이션은 **정적** (프레임 단위 업데이트가 아님)이며, 청크 생성 시 한 번 실행된다.

```typescript
// src/terrain/WaterSimulator.ts
generate(chunk: Chunk): void {
  const seaLevel = Config.data.terrain.height.seaLevel;

  // Phase 1: 기존 물 제거
  // Phase 2: 컬럼 채움 (seaLevel까지)
  // Phase 3: BFS 범람 (동굴 내부 물 채움)
  // Phase 4: 폭포 캐스케이드 (FLOWING_WATER)
}
```

### Phase 1: 기존 물 제거

```typescript
for (let i = 0; i < blocks.length; i++) {
  if (blocks[i] === BlockType.WATER || blocks[i] === BlockType.FLOWING_WATER) {
    blocks[i] = BlockType.AIR;
  }
}
```

`TerrainGenerator`가 이미 `WATER`를 배치했지만, `WaterSimulator`는 이를 모두 제거하고 올바른 위치에 다시 배치한다.

### Phase 2: 컬럼 채움

```typescript
for (let x = 0; x < CHUNK_WIDTH; x++) {
  for (let z = 0; z < CHUNK_DEPTH; z++) {
    const surfaceY = this.findSolidSurface(chunk, x, z, seaLevel);
    if (surfaceY < seaLevel) {
      for (let y = surfaceY + 1; y <= seaLevel; y++) {
        if (chunk.getBlock(x, y, z) === BlockType.AIR) {
          chunk.setBlock(x, y, z, BlockType.WATER);
        }
      }
    }
  }
}
```

각 컬럼에서 고체 표면을 찾고, `seaLevel` 이하의 빈 공간을 `WATER`로 채운다.

### Phase 3: BFS 범람

바다에 연결된 동굴 내부 공간에 물이 채워진다:

```typescript
private floodFillBelow(chunk, seaLevel): void {
  const visited = new Uint8Array(CHUNK_WIDTH * CHUNK_HEIGHT * CHUNK_DEPTH);

  // 기존 WATER 블록 중 AIR 이웃이 있는 것을 BFS 시드로
  // BFS: 수평(4방향) + 아래 방향으로 확산
  // seaLevel 이하, y >= 1 범위에서만 작동
  // AIR 블록을 WATER로 교체
}
```

**BFS 방향:** 수평 4방향 + 아래 (위로는 흐르지 않음)

### Phase 4: 폭포 캐스케이드

```typescript
private cascadeFlow(chunk, seaLevel): void {
  // seaLevel에서 WATER인데 옆이 AIR인 위치 찾기
  for (const [dx, dz] of dirs) {
    if (chunk.getBlock(ax, seaLevel, az) === BlockType.AIR) {
      this.placeFlow(chunk, ax, seaLevel, az);
    }
  }
}
```

`placeFlow()`는 BFS로 `FLOWING_WATER`를 배치한다:

```typescript
private placeFlow(chunk, startX, startY, startZ): void {
  // BFS: 아래로 떨어지면 distance 리셋
  //       수평으로 퍼지면 distance 증가
  //       distance >= FLOW_DISTANCE(7)이면 수평 확산 중단
}
```

| 상수 | 값 | 설명 |
|------|-----|------|
| `FLOW_DISTANCE` | 7 | 수평 확산 최대 거리 |

**흐름 우선순위:**
1. 아래로 떨어지기 (distance 리셋 → 무한 낙하 가능)
2. 아래가 막혀 있으면 수평 확산 (최대 7블록)

### 10.2 Visited 추적

| 단계 | 추적 구조 | 이유 |
|------|-----------|------|
| Phase 3 (BFS 범람) | `Uint8Array` (32,768 bytes) | 고정 크기, 인덱스 직접 접근 |
| Phase 4 (폭포) | `Set<number>` | 동적 크기, 희소 방문 패턴 |

---

## 11. 청크 매니저 (ChunkManager.ts)

> **파일:** `src/terrain/ChunkManager.ts`

### 11.1 청크 상태 머신

```typescript
const enum ChunkState {
  QUEUED,       // 로딩 큐에 등록됨
  GENERATING,   // 지형 데이터 생성 중
  MESHING,      // 메시 빌딩 중
  READY,        // 렌더링 가능
}
```

```
QUEUED → GENERATING → MESHING → READY
```

### 11.2 스파이럴 로딩

```typescript
// src/terrain/ChunkManager.ts - update()
// 1) 카메라 위치에서 청크 좌표 계산
const camChunkX = Math.floor(cameraPos[0] / CHUNK_WIDTH);
const camChunkZ = Math.floor(cameraPos[2] / CHUNK_DEPTH);

// 2) renderDistance 내 모든 청크를 큐에 등록
for (let dx = -rd; dx <= rd; dx++) {
  for (let dz = -rd; dz <= rd; dz++) {
    if (dx * dx + dz * dz > rd * rd) continue;  // 원형 범위
    // ...
  }
}

// 3) 거리순 정렬 (가까운 것부터)
this.loadQueue.sort((a, b) => {
  const da = (a.cx - camChunkX) ** 2 + (a.cz - camChunkZ) ** 2;
  const db = (b.cx - camChunkX) ** 2 + (b.cz - camChunkZ) ** 2;
  return da - db;
});
```

원형 범위 검사 `dx*dx + dz*dz > rd*rd`로 정사각형이 아닌 원형 영역을 로딩한다.

### 11.3 chunksPerFrame 제한

```typescript
const chunksPerFrame = Config.data.rendering.general.chunksPerFrame; // 기본: 2

while (this.loadQueue.length > 0 && processed < chunksPerFrame) {
  // 청크 1개 생성 + 메시 빌드
  processed++;
}
```

프레임당 최대 2개 청크만 처리하여 프레임 드랍을 방지한다.

### 11.4 생성 파이프라인

한 청크의 완전한 생성 순서:

```
terrain → ores → caves → trees → vegetation → water
```

```typescript
// src/terrain/ChunkManager.ts
this.terrainGen.generate(entry.chunk);   // 1. 기본 지형
this.oreGen.generate(entry.chunk);       // 2. 광석 (STONE에 삽입)
this.caveGen.generate(entry.chunk);      // 3. 동굴 (광석 노출)
this.treeGen.generate(entry.chunk);      // 4. 나무
this.vegGen.generate(entry.chunk);       // 5. 식물
this.waterSim.generate(entry.chunk);     // 6. 물 시뮬레이션
```

**순서가 중요한 이유:**
- 광석 → 동굴: 동굴 벽에 광석이 노출됨
- 나무 → 식물: 나무가 먼저 배치되어 식물이 나무 밑에 겹치지 않음
- 물이 마지막: 모든 동굴과 지형이 완성된 후 정확한 물 배치

### 11.5 이웃 청크 일괄 리빌드

새 청크가 생성되면 인접 4개 청크의 메시를 다시 빌드해야 한다 (경계면 컬링이 변경되므로):

```typescript
const neighborsToRebuild = new Set<string>();

// 생성된 청크마다 4방향 이웃 추가
neighborsToRebuild.add(chunkKey(cx - 1, cz));
neighborsToRebuild.add(chunkKey(cx + 1, cz));
neighborsToRebuild.add(chunkKey(cx, cz - 1));
neighborsToRebuild.add(chunkKey(cx, cz + 1));

// Set 기반 중복 제거: 같은 이웃이 여러 번 추가되어도 한 번만 리빌드
for (const nKey of neighborsToRebuild) {
  if (generatedThisFrame.has(nKey)) continue;  // 이번 프레임에 생성된 것은 스킵
  // ...
  this.rebuildNeighborIfReady(ncx, ncz);
}
```

### 11.6 프러스텀 컬링

ViewProjection 행렬에서 6개 평면을 추출하여 AABB 테스트를 수행한다:

```typescript
// src/terrain/ChunkManager.ts
private extractFrustumPlanes(m: Float32Array): void {
  // Left:   m[3]+m[0],  m[7]+m[4],  m[11]+m[8],   m[15]+m[12]
  // Right:  m[3]-m[0],  m[7]-m[4],  m[11]-m[8],   m[15]-m[12]
  // Bottom: m[3]+m[1],  m[7]+m[5],  m[11]+m[9],   m[15]+m[13]
  // Top:    m[3]-m[1],  m[7]-m[5],  m[11]-m[9],   m[15]-m[13]
  // Near:   m[3]+m[2],  m[7]+m[6],  m[11]+m[10],  m[15]+m[14]
  // Far:    m[3]-m[2],  m[7]-m[6],  m[11]-m[10],  m[15]-m[14]
  // 각 평면을 정규화
}

private isChunkInFrustum(chunk: Chunk): boolean {
  const minX = chunk.worldOffsetX;
  const minY = 0;
  const minZ = chunk.worldOffsetZ;
  const maxX = minX + CHUNK_WIDTH;
  const maxY = CHUNK_HEIGHT;
  const maxZ = minZ + CHUNK_DEPTH;

  for (const p of this.frustumPlanes) {
    // 가장 멀리 떨어진 꼭짓점이 평면 뒤에 있으면 컬링
    const px = p[0] > 0 ? maxX : minX;
    const py = p[1] > 0 ? maxY : minY;
    const pz = p[2] > 0 ? maxZ : minZ;
    if (p[0] * px + p[1] * py + p[2] * pz + p[3] < 0) {
      return false;
    }
  }
  return true;
}
```

6개 평면 배열은 생성자에서 **미리 할당** (`Array.from({ length: 6 }, () => new Float32Array(4))`)되어 GC 부하를 제거한다.

### 11.7 Draw Call 수집

3종류의 draw call을 분리 수집한다:

```typescript
getDrawCalls(): ChunkDrawCall[]           // 솔리드 블록
getWaterDrawCalls(): ChunkDrawCall[]      // 물 표면
getVegetationDrawCalls(): ChunkDrawCall[] // 식물 크로스 메시
```

각 메서드는 `READY` 상태 + 프러스텀 내부인 청크만 수집한다.

### 11.8 점광원 수집

Emissive 블록 (LAVA, DIAMOND_ORE, SPAWNER)에서 점광원을 수집한다:

```typescript
getPointLights(cameraPos: vec3): PointLight[] {
  // 1. 모든 READY 청크에서 emissive 블록 캐시 수집
  // 2. 카메라 거리순 정렬
  // 3. 상위 MAX_POINT_LIGHTS(128)개만 반환
}
```

| emissive 강도 | 반경 | 예시 블록 |
|---------------|------|-----------|
| >= 0.8 | 8 블록 | LAVA |
| >= 0.1 | 3 블록 | DIAMOND_ORE, SPAWNER |
| < 0.1 | 2 블록 | - |

### 11.9 원거리 청크 언로드

```typescript
const unloadDist = rd + 2;  // renderDistance + 2
for (const [key, entry] of this.chunks) {
  const dx = entry.chunk.chunkX - camChunkX;
  const dz = entry.chunk.chunkZ - camChunkZ;
  if (dx * dx + dz * dz > unloadDist * unloadDist) {
    entry.chunk.destroyGPU();  // GPU 버퍼 해제
    toRemove.push(key);
  }
}
```

`renderDistance + 2` 밖의 청크는 GPU 리소스를 해제하고 Map에서 제거한다. +2 여유분은 카메라 이동 시 깜빡임을 방지한다.

---

## 12. 메시 빌딩 (MeshBuilder.ts)

> **파일:** `src/meshing/MeshBuilder.ts`

### 12.1 면 컬링

불투명 이웃이 있는 면은 렌더링하지 않는다:

```typescript
// src/meshing/MeshBuilder.ts
function shouldRenderFace(chunk, neighbors, x, y, z, face, blockType): boolean {
  // 이웃 블록 좌표 계산 (face 방향)
  const neighborBlock = getBlockAt(chunk, neighbors, nx, ny, nz);

  // Cutout-cutout 인접: 양면 중 하나만 렌더 (z-fighting 방지)
  if (isBlockCutout(blockType) && isBlockCutout(neighborBlock)) {
    return face % 2 === 0;  // 짝수 면(TOP, NORTH, EAST)만
  }

  // 이웃이 비고체이거나 cutout이면 렌더
  return !isBlockSolid(neighborBlock) || isBlockCutout(neighborBlock);
}
```

**면 번호:**

| 번호 | 방향 | 법선 |
|------|------|------|
| 0 | TOP | +Y |
| 1 | BOTTOM | -Y |
| 2 | NORTH | +Z |
| 3 | SOUTH | -Z |
| 4 | EAST | +X |
| 5 | WEST | -X |

### 12.2 버텍스 포맷

#### 솔리드 메시: 28 bytes/vertex (7 x float32)

| 오프셋 (floats) | 타입 | 내용 |
|-----------------|------|------|
| 0, 1, 2 | `f32` | 월드 좌표 (x, y, z) |
| 3 | `u32` | Packed: `face \| (blockType << 8)` |
| 4, 5 | `f32` | 텍스처 UV (u, v) |
| 6 | `f32` | Vertex AO 값 [0, 1] |

```typescript
solidVerts.pushF32(chunk.worldOffsetX + vx);  // pos.x
solidVerts.pushF32(vy);                        // pos.y
solidVerts.pushF32(chunk.worldOffsetZ + vz);  // pos.z
solidVerts.pushU32(face | (blockType << 8));   // packed face/material
solidVerts.pushF32(tileU + UV_U[v] * uvSize); // uv.u
solidVerts.pushF32(tileV + UV_V[v] * uvSize); // uv.v
solidVerts.pushF32(aoVal);                     // AO
```

#### 물 메시: 20 bytes/vertex (5 x float32)

| 오프셋 (floats) | 타입 | 내용 |
|-----------------|------|------|
| 0, 1, 2 | `f32` | 월드 좌표 (x, y, z) |
| 3, 4 | `f32` | UV (u, v) |

물은 **TOP 면만** 렌더링한다 (수면만 보임).

#### 식물 메시: 28 bytes/vertex (7 x float32)

솔리드와 동일한 포맷이지만, AO 슬롯에 wind 값 `1.0`을 저장한다.

```typescript
vegVerts.pushF32(1.0);  // wind/AO 슬롯 (shader에서 바람 애니메이션에 사용)
```

### 12.3 Ambient Occlusion 계산

각 꼭짓점의 AO 값은 3개 이웃 블록의 고체 여부로 결정된다:

```typescript
// src/meshing/MeshBuilder.ts
function computeVertexAO(chunk, neighbors, bx, by, bz, face, vertexIdx): number {
  const offsets = AO_OFFSETS[face][vertexIdx];
  const s1 = isSolidAt(chunk, neighbors, bx + offsets[0], by + offsets[1], bz + offsets[2]) ? 1 : 0;
  const s2 = isSolidAt(chunk, neighbors, bx + offsets[3], by + offsets[4], bz + offsets[5]) ? 1 : 0;
  const c  = isSolidAt(chunk, neighbors, bx + offsets[6], by + offsets[7], bz + offsets[8]) ? 1 : 0;

  let ao: number;
  if (s1 && s2) {
    ao = 0;       // 양쪽 모두 막혀있으면 완전 차폐
  } else {
    ao = 3 - (s1 + s2 + c);  // 0~3
  }
  return ao / 3.0;  // [0, 1] 정규화
}
```

**AO 값 해석:**

| s1 | s2 | corner | AO 레벨 | 정규화 |
|----|----|----|---------|--------|
| 0 | 0 | 0 | 3 | 1.0 (밝음) |
| 1 | 0 | 0 | 2 | 0.667 |
| 0 | 0 | 1 | 2 | 0.667 |
| 1 | 1 | X | 0 | 0.0 (어두움) |
| 1 | 0 | 1 | 1 | 0.333 |

`s1 && s2`일 때 코너 검사 없이 즉시 0을 반환하는 것은 핵심 최적화이다 (양쪽 벽이 만나면 코너도 반드시 가려짐).

### 12.4 AO-aware 삼각형 분할

쿼드를 2개 삼각형으로 분할할 때, AO 값이 더 균일하게 분포되는 대각선을 선택한다:

```typescript
// AO-aware triangle flip
if (ao0 + ao2 > ao1 + ao3) {
  // Path A: (0,2,1), (0,3,2) — 대각선 0-2
  solidIdx.push6(base+0, base+2, base+1, base+0, base+3, base+2);
} else {
  // Path B: (0,3,1), (1,3,2) — 대각선 1-3
  solidIdx.push6(base+0, base+3, base+1, base+1, base+3, base+2);
}
```

```
Path A (ao0+ao2 > ao1+ao3):     Path B (ao0+ao2 <= ao1+ao3):

v3 ──── v2                       v3 ──── v2
│ ╲     │                        │     ╱ │
│   ╲   │                        │   ╱   │
│     ╲ │                        │ ╱     │
v0 ──── v1                       v0 ──── v1
```

이 기법은 AO 그라데이션이 대각선을 따라 매끄럽게 보이도록 하여, 복셀 특유의 계단 그림자를 완화한다.

### 12.5 블록별 UV 조회

블록 ID가 그대로 아틀라스 타일 인덱스가 된다:

```typescript
const tileIndex = blockType as number;
const tileU = (tileIndex % ATLAS_TILES) * uvSize;     // 열 위치
const tileV = Math.floor(tileIndex / ATLAS_TILES) * uvSize;  // 행 위치
```

16x16 아틀라스에서 각 꼭짓점의 UV:

```typescript
const UV_U = [0, 1, 1, 0];  // 좌하, 우하, 우상, 좌상
const UV_V = [0, 0, 1, 1];
```

### 12.6 청크 경계 이웃 참조

청크 경계에서 면 컬링과 AO 계산이 정확하려면 이웃 청크의 블록 데이터가 필요하다:

```typescript
// src/meshing/MeshBuilder.ts
function isSolidAt(chunk, neighbors, x, y, z): boolean {
  if (y < 0) return true;           // 월드 아래는 고체
  if (y >= CHUNK_HEIGHT) return false; // 월드 위는 공기

  if (x < 0)
    return neighbors?.west?.isSolidAt(CHUNK_WIDTH + x, y, z) ?? false;
  if (x >= CHUNK_WIDTH)
    return neighbors?.east?.isSolidAt(x - CHUNK_WIDTH, y, z) ?? false;
  if (z < 0)
    return neighbors?.south?.isSolidAt(x, y, CHUNK_DEPTH + z) ?? false;
  if (z >= CHUNK_DEPTH)
    return neighbors?.north?.isSolidAt(x, y, z - CHUNK_DEPTH) ?? false;

  return chunk.isSolidAt(x, y, z);
}
```

이웃 청크가 아직 로딩되지 않은 경우 (`null`) `false`를 반환하여 면을 렌더링한다. 나중에 이웃이 로딩되면 `rebuildNeighborIfReady()`로 메시를 다시 빌드한다.

### 12.7 크로스 메시 (식물) 빌드

식물 블록은 대각선 방향의 2개 쿼드로 구성된다:

```typescript
// Quad 1: (0,0) → (1,1) 대각선
v0: (wx,   yBot, wz  )    v3: (wx,   yTop, wz  )
v1: (wx+1, yBot, wz+1)    v2: (wx+1, yTop, wz+1)

// Quad 2: (1,0) → (0,1) 대각선
v0: (wx+1, yBot, wz  )    v3: (wx+1, yTop, wz  )
v1: (wx,   yBot, wz+1)    v2: (wx,   yTop, wz+1)
```

```
위에서 본 모습 (XZ 평면):

    Z
    ^
    |  ╲ ╱
    |   X    ← X자 교차
    |  ╱ ╲
    └──────> X
```

**Y 오프셋:**
```typescript
const yBot = y + 0.01;   // 바닥 살짝 위
const yTop = y + 0.99;   // 천장 살짝 아래
```

정수 좌표를 피하여 `fract()` 함수가 shader에서 올바르게 작동하도록 한다 (바람 애니메이션에 사용).

### 12.8 GrowableBuffer

메시 빌딩은 사전 할당된 `GrowableBuffer`를 사용하여 중간 배열 생성을 최소화한다:

```typescript
class GrowableBuffer {
  buffer: ArrayBuffer;
  f32: Float32Array;
  u32: Uint32Array;   // 같은 ArrayBuffer의 u32 뷰 (interleaved packing용)
  offset: number;

  ensure(count: number): void {
    // 용량 부족 시 2배 확장
  }

  pushF32(v: number): void { this.f32[this.offset++] = v; }
  pushU32(v: number): void { this.u32[this.offset++] = v; }
}
```

`f32`와 `u32`가 **동일한 ArrayBuffer**를 공유하므로, 같은 버텍스 내에서 float 데이터 (position, UV)와 uint32 데이터 (packed face/material)를 자유롭게 교차 기록할 수 있다. 이것이 28바이트 interleaved 포맷을 가능하게 하는 핵심 설계이다.

---

## 부록: 전체 생성 파이프라인 요약

```
ChunkManager.update(cameraPos, viewProj)
│
├─ 1. 카메라 주변 청크 큐 등록 (원형 범위)
├─ 2. 거리순 정렬
├─ 3. chunksPerFrame(2)개 처리:
│     │
│     ├─ TerrainGenerator.generate()    ← 기본 지형 + 바이옴
│     ├─ OreGenerator.generate()        ← 광석 맥
│     ├─ CaveGenerator.generate()       ← 웜 동굴
│     ├─ TreeGenerator.generate()       ← 나무 배치
│     ├─ VegetationGenerator.generate() ← 식물 배치
│     ├─ WaterSimulator.generate()      ← 물 채움 + 폭포
│     │
│     └─ buildChunkMesh()               ← 3종 메시 빌드
│           ├─ 솔리드 (28 bytes/vert, AO, face culling)
│           ├─ 물 (20 bytes/vert, TOP면만)
│           └─ 식물 (28 bytes/vert, X자 cross mesh)
│
├─ 4. 이웃 청크 리빌드 (Set 중복 제거)
├─ 5. 원거리 청크 언로드 (rd+2)
└─ 6. 프러스텀 컬링 후 draw call 수집
```
