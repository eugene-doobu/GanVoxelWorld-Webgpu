import { CHUNK_WIDTH, CHUNK_HEIGHT, CHUNK_DEPTH, CHUNK_TOTAL_BLOCKS } from '../constants';
import { BlockType, isBlockSolid, isBlockAir } from './BlockTypes';
import type { ChunkAllocation } from '../renderer/IndirectRenderer';

// Bitmask constants for 4×4×4 sub-blocks
// Chunk is divided into 4×4×4 sub-blocks (each containing 64 blocks).
// Sub-block grid: (CHUNK_WIDTH/4) × (CHUNK_HEIGHT/4) × (CHUNK_DEPTH/4) = 4 × 32 × 4 = 512
export const SUB_BLOCK_SIZE = 4;
export const SUB_BLOCKS_X = CHUNK_WIDTH / SUB_BLOCK_SIZE;   // 4
export const SUB_BLOCKS_Y = CHUNK_HEIGHT / SUB_BLOCK_SIZE;  // 32
export const SUB_BLOCKS_Z = CHUNK_DEPTH / SUB_BLOCK_SIZE;   // 4
export const TOTAL_SUB_BLOCKS = SUB_BLOCKS_X * SUB_BLOCKS_Y * SUB_BLOCKS_Z; // 512

export class Chunk {
  readonly chunkX: number;
  readonly chunkZ: number;
  blocks: Uint8Array;

  // Occupancy bitmask: 64-bit per sub-block (stored as 2× Uint32 = low32 + high32)
  // Each bit represents whether a block is non-AIR.
  // occupancy[i*2] = low 32 bits, occupancy[i*2+1] = high 32 bits
  // Total: 512 sub-blocks × 2 × 4 bytes = 4096 bytes
  occupancy: Uint32Array;

  // Compression: per-sub-block uniform flag + uniform type.
  // If uniformFlags[i] != 0, the entire 4×4×4 sub-block is one type = uniformTypes[i].
  // This avoids storing 64 blocks for homogeneous regions.
  private compressed = false;
  private uniformFlags: Uint8Array | null = null;   // 512 entries: 0=mixed, 1=uniform
  private uniformTypes: Uint8Array | null = null;   // 512 entries: block type when uniform
  private detailBlocks: Uint8Array | null = null;   // sparse: only mixed sub-blocks have 64-byte entries
  private detailOffsets: Uint16Array | null = null;  // 512 entries: offset into detailBlocks (in 64-byte units)

  // Mega buffer allocation for solid mesh (managed by IndirectRenderer)
  solidAlloc: ChunkAllocation | null = null;
  // Mega buffer allocation for vegetation mesh
  vegMegaAlloc: ChunkAllocation | null = null;

  // Legacy per-chunk GPU resources (kept for backward compatibility during migration)
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
    this.occupancy = new Uint32Array(TOTAL_SUB_BLOCKS * 2);
  }

  get worldOffsetX(): number { return this.chunkX * CHUNK_WIDTH; }
  get worldOffsetZ(): number { return this.chunkZ * CHUNK_DEPTH; }

  getBlock(x: number, y: number, z: number): number {
    if (!this.isInBounds(x, y, z)) return BlockType.AIR;

    if (this.compressed) {
      return this.getBlockCompressed(x, y, z);
    }
    return this.blocks[Chunk.index(x, y, z)];
  }

  private getBlockCompressed(x: number, y: number, z: number): number {
    const sbx = x >> 2; // x / SUB_BLOCK_SIZE
    const sby = y >> 2;
    const sbz = z >> 2;
    const subIdx = sbx + sby * SUB_BLOCKS_X + sbz * SUB_BLOCKS_X * SUB_BLOCKS_Y;

    if (this.uniformFlags![subIdx]) {
      return this.uniformTypes![subIdx];
    }

    // Mixed sub-block: look up in detailBlocks
    const detailOffset = this.detailOffsets![subIdx];
    const lx = x & 3; // x % SUB_BLOCK_SIZE
    const ly = y & 3;
    const lz = z & 3;
    const localIdx = lx + ly * SUB_BLOCK_SIZE + lz * SUB_BLOCK_SIZE * SUB_BLOCK_SIZE;
    return this.detailBlocks![detailOffset * 64 + localIdx];
  }

  setBlock(x: number, y: number, z: number, type: number): void {
    if (!this.isInBounds(x, y, z)) return;

    // If compressed, decompress first (block writes are rare after generation)
    if (this.compressed) {
      this.decompress();
    }
    this.blocks[Chunk.index(x, y, z)] = type;
  }

  // Compress block data using 4×4×4 sub-block uniformity detection.
  // Uniform sub-blocks (all same type) are stored as 1 byte instead of 64.
  // Call after meshing when blocks won't change anymore.
  compress(): void {
    if (this.compressed) return;

    this.uniformFlags = new Uint8Array(TOTAL_SUB_BLOCKS);
    this.uniformTypes = new Uint8Array(TOTAL_SUB_BLOCKS);
    this.detailOffsets = new Uint16Array(TOTAL_SUB_BLOCKS);

    // First pass: count mixed sub-blocks
    let mixedCount = 0;
    for (let sbz = 0; sbz < SUB_BLOCKS_Z; sbz++) {
      for (let sby = 0; sby < SUB_BLOCKS_Y; sby++) {
        for (let sbx = 0; sbx < SUB_BLOCKS_X; sbx++) {
          const subIdx = sbx + sby * SUB_BLOCKS_X + sbz * SUB_BLOCKS_X * SUB_BLOCKS_Y;
          const baseX = sbx * SUB_BLOCK_SIZE;
          const baseY = sby * SUB_BLOCK_SIZE;
          const baseZ = sbz * SUB_BLOCK_SIZE;

          const firstBlock = this.blocks[Chunk.index(baseX, baseY, baseZ)];
          let uniform = true;

          outer:
          for (let lz = 0; lz < SUB_BLOCK_SIZE; lz++) {
            for (let ly = 0; ly < SUB_BLOCK_SIZE; ly++) {
              for (let lx = 0; lx < SUB_BLOCK_SIZE; lx++) {
                if (this.blocks[Chunk.index(baseX + lx, baseY + ly, baseZ + lz)] !== firstBlock) {
                  uniform = false;
                  break outer;
                }
              }
            }
          }

          if (uniform) {
            this.uniformFlags[subIdx] = 1;
            this.uniformTypes[subIdx] = firstBlock;
          } else {
            this.uniformFlags[subIdx] = 0;
            this.detailOffsets[subIdx] = mixedCount;
            mixedCount++;
          }
        }
      }
    }

    // Second pass: copy mixed sub-block data
    this.detailBlocks = new Uint8Array(mixedCount * 64);
    for (let sbz = 0; sbz < SUB_BLOCKS_Z; sbz++) {
      for (let sby = 0; sby < SUB_BLOCKS_Y; sby++) {
        for (let sbx = 0; sbx < SUB_BLOCKS_X; sbx++) {
          const subIdx = sbx + sby * SUB_BLOCKS_X + sbz * SUB_BLOCKS_X * SUB_BLOCKS_Y;
          if (this.uniformFlags[subIdx]) continue;

          const offset = this.detailOffsets[subIdx] * 64;
          const baseX = sbx * SUB_BLOCK_SIZE;
          const baseY = sby * SUB_BLOCK_SIZE;
          const baseZ = sbz * SUB_BLOCK_SIZE;

          for (let lz = 0; lz < SUB_BLOCK_SIZE; lz++) {
            for (let ly = 0; ly < SUB_BLOCK_SIZE; ly++) {
              for (let lx = 0; lx < SUB_BLOCK_SIZE; lx++) {
                const localIdx = lx + ly * SUB_BLOCK_SIZE + lz * SUB_BLOCK_SIZE * SUB_BLOCK_SIZE;
                this.detailBlocks[offset + localIdx] = this.blocks[Chunk.index(baseX + lx, baseY + ly, baseZ + lz)];
              }
            }
          }
        }
      }
    }

    // Release the full block array
    this.blocks = new Uint8Array(0);
    this.compressed = true;
  }

  // Decompress back to full block array (needed if setBlock is called after compression)
  decompress(): void {
    if (!this.compressed) return;

    const blocks = new Uint8Array(CHUNK_TOTAL_BLOCKS);

    for (let sbz = 0; sbz < SUB_BLOCKS_Z; sbz++) {
      for (let sby = 0; sby < SUB_BLOCKS_Y; sby++) {
        for (let sbx = 0; sbx < SUB_BLOCKS_X; sbx++) {
          const subIdx = sbx + sby * SUB_BLOCKS_X + sbz * SUB_BLOCKS_X * SUB_BLOCKS_Y;
          const baseX = sbx * SUB_BLOCK_SIZE;
          const baseY = sby * SUB_BLOCK_SIZE;
          const baseZ = sbz * SUB_BLOCK_SIZE;

          if (this.uniformFlags![subIdx]) {
            const type = this.uniformTypes![subIdx];
            for (let lz = 0; lz < SUB_BLOCK_SIZE; lz++) {
              for (let ly = 0; ly < SUB_BLOCK_SIZE; ly++) {
                for (let lx = 0; lx < SUB_BLOCK_SIZE; lx++) {
                  blocks[Chunk.index(baseX + lx, baseY + ly, baseZ + lz)] = type;
                }
              }
            }
          } else {
            const offset = this.detailOffsets![subIdx] * 64;
            for (let lz = 0; lz < SUB_BLOCK_SIZE; lz++) {
              for (let ly = 0; ly < SUB_BLOCK_SIZE; ly++) {
                for (let lx = 0; lx < SUB_BLOCK_SIZE; lx++) {
                  const localIdx = lx + ly * SUB_BLOCK_SIZE + lz * SUB_BLOCK_SIZE * SUB_BLOCK_SIZE;
                  blocks[Chunk.index(baseX + lx, baseY + ly, baseZ + lz)] = this.detailBlocks![offset + localIdx];
                }
              }
            }
          }
        }
      }
    }

    this.blocks = blocks;
    this.compressed = false;
    this.uniformFlags = null;
    this.uniformTypes = null;
    this.detailBlocks = null;
    this.detailOffsets = null;
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

  // Compute occupancy bitmask from block data.
  // Call this after all generators have finished writing blocks.
  computeOccupancy(): void {
    this.occupancy.fill(0);

    for (let sbz = 0; sbz < SUB_BLOCKS_Z; sbz++) {
      for (let sby = 0; sby < SUB_BLOCKS_Y; sby++) {
        for (let sbx = 0; sbx < SUB_BLOCKS_X; sbx++) {
          const subIdx = sbx + sby * SUB_BLOCKS_X + sbz * SUB_BLOCKS_X * SUB_BLOCKS_Y;
          let lo = 0;
          let hi = 0;
          const baseX = sbx * SUB_BLOCK_SIZE;
          const baseY = sby * SUB_BLOCK_SIZE;
          const baseZ = sbz * SUB_BLOCK_SIZE;

          for (let lz = 0; lz < SUB_BLOCK_SIZE; lz++) {
            for (let ly = 0; ly < SUB_BLOCK_SIZE; ly++) {
              for (let lx = 0; lx < SUB_BLOCK_SIZE; lx++) {
                const block = this.blocks[Chunk.index(baseX + lx, baseY + ly, baseZ + lz)];
                if (block !== BlockType.AIR) {
                  const bitIdx = lx + ly * SUB_BLOCK_SIZE + lz * SUB_BLOCK_SIZE * SUB_BLOCK_SIZE;
                  if (bitIdx < 32) {
                    lo |= (1 << bitIdx);
                  } else {
                    hi |= (1 << (bitIdx - 32));
                  }
                }
              }
            }
          }

          this.occupancy[subIdx * 2] = lo;
          this.occupancy[subIdx * 2 + 1] = hi;
        }
      }
    }
  }

  // Check if a sub-block is entirely empty (all AIR)
  isSubBlockEmpty(sbx: number, sby: number, sbz: number): boolean {
    const subIdx = sbx + sby * SUB_BLOCKS_X + sbz * SUB_BLOCKS_X * SUB_BLOCKS_Y;
    return this.occupancy[subIdx * 2] === 0 && this.occupancy[subIdx * 2 + 1] === 0;
  }

  // Check if a sub-block is entirely full (all non-AIR)
  isSubBlockFull(sbx: number, sby: number, sbz: number): boolean {
    const subIdx = sbx + sby * SUB_BLOCKS_X + sbz * SUB_BLOCKS_X * SUB_BLOCKS_Y;
    return this.occupancy[subIdx * 2] === 0xFFFFFFFF && this.occupancy[subIdx * 2 + 1] === 0xFFFFFFFF;
  }

  destroyGPU(): void {
    // Note: solidAlloc and vegMegaAlloc are freed by ChunkManager via IndirectRenderer.freeChunk()
    this.solidAlloc = null;
    this.vegMegaAlloc = null;

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
