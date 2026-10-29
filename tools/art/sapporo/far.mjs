// Far layer (Sapporo): snowy fir-and-birch forest in the valley far below, at dusk. Seamless vertical loop.
import { Raster, fbm, rng, bayer } from '../../lib/raster.mjs';
import { crownPixels, grade, rampColor } from '../nature.mjs';

export const FAR_W = 180;
export const FAR_H = 384;

const SNOW = [0x8e98b4, 0xaab4cc, 0xc4cce0, 0xdce2ee];

export function buildFar() {
  const W = FAR_W;
  const H = FAR_H;
  const img = new Raster(W, H);
  img.wrapY = true;
  const rand = rng(3301);
  const TAU = Math.PI * 2;

  // snowfield with soft drifts
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const n = fbm(x, y, { seed: 61, scale: 40, octaves: 4, periodY: H });
      const rip = fbm(x * 0.5, y * 2, { seed: 62, scale: 6, octaves: 2, periodY: H * 2 });
      img.set(x, y, rampColor(SNOW, 0.3 + n * 0.6 + (rip - 0.5) * 0.15, x, y));
    }

  // frozen creek winding through the valley (periodic in y)
  const creekX = (y) => 60 + 30 * Math.sin((TAU * y) / H) + 10 * Math.sin((2 * TAU * y) / H + 0.7);
  for (let y = 0; y < H; y++) {
    const cx = creekX(y);
    for (let x = Math.floor(cx - 5); x <= cx + 5; x++) {
      const d = Math.abs(x + 0.5 - cx);
      if (d < 3.2) img.set(x, y, d > 2.2 ? 0x7c8cac : bayer(x, y) > 0.7 ? 0x9ab0cc : 0x8aa0c0);
    }
  }

  // forest: dense fir crowns with snow on the lit side, bare birches in the clearings
  const trees = [];
  for (let gy = 0; gy < H; gy += 5)
    for (let gx = 0; gx < W; gx += 5) {
      const x = gx + rand() * 5;
      const y = gy + rand() * 5;
      const dens = fbm(x, y, { seed: 63, scale: 48, octaves: 2, periodY: H });
      if (Math.abs(x - creekX(y)) < 7) continue;
      if (rand() > dens * 1.25 - 0.1) continue;
      trees.push({ x, y, r: 2 + rand() * 2.2, fir: rand() < 0.78 });
    }
  for (const t of trees)
    if (t.fir) for (const p of crownPixels('fir', Math.round(t.x), Math.round(t.y), t.r, rand, 7)) img.tint(p.x + 2, p.y + 3, 0.72);
  for (const t of trees) {
    const cx = Math.round(t.x);
    const cy = Math.round(t.y);
    if (!t.fir) {
      // bare birch: a few purple-grey twigs and its long shadow
      for (let k = 0; k < 4; k++) {
        const a = rand() * TAU;
        for (let j = 1; j <= t.r; j++) img.set(Math.round(cx + Math.cos(a) * j), Math.round(cy + Math.sin(a) * j), j > t.r - 1 ? 0x7a6e7e : 0x5a4e5e);
      }
      img.set(cx, cy, 0xd8d4d8);
      continue;
    }
    for (const p of crownPixels('fir', cx, cy, t.r, rand, 7)) {
      const lit = p.x - cx + p.y - cy < 0;
      img.set(p.x, p.y, lit && bayer(p.x, p.y) > 0.45 ? 0xd4dcec : p.c);
    }
  }

  // a dusky blue valley, darker than the ridge above it
  grade(img, { sat: 0.8, bright: 0.66, tint: 0x2a2a60, tintAmt: 0.2 });
  return img;
}
