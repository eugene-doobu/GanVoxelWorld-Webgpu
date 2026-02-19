import { InspectorTab } from './InspectorTab';

export function buildCameraTab(): InspectorTab {
  const tab = new InspectorTab();

  const section = tab.addSection('Camera');
  section.addField({ type: 'slider', label: 'Speed', configPath: 'camera.speed', min: 1, max: 200, step: 1 });
  section.addField({ type: 'slider', label: 'Fast Speed', configPath: 'camera.fastSpeed', min: 10, max: 300, step: 5 });
  section.addField({ type: 'slider', label: 'Sensitivity', configPath: 'camera.mouseSensitivity', min: 0.0005, max: 0.01, step: 0.0005 });
  section.addField({ type: 'slider', label: 'FOV (deg)', configPath: 'camera.fov', min: 0.5236, max: 2.0944, step: 0.0175 }); // 30-120 deg in rad
  section.addField({ type: 'number', label: 'Near', configPath: 'camera.near', min: 0.01, max: 10, step: 0.01 });
  section.addField({ type: 'number', label: 'Far', configPath: 'camera.far', min: 100, max: 5000, step: 100 });

  return tab;
}
