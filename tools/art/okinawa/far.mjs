// Far layer (Okinawa): deep open ocean seen from high above. Seamless vertical loop.
import { Raster, fbm, bayer, rng } from '../../lib/raster.mjs';
import { grade, rampColor } from '../nature.mjs';

export const FAR_W = 180;
export const FAR_H = 384;

const DEEP = [0x072a4c, 0x0b3a66, 0x10507e, 0x1c6896];

export function buildFar() {
  const W = FAR_W;
  const H = FAR_H;
  const img = new Raster(W, H);
  img.wrapY = true;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      // long swell bands plus small chop (both periodic in y, so the loop is seamless)
      const swell = fbm(x * 0.35, y, { seed: 71, scale: 32, octaves: 3, periodY: H });
      const chop = fbm(x, y * 2, { seed: 72, scale: 8, octaves: 2, periodY: H * 2 });
      const v = swell * 0.75 + chop * 0.35 - 0.05;
      let c = rampColor(DEEP, v, x, y);
      // whitecaps: rare bright crests where swell and chop peak together
      if (swell > 0.7 && chop > 0.68 && bayer(x, y) > 0.55) c = 0xc8e6f4;
      else if (swell > 0.64 && chop > 0.7) c = 0x3a82b0;
      img.set(x, y, c);
    }
  // sun glitter: a few sparkling pixels
  const rand = rng(74);
  for (let i = 0; i < 140; i++) img.set(Math.floor(rand() * W), Math.floor(rand() * H), 0xe8f6ff);
  // deep water stays darker than the lagoons on the middle layer
  grade(img, { sat: 0.8, bright: 0.78, tint: 0x0a1830, tintAmt: 0.12 });
  return img;
}
