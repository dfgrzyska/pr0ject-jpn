// Random encounter 5 (ex5): the hikikomori's room, which is the boss. Drawn as separate parts so each can move:
// - the occupant, its back to us in a gaming chair in front of the desk, a blanket over its head, cat-ear headphones;
//   it glances back over its shoulder, turns round glaring when hit, reaches out for its towers, hides when the bell rings;
// - (its arms are part of it: elbows going as it types, one out to a tower, a can, both up for a good pull);
// - the old CRT monitor (the weak point), its screen a separate glowing layer: a face, chat scrolling, a frozen
//   "LAG", a gacha roulette, the intercom's camera when someone rings, a blue error screen, static;
// - the desk: a mechanical keyboard, a mouse, energy drinks, a mug of pens, sticky notes, a little mascot figure,
//   cables, a subwoofer and a bag underneath; the PC tower with its fans and RGB going round; a second screen on an
//   arm playing a pixel game;
// - two towers that can be shot down: the manga (series in runs of numbered volumes, a boxed figure on top) and the
//   noodle cups (a pyramid with chopsticks left in, delivery boxes and a pizza box behind); each wobbles and comes
//   down into a heap;
// - what it throws: manga volumes, noodle cups, a toppling stack, gacha capsules; steam.
// No brands anywhere: plain bands on the cups, plain-coloured spines with abstract title blocks, plain tape.
import { HiSprite, tones, speckle, mottle } from '../../lib/hisprite.mjs';
import { Raster, rng, mix, fbm } from '../../lib/raster.mjs';

const RAMPS = {
  k: tones([0x14121a, 0x26242e, 0x44424e]), // dark plastic, holes
  q: tones([0x2a2a5a, 0x40448a, 0x6a74c0]), // the blanket, navy
  Q: tones([0x5a3a6a, 0x8a5a9a, 0xc08ad0]), // its lining, lilac
  o: tones([0x5a3a22, 0x8a6038, 0xc0905a]), // the desk, wood
  m: tones([0x8a8470, 0xc8c2a8, 0xf0ead0]), // old beige plastic
  w: tones([0x9a948a, 0xe8e4dc, 0xffffff]), // paper white
  b: tones([0x6a4a24, 0xa87a44, 0xd8aa70]), // cardboard
  s: tones([0x4a4a54, 0x8a8c96, 0xd0d2da]), // grey metal, keys
  h: tones([0x2a1a1a, 0x4a3030, 0x6a4a44]), // hair, dark
  f: tones([0xb07a5a, 0xe8b894, 0xffe0c8]), // skin
  r: tones([0x7a1a1a, 0xd03a2a, 0xff8a6a]),
  g: tones([0x1a5a2a, 0x3a9a4a, 0x8ad88a]),
  u: tones([0x1a2a6a, 0x3a5ac0, 0x8aa8f0]),
  y: tones([0x8a6a10, 0xe0b830, 0xfff0a0]),
  p: tones([0x7a2a5a, 0xd05a9a, 0xffa8d0]),
  c: tones([0x1a5a6a, 0x3aa8b8, 0x9af0f0]),
  n: tones([0x3a2a1a, 0xd08a2a, 0xffd07a]), // orange
};
const SERIES = ['r', 'g', 'u', 'y', 'p', 'c', 'n', 'w', 'k', 'Q'];
const INK = 0x14121a;

// ---------------------------------------------------------------- a tiny pixel font for the screens (3 x 5)
const FONT = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
  G: '011100101101011', I: '111010010010111', L: '100100100100111', N: '101111111101101', H: '101101111101101', V: '101101101101010', T: '111010010010010', K: '101101110101101', M: '101111111101101', Y: '101101010010010', O: '010101101101010',
  P: '110101110100100', R: '110101110101101', S: '011100010001110', W: '101101111111101', '!': '010010010000010',
  '?': '110001010000010', '.': '000000000000010', ':': '000010000010000', '(': '001010010010001', ')': '100010010010100',
  0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
};
function text(r, x, y, str, c, px = 2, a = 1) {
  for (const ch of str) {
    const g = FONT[ch];
    if (g) for (let i = 0; i < 15; i++) if (g[i] === '1') for (let j = 0; j < px; j++) for (let k = 0; k < px; k++) r.set(x + (i % 3) * px + k, y + Math.floor(i / 3) * px + j, c, a);
    x += 4 * px;
  }
}

// ---------------------------------------------------------------- the screens (124 x 94, glowing)
const SW = 124;
const SH = 94;
function screen(bg0, bg1, draw) {
  const r = new Raster(SW, SH);
  for (let y = 0; y < SH; y++)
    for (let x = 0; x < SW; x++) {
      // a curved tube: darker at the corners, scanlines
      const ex = (x - SW / 2) / (SW / 2);
      const ey = (y - SH / 2) / (SH / 2);
      const v = Math.max(0, 1 - (ex * ex * ey * ey) * 1.6 - (ex ** 4 + ey ** 4) * 0.25);
      if (ex ** 6 + ey ** 6 > 1.05) continue;
      r.set(x, y, mix(bg0, bg1, v * (y % 3 === 0 ? 0.82 : 1)));
    }
  draw?.(r);
  return r;
}
const block = (r, gx, gy, c, n = 6) => {
  for (let y = 0; y < n - 1; y++) for (let x = 0; x < n - 1; x++) r.set(gx + x, gy + y, c);
};
function faceScreen(kind) {
  const red = kind === 'angry';
  return screen(red ? 0x2a0408 : 0x041a3a, red ? 0x6a0a14 : 0x0a3a6a, (r) => {
    const c = red ? 0xff5a4a : 0x8ae8ff;
    const at = (gx, gy) => block(r, 26 + gx * 6, 16 + gy * 6, c);
    if (kind === 'idle') for (const [x, y] of [[0, 3], [1, 2], [2, 3], [9, 3], [10, 2], [11, 3], [4, 7], [5, 8], [6, 8], [7, 7]]) at(x, y);
    if (kind === 'blink') for (const [x, y] of [[0, 3], [1, 3], [2, 3], [9, 3], [10, 3], [11, 3], [4, 7], [5, 8], [6, 8], [7, 7]]) at(x, y);
    if (kind === 'angry') {
      for (const [x, y] of [[0, 1], [1, 2], [2, 3], [1, 4], [0, 5], [11, 1], [10, 2], [9, 3], [10, 4], [11, 5], [4, 8], [5, 8], [6, 8], [7, 8]]) at(x, y);
      text(r, 92, 8, '!!', 0xffd0a0, 2);
    }
    if (kind === 'what') {
      for (const [x, y] of [[1, 2], [1, 3], [10, 2], [10, 3], [5, 7], [6, 7], [5, 8], [6, 8]]) at(x, y);
      text(r, 92, 8, '?', 0xffffff, 3);
    }
  });
}
function chatScreen(f) {
  const rand = rng(40);
  const rows = [];
  for (let i = 0; i < 14; i++) rows.push({ col: [0xff8ab0, 0x8affb0, 0xffe07a, 0x8ab8ff, 0xd0a0ff][Math.floor(rand() * 5)], len: 20 + Math.floor(rand() * 60), w: rand() < 0.25 });
  return screen(0x0a1020, 0x18243a, (r) => {
    for (let x = 6; x < SW - 6; x++) r.set(x, 10, 0x3a4a6a);
    text(r, 8, 3, 'LIVE', 0xff5a5a, 1);
    for (let i = 0; i < 7; i++) {
      const row = rows[(i + f * 2) % rows.length];
      const y = 16 + i * 10 - ((f * 3) % 10) + 6;
      if (y < 13 || y > SH - 8) continue;
      for (let yy = 0; yy < 5; yy++) for (let xx = 0; xx < 5; xx++) r.set(8 + xx, y + yy, row.col);
      for (let x = 16; x < 16 + 14; x++) for (let yy = 1; yy < 4; yy++) r.set(x, y + yy, row.col, 0.9);
      for (let x = 32; x < 32 + row.len; x++) if (x % 7) for (let yy = 1; yy < 4; yy++) r.set(x, y + yy, 0xd8e0f0, 0.75);
      if (row.w) text(r, 34 + row.len, y, 'WWW', 0x9affd0, 1);
    }
  });
}
function lagScreen(f) {
  return screen(0x10141c, 0x2a3040, (r) => {
    // the picture froze mid-chat: grey bars, a spinner going round
    for (let i = 0; i < 6; i++) for (let x = 14; x < 100 - i * 9; x++) if (x % 6) for (let yy = 0; yy < 3; yy++) r.set(x, 14 + i * 9 + yy, 0x5a6070);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      const on = (k + f * 2) % 8;
      const c = mix(0x404858, 0xffffff, on < 3 ? 1 - on / 3 : 0);
      for (let yy = -2; yy <= 2; yy++) for (let xx = -2; xx <= 2; xx++) if (xx * xx + yy * yy <= 5) r.set(62 + Math.cos(a) * 14 + xx, 46 + Math.sin(a) * 14 + yy, c);
    }
    text(r, 40, 70, 'LAG...', 0xffe07a, 3);
  });
}
const SYMS = ['cap_r', 'cap_u', 'cap_g', 'star', 'cat'];
function sym(r, cx, cy, s, a = 1) {
  const col = { cap_r: 0xff5a4a, cap_u: 0x5a8aff, cap_g: 0x5ad06a, star: 0xffd84a, cat: 0xffffff }[s];
  if (s.startsWith('cap')) {
    // a capsule toy: a clear dome on top (the toy inside showing), the coloured half below
    for (let y = -8; y <= 8; y++) for (let x = -8; x <= 8; x++) if (x * x + y * y <= 64) r.set(cx + x, cy + y, y < 0 ? mix(col, 0xffffff, 0.75) : col, y < 0 ? a * 0.55 : a);
    for (let y = -6; y <= -1; y++) for (let x = -3; x <= 3; x++) if (x * x + (y + 3) ** 2 < 10) r.set(cx + x, cy + y, 0xffe0a0, a);
    for (let x = -8; x <= 8; x++) r.set(cx + x, cy, mix(col, 0xffffff, 0.4), a);
  } else if (s === 'star') {
    for (let y = -9; y <= 9; y++)
      for (let x = -9; x <= 9; x++) {
        const ang = Math.atan2(y, x);
        const rr = Math.hypot(x, y);
        if (rr < 4 + 5 * Math.abs(Math.cos(ang * 2.5 + Math.PI / 2)) ** 2) r.set(cx + x, cy + y, col, a);
      }
  } else {
    for (let y = -6; y <= 7; y++) for (let x = -8; x <= 8; x++) if ((x / 8) ** 2 + (y / 7) ** 2 <= 1) r.set(cx + x, cy + y, col, a);
    for (const sx of [-1, 1]) for (let k = 0; k < 6; k++) for (let w = 0; w < 6 - k; w++) r.set(cx + sx * (4 + w * 0.5), cy - 5 - k, col, a);
    for (const sx of [-1, 1]) r.set(cx + sx * 3, cy, INK, a), r.set(cx + sx * 3, cy + 1, INK, a);
  }
}
function reelScreen(f, result) {
  return screen(0x2a0a3a, 0x5a1a6a, (r) => {
    // the gacha machine: three reels in a gold frame; spinning (blurred), or stopped on a pull
    for (let x = 8; x < SW - 8; x++) for (const y of [18, 19, 72, 73]) r.set(x, y, 0xe0b840);
    for (let k = 0; k < 3; k++) {
      const x0 = 14 + k * 34;
      for (let y = 20; y < 72; y++) for (let x = x0; x < x0 + 28; x++) r.set(x, y, mix(0x10061a, 0x2a1a3a, 1 - Math.abs(y - 46) / 26));
      if (result) sym(r, x0 + 14, 46, result === 'ssr' ? 'star' : result === 'r' ? ['cat', 'cap_u', 'cat'][k] : ['cap_r', 'cap_g', 'cap_u'][k]);
      else for (let j = -1; j <= 1; j++) {
        const y = 46 + j * 22 + ((f * 9 + k * 7) % 22);
        if (y > 26 && y < 66) sym(r, x0 + 14, y, SYMS[(f + k * 2 + j + 5) % SYMS.length], 0.55);
      }
    }
    if (result === 'ssr') {
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        for (let d = 30; d < 70; d += 1) if (k % 2 === 0) r.set(62 + Math.cos(a) * d, 46 + Math.sin(a) * d * 0.7, 0xffe880, 0.18);
      }
      text(r, 44, 78, 'SSR!', 0xffe060, 3);
    } else if (result === 'r') text(r, 56, 78, 'R', 0x9ab8ff, 3);
    else if (result) {
      // N, five pixels wide (the 3 x 5 font has no room for its diagonal)
      const g = ['10001', '11001', '10101', '10011', '10001'];
      for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) if (g[j][i] === '1') for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) r.set(55 + i * 3 + b, 78 + j * 3 + a, 0xd0d0d8);
    }
    else text(r, 34, 4, 'GACHA', 0xffe07a, 2);
  });
}
function doorScreen(f) {
  // the intercom's camera: a greenish view of the front door, someone in a cap holding a parcel
  return screen(0x0a1a0e, 0x3a5a3a, (r) => {
    const g = (v) => mix(0x0a1a0e, 0xb8e8b0, v);
    for (let y = 8; y < 86; y++) for (let x = 30; x < 94; x++) if (x < 34 || x > 90 || y < 12) r.set(x, y, g(0.25));
    for (let y = 30; y < 86; y++) for (let x = 46; x < 78; x++) {
      const head = (x - 62) ** 2 / 64 + (y - 38) ** 2 / 81 < 1;
      const cap = y < 34 && y > 26 && Math.abs(x - 62) < 11;
      const body = y > 46 && Math.abs(x - 62) < 14 + (y - 46) * 0.2;
      if (cap) r.set(x, y, g(0.5));
      else if (head) r.set(x, y, g(0.62));
      else if (body) r.set(x, y, g(0.42));
    }
    for (let y = 56; y < 74; y++) for (let x = 50; x < 76; x++) r.set(x, y, g(0.78)); // the parcel
    for (let x = 50; x < 76; x++) r.set(x, 64, g(0.5));
    if (f) for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) if (x * x + y * y < 10) r.set(104 + x, 10 + y, 0xff3a3a);
    text(r, 8, 6, 'REC', 0xd0f0c8, 1);
    for (let y = 0; y < SH; y += 2) for (let x = 0; x < SW; x++) if (r.alpha(x, y)) r.set(x, y, 0x000000, 0.15);
  });
}
function bsodScreen() {
  return screen(0x0a2a8a, 0x1a4ac0, (r) => {
    text(r, 14, 12, ':(', 0xffffff, 4);
    for (let i = 0; i < 5; i++) for (let x = 14; x < 100 - i * 11; x++) if (x % 5) r.set(x, 44 + i * 7, 0xd8e4ff), r.set(x, 45 + i * 7, 0xd8e4ff);
  });
}
function staticScreen(f) {
  const rand = rng(90 + f);
  return screen(0x101014, 0x404048, (r) => {
    for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) if (r.alpha(x, y) && rand() < 0.5) r.set(x, y, mix(0x202024, 0xd0d0d8, rand()));
    for (let x = 0; x < SW; x++) r.set(x, (f * 37) % SH, 0xffffff, 0.5);
  });
}

// ---------------------------------------------------------------- the monitor (168 x 150): a chunky old CRT
export function monitor(cracked) {
  const s = new HiSprite(168, 150, RAMPS);
  // the tube's bulk behind, the stand, the bezel
  s.poly([[30, 6], [138, 6], [150, 122], [18, 122]], 'm', { flat: 0.42 });
  s.paint([4, 2, 164, 128], (x, y) => x > 6 && x < 162 && y > 4 && y < 126, 'm', (x, y) => 0.7 - (x - 6) / 520 - (y - 4) / 700, { pat: speckle({ amt: 0.03 }) });
  s.paint([60, 126, 108, 146], (x, y) => Math.abs(x - 84) < 18 + (y - 126) * 0.7, 'm', () => 0.45);
  s.paint([18, 14, 150, 116], () => true, 'k', () => 0.25); // the recess round the glass
  s.paint([20, 16, 148, 114], () => true, 'k', () => 0.1);
  // the chin: a power button, a green lamp, two little knobs, a vent
  s.ellipse(140, 120, 4, 3, 'm', { flat: 0.35 });
  s.dot(128, 120, 1.6, 0x6aff6a);
  for (const x of [30, 40]) s.ellipse(x, 120, 2.6, 2.6, 's', { flat: 0.5 });
  for (let k = 0; k < 9; k++) s.line(56 + k * 6, 119, 56 + k * 6, 123, 0x8a8470, 1);
  // a sticky note on the bezel corner, a strip of tape
  s.poly([[146, 20], [164, 18], [166, 36], [148, 38]], 'y', { flat: 0.75 });
  s.line(150, 26, 160, 25, 0x8a6a10, 1);
  s.line(150, 30, 158, 29, 0x8a6a10, 1);
  if (cracked) {
    for (const [x0, y0, x1, y1] of [[8, 40, 20, 52], [20, 52, 14, 66], [150, 90, 160, 100], [160, 100, 156, 112]]) s.line(x0, y0, x1, y1, 0x4a4438, 1);
    s.paint([4, 2, 164, 128], (x, y) => x > 6 && x < 162 && y > 4 && y < 126 && fbm(x, y, { seed: 77, scale: 12 }) > 0.66, 'm', () => 0.3);
  }
  return s.render({ outline: 2 });
}

// ---------------------------------------------------------------- the occupant (240 x 200), seen from behind
// It sits in a gaming chair in front of the desk, its back to us, a blanket over its head and shoulders, cat-ear
// headphones over the blanket. mood: 'b0'/'b1' breathing, 't0'/'t1' typing (the elbows going), 'look' (a glance
// back at us over the left shoulder), 'glare' (hit: it turns round, furious), 'jump' (hit hard: up out of the seat,
// eyes wide), 'drink', 'cheer' (an SSR: both arms up), 'sigh' (a common pull: slumped), 'reachL'/'reachR' (an arm
// out to a tower), 'throw' (an arm up), 'hide0'/'hide1' (the blanket pulled right over, trembling)
function buildOccupant(mood) {
  const s = new HiSprite(240, 200, RAMPS);
  const cx = 120 + (mood === 'hide1' ? 2 : 0);
  const up = mood === 'b1' ? -2 : mood === 'jump' ? -12 : mood === 'cheer' ? -4 : mood === 'sigh' ? 6 : 0;
  const hide = mood.startsWith('hide');
  const top = hide ? 60 : 22 + up;
  // the blanket: over the head (a hood from behind), down over the shoulders and the chair's back; little stars
  const shoulder = hide ? 70 : 64;
  s.paint([0, top, 240, 200], (x, y) => {
    const head = (x - cx) ** 2 / (34 * 34) + (y - top - 30) ** 2 / (32 * 32) < 1;
    const body = y > top + 40 && Math.abs(x - cx) < shoulder + (y - top - 40) * 0.25 - (y > 176 ? (y - 176) * 1.2 : 0);
    const neck = y > top + 30 && y <= top + 44 && Math.abs(x - cx) < 34 + (y - top - 30) * 2.2;
    return head || body || neck;
  }, 'q', (x, y) => 0.6 - (x - cx) / 320 - (y - top) / 700, { pat: mottle({ amt: 0.1 }) });
  // folds down the back
  for (const [x0, y0, x1, y1] of [[cx - 30, top + 60, cx - 40, 196], [cx + 8, top + 56, cx + 14, 196], [cx + 44, top + 64, cx + 56, 196]]) s.shade([0, 0, 240, 200], (x, y) => Math.abs((x - x0) * (y1 - y0) - (y - y0) * (x1 - x0)) / Math.hypot(x1 - x0, y1 - y0) < 2.5 && y > y0 && y < y1, -0.16);
  const rand = rng(12);
  for (let k = 0; k < 24; k++) {
    const x = cx - 80 + rand() * 160;
    const y = top + 6 + rand() * (190 - top);
    for (let a = 0; a < 5; a++) {
      const ang = (a / 5) * Math.PI * 2 - Math.PI / 2;
      const ex = x + Math.cos(ang) * 3;
      const ey = y + Math.sin(ang) * 3;
      if (s.mat[Math.floor(ey) * 240 + Math.floor(ex)] === 'q' && s.mat[Math.floor(y) * 240 + Math.floor(x)] === 'q') s.line(x, y, ex, ey, 0xffe08a, 1, 0.8);
    }
  }
  // the tuft of hair sticking up out of the blanket
  s.tube(cx + 2, top + 2, cx + 8, top - 18, 2.4, 'h', { rb: 1 });
  s.tube(cx + 8, top - 18, cx + 17, top - 13, 1.6, 'h', { rb: 0.8 });
  // the chair's backrest, in front of it (we look at its back): black, coloured stripes, a headrest cushion; the
  // blanket hangs down either side of it
  const cb = top + 50;
  s.paint([66, cb - 14, 174, 200], (x, y) => Math.abs(x - 120) < 46 + (y - cb) * 0.06 && (y > cb || (x - 120) ** 2 / (46 * 46) + (y - cb) ** 2 / (14 * 14) < 1), 'k', (x) => 0.46 - (x - 66) / 420, { pat: speckle({ amt: 0.04 }) });
  for (const sx of [-1, 1]) s.paint([66, cb - 10, 174, 200], (x, y) => Math.abs(x - 120 - sx * 28) < 4 && y > cb - 8 && Math.abs(x - 120) < 46 + (y - cb) * 0.06, 'p', () => 0.62);
  s.ellipse(120, cb + 2, 22, 9, 'k', { bias: 0.1 }); // the headrest cushion
  s.paint([100, cb + 40, 140, cb + 56], (x, y) => (x - 120) ** 2 / 400 + (y - cb - 48) ** 2 / 64 < 1, 'p', () => 0.7); // a badge
  if (hide) {
    for (const sx of [-1, 1]) s.dot(cx + sx * 34, top + 30, 4, 0xff7ac8, 0.35);
    return s;
  }
  // the headphones over the blanket: the band across the top, cat ears on it, the glowing cups at the sides
  s.paint([cx - 46, top - 6, cx + 46, top + 24], (x, y) => Math.abs(Math.hypot(x - cx, (y - top - 30) * 1.15) - 36) < 3.5 && y < top + 22, 's', () => 0.5);
  const turned = mood === 'look' || mood === 'glare' || mood === 'jump';
  for (const sx of [-1, 1]) {
    s.poly([[cx + sx * 16, top + 4], [cx + sx * 30, top - 14], [cx + sx * 34, top + 6]], 's', { flat: 0.55 });
    s.poly([[cx + sx * 20, top + 4], [cx + sx * 29, top - 6], [cx + sx * 31, top + 4]], 'p', { flat: 0.85, glow: true });
    const ox = turned && sx < 0 ? 4 : 0;
    s.ellipse(cx + sx * 36 + ox, top + 32, 9, 13, 's', { bias: 0.05 });
    s.ellipse(cx + sx * 38 + ox, top + 32, 4, 8, 'p', { flat: 0.9, glow: true });
  }
  // the face, when it looks back over its left shoulder: the hood's edge turned, a cheek, a lens, an eye
  if (turned) {
    const fx = cx - 22;
    const fy = top + 34;
    s.paint([fx - 18, fy - 22, fx + 14, fy + 20], (x, y) => (x - fx) ** 2 / (16 * 16) + (y - fy) ** 2 / (20 * 20) < 1, 'Q', () => 0.6);
    s.paint([fx - 16, fy - 18, fx + 12, fy + 18], (x, y) => (x - fx + 2) ** 2 / (13 * 13) + (y - fy) ** 2 / (17 * 17) < 1, 'k', () => 0.12);
    s.paint([fx - 16, fy - 14, fx + 8, fy + 16], (x, y) => (x - fx + 4) ** 2 / (10 * 10) + (y - fy - 2) ** 2 / (14 * 14) < 1, 'f', () => 0.35);
    s.paint([fx - 16, fy - 16, fx + 8, fy - 4], (x, y) => (x - fx + 4) ** 2 / (11 * 11) + (y - fy + 8) ** 2 / (8 * 8) < 1 && y < fy - 6 + Math.abs(Math.sin(x * 0.5)) * 3, 'h', () => 0.45);
    const ex = fx - 6;
    const ey = fy + 1;
    for (let a = 0; a < Math.PI * 2; a += 0.06) s.px(ex + Math.cos(a) * 7, ey + Math.sin(a) * 6, 0x2a2a32);
    s.paint([ex - 6, ey - 5, ex + 6, ey + 5], (x, y) => (x - ex) ** 2 / 36 + (y - ey) ** 2 / 25 < 1, 'c', () => 0.55, { glow: true });
    if (mood === 'glare') {
      s.dot(ex - 1, ey + 1, 2.2, 0xff4a3a);
      s.line(ex - 7, ey - 7, ex + 5, ey - 4, INK, 2);
    } else if (mood === 'jump') {
      s.dot(ex - 1, ey + 1, 2.6, 0xffffff);
      s.dot(ex - 1, ey + 1, 1, INK);
    } else {
      s.dot(ex - 2, ey + 1, 1.8, INK);
      s.dot(ex - 2.6, ey + 0.4, 0.6, 0xffffff);
    }
    s.line(ex - 5, ey - 3, ex - 2, ey - 5, 0xe8ffff, 1, 0.8);
    if (mood === 'jump') s.ellipse(fx - 4, fy + 12, 2, 2.4, 'k', { flat: 0.2 });
  }
  // the arms: elbows going at the keyboard, or out of the blanket to a tower, up to throw, a can, both up
  const sleeve = (x0, y0, x1, y1, hand = true) => {
    s.tube(x0, y0, x1, y1, 12, 'q', { rb: 9 });
    if (hand) s.ellipse(x1, y1, 7.5, 6.5, 'f', { bias: 0.08 });
  };
  if (mood === 't0' || mood === 't1') for (const sx of [-1, 1]) s.ellipse(cx + sx * (64 + ((mood === 't0') === sx < 0 ? 3 : 0)), top + 78 + ((mood === 't0') === sx < 0 ? -3 : 0), 12, 16, 'q', { bias: 0.05 });
  if (mood === 'reachL') sleeve(cx - 54, top + 70, cx - 116, top + 54);
  if (mood === 'reachR') sleeve(cx + 54, top + 70, cx + 116, top + 54);
  if (mood === 'throw') sleeve(cx + 52, top + 70, cx + 76, top - 4);
  if (mood === 'drink') {
    sleeve(cx + 50, top + 72, cx + 36, top + 22);
    s.tube(cx + 34, top + 30, cx + 40, top + 8, 6, 'g');
    s.paint([cx + 31, top + 14, cx + 43, top + 20], () => true, 'w', () => 0.8);
  }
  if (mood === 'cheer') for (const sx of [-1, 1]) sleeve(cx + sx * 50, top + 70, cx + sx * 74, top - 16);
  return s;
}
export function occupant(mood) {
  return buildOccupant(mood).render({ outline: 2 });
}
/** Only what glows of it (headphones, glasses): over the dark of night, untinted. */
export function occupantGlow(mood) {
  const s = buildOccupant(mood);
  const full = s.render({ outline: 0 });
  const r = new Raster(s.w, s.h);
  for (let y = 0; y < s.h; y++)
    for (let x = 0; x < s.w; x++) {
      if (!s.glow[y * s.w + x]) continue;
      const i = full.idx(x, y);
      r.set(x, y, (full.data[i] << 16) | (full.data[i + 1] << 8) | full.data[i + 2]);
    }
  return r;
}

// ---------------------------------------------------------------- its sleeves on the keyboard (240 x 60)
// 0/1 typing, 2 a hand up, 3/4 reaching out to the left / right tower
export function hands(f) {
  const s = new HiSprite(240, 60, RAMPS);
  for (const sx of [-1, 1]) {
    let hx = 120 + sx * 26;
    let hy = 40;
    if ((f === 0 && sx < 0) || (f === 1 && sx > 0)) hy -= 4;
    if (f === 2 && sx > 0) hy -= 22;
    if ((f === 3 && sx < 0) || (f === 4 && sx > 0)) {
      hx = 120 + sx * 106;
      hy = 22;
    }
    s.tube(120 + sx * 58, 6, hx, hy - 6, 11, 'q', { rb: 9 });
    s.ellipse(hx, hy, 8, 6, 'f', { bias: 0.08 });
    for (let k = -1; k <= 1; k++) s.ellipse(hx + k * 4.5, hy + 5, 2.2, 3, 'f', { bias: 0.1 });
  }
  return s.render({ outline: 2 });
}

// ---------------------------------------------------------------- the desk (420 x 150)
export function desk() {
  const s = new HiSprite(420, 150, RAMPS);
  const rand = rng(21);
  // underneath first: the dark under the desk, a subwoofer, a backpack, cables in a tangle
  s.paint([14, 30, 406, 150], () => true, 'k', (x, y) => 0.12 + (y - 30) / 900);
  s.paint([296, 86, 352, 148], () => true, 'k', () => 0.35);
  s.ellipse(324, 118, 18, 18, 's', { flat: 0.3 });
  s.ellipse(324, 118, 8, 8, 'k', { flat: 0.2 });
  s.ellipse(80, 126, 30, 24, 'g', { bias: 0.05, pat: speckle({ amt: 0.05 }) });
  s.tube(64, 108, 96, 106, 3, 'k');
  for (let k = 0; k < 7; k++) {
    let x = 150 + rand() * 120;
    let y = 40;
    const c = [0x1a1a20, 0x30303a, 0xd0d0d0, 0x2a2a6a][k % 4];
    for (let j = 0; j < 60; j++) {
      x += Math.sin(j * 0.3 + k) * 2;
      y += 1.6;
      s.px(x, y, c);
      s.px(x + 1, y, c);
    }
  }
  // the legs and the drawer unit (left), a drawer pulled half out, papers sticking out of it
  s.paint([14, 30, 30, 150], () => true, 'o', () => 0.4);
  s.paint([390, 30, 406, 150], () => true, 'o', () => 0.36);
  s.paint([30, 30, 120, 150], () => true, 'o', (x) => 0.52 - (x - 30) / 400, { pat: speckle({ amt: 0.04 }) });
  for (const y of [60, 96, 130]) {
    s.line(32, y, 118, y, 0x3a2414, 1);
    s.paint([66, y - 18, 84, y - 14], () => true, 's', () => 0.6);
  }
  s.paint([32, 62, 124, 90], () => true, 'o', () => 0.6);
  s.poly([[50, 62], [96, 60], [94, 66], [52, 68]], 'w', { flat: 0.8 });
  // the top: a thick slab of wood, its front edge
  s.paint([0, 0, 420, 34], () => true, 'o', (x, y) => (y < 24 ? 0.66 - x / 1600 : 0.4), { pat: speckle({ amt: 0.05 }), tex: 0.06 });
  for (let x = 0; x < 420; x += 1) s.px(x, 24, 0x3a2414, 0.6);
  // on it, left to right: a mug of pens, energy cans (one crushed), a mascot figure, sticky notes, the keyboard,
  // the mouse on its mat, a phone face down, crumbs
  s.tube(28, 2, 28, 20, 10, 'w', { rb: 10 });
  s.paint([18, 0, 38, 4], () => true, 'k', () => 0.2);
  for (const [dx, c] of [[-5, 'r'], [0, 'u'], [5, 'y'], [2, 'k']]) s.tube(28 + dx, 2, 28 + dx * 1.6, -12, 1.4, c);
  for (const [x, c, crushed] of [[56, 'g', 0], [72, 'p', 0], [88, 'c', 1]]) {
    if (crushed) s.poly([[x - 6, 20], [x + 8, 18], [x + 9, 8], [x - 2, 4], [x - 7, 10]], c, { flat: 0.55 });
    else s.tube(x, 0, x, 20, 6, c);
    if (!crushed) s.paint([x - 6, 6, x + 6, 10], () => true, 'w', () => 0.8);
  }
  // the mascot: a round little thing with a star on its head (no one's character)
  s.ellipse(114, 10, 9, 8, 'y', { bias: 0.08 });
  s.dot(110, 9, 1.3, INK);
  s.dot(118, 9, 1.3, INK);
  s.line(112, 13, 116, 13, 0x8a3a1a, 1);
  for (let a = 0; a < 5; a++) s.line(114, -2, 114 + Math.cos(a * 1.257 - 1.57) * 5, 2 + Math.sin(a * 1.257 - 1.57) * 5, 0xff7a4a, 2);
  s.paint([106, 18, 122, 22], () => true, 'k', () => 0.3);
  for (const [x, y, c] of [[134, 14, 'y'], [142, 16, 'p'], [150, 13, 'c']]) s.poly([[x, y], [x + 10, y - 1], [x + 11, y + 8], [x + 1, y + 9]], c, { flat: 0.8 });
  // the keyboard: a mechanical one, keys in rows, a few bright keycaps
  s.paint([166, 4, 286, 24], () => true, 'k', () => 0.3);
  const caps = { 3: 'r', 17: 'y', 30: 'c', 41: 'p' };
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 14; c++) {
      const x = 169 + c * 8.3 + (r % 2) * 2;
      const y = 6 + r * 4.4;
      s.paint([x, y, x + 6.5, y + 3.4], () => true, caps[r * 14 + c] ?? 's', () => 0.55);
    }
  s.paint([300, 4, 352, 26], () => true, 'u', () => 0.3);
  s.ellipse(326, 14, 7, 9, 'k', { bias: 0.1 });
  s.dot(326, 10, 1.4, 0xff4a8a);
  s.tube(326, 5, 318, -6, 0.9, 'k');
  s.paint([366, 6, 394, 20], () => true, 'k', () => 0.35);
  for (let k = 0; k < 9; k++) s.px(200 + rand() * 200, 16 + rand() * 8, 0xe8c070);
  return s.render({ outline: 2 });
}

// ---------------------------------------------------------------- the PC tower (72 x 150): glass side, fans, RGB going round
export function pc(f, hot = false) {
  const s = new HiSprite(72, 150, RAMPS);
  s.paint([2, 2, 70, 148], () => true, 'k', (x) => 0.35 - x / 400);
  s.paint([8, 10, 62, 138], () => true, 'k', () => 0.08);
  const hue = (k) => {
    const h = ((k + f) % 6) / 6;
    const c = hot ? [0xff2a1a, 0xff5a2a, 0xff8a3a, 0xff3a2a, 0xd01a1a, 0xff6a4a] : [0xff3a6a, 0xffa83a, 0xf0f03a, 0x3aff8a, 0x3aa8ff, 0xb03aff];
    return c[Math.floor(h * 6) % 6];
  };
  // fans: rings of colour, blades (turning a step a frame)
  for (const [k, cy] of [[0, 34], [2, 72], [4, 110]]) {
    for (let a = 0; a < Math.PI * 2; a += 0.04) s.px(35 + Math.cos(a) * 18, cy + Math.sin(a) * 18, hue(k + Math.floor((a / (Math.PI * 2)) * 6)));
    for (let a = 0; a < Math.PI * 2; a += 0.04) s.px(35 + Math.cos(a) * 17, cy + Math.sin(a) * 17, hue(k + Math.floor((a / (Math.PI * 2)) * 6)), 0.6);
    for (let b = 0; b < 7; b++) {
      const a = (b / 7) * Math.PI * 2 + f * 0.45;
      s.line(35 + Math.cos(a) * 4, cy + Math.sin(a) * 4, 35 + Math.cos(a + 0.5) * 15, cy + Math.sin(a + 0.5) * 15, 0x3a3a46, 2);
    }
    s.dot(35, cy, 4, 0x24242c);
  }
  // the strip down the front edge, and a power button
  for (let y = 10; y < 138; y++) s.px(64, y, hue(Math.floor(y / 22)), 1), s.px(65, y, hue(Math.floor(y / 22)), 0.6);
  s.dot(36, 144, 2, hue(1));
  return s.render({ outline: 2 });
}

// ---------------------------------------------------------------- the second screen on its arm (96 x 96): a pixel game running
export function second(f, paused = false) {
  const s = new HiSprite(96, 96, RAMPS);
  s.tube(48, 70, 48, 94, 3, 's');
  s.paint([30, 88, 66, 95], () => true, 's', () => 0.4);
  s.paint([2, 4, 94, 68], () => true, 'k', () => 0.3);
  const r = new Raster(84, 56);
  for (let y = 0; y < 56; y++) for (let x = 0; x < 84; x++) r.set(x, y, mix(0x5ab8ff, 0xc8f0ff, y / 56));
  // hills scrolling, a little hero jumping over a block
  for (let x = 0; x < 84; x++) {
    const h = 40 + Math.sin((x + f * 6) * 0.08) * 5;
    for (let y = Math.floor(h); y < 46; y++) r.set(x, y, 0x3aa84a);
    for (let y = 46; y < 56; y++) r.set(x, y, mix(0x6a4a2a, 0x8a6a3a, ((x * 7 + y * 13 + f * 6) % 11) / 11));
  }
  // (an invented hero: a round white blob with a teal scarf, hopping over grey rocks)
  for (let y = 0; y < 7; y++) for (let x = 0; x < 9; x++) if ((x - 4) ** 2 / 20 + (y - 4) ** 2 / 12 < 1) r.set(56 - f * 6 + x, 39 + y, y < 3 ? 0xb0b0b8 : 0x80808a);
  const jy = [0, -10, -4][f];
  for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) if ((x - 4) ** 2 + (y - 4) ** 2 < 18) r.set(21 + x, 37 + jy + y, y === 5 ? 0x2ad0c0 : 0xffffff);
  r.set(26, 39 + jy, 0x14121a);
  r.set(24, 39 + jy, 0x14121a);
  for (let y = 0; y < 56; y++) for (let x = 0; x < 84; x++) {
    const i = r.idx(x, y);
    s.px(6 + x, 8 + y, (r.data[i] << 16) | (r.data[i + 1] << 8) | r.data[i + 2]);
    s.glow[(8 + y) * 96 + 6 + x] = 1;
  }
  if (paused) {
    for (let y = 8; y < 64; y++) for (let x = 6; x < 90; x++) s.px(x, y, 0x000000, 0.45);
    for (const x0 of [38, 52]) for (let y = 24; y < 48; y++) for (let x = x0; x < x0 + 7; x++) s.px(x, y, 0xffffff);
  }
  return s.render({ outline: 2 });
}

// ---------------------------------------------------------------- the towers (150 x 260); 0 upright, 1 swaying; 'heap' brought down
/** A volume lying in a stack, spine out: its series colour, a white title block of glyph ticks, its number. */
function vol(s, x, y, w, h, mat, n, lean = 0) {
  s.poly([[x, y], [x + w, y + lean], [x + w, y + h + lean], [x, y + h]], mat, { flat: 0.6 });
  s.paint([x + 4, y + 1.5, x + w * 0.55, y + h - 1.5], () => true, 'w', () => 0.82);
  for (let k = 0; k < 4; k++) s.px(x + 6 + k * 3.5, y + h / 2, INK, 0.75);
  for (let k = 0; k < Math.min(4, n); k++) s.px(x + w - 5 - k * 2.2, y + h / 2 + lean, 0xffffff, 0.9);
  s.px(x + w * 0.7, y + 2, 0xffffff, 0.6);
}
export function mangaTower(f) {
  const heap = f === 'heap';
  const s = new HiSprite(150, 260, RAMPS);
  const rand = rng(31);
  if (heap) {
    for (let i = 0; i < 46; i++) vol(s, 4 + rand() * 106, 196 + rand() * 54, 34, 8, SERIES[Math.floor(rand() * SERIES.length)], 1 + Math.floor(rand() * 4), Math.floor(rand() * 15) - 7);
    s.poly([[70, 220], [104, 212], [110, 240], [74, 248]], 'p', { flat: 0.6 });
    return s.render({ outline: 2 });
  }
  const sway = f === 1 ? 1 : 0;
  for (const [x0, top] of [[4, 70], [52, 30], [100, 92]]) {
    let y = 256;
    let ser = Math.floor(rand() * SERIES.length);
    let n = 1;
    let left = 3 + Math.floor(rand() * 5);
    while (y > top) {
      const h = 8 + Math.floor(rand() * 2);
      const w = 40 + Math.floor(rand() * 4);
      const t = (256 - y) / 226;
      vol(s, x0 + Math.floor(rand() * 3) - 1 + sway * t * 6 * (x0 === 52 ? -1 : 1), y - h, w, h, SERIES[ser], n++, 0);
      y -= h + 0.6;
      if (--left === 0) {
        ser = (ser + 1 + Math.floor(rand() * 3)) % SERIES.length;
        n = 1;
        left = 3 + Math.floor(rand() * 6);
      }
    }
  }
  // a boxed figure on the tallest column, a desk lamp on the shortest
  const bx = 56 + sway * 6;
  s.paint([bx, 0, bx + 34, 30], () => true, 'u', (x) => 0.6 - (x - bx) / 120);
  s.paint([bx + 4, 4, bx + 30, 26], () => true, 'c', () => 0.85, { glow: true });
  s.ellipse(bx + 17, 12, 5, 5, 'f', { bias: 0.1 });
  s.paint([bx + 12, 16, bx + 22, 26], () => true, 'p', () => 0.6);
  s.tube(124, 90, 124, 70, 2, 's');
  s.tube(124, 70, 136, 56, 2, 's');
  s.poly([[128, 50], [146, 50], [140, 62], [132, 62]], 'y', { flat: 0.7 });
  return s.render({ outline: 2 });
}
/** A noodle cup: a tapered tub, a coloured band, a peeled-back lid, chopsticks left in some. */
function cup(s, cx, by, h, band, lid, sticks) {
  const top = 11;
  const bot = 8;
  s.poly([[cx - top, by - h], [cx + top, by - h], [cx + bot, by], [cx - bot, by]], 'w', { flat: 0.62 });
  s.shade([cx - top, by - h, cx + top, by], (x) => x > cx + 3, -0.16);
  s.paint([cx - top, by - h * 0.64, cx + top, by - h * 0.4], (x, y) => Math.abs(x - cx) < top - ((y - (by - h)) / h) * (top - bot), band, () => 0.6);
  for (let k = -1; k <= 1; k++) s.px(cx + k * 4, by - h * 0.52, 0xffffff, 0.8);
  s.paint([cx - top, by - h - 2, cx + top, by - h + 1], () => true, 'w', () => 0.45);
  if (lid) s.poly([[cx - top, by - h], [cx + top - 5, by - h - 7], [cx + top, by - h - 4], [cx - top + 2, by - h + 1]], 'm', { flat: 0.75 });
  if (sticks) for (const dx of [0, 3]) s.tube(cx + dx, by - h - 1, cx + dx + 8, by - h - 20, 1, 'o');
}
function box(s, x, y, w, h, arrows) {
  s.paint([x, y, x + w, y + h], () => true, 'b', (px, py) => 0.62 - (px - x) / (w * 3) - (py - y) / (h * 6), { pat: speckle({ amt: 0.05 }) });
  s.paint([x + w / 2 - 3, y, x + w / 2 + 3, y + h], () => true, 'm', () => 0.72);
  if (arrows) for (const dx of [8, 16]) s.line(x + dx, y + 12, x + dx, y + 4, 0x3a2414, 1), s.line(x + dx - 2, y + 6, x + dx, y + 4, 0x3a2414, 1), s.line(x + dx + 2, y + 6, x + dx, y + 4, 0x3a2414, 1);
}
export function cupTower(f) {
  const heap = f === 'heap';
  const s = new HiSprite(150, 260, RAMPS);
  const rand = rng(41);
  const bands = ['r', 'n', 'y', 'g', 'u', 'p'];
  if (heap) {
    box(s, 70, 200, 60, 40, true);
    for (let i = 0; i < 16; i++) cup(s, 10 + rand() * 130, 210 + rand() * 46, 22, bands[i % 6], i % 2, 0);
    return s.render({ outline: 2 });
  }
  const sway = f === 1 ? 1 : 0;
  // behind: boxes stacked, a pizza box on top
  box(s, 66, 44, 74, 56, true);
  box(s, 76, 4, 60, 42, false);
  s.paint([60, 100, 146, 112], () => true, 'w', () => 0.7);
  s.paint([64, 102, 142, 106], () => true, 'r', () => 0.45);
  // the pyramid of cups, row on row (narrower up top), leaning when it sways
  for (let row = 0; row < 6; row++) {
    const n = 5 - Math.floor(row * 0.75);
    for (let i = 0; i < n; i++) {
      const cx = 18 + row * 11 + i * 24 + sway * row * 2.5;
      cup(s, cx, 256 - row * 27, 26, bands[(row * 3 + i) % 6], (row + i) % 3 === 0, (row + i * 2) % 5 === 1);
    }
  }
  return s.render({ outline: 2 });
}

// ---------------------------------------------------------------- what it throws
export function manga(f) {
  const s = new HiSprite(36, 36, RAMPS);
  if (f === 1) {
    s.paint([15, 3, 21, 33], () => true, 'w', () => 0.7);
    s.paint([15, 3, 17, 33], () => true, 'p', () => 0.55);
  } else if (f === 3) {
    s.poly([[18, 9], [2, 4], [3, 29], [18, 32]], 'w', { flat: 0.82 });
    s.poly([[18, 9], [34, 4], [33, 29], [18, 32]], 'w', { flat: 0.62 });
    for (let k = 0; k < 3; k++) for (const sx of [-1, 1]) s.paint([18 + sx * 3 - (sx < 0 ? 12 : 0), 9 + k * 7, 18 + sx * 3 + (sx > 0 ? 12 : 0), 14 + k * 7], () => true, 'k', () => 0.5);
  } else {
    s.paint([7, 3, 29, 33], () => true, f === 0 ? 'p' : 'u', (x) => 0.72 - (x - 7) / 60);
    s.paint([7, 3, 10, 33], () => true, 'w', () => 0.75);
    if (f === 0) {
      s.ellipse(19, 15, 6, 7, 'f', { flat: 0.8 });
      s.paint([12, 6, 26, 12], () => true, 'h', () => 0.5);
      s.dot(17, 15, 1.3, INK);
      s.dot(21.5, 15, 1.3, INK);
      s.paint([12, 26, 26, 30], () => true, 'w', () => 0.85);
    }
  }
  return s.render({ outline: 2 });
}
export function noodle(f) {
  const s = new HiSprite(36, 36, RAMPS);
  if (f === 0) cup(s, 18, 31, 24, 'r', 1, 1);
  else {
    s.poly([[4, 10], [28, 12], [28, 26], [4, 28]], 'w', { flat: 0.62 });
    s.paint([12, 10, 18, 28], () => true, 'r', () => 0.55);
    s.ellipse(30, 19, 3.5, 7, 'y', { flat: 0.6 });
    for (const [x, y] of [[33, 12], [34, 24], [31, 30]]) s.dot(x, y, 1.4, 0xf0c060);
  }
  return s.render({ outline: 2 });
}
export function stack() {
  const s = new HiSprite(48, 132, RAMPS);
  const rand = rng(11);
  let n = 1;
  for (let y = 2; y < 128; y += 9) vol(s, 3 + Math.floor(rand() * 3), y, 40, 8, SERIES[Math.floor(y / 36) % SERIES.length], n++);
  return s.render({ outline: 2 });
}
export function gacha(col) {
  const s = new HiSprite(27, 27, RAMPS);
  // the coloured half below, a clear dome above with the little toy inside
  s.ellipse(13.5, 13.5, 11, 11, col, { bias: 0.1, ...(col === 'y' ? { glow: true } : {}) });
  s.paint([2, 2, 25, 13], (x, y) => (x - 13.5) ** 2 + (y - 13.5) ** 2 < 121, 'w', (x, y) => 0.9 - (x - 2) / 50);
  s.ellipse(13.5, 9.5, 4, 3.5, col === 'y' ? 'p' : 'y', { flat: 0.6 });
  s.line(3, 13.5, 24, 13.5, 0xd8d8e0, 1);
  s.dot(8, 6, 1.8, 0xffffff);
  if (col === 'y') for (const [x, y] of [[3, 3], [24, 5], [22, 24]]) s.dot(x, y, 1, 0xffffff);
  return s.render({ outline: 2 });
}
/** A puff of steam (3 sizes). */
export function steam(k) {
  const r = new Raster(18, 18);
  const R = 3 + k * 2.4;
  for (let y = 0; y < 18; y++)
    for (let x = 0; x < 18; x++) {
      const n = fbm(x, y, { seed: 50 + k, scale: 3 });
      const d = Math.hypot(x - 9, y - 9) / R + (n - 0.5) * 0.5;
      if (d < 1) r.set(x, y, 0xf0f4ff, 0.5 * (1 - d));
    }
  return r;
}


// ---------------------------------------------------------------- the little extras
export function glint() {
  const r = new Raster(21, 21);
  for (let k = -10; k <= 10; k++) {
    const a = 1 - Math.abs(k) / 11;
    r.set(10 + k, 10, 0xffffff, a);
    r.set(10, 10 + k, 0xffffff, a);
    if (Math.abs(k) < 5) r.set(10 + k, 10 + k, 0xe8ffff, a * 0.6), r.set(10 + k, 10 - k, 0xe8ffff, a * 0.6);
  }
  return r;
}
export function sweat() {
  const s = new HiSprite(14, 20, RAMPS);
  s.paint([1, 1, 13, 19], (x, y) => (y > 8 ? (x - 7) ** 2 + (y - 12) ** 2 < 30 : Math.abs(x - 7) < (y - 1) * 0.7), 'c', (x, y) => 0.8 - x / 30, { glow: true });
  s.dot(5, 11, 1.4, 0xffffff);
  return s.render({ outline: 1 });
}
export function deskCan(c) {
  const s = new HiSprite(20, 32, RAMPS);
  s.tube(10, 4, 10, 28, 7, c);
  s.paint([3, 12, 17, 18], () => true, 'w', () => 0.8);
  s.paint([4, 1, 16, 4], () => true, 's', () => 0.6);
  return s.render({ outline: 2 });
}
/** The hamster in its tank: idle (breathing), running its wheel, hidden in its house. */
export function pet(f) {
  const s = new HiSprite(66, 48, RAMPS);
  s.paint([2, 6, 64, 46], () => true, 'c', () => 0.7, { glow: true });
  s.paint([4, 34, 62, 44], () => true, 'b', () => 0.65, { pat: speckle({ amt: 0.2 }) }); // the bedding
  s.paint([2, 2, 64, 8], () => true, 's', () => 0.5);
  // its wheel, its house
  for (let a = 0; a < Math.PI * 2; a += 0.05) s.px(46 + Math.cos(a) * 11, 26 + Math.sin(a) * 11, 0xd0d2da);
  const spin = f === 'run0' ? 0 : 0.4;
  for (let k = 0; k < 6; k++) s.line(46, 26, 46 + Math.cos(k + spin) * 11, 26 + Math.sin(k + spin) * 11, 0xa8aab4, 1, 0.8);
  s.poly([[6, 36], [26, 36], [26, 22], [16, 14], [6, 22]], 'o', { flat: 0.6 });
  s.ellipse(16, 30, 4, 5, 'k', { flat: 0.2 });
  const ham = (x, y, run) => {
    s.ellipse(x, y, 7, 6, 'n', { bias: 0.1 });
    s.ellipse(x - 2, y + 2, 4, 3, 'w', { flat: 0.85 });
    s.dot(x - 4, y - 2, 1, INK);
    for (const ex of [-3, 3]) s.ellipse(x + ex, y - 6, 2, 2, 'p', { flat: 0.7 });
    if (run) s.line(x - 6, y + 6, x + 6, y + 6, 0xffffff, 1, 0.6);
  };
  if (f === 'hide') s.ellipse(16, 34, 5, 3, 'n', { flat: 0.6 }); // only its rump sticking out
  else if (f.startsWith('run')) ham(46, 30, true);
  else ham(36, f === 'idle1' ? 31 : 32, false);
  return s.render({ outline: 2 });
}
export function page(f) {
  const s = new HiSprite(18, 16, RAMPS);
  if (f) s.poly([[2, 6], [16, 2], [15, 10], [3, 14]], 'w', { flat: 0.85 });
  else s.poly([[3, 2], [15, 3], [14, 14], [2, 13]], 'w', { flat: 0.75 });
  for (let k = 0; k < 3; k++) s.line(5, 5 + k * 3, 12, 5 + k * 3, 0x5a5a66, 1, 0.7);
  return s.render({ outline: 1 });
}
export function stain() {
  const r = new Raster(60, 36);
  for (let y = 0; y < 36; y++)
    for (let x = 0; x < 60; x++) {
      const n = fbm(x, y, { seed: 61, scale: 6 });
      const d = ((x - 30) / 28) ** 2 + ((y - 18) / 16) ** 2 + (n - 0.5) * 0.5;
      if (d < 1) r.set(x, y, mix(0xc87a2a, 0xe8b060, 1 - d), 0.65);
    }
  for (const [x, y] of [[20, 12], [26, 20], [38, 16]]) r.set(x, y, 0xf0e0a0); // bits of noodle
  return r;
}
export function chatTag(str) {
  const w = str.length * 4 * 2 + 4;
  const r = new Raster(w, 14);
  for (let y = 0; y < 14; y++) for (let x = 0; x < w; x++) r.set(x, y, 0x101828, 0.75);
  text(r, 3, 2, str, 0xe8f4ff, 2);
  return r;
}
export function capHalf(col, top) {
  const s = new HiSprite(27, 15, RAMPS);
  if (top) s.paint([2, 2, 25, 14], (x, y) => (x - 13.5) ** 2 + (y - 14) ** 2 < 121, 'w', (x) => 0.9 - x / 50);
  else s.paint([2, 0, 25, 12], (x, y) => (x - 13.5) ** 2 + y ** 2 < 121, col, (x, y) => 0.7 - y / 40, col === 'y' ? { glow: true } : {});
  return s.render({ outline: 1 });
}
export function capToy(k) {
  const s = new HiSprite(14, 14, RAMPS);
  const c = ['y', 'p', 'c', 'n'][k];
  s.ellipse(7, 8, 5, 5, c, { bias: 0.1 });
  for (const sx of [-1, 1]) s.ellipse(7 + sx * 3, 3, 2, 2, c, { flat: 0.6 });
  s.dot(5.5, 8, 0.8, INK);
  s.dot(8.5, 8, 0.8, INK);
  return s.render({ outline: 1 });
}
export function confetti(k) {
  const r = new Raster(6, 9);
  const c = [0xffe060, 0xff6a9a, 0x6ad0ff, 0x8aff8a][k];
  for (let y = 0; y < 9; y++) for (let x = 0; x < 6; x++) r.set(x, y, c);
  return r;
}
export function volBit(k) {
  const s = new HiSprite(30, 14, RAMPS);
  s.paint([2, 2, 28, 12], () => true, SERIES[k * 2], () => 0.6);
  s.paint([6, 4, 16, 10], () => true, 'w', () => 0.82);
  return s.render({ outline: 1 });
}
/** Under the front door: a sliver of the hall's light, two feet's shadows in it. */
export function doorFeet() {
  const r = new Raster(180, 30);
  for (let y = 0; y < 30; y++) for (let x = 0; x < 180; x++) r.set(x, y, 0xfff0c0, (0.25 + (y / 30) * 0.6) * (1 - (Math.abs(x - 90) / 95) ** 2));
  for (const fx of [70, 104]) for (let y = 14; y < 30; y++) for (let x = fx - 9; x < fx + 9; x++) if (((x - fx) / 10) ** 2 + ((y - 22) / 10) ** 2 < 1) r.set(x, y, 0x14101a, 0.85);
  return r;
}
export function flyer() {
  const s = new HiSprite(30, 40, RAMPS);
  s.paint([2, 2, 28, 38], () => true, 'w', () => 0.8);
  s.paint([4, 4, 26, 16], () => true, 'r', () => 0.6);
  for (let k = 0; k < 4; k++) s.line(5, 22 + k * 4, 24, 22 + k * 4, 0x6a6a74, 1);
  return s.render({ outline: 1 });
}
function battScreen() {
  return screen(0x041a3a, 0x0a3a6a, (r) => {
    for (let y = 22; y < 72; y++) for (let x = 14; x < 110; x++) r.set(x, y, y < 32 ? 0x3a6ad0 : 0xd8dce8);
    text(r, 18, 24, 'BLAD', 0xffffff, 1);
    text(r, 22, 42, 'BATERIA?', 0x14121a, 2);
    for (let y = 58; y < 68; y++) for (let x = 46; x < 78; x++) r.set(x, y, 0x8a8c96);
    text(r, 54, 60, 'OK', 0xffffff, 1);
  });
}
function offScreen(k) {
  return screen(0x050506, 0x0a0a0c, (r) => {
    const R = [6, 3, 1][k];
    for (let y = -R * 2; y <= R * 2; y++) for (let x = -R * 3; x <= R * 3; x++) if ((x / (R * 3)) ** 2 + (y / (R * 2)) ** 2 < 1) r.set(62 + x, 47 + y, 0xffffff, 1 - Math.hypot(x / (R * 3), y / (R * 2)));
  });
}

export function heyaEnemies(add) {
  add('heya_mon', monitor(false));
  add('heya_mon_crack', monitor(true));
  const MOODS = ['b0', 'b1', 't0', 't1', 'look', 'glare', 'jump', 'drink', 'cheer', 'sigh', 'reachL', 'reachR', 'throw'];
  for (const m of [...MOODS, 'hide0', 'hide1']) add(`heya_who_${m}`, occupant(m));
  for (const m of MOODS) add(`heya_wglow_${m}`, occupantGlow(m));
  for (let f = 0; f < 6; f++) add(`heya_pc_hot_${f}`, pc(f, true));
  add('heya_second_pause', second(0, true));
  add('heya_glint', glint());
  add('heya_sweat', sweat());
  for (const c of ['g', 'p', 'c', 'y', 'r']) add(`heya_can_${c}`, deskCan(c));
  for (const f of ['idle0', 'idle1', 'run0', 'run1', 'hide']) add(`heya_pet_${f}`, pet(f));
  add('heya_page_0', page(0));
  add('heya_page_1', page(1));
  add('heya_stain', stain());
  for (const [k, t] of [['lol', 'LOL'], ['gg', 'GG'], ['q', '???'], ['smile', ':)'], ['w', 'WWW']]) add(`heya_chat_${k}`, chatTag(t));
  add('cap_top', capHalf('w', true));
  for (const c of ['r', 'u', 'g', 'y']) add(`cap_bot_${c}`, capHalf(c, false));
  for (let k = 0; k < 4; k++) add(`cap_toy_${k}`, capToy(k));
  for (let k = 0; k < 4; k++) add(`heya_confetti_${k}`, confetti(k));
  for (let k = 0; k < 4; k++) add(`heya_vol_${k}`, volBit(k));
  add('heya_feet', doorFeet());
  add('heya_flyer', flyer());
  add('scr_batt', battScreen());
  for (let k = 0; k < 3; k++) add(`scr_off_${k}`, offScreen(k));
  add('heya_desk', desk());
  for (let f = 0; f < 6; f++) add(`heya_pc_${f}`, pc(f));
  for (let f = 0; f < 3; f++) add(`heya_second_${f}`, second(f));
  add('heya_tl_0', mangaTower(0));
  add('heya_tl_1', mangaTower(1));
  add('heya_tl_heap', mangaTower('heap'));
  add('heya_tr_0', cupTower(0));
  add('heya_tr_1', cupTower(1));
  add('heya_tr_heap', cupTower('heap'));
  // the screens
  add('scr_idle', faceScreen('idle'));
  add('scr_blink', faceScreen('blink'));
  add('scr_angry', faceScreen('angry'));
  add('scr_what', faceScreen('what'));
  for (let f = 0; f < 3; f++) add(`scr_chat_${f}`, chatScreen(f));
  for (let f = 0; f < 2; f++) add(`scr_lag_${f}`, lagScreen(f));
  for (let f = 0; f < 3; f++) add(`scr_reel_${f}`, reelScreen(f, null));
  add('scr_res_n', reelScreen(0, 'n'));
  add('scr_res_r', reelScreen(0, 'r'));
  add('scr_res_ssr', reelScreen(0, 'ssr'));
  for (let f = 0; f < 2; f++) add(`scr_door_${f}`, doorScreen(f));
  add('scr_bsod', bsodScreen());
  for (let f = 0; f < 2; f++) add(`scr_static_${f}`, staticScreen(f));
  // what it throws
  for (let f = 0; f < 4; f++) add(`manga_${f}`, manga(f));
  add('noodle_0', noodle(0));
  add('noodle_1', noodle(1));
  add('manga_stack', stack());
  add('gacha_r', gacha('r'));
  add('gacha_u', gacha('u'));
  add('gacha_g', gacha('g'));
  add('gacha_gold', gacha('y'));
  for (let k = 0; k < 3; k++) add(`heya_steam_${k}`, steam(k));
}
