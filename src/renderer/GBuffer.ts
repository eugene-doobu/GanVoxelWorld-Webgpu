import {
  GBUFFER_ALBEDO_FORMAT,
  GBUFFER_NORMAL_FORMAT,
  GBUFFER_MATERIAL_FORMAT,
  DEPTH_FORMAT,
} from '../constants';
import { WebGPUContext } from './WebGPUContext';

export class GBuffer {
  albedoTexture!: GPUTexture;
  normalTexture!: GPUTexture;
  materialTexture!: GPUTexture;

  albedoView!: GPUTextureView;
  normalView!: GPUTextureView;
  materialView!: GPUTextureView;
  depthView!: GPUTextureView;

  private ctx: WebGPUContext;

  constructor(ctx: WebGPUContext) {
    this.ctx = ctx;
    this.create();
  }

  create(): void {
    this.destroy();
    const w = this.ctx.canvas.width;
    const h = this.ctx.canvas.height;
    const device = this.ctx.device;

    this.albedoTexture = device.createTexture({
      size: [w, h],
      format: GBUFFER_ALBEDO_FORMAT,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });

    this.normalTexture = device.createTexture({
      size: [w, h],
      format: GBUFFER_NORMAL_FORMAT,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });

    this.materialTexture = device.createTexture({
      size: [w, h],
      format: GBUFFER_MATERIAL_FORMAT,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });

    this.albedoView = this.albedoTexture.createView();
    this.normalView = this.normalTexture.createView();
    this.materialView = this.materialTexture.createView();
    this.depthView = this.ctx.depthTexture.createView();
  }

  destroy(): void {
    if (this.albedoTexture) this.albedoTexture.destroy();
    if (this.normalTexture) this.normalTexture.destroy();
    if (this.materialTexture) this.materialTexture.destroy();
  }

  resize(): void {
    this.create();
  }
}
