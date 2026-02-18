import { SSAO_KERNEL_SIZE, SSAO_NOISE_SIZE, SSAO_RADIUS, SSAO_BIAS } from '../constants';
import { WebGPUContext } from './WebGPUContext';

import ssaoShader from '../shaders/ssao.wgsl?raw';
import ssaoBlurShader from '../shaders/ssao_blur.wgsl?raw';

export class SSAO {
  private ctx: WebGPUContext;

  ssaoTexture!: GPUTexture;
  ssaoTextureView!: GPUTextureView;
  blurredTexture!: GPUTexture;
  blurredTextureView!: GPUTextureView;

  private noiseTexture!: GPUTexture;
  private noiseTextureView!: GPUTextureView;
  private uniformBuffer!: GPUBuffer;

  private ssaoPipeline!: GPURenderPipeline;
  private ssaoBindGroupLayout!: GPUBindGroupLayout;
  private ssaoBindGroup!: GPUBindGroup | null;

  private blurPipeline!: GPURenderPipeline;
  private blurBindGroupLayout!: GPUBindGroupLayout;
  private blurBindGroup!: GPUBindGroup | null;

  private pointSampler!: GPUSampler;
  private linearSampler!: GPUSampler;

  private halfWidth = 0;
  private halfHeight = 0;

  constructor(ctx: WebGPUContext) {
    this.ctx = ctx;
    this.createSamplers();
    this.createNoiseTexture();
    this.createUniformBuffer();
    this.createPipelines();
    this.createTextures();
  }

  private createSamplers(): void {
    this.pointSampler = this.ctx.device.createSampler({
      magFilter: 'nearest',
      minFilter: 'nearest',
      addressModeU: 'repeat',
      addressModeV: 'repeat',
    });
    this.linearSampler = this.ctx.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    });
  }

  private createNoiseTexture(): void {
    const data = new Float32Array(SSAO_NOISE_SIZE * SSAO_NOISE_SIZE * 4);
    for (let i = 0; i < SSAO_NOISE_SIZE * SSAO_NOISE_SIZE; i++) {
      // Random rotations in tangent space (encode as 0-1 for rgba8)
      data[i * 4 + 0] = Math.random() * 2 - 1;
      data[i * 4 + 1] = Math.random() * 2 - 1;
      data[i * 4 + 2] = 0;
      data[i * 4 + 3] = 1;
    }

    // Convert to rgba8 (0-1 range encoded as 0-255)
    const pixels = new Uint8Array(SSAO_NOISE_SIZE * SSAO_NOISE_SIZE * 4);
    for (let i = 0; i < data.length; i++) {
      pixels[i] = Math.round((data[i] * 0.5 + 0.5) * 255);
    }

    this.noiseTexture = this.ctx.device.createTexture({
      size: [SSAO_NOISE_SIZE, SSAO_NOISE_SIZE],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });

    this.ctx.device.queue.writeTexture(
      { texture: this.noiseTexture },
      pixels.buffer as ArrayBuffer,
      { bytesPerRow: SSAO_NOISE_SIZE * 4 },
      [SSAO_NOISE_SIZE, SSAO_NOISE_SIZE],
    );

    this.noiseTextureView = this.noiseTexture.createView();
  }

  private createUniformBuffer(): void {
    // SSAOParams: projection(64) + invProjection(64) + kernelSamples(16*16=256) + noiseScale(8) + radius(4) + bias(4) = 400 bytes
    const bufferSize = 400;
    this.uniformBuffer = this.ctx.device.createBuffer({
      size: bufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Generate hemisphere kernel samples
    const kernelData = new Float32Array(SSAO_KERNEL_SIZE * 4);
    for (let i = 0; i < SSAO_KERNEL_SIZE; i++) {
      let x = Math.random() * 2 - 1;
      let y = Math.random() * 2 - 1;
      let z = Math.random(); // hemisphere: z >= 0
      const len = Math.sqrt(x * x + y * y + z * z);
      x /= len; y /= len; z /= len;

      // Accelerating interpolation: samples closer to origin are more frequent
      let scale = i / SSAO_KERNEL_SIZE;
      scale = 0.1 + scale * scale * 0.9;
      x *= scale; y *= scale; z *= scale;

      kernelData[i * 4 + 0] = x;
      kernelData[i * 4 + 1] = y;
      kernelData[i * 4 + 2] = z;
      kernelData[i * 4 + 3] = 0;
    }

    // Write kernel samples at offset 128 (after 2 mat4s)
    this.ctx.device.queue.writeBuffer(this.uniformBuffer, 128, kernelData);
  }

  updateProjection(projection: Float32Array, invProjection: Float32Array): void {
    // Write projection (64 bytes) at offset 0
    const projBuf = new ArrayBuffer(64);
    new Float32Array(projBuf).set(projection);
    this.ctx.device.queue.writeBuffer(this.uniformBuffer, 0, projBuf);
    // Write invProjection (64 bytes) at offset 64
    const invProjBuf = new ArrayBuffer(64);
    new Float32Array(invProjBuf).set(invProjection);
    this.ctx.device.queue.writeBuffer(this.uniformBuffer, 64, invProjBuf);

    // Write noiseScale + radius + bias at offset 384
    const extraData = new Float32Array([
      this.halfWidth / SSAO_NOISE_SIZE,
      this.halfHeight / SSAO_NOISE_SIZE,
      SSAO_RADIUS,
      SSAO_BIAS,
    ]);
    this.ctx.device.queue.writeBuffer(this.uniformBuffer, 384, extraData);
  }

  private createPipelines(): void {
    const device = this.ctx.device;

    // SSAO pipeline
    this.ssaoBindGroupLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'depth' } },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        { binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        { binding: 4, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
      ],
    });

    const ssaoModule = device.createShaderModule({ code: ssaoShader });
    this.ssaoPipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [this.ssaoBindGroupLayout] }),
      vertex: { module: ssaoModule, entryPoint: 'vs_main' },
      fragment: {
        module: ssaoModule,
        entryPoint: 'fs_main',
        targets: [{ format: 'r8unorm' }],
      },
      primitive: { topology: 'triangle-list' },
    });

    // Blur pipeline
    this.blurBindGroupLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'depth' } },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
      ],
    });

    const blurModule = device.createShaderModule({ code: ssaoBlurShader });
    this.blurPipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [this.blurBindGroupLayout] }),
      vertex: { module: blurModule, entryPoint: 'vs_main' },
      fragment: {
        module: blurModule,
        entryPoint: 'fs_main',
        targets: [{ format: 'r8unorm' }],
      },
      primitive: { topology: 'triangle-list' },
    });
  }

  createTextures(): void {
    if (this.ssaoTexture) this.ssaoTexture.destroy();
    if (this.blurredTexture) this.blurredTexture.destroy();

    this.halfWidth = Math.max(1, Math.floor(this.ctx.canvas.width / 2));
    this.halfHeight = Math.max(1, Math.floor(this.ctx.canvas.height / 2));

    this.ssaoTexture = this.ctx.device.createTexture({
      size: [this.halfWidth, this.halfHeight],
      format: 'r8unorm',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    this.ssaoTextureView = this.ssaoTexture.createView();

    this.blurredTexture = this.ctx.device.createTexture({
      size: [this.halfWidth, this.halfHeight],
      format: 'r8unorm',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    this.blurredTextureView = this.blurredTexture.createView();

    // Invalidate bind groups
    this.ssaoBindGroup = null;
    this.blurBindGroup = null;
  }

  private ensureBindGroups(depthView: GPUTextureView, normalView: GPUTextureView): void {
    if (this.ssaoBindGroup) return;

    this.ssaoBindGroup = this.ctx.device.createBindGroup({
      layout: this.ssaoBindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer } },
        { binding: 1, resource: depthView },
        { binding: 2, resource: normalView },
        { binding: 3, resource: this.noiseTextureView },
        { binding: 4, resource: this.pointSampler },
      ],
    });

    this.blurBindGroup = this.ctx.device.createBindGroup({
      layout: this.blurBindGroupLayout,
      entries: [
        { binding: 0, resource: this.ssaoTextureView },
        { binding: 1, resource: depthView },
        { binding: 2, resource: this.linearSampler },
      ],
    });
  }

  renderSSAO(encoder: GPUCommandEncoder, depthView: GPUTextureView, normalView: GPUTextureView): void {
    this.ensureBindGroups(depthView, normalView);

    // SSAO pass
    const ssaoPass = encoder.beginRenderPass({
      colorAttachments: [{
        view: this.ssaoTextureView,
        clearValue: { r: 1, g: 1, b: 1, a: 1 },
        loadOp: 'clear',
        storeOp: 'store',
      }],
    });
    ssaoPass.setPipeline(this.ssaoPipeline);
    ssaoPass.setBindGroup(0, this.ssaoBindGroup!);
    ssaoPass.draw(3);
    ssaoPass.end();

    // Blur pass
    const blurPass = encoder.beginRenderPass({
      colorAttachments: [{
        view: this.blurredTextureView,
        clearValue: { r: 1, g: 1, b: 1, a: 1 },
        loadOp: 'clear',
        storeOp: 'store',
      }],
    });
    blurPass.setPipeline(this.blurPipeline);
    blurPass.setBindGroup(0, this.blurBindGroup!);
    blurPass.draw(3);
    blurPass.end();
  }

  resize(): void {
    this.createTextures();
  }
}
