// What Okinawa is built of, in fine pixels: red-tile Ryūkyū roofs laid in white mortar with a shisa on the ridge, flat concrete
// houses with their black water tanks and flower-block screens, coral-stone walls, subtropical planting, pots, shisa.
import { RAMPS } from '../nature.mjs';
import { C as BASE, S, hashPx, scaleColor, rampColor, rng, mix } from '../nagasaki/canvas.mjs';

export const C = {
  ...BASE,
  sand: [0xc9b78e, 0xd9c9a0, 0xe8dbb4, 0xf3ebcf],
  whiteSand: [0xdcd6c4, 0xebe7d8, 0xf5f2e8, 0xfdfcf6],
  lagoon: [0x0d5f86, 0x13799c, 0x1f96ac, 0x3cb6b8, 0x76d2c4],
  foam: 0xeef8f4,
  grass: [0x335f26, 0x42742c, 0x568a34, 0x6ea040],
  scrub: [0x2c5222, 0x3a6628, 0x4e7c30, 0x64923a],
  lane: [0xb8ac8c, 0xc8bc9a, 0xd6cba8, 0xe2d8b8],
  redEarth: [0x6e3622, 0x84442a, 0x985434, 0xaa6640],
  coral: [0x7e786a, 0x9a9482, 0xb2ac98, 0xcac4ae, 0xe0dac6],
  tile: [0x8a2e1c, 0xae3e26, 0xc6502e, 0xda663c, 0xe87e50],
  mortar: 0xf0ece0,
  rock: [0x34302c, 0x4a4540, 0x625c54, 0x7e776c, 0x9a9388],
  cane: [0x3a7428, 0x579632, 0x7cb646, 0x9cc85a],
  shuri: [0x8e1a14, 0xb8261c, 0xd8402a, 0xec5a3e],
  white: 0xece6d6,
  gold: 0xe2aa32,
};
export const KURO = [0x142a1c, 0x214428, 0x336034, 0x4a7c42]; // dark forest
export const COATS = [0xd04040, 0x3a6ad0, 0xe8c040, 0xe8e8f0, 0x6a9a5a, 0xf0a0b0, 0x3a3a4a, 0x2a8ac8, 0xe86a2a];

export function tools(k) {
  const { img, Y, objects } = k;
  const t = {};
  /** Something growing: palm, or a crown in its own ramp; hibiscus flowers on top. */
  t.plant = (kind, x, y, r, seed) => {
    if (kind === 'palm') return k.palm(x, y, r, seed);
    k.tree(x, y, r, RAMPS[kind] ?? RAMPS.tropic, seed, kind);
    if (kind === 'hibiscus')
      objects.push({
        y: y + r * 0.6 + 0.2,
        draw: () => {
          const g = rng(seed + 1);
          for (let i = 0; i < r * 5; i++) {
            const a = g() * 6.283;
            const dd = g() * r * 0.8;
            img.rectPx((x + Math.cos(a) * dd) * S, (y + Math.sin(a) * dd * 0.84) * S, 2, 2, g() < 0.7 ? 0xe8303a : 0xffd0d4);
          }
        },
      });
    return undefined;
  };
  /** A shisa at fine (X, Yb), about 9 fine pixels tall: terracotta, its mane in curls, mouth open or shut. */
  t.shisa = (X, Yb, open, c = 0xc8642e) => {
    for (let j = 0; j < 3; j++) for (let i = -3; i <= 3; i++) img.px(X + i, Yb - j, j === 0 ? scaleColor(c, 0.55) : scaleColor(c, 0.8));
    for (let j = 3; j < 7; j++) for (let i = -2; i <= 2; i++) img.px(X + i, Yb - j, i < 0 ? scaleColor(c, 1.2) : c);
    for (let j = 7; j < 10; j++) for (let i = -3; i <= 3; i++) if (Math.abs(i) + (j - 7) < 5) img.px(X + i, Yb - j, (i + j) % 3 === 0 ? scaleColor(c, 0.7) : c);
    img.px(X - 1, Yb - 8, 0x1a1210);
    img.px(X + 1, Yb - 8, 0x1a1210);
    if (open) for (let i = -1; i <= 1; i++) img.px(X + i, Yb - 7, 0x4a1a10);
    else for (let i = -1; i <= 1; i++) img.px(X + i, Yb - 7, scaleColor(c, 0.6));
  };
  /** The red-tile hip roof of the islands: courses of tile bedded in white mortar, white along ridge and hips. */
  t.tileRoof = (x, y, w, h, opt = {}) => {
    const R = opt.ramp ?? C.tile;
    const X0 = Math.round(x * S);
    const Y0 = Math.round(y * S);
    const WW = Math.round(w * S);
    const HH = Math.round(h * S);
    const ridge = Math.round(HH * 0.42);
    const hi = Math.round(HH * 0.45);
    for (let j = 0; j < HH; j++) {
      const north = j <= ridge;
      const f = north ? (ridge - j) / Math.max(1, ridge) : (j - ridge) / Math.max(1, HH - 1 - ridge);
      const inset = hi * (1 - f);
      for (let i = 0; i < WW; i++) {
        const li = i;
        const ri = WW - 1 - i;
        const hip = li < inset || ri < inset;
        const shade = li < inset ? 3 : ri < inset ? 0 : north ? 2 : 1;
        let c = R[shade];
        const tile = hip ? (j >> 2) : i >> 2;
        const v = hashPx(tile, hip ? i >> 3 : j >> 3, (opt.seed ?? 1) + 7);
        if (v < 0.14) c = scaleColor(c, 0.88);
        else if (v > 0.9) c = scaleColor(c, 1.12);
        // the rounded cover tiles, and the mortar between them
        if (hip ? j % 4 === 3 : i % 4 === 3) c = hashPx(i, j, 9) < 0.72 ? mix(c, C.mortar, 0.7) : c;
        else if (hip ? j % 4 === 0 : i % 4 === 0) c = scaleColor(c, 1.18);
        img.px(X0 + i, Y0 + j, c);
      }
    }
    for (let i = hi; i < WW - hi; i++) for (let j = -1; j <= 1; j++) img.px(X0 + i, Y0 + ridge + j, j ? 0xd8d4c8 : C.mortar);
    const hipLine = (ax, ay, bx, by) => {
      img.linePx(X0 + ax, Y0 + ay, X0 + bx, Y0 + by, C.mortar);
      img.linePx(X0 + ax + 1, Y0 + ay, X0 + bx + 1, Y0 + by, 0xd8d4c8);
    };
    hipLine(0, 0, hi, ridge);
    hipLine(WW - 2, 0, WW - 2 - hi, ridge);
    hipLine(0, HH - 1, hi, ridge);
    hipLine(WW - 2, HH - 1, WW - 2 - hi, ridge);
    for (let i = 0; i < WW; i++) img.px(X0 + i, Y0 + HH - 1, scaleColor(R[0], 0.8));
    if (opt.shisa !== false) t.shisa(X0 + (WW >> 1), Y0 + ridge + 1, (x | 0) % 2 === 0);
  };
  /** An old house: the roof above, a deep shaded veranda on wooden posts, sliding shutters. */
  t.house = (x, y, w, h, opt = {}) => {
    const fh = opt.faceH ?? 3.4;
    const seed = opt.seed ?? Math.round(x * 13 + y * 7);
    objects.push({
      y: y + h + fh + (opt.bias ?? 0),
      shadow: () => k.shadowRect(x + 2.4, y + 3, w, h + fh, 0.52),
      draw: () => {
        const X0 = Math.round((x + 0.4) * S);
        const WW = Math.round((w - 0.8) * S);
        const FY = Math.round((y + h) * S);
        const FH = Math.round(fh * S);
        const wall = opt.wall ?? C.white;
        for (let j = 0; j < FH; j++)
          for (let i = 0; i < WW; i++) {
            let c = wall;
            if (j < 2) c = 0x1a1410;
            else if (i % 15 < 2) c = i % 15 ? C.oldWood[0] : C.oldWood[2];
            else if (opt.wall === undefined) {
              const b = Math.floor(i / 15);
              const open = hashPx(b, seed, 11) < 0.4;
              c = open ? (i % 4 ? 0x2a2420 : 0x4a3a2c) : j % 3 === 0 ? C.oldWood[1] : hashPx(i >> 1, b, 12) < 0.5 ? C.oldWood[3] : C.oldWood[2];
            }
            if (j >= FH - 1) c = scaleColor(c, 0.6);
            if (i >= WW - 2) c = scaleColor(c, 0.72);
            img.px(X0 + i, FY + j, c);
          }
        t.tileRoof(x, y, w, h, { ...opt, seed });
        opt.extra?.();
      },
    });
    if (opt.reserve !== false) k.reserve(x - 1, y - 1, w + 2, h + fh + 2);
  };
  /** A concrete house: flat roof, water tanks, maybe a solar panel, a stair head; flower-block screens on its front. */
  t.flat = (x, y, w, h, fh = 4, opt = {}) => {
    const seed = opt.seed ?? Math.round(x * 17 + y * 3);
    objects.push({
      y: y + h + fh,
      shadow: () => k.shadowRect(x + 2.4, y + 3, w, h + fh, 0.52),
      draw: () => {
        const base = opt.wall ?? 0xdedcd2;
        img.fine(x, y, w, h, (X, Yy, xx, yy) => {
          const e = Math.min(xx - x, x + w - xx, yy - y, y + h - yy);
          if (e < 0.34) return yy - y < 0.5 || xx - x < 0.5 ? 0xf0eee6 : 0x8a887f;
          if (e < 0.8) return 0xa8a69c;
          const c = rampColor([0xa8a69c, 0xb8b6ac, 0xc4c2ba], hashPx(X >> 3, Yy >> 3, seed), X, Yy);
          return hashPx(X, Yy, seed + 1) < 0.06 ? scaleColor(c, 0.88) : c;
        });
        const g = rng(seed);
        const tanks = 1 + Math.floor(g() * 3);
        for (let i = 0; i < tanks; i++) {
          const CX = (x + 3 + i * 4.4) * S;
          const CY = (y + 3.2) * S;
          img.discPx(CX + 2, CY + 3, 5, 0x000000, 0.3);
          img.discPx(CX, CY, 5, 0x18181e);
          img.discPx(CX - 1, CY - 1, 2.6, 0x4a4a56);
        }
        if (g() < 0.45 && w > 15) {
          const PX = (x + w - 9) * S;
          const PY = (y + 2.6) * S;
          for (let j = 0; j < 12; j++) for (let i = 0; i < 18; i++) img.px(PX + i, PY + j, j % 4 === 0 || i % 6 === 0 ? 0x5a6a8a : 0x24366a);
        }
        if (g() < 0.5 && h > 10) {
          const PX = (x + 2) * S;
          const PY = (y + h - 5) * S;
          for (let j = 0; j < 10; j++) for (let i = 0; i < 12; i++) img.px(PX + i, PY + j, j < 2 ? 0xf0eee6 : i > 9 ? 0x8a887f : 0xc4c2ba);
        }
        const X0 = Math.round(x * S);
        const WW = Math.round(w * S);
        const FY = Math.round((y + h) * S);
        const FH = Math.round(fh * S);
        for (let j = 0; j < FH; j++)
          for (let i = 0; i < WW; i++) {
            let c = base;
            if (j < 2) c = 0x6a685f;
            else if (j > FH - 2) c = scaleColor(base, 0.66);
            else {
              const q = i % 18;
              if (q >= 3 && q < 10 && j > 3 && j < FH - 3) c = hashPx(i >> 3, 1, seed) < 0.5 ? 0x3a4a5a : 0x5a7a8a;
              else if (q >= 11 && j > 2 && j < FH - 2 && hashPx(i >> 4, 2, seed) < 0.6) c = (i + j) % 4 < 2 ? 0x8a887f : 0xf0eee6; // hana-burokku
            }
            if (i >= WW - 2) c = scaleColor(c, 0.74);
            img.px(X0 + i, FY + j, c);
          }
        opt.extra?.();
      },
    });
    if (opt.reserve !== false) k.reserve(x - 1, y - 1, w + 2, h + fh + 2);
  };
  /** A coral-limestone wall along logical points [x, y]; breaks left where points repeat. */
  t.wall = (pts, thick = 1.6) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * S;
      const horiz = Math.abs(x1 - x0) >= Math.abs(y1 - y0);
      for (let q = 0; q <= n; q++) {
        const X = Math.round((x0 + ((x1 - x0) * q) / n) * S);
        const Yy = Math.round((y0 + ((y1 - y0) * q) / n) * S);
        const TH = Math.round(thick * S);
        if (horiz) {
          for (let j = 0; j < TH + 2; j++) {
            if (j >= TH) {
              img.tintPx(X, Yy + j, 0.66);
              continue;
            }
            const st = hashPx((X + (j >> 1) * 3) >> 2, j >> 1, 41);
            img.px(X, Yy + j, (X + (j >> 1) * 3) % 5 === 0 ? C.coral[0] : j === 0 ? C.coral[4] : rampColor(C.coral, 0.2 + st * 0.6, X, Yy + j));
          }
        } else {
          for (let j = 0; j < TH; j++) {
            const st = hashPx((Yy + j * 3) >> 2, j >> 1, 42);
            img.px(X + j, Yy, (Yy + j * 3) % 5 === 0 ? C.coral[0] : j === 0 ? C.coral[4] : rampColor(C.coral, 0.2 + st * 0.6, X + j, Yy));
          }
          for (let j = 0; j < 3; j++) img.tintPx(X + TH + j, Yy, 0.66 + j * 0.1);
        }
      }
      k.reserve(Math.min(x0, x1) - 0.5, Math.min(y0, y1) - 0.5, Math.abs(x1 - x0) + thick + 1, Math.abs(y1 - y0) + thick + 1);
    }
  };
  /** A pot or jar for sale at fine (X, Yy). */
  const GLAZE = [0x2a4a8a, 0x3a6a3a, 0x7a4a26, 0x4a3226, 0xe8e0cc, 0xa8542a, 0x2a7a8a];
  t.pot = (X, Yy, n) => {
    const c = GLAZE[n % GLAZE.length];
    const big = n % 4 === 0;
    const r = big ? 4 : 2.6;
    img.discPx(X + 1, Yy + 2, r, 0x1e1a16, 0.4);
    img.discPx(X, Yy, r, scaleColor(c, 0.74));
    img.discPx(X - 0.6, Yy - 0.6, r - 0.8, c);
    img.px(X - 1, Yy - 1, scaleColor(c, 1.5));
    if (big) img.discPx(X, Yy - 1, 1.4, 0x1a1410);
  };
  /** A car seen from above, pointing right, painted on the ground. */
  t.parked = (x, y, c, across = false) => {
    const put = (i, j, q) => (across ? img.px(x * S + j, y * S + i, q) : img.px(x * S + i, y * S + j, q));
    for (let j = 0; j < 12; j++)
      for (let i = 0; i < 21; i++) {
        if ((i === 0 || i === 20) && (j === 0 || j === 11)) continue;
        let q = j === 0 ? scaleColor(c, 1.2) : j === 11 ? scaleColor(c, 0.7) : c;
        if (i > 13 && i < 17) q = j > 0 && j < 11 ? 0x283440 : scaleColor(c, 0.6);
        else if (i > 5 && i < 14 && j > 0 && j < 11) q = scaleColor(c, 1.12);
        else if (i > 3 && i < 6) q = j > 0 && j < 11 ? 0x34404c : scaleColor(c, 0.6);
        put(i, j, q);
      }
    for (let i = -2; i < 22; i++) img.tintPx(across ? x * S + 12 : x * S + i, across ? y * S + i : y * S + 12, 0.7);
  };
  return t;
}
