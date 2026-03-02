import { WebGPUContext } from './WebGPUContext';
import { checkShaderCompilation } from './shaderCheck';
import shaderCode from '../shaders/cloud_noise_gen.wgsl?raw';

const SHAPE_SIZE = 128;
const DETAIL_SIZE = 32;
const WG_SIZE = 4;

export class CloudNoiseGenerator {
  private ctx: WebGPUContext;
  private pipeline!: GPUComputePipeline;
  private bindGroupLayout!: GPUBindGroupLayout;
  private paramsBuffer!: GPUBuffer;

  shapeTexture!: GPUTexture;
  detailTexture!: GPUTexture;
  shapeView!: GPUTextureView;
  detailView!: GPUTextureView;

  shaderCheck: Promise<void>;

  constructor(ctx: WebGPUContext) {
    this.ctx = ctx;

    const device = ctx.device;

    this.bindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          storageTexture: {
            access: 'write-only',
            format: 'rgba8unorm',
            viewDimension: '3d',
          },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'uniform' },
        },
      ],
    });

    const module = device.createShaderModule({ code: shaderCode });
    this.shaderCheck = checkShaderCompilation('cloud_noise_gen', module);

    this.pipeline = device.createComputePipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [this.bindGroupLayout] }),
      compute: { module, entryPoint: 'main' },
    });

    this.paramsBuffer = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Create 3D textures
    this.shapeTexture = device.createTexture({
      size: [SHAPE_SIZE, SHAPE_SIZE, SHAPE_SIZE],
      format: 'rgba8unorm',
      dimension: '3d',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING,
    });
    this.shapeView = this.shapeTexture.createView();

    this.detailTexture = device.createTexture({
      size: [DETAIL_SIZE, DETAIL_SIZE, DETAIL_SIZE],
      format: 'rgba8unorm',
      dimension: '3d',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING,
    });
    this.detailView = this.detailTexture.createView();
  }

  async generate(): Promise<void> {
    await this.shaderCheck;

    const device = this.ctx.device;
    const encoder = device.createCommandEncoder();

    // Generate shape noise (128^3)
    {
      const params = new Float32Array([SHAPE_SIZE, 1.0, 0.0, 0.0]);
      device.queue.writeBuffer(this.paramsBuffer, 0, params);

      const bg = device.createBindGroup({
        layout: this.bindGroupLayout,
        entries: [
          { binding: 0, resource: this.shapeView },
          { binding: 1, resource: { buffer: this.paramsBuffer } },
        ],
      });

      const pass = encoder.beginComputePass();
      pass.setPipeline(this.pipeline);
      pass.setBindGroup(0, bg);
      pass.dispatchWorkgroups(
        SHAPE_SIZE / WG_SIZE,
        SHAPE_SIZE / WG_SIZE,
        SHAPE_SIZE / WG_SIZE,
      );
      pass.end();
    }

    // Generate detail noise (32^3)
    {
      const params = new Float32Array([DETAIL_SIZE, 1.0, 1.0, 0.0]);
      device.queue.writeBuffer(this.paramsBuffer, 0, params);

      const bg = device.createBindGroup({
        layout: this.bindGroupLayout,
        entries: [
          { binding: 0, resource: this.detailView },
          { binding: 1, resource: { buffer: this.paramsBuffer } },
        ],
      });

      const pass = encoder.beginComputePass();
      pass.setPipeline(this.pipeline);
      pass.setBindGroup(0, bg);
      pass.dispatchWorkgroups(
        DETAIL_SIZE / WG_SIZE,
        DETAIL_SIZE / WG_SIZE,
        DETAIL_SIZE / WG_SIZE,
      );
      pass.end();
    }

    device.queue.submit([encoder.finish()]);
    await device.queue.onSubmittedWorkDone();
    console.log('[CloudNoise] Generated shape (128^3) + detail (32^3) textures');
  }
}
