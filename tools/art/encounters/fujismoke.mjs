// The arena of encounter 4 (ex4): Hokusai's Dragon of Smoke Escaping from Mount Fuji (1849, long in the public
// domain), gone feline: from the snowy crater a column of ink-dark smoke climbs and coils up the sky, and where the
// dragon would be it ends in a cat's head, ears and whiskers of smoke; Hokusai's banded clouds across the dusk.
// The strip creeps up through the fight, from the mountain to the smoke-cat's head.
import { Raster, fbm, rng, mix } from '../../lib/raster.mjs';
import { rampColor, grade } from '../nature.mjs';
import { tintTable } from '../props.mjs';

export const S = 3;
const W = 180;
const L = 896;
const FW = W * S;
const FH = L * S;
const SKY = [0x8a8070, 0xa89a84, 0xc4b69c, 0xd8ccb0];
const FUJI = [0x1a2a4a, 0x2a4070, 0x3a5a90, 0x6a8ab8];
const SMOKE = [0x564c46, 0x6a6058, 0x80766a, 0x988c7e]; // (lighter than Hokusai's ink, so the cat and the shots read over it)

export function buildFar() {
  const r = new Raster(FW, 1152);
  for (let y = 0; y < r.h; y++) for (let x = 0; x < FW; x++) r.set(x, y, rampColor(SKY, 0.55 + (fbm(x, y, { seed: 3, scale: 40, periodX: FW, periodY: 1152 }) - 0.5) * 0.3, x, y));
  return r;
}

export function buildMid() {
  const img = new Raster(FW, FH);
  // the dusk sky, darker towards the top, paper grain
  for (let y = 0; y < FH; y++)
    for (let x = 0; x < FW; x++) {
      const n = fbm(x * 0.7, y * 0.1, { seed: 5, scale: 8 }) - 0.5;
      img.set(x, y, rampColor(SKY, 0.78 - Math.max(0, 1600 - y) / 2600 + n * 0.12, x, y));
    }
  // Hokusai's clouds: long bands with scalloped edges, here and there
  const band = (y0, x0, x1, h) => {
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x1; x++) {
        const edge = y - y0 < 6 + Math.abs(Math.sin(x * 0.08)) * 8 || y0 + h - y < 4;
        if (y - y0 < Math.abs(Math.sin(x * 0.08)) * 8) continue;
        img.set(x, y, edge ? 0x8a7a64 : mix(0xe8dcc0, 0xd0c4a8, (y - y0) / h));
      }
  };
  for (const [y, x0, x1, h] of [[300, 20, 300, 40], [620, 260, 540, 36], [1000, 0, 220, 44], [1350, 300, 540, 34], [1700, 40, 260, 30]]) band(y, x0, x1, h);
  // Fuji: the great cone at the bottom, its snow, the crater at the top with the smoke pouring out
  const [px, py] = [300, 2040];
  for (let y = py; y < FH; y++) {
    const t = (y - py) / (FH - py);
    const half = 40 + t * 420;
    for (let x = Math.floor(px - half); x <= px + half; x++) {
      if (x < 0 || x >= FW) continue;
      const snow = y < py + 120 + Math.sin(x * 0.12) * 18 + Math.sin(x * 0.04) * 12;
      const lit = x < px;
      img.set(x, y, snow ? (lit ? 0xf4f2e8 : 0xb8bcc4) : rampColor(FUJI, (lit ? 0.5 : 0.25) + (fbm(x, y, { seed: 7, scale: 12 }) - 0.5) * 0.2 - t * 0.15, x, y));
    }
  }
  // the smoke: a thick column out of the crater, coiling up the sky in a long S, ending in a cat's head
  const path = [];
  let x = px;
  let y = py + 10;
  for (let k = 0; k < 520; k++) {
    const t = k / 520;
    x = px + Math.sin(t * 9) * (40 + t * 120) * (t < 0.08 ? t / 0.08 : 1) - t * 60;
    y = py + 10 - k * 3.4;
    path.push([x, y, 26 + t * 30]);
  }
  for (const [qx, qy, r] of path)
    for (let j = -r; j <= r; j += 1)
      for (let i = -r; i <= r; i += 1) {
        const d = Math.hypot(i, j) / r;
        const n = fbm(qx + i, qy + j, { seed: 11, scale: 7 });
        if (d > 0.7 + n * 0.45) continue;
        img.set(qx + i, qy + j, rampColor(SMOKE, 0.25 + n * 0.6 - d * 0.2, qx + i, qy + j));
      }
  // the head of smoke at the top: ears, eyes as gaps of sky, whiskers trailing
  const [hx, hy] = path[path.length - 1];
  for (let j = -110; j <= 110; j++)
    for (let i = -130; i <= 130; i++) {
      const n = fbm(hx + i, hy + j, { seed: 13, scale: 9 });
      const inHead = (i / 120) ** 2 + (j / 95) ** 2 < 0.85 + n * 0.3;
      const ear = [-1, 1].some((sx) => j < -40 && j > -130 && Math.abs(i - sx * 75) < (j + 130) * 0.45);
      if (!inHead && !ear) continue;
      img.set(hx + i, hy + j, rampColor(SMOKE, 0.3 + n * 0.5, hx + i, hy + j));
    }
  for (const sx of [-1, 1]) {
    for (let j = -14; j <= 14; j++) for (let i = -20; i <= 20; i++) if ((i / 20) ** 2 + (j / 12) ** 2 < 1 && Math.abs(i) > 3 * (1 - Math.abs(j) / 12)) img.set(hx + sx * 45 + i, hy - 5 + j, 0xe8c050);
    for (const dy of [-12, 0, 12]) for (let k = 0; k < 140; k++) for (let w = 0; w < 3; w++) img.set(hx + sx * (70 + k), hy + 40 + dy + k * dy * 0.02 + Math.sin(k * 0.1) * 4 + w, SMOKE[1]);
  }
  grade(img, { sat: 0.8, bright: 0.86, tint: 0x182030, tintAmt: 0.05 });
  return {
    strip: img,
    props: null,
    meta: { width: W, artScale: S, chunkHeight: L, chunks: 1, length: L, tint: tintTable(L, () => [255, 255, 255]) },
  };
}
