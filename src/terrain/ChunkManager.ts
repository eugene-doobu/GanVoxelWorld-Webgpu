import { vec3 } from 'gl-matrix';
import { WebGPUContext } from '../renderer/WebGPUContext';
import { ChunkDrawCall } from '../renderer/DeferredPipeline';
import { Chunk } from './Chunk';
import { TerrainGenerator } from './TerrainGenerator';
import { CaveGenerator } from './CaveGenerator';
import { OreGenerator } from './OreGenerator';
import { TreeGenerator } from './TreeGenerator';
import { VegetationGenerator } from './VegetationGenerator';
import { WaterSimulator } from './WaterSimulator';
import { buildChunkMesh, ChunkNeighbors, MeshData } from '../meshing/MeshBuilder';
import { CHUNK_WIDTH, CHUNK_HEIGHT, CHUNK_DEPTH, MAX_POINT_LIGHTS } from '../constants';
import { Config } from '../config/Config';
import { getBlockData } from './BlockTypes';

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

export interface PointLight {
  position: [number, number, number];
  color: [number, number, number];
  intensity: number;
  radius: number;
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
  private vegGen: VegetationGenerator;
  private waterSim: WaterSimulator;

  renderDistance = Config.data.rendering.general.renderDistance;
  totalChunks = 0;

  // Emissive block cache per chunk
  private emissiveCache = new Map<string, PointLight[]>();
  private lastCameraPos = vec3.create();

  // Frustum planes for culling (pre-allocated)
  private frustumPlanes: Float32Array[] = Array.from({ length: 6 }, () => new Float32Array(4));

  constructor(ctx: WebGPUContext, seed: number) {
    this.ctx = ctx;
    this.terrainGen = new TerrainGenerator(seed);
    this.caveGen = new CaveGenerator(seed);
    this.oreGen = new OreGenerator(seed);
    this.treeGen = new TreeGenerator(seed, this.terrainGen);
    this.vegGen = new VegetationGenerator(seed, this.terrainGen);
    this.waterSim = new WaterSimulator();
  }

  regenerate(seed: number): void {
    // Destroy all chunks
    for (const entry of this.chunks.values()) {
      entry.chunk.destroyGPU();
    }
    this.chunks.clear();
    this.loadQueue = [];
    this.emissiveCache.clear();

    this.terrainGen = new TerrainGenerator(seed);
    this.caveGen = new CaveGenerator(seed);
    this.oreGen = new OreGenerator(seed);
    this.treeGen = new TreeGenerator(seed, this.terrainGen);
    this.vegGen = new VegetationGenerator(seed, this.terrainGen);
    this.waterSim = new WaterSimulator();
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
    const chunksPerFrame = Config.data.rendering.general.chunksPerFrame;
    let processed = 0;
    while (this.loadQueue.length > 0 && processed < chunksPerFrame) {
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
      this.vegGen.generate(entry.chunk);
      this.waterSim.generate(entry.chunk);

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

      // Upload water mesh
      this.uploadWaterMesh(entry.chunk, meshData);

      // Upload vegetation mesh
      this.uploadVegetationMesh(entry.chunk, meshData);

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
      this.emissiveCache.delete(key);
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

    this.uploadWaterMesh(entry.chunk, meshData);
    this.uploadVegetationMesh(entry.chunk, meshData);
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

  private uploadWaterMesh(chunk: Chunk, meshData: MeshData): void {
    // Destroy old water buffers
    chunk.waterVertexBuffer?.destroy();
    chunk.waterIndexBuffer?.destroy();
    chunk.waterVertexBuffer = null;
    chunk.waterIndexBuffer = null;
    chunk.waterIndexCount = 0;

    if (meshData.waterIndexCount > 0) {
      chunk.waterVertexBuffer = this.ctx.device.createBuffer({
        size: meshData.waterVertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      });
      this.ctx.device.queue.writeBuffer(chunk.waterVertexBuffer, 0, meshData.waterVertices.buffer as ArrayBuffer);

      chunk.waterIndexBuffer = this.ctx.device.createBuffer({
        size: meshData.waterIndices.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      });
      this.ctx.device.queue.writeBuffer(chunk.waterIndexBuffer, 0, meshData.waterIndices.buffer as ArrayBuffer);
      chunk.waterIndexCount = meshData.waterIndexCount;
    }
  }

  private uploadVegetationMesh(chunk: Chunk, meshData: MeshData): void {
    chunk.vegVertexBuffer?.destroy();
    chunk.vegIndexBuffer?.destroy();
    chunk.vegVertexBuffer = null;
    chunk.vegIndexBuffer = null;
    chunk.vegIndexCount = 0;

    if (meshData.vegIndexCount > 0) {
      chunk.vegVertexBuffer = this.ctx.device.createBuffer({
        size: meshData.vegVertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      });
      this.ctx.device.queue.writeBuffer(chunk.vegVertexBuffer, 0, meshData.vegVertices.buffer as ArrayBuffer);

      chunk.vegIndexBuffer = this.ctx.device.createBuffer({
        size: meshData.vegIndices.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      });
      this.ctx.device.queue.writeBuffer(chunk.vegIndexBuffer, 0, meshData.vegIndices.buffer as ArrayBuffer);
      chunk.vegIndexCount = meshData.vegIndexCount;
    }
  }

  getVegetationDrawCalls(): ChunkDrawCall[] {
    const calls: ChunkDrawCall[] = [];
    for (const entry of this.chunks.values()) {
      if (entry.state !== ChunkState.READY) continue;
      const c = entry.chunk;
      if (!c.vegVertexBuffer || !c.vegIndexBuffer || c.vegIndexCount === 0) continue;
      if (!this.isChunkInFrustum(c)) continue;
      calls.push({
        vertexBuffer: c.vegVertexBuffer,
        indexBuffer: c.vegIndexBuffer,
        indexCount: c.vegIndexCount,
      });
    }
    return calls;
  }

  getWaterDrawCalls(): ChunkDrawCall[] {
    const calls: ChunkDrawCall[] = [];
    for (const entry of this.chunks.values()) {
      if (entry.state !== ChunkState.READY) continue;
      const c = entry.chunk;
      if (!c.waterVertexBuffer || !c.waterIndexBuffer || c.waterIndexCount === 0) continue;
      if (!this.isChunkInFrustum(c)) continue;
      calls.push({
        vertexBuffer: c.waterVertexBuffer,
        indexBuffer: c.waterIndexBuffer,
        indexCount: c.waterIndexCount,
      });
    }
    return calls;
  }

  private collectEmissiveBlocks(chunk: Chunk): PointLight[] {
    const lights: PointLight[] = [];
    const ox = chunk.worldOffsetX;
    const oz = chunk.worldOffsetZ;

    for (let x = 0; x < CHUNK_WIDTH; x++) {
      for (let z = 0; z < CHUNK_DEPTH; z++) {
        for (let y = 0; y < CHUNK_HEIGHT; y++) {
          const blockType = chunk.getBlock(x, y, z);
          if (blockType === 0) continue;
          const data = getBlockData(blockType);
          if (data.emissive <= 0) continue;

          const c = data.color;
          // Determine radius based on emissive intensity
          let radius: number;
          if (data.emissive >= 0.8) {
            radius = 8;
          } else if (data.emissive >= 0.1) {
            radius = 3;
          } else {
            radius = 2;
          }

          lights.push({
            position: [ox + x + 0.5, y + 0.5, oz + z + 0.5],
            color: [c[0] / 255, c[1] / 255, c[2] / 255],
            intensity: data.emissive * 2.0,
            radius,
          });
        }
      }
    }
    return lights;
  }

  getPointLights(cameraPos: vec3): PointLight[] {
    // Collect all emissive lights from loaded chunks
    const allLights: PointLight[] = [];
    for (const [key, entry] of this.chunks) {
      if (entry.state !== ChunkState.READY) continue;
      let cached = this.emissiveCache.get(key);
      if (!cached) {
        cached = this.collectEmissiveBlocks(entry.chunk);
        this.emissiveCache.set(key, cached);
      }
      for (const light of cached) {
        allLights.push(light);
      }
    }

    // Sort by distance to camera and take closest MAX_POINT_LIGHTS
    const cx = cameraPos[0] as number;
    const cy = cameraPos[1] as number;
    const cz = cameraPos[2] as number;

    if (allLights.length > MAX_POINT_LIGHTS) {
      allLights.sort((a, b) => {
        const da = (a.position[0] - cx) ** 2 + (a.position[1] - cy) ** 2 + (a.position[2] - cz) ** 2;
        const db = (b.position[0] - cx) ** 2 + (b.position[1] - cy) ** 2 + (b.position[2] - cz) ** 2;
        return da - db;
      });
      allLights.length = MAX_POINT_LIGHTS;
    }

    return allLights;
  }

  private extractFrustumPlanes(m: Float32Array): void {
    // Extract 6 frustum planes from view-projection matrix (reuse pre-allocated arrays)
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
    const maxY = CHUNK_HEIGHT;
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
