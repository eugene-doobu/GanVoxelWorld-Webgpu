import { PerlinNoise } from '../noise/PerlinNoise';
import { SeededRandom } from '../noise/SeededRandom';
import { Chunk } from './Chunk';
import { BlockType } from './BlockTypes';
import {
  CHUNK_WIDTH, CHUNK_DEPTH,
  CAVE_COUNT, CAVE_MIN_LENGTH, CAVE_MAX_LENGTH,
  CAVE_MIN_RADIUS, CAVE_MAX_RADIUS, CAVE_MIN_Y, CAVE_MAX_Y,
} from '../constants';

export class CaveGenerator {
  private dirNoiseX: PerlinNoise;
  private dirNoiseY: PerlinNoise;
  private radiusNoise: PerlinNoise;
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
    this.dirNoiseX = new PerlinNoise(seed);
    this.dirNoiseY = new PerlinNoise(seed + 1);
    this.radiusNoise = new PerlinNoise(seed + 3);
  }

  generate(chunk: Chunk): void {
    const chunkSeed = (this.seed ^ (chunk.chunkX * 73856093) ^ (chunk.chunkZ * 19349663)) | 0;
    const rng = new SeededRandom(chunkSeed);

    for (let i = 0; i < CAVE_COUNT; i++) {
      this.generateWorm(chunk, rng);
    }
  }

  private generateWorm(chunk: Chunk, rng: SeededRandom): void {
    let x = rng.nextInt(0, CHUNK_WIDTH);
    let y = rng.nextInt(CAVE_MIN_Y, CAVE_MAX_Y);
    let z = rng.nextInt(0, CHUNK_DEPTH);
    const length = rng.nextInt(CAVE_MIN_LENGTH, CAVE_MAX_LENGTH);
    const noiseOffset = rng.next() * 1000;

    for (let step = 0; step < length; step++) {
      const t = step * 0.1 + noiseOffset;

      const radius = CAVE_MIN_RADIUS + (CAVE_MAX_RADIUS - CAVE_MIN_RADIUS) * this.radiusNoise.noise2D(t, 0);
      this.carveSphere(chunk, x, y, z, radius);

      const angleXZ = this.dirNoiseX.noise2D(t, 0) * Math.PI * 2;
      const angleY = (this.dirNoiseY.noise2D(0, t) - 0.5) * Math.PI * 0.5;

      x += Math.cos(angleXZ) * Math.cos(angleY);
      y += Math.sin(angleY) * 0.3;
      z += Math.sin(angleXZ) * Math.cos(angleY);

      y = Math.max(CAVE_MIN_Y, Math.min(CAVE_MAX_Y, y));
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
            if (cur !== BlockType.BEDROCK && cur !== BlockType.WATER) {
              chunk.setBlock(x, y, z, BlockType.AIR);
            }
          }
        }
      }
    }
  }
}
