import { mat4 } from 'gl-matrix';
import { WebGPUContext } from './WebGPUContext';
import { GBuffer } from './GBuffer';
import { ShadowMap, ChunkDrawCall } from './ShadowMap';
import { SSAO } from './SSAO';
import { PostProcess } from './PostProcess';
import { DayNightCycle } from '../world/DayNightCycle';
import {
  GBUFFER_ALBEDO_FORMAT,
  GBUFFER_NORMAL_FORMAT,
  GBUFFER_MATERIAL_FORMAT,
  DEPTH_FORMAT,
  HDR_FORMAT,
} from '../constants';

import gbufferVertShader from '../shaders/gbuffer.vert.wgsl?raw';
import gbufferFragShader from '../shaders/gbuffer.frag.wgsl?raw';
import lightingShader from '../shaders/lighting.wgsl?raw';
import skyShader from '../shaders/sky.wgsl?raw';

// SceneUniforms: invViewProj(64) + cameraPos(16) + sunDir(16) + sunColor(16) + ambientColor(16) + fogParams(16) = 144 bytes
const SCENE_UNIFORM_SIZE = 144;
// Camera uniform for G-Buffer pass: viewProj(64) + cameraPos(16) + fogParams(16) = 96 bytes
const CAMERA_UNIFORM_SIZE = 96;

export type { ChunkDrawCall } from './ShadowMap';

export class DeferredPipeline {
  private ctx: WebGPUContext;

  // Sub-systems
  private gBuffer: GBuffer;
  private shadowMap: ShadowMap;
  private ssao: SSAO;
  private postProcess: PostProcess;

  // G-Buffer pass
  private gbufferPipeline!: GPURenderPipeline;
  private cameraUniformBuffer!: GPUBuffer;
  private cameraBindGroup!: GPUBindGroup;
  private cameraBindGroupLayout!: GPUBindGroupLayout;
  private textureBindGroupLayout!: GPUBindGroupLayout;
  private textureBindGroup: GPUBindGroup | null = null;

  // Lighting pass
  private lightingPipeline!: GPURenderPipeline;
  private sceneUniformBuffer!: GPUBuffer;
  private sceneBindGroupLayout!: GPUBindGroupLayout;
  private gbufferReadBindGroupLayout!: GPUBindGroupLayout;
  private shadowReadBindGroupLayout!: GPUBindGroupLayout;
  private sceneBindGroup!: GPUBindGroup;
  private gbufferReadBindGroup!: GPUBindGroup | null;
  private shadowReadBindGroup!: GPUBindGroup | null;

  // Sky pass
  private skyPipeline!: GPURenderPipeline;
  private skyBindGroupLayout!: GPUBindGroupLayout;
  private skyBindGroup!: GPUBindGroup | null;

  // Samplers
  private linearSampler!: GPUSampler;
  private shadowSampler!: GPUSampler;

  // Cached state
  private lastViewProj = mat4.create();
  private lastProjection = mat4.create();
  private lastInvProjection = mat4.create();

  constructor(ctx: WebGPUContext, private dayNightCycle: DayNightCycle) {
    this.ctx = ctx;

    this.gBuffer = new GBuffer(ctx);
    this.shadowMap = new ShadowMap(ctx);
    this.ssao = new SSAO(ctx);
    this.postProcess = new PostProcess(ctx);

    this.createSamplers();
    this.createGBufferPass();
    this.createLightingPass();
    this.createSkyPass();

    // Handle resize
    ctx.onResize = () => this.handleResize();
  }

  private createSamplers(): void {
    this.linearSampler = this.ctx.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    });

    this.shadowSampler = this.ctx.device.createSampler({
      compare: 'less',
      magFilter: 'linear',
      minFilter: 'linear',
    });
  }

  private createGBufferPass(): void {
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
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: {} },
      ],
    });

    const pipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: [this.cameraBindGroupLayout, this.textureBindGroupLayout],
    });

    const vertModule = device.createShaderModule({ code: gbufferVertShader });
    const fragModule = device.createShaderModule({ code: gbufferFragShader });

    this.gbufferPipeline = device.createRenderPipeline({
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
        targets: [
          { format: GBUFFER_ALBEDO_FORMAT },
          { format: GBUFFER_NORMAL_FORMAT },
          { format: GBUFFER_MATERIAL_FORMAT },
        ],
      },
      primitive: {
        topology: 'triangle-list',
        cullMode: 'back',
        frontFace: 'ccw',
      },
      depthStencil: {
        format: DEPTH_FORMAT,
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

  private createLightingPass(): void {
    const device = this.ctx.device;

    // Group 0: Scene uniforms
    this.sceneBindGroupLayout = device.createBindGroupLayout({
      entries: [{
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: { type: 'uniform' },
      }],
    });

    // Group 1: G-Buffer textures
    this.gbufferReadBindGroupLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        { binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'depth' } },
      ],
    });

    // Group 2: Shadow + SSAO
    this.shadowReadBindGroupLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'depth', viewDimension: '2d-array' } },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'comparison' } },
        { binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        { binding: 4, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
      ],
    });

    const lightingModule = device.createShaderModule({ code: lightingShader });

    this.lightingPipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({
        bindGroupLayouts: [this.sceneBindGroupLayout, this.gbufferReadBindGroupLayout, this.shadowReadBindGroupLayout],
      }),
      vertex: { module: lightingModule, entryPoint: 'vs_main' },
      fragment: {
        module: lightingModule,
        entryPoint: 'fs_main',
        targets: [{ format: HDR_FORMAT }],
      },
      primitive: { topology: 'triangle-list' },
    });

    this.sceneUniformBuffer = device.createBuffer({
      size: SCENE_UNIFORM_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.sceneBindGroup = device.createBindGroup({
      layout: this.sceneBindGroupLayout,
      entries: [{ binding: 0, resource: { buffer: this.sceneUniformBuffer } }],
    });
  }

  private createSkyPass(): void {
    const device = this.ctx.device;

    this.skyBindGroupLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'depth' } },
      ],
    });

    const skyModule = device.createShaderModule({ code: skyShader });

    this.skyPipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [this.skyBindGroupLayout] }),
      vertex: { module: skyModule, entryPoint: 'vs_main' },
      fragment: {
        module: skyModule,
        entryPoint: 'fs_main',
        targets: [{ format: HDR_FORMAT }],
      },
      primitive: { topology: 'triangle-list' },
    });
  }

  setAtlasTexture(albedoTexture: GPUTexture, materialTexture: GPUTexture): void {
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
        { binding: 1, resource: albedoTexture.createView() },
        { binding: 2, resource: materialTexture.createView() },
      ],
    });
  }

  updateCamera(
    viewProj: mat4,
    projection: mat4,
    cameraPos: Float32Array,
    fogStart: number,
    fogEnd: number,
  ): void {
    mat4.copy(this.lastViewProj, viewProj);
    mat4.copy(this.lastProjection, projection);
    mat4.invert(this.lastInvProjection, projection);

    // Camera uniform for G-Buffer pass
    const camData = new ArrayBuffer(CAMERA_UNIFORM_SIZE);
    const camF32 = new Float32Array(camData);
    camF32.set(viewProj as Float32Array, 0);
    camF32[16] = cameraPos[0];
    camF32[17] = cameraPos[1];
    camF32[18] = cameraPos[2];
    camF32[19] = 0;
    camF32[20] = fogStart;
    camF32[21] = fogEnd;
    this.ctx.device.queue.writeBuffer(this.cameraUniformBuffer, 0, camData);

    // Scene uniform for lighting + sky
    const invVP = mat4.create();
    mat4.invert(invVP, viewProj);

    const dnc = this.dayNightCycle;
    const sceneData = new ArrayBuffer(SCENE_UNIFORM_SIZE);
    const sceneF32 = new Float32Array(sceneData);
    sceneF32.set(invVP as Float32Array, 0);           // invViewProj
    sceneF32[16] = cameraPos[0];                       // cameraPos
    sceneF32[17] = cameraPos[1];
    sceneF32[18] = cameraPos[2];
    sceneF32[19] = 0;
    sceneF32[20] = dnc.sunDir[0];                      // sunDir
    sceneF32[21] = dnc.sunDir[1];
    sceneF32[22] = dnc.sunDir[2];
    sceneF32[23] = 0;
    sceneF32[24] = dnc.sunColor[0];                    // sunColor
    sceneF32[25] = dnc.sunColor[1];
    sceneF32[26] = dnc.sunColor[2];
    sceneF32[27] = dnc.sunIntensity;
    sceneF32[28] = dnc.ambientColor[0];                // ambientColor
    sceneF32[29] = dnc.ambientColor[1];
    sceneF32[30] = dnc.ambientColor[2];
    sceneF32[31] = dnc.ambientGroundFactor;
    sceneF32[32] = fogStart;                           // fogParams
    sceneF32[33] = fogEnd;
    sceneF32[34] = dnc.timeOfDay;
    sceneF32[35] = 0;
    this.ctx.device.queue.writeBuffer(this.sceneUniformBuffer, 0, sceneData);

    // Update shadow matrices
    this.shadowMap.updateLightMatrices(
      cameraPos as unknown as import('gl-matrix').vec3,
      viewProj,
      dnc.sunDir as unknown as import('gl-matrix').vec3,
    );

    // Update SSAO projection
    this.ssao.updateProjection(
      this.lastProjection as Float32Array,
      this.lastInvProjection as Float32Array,
    );
  }

  render(drawCalls: ChunkDrawCall[]): void {
    const ctx = this.ctx;
    const encoder = ctx.device.createCommandEncoder();

    // 1. Shadow Pass
    this.shadowMap.renderShadowPass(encoder, drawCalls);

    // 2. G-Buffer Pass
    this.renderGBufferPass(encoder, drawCalls);

    // 3. SSAO Pass
    this.ssao.renderSSAO(encoder, this.gBuffer.depthView, this.gBuffer.normalView);

    // Rebuild read bind groups (needed after resize or first frame)
    this.ensureReadBindGroups();

    // 4. Lighting Pass → HDR texture
    this.renderLightingPass(encoder);

    // 5. Sky Pass → HDR texture (only sky pixels)
    this.renderSkyPass(encoder);

    // 6+7. Bloom + Tone Mapping → swapchain
    const swapChainView = ctx.context.getCurrentTexture().createView();
    this.postProcess.renderBloomAndTonemap(encoder, swapChainView);

    ctx.device.queue.submit([encoder.finish()]);
  }

  private renderGBufferPass(encoder: GPUCommandEncoder, drawCalls: ChunkDrawCall[]): void {
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.gBuffer.albedoView,
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
          loadOp: 'clear',
          storeOp: 'store',
        },
        {
          view: this.gBuffer.normalView,
          clearValue: { r: 0.5, g: 0.5, b: 0.5, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
        },
        {
          view: this.gBuffer.materialView,
          clearValue: { r: 0.9, g: 0, b: 1, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
      depthStencilAttachment: {
        view: this.gBuffer.depthView,
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
    });

    pass.setPipeline(this.gbufferPipeline);
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
  }

  private ensureReadBindGroups(): void {
    // Recreate bind groups that reference resizable textures
    this.gbufferReadBindGroup = this.ctx.device.createBindGroup({
      layout: this.gbufferReadBindGroupLayout,
      entries: [
        { binding: 0, resource: this.gBuffer.albedoView },
        { binding: 1, resource: this.gBuffer.normalView },
        { binding: 2, resource: this.gBuffer.materialView },
        { binding: 3, resource: this.gBuffer.depthView },
      ],
    });

    this.shadowReadBindGroup = this.ctx.device.createBindGroup({
      layout: this.shadowReadBindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.shadowMap.uniformBuffer } },
        { binding: 1, resource: this.shadowMap.shadowTextureView },
        { binding: 2, resource: this.shadowSampler },
        { binding: 3, resource: this.ssao.blurredTextureView },
        { binding: 4, resource: this.linearSampler },
      ],
    });

    this.skyBindGroup = this.ctx.device.createBindGroup({
      layout: this.skyBindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.sceneUniformBuffer } },
        { binding: 1, resource: this.gBuffer.depthView },
      ],
    });
  }

  private renderLightingPass(encoder: GPUCommandEncoder): void {
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: this.postProcess.hdrTextureView,
        clearValue: { r: 0, g: 0, b: 0, a: 1 },
        loadOp: 'clear',
        storeOp: 'store',
      }],
    });

    pass.setPipeline(this.lightingPipeline);
    pass.setBindGroup(0, this.sceneBindGroup);
    pass.setBindGroup(1, this.gbufferReadBindGroup!);
    pass.setBindGroup(2, this.shadowReadBindGroup!);
    pass.draw(3);
    pass.end();
  }

  private renderSkyPass(encoder: GPUCommandEncoder): void {
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: this.postProcess.hdrTextureView,
        loadOp: 'load',
        storeOp: 'store',
      }],
    });

    pass.setPipeline(this.skyPipeline);
    pass.setBindGroup(0, this.skyBindGroup!);
    pass.draw(3);
    pass.end();
  }

  private handleResize(): void {
    this.gBuffer.resize();
    this.ssao.resize();
    this.postProcess.resize();
    // Invalidate bind groups
    this.gbufferReadBindGroup = null;
    this.shadowReadBindGroup = null;
    this.skyBindGroup = null;
  }
}
