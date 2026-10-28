// Sprite pipeline: material masks -> auto shading -> outline -> atlas.
//
// A sprite is drawn as a grid of characters:
//   '.'        transparent
//   UPPERCASE  material (3-tone ramp, shaded automatically: lit top edge, shadowed bottom edge)
//   lowercase  explicit flat colour
import { Raster } from './raster.mjs';

// [shadow, base, highlight]
export const MATERIALS = {
  W: [0x8d93b0, 0xd5d9ec, 0xffffff], // white hull
  F: [0xb39a8a, 0xf2e6d8, 0xfffaf0], // fox-mask porcelain
  S: [0x4a4a66, 0x7d7f9e, 0xb4b8d4], // steel
  D: [0x262941, 0x434a72, 0x737db0], // gunmetal blue
  R: [0x8a1a1e, 0xd2361f, 0xff7448], // vermilion
  K: [0x14121c, 0x2a2638, 0x4c4662], // black lacquer
  Y: [0x9a5f10, 0xe2aa32, 0xfff0a0], // gold
  C: [0x1d5a8a, 0x3fb6e8, 0xc8fbff], // glass
  P: [0xa8476b, 0xf08bb0, 0xffd3e2], // sakura pink
  G: [0x1d6a3a, 0x37b35a, 0xa8f08e], // green
  B: [0x1c2f8a, 0x3a72f0, 0xa8d0ff], // blue
  V: [0x5a1f9a, 0x9c50f0, 0xe0b8ff], // violet
  E: [0x55525c, 0x8e8b96, 0xc8c5cf], // stone
  N: [0x3b2416, 0x6b4428, 0xa0703f], // wood
  M: [0x9a0018, 0xff2a3a, 0xffb8bf], // red glow
  Q: [0x8a3a10, 0xf07a20, 0xffc070], // orange
};

export const EXPLICIT = {
  k: 0x120e1a, // outline
  d: 0x2a2638,
  w: 0xffffff,
  y: 0xfff3a0,
  o: 0xffa040,
  r: 0xff3a30,
  m: 0xff2a3a,
  c: 0xc8fbff,
  b: 0x9cc7ff,
  p: 0xffd3e2,
  g: 0xb8ffa0,
  v: 0xf2c8ff,
  s: 0x5a5a78,
  e: 0x6a6670,
  h: 0xfff8e0,
  n: 0x1a1622,
  q: 0xf08bb0, // sakura mid
  u: 0xc85a85, // sakura deep
  x: 0xe63cff, // enemy bullet rim
  j: 0x2ec05a, // fox-fire mid
  l: 0x1a7a3a, // fox-fire dark
  a: 0x3fb6e8, // laser mid
  z: 0x1c4ab0, // laser edge
};

export const OUTLINE = 0x120e1a;

/** Mutable char grid used by procedural sprite definitions. */
export class Mask {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.g = Array.from({ length: h }, () => Array(w).fill('.'));
  }
  static fromRows(rows, mirror = false) {
    const full = mirror ? rows.map((r) => r + [...r.slice(0, -1)].reverse().join('')) : rows;
    const w = Math.max(...full.map((r) => r.length));
    const m = new Mask(w, full.length);
    full.forEach((r, y) => [...r].forEach((c, x) => (m.g[y][x] = c)));
    return m;
  }
  get(x, y) {
    return x < 0 || y < 0 || x >= this.w || y >= this.h ? '.' : this.g[y][x];
  }
  set(x, y, c) {
    x = Math.round(x);
    y = Math.round(y);
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.g[y][x] = c;
  }
  rect(x, y, w, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }
  disc(cx, cy, r, c) {
    for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++)
      for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        if (dx * dx + dy * dy <= r * r) this.set(x, y, c);
      }
  }
  line(x0, y0, x1, y1, c) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) this.set(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, c);
  }
  /** Mirror left half onto right half (x < w/2 copied to the other side). */
  mirrorX() {
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < Math.floor(this.w / 2); x++) this.g[y][this.w - 1 - x] = this.g[y][x];
  }
  remap(map) {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (map[this.g[y][x]]) this.g[y][x] = map[this.g[y][x]];
  }
  /** Nearest-neighbour rotation around the centre into a size×size mask. */
  rotated(angle, size = Math.max(this.w, this.h)) {
    const out = new Mask(size, size);
    const cx = this.w / 2;
    const cy = this.h / 2;
    const ox = size / 2;
    const oy = size / 2;
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const dx = x + 0.5 - ox;
        const dy = y + 0.5 - oy;
        const sx = Math.floor(cx + dx * cos - dy * sin);
        const sy = Math.floor(cy + dx * sin + dy * cos);
        out.g[y][x] = this.get(sx, sy);
      }
    return out;
  }
}

/**
 * Render a mask to a raster.
 * opts.outline (default true) adds a 1px border and a dark outline.
 * opts.glow: chars that never receive an outline (flames, light).
 * opts.materials: override ramps.
 */
export function renderMask(mask, opts = {}) {
  const { outline = true, glow = '', materials = MATERIALS, shade = true } = opts;
  const pad = outline ? 1 : 0;
  const r = new Raster(mask.w + pad * 2, mask.h + pad * 2);
  for (let y = 0; y < mask.h; y++)
    for (let x = 0; x < mask.w; x++) {
      const c = mask.g[y][x];
      if (c === '.') continue;
      let color;
      if (materials[c]) {
        const ramp = materials[c];
        if (!shade) color = ramp[1];
        else if (mask.get(x, y - 1) !== c) color = ramp[2];
        else if (mask.get(x, y + 1) !== c) color = ramp[0];
        else color = ramp[1];
      } else if (EXPLICIT[c] !== undefined) color = EXPLICIT[c];
      else throw new Error(`Unknown sprite char '${c}'`);
      r.set(x + pad, y + pad, color);
    }
  if (outline) {
    const solid = (x, y) => {
      const c = mask.get(x - pad, y - pad);
      return c !== '.' && !glow.includes(c);
    };
    for (let y = 0; y < r.h; y++)
      for (let x = 0; x < r.w; x++) {
        if (r.alpha(x, y)) continue;
        if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) r.set(x, y, OUTLINE);
      }
  }
  return r;
}

/** Shelf-pack named rasters into one atlas. Returns { raster, json }. */
export function packAtlas(entries, width = 512, padding = 2, imageName = 'sprites.png') {
  const items = entries
    .map((e, i) => ({ ...e, i }))
    .sort((a, b) => b.raster.h - a.raster.h || b.raster.w - a.raster.w);
  let x = padding;
  let y = padding;
  let rowH = 0;
  for (const it of items) {
    if (x + it.raster.w + padding > width) {
      x = padding;
      y += rowH + padding;
      rowH = 0;
    }
    it.x = x;
    it.y = y;
    x += it.raster.w + padding;
    rowH = Math.max(rowH, it.raster.h);
  }
  const height = y + rowH + padding;
  const atlas = new Raster(width, height);
  const frames = {};
  for (const it of items) {
    atlas.blit(it.raster, it.x, it.y);
    const { w, h } = it.raster;
    frames[it.name] = {
      frame: { x: it.x, y: it.y, w, h },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w, h },
      sourceSize: { w, h },
    };
  }
  const json = { frames, meta: { image: imageName, format: 'RGBA8888', size: { w: width, h: height }, scale: '1' } };
  return { raster: atlas, json };
}
