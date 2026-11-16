// The hulls that move, drawn at 540 px only: every frame of each (<base><suffix>), with its neutral white twin
// (_g) and a layer for each of its livery's colours (_p0...) for the paint jobs; and each frame at a third for
// the old atlas (tools/tests/sprites540.test.mjs: every frame here has its namesake there).
import { Raster } from '../../lib/raster.mjs';
import { crane, ORIZURU_FRAMES } from './orizuru540.mjs';
import { phoenix, HOUOU_FRAMES } from './houou540.mjs';

export const HULLS = [
  { base: 'ship_orizuru', frames: ORIZURU_FRAMES, draw: crane, roles: 3 },
  { base: 'ship_houou', frames: HOUOU_FRAMES, draw: phoenix, roles: 3 },
];

export function hulls540(add) {
  for (const h of HULLS)
    for (const [suffix, opts] of h.frames) {
      const name = `${h.base}${suffix}`;
      add(name, h.draw(opts));
      add(`${name}_g`, h.draw({ ...opts, layer: 'g' }));
      for (let i = 0; i < h.roles; i++) add(`${name}_p${i}`, h.draw({ ...opts, layer: i }));
    }
}

export function hullsLow(add) {
  for (const h of HULLS)
    for (const [suffix, opts] of h.frames) {
      const hi = h.draw(opts);
      const lo = new Raster(hi.w / 3, hi.h / 3);
      for (let y = 0; y < lo.h; y++) for (let x = 0; x < lo.w; x++) if (hi.alpha(x * 3 + 1, y * 3 + 1)) lo.set(x, y, hi.get(x * 3 + 1, y * 3 + 1));
      add(`${h.base}${suffix}`, lo);
    }
}
