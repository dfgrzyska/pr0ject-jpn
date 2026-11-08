// Deterministic title layout preview using the same art, font and layout as the game.
// node tools/art/menu-preview.mjs -> tools/preview/menu-{320,420}-{pl,en}.png (540 px wide)
import { mkdirSync, writeFileSync } from 'node:fs';
import { Raster, rgb } from '../lib/raster.mjs';
import { menuAtlas, menuWaves, EVENING_TOP } from './menu.mjs';
import { buildFont, FONT } from './font.mjs';
import { titleLayout } from '../../src/data/titleLayout.js';

const S = 3;
const art = new Map(menuAtlas().map(({ name, raster }) => [name, raster]));
const cloth = menuWaves();
const fonts = [buildFont(false), buildFont(true)];
mkdirSync('tools/preview', { recursive: true });
for (const H of [320, 420]) for (const lang of ['pl', 'en']) {
  const canvas = new Raster(180 * S, H * S);
  const p = titleLayout(H);
  // (x, y in the game's units)
  const image = (name, x, y, centered = true) => {
    const source = art.get(name);
    canvas.blit(source, x * S - (centered ? Math.floor(source.w / 2) : 0), y * S - (centered ? Math.floor(source.h / 2) : 0));
  };
  const text = (value, x, y, color, outlined = true) => {
    const font = fonts[+outlined];
    const line = new Raster(value.length * 6 + 1, 13);
    [...value].forEach((ch, col) => {
      const i = font.chars.indexOf(ch);
      if (i < 0) throw Error(`Missing glyph: ${ch}`);
      const glyph = font.raster.crop(i % FONT.perRow * 8, Math.floor(i / FONT.perRow) * 14, 7, 13);
      glyph.map((r, g, b, a) => [r * rgb(color)[0] / 255, g * rgb(color)[1] / 255, b * rgb(color)[2] / 255, a]);
      line.blit(glyph, col * 6, 0);
    });
    canvas.blit(line.scaled(S), (x - Math.floor(line.w / 2)) * S, (y - 6) * S);
  };
  canvas.rect(0, 0, canvas.w, canvas.h, 0x111b36);
  for (let y = (p.artY + 174) * S; y < canvas.h; y += cloth.h) canvas.blit(cloth, 0, y);
  image('evening', 0, p.artY - EVENING_TOP, false);
  const lantern = art.get('lantern');
  canvas.blit(lantern, 24 * S - lantern.w / 2, (p.artY + 46) * S);
  canvas.blit(lantern, 156 * S - lantern.w / 2, (p.artY + 54) * S);
  image('logo', 90, p.logoY);
  text(lang === 'pl' ? 'LEĆ PRZEZ JAPONIĘ' : 'FLY ACROSS JAPAN', 90, p.taglineY, 0xffdba8);
  const labels = lang === 'pl' ? ['WYRUSZ W PODRÓŻ', 'PIECZĄTKI', 'ALBUM YOKAI', 'SMAKI JAPONII'] : ['BEGIN YOUR JOURNEY', 'STAMPS', 'YOKAI ALBUM', 'TASTES OF JAPAN'];
  p.buttons.forEach((y, i) => {
    image(i ? 'paper_off' : 'start_on', 90, y + 1);
    text(labels[i], i ? 90 : 85, y, i ? 0x47372f : 0xfff1c9, !i);
    if (i) {
      image(['icon_stamp', 'icon_yokai', 'icon_food'][i - 1], 29, y);
      text(['0/8', '0/14', '0/16'][i - 1], 148, y, 0x76583d, false);
    }
  });
  text(lang === 'pl' ? 'OSIEM MIAST. JEDNA PODRÓŻ.' : 'EIGHT CITIES. ONE JOURNEY.', 90, p.captionY, 0xc8ac85);
  text(lang === 'pl' ? 'STRZAŁKI / ENTER' : 'ARROWS / ENTER', 90, p.hintY, 0x9aaec2);
  writeFileSync(`tools/preview/menu-${H}-${lang}.png`, canvas.toPNG());
}
