import { HDR_FORMAT, LUMINANCE_FORMAT } from '../constants';
import { Config } from '../config/Config';
import { WebGPUContext } from './WebGPUContext';

import bloomThresholdShader from '../shaders/bloom_threshold.wgsl?raw';
import bloomDownsampleShader from '../shaders/bloom_downsample.wgsl?raw';
import bloomUpsampleShader from '../shaders/bloom_upsample.wgsl?raw';
import tonemapShader from '../shaders/tonemap.wgsl?raw';
import volumetricShader from '../shaders/volumetric.wgsl?raw';
import ssrShader from '../shaders/ssr.wgsl?raw';
import lumExtractShader from '../shaders/lum_extract.wgsl?raw';
import lumDownsampleShader from '../shaders/lum_downsample.wgsl?raw';
import lumAdaptShader from '../shaders/lum_adapt.wgsl?raw';

// AdaptParams: adaptSpeed(4) + keyValue(4) + minExposure(4) + maxExposure(4) + dt(4) + pad(12) = 32 bytes
const ADAPT_PARAMS_SIZE = 32;

// VolumetricUniforms: invViewProj(64) + cameraPos(16) + sunDir(16) + sunColor(16) + params(16) = 128 bytes
const VOLUMETRIC_UNIFORM_SIZE = 128;

// SSRUniforms: viewProjection(64) + invViewProjection(64) + cameraPos(16) + screenSize(16) = 160 bytes
const SSR_UNIFORM_SIZE = 160;

export class PostProcess {
  private ctx: WebGPUContext;

  // HDR render target (lighting output)
  hdrTexture!: GPUTexture;
  hdrTextureView!: GPUTextureView;

  // HDR copy for SSR + water refraction (read scene color while writing to HDR)
  hdrCopyTexture!: GPUTexture;
  hdrCopyTextureView!: GPUTextureView;

  // Bloom mip chain
  private bloomMips: GPUTexture[] = [];
  private bloomMipViews: GPUTextureView[] = [];

  // Pipelines
  private thresholdPipeline!: GPURenderPipeline;
  private downsamplePipeline!: GPURenderPipeline;
  private upsamplePipeline!: GPURenderPipeline;
  private tonemapPipeline!: GPURenderPipeline;
  private volumetricPipeline!: GPURenderPipeline;
  private ssrPipeline!: GPURenderPipeline;

  // Bind group layouts
  private thresholdBGL!: GPUBindGroupLayout;
  private downsampleBGL!: GPUBindGroupLayout;
  private upsampleBGL!: GPUBindGroupLayout;
  private tonemapBGL!: GPUBindGroupLayout;
  private volumetricBGL!: GPUBindGroupLayout;
  private ssrBGL!: GPUBindGroupLayout;

  // Uniform buffers
  private bloomParamsBuffer!: GPUBuffer;
  private bloomUpParamsBuffer!: GPUBuffer;
  private tonemapParamsBuffer!: GPUBuffer;
  private volumetricUniformBuffer!: GPUBuffer;
  private volumetricF32 = new Float32Array(VOLUMETRIC_UNIFORM_SIZE / 4);
  private ssrUniformBuffer!: GPUBuffer;
  private ssrF32 = new Float32Array(SSR_UNIFORM_SIZE / 4);

  private linearSampler!: GPUSampler;

  // Cached bind groups (recreated on resize)
  private thresholdBindGroup: GPUBindGroup | null = null;
  private downsampleBindGroups: GPUBindGroup[] = [];
  private upsampleBindGroups: GPUBindGroup[] = [];
  private tonemapBindGroup: GPUBindGroup | null = null;
  private volumetricBindGroup: GPUBindGroup | null = null;
  private ssrBindGroup: GPUBindGroup | null = null;

  // External textures needed for volumetric (set via setVolumetricResources)
  private depthTextureView: GPUTextureView | null = null;
  private shadowUniformBuffer: GPUBuffer | null = null;
  private shadowTextureView: GPUTextureView | null = null;
  private shadowSampler: GPUSampler | null = null;

  // External textures needed for SSR (set via setSSRResources)
  private ssrNormalView: GPUTextureView | null = null;
  private ssrMaterialView: GPUTextureView | null = null;
  private ssrDepthView: GPUTextureView | null = null;

  // Auto Exposure
  private lumExtractPipeline!: GPURenderPipeline;
  private lumDownsamplePipeline!: GPURenderPipeline;
  private lumAdaptPipeline!: GPURenderPipeline;
  private lumExtractBGL!: GPUBindGroupLayout;
  private lumDownsampleBGL!: GPUBindGroupLayout;
  private lumAdaptBGL!: GPUBindGroupLayout;
  private lumMips: GPUTexture[] = [];
  private lumMipViews: GPUTextureView[] = [];
  private adaptedLumTextures: [GPUTexture, GPUTexture] | null = null;
  private adaptedLumViews: [GPUTextureView, GPUTextureView] | null = null;
  private adaptParamsBuffer!: GPUBuffer;
  private adaptParamsF32 = new Float32Array(ADAPT_PARAMS_SIZE / 4);
  private lumExtractBindGroup: GPUBindGroup | null = null;
  private lumDownsampleBindGroups: GPUBindGroup[] = [];
  private lumAdaptBindGroups: [GPUBindGroup, GPUBindGroup] | null = null;
  private adaptPingPong = 0;

  constructor(ctx: WebGPUContext) {
    this.ctx = ctx;
    this.createSampler();
    this.createUniformBuffers();
    this.createPipelines();
    this.createAutoExposurePipelines();
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
    const bloom = Config.data.rendering.bloom;

    // BloomParams: threshold(4) + knee(4) + pad(8) = 16 bytes
    this.bloomParamsBuffer = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.bloomParamsBuffer, 0, new Float32Array([
      bloom.threshold, 0.5, 0, 0,
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
      bloom.intensity, 0.7, 0, 0,
    ]));

    // Volumetric uniforms
    this.volumetricUniformBuffer = device.createBuffer({
      size: VOLUMETRIC_UNIFORM_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // SSR uniforms
    this.ssrUniformBuffer = device.createBuffer({
      size: SSR_UNIFORM_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Adapt params
    this.adaptParamsBuffer = device.createBuffer({
      size: ADAPT_PARAMS_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
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
        { binding: 4, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
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

    // Volumetric pipeline (additive blend onto HDR)
    this.volumetricBGL = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'depth' } },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
        { binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'depth', viewDimension: '2d-array' } },
        { binding: 4, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'comparison' } },
        { binding: 5, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
      ],
    });

    const volumetricModule = device.createShaderModule({ code: volumetricShader });
    this.volumetricPipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [this.volumetricBGL] }),
      vertex: { module: volumetricModule, entryPoint: 'vs_main' },
      fragment: {
        module: volumetricModule,
        entryPoint: 'fs_main',
        targets: [{
          format: HDR_FORMAT,
          blend: {
            color: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
            alpha: { srcFactor: 'zero', dstFactor: 'one', operation: 'add' },
          },
        }],
      },
      primitive: { topology: 'triangle-list' },
    });

    // SSR pipeline (alpha-blended onto HDR)
    this.ssrBGL = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        { binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'depth' } },
        { binding: 4, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        { binding: 5, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
      ],
    });

    const ssrModule = device.createShaderModule({ code: ssrShader });
    this.ssrPipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [this.ssrBGL] }),
      vertex: { module: ssrModule, entryPoint: 'vs_main' },
      fragment: {
        module: ssrModule,
        entryPoint: 'fs_main',
        targets: [{
          format: HDR_FORMAT,
          blend: {
            color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
            alpha: { srcFactor: 'zero', dstFactor: 'one', operation: 'add' },
          },
        }],
      },
      primitive: { topology: 'triangle-list' },
    });
  }

  private createAutoExposurePipelines(): void {
    const device = this.ctx.device;

    // Lum extract: HDR texture + sampler → r16float quarter-res
    this.lumExtractBGL = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
      ],
    });

    const lumExtractModule = device.createShaderModule({ code: lumExtractShader });
    this.lumExtractPipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [this.lumExtractBGL] }),
      vertex: { module: lumExtractModule, entryPoint: 'vs_main' },
      fragment: {
        module: lumExtractModule,
        entryPoint: 'fs_main',
        targets: [{ format: LUMINANCE_FORMAT }],
      },
      primitive: { topology: 'triangle-list' },
    });

    // Lum downsample: same layout as bloom downsample but r16float target
    this.lumDownsampleBGL = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
      ],
    });

    const lumDownsampleModule = device.createShaderModule({ code: lumDownsampleShader });
    this.lumDownsamplePipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [this.lumDownsampleBGL] }),
      vertex: { module: lumDownsampleModule, entryPoint: 'vs_main' },
      fragment: {
        module: lumDownsampleModule,
        entryPoint: 'fs_main',
        targets: [{ format: LUMINANCE_FORMAT }],
      },
      primitive: { topology: 'triangle-list' },
    });

    // Lum adapt: currentLum + prevAdapted + sampler + params → r16float 1x1
    this.lumAdaptBGL = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
        { binding: 3, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
      ],
    });

    const lumAdaptModule = device.createShaderModule({ code: lumAdaptShader });
    this.lumAdaptPipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [this.lumAdaptBGL] }),
      vertex: { module: lumAdaptModule, entryPoint: 'vs_main' },
      fragment: {
        module: lumAdaptModule,
        entryPoint: 'fs_main',
        targets: [{ format: LUMINANCE_FORMAT }],
      },
      primitive: { topology: 'triangle-list' },
    });
  }

  createTextures(): void {
    const bloomMipLevels = Config.data.rendering.bloom.mipLevels;

    // Destroy old
    if (this.hdrTexture) this.hdrTexture.destroy();
    if (this.hdrCopyTexture) this.hdrCopyTexture.destroy();
    for (const t of this.bloomMips) t.destroy();
    this.bloomMips = [];
    this.bloomMipViews = [];
    for (const t of this.lumMips) t.destroy();
    this.lumMips = [];
    this.lumMipViews = [];
    if (this.adaptedLumTextures) {
      this.adaptedLumTextures[0].destroy();
      this.adaptedLumTextures[1].destroy();
      this.adaptedLumTextures = null;
      this.adaptedLumViews = null;
    }

    const w = this.ctx.canvas.width;
    const h = this.ctx.canvas.height;

    this.hdrTexture = this.ctx.device.createTexture({
      size: [w, h],
      format: HDR_FORMAT,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST,
    });
    this.hdrTextureView = this.hdrTexture.createView();

    this.hdrCopyTexture = this.ctx.device.createTexture({
      size: [w, h],
      format: HDR_FORMAT,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    this.hdrCopyTextureView = this.hdrCopyTexture.createView();

    // Create bloom mip chain
    let mipW = Math.max(1, Math.floor(w / 2));
    let mipH = Math.max(1, Math.floor(h / 2));
    for (let i = 0; i < bloomMipLevels; i++) {
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

    // Create luminance mip chain (quarter-res → 1x1)
    let lumW = Math.max(1, Math.floor(w / 4));
    let lumH = Math.max(1, Math.floor(h / 4));
    while (lumW > 1 || lumH > 1) {
      const tex = this.ctx.device.createTexture({
        size: [lumW, lumH],
        format: LUMINANCE_FORMAT,
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      });
      this.lumMips.push(tex);
      this.lumMipViews.push(tex.createView());
      lumW = Math.max(1, Math.floor(lumW / 2));
      lumH = Math.max(1, Math.floor(lumH / 2));
    }
    // Final 1x1 mip
    const lumFinal = this.ctx.device.createTexture({
      size: [1, 1],
      format: LUMINANCE_FORMAT,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    this.lumMips.push(lumFinal);
    this.lumMipViews.push(lumFinal.createView());

    // Adapted luminance ping-pong (1x1, r16float)
    const adaptTexA = this.ctx.device.createTexture({
      size: [1, 1],
      format: LUMINANCE_FORMAT,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    const adaptTexB = this.ctx.device.createTexture({
      size: [1, 1],
      format: LUMINANCE_FORMAT,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    this.adaptedLumTextures = [adaptTexA, adaptTexB];
    this.adaptedLumViews = [adaptTexA.createView(), adaptTexB.createView()];
    this.adaptPingPong = 0;

    this.rebuildBindGroups();
  }

  private rebuildBindGroups(): void {
    const bloomMipLevels = Config.data.rendering.bloom.mipLevels;

    // Threshold
    this.thresholdBindGroup = this.ctx.device.createBindGroup({
      layout: this.thresholdBGL,
      entries: [
        { binding: 0, resource: this.hdrTextureView },
        { binding: 1, resource: this.linearSampler },
        { binding: 2, resource: { buffer: this.bloomParamsBuffer } },
      ],
    });

    // Downsample chain
    this.downsampleBindGroups = [];
    for (let i = 1; i < bloomMipLevels; i++) {
      this.downsampleBindGroups.push(this.ctx.device.createBindGroup({
        layout: this.downsampleBGL,
        entries: [
          { binding: 0, resource: this.bloomMipViews[i - 1] },
          { binding: 1, resource: this.linearSampler },
        ],
      }));
    }

    // Upsample chain
    this.upsampleBindGroups = [];
    for (let i = bloomMipLevels - 1; i > 0; i--) {
      this.upsampleBindGroups.push(this.ctx.device.createBindGroup({
        layout: this.upsampleBGL,
        entries: [
          { binding: 0, resource: this.bloomMipViews[i] },
          { binding: 1, resource: this.linearSampler },
          { binding: 2, resource: { buffer: this.bloomUpParamsBuffer } },
        ],
      }));
    }

    // Tonemap (uses current adapted luminance texture)
    this.rebuildTonemapBindGroup();

    // Auto exposure bind groups
    this.rebuildAutoExposureBindGroups();
  }

  private rebuildTonemapBindGroup(): void {
    // Use current read-side adapted luminance view
    const adaptedView = this.adaptedLumViews
      ? this.adaptedLumViews[this.adaptPingPong]
      : null;
    if (!adaptedView) return;
    this.tonemapBindGroup = this.ctx.device.createBindGroup({
      layout: this.tonemapBGL,
      entries: [
        { binding: 0, resource: this.hdrTextureView },
        { binding: 1, resource: this.bloomMipViews[0] },
        { binding: 2, resource: this.linearSampler },
        { binding: 3, resource: { buffer: this.tonemapParamsBuffer } },
        { binding: 4, resource: adaptedView },
      ],
    });
  }

  private rebuildAutoExposureBindGroups(): void {
    if (!this.adaptedLumViews || this.lumMipViews.length === 0) return;

    // Lum extract: HDR → lumMips[0]
    this.lumExtractBindGroup = this.ctx.device.createBindGroup({
      layout: this.lumExtractBGL,
      entries: [
        { binding: 0, resource: this.hdrTextureView },
        { binding: 1, resource: this.linearSampler },
      ],
    });

    // Lum downsample chain: lumMips[i-1] → lumMips[i]
    this.lumDownsampleBindGroups = [];
    for (let i = 1; i < this.lumMipViews.length; i++) {
      this.lumDownsampleBindGroups.push(this.ctx.device.createBindGroup({
        layout: this.lumDownsampleBGL,
        entries: [
          { binding: 0, resource: this.lumMipViews[i - 1] },
          { binding: 1, resource: this.linearSampler },
        ],
      }));
    }

    // Lum adapt: 2 bind groups for ping-pong
    // BG[0]: reads adapted[0], writes adapted[1]
    // BG[1]: reads adapted[1], writes adapted[0]
    const lastLumView = this.lumMipViews[this.lumMipViews.length - 1];
    this.lumAdaptBindGroups = [
      this.ctx.device.createBindGroup({
        layout: this.lumAdaptBGL,
        entries: [
          { binding: 0, resource: lastLumView },
          { binding: 1, resource: this.adaptedLumViews[0] },
          { binding: 2, resource: this.linearSampler },
          { binding: 3, resource: { buffer: this.adaptParamsBuffer } },
        ],
      }),
      this.ctx.device.createBindGroup({
        layout: this.lumAdaptBGL,
        entries: [
          { binding: 0, resource: lastLumView },
          { binding: 1, resource: this.adaptedLumViews[1] },
          { binding: 2, resource: this.linearSampler },
          { binding: 3, resource: { buffer: this.adaptParamsBuffer } },
        ],
      }),
    ];
  }

  setVolumetricResources(
    depthView: GPUTextureView,
    shadowUniformBuf: GPUBuffer,
    shadowTexView: GPUTextureView,
    shadowSamp: GPUSampler,
  ): void {
    this.depthTextureView = depthView;
    this.shadowUniformBuffer = shadowUniformBuf;
    this.shadowTextureView = shadowTexView;
    this.shadowSampler = shadowSamp;
    this.rebuildVolumetricBindGroup();
  }

  private rebuildVolumetricBindGroup(): void {
    if (!this.depthTextureView || !this.shadowUniformBuffer || !this.shadowTextureView || !this.shadowSampler) return;
    this.volumetricBindGroup = this.ctx.device.createBindGroup({
      layout: this.volumetricBGL,
      entries: [
        { binding: 0, resource: { buffer: this.volumetricUniformBuffer } },
        { binding: 1, resource: this.depthTextureView },
        { binding: 2, resource: { buffer: this.shadowUniformBuffer } },
        { binding: 3, resource: this.shadowTextureView },
        { binding: 4, resource: this.shadowSampler },
        { binding: 5, resource: this.linearSampler },
      ],
    });
  }

  updateVolumetric(
    invViewProj: Float32Array,
    cameraPos: Float32Array,
    sunDir: Float32Array,
    sunColor: Float32Array,
    sunIntensity: number,
  ): void {
    const f = this.volumetricF32;
    f.set(invViewProj, 0);                     // invViewProj mat4
    f[16] = cameraPos[0];                      // cameraPos
    f[17] = cameraPos[1];
    f[18] = cameraPos[2];
    f[19] = 0;
    f[20] = sunDir[0];                         // sunDir
    f[21] = sunDir[1];
    f[22] = sunDir[2];
    f[23] = 0;
    f[24] = sunColor[0];                       // sunColor
    f[25] = sunColor[1];
    f[26] = sunColor[2];
    f[27] = sunIntensity;
    f[28] = 0.04;                              // density (was 0.35 — caused extreme washout)
    f[29] = 0.75;                              // scattering anisotropy (g) — tighter forward lobe
    f[30] = 120.0;                             // max ray march distance
    f[31] = 16.0;                              // num steps
    this.ctx.device.queue.writeBuffer(this.volumetricUniformBuffer, 0, f);
  }

  renderVolumetric(encoder: GPUCommandEncoder): void {
    if (!this.volumetricBindGroup) return;

    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: this.hdrTextureView,
        loadOp: 'load',
        storeOp: 'store',
      }],
    });
    pass.setPipeline(this.volumetricPipeline);
    pass.setBindGroup(0, this.volumetricBindGroup);
    pass.draw(3);
    pass.end();
  }

  setSSRResources(
    normalView: GPUTextureView,
    materialView: GPUTextureView,
    depthView: GPUTextureView,
  ): void {
    this.ssrNormalView = normalView;
    this.ssrMaterialView = materialView;
    this.ssrDepthView = depthView;
    this.rebuildSSRBindGroup();
  }

  private rebuildSSRBindGroup(): void {
    if (!this.ssrNormalView || !this.ssrMaterialView || !this.ssrDepthView) return;
    this.ssrBindGroup = this.ctx.device.createBindGroup({
      layout: this.ssrBGL,
      entries: [
        { binding: 0, resource: { buffer: this.ssrUniformBuffer } },
        { binding: 1, resource: this.ssrNormalView },
        { binding: 2, resource: this.ssrMaterialView },
        { binding: 3, resource: this.ssrDepthView },
        { binding: 4, resource: this.hdrCopyTextureView },
        { binding: 5, resource: this.linearSampler },
      ],
    });
  }

  updateSSR(
    viewProjection: Float32Array,
    invViewProjection: Float32Array,
    cameraPos: Float32Array,
  ): void {
    const f = this.ssrF32;
    f.set(viewProjection, 0);         // viewProjection mat4 (offset 0)
    f.set(invViewProjection, 16);     // invViewProjection mat4 (offset 16)
    f[32] = cameraPos[0];             // cameraPos
    f[33] = cameraPos[1];
    f[34] = cameraPos[2];
    f[35] = 0;
    f[36] = this.ctx.canvas.width;    // screenSize
    f[37] = this.ctx.canvas.height;
    f[38] = 0;
    f[39] = 0;
    this.ctx.device.queue.writeBuffer(this.ssrUniformBuffer, 0, f);
  }

  renderSSR(encoder: GPUCommandEncoder): void {
    if (!this.ssrBindGroup) return;

    // Copy current HDR content so SSR can read from copy while writing to HDR
    const w = this.ctx.canvas.width;
    const h = this.ctx.canvas.height;
    encoder.copyTextureToTexture(
      { texture: this.hdrTexture },
      { texture: this.hdrCopyTexture },
      [w, h],
    );

    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: this.hdrTextureView,
        loadOp: 'load',
        storeOp: 'store',
      }],
    });
    pass.setPipeline(this.ssrPipeline);
    pass.setBindGroup(0, this.ssrBindGroup);
    pass.draw(3);
    pass.end();
  }

  updateTimeOfDay(timeOfDay: number): void {
    this.ctx.device.queue.writeBuffer(this.tonemapParamsBuffer, 8, new Float32Array([timeOfDay]));
  }

  updateBloomParams(): void {
    const bloom = Config.data.rendering.bloom;
    const ae = Config.data.rendering.autoExposure;
    this.ctx.device.queue.writeBuffer(this.bloomParamsBuffer, 0, new Float32Array([
      bloom.threshold, 0.5, 0, 0,
    ]));
    this.ctx.device.queue.writeBuffer(this.tonemapParamsBuffer, 0, new Float32Array([
      bloom.intensity, 0.7, 0, ae.enabled ? 1.0 : 0.0,
    ]));
  }

  renderAutoExposure(encoder: GPUCommandEncoder, dt: number): void {
    if (!Config.data.rendering.autoExposure.enabled) return;
    if (!this.lumExtractBindGroup || !this.lumAdaptBindGroups || !this.adaptedLumViews) return;

    const ae = Config.data.rendering.autoExposure;

    // Update adapt params
    const f = this.adaptParamsF32;
    f[0] = ae.adaptSpeed;
    f[1] = ae.keyValue;
    f[2] = ae.minExposure;
    f[3] = ae.maxExposure;
    f[4] = dt;
    this.ctx.device.queue.writeBuffer(this.adaptParamsBuffer, 0, f);

    // 1. Extract: HDR → lumMips[0] (quarter-res log luminance)
    {
      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: this.lumMipViews[0],
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
          loadOp: 'clear',
          storeOp: 'store',
        }],
      });
      pass.setPipeline(this.lumExtractPipeline);
      pass.setBindGroup(0, this.lumExtractBindGroup);
      pass.draw(3);
      pass.end();
    }

    // 2. Downsample chain → 1x1
    for (let i = 1; i < this.lumMipViews.length; i++) {
      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: this.lumMipViews[i],
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
          loadOp: 'clear',
          storeOp: 'store',
        }],
      });
      pass.setPipeline(this.lumDownsamplePipeline);
      pass.setBindGroup(0, this.lumDownsampleBindGroups[i - 1]);
      pass.draw(3);
      pass.end();
    }

    // 3. Adapt: current 1x1 + prevAdapted → currAdapted
    // Ping-pong: read from adaptPingPong, write to 1-adaptPingPong
    const readIdx = this.adaptPingPong;
    const writeIdx = 1 - this.adaptPingPong;
    {
      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: this.adaptedLumViews[writeIdx],
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
          loadOp: 'clear',
          storeOp: 'store',
        }],
      });
      pass.setPipeline(this.lumAdaptPipeline);
      pass.setBindGroup(0, this.lumAdaptBindGroups[readIdx]);
      pass.draw(3);
      pass.end();
    }

    // Swap ping-pong: next frame reads what we just wrote
    this.adaptPingPong = writeIdx;

    // Rebuild tonemap bind group to point at the newly written adapted texture
    this.rebuildTonemapBindGroup();
  }

  renderBloomAndTonemap(encoder: GPUCommandEncoder, swapChainView: GPUTextureView): void {
    const bloomMipLevels = Config.data.rendering.bloom.mipLevels;

    // 1. Threshold extraction → bloomMips[0]
    {
      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: this.bloomMipViews[0],
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
          loadOp: 'clear',
          storeOp: 'store',
        }],
      });
      pass.setPipeline(this.thresholdPipeline);
      pass.setBindGroup(0, this.thresholdBindGroup!);
      pass.draw(3);
      pass.end();
    }

    // 2. Downsample chain: mip[0] → mip[1] → ... → mip[N-1]
    for (let i = 1; i < bloomMipLevels; i++) {
      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: this.bloomMipViews[i],
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
          loadOp: 'clear',
          storeOp: 'store',
        }],
      });
      pass.setPipeline(this.downsamplePipeline);
      pass.setBindGroup(0, this.downsampleBindGroups[i - 1]);
      pass.draw(3);
      pass.end();
    }

    // 3. Upsample chain: mip[N-1] → mip[N-2] → ... → mip[0] (additive)
    for (let i = bloomMipLevels - 1; i > 0; i--) {
      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: this.bloomMipViews[i - 1],
          loadOp: 'load',
          storeOp: 'store',
        }],
      });
      pass.setPipeline(this.upsamplePipeline);
      pass.setBindGroup(0, this.upsampleBindGroups[bloomMipLevels - 1 - i]);
      pass.draw(3);
      pass.end();
    }

    // 4. Tonemap: HDR + bloom → swapchain
    {
      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: swapChainView,
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
        }],
      });
      pass.setPipeline(this.tonemapPipeline);
      pass.setBindGroup(0, this.tonemapBindGroup!);
      pass.draw(3);
      pass.end();
    }
  }

  resize(): void {
    this.createTextures();
    this.rebuildSSRBindGroup();
  }
}
