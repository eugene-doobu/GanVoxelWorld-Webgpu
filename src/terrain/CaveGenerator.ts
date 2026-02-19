import { SimplexNoise } from '../noise/SimplexNoise';
import { SeededRandom } from '../noise/SeededRandom';
import { Chunk } from './Chunk';
import { BlockType } from './BlockTypes';
import { CHUNK_WIDTH, CHUNK_DEPTH } from '../constants';
import { Config } from '../config/Config';

export class CaveGenerator {
  private dirNoiseX: SimplexNoise;
  private dirNoiseY: SimplexNoise;
  private radiusNoise: SimplexNoise;
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
    this.dirNoiseX = new SimplexNoise(seed);
    this.dirNoiseY = new SimplexNoise(seed + 1);
    this.radiusNoise = new SimplexNoise(seed + 3);
  }

  generate(chunk: Chunk): void {
    const caves = Config.data.terrain.caves;
    const chunkSeed = (this.seed ^ (chunk.chunkX * 73856093) ^ (chunk.chunkZ * 19349663)) | 0;
    const rng = new SeededRandom(chunkSeed);

    for (let i = 0; i < caves.count; i++) {
      this.generateWorm(chunk, rng);
    }
  }

  private generateWorm(chunk: Chunk, rng: SeededRandom): void {
    const caves = Config.data.terrain.caves;
    let x = rng.nextInt(0, CHUNK_WIDTH);
    let y = rng.nextInt(caves.minY, caves.maxY);
    let z = rng.nextInt(0, CHUNK_DEPTH);
    const length = rng.nextInt(caves.minLength, caves.maxLength);
    const noiseOffset = rng.next() * 1000;

    for (let step = 0; step < length; step++) {
      const t = step * 0.1 + noiseOffset;

      const radius = caves.minRadius + (caves.maxRadius - caves.minRadius) * this.radiusNoise.noise2D(t, 0);
      this.carveSphere(chunk, x, y, z, radius);

      const angleXZ = this.dirNoiseX.noise2D(t, 0) * Math.PI * 2;
      const angleY = (this.dirNoiseY.noise2D(0, t) - 0.5) * Math.PI * 0.5;

      x += Math.cos(angleXZ) * Math.cos(angleY);
      y += Math.sin(angleY) * 0.3;
      z += Math.sin(angleXZ) * Math.cos(angleY);

      y = Math.max(caves.minY, Math.min(caves.maxY, y));
    }
  }

  private carveSphere(chunk: Chunk, cx: number, cy: number, cz: number, radius: number): void {
    const minX = Math.floor(cx - radius);
    const maxX = Math.ceil(cx + radius);
    const minY = Math.floor(cy - radius);
    const maxY = Math.ceil(cy + radius);
    const minZ = Math.floor(cz - radius);
    const maxZ = Math.ceil(cz + radius);
    const r2 = radius * radius;

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          if (!chunk.isInBounds(x, y, z) || y <= 0) continue;
          const dx = x - cx, dy = y - cy, dz = z - cz;
          if (dx * dx + dy * dy + dz * dz <= r2) {
            const cur = chunk.getBlock(x, y, z);
            if (cur !== BlockType.BEDROCK && cur !== BlockType.WATER && cur !== BlockType.FLOWING_WATER) {
              chunk.setBlock(x, y, z, BlockType.AIR);
            }
          }
        }
      }
    }
  }
}
