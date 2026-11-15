// Stickers for the ship out of the gachapon (plan-gacha.md, 4.1): 13 x 13 each, in the gacha atlas as decal_<id>.
// The game lays them on the hull at four places, at half this size (src/game/shipSkin.js): on the ship only the
// plain ones read, the hangar and the machine show them whole.
import { Raster } from '../lib/raster.mjs';
import { INK, paint, poly, starPts } from './looks.mjs';

const N = 13;
const C = 6.5;
const TAU = Math.PI * 2;
const RED = 0xd02a26;
const WHITE = 0xffffff;
const NAVY = 0x1c2a5a;
const make = (fn) => {
  const r = new Raster(N, N);
  fn(r);
  return r;
};
/** Rows of '#' and '.', painted from (ox, oy). */
const bitmap = (r, rows, col, ox = 1, oy = 1) => rows.forEach((row, y) => [...row].forEach((ch, x) => ch === '#' && r.set(ox + x, oy + y, col)));
const ngon = (cx, cy, n, R, rot = 0) => Array.from({ length: n }, (_, i) => [cx + Math.cos(rot - Math.PI / 2 + (i * TAU) / n) * R, cy + Math.sin(rot - Math.PI / 2 + (i * TAU) / n) * R]);

// ---- signs: a red seal, the character in white
const KANJI = {
  yama: ['.....#.....', '.....#.....', '.....#.....', '#....#....#', '#....#....#', '#....#....#', '#....#....#', '#....#....#', '#....#....#', '###########', '...........'],
  kawa: ['.#...#...#.', '.#...#...#.', '.#...#...#.', '.#...#...#.', '.#...#...#.', '.#...#...#.', '.#...#...#.', '.#...#...#.', '#....#...#.', '#....#...#.', '...........'],
  hi: ['.....#.....', '.#...#...#.', '.#...#...#.', '#....#..#..', '.....#.....', '....#.#....', '....#.#....', '...#...#...', '..#.....#..', '.#.......#.', '#.........#'],
  mizu: ['.....#.....', '.....#.....', '.....#...#.', '####.#..#..', '...#.#.#...', '..#..##....', '..#..#.#...', '.#...#..#..', '#....#...#.', '....##....#', '...........'],
  ki: ['.....#.....', '.....#.....', '###########', '.....#.....', '....###....', '...#.#.#...', '..#..#..#..', '.#...#...#.', '#....#....#', '.....#.....', '.....#.....'],
  nichi: ['.#########.', '.#.......#.', '.#.......#.', '.#.......#.', '.#########.', '.#.......#.', '.#.......#.', '.#.......#.', '.#.......#.', '.#########.', '...........'],
  tsuki: ['..########.', '..#......#.', '..#......#.', '..########.', '..#......#.', '..#......#.', '..########.', '..#......#.', '.#.......#.', '#......###.', '...........'],
  dai: ['.....#.....', '.....#.....', '.....#.....', '###########', '.....#.....', '....#.#....', '....#.#....', '...#...#...', '..#.....#..', '.#.......#.', '#.........#'],
  chikara: ['....#......', '....#......', '##########.', '....#....#.', '....#....#.', '....#....#.', '...#.....#.', '...#.....#.', '..#......#.', '.#....#.#..', '#......#...'],
  ten: ['.#########.', '.....#.....', '.....#.....', '###########', '.....#.....', '....#.#....', '....#.#....', '...#...#...', '..#.....#..', '.#.......#.', '#.........#'],
  ou: ['###########', '.....#.....', '.....#.....', '.....#.....', '.#########.', '.....#.....', '.....#.....', '.....#.....', '.....#.....', '###########', '...........'],
  tsuchi: ['.....#.....', '.....#.....', '.....#.....', '.#########.', '.....#.....', '.....#.....', '.....#.....', '.....#.....', '.....#.....', '###########', '...........'],
};
const seal = (rows) => make((r) => {
  paint(r, (x, y) => ((x < 1 || x > 12) && (y < 1 || y > 12) ? null : RED));
  bitmap(r, rows, WHITE);
});

// ---- family crests: white on a navy disc
const kamon = (fn) => make((r) => {
  r.disc(C, C, 6.5, NAVY);
  fn(r);
});
const ring = (r, a = 5.6, b = 4.4) => {
  r.disc(C, C, a, WHITE);
  r.disc(C, C, b, NAVY);
};
const KAMON = {
  maru: () => kamon((r) => {
    ring(r, 5.2, 3.4);
  }),
  tomoe: () => kamon((r) => {
    for (let k = 0; k < 3; k++) {
      const a = (k * TAU) / 3;
      r.disc(C + Math.cos(a) * 2.9, C + Math.sin(a) * 2.9, 2.1, WHITE);
      r.disc(C + Math.cos(a + 0.9) * 4, C + Math.sin(a + 0.9) * 4, 1.2, WHITE);
    }
  }),
  cross: () => kamon((r) => {
    ring(r);
    r.rect(6, 1, 1, 11, WHITE);
    r.rect(1, 6, 11, 1, WHITE);
  }),
  takeda: () => kamon((r) => {
    for (const [x, y] of [[C, 3.4], [C, 9.6], [3.4, C], [9.6, C]]) poly(r, [[x, y - 2.4], [x + 2.4, y], [x, y + 2.4], [x - 2.4, y]], WHITE);
  }),
  kuyo: () => kamon((r) => {
    r.disc(C, C, 2, WHITE);
    for (let k = 0; k < 8; k++) r.disc(C + Math.cos((k * TAU) / 8) * 4.3, C + Math.sin((k * TAU) / 8) * 4.3, 1.15, WHITE);
  }),
  kikko: () => kamon((r) => {
    poly(r, ngon(C, C, 6, 5.8, Math.PI / 6), WHITE);
    poly(r, ngon(C, C, 6, 4.3, Math.PI / 6), NAVY);
    r.disc(C, C, 1.7, WHITE);
  }),
  hikiryo: () => kamon((r) => {
    ring(r);
    r.rect(3, 4, 7, 2, WHITE);
    r.rect(3, 7, 7, 2, WHITE);
  }),
  mori: () => kamon((r) => {
    r.rect(3, 2, 7, 2, WHITE);
    for (const [x, y] of [[C, 6.4], [4.1, 9.6], [8.9, 9.6]]) r.disc(x, y, 1.75, WHITE);
  }),
};

// ---- masks and faces
const FACES = {
  kitsune: () => make((r) => {
    poly(r, [[1, 0], [5.5, 4], [1, 6.5]], WHITE);
    poly(r, [[12, 0], [7.5, 4], [12, 6.5]], WHITE);
    r.ellipse(C, 7.6, 5.6, 5, WHITE);
    r.rect(2, 2, 1, 2, RED);
    r.rect(10, 2, 1, 2, RED);
    r.rect(3, 7, 2, 1, INK);
    r.rect(8, 7, 2, 1, INK);
    r.rect(6, 4, 1, 2, RED);
    r.rect(6, 10, 1, 1, INK);
    r.rect(2, 9, 2, 1, RED);
    r.rect(9, 9, 2, 1, RED);
  }),
  tengu: () => make((r) => {
    r.disc(C, C, 6.3, 0xd0283a);
    r.rect(2, 3, 3, 1, WHITE);
    r.rect(8, 3, 3, 1, WHITE);
    r.rect(3, 5, 2, 1, INK);
    r.rect(8, 5, 2, 1, INK);
    r.rect(6, 5, 1, 7, 0xff9aa0);
    r.rect(7, 6, 1, 6, 0x8a1420);
    r.rect(2, 9, 3, 1, WHITE);
    r.rect(9, 9, 3, 1, WHITE);
  }),
  oni: () => make((r) => {
    poly(r, [[2, 0], [4.5, 3.5], [1, 4]], 0xffd040);
    poly(r, [[11, 0], [8.5, 3.5], [12, 4]], 0xffd040);
    r.disc(C, 7.4, 5.6, 0xd0283a);
    r.rect(3, 5, 2, 2, WHITE);
    r.rect(8, 5, 2, 2, WHITE);
    r.rect(4, 6, 1, 1, INK);
    r.rect(8, 6, 1, 1, INK);
    r.rect(3, 9, 7, 2, INK);
    r.rect(4, 9, 1, 2, WHITE);
    r.rect(8, 9, 1, 2, WHITE);
  }),
  okame: () => make((r) => {
    r.ellipse(C, 6.8, 6, 6, 0xfff4ec);
    r.rect(2, 0, 9, 2, INK);
    r.rect(1, 2, 2, 2, INK);
    r.rect(10, 2, 2, 2, INK);
    r.rect(3, 5, 2, 1, INK);
    r.rect(8, 5, 2, 1, INK);
    r.disc(3, 8.5, 1.4, 0xff9ab0);
    r.disc(10, 8.5, 1.4, 0xff9ab0);
    r.rect(6, 9, 1, 1, RED);
  }),
  hyottoko: () => make((r) => {
    r.ellipse(C, 7, 6, 5.8, 0xfff0d8);
    r.rect(1, 2, 11, 2, 0x3a82f0);
    for (const x of [2, 5, 8, 11]) r.rect(x, 2, 1, 1, WHITE);
    r.disc(4, 6.5, 1.1, INK);
    r.disc(9, 6, 1.5, INK);
    r.disc(8.5, 10.2, 1.8, RED);
    r.rect(8, 10, 1, 1, INK);
  }),
  daruma: () => make((r) => {
    r.disc(C, C, 6.5, 0xd0283a);
    r.ellipse(C, 5.8, 5, 3.6, 0xfff0c8);
    r.disc(4.2, 5.8, 1.6, INK);
    r.disc(8.8, 5.8, 1.6, INK);
    r.rect(4, 10, 5, 1, 0xffd040);
  }),
  shark: () => make((r) => {
    r.ellipse(C, C, 6.5, 5.4, 0x8a1420);
    r.ellipse(C, C, 5.4, 3.6, INK);
    for (let x = 2; x < 11; x++) {
      r.rect(x, 3, 1, x % 2 ? 1 : 3, WHITE);
      r.rect(x, x % 2 ? 9 : 7, 1, x % 2 ? 1 : 3, WHITE);
    }
  }),
  skull: () => make((r) => {
    r.ellipse(C, 5.6, 5.6, 5.2, WHITE);
    r.rect(4, 10, 5, 2, WHITE);
    r.disc(4.2, 5.6, 1.7, INK);
    r.disc(8.8, 5.6, 1.7, INK);
    r.rect(6, 8, 1, 1, INK);
    r.rect(5, 11, 1, 1, INK);
    r.rect(7, 11, 1, 1, INK);
  }),
};

// ---- symbols
const EIGHT = ['.###.', '#...#', '#...#', '#...#', '.###.', '#...#', '#...#', '#...#', '.###.'];
const SYMBOLS = {
  hinomaru: () => make((r) => {
    r.rect(0, 1, 13, 11, WHITE);
    r.disc(C, C, 3.5, RED);
  }),
  fuji: () => make((r) => {
    r.disc(10.5, 3, 2.4, RED);
    poly(r, [[0, 12.5], [4.6, 3], [8.4, 3], [13, 12.5]], 0x3a5a9a);
    poly(r, [[4.6, 3], [8.4, 3], [9.8, 6], [8, 5], [6.5, 6.5], [5, 5], [3.2, 6]], WHITE);
  }),
  wave: () => make((r) => {
    paint(r, (x, y) => {
      const k = (((y + Math.sin(x * 0.95) * 1.6) % 4.3) + 4.3) % 4.3;
      return k < 1.3 ? WHITE : y < 6 ? 0x3a82f0 : 0x1c3f9a;
    });
  }),
  lightning: () => make((r) => {
    poly(r, [[8, 0], [2, 7.2], [5.8, 7.2], [4, 13], [11, 5], [7.2, 5], [9.5, 0]], 0xffe04f);
  }),
  flames: () => make((r) => {
    poly(r, [[0, 13], [1, 6], [3, 9], [4.2, 1.5], [6.5, 8], [8.2, 0.5], [10, 8], [12, 4.5], [13, 13]], 0xff7a1a);
    poly(r, [[2.5, 13], [4.3, 7.5], [6.5, 11], [8.2, 5.5], [10.2, 13]], 0xffe04f);
  }),
  checker: () => make((r) => {
    paint(r, (x, y) => (x < 0.5 || y < 0.5 || x > 12.5 || y > 12.5 ? null : (Math.floor((x - 0.5) / 3) + Math.floor((y - 0.5) / 3)) % 2 ? INK : WHITE));
  }),
  shuriken: () => make((r) => {
    poly(r, starPts(C, C, 4, 6.6, 3.2), 0x8a96b4);
    poly(r, starPts(C, C, 4, 5, 2.3), 0xe8ecf6);
    r.disc(C, C, 1.3, INK);
  }),
  torii: () => make((r) => {
    r.rect(0, 0, 13, 1, INK);
    r.rect(0, 1, 13, 2, RED);
    r.rect(1, 5, 11, 1, RED);
    r.rect(2, 3, 2, 10, RED);
    r.rect(9, 3, 2, 10, RED);
  }),
  fan: () => make((r) => {
    paint(r, (x, y) => {
      const d = Math.hypot(x - C, y - 12);
      const a = Math.atan2(x - C, 12 - y);
      if (d > 11.5 || Math.abs(a) > 0.95) return null;
      return d < 3.5 ? 0x8a6030 : Math.abs((a * 4.2) % 1) < 0.12 ? 0xd8c890 : WHITE;
    });
    r.disc(C, 4.6, 2.1, RED);
    r.disc(C, 12, 1, INK);
  }),
  umbrella: () => make((r) => {
    r.disc(C, C, 6.5, RED);
    for (let k = 0; k < 8; k++) r.line(C, C, C + Math.cos((k * TAU) / 8) * 6, C + Math.sin((k * TAU) / 8) * 6, 0x8a1420);
    r.disc(C, C, 4.2, 0xfff0d8, 0.0);
    paint(r, (x, y) => (Math.abs(Math.hypot(x - C, y - C) - 4.2) < 0.55 ? 0xfff0d8 : null));
    r.disc(C, C, 1.3, INK);
  }),
  lantern: () => make((r) => {
    r.ellipse(C, C, 5, 5.6, 0xd0283a);
    paint(r, (x, y) => (Math.hypot((x - C) / 5, (y - C) / 5.6) <= 1 && Math.floor(y) % 3 === 1 ? 0x8a1420 : null));
    r.rect(3, 0, 7, 1, INK);
    r.rect(3, 12, 7, 1, INK);
    r.disc(C, C, 2, 0xffe080);
  }),
  koinobori: () => make((r) => {
    poly(r, [[9.5, C], [13, 2.5], [13, 10.5]], 0x3a82f0);
    r.ellipse(5.8, C, 5.8, 3.5, 0x3a82f0);
    paint(r, (x, y) => (Math.hypot((x - 5.8) / 5.8, (y - C) / 3.5) <= 1 && x > 4 && (Math.floor(x) + Math.floor(y)) % 2 === 0 ? 0x7ac0ff : null));
    r.ellipse(2.4, C, 2.4, 3, WHITE);
    r.disc(2.4, 6, 1, INK);
  }),
  n88: () => make((r) => {
    paint(r, (x, y) => (y < 1 || y > 12 || ((x < 1 || x > 12) && (y < 2 || y > 11)) ? null : INK));
    bitmap(r, EIGHT, 0xffe04f, 1, 2);
    bitmap(r, EIGHT, 0xffe04f, 7, 2);
  }),
  star: () => make((r) => {
    poly(r, starPts(C, 7, 5, 6.8, 2.9), 0xf0b432);
    poly(r, starPts(C, 7, 5, 5, 2.1), 0xffe04f);
  }),
};

// ---- food
const FOOD = {
  onigiri: () => make((r) => {
    paint(r, (x, y) => (y < 0.5 || y > 12 || Math.abs(x - C) > 1.4 + (y / 12) * 5 ? null : x < 5 ? WHITE : 0xe0e0ee));
    r.rect(4, 7, 5, 6, 0x1c2a24);
  }),
  sushi: () => make((r) => {
    r.ellipse(C, 8.6, 6.2, 3.6, WHITE);
    r.rect(1, 9, 11, 2, 0xd8d8e8);
    r.ellipse(C, 5.4, 6.2, 3.2, 0xff7a50);
    for (const x of [2, 5, 8]) r.line(x, 7, x + 3, 3, 0xffc8b0);
  }),
  ramen: () => make((r) => {
    paint(r, (x, y) => (y >= 5.5 && Math.hypot(x - C, y - 5.5) <= 6.4 ? (y > 9 ? 0x8a1420 : RED) : null));
    r.ellipse(C, 5.5, 6.4, 2.6, 0xffe8b0);
    for (const x of [3, 5, 7]) r.rect(x, 5, 1, 2, 0xf0c060);
    r.disc(4.2, 5.2, 1.4, WHITE);
    r.rect(4, 5, 1, 1, 0xff7ab8);
    r.disc(9.2, 5.6, 1.4, 0xffd040);
    r.rect(1, 12, 11, 1, 0x8a1420);
  }),
  dango: () => make((r) => {
    r.rect(0, 6, 13, 1, 0x8a6030);
    r.disc(2.5, C, 2.4, 0xffb8d0);
    r.disc(C, C, 2.4, WHITE);
    r.disc(10.5, C, 2.4, 0xb8e088);
  }),
  taiyaki: () => make((r) => {
    poly(r, [[9.5, C], [13, 2.5], [13, 10.5]], 0xc8843a);
    r.ellipse(5.6, C, 5.6, 3.8, 0xd8964a);
    paint(r, (x, y) => (Math.hypot((x - 5.6) / 5.6, (y - C) / 3.8) <= 0.9 && x > 4.5 && (Math.floor(x) * 2 + Math.floor(y)) % 3 === 0 ? 0xa8642a : null));
    r.disc(2.8, 5.6, 1, INK);
    r.rect(1, 8, 2, 1, 0xa8642a);
  }),
  takoyaki: () => make((r) => {
    r.disc(C, C, 6.3, 0xc8843a);
    r.disc(C, 5.2, 4.6, 0x6a3414);
    for (const [x, y] of [[3, 4], [5, 6], [7, 4], [9, 6]]) r.line(x, y, x + 1, y + (x % 4 === 3 ? 1 : -1), 0xfff0c8);
    for (const [x, y] of [[4, 3], [8, 3], [6, 7], [10, 5]]) r.rect(x, y, 1, 1, 0x5cc05a);
  }),
  mochi: () => make((r) => {
    r.ellipse(C, 9.8, 6.3, 3.1, WHITE);
    r.rect(1, 11, 11, 1, 0xd0d0e0);
    r.ellipse(C, 6, 4.6, 2.7, WHITE);
    r.rect(3, 7, 7, 1, 0xd8d8e8);
    r.disc(C, 2.6, 2.2, 0xff8a1e);
    r.rect(7, 0, 2, 1, 0x37903f);
  }),
  watermelon: () => make((r) => {
    paint(r, (x, y) => {
      const d = Math.hypot(x - C, y - 3.5);
      return y < 3.5 || d > 6.4 ? null : d > 5.5 ? 0x37903f : d > 4.8 ? 0xe8f8d0 : 0xf0485a;
    });
    for (const [x, y] of [[4, 5], [6, 7], [9, 5], [7, 4]]) r.rect(x, y, 1, 1, INK);
  }),
};

// ---- animals
const ANIMALS = {
  paw: () => make((r) => {
    r.disc(C, C, 6.5, WHITE);
    r.ellipse(C, 8.6, 3.5, 2.8, 0xff9ab0);
    for (const [x, y] of [[2.6, 5.6], [5, 3.2], [8, 3.2], [10.4, 5.6]]) r.disc(x, y, 1.4, 0xff9ab0);
  }),
  crane: () => make((r) => {
    poly(r, [[C, 5.8], [0.2, 2.4], [3.2, 8.2]], WHITE);
    poly(r, [[C, 5.8], [12.8, 2.4], [9.8, 8.2]], 0xc8d0e4);
    poly(r, [[C, 4.4], [9.8, 8.8], [C, 11.6], [3.2, 8.8]], 0xe8ecf6);
    poly(r, [[C, 5.4], [5, 0.6], [7.2, 3]], WHITE);
    r.rect(4, 0, 2, 1, RED);
  }),
  koi: () => make((r) => {
    poly(r, [[C, 9], [10, 13], [C, 11.4], [3, 13]], 0xf8a04a);
    r.ellipse(C, 5.6, 3.1, 5.4, WHITE);
    r.disc(5.6, 3.4, 1.7, 0xf0682a);
    r.disc(7.6, 6.8, 1.6, 0xf0682a);
    r.rect(4, 2, 1, 1, INK);
    r.rect(8, 2, 1, 1, INK);
  }),
  fox: () => make((r) => {
    poly(r, [[1, 0.5], [5.4, 4], [1.6, 6.4]], 0xe0782a);
    poly(r, [[12, 0.5], [7.6, 4], [11.4, 6.4]], 0xe0782a);
    r.ellipse(C, 7.4, 5.4, 4.8, 0xf8a04a);
    r.ellipse(3.6, 9.6, 2.4, 2, WHITE);
    r.ellipse(9.4, 9.6, 2.4, 2, WHITE);
    r.rect(3, 6, 2, 1, INK);
    r.rect(8, 6, 2, 1, INK);
    r.rect(6, 9, 1, 1, INK);
  }),
  frog: () => make((r) => {
    r.ellipse(C, 8.4, 6.2, 4.4, 0x5cc05a);
    r.disc(3, 3.8, 2.4, 0x5cc05a);
    r.disc(10, 3.8, 2.4, 0x5cc05a);
    r.disc(3, 3.8, 1.3, WHITE);
    r.disc(10, 3.8, 1.3, WHITE);
    r.rect(3, 4, 1, 1, INK);
    r.rect(9, 4, 1, 1, INK);
    r.rect(3, 9, 7, 1, 0x1f5a2a);
  }),
};

export const DECALS = {
  ...Object.fromEntries(Object.entries(KANJI).map(([id, rows]) => [`kanji_${id}`, () => seal(rows)])),
  ...Object.fromEntries(Object.entries(KAMON).map(([id, fn]) => [`kamon_${id}`, fn])),
  ...Object.fromEntries(Object.entries(FACES).map(([id, fn]) => [`face_${id}`, fn])),
  ...Object.fromEntries(Object.entries(SYMBOLS).map(([id, fn]) => [`sym_${id}`, fn])),
  ...Object.fromEntries(Object.entries(FOOD).map(([id, fn]) => [`food_${id}`, fn])),
  ...Object.fromEntries(Object.entries(ANIMALS).map(([id, fn]) => [`pet_${id}`, fn])),
};

/** Every frame for the gacha atlas. */
export function decalArt() {
  return Object.entries(DECALS).map(([id, fn]) => ({ name: `decal_${id}`, raster: fn() }));
}
