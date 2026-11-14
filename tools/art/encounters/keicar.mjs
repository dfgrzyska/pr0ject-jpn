// Random encounter 2 (ex2): the kei car. Seen from above, nose down the screen (it drives at the player): a tiny tall
// box of a car in pastel mint, the yellow number plate of the kei class (blank: no numbers, no maker), round
// headlights for eyes under heavy lids, a grille for a grin, door mirrors, little wheels at the corners. Tuned up
// for phase 2 (a spoiler, stripes, flames painted on); unfolded into a kei truck for phase 3, its flatbed piled with
// watermelons and cabbages. The mini cars of the rush hour, a traffic cone, a watermelon, its skid marks.
import { HiSprite, tones, speckle, mix2 } from '../../lib/hisprite.mjs';

const INK = 0x14101c;
const RAMPS = {
  m: tones([0x3a8a78, 0x8ad8c0, 0xe0fff0]), // mint paint
  w: tones([0x6a6a74, 0xc8c8d0, 0xffffff]), // white / chrome
  g: [0x08101c, 0x142236, 0x26405c, 0x5a86ac, 0xb8dcf4], // glass, the sky in it
  k: tones([0x101014, 0x24242a, 0x48484e]), // tyres, rubber
  y: tones([0x9a7a10, 0xf0c830, 0xfff6a8]), // the yellow plate, headlights
  o: tones([0x8a3a08, 0xf08020, 0xffc070]), // indicators, cones
  r: tones([0x7a1418, 0xd02a26, 0xff7a5e]), // red
  b: tones([0x1a2a6a, 0x3a5ad0, 0x9ab8ff]), // blue
  n: tones([0x2a5a14, 0x4a9a2a, 0xa8e070]), // watermelon rind, cabbage
  t: tones([0x3a2a20, 0x6a5040, 0x9a8070]), // the flatbed's boards
};

/** A car body from above: a rounded box w x h at (x0, y0), its paint ramp. */
function body(s, x0, y0, w, h, m) {
  const r = Math.min(w, h) * 0.24;
  s.paint([x0, y0, x0 + w, y0 + h], (x, y) => {
    const dx = Math.max(x0 + r - x, 0, x - (x0 + w - r));
    const dy = Math.max(y0 + r - y, 0, y - (y0 + h - r));
    return dx * dx + dy * dy < r * r;
  }, m, (x, y) => 0.62 - (x - x0 - w / 2) / (w * 2.2) - (y - y0) / (h * 6), { pat: speckle({ amt: 0.03 }) });
}

// ---------------------------------------------------------------- the kei car (30 x 46 -> 90 x 138)
// state: 0 / 1 hazard lights off / on, 'tuned' (phase 2), 'angry' (eyes lit red)
export function keicar(state) {
  const s = new HiSprite(90, 138, RAMPS);
  const tuned = state === 'tuned';
  const lights = state === 1 || tuned;
  // the wheels at the corners, peeking out
  for (const [x, y] of [[10, 26], [80, 26], [10, 108], [80, 108]]) s.paint([x - 7, y - 13, x + 7, y + 13], (px, py) => Math.abs(px - x) < 5 && Math.abs(py - y) < 12, 'k', () => 0.35);
  body(s, 12, 6, 66, 126, 'm');
  // the rear: bumper, the little rear window, the lamps
  s.paint([14, 6, 76, 14], (x, y) => y < 12 && x > 16 && x < 74, 'w', () => 0.5);
  for (const sx of [17, 66]) s.paint([sx, 12, sx + 8, 20], (x, y) => x >= sx && x <= sx + 7 && y >= 13 && y <= 19, lights ? 'o' : 'r', () => (lights ? 0.95 : 0.55), { glow: lights });
  s.paint([20, 16, 70, 30], (x, y) => x > 22 && x < 68 && y > 17 && y < 29, 'g', (x, y) => 0.3 + (x - y) % 20 / 60);
  // the roof, flat and tall, its rails
  s.paint([18, 30, 72, 86], (x, y) => x > 19 && x < 71 && y > 31 && y < 85, 'm', (x) => 0.78 - (x - 19) / 160);
  for (const rx of [21, 68]) for (let y = 34; y < 82; y++) s.px(rx, y, 0x5a6a68);
  if (tuned) {
    // racing stripes down the middle, a spoiler on the back, flames licking up from the nose
    for (let y = 6; y < 132; y++) for (const sx of [-6, 3]) for (let i = 0; i < 4; i++) s.px(45 + sx + i, y, 0xf4f4f0, 0.9);
    s.paint([8, 0, 82, 8], (x, y) => y >= 1 && y <= 6 && x >= 9 && x <= 81, 'k', () => 0.5);
    for (const sx of [14, 76]) s.paint([sx - 2, 4, sx + 2, 12], (x, y) => Math.abs(x - sx) < 2 && y < 11, 'k', () => 0.3);
    for (let k = 0; k < 4; k++) {
      const fx = 18 + k * 16;
      s.poly([[fx, 120], [fx + 6, 96 - (k % 2) * 8], [fx + 12, 120]], 'o', { flat: 0.85 });
      s.poly([[fx + 3, 120], [fx + 6, 106 - (k % 2) * 6], [fx + 9, 120]], 'y', { flat: 0.9 });
    }
  }
  // the windscreen, wide, the sky in it, the wipers parked
  s.paint([16, 84, 74, 104], (x, y) => y > 86 + Math.abs(x - 45) * 0.06 && y < 103 && x > 18 && x < 72, 'g', (x, y) => 0.35 + (Math.abs(x - y * 0.5 - 10) % 22 < 4 ? 0.4 : 0));
  s.line(26, 101, 42, 98, INK, 1);
  s.line(48, 101, 64, 98, INK, 1);
  // the door mirrors
  for (const sx of [-1, 1]) s.paint([45 + sx * 37 - 5, 84, 45 + sx * 37 + 5, 94], (x, y) => Math.abs(x - 45 - sx * 37) < 4 && y > 85 && y < 93, 'm', () => 0.5);
  // the nose: the bonnet, the headlights for eyes under their lids, the grille's grin, the yellow plate
  const angry = state === 'angry' || tuned;
  for (const sx of [-1, 1]) {
    const ex = 45 + sx * 18;
    s.ellipse(ex, 118, 8, 7, 'w', { flat: 0.55 });
    s.ellipse(ex, 118, 6, 5.4, angry ? 'r' : 'y', { flat: 0.95, glow: true });
    s.ellipse(ex - sx, 119, 2.4, 2.4, 'k', { flat: 0.15 });
    // the lid, slanting down to the middle (crosser when it's angry)
    const tilt = angry ? 5 : 2;
    s.poly([[ex - 9, 111 + (sx < 0 ? 0 : tilt)], [ex + 9, 111 + (sx < 0 ? tilt : 0)], [ex + 9, 114 + (sx < 0 ? tilt : 0)], [ex - 9, 114 + (sx < 0 ? 0 : tilt)]], 'm', { flat: 0.35 });
  }
  s.paint([28, 124, 62, 132], (x, y) => y > 125 && y < 131 && x > 30 && x < 60 && (Math.floor(x) % 4 !== 0), 'k', () => 0.3);
  s.paint([36, 130, 54, 138], (x, y) => x > 36 && x < 54 && y > 131 && y < 137, 'y', () => 0.85);
  for (let x = 37; x < 54; x++) {
    s.px(x, 131, INK);
    s.px(x, 137, INK);
  }
  s.px(40, 134, 0x2a6a2a);
  s.px(50, 134, 0x2a6a2a); // (the plate's bolts, painted green as on the kei plates)
  return s.render();
}

// ---------------------------------------------------------------- the kei truck (30 x 56 -> 90 x 168): cab at the nose, the flatbed behind
export function keitruck(f) {
  const s = new HiSprite(90, 168, RAMPS);
  for (const [x, y] of [[10, 30], [80, 30], [10, 138], [80, 138]]) s.paint([x - 7, y - 13, x + 7, y + 13], (px, py) => Math.abs(px - x) < 5 && Math.abs(py - y) < 12, 'k', () => 0.35);
  // the flatbed: boards, the drop sides, the load (watermelons and cabbages, one missing per frame as it throws)
  s.paint([10, 4, 80, 112], (x, y) => x > 11 && x < 79 && y > 5 && y < 111, 't', (x, y) => 0.45 + (Math.floor(y / 7) % 2 ? 0.08 : -0.04));
  for (const x of [12, 77]) for (let y = 5; y < 111; y++) for (let i = 0; i < 3; i++) s.px(x + i, y, 0xc8c8d0);
  for (let i = 0; i < 9; i++) {
    if (f && i === 4) continue;
    const cx = 26 + (i % 3) * 19;
    const cy = 26 + Math.floor(i / 3) * 28;
    if (i % 4 === 1) {
      s.ellipse(cx, cy, 8, 8, 'n', { bias: 0.15 });
      for (let k = 0; k < 4; k++) s.line(cx - 6 + k * 3, cy - 6, cx - 4 + k * 3, cy + 6, 0x2a5a14, 1, 0.6);
    } else {
      s.ellipse(cx, cy, 9, 8, 'n', { bias: 0.1 });
      for (let k = -2; k <= 2; k++) s.line(cx + k * 3, cy - 7, cx + k * 3 + 1, cy + 7, 0x183a10, 1, 0.9);
    }
  }
  // the cab, mint, the back window, the roof, the windscreen, the face as on the car
  body(s, 12, 108, 66, 58, 'm');
  s.paint([20, 110, 70, 118], (x, y) => x > 22 && x < 68 && y > 111 && y < 117, 'g', () => 0.3);
  s.paint([18, 118, 72, 136], (x, y) => x > 19 && x < 71 && y > 119 && y < 135, 'm', (x) => 0.78 - (x - 19) / 160);
  s.paint([16, 134, 74, 150], (x, y) => y > 136 && y < 149 && x > 18 && x < 72, 'g', (x, y) => 0.35 + (Math.abs(x - y * 0.5) % 22 < 4 ? 0.4 : 0));
  for (const sx of [-1, 1]) {
    const ex = 45 + sx * 18;
    s.ellipse(ex, 155, 7, 6, 'w', { flat: 0.55 });
    s.ellipse(ex, 155, 5, 4.6, 'r', { flat: 0.95, glow: true });
    s.poly([[ex - 8, 149 + (sx < 0 ? 0 : 5)], [ex + 8, 149 + (sx < 0 ? 5 : 0)], [ex + 8, 152 + (sx < 0 ? 5 : 0)], [ex - 8, 152 + (sx < 0 ? 0 : 5)]], 'm', { flat: 0.35 });
  }
  s.paint([36, 160, 54, 167], (x, y) => x > 36 && x < 54 && y > 161 && y < 167, 'y', () => 0.85);
  return s.render();
}

// ---------------------------------------------------------------- the rush hour's mini cars (18 x 28 -> 54 x 84), nose down
export function minicar(col) {
  const s = new HiSprite(54, 84, RAMPS);
  for (const [x, y] of [[6, 16], [48, 16], [6, 66], [48, 66]]) s.paint([x - 5, y - 8, x + 5, y + 8], (px, py) => Math.abs(px - x) < 3.5 && Math.abs(py - y) < 7.5, 'k', () => 0.35);
  body(s, 7, 4, 40, 76, col);
  s.paint([12, 10, 42, 20], (x, y) => x > 13 && x < 41 && y > 11 && y < 19, 'g', () => 0.3);
  s.paint([10, 52, 44, 64], (x, y) => x > 11 && x < 43 && y > 53 && y < 63, 'g', (x, y) => 0.35 + ((x - y) % 14 < 3 ? 0.4 : 0));
  for (const sx of [-1, 1]) s.ellipse(27 + sx * 11, 72, 4, 3.4, 'y', { flat: 0.95, glow: true });
  s.paint([20, 76, 34, 81], (x, y) => x > 20 && x < 34 && y > 76 && y < 81, 'y', () => 0.85);
  return s.render();
}

// ---------------------------------------------------------------- a traffic cone from above (11 -> 33), a watermelon (10 -> 30), skid marks
export function cone() {
  const s = new HiSprite(33, 33, RAMPS);
  s.paint([2, 2, 31, 31], (x, y) => Math.abs(x - 16.5) < 13 && Math.abs(y - 16.5) < 13, 'k', () => 0.3); // its square base
  for (const [r, m] of [[11, 'o'], [8.5, 'w'], [6.5, 'o'], [4, 'w'], [2.4, 'o']]) s.ellipse(16.5, 16.5, r, r, m, { bias: 0.12 });
  return s.render();
}

export function watermelon(f) {
  const s = new HiSprite(30, 30, RAMPS);
  s.ellipse(15, 15, 12, 11, 'n', { bias: 0.15 });
  for (let k = -3; k <= 3; k++) {
    const a = f * 0.6;
    s.line(15 + k * 3 * Math.cos(a) - 10 * Math.sin(a), 15 + k * 3 * Math.sin(a) + 10 * Math.cos(a), 15 + k * 3 * Math.cos(a) + 10 * Math.sin(a), 15 + k * 3 * Math.sin(a) - 10 * Math.cos(a), 0x183a10, 1, 0.85);
  }
  return s.render();
}

export function skid() {
  const s = new HiSprite(24, 36, RAMPS);
  for (const x of [4, 20]) for (let y = 0; y < 36; y++) for (let i = -1.5; i <= 1.5; i++) s.px(x + i, y, 0x141210, 0.55 - Math.abs(i) * 0.12);
  return s.render({ outline: 0 });
}

export function keicarEnemies(add) {
  add('kei_0', keicar(0));
  add('kei_1', keicar(1));
  add('kei_angry', keicar('angry'));
  add('kei_tuned', keicar('tuned'));
  add('keitora_0', keitruck(0));
  add('keitora_1', keitruck(1));
  add('mini_r', minicar('r'));
  add('mini_b', minicar('b'));
  add('mini_w', minicar('w'));
  add('cone', cone());
  for (let f = 0; f < 4; f++) add(`suika_${f}`, watermelon(f));
  add('skid', skid());
}
