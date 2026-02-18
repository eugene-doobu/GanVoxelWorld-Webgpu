import { BLOOM_MIP_LEVELS, BLOOM_THRESHOLD, BLOOM_INTENSITY, HDR_FORMAT } from '../constants';
import { WebGPUContext } from './WebGPUContext';

import bloomThresholdShader from '../shaders/bloom_threshold.wgsl?raw';
import bloomDownsampleShader from '../shaders/bloom_downsample.wgsl?raw';
import bloomUpsampleShader from '../shaders/bloom_upsample.wgsl?raw';
import tonemapShader from '../shaders/tonemap.wgsl?raw';

export class PostProcess {
  private ctx: WebGPUContext;

  // HDR render target (lighting output)
  hdrTexture!: GPUTexture;
  hdrTextureView!: GPUTextureView;

  // Bloom mip chain
  private bloomMips: GPUTexture[] = [];
  private bloomMipViews: GPUTextureView[] = [];

  // Pipelines
  private thresholdPipeline!: GPURenderPipeline;
  private downsamplePipeline!: GPURenderPipeline;
  private upsamplePipeline!: GPURenderPipeline;
  private tonemapPipeline!: GPURenderPipeline;

  // Bind group layouts
  private thresholdBGL!: GPUBindGroupLayout;
  private downsampleBGL!: GPUBindGroupLayout;
  private upsampleBGL!: GPUBindGroupLayout;
  private tonemapBGL!: GPUBindGroupLayout;

  // Uniform buffers
  private bloomParamsBuffer!: GPUBuffer;
  private bloomUpParamsBuffer!: GPUBuffer;
  private tonemapParamsBuffer!: GPUBuffer;

  private linearSampler!: GPUSampler;

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

    // BloomParams: threshold(4) + knee(4) + pad(8) = 16 bytes
    this.bloomParamsBuffer = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.bloomParamsBuffer, 0, new Float32Array([
      BLOOM_THRESHOLD, 0.5, 0, 0,
    ]));

    // BloomUpParams: filterRadius(4) + pad(12) = 16 bytes
    this.bloomUpParamsBuffer = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.bloomUpParamsBuffer, 0, new Float32Array([
      1.0, 0, 0, 0,
    ]));

    // TonemapParams: bloomIntensity(4) + exposure(4) + pad(8) = 16 bytes
    this.tonemapParamsBuffer = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.tonemapParamsBuffer, 0, new Float32Array([
      BLOOM_INTENSITY, 1.2, 0, 0,
    ]));
  }

  private createPipelines(): void {
    const device = this.ctx.device;

    // Threshold pipeline
    this.thresholdBGL = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
      ],
    });

    const thresholdModule = device.createShaderModule({ code: bloomThresholdShader });
    this.thresholdPipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [this.thresholdBGL] }),
      vertex: { module: thresholdModule, entryPoint: 'vs_main' },
      fragment: {
        module: thresholdModule,
        entryPoint: 'fs_main',
        targets: [{ format: HDR_FORMAT }],
      },
      primitive: { topology: 'triangle-list' },
    });

    // Downsample pipeline
    this.downsampleBGL = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
      ],
    });

    const downsampleModule = device.createShaderModule({ code: bloomDownsampleShader });
    this.downsamplePipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [this.downsampleBGL] }),
      vertex: { module: downsampleModule, entryPoint: 'vs_main' },
      fragment: {
        module: downsampleModule,
        entryPoint: 'fs_main',
        targets: [{ format: HDR_FORMAT }],
      },
      primitive: { topology: 'triangle-list' },
    });

    // Upsample pipeline (additive blend)
    this.upsampleBGL = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
      ],
    });

    const upsampleModule = device.createShaderModule({ code: bloomUpsampleShader });
    this.upsamplePipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [this.upsampleBGL] }),
      vertex: { module: upsampleModule, entryPoint: 'vs_main' },
      fragment: {
        module: upsampleModule,
        entryPoint: 'fs_main',
        targets: [{
          format: HDR_FORMAT,
          blend: {
            color: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
            alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
          },
        }],
      },
      primitive: { topology: 'triangle-list' },
    });

    // Tonemap pipeline
    this.tonemapBGL = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
        { binding: 3, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
      ],
    });

    const tonemapModule = device.createShaderModule({ code: tonemapShader });
    this.tonemapPipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [this.tonemapBGL] }),
      vertex: { module: tonemapModule, entryPoint: 'vs_main' },
      fragment: {
        module: tonemapModule,
        entryPoint: 'fs_main',
        targets: [{ format: this.ctx.format }],
      },
      primitive: { topology: 'triangle-list' },
    });
  }

  createTextures(): void {
    // Destroy old
    if (this.hdrTexture) this.hdrTexture.destroy();
    for (const t of this.bloomMips) t.destroy();
    this.bloomMips = [];
    this.bloomMipViews = [];

    const w = this.ctx.canvas.width;
    const h = this.ctx.canvas.height;

    this.hdrTexture = this.ctx.device.createTexture({
      size: [w, h],
      format: HDR_FORMAT,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    this.hdrTextureView = this.hdrTexture.createView();

    // Create bloom mip chain
    let mipW = Math.max(1, Math.floor(w / 2));
    let mipH = Math.max(1, Math.floor(h / 2));
    for (let i = 0; i < BLOOM_MIP_LEVELS; i++) {
      const tex = this.ctx.device.createTexture({
        size: [mipW, mipH],
        format: HDR_FORMAT,
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      });
      this.bloomMips.push(tex);
      this.bloomMipViews.push(tex.createView());
      mipW = Math.max(1, Math.floor(mipW / 2));
      mipH = Math.max(1, Math.floor(mipH / 2));
    }
  }

  renderBloomAndTonemap(encoder: GPUCommandEncoder, swapChainView: GPUTextureView): void {
    // 1. Threshold extraction → bloomMips[0]
    {
      const bg = this.ctx.device.createBindGroup({
        layout: this.thresholdBGL,
        entries: [
          { binding: 0, resource: this.hdrTextureView },
          { binding: 1, resource: this.linearSampler },
          { binding: 2, resource: { buffer: this.bloomParamsBuffer } },
        ],
      });
      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: this.bloomMipViews[0],
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
          loadOp: 'clear',
          storeOp: 'store',
        }],
      });
      pass.setPipeline(this.thresholdPipeline);
      pass.setBindGroup(0, bg);
      pass.draw(3);
      pass.end();
    }

    // 2. Downsample chain: mip[0] → mip[1] → ... → mip[N-1]
    for (let i = 1; i < BLOOM_MIP_LEVELS; i++) {
      const bg = this.ctx.device.createBindGroup({
        layout: this.downsampleBGL,
        entries: [
          { binding: 0, resource: this.bloomMipViews[i - 1] },
          { binding: 1, resource: this.linearSampler },
        ],
      });
      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: this.bloomMipViews[i],
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
          loadOp: 'clear',
          storeOp: 'store',
        }],
      });
      pass.setPipeline(this.downsamplePipeline);
      pass.setBindGroup(0, bg);
      pass.draw(3);
      pass.end();
    }

    // 3. Upsample chain: mip[N-1] → mip[N-2] → ... → mip[0] (additive)
    for (let i = BLOOM_MIP_LEVELS - 1; i > 0; i--) {
      const bg = this.ctx.device.createBindGroup({
        layout: this.upsampleBGL,
        entries: [
          { binding: 0, resource: this.bloomMipViews[i] },
          { binding: 1, resource: this.linearSampler },
          { binding: 2, resource: { buffer: this.bloomUpParamsBuffer } },
        ],
      });
      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: this.bloomMipViews[i - 1],
          loadOp: 'load',
          storeOp: 'store',
        }],
      });
      pass.setPipeline(this.upsamplePipeline);
      pass.setBindGroup(0, bg);
      pass.draw(3);
      pass.end();
    }

    // 4. Tonemap: HDR + bloom → swapchain
    {
      const bg = this.ctx.device.createBindGroup({
        layout: this.tonemapBGL,
        entries: [
          { binding: 0, resource: this.hdrTextureView },
          { binding: 1, resource: this.bloomMipViews[0] },
          { binding: 2, resource: this.linearSampler },
          { binding: 3, resource: { buffer: this.tonemapParamsBuffer } },
        ],
      });
      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: swapChainView,
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
        }],
      });
      pass.setPipeline(this.tonemapPipeline);
      pass.setBindGroup(0, bg);
      pass.draw(3);
      pass.end();
    }
  }

  resize(): void {
    this.createTextures();
  }
}
