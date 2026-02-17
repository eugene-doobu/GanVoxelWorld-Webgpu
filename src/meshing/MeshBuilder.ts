import { CHUNK_WIDTH, CHUNK_HEIGHT, CHUNK_DEPTH, ATLAS_TILES } from '../constants';
import { BlockType } from '../terrain/BlockTypes';
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
}

export function buildChunkMesh(chunk: Chunk, neighbors: ChunkNeighbors | null = null): MeshData {
  // Pre-allocate generous buffers (will be trimmed)
  const maxFaces = CHUNK_WIDTH * CHUNK_HEIGHT * CHUNK_DEPTH * 6;
  // Each face: 4 vertices × 6 floats = 24 floats
  // But we use 24 bytes per vertex = 6 f32 per vertex (pos3 + normalIdx as u32 + uv2)
  // Actually: 3 f32 + 1 u32 + 2 f32 = 6 "slots" per vertex, 4 vertices = 24 per face

  // Use dynamic arrays for simplicity and trim later
  let vertexFloats: number[] = [];
  let indexArray: number[] = [];
  let vertexCount = 0;

  const uvSize = 1.0 / ATLAS_TILES;

  for (let x = 0; x < CHUNK_WIDTH; x++) {
    for (let y = 0; y < CHUNK_HEIGHT; y++) {
      for (let z = 0; z < CHUNK_DEPTH; z++) {
        const blockType = chunk.getBlock(x, y, z);
        if (blockType === BlockType.AIR) continue;

        // Render all non-AIR blocks (matching Unity behavior)

        // Compute atlas UV for this block type
        const tileIndex = blockType as number;
        const tileU = (tileIndex % ATLAS_TILES) * uvSize;
        const tileV = Math.floor(tileIndex / ATLAS_TILES) * uvSize;

        // Check 6 faces
        for (let face = 0; face < 6; face++) {
          if (!shouldRenderFace(chunk, neighbors, x, y, z, face)) continue;

          const fv = FACE_VERTICES[face];
          const baseVertex = vertexCount;

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

            // Normal index (as u32 reinterpreted)
            // We push a float that we'll patch in the final buffer
            vertexFloats.push(face); // will be written as u32

            // UV
            const uv = getVertexUV(v);
            vertexFloats.push(tileU + uv[0] * uvSize, tileV + uv[1] * uvSize);
          }

          // Two triangles: 0,2,1 and 0,3,2 (CCW front face)
          indexArray.push(
            baseVertex + 0, baseVertex + 2, baseVertex + 1,
            baseVertex + 0, baseVertex + 3, baseVertex + 2,
          );
          vertexCount += 4;
        }
      }
    }
  }

  // Convert to typed arrays
  const vertBuf = new ArrayBuffer(vertexCount * 24); // 24 bytes per vertex
  const f32View = new Float32Array(vertBuf);
  const u32View = new Uint32Array(vertBuf);

  for (let i = 0; i < vertexCount; i++) {
    const srcOff = i * 6;
    const dstOff = i * 6; // same stride in f32 units
    f32View[dstOff + 0] = vertexFloats[srcOff + 0]; // posX
    f32View[dstOff + 1] = vertexFloats[srcOff + 1]; // posY
    f32View[dstOff + 2] = vertexFloats[srcOff + 2]; // posZ
    u32View[dstOff + 3] = vertexFloats[srcOff + 3]; // normalIndex as u32
    f32View[dstOff + 4] = vertexFloats[srcOff + 4]; // u
    f32View[dstOff + 5] = vertexFloats[srcOff + 5]; // v
  }

  return {
    vertices: new Float32Array(vertBuf),
    indices: new Uint32Array(indexArray),
    vertexCount,
    indexCount: indexArray.length,
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

  // Y bounds
  if (ny < 0) return false;
  if (ny >= CHUNK_HEIGHT) return true;

  // X bounds - check neighbor chunk
  if (nx < 0) {
    if (neighbors?.west) return !neighbors.west.isSolidAt(CHUNK_WIDTH - 1, ny, nz);
    return true; // conservative: render if no neighbor
  }
  if (nx >= CHUNK_WIDTH) {
    if (neighbors?.east) return !neighbors.east.isSolidAt(0, ny, nz);
    return true;
  }

  // Z bounds - check neighbor chunk
  if (nz < 0) {
    if (neighbors?.south) return !neighbors.south.isSolidAt(nx, ny, CHUNK_DEPTH - 1);
    return true;
  }
  if (nz >= CHUNK_DEPTH) {
    if (neighbors?.north) return !neighbors.north.isSolidAt(nx, ny, 0);
    return true;
  }

  // Within this chunk
  return !chunk.isSolidAt(nx, ny, nz);
}
