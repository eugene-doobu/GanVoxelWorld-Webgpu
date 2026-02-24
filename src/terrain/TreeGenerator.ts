import { SeededRandom } from '../noise/SeededRandom';
import { Chunk } from './Chunk';
import { BlockType } from './BlockTypes';
import { BiomeType } from './BiomeTypes';
import { TerrainGenerator } from './TerrainGenerator';
import { CHUNK_WIDTH, CHUNK_HEIGHT, CHUNK_DEPTH } from '../constants';
import { Config } from '../config/Config';

const FOREST_DENSITY_MULTIPLIER = 3;
const SPARSE_BIOME_SHIFT = 1;
const MAX_ATTEMPTS_MULTIPLIER = 4;
const TREE_CLEARANCE_HEIGHT = 8;
const TUNDRA_REJECT_THRESHOLD = 0.5;
const MOUNTAINS_REJECT_THRESHOLD = 0.3;

export class TreeGenerator {
  private seed: number;
  private terrainGen: TerrainGenerator | null;

  constructor(seed: number, terrainGen: TerrainGenerator | null = null) {
    this.seed = seed;
    this.terrainGen = terrainGen;
  }

  generate(chunk: Chunk): void {
    const trees = Config.data.terrain.trees;
    const chunkSeed = (this.seed ^ (chunk.chunkX * 341873128) ^ (chunk.chunkZ * 132897987)) | 0;
    const rng = new SeededRandom(chunkSeed);

    const maxTrees = this.getMaxTreesForChunk(chunk, rng);
    const maxAttempts = trees.perChunk * MAX_ATTEMPTS_MULTIPLIER;
    let treesPlaced = 0;

    for (let i = 0; i < maxAttempts && treesPlaced < maxTrees; i++) {
      const x = rng.nextInt(2, CHUNK_WIDTH - 2);
      const z = rng.nextInt(2, CHUNK_DEPTH - 2);

      const surfaceY = this.findSurfaceY(chunk, x, z);
      if (surfaceY < 0) continue;

      const worldX = chunk.worldOffsetX + x;
      const worldZ = chunk.worldOffsetZ + z;

      if (!this.canPlaceTreeAtBiome(worldX, worldZ, surfaceY, rng)) continue;
      if (!this.canPlaceTree(chunk, x, surfaceY, z)) continue;

      const trunkHeight = rng.nextInt(trees.minTrunkHeight, trees.maxTrunkHeight + 1);
      this.placeOakTree(chunk, x, surfaceY + 1, z, trunkHeight, rng);
      treesPlaced++;
    }
  }

  private getMaxTreesForChunk(chunk: Chunk, rng: SeededRandom): number {
    const perChunk = Config.data.terrain.trees.perChunk;
    if (!this.terrainGen) return perChunk;

    const centerX = chunk.worldOffsetX + (CHUNK_WIDTH >> 1);
    const centerZ = chunk.worldOffsetZ + (CHUNK_DEPTH >> 1);
    const biome = this.terrainGen.getBiome(centerX, centerZ, 64);

    switch (biome) {
      case BiomeType.FOREST: return perChunk * FOREST_DENSITY_MULTIPLIER;
      case BiomeType.PLAINS: return perChunk;
      case BiomeType.TUNDRA: return Math.max(1, perChunk >> SPARSE_BIOME_SHIFT);
      case BiomeType.MOUNTAINS: return Math.max(1, perChunk >> SPARSE_BIOME_SHIFT);
      case BiomeType.DESERT: return 0;
      case BiomeType.OCEAN: return 0;
      default: return perChunk;
    }
  }

  private canPlaceTreeAtBiome(worldX: number, worldZ: number, surfaceY: number, rng: SeededRandom): boolean {
    if (!this.terrainGen) return true;
    const biome = this.terrainGen.getBiome(worldX, worldZ, surfaceY);
    switch (biome) {
      case BiomeType.DESERT: return false;
      case BiomeType.OCEAN: return false;
      case BiomeType.TUNDRA: return rng.next() > TUNDRA_REJECT_THRESHOLD;
      case BiomeType.MOUNTAINS: return rng.next() > MOUNTAINS_REJECT_THRESHOLD;
      default: return true;
    }
  }

  private findSurfaceY(chunk: Chunk, x: number, z: number): number {
    for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
      const block = chunk.getBlock(x, y, z);
      if (block === BlockType.GRASS_BLOCK || block === BlockType.DIRT || block === BlockType.SNOW) {
        return y;
      }
    }
    return -1;
  }

  private canPlaceTree(chunk: Chunk, x: number, surfaceY: number, z: number): boolean {
    const surfaceBlock = chunk.getBlock(x, surfaceY, z);
    if (surfaceBlock !== BlockType.GRASS_BLOCK && surfaceBlock !== BlockType.SNOW) return false;

    for (let y = surfaceY + 1; y < surfaceY + TREE_CLEARANCE_HEIGHT && y < CHUNK_HEIGHT; y++) {
      if (chunk.getBlock(x, y, z) !== BlockType.AIR) return false;
    }
    return true;
  }

  private placeOakTree(chunk: Chunk, x: number, baseY: number, z: number, trunkHeight: number, rng: SeededRandom): void {
    const leafDecay = Config.data.terrain.trees.leafDecayChance;
    chunk.setBlock(x, baseY - 1, z, BlockType.DIRT);

    for (let y = 0; y < trunkHeight; y++) {
      chunk.setBlock(x, baseY + y, z, BlockType.LOG);
    }

    const leafBaseY = baseY + trunkHeight - 2;
    this.placeLeafLayer(chunk, x, leafBaseY, z, 2, rng, leafDecay);
    this.placeLeafLayer(chunk, x, leafBaseY + 1, z, 2, rng, leafDecay);
    this.placeLeafLayer(chunk, x, leafBaseY + 2, z, 1, rng, leafDecay);
    this.placeLeafLayerTop(chunk, x, leafBaseY + 3, z, rng, leafDecay);
  }

  private placeLeafLayer(chunk: Chunk, cx: number, y: number, cz: number, radius: number, rng: SeededRandom, leafDecay: number): void {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        if (Math.abs(dx) === radius && Math.abs(dz) === radius) {
          if (rng.next() < leafDecay) continue;
        }
        const bx = cx + dx, bz = cz + dz;
        if (!chunk.isInBounds(bx, y, bz)) continue;
        if (chunk.getBlock(bx, y, bz) === BlockType.AIR) {
          chunk.setBlock(bx, y, bz, BlockType.LEAVES);
        }
      }
    }
  }

  private placeLeafLayerTop(chunk: Chunk, cx: number, y: number, cz: number, rng: SeededRandom, leafDecay: number): void {
    this.tryPlaceLeaf(chunk, cx, y, cz);
    if (rng.next() > leafDecay) this.tryPlaceLeaf(chunk, cx + 1, y, cz);
    if (rng.next() > leafDecay) this.tryPlaceLeaf(chunk, cx - 1, y, cz);
    if (rng.next() > leafDecay) this.tryPlaceLeaf(chunk, cx, y, cz + 1);
    if (rng.next() > leafDecay) this.tryPlaceLeaf(chunk, cx, y, cz - 1);
  }

  private tryPlaceLeaf(chunk: Chunk, x: number, y: number, z: number): void {
    if (!chunk.isInBounds(x, y, z)) return;
    if (chunk.getBlock(x, y, z) === BlockType.AIR) {
      chunk.setBlock(x, y, z, BlockType.LEAVES);
    }
  }
}
