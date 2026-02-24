import { DEPTH_FORMAT } from '../constants';

export class WebGPUContext {
  adapter!: GPUAdapter;
  device!: GPUDevice;
  context!: GPUCanvasContext;
  format!: GPUTextureFormat;
  canvas!: HTMLCanvasElement;
  depthTexture!: GPUTexture;

  onResize: (() => void) | null = null;

  private constructor() {}

  static async create(canvas: HTMLCanvasElement): Promise<WebGPUContext> {
    const ctx = new WebGPUContext();
    ctx.canvas = canvas;

    if (!navigator.gpu) {
      throw new Error('WebGPU not supported');
    }

    const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
    if (!adapter) throw new Error('No GPUAdapter found');
    ctx.adapter = adapter;

    ctx.device = await adapter.requestDevice({
      requiredLimits: {
        maxBufferSize: 256 * 1024 * 1024,
        maxStorageBufferBindingSize: 128 * 1024 * 1024,
      },
    });

    ctx.device.lost.then((info) => {
      console.error('WebGPU device lost:', info.message);
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:99999;color:#fff;font-family:sans-serif;flex-direction:column;gap:16px';
      overlay.innerHTML = `<div style="font-size:20px">GPU device was lost</div><button style="padding:8px 24px;font-size:16px;cursor:pointer" onclick="location.reload()">Reload Page</button>`;
      document.body.appendChild(overlay);
    });

    // Catch GPU validation errors
    ctx.device.addEventListener('uncapturederror', (event: Event) => {
      console.error('[WebGPU Error]', (event as GPUUncapturedErrorEvent).error.message);
    });

    const gpuContext = canvas.getContext('webgpu');
    if (!gpuContext) throw new Error('Failed to get WebGPU context');
    ctx.context = gpuContext;

    ctx.format = navigator.gpu.getPreferredCanvasFormat();
    ctx.context.configure({
      device: ctx.device,
      format: ctx.format,
      alphaMode: 'premultiplied',
    });

    ctx.createDepthTexture();
    return ctx;
  }

  createDepthTexture(): void {
    if (this.depthTexture) this.depthTexture.destroy();
    this.depthTexture = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      format: DEPTH_FORMAT,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
  }

  resize(): boolean {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.floor(this.canvas.clientWidth * dpr);
    const h = Math.floor(this.canvas.clientHeight * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.createDepthTexture();
      if (this.onResize) this.onResize();
      return true;
    }
    return false;
  }

  get aspectRatio(): number {
    return this.canvas.width / this.canvas.height;
  }
}
