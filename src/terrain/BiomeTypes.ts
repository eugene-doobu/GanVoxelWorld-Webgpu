export const enum BiomeType {
  PLAINS = 0,
  FOREST = 1,
  DESERT = 2,
  TUNDRA = 3,
  MOUNTAINS = 4,
  OCEAN = 5,
}

export interface BiomeParameters {
  temperature: number;   // [-1, 1]
  humidity: number;      // [-1, 1]
  continentalness: number; // [-1, 1]
}

export const BIOME_PARAMS: ReadonlyArray<{ biome: BiomeType; params: BiomeParameters }> = [
  { biome: BiomeType.OCEAN,     params: { temperature:  0.0, humidity:  0.5, continentalness: -0.7 } },
  { biome: BiomeType.PLAINS,    params: { temperature:  0.3, humidity:  0.0, continentalness:  0.2 } },
  { biome: BiomeType.FOREST,    params: { temperature:  0.2, humidity:  0.6, continentalness:  0.3 } },
  { biome: BiomeType.DESERT,    params: { temperature:  0.8, humidity: -0.7, continentalness:  0.4 } },
  { biome: BiomeType.TUNDRA,    params: { temperature: -0.8, humidity:  0.0, continentalness:  0.3 } },
  { biome: BiomeType.MOUNTAINS, params: { temperature: -0.2, humidity:  0.2, continentalness:  0.8 } },
];
