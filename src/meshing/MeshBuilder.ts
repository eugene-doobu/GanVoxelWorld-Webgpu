import { CHUNK_WIDTH, CHUNK_HEIGHT, CHUNK_DEPTH, ATLAS_TILES } from '../constants';
import { BlockType, isBlockWater, isBlockSolid, isBlockCutout, isBlockCrossMesh } from '../terrain/BlockTypes';
import { Chunk } from '../terrain/Chunk';

// Face enum: TOP=0, BOTTOM=1, NORTH=2(+Z), SOUTH=3(-Z), EAST=4(+X), WEST=5(-X)
const FACE_VERTICES: Float32Array[] = [
  // TOP (y+1)
  new Float32Array([0,1,0,  1,1,0,  1,1,1,  0,1,1]),
  // BOTTOM (y=0)
  new Float32Array([0,0,1,  1,0,1,  1,0,0,  0,0,0]),
  // NORTH (+Z)
  new Float32Array([1,0,1,  0,0,1,  0,1,1,  1,1,1]),
  // SOUTH (-Z)
  new Float32Array([0,0,0,  1,0,0,  1,1,0,  0,1,0]),
  // EAST (+X)
  new Float32Array([1,0,0,  1,0,1,  1,1,1,  1,1,0]),
  // WEST (-X)
  new Float32Array([0,0,1,  0,0,0,  0,1,0,  0,1,1]),
];

// Growable typed buffer for building mesh data directly into typed arrays.
// Supports dual f32/u32 views on the same ArrayBuffer for interleaved packing.
class GrowableBuffer {
  buffer: ArrayBuffer;
  f32: Float32Array;
  u32: Uint32Array;
  /** Current write offset in 32-bit elements */
  offset: number;

  constructor(initialFloats: number) {
    this.buffer = new ArrayBuffer(initialFloats * 4);
    this.f32 = new Float32Array(this.buffer);
    this.u32 = new Uint32Array(this.buffer);
    this.offset = 0;
  }

  /** Ensure there is room for at least `count` more 32-bit elements. */
  ensure(count: number): void {
    const needed = this.offset + count;
    if (needed <= this.f32.length) return;
    let newLen = this.f32.length * 2;
    while (newLen < needed) newLen *= 2;
    const newBuf = new ArrayBuffer(newLen * 4);
    new Uint8Array(newBuf).set(new Uint8Array(this.buffer, 0, this.offset * 4));
    this.buffer = newBuf;
    this.f32 = new Float32Array(newBuf);
    this.u32 = new Uint32Array(newBuf);
  }

  /** Write a float value and advance offset. */
  pushF32(v: number): void {
    this.f32[this.offset++] = v;
  }

  /** Write a uint32 value and advance offset. */
  pushU32(v: number): void {
    this.u32[this.offset++] = v;
  }

  /** Return a trimmed Float32Array copy of the written data. */
  trimF32(): Float32Array {
    // Must copy to a correctly-sized ArrayBuffer because consumers use .buffer for GPU upload
    return new Float32Array(this.buffer.slice(0, this.offset * 4));
  }
}

// Growable index buffer backed by Uint32Array.
class GrowableIndexBuffer {
  data: Uint32Array;
  offset: number;

  constructor(initialCount: number) {
    this.data = new Uint32Array(initialCount);
    this.offset = 0;
  }

  ensure(count: number): void {
    const needed = this.offset + count;
    if (needed <= this.data.length) return;
    let newLen = this.data.length * 2;
    while (newLen < needed) newLen *= 2;
    const newData = new Uint32Array(newLen);
    newData.set(this.data.subarray(0, this.offset));
    this.data = newData;
  }

  push6(a: number, b: number, c: number, d: number, e: number, f: number): void {
    const o = this.offset;
    this.data[o] = a;
    this.data[o + 1] = b;
    this.data[o + 2] = c;
    this.data[o + 3] = d;
    this.data[o + 4] = e;
    this.data[o + 5] = f;
    this.offset = o + 6;
  }

  trim(): Uint32Array {
    // Must copy to a correctly-sized ArrayBuffer because consumers use .buffer for GPU upload
    return new Uint32Array(this.data.buffer.slice(0, this.offset * 4));
  }
}

// AO neighbor offsets per face per vertex: [side1, side2, corner] as [dx,dy,dz] relative to face normal direction
// Each face has 4 vertices, each vertex checks 3 neighbors (side1, side2, corner)
// Format: AO_OFFSETS[face][vertex] = [s1x,s1y,s1z, s2x,s2y,s2z, cx,cy,cz]
const AO_OFFSETS: number[][][] = [
  // TOP (y+1)
  [
    [-1,1,0,  0,1,-1,  -1,1,-1],  // v0 (0,1,0)
    [ 1,1,0,  0,1,-1,   1,1,-1],  // v1 (1,1,0)
    [ 1,1,0,  0,1, 1,   1,1, 1],  // v2 (1,1,1)
    [-1,1,0,  0,1, 1,  -1,1, 1],  // v3 (0,1,1)
  ],
  // BOTTOM (y-1)
  [
    [-1,-1,0,  0,-1, 1,  -1,-1, 1],  // v0 (0,0,1)
    [ 1,-1,0,  0,-1, 1,   1,-1, 1],  // v1 (1,0,1)
    [ 1,-1,0,  0,-1,-1,   1,-1,-1],  // v2 (1,0,0)
    [-1,-1,0,  0,-1,-1,  -1,-1,-1],  // v3 (0,0,0)
  ],
  // NORTH (+Z)
  [
    [ 1,0,1,  0,-1,1,   1,-1,1],  // v0 (1,0,1)
    [-1,0,1,  0,-1,1,  -1,-1,1],  // v1 (0,0,1)
    [-1,0,1,  0, 1,1,  -1, 1,1],  // v2 (0,1,1)
    [ 1,0,1,  0, 1,1,   1, 1,1],  // v3 (1,1,1)
  ],
  // SOUTH (-Z)
  [
    [-1,0,-1,  0,-1,-1,  -1,-1,-1],  // v0 (0,0,0)
    [ 1,0,-1,  0,-1,-1,   1,-1,-1],  // v1 (1,0,0)
    [ 1,0,-1,  0, 1,-1,   1, 1,-1],  // v2 (1,1,0)
    [-1,0,-1,  0, 1,-1,  -1, 1,-1],  // v3 (0,1,0)
  ],
  // EAST (+X)
  [
    [1,0,-1,  1,-1,0,  1,-1,-1],  // v0 (1,0,0)
    [1,0, 1,  1,-1,0,  1,-1, 1],  // v1 (1,0,1)
    [1,0, 1,  1, 1,0,  1, 1, 1],  // v2 (1,1,1)
    [1,0,-1,  1, 1,0,  1, 1,-1],  // v3 (1,1,0)
  ],
  // WEST (-X)
  [
    [-1,0, 1,  -1,-1,0,  -1,-1, 1],  // v0 (0,0,1)
    [-1,0,-1,  -1,-1,0,  -1,-1,-1],  // v1 (0,0,0)
    [-1,0,-1,  -1, 1,0,  -1, 1,-1],  // v2 (0,1,0)
    [-1,0, 1,  -1, 1,0,  -1, 1, 1],  // v3 (0,1,1)
  ],
];

export interface ChunkNeighbors {
  north: Chunk | null;  // +Z
  south: Chunk | null;  // -Z
  east: Chunk | null;   // +X
  west: Chunk | null;   // -X
}

export interface MeshData {
  vertices: Float32Array;
  indices: Uint32Array;
  vertexCount: number;
  indexCount: number;
  // Water mesh (separate forward pass)
  waterVertices: Float32Array;
  waterIndices: Uint32Array;
  waterVertexCount: number;
  waterIndexCount: number;
  // Vegetation mesh (cross-mesh, separate pass with cullMode: 'none')
  vegVertices: Float32Array;
  vegIndices: Uint32Array;
  vegVertexCount: number;
  vegIndexCount: number;
}

export function buildChunkMesh(chunk: Chunk, neighbors: ChunkNeighbors | null = null): MeshData {
  // Pre-allocate typed arrays directly. Estimated capacities:
  // Solid: ~5000 faces * 4 verts * 7 floats = 140,000 floats; indices: ~5000 faces * 6 = 30,000
  // Water/Veg: much smaller, start conservative.
  const solidVerts = new GrowableBuffer(140000);
  const solidIdx = new GrowableIndexBuffer(30000);
  let vertexCount = 0;

  // Water mesh (separate): pos3 + uv2 = 5 floats per vertex
  const waterVerts = new GrowableBuffer(5000);
  const waterIdx = new GrowableIndexBuffer(3000);
  let waterVertexCount = 0;

  // Vegetation mesh (cross-mesh): same 28-byte (7 float) vertex format as solid
  const vegVerts = new GrowableBuffer(8000);
  const vegIdx = new GrowableIndexBuffer(4800);
  let vegVertexCount = 0;

  const uvSize = 1.0 / ATLAS_TILES;

  // UV lookup table: vertex 0=(0,0), 1=(1,0), 2=(1,1), 3=(0,1)
  const UV_U = [0, 1, 1, 0];
  const UV_V = [0, 0, 1, 1];

  for (let x = 0; x < CHUNK_WIDTH; x++) {
    for (let y = 0; y < CHUNK_HEIGHT; y++) {
      for (let z = 0; z < CHUNK_DEPTH; z++) {
        const blockType = chunk.getBlock(x, y, z);
        if (blockType === BlockType.AIR) continue;

        // Water blocks go to separate mesh (TOP face only = water surface)
        if (isBlockWater(blockType)) {
          // Only render TOP face (face=0)
          if (!shouldRenderWaterFace(chunk, neighbors, x, y, z, 0)) continue;

          const fv = FACE_VERTICES[0];
          const baseVertex = waterVertexCount;

          waterVerts.ensure(20); // 4 verts * 5 floats
          for (let v = 0; v < 4; v++) {
            waterVerts.pushF32(chunk.worldOffsetX + x + fv[v * 3 + 0]);
            waterVerts.pushF32(y + fv[v * 3 + 1]);
            waterVerts.pushF32(chunk.worldOffsetZ + z + fv[v * 3 + 2]);
            waterVerts.pushF32(UV_U[v]);
            waterVerts.pushF32(UV_V[v]);
          }

          waterIdx.ensure(6);
          waterIdx.push6(
            baseVertex + 0, baseVertex + 2, baseVertex + 1,
            baseVertex + 0, baseVertex + 3, baseVertex + 2,
          );
          waterVertexCount += 4;
          continue;
        }

        // Cross-mesh vegetation blocks (X-shaped two diagonal quads)
        if (isBlockCrossMesh(blockType)) {
          const tileIndex = blockType as number;
          const tileU = (tileIndex % ATLAS_TILES) * uvSize;
          const tileV = Math.floor(tileIndex / ATLAS_TILES) * uvSize;

          const wx = chunk.worldOffsetX + x;
          const wz = chunk.worldOffsetZ + z;
          const faceIdxPacked = 0 | (blockType << 8);

          const yBot = y + 0.01;
          const yTop = y + 0.99;

          // 2 quads * 4 verts * 7 floats = 56 floats; 2 quads * 6 indices = 12
          vegVerts.ensure(56);
          vegIdx.ensure(12);

          // Quad 1: diagonal (0,0)-(1,1) in XZ
          const baseV1 = vegVertexCount;
          // v0: bottom-left
          vegVerts.pushF32(wx); vegVerts.pushF32(yBot); vegVerts.pushF32(wz);
          vegVerts.pushU32(faceIdxPacked);
          vegVerts.pushF32(tileU); vegVerts.pushF32(tileV + uvSize);
          vegVerts.pushF32(1.0);
          // v1: bottom-right
          vegVerts.pushF32(wx + 1); vegVerts.pushF32(yBot); vegVerts.pushF32(wz + 1);
          vegVerts.pushU32(faceIdxPacked);
          vegVerts.pushF32(tileU + uvSize); vegVerts.pushF32(tileV + uvSize);
          vegVerts.pushF32(1.0);
          // v2: top-right
          vegVerts.pushF32(wx + 1); vegVerts.pushF32(yTop); vegVerts.pushF32(wz + 1);
          vegVerts.pushU32(faceIdxPacked);
          vegVerts.pushF32(tileU + uvSize); vegVerts.pushF32(tileV);
          vegVerts.pushF32(1.0);
          // v3: top-left
          vegVerts.pushF32(wx); vegVerts.pushF32(yTop); vegVerts.pushF32(wz);
          vegVerts.pushU32(faceIdxPacked);
          vegVerts.pushF32(tileU); vegVerts.pushF32(tileV);
          vegVerts.pushF32(1.0);
          vegIdx.push6(baseV1 + 0, baseV1 + 2, baseV1 + 1, baseV1 + 0, baseV1 + 3, baseV1 + 2);
          vegVertexCount += 4;

          // Quad 2: other diagonal (1,0)-(0,1) in XZ
          const baseV2 = vegVertexCount;
          vegVerts.pushF32(wx + 1); vegVerts.pushF32(yBot); vegVerts.pushF32(wz);
          vegVerts.pushU32(faceIdxPacked);
          vegVerts.pushF32(tileU); vegVerts.pushF32(tileV + uvSize);
          vegVerts.pushF32(1.0);
          vegVerts.pushF32(wx); vegVerts.pushF32(yBot); vegVerts.pushF32(wz + 1);
          vegVerts.pushU32(faceIdxPacked);
          vegVerts.pushF32(tileU + uvSize); vegVerts.pushF32(tileV + uvSize);
          vegVerts.pushF32(1.0);
          vegVerts.pushF32(wx); vegVerts.pushF32(yTop); vegVerts.pushF32(wz + 1);
          vegVerts.pushU32(faceIdxPacked);
          vegVerts.pushF32(tileU + uvSize); vegVerts.pushF32(tileV);
          vegVerts.pushF32(1.0);
          vegVerts.pushF32(wx + 1); vegVerts.pushF32(yTop); vegVerts.pushF32(wz);
          vegVerts.pushU32(faceIdxPacked);
          vegVerts.pushF32(tileU); vegVerts.pushF32(tileV);
          vegVerts.pushF32(1.0);
          vegIdx.push6(baseV2 + 0, baseV2 + 2, baseV2 + 1, baseV2 + 0, baseV2 + 3, baseV2 + 2);
          vegVertexCount += 4;

          continue;
        }

        // Render all non-AIR, non-water solid blocks
        const tileIndex = blockType as number;
        const tileU = (tileIndex % ATLAS_TILES) * uvSize;
        const tileV = Math.floor(tileIndex / ATLAS_TILES) * uvSize;

        // Check 6 faces
        for (let face = 0; face < 6; face++) {
          if (!shouldRenderFace(chunk, neighbors, x, y, z, face, blockType)) continue;

          const fv = FACE_VERTICES[face];
          const baseVertex = vertexCount;

          // 4 verts * 7 floats = 28; 6 indices
          solidVerts.ensure(28);
          solidIdx.ensure(6);

          let ao0 = 0, ao1 = 0, ao2 = 0, ao3 = 0;
          for (let v = 0; v < 4; v++) {
            const vx = x + fv[v * 3 + 0];
            const vy = y + fv[v * 3 + 1];
            const vz = z + fv[v * 3 + 2];

            // World position
            solidVerts.pushF32(chunk.worldOffsetX + vx);
            solidVerts.pushF32(vy);
            solidVerts.pushF32(chunk.worldOffsetZ + vz);

            // Normal index (as u32 reinterpreted): low 8 bits = face, upper bits = blockType
            solidVerts.pushU32(face | (blockType << 8));

            // UV
            solidVerts.pushF32(tileU + UV_U[v] * uvSize);
            solidVerts.pushF32(tileV + UV_V[v] * uvSize);

            // Vertex AO
            const aoVal = computeVertexAO(chunk, neighbors, x, y, z, face, v);
            solidVerts.pushF32(aoVal);

            // Store AO per vertex for triangle flip decision
            if (v === 0) ao0 = aoVal;
            else if (v === 1) ao1 = aoVal;
            else if (v === 2) ao2 = aoVal;
            else ao3 = aoVal;
          }

          // AO-aware triangle flip: choose diagonal with more balanced AO
          if (ao0 + ao2 > ao1 + ao3) {
            solidIdx.push6(
              baseVertex + 0, baseVertex + 2, baseVertex + 1,
              baseVertex + 0, baseVertex + 3, baseVertex + 2,
            );
          } else {
            solidIdx.push6(
              baseVertex + 0, baseVertex + 3, baseVertex + 1,
              baseVertex + 1, baseVertex + 3, baseVertex + 2,
            );
          }
          vertexCount += 4;
        }
      }
    }
  }

  // Trim solid vertex buffer — data is already in correct interleaved format
  const solidVerticesTrimmed = solidVerts.trimF32();
  const solidIndicesTrimmed = solidIdx.trim();

  // Trim water buffers
  const waterVerticesTrimmed = waterVerts.trimF32();
  const waterIndicesTrimmed = waterIdx.trim();

  // Trim vegetation buffers — data is already in correct interleaved format
  const vegVerticesTrimmed = vegVerts.trimF32();
  const vegIndicesTrimmed = vegIdx.trim();

  return {
    vertices: solidVerticesTrimmed,
    indices: solidIndicesTrimmed,
    vertexCount,
    indexCount: solidIndicesTrimmed.length,
    waterVertices: waterVerticesTrimmed,
    waterIndices: waterIndicesTrimmed,
    waterVertexCount,
    waterIndexCount: waterIndicesTrimmed.length,
    vegVertices: vegVerticesTrimmed,
    vegIndices: vegIndicesTrimmed,
    vegVertexCount,
    vegIndexCount: vegIndicesTrimmed.length,
  };
}


function isSolidAt(chunk: Chunk, neighbors: ChunkNeighbors | null, x: number, y: number, z: number): boolean {
  // Y out-of-bounds: below world is solid, above world is air
  if (y < 0) return true;
  if (y >= CHUNK_HEIGHT) return false;

  // X out-of-bounds: check neighbor chunks
  if (x < 0) {
    return neighbors?.west?.isSolidAt(CHUNK_WIDTH + x, y, z) ?? false;
  }
  if (x >= CHUNK_WIDTH) {
    return neighbors?.east?.isSolidAt(x - CHUNK_WIDTH, y, z) ?? false;
  }

  // Z out-of-bounds: check neighbor chunks
  if (z < 0) {
    return neighbors?.south?.isSolidAt(x, y, CHUNK_DEPTH + z) ?? false;
  }
  if (z >= CHUNK_DEPTH) {
    return neighbors?.north?.isSolidAt(x, y, z - CHUNK_DEPTH) ?? false;
  }

  return chunk.isSolidAt(x, y, z);
}

function computeVertexAO(chunk: Chunk, neighbors: ChunkNeighbors | null, bx: number, by: number, bz: number, face: number, vertexIdx: number): number {
  const offsets = AO_OFFSETS[face][vertexIdx];
  const s1 = isSolidAt(chunk, neighbors, bx + offsets[0], by + offsets[1], bz + offsets[2]) ? 1 : 0;
  const s2 = isSolidAt(chunk, neighbors, bx + offsets[3], by + offsets[4], bz + offsets[5]) ? 1 : 0;
  const c  = isSolidAt(chunk, neighbors, bx + offsets[6], by + offsets[7], bz + offsets[8]) ? 1 : 0;

  let ao: number;
  if (s1 && s2) {
    ao = 0;
  } else {
    ao = 3 - (s1 + s2 + c);
  }
  return ao / 3.0;
}

function getBlockAt(chunk: Chunk, neighbors: ChunkNeighbors | null, x: number, y: number, z: number): number {
  if (y < 0 || y >= CHUNK_HEIGHT) return BlockType.AIR;
  if (x < 0) return neighbors?.west?.getBlock(CHUNK_WIDTH + x, y, z) ?? BlockType.AIR;
  if (x >= CHUNK_WIDTH) return neighbors?.east?.getBlock(x - CHUNK_WIDTH, y, z) ?? BlockType.AIR;
  if (z < 0) return neighbors?.south?.getBlock(x, y, CHUNK_DEPTH + z) ?? BlockType.AIR;
  if (z >= CHUNK_DEPTH) return neighbors?.north?.getBlock(x, y, z - CHUNK_DEPTH) ?? BlockType.AIR;
  return chunk.getBlock(x, y, z);
}

function shouldRenderWaterFace(chunk: Chunk, neighbors: ChunkNeighbors | null, x: number, y: number, z: number, face: number): boolean {
  let nx = x, ny = y, nz = z;
  switch (face) {
    case 0: ny = y + 1; break;
    case 1: ny = y - 1; break;
    case 2: nz = z + 1; break;
    case 3: nz = z - 1; break;
    case 4: nx = x + 1; break;
    case 5: nx = x - 1; break;
  }
  const neighbor = getBlockAt(chunk, neighbors, nx, ny, nz);
  // Render water face only if neighbor is not water and not solid (i.e., AIR)
  return !isBlockWater(neighbor) && !isBlockSolid(neighbor);
}

function shouldRenderFace(chunk: Chunk, neighbors: ChunkNeighbors | null, x: number, y: number, z: number, face: number, blockType: number): boolean {
  let nx = x, ny = y, nz = z;
  switch (face) {
    case 0: ny = y + 1; break; // TOP
    case 1: ny = y - 1; break; // BOTTOM
    case 2: nz = z + 1; break; // NORTH
    case 3: nz = z - 1; break; // SOUTH
    case 4: nx = x + 1; break; // EAST
    case 5: nx = x - 1; break; // WEST
  }

  const neighborBlock = getBlockAt(chunk, neighbors, nx, ny, nz);

  // Cutout-cutout adjacency (e.g., leaf-leaf): only render from the positive
  // direction side (even face) to prevent z-fighting on coplanar faces.
  if (isBlockCutout(blockType) && isBlockCutout(neighborBlock)) {
    return face % 2 === 0;
  }

  // Render face if neighbor is not solid, or if neighbor is a cutout block (leaves)
  return !isBlockSolid(neighborBlock) || isBlockCutout(neighborBlock);
}
