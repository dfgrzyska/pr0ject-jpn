// Generates all pixel art into public/assets.
//   node tools/gen-art.mjs            -> assets
//   node tools/gen-art.mjs --preview  -> also writes upscaled previews to tools/preview/
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { packAtlas } from './lib/spritekit.mjs';
import { Raster } from './lib/raster.mjs';
import { buildSprites } from './art/sprites.mjs';
import { buildFont, FONT } from './art/font.mjs';
import { buildFar } from './art/far.mjs';
import { buildMid } from './art/mid.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assets = join(root, 'public', 'assets');
const previewDir = join(root, 'tools', 'preview');
const preview = process.argv.includes('--preview');
mkdirSync(join(assets, 'bg'), { recursive: true });
if (preview) mkdirSync(previewDir, { recursive: true });

const write = (rel, buf) => {
  writeFileSync(join(assets, rel), buf);
  console.log('  ', rel, `${(buf.length / 1024).toFixed(1)} KB`);
};

console.log('sprites');
const { raster: atlas, json } = packAtlas(buildSprites(), 256);
write('sprites.png', atlas.toPNG());
write('sprites.json', Buffer.from(JSON.stringify(json)));
if (preview) writeFileSync(join(previewDir, 'sprites_x4.png'), atlas.scaled(4, 0x30304a).toPNG());

console.log('icons');
{
  const icon = new Raster(32, 32);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) icon.set(x, y, y < 16 ? 0x2a1830 : 0x1b1424);
  for (let x = 3; x < 29; x++) {
    icon.set(x, 6, 0x1c1418);
    icon.set(x, 7, 0xe2421f);
    icon.set(x, 10, 0xb83018);
  }
  for (let y = 8; y < 29; y++) {
    icon.set(7, y, 0xe2421f);
    icon.set(24, y, 0xb83018);
  }
  const ship = json.frames.ship.frame;
  icon.blit(atlas.crop(ship.x, ship.y, ship.w, ship.h), 16 - Math.floor(ship.w / 2), 12);
  writeFileSync(join(root, 'public', 'icon-192.png'), icon.scaled(6).toPNG());
  writeFileSync(join(root, 'public', 'icon-512.png'), icon.scaled(16).toPNG());
}

console.log('font');
const font = buildFont();
write('font.png', font.raster.toPNG());
write('font.json', Buffer.from(JSON.stringify({ ...FONT, chars: font.chars })));
if (preview) writeFileSync(join(previewDir, 'font_x4.png'), font.raster.scaled(4, 0x30304a).toPNG());

console.log('backgrounds');
const far = buildFar();
write('bg/far.png', far.toPNG());
const mid = buildMid();
mid.chunks.forEach((c, i) => write(`bg/mid_${String(i).padStart(2, '0')}.png`, c.toPNG()));
write('bg/stage1.json', Buffer.from(JSON.stringify(mid.meta, null, 2)));
if (preview) {
  writeFileSync(join(previewDir, 'far_x2.png'), far.scaled(2).toPNG());
  // full mid strip composited over the far layer, split in a few columns for viewing
  const { composite } = await import('./art/preview.mjs');
  composite(mid, far, previewDir);
}
console.log('done');
