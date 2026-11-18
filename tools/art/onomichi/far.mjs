// Onomichi's far layer: the water of the Seto Inland Sea, seen where the middle layer is open. A seamless vertical
// loop at 540 px. (A stand-in for now: the tidal currents and the light of the time of day come in phase 7.)
import { Raster, fbm } from '../../lib/raster.mjs';
import { rampColor } from '../nature.mjs';
import { S } from './route.mjs';

const WATER = [0x0e3a4c, 0x154c60, 0x1e6072, 0x2c7484, 0x448a96];

export function buildFar() {
  const W = 180 * S;
  const H = 384 * S;
  const img = new Raster(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const swell = fbm((x / S) * 0.5, y / S, { seed: 1101, scale: 26, octaves: 3, periodY: H / S });
      const chop = fbm(x / S, (y / S) * 2, { seed: 1102, scale: 6, octaves: 2, periodY: (H / S) * 2 });
      img.set(x, y, rampColor(WATER, swell * 0.65 + chop * 0.35, x, y));
    }
  return img;
}

// The same water at night (Parallax: farNight, faded in by the stage's `dark` as the town darkens): the strait deep
// blue under the night sky, the town's warm glow drifting over it, the lights of the shore and the lanterns broken
// into short streaks by the ripples.
const NIGHT = [0x0a1424, 0x0e1a2e, 0x142236, 0x1a2a40, 0x24344a];
const clamp = (v) => Math.max(0, Math.min(1, v));
const blend = (a, b, t) => {
  const k = (s) => Math.round(((a >> s) & 255) + (((b >> s) & 255) - ((a >> s) & 255)) * t);
  return (k(16) << 16) | (k(8) << 8) | k(0);
};
const hash = (x, y, s) => {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

export function buildFarNight() {
  const W = 180 * S;
  const H = 384 * S;
  const img = new Raster(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const swell = fbm((x / S) * 0.5, y / S, { seed: 1101, scale: 26, octaves: 3, periodY: H / S });
      const chop = fbm(x / S, (y / S) * 2, { seed: 1102, scale: 6, octaves: 2, periodY: (H / S) * 2 });
      let c = rampColor(NIGHT, swell * 0.65 + chop * 0.35, x, y);
      const glow = clamp((fbm((x / S) * 0.6, y / S, { seed: 1103, scale: 40, octaves: 3, periodY: H / S }) - 0.42) * 2.2);
      c = blend(c, glow > 0.6 ? 0x4a3a48 : 0x2a2a48, glow * 0.4);
      const cell = hash(Math.floor(x / 3), Math.floor(y / 9), 1104);
      if (cell < 0.01 && x % 3 === 1 && y % 9 < 2 + Math.floor(hash(Math.floor(x / 3), Math.floor(y / 9), 1105) * 3)) {
        const k = hash(Math.floor(x / 3), Math.floor(y / 9), 1106);
        c = blend(c, k < 0.5 ? 0xffd8a0 : k < 0.8 ? 0xf0f4ff : 0xff9a70, 0.22 + cell * 18 - (y % 9) * 0.03);
      }
      if (chop > 0.72 && hash(x, y, 1107) < (chop - 0.72) * 0.8) c = blend(c, 0x5a6080, 0.3);
      img.set(x, y, c);
    }
  return img;
}
