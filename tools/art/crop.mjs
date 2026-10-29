// dev: node tools/art/crop.mjs <stage> <u> [scale] [height] -> tools/preview/<stage>_crop_<u>.png
// Composites a window of the mid strip (at strip position u) over the far layer.
import { writeFileSync } from 'node:fs';
import { Raster } from '../lib/raster.mjs';

const [stage = 'stage1', uArg = '2000', sArg = '4', hArg = '160'] = process.argv.slice(2);
const art = await import({ stage2: './okinawa/index.mjs', stage3: './sapporo/index.mjs' }[stage] ?? './kyoto/index.mjs');
const u = Number(uArg);
const s = Number(sArg);
const h = Number(hArg);
const mid = art.buildMid();
const far = art.buildFar();
const L = mid.meta.length;
const y0 = L - u - h;
const out = new Raster(180, h);
for (let y = 0; y < h; y++)
  for (let x = 0; x < 180; x++) {
    const i = ((((y0 + y) % far.h) + far.h) % far.h * far.w + x) * 4;
    out.setRGBA(x, y, far.data[i], far.data[i + 1], far.data[i + 2], 255);
  }
out.blit(mid.strip.crop(0, y0, 180, h), 0, 0);
writeFileSync(`tools/preview/${stage}_crop_${u}.png`, out.scaled(s).toPNG());
