import { Chunk } from './Chunk';
import { BlockType } from './BlockTypes';
import { CHUNK_WIDTH, CHUNK_HEIGHT, CHUNK_DEPTH } from '../constants';
import { Config } from '../config/Config';
import { SimplexNoise } from '../noise/SimplexNoise';

const FLOW_DISTANCE = 7;

export class WaterSimulator {
  private waterTableNoise: SimplexNoise;

  constructor(seed: number) {
    this.waterTableNoise = new SimplexNoise(seed + 100);
  }

  generate(chunk: Chunk): void {
    const seaLevel = Config.data.terrain.height.seaLevel;

    // Phase 1: Remove all existing water (will be re-placed correctly)
    const blocks = chunk.blocks;
    for (let i = 0; i < blocks.length; i++) {
      if (blocks[i] === BlockType.WATER || blocks[i] === BlockType.FLOWING_WATER) {
        blocks[i] = BlockType.AIR;
      }
    }

    // Phase 2: Column fill — place water sources where surface < SEA_LEVEL
    for (let x = 0; x < CHUNK_WIDTH; x++) {
      for (let z = 0; z < CHUNK_DEPTH; z++) {
        const surfaceY = this.findSolidSurface(chunk, x, z, seaLevel);
        if (surfaceY < seaLevel) {
          for (let y = surfaceY + 1; y <= seaLevel; y++) {
            if (chunk.getBlock(x, y, z) === BlockType.AIR) {
              chunk.setBlock(x, y, z, BlockType.WATER);
            }
          }
        }
      }
    }

    // Phase 3: Noise-based water table — underground cave water
    this.fillCaveWater(chunk, seaLevel);

    // Phase 4: Cascade flow — water at edges flows down as FLOWING_WATER
    this.cascadeFlow(chunk, seaLevel);
  }

  private findSolidSurface(chunk: Chunk, x: number, z: number, seaLevel: number): number {
    for (let y = seaLevel; y >= 0; y--) {
      const block = chunk.getBlock(x, y, z);
      if (block !== BlockType.AIR && block !== BlockType.WATER && block !== BlockType.FLOWING_WATER) {
        return y;
      }
    }
    return 0;
  }

  /**
   * Noise-based underground water table.
   * Scans each column top-down; once solid blocks are encountered,
   * any AIR below them AND below the local water table Y gets filled with WATER.
   * This creates natural-looking cave pools/rivers without flooding entire caves.
   */
  private fillCaveWater(chunk: Chunk, seaLevel: number): void {
    const { baseLevel, amplitude, noiseScale } = Config.data.terrain.caves.waterTable;

    for (let x = 0; x < CHUNK_WIDTH; x++) {
      for (let z = 0; z < CHUNK_DEPTH; z++) {
        const worldX = chunk.chunkX * CHUNK_WIDTH + x;
        const worldZ = chunk.chunkZ * CHUNK_DEPTH + z;

        // 2D noise → local water table height
        const n = this.waterTableNoise.noise2D(worldX / noiseScale, worldZ / noiseScale);
        const waterTableY = Math.floor(baseLevel + n * amplitude);

        // Scan column top-down to find underground AIR
        let hasSolidAbove = false;
        for (let y = CHUNK_HEIGHT - 1; y >= 1; y--) {
          const block = chunk.getBlock(x, y, z);
          if (block !== BlockType.AIR && block !== BlockType.WATER && block !== BlockType.FLOWING_WATER) {
            hasSolidAbove = true;
          } else if (hasSolidAbove && block === BlockType.AIR && y <= waterTableY) {
            chunk.setBlock(x, y, z, BlockType.WATER);
          }
        }
      }
    }
  }

  private cascadeFlow(chunk: Chunk, seaLevel: number): void {
    // Find water at SEA_LEVEL with air neighbors → create flowing water (waterfalls)
    for (let x = 0; x < CHUNK_WIDTH; x++) {
      for (let z = 0; z < CHUNK_DEPTH; z++) {
        if (chunk.getBlock(x, seaLevel, z) !== BlockType.WATER) continue;

        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dx, dz] of dirs) {
          const ax = x + dx, az = z + dz;
          if (!chunk.isInBounds(ax, seaLevel, az)) continue;
          if (chunk.getBlock(ax, seaLevel, az) === BlockType.AIR) {
            this.placeFlow(chunk, ax, seaLevel, az);
          }
        }
      }
    }
  }

  private placeFlow(chunk: Chunk, startX: number, startY: number, startZ: number): void {
    // BFS flowing water: falls down, spreads horizontally on solid ground
    const qx: number[] = [startX];
    const qy: number[] = [startY];
    const qz: number[] = [startZ];
    const qd: number[] = [0]; // flow distance
    const visited = new Uint8Array(CHUNK_WIDTH * CHUNK_HEIGHT * CHUNK_DEPTH);

    let head = 0;
    while (head < qx.length) {
      const x = qx[head], y = qy[head], z = qz[head], dist = qd[head];
      head++;

      if (!chunk.isInBounds(x, y, z) || y < 1) continue;
      const idx = Chunk.index(x, y, z);
      if (visited[idx]) continue;
      visited[idx] = 1;

      const cur = chunk.getBlock(x, y, z);
      if (cur !== BlockType.AIR) continue;

      chunk.setBlock(x, y, z, BlockType.FLOWING_WATER);

      // Prioritize flowing down (waterfall)
      if (chunk.isInBounds(x, y - 1, z) && chunk.getBlock(x, y - 1, z) === BlockType.AIR) {
        qx.push(x); qy.push(y - 1); qz.push(z); qd.push(0); // reset distance when falling
        continue;
      }

      // Spread horizontally on solid ground (up to FLOW_DISTANCE)
      if (dist >= FLOW_DISTANCE) continue;
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dx, dz] of dirs) {
        qx.push(x + dx); qy.push(y); qz.push(z + dz); qd.push(dist + 1);
      }
    }
  }
}
