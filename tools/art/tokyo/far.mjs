// Tokyo's far layer: the water of the rivers and the bay, seen where the middle layer is open - and in it, the sky.
// Two seamless vertical loops at 540 px, and the game fades from the first to the second as the strip darkens
// (Parallax: farNight, by the stage's `dark`):
//   by day: green-blue water holding the blue of the sky and the white of the clouds going over, a chop on it;
//   by night: dark water holding the city's glow - a warm haze over the deep blue - and the lights of the shore
//   and the stars broken up into short streaks by the ripples.
import { Raster, fbm } from '../../lib/raster.mjs';
import { rampColor } from '../nature.mjs';
import { hashPx } from '../hires.mjs';
import { S } from './route.mjs';

const W = 180 * S;
const H = 384 * S;
const blend = (a, b, t) => {
  const k = (s) => Math.round(((a >> s) & 255) + (((b >> s) & 255) - ((a >> s) & 255)) * t);
  return (k(16) << 16) | (k(8) << 8) | k(0);
};
const clamp = (v) => Math.max(0, Math.min(1, v));

const DAY = [0x2a5a70, 0x34687e, 0x3e748a, 0x4a8296, 0x5890a2];
const NIGHT = [0x0a1826, 0x102234, 0x183044, 0x223e54, 0x2e4c62];

/** The water's own surface: a long swell and a short chop, both looping down the layer. */
const surface = (x, y) => {
  const swell = fbm((x / S) * 0.5, y / S, { seed: 191, scale: 26, octaves: 3, periodY: H / S });
  const chop = fbm(x / S, (y / S) * 2, { seed: 192, scale: 6, octaves: 2, periodY: (H / S) * 2 });
  return [swell, chop];
};

export function buildFar() {
  const img = new Raster(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const [swell, chop] = surface(x, y);
      let c = rampColor(DAY, swell * 0.65 + chop * 0.35, x, y);
      // the sky in it: lighter toward the far bank, the clouds' reflections broken by the chop
      const cloud = clamp((fbm((x / S) * 0.7, y / S, { seed: 193, scale: 34, octaves: 4, periodY: H / S }) - 0.5) * 3.2);
      const broken = cloud * clamp(0.55 + (chop - 0.5) * 2.4);
      c = blend(c, 0x7aa8c4, 0.18);
      if (broken > 0.05) c = blend(c, broken > 0.5 ? 0xd8e6ee : 0xa8c4d4, Math.min(0.55, broken * 0.7));
      // glints of the sun on the crests
      if (chop > 0.68 && hashPx(x, y, 194) < (chop - 0.68) * 1.4) c = blend(c, 0xf4f8f0, 0.6);
      img.set(x, y, c);
    }
  return img;
}

export function buildFarNight() {
  const img = new Raster(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const [swell, chop] = surface(x, y);
      let c = rampColor(NIGHT, swell * 0.65 + chop * 0.35, x, y);
      // the city's glow, warm, in slow drifts over the water
      const glow = clamp((fbm((x / S) * 0.6, y / S, { seed: 195, scale: 40, octaves: 3, periodY: H / S }) - 0.42) * 2.2);
      c = blend(c, glow > 0.6 ? 0x5a3e48 : 0x3a2e48, glow * 0.45);
      // the lights of the shore and the stars, each broken into a short streak by the ripples
      const cell = hashPx(Math.floor(x / 3), Math.floor(y / 9), 196);
      if (cell < 0.011) {
        const dy = y % 9;
        const on = dy < 2 + Math.floor(hashPx(Math.floor(x / 3), Math.floor(y / 9), 197) * 3) && x % 3 === 1;
        if (on) {
          const k = hashPx(Math.floor(x / 3), Math.floor(y / 9), 198);
          c = blend(c, k < 0.5 ? 0xffd8a0 : k < 0.8 ? 0xf0f4ff : 0xff9a70, 0.22 + cell * 18 - dy * 0.03);
        }
      }
      // the crests catch the glow
      if (chop > 0.72 && hashPx(x, y, 199) < (chop - 0.72) * 0.8) c = blend(c, 0x6a7090, 0.3);
      img.set(x, y, c);
    }
  return img;
}
