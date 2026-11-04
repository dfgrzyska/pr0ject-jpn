// Middle layer (Hiroshima & Sacred Miyajima), seen from above in 3/4 pixel-art view:
//   1. u = 0..1430   — Hiroshima Castle (Rijō / Carp Castle) in its rectangular koi moat with wooden gate
//                      bridge, and Shukkeien miniature landscape garden with emerald pond & Kokokyo bridge.
//   2. u = 1430..2870 — Ota River delta (Motoyasu & Honkawa rivers) spanned by continuous road+tram bridges,
//                      downtown Hondōri covered arcade, steaming okonomiyaki yatai, green-and-cream Hiroden
//                      streetcars running uninterrupted into Miyajimaguchi Station & Ferry Terminal quay.
//   3. u = 2870..4520 — Hiroshima Bay / Seto Inland Sea: bamboo oyster rafts (kaki-ikada), pine reef islets,
//                      and Miyajima ferries cruising pier-to-pier with white wakes.
//   4. u = 4520..5900 — Sacred Miyajima: waterfront stone-lantern promenade with wandering sika deer, the
//                      vermilion Great Floating Torii (Ō-Torii) in the tidal cove, stilted Itsukushima Shrine
//                      corridors & Bugaku stage over water, and the Five-Story Pagoda (Gojūnotō).
//   5. u = 5900..7168 — Momijidani crimson Japanese maple valley (arched red bridge over a mountain stream,
//                      Miyajima Ropeway gondolas overhead) ascending to Mount Misen's granite summit and
//                      the Reikadō Hall of the 1,200-year Eternal Flame (Kiezu-no-hi) at Seto sunset.
//
// Coordinates: u = distance from the bottom of the strip (stage start), strip y = L - u.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Raster, fbm, rng, bayer, scaleColor, rgb } from '../../lib/raster.mjs';
import { RAMPS, crownPixels, rampColor } from '../nature.mjs';
import { PropKit, Window, puff, todGrade, tintTable, planTraffic } from '../props.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export const W = 180;
export const CHUNK = 512;
export const CHUNKS = 14;
export const L = CHUNK * CHUNKS; // 7168

const MOTOYASU = [1430, 1520];
const HONKAWA = [2280, 2370];
const QUAY_U = 2870;
const MIYAJIMA_U = 4520;
const COVE_END_U = 5310;
const STREAM = [6175, 6230];

const C = {
  grass: [0x3d6b34, 0x4d7e3e, 0x60904a, 0x76a25a],
  moss: [0x355c32, 0x46703c, 0x588448, 0x6e9856],
  sand: [0xa89c7e, 0xbcb090, 0xcfc2a2, 0xe0d4b6],
  wetSand: [0x6e7c74, 0x829086, 0x96a298],
  gravel: [0xa69c88, 0xb8ae98, 0xc8bea8, 0xd8ceb8],
  granite: [0x787a7e, 0x929498, 0xacaeaf, 0xc8cac8, 0xe0e0dc],
  asphalt: [0x3b3c42, 0x47484f, 0x53545c],
  tramBed: [0x585450, 0x68645e, 0x78746c],
  walk: [0x86888c, 0x96989a, 0xa6a8aa],
  paving: [0x928c82, 0xa29c90, 0xb2aca0],
  stone: [0x66645e, 0x7e7c74, 0x98948a, 0xb2aea2],
  ishi: [0x585650, 0x706e66, 0x8a867c, 0xa4a094, 0xbebaa8],
  moat: [0x1e4644, 0x285854, 0x346a64, 0x468078],
  pond: [0x1c4e48, 0x26625a, 0x34786c, 0x489082],
  vermilion: [0x8c1c16, 0xb8281e, 0xdc3828, 0xf4543c],
  wood: [0x583a22, 0x744e2e, 0x90643c, 0xac7c4e],
  hinoki: [0x7e5a34, 0x9c7244, 0xba8c56, 0xd4a86e],
  tileRoof: [0x2a2e36, 0x383d46, 0x484e58, 0x5e6470],
  plaster: [0xc8ccd0, 0xe2e4e4, 0xf6f6f2],
  roofs: [0x7c828c, 0x9a948c, 0x6e645a, 0x54606e, 0x8c5244, 0x627066, 0xaca498],
  walls: [0xdad2c2, 0xc6c4be, 0xbca892, 0xe2ded4, 0x9ca6b0, 0xcebea8],
  pine: [0x1e4028, 0x2a5434, 0x386a42, 0x4a7e50],
  momijiR: [0x7a1618, 0xa8221e, 0xd63424, 0xf25430],
  momijiO: [0x8e3214, 0xbc4c1c, 0xe46e24, 0xf89632],
  momijiY: [0x8e5c16, 0xb87e1e, 0xe0a628, 0xf8cc46],
  gold: 0xe8b830,
  lamp: 0xffb868,
};

const CARS = [0xe8e8ec, 0x2c3038, 0xc43a30, 0x3a609c, 0x9aa2aa, 0xe8d69c];

// Afternoon sunlight over Hiroshima -> golden Seto sea -> crimson-amber sunset on Mount Misen
const TOD = [
  [0, [1.0, 0.99, 0.95], 0xfff0d0, 0.03],
  [2800, [1.02, 0.96, 0.9], 0xffe0b0, 0.05],
  [4600, [1.04, 0.9, 0.8], 0xffb068, 0.08],
  [6000, [1.02, 0.82, 0.74], 0xff8848, 0.11],
  [L, [0.92, 0.72, 0.72], 0xd86048, 0.14],
];

const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function buildMid() {
  const stage = JSON.parse(readFileSync(join(root, 'src', 'data', 'stage7.json'), 'utf8'));
  const { mid: V, anchor } = stage.scroll;
  let img = new Raster(W, L);
  const rand = rng(7707);
  const Y = (u) => Math.round(L - u);
  const U = (y) => L - y;
  const reserved = new Uint8Array(W * L);
  const water = new Uint8Array(W * L);

  const isRes = (x, y) => x >= 0 && x < W && y >= 0 && y < L && reserved[Math.floor(y) * W + Math.floor(x)];
  const anyRes = (x0, y0, w, h) => {
    for (let y = Math.floor(y0); y < y0 + h; y++)
      for (let x = Math.max(0, Math.floor(x0)); x < Math.min(W, x0 + w); x++)
        if (isRes(x, y)) return true;
    return false;
  };
  const reserveRect = (x0, y0, w, h) => {
    for (let y = Math.max(0, Math.floor(y0)); y < Math.min(L, y0 + h); y++)
      for (let x = Math.max(0, Math.floor(x0)); x < Math.min(W, x0 + w); x++) reserved[y * W + x] = 1;
  };

  const objects = [];
  const lights = [];
  const pools = [];
  const kit = new PropKit(7717);
  const tod = todGrade(TOD, smooth);
  const dusk = (u) => smooth(3600, 6800, u);

  const stallSteam = [2, 3, 4].map((r) =>
    [0, 1].map((v) => kit.frame(puff(r, r * 31 + v, [0xb0b0b8, 0xd0d0d8, 0xebebf0, 0xffffff]))),
  );
  const incenseSmoke = [2, 3, 4].map((r) =>
    [0, 1].map((v) => kit.frame(puff(r, r * 43 + v, [0xc89878, 0xe4b890, 0xf8dcb8, 0xfff2dc]))),
  );

  const applyPool = (target, { x, y, r, c, k }) => {
    const [cr, cg, cb] = rgb(c);
    for (let yy = Math.floor(y - r); yy <= y + r; yy++)
      for (let xx = Math.floor(x - r); xx <= x + r; xx++) {
        const i = target.idx(xx, yy);
        if (i < 0 || !target.data[i + 3]) continue;
        const dd = Math.hypot(xx + 0.5 - x, yy + 0.5 - y) / r;
        if (dd >= 1) continue;
        const f = (1 - dd) ** 1.6 * k;
        target.data[i] = Math.min(255, target.data[i] + cr * f);
        target.data[i + 1] = Math.min(255, target.data[i + 1] + cg * f);
        target.data[i + 2] = Math.min(255, target.data[i + 2] + cb * f);
      }
  };

  const capture = (x0, y0, w, h, draw, opt = {}) => {
    const keep = img;
    const nl = lights.length;
    const np = pools.length;
    img = new Window(x0, y0, w, h);
    draw();
    const out = img;
    img = keep;
    const lit = lights.splice(nl);
    const cast = opt.pools ? pools.slice(np) : pools.splice(np);
    tod.frame(out, opt.u ?? U(y0 + h / 2));
    for (const pl of cast) applyPool(out, pl);
    for (const [x, y, c, a] of lit) out.set(x, y, c, a);
    return kit.frame(out);
  };

  const glow = (x, y, c, a = 1) => lights.push([Math.round(x), Math.round(y), c, a]);
  const pool = (x, y, r, c, k = 0.45) => pools.push({ x, y, r, c, k });
  const shadowRect = (x, y, w, h, f = 0.58) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) img.tint(x + i, y + j, f);
  };
  const fill = (x0, y0, w, h, ramp, seed, scale = 5) => {
    for (let y = Math.floor(y0); y < y0 + h; y++)
      for (let x = Math.floor(x0); x < x0 + w; x++)
        img.set(x, y, rampColor(ramp, 0.2 + fbm(x, y, { seed, scale, octaves: 2 }) * 0.65, x, y));
  };

  const pads = stage.waves
    .filter((w) => w.type === 'turret')
    .map((w) => ({ x: w.x, u: anchor + V * w.t + 10 }));
  for (const p of pads) reserveRect(p.x - 12, Y(p.u) - 12, 24, 24);

  // Reef islets in Hiroshima Bay under any bay turret pad (e.g. t = 90 -> u = 3130)
  const bayIslets = pads.filter((p) => p.u > QUAY_U + 40 && p.u < MIYAJIMA_U - 40);

  // ------------------------------------------------------------ 1. water mask & ground base
  const miyajimaCoastU = (x) => {
    // Western pier headland (x < 64) & eastern pine headland (x > 116) start around u = 4520;
    // between x = 64..116, the sacred tidal cove indents to u = 5240!
    if (x >= 64 && x <= 116) {
      const t = 1 - ((x - 90) / 28) ** 2;
      return Math.round(4520 + t * (COVE_END_U - 4520));
    }
    const wob = fbm(x, 0, { seed: 701, scale: 18 }) * 34;
    return Math.round(4510 + wob);
  };

  const isWater = (x, u) => {
    // Two Ota River delta branches running cleanly edge-to-edge
    if ((u >= MOTOYASU[0] && u < MOTOYASU[1]) || (u >= HONKAWA[0] && u < HONKAWA[1])) return true;
    // Hiroshima Bay between mainland seawall (QUAY_U) and Miyajima's coastline
    if (u >= QUAY_U && u < miyajimaCoastU(x)) {
      // Mainland Ferry Pier (x = 84..104, u = 2870..3015)
      if (u < 3015 && x >= 84 && x <= 104) return false;
      // Miyajima Ferry Pier (x = 26..44, u = 4390..4540)
      if (u >= 4390 && x >= 26 && x <= 44) return false;
      // Craggy Seto reef islets under bay turrets
      for (const isl of bayIslets) {
        const n = fbm(x, L - u, { seed: 709, scale: 6 }) * 3.5;
        if (Math.hypot(x - isl.x, u - isl.u) < 14.5 + n) return false;
      }
      return true;
    }
    // Momijidani mountain stream running edge-to-edge across the maple valley
    if (u >= STREAM[0] && u < STREAM[1]) {
      const bend = Math.sin(x / 24) * 8;
      if (u >= STREAM[0] + bend && u < STREAM[1] + bend) return true;
    }
    // High summit sea-cliff vistas at extreme left/right edges of Mount Misen (u > 6720)
    if (u > 6720 && (x < 10 - fbm(x, L - u, { seed: 712, scale: 12 }) * 6 || x > W - 11 + fbm(x, L - u, { seed: 713, scale: 12 }) * 6))
      return true;
    return false;
  };

  for (let y = 0; y < L; y++) {
    const u = U(y);
    for (let x = 0; x < W; x++) {
      if (isWater(x, u)) {
        water[y * W + x] = 1;
        continue;
      }
      const n = 0.25 + fbm(x, y, { seed: 17, scale: 7, octaves: 2 }) * 0.65;
      if (u < QUAY_U) {
        img.set(x, y, rampColor(C.walk, n, x, y));
      } else if (u < MIYAJIMA_U) {
        // Bay piers or rocky reef islets
        const onPier = (u < 3020 && x >= 84 && x <= 104) || (u >= 4390 && x >= 26 && x <= 44);
        img.set(x, y, rampColor(onPier ? C.paving : C.granite, n, x, y));
      } else if (u < 5880) {
        // Sacred Miyajima: sandy-gravel shrine precincts & pine slopes
        const nearCove = x >= 52 && x <= 128 && u < COVE_END_U + 90;
        img.set(x, y, rampColor(nearCove ? C.sand : C.grass, n, x, y));
      } else if (u < 6560) {
        // Momijidani Park mossy forest floor
        img.set(x, y, rampColor(C.moss, n, x, y));
      } else {
        // Mount Misen weathered granite summit & pine crags
        const rock = fbm(x, y, { seed: 719, scale: 11, octaves: 3 });
        img.set(x, y, rampColor(rock > 0.42 ? C.granite : C.moss, n, x, y));
      }
    }
  }

  const W_ = (x, y) => x >= 0 && x < W && y >= 0 && y < L && water[y * W + x];

  // Stone embankments, beaches & white surf foam along water edges
  for (let y = 2; y < L - 2; y++) {
    const u = U(y);
    for (let x = 0; x < W; x++) {
      if (water[y * W + x]) {
        // White shoreline surf / shallow turquoise rim in the bay & Miyajima cove
        if (u >= QUAY_U - 2 && u <= COVE_END_U + 10) {
          const nearLand =
            !W_(x - 1, y) || !W_(x + 1, y) || !W_(x, y - 1) || !W_(x, y + 1) ||
            !W_(x - 2, y) || !W_(x + 2, y) || !W_(x, y - 2) || !W_(x, y + 2);
          if (nearLand) {
            const immediate = !W_(x - 1, y) || !W_(x + 1, y) || !W_(x, y - 1) || !W_(x, y + 1);
            img.set(x, y, immediate ? 0xdff6f8 : 0x4ca8b4, immediate ? 0.85 : 0.45);
          }
        }
        continue;
      }
      const edge = W_(x, y - 1) || W_(x, y + 1) || W_(x - 1, y) || W_(x + 1, y);
      if (!edge) continue;
      if (u >= MIYAJIMA_U - 10 && u <= COVE_END_U + 10 && x >= 56 && x <= 124) {
        img.set(x, y, C.wetSand[(x + y) % 3]);
      } else {
        img.set(x, y, C.stone[(x + y) % 3 === 0 ? 1 : 2]);
        if (!W_(x, y) && W_(x, y + 1)) img.set(x, y + 1, (x >> 1) % 2 ? C.stone[0] : C.stone[1]);
      }
    }
  }

  // ------------------------------------------------------------ 2. strict-topology roads, tramways & bridges
  // West Boulevard (cx = 34, hw = 10): carries car lanes + double Hiroden streetcar tracks continuously u = 0..2700!
  // East Avenue   (cx = 148, hw = 6): carries two-way avenue continuously u = 0..2700!
  const WEST_CX = 34;
  const WEST_HW = 10;
  const EAST_CX = 148;
  const EAST_HW = 6;

  const tramRoadPx = (x, y, overWater = false) => {
    if (W_(x, y) && !overWater) return;
    const d = x + 0.5 - WEST_CX;
    const a = Math.abs(d);
    let c;
    if (a > WEST_HW + 0.5) c = rampColor(C.paving, fbm(x, y, { seed: 33, scale: 3 }), x, y);
    else if (a > WEST_HW - 0.5) c = 0x8e9094;
    else if (a <= 4.6) {
      // Dedicated Hiroden stone-set tramway bed + 4 continuous steel rails!
      c = rampColor(C.tramBed, fbm(x, y, { seed: 35, scale: 4 }), x, y);
      if (y % 3 === 0 && a <= 4.0) c = scaleColor(c, 0.86); // wooden/concrete sleepers
      // Southbound track rails (x = 30, 33) & Northbound track rails (x = 35, 38)
      if (x === 30 || x === 33 || x === 35 || x === 38) c = 0xc6ced6;
    } else {
      c = rampColor(C.asphalt, fbm(x, y, { seed: 31, scale: 4, octaves: 2 }), x, y);
    }
    img.set(x, y, c);
  };

  const roadPx = (x, y, across, hw, lanes = true, overWater = false) => {
    if (W_(x, y) && !overWater) return;
    const a = Math.abs(across);
    let c;
    if (a > hw + 0.5) c = rampColor(C.paving, fbm(x, y, { seed: 33, scale: 3 }), x, y);
    else if (a > hw - 0.5) c = 0x8a8a8e;
    else c = rampColor(C.asphalt, fbm(x, y, { seed: 31, scale: 4, octaves: 2 }), x, y);
    if (lanes && a < 0.6 && hw >= 5 && Math.floor(y / 3) % 2 === 0) c = 0xdad6c8;
    img.set(x, y, c);
  };

  // Paint East-West cross streets FIRST (all edge-to-edge x = 0..180 for 100% continuous topology)
  const CROSS_STREETS = [
    [145, 5],
    [718, 4],
    [1380, 4],
    [1570, 4],
    [2215, 4],
    [2430, 4],
    [2700, 5], // Coastal Route 2 along Miyajimaguchi
  ];
  for (const [uc, hw] of CROSS_STREETS) {
    for (let u = Math.floor(uc - hw - 2); u <= uc + hw + 1; u++)
      for (let x = 0; x < W; x++) roadPx(x, Y(u), u + 0.5 - uc, hw, true);
    reserveRect(0, Y(uc + hw + 3), W, hw * 2 + 6);
  }

  // Paint North-South avenues continuously u = 0..2705 (merging into Route 2 at u = 2700)
  for (let u = 0; u <= 2705; u++) {
    const y = Y(u);
    for (let x = WEST_CX - WEST_HW - 2; x <= WEST_CX + WEST_HW + 1; x++) tramRoadPx(x, y, false);
    for (let x = EAST_CX - EAST_HW - 2; x <= EAST_CX + EAST_HW + 1; x++) roadPx(x, y, x + 0.5 - EAST_CX, EAST_HW, true, false);
  }
  reserveRect(WEST_CX - WEST_HW - 3, Y(2845), WEST_HW * 2 + 6, 2845);
  reserveRect(EAST_CX - EAST_HW - 3, Y(2706), EAST_HW * 2 + 6, 2706);

  // Clean intersection boxes (so sidewalks don't cut across cross-streets, while Hiroden rails run straight through!)
  for (const [uc, hw] of CROSS_STREETS) {
    for (let u = uc - hw; u <= uc + hw; u++) {
      const y = Y(u);
      for (let x = WEST_CX - WEST_HW - 2; x <= WEST_CX + WEST_HW + 1; x++) {
        img.set(x, y, rampColor(C.asphalt, fbm(x, y, { seed: 31, scale: 4 }), x, y));
        if (x === 30 || x === 33 || x === 35 || x === 38) img.set(x, y, 0xc6ced6);
      }
      for (let x = EAST_CX - EAST_HW - 2; x <= EAST_CX + EAST_HW + 1; x++) {
        if (u < 2700 + hw) img.set(x, y, rampColor(C.asphalt, fbm(x, y, { seed: 31, scale: 4 }), x, y));
      }
    }
    // Zebra crossings just outside each intersection
    for (const [cx, chw] of [[WEST_CX, WEST_HW], [EAST_CX, EAST_HW]]) {
      for (const s of [-1, 1]) {
        if (uc === 2700 && s === 1 && cx === EAST_CX) continue; // T-junction at Route 2
        const u0 = uc + s * (hw + 3);
        for (let k = 0; k < 3; k++)
          for (let x = cx - chw + 1; x <= cx + chw - 1; x++)
            if (x % 2 === 0 && !(cx === WEST_CX && (x === 30 || x === 33 || x === 35 || x === 38)))
              img.set(x, Y(u0 + s * k), 0xe8e8e0);
      }
    }
  }

  // Hiroden tramway continues north from Route 2 (u = 2700) straight into Miyajimaguchi Station terminal (u = 2700..2820)!
  for (let u = 2700; u <= 2820; u++) {
    const y = Y(u);
    for (let x = 28; x <= 40; x++) {
      let c = rampColor(C.tramBed, fbm(x, y, { seed: 35, scale: 4 }), x, y);
      if (y % 3 === 0) c = scaleColor(c, 0.86);
      if (x === 30 || x === 33 || x === 35 || x === 38) c = 0xc6ced6;
      img.set(x, y, c);
    }
  }
  // Track-end red buffer stops inside Miyajimaguchi Station
  for (const rx of [30, 31, 32, 33, 35, 36, 37, 38]) img.set(rx, Y(2821), 0xd83224);

  // Bridges carrying West Tram Boulevard & East Avenue across BOTH Ota River delta branches!
  const makeBridge = (cx, hw, r0, r1, withTram) => {
    const u0 = r0 - 4;
    const u1 = r1 + 4;
    const x0 = cx - hw - 3;
    const x1 = cx + hw + 2;
    const deck = () => {
      for (let u = u0; u <= u1; u++) {
        const y = Y(u);
        for (let x = x0; x <= x1; x++) {
          if (x === x0 || x === x1) img.set(x, y, u % 4 ? C.stone[2] : C.stone[3]);
          else if (x === x0 + 1 || x === x1 - 1) img.set(x, y, C.paving[1]);
          else if (withTram) tramRoadPx(x, y, true);
          else roadPx(x, y, x + 0.5 - cx, hw, true, true);
        }
        if (u % 16 === 0) {
          for (const px of [x0, x1]) {
            img.set(px, y, 0x3a3e46);
            glow(px, y - 1, 0xfff0c8, 0.85);
          }
        }
      }
    };
    // Live bridge deck at d: 0.04 so river boats & floating lanterns pass cleanly underneath!
    kit.loop(x0, u1, [capture(x0, Y(u1), x1 - x0 + 1, u1 - u0 + 1, deck)], { d: 0.04 });
    objects.push({
      y: Y(u0),
      shadow: () => shadowRect(x1 + 1, Y(u1), 3, u1 - u0, 0.55),
      draw: () => {
        // Concrete river piers visible at south edge
        img.rect(x0 + 3, Y(r0 + 14), 3, 5, C.stone[1]);
        img.rect(x1 - 5, Y(r0 + 14), 3, 5, C.stone[1]);
        deck();
      },
    });
  };
  for (const riv of [MOTOYASU, HONKAWA]) {
    makeBridge(WEST_CX, WEST_HW, riv[0], riv[1], true);
    makeBridge(EAST_CX, EAST_HW, riv[0], riv[1], false);
  }

  // ------------------------------------------------------------ 3. reusable architectural & tree helpers
  const tree = (cx, cy, r, palette, seed) => {
    const pts = crownPixels('broadleaf', cx, cy, r, rng(seed), seed);
    objects.push({
      y: cy + r,
      shadow: () => {
        for (const p of pts) img.tint(p.x + 2, p.y + 2, 0.62);
      },
      draw: () => {
        for (const p of pts) {
          const k = Math.max(0, RAMPS.broadleaf.indexOf(p.c));
          img.set(p.x, p.y, palette[Math.min(palette.length - 1, k)]);
        }
      },
    });
  };

  const stoneLantern = (x, u, lit = true) => {
    const y = Y(u);
    objects.push({
      y: y + 2,
      shadow: () => shadowRect(x + 1, y, 3, 3, 0.65),
      draw: () => {
        img.rect(x - 1, y - 2, 3, 4, C.granite[2]);
        img.rect(x - 2, y - 3, 5, 1, C.granite[3]);
        img.set(x, y - 4, C.granite[4]);
        if (lit) {
          glow(x, y - 1, 0xffcc70, 0.9);
          pool(x, y - 1, 6, C.lamp, 0.18 + dusk(u) * 0.2);
        }
      },
    });
  };

  const building = (x, y, w, h, faceH, opt = {}) => {
    const roof = opt.roof ?? rand.pick(C.roofs);
    const wall = opt.wall ?? rand.pick(C.walls);
    const awn = opt.awn ?? rand.pick([0xc43828, 0x2a6c40, 0x2c4e8a, 0xd49a24]);
    const litW = [];
    for (let i = 0; i < 64; i++) litW.push(rand() < 0.22);
    objects.push({
      y: y + h + faceH,
      shadow: () => shadowRect(x + 3, y + 3, w, h + faceH, 0.55),
      draw: () => {
        for (let yy = y; yy < y + h; yy++)
          for (let xx = x; xx < x + w; xx++) {
            let c = roof;
            if (yy === y || xx === x) c = scaleColor(roof, 1.18);
            else if (xx === x + w - 1 || yy === y + h - 1) c = scaleColor(roof, 0.76);
            img.set(xx, yy, c);
          }
        img.rect(x + 2, y + 2, Math.min(5, w - 4), 3, 0xb4b8be);
        for (let yy = y + h; yy < y + h + faceH; yy++)
          for (let xx = x; xx < x + w; xx++) {
            let c = wall;
            if (xx === x + w - 1) c = scaleColor(wall, 0.8);
            const wy = yy - (y + h);
            if (wy >= 2 && wy < faceH - 2 && wy % 3 !== 0 && xx > x + 1 && xx < x + w - 2 && (xx - x) % 3 !== 0) {
              const idx = ((wy / 3) | 0) * 8 + (((xx - x) / 3) | 0);
              c = litW[idx % 64] ? 0xffe49c : 0x46586c;
            }
            img.set(xx, yy, c);
          }
        if (opt.shop) img.rect(x + 1, y + h + faceH - 2, w - 2, 2, awn);
      },
    });
  };

  // ------------------------------------------------------------ 4. Zone 1: Hiroshima Castle & Shukkeien (u = 0..1400)
  {
    // Green park grounds between avenues
    fill(48, Y(1365), 88, 1205, C.grass, 101, 7);
    // Re-paint the u = 718 cross street across x = 48..136 since park lawn filled over it
    for (let u = 718 - 6; u <= 718 + 5; u++)
      for (let x = 46; x <= 138; x++) roadPx(x, Y(u), u + 0.5 - 718, 4, true);

    // --- HIROSHIMA CASTLE (Rijō — "Carp Castle", x = 56..126, u = 200..680) ---
    const mx0 = 56, mx1 = 126, mu0 = 205, mu1 = 675;
    reserveRect(mx0 - 2, Y(mu1) - 2, mx1 - mx0 + 4, mu1 - mu0 + 4);
    // Rectangular outer moat
    for (let u = mu0; u <= mu1; u++) {
      const y = Y(u);
      for (let x = mx0; x <= mx1; x++) {
        const edge = x === mx0 || x === mx1 || u === mu0 || u === mu1;
        if (edge) img.set(x, y, C.stone[2]);
        else {
          const v = 0.25 + fbm(x, y, { seed: 109, scale: 6 }) * 0.65;
          img.set(x, y, rampColor(C.moat, v, x, y));
        }
      }
    }
    // Inner bailey stone ishigaki walls & gravel courtyard (x = 68..114, u = 285..615)
    const cx0 = 68, cx1 = 114, cu0 = 285, cu1 = 615;
    for (let u = cu0; u <= cu1; u++) {
      const y = Y(u);
      for (let x = cx0; x <= cx1; x++) {
        const wallBand = x < cx0 + 4 || x > cx1 - 4 || u < cu0 + 6 || u > cu1 - 4;
        if (wallBand) img.set(x, y, C.ishi[(x + u) % 4]);
        else img.set(x, y, rampColor(C.gravel, 0.35 + fbm(x, y, { seed: 112, scale: 4 }) * 0.5, x, y));
      }
    }
    // Continuous approach path + wooden Ōtemon Castle Bridge from u = 145 street straight into bailey (u = 152..292)!
    for (let u = 152; u <= 292; u++) {
      const y = Y(u);
      for (let x = 86; x <= 96; x++) {
        const onBridge = u >= mu0 && u <= cu0;
        if (onBridge) {
          img.set(x, y, x === 86 || x === 96 ? C.hinoki[3] : u % 3 === 0 ? C.wood[1] : C.hinoki[1]);
        } else {
          img.set(x, y, rampColor(C.paving, 0.5, x, y));
        }
      }
    }
    // Ōtemon Gatehouse (x = 82..100, u = 290..308)
    objects.push({
      y: Y(288),
      shadow: () => shadowRect(84, Y(308) + 2, 19, 18, 0.55),
      draw: () => {
        img.rect(82, Y(308), 19, 12, C.tileRoof[1]);
        img.rect(83, Y(307), 17, 10, C.tileRoof[2]);
        img.rect(83, Y(296), 17, 5, C.plaster[1]);
        img.rect(88, Y(294), 7, 3, C.wood[0]);
      },
    });
    // 5-tier Carp Castle Keep (dark wood clapboard + white gables, x = 77..105, u = 430..535)
    objects.push({
      y: Y(420),
      shadow: () => shadowRect(82, Y(535) + 5, 28, 52, 0.5),
      draw: () => {
        // Stone tenshudai base
        for (let yy = Y(510); yy <= Y(455); yy++)
          for (let xx = 76; xx <= 106; xx++) img.set(xx, yy, C.ishi[(xx + yy) % 5]);
        // 5 dark-tiled roofs & warm dark timber boarding (distinctive to Hiroshima's "Carp Castle"!)
        const tiers = [
          [506, 14],
          [496, 12],
          [486, 10],
          [477, 8],
          [469, 6],
        ];
        for (const [tu, hw] of tiers) {
          const ty = Y(tu);
          img.rect(91 - hw, ty, hw * 2 + 1, 9, C.tileRoof[1]);
          img.rect(91 - hw + 1, ty + 1, hw * 2 - 1, 7, C.tileRoof[2]);
          img.rect(91 - hw + 2, ty + 8, hw * 2 - 3, 4, C.wood[1]);
          img.rect(91 - 3, ty + 8, 7, 2, C.plaster[2]);
        }
        // Golden shachihoko finials on top ridge
        img.set(88, Y(470), C.gold);
        img.set(94, Y(470), C.gold);
      },
    });
    // Swimming carp (koi) in Hiroshima Castle's moat!
    for (const [kx, ku, col] of [[62, 360, 0xf26430], [120, 420, 0xfff0d8], [62, 540, 0xe83828], [120, 600, 0xf4a030]]) {
      const f = new Raster(3, 5);
      f.rect(1, 0, 1, 5, col);
      f.rect(0, 1, 3, 2, col);
      f.set(1, 4, 0xffffff);
      kit.wander(kx, ku, 3, 18, [kit.frame(tod.frame(f, ku))], { n: 2, sp: 4, turn: 'rot' });
    }
    for (const [tx, tu] of [[73, 340], [109, 350], [74, 585], [108, 580], [51, 250], [131, 310], [51, 590], [131, 620]]) {
      tree(tx, Y(tu), 6, C.pine, tx * 13 + tu);
    }

    // --- SHUKKEIEN GARDEN (1620 Daimyō Garden & Kokokyo Rainbow Bridge, x = 54..130, u = 830..1265) ---
    reserveRect(54, Y(1265), 76, 435);
    // Serpentine Takueichi Pond
    for (let u = 855; u <= 1235; u++) {
      const y = Y(u);
      for (let x = 58; x <= 126; x++) {
        const dx = (x - 92) / 31;
        const du = (u - 1045) / 175;
        const n = fbm(x, y, { seed: 205, scale: 14 }) * 0.35;
        if (dx * dx + du * du < 0.85 + n) {
          // Pinch in the middle for the arched stone Kokokyo bridge (u = 1035..1055)!
          const pinch = Math.abs(u - 1045) < 14 && Math.abs(x - 92) > 12;
          if (!pinch) {
            img.set(x, y, rampColor(C.pond, 0.25 + fbm(x, y, { seed: 207, scale: 5 }) * 0.65, x, y));
          }
        }
      }
    }
    // Miniature pine islets inside Takueichi Pond
    for (const [ix, iu, rx, ry] of [[78, 935, 8, 12], [106, 1145, 9, 13]]) {
      for (let u = iu - ry; u <= iu + ry; u++)
        for (let x = ix - rx; x <= ix + rx; x++)
          if (((x - ix) / rx) ** 2 + ((u - iu) / ry) ** 2 < 1)
            img.set(x, Y(u), rampColor(C.moss, 0.5, x, Y(u)));
      tree(ix, Y(iu), 5, C.pine, ix * 7 + iu);
    }
    // Iconic Kokokyo ("Spanning-the-Rainbow") stone arch bridge at u = 1045 connecting east & west garden walks
    for (let x = 68; x <= 116; x++) {
      const arch = Math.round(Math.sin(((x - 68) / 48) * Math.PI) * 3);
      for (let du = -3; du <= 3; du++) {
        const c = Math.abs(du) === 3 ? C.granite[4] : C.granite[2 + (Math.abs(x - 92) < 8 ? 1 : 0)];
        img.set(x, Y(1045 + du + arch), c);
      }
    }
    // Continuous gravel garden stroll path linking u = 718 street -> Kokokyo bridge -> u = 1380 street!
    for (let u = 723; u <= 1045; u++) for (let dx = -2; dx <= 2; dx++) img.set(52 + dx, Y(u), C.gravel[2]);
    for (let x = 50; x <= 69; x++) for (let du = -2; du <= 2; du++) img.set(x, Y(1045 + du), C.gravel[2]);
    for (let x = 115; x <= 130; x++) for (let du = -2; du <= 2; du++) img.set(x, Y(1045 + du), C.gravel[2]);
    for (let u = 1045; u <= 1375; u++) for (let dx = -2; dx <= 2; dx++) img.set(128 + dx, Y(u), C.gravel[2]);
    // Seifūkan Tea Pavilion overlooking the pond (x = 56..72, u = 1120..1165)
    objects.push({
      y: Y(1118),
      shadow: () => shadowRect(58, Y(1165) + 2, 16, 44, 0.55),
      draw: () => {
        img.rect(56, Y(1165), 16, 42, C.wood[2]);
        img.rect(57, Y(1164), 14, 40, C.tileRoof[2]);
        img.rect(57, Y(1123), 14, 4, C.hinoki[2]);
      },
    });
    for (const [tx, tu, pal] of [
      [56, 880, C.momijiR], [126, 910, C.pine], [124, 1000, C.momijiO],
      [60, 1210, C.pine], [124, 1225, C.momijiR],
    ]) {
      tree(tx, Y(tu), 5, pal, tx * 11 + tu);
    }

    // Outer city blocks along x = 0..20 and x = 158..180 (u = 20..1350)
    for (let u = 30; u < 1340; u += 68) {
      if (CROSS_STREETS.some(([uc]) => Math.abs(u + 24 - uc) < 34)) continue;
      if (!anyRes(2, Y(u + 46), 18, 46)) building(2, Y(u + 44), 18, 34, 10, { shop: true });
      if (!anyRes(160, Y(u + 46), 18, 46)) building(160, Y(u + 44), 18, 34, 10, { shop: true });
    }
  }

  // ------------------------------------------------------------ 5. Zone 2: River Delta, Hondōri & Miyajimaguchi (u = 1430..2870)
  {
    // Sightseeing river boats + glowing Tōrō-nagashi floating peace lanterns drifting under bridges!
    for (const [riv, dir, seedOff] of [[MOTOYASU, 1, 0], [HONKAWA, -1, 50]]) {
      const ru = Math.round((riv[0] + riv[1]) / 2);
      const boat = capture(80, Y(ru + 4), 16, 7, () => {
        img.rect(81, Y(ru + 4), 14, 6, 0xeef2f6);
        img.rect(84, Y(ru + 3), 8, 4, 0x2c5a78);
        img.rect(80, Y(ru + 2), 2, 2, 0xd83828);
      });
      const pts = dir > 0 ? [[-16, ru + 8], [W + 16, ru + 8]] : [[W + 16, ru - 8], [-16, ru - 8]];
      kit.path(pts, [boat], { sp: 14, n: 2, gap: 98, d: 0.02, turn: 'none' });

      // Warm glowing Tōrō-nagashi river lanterns drifting gently on the water (d: 0.02 -> pass under bridges!)
      const toroFrames = [0, 1].map((f) => {
        const r = new Raster(5, 5);
        r.rect(1, 3, 3, 2, 0x6c4828);
        r.rect(1, 0, 3, 3, f ? 0xffe898 : 0xffbe58);
        r.set(2, 1, 0xffffff);
        return kit.frame(r);
      });
      const lPts = dir > 0 ? [[-10, ru - 12], [W + 10, ru - 10]] : [[W + 10, ru + 12], [-10, ru + 10]];
      kit.path(lPts, toroFrames, { sp: 7, n: 6, gap: 32, fps: 3, d: 0.02, turn: 'none' });
    }

    // --- HONDŌRI COVERED SHOPPING ARCADE (x = 50..136, u = 1710..1815) ---
    // Connects West Tram Boulevard sidewalk (x = 46) straight to East Avenue sidewalk (x = 140)!
    reserveRect(48, Y(1825), 90, 120);
    objects.push({
      y: Y(1705),
      shadow: () => shadowRect(52, Y(1815) + 3, 86, 108, 0.52),
      draw: () => {
        // Flank shop buildings north & south of the vaulted glass arcade roof
        img.rect(50, Y(1815), 86, 26, C.roofs[0]);
        img.rect(50, Y(1740), 86, 28, C.roofs[3]);
        // Vaulted translucent blue-white Hondōri arcade skylight barrel roof (x = 47..140, u = 1742..1788)
        for (let u = 1742; u <= 1788; u++) {
          const y = Y(u);
          const rib = (u - 1742) / 46;
          const archShade = Math.sin(rib * Math.PI);
          for (let x = 47; x <= 140; x++) {
            const frame = x % 8 === 0;
            const c = frame ? 0xd8dfe6 : archShade > 0.75 ? 0xb8e0f0 : archShade > 0.4 ? 0x8cc0d8 : 0x689ab4;
            img.set(x, y, c);
          }
        }
        // Warm glowing archway portal facing south
        img.rect(50, Y(1712), 86, 6, C.walls[0]);
        glow(54, Y(1765), 0xffe8a0);
        glow(136, Y(1765), 0xffe8a0);
      },
    });

    // --- OKONOMIYAKI YATAI & DOWNTOWN BLOCKS (u = 1850..2180) ---
    fill(48, Y(2195), 90, 360, C.paving, 303, 5);
    // Hiroshima-style Okonomiyaki yatai stalls with steaming teppan griddles & red noren curtains!
    for (const [sx, su] of [[56, 1895], [76, 1895], [104, 1895], [122, 1895], [56, 1960], [122, 1960]]) {
      const sy = Y(su);
      objects.push({
        y: sy + 10,
        shadow: () => shadowRect(sx + 1, sy + 1, 13, 10, 0.6),
        draw: () => {
          img.rect(sx, sy, 12, 8, 0xb83022);
          img.rect(sx + 1, sy + 1, 10, 5, 0xdc442e);
          img.rect(sx + 1, sy + 8, 10, 2, 0xffe098);
          glow(sx + 3, sy + 9, 0xff9848, 0.9);
          glow(sx + 8, sy + 9, 0xff9848, 0.9);
          pool(sx + 6, sy + 8, 9, C.lamp, 0.22);
        },
      });
      kit.emit(sx + 6, su - 2, stallSteam, { rate: 1.8, life: [1.3, 2.0], vy: 6, sx: 2, a: 0.55 });
    }
    // Urban buildings along outer edges & delta blocks (avoiding reserved turret plazas!)
    for (let u = 1595; u < 2640; u += 64) {
      if ((u >= MOTOYASU[0] - 20 && u <= MOTOYASU[1] + 20) || (u >= HONKAWA[0] - 20 && u <= HONKAWA[1] + 20)) continue;
      if (CROSS_STREETS.some(([uc]) => Math.abs(u + 22 - uc) < 32)) continue;
      if (!anyRes(2, Y(u + 42), 18, 42)) building(2, Y(u + 40), 18, 30, 10, { shop: true });
      if (!anyRes(160, Y(u + 42), 18, 42)) building(160, Y(u + 40), 18, 30, 10, { shop: true });
      if (!anyRes(52, Y(u + 40), 26, 40)) building(52, Y(u + 38), 24, 28, 9, { shop: true });
      if (!anyRes(108, Y(u + 40), 26, 40)) building(108, Y(u + 38), 24, 28, 9, { shop: true });
    }

    // --- MIYAJIMAGUCHI STATION & FERRY TERMINAL PLAZA (u = 2712..2870) ---
    fill(14, Y(2868), 152, 154, C.paving, 331, 5);
    // Re-expose the Hiroden double tramway entering the station (u = 2700..2820)
    for (let u = 2706; u <= 2820; u++) {
      const y = Y(u);
      for (let x = 28; x <= 40; x++) {
        let c = rampColor(C.tramBed, fbm(x, y, { seed: 35, scale: 4 }), x, y);
        if (x === 30 || x === 33 || x === 35 || x === 38) c = 0xc6ced6;
        img.set(x, y, c);
      }
    }
    // Hiroden Station Canopy Roof (spanning over platforms flanking the tracks, u = 2765..2832)
    objects.push({
      y: Y(2760),
      shadow: () => shadowRect(21, Y(2832) + 2, 30, 68, 0.55),
      draw: () => {
        // Side platforms
        img.rect(20, Y(2825), 7, 58, C.granite[3]);
        img.rect(41, Y(2825), 7, 58, C.granite[3]);
        // Station roof bridging across at u = 2820..2838
        img.rect(19, Y(2840), 31, 18, C.tileRoof[2]);
        img.rect(20, Y(2839), 29, 16, C.tileRoof[3]);
        img.rect(22, Y(2822), 25, 3, C.vermilion[2]);
      },
    });
    // Tiled pedestrian concourse linking Route 2 & Station (x = 48) -> Ferry Terminal Building -> Pier!
    for (let x = 48; x <= 100; x++)
      for (let u = 2790; u <= 2810; u++) img.set(x, Y(u), (x + u) % 3 === 0 ? C.granite[3] : C.paving[2]);
    for (let u = 2706; u <= 2830; u++)
      for (let x = 88; x <= 100; x++) img.set(x, Y(u), (x + u) % 3 === 0 ? C.granite[3] : C.paving[2]);
    objects.push({
      y: Y(2820),
      shadow: () => shadowRect(78, Y(2866) + 2, 36, 44, 0.55),
      draw: () => {
        img.rect(76, Y(2866), 36, 38, 0x4c6882);
        img.rect(78, Y(2864), 32, 34, 0x6284a2);
        img.rect(84, Y(2860), 20, 12, 0xd8eef8); // skylight
        img.rect(76, Y(2828), 36, 5, C.plaster[2]);
      },
    });
    // Mainland Ferry Pier bollards & boarding gangway (x = 84..104, u = 2870..3015)
    for (let u = 2875; u <= 3010; u += 18) {
      img.set(85, Y(u), C.gold);
      img.set(103, Y(u), C.gold);
    }

    // --- LIVE TRAFFIC: HIRODEN STREETCARS ("Green Mover" & Retro Cream-Green) + COLLISION-FREE CARS! ---
    const tramGreen = capture(34, Y(600), 5, 18, () => {
      img.rect(34, Y(600), 5, 18, 0xf0ead8); // cream body
      img.rect(34, Y(598), 5, 14, 0x2c7848); // classic Hiroden deep green livery
      img.rect(35, Y(596), 3, 10, 0xdce6e0); // roof AC & pantograph base
      img.set(36, Y(591), 0x88929a);
      img.rect(34, Y(600), 5, 1, 0x283848);
      img.rect(34, Y(583), 5, 1, 0x283848);
      glow(35, Y(600), 0xfff4c8, 0.9);
      glow(37, Y(600), 0xfff4c8, 0.9);
    });
    const carFrames = CARS.map((col, idx) =>
      capture(60 + idx * 8, Y(500), 4, 7, () => {
        const cx = 60 + idx * 8;
        const cy = Y(500);
        img.rect(cx, cy, 4, 7, col);
        img.rect(cx, cy + 2, 4, 3, scaleColor(col, 1.16));
        img.rect(cx, cy + 1, 4, 1, 0x283440);
      }),
    );

    const visible = (u) => {
      const tMid = (u - anchor) / V;
      return [Math.max(0, tMid - 16), tMid + 6];
    };
    const trafficDefs = [
      // Northbound & southbound Hiroden streetcars running uninterrupted from u = -20 to Miyajimaguchi Station (u = 2805)!
      { pts: [[36.5, -25], [36.5, 2805]], sp: 24, n: 5, gap: 560, s0: 0.12, size: [19, 5], frames: [tramGreen], turn: 'none' },
      { pts: [[31.5, 2805], [31.5, -25]], sp: 24, n: 5, gap: 560, s0: 0.58, size: [19, 5], frames: [tramGreen], turn: 'none' },
      // West boulevard northbound & southbound car lanes turning cleanly onto Route 2 at u = 2700!
      { pts: [[41.5, -15], [41.5, 2698], [190, 2698]], sp: 34, n: 6, gap: 460, size: [8, 4], frames: [carFrames[0], carFrames[2]], cars: 1 },
      { pts: [[-15, 2702], [26.5, 2702], [26.5, -15]], sp: 32, n: 6, gap: 460, size: [8, 4], frames: [carFrames[1], carFrames[3]], cars: 1 },
      // East avenue continuous traffic
      { pts: [[151, -15], [151, 2698], [190, 2698]], sp: 35, n: 5, gap: 520, size: [8, 4], frames: [carFrames[4], carFrames[5]], cars: 1 },
      { pts: [[145, 2698], [145, -15]], sp: 31, n: 5, gap: 520, size: [8, 4], frames: [carFrames[0], carFrames[3]], cars: 1 },
      // Cross-street edge-to-edge traffic
      { pts: [[-12, 1380], [192, 1380]], sp: 30, n: 2, gap: 96, size: [8, 4], frames: [carFrames[2]], cars: 1 },
      { pts: [[192, 2215], [-12, 2215]], sp: 30, n: 2, gap: 96, size: [8, 4], frames: [carFrames[5]], cars: 1 },
    ];
    const s0s = planTraffic(trafficDefs, visible, { seed: 7721 });
    trafficDefs.forEach((r, idx) => {
      kit.path(r.pts, r.frames, {
        sp: r.sp,
        n: r.n,
        gap: r.gap,
        s0: s0s[idx],
        turn: r.turn ?? 'rot',
        cars: r.cars,
        d: 0.45,
      });
    });
  }

  // ------------------------------------------------------------ 6. Zone 3: Hiroshima Bay, Oyster Rafts & Ferries (u = 2870..4520)
  {
    // Pine trees on the bay turret islets (t = 90 -> u = 3130)
    for (const isl of bayIslets) {
      tree(isl.x - 10, Y(isl.u + 6), 4, C.pine, isl.x + 1);
      tree(isl.x + 10, Y(isl.u - 6), 4, C.pine, isl.x + 2);
    }

    // Iconic Hiroshima Bamboo Oyster Rafts (Kaki-ikada, u = 3240..4280)
    // Placed in neat maritime grids on the flanks, leaving the diagonal ferry channel (x = 94,u = 3040 -> x = 36,u = 4380) wide open!
    const RAFTS = [
      [24, 3260], [50, 3280], [134, 3270], [158, 3310],
      [22, 3480], [122, 3490], [150, 3520],
      [24, 3740], [116, 3730], [146, 3760],
      [96, 3980], [126, 4010], [154, 3990],
      [104, 4210], [136, 4230],
    ];
    for (const [rx, ru] of RAFTS) {
      const ry = Y(ru);
      objects.push({
        y: ry + 14,
        draw: () => {
          // Subtle underwater shadow & turquoise rope lines
          shadowRect(rx - 9, ry - 11, 20, 24, 0.72);
          // Bamboo lattice grid (18 x 22 px)
          for (let dy = -11; dy <= 11; dy += 3)
            for (let dx = -9; dx <= 9; dx++) img.set(rx + dx, ry + dy, 0xc8a868);
          for (let dx = -8; dx <= 8; dx += 4)
            for (let dy = -11; dy <= 11; dy++) img.set(rx + dx, ry + dy, 0xdfc07e);
          // Corner styrofoam/orange floats
          for (const [fx, fy] of [[-9, -11], [9, -11], [-9, 11], [9, 11], [0, 0]]) {
            img.set(rx + fx, ry + fy, fx === 0 ? 0xf25c30 : 0xf4f6f8);
          }
        },
      });
    }

    // Live Miyajima Ferries cruising between Mainland Pier (94, 3035) and Miyajima Pier (35, 4370) with white V-wakes!
    const ferryFrame = capture(80, Y(3600), 11, 24, () => {
      const fx = 80, fy = Y(3600);
      // White hull with vermilion JR/Matsudai stripe & passenger decks
      img.rect(fx + 1, fy + 2, 9, 20, 0xf2f4f8);
      img.rect(fx + 2, fy, 7, 3, 0xf2f4f8);
      img.rect(fx + 1, fy + 10, 9, 2, C.vermilion[2]);
      img.rect(fx + 2, fy + 5, 7, 13, 0xdbe4ec);
      img.rect(fx + 3, fy + 6, 5, 3, 0x2c4e6c); // bridge windows
      img.rect(fx + 4, fy + 14, 3, 3, C.vermilion[1]); // funnel
    });
    const wakeFrame = (() => {
      const r = new Raster(9, 7);
      for (let i = 0; i < 6; i++) {
        r.set(4 - Math.floor(i * 0.6), i, 0xe8faff, 0.75 - i * 0.1);
        r.set(4 + Math.floor(i * 0.6), i, 0xe8faff, 0.75 - i * 0.1);
      }
      return kit.frame(r);
    })();
    kit.path(
      [[94, 3040], [82, 3420], [56, 3960], [35, 4365]],
      [ferryFrame],
      { sp: 16, mode: 'pp', hold: 3.5, turn: 'rot', d: 0.25, wake: { f: [wakeFrame], every: 4, life: 1.8 } },
    );
    kit.path(
      [[102, 3045], [96, 3520], [72, 4020], [43, 4365]],
      [ferryFrame],
      { sp: 15, s0: 0.52, mode: 'pp', hold: 3.5, turn: 'rot', d: 0.25, wake: { f: [wakeFrame], every: 4, life: 1.8 } },
    );

    // Circling Seto sea gulls over the oyster rafts
    const gullF = [0, 1].map((f) => {
      const r = new Raster(5, 3);
      r.set(2, 1, 0xffffff);
      r.set(1, f ? 0 : 1, 0xffffff);
      r.set(3, f ? 0 : 1, 0xffffff);
      r.set(0, f ? 0 : 2, 0xd0d8e0);
      r.set(4, f ? 0 : 2, 0xd0d8e0);
      return kit.frame(r);
    });
    kit.orbit(68, 3560, 22, gullF, { ry: 16, w: 0.7, n: 3, fps: 4, d: 0.7 });
    kit.orbit(128, 3880, 20, gullF, { ry: 14, w: -0.65, n: 2, fps: 4, d: 0.7 });
  }

  // ------------------------------------------------------------ 7. Zone 4: Sacred Miyajima — Ō-Torii & Itsukushima Shrine (u = 4520..5900)
  {
    // Continuous Omotesandō Stone-Lantern Waterfront Promenade:
    // Connects Miyajima Ferry Pier (x = 35, u = 4530) along west shore -> wraps behind Itsukushima Shrine (u = 5400) -> east pagoda bluff!
    for (let u = 4525; u <= 5410; u++) {
      for (let x = 29; x <= 41; x++) img.set(x, Y(u), rampColor(C.paving, 0.45 + fbm(x, Y(u), { seed: 401, scale: 4 }) * 0.4, x, Y(u)));
    }
    for (let u = 4570; u <= 5410; u++) {
      for (let x = 138; x <= 148; x++) img.set(x, Y(u), rampColor(C.paving, 0.45 + fbm(x, Y(u), { seed: 402, scale: 4 }) * 0.4, x, Y(u)));
    }
    // Stone coastal viewing rotunda at south end of the east promenade (x = 135..151, u = 4558..4576)
    for (let u = 4558; u <= 4576; u++)
      for (let x = 135; x <= 151; x++)
        if (Math.hypot(x - 143, u - 4567) <= 8.5) img.set(x, Y(u), Math.hypot(x - 143, u - 4567) > 7 ? C.stone[3] : C.granite[3]);
    for (let x = 29; x <= 148; x++) {
      for (let u = 5395; u <= 5412; u++) img.set(x, Y(u), rampColor(C.paving, 0.5, x, Y(u)));
    }
    // Mountain stone trail continuing seamlessly from behind the shrine (x = 90, u = 5412) all the way up to Mount Misen (u = 6960)!
    for (let u = 5412; u <= 6960; u++) {
      const bend = u < 6500 ? Math.round(Math.sin((u - 5412) / 140) * 6) : 0;
      const cx = 90 + bend;
      for (let dx = -5; dx <= 5; dx++) {
        if (W_(cx + dx, Y(u))) continue;
        const step = u > 5850 && u % 4 === 0;
        img.set(cx + dx, Y(u), Math.abs(dx) === 5 ? C.stone[2] : step ? C.granite[3] : C.paving[1]);
      }
    }

    // Rows of coastal Ishidōrō stone lanterns along both Miyajima promenades
    for (let u = 4580; u <= 5360; u += 52) {
      if (Math.abs(u - 4660) > 22 && Math.abs(u - 5290) > 22) {
        stoneLantern(43, u, true);
        if (u >= 4640) stoneLantern(136, u, true);
      }
    }

    // Wandering Sacred Miyajima Sika Deer (shika) along the waterfront & shrine park!
    const deerFrames = [0, 1].map((f) => {
      const r = new Raster(7, 6);
      r.rect(1, 2, 4, 2, 0xb8763c); // warm russet coat
      r.set(2, 2, 0xf8eed8); // white fawn spot
      r.set(4, 2, 0xf8eed8);
      r.rect(4, 0, 2, 2, 0xc88446); // raised neck & head
      r.set(6, 0, 0x3a2618); // nose
      r.set(0, 2, 0xffffff); // white tail
      r.set(1, f ? 4 : 5, 0x6e4422);
      r.set(4, f ? 5 : 4, 0x6e4422);
      return kit.frame(tod.frame(r, 4900));
    });
    kit.wander(22, 4760, 12, 65, deerFrames, { n: 3, sp: 5, turn: 'flip', fps: 3, idle: 0.45 });
    kit.wander(22, 5140, 12, 60, deerFrames, { n: 2, sp: 5, turn: 'flip', fps: 3, idle: 0.5 });
    kit.wander(158, 4960, 12, 70, deerFrames, { n: 3, sp: 5, turn: 'flip', fps: 3, idle: 0.45 });

    // --- THE GREAT FLOATING TORII (Ō-Torii of Itsukushima, x = 90, u = 4830) ---
    {
      const tx = 90;
      const tu = 4830;
      const ty = Y(tu);
      // Animated concentric tidal ripples around the submerged pillars!
      const ripFrames = [0, 1].map((f) => {
        const r = new Raster(44, 14);
        for (const px of [11, 32]) {
          const rad = f ? 6.5 : 4.5;
          for (let a = 0; a < Math.PI * 2; a += 0.2) {
            r.set(Math.round(px + Math.cos(a) * rad), Math.round(7 + Math.sin(a) * (rad * 0.45)), 0xd8f8ff, 0.55);
          }
        }
        return kit.frame(r);
      });
      kit.loop(tx - 22, tu + 5, ripFrames, { fps: 2, fx: 1, d: 0.1 });

      objects.push({
        y: ty + 6,
        draw: () => {
          // Vermilion water reflection shimmer below the pillars
          for (const s of [-1, 1]) {
            const px = tx + s * 10;
            for (let ry = ty + 2; ry <= ty + 9; ry += 2) img.set(px, ry, C.vermilion[2], 0.55);
          }
          // Outrigger sleeve pillars (chigo-bashira, 4 legs per side!)
          for (const s of [-1, 1]) {
            const px = tx + s * 10;
            img.rect(px - 1, ty - 18, 3, 20, C.vermilion[2]);
            img.rect(px, ty - 18, 1, 20, C.vermilion[3]);
            img.rect(px + s * 4, ty - 9, 2, 11, C.vermilion[1]);
            img.rect(px - s * 3, ty - 9, 2, 11, C.vermilion[1]);
            img.rect(Math.min(px - s * 3, px + s * 4), ty - 5, 8, 1, C.vermilion[2]);
            // Dark base collars at waterline
            img.rect(px - 1, ty, 3, 2, 0x282024);
          }
          // Nuki lower tie-beam
          img.rect(tx - 16, ty - 13, 33, 2, C.vermilion[2]);
          // Sweeping dark cypress-bark Kasagi top lintel with upturned wingtips!
          for (let dx = -20; dx <= 20; dx++) {
            const lift = Math.round((dx * dx) / 110);
            img.set(tx + dx, ty - 20 - lift, C.tileRoof[0]);
            img.set(tx + dx, ty - 19 - lift, C.tileRoof[1]);
            img.set(tx + dx, ty - 18 - lift, C.vermilion[3]);
            if (Math.abs(dx) <= 18) img.set(tx + dx, ty - 17 - lift, C.vermilion[2]);
          }
          // Central gold-framed tablet ("Itsukushima")
          img.rect(tx - 2, ty - 18, 5, 6, 0x1c2430);
          img.rect(tx - 1, ty - 17, 3, 4, C.gold);
          glow(tx - 10, ty - 6, 0xff9a58, 0.45);
          glow(tx + 10, ty - 6, 0xff9a58, 0.45);
        },
      });
    }

    // --- ITSUKUSHIMA SHRINE OVER THE COVE (x = 40..140, u = 5020..5365) ---
    reserveRect(42, Y(5375), 96, 360);
    objects.push({
      y: Y(5010),
      shadow: () => shadowRect(66, Y(5355) + 3, 52, 320, 0.58),
      draw: () => {
        // Dark cypress over-water Hirabutai & Bugaku Dance Stage (Takabutai, x = 76..104, u = 5025..5135)
        img.rect(74, Y(5140), 33, 112, C.wood[1]);
        for (let u = 5030; u <= 5138; u += 3) img.rect(75, Y(u), 31, 1, C.hinoki[1]);
        // Vermilion balustrade around Hirabutai
        img.rect(74, Y(5140), 33, 2, C.vermilion[2]);
        img.rect(74, Y(5028), 33, 2, C.vermilion[2]);
        img.rect(74, Y(5140), 2, 112, C.vermilion[2]);
        img.rect(105, Y(5140), 2, 112, C.vermilion[2]);
        // Elevated black-lacquered Takabutai Bugaku Dance Stage in the center (x = 83..97, u = 5065..5105)
        img.rect(82, Y(5106), 17, 40, 0x241c22);
        img.rect(83, Y(5105), 15, 38, C.hinoki[2]);
        img.rect(82, Y(5106), 17, 1, C.vermilion[3]);
        img.rect(82, Y(5067), 17, 1, C.vermilion[3]);
        // Hikeshi-no-tsubo bronze lanterns at front corners of Hirabutai
        glow(75, Y(5030), 0xffcf78, 0.95);
        glow(105, Y(5030), 0xffcf78, 0.95);

        // Symmetrical Stilted Vermilion Kairō Corridors bridging from BOTH shore promenades (x = 41..138) into the shrine!
        // East & West lateral wings at u = 5155..5180 and u = 5285..5310 + side cloisters x = 58..66 & x = 114..122
        img.rect(41, Y(5180), 98, 22, C.tileRoof[1]);
        img.rect(41, Y(5178), 98, 18, C.vermilion[2]);
        img.rect(58, Y(5315), 10, 140, C.vermilion[2]);
        img.rect(113, Y(5315), 10, 140, C.vermilion[2]);
        img.rect(60, Y(5313), 6, 136, C.tileRoof[2]);
        img.rect(115, Y(5313), 6, 136, C.tileRoof[2]);
        // Stilts visible along south edges over water
        for (let sx = 44; sx <= 136; sx += 6) img.rect(sx, Y(5158), 2, 5, C.wood[0]);

        // Haiden & Main Honden Sanctuary Roofs (x = 70..111, u = 5185..5355)
        img.rect(70, Y(5260), 41, 68, C.tileRoof[1]);
        img.rect(72, Y(5258), 37, 64, C.tileRoof[2]);
        img.rect(72, Y(5192), 37, 5, C.vermilion[3]);
        img.rect(68, Y(5355), 45, 82, C.tileRoof[0]);
        img.rect(70, Y(5353), 41, 78, C.tileRoof[2]);
        img.rect(80, Y(5316), 21, 3, C.gold); // golden ridge ornament
        img.rect(70, Y(5273), 41, 5, C.vermilion[3]);
      },
    });

    // --- GOJŪNOTŌ (Five-Story Vermilion Pagoda on the eastern pine hill, x = 148..170, u = 5290..5365) ---
    objects.push({
      y: Y(5285),
      shadow: () => shadowRect(151, Y(5358) + 4, 22, 42, 0.5),
      draw: () => {
        for (let i = 0; i < 5; i++) {
          const hw = 10 - i * 1.3;
          const py = Y(5348 - i * 9);
          const w = Math.round(hw * 2);
          const x0 = 159 - Math.round(hw);
          img.rect(x0, py, w, 7, C.vermilion[2]);
          img.rect(x0 + 1, py + 1, w - 2, 5, C.tileRoof[1]);
          img.rect(x0, py + 6, w, 2, C.vermilion[3]);
        }
        // Golden sōrin spire
        img.rect(158, Y(5355), 2, 8, C.gold);
      },
    });

    // Pine & early crimson momiji groves framing Miyajima's hills (u = 5430..5880)
    for (let u = 5440; u <= 5860; u += 38) {
      for (const side of [-1, 1]) {
        const tx = side < 0 ? 16 + ((u * 7) % 34) : 130 + ((u * 11) % 34);
        if (anyRes(tx - 8, Y(u) - 8, 16, 16)) continue;
        const pal = (u + tx) % 3 === 0 ? C.momijiR : (u + tx) % 5 === 0 ? C.momijiO : C.pine;
        tree(tx, Y(u), 6 + (u % 3), pal, tx * 19 + u);
      }
    }
  }

  // ------------------------------------------------------------ 8. Zone 5: Momijidani Maple Valley & Mount Misen Boss Arena (u = 5900..7168)
  {
    // Arched Vermilion Momijidani Bridge carrying the central trail cleanly across the mountain stream (u = 6165..6240)!
    {
      const bx0 = 83, bx1 = 97;
      for (let u = 6164; u <= 6240; u++) {
        const y = Y(u);
        for (let x = bx0; x <= bx1; x++) {
          const rail = x === bx0 || x === bx1;
          const post = rail && u % 10 === 0;
          img.set(x, y, post ? C.gold : rail ? C.vermilion[3] : u % 3 === 0 ? C.vermilion[1] : C.vermilion[2]);
        }
      }
      reserveRect(bx0 - 3, Y(6244), bx1 - bx0 + 6, 84);
    }

    // Lush Momijidani Crimson, Scarlet & Golden Maple Forest Canopy (u = 5900..6560)
    for (let u = 5900; u <= 6560; u += 26) {
      for (let k = 0; k < 5; k++) {
        const tx = 10 + ((u * 13 + k * 37) % 160);
        if (Math.abs(tx - 90) < 15) continue; // keep central stone trail & Momijidani Bridge crisp and visible!
        if (W_(tx, Y(u)) || anyRes(tx - 8, Y(u) - 8, 16, 16)) continue;
        const pick = (u + k * 3) % 7;
        const pal = pick < 3 ? C.momijiR : pick < 5 ? C.momijiO : pick === 5 ? C.momijiY : C.pine;
        tree(tx, Y(u), 6 + (k % 3), pal, tx * 23 + u);
      }
    }

    // --- MIYAJIMA ROPEWAY (continuous edge-to-edge diagonal aerial cable + gliding red cabins, u = 6350..6520) ---
    {
      const uL = 6355, uR = 6515;
      // Draw continuous twin steel cables edge-to-edge across the strip so nothing cuts off!
      objects.push({
        y: Y(uL) + 10,
        draw: () => {
          for (let x = 0; x < W; x++) {
            const cu = uL + ((uR - uL) * x) / (W - 1);
            img.set(x, Y(cu), 0xd0d8e0);
            img.set(x, Y(cu + 5), 0xb8c2cc);
          }
          // Steel lattice pylon on eastern granite crag (x = 148)
          const py = Y(uL + ((uR - uL) * 148) / (W - 1));
          img.rect(146, py - 2, 5, 14, 0x707c88);
          img.rect(144, py - 3, 9, 2, 0x9aa6b2);
        },
      });
      const gondola = (() => {
        const r = new Raster(9, 10);
        r.rect(4, 0, 1, 3, 0x58626c); // hanger arm
        r.rect(1, 3, 7, 6, C.vermilion[2]);
        r.rect(2, 4, 5, 2, 0xd8f0ff); // cabin windows
        r.rect(1, 8, 7, 1, 0xf2ead8);
        return kit.frame(r);
      })();
      kit.path([[-12, uL - 10], [W + 12, uR + 10]], [gondola], { sp: 16, n: 3, gap: 72, turn: 'none', d: 0.78 });
      kit.path([[W + 12, uR + 15], [-12, uL - 5]], [gondola], { sp: 16, n: 2, gap: 96, s0: 0.35, turn: 'none', d: 0.78 });
    }

    // --- MOUNT MISEN SUMMIT & REIKADŌ (Hall of the 1,200-year Eternal Flame, u = 6600..7168) ---
    {
      // Weathered granite boulders (Kuguri-iwa megaliths) flanking the summit approach
      const BOULDERS = [
        [32, 6620, 14, 10], [146, 6640, 15, 11],
        [28, 6780, 16, 12], [150, 6800, 16, 12],
        [36, 7040, 15, 11], [144, 7050, 15, 11],
        [64, 7110, 12, 9], [116, 7115, 12, 9],
      ];
      for (const [bx, bu, rx, ry] of BOULDERS) {
        const by = Y(bu);
        objects.push({
          y: by + ry,
          shadow: () => shadowRect(bx - rx + 2, by - ry + 3, rx * 2, ry * 2, 0.6),
          draw: () => {
            for (let dy = -ry; dy <= ry; dy++)
              for (let dx = -rx; dx <= rx; dx++) {
                const d = (dx / rx) ** 2 + (dy / ry) ** 2;
                if (d > 1) continue;
                const shade = 0.35 + (-dx * 0.25 - dy * 0.35) / rx + fbm(bx + dx, by + dy, { seed: 809, scale: 4 }) * 0.35;
                img.set(bx + dx, by + dy, rampColor(C.granite, Math.max(0.05, Math.min(0.98, shade)), bx + dx, by + dy));
              }
          },
        });
      }

      // Summit Stone Sanctuary Courtyard (x = 52..128, u = 6840..7045) — Boss Arena!
      for (let u = 6840; u <= 7045; u++) {
        const y = Y(u);
        for (let x = 52; x <= 128; x++) {
          const border = x === 52 || x === 128 || u === 6840 || u === 7045;
          img.set(x, y, border ? C.stone[3] : (x % 8 === 0 || u % 8 === 0) ? C.granite[1] : C.granite[2]);
        }
      }
      // Stone Torii at entrance to Mount Misen's summit courtyard (x = 90, u = 6838)
      objects.push({
        y: Y(6835),
        draw: () => {
          img.rect(81, Y(6848), 3, 12, C.granite[3]);
          img.rect(97, Y(6848), 3, 12, C.granite[3]);
          img.rect(78, Y(6850), 25, 3, C.granite[4]);
          img.rect(80, Y(6846), 21, 2, C.granite[3]);
        },
      });

      // Reikadō (Hall of the Spiritual Flame, x = 72..108, u = 6975..7032)
      objects.push({
        y: Y(6970),
        shadow: () => shadowRect(75, Y(7032) + 3, 37, 56, 0.52),
        draw: () => {
          // Irimoya hip-and-gable tiled roof seen from above: hips slope down from a central ridge, tile courses
          // catch the sunset on the west slope, the east slope falls into shade
          const rx0 = 72, rx1 = 108, ry0 = Y(7032), ry1 = Y(6984);
          for (let y = ry0; y <= ry1; y++)
            for (let x = rx0; x <= rx1; x++) {
              const dx = x - 90;
              const edgeY = Math.min(y - ry0, ry1 - y);
              const edgeX = Math.min(x - rx0, rx1 - x);
              const hip = Math.min(edgeY, edgeX) <= 1;
              let c = dx < 0 ? C.tileRoof[2] : C.tileRoof[1];
              if ((y - ry0) % 3 === 0) c = dx < 0 ? C.tileRoof[3] : C.tileRoof[2]; // tile courses
              if (Math.abs(dx) <= 1) c = C.tileRoof[0]; // ridge
              if (hip) c = C.tileRoof[0];
              img.set(x, y, c);
            }
          // diagonal hip ridges running to the four corners
          for (let k = 0; k <= 8; k++) {
            img.set(rx0 + 1 + k, ry0 + 1 + k, C.tileRoof[0]);
            img.set(rx1 - 1 - k, ry0 + 1 + k, C.tileRoof[0]);
            img.set(rx0 + 1 + k, ry1 - 1 - k, C.tileRoof[0]);
            img.set(rx1 - 1 - k, ry1 - 1 - k, C.tileRoof[0]);
          }
          // golden ridge ornaments & a white plaster gable triangle facing the courtyard
          img.rect(89, ry0 + 4, 3, 2, C.gold);
          img.rect(89, ry1 - 13, 3, 2, C.gold);
          for (let k = 0; k < 5; k++) img.rect(90 - k, ry1 - 8 + k, 1 + k * 2, 1, C.plaster[1]);
          // vermilion front veranda with pillars and the open altar doors showing the Eternal Flame
          img.rect(73, Y(6983), 35, 5, C.wood[1]);
          for (let px = 74; px <= 106; px += 5) img.rect(px, Y(6983), 1, 5, C.vermilion[2]);
          img.rect(73, Y(6979), 35, 1, C.vermilion[3]);
          img.rect(86, Y(6982), 9, 3, 0xffb848);
          img.rect(88, Y(6982), 5, 2, 0xfff0a0);
          glow(90, Y(6981), 0xfff0a0, 1);
          pool(90, Y(6980), 18, 0xff8c38, 0.42);
        },
      });

      // Twin Sacred Eternal Flame Braziers in the courtyard (x = 64 & 116, u = 6940) with live flickering fire & incense smoke!
      for (const fx of [64, 116]) {
        const fu = 6940;
        const fy = Y(fu);
        objects.push({
          y: fy + 3,
          draw: () => {
            img.disc(fx, fy, 4, 0x2c2830);
            img.disc(fx, fy, 2.5, 0xe84824);
            glow(fx, fy, 0xffd878, 1);
            pool(fx, fy, 14, 0xff7a30, 0.38);
          },
        });
        const fireFrames = [0, 1].map((k) => {
          const r = new Raster(5, 6);
          r.rect(1, 2, 3, 3, 0xe83820);
          r.rect(1 + (k ? 0 : 1), 1, 2, 3, 0xffa830);
          r.set(2, k ? 0 : 1, 0xfff8b8);
          return kit.frame(r);
        });
        kit.loop(fx - 2, fu + 3, fireFrames, { fps: 6, d: 0.55 });
        kit.emit(fx, fu + 2, incenseSmoke, { rate: 1.5, life: [1.5, 2.4], vy: 7, sx: 2, a: 0.5 });
      }

      // Wind-twisted summit pines & crimson maples around the courtyard
      for (const [tx, tu, pal] of [
        [44, 6880, C.momijiR], [136, 6890, C.momijiO],
        [42, 6980, C.pine], [138, 6990, C.pine],
        [48, 7090, C.momijiR], [132, 7095, C.momijiY],
      ]) {
        tree(tx, Y(tu), 6, pal, tx * 29 + tu);
      }
    }
  }

  // ------------------------------------------------------------ 9. compose 3/4 objects + stone lantern turret pedestals
  for (const o of objects) o.shadow?.();
  objects.sort((a, b) => a.y - b.y);
  for (const o of objects) o.draw();

  // Turret pads: octagonal carved Seto granite + vermilion shrine-lantern pedestals!
  for (const p of pads) {
    const y = Y(p.u);
    for (let yy = y - 9; yy <= y + 9; yy++)
      for (let xx = p.x - 9; xx <= p.x + 9; xx++) {
        const d = Math.hypot(xx + 0.5 - p.x, yy + 0.5 - y);
        if (d > 9.2) continue;
        img.set(
          xx,
          yy,
          d > 7.8 ? C.stone[1] : d > 6.4 ? C.vermilion[2] : (xx + yy) % 4 === 0 ? C.granite[2] : C.granite[3],
        );
      }
  }

  // ------------------------------------------------------------ 10. time-of-day colour grade + warm light pools + water reflections
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
  for (const pl of pools) applyPool(img, pl);
  for (const [x, y, c, a] of lights) img.set(x, y, c, a);

  const chunks = [];
  for (let i = 0; i < CHUNKS; i++) chunks.push(img.crop(0, i * CHUNK, W, CHUNK));
  return {
    strip: img,
    chunks,
    props: kit.pack(),
    meta: { width: W, chunkHeight: CHUNK, chunks: CHUNKS, length: L, tint: tintTable(L, tod.white) },
  };
}
