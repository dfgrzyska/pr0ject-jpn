// NEKOMATA, Onomichi's miniboss (docs/plan-onomichi.md, 6.1): an old black-and-white cat whose tail has forked in
// two with age, a will-o'-the-wisp (onibi) burning blue at the tip of each. Seen from above and a little in front like
// every sprite, its face to the bottom of the screen (to the ship). Frames (72 x 72 fine px):
//   o_neko_sit_0..3     sitting, its tails swaying, the wisps flickering
//   o_neko_crouch       gathered to spring, ears back
//   o_neko_leap         stretched out in the air
//   o_neko_land         squashed on landing, its claws out
//   o_neko_meow_0..1    mouth wide (a copy's cry, its own)
//   o_neko_dance_0..3   up on its hind legs with a towel on its head, dancing (the old tales' nekomata dance by night)
//   o_neko_wash_0..1    spent: sitting, licking a paw, panting
//   o_neko_copy_0..1    one of its copies: one tail, wisps of smoke round its edges
//   o_neko_sleep        curled up asleep, one tail again: just a cat
//   o_onibi_0..3        a wisp on its own (orbiting it before it lets them go)
//   o_neko_shadow       its shadow on the roofs while it is in the air
import { HiSprite, tones, fur, speckle } from '../../lib/hisprite.mjs';

const RAMPS = {
  k: tones([0x0c0a10, 0x24202a, 0x4a4652]), // black fur
  w: tones([0x9a96a2, 0xe6e4ea, 0xffffff]), // white fur
  p: tones([0x9a4a5a, 0xe08a9a, 0xffc8d0]), // pink: nose, ears, paw pads, mouth
  o: [0x10306a, 0x2a5ad0, 0x7ab8ff, 0xc8e8ff, 0xf0fbff], // the wisps' blue fire, glowing
  t: tones([0x1a2a5a, 0x2a4a8a, 0xd8dce8]), // the towel: indigo-dyed cotton
};
const INK = 0x0c0a10;
const W = 72;
const C = 36;

const hair = (a) => ({ pat: fur(a, { amt: 0.16, len: 4, seed: 7 }) });
/** A wisp of blue fire at (x, y), r across, flickering with k. */
function wisp(s, x, y, r, k) {
  s.ellipse(x, y + 1, r, r * 1.1, 'o', { flat: 0.6, glow: true });
  s.poly([[x - r * 0.8, y], [x + r * 0.8, y], [x + Math.sin(k * 2.1) * r * 0.6, y - r * 2.2]], 'o', { flat: 0.85, glow: true });
  s.dot(x, y + 1, r * 0.45, 0xf0fbff);
}
/** The tails: from the root at (x, y) out to the sides and up, each a curve swaying with k, a wisp at the tip. */
function tails(s, x, y, n, k, len = 20, wisps = true) {
  const tipsAt = [];
  for (let i = 0; i < n; i++) {
    const side = n === 1 ? 1 : i ? 1 : -1;
    const sway = Math.sin(k * 1.6 + i * 2.2) * 2.4;
    const pts = [[x + side * 6, y], [x + side * (len * 0.55), y - len * 0.2], [x + side * (len * 0.8) + sway * 0.5, y - len * 0.55], [x + side * (len * 0.7) + sway, y - len * 0.95]];
    for (let j = 0; j + 1 < pts.length; j++) s.tube(...pts[j], ...pts[j + 1], 2.6 - j * 0.35, 'k', { rb: 2.3 - j * 0.35, ...hair(-Math.PI / 2) });
    const [tx, ty] = pts[3];
    s.ellipse(tx, ty, 1.8, 1.8, 'w', { bias: 0.1 }); // a white tip
    tipsAt.push([tx, ty - 1]);
  }
  if (wisps) for (const [tx, ty] of tipsAt) wisp(s, tx, ty - 3, 2.6, k);
}
/** The head at (x, y): black cap and ears, the white muzzle and chin, the eyes (open: gold, slit), the nose. */
function head(s, x, y, { eyes = 'open', mouth = 'shut', ears = 'up', tilt = 0 } = {}) {
  for (const sx of [-1, 1]) {
    const [bx, by] = [x + sx * 6, y - 5];
    const tip = ears === 'back' ? [x + sx * 11, y - 5] : [x + sx * 8.5 + tilt, y - 13];
    s.poly([[bx - 3.6, by + 1], [bx + 3.6, by + 1], tip], 'k', { flat: 0.62 });
    s.poly([[bx - 1.8, by], [bx + 1.8, by], [tip[0] * 0.8 + bx * 0.2, tip[1] * 0.8 + by * 0.2]], 'p', { flat: 0.55 });
  }
  s.ellipse(x, y, 10.5, 8.8, 'k', { bias: 0.04, ...hair(Math.PI / 2) });
  s.ellipse(x, y + 4, 6.4, 4.6, 'w', { bias: 0.08 }); // the white muzzle and chin
  s.poly([[x - 1.6, y - 6], [x + 1.6, y - 6], [x + 3, y + 1], [x - 3, y + 1]], 'w', { flat: 0.7 }); // the blaze up its face
  for (const sx of [-1, 1]) {
    const [ex, ey] = [x + sx * 4.6, y - 0.5];
    if (eyes === 'shut') s.line(ex - 2, ey, ex + 2, ey + 0.6, INK, 1.2);
    else if (eyes === 'happy') {
      s.line(ex - 2, ey + 0.8, ex, ey - 0.6, INK, 1.2);
      s.line(ex, ey - 0.6, ex + 2, ey + 0.8, INK, 1.2);
    } else {
      s.ellipse(ex, ey, 2.4, 2.2, 'W', { flat: 0.9 });
      s.dot(ex, ey, 2, 0xe8b830);
      s.line(ex, ey - 1.6, ex, ey + 1.6, INK, 1); // the slit
      s.dot(ex - 0.7, ey - 0.8, 0.5, 0xffffff);
    }
    for (let k = 0; k < 2; k++) s.line(x + sx * 4, y + 3.5 + k, x + sx * 11, y + 2.5 + k * 2.2, 0xe8e8ec, 1, 0.75); // whiskers
  }
  s.poly([[x - 1.4, y + 1.4], [x + 1.4, y + 1.4], [x, y + 2.8]], 'p', { flat: 0.6 });
  if (mouth === 'open') {
    s.ellipse(x, y + 5.6, 3, 2.6, 'K', { flat: 0.2 });
    s.ellipse(x, y + 6.4, 1.8, 1.2, 'p', { flat: 0.55 });
    for (const sx of [-1, 1]) s.line(x + sx * 1.8, y + 3.8, x + sx * 1.6, y + 5.2, 0xffffff, 1); // fangs
  } else if (mouth === 'tongue') {
    s.ellipse(x, y + 6.2, 1.6, 2, 'p', { flat: 0.6 });
  }
}

function cat(pose, f, o = {}) {
  const s = new HiSprite(W, W, RAMPS);
  const n = o.tails ?? 2;
  const k = f * (Math.PI / 2);
  if (pose === 'sit' || pose === 'meow' || pose === 'wash' || pose === 'copy') {
    // sitting up facing the ship: the haunches and the white chest, the forepaws together in front, the head on top;
    // the two tails out from behind it, one each side, curling up, their wisps burning
    tails(s, C, 58, n, k, 26, !o.noWisps);
    s.ellipse(C, 48, 14, 13, 'k', { bias: 0.04, ...hair(-Math.PI / 2) });
    s.ellipse(C, 47, 7, 10, 'w', { bias: 0.06, ...hair(Math.PI / 2) }); // the white chest
    for (const sx of [-1, 1]) s.ellipse(C + sx * 4, 60, 3.2, 2.8, 'w', { bias: 0.1 }); // its forepaws
    if (pose === 'wash') {
      s.tube(C - 4, 58, C - 4, 34, 2.4, 'w', { rb: 2 }); // a paw up to its face
      head(s, C, 30, { eyes: 'shut', mouth: 'tongue', ears: 'up', tilt: f ? 1 : -1 });
      s.ellipse(C - 4, 34, 2.8, 2.4, 'w', { bias: 0.1 });
      s.ellipse(C + 12, 24 - f, 1.4, 2, 'C', { flat: 0.8 }); // a bead of sweat
    } else head(s, C, 30, { eyes: pose === 'meow' ? 'shut' : 'open', mouth: pose === 'meow' ? 'open' : 'shut' });
  } else if (pose === 'crouch') {
    tails(s, C, 36, n, k, 18);
    s.ellipse(C, 40, 16, 12, 'k', { bias: 0.04, ...hair(-Math.PI / 2) });
    for (const sx of [-1, 1]) s.ellipse(C + sx * 7, 54, 3.4, 2.4, 'w', { bias: 0.1 });
    head(s, C, 50, { ears: 'back' });
  } else if (pose === 'leap') {
    tails(s, C + 1, 18, n, k + 1, 16);
    s.ellipse(C, 36, 10, 21, 'k', { bias: 0.03, ...hair(-Math.PI / 2) });
    s.ellipse(C, 40, 5, 11, 'w', { bias: 0.06 });
    for (const sx of [-1, 1]) {
      s.tube(C + sx * 5, 50, C + sx * 9, 64, 2.4, 'w', { rb: 2 }); // forelegs reaching
      s.tube(C + sx * 5, 22, C + sx * 8, 12, 2.6, 'k', { rb: 2 }); // hind legs kicked back
    }
    head(s, C, 52, { ears: 'back', mouth: 'open' });
  } else if (pose === 'land') {
    tails(s, C, 38, n, k + 2, 18);
    s.ellipse(C, 42, 19, 11, 'k', { bias: 0.04, ...hair(-Math.PI / 2) });
    for (const sx of [-1, 1]) {
      s.ellipse(C + sx * 13, 54, 4, 2.6, 'w', { bias: 0.1 });
      for (let q = -1; q <= 1; q++) s.line(C + sx * 13 + q * 1.4, 55.5, C + sx * 13 + q * 1.8, 58.5, 0xf4f0e8, 1); // claws out
    }
    head(s, C, 50, { mouth: 'open', ears: 'back' });
  } else if (pose === 'dance') {
    // up on its hind legs, turning: the towel on its head, its forepaws up and out in time with the dance
    tails(s, C, 52, n, k * 1.5, 22);
    s.ellipse(C, 40, 10, 15, 'k', { bias: 0.04, ...hair(-Math.PI / 2) });
    s.ellipse(C, 44, 6, 10, 'w', { bias: 0.06 });
    for (const sx of [-1, 1]) s.ellipse(C + sx * 5, 58, 3.4, 2.4, 'w', { bias: 0.1 }); // hind paws
    const arms = [[[-14, 30], [12, 40]], [[-12, 40], [14, 30]], [[-15, 26], [15, 26]], [[-9, 44], [9, 44]]][f];
    for (const [i, [ax, ay]] of arms.entries()) {
      const sx = i ? 1 : -1;
      s.tube(C + sx * 7, 34, C + ax, ay, 2.4, 'k', { rb: 2 });
      s.ellipse(C + ax, ay, 2.6, 2.6, 'w', { bias: 0.1 });
    }
    head(s, C, 24, { eyes: 'happy', mouth: f % 2 ? 'open' : 'shut' });
    // the towel: a band of indigo cotton over its head, its knot and ends flying
    s.poly([[C - 10, 18], [C + 10, 18], [C + 9, 22], [C - 9, 22]], 't', { flat: 0.7 });
    for (let x = C - 9; x < C + 9; x += 3) s.px(x, 20, 0xd8dce8);
    s.poly([[C + 8, 19], [C + 15, 14 + (f % 2) * 3], [C + 14, 19 + (f % 2) * 2]], 't', { flat: 0.6 });
  } else if (pose === 'sleep') {
    // curled up asleep: a round of black and white, its tail round its nose, one tail again
    s.ellipse(C, 40, 16, 13, 'k', { bias: 0.04, ...hair(0.4) });
    s.ellipse(C - 4, 44, 8, 6, 'w', { bias: 0.06 });
    s.tube(C + 14, 40, C + 6, 52, 2.6, 'k', { rb: 2 });
    s.tube(C + 6, 52, C - 6, 52, 2.2, 'k', { rb: 1.8 });
    s.ellipse(C - 7, 51.6, 1.8, 1.8, 'w', { bias: 0.1 });
    head(s, C - 6, 40, { eyes: 'shut', ears: 'back' });
  }
  if (pose === 'copy') {
    // a copy: wisps of smoke round its edges, its blue fire paler
    for (let i = 0; i < 9; i++) {
      const a = i * 0.7 + f;
      s.ellipse(C + Math.cos(a) * 17, 40 + Math.sin(a) * 18, 2.6, 2.2, 'W', { flat: 0.75 });
    }
  }
  return s.render({ outline: 2 });
}

function onibi(f) {
  const s = new HiSprite(24, 30, RAMPS);
  wisp(s, 12, 20, 5, f * (Math.PI / 2));
  for (let i = 0; i < 3; i++) s.dot(12 + Math.sin(f + i * 2) * 6, 26 - i * 7 - f, 0.8, 0xc8e8ff, 0.7);
  return s.render({ outline: 0 });
}

function shadow() {
  const s = new HiSprite(54, 24, RAMPS);
  for (let y = 0; y < 24; y++) for (let x = 0; x < 54; x++) if (((x - 27) / 26) ** 2 + ((y - 12) / 11) ** 2 < 1) s.px(x, y, 0x0a0812, 0.45);
  return s.render({ outline: 0 });
}

/** Every frame of the fight (src/game/enemies/onomichi-nekomata.js), into the city's atlas. */
export function nekomataFrames(add) {
  for (let f = 0; f < 4; f++) {
    add(`o_neko_sit_${f}`, cat('sit', f));
    add(`o_neko_dance_${f}`, cat('dance', f));
    add(`o_onibi_${f}`, onibi(f));
  }
  for (let f = 0; f < 2; f++) {
    add(`o_neko_meow_${f}`, cat('meow', f));
    add(`o_neko_wash_${f}`, cat('wash', f));
    add(`o_neko_copy_${f}`, cat('copy', f, { tails: 1 }));
  }
  add('o_neko_crouch', cat('crouch', 0));
  add('o_neko_leap', cat('leap', 0));
  add('o_neko_land', cat('land', 0));
  add('o_neko_sleep', cat('sleep', 0, { tails: 1 }));
  add('o_neko_shadow', shadow());
  void speckle;
}
