import { SeededRandom } from '../noise/SeededRandom';
import { Chunk } from './Chunk';
import { BlockType } from './BlockTypes';
import { CHUNK_WIDTH, CHUNK_HEIGHT, CHUNK_DEPTH } from '../constants';

interface OreSettings {
  oreType: number;
  minY: number;
  maxY: number;
  attemptsPerChunk: number;
  veinSize: number;
}

const DEFAULT_ORES: OreSettings[] = [
  { oreType: BlockType.COAL_ORE, minY: 5, maxY: 128, attemptsPerChunk: 20, veinSize: 8 },
  { oreType: BlockType.IRON_ORE, minY: 5, maxY: 64, attemptsPerChunk: 20, veinSize: 6 },
  { oreType: BlockType.GOLD_ORE, minY: 5, maxY: 32, attemptsPerChunk: 2, veinSize: 5 },
  { oreType: BlockType.DIAMOND_ORE, minY: 5, maxY: 16, attemptsPerChunk: 1, veinSize: 4 },
];

export class OreGenerator {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  generate(chunk: Chunk): void {
    const chunkSeed = (this.seed ^ (chunk.chunkX * 498536548) ^ (chunk.chunkZ * 725765765)) | 0;
    const rng = new SeededRandom(chunkSeed);

    for (const ore of DEFAULT_ORES) {
      this.generateOre(chunk, ore, rng);
    }
  }

  private generateOre(chunk: Chunk, settings: OreSettings, rng: SeededRandom): void {
    for (let i = 0; i < settings.attemptsPerChunk; i++) {
      const x = rng.nextInt(0, CHUNK_WIDTH);
      const y = rng.nextInt(settings.minY, Math.min(settings.maxY, CHUNK_HEIGHT));
      const z = rng.nextInt(0, CHUNK_DEPTH);

      if (chunk.getBlock(x, y, z) !== BlockType.STONE) continue;
      this.generateVein(chunk, x, y, z, settings.oreType, settings.veinSize, rng);
    }
  }

  private generateVein(chunk: Chunk, sx: number, sy: number, sz: number, oreType: number, size: number, rng: SeededRandom): void {
    let x = sx, y = sy, z = sz;
    chunk.setBlock(x, y, z, oreType);

    for (let i = 1; i < size; i++) {
      x += rng.nextInt(-1, 2);
      y += rng.nextInt(-1, 2);
      z += rng.nextInt(-1, 2);

      if (!chunk.isInBounds(x, y, z)) continue;
      if (chunk.getBlock(x, y, z) === BlockType.STONE) {
        chunk.setBlock(x, y, z, oreType);
      }
    }
  }
}
