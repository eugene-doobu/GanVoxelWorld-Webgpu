import { vec3 } from 'gl-matrix';
import { WebGPUContext } from './renderer/WebGPUContext';
import { RenderPipeline } from './renderer/RenderPipeline';
import { TextureAtlas } from './renderer/TextureAtlas';
import { FlyCamera } from './camera/FlyCamera';
import { ChunkManager } from './terrain/ChunkManager';
import { HUD } from './ui/HUD';
import { CHUNK_WIDTH, CHUNK_HEIGHT, FOG_START_RATIO, FOG_END_RATIO } from './constants';

async function main() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;

  // WebGPU check
  if (!navigator.gpu) {
    document.getElementById('no-webgpu')!.style.display = 'flex';
    return;
  }

  let ctx: WebGPUContext;
  try {
    ctx = await WebGPUContext.create(canvas);
  } catch (e) {
    document.getElementById('no-webgpu')!.style.display = 'flex';
    console.error(e);
    return;
  }

  // Initial resize
  ctx.resize();

  const pipeline = new RenderPipeline(ctx);
  const atlas = new TextureAtlas(ctx);
  pipeline.setAtlasTexture(atlas.texture);

  let seed = 0;
  const seedInput = document.getElementById('seed-input') as HTMLInputElement;
  const renderDistSlider = document.getElementById('render-distance') as HTMLInputElement;
  const renderDistVal = document.getElementById('render-dist-val')!;
  const regenBtn = document.getElementById('regenerate-btn') as HTMLButtonElement;

  // Camera starts at center of a chunk area at a comfortable height
  const startX = 0 * CHUNK_WIDTH + CHUNK_WIDTH / 2;
  const startZ = 0 * CHUNK_WIDTH + CHUNK_WIDTH / 2;
  const camera = new FlyCamera(canvas, vec3.fromValues(startX, CHUNK_HEIGHT * 0.75, startZ));

  let chunkManager = new ChunkManager(ctx, seed);
  chunkManager.renderDistance = parseInt(renderDistSlider.value);

  const hud = new HUD();

  // UI events
  regenBtn.addEventListener('click', () => {
    seed = parseInt(seedInput.value) || 0;
    chunkManager.regenerate(seed);
  });

  renderDistSlider.addEventListener('input', () => {
    const val = parseInt(renderDistSlider.value);
    renderDistVal.textContent = String(val);
    chunkManager.renderDistance = val;
  });

  // Responsive canvas
  window.addEventListener('resize', () => ctx.resize());

  // Game loop
  let lastTime = performance.now();

  function frame() {
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.1); // cap at 100ms
    lastTime = now;

    ctx.resize();
    camera.update(dt);

    const viewProj = camera.getViewProjection(ctx.aspectRatio);
    const fogDist = chunkManager.renderDistance * CHUNK_WIDTH;

    pipeline.updateCamera(
      viewProj,
      camera.position as Float32Array,
      fogDist * FOG_START_RATIO,
      fogDist * FOG_END_RATIO,
    );

    chunkManager.update(camera.position, viewProj as Float32Array);

    const drawCalls = chunkManager.getDrawCalls();
    pipeline.render(drawCalls);

    hud.update(camera.position, chunkManager.totalChunks, seed, camera.getSpeed());

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

main().catch(console.error);
