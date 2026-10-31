// Middle layer (Sapporo, winter): the Ōkurayama ski jump at sunset, a suburb of tin-roofed houses,
// the city centre with the Clock Tower and the red-brick Akarenga, Susukino's neon, the frozen
// Toyohira river, Nakajima park, the Snow Festival along Ōdōri park and the TV Tower plaza at night.
//
// Everything is painted in neutral daylight colours and then graded by strip position (sunset ->
// dusk -> night). Lit windows, lamps and neon are collected separately and painted after the grade,
// so they glow in the dark. Valleys beside the ski jump stay transparent (far layer shows through).
//
// Live (see ../props.mjs): the chairlift runs, a jumper goes down the in-run and flies, cars drive up
// Ekimae-dōri and across town, chimneys smoke, the open channel of the frozen river steams, Susukino's
// neon walls flicker, the ramen alley steams, skaters circle the rink on Shōbu pond and the TV Tower's
// big clock counts the time of the stage.
//
// Coordinates: u = distance from the bottom of the strip (stage start), strip y = L - u.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Raster, fbm, rng, bayer, scaleColor, rgb, mix } from '../../lib/raster.mjs';
import { crownPixels, rampColor } from '../nature.mjs';
import { PropKit, puff, todGrade, tintTable } from '../props.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export const W = 180;
export const CHUNK = 512;
export const CHUNKS = 14;
export const L = CHUNK * CHUNKS;

// sections (u)
const JUMP = [0, 1100];
const SUBURB = [1100, 2200];
const CENTER = [2200, 3100];
const SUSUKINO = [3100, 3660];
const RIVER = [3660, 3840];
const PARK = [3840, 5000];
const ODORI = [5000, 6820];
const PLAZA = [6600, L];

// streets: north-south avenues (x, half width) and east-west streets (u, half width)
const AVENUES = [
  [30, 6],
  [90, 6],
  [150, 6],
];
const STREETS = [1200, 1330, 1600, 1740, 2010, 2140, 2240, 2470, 2650, 3000, 3110, 3230, 3350, 3470];
const ALLEY = 3590; // Susukino ramen alley
const ODORI_CROSS = [5000, 5200, 5400, 5600, 5800, 6000, 6160, 6380, 6600, 6820];
const ODORI_SIDE = [14, 166]; // streets along both sides of the park

const C = {
  snow: [0xa4aec6, 0xbec8da, 0xd6dcea, 0xecf0f8],
  packed: [0xaeaaa4, 0xbcb8b0, 0xcac6be],
  track: 0x8a8378,
  bank: 0xf4f6fa,
  ice: [0x86a0b8, 0x98b2c6, 0xb0c6d6, 0xc8dae6],
  water: 0x1c2c3c,
  brick: [0x6a2a1e, 0x8c3828, 0xa84a32],
  concrete: [0x6e7078, 0x86888e, 0x9c9ea4, 0xb2b4ba],
  slate: [0x3c4450, 0x4c5562, 0x5e6876],
  roofs: [0xb03a2a, 0x2c5c9c, 0x2a7a4c, 0x7a4a2c, 0x2a8a86, 0x8a2a4a, 0x5a5a6a],
  siding: [0xd8d0c0, 0xc0c4c8, 0xb89a7a, 0xe0dcd2, 0x9aa4ae],
  twig: 0x564852,
  twigTip: 0x7a6c76,
  windowDark: 0x2a3444,
  warm: 0xffd88a,
  cool: 0xd8ecff,
  lamp: 0xffb868,
};
const NEON = [0xff4aa8, 0x40e8ff, 0xffe040, 0x66ff8a, 0xff8a30, 0xb46cff, 0xff5050];

// time of day along the strip: [u, multiply rgb, tint colour, tint amount]
const TOD = [
  [0, [1.0, 0.93, 0.9], 0xffa070, 0.05],
  [700, [0.96, 0.86, 0.88], 0xc0607a, 0.06],
  [1500, [0.68, 0.68, 0.9], 0x30306a, 0.1],
  [2400, [0.5, 0.55, 0.8], 0x141c44, 0.1],
  [L, [0.5, 0.55, 0.8], 0x141c44, 0.1],
];

const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const inSec = (u, [a, b]) => u >= a && u < b;

export function buildMid() {
  const stage = JSON.parse(readFileSync(join(root, 'src', 'data', 'stage3.json'), 'utf8'));
  const { mid: V, anchor } = stage.scroll;
  const img = new Raster(W, L);
  const rand = rng(3303);
  const Y = (u) => Math.round(L - u);
  const U = (y) => L - y;
  const reserved = new Uint8Array(W * L);
  const isRes = (x, y) => x >= 0 && x < W && y >= 0 && y < L && reserved[Math.floor(y) * W + Math.floor(x)];
  const anyRes = (x0, y0, w, h) => {
    for (let y = Math.floor(y0); y < y0 + h; y++) for (let x = Math.floor(x0); x < x0 + w; x++) if (isRes(x, y)) return true;
    return false;
  };
  const reserveRect = (x0, y0, w, h) => {
    for (let y = Math.max(0, Math.floor(y0)); y < Math.min(L, y0 + h); y++)
      for (let x = Math.max(0, Math.floor(x0)); x < Math.min(W, x0 + w); x++) reserved[y * W + x] = 1;
  };
  const objects = [];
  const lights = []; // emissive pixels, painted after the grade
  const pools = []; // additive light pools, after the grade
  const glow = (x, y, c, a = 1) => lights.push([Math.round(x), Math.round(y), c, a]);
  const pool = (x, y, r, c, k = 0.5) => pools.push({ x, y, r, c, k });
  const kit = new PropKit(3313); // the moving parts
  const tod = todGrade(TOD, smooth);
  /** A frame graded for strip position u; `lit` are [x, y, colour, alpha] pixels painted on afterwards. */
  const frameAt = (r, u, lit = []) => {
    tod.frame(r, u);
    for (const [x, y, c, a] of lit) r.set(x, y, c, a);
    return kit.frame(r);
  };
  // puffs for the live smoke and steam: chimneys, the ramen alley, the open channel of the frozen river
  const smoke = [2, 3, 4].map((r) => [0, 1].map((v) => kit.frame(puff(r, r * 11 + v, [0x707480, 0x9094a0, 0xb4b8c4, 0xd8dce4]))));
  const steam = [2, 3, 4].map((r) => [0, 1].map((v) => kit.frame(puff(r, r * 17 + v, [0xa8b0c0, 0xc8d0dc, 0xe4e8f0, 0xffffff]))));
  const shadowRect = (x, y, w, h, f = 0.6) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) img.tint(x + i, y + j, f);
  };
  const snowAt = (x, y, lo = 0.4, span = 0.5, seed = 5) => rampColor(C.snow, lo + fbm(x, y, { seed, scale: 9, octaves: 3 }) * span, x, y);

  // ------------------------------------------------------------ data from the wave file
  const pads = stage.waves.filter((w) => w.type === 'turret').map((w) => ({ x: w.x, u: anchor + V * w.t + 10 }));
  const plowRoads = stage.waves.filter((w) => w.type === 'plow' && typeof w.dir === 'number').map((w) => Math.round(anchor + V * w.t - w.y));
  for (const p of pads) reserveRect(p.x - 12, Y(p.u) - 12, 24, 24);

  // ------------------------------------------------------------ 1. ground: snow, valleys beside the jump
  const ridge = (u) => {
    const close = Math.max(0, u - 820) * 0.3;
    const n = (fbm(u, 3, { seed: 71, scale: 40, octaves: 2 }) - 0.5) * 14;
    return [20 + 14 * Math.sin(u / 150) + n - close, 160 + 12 * Math.sin(u / 190 + 2) - n * 0.7 + close];
  };
  for (let y = 0; y < L; y++) {
    const u = U(y);
    const [xl, xr] = u < JUMP[1] ? ridge(u) : [-99, 999];
    for (let x = 0; x < W; x++) {
      const d = Math.min(x + 0.5 - xl, xr - x - 0.5);
      if (d < 0) {
        // drop-off into the valley: dithered snowy lip, then transparent
        if (d > -2.5 && bayer(x, y) < 0.5 + d * 0.2) img.set(x, y, 0x8a90a8);
        continue;
      }
      let c = snowAt(x, y);
      if (u < JUMP[1]) {
        // wind-carved ripples on the mountain, shaded slope near the valley edge
        const rip = fbm(x * 0.4, y * 1.6, { seed: 72, scale: 5, octaves: 2 });
        if (rip > 0.66 && bayer(x, y) > 0.4) c = C.snow[3];
        if (d < 5) c = d < 1.5 ? C.snow[3] : rampColor(C.snow, 0.15 + d * 0.06, x, y);
      }
      img.set(x, y, c);
    }
  }

  // ------------------------------------------------------------ helpers: roads
  const roadPx = (x, y, across, hw, along) => {
    // packed snow with tire tracks in each lane, a ploughed snow bank along the edge
    const a = Math.abs(across);
    if (a > hw) {
      img.set(x, y, a > hw + 1.5 ? C.snow[2] : C.bank);
      return;
    }
    let c = rampColor(C.packed, fbm(x, y, { seed: 31, scale: 4, octaves: 2 }), x, y);
    const lane = hw >= 5 ? Math.abs(a - hw / 2) : a;
    if (Math.abs(lane - 1.5) < 0.6 && fbm(along * 0.3, across, { seed: 33, scale: 3 }) > 0.3) c = C.track;
    img.set(x, y, c);
  };
  const vRoad = (cx, hw, u0, u1, yabane = true) => {
    for (let u = u0; u < u1; u++) {
      const y = Y(u);
      for (let x = Math.floor(cx - hw - 3); x <= cx + hw + 2; x++) roadPx(x, y, x + 0.5 - cx, hw, u);
      if (yabane && u % 34 === 0) for (const s of [-1, 1]) yabaneSign(Math.round(cx + s * (hw + 2)), y);
    }
    reserveRect(cx - hw - 4, Y(u1), hw * 2 + 8, u1 - u0);
  };
  const hRoad = (uc, hw, x0 = 0, x1 = W, yabane = true) => {
    for (let u = Math.floor(uc - hw - 3); u <= uc + hw + 2; u++) {
      const y = Y(u);
      for (let x = x0; x < x1; x++) roadPx(x, y, u + 0.5 - uc, hw, x);
    }
    if (yabane) for (let x = x0 + 8; x < x1; x += 34) for (const s of [-1, 1]) yabaneSign(x, Y(uc + s * (hw + 2)));
    reserveRect(x0, Y(uc + hw + 4), x1 - x0, hw * 2 + 8);
  };
  /** Yabane: red-and-white arrow on a pole marking the road edge under the snow. */
  function yabaneSign(x, y) {
    objects.push({
      y: y + 1,
      shadow: () => {
        img.tint(x + 1, y + 1, 0.6);
        img.tint(x + 2, y + 2, 0.6);
      },
      draw: () => {
        img.set(x, y - 1, 0xe23a2a);
        img.set(x, y, 0xf4f4f4);
        img.set(x, y + 1, 0xe23a2a);
      },
    });
  }
  const streetLamp = (x, y, warm = true) => {
    objects.push({
      y,
      shadow: () => img.tint(x + 1, y + 1, 0.6),
      draw: () => {
        img.set(x, y, 0x3a3a44);
        glow(x, y, warm ? 0xfff0c0 : 0xe8f4ff);
        pool(x + 0.5, y + 0.5, 11, warm ? C.lamp : 0xbcd8ff, 0.42);
      },
    });
  };

  // ------------------------------------------------------------ helpers: buildings & props
  const windowsRow = (x0, x1, y, litP, step = 3, cool = false) => {
    for (let x = x0; x < x1; x += step) {
      if (rand() < litP) glow(x, y, cool ? C.cool : C.warm);
      else img.set(x, y, C.windowDark);
    }
  };
  /** Hokkaido house: steep gable tin roof (colour shows where the snow slid off), sided walls, windbreak porch. */
  const tinHouse = (x, y, w, h, opt = {}) => {
    const roof = opt.roof ?? rand.pick(C.roofs);
    const wall = opt.wall ?? rand.pick(C.siding);
    const faceH = 4;
    const ridge = y + Math.floor(h / 2);
    const seed = Math.floor(rand() * 1e6);
    const porch = rand() < 0.7 ? x + 2 + Math.floor(rand() * (w - 8)) : -1;
    const litP = opt.lit ?? 0.5;
    objects.push({
      y: y + h + faceH,
      shadow: () => shadowRect(x + 3, y + 3, w, h + faceH, 0.55),
      draw: () => {
        for (let yy = y; yy < y + h; yy++)
          for (let xx = x; xx < x + w; xx++) {
            const north = yy < ridge;
            const metal = north ? scaleColor(roof, 1.15) : roof;
            const eave = yy >= y + h - 1 || yy === y;
            const cover = fbm(xx, yy, { seed, scale: 4, octaves: 2 }) + (north ? 0.08 : -0.05);
            let c = !eave && cover > 0.38 ? (north ? C.snow[3] : C.snow[2]) : metal;
            if (xx === x || xx === x + w - 1) c = scaleColor(c, 0.8);
            if ((xx - x) % 3 === 1 && c === metal) c = scaleColor(metal, 0.85); // standing seams
            img.set(xx, yy, c);
          }
        img.rect(x, ridge, w, 1, scaleColor(roof, 0.7));
        for (let yy = y + h; yy < y + h + faceH; yy++) for (let xx = x + 1; xx < x + w - 1; xx++) img.set(xx, yy, yy === y + h ? 0x3a3238 : wall);
        windowsRow(x + 3, x + w - 3, y + h + 2, litP, 4);
        if (porch >= 0) {
          img.rect(porch, y + h + 1, 5, 4, scaleColor(wall, 0.9));
          img.rect(porch, y + h + 1, 5, 1, C.snow[3]);
          glow(porch + 2, y + h + 3, C.warm);
          pool(porch + 2.5, y + h + 6, 7, C.warm, 0.3);
        }
        if (opt.chimney) {
          img.rect(x + w - 5, y + 2, 2, 3, 0x4a4a52);
          img.set(x + w - 5, y + 2, C.snow[3]);
        }
      },
    });
    reserveRect(x - 1, y - 1, w + 2, h + faceH + 2);
    // the stove's smoke curling from the chimney, blown by the wind (live)
    if (opt.chimney) kit.emit(x + w - 4, U(y + 2), smoke, { rate: 1.1, life: [2, 3], vy: 5, sx: 0.5, wf: 1, a: 0.5, tint: 1 });
  };
  /** Flat "no-snow-fall" roof (mu-rakusetsu): a snow-filled tray with a parapet and a centre drain. */
  const flatHouse = (x, y, w, h, opt = {}) => {
    const wall = opt.wall ?? rand.pick(C.siding);
    const litP = opt.lit ?? 0.5;
    objects.push({
      y: y + h + 4,
      shadow: () => shadowRect(x + 3, y + 3, w, h + 4, 0.55),
      draw: () => {
        img.rect(x, y, w, h, 0x8a8c94);
        for (let yy = y + 1; yy < y + h - 1; yy++) for (let xx = x + 1; xx < x + w - 1; xx++) img.set(xx, yy, snowAt(xx, yy, 0.6, 0.35, 7));
        img.set(x + Math.floor(w / 2), y + Math.floor(h / 2), C.snow[1]);
        for (let yy = y + h; yy < y + h + 4; yy++) for (let xx = x + 1; xx < x + w - 1; xx++) img.set(xx, yy, yy === y + h ? 0x3a3238 : wall);
        windowsRow(x + 2, x + w - 2, y + h + 2, litP, 3);
      },
    });
    reserveRect(x - 1, y - 1, w + 2, h + 6);
  };
  /** Kerosene tank for the house heating: a small coloured drum on legs. */
  const tank = (x, y) => {
    const c = rand.pick([0xd04a3a, 0xe8e4dc, 0x3a8a5a, 0x3a6aa8]);
    objects.push({
      y: y + 2,
      shadow: () => shadowRect(x + 1, y + 2, 3, 2, 0.55),
      draw: () => {
        img.rect(x, y, 3, 2, c);
        img.set(x, y, scaleColor(c, 1.25));
        img.rect(x, y - 1, 3, 1, C.snow[3]);
      },
    });
  };
  /** Car buried under fresh snow, only a strip of paint showing. */
  const car = (x, y, vertical = true) => {
    const w = vertical ? 4 : 7;
    const h = vertical ? 7 : 4;
    const paint = rand.pick([0xb02a2a, 0x2a4a8a, 0x2a2a30, 0xe0e0e0, 0x6a6a72]);
    objects.push({
      y: y + h,
      shadow: () => shadowRect(x + 1, y + 1, w, h, 0.6),
      draw: () => {
        for (let j = 0; j < h; j++)
          for (let i = 0; i < w; i++) {
            const edge = (i === 0 || i === w - 1) && (j === 0 || j === h - 1);
            if (!edge) img.set(x + i, y + j, j === h - 1 ? paint : j < 2 ? C.snow[3] : C.snow[2]);
          }
      },
    });
  };
  /** Office / commercial block: snowy flat roof with a parapet and rooftop units, window grid below. */
  const office = (x, y, w, h, faceH, opt = {}) => {
    const wall = opt.wall ?? rand.pick(C.concrete.slice(1));
    const litP = opt.lit ?? 0.55;
    const units = [];
    for (let i = 0; i < Math.floor((w * h) / 260); i++) units.push([x + 3 + Math.floor(rand() * (w - 9)), y + 3 + Math.floor(rand() * (h - 8)), 3 + Math.floor(rand() * 4), 2 + Math.floor(rand() * 3)]);
    const neon = opt.neon ? Math.max(1, Math.floor(w / 6)) : 0;
    const signs = [];
    for (let i = 0; i < neon; i++) signs.push({ x: x + 1 + Math.floor((i + 0.5) * (w / neon)) - 1, c: rand.pick(NEON), h: Math.max(3, faceH - 2 - Math.floor(rand() * 3)) });
    const board = opt.billboard ? { c: rand.pick(NEON), w: Math.min(w - 4, 10 + Math.floor(rand() * 10)) } : null;
    objects.push({
      y: y + h + faceH,
      shadow: () => shadowRect(x + 4, y + 4, w, h + faceH, 0.5),
      draw: () => {
        img.rect(x, y, w, h, scaleColor(wall, 0.75));
        for (let yy = y + 1; yy < y + h - 1; yy++) for (let xx = x + 1; xx < x + w - 1; xx++) img.set(xx, yy, snowAt(xx, yy, 0.55, 0.4, 9));
        if (w * h > 900) {
          for (const [ax, ay] of [[x + 1, y + 1], [x + w - 2, y + 1]]) glow(ax, ay, 0xff3a2a);
          if (rand() < 0.5) {
            const hx = x + Math.floor(w / 2);
            const hy = y + Math.floor(h / 2);
            for (let a = 0; a < 6.28; a += 0.3) img.set(Math.round(hx + Math.cos(a) * 5), Math.round(hy + Math.sin(a) * 5), 0x9aa0ac);
            img.rect(hx - 2, hy - 2, 1, 5, 0x9aa0ac);
            img.rect(hx + 2, hy - 2, 1, 5, 0x9aa0ac);
            img.rect(hx - 1, hy, 3, 1, 0x9aa0ac);
          }
        }
        for (const [ux, uy, uw, uh] of units) {
          img.rect(ux + 1, uy + 1, uw, uh, scaleColor(C.snow[0], 0.7));
          img.rect(ux, uy, uw, uh, 0x7a7c84);
          img.rect(ux, uy, uw, 1, C.snow[3]);
        }
        for (let yy = y + h; yy < y + h + faceH; yy++) for (let xx = x; xx < x + w; xx++) img.set(xx, yy, yy === y + h ? scaleColor(wall, 0.6) : xx === x + w - 1 ? scaleColor(wall, 0.8) : wall);
        for (let r = y + h + 2; r < y + h + faceH - 1; r += 2) windowsRow(x + 2, x + w - 2, r, litP, 2, opt.cool);
        for (const s of signs) {
          for (let k = 0; k < s.h; k++) {
            glow(s.x, y + h + 1 + k, k % 3 === 2 ? 0xffffff : s.c);
            glow(s.x + 1, y + h + 1 + k, s.c, 0.8);
          }
          pool(s.x + 0.5, y + h + faceH + 2, 9, s.c, 0.35);
        }
        if (board) {
          // rooftop billboard: neon frame and pseudo-lettering
          const bx = x + Math.floor((w - board.w) / 2);
          const by = y + 2;
          img.rect(bx, by + 1, board.w, 4, 0x14101a);
          for (let i = 0; i < board.w; i++) {
            glow(bx + i, by, board.c);
            glow(bx + i, by + 5, board.c);
            if (i > 0 && i < board.w - 1 && rand() < 0.5) glow(bx + i, by + 2 + Math.floor(rand() * 2), rand() < 0.7 ? 0xffffff : board.c);
          }
          pool(bx + board.w / 2, by + 3, board.w * 0.7, board.c, 0.3);
        }
      },
    });
    reserveRect(x - 1, y - 1, w + 2, h + faceH + 2);
  };

  // ------------------------------------------------------------ helpers: trees
  const fir = (x, y, r) => {
    const seed = Math.floor(rand() * 1e9);
    const cx = Math.round(x);
    const cy = Math.round(y);
    const px = () => crownPixels('fir', cx, cy, r, rng(seed), seed & 1023);
    const off = Math.round(2 + r * 0.35);
    objects.push({
      y: cy + r * 0.6,
      shadow: () => {
        for (const p of px()) img.tint(p.x + off, p.y + off + 1, 0.6);
      },
      draw: () => {
        for (const p of px()) {
          const lit = p.x - cx + (p.y - cy) * 1.2 < 0;
          const dr = Math.hypot(p.x - cx, p.y - cy) / r;
          img.set(p.x, p.y, lit && dr < 0.75 && bayer(p.x, p.y) > 0.5 ? C.snow[3] : p.c);
        }
      },
    });
  };
  /** Bare deciduous tree (birch, elm, ginkgo in winter): radiating twigs. lights: festival illumination. */
  const bare = (x, y, r, lights = null) => {
    const tr = rng(Math.floor(rand() * 1e9));
    const cx = Math.round(x);
    const cy = Math.round(y);
    const twigs = [];
    const n = 5 + Math.floor(tr() * 3);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + tr() * 0.6;
      const len = r * (0.7 + tr() * 0.3);
      for (let j = 1; j <= len; j++) {
        const bx = cx + Math.cos(a) * j;
        const by = cy + Math.sin(a) * j;
        twigs.push([Math.round(bx), Math.round(by), j > len - 1.5]);
        if (j > len * 0.45 && j % 2 === 0) twigs.push([Math.round(bx + Math.cos(a + 1.1) * 1.5), Math.round(by + Math.sin(a + 1.1) * 1.5), true]);
      }
    }
    objects.push({
      y: cy + 1,
      shadow: () => {
        for (const [tx, ty] of twigs) img.tint(tx + 3, ty + 4, 0.72);
      },
      draw: () => {
        for (const [tx, ty, tip] of twigs) img.set(tx, ty, tip ? C.twigTip : C.twig);
        img.set(cx, cy, 0xd8d2d4);
        if (lights) for (const [tx, ty, tip] of twigs) if (tip || tr() < 0.25) glow(tx, ty, tr() < 0.75 ? lights : 0xffffff);
        if (lights) pool(cx, cy, r + 4, lights, 0.22);
      },
    });
  };
  const snowman = (x, y) => {
    objects.push({
      y: y + 3,
      shadow: () => {
        for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (i * i + j * j <= 5) img.tint(x + i + 2, y + j + 2, 0.6);
      },
      draw: () => {
        img.disc(x + 0.5, y + 0.5, 2.6, C.snow[3]);
        img.disc(x + 0.5, y - 1.5, 1.6, 0xffffff);
        img.set(x, y - 3, 0xc83a2a);
      },
    });
  };
  /** Kamakura: snow hut with a candle-lit doorway. */
  const kamakura = (x, y) => {
    objects.push({
      y: y + 6,
      shadow: () => {
        for (let j = -5; j <= 5; j++) for (let i = -5; i <= 5; i++) if (i * i + j * j <= 26) img.tint(x + i + 3, y + j + 3, 0.55);
      },
      draw: () => {
        img.disc(x + 0.5, y + 0.5, 5.2, C.snow[2]);
        img.disc(x - 0.5, y - 0.5, 3.4, C.snow[3]);
        img.rect(x - 1, y + 3, 3, 3, 0x2a1a14);
        glow(x, y + 4, 0xffa040);
        glow(x, y + 5, 0xffd080);
        pool(x + 0.5, y + 6, 7, 0xffa040, 0.45);
      },
    });
    reserveRect(x - 6, y - 6, 13, 13);
  };
  const crowd = (x0, y0, w, h, n) => {
    for (let i = 0; i < n; i++) {
      const x = Math.round(x0 + rand() * w);
      const y = Math.round(y0 + rand() * h);
      if (isRes(x, y)) continue;
      img.set(x, y + 1, 0x2a2a38);
      img.set(x, y, rand() < 0.35 ? rand.pick([0xd04040, 0x3a6ad0, 0xe8c040, 0xe8e8f0]) : 0x3a3a4a);
    }
  };

  // ------------------------------------------------------------ A. Ōkurayama ski jump (sunset)
  {
    const cx = 90;
    // outrun / stadium: packed snow, horseshoe stands, judges' tower and lodge
    for (let u = 110; u < 240; u++)
      for (let x = 44; x < 136; x++) {
        const e = ((x + 0.5 - cx) / 46) ** 2 + ((u - 175) / 66) ** 2;
        if (e < 1) img.set(x, Y(u), e > 0.9 ? C.snow[1] : (u + x) % 9 === 0 ? C.snow[2] : C.snow[3]);
      }
    for (let u = 112; u < 136; u++)
      for (let x = 36; x < 144; x++) {
        const e = ((x + 0.5 - cx) / 54) ** 2 + ((u - 175) / 66) ** 2;
        if (e >= 1 && e < 1.32) img.set(x, Y(u), (u + (x >> 1)) % 3 === 0 ? 0x4a5a7a : (u % 2 ? 0x7a8aa8 : 0x5a6a88));
      }
    crowd(44, Y(150), 92, 30, 70);
    reserveRect(36, Y(240), 108, 130);
    office(14, Y(205), 24, 16, 6, { wall: 0x8a6a4a, lit: 0.8 });
    // landing hill: groomed slope with distance lines (green = hill size, red = K point, blue ticks)
    for (let u = 235; u < 522; u++) {
      const t = (u - 235) / 287;
      const hw = 28 - t * 13;
      for (let x = Math.floor(cx - hw); x < cx + hw; x++) {
        const y = Y(u);
        const edge = x < cx - hw + 1.5 || x >= cx + hw - 1.5;
        let c = u % 3 === 0 ? C.snow[2] : C.snow[3];
        if (edge) c = (u % 4 < 2) ? 0x2a5a3a : 0x3a6a4a; // fir-branch markers along the hill
        if (u === 300 || u === 301) c = 0xd83a2a;
        if (u === 284) c = 0x3ab05a;
        if (u % 22 === 0 && !edge && Math.abs(x + 0.5 - cx) > hw - 5) c = 0x3a6ad0;
        img.set(x, y, c);
      }
      // slope shading: the hill drops away to the south, darker towards the knoll
      for (let x = Math.floor(cx - hw); x < cx + hw; x++) if (t > 0.75 && bayer(x, Y(u)) < (t - 0.75) * 2) img.tint(x, Y(u), 0.88);
    }
    reserveRect(cx - 32, Y(526), 64, 292);
    // take-off table and in-run on its steel structure, lamps along both sides
    img.rect(cx - 6, Y(523), 12, 2, 0x5a5e6a);
    objects.push({
      y: Y(522),
      shadow: () => shadowRect(cx + 5, Y(900), 6, 900 - 522, 0.55),
      draw: () => {
        for (let u = 522; u < 892; u++) {
          const y = Y(u);
          img.rect(cx - 5, y, 10, 1, 0x6a6e7a);
          img.rect(cx - 3, y, 6, 1, u % 2 ? C.snow[3] : C.snow[2]);
          img.set(cx - 2, y, 0x8a96aa);
          img.set(cx + 1, y, 0x8a96aa);
          if (u % 14 === 0) glow(u % 28 === 0 ? cx - 5 : cx + 4, y, 0xfff0c8);
        }
      },
    });
    for (let u = 530; u < 892; u += 28) pool(cx, Y(u), 8, C.lamp, 0.28);
    reserveRect(cx - 9, Y(896), 20, 376);
    office(cx - 14, Y(940), 28, 16, 8, { wall: 0x6a6e7a, lit: 0.9 });
    // chairlift: pylons, double cable and chairs
    const lift = (t) => [140 - t * 20, 200 + t * 735];
    objects.push({
      y: Y(200),
      shadow: () => {},
      draw: () => {
        for (let k = 0; k <= 735; k++) {
          const [x, u] = lift(k / 735);
          img.set(Math.round(x - 2), Y(u), 0x3a3c48);
          img.set(Math.round(x + 2), Y(u), 0x3a3c48);
        }
        for (let k = 0; k <= 735; k += 92) {
          const [x, u] = lift(k / 735);
          img.rect(Math.round(x - 3), Y(u), 7, 1, 0x5a5c68);
          img.rect(Math.round(x), Y(u) - 1, 1, 3, 0x4a4c58);
          img.tint(Math.round(x + 3), Y(u) + 4, 0.55);
        }
      },
    });
    for (let k = 0; k <= 735; k += 4) {
      const [x, u] = lift(k / 735);
      reserveRect(x - 3, Y(u) - 1, 7, 3);
    }
    // live: the chairs going up one cable and down the other, their shadows on the snow
    {
      const chair = new Raster(3, 4);
      chair.set(0, 1, 0x24242c);
      chair.set(2, 3, 0x101018, 0.4);
      const cf = frameAt(chair, 560);
      const [x0, u0] = lift(0);
      const [x1, u1] = lift(1);
      kit.path([[x0 + 3, u0 - 1], [x1 + 3, u1 - 1]], [cf], { sp: 7, n: 33, gap: 22, turn: 'none', s0: 0 });
      kit.path([[x1 - 1, u1 - 1], [x0 - 1, u0 - 1]], [cf], { sp: 7, n: 33, gap: 22, turn: 'none', s0: 0.5 });
    }
    // live: a jumper crouched down the in-run, off the table and gliding down to the landing
    {
      const jumper = new Raster(5, 6);
      jumper.rect(2, 1, 1, 3, 0x2a3a8a);
      jumper.set(2, 0, 0xe84a3a);
      jumper.set(1, 2, 0x1a2a6a);
      jumper.set(3, 2, 0x1a2a6a);
      jumper.set(1, 4, 0x3a3a48);
      jumper.set(3, 4, 0x3a3a48);
      jumper.set(0, 5, 0x3a3a48);
      jumper.set(4, 5, 0x3a3a48); // skis in a V
      jumper.set(3, 5, 0x101018, 0.3);
      kit.path([[cx, 888], [cx, 524], [cx, 300], [cx, 200], [cx, 120]], [frameAt(jumper, 500)], { sp: 30, turn: 'none' });
    }
    // forest edge to the suburbs: a few houses among the trees
    tinHouse(40, Y(1060), 16, 12, { lit: 0.8, chimney: true });
    tinHouse(120, Y(1040), 18, 12, { lit: 0.8 });
    tank(58, Y(1050));
  }

  // ------------------------------------------------------------ streets (B, C, D)
  for (const [x, hw] of AVENUES) vRoad(x, hw, SUBURB[0] - 10, x === 90 ? CENTER[0] : RIVER[0]);
  vRoad(90, 10, CENTER[0], RIVER[0], false); // Ekimae-dōri / main street through the centre and Susukino
  for (const u of STREETS) hRoad(u, 5);
  for (const u of plowRoads) if (u < RIVER[0]) hRoad(u, 6);
  // lamps at the crossings
  for (const u of [...STREETS, ...plowRoads.filter((u) => u < RIVER[0])])
    for (const [x] of AVENUES) {
      if (u < SUBURB[0]) continue;
      streetLamp(x - 9, Y(u + 8), u > 2000);
      if (u > CENTER[0]) streetLamp(x + 9, Y(u - 8), true);
    }

  // live traffic: cars driving up Ekimae-dōri (tail lights only, so nothing bright heads down the screen)
  // and along the cross streets the snowplows don't use
  {
    const carUp = (c) => {
      const r = new Raster(3, 5);
      r.rect(0, 0, 3, 5, c);
      r.rect(0, 0, 3, 1, C.snow[3]);
      return frameAt(r, 2800, [[0, 4, 0xff3020, 0.8], [2, 4, 0xff3020, 0.8]]);
    };
    const ups = [0x2a2a30, 0xe0e0e8, 0x8a2a2a, 0xe8c030].map(carUp);
    for (let k = 0; k < 4; k++) kit.path([[95, CENTER[0] + 20], [95, RIVER[0] - 12]], [ups[k]], { sp: 11 + k * 2, n: 2, gap: 380, turn: 'none' });
    const carSide = (c) => {
      const r = new Raster(5, 3);
      r.rect(0, 0, 5, 3, c);
      r.rect(1, 0, 3, 1, C.snow[3]);
      return frameAt(r, 2800, [[4, 0, 0xfff4d0, 0.5], [4, 2, 0xfff4d0, 0.5], [0, 0, 0xff3020, 0.6], [0, 2, 0xff3020, 0.6]]);
    };
    const sides = [0xe0e0e8, 0x3a5a9a, 0x2a2a30, 0x8a2a2a].map(carSide);
    STREETS.filter((s) => s > CENTER[0] && !plowRoads.some((p) => Math.abs(p - s) < 20)).forEach((s, k) => {
      kit.path([[-8, s - 2], [188, s - 2]], [sides[k % 4]], { sp: 13, n: 1, turn: 'flip' });
      kit.path([[188, s + 2], [-8, s + 2]], [sides[(k + 2) % 4]], { sp: 10, n: 1, turn: 'flip' });
    });
  }
  // parked and waiting cars in the centre and Susukino: headlights (down lane) and tail lights (up lane)
  for (let u = CENTER[0] + 20; u < RIVER[0] - 12; u += 9) {
    if (rand() < 0.45) continue;
    if ([...STREETS, ...plowRoads].some((s) => Math.abs(u - s) < 12)) continue;
    const y = Y(u);
    const down = rand() < 0.5;
    const x = down ? 84 + Math.floor(rand() * 2) : 94 + Math.floor(rand() * 2);
    img.rect(x - 1, y - 2, 3, 5, rand.pick([0x2a2a30, 0xe0e0e8, 0x8a2a2a, 0xe8c030]));
    img.rect(x - 1, y - 2, 3, 1, C.snow[3]);
    if (down) {
      glow(x - 1, y + 3, 0xffffff);
      glow(x + 1, y + 3, 0xffffff);
      pool(x, y + 6, 6, 0xfff4d0, 0.4);
    } else {
      glow(x - 1, y + 3, 0xff3020);
      glow(x + 1, y + 3, 0xff3020);
    }
  }

  /** Fill a city block with lots (houses in the suburb, offices/neon further in). */
  const fillBlock = (x0, x1, u0, u1, kind) => {
    const rows = kind === 'suburb' ? Math.max(1, Math.floor((u1 - u0) / 38)) : u1 - u0 > 70 ? 2 : 1;
    const rowH = (u1 - u0) / rows;
    for (let r = 0; r < rows; r++) {
      const ub = u0 + r * rowH;
      let x = x0 + 1;
      while (x < x1 - 10) {
        const lw = Math.min(x1 - x, kind === 'suburb' ? 18 + Math.floor(rand() * 8) : 20 + Math.floor(rand() * 18));
        const top = Y(ub + rowH) + 3;
        const lh = Math.floor(rowH) - 6;
        if (lw < 12) break;
        if (kind === 'suburb') {
          const hw = lw - 3;
          const hh = Math.min(lh - 12, 12 + Math.floor(rand() * 6));
          const hx = x + 1;
          const hy = top + 1 + Math.floor(rand() * 2);
          if (!anyRes(hx - 1, hy - 1, hw + 2, hh + 7) && hh >= 9) {
            if (rand() < 0.72) tinHouse(hx, hy, hw, hh, { lit: 0.55, chimney: rand() < 0.3 });
            else flatHouse(hx, hy, hw, hh, { lit: 0.55 });
            if (rand() < 0.85) tank(hx + hw - 3, hy + hh + 6);
            if (rand() < 0.55 && !anyRes(hx + 1, hy + hh + 7, 6, 8)) car(hx + 2, hy + hh + 7, true);
          }
        } else {
          const neon = kind === 'neon';
          const fh = neon ? 8 + Math.floor(rand() * 6) : 5 + Math.floor(rand() * 6);
          const bh = Math.max(10, lh - fh - 2);
          if (!anyRes(x, top, lw - 2, bh + fh + 2)) office(x, top, lw - 2, bh, fh, { neon, billboard: neon && rand() < 0.85, cool: !neon && rand() < 0.5, lit: neon ? 0.75 : 0.6 });
          else pocketPark(x, top, lw - 2, lh);
        }
        x += lw;
      }
    }
  };
  /** Lot that could not take a building (a snowman stands there): trees, a lamp, parked cars. */
  function pocketPark(x0, y0, w, h) {
    for (let k = 0; k < 8; k++) {
      const x = x0 + 3 + rand() * (w - 6);
      const y = y0 + 3 + rand() * (h - 6);
      if (anyRes(x - 4, y - 4, 8, 8)) continue;
      if (rand() < 0.5) bare(x, y, 4 + rand() * 2);
      else if (rand() < 0.5) fir(x, y, 3.5 + rand());
      else car(Math.round(x), Math.round(y), rand() < 0.5);
      reserveRect(x - 4, y - 4, 8, 8);
    }
    streetLamp(Math.round(x0 + w / 2), Math.round(y0 + 2), true);
  }
  const allStreets = [...STREETS, ...plowRoads.filter((u) => u < RIVER[0]), SUBURB[0] - 10, ALLEY].sort((a, b) => a - b);
  const blocksX = (u) => {
    const wide = u >= CENTER[0];
    return [
      [0, 19],
      [41, wide ? 75 : 79],
      [wide ? 105 : 101, 139],
      [161, W],
    ];
  };
  // landmarks first, so the lots fill in around them
  // Sapporo Clock Tower: white wooden drill hall with a red roof and a clock tower, dwarfed by offices
  {
    const x = 106;
    const y = Y(2600);
    objects.push({
      y: y + 26,
      shadow: () => shadowRect(x + 4, y + 2, 28, 26, 0.5),
      draw: () => {
        for (let yy = y + 6; yy < y + 20; yy++)
          for (let xx = x; xx < x + 28; xx++) {
            const north = yy < y + 13;
            let c = north ? 0x9a4232 : 0x823426;
            if (fbm(xx, yy, { seed: 91, scale: 3 }) > 0.5) c = north ? C.snow[3] : C.snow[2];
            img.set(xx, yy, c);
          }
        img.rect(x, y + 13, 28, 1, 0x5a2218);
        for (let yy = y + 20; yy < y + 26; yy++) for (let xx = x + 1; xx < x + 27; xx++) img.set(xx, yy, yy === y + 20 ? 0x4a3a34 : 0xe8e4dc);
        for (let xx = x + 3; xx < x + 26; xx += 3) glow(xx, y + 23, C.warm);
        // the tower: red pyramid roof over a white drum with the clock face
        img.rect(x + 2, y, 9, 12, 0xe8e4dc);
        img.rect(x + 2, y, 9, 4, 0xa84232);
        img.rect(x + 4, y - 1, 5, 2, 0xa84232);
        img.disc(x + 6.5, y + 7.5, 2.6, 0x2a2a30);
        img.disc(x + 6.5, y + 7.5, 2, 0xf8f4ea);
        img.set(x + 6, y + 6, 0x2a2a30);
        img.set(x + 6, y + 7, 0x2a2a30);
        img.set(x + 7, y + 7, 0x2a2a30);
        glow(x + 6, y + 9, 0xfff8e0, 0.6);
        pool(x + 14, y + 30, 18, 0xffe0b0, 0.4);
      },
    });
    reserveRect(x - 3, y - 6, 36, 40);
    snowman(x + 30, y + 30);
  }
  // Akarenga: red-brick government office with an octagonal dome and red stars; garden with a frozen pond
  {
    const x = 41;
    const y = Y(2766);
    objects.push({
      y: y + 30,
      shadow: () => shadowRect(x + 4, y + 3, 34, 30, 0.5),
      draw: () => {
        for (let yy = y + 4; yy < y + 22; yy++)
          for (let xx = x; xx < x + 34; xx++) {
            let c = yy < y + 13 ? C.slate[2] : C.slate[1];
            if (fbm(xx, yy, { seed: 92, scale: 3 }) > 0.42) c = yy < y + 13 ? C.snow[3] : C.snow[2];
            if (xx === x || xx === x + 33) c = C.slate[0];
            img.set(xx, yy, c);
          }
        for (let yy = y + 22; yy < y + 30; yy++)
          for (let xx = x; xx < x + 34; xx++) img.set(xx, yy, yy === y + 22 ? 0x3a1a14 : (yy + (xx >> 2)) % 3 === 0 ? C.brick[0] : C.brick[1]);
        for (const r of [y + 24, y + 27]) for (let xx = x + 2; xx < x + 33; xx += 3) (rand() < 0.6 ? glow : img.set.bind(img))(xx, r, rand() < 0.6 ? C.warm : 0xe8e0d0);
        // octagonal dome with a red star
        for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) if (Math.abs(i) + Math.abs(j) <= 6) img.set(x + 17 + i, y + 9 + j, Math.abs(i) + Math.abs(j) > 4 ? 0x2a3a3a : i + j < 0 ? 0x5a7a72 : 0x3e5a54);
        img.set(x + 17, y + 9, 0xe02a2a);
        img.set(x + 17, y + 3, 0x3a3a40);
        glow(x + 17, y + 2, 0xff5040, 0.9);
        for (const sx of [x + 4, x + 29]) img.set(sx, y + 25, 0xe02a2a);
        pool(x + 17, y + 34, 20, 0xffc890, 0.38);
      },
    });
    reserveRect(x - 2, y - 2, 38, 36);
    // frozen pond in the front garden
    const py = Y(2690);
    for (let yy = py - 10; yy < py + 10; yy++)
      for (let xx = x + 4; xx < x + 34; xx++) {
        const e = ((xx + 0.5 - (x + 19)) / 15) ** 2 + ((yy + 0.5 - py) / 9) ** 2;
        if (e < 1) img.set(xx, yy, e > 0.8 ? C.snow[3] : rampColor(C.ice, 0.4 + fbm(xx, yy, { seed: 93, scale: 4 }) * 0.5, xx, yy));
      }
    reserveRect(x + 3, py - 11, 32, 22);
    for (let k = 0; k < 5; k++) bare(x + 2 + k * 8, Y(2668), 4);
  }

  // blocks
  for (let i = 0; i < allStreets.length - 1; i++) {
    const u0 = allStreets[i] + 9;
    const u1 = allStreets[i + 1] - 9;
    if (u1 - u0 < 20 || u0 < SUBURB[0] - 20) continue;
    const kind = u0 < CENTER[0] - 40 ? 'suburb' : u0 < SUSUKINO[0] ? 'city' : 'neon';
    for (const [x0, x1] of blocksX(u0)) fillBlock(x0, x1, u0, u1, kind);
  }

  // Susukino: the big crossing's neon walls and the ramen alley with red lanterns and steam
  {
    for (const [x, u] of [[64, 3366], [104, 3366], [64, 3334], [104, 3334]]) {
      const c = rand.pick(NEON);
      for (let k = 0; k < 12; k++) for (let j = 0; j < 4; j++) if ((k + j) % 5 !== 0) glow(x + k, Y(u) + j, j === 0 || j === 3 ? c : rand() < 0.6 ? 0xffffff : rand.pick(NEON));
      pool(x + 6, Y(u) + 2, 14, c, 0.4);
      // live: the lettering flickers and changes (frames drawn with their own random numbers)
      const pr = rng(x * 7 + u);
      const signs = [0, 1, 2].map(() => {
        const r = new Raster(12, 4);
        for (let k = 0; k < 12; k++) for (let j = 1; j < 3; j++) r.set(k, j, (k + j + Math.floor(pr() * 3)) % 4 === 0 ? 0x1a1420 : pr() < 0.6 ? 0xffffff : NEON[Math.floor(pr() * NEON.length)]);
        return kit.frame(r);
      });
      kit.loop(x, u, signs, { fps: 3, fx: 1 });
    }
    const ay = Y(ALLEY);
    for (let x = 0; x < W; x++)
      for (let j = -3; j <= 3; j++) img.set(x, ay + j, Math.abs(j) === 3 ? 0x3a3238 : rampColor(C.packed, 0.3 + fbm(x, j, { seed: 34, scale: 3 }) * 0.4, x, ay + j));
    reserveRect(0, ay - 4, W, 9);
    for (let x = 2; x < W; x += 4) {
      if (Math.abs(x - 30) < 9 || Math.abs(x - 90) < 12 || Math.abs(x - 150) < 9) continue;
      for (const s of [-2, 2]) {
        glow(x, ay + s, 0xff4a30);
        glow(x, ay + s + (s < 0 ? -1 : 1), 0xffa060, 0.7);
      }
      pool(x, ay, 6, 0xff5a30, 0.25);
      if (x % 12 === 2) kit.emit(x, ALLEY + 1, steam, { rate: 1.6, life: [1.6, 2.4], vy: 7, sx: 1, wf: 0.5, a: 0.45, tint: 1 });
    }
  }

  // ------------------------------------------------------------ river Toyohira: frozen, an open channel steaming
  {
    const [r0, r1] = RIVER;
    for (let u = r0; u < r1; u++) {
      const y = Y(u);
      for (let x = 0; x < W; x++) {
        const bankS = u - r0;
        const bankN = r1 - u;
        if (bankS < 14 || bankN < 14) {
          const d = Math.min(bankS, bankN);
          img.set(x, y, d < 3 ? 0x7a8094 : rampColor(C.snow, 0.2 + d * 0.05 + fbm(x, y, { seed: 51, scale: 5 }) * 0.2, x, y));
          continue;
        }
        const ch = (r0 + r1) / 2 + 22 * Math.sin(x / 34 + 1) + 8 * Math.sin(x / 13);
        const dch = Math.abs(u - ch);
        const cw = 4 + 2 * Math.sin(x / 21);
        if (dch < cw) {
          img.set(x, y, dch > cw - 1.2 ? C.ice[3] : bayer(x, y) > 0.8 ? 0x3a5a70 : 0x24384c);
          continue;
        }
        let c = rampColor(C.ice, 0.3 + fbm(x, y, { seed: 52, scale: 7, octaves: 3 }) * 0.6, x, y);
        if (fbm(x, y, { seed: 53, scale: 12 }) > 0.6) c = C.snow[2]; // snow drifts on the ice
        if (Math.abs(fbm(x, y, { seed: 54, scale: 10 }) - 0.5) < 0.012) c = C.ice[0]; // cracks
        img.set(x, y, c);
      }
    }
    reserveRect(0, Y(r1), W, r1 - r0);
    // mist over the open water
    for (let x = 0; x < W; x += 2) {
      const ch = (r0 + r1) / 2 + 22 * Math.sin(x / 34 + 1) + 8 * Math.sin(x / 13);
      if (rand() < 0.5) for (let k = 0; k < 4; k++) img.set(x + k, Y(ch) - 2 - Math.floor(rand() * 4), 0xffffff, 0.18);
      // the warmer water steams in the frosty air (live)
      if (x % 22 === 6) kit.emit(x, Math.round(ch) + 1, steam, { rate: 0.7, life: [2.2, 3.2], vy: 4, sx: 2, wf: 1.3, a: 0.3, tint: 1 });
    }
    // bridges with railings and lamps
    for (const [bx, hw] of [[90, 10], [30, 6]]) {
      objects.push({
        y: Y(r0),
        shadow: () => shadowRect(bx + hw + 1, Y(r1), 4, r1 - r0, 0.55),
        draw: () => {
          for (let u = r0 - 2; u < r1 + 2; u++) {
            const y = Y(u);
            for (let x = bx - hw; x <= bx + hw; x++) roadPx(x, y, x + 0.5 - bx, hw - 1, u);
            img.set(bx - hw - 1, y, 0x5a5e6a);
            img.set(bx + hw + 1, y, 0x5a5e6a);
            if (u % 16 === 0) for (const s of [-1, 1]) {
              glow(bx + s * (hw + 1), y, 0xfff0c8);
              pool(bx + s * (hw + 1), y, 9, C.lamp, 0.35);
            }
          }
        },
      });
    }
    for (let x = 4; x < W; x += 13) if (Math.abs(x - 90) > 16 && Math.abs(x - 30) > 11) bare(x + rand() * 4, Y(r1 + 4), 4.5);
  }

  // ------------------------------------------------------------ E. Nakajima park
  {
    const [p0, p1] = PARK;
    hRoad(p0 + 8, 5);
    // shovelled paths
    const path = (pts, w = 1.6) => {
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, u0] = pts[i];
        const [x1, u1] = pts[i + 1];
        const n = Math.max(Math.abs(x1 - x0), Math.abs(u1 - u0));
        for (let k = 0; k <= n; k++) {
          const x = x0 + ((x1 - x0) * k) / n;
          const y = Y(u0 + ((u1 - u0) * k) / n);
          for (let j = -2; j <= 2; j++)
            for (let i2 = -2; i2 <= 2; i2++) if (i2 * i2 + j * j <= w * w) img.set(Math.round(x + i2), Math.round(y + j), rampColor(C.packed, 0.5 + fbm(x, y, { seed: 35, scale: 3 }) * 0.4, x, y));
          if (k % 3 === 0) reserveRect(x - 2, y - 2, 5, 5);
        }
      }
    };
    path([[20, 3870], [40, 4000], [30, 4150], [60, 4250], [150, 4180], [160, 4000], [120, 3880]]);
    path([[60, 4250], [20, 4420], [40, 4600], [100, 4700], [150, 4600], [160, 4420], [150, 4180]]);
    path([[100, 4700], [80, 4850], [90, 4990]]);
    for (const [x, u] of [[40, 4000], [30, 4150], [150, 4180], [20, 4420], [40, 4600], [160, 4420], [100, 4700], [80, 4850]]) streetLamp(x + 4, Y(u), true);
    // Shōbu pond, frozen, with a cleared skating rink; skaters gliding round it (live)
    const pc = [92, 4400];
    for (const [coat, scarf] of [[0x2a3a6a, 0xe84a3a], [0x8a2a3a, 0xf0e0c0], [0x3a3a44, 0x3ab0e0], [0xe8e0d0, 0xe8a030]]) {
      const skater = (f) => {
        const r = new Raster(3, 5);
        r.set(1, 0, 0xe8c8a8);
        r.rect(0, 1, 3, 2, coat);
        r.set(f ? 2 : 0, 1, scarf);
        r.set(f ? 0 : 1, 3, 0x2a2a30);
        r.set(f ? 1 : 2, 4, 0x2a2a30);
        r.set(2, 4, 0x101018, 0.25);
        return frameAt(r, 4400);
      };
      kit.wander(pc[0], pc[1], 26, 34, [skater(0), skater(1)], { n: 2, sp: 9, idle: 0.15, turn: 'flip', fps: 3 });
    }
    for (let u = 4300; u < 4500; u++)
      for (let x = 30; x < 150; x++) {
        const e = ((x + 0.5 - pc[0]) / 50) ** 2 + ((u - pc[1]) / 80) ** 2 + (fbm(x, u, { seed: 55, scale: 14 }) - 0.5) * 0.3;
        if (e >= 1) continue;
        const y = Y(u);
        let c = e > 0.88 ? 0x6e7890 : rampColor(C.ice, 0.4 + fbm(x, y, { seed: 56, scale: 6 }) * 0.5, x, y);
        const rink = ((x + 0.5 - pc[0]) / 30) ** 2 + ((u - pc[1]) / 40) ** 2;
        if (rink < 1 && Math.abs(Math.sin((x - pc[0]) * 0.31 + (u - pc[1]) * 0.17)) < 0.08) c = C.ice[3]; // skate marks
        else if (rink >= 1 && e < 0.88 && fbm(x, y, { seed: 57, scale: 9 }) > 0.55) c = C.snow[3];
        img.set(x, y, c);
        reserved[y * W + x] = 1;
      }
    // Hōheikan: white Western-style guesthouse with ultramarine trim
    {
      const x = 118;
      const y = Y(4640);
      objects.push({
        y: y + 26,
        shadow: () => shadowRect(x + 4, y + 3, 40, 26, 0.5),
        draw: () => {
          for (let yy = y; yy < y + 18; yy++)
            for (let xx = x; xx < x + 40; xx++) img.set(xx, yy, fbm(xx, yy, { seed: 94, scale: 3 }) > 0.45 ? C.snow[3] : yy < y + 9 ? 0x5a6a82 : 0x4a5a72);
          img.rect(x + 14, y + 4, 12, 14, C.snow[3]);
          for (let yy = y + 18; yy < y + 26; yy++) for (let xx = x; xx < x + 40; xx++) img.set(xx, yy, yy === y + 18 || yy === y + 22 ? 0x2a4ab0 : 0xf2f0ea);
          for (let xx = x + 2; xx < x + 39; xx += 3) {
            glow(xx, y + 20, C.warm);
            glow(xx, y + 24, C.warm);
          }
          pool(x + 20, y + 30, 22, 0xffe0b0, 0.36);
        },
      });
      reserveRect(x - 2, y - 2, 44, 32);
    }
    // Kitara concert hall: big modern roof
    office(18, Y(4860), 56, 36, 8, { wall: 0x9a9ca4, lit: 0.8, cool: true });
    // cross-country ski track
    for (let u = 4520; u < 4800; u++) {
      const x = 30 + 10 * Math.sin(u / 40);
      img.set(Math.round(x), Y(u), C.snow[0]);
      img.set(Math.round(x + 3), Y(u), C.snow[0]);
    }
    for (const [x, u] of [[70, 4080], [130, 4060], [60, 4560], [140, 4780]]) snowman(x, Y(u));
  }

  // ------------------------------------------------------------ F. Ōdōri park: the Snow Festival
  {
    const [o0, o1] = ODORI;
    for (const x of ODORI_SIDE) vRoad(x, 6, o0 - 20, o1 + 20, false);
    for (const u of ODORI_CROSS) hRoad(u, 6, 0, W, false);
    for (const u of ODORI_CROSS) for (const x of [26, 154]) streetLamp(x, Y(u + 10), true);
    // building fronts at both edges of the screen
    for (let u = o0; u < PLAZA[1]; u += 40) {
      for (const x of [0, 174]) {
        const c = rand.pick(NEON);
        img.rect(x, Y(u + 38), 6, 38, 0x2a2c36);
        for (let k = 3; k < 36; k += 3) glow(x + (x ? 1 : 4), Y(u + k), rand() < 0.3 ? c : C.warm);
      }
    }
    // festoon lights along the park paths
    for (let u = o0; u < o1; u++) {
      if (ODORI_CROSS.some((c) => Math.abs(u - c) < 10)) continue;
      if (u % 5 === 0) for (const x of [24, 156]) glow(x, Y(u), NEON[(u / 5) % NEON.length], 0.9);
    }
    const blockAt = (i) => [ODORI_CROSS[i] + 10, ODORI_CROSS[i + 1] - 10];

    // 1: ice sculptures (cyan, lit from below)
    {
      const [b0, b1] = blockAt(0);
      for (const [x, u, w, h] of [[40, b0 + 40, 14, 22], [72, b0 + 100, 20, 30], [120, b0 + 50, 16, 18], [130, b0 + 140, 12, 26], [96, b0 + 150, 18, 16]]) iceBlock(x, Y(u), w, h);
      crowd(30, Y(b1), 120, b1 - b0, 90);
    }
    // 2: giant snow castle with projection-mapped light
    {
      const [b0] = blockAt(1);
      snowCastle(90, Y(b0 + 150));
      crowd(30, Y(b0 + 40), 120, 30, 60);
    }
    // 3: ice slide, kamakura and a family of snowmen
    {
      const [b0, b1] = blockAt(2);
      iceSlide(110, Y(b0 + 170), 120);
      for (const [x, u] of [[40, b0 + 40], [56, b0 + 120], [42, b0 + 156]]) kamakura(x, Y(u));
      for (let k = 0; k < 4; k++) snowman(66 + k * 6, Y(b0 + 70) + (k % 2) * 2);
      crowd(30, Y(b1), 120, b1 - b0, 50);
    }
    // 4: tanchō crane snow sculpture, wings spread
    {
      const [b0] = blockAt(3);
      craneSculpture(90, Y(b0 + 120));
      crowd(30, Y(b0 + 30), 120, 20, 50);
    }
    // 5: big-air ramp with stands
    {
      const [b0] = blockAt(4);
      bigAir(90, Y(b0 + 176));
    }
    // 6: food stalls with lanterns and steam
    {
      const [b0, b1] = blockAt(5);
      for (let u = b0 + 12; u < b1 - 10; u += 26)
        for (const x of [32, 58, 100, 126]) if (!anyRes(x, Y(u + 10), 22, 12)) stall(x, Y(u + 10));
      crowd(30, Y(b1), 120, b1 - b0, 80);
    }
    // 7-8: illuminated trees ("White Illumination") and more ice
    {
      const [b0, b1] = blockAt(6);
      for (let u = b0 + 10; u < b1; u += 22) for (const x of [36, 70, 110, 144]) {
          const tx = x + rand() * 6;
          const ty = Y(u + rand() * 6);
          if (!anyRes(tx - 6, ty - 6, 12, 12)) bare(tx, ty, 6, rand.pick([0xffd890, 0x9ad0ff, 0xff9ad0]));
        }
      const [c0, c1] = blockAt(7);
      for (const [x, u, w, h] of [[60, c0 + 60, 18, 26], [104, c0 + 120, 22, 20], [128, c0 + 40, 12, 14]]) iceBlock(x, Y(u), w, h);
      for (let u = c0 + 10; u < c1; u += 30) for (const x of [34, 150]) bare(x, Y(u), 5, 0xffd890);
      crowd(30, Y(c1), 120, c1 - c0, 70);
    }
    // 9: illuminated trees, kamakura and ice blocks before the plaza
    {
      const [b0, b1] = blockAt(8);
      for (let u = b0 + 12; u < b1; u += 24) for (const x of [40, 140]) if (!anyRes(x - 6, Y(u) - 6, 12, 12)) bare(x, Y(u), 6, rand.pick([0xffd890, 0x9ad0ff]));
      for (const [x, u] of [[70, b0 + 40], [110, b0 + 40], [90, b0 + 120]]) kamakura(x, Y(u));
      iceBlock(60, Y(b0 + 170), 22, 18);
      iceBlock(100, Y(b0 + 176), 18, 24);
      crowd(30, Y(b1), 120, b1 - b0, 70);
    }
    // snow lanterns (yuki-toro) lining the walkways
    for (let u = o0 + 16; u < o1; u += 12) {
      if (ODORI_CROSS.some((c) => Math.abs(u - c) < 14)) continue;
      for (const x of [38, 142]) {
        if (isRes(x, Y(u))) continue;
        img.rect(x - 1, Y(u) - 1, 3, 3, C.snow[3]);
        glow(x, Y(u), 0xffc070);
        pool(x + 0.5, Y(u) + 0.5, 6, 0xffa050, 0.3);
      }
    }
    // park trees along both edges
    for (let u = o0 + 14; u < o1; u += 18) {
      if (ODORI_CROSS.some((c) => Math.abs(u - c) < 14)) continue;
      for (const x of [30, 150]) if (!isRes(x, Y(u))) (u % 36 < 18 ? fir : bare)(x + rand() * 2, Y(u), 4.5);
    }
  }

  // ------------------------------------------------------------ G. TV Tower plaza, the bear sculpture's pedestal
  {
    const [g0] = PLAZA;
    for (const x of ODORI_SIDE) vRoad(x, 6, g0, L, false);
    for (let u = g0 + 10; u < L; u++)
      for (let x = 22; x < 158; x++) {
        const y = Y(u);
        if (!isRes(x, y)) img.set(x, y, rampColor(C.packed, 0.55 + fbm(x, y, { seed: 37, scale: 7 }) * 0.45, x, y));
      }
    // pedestal: stepped snow platform with floodlights
    const pc = 7038;
    const py = Y(pc);
    objects.push({
      y: py + 22,
      shadow: () => shadowRect(56, py - 14, 76, 40, 0.55),
      draw: () => {
        for (let yy = py - 18; yy < py + 14; yy++) for (let xx = 54; xx < 126; xx++) img.set(xx, yy, snowAt(xx, yy, 0.6, 0.35, 11));
        img.rect(54, py - 18, 72, 1, C.snow[3]);
        for (let k = 0; k < 3; k++) for (let xx = 54 + k * 3; xx < 126 - k * 3; xx++) {
          img.set(xx, py + 14 + k * 2, C.snow[1]);
          img.set(xx, py + 15 + k * 2, C.snow[3]);
        }
        for (const [x, y, c] of [[56, py - 16, 0xff6ad0], [123, py - 16, 0x6ad0ff], [56, py + 12, 0x6ad0ff], [123, py + 12, 0xff6ad0]]) {
          glow(x, y, 0xffffff);
          pool(x, y, 30, c, 0.32);
        }
      },
    });
    reserveRect(50, py - 22, 80, 46);
    for (let u = g0 + 20; u < 7010; u += 20) for (const x of [32, 148]) if (!anyRes(x - 6, Y(u) - 6, 12, 12)) bare(x, Y(u), 6, u % 40 ? 0xffd890 : 0x9ad0ff);
    for (const [x, u] of [[60, g0 + 60], [120, g0 + 60]]) iceBlock(x - 9, Y(u), 18, 22);
    for (const x of [44, 136]) {
      objects.push({
        y: Y(6900),
        shadow: () => shadowRect(x + 2, Y(6900) + 2, 3, 3, 0.5),
        draw: () => {
          img.rect(x, Y(6900), 3, 3, 0x4a4c58);
          glow(x + 1, Y(6900) + 1, 0xffffff);
          pool(x + 1, Y(6920), 34, 0xe8f0ff, 0.22);
        },
      });
    }
    crowd(26, py + 26, 128, 60, 220);
    crowd(26, Y(g0 + 120), 128, 110, 140);
    // the TV Tower: orange lattice, observation deck with the big digital clock
    objects.push({
      y: Y(7060),
      shadow: () => {
        for (let k = 0; k < 90; k++) shadowRect(100 + Math.floor(k * 0.4), k + 4, 8, 1, 0.55);
      },
      draw: () => {
        const top = 0;
        img.rect(89, top, 1, 6, 0xd8d8e0);
        glow(89, top, 0xff3030);
        img.rect(79, top + 6, 22, 10, 0x9aa0ac);
        img.rect(79, top + 6, 22, 2, C.snow[3]);
        for (let xx = 80; xx < 100; xx += 2) glow(xx, top + 11, C.cool);
        img.rect(79, top + 15, 22, 1, 0x4a4e5a);
        for (let yy = top + 16; yy < top + 106; yy++) {
          const t = (yy - top - 16) / 90;
          const hw = 6 + t * 16;
          for (const s of [-1, 1]) {
            const x = Math.round(90 + s * hw);
            img.set(x, yy, 0xd8502a);
            img.set(x - s, yy, 0xa83a20);
            if (yy % 12 === 0) glow(x, yy, 0xffb040);
          }
          // cross bracing
          const k = (yy - top - 16) % 12;
          const bx = Math.round(90 - hw + (k / 12) * hw * 2);
          img.set(bx, yy, 0xc8482a);
          img.set(Math.round(90 + hw - (k / 12) * hw * 2), yy, 0xc8482a);
        }
        // the clock panel (its digits are live: they show how long the stage has been running, mm:ss)
        img.rect(78, top + 32, 24, 9, 0x101018);
        pool(90, top + 36, 26, 0xffa040, 0.3);
      },
    });
    reserveRect(64, 0, 52, 110);
  }

  // ------------------------------------------------------------ festival helpers (hoisted)
  function iceBlock(x, y, w, h) {
    objects.push({
      y: y + h,
      shadow: () => shadowRect(x + 3, y + 3, w, h, 0.6),
      draw: () => {
        for (let yy = y; yy < y + h; yy++)
          for (let xx = x; xx < x + w; xx++) {
            const n = fbm(xx, yy, { seed: 96, scale: 4 });
            let c = rampColor(C.ice, 0.35 + n * 0.6, xx, yy);
            if (xx === x || yy === y) c = C.ice[3];
            if ((xx - x + yy - y) % 7 === 0) c = 0xe8f8ff;
            img.set(xx, yy, c);
          }
        pool(x + w / 2, y + h, w, 0x60d0ff, 0.45);
        for (let k = 0; k < 4; k++) glow(x + 1 + Math.floor(rand() * (w - 2)), y + 1 + Math.floor(rand() * (h - 2)), 0xe8fbff, 0.8);
      },
    });
    reserveRect(x - 2, y - 2, w + 4, h + 4);
  }
  function snowCastle(cx, y) {
    const w = 64;
    const x = cx - w / 2;
    objects.push({
      y: y + 70,
      shadow: () => shadowRect(x + 6, y + 6, w, 70, 0.5),
      draw: () => {
        // stone base (snow), three roof tiers with walls, a crest on top
        for (let yy = y + 44; yy < y + 70; yy++) {
          const inset = Math.floor((y + 70 - yy) * 0.25);
          for (let xx = x + inset; xx < x + w - inset; xx++) img.set(xx, yy, (yy - y) % 4 === 0 || (xx - x + (yy >> 2)) % 6 === 0 ? C.snow[1] : C.snow[2]);
        }
        const tiers = [[0, 44, 20], [8, 26, 18], [16, 10, 16]];
        for (const [ins, ty, th] of tiers) {
          for (let yy = y + ty; yy < y + ty + th; yy++)
            for (let xx = x + ins; xx < x + w - ins; xx++) {
              const roof = yy < y + ty + 7;
              img.set(xx, yy, roof ? (yy === y + ty ? C.snow[3] : C.snow[2]) : (xx - x) % 6 === 2 && yy > y + ty + 9 ? C.snow[0] : C.snow[3]);
            }
          img.rect(x + ins, y + ty + 7, w - ins * 2, 1, C.snow[0]);
        }
        img.rect(cx - 4, y + 4, 8, 6, C.snow[3]);
        img.set(cx - 5, y + 3, C.snow[1]);
        img.set(cx + 4, y + 3, C.snow[1]);
        // projection mapping washes
        pool(cx - 18, y + 40, 30, 0xff50c0, 0.4);
        pool(cx + 18, y + 30, 30, 0x50a0ff, 0.4);
        pool(cx, y + 64, 24, 0xffe060, 0.3);
      },
    });
    reserveRect(x - 2, y - 2, w + 4, 74);
  }
  function iceSlide(cx, y, len) {
    objects.push({
      y: y + len,
      shadow: () => shadowRect(cx + 3, y + 3, 10, len, 0.7),
      draw: () => {
        img.rect(cx - 8, y, 16, 14, C.snow[3]);
        for (let k = 0; k < 6; k++) img.rect(cx - 8, y + 2 + k * 2, 16, 1, C.snow[1]);
        for (let yy = y + 14; yy < y + len; yy++) {
          img.rect(cx - 5, yy, 10, 1, C.snow[2]);
          img.rect(cx - 3, yy, 6, 1, (yy >> 1) % 2 ? C.ice[3] : C.ice[2]);
        }
        pool(cx, y + len, 18, 0x80e0ff, 0.4);
      },
    });
    reserveRect(cx - 10, y - 2, 20, len + 4);
  }
  function craneSculpture(cx, y) {
    objects.push({
      y: y + 60,
      shadow: () => {
        for (let yy = 0; yy < 60; yy++) for (let xx = -40; xx < 40; xx++) if (crane(xx, yy)) img.tint(cx + xx + 6, y + yy + 6, 0.55);
      },
      draw: () => {
        for (let yy = 0; yy < 60; yy++)
          for (let xx = -40; xx < 40; xx++) {
            const k = crane(xx, yy);
            if (!k) continue;
            const c = k === 2 ? 0x2a2a34 : k === 3 ? 0xd02a2a : (xx + yy) % 5 === 0 ? C.snow[1] : xx < 0 ? C.snow[3] : C.snow[2];
            img.set(cx + xx, y + yy, c);
          }
        img.rect(cx - 30, y + 54, 60, 6, C.snow[2]);
        pool(cx - 20, y + 30, 30, 0x60c0ff, 0.38);
        pool(cx + 20, y + 30, 30, 0xff80d0, 0.38);
      },
    });
    reserveRect(cx - 42, y - 2, 84, 64);
  }
  /** Crane sculpture shape: 0 none, 1 snow, 2 black wingtips/neck, 3 red crown. */
  function crane(x, y) {
    // wings: two broad arcs
    const wing = (sx) => {
      const ax = x * sx;
      if (ax < 3 || ax > 38) return 0;
      const top = 30 - Math.sin((ax / 38) * Math.PI * 0.9) * 22;
      if (y < top || y > top + 14 - ax * 0.15) return 0;
      return ax > 31 ? 2 : 1;
    };
    const wv = Math.max(wing(1), wing(-1));
    if (wv) return wv;
    // body, neck and head
    if (((x / 7) ** 2 + ((y - 34) / 12) ** 2) < 1) return 1;
    if (Math.abs(x) <= 1 && y >= 12 && y < 24) return 2;
    if (((x / 3) ** 2 + ((y - 10) / 3) ** 2) < 1) return y < 9 ? 3 : 1;
    if (Math.abs(x) <= 2 && y >= 44 && y < 54) return 1; // tail
    return 0;
  }
  function bigAir(cx, y) {
    objects.push({
      y: y + 150,
      shadow: () => shadowRect(cx + 8, y + 6, 14, 150, 0.55),
      draw: () => {
        // scaffold tower and in-run
        for (let yy = y; yy < y + 70; yy++) {
          img.rect(cx - 7, yy, 14, 1, (yy - y) % 6 === 0 ? 0x8a8e9a : 0x5a5e6a);
          img.rect(cx - 4, yy, 8, 1, C.snow[3]);
          if ((yy - y) % 10 === 0) glow(cx + (yy % 20 ? -7 : 6), yy, 0xffffff);
        }
        img.rect(cx - 8, y + 70, 16, 4, C.snow[3]);
        // landing slope widening, with a coloured kicker line
        for (let yy = y + 80; yy < y + 150; yy++) {
          const hw = 10 + (yy - y - 80) * 0.3;
          for (let xx = Math.round(cx - hw); xx < cx + hw; xx++) img.set(xx, yy, yy === y + 82 ? 0x30a0ff : yy % 2 ? C.snow[3] : C.snow[2]);
        }
        pool(cx, y + 74, 22, 0x60b0ff, 0.45);
        pool(cx, y + 120, 30, 0xffffff, 0.25);
      },
    });
    reserveRect(cx - 24, y - 2, 48, 154);
    crowd(26, y + 100, 30, 50, 50);
    crowd(124, y + 100, 30, 50, 50);
  }
  function stall(x, y) {
    const c = rand.pick([0xd03a2a, 0xe8a030, 0x2a7ad0, 0x3aa060]);
    objects.push({
      y: y + 10,
      shadow: () => shadowRect(x + 2, y + 2, 20, 10, 0.55),
      draw: () => {
        for (let yy = y; yy < y + 7; yy++) for (let xx = x; xx < x + 20; xx++) img.set(xx, yy, (xx - x) % 4 < 2 ? c : 0xf2f0ea);
        img.rect(x, y, 20, 1, C.snow[3]);
        img.rect(x, y + 7, 20, 3, 0x4a3a30);
        for (let xx = x + 1; xx < x + 20; xx += 4) glow(xx, y + 8, 0xff6a40);
        pool(x + 10, y + 10, 12, 0xffa050, 0.4);
        for (let k = 0; k < 5; k++) img.set(x + 6 + Math.round(Math.sin(k) * 2), y - 1 - k, 0xffffff, 0.3);
      },
    });
    reserveRect(x - 1, y - 2, 22, 14);
  }

  // ------------------------------------------------------------ vegetation
  const kindsAt = (u) => {
    if (u < JUMP[1]) return { p: 0.9, fir: 0.82 };
    if (u < SUBURB[1]) return { p: 0.28, fir: 0.45 };
    if (u < SUSUKINO[1]) return { p: 0.05, fir: 0.2 };
    if (u < RIVER[1]) return { p: 0, fir: 0 };
    if (u < PARK[1]) return { p: 0.55, fir: 0.5 };
    return { p: 0, fir: 0 };
  };
  for (let gy = 0; gy < L; gy += 7)
    for (let gx = -2; gx < W + 2; gx += 7) {
      const x = gx + rand() * 7;
      const y = gy + rand() * 7;
      const ix = Math.round(x);
      const iy = Math.round(y);
      if (ix < 0 || ix >= W || iy < 0 || iy >= L || img.alpha(ix, iy) < 255) continue;
      const u = U(iy);
      const { p, fir: fp } = kindsAt(u);
      if (rand() > p) continue;
      const isFir = rand() < fp;
      const r = isFir ? 3.5 + rand() * 2.5 : 4 + rand() * 2;
      const k = r * 0.7;
      if (isRes(ix, iy) || isRes(ix - k, iy) || isRes(ix + k, iy) || isRes(ix, iy - k) || isRes(ix, iy + k)) continue;
      if (u < JUMP[1]) {
        const [xl, xr] = ridge(u);
        if (ix < xl + 3 || ix > xr - 3) continue;
      }
      (isFir ? fir : bare)(x, y, r);
    }

  // ------------------------------------------------------------ compose
  for (const o of objects) o.shadow?.();
  objects.sort((a, b) => a.y - b.y);
  for (const o of objects) o.draw();

  // turret pads: trodden snow circles where the snowmen stand
  for (const p of pads) {
    const y = Y(p.u);
    for (let yy = y - 10; yy <= y + 10; yy++)
      for (let xx = p.x - 10; xx <= p.x + 10; xx++) {
        const d = Math.hypot(xx + 0.5 - p.x, yy + 0.5 - y);
        if (d > 10) continue;
        img.set(xx, yy, d > 8.6 ? C.snow[0] : d > 7.8 && (xx + yy) % 3 === 0 ? C.snow[1] : rampColor(C.packed, 0.55 + fbm(xx, yy, { seed: 2, scale: 3 }) * 0.4, xx, yy));
      }
  }

  // the TV Tower clock's digits: seven-segment frames, each digit turning over at its own rate
  {
    const SEG = [
      [1, 1, 1, 0, 1, 1, 1],
      [0, 0, 1, 0, 0, 1, 0],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 0, 1, 1],
      [0, 1, 1, 1, 0, 1, 0],
      [1, 1, 0, 1, 0, 1, 1],
      [1, 1, 0, 1, 1, 1, 1],
      [1, 0, 1, 0, 0, 1, 0],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 0, 1, 1],
    ];
    const digit = SEG.map(([a, b, c, dd, e, f, g]) => {
      const r = new Raster(3, 7);
      const on = (x, y) => r.set(x, y, 0xe8fff0);
      for (let q = 0; q < 3; q++) {
        if (a) on(q, 0);
        if (b) on(0, q);
        if (c) on(2, q);
        if (dd) on(q, 3);
        if (e) on(0, 3 + q);
        if (f) on(2, 3 + q);
        if (g) on(q, 6);
      }
      return kit.frame(r);
    });
    // minutes (tens, ones) : seconds (tens, ones)
    [[1 / 600, 10], [1 / 60, 10], [1 / 10, 6], [1, 10]].forEach(([fps, n], i) => kit.loop(80 + i * 5 + (i > 1 ? 2 : 0), U(33), digit.slice(0, n), { fps, ph: 0 }));
    const colon = new Raster(1, 4);
    colon.set(0, 0, 0xe8fff0);
    colon.set(0, 3, 0xe8fff0);
    kit.loop(90, U(35), [kit.frame(colon)], { seq: [0, -1], fps: 2, ph: 0 });
  }

  // ------------------------------------------------------------ time of day, then the lights
  const tint = TOD.map(([, , t]) => rgb(t));
  for (let y = 0; y < L; y++) {
    const u = U(y);
    let i = 0;
    while (i < TOD.length - 2 && u >= TOD[i + 1][0]) i++;
    const t = smooth(TOD[i][0], TOD[i + 1][0], u);
    const mul = TOD[i][1].map((m, k) => m + (TOD[i + 1][1][k] - m) * t);
    const tc = tint[i].map((c, k) => c + (tint[i + 1][k] - c) * t);
    const amt = TOD[i][3] + (TOD[i + 1][3] - TOD[i][3]) * t;
    for (let x = 0; x < W; x++) {
      const p = (y * W + x) * 4;
      const d = img.data;
      if (!d[p + 3]) continue;
      for (let k = 0; k < 3; k++) {
        const v = d[p + k] * mul[k];
        d[p + k] = v + (tc[k] - v) * amt;
      }
    }
  }
  for (const { x, y, r, c, k } of pools) {
    const [cr, cg, cb] = rgb(c);
    for (let yy = Math.floor(y - r); yy <= y + r; yy++)
      for (let xx = Math.floor(x - r); xx <= x + r; xx++) {
        const i = img.idx(xx, yy);
        if (i < 0 || !img.data[i + 3]) continue;
        const dd = Math.hypot(xx + 0.5 - x, yy + 0.5 - y) / r;
        if (dd >= 1) continue;
        const f = (1 - dd) ** 1.6 * k;
        img.data[i] += cr * f;
        img.data[i + 1] += cg * f;
        img.data[i + 2] += cb * f;
      }
  }
  for (const [x, y, c, a] of lights) img.set(x, y, c, a);

  const chunks = [];
  for (let i = 0; i < CHUNKS; i++) chunks.push(img.crop(0, i * CHUNK, W, CHUNK));
  return { strip: img, chunks, props: kit.pack(), meta: { width: W, chunkHeight: CHUNK, chunks: CHUNKS, length: L, tint: tintTable(L, tod.white) } };
}

export { mix };
