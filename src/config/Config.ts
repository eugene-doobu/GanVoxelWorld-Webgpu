// Central Config Manager — reactive singleton with pub/sub + dirty tracking

export interface TerrainNoiseConfig {
  octaves: number;
  persistence: number;
  lacunarity: number;
  scale: number;
}

export interface TerrainHeightConfig {
  seaLevel: number;
  minHeight: number;
  maxHeight: number;
  dirtLayerDepth: number;
}

export interface TerrainBiomesConfig {
  temperatureScale: number;
  humidityScale: number;
  continentalnessScale: number;
  heightVariationScale: number;
  oceanThreshold: number;
}

export interface TerrainCavesConfig {
  count: number;
  minLength: number;
  maxLength: number;
  minRadius: number;
  maxRadius: number;
  minY: number;
  maxY: number;
}

export interface OreConfig {
  minY: number;
  maxY: number;
  attempts: number;
  veinSize: number;
}

export interface TerrainOresConfig {
  coal: OreConfig;
  iron: OreConfig;
  gold: OreConfig;
  diamond: OreConfig;
}

export interface TerrainTreesConfig {
  perChunk: number;
  minTrunkHeight: number;
  maxTrunkHeight: number;
  leafDecayChance: number;
}

export interface TerrainConfig {
  noise: TerrainNoiseConfig;
  height: TerrainHeightConfig;
  biomes: TerrainBiomesConfig;
  caves: TerrainCavesConfig;
  ores: TerrainOresConfig;
  trees: TerrainTreesConfig;
}

export interface RenderingGeneralConfig {
  renderDistance: number;
  chunksPerFrame: number;
}

export interface RenderingShadowsConfig {
  cascadeCount: number;
  mapSize: number;
  cascadeSplits: [number, number, number];
}

export interface RenderingSSAOConfig {
  kernelSize: number;
  radius: number;
  bias: number;
}

export interface RenderingBloomConfig {
  mipLevels: number;
  threshold: number;
  intensity: number;
}

export interface RenderingFogConfig {
  startRatio: number;
  endRatio: number;
}

export interface RenderingConfig {
  general: RenderingGeneralConfig;
  shadows: RenderingShadowsConfig;
  ssao: RenderingSSAOConfig;
  bloom: RenderingBloomConfig;
  fog: RenderingFogConfig;
}

export interface CameraConfig {
  speed: number;
  fastSpeed: number;
  mouseSensitivity: number;
  fov: number;
  near: number;
  far: number;
}

export interface EnvironmentConfig {
  dayDurationSeconds: number;
}

export interface AppConfig {
  terrain: TerrainConfig;
  rendering: RenderingConfig;
  camera: CameraConfig;
  environment: EnvironmentConfig;
}

export type ConfigGroup = 'terrain' | 'rendering' | 'camera' | 'environment';
export type ChangeHandler = (path: string, value: unknown) => void;

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    current = current[keys[i]] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]] = value;
}

class ConfigManager {
  data: AppConfig;
  private handlers: ChangeHandler[] = [];
  private dirtyGroups = new Set<ConfigGroup>();

  constructor() {
    this.data = {
      terrain: {
        noise: { octaves: 4, persistence: 0.5, lacunarity: 2.0, scale: 50.0 },
        height: { seaLevel: 50, minHeight: 1, maxHeight: 100, dirtLayerDepth: 4 },
        biomes: {
          temperatureScale: 200.0,
          humidityScale: 200.0,
          continentalnessScale: 400.0,
          heightVariationScale: 30.0,
          oceanThreshold: 0.3,
        },
        caves: {
          count: 8, minLength: 50, maxLength: 150,
          minRadius: 1.5, maxRadius: 4.0, minY: 10, maxY: 60,
        },
        ores: {
          coal: { minY: 5, maxY: 128, attempts: 20, veinSize: 8 },
          iron: { minY: 5, maxY: 64, attempts: 20, veinSize: 6 },
          gold: { minY: 5, maxY: 32, attempts: 2, veinSize: 5 },
          diamond: { minY: 5, maxY: 16, attempts: 1, veinSize: 4 },
        },
        trees: { perChunk: 3, minTrunkHeight: 4, maxTrunkHeight: 6, leafDecayChance: 0.2 },
      },
      rendering: {
        general: { renderDistance: 10, chunksPerFrame: 2 },
        shadows: { cascadeCount: 3, mapSize: 2048, cascadeSplits: [20, 60, 160] },
        ssao: { kernelSize: 16, radius: 1.5, bias: 0.025 },
        bloom: { mipLevels: 5, threshold: 1.0, intensity: 0.3 },
        fog: { startRatio: 0.75, endRatio: 1.0 },
      },
      camera: {
        speed: 20.0, fastSpeed: 60.0, mouseSensitivity: 0.002,
        fov: 70 * (Math.PI / 180), near: 0.1, far: 1000.0,
      },
      environment: {
        dayDurationSeconds: 1200,
      },
    };
  }

  get(path: string): unknown {
    return getNestedValue(this.data as unknown as Record<string, unknown>, path);
  }

  set(path: string, value: unknown): void {
    setNestedValue(this.data as unknown as Record<string, unknown>, path, value);
    const group = path.split('.')[0] as ConfigGroup;
    this.dirtyGroups.add(group);
    for (const handler of this.handlers) {
      handler(path, value);
    }
  }

  onChange(handler: ChangeHandler): void {
    this.handlers.push(handler);
  }

  removeHandler(handler: ChangeHandler): void {
    const idx = this.handlers.indexOf(handler);
    if (idx >= 0) this.handlers.splice(idx, 1);
  }

  isDirty(group: ConfigGroup): boolean {
    return this.dirtyGroups.has(group);
  }

  clearDirty(group: ConfigGroup): void {
    this.dirtyGroups.delete(group);
  }
}

export const Config = new ConfigManager();
