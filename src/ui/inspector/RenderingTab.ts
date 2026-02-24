import { InspectorTab } from './InspectorTab';

export function buildRenderingTab(): InspectorTab {
  const tab = new InspectorTab();

  // General
  const general = tab.addSection('General');
  general.addField({ type: 'slider', label: 'Render Dist', configPath: 'rendering.general.renderDistance', min: 2, max: 24, step: 1 });
  general.addField({ type: 'slider', label: 'Time Budget (ms)', configPath: 'rendering.general.timeBudgetMs', min: 2, max: 32, step: 1 });

  // LOD
  const lod = tab.addSection('LOD');
  lod.addField({ type: 'toggle', label: 'Enabled', configPath: 'rendering.lod.enabled' });
  lod.addField({ type: 'slider', label: 'LOD Distance', configPath: 'rendering.lod.renderDistance', min: 4, max: 24, step: 1 });

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

  // PCSS Shadows
  const pcss = tab.addSection('PCSS Shadows');
  pcss.addField({ type: 'toggle', label: 'Enabled', configPath: 'rendering.pcss.enabled' });
  pcss.addField({ type: 'slider', label: 'Light Size', configPath: 'rendering.pcss.lightSize', min: 0.5, max: 10, step: 0.5 });

  // Post Process
  const postProcess = tab.addSection('Post Process');
  postProcess.addField({ type: 'toggle', label: 'Vignette', configPath: 'rendering.postProcess.vignette.enabled' });
  postProcess.addField({ type: 'slider', label: 'Vignette Intensity', configPath: 'rendering.postProcess.vignette.intensity', min: 0, max: 1, step: 0.05 });
  postProcess.addField({ type: 'toggle', label: 'Chromatic Aberration', configPath: 'rendering.postProcess.chromaticAberration.enabled' });
  postProcess.addField({ type: 'slider', label: 'CA Intensity', configPath: 'rendering.postProcess.chromaticAberration.intensity', min: 0, max: 0.01, step: 0.001 });

  // Motion Blur
  const motionBlur = tab.addSection('Motion Blur');
  motionBlur.addField({ type: 'toggle', label: 'Enabled', configPath: 'rendering.motionBlur.enabled' });
  motionBlur.addField({ type: 'slider', label: 'Strength', configPath: 'rendering.motionBlur.strength', min: 0.1, max: 2.0, step: 0.1 });

  // Depth of Field
  const dof = tab.addSection('Depth of Field');
  dof.addField({ type: 'toggle', label: 'Enabled', configPath: 'rendering.dof.enabled' });
  dof.addField({ type: 'slider', label: 'Focus Distance', configPath: 'rendering.dof.focusDistance', min: 1, max: 200, step: 1 });
  dof.addField({ type: 'slider', label: 'Aperture', configPath: 'rendering.dof.aperture', min: 0.01, max: 0.5, step: 0.01 });
  dof.addField({ type: 'slider', label: 'Max Blur', configPath: 'rendering.dof.maxBlur', min: 1, max: 30, step: 1 });

  return tab;
}
