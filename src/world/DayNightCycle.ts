import { vec3 } from 'gl-matrix';
import { DAY_DURATION_SECONDS } from '../constants';

export class DayNightCycle {
  // Time of day: 0.0 = midnight, 0.25 = 06:00, 0.5 = noon, 0.75 = 18:00
  timeOfDay = 0.35; // Start at ~08:24 (morning)
  paused = false;

  sunDir = vec3.fromValues(0, 1, 0);
  sunColor = new Float32Array([1.0, 0.95, 0.85]);
  sunIntensity = 3.0;
  ambientColor = new Float32Array([0.10, 0.13, 0.18]);
  ambientGroundFactor = 0.3;

  update(dt: number): void {
    if (!this.paused) {
      this.timeOfDay += dt / DAY_DURATION_SECONDS;
      this.timeOfDay -= Math.floor(this.timeOfDay);
    }
    this.updateSunPosition();
    this.updateLighting();
  }

  setTime(t: number): void {
    this.timeOfDay = t - Math.floor(t);
    this.paused = true;
    this.updateSunPosition();
    this.updateLighting();
  }

  private updateSunPosition(): void {
    // Sun orbits in a circle: angle = timeOfDay * 2PI
    // noon(0.5) → top, midnight(0.0) → bottom
    const angle = (this.timeOfDay - 0.25) * Math.PI * 2;
    // Sun moves in XY plane (Y=up, X=east-west)
    const sunX = Math.cos(angle) * 0.5;
    const sunY = Math.sin(angle);
    const sunZ = Math.cos(angle) * 0.3;

    vec3.normalize(this.sunDir, vec3.fromValues(sunX, sunY, sunZ));
  }

  private updateLighting(): void {
    const sunHeight = this.sunDir[1]; // -1 to 1

    if (sunHeight > 0.1) {
      // Daytime
      const dayFactor = Math.min((sunHeight - 0.1) / 0.3, 1.0);
      this.sunColor[0] = 1.0;
      this.sunColor[1] = 0.92 + 0.08 * dayFactor;
      this.sunColor[2] = 0.80 + 0.15 * dayFactor;
      this.sunIntensity = 2.2 + 1.3 * dayFactor;
      this.ambientColor[0] = 0.06 + 0.09 * dayFactor;
      this.ambientColor[1] = 0.07 + 0.11 * dayFactor;
      this.ambientColor[2] = 0.10 + 0.12 * dayFactor;
      this.ambientGroundFactor = 0.28 + 0.17 * dayFactor;
    } else if (sunHeight > -0.1) {
      // Sunrise/sunset transition
      const t = (sunHeight + 0.1) / 0.2; // 0 at -0.1, 1 at 0.1
      // Warm sunrise/sunset colors
      this.sunColor[0] = 1.0;
      this.sunColor[1] = 0.5 + 0.42 * t;
      this.sunColor[2] = 0.2 + 0.60 * t;
      this.sunIntensity = 0.5 + 2.0 * t;
      this.ambientColor[0] = 0.05 + 0.03 * t;
      this.ambientColor[1] = 0.04 + 0.06 * t;
      this.ambientColor[2] = 0.06 + 0.09 * t;
      this.ambientGroundFactor = 0.15 + 0.15 * t;
    } else {
      // Night
      this.sunColor[0] = 0.0;
      this.sunColor[1] = 0.0;
      this.sunColor[2] = 0.0;
      this.sunIntensity = 0.0;
      // Moonlight ambient
      this.ambientColor[0] = 0.02;
      this.ambientColor[1] = 0.025;
      this.ambientColor[2] = 0.05;
      this.ambientGroundFactor = 0.1;
    }
  }

  // Returns hour in 0-24 format for HUD display
  getHour(): number {
    return this.timeOfDay * 24;
  }

  getTimeString(): string {
    const totalMinutes = Math.floor(this.timeOfDay * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
}
