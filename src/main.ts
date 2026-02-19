import { vec3 } from 'gl-matrix';
import { WebGPUContext } from './renderer/WebGPUContext';
import { DeferredPipeline } from './renderer/DeferredPipeline';
import { TextureAtlas } from './renderer/TextureAtlas';
import { FlyCamera } from './camera/FlyCamera';
import { ChunkManager } from './terrain/ChunkManager';
import { DayNightCycle } from './world/DayNightCycle';
import { WeatherSystem } from './world/WeatherSystem';
import { HUD } from './ui/HUD';
import { Config } from './config/Config';
import { CHUNK_WIDTH, CHUNK_HEIGHT } from './constants';

import { InspectorPanel } from './ui/inspector/InspectorPanel';
import { buildTerrainTab } from './ui/inspector/TerrainTab';
import { buildRenderingTab } from './ui/inspector/RenderingTab';
import { buildCameraTab } from './ui/inspector/CameraTab';
import { buildEnvironmentTab } from './ui/inspector/EnvironmentTab';

async function main() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;

  // WebGPU check
  if (!navigator.gpu) {
    const noWebgpu = document.getElementById('no-webgpu');
    if (noWebgpu) noWebgpu.style.display = 'flex';
    return;
  }

  let ctx: WebGPUContext;
  try {
    ctx = await WebGPUContext.create(canvas);
  } catch (e) {
    const noWebgpu = document.getElementById('no-webgpu');
    if (noWebgpu) noWebgpu.style.display = 'flex';
    console.error(e);
    return;
  }

  // Initial resize
  ctx.resize();

  const dayNightCycle = new DayNightCycle();
  const weatherSystem = new WeatherSystem();
  const pipeline = new DeferredPipeline(ctx, dayNightCycle);
  pipeline.setWeatherSystem(weatherSystem);
  const atlas = new TextureAtlas(ctx);
  pipeline.setAtlasTexture(atlas.texture, atlas.materialTexture, atlas.normalTexture);

  let seed = 0;

  // Camera starts at center of a chunk area at a comfortable height
  const startX = 0 * CHUNK_WIDTH + CHUNK_WIDTH / 2;
  const startZ = 0 * CHUNK_WIDTH + CHUNK_WIDTH / 2;
  const camera = new FlyCamera(canvas, vec3.fromValues(startX, CHUNK_HEIGHT * 0.75, startZ));

  let chunkManager = new ChunkManager(ctx, seed);

  const hud = new HUD();

  // ---- Inspector Panel ----
  const inspector = new InspectorPanel();

  const terrainTab = buildTerrainTab((newSeed) => {
    seed = newSeed;
    chunkManager.regenerate(seed);
  });
  inspector.addTab('Terrain', terrainTab);

  const renderingTab = buildRenderingTab();
  inspector.addTab('Rendering', renderingTab);

  const cameraTab = buildCameraTab();
  inspector.addTab('Camera', cameraTab);

  const envTab = buildEnvironmentTab(dayNightCycle, weatherSystem);
  inspector.addTab('Environment', envTab);

  // Reactive config: apply rendering changes immediately
  Config.onChange((path) => {
    if (path === 'rendering.general.renderDistance') {
      chunkManager.renderDistance = Config.data.rendering.general.renderDistance;
    }
    if (path.startsWith('rendering.bloom.')) {
      pipeline.updateBloomParams();
    }
  });

  // Responsive canvas
  window.addEventListener('resize', () => ctx.resize());

  // Game loop
  let lastTime = performance.now();
  let frameCount = 0;

  function frame() {
    frameCount++;
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.1); // cap at 100ms
    lastTime = now;

    ctx.resize();
    camera.update(dt);
    dayNightCycle.update(dt);
    weatherSystem.update(dt);

    // Update environment tab time display
    if ((envTab as any)._updateTime) (envTab as any)._updateTime();

    const viewProj = camera.getViewProjection(ctx.aspectRatio);
    const projection = camera.getProjection();
    const fog = Config.data.rendering.fog;
    const fogDist = chunkManager.renderDistance * CHUNK_WIDTH;
    const fogMul = weatherSystem.getFogDensityMultiplier();

    pipeline.updateCamera(
      viewProj,
      projection,
      camera.position as Float32Array,
      fogDist * fog.startRatio / fogMul,
      fogDist * fog.endRatio / fogMul,
      dt,
    );

    chunkManager.update(camera.position, viewProj as Float32Array);

    // Update point lights from emissive blocks
    const pointLights = chunkManager.getPointLights(camera.position);
    pipeline.updatePointLights(pointLights);

    const drawCalls = chunkManager.getDrawCalls();
    const waterDrawCalls = chunkManager.getWaterDrawCalls();

    hud.setDrawInfo(drawCalls.length, waterDrawCalls.length);

    try {
      pipeline.render(drawCalls, waterDrawCalls);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      hud.setError(`Render: ${msg.slice(0, 120)}`);
      console.error('[Render Error]', e);
    }

    hud.update(camera.position, chunkManager.totalChunks, seed, camera.getSpeed(), dayNightCycle.getTimeString());

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

main().catch(console.error);
