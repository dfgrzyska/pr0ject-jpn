// Far layer (Beppu): the bay below a haze of hot-spring steam. Seamless vertical loop.
import { Raster, fbm, bayer, rng } from '../../lib/raster.mjs';
import { grade, rampColor } from '../nature.mjs';

export const FAR_W = 180;
export const FAR_H = 384;

const WATER = [0x1e4a5a, 0x2a5c6c, 0x3a707e, 0x4e8490];

export function buildFar() {
  const W = FAR_W;
  const H = FAR_H;
  const img = new Raster(W, H);
  img.wrapY = true;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const swell = fbm(x * 0.5, y, { seed: 101, scale: 28, octaves: 3, periodY: H });
      const chop = fbm(x, y * 2, { seed: 102, scale: 7, octaves: 2, periodY: H * 2 });
      const haze = fbm(x, y, { seed: 103, scale: 40, octaves: 2, periodY: H });
      let c = rampColor(WATER, swell * 0.7 + chop * 0.3, x, y);
      if (chop > 0.72 && bayer(x, y) > 0.55) c = 0xa8c8d0;
      if (haze > 0.62 && bayer(x, y) < (haze - 0.62) * 2.5) c = 0xc8d4d8; // drifting steam
      img.set(x, y, c);
    }
  const rand = rng(104);
  for (let i = 0; i < 60; i++) img.set(Math.floor(rand() * W), Math.floor(rand() * H), 0xd8e8ec);
  grade(img, { sat: 0.8, bright: 0.85, tint: 0x8090a0, tintAmt: 0.12 });
  return img;
}
