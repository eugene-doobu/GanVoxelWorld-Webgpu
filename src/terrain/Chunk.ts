import { CHUNK_WIDTH, CHUNK_HEIGHT, CHUNK_DEPTH, CHUNK_TOTAL_BLOCKS } from '../constants';
import { BlockType, isBlockSolid, isBlockAir } from './BlockTypes';

export class Chunk {
  readonly chunkX: number;
  readonly chunkZ: number;
  readonly blocks: Uint8Array;

  // GPU resources (set by ChunkManager)
  vertexBuffer: GPUBuffer | null = null;
  indexBuffer: GPUBuffer | null = null;
  indexCount = 0;

  // Water GPU resources
  waterVertexBuffer: GPUBuffer | null = null;
  waterIndexBuffer: GPUBuffer | null = null;
  waterIndexCount = 0;

  // Vegetation GPU resources
  vegVertexBuffer: GPUBuffer | null = null;
  vegIndexBuffer: GPUBuffer | null = null;
  vegIndexCount = 0;

  constructor(chunkX: number, chunkZ: number) {
    this.chunkX = chunkX;
    this.chunkZ = chunkZ;
    this.blocks = new Uint8Array(CHUNK_TOTAL_BLOCKS);
  }

  get worldOffsetX(): number { return this.chunkX * CHUNK_WIDTH; }
  get worldOffsetZ(): number { return this.chunkZ * CHUNK_DEPTH; }

  getBlock(x: number, y: number, z: number): number {
    if (!this.isInBounds(x, y, z)) return BlockType.AIR;
    return this.blocks[Chunk.index(x, y, z)];
  }

  setBlock(x: number, y: number, z: number, type: number): void {
    if (!this.isInBounds(x, y, z)) return;
    this.blocks[Chunk.index(x, y, z)] = type;
  }

  isInBounds(x: number, y: number, z: number): boolean {
    return x >= 0 && x < CHUNK_WIDTH &&
           y >= 0 && y < CHUNK_HEIGHT &&
           z >= 0 && z < CHUNK_DEPTH;
  }

  isSolidAt(x: number, y: number, z: number): boolean {
    if (!this.isInBounds(x, y, z)) return false;
    return isBlockSolid(this.getBlock(x, y, z));
  }

  isAirAt(x: number, y: number, z: number): boolean {
    if (!this.isInBounds(x, y, z)) return true;
    return isBlockAir(this.getBlock(x, y, z));
  }

  static index(x: number, y: number, z: number): number {
    return x + (y * CHUNK_WIDTH) + (z * CHUNK_WIDTH * CHUNK_HEIGHT);
  }

  destroyGPU(): void {
    this.vertexBuffer?.destroy();
    this.indexBuffer?.destroy();
    this.vertexBuffer = null;
    this.indexBuffer = null;
    this.indexCount = 0;

    this.waterVertexBuffer?.destroy();
    this.waterIndexBuffer?.destroy();
    this.waterVertexBuffer = null;
    this.waterIndexBuffer = null;
    this.waterIndexCount = 0;

    this.vegVertexBuffer?.destroy();
    this.vegIndexBuffer?.destroy();
    this.vegVertexBuffer = null;
    this.vegIndexBuffer = null;
    this.vegIndexCount = 0;
  }
}
