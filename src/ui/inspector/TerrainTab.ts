import { InspectorTab } from './InspectorTab';
import { Config } from '../../config/Config';

export function buildTerrainTab(onRegenerate: (seed: number) => void): InspectorTab {
  const tab = new InspectorTab();

  // Noise section
  const noise = tab.addSection('Noise');
  noise.addField({ type: 'slider', label: 'Octaves', configPath: 'terrain.noise.octaves', min: 1, max: 8, step: 1 });
  noise.addField({ type: 'slider', label: 'Persistence', configPath: 'terrain.noise.persistence', min: 0, max: 1, step: 0.05 });
  noise.addField({ type: 'slider', label: 'Lacunarity', configPath: 'terrain.noise.lacunarity', min: 1, max: 4, step: 0.1 });
  noise.addField({ type: 'slider', label: 'Scale', configPath: 'terrain.noise.scale', min: 10, max: 200, step: 1 });

  // Height section
  const height = tab.addSection('Height');
  height.addField({ type: 'slider', label: 'Sea Level', configPath: 'terrain.height.seaLevel', min: 10, max: 100, step: 1 });
  height.addField({ type: 'slider', label: 'Min Height', configPath: 'terrain.height.minHeight', min: 1, max: 50, step: 1 });
  height.addField({ type: 'slider', label: 'Max Height', configPath: 'terrain.height.maxHeight', min: 50, max: 128, step: 1 });
  height.addField({ type: 'slider', label: 'Dirt Depth', configPath: 'terrain.height.dirtLayerDepth', min: 1, max: 10, step: 1 });

  // Biomes section
  const biomes = tab.addSection('Biomes', true);
  biomes.addField({ type: 'slider', label: 'Temp Scale', configPath: 'terrain.biomes.temperatureScale', min: 50, max: 500, step: 10 });
  biomes.addField({ type: 'slider', label: 'Humid Scale', configPath: 'terrain.biomes.humidityScale', min: 50, max: 500, step: 10 });
  biomes.addField({ type: 'slider', label: 'Cont. Scale', configPath: 'terrain.biomes.continentalnessScale', min: 100, max: 800, step: 10 });
  biomes.addField({ type: 'slider', label: 'Height Var.', configPath: 'terrain.biomes.heightVariationScale', min: 5, max: 100, step: 1 });
  biomes.addField({ type: 'slider', label: 'Ocean Thresh.', configPath: 'terrain.biomes.oceanThreshold', min: 0, max: 0.8, step: 0.05 });

  // Caves section
  const caves = tab.addSection('Caves', true);
  caves.addField({ type: 'slider', label: 'Count', configPath: 'terrain.caves.count', min: 0, max: 30, step: 1 });
  caves.addField({ type: 'slider', label: 'Min Length', configPath: 'terrain.caves.minLength', min: 10, max: 200, step: 5 });
  caves.addField({ type: 'slider', label: 'Max Length', configPath: 'terrain.caves.maxLength', min: 50, max: 400, step: 5 });
  caves.addField({ type: 'slider', label: 'Min Radius', configPath: 'terrain.caves.minRadius', min: 0.5, max: 5, step: 0.25 });
  caves.addField({ type: 'slider', label: 'Max Radius', configPath: 'terrain.caves.maxRadius', min: 1, max: 8, step: 0.25 });
  caves.addField({ type: 'slider', label: 'Min Y', configPath: 'terrain.caves.minY', min: 1, max: 50, step: 1 });
  caves.addField({ type: 'slider', label: 'Max Y', configPath: 'terrain.caves.maxY', min: 20, max: 100, step: 1 });

  // Ores section
  const ores = tab.addSection('Ores', true);
  const oreTypes = ['coal', 'iron', 'gold', 'diamond'] as const;
  for (const ore of oreTypes) {
    const sub = ores.addSubSection(ore.charAt(0).toUpperCase() + ore.slice(1));
    sub.addField({ type: 'number', label: 'Min Y', configPath: `terrain.ores.${ore}.minY`, min: 1, max: 128, step: 1 });
    sub.addField({ type: 'number', label: 'Max Y', configPath: `terrain.ores.${ore}.maxY`, min: 1, max: 128, step: 1 });
    sub.addField({ type: 'number', label: 'Attempts', configPath: `terrain.ores.${ore}.attempts`, min: 0, max: 50, step: 1 });
    sub.addField({ type: 'number', label: 'Vein Size', configPath: `terrain.ores.${ore}.veinSize`, min: 1, max: 20, step: 1 });
  }

  // Trees section
  const trees = tab.addSection('Trees', true);
  trees.addField({ type: 'slider', label: 'Per Chunk', configPath: 'terrain.trees.perChunk', min: 0, max: 15, step: 1 });
  trees.addField({ type: 'slider', label: 'Min Trunk', configPath: 'terrain.trees.minTrunkHeight', min: 2, max: 10, step: 1 });
  trees.addField({ type: 'slider', label: 'Max Trunk', configPath: 'terrain.trees.maxTrunkHeight', min: 3, max: 15, step: 1 });
  trees.addField({ type: 'slider', label: 'Leaf Decay', configPath: 'terrain.trees.leafDecayChance', min: 0, max: 1, step: 0.05 });

  // Seed input + Regenerate button
  const seedRow = document.createElement('div');
  seedRow.className = 'inspector-field';
  seedRow.style.padding = '4px 8px';
  const seedLabel = document.createElement('div');
  seedLabel.className = 'inspector-field-label';
  seedLabel.textContent = 'Seed';
  const seedControl = document.createElement('div');
  seedControl.className = 'inspector-field-control';
  const seedInput = document.createElement('input');
  seedInput.type = 'number';
  seedInput.value = '0';
  seedInput.style.flex = '1';
  seedControl.appendChild(seedInput);
  seedRow.appendChild(seedLabel);
  seedRow.appendChild(seedControl);
  tab.el.appendChild(seedRow);

  const regenBtn = tab.addButton('Regenerate Terrain', () => {
    const seed = parseInt(seedInput.value) || 0;
    onRegenerate(seed);
    Config.clearDirty('terrain');
    regenBtn.classList.remove('dirty');
  });

  // Listen for terrain dirty state
  Config.onChange((path) => {
    if (path.startsWith('terrain.')) {
      regenBtn.classList.add('dirty');
    }
  });

  // Expose seed input for external access
  (tab as any).seedInput = seedInput;

  return tab;
}
