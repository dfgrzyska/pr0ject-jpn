// Tokyo's few shared sprites (the old atlas, sprites.png): the bits its enemies break into, tinted per set by the
// game (src/game/skins.js: bits) - a feather (crows black, gulls white) and a scrap of paper (lanterns, fans).
import { Raster } from '../../lib/raster.mjs';

const frame = (rows, colours) => {
  const r = new Raster(rows[0].length, rows.length);
  rows.forEach((row, y) => [...row].forEach((ch, x) => ch !== '.' && r.set(x, y, colours[ch])));
  return r;
};
const W = { a: 0xffffff, b: 0xc8ccd4, c: 0x8a8e98 };

export function tokyoSprites(add) {
  add('t_feather_0', frame(['..ab', 'abbc', 'bc..'], W));
  add('t_feather_1', frame(['a...', 'ab..', '.bb.', '..bc'], W));
  add('t_paper_0', frame(['aab', 'abb', 'bc.'], W));
  add('t_paper_1', frame(['ab', 'ab', 'bc'], W));
}
