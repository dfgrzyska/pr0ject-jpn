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
import { PropKit, puff, todGrade, tintTable, planTraffic } from '../props.mjs';
import { HiCanvas, hashPx } from '../hires.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export const W = 180;
export const S = 3; // fine pixels per logical one: the strip is drawn 540 px wide, laid out in the game's 180
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
  fir: [0x0e201c, 0x16302a, 0x22463a, 0x345e4c, 0x4a7a62],
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
  let img = new HiCanvas(W, L, S);
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
  const lightsFine = []; // the same, single fine pixels
  const roofEdges = []; // [x, u, w] of the tin roofs' lower eaves (snow slides off them, live)
  const pools = []; // additive light pools, after the grade
  const glow = (x, y, c, a = 1) => lights.push([Math.round(x), Math.round(y), c, a]);
  const glowPx = (X, Yy, c, a = 1) => lightsFine.push([Math.round(X), Math.round(Yy), c, a]);
  const pool = (x, y, r, c, k = 0.5) => pools.push({ x, y, r, c, k });
  const kit = new PropKit(3313, { artScale: S }); // the moving parts
  const frame0 = kit.frame.bind(kit);
  kit.frame = (r, name) => frame0(r.hi ?? r, name); // (frames are drawn on HiCanvases)
  let castle = null; // the snow castle's outline, for its projection mapping
  const tod = todGrade(TOD, smooth);
  /** A frame graded for strip position u; `lit` are [x, y, colour, alpha] (logical) lights painted on afterwards. */
  const frameAt = (r, u, lit = []) => {
    tod.frame(r, u);
    for (const [x, y, c, a] of lit) r.light(x, y, c, a);
    return kit.frame(r);
  };
  // puffs for the live smoke and steam: chimneys, the ramen alley, the open channel of the frozen river
  const smoke = [2, 3, 4].map((r) => [0, 1].map((v) => kit.frame(puff(r * S, r * 11 + v, [0x707480, 0x9094a0, 0xb4b8c4, 0xd8dce4]))));
  const steam = [2, 3, 4].map((r) => [0, 1].map((v) => kit.frame(puff(r * S, r * 17 + v, [0xa8b0c0, 0xc8d0dc, 0xe4e8f0, 0xffffff]))));
  const shadowRect = (x, y, w, h, f = 0.6) => {
    for (let j = 0; j < h * S; j++) for (let i = 0; i < w * S; i++) img.tintPx(Math.round(x * S) + i, Math.round(y * S) + j, f);
  };
  const shadowPx = (X, Yy, w, h, f = 0.55) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) img.tintPx(X + i, Yy + j, f);
  };
  /** Snow at a fine pixel: broad drifts, wind-packed crust in fine ripples, now and then a glinting crystal. */
  const snowPx = (X, Yy, lo = 0.4, span = 0.5, seed = 5) => {
    const v = lo + fbm(X / S, Yy / S, { seed, scale: 9, octaves: 3 }) * span + (fbm(X, Yy, { seed: seed + 40, scale: 3 }) - 0.5) * 0.16;
    const g = hashPx(X, Yy, seed + 9);
    return g < 0.004 ? 0xffffff : g > 0.996 ? C.snow[1] : rampColor(C.snow, v, X, Yy);
  };
  const snowAt = (x, y, lo, span, seed) => snowPx(Math.round(x * S), Math.round(y * S), lo, span, seed);
  /** A written character from afar: strokes in an s x s box at fine (X, Y), drawn by put. */
  const glyph = (X, Yy, s, c, r, put = (gx, gy, gc) => glowPx(gx, gy, gc)) => {
    for (let k = 0; k < s; k++) {
      put(X + k, Yy, c);
      if (r() < 0.5) put(X + k, Yy + s - 1, c);
    }
    const vx = X + 1 + Math.floor(r() * Math.max(1, s - 2));
    for (let k = 0; k < s; k++) put(vx, Yy + k, c);
    if (r() < 0.6) for (let k = 0; k < s - 1; k++) put(X + k, Yy + Math.floor(s / 2), c);
  };
  /** A person in winter clothes seen from above: a knitted hat or a hood, a scarf, the coat with its arms, boots. */
  const personPx = (X, Yy, pr, o = {}) => {
    const coat = o.coat ?? pr.pick([0xd04040, 0x3a6ad0, 0xe8c040, 0xe8e8f0, 0x2a2a34, 0x5a3a2a, 0x3a6a4a, 0x8a4ab0]);
    const hat = o.hat ?? pr.pick([0xd83a3a, 0xe8e0d0, 0x2a2a34, 0x3a8ad0, 0xe8a030, 0x6a3a8a]);
    for (let i = 0; i < 4; i++) img.px(X + 1 + i, Yy + 6, 0x141824, 0.4);
    img.px(X, Yy - 2, hat);
    img.px(X + 1, Yy - 2, scaleColor(hat, 1.15));
    img.px(X + 2, Yy - 2, hat);
    img.px(X + 1, Yy - 3, pr() < 0.5 ? 0xf4f0e6 : hat); // (the bobble)
    img.px(X, Yy - 1, 0xe8c0a0);
    img.px(X + 1, Yy - 1, 0xe8c0a0);
    img.px(X + 2, Yy - 1, hat);
    const scarf = pr.pick([0xe8343a, 0xf0d040, 0x3ab0e0, 0xf4f0e6]);
    for (let i = 0; i < 3; i++) img.px(X + i, Yy, scarf);
    for (let j = 1; j < 4; j++) for (let i = -1; i < 4; i++) if (!(j === 3 && (i < 0 || i > 2))) img.px(X + i, Yy + j, i < 0 || i > 2 ? scaleColor(coat, 0.75) : i === 0 ? scaleColor(coat, 1.12) : coat);
    img.px(X, Yy + 4, 0x2a2a34);
    img.px(X + 2, Yy + 4, 0x2a2a34);
    img.px(X, Yy + 5, 0x1a1418);
    img.px(X + 2, Yy + 5, 0x1a1418);
  };

  // ------------------------------------------------------------ data from the wave file
  const pads = stage.waves.filter((w) => w.type === 'turret').map((w) => ({ x: w.x, u: anchor + V * w.t + 10 }));
  const plowRoads = stage.waves.filter((w) => w.type === 'plow' && typeof w.dir === 'number').map((w) => Math.round(anchor + V * w.t - w.y));
  for (const p of pads) reserveRect(p.x - 12, Y(p.u) - 12, 24, 24);

  // ------------------------------------------------------------ 1. ground: snow, valleys beside the jump
  // (fine: the drifts and their wind-packed ripples, crystals glinting, the lip of the slope where it drops away)
  const ridge = (u) => {
    const close = Math.max(0, u - 820) * 0.3;
    const n = (fbm(u, 3, { seed: 71, scale: 40, octaves: 2 }) - 0.5) * 14;
    return [20 + 14 * Math.sin(u / 150) + n - close, 160 + 12 * Math.sin(u / 190 + 2) - n * 0.7 + close];
  };
  for (let FYr = 0; FYr < L * S; FYr++) {
    const y = (FYr + 0.5) / S;
    const u = L - y;
    const [xl, xr] = u < JUMP[1] ? ridge(u) : [-99, 999];
    for (let FXr = 0; FXr < W * S; FXr++) {
      const x = (FXr + 0.5) / S;
      const d = Math.min(x - xl, xr - x);
      if (d < 0) {
        // drop-off into the valley: a ragged snowy lip with its cornice, then transparent
        if (d > -2.2 + (hashPx(FXr >> 1, FYr >> 1, 70) - 0.5) * 1.2) img.px(FXr, FYr, d > -0.8 ? 0xb8c0d4 : 0x8a90a8);
        continue;
      }
      let c = snowPx(FXr, FYr);
      if (u < JUMP[1]) {
        const rip = fbm(FXr * 0.15, FYr * 0.55, { seed: 72, scale: 5, octaves: 2 });
        if (rip > 0.64) c = C.snow[3];
        else if (rip < 0.32) c = scaleColor(c, 0.95);
        if (d < 5) c = d < 1.2 ? C.snow[3] : rampColor(C.snow, 0.15 + d * 0.06, FXr, FYr);
      }
      img.px(FXr, FYr, c);
    }
  }

  // ------------------------------------------------------------ helpers: roads
  // (fine: packed snow with the ruts the tyres have worn, slush in them, the ploughed bank with its lumpy crest)
  const roadPx = (FXr, FYr, across, hw, along) => {
    const a = Math.abs(across);
    if (a > hw) {
      const bank = a - hw;
      const crest = 1.5 + (fbm(along * 0.8, FXr + FYr, { seed: 32, scale: 2 }) - 0.5) * 0.8;
      img.px(FXr, FYr, bank < 0.35 ? 0xd8dce6 : bank < crest ? (bank < crest - 0.4 ? C.bank : 0xe0e6f0) : snowPx(FXr, FYr, 0.55, 0.3));
      return;
    }
    let c = rampColor(C.packed, fbm(FXr / S, FYr / S, { seed: 31, scale: 4, octaves: 2 }) + (fbm(FXr, FYr, { seed: 30, scale: 2 }) - 0.5) * 0.25, FXr, FYr);
    const lane = hw >= 5 ? Math.abs(a - hw / 2) : a;
    const rut = Math.abs(lane - 1.5);
    if (rut < 0.55 && fbm(along * 0.3, across, { seed: 33, scale: 3 }) > 0.3) c = rut < 0.25 ? 0x6e6860 : C.track;
    else if (rut < 0.8 && hashPx(FXr, FYr, 34) < 0.3) c = 0x9a948a;
    if (a > hw - 0.6) c = mix(c, 0xc8ccd4, 0.5);
    img.px(FXr, FYr, c);
  };
  const vRoad = (cx, hw, u0, u1, yabane = true) => {
    img.fine(cx - hw - 3, Y(u1), hw * 2 + 6, u1 - u0, (FXr, FYr, x, y) => {
      roadPx(FXr, FYr, x - cx, hw, L - y);
      return null;
    });
    for (let u = u0; u < u1; u++) if (yabane && u % 34 === 0) for (const s of [-1, 1]) yabaneSign(Math.round(cx + s * (hw + 2)), Y(u));
    reserveRect(cx - hw - 4, Y(u1), hw * 2 + 8, u1 - u0);
  };
  const hRoad = (uc, hw, x0 = 0, x1 = W, yabane = true) => {
    img.fine(x0, Y(uc + hw + 3), x1 - x0, hw * 2 + 6, (FXr, FYr, x, y) => {
      roadPx(FXr, FYr, L - y - uc, hw, x);
      return null;
    });
    if (yabane) for (let x = x0 + 8; x < x1; x += 34) for (const s of [-1, 1]) yabaneSign(x, Y(uc + s * (hw + 2)));
    reserveRect(x0, Y(uc + hw + 4), x1 - x0, hw * 2 + 8);
  };
  /** Yabane: the red-and-white arrow on its pole that marks the road edge under the snow, pointing down. */
  function yabaneSign(x, y) {
    const X = x * S + 1;
    const Yy = y * S;
    objects.push({
      y: y + 1,
      shadow: () => {
        for (let j = 0; j < 9; j++) img.tintPx(X + 2 + Math.floor(j * 0.4), Yy + 2 + j, 0.62);
      },
      draw: () => {
        for (let j = -6; j < 3; j++) img.px(X, Yy + j, 0x3a3a44);
        for (let j = 0; j < 6; j++) {
          const c = Math.floor(j / 2) % 2 ? 0xf4f4f4 : 0xe23a2a;
          img.px(X - 1, Yy - 6 + j, c);
          img.px(X + 1, Yy - 6 + j, c);
        }
        img.px(X, Yy - 7, 0xe23a2a);
        img.px(X - 1, Yy - 7, C.snow[3]);
      },
    });
  }
  const streetLamp = (x, y, warm = true) => {
    const X = x * S + 1;
    const Yy = y * S + 1;
    objects.push({
      y,
      shadow: () => {
        for (let j = 0; j < 10; j++) img.tintPx(X + 2 + Math.floor(j * 0.5), Yy + 2 + j, 0.62);
      },
      draw: () => {
        for (let j = -1; j < 3; j++) img.px(X, Yy + j, 0x3a3a44);
        img.px(X - 1, Yy - 1, 0x4a4a54);
        img.px(X + 1, Yy - 1, 0x4a4a54);
        img.px(X, Yy - 2, C.snow[3]); // (snow on the lamp's hood)
        glow(x, y, warm ? 0xfff0c0 : 0xe8f4ff);
        pool(x + 0.5, y + 0.5, 11, warm ? C.lamp : 0xbcd8ff, 0.42);
      },
    });
  };

  // ------------------------------------------------------------ helpers: buildings & props
  /** A row of windows along fine row Yy from logical x0 to x1: frames, mullions, lit (warm or cool) or dark. */
  const windowsRow = (x0, x1, y, litP, step = 3, cool = false) => {
    const Yy = Math.round(y * S) - 1;
    for (let x = x0; x < x1; x += step) {
      const X = Math.round(x * S) - 1;
      const lit = rand() < litP;
      const c = cool ? C.cool : C.warm;
      for (let j = 0; j < 4; j++)
        for (let i = 0; i < 3; i++) {
          if (j === 0) img.px(X + i, Yy + j, 0x9aa0aa); // (the snow on the sill above)
          else if (lit) glowPx(X + i, Yy + j, i === 1 && j === 2 ? scaleColor(c, 0.82) : (X * 7 + j) % 9 === 0 ? 0xc88a5a : c, j === 3 ? 0.8 : 0.95);
          else img.px(X + i, Yy + j, i === 1 || j === 2 ? 0x1e2634 : C.windowDark);
        }
    }
  };
  /** Hokkaido house: a steep gable tin roof in its colour, standing seams, the snow sliding off it in tongues,
   * a cornice of snow overhanging the eave with icicles under it; sided walls, windows, the glassed windbreak
   * porch (fūjoshitsu), a chimney with its cap of snow. */
  const tinHouse = (x, y, w, h, opt = {}) => {
    const roof = opt.roof ?? rand.pick(C.roofs);
    const wall = opt.wall ?? rand.pick(C.siding);
    const faceH = 4;
    const ridge = y + Math.floor(h / 2);
    const seed = Math.floor(rand() * 1e6);
    const porch = rand() < 0.7 ? x + 2 + Math.floor(rand() * (w - 8)) : -1;
    const litP = opt.lit ?? 0.5;
    const X0 = x * S;
    const X1 = (x + w) * S;
    const RY0 = y * S;
    const RY1 = (y + h) * S;
    const RID = ridge * S + 1;
    objects.push({
      y: y + h + faceH,
      shadow: () => shadowPx(X0 + 9, RY0 + 9, w * S, (h + faceH) * S, 0.55),
      draw: () => {
        for (let Yy = RY0; Yy < RY1; Yy++)
          for (let X = X0; X < X1; X++) {
            const north = Yy < RID;
            const metal = north ? scaleColor(roof, 1.15) : roof;
            const seam = (X - X0) % 4 === 0;
            const tongue = fbm(X * 0.5, Yy * 0.16, { seed, scale: 4, octaves: 2 }) + (north ? 0.08 : -0.05) + (Yy - RY0 < 3 ? 0.2 : 0);
            let c = tongue > 0.4 ? snowPx(X, Yy, north ? 0.7 : 0.55, 0.3, seed & 255) : seam ? scaleColor(metal, 0.8) : (X - X0) % 4 === 1 ? scaleColor(metal, 1.1) : metal;
            if (tongue > 0.4 && tongue < 0.44) c = 0xc8d0e0; // (the soft edge of the snow)
            if (X === X0 || X === X1 - 1) c = scaleColor(c, 0.8);
            img.px(X, Yy, c);
          }
        for (let X = X0; X < X1; X++) {
          img.px(X, RID, scaleColor(roof, 0.65));
          img.px(X, RID - 1, C.snow[3]);
        }
        // the cornice of snow over the eave and the icicles hanging from it
        for (let X = X0; X < X1; X++) {
          const sag = 1 + Math.round(fbm(X * 0.3, seed, { seed: 37, scale: 3 }) * 2);
          for (let j = 0; j < sag; j++) img.px(X, RY1 - 1 + j, j === sag - 1 ? 0xc0c8d8 : C.snow[3]);
          if (hashPx(X, seed, 38) < 0.3) {
            const len = 1 + Math.floor(hashPx(seed, X, 39) * 5);
            for (let j = 0; j < len; j++) img.px(X, RY1 + sag - 1 + j, j === len - 1 ? 0xe8f4ff : 0xb8d4e8);
          }
        }
        // the walls: siding, the shadow under the eave, windows
        const FY0 = RY1 + 3;
        const FY1 = (y + h + faceH) * S;
        for (let Yy = FY0; Yy < FY1; Yy++) for (let X = X0 + S; X < X1 - S; X++) img.px(X, Yy, Yy < FY0 + 2 ? 0x3a3238 : (Yy - FY0) % 2 ? scaleColor(wall, 0.9) : wall);
        windowsRow(x + 3, x + w - 3, y + h + 2, litP, 4);
        if (porch >= 0) {
          // the windbreak porch: a little glass box before the door, snow on its roof, light inside
          const PX = porch * S;
          const PY = FY0 + 2;
          for (let j = 0; j < 12; j++)
            for (let i = 0; i < 15; i++) {
              if (j < 3) img.px(PX + i, PY + j, j === 0 ? C.snow[3] : C.snow[2]);
              else if (i === 0 || i === 14 || j === 11) img.px(PX + i, PY + j, scaleColor(wall, 0.7));
              else glowPx(PX + i, PY + j, i % 5 === 0 ? 0xb88a5a : C.warm, 0.85);
            }
          pool(porch + 2.5, y + h + 6, 7, C.warm, 0.3);
        }
        if (opt.chimney) {
          const CXc = (x + w - 5) * S;
          const CYc = (y + 2) * S;
          for (let j = 0; j < 9; j++) for (let i = 0; i < 6; i++) img.px(CXc + i, CYc + j, j < 2 ? C.snow[3] : i === 0 ? 0x5a5a62 : i === 5 ? 0x2a2a32 : 0x4a4a52);
          img.px(CXc + 2, CYc + 2, 0x1a1a20);
          img.px(CXc + 3, CYc + 2, 0x1a1a20);
        }
      },
    });
    reserveRect(x - 1, y - 1, w + 2, h + faceH + 2);
    roofEdges.push([x, U(y + h), w]);
    // the stove's smoke curling from the chimney, blown by the wind (live)
    if (opt.chimney) kit.emit(x + w - 4, U(y + 2), smoke, { rate: 1.1, life: [2, 3], vy: 5, sx: 0.5, wf: 1, a: 0.5, tint: 1 });
  };
  /** Flat "no-snow-fall" roof (mu-rakusetsu): a tray of snow inside a parapet, the drain in the middle, sided walls. */
  const flatHouse = (x, y, w, h, opt = {}) => {
    const wall = opt.wall ?? rand.pick(C.siding);
    const litP = opt.lit ?? 0.5;
    const X0 = x * S;
    const Y0 = y * S;
    objects.push({
      y: y + h + 4,
      shadow: () => shadowPx(X0 + 9, Y0 + 9, w * S, (h + 4) * S, 0.55),
      draw: () => {
        for (let Yy = Y0; Yy < (y + h) * S; Yy++)
          for (let X = X0; X < (x + w) * S; X++) {
            const e = Math.min(X - X0, (x + w) * S - 1 - X, Yy - Y0, (y + h) * S - 1 - Yy);
            img.px(X, Yy, e < 2 ? (e === 0 ? 0x6a6c74 : 0x9a9ca4) : e < 3 ? 0x8a90a0 : snowPx(X, Yy, 0.6, 0.35, 7));
          }
        img.discPx((x + w / 2) * S, (y + h / 2) * S, 1.5, 0x7a8294);
        for (let Yy = (y + h) * S; Yy < (y + h + 4) * S; Yy++) for (let X = X0 + S; X < (x + w - 1) * S; X++) img.px(X, Yy, Yy < (y + h) * S + 2 ? 0x3a3238 : (Yy % 2 ? scaleColor(wall, 0.9) : wall));
        windowsRow(x + 2, x + w - 2, y + h + 2, litP, 3);
      },
    });
    reserveRect(x - 1, y - 1, w + 2, h + 6);
  };
  /** Kerosene tank for the house heating: a coloured drum on its stand, a cap of snow, the feed pipe. */
  const tank = (x, y) => {
    const c = rand.pick([0xd04a3a, 0xe8e4dc, 0x3a8a5a, 0x3a6aa8]);
    const X = x * S;
    const Yy = y * S;
    objects.push({
      y: y + 2,
      shadow: () => shadowPx(X + 3, Yy + 4, 9, 6, 0.55),
      draw: () => {
        for (let j = 0; j < 6; j++) for (let i = 0; i < 9; i++) img.px(X + i, Yy + j, j === 0 ? scaleColor(c, 1.25) : j === 5 ? scaleColor(c, 0.7) : i === 0 ? scaleColor(c, 1.1) : i === 8 ? scaleColor(c, 0.75) : c);
        for (let i = 0; i < 9; i++) img.px(X + i, Yy - 1, C.snow[3]);
        for (let i = 1; i < 8; i++) img.px(X + i, Yy - 2, C.snow[3]);
        for (const LX of [X + 1, X + 7]) for (let j = 6; j < 8; j++) img.px(LX, Yy + j, 0x3a3a44);
        img.px(X + 9, Yy + 3, 0x6a6a72);
        img.px(X + 10, Yy + 3, 0x6a6a72);
      },
    });
  };
  /** A car under fresh snow: a rounded mound, a strip of paint, the windscreen brushed clear, the mirrors. */
  const car = (x, y, vertical = true) => {
    const w = vertical ? 4 : 7;
    const h = vertical ? 7 : 4;
    const paint = rand.pick([0xb02a2a, 0x2a4a8a, 0x2a2a30, 0xe0e0e0, 0x6a6a72]);
    const X = x * S;
    const Yy = y * S;
    const Wd = w * S;
    const Hd = h * S;
    objects.push({
      y: y + h,
      shadow: () => shadowPx(X + 3, Yy + 3, Wd, Hd, 0.6),
      draw: () => {
        for (let j = 0; j < Hd; j++)
          for (let i = 0; i < Wd; i++) {
            const e = ((i + 0.5 - Wd / 2) / (Wd / 2)) ** 2 + ((j + 0.5 - Hd / 2) / (Hd / 2)) ** 2;
            if (e > 1.2) continue;
            let c = e > 0.9 ? C.snow[1] : (i + j) / (Wd + Hd) < 0.4 ? C.snow[3] : C.snow[2];
            if (vertical ? j > Hd - 3 : i > Wd - 3) c = e > 0.9 ? scaleColor(paint, 0.75) : paint;
            if (vertical ? j > Hd * 0.25 && j < Hd * 0.4 && Math.abs(i - Wd / 2) < Wd * 0.3 : i > Wd * 0.25 && i < Wd * 0.4 && Math.abs(j - Hd / 2) < Hd * 0.3) c = 0x3a4a5e;
            img.px(X + i, Yy + j, c);
          }
      },
    });
  };
  /** Office / commercial block: snowy flat roof inside its parapet, rooftop units, a helipad on the tall ones,
   * the window grid below lit warm or cool, vertical neon signs, a rooftop billboard. */
  const office = (x, y, w, h, faceH, opt = {}) => {
    const wall = opt.wall ?? rand.pick(C.concrete.slice(1));
    const litP = opt.lit ?? 0.55;
    const units = [];
    for (let i = 0; i < Math.floor((w * h) / 260); i++) units.push([x + 3 + Math.floor(rand() * (w - 9)), y + 3 + Math.floor(rand() * (h - 8)), 3 + Math.floor(rand() * 4), 2 + Math.floor(rand() * 3)]);
    const neon = opt.neon ? Math.max(1, Math.floor(w / 6)) : 0;
    const signs = [];
    for (let i = 0; i < neon; i++) signs.push({ x: x + 1 + Math.floor((i + 0.5) * (w / neon)) - 1, c: rand.pick(NEON), h: Math.max(3, faceH - 2 - Math.floor(rand() * 3)) });
    const board = opt.billboard ? { c: rand.pick(NEON), w: Math.min(w - 4, 10 + Math.floor(rand() * 10)) } : null;
    const orr = rng(x * 131 + y);
    const X0 = x * S;
    const X1 = (x + w) * S;
    const Y0 = y * S;
    const Y1 = (y + h) * S;
    objects.push({
      y: y + h + faceH,
      shadow: () => shadowPx(X0 + 12, Y0 + 12, w * S, (h + faceH) * S, 0.5),
      draw: () => {
        for (let Yy = Y0; Yy < Y1; Yy++)
          for (let X = X0; X < X1; X++) {
            const e = Math.min(X - X0, X1 - 1 - X, Yy - Y0, Y1 - 1 - Yy);
            img.px(X, Yy, e === 0 ? scaleColor(wall, 0.6) : e < 3 ? (e === 1 ? scaleColor(wall, 0.95) : C.snow[3]) : snowPx(X, Yy, 0.55, 0.4, 9));
          }
        if (w * h > 900) {
          for (const [ax, ay] of [[x + 1, y + 1], [x + w - 2, y + 1]]) glow(ax, ay, 0xff3a2a);
          if (orr() < 0.5) {
            // the helipad: a ring and the H swept clear of snow
            const HX = (x + w / 2) * S;
            const HY = (y + h / 2) * S;
            for (let a = 0; a < 6.28; a += 0.04) {
              img.px(Math.round(HX + Math.cos(a) * 15), Math.round(HY + Math.sin(a) * 15), 0x9aa0ac);
              img.px(Math.round(HX + Math.cos(a) * 14), Math.round(HY + Math.sin(a) * 14), 0x9aa0ac);
            }
            for (let j = -6; j <= 6; j++) {
              img.px(HX - 5, HY + j, 0xd8a030);
              img.px(HX - 4, HY + j, 0xd8a030);
              img.px(HX + 4, HY + j, 0xd8a030);
              img.px(HX + 5, HY + j, 0xd8a030);
            }
            for (let i = -4; i <= 4; i++) img.px(HX + i, HY, 0xd8a030);
          }
        }
        // the snow drifted up against the parapet on the windward side, its shadow
        for (let X = X0 + 3; X < X1 - 3; X++)
          for (let j = 0; j < 5; j++) {
            const Yy = Y0 + 3 + j;
            const k = 4 - j + Math.round(fbm(X * 0.2, y, { seed: 46, scale: 3 }) * 2);
            if (k > 0) img.px(X, Yy, j === 4 ? 0xc8d0e0 : 0xffffff, 0.75);
          }
        // the roof hatch and the trail of footprints from it to the plant on the roof
        if (w * h > 300) {
          const HX = X0 + 9 + Math.floor(orr() * (w * S - 30));
          const HY = Y0 + 9 + Math.floor(orr() * (h * S - 30));
          for (let j = 0; j < 9; j++) for (let i = 0; i < 9; i++) img.px(HX + i, HY + j, j < 2 ? C.snow[3] : i === 0 || j === 8 ? 0x4a4c54 : i === 8 ? 0x3a3c44 : 0x6a6c74);
          const [tx, ty] = units[0] ? [units[0][0] * S, units[0][1] * S] : [X1 - 20, Y1 - 20];
          const steps = Math.max(1, Math.round(Math.hypot(tx - HX, ty - HY) / 4));
          for (let k = 1; k < steps; k++) {
            const FX = Math.round(HX + 4 + ((tx - HX) * k) / steps + (k % 2 ? 1.5 : -1.5));
            const FYv = Math.round(HY + 4 + ((ty - HY) * k) / steps);
            img.px(FX, FYv, 0x9aa4bc);
            img.px(FX, FYv + 1, 0xb0b8cc);
          }
          if (orr() < 0.5) {
            // a satellite dish, snow in its bowl
            const DX = X1 - 16;
            const DY = Y0 + 10;
            for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) if (i * i + j * j < 18) img.px(DX + i, DY + j, i * i + j * j < 7 ? 0xffffff : 0xb8bcc8);
            img.px(DX + 5, DY + 5, 0x3a3c44);
          }
          // a run of duct across the roof
          const DYd = Y0 + Math.floor(h * S * (0.3 + orr() * 0.4));
          for (let X = X0 + 6; X < X0 + Math.floor(w * S * 0.6); X++) {
            img.px(X, DYd, C.snow[3]);
            img.px(X, DYd + 1, 0x8a8c94);
            img.px(X, DYd + 2, 0x5a5c64);
            if (X % 12 === 0) img.px(X, DYd + 3, 0x3a3c44);
          }
        }
        if (faceH >= 10) {
          // an aerial mast, its red warning light
          const AX = X0 + 6;
          const AY = Y0 + 6;
          for (let j = 0; j < 12; j++) img.px(AX, AY + j - 10, 0x6a6c78);
          for (let i = -3; i <= 3; i++) img.px(AX + i, AY - 6, 0x6a6c78);
          glowPx(AX, AY - 11, 0xff3a2a);
        }
        for (const [ux, uy, uw, uh] of units) {
          // rooftop units: grey boxes with a fan grille, snow lying on top, their shadow on the snow
          const UX = ux * S;
          const UY = uy * S;
          shadowPx(UX + 3, UY + 3, uw * S, uh * S, 0.75);
          for (let j = 0; j < uh * S; j++)
            for (let i = 0; i < uw * S; i++) {
              let c = j < 2 ? C.snow[3] : i === 0 ? 0x9a9ca4 : i === uw * S - 1 ? 0x5a5c64 : 0x7a7c84;
              if (j > 2 && Math.hypot(i - uw * S * 0.5, j - uh * S * 0.55) < Math.min(uw, uh) * S * 0.3) c = (i + j) % 2 ? 0x4a4c54 : 0x6a6c74;
              img.px(UX + i, UY + j, c);
            }
        }
        // the front: floors of windows between the concrete bands
        const FY0 = Y1;
        const FY1 = (y + h + faceH) * S;
        for (let Yy = FY0; Yy < FY1; Yy++) for (let X = X0; X < X1; X++) img.px(X, Yy, Yy === FY0 ? scaleColor(wall, 0.6) : X === X1 - 1 ? scaleColor(wall, 0.8) : (Yy - FY0) % 6 === 0 ? scaleColor(wall, 0.9) : wall);
        for (let r = y + h + 2; r < y + h + faceH - 1; r += 2) windowsRow(x + 2, x + w - 2, r, litP, 2, opt.cool);
        for (const s of signs) {
          // a vertical neon sign: a column of characters in its lit frame
          const SX = s.x * S - 1;
          const SY = (y + h + 1) * S;
          for (let j = 0; j < s.h * S; j++) {
            img.px(SX, SY + j, 0x14101a);
            for (let i = 1; i < 5; i++) img.px(SX + i, SY + j, 0x14101a);
            glowPx(SX, SY + j, s.c, 0.9);
            glowPx(SX + 5, SY + j, s.c, 0.9);
          }
          for (let k = 0; k + 4 < s.h * S; k += 5) glyph(SX + 1, SY + 1 + k, 4, k % 10 ? 0xffffff : s.c, orr);
          pool(s.x + 0.5, y + h + faceH + 2, 9, s.c, 0.35);
        }
        if (board) {
          // rooftop billboard: a frame of chasing bulbs, the picture, a line of characters
          const BX = (x + Math.floor((w - board.w) / 2)) * S;
          const BY = (y + 2) * S;
          const BW = board.w * S;
          for (let j = 0; j < 16; j++) for (let i = 0; i < BW; i++) img.px(BX + i, BY + j, 0x14101a);
          for (let i = 0; i < BW; i += 2) {
            glowPx(BX + i, BY, board.c);
            glowPx(BX + BW - 1 - i, BY + 15, board.c);
          }
          for (let j = 0; j < 16; j += 2) {
            glowPx(BX, BY + j, board.c);
            glowPx(BX + BW - 1, BY + j, board.c);
          }
          const pc = orr.pick(NEON);
          for (let j = 4; j < 12; j++) for (let i = 3; i < 11; i++) if (Math.hypot(i - 7, j - 8) < 4) glowPx(BX + i, BY + j, (i + j) % 3 ? pc : 0xffffff, 0.9);
          for (let k = 0; k * 5 + 18 < BW - 3; k++) glyph(BX + 14 + k * 5, BY + 4, 4, 0xffffff, orr);
          for (let i = 14; i < BW - 3; i += 2) glowPx(BX + i, BY + 11, board.c, 0.7);
          pool(x + Math.floor((w - board.w) / 2) + board.w / 2, y + 5, board.w * 0.7, board.c, 0.3);
        }
      },
    });
    reserveRect(x - 1, y - 1, w + 2, h + faceH + 2);
  };

  // ------------------------------------------------------------ helpers: trees
  /** The pixels of a Todo fir seen from above: tiers of branches one over another, each a ring of drooping
   * sprays darker underneath, the needles in fine flecks, snow lying along the top of every tier. */
  const firPixels = (CX, CY, R, seed) => {
    const fr = rng(seed);
    const out = new Map();
    const tiers = 4;
    for (let t = 0; t < tiers; t++) {
      const rt = R * (1 - t * 0.22);
      const oy = -t * R * 0.13;
      const sprays = 11 + Math.floor(fr() * 5);
      const ph = fr() * 6.28;
      for (let j = -Math.ceil(rt * 1.1); j <= rt * 1.1; j++)
        for (let i = -Math.ceil(rt * 1.1); i <= rt * 1.1; i++) {
          const a = Math.atan2(j, i);
          const spray = 0.8 + 0.2 * Math.cos(sprays * a + ph) + (hashPx(Math.round(a * 20), t, seed & 255) - 0.5) * 0.12;
          const d = Math.hypot(i, j) / (rt * spray);
          if (d > 1) continue;
          const lit = (-i - j * 1.1) / (rt * 1.6) + 0.5;
          const X = Math.round(CX + i);
          const Yy = Math.round(CY + oy + j);
          let c = rampColor(C.fir, Math.max(0, Math.min(1, lit * 0.8 + (1 - d) * 0.25 + t * 0.06 + (hashPx(X, Yy, 44) - 0.5) * 0.3)), X, Yy);
          if (d > 0.88) c = scaleColor(c, 0.75); // (the shaded underside of the tier's edge)
          // snow along the top of the tier: on its lit side, in clumps, not right out at the tips
          const snowy = d > 0.3 && d < 0.9 && lit > 0.42 && fbm(X * 0.45, Yy * 0.45, { seed: seed & 255, scale: 2.2 }) > 0.42 - t * 0.04;
          if (snowy) c = lit > 0.62 ? (hashPx(X, Yy, 45) < 0.1 ? 0xffffff : C.snow[3]) : C.snow[2];
          out.set(X * 65536 + Yy, { x: X, y: Yy, c });
        }
    }
    for (let j = -2; j <= 1; j++) for (let i = -1; i <= 1; i++) out.set(Math.round(CX + i) * 65536 + Math.round(CY - R * 0.45 + j), { x: Math.round(CX + i), y: Math.round(CY - R * 0.45 + j), c: j < 0 ? C.snow[3] : C.fir[1] });
    return [...out.values()];
  };
  /** A Todo fir under snow: the tiers drawn one over another, snow on them, its shadow on the ground. */
  const fir = (x, y, r) => {
    const seed = Math.floor(rand() * 1e9);
    const cx = Math.round(x);
    const cy = Math.round(y);
    const px = () => firPixels(cx * S + 1, cy * S + 1, r * S, seed);
    const off = Math.round((2 + r * 0.35) * S);
    objects.push({
      y: cy + r * 0.6,
      shadow: () => {
        for (const p of px()) img.tintPx(p.x + off, p.y + off + S, 0.6);
      },
      draw: () => {
        for (const p of px()) img.px(p.x, p.y, p.c);
      },
    });
  };
  /** Bare tree in winter (birch, elm, ginkgo): a trunk, branches forking and forking again into fine twigs,
   * a line of snow along the tops of the boughs; lights: the festival's illumination strung through them. */
  const bare = (x, y, r, lights = null) => {
    const tr = rng(Math.floor(rand() * 1e9));
    const cx = Math.round(x) * S + 1;
    const cy = Math.round(y) * S + 1;
    const segs = [];
    const grow = (x0, y0, a, len, depth) => {
      const x1 = x0 + Math.cos(a) * len;
      const y1 = y0 + Math.sin(a) * len * 0.8;
      segs.push([x0, y0, x1, y1, depth]);
      if (depth >= 3) return;
      for (let i = 0; i < 2; i++) grow(x1, y1, a + (i ? 1 : -1) * (0.25 + tr() * 0.45), len * (0.58 + tr() * 0.18), depth + 1);
    };
    const n = 4 + Math.floor(tr() * 3);
    for (let i = 0; i < n; i++) grow(cx, cy, (i / n) * Math.PI * 2 + tr() * 0.6, r * S * 0.4, 0);
    const pts = [];
    for (const [x0, y0, x1, y1, d] of segs) {
      const k = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
      for (let i = 0; i <= k; i++) pts.push([Math.round(x0 + ((x1 - x0) * i) / k), Math.round(y0 + ((y1 - y0) * i) / k), d]);
    }
    objects.push({
      y: Math.round(y) + 1,
      shadow: () => {
        for (const [tx, ty] of pts) img.tintPx(tx + 7, ty + 9, 0.74);
      },
      draw: () => {
        for (const [tx, ty, d] of pts) {
          if (d === 3) img.px(tx, ty, C.twigTip, 0.75);
          else img.px(tx, ty, d < 1 ? 0x4a3c44 : C.twig);
          if (d < 1) img.px(tx + 1, ty, 0x3a2e36);
          if (d < 2 && hashPx(tx, ty, 41) < 0.5) img.px(tx, ty - 1, C.snow[3]); // (snow along the bough)
        }
        img.discPx(cx + 0.5, cy + 0.5, 1.6, 0xd8d2d4);
        if (lights)
          for (const [tx, ty, d] of pts)
            if (d >= 2 && hashPx(tx, ty, 42) < 0.35) {
              glowPx(tx, ty, tr() < 0.75 ? lights : 0xffffff);
              if (hashPx(ty, tx, 43) < 0.3) glowPx(tx + 1, ty, lights, 0.5);
            }
        if (lights) pool(Math.round(x), Math.round(y), r + 4, lights, 0.22);
      },
    });
  };
  /** A snowman: two balls of rolled snow, coal eyes, a carrot nose, a bucket for a hat, a scarf, stick arms. */
  const snowman = (x, y) => {
    const X = x * S + 1;
    const Yy = y * S + 1;
    objects.push({
      y: y + 3,
      shadow: () => {
        for (let j = -7; j <= 7; j++) for (let i = -7; i <= 7; i++) if (i * i + j * j <= 45) img.tintPx(X + i + 6, Yy + j + 6, 0.6);
      },
      draw: () => {
        for (let j = -8; j <= 8; j++) for (let i = -8; i <= 8; i++) if (i * i + j * j <= 64) img.px(X + i, Yy + j, i + j < -4 ? 0xffffff : i + j > 6 ? C.snow[1] : C.snow[3]);
        for (let j = -5; j <= 5; j++) for (let i = -5; i <= 5; i++) if (i * i + j * j <= 25) img.px(X + i, Yy - 9 + j, i + j < -3 ? 0xffffff : i + j > 4 ? C.snow[2] : C.snow[3]);
        for (const i of [-2, 2]) img.px(X + i, Yy - 10, 0x1a1418);
        img.px(X, Yy - 9, 0xf07a20);
        img.px(X + 1, Yy - 9, 0xe86a10);
        for (let i = -3; i <= 3; i++) for (let j = -16; j < -13; j++) img.px(X + i, Yy + j, j === -16 ? 0x6a8ad8 : 0x3a6ad0);
        for (let i = -5; i <= 5; i++) img.px(X + i, Yy - 4, 0xe8343a);
        img.px(X + 4, Yy - 3, 0xe8343a);
        img.px(X + 4, Yy - 2, 0xc82a30);
        for (const s of [-1, 1]) for (let k = 0; k < 5; k++) img.px(X + s * (8 + k), Yy - 3 - Math.floor(k / 2), 0x4a3424);
      },
    });
  };
  /** Kamakura: a snow hut, its dome shaded, the doorway glowing from the candle inside, a straw mat at the door. */
  const kamakura = (x, y) => {
    const X = x * S + 1;
    const Yy = y * S + 1;
    objects.push({
      y: y + 6,
      shadow: () => {
        for (let j = -15; j <= 15; j++) for (let i = -15; i <= 15; i++) if (i * i + j * j <= 225) img.tintPx(X + i + 9, Yy + j + 9, 0.55);
      },
      draw: () => {
        for (let j = -16; j <= 16; j++)
          for (let i = -16; i <= 16; i++) {
            const d = Math.hypot(i, j);
            if (d > 15.6) continue;
            const lit = (-i - j) / 22 + 0.5 - d / 40;
            img.px(X + i, Yy + j, d > 14.6 ? C.snow[1] : rampColor(C.snow, Math.max(0.1, Math.min(1, lit + 0.3)), X + i, Yy + j));
          }
        for (let j = 0; j < 9; j++)
          for (let i = -4; i <= 4; i++) {
            if (j < 2 && Math.abs(i) > 2 + j) continue;
            glowPx(X + i, Yy + 8 + j, j < 3 ? 0x2a1a14 : mix(0xffa040, 0xffe0a0, (j - 3) / 6), j < 3 ? 1 : 0.9);
          }
        for (let i = -4; i <= 4; i++) img.px(X + i, Yy + 17, (i & 1) ? 0xc8a868 : 0xa8884e);
        glow(x, y + 4, 0xffa040, 0.5);
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
      const pr = rng(x * 977 + y);
      const coat = rand() < 0.35 ? rand.pick([0xd04040, 0x3a6ad0, 0xe8c040, 0xe8e8f0]) : pr.pick([0x3a3a4a, 0x2a2a34, 0x4a3a2a, 0x2a3040]);
      personPx(x * S + Math.floor(pr() * S), y * S + Math.floor(pr() * S), pr, { coat });
    }
  };

  // ------------------------------------------------------------ A. Ōkurayama ski jump (sunset)
  {
    const cx = 90;
    // outrun / stadium: packed snow groomed in corduroy, horseshoe stands in tiers full of fans, the judges'
    // tower and the lodge
    img.fine(44, Y(240), 92, 130, (FXr, FYr, x, y) => {
      const u = L - y;
      const e = ((x - cx) / 46) ** 2 + ((u - 175) / 66) ** 2;
      if (e >= 1) return null;
      if (e > 0.9) return C.snow[1];
      return FYr % 3 === 0 ? C.snow[2] : hashPx(FXr, FYr, 73) < 0.01 ? 0xffffff : C.snow[3];
    });
    img.fine(36, Y(136), 108, 24, (FXr, FYr, x, y) => {
      const u = L - y;
      const e = ((x - cx) / 54) ** 2 + ((u - 175) / 66) ** 2;
      if (e < 1 || e >= 1.32) return null;
      // tiers: a step (lit edge, riser in shadow), the benches, the fans on them in their coats and hats
      const tier = Math.floor((e - 1) * 30);
      const inTier = ((e - 1) * 30) % 1;
      if (inTier < 0.18) return 0x9aa8c8;
      if (inTier > 0.85) return 0x3a4a6a;
      const h = hashPx(FXr >> 1, FYr, 74 + tier);
      if (h < 0.42) return [0xd83a3a, 0x3a6ad0, 0xe8c040, 0xe8e8f0, 0x2a2a34, 0x3aa060, 0xf07ab0][Math.floor(h * 100) % 7];
      return tier % 2 ? 0x5a6a88 : 0x6a7a98;
    });
    crowd(44, Y(150), 92, 30, 70);
    reserveRect(36, Y(240), 108, 130);
    // the access road up to the outrun between the stands, the car park beside it
    vRoad(cx, 5, 0, 110);
    img.fine(cx + 5, Y(83), 150 - cx - 5, 44, (FXr, FYr, x, y) => {
      const u = L - y;
      const e = Math.min(u - 40, 83 - u, (150 - x) * 1);
      if (e < 0.7) return C.bank;
      if ((Math.round(x - cx - 5) % 5 === 0) && FXr % S === 0 && (u < 60 || u > 72)) return 0xc8ccd4; // (the bays, marked in the snow)
      return rampColor(C.packed, fbm(FXr / S, FYr / S, { seed: 36, scale: 4, octaves: 2 }) + (hashPx(FXr, FYr, 35) - 0.5) * 0.2, FXr, FYr);
    });
    reserveRect(cx + 4, Y(86), 152 - cx - 4, 48);
    {
      const pr = rng(4471);
      for (const u of [76, 56])
        for (let x = 106; x < 146; x += 5) {
          if (pr() < 0.25) continue;
          const c = pr.pick([0x2a2a30, 0xe0e0e8, 0x8a2a2a, 0x3a5a9a, 0xe8c030]);
          // a parked car seen from above: bonnet, windscreen, roof heaped with snow, rear window, lights
          const X = x * S;
          const Yy = Y(u) * S;
          for (let j = 0; j < 15; j++) for (let i = 0; i < 9; i++) img.px(X + i + 2, Yy + j + 2, 0x101018, 0.35);
          for (let j = 0; j < 15; j++)
            for (let i = 0; i < 9; i++) {
              if ((i === 0 || i === 8) && (j === 0 || j === 14)) continue;
              let col = i === 0 ? scaleColor(c, 1.15) : i === 8 ? scaleColor(c, 0.75) : c;
              if (j >= 3 && j <= 4) col = 0x3a4a5e;
              if (j >= 5 && j <= 10) col = i > 0 && i < 8 ? (hashPx(X + i, Yy + j, 75) < 0.85 ? C.snow[3] : C.snow[2]) : col;
              if (j === 11) col = 0x3a4a5e;
              img.px(X + i, Yy + j, col);
            }
          img.px(X + 1, Yy + 14, 0xff3020);
          img.px(X + 7, Yy + 14, 0xff3020);
        }
    }
    office(14, Y(205), 24, 16, 6, { wall: 0x8a6a4a, lit: 0.8 });
    // landing hill: groomed in corduroy, the fir-branch markers down both edges, the coloured distance lines
    // (green the hill size, red the K point, blue every few metres), boards with the metres on them
    img.fine(cx - 29, Y(521), 58, 287, (FXr, FYr, x, y) => {
      const u = L - y;
      const t = (u - 235) / 287;
      const hw = 28 - t * 13;
      const a = Math.abs(x - cx);
      if (a > hw) return null;
      let c = FYr % 3 === 0 ? C.snow[2] : C.snow[3];
      if (a > hw - 1.5) c = (Math.floor(u) % 4 < 2) ? ((FXr + FYr) % 3 ? 0x2a5a3a : 0x1e4a2c) : 0x3a6a4a; // (fir branches)
      else if (Math.abs(u - 300.5) < 0.9) c = 0xd83a2a;
      else if (Math.abs(u - 284.3) < 0.5) c = 0x3ab05a;
      else if (Math.floor(u) % 22 === 0 && a > hw - 5) c = 0x3a6ad0;
      if (t > 0.75 && hashPx(FXr, FYr, 76) < (t - 0.75) * 2) c = scaleColor(c, 0.88); // (the hill falls away to the knoll)
      return c;
    });
    for (let u = 250; u < 520; u += 22) {
      const t = (u - 235) / 287;
      const hw = 28 - t * 13;
      for (const s of [-1, 1]) {
        const BX = Math.round((cx + s * (hw + 3)) * S) - 4;
        const BY = Y(u) * S - 3;
        for (let j = 0; j < 7; j++) for (let i = 0; i < 9; i++) img.px(BX + i, BY + j, j === 0 || j === 6 || i === 0 || i === 8 ? 0x2a3a6a : 0xf4f4f8);
        glyph(BX + 2, BY + 2, 3, 0x2a3a6a, rng(u * 3 + s), (gx, gy, gc) => img.px(gx, gy, gc));
      }
    }
    reserveRect(cx - 32, Y(526), 64, 292);
    // take-off table and in-run on its steel truss: the iced ski tracks, the rails, lamps along both sides
    img.fine(cx - 6, Y(523), 12, 2, (FXr) => ((FXr - (cx - 6) * S) % 4 ? 0x5a5e6a : 0x7a7e8a));
    objects.push({
      y: Y(522),
      shadow: () => shadowRect(cx + 5, Y(900), 6, 900 - 522, 0.55),
      draw: () => {
        img.fine(cx - 5, Y(891), 10, 892 - 522, (FXr, FYr) => {
          const i = FXr - (cx - 5) * S;
          if (i < 3 || i > 26) return (FYr % 18 < 2) ? 0x9aa0ae : i === 0 || i === 29 ? 0x3a3e4a : 0x6a6e7a; // (the truss, its cross members)
          if (i < 6 || i > 23) return FYr % 2 ? C.snow[3] : C.snow[2];
          if (i === 10 || i === 11 || i === 18 || i === 19) return i % 2 ? 0x9ab4d0 : 0x7a96b8; // (the iced tracks)
          return hashPx(FXr, FYr, 77) < 0.05 ? 0xffffff : C.snow[3];
        });
        for (let u = 522; u < 892; u += 14) glow(u % 28 === 0 ? cx - 5 : cx + 4, Y(u), 0xfff0c8);
      },
    });
    for (let u = 530; u < 892; u += 28) pool(cx, Y(u), 8, C.lamp, 0.28);
    reserveRect(cx - 9, Y(896), 20, 376);
    office(cx - 14, Y(940), 28, 16, 8, { wall: 0x6a6e7a, lit: 0.9 });
    // chairlift: the two cables, pylons with their cross-arms and sheave wheels, the chairs (live)
    const lift = (t) => [140 - t * 20, 200 + t * 735];
    objects.push({
      y: Y(200),
      shadow: () => {},
      draw: () => {
        for (let k = 0; k <= 735 * S; k++) {
          const [x, u] = lift(k / (735 * S));
          img.px(Math.round((x - 2) * S), Math.round(Y(u) * S), 0x2a2c38);
          img.px(Math.round((x + 2) * S) + 2, Math.round(Y(u) * S), 0x2a2c38);
        }
        for (let k = 0; k <= 735; k += 92) {
          const [x, u] = lift(k / 735);
          const PX = Math.round(x * S);
          const PY = Y(u) * S;
          for (let i = -8; i <= 10; i++) img.px(PX + i, PY, 0x5a5c68);
          for (let i = -8; i <= 10; i++) img.px(PX + i, PY - 1, 0x7a7c88);
          for (const WX of [PX - 6, PX + 8]) {
            img.px(WX, PY + 1, 0x3a3c48);
            img.px(WX + 1, PY + 1, 0x3a3c48);
          }
          for (let j = -2; j < 6; j++) img.px(PX, PY + j, 0x4a4c58);
          for (let j = 0; j < 14; j++) img.tintPx(PX + 9 + Math.floor(j * 0.5), PY + 12 + j, 0.55);
        }
      },
    });
    for (let k = 0; k <= 735; k += 4) {
      const [x, u] = lift(k / 735);
      reserveRect(x - 3, Y(u) - 1, 7, 3);
    }
    // live: the chairs going up one cable and down the other, skiers on some, their shadows on the snow
    {
      const chair = (rider) => {
        const r = new HiCanvas(3, 4);
        for (let i = 1; i < 8; i++) r.px(i, 3, 0x24242c);
        r.px(4, 0, 0x3a3a44);
        r.px(4, 1, 0x3a3a44);
        r.px(4, 2, 0x3a3a44);
        if (rider) {
          r.px(3, 4, 0xd83a3a);
          r.px(4, 4, 0xd83a3a);
          r.px(3, 5, rider);
          r.px(4, 5, rider);
          r.px(6, 4, 0x2a2a34);
          r.px(6, 5, 0x3a6ad0);
        }
        for (let i = 3; i < 8; i++) r.px(i, 10, 0x101018, 0.35);
        return frameAt(r, 560);
      };
      const cfs = [chair(0), chair(0x2a2a34), chair(0xe8e8f0)];
      const [x0, u0] = lift(0);
      const [x1, u1] = lift(1);
      kit.path([[x0 + 3, u0 - 1], [x1 + 3, u1 - 1]], cfs, { sp: 7, n: 33, gap: 22, turn: 'none', s0: 0 });
      kit.path([[x1 - 1, u1 - 1], [x0 - 1, u0 - 1]], [cfs[0]], { sp: 7, n: 33, gap: 22, turn: 'none', s0: 0.5 });
    }
    // live: a jumper crouched down the in-run, off the table and gliding down to the landing in the V
    {
      const jumper = new HiCanvas(5, 6);
      for (const [i, j, c] of [[7, 2, 0xe84a3a], [7, 3, 0xe84a3a], [6, 4, 0x2a3a8a], [7, 4, 0x2a3a8a], [8, 4, 0x2a3a8a], [7, 5, 0x2a3a8a], [7, 6, 0x1a2a6a], [5, 6, 0x1a2a6a], [9, 6, 0x1a2a6a], [7, 7, 0x2a3a8a], [6, 8, 0x3a3a48], [8, 8, 0x3a3a48]]) jumper.px(i, j, c);
      for (let k = 0; k < 8; k++) {
        jumper.px(6 - Math.floor(k * 0.6), 9 + k, 0xe8e8f0); // (the skis spread in a V)
        jumper.px(8 + Math.floor(k * 0.6), 9 + k, 0xe8e8f0);
      }
      jumper.px(9, 16, 0x101018, 0.3);
      kit.path([[cx, 888], [cx, 524], [cx, 300], [cx, 200], [cx, 120]], [frameAt(jumper, 500)], { sp: 30, turn: 'none' });
      // a snowcat grooming the landing hill up one side and back down, leaving corduroy behind it
      const cat = (up) => {
        const r = new HiCanvas(7, 10);
        for (let j = 3; j < 27; j++) for (let i = 0; i < 21; i++) r.px(i, j, i < 3 || i > 17 ? ((j % 3) ? 0x2a2a30 : 0x4a4a52) : 0xe0602a);
        for (let j = up ? 6 : 15; j < (up ? 12 : 21); j++) for (let i = 5; i < 16; i++) r.px(i, j, j % 2 ? 0x3a4a6a : 0x5a6a8a);
        for (let i = 0; i < 21; i++) for (let j = 0; j < 3; j++) r.px(i, up ? j : 27 + j, j === 0 ? 0xe8ecf4 : 0xb8bcc4); // (the blade)
        for (let i = 3; i < 18; i++) r.px(i, up ? 28 : 1, (i % 2) ? 0x6a6a72 : 0x8a8a92); // (the tiller)
        r.px(10, up ? 4 : 25, 0xffa020);
        return frameAt(r, 380, [[3, up ? 1 : 8, 0xfff4d0, 0.6]]);
      };
      const cord = [0, 1, 2].map((k) => {
        const r = new HiCanvas(7, 1);
        for (let x = 0; x < 21; x += 3) {
          r.px(x, 1, 0xf4f6fa, 0.8 - k * 0.2);
          r.px(x + 1, 1, 0xc8d0e0, 0.6 - k * 0.15);
        }
        return frameAt(r, 380);
      });
      kit.path([[cx - 16, 246], [cx - 9, 500]], [cat(true)], { sp: 4, mode: 'pp', hold: 3, turn: 'none', fu: [cat(true)], fd: [cat(false)], wake: { f: cord, every: 2, life: 5 } });
      // the fans in the stands waving their flags
      const flag = [0xe8343a, 0xf0f0f0, 0x2a5aa8, 0xf0c020].map((c) => [0, 1, 0, 1].map((f) => {
        const r = new HiCanvas(3, 4);
        for (let j = 1; j < 11; j++) r.px(1, j, 0x6a5a4a);
        for (let j = 0; j < 6; j++) for (let i = 2; i < 8; i++) r.px(i, j + (f ? 0 : 2) + Math.round(Math.sin(i * 0.8 + f * 2) * 0.8), i === 2 ? scaleColor(c, 0.8) : c);
        return frameAt(r, 150);
      }));
      for (const fl of flag) kit.spot([[46, 152, 88, 26]], fl, { rate: 1.6, fps: 5 });
    }
    // the road up from the suburb to the lodge at the top of the jump, a few houses along it at the forest edge
    vRoad(cx, 5, 941, SUBURB[0] - 10);
    tinHouse(62, Y(1060), 16, 12, { lit: 0.8, chimney: true });
    tinHouse(102, Y(1040), 18, 12, { lit: 0.8 });
    tank(48, Y(1052));
  }

  // ------------------------------------------------------------ streets (B, C, D)
  const lastBelowRiver = Math.max(...STREETS, ...plowRoads.filter((u) => u < RIVER[0]));
  for (const [x, hw] of AVENUES) vRoad(x, hw, SUBURB[0] - 10, x === 90 ? CENTER[0] : x === 30 ? RIVER[0] : lastBelowRiver);
  hRoad(SUBURB[0] - 10, 5); // (along the bottom of the suburb, where the avenues start)
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

  // live traffic, keeping left as in Japan: cars driving up Ekimae-dōri's west lane (tail lights only, so nothing
  // bright heads down the screen: the east lane is a queue standing still) and both ways along the cross streets
  // the snowplows don't use, all at one speed and started so that none ever drives through another or the tram
  {
    // (a car from above: bonnet, windscreen, a roof with snow on it, the rear window; lamps lit)
    const carBody = (r, w, h, c, along) => {
      for (let j = 0; j < h; j++)
        for (let i = 0; i < w; i++) {
          if ((i === 0 || i === w - 1) && (j === 0 || j === h - 1)) continue;
          const a = along === 'x' ? i : h - 1 - j;
          const n = along === 'x' ? w : h;
          let col = (along === 'x' ? j : i) === 0 ? scaleColor(c, 1.18) : (along === 'x' ? j === h - 1 : i === w - 1) ? scaleColor(c, 0.72) : c;
          if (a >= n * 0.62 && a < n * 0.72) col = 0x2a3a50;
          else if (a >= n * 0.25 && a < n * 0.62) col = hashPx(i, j, n) < 0.75 ? C.snow[3] : C.snow[2];
          else if (a >= n * 0.18 && a < n * 0.25) col = 0x3a4a5e;
          r.px(i, j, col);
        }
    };
    const carUp = (c) => {
      const r = new HiCanvas(3, 5);
      carBody(r, 9, 15, c, 'y');
      return frameAt(r, 2800, [[0, 4, 0xff3020, 0.7], [2, 4, 0xff3020, 0.7]]);
    };
    const carSide = (c) => {
      const r = new HiCanvas(5, 3);
      carBody(r, 15, 9, c, 'x');
      return frameAt(r, 2800, [[4, 0, 0xfff4d0, 0.5], [4, 2, 0xfff4d0, 0.5], [0, 0, 0xff3020, 0.55], [0, 2, 0xff3020, 0.55]]);
    };
    const SP = 12;
    const cols = [0x2a2a30, 0xe0e0e8, 0x8a2a2a, 0xe8c030, 0x3a5a9a];
    // up the west lane from the street at the bottom of the centre (turning left off it), over the river and
    // left again along the park's street, out of sight at the edge
    const up = { pts: [[-8, 2242], [85, 2242], [85, 3846], [-8, 3846]], sp: SP, n: 5, gap: 358, size: [5, 3] };
    const tram = { pts: [[-30, TRAM_U], [210, TRAM_U]], sp: 10, mode: 'pp', hold: 4, s0: 0.3, size: [26, 6] };
    const streets = STREETS.filter((s) => s > CENTER[0] && s !== TRAM_U && !plowRoads.some((p) => Math.abs(p - s) < 20));
    const sides = streets.flatMap((s) => [
      { pts: [[-8, s + 2], [188, s + 2]], sp: SP, size: [5, 3] }, // eastbound on the north side
      { pts: [[188, s - 2], [-8, s - 2]], sp: SP, size: [5, 3] },
    ]);
    const onScreen = (u) => [Math.max(0, (u - anchor - 10) / V), Math.max(0, (u + 440 - anchor) / V)];
    const [, upS0, ...sideS0] = planTraffic([tram, up, ...sides], onScreen);
    kit.path(up.pts, cols.map(carSide), { sp: SP, n: up.n, gap: up.gap, turn: 'flip', fu: cols.map(carUp), cars: 1, s0: upS0 });
    sides.forEach((r, k) => kit.path(r.pts, [carSide(cols[(k + 1) % cols.length])], { sp: SP, turn: 'flip', cars: 1, s0: sideS0[k] }));
  }
  // the streetcar along a cross street in Susukino: rails set in the road, a cream-and-green tram running to
  // and fro, its windows lit (live)
  {
    const ty = Y(TRAM_U);
    // the rails: steel heads polished bright by the wheels, the grooves beside them packed with ice, the
    // overhead wire on its span poles
    for (let X = 0; X < W * S; X++)
      for (const dy of [-2, 2]) {
        img.px(X, ty * S + dy * S, 0x9a9aa4);
        img.px(X, ty * S + dy * S + 1, 0x4a4a52);
        img.px(X, ty * S + dy * S - 1, 0xb8c0d0);
      }
    for (let X = 0; X < W * S; X++) img.px(X, ty * S - 8, 0x2a2a34, 0.7);
    for (let x = 6; x < W; x += 36) for (let j = -10; j <= -6; j++) img.px(x * S, ty * S + j, 0x3a3a44);
    // the streetcar: cream and green, a band of lit windows, the doors, the pantograph and the roof units
    const tram = new HiCanvas(26, 6);
    for (let j = 0; j < 18; j++)
      for (let i = 0; i < 78; i++) {
        if ((i < 2 || i > 75) && (j < 2 || j > 15)) continue;
        let c = j < 2 ? 0xd8d4c4 : j > 15 ? 0x8a8678 : j > 6 && j < 11 ? 0x2a7a4a : 0xe8e4d0;
        if (j === 6 || j === 11) c = 0x1e5a36;
        if ((i - 5) % 9 < 6 && i > 4 && i < 74 && (j === 3 || j === 4 || j === 13 || j === 14)) c = 0x3a4a5a;
        if (i === 26 || i === 27 || i === 50 || i === 51) c = 0x5a5a62; // (the doors)
        tram.px(i, j, c);
      }
    for (let i = 33; i < 45; i++) tram.px(i, 1, 0x3a3a40); // the pantograph
    for (let i = 36; i < 42; i++) tram.px(i, 0, 0x2a2a30);
    for (let i = 12; i < 22; i++) for (let j = 2; j < 5; j++) tram.px(i, j, 0xb8b4a4);
    const lit = [];
    for (let x = 2; x < 24; x += 3) lit.push([x, 1, C.warm, 0.85], [x, 4, C.warm, 0.85]);
    kit.path([[-30, TRAM_U], [210, TRAM_U]], [frameAt(tram, TRAM_U, lit)], { sp: 10, mode: 'pp', hold: 4, turn: 'flip', s0: 0.3 });
  }
  // the queue standing in the southbound lane through the centre and Susukino, headlights on
  for (let u = CENTER[0] + 20; u < RIVER[0] - 12; u += 9) {
    if (rand() < 0.45) continue;
    if ([...STREETS, ...plowRoads].some((s) => Math.abs(u - s) < 12)) continue;
    const y = Y(u);
    const x = 94 + Math.floor(rand() * 2); // (the southbound queue in the east lane: the west lane is moving)
    const c = rand.pick([0x2a2a30, 0xe0e0e8, 0x8a2a2a, 0xe8c030]);
    const X = (x - 1) * S;
    const Yy = (y - 2) * S;
    for (let j = 0; j < 15; j++)
      for (let i = 0; i < 9; i++) {
        if ((i === 0 || i === 8) && (j === 0 || j === 14)) continue;
        let col = i === 0 ? scaleColor(c, 1.18) : i === 8 ? scaleColor(c, 0.72) : c;
        if (j >= 9 && j <= 10) col = 0x2a3a50; // (the windscreen: facing down the screen)
        else if (j >= 3 && j < 9) col = hashPx(X + i, Yy + j, 78) < 0.75 ? C.snow[3] : C.snow[2];
        else if (j === 2) col = 0x3a4a5e;
        img.px(X + i, Yy + j, col);
      }
    for (const i of [1, 7]) glowPx(X + i, Yy + 14, 0xffffff);
    pool(x, y + 6, 6, 0xfff4d0, 0.4);
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
        // the drill hall: a red tin roof in standing seams, snow lying on it in drifts, the ridge, dormers
        const X0 = x * S;
        const X1 = (x + 28) * S;
        img.fine(x, y + 6, 28, 14, (FXr, FYr) => {
          const north = FYr < (y + 13) * S;
          const seam = (FXr - X0) % 4;
          let c = north ? 0x9a4232 : 0x823426;
          c = seam === 0 ? scaleColor(c, 0.75) : seam === 1 ? scaleColor(c, 1.12) : c;
          const drift = fbm(FXr * 0.3, FYr * 0.2, { seed: 91, scale: 3 }) + (FYr - (y + 6) * S < 3 ? 0.2 : 0);
          if (drift > 0.5) c = snowPx(FXr, FYr, north ? 0.72 : 0.55, 0.3, 91);
          if (FXr === X0 || FXr === X1 - 1) c = scaleColor(c, 0.8);
          return c;
        });
        for (let FXr = X0; FXr < X1; FXr++) {
          img.px(FXr, (y + 13) * S, 0x5a2218);
          img.px(FXr, (y + 13) * S - 1, C.snow[3]);
        }
        for (const DX of [x + 15, x + 21]) {
          // a dormer window on the front slope, lit
          const DXf = DX * S;
          const DYf = (y + 15) * S;
          for (let j = 0; j < 8; j++)
            for (let i = 0; i < 9; i++) {
              const c = j < 3 ? (Math.abs(i - 4) <= j + 1 ? 0x9a4232 : null) : i === 0 || i === 8 || j === 7 ? 0xe8e4dc : i === 4 ? 0xb8b4ac : null;
              if (c !== null) img.px(DXf + i, DYf + j, c);
            }
          for (let j = 3; j < 7; j++) for (let i = 1; i < 8; i++) if (i !== 4) glowPx(DXf + i, DYf + j, C.warm, 0.9);
          for (let i = 0; i < 9; i++) img.px(DXf + i, DYf - 1, C.snow[3]);
        }
        // the front: white clapboard in fine courses, tall sash windows lit warm, the porch
        img.fine(x + 1, y + 20, 26, 6, (FXr, FYr) => {
          const fy = FYr - (y + 20) * S;
          if (fy < 2) return 0x4a3a34;
          const k = (FXr - (x + 1) * S) % 9;
          if (k > 2 && k < 7 && fy > 3 && fy < 15) return null;
          return fy % 3 === 0 ? 0xc8c4bc : 0xe8e4dc;
        });
        for (let xx = x + 1; xx < x + 26; xx += 3) {
          const WX = xx * S + 3;
          for (let j = 4; j < 15; j++) for (let i = 0; i < 4; i++) glowPx(WX + i, (y + 20) * S + j, j === 9 ? 0xb8b4ac : i === 1 && j < 9 ? 0xf8d890 : C.warm, 0.95);
        }
        // the tower: a red pyramid roof with its little belfry and weathervane over the clapboard tower, the
        // clock on its face (white dial, black hands, the ring of numerals)
        const TX = (x + 2) * S;
        const TY = y * S;
        for (let j = 0; j < 36; j++) for (let i = 0; i < 27; i++) img.px(TX + i, TY + j, j % 3 === 0 ? 0xc8c4bc : i === 0 ? 0xf4f0ea : i === 26 ? 0xb8b4ac : 0xe8e4dc);
        for (let j = 0; j < 12; j++) {
          const hw = 3 + j * 1.2;
          for (let i = Math.round(13 - hw); i <= 13 + hw; i++) img.px(TX + i, TY - 6 + j, i < 13 ? 0xb84a3a : 0x8a3426);
        }
        for (let j = -12; j < -6; j++) for (let i = 10; i < 17; i++) img.px(TX + i, TY + j, j === -12 ? 0x8a3426 : (i % 2 ? 0x3a2a24 : 0xe8e4dc));
        for (let j = -18; j < -12; j++) img.px(TX + 13, TY + j, 0x2a2a30);
        for (let i = 10; i < 17; i++) img.px(TX + i, TY - 16, 0x2a2a30);
        const CX = TX + 13;
        const CY = TY + 22;
        img.discPx(CX + 0.5, CY + 0.5, 8.4, 0x2a2a30);
        img.discPx(CX + 0.5, CY + 0.5, 7.4, 0xf8f4ea);
        for (let k = 0; k < 12; k++) img.px(Math.round(CX + Math.cos((k / 12) * 6.283) * 6), Math.round(CY + Math.sin((k / 12) * 6.283) * 6), 0x2a2a30);
        for (let k = 0; k < 5; k++) img.px(CX, CY - k, 0x1a1a20);
        for (let k = 0; k < 4; k++) img.px(CX + k, CY + Math.floor(k / 2), 0x1a1a20);
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
        // the slate roofs (a mansard over each wing, snow on them, dormers, chimneys), the brick front with its
        // white-framed windows in two storeys, the octagonal tower and its copper dome with the red star
        const X0 = x * S;
        const X1 = (x + 34) * S;
        const ar = rng(2766);
        img.fine(x, y + 4, 34, 18, (FXr, FYr) => {
          const north = FYr < (y + 13) * S;
          let c = north ? C.slate[2] : C.slate[1];
          if ((FYr - (y + 4) * S) % 3 === 0) c = scaleColor(c, 0.85); // (the courses of slates)
          if ((FXr + Math.floor(FYr / 3) * 2) % 5 === 0) c = scaleColor(c, 0.92);
          if (fbm(FXr * 0.3, FYr * 0.3, { seed: 92, scale: 3 }) > 0.42) c = snowPx(FXr, FYr, north ? 0.72 : 0.55, 0.3, 92);
          if (FXr < X0 + 2 || FXr > X1 - 3) c = C.slate[0];
          return c;
        });
        for (let k = 0; k < 6; k++) {
          const DX = X0 + 8 + k * 16 + (k > 2 ? 12 : 0);
          const DY = (y + 15) * S;
          for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) img.px(DX + i, DY + j, j < 2 ? C.snow[3] : i === 0 || i === 6 ? 0xe8e4dc : 0x2a3444);
          for (let j = 3; j < 6; j++) for (let i = 2; i < 5; i++) if (ar() < 0.7) glowPx(DX + i, DY + j, C.warm, 0.85);
        }
        for (const CXc of [X0 + 18, X1 - 22]) for (let j = 0; j < 9; j++) for (let i = 0; i < 5; i++) img.px(CXc + i, (y + 5) * S + j, j < 2 ? C.snow[3] : i === 0 ? C.brick[2] : C.brick[0]);
        img.fine(x, y + 22, 34, 8, (FXr, FYr) => {
          const fy = FYr - (y + 22) * S;
          if (fy < 2) return 0x3a1a14;
          const row = Math.floor(fy / 2);
          return (FXr + (row % 2) * 2) % 4 === 0 || fy % 2 === 0 ? C.brick[0] : hashPx(FXr, FYr, 93) < 0.15 ? C.brick[2] : C.brick[1];
        });
        for (const r of [y + 24, y + 27])
          for (let xx = x + 2; xx < x + 33; xx += 3) {
            const lit = ar() < 0.6;
            const WX = xx * S - 1;
            const WY = r * S - 2;
            for (let j = 0; j < 7; j++)
              for (let i = 0; i < 5; i++) {
                if (i === 0 || i === 4 || j === 0 || j === 6) img.px(WX + i, WY + j, j === 0 ? 0xf8f4ea : 0xe8e0d0);
                else if (lit) glowPx(WX + i, WY + j, i === 2 || j === 3 ? 0xe0c080 : C.warm, 0.95);
                else img.px(WX + i, WY + j, i === 2 || j === 3 ? 0xd8d0c0 : 0x2a3444);
              }
          }
        // the tower: brick drum, white cornice, the octagonal copper dome gone green, a lantern, the red star
        const TX = (x + 17) * S + 1;
        const TY = (y + 9) * S;
        for (let j = -14; j <= 14; j++)
          for (let i = -14; i <= 14; i++) {
            const oct = Math.max(Math.abs(i), Math.abs(j), (Math.abs(i) + Math.abs(j)) * 0.72);
            if (oct > 14) continue;
            let c = oct > 12.8 ? 0xe8e4dc : oct > 11.5 ? C.brick[1] : i + j < -6 ? 0x6a9a8a : i + j < 4 ? 0x4e7a6e : 0x3a5e54;
            if (oct <= 11.5 && Math.abs(Math.abs(i) - Math.abs(j)) < 1) c = scaleColor(c, 0.82); // (the ribs of the dome)
            if (oct <= 11.5 && fbm((TX + i) * 0.4, (TY + j) * 0.4, { seed: 94, scale: 2 }) > 0.66) c = C.snow[3];
            img.px(TX + i, TY + j, c);
          }
        img.discPx(TX + 0.5, TY + 0.5, 3.5, 0xe8e4dc);
        img.discPx(TX + 0.5, TY + 0.5, 2.2, 0x4e7a6e);
        for (let j = -20; j < -14; j++) img.px(TX, TY + j, 0x3a3a40);
        for (const [i, j] of [[0, -23], [-1, -22], [0, -22], [1, -22], [-2, -21], [2, -21], [0, -21], [-1, -20], [1, -20]]) glowPx(TX + i, TY + j, 0xff3a2a);
        for (const SX of [X0 + 12, X1 - 13]) for (const [i, j] of [[0, -1], [-1, 0], [0, 0], [1, 0], [0, 1]]) img.px(SX + i, (y + 24) * S + j, 0xe02a2a);
        pool(x + 17, y + 34, 20, 0xffc890, 0.38);
      },
    });
    reserveRect(x - 2, y - 2, 38, 36);
    // frozen pond in the front garden
    const py = Y(2690);
    img.fine(x + 4, py - 10, 30, 20, (FXr, FYr, xx, yy) => {
      const e = ((xx - (x + 19)) / 15) ** 2 + ((yy - py) / 9) ** 2;
      if (e >= 1) return null;
      if (e > 0.82) return e > 0.92 ? C.snow[3] : 0x7a8aa0;
      if (Math.abs(fbm(FXr * 0.2, FYr * 0.2, { seed: 95, scale: 3 }) - 0.5) < 0.012) return 0xe8f4ff; // (cracks in the ice)
      return fbm(FXr / S, FYr / S, { seed: 96, scale: 5 }) > 0.62 ? C.snow[2] : rampColor(C.ice, 0.4 + fbm(FXr / S, FYr / S, { seed: 93, scale: 4 }) * 0.5, FXr, FYr);
    });
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
        img.fine(x0 + 5, top, x1 - x0 - 10, bot - top, (FXr, FYr, xx) => {
          if (Math.abs(xx - 122.5) < 1.5) return (FYr % 6) < 2 ? 0x8a9ab0 : (FXr % 3 ? 0x4a4248 : 0x5a5258); // (the covered alley's glass roof)
          const right = xx > 122.5;
          let c = (FYr - top * S) % 36 === 0 ? C.slate[0] : (FXr % 4 === 0) ? scaleColor(right ? C.slate[1] : C.slate[2], 0.85) : right ? C.slate[1] : C.slate[2];
          if (fbm(FXr * 0.3, FYr * 0.3, { seed: 94, scale: 3 }) > 0.45) c = snowPx(FXr, FYr, right ? 0.5 : 0.7, 0.3, 94);
          return c;
        });
        // stalls along both long sides: striped awnings in turn, the counters piled with the catch (red king
        // crabs with their legs out, hairy crabs, trays of orange sea urchin and red salmon roe, whole salmon,
        // melons in their boxes), each stall lit from inside, its keeper behind the counter
        const mr = rng(2772);
        for (const [ax, gx, dir] of [[x0 + 2, x0, -1], [x1 - 5, x1 - 2, 1]])
          for (let yy = top + 1, k = 0; yy < bot - 4; yy += 9, k++) {
            const col = stallC[(k + (dir > 0 ? 2 : 0)) % stallC.length];
            const AX = ax * S;
            const AY = yy * S;
            for (let j = 0; j < 24; j++) for (let i = 0; i < 9; i++) img.px(AX + i, AY + j, (Math.floor(j / 3) % 2) ? scaleColor(col, 0.8) : j % 3 === 0 ? 0xf4f0e6 : col);
            const GX = dir < 0 ? gx * S - 4 : gx * S;
            for (let j = 0; j < 24; j++) for (let i = 0; i < 7; i++) img.px(GX + i, AY + j, i === (dir < 0 ? 0 : 6) ? 0x3a2a20 : 0xb8c8d8); // (the ice the catch lies on)
            for (let g = 0; g < 4; g++) {
              const kind = mr();
              const GY = AY + 2 + g * 6;
              if (kind < 0.3) {
                for (let i = 1; i < 6; i++) img.px(GX + i, GY + 2, 0xd83a2a);
                for (const [i, j] of [[0, 0], [6, 0], [0, 4], [6, 4], [1, 1], [5, 1], [1, 3], [5, 3]]) img.px(GX + i, GY + j, 0xc02a1a);
                img.px(GX + 3, GY + 1, 0xf05a3a);
              } else if (kind < 0.5) for (let i = 1; i < 6; i++) for (let j = 0; j < 4; j++) img.px(GX + i, GY + j, (i + j) % 2 ? 0xf0a030 : 0xe08a20);
              else if (kind < 0.65) for (let i = 1; i < 6; i++) for (let j = 0; j < 4; j++) img.px(GX + i, GY + j, (i * 3 + j) % 4 ? 0xe83a2a : 0xff7a5a);
              else if (kind < 0.85) {
                for (let i = 0; i < 7; i++) img.px(GX + i, GY + 2, i > 5 ? 0x8a8a92 : 0xf08a5a);
                for (let i = 1; i < 5; i++) img.px(GX + i, GY + 1, 0xc8ccd4);
              } else {
                img.discPx(GX + 3.5, GY + 2, 2.2, 0x8ab04a);
                img.px(GX + 3, GY + 1, 0xb8d07a);
              }
            }
            for (let i = 0; i < 3; i++) {
              img.px(AX + 3 + i, AY + 9, 0x2a2026);
              img.px(AX + 3 + i, AY + 10, 0xe8e0d0);
            }
            glow(ax + 1, yy + 4, C.warm, 0.8);
            pool(gx, yy + 4, 6, C.warm, 0.3);
          }
      },
    });
    reserveRect(x0 - 2, top - 2, x1 - x0 + 4, bot - top + 4);
    const shopper = (c, f) => {
      const r = new HiCanvas(2, 4);
      for (const [i, j, k] of [[0, 0, 0xd83a3a], [1, 0, 0xd83a3a], [2, 0, 0xd83a3a], [0, 1, 0xe8c0a0], [1, 1, 0xe8c0a0], [2, 1, 0x2a2026]]) r.px(i, j, k);
      for (let j = 2; j < 8; j++) for (let i = 0; i < 4; i++) if (!(j > 6 && (i === 0 || i === 3))) r.px(i, j, i === 3 ? scaleColor(c, 0.75) : c);
      r.px(4, 5, 0xe8e0d0); // (the shopping bag)
      r.px(4, 6, 0xe8e0d0);
      r.px(f ? 1 : 2, 8, 0x2a2a34);
      r.px(f ? 2 : 1, 9, 0x1a1418);
      for (let i = 2; i < 6; i++) r.px(i, 10, 0x101018, 0.4);
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
      // a wall of neon: a lit frame of bulbs, rows of characters in white and colours (the same draws as ever,
      // now in fine strokes), a picture panel at one end
      const NX = x * S;
      const NY = Y(u) * S;
      for (let j = 0; j < 12; j++) for (let i = 0; i < 36; i++) img.px(NX + i, NY + j, 0x14101a);
      for (let k = 0; k < 12; k++)
        for (let j = 0; j < 4; j++) {
          if ((k + j) % 5 === 0) continue;
          const col = j === 0 || j === 3 ? c : rand() < 0.6 ? 0xffffff : rand.pick(NEON);
          if (j === 0 || j === 3) for (let i = 0; i < 3; i += 2) glowPx(NX + k * 3 + i, NY + j * 3 + (j ? 2 : 0), col);
          else glyph(NX + k * 3, NY + j * 3 - 1, 3, col, rng(NX + k * 7 + j));
        }
      pool(x + 6, Y(u) + 2, 14, c, 0.4);
      // live: the lettering flickers and changes (frames drawn with their own random numbers)
      const pr = rng(x * 7 + u);
      const signs = [0, 1, 2].map(() => {
        const r = new HiCanvas(12, 4);
        for (let k = 0; k < 12; k++)
          for (let j = 1; j < 3; j++) {
            const col = (k + j + Math.floor(pr() * 3)) % 4 === 0 ? 0x1a1420 : pr() < 0.6 ? 0xffffff : NEON[Math.floor(pr() * NEON.length)];
            glyph(k * 3, j * 3, 3, col, pr, (gx, gy, gc) => r.px(gx, gy, gc));
          }
        return kit.frame(r);
      });
      kit.loop(x, u, signs, { fps: 3, fx: 1 });
    }
    const ay = Y(ALLEY);
    // the alley: its paving wet and trodden, the shop fronts both sides with noren in the doorways, red
    // lanterns hanging in a row, steam off the ramen pots
    img.fine(0, ay - 3, W, 7, (FXr, FYr) => {
      const j = FYr - (ay - 3) * S;
      if (j < 2 || j > 18) return 0x3a3238;
      if (j < 4 || j > 16) return (FXr % 9 < 6) ? [0x2b3c78, 0x7a1a2a, 0xe8e0d0, 0x2a5a3a][Math.floor(FXr / 9) % 4] : 0x1a1418; // (the noren)
      return rampColor(C.packed, 0.3 + fbm(FXr / S, j, { seed: 34, scale: 3 }) * 0.4 + (hashPx(FXr, FYr, 35) < 0.08 ? 0.3 : 0), FXr, FYr);
    });
    reserveRect(0, ay - 4, W, 9);
    for (let x = 2; x < W; x += 4) {
      if (Math.abs(x - 30) < 9 || Math.abs(x - 90) < 12 || Math.abs(x - 150) < 9) continue;
      for (const s of [-2, 2]) {
        // a red paper lantern: black caps, ribbed paper glowing
        const LX = x * S;
        const LY = (ay + s) * S - 1;
        for (let j = 0; j < 6; j++)
          for (let i = 0; i < 3; i++) glowPx(LX + i, LY + j, j === 0 || j === 5 ? 0x1a1418 : j % 2 ? 0xff4a30 : i === 1 ? 0xffa060 : 0xe83a20, j === 0 || j === 5 ? 1 : 0.95);
      }
      pool(x, ay, 6, 0xff5a30, 0.25);
      if (x % 12 === 2) kit.emit(x, ALLEY + 1, steam, { rate: 1.6, life: [1.6, 2.4], vy: 7, sx: 1, wf: 0.5, a: 0.45, tint: 1 });
    }
  }

  // ------------------------------------------------------------ river Toyohira: frozen, an open channel steaming
  {
    const [r0, r1] = RIVER;
    // (fine: the embankments' stone revetment under the snow, the ice in plates with cracks between them and
    // drifts on it, the dark open channel winding through, its edge of thin new ice and frost flowers)
    img.fine(0, Y(r1 - 1), W, r1 - r0, (FXr, FYr, x, y) => {
      const u = L - y;
      const bankS = u - r0;
      const bankN = r1 - u;
      if (bankS < 14 || bankN < 14) {
        const d = Math.min(bankS, bankN);
        if (d < 3) return (FXr + Math.floor(FYr / 4) * 3) % 8 === 0 || FYr % 4 === 0 ? 0x5a6074 : d < 1.5 ? 0x7a8094 : 0x8a90a4; // (the stone revetment)
        return snowPx(FXr, FYr, 0.2 + d * 0.05, 0.25, 51);
      }
      const ch = (r0 + r1) / 2 + 22 * Math.sin(x / 34 + 1) + 8 * Math.sin(x / 13);
      const dch = Math.abs(u - ch);
      const cw = 4 + 2 * Math.sin(x / 21);
      if (dch < cw) {
        if (dch > cw - 0.5) return 0xd8eaf4; // (the rim of new ice)
        if (dch > cw - 1.2) return C.ice[3];
        const wv = fbm(FXr * 0.25, FYr * 1.2, { seed: 50, scale: 3 });
        return wv > 0.7 ? 0x4a6a80 : wv > 0.55 ? 0x2e4458 : 0x1e3044;
      }
      const v = fbm(FXr / S, FYr / S, { seed: 52, scale: 7, octaves: 3 });
      let c = rampColor(C.ice, 0.3 + v * 0.6 + (fbm(FXr, FYr, { seed: 49, scale: 2 }) - 0.5) * 0.15, FXr, FYr);
      if (fbm(FXr / S, FYr / S, { seed: 53, scale: 12 }) > 0.6) c = snowPx(FXr, FYr, 0.55, 0.3, 53); // drifts on the ice
      if (Math.abs(fbm(FXr / S, FYr / S, { seed: 54, scale: 10 }) - 0.5) < 0.006) c = C.ice[0]; // cracks between the plates
      else if (Math.abs(fbm(FXr * 0.2, FYr * 0.2, { seed: 48, scale: 4 }) - 0.5) < 0.008) c = 0xe8f4ff; // (fine white crazing)
      if (dch < cw + 2 && hashPx(FXr, FYr, 47) < 0.08) c = 0xf4fbff; // (frost flowers by the open water)
      return c;
    });
    reserveRect(0, Y(r1), W, r1 - r0);
    // mist over the open water
    for (let x = 0; x < W; x += 2) {
      const ch = (r0 + r1) / 2 + 22 * Math.sin(x / 34 + 1) + 8 * Math.sin(x / 13);
      if (rand() < 0.5)
        for (let k = 0; k < 4; k++) {
          const Ym = (Y(ch) - 2 - Math.floor(rand() * 4)) * S;
          for (let i = 0; i < S * 2; i++) for (let j = 0; j < 2; j++) img.px((x + k) * S + i, Ym + j, 0xffffff, 0.12);
        }
      // the warmer water steams in the frosty air (live)
      if (x % 22 === 6) kit.emit(x, Math.round(ch) + 1, steam, { rate: 0.7, life: [2.2, 3.2], vy: 4, sx: 2, wf: 1.3, a: 0.3, tint: 1 });
    }
    // bridges with railings and lamps
    for (const [bx, hw] of [[90, 10], [30, 6]]) {
      objects.push({
        y: Y(r0),
        shadow: () => shadowRect(bx + hw + 1, Y(r1), 4, r1 - r0, 0.55),
        draw: () => {
          // the deck (the same packed snow and ruts as the road), pavements, railings with snow along their tops
          // and their posts, lamp standards
          img.fine(bx - hw, Y(r1 + 1), hw * 2 + 1, r1 - r0 + 4, (FXr, FYr, x, y) => {
            roadPx(FXr, FYr, x - bx - 0.5, hw - 1, L - y);
            return null;
          });
          for (let FYr = Y(r1 + 1) * S; FYr < Y(r0 - 2) * S; FYr++)
            for (const s of [-1, 1]) {
              const X = (bx + s * (hw + 1)) * S + (s < 0 ? 2 : 0);
              img.px(X, FYr, FYr % 6 === 0 ? 0x8a8e9a : 0x5a5e6a);
              img.px(X - s, FYr, C.snow[3]);
              img.px(X + s, FYr, 0x3a3e4a);
            }
          for (let u = r0 - 2; u < r1 + 2; u++)
            if (u % 16 === 0)
              for (const s of [-1, 1]) {
                glow(bx + s * (hw + 1), Y(u), 0xfff0c8);
                pool(bx + s * (hw + 1), Y(u), 9, C.lamp, 0.35);
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
        for (let k = 0; k <= n * S; k++) {
          // (fine: the shovelled path, packed and trodden, boot prints in it, the snow heaped low along its edges)
          const x = x0 + ((x1 - x0) * k) / (n * S);
          const y = Y(u0 + ((u1 - u0) * k) / (n * S));
          const X = x * S;
          const Yy = y * S;
          const R = w * S;
          for (let j = -Math.ceil(R + 2); j <= R + 2; j++)
            for (let i2 = -Math.ceil(R + 2); i2 <= R + 2; i2++) {
              const d = Math.hypot(i2, j);
              if (d > R + 1.6) continue;
              const FXr = Math.round(X + i2);
              const FYr = Math.round(Yy + j);
              if (d > R) img.px(FXr, FYr, C.snow[3]);
              else img.px(FXr, FYr, hashPx(FXr >> 1, FYr >> 1, 36) < 0.05 ? 0x8a867e : rampColor(C.packed, 0.5 + fbm(FXr / S, FYr / S, { seed: 35, scale: 3 }) * 0.4, FXr, FYr));
            }
          if (k % (3 * S) === 0) reserveRect(x - 2, y - 2, 5, 5);
        }
      }
    };
    path([[30, 3852], [20, 3870], [40, 4000], [30, 4150], [60, 4250], [150, 4180], [160, 4000], [120, 3880], [96, 3852]]); // (from the bridges)
    path([[60, 4250], [20, 4420], [40, 4600], [100, 4700], [150, 4600], [160, 4420], [150, 4180]]);
    path([[100, 4700], [80, 4850], [90, 4990]]);
    for (const [x, u] of [[40, 4000], [30, 4150], [150, 4180], [20, 4420], [40, 4600], [160, 4420], [100, 4700], [80, 4850]]) streetLamp(x + 4, Y(u), true);
    // Shōbu pond, frozen, with a cleared skating rink; skaters gliding round it (live)
    const pc = [92, 4400];
    for (const [coat, scarf] of [[0x2a3a6a, 0xe84a3a], [0x8a2a3a, 0xf0e0c0], [0x3a3a44, 0x3ab0e0], [0xe8e0d0, 0xe8a030]]) {
      const skater = (f) => {
        // (a skater gliding: a knitted hat, the scarf flying out behind, arms out for balance, one skate pushing)
        const r = new HiCanvas(3, 5);
        for (const [i, j, c] of [[3, 0, scarf], [4, 0, scarf], [5, 0, scarf], [3, 1, 0xe8c8a8], [4, 1, 0xe8c8a8], [5, 1, 0x2a2026]]) r.px(i, j, c);
        for (let j = 2; j < 8; j++) for (let i = 3; i < 6; i++) r.px(i, j, i === 5 ? scaleColor(coat, 0.75) : coat);
        for (let i = 0; i < 3; i++) {
          r.px(i, 3 + (f ? 0 : 1), coat);
          r.px(8 - i, 3 + (f ? 1 : 0), coat);
        }
        for (let i = 0; i < 3; i++) r.px(f ? 6 + i : i, 2 - (i === 2 ? 1 : 0), scarf);
        r.px(f ? 3 : 4, 8, 0x2a2a30);
        r.px(f ? 2 : 5, 9 + (f ? 0 : 1), 0x2a2a30);
        r.px(f ? 1 : 6, 10 + (f ? 0 : 1), 0xc8ccd4);
        for (let i = 3; i < 8; i++) r.px(i, 12, 0x101018, 0.25);
        return frameAt(r, 4400);
      };
      kit.wander(pc[0], pc[1], 26, 34, [skater(0), skater(1)], { n: 2, sp: 9, idle: 0.15, turn: 'flip', fps: 3 });
    }
    for (let u = 4300; u < 4500; u++)
      for (let x = 30; x < 150; x++) {
        const e = ((x + 0.5 - pc[0]) / 50) ** 2 + ((u - pc[1]) / 80) ** 2 + (fbm(x, u, { seed: 55, scale: 14 }) - 0.5) * 0.3;
        if (e < 1) reserved[Y(u) * W + x] = 1;
      }
    // (fine: the pond's frozen shore, the ice clouded and clear by turns, the rink swept clean with a low bank
    // of snow round it and the tracery of skate marks on it, the rest drifted over)
    img.fine(30, Y(4500), 120, 200, (FXr, FYr, x, y) => {
      const u = L - y;
      const e = ((x - pc[0]) / 50) ** 2 + ((u - pc[1]) / 80) ** 2 + (fbm(Math.floor(x), Math.floor(u), { seed: 55, scale: 14 }) - 0.5) * 0.3;
      if (e >= 1) return null;
      let c = e > 0.88 ? 0x6e7890 : rampColor(C.ice, 0.4 + fbm(FXr / S, FYr / S, { seed: 56, scale: 6 }) * 0.5, FXr, FYr);
      const rink = ((x - pc[0]) / 30) ** 2 + ((u - pc[1]) / 40) ** 2;
      if (rink < 1) {
        const ph = (x - pc[0]) * 0.31 + (u - pc[1]) * 0.17;
        if (Math.abs(Math.sin(ph)) < 0.03 || Math.abs(Math.sin(ph * 1.7 + 1)) < 0.02 || Math.abs(Math.sin((x - pc[0]) * 0.2 - (u - pc[1]) * 0.29)) < 0.02) c = 0xe8f4ff; // skate marks
        else if (hashPx(FXr, FYr, 58) < 0.01) c = 0xffffff;
      } else if (rink < 1.12 && e < 0.88) c = rink < 1.05 ? C.snow[3] : C.snow[1]; // (the bank of swept snow)
      else if (e < 0.88 && fbm(FXr / S, FYr / S, { seed: 57, scale: 9 }) > 0.55) c = snowPx(FXr, FYr, 0.6, 0.3, 57);
      return c;
    });
    // Hōheikan: white Western-style guesthouse with ultramarine trim
    {
      const x = 118;
      const y = Y(4640);
      objects.push({
        y: y + 26,
        shadow: () => shadowRect(x + 4, y + 3, 40, 26, 0.5),
        draw: () => {
          // the Hōheikan: a white wooden guesthouse in the Western style, ultramarine trim, a slate roof under
          // snow with its dormers, the pedimented front porch with the balcony over it, sash windows lit
          const X0 = x * S;
          const X1 = (x + 40) * S;
          img.fine(x, y, 40, 18, (FXr, FYr) => {
            const north = FYr < (y + 9) * S;
            let c = north ? 0x5a6a82 : 0x4a5a72;
            if ((FYr - y * S) % 3 === 0) c = scaleColor(c, 0.85);
            if (fbm(FXr * 0.3, FYr * 0.3, { seed: 94, scale: 3 }) > 0.45) c = snowPx(FXr, FYr, north ? 0.72 : 0.58, 0.3, 94);
            if (FXr < X0 + 2 || FXr > X1 - 3) c = 0x3a4a62;
            return c;
          });
          // the porch: a pediment facing us, white with blue edges, the balcony rail
          const PX = (x + 14) * S;
          for (let j = 0; j < 42; j++)
            for (let i = 0; i < 36; i++) {
              let c = j < 12 ? (Math.abs(i - 17.5) <= j * 1.5 ? (Math.abs(i - 17.5) > j * 1.5 - 2.5 ? 0x2a4ab0 : 0xf2f0ea) : null) : i < 2 || i > 33 ? 0x2a4ab0 : j % 3 === 0 ? 0xe0ddd6 : 0xf2f0ea;
              if (j > 26 && j < 30) c = (i % 3) ? 0xf2f0ea : 0x2a4ab0;
              if (c !== null) img.px(PX + i, y * S + 12 + j, c);
            }
          img.discPx(PX + 18, y * S + 20, 2.5, 0x2a4ab0);
          img.fine(x, y + 18, 40, 8, (FXr, FYr) => {
            const fy = FYr - (y + 18) * S;
            if (fy < 2 || (fy > 11 && fy < 14)) return 0x2a4ab0;
            return fy % 3 === 0 ? 0xe0ddd6 : 0xf2f0ea;
          });
          for (let xx = x + 2; xx < x + 39; xx += 3)
            for (const r of [y + 20, y + 24])
              for (let j = -2; j < 3; j++) for (let i = -1; i < 2; i++) glowPx(xx * S + i + 1, r * S + j, j === 0 ? 0xd8b880 : C.warm, 0.95);
          pool(x + 20, y + 30, 22, 0xffe0b0, 0.36);
        },
      });
      reserveRect(x - 2, y - 2, 44, 32);
    }
    // Kitara concert hall: big modern roof
    office(18, Y(4860), 56, 36, 8, { wall: 0x9a9ca4, lit: 0.8, cool: true });
    path([[84, 4812], [46, 4812]]); // to its doors
    // cross-country ski track
    for (let FYr = Y(4800) * S; FYr < Y(4520) * S; FYr++) {
      // (the cross-country track: two grooves set in the snow, the pole marks between them)
      const u = L - FYr / S;
      const X = Math.round((30 + 10 * Math.sin(u / 40)) * S);
      for (const dx of [0, 1, 7, 8]) img.px(X + dx, FYr, dx % 7 === 0 ? C.snow[0] : 0x9aa4bc);
      if (FYr % 11 === 0) {
        img.px(X - 3, FYr, C.snow[1]);
        img.px(X + 11, FYr, C.snow[1]);
      }
    }
    for (const [x, u] of [[70, 4080], [130, 4060], [60, 4560], [140, 4780]]) snowman(x, Y(u));
    // a sledging hill by the pond: a mound of packed snow, runs worn into it, children sliding down and
    // trudging back up with their sleds (live)
    {
      const hx = 150;
      const hu = 4262;
      img.fine(hx - 30, Y(hu + 36), W - hx + 30, 66, (FXr, FYr, x, y) => {
        const e = ((x - hx) / 28) ** 2 + ((L - y - hu) / 32) ** 2;
        if (e >= 1) return null;
        const lit = 0.55 + (L - y - hu) / 64 - (x - hx) / 90;
        let c = rampColor(C.snow, Math.max(0.2, Math.min(1, lit + (fbm(FXr, FYr, { seed: 59, scale: 3 }) - 0.5) * 0.15)), FXr, FYr);
        const run = Math.min(Math.abs(x - hx + 8), Math.abs(x - hx - 4));
        if (run < 1) c = run < 0.4 ? 0xb8c0d0 : rampColor(C.packed, 0.75, FXr, FYr); // the worn runs, polished in the middle
        return c;
      });
      reserveRect(hx - 31, Y(hu + 37), W - hx + 31, 70);
      const sledder = (c) => {
        // (a child on a red plastic sled, sitting up, hands on the rope, a puff of snow behind)
        const r = new HiCanvas(3, 5);
        for (let j = 7; j < 15; j++) for (let i = 1; i < 8; i++) if (!((j === 7 || j === 14) && (i === 1 || i === 7))) r.px(i, j, j === 7 ? 0xf05a4a : i === 7 ? 0xa82a1a : 0xd83a2a);
        for (const [i, j, k] of [[3, 2, 0x3a6ad0], [4, 2, 0x3a6ad0], [5, 2, 0x3a6ad0], [3, 3, 0xe8c0a0], [4, 3, 0xe8c0a0], [5, 3, 0x2a2026]]) r.px(i, j, k);
        for (let j = 4; j < 9; j++) for (let i = 2; i < 7; i++) r.px(i, j, i === 6 ? scaleColor(c, 0.75) : c);
        for (let i = 2; i < 7; i++) r.px(i, 1, 0xf4f6fa, 0.4);
        return frameAt(r, hu);
      };
      const walker = (c, f) => {
        const r = new HiCanvas(3, 5);
        for (const [i, j, k] of [[3, 0, 0x3a6ad0], [4, 0, 0x3a6ad0], [5, 0, 0x3a6ad0], [3, 1, 0x2a2026], [4, 1, 0x2a2026], [5, 1, 0x2a2026]]) r.px(i, j, k);
        for (let j = 2; j < 7; j++) for (let i = 3; i < 6; i++) r.px(i, j, i === 5 ? scaleColor(c, 0.75) : c);
        r.px(f ? 3 : 4, 7, 0x2a2a34);
        r.px(f ? 4 : 5, 8, 0x1a1418);
        for (let j = 9; j < 15; j++) for (let i = f ? 1 : 4; i < (f ? 6 : 9); i++) if (j > 10) r.px(i, j, j === 11 ? 0xf05a4a : 0xd83a2a); // dragging the sled behind
        r.px(f ? 3 : 6, 9, 0xe8e0d0);
        r.px(f ? 3 : 6, 10, 0xe8e0d0);
        return frameAt(r, hu);
      };
      for (const [c, x, s0] of [[0x3a6ad0, hx - 8, 0.1], [0xe8a030, hx + 4, 0.55], [0x5aaa6a, hx - 8, 0.8]]) {
        kit.path([[x, hu + 30], [x, hu - 34]], [sledder(c)], { sp: 16, turn: 'none', s0 });
        kit.path([[x + 6, hu - 34], [x + 6, hu + 30]], [walker(c, 0), walker(c, 1)], { sp: 3, turn: 'none', fps: 3, s0: (s0 + 0.5) % 1 }); // (beside the run, clear of the sleds)
      }
    }
  }

  // ------------------------------------------------------------ F. Ōdōri park: the Snow Festival
  {
    const [o0, o1] = ODORI;
    for (const x of ODORI_SIDE) vRoad(x, 6, o0, o1 + 20, false);
    for (const u of ODORI_CROSS) hRoad(u, 6, 0, W, false);
    for (const u of ODORI_CROSS) for (const x of [26, 154]) streetLamp(x, Y(u + 10), true);
    // building fronts at both edges of the screen
    for (let u = o0; u < PLAZA[1]; u += 40) {
      for (const x of [0, 174]) {
        const c = rand.pick(NEON);
        // a building's front at the edge of the screen: storeys of windows, a vertical sign by the corner
        const X0 = x * S;
        const Y0 = Y(u + 38) * S;
        for (let j = 0; j < 38 * S; j++) for (let i = 0; i < 6 * S; i++) img.px(X0 + i, Y0 + j, j % 9 === 0 ? 0x3a3c48 : (x ? i === 0 : i === 6 * S - 1) ? 0x4a4c58 : 0x2a2c36);
        for (let k = 3; k < 36; k += 3) {
          const col = rand() < 0.3 ? c : C.warm;
          const WX = (x + (x ? 1 : 4)) * S - 2;
          const WY = Y(u + k) * S - 1;
          for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) glowPx(WX + i, WY + j, i === 2 || j === 1 ? scaleColor(col, 0.8) : col, 0.95);
        }
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
        // (a white helmet with its visor, the orange overalls, the chainsaw held out, boots)
        const r = new HiCanvas(4, 5);
        for (let i = 3; i < 6; i++) {
          r.px(i, 0, 0xf4f4f8);
          r.px(i, 1, i === 5 ? 0x3a4a5a : 0xe0e0e8);
        }
        for (let j = 2; j < 9; j++) for (let i = 2; i < 7; i++) if (!(j > 7 && (i === 2 || i === 6))) r.px(i, j, i === 6 ? 0xc85a10 : j === 4 ? 0x2a3a6a : 0xf07a20);
        for (let i = 0; i < 4; i++) r.px(7 + i, f ? 4 : 5, i < 2 ? 0xe8a020 : 0x9a9aa4); // the saw
        r.px(3, 9, 0x2a2a3a);
        r.px(5, 10, 0x2a2a3a);
        for (let i = 3; i < 9; i++) r.px(i, 12, 0x101018, 0.4);
        return frameAt(r, b0 + 120);
      };
      for (const [x, u] of [[54, b0 + 104], [126, b0 + 110], [90, b0 + 70]]) kit.wander(x, u, 5, 3, [sculptor(0), sculptor(1)], { n: 1, sp: 2, idle: 0.7, turn: 'flip', fps: 6 });
      const chips = [0, 1, 2, 3].map((k) => {
        const r = new HiCanvas(7, 7);
        for (let i = 0; i < 9; i++) {
          const a = i * 0.8 + k * 0.4;
          const d = (k + 1) * S * (0.6 + (i % 3) * 0.2);
          r.px(Math.round(10 + Math.cos(a) * d), Math.round(10 + Math.sin(a) * d * 0.7), i % 2 ? 0xe8f8ff : 0xffffff, k > 2 ? 0.5 : 1);
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
        // a yuki-tōrō: a lantern built of snow blocks, the hearth hollowed out with a candle in it, a cap of snow
        const X = x * S - 3;
        const Yy = Y(u) * S - 5;
        for (let j = 0; j < 12; j++)
          for (let i = 0; i < 9; i++) {
            if (j < 2 && (i === 0 || i === 8)) continue;
            const hole = j >= 4 && j <= 7 && i >= 2 && i <= 6;
            if (hole) glowPx(X + i, Yy + j, j < 5 ? 0xff9a40 : 0xffd080);
            else img.px(X + i, Yy + j, j < 2 ? 0xffffff : j === 3 || j === 8 ? C.snow[1] : i < 2 ? 0xffffff : i > 6 ? C.snow[2] : C.snow[3]);
          }
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
        if (!isRes(x, y))
          for (let j = 0; j < S; j++)
            for (let i = 0; i < S; i++) {
              const FXr = x * S + i;
              const FYr = y * S + j;
              img.px(FXr, FYr, hashPx(FXr >> 1, FYr >> 1, 38) < 0.04 ? 0x9a968e : rampColor(C.packed, 0.55 + fbm(FXr / S, FYr / S, { seed: 37, scale: 7 }) * 0.45 + (hashPx(FXr, FYr, 39) - 0.5) * 0.15, FXr, FYr));
            }
      }
    // pedestal: stepped snow platform with floodlights
    const pc = 7038;
    const py = Y(pc);
    objects.push({
      y: py + 22,
      shadow: () => shadowRect(56, py - 14, 76, 40, 0.55),
      draw: () => {
        img.fine(54, py - 18, 72, 32, (FXr, FYr) => (FYr < (py - 18) * S + 2 ? 0xffffff : snowPx(FXr, FYr, 0.6, 0.35, 11)));
        for (let k = 0; k < 3; k++)
          for (let FXr = (54 + k * 3) * S; FXr < (126 - k * 3) * S; FXr++)
            for (let j = 0; j < 6; j++) img.px(FXr, (py + 14 + k * 2) * S + j, j < 2 ? 0xffffff : j < 4 ? C.snow[3] : C.snow[1]);
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
          // a floodlight on its pole: the housing, the lens blazing, snow on the hood
          const X = x * S;
          const Yy = Y(6900) * S;
          for (let j = 0; j < 9; j++) for (let i = 0; i < 9; i++) img.px(X + i, Yy + j, j < 2 ? C.snow[3] : i === 0 || i === 8 || j === 8 ? 0x2a2c38 : 0x4a4c58);
          for (let j = 3; j < 7; j++) for (let i = 2; i < 7; i++) glowPx(X + i, Yy + j, (i + j) % 3 ? 0xffffff : 0xe8f0ff);
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
        // the TV Tower: the mast with its red light, the observation deck (snow on its roof, a band of glass lit
        // cool, the frame), and the orange lattice legs spreading down, braced in X between belts, lamps on them
        const CX = 90 * S;
        for (let j = 0; j < 18; j++) {
          img.px(CX, j, 0xd8d8e0);
          img.px(CX + 1, j, 0x9a9aa4);
          if (j % 6 === 0) for (let i = -2; i <= 3; i++) img.px(CX + i, j, 0xb8b8c4);
        }
        glowPx(CX, 0, 0xff3030);
        glowPx(CX + 1, 0, 0xff3030, 0.7);
        for (let j = 18; j < 48; j++)
          for (let i = 79 * S; i < 101 * S; i++) {
            let c = j < 22 ? (j < 20 ? 0xffffff : C.snow[3]) : j < 24 ? 0x6a707c : j > 44 ? 0x4a4e5a : (i - 79 * S) % 6 === 0 ? 0x7a808c : 0x9aa0ac;
            if (j >= 28 && j <= 38 && (i - 79 * S) % 6 !== 0) {
              glowPx(i, j, j === 33 ? 0xa8c8e8 : C.cool, 0.9);
              continue;
            }
            img.px(i, j, c);
          }
        for (let Yy = 48; Yy < 318; Yy++) {
          const t = (Yy - 48) / 270;
          const hw = (6 + t * 16) * S;
          for (const s of [-1, 1]) {
            const X = Math.round(CX + s * hw);
            img.px(X, Yy, 0xe8602a);
            img.px(X - s, Yy, 0xd8502a);
            img.px(X - 2 * s, Yy, 0xa83a20);
            if (Yy % 36 === 0) glowPx(X, Yy, 0xffb040);
          }
          const k = (Yy - 48) % 36;
          if (k < 2) for (let X = Math.round(CX - hw); X <= CX + hw; X++) img.px(X, Yy, k ? 0xa83a20 : 0xd8502a); // (the belts)
          const bx = Math.round(CX - hw + (k / 36) * hw * 2);
          img.px(bx, Yy, 0xc8482a);
          img.px(Math.round(CX + hw - (k / 36) * hw * 2), Yy, 0xc8482a);
        }
        // the clock panel (its digits are live: they show how long the stage has been running, mm:ss)
        for (let j = 96; j < 123; j++) for (let i = 78 * S; i < 102 * S; i++) img.px(i, j, j === 96 || j === 122 || i === 78 * S || i === 102 * S - 1 ? 0x3a3a48 : 0x101018);
        pool(90, 36, 26, 0xffa040, 0.3);
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
    // (worked out a fine pixel at a time: the shape at three times the detail, how deep each pixel lies in
    // the ice, reflections, frost, sparkles, the LEDs' colour rising from below)
    const x0 = Math.round(cx - w / 2);
    const y0 = by - 5 - h; // the statue stands on a block 5 px high
    const FW = w * S;
    const FH = h * S;
    const grid = new Uint8Array(FW * FH);
    for (let Yf = 0; Yf < FH; Yf++) for (let Xf = 0; Xf < FW; Xf++) grid[Yf * FW + Xf] = shape((Xf + 0.5) / S, (Yf + 0.5) / S, w, h);
    const at = (x, y) => (x < 0 || y < 0 || x >= FW || y >= FH ? 0 : grid[y * FW + x]);
    const depth = (x, y) => {
      for (let r = 1; r <= 9; r++)
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2;
          if (!at(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r))) return r;
        }
      return 10;
    };
    const sr = rng(cx * 31 + by);
    const X0 = x0 * S;
    const Y0 = y0 * S;
    objects.push({
      y: by,
      shadow: () => {
        for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) if (at(x, y) && !at(x - 9, y - 6)) img.tintPx(X0 + x + 9, Y0 + y + 6, 0.7);
      },
      draw: () => {
        // the block it stands on: cut ice, its edges bright, its front face lit by the lamps
        const bw = Math.round(w * 0.7) * S;
        const BX = Math.round(cx * S - bw / 2);
        for (let Yy = (by - 5) * S; Yy < by * S; Yy++)
          for (let X = BX; X < BX + bw; X++) {
            const top = Yy < (by - 5) * S + 2;
            glowPx(X, Yy, top ? 0xe8fbff : X < BX + 2 || X > BX + bw - 3 ? 0xb8e8f8 : (X - BX + Yy) % 11 === 0 ? 0xd8f4ff : mix(0x6ab0d0, tint, 0.35 + ((Yy - (by - 5) * S) / (5 * S)) * 0.4), 0.92);
          }
        for (let y = 0; y < FH; y++)
          for (let x = 0; x < FW; x++) {
            const k = at(x, y);
            if (!k) continue;
            const d = depth(x, y);
            let c = k === 3 ? (hashPx(x, y, 51) < 0.2 ? 0xffffff : 0xe8f6ff) : k === 2 ? 0x3a86b8 : d === 1 ? 0xeafcff : d <= 3 ? 0xb4e6f6 : d <= 6 ? 0x82cce8 : 0x5ab4d8;
            if (k === 1 && d > 1 && (x + y * 0.55 + 40) % 33 < 2) c = 0xf4feff; // a streak of reflection
            if (k === 1 && d === 1 && (x < FW / 2) !== (y > FH / 2)) c = 0xffffff; // the edge catching the light
            const t = y / FH;
            if (t > 0.55 && k !== 3) c = mix(c, tint, (t - 0.55) * 0.9);
            glowPx(X0 + x, Y0 + y, c, k === 3 ? 0.95 : d === 1 ? 0.95 : 0.82);
          }
        for (let i = 0; i < Math.round((w * h) / 22); i++) {
          const x = Math.floor(sr() * FW);
          const y = Math.floor(sr() * FH);
          if (at(x, y) === 1 && depth(x, y) > 2) glowPx(X0 + x, Y0 + y, 0xffffff); // a sparkle in the ice
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
          for (let Yy = y * S; Yy < by * S; Yy++)
            for (let X = x * S; X < (x + bw) * S; X++) {
              const ex = Math.min(X - x * S, (x + bw) * S - 1 - X);
              const ey = Math.min(Yy - y * S, by * S - 1 - Yy);
              const edge = ex < 2 || ey < 2;
              let c = edge ? 0xeafcff : ex < 4 || ey < 4 ? 0xc8f0fa : 0x7ec8e4;
              // the catch inside, seen through the ice: scales, an eye, fins; the squid's mantle and arms; the crab
              const lx = (X + 0.5) / S - x - bw / 2;
              const ly = (Yy + 0.5) / S - y - bh / 2;
              let inside = false;
              if (kind === 'fish') inside = (lx / 5) ** 2 + (ly / 2.2) ** 2 < 1 || (lx > 4 && Math.abs(ly) < lx - 3.5 && lx < 6.5);
              else if (kind === 'squid') inside = ((lx / 2.2) ** 2 + ((ly + 2) / 4) ** 2 < 1) || (ly > 1 && ly < 6 && Math.abs(lx) < 2.5 && Math.floor(lx * 2.4) % 2 === 0);
              else inside = (lx / 4) ** 2 + (ly / 3) ** 2 < 1 || (Math.abs(ly) < 0.6 && Math.abs(lx) < 6 && Math.abs(lx) > 3);
              if (!edge && inside) {
                c = mix(ly < 0 ? light : body, 0x9ad8f0, 0.35);
                if (kind === 'fish' && (Math.floor(lx * 3) + Math.floor(ly * 3)) % 3 === 0) c = mix(c, 0xffffff, 0.2); // (scales)
              }
              if (!edge && ((X - x * S) + (Yy - y * S) * 0.6) % 27 < 2) c = 0xf0fcff;
              glowPx(X, Yy, c, edge ? 0.95 : 0.85);
            }
          if (kind === 'fish') glowPx(x * S + 9, y * S + 22, 0x1a1a22);
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
    // (drawn a fine pixel at a time: the stones of the walls in courses with hairline joints, every stone lit on
    // its top edge and shaded on its right, the five storeys' plaster walls with their barred windows, the roofs
    // in rows of carved tiles with round ends along the eaves and corners swept up, snow lying on the ridges,
    // the gables, the golden shachihoko; the floodlights washing up it)
    const W2 = 40; // half width of the plinth
    const top = by - 104;
    castle = { x0: cx - W2 - 2, y0: top - 6, x1: cx + W2 + 2, y1: by + 1, mask: new Set() };
    const CXf = cx * S + 1;
    const BY = by * S;
    let shading = null;
    const fmask = new Set();
    const put = (X, Yy, c, a = 1) => {
      if (shading) {
        if (!shading.has(Yy * 100000 + X)) img.tintPx(X + 18, Yy + 15, 0.62);
        shading.add(Yy * 100000 + X);
        return;
      }
      img.px(X, Yy, c, a);
      fmask.add(Yy * 100000 + X);
      castle.mask.add(Math.floor(Yy / S) * W + Math.floor(X / S));
    };
    const lit = (X, Yy, c, a) => !shading && glowPx(X, Yy, c, a);
    const SN = C.snow;
    const JOINT = 0x6e7894;
    const EAVE = 0x5c6684;
    const UNDER = 0x8690aa;
    const OUTLINE = 0x6a7490;
    const flood = (X) => mix(0xffdcf0, 0xd8e8ff, Math.max(0, Math.min(1, (X - CXf + W2 * S) / (W2 * S * 2))));
    const hash = (a, b) => (((a + 11) * 73856093) ^ ((b + 7) * 19349663)) >>> 0;
    const stoneAt = (X, row) => {
      let s = CXf - (W2 + 8) * S - ((row * 13) % 24);
      for (let i = 0; ; i++) {
        const sw = 15 + (hash(i, row) % 10);
        if (X < s + sw) return { i, sx: X - s, sw };
        s += sw;
      }
    };
    const paint = () => {
      // the plinth of packed snow and the steps up to the walls
      for (let Yy = BY - 18; Yy < BY; Yy++) for (let X = CXf - W2 * S; X < CXf + W2 * S; X++) put(X, Yy, Yy < BY - 16 ? SN[3] : hashPx(X, Yy, 61) < 0.08 ? SN[1] : SN[2]);
      for (let k = 0; k < 5; k++)
        for (let X = CXf - 21 + k * 3; X < CXf + 21 - k * 3; X++)
          for (let j = 0; j < 6; j++) put(X, BY - 18 - k * 6 + j, j < 2 ? 0xffffff : j < 4 ? SN[3] : SN[1]);
      // the stone walls, fanning out at the foot
      const wallTop = BY - 90;
      for (let Yy = wallTop + 1; Yy < BY - 18; Yy++) {
        const t = (Yy - wallTop) / (BY - 18 - wallTop);
        const hw = (30 + 8 * t * t) * S;
        const row = Math.floor((Yy - wallTop - 1) / 9);
        const sy = (Yy - wallTop - 1) % 9;
        for (let X = Math.round(CXf - hw); X < CXf + hw; X++) {
          if (Math.abs(X - CXf) < 21 - (BY - 18 - Yy) * 0.3 && Yy > BY - 54) continue; // the stair cut into them
          const side = (X - CXf) / hw;
          const { i, sx, sw } = stoneAt(X, row);
          if (sy === 0 || sx === 0) {
            put(X, Yy, side > 0.3 ? mix(JOINT, EAVE, 0.5) : JOINT);
            continue;
          }
          let v = 0.62 - side * 0.3 + ((hash(i, row + 50) % 100) / 100 - 0.5) * 0.22 + (hashPx(X, Yy, 62) - 0.5) * 0.08;
          if (sy === 1) v += 0.16;
          if (sx === sw - 1) v -= 0.16;
          if (sy === 8) v -= 0.06;
          if (Math.abs(X - (CXf - hw)) < 2 || Math.abs(X - (CXf + hw)) < 2) v -= 0.15;
          put(X, Yy, rampColor(SN, Math.max(0, Math.min(1, v)), X, Yy));
          lit(X, Yy, flood(X), 0.06 + 0.2 * t);
        }
      }
      for (let X = CXf - 90; X < CXf + 90; X++) {
        put(X, wallTop, 0xffffff);
        put(X, wallTop - 1, SN[3]);
      }
      // five storeys, each a wall of windows under a roof
      const tiers = [
        [28, 10, 'kara'],
        [23, 9, 'chidori'],
        [18, 8, ''],
        [14, 8, 'chidori'],
        [10, 7, ''],
      ];
      let y = wallTop - 1;
      tiers.forEach(([hw0, wh0, gable]) => {
        const hw = hw0 * S;
        const wh = wh0 * S;
        for (let Yy = y - wh; Yy < y; Yy++)
          for (let X = CXf - hw + 6; X < CXf + hw - 6; X++) {
            const r = Yy - (y - wh);
            const bay = (X - CXf + hw) % 12;
            const win = r >= 5 && r <= 13 && bay >= 3 && bay <= 8 && Math.abs(X - CXf) < hw - 12;
            const shade = X > CXf + hw - 15;
            let c;
            if (win) c = r === 5 ? EAVE : r === 13 ? 0xe8eef8 : bay === 5 || bay === 6 ? 0x8a94ac : r < 9 ? 0x5c6684 : 0x6e7890; // (recess, bars, the lit sill)
            else c = r < 3 ? UNDER : shade || r >= wh - 2 ? SN[1] : (X + r) % 23 === 0 ? SN[2] : SN[3];
            put(X, Yy, c);
            if (!win && r > 2) lit(X, Yy, flood(X), (0.1 + 0.32 * (r / (wh - 1))) * (shade ? 0.5 : 1));
          }
        y -= wh;
        // the roof: snow along its ridge, rows of carved tiles, round tile ends at the eave, the eave dark under
        const rh = 15;
        for (let Yy = y - rh; Yy < y; Yy++) {
          const r = Yy - (y - rh);
          const span = hw + 6 + r * 0.8;
          for (let X = Math.round(CXf - span); X < CXf + span; X++) {
            const k = (X - CXf + 1000) % 4;
            let c;
            if (r < 3) c = r === 0 ? 0xffffff : SN[3];
            else if (r >= rh - 2) c = r === rh - 1 ? EAVE : k === 1 ? 0xffffff : SN[1];
            else c = k === 0 ? SN[1] : k === 1 ? 0xffffff : X < CXf ? SN[3] : SN[2];
            put(X, Yy, c);
          }
        }
        for (const s of [-1, 1])
          for (let q = 0; q < 8; q++) {
            const X = Math.round(CXf + s * (hw + 17 + q * 0.6));
            put(X, y - 2 - q, q < 2 ? EAVE : SN[3]);
            put(X - s, y - 2 - q, SN[2]);
          }
        if (gable === 'chidori') {
          for (let k = 0; k < 21; k++)
            for (let X = CXf - 21 + k; X <= CXf + 21 - k; X++) {
              const e = 21 - k - Math.abs(X - CXf);
              put(X, y - rh - k + 9, e < 2 || k > 19 ? 0xffffff : e < 4 ? SN[0] : X > CXf ? SN[2] : SN[3]);
            }
          for (let j = 0; j < 6; j++) for (let i = -1 + Math.floor(j / 3); i <= 1 - Math.floor(j / 3); i++) put(CXf + i, y - rh + 2 + j, SN[0]);
        } else if (gable === 'kara') {
          for (let X = CXf - 27; X <= CXf + 27; X++) {
            const a = Math.round(Math.sin(((X - CXf + 27) / 54) * Math.PI) * 12);
            put(X, y - 6 - a, 0xffffff);
            put(X, y - 5 - a, SN[3]);
            put(X, y - 4 - a, SN[0]);
            for (let Yy = y - 3 - a; Yy < y + 6; Yy++) put(X, Yy, (Yy + X) % 13 === 0 ? SN[1] : SN[2]);
          }
        }
        y -= rh - 3;
      });
      // the top ridge and its golden shachihoko, tails curling up (lit gold by the floodlights)
      for (let X = CXf - 27; X < CXf + 27; X++) {
        put(X, y - 3, SN[3]);
        put(X, y - 2, 0xffffff);
      }
      for (const s of [-1, 1])
        for (const [i, j] of [[0, 0], [1, 0], [0, -1], [1, -1], [2, -1], [1, -2], [2, -2], [2, -3], [3, -3], [3, -4], [2, -5], [3, -5], [4, -6], [1, -6]]) lit(CXf + s * (27 - i), y - 4 + j, j < -4 ? 0xffe8a0 : 0xffd060, 1);
      for (const s of [-1, 1]) {
        lit(CXf + s * 108, BY - 6, 0xffffff, 1);
        lit(CXf + s * 108 + 1, BY - 6, 0xffffff, 0.7);
        if (!shading) pool(cx + s * 30, by - 20, 30, s < 0 ? 0xff60c8 : 0x60a8ff, 0.32);
      }
      if (!shading) pool(cx, by - 50, 46, 0xd8e8ff, 0.2);
      // a dark line all round where the carved snow meets the ground
      if (!shading)
        for (let Yy = castle.y0 * S; Yy <= castle.y1 * S; Yy++)
          for (let X = castle.x0 * S; X <= castle.x1 * S; X++)
            if (!fmask.has(Yy * 100000 + X) && (fmask.has(Yy * 100000 + X + 1) || fmask.has(Yy * 100000 + X - 1) || fmask.has((Yy + 1) * 100000 + X) || fmask.has((Yy - 1) * 100000 + X))) img.px(X, Yy, OUTLINE);
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
    // the ice slide: a staircase of snow blocks up the back, the chute polished to glass, lit blue from below,
    // its rails of ice, children whizzing down (and the queue on the stairs)
    objects.push({
      y: y + len,
      shadow: () => shadowRect(cx + 3, y + 3, 10, len, 0.7),
      draw: () => {
        const X0 = (cx - 8) * S;
        for (let j = 0; j < 14 * S; j++) for (let i = 0; i < 16 * S; i++) img.px(X0 + i, y * S + j, j % 6 === 0 ? C.snow[1] : j % 6 < 2 ? 0xffffff : i < 2 || i > 16 * S - 3 ? C.snow[2] : C.snow[3]);
        for (let Yy = (y + 14) * S; Yy < (y + len) * S; Yy++)
          for (let i = 0; i < 10 * S; i++) {
            const X = (cx - 5) * S + i;
            const k = i - 5 * S;
            if (Math.abs(k) > 12) img.px(X, Yy, Math.abs(k) > 13 ? C.snow[1] : 0xe8f8ff);
            else glowPx(X, Yy, (Yy >> 2) % 5 === 0 ? 0xf4feff : Math.abs(k) < 3 ? 0xb8e8ff : (Yy + k) % 7 === 0 ? 0xe0f6ff : C.ice[2], 0.92);
          }
        const kr = rng(cx * 7 + y);
        for (let k = 0; k < 6; k++) personPx((cx - 6 + Math.floor(kr() * 12)) * S, (y + 2 + k * 2) * S, kr);
        pool(cx, y + len, 18, 0x80e0ff, 0.4);
      },
    });
    reserveRect(cx - 10, y - 2, 20, len + 4);
  }
  function craneSculpture(cx, y) {
    // the tanchō crane in snow, wings spread: carved feathers in fine grooves, black primaries and neck, the
    // red crown, lit pink and blue by the floodlights either side
    const at = (X, Yy) => crane((X - cx * S) / S, (Yy - y * S) / S);
    objects.push({
      y: y + 60,
      shadow: () => {
        for (let Yy = y * S; Yy < (y + 60) * S; Yy++) for (let X = (cx - 40) * S; X < (cx + 40) * S; X++) if (at(X, Yy)) img.tintPx(X + 18, Yy + 18, 0.55);
      },
      draw: () => {
        for (let Yy = y * S; Yy < (y + 60) * S; Yy++)
          for (let X = (cx - 40) * S; X < (cx + 40) * S; X++) {
            const k = at(X, Yy);
            if (!k) continue;
            const xx = (X - cx * S) / S;
            const yy = (Yy - y * S) / S;
            const edge = !at(X - 1, Yy) || !at(X + 1, Yy) || !at(X, Yy - 1) || !at(X, Yy + 1);
            let c = k === 2 ? 0x2a2a34 : k === 3 ? 0xd02a2a : xx < 0 ? C.snow[3] : C.snow[2];
            if (k === 1 && Math.abs(yy) > 14 && (Math.round(Math.abs(xx) * 1.4) + Math.round(yy * 0.6)) % 5 === 0) c = C.snow[1]; // (the feathers carved)
            if (edge && k === 1) c = xx < 0 && yy < 30 ? 0xffffff : C.snow[1];
            img.px(X, Yy, c);
            if (k === 1) glowPx(X, Yy, xx < 0 ? 0xffd8f0 : 0xd8e8ff, 0.12);
          }
        for (let Yy = (y + 54) * S; Yy < (y + 60) * S; Yy++) for (let X = (cx - 30) * S; X < (cx + 30) * S; X++) img.px(X, Yy, Yy < (y + 54) * S + 2 ? 0xffffff : (X % 9 === 0 ? C.snow[1] : C.snow[2]));
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
    // the big-air ramp: a steel scaffold tower in its bracing, the in-run of snow with lamps down both sides,
    // the kicker, the landing widening below with its coloured line, banners, the crowd at the barriers
    objects.push({
      y: y + 150,
      shadow: () => shadowRect(cx + 8, y + 6, 14, 150, 0.55),
      draw: () => {
        for (let Yy = y * S; Yy < (y + 70) * S; Yy++)
          for (let i = 0; i < 14 * S; i++) {
            const X = (cx - 7) * S + i;
            const k = (Yy - y * S) % 18;
            if (i < 3 || i > 14 * S - 4) img.px(X, Yy, k < 2 || Math.abs((i < 3 ? i : 14 * S - 1 - i) * 6 - k) < 2 ? 0x9aa0ae : 0x5a5e6a);
            else if (i < 9 || i > 14 * S - 10) img.px(X, Yy, Yy % 2 ? C.snow[3] : C.snow[2]);
            else img.px(X, Yy, (i === 16 || i === 25) ? 0xb8d0e8 : hashPx(X, Yy, 52) < 0.04 ? 0xffffff : C.snow[3]);
          }
        for (let Yy = y * S; Yy < (y + 70) * S; Yy += 30) {
          glowPx((cx - 7) * S, Yy, 0xffffff);
          glowPx((cx + 7) * S - 1, Yy + 15, 0xffffff);
        }
        for (let j = 0; j < 12; j++) for (let i = 0; i < 16 * S; i++) img.px((cx - 8) * S + i, (y + 70) * S + j, j < 2 ? 0xffffff : j < 8 ? C.snow[3] : C.snow[1]);
        for (let Yy = (y + 80) * S; Yy < (y + 150) * S; Yy++) {
          const hw = (10 + (Yy / S - y - 80) * 0.3) * S;
          for (let X = Math.round(cx * S - hw); X < cx * S + hw; X++) {
            const e = Math.min(X - (cx * S - hw), cx * S + hw - X);
            img.px(X, Yy, e < 3 ? (Yy % 12 < 6 ? 0xe83a2a : 0xf4f4f8) : Math.abs(Yy - (y + 82) * S) < 2 ? 0x30a0ff : Yy % 3 === 0 ? C.snow[2] : C.snow[3]);
          }
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
    // a festival stall: a striped awning with snow on it, the counter lit by a string of bulbs, steaming pots
    // and grills (corn, crab legs, jaga-butter, hot sake), the stallholder, a menu board
    const c = rand.pick([0xd03a2a, 0xe8a030, 0x2a7ad0, 0x3aa060]);
    objects.push({
      y: y + 10,
      shadow: () => shadowRect(x + 2, y + 2, 20, 10, 0.55),
      draw: () => {
        const X = x * S;
        const Yy = y * S;
        const sr = rng(x * 11 + y);
        for (let j = 0; j < 21; j++) for (let i = 0; i < 60; i++) img.px(X + i, Yy + j, j < 3 ? (j === 0 ? 0xffffff : C.snow[3]) : (Math.floor(i / 6) % 2 ? 0xf2f0ea : c));
        for (let i = 0; i < 60; i++) if (i % 6 === 3) img.px(X + i, Yy + 21, Math.floor(i / 6) % 2 ? 0xd8d4cc : scaleColor(c, 0.75));
        for (let j = 21; j < 30; j++) for (let i = 0; i < 60; i++) img.px(X + i, Yy + j, j === 21 ? 0x6a5a48 : (i % 15 === 0 ? 0x2a1e18 : 0x4a3a30));
        for (let i = 2; i < 58; i += 4) glowPx(X + i, Yy + 22, i % 8 ? 0xff9a50 : 0xffe0a0);
        for (let k = 0; k < 4; k++) {
          const GX = X + 6 + k * 13;
          const kind = sr();
          for (let i = 0; i < 9; i++)
            for (let j = 0; j < 4; j++)
              img.px(GX + i, Yy + 24 + j, kind < 0.3 ? ((i + j) % 2 ? 0xf0c040 : 0xd8a020) : kind < 0.55 ? ((i % 3) ? 0xe85a3a : 0xf0a080) : kind < 0.8 ? (Math.hypot(i - 4, j - 1.5) < 2.5 ? 0xf8e8b0 : 0x5a5a62) : (i % 3 === 0 ? 0xf4f4f8 : 0x3a3a44));
        }
        for (let i = 0; i < 3; i++) {
          img.px(X + 30 + i, Yy + 18, 0xf4f0e6);
          img.px(X + 30 + i, Yy + 19, 0xe8c0a0);
        }
        for (let k = 0; k < 8; k++) img.px(X + 18 + Math.round(Math.sin(k) * 3), Yy - 2 - k * 2, 0xffffff, 0.35 - k * 0.03);
        pool(x + 10, y + 10, 12, 0xffa050, 0.4);
      },
    });
    reserveRect(x - 1, y - 2, 22, 14);
  }

  // ------------------------------------------------------------ the street furniture and the life the fine pixels make room for
  {
    const er = rng(7301);
    // (on the ploughed banks between the carriageways and the blocks: clear of the crossings, the turret stands
    // and each other)
    const taken = [];
    const freeAt = (x, y, w, h, corner = false) => {
      const u = U(y);
      if ((!corner && [...STREETS, ...plowRoads, ALLEY].some((s) => Math.abs(u - s) < 13)) || pads.some((p) => Math.abs(p.x - x) < 16 && Math.abs(Y(p.u) - y) < 16)) return false;
      if (taken.some(([tx, ty, tw, th]) => x < tx + tw + 2 && tx < x + w + 2 && y < ty + th + 2 && ty < y + h + 2)) return false;
      taken.push([x, y, w, h]);
      return true;
    };
    /** A bus stop: a shelter of glass with snow on its roof, the timetable, people waiting with their bags. */
    const busStop = (x, y) => {
      const X = x * S;
      const Yy = y * S;
      const br = rng(x * 31 + y);
      objects.push({
        y: y + 4,
        shadow: () => shadowPx(X + 4, Yy + 4, 21, 12, 0.55),
        draw: () => {
          for (let j = 0; j < 12; j++)
            for (let i = 0; i < 21; i++) {
              if (j < 3) img.px(X + i, Yy + j, j === 0 ? 0xffffff : C.snow[3]);
              else if (i === 0 || i === 20 || j === 11) img.px(X + i, Yy + j, 0x4a4c58);
              else glowPx(X + i, Yy + j, (i + j) % 7 === 0 ? 0xe8f4ff : 0xb8d0e8, 0.35);
            }
          for (let j = 4; j < 10; j++) glowPx(X + 17, Yy + j, 0xf4f8ff, 0.9); // (the lit timetable)
          for (let k = 0; k < 3; k++) if (br() < 0.75) personPx(X + 3 + k * 5, Yy + 5, br);
          for (let j = -6; j < 0; j++) img.px(X + 22, Yy + j + 8, 0x6a6c78);
          for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) img.px(X + 21 + i, Yy + j, j === 0 ? C.snow[3] : 0x2a6ad0);
        },
      });
      reserveRect(x - 1, y - 1, 9, 6);
    };
    /** A pair of vending machines glowing at the kerb: rows of cans behind their window, the buttons lit. */
    const vending = (x, y) => {
      const X = x * S;
      const Yy = y * S;
      const vr = rng(x * 17 + y);
      objects.push({
        y: y + 3,
        shadow: () => shadowPx(X + 3, Yy + 3, 16, 10, 0.55),
        draw: () => {
          for (const [k, c] of [[0, vr.pick([0xd83a30, 0xe8e8ec, 0x3a6ad0])], [8, vr.pick([0x3a9a5a, 0xe8e8ec, 0xe8a030])]]) {
            for (let j = 0; j < 10; j++)
              for (let i = 0; i < 7; i++) {
                if (j < 2) img.px(X + k + i, Yy + j, C.snow[3]);
                else if (j < 7 && i > 0 && i < 6) glowPx(X + k + i, Yy + j, j % 2 ? 0xf4faff : vr.pick([0xd83a30, 0xe8c040, 0x3a6ad0, 0x6aaa5a, 0xff9ac0]), 0.95);
                else img.px(X + k + i, Yy + j, i === 0 ? scaleColor(c, 1.15) : i === 6 ? scaleColor(c, 0.7) : c);
              }
            img.px(X + k + 2, Yy + 8, 0x1a1a20);
            img.px(X + k + 3, Yy + 8, 0x1a1a20);
          }
          pool(x + 2.5, y + 4, 7, 0xd8ecff, 0.4);
        },
      });
      reserveRect(x - 1, y - 1, 7, 5);
    };
    /** A red post box with snow on its top. */
    const postBox = (x, y) => {
      const X = x * S;
      const Yy = y * S;
      objects.push({
        y: y + 2,
        shadow: () => shadowPx(X + 2, Yy + 2, 5, 6, 0.55),
        draw: () => {
          for (let j = 0; j < 7; j++) for (let i = 0; i < 5; i++) img.px(X + i, Yy + j, j < 2 ? C.snow[3] : j === 3 ? 0x1a1414 : i === 0 ? 0xf05a4a : i === 4 ? 0xa82a1a : 0xd83a2a);
        },
      });
    };
    /** A heap of ploughed snow at a corner, grey with grit, its crust lit on top. */
    const heap = (x, y, r) => {
      const X = x * S;
      const Yy = y * S;
      const R = r * S;
      for (let j = -R; j <= R; j++)
        for (let i = -R; i <= R; i++) {
          const d = Math.hypot(i, j * 1.3) / R + (fbm((X + i) * 0.3, (Yy + j) * 0.3, { seed: 47, scale: 2 }) - 0.5) * 0.3;
          if (d > 1) continue;
          img.px(X + i, Yy + j, i + j < -R * 0.4 ? 0xffffff : hashPx(X + i, Yy + j, 48) < 0.12 ? 0x8a8c94 : d > 0.85 ? C.snow[1] : C.snow[2]);
        }
    };
    for (const u of STREETS) {
      if (u < CENTER[0] || u > RIVER[0]) continue;
      for (const [ax, hw] of AVENUES) {
        const w = ax === 90 ? 10 : hw;
        for (const [sx, su] of [[-1, 1], [1, -1]]) {
          const x = Math.round(ax + sx * (w + 2));
          const y = Y(u + su * 9);
          if (freeAt(x - 2, y - 2, 4, 4, true)) heap(x, y, 2.4);
        }
      }
    }
    for (let k = 0; k < 110; k++) {
      const u = CENTER[0] + 30 + er() * (RIVER[0] - CENTER[0] - 60);
      const [ax, hw] = AVENUES[Math.floor(er() * 3)];
      const w = ax === 90 ? 10 : hw;
      const side = er() < 0.5 ? -1 : 1;
      const x = Math.round(ax + side * (w + 1.5) - (side < 0 ? 4 : 0));
      const y = Y(u);
      const kind = er();
      if (kind < 0.35 && freeAt(x, y, 7, 4)) busStop(x, y);
      else if (kind < 0.75 && freeAt(x, y, 5, 3)) vending(x, y);
      else if (freeAt(x, y, 2, 2)) postBox(x, y);
    }
    // people walking along the avenues' pavements in the centre, both ways (live)
    const walker = (c, hat, f) => {
      const r = new HiCanvas(2, 4);
      for (let i = 0; i < 3; i++) {
        r.px(i, 0, hat);
        r.px(i, 1, i === 1 ? 0xe8c0a0 : hat);
      }
      for (let j = 2; j < 7; j++) for (let i = 0; i < 3; i++) r.px(i, j, i === 2 ? scaleColor(c, 0.75) : c);
      r.px(f ? 0 : 2, 7, 0x2a2a34);
      r.px(f ? 2 : 0, 8, 0x1a1418);
      for (let i = 1; i < 5; i++) r.px(i, 10, 0x101018, 0.35);
      return frameAt(r, 2800);
    };
    for (const [ax, hw] of AVENUES)
      for (const side of [-1, 1]) {
        const w = ax === 90 ? 10 : hw;
        const x = ax + side * (w + 3);
        const c = er.pick([0xd04040, 0x3a6ad0, 0x2a2a34, 0xe8e8f0, 0x5a3a2a]);
        const hat = er.pick([0xd83a3a, 0xe8e0d0, 0x2a2a34, 0x3a8ad0]);
        const pts = side < 0 ? [[x, CENTER[0] + 10], [x, RIVER[0] - 10]] : [[x, RIVER[0] - 10], [x, CENTER[0] + 10]];
        kit.path(pts, [walker(c, hat, 0), walker(c, hat, 1)], { sp: 3, n: 4, gap: 220, mode: 'wrap', turn: 'none', fps: 3, s0: er() });
      }
    // crystals glinting in the open snow of the slopes and the park (live)
    const glint = [1, 2, 3, 2, 1].map((g) => {
      const out = new HiCanvas(3, 3);
      out.px(4, 4, 0xffffff);
      for (let k = 1; k < g; k++) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) out.px(4 + dx * k, 4 + dy * k, 0xe8f4ff, 1 - k * 0.3);
      return kit.frame(out);
    });
    for (const [rects, rate] of [
      [[[24, 1090, 40, 160], [116, 1090, 40, 160]], 1.5],
      [[[24, 820, 40, 280], [116, 820, 40, 280]], 1.5],
      [[[20, 4990, 140, 400], [20, 4560, 140, 400]], 2],
      [[[30, 3830, 120, 150]], 1.2],
    ])
      kit.spot(rects, glint, { rate, fps: 10, a: 0.9 });
    // the wind lifting powder off the roofs in little streaming plumes (live)
    const spindrift = [0, 1, 2, 3, 4, 5].map((k) => {
      const out = new HiCanvas(10, 4);
      for (let i = 0; i < 14; i++) {
        const X = Math.round(2 + k * 4 + i * 1.3 + Math.sin(i + k) * 2);
        const Yy = Math.round(6 + Math.sin(i * 0.9) * 2 - k * 0.4);
        if (X < 30) out.px(X, Yy, i % 3 ? 0xf4f8ff : 0xffffff, (1 - k / 6) * 0.8);
      }
      return frameAt(out, 1700);
    });
    const plumes = roofEdges.filter(() => er() < 0.35).map(([x, u, w]) => [x, u + 10, w, 6]);
    if (plumes.length) kit.spot(plumes, spindrift, { rate: plumes.length * 0.08, fps: 7, a: 0.8 });
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

  // turret pads: trodden snow circles where the snowmen stand, boot prints in them, a rim of heaped snow
  for (const p of pads) {
    const y = Y(p.u);
    img.fine(p.x - 10, y - 10, 21, 21, (FXr, FYr, xx, yy) => {
      const d = Math.hypot(xx - p.x, yy - y);
      if (d > 10) return null;
      if (d > 8.4) return d > 9.6 ? C.snow[0] : (FYr < y * S ? C.snow[3] : C.snow[1]);
      if (hashPx(FXr >> 1, FYr >> 1, 3) < 0.06) return 0x8a867e; // (boot prints)
      return rampColor(C.packed, 0.55 + fbm(FXr / S, FYr / S, { seed: 2, scale: 3 }) * 0.4 + (hashPx(FXr, FYr, 4) - 0.5) * 0.2, FXr, FYr);
    });
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
      // (fine segments: two pixels thick, bevelled ends, a faint glow of the unlit ones)
      const r = new HiCanvas(3, 7);
      const seg = (on, pts) => {
        for (const [x, y] of pts) r.px(x, y, on ? 0xe8fff0 : 0x203024, on ? 1 : 0.6);
      };
      const hz = (y0) => [1, 2, 3, 4, 5, 6, 7].flatMap((x) => [[x, y0], [x, y0 + 1]]);
      const vt = (x0, y0) => [1, 2, 3, 4, 5, 6, 7, 8].flatMap((y) => [[x0, y0 + y], [x0 + 1, y0 + y]]);
      seg(a, hz(0));
      seg(b, vt(0, 0));
      seg(c, vt(7, 0));
      seg(dd, hz(10));
      seg(e, vt(0, 10));
      seg(f, vt(7, 10));
      seg(g, hz(19));
      return kit.frame(r);
    });
    // minutes (tens, ones) : seconds (tens, ones)
    [[1 / 600, 10], [1 / 60, 10], [1 / 10, 6], [1, 10]].forEach(([fps, n], i) => kit.loop(80 + i * 5 + (i > 1 ? 2 : 0), U(33), digit.slice(0, n), { fps, ph: 0 }));
    const colon = new HiCanvas(1, 4);
    for (const [x, y] of [[1, 1], [1, 2], [1, 9], [1, 10]]) colon.px(x, y, 0xe8fff0);
    kit.loop(90, U(35), [kit.frame(colon)], { seq: [0, -1], fps: 2, ph: 0 });
  }

  // ------------------------------------------------------------ time of day, then the lights
  const tint = TOD.map(([, , t]) => rgb(t));
  {
    const d = img.hi.data;
    const row = W * S * 4;
    for (let FYr = 0; FYr < L * S; FYr++) {
      const u = L - (FYr + 0.5) / S;
      let i = 0;
      while (i < TOD.length - 2 && u >= TOD[i + 1][0]) i++;
      const t = smooth(TOD[i][0], TOD[i + 1][0], u);
      const mul = TOD[i][1].map((m, k) => m + (TOD[i + 1][1][k] - m) * t);
      const tc = tint[i].map((c, k) => c + (tint[i + 1][k] - c) * t);
      const amt = TOD[i][3] + (TOD[i + 1][3] - TOD[i][3]) * t;
      for (let p = FYr * row; p < (FYr + 1) * row; p += 4) {
        if (!d[p + 3]) continue;
        for (let k = 0; k < 3; k++) {
          const v = d[p + k] * mul[k];
          d[p + k] = v + (tc[k] - v) * amt;
        }
      }
    }
  }
  for (const { x, y, r, c, k } of pools) {
    const [cr, cg, cb] = rgb(c);
    const CX = x * S;
    const CY = y * S;
    const R = r * S;
    for (let FYr = Math.floor(CY - R); FYr <= CY + R; FYr++)
      for (let FXr = Math.floor(CX - R); FXr <= CX + R; FXr++) {
        const q = img.rgbaPx(FXr, FYr);
        if (!q || !q[3]) continue;
        const dd = Math.hypot(FXr + 0.5 - CX, FYr + 0.5 - CY) / R;
        if (dd >= 1) continue;
        const f = (1 - dd) ** 1.6 * k;
        img.setRGBAPx(FXr, FYr, Math.min(255, q[0] + cr * f), Math.min(255, q[1] + cg * f), Math.min(255, q[2] + cb * f), q[3]);
      }
  }
  for (const [x, y, c, a] of lights) img.light(x, y, c, a);
  for (const [X, Yy, c, a] of lightsFine) img.px(X, Yy, c, a);

  // projection mapping on the snow castle (live): bands of colour sweeping up its walls and roofs, in turn
  if (castle) {
    const PROJ = [0xff50c0, 0x50a8ff, 0xffd050, 0x9a60ff, 0x50e0c0, 0xff7040];
    const frames = PROJ.map((col, f) => {
      const out = new HiCanvas(castle.x1 - castle.x0, castle.y1 - castle.y0, S, castle.x0, castle.y0);
      const [cr, cg, cb] = rgb(col);
      for (let FYr = castle.y0 * S; FYr < castle.y1 * S; FYr++)
        for (let FXr = castle.x0 * S; FXr < castle.x1 * S; FXr++) {
          if (!castle.mask.has(Math.floor(FYr / S) * W + Math.floor(FXr / S))) continue;
          const band = (castle.y1 * S - FYr + f * 27) % 108;
          if (band > 54) continue;
          const k = 0.5 * Math.sin((band / 54) * Math.PI);
          const q = img.rgbaPx(FXr, FYr);
          if (q && q[3]) out.setRGBAPx(FXr, FYr, q[0] + (cr - q[0]) * k, q[1] + (cg - q[1]) * k, q[2] + (cb - q[2]) * k, 255);
        }
      return kit.frame(out);
    });
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
      // (bent over the big snow shovel, a knitted hat, the coat, the blade full of snow on the upswing)
      const r = new HiCanvas(4, 5);
      for (let i = 3; i < 6; i++) {
        r.px(i, 0, 0xd83a3a);
        r.px(i, 1, i === 5 ? 0x2a2026 : 0xe8c0a0);
      }
      for (let j = 2; j < 8; j++) for (let i = 2; i < 6; i++) r.px(i, j, i === 5 ? scaleColor(c, 0.75) : c);
      for (let k = 0; k < 4; k++) r.px(6 + k, (f ? 7 : 3) + (f ? -k : k) * 0.5 | 0, 0x6a5a4a); // the shovel's handle
      for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) r.px(9 + i, (f ? 2 : 6) + j, j === 0 && f ? 0xf4f6fa : 0x3a7ac8); // its blade
      r.px(3, 8, 0x2a2a3a);
      r.px(5, 9, 0x2a2a3a);
      for (let i = 2; i < 8; i++) r.px(i, 11, 0x101018, 0.35);
      return frameAt(r, 1700);
    };
    const toss = [0, 1, 2, 3].map((k) => {
      const r = new HiCanvas(6, 6);
      for (let i = 0; i < 10 + k * 3; i++) r.px(Math.min(17, 4 + k * 3 + (i % 4)), Math.max(0, 12 - k * 3 + Math.floor(i / 4) - 1), i % 3 ? 0xf4f6fa : 0xd8e0ec, k > 2 ? 0.5 : 0.95);
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
      const r = new HiCanvas(7, 7);
      const n = [2, 4, 6, 6, 4][k];
      for (let i = 0; i < n; i++) {
        const a = i * 2.4 + k;
        const d = k * 0.7 + (i % 3) * 0.4;
        for (let q = 0; q < 3; q++) r.px(Math.round(10 + Math.cos(a) * d * S) + q % 2, Math.min(20, Math.round((1 + k) * S + Math.sin(a) * d * S * 0.5)) + (q >> 1), q ? 0xd8e0ec : 0xf4f6fa, k > 3 ? 0.5 : 0.9);
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
      const dark = new HiCanvas(1, 1);
      dark.set(0, 0, C.windowDark);
      const f = frameAt(dark, k * 256 + 128);
      const parts = wins.filter(() => fr() < 0.22).map(([x, u]) => [0, x, u, fr() * 20]);
      if (parts.length) kit.wave([f], parts, { w: 0.12, a0: 0, a1: 1, pw: 7, d: 0.05 });
    }
  }

  const chunks = [];
  for (let i = 0; i < CHUNKS; i++) chunks.push(img.crop(0, i * CHUNK, W, CHUNK));
  return { strip: img.hi, chunks, props: kit.pack(), meta: { width: W, artScale: S, chunkHeight: CHUNK, chunks: CHUNKS, length: L, tint: tintTable(L, tod.white) } };
}

export { mix };
