export const enum WeatherType { CLEAR = 0, RAIN = 1, SNOW = 2 }

const CLEAR_PROBABILITY = 0.6;
const RAIN_PROBABILITY_THRESHOLD = 0.85;
const RAIN_INTENSITY_MIN = 0.5;
const RAIN_INTENSITY_RANGE = 0.5;
const FOG_BASE_MULTIPLIER = 1.0;
const FOG_INTENSITY_MULTIPLIER = 1.5;

export class WeatherSystem {
  currentWeather: WeatherType = WeatherType.CLEAR;
  intensity = 0;
  targetIntensity = 0;
  transitionSpeed = 0.3;
  weatherTimer = 0;
  weatherDuration = 60;
  autoWeather = false;

  update(dt: number): void {
    if (this.autoWeather) {
      this.weatherTimer += dt;
      if (this.weatherTimer >= this.weatherDuration) {
        this.weatherTimer = 0;
        const r = Math.random();
        if (r < CLEAR_PROBABILITY) {
          this.currentWeather = WeatherType.CLEAR;
          this.targetIntensity = 0;
        } else if (r < RAIN_PROBABILITY_THRESHOLD) {
          this.currentWeather = WeatherType.RAIN;
          this.targetIntensity = RAIN_INTENSITY_MIN + Math.random() * RAIN_INTENSITY_RANGE;
        } else {
          this.currentWeather = WeatherType.SNOW;
          this.targetIntensity = 0.3 + Math.random() * 0.4;
        }
        this.weatherDuration = 30 + Math.random() * 90;
      }
    }
    this.intensity += (this.targetIntensity - this.intensity) * Math.min(1, dt * this.transitionSpeed);
  }

  getFogDensityMultiplier(): number {
    return FOG_BASE_MULTIPLIER + this.intensity * FOG_INTENSITY_MULTIPLIER;
  }

  getAmbientDarkening(): number {
    return 1.0 - this.intensity * 0.3;
  }
}
