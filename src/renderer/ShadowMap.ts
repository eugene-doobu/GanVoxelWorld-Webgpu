import { mat4, vec3 } from 'gl-matrix';
import { DEPTH_FORMAT } from '../constants';
import { Config } from '../config/Config';
import { WebGPUContext } from './WebGPUContext';

import shadowVertShader from '../shaders/shadow.vert.wgsl?raw';

export interface ChunkDrawCall {
  vertexBuffer: GPUBuffer;
  indexBuffer: GPUBuffer;
  indexCount: number;
}

// WebGPU-compatible orthographic projection: depth range [0, 1] instead of [-1, 1]
function orthoZO(out: mat4, left: number, right: number, bottom: number, top: number, near: number, far: number): mat4 {
  const lr = 1 / (left - right);
  const bt = 1 / (bottom - top);
  const nf = 1 / (near - far);
  out[0] = -2 * lr;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = -2 * bt;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = nf;
  out[11] = 0;
  out[12] = (left + right) * lr;
  out[13] = (top + bottom) * bt;
  out[14] = near * nf;
  out[15] = 1;
  return out;
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

  // Pre-allocated uniform data (avoid per-frame allocations)
  private uniformData = new Float32Array(52); // 3*16 + 4 = 52 floats

  constructor(ctx: WebGPUContext) {
    this.ctx = ctx;
    const cascadeCount = Config.data.rendering.shadows.cascadeCount;

    for (let i = 0; i < cascadeCount; i++) {
      this.lightViewProjs.push(mat4.create());
    }

    this.createTextures();
    this.createPipeline();
    this.createBuffers();
    this.createBindGroups();
  }

  private createTextures(): void {
    const shadows = Config.data.rendering.shadows;
    this.shadowTexture = this.ctx.device.createTexture({
      size: [shadows.mapSize, shadows.mapSize, shadows.cascadeCount],
      format: DEPTH_FORMAT,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });

    this.shadowTextureView = this.shadowTexture.createView({
      dimension: '2d-array',
    });

    this.cascadeViews = [];
    for (let i = 0; i < shadows.cascadeCount; i++) {
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
          arrayStride: 28,
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x3' },
            { shaderLocation: 1, offset: 12, format: 'uint32' },
            { shaderLocation: 2, offset: 16, format: 'float32x2' },
          ],
        }],
      },
      primitive: {
        topology: 'triangle-list',
        cullMode: 'none',
        frontFace: 'cw',
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
    const cascadeCount = Config.data.rendering.shadows.cascadeCount;

    // 3 mat4 (192 bytes) + vec4 splits (16 bytes) = 208 bytes
    this.uniformBuffer = device.createBuffer({
      size: 208,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    for (let i = 0; i < cascadeCount; i++) {
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
    const cascadeCount = Config.data.rendering.shadows.cascadeCount;
    this.bindGroups = [];
    for (let i = 0; i < cascadeCount; i++) {
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
    const shadows = Config.data.rendering.shadows;
    for (let i = 0; i < shadows.cascadeCount; i++) {
      const splitDist = shadows.cascadeSplits[i];
      this.computeCascadeMatrix(cameraPos, sunDir, splitDist, i);
    }

    // Upload uniform buffer (reuse pre-allocated array)
    const data = this.uniformData;
    for (let i = 0; i < shadows.cascadeCount; i++) {
      data.set(this.lightViewProjs[i] as Float32Array, i * 16);
    }
    data[48] = shadows.cascadeSplits[0];
    data[49] = shadows.cascadeSplits[1];
    data[50] = shadows.cascadeSplits[2];
    data[51] = 0;

    this.ctx.device.queue.writeBuffer(this.uniformBuffer, 0, data);
  }

  private computeCascadeMatrix(cameraPos: vec3, sunDir: vec3, splitDist: number, index: number): void {
    const mapSize = Config.data.rendering.shadows.mapSize;
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

    // WebGPU-compatible ortho projection with [0,1] depth range
    const lightProj = mat4.create();
    orthoZO(lightProj, -halfSize, halfSize, -halfSize, halfSize, 0.1, splitDist * 5);

    // Texel snapping: prevent shadow swimming when camera moves sub-texel amounts
    // Compute preliminary lightViewProj
    const lvp = this.lightViewProjs[index];
    mat4.multiply(lvp, lightProj, lightView);

    // Transform world origin to shadow clip space
    const ox = lvp[0] * 0 + lvp[4] * 0 + lvp[8] * 0 + lvp[12];
    const oy = lvp[1] * 0 + lvp[5] * 0 + lvp[9] * 0 + lvp[13];
    // Scale to texel coordinates
    const halfMapSize = mapSize / 2;
    const txX = ox * halfMapSize;
    const txY = oy * halfMapSize;
    // Compute rounding offset
    const offsetX = (Math.round(txX) - txX) / halfMapSize;
    const offsetY = (Math.round(txY) - txY) / halfMapSize;

    // Apply offset to projection matrix translation
    lightProj[12] += offsetX;
    lightProj[13] += offsetY;

    // Recompute final matrix with snapped projection
    mat4.multiply(lvp, lightProj, lightView);
  }

  renderShadowPass(encoder: GPUCommandEncoder, drawCalls: ChunkDrawCall[]): void {
    const cascadeCount = Config.data.rendering.shadows.cascadeCount;
    for (let c = 0; c < cascadeCount; c++) {
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
