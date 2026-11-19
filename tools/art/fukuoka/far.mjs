// Fukuoka's far layer: the water seen where the middle layer is open - Hakata Bay and the rivers (docs/plan-fukuoka.md
// phase 8). Seamless vertical loops at 540 px. By day the bay is calm and grey-green, a long low swell under small
// ripples, the light catching them here and there (Parallax tints it with the strip's time of day, so it pales at dawn
// and warms at sunset). By night (faded in by the stage's `dark`) it is ink-blue, the city's glow drifting over it, and
// the lights of the shore and of Nakasu's neon - rose, cyan, white, amber - broken by the ripples into stacks of short
// streaks, as they lie on the Naka.
import { Raster, fbm } from '../../lib/raster.mjs';
import { rampColor } from '../nature.mjs';
import { S } from './route.mjs';

const H0 = 384; // (the loop's height in the game's pixels)
const DAY = [0x2e4a4c, 0x365652, 0x40625a, 0x4c6e64, 0x5c7c70];
const NIGHT = [0x070d1a, 0x0b1424, 0x101a2e, 0x162238, 0x1e2a42];
const NEON = [0xff6aa8, 0x6ae0ff, 0xfff0d8, 0xffb060, 0xb88aff, 0xff4a5a];
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

export function buildFar() {
  const [W, H] = [180 * S, H0 * S];
  const img = new Raster(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const [gx, gy] = [x / S, y / S];
      const swell = fbm(gx * 0.35, gy, { seed: 1201, scale: 30, octaves: 3, periodY: H0 });
      const ripple = fbm(gx * 1.2, gy * 2.4, { seed: 1202, scale: 6, octaves: 2, periodY: H0 * 2.4 });
      let c = rampColor(DAY, swell * 0.7 + ripple * 0.3, x, y);
      // the ripples' lit sides, short and across the swell, a few catching the sun
      const crest = ripple - 0.74;
      if (crest > 0 && hash(x, y, 1203) < crest * 2.2) c = blend(c, 0x9ab4a6, 0.3);
      if (crest > 0.09 && ((x * 7 + y * 13) % 37) < crest * 60) c = blend(c, 0xe0ece0, 0.7);
      img.set(x, y, c);
    }
  return img;
}

export function buildFarNight() {
  const [W, H] = [180 * S, H0 * S];
  const img = new Raster(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const [gx, gy] = [x / S, y / S];
      const swell = fbm(gx * 0.35, gy, { seed: 1201, scale: 30, octaves: 3, periodY: H0 });
      const ripple = fbm(gx * 1.2, gy * 2.4, { seed: 1202, scale: 6, octaves: 2, periodY: H0 * 2.4 });
      let c = rampColor(NIGHT, swell * 0.6 + ripple * 0.4, x, y);
      // the city's glow drifting over the water, warmer in its thick parts
      const glow = clamp((fbm(gx * 0.5, gy, { seed: 1204, scale: 44, octaves: 3, periodY: H0 }) - 0.4) * 2.2);
      c = blend(c, glow > 0.6 ? 0x3a2a44 : 0x1e2446, glow * 0.45);
      // lights broken into stacks of short streaks by the ripples: each column of streaks one light's reflection
      const col = Math.floor(x / 4);
      const row = Math.floor(y / 30);
      const k = hash(col, row, 1205);
      if (k < 0.1) {
        const len = 6 + Math.floor(hash(col, row, 1206) * 20); // (how far down the water the light reaches)
        const y0 = Math.floor(hash(col, row, 1207) * 10);
        const dy = (y % 30) - y0;
        if (dy >= 0 && dy < len && x % 4 < 2 + (dy < len / 2 ? 1 : 0) && (dy + Math.floor(ripple * 6)) % 3 !== 0) {
          const nc = NEON[Math.floor(hash(col, row, 1208) * NEON.length)];
          c = blend(c, nc, (0.75 - (dy / len) * 0.5) * (ripple > 0.5 ? 1 : 0.75));
        }
      }
      if (ripple > 0.72 && hash(x, y, 1209) < (ripple - 0.72) * 0.8) c = blend(c, 0x4a5478, 0.3);
      img.set(x, y, c);
    }
  return img;
}
