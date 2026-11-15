// Random encounter 2 (ex2): the kei car. Seen from above and a little from the front, nose down the screen (it drives
// at the player): the tall box of a Japanese kei wagon, as narrow as the class allows, a stubby bonnet, a flat high
// roof in contrasting cream over pastel mint paint, black plastic bumpers, little wheels at the very corners, round
// chrome-ringed headlamps for eyes, a smiling grille, door mirrors, and the yellow number plate of the kei class
// (blank: no numbers, no maker). Tuned up for phase 2 the bōsōzoku way: bamboo-spear exhaust pipes rearing up off the
// back, a tall wing, a jutting chin spoiler, flames, a purple glow under it. Unfolded for phase 3 into a cab-over kei
// truck, white, its flatbed piled with watermelons and cabbages. The rush hour's other kei cars, a traffic cone, a
// watermelon, its skid marks.
import { HiSprite, tones, speckle } from '../../lib/hisprite.mjs';

const INK = 0x14101c;
const RAMPS = {
  m: tones([0x3a8a78, 0x8ad8c0, 0xe0fff0]), // mint paint
  c: tones([0x9a9282, 0xece6d6, 0xfffcf4]), // the cream roof
  w: tones([0x6a6a74, 0xc8c8d0, 0xffffff]), // white paint, chrome
  g: [0x08101c, 0x142236, 0x26405c, 0x5a86ac, 0xb8dcf4], // glass, the sky in it
  k: tones([0x101014, 0x26262c, 0x4a4a52]), // tyres, black plastic
  s: tones([0x5a5a64, 0xa8aab4, 0xf4f6ff]), // hubcaps, chrome
  y: tones([0x9a7a10, 0xf0c830, 0xfff6a8]), // the yellow plate, lamps
  o: tones([0x8a3a08, 0xf08020, 0xffc070]), // indicators, cones, flames
  r: tones([0x7a1418, 0xd02a26, 0xff7a5e]), // red
  b: tones([0x1a2a6a, 0x3a5ad0, 0x9ab8ff]), // blue
  p: tones([0x5a1a7a, 0xb04ae8, 0xf0b8ff]), // the purple of the tuned car's glow
  n: tones([0x2a5a14, 0x4a9a2a, 0xa8e070]), // watermelon rind, cabbage
  t: tones([0x3a2a20, 0x6a5040, 0x9a8070]), // the flatbed's boards
  e: tones([0x6a2a2a, 0xe8604a, 0xffb8a0]), // watermelon flesh
};

/** A rounded box, lit from the top left: (x0, y0) to (x1, y1), corner radius r. */
function box(s, x0, y0, x1, y1, r, mat, light, opts = {}) {
  s.paint([x0, y0, x1, y1], (x, y) => {
    const dx = Math.max(x0 + r - x, 0, x - (x1 - r));
    const dy = Math.max(y0 + r - y, 0, y - (y1 - r));
    return dx * dx + dy * dy < r * r;
  }, mat, light ?? ((x, y) => 0.62 - (x - (x0 + x1) / 2) / ((x1 - x0) * 2.2) - (y - y0) / ((y1 - y0) * 8)), opts);
}

/** A small wheel seen at the car's corner (the tread lines turn between frames). */
function wheel(s, x, y, f, h = 13) {
  s.paint([x - 6, y - h, x + 6, y + h], (px, py) => Math.abs(px - x) < 5 && Math.abs(py - y) < h - 1, 'k', (px) => 0.4 - Math.abs(px - x) / 20);
  for (let k = -h + 2 + f * 2; k < h - 1; k += 4) for (let i = -4; i <= 4; i++) s.px(x + i, y + k, 0x050508, 0.7);
}

/** A round headlamp-eye: a chrome ring, the lamp, a pupil looking down at you, the lid (angrier: lower, slanting). */
function eye(s, ex, ey, r, sx, mood, lid) {
  s.ellipse(ex, ey, r + 1.8, r + 1.6, 's', { bias: 0.15 });
  const lamp = mood === 'angry' ? 'r' : 'y';
  s.ellipse(ex, ey, r, r * 0.92, lamp, { flat: mood === 'beam' ? 1 : 0.92, glow: true });
  if (mood === 'beam') {
    s.ellipse(ex, ey, r * 0.7, r * 0.6, 'w', { flat: 1, glow: true });
    return;
  }
  s.ellipse(ex - sx * 0.8, ey + r * 0.25, r * 0.38, r * 0.42, 'k', { flat: 0.1, glow: true });
  s.dot(ex - sx * 0.8 - r * 0.15, ey, 0.9, 0xffffff);
  // the lid: a slab of the paint over the top of the lamp, slanting down to the middle
  const tilt = mood === 'angry' ? r * 0.75 : r * 0.25;
  const top = ey - r - 2;
  s.poly([[ex - r - 2, top + (sx < 0 ? 0 : tilt)], [ex + r + 2, top + (sx < 0 ? tilt : 0)], [ex + r + 2, top + r * 0.55 + (sx < 0 ? tilt : 0)], [ex - r - 2, top + r * 0.55 + (sx < 0 ? 0 : tilt)]], lid, { flat: 0.42 });
}

// ---------------------------------------------------------------- the kei car (34 x 56 -> 102 x 168)
// look: { mood: 'calm' | 'angry' | 'beam', f: wheel frame, hazard, tuned, glow }
export function keicar(look = {}) {
  const { mood = 'calm', f = 0, hazard = false, tuned = false, glow = 0 } = look;
  const s = new HiSprite(102, 168, RAMPS);
  const X0 = 17;
  const X1 = 85;
  const CX = 51;
  const Y0 = 16; // its back
  const Y1 = 156; // the front of its bumper
  if (tuned) {
    // the purple glow under it, spilling out round its edges
    s.paint([X0 - 8, Y0 - 4, X1 + 8, Y1 + 8], (x, y) => x > X0 - 7 && x < X1 + 7 && y > Y0 && y < Y1 + 6, 'p', (x, y) => 0.5 + glow * 0.2 - Math.min(x - X0 + 7, X1 + 7 - x, y - Y0, Y1 + 6 - y) / 40, { glow: true });
  }
  // the wheels, right at the corners
  for (const [x, y] of [[X0 - 1, 40], [X1 + 1, 40], [X0 - 1, 128], [X1 + 1, 128]]) wheel(s, x, y, f);
  // the body: the tall box in mint, its waist line, the door lines (a slide door at the back)
  box(s, X0, Y0, X1, Y1, 9, 'm', null, { pat: speckle({ amt: 0.025 }) });
  for (let y = Y0 + 10; y < Y1 - 10; y++) {
    s.px(X0 + 3, y, 0xffffff, 0.35);
    s.px(X1 - 3, y, 0x1a3a30, 0.45);
  }
  for (const yy of [62, 98]) for (const x of [X0 + 1, X0 + 2, X1 - 2, X1 - 1]) for (let k = 0; k < 2; k++) s.px(x, yy + k, 0x2a5a4a);
  // the back: bumper, the tall tail lamps on the corners, the hatch's little window
  s.paint([X0 + 2, Y0 - 3, X1 - 2, Y0 + 5], (x, y) => y >= Y0 - 2 && y <= Y0 + 4 && x > X0 + 3 && x < X1 - 3, 'k', () => 0.35);
  for (const lx of [X0 + 3, X1 - 9]) s.paint([lx, Y0 + 2, lx + 6, Y0 + 16], () => true, hazard ? 'o' : 'r', () => (hazard ? 1 : 0.55), { glow: hazard });
  s.paint([X0 + 12, Y0 + 4, X1 - 12, Y0 + 14], () => true, 'g', (x) => 0.32 + (x % 16 < 4 ? 0.3 : 0));
  // the roof: flat and high, cream, with its rails
  box(s, X0 + 6, Y0 + 16, X1 - 6, 100, 6, 'c', (x, y) => 0.8 - (x - X0) / 220 - (y - Y0) / 900);
  for (const rx of [X0 + 9, X1 - 9]) for (let y = Y0 + 20; y < 96; y++) s.px(rx, y, 0x8a8478);
  // the windscreen, steep, the sky in it, the black pillars, the wipers parked
  s.paint([X0 + 4, 98, X1 - 4, 124], (x, y) => y > 100 + Math.abs(x - CX) * 0.05 && y < 123 && x > X0 + 5 && x < X1 - 5, 'g', (x, y) => 0.32 + (Math.abs(x - y * 0.6 - 4) % 26 < 5 ? 0.45 : 0) + (y - 100) / 120);
  for (const px of [X0 + 5, X1 - 6]) for (let y = 100; y < 123; y++) for (let i = 0; i < 2; i++) s.px(px + i, y, 0x18181e);
  s.line(CX - 22, 121, CX - 4, 118, INK, 1);
  s.line(CX + 2, 121, CX + 20, 118, INK, 1);
  // the door mirrors, black, sticking out by the pillars
  for (const sx of [-1, 1]) s.paint([CX + sx * 40 - 6, 100, CX + sx * 40 + 6, 110], (x, y) => Math.abs(x - CX - sx * 40) < 5 && y > 101 && y < 109, 'k', () => 0.45);
  // the stubby bonnet, the face: headlamp eyes, the grille's grin, the black bumper with fog lamps, the yellow plate
  s.paint([X0 + 3, 124, X1 - 3, 132], (x, y) => y > 124 && y < 132 && x > X0 + 3 && x < X1 - 3, 'm', () => 0.72);
  for (const sx of [-1, 1]) eye(s, CX + sx * 20, 139, 8, sx, mood, 'm');
  s.paint([CX - 9, 135, CX + 9, 146], (x, y) => Math.abs(x - CX) < 9 - (y - 135) * 0.25 && y > 136 && y < 146, 'k', () => 0.25);
  for (let k = 0; k < 4; k++) for (let x = CX - 8 + k * 0.5; x <= CX + 8 - k * 0.5; x++) s.px(x, 137 + k * 2.5, 0xc8cad4);
  s.paint([X0, 148, X1, Y1 + 1], (x, y) => y > 148 && y <= Y1 && x > X0 + (y - 148) * 0.3 && x < X1 - (y - 148) * 0.3, 'k', () => 0.35);
  for (const sx of [-1, 1]) s.ellipse(CX + sx * 26, 152, 2.6, 2, 'y', { flat: 0.9, glow: true });
  s.paint([CX - 11, 151, CX + 11, 162], (x, y) => Math.abs(x - CX) < 10 && y > 152 && y < 162, 'y', () => 0.82);
  for (let x = CX - 10; x < CX + 10; x++) {
    s.px(x, 152, 0x2a6a2a);
    s.px(x, 161, 0x2a6a2a);
  }
  if (tuned) {
    // flames licking back over the bonnet and along the flanks, racing stripes over the roof
    for (let k = 0; k < 5; k++) {
      const fx = X0 + 6 + k * 13;
      s.poly([[fx, 132], [fx + 6, 104 - (k % 2) * 10], [fx + 12, 132]], 'o', { flat: 0.85 });
      s.poly([[fx + 3, 132], [fx + 6, 116 - (k % 2) * 6], [fx + 9, 132]], 'y', { flat: 0.95 });
    }
    for (let y = Y0 + 18; y < 98; y++) for (const sx of [-7, 3]) for (let i = 0; i < 4; i++) s.px(CX + sx + i, y, 0x2a2a3a, 0.9);
    // the wing on the back, on its two struts
    s.paint([X0 - 6, 2, X1 + 6, 10], (x, y) => y >= 3 && y <= 9 && x >= X0 - 5 && x <= X1 + 5, 'k', (x) => 0.45 - (x - X0) / 300);
    for (const sx of [X0 + 8, X1 - 8]) s.paint([sx - 2, 8, sx + 2, Y0 + 2], () => true, 'k', () => 0.3);
    // the takeyari: two chrome exhaust pipes rearing up off the back corners, flared at the tips
    for (const sx of [-1, 1]) {
      s.tube(CX + sx * 22, Y0 + 6, CX + sx * 44, 2, 2.4, 's', { rb: 2.8 });
      s.ellipse(CX + sx * 45, 2, 3.4, 2.4, 'k', { flat: 0.2 });
    }
    // the chin spoiler, jutting out ahead of the bumper
    s.paint([X0 - 4, Y1 - 2, X1 + 4, Y1 + 8], (x, y) => y > Y1 - 1 && y < Y1 + 7 && x > X0 - 3 + (y - Y1) && x < X1 + 3 - (y - Y1), 'k', () => 0.5);
    s.paint([CX - 11, 151, CX + 11, 162], (x, y) => Math.abs(x - CX) < 10 && y > 152 && y < 162, 'y', () => 0.82);
  }
  if (mood === 'beam') {
    // high beams: rays spilling forward off the lamps
    for (const sx of [-1, 1]) for (let k = 0; k < 9; k++) {
      const a = Math.PI / 2 + (k - 4) * 0.12;
      for (let d = 10; d < 22; d++) s.px(CX + sx * 20 + Math.cos(a) * d, 139 + Math.sin(a) * d, 0xfff8d0, 0.5 - d / 50);
    }
  }
  return s.render();
}

// ---------------------------------------------------------------- the kei truck (34 x 60 -> 102 x 180): a cab-over, its flatbed behind
export function keitruck(f, wf = 0) {
  const s = new HiSprite(102, 180, RAMPS);
  const X0 = 17;
  const X1 = 85;
  const CX = 51;
  for (const [x, y] of [[X0 - 1, 40], [X1 + 1, 40], [X0 - 1, 150], [X1 + 1, 150]]) wheel(s, x, y, wf);
  // the flatbed: boards, the white drop sides with their hinges, the load (one melon gone while it throws)
  s.paint([X0, 4, X1, 118], (x, y) => x > X0 && x < X1 && y > 5 && y < 117, 't', (x, y) => 0.42 + (Math.floor(y / 7) % 2 ? 0.08 : -0.04));
  for (const x of [X0, X1 - 3]) for (let y = 5; y < 117; y++) for (let i = 0; i < 4; i++) s.px(x + i, y, i === 0 ? 0x8a8a94 : 0xe8e8f0);
  for (let x = X0; x < X1; x++) for (let j = 0; j < 4; j++) s.px(x, 4 + j, j === 0 ? 0x8a8a94 : 0xe8e8f0);
  for (let i = 0; i < 12; i++) {
    if (f && (i === 4 || i === 7)) continue;
    const cx = X0 + 15 + (i % 3) * 19;
    const cy = 20 + Math.floor(i / 3) * 25;
    if (i % 5 === 2) {
      s.ellipse(cx, cy, 8, 8, 'n', { bias: 0.15 });
      for (let k = 0; k < 4; k++) s.line(cx - 5 + k * 3, cy - 6, cx - 3 + k * 3, cy + 6, 0xd8f0a0, 1, 0.5);
    } else {
      s.ellipse(cx, cy, 9, 8.5, 'n', { bias: 0.1 });
      for (let k = -2; k <= 2; k++) s.line(cx + k * 3, cy - 7.5, cx + k * 3 + Math.sin(k) * 1.5, cy + 7.5, 0x183a10, 1, 0.9);
    }
  }
  // the cab: white, a cab-over with no bonnet at all, its back window, the roof, the windscreen straight above the face
  box(s, X0, 116, X1, 176, 7, 'w', null);
  s.paint([X0 + 8, 118, X1 - 8, 125], () => true, 'g', () => 0.3);
  box(s, X0 + 4, 124, X1 - 4, 146, 5, 'w', (x) => 0.86 - (x - X0) / 220);
  s.paint([X0 + 3, 145, X1 - 3, 160], (x, y) => y > 146 && y < 159 && x > X0 + 4 && x < X1 - 4, 'g', (x, y) => 0.34 + (Math.abs(x - y * 0.6) % 26 < 5 ? 0.45 : 0));
  for (const sx of [-1, 1]) s.paint([CX + sx * 40 - 6, 146, CX + sx * 40 + 6, 156], (x, y) => Math.abs(x - CX - sx * 40) < 5 && y > 147 && y < 155, 'k', () => 0.45);
  for (const sx of [-1, 1]) eye(s, CX + sx * 22, 166, 6, sx, 'angry', 'w');
  s.paint([CX - 8, 162, CX + 8, 170], (x, y) => Math.abs(x - CX) < 7 && y > 163 && y < 170, 'k', () => 0.3);
  s.paint([X0, 172, X1, 178], (x, y) => y > 172 && y < 178 && x > X0 + 2 && x < X1 - 2, 'k', () => 0.35);
  s.paint([CX - 10, 171, CX + 10, 180], (x, y) => Math.abs(x - CX) < 9 && y > 172 && y < 179, 'y', () => 0.82);
  return s.render();
}

// ---------------------------------------------------------------- the rush hour's other kei cars (18 x 30 -> 54 x 90), nose down
export function minicar(col, kind = 0) {
  const s = new HiSprite(54, 90, RAMPS);
  for (const [x, y] of [[8, 20], [46, 20], [8, 70], [46, 70]]) wheel(s, x, y, 0, 9);
  box(s, 9, 4, 45, 84, 6, col, null);
  if (kind === 1) {
    // a little delivery van: a tall white box on the back
    box(s, 10, 4, 44, 56, 3, 'w', (x) => 0.85 - (x - 10) / 120);
    for (let y = 8; y < 54; y += 8) for (let x = 12; x < 43; x++) s.px(x, y, 0xb8b8c0);
  } else box(s, 12, 12, 42, 54, 4, 'c', (x) => 0.82 - (x - 12) / 140);
  s.paint([11, 54, 43, 68], (x, y) => x > 12 && x < 42 && y > 55 && y < 67, 'g', (x, y) => 0.35 + ((x - y) % 14 < 3 ? 0.4 : 0));
  for (const sx of [-1, 1]) {
    s.ellipse(27 + sx * 11, 75, 4.4, 4, 's', { bias: 0.15 });
    s.ellipse(27 + sx * 11, 75, 3, 2.8, 'y', { flat: 0.95, glow: true });
  }
  s.paint([9, 80, 45, 86], (x, y) => y > 80 && y < 86 && x > 10 && x < 44, 'k', () => 0.35);
  s.paint([21, 80, 33, 87], (x, y) => x > 21 && x < 33 && y > 81 && y < 87, 'y', () => 0.85);
  return s.render();
}

// ---------------------------------------------------------------- a traffic cone (11 x 15 -> 33 x 45), a watermelon, skid marks
export function cone() {
  const s = new HiSprite(33, 45, RAMPS);
  // its square black base, the cone rising from it (seen from above and in front), white reflective bands
  s.poly([[2, 36], [31, 36], [27, 44], [6, 44]], 'k', { flat: 0.35 });
  s.paint([3, 2, 30, 40], (x, y) => Math.abs(x - 16.5) < 3 + (y - 4) * 0.33 && y > 3 && y < 39, 'o', (x) => 0.85 - Math.abs(x - 13) / 26);
  for (const [y0, y1] of [[14, 18], [26, 31]]) s.paint([3, y0, 30, y1], (x, y) => Math.abs(x - 16.5) < 3 + (y - 4) * 0.33 && y > y0 && y < y1, 'w', (x) => 0.95 - Math.abs(x - 13) / 30);
  s.ellipse(16.5, 4, 3, 1.6, 'o', { flat: 0.9 });
  return s.render();
}

export function watermelon(f) {
  const s = new HiSprite(30, 30, RAMPS);
  s.ellipse(15, 15, 12, 11, 'n', { bias: 0.15 });
  for (let k = -3; k <= 3; k++) {
    const a = f * 0.6;
    s.line(15 + k * 3 * Math.cos(a) - 10 * Math.sin(a), 15 + k * 3 * Math.sin(a) + 10 * Math.cos(a), 15 + k * 3 * Math.cos(a) + 10 * Math.sin(a), 15 + k * 3 * Math.sin(a) - 10 * Math.cos(a), 0x183a10, 1, 0.85);
  }
  s.dot(10, 9, 1.6, 0xd8f0a0);
  return s.render();
}

/** A watermelon bursting (3 frames): red flesh and rind flying apart. */
export function splat(f) {
  const s = new HiSprite(48, 48, RAMPS);
  const k = [0.5, 0.85, 1][f];
  for (let n = 0; n < 7; n++) {
    const a = (n / 7) * Math.PI * 2 + 0.3;
    const d = 6 + 14 * k;
    const x = 24 + Math.cos(a) * d;
    const y = 24 + Math.sin(a) * d * 0.8;
    s.poly([[x - 5, y], [x + 5, y - 2], [x + 3, y + 4]], n % 2 ? 'e' : 'n', { flat: 0.7 });
  }
  s.ellipse(24, 24, 10 * (1.2 - k * 0.5), 8 * (1.2 - k * 0.5), 'e', { flat: 0.8 });
  for (let n = 0; n < 6; n++) s.dot(24 + Math.cos(n * 1.1) * 6 * k, 24 + Math.sin(n * 1.1) * 5 * k, 1, INK);
  return s.render({ outline: 1 });
}

export function skid() {
  const s = new HiSprite(24, 36, RAMPS);
  for (const x of [4, 20]) for (let y = 0; y < 36; y++) for (let i = -1.5; i <= 1.5; i++) s.px(x + i, y, 0x141210, 0.55 - Math.abs(i) * 0.12);
  return s.render({ outline: 0 });
}

/** A seed, black, a bullet of its own (pointing up: the game turns it along its flight). */
export function seed() {
  const s = new HiSprite(15, 15, RAMPS);
  s.paint([0, 0, 15, 15], (x, y) => ((x - 7.5) / 3.4) ** 2 + ((y - 8) / 5.2) ** 2 < 1 && y > 2.5 + Math.abs(x - 7.5) * 0.8, 'k', (x, y) => 0.5 - (x - 7.5) / 20, { glow: true });
  s.dot(6.5, 7, 0.8, 0xc8c8d0);
  return s.render({ outline: 2, outlineColor: 0xf8d0c0 });
}

export function keicarEnemies(add) {
  add('kei_0', keicar({ f: 0 }));
  add('kei_1', keicar({ f: 1, hazard: true }));
  add('kei_2', keicar({ f: 1 }));
  add('kei_angry', keicar({ mood: 'angry', f: 0 }));
  add('kei_angry_1', keicar({ mood: 'angry', f: 1 }));
  add('kei_beam', keicar({ mood: 'beam', f: 0 }));
  add('kei_tuned', keicar({ mood: 'angry', tuned: true, f: 0, glow: 0 }));
  add('kei_tuned_1', keicar({ mood: 'angry', tuned: true, f: 1, glow: 1 }));
  add('keitora_0', keitruck(0, 0));
  add('keitora_1', keitruck(1, 1));
  add('keitora_2', keitruck(0, 1));
  add('mini_r', minicar('r'));
  add('mini_b', minicar('b'));
  add('mini_w', minicar('w', 1));
  add('mini_y', minicar('y'));
  add('cone', cone());
  for (let f = 0; f < 4; f++) add(`suika_${f}`, watermelon(f));
  for (let f = 0; f < 3; f++) add(`suika_splat_${f}`, splat(f));
  add('jb_seed', seed());
  add('skid', skid());
}
