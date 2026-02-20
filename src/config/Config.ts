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

export interface RenderingContactShadowsConfig {
  enabled: boolean;
  maxSteps: number;
  rayLength: number;
  thickness: number;
}

export interface RenderingTAAConfig {
  enabled: boolean;
  blendFactor: number;
}

export interface RenderingAutoExposureConfig {
  enabled: boolean;
  adaptSpeed: number;
  keyValue: number;
  minExposure: number;
  maxExposure: number;
}

export interface RenderingConfig {
  general: RenderingGeneralConfig;
  shadows: RenderingShadowsConfig;
  ssao: RenderingSSAOConfig;
  bloom: RenderingBloomConfig;
  fog: RenderingFogConfig;
  contactShadows: RenderingContactShadowsConfig;
  taa: RenderingTAAConfig;
  autoExposure: RenderingAutoExposureConfig;
}

export interface CameraConfig {
  speed: number;
  fastSpeed: number;
  mouseSensitivity: number;
  fov: number;
  near: number;
  far: number;
}

export interface CloudConfig {
  coverage: number;
  baseNoiseScale: number;
  extinction: number;
  multiScatterFloor: number;
  detailStrength: number;
}

export interface EnvironmentConfig {
  dayDurationSeconds: number;
  cloudCoverage: number;
  cloud: CloudConfig;
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

const STORAGE_KEY = 'voxelEngineConfig';

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): void {
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = target[key];
    if (sv != null && typeof sv === 'object' && !Array.isArray(sv) &&
        tv != null && typeof tv === 'object' && !Array.isArray(tv)) {
      deepMerge(tv as Record<string, unknown>, sv as Record<string, unknown>);
    } else {
      target[key] = sv;
    }
  }
}

class ConfigManager {
  data: AppConfig;
  private handlers: ChangeHandler[] = [];
  private dirtyGroups = new Set<ConfigGroup>();
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.data = this.getDefaults();
    this.loadFromStorage();
  }

  private getDefaults(): AppConfig {
    return {
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
        fog: { startRatio: 0.85, endRatio: 1.15 },
        contactShadows: { enabled: false, maxSteps: 16, rayLength: 0.5, thickness: 0.3 },
        taa: { enabled: true, blendFactor: 0.9 },
        autoExposure: { enabled: true, adaptSpeed: 1.5, keyValue: 0.18, minExposure: 0.1, maxExposure: 5.0 },
      },
      camera: {
        speed: 20.0, fastSpeed: 60.0, mouseSensitivity: 0.002,
        fov: 70 * (Math.PI / 180), near: 0.1, far: 1000.0,
      },
      environment: {
        dayDurationSeconds: 1200,
        cloudCoverage: 0.35,
        cloud: {
          coverage: 0.35,
          baseNoiseScale: 0.0018,
          extinction: 0.3,
          multiScatterFloor: 0.35,
          detailStrength: 0.15,
        },
      },
    };
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && typeof saved === 'object') {
          deepMerge(this.data as unknown as Record<string, unknown>, saved);
        }
      }
    } catch {
      // Corrupted data — fall back to defaults
    }
  }

  private scheduleSave(): void {
    if (this.saveTimer !== null) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      } catch {
        // Storage full or unavailable — ignore
      }
      this.saveTimer = null;
    }, 500);
  }

  get(path: string): unknown {
    return getNestedValue(this.data as unknown as Record<string, unknown>, path);
  }

  set(path: string, value: unknown): void {
    // Validate type matches existing value
    const existing = this.get(path);
    if (existing !== undefined) {
      if (typeof existing === 'number' && (typeof value !== 'number' || Number.isNaN(value as number))) {
        console.warn(`[Config] Rejected set("${path}", ${value}): expected number`);
        return;
      }
      if (typeof existing === 'boolean' && typeof value !== 'boolean') {
        console.warn(`[Config] Rejected set("${path}", ${value}): expected boolean`);
        return;
      }
    }

    setNestedValue(this.data as unknown as Record<string, unknown>, path, value);
    const group = path.split('.')[0] as ConfigGroup;
    this.dirtyGroups.add(group);
    for (const handler of this.handlers) {
      handler(path, value);
    }
    this.scheduleSave();
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

  resetToDefaults(): void {
    this.data = this.getDefaults();
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    for (const handler of this.handlers) {
      handler('*', undefined);
    }
  }
}

export const Config = new ConfigManager();
