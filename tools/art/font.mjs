// 5x7 pixel font with Polish diacritics, rendered white with a dark outline (and once more without it: the ink
// font, for print on light paper — the stamp book).
// Cell: 7x13 (1px outline, accent rows above with a 1px gap, 1 ogonek row below),
// cells separated by a 1px transparent gutter so GPUs that sample at texel edges never bleed in a neighbour.
import { Raster } from '../lib/raster.mjs';

const G = {
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
  '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
  '"': ['.#.#.', '.#.#.', '.....', '.....', '.....', '.....', '.....'],
  '#': ['.#.#.', '.#.#.', '#####', '.#.#.', '#####', '.#.#.', '.#.#.'],
  '%': ['##..#', '##..#', '...#.', '..#..', '.#...', '#..##', '#..##'],
  "'": ['..#..', '..#..', '.....', '.....', '.....', '.....', '.....'],
  '(': ['...#.', '..#..', '.#...', '.#...', '.#...', '..#..', '...#.'],
  ')': ['.#...', '..#..', '...#.', '...#.', '...#.', '..#..', '.#...'],
  '*': ['.....', '..#..', '#.#.#', '.###.', '#.#.#', '..#..', '.....'],
  '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
  ',': ['.....', '.....', '.....', '.....', '.##..', '..#..', '.#...'],
  '-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
  '.': ['.....', '.....', '.....', '.....', '.....', '.##..', '.##..'],
  '/': ['....#', '....#', '...#.', '..#..', '.#...', '#....', '#....'],
  0: ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  1: ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  3: ['#####', '...#.', '..#..', '...#.', '....#', '#...#', '.###.'],
  4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  6: ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'],
  7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  9: ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
  ':': ['.....', '.##..', '.##..', '.....', '.##..', '.##..', '.....'],
  ';': ['.....', '.##..', '.##..', '.....', '.##..', '..#..', '.#...'],
  '<': ['...#.', '..#..', '.#...', '#....', '.#...', '..#..', '...#.'],
  '=': ['.....', '.....', '#####', '.....', '#####', '.....', '.....'],
  '>': ['.#...', '..#..', '...#.', '....#', '...#.', '..#..', '.#...'],
  '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.###.'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  J: ['..###', '...#.', '...#.', '...#.', '#..#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '#.#.#', '.#.#.'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  '×': ['.....', '.....', '#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
  Ł: ['.#...', '.#...', '.#.#.', '.##..', '##...', '.#...', '.####'],
};

// Diacritics: base glyph + marks in the accent rows (-3,-2; row -1 stays empty) or the ogonek row (7).
const ACUTE = [[3, -3], [2, -2]];
const DIACRITICS = {
  Ą: ['A', [[4, 7], [3, 7]]],
  Ć: ['C', ACUTE],
  Ę: ['E', [[3, 7], [4, 7]]],
  Ń: ['N', ACUTE],
  Ó: ['O', ACUTE],
  Ś: ['S', ACUTE],
  Ź: ['Z', ACUTE],
  Ż: ['Z', [[2, -3], [2, -2]]],
  // long vowels in Japanese words (OMEDETŌ, KYŪSHŪ)
  Ō: ['O', [[1, -2], [2, -2], [3, -2]]],
  Ū: ['U', [[1, -2], [2, -2], [3, -2]]],
};

export const FONT = { cellW: 7, cellH: 13, gap: 1, perRow: 16 };

export function buildFont(outline = true) {
  const glyphs = [];
  for (const [ch, rows] of Object.entries(G)) glyphs.push([ch, rows, []]);
  for (const [ch, [base, marks]] of Object.entries(DIACRITICS)) glyphs.push([ch, G[base], marks]);
  const chars = glyphs.map((g) => g[0]).join('');
  const rowsCount = Math.ceil(glyphs.length / FONT.perRow);
  const pitchX = FONT.cellW + FONT.gap;
  const pitchY = FONT.cellH + FONT.gap;
  const img = new Raster(pitchX * FONT.perRow - FONT.gap, pitchY * rowsCount - FONT.gap);
  glyphs.forEach(([, rows, marks], i) => {
    const ox = (i % FONT.perRow) * pitchX + 1;
    const oy = Math.floor(i / FONT.perRow) * pitchY + 4;
    const on = new Set();
    rows.forEach((r, y) => [...r].forEach((c, x) => c === '#' && on.add(`${x},${y}`)));
    for (const [x, y] of marks) on.add(`${x},${y}`);
    // outline first (8-neighbourhood), then glyph on top
    if (outline)
      for (const key of on) {
        const [x, y] = key.split(',').map(Number);
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) if (!on.has(`${x + dx},${y + dy}`)) img.set(ox + x + dx, oy + y + dy, 0x120e1a);
      }
    for (const key of on) {
      const [x, y] = key.split(',').map(Number);
      img.set(ox + x, oy + y, 0xffffff);
    }
  });
  return { raster: img, chars };
}

/**
 * The same font three times as fine (font540.png): every glyph from the same masks, each pixel 3 x 3, the
 * stair-steps of its diagonals smoothed (convex corners cut, concave ones filled) and the outline a round 3 px
 * all the way round. The layout is the 1x one times three (cells 21 x 39, gap 3), so it parses the same way and
 * the game shows it at a third of its size (pixelText).
 */
export function buildFont540(outline = true) {
  const glyphs = [];
  for (const [ch, rows] of Object.entries(G)) glyphs.push([ch, rows, []]);
  for (const [ch, [base, marks]] of Object.entries(DIACRITICS)) glyphs.push([ch, G[base], marks]);
  const chars = glyphs.map((g) => g[0]).join('');
  const rowsCount = Math.ceil(glyphs.length / FONT.perRow);
  const pitchX = (FONT.cellW + FONT.gap) * 3;
  const pitchY = (FONT.cellH + FONT.gap) * 3;
  const img = new Raster(pitchX * FONT.perRow - FONT.gap * 3, pitchY * rowsCount - FONT.gap * 3);
  glyphs.forEach(([, rows, marks], i) => {
    const ox = (i % FONT.perRow) * pitchX + 3;
    const oy = Math.floor(i / FONT.perRow) * pitchY + 12;
    const on = new Set();
    rows.forEach((r, y) => [...r].forEach((c, x) => c === '#' && on.add(`${x},${y}`)));
    for (const [x, y] of marks) on.add(`${x},${y}`);
    const has = (x, y) => on.has(`${x},${y}`);
    // the fine glyph: cells blown up, corners rounded and diagonals joined
    const fine = new Set();
    for (let Y = -9; Y < 13 * 3; Y++)
      for (let X = -3; X < 7 * 3; X++) {
        const cx = Math.floor(X / 3);
        const cy = Math.floor(Y / 3);
        const sx = ((X % 3) + 3) % 3;
        const sy = ((Y % 3) + 3) % 3;
        let v = has(cx, cy);
        if (sx !== 1 && sy !== 1) {
          const dx = sx === 0 ? -1 : 1;
          const dy = sy === 0 ? -1 : 1;
          const a = has(cx + dx, cy);
          const b = has(cx, cy + dy);
          if (v && !a && !b && !has(cx + dx, cy + dy)) v = false;
          else if (!v && a && b) v = true;
        }
        if (v) fine.add(`${X},${Y}`);
      }
    if (outline)
      for (const key of fine) {
        const [x, y] = key.split(',').map(Number);
        for (let dy = -3; dy <= 3; dy++)
          for (let dx = -3; dx <= 3; dx++) if (dx * dx + dy * dy <= 10 && !fine.has(`${x + dx},${y + dy}`)) img.set(ox + x + dx, oy + y + dy, 0x120e1a);
      }
    for (const key of fine) {
      const [x, y] = key.split(',').map(Number);
      img.set(ox + x, oy + y, 0xffffff);
    }
  });
  return { raster: img, chars };
}
