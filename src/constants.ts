// Chunk dimensions (structural, immutable)
export const CHUNK_WIDTH = 16;
export const CHUNK_HEIGHT = 128;
export const CHUNK_DEPTH = 16;
export const CHUNK_TOTAL_BLOCKS = CHUNK_WIDTH * CHUNK_HEIGHT * CHUNK_DEPTH;

// Atlas (structural)
export const TILE_SIZE = 16;
export const ATLAS_TILES = 16;
export const ATLAS_PIXEL_SIZE = TILE_SIZE * ATLAS_TILES;

// G-Buffer formats (GPU, immutable)
export const GBUFFER_ALBEDO_FORMAT: GPUTextureFormat = 'rgba8unorm';
export const GBUFFER_NORMAL_FORMAT: GPUTextureFormat = 'rgba16float';
export const GBUFFER_MATERIAL_FORMAT: GPUTextureFormat = 'rgba8unorm';
export const DEPTH_FORMAT: GPUTextureFormat = 'depth32float';
export const HDR_FORMAT: GPUTextureFormat = 'rgba16float';

// SSAO noise (structural)
export const SSAO_NOISE_SIZE = 4;

// TAA velocity buffer format
export const VELOCITY_FORMAT: GPUTextureFormat = 'rg16float';

// Luminance (auto exposure)
export const LUMINANCE_FORMAT: GPUTextureFormat = 'r16float';

// Point Lights (structural)
export const MAX_POINT_LIGHTS = 128;
