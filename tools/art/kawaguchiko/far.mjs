// Kawaguchiko's far layer: the lake seen where the middle layer is open (docs/plan-kawaguchiko.md, phase 8). A
// seamless vertical loop at 540 px. The water at the golden hour: deep blue-green under long bands of the warm sky's
// light, and in it Fuji upside down - its base towards the far shore (up the screen), its summit and snow cap towards
// us - soft, darker than the mountain, broken into bands by the ripples, a glint of the sun on a crest here and there.
import { Raster, fbm } from '../../lib/raster.mjs';
import { hashPx } from '../hires.mjs';
import { S } from './route.mjs';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a.map((v, k) => v + (b[k] - v) * t);

const H0 = 384; // (the loop's height in the game's pixels)
// the reflection: its base (the far shore's line) near the loop's top, the summit lower down, upside down
const BASE = 34;
const APEX = 236;
const CX = 92;
const half = (d) => (6 + 0.96 * d + 0.0062 * d * d) * 0.82;

/** The mountain's reflection at (x, y): [colour, strength] or null off it. */
function reflection(x, y) {
  const d = APEX - y; // (how far from the summit, up the screen towards the base)
  if (d < 0 || y < BASE - 10) return null;
  const w = half(d);
  const s = Math.abs(x - CX) / w;
  if (s > 1.08) return null;
  const t = d / (APEX - BASE);
  const phi = Math.asin(Math.max(-1, Math.min(1, (x - CX) / w)));
  // snow lower in the gullies, as on the mountain itself (view.mjs), only softer
  const gully = fbm(phi * 8, t * 2, { seed: 1011, scale: 1.1, octaves: 2 });
  const snow = t < 0.28 + (1 - gully) * 0.2 + (fbm(phi * 30, t * 20, { seed: 1012, scale: 1, octaves: 1 }) - 0.5) * 0.05;
  const lit = 0.72 + 0.28 * smooth(-0.5, 0.5, phi); // (the right flank, towards the sun, lighter)
  let c = snow ? [188, 170, 192] : t < 0.5 ? [80, 60, 74] : [40, 48, 60];
  c = c.map((v) => v * lit);
  const edge = 1 - smooth(0.92, 1.08, s);
  return [c, edge * smooth(BASE - 10, BASE + 40, y)];
}

export function buildFar() {
  const W = 180 * S;
  const H = H0 * S;
  const img = new Raster(W, H);
  for (let Y = 0; Y < H; Y++)
    for (let X = 0; X < W; X++) {
      const [x, y] = [(X + 0.5) / S, (Y + 0.5) / S];
      // the ripples: thin horizontal bands, each shifting what it mirrors a little sideways
      const band = fbm(x * 0.06, y, { seed: 1001, scale: 1.5, octaves: 2, periodY: H0 }); // (periods a whole number of cells: the loop is seamless)
      const chop = fbm(x * 0.4, y * 2, { seed: 1002, scale: 1.2, octaves: 2, periodY: H0 * 2 });
      const swell = fbm(x * 0.5, y, { seed: 1003, scale: 24, octaves: 3, periodY: H0 });
      // the water: deep blue-green, long bands of the golden sky laid on it
      let c = mix([20, 52, 70], [44, 82, 98], swell);
      const glow = smooth(0.5, 0.78, band) * (0.55 + 0.45 * Math.sin((y / H0) * Math.PI * 2 + 1.3) ** 2);
      c = mix(c, [208, 150, 112], glow * 0.55);
      const wob = (band - 0.5) * 7 + (chop - 0.5) * 2;
      const r = reflection(x + wob, y);
      if (r) c = mix(c, mix(r[0], c, 0.3), r[1] * (band < 0.34 ? 0.4 : 0.78));
      if (chop < 0.28) c = c.map((v) => v * 0.82); // the troughs
      if (chop > 0.8 && band > 0.6 && hashPx(X, Y, 1004) < 0.05) c = mix(c, [255, 224, 176], 0.6); // a glint of the sun
      const th = (BAYER[(Y & 3) * 4 + (X & 3)] / 16 - 0.47) * 6;
      const q = c.map((v) => Math.max(0, Math.min(255, Math.round((v + th) / 6) * 6)));
      img.setRGBA(X, Y, q[0], q[1], q[2], 255);
    }
  return img;
}
