// The living background. A stage generator draws the parts of its strip that move into small frames
// (packed into bg/<id>/props.png) and lists where they go and how they move (meta.props); the game
// plays them with src/game/Props.js. See that file for what each kind does.
//
// Coordinates follow the strip: x across, u = distance from the bottom of the strip. Frames placed
// by a corner use the top-left pixel (x, u of its top row); movers and particles are centred.
import { Raster, rgb, rng, fbm, bayer } from '../lib/raster.mjs';
import { packAtlas } from '../lib/spritekit.mjs';
import { rampColor } from './nature.mjs';

/** A raster addressed in strip pixels: lets a stage's drawing helpers paint into a small frame. */
export class Window extends Raster {
  constructor(x0, y0, w, h) {
    super(w, h);
    this.x0 = Math.floor(x0);
    this.y0 = Math.floor(y0);
  }

  idx(x, y) {
    return super.idx(Math.floor(x) - this.x0, Math.floor(y) - this.y0);
  }
}

/** Crop a raster to its opaque pixels: { r, x, y } with the offset of the kept area (null if empty). */
export function trim(r) {
  let x0 = r.w;
  let y0 = r.h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < r.h; y++)
    for (let x = 0; x < r.w; x++)
      if (r.data[(y * r.w + x) * 4 + 3]) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
  if (x1 < 0) return null;
  const out = new Raster(x1 - x0 + 1, y1 - y0 + 1);
  for (let y = y0; y <= y1; y++) out.data.set(r.data.subarray((y * r.w + x0) * 4, (y * r.w + x1 + 1) * 4), (y - y0) * out.w * 4);
  return { r: out, x: x0 + (r.x0 ?? 0), y: y0 + (r.y0 ?? 0) };
}

/** A new frame from a region of the finished strip, pixel by pixel: fn(r, g, b, a, x, y) -> [r, g, b, a] | null. */
export function cut(img, x0, y0, w, h, fn) {
  const out = new Window(x0, y0, w, h);
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++) {
      const i = img.idx(x, y);
      if (i < 0) continue;
      const d = img.data;
      const px = fn(d[i], d[i + 1], d[i + 2], d[i + 3], x, y);
      if (px) out.setRGBA(x, y, ...px.map((v) => Math.max(0, Math.min(255, Math.round(v)))));
    }
  return out;
}

/**
 * The strip's time-of-day grade (rows: [u, [mul r, g, b], tint colour, tint amount]) as functions:
 * frame(raster, u) grades a frame the way its row of the strip was graded; white(u) is what pure white
 * turns into there (the game multiplies shared particles, like steam, by it).
 */
export function todGrade(TOD, smooth) {
  const tints = TOD.map(([, , t]) => rgb(t));
  const at = (u) => {
    let i = 0;
    while (i < TOD.length - 2 && u >= TOD[i + 1][0]) i++;
    const t = smooth(TOD[i][0], TOD[i + 1][0], u);
    return {
      mul: TOD[i][1].map((m, k) => m + (TOD[i + 1][1][k] - m) * t),
      tc: tints[i].map((c, k) => c + (tints[i + 1][k] - c) * t),
      amt: TOD[i][3] + (TOD[i + 1][3] - TOD[i][3]) * t,
    };
  };
  const px = (g, v, k) => v * g.mul[k] + (g.tc[k] - v * g.mul[k]) * g.amt;
  return {
    frame(r, u) {
      const g = at(u);
      r.map((R, G, B, A) => (A ? [px(g, R, 0), px(g, G, 1), px(g, B, 2), A] : null));
      return r;
    },
    white(u) {
      const g = at(u);
      return [0, 1, 2].map((k) => Math.max(0, Math.min(255, Math.round(px(g, 255, k)))));
    },
  };
}

/**
 * A puff of steam or smoke about r px across: a few billowing clumps with a cauliflower outline, shaded
 * like a cloud lit from the top left and dithered out at the rim. ramp: colours from shadow to light.
 */
export function puff(r, seed, ramp) {
  const L = [-0.55, -0.6, 0.58];
  const ln = Math.hypot(...L);
  const pr = rng(seed);
  const n = Math.ceil(r * 1.15 + 1);
  const c = n + 0.5;
  const clumps = [{ x: c, y: c + r * 0.1, r: r * 0.8 }];
  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2 + pr() * 1.2;
    clumps.push({ x: c + Math.cos(ang) * r * 0.42, y: c + Math.sin(ang) * r * 0.36, r: r * (0.48 + pr() * 0.18) });
  }
  const out = new Raster(n * 2 + 1, n * 2 + 1);
  for (let y = 0; y < out.h; y++)
    for (let x = 0; x < out.w; x++) {
      let best = null;
      for (const k of clumps) {
        const dx = x + 0.5 - k.x;
        const dy = y + 0.5 - k.y;
        const d2 = (dx * dx + dy * dy) / (k.r * k.r);
        if (d2 > 1) continue;
        const h = Math.sqrt(1 - d2) * k.r + (k.y < c ? (c - k.y) * 0.05 : 0);
        if (!best || h > best.h) best = { h, d2, nx: dx / k.r, ny: dy / k.r, nz: Math.sqrt(1 - d2) };
      }
      if (!best) continue;
      const nse = fbm(x, y, { seed: 140 + (seed % 97), scale: 3, octaves: 2 });
      const v = ((best.nx * L[0] + best.ny * L[1] + best.nz * L[2]) / ln) * 0.6 + 0.55 + (nse - 0.5) * 0.3;
      const rim = best.d2 > 0.7 ? 1 - (best.d2 - 0.7) / 0.3 : 1;
      if (rim < 1 && rim < bayer(x, y)) continue;
      out.set(x, y, rampColor(ramp, v, x, y));
    }
  return out;
}

/** Collects frames and props for one stage (its own random numbers, so the strip's art stays as it was). */
export class PropKit {
  constructor(seed) {
    this.frames = new Map();
    this.props = [];
    this.n = 0;
    this.rand = rng(seed);
  }

  /** Register a frame (a Raster); returns its name. */
  frame(raster, name = `f${this.n++}`) {
    this.frames.set(name, raster);
    return name;
  }

  size(name) {
    const r = this.frames.get(name);
    return [r.w, r.h];
  }

  maxSize(names) {
    let w = 0;
    let h = 0;
    for (const n of names.flat()) {
      const [fw, fh] = this.size(n);
      w = Math.max(w, fw);
      h = Math.max(h, fh);
    }
    return [w, h];
  }

  /** Frames cycling in place; frame top-left at (x, u). seq: frame indices per step (-1 = hidden). */
  loop(x, u, f, { fps = 6, seq, ph = this.rand(), a, d, tint, fx } = {}) {
    const [, h] = this.maxSize(f);
    return this.add({ k: 'loop', x, u, f, fps, seq, ph, a, d, tint, fx }, [u - h, u]);
  }

  /**
   * Parts whose alpha follows a sine: a = a0 + (a1 - a0) * ((1 + sin(w t + ph)) / 2) ** pw.
   * parts: [frame index, x, u (top-left), phase]. Phases that grow across a field make a travelling gust.
   */
  wave(f, parts, { w = 1, a0 = 0, a1 = 1, pw = 1, d, tint } = {}) {
    let lo = Infinity;
    let hi = -Infinity;
    for (const [i, , u] of parts) {
      lo = Math.min(lo, u - this.size(f[i])[1]);
      hi = Math.max(hi, u);
    }
    return this.add({ k: 'wave', f, parts, w, a0, a1, pw, d, tint }, [lo, hi]);
  }

  /**
   * Movers along a route of centre points [[x, u], ...]: n of them, gap px apart, sp px/s.
   * mode 'wrap' (start over) or 'pp' (there and back, waiting `hold` s at the ends).
   * turn 'rot' (frames face right, turned to the heading), 'flip' (mirrored when going left), 'none'.
   * fu / fd: frames for going up / down the screen (3/4 view vehicles). wake: { f, every, life }.
   * cars: 1 = mover i always shows frame i (the coaches of a train) instead of cycling the frames.
   */
  path(pts, f, { sp = 10, n = 1, gap = 20, mode = 'wrap', hold = 0, turn = 'flip', fps = 4, fu, fd, wake, cars, s0 = this.rand(), a, d, tint, fx } = {}) {
    const [w, h] = this.maxSize([f, fu ?? [], fd ?? [], wake?.f ?? []]);
    const m = Math.max(w, h) / 2 + 2;
    const us = pts.map((p) => p[1]);
    return this.add({ k: 'path', pts, f, sp, n, gap, mode, hold, turn, fps, fu, fd, wake, cars, s0, a, d, tint, fx }, [Math.min(...us) - m, Math.max(...us) + m]);
  }

  /** Gondolas round a wheel centred at (x, u). tc: colours the lit gondolas cycle through. */
  orbit(x, u, r, f, { n = 8, w = 0.3, ry = r, tc, tw = 1, a, d, tint, fx } = {}) {
    const [, h] = this.maxSize(f);
    return this.add({ k: 'orbit', x, u, r, ry, f, n, w, tc, tw, a, d, tint, fx }, [u - ry - h, u + ry + h]);
  }

  /**
   * Puffs rising from (x, u): f = growth stages, each a list of variants (small to large).
   * rate puffs/s, life [min, max] s, vy rise px/s, sx spread px, wf how much the wind bends them,
   * a peak alpha, burst = chance per second of a strong gush. tint: 1 = shared frames, drawn ungraded; the game
   * multiplies them by the grade where they are (see tintTable).
   */
  emit(x, u, f, { rate = 2, life = [2, 3], vy = 12, sx = 2, wf = 1, a = 0.8, burst = 0, rise, d, tint } = {}) {
    const top = rise ?? vy * life[1];
    return this.add({ k: 'emit', x, u, f, rate, life, vy, sx, wf, a, burst, d, tint }, [u - 8, u + top + 12]);
  }

  /** n critters roaming an ellipse centred at (x, u). idle: chance per second of stopping for a while. */
  wander(x, u, rx, ry, f, { n = 3, sp = 6, turn = 'rot', fps = 4, idle = 0.2, a, d, tint, fx } = {}) {
    const [w, h] = this.maxSize(f);
    return this.add({ k: 'wander', x, u, rx, ry, f, n, sp, turn, fps, idle, a, d, tint, fx }, [u - ry - h, u + ry + h + w]);
  }

  /** One-shot animations at random places inside rectangles [[x, u (top), w, h], ...], `rate` per second. */
  spot(rects, f, { rate = 1, fps = 8, a = 1, d, tint } = {}) {
    const [, fh] = this.maxSize(f);
    let lo = Infinity;
    let hi = -Infinity;
    for (const [, u, , h] of rects) {
      lo = Math.min(lo, u - h - fh);
      hi = Math.max(hi, u + fh);
    }
    return this.add({ k: 'spot', rects, f, rate, fps, a, d, tint }, [lo, hi]);
  }

  /**
   * Every kind also takes a (base alpha), d (depth above the mid layer, default 0.5 over it), tint and
   * fx: 1 = an effect, faded back when the screen fills with bullets (default for emit, spot and wave).
   */
  add(p, e) {
    for (const key of Object.keys(p)) if (p[key] === undefined) delete p[key];
    p.e = e.map(Math.round);
    if (typeof p.ph === 'number') p.ph = Math.round(p.ph * 100) / 100;
    if (typeof p.s0 === 'number') p.s0 = Math.round(p.s0 * 100) / 100;
    this.props.push(p);
    return p;
  }

  /** The packed atlas, and the prop list sorted along the strip. */
  pack() {
    if (!this.props.length) return null;
    const entries = [...this.frames].map(([name, raster]) => ({ name, raster }));
    const { raster, json } = packAtlas(entries, 256, 1, 'props.png');
    this.props.sort((a, b) => a.e[0] - b.e[0]);
    return { raster, json, props: this.props };
  }
}

/** Every `step` px of strip, what white turns into (shared particle frames are multiplied by it). */
export function tintTable(L, white, step = 256) {
  const out = [];
  for (let u = 0; u <= L; u += step) {
    const [r, g, b] = white(u);
    out.push([u, (r << 16) | (g << 8) | b]);
  }
  return out;
}
