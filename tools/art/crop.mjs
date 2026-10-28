// dev: node tools/art/crop.mjs <u> [scale] -> tools/preview/crop.png (composited 180x160 window at strip u)
import { readFileSync, writeFileSync } from 'node:fs';
import { buildMid } from './mid.mjs';
import { buildFar } from './far.mjs';
import { Raster } from '../lib/raster.mjs';
const u = Number(process.argv[2] ?? 2000);
const s = Number(process.argv[3] ?? 4);
const h = Number(process.argv[4] ?? 160);
const mid = buildMid();
const far = buildFar();
const L = mid.meta.length;
const y0 = L - u - h;
const out = new Raster(180, h);
for (let y = 0; y < h; y++) for (let x = 0; x < 180; x++) {
  const i = (((y0 + y) % far.h) * far.w + x) * 4;
  out.setRGBA(x, y, far.data[i], far.data[i + 1], far.data[i + 2], 255);
}
out.blit(mid.strip.crop(0, y0, 180, h), 0, 0);
writeFileSync(`tools/preview/crop_${u}.png`, out.scaled(s).toPNG());
