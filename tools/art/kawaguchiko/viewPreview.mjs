// Fuji's panorama for review (not part of the game's art): node tools/art/kawaguchiko/viewPreview.mjs
//   -> tools/preview/stage10_view.png: the layers put together as at sunset and, beside it, at dusk after the fight
//      (the sky and hills tinted as the game tints them, the far shore's lights on), each cut to the screen's 180 px;
//      tools/preview/stage10_view_summit.png, stage10_view_shore.png: crops of the sunset at 2x.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Raster } from '../../lib/raster.mjs';
import { buildPanorama, S, SKY_DUSK, HILLS_DUSK } from './view.mjs';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'preview');
mkdirSync(dir, { recursive: true });
const L = buildPanorama();
const SW = 180 * S;
const out = new Raster(SW * 2 + 12, L.sky.h);
const ONE = [1, 1, 1];
/** Put the layers, bottom first, at column ox: [raster, tint]. */
const compose = (ox, stack) => {
  for (let y = 0; y < out.h; y++)
    for (let x = 0; x < SW; x++) {
      const X = x + 18 * S;
      let c = [0, 0, 0];
      for (const [r, tint] of stack) {
        const i = (y * r.w + X) * 4;
        const a = r.data[i + 3] / 255;
        if (!a) continue;
        c = c.map((v, k) => v * (1 - a) + r.data[i + k] * tint[k] * a);
      }
      out.setRGBA(ox + x, y, c[0], c[1], c[2], 255);
    }
};
compose(0, [[L.sky, ONE], [L.fujiSun, ONE], [L.hills, ONE], [L.waterSun, ONE]]);
compose(SW + 12, [[L.sky, SKY_DUSK], [L.fuji, ONE], [L.hills, HILLS_DUSK], [L.water, ONE], [L.lights, ONE]]);
writeFileSync(join(dir, 'stage10_view.png'), out.toPNG());
console.log('stage10_view.png');
writeFileSync(join(dir, 'stage10_view_summit.png'), out.crop(150, 270, 240, 260).scaled(2).toPNG());
writeFileSync(join(dir, 'stage10_view_shore.png'), out.crop(SW + 12 + 120, 640, 300, 180).scaled(2).toPNG());
