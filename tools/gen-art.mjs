// Generates all pixel art into public/assets.
//   node tools/gen-art.mjs            -> assets
//   node tools/gen-art.mjs --preview  -> also writes upscaled previews to tools/preview/
//   node tools/gen-art.mjs --only=stage2  -> sprites + font + only that stage's backgrounds
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { packAtlas } from './lib/spritekit.mjs';
import { Raster } from './lib/raster.mjs';
import { buildSprites } from './art/sprites.mjs';
import { buildFont, FONT } from './art/font.mjs';
import { buildJapanMap } from './art/japan.mjs';
import * as kyoto from './art/kyoto/index.mjs';
import * as okinawa from './art/okinawa/index.mjs';
import * as sapporo from './art/sapporo/index.mjs';
import * as kagoshima from './art/kagoshima/index.mjs';
import * as osaka from './art/osaka/index.mjs';
import * as beppu from './art/beppu/index.mjs';

// background generators per stage (id = folder under public/assets/bg/)
const STAGES = [
  { id: 'stage1', art: kyoto },
  { id: 'stage2', art: okinawa },
  { id: 'stage3', art: sapporo },
  { id: 'stage4', art: kagoshima },
  { id: 'stage5', art: osaka },
  { id: 'stage6', art: beppu },
];

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assets = join(root, 'public', 'assets');
const previewDir = join(root, 'tools', 'preview');
const preview = process.argv.includes('--preview');
const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7);
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
// non-ASCII escaped, so the glyph list survives any charset handling on the way to the browser
const asciiJson = (o) => JSON.stringify(o).replace(/[\u0080-￿]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
write('font.json', Buffer.from(asciiJson({ ...FONT, chars: font.chars })));
if (preview) writeFileSync(join(previewDir, 'font_x4.png'), font.raster.scaled(4, 0x30304a).toPNG());

console.log('map of Japan');
const japan = buildJapanMap();
write('japan.png', japan.toPNG());
if (preview) writeFileSync(join(previewDir, 'japan_x3.png'), japan.scaled(3).toPNG());

for (const { id, art } of STAGES) {
  if (only && only !== id) continue;
  console.log(`backgrounds ${id}`);
  mkdirSync(join(assets, 'bg', id), { recursive: true });
  const far = art.buildFar();
  write(`bg/${id}/far.png`, far.toPNG());
  const mid = art.buildMid();
  mid.chunks.forEach((c, i) => write(`bg/${id}/mid_${String(i).padStart(2, '0')}.png`, c.toPNG()));
  if (mid.props) {
    // the moving parts: their frames, and where they go and how they move (in meta.json)
    write(`bg/${id}/props.png`, mid.props.raster.toPNG());
    write(`bg/${id}/props.json`, Buffer.from(JSON.stringify(mid.props.json)));
    mid.meta.props = mid.props.props;
    if (preview) writeFileSync(join(previewDir, `${id}_props_x4.png`), mid.props.raster.scaled(4, 0x30304a).toPNG());
  }
  write(`bg/${id}/meta.json`, Buffer.from(JSON.stringify(mid.meta)));
  if (preview) {
    writeFileSync(join(previewDir, `${id}_far_x2.png`), far.scaled(2).toPNG());
    // full mid strip composited over the far layer, split in a few columns for viewing
    const { composite } = await import('./art/preview.mjs');
    composite(mid, far, previewDir, id);
  }
}
console.log('done');
