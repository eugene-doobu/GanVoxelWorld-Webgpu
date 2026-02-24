import { SeededRandom } from '../noise/SeededRandom';
import { Chunk } from './Chunk';
import { BlockType } from './BlockTypes';
import { BiomeType } from './BiomeTypes';
import { TerrainGenerator } from './TerrainGenerator';
import { CHUNK_WIDTH, CHUNK_HEIGHT, CHUNK_DEPTH } from '../constants';

const VEGETATION_DENSITY = 0.30;
const GRASS_RATIO = 0.80;
const POPPY_RATIO = 0.90;

export class VegetationGenerator {
  private seed: number;
  private terrainGen: TerrainGenerator | null;

  constructor(seed: number, terrainGen: TerrainGenerator | null = null) {
    this.seed = seed;
    this.terrainGen = terrainGen;
  }

  generate(chunk: Chunk): void {
    const chunkSeed = (this.seed ^ (chunk.chunkX * 198491317) ^ (chunk.chunkZ * 456123789)) | 0;
    const rng = new SeededRandom(chunkSeed);

    for (let x = 0; x < CHUNK_WIDTH; x++) {
      for (let z = 0; z < CHUNK_DEPTH; z++) {
        const surfaceY = this.findGrassSurface(chunk, x, z);
        if (surfaceY < 0) continue;
        if (surfaceY + 1 >= CHUNK_HEIGHT) continue;

        // Check biome filter
        const worldX = chunk.worldOffsetX + x;
        const worldZ = chunk.worldOffsetZ + z;
        if (!this.canPlaceVegetation(worldX, worldZ, surfaceY)) continue;

        // ~30% density
        if (rng.next() > VEGETATION_DENSITY) continue;

        // Above must be air
        if (chunk.getBlock(x, surfaceY + 1, z) !== BlockType.AIR) continue;

        // Distribution: 80% grass, 10% poppy, 10% dandelion
        const roll = rng.next();
        let vegType: number;
        if (roll < GRASS_RATIO) {
          vegType = BlockType.TALL_GRASS;
        } else if (roll < POPPY_RATIO) {
          vegType = BlockType.POPPY;
        } else {
          vegType = BlockType.DANDELION;
        }

        chunk.setBlock(x, surfaceY + 1, z, vegType);
      }
    }
  }

  private findGrassSurface(chunk: Chunk, x: number, z: number): number {
    for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
      if (chunk.getBlock(x, y, z) === BlockType.GRASS_BLOCK) {
        return y;
      }
    }
    return -1;
  }

  private canPlaceVegetation(worldX: number, worldZ: number, surfaceY: number): boolean {
    if (!this.terrainGen) return true;
    const biome = this.terrainGen.getBiome(worldX, worldZ, surfaceY);
    switch (biome) {
      case BiomeType.DESERT:
      case BiomeType.OCEAN:
      case BiomeType.TUNDRA:
      case BiomeType.MOUNTAINS:
        return false;
      default:
        return true;
    }
  }
}
