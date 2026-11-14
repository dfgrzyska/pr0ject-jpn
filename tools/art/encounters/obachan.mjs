// Random encounter 6 (ex6): the grandma. A short, sturdy grandma: a tight purple perm, little round glasses, red
// lipstick, a big grin; a black blouse with a huge tiger's face printed on the front, a handbag on her arm, a
// shopping trolley she rams with; sweets in her pockets for everyone. In phase 3 the tiger comes off her blouse and
// leaps about on its own (the blouse left with a tiger-shaped gap). Her wrapped sweets, the trolley, the tiger.
import { HiSprite, tones, fur, speckle, mix2 } from '../../lib/hisprite.mjs';

const INK = 0x14101c;
const RAMPS = {
  v: tones([0x4a1a6a, 0x8a3ac0, 0xd09af0]), // the perm, purple
  f: tones([0xa86a4a, 0xe8b48e, 0xffe0c8]), // skin
  k: tones([0x141218, 0x2a2830, 0x4a4852]), // the blouse, black
  t: tones([0x9a4a08, 0xf08a1a, 0xffc070]), // the tiger, orange
  w: tones([0x9a948a, 0xeae6de, 0xffffff]), // white
  b: tones([0x4a2a18, 0x8a5430, 0xc8885a]), // the handbag, the trousers
  s: tones([0x5a5a64, 0xb8bac4, 0xf4f6ff]), // the trolley's steel
  r: tones([0x7a1418, 0xd02a26, 0xff7a5e]), // sweets
  y: tones([0x8a6a10, 0xe0b830, 0xfff0a0]),
  g: tones([0x1a5a2a, 0x3a9a4a, 0x8ad88a]),
  p: tones([0x7a2a5a, 0xd05a9a, 0xffa8d0]),
};
const furry = (seed) => ({ pat: mix2(fur(Math.PI / 2, { amt: 0.14, len: 5, w: 1.3, gap: 0.05, seed }), speckle({ amt: 0.04 })) });

/** A tiger's face, front on (on the blouse, or the tiger's own): at (cx, cy), size r; angry: snarling. */
function tigerFace(s, cx, cy, r, angry = false) {
  for (const sx of [-1, 1]) s.ellipse(cx + sx * r * 0.72, cy - r * 0.72, r * 0.3, r * 0.3, 't', { flat: 0.55 });
  s.ellipse(cx, cy, r, r * 0.86, 't', { bias: 0.05, ...furry(3) });
  s.ellipse(cx, cy + r * 0.42, r * 0.56, r * 0.36, 'w', { flat: 0.82 });
  // the stripes: on the brow, down the cheeks
  for (let k = -1; k <= 1; k++) s.line(cx + k * r * 0.22, cy - r * 0.8, cx + k * r * 0.26, cy - r * 0.45, INK, Math.max(1, Math.round(r / 9)));
  for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) s.line(cx + sx * r * 0.98, cy - r * 0.2 + k * r * 0.24, cx + sx * r * 0.62, cy - r * 0.12 + k * r * 0.2, INK, Math.max(1, Math.round(r / 10)));
  for (const sx of [-1, 1]) {
    s.ellipse(cx + sx * r * 0.36, cy - r * 0.12, r * 0.17, r * (angry ? 0.09 : 0.14), 'y', { flat: 0.95, glow: true });
    s.line(cx + sx * r * 0.36, cy - r * 0.24, cx + sx * r * 0.36, cy, INK, 1);
    if (angry) s.line(cx + sx * r * 0.58, cy - r * 0.36, cx + sx * r * 0.16, cy - r * 0.22, INK, Math.max(1, Math.round(r / 9)));
  }
  s.poly([[cx - r * 0.13, cy + r * 0.2], [cx + r * 0.13, cy + r * 0.2], [cx, cy + r * 0.34]], 'p', { flat: 0.6 });
  if (angry) {
    s.paint([cx - r * 0.34, cy + r * 0.4, cx + r * 0.34, cy + r * 0.74], (x, y) => Math.abs(x - cx) < r * 0.32 - (y - cy - r * 0.4) * 0.3, 'k', () => 0.15);
    for (const sx of [-1, 1]) s.poly([[cx + sx * r * 0.26, cy + r * 0.42], [cx + sx * r * 0.15, cy + r * 0.42], [cx + sx * r * 0.2, cy + r * 0.62]], 'w', { flat: 0.95 });
  } else {
    s.line(cx, cy + r * 0.34, cx - r * 0.2, cy + r * 0.48, INK, 1);
    s.line(cx, cy + r * 0.34, cx + r * 0.2, cy + r * 0.48, INK, 1);
  }
}

// ---------------------------------------------------------------- the grandma (28 x 36 -> 84 x 108)
// pose: 0 standing, 1 throwing (arm up), 'shout' (fist up, mouth wide: haggling); bare: the tiger gone from her blouse
export function baba(pose, bare = false) {
  const s = new HiSprite(84, 108, RAMPS);
  const cx = 42;
  const shout = pose === 'shout';
  const up = pose === 1 || shout;
  // legs and shoes, brown trousers
  for (const sx of [-1, 1]) {
    s.tube(cx + sx * 8, 86, cx + sx * 9, 102, 5.5, 'b', { rb: 5 });
    s.ellipse(cx + sx * 10, 104, 6, 3.4, 'k', { flat: 0.4 });
  }
  // the blouse: stout and round, black; the tiger's face on it (or its gap)
  s.ellipse(cx, 70, 24, 22, 'k', { bias: 0.04, pat: speckle({ amt: 0.05 }) });
  if (!bare) tigerFace(s, cx, 70, 14);
  else {
    s.paint([cx - 16, 56, cx + 16, 84], (x, y) => ((x - cx) / 14) ** 2 + ((y - 70) / 12) ** 2 < 1, 'w', () => 0.35);
    s.line(cx - 12, 64, cx + 12, 78, 0x4a4852, 1);
    s.line(cx + 10, 62, cx - 8, 80, 0x4a4852, 1);
  }
  // the arms: the handbag hangs from one; the other throws, or both fists up when she haggles
  for (const sx of [-1, 1]) {
    const raised = (up && sx > 0) || (shout && sx < 0 && false);
    const hx = cx + sx * (raised ? 26 : 27);
    const hy = raised ? 34 : 80;
    s.tube(cx + sx * 18, 58, hx, hy, 5, 'k', { rb: 4.2 });
    s.ellipse(hx, hy, 4.4, 4.2, 'f', { flat: 0.75 });
    if (sx < 0) {
      s.tube(hx, hy, hx - 3, hy + 6, 1.2, 'b', { rb: 1.2 });
      s.paint([hx - 13, hy + 6, hx + 5, hy + 22], (x, y) => y > hy + 7 && Math.abs(x - (hx - 4)) < 8 + (y - hy - 7) * 0.12, 'b', (x) => 0.65 - (x - hx + 13) / 60);
      s.dot(hx - 4, hy + 10, 1.2, 0xe0b830);
    }
    if (raised && shout) s.ellipse(hx, hy - 1, 5, 5, 'f', { flat: 0.7 }); // the fist
    if (raised && !shout) s.ellipse(hx, hy - 6, 3.6, 4.6, 'r', { flat: 0.7 }); // a sweet about to fly
  }
  // the head: round face, the purple perm in tight curls, round glasses, red lips, cheeks
  const hy = 34;
  s.ellipse(cx, hy + 2, 15, 15, 'f', { bias: 0.06 });
  for (let k = 0; k < 20; k++) {
    const a = Math.PI * (1.05 + (k / 19) * 0.9);
    s.ellipse(cx + Math.cos(a) * 15, hy - 2 + Math.sin(a) * 13, 5.2, 5.2, 'v', { bias: 0.05 });
  }
  for (const [x, y] of [[-8, -14], [0, -17], [8, -14], [-4, -9], [4, -9]]) s.ellipse(cx + x, hy + y, 5.5, 5, 'v', { bias: 0.05 });
  for (const sx of [-1, 1]) s.ellipse(cx + sx * 15, hy + 4, 4.5, 6, 'v', { bias: 0.05 });
  for (const sx of [-1, 1]) {
    s.dot(cx + sx * 9, hy + 7, 2.4, 0xf08a8a, 0.6); // cheeks
    for (let a = 0; a < Math.PI * 2; a += 0.15) s.px(cx + sx * 6 + Math.cos(a) * 4.2, hy + 1 + Math.sin(a) * 3.6, 0xe0c060); // the glasses' gold rims
    if (shout) {
      s.line(cx + sx * 8, hy - 1, cx + sx * 4, hy + 2, INK, 1);
    } else {
      s.line(cx + sx * 8, hy + 2, cx + sx * 6, hy, INK, 1); // eyes shut, smiling
      s.line(cx + sx * 6, hy, cx + sx * 4, hy + 2, INK, 1);
    }
  }
  s.line(cx - 2, hy + 1, cx + 2, hy + 1, 0xe0c060, 1);
  if (shout) {
    s.ellipse(cx, hy + 9, 5, 4.4, 'k', { flat: 0.15 });
    s.line(cx - 4, hy + 6, cx + 4, hy + 6, 0xd02a26, 1);
  } else {
    s.paint([cx - 6, hy + 7, cx + 6, hy + 11], (x, y) => Math.abs(x - cx) < 6 - (y - hy - 7) * 1.2 && y > hy + 7, 'r', () => 0.55); // the grin, lipsticked
    s.line(cx - 5, hy + 8, cx + 5, hy + 8, 0xffffff, 1);
  }
  return s.render();
}

// ---------------------------------------------------------------- the tiger off her blouse (32 x 28 -> 96 x 84)
// 'crouch' gathering itself, 'leap' stretched out in the air, 'roar'
export function tora(pose) {
  const s = new HiSprite(96, 84, RAMPS);
  const cx = 48;
  const leap = pose === 'leap';
  const roar = pose === 'roar';
  // the tail, the hind legs, the body (stretched in a leap)
  s.tube(cx + 18, leap ? 60 : 64, cx + 38, leap ? 74 : 50, 4, 't', { rb: 3, ...furry(5) });
  for (let k = 0; k < 4; k++) s.line(cx + 22 + k * 4, (leap ? 63 : 60) - k * (leap ? -3 : 3), cx + 24 + k * 4, (leap ? 59 : 56) - k * (leap ? -3 : 3), INK, 2);
  for (const sx of [-1, 1]) s.tube(cx + sx * 12, 62, cx + sx * (leap ? 16 : 18), leap ? 80 : 76, 5, 't', { rb: 4.4, ...furry(7) });
  s.ellipse(cx, leap ? 52 : 56, 22, leap ? 22 : 17, 't', { bias: 0.04, ...furry(9) });
  for (let k = 0; k < 5; k++) for (const sx of [-1, 1]) s.line(cx + sx * 21, 46 + k * 5, cx + sx * 10, 48 + k * 5, INK, 2);
  // the forelegs, out in front in a leap, claws
  for (const sx of [-1, 1]) {
    const fx = cx + sx * (leap ? 30 : 16);
    const fy = leap ? 26 : 70;
    s.tube(cx + sx * 12, 46, fx, fy, 5, 't', { rb: 4.2, ...furry(11) });
    s.ellipse(fx, fy, 5.5, 4.5, 'w', { flat: 0.8 });
    for (let c = -1; c <= 1; c++) s.line(fx + c * 2.5, fy - (leap ? 4 : -3), fx + c * 3, fy - (leap ? 7 : -6), 0xffffff, 1);
  }
  tigerFace(s, cx, leap ? 34 : 34, 17, roar || leap);
  return s.render();
}

// ---------------------------------------------------------------- what she throws and pushes
/** A wrapped sweet, its wrapper twisted at both ends. */
export function ame(col, f = 0) {
  const s = new HiSprite(30, 18, RAMPS);
  const tilt = f ? 1.5 : 0;
  for (const sx of [-1, 1]) s.poly([[15 + sx * 6, 9], [15 + sx * 13, 3 + tilt * sx], [15 + sx * 13, 15 - tilt * sx]], col, { flat: 0.45 });
  s.ellipse(15, 9, 7, 6, col, { bias: 0.1 });
  s.line(11, 6, 14, 5, 0xffffff, 1, 0.8);
  return s.render({ outline: 1 });
}

/** The shopping trolley, seen from the side, its basket full. */
export function cart(f) {
  const s = new HiSprite(72, 60, RAMPS);
  s.paint([8, 10, 62, 42], (x, y) => y > 12 && y < 40 && x > 10 + (y - 12) * 0.2 && x < 60, 's', () => 0.55, { pat: (x, y) => ((Math.floor(x) % 5 === 0 || Math.floor(y) % 5 === 0) ? 0.15 : -0.3) });
  for (const [x, c] of [[20, 'y'], [32, 'g'], [44, 'r']]) s.ellipse(x, 12, 7, 6, c, { bias: 0.1 }); // the shopping, heaped
  s.tube(60, 12, 70, 4, 2, 's', { rb: 2 }); // the handle
  s.tube(14, 42, 58, 42, 1.6, 's', { rb: 1.6 });
  for (const x of [18, 54]) {
    s.ellipse(x, 52, 5, 5, 'k', { flat: 0.3 });
    s.line(x - 3 * Math.cos(f), 52 - 3 * Math.sin(f), x + 3 * Math.cos(f), 52 + 3 * Math.sin(f), 0x8a8a94, 1);
  }
  return s.render();
}

export function obachanEnemies(add) {
  add('baba_0', baba(0));
  add('baba_1', baba(1));
  add('baba_shout', baba('shout'));
  add('baba_bare', baba(0, true));
  add('baba_bare_1', baba(1, true));
  add('baba_bare_shout', baba('shout', true));
  add('tora_crouch', tora('crouch'));
  add('tora_leap', tora('leap'));
  add('tora_roar', tora('roar'));
  for (const c of ['r', 'y', 'g', 'p']) {
    add(`ame_${c}_0`, ame(c, 0));
    add(`ame_${c}_1`, ame(c, 1));
  }
  add('cart_0', cart(0));
  add('cart_1', cart(Math.PI / 2));
}
