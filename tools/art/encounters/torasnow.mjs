// The arena of encounter 6 (ex6): Hokusai's Tiger in the Snow (1849, long in the public domain), gone grandma: a
// great tiger crouched in a snowy bamboo grove, head thrown back to roar at the falling snow, but with a tight
// purple perm; wrapped sweets lie about in the snow, a shopping trolley half buried. The strip creeps up the grove
// to the tiger.
import { Raster, fbm, rng, mix } from '../../lib/raster.mjs';
import { rampColor, grade } from '../nature.mjs';
import { tintTable } from '../props.mjs';

export const S = 3;
const W = 180;
const L = 896;
const FW = W * S;
const FH = L * S;
const SKY = [0x2a3040, 0x3a4256, 0x4a546a, 0x5a6680];
const SNOW = [0x8a94a8, 0xb0b8c8, 0xd0d6e0, 0xe8ecf2];
const TIGER = [0x6a3410, 0xa85a1a, 0xd8862e, 0xf0b060];
const PERM = [0x4a1a6a, 0x7a34a8, 0xa868d0, 0xd09af0];
const BAMBOO = [0x1a3a2a, 0x2a5a3a, 0x3a7a4a, 0x5a9a62];

export function buildFar() {
  const r = new Raster(FW, 1152);
  const rand = rng(4);
  for (let y = 0; y < r.h; y++) for (let x = 0; x < FW; x++) r.set(x, y, rampColor(SKY, 0.5 + (fbm(x, y, { seed: 3, scale: 50, periodX: FW, periodY: 1152 }) - 0.5) * 0.4, x, y));
  // the snow falling, far off: small soft flakes (dim, so they never pass for shots)
  for (let k = 0; k < 900; k++) {
    const x = Math.floor(rand() * FW);
    const y = Math.floor(rand() * r.h);
    r.set(x, y, 0x9aa4b8, 0.6);
    if (rand() < 0.3) r.set(x + 1, y, 0x9aa4b8, 0.4);
  }
  return r;
}

export function buildMid() {
  const img = new Raster(FW, FH);
  const rand = rng(17);
  const set = (x, y, c, a = 1) => img.set(x, y, c, a);
  // the night sky over the grove, the snowfield rising at the bottom in drifts
  for (let y = 0; y < FH; y++)
    for (let x = 0; x < FW; x++) {
      const drift = FH - 520 + Math.sin(x * 0.012) * 60 + Math.sin(x * 0.041) * 20;
      const n = fbm(x, y, { seed: 5, scale: 20 });
      set(x, y, y > drift ? rampColor(SNOW, 0.55 + n * 0.3 - (y - drift) / 3000, x, y) : rampColor(SKY, 0.45 + (n - 0.5) * 0.3 + y / FH * 0.2, x, y));
    }
  // bamboo up both sides, snow lying on the leaves
  for (const bx of [24, 70, 120, 430, 480, 516]) {
    const w = 10 + rand() * 6;
    for (let y = 0; y < FH; y++)
      for (let i = -w; i <= w; i++) {
        const node = y % 220 < 6;
        set(bx + i + Math.sin(y * 0.002 + bx) * 10, y, rampColor(BAMBOO, (node ? 0.2 : 0.55) - (i / w) * 0.3, bx + i, y));
      }
    for (let k = 0; k < 10; k++) {
      const ly = 80 + k * 260 + rand() * 60;
      const sx = bx < 270 ? 1 : -1;
      for (let j = 0; j < 70; j++) for (let t = -6; t <= 6; t++) {
        const x = bx + sx * j * 1.6;
        const y = ly + j * 0.6 + t * (1 - j / 70);
        set(x, y, t < -3 ? rampColor(SNOW, 0.8, x, y) : rampColor(BAMBOO, 0.45 + t * 0.02, x, y));
      }
    }
  }
  // the tiger: crouched in the drifts, body curving, head thrown back roaring at the snow
  const [tx, ty] = [280, FH - 600];
  const driftAt = (x) => FH - 520 + Math.sin(x * 0.012) * 60 + Math.sin(x * 0.041) * 20;
  // its tail, curling up behind, ringed
  for (let k = 0; k < 160; k++) {
    const a = k / 160;
    const cx = tx + 190 + Math.sin(a * 2.4) * 60;
    const cy = ty + 20 - a * 260;
    const r = 20 - a * 8;
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r) set(cx + i, cy + j, k % 32 < 9 ? 0x1a1014 : rampColor(TIGER, 0.55 - i / 60, cx + i, cy + j));
  }
  const inBody = (x, y) => ((x - tx) / 210) ** 2 + ((y - ty) / 120) ** 2 < 1;
  const inHead = (x, y) => ((x - (tx - 120)) / 80) ** 2 + ((y - (ty - 170)) / 90) ** 2 < 1;
  for (let y = ty - 300; y < ty + 140; y++)
    for (let x = tx - 230; x < tx + 230; x++) {
      if (x < 0 || x >= FW) continue;
      const b = inBody(x, y);
      const h = inHead(x, y);
      const neck = Math.abs(x - (tx - 120) - (y - ty) * 0.2) < 60 && y > ty - 170 && y < ty;
      if (!b && !h && !neck) continue;
      const n = fbm(x, y, { seed: 9, scale: 6 });
      const belly = b && y > ty + 50;
      // Hokusai's stripes: long dark flames across the body, curving round it
      const stripe = Math.sin((x - tx) * 0.045 + Math.sin(y * 0.03) * 1.6) > 0.72 && !belly;
      set(x, y, belly ? mix(0xe8d8b8, 0xc8b490, n) : stripe ? 0x1a1014 : rampColor(TIGER, 0.5 + n * 0.4 - (x - tx) / 900, x, y));
    }
  // its forepaws planted in the snow, toes
  for (const px of [tx - 170, tx - 80]) {
    for (let j = -22; j <= 22; j++) for (let i = -34; i <= 34; i++) if ((i / 34) ** 2 + (j / 22) ** 2 < 1) set(px + i, ty + 100 + j, rampColor(TIGER, 0.6 - j / 80, px + i, ty + 100 + j));
    for (const dx of [-14, 0, 14]) for (let j = 0; j < 10; j++) set(px + dx, ty + 112 + j, 0x1a1014);
  }
  // the snow drifted up round its belly and paws
  for (let y = ty; y < ty + 160; y++) for (let x = tx - 240; x < tx + 240; x++) if (y > driftAt(x) + 50 + Math.sin(x * 0.09) * 8) set(x, y, rampColor(SNOW, 0.6 + fbm(x, y, { seed: 5, scale: 20 }) * 0.3, x, y));
  // its face, roaring up: eyes, the open jaw, whiskers
  const [hx, hy] = [tx - 120, ty - 180];
  for (const sx of [-1, 1]) {
    for (let j = -10; j <= 10; j++) for (let i = -16; i <= 16; i++) if ((i / 16) ** 2 + (j / 10) ** 2 < 1) set(hx + sx * 34 + i, hy - 10 + j, Math.abs(i) < 4 ? 0x1a1014 : 0xf0d040);
    for (const dy of [-8, 4, 16]) for (let k = 0; k < 110; k++) set(hx + sx * (40 + k), hy + 40 + dy + k * dy * 0.01, 0xe8ecf2, 0.8);
  }
  for (let j = 0; j < 60; j++) for (let i = -30 + j * 0.2; i <= 30 - j * 0.2; i++) set(hx + i, hy + 30 + j, j < 6 ? 0xf4f4f0 : 0x6a1420);
  for (const sx of [-1, 1]) for (let j = 0; j < 14; j++) for (let i = 0; i < 4 - j * 0.25; i++) set(hx + sx * 22 + i * sx, hy + 30 + j, 0xffffff);
  // ... and its perm: tight purple curls all over the top of its head
  for (let k = 0; k < 60; k++) {
    const a = Math.PI * (1.0 + rand());
    const r0 = 60 + rand() * 30;
    const cx = hx + Math.cos(a) * r0 * 0.9;
    const cy = hy - 40 + Math.sin(a) * r0 * 0.8;
    const rr = 14 + rand() * 8;
    for (let j = -rr; j <= rr; j++) for (let i = -rr; i <= rr; i++) {
      const d = Math.hypot(i, j) / rr;
      if (d < 1) set(cx + i, cy + j, rampColor(PERM, 0.75 - d * 0.4 - (i + j) / (rr * 6), cx + i, cy + j));
    }
  }
  for (const sx of [-1, 1]) for (let j = 0; j < 40; j++) for (let i = -18 + j * 0.45; i <= 18 - j * 0.45; i++) set(hx + sx * 70 + i, hy - 110 - j + 40, rampColor(TIGER, 0.6, 0, 0)); // the ears poking out of the perm
  // sweets in the snow, and a trolley half buried
  const SWEETS = [0xd02a26, 0xe0b830, 0x3a9a4a, 0xd05a9a];
  for (let k = 0; k < 40; k++) {
    const x = 20 + rand() * (FW - 40);
    const y = FH - 460 + rand() * 440;
    const c = SWEETS[k % 4];
    for (let j = -5; j <= 5; j++) for (let i = -14; i <= 14; i++) if ((Math.abs(i) < 7 && (i / 7) ** 2 + (j / 5) ** 2 < 1) || (Math.abs(i) >= 7 && Math.abs(j) < (Math.abs(i) - 6) * 0.6)) set(x + i, y + j, c);
  }
  const [cx0, cy0] = [400, FH - 260];
  for (let y = cy0 - 60; y < cy0; y++) for (let x = cx0 - 70; x < cx0 + 70; x++) if ((x + y) % 9 < 2 || (x - y) % 9 < 2) set(x, y, 0x8a929e);
  for (let x = cx0 + 60; x < cx0 + 100; x++) for (let w = 0; w < 4; w++) set(x, cy0 - 60 - (x - cx0 - 60) * 0.6 + w, 0x9aa2ae);
  for (let y = cy0 - 20; y < cy0 + 10; y++) for (let x = cx0 - 90; x < cx0 + 90; x++) if (y > cy0 - 14 + Math.sin(x * 0.05) * 6) set(x, y, rampColor(SNOW, 0.8, x, y));
  // nearer snow, bigger flakes, here and there (dim)
  for (let k = 0; k < 1400; k++) {
    const x = rand() * FW;
    const y = rand() * FH;
    const r = 1 + rand() * 2.5;
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r) set(x + i, y + j, 0xc8d0dc, 0.45);
  }
  grade(img, { sat: 0.72, bright: 0.58, tint: 0x203050, tintAmt: 0.12 }); // (dim: the fight goes on over it)
  return {
    strip: img,
    props: null,
    meta: { width: W, artScale: S, chunkHeight: L, chunks: 1, length: L, tint: tintTable(L, () => [255, 255, 255]) },
  };
}
