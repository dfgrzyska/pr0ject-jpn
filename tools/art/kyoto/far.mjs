// Far layer: the forested valley far below the ridge. Seamless vertical loop.
import { Raster, fbm, rng, bayer } from '../../lib/raster.mjs';
import { crownPixels, grade, rampColor } from '../nature.mjs';

export const FAR_W = 180;
export const FAR_H = 384;

export function buildFar() {
  const W = FAR_W;
  const H = FAR_H;
  const img = new Raster(W, H);
  img.wrapY = true;
  const rand = rng(1234);
  const TAU = Math.PI * 2;

  // river centre, periodic in y
  const riverX = (y) => 118 + 26 * Math.sin((TAU * y) / H) + 9 * Math.sin((2 * TAU * y) / H + 1.3);
  const riverW = (y) => 7 + 2 * Math.sin((3 * TAU * y) / H);

  // forest floor
  const ground = [0x16241a, 0x1d2f1f, 0x263a24, 0x31462a];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const n = fbm(x, y, { seed: 5, scale: 32, octaves: 4, periodY: H });
      img.set(x, y, rampColor(ground, n, x, y));
    }

  // river with sandy banks
  for (let y = 0; y < H; y++) {
    const cx = riverX(y);
    const w = riverW(y);
    for (let x = Math.floor(cx - w - 3); x <= cx + w + 3; x++) {
      const d = Math.abs(x + 0.5 - cx);
      if (d <= w) {
        const n = fbm(x * 0.6, y * 2, { seed: 9, scale: 8, octaves: 2, periodY: H * 2 });
        let c = d > w - 1.5 ? 0x2c5a5e : 0x1f4552;
        if (n > 0.68 && bayer(x, y) > 0.4) c = 0x5f9aa0;
        img.set(x, y, c);
      } else if (d <= w + 2 + fbm(x, y, { seed: 3, scale: 4, periodY: H })) {
        img.set(x, y, 0x6d6553);
      }
    }
  }

  // a few small hamlets: tiled roofs along the river
  for (let i = 0; i < 4; i++) {
    const y = Math.floor((i + rand() * 0.6) * (H / 4));
    const side = i % 2 ? -1 : 1;
    const x = Math.round(riverX(y) + side * (riverW(y) + 8 + rand() * 6));
    for (let k = 0; k < 3; k++) {
      const rx = x + (k - 1) * 8 * side + Math.round(rand() * 2);
      const ry = y + k * 5;
      img.rect(rx - 3 + 1, ry - 2 + 1, 7, 5, 0x0c1410, 0.6);
      img.rect(rx - 3, ry - 2, 7, 2, 0x5d6676);
      img.rect(rx - 3, ry, 7, 2, 0x434b5a);
      img.set(rx - 3, ry + 2, 0x30251c);
      img.rect(rx - 3, ry + 2, 7, 1, 0x4a3a2c);
    }
  }

  // dense canopy, avoiding the river
  const trees = [];
  for (let gy = 0; gy < H; gy += 5)
    for (let gx = -4; gx < W + 4; gx += 5) {
      const x = gx + rand() * 5;
      const y = gy + rand() * 5;
      const d = Math.abs(x - riverX(y));
      if (d < riverW(y) + 4) continue;
      const density = fbm(x, y, { seed: 77, scale: 64, octaves: 2, periodY: H });
      if (rand() > 0.35 + density * 0.6) continue;
      const roll = rand();
      const kind = roll < 0.14 ? 'sakura' : roll < 0.45 ? 'cedar' : 'tiny';
      trees.push({ x, y, kind, r: kind === 'cedar' ? 2.2 + rand() * 1.4 : 2.4 + rand() * 1.8 });
    }
  trees.sort((a, b) => a.y - b.y);
  for (const t of trees) {
    const px = crownPixels(t.kind, Math.round(t.x), Math.round(t.y), t.r, rand, 31);
    for (const p of px) img.tint(p.x + 1, p.y + 2, 0.55);
    for (const p of px) img.set(p.x, p.y, p.c);
  }

  // atmospheric depth: far below, hazy and desaturated
  grade(img, { sat: 0.55, bright: 0.62, tint: 0x1a2440, tintAmt: 0.22 });
  return img;
}
