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
  // Use dynamic arrays for simplicity and trim later
  let vertexFloats: number[] = [];
  let indexArray: number[] = [];
  let vertexCount = 0;

  // Water mesh (separate): pos3 + uv2 = 5 floats per vertex = 20 bytes
  let waterVertexFloats: number[] = [];
  let waterIndexArray: number[] = [];
  let waterVertexCount = 0;

  // Vegetation mesh (cross-mesh): same 28-byte vertex format as solid
  let vegVertexFloats: number[] = [];
  let vegIndexArray: number[] = [];
  let vegVertexCount = 0;

  const uvSize = 1.0 / ATLAS_TILES;

  for (let x = 0; x < CHUNK_WIDTH; x++) {
    for (let y = 0; y < CHUNK_HEIGHT; y++) {
      for (let z = 0; z < CHUNK_DEPTH; z++) {
        const blockType = chunk.getBlock(x, y, z);
        if (blockType === BlockType.AIR) continue;

        // Water blocks go to separate mesh (TOP face only = water surface)
        if (isBlockWater(blockType)) {
          for (let face = 0; face < 6; face++) {
            // Only render TOP face as water surface (sides/bottom cause double-layer underwater)
            if (face !== 0) continue;
            if (!shouldRenderWaterFace(chunk, neighbors, x, y, z, face)) continue;

            const fv = FACE_VERTICES[face];
            const baseVertex = waterVertexCount;

            for (let v = 0; v < 4; v++) {
              const vx = x + fv[v * 3 + 0];
              const vy = y + fv[v * 3 + 1];
              const vz = z + fv[v * 3 + 2];

              waterVertexFloats.push(
                chunk.worldOffsetX + vx,
                vy,
                chunk.worldOffsetZ + vz,
              );

              const uv = getVertexUV(v);
              waterVertexFloats.push(uv[0], uv[1]);
            }

            waterIndexArray.push(
              baseVertex + 0, baseVertex + 2, baseVertex + 1,
              baseVertex + 0, baseVertex + 3, baseVertex + 2,
            );
            waterVertexCount += 4;
          }
          continue;
        }

        // Cross-mesh vegetation blocks (X-shaped two diagonal quads)
        if (isBlockCrossMesh(blockType)) {
          const tileIndex = blockType as number;
          const tileU = (tileIndex % ATLAS_TILES) * uvSize;
          const tileV = Math.floor(tileIndex / ATLAS_TILES) * uvSize;

          const wx = chunk.worldOffsetX + x;
          const wz = chunk.worldOffsetZ + z;
          const faceIdxPacked = 0 | (blockType << 8); // faceIdx=0 (UP) for natural lighting

          // Y offsets: bottom slightly above integer, top slightly below next integer
          // so fract(worldPos.y) gives ~0 at bottom and ~1 at top for wind animation
          const yBot = y + 0.01;
          const yTop = y + 0.99;

          // Quad 1: diagonal (0,0)-(1,1) in XZ
          const baseV1 = vegVertexCount;
          // v0: bottom-left
          vegVertexFloats.push(wx, yBot, wz);
          vegVertexFloats.push(faceIdxPacked);
          vegVertexFloats.push(tileU, tileV + uvSize);
          vegVertexFloats.push(1.0);
          // v1: bottom-right
          vegVertexFloats.push(wx + 1, yBot, wz + 1);
          vegVertexFloats.push(faceIdxPacked);
          vegVertexFloats.push(tileU + uvSize, tileV + uvSize);
          vegVertexFloats.push(1.0);
          // v2: top-right
          vegVertexFloats.push(wx + 1, yTop, wz + 1);
          vegVertexFloats.push(faceIdxPacked);
          vegVertexFloats.push(tileU + uvSize, tileV);
          vegVertexFloats.push(1.0);
          // v3: top-left
          vegVertexFloats.push(wx, yTop, wz);
          vegVertexFloats.push(faceIdxPacked);
          vegVertexFloats.push(tileU, tileV);
          vegVertexFloats.push(1.0);
          // Single winding — cullMode:'none' renders both sides
          vegIndexArray.push(baseV1 + 0, baseV1 + 2, baseV1 + 1);
          vegIndexArray.push(baseV1 + 0, baseV1 + 3, baseV1 + 2);
          vegVertexCount += 4;

          // Quad 2: other diagonal (1,0)-(0,1) in XZ
          const baseV2 = vegVertexCount;
          vegVertexFloats.push(wx + 1, yBot, wz);
          vegVertexFloats.push(faceIdxPacked);
          vegVertexFloats.push(tileU, tileV + uvSize);
          vegVertexFloats.push(1.0);
          vegVertexFloats.push(wx, yBot, wz + 1);
          vegVertexFloats.push(faceIdxPacked);
          vegVertexFloats.push(tileU + uvSize, tileV + uvSize);
          vegVertexFloats.push(1.0);
          vegVertexFloats.push(wx, yTop, wz + 1);
          vegVertexFloats.push(faceIdxPacked);
          vegVertexFloats.push(tileU + uvSize, tileV);
          vegVertexFloats.push(1.0);
          vegVertexFloats.push(wx + 1, yTop, wz);
          vegVertexFloats.push(faceIdxPacked);
          vegVertexFloats.push(tileU, tileV);
          vegVertexFloats.push(1.0);
          vegIndexArray.push(baseV2 + 0, baseV2 + 2, baseV2 + 1);
          vegIndexArray.push(baseV2 + 0, baseV2 + 3, baseV2 + 2);
          vegVertexCount += 4;

          continue;
        }

        // Render all non-AIR, non-water solid blocks

        // Compute atlas UV for this block type
        const tileIndex = blockType as number;
        const tileU = (tileIndex % ATLAS_TILES) * uvSize;
        const tileV = Math.floor(tileIndex / ATLAS_TILES) * uvSize;

        // Check 6 faces
        for (let face = 0; face < 6; face++) {
          if (!shouldRenderFace(chunk, neighbors, x, y, z, face)) continue;

          const fv = FACE_VERTICES[face];
          const baseVertex = vertexCount;

          const ao: number[] = [];
          for (let v = 0; v < 4; v++) {
            const vx = x + fv[v * 3 + 0];
            const vy = y + fv[v * 3 + 1];
            const vz = z + fv[v * 3 + 2];

            // World position (offset by chunk world position)
            vertexFloats.push(
              chunk.worldOffsetX + vx,
              vy,
              chunk.worldOffsetZ + vz,
            );

            // Normal index (as u32 reinterpreted): low 8 bits = face, upper bits = blockType
            vertexFloats.push(face | (blockType << 8)); // will be written as u32

            // UV
            const uv = getVertexUV(v);
            vertexFloats.push(tileU + uv[0] * uvSize, tileV + uv[1] * uvSize);

            // Vertex AO
            const aoVal = computeVertexAO(chunk, neighbors, x, y, z, face, v);
            ao.push(aoVal);
            vertexFloats.push(aoVal);
          }

          // AO-aware triangle flip: choose diagonal with more balanced AO
          if (ao[0] + ao[2] > ao[1] + ao[3]) {
            indexArray.push(
              baseVertex + 0, baseVertex + 2, baseVertex + 1,
              baseVertex + 0, baseVertex + 3, baseVertex + 2,
            );
          } else {
            indexArray.push(
              baseVertex + 0, baseVertex + 3, baseVertex + 1,
              baseVertex + 1, baseVertex + 3, baseVertex + 2,
            );
          }
          vertexCount += 4;
        }
      }
    }
  }

  // Convert solid mesh to typed arrays
  const vertBuf = new ArrayBuffer(vertexCount * 28); // 28 bytes per vertex
  const f32View = new Float32Array(vertBuf);
  const u32View = new Uint32Array(vertBuf);

  for (let i = 0; i < vertexCount; i++) {
    const srcOff = i * 7;
    const dstOff = i * 7;
    f32View[dstOff + 0] = vertexFloats[srcOff + 0]; // posX
    f32View[dstOff + 1] = vertexFloats[srcOff + 1]; // posY
    f32View[dstOff + 2] = vertexFloats[srcOff + 2]; // posZ
    u32View[dstOff + 3] = vertexFloats[srcOff + 3]; // normalIndex as u32
    f32View[dstOff + 4] = vertexFloats[srcOff + 4]; // u
    f32View[dstOff + 5] = vertexFloats[srcOff + 5]; // v
    f32View[dstOff + 6] = vertexFloats[srcOff + 6]; // ao
  }

  // Convert water mesh to typed arrays (pos3 + uv2 = 5 floats = 20 bytes)
  const waterVerts = new Float32Array(waterVertexFloats);
  const waterInds = new Uint32Array(waterIndexArray);

  // Convert vegetation mesh to typed arrays (same 28-byte format as solid)
  const vegBuf = new ArrayBuffer(vegVertexCount * 28);
  const vegF32 = new Float32Array(vegBuf);
  const vegU32 = new Uint32Array(vegBuf);
  for (let i = 0; i < vegVertexCount; i++) {
    const srcOff = i * 7;
    const dstOff = i * 7;
    vegF32[dstOff + 0] = vegVertexFloats[srcOff + 0];
    vegF32[dstOff + 1] = vegVertexFloats[srcOff + 1];
    vegF32[dstOff + 2] = vegVertexFloats[srcOff + 2];
    vegU32[dstOff + 3] = vegVertexFloats[srcOff + 3];
    vegF32[dstOff + 4] = vegVertexFloats[srcOff + 4];
    vegF32[dstOff + 5] = vegVertexFloats[srcOff + 5];
    vegF32[dstOff + 6] = vegVertexFloats[srcOff + 6];
  }

  return {
    vertices: new Float32Array(vertBuf),
    indices: new Uint32Array(indexArray),
    vertexCount,
    indexCount: indexArray.length,
    waterVertices: waterVerts,
    waterIndices: waterInds,
    waterVertexCount,
    waterIndexCount: waterIndexArray.length,
    vegVertices: new Float32Array(vegBuf),
    vegIndices: new Uint32Array(vegIndexArray),
    vegVertexCount,
    vegIndexCount: vegIndexArray.length,
  };
}

function getVertexUV(vertexIndex: number): [number, number] {
  // UV corners: 0=(0,0), 1=(1,0), 2=(1,1), 3=(0,1)
  switch (vertexIndex) {
    case 0: return [0, 0];
    case 1: return [1, 0];
    case 2: return [1, 1];
    case 3: return [0, 1];
    default: return [0, 0];
  }
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

function shouldRenderFace(chunk: Chunk, neighbors: ChunkNeighbors | null, x: number, y: number, z: number, face: number): boolean {
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
  // Render face if neighbor is not solid, or if neighbor is a cutout block (leaves)
  return !isBlockSolid(neighborBlock) || isBlockCutout(neighborBlock);
}
