import { vec3 } from 'gl-matrix';

export class HUD {
  private el: HTMLElement;
  private frames = 0;
  private lastFpsTime = 0;
  private fps = 0;

  constructor() {
    this.el = document.getElementById('hud')!;
    this.lastFpsTime = performance.now();
  }

  update(cameraPos: vec3, chunkCount: number, seed: number, speed: number, timeStr?: string): void {
    this.frames++;
    const now = performance.now();
    if (now - this.lastFpsTime >= 1000) {
      this.fps = this.frames;
      this.frames = 0;
      this.lastFpsTime = now;
    }

    this.el.innerHTML =
      `FPS: ${this.fps}<br>` +
      `Pos: ${cameraPos[0].toFixed(1)}, ${cameraPos[1].toFixed(1)}, ${cameraPos[2].toFixed(1)}<br>` +
      `Chunks: ${chunkCount}<br>` +
      `Seed: ${seed}<br>` +
      `Speed: ${speed.toFixed(1)}` +
      (timeStr ? `<br>Time: ${timeStr}` : '');
  }
}
