import { Chunk } from './Chunk';
import { BlockType, TorchFacing } from './BlockTypes';
import { BiomeType } from './BiomeTypes';
import { TerrainGenerator } from './TerrainGenerator';
import { SeededRandom } from '../noise/SeededRandom';
import { CHUNK_WIDTH, CHUNK_HEIGHT, CHUNK_DEPTH } from '../constants';

export class VillageGenerator {
  private villageCenterX: number;
  private villageCenterZ: number;
  private villageBaseY: number;
  private valid: boolean;

  private static readonly VILLAGE_RADIUS = 24;
  private static readonly BLEND_MARGIN = 6;

  constructor(seed: number, private terrainGen: TerrainGenerator) {
    const rng = new SeededRandom(seed + 77777);

    // Generate several candidates near spawn (-8 to +24)
    let bestX = 8;
    let bestZ = 8;
    let found = false;

    for (let i = 0; i < 12; i++) {
      const cx = rng.nextInt(-8, 25);
      const cz = rng.nextInt(-8, 25);
      const h = terrainGen.getSurfaceHeight(cx, cz);
      const biome = terrainGen.getBiome(cx, cz, h);
      if (biome === BiomeType.PLAINS || biome === BiomeType.FOREST) {
        bestX = cx;
        bestZ = cz;
        found = true;
        break;
      }
    }

    this.villageCenterX = bestX;
    this.villageCenterZ = bestZ;
    this.villageBaseY = terrainGen.getSurfaceHeight(bestX, bestZ);
    this.valid = found;
  }

  generate(chunk: Chunk): void {
    if (!this.valid) return;

    const r = VillageGenerator.VILLAGE_RADIUS + VillageGenerator.BLEND_MARGIN;
    // AABB overlap check
    const chunkMinX = chunk.worldOffsetX;
    const chunkMinZ = chunk.worldOffsetZ;
    const chunkMaxX = chunkMinX + CHUNK_WIDTH;
    const chunkMaxZ = chunkMinZ + CHUNK_DEPTH;

    const vilMinX = this.villageCenterX - r;
    const vilMaxX = this.villageCenterX + r;
    const vilMinZ = this.villageCenterZ - r;
    const vilMaxZ = this.villageCenterZ + r;

    if (chunkMaxX <= vilMinX || chunkMinX >= vilMaxX ||
        chunkMaxZ <= vilMinZ || chunkMinZ >= vilMaxZ) {
      return;
    }

    this.flattenTerrain(chunk);
    this.buildPlaza(chunk);
    this.buildWatchtower(chunk);
    this.buildHouse(chunk);
  }

  private setWorldBlock(chunk: Chunk, worldX: number, worldY: number, worldZ: number, blockType: number): void {
    const localX = worldX - chunk.worldOffsetX;
    const localZ = worldZ - chunk.worldOffsetZ;
    if (localX < 0 || localX >= CHUNK_WIDTH || localZ < 0 || localZ >= CHUNK_DEPTH) return;
    if (worldY < 0 || worldY >= CHUNK_HEIGHT) return;
    chunk.setBlock(localX, worldY, localZ, blockType);
  }

  private setTorchBlock(chunk: Chunk, worldX: number, worldY: number, worldZ: number, facing: TorchFacing): void {
    const localX = worldX - chunk.worldOffsetX;
    const localZ = worldZ - chunk.worldOffsetZ;
    if (localX < 0 || localX >= CHUNK_WIDTH || localZ < 0 || localZ >= CHUNK_DEPTH) return;
    if (worldY < 0 || worldY >= CHUNK_HEIGHT) return;
    chunk.setBlockWithMeta(localX, worldY, localZ, BlockType.TORCH, facing);
  }

  private getWorldBlock(chunk: Chunk, worldX: number, worldY: number, worldZ: number): number {
    const localX = worldX - chunk.worldOffsetX;
    const localZ = worldZ - chunk.worldOffsetZ;
    if (localX < 0 || localX >= CHUNK_WIDTH || localZ < 0 || localZ >= CHUNK_DEPTH) return -1;
    if (worldY < 0 || worldY >= CHUNK_HEIGHT) return -1;
    return chunk.getBlock(localX, worldY, localZ);
  }

  private flattenTerrain(chunk: Chunk): void {
    const cx = this.villageCenterX;
    const cz = this.villageCenterZ;
    const baseY = this.villageBaseY;
    const totalR = VillageGenerator.VILLAGE_RADIUS + VillageGenerator.BLEND_MARGIN;
    const innerR = VillageGenerator.VILLAGE_RADIUS;

    for (let wx = cx - totalR; wx <= cx + totalR; wx++) {
      for (let wz = cz - totalR; wz <= cz + totalR; wz++) {
        const localX = wx - chunk.worldOffsetX;
        const localZ = wz - chunk.worldOffsetZ;
        if (localX < 0 || localX >= CHUNK_WIDTH || localZ < 0 || localZ >= CHUNK_DEPTH) continue;

        const dx = wx - cx;
        const dz = wz - cz;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > totalR) continue;

        const originalY = this.terrainGen.getSurfaceHeight(wx, wz);
        let targetY: number;

        if (dist <= innerR) {
          targetY = baseY;
        } else {
          // Linear blend from baseY to originalY in the margin zone
          const t = (dist - innerR) / VillageGenerator.BLEND_MARGIN;
          targetY = Math.round(baseY + (originalY - baseY) * t);
        }

        // Fill column: above targetY → AIR, surface → GRASS_BLOCK, below → DIRT
        for (let y = targetY + 1; y < CHUNK_HEIGHT; y++) {
          chunk.setBlock(localX, y, localZ, BlockType.AIR);
        }
        chunk.setBlock(localX, targetY, localZ, BlockType.GRASS_BLOCK);
        for (let y = targetY - 1; y >= targetY - 3 && y > 0; y--) {
          chunk.setBlock(localX, y, localZ, BlockType.DIRT);
        }
      }
    }
  }

  private buildPlaza(chunk: Chunk): void {
    const cx = this.villageCenterX;
    const cz = this.villageCenterZ;
    const y = this.villageBaseY;
    const plazaRadius = 6;

    // Circular cobblestone floor
    for (let dx = -plazaRadius; dx <= plazaRadius; dx++) {
      for (let dz = -plazaRadius; dz <= plazaRadius; dz++) {
        if (dx * dx + dz * dz <= plazaRadius * plazaRadius) {
          this.setWorldBlock(chunk, cx + dx, y, cz + dz, BlockType.COBBLESTONE);
        }
      }
    }

    // 8 torch pillars around the plaza (octagonal arrangement)
    const torchPositions = [
      [-5, 0], [5, 0], [0, -5], [0, 5],
      [-4, -4], [4, -4], [-4, 4], [4, 4],
    ];

    for (const [tx, tz] of torchPositions) {
      // Stone pillar 2 blocks tall
      this.setWorldBlock(chunk, cx + tx, y + 1, cz + tz, BlockType.COBBLESTONE);
      this.setWorldBlock(chunk, cx + tx, y + 2, cz + tz, BlockType.COBBLESTONE);
      // Torch on top (floor torch on pillar)
      this.setTorchBlock(chunk, cx + tx, y + 3, cz + tz, TorchFacing.FLOOR);
    }
  }

  private buildWatchtower(chunk: Chunk): void {
    const tx = this.villageCenterX + 2;
    const tz = this.villageCenterZ + 2;
    const baseY = this.villageBaseY;
    const towerHeight = 16;
    const wallSize = 5; // 5x5 outer, 3x3 interior

    // Build 5x5 hollow stone brick walls
    for (let dy = 1; dy <= towerHeight; dy++) {
      const wy = baseY + dy;
      for (let dx = 0; dx < wallSize; dx++) {
        for (let dz = 0; dz < wallSize; dz++) {
          const isWall = dx === 0 || dx === wallSize - 1 || dz === 0 || dz === wallSize - 1;
          if (isWall) {
            this.setWorldBlock(chunk, tx + dx, wy, tz + dz, BlockType.STONE_BRICKS);
          } else {
            // Clear interior
            this.setWorldBlock(chunk, tx + dx, wy, tz + dz, BlockType.AIR);
          }
        }
      }
    }

    // Window openings on each wall face at levels 5-7
    for (let dy = 5; dy <= 7; dy++) {
      const wy = baseY + dy;
      // North wall center (dz=0, dx=2)
      this.setWorldBlock(chunk, tx + 2, wy, tz, BlockType.GLASS);
      // South wall center (dz=4, dx=2)
      this.setWorldBlock(chunk, tx + 2, wy, tz + 4, BlockType.GLASS);
      // West wall center (dx=0, dz=2)
      this.setWorldBlock(chunk, tx, wy, tz + 2, BlockType.GLASS);
      // East wall center (dx=4, dz=2)
      this.setWorldBlock(chunk, tx + 4, wy, tz + 2, BlockType.GLASS);
    }

    // Top platform: 7x7 stone brick platform overhanging 1 block each side
    const topY = baseY + towerHeight + 1;
    for (let dx = -1; dx <= wallSize; dx++) {
      for (let dz = -1; dz <= wallSize; dz++) {
        this.setWorldBlock(chunk, tx + dx, topY, tz + dz, BlockType.STONE_BRICKS);
      }
    }

    // Railing (1-block high wall around platform edge)
    const railY = topY + 1;
    for (let dx = -1; dx <= wallSize; dx++) {
      for (let dz = -1; dz <= wallSize; dz++) {
        const isEdge = dx === -1 || dx === wallSize || dz === -1 || dz === wallSize;
        if (isEdge) {
          this.setWorldBlock(chunk, tx + dx, railY, tz + dz, BlockType.STONE_BRICKS);
        }
      }
    }

    // Torch beacons on top: 4 corners + 1 center (floor torches)
    const torchY = railY + 1;
    this.setTorchBlock(chunk, tx - 1, torchY, tz - 1, TorchFacing.FLOOR);
    this.setTorchBlock(chunk, tx + wallSize, torchY, tz - 1, TorchFacing.FLOOR);
    this.setTorchBlock(chunk, tx - 1, torchY, tz + wallSize, TorchFacing.FLOOR);
    this.setTorchBlock(chunk, tx + wallSize, torchY, tz + wallSize, TorchFacing.FLOOR);
    // Center top torch pillar
    this.setWorldBlock(chunk, tx + 2, topY + 1, tz + 2, BlockType.STONE_BRICKS);
    this.setTorchBlock(chunk, tx + 2, topY + 2, tz + 2, TorchFacing.FLOOR);

    // Interior wall torches (level 3, on south and north walls)
    this.setTorchBlock(chunk, tx + 2, baseY + 3, tz + 1, TorchFacing.SOUTH);
    this.setTorchBlock(chunk, tx + 2, baseY + 3, tz + 3, TorchFacing.NORTH);

    // Entrance door opening (south face, ground level)
    this.setWorldBlock(chunk, tx + 2, baseY + 1, tz + 4, BlockType.AIR);
    this.setWorldBlock(chunk, tx + 2, baseY + 2, tz + 4, BlockType.AIR);
  }

  private buildHouse(chunk: Chunk): void {
    const hx = this.villageCenterX - 8;
    const hz = this.villageCenterZ - 6;
    const baseY = this.villageBaseY;
    const width = 7;
    const depth = 5;
    const wallHeight = 5;

    // Floor
    for (let dx = 0; dx < width; dx++) {
      for (let dz = 0; dz < depth; dz++) {
        this.setWorldBlock(chunk, hx + dx, baseY, hz + dz, BlockType.PLANKS);
      }
    }

    // Walls
    for (let dy = 1; dy <= wallHeight; dy++) {
      const wy = baseY + dy;
      for (let dx = 0; dx < width; dx++) {
        for (let dz = 0; dz < depth; dz++) {
          const isWall = dx === 0 || dx === width - 1 || dz === 0 || dz === depth - 1;
          if (isWall) {
            this.setWorldBlock(chunk, hx + dx, wy, hz + dz, BlockType.PLANKS);
          } else {
            this.setWorldBlock(chunk, hx + dx, wy, hz + dz, BlockType.AIR);
          }
        }
      }
    }

    // Corner pillars (LOG)
    for (let dy = 1; dy <= wallHeight; dy++) {
      const wy = baseY + dy;
      this.setWorldBlock(chunk, hx, wy, hz, BlockType.LOG);
      this.setWorldBlock(chunk, hx + width - 1, wy, hz, BlockType.LOG);
      this.setWorldBlock(chunk, hx, wy, hz + depth - 1, BlockType.LOG);
      this.setWorldBlock(chunk, hx + width - 1, wy, hz + depth - 1, BlockType.LOG);
    }

    // Windows on each long wall (level 2-3, center)
    for (let dy = 2; dy <= 3; dy++) {
      const wy = baseY + dy;
      // Front wall (dz=0), two windows
      this.setWorldBlock(chunk, hx + 2, wy, hz, BlockType.GLASS);
      this.setWorldBlock(chunk, hx + 4, wy, hz, BlockType.GLASS);
      // Back wall (dz=depth-1), two windows
      this.setWorldBlock(chunk, hx + 2, wy, hz + depth - 1, BlockType.GLASS);
      this.setWorldBlock(chunk, hx + 4, wy, hz + depth - 1, BlockType.GLASS);
    }

    // Door (front wall center, ground level)
    this.setWorldBlock(chunk, hx + 3, baseY + 1, hz, BlockType.AIR);
    this.setWorldBlock(chunk, hx + 3, baseY + 2, hz, BlockType.AIR);

    // Flat roof
    const roofY = baseY + wallHeight + 1;
    for (let dx = -1; dx <= width; dx++) {
      for (let dz = -1; dz <= depth; dz++) {
        this.setWorldBlock(chunk, hx + dx, roofY, hz + dz, BlockType.LOG);
      }
    }

    // Interior wall torch (on east wall)
    this.setTorchBlock(chunk, hx + 1, baseY + 3, hz + 2, TorchFacing.EAST);
  }
}
