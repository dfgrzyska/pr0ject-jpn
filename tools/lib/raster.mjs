// Tiny RGBA raster with pixel-art friendly drawing helpers.
import { encodePNG } from './png.mjs';

export const rgb = (c) => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
export const pack = (r, g, b) => ((r & 255) << 16) | ((g & 255) << 8) | (b & 255);

export function mix(a, b, t) {
  const [r1, g1, b1] = rgb(a);
  const [r2, g2, b2] = rgb(b);
  return pack(
    Math.round(r1 + (r2 - r1) * t),
    Math.round(g1 + (g2 - g1) * t),
    Math.round(b1 + (b2 - b1) * t),
  );
}

export function scaleColor(c, f) {
  const [r, g, b] = rgb(c);
  return pack(clamp255(r * f), clamp255(g * f), clamp255(b * f));
}

const clamp255 = (v) => Math.max(0, Math.min(255, Math.round(v)));

/** Seeded PRNG (mulberry32). */
export function rng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.range = (lo, hi) => lo + next() * (hi - lo);
  next.int = (lo, hi) => Math.floor(lo + next() * (hi - lo + 1));
  next.pick = (arr) => arr[Math.floor(next() * arr.length)];
  next.chance = (p) => next() < p;
  return next;
}

function hash2(x, y, seed) {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Value noise in [0,1]; px/py make it periodic (in lattice cells). */
export function noise2(x, y, seed = 0, px = 0, py = 0) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const wrap = (v, p) => (p ? ((v % p) + p) % p : v);
  const h = (ix, iy) => hash2(wrap(ix, px), wrap(iy, py), seed);
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = h(x0, y0);
  const b = h(x0 + 1, y0);
  const c = h(x0, y0 + 1);
  const d = h(x0 + 1, y0 + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

/** Fractal noise. `scale` = pixels per lattice cell at the first octave. period in pixels (0 = none). */
export function fbm(x, y, { seed = 0, scale = 16, octaves = 3, periodX = 0, periodY = 0 } = {}) {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let s = scale;
  for (let o = 0; o < octaves; o++) {
    const px = periodX ? Math.round(periodX / s) : 0;
    const py = periodY ? Math.round(periodY / s) : 0;
    sum += amp * noise2(x / s, y / s, seed + o * 101, px, py);
    norm += amp;
    amp *= 0.5;
    s /= 2;
  }
  return sum / norm;
}

// 4x4 Bayer matrix for ordered dithering.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
export const bayer = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];

export class Raster {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.data = new Uint8ClampedArray(w * h * 4);
    this.wrapX = false;
    this.wrapY = false;
  }

  idx(x, y) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (this.wrapX) x = ((x % this.w) + this.w) % this.w;
    if (this.wrapY) y = ((y % this.h) + this.h) % this.h;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return -1;
    return (y * this.w + x) * 4;
  }

  alpha(x, y) {
    const i = this.idx(x, y);
    return i < 0 ? 0 : this.data[i + 3];
  }

  get(x, y) {
    const i = this.idx(x, y);
    if (i < 0) return 0;
    const d = this.data;
    return pack(d[i], d[i + 1], d[i + 2]);
  }

  /** Source-over blend of a solid color. */
  set(x, y, color, a = 1) {
    const i = this.idx(x, y);
    if (i < 0 || a <= 0) return;
    const d = this.data;
    const [r, g, b] = rgb(color);
    if (a >= 1) {
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
      d[i + 3] = 255;
      return;
    }
    const da = d[i + 3] / 255;
    const oa = a + da * (1 - a);
    d[i] = (r * a + d[i] * da * (1 - a)) / oa;
    d[i + 1] = (g * a + d[i + 1] * da * (1 - a)) / oa;
    d[i + 2] = (b * a + d[i + 2] * da * (1 - a)) / oa;
    d[i + 3] = oa * 255;
  }

  setRGBA(x, y, r, g, b, a) {
    const i = this.idx(x, y);
    if (i < 0) return;
    this.data[i] = r;
    this.data[i + 1] = g;
    this.data[i + 2] = b;
    this.data[i + 3] = a;
  }

  clear(x, y) {
    const i = this.idx(x, y);
    if (i >= 0) this.data[i + 3] = 0;
  }

  /** Multiply RGB of an existing pixel (shadows / highlights). */
  tint(x, y, f) {
    const i = this.idx(x, y);
    if (i < 0) return;
    const d = this.data;
    d[i] = d[i] * f;
    d[i + 1] = d[i + 1] * f;
    d[i + 2] = d[i + 2] * f;
  }

  rect(x, y, w, h, color, a = 1) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, color, a);
  }

  disc(cx, cy, r, color, a = 1) {
    const r2 = r * r;
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        if (dx * dx + dy * dy <= r2) this.set(x, y, color, a);
      }
  }

  ellipse(cx, cy, rx, ry, color, a = 1) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, color, a);
      }
  }

  line(x0, y0, x1, y1, color, a = 1) {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, color, a);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  /** Copy another raster on top (alpha blended). */
  blit(src, dx, dy) {
    for (let y = 0; y < src.h; y++)
      for (let x = 0; x < src.w; x++) {
        const i = (y * src.w + x) * 4;
        const a = src.data[i + 3];
        if (!a) continue;
        this.set(dx + x, dy + y, pack(src.data[i], src.data[i + 1], src.data[i + 2]), a / 255);
      }
  }

  crop(x, y, w, h) {
    const out = new Raster(w, h);
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const si = this.idx(x + i, y + j);
        if (si < 0) continue;
        const di = (j * w + i) * 4;
        for (let k = 0; k < 4; k++) out.data[di + k] = this.data[si + k];
      }
    return out;
  }

  /** Apply fn(r,g,b,a,x,y) -> [r,g,b,a] to every pixel. */
  map(fn) {
    const d = this.data;
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        const i = (y * this.w + x) * 4;
        const out = fn(d[i], d[i + 1], d[i + 2], d[i + 3], x, y);
        if (out) {
          d[i] = out[0];
          d[i + 1] = out[1];
          d[i + 2] = out[2];
          d[i + 3] = out[3];
        }
      }
  }

  /** Nearest-neighbour upscale (for previews). bg fills transparent pixels. */
  scaled(n, bg = null) {
    const out = new Raster(this.w * n, this.h * n);
    for (let y = 0; y < out.h; y++)
      for (let x = 0; x < out.w; x++) {
        const si = (Math.floor(y / n) * this.w + Math.floor(x / n)) * 4;
        const di = (y * out.w + x) * 4;
        if (bg !== null) {
          const checker = ((x >> 3) + (y >> 3)) & 1 ? bg : scaleColor(bg, 1.15);
          out.set(x, y, checker);
          out.set(x, y, pack(this.data[si], this.data[si + 1], this.data[si + 2]), this.data[si + 3] / 255);
        } else for (let k = 0; k < 4; k++) out.data[di + k] = this.data[si + k];
      }
    return out;
  }

  toPNG() {
    return encodePNG(this.w, this.h, this.data);
  }
}
