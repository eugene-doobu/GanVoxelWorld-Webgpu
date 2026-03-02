import { InspectorTab } from './InspectorTab';
import { createCustomSlider, createCustomToggle, createCustomDropdown } from './InspectorField';
import { DayNightCycle } from '../../world/DayNightCycle';
import { WeatherSystem, WeatherType } from '../../world/WeatherSystem';

export class EnvironmentTab extends InspectorTab {
  /** @internal Set by buildEnvironmentTab */
  _updateTimeFn: (() => void) | null = null;

  updateTime(): void {
    if (this._updateTimeFn) this._updateTimeFn();
  }
}

export function buildEnvironmentTab(dayNightCycle: DayNightCycle, weatherSystem: WeatherSystem): EnvironmentTab {
  const tab = new EnvironmentTab();

  // Day/Night section
  const dayNight = tab.addSection('Day / Night');

  // Time slider (direct control, not via Config)
  const time = createCustomSlider('Time', Math.round(dayNightCycle.timeOfDay * 100), 0, 100, 1, (v) => {
    dayNightCycle.setTime(v / 100);
    time.display.textContent = dayNightCycle.getTimeString();
  });
  time.slider.addEventListener('dblclick', () => { dayNightCycle.paused = false; });
  dayNight.addElement(time.row);

  dayNight.addField({ type: 'slider', label: 'Day Duration', configPath: 'environment.dayDurationSeconds', min: 60, max: 3600, step: 60 });

  // Sky section
  const sky = tab.addSection('Sky');
  sky.addField({ type: 'slider', label: 'Star Brightness', configPath: 'environment.sky.starBrightness', min: 0, max: 2, step: 0.05 });
  sky.addField({ type: 'slider', label: 'Nebula Intensity', configPath: 'environment.sky.nebulaIntensity', min: 0, max: 2, step: 0.05 });

  // Clouds section
  const clouds = tab.addSection('Clouds');
  clouds.addField({ type: 'toggle', label: 'Enabled', configPath: 'environment.cloud.enabled' });
  clouds.addField({ type: 'slider', label: 'Coverage', configPath: 'environment.cloud.coverage', min: 0, max: 1, step: 0.05 });
  clouds.addField({ type: 'slider', label: 'Density', configPath: 'environment.cloud.density', min: 0.1, max: 3, step: 0.1 });
  clouds.addField({ type: 'slider', label: 'Cloud Base', configPath: 'environment.cloud.cloudBase', min: 100, max: 1000, step: 50 });
  clouds.addField({ type: 'slider', label: 'Cloud Height', configPath: 'environment.cloud.cloudHeight', min: 50, max: 500, step: 25 });
  clouds.addField({ type: 'slider', label: 'Detail', configPath: 'environment.cloud.detailStrength', min: 0, max: 1, step: 0.05 });
  clouds.addField({ type: 'slider', label: 'Wind Speed', configPath: 'environment.cloud.windSpeed', min: 0, max: 50, step: 1 });
  clouds.addField({ type: 'slider', label: 'Silver Lining', configPath: 'environment.cloud.silverLining', min: 0, max: 3, step: 0.1 });
  clouds.addField({ type: 'slider', label: 'Multi Scatter', configPath: 'environment.cloud.multiScatterFloor', min: 0, max: 0.5, step: 0.01 });

  // Weather section
  const weather = tab.addSection('Weather');

  const auto = createCustomToggle('Auto', weatherSystem.autoWeather, (checked) => {
    weatherSystem.autoWeather = checked;
    if (checked) {
      weatherSystem.weatherTimer = 0;
      weatherSystem.weatherDuration = 10 + Math.random() * 30;
    }
  });
  weather.addElement(auto.row);

  const weatherDrop = createCustomDropdown('Type', [
    { label: 'Clear', value: WeatherType.CLEAR },
    { label: 'Rain', value: WeatherType.RAIN },
    { label: 'Snow', value: WeatherType.SNOW },
  ], weatherSystem.currentWeather, (v) => {
    weatherSystem.autoWeather = false;
    auto.checkbox.checked = false;
    const type = parseInt(v) as WeatherType;
    weatherSystem.currentWeather = type;
    if (type === WeatherType.CLEAR) {
      weatherSystem.targetIntensity = 0;
      weatherSystem.intensity = 0;
    } else {
      weatherSystem.targetIntensity = 0.7;
      weatherSystem.intensity = 0.7;
    }
  });
  weather.addElement(weatherDrop.row);

  const intensity = createCustomSlider('Intensity', weatherSystem.intensity, 0, 1, 0.05, (v) => {
    weatherSystem.autoWeather = false;
    auto.checkbox.checked = false;
    weatherSystem.targetIntensity = v;
    weatherSystem.intensity = v;
  });
  weather.addElement(intensity.row);

  const transition = createCustomSlider('Trans. Speed', weatherSystem.transitionSpeed, 0.05, 2, 0.05, (v) => {
    weatherSystem.transitionSpeed = v;
  });
  weather.addElement(transition.row);

  // Auto-update time display + weather UI sync
  tab._updateTimeFn = () => {
    if (!dayNightCycle.paused) {
      time.slider.value = String(Math.round(dayNightCycle.timeOfDay * 100));
      time.display.textContent = dayNightCycle.getTimeString();
    }
    weatherDrop.select.value = String(weatherSystem.currentWeather as number);
    intensity.slider.value = String(weatherSystem.intensity);
    intensity.display.textContent = weatherSystem.intensity.toFixed(2);
  };

  return tab;
}
