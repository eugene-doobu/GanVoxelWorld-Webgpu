# GanVoxelWorld WebGPU

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![WebGPU](https://img.shields.io/badge/WebGPU-WGSL-4285f4?logo=webgl&logoColor=white)](https://www.w3.org/TR/webgpu/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

A WebGPU-powered voxel terrain rendering engine built with TypeScript and WGSL.
Focused on **rendering quality** and **visual effects** -- not gameplay.

> **Browser Compatibility**: WebGPU is required. Use **Chrome 113+** or **Edge 113+**. Firefox and Safari do not yet have stable WebGPU support.

[![YouTube](https://img.youtube.com/vi/eubqsKFgO3M/maxresdefault.jpg)](https://youtu.be/eubqsKFgO3M)

## Why This Project?

Most voxel engines prioritize gameplay mechanics. This project takes the opposite approach: **treat voxel terrain as a canvas for modern real-time rendering techniques**.

- Implements a full **deferred rendering pipeline** from scratch in a browser, using the new WebGPU API
- Combines techniques typically found in AAA engines -- PCSS shadows, SSAO, SSR, TAA, volumetric clouds -- all in WGSL
- Designed as a **learning reference**: every system is documented with design rationale in `docs/`
- Zero dependencies beyond `gl-matrix` and Vite -- no rendering framework, no engine abstraction

If you want to understand how a modern rendering pipeline is assembled piece by piece, this codebase is meant to show you.

## Features

### Rendering Pipeline
- **Deferred shading** with G-Buffer (albedo, normals, material properties)
- **Cascaded shadow maps** with PCF / PCSS soft shadows
- **Screen-space ambient occlusion** (SSAO) with blur pass
- **Screen-space reflections** (SSR) with binary refinement
- **Contact shadows** for fine-detail shadowing
- **Point lights** from emissive blocks (up to 128)

### Sky & Atmosphere
- **Dynamic day/night cycle** with sun, moon, stars, and nebula
- **Atmospheric scattering** with Rayleigh/Mie phase functions
- **Volumetric ray-marched clouds** (SEUS-style) with procedural Simplex-Worley FBM noise
- **Temporal reprojection** for cloud stability at half resolution
- **Meteors** and procedural star field

### Post-Processing
- **Bloom** with threshold extraction and mip-chain blur
- **Depth of Field** (DoF) with bokeh
- **Motion blur** from per-pixel velocity
- **Temporal anti-aliasing** (TAA)
- **Auto exposure** with luminance adaptation
- **Tone mapping**, vignette, and chromatic aberration

### Terrain Generation
- **Simplex noise**-based procedural heightmap with FBM octaves
- **Biome system** driven by temperature, humidity, and continentalness
- Caves, ores, trees, and vegetation generators
- **Water simulation** with dynamic water table
- Village generation

### GPU Optimization (6-Phase Pipeline)
1. **Greedy meshing** -- merges coplanar faces with matching block type and AO
2. **Bitmask skip** -- 4x4x4 sub-block occupancy masks to skip empty regions
3. **Mega buffer** -- single GPU buffer with free-list allocator for all chunks
4. **LOD** -- 2x/4x/8x majority-vote downsampled meshes for distant chunks
5. **Hi-Z culling** -- depth mip-chain occlusion culling via compute shader
6. **Sub-block compression** -- uniform sub-blocks stored as 1 byte

### Inspector Panel
- Unity-style settings panel with 4 tabs: Terrain, Rendering, Camera, Environment
- Real-time sliders, toggles, and dropdowns for all engine parameters
- Press **F1** to toggle (or click the gear icon)

## Requirements

| | Requirement |
|---|---|
| **Browser** | Chrome 113+ or Edge 113+ (**WebGPU required** -- Firefox/Safari not supported) |
| **GPU** | Any GPU with WebGPU driver support (integrated GPUs work) |
| **Node.js** | 18+ (for local development only) |

## Getting Started

```bash
git clone https://github.com/eugene-doobu/GanVoxelWorld-Webgpu.git
cd GanVoxelWorld-Webgpu
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in a WebGPU-capable browser.

### Build for Production

```bash
npm run build
npm run preview
```

## Controls

| Key | Action |
|---|---|
| **WASD** | Move horizontally |
| **E / Space** | Move up |
| **Q / C** | Move down |
| **Right mouse + drag** | Look around |
| **Scroll wheel** | Adjust movement speed |
| **Shift** | Fast movement |
| **F1** | Toggle inspector panel |
| **H** | Toggle HUD |

## Architecture

```
src/
+-- main.ts                  # Entry point and render loop
+-- constants.ts             # Immutable GPU/structural constants
+-- config/Config.ts         # Reactive singleton with pub/sub + dirty tracking
|
+-- renderer/
|   +-- DeferredPipeline.ts  # Orchestrates the full deferred rendering pipeline
|   +-- GBuffer.ts           # G-Buffer texture management
|   +-- ShadowMap.ts         # Cascaded shadow maps
|   +-- SSAO.ts              # Screen-space ambient occlusion
|   +-- PostProcess.ts       # Bloom, tone mapping, vignette, etc.
|   +-- TAA.ts               # Temporal anti-aliasing
|   +-- VolumetricClouds.ts  # Ray-marched clouds with temporal reprojection
|   +-- HiZBuffer.ts         # Hierarchical depth buffer for occlusion culling
|   +-- MegaBuffer.ts        # Single GPU buffer allocator for chunk geometry
|   +-- IndirectRenderer.ts  # Indirect draw call management
|   +-- TextureAtlas.ts      # Block texture atlas generation
|   \-- WebGPUContext.ts     # GPUDevice / GPUCanvasContext wrapper
|
+-- terrain/
|   +-- ChunkManager.ts      # Chunk loading, unloading, and draw call management
|   +-- Chunk.ts             # Single chunk data structure with compression
|   +-- BlockTypes.ts        # Block type enum and material properties
|   +-- TerrainGenerator.ts  # Simplex noise heightmap generation
|   +-- BiomeTypes.ts        # Biome definitions
|   +-- CaveGenerator.ts     # Cave carving
|   +-- OreGenerator.ts      # Ore vein placement
|   +-- TreeGenerator.ts     # Tree structure generation
|   +-- VegetationGenerator.ts # Grass, flowers (cross-mesh billboards)
|   +-- VillageGenerator.ts  # Village structure placement
|   \-- WaterSimulator.ts    # Water level and flow
|
+-- meshing/
|   +-- MeshBuilder.ts       # Voxel-to-vertex conversion (greedy meshing, AO)
|   \-- LODGenerator.ts      # Multi-level LOD mesh generation
|
+-- shaders/                 # All WGSL shader files
|   +-- common/              # Shared modules (noise, phase functions, etc.)
|   +-- gbuffer.*.wgsl       # G-Buffer vertex/fragment
|   +-- lighting.wgsl        # Deferred lighting pass
|   +-- sky.wgsl             # Sky rendering orchestrator
|   +-- cloud_*.wgsl         # Volumetric cloud shaders
|   +-- water.*.wgsl         # Water forward pass
|   \-- ...                  # SSAO, bloom, TAA, DoF, motion blur, etc.
|
+-- noise/
|   +-- SimplexNoise.ts      # CPU-side Simplex noise (seeded permutation table)
|   \-- SeededRandom.ts      # Deterministic PRNG
|
+-- world/
|   +-- DayNightCycle.ts     # Sun/moon position and time progression
|   \-- WeatherSystem.ts     # Weather state management
|
+-- camera/
|   \-- FlyCamera.ts         # FPS-style fly camera with configurable speed
|
\-- ui/
    +-- HUD.ts               # Debug overlay (position, chunks, FPS)
    \-- inspector/            # Unity-style settings panel (4 tabs)
```

The **Config** system (`src/config/Config.ts`) acts as a centralized reactive store. Terrain generators read config in their constructors; rendering parameters are read at render time for immediate feedback. The Inspector panel writes to Config, and subscribed systems react automatically.

WGSL shaders use a custom `#include` preprocessor (handled by Vite's `?raw` imports and string concatenation) to share common code like noise functions, scene uniforms, and phase functions.

## Known Limitations

- **No multiplayer / server-side logic** -- purely client-side rendering engine
- **No runtime block editing** -- terrain is generated once; the focus is rendering, not gameplay
- **WebGPU only** -- no WebGL fallback; requires Chrome 113+ or Edge 113+
- **High VRAM usage** -- mega buffer and 3D cloud noise textures can use 500 MB+ on large render distances
- **Single-threaded JS** -- chunk meshing runs on the main thread; very large worlds may cause frame stutters during generation

## Tech Stack

| Category | Technology |
|---|---|
| **GPU API** | WebGPU + WGSL |
| **Language** | TypeScript (strict mode) |
| **Build** | Vite 6 |
| **Math** | gl-matrix |
| **Target** | ES2022 |

## Documentation

Detailed design documents are available in the `docs/` directory:

- **[`docs/learning/`](./docs/learning/)** -- Step-by-step engine walkthrough
  - [Phase 1: Engine Overview](./docs/learning/phase1-engine-overview.md)
  - [Phase 2: Rendering Pipeline](./docs/learning/phase2-rendering-pipeline.md)
  - [Phase 3: World Generation](./docs/learning/phase3-world-generation.md)
  - [Phase 4: System Integration](./docs/learning/phase4-system-integration.md)
- **[`docs/reference/`](./docs/reference/)** -- Technical reference
  - [Voxel Rendering Pipeline](./docs/reference/voxel-rendering-pipeline.md)
  - [Voxel Optimization](./docs/reference/voxel-optimization.md)
  - [Chunk Compression](./docs/reference/chunk-compression.md)
  - [Biome System](./docs/reference/biome-system.md)
  - [Noise Reference](./docs/reference/noise-reference.md)
  - [Alpha Cutout](./docs/reference/alpha-cutout.md)

## License

This project is licensed under the [MIT License](./LICENSE).
