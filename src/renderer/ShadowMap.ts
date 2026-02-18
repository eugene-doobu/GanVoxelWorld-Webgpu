import { mat4, vec3 } from 'gl-matrix';
import { SHADOW_CASCADE_COUNT, SHADOW_MAP_SIZE, SHADOW_CASCADE_SPLITS, DEPTH_FORMAT } from '../constants';
import { WebGPUContext } from './WebGPUContext';

import shadowVertShader from '../shaders/shadow.vert.wgsl?raw';

export interface ChunkDrawCall {
  vertexBuffer: GPUBuffer;
  indexBuffer: GPUBuffer;
  indexCount: number;
}

export class ShadowMap {
  private ctx: WebGPUContext;

  shadowTexture!: GPUTexture;
  shadowTextureView!: GPUTextureView;
  cascadeViews: GPUTextureView[] = [];

  pipeline!: GPURenderPipeline;
  bindGroupLayout!: GPUBindGroupLayout;

  uniformBuffer!: GPUBuffer;         // ShadowUniforms: lightViewProj[3] + cascadeSplits = 208 bytes
  cascadeIndexBuffers: GPUBuffer[] = [];

  bindGroups: GPUBindGroup[] = [];

  lightViewProjs: mat4[] = [];

  constructor(ctx: WebGPUContext) {
    this.ctx = ctx;

    for (let i = 0; i < SHADOW_CASCADE_COUNT; i++) {
      this.lightViewProjs.push(mat4.create());
    }

    this.createTextures();
    this.createPipeline();
    this.createBuffers();
    this.createBindGroups();
  }

  private createTextures(): void {
    this.shadowTexture = this.ctx.device.createTexture({
      size: [SHADOW_MAP_SIZE, SHADOW_MAP_SIZE, SHADOW_CASCADE_COUNT],
      format: DEPTH_FORMAT,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });

    this.shadowTextureView = this.shadowTexture.createView({
      dimension: '2d-array',
    });

    this.cascadeViews = [];
    for (let i = 0; i < SHADOW_CASCADE_COUNT; i++) {
      this.cascadeViews.push(this.shadowTexture.createView({
        dimension: '2d',
        baseArrayLayer: i,
        arrayLayerCount: 1,
      }));
    }
  }

  private createPipeline(): void {
    const device = this.ctx.device;

    this.bindGroupLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } },
        { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } },
      ],
    });

    const pipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: [this.bindGroupLayout],
    });

    const vertModule = device.createShaderModule({ code: shadowVertShader });

    this.pipeline = device.createRenderPipeline({
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
      primitive: {
        topology: 'triangle-list',
        cullMode: 'back',
        frontFace: 'ccw',
      },
      depthStencil: {
        format: DEPTH_FORMAT,
        depthWriteEnabled: true,
        depthCompare: 'less',
        depthBias: 2,
        depthBiasSlopeScale: 1.5,
      },
    });
  }

  private createBuffers(): void {
    const device = this.ctx.device;

    // 3 mat4 (192 bytes) + vec4 splits (16 bytes) = 208 bytes
    this.uniformBuffer = device.createBuffer({
      size: 208,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    for (let i = 0; i < SHADOW_CASCADE_COUNT; i++) {
      const buf = device.createBuffer({
        size: 16, // u32 padded to 16 bytes
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
      const data = new Uint32Array([i, 0, 0, 0]);
      device.queue.writeBuffer(buf, 0, data);
      this.cascadeIndexBuffers.push(buf);
    }
  }

  private createBindGroups(): void {
    this.bindGroups = [];
    for (let i = 0; i < SHADOW_CASCADE_COUNT; i++) {
      this.bindGroups.push(this.ctx.device.createBindGroup({
        layout: this.bindGroupLayout,
        entries: [
          { binding: 0, resource: { buffer: this.uniformBuffer } },
          { binding: 1, resource: { buffer: this.cascadeIndexBuffers[i] } },
        ],
      }));
    }
  }

  updateLightMatrices(cameraPos: vec3, cameraViewProj: mat4, sunDir: vec3): void {
    const invViewProj = mat4.create();
    mat4.invert(invViewProj, cameraViewProj);

    for (let i = 0; i < SHADOW_CASCADE_COUNT; i++) {
      const splitDist = SHADOW_CASCADE_SPLITS[i];
      this.computeCascadeMatrix(cameraPos, sunDir, splitDist, i);
    }

    // Upload uniform buffer
    const data = new Float32Array(52); // 3*16 + 4 = 52 floats
    for (let i = 0; i < SHADOW_CASCADE_COUNT; i++) {
      data.set(this.lightViewProjs[i] as Float32Array, i * 16);
    }
    data[48] = SHADOW_CASCADE_SPLITS[0];
    data[49] = SHADOW_CASCADE_SPLITS[1];
    data[50] = SHADOW_CASCADE_SPLITS[2];
    data[51] = 0;

    this.ctx.device.queue.writeBuffer(this.uniformBuffer, 0, data);
  }

  private computeCascadeMatrix(cameraPos: vec3, sunDir: vec3, splitDist: number, index: number): void {
    // Compute orthographic projection centered on camera position, aligned to light direction
    const lightDir = vec3.normalize(vec3.create(), sunDir);
    const lightUp = Math.abs(lightDir[1]) > 0.99
      ? vec3.fromValues(0, 0, 1)
      : vec3.fromValues(0, 1, 0);

    // Light view centered at camera position
    const lightTarget = vec3.create();
    vec3.copy(lightTarget, cameraPos as vec3);
    const lightPosition = vec3.create();
    vec3.scaleAndAdd(lightPosition, lightTarget, lightDir, splitDist * 2);

    const lightView = mat4.create();
    mat4.lookAt(lightView, lightPosition, lightTarget, lightUp);

    // Orthographic bounds based on split distance
    const halfSize = splitDist * 1.2;
    const lightProj = mat4.create();
    mat4.ortho(lightProj, -halfSize, halfSize, -halfSize, halfSize, 0.1, splitDist * 5);

    mat4.multiply(this.lightViewProjs[index], lightProj, lightView);
  }

  renderShadowPass(encoder: GPUCommandEncoder, drawCalls: ChunkDrawCall[]): void {
    for (let c = 0; c < SHADOW_CASCADE_COUNT; c++) {
      const pass = encoder.beginRenderPass({
        colorAttachments: [],
        depthStencilAttachment: {
          view: this.cascadeViews[c],
          depthClearValue: 1.0,
          depthLoadOp: 'clear',
          depthStoreOp: 'store',
        },
      });

      pass.setPipeline(this.pipeline);
      pass.setBindGroup(0, this.bindGroups[c]);

      for (const dc of drawCalls) {
        if (dc.indexCount === 0) continue;
        pass.setVertexBuffer(0, dc.vertexBuffer);
        pass.setIndexBuffer(dc.indexBuffer, 'uint32');
        pass.drawIndexed(dc.indexCount);
      }

      pass.end();
    }
  }
}
