// 2D/3D Simplex noise with seeded permutation table
// Based on Stefan Gustavson's simplex noise algorithm

// 2D gradients (12 directions)
const GRAD2 = [
  1, 1, -1, 1, 1, -1, -1, -1,
  1, 0, -1, 0, 0, 1, 0, -1,
  1, 0, -1, 0, 0, 1, 0, -1,
];

// 3D gradients (12 edges of a cube)
const GRAD3 = [
  1, 1, 0,  -1, 1, 0,  1, -1, 0,  -1, -1, 0,
  1, 0, 1,  -1, 0, 1,  1, 0, -1,  -1, 0, -1,
  0, 1, 1,   0, -1, 1,  0, 1, -1,   0, -1, -1,
];

// Skew/unskew constants
const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
const F3 = 1.0 / 3.0;
const G3 = 1.0 / 6.0;

export class SimplexNoise {
  private perm: Int32Array;
  private permMod12: Int32Array;

  constructor(seed: number = 0) {
    const { perm, permMod12 } = SimplexNoise.generatePermutation(seed);
    this.perm = perm;
    this.permMod12 = permMod12;
  }

  // 2D Simplex noise, returns [0, 1]
  noise2D(x: number, y: number): number {
    const p = this.perm;
    const pm12 = this.permMod12;

    // Skew input space to determine which simplex cell we're in
    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);

    const t = (i + j) * G2;
    const x0 = x - (i - t);
    const y0 = y - (j - t);

    // Determine which simplex we are in (upper or lower triangle)
    let i1: number, j1: number;
    if (x0 > y0) {
      i1 = 1; j1 = 0; // lower triangle
    } else {
      i1 = 0; j1 = 1; // upper triangle
    }

    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1.0 + 2.0 * G2;
    const y2 = y0 - 1.0 + 2.0 * G2;

    const ii = i & 255;
    const jj = j & 255;

    // Contribution from the three corners
    let n0 = 0, n1 = 0, n2 = 0;

    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      const gi0 = pm12[p[ii + p[jj]] & 255] * 2;
      t0 *= t0;
      n0 = t0 * t0 * (GRAD2[gi0] * x0 + GRAD2[gi0 + 1] * y0);
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      const gi1 = pm12[p[ii + i1 + p[jj + j1]] & 255] * 2;
      t1 *= t1;
      n1 = t1 * t1 * (GRAD2[gi1] * x1 + GRAD2[gi1 + 1] * y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      const gi2 = pm12[p[ii + 1 + p[jj + 1]] & 255] * 2;
      t2 *= t2;
      n2 = t2 * t2 * (GRAD2[gi2] * x2 + GRAD2[gi2 + 1] * y2);
    }

    // Scale to [0, 1] (raw range is roughly [-1, 1] with factor 70)
    return (70.0 * (n0 + n1 + n2) + 1.0) * 0.5;
  }

  // 3D Simplex noise, returns [0, 1]
  noise3D(x: number, y: number, z: number): number {
    const p = this.perm;
    const pm12 = this.permMod12;

    // Skew input space
    const s = (x + y + z) * F3;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const k = Math.floor(z + s);

    const t = (i + j + k) * G3;
    const x0 = x - (i - t);
    const y0 = y - (j - t);
    const z0 = z - (k - t);

    // Determine which simplex we are in
    let i1: number, j1: number, k1: number;
    let i2: number, j2: number, k2: number;

    if (x0 >= y0) {
      if (y0 >= z0)      { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; }
      else if (x0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; }
      else               { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; }
    } else {
      if (y0 < z0)       { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; }
      else if (x0 < z0)  { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; }
      else               { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; }
    }

    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2.0 * G3;
    const y2 = y0 - j2 + 2.0 * G3;
    const z2 = z0 - k2 + 2.0 * G3;
    const x3 = x0 - 1.0 + 3.0 * G3;
    const y3 = y0 - 1.0 + 3.0 * G3;
    const z3 = z0 - 1.0 + 3.0 * G3;

    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;

    // Contribution from the four corners
    let n0 = 0, n1 = 0, n2 = 0, n3 = 0;

    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 >= 0) {
      const gi0 = pm12[p[ii + p[jj + p[kk]]] & 255] * 3;
      t0 *= t0;
      n0 = t0 * t0 * (GRAD3[gi0] * x0 + GRAD3[gi0 + 1] * y0 + GRAD3[gi0 + 2] * z0);
    }

    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 >= 0) {
      const gi1 = pm12[p[ii + i1 + p[jj + j1 + p[kk + k1]]] & 255] * 3;
      t1 *= t1;
      n1 = t1 * t1 * (GRAD3[gi1] * x1 + GRAD3[gi1 + 1] * y1 + GRAD3[gi1 + 2] * z1);
    }

    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 >= 0) {
      const gi2 = pm12[p[ii + i2 + p[jj + j2 + p[kk + k2]]] & 255] * 3;
      t2 *= t2;
      n2 = t2 * t2 * (GRAD3[gi2] * x2 + GRAD3[gi2 + 1] * y2 + GRAD3[gi2 + 2] * z2);
    }

    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 >= 0) {
      const gi3 = pm12[p[ii + 1 + p[jj + 1 + p[kk + 1]]] & 255] * 3;
      t3 *= t3;
      n3 = t3 * t3 * (GRAD3[gi3] * x3 + GRAD3[gi3 + 1] * y3 + GRAD3[gi3 + 2] * z3);
    }

    // Scale to [0, 1] (raw range is roughly [-1, 1] with factor 32)
    return (32.0 * (n0 + n1 + n2 + n3) + 1.0) * 0.5;
  }

  private static generatePermutation(seed: number): { perm: Int32Array; permMod12: Int32Array } {
    const source = new Int32Array(256);
    for (let i = 0; i < 256; i++) source[i] = i;

    // Fisher-Yates using a simple LCG seeded random
    let s = seed | 0;
    const rand = (): number => {
      s = Math.imul(s, 1103515245) + 12345;
      return ((s >>> 16) & 0x7FFF);
    };

    for (let i = 255; i > 0; i--) {
      const j = rand() % (i + 1);
      const tmp = source[i];
      source[i] = source[j];
      source[j] = tmp;
    }

    const perm = new Int32Array(512);
    const permMod12 = new Int32Array(512);
    for (let i = 0; i < 512; i++) {
      perm[i] = source[i & 255];
      permMod12[i] = perm[i] % 12;
    }
    return { perm, permMod12 };
  }
}

// Fractal Brownian motion wrapper
export class FractalNoise {
  private noise: SimplexNoise;
  private octaves: number;
  private persistence: number;
  private lacunarity: number;
  private scale: number;

  constructor(seed: number = 0, octaves: number = 4, persistence: number = 0.5, lacunarity: number = 2.0, scale: number = 1.0) {
    this.noise = new SimplexNoise(seed);
    this.octaves = octaves;
    this.persistence = persistence;
    this.lacunarity = lacunarity;
    this.scale = scale;
  }

  sample(x: number, y: number): number {
    let total = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < this.octaves; i++) {
      const sx = (x / this.scale) * frequency;
      const sy = (y / this.scale) * frequency;
      total += this.noise.noise2D(sx, sy) * amplitude;
      maxValue += amplitude;
      amplitude *= this.persistence;
      frequency *= this.lacunarity;
    }

    return total / maxValue;
  }
}
