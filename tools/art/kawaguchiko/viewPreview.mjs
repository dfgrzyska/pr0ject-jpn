// Fuji's panorama for review (not part of the game's art): node tools/art/kawaguchiko/viewPreview.mjs
//   -> tools/preview/stage10_view.png: the layers put together, cut to the screen's 180 px (540 fine pixels) as the
//      player sees it when the view has risen.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Raster } from '../../lib/raster.mjs';
import { buildPanorama, S } from './view.mjs';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'preview');
mkdirSync(dir, { recursive: true });
const { sky, land, water } = buildPanorama();
const out = new Raster(180 * S, sky.h);
for (let y = 0; y < out.h; y++)
  for (let x = 0; x < out.w; x++) {
    const X = x + 18 * S;
    for (const r of [water, land, sky]) {
      const i = (y * r.w + X) * 4;
      if (!r.data[i + 3]) continue;
      out.setRGBA(x, y, r.data[i], r.data[i + 1], r.data[i + 2], 255);
      break;
    }
  }
writeFileSync(join(dir, 'stage10_view.png'), out.toPNG());
console.log('stage10_view.png');
// two crops at 2x: the summit with its cap, the far shore under the hills
writeFileSync(join(dir, 'stage10_view_summit.png'), out.crop(150, 270, 240, 260).scaled(2).toPNG());
writeFileSync(join(dir, 'stage10_view_shore.png'), out.crop(120, 640, 300, 180).scaled(2).toPNG());
