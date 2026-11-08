// Middle layer (Osaka), seen from above in 3/4 view: Osaka Castle in spring (hanami crowds under the
// cherries, food stalls, the plum grove, the Nishinomaru koi pond with its red bridge and tea house, wide
// green moats with petal rafts, swans and weeping cherries, mossy ishigaki walls with two-storey tamon
// walls, three-tier turrets and studded gates, and the five-roofed keep in green copper and gold with its
// balcony, stone steps and entrance keep), Nakanoshima between
// two rivers (the red-brick Central Public Hall, the domed library, City Hall, the rose garden), the
// towers of Umeda (the Sky Building, a red Ferris wheel on a rooftop, the station under its great glass
// roof), Shinsekai with Tsūtenkaku, lanterns and neon, Dōtonbori canal lined with giant food signs, then
// Osaka by night: the lantern-lit Hōzen-ji Yokochō, Namba Yasaka's giant lion head, the Kuromon market,
// Shitennō-ji's pagoda and cloisters, Sumiyoshi Taisha's arched bridge and lantern rows, the Tempozan
// waterfront (the Ferris wheel, the aquarium, a fountain) and the bay with its red bridge and fishing boats.
// Graded from afternoon to night; windows, neon and lamps glow after the grade. River water is
// transparent (the far layer shows through); the castle moats are painted.
// Live (see ../props.mjs): both Ferris wheels turn (Tempozan's ring of lights chasing round), boats
// cruise the rivers and the canal, trains pull in and out under Umeda's glass roof, swans and koi swim,
// neon signs light up letter by letter and billboards chase, the giant crab waves its claws, lantern
// strings sway, the fountain plays, neon reflections shimmer on the water and fishing boats drift; the crowd
// streams over Ebisu-bashi, strollers walk the canal banks, the food stalls' griddles steam and the office
// windows of Umeda and Nakanoshima go dark and light up; pigeons take off from the castle plazas, the yatai on
// Tempozan's promenade steam, and tugboats work past the container cranes in the bay.
//
// Coordinates: u = distance from the bottom of the strip (stage start), strip y = L - u.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Raster, fbm, rng, bayer, scaleColor, rgb, mix } from '../../lib/raster.mjs';
import { crownPixels, rampColor } from '../nature.mjs';
import { PropKit, Window, puff, todGrade, tintTable, planTraffic } from '../props.mjs';
import { drawLionHall } from './lion-hall.mjs';
import { HiCanvas, hashPx } from '../hires.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export const W = 180;
export const S = 3; // fine pixels per logical one: drawn 540 px wide, laid out in the game's 180
export const CHUNK = 512;
export const CHUNKS = 14;
export const L = CHUNK * CHUNKS;

const CASTLE = [0, 1290];
const TOSABORI = [1300, 1360];
const NAKANOSHIMA = [1360, 1910];
const DOJIMA = [1910, 1970];
const UMEDA = [1970, 2950];
const SHINSEKAI = [2950, 3750];
const DOTONBORI = [3750, 4950];
const PORT = [4950, 6430]; // Osaka by night, ending at the Tempozan waterfront
const SENNICHIMAE = 3757; // the street along the canal's south bank, where the three avenues end

const C = {
  grass: [0x3e6a34, 0x4c7c3c, 0x5e8c48, 0x749c58],
  lawn: [0x4a7a3a, 0x5a8a44, 0x6c9a50, 0x84ac5e],
  gravel: [0xa89e88, 0xb8ae98, 0xc8bea8, 0xd6ccb6],
  asphalt: [0x3c3c42, 0x48484e, 0x54545a],
  walk: [0x84868a, 0x929496, 0xa0a2a2],
  paving: [0x8e8a84, 0x9c9890, 0xaaa69e],
  stone: [0x6a665e, 0x827e74, 0x9a968a, 0xb2aea0],
  ishi: [0x5e5a52, 0x76726a, 0x8e8a80, 0xa8a498, 0xc0bcb0],
  moat: [0x24423e, 0x2e524c, 0x3a625a, 0x4e786c],
  copper: [0x2e6a5a, 0x3e8270, 0x529a86, 0x6eb4a0, 0x9ad0c0],
  tileRoof: [0x2e3036, 0x3c3e46, 0x4c4e58, 0x62646e],
  plaster: [0xc8ccd0, 0xe2e4e4, 0xf4f4f0],
  brick: [0x8a3a26, 0xa84a30, 0xc05a3a],
  roofs: [0x8a8e96, 0xa8a49c, 0x7a6e62, 0x5a6470, 0x9a5a4a, 0x6a7468, 0xb8b0a4, 0x9a9ca2],
  walls: [0xd8d0c0, 0xc4c2bc, 0xb8a890, 0xe0dcd2, 0x9aa4ae, 0xcabaa4, 0xe8e2d6],
  glass: [0x6a8aa8, 0x7a9ab8, 0x5a7a98, 0x8aa8c0, 0x6a8a9a],
  warm: 0xffd88a,
  cool: 0xd8ecff,
  lamp: 0xffb868,
  gold: 0xe8b830,
  goldHi: 0xfff0a0,
};
const NEON = [0xff4aa8, 0x40e8ff, 0xffe040, 0x66ff8a, 0xff8a30, 0xb46cff, 0xff5050];
const CARS = [0xe8e8ec, 0x2a2a30, 0xc03a30, 0x3a5a9a, 0x9aa0a8, 0xe8d8a0, 0x2a2a30];

const TOD = [
  [0, [1.0, 0.97, 0.92], 0xffd8a0, 0.05],
  [1900, [1.02, 0.9, 0.78], 0xff9a50, 0.08],
  [2950, [0.74, 0.62, 0.8], 0x6a3a7a, 0.12],
  [3750, [0.5, 0.5, 0.72], 0x18143a, 0.12],
  [L, [0.5, 0.5, 0.72], 0x18143a, 0.12],
];

const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function buildMid() {
  const stage = JSON.parse(readFileSync(join(root, 'src', 'data', 'stage5.json'), 'utf8'));
  const { mid: V, anchor } = stage.scroll;
  let img = new HiCanvas(W, L, S);
  const rand = rng(5505);
  const Y = (u) => Math.round(L - u);
  const U = (y) => L - y;
  const reserved = new Uint8Array(W * L);
  const water = new Uint8Array(W * L);
  const isRes = (x, y) => x >= 0 && x < W && y >= 0 && y < L && reserved[Math.floor(y) * W + Math.floor(x)];
  const anyRes = (x0, y0, w, h) => {
    for (let y = Math.floor(y0); y < y0 + h; y++) for (let x = Math.max(0, Math.floor(x0)); x < Math.min(W, x0 + w); x++) if (isRes(x, y)) return true;
    return false;
  };
  const reserveRect = (x0, y0, w, h) => {
    for (let y = Math.max(0, Math.floor(y0)); y < Math.min(L, y0 + h); y++)
      for (let x = Math.max(0, Math.floor(x0)); x < Math.min(W, x0 + w); x++) reserved[y * W + x] = 1;
  };
  const objects = [];
  const lights = [];
  const lightsFine = []; // single fine pixels lit after the grade: lamp panes, sparks, neon strokes
  const pools = [];
  const kit = new PropKit(5515, { artScale: S }); // the moving parts
  const frame0 = kit.frame.bind(kit);
  kit.frame = (r, name) => frame0(r.hi ?? r, name); // (frames are drawn on HiCanvases)
  // steam off the stalls' takoyaki and yakisoba griddles (live)
  const stallSteam = [2, 3, 4].map((r) => [0, 1].map((v) => kit.frame(puff(r * S, r * 23 + v, [0xa8a8b0, 0xc8c8d0, 0xe4e4ea, 0xffffff]))));
  const tod = todGrade(TOD, smooth);
  /**
   * Draw with the stage's own helpers into a frame at (x0, y0) (strip pixels): graded for its place, lit
   * by its own light pools, then its lights painted on. The pools light the strip too only if `pools`.
   * Never draw anything that takes from `rand` in here: the rest of the strip would change.
   */
  const capture = (x0, y0, w, h, draw, opt = {}) => {
    const keep = img;
    const nl = lights.length;
    const nf = lightsFine.length;
    const np = pools.length;
    img = new HiCanvas(w, h, S, x0, y0);
    draw();
    const out = img;
    img = keep;
    const lit = lights.splice(nl);
    const litFine = lightsFine.splice(nf);
    const cast = opt.pools ? pools.slice(np) : pools.splice(np);
    tod.frame(out, opt.u ?? U(y0 + h / 2));
    for (const pl of cast) applyPool(out, pl);
    for (const [x, y, c, a] of lit) out.light(x, y, c, a);
    for (const [X, Yy, c, a] of litFine) out.px(X, Yy, c, a);
    return kit.frame(out);
  };
  // neon that comes alive at night: tubes lighting letter by letter, billboards chasing (frames shared)
  const NEON_OFF = [0x2a2430, 0x201a26];
  const tubes = new Map();
  const tubeFrames = (h) => {
    if (!tubes.has(h))
      tubes.set(
        h,
        Array.from({ length: h }, (_, j) => {
          const out = new HiCanvas(2, h);
          for (let k = j; k < h; k++) for (const i of [0, 1]) out.set(i, k, NEON_OFF[i]);
          return kit.frame(out);
        }),
      );
    return tubes.get(h);
  };
  const boards = new Map();
  const boardFrames = (w) => {
    if (!boards.has(w))
      boards.set(
        w,
        [0, 1, 2].map((p) => {
          const out = new HiCanvas(w, 6);
          for (let i = 0; i < w; i++) if ((i + p) % 3 === 0) for (const yy of [0, 5]) out.set(i, yy, NEON_OFF[0]);
          return kit.frame(out);
        }),
      );
    return boards.get(w);
  };
  const glow = (x, y, c, a = 1) => lights.push([Math.round(x), Math.round(y), c, a]);
  const glowPx = (X, Yy, c, a = 1) => lightsFine.push([Math.round(X), Math.round(Yy), c, a]);
  const pool = (x, y, r, c, k = 0.5) => pools.push({ x, y, r, c, k });
  /** Add a pool of light (after the grade): brightens the pixels around (x, y). */
  const applyPool = (target, { x, y, r, c, k }) => {
    const [cr, cg, cb] = rgb(c);
    const CX = x * S;
    const CY = y * S;
    const R = r * S;
    for (let FYr = Math.floor(CY - R); FYr <= CY + R; FYr++)
      for (let FXr = Math.floor(CX - R); FXr <= CX + R; FXr++) {
        const q = target.rgbaPx(FXr, FYr);
        if (!q || !q[3]) continue;
        const dd = Math.hypot(FXr + 0.5 - CX, FYr + 0.5 - CY) / R;
        if (dd >= 1) continue;
        const f = (1 - dd) ** 1.6 * k;
        target.setRGBAPx(FXr, FYr, Math.min(255, q[0] + cr * f), Math.min(255, q[1] + cg * f), Math.min(255, q[2] + cb * f), q[3]);
      }
  };
  const shadowRect = (x, y, w, h, f = 0.6) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) img.tint(x + i, y + j, f);
  };
  const fill = (x0, y0, w, h, ramp, seed, scale = 5) => {
    for (let y = Math.floor(y0); y < y0 + h; y++) for (let x = Math.floor(x0); x < x0 + w; x++) img.set(x, y, rampColor(ramp, 0.2 + fbm(x, y, { seed, scale, octaves: 2 }) * 0.65, x, y));
  };
  const night = (u) => smooth(SHINSEKAI[0] - 200, DOTONBORI[0], u); // how lit the windows are

  const pads = stage.waves.filter((w) => w.type === 'turret').map((w) => ({ x: w.x, u: anchor + V * w.t + 10 }));
  for (const p of pads) reserveRect(p.x - 12, Y(p.u) - 12, 24, 24);

  // ------------------------------------------------------------ 1. ground and water
  const isWater = (x, u) => {
    // rivers across, the canal down the middle and the open bay
    if ((u >= TOSABORI[0] && u < TOSABORI[1]) || (u >= DOJIMA[0] && u < DOJIMA[1])) return true;
    if (u >= DOTONBORI[0] + 30 && u < DOTONBORI[1] - 30 && x >= 64 && x < 116) return true;
    // (it runs on off the east edge at its south end and off the west edge at its north end, like the real
    // Dōtonbori between two rivers)
    if (u >= DOTONBORI[0] + 30 && u < DOTONBORI[0] + 50 && x >= 64) return true;
    if (u >= DOTONBORI[1] - 50 && u < DOTONBORI[1] - 30 && x < 116) return true;
    if (u >= PORT[1] + 2) return true; // (the bay, behind the straight quay wall)
    return false;
  };
  for (let y = 0; y < L; y++) {
    const u = U(y);
    for (let x = 0; x < W; x++) {
      if (isWater(x, u)) {
        water[y * W + x] = 1;
        continue;
      }
      // (paving slabs: two logical pixels a slab, the joints dark, a grain of light and dark specks)
      const base = 0.3 + fbm(x, y, { seed: 11, scale: 6, octaves: 2 }) * 0.6;
      for (let j = 0; j < S; j++)
        for (let i = 0; i < S; i++) {
          const X = x * S + i;
          const Yf = y * S + j;
          const row = Math.floor(Yf / 6);
          const joint = Yf % 6 === 0 || (X + (row % 2) * 3) % 6 === 0;
          const g = hashPx(X, Yf, 12);
          const slab = hashPx(Math.floor((X + (row % 2) * 3) / 6), row, 13);
          img.px(X, Yf, joint ? scaleColor(rampColor(C.walk, base, X, Yf), 0.93) : rampColor(C.walk, base + (slab - 0.5) * 0.12 + (g - 0.5) * 0.1, X, Yf));
        }
    }
  }
  // stone embankments along every water edge
  for (let y = 1; y < L - 1; y++)
    for (let x = 0; x < W; x++) {
      if (water[y * W + x]) continue;
      const edge = water[(y - 1) * W + x] || water[(y + 1) * W + x] || (x > 0 && water[y * W + x - 1]) || (x < W - 1 && water[y * W + x + 1]);
      if (edge)
        for (let j = 0; j < S; j++)
          for (let i = 0; i < S; i++) {
            // (the coping stones along the edge: long blocks, their joints, a lit arris)
            const X = x * S + i;
            const Yf = y * S + j;
            const joint = (X + Math.floor(Yf / 3) * 4) % 9 === 0;
            img.px(X, Yf, joint ? C.stone[0] : hashPx(X, Yf, 14) < 0.2 ? C.stone[3] : C.stone[(x + y) % 3 === 0 ? 1 : 2]);
          }
      // the embankment wall seen below a bank (water to the south): coursed blocks, a wet dark line at the foot
      if (y + 2 < L && !water[y * W + x] && water[(y + 1) * W + x])
        for (let j = 0; j < S; j++)
          for (let i = 0; i < S; i++) {
            const X = x * S + i;
            const Yf = (y + 1) * S + j;
            const joint = j === 0 || (X + (j > 1 ? 3 : 0)) % 7 === 0;
            img.px(X, Yf, j === S - 1 ? 0x1e2a2e : joint ? C.stone[0] : hashPx(X, Yf, 15) < 0.25 ? C.stone[2] : C.stone[1]);
          }
    }
  const W_ = (x, y) => x >= 0 && x < W && y >= 0 && y < L && water[y * W + x];

  // ------------------------------------------------------------ helpers
  const roadPx = (x, y, across, hw, lanes = true, overWater = false, horiz = false) => {
    if (W_(x, y) && !overWater) return;
    for (let j = 0; j < S; j++)
      for (let i = 0; i < S; i++) {
        const X = x * S + i;
        const Yf = y * S + j;
        const af = across + (horiz ? -((j + 0.5) / S - 0.5) : (i + 0.5) / S - 0.5);
        const along = horiz ? X : Yf;
        const a = Math.abs(af);
        let c;
        if (a > hw + 0.5) {
          const joint = (horiz ? Yf : X) % 6 === 0 || along % 9 === 0;
          c = joint ? scaleColor(C.paving[0], 0.9) : rampColor(C.paving, fbm(x, y, { seed: 33, scale: 3 }) + (hashPx(X, Yf, 34) - 0.5) * 0.25, X, Yf);
        } else if (a > hw - 0.5) c = a > hw + 0.17 ? 0xb4b2ac : a > hw - 0.17 ? 0x8a8a8e : 0x2e2e34; // (the kerb, lit; the gutter)
        else {
          c = rampColor(C.asphalt, fbm(x, y, { seed: 31, scale: 4, octaves: 2 }) + (hashPx(X, Yf, 32) - 0.5) * 0.35, X, Yf);
          if (fbm(X * 0.08, Yf * 0.08, { seed: 35, scale: 3 }) > 0.72) c = scaleColor(c, 0.88); // (patched asphalt)
          if (lanes && hw > 4 && Math.abs(a - hw / 2) < 0.2 && along % 18 < 9) c = 0xd8d4c8;
          if (lanes && hw > 6 && Math.abs(a - 0.25) < 0.14) c = 0xe0b040; // the double yellow centre line
        }
        img.px(X, Yf, c);
      }
  };
  const vRoad = (cx, hw, u0, u1, lanes = true) => {
    for (let u = u0; u < u1; u++) for (let x = Math.floor(cx - hw - 2); x <= cx + hw + 1; x++) roadPx(x, Y(u), x + 0.5 - cx, hw, lanes);
    reserveRect(cx - hw - 3, Y(u1), hw * 2 + 6, u1 - u0);
  };
  const hRoad = (uc, hw, x0 = 0, x1 = W, lanes = true) => {
    for (let u = Math.floor(uc - hw - 2); u <= uc + hw + 1; u++) for (let x = x0; x < x1; x++) roadPx(x, Y(u), u + 0.5 - uc, hw, lanes, false, true);
    reserveRect(x0, Y(uc + hw + 3), x1 - x0, hw * 2 + 6);
  };
  /** Zebra crossings on a vertical road just before and after a cross street (sides: -1 south, 1 north). */
  const crossing = (cx, hw, uc, hwc, sides = [-1, 1]) => {
    for (const s of sides) {
      const u0 = uc + s * (hwc + 3);
      for (let k = 0; k < 4; k++)
        for (let X = Math.ceil(cx - hw + 1) * S; X < (cx + hw) * S; X++) if (X % 6 < 4) for (let j = 0; j < S; j++) if (hashPx(X, Y(u0 + s * k) * S + j, 36) > 0.12) img.px(X, Y(u0 + s * k) * S + j, 0xe8e8e0);
    }
  };
  /** A traffic light on a corner: the post at (x, y), its head showing c towards the junction's middle (x 90). */
  const signal = (x, y, c) => {
    img.rect(x, y - 1, 1, 2, 0x2a2a30);
    img.rect(x - 1, y - 3, 3, 2, 0x1a1a20);
    glow(x + (x < 90 ? 1 : -1), y - 3, c);
    pool(x, y - 2, 5, c, 0.25);
  };
  /** A zebra crossing over a horizontal street (centre uc, half width hw), four pixels wide from x0. */
  const hCrossing = (uc, hw, x0) => {
    for (let x = x0; x < x0 + 4; x++)
      for (let FYr = Y(uc + hw - 1) * S; FYr < Y(Math.ceil(uc - hw + 1)) * S; FYr++) if (FYr % 6 < 4) for (let i = 0; i < S; i++) if (hashPx(x * S + i, FYr, 37) > 0.12) img.px(x * S + i, FYr, 0xe8e8e0);
  };
  const car = (x, y, vertical, color = rand.pick(CARS)) => {
    const w = vertical ? 4 : 7;
    const h = vertical ? 7 : 4;
    objects.push({
      y: y + h,
      shadow: () => shadowRect(x + 1, y + 1, w, h, 0.6),
      draw: () => {
        // (fine: rounded body lit along one side, the bonnet, windscreen, roof, rear window, mirrors)
        const FW = w * S;
        const FH = h * S;
        const X0 = x * S;
        const Y0 = y * S;
        for (let j = 0; j < FH; j++)
          for (let i = 0; i < FW; i++) {
            if ((i === 0 || i === FW - 1) && (j === 0 || j === FH - 1)) continue;
            const a = vertical ? j : FW - 1 - i; // along, from the front
            const n = vertical ? FH : FW;
            const side = vertical ? i : j;
            const sn = vertical ? FW : FH;
            let c = side === 0 ? scaleColor(color, 1.2) : side === sn - 1 ? scaleColor(color, 0.7) : color;
            if (a >= n * 0.22 && a < n * 0.34) c = 0x2a3440; // windscreen
            else if (a >= n * 0.34 && a < n * 0.7 && side > 0 && side < sn - 1) c = scaleColor(color, 1.12); // roof
            else if (a >= n * 0.7 && a < n * 0.8) c = 0x34404c; // rear window
            img.px(X0 + i, Y0 + j, c);
          }
        if (vertical) {
          img.px(X0 - 1, Y0 + Math.round(FH * 0.3), scaleColor(color, 0.8));
          img.px(X0 + FW, Y0 + Math.round(FH * 0.3), scaleColor(color, 0.8));
        }
        if (night(U(y)) > 0.3) {
          const lights = vertical ? [[1, FH - 1], [FW - 2, FH - 1]] : [[FW - 1, 1], [FW - 1, FH - 2]];
          for (const [i, j] of lights) glowPx(X0 + i, Y0 + j, 0xfff0c8, 0.9);
          const tails = vertical ? [[1, 0], [FW - 2, 0]] : [[0, 1], [0, FH - 2]];
          for (const [i, j] of tails) glowPx(X0 + i, Y0 + j, 0xff3020, 0.8);
        }
      },
    });
  };
  /**
   * A bridge carrying a street (centre cx, half width hw, as vRoad) over the water from u0 to u1: the same
   * carriageway, lane markings and pavements as the road, so it lines up with it exactly, stone parapets
   * just outside them, lamps on the parapets.
   */
  const bridge = (cx, hw, u0, u1, lamps) => {
    const x0 = Math.floor(cx - hw - 3); // the parapets
    const x1 = Math.floor(cx + hw + 2);
    const deck = () => {
      for (let u = u0; u < u1; u++) {
        const y = Y(u);
        for (let x = x0; x <= x1; x++) {
          if (x === x0 || x === x1) for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) img.px(x * S + i, y * S + j, (y * S + j) % 6 === 0 ? C.stone[3] : i === (x === x0 ? 0 : S - 1) ? C.stone[0] : i === 1 ? C.stone[3] : C.stone[2]);
          else roadPx(x, y, x + 0.5 - cx, hw, true, true); // (the deck, over the water)
        }
        if (lamps && u % 14 === 0)
          for (const px of [x0, x1]) {
            img.set(px, y, 0x3a3a40);
            for (let i = -1; i <= 1; i++) img.px(px * S + 1 + i, (y - 1) * S + 1, 0x2a2a30);
            glowPx(px * S + 1, (y - 1) * S, 0xfff8d8);
            glow(px, y - 1, 0xfff0c8, 0.5);
            pool(px, y, 8, C.lamp, 0.3 * night(u) + 0.05);
          }
      }
    };
    // the deck again over the boats on the river (live layer), so they pass under it; the traffic goes over it
    kit.loop(x0, u1, [capture(x0, Y(u1), x1 - x0 + 1, u1 - u0 + 1, deck)], { d: 0.04 });
    objects.push({
      y: Y(u0),
      shadow: () => shadowRect(x1 + 1, Y(u1), 3, u1 - u0, 0.55),
      draw: () => {
        deck();
        // the shadow of the deck on the water below
        for (let x = x0; x <= x1; x++) img.tint(x, Y(u0) + 1, 0.6);
      },
    });
  };
  // the streets that cross Nakanoshima and its two rivers, lined up with Umeda's beyond: [x, half width]
  const NORTH_SOUTH = [[30, 5], [90, 8], [150, 5]]; // (Midōsuji in the middle)
  /**
   * A building in 3/4 view: a flat roof with a parapet and rooftop clutter (units, tanks, machine rooms,
   * antennas, helipads, billboards), and a front face whose style sets the windows: 'glass' curtain walls,
   * 'office' rows, 'brick', 'shop' (awnings and neon), 'warehouse'. Windows light up towards night.
   */
  const building = (x, y, w, h, faceH, opt = {}) => {
    const style = opt.style ?? 'office';
    const roof = opt.roof ?? rand.pick(C.roofs);
    const wall = opt.wall ?? (style === 'glass' ? rand.pick(C.glass) : style === 'brick' ? C.brick[1] : rand.pick(C.walls));
    const n = night(U(y));
    const litP = opt.lit ?? 0.08 + n * 0.6;
    const off = 3 + Math.round(faceH * 0.35);
    const items = [];
    const nItems = Math.max(1, Math.floor((w * h) / 140));
    for (let i = 0; i < nItems; i++) items.push([rand.pick(opt.items ?? ['ac', 'ac', 'ac', 'tank', 'hut', 'solar']), x + 2 + Math.floor(rand() * Math.max(1, w - 9)), y + 2 + Math.floor(rand() * Math.max(1, h - 7))]);
    const tall = faceH >= 20;
    const heli = tall && w >= 22 && h >= 18 && rand() < 0.4;
    const mast = tall && !heli && rand() < 0.6;
    const lit_ = [];
    for (let k = 0; k < 400; k++) lit_.push(rand() < litP);
    const litFloors = [];
    for (let k = 0; k < 40; k++) litFloors.push(rand() < litP * 0.8);
    const signs = [];
    const ns = opt.neon ? Math.max(1, Math.floor(w / 7)) : 0;
    for (let i = 0; i < ns; i++) signs.push({ x: x + 2 + Math.floor((i + 0.5) * ((w - 4) / ns)), c: rand.pick(NEON), h: Math.max(3, Math.min(faceH - 3, 4 + Math.floor(rand() * 8))) });
    const board = opt.billboard ? { c: rand.pick(NEON), c2: rand.pick(NEON), w: Math.min(w - 4, 10 + Math.floor(rand() * 12)) } : null;
    if (n > 0.45) {
      // after dark some tubes light up letter by letter and flash, others flicker; billboards chase
      for (const s of signs) {
        if (kit.rand() > 0.5) continue;
        const f = tubeFrames(s.h);
        const seq = kit.rand() < 0.6 ? [...f.map((_, j) => j), -1, -1, -1, -1, 0, -1, 0, -1, -1, -1, -1, -1, -1, -1] : [...Array(26).fill(-1), 0, -1, 0, -1];
        kit.loop(s.x, U(y + h + 1), f, { seq, fps: 6, fx: 1 });
      }
      if (board && kit.rand() < 0.7) kit.loop(x + Math.floor((w - board.w) / 2), U(y + 2), boardFrames(board.w), { fps: 5, fx: 1 });
    }
    const awn = rand.pick([0xc83a2a, 0x2a6a3a, 0x2a4a8a, 0xd8a020, 0x8a2a5a]);
    objects.push({
      y: y + h + faceH,
      shadow: () => shadowRect(x + off, y + off, w, h + faceH, 0.5),
      draw: () => {
        const X0 = x * S;
        const X1 = (x + w) * S;
        const Y0 = y * S;
        const Y1 = (y + h) * S;
        const br = rng(x * 131 + y * 7);
        const glowing = n > 0.25; // (after dark the lit windows shine, painted after the grade)
        const lamp = (X, Yy, c, a = 0.92) => (glowing ? glowPx(X, Yy, c, a) : img.px(X, Yy, scaleColor(c, 0.92)));
        // the roof: a membrane in panels with their seams and stains, the parapet's coping lit on the north
        // and west, its shadow inside
        for (let Yy = Y0; Yy < Y1; Yy++)
          for (let X = X0; X < X1; X++) {
            const e = Math.min(X - X0, Yy - Y0);
            const e2 = Math.min(X1 - 1 - X, Y1 - 1 - Yy);
            let c;
            if (e < 2) c = scaleColor(roof, e === 0 ? 1.25 : 1.12);
            else if (e2 < 2) c = scaleColor(roof, e2 === 0 ? 0.62 : 0.78);
            else if (e === 2) c = scaleColor(roof, 0.8);
            else {
              c = roof;
              if ((X - X0) % 15 === 0 || (Yy - Y0) % 12 === 0) c = scaleColor(roof, 1.06);
              if (fbm(X * 0.15, Yy * 0.15, { seed: 7, scale: 3 }) > 0.66) c = scaleColor(roof, 0.92);
              const g = hashPx(X, Yy, 8);
              if (g < 0.06) c = scaleColor(c, 0.9);
              else if (g > 0.96) c = scaleColor(c, 1.08);
            }
            img.px(X, Yy, c);
          }
        for (const [kind, ix, iy] of items) {
          const IX = ix * S;
          const IY = iy * S;
          if (kind === 'ac') {
            // outdoor units in a row: the casing, the fan behind its grille, the pipes, their shadows
            for (let k = 0; k < 3; k++) {
              const UX = IX + k * 9;
              for (let j = 0; j < 8; j++)
                for (let i = 0; i < 7; i++) {
                  if (j === 7) {
                    img.px(UX + i + 1, IY + j, 0x101018, 0.4);
                    continue;
                  }
                  const d = Math.hypot(i - 3, j - 3.5);
                  img.px(UX + i, IY + j, i === 0 || j === 0 ? 0xdadee2 : i === 6 || j === 6 ? 0x7a7e84 : d < 2.6 ? (d < 1 ? 0x8a8e94 : (i + j) % 2 ? 0x3a3e44 : 0x5a5e64) : 0xbcc0c4);
                }
            }
            for (let k = 0; k < 20; k++) img.px(IX + 3 + k, IY - 2, 0x6a6e74);
          } else if (kind === 'tank') {
            // a water tank on its stand: the drum lit from the top left, its rim, the ladder up the side
            for (let j = -7; j <= 7; j++)
              for (let i = -7; i <= 7; i++) {
                const d = Math.hypot(i, j);
                if (d > 6.8) continue;
                img.px(IX + 6 + i, IY + 6 + j, d > 5.8 ? 0x6a6e74 : i + j < -5 ? 0xf4f6f8 : i + j > 5 ? 0x9a9ea4 : 0xc8ccd0);
              }
            for (let j = 0; j < 8; j++) img.px(IX + 13, IY + 3 + j, j % 2 ? 0x5a5e64 : 0x8a8e94);
            for (let i = 0; i < 12; i++) img.px(IX + 2 + i, IY + 13, 0x101018, 0.4);
          } else if (kind === 'hut') {
            // a stair hut: its own roof with a lip, the wall, the steel door and a lamp over it
            for (let j = 0; j < 18; j++)
              for (let i = 0; i < 21; i++) {
                let c;
                if (j < 12) c = j === 0 || i === 0 ? scaleColor(roof, 1.25) : i === 20 || j === 11 ? scaleColor(roof, 0.75) : scaleColor(roof, 1.08);
                else c = i > 6 && i < 12 && j > 13 ? 0x3a3e46 : i === 20 ? scaleColor(wall, 0.7) : j === 12 ? scaleColor(wall, 0.6) : scaleColor(wall, 0.88);
                img.px(IX + i, IY + j, c);
              }
            lamp(IX + 9, IY + 13, C.warm);
          } else if (kind === 'solar') {
            // solar panels: cells in a grid in their frames, the sky in the glass
            for (let j = 0; j < 12; j++)
              for (let i = 0; i < 24; i++) img.px(IX + i, IY + j, i % 6 === 0 || j % 6 === 0 ? 0x8a9ab8 : (i + j) % 5 === 0 ? 0x4a6aa8 : 0x26366a);
          } else if (kind === 'garden') {
            // a roof garden: lawn, shrubs in clumps, a path of stepping stones, a bench
            for (let j = 0; j < 15; j++)
              for (let i = 0; i < 27; i++) {
                const X = IX + i;
                const Yy = IY + j;
                let c = rampColor(C.grass, 0.4 + fbm(X * 0.3, Yy * 0.3, { seed: 77, scale: 2 }) * 0.5, X, Yy);
                if (fbm(X * 0.4, Yy * 0.4, { seed: 78, scale: 2 }) > 0.62) c = (i + j) % 3 ? 0x2a5a2a : 0x3e7a3a;
                if (j === 7 && i % 4 < 2) c = 0xb8b2a4;
                img.px(X, Yy, c);
              }
          }
        }
        // what the roof is used for (its own random numbers, so the layout stays as it was): a terrace garden, the
        // top deck of a car park, a tower's stepped crown, a beer garden under lanterns
        {
          const kind = br();
          const big = w >= 16 && h >= 12 && style !== 'warehouse' && style !== 'shop';
          const IX0 = X0 + 6;
          const IX1 = X1 - 6;
          const IY0 = Y0 + 6;
          const IY1 = Y1 - 6;
          if (big && !tall && kind < 0.18) {
            // a terrace garden: lawn in beds edged with timber, shrubs, a pergola's slats, benches, a path
            for (let Yy = IY0; Yy < IY1; Yy++)
              for (let X = IX0; X < IX1; X++) {
                const bx = (X - IX0) % 18;
                const by = (Yy - IY0) % 15;
                let c;
                if (bx < 2 || by < 2) c = bx === 0 || by === 0 ? 0x8a6a48 : 0xb8b0a0;
                else {
                  c = rampColor(C.grass, 0.35 + fbm(X * 0.3, Yy * 0.3, { seed: 79, scale: 2 }) * 0.5, X, Yy);
                  if (fbm(X * 0.45, Yy * 0.45, { seed: 80, scale: 2 }) > 0.64) c = (X + Yy) % 3 ? 0x2a5a2a : 0x4a8a3e;
                }
                img.px(X, Yy, c);
              }
            for (let X = IX0; X < IX0 + 15 && X < IX1; X++) for (let Yy = IY0; Yy < IY0 + 12 && Yy < IY1; Yy += 3) img.px(X, Yy, 0xd8c8a8);
          } else if (big && !tall && kind < 0.32) {
            // the top deck of a car park: lanes, bays painted on the deck, cars parked, the ramp's opening
            for (let Yy = IY0; Yy < IY1; Yy++)
              for (let X = IX0; X < IX1; X++) {
                const lx = X - IX0;
                const ly = (Yy - IY0) % 30;
                let c = hashPx(X, Yy, 83) < 0.1 ? 0x5a5a62 : 0x6a6a72;
                if (ly >= 12 && ly <= 17) c = 0x5a5a62;
                else if (lx % 12 === 0) c = 0xe8e4dc;
                img.px(X, Yy, c);
              }
            for (let Yy = IY0 + 1; Yy < IY1 - 12; Yy += 30)
              for (let X = IX0 + 2; X < IX1 - 9; X += 12) {
                if (br() < 0.3) continue;
                const cc = br.pick(CARS);
                for (let j = 0; j < 11; j++) for (let i = 0; i < 8; i++) if (!((i === 0 || i === 7) && (j === 0 || j === 10))) img.px(X + i, Yy + j, j > 2 && j < 4 ? 0x2a3440 : j > 7 && j < 9 ? 0x34404c : i === 0 ? scaleColor(cc, 1.2) : i === 7 ? scaleColor(cc, 0.7) : cc);
              }
            for (let j = 0; j < 12; j++) for (let i = 0; i < 15; i++) img.px(IX1 - 16 + i, IY1 - 13 + j, (i + j) % 4 === 0 ? 0x3a3a42 : 0x4a4a52);
          } else if (big && tall && kind < 0.4) {
            // a stepped crown: the upper block set back, its own parapet, a band of light round its top
            const ins = Math.floor(Math.min(X1 - X0, Y1 - Y0) * 0.22);
            for (let Yy = Y0 + ins; Yy < Y1 - ins; Yy++)
              for (let X = X0 + ins; X < X1 - ins; X++) {
                const e = Math.min(X - X0 - ins, X1 - ins - 1 - X, Yy - Y0 - ins, Y1 - ins - 1 - Yy);
                img.px(X, Yy, e === 0 ? scaleColor(roof, 1.3) : e === 1 ? scaleColor(roof, 0.75) : scaleColor(roof, 1.06));
              }
            for (let Yy = Y1 - ins; Yy < Y1 - ins + 8 && Yy < Y1 - 2; Yy++)
              for (let X = X0 + ins; X < X1 - ins; X++) {
                const fy = Yy - (Y1 - ins);
                if (fy >= 3 && fy <= 5 && (X - X0) % 4 < 3) lamp(X, Yy, (X >> 3) % 2 ? C.cool : C.warm);
                else img.px(X, Yy, fy === 0 ? scaleColor(wall, 0.6) : wall);
              }
          } else if (big && !tall && kind < 0.45 && n > 0.2) {
            // a beer garden for the evening: tables under strings of lanterns, people at them
            for (let Yy = IY0; Yy < IY1; Yy++) for (let X = IX0; X < IX1; X++) img.px(X, Yy, (X + Yy) % 6 === 0 ? 0x7a5a3a : 0x8a6a48);
            for (let Yy = IY0 + 6; Yy < IY1 - 6; Yy += 15) {
              for (let X = IX0; X < IX1; X++) img.px(X, Yy + Math.round(Math.sin((X - IX0) * 0.2) * 1.5), 0x2a2224);
              for (let X = IX0 + 2; X < IX1; X += 6) glowPx(X, Yy + 2, (X >> 2) % 2 ? 0xff5a30 : 0xffe0a0, 0.95);
              for (let X = IX0 + 4; X < IX1 - 10; X += 18) {
                for (let j = 0; j < 4; j++) for (let i = 0; i < 9; i++) img.px(X + i, Yy + 6 + j, 0xd8c8a8);
                personPx(X - 3, Yy + 7, br);
                personPx(X + 10, Yy + 7, br);
              }
            }
            pool(x + w / 2, y + h / 2, Math.min(w, h) * 0.6, 0xffb060, 0.3);
          }
        }
        if (heli) {
          // the helipad: its painted ring and H, the edge lights
          const HX = (x + Math.floor(w / 2)) * S + 1;
          const HY = (y + Math.floor(h / 2)) * S + 1;
          const R = (Math.min(w, h) / 2 - 2) * S;
          for (let j = -R; j <= R; j++)
            for (let i = -R; i <= R; i++) {
              const d = Math.hypot(i, j);
              if (d > R) continue;
              img.px(HX + i, HY + j, Math.abs(d - (R - 3)) < 0.8 ? 0xe8e0c8 : d > R - 1 ? 0x3a3e44 : 0x5a5e66);
            }
          for (let k = -7; k <= 7; k++) {
            img.px(HX - 5, HY + k, 0xe8e0c8);
            img.px(HX - 4, HY + k, 0xe8e0c8);
            img.px(HX + 4, HY + k, 0xe8e0c8);
            img.px(HX + 5, HY + k, 0xe8e0c8);
          }
          for (let k = -4; k <= 4; k++) img.px(HX + k, HY, 0xe8e0c8);
          for (let k = 0; k < 8; k++) glowPx(HX + Math.round(Math.cos((k * Math.PI) / 4) * R), HY + Math.round(Math.sin((k * Math.PI) / 4) * R), 0x80ff80, 0.8);
        }
        if (mast) {
          // a radio mast with its cross-arms, the red light on top
          const MX = (x + w - 5) * S + 1;
          for (let j = 0; j < 20; j++) img.px(MX, (y + 2) * S + j, j % 4 ? 0x9a9ea4 : 0xd8dce0);
          for (const j of [5, 11]) for (let i = -3; i <= 3; i++) img.px(MX + i, (y + 2) * S + j, 0x8a8e94);
          glowPx(MX, (y + 2) * S - 1, 0xff3a2a);
          glow(x + w - 5, y + 1, 0xff3a2a, 0.4);
        }
        if (tall) for (const [ax, ay] of [[X0 + 1, Y0 + 1], [X1 - 2, Y0 + 1]]) glowPx(ax, ay, 0xff3a2a);
        // the front: floors of windows (frames, sills, panes lit or dark, curtains, a plant or a figure at the
        // glass), the curtain walls' mullions and floor bands, brick courses round arched windows, corrugated
        // warehouse sheeting and its loading doors
        const FY0 = Y1;
        const FH = faceH * S;
        for (let r = 0; r < FH; r++) {
          const Yy = FY0 + r;
          const floor = Math.floor(Math.max(0, r - 3) / 9);
          const rr = (r - 3 + 900) % 9;
          for (let X = X0; X < X1; X++) {
            const cx = X - X0;
            const fw = X1 - X0;
            let c = null;
            let lit = false;
            if (style === 'glass') {
              const streak = Math.abs(((cx + r * 0.6) % 66) - 18) < 6;
              c = scaleColor(wall, (streak ? 1.25 : 1) * (1.12 - (r / FH) * 0.25));
              if (cx % 6 === 0) c = scaleColor(wall, 0.7);
              if (rr === 0) c = scaleColor(wall, 0.78);
              if (r > 2 && rr !== 0 && cx % 6 !== 0 && litFloors[floor % 40] && lit_[(floor * 7 + Math.floor(cx / 3)) % 400]) {
                lit = true;
                c = floor & 1 ? C.cool : C.warm;
                if (rr === 1 && cx % 6 === 3) c = 0xffffff; // (the ceiling lights)
              }
            } else if (style === 'brick') {
              const course = Math.floor(r / 3);
              c = (cx + (course % 2) * 4) % 8 === 0 || r % 3 === 0 ? 0xc8b8a0 : hashPx(X, Yy, 16) < 0.2 ? C.brick[0] : C.brick[1];
              if (r % 12 === 0) c = 0xe8e0d0;
              const wx = cx % 12;
              if (rr >= 2 && rr <= 7 && wx >= 4 && wx <= 8 && cx > 2 && cx < fw - 3) {
                if (rr === 2 && (wx === 4 || wx === 8)) c = C.brick[1];
                else if (wx === 4 || wx === 8 || rr === 7) c = 0xf0ece0;
                else if (lit_[(floor * 5 + Math.floor(cx / 12)) % 400]) {
                  lit = true;
                  c = wx === 6 ? 0xe8c070 : C.warm;
                } else c = rr === 3 && wx === 5 ? 0x6a7a8a : 0x2a2a30;
              }
            } else if (style === 'warehouse') {
              c = cx % 2 ? wall : scaleColor(wall, 0.86);
              if (r >= FH - 15 && cx % 36 > 9 && cx % 36 < 27) c = (r - (FH - 15)) % 3 === 0 ? 0x4a4a52 : 0x3a3a40;
              if (r === 4 && cx % 18 === 6) {
                lit = glowing;
                c = C.lamp;
              }
            } else {
              c = r < 2 ? scaleColor(wall, 1.05) : wall;
              if (hashPx(X, Yy, 17) < 0.04) c = scaleColor(c, 0.94);
              const wx = cx % 6;
              if (rr === 7 && cx > 1 && cx < fw - 2) c = scaleColor(wall, 1.12); // (the sills)
              if (rr >= 2 && rr <= 6 && cx > 2 && cx < fw - 3 && wx >= 1 && wx <= 4) {
                const on = lit_[(floor * 11 + Math.floor(cx / 3)) % 400];
                if (rr === 2 || wx === 1 || wx === 4) c = scaleColor(wall, 0.72);
                else if (on) {
                  lit = true;
                  c = (cx & 8 ? C.warm : C.cool);
                  const k = hashPx(Math.floor(cx / 6), floor, 18 + x);
                  if (k < 0.3 && rr <= 4) c = scaleColor(c, 0.82); // (a curtain half drawn)
                  if (k > 0.85 && rr >= 4 && wx === 2) c = 0x2a2a30; // (someone at the window)
                } else {
                  c = style === 'shop' ? 0x3a3038 : 0x2e3846;
                  if (rr === 3 && wx === 3) c = 0x5a6a7a; // (the sky in the glass)
                }
              }
            }
            if (X === X0) c = scaleColor(c, 1.08);
            if (X >= X1 - 2) c = scaleColor(c, X === X1 - 1 ? 0.7 : 0.85);
            if (r === 0) c = scaleColor(wall, 0.55);
            if (lit && !(X === X0 || X >= X1 - 2 || r === 0)) lamp(X, Yy, c);
            else img.px(X, Yy, c);
          }
        }
        if (style === 'shop' || opt.awning) {
          // shop fronts: the striped awning with its scalloped edge, its shadow, the lit shop window under it
          const AY = (y + h + faceH - 4) * S;
          for (let X = X0 + 3; X < X1 - 3; X++) {
            const st = Math.floor((X - X0) / 3) % 2;
            for (let j = 0; j < 5; j++) img.px(X, AY + j, j === 0 ? scaleColor(st ? awn : 0xf0ece0, 1.1) : st ? awn : 0xf0ece0);
            if ((X - X0) % 3 !== 1) img.px(X, AY + 5, st ? scaleColor(awn, 0.7) : 0xc8c4b8);
            img.px(X, AY + 6, 0x101018, 0.5);
            for (let j = 7; j < 11; j++) lamp(X, AY + j, (X - X0) % 9 === 0 ? 0x6a5a4a : hashPx(X, j, 19) < 0.15 ? br.pick([0xff7a8a, 0x7ad0ff, 0xffe070]) : C.warm, 0.5 + n * 0.45);
          }
        }
        for (const sg of signs) {
          // a vertical neon sign: its characters in a dark frame, the tubes along its edges
          const SX = sg.x * S - 1;
          const SY = (y + h + 1) * S;
          const SH = sg.h * S;
          for (let j = 0; j < SH; j++) {
            for (let i = 1; i < 5; i++) img.px(SX + i, SY + j, 0x14101a);
            glowPx(SX, SY + j, sg.c, 0.95);
            glowPx(SX + 5, SY + j, sg.c, 0.95);
          }
          for (let k = 0; k + 4 < SH; k += 5) glyph(SX + 1, SY + 1 + k, 4, k % 10 ? 0xffffff : sg.c, br);
          pool(sg.x + 0.5, y + h + faceH + 2, 9, sg.c, 0.35);
        }
        if (board) {
          // a rooftop billboard: a frame of chasing bulbs, the lit picture, a line of characters, its legs
          const BX = (x + Math.floor((w - board.w) / 2)) * S;
          const BY = (y + 2) * S;
          const BW = board.w * S;
          for (let j = 0; j < 18; j++)
            for (let i = 0; i < BW; i++) {
              if (j === 0 || j === 17 || i === 0 || i === BW - 1) {
                if ((i + j) % 2) glowPx(BX + i, BY + j, board.c);
                else img.px(BX + i, BY + j, 0x14101a);
              } else glowPx(BX + i, BY + j, mix(board.c2, 0x14101a, 0.35 + 0.35 * Math.sin(i * 0.25 + j * 0.3)), 0.92);
            }
          for (let k = 0; k * 6 + 8 < BW; k++) glyph(BX + 4 + k * 6, BY + 6, 5, 0xffffff, br);
          for (const lx of [3, BW - 4]) for (let j = 18; j < 24; j++) img.px(BX + lx, BY + j, 0x5a5a60);
          pool(BX / S + board.w / 2, BY / S + 3, board.w * 0.7, board.c, 0.3);
        }
      },
    });
    reserveRect(x - 1, y - 1, w + 2, h + faceH + 2);
  };
  /** Pack a rectangle with buildings in columns; style picks sizes and fronts. */
  const district = (x0, x1, u0, u1, kind) => {
    const S = {
      tower: { w: [16, 34], bh: [44, 96], face: [0.35, 0.5], styles: ['glass', 'glass', 'office', 'office'], gap: 2 },
      office: { w: [14, 28], bh: [30, 56], face: [0.3, 0.45], styles: ['office', 'office', 'glass', 'brick'], gap: 2 },
      shop: { w: [10, 20], bh: [20, 34], face: [0.28, 0.4], styles: ['shop'], gap: 1 },
      canal: { w: [12, 24], bh: [32, 48], face: [0.3, 0.4], styles: ['shop', 'office'], gap: 1 },
      town: { w: [12, 22], bh: [22, 36], face: [0.25, 0.35], styles: ['office', 'shop'], gap: 1 },
    }[kind];
    let x = x0;
    while (x < x1 - 8) {
      const w = Math.min(x1 - x, S.w[0] + Math.floor(rand() * (S.w[1] - S.w[0])));
      const cw = x1 - x - w < 8 ? x1 - x : w; // the last column takes the rest
      let u = u0;
      while (u < u1 - 14) {
        let bh = Math.min(u1 - u, S.bh[0] + Math.floor(rand() * (S.bh[1] - S.bh[0])));
        if (u1 - u - bh < 14) bh = u1 - u;
        const top = Y(u + bh);
        const ww = cw - S.gap;
        if (anyRes(x, top, ww, bh)) {
          // try a smaller building beside whatever is in the way
          bh = Math.max(14, Math.floor(bh / 2));
          if (anyRes(x, Y(u + bh), ww, bh)) {
            u += 6;
            continue;
          }
        }
        const face = Math.max(5, Math.round(bh * (S.face[0] + rand() * (S.face[1] - S.face[0]))));
        const style = rand.pick(S.styles);
        building(x, Y(u + bh), ww, bh - face, face, { style, neon: kind === 'shop' || kind === 'canal' ? rand() < 0.8 : rand() < 0.15 * night(u), billboard: kind === 'shop' || kind === 'canal' ? rand() < 0.5 : rand() < 0.1, items: style === 'glass' ? ['ac', 'hut', 'tank', 'garden'] : undefined });
        u += bh + S.gap;
      }
      x += cw;
    }
  };
  const tree = (kind, x, y, r, src = rand) => {
    const seed = Math.floor(src() * 1e9);
    const cx = Math.round(x);
    const cy = Math.round(y);
    const px = () => crownPixels(kind, cx * S + 1, cy * S + 1, r * S, rng(seed), seed & 1023);
    const off = Math.round((2 + r * 0.3) * S);
    objects.push({
      y: cy + r * 0.6,
      shadow: () => {
        for (const p of px()) img.tintPx(p.x + off, p.y + off + S, 0.55);
      },
      draw: () => {
        for (const p of px()) img.px(p.x, p.y, p.c);
      },
    });
  };
  const lantern = (x, y, c = 0xff5a30) => {
    glow(x, y, c);
    glow(x, y + 1, 0xffd080, 0.8);
    pool(x, y + 1, 5, c, 0.3);
  };
  /** A written character from afar: strokes in an s x s box at fine (X, Y), lit after the grade. */
  const glyph = (X, Yy, sz, c, r, put = (gx, gy, gc) => glowPx(gx, gy, gc)) => {
    for (let k = 0; k < sz; k++) {
      put(X + k, Yy, c);
      if (r() < 0.5) put(X + k, Yy + sz - 1, c);
    }
    const vx = X + 1 + Math.floor(r() * Math.max(1, sz - 2));
    for (let k = 0; k < sz; k++) put(vx, Yy + k, c);
    if (r() < 0.6) for (let k = 0; k < sz - 1; k++) put(X + k, Yy + Math.floor(sz / 2), c);
  };
  /** A person seen from above in fine pixels: hair or a hat, the face, shoulders and arms, legs, a shadow. */
  const personPx = (X, Yy, pr, o = {}) => {
    const coat = o.coat ?? pr.pick([0xd04040, 0x3a6ad0, 0xe8c040, 0xe8e8f0, 0xff7ab0, 0x6aaa5a, 0x3a3a4a]);
    const hair = o.hat ? pr.pick([0xe8e0d0, 0xd8b070, 0x2a2a34, 0xc83a3a]) : pr.pick([0x1a1418, 0x2a2024, 0x3a2a20, 0x5a3a28, 0xb88a50]);
    for (let i = 0; i < 4; i++) img.px(X + i, Yy + 5, 0x141824, 0.4);
    img.px(X, Yy - 2, hair);
    img.px(X + 1, Yy - 2, scaleColor(hair, 1.2));
    img.px(X + 2, Yy - 2, hair);
    img.px(X, Yy - 1, 0xe8c0a0);
    img.px(X + 1, Yy - 1, 0xf0d0b0);
    img.px(X + 2, Yy - 1, o.hat ? hair : 0xe0b898);
    for (let j = 0; j < 3; j++) for (let i = -1; i < 4; i++) if (!(j === 2 && (i < 0 || i > 2))) img.px(X + i, Yy + j, i < 0 || i > 2 ? scaleColor(coat, 0.75) : i === 0 ? scaleColor(coat, 1.15) : coat);
    const leg = pr() < 0.5 ? 0x2a2a3a : 0x4a4a5a;
    img.px(X, Yy + 3, leg);
    img.px(X + 2, Yy + 3, leg);
    img.px(X, Yy + 4, 0x1a1418);
    img.px(X + 2, Yy + 4, 0x1a1418);
  };
  const crowd = (x0, y0, w, h, n, any = false, src = rand) => {
    for (let i = 0; i < n; i++) {
      const x = Math.round(x0 + src() * w);
      const y = Math.round(y0 + src() * h);
      if (!any && (isRes(x, y) || W_(x, y))) continue;
      const coat = src() < 0.5 ? src.pick([0xd04040, 0x3a6ad0, 0xe8c040, 0xe8e8f0, 0xff7ab0, 0x6aaa5a]) : 0x3a3a4a;
      const hat = src() < 0.2;
      personPx(x * S, y * S, rng(x * 977 + y * 13), { coat, hat });
    }
  };

  // ------------------------------------------------------------ A. Osaka Castle in spring
  {
    // the park grounds: lawns with gravel avenues
    for (let u = CASTLE[0]; u < 1186; u++)
      for (let x = 0; x < W; x++) {
        const y = Y(u);
        img.set(x, y, rampColor(C.lawn, 0.25 + fbm(x, y, { seed: 21, scale: 8, octaves: 3 }) * 0.6, x, y));
      }
    const gravelPath = (x0, x1, u0, u1) => {
      for (let u = u0; u < u1; u++) for (let x = x0; x < x1; x++) img.set(x, Y(u), x === x0 || x === x1 - 1 || u === u0 || u === u1 - 1 ? C.gravel[0] : rampColor(C.gravel, 0.3 + fbm(x, u, { seed: 22, scale: 3 }) * 0.6, x, Y(u)));
    };
    /** Moat water, painted: green and still, the walls reflected darker along the far bank. */
    const moat = (x0, x1, u0, u1) => {
      // (fine: the still green water, ripples catching the light, the white walls mirrored under the far bank,
      // rafts of fallen petals drifting, each petal a pixel or two)
      img.fine(x0, Y(u1) + 1, x1 - x0, u1 - u0, (X, Yf) => {
        const x = X / S;
        const u = L - Yf / S;
        let c = rampColor(C.moat, 0.25 + fbm(x, u * 2, { seed: 24, scale: 9, octaves: 2 }) * 0.55 + (fbm(X * 0.3, Yf, { seed: 26, scale: 2 }) - 0.5) * 0.12, X, Yf);
        if (u > u1 - 6) c = scaleColor(c, 0.75);
        if (Math.sin(X * 0.7 + Yf * 0.3 + fbm(x, u, { seed: 25, scale: 4 }) * 8) > 0.94) c = scaleColor(c, 1.25);
        if (u > u1 - 3.4 && u < u1 - 2.4 && fbm(x, u, { seed: 30, scale: 2 }) > 0.35) c = scaleColor(c, 1.6);
        const raft = fbm(x * 0.7, u * 1.4, { seed: 29, scale: 7, octaves: 2 });
        const p = hashPx(X, Yf, 27);
        if (raft > 0.64 && p < (raft - 0.64) * 5) c = p < (raft - 0.64) * 2 ? 0xffe4ee : 0xf2b8cc;
        else if (raft > 0.6 && p > 0.985) c = 0xf2b8cc;
        return c;
      });
      reserveRect(x0, Y(u1), x1 - x0, u1 - u0);
    };
    /** The visible south face of an ishigaki wall: huge fitted stones, long corner stones, lit top edge. */
    const stoneFace = (x0, x1, uTop, h) => {
      const yTop = Y(uTop);
      const r = rng(Math.floor(rand() * 1e9));
      const FX0 = x0 * S;
      const FX1 = x1 * S;
      const FY0 = yTop * S;
      const FH = h * S;
      for (let FYr = 0; FYr < FH; ) {
        const rh = Math.min(FH - FYr, 6 + Math.floor(r() * 5));
        let X = FX0 - Math.floor(r() * 12);
        while (X < FX1) {
          const sw = 9 + Math.floor(r() * 12);
          const base = C.ishi[1 + Math.floor(r() * 3)];
          const mossy = r() < 0.2;
          for (let j = 0; j < rh; j++)
            for (let i = 0; i < sw; i++) {
              const XX = X + i;
              const YY = FY0 + FYr + j;
              if (XX < FX0 || XX >= FX1) continue;
              let cc;
              if (((i === 0 || i === sw - 1) && (j === 0 || j === rh - 1)) || i === sw - 1 || j === rh - 1) cc = mossy && hashPx(XX, YY, 71) < 0.5 ? (hashPx(XX, YY, 74) < 0.5 ? 0x4a6a3a : 0x5a7a44) : C.ishi[0];
              else if (j === 0 || i === 0) cc = scaleColor(base, 1.14);
              else cc = scaleColor(base, 1 + (hashPx(XX, YY, 72) - 0.5) * 0.14 - (i / sw) * 0.06);
              img.px(XX, YY, scaleColor(cc, 1.05 - ((FYr + j) / Math.max(1, FH)) * 0.25));
            }
          X += sw;
        }
        FYr += rh;
      }
      for (const side of [0, 1]) {
        const CX0 = side ? FX1 - 15 : FX0;
        for (let FYc = 0; FYc < FH; FYc++) {
          const long = Math.floor(FYc / 8) % 2;
          const len = long ? 15 : 9;
          const jj = FYc % 8;
          for (let i = 0; i < 15; i++) {
            const li = side ? 14 - i : i;
            if (li >= len) continue;
            img.px(CX0 + i, FY0 + FYc, jj === 7 || li === len - 1 ? C.ishi[0] : jj === 0 ? C.ishi[4] : C.ishi[long ? 3 : 2]);
          }
        }
      }
      for (let X = FX0; X < FX1; X++) {
        img.px(X, FY0, C.ishi[4]);
        img.px(X, FY0 + 1, scaleColor(C.ishi[4], 0.92));
      }
      reserveRect(x0, yTop, x1 - x0, h);
    };
    /** White tamon wall along the top of a stone wall: dark tiled roof, plaster with loopholes. */
    const tamon = (x0, x1, y) => {
      for (let X = x0 * S; X < x1 * S; X++)
        for (let j = 0; j < 18; j++) {
          const Yy = y * S + j;
          const lx = X - x0 * S;
          let c;
          if (j < 9) c = j === 0 ? C.tileRoof[3] : j === 8 ? C.tileRoof[0] : j === 7 ? (X % 3 === 0 ? 0xb8bcc4 : C.tileRoof[0]) : X % 3 === 0 ? C.tileRoof[3] : X % 3 === 1 ? C.tileRoof[1] : C.tileRoof[2];
          else if (j === 9) c = 0x2a2a30;
          else {
            c = j < 17 ? C.plaster[2] : C.plaster[0];
            const lh = lx % 21;
            const tri = Math.floor(lx / 21) % 2;
            if (!tri && j >= 12 && j <= 14 && lh >= 9 && lh <= 11) c = 0x2a2a30;
            if (tri && ((j === 12 && lh === 10) || (j === 13 && lh >= 9 && lh <= 11) || (j === 14 && lh >= 8 && lh <= 12))) c = 0x2a2a30;
            if (hashPx(X, Yy, 73) < 0.04) c = scaleColor(c, 0.95);
          }
          img.px(X, Yy, c);
        }
    };
    /** A long two-storey tamon-yagura along the wall top: tiled roof, rows of windows. */
    const tamon2 = (x0, x1, y) => {
      for (let X = x0 * S; X < x1 * S; X++)
        for (let j = 0; j < 27; j++) {
          const Yy = y * S + j;
          const lx = X - x0 * S;
          let c;
          if (j < 12) c = j === 0 ? C.tileRoof[3] : j === 11 ? C.tileRoof[0] : j === 10 ? (X % 3 === 0 ? 0xb8bcc4 : C.tileRoof[0]) : X % 3 === 0 ? C.tileRoof[3] : X % 3 === 1 ? C.tileRoof[1] : C.tileRoof[2];
          else if (j < 14) c = j === 12 ? 0x2a2a30 : scaleColor(C.plaster[0], 0.7);
          else {
            c = j > 24 ? C.plaster[0] : C.plaster[2];
            const lw = lx % 15;
            if (j >= 17 && j <= 22 && lw >= 5 && lw <= 10) c = lw % 2 ? 0x22222a : 0x4a4a52; // (a latticed window)
            if (hashPx(X, Yy, 75) < 0.04) c = scaleColor(c, 0.95);
          }
          img.px(X, Yy, c);
        }
    };
    /** A turret (yagura): white walls, grey tiled roofs with lifted corners; the big ones get three tiers and a gable. */
    const yagura = (cx, yBase, w, tiers = 2, roofRamp = C.tileRoof) => {
      if (w >= 20) tiers = 3;
      objects.push({
        y: yBase,
        shadow: () => shadowRect(cx - w / 2 + 5, yBase - tiers * 9 + 5, w, tiers * 9, 0.5),
        draw: () => {
          let y = yBase;
          const CXf = Math.round(cx * S);
          for (let t = 0; t < tiers; t++) {
            const ww = w - t * 6;
            const x0 = Math.round(cx - ww / 2);
            const WX0 = (x0 + 1) * S;
            const WX1 = (x0 + ww - 1) * S;
            for (let Yy = (y - 5) * S; Yy < y * S; Yy++)
              for (let X = WX0; X < WX1; X++) {
                const ly = Yy - (y - 5) * S;
                const lx = X - WX0;
                let c = X >= WX1 - 4 ? C.plaster[0] : ly >= 13 ? C.plaster[0] : C.plaster[2];
                if (ly >= 4 && ly <= 9 && lx % 12 >= 4 && lx % 12 <= 8 && lx > 3 && X < WX1 - 6) c = lx % 2 ? 0x22222a : 0x4a4a52;
                if (ly === 0) c = 0x6a6a70;
                img.px(X, Yy, c);
              }
            const ry = (y - 5) * S;
            for (let j = 0; j < 12; j++) {
              const inset = j;
              const RX0 = (x0 - 1) * S + inset;
              const RX1 = (x0 + ww + 1) * S - inset;
              for (let X = RX0; X < RX1; X++) {
                const lx = X - RX0;
                const rx = RX1 - 1 - X;
                let c = lx < 3 ? roofRamp[3] : rx < 3 ? roofRamp[0] : j < 2 ? (j === 0 ? roofRamp[0] : X % 3 === 0 ? 0xb8bcc4 : roofRamp[1]) : X % 3 === 0 ? roofRamp[3] : X % 3 === 1 ? roofRamp[2] : roofRamp[1];
                img.px(X, ry - 1 - j, c);
              }
            }
            // the lifted corners curling up at the eaves
            for (let k = 0; k < 4; k++) {
              img.px((x0 - 1) * S - 1 - k, ry - 2 - k, roofRamp[3]);
              img.px((x0 + ww + 1) * S + k, ry - 2 - k, roofRamp[0]);
            }
            if (t === 0) {
              // a triangular gable with a gold crest on the lowest roof, gold tips on the corners
              for (let j = 0; j < 11; j++)
                for (let X = CXf - 10 + j; X <= CXf + 10 - j; X++) img.px(X, ry - 1 - j, Math.abs(X - CXf) >= 9 - j ? roofRamp[3] : j < 3 ? C.plaster[0] : C.plaster[2]);
              for (const [i, j] of [[0, -4], [-1, -5], [1, -5], [0, -6]]) img.px(CXf + i, ry + j, C.gold);
              img.px((x0 - 1) * S - 5, ry - 6, C.gold);
              img.px((x0 + ww + 1) * S + 4, ry - 6, C.gold);
            }
            y = Math.round((ry - 12) / S);
          }
          // the ridge on top and its two little golden fish
          for (let X = CXf - 6; X <= CXf + 6; X++) img.px(X, y * S + 2, roofRamp[3]);
          for (const sx of [-6, 5]) for (const [i, j, c] of [[0, 0, C.gold], [0, -1, C.goldHi], [sx < 0 ? -1 : 1, -2, C.gold]]) img.px(CXf + sx + i, y * S + 1 + j, c);
        },
      });
    };
    /** The five-roofed keep on its stone base: green copper roofs, white walls, gold everywhere. */
    const keep = (cx, uBase) => {
      const y0 = Y(uBase);
      const floors = [
        [72, 11],
        [60, 10],
        [49, 10],
        [39, 9],
        [29, 11],
      ];
      const roofH = [8, 8, 7, 7, 11];
      // tier rectangles, bottom up, for the drawing and for the stepped shadow
      const tiers = [];
      {
        let y = y0 - 2;
        for (let i = 0; i < floors.length; i++) {
          const [ww, wh] = floors[i];
          tiers.push({ ww, top: y - wh - roofH[i], bot: y });
          y = y - wh - roofH[i] + 2;
        }
      }
      objects.push({
        y: y0 + 20,
        shadow: () => {
          // a stepped shadow thrown to the lower right across the courtyard
          shadowRect(cx - 40, y0 - 8, 92, 26, 0.6);
          for (const t of tiers) shadowRect(Math.round(cx - t.ww / 2) + 14, t.top + 12, t.ww + 4, t.bot - t.top, 0.6);
        },
        draw: () => {
          // the tenshudai: a stone platform with a tall battered face
          for (let yy = y0 - 12; yy < y0; yy++) for (let xx = cx - 46; xx < cx + 46; xx++) img.set(xx, yy, rampColor(C.gravel, 0.5 + fbm(xx, yy, { seed: 26, scale: 2 }) * 0.4, xx, yy));
          stoneFace(cx - 46, cx + 46, uBase, 18);
          img.rect(cx - 46, y0 - 12, 92, 1, C.ishi[4]);
          // stone steps up the face to the entrance, and the small entrance keep beside the main one
          for (let FYr = y0 * S; FYr < (y0 + 18) * S; FYr++) for (let X = (cx - 5) * S; X < (cx + 5) * S; X++) img.px(X, FYr, FYr % 4 === 0 ? C.ishi[4] : FYr % 4 === 3 ? C.ishi[0] : X === (cx - 5) * S || X === (cx + 5) * S - 1 ? C.ishi[1] : C.ishi[3]);
          for (let yy = y0 - 12; yy < y0; yy++) for (let xx = cx + 40; xx < cx + 58; xx++) img.set(xx, yy, rampColor(C.gravel, 0.5, xx, yy));
          stoneFace(cx + 40, cx + 58, uBase, 12);
          for (let yy = y0 - 10; yy < y0 - 2; yy++) for (let xx = cx + 42; xx < cx + 56; xx++) img.set(xx, yy, xx > cx + 53 ? C.plaster[0] : (xx - cx) % 4 === 0 && yy === y0 - 6 ? 0x22222a : C.plaster[1]);
          for (let j = 0; j < 6; j++) for (let xx = cx + 40 + j; xx < cx + 58 - j; xx++) img.set(xx, y0 - 10 - j, xx - cx - 40 < j + 2 ? C.copper[3] : cx + 58 - xx < j + 3 ? C.copper[0] : j === 0 ? C.copper[4] : C.copper[1 + (xx & 1)]);
          img.set(cx + 41, y0 - 11, C.gold);
          img.set(cx + 56, y0 - 11, C.gold);
          // tiers from the bottom up; each roof is drawn over the foot of the wall above it
          let y = y0 - 2;
          const parts = [];
          for (let i = 0; i < floors.length; i++) {
            const [ww, wh] = floors[i];
            const wallTop = y - wh;
            parts.push({ i, ww, wallTop, wallBot: y });
            y = wallTop - roofH[i] + 2;
          }
          const CXf = cx * S;
          // a gold tiger on the top floor's black lacquer (or a crane on the panels between)
          const tiger = (px, py) =>
            (((px - 6) / 4.2) ** 2 + ((py - 4) / 1.6) ** 2 <= 1) || ((px - 10.5) ** 2 + (py - 2.5) ** 2 <= 2.3) || (py === 6 && (px === 4 || px === 8)) || (px === 1 && py >= 2 && py <= 4) || (px === 2 && py === 2);
          const craneAt = (px, py) => (py === 3 && px >= 1 && px <= 11 && Math.abs(px - 6) > 1) || (py === 2 && (px === 2 || px === 10)) || (px === 6 && py >= 2 && py <= 5) || (px === 7 && py === 1);
          // walls first, top to bottom, then roofs top to bottom
          for (let k = parts.length - 1; k >= 0; k--) {
            const { i, ww, wallTop, wallBot } = parts[k];
            const top = i === parts.length - 1;
            const FXa = Math.round(cx - ww / 2) * S;
            const FXb = Math.round(cx + ww / 2) * S;
            const fw = FXb - FXa;
            for (let Yy = wallTop * S; Yy < wallBot * S; Yy++)
              for (let X = FXa; X < FXb; X++) {
                const lx = X - FXa;
                const ly = Yy - wallTop * S;
                let c = lx < 4 ? C.plaster[2] : lx > fw - 8 ? C.plaster[0] : C.plaster[1];
                if (hashPx(X, Yy, 81) < 0.05) c = scaleColor(c, 0.96);
                if (top) {
                  // the top floor: black lacquer panels framed in gold, gold tigers and cranes, the balcony rail
                  const pnl = lx % 21;
                  const pi = Math.floor(lx / 21);
                  c = pnl === 0 ? C.gold : pnl === 1 ? 0x8a6a20 : 0x1a181e;
                  if (pnl > 2 && pnl < 20 && ly > 3 && ly < 26) {
                    const px = pnl - 4;
                    const py = ly - 10;
                    if ((pi % 2 ? craneAt(px, py) : tiger(px, py)) && px >= 0 && px <= 13) c = (px + py) % 3 ? C.gold : C.goldHi;
                  }
                  if (ly >= wallBot * S - wallTop * S - 6) {
                    const rr = ly - (wallBot * S - wallTop * S - 6);
                    c = rr < 2 ? 0xb8382a : rr === 2 || rr === 5 ? 0x8a2a20 : lx % 4 === 0 ? C.gold : 0x3a1a18;
                  }
                } else {
                  // windows under brass heads: dark lattice, a sill below
                  const wx = lx % 12;
                  const wy = ly % 12;
                  if (lx > 5 && lx < fw - 7 && wx >= 4 && wx <= 8) {
                    if (wy === 3) c = 0xb89040;
                    else if (wy >= 4 && wy <= 8) c = wx % 2 ? 0x22222a : 0x3a3a44;
                    else if (wy === 9) c = 0x5a5a62;
                  }
                }
                img.px(X, Yy, c);
              }
            if (top)
              for (let X = FXa - 9; X < FXb + 9; X++) {
                // the balcony running right round the top floor: red rail on gold posts, its shadow
                const by = wallBot * S;
                img.px(X, by - 1, X % 4 === 0 ? C.gold : 0x9a2a20);
                img.px(X, by - 2, X % 4 === 0 ? C.gold : 0x5a1a18);
                img.px(X, by - 8, 0xd8483a);
                img.px(X, by - 7, 0xb8382a);
              }
          }
          for (let k = parts.length - 1; k >= 0; k--) {
            const { i, ww, wallTop } = parts[k];
            const above = parts[i + 1];
            const rhF = roofH[i] * S;
            const eave = (wallTop + 1) * S + 2;
            const topW = (above ? above.ww : ww - 8) * S;
            const botW = (ww + 8) * S;
            // the shadow under the eave on the wall below
            for (let X = Math.round(cx - ww / 2) * S; X < Math.round(cx + ww / 2) * S; X++) for (let j = 1; j < 4; j++) img.tintPx(X, eave + j, 0.82 - (3 - j) * 0.06);
            for (let jf = 0; jf < rhF; jf++) {
              const Yy = eave - jf;
              const t = jf / Math.max(1, rhF - 1);
              const hw = (botW / 2) * (1 - t) ** 0.6 + (topW / 2) * (1 - (1 - t) ** 0.6);
              const XL = Math.round(CXf - hw);
              const XR = Math.round(CXf + hw);
              for (let X = XL; X < XR; X++) {
                const lx = X - XL;
                const rx = XR - 1 - X;
                let c;
                if (lx < 4) c = lx < 2 ? C.copper[4] : C.copper[3];
                else if (rx < 4) c = rx < 2 ? scaleColor(C.copper[0], 0.85) : C.copper[0];
                else if (jf < 2) c = jf === 0 ? C.copper[0] : C.copper[4];
                else if (jf === 2) c = X % 3 === 0 ? C.gold : C.copper[1]; // the gold-faced ends of the round tiles
                else {
                  c = X % 3 === 0 ? C.copper[3] : X % 3 === 1 ? C.copper[2] : C.copper[1];
                  if (t > 0.6) c = scaleColor(c, 1.05);
                  if (hashPx(X, Yy, 82) < 0.05) c = C.copper[4]; // (verdigris)
                }
                img.px(X, Yy, c);
              }
              // the hip ridges running up from the corners
              if (jf > 3) {
                img.px(XL + 4, Yy, C.copper[4]);
                img.px(XL + 5, Yy, C.copper[3]);
                img.px(XR - 5, Yy, C.copper[1]);
                img.px(XR - 6, Yy, C.copper[0]);
              }
              // the lifted corners curling up, gold at their tips
              if (jf === 0)
                for (let q = 0; q < 6; q++) {
                  img.px(XL - 1 - q, Yy - 1 - Math.floor(q * 0.8), C.copper[4]);
                  img.px(XR + q, Yy - 1 - Math.floor(q * 0.8), C.copper[1]);
                  if (q === 5) {
                    img.px(XL - 1 - q, Yy - 2 - Math.floor(q * 0.8), C.gold);
                    img.px(XR + q, Yy - 2 - Math.floor(q * 0.8), C.gold);
                  }
                }
            }
            // gables on the south face: a curved kara-hafu low down, triangular chidori-hafu above, the gold
            // crests at their apexes; little side gables on the bigger roofs
            const gw = Math.min(18, Math.round(ww * 0.3)) * S;
            const gable = (gx, half0, curved, yb) => {
              for (let j = 0; j < half0 + 2; j++) {
                const half = curved ? half0 - Math.round((j * j) / half0) : half0 - j;
                if (half < 0) break;
                for (let X = gx - half; X <= gx + half; X++) {
                  const edge = Math.abs(X - gx) >= half - 2;
                  img.px(X, yb - j, edge ? (Math.abs(X - gx) >= half - 1 ? C.copper[4] : C.copper[2]) : j < 4 ? C.plaster[2] : (X + j) % 6 === 0 ? 0xc8c0a8 : C.plaster[1]);
                }
              }
              const ay = yb - Math.round(half0 * (curved ? 0.6 : 0.85));
              for (const [i, j, c] of [[0, 0, C.gold], [-1, 1, C.gold], [1, 1, C.gold], [0, 2, C.goldHi], [-2, 2, 0x8a6a20], [2, 2, 0x8a6a20], [0, -1, C.goldHi]]) img.px(gx + i, ay + j, c);
              glowPx(gx, ay - 1, C.goldHi, 0.45);
            };
            if (i < parts.length - 1) {
              gable(CXf, gw / 2, i === 0, eave - 3 - (i === 0 ? 0 : S));
              if (ww > 45) for (const sd of [-1, 1]) gable(Math.round(CXf + sd * ww * 0.33 * S), 12, false, eave - 3);
            }
          }
          // the top roof's ridge with the two golden shachihoko, tails up
          const topWall = parts[parts.length - 1].wallTop;
          const ridgeY = (topWall + 1 - roofH[roofH.length - 1] + 1) * S;
          for (let X = CXf - 27; X <= CXf + 27; X++) {
            img.px(X, ridgeY, C.copper[4]);
            img.px(X, ridgeY + 1, C.copper[2]);
            img.px(X, ridgeY + 2, C.copper[0]);
          }
          for (const sd of [-1, 1]) {
            const FX = CXf + sd * 27;
            const fish = [[0, 0], [0, -1], [sd * -1, -1], [0, -2], [sd * -1, -2], [sd * -1, -3], [sd * -2, -3], [sd * -2, -4], [sd * -1, -5], [sd * -3, -5], [sd * -2, -6], [sd, 0], [sd, -1]];
            for (const [i, j] of fish) img.px(FX + i, ridgeY + j, j < -3 ? C.goldHi : C.gold);
            glowPx(FX - sd, ridgeY - 3, C.goldHi, 0.6);
          }
          glow(cx, ridgeY / S - 2, C.goldHi, 0.25);
        },
      });
      reserveRect(cx - 48, y0 - 116, 96, 136);
      reserveRect(cx + 38, y0 - 18, 22, 32);
    };
    const yatai = (x, y, n) => {
      // a row of food stalls with striped awnings and paper lanterns
      for (let k = 0; k < n; k++) {
        const sx = x + k * 9;
        const c = rand.pick([0xc83a2a, 0x2a5aa8, 0xd8a020, 0x2a8a4a, 0xe86aa0]);
        objects.push({
          y: y + 8,
          shadow: () => shadowRect(sx + 2, y + 2, 8, 7, 0.6),
          draw: () => {
            for (let yy = y; yy < y + 4; yy++) for (let xx = sx; xx < sx + 8; xx++) img.set(xx, yy, (xx - sx) % 2 ? c : 0xf4f0e6);
            img.rect(sx, y + 4, 8, 3, 0x6a4a30);
            img.rect(sx + 1, y + 5, 6, 1, 0xd8c8a0);
            glow(sx + 1, y + 4, 0xff8a40, 0.9);
            glow(sx + 6, y + 4, 0xff8a40, 0.9);
          },
        });
        reserveRect(sx, y, 9, 8);
        if (k % 2 === 0) kit.emit(sx + 4, U(y + 5), stallSteam, { rate: 1.2, life: [1.2, 2], vy: 6, sx: 1, wf: 0.6, a: 0.42, tint: 1 }); // the griddle steaming (live)
      }
      crowd(x, y + 8, n * 9, 6, n * 3, true);
    };
    const hanami = (x0, y0, w, h, n) => {
      // blue tarps under the cherries with picnicking parties
      for (let k = 0; k < n; k++) {
        const x = Math.round(x0 + rand() * (w - 8));
        const y = Math.round(y0 + rand() * (h - 6));
        if (anyRes(x - 1, y - 1, 9, 7)) continue;
        img.rect(x, y, 7, 5, rand() < 0.8 ? 0x3a72d8 : 0xe8d050);
        img.rect(x, y + 4, 7, 1, 0x2a52a8);
        for (let j = 0; j < 4; j++) {
          const px = x + Math.floor(rand() * 7);
          const py = y + Math.floor(rand() * 5);
          img.set(px, py, rand.pick([0xe8e8f0, 0x3a3a4a, 0xd04040, 0xe8c040, 0xff9ac0]));
        }
        img.set(x + 3, y + 2, 0xd8a050);
        reserveRect(x, y, 7, 5);
      }
    };
    const boat = (x, y) =>
      objects.push({
        y: y + 14,
        draw: () => {
          for (let k = 0; k < 12; k++) img.set(x + 2 + (k & 1), y + 14 + k, 0xd8e8e0, 0.5 * (1 - k / 12));
          img.rect(x, y + 2, 6, 12, 0x6a3a22);
          img.rect(x + 1, y, 4, 2, 0x6a3a22);
          img.rect(x + 1, y + 3, 4, 7, 0xc8302a);
          img.rect(x + 1, y + 3, 4, 1, C.gold);
          img.rect(x + 1, y + 9, 4, 1, C.gold);
        },
      });
    // live: swans gliding about the moats, koi in the Nishinomaru pond
    const swanF = (() => {
      const out = new HiCanvas(6, 3);
      out.rect(0, 0, 4, 3, 0xf8f8f4);
      out.rect(0, 2, 4, 1, 0xd8dcd8);
      out.set(0, 0, 0xe8ece8);
      out.set(4, 1, 0xf8f8f4);
      out.set(5, 1, 0xe8902a);
      return kit.frame(tod.frame(out, 400));
    })();
    kit.wander(90, 209, 84, 13, [swanF], { n: 3, sp: 3, idle: 0.3 });
    kit.wander(90, 580, 84, 11, [swanF], { n: 2, sp: 3, idle: 0.3 });
    for (const [body, tail] of [[0xf06a20, 0xc84a18], [0xf8f4f0, 0xe83a2a], [0xf0b030, 0xc88a20]]) {
      const koi = (flick) => {
        const out = new HiCanvas(4, 3);
        out.rect(1, 1, 3, 1, body);
        out.set(3, 1, scaleColor(body, 1.1));
        out.set(0, flick ? 0 : 2, tail);
        out.set(0, 1, tail);
        return kit.frame(tod.frame(out, 340));
      };
      kit.wander(52, 330, 20, 14, [koi(false), koi(true)], { n: 2, sp: 5, idle: 0.25, fps: 3 });
    }
    /** A swan gliding on the moat with its little V of a wake. */
    const swan = (x, y) => {
      for (let k = 1; k < 7; k++) {
        img.set(x - k, y + 1 + k, 0xd8e8e0, 0.45 * (1 - k / 7));
        img.set(x + 2 + k, y + 1 + k, 0xd8e8e0, 0.45 * (1 - k / 7));
      }
      img.rect(x, y, 3, 2, 0xf8f8f4);
      img.set(x + 1, y - 1, 0xf8f8f4);
      img.set(x + 1, y - 2, 0xe89030);
    };
    /** Weeping cherries along a bank, their petals and reflection spilling onto the water. */
    const weepers = (u, dir, x0 = 4, x1 = 176) => {
      for (let x = x0; x < x1; x += 11 + Math.floor(rand() * 5)) {
        if (Math.abs(x - 90) < 10) continue;
        tree('sakura', x, Y(u), 5 + rand() * 1.5);
        for (let k = 0; k < 26; k++) {
          const px = Math.round(x + (rand() - 0.5) * 12);
          const py = Math.round(Y(u) - dir * (5 + rand() * 9));
          img.set(px, py, rand() < 0.5 ? 0xf6c8d8 : 0xffe4ee, 0.7);
        }
      }
    };

    // south park: the gravel avenue, a fountain plaza, groves full of hanami parties and food stalls
    gravelPath(84, 96, 0, 186);
    gravelPath(10, 170, 96, 110);
    {
      const cx = 90;
      const cy = Y(103);
      img.disc(cx, cy, 11, C.stone[3]);
      img.disc(cx, cy, 9, 0x4a8aa8);
      img.disc(cx, cy, 3, C.stone[2]);
      img.disc(cx, cy, 1.5, 0xe8f4f8);
      for (let a = 0; a < Math.PI * 2; a += 0.6) img.set(Math.round(cx + Math.cos(a) * 6), Math.round(cy + Math.sin(a) * 6), 0xd0e8f0);
      reserveRect(cx - 12, cy - 12, 24, 24);
    }
    yatai(20, Y(124), 6);
    yatai(108, Y(124), 6);
    yatai(98, Y(60), 4);
    for (let k = 0; k < 70; k++) {
      const x = 4 + rand() * 172;
      const u = 4 + rand() * 176;
      if (!anyRes(x - 4, Y(u) - 4, 8, 8)) tree('sakura', x, Y(u), 4.5 + rand() * 3);
    }
    hanami(0, Y(186), 84, 80, 26);
    hanami(96, Y(186), 84, 80, 26);
    hanami(0, Y(90), 84, 80, 24);
    hanami(96, Y(90), 84, 80, 24);
    crowd(84, Y(186), 12, 186, 60, true);

    // the outer moat (Minami-sotobori), a stone-faced earth bridge into the Ōte gate
    moat(0, W, 186, 232);
    for (let u = 186; u < 232; u++) for (let x = 82; x < 98; x++) img.set(x, Y(u), x < 84 || x > 95 ? C.ishi[x < 84 ? 3 : 1] : rampColor(C.gravel, 0.5, x, Y(u)));
    crowd(84, Y(230), 12, 40, 20, true);
    boat(40, Y(222));
    boat(140, Y(214));
    weepers(183, -1);
    boat(64, Y(226));
    swan(116, Y(204));
    swan(124, Y(208));
    swan(20, Y(200));
    // water lilies in the moat's corners
    for (const [lx, lu] of [[8, 196], [168, 194], [150, 226]])
      for (let k = 0; k < 10; k++) {
        const px = lx + (rand() - 0.5) * 14;
        const py = Y(lu) + (rand() - 0.5) * 8;
        img.disc(px, py, 1.6, 0x4a8a3a);
        img.set(Math.round(px), Math.round(py), k % 3 ? 0x6aaa48 : 0xf8b8d0);
      }
    // the Ninomaru wall rising from the moat, tamon walls and turrets on top
    stoneFace(0, W, 247, 15);
    for (let u = 232; u < 247; u++) for (let x = 82; x < 98; x++) img.set(x, Y(u), 0x1e1a18); // the gate passage
    tamon2(0, 80, Y(256));
    tamon2(100, W, Y(256));
    // the gate's iron-studded doors in the passage
    for (let u = 234; u < 245; u++) for (let x = 84; x < 96; x++) img.set(x, Y(u), x === 89 || x === 90 ? 0x1a1410 : (x + u) % 3 === 0 ? C.gold : 0x3a2418);
    yagura(18, Y(252), 26, 2);
    yagura(162, Y(252), 26, 2);
    yagura(90, Y(252), 30, 2); // the gate tower over the passage
    reserveRect(0, Y(262), W, 30);
    // the Ninomaru: Nishinomaru garden of cherries, the plum grove, Hōkoku shrine, stalls along the avenue
    gravelPath(84, 96, 262, 560);
    gravelPath(4, 176, 400, 410);
    yatai(10, Y(290), 7);
    yatai(108, Y(290), 7);
    // the Nishinomaru garden: a koi pond with an island pine, a red arched bridge, stone lanterns, a tea house
    const cx = 42;
    const cu = 340;
    for (let u = cu - 34; u < cu + 34; u++)
      for (let x = 4; x < 80; x++) {
        const e = ((x - cx) / 36) ** 2 + ((u - cu) / 30) ** 2 + (fbm(x, u, { seed: 41, scale: 8 }) - 0.5) * 0.4;
        if (e >= 1.12 || isRes(x, Y(u))) continue;
        img.set(x, Y(u), e > 1 ? rampColor(C.ishi, 0.3 + fbm(x, u, { seed: 42, scale: 2 }) * 0.6, x, Y(u)) : rampColor([0x2a5a62, 0x346a70, 0x40787c, 0x5a9090], 0.3 + (1 - e) * 0.4 + fbm(x, u, { seed: 43, scale: 4 }) * 0.3, x, Y(u)));
      }
    reserveRect(4, Y(cu + 34), 76, 68);
    img.disc(52, Y(cu + 2), 6, C.ishi[2]);
    tree('pine', 52, Y(cu + 4), 5);
    for (let k = 0; k < 18; k++) {
      const kx = cx + (rand() - 0.5) * 50;
      const ky = Y(cu) + (rand() - 0.5) * 36;
      if (((kx - cx) / 34) ** 2 + ((ky - Y(cu)) / 28) ** 2 > 0.8) continue;
      img.rect(Math.round(kx), Math.round(ky), 2, 1, rand.pick([0xf06a20, 0xf8f4f0, 0xe83a2a, 0xf0b030]));
    }
    for (let j = 0; j < 22; j++) {
      // the taikobashi arching over the pond from the island to the east shore, by the main walk
      const yy = Y(cu) - Math.round(Math.sin((j / 21) * Math.PI) * 3);
      img.rect(58 + j, yy, 1, 4, j % 3 ? 0xc8382a : 0xa82a20);
      img.set(58 + j, yy - 1, 0xe85a4a);
    }
    for (let k = 0; k < 6; k++) img.disc(54 + k * 2, Y(cu + 9 + k * 2.2), 1.2, C.stone[3]); // stepping stones to the tea house
    for (const [lx, lu] of [[12, cu - 26], [72, cu + 24], [58, cu - 28]]) {
      img.rect(lx, Y(lu), 3, 4, C.stone[2]);
      img.rect(lx - 1, Y(lu), 5, 1, C.stone[3]);
    }
    objects.push({
      y: Y(cu + 20) + 10,
      shadow: () => shadowRect(64, Y(cu + 30) + 3, 14, 10, 0.55),
      draw: () => {
        const x = 62;
        const y = Y(cu + 30);
        for (let j = 0; j < 5; j++) img.rect(x + Math.max(0, 2 - j), y + j, 14 - 2 * Math.max(0, 2 - j), 1, j < 2 ? 0x8a7a5a : 0x6a5a42); // thatched roof
        img.rect(x + 1, y + 5, 12, 4, 0x6a4a30);
        img.rect(x + 3, y + 6, 4, 2, 0xe8e0c8);
      },
    });
    {
      // Hōkoku shrine: a stone torii and the hall with its copper roof
      const x = 14;
      const y = Y(520);
      img.rect(x + 4, y + 26, 22, 2, C.stone[1]);
      img.rect(x + 6, y + 28, 2, 8, C.stone[1]);
      img.rect(x + 22, y + 28, 2, 8, C.stone[1]);
      img.rect(x + 3, y + 25, 24, 1, C.stone[3]);
      objects.push({
        y: y + 22,
        shadow: () => shadowRect(x + 4, y + 4, 30, 20, 0.5),
        draw: () => {
          for (let j = 0; j < 12; j++) {
            const inset = Math.max(0, 4 - j);
            for (let xx = x + inset; xx < x + 30 - inset; xx++) img.set(xx, y + j, xx - x < inset + 2 ? C.copper[3] : x + 30 - xx < inset + 3 ? C.copper[0] : j < 5 ? C.copper[2] : C.copper[1]);
          }
          img.rect(x + 1, y + 12, 28, 8, 0xf0ece0);
          for (let xx = x + 2; xx < x + 28; xx += 4) img.rect(xx, y + 12, 1, 8, 0xb8382a);
          img.rect(x + 1, y + 12, 28, 1, 0x2a2224);
          img.rect(x + 12, y + 15, 6, 5, 0x3a2a22);
          glow(x + 15, y + 14, C.warm, 0.8);
        },
      });
      reserveRect(x - 1, y - 1, 32, 38);
    }
    {
      // Miraiza: the old army headquarters, a little stone castle of its own
      const x = 118;
      const y = Y(520);
      building(x, y, 48, 18, 14, { style: 'office', roof: 0x9a7a62, wall: 0xc8a888, items: ['hut', 'ac'] });
      for (const tx of [x - 2, x + 42]) yagura(tx + 4, y + 10, 10, 2, [0x6a4a3a, 0x7a5a48, 0x8a6a56, 0xa08068]);
    }
    // walks up from the cross walk to the shrine's torii and to Miraiza's door
    gravelPath(26, 34, 410, 483);
    gravelPath(138, 146, 410, 487);
    reserveRect(25, Y(483), 10, 73);
    reserveRect(137, Y(487), 10, 77);
    for (let k = 0; k < 90; k++) {
      // the plum grove: small trees in pink, white and red
      const x = 108 + rand() * 68;
      const u = 330 + rand() * 60;
      if (!anyRes(x - 3, Y(u) - 3, 6, 6)) tree(rand() < 0.7 ? 'sakura' : 'tiny', x, Y(u), 2.5 + rand() * 1.5);
    }
    for (let k = 0; k < 110; k++) {
      const x = 4 + rand() * 172;
      const u = 262 + rand() * 290;
      if (!anyRes(x - 4, Y(u) - 4, 8, 8)) tree(rand() < 0.6 ? 'sakura' : rand() < 0.5 ? 'pine' : 'broadleaf', x, Y(u), 3.5 + rand() * 3);
    }
    hanami(4, Y(400), 76, 120, 26);
    crowd(84, Y(560), 12, 300, 80, true);
    crowd(4, Y(410), 172, 10, 40, true);
    weepers(556, -1);

    // the inner moat around the Honmaru, the great stone walls, the Sakura gate
    moat(0, W, 560, 600);
    moat(6, 22, 600, 1010);
    moat(158, 174, 600, 1010);
    moat(6, 174, 990, 1010);
    boat(120, Y(590));
    boat(40, Y(594));
    swan(150, Y(572));
    swan(60, Y(578));
    swan(66, Y(582));
    for (const u of [700, 820, 940]) {
      swan(10 + (u % 3), Y(u));
      swan(163, Y(u + 40));
    }
    for (let u = 560; u < 600; u++) for (let x = 82; x < 98; x++) img.set(x, Y(u), x < 84 || x > 95 ? C.ishi[x < 84 ? 3 : 1] : rampColor(C.gravel, 0.5, x, Y(u)));
    crowd(84, Y(598), 12, 38, 20, true);
    stoneFace(22, 158, 626, 26); // the Honmaru's south face, the tallest stone walls in Japan
    for (const sx of [0, 174]) for (let u = 600; u < 1010; u++) img.rect(sx, Y(u), 6, 1, C.ishi[2]);
    for (let u = 600; u < 1010; u++) {
      img.rect(22, Y(u), 2, 1, C.ishi[3]);
      img.rect(156, Y(u), 2, 1, C.ishi[1]);
    }
    for (let u = 600; u < 626; u++) for (let x = 82; x < 98; x++) img.set(x, Y(u), 0x1e1a18);
    {
      // Takoishi, the giant "octopus stone" in the gate's wall
      const y = Y(624);
      img.rect(56, y, 20, 18, C.ishi[3]);
      img.rect(56, y, 20, 1, C.ishi[4]);
      img.rect(75, y, 1, 18, C.ishi[0]);
      img.rect(56, y + 17, 20, 1, C.ishi[0]);
    }
    tamon2(22, 80, Y(635));
    tamon2(100, 158, Y(635));
    for (let u = 602; u < 624; u++) for (let x = 84; x < 96; x++) img.set(x, Y(u), x === 89 || x === 90 ? 0x1a1410 : (x + u) % 3 === 0 ? C.gold : 0x3a2418);
    yagura(32, Y(631), 22, 2);
    yagura(148, Y(631), 22, 2);
    yagura(90, Y(631), 28, 2); // Sakuramon
    reserveRect(22, Y(640), 136, 14);
    // the Honmaru: lawns and groves around a gravel plaza before the keep, paths to the gates
    for (let u = 640; u < 990; u++)
      for (let x = 24; x < 156; x++) {
        if (isRes(x, Y(u))) continue;
        const plaza = ((x - 90) / 54) ** 2 + ((u - 815) / 105) ** 2 < 1;
        const path = Math.abs(x - 90) < 6;
        img.set(x, Y(u), plaza || path ? rampColor(C.gravel, 0.25 + fbm(x, u, { seed: 27, scale: 5 }) * 0.6, x, Y(u)) : rampColor(C.lawn, 0.25 + fbm(x, u, { seed: 28, scale: 7 }) * 0.6, x, Y(u)));
      }
    keep(90, 800);
    for (let k = 0; k < 420; k++) {
      const x = 26 + rand() * 128;
      const u = 642 + rand() * 344;
      if (((x - 90) / 54) ** 2 + ((u - 815) / 105) ** 2 < 1.05) continue;
      if (Math.abs(x - 90) < 8) continue;
      if (!anyRes(x - 3, Y(u) - 3, 6, 6)) tree(rand.pick(['pine', 'sakura', 'sakura', 'broadleaf']), x, Y(u), 3 + rand() * 3.5);
    }
    // stone lanterns along the path, a souvenir hall, the golden water well under its roof
    for (let u = 650; u < 770; u += 16)
      for (const x of [82, 97]) {
        img.rect(x, Y(u), 2, 3, C.stone[2]);
        img.rect(x - 1, Y(u), 4, 1, C.stone[3]);
      }
    {
      const x = 124;
      const y = Y(700);
      objects.push({
        y: y + 10,
        shadow: () => shadowRect(x + 3, y + 3, 12, 10, 0.55),
        draw: () => {
          for (let j = 0; j < 5; j++) img.rect(x + Math.max(0, 2 - j), y + j, 12 - 2 * Math.max(0, 2 - j), 1, j < 2 ? C.tileRoof[3] : C.tileRoof[1]);
          img.rect(x + 1, y + 5, 10, 4, 0x6a4a30);
          img.rect(x + 3, y + 6, 6, 2, 0x2a4a5a);
          img.set(x + 6, y + 1, C.gold);
        },
      });
    }
    crowd(36, Y(780), 108, 150, 190);
    // flocks of pigeons pecking on the plazas take off all at once, wheel and scatter (live)
    {
      const flock = [0, 1, 2, 3, 4, 5].map((k) => {
        const r = new HiCanvas(19, 15);
        for (let i = 0; i < 9; i++) {
          const a = i * 0.7 + 0.4;
          const d = 1.5 + (i % 3) + k * 1.6;
          const x = Math.round(9 + Math.cos(a) * d * 1.2 + k * 0.8);
          const y = Math.round(10 + Math.sin(a) * d * 0.6 - k * 1.4);
          if (x < 0 || x >= 19 || y < 0 || y >= 15) continue;
          r.set(x, y, 0x8a8c96, k > 4 ? 0.5 : 1);
          if (k && (i + k) % 2) r.set(x + 1, y, 0xd8dae0, k > 4 ? 0.4 : 0.9); // a wing flashing
        }
        return kit.frame(tod.frame(r, 860));
      });
      kit.spot([[56, 940, 68, 110], [60, 150, 60, 40]], flock, { rate: 0.4, fps: 6 });
    }
    crowd(84, Y(990), 12, 200, 40, true);
    // Gokuraku-bashi: the arched wooden bridge out of the Honmaru to the north
    objects.push({
      y: Y(990),
      draw: () => {
        for (let u = 988; u < 1012; u++)
          for (let x = 84; x < 96; x++) img.set(x, Y(u), x === 84 || x === 95 ? 0x5a3a24 : (u & 1) ? 0x8a6a48 : 0x7a5a3c);
      },
    });
    for (let u = 1000; u > 990; u--) crowd(86, Y(u), 8, 1, 1, true);
    // the north grounds and the outer moat beyond, the road
    gravelPath(84, 96, 1010, 1150);
    for (let k = 0; k < 70; k++) {
      const x = 4 + rand() * 172;
      const u = 1012 + rand() * 132;
      if (!anyRes(x - 4, Y(u) - 4, 8, 8)) tree(rand.pick(['sakura', 'broadleaf', 'pine']), x, Y(u), 3.5 + rand() * 3);
    }
    hanami(4, Y(1140), 172, 120, 22);
    weepers(1146, -1);
    moat(0, W, 1150, 1172);
    for (let u = 1150; u < 1172; u++) for (let x = 82; x < 98; x++) img.set(x, Y(u), x < 84 || x > 95 ? C.ishi[x < 84 ? 3 : 1] : rampColor(C.gravel, 0.5, x, Y(u)));
    stoneFace(0, W, 1176, 4);
    hRoad(1186, 5);
    for (const [x, hw] of NORTH_SOUTH) vRoad(x, hw, 1192, TOSABORI[0]);
    for (const [x0, x1] of [[0, 22], [38, 79], [101, 142], [158, W]]) district(x0, x1, 1196, 1298, 'town');
  }

  // ------------------------------------------------------------ B. Nakanoshima between the two rivers
  {
    for (const [bx, hw] of NORTH_SOUTH) {
      bridge(bx, hw, TOSABORI[0] - 2, TOSABORI[1] + 2, true);
      bridge(bx, hw, DOJIMA[0] - 2, DOJIMA[1] + 2, true);
    }
    for (const [bx, hw] of NORTH_SOUTH) vRoad(bx, hw, NAKANOSHIMA[0], NAKANOSHIMA[1]);
    hRoad(1640, 5);
    for (const [bx, hw] of NORTH_SOUTH) crossing(bx, hw, 1640, 5);
    // riverside promenades with lamps and willows
    for (const [u0, u1] of [[1362, 1404], [1866, 1908]]) {
      for (let u = u0; u < u1; u++)
        for (let x = 0; x < W; x++) if (!isRes(x, Y(u)) && !W_(x, Y(u))) img.set(x, Y(u), rampColor(C.lawn, 0.3 + fbm(x, u, { seed: 23, scale: 6 }) * 0.5, x, Y(u)));
      for (let x = 2; x < W; x++) if (!isRes(x, Y(u0 + 3)) && !W_(x, Y(u0 + 3))) img.set(x, Y(u0 + 3), C.paving[2]);
      for (let x = 6; x < W; x += 14) if (!isRes(x, Y(u0 + 4))) glow(x, Y(u0 + 4), 0xfff0c8, 0.8);
    }
    // Central Public Hall: red brick with white stone bands, the great arched copper roof
    {
      const x = 39;
      const y = Y(1612);
      objects.push({
        y: y + 38,
        shadow: () => shadowRect(x + 5, y + 5, 40, 38, 0.5),
        draw: () => {
          for (let yy = y; yy < y + 24; yy++)
            for (let xx = x; xx < x + 40; xx++) {
              const ax = Math.abs(xx - x - 20);
              const arch = ax < 11 && yy < y + 16 - Math.floor((ax * ax) / 30);
              let c = arch ? (yy - y < 3 ? C.copper[4] : xx < x + 22 ? C.copper[2] : C.copper[1]) : (xx + yy) % 3 === 0 ? C.brick[0] : C.brick[1];
              if (!arch && ((yy - y) % 6 === 0 || xx === x || xx === x + 39)) c = 0xe8e0d0;
              img.set(xx, yy, c);
            }
          for (const tx of [x + 1, x + 35]) {
            img.rect(tx, y - 4, 4, 6, C.brick[1]);
            img.disc(tx + 2, y - 4, 2.2, C.copper[2]);
            img.set(tx + 2, y - 7, C.gold);
          }
          img.rect(x + 10, y + 15, 20, 1, 0xf0e8d8);
          for (let yy = y + 24; yy < y + 38; yy++)
            for (let xx = x; xx < x + 40; xx++) img.set(xx, yy, yy === y + 24 ? 0x4a2a20 : (yy - y) % 5 === 0 ? 0xe8e0d0 : (xx - x) % 5 === 2 && (yy - y) % 5 > 1 ? 0x2a2224 : C.brick[2]);
          img.rect(x + 15, y + 31, 10, 7, 0x2a1e1a);
          img.rect(x + 15, y + 31, 10, 1, 0xe8e0d0);
          for (let xx = x + 3; xx < x + 38; xx += 5) glow(xx, y + 28, C.warm, 0.7);
        },
      });
      reserveRect(x - 1, y - 8, 42, 48);
    }
    // City Hall: a grey granite block
    building(109, Y(1620), 32, 22, 14, { style: 'office', roof: 0x8a8a86, wall: 0xb8b2a6, items: ['hut', 'ac'] });
    // the library with its green dome
    {
      const x = 109;
      const y = Y(1840);
      building(x, y, 32, 20, 9, { style: 'office', roof: 0x9a968a, wall: 0xd8d0c0, lit: 0.2, items: ['ac'] });
      objects.push({
        y: y + 24,
        draw: () => {
          img.disc(x + 16, y + 9, 7, C.copper[1]);
          img.disc(x + 15, y + 8, 4, C.copper[3]);
          img.disc(x + 14, y + 7, 1.5, C.copper[4]);
          img.rect(x + 15, y + 1, 2, 2, C.gold);
          for (let xx = x + 5; xx < x + 29; xx += 3) img.rect(xx, y + 21, 1, 8, 0xf0ece0);
        },
      });
    }
    {
      // the rose garden: beds of roses between gravel paths, rose arches
      const x0 = 1;
      const u0 = 1408;
      for (let u = u0; u < u0 + 90; u++)
        for (let x = x0; x < x0 + 21; x++) {
          if (isRes(x, Y(u))) continue;
          const path = (x - x0) % 8 < 2 || (u - u0) % 14 < 2;
          if (!path && rand() < 0.5) rand.pick([0]);
          for (let j = 0; j < S; j++)
            for (let i = 0; i < S; i++) {
              const X = x * S + i;
              const Yy = Y(u) * S + j;
              if (path) {
                img.px(X, Yy, rampColor(C.gravel, 0.5 + hashPx(X, Yy, 97) * 0.3, X, Yy));
                continue;
              }
              // low box hedge round each bed, dark leaves in it, the roses in their colours as little round heads
              const bx = (x - x0) % 8;
              const by = (u - u0) % 14;
              const edge = (bx === 2 && i === 0) || (bx === 7 && i === 2) || (by === 2 && j === 2) || (by === 13 && j === 0);
              let c = edge ? 0x1e4a24 : hashPx(X, Yy, 98) < 0.4 ? 0x2a5a2a : 0x3a6e34;
              const CX = Math.floor(X / 5);
              const CY = Math.floor(Yy / 5);
              const pick = hashPx(CX, CY, 99);
              if (!edge && pick < 0.62) {
                const dx = X % 5 - 2;
                const dy = Yy % 5 - 2;
                if (dx * dx + dy * dy < 4) {
                  const base = [0xd82a4a, 0xf08ab0, 0xf4e0a0, 0xb81a2a, 0xfff4f0, 0xff7a6a][Math.floor(pick * 9.7) % 6];
                  c = dx === 0 && dy === 0 ? scaleColor(base, 0.72) : dx + dy < 0 ? scaleColor(base, 1.15) : base;
                }
              }
              img.px(X, Yy, c);
            }
        }
      // white rose arches over the walks
      for (let u = u0 + 7; u < u0 + 90; u += 14)
        for (let X = (x0 + 2) * S; X < (x0 + 19) * S; X += 3) {
          const t = (X - (x0 + 2) * S) / (17 * S);
          const a = Math.round(Math.sin(t * Math.PI * 3) * 3);
          img.px(X, Y(u) * S + a, 0xf0f0e8);
          img.px(X + 1, Y(u) * S + a + 1, 0xf08ab0);
        }
      reserveRect(x0, Y(u0 + 90), 21, 90);
    }
    for (const [u0, u1] of [[1406, 1631], [1649, 1864]]) for (const [x0, x1] of [[0, 22], [38, 79], [101, 142], [158, W]]) district(x0, x1, u0, u1, 'office');
    for (let k = 0; k < 60; k++) {
      const x = rand() * W;
      const u = rand() < 0.5 ? 1366 + rand() * 34 : 1870 + rand() * 34;
      if (!anyRes(x - 4, Y(u) - 4, 8, 8)) tree(rand() < 0.5 ? 'sakura' : 'broadleaf', x, Y(u), 3.5 + rand() * 2);
    }
    // river cruise boats and a water bus going up and down both rivers (live), bow to the right
    for (const [u, c, sp, right] of [[1338, 0xe8e4dc, 8, true], [1323, 0x3a6aa8, 6, false], [1944, 0xe8e4dc, 7, false], [1930, 0x3a6aa8, 5, true]]) {
      const out = new HiCanvas(20, 7);
      out.rect(0, 0, 20, 7, c);
      out.rect(3, 2, 14, 3, 0x5a7aa0);
      out.rect(3, 2, 14, 1, 0xa8c8e0);
      out.rect(18, 0, 2, 7, scaleColor(c, 0.8));
      const boatF = kit.frame(tod.frame(out, u));
      const wakeF = [0, 1, 2].map((k) => {
        const w = new HiCanvas(1, 9 + k * 4);
        w.set(0, 0, 0xeaf0f0);
        w.set(0, 8 + k * 4, 0xeaf0f0);
        return kit.frame(tod.frame(w, u));
      });
      kit.path(right ? [[-30, u], [210, u]] : [[210, u], [-30, u]], [boatF], { sp, turn: 'flip', wake: { f: wakeF, every: 3, life: 1.8 } });
    }
  }

  // ------------------------------------------------------------ C. Umeda: skyscrapers, the station under its glass roof
  {
    for (const x of [30, 150]) vRoad(x, 5, UMEDA[0], SENNICHIMAE);
    vRoad(90, 8, UMEDA[0], SENNICHIMAE); // Midōsuji (to Sennichimae-dōri on the canal's south bank)
    for (const u of [2100, 2350, 2600, 2900]) {
      hRoad(u, 6);
      for (const [x, hw] of [[30, 5], [90, 8], [150, 5]]) crossing(x, hw, u, 6);
    }
    for (let u = UMEDA[0] + 12; u < DOTONBORI[0]; u += 16) {
      // ginkgo trees along Midōsuji
      for (const x of [79, 101]) tree('broadleaf', x, Y(u), 2.6);
    }
    // live traffic, keeping left as in Japan, all at one speed and started so that no car ever drives through
    // another (planTraffic): both ways up and down the three avenues, each turning in off a cross street at the
    // edge of the screen and off again along another one, so none appears or vanishes in sight (none crosses the
    // station's tracks: they turn off before it and on again after it); both ways along three cross streets
    {
      const SP = 14;
      const cols = [0xe8e8ec, 0x2a2a30, 0xc03a30, 0x3a5a9a, 0x9aa0a8, 0xe8d8a0, 0x4a7a5a];
      const carF = (c, dir) => {
        const side = dir === 'side';
        const r = new HiCanvas(side ? 5 : 3, side ? 3 : 5);
        r.rect(0, 0, r.w, r.h, c);
        if (side) {
          r.rect(1, 0, 3, 3, scaleColor(c, 1.15)); // the roof
          r.rect(3, 0, 1, 3, 0x2a3440); // the windscreen (facing right)
        } else {
          r.rect(0, 1, 3, 3, scaleColor(c, 1.15));
          r.rect(0, dir === 'up' ? 1 : 3, 3, 1, 0x2a3440);
        }
        return kit.frame(tod.frame(r, 2000));
      };
      const side = cols.map((c) => carF(c, 'side'));
      const up = cols.map((c) => carF(c, 'up'));
      const down = cols.map((c) => carF(c, 'down'));
      // (lanes: x 28/32, 86/94, 148/152 up/down; the cross streets' eastbound lanes on their north sides)
      const avenue = (x, fromRight, u0, u1, n, goingUp) => {
        const e = fromRight ? 188 : -8;
        const a = (uu, east) => uu + (east ? 3 : -3);
        // in along the bottom street, up the avenue, out along the top one (or the other way round)
        const pts = goingUp
          ? [[e, a(u0, !fromRight)], [x, a(u0, !fromRight)], [x, a(u1, fromRight)], [e, a(u1, fromRight)]]
          : [[e, a(u1, !fromRight)], [x, a(u1, !fromRight)], [x, a(u0, fromRight)], [e, a(u0, fromRight)]];
        let total = 0;
        for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        return { pts, sp: SP, n, gap: total / n, size: [5, 3] };
      };
      const routes = [];
      for (const [u0, u1, n] of [[1186, 2600, 4], [2900, SENNICHIMAE, 3]]) {
        routes.push(avenue(28, false, u0, u1, n, true), avenue(32, false, u0, u1, n, false));
        routes.push(avenue(86, false, u0, u1, n, true), avenue(94, false, u0, u1, n, false));
        routes.push(avenue(148, true, u0, u1, n, true), avenue(152, true, u0, u1, n, false));
      }
      for (const [u, k] of [[1640, 2], [2100, 3], [2350, 3]]) routes.push({ pts: [[-8, u + k], [188, u + k]], sp: SP, size: [5, 3] }, { pts: [[188, u - k], [-8, u - k]], sp: SP, size: [5, 3] });
      const onScreen = (u) => [Math.max(0, (u - anchor - 10) / V), Math.max(0, (u + 440 - anchor) / V)];
      const s0 = planTraffic(routes, onScreen);
      routes.forEach((r, k) => {
        const o = (k * 3) % cols.length; // (each route its own mix of colours)
        const turn = (a) => [...a.slice(o), ...a.slice(0, o)];
        kit.path(r.pts, turn(side), { sp: SP, n: r.n ?? 1, gap: r.gap ?? 20, turn: 'flip', fu: turn(up), fd: turn(down), cars: 1, s0: s0[k], d: 0.08 }); // (over the bridges)
      });
    }
    // the station: tracks, trains, and the great curved glass roof over the platforms
    for (let u = 2700; u < 2780; u++)
      for (let x = 0; x < W; x++) {
        if (isRes(x, Y(u)) && !(x > 81 && x < 99)) continue;
        const k = (u - 2700) % 8;
        img.set(x, Y(u), k === 0 || k === 3 ? 0x8a8a90 : k === 1 || k === 2 ? (x % 3 ? 0x4a3a30 : 0x5a4a3a) : k === 5 ? C.paving[2] : 0x6a645c);
      }
    reserveRect(0, Y(2780), W, 80);
    // live: trains pulling in under the roof, waiting at the platforms and pulling out again
    for (const [u, c, from, s0] of [[2716, 0xe8e8e8, -1, 0.2], [2732, 0xf0a020, 1, 0.7], [2748, 0x3a8a5a, -1, 0.95], [2764, 0xe8e8e8, 1, 0.45]]) {
      const coach = (nose) => {
        const out = new HiCanvas(24, 5);
        out.rect(0, 0, 24, 5, c);
        out.rect(0, 3, 24, 1, scaleColor(c, 0.7));
        for (let xx = 2; xx < 22; xx += 3) out.rect(xx, 1, 2, 1, 0x3a5a7a);
        if (nose) out.rect(nose > 0 ? 22 : 0, 1, 2, 2, 0x2a3a4a);
        return kit.frame(tod.frame(out, u));
      };
      const cars = from < 0 ? [coach(1), coach(0), coach(-1)] : [coach(-1), coach(0), coach(1)];
      kit.path(from < 0 ? [[-90, u], [150, u]] : [[270, u], [30, u]], cars, { sp: 26, n: 3, gap: 26, mode: 'pp', hold: 5, turn: 'none', cars: 1, s0 });
    }
    // the great curved glass roof over them (live too, so the trains run underneath it)
    {
      const roofF = capture(12, Y(2778), 156, 75, () => {
        for (let u = 2704; u < 2778; u++)
          for (let x = 12; x < 168; x++) {
            const rib = (u - 2704) % 9 === 0 || x % 26 === 12;
            const edge = u < 2706 || u > 2775 || x < 14 || x > 165;
            img.set(x, Y(u), edge ? 0xb8c0c8 : rib ? 0xd8e0e8 : 0xc8dae8, edge || rib ? 0.9 : 0.35);
          }
        for (let x = 12; x < 168; x += 26) glow(x, Y(2740), 0xfff0d0, 0.7);
      });
      kit.loop(12, U(Y(2778)), [roofF], { d: 0.1 });
    }
    // the Sky Building: two towers joined at the top by the floating garden deck
    {
      const x = 103;
      const y = Y(2570);
      objects.push({
        y: y + 66,
        shadow: () => shadowRect(x + 12, y + 10, 46, 66, 0.5),
        draw: () => {
          for (const tx of [x, x + 24]) {
            for (let yy = y + 12; yy < y + 66; yy++)
              for (let xx = tx; xx < tx + 14; xx++) {
                const lx = xx - tx;
                let c = lx % 2 ? 0x9ab0c4 : 0x8aa0b4;
                if ((yy - y) % 3 === 0) c = 0x6a7a8a;
                if (lx === 0) c = 0xc8d4e0;
                if (lx === 13) c = 0x5a6a7a;
                if ((yy * 3 + lx) % 11 === 0) c = 0xd8ecff;
                img.set(xx, yy, c);
              }
          }
          for (let a = 0; a < Math.PI * 2; a += 0.03) img.set(Math.round(x + 19 + Math.cos(a) * 17), Math.round(y + 10 + Math.sin(a) * 8), 0xd8e0e8);
          img.rect(x + 4, y + 4, 30, 10, 0xc8d0d8);
          img.rect(x + 4, y + 4, 30, 1, 0xf0f4f8);
          img.rect(x + 4, y + 13, 30, 1, 0x7a8a9a);
          fill(x + 8, y + 6, 22, 6, C.grass, 78, 2);
          glow(x + 19, y + 3, 0xff3a2a);
          glow(x + 5, y + 4, 0xff3a2a);
          glow(x + 33, y + 4, 0xff3a2a);
        },
      });
      reserveRect(x - 1, y - 2, 40, 70);
    }
    // a red Ferris wheel turning on top of a shopping building (live: the wheel in four steps per spoke,
    // the gondolas going round with it)
    {
      const x = 38;
      const y = Y(2320);
      building(x, y, 40, 26, 14, { style: 'glass', roof: 0x8a8e96, wall: 0xc84a3a, items: ['ac'] });
      const cx = x + 20;
      const cy = y + 6;
      const wheel = [0, 1, 2, 3].map((s) =>
        capture(cx - 18, cy - 18, 37, 34, () => {
          const rot = (s / 4) * ((Math.PI * 2) / 16);
          for (let k = 0; k < 16; k++) {
            const a = (k / 16) * Math.PI * 2 + rot;
            img.line(cx, cy, Math.round(cx + Math.cos(a) * 15), Math.round(cy + Math.sin(a) * 15), 0xb83020);
          }
          for (let a = 0; a < Math.PI * 2; a += 0.04) img.set(Math.round(cx + Math.cos(a) * 15), Math.round(cy + Math.sin(a) * 15), 0xe83a2a);
          for (let k = 0; k < 16; k++) {
            const a = (k / 16) * Math.PI * 2 + rot;
            glow(Math.round(cx + Math.cos(a) * 15), Math.round(cy + Math.sin(a) * 15), 0xffd0a0, 0.6);
          }
          img.disc(cx + 0.5, cy + 0.5, 2, 0xf0ece4);
          img.line(cx - 4, cy + 14, cx, cy, 0x8a2a1a);
          img.line(cx + 4, cy + 14, cx, cy, 0x8a2a1a);
        }),
      );
      kit.loop(cx - 18, U(cy - 18), wheel, { fps: 2, ph: 0, d: 0.05 });
      const gondola = new HiCanvas(2, 2);
      gondola.rect(0, 0, 2, 2, 0xf0ece4);
      gondola.set(1, 1, 0xc8c4bc);
      kit.orbit(cx, U(cy) - 1, 16, [kit.frame(tod.frame(gondola, U(cy)))], { n: 16, w: ((Math.PI * 2) / 16 / 4) * 2, d: 0.06 });
    }
    // the rest: towers packed between the avenues
    const rows = [UMEDA[0] + 10, 2100, 2350, 2600, 2700, 2780, 2900, SHINSEKAI[0]];
    for (let i = 0; i < rows.length - 1; i++) {
      const u0 = rows[i] + 10;
      const u1 = rows[i + 1] - 10;
      if (u1 - u0 < 20 || (rows[i] === 2700)) continue;
      for (const [x0, x1] of [[0, 22], [38, 79], [101, 142], [158, W]]) district(x0, x1, u0, u1, 'tower');
    }
    crowd(84, Y(2690), 12, 300, 30);
  }

  // ------------------------------------------------------------ D. Shinsekai: Tsūtenkaku, lanterns and neon
  {
    for (const u of [3060, 3200, 3300, 3550]) {
      hRoad(u, 5);
      for (const [x, hw] of [[30, 5], [90, 8], [150, 5]]) crossing(x, hw, u, 5);
    }
    // Sennichimae-dōri along the canal's south bank, off both edges: the three avenues end at it in
    // T-junctions (their carriageways run on into it, no kerb across their mouths), zebras over their mouths
    // and over the street either side of Midōsuji to the square at the canal's head, a dashed centre line
    // broken at the junctions, traffic lights on Midōsuji's south corners (the north ones stand on the square,
    // see E), street lamps on the south pavement
    {
      const uc = SENNICHIMAE;
      const AVENUES = [[30, 5], [90, 8], [150, 5]];
      hRoad(uc, 6);
      for (let x = 0; x < W; x++) if (x % 8 < 4 && AVENUES.every(([cx, hw]) => Math.abs(x + 0.5 - cx) > (cx === 90 ? 16 : hw + 3))) img.set(x, Y(uc), 0xd8d4c8);
      for (const [cx, hw] of AVENUES) {
        for (let u = uc - 8; u < uc - 6; u++) for (let x = Math.floor(cx - hw - 2); x <= cx + hw + 1; x++) roadPx(x, Y(u), x + 0.5 - cx, hw, false);
        crossing(cx, hw, uc, 6, [-1]);
      }
      hCrossing(uc, 6, 75);
      hCrossing(uc, 6, 101);
      for (const [x, c] of [[80, 0x40ff80], [99, 0xff3a2a]]) signal(x, Y(3747), c);
      for (const x of [12, 52, 140, 168]) {
        img.rect(x, Y(3746) - 1, 1, 2, 0x3a3a40);
        glow(x, Y(3746) - 2, 0xfff0c8);
        pool(x, Y(3746), 10, C.lamp, 0.35);
      }
    }
    // Tsūtenkaku: lattice legs, a lit observation deck, the big sign
    {
      const cx = 62;
      const top = Y(3290);
      objects.push({
        y: top + 84,
        shadow: () => {
          for (let k = 0; k < 74; k++) shadowRect(cx + 8 + Math.floor(k * 0.45), top + k + 8, 9, 1, 0.55);
        },
        draw: () => {
          // the octagonal deck: the roof with its rim, the band of windows lit, the rail, the clock face
          const CXf = cx * S;
          const T = top * S;
          for (let j = 0; j < 45; j++)
            for (let i = -33; i < 33; i++) {
              const cut = Math.max(0, 6 - Math.min(j, 44 - j)) + 0;
              if (Math.abs(i) > 33 - cut) continue;
              let c = i < -28 ? 0xe0dcd4 : i > 26 ? 0x8a8680 : 0xb8b4ac;
              if (j < 4) c = j === 0 ? 0xf0ece4 : 0xd8d4cc;
              else if (j >= 24 && j <= 31) {
                if (j === 24 || j === 31) c = 0x6a6660;
                else if ((i + 33) % 5 === 0) c = 0x5a5650;
                else {
                  glowPx(CXf + i, T + j, (i + j) % 7 === 0 ? 0xffffff : 0xffe8a0, 0.9);
                  continue;
                }
              } else if (j === 36) c = 0x5a5650;
              img.px(CXf + i, T + j, c);
            }
          for (let j = -24; j < 0; j++) for (let i = -5; i < 6; i++) img.px(CXf + i, T + j, i < -3 ? 0xe8e4dc : i > 3 ? 0x9a968e : 0xc8c4bc);
          glowPx(CXf, T - 26, 0xff3a2a);
          glowPx(CXf, T - 25, 0xff6a50, 0.7);
          for (let j = -8; j <= 8; j++)
            for (let i = -8; i <= 8; i++) {
              const d = Math.hypot(i, j);
              if (d <= 8) img.px(CXf + i, T + 15 + j, d > 7 ? 0x5a5650 : 0xf4f0e8);
            }
          for (let k = 0; k < 5; k++) img.px(CXf, T + 15 - k, 0x2a2a30);
          for (let k = 0; k < 4; k++) img.px(CXf + k, T + 15, 0x2a2a30);
          // the sign band: a dark board, running neon above, a white line of characters under it
          for (let j = 45; j < 72; j++) for (let i = -39; i < 39; i++) img.px(CXf + i, T + j, j === 45 || j === 71 ? 0x3a3a44 : 0x1a1a24);
          for (let i = -38; i < 38; i++) if ((i + 40) % 3) glowPx(CXf + i, T + 50, NEON[((i + 40) >> 3) % NEON.length]);
          const tr = rng(3290);
          for (let k = 0; k < 12; k++) glyph(CXf - 36 + k * 6, T + 56, 5, 0xffffff, tr);
          for (let i = -38; i < 38; i++) if (i % 2) glowPx(CXf + i, T + 66, 0xffd040, 0.8);
          pool(cx, top + 20, 26, 0xffa040, 0.35);
          // the legs: four steel columns spreading down, braced in X between their belts, lamps up them
          for (let FYr = (top + 24) * S; FYr < (top + 84) * S; FYr++) {
            const hw = (8 + (FYr / S - top - 24) * 0.2) * S;
            for (const sd of [-1, 1]) {
              const X = Math.round(CXf + sd * hw);
              for (let i = -3; i <= 3; i++) glowPx(X + i, FYr, i === -3 ? 0xf0f0f4 : i < 0 ? 0xc8c8d0 : i < 3 ? 0x8a8a94 : 0x5a5a64, 0.96);
              if (FYr % 12 === 0) for (const i of [-4, 4]) glowPx(X + i, FYr, 0xfff0c0, 1);
              const XI = Math.round(CXf + sd * hw * 0.45);
              for (let i = -1; i <= 1; i++) glowPx(XI + i, FYr, i < 0 ? 0xa8a8b0 : 0x6a6a72, 0.95);
            }
            const k = (FYr - (top + 24) * S) % 30;
            for (const d of [0, 1]) {
              glowPx(Math.round(CXf - hw + (k / 30) * hw * 2) + d, FYr, 0x8a8a94, 0.95);
              glowPx(Math.round(CXf + hw - (k / 30) * hw * 2) + d, FYr, 0x7a7a84, 0.95);
            }
            if (k < 3) for (let X = Math.round(CXf - hw); X <= CXf + hw; X++) glowPx(X, FYr, k === 0 ? 0xd8d8e0 : k === 1 ? 0x8a8a94 : (X % 12 === 0 ? 0xfff0c0 : 0x5a5a62), 0.96);
          }
        },
      });
      reserveRect(cx - 24, top - 10, 48, 96);
    }
    // Abeno Harukas: a huge stepped glass tower
    building(102, Y(3664), 40, 14, 20, { style: 'glass', roof: 0x7a8a9a, wall: 0x4a5a6e, lit: 0.6 });
    building(106, Y(3704), 32, 14, 26, { style: 'glass', roof: 0x6a7a8a, wall: 0x4e6680, lit: 0.6 });
    building(110, Y(3746), 24, 12, 30, { style: 'glass', roof: 0x6a7a8a, wall: 0x5a7088, lit: 0.6 });
    // Jan-jan alley under strings of red lanterns
    {
      const ay = Y(3420);
      for (let x = 0; x < W; x++) for (let j = -3; j <= 3; j++) if (!isRes(x, ay + j)) img.set(x, ay + j, Math.abs(j) === 3 ? 0x3a3238 : rampColor(C.paving, 0.3, x, ay + j));
      reserveRect(0, ay - 4, W, 9);
      for (let x = 2; x < W; x += 5) for (const s of [-2, 2]) lantern(x, ay + s);
      crowd(0, ay - 2, W, 4, 40, true);
    }
    // a giant pufferfish lantern and a dragon sign over the shops
    for (const [kind, x, u] of [['fugu', 104, 3190], ['dragon', 4, 3540], ['fugu', 156, 3530]])
      objects.push({
        y: Y(u) + 30,
        draw: () => {
          const y = Y(u);
          if (kind === 'fugu') {
            img.disc(x + 9, y + 9, 8, 0xf0e8d0);
            img.disc(x + 8, y + 7, 4, 0xfff8e8);
            for (let a = 0; a < Math.PI * 2; a += 0.5) img.set(Math.round(x + 9 + Math.cos(a) * 8.5), Math.round(y + 9 + Math.sin(a) * 8.5), 0xc8a060);
            img.disc(x + 6, y + 8, 1.5, 0x1a1a1a);
            img.disc(x + 12, y + 8, 1.5, 0x1a1a1a);
            img.rect(x + 7, y + 13, 4, 1, 0xd84a3a);
            pool(x + 9, y + 9, 16, 0xffe0a0, 0.45);
          } else {
            for (let k = 0; k < 34; k++) {
              const px = x + k;
              const py = y + 8 + Math.round(Math.sin(k * 0.4) * 4);
              img.rect(px, py, 1, 4, k % 3 ? 0x2a9a4a : 0x1a6a3a);
              img.set(px, py, 0xe8c040);
            }
            img.disc(x + 34, y + 8, 3, 0x2a9a4a);
            img.set(x + 35, y + 7, 0xff3a2a);
            pool(x + 17, y + 10, 18, 0x60ff90, 0.3);
          }
        },
      });
    // the rest: low shops with neon and billboards packed in
    const all = [SHINSEKAI[0], 3060, 3200, 3300, 3420, 3550, SHINSEKAI[1]];
    for (let i = 0; i < all.length - 1; i++) {
      const u0 = all[i] + 9;
      const u1 = all[i + 1] - 9;
      if (u1 - u0 < 20) continue;
      for (const [x0, x1] of [[0, 22], [38, 79], [101, 142], [158, W]]) district(x0, x1, u0, u1, 'shop');
    }
    crowd(84, Y(3740), 12, 760, 60);
  }

  // ------------------------------------------------------------ E. Dōtonbori: the canal, giant food signs, neon
  {
    const [d0, d1] = DOTONBORI;
    // the canal's head on Sennichimae-dōri: a paved square between the street and the water, steps down to the
    // west riverside walk, a footbridge over the canal's turn to the east one, a stone parapet with lamps,
    // benches facing the water, a kōban with its red lamp, parked bicycles at their rack, vending machines,
    // flower boxes, the river cruise's ticket booth, a busker, a takoyaki stall on the east promenade (its own
    // random numbers, so the rest of the strip stays as it was)
    {
      const sr = rng(5507);
      const q0 = SENNICHIMAE + 8; // (from the street's north pavement)
      const q1 = d0 + 30; // (to the water)
      for (let u = q0; u < q1; u++)
        for (let x = 0; x < W; x++) {
          const joint = u % 4 === 1 || (x + Math.floor(u / 4) * 5) % 8 === 0;
          img.set(x, Y(u), joint ? 0x7a776e : rampColor(C.paving, 0.35 + fbm(x, u, { seed: 39, scale: 3 }) * 0.5, x, Y(u)));
        }
      // the parapet along the quay (its top, its front), lamps on it, open where the footbridge starts
      for (let x = 64; x < W; x++) {
        if (x >= 115 && x <= 124) continue;
        img.set(x, Y(q1 - 1), x % 6 === 0 ? C.stone[1] : C.stone[3]);
        img.set(x, Y(q1 - 2), C.stone[0]);
        if (x % 13 === 5) {
          img.set(x, Y(q1), 0x3a3a40);
          glow(x, Y(q1) - 1, 0xfff0c8);
          pool(x, Y(q1 - 1), 9, C.lamp, 0.35);
        }
      }
      // the steps down to the west riverside walk, between low walls, a handrail down the middle
      for (let u = q1 - 9; u < q1; u++) {
        const t = 1 - (u - q1 + 9) * 0.035;
        for (let x = 56; x < 64; x++) img.set(x, Y(u), scaleColor((u - q1) % 2 ? 0xc8c0ac : 0x8a847c, t));
        img.set(55, Y(u), C.stone[2]);
        img.set(64, Y(u), C.stone[2]);
        img.set(60, Y(u), 0x4a4a52);
      }
      // the footbridge over the canal's turn, onto the east riverside walk: a paved deck between stone
      // parapets, lamps at mid-span, its shadow on the water (and no neon reflections on it)
      for (let u = q1; u < d0 + 50; u++) {
        for (let x = 115; x <= 124; x++) {
          water[Y(u) * W + x] = 0;
          img.set(x, Y(u), x === 115 || x === 124 ? (u % 4 ? C.stone[1] : C.stone[3]) : rampColor(C.paving, 0.6, x, Y(u)));
        }
        img.set(125, Y(u), 0x0a1418, 0.4);
        img.set(126, Y(u), 0x0a1418, 0.2);
      }
      for (const x of [115, 124]) {
        glow(x, Y(d0 + 40) - 1, 0xfff0c8);
        pool(x, Y(d0 + 40), 8, C.lamp, 0.35);
      }
      // traffic lights on Midōsuji's north corners, street lamps along the kerb
      signal(79, Y(3766), 0xff3a2a);
      signal(100, Y(3766), 0x40ff80);
      for (const x of [20, 60, 160, 176]) {
        img.rect(x, Y(q0 + 1) - 1, 1, 2, 0x3a3a40);
        glow(x, Y(q0 + 1) - 2, 0xfff0c8);
        pool(x, Y(q0 + 1), 10, C.lamp, 0.35);
      }
      // flower boxes along the kerb, open where the zebras land
      for (const [x0, x1] of [[64, 73], [107, 114]])
        for (let x = x0; x < x1; x++) {
          img.set(x, Y(q0 + 1), 0x5a4a3a);
          img.set(x, Y(q0 + 2), sr() < 0.6 ? sr.pick([0xe86a9a, 0xf0d040, 0xffffff, 0xe84a3a, 0xb46cff]) : 0x3a6a34);
        }
      // benches facing the water
      for (const x of [78, 98, 108, 152, 166]) {
        img.rect(x, Y(q1 - 5), 5, 1, 0x7a5835);
        img.rect(x, Y(q1 - 5) + 1, 5, 1, 0x46301f);
        for (let k = 1; k < 5; k++) img.tint(x + k, Y(q1 - 5) + 2, 0.7);
      }
      // the kōban: a little police box with the red lamp over its door, an officer outside, his white bicycle
      {
        const x = 5;
        const y = Y(q1 - 1);
        objects.push({
          y: y + 12,
          shadow: () => shadowRect(x + 3, y + 3, 13, 12, 0.55),
          draw: () => {
            img.rect(x, y, 13, 6, 0x6a6e78);
            img.rect(x, y, 13, 1, 0x9a9ea8);
            img.rect(x, y + 5, 13, 1, 0x4a4e58);
            img.rect(x, y + 6, 13, 6, 0xe4e0d8);
            img.rect(x, y + 6, 13, 1, 0x3a3a44);
            img.rect(x + 1, y + 7, 11, 1, 0xf4f4f0); // (the KOBAN board)
            for (const i of [2, 4, 6, 8, 10]) img.set(x + i, y + 7, 0x2a3a6a);
            img.rect(x + 4, y + 8, 5, 4, 0x3a4a5a);
            img.rect(x + 1, y + 9, 2, 2, 0x5a6a7a);
            img.rect(x + 10, y + 9, 2, 2, 0x5a6a7a);
            for (let k = 0; k < 5; k++) glow(x + 4 + k, y + 10, C.warm, 0.5);
            for (const k of [1, 2, 10, 11]) glow(x + k, y + 9, C.warm, 0.4);
            img.set(x + 6, y + 5, 0xff3a2a);
            glow(x + 6, y + 5, 0xff3a2a);
            pool(x + 6, y + 6, 10, 0xff3a2a, 0.35);
            img.set(x + 14, y + 9, 0x1a1a2a);
            img.rect(x + 14, y + 10, 1, 2, 0x2a3a6a);
            img.set(x + 15, y + 12, 0x101018, 0.4);
            img.rect(x - 3, y + 8, 1, 4, 0xe8e8ec);
            img.set(x - 3, y + 8, 0x1a1a20);
            img.set(x - 3, y + 11, 0x1a1a20);
            img.set(x - 2, y + 9, 0x8a8a90);
          },
        });
        reserveRect(x - 3, y, 19, 13);
      }
      // bicycles parked at their rack, front wheels in (baskets, here and there a child seat), a gap to walk through
      img.rect(22, Y(q0 + 7), 31, 1, 0x5a5a62);
      for (let x = 23; x < 52; x += 2) {
        if (x > 34 && x < 39) continue;
        const y = Y(q0 + 6);
        img.set(x, y, sr() < 0.6 ? 0x9a9aa0 : 0x1a1a20);
        img.set(x, y + 1, sr.pick([0xc8ccd0, 0x2a2a30, 0xc83a30, 0xe8e8ec, 0x3a6ad0, 0x8ad0b8, 0xe8c040, 0x7a4a8a]));
        img.set(x + 1, y + 1, 0x8a8a90);
        img.set(x, y + 2, sr() < 0.2 ? 0x3a6ad0 : 0x1a1a20);
        img.set(x, y + 3, 0x1a1a20);
        img.set(x + 1, y + 3, 0x101018, 0.35);
      }
      reserveRect(22, Y(q0 + 7), 31, 5);
      // vending machines against the shop fronts, glowing, a recycling bin
      [0xd83a30, 0xe8e8ec, 0x3a6ad0, 0x3a9a5a].forEach((c, i) => {
        const x = 40 + i * 3;
        const y = Y(q1 - 1);
        img.rect(x, y, 3, 1, scaleColor(c, 0.7));
        for (let k = 0; k < 3; k++) img.set(x + k, y + 1, sr.pick([0xd83a30, 0xe8c040, 0x3a6ad0, 0x6aaa5a, 0xff9ac0]));
        img.rect(x, y + 2, 3, 1, 0xe8f0f4);
        img.rect(x, y + 3, 3, 1, c);
        img.set(x + 1, y + 3, 0x1a1a20);
        for (let k = 0; k < 3; k++) glow(x + k, y + 2, 0xe8f4ff, 0.7);
        pool(x + 1, y + 3, 5, 0xc8e4ff, 0.3);
      });
      img.rect(52, Y(q1 - 1) + 1, 2, 3, 0x3a5a8a);
      reserveRect(40, Y(q1 - 1), 14, 5);
      // the river cruise's ticket booth by the steps: a blue roof, a lit window
      {
        const x = 66;
        const y = Y(q1 - 3);
        objects.push({
          y: y + 8,
          shadow: () => shadowRect(x + 2, y + 2, 8, 8, 0.55),
          draw: () => {
            img.rect(x, y, 8, 4, 0x2a5a9a);
            img.rect(x, y, 8, 1, 0x4a7aba);
            img.rect(x, y + 3, 8, 1, 0x1a3a6a);
            img.rect(x, y + 4, 8, 4, 0xe8e4dc);
            img.rect(x + 2, y + 5, 4, 2, 0x5a6a7a);
            for (let k = 0; k < 4; k++) glow(x + 2 + k, y + 5, C.warm, 0.6);
          },
        });
        reserveRect(x, y, 8, 8);
      }
      // a takoyaki stall on the east promenade: red and white awning, the griddle glowing under it, lanterns
      {
        const x = 128;
        const y = Y(q1 - 3);
        objects.push({
          y: y + 10,
          shadow: () => shadowRect(x + 2, y + 2, 13, 10, 0.55),
          draw: () => {
            for (let i = 0; i < 13; i++) img.rect(x + i, y, 1, 5, (i >> 1) % 2 ? 0xf2f0ea : 0xd8302a);
            img.rect(x, y + 4, 13, 1, 0x8a1a1a);
            img.rect(x + 1, y + 5, 11, 5, 0x5e4229);
            img.rect(x + 2, y + 5, 9, 2, 0x2a2026);
            for (let k = 0; k < 4; k++) img.set(x + 3 + k * 2, y + 6, 0xd8a060);
            for (let k = 0; k < 9; k++) glow(x + 2 + k, y + 5, 0xff8a30, 0.45);
            pool(x + 6, y + 6, 12, 0xff9a40, 0.4);
            for (const lx of [x, x + 12]) {
              img.set(lx, y + 5, 0xd8302a);
              lantern(lx, y + 5, 0xff5a30);
            }
          },
        });
        reserveRect(x, y, 13, 10);
        kit.emit(x + 6, U(y + 5), stallSteam, { rate: 1.4, life: [1.2, 2], vy: 6, sx: 1, wf: 0.6, a: 0.42, tint: 1 });
      }
      for (const x of [148, 174]) tree('broadleaf', x, Y(q0 + 3), 3, sr);
      // people about the square, a queue at the stall, a busker with a ring of listeners
      crowd(0, Y(q1 - 2), W, q1 - q0 - 3, 70, false, sr);
      crowd(126, Y(q0 + 1), 16, 2, 8, true, sr);
      crowd(84, Y(q1 - 6), 12, 6, 12, true, sr);
      img.set(90, Y(q1 - 8), 0xffe060);
      glow(90, Y(q1 - 8), 0xffe060, 0.6);
    }
    // riverside walk (Tombori) on both banks
    for (let u = d0 + 30; u < d1 - 30; u++)
      for (const [x0, x1] of [[56, 64], [116, 124]]) {
        if (x0 < 64 ? u >= d1 - 50 : u < d0 + 50) continue; // (where the canal turns away)
        for (let x = x0; x < x1; x++) img.set(x, Y(u), (x + u) % 5 === 0 ? 0x6a6660 : 0x8a847c);
      }
    reserveRect(56, Y(d1 - 30), 68, d1 - d0 - 60);
    reserveRect(0, Y(d1 - 28), 64, 24);
    reserveRect(116, Y(d0 + 52), W - 116, 24);
    for (let u = d0 + 56; u < d1 - 56; u += 12) for (const x of [58, 121]) lantern(x, Y(u), rand.pick([0xff5a30, 0xffd040]));
    for (let u = d0 + 56; u < d1 - 56; u += 3) {
      crowd(57, Y(u), 6, 2, 1, true);
      crowd(117, Y(u), 6, 2, 1, true);
    }
    // bridges: Dōtonbori-bashi, Ebisu-bashi (crowded), Taikō-bashi
    for (const u of [d0 + 300, d0 + 640, d0 + 940]) {
      for (let uu = u - 7; uu < u + 7; uu++) for (let x = 56; x < 124; x++) img.set(x, Y(uu), Math.abs(uu - u) > 5 ? C.stone[0] : rampColor(C.paving, 0.6, x, Y(uu)));
      for (let x = 58; x < 122; x += 6) {
        glow(x, Y(u + 6), 0xfff0c8);
        glow(x, Y(u - 6), 0xfff0c8);
      }
      crowd(58, Y(u + 4), 64, 8, u === d0 + 640 ? 90 : 30, true);
    }
    // live: the crowd streaming both ways over Ebisu-bashi (and fewer over the other two), strollers on the
    // riverside walks, the takoyaki stands' griddles steaming at the bridge ends
    {
      const er = rng(5501);
      const walker = (c, f, u) => {
        const r = new HiCanvas(2, 4);
        r.set(0, 0, 0x2a2026);
        r.set(0, 1, c);
        r.set(0, 2, f ? scaleColor(c, 0.8) : c);
        r.set(1, 3, 0x101018, 0.4);
        return kit.frame(tod.frame(r, u));
      };
      const cols = [0xd04040, 0x3a6ad0, 0xe8c040, 0xe8e8f0, 0x3a3a4a, 0xff9ac0, 0x6aaa5a];
      for (const [u, n] of [[d0 + 300, 3], [d0 + 640, 9], [d0 + 940, 3]])
        for (let k = 0; k < n; k++) {
          const c = cols[k % cols.length];
          const lane = u - 4 + Math.floor(er() * 8);
          const pts = k % 2 ? [[60, lane], [120, lane]] : [[120, lane], [60, lane]];
          kit.path(pts, [walker(c, 0, u), walker(c, 1, u)], { sp: 5 + er() * 4, mode: 'wrap', turn: 'flip', fps: 4, s0: er() });
        }
      for (const [x, s0] of [[60, 0.2], [120, 0.6], [59, 0.9], [121, 0.35]]) {
        const c = cols[Math.floor(er() * cols.length)];
        kit.path([[x, d0 + 56], [x, d1 - 56]], [walker(c, 0, (d0 + d1) / 2), walker(c, 1, (d0 + d1) / 2)], { sp: 3, mode: 'pp', hold: 3, turn: 'none', fps: 3, s0 });
      }
      for (const [x, u] of [[54, d0 + 652], [126, d0 + 628], [54, d0 + 312]]) kit.emit(x, u, stallSteam, { rate: 1.4, life: [1.2, 2], vy: 6, sx: 1, wf: 0.6, a: 0.42, tint: 1 });
    }
    // canal cruise boats going up and down between the bridges, full of people, their wakes spreading (live)
    for (const [x, u0, u1, s0] of [[84, d0 + 330, d0 + 620, 0.3], [72, d0 + 660, d0 + 920, 0.8], [96, d0 + 960, d0 + 1150, 0.1]]) {
      const pr = rng(u0);
      const boatF = capture(x, Y(u0), 12, 22, () => {
        img.rect(x, Y(u0), 12, 22, 0xe8e4dc);
        img.rect(x + 2, Y(u0) + 3, 8, 16, 0x5a8ab0);
        for (let k = 0; k < 4; k++) glow(x + 3 + k * 2, Y(u0) + 10, 0xffe0a0);
        for (let k = 0; k < 10; k++) {
          const px = x + 2 + Math.floor(pr() * 8);
          const py = Y(u0) + 4 + Math.floor(pr() * 14);
          img.set(px, py, pr() < 0.5 ? [0xd04040, 0x3a6ad0, 0xe8c040, 0xe8e8f0][Math.floor(pr() * 4)] : 0x3a3a4a);
          img.set(px, py - 1, 0x2a2026);
        }
      });
      const wakeF = [0, 1, 2].map((k) => {
        const w = new HiCanvas(1, 15 + k * 4);
        w.set(0, 0, 0xeaf0f0);
        w.set(0, 14 + k * 4, 0xeaf0f0);
        return kit.frame(tod.frame(w, u0));
      });
      kit.path([[x + 6, u0], [x + 6, u1]], [boatF], { sp: 7, mode: 'pp', hold: 3, turn: 'none', wake: { f: wakeF, every: 3, life: 2 }, s0 });
    }
    // buildings on both banks, lit up, with neon and billboards
    district(0, 55, d0 + 30, d1 - 56, 'canal');
    district(125, W, d0 + 56, d1 - 30, 'canal');
    // giant food signs: octopus, takoyaki, gyoza, sushi, ramen, a crab waving its legs
    const signs = [
      ['tako', 8, d0 + 120],
      ['ball', 140, d0 + 220],
      ['gyoza', 12, d0 + 420],
      ['sushi', 138, d0 + 520],
      ['crab', 4, d0 + 700],
      ['tako', 132, d0 + 770],
      ['ramen', 14, d0 + 900],
      ['crab', 134, d0 + 1040],
    ];
    /** Draw a giant sign; frame k moves the crab's claws and legs, the octopus's arms, the neon strip. */
    const drawSign = (kind, x, u, k = 0) => {
      const y = Y(u);
      const wave = k ? 1 : 0;
      if (kind === 'tako') {
        img.disc(x + 18, y + 12, 11, 0xd8402a);
        img.disc(x + 15, y + 9, 5, 0xe86a4a);
        for (const s of [-1, 1]) {
          img.disc(x + 18 + s * 5, y + 13, 3, 0xffffff);
          img.set(x + 18 + s * 5, y + 14, 0x1a1a1a);
        }
        img.rect(x + 8, y + 3, 20, 3, 0xf2f0ea);
        img.rect(x + 8, y + 4, 20, 1, 0xd02a2a);
        for (let j = 0; j < 6; j++) img.line(x + 8 + j * 4, y + 22, x + 4 + j * 5 + (wave && j % 2 ? 2 : 0) - (wave && !(j % 2) ? 1 : 0), y + 32 - (wave && j % 2 ? 1 : 0), 0xc8362a);
        // (fine: a gleam on the head, suckers in rows along the arms, the headband's knot)
        for (let k2 = 0; k2 < 6; k2++) for (let q = 1; q < 8; q++) if (q % 2) img.px(Math.round((x + 8 + k2 * 4 + (x + 4 + k2 * 5 - x - 8 - k2 * 4) * (q / 9)) * S), Math.round((y + 22 + 10 * (q / 9)) * S) + 1, 0xf8c8b0);
        for (let j = -3; j <= 3; j++) img.px((x + 13) * S + j, (y + 6) * S + Math.abs(j) - 3, 0xffd0c0);
        for (const [i, j] of [[0, 0], [1, 1], [-1, 1], [0, 2], [2, 2], [-2, 2]]) img.px((x + 28) * S + i, (y + 4) * S + j, 0xf2f0ea);
        pool(x + 18, y + 14, 20, 0xff6040, 0.4);
      } else if (kind === 'ball') {
        for (let k = 0; k < 3; k++) {
          img.disc(x + 8 + k * 10, y + 12, 5, 0xb87a3a);
          img.disc(x + 7 + k * 10, y + 11, 2, 0xd8a060);
          img.line(x + 4 + k * 10, y + 10, x + 12 + k * 10, y + 14, 0xf4f0e0);
          img.set(x + 8 + k * 10, y + 9, 0x3a8a3a);
        }
        // (fine: sauce in a glossy drizzle, mayonnaise zigzags, bonito flakes and green nori on each ball)
        for (let k2 = 0; k2 < 3; k2++) {
          const BX = (x + 8 + k2 * 10) * S;
          const BY = (y + 12) * S;
          for (let i = -12; i <= 12; i++) {
            img.px(BX + i, BY - 4 + Math.round(Math.sin(i * 0.7) * 2), 0x5a2a12);
            if (i % 3 === 0) img.px(BX + i, BY + 2 + (i % 2), 0xfff8e8);
          }
          for (let q = 0; q < 6; q++) img.px(BX - 6 + q * 2, BY - 8 + (q % 2) * 2, q % 2 ? 0xe8a868 : 0xc88848);
          img.px(BX + 3, BY - 1, 0x2a6a2a);
          img.px(BX - 4, BY + 4, 0x2a6a2a);
        }
        pool(x + 18, y + 12, 18, 0xffb040, 0.35);
      } else if (kind === 'gyoza') {
        for (let k = 0; k < 3; k++) {
          img.ellipse(x + 8 + k * 9, y + 12, 5, 7, 0xf0dcb0);
          img.ellipse(x + 7 + k * 9, y + 11, 2, 4, 0xfff0d0);
          for (let j = 0; j < 4; j++) img.set(x + 6 + k * 9 + j, y + 6, 0xd8b880);
        }
        // (fine: the pleats along each dumpling's edge, the crisp brown base)
        for (let k2 = 0; k2 < 3; k2++) {
          const GX = (x + 8 + k2 * 9) * S;
          for (let j = -18; j <= 18; j += 4) img.px(GX + 12, (y + 12) * S + j, 0xc8a070);
          for (let i = -12; i <= 12; i++) img.px(GX + i, (y + 18) * S + Math.round(Math.abs(i) * 0.1), 0xa86a30);
        }
        pool(x + 16, y + 12, 18, 0xffe080, 0.35);
      } else if (kind === 'sushi') {
        img.rect(x + 4, y + 10, 26, 8, 0xf8f4ec);
        img.rect(x + 2, y + 5, 30, 7, 0xff7a4a);
        for (let k = 0; k < 6; k++) img.set(x + 4 + k * 5, y + 8, 0xffffff);
        img.rect(x + 14, y + 5, 4, 13, 0x1a2a1a);
        // (fine: the grains of rice, the white streaks of fat in the salmon, the nori's sheen)
        for (let Yf = (y + 12) * S; Yf < (y + 18) * S; Yf++) for (let X = (x + 4) * S; X < (x + 30) * S; X++) if (hashPx(X, Yf, 76) < 0.25) img.px(X, Yf, 0xe0dcd0);
        for (let q = 0; q < 8; q++) for (let i = 0; i < 6; i++) img.px((x + 3) * S + q * 11 + i, (y + 6) * S + i, 0xffc8a8);
        for (let Yf = (y + 5) * S; Yf < (y + 18) * S; Yf += 3) img.px((x + 15) * S, Yf, 0x3a5a3a);
        pool(x + 17, y + 12, 18, 0xff8a60, 0.35);
      } else if (kind === 'crab') {
        img.ellipse(x + 20, y + 14, 12, 8, 0xd83a2a);
        img.ellipse(x + 18, y + 12, 6, 4, 0xf06a4a);
        for (const s of [-1, 1]) {
          for (let j = 0; j < 4; j++) img.line(x + 20 + s * 9, y + 12 + j * 2, x + 20 + s * 18, y + 8 + j * 5 + (wave && j % 2 ? -1 : 0), 0xc8302a);
          // the claws go up and snap
          img.disc(x + 20 + s * (15 + wave), y + 2 - wave * 2, 4, 0xd83a2a);
          img.rect(x + 20 + s * (15 + wave) - 1, y - 2 - wave * 3, 3, 3, 0xd83a2a);
          if (wave) img.set(x + 20 + s * (15 + wave), y - 3, 0x1a1a1a);
          img.disc(x + 20 + s * 4, y + 6, 1.5, 0x1a1a1a);
        }
        // (fine: bumps on the shell, the joints of the legs, a gleam)
        for (let q = 0; q < 18; q++) {
          const a = q * 2.4;
          const rr = 3 + (q % 4) * 2.5;
          img.px(Math.round((x + 20 + Math.cos(a) * rr) * S), Math.round((y + 14 + Math.sin(a) * rr * 0.6) * S), q % 2 ? 0xf8907a : 0xa82418);
        }
        for (let i = -6; i <= 2; i++) img.px((x + 17) * S + i, (y + 10) * S - Math.abs(i + 2) * 0.3, 0xffb0a0);
        pool(x + 20, y + 12, 22, 0xff5030, 0.4);
      } else {
        img.disc(x + 16, y + 12, 12, 0xd8302a);
        img.disc(x + 16, y + 12, 9, 0xe8c070);
        for (let k = 0; k < 5; k++) img.line(x + 10, y + 8 + k * 2, x + 22, y + 9 + k * 2, 0xf4e0a0);
        img.disc(x + 12, y + 12, 2.5, 0xf2ece0);
        img.rect(x + 18, y + 6, 2, 10, 0x6a3a1a);
        pool(x + 16, y + 12, 20, 0xff6a40, 0.35);
      }
      for (let j = 0; j < 38; j++) glow(x + j, y - 3, NEON[((j >> 2) + k) % NEON.length], 0.9);
    };
    for (const [kind, x, u] of signs) {
      // the crab and the octopus move (two frames), every neon strip runs (live); the light pools stay painted
      const live = kind === 'crab' || kind === 'tako';
      const frames = (live ? [0, 1] : [0, 1, 2, 3, 4, 5, 6]).map((k) =>
        capture(x - 2, Y(u) - 8, 44, 44, () => (live ? drawSign(kind, x, u, k) : [...Array(38)].forEach((_, j) => glow(x + j, Y(u) - 3, NEON[((j >> 2) + k) % NEON.length], 0.9))), { pools: k === 0 && live }),
      );
      if (live) kit.loop(x - 2, U(Y(u) - 8), frames, { fps: 2 });
      else {
        objects.push({ y: Y(u) + 40, draw: () => drawSign(kind, x, u) });
        kit.loop(x - 2, U(Y(u) - 8), frames, { fps: 7, fx: 1 });
      }
    }
  }

  // ------------------------------------------------------------ F. Osaka by night: alleys, shrines, a market, two great temples, the harbour
  {
    const [p0, p1] = PORT;
    const HOZEN = [p0, 5160];
    const YASAKA = [5160, 5370];
    const KUROMON = [5370, 5610];
    const SHITEN = [5610, 5910];
    const SUMI = [5910, 6210];
    const WOOD = [0x2e2018, 0x46301f, 0x5e4229, 0x7a5835];
    const TILE = [0x2a303c, 0x3c4452, 0x515b6c, 0x6a7588];
    const BARK = [0x2b2224, 0x3d3033, 0x544246, 0x6e5a5c];
    const VERM = [0xe2421f, 0xb83018, 0x7e2014];
    const STONE = [0x4e4b50, 0x6c6870, 0x8a8790, 0xaaa7ae];
    /** Stone paving (ishidatami): rows of fitted slabs with dark joints. */
    const ishidatami = (x0, x1, u0, u1) => {
      for (let u = u0; u < u1; u++)
        for (let x = x0; x < x1; x++) {
          if (isRes(x, Y(u)) || W_(x, Y(u))) continue;
          // (fine: slabs of every length in courses, hairline joints, each slab its own tone, worn smooth)
          const base = 0.35 + fbm(x, u, { seed: 61, scale: 3 }) * 0.5;
          for (let j = 0; j < S; j++)
            for (let i = 0; i < S; i++) {
              const X = x * S + i;
              const Yf = Y(u) * S + j;
              const row = Math.floor(Yf / 10);
              const off = Math.floor(hashPx(row, 0, 64) * 20);
              const slab = Math.floor((X + off) / (14 + Math.floor(hashPx(row, 1, 65) * 10)));
              const joint = Yf % 10 === 0 || (X + off) % (14 + Math.floor(hashPx(row, 1, 65) * 10)) === 0;
              img.px(X, Yf, joint ? STONE[0] : rampColor(STONE, base + (hashPx(slab, row, 66) - 0.5) * 0.25 + (hashPx(X, Yf, 67) - 0.5) * 0.1, X, Yf));
            }
        }
    };
    const gravelGround = (x0, x1, u0, u1, seed = 62) => {
      for (let u = u0; u < u1; u++) for (let x = x0; x < x1; x++) if (!isRes(x, Y(u))) img.set(x, Y(u), rampColor(C.gravel, 0.2 + fbm(x, u, { seed, scale: 4 }) * 0.6, x, Y(u)));
    };
    /** Red and white paper lanterns hanging under eaves: the light of old Osaka streets. */
    const chochin = (x, y, c = 0xff5a30) => {
      const X = x * S;
      const Yy = y * S;
      for (let j = 0; j < 6; j++)
        for (let i = -1; i <= 2; i++) {
          if ((j === 0 || j === 5) && (i === -1 || i === 2)) continue;
          if (j === 0 || j === 5) img.px(X + i, Yy + j, 0x1a1418);
          else glowPx(X + i, Yy + j, j % 2 ? c : scaleColor(c, 0.82), i === -1 || i === 2 ? 0.75 : 0.95);
        }
      glowPx(X, Yy + 2, 0xffe0a0, 0.8);
      img.px(X, Yy - 1, 0x2a2224);
      glow(x, y + 1, c, 0.35);
      pool(x, y + 2, 6, c, 0.22);
    };
    /** A hip roof of kawara tiles in fine pixels: rows of round tiles on the slopes, courses on the hips, the
     * ridge with its onigawara ends, the eave line of tile ends over the drip. */
    const hipRoofPx = (x, y, w, roofH, ridge, hi, ramp) => {
      const X0 = x * S;
      const X1 = (x + w) * S;
      const Y0 = y * S;
      const Y1 = (y + roofH) * S;
      const RY = ridge * S + 1;
      const HI = hi * S;
      for (let Yy = Y0; Yy < Y1; Yy++) {
        const north = Yy <= RY;
        const t = north ? (RY - Yy) / Math.max(1, RY - Y0) : (Yy - RY) / Math.max(1, Y1 - 1 - RY);
        const inset = HI * (1 - t);
        for (let X = X0; X < X1; X++) {
          const lx = X - X0;
          const rx = X1 - 1 - X;
          if ((lx < 2 || rx < 2) && Yy < Y0 + 2) continue;
          const hip = lx < inset || rx < inset;
          let c = lx < inset ? ramp[3] : rx < inset ? ramp[0] : north ? ramp[2] : ramp[1];
          if (hip) {
            if ((Yy - Y0) % 3 === 0) c = scaleColor(c, 0.82);
            if (Math.abs(lx - inset) < 1 || Math.abs(rx - inset) < 1) c = scaleColor(ramp[3], 1.15); // (the hip ridge)
          } else {
            const k = X % 3;
            c = k === 0 ? scaleColor(c, 1.14) : k === 2 ? scaleColor(c, 0.8) : c;
            if ((Yy - Y0) % 4 === 0) c = scaleColor(c, 0.88);
          }
          img.px(X, Yy, c);
        }
      }
      for (let X = X0 + HI; X < X1 - HI; X++) {
        img.px(X, RY, scaleColor(ramp[3], 1.2));
        img.px(X, RY + 1, scaleColor(ramp[0], 0.8));
      }
      for (const ox of [X0 + HI - 2, X1 - HI - 1]) for (let j = -2; j <= 1; j++) for (let i = 0; i < 3; i++) img.px(ox + i, RY + j, j < 0 ? scaleColor(ramp[3], 1.25) : ramp[0]);
      for (let X = X0; X < X1; X++) {
        img.px(X, Y1 - 2, X % 3 === 0 ? 0xb8bcc4 : scaleColor(ramp[3], 1.05));
        img.px(X, Y1 - 1, ramp[0]);
      }
    };
    /** A traditional two-storey house with a tiled hip roof, a lattice front, noren, lanterns and a lit sign. */
    const oldHouse = (x, y, w, roofH, faceH, opt = {}) => {
      const ramp = opt.ramp ?? TILE;
      const ridge = y + Math.round(roofH * 0.4);
      const hi = Math.min(Math.round(roofH * 0.42), Math.floor(w / 3));
      const noren = rand.pick([0x2b3c78, 0x7a1a2a, 0x2a5a3a, 0xe8e0d0, 0x5a2a6a]);
      const nx = x + 3 + Math.floor(rand() * Math.max(1, w - 11));
      const sign = rand() < 0.6;
      const lamp = rand.pick([0xff5a30, 0xff5a30, 0xfff0d0, 0xffb040]);
      objects.push({
        y: y + roofH + faceH,
        shadow: () => shadowRect(x + 3, y + 3, w, roofH + faceH, 0.55),
        draw: () => {
          hipRoofPx(x, y, w, roofH, ridge, hi, ramp);
          const fy = y + roofH;
          const FX0 = (x + 1) * S;
          const FX1 = (x + w - 1) * S;
          const FY0 = fy * S;
          const FH = faceH * S;
          for (let j = 0; j < FH; j++)
            for (let X = FX0; X < FX1; X++) {
              const Yy = FY0 + j;
              const upper = j < Math.ceil(FH / 2);
              let c;
              if (j < 2) c = j === 0 ? 0x15100c : 0x2a1e16;
              else if (upper) c = (X - FX0) % 3 === 0 ? WOOD[0] : j === 2 ? WOOD[1] : (X - FX0) % 9 < 6 && j > 3 ? 0xd8ccb0 : WOOD[2]; // (plaster and the mushiko slats upstairs)
              else if ((X - FX0) % 2 === 0) c = WOOD[0]; // (the koshi lattice)
              else {
                glowPx(X, Yy, C.warm, 0.35 + (j === FH - 2 ? 0.2 : 0));
                continue;
              }
              img.px(X, Yy, c);
            }
          // the noren over the doorway: its cloth split in three, a pale crest on it
          for (let j = 0; j < Math.max(3, FH - 5); j++)
            for (let i = 0; i < 18; i++) {
              if (j > 4 && i % 6 === 5) continue;
              img.px(nx * S + i, FY0 + 3 + j, j === 0 ? scaleColor(noren, 1.3) : (i % 6 === 2 && j === 3) ? 0xf0e8d8 : noren);
            }
          chochin(nx - 2, fy + 1, lamp);
          chochin(nx + 7, fy + 1, lamp);
          if (sign) {
            // a vertical signboard, lit from inside
            const SX = (x + w - 3) * S;
            const sr = rng(x * 7 + y);
            for (let j = 0; j < Math.max(3, faceH + 2) * S; j++) {
              img.px(SX - 1, (fy - 1) * S + j, 0x2a1e16);
              img.px(SX + 3, (fy - 1) * S + j, 0x2a1e16);
              for (let i = 0; i < 3; i++) glowPx(SX + i, (fy - 1) * S + j, 0xfff4d8, 0.9);
            }
            for (let k = 0; k + 3 < Math.max(3, faceH + 2) * S; k += 4) glyph(SX, (fy - 1) * S + k + 1, 3, 0x2a1a14, sr, (gx, gy, gc) => img.px(gx, gy, gc));
          }
        },
      });
      reserveRect(x - 1, y - 1, w + 2, roofH + faceH + 3);
    };
    /** Rows of old houses along a band, leaving the reserved spots alone. */
    const oldRows = (x0, x1, u0, u1, rh = [10, 13]) => {
      let u = u0;
      while (u < u1 - 12) {
        const roofH = rh[0] + Math.floor(rand() * (rh[1] - rh[0] + 1));
        const bh = roofH + 4;
        let x = x0;
        while (x < x1 - 6) {
          let w = Math.min(x1 - x, 12 + Math.floor(rand() * 12));
          while (w >= 8 && anyRes(x - 1, Y(u + bh) - 1, w + 2, bh + 3)) w -= 3;
          if (w >= 8) {
            oldHouse(x, Y(u + bh), w, roofH, 4);
            x += w + 1;
          } else x += 3;
        }
        u += bh + 4;
      }
    };
    /** A temple or shrine hall: hip-and-gable roof of dark tiles (or bark), vermilion posts, white walls, floodlit. */
    const templeHall = (x, y, w, roofH, faceH, opt = {}) => {
      const ramp = opt.ramp ?? TILE;
      const ridge = y + Math.round(roofH * 0.34);
      const hi = Math.round(roofH * 0.42);
      objects.push({
        y: y + roofH + faceH,
        shadow: () => shadowRect(x + 5, y + 5, w, roofH + faceH, 0.5),
        draw: () => {
          hipRoofPx(x, y, w, roofH, ridge, hi, ramp);
          for (const gx of [x + hi, x + w - hi - 1]) {
            img.px(gx * S + 1, ridge * S, C.gold);
            img.px(gx * S + 1, ridge * S - 1, C.goldHi);
            img.px(gx * S + 1, ridge * S - 2, C.gold);
          }
          const fy = y + roofH;
          const FX0 = (x + 1) * S;
          const FX1 = (x + w - 1) * S;
          const FY0 = fy * S;
          const FH = faceH * S;
          for (let j = 0; j < FH; j++)
            for (let X = FX0; X < FX1; X++) {
              const k = (X - FX0) % 24;
              const upper = j < Math.ceil(FH / 2);
              let c;
              if (j < 2) c = 0x1a1210;
              else if (j < 5) c = (X % 4 < 2) ? 0x2a6a5a : C.gold; // (the painted bracket band)
              else if (k < 4) c = k === 0 ? scaleColor(VERM[0], 1.15) : k === 3 ? VERM[2] : VERM[0];
              else if (opt.gold) c = upper ? ((X + j) % 5 === 0 ? C.goldHi : C.gold) : 0xa87a22;
              else if (upper) c = (X + j) % 23 === 0 ? 0xd8d0bc : 0xe9e2d0;
              else c = (X - FX0) % 3 === 0 || (j - 5) % 4 === 0 ? VERM[2] : VERM[1]; // (latticed doors)
              img.px(X, FY0 + j, c);
            }
          if (opt.door !== false) {
            const DX = (x + Math.floor(w / 2) - 3) * S;
            for (let j = 3; j < FH; j++) for (let i = 0; i < 18; i++) img.px(DX + i, FY0 + j, opt.gate ? 0x140c0a : i % 3 === 0 ? 0x2a1810 : 0x3a2418);
          }
          // floodlights: the eave line and the posts catch the light
          for (let xx = x + 1; xx < x + w - 1; xx += 2) glow(xx, y + roofH - 2, 0xffd8a0, 0.35);
          for (let xx = x + 1; xx < x + w - 1; xx += 8) glow(xx, fy + 2, 0xffb070, 0.6);
          pool(x + w / 2, fy + faceH + 2, w * 0.5, 0xffc080, 0.22);
        },
      });
      reserveRect(x - 2, y - 2, w + 4, roofH + faceH + 4);
    };
    /** A pagoda: square storeys under wide tiled roofs, vermilion walls, the bronze finial; floodlit at night. */
    const pagoda = (cx, uBase, tiers, w0, floorH = 8, roofH = 7) => {
      const y0 = Y(uBase);
      const parts = [];
      let y = y0;
      for (let i = 0; i < tiers; i++) {
        const ww = w0 - i * Math.round(w0 * 0.13);
        parts.push({ ww, wallTop: y - floorH, wallBot: y });
        y = y - floorH - roofH + 2;
      }
      const top = y;
      objects.push({
        y: y0 + 4,
        shadow: () => {
          for (const p of parts) shadowRect(Math.round(cx - p.ww / 2) + 12, p.wallTop + 10, p.ww + 10, p.wallBot - p.wallTop + roofH, 0.55);
        },
        draw: () => {
          img.rect(Math.round(cx - w0 / 2) - 5, y0, w0 + 10, 5, STONE[2]);
          img.rect(Math.round(cx - w0 / 2) - 5, y0, w0 + 10, 1, STONE[3]);
          for (let k = parts.length - 1; k >= 0; k--) {
            const { ww, wallTop, wallBot } = parts[k];
            const x0 = Math.round(cx - ww / 2);
            {
              const FX0 = x0 * S;
              const FW = ww * S;
              const FY0 = wallTop * S;
              const FH = (wallBot - wallTop) * S;
              const bay = Math.round(FW / 3);
              for (let j = 0; j < FH; j++)
                for (let i = 0; i < FW; i++) {
                  const X = FX0 + i;
                  const Yy = FY0 + j;
                  const post = i % bay < 3 || i >= FW - 3;
                  let c;
                  if (j < 3) c = j === 0 ? 0x2a2026 : 0xe9e2d0; // (the bracket band under the eave)
                  else if (post) c = i % bay === 0 || i < 2 ? VERM[0] : i >= FW - 2 ? VERM[2] : VERM[1];
                  else if (j === FH - 1) c = VERM[2];
                  else if (Math.floor(i / bay) === 1 && j > 5) c = (i + j) % 4 === 0 ? C.gold : (i % 3 ? 0x8a2a20 : 0x6a1a18); // (the studded doors)
                  else c = (j - 3) % 7 === 0 ? VERM[0] : (i % 4 === 0 || (j - 3) % 7 === 3) && j > 4 ? 0xe9e2d0 : (i + j) % 2 ? VERM[1] : scaleColor(VERM[1], 0.88); // (vermilion panels, white lattice)
                  img.px(X, Yy, c);
                }
              for (let i = 3; i < FW; i += 6) glowPx(FX0 + i, FY0 + FH - 4, 0xffb070, 0.7);
            }
          }
          for (let k = parts.length - 1; k >= 0; k--) {
            const { ww, wallTop } = parts[k];
            const above = parts[k + 1];
            const eave = wallTop + 1;
            const botW = ww + 14;
            const topW = above ? above.ww : 6;
            for (let X = Math.round(cx - ww / 2) * S; X < Math.round(cx + ww / 2) * S; X++) for (let q = 1; q < 4; q++) img.tintPx(X, eave * S + S + q, 0.75);
            const CXf = cx * S;
            const rhF = roofH * S;
            const eF = eave * S + 2;
            for (let jf = 0; jf < rhF; jf++) {
              const t = jf / Math.max(1, rhF - 1);
              const hw = ((botW / 2) * (1 - t) ** 0.55 + (topW / 2) * (1 - (1 - t) ** 0.55)) * S;
              const XL = Math.round(CXf - hw);
              const XR = Math.round(CXf + hw);
              for (let X = XL; X < XR; X++) {
                const lx = X - XL;
                const rx = XR - 1 - X;
                let c;
                if (lx < 4) c = lx < 2 ? scaleColor(TILE[3], 1.1) : TILE[3];
                else if (rx < 4) c = TILE[0];
                else if (jf < 2) c = jf === 0 ? TILE[0] : scaleColor(TILE[3], 1.1);
                else if (jf === 2) c = X % 3 === 0 ? 0xb8b8c0 : TILE[1];
                else c = X % 3 === 0 ? TILE[3] : X % 3 === 1 ? TILE[2] : TILE[1];
                img.px(X, eF - jf, c);
              }
              if (jf > 3) {
                img.px(XL + 4, eF - jf, scaleColor(TILE[3], 1.15));
                img.px(XR - 5, eF - jf, TILE[0]);
              }
              if (jf === 0)
                for (let q = 0; q < 7; q++) {
                  img.px(XL - 1 - q, eF - 1 - Math.floor(q * 0.9), TILE[3]);
                  img.px(XR + q, eF - 1 - Math.floor(q * 0.9), TILE[1]);
                  if (q === 6) {
                    // the bronze bells hanging from the corners, catching the floodlight
                    for (const BX of [XL - 1 - q, XR + q]) {
                      img.px(BX, eF - Math.floor(q * 0.9), 0x6a5a30);
                      glowPx(BX, eF - Math.floor(q * 0.9) + 1, C.gold, 0.85);
                    }
                  }
                }
            }
          }
          for (let j = 0; j < 18; j++) img.set(Math.round(cx), top + 2 - j, j % 2 ? 0x8a6a3a : C.gold);
          for (let j = 1; j < 18; j += 2) {
            img.set(Math.round(cx) - 1, top + 2 - j, 0x6a4a2a);
            img.set(Math.round(cx) + 1, top + 2 - j, 0x6a4a2a);
          }
          glow(Math.round(cx), top - 16, C.goldHi);
          pool(cx, y0 - (y0 - top) / 2, w0, 0xffb878, 0.25);
        },
      });
      reserveRect(cx - w0 / 2 - 9, top - 18, w0 + 18, y0 - top + 26);
    };
    /** A pond at night: dark still water with ripples, a stone rim; lights reflect in it. */
    const pondAtNight = (cx, cu, rx, ry) => {
      const cy = Y(cu);
      for (let y = Math.floor(cy - ry - 3); y <= cy + ry + 3; y++)
        for (let x = Math.floor(cx - rx - 3); x <= cx + rx + 3; x++) {
          if (x < 0 || x >= W || isRes(x, y)) continue;
          const e = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 + (fbm(x, y, { seed: 69, scale: 10 }) - 0.5) * 0.3;
          if (e >= 1.16) continue;
          // (fine: the rim of rounded stones, the dark water with ripples catching the lanterns, a lily pad or two)
          for (let j = 0; j < S; j++)
            for (let i = 0; i < S; i++) {
              const X = x * S + i;
              const Yf = y * S + j;
              const ef = ((X + 0.5) / S - cx) ** 2 / (rx * rx) + ((Yf + 0.5) / S - cy) ** 2 / (ry * ry) + (fbm(x, y, { seed: 69, scale: 10 }) - 0.5) * 0.3;
              if (ef >= 1.16) continue;
              if (ef > 1) {
                const st = hashPx(Math.floor(X / 4), Math.floor(Yf / 3), 70);
                img.px(X, Yf, (X % 4 === 0 || Yf % 3 === 0) ? STONE[0] : rampColor(STONE, 0.3 + st * 0.6, X, Yf));
              } else {
                const n = fbm(x * 0.7, y * 1.5, { seed: 71, scale: 8, octaves: 2 });
                let c = rampColor([0x0e2028, 0x14303a, 0x1c3e4a, 0x2a5060], 0.1 + n * 0.5 + (ef > 0.9 ? -0.1 : 0), X, Yf);
                if (Math.sin(X * 0.8 + Yf * 0.2 + n * 9) > 0.93 && hashPx(X >> 2, Yf, 75) < 0.45) c = 0x4a7a8a;
                if (fbm(X * 0.15, Yf * 0.15, { seed: 72, scale: 2 }) > 0.8 && ef < 0.8) c = hashPx(X, Yf, 73) < 0.2 ? 0x5a8a4a : 0x3a6a3a;
                img.px(X, Yf, c);
              }
            }
          if (e <= 1) water[y * W + x] = 1;
          reserved[y * W + x] = 1;
        }
    };
    /** A string of paper lanterns between two points, sagging a little and swaying in the breeze (live). */
    const lanternString = (x0, y0, x1, y1) => {
      const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 3));
      const draw = (sag, sway) => () => {
        for (let k = 0; k <= n; k++) {
          const t = k / n;
          const s = Math.sin(t * Math.PI);
          const x = Math.round(x0 + (x1 - x0) * t + s * sway);
          const y = Math.round(y0 + (y1 - y0) * t + s * sag);
          img.set(x, y - 1, 0x2a2224, 0.6);
          if (k % 2 === 0) chochin(x, y, (k >> 1) % 3 === 0 ? 0xfff0d0 : 0xff5a30);
        }
      };
      const bx = Math.min(x0, x1) - 3;
      const by = Math.min(y0, y1) - 3;
      const frames = [[2, -1], [3, 0], [4, 1]].map(([sag, sway], i) => capture(bx, by, Math.abs(x1 - x0) + 7, Math.abs(y1 - y0) + 12, draw(sag, sway), { pools: i === 1 }));
      kit.loop(bx, U(by), frames, { seq: [0, 1, 2, 1], fps: 1.6 });
    };
    /** A bronze incense burner with its curl of smoke and the glow of the sticks. */
    const incense = (x, y) => {
      objects.push({
        y: y + 6,
        shadow: () => shadowRect(x + 1, y + 3, 7, 4, 0.55),
        draw: () => {
          img.rect(x, y + 2, 7, 4, 0x4a3a2a);
          img.rect(x, y + 2, 7, 1, 0x8a6a3a);
          img.rect(x + 1, y, 5, 2, 0x5a4a32);
          for (let j = 1; j < 12; j++) img.set(x + 3 + Math.round(Math.sin(j * 0.7) * 1.5), y - j, 0xb8b0c0, 0.35 * (1 - j / 12));
          glow(x + 3, y + 1, 0xff8a40, 0.8);
        },
      });
    };
    const stoneLantern = (x, y, lit = true) => {
      objects.push({
        y: y + 5,
        shadow: () => shadowRect(x + 2, y + 4, 3, 2, 0.68),
        draw: () => {
          // a Kasuga lantern: the footing, the round post with its collar, the fire box with a lit window on its face,
          // the curling hat, the jewel on top; moss on the old stone; the light on the ground in front
          const X = x * S + 4; // (its axis)
          const Yy = y * S;
          const mossy = (a, b) => hashPx(X + a, Yy + b, 73) < 0.09;
          for (let j = 11; j < 16; j++) for (let i = -5; i <= 5; i++) img.px(X + i, Yy + j, mossy(i, j) ? 0x4a6a3a : j === 11 ? STONE[3] : i < -2 ? STONE[2] : i > 2 ? STONE[0] : STONE[1]);
          for (let j = 6; j < 11; j++) for (let i = -2; i <= 2; i++) img.px(X + i, Yy + j, mossy(i, j) ? 0x4a6a3a : i < -1 ? STONE[3] : i > 0 ? STONE[0] : STONE[2]);
          for (let i = -4; i <= 4; i++) img.px(X + i, Yy + 6, i < 0 ? STONE[3] : STONE[1]);
          for (let j = 1; j < 6; j++)
            for (let i = -3; i <= 3; i++) {
              const win = lit && j > 1 && j < 5 && Math.abs(i) < 2;
              if (win) glowPx(X + i, Yy + j, j === 3 && i === 0 ? 0xfffbe0 : 0xffc860, 0.99);
              else img.px(X + i, Yy + j, i < -2 ? STONE[3] : i > 2 ? STONE[0] : STONE[1]);
            }
          for (let j = -3; j < 1; j++) {
            const hw = 2 + (j + 3) * 1.6;
            for (let i = -hw; i <= hw; i++) {
              const I = Math.round(i);
              img.px(X + I, Yy + j, mossy(I, j) ? 0x5a7a44 : j === 0 ? STONE[0] : I < 0 ? STONE[3] : STONE[2]);
            }
          }
          img.px(X - 7, Yy - 1, STONE[3]);
          img.px(X + 7, Yy - 1, STONE[2]);
          for (const [i, j] of [[0, -4], [-1, -5], [0, -5], [1, -5], [0, -6]]) img.px(X + i, Yy + j, j === -6 ? STONE[3] : STONE[2]);
          if (lit) {
            glow(x + 1, y + 1, 0xffd27a, 0.55);
            pool(x + 1, y + 5, 7, 0xffc070, 0.36);
          }
        },
      });
    };

    // ---- 1. Hōzen-ji Yokochō: a lantern-lit stone alley, the little temple and the moss-covered Fudō
    {
      const [h0, h1] = HOZEN;
      ishidatami(0, W, h0, h1);
      for (let u = h0; u < h1; u++) {
        img.set(83, Y(u), STONE[3]);
        img.set(97, Y(u), STONE[3]);
      }
      reserveRect(84, Y(h1), 13, h1 - h0);
      reserveRect(0, Y(5066), W, 10); // the cross alley
      // Hōzen-ji: the courtyard, the hall, the Mizukake Fudō covered in moss, walls of offering lanterns
      const tx = 104;
      const tu = 5004;
      ishidatami(tx, 178, tu, tu + 52);
      reserveRect(tx, Y(tu + 52), 74, 52);
      templeHall(tx + 34, Y(tu + 50), 38, 16, 7);
      {
        const fx = tx + 16;
        const fy = Y(tu + 20);
        img.rect(fx - 6, fy + 6, 13, 4, STONE[1]);
        img.rect(fx - 6, fy + 6, 13, 1, STONE[2]);
        for (let y = fy - 8; y <= fy + 6; y++)
          for (let x = fx - 5; x <= fx + 5; x++) {
            const e = ((x - fx) / 4.5) ** 2 + ((y - fy + 1) / 7) ** 2;
            if (e > 1) continue;
            img.set(x, y, rampColor([0x1e4a22, 0x2a6a2c, 0x3a8a38, 0x5aa848], 0.3 + (1 - e) * 0.3 + fbm(x, y, { seed: 63, scale: 1.5 }) * 0.4, x, y));
          }
        img.set(fx - 1, fy - 5, 0x8ad070);
        for (let k = 0; k < 6; k++) img.set(fx - 3 + k, fy + 9, 0x6ab0d0); // water splashed at its feet
        crowd(fx - 8, fy + 11, 16, 3, 6, true);
      }
      for (let r = 0; r < 3; r++) {
        for (let X = (tx + 3) * S; X < (tx + 41) * S; X++) img.px(X, (Y(tu + 46) + r * 4) * S - 1, 0x2a1e18);
        for (let k = 0; k < 18; k++) {
          const LX = (tx + 3) * S + 1 + k * 6;
          const LY = (Y(tu + 46) + r * 4) * S;
          const c = (k + r) % 3 ? [0xffe080, 0xffc848] : [0xff7a4a, 0xff5a30];
          for (let j = 0; j < 8; j++) for (let i = 0; i < 5; i++) if (!((j === 0 || j === 7) && (i === 0 || i === 4))) glowPx(LX + i, LY + j, j === 0 || j === 7 ? 0x1a1414 : j % 2 ? c[0] : c[1], 0.98);
          glowPx(LX + 2, LY + 3, 0x4a2a1a, 0.9);
          glowPx(LX + 2, LY + 5, 0x4a2a1a, 0.9);
        }
      }
      pool(tx + 20, Y(tu + 44), 18, 0xffa040, 0.3);
      oldRows(0, 83, h0 + 4, 5062);
      oldRows(98, W, h0 + 4, tu - 4);
      oldRows(0, 83, 5078, h1 - 4);
      oldRows(98, W, 5078, h1 - 4);
      // lanterns strung across the alley, people wandering between the restaurants
      for (let u = h0 + 10; u < h1; u += 14) {
        for (let x = 85; x < 96; x += 3) img.set(x, Y(u), 0x2a2224);
        chochin(87, Y(u) + 1, 0xff5a30);
        chochin(93, Y(u) + 1, 0xfff0d0);
      }
      crowd(85, Y(h1), 11, h1 - h0, 70, true);
      crowd(0, Y(5066), W, 8, 30, true);
      lanternString(2, Y(5064), 82, Y(5064));
      lanternString(98, Y(5064), 178, Y(5064));
      incense(tx + 4, Y(tu + 30));
      for (const [lx, lu] of [[tx + 2, tu + 6], [tx + 28, tu + 6], [tx + 66, tu + 8]]) stoneLantern(lx, Y(lu));
      crowd(tx + 2, Y(tu + 40), 30, 34, 24, true);
    }

    // ---- the people and the night life of the last districts, on their own random numbers (the rest of the strip
    // keeps its place). Everything bright is painted after the night's grade, so it burns against the dusk; the
    // turret pads stay clear
    const fr = rng(6101);
    const COATS = [0xd04040, 0x3a6ad0, 0xe8c040, 0xe8e8f0, 0xff7ab0, 0x6aaa5a, 0x3a3a4a, 0x3a3a4a, 0x4a4038, 0x2a3040, 0xe07a30];
    const padFree = (x, y, r = 15) => !pads.some((p) => Math.hypot(p.x - x, Y(p.u) - y) < r);
    const near = () => (fr() + fr() + fr() - 1.5) / 1.5;
    /** One person, sorted with the buildings. { coat, hat, extra(X, Yy) }. */
    const folk = (x, y, o = {}) => {
      if (!padFree(x, y)) return;
      const X = Math.round(x * S);
      const Yy = Math.round(y * S);
      const coat = o.coat ?? fr.pick(COATS);
      const hat = o.hat ?? fr() < 0.15;
      objects.push({
        y: y + 1.7,
        draw: () => {
          personPx(X, Yy, rng(X * 977 + Yy * 13), { coat, hat });
          o.extra?.(X, Yy);
        },
      });
    };
    const knot = (cx, y, rx, ry, n, o = {}) => {
      for (let k = 0; k < n; k++) folk(cx + near() * rx, y + near() * ry, o);
    };
    const warm = (x, y, r, k = 0.35, c = 0xffb868) => pool(x, y, r, c, k);
    /** Somebody walking, in two steps, for the routes people take. */
    const stepper = (c, step, u) => {
      const out = new HiCanvas(2, 4);
      for (let i = 1; i < 3; i++) out.px(i, 0, 0x2a2024);
      out.px(1, 1, 0x2a2024);
      out.px(2, 1, 0xe8c0a0);
      for (let j = 2; j < 6; j++) for (let i = 0; i < 4; i++) if (!(j > 4 && (i === 0 || i === 3))) out.px(i, j, i === 0 || i === 3 ? scaleColor(c, 0.75) : c);
      out.px(step ? 1 : 2, 6, 0x2a2a34);
      out.px(step ? 2 : 1, 7, 0x2a2a34);
      out.px(step ? 1 : 2, 8, 0x1a1a20);
      for (let i = 2; i < 6; i++) out.px(i, 10, 0x101418, 0.4);
      return kit.frame(tod.frame(out, u));
    };
    const walkers = (u) => [0xd04040, 0x3a6ad0, 0xe8c040, 0xe8e8f0, 0xff7ab0, 0x6aaa5a, 0x5a5a62].map((c) => [stepper(c, 0, u), stepper(c, 1, u)]);
    /** A stone torii in fine pixels: grey pillars on their footings, the curved kasagi, the nuki, a floodlight. */
    const stoneTorii = (cx, foot, span, h) => {
      const CX = cx * S + 1;
      const FOOT = foot * S;
      const H = h * S;
      const TOP = FOOT - H;
      const HS = Math.round((span * S) / 2);
      const PW = Math.max(4, Math.round(span * S * 0.13));
      const KL = HS + PW + Math.round(span * S * 0.14);
      objects.push({
        y: foot,
        shadow: () => {
          for (const sx of [-1, 1]) shadowRect(cx + sx * Math.round(span / 2) + 3, foot - 2, 5, 3, 0.6);
          shadowRect(cx - Math.round(span / 2) + 3, foot + 1, span + 6, 2, 0.75);
        },
        draw: () => {
          const LIT = [0x8a8478, 0xb8b0a0, 0xd8d0c0, 0xf4ecdc];
          const put = (X, Yy, c) => glowPx(X, Yy, c, 0.97);
          const NY = TOP + Math.round(H * 0.28);
          for (let X = -HS - PW / 2 - 4; X <= HS + PW / 2 + 4; X++) for (let j = 0; j < 4; j++) put(CX + Math.round(X), NY + j, j === 0 ? LIT[3] : j === 3 ? LIT[0] : LIT[2]);
          for (const sd of [-1, 1])
            for (let Yy = TOP + 4; Yy < FOOT; Yy++) {
              const P = CX + sd * HS - (PW >> 1);
              for (let i = 0; i < PW; i++) {
                const t = i / (PW - 1);
                let c = t < 0.2 ? LIT[2] : t < 0.45 ? LIT[3] : t < 0.75 ? LIT[1] : LIT[0];
                if (hashPx(P + i, Yy, 61) < 0.08) c = scaleColor(c, 0.88);
                put(P + i, Yy, c);
              }
              if (FOOT - Yy < 4) for (let i = -2; i < PW + 2; i++) put(P + i, Yy, FOOT - Yy === 3 ? LIT[3] : LIT[1]);
            }
          for (let X = -KL; X <= KL; X++) {
            const l = Math.round(4 * (Math.abs(X) / KL) ** 2.6);
            for (let j = 0; j < 7; j++) put(CX + X, TOP + j - l, j === 0 ? 0xffffff : j < 3 ? LIT[3] : j < 6 ? LIT[2] : LIT[0]);
          }
          for (let j = 7; j < NY - TOP; j++) for (let X = -3; X <= 3; X++) put(CX + X, TOP + j, X === -3 ? LIT[3] : X === 3 ? LIT[0] : LIT[2]);
        },
      });
      warm(cx, foot - 1, span * 0.9, 0.3);
    };
    /** A festival stall (yatai): striped awning, what it sells burning bright on the counter, lanterns, the seller. */
    const YATAI = { takoyaki: [0xd83a2a, 0xf4e8d0], yakitori: [0x2a2a30, 0xe8c040], kingyo: [0x2a6ad0, 0xf4f0e6], ringo: [0xe84a6a, 0xf8d8e0], men: [0x7a4ab8, 0xf0e0f8], kakigori: [0x3aa0c8, 0xf4f0e6] };
    const yatai = (x, y, kind) => {
      const [A, B] = YATAI[kind];
      const X = x * S;
      const Yy = y * S;
      const lit = (i, j, c) => glowPx(X + i, Yy + j, c, 0.96);
      objects.push({
        y: y + 12,
        shadow: () => shadowRect(x + 2, y + 3, 18, 11, 0.6),
        draw: () => {
          // the back and the seller in his headband
          for (let j = 10; j < 22; j++) for (let i = 3; i < 51; i++) img.px(X + i, Yy + j, 0x2a1e18);
          for (let k = 0; k < 3; k++) {
            lit(26 + k, 11, 0x2a2024);
            lit(26 + k, 12, k === 1 ? 0xf0d0b0 : 0xf4f0e6);
            lit(26 + k, 13, 0xf0d0b0);
            for (let j = 14; j < 18; j++) lit(26 + k, j, A === 0x2a2a30 ? 0xe8c040 : A);
          }
          // the counter and its goods
          for (let j = 18; j < 34; j++) for (let i = 1; i < 53; i++) img.px(X + i, Yy + j, j < 20 ? 0xb89060 : j > 31 ? 0x3a2a1c : (i % 13 === 0 ? 0x3a2a1c : j % 4 === 0 ? 0x5e4229 : 0x7a5835));
          for (let i = 3; i < 51; i++) {
            const k = i - 3;
            for (let j = 0; j < 8; j++) {
              let c = null;
              if (kind === 'takoyaki') c = j > 5 ? 0x1a1414 : (k % 7 < 5 && (j + 7) % 7 < 5) ? (hashPx(k >> 2, j >> 2, 5) < 0.5 ? 0xd88a3a : 0xc0702a) : 0x241c1a;
              else if (kind === 'yakitori') c = j > 5 ? 0x3a2a20 : k % 5 === 0 ? 0xd8b070 : j % 2 ? 0xa85a28 : (hashPx(k, j, 6) < 0.35 ? 0xff7a20 : 0xd07a34);
              else if (kind === 'kingyo') c = hashPx(k >> 1, j >> 1, 7) < 0.14 ? 0xff7a2a : j === 0 || j === 7 || k === 0 || k === 47 ? 0xd8e8f0 : (k + j) % 5 === 0 ? 0x6ab4e0 : 0x3a8ad0;
              else if (kind === 'ringo') c = (k % 7 < 5 && j > 1) ? (j < 4 && k % 7 === 1 ? 0xffb0b8 : 0xe0202a) : j < 2 && k % 7 === 2 ? 0xd8c090 : 0xf0e8d8;
              else if (kind === 'men') c = k % 8 < 6 ? ((k % 8 === 1 || k % 8 === 4) && j === 2 ? 0x1a1a22 : j === 5 && k % 8 > 1 && k % 8 < 4 ? 0xe84a4a : hashPx(k >> 3, 3, 8) < 0.33 ? 0xf8e0c0 : hashPx(k >> 3, 3, 8) < 0.66 ? 0xf4f4f0 : 0xe8c040) : 0x2a1e18;
              else c = j > 5 ? 0x7ac0e0 : k % 8 < 5 ? (j < 3 ? 0xf8f8fc : hashPx(k >> 3, 4, 9) < 0.5 ? 0xff6a8a : 0x6ad0f0) : 0xe0e8f0;
              if (c !== null) lit(i, 12 + j, c);
            }
          }
          // the awning, its stripes and scalloped edge; the name on its noren
          for (let j = 0; j < 12; j++)
            for (let i = 0; i < 54; i++) {
              if (j === 11 && i % 6 > 3) continue;
              const c = Math.floor(i / 6) % 2 ? A : B;
              lit(i, j, j === 0 ? scaleColor(c, 1.12) : j > 8 ? scaleColor(c, 0.82) : c);
            }
          const gr = rng(x * 31 + y);
          for (let k = 0; k + 4 < 18; k += 6) glyph(X + 4 + k, Yy + 3, 4, 0x1a1414, gr, (gx, gy, gc) => glowPx(gx, gy, gc, 0.9));
          for (const LX of [X - 1, X + 51]) {
            for (let j = 0; j < 7; j++) for (let k = 0; k < 4; k++) if (!((j === 0 || j === 6) && (k === 0 || k === 3))) glowPx(LX + k, Yy + 11 + j, j === 0 || j === 6 ? 0x1a1414 : j % 2 ? 0xff6a3a : 0xffb060, 0.98);
          }
        },
      });
      warm(x + 9, y + 12, 15, 0.5);
      if (kind === 'yakitori' || kind === 'takoyaki') kit.emit(x + 9, U(y + 4), stallSteam, { rate: 1.3, life: [1.2, 2], vy: 6, sx: 1.2, wf: 0.6, a: 0.42, tint: 1 });
    };

    // ---- round the alleys of Hōzen-ji, and under Tsūtenkaku: cobbles, shop signs, stalls, statues, the people out
    {
      const [h0, h1] = HOZEN;
      // small cobbles for the lanes between the houses (the alley and the temple keep their big stones)
      for (let Yr = Y(h1) * S; Yr < Y(h0) * S; Yr++)
        for (let X = 0; X < W * S; X++) {
          if (isRes(Math.floor(X / S), Math.floor(Yr / S))) continue;
          const row = Yr >> 2;
          const XX = X + (row % 2) * 4;
          const joint = Yr % 4 === 0 || XX % 8 === 0;
          const tone = hashPx(XX >> 3, row, 101);
          img.px(X, Yr, joint ? STONE[0] : tone < 0.4 ? 0x60606c : tone < 0.8 ? 0x6c6c78 : 0x7a7a84);
        }
      // tall lit shop signs along the alley, each with its name running down it
      for (let u = h0 + 8; u < h1 - 4; u += 12)
        for (const [x, sd] of [[81, 1], [98, -1]]) {
          const y = Y(u);
          const c = fr.pick([0xfff4d8, 0xffe0a0, 0xff9a70, 0xf8f0e8]);
          const seed = Math.floor(fr() * 1e6);
          objects.push({
            y: y + 8,
            draw: () => {
              const X = x * S;
              const Yy = y * S;
              const gr = rng(seed);
              for (let j = -2; j < 22; j++) for (let i = -1; i < 8; i++) glowPx(X + i, Yy + j, j === -2 || j === 21 || i === -1 || i === 7 ? 0x1a1414 : c, 0.98);
              for (let k = 0; k + 5 < 20; k += 6) glyph(X + 1, Yy + k, 5, 0x1a1414, gr, (gx, gy, gc) => glowPx(gx, gy, gc, 0.99));
            },
          });
          warm(x + sd * 3, y + 4, 8, 0.42);
        }
      // the people: thick down the alley, at the temple, couples under paper parasols
      for (let k = 0; k < 130; k++) folk(85 + fr() * 11, Y(h0 + 2 + fr() * (h1 - h0 - 4)));
      for (let k = 0; k < 14; k++) {
        const c = fr.pick([0xc8302a, 0xe0803a, 0xb83a6a, 0x3a5ab0]);
        folk(86 + fr() * 9, Y(h0 + 6 + fr() * (h1 - h0 - 12)), {
          coat: fr.pick([0xe86a9a, 0x9a5ac8, 0x3a8ac8, 0xf0a040]),
          extra: (X, Yy) => {
            for (let j = -3; j <= 2; j++) for (let i = -6; i <= 6; i++) if ((i / 6.2) ** 2 + (j / 3.2) ** 2 <= 1) glowPx(X + 1 + i, Yy - 5 + j, i === 0 ? scaleColor(c, 0.75) : i < -1 ? scaleColor(c, 1.2) : c, 0.97);
          },
        });
      }
      // the cross alley: stalls down both arms, its lanterns lit
      const kinds = ['takoyaki', 'kakigori', 'yakitori', 'ringo', 'men', 'kingyo'];
      [8, 30, 52, 102, 124, 146].forEach((x, k) => {
        const y = Y(5066) - 2;
        yatai(x, y, kinds[k]);
        knot(x + 9, y + 15, 9, 1.5, 6);
      });
      for (let k = 0; k < 60; k++) folk(2 + fr() * 176, Y(5053 + fr() * 2));
      // Hōzen-ji's Fudō, furred with centuries of moss, water thrown over it by a line of people with ladles (live)
      {
        const tx = 104;
        const tu = 5004;
        const fx = tx + 16;
        const fy = Y(tu + 20);
        objects.push({
          y: fy + 10,
          draw: () => {
            const CX = fx * S + 1;
            const CY = fy * S;
            for (let j = -27; j <= 21; j++)
              for (let i = -18; i <= 18; i++) {
                const head = (i / 7) ** 2 + ((j + 16) / 8) ** 2 < 1;
                const body = (i / 13) ** 2 + ((j - 3) / 18) ** 2 < 1;
                const halo = (i / 18) ** 2 + ((j + 7) / 21) ** 2 < 1 && j < 6;
                if (!head && !body && !halo) continue;
                const n = hashPx(i, j, 102);
                const c = head || body ? (n < 0.3 ? 0x6aa84e : n < 0.7 ? 0x3e7e3a : 0x265a2e) : n < 0.5 ? 0x1e4e28 : 0x163e20;
                glowPx(CX + i, CY + j, i < -4 && (head || body) ? scaleColor(c, 1.2) : c, 0.97);
              }
            for (let j = -12; j < 18; j++) for (let i = 0; i < 2; i++) glowPx(CX + 16 + i, CY + j, 0x5a9a5a, 0.97); // (his sword, under its moss)
          },
        });
        warm(fx, fy + 6, 14, 0.36, 0xffd8a0);
        const drip = [0, 1, 2].map((k) => {
          const out = new HiCanvas(10, 10);
          for (let d = 0; d < 6; d++) for (let j = 0; j < 8; j++) {
            const X = 6 + d * 3 + ((d + j + k) % 2);
            const Yy = 8 + ((j * 3 + k * 5 + d * 7) % 20);
            out.px(X, Yy, 0xc8f0ff, 0.8);
          }
          return kit.frame(out);
        });
        kit.loop(fx - 5, U(fy - 5), drip, { fps: 7, fx: 1, d: 0.1 });
        for (let k = 0; k < 16; k++) folk(fx - 15 + k * 1.2, fy + 13 + (k % 2) * 1.8, { hat: false });
        knot(tx + 53, Y(tu + 28), 15, 4, 24);
      }
      const ws = walkers(5070);
      for (const x of [86, 90, 94]) kit.path([[x, h0 + 6], [x, h1 - 6]], fr.pick(ws), { sp: 2.8, n: 3, gap: 58, mode: 'pp', hold: 2, turn: 'none', fps: 3, s0: fr() });
      for (const [a, b] of [[[6, 5059], [80, 5059]], [[100, 5059], [174, 5059]]]) kit.path([a, b], fr.pick(ws), { sp: 3, n: 2, gap: 30, mode: 'pp', hold: 2, turn: 'none', fps: 3, s0: fr() });
      const cat = capture(0, 500, 3, 2, () => {
        for (let i = 0; i < 7; i++) for (let j = 1; j < 4; j++) img.px(i, 500 * S + j, 0x2a2a30);
        img.px(7, 500 * S, 0x2a2a30);
        img.px(0, 500 * S, 0x2a2a30);
      }, { u: 5040 });
      kit.wander(90, 5040, 5, 60, [cat], { n: 1, sp: 3, idle: 0.6, turn: 'flip' });
    }
    // the head of the Dōtonbori canal: a waterside square with its plane trees, stalls, a railing along the water,
    // lamp standards, benches, and the crowd spilling off the bridges
    {
      const u0 = 4920; // (the water's edge)
      const u1 = 4950;
      for (let Yr = Y(u1) * S; Yr < Y(u0) * S; Yr++)
        for (let X = 0; X < W * S; X++) {
          if (!img.alphaPx(X, Yr)) continue;
          const row = Yr >> 2;
          const XX = X + (row % 2) * 4;
          const joint = Yr % 4 === 0 || XX % 8 === 0;
          const tone = hashPx(XX >> 3, row, 103);
          img.px(X, Yr, joint ? 0x4e4e5a : tone < 0.4 ? 0x70707c : tone < 0.8 ? 0x7c7c88 : 0x8a8a94);
        }
      for (let X = 0; X < W * S; X++) {
        const y0 = Y(u0) * S - 4;
        img.px(X, y0, 0xc8ccd4);
        img.px(X, y0 + 1, 0x7a7e88);
        if (X % 15 < 2) for (let j = 2; j < 5; j++) img.px(X, y0 + j, 0x6a6e78);
      }
      for (const x of [14, 66, 114, 166]) {
        const y = Y(4932);
        tree('broadleaf', x, y, 4.5, fr);
        warm(x, y + 3, 12, 0.3);
      }
      for (const [x, kind] of [[26, 'takoyaki'], [46, 'ringo'], [74, 'yakitori'], [124, 'kakigori'], [144, 'men']]) {
        const y = Y(u1) + 1;
        if (x > 70 && x < 100) continue;
        yatai(x, y, kind);
        knot(x + 9, y + 15, 8, 2, 7);
      }
      for (let x = 8; x < W; x += 28) {
        chochin(x, Y(u0) - 10, 0xfff0d0);
        warm(x, Y(u0) - 7, 10, 0.34);
      }
      for (let k = 0; k < 70; k++) folk(2 + fr() * 176, Y(u0 + 3 + fr() * 24));
      const ws = walkers(4935);
      for (const [a, b] of [[[4, 4926], [176, 4926]], [[176, 4932], [4, 4932]]]) kit.path([a, b], fr.pick(ws), { sp: 3.2, n: 4, gap: 44, mode: 'pp', hold: 2, turn: 'none', fps: 3, s0: fr() });
    }
    // under Tsūtenkaku: the square between its legs, the golden Billiken in his shrine, the angry chef of the
    // kushikatsu shops with his forks, stalls, the crowd; the district's name on arches across the avenue
    {
      const cx = 62;
      const top = Y(3290);
      for (let Yr = (top + 26) * S; Yr < (top + 92) * S; Yr++)
        for (let X = (cx - 26) * S; X < (cx + 26) * S; X++) {
          const dx = Math.abs(X / S - cx);
          const lim = 8 + (Yr / S - top - 24) * 0.25;
          const ring = Math.abs(dx - lim) < 2 ? 1 : 0;
          if (dx > lim + 8) continue;
          img.px(X, Yr, ((X >> 3) + (Yr >> 3)) % 2 ? (ring ? 0xc8a860 : 0x9a8e7a) : ring ? 0xb89850 : 0x887c6c);
        }
      warm(cx, top + 62, 30, 0.42, 0xffc880);
      const BY = top + 58;
      objects.push({
        y: BY + 10,
        shadow: () => shadowRect(cx - 4, BY + 7, 12, 3, 0.6),
        draw: () => {
          const CX = cx * S + 1;
          const Yy = BY * S;
          // the little red-and-white shrine, the gold seated figure with his pointed head, smiling, his soles out
          for (let j = -16; j < 24; j++) for (let i = -16; i <= 16; i++) if (Math.abs(i) > 13 || j < -13) glowPx(CX + i, Yy + j, j < -13 ? 0xe83a2a : i % 2 ? 0xf4f0e6 : 0xd83a2a, 0.97);
          for (let j = 24; j < 30; j++) for (let i = -18; i <= 18; i++) glowPx(CX + i, Yy + j, j === 24 ? 0xe8e4dc : 0xa8a49c, 0.96);
          for (let j = -12; j < 24; j++) {
            const hw = j < -2 ? Math.max(0, (j + 12) * 0.9) : j < 10 ? 9 : 11;
            for (let i = -hw; i <= hw; i++) {
              const I = Math.round(i);
              glowPx(CX + I, Yy + j, I < -3 ? 0xfff0a0 : I > 4 ? 0xb88a20 : 0xe8c040, 0.98);
            }
          }
          for (const sd of [-1, 1]) {
            glowPx(CX + sd * 3, Yy - 2, 0x2a1a0a, 0.98);
            for (let i = -3; i <= 3; i++) glowPx(CX + i, Yy + 4 + Math.round(-(i * i) / 5 + 1), 0x8a5a14, 0.98);
            for (let j = 16; j < 24; j++) for (let i = 2; i < 11; i++) glowPx(CX + sd * i, Yy + j, 0xf8d860, 0.98);
          }
        },
      });
      for (let k = 0; k < 12; k++) folk(cx - 10 + k * 1.6, BY + 13 + (k % 3));
      // the chef, huge and furious, a skewer in each hand
      {
        const x = cx + 20;
        const y = top + 76;
        objects.push({
          y: y + 10,
          shadow: () => shadowRect(x - 3, y + 8, 10, 3, 0.6),
          draw: () => {
            const CX = x * S;
            const Yy = y * S;
            for (let j = -18; j < 27; j++)
              for (let i = -12; i <= 12; i++) {
                const head = (i / 10) ** 2 + ((j + 7) / 11) ** 2 < 1;
                const body = j >= 2 && Math.abs(i) < 12;
                if (!head && !body) continue;
                let c = head ? (j < -11 ? 0x1a1a22 : i < -4 ? 0xf0d0a8 : 0xd8a878) : (j % 4 === 0 ? 0xc8d0e8 : 0xf4f4f8);
                if (head && Math.abs(i) > 2 && Math.abs(i) < 8 && j > -10 && j < -7) c = 0x1a1a22;
                if (head && j > -2 && j < 2 && Math.abs(i) < 6) c = 0x7a1a14;
                if (body && j > 14) c = 0x1e3a6a;
                glowPx(CX + i, Yy + j, c, 0.98);
              }
            for (const sd of [-1, 1]) for (let k = 0; k < 20; k++) glowPx(CX + sd * (13 + Math.round(k * 0.3)), Yy + 6 - k, k > 10 ? 0xc8884a : 0xc8c8d0, 0.98);
          },
        });
        warm(x, y + 8, 14, 0.5);
        knot(x, y + 13, 8, 2, 7);
      }
      // (between the legs, on the square: the avenue to the west and the cross street to the south stay clear)
      for (const [y, kind] of [[top + 50, 'yakitori'], [top + 67, 'takoyaki']]) {
        yatai(37, y, kind);
        knot(46, y + 15, 7, 1.5, 6);
      }
      knot(cx, top + 84, 30, 5, 46);
      for (let u = SHINSEKAI[0] + 4; u < SHINSEKAI[1]; u += 26) for (const x of [75, 105]) if (padFree(x, Y(u), 14)) knot(x, Y(u), 3, 7, 5);
      // the arches across Midōsuji with the district's name, bulbs chasing round them
      for (const u of [SHINSEKAI[0] + 70, SHINSEKAI[1] - 120]) {
        const y = Y(u);
        const frames = [0, 1, 2].map((p) =>
          capture(70, y - 4, 40, 12, () => {
            const X0 = 70 * S;
            const X1 = 110 * S;
            const Y0 = (y - 4) * S;
            const r = rng(u);
            const g0 = [0, 1, 2, 3, 4].map(() => Math.floor(r() * 1e6));
            for (let Yy = Y0; Yy < Y0 + 30; Yy++)
              for (let X = X0; X < X1; X++) {
                const e = Math.min(X - X0, X1 - 1 - X, Yy - Y0, Y0 + 29 - Yy);
                glowPx(X, Yy, e === 0 ? 0x1a1414 : e < 4 ? (e === 2 && (X + Yy + p * 2) % 6 < 2 ? 0xfff8c0 : 0x1e4a8a) : 0x0e2a6a, 0.99);
              }
            g0.forEach((g, k) => glyph(X0 + 12 + k * 20, Y0 + 7, 15, 0xfff4c8, rng(g), (gx, gy, gc) => {
              for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) glowPx(gx + a, gy + b, gc, 0.99);
            }));
            for (const PX of [X0, X1 - 6]) for (let j = 30; j < 60; j++) for (let i = 0; i < 6; i++) glowPx(PX + i, Y0 + j, i < 2 ? 0xc8ccd8 : 0x6a7080, 0.97);
          }, { u }),
        );
        kit.loop(70, U(y - 4), frames, { fps: 4, d: 0.22 });
        warm(90, y + 6, 26, 0.45, 0xa8c8ff);
      }
      // the rose garden's visitors, by day
      for (let k = 0; k < 34; k++) {
        const col = Math.floor(fr() * 3);
        folk(1 + col * 8 + fr() * 1.6, Y(1410 + fr() * 86), { hat: fr() < 0.3 });
      }
    }

    // ---- 2. Namba Yasaka: the shrine whose hall is a giant lion's head with a stage in its mouth
    {
      const [y0u, y1u] = YASAKA;
      gravelGround(0, W, y0u, y1u, 64);
      // the worn stone approach, straight up to the lion's stage, and raked gravel either side of it
      ishidatami(80, 100, y0u + 4, 5244);
      for (let FYr = Y(5246) * S; FYr < Y(y0u + 2) * S; FYr += 4) for (let X = 30 * S; X < 150 * S; X++) if (X < 79 * S || X > 101 * S) img.tintPx(X, FYr, 0.86);
      // the stone torii at the entrance, lanterns along the approach
      {
        const cx = 90;
        const y = Y(5186);
        stoneTorii(cx, y + 13, 26, 24);
        reserveRect(cx - 20, y - 1, 40, 14);
      }
      for (let u = 5192; u < 5240; u += 10) {
        stoneLantern(74, Y(u));
        stoneLantern(104, Y(u));
      }
      // the lion's head (Shishi-den): green face, great white eyes, a red mouth open wide around the stage
      {
        const cx = 90;
        const yb = Y(5244);
        const top = yb - 79;
        objects.push({
          y: yb + 4,
          shadow: () => {
            for (let y = top + 6; y < yb + 8; y++) for (let x = cx - 26; x < cx + 40; x++) if (((x - cx - 8) / 34) ** 2 + ((y - (top + yb) / 2 - 6) / 30) ** 2 < 1) img.tint(x, y, 0.55);
          },
          draw: () => {
            drawLionHall(img, cx, yb);
          },
        });
        reserveRect(cx - 41, top - 8, 82, yb - top + 14);
        for (const s of [-1, 1]) {
          chochin(cx + s * 36, yb - 30, 0xff5a30);
          chochin(cx + s * 36, yb - 20, 0xfff0d0);
          chochin(cx + s * 36, yb - 10, 0xff5a30);
        }
      }
      templeHall(66, Y(5352), 48, 16, 7, { ramp: BARK });
      crowd(30, Y(5246), 120, 60, 70, false);
      crowd(40, Y(5244), 100, 40, 60, true);
      // lanterns strung across the precinct for the festival, an ema rack, a hand-washing basin
      lanternString(32, Y(5320), 148, Y(5320));
      lanternString(32, Y(5296), 52, Y(5250));
      lanternString(148, Y(5296), 128, Y(5250));
      objects.push({
        y: Y(5330) + 6,
        draw: () => {
          const x = 124;
          const y = Y(5330);
          img.rect(x, y, 22, 1, WOOD[1]);
          for (let i = 0; i < 7; i++) img.rect(x + 1 + i * 3, y + 1, 2, 3, i % 3 ? 0xd8c49a : 0xc8b080);
          img.rect(x, y + 4, 22, 1, WOOD[0]);
          img.rect(34, y + 2, 12, 4, STONE[2]);
          img.rect(35, y + 3, 10, 2, 0x2a5060);
          glow(40, y + 2, 0xd8e8ff, 0.4);
        },
      });
      // the neighbourhood around the shrine
      oldRows(0, 30, y0u + 6, y1u - 6);
      oldRows(152, W, y0u + 6, y1u - 6);
      for (let k = 0; k < 14; k++) {
        const x = 34 + rand() * 112;
        const u = 5250 + rand() * 110;
        if (!anyRes(x - 4, Y(u) - 4, 8, 8)) tree(rand() < 0.5 ? 'broadleaf' : 'pine', x, Y(u), 4 + rand() * 2);
      }
      // --- the festival: the great tug of war (tsunahiki) on the approach, the portable shrine going round, stalls all
      // down both flanks, a drum tower, walls of named lanterns either side of the lion's steps
      const u0 = 5208; // the rope's row
      const rope = [0, 3, -3].map((shift) =>
        capture(60, Y(u0) - 9, 60, 18, () => {
          const CY = (9 + Y(u0) - 9) * S;
          const CX = 90 * S + shift;
          for (let i = -78; i <= 78; i++) {
            const sag = Math.round(Math.sin(i * 0.09) * 1.2);
            for (let j = 0; j < 7; j++) glowPx(CX + i, CY + sag + j, (i + j * 2 + 400) % 5 < 2 ? 0x9a8448 : j < 2 ? 0xf0dfa8 : j > 4 ? 0xa8945a : 0xd8c484, 0.98);
          }
          // the knot at the middle, its red and white flag, the referee with his fan beside it
          for (let j = -8; j < 8; j++) for (let i = 0; i < 4; i++) glowPx(CX + i, CY + j, j < -3 ? (i % 2 ? 0xffffff : 0xe83a2a) : 0x8a6a3a, 0.98);
          const pr = rng(7);
          personPx(90 * S + 4, CY - 22, pr, { coat: 0xf4f0e6 });
          // the two teams hauling, blue happi on one side and red on the other, leaning back
          for (const sd of [-1, 1])
            for (let k = 0; k < 10; k++) {
              const PX = CX + sd * (12 + k * 7) - (sd < 0 ? 3 : 0) + sd * 2;
              personPx(PX, CY - 7 + (k % 2) * 13, rng(k * 13 + sd + 20), { coat: sd < 0 ? 0x2a4ab0 : 0xc8302a, hat: k % 3 === 0 });
            }
        }, { u: u0 }),
      );
      kit.loop(60, U(Y(u0) - 9), rope, { seq: [0, 1, 1, 0, 2, 2], fps: 2.2, d: 0.14 });
      warm(90, Y(u0) + 2, 34, 0.42);
      // the crowd cheering them on, round three sides of the ring
      for (const sd of [-1, 1]) knot(90 + sd * 40, Y(u0) + 3, 5, 9, 12);
      knot(76, Y(u0) + 13, 10, 3, 14, { hat: false });
      knot(104, Y(u0) + 13, 10, 3, 14, { hat: false });
      knot(76, Y(u0) - 13, 10, 3, 10);
      knot(104, Y(u0) - 13, 10, 3, 10);
      // stalls down both flanks of the lion, faces to the walkway
      const kinds = ['takoyaki', 'kingyo', 'ringo', 'yakitori', 'men', 'kakigori'];
      let ki = 0;
      for (let u = 5344; u > 5256; u -= 17)
        for (const x of [31, 131]) {
          const y = Y(u);
          yatai(x, y, kinds[ki++ % kinds.length]);
          knot(x + 9, y + 15, 9, 2, 6);
        }
      // the mikoshi itself, gold roof and phoenix on the shoulders of its bearers in white, chanting up and down
      {
        const frames = [0, 1].map((bob) =>
          capture(0, 0, 26, 26, () => {
            const CX = 39;
            const pr = rng(31);
            for (let k = 0; k < 12; k++) personPx(CX - 30 + (k % 6) * 12, 42 + (k > 5 ? 22 : 0) + (k % 2 ? bob : 1 - bob), pr, { coat: 0xf4f0e6 });
            const Yb = 30 - bob;
            for (let i = -34; i <= 34; i++) for (const r of [Yb + 22, Yb + 30]) for (let j = 0; j < 2; j++) img.px(CX + i, r + j, j ? 0x3a2a14 : 0xb08a3a);
            for (let j = 0; j < 20; j++) for (let i = -12; i <= 12; i++) glowPx(CX + i, Yb + 8 + j, Math.abs(i) > 10 ? 0xd8a020 : i % 5 === 0 ? 0xf4d060 : j % 6 === 0 ? 0xf4d060 : 0x7a1a1a, 0.96);
            for (let j = 0; j < 12; j++) {
              const hw = 20 - j * 1.4;
              for (let i = -hw; i <= hw; i++) glowPx(CX + Math.round(i), Yb + 8 - j, j === 0 ? 0xfff0a0 : Math.round(i) % 4 === 0 ? 0xf4d060 : 0xd8a020, 0.98);
            }
            for (const [i, j] of [[0, 0], [-1, 1], [1, 1], [0, 2], [-2, -1], [2, -1], [0, -2]]) glowPx(CX + i, Yb - 7 + j, 0xfff8c8, 0.98);
          }, { u: 5174 }),
        );
        kit.path([[38, 5172], [142, 5172]], frames, { sp: 3.2, mode: 'pp', hold: 3, turn: 'none', fps: 2.5, s0: 0.2, d: 0.2 });
        knot(50, Y(5166), 12, 3, 8);
        knot(130, Y(5166), 12, 3, 8);
      }
      // the drum tower: a scaffold in red and white bunting, two drummers (live) on top, lanterns on every side
      {
        const x = 36;
        const y = Y(5244);
        objects.push({
          y: y + 18,
          shadow: () => shadowRect(x + 3, y + 3, 22, 18, 0.55),
          draw: () => {
            const X = x * S;
            const Yy = y * S;
            for (let j = 0; j < 30; j++) for (let i = 0; i < 60; i++) img.px(X + i, Yy + 24 + j, Math.floor(i / 6) % 2 ? 0xe83a2a : 0xf4f0e6);
            for (const PX of [X, X + 28, X + 56]) for (let j = 0; j < 54; j++) for (let i = 0; i < 4; i++) img.px(PX + i, Yy + j, i < 2 ? 0x7a5835 : 0x46301f);
            for (let j = 0; j < 24; j++) for (let i = 0; i < 60; i++) img.px(X + i, Yy + j, j < 2 ? 0x8a6a48 : (i + j) % 6 === 0 ? 0x46301f : 0x5e4229);
            for (let i = 2; i < 58; i += 8) for (let j = 0; j < 7; j++) for (let k = 0; k < 4; k++) glowPx(X + i + k, Yy + 15 + j, j === 0 || j === 6 ? 0x1a1414 : j % 2 ? 0xff6a3a : 0xffd080, 0.98);
          },
        });
        warm(x + 10, y + 12, 18, 0.5);
        const drum = [0, 1].map((beat) =>
          capture(x + 4, y - 6, 14, 12, () => {
            const CX = (x + 11) * S;
            const CY = (y + 1) * S;
            for (let j = -9; j <= 9; j++) for (let i = -9; i <= 9; i++) if (i * i + j * j < 90) img.px(CX + i, CY + j, i * i + j * j > 60 ? 0x5a2a14 : 0xe8d8b8);
            for (const sd of [-1, 1]) {
              personPx(CX + sd * 16 - 1, CY - 2, rng(sd + 3), { coat: 0xf4f0e6 });
              const up = (beat ? sd > 0 : sd < 0) ? -5 : 0;
              for (let k = 0; k < 7; k++) img.px(CX + sd * (14 - k), CY - 3 + up + (up ? k : 0), 0xd8b070);
            }
          }, { u: U(y) }),
        );
        kit.loop(x + 4, U(y - 6), drum, { fps: 4, d: 0.12 });
        knot(x + 12, y + 22, 13, 3, 10);
      }
      // walls of named paper lanterns either side of the lion's steps, the way a shrine thanks its donors
      for (const x0 of [53, 109]) {
        const y = Y(5240);
        objects.push({
          y: y + 14,
          shadow: () => shadowRect(x0 + 2, y + 2, 18, 14, 0.55),
          draw: () => {
            const X = x0 * S;
            const Yy = y * S;
            const gr = rng(x0);
            for (let i = 0; i < 54; i++) for (const r of [0, 14, 28]) for (let j = 0; j < 2; j++) img.px(X + i, Yy + r + j, j ? 0x2a1e18 : 0x7a5835);
            for (const PX of [X, X + 52]) for (let j = 0; j < 42; j++) for (let i = 0; i < 2; i++) img.px(PX + i, Yy + j, 0x46301f);
            for (const r of [0, 14, 28])
              for (let k = 0; k < 8; k++) {
                const LX = X + 3 + k * 6;
                for (let j = 0; j < 10; j++) for (let i = 0; i < 5; i++) if (!((j === 0 || j === 9) && (i === 0 || i === 4))) glowPx(LX + i, Yy + r + 2 + j, j === 0 || j === 9 ? 0x1a1414 : j % 2 ? 0xfff4d8 : 0xffe4a8, 0.98);
                for (let j = 3; j < 8; j += 2) glowPx(LX + 2, Yy + r + 2 + j, gr() < 0.5 ? 0x1a1414 : 0xc83a2a, 0.9);
              }
          },
        });
        warm(x0 + 9, y + 14, 16, 0.45, 0xffe0a8);
      }
      // fire baskets at the foot of the steps (live), people on the steps and thronging the approach
      {
        const flames = [0, 1, 2, 3].map((k) => {
          const out = new HiCanvas(5, 7);
          const r = rng(k * 7 + 3);
          for (let t = 0; t < 4; t++) {
            const bx = 6 + t * 1.5 + (r() - 0.5) * 2;
            const h = 9 + r() * 8;
            for (let j = 0; j < h; j++) {
              const w = 2.6 * (1 - j / h);
              for (let i = -w; i <= w; i++) out.px(Math.round(bx + i + Math.sin(j * 0.5 + k) * (j / h) * 2), 20 - j, j / h < 0.3 ? 0xfff0a0 : j / h < 0.6 ? 0xffa030 : 0xe8501a);
            }
          }
          return kit.frame(out);
        });
        for (const x of [74, 101]) {
          kit.loop(x, 5256 - 12, flames, { fps: 9, fx: 1, d: 0.16 });
          warm(x + 3, Y(5240), 13, 0.6, 0xff9a40);
        }
      }
      for (let k = 0; k < 90; k++) folk(82 + fr() * 16, Y(5176 + fr() * 64));
      knot(90, Y(5238), 18, 4, 30);
      for (const x of [62, 118]) knot(x, Y(5254), 11, 3, 8);
      const ws = walkers(5230);
      for (const [x, u0w, u1w] of [[84, 5180, 5196], [96, 5180, 5196], [85, 5222, 5240], [95, 5222, 5240], [50, 5252, 5340], [130, 5252, 5340]])
        kit.path([[x, u0w], [x, u1w]], fr.pick(ws), { sp: 3 + fr() * 1.4, n: u1w - u0w > 40 ? 3 : 1, gap: 26, mode: 'pp', hold: 2, turn: 'none', fps: 3, s0: fr() });
    }

    // ---- 3. Kuromon Ichiba: the covered market, "Osaka's kitchen"
    {
      const [k0, k1] = KUROMON;
      ishidatami(0, W, k0, k1);
      const ax0 = 64;
      const ax1 = 116;
      const m1 = 5560;
      // the arcade's floor, warm terrazzo in big squares, worn pale down the middle, a drain along each side
      for (let Yr = Y(m1) * S; Yr < Y(k0) * S; Yr++)
        for (let X = ax0 * S; X < ax1 * S; X++) {
          const tile = (Math.floor(X / 18) + Math.floor(Yr / 18)) % 2;
          const joint = X % 18 === 0 || Yr % 18 === 0;
          let c = joint ? 0x6a5a48 : tile ? 0xb8a488 : 0xa89478;
          if (Math.abs(X - 90 * S) < 42 && !joint) c = scaleColor(c, 1.12);
          if (hashPx(X, Yr, 71) < 0.1) c = scaleColor(c, 0.92);
          img.px(X, Yr, c);
        }
      /** A market stall, its awning and hanging sign, what it sells piled up on crushed ice or trays, the fishmonger. */
      const SHOP = { fish: [0x2a5ab0, 0xf4f4f8], crab: [0xc8302a, 0xf4f0e6], tuna: [0x1a1a22, 0xe8e8ec], uni: [0xd88a20, 0xf8f0d8], fruit: [0x3a9a4a, 0xf8f8e8], grill: [0x2a2a30, 0xe07a30], veg: [0x5aa03a, 0xf0f0d8] };
      const stallAt = (x0, y, kind, face) => {
        const [A, B] = SHOP[kind];
        const X = x0 * S;
        const Yy = y * S;
        const FW = 42;
        const lit = (i, j, c) => glowPx(X + i, Yy + j, c, 0.97);
        const sr = rng(x0 * 37 + y);
        objects.push({
          y: y + 10,
          draw: () => {
            // the seller behind the goods
            for (let j = 6; j < 10; j++) for (let i = 0; i < FW; i++) lit(i, j, 0x2a1e18);
            const VX = face < 0 ? 28 : 10;
            for (let k = 0; k < 3; k++) {
              lit(VX + k, 6, 0x2a2024);
              lit(VX + k, 7, k === 1 ? 0xf0d0b0 : 0xf4f4f0);
              lit(VX + k, 8, 0xf0d0b0);
              lit(VX + k, 9, 0xf4f4f0);
            }
            // the goods, rows 10..24
            for (let j = 10; j < 25; j++)
              for (let i = 1; i < FW - 1; i++) {
                const n = hashPx(i, j, x0 + y);
                let c;
                if (kind === 'fish') {
                  c = n < 0.5 ? 0xe8f2f8 : n < 0.8 ? 0xcfe2ec : 0xf8fcff; // (crushed ice)
                  const row = (j - 11) % 5;
                  const sh = (i + ((j - 11) >> 2) * 4) % 13;
                  if (row < 3 && sh < 10) {
                    c = sh === 0 ? 0x1a1a22 : row === 0 ? 0x5a7a9a : row === 1 ? (sh > 7 ? 0x3a5a7a : 0xb8c8d4) : 0x8aa0b4;
                    if (sh === 1 && row === 1) c = 0x101010;
                    if (((i + j) >> 3) % 3 === 1) c = sh === 0 ? 0x8a1a1a : row === 0 ? 0xe05a4a : row === 1 ? 0xf08a7a : 0xc84a3a; // (red sea bream)
                  }
                } else if (kind === 'crab') {
                  c = (i + j) % 5 === 0 ? 0x1a4a7a : 0x2a5a8a; // (the blue tray)
                  const cx = ((i >> 0) % 13) - 6;
                  const cy = ((j - 10) % 8) - 3;
                  const q = cx * cx + cy * cy * 2;
                  if (q < 13) c = q < 4 ? 0xff8a6a : 0xe83a2a;
                  else if (q < 36 && (cx + cy * 2 + 40) % 3 === 0) c = 0xc83020; // (its legs)
                } else if (kind === 'tuna') {
                  c = j % 5 === 0 ? 0xf0e8e4 : 0xf8f4f0;
                  const k = i % 11;
                  if (k < 8 && (j - 10) % 5 < 4) c = (j + k) % 4 === 0 ? 0xf08a8a : (i >> 3) % 2 ? 0xc01a2a : 0xe0404a;
                } else if (kind === 'uni') {
                  c = i % 10 === 0 || (j - 10) % 7 === 0 ? 0x8a6a40 : (i + j) % 2 ? 0xf0a030 : 0xf8b840;
                } else if (kind === 'fruit') {
                  const b = Math.floor(i / 10) % 4;
                  const on = (i % 5 < 4 && (j - 10) % 5 < 4);
                  c = i % 10 === 0 ? 0xc8a878 : !on ? 0x5a4428 : b === 0 ? ((i + j) % 2 ? 0xd8e8a0 : 0xb8d078) : b === 1 ? 0xe82a3a : b === 2 ? 0xf0901a : 0x8a3ab0;
                  if (on && b !== 0 && i % 5 === 1 && (j - 10) % 5 === 1) c = 0xffffff;
                } else if (kind === 'veg') {
                  const b = Math.floor(i / 8) % 3;
                  c = b === 0 ? ((j + i) % 3 ? 0x4a9a3a : 0x6ab84a) : b === 1 ? (i % 3 ? 0xf4f0e8 : 0xd8d4c8) : (j % 3 ? 0xe8701a : 0x4a8a2a);
                } else {
                  // the grill: scallops in their shells over the coals, skewers, the fire showing through
                  c = n < 0.3 ? 0xff7a20 : n < 0.5 ? 0xd8401a : 0x241c1a;
                  const sx = i % 9;
                  const sy = (j - 10) % 7;
                  if ((sx - 4) ** 2 + (sy - 3) ** 2 < 11) c = (sx - 4) ** 2 + (sy - 3) ** 2 < 4 ? 0xf8e0b8 : 0xc8b090;
                }
                lit(i, j, c);
              }
            // the counter's front with its price cards
            for (let j = 25; j < 30; j++) for (let i = 0; i < FW; i++) lit(i, j, j === 25 ? 0xc8a878 : j === 29 ? 0x3a2a1c : i % 14 < 2 ? 0x5e4229 : 0x7a5835);
            for (let i = 4; i < FW - 6; i += 8) {
              for (let j = 26; j < 29; j++) for (let k = 0; k < 5; k++) lit(i + k, j, k === 2 && j === 27 ? 0xd8302a : 0xf8f4e0);
            }
            // the awning and the sign hanging from it
            for (let j = 0; j < 6; j++) for (let i = 0; i < FW; i++) lit(i, j, j === 0 ? scaleColor(A, 1.2) : j === 5 && i % 6 > 3 ? 0x2a1e18 : Math.floor(i / 6) % 2 ? A : B);
            for (let j = 0; j < 5; j++) for (let i = 13; i < 29; i++) lit(i, j, j === 0 || j === 4 ? 0x3a2a1c : 0xfff8e0);
            for (let k = 0; k < 3; k++) glyph(X + 15 + k * 4, Yy + 1, 3, 0x1a1414, sr, (gx, gy, gc) => glowPx(gx, gy, gc, 0.98));
            // two bare bulbs over the goods
            for (const BX of [8, 34]) {
              glowPx(X + BX, Yy + 6, 0xfff8d8, 1);
              glowPx(X + BX + 1, Yy + 6, 0xfff8d8, 1);
            }
          },
        });
        if (kind === 'grill') {
          kit.emit(x0 + 7, U(y + 3), stallSteam, { rate: 1.6, life: [1.2, 2], vy: 6, sx: 1.6, wf: 0.6, a: 0.42, tint: 1 });
        }
      };
      // the stalls on both sides of the walk under the arcade
      for (let u = k0 + 6; u < m1; u += 12)
        for (const [sx0, sx1] of [[ax0 + 1, ax0 + 15], [ax1 - 15, ax1 - 1]]) {
          const kind = rand.pick(['fish', 'crab', 'tuna', 'uni', 'fruit', 'grill', 'fish', 'veg']);
          const y = Y(u + 10);
          // (the draws the old drawing made, so what follows keeps its place)
          if (kind === 'fruit' || kind === 'veg') for (let k = 0; k < 96; k++) rand.pick([0]);
          stallAt(sx0, y, kind, sx0 < 90 ? 1 : -1);
          // customers at the counter, in the aisle in front of it, a shopping bag or two
          if (fr() < 0.8) knot(sx0 < 90 ? sx1 + 1.5 : sx0 - 2.5, y + 6, 1.2, 3, 2 + Math.floor(fr() * 3));
          reserveRect(sx0, y, sx1 - sx0, 10);
        }
      crowd(ax0 + 16, Y(m1), ax1 - ax0 - 32, m1 - k0, 140, true);
      for (let k = 0; k < 150; k++) folk(82 + fr() * 16, Y(k0 + 4 + fr() * (m1 - k0 - 8)));
      for (let u = k0 + 12; u < m1; u += 12) warm(90, Y(u), 22, 0.32, 0xfff0d0);
      // the arcade roof: a frame of arches and glass, the market's name in lights at the gate
      objects.push({
        y: Y(k0),
        draw: () => {
          // the arcade's frame: arched ribs, a spine down the middle hung with lamps, the outer rails
          for (let u = k0; u < m1; u++) {
            const y = Y(u);
            const rib = (u - k0) % 12 === 0;
            for (let X = ax0 * S; X < ax1 * S; X++) {
              const lx = X - ax0 * S;
              const edge = lx < 3 || lx >= (ax1 - ax0) * S - 3;
              if (edge) for (let j = 0; j < S; j++) img.px(X, y * S + j, lx === 0 || lx === (ax1 - ax0) * S - 1 ? 0x4a4e56 : 0x8a8e96);
              else if (rib) img.px(X, y * S, 0xb8c0c8, 0.55);
            }
            for (let j = 0; j < S; j++) {
              img.px(90 * S, y * S + j, 0x8a8e96, 0.7);
              img.px(90 * S + 1, y * S + j, 0x4a4e56, 0.7);
            }
            // paper lanterns and strip lights hung from the spine, banners of the market's season at every fourth rib
            if ((u - k0) % 12 === 6) for (let k = -1; k <= 2; k++) for (let j = 0; j < 3; j++) glowPx(90 * S + k, y * S + j, 0xfff8e0, 1);
            if ((u - k0) % 48 === 12)
              for (const sd of [-1, 1]) {
                const BX = 90 * S + sd * 30;
                for (let j = 0; j < 15; j++) for (let i = 0; i < 12; i++) glowPx(BX + i - 6, y * S + j, j === 0 || (j === 14 && i % 3 === 1) ? 0x1a1414 : i < 3 || i > 8 ? 0xc8302a : 0xf4f0e6, 0.97);
              }
          }
        },
      });
      // the gates at each end: the market's great lit sign on its arch, bulbs chasing round it
      for (const [u, name] of [[m1 + 2, 1], [k0 + 7, 2]]) {
        const y = Y(u);
        const r = rng(name * 17);
        const glyphs = Array.from({ length: 4 }, () => Math.floor(r() * 1e6));
        const frames = [0, 1, 2].map((p) =>
          capture(ax0 - 2, y - 3, ax1 - ax0 + 4, 12, () => {
            const X0 = (ax0 - 2) * S;
            const X1 = (ax1 + 2) * S;
            const Y0 = (y - 3) * S;
            for (let Yy = Y0; Yy < Y0 + 36; Yy++)
              for (let X = X0; X < X1; X++) {
                const e = Math.min(X - X0, X1 - 1 - X, Yy - Y0, Y0 + 35 - Yy);
                glowPx(X, Yy, e === 0 ? 0x1a1414 : e < 4 ? (e === 2 && (X + Yy + p * 2) % 6 < 2 ? 0xfff8c0 : 0x7a1a14) : 0xc8202a, 0.99);
              }
            glyphs.forEach((g, k) => glyph(X0 + 42 + k * 24, Y0 + 9, 18, 0xfff4c8, rng(g), (gx, gy, gc) => {
              for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) glowPx(gx + a, gy + b, gc, 0.99);
            }));
          }, { u }),
        );
        kit.loop(ax0 - 2, U(y - 3), frames, { fps: 4, d: 0.22 });
        warm(90, y + 7, 34, 0.55, 0xffa070);
      }
      // (live) shoppers up and down the aisle, a porter with his stack of polystyrene fish boxes, steam, a stray cat
      {
        const ws = walkers(5470);
        for (const x of [83, 86, 89, 92, 95, 97])
          kit.path([[x, k0 + 12], [x, m1 - 12]], fr.pick(ws), { sp: 2.6 + fr() * 1.6, n: 3, gap: 56, mode: 'pp', hold: 1.5, turn: 'none', fps: 3, s0: fr(), d: 0.03 });
        const cart = [0, 1].map((st) =>
          capture(0, 0, 6, 10, () => {
            for (let j = 0; j < 14; j++) for (let i = 0; i < 16; i++) glowPx(1 + i, 1 + j, j % 5 === 0 ? 0xc8d0d8 : i % 8 === 0 ? 0xd8e0e8 : 0xf4f4f8, 0.98);
            for (const i of [2, 14]) for (let j = 14; j < 17; j++) img.px(i, j, 0x1a1a20);
            personPx(7, 20 + st, rng(3), { coat: 0x2a3a5a, hat: true });
          }, { u: 5470 }),
        );
        kit.path([[85, k0 + 16], [85, m1 - 16]], cart, { sp: 5, mode: 'pp', hold: 4, turn: 'none', fps: 3, s0: 0.3, d: 0.05 });
      }
      reserveRect(ax0, Y(m1), ax1 - ax0, m1 - k0);
      // side streets: small shops and eateries with neon
      district(0, ax0 - 2, k0 + 4, m1, 'shop');
      district(ax1 + 2, W, k0 + 4, m1, 'shop');
      // the plaza at the north end: benches, a food truck, people eating
      // the food court: long tables under strings of bulbs, a yatai row along the back, a kitchen van, everybody eating
      for (const [x, u, kind] of [[8, 5606, 'takoyaki'], [28, 5606, 'yakitori'], [134, 5606, 'kakigori'], [154, 5606, 'ringo']]) {
        yatai(x, Y(u), kind);
        knot(x + 9, Y(u) + 15, 9, 2, 7);
      }
      {
        const X = 76 * S;
        const Yy = Y(5580) * S;
        objects.push({
          y: Y(5580) + 11,
          shadow: () => shadowRect(79, Y(5580) + 4, 28, 9, 0.55),
          draw: () => {
            for (let j = 0; j < 33; j++)
              for (let i = 0; i < 84; i++) {
                let c = j < 6 ? (j === 0 ? 0xffffff : 0xf0ece4) : j < 10 ? 0xd83a2a : 0xe8e0d0;
                if (j > 12 && j < 26 && i > 12 && i < 58) c = i % 11 === 0 || j === 13 ? 0xd8d0c0 : 0xfff0c0;
                if (j > 28) c = i % 20 < 8 && (i < 16 || i > 64) ? 0x1a1a20 : 0xa8a094;
                glowPx(X + i, Yy + j, c, 0.96);
              }
            for (let i = 16; i < 54; i += 12) personPx(X + i, Yy + 15, rng(i), { coat: 0xf4f4f0, hat: true });
            for (let j = 12; j < 16; j++) for (let i = 62; i < 80; i++) glowPx(X + i, Yy + j, (i + j) % 3 ? 0xffe060 : 0xff6a3a, 0.97);
          },
        });
        warm(90, Y(5580) + 10, 26, 0.5, 0xfff0c0);
        kit.emit(84, 5578, stallSteam, { rate: 1.5, life: [1.2, 2], vy: 6, sx: 2, wf: 0.6, a: 0.42, tint: 1 });
        knot(90, Y(5580) + 16, 16, 3, 18);
      }
      for (const [bx, bu] of [[20, 5580], [146, 5598], [84, 5600], [36, 5572], [130, 5572], [40, 5598]]) {
        if (!padFree(bx + 6, Y(bu), 13)) continue;
        const y = Y(bu);
        objects.push({
          y: y + 5,
          shadow: () => shadowRect(bx + 2, y + 2, 14, 4, 0.6),
          draw: () => {
            for (let j = 0; j < 9; j++) for (let i = 0; i < 42; i++) glowPx(bx * S + i, y * S + j, j === 0 ? 0xc8a878 : j > 7 ? 0x3a2a1c : j % 3 ? 0x8a6a48 : 0x7a5835, 0.95);
            for (let k = 0; k < 5; k++) for (let j = 2; j < 5; j++) for (let i = 0; i < 4; i++) glowPx(bx * S + 3 + k * 8 + i, y * S + j, k % 2 ? 0xf4f0e6 : 0xd8703a, 0.97);
            for (let k = 0; k < 6; k++) {
              personPx(bx * S + 2 + k * 7, y * S - 7, rng(k + bx), {});
              personPx(bx * S + 2 + k * 7, y * S + 8, rng(k + bx + 50), {});
            }
          },
        });
        warm(bx + 7, y + 3, 12, 0.35);
      }
      for (const [x0, u, x1] of [[6, 5600, 174], [6, 5578, 174]]) {
        const y = Y(u);
        const strand = new HiCanvas(x1 - x0, 6);
        for (let i = 0; i < (x1 - x0) * S; i++) {
          const j = 9 + Math.round(Math.sin((i / ((x1 - x0) * S)) * Math.PI * 7) * 5);
          strand.px(i, j, 0x1a1418);
          if (i % 12 === 0) for (const [a, b] of [[0, 1], [1, 1], [0, 2], [1, 2]]) strand.px(i + a, j + b, 0xfff0b0);
        }
        kit.loop(x0, u + 3, [kit.frame(strand)], { fps: 1, d: 0.1 });
      }
      for (let k = 0; k < 70; k++) folk(6 + fr() * 168, Y(5562 + fr() * 42));
      crowd(4, Y(k1 - 2), 172, 44, 50, false);
      for (const x of [10, 40, 140, 170]) chochin(x, Y(5606), 0xff5a30);
    }

    // ---- 4. Shitennō-ji: the oldest temple, its pagoda and golden hall inside vermilion cloisters
    {
      const [s0, s1] = SHITEN;
      gravelGround(0, W, s0, s1, 66);
      // the stone torii at the gate, the great south gate
      {
        const cx = 90;
        const y = Y(5622);
        stoneTorii(cx, y + 12, 30, 25);
        reserveRect(cx - 22, y - 1, 44, 13);
      }
      templeHall(64, Y(5650), 52, 14, 8, { gate: true });
      // the cloisters: a covered vermilion corridor all the way round the inner precinct
      const cx0 = 22;
      const cx1 = 158;
      const cu0 = 5664;
      const cu1 = 5886;
      for (let u = cu0; u < cu1; u++)
        for (let x = cx0; x < cx1; x++) {
          const d = Math.min(x - cx0, cx1 - 1 - x, u - cu0, cu1 - 1 - u);
          if (d >= 7) continue;
          const southSide = u - cu0 < 7;
          let c;
          const northSide = cu1 - 1 - u < 7;
          if (southSide && d < 7 && u - cu0 >= 4) c = (x - cx0) % 4 === 0 ? VERM[0] : (x - cx0) % 4 === 1 ? VERM[1] : 0x1a1210; // the corridor's posts seen from the front
          else if (northSide && cu1 - 1 - u < 4 && x - cx0 >= 7 && cx1 - 1 - x >= 7) c = (x - cx0) % 4 === 0 ? VERM[0] : (x - cx0) % 4 === 1 ? VERM[1] : 0x2a1a14; // and along the north side, facing the courtyard
          else {
            // the corridor's tiled roof in fine pixels: rows of round tiles running down from the ridge to the eave
            const along = u - cu0 >= 7 && cu1 - 1 - u >= 7; // (the east and west arms run north and south)
            for (let j = 0; j < S; j++)
              for (let i = 0; i < S; i++) {
                const FX = x * S + i;
                const FY = Y(u) * S + j;
                const k = along ? FY % 3 : FX % 3;
                let t = k === 0 ? TILE[3] : k === 1 ? TILE[2] : TILE[1];
                if ((along ? FX : FY) % 5 === 0) t = scaleColor(t, 0.82);
                if (d === 3) t = i === 1 || j === 1 ? 0x8a94a8 : TILE[3]; // (the ridge)
                if (d === 0 || d === 6) t = (along ? FY : FX) % 3 === 0 ? 0xc8ccd4 : TILE[0]; // (the eaves, their tile ends)
                if (hashPx(FX, FY, 77) < 0.03) t = 0x4a5a44; // (moss)
                img.px(FX, FY, t);
              }
            continue;
          }
          img.set(x, Y(u), c);
        }
      for (let x = cx0; x < cx1; x += 4) glow(x, Y(cu0 + 5), 0xffb070, 0.5);
      reserveRect(cx0, Y(cu1), cx1 - cx0, 7);
      reserveRect(cx0, Y(cu0 + 7), cx1 - cx0, 7);
      reserveRect(cx0, Y(cu1), 7, cu1 - cu0);
      reserveRect(cx1 - 7, Y(cu1), 7, cu1 - cu0);
      gravelGround(cx0 + 7, cx1 - 7, cu0 + 7, cu1 - 7, 67);
      // raked lines in the gravel, a stone path from gate to gate
      // (fine grooves combed along the court, swinging round in rings about the great incense burner)
      for (let Yr = Y(cu1 - 8) * S; Yr < Y(cu0 + 8) * S; Yr++)
        for (let X = (cx0 + 8) * S; X < (cx1 - 8) * S; X++) {
          const x = X / S;
          if (Math.abs(x - 90) < 8 || isRes(Math.floor(x), Math.floor(Yr / S))) continue;
          const dr = Math.hypot(x - 90, Yr / S - Y(5722));
          const groove = dr < 22 ? Math.floor(dr * S) % 5 === 0 : Yr % 5 === 0;
          if (groove) img.tintPx(X, Yr, 0.78);
          else if ((dr < 22 ? Math.floor(dr * S) % 5 === 2 : Yr % 5 === 2)) img.tintPx(X, Yr, 1.12);
        }
      ishidatami(84, 97, cu0 + 7, cu1 - 7);
      for (let x = cx0 + 7; x < cx1 - 7; x += 4) glow(x, Y(cu1 - 10), 0xffb070, 0.5);
      incense(86, Y(5800));
      // the middle gate, the five-storey pagoda, the golden hall and the lecture hall in one line
      templeHall(70, Y(cu0 + 16), 40, 12, 6, { gate: true });
      pagoda(90, 5742, 5, 30, 8, 7);
      templeHall(54, Y(5856), 72, 26, 10, { gold: true });
      templeHall(cx0 + 10, Y(cu1 - 8), cx1 - cx0 - 20, 14, 6);
      for (let u = cu0 + 26; u < 5740; u += 12) {
        stoneLantern(74, Y(u));
        stoneLantern(104, Y(u));
      }
      crowd(cx0 + 10, Y(5760), cx1 - cx0 - 20, 70, 50, false);
      // --- the night of ten thousand lanterns (Mantō): racks of paper lanterns burning in rows down the court, the
      // great bronze incense burner smoking at the crossing, the bell and drum towers, monks walking their round
      const lr = rng(6131);
      const rack = (x0, x1, u) => {
        const y = Y(u);
        const n = Math.floor(((x1 - x0) * S - 4) / 6);
        objects.push({
          y: y + 6,
          shadow: () => shadowRect(x0 + 1, y + 2, x1 - x0, 5, 0.65),
          draw: () => {
            const X = x0 * S;
            const Yy = y * S;
            const gr = rng(x0 * 7 + u);
            for (let i = 0; i < (x1 - x0) * S; i++) for (const r of [0, 9]) img.px(X + i, Yy + r, 0x2a1e18);
            for (const PX of [X, X + (x1 - x0) * S - 2]) for (let j = 0; j < 17; j++) for (let i = 0; i < 2; i++) img.px(PX + i, Yy + j, 0x2a1e18);
            for (const r of [1, 10])
              for (let k = 0; k < n; k++) {
                const LX = X + 3 + k * 6;
                const c = gr() < 0.16 ? [0xffa060, 0xff7a40] : [0xfff4d0, 0xffe4a8];
                for (let j = 0; j < 7; j++) for (let i = 0; i < 5; i++) if (!((j === 0 || j === 6) && (i === 0 || i === 4))) glowPx(LX + i, Yy + r + j, j === 0 ? 0x1a1414 : j % 2 ? c[0] : c[1], 0.98);
                if (gr() < 0.7) for (let j = 2; j < 5; j++) glowPx(LX + 2, Yy + r + j, 0x4a2a1a, 0.9);
              }
          },
        });
        warm((x0 + x1) / 2, y + 5, (x1 - x0) * 0.62, 0.3, 0xffd890);
      };
      const courtRacks = [];
      for (let u = cu0 + 26; u < 5736; u += 12)
        for (const [a, b] of [[31, 70], [110, 149]]) courtRacks.push([a, b, u]);
      for (let u = 5752; u < 5782; u += 13)
        for (const [a, b] of [[31, 54], [126, 149]]) courtRacks.push([a, b, u]);
      for (const [a, b, u] of courtRacks) rack(a, b, u);
      // (live) here and there a lantern guttering
      {
        const dot = new HiCanvas(1, 1);
        dot.set(0, 0, 0x2a1a14);
        const f = kit.frame(dot);
        const parts = [];
        for (const [a, b, u] of courtRacks) for (let k = 0; k < 4; k++) parts.push([0, a + 1 + Math.floor(lr() * (b - a - 3)), u - 1 - (k % 2) * 3, lr() * 20]);
        for (let i = 0; i < parts.length; i += 40) kit.wave([f], parts.slice(i, i + 40), { w: 1.4, a0: 0, a1: 0.8, pw: 8, d: 0.05 });
      }
      // the great bronze incense burner (jōkoro) at the crossing of the walks, smoke rising, people wafting it over themselves
      {
        const X = 90 * S + 1;
        const Yy = Y(5722) * S;
        objects.push({
          y: Y(5722) + 3,
          shadow: () => shadowRect(90, Y(5722), 16, 5, 0.55),
          draw: () => {
            for (let j = 4; j < 10; j++) for (let i = -10; i <= 10; i++) img.px(X + i, Yy + j, STONE[j < 6 ? 3 : j < 8 ? 2 : 1]);
            for (let j = -16; j < 5; j++) {
              const hw = 7 + Math.sin(((j + 16) / 21) * Math.PI) * 5;
              for (let i = -hw; i <= hw; i++) {
                const t = (i + hw) / (2 * hw);
                img.px(X + Math.round(i), Yy + j, t < 0.2 ? 0x5a4a2a : t < 0.4 ? 0x9a8a4a : t < 0.75 ? 0x5a4a2a : 0x2a2418);
              }
            }
            for (let j = 0; j < 8; j++) {
              const hw = 12 - j * 1.4;
              for (let i = -hw; i <= hw; i++) img.px(X + Math.round(i), Yy - 18 - j, j === 0 ? 0x9a8a4a : i < 0 ? 0x6a5a30 : 0x3a3020);
            }
            for (const k of [-5, -2, 2, 5]) for (let j = -2; j < 2; j++) glowPx(X + k, Yy - 15 + j, 0xff9a40, 0.95);
            for (let j = 0; j < 3; j++) glowPx(X, Yy - 27 - j, 0xc8a030, 0.9);
          },
        });
        warm(90, Y(5722) - 2, 22, 0.55, 0xff9a50);
        kit.emit(90, 5730, stallSteam, { rate: 2.2, life: [2.2, 3.4], vy: 7, sx: 2, wf: 0.9, a: 0.45, tint: 1 });
        knot(90, Y(5722) + 6, 13, 4, 20);
        knot(76, Y(5722) - 1, 4, 5, 5);
        knot(104, Y(5722) - 1, 4, 5, 5);
      }
      // the bell tower and the drum tower, under their hip roofs at the north corners of the court
      for (const [x, drum] of [[34, false], [130, true]]) {
        const y = Y(5812);
        objects.push({
          y: y + 26,
          shadow: () => shadowRect(x + 3, y + 5, 17, 23, 0.55),
          draw: () => {
            const X = x * S;
            for (let Yy = (y + 10) * S; Yy < (y + 26) * S; Yy++)
              for (let i = 2; i < 46; i++) {
                const open = Yy < (y + 18) * S;
                let c = i < 7 || i > 40 ? (i === 2 || i === 41 ? VERM[0] : i < 7 ? VERM[1] : VERM[2]) : open ? 0x1a1210 : (i + Yy) % 6 === 0 ? 0x5a5a62 : 0xe9e2d0;
                if (Yy > (y + 22) * S) c = STONE[1 + (Yy % 3 === 0 ? 1 : 0)];
                img.px(X + i, Yy, c);
              }
            if (drum) {
              for (let j = -11; j <= 11; j++) for (let i = -11; i <= 11; i++) if (i * i + j * j < 124) img.px(X + 24 + i, (y + 13) * S + j, i * i + j * j > 90 ? 0x7a1a14 : i * i + j * j > 72 ? C.gold : 0xd8c8a8);
            } else {
              for (let j = 0; j < 20; j++) {
                const hw = 6 + j * 0.3;
                for (let i = -hw; i <= hw; i++) img.px(X + 24 + Math.round(i), (y + 8) * S + j, j % 6 === 0 ? 0x8a9a6a : i < -2 ? 0x6a7a4a : i > 2 ? 0x2a3a2a : 0x4a5a3a);
              }
            }
            hipRoofPx(x, y, 16, 11, y + 3, 4, TILE);
          },
        });
        warm(x + 8, y + 20, 15, 0.5, 0xffc080);
        knot(x + 8, y + 29, 9, 2, 7);
      }
      // the monks' round, in saffron and purple with their paper lanterns, slowly round the pagoda (live)
      {
        const monk = (c, st) =>
          capture(0, 0, 4, 5, () => {
            for (let i = 3; i < 6; i++) img.px(i, 1, 0xd8b090);
            for (let i = 3; i < 6; i++) img.px(i, 2, 0xe8c0a0);
            for (let j = 3; j < 10; j++) for (let i = 2; i < 7; i++) if (!(j > 7 && (i === 2 || i === 6))) img.px(i, j, i === 2 ? scaleColor(c, 1.15) : i === 6 ? scaleColor(c, 0.75) : j === 5 && i < 5 ? 0xf0e0c0 : c);
            img.px(st ? 3 : 5, 10, 0x1a1a20);
            for (let j = 2; j < 5; j++) for (let i = 7; i < 10; i++) glowPx(i, j + st, j === 2 ? 0x1a1414 : 0xfff0c8, 0.99);
          }, { u: 5760 });
        const route = [[56, 5812], [56, 5736], [124, 5736], [124, 5812]];
        for (const [c, s0, n] of [[0xd8802a, 0.1, 6], [0x7a3a9a, 0.34, 2], [0xd8802a, 0.5, 5]]) kit.path(route, [monk(c, 0), monk(c, 1)], { sp: 2.2, n, gap: 7, mode: 'pp', hold: 4, turn: 'none', fps: 2, s0, d: 0.04 });
      }
      // worshippers at the golden hall, round the pagoda's foot and in the court; visitors coming up the walk
      knot(90, Y(5816), 34, 3, 44);
      knot(90, Y(5738), 26, 3, 18);
      for (let k = 0; k < 90; k++) folk(84 + fr() * 12, Y(cu0 + 18 + fr() * 50));
      for (const [a, b, u] of courtRacks) if (fr() < 0.7) knot((a + b) / 2, Y(u) + 8, (b - a) / 3, 1.5, 4);
      const wsS = walkers(5700);
      for (const x of [86, 94]) kit.path([[x, cu0 + 26], [x, 5714]], fr.pick(wsS), { sp: 3, n: 2, gap: 20, mode: 'pp', hold: 2.5, turn: 'none', fps: 3, s0: fr() });
      // --- outside the cloisters: the flea market that fills the temple's grounds, blue sheets and tent stalls
      {
        const flea = (x, y) => {
          const c = fr.pick([0x2a5ab0, 0x2a7a9a, 0xb86a2a, 0x8a3a3a]);
          const kind = fr();
          objects.push({
            y: y + 8,
            shadow: () => shadowRect(x + 2, y + 2, 14, 7, 0.65),
            draw: () => {
              const X = x * S;
              const Yy = y * S;
              const gr = rng(x * 53 + y);
              // the sheet laid out on the ground, its old pots and books and kimono in rows
              for (let j = 8; j < 24; j++) for (let i = 0; i < 42; i++) glowPx(X + i, Yy + j, (i + j) % 9 === 0 ? scaleColor(c, 0.8) : c, 0.9);
              for (let j = 10; j < 22; j += 5)
                for (let i = 2; i < 38; i += 5) {
                  const g = gr();
                  const col = g < 0.3 ? 0xd8c8a8 : g < 0.5 ? 0x8a5a2a : g < 0.7 ? 0xe8e4d8 : g < 0.85 ? 0xc83a3a : 0x3a5a8a;
                  for (let a = 0; a < 4; a++) for (let b = 0; b < 3; b++) glowPx(X + i + a, Yy + j + b, a === 0 && b === 0 ? scaleColor(col, 1.3) : col, 0.95);
                }
              // a tent over the seller on the bigger pitches
              if (kind < 0.55) {
                for (let j = 0; j < 8; j++) for (let i = 0; i < 42; i++) glowPx(X + i, Yy + j, j === 0 ? 0xffffff : Math.floor(i / 7) % 2 ? 0xf0ece4 : 0xd8d4cc, 0.95);
                for (const PX of [X, X + 40]) for (let j = 8; j < 24; j++) for (let a = 0; a < 2; a++) img.px(PX + a, Yy + j, 0x8a8a92);
                glowPx(X + 20, Yy + 9, 0xfff4c8, 1);
                glowPx(X + 21, Yy + 9, 0xfff4c8, 1);
              }
              personPx(X + 34, Yy + 12, gr, { hat: true });
            },
          });
          warm(x + 7, y + 6, 10, 0.34, 0xffd8a0);
          knot(x + 7, y + 10, 7, 1.5, 3);
        };
        for (const [x0, x1] of [[4, 60], [120, 176]])
          for (let u = s0 + 40; u > s0 + 2; u -= 12)
            for (let x = x0; x + 14 <= x1; x += 16) flea(x, Y(u));
        // the stone walk through them to the south gate, and people coming and going
        for (let k = 0; k < 60; k++) folk(4 + fr() * 172, Y(s0 + 2 + fr() * 48));
        knot(90, Y(5628), 18, 4, 22);
        knot(90, Y(5612), 24, 4, 16);
        const ws = walkers(5630);
        for (const [a, b] of [[[6, 5624], [60, 5624]], [[120, 5642], [174, 5642]], [[6, 5648], [60, 5648]], [[120, 5616], [174, 5616]], [[84, 5612], [84, 5636]], [[96, 5612], [96, 5636]]])
          kit.path([a, b], fr.pick(ws), { sp: 3, n: 2, gap: 24, mode: 'pp', hold: 3, turn: 'none', fps: 3, s0: fr() });
      }
      // stone lanterns lit along the west and east walks, and the arched red bridges over the turtle ponds
      for (const px of [11, 169]) {
        const y = Y(5742);
        objects.push({
          y: y + 6,
          draw: () => {
            const X = px * S;
            for (let i = -18; i <= 18; i++) {
              const a = Math.round(((i / 18) ** 2 - 1) * 5);
              for (let j = 0; j < 5; j++) img.px(X + i, y * S + a + j, j === 0 ? 0xf06a40 : j < 3 ? VERM[0] : VERM[2]);
              if (i % 6 === 0) for (let j = -5; j < 0; j++) img.px(X + i, y * S + a + j, VERM[1]);
              for (const r of [-5]) img.px(X + i, y * S + a + r, VERM[0]);
            }
          },
        });
        warm(px, y + 3, 10, 0.4);
        knot(px, y + 1, 4, 1, 2);
        const tur = capture(0, 0, 2, 2, () => {
          for (let j = 0; j < 4; j++) for (let i = 0; i < 5; i++) if (!((j === 0 || j === 3) && (i === 0 || i === 4))) img.px(i, 1 + j, (i + j) % 2 ? 0x5a6a3a : 0x3a4a2a);
          img.px(5, 2, 0x7a8a5a);
        }, { u: 5760 });
        kit.wander(px, 5764, 4, 22, [tur], { n: 3, sp: 1.2, idle: 0.5, turn: 'flip' });
      }
      // outside the cloisters: the turtle pond, trees, lanterns
      pondAtNight(11, 5760, 8, 36);
      pondAtNight(169, 5760, 8, 36);
      for (const [px, pu] of [[11, 5750], [10, 5772], [169, 5744], [168, 5768]]) {
        // turtles sunning on the rocks of the turtle pond
        img.disc(px, Y(pu), 1.8, STONE[1]);
        img.rect(px - 1, Y(pu) - 1, 2, 2, 0x4a5a3a);
      }
      for (let k = 0; k < 20; k++) {
        const x = rand() < 0.5 ? 2 + rand() * 16 : 162 + rand() * 16;
        const u = 5640 + rand() * 260;
        if (!anyRes(x - 3, Y(u) - 3, 6, 6)) tree(rand() < 0.5 ? 'pine' : 'broadleaf', x, Y(u), 3 + rand() * 2);
      }
    }

    // ---- 5. Sumiyoshi Taisha: lantern-lined approach, the arched Sorihashi bridge, the straight-roofed halls
    {
      const [m0, m1] = SUMI;
      gravelGround(0, W, m0, m1, 68);
      for (let Yr = Y(m1) * S; Yr < Y(m0) * S; Yr++)
        for (let X = 0; X < W * S; X++) {
          const n = hashPx(X, Yr, 76);
          if (n < 0.08) img.tintPx(X, Yr, 1.2);
          else if (n < 0.17) img.tintPx(X, Yr, 0.84);
        }
      ishidatami(82, 98, m0, 5998);
      // the great stone torii at the entrance
      {
        const cx = 90;
        const y = Y(5926);
        stoneTorii(cx, y + 15, 34, 30);
        reserveRect(cx - 25, y - 1, 50, 16);
      }
      for (let u = m0 + 6; u < 5994; u += 8) {
        stoneLantern(70, Y(u));
        stoneLantern(108, Y(u));
        stoneLantern(61, Y(u + 4));
        stoneLantern(116, Y(u + 4));
      }
      // the pond, and the Sorihashi arching over it on the approach's line, from shore to shore: seen from the
      // south, its near slope rises long and lit to the crest, the far one drops short and dark
      pondAtNight(90, 6035, 68, 34);
      // lotus on the water: round pads, each with its notch and pale veins, pink flowers open among them; the islet
      // with its pine and little shrine; lanterns on the shore
      {
        const lotus = (LX, LY, r, flower) => {
          for (let j = -r; j <= r; j++)
            for (let i = -r; i <= r; i++) {
              const q = i * i + j * j * 1.5;
              if (q > r * r || (i > 0 && Math.abs(j) < 1)) continue;
              img.px(LX + i, LY + j, q > r * r * 0.72 ? 0x2a6a3a : (i + j) % 4 === 0 ? 0x6ab85a : i < 0 ? 0x4a9a4a : 0x3a8a44);
            }
          if (flower) for (const [i, j, c] of [[0, -1, 0xffb0d0], [-1, 0, 0xff90c0], [1, 0, 0xff90c0], [0, 0, 0xfff0a0], [0, 1, 0xff70a8]]) glowPx(LX + i, LY + j - 2, c, 0.95);
        };
        for (let n = 0; n < 150; n++) {
          const a = fr() * Math.PI * 2;
          const q = 0.55 + fr() * 0.38;
          const x = 90 + Math.cos(a) * 68 * q;
          const y = Y(6035) + Math.sin(a) * 34 * q;
          if (Math.abs(x - 90) < 13) continue;
          lotus(Math.round(x * S), Math.round(y * S), 3 + Math.floor(fr() * 4), fr() < 0.3);
        }
        // the islet
        const IX = 42 * S;
        const IY = Y(6040) * S;
        for (let j = -16; j <= 16; j++)
          for (let i = -30; i <= 30; i++) {
            const e = (i / 30) ** 2 + (j / 16) ** 2 + (hashPx(i, j, 81) - 0.5) * 0.14;
            if (e <= 1) img.px(IX + i, IY + j, e > 0.8 ? STONE[1 + (hashPx(i, j, 82) < 0.5 ? 1 : 0)] : rampColor(C.lawn, 0.3 + hashPx(i, j, 83) * 0.5, i, j));
          }
        tree('pine', 40, Y(6042), 5, fr);
        for (const [x, u] of [[24, 6010], [156, 6010], [24, 6060], [156, 6060], [70, 6004], [110, 6004]]) {
          stoneLantern(x, Y(u));
          warm(x, Y(u) + 2, 12, 0.35);
        }
      }
      {
        const [b0, crest, b1] = [5996, 6054, 6074];
        objects.push({
          y: Y(b0) + 1,
          shadow: () => shadowRect(98, Y(b1), 3, b1 - b0, 0.5),
          draw: () => {
            for (let u = b0; u <= b1; u++) {
              const y = Y(u);
              const near = u <= crest;
              const t = near ? (u - b0) / (crest - b0) : 1;
              // (fine: the planks across, their joints, lit more as the slope rises; the lacquered rails, posts with
              // gold caps every few steps, their shadows on the deck)
              for (let j = 0; j < S; j++)
                for (let X = 83 * S; X < 98 * S; X++) {
                  const Yf = y * S + j;
                  const lx = X - 83 * S;
                  let c;
                  if (lx < 2 || lx > 42) c = VERM[2];
                  else if (lx < 5 || lx > 39) c = lx === 3 || lx === 41 ? 0xf06a40 : VERM[0];
                  else {
                    c = near ? scaleColor(0xa8764a, 0.8 + t * 0.35) : (u % 2 ? 0x4a3022 : 0x5e3e2a);
                    // (the climbing battens across the arch, each with a lit top and a dark riser under it)
                    const step = Yf % 9;
                    if (step === 0) c = scaleColor(c, 1.45);
                    else if (step < 3) c = scaleColor(c, 0.55);
                    else if (hashPx(X >> 2, Yf, 74) < 0.1) c = scaleColor(c, 0.88);
                    if (hashPx(X, Yf, 74) < 0.06) c = scaleColor(c, 1.1);
                    if (lx === 5 || lx === 39) c = scaleColor(c, 0.75);
                  }
                  img.px(X, Yf, c);
                }
              if (u % 5 === 0)
                for (const PX of [84 * S, 96 * S + 2]) {
                  img.px(PX, y * S - 1, VERM[0]);
                  img.px(PX, y * S - 2, C.gold);
                  glowPx(PX, y * S - 3, C.goldHi, 0.5);
                }
              if (u % 10 === 0) for (const x of [84, 96]) glow(x, y, 0xffd8a0, 0.6);
            }
            // its red sides mirrored in the still pond either side
            for (let FYr = Y(b1 - 6) * S; FYr < Y(b0 + 6) * S; FYr++) for (const X of [81 * S + 1, 99 * S + 1]) if (Math.sin(FYr * 0.7) > -0.4) img.px(X + Math.round(Math.sin(FYr * 0.31)), FYr, VERM[1], 0.4);
          },
        });
        crowd(86, Y(6058), 8, 56, 14, true);
        // people climbing it, posing at the crest (over the bridge, so they sort after it)
        for (let k = 0; k < 22; k++) {
          const x = 85 + fr() * 9;
          const y = Y(b0 + 4 + fr() * (b1 - b0 - 8));
          const X = Math.round(x * S);
          const Yy = Math.round(y * S);
          const coat = fr.pick(COATS);
          objects.push({ y: Y(b0) + 2, draw: () => personPx(X, Yy, rng(X * 977 + Yy), { coat }) });
        }
        for (const u of [6004, 6020, 6036, 6052, 6068])
          for (const x of [83, 97]) {
            chochin(x, Y(u) - 2, 0xfff0d0);
            warm(x, Y(u), 7, 0.4);
          }
      }
      // on from the bridge to the gaps in the vermilion fences round the halls
      ishidatami(44, 125, 6074, 6080);
      ishidatami(46, 53, 6080, 6082);
      ishidatami(118, 125, 6080, 6168);
      reserveRect(43, Y(6082), 83, 9);
      reserveRect(117, Y(6168), 9, 89);
      // the four main halls in Sumiyoshi style: straight gable roofs, crossed chigi and katsuogi logs on the ridge
      const sumiHall = (x, y, w, h) => {
        objects.push({
          y: y + h + 7,
          shadow: () => shadowRect(x + 4, y + 4, w, h + 7, 0.5),
          draw: () => {
            // Sumiyoshi-zukuri: a plain straight gable running back from the door, cypress bark in thick courses, the
            // crossed chigi at each end and the gold-tipped katsuogi logs lying across the ridge; vermilion posts,
            // white walls, a rope and paper over the door
            const X0 = x * S;
            const X1 = (x + w) * S;
            const MID = (X0 + X1) >> 1;
            const Y0 = y * S;
            const Y1 = (y + h) * S;
            for (let Yy = Y0; Yy < Y1; Yy++)
              for (let X = X0; X < X1; X++) {
                const left = X < MID;
                const fromRidge = Math.abs(X - MID) / ((X1 - X0) / 2);
                const course = Math.floor((Yy + (left ? 0 : 2)) / 3);
                let c = rampColor(BARK, (left ? 0.62 - fromRidge * 0.25 : 0.32 - fromRidge * 0.2) + (hashPx(X >> 1, course, 84) - 0.5) * 0.22, X, Yy);
                if (Yy % 3 === 0) c = scaleColor(c, 0.78);
                if (X < X0 + 3 || X >= X1 - 3) c = X < X0 + 3 ? 0x8a7a6a : 0x2a2224; // (the bargeboards' edge)
                img.px(X, Yy, c);
              }
            for (let Yy = Y0; Yy < Y1; Yy++) for (let i = -2; i < 3; i++) img.px(MID + i, Yy, i < -1 ? 0x6a5a50 : i === 0 ? 0x4a3a34 : 0x1a1418); // (the ridge beam)
            for (let k = 0; k < 5; k++) {
              const LY = Y0 + 8 + Math.round((k * (Y1 - Y0 - 16)) / 4);
              for (let i = -9; i <= 9; i++) for (let j = 0; j < 4; j++) img.px(MID + i, LY + j, Math.abs(i) > 7 ? (j < 2 ? C.goldHi : C.gold) : j === 0 ? 0x7a6a5a : j === 3 ? 0x1a1418 : 0x4a3a34);
            }
            // the crossed chigi at both ends of the ridge
            for (const Yy of [Y0 + 1, Y1 - 1])
              for (const sd of [-1, 1])
                for (let k = 0; k < 16; k++) for (let t = 0; t < 3; t++) img.px(MID + sd * k + t, Yy - k + 2, k > 12 ? C.gold : t === 0 ? 0x6a5a4a : 0x2a1e18);
            // the front: dark under the eave, white wall, the vermilion frame, the door with its gold fittings
            const FY = Y1;
            for (let j = 0; j < 21; j++)
              for (let X = X0 + 3; X < X1 - 3; X++) {
                const lx = X - X0 - 3;
                const fw = X1 - X0 - 6;
                let c = 0xe9e2d0;
                if (j < 4) c = j === 0 ? 0x140c0a : 0x2a1a14;
                else if (j < 7) c = VERM[j === 4 ? 0 : 1];
                else if (lx < 5 || lx >= fw - 5 || Math.abs(lx - fw / 2) < 2 + 9) c = lx < 2 || lx === fw - 5 ? 0xf06a40 : lx < 5 || lx >= fw - 5 ? VERM[1] : VERM[0];
                else if ((lx + j * 2) % 23 === 0) c = 0xd8d0bc;
                if (j > 16) c = j === 17 ? 0xf0e8d8 : STONE[j > 19 ? 1 : 2];
                img.px(X, FY + j, c);
              }
            for (let j = 7; j < 17; j++)
              for (let i = -8; i <= 8; i++) {
                let c = i % 8 === 0 ? 0x4a2a1a : 0x2a1810;
                if (j === 11 && Math.abs(i) === 4) c = C.gold;
                img.px(MID + i, FY + j, c);
              }
            // the rope and its zigzags of paper, the two lamps
            for (let i = -12; i <= 12; i++) {
              const d = Math.round((1 - (i / 12) ** 2) * 2);
              for (let j = 0; j < 2; j++) img.px(MID + i, FY + 6 + d + j, (i + j) % 3 ? 0xe8dcb0 : 0xa8986a);
            }
            for (const i of [-8, 0, 8]) for (let j = 0; j < 5; j++) glowPx(MID + i + ((j >> 1) % 2), FY + 9 + j, 0xffffff, 0.9);
            for (const sd of [-1, 1]) {
              for (let j = 0; j < 7; j++) for (let k = 0; k < 4; k++) glowPx(MID + sd * 18 + k - 2, FY + 8 + j, j === 0 || j === 6 ? 0x1a1414 : j % 2 ? 0xfff4d0 : 0xffe0a0, 0.98);
            }
            pool(x + w / 2, y + h + 8, 15, 0xffc080, 0.45);
          },
        });
        reserveRect(x - 2, y - 5, w + 4, h + 14);
      };
      sumiHall(38, Y(6118), 22, 26);
      sumiHall(38, Y(6162), 22, 26);
      sumiHall(38, Y(6206), 22, 26);
      sumiHall(110, Y(6206), 22, 26);
      // the vermilion fences round the halls
      for (const [fx0, fx1, fu0, fu1] of [[30, 68, 6080, 6210], [102, 140, 6168, 6210]]) {
        // white river pebbles raked within the fence, pale under the moon, a stone path to each door
        for (let Yr = Y(fu1) * S; Yr < Y(fu0) * S; Yr++)
          for (let X = (fx0 + 1) * S; X < fx1 * S; X++) {
            const n = hashPx(X, Yr, 85);
            let c = Yr % 5 === 0 ? 0xa8a4a0 : n < 0.15 ? 0xdcd8d0 : n < 0.5 ? 0xc8c4bc : 0xbcb8b0;
            img.px(X, Yr, c);
          }
        const MX = ((fx0 + fx1) / 2) | 0;
        ishidatami(MX - 2, MX + 3, fu0, fu1);
        // the tamagaki: vermilion boards between rails, posts with black caps, on all sides; a gap at the south gate
        for (const X0 of [fx0 * S, fx1 * S])
          for (let Yr = Y(fu1) * S; Yr < Y(fu0) * S; Yr++)
            for (let i = 0; i < 4; i++) img.px(X0 + i, Yr, Yr % 12 < 3 ? (Yr % 12 === 0 ? 0x141014 : i < 2 ? 0xf06a40 : VERM[1]) : i === 0 ? VERM[0] : i === 3 ? VERM[2] : VERM[1]);
        for (let X = fx0 * S; X < (fx1 + 1) * S + 1; X++) {
          if (Math.abs(X / S - (fx0 + fx1) / 2) <= 3) continue;
          for (let j = -6; j < 3; j++) {
            const YY = Y(fu0) * S + j;
            const post = X % 12 < 3;
            img.px(X, YY, post ? (j < -4 ? 0x141014 : X % 12 === 0 ? 0xf06a40 : VERM[1]) : j === -5 || j === 1 ? 0xf06a40 : j > 1 ? VERM[2] : X % 3 === 0 ? VERM[2] : VERM[1]);
          }
        }
        // the shrine's own vermilion gate across the gap, lanterns on the posts
        const GX = (fx0 + fx1) / 2;
        for (const sd of [-1, 1]) {
          chochin(Math.round(GX) + sd * 5, Y(fu0) - 3, 0xfff0d0);
          warm(GX + sd * 5, Y(fu0), 9, 0.4);
        }
      }
      // --- the shrine's grounds: the sacred rice field with its dance stage, the white horse's stable, the kagura hall,
      // stalls by the path, an ancient camphor bound with rope
      {
        const PX0 = 128;
        const PX1 = 174;
        const PU0 = 6086;
        const PU1 = 6160;
        for (let Yr = Y(PU1) * S; Yr < Y(PU0) * S; Yr++)
          for (let X = PX0 * S; X < PX1 * S; X++) {
            const lx = X - PX0 * S;
            const ly = Yr - Y(PU1) * S;
            const bank = lx < 5 || lx >= (PX1 - PX0) * S - 5 || ly < 5 || ly >= (PU1 - PU0) * S - 5 || Math.abs(lx - ((PX1 - PX0) * S) / 2) < 4 || Math.abs(ly - ((PU1 - PU0) * S) / 2) < 4;
            let c;
            if (bank) c = hashPx(X, Yr, 86) < 0.3 ? 0x6a5a3a : 0x5a4a30;
            else {
              // still water holding the sky, the young rice standing in straight lines
              const rice = lx % 9 < 3 && ly % 12 < 7;
              c = rice ? (ly % 12 < 2 ? 0x8ac85a : (lx + ly) % 3 ? 0x5a9a44 : 0x4a8a3a) : hashPx(X >> 1, Yr, 87) < 0.05 ? 0x6a84b0 : 0x2e4464;
            }
            img.px(X, Yr, c);
          }
        reserveRect(PX0 - 1, Y(PU1) - 1, PX1 - PX0 + 2, PU1 - PU0 + 2);
        // the stage in the middle of the field, its dancers (live) under paper lanterns
        const SX = (PX0 + PX1) / 2;
        const SY = Y((PU0 + PU1) / 2);
        const stage = [0, 1].map((st) =>
          capture(SX - 12, SY - 12, 24, 20, () => {
            const CX = Math.round(SX * S);
            const CY = (SY - 1) * S;
            for (let j = 0; j < 24; j++) for (let i = -30; i <= 30; i++) img.px(CX + i, CY + j, j === 0 ? C.hinoki?.[3] ?? 0xd8b070 : j > 20 ? 0x4a3020 : (j % 4 === 0 ? 0x9a7040 : 0xb88a50));
            for (const PXs of [CX - 30, CX + 27]) for (let j = -18; j < 24; j++) for (let i = 0; i < 3; i++) img.px(PXs + i, CY + j, i === 0 ? 0xf06a40 : VERM[1]);
            for (let j = -24; j < -14; j++) for (let i = -36; i <= 36; i++) img.px(CX + i, CY + j, j < -22 ? 0x6a5a50 : (i + j) % 4 === 0 ? 0x2a2224 : 0x3d3033);
            for (const [i, dir] of [[-14, 1], [0, -1], [14, 1]]) {
              personPx(CX + i, CY + 2 + (st ? dir : -dir), rng(i + 40), { coat: 0xf4f0e6 });
              for (let k = 0; k < 4; k++) glowPx(CX + i + 4 + (st ? dir * 2 : 0), CY - 1 - k, k % 2 ? C.gold : 0xe83a2a, 0.98);
            }
            for (const sd of [-1, 1]) for (let j = 0; j < 8; j++) for (let k = 0; k < 5; k++) glowPx(CX + sd * 24 + k - 2, CY - 12 + j, j === 0 || j === 7 ? 0x1a1414 : j % 2 ? 0xfff4d0 : 0xffe0a0, 0.98);
          }, { u: 6123 }),
        );
        kit.loop(SX - 12, U(SY - 12), stage, { fps: 1.6, d: 0.1 });
        warm(SX, SY + 3, 24, 0.5);
        // the planting girls in red sashes and sedge hats, working down the rows; lanterns on bamboo round the field
        for (let k = 0; k < 16; k++) {
          const x = PX0 + 6 + fr() * (PX1 - PX0 - 12);
          const y = Y(PU0 + 6 + fr() * (PU1 - PU0 - 12));
          if (Math.abs(x - SX) < 14 && Math.abs(y - SY) < 11) continue;
          folk(x, y, { coat: k % 2 ? 0xd83a2a : 0xf4f0e6, hat: true });
        }
        for (const [x, u] of [[PX0, PU0], [PX1 - 1, PU0], [PX0, PU1], [PX1 - 1, PU1], [SX, PU0], [SX, PU1]]) {
          chochin(Math.round(x), Y(u) - 3, 0xff5a30);
          warm(x, Y(u), 10, 0.4);
        }
        knot(151, Y(6082), 22, 2, 16);
        // the stable of the sacred white horse, its head over the half door
        {
          const x = 74;
          const y = Y(6196);
          objects.push({
            y: y + 13,
            shadow: () => shadowRect(x + 3, y + 3, 22, 13, 0.55),
            draw: () => {
              const X = x * S;
              const Yy = y * S;
              for (let j = 15; j < 39; j++) for (let i = 2; i < 64; i++) img.px(X + i, Yy + j, i % 20 < 3 ? VERM[1] : j < 25 ? 0x1a1210 : (i % 4 === 0 ? 0x5e4229 : 0x7a5835));
              for (let j = 15; j < 25; j++) for (let i = 26; i < 38; i++) if (((i - 32) / 6) ** 2 + ((j - 20) / 5) ** 2 < 1) glowPx(X + i, Yy + j, i < 30 ? 0xffffff : 0xe8e4e0, 0.97);
              for (const k of [28, 36]) glowPx(X + k, Yy + 19, 0x1a1a22, 0.97);
              hipRoofPx(x - 1, y, 24, 6, y + 2, 3, BARK);
            },
          });
          warm(x + 11, y + 13, 14, 0.45);
          knot(x + 11, y + 16, 9, 2, 6);
        }
        // the kagura hall, a bell of paper charms hung on the omikuji racks, the ema wall
        templeHall(72, Y(6168), 28, 10, 5, { ramp: BARK });
        knot(86, Y(6150), 12, 3, 12);
        for (const [x, u] of [[72, 6130], [86, 6112]]) {
          const y = Y(u);
          objects.push({
            y: y + 6,
            shadow: () => shadowRect(x + 2, y + 2, 14, 5, 0.6),
            draw: () => {
              const gr = rng(x * 3 + u);
              for (let i = 0; i < 42; i++) for (const r of [0, 9]) img.px(x * S + i, y * S + r, r ? 0x46301f : 0x7a5835);
              for (const PXs of [x * S, x * S + 40]) for (let j = 0; j < 17; j++) for (let k = 0; k < 2; k++) img.px(PXs + k, y * S + j, 0x46301f);
              for (let k = 0; k < 7; k++) for (let j = 2; j < 8; j++) for (let i = 0; i < 5; i++) glowPx(x * S + 2 + k * 6 + i, y * S + j, j === 2 ? 0xc8a878 : k % 3 ? 0xe8dcb8 : 0xf4ecd8, 0.92);
              for (let i = 2; i < 40; i++) if (gr() < 0.85) glowPx(x * S + i, y * S + 11 + (i % 3), 0xf8f8f4, 0.95);
            },
          });
          warm(x + 7, y + 5, 10, 0.35);
          knot(x + 7, y + 8, 7, 1.5, 5);
        }
        for (const [x, kind] of [[72, 'yakitori'], [90, 'kingyo']]) {
          yatai(x, Y(6098), kind);
          knot(x + 9, Y(6098) + 15, 7, 1.5, 5);
        }
      }
      for (let k = 0; k < 24; k++) {
        const x = rand() * W;
        const u = 6076 + rand() * 130;
        if (!anyRes(x - 4, Y(u) - 4, 8, 8)) tree(rand() < 0.6 ? 'broadleaf' : 'pine', x, Y(u), 4 + rand() * 3);
      }
      crowd(70, Y(6200), 30, 120, 30, false);
      // --- the approach: tall old trees either side of the lantern rows, stalls by the torii, the flow of visitors
      for (const [xa, xb] of [[4, 36], [144, 176]])
        for (let u = m0 + 6; u < 5994; u += 11) {
          const x = xa + fr() * (xb - xa);
          if (padFree(x, Y(u), 17)) tree(fr() < 0.6 ? 'pine' : 'broadleaf', x, Y(u), 4.5 + fr() * 2.5, fr);
        }
      // the shoulders of the approach and the grounds: more of the shrine's hundreds of stone lanterns, stone steles of
      // its old pilgrim guilds, moss creeping over the gravel, groves down both edges, footpaths wandering among them
      for (const [X0, X1] of [[0, 32 * S], [148 * S, W * S]])
        for (let n = 0; n < 1800; n++) {
          const X = Math.floor(X0 + fr() * (X1 - X0));
          const Yy = Math.floor((Y(m1) + fr() * (m1 - m0)) * S);
          if (isRes(X / S, Yy / S)) continue;
          for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) if (fr() < 0.55) img.px(X + i, Yy + j, rampColor(C.lawn, 0.1 + fr() * 0.5, X + i, Yy + j));
        }
      for (let u = m0 + 8; u < 5994; u += 9)
        for (const x of [52, 125]) {
          if (padFree(x, Y(u), 14)) stoneLantern(x, Y(u));
        }
      const stele = (x, y) => {
        const h = 6 + Math.floor(fr() * 5);
        const seed = Math.floor(fr() * 1e6);
        objects.push({
          y: y + 2,
          shadow: () => shadowRect(x + 1, y, 4, 2, 0.6),
          draw: () => {
            const X = x * S;
            const Yy = y * S;
            const gr = rng(seed);
            for (let j = -h * S; j < 6; j++)
              for (let i = 0; i < 9; i++) img.px(X + i, Yy + j, j > 2 ? STONE[1] : i < 2 ? STONE[3] : i > 6 ? STONE[0] : hashPx(i, j, seed & 255) < 0.1 ? 0x5a6a4a : STONE[2]);
            for (let k = 0; k + 4 < h * S; k += 5) glyph(X + 2, Yy - h * S + 2 + k, 4, 0x2a2a30, gr, (gx, gy, gc) => img.px(gx, gy, gc));
          },
        });
      };
      for (let k = 0; k < 46; k++) {
        const x = fr() < 0.5 ? 4 + fr() * 24 : 150 + fr() * 24;
        const u = m0 + 6 + fr() * (m1 - m0 - 12);
        if (u > 5998 && u < 6072) continue;
        if (padFree(x, Y(u), 14) && !isRes(x, Y(u))) stele(Math.round(x), Y(u));
      }
      for (const [xa, xb, u0g, u1g] of [[2, 28, 6078, 6208], [144, 178, 6164, 6208], [2, 20, 6002, 6068], [160, 178, 6002, 6068]])
        for (let u = u0g; u < u1g; u += 8) {
          const x = xa + fr() * (xb - xa);
          if (!isRes(x, Y(u))) tree(fr() < 0.5 ? 'pine' : 'broadleaf', x, Y(u), 3.5 + fr() * 3, fr);
        }
      // reeds and iris round the pond's edge
      for (let n = 0; n < 340; n++) {
        const a = fr() * Math.PI * 2;
        const q = 0.93 + fr() * 0.09;
        const x = 90 + Math.cos(a) * 68 * q;
        const y = Y(6035) + Math.sin(a) * 34 * q;
        if (Math.abs(x - 90) < 12) continue;
        const X = Math.round(x * S);
        const Yy = Math.round(y * S);
        const h = 3 + Math.floor(fr() * 6);
        const lean = fr() < 0.5 ? -1 : 1;
        for (let j = 0; j < h; j++) img.px(X + Math.round((j / h) * lean), Yy - j, j === h - 1 && fr() < 0.2 ? 0x9a7ae0 : j > h / 2 ? 0x6a9a4a : 0x3a6a3a);
      }
      // a camphor centuries old, a great straw rope round it
      {
        const x = 150;
        const y = Y(6066);
        tree('broadleaf', x, y, 11, fr);
        objects.push({
          y: y + 9,
          draw: () => {
            for (let a = 0; a < Math.PI * 2; a += 0.04) {
              const X = Math.round(x * S + Math.cos(a) * 13);
              const Yy = Math.round((y + 5) * S + Math.sin(a) * 5);
              img.px(X, Yy, Math.floor(a * 7) % 2 ? 0xe8d8a0 : 0xc8b070);
              img.px(X, Yy + 1, 0x8a7848);
            }
            for (const i of [-8, 0, 8]) for (let j = 0; j < 6; j++) glowPx(x * S + i + ((j >> 1) % 2), (y + 5) * S + 5 + j, 0xffffff, 0.9);
          },
        });
        warm(x, y + 8, 14, 0.35);
        knot(x, y + 11, 8, 1.5, 6);
      }
      for (const [x, kind] of [[8, 'ringo'], [28, 'takoyaki'], [134, 'men'], [154, 'yakitori']]) {
        const y = Y(5934);
        yatai(x, y, kind);
        knot(x + 9, y + 15, 8, 2, 7);
      }
      for (let k = 0; k < 110; k++) folk(83 + fr() * 14, Y(m0 + 2 + fr() * 86));
      knot(90, Y(5918), 22, 4, 26);
      knot(90, Y(6000), 18, 3, 18);
      for (let k = 0; k < 40; k++) folk(45 + fr() * 80, Y(6077 + fr() * 3));
      for (let k = 0; k < 40; k++) folk(119 + fr() * 5, Y(6082 + fr() * 84));
      // (live) visitors on the approach, climbing the bridge, along the walks; koi under the lotus; fireflies over the
      // water; the fall of paper from the rope when the wind takes it
      {
        const ws = walkers(6000);
        for (const [pts, n] of [[[[85, m0 + 8], [85, 5992]], 2], [[[95, m0 + 8], [95, 5992]], 2], [[[87, 6000], [87, 6070]], 2], [[[93, 6000], [93, 6070]], 2], [[[48, 6077], [120, 6077]], 2], [[[121, 6084], [121, 6164]], 2], [[[60, 6085], [100, 6085]], 1]])
          kit.path(pts, fr.pick(ws), { sp: 2.6 + fr() * 1.2, n, gap: 26, mode: 'pp', hold: 2, turn: 'none', fps: 3, s0: fr(), d: 0.03 });
        const koi = [0xf08a2a, 0xf4f0e6, 0xe84a2a].map((c) => {
          const out = new HiCanvas(5, 2);
          for (let i = 0; i < 12; i++) for (let j = 1; j < 5; j++) if (Math.abs(j - 2.5) < 2 - Math.abs(i - 5) * 0.28) out.px(i, j, (i >> 1) % 2 ? c : 0xf8f4ec);
          for (const j of [1, 2, 3, 4]) out.px(13, j, c);
          return kit.frame(out);
        });
        for (const [x, u] of [[54, 6030], [128, 6040], [60, 6018], [122, 6024]]) kit.wander(x, u, 18, 12, [fr.pick(koi)], { n: 2, sp: 3, idle: 0.4, turn: 'rot', fps: 1, fx: 0 });
        const fly = [0.9, 0.5, 0.2].map((a) => {
          const out = new HiCanvas(1, 1);
          out.px(1, 1, 0xd8ff70, a);
          out.px(1, 0, 0xc0ff60, a * 0.4);
          out.px(0, 1, 0xc0ff60, a * 0.4);
          return kit.frame(out);
        });
        kit.spot([[26, 6066, 30, 56], [124, 6066, 30, 56]], [...fly, ...fly.slice().reverse()], { rate: 1.1, fps: 4, a: 0.9 });
      }
    }

    // ---- 6. the Tempozan waterfront: the Ferris wheel, the aquarium, the harbour village, the quay
    {
      ishidatami(0, W, SUMI[1], p1);
      // the road along the back of the waterfront, the way the buses come in
      hRoad(6218, 5);
      // the promenade's paving: pale bands of stone every few yards, waves let into it in blue, and round the fountain a
      // great rose of radiating stone
      for (let Yr = Y(p1 - 8) * S; Yr < Y(6228) * S; Yr++)
        for (let X = 0; X < W * S; X++) {
          const y = Yr / S;
          const x = X / S;
          const d = Math.hypot(x - 90, y - Y(6316));
          if (d < 32) {
            const a = Math.atan2(y - Y(6316), x - 90);
            const ray = Math.floor(((a + Math.PI) / (Math.PI * 2)) * 32);
            let c = ray % 2 ? 0x9aa0b4 : 0x7a8096;
            if (Math.abs(d - 18) < 1 || Math.abs(d - 30) < 1) c = 0xc8a860;
            else if (d > 18 && d < 30 && (ray + Math.floor(d / 4)) % 4 === 0) c = 0x4a6a9a;
            img.px(X, Yr, c);
          } else if (Math.floor(y) % 40 < 2) {
            // the long bands of pale granite across the waterfront, a lamp let into them every so often
            img.px(X, Yr, Yr % 6 === 0 ? 0x8a8ea0 : (X >> 3) % 2 ? 0xb8bccc : 0xa8acbc);
            if (X % 72 === 36 && Yr % 6 === 3) glowPx(X, Yr, 0xfff0c0, 1);
          } else {
            // herringbone: little brick pavers in pairs at right angles, each its own shade, worn pale where most walk
            const cell = ((X >> 3) + (Yr >> 3)) % 2;
            const brick = cell ? Math.floor((X + (Yr >> 3) * 4) / 8) * 7 + (Yr >> 2) * 131 : Math.floor((Yr + (X >> 3) * 4) / 8) * 7 + (X >> 2) * 131;
            const joint = cell ? Yr % 4 === 0 : X % 4 === 0;
            const tone = hashPx(brick, 3, 78);
            const worn = Math.abs(x - 90) < 44 ? 1.08 : 1;
            let c = joint ? 0x4e4a58 : tone < 0.33 ? 0x8a8290 : tone < 0.66 ? 0x7a7484 : tone < 0.9 ? 0x968c94 : 0xa08a84;
            if (hashPx(X, Yr, 79) < 0.05) c = scaleColor(c, 0.9);
            img.px(X, Yr, scaleColor(c, worn));
          }
        }
      // a fountain plaza between the turret stands, its jets lit from below
      {
        const fx = 90;
        const fy = Y(6316);
        for (let j = -45; j <= 45; j++)
          for (let i = -45; i <= 45; i++) {
            const d = Math.hypot(i, j);
            if (d > 45) continue;
            const c = d > 41 ? (i + j < 0 ? 0xd8dce4 : 0x7a8090) : d > 38 ? 0x4a5060 : d < 9 ? (i + j < -2 ? 0xd8dce4 : 0x8a90a0) : hashPx(i >> 1, j, 88) < 0.08 ? 0x8ad0e8 : (Math.floor(d) % 8 < 2 ? 0x2a6a84 : 0x1c4e64);
            img.px((fx * S + 1) + i, (fy * S + 1) + j, c);
          }
        // the jets rise and fall in turn (live)
        const jets = [0, 1, 2, 3].map((k) =>
          capture(fx - 8, fy - 14, 17, 22, () => {
            let j = 0;
            for (let a = 0; a < Math.PI * 2; a += Math.PI / 4, j++) {
              const jx = Math.round(fx + Math.cos(a) * 6);
              const jy = Math.round(fy + Math.sin(a) * 6);
              const h = 1 + ((j + k) % 4);
              for (let i = 0; i < h; i++) glow(jx, jy - i, i === h - 1 ? 0xe8f8ff : 0x9ad8ff, i === h - 1 ? 0.8 : 1);
              glow(jx, jy + 1, 0xc8e8ff, 0.4);
            }
            const ch = 3 + [0, 2, 4, 2][k];
            for (let i = 0; i < ch; i++) glow(fx, fy - 1 - i, i > ch - 3 ? 0xffffff : 0xb8e4ff, i > ch - 3 ? 1 : 0.9);
          }),
        );
        kit.loop(fx - 8, U(fy - 14), jets, { fps: 4, fx: 1 });
        pool(fx, fy, 16, 0x60b0ff, 0.35);
        reserveRect(fx - 13, fy - 13, 26, 26);
      }
      // rows of trees wound with fairy lights along the promenade, flower beds, benches
      for (const u of [6340, 6408])
        for (let x = 8; x < W; x += 16) {
          if (anyRes(x - 4, Y(u) - 4, 8, 8)) continue;
          tree('broadleaf', x, Y(u), 4.5);
          for (let k = 0; k < 7; k++) glow(Math.round(x + (rand() - 0.5) * 8), Math.round(Y(u) + (rand() - 0.5) * 7), rand() < 0.5 ? 0xfff0c0 : 0xa8d8ff, 0.75);
        }
      for (const [bx, bu] of [[64, 6352], [104, 6352], [20, 6300], [150, 6300]]) {
        for (let k = 0; k < 14; k++) img.set(bx + (k % 7) * 2, Y(bu) + Math.floor(k / 7) * 2, rand.pick([0xe86a9a, 0xf0d040, 0xffffff, 0xe84a3a]));
        img.rect(bx, Y(bu) + 4, 13, 1, WOOD[2]);
      }
      crowd(80, Y(6300), 20, 12, 10, true); // a street performer's audience
      // the street performer juggling fire (live), the ring of people round him
      {
        const j = [0, 1, 2, 3].map((k) =>
          capture(82, Y(6293) - 8, 16, 14, () => {
            const CX = 90 * S;
            const CY = (Y(6293) + 2) * S;
            personPx(CX - 1, CY, rng(5), { coat: 0xe83a2a, hat: true });
            for (let b = 0; b < 3; b++) {
              const a = (k + b * 1.33) * (Math.PI / 2);
              const BX = CX + Math.round(Math.cos(a) * 9);
              const BY = CY - 10 - Math.round(Math.sin(a) * 8);
              for (const [i, c] of [[0, 0xfff4b0], [1, 0xffa030], [-1, 0xffa030]]) {
                glowPx(BX + i, BY, c, 0.98);
                glowPx(BX, BY + i, c, 0.98);
              }
            }
          }, { u: 6293 }),
        );
        kit.loop(82, U(Y(6293) - 8), j, { fps: 5, d: 0.08 });
        warm(90, Y(6293) + 3, 14, 0.55);
        for (let a = 0; a < 26; a++) {
          const t = (a / 26) * Math.PI * 2;
          folk(90 + Math.cos(t) * (11 + fr() * 2.5), Y(6293) + 3 + Math.sin(t) * (7 + fr() * 2));
        }
      }
      // the balloon seller and the ice-cream cart, the lit flag masts, children round them
      {
        const bx = 28;
        const by = Y(6322);
        const frames = [0, 1, 2].map((k) =>
          capture(bx - 8, by - 18, 16, 24, () => {
            const CX = bx * S;
            const CY = (by + 2) * S;
            personPx(CX - 1, CY, rng(7), { coat: 0x3a6ad0, hat: true });
            const r = rng(9);
            for (let b = 0; b < 9; b++) {
              const a = -Math.PI / 2 + (b - 4) * 0.28;
              const len = 26 + r() * 16;
              const BX = CX + Math.round(Math.cos(a) * len + Math.sin(k + b) * 1.5);
              const BY = CY - 2 + Math.round(Math.sin(a) * len);
              const c = [0xff4a6a, 0xffd040, 0x4aa8ff, 0xff7ad0, 0x6ae06a, 0xffffff][b % 6];
              for (let t = 0; t < len - 5; t += 2) img.px(Math.round(CX + (BX - CX) * (t / len)), Math.round(CY - 2 + (BY - CY + 2) * (t / len)), 0xc8c8c8);
              for (let j = -4; j <= 4; j++) for (let i = -3; i <= 3; i++) if ((i / 3.3) ** 2 + (j / 4.3) ** 2 < 1) glowPx(BX + i, BY + j, i + j < -2 ? 0xffffff : c, 0.97);
            }
          }, { u: 6322 }),
        );
        kit.loop(bx - 8, U(by - 18), frames, { fps: 2, d: 0.09 });
        warm(bx, by + 2, 11, 0.4);
        knot(bx + 2, by + 7, 6, 2, 6, { hat: false });
        const X = 146 * S;
        const Yy = Y(6326) * S;
        objects.push({
          y: Y(6326) + 8,
          shadow: () => shadowRect(148, Y(6326) + 3, 14, 6, 0.6),
          draw: () => {
            for (let j = 8; j < 24; j++) for (let i = 2; i < 38; i++) glowPx(X + i, Yy + j, j < 11 ? 0xc8d8e8 : j > 21 ? 0x3a3a44 : i % 12 === 0 ? 0xffd0e0 : 0xfff0f4, 0.96);
            for (let j = 0; j < 8; j++) for (let i = 0; i < 40; i++) glowPx(X + i, Yy + j, Math.floor(i / 6) % 2 ? 0xff7ab0 : 0xffffff, 0.96);
            for (let k = 0; k < 4; k++) for (let j = 12; j < 18; j++) for (let i = 0; i < 4; i++) glowPx(X + 6 + k * 8 + i, Yy + j, j < 15 ? [0xfff4d0, 0xff9ac0, 0x9ae0a0, 0x8a5a3a][k] : 0xd8a860, 0.97);
          },
        });
        warm(153, Y(6326) + 8, 12, 0.45);
        knot(153, Y(6326) + 12, 8, 2, 8, { hat: false });
      }
      // Tempozan Ferris wheel: a giant ring of coloured lights. Live: the spokes turn, the gondolas go round,
      // the colours chase round the ring
      {
        const cx = 40;
        const cy = Y(6262);
        objects.push({
          y: cy + 36,
          shadow: () => shadowRect(cx - 4, cy + 30, 30, 6, 0.5),
          draw: () => {
            // the white steel legs splayed from the axle, braced; the boarding hall under it, its sign, its queue
            const CX = cx * S + 1;
            const CY = cy * S + 1;
            for (const sd of [-1, 1])
              for (const off of [0, 1, 2, 3, 4]) img.linePx(CX + off * sd, CY, CX + sd * (42 + off), (cy + 35) * S, off === 0 ? 0xe8e8f0 : off === 4 ? 0x5a5a68 : 0xa8a8b8);
            for (const t of [0.35, 0.6, 0.85]) img.linePx(CX - Math.round(42 * t), CY + Math.round((35 * S - 3) * t), CX + Math.round(42 * t), CY + Math.round((35 * S - 3) * t), 0x7a7a88);
            const X0 = (cx - 14) * S;
            const Yb = (cy + 25) * S;
            for (let j = 0; j < 33; j++)
              for (let i = 0; i < 28 * S; i++) {
                let c;
                if (j < 3) c = j === 0 ? 0xffffff : 0xc8ccd8;
                else if (j < 12) c = (i + j) % 12 < 2 ? 0xffe060 : 0xc8202a;
                else if (j < 27) c = i % 12 < 2 ? 0x6a6a78 : (j > 15 && j < 25 ? 0xfff0c8 : 0xd8d0c0);
                else c = STONE[1];
                glowPx(X0 + i, Yb + j, c, 0.96);
              }
            pool(cx, cy, 36, 0xff70c0, 0.34);
            pool(cx, cy + 34, 22, 0xffd8a0, 0.5);
          },
        });
        for (let k = 0; k < 18; k++) folk(cx - 12 + (k % 6) * 4.2, cy + 37 + Math.floor(k / 6) * 3 + fr());
        const spokes = [0, 1, 2].map((s) =>
          capture(cx - 30, cy - 30, 61, 61, () => {
            const CX = cx * S + 1;
            const CY = cy * S + 1;
            // the double rim and its cross-bracing, the slim spokes, the hub with its lit crown
            for (let k = 0; k < 24; k++) {
              const a = (k / 24) * Math.PI * 2 + (s / 3) * ((Math.PI * 2) / 24);
              img.linePx(CX, CY, Math.round(CX + Math.cos(a) * 80), Math.round(CY + Math.sin(a) * 80), k % 2 ? 0x9a9aa8 : 0x7a7a88);
              const b = a + (Math.PI * 2) / 24;
              img.linePx(Math.round(CX + Math.cos(a) * 80), Math.round(CY + Math.sin(a) * 80), Math.round(CX + Math.cos(b) * 72), Math.round(CY + Math.sin(b) * 72), 0x5a5a68);
            }
            for (let t = 0; t < Math.PI * 2; t += 0.008) img.px(Math.round(CX + Math.cos(t) * 72), Math.round(CY + Math.sin(t) * 72), 0x6a6a78);
            for (let j = -8; j <= 8; j++) for (let i = -8; i <= 8; i++) if (i * i + j * j < 66) glowPx(CX + i, CY + j, i * i + j * j < 16 ? 0xffffff : (Math.floor(Math.atan2(j, i) * 2.5 + s) % 2 ? 0xffc0e0 : 0xe8e4dc), 0.98);
          }),
        );
        kit.loop(cx - 30, U(cy - 30), spokes, { fps: 1.5, ph: 0, d: 0.05 });
        const ring = [...Array(14)].map((_, st) =>
          capture(cx - 31, cy - 31, 63, 63, () => {
            // the outer rim: tubes of colour and running bulbs, chasing round
            const CX = cx * S + 1;
            const CY = cy * S + 1;
            for (let a = 0; a < Math.PI * 2; a += 0.006) {
              const c = NEON[(Math.floor((a / (Math.PI * 2)) * 14) + st) % NEON.length];
              for (const r of [84, 85, 86]) glowPx(Math.round(CX + Math.cos(a) * r), Math.round(CY + Math.sin(a) * r), c, 0.97);
            }
            for (let k = 0; k < 56; k++) {
              if ((k + st) % 4) continue;
              const a = (k / 56) * Math.PI * 2;
              for (const [i, j] of [[0, 0], [1, 0], [0, 1], [1, 1]]) glowPx(Math.round(CX + Math.cos(a) * 88) + i, Math.round(CY + Math.sin(a) * 88) + j, 0xffffff, 1);
            }
          }),
        );
        kit.loop(cx - 31, U(cy - 31), ring, { fps: 3, d: 0.06 });
        const gondolas = [0xff5a8a, 0xffc040, 0x4aa8ff, 0x6ae0a0].map((c, k) =>
          capture(0, 200 + k * 6, 5, 5, () => {
            const Y0 = (200 + k * 6) * S;
            for (let j = 0; j < 3; j++) glowPx(7, Y0 + j, 0xc8c8d0, 0.97); // (its hanger)
            for (let j = 3; j < 13; j++)
              for (let i = 2; i < 13; i++) {
                if ((j === 3 || j === 12) && (i === 2 || i === 12)) continue;
                glowPx(i, Y0 + j, j === 3 || j === 12 ? scaleColor(c, 1.2) : j > 9 ? c : i === 2 || i === 12 || i === 7 ? scaleColor(c, 0.75) : 0xfff4c8, 0.98);
              }
          }, { u: 6262 }),
        );
        kit.orbit(cx, U(cy) - 1, 30, gondolas, { n: 24, w: ((Math.PI * 2) / 24 / 3) * 1.5, d: 0.07 });
        reserveRect(cx - 32, cy - 32, 64, 70);
      }
      // Kaiyūkan: the aquarium faced with red, blue and glass, a whale shark on its front
      {
        const x = 100;
        const y = Y(6268);
        objects.push({
          y: y + 36,
          shadow: () => shadowRect(x + 5, y + 5, 64, 36, 0.5),
          draw: () => {
            // Kaiyūkan: a stepped tower of glass under its blue roofs, the ring of fish-scale tiles in red, blue and
            // sea-green round its foot, the lit glass band running round it, the great fish on its face
            const X0 = x * S;
            const Y0 = y * S;
            const FW = 64 * S;
            for (let j = 0; j < 72; j++)
              for (let i = 0; i < FW; i++) {
                const e = Math.min(i, FW - 1 - i, j);
                const tier = Math.min(Math.floor(e / 16), 2);
                let c = [0x2a4a7a, 0x3a5a8a, 0x4a6a9a][tier];
                if (e % 16 < 2) c = 0x7a9ac0;
                else if ((i + j) % 12 === 0) c = scaleColor(c, 1.2);
                if (tier === 2 && (i % 12 < 2 || j % 12 < 2)) c = 0xa8d0f0;
                // (the steps of the roof picked out in light, the glass of the top lantern glowing)
                if (e % 16 < 2) glowPx(X0 + i, Y0 + j, e % 16 === 0 ? 0xd8f0ff : 0x7ab0e0, 0.95);
                else if (tier === 2) glowPx(X0 + i, Y0 + j, i % 12 < 2 || j % 12 < 2 ? 0xe8f8ff : (i >> 3) % 3 ? 0x4a9ad8 : 0x6ab8e8, 0.95);
                else img.px(X0 + i, Y0 + j, c);
              }
            for (let i = 0; i < FW; i++) for (let j = 0; j < 3; j++) img.px(X0 + i, Y0 + j, j ? 0x7a9ac0 : 0xc8d8e8);
            // the glass band, lit from inside, its mullions, the people behind it
            for (let j = 72; j < 96; j++)
              for (let i = 0; i < FW; i++) {
                const c = i % 12 < 2 ? 0x2a3a5a : j < 75 || j > 92 ? 0x3a5a8a : hashPx(i >> 2, j >> 3, 91) < 0.1 ? 0x2a4a6a : (j + (i >> 2)) % 7 === 0 ? 0xc8f0ff : 0x7ad0f0;
                glowPx(X0 + i, Y0 + j, c, 0.96);
              }
            // the scales
            for (let j = 96; j < 108; j++)
              for (let i = 0; i < FW; i++) {
                const row = Math.floor((j - 96) / 4);
                const lx = i + row * 6;
                const k = Math.floor(lx / 12);
                const base = [0xd8402a, 0x2a5aa0, 0x2aa09a, 0x7ab8e0][(k + row * 2) % 4];
                const inScale = (((lx % 12) - 6) / 6) ** 2 + (((j - 96) % 4) / 4) ** 2 < 1;
                glowPx(X0 + i, Y0 + j, inScale ? base : scaleColor(base, 0.6), 0.96);
              }
            // the great entrance arch, its sign and doors
            const MID = X0 + (FW >> 1);
            for (let j = 84; j < 108; j++) for (let i = -21; i <= 21; i++) {
              const arch = j > 90 || (i / 21) ** 2 + ((90 - j) / 6) ** 2 < 1;
              if (!arch) continue;
              glowPx(MID + i, Y0 + j, Math.abs(i) > 18 ? 0xe8e8f0 : i % 7 === 0 ? 0x3a3a48 : 0xfff0c8, 0.97);
            }
            const gr = rng(9);
            for (let k = 0; k < 6; k++) glyph(MID - 21 + k * 7, Y0 + 76, 5, 0xffffff, gr, (gx, gy, gc) => glowPx(gx, gy, gc, 0.99));
            pool(x + 32, y + 30, 34, 0x60a0ff, 0.42);
          },
        });
        // the whale shark swimming across its glass (live)
        {
          const fish = [0, 1, 2, 3].map((k) =>
            capture(x + 4, y + 22, 24, 10, () => {
              const OX = (x + 4) * S + 6;
              const OY = (y + 22) * S + 14;
              const tail = [-3, -1, 3, 1][k];
              for (let i = 0; i < 52; i++) {
                const t = i / 52;
                const hw = t < 0.18 ? 2 + t * 28 : 7 * (1 - (t - 0.18) * 1.05);
                const dy = Math.round(Math.sin(t * 3 + k * 1.57) * (t * 2.5));
                for (let j = -hw; j <= hw; j++) {
                  const J = Math.round(j);
                  const spot = hashPx(i >> 1, (J + 20) >> 1, 92) < 0.2 && J < 2;
                  glowPx(OX + 52 - i, OY + J + dy, spot ? 0xe8f4ff : J > 2 ? 0xc8d8e8 : 0x2a4a7a, 0.98);
                }
              }
              for (let j = -8; j <= 8; j++) glowPx(OX - 3 + Math.round(Math.abs(j) * 0.5), OY + j + tail, 0x2a4a7a, 0.98);
              for (let j = 1; j <= 7; j++) for (let i = 0; i < 8 - j; i++) glowPx(OX + 30 + i, OY - 7 - j, 0x2a4a7a, 0.98);
            }, { u: U(y) }),
          );
          kit.path([[x + 18, U(y + 27)], [x + 46, U(y + 27)]], fish, { sp: 3, mode: 'wrap', turn: 'none', fps: 3, s0: 0.3, d: 0.09 });
        }
        // the queue at its doors, winding
        for (let k = 0; k < 26; k++) folk(x + 32 + Math.sin(k * 0.6) * 9, y + 38 + k * 0.5 + fr());
        reserveRect(x - 2, y - 2, 68, 40);
      }
      // the harbour village: a long low hall of shops, lit
      building(8, Y(6392), 164, 14, 9, { style: 'shop', roof: 0x7a6a5a, wall: 0xe8d8c0, awning: true, neon: true, items: ['ac', 'hut'] });
      // on its roof: barrel vaults of glass lit from the mall below, a terrace of parasols and strings of bulbs; over
      // the door the village's sign, the great arch of the main entrance
      {
        const y = Y(6392);
        objects.push({
          y: y + 26,
          draw: () => {
            for (let Yy = y * S + 3; Yy < (y + 14) * S - 3; Yy++)
              for (let X = 8 * S + 3; X < 172 * S - 3; X++) {
                const seg = (X - 8 * S) % 96;
                let c;
                if (seg < 54) {
                  // the vault
                  const t = (Yy - y * S) / (14 * S);
                  const lit = 1 - Math.abs(t - 0.5) * 1.5;
                  c = seg % 9 === 0 || Yy % 9 === 0 ? 0xc8d0dc : lit > 0.5 ? 0xfff0c8 : 0xc8b8a0;
                  glowPx(X, Yy, c, 0.94);
                  continue;
                }
                c = (X + Yy) % 12 < 6 ? 0xb89868 : 0xa88858; // (the decking)
                img.px(X, Yy, c);
              }
            for (let k = 0; k < 6; k++) {
              const PX = 8 * S + 58 + k * 96 + 10;
              const PY = y * S + 16;
              for (let j = -11; j <= 11; j++) for (let i = -11; i <= 11; i++) if (i * i + j * j < 124) glowPx(PX + i, PY + j, Math.floor(Math.atan2(j, i) * 1.27 + 4) % 2 ? 0xf4f0e6 : 0x2a8aa0, 0.96);
              glowPx(PX, PY, 0x3a3a40, 1);
            }
            const MID = 90 * S;
            for (let Yy = (y + 7) * S; Yy < (y + 23) * S; Yy++)
              for (let i = -60; i <= 60; i++) {
                const r = Yy - (y + 7) * S;
                const top = r < 15;
                if (top) glowPx(MID + i, Yy, r === 0 || r === 14 || Math.abs(i) > 58 ? 0xffe060 : 0x1e4a8a, 0.98);
                else if (Math.abs(i) < 30) glowPx(MID + i, Yy, Math.abs(i) > 27 ? 0xe8e8f0 : (i % 9 === 0 ? 0x3a3a48 : 0xfff4d0), 0.97);
              }
            const gr = rng(6);
            for (let k = 0; k < 10; k++) glyph(MID - 55 + k * 11, (y + 7) * S + 3, 8, 0xffffff, gr, (gx, gy, gc) => glowPx(gx, gy, gc, 0.99));
          },
        });
        for (const X of [20, 52, 128, 160]) warm(X, y + 26, 18, 0.35);
        knot(90, y + 27, 22, 3, 28);
      }
      // the promenade and the quay rail, lamps, strolling people
      for (let X = 0; X < W * S; X++) {
        const y0 = Y(p1 - 4) * S;
        img.px(X, y0, 0xd8dce4);
        img.px(X, y0 + 1, 0x9a9ea8);
        img.px(X, y0 + 5, 0xb8bcc4);
        if (X % 18 < 2) for (let j = 2; j < 9; j++) img.px(X, y0 + j, j > 6 ? 0x4a4e54 : 0x8a8e96);
        for (let j = 9; j < 12; j++) img.px(X, y0 + j, j === 9 ? 0x6a6e74 : 0x3a3e44);
      }
      for (let x = 6; x < W; x += 18) {
        // the lamp standards, each with two lanterns and a banner of the waterfront's colours
        const y = Y(p1 - 6);
        const X = x * S + 1;
        for (let j = -21; j < 3; j++) for (let i = 0; i < 2; i++) img.px(X + i, y * S + j, i ? 0x2a2a30 : 0x6a6a74);
        for (const sd of [-1, 1]) for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) glowPx(X + sd * 4 + i - 1, y * S - 24 + j, 0xfff4c8, 1);
        for (let j = 0; j < 12; j++) for (let i = 0; i < 7; i++) glowPx(X + 2 + i, y * S - 18 + j, j % 12 < 4 ? 0xe83a2a : j % 12 < 8 ? 0xf4f0e6 : 0x2a6ac8, 0.94);
        glow(x, Y(p1 - 7), 0xfff0c8);
        pool(x, Y(p1 - 6), 15, C.lamp, 0.45);
      }
      // anglers along the rail, with their buckets and long rods out over the water; bollards, a lifebuoy
      for (let x = 9; x < W; x += 21 + Math.floor(fr() * 16)) {
        const y = Y(p1 - 7);
        const X = x * S;
        const Yy = y * S;
        objects.push({
          y: y + 2,
          draw: () => {
            personPx(X, Yy, rng(x), { hat: true, coat: 0x3a4a5a });
            for (let k = 0; k < 14; k++) img.px(X + 4 + k, Yy + 2 - Math.round(k * 0.95), 0xc8c8d0);
            for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) img.px(X - 6 + i, Yy + 2 + j, i === 3 ? 0x2a4a7a : 0x3a6ac0);
          },
        });
      }
      for (const x of [33, 96, 150]) {
        const X = x * S;
        const Yy = Y(p1 - 6) * S;
        for (let j = -5; j <= 5; j++) for (let i = -5; i <= 5; i++) {
          const q = i * i + j * j;
          if (q < 28 && q > 6) img.px(X + i, Yy + j, Math.floor(Math.atan2(j, i) * 1.9 + 8) % 2 ? 0xe83a2a : 0xf4f0e6);
        }
      }
      // a row of yatai, the little food carts, along the promenade: red lanterns, curtains over the counters,
      // stools in front, steam off the pots (live)
      for (const [k, x] of [12, 48, 84, 120, 156].entries()) {
        const y = Y(6420);
        yatai(x - 1, y - 2, ['takoyaki', 'kakigori', 'yakitori', 'ringo', 'takoyaki'][k]);
        knot(x + 8, y + 13, 8, 2, 8);
        reserveRect(x - 2, y - 2, 20, 12);
      }
      crowd(4, Y(p1 - 8), 172, 26, 60, false);
      crowd(4, Y(6330), 172, 40, 40, false);
      // strings of bulbs from the promenade's lamps across the plaza
      for (const u of [6352, 6296, 6272]) {
        const strand = new HiCanvas(W, 5);
        for (let i = 0; i < W * S; i++) {
          const j = 7 + Math.round(Math.abs(Math.sin((i / (W * S)) * Math.PI * 5)) * 6);
          strand.px(i, j, 0x1a1418);
          if (i % 10 === 0) for (const [a, b] of [[0, 1], [1, 1], [0, 2], [1, 2]]) strand.px(i + a, j + b, (i >> 2) % 3 ? 0xfff0b0 : 0xff9a6a);
        }
        kit.loop(0, u, [kit.frame(strand)], { fps: 1, d: 0.1 });
      }
      // --- what a waterfront is furnished with: a bus shelter with its queue, a line of drink machines burning in the
      // dark, racks of hire bikes, planters with their benches, a zebra across the road, a bronze whale shark to be
      // photographed with
      for (let Yr = (Y(6218) - 4) * S; Yr < (Y(6218) + 5) * S; Yr++) for (let X = 82 * S; X < 98 * S; X++) if ((X >> 2) % 2) img.px(X, Yr, 0xd8d8e0);
      {
        const X = 104 * S;
        const Yy = Y(6228) * S;
        objects.push({
          y: Y(6228) + 6,
          shadow: () => shadowRect(106, Y(6228) + 3, 26, 4, 0.6),
          draw: () => {
            for (let j = 0; j < 8; j++) for (let i = 0; i < 78; i++) glowPx(X + i, Yy + j, j === 0 ? 0xffffff : j === 7 ? 0x4a5060 : i % 13 === 0 ? 0x7a8090 : 0xa8c8e0, 0.92);
            for (let j = 8; j < 14; j++) for (let i = 0; i < 78; i++) if (i < 2 || i > 75) glowPx(X + i, Yy + j, 0x6a7080, 0.95);
            for (let j = 8; j < 18; j++) for (let i = 80; i < 88; i++) glowPx(X + i, Yy + j, j < 12 ? 0x2a6ac8 : 0xf4f4f8, 0.97);
          },
        });
        warm(117, Y(6228) + 4, 18, 0.45, 0xe8f0ff);
        for (let k = 0; k < 10; k++) folk(106 + k * 2.4, Y(6228) + 7 + (k % 2));
        for (const x of [40, 136]) {
          chochin(x, Y(6226), 0xfff0d0);
          warm(x, Y(6224), 12, 0.35);
        }
      }
      for (const [x0, n] of [[4, 6], [150, 6]]) {
        const y = Y(6238);
        objects.push({
          y: y + 7,
          shadow: () => shadowRect(x0 + 1, y + 2, n * 4 + 1, 7, 0.6),
          draw: () => {
            const gr = rng(x0);
            for (let k = 0; k < n; k++) {
              const c = gr.pick([0xd83a2a, 0x2a6ad0, 0xf4f4f0, 0x2aa05a, 0xe8c040]);
              const X = (x0 + k * 4) * S;
              for (let j = 0; j < 21; j++)
                for (let i = 0; i < 11; i++) {
                  let col = j < 2 ? 0xf8f8f8 : c;
                  if (j > 3 && j < 12 && i > 0 && i < 10) col = (j % 3 === 0 ? 0x1a1a22 : gr() < 0.5 ? 0xfff0c0 : 0xd8e8f8);
                  if (j > 15 && j < 19 && i > 2 && i < 8) col = 0x141418;
                  glowPx(X + i, y * S + j, col, 0.97);
                }
            }
          },
        });
        warm(x0 + n * 2, y + 8, n * 3.5, 0.5, 0xe8f0ff);
        knot(x0 + n * 2, y + 11, n * 2, 2, 5);
      }
      for (const [x0, u] of [[8, 6372], [130, 6372]]) {
        const y = Y(u);
        objects.push({
          y: y + 4,
          draw: () => {
            const gr = rng(x0 + 1);
            for (let k = 0; k < 12; k++) {
              const X = x0 * S + k * 8;
              const c = gr.pick([0xd83a2a, 0x2a6ad0, 0xf4f4f0, 0x1a1a22, 0xe8c040]);
              for (let j = 0; j < 12; j++) img.px(X, y * S + j, j < 3 || j > 9 ? 0x1a1a20 : c);
              for (let i = -2; i <= 2; i++) img.px(X + i, y * S + 5, 0x6a6a74);
            }
            for (let i = 0; i < 96; i++) img.px(x0 * S + i, y * S + 8, 0x9a9aa4);
          },
        });
      }
      const planter = (x, y) => {
        objects.push({
          y: y + 4,
          shadow: () => shadowRect(x + 2, y + 2, 14, 3, 0.6),
          draw: () => {
            const X = x * S;
            const Yy = y * S;
            const gr = rng(x * 7 + y);
            for (let j = 3; j < 12; j++) for (let i = 0; i < 42; i++) img.px(X + i, Yy + j, j === 3 ? 0xc8c4bc : j < 8 ? 0x9a968e : 0x6a665e);
            for (let j = -3; j < 5; j++)
              for (let i = 2; i < 40; i++) {
                const n = gr();
                if (n < 0.7) glowPx(X + i, Yy + j, n < 0.1 ? 0xff7ab0 : n < 0.2 ? 0xffe060 : n < 0.27 ? 0xffffff : (i + j) % 3 ? 0x4a9a4a : 0x2a6a34, 0.92);
              }
            for (let i = 0; i < 42; i++) for (let j = 12; j < 16; j++) img.px(X + i, Yy + j, j === 12 ? 0xa87c50 : j > 14 ? 0x2a1e18 : i % 7 === 0 ? 0x46301f : 0x7a5835);
          },
        });
        warm(x + 7, y + 5, 9, 0.3);
        for (let k = 0; k < 3; k++) if (fr() < 0.7) folk(x + 2 + k * 5, y + 4);
      };
      for (const [x, u] of [[72, 6244], [94, 6244], [72, 6276], [94, 6276], [6, 6280], [160, 6280], [6, 6256], [160, 6256], [36, 6300], [128, 6358], [36, 6358]]) planter(x, Y(u));
      {
        const x = 12;
        const y = Y(6350);
        objects.push({
          y: y + 15,
          shadow: () => shadowRect(x + 3, y + 10, 28, 5, 0.55),
          draw: () => {
            const X = x * S;
            const Yy = y * S;
            for (let j = 33; j < 45; j++) for (let i = 0; i < 90; i++) img.px(X + i, Yy + j, j === 33 ? STONE[3] : j < 39 ? STONE[2] : STONE[1]);
            for (let i = 0; i < 84; i++) {
              const t = i / 84;
              const hw = t < 0.2 ? 6 + t * 40 : 14 * (1 - (t - 0.2) * 1.05);
              const dy = Math.round(Math.sin(t * 3.4) * 6);
              for (let j = -hw; j <= hw; j++) {
                const J = Math.round(j);
                const spot = hashPx(i >> 1, (J + 30) >> 1, 93) < 0.2 && J < 3;
                glowPx(X + 84 - i, Yy + 16 + J + dy, spot ? 0xd8c090 : J < -4 ? 0x7a6a3a : J > 4 ? 0x4a3e24 : 0x5e4e2c, 0.97);
              }
            }
            for (let j = -12; j <= 12; j++) for (let i = 0; i < 6; i++) glowPx(X + i + Math.round(Math.abs(j) * 0.5), Yy + 16 + j - 2, 0x5e4e2c, 0.97);
          },
        });
        warm(x + 15, y + 12, 22, 0.45);
        knot(x + 15, y + 19, 12, 2, 10);
      }
      // --- the crowd out for the evening, and everything that moves
      for (let k = 0; k < 150; k++) folk(4 + fr() * 172, Y(6340 + fr() * 86));
      for (let k = 0; k < 70; k++) folk(4 + fr() * 172, Y(6300 + fr() * 40));
      for (let k = 0; k < 40; k++) folk(72 + fr() * 36, Y(6232 + fr() * 60));
      {
        const ws = walkers(6340);
        for (const [pts, n] of [[[[6, 6410], [174, 6410]], 3], [[[174, 6402], [6, 6402]], 3], [[[6, 6344], [174, 6344]], 3], [[[174, 6332], [6, 6332]], 2], [[[80, 6234], [80, 6290]], 2], [[[100, 6234], [100, 6290]], 2]])
          kit.path(pts, fr.pick(ws), { sp: 3 + fr() * 1.4, n, gap: 44, mode: 'pp', hold: 2.5, turn: 'none', fps: 3, s0: fr(), d: 0.03 });
        // the road: buses and taxis coming and going
        const vehicle = (c, len, h, windows, u) => {
          const out = new HiCanvas(len, h);
          const FW = len * S;
          const FH = h * S;
          for (let j = 0; j < FH; j++)
            for (let i = 0; i < FW; i++) {
              if ((i < 2 || i >= FW - 2) && (j < 2 || j >= FH - 2)) continue;
              let col = j < 2 ? scaleColor(c, 1.25) : j >= FH - 2 ? scaleColor(c, 0.65) : c;
              if (windows && j > 2 && j < FH - 3 && i % 9 < 7) col = 0x34404c;
              if (!windows && i > FW * 0.2 && i < FW * 0.75 && j > 2 && j < FH - 3) col = 0x34404c;
              out.px(i, j, col);
            }
          tod.frame(out, u);
          for (const j of [2, FH - 3]) {
            out.px(FW - 1, j, 0xfff4c8);
            out.px(FW - 2, j, 0xfff4c8);
            out.px(0, j, 0xff3a2a);
          }
          return kit.frame(out);
        };
        const traffic = (dir, lane, frame, sp, s0) => {
          const pts = dir > 0 ? [[-30, lane], [210, lane]] : [[210, lane], [-30, lane]];
          kit.path(pts, [frame], { sp, turn: 'flip', fps: 1, s0, d: 0.02 });
        };
        traffic(1, 6215, vehicle(0x2a6ac8, 22, 5, true, 6218), 16, 0.1);
        traffic(1, 6215, vehicle(0xe8c040, 8, 4, false, 6218), 22, 0.45);
        traffic(1, 6215, vehicle(0xf4f0e6, 8, 4, false, 6218), 20, 0.8);
        traffic(-1, 6221, vehicle(0xc8302a, 24, 5, true, 6218), 15, 0.3);
        traffic(-1, 6221, vehicle(0x2a2a30, 8, 4, false, 6218), 24, 0.7);
        traffic(-1, 6221, vehicle(0xe8c040, 8, 4, false, 6218), 21, 0.95);
      }
    }

    // ---- the bay: the sailing ship at the quay, fishing boats with lamps, the lit harbour bridge
    // the Santa Maria, the replica galleon that takes visitors round the bay, moored alongside the quay: bow to the
    // left with its bowsprit, raised forecastle and sterncastle with the cabin's windows, three masts with their
    // yards across the hull and the sails furled on them (a lateen yard on the mizzen), shrouds down to the sides,
    // mooring lines and fenders on the quay side, a string of lights along the rigging, its shadow on the water
    {
      const [bx0, bx1] = [114, 160]; // bow tip, stern
      const yc = Y(6452); // the keel's line
      const half = (x) => (x < 126 ? 1 + (x - bx0) * 0.5 : x > 154 ? 7 - (x - 154) * 0.25 : 7);
      objects.push({
        y: yc + 8,
        shadow: () => {
          for (let x = bx0; x <= bx1; x++) for (let j = -Math.round(half(x)); j <= half(x); j++) img.tint(x + 4, yc + j + 4, 0.55);
        },
        draw: () => {
          img.line(bx0 - 10, yc - 1, bx0, yc, 0x4a3020); // the bowsprit
          for (let x = bx0; x <= bx1; x++) {
            const h = Math.round(half(x));
            for (let j = -h; j <= h; j++) {
              const edge = Math.abs(j) === h;
              const side = Math.abs(j) === h - 1;
              const fore = x < 128;
              const aft = x > 146;
              let c = (x + (j & 1)) % 3 ? 0xb08850 : 0x9a7444; // deck planks along the length
              if (fore || aft) c = (x & 1) ? 0xc89a62 : 0xb88a56; // the raised castles
              if (side) c = j < 0 ? 0x7a5232 : 0x5a3a24; // the bulwarks
              if (edge) c = 0x2e1c12;
              if (side && x % 4 === 0) c = 0xd8a840; // the gilded wale
              img.set(x, yc + j, c);
            }
          }
          for (const x of [128, 146]) for (let j = -6; j <= 6; j++) img.set(x, yc + j, 0x5a3a24); // the castles' fronts
          img.rect(150, yc - 4, 8, 9, 0x8a2a1e); // the cabin roof on the sterncastle
          img.rect(150, yc - 4, 8, 1, 0xa83a2a);
          for (const j of [-3, 0, 3]) img.set(159, yc + j, 0xffd890); // the stern windows
          // masts, yards with the sails furled along them, shrouds to the bulwarks
          for (const [mx, reach] of [[124, 10], [137, 12]]) {
            for (let j = -reach; j <= reach; j++) {
              img.set(mx, yc + j, 0x3a2416);
              img.set(mx + 1, yc + j, Math.abs(j) < reach - 1 ? (j < 0 ? 0xf2ead8 : 0xd0c4aa) : 0x3a2416);
            }
            for (const sgn of [-1, 1]) img.line(mx - 3, yc + sgn * 6, mx, yc + sgn * 1, 0x4a3a2a);
            img.rect(mx - 1, yc - 1, 3, 3, 0x2a1a10); // the mast and its top
          }
          img.line(146, yc + 8, 156, yc - 7, 0x3a2416); // the mizzen's lateen yard
          img.line(147, yc + 8, 157, yc - 7, 0xe8dcc4);
          img.rect(150, yc - 1, 3, 3, 0x2a1a10);
          // mooring lines and fenders on the quay side
          for (const [x, qx] of [[118, 110], [156, 166]]) img.line(x, yc + half(x), qx, Y(6428), 0xd8c8a0);
          for (const x of [124, 134, 144]) img.rect(x, yc + 8, 2, 1, 0x1a1a1e);
          // the string of lights from the bowsprit over the mast tops to the stern
          const pts = [[bx0 - 10, yc - 1], [125, yc - 2], [138, yc - 2], [151, yc - 2], [bx1, yc]];
          for (let i = 0; i < pts.length - 1; i++) {
            const [ax, ay] = pts[i];
            const [cx, cy] = pts[i + 1];
            for (let k = 0; k < 4; k++) glow(ax + ((cx - ax) * k) / 4, ay + ((cy - ay) * k) / 4 - 1, (i + k) % 2 ? 0xffe0a0 : 0xff6a40, 0.8);
          }
          pool(137, yc, 24, 0xffc070, 0.32);
        },
      });
    }
    // the container terminal down the left edge of the bay: the quay stacked with containers, three gantry
    // cranes with their booms out over the water and red lights on top; tugboats working along the right (live)
    {
      const [q0, q1] = [6600, 7130];
      for (let u = q0; u < q1; u++)
        for (let x = 0; x < 16; x++) img.set(x, Y(u), x === 15 ? 0x6a6e74 : rampColor(STONE, 0.4 + fbm(x, u, { seed: 5521, scale: 3 }) * 0.3, x, Y(u)));
      reserveRect(0, Y(q1), 17, q1 - q0);
      const cols = [0xc84a30, 0x2a5a9a, 0x3a8a5a, 0xd8a030, 0x8a8a92, 0x6a3a8a];
      for (let u = q0 + 6; u < q1 - 6; u += 5)
        for (const x of [1, 6])
          if ((u + x) % 7) {
            const c = cols[(u * 3 + x) % cols.length];
            const X0 = x * S;
            const Y0 = Y(u) * S;
            for (let j = 0; j < 12; j++)
              for (let i = 0; i < 12; i++) {
                let cc = i % 2 ? c : scaleColor(c, 0.82); // (the corrugations)
                if (j === 0) cc = scaleColor(c, 1.25);
                if (j === 11 || i === 11) cc = scaleColor(c, 0.6);
                if (j >= 9 && j < 11) cc = (i % 3 === 0 ? 0x2a2a30 : scaleColor(c, 0.7)); // (the door end, its bars)
                if (j === 5 && hashPx(u, x, 5522) < 0.5) cc = 0xe8e4dc; // (a painted band)
                img.px(X0 + i, Y0 + j, cc);
              }
            img.px(X0 + 12, Y0 + 12, 0x101018, 0.4);
          }
      for (const u of [6700, 6870, 7040]) {
        const y = Y(u);
        objects.push({
          y: y + 6,
          shadow: () => {
            for (let x = 16; x < 44; x++) img.tint(x + 3, y + 7, 0.6);
          },
          draw: () => {
            for (const lx of [2, 12])
              for (let FYr = (y - 4) * S; FYr < (y + 8) * S; FYr++)
                for (let i = 0; i < 6; i++) img.px(lx * S + i, FYr, i === 0 || i === 5 ? 0x5a6270 : (FYr + i) % 6 === 0 || (FYr - i) % 6 === 0 ? 0x4a525e : null ?? 0x2a2e36);
            for (let X = 0; X < 46 * S; X++)
              for (let j = 0; j < 9; j++) {
                const k = X % 9;
                const c = j === 0 ? 0xa8b8c8 : j === 8 ? 0x3a4450 : Math.abs(k - j) < 1 || Math.abs(8 - k - j) < 1 ? 0x6a7a8a : k === 0 ? 0x5a6a7a : null;
                if (c !== null) img.px(X, y * S + j, c);
              }
            for (let j = 0; j < 7; j++) for (let i = 0; i < 12; i++) img.px(60 + i, (y + 3) * S + j, j === 0 ? 0xf0ece0 : i === 11 ? 0x8a8a90 : 0xd8d4c8);
            glowPx(62, (y + 3) * S + 3, 0xfff0c8);
            glowPx(66, (y + 3) * S + 3, 0xfff0c8);
            glow(45, y, 0xff3020);
            glow(1, y - 4, 0xff3020);
          },
        });
      }
      const tug = (up) => {
        const r = new HiCanvas(7, 13);
        for (let j = 0; j < 12; j++) {
          const w = (up ? j < 3 : j > 8) ? 3 : 5;
          r.rect(Math.floor((7 - w) / 2), j, w, 1, j % 4 === 0 ? 0x1a1a20 : 0x2a2a30);
        }
        r.rect(1, 5, 5, 3, 0xd8402a); // the wheelhouse
        r.rect(2, 5, 3, 1, 0xf0e8d8);
        r.set(3, up ? 9 : 3, 0xe8c040); // the funnel
        r.rect(6, 1, 1, 12, 0x0a1418, 0.25);
        return kit.frame(tod.frame(r, 6900, [[3, up ? 0 : 12, 0xffffff, 0.9]]));
      };
      const wakeT = [0, 1, 2].map((k) => {
        const w = new HiCanvas(1, 11 + k * 4);
        w.set(0, 0, 0xeaf0f0);
        w.set(0, 10 + k * 4, 0xeaf0f0);
        return kit.frame(tod.frame(w, 6900));
      });
      for (const [x, s0] of [[156, 0.2], [170, 0.75]]) kit.path([[x, 6600], [x, 7120]], [tug(true)], { sp: 6, mode: 'pp', hold: 4, turn: 'none', fu: [tug(true)], fd: [tug(false)], wake: { f: wakeT, every: 3, life: 2 }, s0 });
    }
    // a container ship moored at the terminal under the cranes: the hull, the bridge and funnel aft, the deck
    // stacked with containers, the mooring lines, its lights
    {
      const sx0 = 18;
      const sx1 = 42;
      const [s0, s1] = [6650, 6990];
      objects.push({
        y: Y(s1) - 1,
        shadow: () => shadowRect(sx0 + 3, Y(s1) + 3, sx1 - sx0, s1 - s0, 0.6),
        draw: () => {
          const X0 = sx0 * S;
          const X1 = sx1 * S;
          const Y0 = Y(s1) * S;
          const Y1 = Y(s0) * S;
          const cx = (X0 + X1) / 2;
          const sr = rng(6650);
          for (let Yy = Y0; Yy < Y1; Yy++) {
            const t = (Yy - Y0) / (Y1 - Y0);
            const bow = t < 0.08 ? (t / 0.08) ** 0.6 : 1; // (the bow narrows towards the top)
            const hw = ((X1 - X0) / 2) * bow;
            for (let X = Math.round(cx - hw); X < cx + hw; X++) {
              const e = Math.min(X - (cx - hw), cx + hw - X);
              let c = e < 2 ? 0x1a1a22 : e < 4 ? 0xb8302a : 0x2a3a5a; // (the black hull, red boot-topping, the deck)
              if (e >= 4 && Yy % 3 === 0 && t > 0.1 && t < 0.88) c = 0x34466a;
              img.px(X, Yy, c);
            }
          }
          // the stacks of containers on deck, in bays
          const cols = [0xc84a30, 0x2a5a9a, 0x3a8a5a, 0xd8a030, 0x8a8a92, 0x6a3a8a, 0xe8e4dc];
          for (let Yy = Y0 + 36; Yy < Y1 - 120; Yy += 21)
            for (let X = X0 + 8; X < X1 - 8; X += 7) {
              const c = sr.pick(cols);
              for (let j = 0; j < 19; j++) for (let i = 0; i < 6; i++) img.px(X + i, Yy + j, j === 0 ? scaleColor(c, 1.25) : i === 5 ? scaleColor(c, 0.6) : j % 2 ? c : scaleColor(c, 0.86));
            }
          // the bridge house and funnel aft, windows lit
          const BY = Y1 - 110;
          for (let j = 0; j < 42; j++)
            for (let X = X0 + 6; X < X1 - 6; X++) {
              const lx = X - X0 - 6;
              let c = j < 3 ? 0xf4f4f0 : X >= X1 - 9 ? 0x9a9aa0 : 0xe0e0dc;
              if (j > 6 && j % 8 < 3 && lx % 4 < 2) {
                glowPx(X, BY + j, 0xffe8b0, 0.9);
                continue;
              }
              img.px(X, BY + j, c);
            }
          for (let j = 0; j < 18; j++) for (let i = 0; i < 14; i++) img.px(cx - 7 + i, BY + 54 + j, j < 3 ? 0x1a1a20 : i < 3 ? 0xe86a3a : 0xd84a2a);
          glowPx(cx, Y0 + 6, 0xffffff);
          glowPx(X0 + 4, BY - 4, 0xff3020);
          glowPx(X1 - 5, BY - 4, 0x30ff60);
          for (const t of [0.15, 0.85]) for (let k = 0; k < 6; k++) img.px(X0 - k * 2, Math.round(Y0 + (Y1 - Y0) * t) + k, 0xd8d0b0);
          pool(sx0 + 12, Y(s0) - 36, 16, 0xffe8b0, 0.3);
        },
      });
      reserveRect(sx0, Y(s1), sx1 - sx0, s1 - s0);
    }
    // the breakwater across the top of the bay: a wall heaped with tetrapods, the red lighthouse at its end
    {
      const bu = 7148;
      const by = Y(bu);
      objects.push({
        y: by + 6,
        shadow: () => shadowRect(98, by + 3, 82, 5, 0.6),
        draw: () => {
          for (let X = 96 * S; X < W * S; X++)
            for (let j = 0; j < 15; j++) {
              const Yy = by * S + j;
              let c = j < 6 ? (j === 0 ? 0xb8b4ac : 0x8a8680) : j === 6 ? 0x4a4844 : null;
              if (j > 6) {
                // tetrapods: grey four-legged blocks heaped along the foot, lit on top, shadowed between
                const k = (X + Math.floor(j / 4) * 5) % 10;
                c = k < 6 ? (j % 4 === 0 ? 0xc8c4bc : 0x9a968e) : k < 8 ? 0x6a6660 : null;
              }
              if (c !== null) img.px(X, Yy, c);
            }
          const LX = 102 * S;
          for (let j = 0; j < 30; j++)
            for (let i = -6; i <= 6; i++) {
              const r = 6 - j * 0.08;
              if (Math.abs(i) > r) continue;
              img.px(LX + i, by * S - 24 + j, Math.floor(j / 6) % 2 ? 0xf0ece4 : i < -2 ? 0xe8504a : 0xc83a30);
            }
          for (let i = -4; i <= 4; i++) img.px(LX + i, by * S - 25, 0x2a2a30);
          glowPx(LX, by * S - 27, 0xfff0c0);
        },
      });
      reserveRect(96, by - 9, 84, 14);
      // its lamp flashes, the buoys' lights blink (live)
      const flash = [0, 1].map((on) => {
        const r = new HiCanvas(5, 5);
        if (on) for (let j = 0; j < 15; j++) for (let i = 0; i < 15; i++) {
          const d = Math.hypot(i - 7, j - 7);
          if (d < 7) r.px(i, j, 0xfff4c0, (1 - d / 7) ** 1.5);
        }
        return kit.frame(r);
      });
      kit.loop(100, U(by - 11), flash, { seq: [1, 0, 0, 0, 0, 0, 0, 0], fps: 4, ph: 0.1, fx: 1 });
      const buoy = (c) => [0, 1].map((on) => {
        const r = new HiCanvas(3, 4);
        for (let j = 3; j < 11; j++) for (let i = 2; i < 7; i++) if (Math.hypot(i - 4.5, j - 7) < 3.2) r.px(i, j, i < 4 ? scaleColor(c, 1.2) : c);
        r.px(4, 2, 0x3a3a40);
        r.px(4, 1, on ? 0xffffff : 0x5a5a60);
        for (let i = 1; i < 8; i++) r.px(i, 10, 0xc8e0e8, 0.4);
        return kit.frame(tod.frame(r, 6900));
      });
      for (const [x, u, c, ph] of [[64, 6640, 0xd83a2a, 0], [118, 6640, 0x2aa04a, 0.5], [70, 6980, 0xd83a2a, 0.25], [128, 7060, 0x2aa04a, 0.75]]) kit.loop(x, u, buoy(c), { seq: [1, 0, 0, 0], fps: 2, ph });
    }
    // Minato Ōhashi: the red truss bridge across the harbour mouth, a chain of lights along it
    objects.push({
      y: Y(6560) + 8,
      shadow: () => shadowRect(0, Y(6560) + 9, W, 4, 0.5),
      draw: () => {
        // the road on its deck, the red truss rising either side with its web of diagonals, portal frames across
        // the road at the great piers, a chain of lamps along the top chords
        const y0 = Y(6560) * S;
        for (let X = 0; X < W * S; X++) {
          for (let j = 0; j < 27; j++) {
            let c;
            if (j < 3 || j > 23) c = j === 0 || j === 26 ? 0xff7060 : j === 1 || j === 25 ? 0xe8402a : 0x8a2018; // (the chords)
            else if (j < 7 || j > 19) {
              const k = (X + (j < 7 ? j : -j) * 3 + 2400) % 24;
              c = k < 3 ? 0xd83a2a : 0x3a1a1c; // (the web)
            } else {
              c = hashPx(X, j, 89) < 0.1 ? 0x3e3e48 : 0x34343c;
              if (j === 13 && X % 18 < 10) c = 0xd8d0a0;
              if ((j === 7 || j === 19)) c = 0xb8b8c0;
            }
            glowPx(X, y0 + j, c, 0.96);
          }
          if (X % 24 === 0) {
            for (const j of [-1, 27]) {
              glowPx(X, y0 + j, 0xfff4c8, 1);
              glowPx(X + 1, y0 + j, 0xfff4c8, 1);
            }
          }
        }
        for (const tx of [40, 140]) {
          const X = tx * S;
          for (let j = -32; j < 38; j++)
            for (let i = -10; i <= 10; i++) {
              if (j > -2 && j < 28 && Math.abs(i) < 6) continue; // (the road passes through)
              glowPx(X + i, y0 + j, i < -7 ? 0xff7060 : i > 6 ? 0x8a2018 : (j + 40) % 12 < 2 ? 0x8a2018 : 0xd83a2a, 0.97);
            }
          for (let i = -2; i <= 2; i++) for (let j = -35; j < -32; j++) glowPx(X + i, y0 + j, 0xff3a2a, 1);
        }
        for (let x = 0; x < W; x += 5) glow(x, Y(6560), 0xfff0d0, 0.5);
      },
    });
    {
      // (live) the traffic over the bridge, head and tail lamps burning; its lights broken on the water beneath
      const car = (c) => {
        const out = new HiCanvas(7, 4);
        for (let j = 1; j < 10; j++) for (let i = 0; i < 18; i++) if (!((i === 0 || i === 17) && (j === 1 || j === 9))) out.px(i, j, (i > 4 && i < 8) || (i > 11 && i < 14) ? 0x26303a : j < 3 ? scaleColor(c, 1.2) : j > 7 ? scaleColor(c, 0.7) : c);
        tod.frame(out, 6556);
        for (const j of [2, 8]) {
          out.px(18, j, 0xfff4c8);
          out.px(19, j, 0xfff4c8);
          out.px(0, j, 0xff3a2a);
        }
        return kit.frame(out);
      };
      for (const [lane, dir, sp, c] of [[6557, 1, 30, 0xe8e8ec], [6557, 1, 30, 0x3a4a6a], [6557, 1, 30, 0xa83a2a], [6554, -1, 26, 0x2a2a30], [6554, -1, 26, 0xc8c8cc], [6554, -1, 26, 0xe8c040]]) {
        kit.path(dir > 0 ? [[-24, lane], [204, lane]] : [[204, lane], [-24, lane]], [car(c)], { sp, turn: 'flip', fps: 1, s0: fr(), d: 0.12 });
      }
      for (let n = 0; n < 60; n++) {
        const x = Math.floor(fr() * W);
        pool(x, Y(6548) + Math.floor(fr() * 10), 4, 0xfff0c0, 0.12);
      }
    }
    for (const [x, u] of [[30, 6700], [150, 6820], [70, 7000], [130, 7080]]) {
      img.disc(x, Y(u), 2, 0xd8402a);
      glow(x, Y(u) - 1, 0xff6040);
      pool(x, Y(u), 8, 0xff6040, 0.3);
    }
    // the harbour cruiser (live), its decks lit and full of people, going out past the breakwater with a long wake; lit
    // sailing boats tacking; and far over the bay, soft and low so as not to take the eye off the fight, fireworks
    {
      const cruiser = capture(0, 400, 56, 16, () => {
        const OY = 400 * S;
        const FW = 56 * S;
        const CY = OY + 24;
        const beam = (t) => 20 * (t < 0.62 ? 1 : Math.max(0, 1 - ((t - 0.62) / 0.38) ** 1.7));
        for (let i = 0; i < FW; i++) {
          const t = i / FW;
          const hw = beam(t);
          for (let j = -Math.round(hw); j <= Math.round(hw); j++) {
            const e = hw - Math.abs(j); // (in from the rail)
            let c;
            if (e < 1) c = 0x1e4a8a; // (the hull's blue sheer line)
            else if (e < 3) c = j < 0 ? 0xffffff : 0xc8ccd8; // (the rail)
            else if (e < 6) c = (i + 200) % 8 < 2 ? 0x9a7a4a : 0xb89060; // (the teak of the promenade deck)
            else if (t < 0.8) c = e < 8 ? (j < 0 ? 0xf8f8fc : 0xb8bcc8) : 0xe8e8f0; // (the deckhouse's white)
            else c = (i + j * 3) % 9 < 2 ? 0x9a7a4a : 0xb89060;
            // two rows of lit windows along each side of the deckhouse
            if (t < 0.8 && t > 0.03 && e >= 8 && e < 10 && i % 7 < 4) c = hashPx(i >> 3, j > 0 ? 1 : 0, 96) < 0.12 ? 0x4a5a6a : 0xffe8a0;
            // the upper deck, narrower, cream, with its own windows and a sun deck on top
            if (t > 0.14 && t < 0.68 && e >= 12) c = e < 14 ? 0xffffff : (i % 9 < 5 && e < 16 ? 0xfff4c0 : 0xd8d4c8);
            glowPx(i, CY + j, c, 0.97);
          }
        }
        // the funnel in the company's red and black
        for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) if (i * i + j * j < 38) glowPx(52 + i, CY + j, i * i + j * j < 12 ? 0x1a1a22 : j < -1 ? 0xff5a40 : 0xd8302a, 0.99);
        // the wheelhouse's window band, the anchor deck at the bow, orange lifeboats along each side
        for (let j = -8; j <= 8; j++) for (let i = 0; i < 4; i++) glowPx(112 + i, CY + j, i < 2 ? 0x8ad0f0 : 0x2a4a6a, 0.98);
        for (const sd of [-1, 1])
          for (let k = 0; k < 6; k++) for (let i = 0; i < 7; i++) for (let j = 0; j < 3; j++) glowPx(22 + k * 14 + i, CY + sd * 14 + j - 1, j === 0 ? 0xffa050 : 0xe8701a, 0.98);
        // passengers along the rails, on the sun deck
        for (let k = 0; k < 44; k++) {
          const t = fr() * 0.86;
          const sd = fr() < 0.5 ? -1 : 1;
          const J = sd * (17 - Math.floor(fr() * 3));
          const X = Math.round(t * FW);
          const c = fr.pick([0xd04040, 0x3a6ad0, 0xe8c040, 0x2a2a30, 0xff7ab0]);
          glowPx(X, CY + J, c, 0.98);
          glowPx(X, CY + J + 1, 0xe8c0a0, 0.98);
        }
        // red and white flags strung from bow to stern
        for (let i = 4; i < FW - 16; i += 6) glowPx(i, CY + (Math.floor(i / 6) % 2 ? -1 : 1), Math.floor(i / 6) % 2 ? 0xff5a40 : 0xffffff, 0.98);
      }, { u: 6640 });
      const wakeF = [2, 3, 4].map((k) => {
        const out = new HiCanvas(k + 3, k + 3);
        const r = ((k + 3) * S) / 2;
        for (let j = -r; j < r; j++) for (let i = -r; i < r; i++) if (Math.hypot(i, j) < r && hashPx(i + k, j, 94) < 0.3) out.px(r + i, r + j, 0xd8e8f0, 0.55);
        return kit.frame(out);
      });
      kit.path([[-40, 6640], [220, 6640]], [cruiser], { sp: 5, turn: 'flip', fps: 1, s0: 0.3, wake: { f: wakeF, every: 5, life: 2.4 }, d: 0.1 });
      const sail = capture(0, 440, 9, 10, () => {
        const OY = 440 * S;
        for (let j = 18; j < 28; j++) {
          const hw = 12 * Math.sqrt(1 - ((j - 23) / 6) ** 2 * 0.9);
          for (let i = -hw; i <= hw; i++) glowPx(13 + Math.round(i), OY + j, j < 20 ? 0xf8f4ec : 0x7a5a3a, 0.96);
        }
        for (let j = 2; j < 22; j++) for (let k = 0; k < j * 0.5; k++) glowPx(13 + 1 + Math.round(k), OY + j, j % 5 === 0 ? 0xc8c8d0 : 0xf8f8fc, 0.96);
        for (let j = 0; j < 24; j++) glowPx(13, OY + j, 0x4a3a2a, 0.98);
        glowPx(13, OY - 1, 0xff3a2a, 1);
      }, { u: 6800 });
      for (const [u, x0, x1, s0] of [[6780, -20, 200, 0.2], [6880, 200, -20, 0.6], [6490, -20, 200, 0.8]]) kit.path([[x0, u], [x1, u + 6]], [sail], { sp: 7, turn: 'flip', fps: 1, s0, d: 0.1 });
      const burst = (c1, c2) =>
        [3, 6, 9, 12, 14, 15].map((r, k) => {
          const R = 16;
          const out = new HiCanvas(R, R);
          const fade = 1 - k / 7;
          for (let a = 0; a < 24; a++) {
            const t = (a / 24) * Math.PI * 2;
            for (let q = 0; q < 3; q++) {
              const d = (r - q * 1.1) * S * 0.5;
              out.px(Math.round(24 + Math.cos(t) * d), Math.round(24 + Math.sin(t) * d), q ? c2 : c1, fade * (1 - q * 0.3));
            }
          }
          return kit.frame(out);
        });
      for (const [c1, c2] of [[0xfff4c0, 0xffb040], [0xffffff, 0x8ad0ff], [0xffe0a0, 0xff8a50]]) kit.spot([[12, 6960, 140, 300]], burst(c1, c2), { rate: 0.2, fps: 7, a: 0.62, d: 0.49 });
      knot(146, Y(6432) + 3, 10, 2, 16);
    }
    // fishing boats under bright lamps drifting on the swell, a pleasure boat hung with red lanterns
    // gliding along the quay (live; their light pools stay painted on the water)
    for (const [x, u, kind] of [[24, 6480], [160, 6620], [40, 6900], [146, 6960], [100, 7120], [70, 6650, 'yakata']]) {
      const y = Y(u);
      if (kind === 'yakata') {
        const f = capture(x - 6, y - 1, 18, 9, () => {
          img.rect(x - 6, y, 18, 8, 0x5a3a24);
          img.rect(x - 5, y - 1, 16, 5, 0x3c3e46);
          img.rect(x - 4, y + 4, 14, 2, 0xffe0a0);
          for (let k = 0; k < 16; k += 3) {
            img.set(x - 5 + k, y + 3, 0xff5a30);
            glow(x - 5 + k, y + 3, 0xff5a30);
          }
        });
        pool(x + 3, y + 4, 16, 0xff8040, 0.25);
        kit.path([[x - 30, u - 3], [x + 40, u - 3]], [f], { sp: 3, mode: 'pp', hold: 4, turn: 'none' });
      } else {
        const f = capture(x, y, 5, 10, () => {
          img.rect(x, y, 5, 10, 0xe8e4dc);
          img.rect(x + 1, y + 3, 3, 3, 0x3a4a5a);
          glow(x + 2, y + 1, 0xfff8d0);
          glow(x + 2, y + 2, 0xfff0c0, 0.8);
        });
        pool(x + 2, y + 2, 14, 0xfff0c0, 0.35);
        kit.wander(x + 2, u - 5, 5, 3, [f], { n: 1, sp: 1.2, idle: 0.4, turn: 'none' });
      }
    }
  }

  // ------------------------------------------------------------ compose
  for (const o of objects) o.shadow?.();
  objects.sort((a, b) => a.y - b.y);
  for (const o of objects) o.draw();

  // turret pads: a lacquered shop stand where a beckoning cat sits
  for (const p of pads) {
    const y = Y(p.u);
    for (let yy = y - 9; yy <= y + 9; yy++)
      for (let xx = p.x - 9; xx <= p.x + 9; xx++) {
        const d = Math.hypot(xx + 0.5 - p.x, yy + 0.5 - y);
        if (d > 9) continue;
        img.set(xx, yy, d > 7.6 ? C.gold : d > 6.6 ? 0x5a1a14 : (xx + yy) % 4 === 0 ? 0xa83020 : 0xc03a28);
      }
  }

  // ------------------------------------------------------------ texture for what is still drawn in whole blocks
  // (lawns, gravel, the moats and ponds, plain walls and roofs): each uniform 3 x 3 block gets the grain of
  // its material, worked out from its colour: blades of grass and their shade, gravel's specks, ripples
  // catching the light on water, a fleck of weathering on stone and plaster
  {
    const d = img.hi.data;
    const FW = W * S;
    for (let y = 0; y < L; y++)
      for (let x = 0; x < W; x++) {
        const p0 = ((y * S) * FW + x * S) * 4;
        if (!d[p0 + 3]) continue;
        const r0 = d[p0];
        const g0 = d[p0 + 1];
        const b0 = d[p0 + 2];
        let same = true;
        for (let j = 0; j < S && same; j++)
          for (let i = 0; i < S; i++) {
            const p = ((y * S + j) * FW + x * S + i) * 4;
            if (d[p] !== r0 || d[p + 1] !== g0 || d[p + 2] !== b0 || d[p + 3] !== 255) {
              same = false;
              break;
            }
          }
        if (!same) continue;
        const green = g0 > r0 + 12 && g0 > b0 + 4;
        const wet = b0 > r0 + 10 && g0 > r0 && b0 < 140 && g0 < 140;
        const sat = Math.max(r0, g0, b0) - Math.min(r0, g0, b0);
        for (let j = 0; j < S; j++)
          for (let i = 0; i < S; i++) {
            const X = x * S + i;
            const Yf = y * S + j;
            const h = hashPx(X, Yf, 61);
            let k = 1;
            if (green) {
              // blades: a lit tip over a shaded root, pairs of pixels down the slope of the lawn
              const blade = hashPx(X, Math.floor(Yf / 2), 62);
              k = blade < 0.22 ? (Yf % 2 ? 0.86 : 1.14) : h < 0.1 ? 0.92 : h > 0.93 ? 1.08 : 1;
            } else if (wet) {
              // ripples: short bright strokes across, darker troughs
              const rip = Math.sin(X * 0.9 + Yf * 0.25 + hashPx(Math.floor(X / 6), Yf, 63) * 3);
              k = rip > 0.92 ? 1.22 : rip < -0.9 ? 0.86 : 1;
            } else if (sat < 30) {
              k = h < 0.08 ? 0.9 : h > 0.95 ? 1.1 : 1; // (grey: specks of grit and weathering)
            } else k = h < 0.05 ? 0.93 : h > 0.97 ? 1.06 : 1;
            if (k === 1) continue;
            const p = (Yf * FW + X) * 4;
            d[p] = Math.min(255, d[p] * k);
            d[p + 1] = Math.min(255, d[p + 1] * k);
            d[p + 2] = Math.min(255, d[p + 2] * k);
          }
      }
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
  for (const pl of pools) applyPool(img, pl);
  for (const [x, y, c, a] of lights) img.light(x, y, c, a);
  for (const [X, Yy, c, a] of lightsFine) img.px(X, Yy, c, a);
  // Glico's illuminated running man beside Ebisu-bashi: blue board, red sun,
  // white running kit and the unmistakable raised arms. Draw after the night grade.
  {
    const x = 23;
    const y = Y(DOTONBORI[0] + 668);
    img.rect(x - 2, y - 2, 32, 57, 0x111526);
    img.rect(x, y, 28, 53, 0xe8f6ff);
    img.rect(x + 2, y + 2, 24, 40, 0x1259b5);
    img.disc(x + 14, y + 19, 10, 0xe63238);
    for (let i = 0; i < 3; i++) img.line(x + 3, y + 33 + i * 3, x + 24, y + 33 + i * 3, 0x80caff);
    img.disc(x + 14, y + 11, 3, 0xffd9b4);
    img.rect(x + 11, y + 15, 7, 12, 0xffffff);
    for (let k = 0; k < 3; k++) {
      img.line(x + 11, y + 17 + k, x + 5, y + 7 + k, 0xffffff);
      img.line(x + 17, y + 17 + k, x + 23, y + 7 + k, 0xffffff);
      img.line(x + 12 + k, y + 26, x + 9 + k, y + 37, 0xffffff);
      img.line(x + 16, y + 26 + k, x + 22, y + 29 + k, 0xffffff);
      img.line(x + 22, y + 29 + k, x + 23, y + 23 + k, 0xffffff);
    }
    img.rect(x + 12, y + 18, 5, 2, 0xe63238);
    // Compact 3x5 GLICO lettering on the white footer.
    const letters = ['111100101101111', '100100100100111', '111010010010111', '111100100100111', '111101101101111'];
    letters.forEach((glyph, i) => {
      for (let p = 0; p < 15; p++) if (glyph[p] === '1') img.set(x + 4 + i * 4 + p % 3, y + 45 + Math.floor(p / 3), 0xdb2638);
    });
    // Put the opaque board above animated facade lights, not only in the static strip.
    kit.loop(x - 2, U(y - 2), [kit.frame(img.crop(x - 2, y - 2, 32, 57))], { fps: 1, d: 2, fx: 0 });
  }
  // neon reflections dancing on the dark water near lit banks: the same streaks in two jittered frames
  // for each stretch of water, alternating (live)
  const streaks = new Map();
  for (const [x, y, c] of lights) {
    if (!W_(x, y + 3) || bayer(x, y) < 0.6) continue;
    const seg = Math.floor(y / 96);
    if (!streaks.has(seg)) streaks.set(seg, []);
    streaks.get(seg).push([x, y, c]);
  }
  for (const list of streaks.values()) {
    let x0 = W;
    let x1 = 0;
    let y0 = L;
    let y1 = 0;
    for (const [x, y] of list) {
      x0 = Math.min(x0, x - 1);
      x1 = Math.max(x1, x + 1);
      y0 = Math.min(y0, y + 2);
      y1 = Math.max(y1, y + 7);
    }
    const frames = [0, 1].map((f) => {
      const out = new HiCanvas(x1 - x0 + 1, y1 - y0 + 1, S, x0, y0);
      for (const [x, y, c] of list)
        for (let k = 2 + f; k < 7 + f; k += 2) {
          const xx = x + (f ? ((x * 7 + y * 3 + k) % 3) - 1 : 0);
          if (W_(xx, y + k)) out.set(xx, y + k, c, 0.25);
        }
      return kit.frame(out);
    });
    kit.loop(x0, U(y0), frames, { fps: 2.5, fx: 1 });
  }

  // the office towers of Umeda and Nakanoshima come alive at dusk: windows going dark and lighting up as
  // people leave or work late, here and there (live)
  {
    const fr = rng(5503);
    const byStretch = new Map();
    for (const [x, y] of lights) {
      const u = U(y);
      if (u < NAKANOSHIMA[0] || u > UMEDA[1] || fr() > 0.25) continue;
      const k = Math.floor(u / 256);
      if (!byStretch.has(k)) byStretch.set(k, []);
      byStretch.get(k).push([x, u]);
    }
    for (const [k, wins] of byStretch) {
      const dark = new HiCanvas(1, 1);
      dark.set(0, 0, 0x2a2c38);
      const f = kit.frame(tod.frame(dark, k * 256 + 128));
      kit.wave([f], wins.map(([x, u]) => [0, x, u, fr() * 20]), { w: 0.12, a0: 0, a1: 1, pw: 7, d: 0.05 });
    }
  }

  // ------------------------------------------------------------ depth: what is above the city, what is under its water
  {
    const dr = rng(5601);
    const SKY = 0.49; // (over the streets and rooftops, but under the turrets on the ground and all that flies: nothing here ever hides a target)
    // --- reflections: the banks mirrored in the water, drawn under the strip (so only the water shows them) and at
    // half the resolution, the rows nudged by the ripples
    {
      const REACH = 26;
      const dist = (x, y, dx, dy) => {
        for (let k = 1; k <= REACH; k++) if (!W_(x + dx * k, y + dy * k) && x + dx * k >= 0 && x + dx * k < W) return k;
        return 99;
      };
      const T = 40;
      for (const [u0, u1] of [[0, 1296], [1296, 1362], [1362, 1914], [1914, 1972], [DOTONBORI[0], DOTONBORI[1]], [PORT[1], L]]) {
        for (let ty = Y(u1); ty < Y(u0); ty += T)
          for (let tx = 0; tx < W; tx += T) {
            let any = 0;
            const frames = [0, 1].map((f) => {
              const out = new Raster(Math.ceil((T * S) / 2), Math.ceil((T * S) / 2));
              for (let j = 0; j < out.h; j++)
                for (let i = 0; i < out.w; i++) {
                  const X = tx * S + i * 2;
                  const Yy = ty * S + j * 2;
                  const x = Math.floor(X / S);
                  const y = Math.floor(Yy / S);
                  if (!W_(x, y)) continue;
                  const dN = dist(x, y, 0, -1);
                  const dW = dist(x, y, -1, 0);
                  const dE = dist(x, y, 1, 0);
                  const d = Math.min(dN, dW, dE);
                  if (d > REACH) continue;
                  const rip = Math.round(Math.sin(Yy * 0.42 + f * 2.6 + X * 0.03) * 2);
                  let SX = X + rip;
                  let SY = Yy;
                  if (d === dN) SY = 2 * (y - dN + 1) * S - Yy;
                  else if (d === dW) SX = 2 * (x - dW + 1) * S - X + rip;
                  else SX = 2 * (x + dE) * S - X + rip;
                  const q = img.rgbaPx(SX, SY);
                  if (!q || !q[3]) continue;
                  const a = 0.85 * (1 - d / (REACH + 1)) ** 0.7;
                  out.setRGBA(i, j, q[0] * 0.72, q[1] * 0.8, q[2] * 0.92, Math.round(255 * a));
                  any++;
                }
              return out;
            });
            if (any < 80) continue;
            kit.loop(tx, U(ty), frames.map((r) => kit.frame(r)), { fps: 2.5, d: -0.9, sc: 2 });
          }
      }
    }
    // --- over the streets: the expressway on its piers, its traffic running above the avenues; its shadow on the road
    {
      const pierAt = (x, u) => {
        const foot = Y(u) + 3;
        const pier = capture(x - 2, foot - 18, 10, 18, () => {
          for (let j = 0; j < 18 * S; j++)
            for (let i = 0; i < 12; i++) img.px(x * S + i, (foot - 18) * S + j, i < 2 ? 0xb0b0b4 : i < 5 ? 0x9a9a9e : i < 9 ? 0x80808a : 0x62626c);
          for (let i = -3; i < 15; i++) for (let j = 0; j < 4; j++) img.px(x * S + i, (foot - 18) * S + j, j === 0 ? 0xb8b8bc : 0x74747e);
        });
        kit.loop(x - 2, U(foot - 18), [pier], { fps: 1, d: 0.46 });
      };
      for (const u of [2350, 3550]) {
        for (let Yy = (Y(u) + 7) * S; Yy < (Y(u) + 13) * S; Yy++) for (let X = 0; X < W * S; X++) if (img.alphaPx(X, Yy)) img.tintPx(X, Yy, 0.68);
        for (const x of [12, 58, 118, 164]) pierAt(x, u);
        const deck = new HiCanvas(196, 16);
        for (let j = 0; j < 16 * S; j++)
          for (let i = 0; i < 196 * S; i++) {
            let c;
            if (j < 3) c = j === 0 ? 0xc8c8cc : 0xa8a8ae; // (the north parapet)
            else if (j < 36) {
              c = hashPx(i, j, 41) < 0.08 ? 0x4e4e58 : 0x44444e;
              if (j === 19 || j === 20) c = i % 18 < 10 ? 0xd8d0a0 : c; // (the dashes down the middle)
              if (j === 10 || j === 28) c = i % 12 < 6 ? 0x8a8a90 : c;
            } else if (j < 39) c = j === 36 ? 0xc8c8cc : 0xa8a8ae; // (the south parapet)
            else c = j < 42 ? 0x6a6a74 : (i % 18 < 2 ? 0x34343c : 0x54545e); // (the girder under it)
            deck.px(i, j, c);
          }
        for (let i = 12; i < 196 * S; i += 60) {
          for (let j = -6; j < 3; j++) deck.px(i, 3 + j, 0x8a8a92);
          for (let k = 0; k < 6; k++) deck.px(i + k, -3 + 3, 0x8a8a92);
          deck.px(i + 5, 0, u > 3000 ? 0xfff0c8 : 0xe0e0e0);
        }
        // the green sign gantry
        for (let i = 280; i < 330; i++) for (let j = 0; j < 12; j++) deck.px(i, 8 + j, j === 0 || j === 11 || i === 280 || i === 329 ? 0xf0f0f0 : 0x1e6a4a);
        for (let k = 0; k < 6; k++) for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) if (hashPx(k, i * 3 + j, u) < 0.6) deck.px(285 + k * 7 + i, 12 + j, 0xf0f0f0);
        tod.frame(deck, u);
        kit.loop(-8, u + 8, [kit.frame(deck)], { fps: 1, d: 0.475 });
        const car = (c, dir) => {
          const out = new HiCanvas(7, 4);
          for (let j = 1; j < 10; j++) for (let i = 0; i < 18; i++) if (!((i === 0 || i === 17) && (j === 1 || j === 9))) out.px(i, j, (i > 4 && i < 8) || (i > 11 && i < 14) ? 0x26303a : j < 3 ? scaleColor(c, 1.2) : j > 7 ? scaleColor(c, 0.7) : c);
          tod.frame(out, u);
          if (u > 3000) for (const j of [2, 8]) {
            out.px(dir > 0 ? 18 : -1, j, 0xfff4c8);
            out.px(dir > 0 ? 0 : 17, j, 0xff3a2a);
          }
          return kit.frame(out);
        };
        const CARS = [0xc8c8cc, 0x3a4a6a, 0xa83a2a, 0x2a2a30, 0xe0e0e0];
        for (const [lane, dir, sp] of [[3, 1, 38], [-3, -1, 32]])
          for (let k = 0; k < 3; k++)
            kit.path(dir > 0 ? [[-24, u + lane], [204, u + lane]] : [[204, u + lane], [-24, u + lane]], [car(dr.pick(CARS), dir)], { sp, turn: 'none', s0: (k + dr()) / 3, d: 0.48 });
      }
    }
    // --- strings of paper lanterns across the canal and of little flags across the avenues, hung above the traffic
    {
      const string = (w, u, lit, kind) => {
        const out = new HiCanvas(w, 8);
        const FW = w * S;
        const sag = (i) => Math.round(((i / FW - 0.5) ** 2 - 0.25) * -28);
        for (let i = 0; i < FW; i++) out.px(i, 3 + sag(i), 0x1a1418);
        for (let i = 6; i < FW - 4; i += kind === 'lantern' ? 11 : 7) {
          const y = 4 + sag(i);
          if (kind === 'lantern') {
            const c = (i >> 1) % 3 ? 0xe8452a : 0xf4e8c8;
            for (let j = 0; j < 7; j++) for (let k = -2; k <= 2; k++) if (!((j === 0 || j === 6) && Math.abs(k) === 2)) out.px(i + k, y + j, j === 0 || j === 6 ? 0x1a1418 : j % 2 ? c : scaleColor(c, 0.85));
          } else {
            const c = dr.pick([0xd83a2a, 0xe8c040, 0x3a6ad0, 0xf0f0e8, 0x3a9a5a]);
            for (let j = 0; j < 6; j++) for (let k = 0; k < 5 - j; k++) out.px(i + k, y + j, c);
          }
        }
        tod.frame(out, u);
        // (lit from within after dark: painted back over the grade)
        if (lit && kind === 'lantern')
          for (let i = 6; i < FW - 4; i += 11) {
            const y = 4 + sag(i);
            const c = (i >> 1) % 3 ? 0xff6a3a : 0xfff0c8;
            for (let j = 1; j < 6; j++) for (let k = -1; k <= 1; k++) out.px(i + k, y + j, j === 3 ? 0xffe8a0 : c);
          }
        return kit.frame(out);
      };
      const lit = string(64, 4300, true, 'lantern');
      for (let u = DOTONBORI[0] + 90; u < DOTONBORI[1] - 80; u += 54 + Math.floor(dr() * 24)) kit.loop(58, u, [lit], { fps: 1, d: 0.47 });
      const flags = [string(32, 3300, false, 'flag'), string(32, 3300, false, 'flag')];
      for (let u = SHINSEKAI[0] + 40; u < SHINSEKAI[1] - 20; u += 46 + Math.floor(dr() * 20)) kit.loop(74, u, [flags[Math.floor(dr() * 2)]], { fps: 1, d: 0.47 });
    }
    // --- in the air over the city: helicopters (with a searchlight by night) and their shadows on the streets, the
    // advertising airship, crows and pigeons by day, thin moonlit cloud by night
    {
      const heli = (spin, beam) => {
        const out = new HiCanvas(36, 36);
        const CX = 54;
        const CY = 18;
        if (beam)
          for (let j = 0; j < 80; j++)
            for (let i = -12 - j * 0.3; i <= 12 + j * 0.3; i++) {
              const a = 0.34 * (1 - j / 80) * (1 - Math.abs(i) / (13 + j * 0.3));
              if (a > 0.01) out.px(Math.round(CX + i), CY + 10 + j, 0xfff4d0, a);
            }
        for (let j = -4; j <= 4; j++) for (let i = -8; i <= 8; i++) if ((i / 8) ** 2 + (j / 4.2) ** 2 <= 1) out.px(CX + i, CY + j, j < -2 ? 0x5a6a88 : i > 3 && j < 2 ? 0x9ac8e0 : 0x2a3448); // (the cockpit's glass at the front)
        for (let i = 8; i < 24; i++) for (let j = -1; j <= 1; j++) out.px(CX - i, CY + j, j === -1 ? 0x4a5468 : 0x2a3448);
        for (let j = -4; j <= 4; j++) out.px(CX - 24, CY + j, 0x2a3448);
        for (let k = -18; k <= 18; k++) {
          const dx = spin ? k : Math.round(k * 0.3);
          const dy = spin ? Math.round(k * 0.18) : k;
          out.px(CX + dx, CY + dy - 1, 0xc8d0d8, 0.8);
        }
        if (beam) out.px(CX, CY + 5, 0xff3a2a);
        return out;
      };
      const flyer = (u, sp, night, s0) => {
        const fs = [heli(0, night), heli(1, night)].map((r) => {
          if (!night) tod.frame(r, u);
          return kit.frame(r);
        });
        const pts = [[-40, u], [220, u - 60]];
        kit.path(pts, fs, { sp, turn: 'flip', fps: 12, s0, z: 0.3, d: SKY });
        const sh = new HiCanvas(14, 6);
        for (let j = 0; j < 18; j++) for (let i = 0; i < 42; i++) if (((i - 21) / 21) ** 2 + ((j - 9) / 9) ** 2 <= 1) sh.px(i, j, 0x000000, 0.28);
        kit.path(pts.map(([x, uu]) => [x + 16, uu - 24]), [kit.frame(sh)], { sp, turn: 'none', fps: 1, s0, d: 0.44 });
      };
      for (const [u, s0] of [[2180, 0.2], [2840, 0.7]]) flyer(u, 26, false, s0);
      for (const [u, s0] of [[4050, 0.1], [4800, 0.55], [5500, 0.3], [6200, 0.8]]) flyer(u, 24, true, s0);
      const airship = (u, s0, night) => {
        const out = new HiCanvas(52, 20);
        const CX = 72;
        const CY = 28;
        for (let j = -24; j <= 24; j++)
          for (let i = -66; i <= 66; i++) {
            const q = (i / 66) ** 2 + (j / 24) ** 2;
            if (q > 1) continue;
            let c = j < -10 ? 0xe8e8ec : j < 4 ? 0xc8c8d0 : 0x8a8a98;
            if (Math.abs(j) < 6 && Math.abs(i) < 40) c = (Math.floor((i + 40) / 3) + Math.floor((j + 6) / 3)) % 3 ? 0x141420 : night ? 0xff5ac8 : 0xe8452a; // (its lit ribbon of adverts)
            if (i % 22 === 0 && Math.abs(j) >= 6) c = scaleColor(c, 0.9);
            out.px(CX + i, CY + j, c);
          }
        for (const s of [-1, 1]) for (let k = 0; k < 16; k++) for (let i = 0; i < 16 - k; i++) out.px(CX - 60 - i, CY + s * (16 + k), 0x7a7a88);
        for (let i = -12; i <= 12; i++) for (let j = 25; j < 31; j++) out.px(CX + i, CY + j, j === 25 ? 0x4a4a58 : 0x2a2a38);
        tod.frame(out, u);
        if (night) for (let i = -38; i <= 38; i += 3) for (let j = -5; j <= 5; j += 3) if ((i + j + 400) % 9 === 0) out.px(CX + i, CY + j, 0xff8ae0);
        const fr = kit.frame(out);
        const pts = [[-70, u], [250, u + 30]];
        kit.path(pts, [fr], { sp: 6, turn: 'none', fps: 1, s0, z: 0.42, d: SKY });
        const sh = new HiCanvas(52, 18);
        for (let j = 0; j < 54; j++) for (let i = 0; i < 156; i++) if (((i - 78) / 76) ** 2 + ((j - 27) / 26) ** 2 <= 1) sh.px(i, j, 0x000000, 0.24);
        kit.path(pts.map(([x, uu]) => [x + 26, uu - 34]), [kit.frame(sh)], { sp: 6, turn: 'none', fps: 1, s0, d: 0.43 });
      };
      airship(2500, 0.35, false);
      airship(4400, 0.5, true);
      airship(5900, 0.15, true);
      const bird = (f) => {
        const out = new HiCanvas(4, 3);
        const w = f ? 1 : -1;
        for (const [i, j] of [[5, 3], [6, 3], [5, 4], [6, 4], [4, 3 + w], [7, 3 + w], [3, 3 + 2 * w], [8, 3 + 2 * w], [2, 3 + 2 * w], [9, 3 + 2 * w]]) out.px(i, j, 0x1a1a22);
        return kit.frame(tod.frame(out, 800));
      };
      const birds = [bird(0), bird(1)];
      for (const [u, s0] of [[260, 0.1], [820, 0.6], [1500, 0.3], [2050, 0.8], [3000, 0.45]])
        kit.path([[-20, u], [200, u + 40]], birds, { sp: 17, n: 6, gap: 8, turn: 'flip', fps: 5, s0, z: 0.38, d: SKY });
      const cloudF = [0, 1, 2].map((k) => {
        const w = 70 + k * 16;
        const h = 34 + k * 8;
        const out = new HiCanvas(w, h);
        for (let Yy = 0; Yy < h * S; Yy += 1)
          for (let X = 0; X < w * S; X += 1) {
            const e = Math.max(0, 1 - Math.hypot((X / (w * S) - 0.5) * 2, (Yy / (h * S) - 0.5) * 2));
            const v = fbm(X / S, Yy / S, { seed: 5801 + k, scale: 12, octaves: 3 }) * e * 2.2 - 0.34;
            if (v > 0) out.px(X, Yy, 0xa8b4d8, Math.min(0.42, v * 0.75));
          }
        return kit.frame(out);
      });
      for (let u = SHINSEKAI[1] - 60; u < L - 60; u += 110 + Math.floor(dr() * 110)) kit.loop(-30 + Math.floor(dr() * 140), u + 40, [cloudF[Math.floor(dr() * 3)]], { fps: 1, z: 0.55, ax: 90, d: SKY + 0.005, fx: 1 });
    }
  }

  // ------------------------------------------------------------ live: glints dancing on the rivers, the canal and the
  // bay; gulls wheeling over the harbour; the clouds' shadows drifting over the city, soft-edged
  {
    const gr = rng(5601);
    const glint = [1, 2, 3, 2, 1].map((g) => {
      const r = new HiCanvas(2, 2);
      for (let k = -g; k <= g; k++) {
        r.px(3 + k, 3, 0xf4fbff, 1 - Math.abs(k) / (g + 1));
        if (Math.abs(k) < g) r.px(3, 3 + k, 0xf4fbff, 0.7 - Math.abs(k) / (g + 1));
      }
      return kit.frame(r);
    });
    const spots = [];
    for (let k = 0; k < 900 && spots.length < 160; k++) {
      const x = 2 + gr() * (W - 4);
      const y = gr() * L;
      if (W_(Math.floor(x), Math.floor(y)) && W_(Math.floor(x) + 1, Math.floor(y) + 1)) spots.push([x, U(y), 2, 2]);
    }
    for (let i = 0; i < spots.length; i += 20) kit.spot(spots.slice(i, i + 20), glint, { rate: 1.2, fps: 10 });
    const gull = (f) => {
      const r = new HiCanvas(4, 2);
      const wing = f ? [[0, 2], [1, 1], [2, 1], [3, 2], [5, 2], [6, 1], [7, 1], [8, 2]] : [[0, 1], [1, 2], [2, 2], [3, 2], [5, 2], [6, 2], [7, 2], [8, 1]];
      for (const [i, j] of wing) r.px(i + 1, j + 1, 0xf4f4f0);
      r.px(5, 2, 0xd8d8d0);
      r.px(5, 3, 0x9a9a92);
      return kit.frame(r);
    };
    for (const [x, u] of [[90, 6720], [130, 6950], [70, 7080]]) kit.wander(x, u, 30, 24, [gull(0), gull(1)], { n: 3, sp: 14, idle: 0, turn: 'flip', fps: 3, d: 1.2 });
  }
  for (const [i, w, h, lobes, seed] of [
    [0, 96, 56, [[30, 30, 26, 20], [56, 24, 30, 20], [74, 34, 20, 16]], 41],
    [1, 80, 44, [[26, 22, 22, 16], [52, 20, 24, 17]], 57],
  ]) {
    const out = new HiCanvas(w, h);
    for (let FYr = 0; FYr < h * S; FYr++)
      for (let FXr = 0; FXr < w * S; FXr++) {
        const x = FXr / S;
        const y = FYr / S;
        let v = 0;
        for (const [cx, cy, rx, ry] of lobes) v = Math.max(v, 1 - Math.hypot((x - cx) / rx, (y - cy) / ry));
        v += (fbm(x, y, { seed, scale: 14, octaves: 4 }) - 0.5) * 0.35;
        const a = Math.max(0, Math.min(1, (v - 0.02) / 0.22));
        if (a > 0) out.px(FXr, FYr, 0x000000, a);
      }
    kit.frame(out, `cshadow_${i}`);
  }

  const chunks = [];
  for (let i = 0; i < CHUNKS; i++) chunks.push(img.crop(0, i * CHUNK, W, CHUNK));
  return { strip: img.hi, chunks, props: kit.pack(), meta: { width: W, artScale: S, chunkHeight: CHUNK, chunks: CHUNKS, length: L, tint: tintTable(L, tod.white) } };
}
