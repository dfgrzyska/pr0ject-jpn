// Lights that move, for the night districts of Tokyo: screens with pictures of their own (none of them anyone's
// character or mark), signs that blink, fill and chase, and the small lamps of machines winking behind glass.
// Everything is painted once on the strip (so it glows, and the street holds its light) and again as frames.
import { shade, blend } from './kit.mjs';
import { hashPx } from '../hires.mjs';

const TAU = Math.PI * 2;
const mod = (a, n) => ((a % n) + n) % n;

// a walking box of a creature: two aerials, one eye, two feet (two frames)
const WALKER = [
  ['#.......#', '.#.....#.', '..#...#..', '.#######.', '.#.....#.', '.#.###.#.', '.#.#o#.#.', '.#.###.#.', '.#.....#.', '.#######.', '..#...#..', '.##...##.'],
  ['.#.....#.', '.#.....#.', '..#...#..', '.#######.', '.#.....#.', '.#.###.#.', '.#.#o#.#.', '.#.###.#.', '.#.....#.', '.#######.', '...#.#...', '..##.##..'],
];

/** The colour of pixel (i, j) of a w x h picture of a kind, at t (0..1, round and round). */
export function picture(kind, i, j, w, h, t) {
  const [x, y, asp] = [i / w, j / h, w / h];
  const [ex, ey] = [(x - 0.5) * asp, y - 0.5];
  switch (kind) {
    case 0: {
      // the creature walking, the stars sliding by behind it
      const sc = Math.max(1, Math.floor(h / 15));
      const f = Math.floor(t * 8) % 2;
      const [sx, sy] = [Math.floor((i - (w - 9 * sc) / 2) / sc), Math.floor((j - (h - 13 * sc) / 2 - f) / sc)];
      const ch = WALKER[f][sy]?.[sx];
      if (sx >= 0 && ch === '#') return [0x60f090, 0x50d8f0, 0xff70b0, 0xf8e060][Math.floor(t * 4) % 4];
      if (sx >= 0 && ch === 'o') return 0xffffff;
      if (j >= h - 2 * sc) return Math.floor(i / (2 * sc) + t * 8) % 2 ? 0x3050a0 : 0x203878;
      return hashPx(mod(Math.floor(i / 2 + t * (w >> 1)), w >> 1), j >> 1, 5) < 0.045 ? 0xf0f0ff : 0x101430;
    }
    case 1: {
      // a rocket, the stars streaking past it
      const dx = Math.abs(ex);
      if (y > 0.16 && y < 0.34 && dx < (y - 0.16) * 0.5) return 0xf04858;
      if (y >= 0.34 && y < 0.66 && dx < 0.09) return Math.hypot(dx, y - 0.44) < 0.05 ? 0x60c8f0 : ex < 0 ? 0xf4f4f8 : 0xc0c4d0;
      if (y >= 0.54 && y < 0.7 && dx < 0.09 + (y - 0.54) * 0.7) return 0xf04858;
      const fl = 0.8 + 0.1 * (Math.floor(t * 8) % 2);
      if (y >= 0.7 && y < fl && dx < 0.075 * (1 - (y - 0.7) / (fl - 0.7))) return y < 0.75 ? 0xfff0a0 : 0xff9030;
      return hashPx(i >> 1, mod(Math.floor(j / 2 - t * (h >> 1)), h >> 1), 6) < 0.06 ? 0xd0e0ff : 0x0c1030;
    }
    case 2: {
      // big writing, flashing from one pair of colours to the other
      const ph = Math.floor(t * 4) % 2;
      const [bg, fg] = ph ? [0xff3880, 0xffffff] : [0xffe040, 0x281020];
      const cell = Math.floor(x * 4);
      const [gx, gy] = [Math.floor(((x * 4) % 1) * 6), Math.floor(y * 6)];
      if (gx === 0 || gx === 5 || gy === 0 || gy === 5) return bg;
      return gx === 2 + (cell % 2) || hashPx(cell * 9 + gx, gy, 21) < 0.5 ? fg : bg;
    }
    case 3: {
      // slow swirls of colour
      const v = Math.sin(x * 6 + t * TAU) + Math.sin(y * 5 - t * TAU) + Math.sin((x + y) * 4 + t * TAU * 2);
      return [0xff5090, 0xff9040, 0xffe050, 0x50e0a0, 0x40b0ff, 0xa060f0][mod(Math.floor(((v + 3) / 6) * 12), 6)];
    }
    case 4: {
      // a pinwheel turning
      const d = Math.hypot(ex, ey);
      if (d < 0.06) return 0xffffff;
      return mod(Math.floor((Math.atan2(ey, ex) / TAU + d * 1.5 - t) * 8), 2) ? 0xff4090 : 0x40e0f0;
    }
    case 5: {
      // a chequer breathing in and out
      const sz = 4 + Math.round(2 * Math.sin(t * TAU));
      return (Math.floor((i - w / 2) / sz) + Math.floor((j - h / 2) / sz)) & 1 ? 0xf8f040 : 0x7030c0;
    }
    case 6: {
      // a ticker of amber dots, its writing running to the left
      if (i % 2 || j % 2) return 0x100808;
      const c = mod(Math.floor(i / 2 + t * (w >> 1)), w >> 1);
      const on = c % 4 !== 3 && j >= 2 && j < h - 2 && hashPx(c >> 2, (c % 4) * 7 + (j >> 1), 31) < 0.55;
      return on ? 0xffb020 : 0x3a1c08;
    }
    case 7: {
      // a green trace on a dark grid
      const yy = h / 2 + Math.sin(x * TAU * 2 + t * TAU) * h * 0.34 * Math.sin(x * Math.PI);
      if (Math.abs(j - yy) < 1.3) return 0x70ffa0;
      return i % 8 === 0 || j % 8 === 0 ? 0x0e3424 : 0x061810;
    }
    case 8: {
      // a face: two big eyes that blink, a fringe, a small smile
      if (y < 0.2 || (y < 0.3 && Math.floor(x * 9) % 2 === 0)) return 0x6a3a8a;
      const blink = t > 0.8 && t < 0.93;
      for (const cx of [-0.21, 0.21]) {
        const [qx, qy] = [ex - cx * Math.min(1.6, asp), ey - 0.04];
        if (blink) {
          if (Math.abs(qy) < 0.035 && Math.abs(qx) < 0.14) return 0x3a2a4a;
        } else if (Math.hypot(qx / 0.13, qy / 0.2) < 1) {
          if (Math.hypot((qx + 0.04) / 0.035, (qy + 0.08) / 0.05) < 1) return 0xffffff;
          return Math.hypot(qx / 0.085, (qy - 0.03) / 0.14) < 1 ? 0x3080e0 : 0xf8f8ff;
        }
      }
      if (Math.abs(ex) < 0.06 && Math.abs(y - 0.84) < 0.03) return 0xe05070;
      if (Math.hypot((Math.abs(ex) - 0.36) / 0.07, (y - 0.72) / 0.05) < 1) return 0xffa8b8;
      return 0xffe4d8;
    }
    case 9: {
      // a gold coin spinning
      const wd = Math.max(0.1, Math.abs(Math.cos(t * Math.PI)));
      const [qx, qy] = [ex / (0.32 * wd), ey / 0.38];
      const d = Math.hypot(qx, qy);
      if (d < 1) return d > 0.8 ? 0xc89020 : Math.abs(qx) < 0.22 && Math.abs(qy) < 0.5 ? 0xc89020 : qx + qy < -0.5 ? 0xfff4a0 : 0xffd848;
      return hashPx(i >> 1, j >> 1, 44) < 0.04 && mod(hashPx(i >> 1, j >> 1, 45) + t, 1) < 0.5 ? 0xfff8c0 : 0x182048;
    }
    case 10: {
      // a capsule that comes apart, a star inside it
      const sep = t < 0.5 ? 0 : (t - 0.5) * 0.34;
      const [ty, by] = [(ey + sep) / 0.3, (ey - sep) / 0.3];
      const qx = ex / 0.3;
      if (ty <= 0 && Math.hypot(qx, ty) < 1) return qx + ty < -0.7 ? 0xa0f0f8 : 0x28b0c8;
      if (by >= 0 && Math.hypot(qx, by) < 1) return qx > 0.4 ? 0xf0b040 : 0xffd868;
      if (sep > 0 && Math.abs(qx) + Math.abs(ey / 0.3) < sep * 3.4) return 0xff60a0;
      return mod(Math.floor((Math.atan2(ey, ex) / TAU) * 12 + t * 2), 2) ? 0xe8e0ff : 0xf8f4ff;
    }
    case 11: {
      // a cup, steam curling off it
      if (y > 0.86 && y < 0.92 && Math.abs(ex) < 0.34) return 0xc8b8d8;
      if (y > 0.52 && y <= 0.86 && Math.abs(ex) < 0.22 - (y - 0.52) * 0.2) return y < 0.58 ? 0x7a4a30 : ex < -0.1 ? 0xffffff : 0xf0e8f0;
      if (Math.hypot((ex - 0.26) / 0.08, (y - 0.68) / 0.1) < 1 && Math.hypot((ex - 0.25) / 0.045, (y - 0.68) / 0.06) > 1) return 0xf0e8f0;
      for (let k = -1; k <= 1; k++) {
        const xx = k * 0.1 + 0.035 * Math.sin(y * 18 + t * TAU + k * 2);
        if (y > 0.12 && y < 0.48 && Math.abs(ex - xx) < 0.022 && mod(y * 6 + t * 3 + k * 0.3, 1) < 0.62) return 0xffffff;
      }
      return 0xa8e0d0;
    }
    case 12: {
      // a star swelling and shrinking among small ones
      const r = 0.24 + 0.09 * Math.sin(t * TAU);
      if (Math.abs(ex) * Math.abs(ey) < r * r * 0.07 && Math.hypot(ex, ey) < r * 1.7) return 0xfff8a0;
      if (hashPx(i >> 1, j >> 1, 41) < 0.05 && mod(hashPx(i >> 1, j >> 1, 42) + t, 1) < 0.5) return 0xffffff;
      return blend(0x301060, 0x9040c0, y);
    }
    default: {
      // a bar filling up, green to red
      if (i < 2 || j < 2 || i >= w - 2 || j >= h - 2) return 0x40e0f0;
      const seg = Math.floor(x * 10);
      if ((x * 10) % 1 > 0.78 || y < 0.28 || y > 0.72) return 0x101820;
      return seg / 10 < t ? blend(0x40e080, 0xf04040, seg / 9) : 0x283848;
    }
  }
}

export function makeNeon(ctx) {
  const { kit, props, S } = ctx;
  const { mark, E, halo, FX, FY } = kit;
  const cache = new Map();
  const frames = (key, n, fw, fh, draw) => {
    if (!cache.has(key)) cache.set(key, Array.from({ length: n }, (_, k) => kit.frame(fw / S, fh / S, 0, (put) => {
      for (let j = 0; j < fh; j++) for (let i = 0; i < fw; i++) put(i, j, draw(k, i, j));
    }, true)));
    return cache.get(key);
  };
  let count = 0;
  const TONE = [0x60f090, 0xf06070, 0xff60a0, 0xffa050, 0xff60c0, 0xc0a0f0, 0xffb020, 0x70ffa0, 0xffc0d0, 0xffd848, 0xffe890, 0xa8e0d0, 0xb070e0, 0x40e0f0];

  /** A screen w x h with its top-left at (x, u), showing a picture of a kind. over: the foot of what it hangs on. */
  const screen = (x, u, w, h, kind, over, n = 6, fps = 4) => {
    const [fw, fh] = [Math.round(w * S), Math.round(h * S)];
    const at = (k, i, j) => (i === 0 || j === 0 || i === fw - 1 || j === fh - 1 ? 0x18181e : picture(kind, i, j, fw, fh, k / n));
    mark(x, u, (X, Y) => {
      for (let j = 0; j < fh; j++) for (let i = 0; i < fw; i++) E(X + i, Y + j, at(0, i, j));
    }, over);
    props.loop(x, u, frames(`s|${kind}|${fw}|${fh}|${n}`, n, fw, fh, at), { fps, ph: (count++ * 0.37) % 1, d: 0.2 });
    halo(FX(x + w / 2), FY(over ?? u - h) + 12, Math.max(16, fw * 0.8), 30, TONE[kind] ?? 0xffffff, 0.24);
  };

  /**
   * A sign w x h with its top-left at (x, u), of colour c, written on in strokes. type: 'blink' (on, off, on),
   * 'stack' (its cells lighting one after another), 'chase' (lamps running round its edge).
   */
  const sign = (type, x, u, w, h, c, over) => {
    const [fw, fh] = [Math.round(w * S), Math.round(h * S)];
    const up = fh > fw;
    const cells = Math.max(1, Math.floor((up ? fh : fw) / 6));
    const ink = c === 0xf4f0e8 || c === 0xf0c020 || c === 0xffe040 ? 0x2a2a30 : 0xfff8f0;
    const seed = fw * 31 + fh * 7 + (c & 255);
    const px = (lit, k) => (i, j) => {
      const rim = Math.min(i, j, fw - 1 - i, fh - 1 - j);
      if (rim === 0) return 0x1c1a22;
      if (type === 'chase' && rim === 1) {
        const m = j === 1 ? i : i === fw - 2 ? fw + j : j === fh - 2 ? fw + fh + (fw - i) : 2 * fw + fh + (fh - j);
        return m % 2 ? shade(c, 0.4) : mod((m >> 1) + k, 3) === 0 ? 0xffffff : shade(c, 0.55);
      }
      const [a, b, bl] = up ? [j, i, fw] : [i, j, fh];
      const cell = Math.min(cells - 1, Math.floor(a / 6));
      const la = a % 6;
      const g = la >= 1 && la <= 4 && b >= 2 && b < bl - 2 && (la === 2 || hashPx(cell * 7 + la, b, seed) < 0.5);
      const col = g ? ink : c;
      return lit(cell) ? col : shade(col, 0.2);
    };
    const all = () => true;
    let n, at, seq, fps;
    if (type === 'blink') [n, at, seq, fps] = [2, (k, i, j) => px(k ? () => false : all, 0)(i, j), [0, 0, 0, 0, 0, 0, 1, 0, 1, 0], 5];
    else if (type === 'stack') [n, at, seq, fps] = [cells + 1, (k, i, j) => px((q) => (up ? q <= k : q <= k) || k === cells, 0)(i, j), [...Array(cells + 1).keys(), cells, cells, cells], 4];
    else [n, at, seq, fps] = [3, (k, i, j) => px(all, k)(i, j), undefined, 6];
    mark(x, u, (X, Y) => {
      const p0 = px(all, 0);
      for (let j = 0; j < fh; j++) for (let i = 0; i < fw; i++) E(X + i, Y + j, p0(i, j));
    }, over);
    props.loop(x, u, frames(`${type}|${fw}|${fh}|${c}`, n, fw, fh, at), { fps, seq, ph: (count++ * 0.61) % 1, d: 0.2 });
    halo(FX(x + w / 2), FY(over ?? u - h) + 8, Math.max(12, fw * 0.9), 20, c, 0.2);
  };

  /**
   * Small lamps winking in the box w x h with its top-left at (x, u): one to a cell (cw x ch fine pixels, the lamp
   * at (ox, oy) in it), a share p of the cells, each changing colour from frame to frame.
   */
  const twinkle = (x, u, w, h, { cw = 6, ch = 12, ox = 1, oy = 4, p = 0.4, colors = [0x60e0ff, 0xff70b0, 0xfff060, 0x70f090, 0xffffff], seed = 1, fps = 3, size = 2 } = {}) => {
    const [fw, fh] = [Math.round(w * S), Math.round(h * S)];
    const fs = Array.from({ length: 3 }, (_, k) =>
      kit.frame(fw / S, fh / S, 0, (put) => {
        for (let gy = 0; gy * ch + oy + size <= fh; gy++)
          for (let gx = 0; gx * cw + ox + size <= fw; gx++) {
            if (hashPx(gx, gy, seed) > p) continue;
            const c = colors[Math.floor(hashPx(gx * 3 + k, gy, seed + 7) * colors.length)];
            for (let b = 0; b < size; b++) for (let a = 0; a < size; a++) put(gx * cw + ox + a, gy * ch + oy + b, c);
          }
      }, true));
    props.loop(x, u, fs, { fps, ph: (count++ * 0.43) % 1, d: 0.2 });
  };

  return { screen, sign, twinkle };
}
