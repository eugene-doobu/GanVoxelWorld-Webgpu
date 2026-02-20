import { InspectorTab } from './InspectorTab';
import { Config } from '../../config/Config';
import { DayNightCycle } from '../../world/DayNightCycle';
import { WeatherSystem, WeatherType } from '../../world/WeatherSystem';

export function buildEnvironmentTab(dayNightCycle: DayNightCycle, weatherSystem: WeatherSystem): InspectorTab {
  const tab = new InspectorTab();

  // Day/Night section
  const dayNight = tab.addSection('Day / Night');

  // Time slider (direct control, not via Config)
  const timeRow = document.createElement('div');
  timeRow.className = 'inspector-field';
  const timeLabel = document.createElement('div');
  timeLabel.className = 'inspector-field-label';
  timeLabel.textContent = 'Time';
  const timeControl = document.createElement('div');
  timeControl.className = 'inspector-field-control';
  const timeSlider = document.createElement('input');
  timeSlider.type = 'range';
  timeSlider.min = '0';
  timeSlider.max = '100';
  timeSlider.step = '1';
  timeSlider.value = String(Math.round(dayNightCycle.timeOfDay * 100));
  const timeVal = document.createElement('span');
  timeVal.className = 'val-display';
  timeVal.textContent = dayNightCycle.getTimeString();

  timeSlider.addEventListener('input', () => {
    const t = parseInt(timeSlider.value) / 100;
    dayNightCycle.setTime(t);
    timeVal.textContent = dayNightCycle.getTimeString();
  });
  timeSlider.addEventListener('dblclick', () => {
    dayNightCycle.paused = false;
  });

  timeControl.appendChild(timeSlider);
  timeControl.appendChild(timeVal);
  timeRow.appendChild(timeLabel);
  timeRow.appendChild(timeControl);
  dayNight.addElement(timeRow);

  dayNight.addField({ type: 'slider', label: 'Day Duration', configPath: 'environment.dayDurationSeconds', min: 60, max: 3600, step: 60 });
  // Cloud section
  const clouds = tab.addSection('Clouds');
  clouds.addField({ type: 'slider', label: 'Coverage', configPath: 'environment.cloud.coverage', min: 0, max: 1, step: 0.05 });
  clouds.addField({ type: 'slider', label: 'Noise Scale', configPath: 'environment.cloud.baseNoiseScale', min: 0.0005, max: 0.005, step: 0.0001 });
  clouds.addField({ type: 'slider', label: 'Extinction', configPath: 'environment.cloud.extinction', min: 0.05, max: 1.0, step: 0.05 });
  clouds.addField({ type: 'slider', label: 'Scatter Floor', configPath: 'environment.cloud.multiScatterFloor', min: 0, max: 0.8, step: 0.05 });
  clouds.addField({ type: 'slider', label: 'Detail Str.', configPath: 'environment.cloud.detailStrength', min: 0, max: 0.5, step: 0.01 });

  // Sync cloud.coverage → cloudCoverage (legacy uniform path)
  Config.onChange((path) => {
    if (path === 'environment.cloud.coverage') {
      Config.data.environment.cloudCoverage = Config.data.environment.cloud.coverage;
    }
  });

  // Auto-update time display
  (tab as any)._updateTime = () => {
    if (!dayNightCycle.paused) {
      timeSlider.value = String(Math.round(dayNightCycle.timeOfDay * 100));
      timeVal.textContent = dayNightCycle.getTimeString();
    }
  };

  // Weather section
  const weather = tab.addSection('Weather');

  // Weather type dropdown (direct control)
  const weatherRow = document.createElement('div');
  weatherRow.className = 'inspector-field';
  const weatherLabel = document.createElement('div');
  weatherLabel.className = 'inspector-field-label';
  weatherLabel.textContent = 'Weather';
  const weatherControl = document.createElement('div');
  weatherControl.className = 'inspector-field-control';
  const weatherSelect = document.createElement('select');
  const weatherOptions = [
    { label: 'Clear', value: WeatherType.CLEAR },
    { label: 'Rain', value: WeatherType.RAIN },
    { label: 'Snow', value: WeatherType.SNOW },
  ];
  for (const opt of weatherOptions) {
    const option = document.createElement('option');
    option.value = String(opt.value);
    option.textContent = opt.label;
    weatherSelect.appendChild(option);
  }

  weatherSelect.addEventListener('change', () => {
    const type = parseInt(weatherSelect.value) as WeatherType;
    weatherSystem.currentWeather = type;
    if (type === WeatherType.CLEAR) {
      weatherSystem.targetIntensity = 0;
    } else {
      weatherSystem.targetIntensity = 0.7;
    }
    weatherSystem.weatherTimer = 0;
    weatherSystem.weatherDuration = 9999; // prevent auto-switch
  });

  weatherControl.appendChild(weatherSelect);
  weatherRow.appendChild(weatherLabel);
  weatherRow.appendChild(weatherControl);
  weather.addElement(weatherRow);

  // Intensity slider (direct control)
  const intRow = document.createElement('div');
  intRow.className = 'inspector-field';
  const intLabel = document.createElement('div');
  intLabel.className = 'inspector-field-label';
  intLabel.textContent = 'Intensity';
  const intControl = document.createElement('div');
  intControl.className = 'inspector-field-control';
  const intSlider = document.createElement('input');
  intSlider.type = 'range';
  intSlider.min = '0';
  intSlider.max = '1';
  intSlider.step = '0.05';
  intSlider.value = String(weatherSystem.targetIntensity);
  const intVal = document.createElement('span');
  intVal.className = 'val-display';
  intVal.textContent = weatherSystem.targetIntensity.toFixed(2);

  intSlider.addEventListener('input', () => {
    const v = parseFloat(intSlider.value);
    weatherSystem.targetIntensity = v;
    intVal.textContent = v.toFixed(2);
    weatherSystem.weatherTimer = 0;
    weatherSystem.weatherDuration = 9999;
  });

  intControl.appendChild(intSlider);
  intControl.appendChild(intVal);
  intRow.appendChild(intLabel);
  intRow.appendChild(intControl);
  weather.addElement(intRow);

  // Transition speed
  const transRow = document.createElement('div');
  transRow.className = 'inspector-field';
  const transLabel = document.createElement('div');
  transLabel.className = 'inspector-field-label';
  transLabel.textContent = 'Trans. Speed';
  const transControl = document.createElement('div');
  transControl.className = 'inspector-field-control';
  const transSlider = document.createElement('input');
  transSlider.type = 'range';
  transSlider.min = '0.05';
  transSlider.max = '2';
  transSlider.step = '0.05';
  transSlider.value = String(weatherSystem.transitionSpeed);
  const transVal = document.createElement('span');
  transVal.className = 'val-display';
  transVal.textContent = weatherSystem.transitionSpeed.toFixed(2);

  transSlider.addEventListener('input', () => {
    const v = parseFloat(transSlider.value);
    weatherSystem.transitionSpeed = v;
    transVal.textContent = v.toFixed(2);
  });

  transControl.appendChild(transSlider);
  transControl.appendChild(transVal);
  transRow.appendChild(transLabel);
  transRow.appendChild(transControl);
  weather.addElement(transRow);

  return tab;
}
