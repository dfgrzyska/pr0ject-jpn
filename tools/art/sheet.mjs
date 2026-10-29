// dev: node tools/art/sheet.mjs name1 name2 ... -> tools/preview/sheet_x4.png (sprites side by side)
import { writeFileSync } from 'node:fs';
import { Raster } from '../lib/raster.mjs';
import { buildSprites } from './sprites.mjs';

const sp = Object.fromEntries(buildSprites().map((s) => [s.name, s.raster]));
const names = process.argv.slice(2);
const items = names.map((n) => sp[n]).filter(Boolean);
const H = Math.max(...items.map((r) => r.h)) + 4;
const W = items.reduce((a, r) => a + r.w + 4, 4);
const out = new Raster(W, H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) out.set(x, y, 0x1a4a6a);
let x = 2;
for (const r of items) {
  out.blit(r, x, 2);
  x += r.w + 4;
}
writeFileSync('tools/preview/sheet_x4.png', out.scaled(4).toPNG());
console.log(`${items.length}/${names.length} sprites, ${W}x${H}`);
