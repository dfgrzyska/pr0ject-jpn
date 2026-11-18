// The festival's fireworks over Onomichi's strait (docs/plan-onomichi.md, 6.3 and phase 13), the frames the game's
// Hanabi.js puts together: a star of a shell (white, so the game tints it; a hot core in a soft glow), a smaller one
// for the trails and the crackle, puffs of the smoke the shells leave drifting on the wind, the flash at a mortar's
// mouth on its barge as a shell goes up. Drawn at 540 px (3 fine px to the game's one).
import { Raster } from '../../lib/raster.mjs';

const soft = (r, R) => Math.max(0, 1 - r / R);

/** A star: a white-hot core in a glow, `R` its glow's radius (fine px). */
function star(R, core) {
  const n = Math.ceil(R) * 2 + 1;
  const c = (n - 1) / 2;
  const img = new Raster(n, n);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const r = Math.hypot(x - c, y - c);
      if (r <= core) img.set(x, y, 0xffffff, 1);
      else {
        // (a glow falling off fast, with a little cross of light through the core)
        const cross = Math.max(0, 1 - Math.min(Math.abs(x - c), Math.abs(y - c)) / 0.9) * soft(r, R) * 0.5;
        const a = soft(r, R) ** 2.2 * 0.75 + cross;
        if (a > 0.04) img.set(x, y, 0xffffff, Math.min(1, a));
      }
    }
  return img;
}

/** A puff of smoke, grey-blue, thin at its edges, uneven. */
function smoke(f) {
  const n = 42;
  const img = new Raster(n, n);
  const blobs = [[0, 0, 13], [7 - f * 3, -5 + f, 10], [-8 + f * 2, 4, 9], [3, 8 - f * 2, 8]];
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      let a = 0;
      for (const [bx, by, br] of blobs) a = Math.max(a, soft(Math.hypot(x - n / 2 - bx, y - n / 2 - by), br + 4) ** 1.4);
      // (dithered thin, so it stays a haze over the water)
      const d = ((x * 7 + y * 13 + f * 5) % 9) / 9;
      a = a * 0.55 - d * 0.08;
      if (a > 0.03) img.set(x, y, a > 0.3 ? 0xa8b0c0 : 0x8890a4, Math.min(0.6, a));
    }
  return img;
}

/** The flash at a mortar's mouth: a burst of light, sparks thrown out round it. */
function flash() {
  const n = 27;
  const c = 13;
  const img = new Raster(n, n);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const r = Math.hypot(x - c, y - c);
      const ang = Math.atan2(y - c, x - c);
      const ray = Math.max(0, Math.cos(ang * 4)) ** 6 * soft(r, 13);
      const a = soft(r, 7) ** 1.5 + ray * 0.8;
      if (a > 0.05) img.set(x, y, r < 3 ? 0xffffff : 0xfff0c0, Math.min(1, a));
    }
  return img;
}

/** The light a shell throws as it opens: a soft round glow, white (the game tints it), smooth at 540 px. */
function light() {
  const n = 96;
  const c = (n - 1) / 2;
  const img = new Raster(n, n);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const a = soft(Math.hypot(x - c, y - c), c) ** 2.4 * 0.8;
      if (a > 0.01) img.set(x, y, 0xffffff, a);
    }
  return img;
}

export function hanabiFrames(add) {
  add('hb_light', light());
  add('hb_star', star(5, 1.2));
  add('hb_star_s', star(3, 0.6));
  for (const f of [0, 1, 2]) add(`hb_smoke_${f}`, smoke(f));
  add('hb_flash', flash());
}
