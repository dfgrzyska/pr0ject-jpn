// Onomichi's far layer: the water of the Seto Inland Sea, seen where the middle layer is open (docs/plan-onomichi.md,
// phase 7). A seamless vertical loop at 540 px. A summer afternoon on the strait: deep blue-green water running in the
// tide's lanes along the strait, smooth slicks of it beside choppy ones, thin lines of foam where two streams meet,
// a few slow eddies turning off them, and the sun glinting on the crests of the chop.
import { Raster, fbm } from '../../lib/raster.mjs';
import { rampColor } from '../nature.mjs';
import { S } from './route.mjs';

const WATER = [0x0e3a4c, 0x154c60, 0x1e6072, 0x2c7484, 0x448a96];
const SLICK = [0x12465a, 0x1a586c, 0x23687a, 0x2e788a, 0x3e8898]; // (a smoother, glassier lane of the stream)
const H0 = 384; // (the loop's height in the game's pixels)
const hashOf = (x, y) => (((x * 374761393 + y * 668265263) ^ ((x * 374761393 + y * 668265263) >>> 13)) >>> 0) % 1000 / 1000;
// a few eddies turning off the streams' edges: [x, y, radius, which way] (game px)
const EDDIES = [[38, 70, 16, 1], [132, 168, 20, -1], [70, 286, 14, 1], [150, 336, 12, -1]];

export function buildFar() {
  const W = 180 * S;
  const H = H0 * S;
  const img = new Raster(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const [gx, gy] = [x / S, y / S];
      // the tide's lanes: long along the strait, meandering a little
      const lane = fbm(gx * 0.9 + 8 * Math.sin(gy * 0.02), gy * 0.12, { seed: 1108, scale: 22, octaves: 2, periodY: H0 * 0.12 });
      const slick = lane > 0.55;
      const swell = fbm(gx * 0.5, gy, { seed: 1101, scale: 26, octaves: 3, periodY: H0 });
      const chop = fbm(gx, gy * 2, { seed: 1102, scale: slick ? 9 : 5, octaves: 2, periodY: H0 * 2 });
      // (the chop's crests stretched along the stream: short dashes, not round blobs)
      const v = slick ? swell * 0.75 + chop * 0.25 : swell * 0.55 + chop * 0.45;
      let c = rampColor(slick ? SLICK : WATER, v, x, y);
      // a line of foam where two streams meet, broken into flecks
      const edge = Math.abs(lane - 0.55);
      const fleck = fbm(gx * 3, gy * 1.5, { seed: 1109, scale: 3, octaves: 1, periodY: H0 * 1.5 });
      if (edge < 0.01 && fleck > 0.6) c = 0x7ab0b8;
      else if (edge < 0.02 && fleck > 0.5 && (x + y * 3) % 5 === 0) c = 0x4a8c98;
      // eddies: arcs of a lighter water turning off the streams
      for (const [ex, ey, r, dir] of EDDIES) {
        for (const k of [-1, 0, 1]) {
          const dy = gy - ey + k * H0;
          const dx = gx - ex;
          const d = Math.hypot(dx, dy);
          if (d > r * 1.15) continue;
          // (a soft turning of the water: its arms only a shade lighter, broken, fading out to its rim)
          const arm = Math.sin(Math.atan2(dy, dx) * 2 * dir + d * 0.5);
          const fade = 1 - d / (r * 1.15);
          if (d > r * 0.3 && arm > 0.9 - fade * 0.1 && hashOf(x, y) < 0.35 + fade * 0.4) c = rampColor(WATER, 0.78, x, y);
        }
      }
      // the sun glinting on the chop's crests (more on the choppy water than on the slicks)
      const hi = chop - (slick ? 0.8 : 0.72);
      if (hi > 0 && ((x * 7 + y * 13) % 29) < hi * 120) c = hi > 0.06 ? 0xe8f4f0 : 0x9ad0d4;
      img.set(x, y, c);
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
