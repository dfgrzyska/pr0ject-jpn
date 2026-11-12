// The HUD's icons and the ship's small companions at 540 px (docs/graphics-540-plan.md, step 6, groups C and D),
// rebuilt from the 1x art in sprites.mjs: each pixel 3 x 3, the corners between colours smoothed (a convex corner
// takes the colour beside it, a concave one is filled), then every patch of one colour bevelled, lit along its
// upper left edge and shaded along its lower right, the way the 540 px enemies are lit.
import { Raster } from '../../lib/raster.mjs';
import { buildSprites } from '../sprites.mjs';

const ch = (c, k) => [(c >> 16) & 255, (c >> 8) & 255, c & 255].map((v) => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k))))).reduce((s, v) => (s << 8) | v, 0);

export function smooth3(src) {
  const w = src.w;
  const h = src.h;
  const col = (x, y) => (x < 0 || y < 0 || x >= w || y >= h || src.alpha(x, y) < 128 ? null : src.get(x, y));
  const out = new Raster(w * 3, h * 3);
  const key = new Array(w * 3 * h * 3).fill(null);
  for (let Y = 0; Y < h * 3; Y++)
    for (let X = 0; X < w * 3; X++) {
      const cx = Math.floor(X / 3);
      const cy = Math.floor(Y / 3);
      const sx = X % 3;
      const sy = Y % 3;
      let c = col(cx, cy);
      if (sx !== 1 && sy !== 1) {
        const dx = sx === 0 ? -1 : 1;
        const dy = sy === 0 ? -1 : 1;
        const a = col(cx + dx, cy);
        const b = col(cx, cy + dy);
        if (c !== null && a !== c && b !== c && a === b && col(cx + dx, cy + dy) !== c) c = a; // a convex corner
        else if (c === null && a !== null && a === b) c = a; // a concave one
      }
      key[Y * w * 3 + X] = c;
    }
  const W = w * 3;
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= h * 3 ? null : key[y * W + x]);
  for (let y = 0; y < h * 3; y++)
    for (let x = 0; x < W; x++) {
      const c = at(x, y);
      if (c === null) continue;
      // bevel: lighter where the patch ends up or left, darker where it ends down or right
      let k = 0;
      if (at(x, y - 1) !== c || at(x - 1, y) !== c) k = 0.22;
      else if (at(x, y + 1) !== c || at(x + 1, y) !== c) k = -0.22;
      // the dark outline colours stay as they are
      const lum = ((c >> 16) & 255) * 0.3 + ((c >> 8) & 255) * 0.5 + (c & 255) * 0.2;
      out.set(x, y, lum < 40 ? c : ch(c, k));
    }
  return out;
}

const NAMES = /^(btn_|icon_|wpn_|pip_|stamp_icon$|pickup_|hitbox$|orizuru_[0-9]|ice_block$|ps_bean)/; // (not orizuru_glow: a soft glow)
// the small effects of group A done the same way: sparks, the muzzle flash, the engine flame, splashes, blood, debris
const FX = /^(spark_|muzzle_|flame_|splash$|splat$|bloodball_|debris_|debris_hot)/;

export function ui540(add) {
  for (const { name, raster } of buildSprites()) if (NAMES.test(name) || FX.test(name)) add(name, smooth3(raster));
}
