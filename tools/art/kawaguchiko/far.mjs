// Kawaguchiko's far layer: the water of the lake, seen where the middle layer is open. A seamless vertical loop at
// 540 px. (A stand-in for now: Fuji's reflection on it, and the sea of clouds under the summit, come in phase 6.)
import { Raster, fbm } from '../../lib/raster.mjs';
import { rampColor } from '../nature.mjs';
import { S } from './route.mjs';

const WATER = [0x123a4a, 0x1a4c5c, 0x24606e, 0x347480, 0x4a8a94];

export function buildFar() {
  const W = 180 * S;
  const H = 384 * S;
  const img = new Raster(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const swell = fbm((x / S) * 0.5, y / S, { seed: 1001, scale: 26, octaves: 3, periodY: H / S });
      const chop = fbm(x / S, (y / S) * 2, { seed: 1002, scale: 6, octaves: 2, periodY: (H / S) * 2 });
      img.set(x, y, rampColor(WATER, swell * 0.65 + chop * 0.35, x, y));
    }
  return img;
}
