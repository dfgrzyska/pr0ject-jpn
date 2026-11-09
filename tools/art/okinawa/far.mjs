// Far layer (Okinawa): the deep open ocean from high above, long swells, fine chop, whitecaps and sun glitter. Seamless vertical
// loop, drawn at 3x the game's resolution (540 x 1152).
import { Raster, fbm, rng, scaleColor } from '../../lib/raster.mjs';
import { grade, rampColor } from '../nature.mjs';
import { hashPx } from '../hires.mjs';

const S = 3;
export const FAR_W = 180 * S;
export const FAR_H = 384 * S;

const DEEP = [0x062640, 0x0a3558, 0x0f4874, 0x175e8a, 0x20729e];

export function buildFar() {
  const W = FAR_W;
  const H = FAR_H;
  const img = new Raster(W, H);
  img.wrapY = true;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const swell = fbm((x / S) * 0.35, y / S, { seed: 71, scale: 32, octaves: 3, periodY: H / S });
      const chop = fbm(x / S, (y / S) * 2, { seed: 72, scale: 8, octaves: 2, periodY: (H / S) * 2 });
      const rip = fbm(x * 0.09, y * 0.62, { seed: 73, scale: 3, octaves: 3, periodY: H * 0.62 });
      let c = rampColor(DEEP, swell * 0.75 + chop * 0.35 - 0.05 + (rip - 0.5) * 0.22, x, y);
      if (rip > 0.72 && chop > 0.46) c = swell > 0.6 ? (hashPx(x, y, 75) < 0.5 ? 0xe4f4fa : 0xb4dcec) : hashPx(x, y, 76) < 0.5 ? 0x3a86b4 : 0x2c78a6;
      else if (rip < 0.26) c = scaleColor(c, 0.8);
      img.set(x, y, c);
    }
  const rand = rng(74);
  for (let i = 0; i < 520; i++) {
    const x = Math.floor(rand() * W);
    const y = Math.floor(rand() * H);
    img.set(x, y, 0xf4fbff);
    if (rand() < 0.4) img.set((x + 1) % W, y, 0xa8d4e8);
  }
  grade(img, { sat: 0.84, bright: 0.82, tint: 0x0a1830, tintAmt: 0.1 });
  return img;
}
