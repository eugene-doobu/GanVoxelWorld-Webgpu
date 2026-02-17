export class WebGPUContext {
  adapter!: GPUAdapter;
  device!: GPUDevice;
  context!: GPUCanvasContext;
  format!: GPUTextureFormat;
  canvas!: HTMLCanvasElement;
  depthTexture!: GPUTexture;

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
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.floor(this.canvas.clientWidth * dpr);
    const h = Math.floor(this.canvas.clientHeight * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.createDepthTexture();
    }
  }

  get aspectRatio(): number {
    return this.canvas.width / this.canvas.height;
  }
}
