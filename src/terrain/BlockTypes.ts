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
}

export interface BlockData {
  isSolid: boolean;
  isTransparent: boolean;
  color: [number, number, number, number]; // RGBA 0-255
}

const BLOCK_DATA: Map<number, BlockData> = new Map();

function reg(type: BlockType, isSolid: boolean, isTransparent: boolean, r: number, g: number, b: number, a = 255): void {
  BLOCK_DATA.set(type, { isSolid, isTransparent, color: [r, g, b, a] });
}

// Air
reg(BlockType.AIR, false, true, 0, 0, 0, 0);

// Terrain
reg(BlockType.STONE, true, false, 128, 128, 128);
reg(BlockType.DIRT, true, false, 139, 90, 43);
reg(BlockType.GRASS_BLOCK, true, false, 86, 168, 57);
reg(BlockType.BEDROCK, true, false, 48, 48, 48);

// Sand/gravel
reg(BlockType.SAND, true, false, 219, 207, 163);
reg(BlockType.SANDSTONE, true, false, 216, 201, 149);
reg(BlockType.GRAVEL, true, false, 136, 126, 126);
reg(BlockType.CLAY, true, false, 160, 166, 179);

// Fluids
reg(BlockType.WATER, false, true, 32, 64, 200, 180);
reg(BlockType.LAVA, false, true, 207, 92, 15);

// Snow/ice
reg(BlockType.SNOW, false, false, 249, 255, 254);
reg(BlockType.ICE, true, true, 145, 183, 253, 200);

// Ores
reg(BlockType.COAL_ORE, true, false, 64, 64, 64);
reg(BlockType.IRON_ORE, true, false, 175, 140, 120);
reg(BlockType.GOLD_ORE, true, false, 247, 229, 103);
reg(BlockType.DIAMOND_ORE, true, false, 92, 219, 213);

// Wood
reg(BlockType.LOG, true, false, 102, 81, 51);
reg(BlockType.LEAVES, true, true, 56, 118, 29, 200);

// Stone variants
reg(BlockType.COBBLESTONE, true, false, 100, 100, 100);
reg(BlockType.MOSSY_COBBLESTONE, true, false, 90, 108, 90);

// Special
reg(BlockType.SPAWNER, true, true, 27, 42, 53);
reg(BlockType.CHEST, true, true, 164, 114, 39);

export function getBlockData(type: number): BlockData {
  return BLOCK_DATA.get(type) ?? BLOCK_DATA.get(BlockType.AIR)!;
}

export function isBlockSolid(type: number): boolean {
  return getBlockData(type).isSolid;
}

export function isBlockTransparent(type: number): boolean {
  return getBlockData(type).isTransparent;
}

export function isBlockAir(type: number): boolean {
  return type === BlockType.AIR;
}

export function getBlockColor(type: number): [number, number, number, number] {
  return getBlockData(type).color;
}

// All registered block types (for atlas generation)
export const ALL_BLOCK_TYPES: number[] = Array.from(BLOCK_DATA.keys()).filter(k => k !== BlockType.AIR);
