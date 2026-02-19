import { mat4 } from 'gl-matrix';
import { WebGPUContext } from './WebGPUContext';
import { GBuffer } from './GBuffer';
import { ShadowMap, ChunkDrawCall } from './ShadowMap';
import { SSAO } from './SSAO';
import { PostProcess } from './PostProcess';
import { DayNightCycle } from '../world/DayNightCycle';
import { WeatherSystem, WeatherType } from '../world/WeatherSystem';
import {
  GBUFFER_ALBEDO_FORMAT,
  GBUFFER_NORMAL_FORMAT,
  GBUFFER_MATERIAL_FORMAT,
  DEPTH_FORMAT,
  HDR_FORMAT,
  MAX_POINT_LIGHTS,
} from '../constants';
import type { PointLight } from '../terrain/ChunkManager';

import gbufferVertShader from '../shaders/gbuffer.vert.wgsl?raw';
import gbufferFragShader from '../shaders/gbuffer.frag.wgsl?raw';
import lightingShader from '../shaders/lighting.wgsl?raw';
import skyShader from '../shaders/sky.wgsl?raw';
import waterVertShader from '../shaders/water.vert.wgsl?raw';
import waterFragShader from '../shaders/water.frag.wgsl?raw';
import weatherShader from '../shaders/weather.wgsl?raw';

// SceneUniforms: invViewProj(64) + cameraPos(16) + sunDir(16) + sunColor(16) + ambientColor(16) + fogParams(16) = 144 bytes
const SCENE_UNIFORM_SIZE = 144;
// Camera uniform for G-Buffer pass: viewProj(64) + cameraPos(16) + fogParams(16) + time(4) + pad(12) = 112 bytes
const CAMERA_UNIFORM_SIZE = 112;

// Water vertex uniform: viewProjection(64) + time(4) + pad(12) = 80 bytes
const WATER_VERT_UNIFORM_SIZE = 80;
// Water fragment uniform: cameraPos(12)+time(4) + sunDir(12)+sunIntensity(4) + sunColor(12)+nearPlane(4) + fogColor(12)+farPlane(4) + fogStart(4)+fogEnd(4)+screenSize(8) = 80 bytes
const WATER_FRAG_UNIFORM_SIZE = 80;

// Weather uniform: viewProjection(64) + cameraPos(16) + params(16) = 96 bytes
const WEATHER_UNIFORM_SIZE = 96;
// Weather particle count: 64x64 grid
const WEATHER_PARTICLE_COUNT = 64 * 64;

// PointLight storage: count(4) + pad(12) + 128 * (position(12)+radius(4)+color(12)+intensity(4)) = 16 + 128*32 = 4112 bytes
const POINT_LIGHT_BUFFER_SIZE = 16 + MAX_POINT_LIGHTS * 32;

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
  private gbufferVegetationPipeline!: GPURenderPipeline;
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
  private pointLightBindGroupLayout!: GPUBindGroupLayout;
  private pointLightBuffer!: GPUBuffer;
  private pointLightBindGroup!: GPUBindGroup;
  private pointLightF32 = new Float32Array(POINT_LIGHT_BUFFER_SIZE / 4);
  private sceneBindGroup!: GPUBindGroup;
  private gbufferReadBindGroup!: GPUBindGroup | null;
  private shadowReadBindGroup!: GPUBindGroup | null;

  // Sky pass
  private skyPipeline!: GPURenderPipeline;
  private skyBindGroupLayout!: GPUBindGroupLayout;
  private skyBindGroup!: GPUBindGroup | null;

  // Water forward pass
  private waterPipeline!: GPURenderPipeline;
  private waterBindGroupLayout!: GPUBindGroupLayout;
  private waterVertUniformBuffer!: GPUBuffer;
  private waterFragUniformBuffer!: GPUBuffer;
  private waterBindGroup!: GPUBindGroup;

  // Samplers
  private linearSampler!: GPUSampler;
  private shadowSampler!: GPUSampler;

  // Cached state
  private lastViewProj = mat4.create();
  private lastProjection = mat4.create();
  private lastInvProjection = mat4.create();

  // Pre-allocated uniform buffers (avoid per-frame allocations)
  private camF32 = new Float32Array(CAMERA_UNIFORM_SIZE / 4);
  private sceneF32 = new Float32Array(SCENE_UNIFORM_SIZE / 4);
  private waterVertF32 = new Float32Array(WATER_VERT_UNIFORM_SIZE / 4);
  private waterFragF32 = new Float32Array(WATER_FRAG_UNIFORM_SIZE / 4);
  private invVP = mat4.create();

  // Weather pass
  private weatherPipeline!: GPURenderPipeline;
  private weatherUniformBuffer!: GPUBuffer;
  private weatherBindGroupLayout!: GPUBindGroupLayout;
  private weatherBindGroup!: GPUBindGroup;
  private weatherF32 = new Float32Array(WEATHER_UNIFORM_SIZE / 4);
  private weatherSystem: WeatherSystem | null = null;

  // Cached atlas sampler
  private atlasSampler: GPUSampler | null = null;

  // Dirty flag for bind groups
  private bindGroupsDirty = true;
  private waterBindGroupDirty = true;

  // Time accumulator for water animation
  private waterTime = 0;

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
    this.createWaterPass();
    this.createWeatherPass();

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
        { binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: {} },
      ],
    });

    const pipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: [this.cameraBindGroupLayout, this.textureBindGroupLayout],
    });

    const vertModule = device.createShaderModule({ code: gbufferVertShader });
    const fragModule = device.createShaderModule({ code: gbufferFragShader });

    // Check shader compilation
    vertModule.getCompilationInfo().then(info => {
      for (const msg of info.messages) console.warn(`[gbuffer.vert] ${msg.type}: ${msg.message} (line ${msg.lineNum})`);
    });
    fragModule.getCompilationInfo().then(info => {
      for (const msg of info.messages) console.warn(`[gbuffer.frag] ${msg.type}: ${msg.message} (line ${msg.lineNum})`);
    });

    const gbufferVertexBufferLayout: GPUVertexBufferLayout = {
      arrayStride: 28,
      attributes: [
        { shaderLocation: 0, offset: 0, format: 'float32x3' },
        { shaderLocation: 1, offset: 12, format: 'uint32' },
        { shaderLocation: 2, offset: 16, format: 'float32x2' },
        { shaderLocation: 3, offset: 24, format: 'float32' },
      ],
    };

    const gbufferTargets: GPUColorTargetState[] = [
      { format: GBUFFER_ALBEDO_FORMAT },
      { format: GBUFFER_NORMAL_FORMAT },
      { format: GBUFFER_MATERIAL_FORMAT },
    ];

    this.gbufferPipeline = device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: vertModule,
        entryPoint: 'main',
        buffers: [gbufferVertexBufferLayout],
      },
      fragment: {
        module: fragModule,
        entryPoint: 'main',
        targets: gbufferTargets,
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

    // Vegetation pipeline: same shaders, same layout, but cullMode: 'none'
    this.gbufferVegetationPipeline = device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: vertModule,
        entryPoint: 'main',
        buffers: [gbufferVertexBufferLayout],
      },
      fragment: {
        module: fragModule,
        entryPoint: 'main',
        targets: gbufferTargets,
      },
      primitive: {
        topology: 'triangle-list',
        cullMode: 'none',
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

    // Group 3: Point Lights (storage buffer)
    this.pointLightBindGroupLayout = device.createBindGroupLayout({
      entries: [{
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: { type: 'read-only-storage' },
      }],
    });

    const lightingModule = device.createShaderModule({ code: lightingShader });
    lightingModule.getCompilationInfo().then(info => {
      for (const msg of info.messages) console.warn(`[lighting] ${msg.type}: ${msg.message} (line ${msg.lineNum})`);
    });

    this.lightingPipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({
        bindGroupLayouts: [
          this.sceneBindGroupLayout,
          this.gbufferReadBindGroupLayout,
          this.shadowReadBindGroupLayout,
          this.pointLightBindGroupLayout,
        ],
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

    this.pointLightBuffer = device.createBuffer({
      size: POINT_LIGHT_BUFFER_SIZE,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    this.sceneBindGroup = device.createBindGroup({
      layout: this.sceneBindGroupLayout,
      entries: [{ binding: 0, resource: { buffer: this.sceneUniformBuffer } }],
    });

    this.pointLightBindGroup = device.createBindGroup({
      layout: this.pointLightBindGroupLayout,
      entries: [{ binding: 0, resource: { buffer: this.pointLightBuffer } }],
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
    skyModule.getCompilationInfo().then(info => {
      for (const msg of info.messages) console.warn(`[sky] ${msg.type}: ${msg.message} (line ${msg.lineNum})`);
    });

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

  private createWaterPass(): void {
    const device = this.ctx.device;

    // Bind group: uniforms + scene color copy + depth + sampler (for refraction)
    this.waterBindGroupLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        { binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'depth' } },
        { binding: 4, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
      ],
    });

    const waterVertModule = device.createShaderModule({ code: waterVertShader });
    const waterFragModule = device.createShaderModule({ code: waterFragShader });

    this.waterPipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [this.waterBindGroupLayout] }),
      vertex: {
        module: waterVertModule,
        entryPoint: 'main',
        buffers: [{
          arrayStride: 20, // pos3 + uv2 = 5 floats = 20 bytes
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x3' },
            { shaderLocation: 1, offset: 12, format: 'float32x2' },
          ],
        }],
      },
      fragment: {
        module: waterFragModule,
        entryPoint: 'main',
        targets: [{
          format: HDR_FORMAT,
          blend: {
            color: {
              srcFactor: 'src-alpha',
              dstFactor: 'one-minus-src-alpha',
              operation: 'add',
            },
            alpha: {
              srcFactor: 'one',
              dstFactor: 'one-minus-src-alpha',
              operation: 'add',
            },
          },
        }],
      },
      primitive: {
        topology: 'triangle-list',
        cullMode: 'none', // Render both sides of water
      },
      depthStencil: {
        format: DEPTH_FORMAT,
        depthWriteEnabled: false, // Don't write depth (transparent)
        depthCompare: 'less-equal',
      },
    });

    // Create uniform buffers
    this.waterVertUniformBuffer = device.createBuffer({
      size: WATER_VERT_UNIFORM_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.waterFragUniformBuffer = device.createBuffer({
      size: WATER_FRAG_UNIFORM_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Bind group created lazily in ensureWaterBindGroup() (needs resizable textures)
  }

  private createWeatherPass(): void {
    const device = this.ctx.device;

    this.weatherBindGroupLayout = device.createBindGroupLayout({
      entries: [{
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: { type: 'uniform' },
      }],
    });

    const weatherModule = device.createShaderModule({ code: weatherShader });

    this.weatherPipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [this.weatherBindGroupLayout] }),
      vertex: {
        module: weatherModule,
        entryPoint: 'vs_main',
      },
      fragment: {
        module: weatherModule,
        entryPoint: 'fs_main',
        targets: [{
          format: HDR_FORMAT,
          blend: {
            color: {
              srcFactor: 'src-alpha',
              dstFactor: 'one-minus-src-alpha',
              operation: 'add',
            },
            alpha: {
              srcFactor: 'one',
              dstFactor: 'one-minus-src-alpha',
              operation: 'add',
            },
          },
        }],
      },
      primitive: {
        topology: 'triangle-list',
        cullMode: 'none',
      },
      depthStencil: {
        format: DEPTH_FORMAT,
        depthWriteEnabled: false,
        depthCompare: 'less-equal',
      },
    });

    this.weatherUniformBuffer = device.createBuffer({
      size: WEATHER_UNIFORM_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.weatherBindGroup = device.createBindGroup({
      layout: this.weatherBindGroupLayout,
      entries: [{
        binding: 0,
        resource: { buffer: this.weatherUniformBuffer },
      }],
    });
  }

  setWeatherSystem(weather: WeatherSystem): void {
    this.weatherSystem = weather;
  }

  updateBloomParams(): void {
    this.postProcess.updateBloomParams();
  }

  setAtlasTexture(albedoTexture: GPUTexture, materialTexture: GPUTexture, normalTexture?: GPUTexture): void {
    if (!this.atlasSampler) {
      this.atlasSampler = this.ctx.device.createSampler({
        magFilter: 'nearest',
        minFilter: 'nearest',
        mipmapFilter: 'nearest',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
      });
    }

    // Create a 1x1 flat normal texture as fallback if no normal atlas provided
    const normTex = normalTexture ?? this.createFlatNormalTexture();

    this.textureBindGroup = this.ctx.device.createBindGroup({
      layout: this.textureBindGroupLayout,
      entries: [
        { binding: 0, resource: this.atlasSampler },
        { binding: 1, resource: albedoTexture.createView() },
        { binding: 2, resource: materialTexture.createView() },
        { binding: 3, resource: normTex.createView() },
      ],
    });

    // Pass atlas to shadow map for cutout shadow rendering
    this.shadowMap.setAtlasTexture(albedoTexture, this.atlasSampler);
  }

  private createFlatNormalTexture(): GPUTexture {
    const tex = this.ctx.device.createTexture({
      size: [1, 1],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    const data = new Uint8Array([128, 128, 255, 255]); // flat normal (0,0,1)
    this.ctx.device.queue.writeTexture(
      { texture: tex },
      data.buffer as ArrayBuffer,
      { bytesPerRow: 4 },
      [1, 1],
    );
    return tex;
  }

  updateCamera(
    viewProj: mat4,
    projection: mat4,
    cameraPos: Float32Array,
    fogStart: number,
    fogEnd: number,
    dt: number,
  ): void {
    mat4.copy(this.lastViewProj, viewProj);
    mat4.copy(this.lastProjection, projection);
    mat4.invert(this.lastInvProjection, projection);

    // Camera uniform for G-Buffer pass
    const camF32 = this.camF32;
    camF32.set(viewProj as Float32Array, 0);
    camF32[16] = cameraPos[0];
    camF32[17] = cameraPos[1];
    camF32[18] = cameraPos[2];
    camF32[19] = 0;
    camF32[20] = fogStart;
    camF32[21] = fogEnd;
    camF32[22] = 0;
    camF32[23] = 0;
    camF32[24] = this.waterTime; // time (shared with water animation accumulator)
    camF32[25] = 0;
    camF32[26] = 0;
    camF32[27] = 0;
    this.ctx.device.queue.writeBuffer(this.cameraUniformBuffer, 0, camF32);

    // Scene uniform for lighting + sky
    mat4.invert(this.invVP, viewProj);

    const dnc = this.dayNightCycle;
    const sceneF32 = this.sceneF32;
    sceneF32.set(this.invVP as Float32Array, 0);       // invViewProj
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
    this.ctx.device.queue.writeBuffer(this.sceneUniformBuffer, 0, sceneF32);

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

    // Update volumetric uniforms
    this.postProcess.updateVolumetric(
      this.invVP as Float32Array,
      cameraPos,
      new Float32Array([dnc.sunDir[0], dnc.sunDir[1], dnc.sunDir[2]]),
      new Float32Array([dnc.sunColor[0], dnc.sunColor[1], dnc.sunColor[2]]),
      dnc.sunIntensity,
    );

    // Update SSR uniforms
    this.postProcess.updateSSR(
      viewProj as Float32Array,
      this.invVP as Float32Array,
      cameraPos,
    );

    // Update water uniforms
    this.waterTime += dt;

    // Water vertex uniform: viewProjection(mat4x4) + time(f32) + pad(3xf32)
    const wvF32 = this.waterVertF32;
    wvF32.set(viewProj as Float32Array, 0);
    wvF32[16] = this.waterTime;
    wvF32[17] = 0;
    wvF32[18] = 0;
    wvF32[19] = 0;
    this.ctx.device.queue.writeBuffer(this.waterVertUniformBuffer, 0, wvF32);

    // Water fragment uniform layout (must match WGSL FragUniforms exactly):
    // [0-3]   cameraPos(vec3f) + time(f32) = 16 bytes
    // [4-7]   sunDirection(vec3f) + sunIntensity(f32) = 16 bytes
    // [8-11]  sunColor(vec3f) + nearPlane(f32) = 16 bytes
    // [12-15] fogColor(vec3f) + farPlane(f32) = 16 bytes
    // [16-19] fogStart(f32) + fogEnd(f32) + screenSize(vec2f) = 16 bytes
    // Total: 80 bytes = 20 floats
    const wfF32 = this.waterFragF32;
    wfF32[0] = cameraPos[0];
    wfF32[1] = cameraPos[1];
    wfF32[2] = cameraPos[2];
    wfF32[3] = this.waterTime;
    wfF32[4] = dnc.sunDir[0];
    wfF32[5] = dnc.sunDir[1];
    wfF32[6] = dnc.sunDir[2];
    wfF32[7] = dnc.sunIntensity;
    wfF32[8] = dnc.sunColor[0];
    wfF32[9] = dnc.sunColor[1];
    wfF32[10] = dnc.sunColor[2];
    wfF32[11] = 0.1;   // nearPlane (matches FlyCamera)
    // Compute fog color from time of day (must match lighting.wgsl FOG_COLOR constants exactly)
    const timeOfDay = dnc.timeOfDay;
    const dayFactor = Math.max(0, Math.min(1, 1.0 - Math.abs(timeOfDay - 0.5) * 4.0));
    // FOG_COLOR_DAY = (0.40, 0.50, 0.62), FOG_COLOR_NIGHT = (0.02, 0.02, 0.05)
    wfF32[12] = 0.02 + 0.38 * dayFactor;
    wfF32[13] = 0.02 + 0.48 * dayFactor;
    wfF32[14] = 0.05 + 0.57 * dayFactor;
    wfF32[15] = 1000.0; // farPlane (matches FlyCamera)
    wfF32[16] = fogStart;
    wfF32[17] = fogEnd;
    wfF32[18] = this.ctx.canvas.width;
    wfF32[19] = this.ctx.canvas.height;
    this.ctx.device.queue.writeBuffer(this.waterFragUniformBuffer, 0, wfF32);

    // Update weather uniforms
    if (this.weatherSystem && this.weatherSystem.intensity > 0.001) {
      const wF32 = this.weatherF32;
      wF32.set(viewProj as Float32Array, 0);     // viewProjection mat4
      wF32[16] = cameraPos[0];                    // cameraPos
      wF32[17] = cameraPos[1];
      wF32[18] = cameraPos[2];
      wF32[19] = 0;
      wF32[20] = this.waterTime;                  // time
      wF32[21] = this.weatherSystem.currentWeather as number; // weatherType
      wF32[22] = this.weatherSystem.intensity;     // intensity
      wF32[23] = 0;
      this.ctx.device.queue.writeBuffer(this.weatherUniformBuffer, 0, wF32);
    }
  }

  updatePointLights(lights: PointLight[]): void {
    const f32 = this.pointLightF32;
    // Header: count + 3 padding u32s (we write as float, reinterpreted as u32 in shader)
    const u32View = new Uint32Array(f32.buffer);
    u32View[0] = lights.length;
    u32View[1] = 0;
    u32View[2] = 0;
    u32View[3] = 0;

    // Each light: position(vec3f) + radius(f32) + color(vec3f) + intensity(f32) = 8 floats = 32 bytes
    const offset = 4; // header is 4 floats (16 bytes)
    for (let i = 0; i < lights.length; i++) {
      const base = offset + i * 8;
      const light = lights[i];
      f32[base + 0] = light.position[0];
      f32[base + 1] = light.position[1];
      f32[base + 2] = light.position[2];
      f32[base + 3] = light.radius;
      f32[base + 4] = light.color[0];
      f32[base + 5] = light.color[1];
      f32[base + 6] = light.color[2];
      f32[base + 7] = light.intensity;
    }

    this.ctx.device.queue.writeBuffer(this.pointLightBuffer, 0, f32.buffer, 0, 16 + lights.length * 32);
  }

  render(drawCalls: ChunkDrawCall[], waterDrawCalls?: ChunkDrawCall[], vegDrawCalls?: ChunkDrawCall[]): void {
    const ctx = this.ctx;
    const encoder = ctx.device.createCommandEncoder();

    // 1. Shadow Pass
    this.shadowMap.renderShadowPass(encoder, drawCalls, vegDrawCalls);

    // 2. G-Buffer Pass
    this.renderGBufferPass(encoder, drawCalls, vegDrawCalls);

    // 3. SSAO Pass
    this.ssao.renderSSAO(encoder, this.gBuffer.depthView, this.gBuffer.normalView);

    // Rebuild read bind groups (needed after resize or first frame)
    this.ensureReadBindGroups();
    this.ensureWaterBindGroup();

    // 4. Lighting Pass -> HDR texture
    this.renderLightingPass(encoder);

    // 5. SSR Composite -> HDR texture (alpha blended reflections)
    this.postProcess.renderSSR(encoder);

    // 6. Sky Pass -> HDR texture (only sky pixels)
    this.renderSkyPass(encoder);

    // 7. Water Forward Pass -> HDR texture (alpha blended)
    if (waterDrawCalls && waterDrawCalls.length > 0) {
      // Copy current HDR content so water shader can sample for refraction
      encoder.copyTextureToTexture(
        { texture: this.postProcess.hdrTexture },
        { texture: this.postProcess.hdrCopyTexture },
        [this.ctx.canvas.width, this.ctx.canvas.height],
      );
      this.renderWaterPass(encoder, waterDrawCalls);
    }

    // 8. Volumetric Light Shafts -> HDR texture (additive)
    this.postProcess.renderVolumetric(encoder);

    // 8.5. Weather Particles -> HDR texture (alpha blended)
    if (this.weatherSystem && this.weatherSystem.intensity > 0.001) {
      this.renderWeatherPass(encoder);
    }

    // 9+10. Bloom + Tone Mapping -> swapchain
    const swapChainView = ctx.context.getCurrentTexture().createView();
    this.postProcess.updateTimeOfDay(this.dayNightCycle.timeOfDay);
    this.postProcess.renderBloomAndTonemap(encoder, swapChainView);

    const commandBuffer = encoder.finish();
    ctx.device.queue.submit([commandBuffer]);
  }

  private renderGBufferPass(encoder: GPUCommandEncoder, drawCalls: ChunkDrawCall[], vegDrawCalls?: ChunkDrawCall[]): void {
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

    // Vegetation: switch to vegetation pipeline (cullMode: 'none'), same bind groups
    if (vegDrawCalls && vegDrawCalls.length > 0) {
      pass.setPipeline(this.gbufferVegetationPipeline);
      // Bind groups are shared (same layout), re-set them for the new pipeline
      pass.setBindGroup(0, this.cameraBindGroup);
      if (this.textureBindGroup) {
        pass.setBindGroup(1, this.textureBindGroup);
      }

      for (const dc of vegDrawCalls) {
        if (dc.indexCount === 0) continue;
        pass.setVertexBuffer(0, dc.vertexBuffer);
        pass.setIndexBuffer(dc.indexBuffer, 'uint32');
        pass.drawIndexed(dc.indexCount);
      }
    }

    pass.end();
  }

  private ensureReadBindGroups(): void {
    if (!this.bindGroupsDirty) return;
    this.bindGroupsDirty = false;

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

    // Update volumetric resources (depth + shadow)
    this.postProcess.setVolumetricResources(
      this.gBuffer.depthView,
      this.shadowMap.uniformBuffer,
      this.shadowMap.shadowTextureView,
      this.shadowSampler,
    );

    // Update SSR resources (G-Buffer textures)
    this.postProcess.setSSRResources(
      this.gBuffer.normalView,
      this.gBuffer.materialView,
      this.gBuffer.depthView,
    );
  }

  private ensureWaterBindGroup(): void {
    if (!this.waterBindGroupDirty) return;
    this.waterBindGroupDirty = false;

    this.waterBindGroup = this.ctx.device.createBindGroup({
      layout: this.waterBindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.waterVertUniformBuffer } },
        { binding: 1, resource: { buffer: this.waterFragUniformBuffer } },
        { binding: 2, resource: this.postProcess.hdrCopyTextureView },
        { binding: 3, resource: this.gBuffer.depthView },
        { binding: 4, resource: this.linearSampler },
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
    pass.setBindGroup(3, this.pointLightBindGroup);
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

  private renderWaterPass(encoder: GPUCommandEncoder, waterDrawCalls: ChunkDrawCall[]): void {
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: this.postProcess.hdrTextureView,
        loadOp: 'load',
        storeOp: 'store',
      }],
      depthStencilAttachment: {
        view: this.gBuffer.depthView,
        depthReadOnly: true,
      },
    });

    pass.setPipeline(this.waterPipeline);
    pass.setBindGroup(0, this.waterBindGroup);

    for (const dc of waterDrawCalls) {
      if (dc.indexCount === 0) continue;
      pass.setVertexBuffer(0, dc.vertexBuffer);
      pass.setIndexBuffer(dc.indexBuffer, 'uint32');
      pass.drawIndexed(dc.indexCount);
    }

    pass.end();
  }

  private renderWeatherPass(encoder: GPUCommandEncoder): void {
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: this.postProcess.hdrTextureView,
        loadOp: 'load',
        storeOp: 'store',
      }],
      depthStencilAttachment: {
        view: this.gBuffer.depthView,
        depthReadOnly: true,
      },
    });

    pass.setPipeline(this.weatherPipeline);
    pass.setBindGroup(0, this.weatherBindGroup);
    pass.draw(6, WEATHER_PARTICLE_COUNT);
    pass.end();
  }

  private handleResize(): void {
    this.gBuffer.resize();
    this.ssao.resize();
    this.postProcess.resize();
    // Invalidate bind groups
    this.bindGroupsDirty = true;
    this.waterBindGroupDirty = true;
    this.gbufferReadBindGroup = null;
    this.shadowReadBindGroup = null;
    this.skyBindGroup = null;
  }
}
