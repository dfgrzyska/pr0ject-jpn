// Far layer (Osaka): the dark water of the rivers, the canal and the bay. Seamless vertical loop.
import { Raster, fbm, bayer, rng } from '../../lib/raster.mjs';
import { grade, rampColor } from '../nature.mjs';

export const FAR_W = 180;
export const FAR_H = 384;

const WATER = [0x0e2430, 0x143240, 0x1c4050, 0x285060];

export function buildFar() {
  const W = FAR_W;
  const H = FAR_H;
  const img = new Raster(W, H);
  img.wrapY = true;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const swell = fbm(x * 0.5, y, { seed: 91, scale: 26, octaves: 3, periodY: H });
      const chop = fbm(x, y * 2, { seed: 92, scale: 6, octaves: 2, periodY: H * 2 });
      let c = rampColor(WATER, swell * 0.7 + chop * 0.3, x, y);
      if (chop > 0.72 && bayer(x, y) > 0.55) c = 0x4a7080;
      img.set(x, y, c);
    }
  const rand = rng(93);
  for (let i = 0; i < 70; i++) img.set(Math.floor(rand() * W), Math.floor(rand() * H), 0x9ab8c0);
  grade(img, { sat: 0.85, bright: 0.85, tint: 0x101830, tintAmt: 0.12 });
  return img;
}
