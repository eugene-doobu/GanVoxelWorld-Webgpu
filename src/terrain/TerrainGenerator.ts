import { FractalNoise } from '../noise/PerlinNoise';
import { Chunk } from './Chunk';
import { BlockType } from './BlockTypes';
import { BiomeType } from './BiomeTypes';
import {
  CHUNK_WIDTH, CHUNK_HEIGHT, CHUNK_DEPTH,
  NOISE_OCTAVES, NOISE_PERSISTENCE, NOISE_LACUNARITY, NOISE_SCALE,
  SEA_LEVEL, MIN_HEIGHT, MAX_HEIGHT, DIRT_LAYER_DEPTH, BIOME_SCALE,
} from '../constants';

export class TerrainGenerator {
  private heightNoise: FractalNoise;
  private tempNoise: FractalNoise;
  private humidNoise: FractalNoise;
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
    this.heightNoise = new FractalNoise(seed, NOISE_OCTAVES, NOISE_PERSISTENCE, NOISE_LACUNARITY, NOISE_SCALE);
    this.tempNoise = new FractalNoise(seed + 1000, NOISE_OCTAVES, NOISE_PERSISTENCE, NOISE_LACUNARITY, BIOME_SCALE);
    this.humidNoise = new FractalNoise(seed + 2000, NOISE_OCTAVES, NOISE_PERSISTENCE, NOISE_LACUNARITY, BIOME_SCALE);
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
    const noiseValue = this.heightNoise.sample(worldX, worldZ);
    let height = MIN_HEIGHT + Math.floor(noiseValue * (MAX_HEIGHT - MIN_HEIGHT));
    height = Math.max(MIN_HEIGHT, Math.min(CHUNK_HEIGHT - 1, height));

    const biome = this.getBiome(worldX, worldZ, height);

    for (let y = 0; y < CHUNK_HEIGHT; y++) {
      chunk.setBlock(localX, y, localZ, this.getBlockType(y, height, biome));
    }
  }

  getBiome(worldX: number, worldZ: number, surfaceHeight: number): BiomeType {
    if (surfaceHeight < SEA_LEVEL) return BiomeType.OCEAN;

    const temperature = this.tempNoise.sample(worldX, worldZ);
    const humidity = this.humidNoise.sample(worldX, worldZ);

    if (surfaceHeight > 90) return BiomeType.MOUNTAINS;
    if (temperature < 0.3) return BiomeType.TUNDRA;
    if (temperature > 0.7 && humidity < 0.4) return BiomeType.DESERT;
    if (humidity > 0.6) return BiomeType.FOREST;
    return BiomeType.PLAINS;
  }

  private getBlockType(y: number, surfaceHeight: number, biome: BiomeType): number {
    if (y === 0) return BlockType.BEDROCK;

    if (y > surfaceHeight) {
      if (y <= SEA_LEVEL) return BlockType.WATER;
      return BlockType.AIR;
    }

    if (y === surfaceHeight) return this.getSurfaceBlock(biome, surfaceHeight);
    if (y >= surfaceHeight - DIRT_LAYER_DEPTH) return this.getSubSurfaceBlock(biome);
    return BlockType.STONE;
  }

  private getSurfaceBlock(biome: BiomeType, surfaceHeight: number): number {
    if (surfaceHeight < SEA_LEVEL) return BlockType.SAND;

    switch (biome) {
      case BiomeType.DESERT: return BlockType.SAND;
      case BiomeType.TUNDRA: return BlockType.SNOW;
      case BiomeType.MOUNTAINS: return surfaceHeight > 100 ? BlockType.STONE : BlockType.GRASS_BLOCK;
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
