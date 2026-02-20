import { mat4 } from 'gl-matrix';
import { Config } from '../config/Config';
import { WebGPUContext } from './WebGPUContext';
import { HDR_FORMAT, VELOCITY_FORMAT } from '../constants';

import velocityShader from '../shaders/velocity.wgsl?raw';
import taaResolveShader from '../shaders/taa_resolve.wgsl?raw';

// VelocityUniforms: invViewProj(64) + prevViewProj(64) = 128 bytes
const VELOCITY_UNIFORM_SIZE = 128;

// TAAUniforms: blendFactor(4) + pad(12) = 16 bytes
const TAA_UNIFORM_SIZE = 16;

// Halton sequence base
function halton(index: number, base: number): number {
  let result = 0;
  let f = 1 / base;
  let i = index;
  while (i > 0) {
    result += f * (i % base);
    i = Math.floor(i / base);
    f /= base;
  }
  return result;
}

export class TAA {
  private ctx: WebGPUContext;

  // Textures
  private velocityTexture!: GPUTexture;
  private velocityTextureView!: GPUTextureView;
  private historyA!: GPUTexture;
  private historyAView!: GPUTextureView;
  private historyB!: GPUTexture;
  private historyBView!: GPUTextureView;
  private resolveTarget!: GPUTexture;
  private resolveTargetView!: GPUTextureView;
  private pingPong = 0; // 0: write to A, read from B; 1: opposite

  // Pipelines
  private velocityPipeline!: GPURenderPipeline;
  private resolvePipeline!: GPURenderPipeline;

  // Bind group layouts
  private velocityBGL!: GPUBindGroupLayout;
  private resolveBGL!: GPUBindGroupLayout;

  // Uniform buffers
  private velocityUniformBuffer!: GPUBuffer;
  private taaUniformBuffer!: GPUBuffer;

  // Pre-allocated arrays
  private velocityF32 = new Float32Array(VELOCITY_UNIFORM_SIZE / 4);
  private taaF32 = new Float32Array(TAA_UNIFORM_SIZE / 4);

  private linearSampler!: GPUSampler;

  // Bind groups (recreated on resize)
  private velocityBindGroup: GPUBindGroup | null = null;
  private resolveBindGroup: GPUBindGroup | null = null;

  // External textures
  private depthView: GPUTextureView | null = null;
  private hdrTextureView: GPUTextureView | null = null;

  // Jitter
  private frameIndex = 0;

  // Stored matrices for velocity pass
  private prevViewProj = mat4.create();

  constructor(ctx: WebGPUContext) {
    this.ctx = ctx;
    this.createSampler();
    this.createUniformBuffers();
    this.createPipelines();
    this.createTextures();
  }

  private createSampler(): void {
    this.linearSampler = this.ctx.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    });
  }

  private createUniformBuffers(): void {
    const device = this.ctx.device;

    this.velocityUniformBuffer = device.createBuffer({
      size: VELOCITY_UNIFORM_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.taaUniformBuffer = device.createBuffer({
      size: TAA_UNIFORM_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  private createPipelines(): void {
    const device = this.ctx.device;

    // Velocity pipeline
    this.velocityBGL = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'depth' } },
      ],
    });

    const velocityModule = device.createShaderModule({ code: velocityShader });
    velocityModule.getCompilationInfo().then(info => {
      for (const msg of info.messages) console.warn(`[velocity] ${msg.type}: ${msg.message} (line ${msg.lineNum})`);
    });

    this.velocityPipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [this.velocityBGL] }),
      vertex: { module: velocityModule, entryPoint: 'vs_main' },
      fragment: {
        module: velocityModule,
        entryPoint: 'fs_main',
        targets: [{ format: VELOCITY_FORMAT }],
      },
      primitive: { topology: 'triangle-list' },
    });

    // Resolve pipeline
    this.resolveBGL = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        { binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        { binding: 4, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
      ],
    });

    const resolveModule = device.createShaderModule({ code: taaResolveShader });
    resolveModule.getCompilationInfo().then(info => {
      for (const msg of info.messages) console.warn(`[taa_resolve] ${msg.type}: ${msg.message} (line ${msg.lineNum})`);
    });

    this.resolvePipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [this.resolveBGL] }),
      vertex: { module: resolveModule, entryPoint: 'vs_main' },
      fragment: {
        module: resolveModule,
        entryPoint: 'fs_main',
        targets: [{ format: HDR_FORMAT }],
      },
      primitive: { topology: 'triangle-list' },
    });
  }

  createTextures(): void {
    // Destroy old
    if (this.velocityTexture) this.velocityTexture.destroy();
    if (this.historyA) this.historyA.destroy();
    if (this.historyB) this.historyB.destroy();
    if (this.resolveTarget) this.resolveTarget.destroy();

    const w = this.ctx.canvas.width;
    const h = this.ctx.canvas.height;

    this.velocityTexture = this.ctx.device.createTexture({
      size: [w, h],
      format: VELOCITY_FORMAT,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    this.velocityTextureView = this.velocityTexture.createView();

    this.historyA = this.ctx.device.createTexture({
      size: [w, h],
      format: HDR_FORMAT,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    this.historyAView = this.historyA.createView();

    this.historyB = this.ctx.device.createTexture({
      size: [w, h],
      format: HDR_FORMAT,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    this.historyBView = this.historyB.createView();

    this.resolveTarget = this.ctx.device.createTexture({
      size: [w, h],
      format: HDR_FORMAT,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC,
    });
    this.resolveTargetView = this.resolveTarget.createView();

    // Reset ping-pong and frame index on resize
    this.pingPong = 0;
    this.frameIndex = 0;

    // Invalidate bind groups
    this.velocityBindGroup = null;
    this.resolveBindGroup = null;
  }

  getJitter(width: number, height: number): [number, number] {
    if (!Config.data.rendering.taa.enabled) {
      return [0, 0];
    }
    const idx = (this.frameIndex % 16) + 1; // 1-based for Halton
    const jx = halton(idx, 2) - 0.5;
    const jy = halton(idx, 3) - 0.5;
    // Convert to NDC pixel offset
    return [
      (jx * 2.0) / width,
      (jy * 2.0) / height,
    ];
  }

  setResources(depthView: GPUTextureView, hdrTextureView: GPUTextureView): void {
    this.depthView = depthView;
    this.hdrTextureView = hdrTextureView;
    this.velocityBindGroup = null;
    this.resolveBindGroup = null;
  }

  private ensureBindGroups(): void {
    if (this.velocityBindGroup && this.resolveBindGroup) return;
    if (!this.depthView || !this.hdrTextureView) return;

    this.velocityBindGroup = this.ctx.device.createBindGroup({
      layout: this.velocityBGL,
      entries: [
        { binding: 0, resource: { buffer: this.velocityUniformBuffer } },
        { binding: 1, resource: this.depthView },
      ],
    });

    // Read from history (previous resolved frame)
    const historyReadView = this.pingPong === 0 ? this.historyBView : this.historyAView;

    this.resolveBindGroup = this.ctx.device.createBindGroup({
      layout: this.resolveBGL,
      entries: [
        { binding: 0, resource: { buffer: this.taaUniformBuffer } },
        { binding: 1, resource: this.hdrTextureView },
        { binding: 2, resource: historyReadView },
        { binding: 3, resource: this.velocityTextureView },
        { binding: 4, resource: this.linearSampler },
      ],
    });
  }

  updateUniforms(unjitteredViewProj: mat4): void {
    // Velocity uniforms
    const invVP = mat4.create();
    mat4.invert(invVP, unjitteredViewProj);

    const vf = this.velocityF32;
    vf.set(invVP as Float32Array, 0);
    vf.set(this.prevViewProj as Float32Array, 16);
    this.ctx.device.queue.writeBuffer(this.velocityUniformBuffer, 0, vf);

    // TAA uniforms
    const tf = this.taaF32;
    tf[0] = Config.data.rendering.taa.blendFactor;
    tf[1] = 0;
    tf[2] = 0;
    tf[3] = 0;
    this.ctx.device.queue.writeBuffer(this.taaUniformBuffer, 0, tf);
  }

  renderVelocity(encoder: GPUCommandEncoder): void {
    this.ensureBindGroups();
    if (!this.velocityBindGroup) return;

    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: this.velocityTextureView,
        clearValue: { r: 0, g: 0, b: 0, a: 0 },
        loadOp: 'clear',
        storeOp: 'store',
      }],
    });
    pass.setPipeline(this.velocityPipeline);
    pass.setBindGroup(0, this.velocityBindGroup);
    pass.draw(3);
    pass.end();
  }

  renderResolve(encoder: GPUCommandEncoder): void {
    // Rebuild resolve bind group each frame because history ping-pong changes
    if (!this.depthView || !this.hdrTextureView) return;

    const historyReadView = this.pingPong === 0 ? this.historyBView : this.historyAView;

    this.resolveBindGroup = this.ctx.device.createBindGroup({
      layout: this.resolveBGL,
      entries: [
        { binding: 0, resource: { buffer: this.taaUniformBuffer } },
        { binding: 1, resource: this.hdrTextureView },
        { binding: 2, resource: historyReadView },
        { binding: 3, resource: this.velocityTextureView },
        { binding: 4, resource: this.linearSampler },
      ],
    });

    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: this.resolveTargetView,
        clearValue: { r: 0, g: 0, b: 0, a: 1 },
        loadOp: 'clear',
        storeOp: 'store',
      }],
    });
    pass.setPipeline(this.resolvePipeline);
    pass.setBindGroup(0, this.resolveBindGroup);
    pass.draw(3);
    pass.end();
  }

  copyResolvedToHDR(encoder: GPUCommandEncoder, hdrTexture: GPUTexture): void {
    const w = this.ctx.canvas.width;
    const h = this.ctx.canvas.height;

    // Copy resolved to HDR (so bloom/tonemap reads TAA result)
    encoder.copyTextureToTexture(
      { texture: this.resolveTarget },
      { texture: hdrTexture },
      [w, h],
    );

    // Copy resolved to history for next frame
    const historyWriteTexture = this.pingPong === 0 ? this.historyA : this.historyB;
    encoder.copyTextureToTexture(
      { texture: this.resolveTarget },
      { texture: historyWriteTexture },
      [w, h],
    );
  }

  swapHistory(): void {
    this.pingPong = 1 - this.pingPong;
    this.frameIndex = (this.frameIndex + 1) % 256;
  }

  get velocityView(): GPUTextureView { return this.velocityTextureView; }

  storePrevViewProj(viewProj: mat4): void {
    mat4.copy(this.prevViewProj, viewProj);
  }

  resize(): void {
    this.createTextures();
  }
}
