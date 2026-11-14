// The arena of encounter 7 (ex7): Hokusai's Kirifuri Waterfall at Mount Kurokami (c. 1832, from A Tour of the
// Waterfalls of the Provinces, long in the public domain), gone weepy: the falls pour in long fingers of water down a
// blue-green cliff of angular rock, but they spring from two great eyes squeezed shut at the top of the cliff; the
// tiny pilgrims at the foot look up at it under umbrellas. The strip creeps up the falls to the eyes.
import { Raster, fbm, rng, mix } from '../../lib/raster.mjs';
import { rampColor, grade } from '../nature.mjs';
import { tintTable } from '../props.mjs';

export const S = 3;
const W = 180;
const L = 896;
const FW = W * S;
const FH = L * S;
const SKY = [0xb8b49a, 0xccc8ae, 0xdedac0, 0xece8d0];
const ROCK = [0x1a3a3a, 0x2a5a52, 0x3a7a6a, 0x6a9a82];
const WATER = [0x4a7ab0, 0x7aa8d8, 0xb8d8f0, 0xf0f8ff];

export function buildFar() {
  const r = new Raster(FW, 1152);
  for (let y = 0; y < r.h; y++) for (let x = 0; x < FW; x++) r.set(x, y, rampColor(SKY, 0.5 + (fbm(x, y, { seed: 3, scale: 40, periodX: FW, periodY: 1152 }) - 0.5) * 0.3, x, y));
  return r;
}

export function buildMid() {
  const img = new Raster(FW, FH);
  const rand = rng(29);
  const set = (x, y, c, a = 1) => img.set(x, y, c, a);
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) set(x, y, rampColor(SKY, 0.55 + (fbm(x * 0.6, y * 0.2, { seed: 4, scale: 10 }) - 0.5) * 0.2, x, y));
  // the cliff: the whole width but a margin of sky, in Hokusai's angular slabs, each a shade off its neighbour
  const edge = (y, side) => (side < 0 ? 30 + Math.sin(y * 0.004) * 24 + Math.sin(y * 0.017) * 10 : FW - 30 - Math.sin(y * 0.005 + 1) * 24 - Math.sin(y * 0.021) * 10);
  for (let y = 300; y < FH; y++)
    for (let x = 0; x < FW; x++) {
      if (x < edge(y, -1) || x > edge(y, 1)) continue;
      const slab = Math.floor((x * 0.8 + y * 0.5) / 70) * 7 + Math.floor((x * -0.6 + y) / 90);
      const v = 0.3 + ((slab * 37) % 11) / 22 + (fbm(x, y, { seed: 7, scale: 9 }) - 0.5) * 0.2;
      set(x, y, rampColor(ROCK, v, x, y));
      if ((x * 0.8 + y * 0.5) % 70 < 2 || (x * -0.6 + y) % 90 < 2) set(x, y, 0x10201e);
    }
  // the eyes at the top of the cliff, squeezed shut, brows up
  const ey = 420;
  for (const sx of [-1, 1]) {
    const ex = FW / 2 + sx * 110;
    for (let k = -50; k <= 50; k++) for (let w = 0; w < 7; w++) set(ex + k, ey + Math.abs(k) * -0.35 + 18 + w, 0x0e1a1a); // the shut lid, an arch
    for (let k = -46; k <= 46; k++) for (let w = 0; w < 9; w++) set(ex + k, ey - 70 + (k * sx) * -0.25 + w, 0x0e1a1a); // the brow, inner end up
  }
  // the falls: long fingers of water from under each eye, widening, all the way down
  for (const sx of [-1, 1]) {
    const ex = FW / 2 + sx * 110;
    for (let f = 0; f < 7; f++) {
      const x0 = ex - 36 + f * 12;
      const wob = rand() * 10;
      for (let y = ey + 30; y < FH; y++) {
        const t = (y - ey) / (FH - ey);
        const x = x0 + (x0 - ex) * t * 1.8 + Math.sin(y * 0.01 + wob) * 6;
        const w = 4 + t * 10;
        for (let i = -w; i <= w; i++) set(x + i, y, rampColor(WATER, 0.55 + (Math.abs(i) < w * 0.3 ? 0.3 : 0) - Math.abs(i) / w * 0.2 + Math.sin(y * 0.2 + f) * 0.05, x + i, y));
      }
    }
  }
  // the spray at the foot, the pool; pilgrims with umbrellas looking up
  for (let y = FH - 300; y < FH; y++) for (let x = 0; x < FW; x++) if (y > FH - 220 + Math.sin(x * 0.05) * 10) set(x, y, rampColor(WATER, 0.6 + (fbm(x, y, { seed: 9, scale: 8 }) - 0.5) * 0.4, x, y));
  for (let k = 0; k < 4; k++) {
    const px = 60 + k * 40;
    const py = FH - 250;
    for (let j = 0; j < 22; j++) for (let i = -4; i <= 4; i++) set(px + i, py + j, 0x2a2a3a);
    for (let j = 0; j < 12; j++) for (let i = -16 + j; i <= 16 - j; i++) set(px + i, py - 10 + j, [0xd02a26, 0xe0c890, 0x3a5a9a, 0xe0c890][k]);
  }
  grade(img, { sat: 0.8, bright: 0.66, tint: 0x203040, tintAmt: 0.08 });
  return {
    strip: img,
    props: null,
    meta: { width: W, artScale: S, chunkHeight: L, chunks: 1, length: L, tint: tintTable(L, () => [255, 255, 255]) },
  };
}
