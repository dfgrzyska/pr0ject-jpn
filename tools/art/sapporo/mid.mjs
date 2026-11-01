// Middle layer (Sapporo, winter): the Ōkurayama ski jump at sunset, a suburb of tin-roofed houses,
// the city centre with the Clock Tower, the red-brick Akarenga and Nijō market, Susukino's neon, the frozen
// Toyohira river, Nakajima park, the Snow Festival along Ōdōri park and the TV Tower plaza at night.
//
// Everything is painted in neutral daylight colours and then graded by strip position (sunset -> pink and
// violet dusk over the suburb -> the blue hour in the centre -> night from Susukino on). Lit windows, lamps and neon are collected separately and painted after the grade,
// so they glow in the dark. Valleys beside the ski jump stay transparent (far layer shows through).
//
// Live (see ../props.mjs): the chairlift runs, a jumper goes down the in-run and flies, cars drive up
// Ekimae-dōri and across town, the streetcar runs through Susukino, chimneys smoke, snow slides off the
// tin roofs, manholes steam, office windows go dark and light up, the open channel of the frozen river
// steams, Susukino's neon walls flicker, the ramen alley and Nijō market's grill steam, shoppers browse,
// a snowcat grooms the landing hill under the fans' flags, children sledge in Nakajima park, people shovel
// snow in the suburb, the sculptors' chainsaws throw chips off the crane, skaters circle the rink on Shōbu pond and the TV Tower's
// big clock counts the time of the stage.
//
// Coordinates: u = distance from the bottom of the strip (stage start), strip y = L - u.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Raster, fbm, rng, bayer, scaleColor, rgb, mix } from '../../lib/raster.mjs';
import { crownPixels, rampColor } from '../nature.mjs';
import { PropKit, cut, puff, todGrade, tintTable } from '../props.mjs';

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
const TRAM_U = 3230; // the streetcar's street in Susukino
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
  [0, [1.0, 0.93, 0.9], 0xffa070, 0.05], // sunset at the ski jump
  [900, [0.98, 0.86, 0.86], 0xd0607a, 0.07], // the sun gone: pink
  [1700, [0.84, 0.74, 0.92], 0x6a4a8a, 0.09], // violet dusk over the suburb
  [2600, [0.66, 0.66, 0.9], 0x2a2c66, 0.1], // the blue hour in the centre
  [3500, [0.5, 0.55, 0.8], 0x141c44, 0.1], // night from Susukino on
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
  const roofEdges = []; // [x, u, w] of the tin roofs' lower eaves (snow slides off them, live)
  const pools = []; // additive light pools, after the grade
  const glow = (x, y, c, a = 1) => lights.push([Math.round(x), Math.round(y), c, a]);
  const pool = (x, y, r, c, k = 0.5) => pools.push({ x, y, r, c, k });
  const kit = new PropKit(3313); // the moving parts
  let castle = null; // the snow castle's outline, for its projection mapping
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
    roofEdges.push([x, U(y + h), w]);
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
      // a snowcat grooming the landing hill up one side and back down, leaving corduroy behind it
      const cat = (up) => {
        const r = new Raster(7, 10);
        r.rect(0, 1, 7, 8, 0x2a2a30); // the tracks
        r.rect(1, 2, 5, 6, 0xe0602a); // the red body and cab
        r.rect(2, up ? 2 : 5, 3, 2, 0x3a4a6a);
        r.rect(0, up ? 0 : 9, 7, 1, 0xc8ccd4); // the blade
        r.rect(1, up ? 9 : 0, 5, 1, 0x8a8a92); // the tiller
        return frameAt(r, 380);
      };
      const cord = [0, 1, 2].map((k) => {
        const r = new Raster(7, 1);
        for (let x = 0; x < 7; x += 2) r.set(x, 0, 0xf4f6fa, 0.8 - k * 0.2);
        return frameAt(r, 380);
      });
      kit.path([[cx - 16, 246], [cx - 9, 500]], [cat(true)], { sp: 4, mode: 'pp', hold: 3, turn: 'none', fu: [cat(true)], fd: [cat(false)], wake: { f: cord, every: 2, life: 5 } });
      // the fans in the stands waving their flags
      const flag = [0xe8343a, 0xf0f0f0, 0x2a5aa8, 0xf0c020].map((c) => [0, 1, 0, 1].map((f) => {
        const r = new Raster(3, 4);
        r.set(0, 1, 0x6a5a4a);
        r.set(0, 2, 0x6a5a4a);
        r.rect(1, f ? 0 : 1, 2, 2, c);
        return frameAt(r, 150);
      }));
      for (const fl of flag) kit.spot([[46, 152, 88, 26]], fl, { rate: 1.6, fps: 5 });
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
    STREETS.filter((s) => s > CENTER[0] && s !== TRAM_U && !plowRoads.some((p) => Math.abs(p - s) < 20)).forEach((s, k) => {
      kit.path([[-8, s - 2], [188, s - 2]], [sides[k % 4]], { sp: 13, n: 1, turn: 'flip' });
      kit.path([[188, s + 2], [-8, s + 2]], [sides[(k + 2) % 4]], { sp: 10, n: 1, turn: 'flip' });
    });
  }
  // the streetcar along a cross street in Susukino: rails set in the road, a cream-and-green tram running to
  // and fro, its windows lit (live)
  {
    const ty = Y(TRAM_U);
    for (let x = 0; x < W; x++)
      for (const dy of [-2, 2]) img.set(x, ty + dy, 0x7a7a82);
    const tram = new Raster(26, 6);
    tram.rect(0, 0, 26, 6, 0xe8e4d0);
    tram.rect(0, 2, 26, 2, 0x2a7a4a);
    tram.rect(1, 0, 24, 1, 0xc8c4b4);
    tram.rect(12, 0, 2, 1, 0x3a3a40); // the pantograph
    tram.rect(0, 5, 26, 1, 0x8a8678);
    const lit = [];
    for (let x = 2; x < 24; x += 3) lit.push([x, 1, C.warm, 0.9], [x, 4, C.warm, 0.9]);
    kit.path([[-30, TRAM_U], [210, TRAM_U]], [frameAt(tram, TRAM_U, lit)], { sp: 10, mode: 'pp', hold: 4, turn: 'flip', s0: 0.3 });
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

  // Nijō market: a long low hall of fishmongers' stalls by the main street, under snowy roofs split by the
  // covered alley down its middle; red king crabs, hairy crabs, trays of sea urchin and salmon roe, salmon
  // and ice under the coloured awnings; shoppers along the stalls, steam off the grill stand (live)
  {
    const x0 = 105;
    const x1 = 139;
    const top = Y(2772);
    const bot = Y(2660);
    const stallC = [0x2a5aa8, 0xc83a2a, 0xe8b830, 0x2a8a5a];
    const goods = [0xd83a2a, 0xe05a3a, 0x8a5a3a, 0xf0a030, 0xf08a90, 0xf4f4f8];
    objects.push({
      y: bot,
      shadow: () => shadowRect(x0 + 4, top + 3, x1 - x0, bot - top, 0.5),
      draw: () => {
        for (let yy = top; yy < bot; yy++)
          for (let xx = x0 + 5; xx < x1 - 5; xx++) {
            if (Math.abs(xx - 122) < 1.5) {
              img.set(xx, yy, (yy % 4) < 2 ? 0x5a5258 : 0x4a4248); // the covered alley's glass roof
              continue;
            }
            const right = xx > 122;
            let c = (yy - top) % 12 === 0 ? C.slate[0] : right ? C.slate[1] : C.slate[2];
            if (fbm(xx, yy, { seed: 94, scale: 3 }) > 0.45) c = right ? C.snow[2] : C.snow[3];
            img.set(xx, yy, c);
          }
        // stalls along both long sides: awnings in turn, goods laid out in front, lit from inside
        for (const [ax, gx, dir] of [[x0 + 2, x0, -1], [x1 - 5, x1 - 2, 1]])
          for (let yy = top + 1, k = 0; yy < bot - 4; yy += 9, k++) {
            const col = stallC[(k + (dir > 0 ? 2 : 0)) % stallC.length];
            for (let j = 0; j < 8; j++)
              for (let i = 0; i < 3; i++) img.set(ax + i, yy + j, j % 2 ? scaleColor(col, 0.85) : col);
            for (let j = 1; j < 8; j += 2) img.set(gx, yy + j, goods[(j + k * 3) % goods.length]);
            img.set(gx + (dir < 0 ? -1 : 1), yy + 3, goods[(k * 2) % 3]); // a big crab on the counter
            glow(ax + 1, yy + 4, C.warm, 0.8);
            pool(gx, yy + 4, 6, C.warm, 0.3);
          }
      },
    });
    reserveRect(x0 - 2, top - 2, x1 - x0 + 4, bot - top + 4);
    const shopper = (c, f) => {
      const r = new Raster(2, 4);
      r.set(0, 0, 0x2a2026);
      r.set(0, 1, c);
      r.set(0, 2, f ? scaleColor(c, 0.8) : c);
      r.set(1, 3, 0x101018, 0.4);
      return frameAt(r, 2716);
    };
    for (const c of [0xc83a3a, 0x3a5a9a, 0xe8e8f0, 0x5a3a2a]) kit.wander(102, 2716, 2, 50, [shopper(c, 0), shopper(c, 1)], { n: 1, sp: 4, idle: 0.7, turn: 'flip', fps: 3 });
    kit.emit(103, 2700, steam, { rate: 1.4, life: [1.4, 2.2], vy: 6, sx: 1, wf: 0.6, a: 0.45, tint: 1 });
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
    // a sledging hill by the pond: a mound of packed snow, runs worn into it, children sliding down and
    // trudging back up with their sleds (live)
    {
      const hx = 150;
      const hu = 4262;
      for (let y = Y(hu + 36); y < Y(hu - 30); y++)
        for (let x = hx - 30; x < W; x++) {
          const e = ((x + 0.5 - hx) / 28) ** 2 + ((U(y) - hu) / 32) ** 2;
          if (e >= 1) continue;
          const lit = 0.55 + (U(y) - hu) / 64 - (x - hx) / 90;
          let c = rampColor(C.snow, Math.max(0.2, Math.min(1, lit)), x, y);
          if (Math.abs(x - hx + 8) < 1 || Math.abs(x - hx - 4) < 1) c = rampColor(C.packed, 0.7, x, y); // the worn runs
          img.set(x, y, c);
        }
      reserveRect(hx - 31, Y(hu + 37), W - hx + 31, 70);
      const sledder = (c) => {
        const r = new Raster(3, 5);
        r.set(1, 0, 0x2a2026);
        r.set(1, 1, c);
        r.set(0, 2, c);
        r.set(2, 2, c);
        r.rect(0, 3, 3, 2, 0xd83a2a); // the sled
        return frameAt(r, hu);
      };
      const walker = (c, f) => {
        const r = new Raster(3, 5);
        r.set(1, 0, 0x2a2026);
        r.set(1, 1, c);
        r.set(1, 2, f ? scaleColor(c, 0.8) : c);
        r.rect(f ? 0 : 2, 3, 1, 2, 0xd83a2a); // dragging the sled behind
        return frameAt(r, hu);
      };
      for (const [c, x, s0] of [[0x3a6ad0, hx - 8, 0.1], [0xe8a030, hx + 4, 0.55], [0x5aaa6a, hx - 8, 0.8]]) {
        kit.path([[x, hu + 30], [x, hu - 34]], [sledder(c)], { sp: 16, turn: 'none', s0 });
        kit.path([[x + 14, hu - 34], [x + 14, hu + 30]], [walker(c, 0), walker(c, 1)], { sp: 3, turn: 'none', fps: 3, s0: (s0 + 0.5) % 1 });
      }
    }
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

    // 1: the ice sculpture garden: a dragon, a pair of swans, a fish owl, a fox, an orca and a crab, and a row
    // of blocks with fish frozen inside, every one lit from below
    {
      const [b0, b1] = blockAt(0);
      // (the turret stand at the top left stays clear)
      iceStatue(102, Y(b0 + 128), 40, 44, DRAGON, 0x60d0ff);
      iceStatue(139, Y(b0 + 140), 22, 30, OWL, 0x9a8aff);
      iceStatue(44, Y(b0 + 68), 24, 30, FOX, 0xffb060);
      iceStatue(88, Y(b0 + 70), 32, 28, ORCA, 0x60e0d0);
      iceStatue(132, Y(b0 + 76), 38, 28, SWANS, 0xff7ad8);
      fishBlocks(90, Y(b0 + 26), 4);
      crowd(30, Y(b1), 120, b1 - b0, 70);
    }
    // 2: the great snow castle, a keep of five roofs on its stone walls, with projection mapping washing
    // colours over it (live)
    {
      const [b0] = blockAt(1);
      snowCastle(90, Y(b0 + 50)); // its top just clear of the turret stand above
      crowd(30, Y(b0 + 40), 120, 26, 60);
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
      // the sculptors still at it with chainsaws and spatulas, snow and ice chips flying off the wings (live)
      const sculptor = (f) => {
        const r = new Raster(4, 5);
        r.set(1, 0, 0xe8e8f0); // a white helmet
        r.rect(1, 1, 1, 2, 0xf07a20); // the orange suit
        r.set(f ? 2 : 3, 1, 0x8a8a92); // the saw
        r.set(1, 3, 0x2a2a3a);
        r.set(2, 4, 0x101018, 0.4);
        return frameAt(r, b0 + 120);
      };
      for (const [x, u] of [[54, b0 + 104], [126, b0 + 110], [90, b0 + 70]]) kit.wander(x, u, 5, 3, [sculptor(0), sculptor(1)], { n: 1, sp: 2, idle: 0.7, turn: 'flip', fps: 6 });
      const chips = [0, 1, 2, 3].map((k) => {
        const r = new Raster(7, 7);
        for (let i = 0; i < 5; i++) {
          const a = i * 1.3 + k * 0.4;
          r.set(Math.round(3 + Math.cos(a) * (k + 1)), Math.round(3 + Math.sin(a) * (k + 1) * 0.7), 0xffffff, k > 2 ? 0.5 : 1);
        }
        return frameAt(r, b0 + 110);
      });
      kit.spot([[48, b0 + 112, 14, 10], [120, b0 + 118, 14, 10], [84, b0 + 78, 14, 10]], chips, { rate: 3, fps: 8 });
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
      iceStatue(70, Y(c0 + 66), 30, 34, CRAB, 0xff8a5a);
      iceStatue(116, Y(c0 + 140), 26, 30, LOTUS, 0xff7ad8);
      iceStatue(132, Y(c0 + 64), 22, 30, OWL, 0x60d0ff);
      for (let u = c0 + 10; u < c1; u += 30) for (const x of [34, 150]) bare(x, Y(u), 5, 0xffd890);
      crowd(30, Y(c1), 120, c1 - c0, 70);
    }
    // 9: illuminated trees, kamakura and ice blocks before the plaza
    {
      const [b0, b1] = blockAt(8);
      for (let u = b0 + 12; u < b1; u += 24) for (const x of [40, 140]) if (!anyRes(x - 6, Y(u) - 6, 12, 12)) bare(x, Y(u), 6, rand.pick([0xffd890, 0x9ad0ff]));
      for (const [x, u] of [[70, b0 + 40], [110, b0 + 40], [90, b0 + 120]]) kamakura(x, Y(u));
      iceStatue(66, Y(b0 + 150), 24, 30, FOX, 0x9ad0ff);
      iceStatue(112, Y(b0 + 156), 32, 28, ORCA, 0xff9ad0);
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
    // packed snow from the park's last cross street on (below it the park's own ground, so the sculptures
    // and kamakura at the park's end don't sit in patches of it)
    for (let u = Math.max(g0 + 10, ODORI[1]); u < L; u++)
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
    for (const [x, u, shape, tint] of [[60, g0 + 82, SWANS, 0x60d0ff], [120, g0 + 82, LOTUS, 0xffd060]]) iceStatue(x, Y(u), shape === SWANS ? 38 : 26, shape === SWANS ? 28 : 30, shape, tint);
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
  /**
   * An ice sculpture on its block, lit from inside and below: clear ice, thick and deep blue-green in the
   * middle, bright along every edge, with streaks of reflection, frosted parts and sparkles, and the colour
   * of the LEDs under it rising into its lower half. shape(x, y) on a w x h grid (top left = 0, 0) returns
   * 0 nothing, 1 ice, 2 a carved line, 3 frosted ice. Painted with the lights after the grade: it glows.
   * by = strip y of the foot of the block.
   */
  function iceStatue(cx, by, w, h, shape, tint) {
    const x0 = Math.round(cx - w / 2);
    const y0 = by - 5 - h; // the statue stands on a block 5 px high
    const grid = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) grid[y * w + x] = shape(x, y, w, h);
    const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : grid[y * w + x]);
    // how deep each pixel lies inside the ice (1 = on the edge, up to 4)
    const depth = (x, y) => {
      for (let r = 1; r <= 3; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r && !at(x + dx, y + dy)) return r;
      return 4;
    };
    const sr = rng(cx * 31 + by);
    objects.push({
      y: by,
      shadow: () => {
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (at(x, y) && !at(x - 3, y - 2)) img.tint(x0 + x + 3, y0 + y + 2, 0.7);
      },
      draw: () => {
        // the block it stands on: cut ice, its front face lit by the lamps
        const bw = Math.round(w * 0.7);
        const bx = Math.round(cx - bw / 2);
        for (let yy = by - 5; yy < by; yy++)
          for (let xx = bx; xx < bx + bw; xx++) glow(xx, yy, yy === by - 5 ? 0xe8fbff : xx === bx || xx === bx + bw - 1 ? 0xb8e8f8 : mix(0x6ab0d0, tint, 0.35 + (yy - by + 5) * 0.08), 0.92);
        for (let y = 0; y < h; y++)
          for (let x = 0; x < w; x++) {
            const k = at(x, y);
            if (!k) continue;
            const d = depth(x, y);
            let c = k === 3 ? 0xf2faff : k === 2 ? 0x3a86b8 : d === 1 ? 0xeafcff : d === 2 ? 0xb4e6f6 : d === 3 ? 0x82cce8 : 0x5ab4d8;
            if (k === 1 && d > 1 && (x + y * 0.55 + 40) % 11 < 1.2) c = 0xf4feff; // a streak of reflection
            if (k === 1 && d === 1 && (x < w / 2) !== (y > h / 2)) c = 0xffffff; // the edge catching the light
            const t = y / h;
            if (t > 0.55 && k !== 3) c = mix(c, tint, (t - 0.55) * 0.9);
            glow(x0 + x, y0 + y, c, k === 3 ? 0.95 : d === 1 ? 0.95 : 0.82);
          }
        for (let i = 0; i < Math.round((w * h) / 70); i++) {
          const x = Math.floor(sr() * w);
          const y = Math.floor(sr() * h);
          if (at(x, y) === 1 && depth(x, y) > 1) glow(x0 + x, y0 + y, 0xffffff); // a sparkle in the ice
        }
        pool(cx, by - 2, w * 0.8, tint, 0.5);
        pool(cx, y0 + h * 0.4, w * 0.7, 0x80d8ff, 0.18);
      },
    });
    reserveRect(x0 - 2, y0 - 2, w + 4, h + 9);
  }
  /** A row of clear ice blocks with fish frozen inside them (salmon, sea bream, a squid, a crab), lit from below. */
  function fishBlocks(cx, by, n) {
    const bw = 13;
    const bh = 15;
    const x0 = Math.round(cx - (n * (bw + 3)) / 2);
    const catches = [
      [0xe86a4a, 0xf0a080, 'fish'],
      [0xe84a6a, 0xf08aa0, 'fish'],
      [0xf0f0f8, 0xc8c8d8, 'squid'],
      [0xd84a2a, 0xf07a4a, 'crab'],
    ];
    objects.push({
      y: by,
      shadow: () => shadowRect(x0 + 3, by - bh + 2, n * (bw + 3), bh, 0.65),
      draw: () => {
        for (let i = 0; i < n; i++) {
          const x = x0 + i * (bw + 3);
          const y = by - bh;
          const [body, light, kind] = catches[i % catches.length];
          for (let yy = y; yy < by; yy++)
            for (let xx = x; xx < x + bw; xx++) {
              const edge = xx === x || xx === x + bw - 1 || yy === y || yy === by - 1;
              let c = edge ? 0xeafcff : yy === y + 1 || xx === x + 1 ? 0xc8f0fa : 0x7ec8e4;
              // the catch inside, seen through the ice
              const lx = xx - x - bw / 2 + 0.5;
              const ly = yy - y - bh / 2 + 0.5;
              let inside = false;
              if (kind === 'fish') inside = (lx / 5) ** 2 + (ly / 2.2) ** 2 < 1 || (lx > 4 && Math.abs(ly) < lx - 3.5 && lx < 6.5);
              else if (kind === 'squid') inside = ((lx / 2.2) ** 2 + ((ly + 2) / 4) ** 2 < 1) || (ly > 1 && ly < 6 && Math.abs(lx) < 2.5 && (xx + yy) % 2 === 0);
              else inside = (lx / 4) ** 2 + (ly / 3) ** 2 < 1 || (Math.abs(ly) < 1 && Math.abs(lx) < 6 && Math.abs(lx) > 3);
              if (!edge && inside) c = mix(ly < 0 ? light : body, 0x9ad8f0, 0.35);
              if (!edge && (xx - x + (yy - y) * 0.6) % 9 < 1) c = 0xf0fcff;
              glow(xx, yy, c, edge ? 0.95 : 0.85);
            }
          if (kind === 'fish') glow(x + 3, y + 7, 0x1a1a22);
        }
        pool(cx, by, n * 10, 0x60d0ff, 0.45);
      },
    });
    reserveRect(x0 - 2, by - bh - 2, n * (bw + 3) + 4, bh + 4);
  }
  /**
   * The great snow castle: a carved replica of a Japanese keep, 80 px wide. Fan-sloped stone walls (ishigaki)
   * with fitted blocks and a stair up the middle, then five storeys narrowing upwards, each with rows of
   * windows under a roof of carved tiles with upturned corners; triangular chidori gables and a curved kara
   * gable over the front, golden fish (shachihoko) on the top ridge. Lit from the top left; the projection
   * mapping (live) is cut from it after the grade.
   */
  function snowCastle(cx, by) {
    const W2 = 40; // half width of the plinth
    const top = by - 104;
    castle = { x0: cx - W2 - 2, y0: top - 6, x1: cx + W2 + 2, y1: by + 1, mask: new Set() };
    let shading = null; // while casting the shadow: the pixels already darkened
    const put = (x, y, c, a = 1) => {
      if (shading) {
        if (!shading.has(y * W + x)) img.tint(x + 6, y + 5, 0.62);
        shading.add(y * W + x);
        return;
      }
      img.set(x, y, c, a);
      castle.mask.add(y * W + x);
    };
    const glowAt = (x, y, c, a) => !shading && glow(x, y, c, a);
    const poolAt = (...args) => !shading && pool(...args);
    const S = C.snow;
    const JOINT = 0x76809c; // the grooves between the carved stones
    const EAVE = 0x5c6684; // the underside of an eave, deep in shadow
    const UNDER = 0x8690aa; // the shadow an eave casts on the wall below it
    const OUTLINE = 0x6a7490; // where the carved snow meets the ground
    // floodlight washing up a face: pinkish from the lamp on the left, bluish from the one on the right
    const flood = (x) => mix(0xffdcf0, 0xd8e8ff, Math.max(0, Math.min(1, (x - cx + W2) / (W2 * 2))));
    // the stones of the walls: courses 3 px high, stones 5-8 px wide, each course set off from the one above
    const hash = (a, b) => (((a + 11) * 73856093) ^ ((b + 7) * 19349663)) >>> 0;
    const stoneAt = (x, row) => {
      let s = cx - W2 - 8 - ((row * 5) % 8);
      for (let i = 0; ; i++) {
        const sw = 5 + (hash(i, row) % 4);
        if (x < s + sw) return { i, sx: x - s, sw };
        s += sw;
      }
    };
    const paint = () => {
        // the plinth and the steps up to the walls
        for (let y = by - 6; y < by; y++) for (let x = cx - W2; x < cx + W2; x++) put(x, y, y === by - 6 ? S[3] : (x + y) % 9 === 0 ? S[1] : S[2]);
        for (let k = 0; k < 5; k++)
          for (let x = cx - 7 + k; x < cx + 7 - k; x++) {
            put(x, by - 6 - k * 2, S[3]);
            put(x, by - 5 - k * 2, S[1]);
          }
        // the stone walls: concave fan slope, courses of fitted stones with deep joints, each stone catching the
        // light on its top and turned from it on its right, the wall lit on the left and in shadow on the right,
        // and the floodlights at the foot washing up over the stones (not into the joints)
        const wallTop = by - 30;
        for (let y = wallTop + 1; y < by - 6; y++) {
          const t = (y - wallTop) / (by - 6 - wallTop);
          const hw = 30 + 8 * t * t;
          const row = Math.floor((y - wallTop - 1) / 3);
          const sy = (y - wallTop - 1) % 3; // 0: the joint above the course
          for (let x = Math.round(cx - hw); x < cx + hw; x++) {
            if (Math.abs(x + 0.5 - cx) < 7 - (by - 6 - y) * 0.3 && y > by - 18) continue; // the stair cut into them
            const side = (x - cx) / hw;
            const { i, sx, sw } = stoneAt(x, row);
            if (sy === 0 || sx === 0) {
              put(x, y, side > 0.3 ? mix(JOINT, EAVE, 0.5) : JOINT);
              continue;
            }
            let v = 0.6 - side * 0.3 + ((hash(i, row + 50) % 100) / 100 - 0.5) * 0.24;
            if (sy === 1) v += 0.12;
            if (sx === sw - 1) v -= 0.14;
            if (Math.abs(x + 0.5 - (cx - hw)) < 1 || Math.abs(x + 0.5 - (cx + hw)) < 1) v -= 0.15;
            put(x, y, rampColor(S, Math.max(0, Math.min(1, v)), x, y));
            glowAt(x, y, flood(x), 0.08 + 0.22 * t);
          }
        }
        for (let x = cx - 30; x < cx + 30; x++) put(x, wallTop, S[3]); // the snow lying on the walls
        // five storeys, each a wall of windows under a roof
        const tiers = [
          [28, 10, 'kara'],
          [23, 9, 'chidori'],
          [18, 8, ''],
          [14, 8, 'chidori'],
          [10, 7, ''],
        ];
        let y = wallTop;
        tiers.forEach(([hw, wh, gable], i) => {
          // the storey's wall, white plaster with window recesses (deep under the lintel, the sill lit from
          // below), in the shadow of the eave above at its top and washed by the floodlights from below
          for (let yy = y - wh; yy < y; yy++)
            for (let x = cx - hw + 2; x < cx + hw - 2; x++) {
              const r = yy - (y - wh);
              const win = r >= 2 && r <= 4 && (x - cx + hw) % 4 >= 1 && (x - cx + hw) % 4 <= 2 && Math.abs(x + 0.5 - cx) < hw - 4;
              const shade = x > cx + hw - 5;
              put(x, yy, win ? [EAVE, 0x6e7890, 0x8a94ac][r - 2] : r === 0 ? UNDER : shade || r === wh - 1 ? S[1] : S[3]);
              if (!win && r > 0) glowAt(x, yy, flood(x), (0.12 + 0.36 * (r / (wh - 1))) * (shade ? 0.5 : 1));
            }
          y -= wh;
          // the roof: thick snow, rows of carved tiles, an upturned corner at each end, the eave dark beneath
          const rh = 5;
          for (let yy = y - rh; yy < y; yy++) {
            const r = yy - (y - rh);
            const span = hw + 2 + r * 0.8;
            for (let x = Math.round(cx - span); x < cx + span; x++) {
              const tile = r > 0 && (x - cx) % 2 === 0;
              put(x, yy, r === 0 ? S[3] : r === rh - 1 ? EAVE : tile ? S[1] : x < cx ? S[3] : S[2]);
            }
          }
          for (const s of [-1, 1]) {
            put(Math.round(cx + s * (hw + 6)), y - 1, EAVE);
            put(Math.round(cx + s * (hw + 6)), y - 2, S[3]);
            put(Math.round(cx + s * (hw + 6)), y - 3, S[3]);
            put(Math.round(cx + s * (hw + 7)), y - 4, S[2]);
          }
          if (gable === 'chidori') {
            // a triangular gable rising out of the roof, a carved bargeboard along its edges, its fish-tail ornament
            for (let k = 0; k < 7; k++)
              for (let x = cx - 7 + k; x <= cx + 7 - k; x++) put(x, y - rh - k + 3, Math.abs(x - cx) === 7 - k || k === 6 ? S[3] : Math.abs(x - cx) === 6 - k ? S[0] : x > cx ? S[2] : S[3]);
            put(cx, y - rh + 1, S[0]);
            put(cx, y - rh + 2, S[1]);
          } else if (gable === 'kara') {
            // the curved kara gable over the entrance, shadow under its curve
            for (let x = cx - 9; x <= cx + 9; x++) {
              const a = Math.round(Math.sin(((x - cx + 9) / 18) * Math.PI) * 4);
              put(x, y - 2 - a, S[3]);
              put(x, y - 1 - a, S[0]);
              for (let yy = y - a; yy < y + 2; yy++) put(x, yy, S[2]);
            }
          }
          y -= rh - 1;
        });
        // the top ridge and its golden shachihoko (lit gold by the floodlights)
        for (let x = cx - 9; x < cx + 9; x++) put(x, y - 1, S[3]);
        for (const s of [-1, 1]) {
          glowAt(cx + s * 9, y - 2, 0xffd060);
          glowAt(cx + s * 9, y - 3, 0xffe080);
          glowAt(cx + s * 8, y - 4, 0xffd060);
        }
        // floodlights at the foot, their light washing up the walls
        for (const s of [-1, 1]) {
          glowAt(cx + s * 36, by - 2, 0xffffff);
          poolAt(cx + s * 30, by - 20, 30, s < 0 ? 0xff60c8 : 0x60a8ff, 0.32);
        }
        poolAt(cx, by - 50, 46, 0xd8e8ff, 0.2);
        // a dark line all round where the carved snow meets the ground, so the castle stands clear of the snow
        if (!shading)
          for (let yy = castle.y0; yy <= castle.y1; yy++)
            for (let x = castle.x0; x <= castle.x1; x++)
              if (!castle.mask.has(yy * W + x) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => castle.mask.has((yy + dy) * W + x + dx))) img.set(x, yy, OUTLINE);
    };
    objects.push({
      y: by,
      shadow: () => {
        shading = new Set();
        paint();
        shading = null;
      },
      draw: paint,
    });
    reserveRect(cx - W2 - 3, top - 8, W2 * 2 + 6, by - top + 10);
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
  // ------------------------------------------------------------ ice sculpture shapes (x, y on a w x h grid)
  function DRAGON(x, y, w, h) {
    // a coiling body: discs along an S-curve rising to the head, a ridge of spikes along its back
    let best = 0;
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const px = w / 2 + Math.sin(t * 5.2) * (w * 0.28) * (1 - t * 0.4);
      const py = h - 4 - t * (h - 14);
      const r = 2 + (1 - t) * 3.2;
      const d = Math.hypot(x - px, y - py);
      if (d < r) best = Math.max(best, i % 4 === 0 && d > r - 1.2 ? 2 : 1);
      if (i % 3 === 0 && d < r + 2 && y < py - r + 1 && Math.abs(x - px) < 1) best = Math.max(best, 1); // spikes
    }
    if (best) return best;
    // the head: a snout to the left, horns swept back, an open jaw
    const hx = w / 2 + Math.sin(5.2) * w * 0.17;
    const hy = 9;
    if (((x - hx + 3) / 7) ** 2 + ((y - hy) / 3.5) ** 2 < 1) return y === Math.round(hy) && x < hx - 4 ? 2 : (x - hx + 6) ** 2 + (y - hy + 1) ** 2 < 1.5 ? 3 : 1;
    if (y > hy + 2 && y < hy + 5 && x > hx - 9 && x < hx - 2 && (x + y) % 2 === 0) return 1; // the lower jaw
    if (Math.abs(y - (hy - 3 - (x - hx) * 0.6)) < 0.8 && x > hx && x < hx + 7) return 3; // horns
    if (Math.abs(y - (hy - 2 - (x - hx) * 0.3)) < 0.8 && x > hx + 1 && x < hx + 9) return 1;
    // a foreleg reaching out of the coil into the hollow of the S, three frosted claws spread at its end
    const ly = Math.round(h * 0.62);
    const lt = (h - 4 - ly) / (h - 14);
    const lx0 = w / 2 + Math.sin(lt * 5.2) * (w * 0.28) * (1 - lt * 0.4) - (2 + (1 - lt) * 3.2) + 1;
    const lx1 = lx0 - 6;
    if (x >= lx1 && x <= lx0 && Math.abs(y - (ly + ((lx0 - x) / 6) * 3)) < 1) return 1;
    for (const [dx, dy] of [[-1, -1], [-2, 0], [-1, 2]]) if (x === Math.round(lx1 + dx) && y === ly + 3 + dy) return 3;
    return 0;
  }
  function SWANS(x, y, w, h) {
    // two swans face to face: bodies low at either side, necks bowing out and back in until they meet beak
    // to beak at the top, the pair making a heart
    const cx = w / 2;
    for (const s of [-1, 1]) {
      const bx = cx + s * 10;
      const byy = h - 6;
      if (((x - bx) / 8) ** 2 + ((y - byy) / 4.5) ** 2 < 1) return y < byy - 1 && Math.abs(x - bx + s * 1) < 5 && (x + y) % 3 === 0 ? 2 : 1;
      if (((x - (bx + s * 7)) / 3) ** 2 + ((y - (byy - 3)) / 3.5) ** 2 < 1 && y < byy) return 3; // the tail feathers, frosted
      // the neck: a curve from the breast out and up and in to the head
      for (let i = 0; i <= 24; i++) {
        const t = i / 24;
        const p0 = [cx + s * 5, byy - 2];
        const p1 = [cx + s * 16, byy - 26];
        const p2 = [cx + s * 2.5, byy - 17];
        const u = 1 - t;
        const px = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0];
        const py = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1];
        if (Math.hypot(x - px, y - py) < 1.6 - t * 0.4) return 1;
      }
      if (Math.hypot(x - (cx + s * 2.5), y - (byy - 17)) < 2.1) return 1; // the head
      if (Math.abs(y - (byy - 16)) < 0.7 && (x - cx) * s >= 0 && (x - cx) * s < 1.2) return 3; // beaks touching
    }
    return 0;
  }
  function OWL(x, y, w, h) {
    // Blakiston's fish owl on a branch: ear tufts, a frosted face disc round each great eye, wing feathers
    const cx = w / 2;
    if (Math.abs(y - (h - 2)) < 1.2 && x > 1 && x < w - 1) return 2; // the branch
    if (((x - cx) / (w * 0.42)) ** 2 + ((y - h * 0.6) / (h * 0.36)) ** 2 < 1) {
      if (Math.abs(x - cx) > w * 0.22 && (y + Math.abs(x - cx)) % 3 === 0) return 2; // wing feathers
      return y > h * 0.55 && (x + y) % 4 === 0 ? 2 : 1;
    }
    if (((x - cx) / (w * 0.4)) ** 2 + ((y - h * 0.26) / (h * 0.22)) ** 2 < 1) {
      for (const s of [-1, 1]) {
        const d = Math.hypot(x - (cx + s * 4), y - h * 0.24);
        if (d < 1.3) return 2;
        if (d < 3.2) return 3;
      }
      return Math.abs(x - cx) < 1 && y > h * 0.28 ? 2 : 1;
    }
    for (const s of [-1, 1]) if (Math.abs(x - (cx + s * 6)) < 1.5 && y < h * 0.1 + 3 && y > 0) return 1; // ear tufts
    return 0;
  }
  function FOX(x, y, w, h) {
    // an Ezo red fox sitting, its great brush of a tail curled round its feet
    const cx = w / 2 - 2;
    if (((x - cx) / 6) ** 2 + ((y - h * 0.62) / (h * 0.3)) ** 2 < 1) return Math.abs(x - cx) < 2 && y > h * 0.45 && y < h * 0.7 ? 3 : 1; // body, white chest
    if (((x - cx) / 5) ** 2 + ((y - h * 0.24) / 4) ** 2 < 1) {
      for (const s of [-1, 1]) if (Math.abs(x - (cx + s * 2)) < 1 && Math.abs(y - h * 0.22) < 0.6) return 2; // eyes
      return y > h * 0.28 && Math.abs(x - cx) < 2 ? 3 : 1;
    }
    for (const s of [-1, 1]) if (Math.abs(x - (cx + s * 3)) < 2 - (h * 0.14 - y) * 0.4 && y < h * 0.16 && y > h * 0.02) return 1; // ears
    // the tail sweeping round from behind to the front
    const tx = x - (cx + 7);
    const ty = y - (h - 6);
    if ((tx / 6) ** 2 + (ty / 4) ** 2 < 1 && tx > -9) return tx > 3 ? 3 : (x + y) % 4 === 0 ? 2 : 1;
    return 0;
  }
  function ORCA(x, y, w, h) {
    // an orca leaping out of a wave, nose up to the right: a sleek body, the tall dorsal fin, tail flukes,
    // its white eye patch and belly frosted, spray at its tail
    const cx = w * 0.52;
    const cy = h * 0.52;
    const a = -0.55;
    const lx = (x - cx) * Math.cos(a) + (y - cy) * Math.sin(a); // along the body (head +)
    const ly = -(x - cx) * Math.sin(a) + (y - cy) * Math.cos(a); // across it (belly +)
    const len = 13;
    const half = lx > 0 ? 5 * Math.sqrt(Math.max(0, 1 - (lx / len) ** 2)) : 5 * Math.max(0, 1 + lx / (len * 1.15));
    if (Math.abs(lx) < len && Math.abs(ly) < half) {
      if (lx > 4 && lx < 8 && ly < -1.5 && ly > -3.5) return 3; // the eye patch
      if (ly > half * 0.35 && lx > -6) return 3; // the white belly
      if (lx > len - 3 && Math.abs(ly) < 0.6) return 2; // the mouth
      return 1;
    }
    if (lx > -4 && lx < 2 && ly < -half && ly > -half - 7 + Math.abs(lx + 1) * 1.6) return 1; // the dorsal fin
    if (lx < -len + 3 && lx > -len - 4 && Math.abs(ly) < (-len + 3 - lx) * 0.9) return 1; // the flukes
    if (y > h - 5 && x < w * 0.5 && (x * 7 + y * 3) % 4 === 0) return 3; // spray
    return 0;
  }
  function CRAB(x, y, w, h) {
    // a Hokkaido hairy crab: a round shell, eight legs splayed, two claws raised
    const cx = w / 2;
    const cy = h * 0.62;
    if (((x - cx) / 8) ** 2 + ((y - cy) / 6) ** 2 < 1) return (x + y) % 3 === 0 ? 2 : Math.abs(y - cy + 2) < 1 ? 3 : 1;
    for (const s of [-1, 1])
      for (let k = 0; k < 4; k++) {
        const ax = cx + s * (7 + k * 0.5);
        const ay = cy - 1 + k * 2;
        const lx = (x - ax) * s;
        if (lx > 0 && lx < 7 && Math.abs(y - (ay + lx * (k - 1) * 0.35)) < 0.9) return 1;
      }
    for (const s of [-1, 1]) {
      if (Math.hypot(x - (cx + s * 9), y - h * 0.22) < 3.4) return Math.abs(x - (cx + s * 9)) < 0.6 && y < h * 0.22 ? 2 : 1; // claws
      if (Math.abs(x - (cx + s * (6 + (cy - y) * 0.4))) < 1 && y > h * 0.3 && y < cy - 4) return 1; // the arms
      if (Math.hypot(x - (cx + s * 2), y - (cy - 6)) < 1) return 3; // eyes on stalks
    }
    return 0;
  }
  function LOTUS(x, y, w, h) {
    // a lotus in bloom: layers of pointed petals opening out, a frosted heart, a leaf below
    const cx = w / 2;
    const base = h - 6;
    if (Math.abs(y - (h - 3)) < 2 && Math.abs(x - cx) < w * 0.45 - Math.abs(y - (h - 3))) return (x + y) % 3 === 0 ? 2 : 1; // the leaf
    for (const [n, len, spread] of [[7, h * 0.72, 1.25], [5, h * 0.55, 0.9], [3, h * 0.36, 0.6]]) {
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (i / (n - 1) - 0.5) * spread * 2;
        const px = x - cx;
        const py = y - base;
        const along = px * Math.cos(a) + py * Math.sin(a);
        const across = -px * Math.sin(a) + py * Math.cos(a);
        if (along > 0 && along < len && Math.abs(across) < Math.sin((along / len) * Math.PI) * (len * 0.22)) return Math.abs(across) < 0.6 ? 2 : len < h * 0.4 ? 3 : 1;
      }
    }
    return 0;
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

  // projection mapping on the snow castle (live): bands of colour sweeping up its walls and roofs, in turn
  if (castle) {
    const PROJ = [0xff50c0, 0x50a8ff, 0xffd050, 0x9a60ff, 0x50e0c0, 0xff7040];
    const frames = PROJ.map((col, f) =>
      kit.frame(
        cut(img, castle.x0, castle.y0, castle.x1 - castle.x0, castle.y1 - castle.y0, (r, g, b, a, x, y) => {
          if (!castle.mask.has(y * W + x)) return null;
          const band = ((castle.y1 - y) + f * 9) % 36;
          if (band > 18) return null;
          const k = 0.5 * Math.sin((band / 18) * Math.PI);
          const [cr, cg, cb] = rgb(col);
          return [r + (cr - r) * k, g + (cg - g) * k, b + (cb - b) * k, 255];
        }),
      ),
    );
    kit.loop(castle.x0, U(castle.y0), frames, { fps: 1.2, fx: 1 });
  }

  // city life (live): steam rising from the manholes, snow sliding off the suburb's tin roofs, office windows
  // going dark and lighting up again as people leave or work late
  for (const [x, u] of [[86, 2380], [96, 2560], [30, 2700], [150, 2862], [92, 2948], [30, 3180], [150, 3292], [86, 3424]])
    if (!pads.some((p) => Math.abs(p.x - x) < 12 && Math.abs(p.u - u) < 12)) {
      img.disc(x + 0.5, Y(u) + 0.5, 1.5, 0x2a2a30);
      kit.emit(x, u, steam, { rate: 0.8, life: [1.6, 2.6], vy: 6, sx: 1, wf: 0.7, a: 0.4, tint: 1 });
    }
  // people out with their snow shovels in front of the suburb's houses, tossing the snow aside (live)
  {
    const sr = rng(3395);
    const shoveller = (c, f) => {
      const r = new Raster(4, 5);
      r.set(1, 0, 0x2a2026);
      r.rect(1, 1, 1, 2, c);
      r.set(f ? 2 : 3, f ? 2 : 1, 0x6a5a4a); // the shovel's handle
      r.rect(3, f ? 3 : 2, 1, 1, 0x3a7ac8); // its blade
      r.set(1, 3, 0x2a2a3a);
      return frameAt(r, 1700);
    };
    const toss = [0, 1, 2, 3].map((k) => {
      const r = new Raster(6, 6);
      for (let i = 0; i < 4 + k; i++) r.set(Math.min(5, 1 + k + (i % 2)), Math.max(0, 4 - k + Math.floor(i / 2) - 1), 0xf4f6fa, k > 2 ? 0.5 : 0.95);
      return frameAt(r, 1700);
    });
    const homes = roofEdges.filter(([, u]) => u > SUBURB[0] + 20 && u < CENTER[0] - 20).filter(() => sr() < 0.12);
    for (const [x, u, w] of homes) {
      const c = sr.pick([0xd83a3a, 0x3a6ad0, 0x5aaa6a, 0xe8a030, 0x8a4ab0]);
      kit.wander(x + w / 2, u - 9, 4, 1, [shoveller(c, 0), shoveller(c, 1)], { n: 1, sp: 1.5, idle: 0.5, turn: 'flip', fps: 2 });
    }
    if (homes.length) kit.spot(homes.map(([x, u, w]) => [x + w / 2 - 6, u - 6, 12, 5]), toss, { rate: homes.length * 0.25, fps: 6 });
  }
  {
    const slide = [0, 1, 2, 3, 4].map((k) => {
      const r = new Raster(7, 7);
      const n = [2, 4, 6, 6, 4][k];
      for (let i = 0; i < n; i++) {
        const a = i * 2.4 + k;
        const d = k * 0.7 + (i % 3) * 0.4;
        r.set(Math.round(3 + Math.cos(a) * d), Math.min(6, Math.round(1 + k + Math.sin(a) * d * 0.5)), 0xf4f6fa, k > 3 ? 0.5 : 0.9);
      }
      return frameAt(r, 1700);
    });
    const rects = roofEdges.filter(([, u]) => u > SUBURB[0] && u < CENTER[0]).map(([x, u, w]) => [x + 1, u + 1, w - 2, 2]);
    if (rects.length) kit.spot(rects, slide, { rate: 0.6, fps: 6 });
  }
  {
    const byStretch = new Map();
    for (const [x, y, c] of lights) {
      const u = U(y);
      if (u < CENTER[0] || u > RIVER[0] || (c !== C.warm && c !== C.cool)) continue;
      const k = Math.floor(u / 256);
      if (!byStretch.has(k)) byStretch.set(k, []);
      byStretch.get(k).push([x, u]);
    }
    const fr = rng(3391);
    for (const [k, wins] of byStretch) {
      const dark = new Raster(1, 1);
      dark.set(0, 0, C.windowDark);
      const f = frameAt(dark, k * 256 + 128);
      const parts = wins.filter(() => fr() < 0.22).map(([x, u]) => [0, x, u, fr() * 20]);
      if (parts.length) kit.wave([f], parts, { w: 0.12, a0: 0, a1: 1, pw: 7, d: 0.05 });
    }
  }

  const chunks = [];
  for (let i = 0; i < CHUNKS; i++) chunks.push(img.crop(0, i * CHUNK, W, CHUNK));
  return { strip: img, chunks, props: kit.pack(), meta: { width: W, chunkHeight: CHUNK, chunks: CHUNKS, length: L, tint: tintTable(L, tod.white) } };
}

export { mix };
