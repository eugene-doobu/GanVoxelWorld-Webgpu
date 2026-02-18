import { vec3 } from 'gl-matrix';
import { WebGPUContext } from '../renderer/WebGPUContext';
import { ChunkDrawCall } from '../renderer/DeferredPipeline';
import { Chunk } from './Chunk';
import { TerrainGenerator } from './TerrainGenerator';
import { CaveGenerator } from './CaveGenerator';
import { OreGenerator } from './OreGenerator';
import { TreeGenerator } from './TreeGenerator';
import { buildChunkMesh, ChunkNeighbors } from '../meshing/MeshBuilder';
import { CHUNK_WIDTH, CHUNK_DEPTH, CHUNKS_PER_FRAME, DEFAULT_RENDER_DISTANCE } from '../constants';

const enum ChunkState {
  QUEUED,
  GENERATING,
  MESHING,
  READY,
}

interface ChunkEntry {
  chunk: Chunk;
  state: ChunkState;
}

function chunkKey(cx: number, cz: number): string {
  return `${cx},${cz}`;
}

export class ChunkManager {
  private ctx: WebGPUContext;
  private chunks = new Map<string, ChunkEntry>();
  private loadQueue: { cx: number; cz: number }[] = [];

  private terrainGen: TerrainGenerator;
  private caveGen: CaveGenerator;
  private oreGen: OreGenerator;
  private treeGen: TreeGenerator;

  renderDistance = DEFAULT_RENDER_DISTANCE;
  totalChunks = 0;

  // Frustum planes for culling
  private frustumPlanes: Float32Array[] = [];

  constructor(ctx: WebGPUContext, seed: number) {
    this.ctx = ctx;
    this.terrainGen = new TerrainGenerator(seed);
    this.caveGen = new CaveGenerator(seed);
    this.oreGen = new OreGenerator(seed);
    this.treeGen = new TreeGenerator(seed, this.terrainGen);
  }

  regenerate(seed: number): void {
    // Destroy all chunks
    for (const entry of this.chunks.values()) {
      entry.chunk.destroyGPU();
    }
    this.chunks.clear();
    this.loadQueue = [];

    this.terrainGen = new TerrainGenerator(seed);
    this.caveGen = new CaveGenerator(seed);
    this.oreGen = new OreGenerator(seed);
    this.treeGen = new TreeGenerator(seed, this.terrainGen);
  }

  update(cameraPos: vec3, viewProj: Float32Array): void {
    const camChunkX = Math.floor((cameraPos[0] as number) / CHUNK_WIDTH);
    const camChunkZ = Math.floor((cameraPos[2] as number) / CHUNK_DEPTH);

    this.extractFrustumPlanes(viewProj);

    // Queue new chunks
    const rd = this.renderDistance;
    for (let dx = -rd; dx <= rd; dx++) {
      for (let dz = -rd; dz <= rd; dz++) {
        if (dx * dx + dz * dz > rd * rd) continue;
        const cx = camChunkX + dx;
        const cz = camChunkZ + dz;
        const key = chunkKey(cx, cz);
        if (!this.chunks.has(key)) {
          this.chunks.set(key, { chunk: new Chunk(cx, cz), state: ChunkState.QUEUED });
          this.loadQueue.push({ cx, cz });
        }
      }
    }

    // Sort queue by distance to camera
    this.loadQueue.sort((a, b) => {
      const da = (a.cx - camChunkX) ** 2 + (a.cz - camChunkZ) ** 2;
      const db = (b.cx - camChunkX) ** 2 + (b.cz - camChunkZ) ** 2;
      return da - db;
    });

    // Process N chunks per frame
    let processed = 0;
    while (this.loadQueue.length > 0 && processed < CHUNKS_PER_FRAME) {
      const { cx, cz } = this.loadQueue.shift()!;
      const key = chunkKey(cx, cz);
      const entry = this.chunks.get(key);
      if (!entry || entry.state !== ChunkState.QUEUED) continue;

      // Generate terrain
      entry.state = ChunkState.GENERATING;
      this.terrainGen.generate(entry.chunk);
      this.caveGen.generate(entry.chunk);
      this.oreGen.generate(entry.chunk);
      this.treeGen.generate(entry.chunk);

      // Build mesh
      entry.state = ChunkState.MESHING;
      const neighbors = this.getNeighbors(cx, cz);
      const meshData = buildChunkMesh(entry.chunk, neighbors);

      if (meshData.indexCount > 0) {
        entry.chunk.vertexBuffer = this.ctx.device.createBuffer({
          size: meshData.vertices.byteLength,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        this.ctx.device.queue.writeBuffer(entry.chunk.vertexBuffer, 0, meshData.vertices.buffer as ArrayBuffer);

        entry.chunk.indexBuffer = this.ctx.device.createBuffer({
          size: meshData.indices.byteLength,
          usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });
        this.ctx.device.queue.writeBuffer(entry.chunk.indexBuffer, 0, meshData.indices.buffer as ArrayBuffer);
        entry.chunk.indexCount = meshData.indexCount;
      }

      entry.state = ChunkState.READY;
      processed++;

      // Rebuild neighbor meshes if they exist (boundary fix)
      this.rebuildNeighborIfReady(cx - 1, cz);
      this.rebuildNeighborIfReady(cx + 1, cz);
      this.rebuildNeighborIfReady(cx, cz - 1);
      this.rebuildNeighborIfReady(cx, cz + 1);
    }

    // Unload distant chunks
    const unloadDist = rd + 2;
    const toRemove: string[] = [];
    for (const [key, entry] of this.chunks) {
      const dx = entry.chunk.chunkX - camChunkX;
      const dz = entry.chunk.chunkZ - camChunkZ;
      if (dx * dx + dz * dz > unloadDist * unloadDist) {
        entry.chunk.destroyGPU();
        toRemove.push(key);
      }
    }
    for (const key of toRemove) {
      this.chunks.delete(key);
    }

    this.totalChunks = this.chunks.size;
  }

  private rebuildNeighborIfReady(cx: number, cz: number): void {
    const key = chunkKey(cx, cz);
    const entry = this.chunks.get(key);
    if (!entry || entry.state !== ChunkState.READY) return;

    const neighbors = this.getNeighbors(cx, cz);
    const meshData = buildChunkMesh(entry.chunk, neighbors);

    entry.chunk.destroyGPU();
    if (meshData.indexCount > 0) {
      entry.chunk.vertexBuffer = this.ctx.device.createBuffer({
        size: meshData.vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      });
      this.ctx.device.queue.writeBuffer(entry.chunk.vertexBuffer, 0, meshData.vertices.buffer as ArrayBuffer);

      entry.chunk.indexBuffer = this.ctx.device.createBuffer({
        size: meshData.indices.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      });
      this.ctx.device.queue.writeBuffer(entry.chunk.indexBuffer, 0, meshData.indices.buffer as ArrayBuffer);
      entry.chunk.indexCount = meshData.indexCount;
    }
  }

  private getNeighbors(cx: number, cz: number): ChunkNeighbors {
    return {
      north: this.getChunk(cx, cz + 1),
      south: this.getChunk(cx, cz - 1),
      east: this.getChunk(cx + 1, cz),
      west: this.getChunk(cx - 1, cz),
    };
  }

  private getChunk(cx: number, cz: number): Chunk | null {
    const entry = this.chunks.get(chunkKey(cx, cz));
    if (entry && entry.state >= ChunkState.MESHING) return entry.chunk;
    return null;
  }

  getDrawCalls(): ChunkDrawCall[] {
    const calls: ChunkDrawCall[] = [];
    for (const entry of this.chunks.values()) {
      if (entry.state !== ChunkState.READY) continue;
      const c = entry.chunk;
      if (!c.vertexBuffer || !c.indexBuffer || c.indexCount === 0) continue;

      // Frustum cull using chunk AABB
      if (!this.isChunkInFrustum(c)) continue;

      calls.push({
        vertexBuffer: c.vertexBuffer,
        indexBuffer: c.indexBuffer,
        indexCount: c.indexCount,
      });
    }
    return calls;
  }

  private extractFrustumPlanes(m: Float32Array): void {
    // Extract 6 frustum planes from view-projection matrix
    this.frustumPlanes = [];
    for (let i = 0; i < 6; i++) {
      this.frustumPlanes.push(new Float32Array(4));
    }

    // Left
    this.frustumPlanes[0][0] = m[3] + m[0];
    this.frustumPlanes[0][1] = m[7] + m[4];
    this.frustumPlanes[0][2] = m[11] + m[8];
    this.frustumPlanes[0][3] = m[15] + m[12];
    // Right
    this.frustumPlanes[1][0] = m[3] - m[0];
    this.frustumPlanes[1][1] = m[7] - m[4];
    this.frustumPlanes[1][2] = m[11] - m[8];
    this.frustumPlanes[1][3] = m[15] - m[12];
    // Bottom
    this.frustumPlanes[2][0] = m[3] + m[1];
    this.frustumPlanes[2][1] = m[7] + m[5];
    this.frustumPlanes[2][2] = m[11] + m[9];
    this.frustumPlanes[2][3] = m[15] + m[13];
    // Top
    this.frustumPlanes[3][0] = m[3] - m[1];
    this.frustumPlanes[3][1] = m[7] - m[5];
    this.frustumPlanes[3][2] = m[11] - m[9];
    this.frustumPlanes[3][3] = m[15] - m[13];
    // Near
    this.frustumPlanes[4][0] = m[3] + m[2];
    this.frustumPlanes[4][1] = m[7] + m[6];
    this.frustumPlanes[4][2] = m[11] + m[10];
    this.frustumPlanes[4][3] = m[15] + m[14];
    // Far
    this.frustumPlanes[5][0] = m[3] - m[2];
    this.frustumPlanes[5][1] = m[7] - m[6];
    this.frustumPlanes[5][2] = m[11] - m[10];
    this.frustumPlanes[5][3] = m[15] - m[14];

    // Normalize
    for (const p of this.frustumPlanes) {
      const len = Math.sqrt(p[0] * p[0] + p[1] * p[1] + p[2] * p[2]);
      if (len > 0) {
        p[0] /= len; p[1] /= len; p[2] /= len; p[3] /= len;
      }
    }
  }

  private isChunkInFrustum(chunk: Chunk): boolean {
    const minX = chunk.worldOffsetX;
    const minY = 0;
    const minZ = chunk.worldOffsetZ;
    const maxX = minX + CHUNK_WIDTH;
    const maxY = 128;
    const maxZ = minZ + CHUNK_DEPTH;

    for (const p of this.frustumPlanes) {
      const px = p[0] > 0 ? maxX : minX;
      const py = p[1] > 0 ? maxY : minY;
      const pz = p[2] > 0 ? maxZ : minZ;
      if (p[0] * px + p[1] * py + p[2] * pz + p[3] < 0) {
        return false;
      }
    }
    return true;
  }
}
