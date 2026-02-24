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
  timeBudgetMs: number;
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

export interface RenderingVignetteConfig {
  enabled: boolean;
  intensity: number;
}

export interface RenderingChromaticAberrationConfig {
  enabled: boolean;
  intensity: number;
}

export interface RenderingPostProcessConfig {
  vignette: RenderingVignetteConfig;
  chromaticAberration: RenderingChromaticAberrationConfig;
}

export interface RenderingMotionBlurConfig {
  enabled: boolean;
  strength: number;
}

export interface RenderingDoFConfig {
  enabled: boolean;
  focusDistance: number;
  aperture: number;
  maxBlur: number;
}

export interface RenderingPCSSConfig {
  enabled: boolean;
  lightSize: number;
}

export interface RenderingLODConfig {
  enabled: boolean;
  renderDistance: number;
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
  postProcess: RenderingPostProcessConfig;
  motionBlur: RenderingMotionBlurConfig;
  dof: RenderingDoFConfig;
  pcss: RenderingPCSSConfig;
  lod: RenderingLODConfig;
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

export interface SetResult {
  success: boolean;
  error?: string;
}

interface NumberRule {
  min: number;
  max: number;
}

// Flat map of config path → allowed numeric range
const VALIDATION_RULES: Record<string, NumberRule> = {
  // Camera
  'camera.fov':              { min: 0.1, max: 3.14 },
  'camera.speed':            { min: 0.1, max: 500 },
  'camera.fastSpeed':        { min: 0.1, max: 1000 },
  'camera.mouseSensitivity': { min: 0.0001, max: 0.05 },
  'camera.near':             { min: 0.01, max: 10 },
  'camera.far':              { min: 10, max: 100000 },
  // Rendering - general
  'rendering.general.renderDistance':  { min: 1, max: 32 },
  'rendering.general.timeBudgetMs':   { min: 2, max: 32 },
  // Rendering - shadows
  'rendering.shadows.cascadeCount': { min: 1, max: 8 },
  'rendering.shadows.mapSize':      { min: 256, max: 8192 },
  // Rendering - SSAO
  'rendering.ssao.kernelSize': { min: 4, max: 64 },
  'rendering.ssao.radius':    { min: 0.01, max: 10 },
  'rendering.ssao.bias':      { min: 0, max: 1 },
  // Rendering - bloom
  'rendering.bloom.mipLevels': { min: 1, max: 10 },
  'rendering.bloom.threshold': { min: 0, max: 10 },
  'rendering.bloom.intensity': { min: 0, max: 5 },
  // Rendering - fog
  'rendering.fog.startRatio': { min: 0, max: 5 },
  'rendering.fog.endRatio':   { min: 0, max: 5 },
  // Rendering - contact shadows
  'rendering.contactShadows.maxSteps':  { min: 1, max: 64 },
  'rendering.contactShadows.rayLength': { min: 0.01, max: 10 },
  'rendering.contactShadows.thickness': { min: 0.01, max: 5 },
  // Rendering - TAA
  'rendering.taa.blendFactor': { min: 0, max: 1 },
  // Rendering - auto exposure
  'rendering.autoExposure.adaptSpeed':   { min: 0.01, max: 10 },
  'rendering.autoExposure.keyValue':     { min: 0.01, max: 1 },
  'rendering.autoExposure.minExposure':  { min: 0.001, max: 10 },
  'rendering.autoExposure.maxExposure':  { min: 0.01, max: 100 },
  // Rendering - post process
  'rendering.postProcess.vignette.intensity':           { min: 0, max: 2 },
  'rendering.postProcess.chromaticAberration.intensity': { min: 0, max: 0.05 },
  // Rendering - motion blur / DoF / PCSS
  'rendering.motionBlur.strength':  { min: 0, max: 2 },
  'rendering.dof.focusDistance':    { min: 0.1, max: 1000 },
  'rendering.dof.aperture':         { min: 0.001, max: 1 },
  'rendering.dof.maxBlur':          { min: 0, max: 50 },
  'rendering.pcss.lightSize':       { min: 0.1, max: 20 },
  // Rendering - LOD
  'rendering.lod.renderDistance':   { min: 0, max: 32 },
  // Terrain - noise
  'terrain.noise.octaves':     { min: 1, max: 8 },
  'terrain.noise.persistence': { min: 0.01, max: 1 },
  'terrain.noise.lacunarity':  { min: 1, max: 4 },
  'terrain.noise.scale':       { min: 1, max: 500 },
  // Terrain - height
  'terrain.height.seaLevel':       { min: 0, max: 255 },
  'terrain.height.minHeight':      { min: 1, max: 255 },
  'terrain.height.maxHeight':      { min: 1, max: 255 },
  'terrain.height.dirtLayerDepth': { min: 1, max: 20 },
  // Terrain - biomes
  'terrain.biomes.temperatureScale':     { min: 10, max: 2000 },
  'terrain.biomes.humidityScale':        { min: 10, max: 2000 },
  'terrain.biomes.continentalnessScale': { min: 10, max: 2000 },
  'terrain.biomes.heightVariationScale': { min: 1, max: 200 },
  'terrain.biomes.oceanThreshold':       { min: 0, max: 1 },
  // Terrain - caves
  'terrain.caves.count':     { min: 0, max: 50 },
  'terrain.caves.minLength': { min: 1, max: 500 },
  'terrain.caves.maxLength': { min: 1, max: 500 },
  'terrain.caves.minRadius': { min: 0.5, max: 10 },
  'terrain.caves.maxRadius': { min: 0.5, max: 20 },
  'terrain.caves.minY':      { min: 0, max: 255 },
  'terrain.caves.maxY':      { min: 0, max: 255 },
  // Terrain - trees
  'terrain.trees.perChunk':       { min: 0, max: 20 },
  'terrain.trees.minTrunkHeight': { min: 1, max: 20 },
  'terrain.trees.maxTrunkHeight': { min: 1, max: 30 },
  'terrain.trees.leafDecayChance': { min: 0, max: 1 },
  // Environment
  'environment.dayDurationSeconds': { min: 10, max: 36000 },
  'environment.cloudCoverage':      { min: 0, max: 1 },
  'environment.cloud.coverage':         { min: 0, max: 1 },
  'environment.cloud.baseNoiseScale':   { min: 0.0001, max: 0.1 },
  'environment.cloud.extinction':       { min: 0.01, max: 5 },
  'environment.cloud.multiScatterFloor': { min: 0, max: 1 },
  'environment.cloud.detailStrength':    { min: 0, max: 1 },
};

// Cross-property constraints: [pathA, pathB] where A must be < B
const CROSS_CONSTRAINTS: [string, string][] = [
  ['terrain.height.minHeight', 'terrain.height.maxHeight'],
  ['terrain.trees.minTrunkHeight', 'terrain.trees.maxTrunkHeight'],
  ['terrain.caves.minLength', 'terrain.caves.maxLength'],
  ['terrain.caves.minRadius', 'terrain.caves.maxRadius'],
  ['terrain.caves.minY', 'terrain.caves.maxY'],
  ['rendering.autoExposure.minExposure', 'rendering.autoExposure.maxExposure'],
];

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
        general: { renderDistance: 14, timeBudgetMs: 12 },
        shadows: { cascadeCount: 3, mapSize: 2048, cascadeSplits: [20, 60, 160] },
        ssao: { kernelSize: 16, radius: 1.5, bias: 0.025 },
        bloom: { mipLevels: 5, threshold: 1.0, intensity: 0.3 },
        fog: { startRatio: 0.85, endRatio: 1.15 },
        contactShadows: { enabled: false, maxSteps: 16, rayLength: 0.5, thickness: 0.3 },
        taa: { enabled: true, blendFactor: 0.9 },
        autoExposure: { enabled: true, adaptSpeed: 1.5, keyValue: 0.18, minExposure: 0.1, maxExposure: 5.0 },
        postProcess: {
          vignette: { enabled: true, intensity: 0.4 },
          chromaticAberration: { enabled: true, intensity: 0.002 },
        },
        motionBlur: { enabled: false, strength: 0.5 },
        dof: { enabled: false, focusDistance: 50.0, aperture: 0.05, maxBlur: 10.0 },
        pcss: { enabled: true, lightSize: 3.0 },
        lod: { enabled: true, renderDistance: 14 },
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

  set(path: string, value: unknown): SetResult {
    // Type validation
    const existing = this.get(path);
    if (existing !== undefined) {
      if (typeof existing === 'number') {
        if (typeof value !== 'number' || !Number.isFinite(value as number)) {
          return { success: false, error: `"${path}": expected finite number, got ${value}` };
        }
      }
      if (typeof existing === 'boolean' && typeof value !== 'boolean') {
        return { success: false, error: `"${path}": expected boolean, got ${typeof value}` };
      }
    }

    // Range validation
    if (typeof value === 'number') {
      const rule = VALIDATION_RULES[path];
      if (rule) {
        if (value < rule.min || value > rule.max) {
          return { success: false, error: `"${path}": ${value} out of range [${rule.min}, ${rule.max}]` };
        }
      }
    }

    // Cross-property constraints
    if (typeof value === 'number') {
      for (const [minPath, maxPath] of CROSS_CONSTRAINTS) {
        if (path === minPath) {
          const maxVal = this.get(maxPath);
          if (typeof maxVal === 'number' && value > maxVal) {
            return { success: false, error: `"${path}": ${value} must be <= ${maxPath} (${maxVal})` };
          }
        } else if (path === maxPath) {
          const minVal = this.get(minPath);
          if (typeof minVal === 'number' && value < minVal) {
            return { success: false, error: `"${path}": ${value} must be >= ${minPath} (${minVal})` };
          }
        }
      }
    }

    // Cascade splits ascending check
    if (path.startsWith('rendering.shadows.cascadeSplits')) {
      const splits = [...(this.data.rendering.shadows.cascadeSplits)];
      // Apply the new value to a copy
      const match = path.match(/cascadeSplits\.(\d+)$/);
      if (match) {
        const idx = parseInt(match[1]);
        splits[idx] = value as number;
        for (let i = 1; i < splits.length; i++) {
          if (splits[i] <= splits[i - 1]) {
            return { success: false, error: `cascadeSplits must be ascending: [${splits.join(', ')}]` };
          }
        }
      }
    }

    setNestedValue(this.data as unknown as Record<string, unknown>, path, value);
    const group = path.split('.')[0] as ConfigGroup;
    this.dirtyGroups.add(group);
    for (const handler of this.handlers) {
      handler(path, value);
    }
    this.scheduleSave();
    return { success: true };
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
