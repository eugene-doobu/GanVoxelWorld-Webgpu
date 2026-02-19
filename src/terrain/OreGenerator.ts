import { SeededRandom } from '../noise/SeededRandom';
import { Chunk } from './Chunk';
import { BlockType } from './BlockTypes';
import { CHUNK_WIDTH, CHUNK_HEIGHT, CHUNK_DEPTH } from '../constants';
import { Config } from '../config/Config';

interface OreSettings {
  oreType: number;
  minY: number;
  maxY: number;
  attemptsPerChunk: number;
  veinSize: number;
}

export class OreGenerator {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  private getOreSettings(): OreSettings[] {
    const ores = Config.data.terrain.ores;
    return [
      { oreType: BlockType.COAL_ORE, minY: ores.coal.minY, maxY: ores.coal.maxY, attemptsPerChunk: ores.coal.attempts, veinSize: ores.coal.veinSize },
      { oreType: BlockType.IRON_ORE, minY: ores.iron.minY, maxY: ores.iron.maxY, attemptsPerChunk: ores.iron.attempts, veinSize: ores.iron.veinSize },
      { oreType: BlockType.GOLD_ORE, minY: ores.gold.minY, maxY: ores.gold.maxY, attemptsPerChunk: ores.gold.attempts, veinSize: ores.gold.veinSize },
      { oreType: BlockType.DIAMOND_ORE, minY: ores.diamond.minY, maxY: ores.diamond.maxY, attemptsPerChunk: ores.diamond.attempts, veinSize: ores.diamond.veinSize },
    ];
  }

  generate(chunk: Chunk): void {
    const chunkSeed = (this.seed ^ (chunk.chunkX * 498536548) ^ (chunk.chunkZ * 725765765)) | 0;
    const rng = new SeededRandom(chunkSeed);

    for (const ore of this.getOreSettings()) {
      this.generateOre(chunk, ore, rng);
    }
  }

  private generateOre(chunk: Chunk, settings: OreSettings, rng: SeededRandom): void {
    for (let i = 0; i < settings.attemptsPerChunk; i++) {
      const x = rng.nextInt(0, CHUNK_WIDTH);
      const y = rng.nextInt(settings.minY, Math.min(settings.maxY, CHUNK_HEIGHT));
      const z = rng.nextInt(0, CHUNK_DEPTH);

      if (chunk.getBlock(x, y, z) !== BlockType.STONE) continue;
      this.generateVein(chunk, x, y, z, settings.oreType, settings.veinSize, rng, settings.minY, settings.maxY);
    }
  }

  private generateVein(chunk: Chunk, sx: number, sy: number, sz: number, oreType: number, size: number, rng: SeededRandom, minY: number, maxY: number): void {
    let x = sx, y = sy, z = sz;
    chunk.setBlock(x, y, z, oreType);

    for (let i = 1; i < size; i++) {
      x += rng.nextInt(-1, 2);
      y += rng.nextInt(-1, 2);
      z += rng.nextInt(-1, 2);

      if (!chunk.isInBounds(x, y, z)) continue;
      if (y < minY || y >= maxY) continue;
      if (chunk.getBlock(x, y, z) === BlockType.STONE) {
        chunk.setBlock(x, y, z, oreType);
      }
    }
  }
}
