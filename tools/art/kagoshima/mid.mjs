// Middle layer (Kagoshima), at 3x the game's resolution: the city under a haze of volcanic ash (city.mjs), Sengan-en, the
// sand baths and the black-vinegar jars along the coast (coast.mjs), Kinkō Bay (bay.mjs), Sakurajima's port, village and
// fields (island.mjs), the 1914 lava and the summit crater (lava.mjs). Graded from hazy day to the red glow of the crater;
// lava and lamps are painted after the grade. Open water stays transparent: the far layer is the bay.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeCanvas, C, S, hashPx, scaleColor, rampColor, fbm, HiCanvas } from '../nagasaki/canvas.mjs';
import { W, L, isWater, smooth, RIVER, SENGAN, COAST, BAY, ISLAND, LAVA, CITY } from './geo.mjs';
import { paintCity } from './city.mjs';
import { paintSengan, paintCoast } from './coast.mjs';
import { paintBay } from './bay.mjs';
import { paintIsland } from './island.mjs';
import { paintLava, paintCrater, lavaPx } from './lava.mjs';
import { paintTraffic } from './traffic.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export { W, L };
export { buildFar } from './far.mjs';

// time of day / atmosphere along the strip: [u, multiply rgb, tint, tint amount]
const TOD = [
  [0, [0.97, 0.95, 0.9], 0x8a7a68, 0.08],
  [2400, [0.93, 0.92, 0.9], 0x6e6e72, 0.12],
  [4250, [0.9, 0.87, 0.84], 0x5a4a44, 0.1],
  [5400, [0.8, 0.74, 0.72], 0x3a2a2c, 0.12],
  [L, [0.66, 0.56, 0.54], 0x2a1414, 0.16],
];
const night = (u) => smooth(4800, 6600, u);

const ASH = [0x5c5a56, 0x706e6a, 0x868480, 0x9c9a94];

export function buildMid() {
  const stage = JSON.parse(readFileSync(join(root, 'src', 'data', 'stage4.json'), 'utf8'));
  const { mid: V, anchor } = stage.scroll;
  const k = makeCanvas(4404, { isWater, tod: TOD, night, ridge: L });
  const { img, Y, U, kit, FW, FH, fineWater, shoreD } = k;
  // what glows in the lava's cracks is painted after the grade; some of it flares up and dies down, patch by patch
  const LIT = [];
  k.lavaGlow = (X, Yy, c) => {
    k.glowPx(X, Yy, c, 0.96);
    LIT.push([X, Yy]);
  };
  let breaths = 0;
  k.breathe = (pxs, ph) => {
    if (!pxs.length || breaths >= 26) return;
    breaths++;
    const xs = pxs.map((p) => p[0]);
    const ys = pxs.map((p) => p[1]);
    const x0 = Math.floor(Math.min(...xs) / S) - 1;
    const y0 = Math.floor(Math.min(...ys) / S) - 1;
    const w = Math.ceil(Math.max(...xs) / S) - x0 + 2;
    const h = Math.ceil(Math.max(...ys) / S) - y0 + 2;
    const out = new HiCanvas(w, h, S, x0, y0);
    for (const [X, Yy] of pxs) {
      out.px(X, Yy, 0xffb060);
      out.px(X, Yy - 1, 0xc84a18, 0.4);
    }
    kit.wave([kit.frame(out)], [[0, x0, U(y0), ph]], { w: 1.3, a0: 0, a1: 0.55, pw: 2 });
  };

  // the turrets' pads: kept clear of everything, bare earth where a living jar stands
  const pads = stage.waves.filter((w) => w.type === 'turret').map((w) => ({ x: w.x, u: Math.round(anchor + V * w.t + 10) }));
  for (const p of pads) k.reserve(p.x - 10, Y(p.u) - 10, 21, 21);
  k.pads = pads;

  // ------------------------------------------------------------ land and water, in fine pixels
  const nRow = new Float32Array(W);
  for (let Yy = 0; Yy < FH; Yy++) {
    const y = (Yy + 0.5) / S;
    const u = L - y;
    if (Yy % S === 0) for (let x = 0; x < W; x++) nRow[x] = 0.2 + fbm(x, Math.floor(y), { seed: 17, scale: 7, octaves: 2 }) * 0.65;
    const river = u > RIVER[0] && u < RIVER[1];
    for (let X = 0; X < FW; X++) {
      const i = Yy * FW + X;
      const d = shoreD[i];
      if (fineWater[i]) {
        if (river) continue; // (painted with the river)
        // shallows over the black sand near the shore, foam on it, thinning out into the bay
        if (d < 3) img.px(X, Yy, 0xdce4e0, 0.8 - d * 0.2);
        else if (d < 22) {
          const c = rampColor([0x1e4a54, 0x2a5e66, 0x3a7076], 1 - d / 22, X, Yy);
          if (hashPx(X, Yy, 18) < 1 - d / 26) img.px(X, Yy, c, 0.55);
        }
        continue;
      }
      const x = (X + 0.5) / S;
      const cell = Math.floor(x);
      const n = nRow[cell];
      const g = hashPx(X, Yy, 19);
      let c;
      if (u < CITY[1] + 50) {
        c = k.pavePx(X, Yy, [0x7e7a72, 0x8c8880, 0x9a968c]);
      } else if (u < COAST[1]) {
        c = k.lawnPx(X, Yy, n, [0x3e5a34, 0x4c6c3c, 0x5e7e48, 0x74905a], true);
      } else if (u < ISLAND[0]) {
        c = k.lawnPx(X, Yy, n, [0x4a5a3a, 0x5a6a44, 0x6c7c50], true);
      } else if (u > LAVA[0] + (fbm(x, 7, { seed: 19, scale: 20 }) - 0.5) * 140) {
        c = lavaPx(k, X, Yy, x, y, u);
      } else {
        // Sakurajima's ash soil, raked by the wind
        c = rampColor(ASH, n * 0.8 + (hashPx(X >> 3, Yy >> 1, 20) - 0.5) * 0.26, X, Yy);
        if (g < 0.08) c = scaleColor(c, 0.88);
      }
      if (d <= 6) {
        // the edge: a sea wall on the mainland, black sand on the island
        if (u > ISLAND[0]) c = rampColor([0x2a2624, 0x3a3432, 0x4c4644], 0.2 + hashPx(X >> 1, Yy >> 1, 21) * 0.6, X, Yy);
        else if (u > SENGAN[0]) c = d < 2 ? 0x6a6a66 : X % 12 === 0 ? 0x7a7a76 : Yy % 9 === 0 ? 0x7a7a76 : 0x9a968e;
      }
      img.px(X, Yy, c);
    }
  }

  paintCity(k);
  paintSengan(k);
  paintCoast(k);
  paintBay(k);
  paintIsland(k);
  paintLava(k);
  paintCrater(k);
  // a few patches of the glowing cracks breathe on their own
  for (let i = 0; i < 12; i++) {
    const uc = 6000 + i * 80;
    const xc = 20 + ((i * 67) % 140);
    const yc = Y(uc) * S;
    const patch = LIT.filter(([X, Yy]) => Math.abs(X - xc * S) < 72 && Math.abs(Yy - yc) < 72);
    k.breathe(patch, i * 1.7);
  }
  paintTraffic(k);

  // the jars' pads, the very last thing on the ground
  k.late.push(() => {
    for (const p of pads) {
      const y = Y(p.u);
      img.fine(p.x - 10, y - 10, 21, 21, (X, Yy, x, yy) => {
        const dd = Math.hypot(x - p.x, yy - y);
        if (dd > 9.6) return null;
        if (p.u < RIVER[0]) {
          // in the city: a stone-paved circle round a little planting
          if (dd > 8.8) return C.granite[1];
          return k.settPx(X, Yy, 24, C.granite);
        }
        const ramp = p.u > ISLAND[0] ? [0x34302c, 0x443e38, 0x544e46] : [0x4a3a2a, 0x5a4834, 0x6a5840];
        if (dd > 8.6) return hashPx(X >> 1, Yy >> 1, 22) < 0.5 ? scaleColor(ramp[0], 0.8) : scaleColor(ramp[1], 0.9);
        return rampColor(ramp, 0.2 + fbm(x, yy, { seed: 2, scale: 3 }) * 0.5 + (hashPx(X, Yy, 25) - 0.5) * 0.2, X, Yy);
      });
    }
    // ash on everything: a fine grey dust over land, roofs and streets, thicker towards the volcano
    const d = img.hi.data;
    const crowns = k.crownMask;
    for (let Yy = 0; Yy < FH; Yy++) {
      const u = L - Yy / S;
      const amt = 0.012 + smooth(0, 5400, u) * 0.03;
      for (let X = 0; X < FW; X++) {
        if (fineWater[Yy * FW + X] || crowns[Yy * FW + X]) continue;
        const q = (Yy * FW + X) * 4;
        if (d[q + 3] !== 255) continue;
        const g = hashPx(X, Yy, 23);
        if (g < amt + 0.06 && g < amt + Math.max(0, fbm(X >> 3, Yy >> 3, { seed: 7, scale: 6 }) - 0.5) * 0.24) {
          for (let j = 0; j < 3; j++) d[q + j] += (0x86 - d[q + j]) * 0.34;
        }
      }
    }
  });

  const { strip, canvas, props, tint } = k.finish();
  void canvas;
  return { strip, props, meta: { width: W, artScale: S, chunkHeight: 896, chunks: 8, length: L, sway: true, tint } };
}
void BAY;
