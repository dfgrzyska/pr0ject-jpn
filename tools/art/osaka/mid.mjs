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
          img.set(x, Y(u), path ? rampColor(C.gravel, 0.6, x, Y(u)) : rand() < 0.5 ? rand.pick([0xe83a5a, 0xf08ab0, 0xf4e0a0, 0xd02a3a, 0xffffff, 0xff7a6a]) : 0x2e5a2a);
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
              img.px(X, FYr, 0xb8b8c0);
              img.px(X - sd, FYr, 0x9a9aa0);
              img.px(X - 2 * sd, FYr, 0x6a6a72);
              if (FYr % 24 === 0) glowPx(X, FYr, 0xfff0c0);
              const XI = Math.round(CXf + sd * hw * 0.45);
              img.px(XI, FYr, 0x7a7a82);
            }
            const k = (FYr - (top + 24) * S) % 30;
            img.px(Math.round(CXf - hw + (k / 30) * hw * 2), FYr, 0x6a6a72);
            img.px(Math.round(CXf + hw - (k / 30) * hw * 2), FYr, 0x6a6a72);
            if (k < 2) for (let X = Math.round(CXf - hw); X <= CXf + hw; X++) img.px(X, FYr, k ? 0x5a5a62 : 0x8a8a92);
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
        pool(x + 18, y + 14, 20, 0xff6040, 0.4);
      } else if (kind === 'ball') {
        for (let k = 0; k < 3; k++) {
          img.disc(x + 8 + k * 10, y + 12, 5, 0xb87a3a);
          img.disc(x + 7 + k * 10, y + 11, 2, 0xd8a060);
          img.line(x + 4 + k * 10, y + 10, x + 12 + k * 10, y + 14, 0xf4f0e0);
          img.set(x + 8 + k * 10, y + 9, 0x3a8a3a);
        }
        pool(x + 18, y + 12, 18, 0xffb040, 0.35);
      } else if (kind === 'gyoza') {
        for (let k = 0; k < 3; k++) {
          img.ellipse(x + 8 + k * 9, y + 12, 5, 7, 0xf0dcb0);
          img.ellipse(x + 7 + k * 9, y + 11, 2, 4, 0xfff0d0);
          for (let j = 0; j < 4; j++) img.set(x + 6 + k * 9 + j, y + 6, 0xd8b880);
        }
        pool(x + 16, y + 12, 18, 0xffe080, 0.35);
      } else if (kind === 'sushi') {
        img.rect(x + 4, y + 10, 26, 8, 0xf8f4ec);
        img.rect(x + 2, y + 5, 30, 7, 0xff7a4a);
        for (let k = 0; k < 6; k++) img.set(x + 4 + k * 5, y + 8, 0xffffff);
        img.rect(x + 14, y + 5, 4, 13, 0x1a2a1a);
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
          const row = Math.floor(u / 5);
          const joint = u % 5 === 0 || (x + row * 7) % 9 === 0;
          img.set(x, Y(u), joint ? STONE[0] : rampColor(STONE, 0.35 + fbm(x, u, { seed: 61, scale: 3 }) * 0.5, x, Y(u)));
        }
    };
    const gravelGround = (x0, x1, u0, u1, seed = 62) => {
      for (let u = u0; u < u1; u++) for (let x = x0; x < x1; x++) if (!isRes(x, Y(u))) img.set(x, Y(u), rampColor(C.gravel, 0.2 + fbm(x, u, { seed, scale: 4 }) * 0.6, x, Y(u)));
    };
    /** Red and white paper lanterns hanging under eaves: the light of old Osaka streets. */
    const chochin = (x, y, c = 0xff5a30) => {
      img.set(x, y, c);
      img.set(x, y + 1, scaleColor(c, 0.7));
      glow(x, y, c, 0.9);
      glow(x, y + 1, 0xffd080, 0.6);
      pool(x, y + 2, 6, c, 0.22);
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
          for (let yy = y; yy < y + roofH; yy++) {
            const north = yy <= ridge;
            const t = north ? (ridge - yy) / Math.max(1, ridge - y) : (yy - ridge) / Math.max(1, y + roofH - 1 - ridge);
            const inset = hi * (1 - t);
            for (let xx = x; xx < x + w; xx++) {
              const lx = xx - x;
              const rx = x + w - 1 - xx;
              let c = lx < inset ? ramp[3] : rx < inset ? ramp[0] : north ? ramp[2] : ramp[1];
              if (lx < inset || rx < inset ? (yy - y) % 2 === 0 : (xx - x) % 2 === 0) c = scaleColor(c, 0.86);
              img.set(xx, yy, c);
            }
          }
          for (let xx = x + hi; xx < x + w - hi; xx++) img.set(xx, ridge, scaleColor(ramp[3], 1.15));
          for (let xx = x; xx < x + w; xx++) img.set(xx, y + roofH - 1, ramp[0]);
          img.clear(x, y);
          img.clear(x + w - 1, y);
          const fy = y + roofH;
          for (let yy = fy; yy < fy + faceH; yy++)
            for (let xx = x + 1; xx < x + w - 1; xx++) {
              const upper = yy - fy < Math.ceil(faceH / 2);
              let c = (xx - x) % 2 === 0 ? WOOD[0] : upper ? WOOD[2] : WOOD[1];
              if (yy === fy) c = 0x15100c;
              img.set(xx, yy, c);
            }
          // warm light through the lattice, the noren in the doorway, lanterns either side
          for (let xx = x + 2; xx < x + w - 2; xx += 2) glow(xx, fy + 1, C.warm, 0.35);
          img.rect(nx, fy + 1, 6, Math.max(1, faceH - 2), noren);
          img.rect(nx, fy + 1, 6, 1, scaleColor(noren, 1.3));
          chochin(nx - 2, fy + 1, lamp);
          chochin(nx + 7, fy + 1, lamp);
          if (sign) {
            // a vertical signboard, lit from inside
            const sx = x + w - 3;
            for (let j = 0; j < Math.max(3, faceH + 2); j++) glow(sx, fy - 1 + j, j % 2 ? 0xfff4d8 : 0xffe0a0, 0.85);
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
          for (let yy = y; yy < y + roofH; yy++) {
            const north = yy <= ridge;
            const t = north ? (ridge - yy) / Math.max(1, ridge - y) : (yy - ridge) / Math.max(1, y + roofH - 1 - ridge);
            const inset = hi * (1 - t);
            for (let xx = x; xx < x + w; xx++) {
              const lx = xx - x;
              const rx = x + w - 1 - xx;
              let c = lx < inset ? ramp[3] : rx < inset ? ramp[0] : north ? ramp[2] : ramp[1];
              if (lx < inset || rx < inset ? (yy - y) % 2 === 0 : (xx - x) % 3 === 0) c = scaleColor(c, 0.85);
              img.set(xx, yy, c);
            }
          }
          for (let xx = x; xx < x + w; xx++) {
            img.set(xx, y + roofH - 2, ramp[3]);
            img.set(xx, y + roofH - 1, ramp[0]);
          }
          img.clear(x, y);
          img.clear(x + w - 1, y);
          for (let xx = x + hi; xx < x + w - hi; xx++) img.set(xx, ridge, 0x1c1418);
          for (const gx of [x + hi, x + w - hi - 1]) {
            img.set(gx, ridge, C.gold);
            img.set(gx, ridge - 1, C.goldHi);
          }
          const fy = y + roofH;
          for (let yy = fy; yy < fy + faceH; yy++)
            for (let xx = x + 1; xx < x + w - 1; xx++) {
              const k = (xx - x - 1) % 8;
              const upper = yy - fy < Math.ceil(faceH / 2);
              let c = k < 2 ? (k === 0 ? VERM[0] : VERM[1]) : opt.gold ? (upper ? C.gold : 0xa87a22) : upper ? 0xe9e2d0 : VERM[1];
              if (yy === fy) c = 0x1a1210;
              img.set(xx, yy, c);
            }
          if (opt.door !== false) img.rect(x + Math.floor(w / 2) - 3, fy + 1, 6, faceH - 1, opt.gate ? 0x140c0a : 0x3a2418);
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
          if (e > 1) img.set(x, y, rampColor(STONE, 0.3 + fbm(x, y, { seed: 70, scale: 2 }) * 0.6, x, y));
          else {
            const n = fbm(x * 0.7, y * 1.5, { seed: 71, scale: 8, octaves: 2 });
            img.set(x, y, n > 0.7 && (x + y) % 2 ? 0x4a7a8a : rampColor([0x0e2028, 0x14303a, 0x1c3e4a, 0x2a5060], 0.1 + n * 0.5, x, y));
            water[y * W + x] = 1;
          }
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
        shadow: () => shadowRect(x + 1, y + 2, 4, 4, 0.55),
        draw: () => {
          img.rect(x, y + 2, 3, 3, STONE[1]);
          img.rect(x, y + 2, 3, 1, STONE[2]);
          img.rect(x - 1, y, 5, 2, STONE[0]);
          img.rect(x, y, 3, 1, STONE[2]);
          img.set(x + 1, y - 1, STONE[2]);
          if (lit) {
            img.set(x + 1, y + 3, 0xffd27a);
            glow(x + 1, y + 3, 0xffd27a);
            pool(x + 1, y + 4, 6, 0xffc070, 0.25);
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
      for (let r = 0; r < 3; r++)
        for (let k = 0; k < 12; k++) {
          const lx = tx + 4 + k * 3;
          const ly = Y(tu + 46) + r * 3;
          const c = (k + r) % 3 ? 0xffd040 : 0xff5a30;
          img.set(lx, ly, c);
          glow(lx, ly, c, 0.9);
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

    // ---- 2. Namba Yasaka: the shrine whose hall is a giant lion's head with a stage in its mouth
    {
      const [y0u, y1u] = YASAKA;
      gravelGround(0, W, y0u, y1u, 64);
      // the stone torii at the entrance, lanterns along the approach
      {
        const cx = 90;
        const y = Y(5186);
        for (const px of [cx - 14, cx + 14]) img.rect(px - 1, y + 3, 3, 10, STONE[2]);
        img.rect(cx - 19, y, 38, 2, STONE[1]);
        img.rect(cx - 19, y, 38, 1, STONE[3]);
        img.rect(cx - 16, y + 5, 32, 2, STONE[1]);
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
    }

    // ---- 3. Kuromon Ichiba: the covered market, "Osaka's kitchen"
    {
      const [k0, k1] = KUROMON;
      ishidatami(0, W, k0, k1);
      const ax0 = 64;
      const ax1 = 116;
      const m1 = 5560;
      // the stalls on both sides of the walk under the arcade
      for (let u = k0 + 6; u < m1; u += 12)
        for (const [sx0, sx1] of [[ax0 + 1, ax0 + 15], [ax1 - 15, ax1 - 1]]) {
          const kind = rand.pick(['fish', 'crab', 'tuna', 'uni', 'fruit', 'grill', 'fish', 'veg']);
          const y = Y(u + 10);
          img.rect(sx0, y, sx1 - sx0, 10, 0x6a4a30);
          img.rect(sx0, y, sx1 - sx0, 1, 0x8a6a48);
          for (let yy = y + 1; yy < y + 9; yy++)
            for (let xx = sx0 + 1; xx < sx1 - 1; xx++) {
              let c;
              if (kind === 'fish') c = (xx + yy) % 3 === 0 ? 0xc8d8e0 : (xx + yy * 2) % 5 === 0 ? 0x5a7a9a : 0xe8f0f4; // fish on ice
              else if (kind === 'crab') c = (xx + yy) % 4 < 2 ? 0xd83a2a : 0xf06a4a;
              else if (kind === 'tuna') c = (yy - y) % 3 === 0 ? 0xf0e0d8 : 0xb82a3a;
              else if (kind === 'uni') c = (xx - sx0) % 4 === 0 ? 0x8a6a40 : 0xf0a030;
              else if (kind === 'fruit') c = rand.pick([0xe83a3a, 0x6aaa3a, 0xf0b030, 0xf0e070, 0xd85a8a]);
              else if (kind === 'veg') c = rand.pick([0x4a8a3a, 0x6aaa4a, 0xe8e0c8, 0xd86a2a]);
              else c = (xx + yy) % 2 ? 0x2a2420 : 0x3a302a; // the grill
              img.set(xx, yy, c);
            }
          if (kind === 'grill') {
            for (let xx = sx0 + 2; xx < sx1 - 2; xx += 2) glow(xx, y + 5, 0xff7a20, 0.8);
            for (let j = 0; j < 6; j++) img.set(sx0 + 4 + (j % 3), y - j, 0x9a9aa8, 0.3);
          }
          glow(Math.round((sx0 + sx1) / 2), y + 1, 0xfff4d8, 0.8);
          pool((sx0 + sx1) / 2, y + 5, 8, 0xfff0d0, 0.25);
          reserveRect(sx0, y, sx1 - sx0, 10);
        }
      crowd(ax0 + 16, Y(m1), ax1 - ax0 - 32, m1 - k0, 140, true);
      // the arcade roof: a frame of arches and glass, the market's name in lights at the gate
      objects.push({
        y: Y(k0),
        draw: () => {
          for (let u = k0; u < m1; u++)
            for (let x = ax0; x < ax1; x++) {
              const rib = (u - k0) % 10 === 0;
              const edge = x === ax0 || x === ax1 - 1;
              const spine = x === Math.floor((ax0 + ax1) / 2);
              if (edge || rib || spine) img.set(x, Y(u), edge ? 0x8a8e96 : 0xb8c0c8, edge ? 1 : 0.7);
              else img.set(x, Y(u), 0xd8e4ee, 0.12);
            }
          for (let x = ax0 + 2; x < ax1 - 2; x++) glow(x, Y(k0 + 2), (x >> 2) % 2 ? 0xff5a30 : 0xffe060, 0.9);
          for (let x = ax0 + 2; x < ax1 - 2; x++) glow(x, Y(m1 - 2), (x >> 2) % 2 ? 0xff5a30 : 0xffe060, 0.9);
        },
      });
      reserveRect(ax0, Y(m1), ax1 - ax0, m1 - k0);
      // side streets: small shops and eateries with neon
      district(0, ax0 - 2, k0 + 4, m1, 'shop');
      district(ax1 + 2, W, k0 + 4, m1, 'shop');
      // the plaza at the north end: benches, a food truck, people eating
      for (const [bx, bu] of [[20, 5580], [146, 5598], [84, 5600]]) {
        img.rect(bx, Y(bu), 10, 2, WOOD[2]);
        img.rect(bx, Y(bu) + 2, 10, 1, WOOD[0]);
      }
      img.rect(80, Y(5576), 20, 9, 0xe8e0d0);
      img.rect(80, Y(5576), 20, 2, 0xd83a2a);
      img.rect(84, Y(5576) + 4, 8, 3, 0x3a5a7a);
      glow(83, Y(5576) + 5, 0xfff0c0);
      glow(96, Y(5576) + 5, 0xfff0c0);
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
        for (const px of [cx - 16, cx + 16]) img.rect(px - 1, y + 3, 3, 9, STONE[2]);
        img.rect(cx - 21, y, 42, 2, STONE[1]);
        img.rect(cx - 21, y, 42, 1, STONE[3]);
        img.rect(cx - 17, y + 5, 34, 2, STONE[1]);
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
          else c = d < 1 || d === 6 ? TILE[0] : (x + u) % 2 ? TILE[1] : TILE[2];
          img.set(x, Y(u), c);
        }
      for (let x = cx0; x < cx1; x += 4) glow(x, Y(cu0 + 5), 0xffb070, 0.5);
      reserveRect(cx0, Y(cu1), cx1 - cx0, 7);
      reserveRect(cx0, Y(cu0 + 7), cx1 - cx0, 7);
      reserveRect(cx0, Y(cu1), 7, cu1 - cu0);
      reserveRect(cx1 - 7, Y(cu1), 7, cu1 - cu0);
      gravelGround(cx0 + 7, cx1 - 7, cu0 + 7, cu1 - 7, 67);
      // raked lines in the gravel, a stone path from gate to gate
      for (let u = cu0 + 8; u < cu1 - 8; u += 3) for (let x = cx0 + 8; x < cx1 - 8; x++) if (Math.abs(x - 90) > 7 && !isRes(x, Y(u))) img.tint(x, Y(u), 0.88);
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
      ishidatami(82, 98, m0, 5998);
      // the great stone torii at the entrance
      {
        const cx = 90;
        const y = Y(5926);
        for (const px of [cx - 18, cx + 18]) img.rect(px - 2, y + 3, 4, 11, STONE[2]);
        img.rect(cx - 24, y, 48, 3, STONE[1]);
        img.rect(cx - 24, y, 48, 1, STONE[3]);
        img.rect(cx - 20, y + 6, 40, 2, STONE[1]);
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
              for (let x = 84; x <= 96; x++) {
                if (x === 84 || x === 96) img.set(x, y, u % 6 === 0 ? 0xf06a40 : VERM[0]); // the lacquered rails
                else img.set(x, y, near ? (u % 3 === 0 ? 0x7a4e32 : scaleColor(0xa8764a, 0.8 + t * 0.35)) : u % 2 ? 0x4a3022 : 0x5e3e2a); // the planks
              }
              img.set(83, y, VERM[2]);
              img.set(97, y, VERM[2]);
              if (u % 10 === 0) for (const x of [84, 96]) glow(x, y, 0xffd8a0, 0.6);
            }
            // its red sides mirrored in the still pond either side
            for (let u = b0 + 6; u < b1 - 6; u++) for (const x of [81, 99]) img.set(x, Y(u), VERM[1], 0.35);
          },
        });
        crowd(86, Y(6058), 8, 56, 14, true);
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
            const mid = x + Math.floor(w / 2);
            for (let yy = y; yy < y + h; yy++)
              for (let xx = x; xx < x + w; xx++) img.set(xx, yy, xx < mid ? (yy & 1 ? BARK[3] : BARK[2]) : yy & 1 ? BARK[1] : BARK[0]);
            img.rect(mid, y, 1, h, 0x1a1418);
            for (let yy = y + 2; yy < y + h - 1; yy += 5) img.rect(mid - 2, yy, 5, 2, C.gold);
            for (const yy of [y - 1, y + h]) {
              img.line(mid - 4, yy - 3, mid, yy, 0x3a2a24);
              img.line(mid + 4, yy - 3, mid, yy, 0x3a2a24);
              img.set(mid - 4, yy - 3, C.gold);
              img.set(mid + 4, yy - 3, C.gold);
            }
            for (let yy = y + h; yy < y + h + 7; yy++)
              for (let xx = x + 1; xx < x + w - 1; xx++) img.set(xx, yy, (xx - x) % 6 < 2 ? VERM[(xx - x) % 6] : yy - y - h < 3 ? 0xe9e2d0 : VERM[1]);
            img.rect(mid - 2, y + h + 2, 4, 5, 0x2a1810);
            glow(mid - 3, y + h + 2, 0xffd8a0);
            glow(mid + 3, y + h + 2, 0xffd8a0);
            pool(mid, y + h + 8, 14, 0xffc080, 0.25);
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
        for (let u = fu0; u < fu1; u++) {
          img.set(fx0, Y(u), u % 4 ? VERM[0] : 0x1a1418);
          img.set(fx1, Y(u), u % 4 ? VERM[1] : 0x1a1418);
        }
        for (let x = fx0; x <= fx1; x++) if (Math.abs(x - (fx0 + fx1) / 2) > 3) img.set(x, Y(fu0), x % 4 ? VERM[0] : 0x1a1418);
      }
      for (let k = 0; k < 24; k++) {
        const x = rand() * W;
        const u = 6076 + rand() * 130;
        if (!anyRes(x - 4, Y(u) - 4, 8, 8)) tree(rand() < 0.6 ? 'broadleaf' : 'pine', x, Y(u), 4 + rand() * 3);
      }
      crowd(70, Y(6200), 30, 120, 30, false);
    }

    // ---- 6. the Tempozan waterfront: the Ferris wheel, the aquarium, the harbour village, the quay
    {
      ishidatami(0, W, SUMI[1], p1);
      // a fountain plaza between the turret stands, its jets lit from below
      {
        const fx = 90;
        const fy = Y(6316);
        img.disc(fx, fy, 12, STONE[3]);
        img.disc(fx, fy, 10, 0x1c3e4a);
        img.disc(fx, fy, 3, STONE[2]);
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
      img.set(90, Y(6293), 0xffe060);
      glow(90, Y(6293), 0xffe060, 0.6);
      // Tempozan Ferris wheel: a giant ring of coloured lights. Live: the spokes turn, the gondolas go round,
      // the colours chase round the ring
      {
        const cx = 40;
        const cy = Y(6262);
        objects.push({
          y: cy + 36,
          shadow: () => shadowRect(cx - 4, cy + 30, 30, 6, 0.5),
          draw: () => {
            img.rect(cx - 6, cy + 28, 12, 8, 0x8a8a90);
            img.line(cx - 10, cy + 34, cx, cy, 0x7a7a84);
            img.line(cx + 10, cy + 34, cx, cy, 0x7a7a84);
            pool(cx, cy, 36, 0xff70c0, 0.3);
          },
        });
        const spokes = [0, 1, 2].map((s) =>
          capture(cx - 29, cy - 29, 59, 59, () => {
            for (let k = 0; k < 24; k++) {
              const a = (k / 24) * Math.PI * 2 + (s / 3) * ((Math.PI * 2) / 24);
              img.line(cx, cy, Math.round(cx + Math.cos(a) * 28), Math.round(cy + Math.sin(a) * 28), 0x6a6a74);
            }
            img.disc(cx + 0.5, cy + 0.5, 3, 0xe8e4dc);
          }),
        );
        kit.loop(cx - 29, U(cy - 29), spokes, { fps: 1.5, ph: 0, d: 0.05 });
        const ring = [...Array(14)].map((_, s) =>
          capture(cx - 30, cy - 30, 61, 61, () => {
            for (let a = 0; a < Math.PI * 2; a += 0.025) glow(Math.round(cx + Math.cos(a) * 29), Math.round(cy + Math.sin(a) * 29), NEON[(Math.floor((a / (Math.PI * 2)) * 14) + s) % NEON.length]);
          }),
        );
        kit.loop(cx - 30, U(cy - 30), ring, { fps: 3, d: 0.06 });
        const gondola = capture(0, Y(6262), 3, 3, () => {
          img.rect(0, Y(6262), 3, 3, 0xd8dce4);
          glow(1, Y(6262) + 1, 0xfff0d0, 0.6);
        });
        kit.orbit(cx, U(cy) - 1, 30, [gondola], { n: 16, w: ((Math.PI * 2) / 24 / 3) * 1.5, d: 0.07 });
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
            img.rect(x, y, 64, 24, 0x3a4a6a);
            img.rect(x, y, 64, 1, 0x5a6a8a);
            img.rect(x + 6, y + 4, 52, 4, 0x2a5aa0);
            for (let yy = y + 24; yy < y + 36; yy++) for (let xx = x; xx < x + 64; xx++) img.set(xx, yy, Math.floor((xx - x) / 6 + (yy - y) / 4) % 3 === 0 ? 0xd8402a : Math.floor((xx - x) / 6) % 2 ? 0x2a5aa0 : 0x7ab8e0);
            img.rect(x + 8, y + 10, 48, 10, 0x5a7aa0);
            for (let xx = x + 10; xx < x + 54; xx += 3) glow(xx, y + 14, 0x9ad8ff);
            img.ellipse(x + 32, y + 30, 11, 3, 0x2a4a7a);
            for (let k = 0; k < 7; k++) img.set(x + 25 + k * 2, y + 30, 0xd8e8f8);
            pool(x + 32, y + 30, 30, 0x60a0ff, 0.3);
          },
        });
        reserveRect(x - 2, y - 2, 68, 40);
      }
      // the harbour village: a long low hall of shops, lit
      building(8, Y(6392), 164, 14, 9, { style: 'shop', roof: 0x7a6a5a, wall: 0xe8d8c0, awning: true, neon: true, items: ['ac', 'hut'] });
      // the promenade and the quay rail, lamps, strolling people
      for (let x = 0; x < W; x++) {
        img.set(x, Y(p1 - 4), x % 4 ? 0xb8bcc0 : 0x6a6e74);
        img.set(x, Y(p1 - 3), 0x4a4e54);
      }
      for (let x = 6; x < W; x += 18) {
        img.set(x, Y(p1 - 6), 0x3a3a40);
        glow(x, Y(p1 - 7), 0xfff0c8);
        pool(x, Y(p1 - 6), 12, C.lamp, 0.35);
      }
      // a row of yatai, the little food carts, along the promenade: red lanterns, curtains over the counters,
      // stools in front, steam off the pots (live)
      for (const [k, x] of [12, 48, 84, 120, 156].entries()) {
        const y = Y(6420);
        objects.push({
          y: y + 9,
          shadow: () => shadowRect(x + 2, y + 2, 16, 8, 0.6),
          draw: () => {
            img.rect(x, y, 16, 6, WOOD[2]);
            img.rect(x, y, 16, 1, WOOD[3]);
            img.rect(x + 1, y + 1, 14, 2, [0x8a2020, 0x2b3c78, 0x8a2020, 0x3a4a3a, 0x2b3c78][k]); // the noren over the counter
            for (let i = 0; i < 4; i++) img.set(x + 2 + i * 4, y + 3, 0xe8e0d0); // the curtain's slits
            img.rect(x + 1, y + 4, 14, 2, WOOD[1]);
            for (let i = 0; i < 3; i++) img.set(x + 3 + i * 5, y + 8, 0x3a3a40); // the stools
            glow(x - 1, y + 1, 0xff4a30);
            glow(x + 16, y + 1, 0xff4a30);
            pool(x + 8, y + 4, 10, 0xff7a40, 0.35);
          },
        });
        reserveRect(x - 2, y - 2, 20, 12);
        kit.emit(x + 8, 6420, stallSteam, { rate: 1.1, life: [1.2, 2], vy: 6, sx: 1, wf: 0.6, a: 0.4, tint: 1 });
      }
      crowd(4, Y(p1 - 8), 172, 26, 60, false);
      crowd(4, Y(6330), 172, 40, 40, false);
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
        const y = Y(6560);
        for (let x = 0; x < W; x++) {
          img.set(x, y, 0xe8504a);
          img.set(x, y + 7, 0xa8302a);
          for (let j = 1; j < 7; j++) img.set(x, y + j, (x + j) % 8 === 0 || (x - j) % 8 === 0 ? 0xc83a30 : j === 3 || j === 4 ? 0x3a3a42 : 0x5a1a18);
          if (x % 5 === 0) {
            glow(x, y, 0xfff0d0, 0.8);
            glow(x, y + 7, 0xffc070, 0.6);
          }
        }
        for (const tx of [40, 140]) {
          img.rect(tx - 2, y - 10, 5, 18, 0xc83a30);
          glow(tx, y - 11, 0xff3a2a);
        }
      },
    });
    for (const [x, u] of [[30, 6700], [150, 6820], [70, 7000], [130, 7080]]) {
      img.disc(x, Y(u), 2, 0xd8402a);
      glow(x, Y(u) - 1, 0xff6040);
      pool(x, Y(u), 8, 0xff6040, 0.3);
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
