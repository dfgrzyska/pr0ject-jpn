// Deterministic title layout preview using the same sprites, font and layout as the game.
// node tools/art/menu-preview.mjs -> tools/preview/menu-{320,420}-{pl,en}.png
import { mkdirSync, writeFileSync } from 'node:fs';
import { Raster, rgb } from '../lib/raster.mjs';
import { buildSprites } from './sprites.mjs';
import { buildFont, FONT } from './font.mjs';
import { titleLayout } from '../../src/data/titleLayout.js';

const sprites = new Map(buildSprites().map(({ name, raster }) => [name, raster]));
const fonts = [buildFont(false), buildFont(true)];
mkdirSync('tools/preview', { recursive: true });
for (const H of [320, 420]) for (const lang of ['pl', 'en']) {
  const canvas = new Raster(180, H);
  const p = titleLayout(H);
  const image = (name, x, y, centered = true, tint) => {
    let source = sprites.get(name);
    if (tint) { source = source.crop(0, 0, source.w, source.h); source.map((r, g, b, a) => [r * rgb(tint)[0] / 255, g * rgb(tint)[1] / 255, b * rgb(tint)[2] / 255, a]); }
    canvas.blit(source, x - (centered ? Math.floor(source.w / 2) : 0), y - (centered ? Math.floor(source.h / 2) : 0));
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
    canvas.blit(line, x - Math.floor(line.w / 2), y - 6);
  };
  canvas.rect(0, 0, 180, H, 0x111b36);
  for (let y = p.artY + 174; y < H; y += 24) image('menu_waves', 0, y, false);
  image('menu_evening', 0, p.artY, false);
  image('menu_lantern', 15, p.artY + 46, false);
  image('menu_lantern', 147, p.artY + 54, false);
  image('logo', 90, p.logoY);
  text(lang === 'pl' ? 'LEĆ PRZEZ JAPONIĘ' : 'FLY ACROSS JAPAN', 90, p.taglineY, 0xffdba8);
  const labels = lang === 'pl' ? ['WYRUSZ W PODRÓŻ', 'PIECZĄTKI', 'ALBUM YOKAI', 'SMAKI JAPONII'] : ['BEGIN YOUR JOURNEY', 'STAMPS', 'YOKAI ALBUM', 'LOCAL FLAVOURS'];
  p.buttons.forEach((y, i) => {
    image(`menu_${i ? 'paper_off' : 'start_on'}`, 90, y + 1);
    text(labels[i], i ? 90 : 85, y, i ? 0x47372f : 0xfff1c9, !i);
    if (i) {
      image(['stamp_icon', 'popcorn_0', 'food_momiji'][i - 1], 29, y, true, i === 1 ? 0xb53936 : null);
      text(['0/7', '0/12', '0/14'][i - 1], 148, y, 0x76583d, false);
    } else { canvas.line(154, y - 3, 157, y, 0xffe4ad); canvas.line(157, y, 154, y + 3, 0xffe4ad); }
  });
  text(lang === 'pl' ? 'SIEDEM MIAST. JEDNA PODRÓŻ.' : 'SEVEN CITIES. ONE JOURNEY.', 90, p.captionY, 0xc8ac85);
  text(lang === 'pl' ? 'STRZAŁKI / ENTER' : 'ARROWS / ENTER', 90, p.hintY, 0x9aaec2);
  writeFileSync(`tools/preview/menu-${H}-${lang}.png`, canvas.scaled(3).toPNG());
}
