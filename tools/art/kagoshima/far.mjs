// Far layer (Kagoshima): Kinkō Bay from high above, dulled by a haze of volcanic ash: long swells, fine chop, pale slicks of
// floating ash in streaks. Seamless vertical loop, drawn at 3x the game's resolution (540 x 1152).
import { Raster, fbm, rng, scaleColor } from '../../lib/raster.mjs';
import { grade, rampColor } from '../nature.mjs';
import { hashPx } from '../hires.mjs';

const S = 3;
export const FAR_W = 180 * S;
export const FAR_H = 384 * S;

const BAY = [0x0f2a3c, 0x16384e, 0x1e4862, 0x2a5a72, 0x3a6e82];

export function buildFar() {
  const W = FAR_W;
  const H = FAR_H;
  const img = new Raster(W, H);
  img.wrapY = true;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const swell = fbm((x / S) * 0.4, y / S, { seed: 81, scale: 30, octaves: 3, periodY: H / S });
      const chop = fbm(x / S, (y / S) * 2, { seed: 82, scale: 7, octaves: 2, periodY: (H / S) * 2 });
      const rip = fbm(x * 0.09, y * 0.62, { seed: 85, scale: 3, octaves: 3, periodY: H * 0.62 });
      const slick = fbm((x / S) * 0.25, y / S, { seed: 83, scale: 40, octaves: 2, periodY: H / S });
      let c = rampColor(BAY, swell * 0.7 + chop * 0.35 - 0.05 + (rip - 0.5) * 0.2, x, y);
      // the ash floats in long pale slicks, grainy where it thins
      if (slick > 0.66 && hashPx(x >> 3, y >> 1, 86) < (slick - 0.66) * 2) c = hashPx(x >> 1, y, 87) < 0.6 ? scaleColor(c, 1.28) : 0x5e7078;
      if (rip > 0.72 && chop > 0.44) c = swell > 0.6 ? (hashPx(x, y, 88) < 0.5 ? 0xc8d4d4 : 0x9ab0b4) : hashPx(x, y, 89) < 0.5 ? 0x44707e : 0x3a6474;
      else if (rip < 0.26) c = scaleColor(c, 0.82);
      img.set(x, y, c);
    }
  const rand = rng(84);
  for (let i = 0; i < 380; i++) {
    const x = Math.floor(rand() * W);
    const y = Math.floor(rand() * H);
    img.set(x, y, 0xd0dade);
    if (rand() < 0.4) img.set((x + 1) % W, y, 0x9aacb2);
  }
  grade(img, { sat: 0.74, bright: 0.84, tint: 0x5a5048, tintAmt: 0.13 });
  return img;
}
