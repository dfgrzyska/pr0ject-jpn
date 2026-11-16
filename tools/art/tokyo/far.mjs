// Tokyo's far layer: the water of the Sumida and of the bay, seen where the middle layer is open. A seamless
// vertical loop at 540 px. (A stand-in for now: the sky and the city's glow over it come in phase 8.)
import { Raster, fbm } from '../../lib/raster.mjs';
import { rampColor } from '../nature.mjs';
import { S } from './route.mjs';

const WATER = [0x0a1826, 0x102234, 0x183044, 0x223e54, 0x2e4c62];

export function buildFar() {
  const W = 180 * S;
  const H = 384 * S;
  const img = new Raster(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const swell = fbm((x / S) * 0.5, y / S, { seed: 191, scale: 26, octaves: 3, periodY: H / S });
      const chop = fbm(x / S, (y / S) * 2, { seed: 192, scale: 6, octaves: 2, periodY: (H / S) * 2 });
      img.set(x, y, rampColor(WATER, swell * 0.65 + chop * 0.35, x, y));
    }
  return img;
}
