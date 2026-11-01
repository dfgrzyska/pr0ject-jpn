// The game's logo for the title screen, and each city's seal for the card at the start of its stage: the
// kanji of its name knocked out of a hanko block, inked unevenly. Seals are drawn white (ink = alpha) and
// tinted by the game in the city's ink, like the stamps; the game shows them at twice the size.
import { Raster, fbm } from '../lib/raster.mjs';
import { KANJI } from './kanji.mjs';

const SEALS = { stage1: '京都', stage2: '沖縄', stage3: '札幌', stage4: '鹿児島', stage5: '大阪', stage6: '別府' };

/** A seal: a block with a rim, the kanji cut out of it; the ink catches the paper unevenly. */
function seal(text, seed) {
  const n = [...text].length;
  const w = n * 16 + 6;
  const h = 22;
  const r = new Raster(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      // the block, its corners worn round
      const cx = Math.min(x, w - 1 - x);
      const cy = Math.min(y, h - 1 - y);
      if (cx + cy < 1) continue;
      // a cut line inside the rim
      if ((cx === 2 || cy === 2) && cx >= 2 && cy >= 2) continue;
      const ink = fbm(x, y, { seed, scale: 3, octaves: 2 });
      if (ink < 0.2) continue; // speckles where the ink missed
      r.set(x, y, 0xffffff, ink < 0.3 ? 0.7 : 1);
    }
  [...text].forEach((ch, i) => {
    KANJI[ch].forEach((row, y) =>
      [...row].forEach((c, x) => {
        if (c === '#') r.clear(4 + i * 16 + x, 4 + y);
      }),
    );
  });
  return r;
}

// The logo's letters, 2 px strokes on an 11 px x-height (t and the zero rise 3 above it, j and p drop 4
// below; the zero, a digit's height so it reads as one, holds the rising sun).
const L = {
  p: ['######..', '#######.', '##...###', '##....##', '##....##', '##....##', '##....##', '##....##', '##...###', '#######.', '######..', '##......', '##......', '##......', '##......'],
  r: ['##.####', '#######', '###....', '##.....', '##.....', '##.....', '##.....', '##.....', '##.....', '##.....', '##.....'],
  0: ['..#####..', '.#######.', '###...###', '##.....##', '##.sss.##', '##sssss##', '##sssss##', '##sssss##', '##sssss##', '##.sss.##', '##.....##', '###...###', '.#######.', '..#####..'],
  j: ['...##', '...##', '...##', '...##', '...##', '...##', '...##', '...##', '...##', '...##', '...##', '...##', '##.##', '#####', '.###.'],
  e: ['..####..', '.######.', '###..###', '##....##', '########', '########', '##......', '##......', '###...##', '.#######', '..#####.'],
  c: ['..#####.', '.#######', '###...##', '##......', '##......', '##......', '##......', '##......', '###...##', '.#######', '..#####.'],
  t: ['.##...', '.##...', '.##...', '######', '######', '.##...', '.##...', '.##...', '.##...', '.##...', '.##...', '.##...', '.#####', '..####'],
  '-': ['......', '......', '......', '......', '......', '######', '######', '......', '......', '......', '......'],
  n: ['##.####.', '########', '###...##', '##....##', '##....##', '##....##', '##....##', '##....##', '##....##', '##....##', '##....##'],
};
const DOTS = { j: [[3, -3], [4, -3], [3, -2], [4, -2]] }; // the j's dot
const RISE = { t: 3, 0: 3 }; // rows a letter rises above the x-height

/** pr0ject-jpn: white letters shaded at the foot, a dark outline, a vermilion shadow; the zero a red sun. */
function logo(word) {
  const top = 4; // room for the t and the j's dot
  const gap = 2;
  const glyphs = [...word].map((ch) => ({ ch, rows: L[ch] }));
  const w = glyphs.reduce((s, g) => s + g.rows[0].length + gap, -gap) + 4;
  const h = top + 15 + 4;
  const ink = new Map(); // "x,y" -> 'w' letter | 's' sun
  let x0 = 1;
  for (const { ch, rows } of glyphs) {
    const y0 = top - (RISE[ch] ?? 0);
    rows.forEach((row, y) => [...row].forEach((c, x) => c !== '.' && ink.set(`${x0 + x},${y0 + y}`, c === 's' ? 's' : 'w')));
    for (const [x, y] of DOTS[ch] ?? []) ink.set(`${x0 + x},${top + y}`, 'w');
    x0 += rows[0].length + gap;
  }
  const r = new Raster(w, h);
  const at = (x, y) => ink.get(`${x},${y}`);
  // the vermilion shadow, then the outline, then the letters
  for (const key of ink.keys()) {
    const [x, y] = key.split(',').map(Number);
    if (!at(x + 2, y + 2)) r.set(x + 2, y + 2, 0xb8301a);
  }
  for (const key of ink.keys()) {
    const [x, y] = key.split(',').map(Number);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!at(x + dx, y + dy)) r.set(x + dx, y + dy, 0x120e1a);
  }
  for (const [key, c] of ink) {
    const [x, y] = key.split(',').map(Number);
    if (c === 's') r.set(x, y, (x + y) % 5 === 0 ? 0xff6a4a : 0xe2421f);
    else r.set(x, y, y >= top + 8 && y < top + 11 ? 0xd8d0e4 : y >= top + 11 ? 0xc0b8d0 : 0xffffff);
  }
  return r;
}

export function logoSprites() {
  const out = [{ name: 'logo', raster: logo('pr0ject-jpn') }];
  Object.entries(SEALS).forEach(([id, text], i) => out.push({ name: `seal_${id}`, raster: seal(text, 70 + i) }));
  return out;
}
