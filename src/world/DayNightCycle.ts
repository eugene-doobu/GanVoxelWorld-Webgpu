import { vec3 } from 'gl-matrix';
import { Config } from '../config/Config';

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
      this.timeOfDay += dt / Config.data.environment.dayDurationSeconds;
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
      this.sunIntensity = 0.9 + 0.3 * dayFactor;
      this.ambientColor[0] = 0.06 + 0.09 * dayFactor;
      this.ambientColor[1] = 0.07 + 0.11 * dayFactor;
      this.ambientColor[2] = 0.10 + 0.12 * dayFactor;
      this.ambientGroundFactor = 0.28 + 0.17 * dayFactor;
    } else if (sunHeight > -0.1) {
      // Sunrise/sunset transition
      const t = (sunHeight + 0.1) / 0.2; // 0 at -0.1, 1 at 0.1

      // Sunset/sunrise colors (t=1) blending to moonlight colors (t=0)
      // Sun color: warm orange-white at t=1 → cool blue moonlight at t=0
      this.sunColor[0] = 0.35 + 0.65 * t;  // 0.35 → 1.0
      this.sunColor[1] = 0.45 + 0.47 * t;  // 0.45 → 0.92
      this.sunColor[2] = 0.70 + 0.10 * t;  // 0.70 → 0.80
      // Intensity: sunset level at t=1, moonlight level at t=0
      this.sunIntensity = 0.15 + 0.85 * t;  // 0.15 → 1.0

      // Ambient: blends from night blue-tinted to sunset levels
      this.ambientColor[0] = 0.03 + 0.05 * t;  // 0.03 → 0.08
      this.ambientColor[1] = 0.04 + 0.06 * t;  // 0.04 → 0.10
      this.ambientColor[2] = 0.08 + 0.07 * t;  // 0.08 → 0.15
      this.ambientGroundFactor = 0.15 + 0.15 * t;  // 0.15 → 0.30
    } else {
      // Night — use moonlight as directional light
      // Flip sunDir to moon direction (opposite side of sky)
      vec3.negate(this.sunDir, this.sunDir);

      // Cool blue moonlight color and intensity (~12-15% of sunlight)
      this.sunColor[0] = 0.35;
      this.sunColor[1] = 0.45;
      this.sunColor[2] = 0.70;
      this.sunIntensity = 0.15;

      // Moonlight ambient — blue-tinted, slightly raised
      this.ambientColor[0] = 0.03;
      this.ambientColor[1] = 0.04;
      this.ambientColor[2] = 0.08;
      this.ambientGroundFactor = 0.15;
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
