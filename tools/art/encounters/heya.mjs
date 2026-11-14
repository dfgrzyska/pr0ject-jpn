// Random encounter 5 (ex5): the hikikomori's room, which is the boss. A fortress built of what piles up when no one
// goes out: towers of manga volumes on one side, a pyramid of empty instant-noodle cups and delivery boxes on the
// other, a low desk in the middle with a big old CRT monitor glowing on it; behind the monitor a blanket-wrapped
// shape, only two eyes showing. Lights on; lights off (only the screen and the eyes); fallen in (phase 3). Its
// manga volumes (spinning), noodle cups (tumbling), a toppling stack, gacha capsules. No brands anywhere: the cups
// have plain bands, the spines plain colours, the boxes plain tape.
import { HiSprite, tones, speckle } from '../../lib/hisprite.mjs';
import { rng, mix as mixc } from '../../lib/raster.mjs';

const BASE = {
  k: tones([0x14121a, 0x26242e, 0x44424e]), // dark: the eye hole, the screen's frame
  q: tones([0x3a2a5a, 0x5a4a8a, 0x8a7ab8]), // the blanket, lilac
  o: tones([0x6a4a2a, 0x9a7044, 0xc89a64]), // the desk, wood
  m: tones([0x8a8470, 0xc8c2a8, 0xf0ead0]), // the monitor's plastic, old beige
  w: tones([0x9a948a, 0xe8e4dc, 0xffffff]), // the cups, paper white
  b: tones([0x6a4a24, 0xa87a44, 0xd8aa70]), // cardboard
  s: tones([0x5a5a64, 0xa8aab4, 0xe0e2ea]), // the keyboard
  r: tones([0x7a1a1a, 0xd03a2a, 0xff8a6a]), // book colours
  g: tones([0x1a5a2a, 0x3a9a4a, 0x8ad88a]),
  u: tones([0x1a2a6a, 0x3a5ac0, 0x8aa8f0]),
  y: tones([0x8a6a10, 0xe0b830, 0xfff0a0]),
  p: tones([0x7a2a5a, 0xd05a9a, 0xffa8d0]),
};
const BOOKS = ['r', 'g', 'u', 'y', 'p', 'w'];
// lights off: everything sinks into the dark blue of a room lit only by a screen
const NIGHT = Object.fromEntries(Object.entries(BASE).map(([k, v]) => [k, v.map((c) => mixc(c, 0x0a0c1e, 0.62))]));

/** A manga volume lying flat in a stack, its spine to us: w x h at (x, y), a band of a lighter tone. */
function book(s, x, y, w, h, mat, lean = 0) {
  s.poly([[x, y], [x + w, y + lean], [x + w, y + h + lean], [x, y + h]], mat, { flat: 0.55 });
  s.line(x + 1, y + h * 0.35, x + w - 1, y + h * 0.35 + lean, 0xf4eee0, 1, 0.6);
}

/** A noodle cup: a short tapered tub, a coloured band, a peeled-back lid. */
function cup(s, cx, by, h = 20, lid = 0) {
  const top = 9;
  const bot = 6.5;
  s.poly([[cx - top, by - h], [cx + top, by - h], [cx + bot, by], [cx - bot, by]], 'w', { flat: 0.6 });
  s.shade([cx - top, by - h, cx + top, by], (x) => x > cx + 2, -0.15);
  s.paint([cx - top, by - h * 0.62, cx + top, by - h * 0.42], (x, y) => Math.abs(x - cx) < top - ((y - (by - h)) / h) * (top - bot), 'r', () => 0.55);
  if (lid) s.poly([[cx - top, by - h], [cx + top - 4, by - h - 6], [cx + top, by - h - 3], [cx - top + 2, by - h + 1]], 'm', { flat: 0.7 });
}

/** A delivery box, its tape. */
function box(s, x, y, w, h) {
  s.paint([x, y, x + w, y + h], () => true, 'b', (px) => 0.6 - (px - x) / (w * 3), { pat: speckle({ amt: 0.05 }) });
  s.paint([x + w / 2 - 2, y, x + w / 2 + 2, y + h], () => true, 'm', () => 0.75);
}

// ---------------------------------------------------------------- the room (100 x 60 -> 300 x 180)
// state: 0 lights on, 1 the screen scrolling, 'angry' the screen red, 'night' lights off, 'ruin' fallen in
export function room(state) {
  const night = state === 'night';
  const ruin = state === 'ruin';
  const s = new HiSprite(300, 180, night ? NIGHT : BASE);
  const rand = rng(7);
  const cx = 150;
  // behind the desk: the blanket-wrapped shape, a hood with a dark hole and two eyes in it
  s.ellipse(cx, 60, 52, 44, 'q', { bias: 0.05, pat: speckle({ amt: 0.05 }) });
  s.shade([cx - 52, 16, cx + 52, 104], (x, y) => (Math.floor(x / 12) + Math.floor(y / 12)) % 2 === 0, -0.08); // checks
  s.ellipse(cx, 38, 18, 12, 'k', { flat: 0.15 });
  const eye = ruin || state === 'angry' ? 0xff4a3a : night ? 0xe8f4ff : 0xd8e8f0;
  for (const sx of [-1, 1]) {
    s.dot(cx + sx * 7, 38, 2.6, eye);
    if (!ruin && state !== 'angry') s.dot(cx + sx * 7 - 0.6, 37.4, 0.9, 0xffffff);
  }
  // the manga towers, left: columns of volumes, each a little askew
  if (!ruin) {
    for (const [x0, top] of [[6, 40], [40, 22], [74, 58]]) {
      let y = 150;
      while (y > top) {
        const h = 5 + Math.floor(rand() * 4);
        const w = 30 + Math.floor(rand() * 6);
        book(s, x0 + Math.floor(rand() * 5) - 2, y - h, w, h, BOOKS[Math.floor(rand() * BOOKS.length)], Math.floor(rand() * 3) - 1);
        y -= h + 1;
      }
    }
    // the cups, right: a pyramid, boxes behind
    box(s, 228, 60, 46, 36);
    box(s, 254, 40, 40, 30);
    for (let row = 0; row < 4; row++) for (let i = 0; i < 4 - row; i++) cup(s, 226 + row * 10 + i * 20, 152 - row * 22, 20, (row + i) % 3 === 0);
  } else {
    // fallen in: books slid into heaps on the floor, cups rolled over, a box split
    for (let i = 0; i < 26; i++) {
      const x = 4 + rand() * 96;
      const y = 120 + rand() * 40;
      book(s, x, y, 26 + rand() * 8, 6, BOOKS[Math.floor(rand() * BOOKS.length)], Math.floor(rand() * 13) - 6);
    }
    box(s, 236, 110, 44, 30);
    for (let i = 0; i < 6; i++) cup(s, 214 + i * 13 + rand() * 4, 168 - (i % 2) * 12, 18, i % 2);
  }
  // the desk, the monitor on it, the keyboard
  s.paint([70, 112, 230, 168], (x, y) => y < 122 || (y > 122 && (x < 80 || x > 220)), 'o', (x, y) => (y < 122 ? 0.7 : 0.4), { pat: speckle({ amt: 0.06 }) });
  s.paint([106, 50, 194, 120], (x, y) => x > 106 && x < 194 && y > 50 && y < 120, 'm', (x, y) => 0.68 - (x - 106) / 300 - (y - 50) / 400);
  s.paint([116, 58, 184, 108], () => true, 'k', () => 0.2);
  const scr = state === 'angry' ? [0x6a0a10, 0xff3a2a] : ruin ? [0x20242a, 0xb8c0c8] : [0x0a2a5a, 0x7ad8ff];
  s.paint([119, 61, 181, 105], () => true, 'k', () => 0.1, { glow: true });
  for (let y = 61; y <= 105; y++) for (let x = 119; x <= 181; x++) s.px(x, y, mixc(scr[0], scr[1], (y % 3 === 0 ? 0.08 : 0.16) + (ruin ? rand() * 0.6 : 0)));
  const ink = scr[1];
  const face = (glyph) => {
    // the screen's face, in big screen-pixels
    for (const [gx, gy] of glyph) s.paint([119 + gx * 3, 61 + gy * 3, 121 + gx * 3, 63 + gy * 3], () => true, 'k', () => 0.1, { glow: true }), s.line(119 + gx * 3, 61 + gy * 3, 121 + gx * 3, 61 + gy * 3, ink, 3);
  };
  if (state === 0 || state === 'night') face([[5, 6], [6, 5], [7, 6], [13, 6], [14, 5], [15, 6], [9, 10], [10, 11], [11, 10]]); // ^_^ (more or less)
  if (state === 1) for (let r = 0; r < 6; r++) for (let c = 0; c < 6 + ((r * 5) % 9); c++) if ((c * 7 + r * 3) % 5) s.line(122 + c * 3.4, 64 + r * 7, 123.5 + c * 3.4, 64 + r * 7, ink, 2); // lines of chat scrolling by
  if (state === 'angry') face([[5, 4], [6, 5], [7, 6], [6, 7], [5, 8], [15, 4], [14, 5], [13, 6], [14, 7], [15, 8], [8, 11], [9, 11], [10, 11], [11, 11], [12, 11]]); // >_<
  if (ruin) for (const [x0, y0, x1, y1] of [[130, 61, 150, 84], [150, 84, 142, 105], [150, 84, 176, 76]]) s.line(x0, y0, x1, y1, 0xffffff, 1);
  // the screen lights the desk (and in the dark, the shape behind it)
  s.paint([116, 122, 184, 132], () => true, 's', () => 0.6);
  for (let k = 0; k < 6; k++) for (let j = 0; j < 2; j++) s.dot(120 + k * 10.5, 125 + j * 4, 0.8, 0x4a4c56);
  s.dot(196, 128, 3, 0xd8d4c4);
  return s.render();
}

// ---------------------------------------------------------------- what it throws
/** A manga volume tumbling: 0 cover, 1 edge on, 2 the back, 3 flung open (pages fanning). */
export function manga(f) {
  const s = new HiSprite(30, 30, BASE);
  if (f === 1) s.paint([12, 3, 18, 27], () => true, 'w', () => 0.7);
  else if (f === 3) {
    s.poly([[15, 8], [2, 4], [3, 24], [15, 27]], 'w', { flat: 0.8 });
    s.poly([[15, 8], [28, 4], [27, 24], [15, 27]], 'w', { flat: 0.6 });
    for (let k = 0; k < 4; k++) s.line(5, 9 + k * 4, 13, 11 + k * 4, 0x3a3a46, 1), s.line(17, 11 + k * 4, 25, 9 + k * 4, 0x3a3a46, 1);
  } else {
    s.paint([6, 3, 24, 27], () => true, f === 0 ? 'p' : 'u', (x) => 0.7 - (x - 6) / 50);
    s.paint([6, 3, 9, 27], () => true, 'w', () => 0.75);
    if (f === 0) s.ellipse(16, 13, 4.5, 5, 'w', { flat: 0.8 }), s.dot(14.5, 12.5, 1, 0x14121a), s.dot(17.5, 12.5, 1, 0x14121a);
  }
  return s.render({ outline: 1 });
}

/** A noodle cup tumbling: 0 upright, 1 on its side, broth splashing out. */
export function noodle(f) {
  const s = new HiSprite(30, 30, BASE);
  if (f === 0) cup(s, 15, 25, 20, 1);
  else {
    s.poly([[4, 8], [24, 10], [24, 22], [4, 24]], 'w', { flat: 0.6 });
    s.paint([10, 8, 15, 24], () => true, 'r', () => 0.55);
    s.ellipse(26, 16, 3, 6, 'y', { flat: 0.6 });
    for (const [x, y] of [[28, 10], [29, 20], [27, 25]]) s.dot(x, y, 1.2, 0xf0c060);
  }
  return s.render({ outline: 1 });
}

/** A tall stack of volumes, falling end on (like the site cat's beams). */
export function stack() {
  const s = new HiSprite(36, 120, BASE);
  const rand = rng(11);
  for (let y = 2; y < 116; y += 7) book(s, 3 + Math.floor(rand() * 3), y, 28, 6, BOOKS[Math.floor(rand() * BOOKS.length)]);
  return s.render({ outline: 1 });
}

/** A gacha capsule: two halves, coloured over clear; the gold one is the rare pull. */
export function gacha(col) {
  const s = new HiSprite(24, 24, BASE);
  s.ellipse(12, 12, 9.5, 9.5, 'w', { bias: 0.1 });
  s.paint([2, 2, 22, 12], (x, y) => (x - 12) ** 2 + (y - 12) ** 2 < 90, col, (x, y) => 0.75 - (x - 2) / 40 - (y - 2) / 40, col === 'y' ? { glow: true } : {});
  s.line(3, 12, 21, 12, 0x6a6470, 1);
  s.dot(8, 7, 1.4, 0xffffff);
  return s.render({ outline: 1 });
}

export function heyaEnemies(add) {
  add('heya_0', room(0));
  add('heya_1', room(1));
  add('heya_angry', room('angry'));
  add('heya_night', room('night'));
  add('heya_ruin', room('ruin'));
  for (let f = 0; f < 4; f++) add(`manga_${f}`, manga(f));
  add('noodle_0', noodle(0));
  add('noodle_1', noodle(1));
  add('manga_stack', stack());
  add('gacha_r', gacha('r'));
  add('gacha_u', gacha('u'));
  add('gacha_g', gacha('g'));
  add('gacha_gold', gacha('y'));
}
