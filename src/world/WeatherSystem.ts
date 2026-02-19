export const enum WeatherType { CLEAR = 0, RAIN = 1, SNOW = 2 }

export class WeatherSystem {
  currentWeather: WeatherType = WeatherType.CLEAR;
  intensity = 0;
  targetIntensity = 0;
  transitionSpeed = 0.3;
  weatherTimer = 0;
  weatherDuration = 60;

  update(dt: number): void {
    this.weatherTimer += dt;
    if (this.weatherTimer >= this.weatherDuration) {
      this.weatherTimer = 0;
      const r = Math.random();
      if (r < 0.6) {
        this.currentWeather = WeatherType.CLEAR;
        this.targetIntensity = 0;
      } else if (r < 0.85) {
        this.currentWeather = WeatherType.RAIN;
        this.targetIntensity = 0.5 + Math.random() * 0.5;
      } else {
        this.currentWeather = WeatherType.SNOW;
        this.targetIntensity = 0.3 + Math.random() * 0.4;
      }
      this.weatherDuration = 30 + Math.random() * 90;
    }
    this.intensity += (this.targetIntensity - this.intensity) * Math.min(1, dt * this.transitionSpeed);
  }

  getFogDensityMultiplier(): number {
    return 1.0 + this.intensity * 1.5;
  }

  getAmbientDarkening(): number {
    return 1.0 - this.intensity * 0.3;
  }
}
