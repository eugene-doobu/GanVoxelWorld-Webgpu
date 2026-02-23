// IndirectRenderer: manages mega buffers, indirect draw arguments, and GPU frustum culling.

import { MegaBuffer, MegaAllocation } from './MegaBuffer';
import { CHUNK_WIDTH, CHUNK_HEIGHT, CHUNK_DEPTH } from '../constants';
import { checkShaderCompilation } from './shaderCheck';
import frustumCullShader from '../shaders/frustum_cull.wgsl?raw';

// 256 MB default for vertex, 128 MB for index
const DEFAULT_VERTEX_CAPACITY = 256 * 1024 * 1024;
const DEFAULT_INDEX_CAPACITY = 128 * 1024 * 1024;
const MAX_CHUNKS = 4096;

// Per-chunk metadata for GPU: 3 × vec4 = 48 bytes
const CHUNK_META_SIZE = 48;
// DrawIndexedIndirect args: 5 × u32 = 20 bytes
const INDIRECT_ARGS_SIZE = 20;

export interface ChunkAllocation {
  vertexAlloc: MegaAllocation;
  indexAlloc: MegaAllocation;
  indexCount: number;
  firstIndex: number;   // index offset in uint32 elements (not bytes)
  baseVertex: number;   // vertex offset in vertex count (not bytes)
  slotIndex: number;    // slot in the indirect args / metadata arrays
}

export class IndirectRenderer {
  private device: GPUDevice;

  // Mega buffers for all chunk geometry
  vertexMega: MegaBuffer;
  indexMega: MegaBuffer;

  // GPU resources for frustum culling
  private chunkMetaBuffer: GPUBuffer;
  private indirectArgsBuffer: GPUBuffer;
  private frustumBuffer: GPUBuffer;
  private paramsBuffer: GPUBuffer;

  // Compute pipeline for GPU frustum culling
  private cullPipeline: GPUComputePipeline;
  private cullBindGroupLayout: GPUBindGroupLayout;
  private cullBindGroup: GPUBindGroup | null = null;

  // Slot management
  private freeSlots: number[] = [];
  private activeChunkCount = 0;

  // CPU-side metadata for upload
  private metaData: Float32Array;
  private metaDirty = false;

  // Shader compilation check
  shaderChecks: Promise<void>[] = [];

  // Vertex stride (28 bytes for solid, same for vegetation)
  static readonly VERTEX_STRIDE = 28;

  constructor(device: GPUDevice) {
    this.device = device;

    this.vertexMega = new MegaBuffer(
      device, DEFAULT_VERTEX_CAPACITY,
      GPUBufferUsage.VERTEX,
    );
    this.indexMega = new MegaBuffer(
      device, DEFAULT_INDEX_CAPACITY,
      GPUBufferUsage.INDEX,
    );

    // Pre-allocate slot indices (reversed so pop() gives lowest first)
    for (let i = MAX_CHUNKS - 1; i >= 0; i--) {
      this.freeSlots.push(i);
    }

    // Chunk metadata buffer (storage, read by compute)
    this.chunkMetaBuffer = device.createBuffer({
      size: MAX_CHUNKS * CHUNK_META_SIZE,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    // Indirect draw args buffer (storage + indirect)
    this.indirectArgsBuffer = device.createBuffer({
      size: MAX_CHUNKS * INDIRECT_ARGS_SIZE,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.INDIRECT | GPUBufferUsage.COPY_DST,
    });

    // Frustum planes uniform (6 × vec4f = 96 bytes)
    this.frustumBuffer = device.createBuffer({
      size: 96,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Params uniform (vec4u: x=chunkCount)
    this.paramsBuffer = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // CPU-side metadata (12 floats per chunk = 48 bytes)
    this.metaData = new Float32Array(MAX_CHUNKS * 12);

    // Create compute pipeline
    const cullModule = device.createShaderModule({ code: frustumCullShader });
    this.shaderChecks.push(checkShaderCompilation('frustum_cull', cullModule));

    this.cullBindGroupLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
        { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
      ],
    });

    this.cullPipeline = device.createComputePipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [this.cullBindGroupLayout] }),
      compute: { module: cullModule, entryPoint: 'main' },
    });

    this.rebuildCullBindGroup();
  }

  private rebuildCullBindGroup(): void {
    this.cullBindGroup = this.device.createBindGroup({
      layout: this.cullBindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.chunkMetaBuffer } },
        { binding: 1, resource: { buffer: this.frustumBuffer } },
        { binding: 2, resource: { buffer: this.indirectArgsBuffer } },
        { binding: 3, resource: { buffer: this.paramsBuffer } },
      ],
    });
  }

  // Upload chunk mesh data into mega buffers. Returns allocation info.
  uploadChunk(
    vertices: Float32Array, indices: Uint32Array,
    chunkWorldX: number, chunkWorldZ: number,
  ): ChunkAllocation | null {
    if (indices.length === 0) return null;

    const vertexAlloc = this.vertexMega.allocate(vertices.byteLength);
    if (!vertexAlloc) return null;

    const indexAlloc = this.indexMega.allocate(indices.byteLength);
    if (!indexAlloc) {
      this.vertexMega.free(vertexAlloc);
      return null;
    }

    const slot = this.freeSlots.pop();
    if (slot === undefined) {
      this.vertexMega.free(vertexAlloc);
      this.indexMega.free(indexAlloc);
      return null;
    }

    // Upload data
    this.vertexMega.write(vertexAlloc, vertices.buffer as ArrayBuffer);
    this.indexMega.write(indexAlloc, indices.buffer as ArrayBuffer);

    const firstIndex = indexAlloc.offset / 4;  // byte offset to uint32 index
    const baseVertex = vertexAlloc.offset / IndirectRenderer.VERTEX_STRIDE;

    const alloc: ChunkAllocation = {
      vertexAlloc,
      indexAlloc,
      indexCount: indices.length,
      firstIndex,
      baseVertex,
      slotIndex: slot,
    };

    // Update metadata
    this.updateChunkMeta(alloc, chunkWorldX, chunkWorldZ);
    this.activeChunkCount = Math.max(this.activeChunkCount, slot + 1);

    return alloc;
  }

  // Free a chunk's allocation
  freeChunk(alloc: ChunkAllocation): void {
    this.vertexMega.free(alloc.vertexAlloc);
    this.indexMega.free(alloc.indexAlloc);
    this.freeSlots.push(alloc.slotIndex);

    // Zero out metadata for this slot
    const base = alloc.slotIndex * 12;
    this.metaData[base + 3] = 0; // indexCount = 0
    this.metaDirty = true;
  }

  private updateChunkMeta(alloc: ChunkAllocation, worldX: number, worldZ: number): void {
    const base = alloc.slotIndex * 12;
    const f32 = this.metaData;
    const u32 = new Uint32Array(f32.buffer);

    // aabbMin (xyz) + indexCount as float bits
    f32[base + 0] = worldX;
    f32[base + 1] = 0;
    f32[base + 2] = worldZ;
    u32[base + 3] = alloc.indexCount; // bitcast to u32

    // aabbMax (xyz) + unused
    f32[base + 4] = worldX + CHUNK_WIDTH;
    f32[base + 5] = CHUNK_HEIGHT;
    f32[base + 6] = worldZ + CHUNK_DEPTH;
    f32[base + 7] = 0;

    // offsets: firstIndex, baseVertex, unused, unused
    u32[base + 8] = alloc.firstIndex;
    u32[base + 9] = alloc.baseVertex;
    u32[base + 10] = 0;
    u32[base + 11] = 0;

    this.metaDirty = true;
  }

  // Update frustum planes and dispatch culling compute shader
  dispatchCulling(encoder: GPUCommandEncoder, frustumPlanes: Float32Array[]): void {
    // Upload frustum planes (6 × vec4f = 24 floats)
    const frustumData = new Float32Array(24);
    for (let i = 0; i < 6; i++) {
      frustumData[i * 4 + 0] = frustumPlanes[i][0];
      frustumData[i * 4 + 1] = frustumPlanes[i][1];
      frustumData[i * 4 + 2] = frustumPlanes[i][2];
      frustumData[i * 4 + 3] = frustumPlanes[i][3];
    }
    this.device.queue.writeBuffer(this.frustumBuffer, 0, frustumData);

    // Upload chunk count
    const paramsData = new Uint32Array([this.activeChunkCount, 0, 0, 0]);
    this.device.queue.writeBuffer(this.paramsBuffer, 0, paramsData);

    // Upload dirty metadata
    if (this.metaDirty) {
      this.metaDirty = false;
      const uploadSize = this.activeChunkCount * CHUNK_META_SIZE;
      if (uploadSize > 0) {
        this.device.queue.writeBuffer(
          this.chunkMetaBuffer, 0,
          this.metaData.buffer as ArrayBuffer, 0,
          uploadSize,
        );
      }
    }

    // Dispatch compute shader
    if (this.activeChunkCount > 0) {
      const pass = encoder.beginComputePass();
      pass.setPipeline(this.cullPipeline);
      pass.setBindGroup(0, this.cullBindGroup!);
      pass.dispatchWorkgroups(Math.ceil(this.activeChunkCount / 64));
      pass.end();
    }
  }

  // Get the indirect args buffer and chunk count for indirect draw calls
  get argsBuffer(): GPUBuffer { return this.indirectArgsBuffer; }
  get chunkCount(): number { return this.activeChunkCount; }

  destroy(): void {
    this.vertexMega.destroy();
    this.indexMega.destroy();
    this.chunkMetaBuffer.destroy();
    this.indirectArgsBuffer.destroy();
    this.frustumBuffer.destroy();
    this.paramsBuffer.destroy();
  }
}
