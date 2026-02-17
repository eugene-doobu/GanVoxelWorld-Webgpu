// Chunk dimensions
export const CHUNK_WIDTH = 16;
export const CHUNK_HEIGHT = 128;
export const CHUNK_DEPTH = 16;
export const CHUNK_TOTAL_BLOCKS = CHUNK_WIDTH * CHUNK_HEIGHT * CHUNK_DEPTH;

// Noise defaults
export const NOISE_OCTAVES = 4;
export const NOISE_PERSISTENCE = 0.5;
export const NOISE_LACUNARITY = 2.0;
export const NOISE_SCALE = 50.0;

// Terrain
export const SEA_LEVEL = 0;
export const MIN_HEIGHT = 1;
export const MAX_HEIGHT = 100;
export const DIRT_LAYER_DEPTH = 4;

// Biome
export const BIOME_SCALE = 200.0;

// Cave
export const CAVE_COUNT = 8;
export const CAVE_MIN_LENGTH = 50;
export const CAVE_MAX_LENGTH = 150;
export const CAVE_MIN_RADIUS = 1.5;
export const CAVE_MAX_RADIUS = 4.0;
export const CAVE_MIN_Y = 10;
export const CAVE_MAX_Y = 60;

// Trees
export const TREES_PER_CHUNK = 3;
export const MIN_TRUNK_HEIGHT = 4;
export const MAX_TRUNK_HEIGHT = 6;
export const LEAF_DECAY_CHANCE = 0.2;

// Atlas
export const TILE_SIZE = 16;
export const ATLAS_TILES = 16;
export const ATLAS_PIXEL_SIZE = TILE_SIZE * ATLAS_TILES;

// Rendering
export const DEFAULT_RENDER_DISTANCE = 8;
export const CHUNKS_PER_FRAME = 2;

// Camera
export const CAMERA_SPEED = 20.0;
export const CAMERA_FAST_SPEED = 60.0;
export const MOUSE_SENSITIVITY = 0.002;
export const CAMERA_FOV = 70 * (Math.PI / 180);
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 1000.0;

// Fog
export const FOG_START_RATIO = 0.75;
export const FOG_END_RATIO = 1.0;
