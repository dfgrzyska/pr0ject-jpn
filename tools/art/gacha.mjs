// The gachapon screen (plan-gacha.md), drawn at 540 px: the machine (a red enamel cabinet with a glass window
// over the capsules, a cream panel with the ticket slot, the crank's seat and the price plate, the chute and its
// tray, a sign in katakana), its crank, the glass's reflections, the lucky cat on its roof (beckoning: two frames),
// the capsules in the five rarities (whole, and their two halves for when they crack open), the ticket, a sparkle,
// and the pictures of the kinds of part a capsule can hold.
import { shotSkins } from './shots.mjs';
import { enemyBulletSkins } from './ebullets.mjs';
import { lookArt } from './looks.mjs';
import { decalArt } from './decals.mjs';
import { sealArt } from './seals.mjs';
import { ITEMS } from '../../src/data/gacha.js';
import { HiSprite, tones, speckle, inPoly } from '../lib/hisprite.mjs';
import { Raster } from '../lib/raster.mjs';
import { MACHINE, CAPSULE, BALL, NEKO } from '../../src/data/gachaLayout.js';
import { card } from './menu.mjs';

const INK = 0x14101c;
const RAMPS = {
  r: tones([0x7a1418, 0xd02a26, 0xff7a5e]), // red enamel
  c: tones([0x9a9282, 0xe8e2d2, 0xfffcf2]), // cream
  k: tones([0x18161e, 0x2e2c36, 0x4e4c58]), // dark
  s: tones([0x5a5a64, 0xb8bac4, 0xf4f6ff]), // chrome
  g: tones([0x8a6010, 0xe8b830, 0xfff4a8]), // gold
  i: [0x0a0e1e, 0x101830, 0x18244a, 0x223462, 0x2e4680], // behind the glass
  l: tones([0x9a5a10, 0xffb030, 0xfff0b0]), // a lamp's amber glass
  p: tones([0x8e96b0, 0xdfe6f4, 0xffffff]), // a capsule's clear half, pearly
  // the capsules' coloured halves, by rarity (UR is striped with all of the rainbow's)
  N: tones([0x6a7088, 0xaab2c8, 0xe8ecf8]),
  R: tones([0x1c3f9a, 0x3a82f0, 0xa8d8ff]),
  SR: tones([0x5a1f9a, 0xa050f0, 0xe6c0ff]),
  SSR: tones([0x9a5f10, 0xf0b432, 0xfff4a8]),
  u0: tones([0x98101a, 0xee3030, 0xff9a8a]),
  u1: tones([0xa84e08, 0xf58a20, 0xffc878]),
  u2: tones([0x9a7a10, 0xf0d030, 0xfff8b0]),
  u3: tones([0x1d6a3a, 0x37b35a, 0xa8f08e]),
  u4: tones([0x1c3f9a, 0x3a82f0, 0xa8d8ff]),
  u5: tones([0x5a1f9a, 0xa050f0, 0xe6c0ff]),
  f: tones([0xb39a8a, 0xf2e6d8, 0xfffaf0]), // the cat's porcelain
  q: tones([0x8a3a10, 0xf07a20, 0xffc070]), // its orange patch; flame
  m: tones([0x262941, 0x434a72, 0x737db0]), // gunmetal
  n: tones([0x3b2416, 0x6b4428, 0xa0703f]), // rope
  b: tones([0x1d5a8a, 0x3fb6e8, 0xc8fbff]), // the core's light
};

/** A rounded rectangle as a test. */
const rr = (x0, y0, x1, y1, r) => (x, y) => {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const dx = Math.max(0, x0 + r - x, x - (x1 - r));
  const dy = Math.max(0, y0 + r - y, y - (y1 - r));
  return dx * dx + dy * dy <= r * r;
};

/** A line one pixel inside the edge of a shape (a painted trim). */
function trim(s, box, test, c, a = 1) {
  for (let y = box[1]; y <= box[3]; y++)
    for (let x = box[0]; x <= box[2]; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      if (test(px, py) && !(test(px - 1, py) && test(px + 1, py) && test(px, py - 1) && test(px, py + 1))) s.px(x, y, c, a);
    }
}

/** A five-petalled cherry blossom, painted. */
function sakura(s, cx, cy, r, petal, heart) {
  for (let k = 0; k < 5; k++) {
    const a = -Math.PI / 2 + (k * Math.PI * 2) / 5;
    s.dot(cx + Math.cos(a) * r, cy + Math.sin(a) * r, r * 0.62, petal);
  }
  s.dot(cx, cy, r * 0.42, heart);
}

/** A screw head with its slot. */
function screw(s, x, y) {
  s.dot(x, y, 3.2, 0x8a8c96);
  s.dot(x - 0.6, y - 0.6, 1.6, 0xd8dae4);
  s.line(x - 2, y + 1.5, x + 2, y - 1.5, INK);
}

// ---------------------------------------------------------------- the machine
export function machine() {
  const { w: W, h: H, window: win, dial, slot, lamps } = MACHINE;
  const s = new HiSprite(W, H, RAMPS);
  // the feet
  for (const fx of [58, 242]) s.paint([fx - 24, 426, fx + 24, 455], rr(fx - 21, 428, fx + 21, 452, 6), 'k', (x) => 0.45 - (x - fx) / 80);
  // the lamps on its shoulders (they wink in the game)
  for (const l of lamps) s.ellipse(l.x, l.y, 11, 11, 'l', { glow: true });
  // the cabinet: red enamel, a gold line painted round it
  const body = rr(14, 48, 286, 434, 18);
  s.paint([10, 44, 290, 438], body, 'r', (x, y) => 0.63 - (x - 150) / 430 - (y - 240) / 1500, { pat: speckle({ amt: 0.03 }) });
  s.shade([254, 48, 290, 436], (x) => x > 268, -0.1);
  s.shade([10, 48, 40, 436], (x) => x < 24, 0.05);
  trim(s, [20, 54, 280, 428], rr(21.5, 55.5, 278.5, 426.5, 12), 0xf0c040, 0.9);
  trim(s, [23, 57, 277, 425], rr(24.5, 58.5, 275.5, 423.5, 10), 0x8a1418, 0.6);
  // the sign: a gold-framed cream board, GACHA in katakana
  s.paint([34, 0, 266, 64], rr(36, 2, 264, 62, 15), 'g', (x, y) => 0.62 - (y - 30) / 110 - (x - 150) / 700);
  s.paint([40, 6, 260, 58], rr(42, 8, 258, 56, 10), 'c', (x, y) => 0.66 - (y - 30) / 160);
  trim(s, [44, 10, 256, 54], rr(45.5, 11.5, 254.5, 52.5, 8), 0xd02a26, 0.85);
  katakana(s);
  // the window: a chrome frame, the dark inside with a wave pattern on its back wall
  s.paint([28, 64, 272, 256], rr(30, 66, 270, 254, 15), 's', (x, y) => 0.6 - (x - 150) / 500 - (y - 160) / 420);
  const inside = rr(win.x0, win.y0, win.x1, win.y1, 10);
  s.paint([win.x0, win.y0, win.x1, win.y1], inside, 'i', (x, y) => 0.18 + ((y - win.y0) / (win.y1 - win.y0)) * 0.55 - Math.abs(x - 150) / 600, { glow: true });
  // (seigaiha: rows of overlapping arcs)
  for (let row = 0; row * 14 < win.y1 - win.y0 + 28; row++)
    for (let cx = win.x0 - 14 + (row % 2) * 14; cx < win.x1 + 28; cx += 28)
      for (const r of [13, 9, 5])
        for (let a = Math.PI; a <= Math.PI * 2; a += 0.04) {
          const x = cx + Math.cos(a) * r;
          const y = win.y0 + row * 14 + Math.sin(a) * r;
          if (inside(x, y) && y < win.y0 + row * 14) s.px(x, y, 0x3a5490, 0.42);
        }
  for (let x = win.x0 + 6; x < win.x1 - 6; x++) s.px(x, win.y0, 0x05070f, 0.7); // the frame's shadow on it
  // the panel under the window: cream, a screw in each corner
  s.paint([28, 262, 272, 378], rr(30, 264, 270, 376, 13), 'c', (x, y) => 0.64 - (x - 150) / 600 - (y - 320) / 500, { pat: speckle({ amt: 0.025 }) });
  for (const [x, y] of [[40, 274], [260, 274], [40, 366], [260, 366]]) screw(s, x, y);
  // the ticket slot: a chrome bezel, the slit, a little ticket painted over it, a green lamp
  s.paint([44, slot.y - 14, 112, slot.y + 14], rr(46, slot.y - 12, 110, slot.y + 12, 6), 's', (x, y) => 0.62 - (y - slot.y) / 60);
  s.paint([52, slot.y - 4, 104, slot.y + 4], rr(54, slot.y - 3, 102, slot.y + 3, 2), 'k', () => 0.05);
  for (let x = 56; x <= 100; x++) s.px(x, slot.y + 3, 0x6a6c78);
  for (const [x0, y0] of [[56, 274]]) {
    for (let x = x0; x <= x0 + 22; x++) for (let y = y0; y <= y0 + 11; y++) s.px(x, y, 0xfff4dc);
    for (let x = x0; x <= x0 + 22; x++) { s.px(x, y0, 0xc02820); s.px(x, y0 + 11, 0xc02820); }
    for (let y = y0; y <= y0 + 11; y++) { s.px(x0, y, 0xc02820); s.px(x0 + 22, y, 0xc02820); }
    s.dot(x0 + 6.5, y0 + 6, 2.6, 0xd02a26);
    for (let x = x0 + 12; x <= x0 + 19; x++) { s.px(x, y0 + 4, 0x8a7c6a); s.px(x, y0 + 7, 0x8a7c6a); }
  }
  s.dot(94, 280, 3.4, 0x1a5a2a);
  s.dot(94, 280, 2.4, 0x6aff8a);
  s.px(93, 279, 0xeaffee);
  // the crank's seat: a dark well in a chrome ring, an arrow painted round it (turn this way)
  s.ellipse(dial.x, dial.y, 44, 44, 's', { bias: -0.04 });
  s.ellipse(dial.x, dial.y, 38, 38, 'k', { flat: 0.12 });
  for (let a = -1.15; a <= 1.15; a += 0.01) for (const r of [50, 51, 52]) s.px(dial.x + Math.cos(a) * r, dial.y + Math.sin(a) * r, 0xc02820);
  s.poly([[dial.x + Math.cos(1.15) * 51 - 8, dial.y + Math.sin(1.15) * 51 - 2], [dial.x + Math.cos(1.15) * 51 + 6, dial.y + Math.sin(1.15) * 51 - 9], [dial.x + Math.cos(1.15) * 51 - 3, dial.y + Math.sin(1.15) * 51 + 9]], 'r', { flat: 0.5 });
  // the price plate: one ticket a turn
  s.paint([212, 286, 258, 340], rr(214, 288, 256, 338, 6), 'k', () => 0.1);
  trim(s, [214, 288, 256, 338], rr(214.5, 288.5, 255.5, 337.5, 6), 0x8a8c96);
  for (let x = 222; x <= 248; x++) for (let y = 296; y <= 308; y++) s.px(x, y, 0xfff4dc);
  s.dot(222, 302.5, 2.5, 0x1a1820);
  s.dot(249, 302.5, 2.5, 0x1a1820);
  s.dot(230, 302.5, 2.6, 0xd02a26);
  for (let x = 236; x <= 244; x++) { s.px(x, 300, 0x8a7c6a); s.px(x, 304, 0x8a7c6a); }
  s.line(224, 318, 232, 328, 0xffe060, 2);
  s.line(232, 318, 224, 328, 0xffe060, 2);
  s.line(243, 316, 243, 330, 0xffe060, 3);
  s.line(239, 320, 243, 316, 0xffe060, 2);
  // the chute: a chrome mouth, dark inside, its tray sticking out; a blossom either side
  s.paint([88, 382, 212, 434], rr(90, 384, 210, 432, 12), 's', (x, y) => 0.6 - (x - 150) / 400 - (y - 400) / 200);
  s.paint([96, 390, 204, 432], rr(98, 392, 202, 430, 8), 'k', (x, y) => 0.02 + (y - 392) / 160, { glow: true });
  for (let x = 102; x <= 198; x++) s.px(x, 393, 0x05050a, 0.8);
  s.paint([82, 424, 218, 444], rr(84, 426, 216, 442, 7), 's', (x, y) => 0.74 - (y - 426) / 36 - (x - 150) / 600);
  for (const x of [54, 246]) sakura(s, x, 406, 9, 0xffe6dc, 0xf0c040);
  return s.render({ outline: 2 });
}

/** GA - CHI - small YA, brush-like strokes in red on the sign. */
function katakana(s) {
  const c = 0xb81e1e;
  const stroke = (pts, w = 4) => { for (let i = 1; i < pts.length; i++) s.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], c, w); };
  const y = 15;
  // ガ
  let x = 96;
  stroke([[x - 17, y + 10], [x + 11, y + 10], [x + 11, y + 24], [x + 9, y + 31], [x + 4, y + 34]]);
  stroke([[x - 2, y], [x - 4, y + 16], [x - 9, y + 27], [x - 16, y + 34]]);
  stroke([[x + 15, y - 1], [x + 17, y + 4]], 3);
  stroke([[x + 21, y - 2], [x + 23, y + 3]], 3);
  // チ
  x = 152;
  stroke([[x + 12, y + 1], [x + 2, y + 5], [x - 11, y + 8]]);
  stroke([[x - 18, y + 18], [x + 18, y + 18]]);
  stroke([[x + 1, y + 7], [x + 1, y + 22], [x - 2, y + 29], [x - 9, y + 35]]);
  // ャ
  x = 206;
  stroke([[x - 12, y + 21], [x + 10, y + 16], [x + 6, y + 23], [x + 3, y + 26]], 3);
  stroke([[x - 5, y + 11], [x - 2, y + 24], [x + 1, y + 36]], 3);
}

/** The crank: a chrome disc, a red face, the bar across it to turn it by (the game spins it). */
export function crank() {
  const s = new HiSprite(72, 72, RAMPS);
  s.ellipse(36, 36, 33, 33, 's');
  s.ellipse(36, 36, 26, 26, 'r', { bias: -0.05 });
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) s.dot(36 + Math.cos(a) * 29.5, 36 + Math.sin(a) * 29.5, 1.3, 0x4a4a54);
  s.tube(12, 36, 60, 36, 8, 's', { bias: 0.04 });
  for (const x of [18, 23, 49, 54]) s.line(x, 30, x, 42, 0x4a4a54, 1, 0.7);
  s.ellipse(36, 36, 7, 7, 'g');
  s.dot(34, 34, 1.6, 0xfffbe0);
  return s.render({ outline: 2 });
}

/** The glass over the capsules: slanting reflections, a darker edge where it sits in its frame. */
export function glass() {
  const { x0, y0, x1, y1 } = MACHINE.window;
  const w = x1 - x0;
  const h = y1 - y0;
  const r = new Raster(w, h);
  const inside = rr(0, 0, w, h, 10);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!inside(x + 0.5, y + 0.5)) continue;
      const d = x + y * 0.85;
      const edge = Math.min(x, y, w - 1 - x, h - 1 - y);
      if (edge < 5) r.set(x, y, 0x05070f, 0.3 - edge * 0.05);
      // two bright bands and a thin one, in steps (no soft gradients: pixel art)
      const band = (d > 52 && d < 80) || (d > 92 && d < 100) ? 0.15 : d > 80 && d < 86 ? 0.07 : d > 250 && d < 262 ? 0.06 : 0;
      if (band) r.set(x, y, 0xffffff, band * ((x + y) % 2 ? 1 : 0.8));
      if (y > h - 26) r.set(x, y, 0x6a9cff, 0.05);
    }
  // a glint in the top left corner
  for (let a = Math.PI; a < Math.PI * 1.5; a += 0.01) for (const rad of [12, 13]) r.set(18 + Math.cos(a) * rad, 18 + Math.sin(a) * rad, 0xffffff, 0.55);
  return r;
}

// ---------------------------------------------------------------- capsules
const UR = ['u0', 'u1', 'u2', 'u3', 'u4', 'u5'];

/** A capsule `size` px across: 'whole', or its 'top' (the coloured half) or 'bottom' (the clear one) alone. */
export function capsule(rarity, part = 'whole', size = CAPSULE) {
  const s = new HiSprite(size, size, RAMPS);
  const c = size / 2;
  const R = size / 2 - 3;
  const round = (x, y) => (x - c) ** 2 + (y - c) ** 2 <= R * R;
  const light = (x, y) => {
    const nx = (x - c) / R;
    const ny = (y - c) / R;
    const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
    return 0.34 + 0.6 * Math.max(0, -0.42 * nx - 0.52 * ny + 0.74 * nz);
  };
  if (part !== 'top') {
    s.paint([0, c, size, size], (x, y) => round(x, y) && y >= c, 'p', (x, y) => light(x, y) + 0.1);
    // what is inside shows through as a shadow
    if (part === 'whole') s.shade([0, c, size, size], (x, y) => ((x - c) / (R * 0.5)) ** 2 + ((y - c - R * 0.42) / (R * 0.34)) ** 2 < 1, -0.16);
  }
  if (part !== 'bottom') {
    const mat = (x) => (rarity === 'UR' ? UR[Math.max(0, Math.min(5, Math.floor(((x - (c - R)) / (2 * R)) * 6)))] : rarity);
    for (const m of rarity === 'UR' ? UR : [rarity]) s.paint([0, 0, size, c], (x, y) => round(x, y) && y < c && mat(x) === m, m, light);
    // the glint, and (legendary) a star
    s.dot(c - R * 0.42, c - R * 0.5, R * 0.16, 0xffffff, 0.95);
    s.dot(c - R * 0.2, c - R * 0.68, R * 0.08, 0xffffff, 0.8);
    if (rarity === 'UR' || rarity === 'SSR') {
      const sx = c + R * 0.3;
      const sy = c - R * 0.42;
      for (let k = -3; k <= 3; k++) { s.px(sx + k, sy, 0xffffff, 1 - Math.abs(k) * 0.2); s.px(sx, sy + k, 0xffffff, 1 - Math.abs(k) * 0.2); }
    }
  }
  // the belt where the halves meet
  if (part === 'whole') for (let x = 0; x < size; x++) if (round(x + 0.5, c)) { s.px(x, c - 1, INK, 0.55); s.px(x, c, 0xffffff, 0.5); }
  if (part === 'bottom') for (let x = 0; x < size; x++) if (round(x + 0.5, c)) s.px(x, c, 0x6a7088, 0.9); // the open rim
  return s.render({ outline: 2, seams: false });
}

/** The ticket: cream paper, a red frame, a seal, lines of print, its ends punched. */
export function ticket() {
  const w = 54;
  const h = 30;
  const s = new HiSprite(w, h, RAMPS);
  const paper = (x, y) => x >= 3 && x <= w - 3 && y >= 3 && y <= h - 3 && Math.hypot(x - 3, y - h / 2) > 4.5 && Math.hypot(x - (w - 3), y - h / 2) > 4.5;
  s.paint([0, 0, w, h], paper, 'c', (x, y) => 0.7 - (y - h / 2) / 60 - (x - w / 2) / 200);
  for (let x = 7; x <= w - 8; x++) { s.px(x, 6, 0xc02820); s.px(x, h - 7, 0xc02820); }
  for (let y = 6; y <= h - 7; y++) if (Math.abs(y - h / 2) > 6) { s.px(7, y, 0xc02820); s.px(w - 8, y, 0xc02820); }
  sakura(s, 17, h / 2, 4.2, 0xd02a26, 0xfff4dc);
  for (const [y, x1] of [[11, 44], [15, 40], [19, 44]]) for (let x = 27; x <= x1; x++) s.px(x, y, 0x8a7c6a);
  for (let y = 9; y <= h - 10; y += 2) s.px(24, y, 0xb8ac98); // the tear-off line
  return s.render({ outline: 2 });
}

/** A four-pointed sparkle, white (tinted in the game). */
export function sparkle(size = 27) {
  const r = new Raster(size, size);
  const c = (size - 1) / 2;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const v = 1 - (Math.sqrt(Math.abs(x - c)) + Math.sqrt(Math.abs(y - c))) / Math.sqrt(c * 1.15);
      if (v > 0.28) r.set(x, y, 0xffffff, 1);
      else if (v > 0.12) r.set(x, y, 0xffffff, 0.55);
    }
  return r;
}

// ---------------------------------------------------------------- the lucky cat on the roof
/** Maneki-neko, sitting: calico, a red collar with a bell, a gold coin under one paw, the other beckoning. */
export function neko(frame = 0) {
  const { w, h } = NEKO;
  const s = new HiSprite(w, h, RAMPS);
  const cx = 44;
  // the tail curling out behind, the body
  s.tube(66, 78, 76, 62, 5, 'f', { rb: 4 });
  s.ellipse(cx, 66, 25, 22, 'f');
  s.ellipse(58, 72, 9, 7, 'k', { bias: 0.1 }); // a black patch on the haunch
  // the hind paws
  for (const x of [30, 58]) s.ellipse(x, 84, 10, 5, 'f', { bias: 0.05 });
  // the coin it holds: a koban
  s.ellipse(55, 64, 9, 13, 'g');
  for (const y of [57, 61, 65, 69]) s.line(51, y, 59, y, 0x8a6010, 1, 0.8);
  s.ellipse(47, 60, 6, 5, 'f', { bias: 0.04 }); // the paw on it
  // the head, the ears
  for (const side of [-1, 1]) {
    const ex = cx + side * 15;
    s.poly([[ex - 8, 22], [ex + side * 3, 4], [ex + 8, 22]], 'f', { flat: 0.6 });
    s.poly([[ex - 4, 20], [ex + side * 2, 9], [ex + 4, 20]], 'r', { flat: 0.6 });
  }
  s.ellipse(cx, 34, 23, 19, 'f');
  s.ellipse(cx + 11, 21, 9, 6, 'q', { bias: 0.05 }); // an orange patch over one brow
  // the collar and its bell
  s.tube(cx - 17, 52, cx + 17, 52, 3.4, 'r');
  s.ellipse(cx, 56, 4.5, 4.5, 'g');
  s.line(cx - 2, 57, cx + 2, 57, 0x6a4808);
  // the face: happy closed eyes, a pink nose, the mouth, whiskers
  for (const side of [-1, 1]) {
    const ex = cx + side * 10;
    for (let a = Math.PI * 1.15; a <= Math.PI * 1.85; a += 0.05) for (const r of [5, 6]) s.px(ex + Math.cos(a) * r, 38 + Math.sin(a) * r, INK);
    for (const dy of [-2, 2]) s.line(cx + side * 16, 41 + dy * 0.6, cx + side * 27, 40 + dy * 2, 0x6a5c54, 1, 0.8);
  }
  s.dot(cx, 41, 2, 0xf08bb0);
  s.line(cx, 43, cx - 4, 46, INK);
  s.line(cx, 43, cx + 4, 46, INK);
  // the beckoning paw: up by the ear, or bent forward
  const [px, py] = frame ? [13, 30] : [16, 16];
  s.tube(24, 56, px + 2, py + 6, 6, 'f', { rb: 5.5 });
  s.ellipse(px, py, 7.5, 6.5, 'f', { bias: 0.04 });
  for (const dx of [-3, 0, 3]) s.line(px + dx, py - 3 + (frame ? 4 : 0), px + dx, py + (frame ? 4 : 0), 0xb8a898, 1, 0.9);
  return s.render({ outline: 2 });
}

// ---------------------------------------------------------------- what a capsule can hold: the kinds of part
/** An engine: a nozzle with its cooling rings, two fins, the flame. */
function partEngine() {
  const s = new HiSprite(72, 72, RAMPS);
  s.ellipse(36, 60, 9, 11, 'q', { glow: true });
  s.dot(36, 58, 4, 0xfff4a8);
  s.dot(36, 56, 2, 0xffffff);
  for (const side of [-1, 1]) s.poly([[36 + side * 12, 20], [36 + side * 27, 40], [36 + side * 12, 40]], 'r', { flat: 0.55 });
  s.tube(36, 8, 36, 34, 13, 's');
  s.poly([[23, 32], [49, 32], [56, 52], [16, 52]], 'k', { ball: [36, 42, 26, 22] });
  for (const y of [14, 20, 26]) s.line(24, y, 48, y, 0x4a4a54, 1, 0.8);
  for (let x = 18; x <= 54; x++) s.px(x, 51, 0xf0c040);
  s.ellipse(36, 8, 9, 4, 'g');
  return s.render({ outline: 2 });
}

/** A gun: twin barrels on a gunmetal block with a red band. */
function partGun() {
  const s = new HiSprite(72, 72, RAMPS);
  for (const x of [25, 47]) {
    s.tube(x, 8, x, 44, 6, 's');
    s.tube(x, 6, x, 12, 7.5, 'k');
    s.dot(x, 6, 3, 0x05050a);
    for (const y of [20, 28]) s.line(x - 6, y, x + 6, y, 0x4a4a54, 1, 0.8);
  }
  s.paint([10, 38, 62, 68], rr(12, 40, 60, 66, 6), 'm', (x, y) => 0.6 - (x - 36) / 110 - (y - 52) / 90);
  for (let x = 14; x <= 58; x++) for (const y of [50, 51, 52]) s.px(x, y, 0xd02a26);
  for (const [x, y] of [[18, 45], [54, 45], [18, 61], [54, 61]]) s.dot(x, y, 1.6, 0xb8bac4);
  return s.render({ outline: 2 });
}

/** A bomb: a firework shell in black lacquer, a gold paper band, a red seal, its fuse alight. */
function partBomb() {
  const s = new HiSprite(72, 72, RAMPS);
  s.tube(36, 22, 40, 13, 2.6, 'n');
  s.tube(40, 13, 49, 9, 2.4, 'n');
  s.dot(52, 8, 3.4, 0xffb030);
  s.dot(52, 8, 1.8, 0xfff8c0);
  for (const [dx, dy] of [[6, -4], [7, 3], [-1, -6], [4, 6]]) s.px(52 + dx, 8 + dy, 0xffe060);
  s.ellipse(36, 44, 23, 23, 'k', { bias: 0.08 });
  for (let x = 13; x <= 59; x++) {
    const dy = Math.round(Math.sin(((x - 13) / 46) * Math.PI) * 4);
    for (const k of [0, 1, 2]) if ((x - 36) ** 2 + (42 + dy + k - 44) ** 2 < 22 * 22) s.px(x, 42 + dy + k, k === 1 ? 0xfff4a8 : 0xe8b830);
  }
  for (let x = 29; x <= 43; x++) for (let y = 49; y <= 61; y++) if ((x - 36) ** 2 + (y - 44) ** 2 < 21 * 21) s.px(x, y, 0xd02a26);
  s.line(32, 52, 40, 52, 0xfff4dc);
  s.line(36, 51, 36, 59, 0xfff4dc);
  s.line(32, 58, 40, 58, 0xfff4dc);
  return s.render({ outline: 2 });
}

/** A core: a ball of light in a gold ring, a swirl turning in it. */
function partCore() {
  const s = new HiSprite(72, 72, RAMPS);
  s.ellipse(36, 36, 28, 28, 'g');
  s.ellipse(36, 36, 21, 21, 'k', { flat: 0.1 });
  s.ellipse(36, 36, 15, 15, 'b', { glow: true });
  for (let a = 0; a < Math.PI * 1.5; a += 0.03) {
    const r = 2 + a * 2.4;
    s.px(36 + Math.cos(a) * r, 36 + Math.sin(a) * r, 0xffffff, 0.9);
    s.px(36 - Math.cos(a) * r, 36 - Math.sin(a) * r, 0x1d5a8a, 0.7);
  }
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + (k * Math.PI) / 2;
    s.dot(36 + Math.cos(a) * 24.5, 36 + Math.sin(a) * 24.5, 2.4, 0x8a6010);
    s.dot(36 + Math.cos(a) * 24.5 - 0.6, 36 + Math.sin(a) * 24.5 - 0.6, 1, 0xfff4a8);
  }
  return s.render({ outline: 2 });
}

/** An omamori: a brocade pouch tied with a knotted cord, a label down its front. */
function partOmamori() {
  const s = new HiSprite(72, 72, RAMPS);
  const pouch = [[19, 26], [27, 17], [45, 17], [53, 26], [53, 67], [19, 67]];
  s.poly(pouch, 'r', { flat: 0.58 });
  s.shade([19, 17, 53, 67], (x) => x > 44, -0.12);
  for (let y = 22; y < 66; y += 7)
    for (let x = 22 + ((y / 7) % 2) * 4; x < 52; x += 8)
      if (inPoly(pouch, x, y) && !(x > 28 && x < 44 && y > 28 && y < 60)) { s.px(x, y, 0xf0c040); s.px(x - 1, y + 1, 0xf0c040); s.px(x + 1, y + 1, 0xf0c040); s.px(x, y + 2, 0xf0c040); }
  for (let x = 30; x <= 42; x++) for (let y = 30; y <= 58; y++) s.px(x, y, 0xfff4dc);
  for (const [x0, y0, x1, y1] of [[33, 35, 39, 35], [36, 33, 36, 41], [32, 46, 40, 46], [36, 44, 36, 55], [33, 52, 39, 52]]) s.line(x0, y0, x1, y1, INK);
  // the cord: a loop, the knot, two ends
  for (let a = 0; a < Math.PI * 2; a += 0.05) for (const r of [5, 6]) s.px(36 + Math.cos(a) * r, 8 + Math.sin(a) * r, 0xf0c040);
  s.dot(36, 16, 3.4, 0xe8b830);
  s.dot(35, 15, 1.2, 0xfff4a8);
  s.line(33, 18, 27, 25, 0xe8b830, 2);
  s.line(39, 18, 45, 25, 0xe8b830, 2);
  return s.render({ outline: 2 });
}

/** A paint job: a tin of red paint, a run down its side. */
function partPaint() {
  const s = new HiSprite(72, 72, RAMPS);
  s.poly([[17, 24], [55, 24], [55, 60], [17, 60]], 's', { flat: 0.5 });
  s.ellipse(36, 60, 19, 6, 's');
  s.shade([17, 24, 55, 66], (x) => x > 46, -0.14);
  s.ellipse(36, 24, 19, 7, 'r');
  s.poly([[22, 24], [30, 24], [30, 42], [26, 48], [22, 42]], 'r');
  s.poly([[40, 26], [46, 26], [46, 36], [43, 40], [40, 36]], 'r');
  for (let a = Math.PI; a < Math.PI * 2; a += 0.04) for (const r of [22, 23]) s.px(36 + Math.cos(a) * r, 22 + Math.sin(a) * r * 0.8, 0xe8b830);
  return s.render({ outline: 2 });
}

/** A flame colour: a flame, hot at the heart. */
function partFlame() {
  const s = new HiSprite(72, 72, RAMPS);
  s.poly([[36, 5], [49, 28], [55, 45], [47, 61], [36, 66], [25, 61], [17, 45], [23, 28]], 'q');
  s.poly([[36, 26], [45, 45], [41, 59], [31, 59], [27, 45]], 'g');
  s.dot(36, 53, 5.5, 0xfff8c0);
  s.dot(36, 55, 2.6, 0xffffff);
  return s.render({ outline: 2 });
}

/** A dye for the shots: a drop of ink, three needles in its colour. */
function partDye() {
  const s = new HiSprite(72, 72, RAMPS);
  s.poly([[30, 8], [44, 34], [46, 46], [40, 58], [30, 62], [20, 58], [14, 46], [16, 34]], 'R');
  s.dot(23, 44, 3.2, 0xffffff);
  s.dot(26, 38, 1.6, 0xffffff);
  for (const [x, y] of [[52, 14], [58, 30], [52, 46]]) {
    s.line(x, y, x, y + 14, 0x3a82f0, 3);
    s.line(x, y + 2, x, y + 9, 0xa8d8ff, 1);
  }
  return s.render({ outline: 2 });
}

/** A bullet with its rim, dark hairline and white core. */
function bullet(s, x, y, r, body, ring) {
  s.dot(x, y, r, INK);
  s.dot(x, y, r - 2, ring);
  s.dot(x, y, r - 5, body);
  s.dot(x, y, r * 0.3, 0xffffff);
}

/** A colour for the enemies' bullets: three of them, a colour each. */
function partEbColor() {
  const s = new HiSprite(72, 72, RAMPS);
  bullet(s, 22, 24, 15, 0xff3838, 0xffb0a8);
  bullet(s, 50, 30, 15, 0x22d0e8, 0xb0f4ff);
  bullet(s, 32, 52, 15, 0xf2d21a, 0xfff4a8);
  return s.render({ outline: 0 });
}

/** A shape for the enemies' bullets: a star of a bullet. */
function partEbShape() {
  const s = new HiSprite(72, 72, RAMPS);
  const star = (r) => Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const q = i % 2 ? r * 0.5 : r;
    return [36 + Math.cos(a) * q, 38 + Math.sin(a) * q];
  });
  for (let y = 0; y < 72; y++)
    for (let x = 0; x < 72; x++) {
      const at = (r) => inPoly(star(r), x + 0.5, y + 0.5);
      if (at(34)) s.px(x, y, at(30) ? (at(22) ? 0xe63cff : 0xee9cff) : INK);
    }
  s.dot(36, 38, 7, 0xffffff);
  return s.render({ outline: 0 });
}

/** A marker for the hitbox: a ring, cross hairs, the dot in the middle. */
function partMarker() {
  const s = new HiSprite(72, 72, RAMPS);
  s.dot(36, 36, 26, INK);
  s.dot(36, 36, 23, 0x4fe8ff);
  s.dot(36, 36, 18, INK);
  for (const [x0, y0, x1, y1] of [[36, 4, 36, 22], [36, 50, 36, 68], [4, 36, 22, 36], [50, 36, 68, 36]]) {
    s.line(x0, y0, x1, y1, INK, 7);
    s.line(x0, y0, x1, y1, 0xffffff, 3);
  }
  s.dot(36, 36, 8, INK);
  s.dot(36, 36, 5.5, 0xffffff);
  s.dot(36, 36, 2.5, 0xff3838);
  return s.render({ outline: 0 });
}

/** A companion: a little ghost with a heart. */
function partCompanion() {
  const s = new HiSprite(72, 72, RAMPS);
  s.dot(32, 30, 22, INK);
  s.poly([[10, 30], [54, 30], [54, 62], [47, 55], [40, 62], [32, 55], [24, 62], [17, 55], [10, 62]], 'k');
  s.dot(32, 30, 19, 0xf4f4fa);
  for (let y = 30; y < 58; y++) for (let x = 13; x < 52; x++) if (y < 52 || Math.floor((x - 13) / 6.5) % 2 === 0) s.px(x, y, 0xf4f4fa);
  s.dot(25, 30, 3.5, INK);
  s.dot(39, 30, 3.5, INK);
  s.dot(32, 39, 2.5, INK);
  s.dot(56, 14, 5, 0xf0485a);
  s.dot(64, 14, 5, 0xf0485a);
  s.poly([[51, 16], [69, 16], [60, 27]], 'r');
  return s.render({ outline: 0 });
}

/** A colour for the turrets' bubble: the bubble, a glint on it. */
function partShield() {
  const s = new HiSprite(72, 72, RAMPS);
  s.dot(36, 36, 29, INK);
  s.dot(36, 36, 26, 0xa8dcff);
  s.dot(36, 36, 23, 0x3a82f0);
  s.dot(38, 38, 20, 0x1c3f9a);
  s.dot(26, 24, 5, 0xffffff);
  s.dot(33, 19, 2, 0xffffff);
  return s.render({ outline: 0 });
}

/** A sticker: a red seal with a star, a corner peeling. */
function partDecal() {
  const s = new HiSprite(72, 72, RAMPS);
  s.poly([[10, 10], [62, 10], [62, 48], [48, 62], [10, 62]], 'r');
  s.poly([[62, 48], [48, 48], [48, 62]], 'c');
  const star = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const q = i % 2 ? 8 : 18;
    return [34 + Math.cos(a) * q, 34 + Math.sin(a) * q];
  });
  for (let y = 12; y < 56; y++) for (let x = 12; x < 56; x++) if (inPoly(star, x + 0.5, y + 0.5)) s.px(x, y, 0xffffff);
  return s.render({ outline: 2 });
}

/** A card to collect: a gold frame, a fox's face in it. */
function partCard() {
  const s = new HiSprite(72, 72, RAMPS);
  s.poly([[14, 6], [58, 6], [58, 66], [14, 66]], 'g');
  s.poly([[18, 10], [54, 10], [54, 52], [18, 52]], 'i');
  s.poly([[24, 18], [32, 26], [24, 34]], 'q');
  s.poly([[48, 18], [40, 26], [48, 34]], 'q');
  s.dot(36, 34, 12, 0xf07a20);
  s.dot(30, 40, 5, 0xffffff);
  s.dot(42, 40, 5, 0xffffff);
  s.dot(31, 32, 1.6, INK);
  s.dot(41, 32, 1.6, INK);
  s.line(22, 58, 50, 58, INK, 2);
  return s.render({ outline: 2 });
}

/** An animated paint job: a hull in flowing bands of colour, glints on it. */
function partPaintFx() {
  const s = new HiSprite(72, 72, RAMPS);
  s.poly([[36, 4], [50, 30], [66, 52], [46, 56], [36, 68], [26, 56], [6, 52], [22, 30]], 'k');
  for (const [y, c] of [[20, 0xff5a8a], [28, 0xffa040], [36, 0xffe04f], [44, 0x6ae486], [52, 0x4fc8ff]]) {
    const w = (y - 4) * 0.5 - 4;
    s.line(36 - w, y, 36 + w, y, c, 5);
  }
  for (const [x, y, r] of [[52, 14, 7], [14, 34, 5], [58, 40, 4]]) {
    s.line(x - r, y, x + r, y, 0xffffff, 2);
    s.line(x, y - r, x, y + r, 0xffffff, 2);
  }
  return s.render({ outline: 2 });
}

/** An aura: lights on a ring around a small ship. */
function partAura() {
  const s = new HiSprite(72, 72, RAMPS);
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    s.dot(36 + Math.cos(a) * 27, 38 + Math.sin(a) * 17, 1.4, 0x33416a);
  }
  s.poly([[36, 20], [46, 44], [36, 40], [26, 44]], 'c');
  for (const [i, c] of [[0, 0x6aa8ff], [1, 0xff9ac4], [2, 0xffd040], [3, 0x6ae486], [4, 0xb070f0], [5, 0xff5a5a]]) {
    const a = (i / 6) * Math.PI * 2 + 0.4;
    const x = 36 + Math.cos(a) * 27;
    const y = 38 + Math.sin(a) * 17;
    s.dot(x, y, 6.5, INK);
    s.dot(x, y, 4.5, c);
    s.dot(x - 1, y - 1, 1.6, 0xffffff);
  }
  return s.render({ outline: 2 });
}

/** A trail: a ribbon of the rainbow streaming from a ship's tail. */
function partTrail() {
  const s = new HiSprite(72, 72, RAMPS);
  for (const [k, c] of [[-2, 0xff5a5a], [-1, 0xffa040], [0, 0xffe04f], [1, 0x6ae486], [2, 0x4fc8ff]]) {
    for (let y = 30; y < 68; y += 2) s.dot(36 + k * 4 + Math.sin(y * 0.22) * 5, y, 2.6, c);
  }
  s.poly([[36, 4], [50, 30], [36, 25], [22, 30]], 'c');
  return s.render({ outline: 2 });
}

/** An entrance: a ship rising out of rings. */
function partEntry() {
  const s = new HiSprite(72, 72, RAMPS);
  for (const [ry, rx, c] of [[60, 28, 0x4fb8ff], [50, 20, 0x8ad8ff], [41, 12, 0xc8f0ff]]) {
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      s.dot(36 + Math.cos(a) * rx, ry + Math.sin(a) * rx * 0.28, 1.8, c);
    }
  }
  s.poly([[36, 4], [50, 32], [36, 27], [22, 32]], 'c');
  s.line(36, 34, 36, 46, 0xffe04f, 4);
  return s.render({ outline: 2 });
}

/** A triumph: a firework's burst over a gold cup. */
function partVictory() {
  const s = new HiSprite(72, 72, RAMPS);
  for (const [i, c] of [[0, 0xff5a5a], [1, 0xffa040], [2, 0xffe04f], [3, 0x6ae486], [4, 0x4fc8ff], [5, 0xb070f0], [6, 0xff9ac4], [7, 0xffffff]]) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    s.line(36 + Math.cos(a) * 7, 24 + Math.sin(a) * 7, 36 + Math.cos(a) * 20, 24 + Math.sin(a) * 20, c, 3);
    s.dot(36 + Math.cos(a) * 22, 24 + Math.sin(a) * 22, 3, c);
  }
  s.dot(36, 24, 4, 0xffffff);
  s.poly([[24, 46], [48, 46], [44, 58], [40, 60], [40, 64], [46, 68], [26, 68], [32, 64], [32, 60], [28, 58]], 'g');
  return s.render({ outline: 2 });
}

/** A fall: a pale soul's flame drifting up, petals under it. */
function partDeath() {
  const s = new HiSprite(72, 72, RAMPS);
  s.poly([[36, 4], [41, 16], [50, 26], [52, 38], [46, 50], [36, 54], [26, 50], [20, 38], [22, 26], [31, 16]], 'R');
  s.dot(36, 38, 11, 0xc8f0ff);
  s.dot(36, 40, 7, 0xffffff);
  s.dot(31, 36, 2, INK);
  s.dot(41, 36, 2, INK);
  for (const [x, y] of [[14, 60], [30, 64], [46, 62], [60, 58]]) {
    s.dot(x, y, 4, 0xff9ac4);
    s.dot(x + 1, y - 1, 1.6, 0xffe0ee);
  }
  return s.render({ outline: 2 });
}

/** A seal for the kills: a hanko's block of red ink, the sign for "great" cut out of it. */
function partSeal() {
  const s = new HiSprite(72, 72, RAMPS);
  s.poly([[10, 10], [62, 10], [62, 62], [10, 62]], 'r');
  for (const [x0, y0, x1, y1] of [[20, 28, 52, 28], [36, 16, 36, 28], [36, 28, 22, 54], [36, 28, 50, 54]]) s.line(x0, y0, x1, y1, 0xfff4e0, 5);
  return s.render({ outline: 2 });
}

/** A shape for the turrets' bubble: a honeycomb's cell, a smaller one inside it. */
function partShieldShape() {
  const s = new HiSprite(72, 72, RAMPS);
  const hex = (r) => [0, 1, 2, 3, 4, 5].map((i) => [36 + Math.cos((i / 6) * Math.PI * 2) * r, 36 + Math.sin((i / 6) * Math.PI * 2) * r]);
  s.poly(hex(30), 'R');
  for (const r of [29, 19]) hex(r).forEach((p, i, all) => s.line(p[0], p[1], all[(i + 1) % 6][0], all[(i + 1) % 6][1], 0xc8f0ff, 2));
  s.dot(26, 24, 4, 0xffffff);
  return s.render({ outline: 2 });
}

/** A title: a scroll with lines of writing and a red seal. */
function partTitle() {
  const s = new HiSprite(72, 72, RAMPS);
  s.poly([[12, 14], [60, 14], [60, 58], [12, 58]], 'c');
  s.poly([[8, 10], [64, 10], [64, 18], [8, 18]], 'n');
  s.poly([[8, 54], [64, 54], [64, 62], [8, 62]], 'n');
  for (const y of [26, 33, 40]) s.line(20, y, 44, y, INK, 2);
  s.dot(50, 44, 6, 0xd02a26);
  return s.render({ outline: 2 });
}

/** A sound: a note. */
function partSound() {
  const s = new HiSprite(72, 72, RAMPS);
  s.line(30, 14, 30, 50, INK, 5);
  s.line(30, 14, 54, 20, INK, 5);
  s.line(54, 20, 54, 44, INK, 5);
  s.dot(23, 52, 10, INK);
  s.dot(47, 46, 10, INK);
  s.dot(23, 52, 7, 0xffd040);
  s.dot(47, 46, 7, 0xffd040);
  s.line(30, 16, 30, 48, 0xffd040, 2);
  s.line(54, 22, 54, 42, 0xffd040, 2);
  s.line(30, 15, 54, 21, 0xffd040, 2);
  return s.render({ outline: 0 });
}

/** A graze: a bullet and the spark struck off it. */
function partGraze() {
  const s = new HiSprite(72, 72, RAMPS);
  bullet(s, 22, 48, 15, 0xe63cff, 0xee9cff);
  for (const [x0, y0, x1, y1] of [[46, 26, 46, 8], [46, 26, 64, 26], [46, 26, 59, 13], [46, 26, 33, 13], [46, 26, 46, 40], [46, 26, 34, 26]]) {
    s.line(x0, y0, x1, y1, INK, 6);
    s.line(x0, y0, x1, y1, 0x4fe8ff, 2);
  }
  s.dot(46, 26, 6, INK);
  s.dot(46, 26, 4, 0xffffff);
  return s.render({ outline: 0 });
}

/** A colour for the score: digits' bars in a row. */
function partHudColor() {
  const s = new HiSprite(72, 72, RAMPS);
  s.poly([[6, 20], [66, 20], [66, 52], [6, 52]], 'k');
  for (const [x, c] of [[12, 0xffd040], [26, 0xff9ac4], [40, 0x7af0c0], [54, 0x7ac8ff]]) {
    for (const [dx, dy, w, h] of [[0, 0, 8, 3], [0, 0, 3, 22], [5, 0, 3, 22], [0, 19, 8, 3]]) for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) s.px(x + dx + i, 25 + dy + j, c);
  }
  return s.render({ outline: 2 });
}

/** An icon for the lives: a heart. */
function partLifeIcon() {
  const s = new HiSprite(72, 72, RAMPS);
  for (let y = 0; y < 72; y++)
    for (let x = 0; x < 72; x++) {
      const at = (k) => {
        const u = ((x + 0.5 - 36) / k) * 1.2;
        const v = -((y + 0.5 - 34) / k) * 1.2 + 0.15;
        return (u * u + v * v - 1) ** 3 - u * u * v * v * v <= 0;
      };
      if (at(30)) s.px(x, y, at(26) ? (x + y < 56 ? 0xff8a8a : x + y < 80 ? 0xf0485a : 0xd0283a) : INK);
    }
  s.dot(24, 24, 4, 0xffffff);
  return s.render({ outline: 0 });
}

/** A look for the explosions: a fireball in blue. */
function partBlast() {
  const s = new HiSprite(72, 72, RAMPS);
  for (const [x, y, r] of [[36, 36, 26], [20, 26, 12], [54, 24, 11], [52, 52, 13], [20, 52, 11]]) s.dot(x, y, r, INK);
  for (const [x, y, r] of [[36, 36, 23], [20, 26, 9], [54, 24, 8], [52, 52, 10], [20, 52, 8]]) s.dot(x, y, r, 0x2a5ee8);
  for (const [x, y, r] of [[36, 36, 17], [22, 28, 5], [52, 26, 4], [50, 50, 6]]) s.dot(x, y, r, 0x4fb8ff);
  s.dot(36, 36, 11, 0xc8f0ff);
  s.dot(36, 36, 6, 0xffffff);
  return s.render({ outline: 0 });
}

/** A look for the bomb: its ring, bits thrown out of it. */
function partBombLook() {
  const s = new HiSprite(72, 72, RAMPS);
  s.dot(36, 36, 30, INK);
  s.dot(36, 36, 27, 0xffd040);
  s.dot(36, 36, 22, INK);
  s.dot(36, 36, 19, 0x18244a);
  for (const [x, y, c] of [[36, 24, 0xff5a5a], [47, 31, 0xffa040], [47, 43, 0x6ae486], [36, 49, 0x4fc8ff], [25, 43, 0xb070f0], [25, 31, 0xffe04f]]) s.dot(x, y, 3.5, c);
  s.dot(36, 36, 5, 0xffffff);
  return s.render({ outline: 0 });
}

/** A skin for the shots: three needles in flight. */
function partShot() {
  const s = new HiSprite(72, 72, RAMPS);
  for (const [x, y] of [[20, 26], [36, 8], [52, 26]]) {
    s.poly([[x, y], [x + 6, y + 12], [x + 4, y + 38], [x - 4, y + 38], [x - 6, y + 12]], 'g');
    s.line(x, y + 4, x, y + 30, 0xffffff, 2);
    s.dot(x, y + 37, 3, 0xf07a20);
  }
  return s.render({ outline: 2 });
}

/** A wake: petals strewn in a curve. */
function partWake() {
  const s = new HiSprite(72, 72, RAMPS);
  for (const [x, y, r] of [[20, 14, 9], [38, 24, 10], [50, 42, 9], [30, 46, 7], [44, 60, 6], [18, 34, 5]]) {
    s.dot(x, y, r, 0xf08bb0);
    s.dot(x - r * 0.25, y - r * 0.25, r * 0.6, 0xffd3e2);
    s.dot(x + r * 0.3, y + r * 0.3, r * 0.22, 0xc85a85);
  }
  return s.render({ outline: 2 });
}

/** The title screen's paper card at half its width (two side by side: the gachapon, the hangar): its two ends joined. */
function halfCard(active) {
  const full = card(false, active);
  const half = full.w / 4;
  const out = new Raster(half * 2, full.h);
  out.blit(full.crop(0, 0, half, full.h), 0, 0);
  out.blit(full.crop(full.w - half, 0, half, full.h), half, 0);
  return out;
}

export function gachaAtlas() {
  const out = [];
  const add = (name, raster) => out.push({ name, raster });
  for (const s of shotSkins()) out.push(s); // the skins for the player's shots (shots.mjs)
  // the enemy bullets' shapes, the colours' pictures and the hitbox's markers (ebullets.mjs)
  for (const s of enemyBulletSkins(Object.fromEntries(ITEMS.filter((it) => it.kind === 'eb_color').map((it) => [it.pic.slice(7), it.body])))) out.push(s);
  add('machine', machine());
  add('crank', crank());
  add('glass', glass());
  for (const f of [0, 1]) add(`neko_${f}`, neko(f));
  for (const r of ['N', 'R', 'SR', 'SSR', 'UR']) {
    add(`cap_${r}`, capsule(r));
    add(`cap_${r}_top`, capsule(r, 'top'));
    add(`cap_${r}_bottom`, capsule(r, 'bottom'));
    add(`ball_${r}`, capsule(r, 'whole', BALL)); // as it lies under the glass, smaller
  }
  add('icon_gacha', capsule('SSR', 'whole', 54)); // the title screen's button
  add('half_off', halfCard(false));
  add('half_on', halfCard(true));
  add('ticket', ticket());
  add('sparkle', sparkle());
  add('part_engine', partEngine());
  add('part_gun', partGun());
  add('part_bomb', partBomb());
  add('part_core', partCore());
  add('part_omamori', partOmamori());
  add('part_paint', partPaint());
  add('part_flame', partFlame());
  add('part_dye', partDye());
  add('part_wake', partWake());
  add('part_shot', partShot());
  add('part_eb_color', partEbColor());
  add('part_eb_shape', partEbShape());
  add('part_marker', partMarker());
  for (const s of lookArt()) out.push(s); // life icons and other small looks (looks.mjs)
  add('part_blast', partBlast());
  for (const s of decalArt()) out.push(s); // the stickers (decals.mjs)
  for (const s of sealArt()) out.push(s); // the seals stamped on a kill (seals.mjs)
  add('part_seal', partSeal());
  add('part_shield_shape', partShieldShape());
  add('part_title', partTitle());
  add('part_paint_fx', partPaintFx());
  add('part_aura', partAura());
  add('part_trail', partTrail());
  add('part_entry', partEntry());
  add('part_victory', partVictory());
  add('part_death', partDeath());
  add('part_card', partCard());
  add('part_decal', partDecal());
  add('part_shield', partShield());
  add('part_companion', partCompanion());
  add('part_sound', partSound());
  add('part_graze', partGraze());
  add('part_hud_color', partHudColor());
  add('part_life_icon', partLifeIcon());
  add('part_bomb_look', partBombLook());
  return out;
}
