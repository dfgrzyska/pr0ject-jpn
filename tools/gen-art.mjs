// Generates all pixel art into public/assets.
//   node tools/gen-art.mjs                -> all shared + stage assets
//   node tools/gen-art.mjs --preview      -> also writes previews to tools/preview/
//   node tools/gen-art.mjs --only=stage1  -> only that stage's backgrounds & props (leaves shared assets untouched)
//   node tools/gen-art.mjs --only=shared  -> only shared sprites, icons, font, map & ending
//   node tools/gen-art.mjs --only=enemies -> only the cities' 540 px enemies (bg/<id>/enemies.*) and the portraits
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { packAtlas } from './lib/spritekit.mjs';
import { Raster } from './lib/raster.mjs';
import { buildSprites } from './art/sprites.mjs';
import { buildFont, FONT } from './art/font.mjs';
import { buildJapanMap } from './art/japan.mjs';
import { menuAtlas, menuWaves, menuWashi } from './art/menu.mjs';
import { buildEnding, buildEndingClouds, buildEndingNight } from './art/ending.mjs';
import * as kyoto from './art/kyoto/index.mjs';
import * as okinawa from './art/okinawa/index.mjs';
import * as sapporo from './art/sapporo/index.mjs';
import * as kagoshima from './art/kagoshima/index.mjs';
import * as osaka from './art/osaka/index.mjs';
import * as beppu from './art/beppu/index.mjs';
import * as nagasaki from './art/nagasaki/index.mjs';
import * as hiroshima from './art/hiroshima/index.mjs';
import { kyotoEnemies, KYOTO_PORTRAITS } from './art/kyoto/enemies.mjs';
import { okinawaEnemies, OKINAWA_PORTRAITS } from './art/okinawa/enemies.mjs';
import { sapporoEnemies, SAPPORO_PORTRAITS } from './art/sapporo/enemies.mjs';
import { kagoshimaEnemies, KAGOSHIMA_PORTRAITS } from './art/kagoshima/enemies.mjs';

// cities whose enemies are drawn at 540 px (docs/enemies-540-plan.md): their atlas, and what of it the album
// and the bosses' parade show (src/game/enemyArt.js; the stage file says "enemyArt": true)
const ENEMY_ART = [
  { id: 'stage1', build: kyotoEnemies, portraits: KYOTO_PORTRAITS },
  { id: 'stage2', build: okinawaEnemies, portraits: OKINAWA_PORTRAITS },
  { id: 'stage3', build: sapporoEnemies, portraits: SAPPORO_PORTRAITS },
  { id: 'stage4', build: kagoshimaEnemies, portraits: KAGOSHIMA_PORTRAITS },
];

// background generators per stage (id = folder under public/assets/bg/)
const STAGES = [
  { id: 'stage1', art: kyoto },
  { id: 'stage2', art: okinawa },
  { id: 'stage3', art: sapporo },
  { id: 'stage4', art: kagoshima },
  { id: 'stage5', art: osaka },
  { id: 'stage6', art: beppu },
  { id: 'stage7', art: hiroshima },
  { id: 'stage8', art: nagasaki },
];

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MID_PIECE = 1792; // height of each middle-layer image the game loads (the strip is 7168 = 4 x 1792)
const assets = join(root, 'public', 'assets');
const previewDir = join(root, 'tools', 'preview');
const preview = process.argv.includes('--preview');
const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7);
if (preview) mkdirSync(previewDir, { recursive: true });

const write = (rel, buf) => {
  writeFileSync(join(assets, rel), buf);
  console.log('  ', rel, `${(buf.length / 1024).toFixed(1)} KB`);
};

if (!only || only === 'shared') {
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
write('font_ink.png', buildFont(false).raster.toPNG()); // the same glyphs without the outline, same layout
// non-ASCII escaped, so the glyph list survives any charset handling on the way to the browser
const asciiJson = (o) => JSON.stringify(o).replace(/[\u0080-￿]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
write('font.json', Buffer.from(asciiJson({ ...FONT, chars: font.chars })));
if (preview) writeFileSync(join(previewDir, 'font_x4.png'), font.raster.scaled(4, 0x30304a).toPNG());

console.log('menu');
{
  const { raster, json } = packAtlas(menuAtlas(), 1024, 2, 'menu.png');
  write('menu.png', raster.toPNG());
  write('menu.json', Buffer.from(JSON.stringify(json)));
  write('menu_waves.png', menuWaves().toPNG());
  write('menu_washi.png', menuWashi().toPNG());
}

console.log('map of Japan');
const japan = buildJapanMap();
write('japan.png', japan.toPNG());
if (preview) writeFileSync(join(previewDir, 'japan_x3.png'), japan.scaled(3).toPNG());

console.log('ending');
const ending = buildEnding();
write('ending.png', ending.toPNG());
write('ending_clouds.png', buildEndingClouds().toPNG());
write('ending_night.png', buildEndingNight().toPNG());
if (preview) writeFileSync(join(previewDir, 'ending_x1.png'), ending.toPNG());
}

if (!only || only === 'enemies') {
  console.log('enemies at 540 px');
  const portraits = [];
  for (const { id, build, portraits: names } of ENEMY_ART) {
    const list = [];
    build((name, raster) => list.push({ name, raster }));
    const { raster, json } = packAtlas(list, 1024, 2, 'enemies.png');
    mkdirSync(join(assets, 'bg', id), { recursive: true });
    write(`bg/${id}/enemies.png`, raster.toPNG());
    write(`bg/${id}/enemies.json`, Buffer.from(JSON.stringify(json)));
    for (const n of names) portraits.push(list.find((e) => e.name === n) ?? (() => { throw new Error(`no portrait ${n} in ${id}`); })());
    if (preview) writeFileSync(join(previewDir, `${id}_enemies.png`), raster.toPNG());
  }
  const { raster, json } = packAtlas(portraits, 512, 2, 'portraits.png');
  write('portraits.png', raster.toPNG());
  write('portraits.json', Buffer.from(JSON.stringify(json)));
}

for (const { id, art } of STAGES) {
  if (only && only !== id) continue;
  console.log(`backgrounds ${id}`);
  mkdirSync(join(assets, 'bg', id), { recursive: true });
  const far = art.buildFar();
  write(`bg/${id}/far.png`, far.toPNG());
  const mid = art.buildMid();
  const artScale = mid.meta.artScale ?? 1;
  // 1x stages go out in four 1792px pieces; 3x stages use eight 896-unit (2688px) pieces to stay well under 4096px WebGL limits
  const chunkHeight = artScale > 1 ? 896 : MID_PIECE;
  const chunkPx = chunkHeight * artScale;
  const pieces = Math.ceil(mid.strip.h / chunkPx);
  for (let i = 0; i < pieces; i++) write(`bg/${id}/mid_${String(i).padStart(2, '0')}.png`, mid.strip.crop(0, i * chunkPx, mid.strip.w, chunkPx).toPNG());
  for (const f of readdirSync(join(assets, 'bg', id))) if (/^mid_\d+\.png$/.test(f) && Number(f.slice(4, 6)) >= pieces) rmSync(join(assets, 'bg', id, f));
  Object.assign(mid.meta, { chunkHeight, chunks: pieces });
  if (mid.props) {
    // the moving parts: their frames, and where they go and how they move (in meta.json)
    write(`bg/${id}/props.png`, mid.props.raster.toPNG());
    write(`bg/${id}/props.json`, Buffer.from(JSON.stringify(mid.props.json)));
    mid.meta.props = mid.props.props;
    if (preview) writeFileSync(join(previewDir, `${id}_props_x4.png`), mid.props.raster.scaled(artScale > 1 ? 1 : 4, 0x30304a).toPNG());
  }
  if (art.buildPanorama) {
    const panorama = art.buildPanorama();
    mid.meta.panorama = Object.keys(panorama);
    // a layer is only as tall as what is on it: its empty rows at the top and bottom are not stored, its top noted for the game
    mid.meta.panoramaTop = {};
    for (const [name, raster] of Object.entries(panorama)) {
      const used = (y) => {
        for (let x = 0; x < raster.w; x++) if (raster.data[(y * raster.w + x) * 4 + 3]) return true;
        return false;
      };
      let top = 0;
      let end = raster.h;
      while (top < end - 1 && !used(top)) top++;
      while (end - 1 > top && !used(end - 1)) end--;
      mid.meta.panoramaTop[name] = top;
      write(`bg/${id}/view_${name}.png`, raster.crop(0, top, raster.w, end - top).toPNG());
    }
  }
  write(`bg/${id}/meta.json`, Buffer.from(JSON.stringify(mid.meta)));
  if (preview) {
    writeFileSync(join(previewDir, `${id}_far_x2.png`), far.scaled(artScale > 1 ? 1 : 2).toPNG());
    // full mid strip composited over the far layer, split in a few columns for viewing
    const { composite } = await import('./art/preview.mjs');
    composite(mid, far, previewDir, id);
  }
}
console.log('done');
