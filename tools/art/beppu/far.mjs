// Far layer (Beppu): the bay below a haze of hot-spring steam. Seamless vertical loop, drawn at 3x the game's
// resolution (540 x 1152): a slow swell, a fine chop with light on its crests, soft drifts of steam on the water.
import { Raster, fbm, rng } from '../../lib/raster.mjs';
import { grade, rampColor } from '../nature.mjs';
import { hashPx } from '../hires.mjs';

const S = 3;
export const FAR_W = 180 * S;
export const FAR_H = 384 * S;

const WATER = [0x1e4a5a, 0x2a5c6c, 0x3a707e, 0x4e8490];

export function buildFar() {
  const W = FAR_W;
  const H = FAR_H;
  const img = new Raster(W, H);
  img.wrapY = true;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const swell = fbm((x / S) * 0.5, y / S, { seed: 101, scale: 28, octaves: 3, periodY: H / S });
      const chop = fbm(x / S, (y / S) * 2, { seed: 102, scale: 7, octaves: 2, periodY: (H / S) * 2 });
      const rip = fbm(x * 0.22, y * 0.9, { seed: 105, scale: 4, octaves: 2, periodY: H * 0.9 });
      const haze = fbm(x / S, y / S, { seed: 103, scale: 40, octaves: 2, periodY: H / S });
      let c = rampColor(WATER, swell * 0.6 + chop * 0.3 + (rip - 0.5) * 0.25, x, y);
      if (rip > 0.74 && chop > 0.42) c = hashPx(x, y, 106) < 0.5 ? 0x8fb4bc : 0x7aa2ac;
      else if (rip < 0.24) c = 0x1a4252;
      img.set(x, y, c);
      // drifting steam: pale and soft over the water
      if (haze > 0.58) img.set(x, y, 0xc8d4d8, Math.min(0.28, (haze - 0.58) * 1.4));
    }
  const rand = rng(104);
  for (let i = 0; i < 300; i++) {
    const x = Math.floor(rand() * W);
    const y = Math.floor(rand() * H);
    img.set(x, y, 0xe8f4f8);
    if (rand() < 0.4) img.set((x + 1) % W, y, 0xb8d0d8);
  }
  grade(img, { sat: 0.8, bright: 0.85, tint: 0x8090a0, tintAmt: 0.12 });
  return img;
}
