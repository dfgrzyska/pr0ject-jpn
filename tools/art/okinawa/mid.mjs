// Middle layer (Okinawa), at 3x the game's resolution: the Kerama islands and the resort beach (sea.mjs), Bise under its fukugi
// trees, the cane fields and the sugar mill (bise.mjs), Naha's tomb hillside, Tsuboya, Makishi market and Kokusai-dōri with its
// eisa parade (naha.mjs), Shuri castle, the Yanbaru forest and the Kōri bridge (north.mjs), then the open sea and the lighthouse
// island (sea.mjs). Water away from the coast stays transparent: the far layer is the deep ocean.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeCanvas, S, hashPx, scaleColor, rampColor, fbm, mix } from '../nagasaki/canvas.mjs';
import { W, L, isWater, landD, shallowS, reefD, kindAt, beachW, KIND, VILLAGE, FIELDS, NAHA, SHURI, JUNGLE, MAIN_S } from './geo.mjs';
import { C, tools } from './common.mjs';
import { paintKerama, paintResort, paintOpenSea, paintLiveSea } from './sea.mjs';
import { paintBise, paintFields } from './bise.mjs';
import { paintNaha } from './naha.mjs';
import { paintShuri, paintYanbaru, paintKori } from './north.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export { W, L };
export { buildFar } from './far.mjs';

// a bright subtropical day, a little more gold towards the far end
const TOD = [
  [0, [0.92, 0.94, 0.94], 0x102030, 0.05],
  [4600, [0.93, 0.93, 0.9], 0x182030, 0.05],
  [L, [0.94, 0.9, 0.84], 0x302420, 0.06],
];
const CORAL = [0x6a5a48, 0x8a5a62, 0x5a6a4a, 0x9a7a5a, 0xa86a5a, 0x6a7a6a];

export function buildMid() {
  const stage = JSON.parse(readFileSync(join(root, 'src', 'data', 'stage2.json'), 'utf8'));
  const { mid: V, anchor } = stage.scroll;
  const k = makeCanvas(1879, { isWater, tod: TOD, night: () => 0, ridge: L });
  k.t = tools(k);
  const { img, Y, FW, FH, fineWater } = k;

  // the turrets' pads stay clear of everything; those under a building are left to the building
  const pads = stage.waves.filter((w) => w.type === 'turret').map((w) => ({ x: w.x, u: Math.round(anchor + V * w.t + 10) }));
  for (const p of pads) k.reserve(p.x - 11, Y(p.u) - 11, 23, 23);
  k.pads = pads;

  // ------------------------------------------------------------ water, beaches, ground, in fine pixels
  const GRASS2 = [0x2e5824, 0x3c6c2a, 0x508232, 0x68983e];
  for (let Yy = 0; Yy < FH; Yy++) {
    const y = (Yy + 0.5) / S;
    const u = L - y;
    for (let X = 0; X < FW; X++) {
      const x = (X + 0.5) / S;
      const d = landD(x, u);
      if (fineWater[Yy * FW + X]) {
        const s = shallowS(x, u);
        if (s <= 0) continue;
        // the clear water over sand: ripples of light, a darker drop-off, the reef showing through
        const caust = fbm(x * 1.3, y, { seed: 13, scale: 6, octaves: 2 });
        const net = Math.abs(fbm(x, y * 1.2, { seed: 14, scale: 3.6, octaves: 2 }) - 0.5);
        let c = rampColor(C.lagoon, Math.min(1, s * 0.95 + (caust - 0.5) * 0.18), X, Yy);
        if (net < 0.016 && s > 0.3) c = scaleColor(c, 1.2);
        if (s > 0.72 && Math.sin(y * 2.2 + caust * 9) > 0.86) c = scaleColor(c, 1.08);
        const rd = reefD(x, u);
        if (rd > 1.5 && s > 0.42) {
          const cn = fbm(x, y, { seed: 87, scale: 2.2, octaves: 3 });
          if (cn > 0.56) {
            const pick = CORAL[Math.floor(fbm(x, y, { seed: 88, scale: 4 }) * 13) % CORAL.length];
            const brain = hashPx(X >> 1, Yy >> 1, 90);
            c = mix(c, brain < 0.3 ? scaleColor(pick, 1.3) : brain > 0.8 ? scaleColor(pick, 0.7) : pick, cn > 0.66 ? 0.62 : 0.38);
          } else if (cn < 0.3) c = scaleColor(c, 1.14);
        }
        if (d > -1.5) {
          // the surf line, foam broken into lace
          const lace = hashPx(X >> 1, Yy >> 1, 91);
          c = d > -0.8 || lace < 0.55 ? C.foam : mix(c, C.foam, 0.5);
        } else if (d > -3.4 && hashPx(X, Yy >> 1, 92) < 0.1) c = mix(c, C.foam, 0.5);
        img.px(X, Yy, c, s < 0.35 ? (s / 0.35) ** 1.3 : 1);
        continue;
      }
      const kind = kindAt(x, u);
      const bw = beachW(kind);
      if (d <= bw) {
        const n = fbm(x, y, { seed: 11, scale: 5, octaves: 2 });
        let c;
        if (kind === KIND.cliff || (kind === KIND.kerama && fbm(x, u, { seed: 89, scale: 9 }) > 0.5)) {
          // limestone: pitted, lit on its upper left, darker at the water
          const pit = hashPx(X >> 1, Yy >> 1, 93);
          c = rampColor(C.rock, 0.2 + (d / bw) * 0.6 + (n - 0.5) * 0.5 + (pit - 0.5) * 0.3, X, Yy);
          if (pit > 0.94) c = scaleColor(c, 0.6);
        } else {
          const ramp = kind === KIND.kerama || kind === KIND.sand ? C.whiteSand : C.sand;
          c = d < 2.4 ? (kind === KIND.kerama || kind === KIND.sand ? 0xd0ccba : 0xb6a47a) : rampColor(ramp, 0.3 + n * 0.55, X, Yy);
          // wrack along the tide line, footprints and shell-grit higher up
          if (d >= 2.4 && d < 3.4 && hashPx(X >> 1, Yy, 94) < 0.3) c = scaleColor(c, 0.8);
          const g = hashPx(X, Yy, 95);
          if (g < 0.04) c = scaleColor(c, 0.92);
          else if (g > 0.985) c = 0xfaf6ea;
        }
        img.px(X, Yy, c);
        continue;
      }
      // the ground, section by section
      let c;
      const nn = fbm(x, y, { seed: 21, scale: 8, octaves: 2 });
      if (u < VILLAGE[0]) c = k.lawnPx(X, Yy, 0.2 + nn * 0.65, C.grass, true);
      else if (u < VILLAGE[1]) {
        const g2 = fbm(x, y, { seed: 53, scale: 4, octaves: 2 });
        c = g2 > 0.42 || hashPx(X >> 1, Yy >> 1, 54) < g2 ? k.lawnPx(X, Yy, 0.15 + g2 * 0.6, C.scrub, true) : rampColor(C.lane, 0.06 + g2 * 0.3, X, Yy);
      }
      else if (u < FIELDS[1]) c = rampColor(C.redEarth, 0.2 + nn * 0.7, X, Yy);
      else if (u < NAHA[1]) continue; // (Naha lays its own)
      else if (u < SHURI[1]) c = k.lawnPx(X, Yy, 0.2 + nn * 0.65, GRASS2, true);
      else c = k.lawnPx(X, Yy, 0.15 + nn * 0.55, C.scrub, true);
      img.px(X, Yy, c);
    }
  }

  paintKerama(k);
  paintResort(k);
  paintBise(k);
  paintFields(k);
  paintNaha(k);
  paintShuri(k);
  paintYanbaru(k);
  paintKori(k);
  paintOpenSea(k);
  paintLiveSea(k);

  // ------------------------------------------------------------ whatever land is left grows
  const plants = (u) => {
    if (u < MAIN_S - 30) return [['tropic', 0.55], ['fern', 0.85], ['palm', 1]]; // the Kerama forest
    if (u < MAIN_S + 400) return [['palm', 0.45], ['hibiscus', 0.65], ['tropic', 1]];
    if (u < VILLAGE[1]) return [['fukugi', 0.5], ['tropic', 0.8], ['banana', 1]];
    if (u < NAHA[1]) return [['tropic', 0.5], ['fukugi', 0.8], ['hibiscus', 1]];
    if (u < SHURI[1]) return [['tropic', 0.5], ['fukugi', 0.8], ['palm', 1]];
    if (u < JUNGLE[1] + 50) return [['tropic', 0.45], ['fern', 0.8], ['banana', 0.9], ['palm', 1]];
    return [['palm', 0.34], ['tropic', 0.8], ['hibiscus', 1]];
  };
  const RADIUS = { palm: [5.5, 7.5], tropic: [5, 8], fukugi: [4, 5.5], fern: [4, 6], banana: [3.5, 5], hibiscus: [3, 4.5] };
  const g = k.rand;
  for (let y0 = 0; y0 < L; y0 += 7)
    for (let x0 = -2; x0 < W + 2; x0 += 7) {
      const x = x0 + g() * 7;
      const y = y0 + g() * 7;
      const u = L - y;
      if (x < 0 || x >= W || y >= L || landD(x, u) < 10 || kindAt(x, u) === KIND.sand) continue;
      if ((u > VILLAGE[0] && u < NAHA[0]) || (u > JUNGLE[0] && u < JUNGLE[1] + 14)) continue; // the villages, fields and the forest plant their own
      const ks = plants(u);
      const roll = g();
      const kind = ks.find(([, p]) => roll < p)[0];
      const [r0, r1] = RADIUS[kind];
      const r = r0 + g() * (r1 - r0);
      const q = r * 0.6;
      if (k.isRes(x, y) || k.isRes(x - q, y) || k.isRes(x + q, y) || k.isRes(x, y - q) || k.isRes(x, y + q)) continue;
      if (g() < (u > JUNGLE[0] ? 0.05 : 0.3)) continue;
      k.t.plant(kind, x, y, r, Math.floor(g() * 1e8));
    }

  // the turrets' pads: dressed coral stone, drawn on the ground (a roof that stands over one hides it)
  for (const p of pads) {
    if (p.x === 90 && p.u === 3670) continue;
    const y = Y(p.u);
    img.fine(p.x - 11, y - 11, 22, 22, (X, Yy, xx, yy) => {
      const dd = Math.hypot(xx - p.x, yy - y);
      if (dd > 10) return null;
      if (dd > 8.8) return hashPx(X >> 2, Yy >> 2, 2) < 0.5 ? C.coral[1] : C.coral[0];
      const ring = Math.floor(dd / 2.2);
      const ang = Math.atan2(yy - y, xx - p.x);
      const seg = (ang + 3.15) * (2 + ring * 2.4);
      if (dd % 2.2 < 0.3 || seg % 1 < 0.1) return C.coral[0];
      return rampColor(C.coral, 0.25 + hashPx(ring, Math.floor(seg), 3) * 0.6, X, Yy);
    });
  }

  const { strip, props, tint } = k.finish();
  return { strip, props, meta: { width: W, artScale: S, chunkHeight: 896, chunks: 8, length: L, sway: true, tint } };
}
void SHURI;
