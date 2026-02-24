import { vec3 } from 'gl-matrix';
import { WebGPUContext } from '../renderer/WebGPUContext';
import { ChunkDrawCall } from '../renderer/DeferredPipeline';
import { Chunk } from './Chunk';
import { TerrainGenerator } from './TerrainGenerator';
import { CaveGenerator } from './CaveGenerator';
import { OreGenerator } from './OreGenerator';
import { TreeGenerator } from './TreeGenerator';
import { VegetationGenerator } from './VegetationGenerator';
import { VillageGenerator } from './VillageGenerator';
import { WaterSimulator } from './WaterSimulator';
import { buildChunkMesh, ChunkNeighbors, MeshData } from '../meshing/MeshBuilder';
import { downsample, buildLODMesh, LODNeighborBlocks } from '../meshing/LODGenerator';
import { CHUNK_WIDTH, CHUNK_HEIGHT, CHUNK_DEPTH, MAX_POINT_LIGHTS } from '../constants';
import { Config } from '../config/Config';
import { getBlockData, isBlockTorch, TorchFacing } from './BlockTypes';
import { IndirectRenderer } from '../renderer/IndirectRenderer';

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

interface LODChunkEntry {
  chunk: Chunk;
  lodBlocks: Uint8Array;
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
  private villageGen: VillageGenerator;
  private vegGen: VegetationGenerator;
  private waterSim: WaterSimulator;

  renderDistance = Config.data.rendering.general.renderDistance;
  totalChunks = 0;
  totalLODChunks = 0;

  // Deferred neighbor rebuild queue (processed max 2 per frame)
  private pendingNeighborRebuilds = new Set<string>();

  // Emissive block cache per chunk
  private emissiveCache = new Map<string, PointLight[]>();
  private lastCameraPos = vec3.create();

  // Frustum planes for culling (pre-allocated)
  private frustumPlanes: Float32Array[] = Array.from({ length: 6 }, () => new Float32Array(4));

  // Indirect renderer for GPU-driven rendering
  private indirectRenderer: IndirectRenderer;
  // Separate IndirectRenderer for vegetation (different pipeline)
  private vegIndirectRenderer: IndirectRenderer;

  // LOD system
  private lodChunks = new Map<string, LODChunkEntry>();
  private lodLoadQueue: { cx: number; cz: number }[] = [];
  private lodPendingNeighborRebuilds = new Set<string>();
  private lodIndirectRenderer: IndirectRenderer;

  // Time budget deadline shared between LOD 0 and LOD processing
  private frameDeadline = 0;

  constructor(ctx: WebGPUContext, seed: number) {
    this.ctx = ctx;
    this.terrainGen = new TerrainGenerator(seed);
    this.caveGen = new CaveGenerator(seed);
    this.oreGen = new OreGenerator(seed);
    this.treeGen = new TreeGenerator(seed, this.terrainGen);
    this.villageGen = new VillageGenerator(seed, this.terrainGen);
    this.vegGen = new VegetationGenerator(seed, this.terrainGen);
    this.waterSim = new WaterSimulator();
    this.indirectRenderer = new IndirectRenderer(ctx.device);
    this.vegIndirectRenderer = new IndirectRenderer(ctx.device);
    this.lodIndirectRenderer = new IndirectRenderer(ctx.device, 32 * 1024 * 1024, 16 * 1024 * 1024, 2048);
  }

  /** Shader compilation checks from indirect renderers */
  get shaderChecks(): Promise<void>[] {
    return [...this.indirectRenderer.shaderChecks, ...this.vegIndirectRenderer.shaderChecks, ...this.lodIndirectRenderer.shaderChecks];
  }

  /** Access IndirectRenderer for rendering */
  get solidIndirect(): IndirectRenderer { return this.indirectRenderer; }
  get vegetationIndirect(): IndirectRenderer { return this.vegIndirectRenderer; }
  get lodIndirect(): IndirectRenderer { return this.lodIndirectRenderer; }
  getFrustumPlanes(): Float32Array[] { return this.frustumPlanes; }

  regenerate(seed: number): void {
    // Free all mega buffer allocations
    for (const entry of this.chunks.values()) {
      const c = entry.chunk;
      if (c.solidAlloc) {
        this.indirectRenderer.freeChunk(c.solidAlloc);
        c.solidAlloc = null;
      }
      if (c.vegMegaAlloc) {
        this.vegIndirectRenderer.freeChunk(c.vegMegaAlloc);
        c.vegMegaAlloc = null;
      }
      c.destroyGPU();
    }
    this.chunks.clear();
    this.loadQueue = [];
    this.pendingNeighborRebuilds.clear();
    this.emissiveCache.clear();

    // Free LOD chunks
    for (const lodEntry of this.lodChunks.values()) {
      if (lodEntry.chunk.lodAlloc) {
        this.lodIndirectRenderer.freeChunk(lodEntry.chunk.lodAlloc);
        lodEntry.chunk.lodAlloc = null;
      }
      lodEntry.chunk.destroyGPU();
    }
    this.lodChunks.clear();
    this.lodLoadQueue = [];
    this.lodPendingNeighborRebuilds.clear();

    this.terrainGen = new TerrainGenerator(seed);
    this.caveGen = new CaveGenerator(seed);
    this.oreGen = new OreGenerator(seed);
    this.treeGen = new TreeGenerator(seed, this.terrainGen);
    this.villageGen = new VillageGenerator(seed, this.terrainGen);
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

    // Sort queue: frustum-visible chunks first, then by distance
    this.loadQueue.sort((a, b) => {
      const inA = this.isChunkCoordsInFrustum(a.cx, a.cz) ? 0 : 1;
      const inB = this.isChunkCoordsInFrustum(b.cx, b.cz) ? 0 : 1;
      if (inA !== inB) return inA - inB;
      const da = (a.cx - camChunkX) ** 2 + (a.cz - camChunkZ) ** 2;
      const db = (b.cx - camChunkX) ** 2 + (b.cz - camChunkZ) ** 2;
      return da - db;
    });

    // Process chunks within time budget (LOD 0 has priority)
    const timeBudgetMs = Config.data.rendering.general.timeBudgetMs;
    const deadline = performance.now() + timeBudgetMs;
    this.frameDeadline = deadline;
    const generatedThisFrame = new Set<string>();
    const neighborsToRebuild = new Set<string>();

    while (this.loadQueue.length > 0 && performance.now() < deadline) {
      const { cx, cz } = this.loadQueue.shift()!;
      const key = chunkKey(cx, cz);
      const entry = this.chunks.get(key);
      if (!entry || entry.state !== ChunkState.QUEUED) continue;

      // Generate terrain (ores before caves so caves expose ores on walls)
      entry.state = ChunkState.GENERATING;
      this.terrainGen.generate(entry.chunk);
      this.oreGen.generate(entry.chunk);
      this.caveGen.generate(entry.chunk);
      this.villageGen.generate(entry.chunk);
      this.treeGen.generate(entry.chunk);
      this.vegGen.generate(entry.chunk);
      this.waterSim.generate(entry.chunk);

      // Compute occupancy bitmask for sub-block skip optimization
      entry.chunk.computeOccupancy();

      // Build mesh
      entry.state = ChunkState.MESHING;
      const neighbors = this.getNeighbors(cx, cz);
      const meshData = buildChunkMesh(entry.chunk, neighbors);

      // Upload solid mesh to mega buffer
      this.uploadSolidMesh(entry.chunk, meshData);

      // Upload water mesh (per-chunk buffer, small mesh)
      this.uploadWaterMesh(entry.chunk, meshData);

      // Upload vegetation mesh to mega buffer
      this.uploadVegetationMesh(entry.chunk, meshData);

      // Compress block data to save RAM (uniform sub-blocks → 1 byte)
      entry.chunk.compress();

      entry.state = ChunkState.READY;
      generatedThisFrame.add(key);

      // Defer neighbor rebuilds (don't rebuild immediately — queue for later frames)
      const nKeys = [
        chunkKey(cx - 1, cz), chunkKey(cx + 1, cz),
        chunkKey(cx, cz - 1), chunkKey(cx, cz + 1),
      ];
      for (const nk of nKeys) {
        if (!generatedThisFrame.has(nk)) {
          this.pendingNeighborRebuilds.add(nk);
        }
      }
    }

    // Process max 2 deferred neighbor rebuilds per frame
    let neighborRebuilds = 0;
    for (const nKey of this.pendingNeighborRebuilds) {
      if (neighborRebuilds >= 2) break;
      const entry = this.chunks.get(nKey);
      if (!entry || entry.state !== ChunkState.READY) {
        this.pendingNeighborRebuilds.delete(nKey);
        continue;
      }
      const [ncx, ncz] = nKey.split(',').map(Number);
      this.rebuildNeighborIfReady(ncx, ncz);
      this.pendingNeighborRebuilds.delete(nKey);
      neighborRebuilds++;
    }

    // Unload distant chunks
    const unloadDist = rd + 2;
    const toRemove: string[] = [];
    for (const [key, entry] of this.chunks) {
      const dx = entry.chunk.chunkX - camChunkX;
      const dz = entry.chunk.chunkZ - camChunkZ;
      if (dx * dx + dz * dz > unloadDist * unloadDist) {
        // Free mega buffer allocations
        if (entry.chunk.solidAlloc) {
          this.indirectRenderer.freeChunk(entry.chunk.solidAlloc);
          entry.chunk.solidAlloc = null;
        }
        if (entry.chunk.vegMegaAlloc) {
          this.vegIndirectRenderer.freeChunk(entry.chunk.vegMegaAlloc);
          entry.chunk.vegMegaAlloc = null;
        }
        entry.chunk.destroyGPU();
        toRemove.push(key);
      }
    }
    for (const key of toRemove) {
      this.chunks.delete(key);
      this.emissiveCache.delete(key);
      this.pendingNeighborRebuilds.delete(key);
    }

    this.totalChunks = this.chunks.size;

    // ---- LOD system ----
    this.updateLOD(camChunkX, camChunkZ);
  }

  private uploadSolidMesh(chunk: Chunk, meshData: MeshData): void {
    // Free previous allocation
    if (chunk.solidAlloc) {
      this.indirectRenderer.freeChunk(chunk.solidAlloc);
      chunk.solidAlloc = null;
    }

    if (meshData.indexCount > 0) {
      const alloc = this.indirectRenderer.uploadChunk(
        meshData.vertices, meshData.indices,
        chunk.worldOffsetX, chunk.worldOffsetZ,
      );
      chunk.solidAlloc = alloc;
    }
  }

  private rebuildNeighborIfReady(cx: number, cz: number): void {
    const key = chunkKey(cx, cz);
    const entry = this.chunks.get(key);
    if (!entry || entry.state !== ChunkState.READY) return;

    const neighbors = this.getNeighbors(cx, cz);
    const meshData = buildChunkMesh(entry.chunk, neighbors);

    // Re-upload solid mesh
    this.uploadSolidMesh(entry.chunk, meshData);

    // Water
    this.uploadWaterMesh(entry.chunk, meshData);

    // Vegetation
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

  // Legacy draw calls API (for shadow pass and water which still use per-chunk draw calls)
  getDrawCalls(): ChunkDrawCall[] {
    // For solid meshes, we'll construct draw calls from the mega buffer
    // Each chunk's data is in the mega buffer, we just need to expose the right view
    const calls: ChunkDrawCall[] = [];
    for (const entry of this.chunks.values()) {
      if (entry.state !== ChunkState.READY) continue;
      const c = entry.chunk;
      if (!c.solidAlloc) continue;
      if (!this.isChunkInFrustum(c)) continue;

      // Legacy compat: expose mega buffer as vertex/index buffer
      calls.push({
        vertexBuffer: this.indirectRenderer.vertexMega.buffer,
        indexBuffer: this.indirectRenderer.indexMega.buffer,
        indexCount: c.solidAlloc.indexCount,
        firstIndex: c.solidAlloc.firstIndex,
        baseVertex: c.solidAlloc.baseVertex,
      });
    }
    return calls;
  }

  private uploadWaterMesh(chunk: Chunk, meshData: MeshData): void {
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
    // Free previous mega alloc
    if (chunk.vegMegaAlloc) {
      this.vegIndirectRenderer.freeChunk(chunk.vegMegaAlloc);
      chunk.vegMegaAlloc = null;
    }

    if (meshData.vegIndexCount > 0) {
      const alloc = this.vegIndirectRenderer.uploadChunk(
        meshData.vegVertices, meshData.vegIndices,
        chunk.worldOffsetX, chunk.worldOffsetZ,
      );
      chunk.vegMegaAlloc = alloc;
    }
  }

  getVegetationDrawCalls(): ChunkDrawCall[] {
    const calls: ChunkDrawCall[] = [];
    for (const entry of this.chunks.values()) {
      if (entry.state !== ChunkState.READY) continue;
      const c = entry.chunk;
      if (!c.vegMegaAlloc) continue;
      if (!this.isChunkInFrustum(c)) continue;
      calls.push({
        vertexBuffer: this.vegIndirectRenderer.vertexMega.buffer,
        indexBuffer: this.vegIndirectRenderer.indexMega.buffer,
        indexCount: c.vegMegaAlloc.indexCount,
        firstIndex: c.vegMegaAlloc.firstIndex,
        baseVertex: c.vegMegaAlloc.baseVertex,
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
          let radius: number;
          if (data.emissive >= 0.8) {
            radius = 16;
          } else if (data.emissive >= 0.1) {
            radius = 6;
          } else {
            radius = 3;
          }

          // Torch: offset light position based on facing direction
          let lx = ox + x + 0.5;
          let ly = y + 0.5;
          let lz = oz + z + 0.5;
          if (isBlockTorch(blockType)) {
            ly = y + 0.75; // flame is near top
            const meta = chunk.getBlockMeta(x, y, z);
            switch (meta) {
              case TorchFacing.NORTH: lz = oz + z + 0.875; break;
              case TorchFacing.SOUTH: lz = oz + z + 0.125; break;
              case TorchFacing.EAST:  lx = ox + x + 0.875; break;
              case TorchFacing.WEST:  lx = ox + x + 0.125; break;
            }
          }

          lights.push({
            position: [lx, ly, lz],
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

  /** Frustum test using chunk grid coordinates (no Chunk object needed) */
  private isChunkCoordsInFrustum(cx: number, cz: number): boolean {
    const minX = cx * CHUNK_WIDTH;
    const minY = 0;
    const minZ = cz * CHUNK_DEPTH;
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

  // ---- LOD System ----

  private updateLOD(camChunkX: number, camChunkZ: number): void {
    const lodConfig = Config.data.rendering.lod;

    // If LOD disabled, clear everything
    if (!lodConfig.enabled) {
      if (this.lodChunks.size > 0) {
        for (const lodEntry of this.lodChunks.values()) {
          if (lodEntry.chunk.lodAlloc) {
            this.lodIndirectRenderer.freeChunk(lodEntry.chunk.lodAlloc);
            lodEntry.chunk.lodAlloc = null;
          }
          lodEntry.chunk.destroyGPU();
        }
        this.lodChunks.clear();
        this.lodLoadQueue = [];
        this.lodPendingNeighborRebuilds.clear();
      }
      this.totalLODChunks = 0;
      return;
    }

    const rd = this.renderDistance;
    const lodRd = lodConfig.renderDistance;
    const totalRd = rd + lodRd;

    // Wait until LOD 0 finishes loading before processing LOD chunks
    if (this.loadQueue.length > 0) {
      this.totalLODChunks = this.lodChunks.size;
      return;
    }

    // Queue new LOD chunks (ring from rd+1 to totalRd)
    for (let dx = -totalRd; dx <= totalRd; dx++) {
      for (let dz = -totalRd; dz <= totalRd; dz++) {
        const dist2 = dx * dx + dz * dz;
        // Skip if inside LOD 0 range (including overlap zone)
        if (dist2 <= rd * rd) continue;
        // Skip if outside LOD ring
        if (dist2 > totalRd * totalRd) continue;

        const cx = camChunkX + dx;
        const cz = camChunkZ + dz;
        const key = chunkKey(cx, cz);

        // Skip if already LOD or full-detail
        if (this.lodChunks.has(key)) continue;
        if (this.chunks.has(key)) continue;

        this.lodChunks.set(key, {
          chunk: new Chunk(cx, cz),
          lodBlocks: new Uint8Array(0),
          state: ChunkState.QUEUED,
        });
        this.lodLoadQueue.push({ cx, cz });
      }
    }

    // Sort LOD queue: frustum-visible first, then by distance
    this.lodLoadQueue.sort((a, b) => {
      const inA = this.isChunkCoordsInFrustum(a.cx, a.cz) ? 0 : 1;
      const inB = this.isChunkCoordsInFrustum(b.cx, b.cz) ? 0 : 1;
      if (inA !== inB) return inA - inB;
      const da = (a.cx - camChunkX) ** 2 + (a.cz - camChunkZ) ** 2;
      const db = (b.cx - camChunkX) ** 2 + (b.cz - camChunkZ) ** 2;
      return da - db;
    });

    // Process LOD chunks (use remaining time budget from LOD 0)
    const lodGeneratedThisFrame = new Set<string>();

    while (this.lodLoadQueue.length > 0 && performance.now() < this.frameDeadline) {
      const { cx, cz } = this.lodLoadQueue.shift()!;
      const key = chunkKey(cx, cz);
      const entry = this.lodChunks.get(key);
      if (!entry || entry.state !== ChunkState.QUEUED) continue;

      // Check if this chunk entered LOD 0 range
      const dx = cx - camChunkX;
      const dz = cz - camChunkZ;
      if (dx * dx + dz * dz <= rd * rd) {
        // LOD 0 range — remove LOD entry, let normal pipeline handle it
        this.lodChunks.delete(key);
        continue;
      }

      // Generate terrain (no vegetation, no water)
      entry.state = ChunkState.GENERATING;
      this.terrainGen.generate(entry.chunk);
      this.oreGen.generate(entry.chunk);
      this.caveGen.generate(entry.chunk);
      this.villageGen.generate(entry.chunk);
      this.treeGen.generate(entry.chunk);
      // Skip: vegGen, waterSim

      // Downsample before compress
      entry.lodBlocks = downsample(entry.chunk);

      // Build LOD mesh
      entry.state = ChunkState.MESHING;
      const lodNeighbors = this.getLODNeighborBlocks(cx, cz);
      const lodMeshData = buildLODMesh(
        entry.lodBlocks,
        entry.chunk.worldOffsetX,
        entry.chunk.worldOffsetZ,
        lodNeighbors,
      );

      // Upload to LOD mega buffer
      if (entry.chunk.lodAlloc) {
        this.lodIndirectRenderer.freeChunk(entry.chunk.lodAlloc);
        entry.chunk.lodAlloc = null;
      }
      if (lodMeshData.indexCount > 0) {
        entry.chunk.lodAlloc = this.lodIndirectRenderer.uploadChunk(
          lodMeshData.vertices, lodMeshData.indices,
          entry.chunk.worldOffsetX, entry.chunk.worldOffsetZ,
        );
      }

      // Compress block data
      entry.chunk.compress();

      entry.state = ChunkState.READY;
      lodGeneratedThisFrame.add(key);

      // Queue neighbor rebuilds
      const nKeys = [
        chunkKey(cx - 1, cz), chunkKey(cx + 1, cz),
        chunkKey(cx, cz - 1), chunkKey(cx, cz + 1),
      ];
      for (const nk of nKeys) {
        if (!lodGeneratedThisFrame.has(nk)) {
          this.lodPendingNeighborRebuilds.add(nk);
        }
      }
    }

    // Process max 2 LOD neighbor rebuilds per frame
    let lodNeighborRebuilds = 0;
    for (const nKey of this.lodPendingNeighborRebuilds) {
      if (lodNeighborRebuilds >= 2) break;
      const entry = this.lodChunks.get(nKey);
      if (!entry || entry.state !== ChunkState.READY) {
        this.lodPendingNeighborRebuilds.delete(nKey);
        continue;
      }
      const [ncx, ncz] = nKey.split(',').map(Number);
      this.rebuildLODNeighbor(ncx, ncz, entry);
      this.lodPendingNeighborRebuilds.delete(nKey);
      lodNeighborRebuilds++;
    }

    // Unload LOD chunks that are too far or replaced by full-detail
    const lodUnloadDist = totalRd + 2;
    const lodToRemove: string[] = [];
    for (const [key, entry] of this.lodChunks) {
      const dx = entry.chunk.chunkX - camChunkX;
      const dz = entry.chunk.chunkZ - camChunkZ;
      const dist2 = dx * dx + dz * dz;

      let shouldRemove = false;
      if (dist2 > lodUnloadDist * lodUnloadDist) {
        // Too far — always remove
        shouldRemove = true;
      } else if (dist2 <= rd * rd) {
        // Inside LOD 0 range — only remove when full-detail chunk is READY
        const fullEntry = this.chunks.get(key);
        if (fullEntry && fullEntry.state === ChunkState.READY) {
          shouldRemove = true;
        }
      }

      if (shouldRemove) {
        if (entry.chunk.lodAlloc) {
          this.lodIndirectRenderer.freeChunk(entry.chunk.lodAlloc);
          entry.chunk.lodAlloc = null;
        }
        entry.chunk.destroyGPU();
        lodToRemove.push(key);
      }
    }
    for (const key of lodToRemove) {
      this.lodChunks.delete(key);
      this.lodPendingNeighborRebuilds.delete(key);
    }

    this.totalLODChunks = this.lodChunks.size;
  }

  private getLODNeighborBlocks(cx: number, cz: number): LODNeighborBlocks {
    const getBlocks = (ncx: number, ncz: number): Uint8Array | null => {
      const entry = this.lodChunks.get(chunkKey(ncx, ncz));
      if (entry && entry.state >= ChunkState.MESHING && entry.lodBlocks.length > 0) {
        return entry.lodBlocks;
      }
      return null;
    };
    return {
      north: getBlocks(cx, cz + 1),
      south: getBlocks(cx, cz - 1),
      east: getBlocks(cx + 1, cz),
      west: getBlocks(cx - 1, cz),
    };
  }

  private rebuildLODNeighbor(cx: number, cz: number, entry: LODChunkEntry): void {
    if (entry.lodBlocks.length === 0) return;

    const lodNeighbors = this.getLODNeighborBlocks(cx, cz);
    const lodMeshData = buildLODMesh(
      entry.lodBlocks,
      entry.chunk.worldOffsetX,
      entry.chunk.worldOffsetZ,
      lodNeighbors,
    );

    if (entry.chunk.lodAlloc) {
      this.lodIndirectRenderer.freeChunk(entry.chunk.lodAlloc);
      entry.chunk.lodAlloc = null;
    }
    if (lodMeshData.indexCount > 0) {
      entry.chunk.lodAlloc = this.lodIndirectRenderer.uploadChunk(
        lodMeshData.vertices, lodMeshData.indices,
        entry.chunk.worldOffsetX, entry.chunk.worldOffsetZ,
      );
    }
  }

  getLODDrawCalls(): ChunkDrawCall[] {
    const calls: ChunkDrawCall[] = [];
    for (const [key, entry] of this.lodChunks) {
      if (entry.state !== ChunkState.READY) continue;
      const c = entry.chunk;
      if (!c.lodAlloc) continue;
      if (!this.isChunkInFrustum(c)) continue;

      // Skip if full-detail chunk is already rendering (avoid double-draw)
      const fullEntry = this.chunks.get(key);
      if (fullEntry && fullEntry.state === ChunkState.READY && fullEntry.chunk.solidAlloc) continue;

      calls.push({
        vertexBuffer: this.lodIndirectRenderer.vertexMega.buffer,
        indexBuffer: this.lodIndirectRenderer.indexMega.buffer,
        indexCount: c.lodAlloc.indexCount,
        firstIndex: c.lodAlloc.firstIndex,
        baseVertex: c.lodAlloc.baseVertex,
      });
    }
    return calls;
  }
}
