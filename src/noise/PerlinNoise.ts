export class PerlinNoise {
  private perm: Int32Array;

  constructor(seed: number = 0) {
    this.perm = PerlinNoise.generatePermutation(seed);
  }

  // 2D Perlin noise, returns [0, 1]
  noise2D(x: number, y: number): number {
    const xi = PerlinNoise.floorInt(x) & 255;
    const yi = PerlinNoise.floorInt(y) & 255;

    const xf = x - PerlinNoise.floorInt(x);
    const yf = y - PerlinNoise.floorInt(y);

    const u = PerlinNoise.fade(xf);
    const v = PerlinNoise.fade(yf);

    const p = this.perm;
    const aa = p[p[xi] + yi];
    const ab = p[p[xi] + yi + 1];
    const ba = p[p[xi + 1] + yi];
    const bb = p[p[xi + 1] + yi + 1];

    const x1 = PerlinNoise.lerp(PerlinNoise.grad2D(aa, xf, yf), PerlinNoise.grad2D(ba, xf - 1, yf), u);
    const x2 = PerlinNoise.lerp(PerlinNoise.grad2D(ab, xf, yf - 1), PerlinNoise.grad2D(bb, xf - 1, yf - 1), u);

    return (PerlinNoise.lerp(x1, x2, v) + 1) * 0.5;
  }

  // 3D Perlin noise, returns [0, 1] — used for cave direction
  noise3D(x: number, y: number, z: number): number {
    const xi = PerlinNoise.floorInt(x) & 255;
    const yi = PerlinNoise.floorInt(y) & 255;
    const zi = PerlinNoise.floorInt(z) & 255;

    const xf = x - PerlinNoise.floorInt(x);
    const yf = y - PerlinNoise.floorInt(y);
    const zf = z - PerlinNoise.floorInt(z);

    const u = PerlinNoise.fade(xf);
    const v = PerlinNoise.fade(yf);
    const w = PerlinNoise.fade(zf);

    const p = this.perm;
    const A  = p[xi] + yi;
    const AA = p[A] + zi;
    const AB = p[A + 1] + zi;
    const B  = p[xi + 1] + yi;
    const BA = p[B] + zi;
    const BB = p[B + 1] + zi;

    const lerp = PerlinNoise.lerp;
    const grad = PerlinNoise.grad3D;

    return (lerp(
      lerp(
        lerp(grad(p[AA], xf, yf, zf),       grad(p[BA], xf-1, yf, zf), u),
        lerp(grad(p[AB], xf, yf-1, zf),     grad(p[BB], xf-1, yf-1, zf), u),
        v,
      ),
      lerp(
        lerp(grad(p[AA+1], xf, yf, zf-1),   grad(p[BA+1], xf-1, yf, zf-1), u),
        lerp(grad(p[AB+1], xf, yf-1, zf-1), grad(p[BB+1], xf-1, yf-1, zf-1), u),
        v,
      ),
      w,
    ) + 1) * 0.5;
  }

  private static generatePermutation(seed: number): Int32Array {
    const source = new Int32Array(256);
    for (let i = 0; i < 256; i++) source[i] = i;

    // Fisher-Yates using a simple LCG seeded random
    let s = seed | 0;
    const rand = (): number => {
      // .NET System.Random compatible-ish LCG
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
    for (let i = 0; i < 512; i++) perm[i] = source[i & 255];
    return perm;
  }

  private static fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private static lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  private static grad2D(hash: number, x: number, y: number): number {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  private static grad3D(hash: number, x: number, y: number, z: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : (h === 12 || h === 14 ? x : z);
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  private static floorInt(x: number): number {
    const xi = x | 0;
    return x < xi ? xi - 1 : xi;
  }
}

// Fractal Brownian motion wrapper
export class FractalNoise {
  private noise: PerlinNoise;
  private octaves: number;
  private persistence: number;
  private lacunarity: number;
  private scale: number;

  constructor(seed: number = 0, octaves: number = 4, persistence: number = 0.5, lacunarity: number = 2.0, scale: number = 1.0) {
    this.noise = new PerlinNoise(seed);
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
