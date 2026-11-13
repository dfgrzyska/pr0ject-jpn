// The weapon power-ups as gold tokens: a coin with a bevelled rim and a coloured face carrying the weapon's icon (the
// fan of the spread shot in red, the beam of the laser in blue, the homing orb and its curling trail in green, the wing
// turret in purple), turning
// as it falls, a shine sweeping across it, a warm glow round it and a twinkle now and then. Drawn at any scale s
// (1 for sprites.png, 3 for sprites540.png), 21 x 21 times s, supersampled.
import { Raster } from '../lib/raster.mjs';

export const TOKEN_FRAMES = 8;
const FACE = { red: [0xc8241e, 0xf05a3a], blue: [0x1a5ad8, 0x4aa0ff], green: [0x1a9a32, 0x5ad85a], purple: [0x5a18a8, 0xb066f0] };
const GOLD = [0x6a4008, 0xa8701a, 0xd8a030, 0xf4cc58, 0xffec9a, 0xfffae0];

const lerp = (a, b, t) => [(a >> 16) & 255, (a >> 8) & 255, a & 255].map((v, i) => v + ([(b >> 16) & 255, (b >> 8) & 255, b & 255][i] - v) * t);
const ramp = (r, t) => {
  const k = Math.max(0, Math.min(0.999, t)) * (r.length - 1);
  const i = Math.floor(k);
  return lerp(r[i], r[i + 1], k - i);
};

/** Distance from (x, y) to the segment a-b. */
const seg = (x, y, ax, ay, bx, by) => {
  const vx = bx - ax;
  const vy = by - ay;
  const t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy)));
  return Math.hypot(x - ax - vx * t, y - ay - vy * t);
};

/** The weapon's icon on the face, in face coordinates (-1..1): how strongly a point is on it (0..1), and on its outline. */
const ICON = {
  red: (u, v) => Math.min(...[-0.6, 0, 0.6].map((a) => Math.min(seg(u, v, 0, 0.66, Math.sin(a) * 0.95, 0.66 - Math.cos(a) * 0.95) - 0.09, Math.hypot(u - Math.sin(a) * 1.05, v - 0.66 + Math.cos(a) * 1.05) - 0.2))),
  blue: (u, v) => Math.max(Math.abs(u) - 0.17, Math.abs(v) - 0.66),
  green: (u, v) => Math.min(Math.hypot(u - 0.12, v + 0.3) - 0.3, seg(u, v, -0.42, 0.62, -0.1, 0.12) - 0.1, seg(u, v, -0.1, 0.12, 0.05, -0.05) - 0.1),
  // the shield: a bubble round a small ship, a turret on each wing tip (a cross of hull and wings, two pods)
  purple: (u, v) => Math.min(Math.abs(Math.hypot(u, v * 1.08) - 0.86) - 0.13, seg(u, v, 0, -0.42, 0, 0.3) - 0.2, seg(u, v, -0.34, 0.2, 0.34, 0.2) - 0.16, Math.hypot(u - 0.42, v + 0.02) - 0.17, Math.hypot(u + 0.42, v + 0.02) - 0.17),
};

export function pickupToken(name, f, s = 1) {
  const N = 21 * s;
  const out = new Raster(N, N);
  const c = N / 2;
  const R = 7.4 * s;
  const ang = (f / TOKEN_FRAMES) * Math.PI * 2;
  const wx = Math.max(0.16, Math.abs(Math.cos(ang))); // its width, turning
  const edge = Math.min(1.6 * s, (1 - wx) * 2.2 * s); // the milled edge showing as it turns
  const shine = -1.6 + (f / (TOKEN_FRAMES - 1)) * 3.4; // the light sweeping over it
  const SS = 3;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let j = 0; j < SS; j++)
        for (let i = 0; i < SS; i++) {
          const px = x + (i + 0.5) / SS - c;
          const py = y + (j + 0.5) / SS - c;
          let col = null;
          let alpha = 1;
          const nx = px / (R * wx);
          const ny = py / R;
          const d = Math.hypot(nx, ny);
          const ex = (px + (Math.cos(ang) > 0 ? edge : -edge)) / (R * wx);
          const de = Math.hypot(ex, ny);
          if (d <= 1) {
            if (d > 0.93) col = lerp(GOLD[0], GOLD[0], 0); // its outline
            else if (d > 0.7) {
              // the rim, bevelled: bright to the upper left, deep to the lower right; a groove inside it
              const lit = 0.55 - (nx * 0.55 + ny * 0.75) * 0.45 * (d > 0.82 ? 1 : -1);
              col = ramp(GOLD, d > 0.7 && d < 0.75 ? 0.15 : lit);
            } else {
              const u = nx / 0.7;
              const v = ny / 0.7;
              const ic = ICON[name](u, v);
              if (ic < 0) col = ic > -0.08 ? [40, 20, 10] : lerp(0xffffff, 0xfff4c8, (v + 1) / 2);
              else {
                const [dk, lt] = FACE[name];
                col = lerp(dk, lt, Math.max(0, Math.min(1, 0.65 - (u * 0.4 + v * 0.5))));
                if (ic < 0.07) col = col.map((q) => q * 0.55); // the icon's shadow, set into the face
              }
            }
            // the shine
            const sh = Math.abs((nx * 0.7 + ny * 0.7) - shine);
            if (sh < 0.22 && d <= 0.93) col = col.map((q) => q + (255 - q) * (1 - sh / 0.22) * 0.6);
          } else if (de <= 1 && wx < 0.98) {
            col = ramp(GOLD, 0.25 + ((Math.floor(py * 2 / s) & 1) ? 0.15 : 0)); // the milled edge
          } else {
            // the glow round it, not turning
            const dg = Math.hypot(px, py) / (10.4 * s);
            if (dg < 1) {
              col = [255, 226, 122];
              alpha = (1 - dg) ** 2 * 0.55;
            }
          }
          if (col === null) continue;
          r += col[0] * alpha;
          g += col[1] * alpha;
          b += col[2] * alpha;
          a += alpha;
        }
      // a twinkle, up on the right, now and then
      if ((f === 2 || f === 6) && (Math.abs(x - (c + 5.5 * s)) < 0.5 * s || Math.abs(y - (c - 6 * s)) < 0.5 * s) && Math.hypot(x - (c + 5.5 * s), y - (c - 6 * s)) < 2 * s) {
        out.set(x, y, 0xffffff, 1 - Math.hypot(x - (c + 5.5 * s), y - (c - 6 * s)) / (2.2 * s));
        continue;
      }
      if (a <= 0.02) continue;
      const k = 1 / a;
      out.set(x, y, (Math.round(r * k) << 16) | (Math.round(g * k) << 8) | Math.round(b * k), Math.min(1, a / (SS * SS)));
    }
  return out;
}
