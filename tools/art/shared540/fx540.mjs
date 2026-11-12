// The shared effects at 540 px (docs/graphics-540-plan.md, step 6, group A): every frame exactly three times
// the old one in sprites.png, under the same name (the game takes it from sprites540 when it is there).
import { Raster, fbm } from '../../lib/raster.mjs';

function lcg(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// fire from white heat down to soot (heat thresholds), then the smoke it turns into
const FIRE = [
  [0.95, 0xffffff],
  [0.78, 0xfff6c0],
  [0.62, 0xffe070],
  [0.48, 0xffb030],
  [0.36, 0xff7a1a],
  [0.25, 0xe8401e],
  [0.15, 0xb02418],
  [0.06, 0x6a1a1e],
];
const SMOKE = [0x8a7e86, 0x6a6070, 0x4e4658, 0x3a3448];

/**
 * An explosion, frame f of n, `size` fine px square (3x the old 16/28/48): a billowing fireball with a white
 * core, a shock ring in the first frames, embers thrown out; it cools from the edge inwards and breaks up into
 * smoke with holes.
 */
export function explosion(size, n, f, seed) {
  const r = new Raster(size, size);
  const t = f / (n - 1);
  const c = size / 2;
  const R = (size / 2 - 3) * (0.32 + 0.68 * (1 - (1 - t) ** 2.2));
  const rnd = lcg(seed * 31 + 7);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - c;
      const dy = y + 0.5 - c;
      // billows: the edge pushed out and in by noise, lobes of fire
      const ang = Math.atan2(dy, dx);
      const lobes = 1 + 0.04 * Math.sin(ang * 7 + seed) + (fbm(Math.cos(ang) * 14 + seed, Math.sin(ang) * 14, { seed, scale: 5, octaves: 3 }) - 0.5) * 0.5;
      const d = Math.hypot(dx, dy) / (R * lobes);
      if (d > 1) continue;
      const n1 = fbm(x, y, { seed, scale: size / 7, octaves: 4 });
      // dissipating: holes eat in from the edge as it cools
      if (t > 0.42 && n1 < (t - 0.42) * 1.5 + d * 0.32) continue;
      // light from the upper left on each billow (the noise's slope)
      const nl = fbm(x - 2, y - 2, { seed, scale: size / 7, octaves: 4 });
      const lit = (n1 - nl) * 2.2;
      let heat = 1.1 - t * 1.2 - d * 0.6 + (n1 - 0.5) * 0.65 + lit * 0.4;
      if (heat > 0.06) {
        const band = FIRE.find(([th]) => heat > th);
        r.set(x, y, band[1]);
      } else {
        // smoke: grey-violet, lighter on top
        const k = Math.max(0, Math.min(3, Math.floor((0.06 - heat) * 9 - lit * 4 + (dy / R) * 1.2)));
        r.set(x, y, SMOKE[k], t > 0.7 ? 1 - (t - 0.7) * 1.4 : 1);
      }
    }
  // the shock ring of the first frames
  if (t < 0.35) {
    const rr = R * (1.08 + t * 0.6);
    const a = 1 - t / 0.35;
    for (let k = 0; k < 360; k++) {
      const an = (k / 360) * Math.PI * 2;
      for (const w of [0, 1]) r.set(Math.round(c + Math.cos(an) * (rr + w)), Math.round(c + Math.sin(an) * (rr + w)), w ? 0xffd080 : 0xffffff, a * (w ? 0.5 : 0.8));
    }
  }
  // embers thrown out, further each frame, fading
  const count = Math.round(size / 6);
  for (let i = 0; i < count; i++) {
    const an = rnd() * Math.PI * 2;
    const sp = 0.5 + rnd() * 0.6;
    const dist = (size / 2 - 2) * Math.min(1, 0.25 + t * sp * 1.2);
    if (t > 0.85 || rnd() < t * 0.4) continue;
    const ex = Math.round(c + Math.cos(an) * dist);
    const ey = Math.round(c + Math.sin(an) * dist);
    const col = t < 0.3 ? 0xffffff : t < 0.6 ? 0xffe070 : 0xff7a1a;
    for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) r.set(ex + ox, ey + oy, col);
    for (let k = 1; k <= 3; k++) r.set(ex - Math.round(Math.cos(an) * k), ey - Math.round(Math.sin(an) * k), 0xe8401e, 0.8 - k * 0.2); // its trail
  }
  return r;
}

export function fx540(add) {
  for (const [name, size, n, seed] of [['expl_s', 48, 5, 7], ['expl_m', 84, 6, 11], ['expl_l', 144, 8, 23]])
    for (let f = 0; f < n; f++) add(`${name}_${f}`, explosion(size, n, f, seed));
}
