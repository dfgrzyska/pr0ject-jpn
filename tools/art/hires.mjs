// A canvas for stage art drawn at S times the game's resolution (540 px wide for S = 3).
// The stage code keeps its logical coordinates (180 px wide, the units of the waves and props): the
// logical calls (set, rect, tint, clear, alpha) fill whole S x S blocks, the shapes (disc, ellipse, line)
// are rasterised finely, and the fine calls (px, tintPx, alphaPx, fine) work on single pixels of the
// big raster in fine coordinates (logical x S), for the detail the extra resolution makes room for.
import { Raster } from '../lib/raster.mjs';

/** A quick hash of a fine pixel in [0, 1): grain, flecks and joints without the cost of noise. */
export function hashPx(x, y, seed = 1) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export class HiCanvas {
  /** A logical w x h canvas (a window at x0, y0 of the strip when given), S fine pixels per logical one. */
  constructor(w, h, S = 3, x0 = 0, y0 = 0) {
    this.S = S;
    this.w = w;
    this.h = h;
    this.x0 = Math.floor(x0);
    this.y0 = Math.floor(y0);
    this.hi = new Raster(Math.ceil(w * S), Math.ceil(h * S));
  }

  // ---- fine pixels (fine coordinates of the whole strip: logical x S)
  px(X, Y, c, a = 1) {
    this.hi.set(X - this.x0 * this.S, Y - this.y0 * this.S, c, a);
  }

  tintPx(X, Y, f) {
    this.hi.tint(X - this.x0 * this.S, Y - this.y0 * this.S, f);
  }

  alphaPx(X, Y) {
    return this.hi.alpha(X - this.x0 * this.S, Y - this.y0 * this.S);
  }

  getPx(X, Y) {
    return this.hi.get(X - this.x0 * this.S, Y - this.y0 * this.S);
  }

  rgbaPx(X, Y) {
    const i = this.hi.idx(X - this.x0 * this.S, Y - this.y0 * this.S);
    if (i < 0) return null;
    const d = this.hi.data;
    return [d[i], d[i + 1], d[i + 2], d[i + 3]];
  }

  setRGBAPx(X, Y, r, g, b, a) {
    this.hi.setRGBA(X - this.x0 * this.S, Y - this.y0 * this.S, r, g, b, a);
  }

  /** Paint the logical rect (x, y, w, h) a fine pixel at a time: fn(X, Y, x, y) -> colour, [colour, alpha] or null. */
  fine(x, y, w, h, fn) {
    const S = this.S;
    const X0 = Math.floor(x * S);
    const Y0 = Math.floor(y * S);
    const X1 = Math.ceil((x + w) * S);
    const Y1 = Math.ceil((y + h) * S);
    for (let Y = Y0; Y < Y1; Y++)
      for (let X = X0; X < X1; X++) {
        const c = fn(X, Y, (X + 0.5) / S, (Y + 0.5) / S);
        if (c === null || c === undefined) continue;
        if (Array.isArray(c)) this.px(X, Y, c[0], c[1]);
        else this.px(X, Y, c);
      }
  }

  // ---- logical pixels, as on a 1x Raster (whole blocks)
  block(x, y, fn) {
    const S = this.S;
    const X = (Math.floor(x) - this.x0) * S;
    const Y = (Math.floor(y) - this.y0) * S;
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) fn(X + i, Y + j);
  }

  set(x, y, c, a = 1) {
    this.block(x, y, (X, Y) => this.hi.set(X, Y, c, a));
  }

  tint(x, y, f) {
    this.block(x, y, (X, Y) => this.hi.tint(X, Y, f));
  }

  clear(x, y) {
    this.block(x, y, (X, Y) => this.hi.clear(X, Y));
  }

  setRGBA(x, y, r, g, b, a) {
    this.block(x, y, (X, Y) => this.hi.setRGBA(X, Y, r, g, b, a));
  }

  alpha(x, y) {
    const S = this.S;
    return this.hi.alpha((Math.floor(x) - this.x0) * S + (S >> 1), (Math.floor(y) - this.y0) * S + (S >> 1));
  }

  get(x, y) {
    const S = this.S;
    return this.hi.get((Math.floor(x) - this.x0) * S + (S >> 1), (Math.floor(y) - this.y0) * S + (S >> 1));
  }

  rect(x, y, w, h, c, a = 1) {
    const S = this.S;
    const X = (Math.floor(x) - this.x0) * S;
    const Y = (Math.floor(y) - this.y0) * S;
    this.hi.rect(X, Y, Math.ceil(w) * S, Math.ceil(h) * S, c, a);
  }

  /** A light: the block lit, brightest in the middle (a glowing lamp rather than a square). */
  light(x, y, c, a = 1) {
    const S = this.S;
    const X = (Math.floor(x) - this.x0) * S;
    const Y = (Math.floor(y) - this.y0) * S;
    const m = (S - 1) / 2;
    for (let j = 0; j < S; j++)
      for (let i = 0; i < S; i++) {
        const d = Math.abs(i - m) + Math.abs(j - m);
        this.hi.set(X + i, Y + j, c, a * (d === 0 ? 1 : d <= 1 ? 0.8 : 0.5));
      }
  }

  // ---- shapes, rasterised finely (logical centres and radii)
  disc(cx, cy, r, c, a = 1) {
    this.ellipse(cx, cy, r, r, c, a);
  }

  ellipse(cx, cy, rx, ry, c, a = 1) {
    const S = this.S;
    const X0 = Math.floor((cx - rx) * S) - 1;
    const X1 = Math.ceil((cx + rx) * S) + 1;
    const Y0 = Math.floor((cy - ry) * S) - 1;
    const Y1 = Math.ceil((cy + ry) * S) + 1;
    for (let Y = Y0; Y <= Y1; Y++)
      for (let X = X0; X <= X1; X++) {
        const dx = ((X + 0.5) / S - cx) / rx;
        const dy = ((Y + 0.5) / S - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.px(X, Y, c, a);
      }
  }

  /** A logical line (one logical pixel thick), drawn as a fine line with a brush the width of a block. */
  line(x0, y0, x1, y1, c, a = 1, brush = this.S) {
    const S = this.S;
    let X0 = Math.round(x0) * S + (S >> 1);
    let Y0 = Math.round(y0) * S + (S >> 1);
    const X1 = Math.round(x1) * S + (S >> 1);
    const Y1 = Math.round(y1) * S + (S >> 1);
    const dx = Math.abs(X1 - X0);
    const dy = -Math.abs(Y1 - Y0);
    const sx = X0 < X1 ? 1 : -1;
    const sy = Y0 < Y1 ? 1 : -1;
    let err = dx + dy;
    const o = Math.floor(brush / 2);
    const seen = new Set();
    for (;;) {
      for (let j = 0; j < brush; j++)
        for (let i = 0; i < brush; i++) {
          const k = (X0 + i - o) * 100003 + (Y0 + j - o);
          if (seen.has(k)) continue;
          seen.add(k);
          this.px(X0 + i - o, Y0 + j - o, c, a);
        }
      if (X0 === X1 && Y0 === Y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        X0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        Y0 += sy;
      }
    }
  }

  /** A fine line between fine points, one fine pixel thick. */
  linePx(X0, Y0, X1, Y1, c, a = 1) {
    X0 = Math.round(X0);
    Y0 = Math.round(Y0);
    X1 = Math.round(X1);
    Y1 = Math.round(Y1);
    const dx = Math.abs(X1 - X0);
    const dy = -Math.abs(Y1 - Y0);
    const sx = X0 < X1 ? 1 : -1;
    const sy = Y0 < Y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.px(X0, Y0, c, a);
      if (X0 === X1 && Y0 === Y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        X0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        Y0 += sy;
      }
    }
  }

  rectPx(X, Y, w, h, c, a = 1) {
    this.hi.rect(X - this.x0 * this.S, Y - this.y0 * this.S, w, h, c, a);
  }

  discPx(CX, CY, r, c, a = 1) {
    for (let Y = Math.floor(CY - r); Y <= Math.ceil(CY + r); Y++)
      for (let X = Math.floor(CX - r); X <= Math.ceil(CX + r); X++) {
        const dx = X + 0.5 - CX;
        const dy = Y + 0.5 - CY;
        if (dx * dx + dy * dy <= r * r) this.px(X, Y, c, a);
      }
  }

  // ---- whole canvas
  map(fn) {
    this.hi.map(fn);
    return this;
  }

  /** The fine raster of the logical rect (x, y, w, h). */
  crop(x, y, w, h) {
    const S = this.S;
    return this.hi.crop((x - this.x0) * S, (y - this.y0) * S, w * S, h * S);
  }
}
