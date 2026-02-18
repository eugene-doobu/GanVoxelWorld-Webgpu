import { mat4 } from 'gl-matrix';
import { WebGPUContext } from './WebGPUContext';

import vertShader from '../shaders/terrain.vert.wgsl?raw';
import fragShader from '../shaders/terrain.frag.wgsl?raw';
import skyShader from '../shaders/sky.wgsl?raw';

// Camera uniform: mat4(64) + vec4 cameraPos(16) + vec4 fogParams(16) = 96 bytes
const CAMERA_UNIFORM_SIZE = 96;
// Sky uniform: mat4 invViewProj(64) + vec4 sunDir(16) = 80 bytes
const SKY_UNIFORM_SIZE = 80;

export interface ChunkDrawCall {
  vertexBuffer: GPUBuffer;
  indexBuffer: GPUBuffer;
  indexCount: number;
}

export class RenderPipeline {
  private ctx: WebGPUContext;

  // Terrain pipeline
  private terrainPipeline!: GPURenderPipeline;
  private cameraUniformBuffer!: GPUBuffer;
  private cameraBindGroup!: GPUBindGroup;
  private cameraBindGroupLayout!: GPUBindGroupLayout;
  private textureBindGroupLayout!: GPUBindGroupLayout;
  private textureBindGroup: GPUBindGroup | null = null;

  // Sky pipeline
  private skyPipeline!: GPURenderPipeline;
  private skyUniformBuffer!: GPUBuffer;
  private skyBindGroup!: GPUBindGroup;
  private skyBindGroupLayout!: GPUBindGroupLayout;

  // Sun direction (normalized) — fixed "late morning" angle
  private sunDir = new Float32Array([0.4, 0.7, 0.3, 0.0]);

  constructor(ctx: WebGPUContext) {
    this.ctx = ctx;
    this.initTerrain();
    this.initSky();
  }

  private initTerrain(): void {
    const device = this.ctx.device;

    this.cameraBindGroupLayout = device.createBindGroupLayout({
      entries: [{
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: { type: 'uniform' },
      }],
    });

    this.textureBindGroupLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: {} },
      ],
    });

    const pipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: [this.cameraBindGroupLayout, this.textureBindGroupLayout],
    });

    const vertModule = device.createShaderModule({ code: vertShader });
    const fragModule = device.createShaderModule({ code: fragShader });

    this.terrainPipeline = device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: vertModule,
        entryPoint: 'main',
        buffers: [{
          arrayStride: 24,
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x3' },
            { shaderLocation: 1, offset: 12, format: 'uint32' },
            { shaderLocation: 2, offset: 16, format: 'float32x2' },
          ],
        }],
      },
      fragment: {
        module: fragModule,
        entryPoint: 'main',
        targets: [{
          format: this.ctx.format,
        }],
      },
      primitive: {
        topology: 'triangle-list',
        cullMode: 'back',
        frontFace: 'ccw',
      },
      depthStencil: {
        format: 'depth24plus',
        depthWriteEnabled: true,
        depthCompare: 'less',
      },
    });

    this.cameraUniformBuffer = device.createBuffer({
      size: CAMERA_UNIFORM_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.cameraBindGroup = device.createBindGroup({
      layout: this.cameraBindGroupLayout,
      entries: [{
        binding: 0,
        resource: { buffer: this.cameraUniformBuffer },
      }],
    });
  }

  private initSky(): void {
    const device = this.ctx.device;

    // Sky uses the same camera buffer (binding 0) + its own sky uniform (binding 1)
    this.skyBindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: 'uniform' },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: 'uniform' },
        },
      ],
    });

    const skyPipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: [this.skyBindGroupLayout],
    });

    const skyModule = device.createShaderModule({ code: skyShader });

    this.skyPipeline = device.createRenderPipeline({
      layout: skyPipelineLayout,
      vertex: {
        module: skyModule,
        entryPoint: 'vs_main',
        buffers: [],
      },
      fragment: {
        module: skyModule,
        entryPoint: 'fs_main',
        targets: [{ format: this.ctx.format }],
      },
      primitive: {
        topology: 'triangle-list',
      },
      depthStencil: {
        format: 'depth24plus',
        depthWriteEnabled: false,
        depthCompare: 'less-equal',  // z=1.0 passes depth test at clear value 1.0
      },
    });

    this.skyUniformBuffer = device.createBuffer({
      size: SKY_UNIFORM_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.skyBindGroup = device.createBindGroup({
      layout: this.skyBindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.cameraUniformBuffer } },
        { binding: 1, resource: { buffer: this.skyUniformBuffer } },
      ],
    });
  }

  setAtlasTexture(texture: GPUTexture): void {
    const sampler = this.ctx.device.createSampler({
      magFilter: 'nearest',
      minFilter: 'nearest',
      mipmapFilter: 'nearest',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    });

    this.textureBindGroup = this.ctx.device.createBindGroup({
      layout: this.textureBindGroupLayout,
      entries: [
        { binding: 0, resource: sampler },
        { binding: 1, resource: texture.createView() },
      ],
    });
  }

  updateCamera(viewProj: mat4, cameraPos: Float32Array, fogStart: number, fogEnd: number): void {
    // Camera uniform
    const data = new ArrayBuffer(CAMERA_UNIFORM_SIZE);
    const f32 = new Float32Array(data);
    f32.set(viewProj as Float32Array, 0);
    f32[16] = cameraPos[0];
    f32[17] = cameraPos[1];
    f32[18] = cameraPos[2];
    f32[19] = 0;
    f32[20] = fogStart;
    f32[21] = fogEnd;
    f32[22] = 0;
    f32[23] = 0;
    this.ctx.device.queue.writeBuffer(this.cameraUniformBuffer, 0, data);

    // Sky uniform: invViewProj + sunDir
    const skyData = new ArrayBuffer(SKY_UNIFORM_SIZE);
    const skyF32 = new Float32Array(skyData);
    const invVP = mat4.create();
    mat4.invert(invVP, viewProj);
    skyF32.set(invVP as Float32Array, 0);
    // Normalize sun direction
    const sx = this.sunDir[0], sy = this.sunDir[1], sz = this.sunDir[2];
    const slen = Math.sqrt(sx * sx + sy * sy + sz * sz);
    skyF32[16] = sx / slen;
    skyF32[17] = sy / slen;
    skyF32[18] = sz / slen;
    skyF32[19] = 0;
    this.ctx.device.queue.writeBuffer(this.skyUniformBuffer, 0, skyData);
  }

  render(drawCalls: ChunkDrawCall[]): void {
    const ctx = this.ctx;
    const textureView = ctx.context.getCurrentTexture().createView();

    const encoder = ctx.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: textureView,
        clearValue: { r: 0, g: 0, b: 0, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store',
      }],
      depthStencilAttachment: {
        view: ctx.depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
    });

    // 1) Sky pass — fullscreen triangle at z=1.0
    pass.setPipeline(this.skyPipeline);
    pass.setBindGroup(0, this.skyBindGroup);
    pass.draw(3);

    // 2) Terrain pass
    pass.setPipeline(this.terrainPipeline);
    pass.setBindGroup(0, this.cameraBindGroup);
    if (this.textureBindGroup) {
      pass.setBindGroup(1, this.textureBindGroup);
    }

    for (const dc of drawCalls) {
      if (dc.indexCount === 0) continue;
      pass.setVertexBuffer(0, dc.vertexBuffer);
      pass.setIndexBuffer(dc.indexBuffer, 'uint32');
      pass.drawIndexed(dc.indexCount);
    }

    pass.end();
    ctx.device.queue.submit([encoder.finish()]);
  }
}
