# 비주얼 레퍼런스: SEUS (Sonic Ether's Unbelievable Shaders)

> SEUS 셰이더 팩의 렌더링 기법을 분석하고, 본 프로젝트의 현재 구현 상태와 비교하여 향후 비주얼 개선 방향을 제시합니다.

## 목차

- [SEUS 개요](#seus-개요)
- [SEUS 에디션별 기능 비교](#seus-에디션별-기능-비교)
- [현재 프로젝트 구현 현황](#현재-프로젝트-구현-현황)
- [기능별 상세 분석](#기능별-상세-분석)
  - [글로벌 일루미네이션 (GI)](#1-글로벌-일루미네이션-gi)
  - [그림자 (Shadows)](#2-그림자-shadows)
  - [반사 (Reflections)](#3-반사-reflections)
  - [물 렌더링 (Water)](#4-물-렌더링-water)
  - [대기 산란 (Atmospheric Scattering)](#5-대기-산란-atmospheric-scattering)
  - [볼류메트릭 효과 (Volumetric Effects)](#6-볼류메트릭-효과-volumetric-effects)
  - [블룸 및 톤매핑 (Bloom & Tone Mapping)](#7-블룸-및-톤매핑-bloom--tone-mapping)
  - [머티리얼 시스템 (Material/PBR)](#8-머티리얼-시스템-materialpbr)
  - [Temporal Anti-Aliasing (TAA)](#9-temporal-anti-aliasing-taa)
  - [Parallax Occlusion Mapping (POM)](#10-parallax-occlusion-mapping-pom)
- [구현 로드맵](#구현-로드맵)
- [참고 자료](#참고-자료)

---

## SEUS 개요

**SEUS** (Sonic Ether's Unbelievable Shaders)는 Minecraft용 셰이더 팩으로, 복셀 기반 렌더링에서 최고 수준의 비주얼을 달성한 레퍼런스입니다. 두 개의 주요 에디션이 있습니다:

### SEUS Renewed

전통적 래스터라이제이션 기반 렌더링으로, 합리적인 성능에서 높은 비주얼 품질을 제공합니다. 스크린 공간 기법과 대기 산란 모델을 활용하여, ray tracing 없이도 사실적인 조명과 분위기를 구현합니다.

### SEUS PTGI (Path Traced Global Illumination)

RTX 그래픽 카드 없이도 동작하는 **소프트웨어 기반 ray tracing** 구현이 핵심입니다. Shadow pass를 활용하여 월드를 복셀화(voxelize)하고, 이 복셀 데이터를 기반으로 path tracing을 수행합니다. SVGF (Spatiotemporal Variance-Guided Filtering) 디노이저로 노이즈를 제거하여 부드러운 GI 결과를 얻습니다.

---

## SEUS 에디션별 기능 비교

| 기능 | SEUS Renewed | SEUS PTGI HRR 3 |
|------|:---:|:---:|
| **글로벌 일루미네이션** | SSAO + Hemisphere ambient | Path Traced GI (복셀 기반) |
| **반사** | Screen-Space Reflections | Ray Traced Reflections |
| **그림자** | Shadow Mapping + 스크린 공간 접촉 그림자 | Shadow Mapping + Ray Traced 소프트 섀도 |
| **대기 산란** | Rayleigh/Mie 산란 (Spherical Harmonics) | Rayleigh/Mie 산란 |
| **볼류메트릭 라이팅** | God Rays (스크린 공간) | God Rays + 볼류메트릭 안개 |
| **볼류메트릭 구름** | 2D 개선 구름 | 3D 볼류메트릭 구름 |
| **물** | 반사/굴절/파동 | 반사/굴절/파동 + Caustics |
| **PBR** | Cook-Torrance + LabPBR | Cook-Torrance + LabPBR |
| **POM** | Parallax + Self-Shadowing | 새로운 POM 접근법 |
| **TAA** | Temporal Anti-Aliasing | Temporal Anti-Aliasing |
| **톤매핑** | 필름 톤매핑 | 재설계된 밝고 선명한 톤매핑 |
| **비/날씨** | Rain/Wet 효과 | Rain/Wet 효과 |
| **노멀 매핑** | 인공조명 노멀 매핑 포함 | 전체 노멀 매핑 |
| **성능** | 중간 (GTX 1060+) | 높은 요구 (GTX 1070+) |

---

## 현재 프로젝트 구현 현황

### 렌더링 파이프라인 요약

본 프로젝트는 WebGPU 기반 Deferred Rendering Pipeline을 사용하며, 다음 패스로 구성됩니다:

```
Shadow Pass → G-Buffer → SSAO → Lighting → SSR → Sky → Water →
Volumetric → Weather → TAA → Motion Blur → DoF → Auto Exposure → Bloom + Tone Map
```

HDR 후처리 체인은 **ping-pong 듀얼 텍스처** 시스템을 사용합니다. SSR, Motion Blur, DoF 패스는 하나의 HDR 텍스처에서 읽고 다른 텍스처에 쓴 뒤 swap하여, `copyTextureToTexture` 오버헤드를 제거합니다.

### 구현 상태 비교표

| 기능 | SEUS Renewed | SEUS PTGI | 현재 프로젝트 | 상태 |
|------|:---:|:---:|:---:|:---:|
| **Deferred Rendering** | O | O | O | 완료 |
| **Cook-Torrance PBR** | O | O | O | 완료 |
| **Cascaded Shadow Mapping** | O | O | O (3 cascades, PCF 3x3) | 완료 |
| **Screen-Space Contact Shadow** | O | - | O (screen-space ray march) | 완료 |
| **SSAO** | O | O | O (half-res, separable bilateral blur 2-pass) | 완료 |
| **Screen-Space Reflections** | O | O | O (32 steps, binary refine) | 완료 |
| **대기 산란 (Sky)** | O | O | O (Rayleigh + Mie) | 완료 |
| **볼류메트릭 구름** | 2D | 3D | O (16-step ray march) | 완료 |
| **God Rays** | O | O | O (스크린 공간, 16 steps) | 완료 |
| **물 렌더링** | O | O | O (4-octave waves, Beer's law) | 완료 |
| **Water Caustics** | - | O | 부분 (pseudo-random) | 기초적 |
| **Bloom** | O | O | O (multi-level Gaussian) | 완료 |
| **ACES 톤매핑** | O | O | O (+ 컬러 그레이딩) | 완료 |
| **Day/Night Cycle** | O | O | O (동적 태양 + 색상 전환) | 완료 |
| **날씨 시스템** | O | O | O (비/눈 파티클) | 완료 |
| **노멀 매핑** | O | O | O (탄젠트 공간 TBN) | 완료 |
| **절차적 텍스처** | - | - | O (Albedo + Material + Normal) | 완료 |
| **Vertex AO** | O | O | O (AO-aware 삼각형 분할) | 완료 |
| **Point Lights** | O | O | O (최대 128개, Deferred) | 완료 |
| **TAA** | O | O | O (Halton jitter, AABB history clamp, velocity buffer) | 완료 |
| **POM + Self-Shadow** | O | O | X | 미구현 |
| **Path Traced GI** | - | O | X | 미구현 |
| **Ray Traced Reflections** | - | O | X | 미구현 |
| **SVGF 디노이징** | - | O | X | 미구현 |
| **Spherical Harmonics Ambient** | O | - | X | 미구현 |
| **Rain/Wet 표면 효과** | O | O | X (파티클만 있음) | 미구현 |
| **볼류메트릭 안개** | - | O | X (선형 fog만) | 미구현 |

---

## 기능별 상세 분석

### 1. 글로벌 일루미네이션 (GI)

#### SEUS Renewed 접근법

Renewed는 래스터라이제이션 기반으로 GI를 근사합니다:

- **SSAO** — 스크린 공간에서 주변광 차폐를 계산하여 간접 조명의 어두운 영역을 근사
- **Spherical Harmonics (SH) Ambient** — 대기 산란으로 계산된 하늘색을 SH로 인코딩하여, 노멀 방향에 따라 정확한 환경 조명을 제공. 단순 hemisphere ambient보다 방향성이 있는 자연스러운 간접광
- **Reflective Shadow Maps (RSM)** — Minecraft 셰이더 커뮤니티에서 인기 있는 기법으로, 섀도 맵의 정보를 이용해 한 번 바운스된 간접광을 계산

#### SEUS PTGI 접근법

PTGI는 복셀 기반 path tracing으로 정확한 GI를 계산합니다:

```
1. Shadow pass를 활용해 월드 블록 정보를 복셀 맵(3D→2D 텍스처)으로 저장
   - 각 복셀의 텍스처 색상, 점유 상태, 발광 여부를 기록

2. Lighting pass에서 각 픽셀로부터 복셀 공간에서 ray를 발사
   - 빛이 블록에 부딪히면 해당 블록의 색상을 수집 (컬러 바운스)
   - 토치가 주황빛으로 벽을 물들이고, 잔디가 초록빛을 반사하는 효과

3. SVGF 디노이저로 시공간 필터링
   - 공간 필터: 주변 픽셀의 GI 값을 가중 평균 (법선/깊이 유사성 기반)
   - 시간 필터: 이전 프레임의 GI를 reprojection하여 재활용
   - 분산 추정: 노이즈가 많은 영역에 더 강한 필터 적용
```

#### 현재 프로젝트 상태

- **SSAO**: 구현 완료 (half-res, separable bilateral blur 2-pass)
- **Hemisphere Ambient**: 하늘/지면 2색 보간 — 방향성 제한적
- **GI 바운스 라이트**: 미구현

#### 개선 방향

| 단계 | 기법 | 효과 | 복잡도 |
|------|------|------|--------|
| 1단계 | **SH Ambient 업그레이드** | 노멀 기반 환경광 | 낮음 |
| 2단계 | **Reflective Shadow Maps** | 1-bounce 간접광 | 중간 |
| 3단계 | **Voxel Cone Tracing** | 다중 바운스 GI + 소프트 섀도 | 높음 |
| 4단계 | **복셀 공간 Path Tracing + SVGF** | PTGI 수준의 정확한 GI | 매우 높음 |

---

### 2. 그림자 (Shadows)

#### SEUS 접근법

**SEUS Renewed:**
- Cascaded Shadow Mapping (기본)
- **Screen-Space Contact Shadows** — 스크린 공간에서 짧은 ray march를 수행하여 shadow map이 놓치는 미세한 접촉 그림자를 추가. 풀, 난간 등 작은 오브젝트의 그림자가 선명해짐

**SEUS PTGI:**
- Shadow Mapping (기본)
- 복셀 공간 ray tracing으로 소프트 섀도 근사

#### 현재 프로젝트 상태

- **Cascaded Shadow Mapping**: 3 cascades, 2048x2048, PCF 3x3 완료
- **Contact Shadows**: 구현 완료 (screen-space ray march, Config에서 maxSteps/rayLength/thickness 설정 가능)

#### Screen-Space Contact Shadow 구현 (참고)

```
contact shadow 알고리즘:
1. G-Buffer에서 월드 위치 → 광원 방향으로 짧은 ray를 정의
2. 스크린 공간에서 ray march (8~16 steps, 짧은 거리)
3. 각 step에서 depth buffer와 비교하여 차폐 판정
4. shadow map 결과와 min() 연산으로 결합

장점:
- Shadow map의 해상도 한계를 보완
- 셀프 섀도우 아티팩트 없는 미세한 그림자
- 연산 비용이 낮음 (스크린 공간, 짧은 거리)
```

---

### 3. 반사 (Reflections)

#### SEUS Renewed 접근법

- **Screen-Space Reflections (SSR)** — 스크린 공간 ray march
- 화면에 보이지 않는 오브젝트의 반사는 실패 → fallback 필요

#### SEUS PTGI 접근법

- **Ray Traced Reflections** — 복셀 공간에서 ray tracing하여 화면 밖 오브젝트도 반사
- SSR을 우선 사용하고, SSR이 실패하는 영역에서 복셀 ray tracing으로 fallback하는 하이브리드 방식

#### 현재 프로젝트 상태

- **SSR**: 구현 완료 (32 steps, binary refinement 5 steps, roughness < 0.5)
- 화면 밖 반사 fallback: 미구현

#### 개선 방향

| 단계 | 기법 | 설명 |
|------|------|------|
| 1단계 | **SSR 품질 개선** | Hi-Z tracing으로 step 효율 향상, roughness 기반 blur |
| 2단계 | **Cubemap Fallback** | SSR 실패 시 환경 cubemap으로 fallback |
| 3단계 | **복셀 Specular Occlusion** | 복셀 데이터로 반사 차폐 근사 |
| 4단계 | **하이브리드 SSR + 복셀 Reflection** | 화면 밖 반사를 복셀 ray tracing으로 보완 |

---

### 4. 물 렌더링 (Water)

#### SEUS 접근법

**SEUS Renewed:**
- 표면 파동 시뮬레이션 (정현파 중첩)
- 스크린 공간 굴절 (distortion 기반)
- Fresnel 반사/투과 분리
- 수중 렌더링 효과 (안개, 색수차)

**SEUS PTGI HRR 3:**
- 위 기능 + **Water Caustics** — 수면의 굴절 패턴이 해저에 투영되는 빛 집중 효과. 물결에 의해 빛이 모이고 흩어지는 패턴이 수중 바닥에 어른거림

#### 현재 프로젝트 상태

- **파동**: 4-octave cosine waves (완료)
- **굴절**: 스크린 공간 distortion + Beer's Law 흡수 (완료)
- **반사**: Fresnel 기반 (완료)
- **Edge Foam**: 얕은 수심 밝기 (완료)
- **Caustics**: pseudo-random 진동 (기초적)

#### Caustics 개선 전략

실시간 Caustics 근사 기법:

```
방법 1: 텍스처 기반 Caustics (간단)
- 사전 생성된 caustics 텍스처를 시간에 따라 UV 스크롤
- 2~3개 레이어를 다른 속도/방향으로 블렌딩
- 수심에 따라 강도 감쇠

방법 2: 절차적 Caustics (중간)
- 물 표면의 노멀 맵으로 굴절 벡터 계산
- 굴절된 빛의 집중도를 수학적으로 근사
- 야코비안(Jacobian) 기반 집중/분산 계산

방법 3: Ray-Traced Caustics (고급)
- 수면에서 해저로 ray를 발사
- 복셀 공간에서 교차 계산 후 에너지 축적
- 가장 정확하지만 비용이 높음
```

---

### 5. 대기 산란 (Atmospheric Scattering)

#### SEUS 접근법

SEUS의 대기 시스템은 물리 기반 산란 모델의 정수입니다:

- **Rayleigh 산란** — 파장 의존적 산란으로 하늘이 파란 이유, 석양이 붉은 이유를 재현
  - 산란 계수: `β(λ) ∝ 1/λ⁴` (짧은 파장이 더 많이 산란)
  - 위상 함수: `P(θ) = 3/(16π) × (1 + cos²θ)`

- **Mie 산란** — 파장 비의존적, 태양 주변의 큰 후광과 안개 효과
  - Henyey-Greenstein 위상 함수: 전방 산란 우세
  - 비대칭 파라미터 g ≈ 0.76

- **Spherical Harmonics (SH) 인코딩** — 대기 산란 결과를 SH 계수로 압축하여, 임의의 노멀 방향에 대한 하늘 조명을 빠르게 조회. 이것이 Renewed의 "Accurate ambient sky lighting via Spherical Harmonics"의 핵심

- **원거리 대기 안개** — 먼 지형에 대기 산란을 적용하여 자연스러운 스케일감 ("New atmospheric scattering on distant land for a natural sense-of-scale")

#### 현재 프로젝트 상태

- **Rayleigh + Mie**: `sky.wgsl`에서 구현 완료
- **Sky 렌더링**: 구름 + 별 + 산란 완료
- **Fog**: 선형 거리 기반 fog (day/night 색상 보간)

#### 개선 방향

| 단계 | 기법 | 효과 |
|------|------|------|
| 1단계 | **대기 산란 기반 Fog 교체** | 선형 fog → 대기 산란 계산으로 원거리 안개 색상이 하늘과 일치 |
| 2단계 | **SH Ambient Lighting** | 하늘 산란을 SH로 인코딩하여 노멀 기반 환경광 |
| 3단계 | **Aerial Perspective** | 거리에 따른 대기 산란 누적으로 원경 블루시프트 |

---

### 6. 볼류메트릭 효과 (Volumetric Effects)

#### SEUS 접근법

**God Rays (Crepuscular Rays):**
- 태양 방향으로 스크린 공간 ray march
- 각 step에서 shadow map을 샘플링하여 빛이 통과하는지 판정
- 안개/먼지 입자에 의한 산란 시뮬레이션

**볼류메트릭 안개 (PTGI):**
- 복셀 공간 ray tracing으로 정확한 빛 차폐 계산
- 대기 밀도 함수에 따른 산란/흡수
- 동적 안개 밀도 (날씨, 고도, 바이옴에 따라 변화)

**볼류메트릭 구름 (PTGI HRR 3):**
- 3D 노이즈 기반 구름 밀도 함수
- Ray march로 구름 내부 밀도 적분
- Beer-Powder 함수로 밝은 가장자리 효과 (silver lining)
- 다중 산란 근사 (octave 기반)

#### 현재 프로젝트 상태

- **God Rays**: 스크린 공간 ray march 구현 (density=0.35, g=0.6, 16 steps)
- **볼류메트릭 구름**: 16-step ray march, 해시 기반 밀도 (200~350 고도)
- **볼류메트릭 안개**: 미구현 (선형 fog만)

#### 개선 방향

```
볼류메트릭 안개 구현 전략:

1. Froxel (Frustum-Aligned Voxel) 기법:
   - 카메라 프러스텀을 3D 격자로 분할 (예: 160×90×64)
   - 각 프록셀에서 광원 가시성 × 산란 계수 계산
   - z축은 로그 스케일로 분할 (가까운 곳에 더 세밀한 해상도)
   - ray march 결과를 3D 텍스처에 저장 후, fragment shader에서 조회

2. 성능 최적화:
   - Temporal reprojection으로 프레임간 결과 재활용
   - 주변 프록셀 jittering으로 해상도 보간
   - Half-resolution 계산 후 bilateral upsample
```

---

### 7. 블룸 및 톤매핑 (Bloom & Tone Mapping)

#### SEUS 접근법

**Bloom:**
- 밝은 픽셀을 추출하여 다단계 다운샘플/업샘플 blur
- PTGI HRR 3에서 개선된 에너지 보존 반사 필터

**Tone Mapping:**
- SEUS PTGI HRR 3: 밝고 선명한 느낌으로 재설계된 톤매핑
- 색상 온도, 채도, 콘트라스트 조절

#### 현재 프로젝트 상태

- **Bloom**: Multi-level Gaussian pyramid (threshold → downsample chain → upsample chain) 완료
- **Tone Mapping**: ACES Filmic (Narkowicz 근사) + 컬러 그레이딩 완료
  - 색 온도 (주간 따뜻함 → 야간 차가움)
  - 일출/일몰 황금빛 틴트
  - Vibrance (채도 부스트)
  - 소프트 콘트라스트 S-커브

**평가**: 현재 구현이 SEUS 수준에 근접. 추가 개선은 선택적.

#### 선택적 개선

- **Bloom 개선**: 렌즈 더트 효과 추가 (색수차는 이미 구현됨)
- **자동 노출 (Auto Exposure)**: 구현 완료 — 평균 휘도 추출 → 다운샘플 피라미드 → 시간 적응형 노출
- **Motion Blur**: 구현 완료 — 속도 기반 per-pixel blur
- **Depth of Field**: 구현 완료 — signed CoC + Fibonacci spiral 32-sample

---

### 8. 머티리얼 시스템 (Material/PBR)

#### SEUS 접근법

SEUS는 **LabPBR** 머티리얼 포맷을 지원합니다:

- **Specular Map (R)**: Perceptual smoothness (roughness = (1 - smoothness)²)
- **Specular Map (G)**: F0 (기본 반사율) — 금속과 유전체를 F0 값으로 구분
- **Specular Map (B)**: Porosity (다공성) / SSS (Subsurface Scattering)
- **Specular Map (A)**: Emissive 강도

BRDF는 **Cook-Torrance** 기반:
- **D (Normal Distribution)**: GGX/Trowbridge-Reitz
- **G (Geometry)**: Smith-Schlick (height-correlated)
- **F (Fresnel)**: Schlick 근사

#### 현재 프로젝트 상태

- **BRDF**: Cook-Torrance (GGX + Smith-Schlick + Schlick Fresnel) 완료
- **Material Map**: roughness, metallic, emissive (절차적 생성)
- **Vertex AO**: 메시 생성 시 사전 계산 완료

**평가**: PBR 파이프라인이 탄탄하게 구현됨. SSS, Porosity는 고급 기능.

#### 선택적 개선

| 기능 | 설명 | 복잡도 |
|------|------|--------|
| **Emissive Bloom 연동** | 발광 블록의 emissive 값을 bloom threshold에 직접 연동 | 낮음 |
| **Subsurface Scattering** | 나뭇잎, 피부 등에 빛 투과 효과 (간단한 wrap lighting) | 중간 |
| **Porosity / Wet Surfaces** | 비 올 때 roughness 감소 + albedo 어두워짐 | 중간 |

---

### 9. Temporal Anti-Aliasing (TAA)

#### SEUS 접근법

SEUS Renewed와 PTGI 모두 "Super smooth Temporal Anti-Aliasing"을 탑재합니다. TAA는 다음의 핵심 역할을 합니다:

- **앨리어싱 제거**: 서브픽셀 지터링 + 시간 누적으로 슈퍼샘플링 효과
- **PTGI에서 필수**: Path tracing의 노이즈를 시간 축에서 평활화
- **SSR 안정화**: 프레임간 반사 결과를 누적하여 깜빡임 제거

#### TAA 구현 전략

```
TAA 알고리즘:

1. Jitter:
   - 매 프레임 projection matrix에 서브픽셀 오프셋 추가
   - Halton 시퀀스 (2, 3) 사용으로 균일한 분포

2. History Reprojection:
   - 현재 픽셀의 월드 위치를 이전 프레임의 view-projection으로 변환
   - 이전 프레임 텍스처에서 해당 위치의 색상을 샘플링

3. Neighborhood Clamping:
   - 현재 프레임 픽셀의 3x3 이웃에서 min/max 색상 범위 계산
   - history 색상을 이 범위로 클램핑 (고스팅 방지)

4. Blending:
   - result = lerp(history_clamped, current, α)
   - α ≈ 0.05~0.1 (대부분 이전 프레임 유지)
   - 속도가 빠르거나 차폐 변화 시 α 증가 (현재 프레임 가중)

필요 리소스:
- History color texture (이전 프레임 결과)
- Motion vector buffer (또는 depth + camera matrix로 계산)
- Jitter offset uniform
```

**현재 상태: 구현 완료** — TAA.ts에서 Halton 시퀀스 jitter, velocity buffer, 3x3 neighborhood AABB clamping, history blend가 모두 구현되어 있습니다. Bind group은 ping-pong 양쪽으로 캐싱되어 프레임당 재생성을 방지합니다.

---

### 10. Parallax Occlusion Mapping (POM)

#### SEUS 접근법

- **Parallax Occlusion Mapping**: height map 기반으로 표면에 깊이감을 부여
- **Self-Shadowing**: POM 표면에서 광원 방향으로 추가 ray march하여 자체 그림자 계산
- SEUS PTGI HRR 3에서 "totally new approach" 도입

#### 현재 프로젝트 상태

- 노멀 매핑은 구현되어 있으나 POM은 미구현
- 절차적 텍스처 시스템에 height map 생성 로직이 이미 존재 (노멀 맵 유도에 사용)

#### POM 구현 전략

```
POM 알고리즘 (기본):

1. 시선 벡터를 탄젠트 공간으로 변환
2. Height map을 따라 ray march:
   - 시작: UV에서 시선 방향으로 진행
   - 각 step에서 height map 샘플링
   - ray 높이 < surface 높이가 되는 지점에서 교차 판정
3. 교차점의 UV를 사용하여 albedo/normal/material 샘플링

Self-Shadowing 추가:
1. 교차점에서 광원 방향으로 두 번째 ray march
2. 중간에 surface보다 높은 점이 있으면 그림자

복셀 엔진에서의 이점:
- Height map이 이미 절차적으로 생성됨
- 블록 면이 축 정렬이라 탄젠트 공간 계산이 단순
- 돌, 벽돌 등에 극적인 깊이감 추가 가능
```

---

## 구현 로드맵

현재 프로젝트의 완성도를 감안하여, SEUS 수준의 비주얼에 도달하기 위한 단계별 로드맵입니다.

### Phase 1: 핵심 품질 개선 (중간 난이도)

기존 파이프라인의 빈틈을 채우는 단계입니다.

| 순서 | 기능 | 효과 | 난이도 | 의존성 |
|:---:|------|------|:---:|------|
| ~~1~~ | ~~**TAA**~~ | ~~앨리어싱 제거, 전체적 매끄러움~~ | ~~중~~ | **완료** |
| ~~2~~ | ~~**Screen-Space Contact Shadow**~~ | ~~미세 오브젝트 그림자~~ | ~~낮~~ | **완료** |
| 3 | **대기 산란 기반 Fog** | 원경 색상이 하늘과 일치 | 낮 | 없음 |
| ~~4~~ | ~~**Auto Exposure**~~ | ~~동굴/야외 밝기 적응~~ | ~~낮~~ | **완료** |

### Phase 2: 몰입감 강화 (중~높은 난이도)

환경 상호작용과 물리 기반 효과를 추가합니다.

| 순서 | 기능 | 효과 | 난이도 | 의존성 |
|:---:|------|------|:---:|------|
| 5 | **POM + Self-Shadow** | 블록 표면 깊이감 | 중 | 없음 |
| 6 | **절차적 Water Caustics** | 사실적 수중 빛 패턴 | 중 | 없음 |
| 7 | **Rain/Wet Surface Effect** | 젖은 표면 광택 변화 | 중 | 날씨 시스템 |
| 8 | **볼류메트릭 안개 (Froxel)** | 3D 안개 + 광원 산란 | 높 | 없음 |

### Phase 3: 고급 조명 (높은 난이도)

글로벌 일루미네이션과 고급 반사를 구현합니다.

| 순서 | 기능 | 효과 | 난이도 | 의존성 |
|:---:|------|------|:---:|------|
| 9 | **SH Ambient 업그레이드** | 방향성 있는 환경광 | 중 | 대기 산란 |
| 10 | **SSR Hi-Z Tracing** | 더 빠르고 정확한 반사 | 중 | TAA |
| 11 | **Reflective Shadow Maps** | 1-bounce 간접광 | 높 | 없음 |
| 12 | **월드 복셀화** | GI/반사의 기반 데이터 | 높 | 없음 |

### Phase 4: PTGI 수준 (매우 높은 난이도)

Path tracing 기반 GI와 ray traced 반사를 구현합니다.

| 순서 | 기능 | 효과 | 난이도 | 의존성 |
|:---:|------|------|:---:|------|
| 13 | **복셀 기반 Path Traced GI** | 정확한 컬러 바운스 라이팅 | 매우 높 | 월드 복셀화 |
| 14 | **SVGF 디노이저** | Path tracing 노이즈 제거 | 높 | TAA, Path Traced GI |
| 15 | **Ray Traced Reflections** | 화면 밖 반사 | 높 | 월드 복셀화 |
| 16 | **Ray Traced Soft Shadows** | 반그림자(penumbra) | 높 | 월드 복셀화 |

---

## 참고 자료

### SEUS 공식

- [SEUS 공식 사이트 — Sonic Ether](https://www.sonicether.com/seus/) — SEUS Renewed, PTGI 다운로드 및 개요
- [SEUS PTGI HRR 3 — Patreon](https://www.patreon.com/posts/download-seus-3-60268558) — 최신 PTGI HRR 3 릴리즈 및 변경사항
- [SEUS PTGI GFME — GitHub](https://github.com/GeForceLegend/SEUS_PTGI_GFME) — PTGI 수정 에디션, per-pixel path tracing 등

### 복셀 GI 기법

- [Voxagon Blog — From Screen Space to Voxel Space](https://blog.voxagon.se/2018/10/17/from-screen-space-to-voxel-space.html) — 복셀 기반 ray tracing, shadow voxelization, 볼류메트릭 안개의 기술적 구현
- [Wicked Engine — Voxel-based Global Illumination](https://wickedengine.net/2017/08/voxel-based-global-illumination/) — Voxel Cone Tracing 기반 GI 구현

### PBR 및 조명

- [LearnOpenGL — PBR Theory](https://learnopengl.com/PBR/Theory) — Cook-Torrance BRDF, 마이크로패싯 이론
- [Notes on PBR in Minecraft — jbritain.net](https://jbritain.net/blog/pbr-in-minecraft) — Minecraft 셰이더에서의 PBR 구현, LabPBR, RSM, SSR
- [Coding Labs — Cook-Torrance](https://www.codinglabs.net/article_physically_based_rendering_cook_torrance.aspx) — Cook-Torrance BRDF 수학적 설명

### 대기 산란

- [glsl-atmosphere — GitHub](https://github.com/wwwtyro/glsl-atmosphere) — GLSL Rayleigh/Mie 산란 구현
- [Alan Zucconi — Volumetric Atmospheric Scattering](https://www.alanzucconi.com/2017/10/10/atmospheric-scattering-1/) — 대기 산란 이론과 구현 시리즈

### 디노이징

- [Ray Tracing Denoising — alain.xyz](https://alain.xyz/blog/ray-tracing-denoising) — SVGF, A-Trous 필터 등 RT 디노이징 기법 총정리

### 셰이더 팩 분석

- [SEUS PTGI 상세 분석 — 9Minecraft](https://www.9minecraft.net/seus-ptgi-shaders-pack/) — PTGI 기능 목록 및 스크린샷
- [SEUS Renewed 상세 분석 — 9Minecraft](https://www.9minecraft.net/seus-renewed-shaders-mod/) — Renewed 기능 목록 및 스크린샷
- [SEUS Renewed — Shader Packs](https://shaderpacks.net/seus-renewed/) — 기능 요약 및 호환성 정보
