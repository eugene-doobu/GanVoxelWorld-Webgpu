# 노이즈 함수 레퍼런스

> 절차적 지형 생성에 사용되는 노이즈 함수의 이론과 파라미터 튜닝 가이드입니다.

## 목차

- [그래디언트 노이즈란?](#그래디언트-노이즈란)
- [Perlin Noise](#perlin-noise)
- [Simplex Noise](#simplex-noise)
- [Fractal Brownian Motion (FBM)](#fractal-brownian-motion-fbm)
- [FBM 파라미터 효과](#fbm-파라미터-효과)
- [노이즈 결합을 통한 지형 생성](#노이즈-결합을-통한-지형-생성)
- [참고 자료](#참고-자료)

---

## 그래디언트 노이즈란?

절차적 지형 생성에는 **coherent noise** (결이 있는 노이즈)가 필요합니다. 완전한 랜덤(white noise)은 인접한 점끼리 아무 관계가 없어서 지형이 아닌 모래알 같은 패턴이 됩니다. 반면 coherent noise는 **가까운 점들이 비슷한 값**을 가져서 부드러운 언덕, 산맥 같은 자연스러운 형태를 만듭니다.

**그래디언트 노이즈(gradient noise)**는 coherent noise를 만드는 대표적 기법입니다:

1. 공간을 규칙적인 **격자(grid)**로 나눈다
2. 각 격자점에 의사난수 **그래디언트 벡터**(방향)를 배정한다
3. 임의의 점에서 주변 격자점들의 그래디언트와 **내적(dot product)**을 구한다
4. 결과들을 **부드러운 보간(smooth interpolation)**으로 합친다

그래디언트 벡터가 "이 격자점 근처에서 값이 어느 방향으로 증가하는가"를 결정하므로, 인접한 격자점의 영향이 자연스럽게 섞여 매끄러운 패턴이 됩니다. 단순 랜덤 값(value noise)보다 시각적 품질이 좋고 방향 편향이 적습니다.

---

## Perlin Noise

Ken Perlin이 1983년 영화 트론(Tron)의 CG 작업을 위해 발명한 최초의 그래디언트 노이즈입니다.

### 동작 방식

1. 입력 좌표가 속한 **정사각형(2D) 또는 정육면체(3D) 격자 셀**을 찾는다
2. 셀의 각 꼭짓점에서 의사난수 그래디언트 벡터를 조회한다
3. 입력 점에서 각 꼭짓점까지의 **오프셋 벡터**와 그래디언트의 **내적**을 구한다
4. 이 내적 값들을 smooth-step (fade) 함수로 **보간**한다

### 한계

- **격자 정렬 아티팩트**: 정사각형 격자를 사용하므로 패턴에 수평/수직 방향 편향이 나타날 수 있음
- **계산 비용**: 2D에서 꼭짓점 4개, 3D에서 8개를 평가해야 함 — 차원이 올라갈수록 O(2^N)으로 급증
- **보간 오버헤드**: 꼭짓점 값들을 매끄럽게 합치기 위해 fade 함수 + 다중 lerp 필요

이러한 한계를 해결하기 위해 Ken Perlin 본인이 2001년 **Simplex noise**를 제안했습니다.

---

## Simplex Noise

Perlin noise의 후속으로, Stefan Gustavson이 정리한 구현이 널리 사용됩니다.

### 핵심 개선: Simplex 격자

Perlin noise의 정사각형/정육면체 격자 대신 **simplex 격자**를 사용합니다.

**Simplex**란 주어진 차원에서 가장 적은 꼭짓점으로 공간을 채울 수 있는 도형입니다:
- 1D: 선분 (꼭짓점 2개)
- 2D: 정삼각형 (꼭짓점 3개) — 정사각형(4개)보다 적음
- 3D: 정사면체 (꼭짓점 4개) — 정육면체(8개)보다 적음

꼭짓점이 적으므로 평가해야 할 그래디언트 수가 줄고, 결과적으로 N차원에서 O(2^N) → O(N^2)로 계산 복잡도가 감소합니다.

### Skew 변환 (좌표 왜곡)

Simplex noise의 핵심 트릭은 **skew 변환**입니다. 정사각형 격자에서 삼각형을 직접 다루기는 어려우므로, 좌표계 자체를 변환합니다:

1. **Skew (입력 → simplex 공간)**: 정사각형 격자를 비스듬히 밀어서 각 셀이 두 개의 정삼각형으로 나뉘게 합니다

```
정사각형 격자:          skew 후 (simplex 격자):
+---+---+              +---+---+
|   |   |    ──→      /  / \ /
+---+---+            +---+---+
|   |   |           / \ /  /
+---+---+          +---+---+
```

2. **Unskew (simplex 공간 → 입력)**: 기여도 계산 시 다시 원래 좌표로 되돌린다

2D에서의 skew 상수: `F2 = (√3 - 1) / 2 ≈ 0.366`, unskew 상수: `G2 = (3 - √3) / 6 ≈ 0.211`

이 변환 덕분에 정수 격자 연산(floor, &255)을 그대로 사용하면서도 삼각형 기반 셀을 다룰 수 있습니다.

### 감쇠 함수 (Falloff Kernel)

각 꼭짓점의 기여도는 거리가 멀수록 줄어야 합니다. Simplex noise는 **방사형 감쇠 함수**를 사용합니다:

```
t = r_max - (dx² + dy²)       // r_max는 2D에서 0.5, 3D에서 0.6
if t < 0: 기여도 = 0          // 반경 밖이면 무시
기여도 = t⁴ × dot(gradient, offset)
```

`t⁴`를 사용하는 이유:
- `t`가 0에 가까울 때 값과 도함수가 모두 0 → 경계에서 **C1 연속** (부드러운 전환)
- 거듭제곱이 높을수록 격자 경계 아티팩트가 줄어듦
- 계산이 단순 (곱셈만)

이 감쇠 함수 덕분에 각 점은 가장 가까운 2~3개(2D) 또는 3~4개(3D) 꼭짓점에서만 영향을 받으며, 나머지는 자동으로 0이 됩니다.

### 시딩과 순열 테이블

동일한 시드에서 동일한 노이즈 패턴을 재현하기 위해 **순열 테이블**을 사용합니다:

1. 0-255의 정수 배열을 생성
2. 시드 기반 PRNG (보통 Linear Congruential Generator)로 Fisher-Yates 셔플 수행
3. 256개 값을 두 번 반복하여 512개 배열 생성 (인덱스 래핑용)

**LCG (Linear Congruential Generator)**: `next = (a × current + c) mod m` 형태의 간단한 PRNG입니다. 암호학적으로 안전하지는 않지만, 노이즈 생성에는 충분한 분포 균일성을 제공하며 매우 빠릅니다.

이 순열 테이블이 각 격자점의 그래디언트를 결정하므로, 시드가 같으면 동일한 노이즈 지형이 생성됩니다.

### Simplex vs Perlin 요약

| | Perlin Noise | Simplex Noise |
|---|---|---|
| 격자 | 정사각형/정육면체 | 삼각형/사면체 |
| 꼭짓점 수 (2D) | 4 | 3 |
| 꼭짓점 수 (3D) | 8 | 4 |
| 복잡도 | O(2^N) | O(N^2) |
| 방향 아티팩트 | 있음 (축 정렬) | 없음 |
| 보간 | fade + 다중 lerp | 방사형 감쇠 (t⁴) |

### 출력 범위

원시 simplex noise 출력은 `[-1, 1]` 범위입니다. 용도에 따라 `[0, 1]`로 정규화하여 사용할 수 있습니다:

```
normalized = (raw + 1.0) * 0.5
```

---

## Fractal Brownian Motion (FBM)

### 개념

단일 simplex noise는 하나의 주파수/스케일만 표현합니다. 자연스러운 지형은 대규모 산맥부터 작은 바위까지 **여러 스케일의 특징**이 중첩되어 있습니다.

**Fractal Brownian Motion (FBM)**은 서로 다른 주파수와 진폭의 노이즈를 여러 겹(옥타브) 중첩하여 이를 표현합니다. 이름의 "Brownian Motion"은 브라운 운동(무작위 보행)의 프랙탈 성질에서 유래했습니다.

### 수식

```
result = sum(noise(x * freq_i, y * freq_i) * amp_i) / sum(amp_i)

여기서:
  freq_i = base_frequency * lacunarity^i
  amp_i  = base_amplitude * persistence^i
  i = 0, 1, 2, ..., octaves-1
```

각 옥타브는 이전보다 더 높은 주파수(세밀함)와 더 낮은 진폭(기여도)을 가집니다. 최종 결과를 전체 진폭 합으로 나누어 `[0, 1]` 범위로 정규화합니다.

### 직관적 이해

FBM을 여러 투명 필름을 겹치는 것으로 비유할 수 있습니다:

- **1번째 옥타브** (저주파, 고진폭): 대륙과 바다의 대략적 윤곽
- **2번째 옥타브**: 산맥과 평원의 굴곡
- **3번째 옥타브**: 언덕과 계곡의 세부 형태
- **4번째 옥타브** (고주파, 저진폭): 작은 바위와 울퉁불퉁한 표면 디테일

"옥타브"라는 이름은 음악에서 유래했습니다. 음악의 옥타브가 주파수 2배인 것처럼, FBM의 각 옥타브도 (기본적으로) 이전의 2배 주파수를 가집니다.

---

## FBM 파라미터 효과

### Scale (공간 주파수)

노이즈의 "확대 수준"을 제어합니다. 스케일이 클수록 더 부드럽고 큰 특징이 나타납니다.

```
simplex 입력 = worldCoord / scale
```

| 스케일 | 효과 | 용도 |
|-------|------|------|
| 10-30 | 매우 세밀한 작은 특징 | 동굴 터널, 광석 분포 |
| 50-100 | 중간 크기 특징 | 지형 높이 변화 |
| 200-400 | 크고 부드러운 영역 | 바이옴 구역 |
| 500-1000 | 매우 큰 형태 | 대륙 형상 |

### Octaves (옥타브 수)

중첩하는 노이즈 레이어 수입니다. 많을수록 세밀한 디테일이 추가되지만 계산 비용도 비례하여 증가합니다.

| 옥타브 | 효과 | 성능 |
|-------|------|------|
| 1 | 매끄러운 덩어리, 디테일 없음 | 가장 빠름 |
| 2-3 | 약간의 변화가 있는 완만한 언덕 | 빠름 |
| 4 | 형태와 디테일의 좋은 균형 | 보통 |
| 6-8 | 높은 디테일, 사실적 지형 | 느림 |

### Persistence (감쇠율)

각 옥타브의 진폭이 이전 대비 얼마나 줄어드는지 결정합니다. 0과 1 사이의 값이며, 낮을수록 고주파 성분이 억제되어 부드러운 결과가 나옵니다.

```
persistence = 0.3  → 매끄럽고 완만한 지형
persistence = 0.5  → 형태와 디테일의 표준 균형
persistence = 0.7  → 거칠고 세밀한 지형
```

### Lacunarity (주파수 배율)

옥타브 사이의 주파수 증가 비율입니다. 표준값은 2.0 (매 옥타브마다 주파수 두 배)입니다.

```
lacunarity = 1.5  → 미묘한 주파수 증가, 옥타브간 차이 적음
lacunarity = 2.0  → 표준 두 배 증가
lacunarity = 3.0  → 급격한 주파수 점프, 더 들쭉날쭉한 결과
```

---

## 노이즈 결합을 통한 지형 생성

### 독립 노이즈 레이어

자연스러운 지형은 하나의 노이즈로 만들 수 없습니다. 서로 다른 시드를 가진 여러 독립적인 노이즈 레이어를 역할별로 나누어 사용합니다:

- **대륙성 노이즈** — 기본 고도 결정 (바다 vs 육지 vs 산)
- **높이 변동 노이즈** — 기본 고도 위에 국지적 변동 추가
- **기후 노이즈** (온도, 습도 등) — 바이옴 선택에 사용

각 레이어의 시드를 다르게 하면 서로 상관관계 없는 독립적인 패턴이 생성됩니다. 같은 시드를 공유하면 온도가 높은 곳이 항상 높은 지형이 되는 등 부자연스러운 상관관계가 생깁니다.

### 높이 계산 패턴

일반적인 노이즈 결합 패턴:

```
1. 대륙성 노이즈를 스플라인으로 기본 높이에 매핑:
     base_height = spline(continentalness)
     예: 낮은 값 → 해저, 중간 → 해안/평원, 높은 값 → 산악

2. 높이 변동 노이즈로 지역적 굴곡 추가:
     final_height = base_height + variation_noise * amplitude

3. (선택) Erosion 노이즈로 변동 진폭 자체를 조절:
     amplitude = lerp(HIGH_VARIATION, LOW_VARIATION, erosion)
     → 높은 erosion = 평탄한 지역, 낮은 erosion = 거친 지역
```

### 2D vs 3D 노이즈

- **2D 노이즈** — 높이 맵, 바이옴 파라미터 등 컬럼 단위 데이터에 사용
- **3D 노이즈** — 동굴, 오버행, 3D 광석 분포 등 볼륨 데이터에 사용

3D 노이즈는 계산량이 더 많지만 (꼭짓점 4개 vs 3개), 지형 내부의 빈 공간이나 돌출 구조를 표현할 수 있습니다.

---

## 참고 자료

### Simplex / Perlin Noise
- [Stefan Gustavson — Simplex noise demystified (PDF)](https://weber.itn.liu.se/~stegu/simplexnoise/simplexnoise.pdf) — Simplex noise 알고리즘, skew 변환, 감쇠 함수를 수학적으로 설명한 원본 논문
- [Ken Perlin — Improved Noise (2002)](https://mrl.cs.nyu.edu/~perlin/paper445.pdf) — Ken Perlin의 개선된 Perlin noise 논문
- [Ken Perlin — Noise hardware (2001)](https://www.csee.umbc.edu/~olano/s2002c36/ch02.pdf) — Simplex noise를 처음 제안한 SIGGRAPH 과정 노트
- [Wikipedia — Simplex noise](https://en.wikipedia.org/wiki/Simplex_noise) — 알고리즘 개요와 Perlin noise와의 비교

### Fractal Brownian Motion
- [The Book of Shaders — Fractal Brownian Motion](https://thebookofshaders.com/13/) — FBM의 시각적 설명과 인터랙티브 데모
- [Inigo Quilez — fBM article](https://iquilezles.org/articles/fbm/) — FBM 변형들 (warp, ridged 등)과 파라미터 효과의 시각적 비교
- [Hugo Elias — Perlin Noise (archived)](https://web.archive.org/web/20150427183140/http://freespace.virgin.net/hugo.elias/models/m_perlin.htm) — 옥타브, persistence, lacunarity 개념을 그림으로 설명한 고전 튜토리얼

### 절차적 지형 생성 전반
- [Red Blob Games — Noise Functions](https://www.redblobgames.com/articles/noise/introduction.html) — value noise부터 gradient noise까지 인터랙티브 시각화
- [libnoise — Coherent noise](http://libnoise.sourceforge.net/coherentnoise/index.html) — coherent noise의 정의와 지형 생성 파이프라인 설명
- [GPU Gems 3, Ch.1 — Generating Complex Procedural Terrains](https://developer.nvidia.com/gpugems/gpugems3/part-i-geometry/chapter-1-generating-complex-procedural-terrains-using-gpu) — GPU 기반 절차적 지형 생성 기법
