// The arena of encounter 2 (ex2): the Tōkaidō of Hiroshige's Fifty-three Stations (1833-34, long in the public
// domain), seen from above and gone modern: the old highway between Edo and Kyoto in ochre earth, lined with its
// pines, between paddies shaded in the prints' bokashi blues and greens, thatched teahouses and a river with its
// wooden bridge; down its middle someone has painted lane lines. The far layer is a seamless loop that races by
// (the chase); the middle layer only holds the start: Nihonbashi, the bridge in Edo where the road begins, with a
// daimyō's procession setting out over it, as in the first print of the series.
import { Raster, fbm, rng, mix, scaleColor } from '../../lib/raster.mjs';
import { rampColor, grade } from '../nature.mjs';
import { tintTable } from '../props.mjs';

export const S = 3;
const W = 180;
const L = 896;
const FW = W * S;
const FAR_H = 1152;

const EARTH = [0x8a6a40, 0xa8845a, 0xc4a070, 0xd8bc8c];
const PADDY = [0x2a5a4a, 0x3a7a5a, 0x5a9a6a, 0x8ab884];
const SKYWATER = [0x1a3a6a, 0x2a5a9a, 0x5a8ac0, 0xa8c8e4];
const PINE = [0x16301e, 0x22462a, 0x345e36, 0x4a7a44];
const INK = 0x1a1420;
const ROAD0 = 186;
const ROAD1 = 354; // the road's edges (fine px)

const per = (x, y, o) => fbm(x, y, { periodX: FW, periodY: FAR_H, ...o });

export function buildFar() {
  const r = new Raster(FW, FAR_H);
  const rand = rng(53);
  // the paddies either side, in strips, each shaded in bokashi from one edge, the bunds between them
  for (let y = 0; y < FAR_H; y++)
    for (let x = 0; x < FW; x++) {
      const strip = Math.floor(y / 96);
      const t = (y % 96) / 96;
      const n = per(x, y, { seed: 5, scale: 30 }) - 0.5;
      let c = rampColor(strip % 3 === 0 ? SKYWATER : PADDY, 0.25 + t * 0.6 + n * 0.25, x, y);
      if (y % 96 < 3 || (x % 135 < 3 && x < ROAD0 - 20)) c = EARTH[1];
      r.set(x, y, c);
    }
  // a river across, with its wooden bridge where the road crosses
  const ry = 700;
  for (let y = ry - 34; y < ry + 34; y++)
    for (let x = 0; x < FW; x++) {
      const d = Math.abs(y - ry - Math.sin((x / FW) * Math.PI * 4) * 6);
      if (d > 30) continue;
      const w = per(x * 0.5, y * 2, { seed: 9, scale: 10 });
      r.set(x, y, d > 26 ? EARTH[0] : rampColor(SKYWATER, 0.3 + w * 0.5 + (w > 0.68 ? 0.3 : 0), x, y));
    }
  // the road: packed ochre earth with ruts and the lane lines someone has painted on it
  for (let y = 0; y < FAR_H; y++)
    for (let x = ROAD0; x < ROAD1; x++) {
      const bridge = Math.abs(y - ry) < 30;
      const n = per(x, y, { seed: 13, scale: 6 }) - 0.5;
      let c = bridge ? ((y - ry + 60) % 9 < 1 ? 0x3a2a1a : rampColor(EARTH, 0.35 + n * 0.3, x, y)) : rampColor(EARTH, 0.55 + n * 0.35, x, y);
      if (!bridge && (Math.abs(x - 222) < 5 || Math.abs(x - 318) < 5)) c = scaleColor(c, 0.88); // the ruts
      if (!bridge && Math.abs(x - 270) < 3 && y % 60 < 34) c = 0xf0ece0; // the centre line
      if (!bridge && (Math.abs(x - ROAD0 - 6) < 2 || Math.abs(x - ROAD1 + 6) < 2)) c = 0xe8e0c8; // the edge lines
      if (x - ROAD0 < 3 || ROAD1 - x < 4) c = EARTH[0];
      r.set(x, y, c);
    }
  // the bridge's rails
  for (const yy of [ry - 30, ry + 28]) for (let x = ROAD0 - 6; x < ROAD1 + 6; x++) for (let k = 0; k < 3; k++) r.set(x, yy + k, k === 1 ? 0x6a4a2a : 0x3a2a1a);
  // the pines lining the road, Hiroshige's: dark clumps on bent trunks, their shadows on the road
  const pine = (cx, cy, sz) => {
    for (let j = -sz; j <= sz; j++) for (let i = -sz; i <= sz; i++) if ((i / sz) ** 2 + (j / sz) ** 2 < 1) r.set(cx + i + sz * 0.6, cy + j + sz * 0.7, mix(r.get(cx + i + sz * 0.6, cy + j + sz * 0.7), 0x101810, 0.45));
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      const px = cx + Math.cos(a) * sz * 0.55;
      const py = cy + Math.sin(a) * sz * 0.45;
      const rr = sz * 0.5;
      for (let j = -rr; j <= rr; j++)
        for (let i = -rr; i <= rr; i++) {
          if (i * i + j * j > rr * rr) continue;
          const v = 0.55 - (i + j) / (rr * 4) + (per(px + i, py + j, { seed: 17, scale: 3 }) - 0.5) * 0.5;
          r.set(px + i, py + j, rampColor(PINE, v, px + i, py + j));
        }
    }
  };
  for (let y = 20; y < FAR_H; y += 64) {
    if (Math.abs(y - ry) < 50) continue;
    pine(ROAD0 - 22 + rand() * 6, y + rand() * 10, 15 + rand() * 4);
    pine(ROAD1 + 18 + rand() * 6, y + 30 + rand() * 10, 15 + rand() * 4);
  }
  // thatched teahouses by the road (from above: a ridge, two slopes of straw)
  for (const [hx, hy, w, h] of [[60, 220, 80, 50], [430, 480, 70, 46], [70, 980, 90, 54], [420, 1060, 76, 48]])
    for (let y = hy; y < hy + h; y++)
      for (let x = hx; x < hx + w; x++) {
        const t = (y - hy) / h;
        const c = rampColor([0x6a5030, 0x9a7a48, 0xc4a468, 0xe0c890], t < 0.5 ? 0.75 - t * 0.6 : 0.35 + (t - 0.5) * 0.3, x, y);
        r.set(x, y, Math.abs(t - 0.5) < 0.04 ? 0x4a3420 : c);
      }
  // travellers on the road's verges, as in the prints: straw hats from above (a pale disc with a dark rim), a
  // bundle on a pole, now and then a palanquin with its two bearers; a milestone stone
  const tr = rng(1834);
  for (let k = 0; k < 22; k++) {
    const x = tr() < 0.5 ? ROAD0 + 14 + tr() * 10 : ROAD1 - 24 + tr() * 10;
    const y = tr() * FAR_H;
    if (Math.abs(y - ry) < 40) continue;
    for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) {
      const d = Math.hypot(i, j);
      if (d < 6) r.set(x + i, y + j, d > 4.8 ? 0x6a5030 : mix(0xe0c890, 0xa8884a, (i + j + 12) / 24));
    }
    if (k % 3 === 0) for (let i = -10; i <= 10; i++) r.set(x + i, y + 8, 0x4a3420);
  }
  for (const y of [140, 600]) for (let j = 0; j < 14; j++) for (let i = 0; i < 9; i++) r.set(ROAD1 + 4 + i, y + j, j === 0 || i === 0 ? 0x5a5650 : 0x9a968e);
  grade(r, { sat: 0.82, bright: 0.86, tint: 0x182030, tintAmt: 0.05 });
  return r;
}

export function buildMid() {
  const img = new Raster(FW, L * S); // transparent, but for the start
  // Nihonbashi: the arched wooden bridge across the bottom of the first screen, the canal under it, the
  // procession setting out over it (banners, spears, the palanquin), the gate posts at its end
  const by = L * S - 300; // the bridge's middle
  for (let y = by - 120; y < by + 120; y++)
    for (let x = 0; x < FW; x++) {
      const d = Math.abs(y - by);
      const canal = d > 60;
      const w = fbm(x * 0.4, y * 1.5, { seed: 23, scale: 9 });
      let c = canal ? rampColor(SKYWATER, 0.3 + w * 0.5 + (w > 0.7 ? 0.3 : 0), x, y) : (y - by + 66) % 10 < 1 ? 0x3a2a1a : rampColor(EARTH, 0.4 + (60 - d) / 300 + (w - 0.5) * 0.2, x, y);
      if (!canal && d > 52) c = (x % 22 < 4) ? 0x3a2a1a : 0x8a5a30; // the rails, their posts
      img.set(x, y, c);
    }
  // the procession: a line of little figures over the bridge, banners on poles, the palanquin in the middle
  const pr = rng(1603);
  for (let k = 0; k < 30; k++) {
    const x = 30 + k * 16 + pr() * 4;
    const y = by - 20 + (k % 3) * 14 + pr() * 4;
    for (let j = -4; j <= 4; j++) for (let i = -3; i <= 3; i++) if (i * i / 9 + j * j / 16 < 1) img.set(x + i, y + j, k % 5 === 0 ? 0x7a1a14 : 0x2a2a3a);
    for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (i * i + j * j < 5) img.set(x + i, y - 6 + j, 0x1a1414);
    if (k % 4 === 1) {
      for (let j = 0; j < 22; j++) img.set(x + 4, y - 4 - j, 0x3a2a1a);
      for (let j = 0; j < 9; j++) for (let i = 0; i < 6; i++) img.set(x + 5 + i, y - 24 + j, j === 0 ? INK : 0xf0ece0);
    }
  }
  for (let y = by - 12; y < by + 12; y++) for (let x = 250; x < 290; x++) img.set(x, y, Math.abs(y - by) > 9 || Math.abs(x - 270) > 17 ? INK : 0x1a1a24); // the palanquin
  // (no moving parts here: the fight's own cars, cones and skid marks are what moves)
  grade(img, { sat: 0.82, bright: 0.86, tint: 0x182030, tintAmt: 0.05 });
  return {
    strip: img,
    props: null,
    meta: { width: W, artScale: S, chunkHeight: L, chunks: 1, length: L, tint: tintTable(L, () => [255, 255, 255]) },
  };
}
