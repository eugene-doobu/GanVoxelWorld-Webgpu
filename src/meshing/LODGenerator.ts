// LODGenerator: generates downsampled voxel data and meshes for LOD levels.
// LOD 0: original 16×128×16
// LOD 1: 8×64×8 (2×2×2 majority vote downsample)
// LOD 2: 4×32×4 (4×4×4)
// LOD 3: 2×16×2 (8×8×8)

import { CHUNK_WIDTH, CHUNK_HEIGHT, CHUNK_DEPTH, ATLAS_TILES } from '../constants';
import { BlockType, isBlockSolid, isBlockWater, isBlockCutout, isBlockCrossMesh } from '../terrain/BlockTypes';
import { Chunk } from '../terrain/Chunk';
import { buildChunkMesh, ChunkNeighbors, MeshData } from './MeshBuilder';

export interface LODLevel {
  factor: number;          // downsample factor (1, 2, 4, 8)
  width: number;
  height: number;
  depth: number;
  blocks: Uint8Array;
}

export interface LODMeshData {
  vertices: Float32Array;
  indices: Uint32Array;
  indexCount: number;
}

// Downsample factor for each LOD level
const LOD_FACTORS = [1, 2, 4, 8];

export function generateLODLevels(chunk: Chunk): LODLevel[] {
  const levels: LODLevel[] = [];

  // LOD 0: original (reference, not a copy)
  levels.push({
    factor: 1,
    width: CHUNK_WIDTH,
    height: CHUNK_HEIGHT,
    depth: CHUNK_DEPTH,
    blocks: chunk.blocks,
  });

  // LOD 1-3: progressively downsampled
  let prevBlocks = chunk.blocks;
  let prevW = CHUNK_WIDTH, prevH = CHUNK_HEIGHT, prevD = CHUNK_DEPTH;

  for (let lod = 1; lod < LOD_FACTORS.length; lod++) {
    const newW = prevW >> 1;
    const newH = prevH >> 1;
    const newD = prevD >> 1;
    const newBlocks = new Uint8Array(newW * newH * newD);

    // 2×2×2 majority vote downsample
    for (let z = 0; z < newD; z++) {
      for (let y = 0; y < newH; y++) {
        for (let x = 0; x < newW; x++) {
          const counts = new Map<number, number>();
          let maxCount = 0;
          let maxType = BlockType.AIR;

          for (let dz = 0; dz < 2; dz++) {
            for (let dy = 0; dy < 2; dy++) {
              for (let dx = 0; dx < 2; dx++) {
                const sx = x * 2 + dx;
                const sy = y * 2 + dy;
                const sz = z * 2 + dz;
                const idx = sx + sy * prevW + sz * prevW * prevH;
                const bt = prevBlocks[idx];

                // Skip non-renderable types in majority vote
                if (bt === BlockType.AIR || isBlockWater(bt) || isBlockCrossMesh(bt)) continue;

                const c = (counts.get(bt) ?? 0) + 1;
                counts.set(bt, c);
                if (c > maxCount) {
                  maxCount = c;
                  maxType = bt;
                }
              }
            }
          }

          newBlocks[x + y * newW + z * newW * newH] = maxType;
        }
      }
    }

    levels.push({
      factor: LOD_FACTORS[lod],
      width: newW,
      height: newH,
      depth: newD,
      blocks: newBlocks,
    });

    prevBlocks = newBlocks;
    prevW = newW;
    prevH = newH;
    prevD = newD;
  }

  return levels;
}

// Build a simple mesh from a LOD level's block data.
// This is a simplified mesher: no AO, no greedy merging (LOD meshes are already small).
// Each face of each visible block is emitted as a quad.
export function buildLODMesh(level: LODLevel, worldOffsetX: number, worldOffsetZ: number): LODMeshData {
  const { width, height, depth, blocks, factor } = level;
  const blockSize = factor; // each LOD block represents factor×factor×factor real blocks
  const uvSize = 1.0 / ATLAS_TILES;

  // FACE_VERTICES for a unit cube
  const FACE_VERTS = [
    // TOP (y+1)
    [0,1,0, 1,1,0, 1,1,1, 0,1,1],
    // BOTTOM (y=0)
    [0,0,1, 1,0,1, 1,0,0, 0,0,0],
    // NORTH (+Z)
    [1,0,1, 0,0,1, 0,1,1, 1,1,1],
    // SOUTH (-Z)
    [0,0,0, 1,0,0, 1,1,0, 0,1,0],
    // EAST (+X)
    [1,0,0, 1,0,1, 1,1,1, 1,1,0],
    // WEST (-X)
    [0,0,1, 0,0,0, 0,1,0, 0,1,1],
  ];

  // Face neighbor offsets
  const NEIGHBOR_OFFSETS = [
    [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1], [1, 0, 0], [-1, 0, 0],
  ];

  // Estimate allocation
  const maxFaces = width * height * depth * 6;
  const verts = new Float32Array(Math.min(maxFaces * 4 * 7, 1024 * 1024));
  const indices = new Uint32Array(Math.min(maxFaces * 6, 1024 * 1024));
  let vCount = 0;
  let iCount = 0;

  function getBlock(x: number, y: number, z: number): number {
    if (x < 0 || x >= width || y < 0 || y >= height || z < 0 || z >= depth) return BlockType.AIR;
    return blocks[x + y * width + z * width * height];
  }

  for (let z = 0; z < depth; z++) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const bt = blocks[x + y * width + z * width * height];
        if (bt === BlockType.AIR || isBlockWater(bt) || isBlockCrossMesh(bt)) continue;

        for (let face = 0; face < 6; face++) {
          const no = NEIGHBOR_OFFSETS[face];
          const neighbor = getBlock(x + no[0], y + no[1], z + no[2]);
          if (isBlockSolid(neighbor) && !isBlockCutout(neighbor)) continue;

          const fv = FACE_VERTS[face];
          const baseV = vCount;
          const tileIndex = bt as number;
          const tileU = (tileIndex % ATLAS_TILES) * uvSize;
          const tileV = Math.floor(tileIndex / ATLAS_TILES) * uvSize;

          const UV_U = [0, 1, 1, 0];
          const UV_V = [0, 0, 1, 1];

          for (let v = 0; v < 4; v++) {
            const vi = vCount * 7;
            // Scale positions by blockSize for LOD
            verts[vi + 0] = worldOffsetX + (x + fv[v * 3 + 0]) * blockSize;
            verts[vi + 1] = (y + fv[v * 3 + 1]) * blockSize;
            verts[vi + 2] = worldOffsetZ + (z + fv[v * 3 + 2]) * blockSize;
            // packed: face | blockType<<8 (reinterpret as uint32)
            const u32View = new Uint32Array(verts.buffer, vi * 4 + 12, 1);
            u32View[0] = face | (bt << 8);
            // UV: tiled (1 block = 1 tile, so same as [0,1])
            verts[vi + 4] = tileU + UV_U[v] * uvSize;
            verts[vi + 5] = tileV + UV_V[v] * uvSize;
            // AO: 1.0 (no AO at LOD)
            verts[vi + 6] = 1.0;
            vCount++;
          }

          indices[iCount++] = baseV + 0;
          indices[iCount++] = baseV + 2;
          indices[iCount++] = baseV + 1;
          indices[iCount++] = baseV + 0;
          indices[iCount++] = baseV + 3;
          indices[iCount++] = baseV + 2;
        }
      }
    }
  }

  return {
    vertices: new Float32Array(verts.buffer, 0, vCount * 7),
    indices: new Uint32Array(indices.buffer, 0, iCount),
    indexCount: iCount,
  };
}
