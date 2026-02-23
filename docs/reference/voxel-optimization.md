# Voxel Engine Optimization Reference

이 문서는 GanVoxelWorld-WebGPU 엔진에 적용된 최적화 기법의 이론적 배경과 구현 상세를 다룬다.

---

## 1. Greedy Meshing

### 이론

복셀 엔진에서 가장 큰 성능 병목은 버텍스 수이다. 순진한 접근법(per-block per-face)은 인접한 동일 타입 블록의 면을 각각 독립적인 quad로 렌더링한다. Greedy Meshing은 동일한 속성을 가진 인접 면들을 하나의 큰 quad로 병합하여 버텍스와 인덱스 수를 50~70% 줄인다.

### 알고리즘

1. 6개 면 방향별로 처리 (TOP, BOTTOM, NORTH, SOUTH, EAST, WEST)
2. 각 방향에 대해 축을 따라 slice를 순회
3. 각 slice에서 2D 면 디스크립터 그리드를 생성
4. 디스크립터 = `{blockType, ao0, ao1, ao2, ao3}` (16비트로 패킹)
5. Greedy rectangle expansion:
   - 좌→우로 동일 디스크립터 확장 (width)
   - 아래→위로 동일 폭의 줄을 확장 (height)
   - 병합된 영역을 하나의 quad로 emit
   - 사용된 셀을 마킹

### 병합 조건

- **동일 blockType**: 텍스처 타일링이 정확해야 하므로
- **동일 AO 4값**: AO가 다르면 보간 경계가 달라져 시각적 아티팩트 발생
- **Cutout 블록 제외**: LEAVES (51) 등은 alpha cutout이 필요하므로 per-face 유지

### UV 타일링

병합된 quad의 UV는 `[0, W] × [0, H]` (W, H = 병합 블록 수)로 설정한다. Fragment shader에서:

```wgsl
let localUV = fract(texCoord);
let atlasUV = tileBase + localUV * tileSize;
```

`fract()`가 각 블록 경계에서 UV를 [0,1]로 반복시켜 텍스처가 올바르게 타일링된다.

### Half-Texel Inset

Atlas 타일 경계에서 인접 타일이 블리딩되는 것을 방지하기 위해 half-texel inset을 적용:

```wgsl
let insetUV = clamp(localUV, HALF_TEXEL, 1.0 - HALF_TEXEL);
```

---

## 2. Bitmask 기반 빈 공간 스킵 (NanoVDB 영감)

### 배경: SVO, SVDAG, NanoVDB

| 구조 | 특징 | 장점 | 단점 |
|------|------|------|------|
| **SVO** (Sparse Voxel Octree) | 8진 트리, 빈 공간 스킵 | 계층적 LOD 자연스러움 | 트리 순회 오버헤드 |
| **SVDAG** (SVO + DAG) | 중복 서브트리 공유 | 극한 메모리 절약 | 읽기 전용, 수정 어려움 |
| **NanoVDB** | 비트마스크 기반, 선형 배열 | GPU 친화적, 캐시 효율 | 고정 해상도 |

NanoVDB의 핵심 아이디어: **비트마스크로 빈 공간을 식별하고, 선형 메모리에서 한 번에 스킵**.

### 구현

청크를 4×4×4 서브블록(64 블록)으로 분할 → 512개 서브블록/청크.
각 서브블록에 64-bit occupancy 비트마스크 (Uint32×2) 저장.

```
bitmask = 0x00000000_00000000  → 서브블록 전체 AIR → 64블록 스킵
bitmask = 0xFFFFFFFF_FFFFFFFF  → 서브블록 전체 비어있지 않음 → 경계 면만 체크
```

**메싱 순회 비용 60~70% 감소**: 지형 하단의 uniform stone, 상단의 순수 air 영역을 한 번에 건너뛰기.

---

## 3. GPU-Driven Rendering (Multi-Draw Indirect)

### 기존 문제

청크별 `setVertexBuffer()` + `setIndexBuffer()` + `drawIndexed()` 호출은:
- CPU→GPU 커맨드 오버헤드 (drillcall당 ~수 μs)
- 버퍼 바인딩 상태 변경 비용

### Mega Buffer 아키텍처

모든 청크의 vertex/index 데이터를 **단일 거대 GPUBuffer**에 연속 배치:

```
┌─────────┬─────────┬─────────┬─────────┐
│ Chunk A │ Chunk B │ (free)  │ Chunk C │ ...
│ verts   │ verts   │         │ verts   │
└─────────┴─────────┴─────────┴─────────┘
```

**Free-list Allocator**: 청크 로드 시 서브영역 할당, 언로드 시 해제. 인접 빈 블록 자동 병합.

### Indirect Draw

```typescript
// 1회만 바인딩
pass.setVertexBuffer(0, megaVertexBuffer);
pass.setIndexBuffer(megaIndexBuffer, 'uint32');

// N회 drawIndexedIndirect (no rebind)
for (i = 0; i < chunkCount; i++) {
  pass.drawIndexedIndirect(indirectBuffer, i * 20);
}
```

### GPU Frustum Culling

Compute shader에서 6-plane AABB 테스트:
1. 각 청크의 AABB를 6개 frustum plane에 대해 테스트
2. visible 청크: `instanceCount = 1`
3. culled 청크: `instanceCount = 0` (GPU가 스킵)

```wgsl
for (var p = 0u; p < 6u; p++) {
  let plane = frustum.planes[p];
  let px = select(aabbMin.x, aabbMax.x, plane.x > 0.0);
  // ...
  if (dot + plane.w < 0.0) { visible = false; break; }
}
```

---

## 4. Hierarchical LOD for Voxels

### LOD 레벨

| LOD | 해상도 | 다운샘플 | 거리 범위 |
|-----|--------|----------|-----------|
| 0 | 16×128×16 | 원본 | 0 ~ RD×0.4 |
| 1 | 8×64×8 | 2×2×2 majority vote | RD×0.4 ~ RD×0.65 |
| 2 | 4×32×4 | 4×4×4 | RD×0.65 ~ RD×0.85 |
| 3 | 2×16×2 | 8×8×8 | RD×0.85 ~ RD |

### Majority Vote 다운샘플

8개 블록(2×2×2)에서 가장 많이 나타나는 타입을 선택. AIR, 물, 식생은 투표에서 제외하여 지형 구조가 보존됨.

### 효과

- 원거리 청크의 버텍스 수 95%+ 감소 (LOD 3에서)
- 렌더 거리 3~4배 확장 가능
- 정적 블록이므로 LOD 메시를 1회만 빌드

---

## 5. Hi-Z Occlusion Culling

### 원리

이전 프레임의 depth buffer에서 hierarchical mip chain을 생성. 각 mip 레벨은 원본 2×2 영역의 **max depth**를 저장 (conservative).

### 과정

1. **Mip 0**: depth buffer → r32float 복사
2. **Mip N**: `max(mip[N-1][2×2 block])` 반복
3. **Culling**: 청크 AABB를 screen space로 투영 → 해당 영역의 Hi-Z mip 샘플
4. 청크의 최근(nearest) depth > Hi-Z 값이면 occluded

### Conservative Depth

max depth를 사용하는 이유: 2×2 영역 중 가장 먼 점이 청크보다 가까우면, 그 영역 전체가 청크를 가린다는 것이 보장됨.

### 예상 효과

- 다른 지형에 가려진 청크 30~50% 추가 컬링
- 동굴 내부, 산 뒤 등에서 특히 효과적

---

## 6. Chunk 데이터 압축

### 기법

Phase 2의 4×4×4 서브블록 분할을 활용:
- **Uniform 서브블록**: 64블록이 모두 동일 타입 → 1바이트로 대체
- **Mixed 서브블록**: 원본 64바이트 유지

### 메모리 효과

- 원본: 32,768 바이트/청크
- 압축 후: uniform flags(512B) + uniform types(512B) + detail offsets(1024B) + detail blocks(mixed_count × 64B)
- 전형적 지형: 상단 air(50%+ uniform) + 하단 stone(30%+ uniform) → ~4~8KB/청크

### 구현 세부

```typescript
getBlock(x, y, z) {
  if (compressed) {
    const subIdx = ...;
    if (uniformFlags[subIdx]) return uniformTypes[subIdx]; // O(1), no array lookup
    return detailBlocks[detailOffsets[subIdx] * 64 + localIdx];
  }
  return blocks[index(x, y, z)];
}
```

`setBlock()` 호출 시 자동 decompress → 블록 수정 지원.

---

## 엔진 대비 각 최적화의 예상 효과

| Phase | 최적화 | 주요 효과 | 예상 개선 |
|-------|--------|-----------|-----------|
| 1 | Greedy Meshing | 버텍스/인덱스 수 감소 | 50~70% 버텍스 절감 |
| 2 | Bitmask Skip | 메싱 순회 비용 감소 | 60~70% 순회 절감 |
| 3 | Multi-Draw Indirect | 드로우콜 오버헤드 제거 | 1회 버퍼 바인딩 |
| 4 | Hierarchical LOD | 원거리 렌더 비용 감소 | 렌더 거리 3~4× |
| 5 | Hi-Z Occlusion | 불필요 렌더 제거 | 30~50% 추가 컬링 |
| 6 | Chunk Compression | RAM 사용량 감소 | 75~88% RAM 절감 |
