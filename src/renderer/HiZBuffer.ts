// HiZBuffer: Hierarchical-Z buffer for occlusion culling.
// Generates a mip chain from the depth buffer where each mip stores the maximum depth
// of its 2×2 source texels. This enables conservative occlusion testing:
// if a chunk's projected depth is greater than the Hi-Z value, it's fully occluded.

import { WebGPUContext } from './WebGPUContext';
import { checkShaderCompilation } from './shaderCheck';
import hizDownsampleShader from '../shaders/hiz_downsample.wgsl?raw';

export class HiZBuffer {
  private ctx: WebGPUContext;

  // Hi-Z texture with mip chain
  private hizTexture: GPUTexture | null = null;
  private mipViews: GPUTextureView[] = [];
  private mipCount = 0;
  private width = 0;
  private height = 0;

  // Compute pipeline for mip generation
  private pipeline: GPUComputePipeline;
  private bindGroupLayout: GPUBindGroupLayout;
  private paramsBuffer: GPUBuffer;

  // Per-mip bind groups (created on resize)
  private bindGroups: GPUBindGroup[] = [];

  // Depth-to-R32Float copy pipeline (depth texture -> storage-compatible texture)
  private depthCopyPipeline: GPURenderPipeline;
  private depthCopyBindGroupLayout: GPUBindGroupLayout;
  private depthCopyBindGroup: GPUBindGroup | null = null;

  shaderChecks: Promise<void>[] = [];

  constructor(ctx: WebGPUContext) {
    this.ctx = ctx;

    // Params uniform
    this.paramsBuffer = ctx.device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Bind group layout: src texture (read), dst texture (write), params
    this.bindGroupLayout = ctx.device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, texture: { sampleType: 'unfilterable-float' } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, storageTexture: { access: 'write-only', format: 'r32float' } },
        { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
      ],
    });

    const module = ctx.device.createShaderModule({ code: hizDownsampleShader });
    this.shaderChecks.push(checkShaderCompilation('hiz_downsample', module));

    this.pipeline = ctx.device.createComputePipeline({
      layout: ctx.device.createPipelineLayout({ bindGroupLayouts: [this.bindGroupLayout] }),
      compute: { module, entryPoint: 'main' },
    });

    // Depth copy: fullscreen pass to convert depth32float -> r32float
    this.depthCopyBindGroupLayout = ctx.device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'depth' } },
      ],
    });

    const depthCopyShader = ctx.device.createShaderModule({
      code: `
        @group(0) @binding(0) var depthTex: texture_depth_2d;

        struct VertexOutput {
          @builtin(position) pos: vec4<f32>,
          @location(0) uv: vec2<f32>,
        };

        @vertex fn vs_main(@builtin(vertex_index) vid: u32) -> VertexOutput {
          var out: VertexOutput;
          let x = f32((vid & 1u) * 2u) - 1.0;
          let y = f32(((vid >> 1u) & 1u) * 2u) - 1.0;
          out.pos = vec4<f32>(x, y, 0.0, 1.0);
          out.uv = vec2<f32>(x * 0.5 + 0.5, 0.5 - y * 0.5);
          return out;
        }

        @fragment fn fs_main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
          let texSize = vec2<f32>(textureDimensions(depthTex));
          let coord = vec2<i32>(uv * texSize);
          let depth = textureLoad(depthTex, coord, 0);
          return vec4<f32>(depth, 0.0, 0.0, 1.0);
        }
      `,
    });

    this.depthCopyPipeline = ctx.device.createRenderPipeline({
      layout: ctx.device.createPipelineLayout({ bindGroupLayouts: [this.depthCopyBindGroupLayout] }),
      vertex: { module: depthCopyShader, entryPoint: 'vs_main' },
      fragment: {
        module: depthCopyShader,
        entryPoint: 'fs_main',
        targets: [{ format: 'r32float' }],
      },
      primitive: { topology: 'triangle-strip' },
    });
  }

  resize(w: number, h: number): void {
    if (w === this.width && h === this.height) return;
    this.width = w;
    this.height = h;

    this.hizTexture?.destroy();
    this.mipViews = [];
    this.bindGroups = [];

    // Calculate mip count
    this.mipCount = Math.floor(Math.log2(Math.max(w, h))) + 1;

    this.hizTexture = this.ctx.device.createTexture({
      size: [w, h],
      format: 'r32float',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
      mipLevelCount: this.mipCount,
    });

    // Create per-mip views
    for (let mip = 0; mip < this.mipCount; mip++) {
      this.mipViews.push(this.hizTexture.createView({
        baseMipLevel: mip,
        mipLevelCount: 1,
      }));
    }

    // Create bind groups for mip chain generation (mip[i] reads from mip[i-1], writes to mip[i])
    for (let mip = 1; mip < this.mipCount; mip++) {
      this.bindGroups.push(this.ctx.device.createBindGroup({
        layout: this.bindGroupLayout,
        entries: [
          { binding: 0, resource: this.mipViews[mip - 1] },
          { binding: 1, resource: this.mipViews[mip] },
          { binding: 2, resource: { buffer: this.paramsBuffer } },
        ],
      }));
    }
  }

  // Set depth copy bind group when depth texture changes
  setDepthView(depthView: GPUTextureView): void {
    this.depthCopyBindGroup = this.ctx.device.createBindGroup({
      layout: this.depthCopyBindGroupLayout,
      entries: [
        { binding: 0, resource: depthView },
      ],
    });
  }

  // Generate Hi-Z mip chain from current depth buffer
  generate(encoder: GPUCommandEncoder): void {
    if (!this.hizTexture || !this.depthCopyBindGroup) return;

    // Step 1: Copy depth -> mip 0 (r32float)
    const copyPass = encoder.beginRenderPass({
      colorAttachments: [{
        view: this.mipViews[0],
        loadOp: 'clear',
        storeOp: 'store',
        clearValue: { r: 1, g: 0, b: 0, a: 1 },
      }],
    });
    copyPass.setPipeline(this.depthCopyPipeline);
    copyPass.setBindGroup(0, this.depthCopyBindGroup);
    copyPass.draw(4);
    copyPass.end();

    // Step 2: Generate mip chain
    for (let mip = 1; mip < this.mipCount; mip++) {
      const dstW = Math.max(1, this.width >> mip);
      const dstH = Math.max(1, this.height >> mip);

      const params = new Uint32Array([dstW, dstH, 0, 0]);
      this.ctx.device.queue.writeBuffer(this.paramsBuffer, 0, params);

      const pass = encoder.beginComputePass();
      pass.setPipeline(this.pipeline);
      pass.setBindGroup(0, this.bindGroups[mip - 1]);
      pass.dispatchWorkgroups(Math.ceil(dstW / 8), Math.ceil(dstH / 8));
      pass.end();
    }
  }

  get textureView(): GPUTextureView | null {
    return this.hizTexture?.createView() ?? null;
  }

  destroy(): void {
    this.hizTexture?.destroy();
    this.paramsBuffer.destroy();
  }
}
