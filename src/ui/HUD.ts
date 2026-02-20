import { vec3 } from 'gl-matrix';

export class HUD {
  private el: HTMLElement | null;
  private frames = 0;
  private lastFpsTime = 0;
  private fps = 0;
  private lastError = '';
  private drawInfo = '';
  visible = true;

  constructor() {
    this.el = document.getElementById('hud');
    this.lastFpsTime = performance.now();
  }

  toggle(): void {
    this.visible = !this.visible;
    if (this.el) this.el.style.display = this.visible ? '' : 'none';
  }

  setError(msg: string): void {
    this.lastError = msg;
  }

  setDrawInfo(draws: number, waterDraws: number): void {
    this.drawInfo = `Draws: ${draws} Water: ${waterDraws}`;
  }

  update(cameraPos: vec3, chunkCount: number, seed: number, speed: number, timeStr?: string): void {
    this.frames++;
    const now = performance.now();
    if (now - this.lastFpsTime >= 1000) {
      this.fps = this.frames;
      this.frames = 0;
      this.lastFpsTime = now;
    }

    if (!this.el) return;
    this.el.innerHTML =
      `FPS: ${this.fps}<br>` +
      `Pos: ${cameraPos[0].toFixed(1)}, ${cameraPos[1].toFixed(1)}, ${cameraPos[2].toFixed(1)}<br>` +
      `Chunks: ${chunkCount}<br>` +
      `${this.drawInfo}<br>` +
      `Seed: ${seed}<br>` +
      `Speed: ${speed.toFixed(1)}` +
      (timeStr ? `<br>Time: ${timeStr}` : '') +
      (this.lastError ? `<br><span style="color:red">${this.lastError}</span>` : '');
  }
}
