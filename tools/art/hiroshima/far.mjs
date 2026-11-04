// Far layer (Hiroshima & Miyajima): calm turquoise-emerald Seto Inland Sea (Setonaikai)
// seen from above, with gentle tidal currents and warm sunlit ripples. Seamless vertical loop.
import { Raster, fbm, bayer, rng } from '../../lib/raster.mjs';
import { grade, rampColor } from '../nature.mjs';

export const FAR_W = 180;
export const FAR_H = 384;

const SETO = [0x092a3c, 0x0e3d52, 0x15546a, 0x226e82];

export function buildFar() {
  const W = FAR_W;
  const H = FAR_H;
  const img = new Raster(W, H);
  img.wrapY = true;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const tide = fbm(x * 0.42, y, { seed: 91, scale: 30, octaves: 3, periodY: H });
      const ripple = fbm(x * 1.1, y * 2, { seed: 92, scale: 8, octaves: 2, periodY: H * 2 });
      const v = tide * 0.72 + ripple * 0.34 - 0.04;
      let c = rampColor(SETO, v, x, y);
      if (tide > 0.68 && ripple > 0.67 && bayer(x, y) > 0.58) c = 0xd6f2f6;
      else if (tide > 0.62 && ripple > 0.68) c = 0x38889a;
      img.set(x, y, c);
    }
  const rand = rng(95);
  for (let i = 0; i < 150; i++) img.set(Math.floor(rand() * W), Math.floor(rand() * H), 0xfff4d8);
  grade(img, { sat: 0.86, bright: 0.8, tint: 0x0b2030, tintAmt: 0.1 });
  return img;
}
