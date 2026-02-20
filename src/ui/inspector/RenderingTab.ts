import { InspectorTab } from './InspectorTab';

export function buildRenderingTab(): InspectorTab {
  const tab = new InspectorTab();

  // General
  const general = tab.addSection('General');
  general.addField({ type: 'slider', label: 'Render Dist', configPath: 'rendering.general.renderDistance', min: 2, max: 24, step: 1 });
  general.addField({ type: 'slider', label: 'Chunks/Frame', configPath: 'rendering.general.chunksPerFrame', min: 1, max: 8, step: 1 });

  // Shadows
  const shadows = tab.addSection('Shadows', true);
  shadows.addField({ type: 'number', label: 'Cascade Count', configPath: 'rendering.shadows.cascadeCount', min: 1, max: 4, step: 1 });
  shadows.addField({ type: 'number', label: 'Map Size', configPath: 'rendering.shadows.mapSize', min: 512, max: 4096, step: 512 });

  // SSAO
  const ssao = tab.addSection('SSAO', true);
  ssao.addField({ type: 'slider', label: 'Radius', configPath: 'rendering.ssao.radius', min: 0.1, max: 5, step: 0.1 });
  ssao.addField({ type: 'slider', label: 'Bias', configPath: 'rendering.ssao.bias', min: 0.001, max: 0.1, step: 0.001 });
  ssao.addField({ type: 'number', label: 'Kernel Size', configPath: 'rendering.ssao.kernelSize', min: 4, max: 64, step: 4 });

  // Bloom
  const bloom = tab.addSection('Bloom');
  bloom.addField({ type: 'slider', label: 'Threshold', configPath: 'rendering.bloom.threshold', min: 0, max: 5, step: 0.1 });
  bloom.addField({ type: 'slider', label: 'Intensity', configPath: 'rendering.bloom.intensity', min: 0, max: 2, step: 0.05 });
  bloom.addField({ type: 'number', label: 'Mip Levels', configPath: 'rendering.bloom.mipLevels', min: 1, max: 8, step: 1 });

  // Fog
  const fog = tab.addSection('Fog');
  fog.addField({ type: 'slider', label: 'Start Ratio', configPath: 'rendering.fog.startRatio', min: 0, max: 1, step: 0.05 });
  fog.addField({ type: 'slider', label: 'End Ratio', configPath: 'rendering.fog.endRatio', min: 0.5, max: 2, step: 0.05 });

  // Contact Shadows
  const contactShadows = tab.addSection('Contact Shadows');
  contactShadows.addField({ type: 'toggle', label: 'Enabled', configPath: 'rendering.contactShadows.enabled' });
  contactShadows.addField({ type: 'slider', label: 'Max Steps', configPath: 'rendering.contactShadows.maxSteps', min: 4, max: 32, step: 1 });
  contactShadows.addField({ type: 'slider', label: 'Ray Length', configPath: 'rendering.contactShadows.rayLength', min: 0.1, max: 2.0, step: 0.05 });
  contactShadows.addField({ type: 'slider', label: 'Thickness', configPath: 'rendering.contactShadows.thickness', min: 0.01, max: 1.0, step: 0.01 });

  // TAA
  const taa = tab.addSection('TAA');
  taa.addField({ type: 'toggle', label: 'Enabled', configPath: 'rendering.taa.enabled' });
  taa.addField({ type: 'slider', label: 'Blend Factor', configPath: 'rendering.taa.blendFactor', min: 0.5, max: 0.98, step: 0.01 });

  // Auto Exposure
  const autoExposure = tab.addSection('Auto Exposure');
  autoExposure.addField({ type: 'toggle', label: 'Enabled', configPath: 'rendering.autoExposure.enabled' });
  autoExposure.addField({ type: 'slider', label: 'Adapt Speed', configPath: 'rendering.autoExposure.adaptSpeed', min: 0.1, max: 5, step: 0.1 });
  autoExposure.addField({ type: 'slider', label: 'Key Value', configPath: 'rendering.autoExposure.keyValue', min: 0.05, max: 0.5, step: 0.01 });
  autoExposure.addField({ type: 'slider', label: 'Min Exposure', configPath: 'rendering.autoExposure.minExposure', min: 0.01, max: 1.0, step: 0.01 });
  autoExposure.addField({ type: 'slider', label: 'Max Exposure', configPath: 'rendering.autoExposure.maxExposure', min: 1.0, max: 10.0, step: 0.1 });

  return tab;
}
