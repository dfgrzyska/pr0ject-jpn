// Far layer (Hiroshima & Miyajima): the calm turquoise-emerald Seto Inland Sea from above, gentle tidal currents and warm sunlit
// ripples. Seamless vertical loop, drawn at 3x the game's resolution (540 x 1152).
import { Raster, fbm, rng, scaleColor } from '../../lib/raster.mjs';
import { grade, rampColor } from '../nature.mjs';
import { hashPx } from '../hires.mjs';

const S = 3;
export const FAR_W = 180 * S;
export const FAR_H = 384 * S;

const SETO = [0x092a3c, 0x0e3d52, 0x15546a, 0x226e82];

export function buildFar() {
  const W = FAR_W;
  const H = FAR_H;
  const img = new Raster(W, H);
  img.wrapY = true;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const tide = fbm((x / S) * 0.42, y / S, { seed: 91, scale: 30, octaves: 3, periodY: H / S });
      const ripple = fbm((x / S) * 1.1, (y / S) * 2, { seed: 92, scale: 8, octaves: 2, periodY: (H / S) * 2 });
      const rip = fbm(x * 0.09, y * 0.62, { seed: 94, scale: 3, octaves: 3, periodY: H * 0.62 });
      const v = tide * 0.72 + ripple * 0.34 - 0.04 + (rip - 0.5) * 0.2;
      let c = rampColor(SETO, v, x, y);
      if (rip > 0.72 && ripple > 0.44) c = tide > 0.62 ? (hashPx(x, y, 96) < 0.5 ? 0xd6f2f6 : 0xa8dce4) : hashPx(x, y, 97) < 0.5 ? 0x4a98aa : 0x38889a;
      else if (rip < 0.26) c = scaleColor(c, 0.8);
      img.set(x, y, c);
    }
  const rand = rng(95);
  for (let i = 0; i < 420; i++) {
    const x = Math.floor(rand() * W);
    const y = Math.floor(rand() * H);
    img.set(x, y, 0xfff4d8);
    if (rand() < 0.4) img.set((x + 1) % W, y, 0xc8d8c8);
  }
  grade(img, { sat: 0.86, bright: 0.8, tint: 0x0b2030, tintAmt: 0.1 });
  return img;
}
