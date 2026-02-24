export const enum BlockType {
  AIR = 0,
  STONE = 1,
  DIRT = 2,
  GRASS_BLOCK = 3,
  BEDROCK = 4,
  SAND = 10,
  SANDSTONE = 11,
  GRAVEL = 12,
  CLAY = 13,
  WATER = 20,
  LAVA = 21,
  FLOWING_WATER = 22,
  SNOW = 30,
  ICE = 31,
  COAL_ORE = 40,
  IRON_ORE = 41,
  GOLD_ORE = 42,
  DIAMOND_ORE = 43,
  LOG = 50,
  LEAVES = 51,
  COBBLESTONE = 60,
  MOSSY_COBBLESTONE = 61,
  SPAWNER = 70,
  CHEST = 71,
  TALL_GRASS = 80,
  POPPY = 81,
  DANDELION = 82,
  PLANKS = 90,
  STONE_BRICKS = 91,
  GLASS = 92,
  TORCH = 93,
}

export interface BlockData {
  isSolid: boolean;
  color: [number, number, number, number]; // RGBA 0-255
  roughness: number;  // 0.0 (smooth) – 1.0 (rough)
  metallic: number;   // 0.0 (dielectric) – 1.0 (metal)
  emissive: number;   // 0.0 – 1.0 self-illumination intensity
}

const BLOCK_DATA: Map<number, BlockData> = new Map();

function reg(
  type: BlockType, isSolid: boolean,
  r: number, g: number, b: number, a = 255,
  roughness = 0.9, metallic = 0.0, emissive = 0.0,
): void {
  BLOCK_DATA.set(type, { isSolid, color: [r, g, b, a], roughness, metallic, emissive });
}

// Air                                              R    G    B    A    rough  metal  emis
reg(BlockType.AIR, false,                            0,   0,   0,   0);

// Terrain
reg(BlockType.STONE, true,                         128, 128, 128, 255,  0.85,  0.0,  0.0);
reg(BlockType.DIRT, true,                          139,  90,  43, 255,  0.95,  0.0,  0.0);
reg(BlockType.GRASS_BLOCK, true,                    86, 168,  57, 255,  0.90,  0.0,  0.0);
reg(BlockType.BEDROCK, true,                        48,  48,  48, 255,  0.95,  0.0,  0.0);

// Sand/gravel
reg(BlockType.SAND, true,                          219, 207, 163, 255,  0.95,  0.0,  0.0);
reg(BlockType.SANDSTONE, true,                     216, 201, 149, 255,  0.85,  0.0,  0.0);
reg(BlockType.GRAVEL, true,                        136, 126, 126, 255,  0.90,  0.0,  0.0);
reg(BlockType.CLAY, true,                          160, 166, 179, 255,  0.80,  0.0,  0.0);

// Fluids
reg(BlockType.WATER, false,                         32,  64, 200, 255,  0.10,  0.0,  0.0);
reg(BlockType.LAVA, true,                          207,  92,  15, 255,  0.90,  0.0,  1.0);
reg(BlockType.FLOWING_WATER, false,                 48,  90, 215, 255,  0.10,  0.0,  0.0);

// Snow/ice
reg(BlockType.SNOW, true,                          249, 255, 254, 255,  0.85,  0.0,  0.0);
reg(BlockType.ICE, true,                           145, 183, 253, 255,  0.15,  0.0,  0.0);

// Ores
reg(BlockType.COAL_ORE, true,                       64,  64,  64, 255,  0.85,  0.0,  0.0);
reg(BlockType.IRON_ORE, true,                      175, 140, 120, 255,  0.65,  0.3,  0.0);
reg(BlockType.GOLD_ORE, true,                      247, 229, 103, 255,  0.50,  0.7,  0.0);
reg(BlockType.DIAMOND_ORE, true,                    92, 219, 213, 255,  0.20,  0.1,  0.15);

// Wood
reg(BlockType.LOG, true,                           102,  81,  51, 255,  0.90,  0.0,  0.0);
reg(BlockType.LEAVES, true,                         36, 100,  18, 255,  0.85,  0.0,  0.0);

// Stone variants
reg(BlockType.COBBLESTONE, true,                   100, 100, 100, 255,  0.90,  0.0,  0.0);
reg(BlockType.MOSSY_COBBLESTONE, true,              90, 108,  90, 255,  0.88,  0.0,  0.0);

// Special
reg(BlockType.SPAWNER, true,                        27,  42,  53, 255,  0.60,  0.5,  0.10);
reg(BlockType.CHEST, true,                         164, 114,  39, 255,  0.80,  0.0,  0.0);

// Vegetation (non-solid, cross-mesh)
reg(BlockType.TALL_GRASS, false,                    58, 148,  40, 255,  0.95,  0.0,  0.0);
reg(BlockType.POPPY, false,                        200,  30,  30, 255,  0.90,  0.0,  0.0);
reg(BlockType.DANDELION, false,                    240, 210,  40, 255,  0.90,  0.0,  0.0);

// Village blocks
reg(BlockType.PLANKS, true,                        180, 144,  90, 255,  0.85,  0.0,  0.0);
reg(BlockType.STONE_BRICKS, true,                  120, 120, 120, 255,  0.80,  0.0,  0.0);
reg(BlockType.GLASS, true,                         180, 220, 240, 255,  0.10,  0.0,  0.0);
reg(BlockType.TORCH, false,                        255, 200,  80, 255,  0.70,  0.0,  0.85);

export const enum TorchFacing {
  FLOOR = 0,   // 바닥 위 (기본)
  NORTH = 1,   // +Z 벽 부착
  SOUTH = 2,   // -Z 벽 부착
  EAST  = 3,   // +X 벽 부착
  WEST  = 4,   // -X 벽 부착
}

export function isBlockTorch(type: number): boolean {
  return type === BlockType.TORCH;
}

export function getBlockData(type: number): BlockData {
  return BLOCK_DATA.get(type) ?? BLOCK_DATA.get(BlockType.AIR)!;
}

export function isBlockSolid(type: number): boolean {
  return getBlockData(type).isSolid;
}

export function isBlockAir(type: number): boolean {
  return type === BlockType.AIR;
}

export function getBlockColor(type: number): [number, number, number, number] {
  return getBlockData(type).color;
}

export function getBlockMaterial(type: number): { roughness: number; metallic: number; emissive: number } {
  const d = getBlockData(type);
  return { roughness: d.roughness, metallic: d.metallic, emissive: d.emissive };
}

export function isBlockWater(type: number): boolean {
  return type === BlockType.WATER || type === BlockType.FLOWING_WATER;
}

export function isBlockCutout(type: number): boolean {
  return type === BlockType.LEAVES || type === BlockType.TALL_GRASS || type === BlockType.POPPY || type === BlockType.DANDELION || type === BlockType.TORCH;
}

export function isBlockCrossMesh(type: number): boolean {
  return type === BlockType.TALL_GRASS || type === BlockType.POPPY || type === BlockType.DANDELION;
}

export function isBlockTranslucent(type: number): boolean {
  return type === BlockType.ICE;
}

// All registered block types (for atlas generation)
export const ALL_BLOCK_TYPES: number[] = Array.from(BLOCK_DATA.keys()).filter(k => k !== BlockType.AIR);
