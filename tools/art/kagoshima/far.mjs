// Far layer (Kagoshima): Kinkō Bay seen from high above, dulled by a haze of volcanic ash. Seamless loop.
import { Raster, fbm, bayer, rng } from '../../lib/raster.mjs';
import { grade, rampColor } from '../nature.mjs';

export const FAR_W = 180;
export const FAR_H = 384;

const BAY = [0x16344a, 0x1e4660, 0x2a5a72, 0x3a6e82];

export function buildFar() {
  const W = FAR_W;
  const H = FAR_H;
  const img = new Raster(W, H);
  img.wrapY = true;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const swell = fbm(x * 0.4, y, { seed: 81, scale: 30, octaves: 3, periodY: H });
      const chop = fbm(x, y * 2, { seed: 82, scale: 7, octaves: 2, periodY: H * 2 });
      // ash slicks: pale streaks floating on the water
      const slick = fbm(x * 0.25, y, { seed: 83, scale: 40, octaves: 2, periodY: H });
      let c = rampColor(BAY, swell * 0.7 + chop * 0.35 - 0.05, x, y);
      if (slick > 0.66 && bayer(x, y) < (slick - 0.66) * 3) c = 0x6a7a80;
      if (swell > 0.68 && chop > 0.7 && bayer(x, y) > 0.6) c = 0xb8c8cc;
      img.set(x, y, c);
    }
  const rand = rng(84);
  for (let i = 0; i < 90; i++) img.set(Math.floor(rand() * W), Math.floor(rand() * H), 0xd0dade);
  grade(img, { sat: 0.7, bright: 0.8, tint: 0x5a5048, tintAmt: 0.15 });
  return img;
}
