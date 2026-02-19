import { TILE_SIZE, ATLAS_TILES, ATLAS_PIXEL_SIZE } from '../constants';
import { getBlockColor, getBlockMaterial, ALL_BLOCK_TYPES, isBlockCrossMesh } from '../terrain/BlockTypes';
import { BlockType } from '../terrain/BlockTypes';
import { WebGPUContext } from './WebGPUContext';

// Simple integer hash for deterministic pseudo-random patterns
function hash(x: number, y: number, seed: number): number {
  let h = (seed + x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296; // [0, 1]
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function mixColor(
  r: number, g: number, b: number,
  factor: number, // -1..+1: negative = darken, positive = lighten
): [number, number, number] {
  if (factor > 0) {
    return [
      clamp(Math.round(r + (255 - r) * factor), 0, 255),
      clamp(Math.round(g + (255 - g) * factor), 0, 255),
      clamp(Math.round(b + (255 - b) * factor), 0, 255),
    ];
  }
  return [
    clamp(Math.round(r * (1 + factor)), 0, 255),
    clamp(Math.round(g * (1 + factor)), 0, 255),
    clamp(Math.round(b * (1 + factor)), 0, 255),
  ];
}

type PixelWriter = (x: number, y: number, r: number, g: number, b: number, a: number) => void;
type MaterialWriter = (x: number, y: number, roughness: number, metallic: number, emissive: number) => void;

// ---- Pattern generators per block type ----

function patternStone(
  px: number, py: number, br: number, bg: number, bb: number,
): [number, number, number] {
  const h1 = hash(px, py, 1);
  const h2 = hash(px, py, 2);
  let f = (h1 - 0.5) * 0.25; // subtle brightness variation
  // Occasional dark crack spots
  if (h2 < 0.08) f = -0.15;
  // Occasional lighter specks
  else if (h2 > 0.92) f = 0.10;
  return mixColor(br, bg, bb, f);
}

function patternDirt(
  px: number, py: number, br: number, bg: number, bb: number,
): [number, number, number] {
  const h1 = hash(px, py, 10);
  const h2 = hash(px, py, 11);
  let f = (h1 - 0.5) * 0.20;
  // Small stone particle specks
  if (h2 < 0.06) {
    return mixColor(160, 150, 140, (h1 - 0.5) * 0.1);
  }
  // Slight hue shift (warmer/cooler dirt)
  const rShift = (h2 - 0.5) * 8;
  return mixColor(
    clamp(br + rShift, 0, 255),
    bg,
    bb,
    f,
  );
}

function patternGrass(
  px: number, py: number, br: number, bg: number, bb: number,
): [number, number, number] {
  const h1 = hash(px, py, 20);
  const h2 = hash(px, py, 21);
  let f = (h1 - 0.5) * 0.18;
  // Vertical grass blade stripes
  if (px % 3 === 0 && h2 > 0.4) f += 0.08;
  if (px % 5 === 2 && h2 < 0.6) f -= 0.06;
  // Occasional yellow-green spot
  if (h2 > 0.93) {
    return mixColor(br + 15, bg + 10, bb - 5, f);
  }
  return mixColor(br, bg, bb, f);
}

function patternSand(
  px: number, py: number, br: number, bg: number, bb: number,
): [number, number, number] {
  const h1 = hash(px, py, 30);
  const h2 = hash(px, py, 31);
  let f = (h1 - 0.5) * 0.10; // very subtle
  // Fine grain: occasional darker/lighter grain
  if (h2 < 0.05) f -= 0.08;
  if (h2 > 0.95) f += 0.06;
  return mixColor(br, bg, bb, f);
}

function patternSandstone(
  px: number, py: number, br: number, bg: number, bb: number,
): [number, number, number] {
  const h1 = hash(px, py, 40);
  // Horizontal stripe layers
  const layer = (py % 4);
  let f = 0;
  if (layer === 0) f = -0.08;
  else if (layer === 1) f = 0.04;
  else if (layer === 2) f = -0.03;
  else f = 0.06;
  f += (h1 - 0.5) * 0.08;
  return mixColor(br, bg, bb, f);
}

function patternLog(
  px: number, py: number, br: number, bg: number, bb: number,
): [number, number, number] {
  const h1 = hash(px, py, 50);
  // Vertical wood grain pattern
  const cx = 7.5, cy = 7.5;
  const dx = px - cx, dy = py - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const ring = Math.sin(dist * 1.8) * 0.12;
  let f = ring + (h1 - 0.5) * 0.10;
  // Darker bark lines vertical
  if (px === 0 || px === 15 || px === 1 || px === 14) {
    f -= 0.12;
  }
  return mixColor(br, bg, bb, f);
}

function patternLeaves(
  px: number, py: number, br: number, bg: number, bb: number,
): [number, number, number] {
  const h1 = hash(px, py, 60);
  const h2 = hash(px, py, 61);
  // Irregular leaf pattern: clusters of light/dark
  let f = (h1 - 0.5) * 0.30;
  // Transparent gaps (darker spots suggesting depth)
  if (h2 < 0.15) f = -0.20;
  // Bright leaf highlights
  if (h2 > 0.85) f = 0.15;
  return mixColor(br, bg, bb, f);
}

function patternWater(
  px: number, py: number, br: number, bg: number, bb: number,
): [number, number, number] {
  const h1 = hash(px, py, 70);
  // Wave pattern: gentle horizontal sine
  const wave = Math.sin((px + py * 0.5) * 0.8) * 0.08;
  const f = wave + (h1 - 0.5) * 0.06;
  return mixColor(br, bg, bb, f);
}

function patternSnow(
  px: number, py: number, br: number, bg: number, bb: number,
): [number, number, number] {
  const h1 = hash(px, py, 80);
  const h2 = hash(px, py, 81);
  // Very subtle crystal sparkle
  let f = (h1 - 0.5) * 0.05;
  // Occasional tiny crystal highlight
  if (h2 > 0.92) f = 0.04;
  if (h2 < 0.05) f = -0.03;
  return mixColor(br, bg, bb, f);
}

function patternIce(
  px: number, py: number, br: number, bg: number, bb: number,
): [number, number, number] {
  const h1 = hash(px, py, 90);
  const h2 = hash(px, py, 91);
  let f = (h1 - 0.5) * 0.08;
  // Crack lines: diagonal patterns
  const diag1 = Math.abs((px - py) % 7);
  const diag2 = Math.abs((px + py - 10) % 9);
  if (diag1 === 0 && h2 > 0.5) f = -0.15;
  if (diag2 === 0 && h2 < 0.4) f = -0.12;
  return mixColor(br, bg, bb, f);
}

function patternOre(
  px: number, py: number, br: number, bg: number, bb: number,
  oreR: number, oreG: number, oreB: number,
  stoneR: number, stoneG: number, stoneB: number,
): [number, number, number] {
  const h1 = hash(px, py, 100);
  const h2 = hash(px, py, 101);
  const h3 = hash(px, py, 102);
  // Stone background with cracks
  let r = stoneR, g = stoneG, b = stoneB;
  const stoneF = (h1 - 0.5) * 0.20;
  [r, g, b] = mixColor(r, g, b, stoneF);

  // Ore veins: clustered spots
  const cx1 = 4 + hash(0, 0, br) * 5;
  const cy1 = 4 + hash(0, 0, bg) * 5;
  const cx2 = 9 + hash(1, 1, br) * 4;
  const cy2 = 9 + hash(1, 1, bg) * 4;
  const dist1 = Math.abs(px - cx1) + Math.abs(py - cy1);
  const dist2 = Math.abs(px - cx2) + Math.abs(py - cy2);

  if ((dist1 < 2.5 && h2 > 0.3) || (dist2 < 2.5 && h3 > 0.3) || h2 < 0.06) {
    const oreF = (h3 - 0.5) * 0.15;
    return mixColor(oreR, oreG, oreB, oreF);
  }

  return [r, g, b];
}

function patternCobblestone(
  px: number, py: number, br: number, bg: number, bb: number,
): [number, number, number] {
  const h1 = hash(px, py, 110);
  const h2 = hash(px, py, 111);
  // Cobblestone grid with mortar lines
  const cellX = (px + Math.floor(hash(0, py, 112) * 3)) % 5;
  const cellY = (py + Math.floor(hash(px, 0, 113) * 3)) % 4;
  let f = (h1 - 0.5) * 0.25;
  // Mortar lines (gaps between stones) are darker
  if (cellX === 0 || cellY === 0) {
    f -= 0.18;
  }
  // Occasional rough bright stone face
  if (h2 > 0.88) f += 0.10;
  return mixColor(br, bg, bb, f);
}

function patternBedrock(
  px: number, py: number, br: number, bg: number, bb: number,
): [number, number, number] {
  const h1 = hash(px, py, 120);
  const h2 = hash(px, py, 121);
  // Very dark, chaotic pattern
  let f = (h1 - 0.5) * 0.30;
  if (h2 < 0.2) f = -0.25; // dark void spots
  if (h2 > 0.9) f = 0.10;  // faint lighter spots
  return mixColor(br, bg, bb, f);
}

function patternGravel(
  px: number, py: number, br: number, bg: number, bb: number,
): [number, number, number] {
  const h1 = hash(px, py, 130);
  const h2 = hash(px, py, 131);
  // Mix of different grey tones: pebbles
  let f = (h1 - 0.5) * 0.30;
  // Large pebble blobs
  const blobPhase = hash(Math.floor(px / 3), Math.floor(py / 3), 132);
  f += (blobPhase - 0.5) * 0.15;
  // Occasional reddish/brownish pebble
  if (h2 > 0.9) {
    return mixColor(br + 10, bg - 5, bb - 10, f);
  }
  return mixColor(br, bg, bb, f);
}

function patternLava(
  px: number, py: number, br: number, bg: number, bb: number,
): [number, number, number] {
  const h1 = hash(px, py, 140);
  const h2 = hash(px, py, 141);
  // Dark crust with bright orange/red cracks
  const crustDark = 0.35; // how much to darken base for crust
  // Crack pattern using voronoi-like closest hash
  const cx = px + (h1 - 0.5) * 2;
  const cy = py + (h2 - 0.5) * 2;
  const crack1 = Math.abs(Math.sin(cx * 1.2 + cy * 0.7)) ;
  const crack2 = Math.abs(Math.sin(cx * 0.5 - cy * 1.5));
  const crackVal = Math.min(crack1, crack2);

  if (crackVal < 0.3) {
    // Bright glowing crack
    const glow = 1.0 - crackVal / 0.3;
    return [
      clamp(Math.round(255 * (0.8 + glow * 0.2)), 0, 255),
      clamp(Math.round(120 * glow), 0, 255),
      clamp(Math.round(20 * glow), 0, 255),
    ];
  }
  // Dark crust
  return mixColor(br, bg, bb, -crustDark + (h1 - 0.5) * 0.10);
}

function patternClay(
  px: number, py: number, br: number, bg: number, bb: number,
): [number, number, number] {
  const h1 = hash(px, py, 150);
  // Smooth with subtle horizontal banding
  const band = Math.sin(py * 0.9) * 0.06;
  const f = band + (h1 - 0.5) * 0.08;
  return mixColor(br, bg, bb, f);
}

function patternMossyCobblestone(
  px: number, py: number, br: number, bg: number, bb: number,
): [number, number, number] {
  const h1 = hash(px, py, 160);
  const h2 = hash(px, py, 161);
  // Cobblestone base
  const cellX = (px + Math.floor(hash(0, py, 162) * 3)) % 5;
  const cellY = (py + Math.floor(hash(px, 0, 163) * 3)) % 4;
  let f = (h1 - 0.5) * 0.22;
  if (cellX === 0 || cellY === 0) f -= 0.15;
  // Moss patches: greenish tint in lower parts
  if (h2 > 0.6 && py > 8) {
    const mossR = clamp(br - 20, 0, 255);
    const mossG = clamp(bg + 15, 0, 255);
    const mossB = clamp(bb - 15, 0, 255);
    return mixColor(mossR, mossG, mossB, f);
  }
  return mixColor(br, bg, bb, f);
}

function patternSpawner(
  px: number, py: number, br: number, bg: number, bb: number,
): [number, number, number] {
  const h1 = hash(px, py, 170);
  const h2 = hash(px, py, 171);
  // Dark iron cage bars
  let f = (h1 - 0.5) * 0.15;
  // Grid bars
  if (px % 4 === 0 || py % 4 === 0) {
    f += 0.12;
  }
  // Dark inner void
  if (px > 2 && px < 13 && py > 2 && py < 13 && (px % 4 !== 0 && py % 4 !== 0)) {
    f -= 0.15;
  }
  return mixColor(br, bg, bb, f);
}

function patternChest(
  px: number, py: number, br: number, bg: number, bb: number,
): [number, number, number] {
  const h1 = hash(px, py, 180);
  let f = (h1 - 0.5) * 0.12;
  // Plank lines horizontal
  if (py % 4 === 0) f -= 0.12;
  // Border darker
  if (px === 0 || px === 15 || py === 0 || py === 15) f -= 0.18;
  // Latch in center
  if (px >= 6 && px <= 9 && py >= 6 && py <= 8) {
    return mixColor(180, 160, 60, f);
  }
  return mixColor(br, bg, bb, f);
}

function patternTallGrass(
  px: number, py: number,
): [number, number, number, number] {
  // 5 grass blades growing from bottom to top
  const blades = [
    { cx: 3, w: 1.5 },
    { cx: 6, w: 1.2 },
    { cx: 8, w: 1.8 },
    { cx: 11, w: 1.3 },
    { cx: 13, w: 1.0 },
  ];
  const h = hash(px, py, 500);
  const iy = 15 - py; // invert: 0=top, 15=bottom
  for (const blade of blades) {
    // Blade narrows toward the top
    const widthAtY = blade.w * (1.0 - iy / 18.0);
    if (Math.abs(px - blade.cx) < widthAtY) {
      // Gradient: darker at bottom, lighter at top
      const brightness = 0.6 + 0.4 * (iy / 15.0);
      const r = clamp(Math.round(45 * brightness + h * 15), 0, 255);
      const g = clamp(Math.round(140 * brightness + h * 20), 0, 255);
      const b = clamp(Math.round(30 * brightness + h * 10), 0, 255);
      return [r, g, b, 255];
    }
  }
  return [0, 0, 0, 0]; // transparent
}

function patternPoppy(
  px: number, py: number,
): [number, number, number, number] {
  const h = hash(px, py, 510);
  const iy = 15 - py; // 0=top, 15=bottom

  // Stem: thin vertical line in center
  if (iy < 10 && Math.abs(px - 8) < 1) {
    const g = clamp(Math.round(100 + h * 40), 0, 255);
    return [30, g, 20, 255];
  }

  // Flower head: circle at top
  const dx = px - 8;
  const dy = iy - 12;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 3.5) {
    // Red petals
    const r = clamp(Math.round(200 + h * 40), 0, 255);
    const g = clamp(Math.round(20 + h * 15), 0, 255);
    const b = clamp(Math.round(20 + h * 10), 0, 255);
    // Center yellow
    if (dist < 1.2) {
      return [clamp(Math.round(230 + h * 20), 0, 255), clamp(Math.round(200 + h * 20), 0, 255), 40, 255];
    }
    return [r, g, b, 255];
  }

  return [0, 0, 0, 0]; // transparent
}

function patternDandelion(
  px: number, py: number,
): [number, number, number, number] {
  const h = hash(px, py, 520);
  const iy = 15 - py; // 0=top, 15=bottom

  // Stem
  if (iy < 10 && Math.abs(px - 8) < 1) {
    const g = clamp(Math.round(110 + h * 30), 0, 255);
    return [35, g, 25, 255];
  }

  // Yellow flower head: smaller circle
  const dx = px - 8;
  const dy = iy - 12;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 2.8) {
    const r = clamp(Math.round(240 + h * 15), 0, 255);
    const g = clamp(Math.round(200 + h * 20), 0, 255);
    const b = clamp(Math.round(30 + h * 15), 0, 255);
    return [r, g, b, 255];
  }

  return [0, 0, 0, 0]; // transparent
}

function patternDefault(
  px: number, py: number, br: number, bg: number, bb: number,
): [number, number, number] {
  const h1 = hash(px, py, 999);
  const f = (h1 - 0.5) * 0.15;
  return mixColor(br, bg, bb, f);
}

// ---- Normal map height generators per block type ----

function generateHeightMap(blockType: number): number[][] {
  const h = Array.from({ length: TILE_SIZE }, () => new Array(TILE_SIZE).fill(0));

  switch (blockType) {
    case BlockType.STONE: {
      // Rough stone surface with cracks
      for (let y = 0; y < TILE_SIZE; y++)
        for (let x = 0; x < TILE_SIZE; x++) {
          const h1 = hash(x, y, 301);
          const h2 = hash(x, y, 302);
          h[y][x] = h1 * 0.6 + (h2 > 0.92 ? -0.3 : h2 < 0.08 ? 0.3 : 0);
        }
      break;
    }
    case BlockType.COBBLESTONE: {
      // Very rough cobble with mortar gaps
      for (let y = 0; y < TILE_SIZE; y++)
        for (let x = 0; x < TILE_SIZE; x++) {
          const cellX = (x + Math.floor(hash(0, y, 312) * 3)) % 5;
          const cellY = (y + Math.floor(hash(x, 0, 313) * 3)) % 4;
          const h1 = hash(x, y, 310);
          h[y][x] = (cellX === 0 || cellY === 0) ? 0.0 : 0.4 + h1 * 0.4;
        }
      break;
    }
    case BlockType.MOSSY_COBBLESTONE: {
      // Similar to cobblestone but with moss in lower area
      for (let y = 0; y < TILE_SIZE; y++)
        for (let x = 0; x < TILE_SIZE; x++) {
          const cellX = (x + Math.floor(hash(0, y, 362) * 3)) % 5;
          const cellY = (y + Math.floor(hash(x, 0, 363) * 3)) % 4;
          const h1 = hash(x, y, 360);
          const base = (cellX === 0 || cellY === 0) ? 0.0 : 0.35 + h1 * 0.35;
          h[y][x] = y > 8 && hash(x, y, 361) > 0.5 ? base * 0.7 : base;
        }
      break;
    }
    case BlockType.DIRT: {
      // Fine granular bumps
      for (let y = 0; y < TILE_SIZE; y++)
        for (let x = 0; x < TILE_SIZE; x++) {
          h[y][x] = hash(x, y, 320) * 0.25;
        }
      break;
    }
    case BlockType.GRASS_BLOCK: {
      // Grass blade-like vertical lines
      for (let y = 0; y < TILE_SIZE; y++)
        for (let x = 0; x < TILE_SIZE; x++) {
          const h1 = hash(x, y, 325);
          h[y][x] = (x % 3 === 0 ? 0.15 : 0) + h1 * 0.2;
        }
      break;
    }
    case BlockType.SAND: {
      // Very fine grain bumps
      for (let y = 0; y < TILE_SIZE; y++)
        for (let x = 0; x < TILE_SIZE; x++) {
          h[y][x] = hash(x, y, 330) * 0.12;
        }
      break;
    }
    case BlockType.SANDSTONE: {
      // Horizontal layer lines
      for (let y = 0; y < TILE_SIZE; y++)
        for (let x = 0; x < TILE_SIZE; x++) {
          const layer = y % 4;
          const base = layer === 0 ? 0.0 : layer === 2 ? 0.3 : 0.15;
          h[y][x] = base + hash(x, y, 340) * 0.1;
        }
      break;
    }
    case BlockType.LOG: {
      // Wood grain vertical bumps
      for (let y = 0; y < TILE_SIZE; y++)
        for (let x = 0; x < TILE_SIZE; x++) {
          const cx = 7.5, cy = 7.5;
          const dx = x - cx, dy = y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const ring = (Math.sin(dist * 1.8) * 0.5 + 0.5) * 0.3;
          const bark = (x === 0 || x === 15 || x === 1 || x === 14) ? -0.15 : 0;
          h[y][x] = ring + bark + hash(x, y, 350) * 0.08;
        }
      break;
    }
    case BlockType.BEDROCK: {
      // Strong irregular bumps
      for (let y = 0; y < TILE_SIZE; y++)
        for (let x = 0; x < TILE_SIZE; x++) {
          const h1 = hash(x, y, 370);
          const h2 = hash(x, y, 371);
          h[y][x] = h1 * 0.7 + (h2 < 0.2 ? -0.3 : 0);
        }
      break;
    }
    case BlockType.GRAVEL: {
      // Pebble-like blobs
      for (let y = 0; y < TILE_SIZE; y++)
        for (let x = 0; x < TILE_SIZE; x++) {
          const blob = hash(Math.floor(x / 3), Math.floor(y / 3), 380);
          h[y][x] = blob * 0.5 + hash(x, y, 381) * 0.15;
        }
      break;
    }
    case BlockType.CLAY: {
      // Smooth with subtle horizontal banding
      for (let y = 0; y < TILE_SIZE; y++)
        for (let x = 0; x < TILE_SIZE; x++) {
          h[y][x] = (Math.sin(y * 0.9) * 0.5 + 0.5) * 0.15 + hash(x, y, 385) * 0.05;
        }
      break;
    }
    case BlockType.SNOW: {
      // Very subtle sparkle
      for (let y = 0; y < TILE_SIZE; y++)
        for (let x = 0; x < TILE_SIZE; x++) {
          h[y][x] = hash(x, y, 390) * 0.06;
        }
      break;
    }
    case BlockType.ICE: {
      // Crack lines
      for (let y = 0; y < TILE_SIZE; y++)
        for (let x = 0; x < TILE_SIZE; x++) {
          const diag1 = Math.abs((x - y) % 7);
          const diag2 = Math.abs((x + y - 10) % 9);
          const isCrack = (diag1 === 0 || diag2 === 0) ? 1 : 0;
          h[y][x] = isCrack * -0.2 + hash(x, y, 395) * 0.05;
        }
      break;
    }
    case BlockType.LEAVES: {
      // Irregular leaf bumps
      for (let y = 0; y < TILE_SIZE; y++)
        for (let x = 0; x < TILE_SIZE; x++) {
          const h1 = hash(x, y, 400);
          h[y][x] = h1 * 0.35;
        }
      break;
    }
    case BlockType.LAVA: {
      // Lava crust ridges
      for (let y = 0; y < TILE_SIZE; y++)
        for (let x = 0; x < TILE_SIZE; x++) {
          const h1 = hash(x, y, 140);
          const h2 = hash(x, y, 141);
          const cx = x + (h1 - 0.5) * 2;
          const cy = y + (h2 - 0.5) * 2;
          const crack1 = Math.abs(Math.sin(cx * 1.2 + cy * 0.7));
          const crack2 = Math.abs(Math.sin(cx * 0.5 - cy * 1.5));
          h[y][x] = Math.min(crack1, crack2) < 0.3 ? 0.0 : 0.4 + hash(x, y, 405) * 0.2;
        }
      break;
    }
    case BlockType.COAL_ORE:
    case BlockType.IRON_ORE:
    case BlockType.GOLD_ORE:
    case BlockType.DIAMOND_ORE: {
      // Stone base with ore vein dips
      for (let y = 0; y < TILE_SIZE; y++)
        for (let x = 0; x < TILE_SIZE; x++) {
          const h1 = hash(x, y, 301);
          const h2 = hash(x, y, 101);
          const cx1 = 4 + hash(0, 0, blockType + 200) * 5;
          const cy1 = 4 + hash(0, 0, blockType + 210) * 5;
          const cx2 = 9 + hash(1, 1, blockType + 200) * 4;
          const cy2 = 9 + hash(1, 1, blockType + 210) * 4;
          const dist1 = Math.abs(x - cx1) + Math.abs(y - cy1);
          const dist2 = Math.abs(x - cx2) + Math.abs(y - cy2);
          const isOre = (dist1 < 2.5 && h2 > 0.3) || (dist2 < 2.5 && hash(x, y, 102) > 0.3);
          h[y][x] = isOre ? 0.15 + hash(x, y, 410) * 0.1 : 0.3 + h1 * 0.3;
        }
      break;
    }
    case BlockType.SPAWNER: {
      // Grid bars raised
      for (let y = 0; y < TILE_SIZE; y++)
        for (let x = 0; x < TILE_SIZE; x++) {
          h[y][x] = (x % 4 === 0 || y % 4 === 0) ? 0.5 : 0.1;
        }
      break;
    }
    case BlockType.CHEST: {
      // Plank lines and border
      for (let y = 0; y < TILE_SIZE; y++)
        for (let x = 0; x < TILE_SIZE; x++) {
          const isBorder = x === 0 || x === 15 || y === 0 || y === 15;
          const isPlank = y % 4 === 0;
          const isLatch = x >= 6 && x <= 9 && y >= 6 && y <= 8;
          h[y][x] = isLatch ? 0.6 : isBorder ? 0.1 : isPlank ? 0.15 : 0.35 + hash(x, y, 420) * 0.1;
        }
      break;
    }
    case BlockType.TALL_GRASS:
    case BlockType.POPPY:
    case BlockType.DANDELION: {
      // Nearly flat for vegetation
      for (let y = 0; y < TILE_SIZE; y++)
        for (let x = 0; x < TILE_SIZE; x++) {
          h[y][x] = hash(x, y, 430) * 0.05;
        }
      break;
    }
    default: {
      // Subtle default bumps
      for (let y = 0; y < TILE_SIZE; y++)
        for (let x = 0; x < TILE_SIZE; x++) {
          h[y][x] = hash(x, y, 499) * 0.15;
        }
      break;
    }
  }

  return h;
}

function getNormalStrength(blockType: number): number {
  switch (blockType) {
    case BlockType.STONE: return 1.5;
    case BlockType.COBBLESTONE: return 2.0;
    case BlockType.MOSSY_COBBLESTONE: return 1.8;
    case BlockType.DIRT: return 0.8;
    case BlockType.GRASS_BLOCK: return 0.7;
    case BlockType.SAND: return 0.4;
    case BlockType.SANDSTONE: return 1.2;
    case BlockType.LOG: return 1.0;
    case BlockType.BEDROCK: return 2.5;
    case BlockType.GRAVEL: return 1.5;
    case BlockType.CLAY: return 0.5;
    case BlockType.SNOW: return 0.2;
    case BlockType.ICE: return 0.6;
    case BlockType.LEAVES: return 1.0;
    case BlockType.LAVA: return 1.2;
    case BlockType.COAL_ORE:
    case BlockType.IRON_ORE:
    case BlockType.GOLD_ORE:
    case BlockType.DIAMOND_ORE: return 1.3;
    case BlockType.SPAWNER: return 1.5;
    case BlockType.CHEST: return 1.0;
    case BlockType.TALL_GRASS:
    case BlockType.POPPY:
    case BlockType.DANDELION: return 0.1;
    default: return 0.5;
  }
}

function heightToNormal(
  heightMap: number[][], x: number, y: number, strength: number,
): [number, number, number] {
  const left = heightMap[y][(x - 1 + TILE_SIZE) % TILE_SIZE];
  const right = heightMap[y][(x + 1) % TILE_SIZE];
  const up = heightMap[(y - 1 + TILE_SIZE) % TILE_SIZE][x];
  const down = heightMap[(y + 1) % TILE_SIZE][x];

  const dx = (left - right) * strength;
  const dy = (up - down) * strength;
  const dz = 1.0;
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  return [dx / len, dy / len, dz / len];
}

// ---- Main class ----

export class TextureAtlas {
  private gpuTexture: GPUTexture;
  private gpuMaterialTexture: GPUTexture;
  private gpuNormalTexture: GPUTexture;

  constructor(ctx: WebGPUContext) {
    const pixels = this.generateAtlasPixels();
    this.gpuTexture = this.uploadTexture(ctx, pixels);

    const materialPixels = this.generateMaterialPixels();
    this.gpuMaterialTexture = this.uploadTexture(ctx, materialPixels);

    const normalPixels = this.generateNormalPixels();
    this.gpuNormalTexture = this.uploadTexture(ctx, normalPixels);
  }

  get texture(): GPUTexture {
    return this.gpuTexture;
  }

  get materialTexture(): GPUTexture {
    return this.gpuMaterialTexture;
  }

  get normalTexture(): GPUTexture {
    return this.gpuNormalTexture;
  }

  private generateAtlasPixels(): Uint8Array {
    const size = ATLAS_PIXEL_SIZE * ATLAS_PIXEL_SIZE * 4;
    const pixels = new Uint8Array(size);

    for (const blockType of ALL_BLOCK_TYPES) {
      const index = blockType as number;
      if (index >= ATLAS_TILES * ATLAS_TILES) continue;

      const tileX = index % ATLAS_TILES;
      const tileY = Math.floor(index / ATLAS_TILES);
      const [br, bg, bb, ba] = getBlockColor(blockType);

      const startX = tileX * TILE_SIZE;
      const startY = tileY * TILE_SIZE;

      for (let y = 0; y < TILE_SIZE; y++) {
        for (let x = 0; x < TILE_SIZE; x++) {
          const pixelIndex = ((startY + y) * ATLAS_PIXEL_SIZE + (startX + x)) * 4;
          // Vegetation: single call returns RGBA (pattern + alpha)
          if (isBlockCrossMesh(blockType)) {
            let rgba: [number, number, number, number];
            if (blockType === BlockType.TALL_GRASS) {
              rgba = patternTallGrass(x, y);
            } else if (blockType === BlockType.POPPY) {
              rgba = patternPoppy(x, y);
            } else {
              rgba = patternDandelion(x, y);
            }
            pixels[pixelIndex + 0] = rgba[0];
            pixels[pixelIndex + 1] = rgba[1];
            pixels[pixelIndex + 2] = rgba[2];
            pixels[pixelIndex + 3] = rgba[3];
          } else {
            const [r, g, b] = this.getBlockPattern(blockType, x, y, br, bg, bb);
            pixels[pixelIndex + 0] = r;
            pixels[pixelIndex + 1] = g;
            pixels[pixelIndex + 2] = b;
            pixels[pixelIndex + 3] = ba;
          }
        }
      }
    }

    return pixels;
  }

  private getBlockPattern(
    blockType: number, px: number, py: number,
    br: number, bg: number, bb: number,
  ): [number, number, number] {
    switch (blockType) {
      case BlockType.STONE:
        return patternStone(px, py, br, bg, bb);
      case BlockType.DIRT:
        return patternDirt(px, py, br, bg, bb);
      case BlockType.GRASS_BLOCK:
        return patternGrass(px, py, br, bg, bb);
      case BlockType.BEDROCK:
        return patternBedrock(px, py, br, bg, bb);
      case BlockType.SAND:
        return patternSand(px, py, br, bg, bb);
      case BlockType.SANDSTONE:
        return patternSandstone(px, py, br, bg, bb);
      case BlockType.GRAVEL:
        return patternGravel(px, py, br, bg, bb);
      case BlockType.CLAY:
        return patternClay(px, py, br, bg, bb);
      case BlockType.WATER:
      case BlockType.FLOWING_WATER:
        return patternWater(px, py, br, bg, bb);
      case BlockType.LAVA:
        return patternLava(px, py, br, bg, bb);
      case BlockType.SNOW:
        return patternSnow(px, py, br, bg, bb);
      case BlockType.ICE:
        return patternIce(px, py, br, bg, bb);
      case BlockType.COAL_ORE:
        return patternOre(px, py, br, bg, bb, 30, 30, 30, 128, 128, 128);
      case BlockType.IRON_ORE:
        return patternOre(px, py, br, bg, bb, 200, 170, 145, 128, 128, 128);
      case BlockType.GOLD_ORE:
        return patternOre(px, py, br, bg, bb, 255, 215, 80, 128, 128, 128);
      case BlockType.DIAMOND_ORE:
        return patternOre(px, py, br, bg, bb, 80, 230, 230, 128, 128, 128);
      case BlockType.LOG:
        return patternLog(px, py, br, bg, bb);
      case BlockType.LEAVES:
        return patternLeaves(px, py, br, bg, bb);
      case BlockType.COBBLESTONE:
        return patternCobblestone(px, py, br, bg, bb);
      case BlockType.MOSSY_COBBLESTONE:
        return patternMossyCobblestone(px, py, br, bg, bb);
      case BlockType.SPAWNER:
        return patternSpawner(px, py, br, bg, bb);
      case BlockType.CHEST:
        return patternChest(px, py, br, bg, bb);
      case BlockType.TALL_GRASS: {
        const [r, g, b] = patternTallGrass(px, py);
        return [r, g, b];
      }
      case BlockType.POPPY: {
        const [r, g, b] = patternPoppy(px, py);
        return [r, g, b];
      }
      case BlockType.DANDELION: {
        const [r, g, b] = patternDandelion(px, py);
        return [r, g, b];
      }
      default:
        return patternDefault(px, py, br, bg, bb);
    }
  }

  private generateMaterialPixels(): Uint8Array {
    const size = ATLAS_PIXEL_SIZE * ATLAS_PIXEL_SIZE * 4;
    const pixels = new Uint8Array(size);

    for (const blockType of ALL_BLOCK_TYPES) {
      const index = blockType as number;
      if (index >= ATLAS_TILES * ATLAS_TILES) continue;

      const tileX = index % ATLAS_TILES;
      const tileY = Math.floor(index / ATLAS_TILES);
      const mat = getBlockMaterial(blockType);

      const startX = tileX * TILE_SIZE;
      const startY = tileY * TILE_SIZE;

      const baseR = Math.round(mat.roughness * 255);
      const baseM = Math.round(mat.metallic * 255);
      const baseE = Math.round(mat.emissive * 255);

      for (let y = 0; y < TILE_SIZE; y++) {
        for (let x = 0; x < TILE_SIZE; x++) {
          const [rVal, mVal, eVal] = this.getMaterialPattern(
            blockType, x, y, baseR, baseM, baseE,
          );
          const pixelIndex = ((startY + y) * ATLAS_PIXEL_SIZE + (startX + x)) * 4;
          pixels[pixelIndex + 0] = rVal; // R = roughness
          pixels[pixelIndex + 1] = mVal; // G = metallic
          pixels[pixelIndex + 2] = eVal; // B = emissive
          pixels[pixelIndex + 3] = 255;
        }
      }
    }

    return pixels;
  }

  private getMaterialPattern(
    blockType: number, px: number, py: number,
    baseR: number, baseM: number, baseE: number,
  ): [number, number, number] {
    const h1 = hash(px, py, 200 + blockType);
    const variation = (h1 - 0.5) * 20; // +/- 10 in 0-255 range

    switch (blockType) {
      case BlockType.LAVA: {
        // Emissive varies: bright cracks vs dark crust
        const cx = px + (hash(px, py, 140) - 0.5) * 2;
        const cy = py + (hash(px, py, 141) - 0.5) * 2;
        const crack1 = Math.abs(Math.sin(cx * 1.2 + cy * 0.7));
        const crack2 = Math.abs(Math.sin(cx * 0.5 - cy * 1.5));
        const crackVal = Math.min(crack1, crack2);
        const emissive = crackVal < 0.3 ? 255 : clamp(Math.round(baseE * 0.4 + variation), 0, 255);
        return [
          clamp(Math.round(baseR + variation), 0, 255),
          baseM,
          emissive,
        ];
      }
      case BlockType.DIAMOND_ORE: {
        // Diamond spots have lower roughness (shinier) and slight emissive
        const h2 = hash(px, py, 101);
        const cx1 = 4 + hash(0, 0, 92) * 5;
        const cy1 = 4 + hash(0, 0, 219) * 5;
        const cx2 = 9 + hash(1, 1, 92) * 4;
        const cy2 = 9 + hash(1, 1, 219) * 4;
        const dist1 = Math.abs(px - cx1) + Math.abs(py - cy1);
        const dist2 = Math.abs(px - cx2) + Math.abs(py - cy2);
        if ((dist1 < 2.5 && h2 > 0.3) || (dist2 < 2.5 && hash(px, py, 102) > 0.3)) {
          return [
            clamp(Math.round(50 + variation), 0, 255),  // smoother
            clamp(Math.round(30 + variation), 0, 255),   // slight metallic
            clamp(Math.round(40 + variation), 0, 255),   // slight glow
          ];
        }
        return [clamp(Math.round(baseR + variation), 0, 255), baseM, baseE];
      }
      case BlockType.GOLD_ORE: {
        const h2 = hash(px, py, 101);
        const cx1 = 4 + hash(0, 0, 247) * 5;
        const cy1 = 4 + hash(0, 0, 229) * 5;
        const cx2 = 9 + hash(1, 1, 247) * 4;
        const cy2 = 9 + hash(1, 1, 229) * 4;
        const dist1 = Math.abs(px - cx1) + Math.abs(py - cy1);
        const dist2 = Math.abs(px - cx2) + Math.abs(py - cy2);
        if ((dist1 < 2.5 && h2 > 0.3) || (dist2 < 2.5 && hash(px, py, 102) > 0.3)) {
          return [
            clamp(Math.round(100 + variation), 0, 255),
            clamp(Math.round(180 + variation), 0, 255), // high metallic
            0,
          ];
        }
        return [clamp(Math.round(baseR + variation), 0, 255), baseM, baseE];
      }
      case BlockType.IRON_ORE: {
        const h2 = hash(px, py, 101);
        const cx1 = 4 + hash(0, 0, 175) * 5;
        const cy1 = 4 + hash(0, 0, 140) * 5;
        const cx2 = 9 + hash(1, 1, 175) * 4;
        const cy2 = 9 + hash(1, 1, 140) * 4;
        const dist1 = Math.abs(px - cx1) + Math.abs(py - cy1);
        const dist2 = Math.abs(px - cx2) + Math.abs(py - cy2);
        if ((dist1 < 2.5 && h2 > 0.3) || (dist2 < 2.5 && hash(px, py, 102) > 0.3)) {
          return [
            clamp(Math.round(140 + variation), 0, 255),
            clamp(Math.round(80 + variation), 0, 255), // moderate metallic
            0,
          ];
        }
        return [clamp(Math.round(baseR + variation), 0, 255), baseM, baseE];
      }
      case BlockType.ICE: {
        // Cracks have higher roughness
        const diag1 = Math.abs((px - py) % 7);
        const diag2 = Math.abs((px + py - 10) % 9);
        const h2 = hash(px, py, 91);
        if ((diag1 === 0 && h2 > 0.5) || (diag2 === 0 && h2 < 0.4)) {
          return [clamp(Math.round(baseR + 60), 0, 255), baseM, baseE];
        }
        return [clamp(Math.round(baseR + variation), 0, 255), baseM, baseE];
      }
      case BlockType.WATER:
      case BlockType.FLOWING_WATER: {
        const wave = Math.sin((px + py * 0.5) * 0.8) * 10;
        return [
          clamp(Math.round(baseR + wave), 0, 255),
          baseM,
          baseE,
        ];
      }
      case BlockType.SPAWNER: {
        // Cage bars are more metallic
        if (px % 4 === 0 || py % 4 === 0) {
          return [
            clamp(Math.round(baseR - 30), 0, 255),
            clamp(Math.round(baseM + 60), 0, 255),
            clamp(Math.round(baseE + 10 + variation), 0, 255),
          ];
        }
        return [clamp(Math.round(baseR + variation), 0, 255), baseM, baseE];
      }
      default: {
        return [
          clamp(Math.round(baseR + variation), 0, 255),
          baseM,
          baseE,
        ];
      }
    }
  }

  private generateNormalPixels(): Uint8Array {
    const size = ATLAS_PIXEL_SIZE * ATLAS_PIXEL_SIZE * 4;
    const pixels = new Uint8Array(size);

    // Fill with default flat normal (0,0,1) encoded as (128,128,255)
    for (let i = 0; i < size; i += 4) {
      pixels[i + 0] = 128;
      pixels[i + 1] = 128;
      pixels[i + 2] = 255;
      pixels[i + 3] = 255;
    }

    for (const blockType of ALL_BLOCK_TYPES) {
      const index = blockType as number;
      if (index >= ATLAS_TILES * ATLAS_TILES) continue;

      const tileX = index % ATLAS_TILES;
      const tileY = Math.floor(index / ATLAS_TILES);
      const startX = tileX * TILE_SIZE;
      const startY = tileY * TILE_SIZE;

      const heightMap = generateHeightMap(blockType);
      const strength = getNormalStrength(blockType);

      for (let y = 0; y < TILE_SIZE; y++) {
        for (let x = 0; x < TILE_SIZE; x++) {
          const [nx, ny, nz] = heightToNormal(heightMap, x, y, strength);
          const pixelIndex = ((startY + y) * ATLAS_PIXEL_SIZE + (startX + x)) * 4;
          pixels[pixelIndex + 0] = clamp(Math.round((nx * 0.5 + 0.5) * 255), 0, 255);
          pixels[pixelIndex + 1] = clamp(Math.round((ny * 0.5 + 0.5) * 255), 0, 255);
          pixels[pixelIndex + 2] = clamp(Math.round((nz * 0.5 + 0.5) * 255), 0, 255);
          pixels[pixelIndex + 3] = 255;
        }
      }
    }

    return pixels;
  }

  private uploadTexture(ctx: WebGPUContext, pixels: Uint8Array): GPUTexture {
    const texture = ctx.device.createTexture({
      size: [ATLAS_PIXEL_SIZE, ATLAS_PIXEL_SIZE],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });

    ctx.device.queue.writeTexture(
      { texture },
      pixels.buffer as ArrayBuffer,
      { bytesPerRow: ATLAS_PIXEL_SIZE * 4, rowsPerImage: ATLAS_PIXEL_SIZE },
      [ATLAS_PIXEL_SIZE, ATLAS_PIXEL_SIZE],
    );

    return texture;
  }
}
