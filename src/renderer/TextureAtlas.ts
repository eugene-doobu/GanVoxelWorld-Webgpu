import { TILE_SIZE, ATLAS_TILES, ATLAS_PIXEL_SIZE } from '../constants';
import { getBlockColor, ALL_BLOCK_TYPES } from '../terrain/BlockTypes';
import { WebGPUContext } from './WebGPUContext';

export class TextureAtlas {
  private gpuTexture: GPUTexture;

  constructor(ctx: WebGPUContext) {
    const pixels = this.generateAtlasPixels();
    this.gpuTexture = this.uploadTexture(ctx, pixels);
  }

  get texture(): GPUTexture {
    return this.gpuTexture;
  }

  private generateAtlasPixels(): Uint8Array {
    const size = ATLAS_PIXEL_SIZE * ATLAS_PIXEL_SIZE * 4;
    const pixels = new Uint8Array(size);

    for (const blockType of ALL_BLOCK_TYPES) {
      const index = blockType as number;
      if (index >= ATLAS_TILES * ATLAS_TILES) continue;

      const tileX = index % ATLAS_TILES;
      const tileY = Math.floor(index / ATLAS_TILES);
      const [r, g, b, a] = getBlockColor(blockType);

      const startX = tileX * TILE_SIZE;
      const startY = tileY * TILE_SIZE;

      for (let y = 0; y < TILE_SIZE; y++) {
        for (let x = 0; x < TILE_SIZE; x++) {
          const pixelIndex = ((startY + y) * ATLAS_PIXEL_SIZE + (startX + x)) * 4;
          pixels[pixelIndex + 0] = r;
          pixels[pixelIndex + 1] = g;
          pixels[pixelIndex + 2] = b;
          pixels[pixelIndex + 3] = a;
        }
      }
    }

    return pixels;
  }

  private uploadTexture(ctx: WebGPUContext, pixels: Uint8Array): GPUTexture {
    const texture = ctx.device.createTexture({
      size: [ATLAS_PIXEL_SIZE, ATLAS_PIXEL_SIZE],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });

    ctx.device.queue.writeTexture(
      { texture },
      pixels.buffer as ArrayBuffer,
      { bytesPerRow: ATLAS_PIXEL_SIZE * 4, rowsPerImage: ATLAS_PIXEL_SIZE },
      [ATLAS_PIXEL_SIZE, ATLAS_PIXEL_SIZE],
    );

    return texture;
  }
}
