// dev: node tools/art/crop.mjs <stage> <u> [scale] [height] -> tools/preview/<stage>_crop_<u>.png
// Composites a window of the mid strip (at strip position u) over the far layer.
import { writeFileSync } from 'node:fs';
import { Raster } from '../lib/raster.mjs';

const [stage = 'stage1', uArg = '2000', sArg, hArg = '160'] = process.argv.slice(2);
const art = await import({ stage2: './okinawa/index.mjs', stage3: './sapporo/index.mjs', stage4: './kagoshima/index.mjs', stage5: './osaka/index.mjs', stage6: './beppu/index.mjs', stage7: './hiroshima/index.mjs', stage8: './nagasaki/index.mjs' }[stage] ?? './kyoto/index.mjs');
const u = Number(uArg);
const h = Number(hArg);
const mid = art.buildMid();
const far = art.buildFar();
const artScale = mid.meta.artScale ?? 1;
const s = sArg !== undefined ? Number(sArg) : artScale > 1 ? 1 : 4;
const L = mid.meta.length;
const W = 180 * artScale;
const H = h * artScale;
const y0 = (L - u - h) * artScale;
const out = new Raster(W, H);
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const i = ((((y0 + y) % far.h) + far.h) % far.h * far.w + x) * 4;
    out.setRGBA(x, y, far.data[i], far.data[i + 1], far.data[i + 2], 255);
  }
out.blit(mid.strip.crop(0, y0, W, H), 0, 0);
writeFileSync(`tools/preview/${stage}_crop_${u}.png`, (s === 1 ? out : out.scaled(s)).toPNG());
