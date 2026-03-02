import { mat4 } from 'gl-matrix';
import { WebGPUContext } from './WebGPUContext';
import { checkShaderCompilation } from './shaderCheck';
import { CLOUD_FORMAT } from '../constants';

import raymarchShader from '../shaders/cloud_raymarch.wgsl?raw';
import temporalShader from '../shaders/cloud_temporal.wgsl?raw';

// CloudUniforms: invViewProj(64) + cameraPos(16) + lightDir(16) + sunColor(16) +
//                cloudParams1(16) + cloudParams2(16) + cloudParams3(16) = 160 bytes
const CLOUD_UNIFORM_SIZE = 160;

// TemporalUniforms: invViewProj(64) + prevViewProj(64) + screenSize(16) + pad(16) = 160 bytes
const TEMPORAL_UNIFORM_SIZE = 160;

export class VolumetricClouds {
  private ctx: WebGPUContext;

  // Half-res textures
  private cloudRaw!: GPUTexture;
  private cloudRawView!: GPUTextureView;
  private cloudHistory!: [GPUTexture, GPUTexture];
  private cloudHistoryViews!: [GPUTextureView, GPUTextureView];
  private historyIndex = 0; // ping-pong

  // Uniforms
  private cloudUniformBuffer: GPUBuffer;
  private temporalUniformBuffer: GPUBuffer;
  private cloudF32 = new Float32Array(CLOUD_UNIFORM_SIZE / 4);
  private temporalF32 = new Float32Array(TEMPORAL_UNIFORM_SIZE / 4);

  // Pipelines
  private raymarchPipeline!: GPURenderPipeline;
  private temporalPipeline!: GPURenderPipeline;
  private raymarchBindGroupLayout!: GPUBindGroupLayout;
  private temporalBindGroupLayout!: GPUBindGroupLayout;

  // Bind groups (rebuilt on resize)
  private raymarchBindGroup: GPUBindGroup | null = null;
  private temporalBindGroups: [GPUBindGroup, GPUBindGroup] | null = null;
  private bindGroupsDirty = true;

  private linearSampler: GPUSampler;

  // Previous frame view-projection
  private prevViewProj = mat4.create();
  private hasPrevViewProj = false;

  private depthView: GPUTextureView | null = null;

  // Shader compilation checks
  readonly shaderChecks: Promise<void>[] = [];

  constructor(ctx: WebGPUContext) {
    this.ctx = ctx;

    const device = ctx.device;

    // Uniform buffers
    this.cloudUniformBuffer = device.createBuffer({
      size: CLOUD_UNIFORM_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.temporalUniformBuffer = device.createBuffer({
      size: TEMPORAL_UNIFORM_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.linearSampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    });

    this.createTextures();
    this.createRaymarchPipeline(device);
    this.createTemporalPipeline(device);
  }

  private getHalfSize(): [number, number] {
    return [
      Math.max(1, Math.ceil(this.ctx.canvas.width / 2)),
      Math.max(1, Math.ceil(this.ctx.canvas.height / 2)),
    ];
  }

  private createTextures(): void {
    const device = this.ctx.device;
    const [w, h] = this.getHalfSize();

    this.cloudRaw = device.createTexture({
      size: [w, h],
      format: CLOUD_FORMAT,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    this.cloudRawView = this.cloudRaw.createView();

    this.cloudHistory = [
      device.createTexture({
        size: [w, h],
        format: CLOUD_FORMAT,
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      }),
      device.createTexture({
        size: [w, h],
        format: CLOUD_FORMAT,
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      }),
    ];
    this.cloudHistoryViews = [
      this.cloudHistory[0].createView(),
      this.cloudHistory[1].createView(),
    ];
  }

  private createRaymarchPipeline(device: GPUDevice): void {
    this.raymarchBindGroupLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'depth' } },
      ],
    });

    const module = device.createShaderModule({ code: raymarchShader });
    this.shaderChecks.push(checkShaderCompilation('cloud_raymarch', module));

    this.raymarchPipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [this.raymarchBindGroupLayout] }),
      vertex: { module, entryPoint: 'vs_main' },
      fragment: {
        module,
        entryPoint: 'fs_main',
        targets: [{ format: CLOUD_FORMAT }],
      },
      primitive: { topology: 'triangle-list' },
    });
  }

  private createTemporalPipeline(device: GPUDevice): void {
    this.temporalBindGroupLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        { binding: 3, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
      ],
    });

    const module = device.createShaderModule({ code: temporalShader });
    this.shaderChecks.push(checkShaderCompilation('cloud_temporal', module));

    this.temporalPipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [this.temporalBindGroupLayout] }),
      vertex: { module, entryPoint: 'vs_main' },
      fragment: {
        module,
        entryPoint: 'fs_main',
        targets: [{ format: CLOUD_FORMAT }],
      },
      primitive: { topology: 'triangle-list' },
    });
  }

  private ensureBindGroups(): void {
    if (!this.bindGroupsDirty || !this.depthView) return;
    this.bindGroupsDirty = false;

    const device = this.ctx.device;

    this.raymarchBindGroup = device.createBindGroup({
      layout: this.raymarchBindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.cloudUniformBuffer } },
        { binding: 1, resource: this.depthView },
      ],
    });

    // Temporal bind groups: [0] writes to history[0], reads history[1]; [1] vice versa
    this.temporalBindGroups = [
      device.createBindGroup({
        layout: this.temporalBindGroupLayout,
        entries: [
          { binding: 0, resource: { buffer: this.temporalUniformBuffer } },
          { binding: 1, resource: this.cloudRawView },
          { binding: 2, resource: this.cloudHistoryViews[1] }, // read previous
          { binding: 3, resource: this.linearSampler },
        ],
      }),
      device.createBindGroup({
        layout: this.temporalBindGroupLayout,
        entries: [
          { binding: 0, resource: { buffer: this.temporalUniformBuffer } },
          { binding: 1, resource: this.cloudRawView },
          { binding: 2, resource: this.cloudHistoryViews[0] }, // read previous
          { binding: 3, resource: this.linearSampler },
        ],
      }),
    ];
  }

  setDepthView(depthView: GPUTextureView): void {
    this.depthView = depthView;
    this.bindGroupsDirty = true;
  }

  /** Returns the resolved cloud texture view for sky composite.
   *  After render(), historyIndex has been swapped to the NEXT frame's write target,
   *  so the just-written result is at (1 - historyIndex). */
  get resolvedCloudView(): GPUTextureView {
    return this.cloudHistoryViews[1 - this.historyIndex];
  }

  /** Index into historyViews for the just-resolved cloud texture (for pre-cached bind groups). */
  get resolvedHistoryIndex(): number {
    return 1 - this.historyIndex;
  }

  /** Pre-cached texture views for both history textures (for external bind group caching). */
  get historyViews(): [GPUTextureView, GPUTextureView] {
    return this.cloudHistoryViews;
  }

  updateUniforms(
    invViewProj: Float32Array,
    cameraPos: Float32Array,
    lightDir: Float32Array,
    trueSunHeight: number,
    sunColor: Float32Array,
    sunIntensity: number,
    time: number,
    coverage: number,
    density: number,
    cloudBase: number,
    cloudHeight: number,
    windSpeed: number,
    detailStrength: number,
    multiScatterFloor: number,
    silverLining: number,
  ): void {
    const f = this.cloudF32;
    f.set(invViewProj, 0);              // invViewProj (mat4)
    f[16] = cameraPos[0];               // cameraPos
    f[17] = cameraPos[1];
    f[18] = cameraPos[2];
    f[19] = time;                        // cameraPos.w = time
    f[20] = lightDir[0];                 // lightDir
    f[21] = lightDir[1];
    f[22] = lightDir[2];
    f[23] = trueSunHeight;               // lightDir.w = trueSunHeight
    f[24] = sunColor[0];                 // sunColor
    f[25] = sunColor[1];
    f[26] = sunColor[2];
    f[27] = sunIntensity;                // sunColor.w = intensity
    f[28] = coverage;                    // cloudParams1
    f[29] = density;
    f[30] = cloudBase;
    f[31] = cloudHeight;
    f[32] = windSpeed;                   // cloudParams2
    f[33] = detailStrength;
    f[34] = multiScatterFloor;
    f[35] = silverLining;
    // cloudParams3: wind direction + phase function params
    f[36] = 0.7;                         // windDirX (default wind direction)
    f[37] = 0.3;                         // windDirZ
    f[38] = 0.8;                         // phaseG1 (forward lobe)
    f[39] = -0.3;                        // phaseG2 (back lobe)

    this.ctx.device.queue.writeBuffer(this.cloudUniformBuffer, 0, f);
  }

  updateTemporalUniforms(invViewProj: Float32Array): void {
    const [w, h] = this.getHalfSize();
    const f = this.temporalF32;
    f.set(invViewProj, 0);                       // current invViewProj
    f.set(this.prevViewProj as Float32Array, 16); // previous viewProj
    f[32] = w;                                    // screenSize.x (halfW)
    f[33] = h;                                    // screenSize.y (halfH)
    f[34] = 1.0 / w;                              // screenSize.z (1/halfW)
    f[35] = 1.0 / h;                              // screenSize.w (1/halfH)
    // pad
    f[36] = 0; f[37] = 0; f[38] = 0; f[39] = 0;

    this.ctx.device.queue.writeBuffer(this.temporalUniformBuffer, 0, f);
  }

  storePrevViewProj(vp: mat4): void {
    mat4.copy(this.prevViewProj, vp);
    this.hasPrevViewProj = true;
  }

  render(encoder: GPUCommandEncoder): void {
    this.ensureBindGroups();
    if (!this.raymarchBindGroup || !this.temporalBindGroups) return;

    // 1. Ray-march pass → cloudRaw
    {
      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: this.cloudRawView,
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
        }],
      });
      pass.setPipeline(this.raymarchPipeline);
      pass.setBindGroup(0, this.raymarchBindGroup);
      pass.draw(3);
      pass.end();
    }

    // 2. Temporal resolve → cloudHistory[current]
    {
      const currentIdx = this.historyIndex;
      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: this.cloudHistoryViews[currentIdx],
          loadOp: 'clear',
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          storeOp: 'store',
        }],
      });
      pass.setPipeline(this.temporalPipeline);
      pass.setBindGroup(0, this.temporalBindGroups[currentIdx]);
      pass.draw(3);
      pass.end();
    }

    // Swap history ping-pong
    this.historyIndex = 1 - this.historyIndex;
  }

  resize(): void {
    // Destroy old textures
    this.cloudRaw.destroy();
    this.cloudHistory[0].destroy();
    this.cloudHistory[1].destroy();

    // Recreate at new half-res
    this.createTextures();
    this.bindGroupsDirty = true;
    this.hasPrevViewProj = false;
  }

  invalidateBindGroups(): void {
    this.bindGroupsDirty = true;
  }
}
