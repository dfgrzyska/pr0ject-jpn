// Random encounter 2 (ex2): the kei car. Seen from above and a little from the front, nose down the screen (it drives
// at the player): the tall box of a Japanese kei wagon, as narrow as the class allows, a stubby bonnet, a flat high
// roof in contrasting cream over pastel mint paint, black plastic bumpers, little wheels at the very corners, round
// chrome-ringed headlamps for eyes, a smiling grille, door mirrors, and the yellow number plate of the kei class
// (blank: no numbers, no maker). Tuned up for phase 2 the bōsōzoku way: bamboo-spear exhaust pipes rearing up off the
// back, a tall wing, a jutting chin spoiler, flames, a purple glow under it. Unfolded for phase 3 into a cab-over kei
// truck, white, its flatbed piled with watermelons and cabbages. The rush hour's other kei cars, a traffic cone, a
// watermelon, its skid marks.
import { HiSprite, tones, speckle } from '../../lib/hisprite.mjs';
import { mix, Raster } from '../../lib/raster.mjs';

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
  e: tones([0x6a2a2a, 0xe8604a, 0xffb8a0]), // watermelon flesh (and a pink car)
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
/** A watermelon from above: deep green, the dark stripes curving over it from stem to tip, a sheen. */
function melon(s, cx, cy, r) {
  s.ellipse(cx, cy, r, r * 0.92, 'n', { bias: 0.15 });
  for (let k = -3; k <= 3; k++) for (let t = -1; t <= 1; t += 0.05) {
    const x = cx + k * r * 0.26 * Math.sqrt(1 - t * t) + Math.sin(t * 3 + k) * 0.8;
    const y = cy + t * r * 0.88;
    if (((x - cx) / r) ** 2 + ((y - cy) / (r * 0.92)) ** 2 < 0.92) s.px(x, y, 0x123010, 0.9);
  }
  s.ellipse(cx - r * 0.35, cy - r * 0.35, r * 0.3, r * 0.18, 'n', { flat: 0.98 });
  s.dot(cx, cy - r * 0.86, 1, 0x6a5020);
}

/** A cabbage from above: pale leaves folded round a tight heart, their veins. */
function cabbage(s, cx, cy, r) {
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    s.ellipse(cx + Math.cos(a) * r * 0.45, cy + Math.sin(a) * r * 0.42, r * 0.6, r * 0.55, 'n', { bias: 0.2 });
  }
  s.ellipse(cx, cy, r * 0.55, r * 0.5, 'n', { flat: 0.95 });
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + 0.3;
    s.line(cx + Math.cos(a) * r * 0.3, cy + Math.sin(a) * r * 0.3, cx + Math.cos(a) * r * 0.95, cy + Math.sin(a) * r * 0.9, 0xe8f8c0, 1, 0.6);
  }
}

export function keitruck(f, wf = 0) {
  const s = new HiSprite(102, 180, RAMPS);
  const X0 = 17;
  const X1 = 85;
  const CX = 51;
  for (const [x, y] of [[X0 - 1, 36], [X1 + 1, 36], [X0 - 1, 150], [X1 + 1, 150]]) wheel(s, x, y, wf);
  // the flatbed: the boards, the white drop sides and tailgate with their hinges and stake pockets
  s.paint([X0, 4, X1, 120], (x, y) => x > X0 && x < X1 && y > 5 && y < 119, 't', (x, y) => 0.4 + (Math.floor(y / 6) % 2 ? 0.08 : -0.04) - (x - X0) / 400);
  for (const x of [X0, X1 - 4]) for (let y = 5; y < 119; y++) for (let i = 0; i < 5; i++) s.px(x + i, y, i === 0 || i === 4 ? 0x8a8a94 : mix(0xffffff, 0xc8c8d0, i / 4));
  for (let x = X0; x < X1; x++) for (let j = 0; j < 5; j++) s.px(x, 3 + j, j === 0 || j === 4 ? 0x8a8a94 : 0xf0f0f4);
  for (const yy of [30, 62, 94]) for (const x of [X0, X1 - 4]) for (let j = 0; j < 4; j++) for (let i = 0; i < 5; i++) s.px(x + i, yy + j, 0x6a6a74);
  for (const xx of [X0 + 18, X1 - 22]) for (let j = 0; j < 3; j++) for (let i = 0; i < 6; i++) s.px(xx + i, 2 + j, 0x6a6a74); // the tailgate's hinges
  // the load: watermelons, cabbages, a straw rope over it all (one melon gone while it throws)
  const load = [[32, 24, 'm', 10], [52, 22, 'c', 8], [71, 26, 'm', 10], [36, 47, 'c', 8], [57, 46, 'm', 11], [74, 52, 'c', 7], [30, 72, 'm', 10], [52, 72, 'm', 11], [72, 78, 'c', 8], [38, 98, 'c', 8], [60, 98, 'm', 10]];
  load.forEach(([x, y, k, r], i) => {
    if (f && (i === 4 || i === 7)) return;
    if (k === 'm') melon(s, x, y, r);
    else cabbage(s, x, y, r);
  });
  for (const yy of [36, 86]) for (let x = X0 + 4; x < X1 - 4; x++) s.px(x, yy + Math.sin(x * 0.4) * 1.2, 0xd8b870, 0.9);
  // the cab: white, a cab-over with no bonnet at all, its back window, the roof with a visor over the windscreen
  box(s, X0, 118, X1, 176, 7, 'w', null);
  s.paint([X0 + 8, 120, X1 - 8, 127], (x, y) => y > 120 && y < 127, 'g', (x) => 0.3 + (x % 14 < 3 ? 0.3 : 0));
  box(s, X0 + 4, 126, X1 - 4, 146, 5, 'w', (x) => 0.88 - (x - X0) / 220);
  for (let x = X0 + 6; x < X1 - 6; x++) for (let j = 0; j < 3; j++) s.px(x, 144 + j, j === 0 ? 0x8a8a94 : 0x3a3a44); // the visor's shadow
  s.paint([X0 + 3, 146, X1 - 3, 161], (x, y) => y > 147 && y < 160 && x > X0 + 4 && x < X1 - 4, 'g', (x, y) => 0.34 + (Math.abs(x - y * 0.6) % 26 < 5 ? 0.45 : 0) + (y - 147) / 80);
  for (const px of [X0 + 4, X1 - 6]) for (let y = 147; y < 160; y++) for (let i = 0; i < 2; i++) s.px(px + i, y, 0x18181e);
  s.line(CX - 20, 158, CX - 4, 155, INK, 1);
  s.line(CX + 2, 158, CX + 18, 155, INK, 1);
  // the mirrors out on their stalks, the face: square-ish lamp eyes, the grille, the bumper, the plate
  for (const sx of [-1, 1]) {
    s.line(CX + sx * 34, 150, CX + sx * 42, 148, 0x26262c, 2);
    s.paint([CX + sx * 44 - 4, 142, CX + sx * 44 + 4, 154], (x, y) => Math.abs(x - CX - sx * 44) < 3.5 && y > 143 && y < 153, 'k', () => 0.45);
  }
  for (const sx of [-1, 1]) eye(s, CX + sx * 22, 166, 6.4, sx, 'angry', 'w');
  s.paint([CX - 9, 162, CX + 9, 171], (x, y) => Math.abs(x - CX) < 8 && y > 163 && y < 171, 'k', () => 0.25);
  for (let k = 0; k < 3; k++) for (let x = CX - 7; x <= CX + 7; x++) s.px(x, 164 + k * 2.5, 0xc8cad4);
  s.paint([X0, 172, X1, 179], (x, y) => y > 172 && y < 179 && x > X0 + 2 + (y - 172) * 0.3 && x < X1 - 2 - (y - 172) * 0.3, 's', () => 0.6);
  s.paint([CX - 10, 171, CX + 10, 180], (x, y) => Math.abs(x - CX) < 9 && y > 172 && y < 180, 'y', () => 0.82);
  for (let x = CX - 9; x < CX + 9; x++) {
    s.px(x, 172, 0x2a6a2a);
    s.px(x, 179, 0x2a6a2a);
  }
  return s.render();
}

// ---------------------------------------------------------------- the rush hour's other kei cars (18 x 30 -> 54 x 90), nose down
// kind: 'wagon' (the tall box, a two-tone roof), 'sedan' (a rounder little car, a longer bonnet), 'van' (a white
// delivery van, windows down its sides), 'truck' (a little kei truck, crates on the back)
export function minicar(col, kind = 'wagon') {
  const s = new HiSprite(54, 90, RAMPS);
  const X0 = 10;
  const X1 = 44;
  const CX = 27;
  const paint = kind === 'van' ? 'w' : col;
  for (const [x, y] of [[X0 - 1, 22], [X1 + 1, 22], [X0 - 1, 70], [X1 + 1, 70]]) wheel(s, x, y, 0, 8);
  if (kind === 'truck') {
    // the bed with its crates, then the cab
    s.paint([X0, 4, X1, 52], (x, y) => x > X0 && x < X1 && y > 4 && y < 52, 't', (x, y) => 0.42 + (Math.floor(y / 5) % 2 ? 0.06 : -0.04));
    for (const x of [X0, X1 - 2]) for (let y = 4; y < 52; y++) for (let i = 0; i < 3; i++) s.px(x + i, y, 0xe8e8f0);
    for (const [cx, cy] of [[20, 14], [34, 14], [20, 32], [34, 34]]) {
      s.paint([cx - 6, cy - 6, cx + 6, cy + 6], () => true, 'o', (x, y) => 0.6 - (x - cx) / 30 - (y - cy) / 40);
      for (let k = -5; k <= 5; k += 5) for (let i = -6; i <= 6; i++) s.px(cx + i, cy + k, 0x6a3a10, 0.6);
    }
    box(s, X0, 50, X1, 86, 5, col, null);
  } else box(s, X0, 4, X1, 86, kind === 'sedan' ? 9 : 5, paint, null);
  // the roof: cream on a wagon, the paint on a sedan (rounder, shorter), white with side windows on a van
  if (kind === 'wagon') box(s, X0 + 3, 12, X1 - 3, 56, 4, 'c', (x) => 0.82 - (x - X0) / 140);
  if (kind === 'sedan') {
    box(s, X0 + 4, 20, X1 - 4, 52, 7, col, (x) => 0.8 - (x - X0) / 120);
    s.paint([X0 + 6, 12, X1 - 6, 20], (x, y) => y > 13 && y < 20, 'g', () => 0.3);
  }
  if (kind === 'van') {
    box(s, X0 + 2, 8, X1 - 2, 56, 3, 'w', (x) => 0.88 - (x - X0) / 120);
    for (let y = 12; y < 54; y += 10) for (const x of [X0 + 1, X1 - 2]) for (let j = 0; j < 7; j++) s.px(x, y + j, 0x26405c);
    for (let x = X0 + 4; x < X1 - 4; x++) for (let j = 0; j < 4; j++) s.px(x, 30 + j, mix(col === 'w' ? 0x3a5ad0 : 0xd02a26, 0xffffff, 0.1)); // a coloured band
  }
  // the windscreen, the pillars, the mirrors, the bonnet, the lamps, the bumper and the plate
  const wy = kind === 'truck' ? 58 : kind === 'sedan' ? 52 : 56;
  s.paint([X0 + 2, wy, X1 - 2, wy + 13], (x, y) => y > wy && y < wy + 12 && x > X0 + 3 && x < X1 - 3, 'g', (x, y) => 0.34 + ((x - y) % 16 < 4 ? 0.42 : 0) + (y - wy) / 60);
  for (const px of [X0 + 3, X1 - 4]) for (let y = wy; y < wy + 12; y++) s.px(px, y, 0x18181e);
  for (const sx of [-1, 1]) s.paint([CX + sx * 20 - 3, wy, CX + sx * 20 + 3, wy + 6], (x, y) => Math.abs(x - CX - sx * 20) < 2.6 && y > wy && y < wy + 6, 'k', () => 0.45);
  for (const sx of [-1, 1]) {
    s.ellipse(CX + sx * 10, 76, 4.6, 4.2, 's', { bias: 0.15 });
    s.ellipse(CX + sx * 10, 76, 3.2, 3, 'y', { flat: 0.95, glow: true });
  }
  s.paint([CX - 4, 73, CX + 4, 79], (x, y) => Math.abs(x - CX) < 4 && y > 73 && y < 79, 'k', () => 0.25);
  s.paint([X0, 81, X1, 87], (x, y) => y > 81 && y < 87 && x > X0 + 1 && x < X1 - 1, 'k', () => 0.35);
  s.paint([CX - 6, 81, CX + 6, 88], (x, y) => Math.abs(x - CX) < 6 && y > 82 && y < 88, 'y', () => 0.85);
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

/**
 * A seed, a bullet of its own (pointing up: the game turns it along its flight): bigger than the other cities'
 * pellets, glossy black with a white glint, ringed in the melon's pink and then a dark edge, so it reads on the road.
 */
export function seed() {
  const s = new HiSprite(21, 21, RAMPS);
  const inSeed = (x, y, k = 0) => ((x - 10.5) / (4.6 + k)) ** 2 + ((y - 11.5) / (6.8 + k)) ** 2 < 1 && y > 3.2 - k + Math.abs(x - 10.5) * 0.75;
  s.paint([0, 0, 21, 21], (x, y) => inSeed(x, y, 1.6) && !inSeed(x, y), 'e', () => 0.85, { glow: true }); // the pink halo of flesh
  s.paint([0, 0, 21, 21], (x, y) => inSeed(x, y), 'k', (x, y) => 0.55 - (x - 10.5) / 14 - (y - 11.5) / 30, { glow: true });
  s.line(9, 8, 9, 12, 0xffffff, 1);
  s.px(10, 7, 0xffffff);
  return s.render({ outline: 1, outlineColor: 0x2a0a0a });
}

/** An arrow painted on the road (pointing right): worn white paint, as on a real lane. */
export function laneArrow() {
  const r = new Raster(66, 30);
  const worn = (x, y) => ((x * 7 + y * 13) % 11 === 0 ? 0.55 : 0.95);
  for (let y = 0; y < 30; y++) for (let x = 0; x < 66; x++) {
    const shaft = x >= 3 && x < 40 && Math.abs(y - 14.5) < 4.5;
    const head = x >= 36 && x < 63 && Math.abs(y - 14.5) < (63 - x) * 0.5;
    if (shaft || head) r.set(x, y, 0xf4f0e0, worn(x, y));
  }
  return r;
}

/** A falling watermelon's shadow on the road. */
export function melonShadow() {
  const r = new Raster(54, 30);
  for (let y = 0; y < 30; y++) for (let x = 0; x < 54; x++) {
    const d = ((x - 26.5) / 26) ** 2 + ((y - 14.5) / 14) ** 2;
    if (d < 1) r.set(x, y, 0x0c1410, Math.min(0.85, (1 - d) * 2.2));
  }
  return r;
}

export function keicarEnemies(add) {
  add('lane_arrow', laneArrow());
  add('suika_shadow', melonShadow());
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
  add('mini_r', minicar('r', 'sedan'));
  add('mini_b', minicar('b', 'wagon'));
  add('mini_w', minicar('w', 'van'));
  add('mini_y', minicar('y', 'wagon'));
  add('mini_p', minicar('e', 'sedan'));
  add('mini_t', minicar('b', 'truck'));
  add('cone', cone());
  for (let f = 0; f < 4; f++) add(`suika_${f}`, watermelon(f));
  for (let f = 0; f < 3; f++) add(`suika_splat_${f}`, splat(f));
  add('jb_seed', seed());
  add('skid', skid());
}
