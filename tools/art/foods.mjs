import { Raster } from '../lib/raster.mjs';
import { FOODS } from '../../src/data/discoveries.js';

/** Small, deliberately warm food illustrations; the in-flight gold halo marks them as pickups. */
export function foodSprites() {
  return FOODS.map(({ id, frame }) => {
    const r = new Raster(20, 20);
    const cream = 0xffe3a0, brown = 0x995022, gold = 0xe8a644, white = 0xfff6db, green = 0x58a84a;
    r.ellipse(10, 15, 9, 3, 0x24324a);
    r.ellipse(10, 14, 8, 3, white);
    if (id === 'castella') {
      r.rect(3, 6, 14, 9, cream); r.rect(3, 5, 14, 3, brown); r.line(9, 8, 9, 14, gold);
    } else if (id === 'champon') {
      r.ellipse(10, 12, 8, 5, 0x4b879d); r.ellipse(10, 9, 8, 4, cream);
      for (const x of [5, 8, 11, 14]) { r.line(x, 7, x + 2, 11, gold); r.set(x, 8, green); }
      r.disc(13, 8, 2, 0xee9e8e);
    } else if (id === 'yatsuhashi') {
      for (let y = 3; y <= 14; y++) r.rect(10 - Math.floor((y - 3) * 0.7), y, 1 + Math.floor((y - 3) * 0.7) * 2, 1, y === 14 ? brown : cream);
      r.line(10, 5, 15, 13, gold);
    } else if (id === 'inari' || id === 'karukan') {
      for (const x of [6, 13]) {
        r.ellipse(x, 10, 4, 5, id === 'inari' ? brown : 0xd1bfaa);
        r.ellipse(x, 9, 3, 4, id === 'inari' ? gold : white);
        r.line(x - 1, 7, x + 1, 7, cream);
      }
    } else if (['andagi', 'takoyaki', 'toriten'].includes(id)) {
      for (const [x, y] of [[5, 11], [10, 7], [15, 11]]) {
        r.disc(x, y, 4, brown);
        r.disc(x, y - 1, 3, gold);
        r.set(x - 1, y - 2, cream);
        if (id === 'takoyaki') { r.line(x - 2, y, x + 2, y + 1, white); r.set(x, y - 1, green); }
        if (id === 'toriten') r.rect(x - 2, y - 3, 3, 2, cream);
      }
    } else if (id === 'goya') {
      r.ellipse(10, 10, 7, 4, gold);
      for (const [x, y] of [[5, 9], [10, 7], [14, 11], [7, 12]]) {
        r.disc(x, y, 2.5, green); r.disc(x, y, 1, cream);
      }
      r.rect(11, 10, 3, 3, white); r.rect(6, 6, 3, 3, white);
    } else if (id === 'ramen') {
      r.ellipse(10, 12, 8, 5, 0xc53e32);
      r.ellipse(10, 9, 9, 4, white); r.ellipse(10, 9, 7, 3, brown);
      for (let y = 7; y < 12; y += 2) r.line(5, y, 13, y, gold);
      r.disc(13, 8, 2.5, white); r.disc(13, 8, 1, 0xf9bd3f); r.rect(5, 8, 2, 3, green);
      r.line(12, 4, 18, 1, cream);
    } else if (id === 'corn') {
      r.ellipse(10, 9, 5, 7, brown); r.ellipse(10, 8, 4, 6, 0xffce46);
      for (let y = 3; y < 14; y += 3) for (let x = 7; x < 14; x += 3) r.set(x, y, cream);
      r.line(7, 15, 3, 9, green); r.line(12, 15, 16, 9, green);
    } else if (id === 'shirokuma') {
      r.ellipse(10, 9, 7, 7, white);
      for (const [x, y, c] of [[6, 8, 0xe94d47], [12, 5, 0xf5cb37], [14, 11, green], [8, 13, brown]]) r.disc(x, y, 1.5, c);
      r.rect(5, 15, 10, 2, 0x65bdd2);
    } else if (id === 'kushi') {
      for (const x of [6, 13]) {
        r.line(x, 3, x, 18, cream);
        for (const y of [5, 10]) { r.disc(x, y, 3, brown); r.disc(x, y - 1, 2, gold); }
      }
    } else if (id === 'pudding') {
      r.rect(5, 7, 10, 8, cream); r.rect(6, 4, 8, 10, cream);
      r.ellipse(10, 5, 5, 2, brown); r.line(6, 8, 6, 12, white);
    } else if (id === 'okonomiyaki') {
      r.ellipse(10, 10, 8, 5, gold); r.ellipse(10, 9, 7, 4, brown);
      for (let x = 5; x < 16; x += 3) r.line(x, 7, x - 2, 12, white);
      for (const x of [6, 10, 14]) r.set(x, 8, green);
    } else if (id === 'momiji') {
      for (const [x, y] of [[5, 6], [10, 3], [15, 6], [3, 10], [17, 10], [10, 11]]) {
        r.disc(x, y, 3, brown); r.disc(x, y - 1, 2, gold);
      }
      r.disc(10, 9, 5, gold); r.line(10, 6, 10, 16, brown);
      r.line(5, 8, 10, 12, brown); r.line(15, 8, 10, 12, brown);
    }
    return { name: frame, raster: r };
  });
}
