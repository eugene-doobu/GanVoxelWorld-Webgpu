import { FractalNoise } from '../noise/SimplexNoise';
import { Chunk } from './Chunk';
import { BlockType } from './BlockTypes';
import { BiomeType, BIOME_PARAMS } from './BiomeTypes';
import { CHUNK_WIDTH, CHUNK_HEIGHT, CHUNK_DEPTH } from '../constants';
import { Config } from '../config/Config';

export class TerrainGenerator {
  private continentalnessNoise: FractalNoise;
  private temperatureNoise: FractalNoise;
  private humidityNoise: FractalNoise;
  private heightVariationNoise: FractalNoise;
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
    const n = Config.data.terrain.noise;
    const b = Config.data.terrain.biomes;
    this.continentalnessNoise = new FractalNoise(seed, n.octaves, n.persistence, n.lacunarity, b.continentalnessScale);
    this.temperatureNoise = new FractalNoise(seed + 1000, n.octaves, n.persistence, n.lacunarity, b.temperatureScale);
    this.humidityNoise = new FractalNoise(seed + 2000, n.octaves, n.persistence, n.lacunarity, b.humidityScale);
    this.heightVariationNoise = new FractalNoise(seed + 3000, n.octaves, n.persistence, n.lacunarity, b.heightVariationScale);
  }

  generate(chunk: Chunk): void {
    for (let x = 0; x < CHUNK_WIDTH; x++) {
      for (let z = 0; z < CHUNK_DEPTH; z++) {
        const worldX = chunk.worldOffsetX + x;
        const worldZ = chunk.worldOffsetZ + z;
        this.generateColumn(chunk, x, z, worldX, worldZ);
      }
    }
  }

  private generateColumn(chunk: Chunk, localX: number, localZ: number, worldX: number, worldZ: number): void {
    const continentalness = this.continentalnessNoise.sample(worldX, worldZ);
    const heightVariation = this.heightVariationNoise.sample(worldX, worldZ);

    const baseHeight = this.continentalnessToHeight(continentalness);
    let height = Math.floor(baseHeight + (heightVariation - 0.5) * 10);
    height = Math.max(1, Math.min(CHUNK_HEIGHT - 1, height));

    const biome = this.getBiome(worldX, worldZ, height, continentalness);

    for (let y = 0; y < CHUNK_HEIGHT; y++) {
      chunk.setBlock(localX, y, localZ, this.getBlockType(y, height, biome));
    }
  }

  private continentalnessToHeight(c: number): number {
    // Piecewise linear spline: continentalness [0,1] → height
    if (c < 0.3) {
      // Deep ocean → shallow ocean: 30~48
      return 30 + (c / 0.3) * 18;
    } else if (c < 0.45) {
      // Coastal transition: 48~52
      return 48 + ((c - 0.3) / 0.15) * 4;
    } else if (c < 0.7) {
      // Plains/lowlands: 52~65
      return 52 + ((c - 0.45) / 0.25) * 13;
    } else if (c < 0.85) {
      // Hills: 65~80
      return 65 + ((c - 0.7) / 0.15) * 15;
    } else {
      // Mountains: 80~100
      return 80 + ((c - 0.85) / 0.15) * 20;
    }
  }

  getBiome(worldX: number, worldZ: number, surfaceHeight: number, continentalness?: number): BiomeType {
    if (continentalness === undefined) {
      continentalness = this.continentalnessNoise.sample(worldX, worldZ);
    }

    // Force ocean when continentalness is below threshold
    if (continentalness < Config.data.terrain.biomes.oceanThreshold) {
      return BiomeType.OCEAN;
    }

    const temperature = this.temperatureNoise.sample(worldX, worldZ);
    const humidity = this.humidityNoise.sample(worldX, worldZ);

    // Map noise [0,1] to parameter space [-1,1]
    const t = temperature * 2 - 1;
    const h = humidity * 2 - 1;
    const cont = continentalness * 2 - 1;

    // Nearest-neighbor selection in 3D parameter space
    let bestBiome = BiomeType.PLAINS;
    let bestDist = Infinity;

    for (const entry of BIOME_PARAMS) {
      const dt = t - entry.params.temperature;
      const dh = h - entry.params.humidity;
      const dc = cont - entry.params.continentalness;
      const dist = dt * dt + dh * dh + dc * dc;
      if (dist < bestDist) {
        bestDist = dist;
        bestBiome = entry.biome;
      }
    }

    return bestBiome;
  }

  private getBlockType(y: number, surfaceHeight: number, biome: BiomeType): number {
    const seaLevel = Config.data.terrain.height.seaLevel;
    const dirtDepth = Config.data.terrain.height.dirtLayerDepth;

    if (y === 0) return BlockType.BEDROCK;

    if (y > surfaceHeight) {
      if (y <= seaLevel) return BlockType.WATER;
      return BlockType.AIR;
    }

    if (y === surfaceHeight) return this.getSurfaceBlock(biome, surfaceHeight);
    if (y >= surfaceHeight - dirtDepth) return this.getSubSurfaceBlock(biome);
    return BlockType.STONE;
  }

  private getSurfaceBlock(biome: BiomeType, surfaceHeight: number): number {
    if (surfaceHeight < Config.data.terrain.height.seaLevel) return BlockType.SAND;

    switch (biome) {
      case BiomeType.DESERT: return BlockType.SAND;
      case BiomeType.TUNDRA: return BlockType.SNOW;
      case BiomeType.MOUNTAINS: return surfaceHeight > 85 ? BlockType.STONE : BlockType.GRASS_BLOCK;
      case BiomeType.OCEAN: return BlockType.SAND;
      default: return BlockType.GRASS_BLOCK;
    }
  }

  private getSubSurfaceBlock(biome: BiomeType): number {
    switch (biome) {
      case BiomeType.DESERT: return BlockType.SANDSTONE;
      case BiomeType.TUNDRA: return BlockType.DIRT;
      case BiomeType.OCEAN: return BlockType.SAND;
      default: return BlockType.DIRT;
    }
  }
}
