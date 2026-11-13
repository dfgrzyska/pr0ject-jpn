// The purple power-up's wing turret and its shot, drawn at any scale s (1 for sprites.png, 3 for sprites540.png),
// supersampled: a low gold-rimmed pod in violet lacquer with a gold barrel up, and a slow violet bolt with a hot core.
import { Raster } from '../lib/raster.mjs';

const mix = (a, b, t) => [(a >> 16) & 255, (a >> 8) & 255, a & 255].map((v, i) => v + ([(b >> 16) & 255, (b >> 8) & 255, b & 255][i] - v) * t);
const rgb = (c) => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
const hex = (c) => (Math.round(c[0]) << 16) | (Math.round(c[1]) << 8) | Math.round(c[2]);

function paint(W, H, s, at) {
  const out = new Raster(W * s, H * s);
  const SS = 4;
  for (let y = 0; y < H * s; y++)
    for (let x = 0; x < W * s; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let j = 0; j < SS; j++)
        for (let i = 0; i < SS; i++) {
          const hit = at((x + (i + 0.5) / SS) / s - W / 2, (y + (j + 0.5) / SS) / s - H / 2);
          if (!hit) continue;
          const [col, al] = hit;
          r += col[0] * al;
          g += col[1] * al;
          b += col[2] * al;
          a += al;
        }
      if (a <= 0.03) continue;
      out.set(x, y, hex([r / a, g / a, b / a]), Math.min(1, a / (SS * SS)));
    }
  return out;
}

/** The turret, 7 x 9 (times s): a rounded pod on the wing tip, gold rim, a violet dome, a barrel pointing up. */
export function wingTurret(s = 1) {
  return paint(7, 9, s, (x, y) => {
    // the barrel, gold, a darker bore down its middle and a ring at the muzzle
    if (Math.abs(x) < 1.25 && y > -3.6 && y < -0.2) {
      if (y < -2.9) return [rgb(0xf4cc58), 1];
      return [rgb(Math.abs(x) < 0.35 ? 0x5a3008 : x < 0 ? 0xf4cc58 : 0xa8701a), 1];
    }
    // the pod: wide and low, a gold rim, violet lacquer lit from the upper left
    const d = Math.hypot(x / 3.5, (y - 1.4) / 2.9);
    if (d > 1) return null;
    if (d > 0.78) return [mix(0x6a4008, 0xf4cc58, Math.max(0, Math.min(1, 0.55 - x * 0.14 - (y - 1.6) * 0.2))), 1];
    if (Math.hypot(x + 1.2, y - 0.9) < 0.6) return [rgb(0xffffff), 1]; // a glint
    return [mix(0x3a0c78, 0xc488ff, Math.max(0, Math.min(1, 0.7 - x * 0.16 - (y - 1.6) * 0.24))), 1];
  });
}

/** The turret's shot, 5 x 9 (times s): a violet bolt, white-hot in the middle, its glow trailing down. */
export function turretShot(s = 1) {
  return paint(5, 9, s, (x, y) => {
    const d = Math.hypot(x / 1.5, (y + 1.4) / 2.6);
    if (d <= 1) return [mix(0xffffff, 0xb066f0, Math.min(1, d * 1.15)), 1];
    const dg = Math.hypot(x / 2.4, (y + 0.6) / 4.3);
    if (dg <= 1) return [[200, 130, 255], (1 - dg) * 0.8];
    return null;
  });
}
