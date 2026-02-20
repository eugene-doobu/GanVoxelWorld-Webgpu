# Alpha Cutout 시스템

> 나뭇잎, 풀, 꽃 등 부분 투명 블록의 cutout(구멍 뚫기) 렌더링 전략을 다룹니다. 셰이더 기반 procedural hash의 한계와, atlas 텍스처 alpha bake 방식을 채택한 이유를 설명합니다.

## 목차

- [개요](#개요)
- [Procedural Hash 접근의 실패](#procedural-hash-접근의-실패)
- [Atlas Alpha Bake 방식](#atlas-alpha-bake-방식)
- [Z-Fighting 방지](#z-fighting-방지)
- [Vegetation Cross-Mesh](#vegetation-cross-mesh)
- [textureSample vs textureSampleLevel](#texturesample-vs-texturesamplelevel)

---

## 개요

복셀 엔진에서 나뭇잎이나 풀은 블록 전체가 불투명하지 않습니다. 일부 픽셀은 투명하게 처리되어야 자연스러운 외형을 얻을 수 있습니다. 이를 **alpha cutout**(alpha test)이라 부르며, fragment shader에서 `discard` 키워드로 특정 픽셀을 버려 구현합니다.

```wgsl
if (alpha < 0.5) { discard; }
```

핵심 질문은 **"이 픽셀의 alpha 값을 어떻게 결정하는가"**입니다.

---

## Procedural Hash 접근의 실패

### 기본 아이디어

Fragment shader에서 월드 좌표나 UV를 입력으로 해시 함수를 실행하고, 결과값이 임계치 미만이면 `discard`합니다.

```wgsl
let pattern = fract(sin(seed) * 43758.5453);
if (pattern < 0.35) { discard; }
```

### 시도 1: `floor(worldPos * N)`

```wgsl
let hx = floor(wp.x * 4.0);
let hy = floor(wp.y * 4.0);
let hz = floor(wp.z * 4.0);
let pattern = fract(sin(hx * 12.9898 + hy * 78.233 + hz * 45.164) * 43758.5453);
```

**실패 원인**: `worldPos`는 vertex shader에서 fragment shader로 보간(interpolate)됩니다. 카메라가 미세하게 움직이면 동일 화면 픽셀에 대응하는 월드 좌표가 소수점 이하에서 달라집니다. `floor()` 함수의 정수 경계(0.25 간격)를 오가면 해시 결과가 매 프레임 뒤바뀌어 **격자 모양 깜빡임**이 발생합니다.

```
프레임 N:   floor(3.999 * 4) = floor(15.996) = 15
프레임 N+1: floor(4.001 * 4) = floor(16.004) = 16  ← 해시 완전히 변경
```

### 시도 2: `fract(texCoord * 16)` + `floor()`

```wgsl
let tileUV = fract(input.texCoord * 16.0);
let cell = floor(tileUV * 4.0);
```

**실패 원인**: `texCoord` 자체는 정점 속성이라 안정적이지만, 아틀라스 타일 경계(정확한 정수값)에서 `fract()`가 0과 1 사이를 불안정하게 오갑니다. 또한 `faceIdx`를 해시에 포함하면 면(face)에 따라 패턴이 달라져 **보는 방향에 따라 나뭇잎이 사라지는** 문제가 생깁니다.

### 시도 3: 고주파 `sin()` 해시

```wgsl
let h1 = fract(sin(dot(wp * 3.7, vec3f(127.1, 311.7, 74.7))) * 43758.5453);
```

**실패 원인**: 실효 주파수가 `3.7 × 127 ≈ 470`이므로 약 0.013 블록마다 패턴이 반전됩니다. 이는 서브픽셀 해상도에 해당하여 모든 fragment가 매 프레임 완전히 다른 값을 가지게 됩니다. 결과: **전면적인 지글지글 노이즈**.

### 근본 원인

GPU 래스터라이저의 보간값은 카메라 위치/각도에 따라 미세하게 변합니다. 이 미세한 변동이 불연속 함수(`floor`, 고주파 `sin`)에 의해 증폭되어, `discard` 결정이 프레임마다 뒤바뀝니다. **보간된 연속값에 불연속 함수를 적용하는 한, 시간적 안정성을 보장할 수 없습니다.**

---

## Atlas Alpha Bake 방식

### 핵심 원리

Cutout 패턴을 런타임에 계산하지 않고, **텍스처 아틀라스 생성 시 alpha 채널에 직접 기록**합니다.

```
┌──────────────────────────────────────────────────────┐
│  Procedural (불안정)                                  │
│  vertex → 보간 → fragment에서 hash → discard 결정     │
│                    ↑ 매 프레임 미세하게 변동            │
├──────────────────────────────────────────────────────┤
│  Atlas Bake (안정)                                    │
│  TextureAtlas 생성 시 alpha=0/255 결정 (1회)          │
│  → GPU 텍스처 업로드 (불변)                            │
│  → textureSampleLevel() → 항상 동일한 texel 반환       │
└──────────────────────────────────────────────────────┘
```

### 구현

**TextureAtlas.ts** (앱 시작 시 1회):

```typescript
// 나뭇잎 타일 16×16 픽셀 생성
if (blockType === BlockType.LEAVES) {
    const [r, g, b] = this.getBlockPattern(blockType, x, y, br, bg, bb);
    const h2 = hash(x, y, 61);              // 정수 입력 → 결정론적
    pixels[pixelIndex + 3] = h2 < 0.20 ? 0 : 255;  // ~20% 투명
}
```

`hash(x, y, seed)` 함수는 정수 좌표를 입력받아 `[0, 1]` 범위의 결정론적 값을 반환합니다. 타일의 16×16 = 256 픽셀 중 약 20%인 ~51 픽셀이 alpha=0(투명)으로 설정됩니다.

**gbuffer.frag.wgsl** (매 프레임):

```wgsl
// 나뭇잎(51)과 vegetation(80-82) 통합 cutout
if (blockType == 51u || (blockType >= 80u && blockType <= 82u)) {
    let alpha = textureSampleLevel(atlasTexture, atlasSampler, input.texCoord, 0.0).a;
    if (alpha < 0.5) { discard; }
}
```

### 안정성 보장

`textureSampleLevel(texture, sampler, uv, 0.0)`의 모든 입력이 프레임 불변입니다:

| 입력 | 왜 안정적인가 |
|------|--------------|
| `texture` | GPU에 업로드 후 수정 없음 |
| `sampler` | `nearest` 필터 + 밉맵 없음 → 정확한 texel 주소 |
| `uv` (texCoord) | 정점 속성, 지오메트리 불변 시 프레임 불변 |
| `LOD 0` | 명시적 → 편미분(dFdx/dFdy) 불필요 |

같은 `texCoord` → 같은 texel 주소 → 같은 RGBA 값 → **100% 결정론적**.

---

## Z-Fighting 방지

인접한 두 cutout 블록(나뭇잎-나뭇잎)의 공유면은 정확히 같은 평면에 위치합니다. 두 블록 모두 이 면을 렌더링하면, 서로 다른 UV 매핑(반전)으로 인해 다른 alpha 패턴이 적용되고, GPU 깊이 테스트가 매 프레임 다른 면을 선택하여 **z-fighting**이 발생합니다.

```
나뭇잎 A의 EAST면 ──┐ 같은 평면에 2개 face
나뭇잎 B의 WEST면 ──┘ → UV 반전 → 다른 alpha → 깜빡임
```

### 해결: 단일면 렌더링

`shouldRenderFace()`에서 cutout-cutout 인접면은 **양의 방향(짝수 face)**만 렌더링합니다:

```typescript
if (isBlockCutout(blockType) && isBlockCutout(neighborBlock)) {
    return face % 2 === 0; // TOP(0), NORTH(2), EAST(4)만 렌더
}
```

면이 1개만 존재하므로 깊이 경합 자체가 발생하지 않습니다.

---

## Vegetation Cross-Mesh

풀(TALL_GRASS), 양귀비(POPPY), 민들레(DANDELION)는 일반 블록 face가 아닌 **X자형 cross-mesh**(대각선 2개 quad)로 렌더링됩니다.

### 지오메트리

```
위에서 본 모습 (1×1 블록 내):
  ╲   ╱
   ╲ ╱
    ╳     ← 두 quad가 X자로 교차
   ╱ ╲
  ╱   ╲
```

- Quad 1: `(0,0) → (1,1)` 대각선
- Quad 2: `(1,0) → (0,1)` 대각선
- Y 좌표: `yBot = y + 0.01`, `yTop = y + 0.99` (정수 회피)

### Y Offset이 필요한 이유

바람 애니메이션은 `fract(position.y)`로 높이 보간합니다:

```wgsl
let heightFactor = fract(input.position.y); // 0 = 밑동(고정), 1 = 꼭대기(흔들림)
```

정확한 정수 Y(예: 65, 66)는 `fract() = 0`이므로 바람이 적용되지 않습니다. `y + 0.01`과 `y + 0.99`로 offset하면 `fract() ≈ 0.01`(고정)과 `fract() ≈ 0.99`(흔들림)이 됩니다.

### 렌더링 파이프라인

| | Solid Blocks | Vegetation |
|---|---|---|
| Pipeline | `gbufferPipeline` | `gbufferVegetationPipeline` |
| cullMode | `back` | `none` (양면 렌더) |
| Normal | TBN 변환 | UP `(0,1,0)` 직접 사용 |
| front_facing | 미사용 | 뒷면 normal 반전 |
| Shadow | 기본 depth-only | `cutoutPipeline` (alpha test) |

---

## textureSample vs textureSampleLevel

WGSL에서 텍스처 샘플링 함수는 두 가지가 있으며, 이 프로젝트에서는 `textureSampleLevel`을 사용합니다.

| | `textureSample()` | `textureSampleLevel(_, _, _, 0.0)` |
|---|---|---|
| LOD 결정 | 암시적 (dFdx/dFdy 편미분 필요) | 명시적 (LOD 직접 지정) |
| 편미분 계산 | 2×2 quad 내 인접 fragment 필요 | 불필요 |
| 비-uniform 분기 내 | **금지** (컴파일 에러) | **허용** |
| 밉맵 없는 nearest 샘플러 | LOD 항상 0 → 편미분 무의미 | 동일 결과 |

`textureSample()`은 GPU가 **2×2 fragment quad** 단위로 실행할 때 인접 fragment의 UV 차이로 밉맵 레벨을 자동 결정합니다. 이를 위해 같은 quad 내 모든 fragment가 **동일한 코드 경로**를 실행해야 합니다 (uniform control flow). `if (blockType == 51u)` 같은 분기 안에서 호출하면 quad 내 일부 fragment만 진입할 수 있어 컴파일 에러가 발생합니다.

이 프로젝트는 nearest 필터 + 밉맵 없음이므로 `textureSampleLevel(..., 0.0)`이 기능적으로 동일하면서도 비-uniform 분기 안에서 안전하게 호출됩니다.
