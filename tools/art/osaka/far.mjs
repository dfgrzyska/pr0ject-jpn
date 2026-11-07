// Far layer (Osaka): the dark water of the rivers, the canal and the bay, seen through the mid layer where it
// is water. Seamless vertical loop, drawn at 3x the game's resolution (540 x 1152): a slow swell, a fine chop
// in ripples across the current, a scum of light on the crests, the odd glint and a petal or two drifting.
import { Raster, fbm, rng } from '../../lib/raster.mjs';
import { grade, rampColor } from '../nature.mjs';
import { hashPx } from '../hires.mjs';

const S = 3;
export const FAR_W = 180 * S;
export const FAR_H = 384 * S;

const WATER = [0x0c2230, 0x123040, 0x1a3e4e, 0x244c5c, 0x305a6a];

export function buildFar() {
  const W = FAR_W;
  const H = FAR_H;
  const img = new Raster(W, H);
  img.wrapY = true;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const swell = fbm(x / S * 0.5, y / S, { seed: 91, scale: 26, octaves: 3, periodY: H / S });
      const chop = fbm(x / S, (y / S) * 2, { seed: 92, scale: 6, octaves: 2, periodY: (H / S) * 2 });
      // fine ripples across the current: thin bright lines on the crests, darker troughs behind them
      const rip = fbm(x * 0.22, y * 0.9, { seed: 94, scale: 4, octaves: 2, periodY: H * 0.9 });
      let c = rampColor(WATER, swell * 0.6 + chop * 0.3 + (rip - 0.5) * 0.25, x, y);
      if (rip > 0.76 && chop > 0.45) c = hashPx(x, y, 95) < 0.5 ? 0x4a7484 : 0x3e6878;
      else if (rip < 0.22) c = 0x0a1c28;
      img.set(x, y, c);
    }
  // glints and a few petals drifting on the current
  const rand = rng(93);
  for (let i = 0; i < 260; i++) {
    const x = Math.floor(rand() * W);
    const y = Math.floor(rand() * H);
    if (rand() < 0.15) {
      img.set(x, y, 0xf4c8d8);
      img.set((x + 1) % W, y, 0xe8a8c0);
    } else {
      img.set(x, y, 0x9ab8c0);
      if (rand() < 0.4) img.set((x + 1) % W, y, 0x6a909c);
    }
  }
  grade(img, { sat: 0.85, bright: 0.85, tint: 0x101830, tintAmt: 0.12 });
  return img;
}
