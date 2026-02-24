import { vec3 } from 'gl-matrix';
import { Config } from '../config/Config';

export class DayNightCycle {
  // Time of day: 0.0 = midnight, 0.25 = 06:00, 0.5 = noon, 0.75 = 18:00
  timeOfDay = 0.0; // Start at midnight
  paused = false;

  sunDir = vec3.fromValues(0, 1, 0);
  moonDir = vec3.fromValues(0, -1, 0);
  sunColor = new Float32Array([1.0, 0.95, 0.85]);
  sunIntensity = 3.0;
  ambientColor = new Float32Array([0.10, 0.13, 0.18]);
  ambientGroundFactor = 0.3;

  // Moon phase system (8-day lunar cycle)
  moonPhase = 0.5;        // 0.0=new moon, 0.5=full moon
  moonBrightness = 1.0;   // derived from moonPhase: 0→1
  private dayCount = 4;   // elapsed days (start at 4 → moonPhase=0.5=full moon)
  private prevTimeOfDay = 0.0;

  update(dt: number): void {
    if (!this.paused) {
      const prev = this.timeOfDay;
      this.timeOfDay += dt / Config.data.environment.dayDurationSeconds;
      this.timeOfDay -= Math.floor(this.timeOfDay);
      // Detect midnight crossing (prev > 0.9, now < 0.1)
      if (prev > 0.9 && this.timeOfDay < 0.1) {
        this.dayCount++;
      }
      this.prevTimeOfDay = this.timeOfDay;
    }
    this.updateMoonPhase();
    this.updateSunPosition();
    this.updateLighting();
  }

  setTime(t: number): void {
    this.dayCount = Math.floor(t);
    this.timeOfDay = t - this.dayCount;
    this.prevTimeOfDay = this.timeOfDay;
    this.paused = true;
    this.updateMoonPhase();
    this.updateSunPosition();
    this.updateLighting();
  }

  private updateMoonPhase(): void {
    this.moonPhase = (this.dayCount % 8) / 8.0;
    // cosine ramp: new moon(0)=0, full moon(0.5)=1
    this.moonBrightness = 0.5 * (1.0 - Math.cos(this.moonPhase * Math.PI * 2.0));
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
    // moonDir is always opposite to sunDir
    vec3.negate(this.moonDir, this.sunDir);
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
      // Night — moonlight as directional light (moonDir computed in updateSunPosition)

      // Cool blue moonlight color, intensity varies with moon phase
      this.sunColor[0] = 0.35;
      this.sunColor[1] = 0.45;
      this.sunColor[2] = 0.70;
      this.sunIntensity = 0.03 + 0.12 * this.moonBrightness; // 0.03 (new moon) ~ 0.15 (full moon)

      // Moonlight ambient — blue-tinted, moon phase dependent
      const mb = this.moonBrightness;
      this.ambientColor[0] = 0.015 + 0.015 * mb;
      this.ambientColor[1] = 0.02 + 0.02 * mb;
      this.ambientColor[2] = 0.05 + 0.03 * mb;
      this.ambientGroundFactor = 0.10 + 0.05 * mb;
    }
  }

  /** True sun height [-1, 1] from timeOfDay, always reflects the real sun position. */
  get trueSunHeight(): number {
    return Math.sin((this.timeOfDay - 0.25) * Math.PI * 2);
  }

  /** lightDir: sunDir during day, moonDir at night (with smooth transition). */
  get lightDir(): Float32Array {
    return this.sunDir[1] > -0.1
      ? this.sunDir as unknown as Float32Array
      : this.moonDir as unknown as Float32Array;
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
