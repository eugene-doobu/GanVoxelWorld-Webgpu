// LODGenerator: 2× downsample + simplified mesh builder for LOD chunks.

import { CHUNK_WIDTH, CHUNK_HEIGHT, CHUNK_DEPTH } from '../constants';
import { BlockType, isBlockSolid, isBlockWater, isBlockCrossMesh, isBlockTorch } from '../terrain/BlockTypes';
import { Chunk } from '../terrain/Chunk';

// LOD grid dimensions (2× downsample)
export const LOD_WIDTH = CHUNK_WIDTH / 2;   // 8
export const LOD_HEIGHT = CHUNK_HEIGHT / 2;  // 64
export const LOD_DEPTH = CHUNK_DEPTH / 2;    // 8
export const LOD_TOTAL = LOD_WIDTH * LOD_HEIGHT * LOD_DEPTH; // 4096

// Face vertices for a unit cube (same order as MeshBuilder)
// TOP=0, BOTTOM=1, NORTH=2(+Z), SOUTH=3(-Z), EAST=4(+X), WEST=5(-X)
const FACE_VERTICES: number[][] = [
  // TOP (y+1): v0(0,1,0) v1(1,1,0) v2(1,1,1) v3(0,1,1)
  [0,1,0, 1,1,0, 1,1,1, 0,1,1],
  // BOTTOM (y=0): v0(0,0,1) v1(1,0,1) v2(1,0,0) v3(0,0,0)
  [0,0,1, 1,0,1, 1,0,0, 0,0,0],
  // NORTH (+Z): v0(1,0,1) v1(0,0,1) v2(0,1,1) v3(1,1,1)
  [1,0,1, 0,0,1, 0,1,1, 1,1,1],
  // SOUTH (-Z): v0(0,0,0) v1(1,0,0) v2(1,1,0) v3(0,1,0)
  [0,0,0, 1,0,0, 1,1,0, 0,1,0],
  // EAST (+X): v0(1,0,0) v1(1,0,1) v2(1,1,1) v3(1,1,0)
  [1,0,0, 1,0,1, 1,1,1, 1,1,0],
  // WEST (-X): v0(0,0,1) v1(0,0,0) v2(0,1,0) v3(0,1,1)
  [0,0,1, 0,0,0, 0,1,0, 0,1,1],
];

// Tiled UV [0,1]×[0,1] per face per vertex — matches FACE_VERTICES winding
const FACE_UVS: number[][] = [
  // TOP: v0(0,0) v1(1,0) v2(1,1) v3(0,1)
  [0,0, 1,0, 1,1, 0,1],
  // BOTTOM: v0(0,1) v1(1,1) v2(1,0) v3(0,0)
  [0,1, 1,1, 1,0, 0,0],
  // NORTH: v0(1,0) v1(0,0) v2(0,1) v3(1,1)
  [1,0, 0,0, 0,1, 1,1],
  // SOUTH: v0(0,0) v1(1,0) v2(1,1) v3(0,1)
  [0,0, 1,0, 1,1, 0,1],
  // EAST: v0(0,0) v1(1,0) v2(1,1) v3(0,1)
  [0,0, 1,0, 1,1, 0,1],
  // WEST: v0(1,0) v1(0,0) v2(0,1) v3(1,1)
  [1,0, 0,0, 0,1, 1,1],
];

// Face normal offsets: [dx, dy, dz] for neighbor check
const FACE_NORMALS: number[][] = [
  [0, 1, 0],  // TOP
  [0, -1, 0], // BOTTOM
  [0, 0, 1],  // NORTH
  [0, 0, -1], // SOUTH
  [1, 0, 0],  // EAST
  [-1, 0, 0], // WEST
];

export interface LODNeighborBlocks {
  north: Uint8Array | null;  // +Z
  south: Uint8Array | null;  // -Z
  east: Uint8Array | null;   // +X
  west: Uint8Array | null;   // -X
}

export interface LODMeshData {
  vertices: Float32Array;
  indices: Uint32Array;
  indexCount: number;
}

function lodIndex(lx: number, ly: number, lz: number): number {
  return lx + ly * LOD_WIDTH + lz * LOD_WIDTH * LOD_HEIGHT;
}

// Remap block type for LOD:
// LEAVES → GRASS_BLOCK (green blob at distance)
// cross-mesh, torch, water → AIR (skip)
function remapBlock(type: number): number {
  if (type === BlockType.LEAVES) return BlockType.GRASS_BLOCK;
  if (isBlockCrossMesh(type) || isBlockTorch(type) || isBlockWater(type)) return BlockType.AIR;
  return type;
}

// Downsample a chunk's blocks to LOD grid (8×64×8) via 2×2×2 majority vote.
// Must be called before chunk.compress() for best performance.
export function downsample(chunk: Chunk): Uint8Array {
  const result = new Uint8Array(LOD_TOTAL);

  const counts = new Map<number, number>();

  for (let lz = 0; lz < LOD_DEPTH; lz++) {
    for (let ly = 0; ly < LOD_HEIGHT; ly++) {
      for (let lx = 0; lx < LOD_WIDTH; lx++) {
        counts.clear();
        let airCount = 0;

        // Sample 2×2×2 block
        for (let dz = 0; dz < 2; dz++) {
          for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
              const raw = chunk.getBlock(lx * 2 + dx, ly * 2 + dy, lz * 2 + dz);
              const type = remapBlock(raw);
              if (type === BlockType.AIR) {
                airCount++;
              } else {
                counts.set(type, (counts.get(type) ?? 0) + 1);
              }
            }
          }
        }

        // Majority vote: AIR if 5+ out of 8
        if (airCount >= 5) {
          result[lodIndex(lx, ly, lz)] = BlockType.AIR;
          continue;
        }

        // Pick most common non-AIR block
        let bestType = BlockType.AIR;
        let bestCount = 0;
        for (const [type, count] of counts) {
          if (count > bestCount) {
            bestCount = count;
            bestType = type;
          }
        }
        result[lodIndex(lx, ly, lz)] = bestType;
      }
    }
  }

  return result;
}

// Build LOD mesh from downsampled blocks.
// Each LOD block is 2× world units. Positions are in world space.
export function buildLODMesh(
  lodBlocks: Uint8Array,
  worldOffsetX: number,
  worldOffsetZ: number,
  neighbors: LODNeighborBlocks | null,
): LODMeshData {
  // Pre-allocate growable arrays
  let vertCapacity = 4096;
  let idxCapacity = 4096;
  let vertF32 = new Float32Array(vertCapacity * 7); // 7 floats per vertex
  let vertU32 = new Uint32Array(vertF32.buffer);
  let idxArr = new Uint32Array(idxCapacity);
  let vertCount = 0;
  let idxCount = 0;

  function ensureVert(need: number): void {
    if (vertCount + need > vertCapacity) {
      vertCapacity = Math.max(vertCapacity * 2, vertCount + need);
      const newBuf = new ArrayBuffer(vertCapacity * 7 * 4);
      new Uint8Array(newBuf).set(new Uint8Array(vertF32.buffer, 0, vertCount * 7 * 4));
      vertF32 = new Float32Array(newBuf);
      vertU32 = new Uint32Array(newBuf);
    }
  }

  function ensureIdx(need: number): void {
    if (idxCount + need > idxCapacity) {
      idxCapacity = Math.max(idxCapacity * 2, idxCount + need);
      const newArr = new Uint32Array(idxCapacity);
      newArr.set(idxArr.subarray(0, idxCount));
      idxArr = newArr;
    }
  }

  function getLODBlock(lx: number, ly: number, lz: number): number {
    // Out of Y bounds
    if (ly < 0) return BlockType.STONE; // below → solid
    if (ly >= LOD_HEIGHT) return BlockType.AIR;

    // In bounds
    if (lx >= 0 && lx < LOD_WIDTH && lz >= 0 && lz < LOD_DEPTH) {
      return lodBlocks[lodIndex(lx, ly, lz)];
    }

    // Check neighbors
    if (lx < 0 && neighbors?.west) {
      return neighbors.west[lodIndex(LOD_WIDTH + lx, ly, lz)];
    }
    if (lx >= LOD_WIDTH && neighbors?.east) {
      return neighbors.east[lodIndex(lx - LOD_WIDTH, ly, lz)];
    }
    if (lz < 0 && neighbors?.south) {
      return neighbors.south[lodIndex(lx, ly, LOD_DEPTH + lz)];
    }
    if (lz >= LOD_DEPTH && neighbors?.north) {
      return neighbors.north[lodIndex(lx, ly, lz - LOD_DEPTH)];
    }

    // No neighbor data → AIR (border faces always render)
    return BlockType.AIR;
  }

  for (let lz = 0; lz < LOD_DEPTH; lz++) {
    for (let ly = 0; ly < LOD_HEIGHT; ly++) {
      for (let lx = 0; lx < LOD_WIDTH; lx++) {
        const blockType = lodBlocks[lodIndex(lx, ly, lz)];
        if (blockType === BlockType.AIR) continue;
        if (!isBlockSolid(blockType)) continue;

        for (let face = 0; face < 6; face++) {
          const norm = FACE_NORMALS[face];
          const nx = lx + norm[0];
          const ny = ly + norm[1];
          const nz = lz + norm[2];

          const neighborType = getLODBlock(nx, ny, nz);
          if (isBlockSolid(neighborType)) continue;

          // Emit face (4 vertices, 6 indices)
          ensureVert(4);
          ensureIdx(6);

          const fv = FACE_VERTICES[face];
          const fuv = FACE_UVS[face];
          const baseVertex = vertCount;

          for (let v = 0; v < 4; v++) {
            const off = vertCount * 7;
            // Position: LOD block at (lx,ly,lz) occupies world space [lx*2, lx*2+2)
            vertF32[off + 0] = worldOffsetX + (lx + fv[v * 3 + 0]) * 2;
            vertF32[off + 1] = (ly + fv[v * 3 + 1]) * 2;
            vertF32[off + 2] = worldOffsetZ + (lz + fv[v * 3 + 2]) * 2;
            // normalIndex packed: face | (blockType << 8)
            vertU32[off + 3] = face | (blockType << 8);
            // Tiled UV [0,1]×[0,1]
            vertF32[off + 4] = fuv[v * 2 + 0];
            vertF32[off + 5] = fuv[v * 2 + 1];
            // AO = 1.0 (no ambient occlusion for LOD)
            vertF32[off + 6] = 1.0;
            vertCount++;
          }

          // Indices: CCW winding, no AO flip (all AO = 1.0)
          idxArr[idxCount++] = baseVertex + 0;
          idxArr[idxCount++] = baseVertex + 2;
          idxArr[idxCount++] = baseVertex + 1;
          idxArr[idxCount++] = baseVertex + 0;
          idxArr[idxCount++] = baseVertex + 3;
          idxArr[idxCount++] = baseVertex + 2;
        }
      }
    }
  }

  // Trim to exact size with independent ArrayBuffers
  const finalVert = new Float32Array(vertF32.buffer.slice(0, vertCount * 7 * 4));
  const finalIdx = new Uint32Array(idxArr.buffer.slice(0, idxCount * 4));

  return {
    vertices: finalVert,
    indices: finalIdx,
    indexCount: idxCount,
  };
}
