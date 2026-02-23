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

// ---- Greedy meshing types ----
// Face descriptor for greedy meshing: encodes blockType + 4 AO values.
// Value 0 means "no face here" (already merged or not visible).
// Cutout blocks get descriptor -1 to exclude from greedy merge.
const NO_FACE = 0;
const CUTOUT_FACE = -1;

// Pack blockType + 4 AO values (each 0-3 = 2 bits) into a single i32.
// Layout: bits[0..7]=blockType, bits[8..9]=ao0, bits[10..11]=ao1, bits[12..13]=ao2, bits[14..15]=ao3
function packFaceDesc(blockType: number, ao0: number, ao1: number, ao2: number, ao3: number): number {
  return (blockType & 0xFF) | ((ao0 & 3) << 8) | ((ao1 & 3) << 10) | ((ao2 & 3) << 12) | ((ao3 & 3) << 14);
}

function unpackBlockType(desc: number): number {
  return desc & 0xFF;
}

function unpackAO(desc: number): [number, number, number, number] {
  return [
    (desc >> 8) & 3,
    (desc >> 10) & 3,
    (desc >> 12) & 3,
    (desc >> 14) & 3,
  ];
}

// Greedy meshing axis configuration for each face direction.
// For each face, we need:
//   - sliceAxis: the axis perpendicular to the face (0=X, 1=Y, 2=Z)
//   - uAxis, vAxis: the two axes spanning the face plane
//   - sliceMax, uMax, vMax: dimensions along those axes
//   - sliceOffset: +1 for positive-facing, 0 for negative-facing (for vertex position)
interface GreedyFaceConfig {
  face: number;
  sliceAxis: number;  // 0=X, 1=Y, 2=Z
  uAxis: number;
  vAxis: number;
  sliceMax: number;
  uMax: number;
  vMax: number;
  positive: boolean;  // true for TOP/NORTH/EAST, false for BOTTOM/SOUTH/WEST
}

const GREEDY_CONFIGS: GreedyFaceConfig[] = [
  // TOP (face=0): slice along Y, u=X, v=Z, positive face
  { face: 0, sliceAxis: 1, uAxis: 0, vAxis: 2, sliceMax: CHUNK_HEIGHT, uMax: CHUNK_WIDTH, vMax: CHUNK_DEPTH, positive: true },
  // BOTTOM (face=1): slice along Y, u=X, v=Z, negative face
  { face: 1, sliceAxis: 1, uAxis: 0, vAxis: 2, sliceMax: CHUNK_HEIGHT, uMax: CHUNK_WIDTH, vMax: CHUNK_DEPTH, positive: false },
  // NORTH (face=2, +Z): slice along Z, u=X, v=Y, positive face
  { face: 2, sliceAxis: 2, uAxis: 0, vAxis: 1, sliceMax: CHUNK_DEPTH, uMax: CHUNK_WIDTH, vMax: CHUNK_HEIGHT, positive: true },
  // SOUTH (face=3, -Z): slice along Z, u=X, v=Y, negative face
  { face: 3, sliceAxis: 2, uAxis: 0, vAxis: 1, sliceMax: CHUNK_DEPTH, uMax: CHUNK_WIDTH, vMax: CHUNK_HEIGHT, positive: false },
  // EAST (face=4, +X): slice along X, u=Z, v=Y, positive face
  { face: 4, sliceAxis: 0, uAxis: 2, vAxis: 1, sliceMax: CHUNK_WIDTH, uMax: CHUNK_DEPTH, vMax: CHUNK_HEIGHT, positive: true },
  // WEST (face=5, -X): slice along X, u=Z, v=Y, negative face
  { face: 5, sliceAxis: 0, uAxis: 2, vAxis: 1, sliceMax: CHUNK_WIDTH, uMax: CHUNK_DEPTH, vMax: CHUNK_HEIGHT, positive: false },
];

export function buildChunkMesh(chunk: Chunk, neighbors: ChunkNeighbors | null = null): MeshData {
  const solidVerts = new GrowableBuffer(70000);
  const solidIdx = new GrowableIndexBuffer(15000);
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

  // ---- First pass: Water and Vegetation (per-block, no greedy) ----
  for (let x = 0; x < CHUNK_WIDTH; x++) {
    for (let y = 0; y < CHUNK_HEIGHT; y++) {
      for (let z = 0; z < CHUNK_DEPTH; z++) {
        const blockType = chunk.getBlock(x, y, z);
        if (blockType === BlockType.AIR) continue;

        // Water blocks go to separate mesh (TOP face only = water surface)
        if (isBlockWater(blockType)) {
          if (!shouldRenderWaterFace(chunk, neighbors, x, y, z, 0)) continue;

          const fv = FACE_VERTICES[0];
          const baseVertex = waterVertexCount;

          waterVerts.ensure(20);
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

          vegVerts.ensure(56);
          vegIdx.ensure(12);

          // Quad 1: diagonal (0,0)-(1,1) in XZ
          const baseV1 = vegVertexCount;
          vegVerts.pushF32(wx); vegVerts.pushF32(yBot); vegVerts.pushF32(wz);
          vegVerts.pushU32(faceIdxPacked);
          vegVerts.pushF32(tileU); vegVerts.pushF32(tileV + uvSize);
          vegVerts.pushF32(1.0);
          vegVerts.pushF32(wx + 1); vegVerts.pushF32(yBot); vegVerts.pushF32(wz + 1);
          vegVerts.pushU32(faceIdxPacked);
          vegVerts.pushF32(tileU + uvSize); vegVerts.pushF32(tileV + uvSize);
          vegVerts.pushF32(1.0);
          vegVerts.pushF32(wx + 1); vegVerts.pushF32(yTop); vegVerts.pushF32(wz + 1);
          vegVerts.pushU32(faceIdxPacked);
          vegVerts.pushF32(tileU + uvSize); vegVerts.pushF32(tileV);
          vegVerts.pushF32(1.0);
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
      }
    }
  }

  // ---- Second pass: Greedy meshing for solid blocks (6 face directions) ----
  // For each face direction, iterate over slices perpendicular to the face normal.
  // Each slice is a 2D grid of face descriptors (blockType + AO).
  // Greedy rectangle expansion merges adjacent faces with the same descriptor.

  for (const cfg of GREEDY_CONFIGS) {
    const { face, sliceAxis, uAxis, vAxis, sliceMax, uMax, vMax, positive } = cfg;

    // Reusable 2D grid for this face direction (uMax × vMax)
    // Value 0 = no face, >0 = packed descriptor, -1 = cutout face (no merge)
    const grid = new Int32Array(uMax * vMax);

    for (let slice = 0; slice < sliceMax; slice++) {
      // Fill the grid for this slice
      let hasFaces = false;
      for (let v = 0; v < vMax; v++) {
        for (let u = 0; u < uMax; u++) {
          // Map (slice, u, v) back to (x, y, z)
          const coords = [0, 0, 0];
          coords[sliceAxis] = slice;
          coords[uAxis] = u;
          coords[vAxis] = v;
          const bx = coords[0], by = coords[1], bz = coords[2];

          const blockType = chunk.getBlock(bx, by, bz);

          // Skip non-solid, water, vegetation
          if (blockType === BlockType.AIR || isBlockWater(blockType) || isBlockCrossMesh(blockType)) {
            grid[u + v * uMax] = NO_FACE;
            continue;
          }

          if (!shouldRenderFace(chunk, neighbors, bx, by, bz, face, blockType)) {
            grid[u + v * uMax] = NO_FACE;
            continue;
          }

          // Cutout blocks (LEAVES): don't merge, emit per-face with original UV
          if (isBlockCutout(blockType)) {
            grid[u + v * uMax] = CUTOUT_FACE;

            // Emit cutout face immediately (per-face with atlas UV, same as original)
            emitPerFaceSolid(
              chunk, neighbors, solidVerts, solidIdx,
              bx, by, bz, face, blockType, uvSize, vertexCount
            );
            vertexCount += 4;
            continue;
          }

          // Compute 4 AO values for this face
          const ao0 = computeVertexAOraw(chunk, neighbors, bx, by, bz, face, 0);
          const ao1 = computeVertexAOraw(chunk, neighbors, bx, by, bz, face, 1);
          const ao2 = computeVertexAOraw(chunk, neighbors, bx, by, bz, face, 2);
          const ao3 = computeVertexAOraw(chunk, neighbors, bx, by, bz, face, 3);

          grid[u + v * uMax] = packFaceDesc(blockType, ao0, ao1, ao2, ao3);
          hasFaces = true;
        }
      }

      if (!hasFaces) continue;

      // Greedy rectangle expansion
      for (let v = 0; v < vMax; v++) {
        for (let u = 0; u < uMax; ) {
          const desc = grid[u + v * uMax];
          if (desc <= 0) { u++; continue; }

          // Expand width (u direction)
          let w = 1;
          while (u + w < uMax && grid[(u + w) + v * uMax] === desc) {
            w++;
          }

          // Expand height (v direction)
          let h = 1;
          let canExpand = true;
          while (v + h < vMax && canExpand) {
            for (let du = 0; du < w; du++) {
              if (grid[(u + du) + (v + h) * uMax] !== desc) {
                canExpand = false;
                break;
              }
            }
            if (canExpand) h++;
          }

          // Mark merged cells
          for (let dv = 0; dv < h; dv++) {
            for (let du = 0; du < w; du++) {
              grid[(u + du) + (v + dv) * uMax] = NO_FACE;
            }
          }

          // Emit merged quad
          const blockType = unpackBlockType(desc);
          const [ao0raw, ao1raw, ao2raw, ao3raw] = unpackAO(desc);
          const ao0 = ao0raw / 3.0;
          const ao1 = ao1raw / 3.0;
          const ao2 = ao2raw / 3.0;
          const ao3 = ao3raw / 3.0;

          // Map origin (slice, u, v) back to world coords
          const origin = [0, 0, 0];
          origin[sliceAxis] = slice;
          origin[uAxis] = u;
          origin[vAxis] = v;

          emitGreedyQuad(
            chunk, solidVerts, solidIdx,
            face, blockType, origin,
            sliceAxis, uAxis, vAxis,
            w, h, positive,
            ao0, ao1, ao2, ao3,
            uvSize, vertexCount
          );
          vertexCount += 4;

          u += w;
        }
      }
    }
  }

  const solidVerticesTrimmed = solidVerts.trimF32();
  const solidIndicesTrimmed = solidIdx.trim();
  const waterVerticesTrimmed = waterVerts.trimF32();
  const waterIndicesTrimmed = waterIdx.trim();
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

// Emit a single per-face quad for cutout blocks (LEAVES) — original atlas UV, per-vertex AO
function emitPerFaceSolid(
  chunk: Chunk, neighbors: ChunkNeighbors | null,
  solidVerts: GrowableBuffer, solidIdx: GrowableIndexBuffer,
  bx: number, by: number, bz: number,
  face: number, blockType: number,
  uvSize: number, baseVertex: number,
): void {
  const fv = FACE_VERTICES[face];
  const tileIndex = blockType as number;
  const tileU = (tileIndex % ATLAS_TILES) * uvSize;
  const tileV = Math.floor(tileIndex / ATLAS_TILES) * uvSize;

  // UV lookup table: vertex 0=(0,0), 1=(1,0), 2=(1,1), 3=(0,1)
  const UV_U = [0, 1, 1, 0];
  const UV_V = [0, 0, 1, 1];

  solidVerts.ensure(28);
  solidIdx.ensure(6);

  let ao0 = 0, ao1 = 0, ao2 = 0, ao3 = 0;
  for (let v = 0; v < 4; v++) {
    const vx = bx + fv[v * 3 + 0];
    const vy = by + fv[v * 3 + 1];
    const vz = bz + fv[v * 3 + 2];

    solidVerts.pushF32(chunk.worldOffsetX + vx);
    solidVerts.pushF32(vy);
    solidVerts.pushF32(chunk.worldOffsetZ + vz);
    solidVerts.pushU32(face | (blockType << 8));
    solidVerts.pushF32(tileU + UV_U[v] * uvSize);
    solidVerts.pushF32(tileV + UV_V[v] * uvSize);
    const aoVal = computeVertexAO(chunk, neighbors, bx, by, bz, face, v);
    solidVerts.pushF32(aoVal);

    if (v === 0) ao0 = aoVal;
    else if (v === 1) ao1 = aoVal;
    else if (v === 2) ao2 = aoVal;
    else ao3 = aoVal;
  }

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
}

// Emit a greedy-merged quad.
// The quad covers cells [u..u+w-1] × [v..v+h-1] at the given slice.
// UV is tiled: [0, W] × [0, H] so the shader can fract() to tile the atlas texture.
function emitGreedyQuad(
  chunk: Chunk,
  solidVerts: GrowableBuffer, solidIdx: GrowableIndexBuffer,
  face: number, blockType: number,
  origin: number[],          // [x, y, z] of the quad's min corner block
  sliceAxis: number, uAxis: number, vAxis: number,
  w: number, h: number,     // width/height in blocks
  positive: boolean,         // true for faces pointing in positive axis direction
  ao0: number, ao1: number, ao2: number, ao3: number,
  uvSize: number,
  baseVertex: number,
): void {
  // Compute 4 corner world positions of the merged quad.
  // The face sits on the slice boundary:
  //   positive face → position on the (slice+1) side
  //   negative face → position on the (slice) side
  const slicePos = positive ? origin[sliceAxis] + 1 : origin[sliceAxis];
  const uStart = origin[uAxis];
  const vStart = origin[vAxis];
  const uEnd = uStart + w;
  const vEnd = vStart + h;

  // Build 4 corners in (sliceAxis, uAxis, vAxis) space, then map to (x, y, z)
  // The vertex order must match the FACE_VERTICES winding for each face.
  //
  // FACE_VERTICES winding for each face:
  //   TOP     (y+1): v0(0,1,0) v1(1,1,0) v2(1,1,1) v3(0,1,1)  → u=X, v=Z → (uS,vS)(uE,vS)(uE,vE)(uS,vE)
  //   BOTTOM  (y=0): v0(0,0,1) v1(1,0,1) v2(1,0,0) v3(0,0,0)  → u=X, v=Z → (uS,vE)(uE,vE)(uE,vS)(uS,vS)
  //   NORTH   (+Z):  v0(1,0,1) v1(0,0,1) v2(0,1,1) v3(1,1,1)  → u=X, v=Y → (uE,vS)(uS,vS)(uS,vE)(uE,vE)
  //   SOUTH   (-Z):  v0(0,0,0) v1(1,0,0) v2(1,1,0) v3(0,1,0)  → u=X, v=Y → (uS,vS)(uE,vS)(uE,vE)(uS,vE)
  //   EAST    (+X):  v0(1,0,0) v1(1,0,1) v2(1,1,1) v3(1,1,0)  → u=Z, v=Y → (uS,vS)(uE,vS)(uE,vE)(uS,vE)
  //   WEST    (-X):  v0(0,0,1) v1(0,0,0) v2(0,1,0) v3(0,1,1)  → u=Z, v=Y → (uE,vS)(uS,vS)(uS,vE)(uE,vE)

  // Corner mapping tables for each face in (u, v) order: [v0_u, v0_v, v1_u, v1_v, v2_u, v2_v, v3_u, v3_v]
  // Where 0=start, 1=end
  let corners: number[];
  switch (face) {
    case 0: // TOP
      corners = [uStart, vStart, uEnd, vStart, uEnd, vEnd, uStart, vEnd]; break;
    case 1: // BOTTOM
      corners = [uStart, vEnd, uEnd, vEnd, uEnd, vStart, uStart, vStart]; break;
    case 2: // NORTH
      corners = [uEnd, vStart, uStart, vStart, uStart, vEnd, uEnd, vEnd]; break;
    case 3: // SOUTH
      corners = [uStart, vStart, uEnd, vStart, uEnd, vEnd, uStart, vEnd]; break;
    case 4: // EAST
      corners = [uStart, vStart, uEnd, vStart, uEnd, vEnd, uStart, vEnd]; break;
    case 5: // WEST
      corners = [uEnd, vStart, uStart, vStart, uStart, vEnd, uEnd, vEnd]; break;
    default:
      corners = [uStart, vStart, uEnd, vStart, uEnd, vEnd, uStart, vEnd]; break;
  }

  // Tiled UV corners match the (u, v) local block extent within the quad.
  // For greedy merged quads, UV ranges [0..W] × [0..H] so shader can fract() to tile.
  //
  // UV mapping per face uses same corner order as the vertex positions.
  // UV_U represents extent along u-axis, UV_V along v-axis:
  let uvCorners: number[];
  switch (face) {
    case 0: // TOP: v0(0,0) v1(w,0) v2(w,h) v3(0,h)
      uvCorners = [0, 0, w, 0, w, h, 0, h]; break;
    case 1: // BOTTOM: v0(0,h) v1(w,h) v2(w,0) v3(0,0)
      uvCorners = [0, h, w, h, w, 0, 0, 0]; break;
    case 2: // NORTH: v0(w,0) v1(0,0) v2(0,h) v3(w,h)
      uvCorners = [w, 0, 0, 0, 0, h, w, h]; break;
    case 3: // SOUTH: v0(0,0) v1(w,0) v2(w,h) v3(0,h)
      uvCorners = [0, 0, w, 0, w, h, 0, h]; break;
    case 4: // EAST: v0(0,0) v1(w,0) v2(w,h) v3(0,h)
      uvCorners = [0, 0, w, 0, w, h, 0, h]; break;
    case 5: // WEST: v0(w,0) v1(0,0) v2(0,h) v3(w,h)
      uvCorners = [w, 0, 0, 0, 0, h, w, h]; break;
    default:
      uvCorners = [0, 0, w, 0, w, h, 0, h]; break;
  }

  solidVerts.ensure(28);
  solidIdx.ensure(6);

  const worldOffX = chunk.worldOffsetX;
  const worldOffZ = chunk.worldOffsetZ;

  for (let vi = 0; vi < 4; vi++) {
    const cu = corners[vi * 2];
    const cv = corners[vi * 2 + 1];

    // Map (slicePos, cu, cv) to world (x, y, z)
    const pos = [0, 0, 0];
    pos[sliceAxis] = slicePos;
    pos[uAxis] = cu;
    pos[vAxis] = cv;

    solidVerts.pushF32(worldOffX + pos[0]);
    solidVerts.pushF32(pos[1]);
    solidVerts.pushF32(worldOffZ + pos[2]);
    solidVerts.pushU32(face | (blockType << 8));

    // Tiled UV
    solidVerts.pushF32(uvCorners[vi * 2]);
    solidVerts.pushF32(uvCorners[vi * 2 + 1]);

    // AO: all 4 AO values are uniform for the whole greedy quad
    const aoVals = [ao0, ao1, ao2, ao3];
    solidVerts.pushF32(aoVals[vi]);
  }

  // AO-aware triangle flip
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
}


function isSolidAt(chunk: Chunk, neighbors: ChunkNeighbors | null, x: number, y: number, z: number): boolean {
  if (y < 0) return true;
  if (y >= CHUNK_HEIGHT) return false;
  if (x < 0) return neighbors?.west?.isSolidAt(CHUNK_WIDTH + x, y, z) ?? false;
  if (x >= CHUNK_WIDTH) return neighbors?.east?.isSolidAt(x - CHUNK_WIDTH, y, z) ?? false;
  if (z < 0) return neighbors?.south?.isSolidAt(x, y, CHUNK_DEPTH + z) ?? false;
  if (z >= CHUNK_DEPTH) return neighbors?.north?.isSolidAt(x, y, z - CHUNK_DEPTH) ?? false;
  return chunk.isSolidAt(x, y, z);
}

// Returns raw AO integer (0-3) for packing into descriptor
function computeVertexAOraw(chunk: Chunk, neighbors: ChunkNeighbors | null, bx: number, by: number, bz: number, face: number, vertexIdx: number): number {
  const offsets = AO_OFFSETS[face][vertexIdx];
  const s1 = isSolidAt(chunk, neighbors, bx + offsets[0], by + offsets[1], bz + offsets[2]) ? 1 : 0;
  const s2 = isSolidAt(chunk, neighbors, bx + offsets[3], by + offsets[4], bz + offsets[5]) ? 1 : 0;
  const c  = isSolidAt(chunk, neighbors, bx + offsets[6], by + offsets[7], bz + offsets[8]) ? 1 : 0;

  if (s1 && s2) return 0;
  return 3 - (s1 + s2 + c);
}

function computeVertexAO(chunk: Chunk, neighbors: ChunkNeighbors | null, bx: number, by: number, bz: number, face: number, vertexIdx: number): number {
  return computeVertexAOraw(chunk, neighbors, bx, by, bz, face, vertexIdx) / 3.0;
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
