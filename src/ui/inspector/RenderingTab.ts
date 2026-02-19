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

  return tab;
}
