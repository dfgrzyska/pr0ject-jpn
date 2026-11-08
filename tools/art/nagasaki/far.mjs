// Far layer (Nagasaki): the open sea and the harbour from above, long swell and wind crests. Seamless vertical loop,
// drawn at 3x the game's resolution (540 x 1152). The strip lays the sky's colour over it as the evening falls.
import { Raster, fbm, rng, scaleColor } from '../../lib/raster.mjs';
import { grade, rampColor } from '../nature.mjs';
import { hashPx } from '../hires.mjs';

const S = 3;
const SEA = [0x08283a, 0x0e3a50, 0x154e66, 0x22687e];

export function buildFar() {
  const W = 180 * S;
  const H = 384 * S;
  const img = new Raster(W, H);
  img.wrapY = true;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const tide = fbm((x / S) * 0.42, y / S, { seed: 81, scale: 30, octaves: 3, periodY: H / S });
      const ripple = fbm((x / S) * 1.1, (y / S) * 2, { seed: 82, scale: 8, octaves: 2, periodY: (H / S) * 2 });
      const rip = fbm(x * 0.09, y * 0.62, { seed: 84, scale: 3, octaves: 3, periodY: H * 0.62 });
      const v = tide * 0.72 + ripple * 0.34 - 0.04 + (rip - 0.5) * 0.2;
      let c = rampColor(SEA, v, x, y);
      if (rip > 0.72 && ripple > 0.44) c = tide > 0.62 ? (hashPx(x, y, 86) < 0.5 ? 0xd0ecf2 : 0xa0d4e0) : hashPx(x, y, 87) < 0.5 ? 0x4490a4 : 0x348094;
      else if (rip < 0.26) c = scaleColor(c, 0.8);
      img.set(x, y, c);
    }
  const rand = rng(85);
  for (let i = 0; i < 380; i++) {
    const x = Math.floor(rand() * W);
    const y = Math.floor(rand() * H);
    img.set(x, y, 0xfff4d8);
    if (rand() < 0.4) img.set((x + 1) % W, y, 0xc8d8c8);
  }
  grade(img, { sat: 0.9, bright: 0.84, tint: 0x0b2030, tintAmt: 0.08 });
  return img;
}
