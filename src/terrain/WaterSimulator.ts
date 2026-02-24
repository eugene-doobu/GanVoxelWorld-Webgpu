import { Chunk } from './Chunk';
import { BlockType } from './BlockTypes';
import { CHUNK_WIDTH, CHUNK_HEIGHT, CHUNK_DEPTH } from '../constants';
import { Config } from '../config/Config';

const FLOW_DISTANCE = 7;

export class WaterSimulator {
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

    // Phase 3: BFS flood fill — water flows into connected air below sea level
    // (fills caves opened to ocean)
    this.floodFillBelow(chunk, seaLevel);

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

  private floodFillBelow(chunk: Chunk, seaLevel: number): void {
    // Use array-based queue with head pointer for BFS performance
    const queueX: number[] = [];
    const queueY: number[] = [];
    const queueZ: number[] = [];
    const visited = new Uint8Array(CHUNK_WIDTH * CHUNK_HEIGHT * CHUNK_DEPTH);

    // Mark all existing water as visited and seed queue from edges
    for (let x = 0; x < CHUNK_WIDTH; x++) {
      for (let z = 0; z < CHUNK_DEPTH; z++) {
        for (let y = 1; y <= seaLevel; y++) {
          if (chunk.getBlock(x, y, z) !== BlockType.WATER) continue;
          const idx = Chunk.index(x, y, z);
          visited[idx] = 1;
          if (this.hasAirNeighborBelow(chunk, x, y, z)) {
            queueX.push(x);
            queueY.push(y);
            queueZ.push(z);
          }
        }
      }
    }

    // BFS: water flows horizontally (≤ SEA_LEVEL) and downward
    let head = 0;
    while (head < queueX.length) {
      const x = queueX[head];
      const y = queueY[head];
      const z = queueZ[head];
      head++;

      // Horizontal + down neighbors
      const nx = [x - 1, x + 1, x, x, x];
      const ny = [y, y, y, y, y - 1];
      const nz = [z, z, z - 1, z + 1, z];

      for (let i = 0; i < 5; i++) {
        const ax = nx[i], ay = ny[i], az = nz[i];
        if (!chunk.isInBounds(ax, ay, az) || ay > seaLevel || ay < 1) continue;

        const nidx = Chunk.index(ax, ay, az);
        if (visited[nidx]) continue;
        visited[nidx] = 1;

        if (chunk.getBlock(ax, ay, az) === BlockType.AIR) {
          chunk.setBlock(ax, ay, az, BlockType.WATER);
          queueX.push(ax);
          queueY.push(ay);
          queueZ.push(az);
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

  private hasAirNeighborBelow(chunk: Chunk, x: number, y: number, z: number): boolean {
    // Check horizontal + down for air (not up — water doesn't flow up)
    const nx = [x - 1, x + 1, x, x, x];
    const ny = [y, y, y, y, y - 1];
    const nz = [z, z, z - 1, z + 1, z];
    for (let i = 0; i < 5; i++) {
      if (!chunk.isInBounds(nx[i], ny[i], nz[i])) continue;
      if (chunk.getBlock(nx[i], ny[i], nz[i]) === BlockType.AIR) return true;
    }
    return false;
  }
}
