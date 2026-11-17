// Tokyo's enemies at 540 px (docs/plan-tokyo.md, section 5 and phase 9): five sets, one to each stretch of the
// flight, each giving the five archetypes a look of their own. Behaviour stays the game's (skins.js picks the
// frames); everything faces down the screen, toward the player, its pivot in the frame's middle.
//   west (Nakano - Harajuku):    crows; spinning tops; neon signs come off their walls; trucks of adverts with
//                                loudspeakers; air-conditioning units with a billboard's spotlight on them
//   centre (Shibuya - Chiyoda):  clear umbrellas; a crow diving with an umbrella in its beak; camera drones;
//                                rickshaws; a corner of the castle wall with an old bronze gun on it
//   akiba (Akihabara - Ueno):    sprites of eight bits (a creature of our own, blinking from frame to frame); game
//                                cartridges flying as rockets; capsules from the machines that open to shoot;
//                                vans full of capsules; arcade cabinets with a dish aerial
//   asakusa (Asakusa - Sumida):  paper lanterns; round fans; stone lion-dogs; portable shrines carried by their
//                                crowd; the censer with a stone fox on it
//   bay (the bay - Odaiba):      gulls; delivery drones with their parcel; buoys with a gun; barges; a container
//                                with a launcher on its roof
// No marks, no characters of anyone's: the writing on signs and fans is strokes, the sprite is our own.
import { HiSprite, tones, fur, speckle, crackle, mottle, mix2 } from '../../lib/hisprite.mjs';
import { kasaEnemies } from './kasa.mjs';
import { taiyakiEnemies } from './taiyaki.mjs';
import { kuroganeEnemies } from './kurogane.mjs';

const INK = 0x14101c;
const TAU = Math.PI * 2;
const RAMPS = {
  k: tones([0x0a0a12, 0x22222e, 0x4a5068]), // crow black, a blue sheen
  c: [0x5a7a90, 0x9ab8cc, 0xcfe2ee, 0xeef6fb, 0xffffff], // clear vinyl
  p: tones([0xb8a890, 0xf0e8d8, 0xffffff]), // paper
  r: tones([0x7a0e14, 0xd02a30, 0xff7a6a]), // lantern red
  b: tones([0x2a3a30, 0x5a7a5a, 0x9ab890]), // bronze gone green
  u: tones([0x4a3418, 0x8a6430, 0xc89a58]), // old bronze, brown
  s: tones([0x5a5850, 0x9a968a, 0xd4d0c4]), // stone
  g: tones([0x8a909a, 0xe2e6ec, 0xffffff]), // gull white
  o: tones([0x7a5a30, 0xb88a50, 0xe0b880]), // cardboard
  a: tones([0xa8a498, 0xeae6da, 0xffffff]), // plaster
  t: tones([0x22262e, 0x404858, 0x6a7484]), // roof tiles
  z: tones([0x8a3a10, 0xd86a28, 0xffa860]), // a container's orange
  h: tones([0x1a2a5a, 0x2a4a8a, 0x6a8ac8]), // indigo cotton
  x: tones([0x3a3e46, 0x6a7078, 0xa0a8b0]), // plastic grey
  n: [0x8a1040, 0xe0306a, 0xff70a0, 0xffc0d8, 0xffffff], // neon pink, glowing
  e: [0x0a6a7a, 0x18b0c8, 0x60e8f8, 0xc0f8ff, 0xffffff], // neon cyan, glowing
  l: [0x8a5000, 0xd09000, 0xffd040, 0xfff0a0, 0xffffff], // lamp light, glowing
  H: tones([0x8a6a30, 0xd8b060, 0xf4dc98]), // straw
};
const COL = { red: 'R', blue: 'B', green: 'G', purple: 'V' };
const HEX = { red: 0xe0402a, blue: 0x3a72f0, green: 0x37b35a, purple: 0x9c50f0 };
const plastic = (seed) => ({ pat: mix2(speckle({ amt: 0.08, seed }), mottle({ amt: 0.06, scale: 6, seed })) });
const feathers = (a, seed) => ({ pat: fur(a, { amt: 0.22, len: 6, w: 1.4, seed, gap: 0.08 }) });

/** Drawing in a frame turned by angle a: P(t, n) is t along the direction the thing points, n across it. */
const turned = (cx, cy, a) => {
  const [dx, dy, px, py] = [-Math.sin(a), Math.cos(a), Math.cos(a), Math.sin(a)];
  return (t, n) => [cx + dx * t + px * n, cy + dy * t + py * n];
};

// ================================================================= west
// ---------------------------------------------------------------- popcorn: a crow (17 x 14 -> 51 x 42), wings beating
export function karasu(f) {
  const s = new HiSprite(51, 42, RAMPS);
  const cx = 25.5;
  const span = [23, 19, 10, 17][f];
  const lift = [3, 0, -4, -1][f];
  // the wings: broad, the long fingers of the primaries apart at the tips
  for (const sx of [-1, 1]) {
    const P = (x, y) => [cx + sx * x, y];
    s.poly([P(3, 14), P(span * 0.55, 10 + lift * 0.5), P(span, 12 + lift), P(span - 1, 18 + lift), P(span * 0.6, 22), P(3, 24)], 'k', { flat: 0.42, ...feathers(sx > 0 ? 0.2 : Math.PI - 0.2, 5) });
    if (span > 14) for (let k = 0; k < 4; k++) s.line(...P(span - 2 - k * 2.6, 13 + lift + k * 0.6), ...P(span + 1 - k * 2.4, 17 + lift + k * 1.4), INK, 1, 0.9);
    s.line(...P(4, 19), ...P(span * 0.7, 17 + lift * 0.6), 0x5a6078, 1, 0.6); // the sheen along the coverts
  }
  // the tail fanned, the body, the head with its heavy beak toward us
  s.poly([[cx - 5, 6], [cx + 5, 6], [cx + 3, 15], [cx - 3, 15]], 'k', { flat: 0.38, ...feathers(Math.PI / 2, 9) });
  s.ellipse(cx, 20, 6, 9, 'k', { bias: 0.04, ...feathers(Math.PI / 2, 3) });
  s.ellipse(cx, 30, 5, 4.6, 'k', { bias: 0.06 });
  s.poly([[cx - 2.6, 32], [cx + 2.6, 32], [cx + 0.8, 39], [cx - 0.8, 39]], 'x', { flat: 0.32 });
  s.line(cx, 33, cx, 38, 0x14141c, 1);
  for (const sx of [-1, 1]) s.px(cx + sx * 2.8, 29.5, 0xd8dce8);
  return s.render();
}

// ---------------------------------------------------------------- diver: a spinning top (15 x 19 -> 45 x 57), turning fast
export function koma(f) {
  const s = new HiSprite(45, 57, RAMPS);
  const [cx, cy] = [22.5, 26];
  const rot = (f / 4) * (TAU / 6);
  // the body seen from above: rings of lacquer in red, gold and black, stripes turning with it
  s.ellipse(cx, cy, 19, 19, 'N', { bias: 0.04, pat: mottle({ amt: 0.06 }) });
  for (const [r, m] of [[18, 'R'], [14, 'Y'], [11, 'K'], [8, 'R'], [5, 'Y']]) s.ellipse(cx, cy, r, r, m, { bias: 0.05 });
  for (let k = 0; k < 6; k++) {
    const a = rot + (k / 6) * TAU;
    for (let r = 6; r < 18; r += 0.5) s.px(cx + Math.cos(a + r * 0.05) * r, cy + Math.sin(a + r * 0.05) * r, k % 2 ? 0x1a1420 : 0xf4f0e8, 0.85);
  }
  // the blur of its spin round the rim, the knob in the middle
  for (let a = 0; a < TAU; a += 0.05) if (Math.sin(a * 3 + f * 1.6) > 0.3) s.px(cx + Math.cos(a) * 20.5, cy + Math.sin(a) * 20.5, 0xf4e0c0, 0.5);
  s.tube(cx, cy - 2, cx, cy - 7, 2.2, 'N');
  s.ellipse(cx, cy - 7, 2.6, 2.2, 'Y', { bias: 0.1 });
  // the iron tip under it toward us, a spark where it would touch
  s.poly([[cx - 3, cy + 18], [cx + 3, cy + 18], [cx, cy + 27]], 'S', { flat: 0.5 });
  if (f % 2) s.dot(cx, cy + 28, 1.2, 0xfff0a0);
  return s.render();
}

// ---------------------------------------------------------------- shooter: a neon sign off its wall (23 x 15 -> 69 x 45)
export function kanban(f) {
  const s = new HiSprite(69, 45, RAMPS);
  // the box of sheet steel, its bracket torn off at the top, wires hanging
  s.poly([[6, 8], [63, 8], [63, 38], [6, 38]], 'K', { flat: 0.45, pat: speckle({ amt: 0.12 }) });
  s.poly([[9, 11], [60, 11], [60, 35], [9, 35]], 'x', { flat: 0.22 });
  for (const x of [16, 52]) {
    s.tube(x, 8, x, 2, 1.4, 'S');
    s.line(x - 2, 2, x + 2, 1, 0x8a8a90, 1);
  }
  s.line(28, 38, 25, 43, 0x2a2a30, 1);
  s.line(40, 38, 44, 44, 0x8a2a20, 1);
  // the tubes: no writing, pictures in light - a cup with its steam, an arrow, a star - lit a part at a time
  const on = [[1, 1, 1, 1, 1], [1, 0, 1, 1, 0], [1, 1, 0, 1, 1], [1, 1, 1, 0, 1]][f];
  const star = Array.from({ length: 11 }, (_, k) => {
    const r = k % 2 ? 3.2 : 7.4;
    const a = -Math.PI / 2 + (k / 10) * TAU;
    return [51 + Math.cos(a) * r, 23 + Math.sin(a) * r];
  });
  const cup = [[11, 18], [12, 29], [21, 29], [22, 18]];
  const handle = Array.from({ length: 7 }, (_, k) => [22 + Math.sin((k / 6) * Math.PI) * 4, 20 + k * 1.2]);
  const steam = [0, 1].map((q) => Array.from({ length: 6 }, (_, k) => [14 + q * 5 + Math.sin(k * 1.3 + q) * 1.4, 16 - k * 1.2]));
  const arrow = [[[27, 23], [41, 23]], [[36, 18], [41, 23], [36, 28]]];
  const parts = [[cup, handle], steam, arrow, [star], [[[11, 31.5], [22, 31.5]]]];
  parts.forEach((group, k) => {
    const m = k === 2 || k === 4 ? 'e' : 'n';
    for (const pts of group)
      for (let i = 0; i + 1 < pts.length; i++) {
        if (on[k]) s.tube(...pts[i], ...pts[i + 1], 1.2, m, { glow: true });
        else s.line(...pts[i], ...pts[i + 1], 0x4a3a48, 2);
      }
  });
  // its frame of bulbs, chasing round
  for (let k = 0; k < 26; k++) {
    const t = k / 26;
    const [x, y] = t < 0.35 ? [7 + (t / 0.35) * 55, 9.5] : t < 0.5 ? [62, 9.5 + ((t - 0.35) / 0.15) * 27] : t < 0.85 ? [62 - ((t - 0.5) / 0.35) * 55, 36.5] : [7, 36.5 - ((t - 0.85) / 0.15) * 27];
    s.dot(x, y, 0.9, (k + f) % 3 ? 0x6a5a40 : 0xfff0a0);
  }
  return s.render();
}

// ---------------------------------------------------------------- carrier: a truck of adverts (15 x 19 -> 45 x 57), its nose down
export function adTruck(color, f) {
  const s = new HiSprite(45, 57, RAMPS);
  const m = COL[color];
  // the box on its back: a hoarding of the colour it carries, pictures of nothing on it, two horns on the roof
  s.poly([[7, 3], [38, 3], [38, 38], [7, 38]], m, { flat: 0.55, pat: mottle({ amt: 0.06 }) });
  s.poly([[9, 5], [36, 5], [36, 36], [9, 36]], m, { flat: 0.72 });
  for (let k = 0; k < 4; k++) s.line(11, 9 + k * 7, 34, 9 + k * 7 + (k % 2 ? 2 : -1), 0xffffff, 2, 0.8);
  s.ellipse(22.5, 22, 6, 6, 'W', { flat: 0.85 });
  s.dot(22.5, 22, 3, HEX[color]);
  // the loudspeakers, booming: rings going out from their mouths
  for (const sx of [-1, 1]) {
    s.poly([[22.5 + sx * 5, 6], [22.5 + sx * 9, 2], [22.5 + sx * 13, 6], [22.5 + sx * 9, 9]], 'S', { flat: 0.6 });
    s.dot(22.5 + sx * 9, 4.5, 1.4, INK);
    if (f % 2) for (let a = -0.9; a < 0.9; a += 0.08) s.px(22.5 + sx * 9 + Math.sin(a) * (4 + f), -0.5 + 4.5 - Math.cos(a) * (4 + f) * 0.5, 0xffffff, 0.5);
  }
  // the cab: white, the windscreen, mirrors, lamps
  s.poly([[8, 38], [37, 38], [37, 52], [33, 55], [12, 55], [8, 52]], 'W', { flat: 0.6, ...plastic(3) });
  s.poly([[11, 47], [34, 47], [32, 52], [13, 52]], 'C', { flat: 0.4 });
  for (const sx of [-1, 1]) s.poly([[22.5 + sx * 14.5, 45], [22.5 + sx * 17, 45], [22.5 + sx * 17, 48], [22.5 + sx * 14.5, 48]], 'K', { flat: 0.5 });
  for (const x of [11, 34]) s.dot(x, 54, 1.4, f % 2 ? 0xfff0a0 : 0xe0d8b0);
  // the wheels at its sides
  for (const [x, y] of [[6, 14], [39, 14], [6, 32], [39, 32], [6, 49], [39, 49]]) s.poly([[x - 1.5, y - 3], [x + 1.5, y - 3], [x + 1.5, y + 3], [x - 1.5, y + 3]], 'K', { flat: 0.3 });
  return s.render();
}

// ---------------------------------------------------------------- turret: an air-conditioning unit with a spotlight
export function acBase(wreck) {
  const s = new HiSprite(51, 51, RAMPS);
  if (wreck) {
    s.poly([[8, 10], [43, 12], [41, 42], [9, 40]], 'x', { flat: 0.28, pat: speckle({ amt: 0.3, dark: 0.15 }) });
    s.ellipse(25, 25, 11, 11, 'K', { flat: 0.15 });
    for (let k = 0; k < 3; k++) s.line(25, 25, 25 + Math.cos(k * 2.1) * 12, 25 + Math.sin(k * 2.1) * 12, 0x8a8a90, 2);
    s.dot(30, 20, 2, 0xff7a20);
    s.line(12, 38, 40, 14, INK, 2);
    return s.render();
  }
  // the outdoor unit seen from above: a grey cabinet on its pad, a big round grille over the fan, the pipes out
  s.poly([[3, 6], [48, 6], [48, 46], [3, 46]], 's', { flat: 0.5, pat: speckle({ amt: 0.1 }) });
  s.poly([[6, 8], [45, 8], [45, 43], [6, 43]], 'W', { flat: 0.62, ...plastic(7) });
  s.ellipse(22, 25.5, 14, 14, 'x', { flat: 0.3 });
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * TAU + 0.3;
    s.poly([[22, 25.5], [22 + Math.cos(a) * 12, 25.5 + Math.sin(a) * 12], [22 + Math.cos(a + 0.6) * 12, 25.5 + Math.sin(a + 0.6) * 12]], 'S', { flat: 0.52 });
  }
  for (let r = 4; r <= 14; r += 2.5) for (let a = 0; a < TAU; a += 0.04) s.px(22 + Math.cos(a) * r, 25.5 + Math.sin(a) * r, 0x3a3e46, 0.7);
  for (let y = 12; y < 40; y += 3) s.line(39, y, 43, y, 0x9aa0a8, 1);
  s.tube(44, 38, 49, 44, 1.6, 'u');
  s.tube(44, 34, 50, 38, 1.2, 'u');
  return s.render();
}
export function spotHead(i) {
  const s = new HiSprite(45, 45, RAMPS);
  const P = turned(22.5, 22.5, (i / 16) * TAU);
  // the lamp of a billboard on its arm: a drum, its lens toward the target, a hood, the cable round to the back
  s.tube(...P(-12, 0), ...P(-2, 0), 2.2, 'S');
  s.poly([P(-3, 9), P(13, 9), P(15, 7), P(15, -7), P(13, -9), P(-3, -9)], 'K', { flat: 0.5, pat: speckle({ amt: 0.1 }) });
  for (let k = 0; k < 4; k++) s.line(...P(1 + k * 3, 8.6), ...P(1 + k * 3, -8.6), 0x3a3e48, 1);
  s.poly([P(13, 7.5), P(17, 7.5), P(17, -7.5), P(13, -7.5)], 'l', { glow: true, flat: 0.7 });
  s.line(...P(15, 5), ...P(15, -5), 0xffffff, 1);
  s.ellipse(22.5, 22.5, 4, 4, 'Y', { bias: 0.08 });
  s.dot(...P(-12, 3), 1.2, 0x2a2a30);
  return s.render();
}

// ================================================================= centre
// ---------------------------------------------------------------- popcorn: a clear umbrella (15 x 15 -> 45 x 45), turning
export function kasa(f) {
  const s = new HiSprite(45, 45, RAMPS);
  const [cx, cy] = [22.5, 22.5];
  const rot = (f / 4) * (TAU / 8);
  const R = 20;
  const corner = (k) => [cx + Math.cos(rot + (k / 8) * TAU) * R, cy + Math.sin(rot + (k / 8) * TAU) * R];
  // eight panels of clear vinyl, each a little bellied, the ground seen through them (lit evenly, glassy)
  for (let k = 0; k < 8; k++) s.poly([[cx, cy], corner(k), corner(k + 1)], 'c', { glow: true, flat: k % 2 ? 0.55 : 0.68 });
  // the white ribs to the tips, the tips themselves, the cap in the middle, drops beading on it
  for (let k = 0; k < 8; k++) {
    const [x, y] = corner(k);
    s.line(cx, cy, x, y, 0xf4f8fc, 1);
    s.dot(x, y, 1.2, 0x3a3e46);
  }
  for (let k = 0; k < 8; k++) {
    const [ax, ay] = corner(k);
    const [bx, by] = corner(k + 1);
    for (let t = 0; t <= 1; t += 0.05) s.px(ax + (bx - ax) * t, ay + (by - ay) * t, 0xffffff, 0.8);
  }
  for (let k = 0; k < 7; k++) {
    const a = rot * 2 + k * 1.7;
    const r = 6 + ((k * 5) % 12);
    s.dot(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0.8, 0xffffff, 0.9);
  }
  s.ellipse(cx, cy, 2.6, 2.6, 'K', { bias: 0.1 });
  // the drops flung off its rim as it spins
  for (let k = 0; k < 3; k++) {
    const a = rot + (k / 3) * TAU + f * 0.5;
    s.dot(cx + Math.cos(a) * (R + 2.5), cy + Math.sin(a) * (R + 2.5), 0.9, 0xc8e8ff, 0.8);
  }
  return s.render({ outline: 1 });
}

// ---------------------------------------------------------------- diver: a crow diving, an umbrella in its beak (15 x 19 -> 45 x 57)
export function karasuKasa(f) {
  const s = new HiSprite(45, 57, RAMPS);
  const cx = 22.5;
  const tuck = [0, 1.5, 2.5, 1.5][f];
  // wings swept back in the dive, the tail spread to steer
  for (const sx of [-1, 1]) {
    const P = (x, y) => [cx + sx * x, y];
    s.poly([P(3, 18), P(14 - tuck, 10), P(19 - tuck * 2, 3), P(16 - tuck, 4), P(6, 15), P(3, 26)], 'k', { flat: 0.4, ...feathers(-Math.PI / 2, 4) });
    for (let k = 0; k < 3; k++) s.line(...P(17 - tuck * 2 - k * 2.4, 4 + k * 1.6), ...P(19 - tuck * 2 - k * 2.6, 1 + k * 1.8), INK, 1);
  }
  s.poly([[cx - 4, 2], [cx + 4, 2], [cx + 2.6, 13], [cx - 2.6, 13]], 'k', { flat: 0.38, ...feathers(Math.PI / 2, 8) });
  s.ellipse(cx, 22, 5.6, 10, 'k', { bias: 0.05, ...feathers(Math.PI / 2, 2) });
  s.ellipse(cx, 34, 4.8, 4.4, 'k', { bias: 0.06 });
  for (const sx of [-1, 1]) s.px(cx + sx * 2.6, 33.5, 0xd8dce8);
  // the beak, and the furled umbrella held across it: its navy cloth wound, the bamboo hook, the steel tip
  s.poly([[cx - 2.4, 36], [cx + 2.4, 36], [cx + 0.6, 41], [cx - 0.6, 41]], 'x', { flat: 0.32 });
  s.tube(cx - 17, 41, cx + 14, 39, 2.2, 'h', { rb: 1.4 });
  for (let k = 0; k < 6; k++) s.line(cx - 15 + k * 5, 39.6, cx - 13 + k * 5, 42, 0x101830, 1);
  s.line(cx + 14, 39, cx + 19, 38.4, 0xb8bcc4, 1);
  for (let a = 0; a < Math.PI; a += 0.15) s.px(cx - 18 - Math.sin(a) * 3, 41 + 3 - Math.cos(a) * 3, 0x8a5a30); // the hook of its handle
  return s.render();
}

// ---------------------------------------------------------------- shooter: a drone with a camera (23 x 15 -> 69 x 45)
export function cameraDrone(f) {
  const s = new HiSprite(69, 45, RAMPS);
  const [cx, cy] = [34.5, 21];
  // four arms to four rotors, each a disc of blur turning
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const [rx, ry] = [cx + sx * 23, cy + sy * 13];
    s.tube(cx + sx * 6, cy + sy * 3, rx, ry, 1.8, 'x');
    s.ellipse(rx, ry, 9, 6.5, 'c', { glow: true, flat: 0.3 });
    const a = f * 0.9 + (sx + sy) * 0.4;
    s.line(rx - Math.cos(a) * 9, ry - Math.sin(a) * 6.5, rx + Math.cos(a) * 9, ry + Math.sin(a) * 6.5, 0xe8eef4, 1, 0.8);
    s.ellipse(rx, ry, 2, 2, 'K', { bias: 0.1 });
  }
  // the body: white shell, a battery set into its back, the lamp blinking red as it films
  s.ellipse(cx, cy, 9, 7, 'W', { bias: 0.06, ...plastic(4) });
  s.poly([[cx - 4, cy - 6], [cx + 4, cy - 6], [cx + 4, cy - 1], [cx - 4, cy - 1]], 'x', { flat: 0.4 });
  s.dot(cx + 6, cy - 4, 1.2, f < 2 ? 0xff3030 : 0x5a2020);
  // the gimbal under its nose, the camera, its big lens looking at you
  s.tube(cx, cy + 6, cx, cy + 12, 1.6, 'K');
  s.poly([[cx - 6, cy + 12], [cx + 6, cy + 12], [cx + 6, cy + 20], [cx - 6, cy + 20]], 'K', { flat: 0.48 });
  s.ellipse(cx, cy + 17, 4.2, 3.6, 'C', { bias: 0.15 });
  s.dot(cx - 1.4, cy + 15.8, 1, 0xffffff);
  s.dot(cx, cy + 17, 1.6, 0x0a1830, 0.9);
  return s.render();
}

// ---------------------------------------------------------------- carrier: a rickshaw (15 x 19 -> 45 x 57), the puller in front
export function rickshaw(color, f) {
  const s = new HiSprite(45, 57, RAMPS);
  const m = COL[color];
  const cx = 22.5;
  // the two great wheels at its sides, spokes turning
  for (const sx of [-1, 1]) {
    const wx = cx + sx * 15.5;
    s.poly([[wx - 2, 6], [wx + 2, 6], [wx + 2, 30], [wx - 2, 30]], 'K', { flat: 0.35 });
    for (let k = 0; k < 5; k++) s.line(wx - 1.6, 8 + ((k * 5 + f * 2) % 22), wx + 1.6, 8 + ((k * 5 + f * 2) % 22), 0xc8a050, 1);
  }
  // the hood folded back in its colour, the seat with a blanket, a passenger looking about
  s.poly([[cx - 13, 4], [cx + 13, 4], [cx + 12, 16], [cx - 12, 16]], m, { flat: 0.5, pat: fur(0, { amt: 0.12, len: 10, w: 2 }) });
  for (let k = 1; k < 5; k++) s.line(cx - 12, 4 + k * 3, cx + 12, 4 + k * 3, 0x1a1420, 1, 0.5);
  s.poly([[cx - 12, 16], [cx + 12, 16], [cx + 12, 31], [cx - 12, 31]], 'K', { flat: 0.42 });
  s.poly([[cx - 10, 24], [cx + 10, 24], [cx + 10, 31], [cx - 10, 31]], m, { flat: 0.7 });
  s.ellipse(cx, 21, 4.2, 4, 'K', { bias: 0.1 }); // the passenger's hair
  s.ellipse(cx, 26, 5.6, 3.4, 'P', { flat: 0.55 });
  // the shafts out in front, and the puller between them: a straw hat, a happi of indigo, his legs going
  for (const sx of [-1, 1]) s.tube(cx + sx * 9, 30, cx + sx * 6, 50, 1.2, 'N');
  s.line(cx - 6, 50, cx + 6, 50, 0x5a3a20, 2);
  s.ellipse(cx, 41, 6, 4.2, 'h', { bias: 0.05 });
  s.ellipse(cx, 44, 5.4, 4.6, 'H', { bias: 0.08 });
  for (let a = 0; a < TAU; a += 0.3) s.px(cx + Math.cos(a) * 3, 44 + Math.sin(a) * 2.6, 0xa0782a, 0.8);
  for (const sx of [-1, 1]) s.tube(cx + sx * 2.2, 48, cx + sx * 2.2, 52 + (f % 2 === (sx > 0 ? 1 : 0) ? 2 : 0), 1.2, 'K');
  return s.render();
}

// ---------------------------------------------------------------- turret: a corner of the castle wall with a bronze gun
export function yaguraBase(wreck) {
  const s = new HiSprite(51, 51, RAMPS);
  if (wreck) {
    s.poly([[4, 8], [47, 6], [46, 46], [6, 44]], 's', { flat: 0.32, pat: crackle({ amt: 0.4 }) });
    for (let k = 0; k < 6; k++) s.ellipse(10 + k * 6, 20 + (k % 3) * 8, 3.4, 2.6, 's', { flat: 0.25 });
    s.line(8, 12, 40, 40, INK, 2);
    s.dot(26, 26, 2, 0xff7a20);
    return s.render();
  }
  // the stones of the wall, fitted, a white parapet on them with its loopholes, tiles along its top
  s.poly([[2, 4], [49, 4], [49, 49], [2, 49]], 's', { flat: 0.55, pat: crackle({ amt: 0.25, scale: 8 }) });
  for (let y = 6; y < 48; y += 6) for (let x = 3 + ((y / 6) % 2) * 4; x < 48; x += 8) s.line(x, y, x + 6, y, 0x5a5850, 1, 0.7);
  s.poly([[7, 9], [44, 9], [44, 44], [7, 44]], 'a', { flat: 0.68, pat: mottle({ amt: 0.05 }) });
  for (const [x0, y0, x1, y1] of [[5, 7, 46, 11], [5, 42, 46, 46], [5, 7, 9, 46], [42, 7, 46, 46]]) s.poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], 't', { flat: 0.5 });
  for (let x = 12; x < 42; x += 7) s.poly([[x, 43], [x + 3, 43], [x + 3, 45], [x, 45]], 'K', { flat: 0.2 }); // the loopholes
  s.ellipse(25.5, 26.5, 12, 12, 'N', { flat: 0.55, pat: fur(0, { amt: 0.15, len: 12, w: 1.6 }) }); // the turntable of planks
  for (let k = 0; k < 8; k++) s.dot(25.5 + Math.cos((k / 8) * TAU) * 10.5, 26.5 + Math.sin((k / 8) * TAU) * 10.5, 0.8, 0x2a2018);
  return s.render();
}
export function cannonHead(i) {
  const s = new HiSprite(45, 45, RAMPS);
  const P = turned(22.5, 22.5, (i / 16) * TAU);
  // the carriage of oak, its two cheeks, and the gun of bronze gone green: bands, the vent, a dolphin handle
  s.poly([P(-11, 8), P(8, 8), P(8, -8), P(-11, -8)], 'N', { flat: 0.5, pat: fur(0, { amt: 0.12, len: 8, w: 1.4 }) });
  for (const n of [-6.5, 6.5]) s.tube(...P(-10, n), ...P(7, n), 1.4, 'N', { bias: -0.05 });
  s.tube(...P(-12, 0), ...P(19, 0), 4.4, 'b', { rb: 3.4, pat: speckle({ amt: 0.15 }) });
  for (const t of [-9, -2, 8, 17]) s.line(...P(t, 4.2), ...P(t, -4.2), 0x2a3a2a, 1);
  s.ellipse(...P(-13, 0), 3, 3, 'b', { bias: 0.1 });
  s.dot(...P(19.5, 0), 2, INK);
  s.dot(...P(-6, 0), 0.9, 0x2a3a2a);
  return s.render();
}

// ================================================================= akiba
// a creature of our own in big pixels (11 x 10 cells)
// (a crystal with one eye, its little wings beating, a tail of two sparks under it)
const BLOB = [
  ['.....x.....', '....xxx....', 'x..xxxxx..x', 'xx.xxxxx.xx', 'xxxxowxxxxx', '.x.xwoxxx.x', '...xxxxx...', '....xxx....', '.....x.....', '....x.x....'],
  ['.....x.....', '....xxx....', '...xxxxx...', '...xxxxx...', 'xxxxowxxxxx', 'xx.xwoxxx.x', 'x..xxxxx..x', '....xxx....', '.....x.....', '...x...x...'],
];
// ---------------------------------------------------------------- popcorn: a sprite of eight bits (13 x 13 -> 39 x 39), blinking
export function pikuseru(f) {
  const s = new HiSprite(39, 39, RAMPS);
  const shape = BLOB[f % 2];
  const [body, dark] = f < 2 ? [0x60f0a0, 0x208a58] : [0xff70c0, 0xa02870];
  const [ox, oy] = [3, 4];
  shape.forEach((row, j) =>
    [...row].forEach((ch, i) => {
      if (ch === '.') return;
      const c = ch === 'o' ? 0x101018 : ch === 'w' ? 0xffffff : (i + j) % 5 === 0 ? dark : body;
      for (let b = 0; b < 3; b++) for (let a = 0; a < 3; a++) s.px(ox + i * 3 + a, oy + j * 3 + b, b === 0 && ch === 'x' ? 0xffffff : c, b === 0 && ch === 'x' ? 0.35 : 1);
    }),
  );
  return s.render({ outline: 2, grain: 0 });
}

// ---------------------------------------------------------------- diver: a game cartridge flying as a rocket (15 x 19 -> 45 x 57)
export function cartridge(f) {
  const s = new HiSprite(45, 57, RAMPS);
  const cx = 22.5;
  // the flame out of its contacts at the back (the top: it dives down)
  const fl = [8, 11, 9, 12][f];
  s.poly([[cx - 7, 9], [cx + 7, 9], [cx + 3, 9 - fl * 0.7], [cx, 9 - fl], [cx - 3, 9 - fl * 0.7]], 'l', { glow: true, flat: 0.6 });
  s.poly([[cx - 4, 9], [cx + 4, 9], [cx, 9 - fl * 0.6]], 'l', { glow: true, flat: 0.95 });
  // the grey shell: its ridges, the notch, the label of stripes and a star (no name on it)
  s.poly([[cx - 13, 9], [cx + 13, 9], [cx + 13, 50], [cx + 9, 54], [cx - 9, 54], [cx - 13, 50]], 'x', { flat: 0.55, ...plastic(5) });
  for (let y = 12; y < 18; y += 2) s.line(cx - 12, y, cx + 12, y, 0x4a4e58, 1);
  s.poly([[cx - 10, 21], [cx + 10, 21], [cx + 10, 47], [cx - 10, 47]], 'p', { flat: 0.75 });
  for (let k = 0; k < 4; k++) s.poly([[cx - 10, 23 + k * 6], [cx + 10, 23 + k * 6], [cx + 10, 26 + k * 6], [cx - 10, 26 + k * 6]], ['R', 'Q', 'Y', 'B'][k], { flat: 0.6 });
  for (let k = 0; k < 5; k++) s.line(cx, 31, cx + Math.cos(-Math.PI / 2 + (k / 5) * TAU) * 6, 34 + Math.sin(-Math.PI / 2 + (k / 5) * TAU) * 6, 0xffffff, 2);
  s.dot(cx, 34, 2, 0xfff0a0);
  // fins
  for (const sx of [-1, 1]) s.poly([[cx + sx * 13, 12], [cx + sx * 19, 6], [cx + sx * 19, 16], [cx + sx * 13, 22]], 'R', { flat: 0.55 });
  return s.render();
}

// ---------------------------------------------------------------- shooter: a capsule from the machines that opens (19 x 19 -> 57 x 57)
export function capsule(f) {
  const s = new HiSprite(57, 57, RAMPS);
  const [cx, cy] = [28.5, 30];
  const open = [0, 3, 7, 3][f];
  // the bottom half, sea-green (no colours of anybody's mark); the top half clear, lifted as it opens, the glow
  // inside showing through
  const inC = (x, y, oy) => (x - cx) ** 2 + (y - oy) ** 2 <= 400;
  s.paint([cx - 21, cy, cx + 21, cy + 21], (x, y) => y >= cy && inC(x, y, cy), 'G', ball(cx, cy, 20, 20), plastic(6));
  s.paint([cx - 21, cy - open - 21, cx + 21, cy - open], (x, y) => y < cy - open && inC(x, y, cy - open), 'c', () => 0.6, { glow: true });
  s.line(cx - 20, cy, cx + 20, cy, 0xe8f0d0, 2, 0.8);
  // inside: a little star of light that fires when the lid is up
  s.dot(cx, cy - open * 0.4, 5 + open * 0.5, 0xfff070, 0.9);
  for (let k = 0; k < 5; k++) s.line(cx, cy - open * 0.4, cx + Math.cos(-Math.PI / 2 + (k / 5) * TAU) * (6 + open), cy - open * 0.4 + Math.sin(-Math.PI / 2 + (k / 5) * TAU) * (6 + open), 0xfff8c0, 2, open ? 1 : 0.6);
  s.dot(cx - 8, cy - open - 10, 2.2, 0xffffff, 0.9);
  s.ellipse(cx, cy + 14, 8, 2, 'Y', { flat: 0.7 }); // a band of yellow round its foot
  return s.render();
}
const ball = (cx, cy, rx, ry) => (x, y) => {
  const dx = (x - cx) / rx;
  const dy = (y - cy) / ry;
  const z = Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy));
  return 0.36 + 0.56 * Math.max(0, -0.5 * dx - 0.6 * dy + 0.6 * z);
};

// ---------------------------------------------------------------- carrier: a van full of capsules (15 x 19 -> 45 x 57)
export function capsuleVan(color, f) {
  const s = new HiSprite(45, 57, RAMPS);
  const m = COL[color];
  const cx = 22.5;
  s.poly([[7, 4], [38, 4], [38, 50], [34, 54], [11, 54], [7, 50]], 'W', { flat: 0.6, ...plastic(8) });
  // the rack on its roof, a pile of capsules in its colour and clear ones
  s.poly([[9, 7], [36, 7], [36, 38], [9, 38]], 'x', { flat: 0.3 });
  for (let k = 0; k < 14; k++) {
    const [x, y] = [12.5 + (k % 4) * 6.6 + (Math.floor(k / 4) % 2) * 3, 11 + Math.floor(k / 4) * 7.4];
    if (x > 34) continue;
    s.ellipse(x, y, 3.2, 3.2, k % 3 ? m : 'c', { bias: 0.1, glow: k % 3 === 0 });
    s.line(x - 3, y, x + 3, y, 0xffffff, 1, 0.6);
  }
  // the windscreen, its lamps, a light on the roof turning
  s.poly([[10, 42], [35, 42], [33, 49], [12, 49]], 'C', { flat: 0.42 });
  for (const x of [11, 34]) s.dot(x, 53, 1.4, 0xfff0a0);
  s.dot(cx, 40, 2, f % 2 ? HEX[color] : 0xfff0c0);
  for (const [x, y] of [[6, 15], [39, 15], [6, 46], [39, 46]]) s.poly([[x - 1.5, y - 3], [x + 1.5, y - 3], [x + 1.5, y + 3], [x - 1.5, y + 3]], 'K', { flat: 0.3 });
  return s.render();
}

// ---------------------------------------------------------------- turret: an arcade cabinet with a dish aerial
export function arcadeBase(wreck) {
  const s = new HiSprite(51, 51, RAMPS);
  if (wreck) {
    s.poly([[6, 6], [45, 8], [43, 45], [8, 43]], 'K', { flat: 0.3, pat: speckle({ amt: 0.3 }) });
    s.poly([[12, 12], [38, 14], [36, 30], [14, 28]], 'C', { flat: 0.2 });
    for (const [x0, y0, x1, y1] of [[12, 12, 36, 30], [36, 14, 16, 28]]) s.line(x0, y0, x1, y1, 0xd8f0ff, 1);
    s.dot(30, 36, 2, 0xff7a20);
    return s.render();
  }
  // the cabinet from above: its top with the lit marquee, the screen's glow, the panel with stick and buttons
  s.poly([[5, 3], [46, 3], [46, 48], [5, 48]], 'K', { flat: 0.45, pat: speckle({ amt: 0.08 }) });
  for (const x of [5, 44]) s.poly([[x, 3], [x + 2, 3], [x + 2, 48], [x, 48]], 'V', { flat: 0.6 });
  s.poly([[9, 6], [42, 6], [42, 14], [9, 14]], 'n', { glow: true, flat: 0.7 });
  for (let x = 12; x < 40; x += 4) s.line(x, 8, x + 2, 12, 0xffffff, 1);
  s.poly([[9, 16], [42, 16], [42, 32], [9, 32]], 'e', { glow: true, flat: 0.35 });
  for (let y = 17; y < 32; y += 2) s.line(10, y, 41, y, 0x0a3a48, 1, 0.4);
  s.poly([[7, 34], [44, 34], [44, 46], [7, 46]], 'x', { flat: 0.55 });
  s.dot(15, 40, 2.6, INK);
  s.dot(15, 39, 1.8, 0xe03030);
  for (const [k, c] of [[0, 0xf0c020], [1, 0x3a72f0], [2, 0x37b35a], [3, 0xe03030]]) s.dot(25 + k * 4.4, 40 - (k % 2) * 2, 1.6, c);
  return s.render();
}
export function dishHead(i) {
  const s = new HiSprite(45, 45, RAMPS);
  const P = turned(22.5, 22.5, (i / 16) * TAU);
  // a dish on its mast, tilted toward the target: the bowl, its ribs, the horn held out in front on three struts
  s.ellipse(22.5, 22.5, 4, 4, 'S', { bias: 0.1 });
  const bowl = [];
  for (let k = 0; k <= 16; k++) {
    const a = -Math.PI / 2 + (k / 16) * Math.PI;
    bowl.push(P(2 + Math.cos(a) * 4, Math.sin(a) * 14));
  }
  bowl.push(P(-6, 14), P(-6, -14));
  s.poly(bowl, 'W', { flat: 0.62, ...plastic(9) });
  for (const n of [-10, -5, 0, 5, 10]) s.line(...P(-5, n), ...P(5 - Math.abs(n) * 0.2, n), 0xb8bcc8, 1);
  for (const n of [-10, 0, 10]) s.line(...P(4, n), ...P(16, 0), 0x8a8e98, 1);
  s.ellipse(...P(17, 0), 2.4, 2.4, 'x', { bias: 0.1 });
  s.dot(...P(17.5, 0), 0.9, 0xff4040);
  return s.render();
}

// ================================================================= asakusa
// ---------------------------------------------------------------- popcorn: a paper lantern (13 x 17 -> 39 x 51), swinging
export function chochin(f) {
  const s = new HiSprite(39, 51, RAMPS);
  const cx = 19.5;
  const sw = [0, 1.6, 0, -1.6][f];
  s.tube(cx, 1, cx + sw * 0.3, 6, 1, 'K');
  s.ellipse(cx + sw * 0.4, 8, 8, 2.6, 'K', { bias: 0.1 });
  // the long body of paper on its ribs, glowing red-orange from the candle, a stroke of writing down it
  s.ellipse(cx + sw * 0.7, 25, 14, 16, 'r', { glow: true, flat: 0.75, pat: mottle({ amt: 0.1, scale: 4 }) });
  s.ellipse(cx + sw * 0.7 - 2, 22, 7, 9, 'l', { glow: true, flat: 0.55 });
  for (let y = 10; y < 41; y += 2.4) {
    const t = (y - 25) / 16;
    const hw = 14 * Math.sqrt(Math.max(0, 1 - t * t));
    s.line(cx + sw * 0.7 - hw, y, cx + sw * 0.7 + hw, y, 0x7a1810, 1, 0.45);
  }
  s.line(cx + sw * 0.7, 15, cx + sw * 0.7, 35, 0x1c1418, 2);
  s.line(cx + sw * 0.7 - 4, 20, cx + sw * 0.7 + 4, 22, 0x1c1418, 2);
  s.line(cx + sw * 0.7 - 3, 29, cx + sw * 0.7 + 4, 27, 0x1c1418, 2);
  s.ellipse(cx + sw, 42, 8, 2.6, 'K', { bias: 0.1 });
  // the tassel
  for (let k = 0; k < 5; k++) s.line(cx + sw * 1.2 - 2 + k, 44, cx + sw * 1.8 - 3 + k * 1.4, 50, 0xe8c040, 1);
  return s.render();
}

// ---------------------------------------------------------------- diver: a round fan (15 x 19 -> 45 x 57), fluttering
export function uchiwa(f) {
  const s = new HiSprite(45, 57, RAMPS);
  const cx = 22.5;
  const sq = [1, 0.92, 0.84, 0.92][f];
  // the handle of bamboo, the ribs fanning out to the round of paper, a goldfish painted on it among water lines
  s.tube(cx, 56, cx, 34, 2.2, 'N', { rb: 1.8, pat: fur(Math.PI / 2, { amt: 0.15, len: 6 }) });
  s.ellipse(cx, 19, 18 * sq, 17, 'p', { flat: 0.72, pat: mottle({ amt: 0.06 }) });
  for (let k = 0; k < 13; k++) {
    const a = Math.PI * (0.9 + (k / 12) * 1.2);
    s.line(cx, 34, cx + Math.cos(a) * 17.5 * sq, 19 + Math.sin(a) * 16.5 + 0, 0xd8ccb0, 1, 0.6);
  }
  for (let k = 0; k < 3; k++) for (let x = -14; x < 14; x += 0.5) s.px(cx + x * sq, 27 + k * 3 + Math.sin(x * 0.5 + k) * 1.2, 0x5a9ad8, 0.7);
  // the goldfish
  s.ellipse(cx - 2 * sq, 15, 6 * sq, 4, 'R', { flat: 0.65 });
  s.poly([[cx + 3 * sq, 15], [cx + 10 * sq, 10], [cx + 9 * sq, 15], [cx + 10 * sq, 20]], 'R', { flat: 0.55 });
  s.dot(cx - 6 * sq, 14, 0.9, INK);
  for (const [x, y] of [[-10, 8], [-12, 5], [-13, 2]]) s.dot(cx + x * sq, y + 3, 0.9, 0xa8d0f0);
  // its rim of red paper
  for (let a = 0; a < TAU; a += 0.02) s.px(cx + Math.cos(a) * 18 * sq, 19 + Math.sin(a) * 17, 0xc8302a);
  return s.render();
}

// ---------------------------------------------------------------- shooter: a stone lion-dog (19 x 19 -> 57 x 57), mouth open to shoot
export function komainu(f) {
  const s = new HiSprite(57, 57, RAMPS);
  const cx = 28.5;
  const open = f >= 2;
  const stone = { pat: mix2(crackle({ amt: 0.22, scale: 7 }), mottle({ amt: 0.12, scale: 5 })) };
  // its plinth, the body sitting up on its haunches, the curled tail behind, the mane of curls round its head
  s.ellipse(cx, 18, 12, 13, 's', { bias: 0.04, ...stone });
  for (let k = 0; k < 5; k++) s.ellipse(cx - 8 + k * 4, 7 + (k % 2) * 2, 3, 3, 's', { bias: 0.1 }); // the tail's curls, a flame of stone behind it
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * TAU;
    s.ellipse(cx + Math.cos(a) * 13, 34 + Math.sin(a) * 11, 3.6, 3.6, 's', { bias: 0.12, ...stone });
  }
  // the face: brows, round eyes, the nose, the mouth (open: a red glow, the shot coming; shut: teeth)
  s.ellipse(cx, 35, 11, 10, 's', { bias: 0.06, ...stone });
  for (const sx of [-1, 1]) {
    s.ellipse(cx + sx * 4.5, 31, 2.6, 2.4, 'W', { flat: 0.85 });
    s.dot(cx + sx * 4.5, 31.5, 1.2, open ? 0xff3020 : INK);
    s.line(cx + sx * 1.6, 27.4, cx + sx * 7.6, 28.4, 0x5a5850, 2);
  }
  s.ellipse(cx, 36, 3, 2.2, 's', { bias: 0.2 });
  if (open) {
    s.ellipse(cx, 41.5, 6, 3.6, 'M', { glow: true, flat: 0.6 });
    s.dot(cx, 41.5, 2.2, 0xfff0a0);
  } else {
    s.line(cx - 6, 41, cx + 6, 41, 0x3a3830, 1);
    for (const x of [-4, -1.4, 1.4, 4]) s.line(cx + x, 40, cx + x, 42, 0xe8e4d8, 1);
  }
  // its forepaws on the plinth's edge, a red bib tied round its neck
  for (const sx of [-1, 1]) s.ellipse(cx + sx * 8, 49, 4, 3.4, 's', { bias: 0.08 });
  s.poly([[cx - 8, 44], [cx + 8, 44], [cx + 4, 50], [cx - 4, 50]], 'R', { flat: 0.6 });
  return s.render();
}

// ---------------------------------------------------------------- carrier: a portable shrine on its bearers (15 x 19 -> 45 x 57)
export function mikoshi(color, f) {
  const s = new HiSprite(45, 57, RAMPS);
  const m = COL[color];
  const cx = 22.5;
  const bob = f % 2;
  // the bearers along the poles: heads in twisted headbands, coats in its colour, shoulders under the poles
  for (const sx of [-1, 1])
    for (let k = 0; k < 5; k++) {
      const [x, y] = [cx + sx * 17, 6 + k * 11 + ((k + (sx > 0 ? 1 : 0) + f) % 2) * 1.4];
      s.ellipse(x, y, 4.6, 3.6, m, { bias: 0.04 });
      s.ellipse(x, y - 0.4, 2.6, 2.4, 'K', { bias: 0.1 });
      s.line(x - 2.4, y - 1.6, x + 2.4, y - 1.6, 0xf4f0e8, 1);
    }
  for (const sx of [-1, 1]) s.tube(cx + sx * 13, 2, cx + sx * 13, 55, 1.6, 'N');
  for (const y of [9, 48]) s.tube(cx - 15, y, cx + 15, y, 1.2, 'N');
  // the shrine: its black-lacquered roof sweeping out in four slopes, gold on its ridges and eaves, the phoenix in
  // gold spreading its wings on top, bells at the corners
  const [t, B] = [13 - bob, 45 - bob];
  s.poly([[cx - 12, t - 1], [cx + 12, t - 1], [cx + 12, B + 1], [cx - 12, B + 1]], 'Y', { flat: 0.6 }); // the gold of the eaves
  s.poly([[cx - 10, t + 1], [cx + 10, t + 1], [cx + 10, B - 1], [cx - 10, B - 1]], 't', { flat: 0.5 });
  s.poly([[cx - 10, t + 1], [cx + 10, t + 1], [cx, (t + B) / 2]], 't', { flat: 0.74 });
  s.poly([[cx - 10, B - 1], [cx + 10, B - 1], [cx, (t + B) / 2]], 't', { flat: 0.3 });
  s.poly([[cx - 10, t + 1], [cx, (t + B) / 2], [cx - 10, B - 1]], 't', { flat: 0.6 });
  for (const [x0, y0, x1, y1] of [[cx - 11, t, cx + 11, B], [cx + 11, t, cx - 11, B]]) s.line(x0, y0, x1, y1, 0xf0c848, 2);
  for (const [x, y] of [[cx - 11, t], [cx + 11, t], [cx - 11, B], [cx + 11, B]]) s.dot(x, y, 1.6, 0xfff0a0);
  const m0 = (t + B) / 2;
  s.ellipse(cx, m0, 3.4, 4, 'Y', { bias: 0.15 });
  for (const sx of [-1, 1]) s.poly([[cx, m0 - 1], [cx + sx * 7, m0 - 5], [cx + sx * 6, m0 - 1], [cx + sx * 7, m0 + 2]], 'Y', { flat: 0.7 });
  s.poly([[cx - 1.4, m0 + 3], [cx + 1.4, m0 + 3], [cx, m0 + 8]], 'Y', { flat: 0.5 });
  // ropes of its colour hanging from the corners, tassels
  for (const sx of [-1, 1]) {
    s.line(cx + sx * 11, B, cx + sx * 8, 50, HEX[color], 2);
    s.dot(cx + sx * 8, 51, 1.6, HEX[color]);
  }
  return s.render();
}

// ---------------------------------------------------------------- turret: the censer with a stone fox on it
export function censerBase(wreck) {
  const s = new HiSprite(51, 51, RAMPS);
  if (wreck) {
    s.ellipse(25.5, 26, 19, 17, 'u', { flat: 0.25, pat: speckle({ amt: 0.3 }) });
    s.ellipse(25.5, 26, 11, 9, 'p', { flat: 0.3 });
    s.line(10, 14, 40, 38, INK, 2);
    s.dot(30, 30, 2, 0xff7a20);
    return s.render();
  }
  // the bronze bowl on its three feet, the ash in it, sticks of incense standing alight, its rim of lions' faces
  for (const a of [0.5, 2.6, 4.7]) s.ellipse(25.5 + Math.cos(a) * 18, 26 + Math.sin(a) * 16, 4, 4, 'u', { bias: 0.08 });
  s.ellipse(25.5, 26, 20, 18, 'b', { bias: 0.04, pat: speckle({ amt: 0.14 }) });
  s.ellipse(25.5, 26, 16, 14, 'u', { flat: 0.4 });
  s.ellipse(25.5, 26, 14, 12, 'p', { flat: 0.55, pat: speckle({ amt: 0.25, dark: 0.12 }) });
  for (let k = 0; k < 14; k++) {
    const [x, y] = [14 + ((k * 7) % 23), 18 + ((k * 5) % 16)];
    s.line(x, y, x + 0.5, y - 3, 0x6a8a5a, 1);
    s.px(x + 0.5, y - 3.5, 0xff7030);
  }
  for (let k = 0; k < 6; k++) s.dot(25.5 + Math.cos((k / 6) * TAU) * 18, 26 + Math.sin((k / 6) * TAU) * 16, 1.4, 0xc8a050);
  return s.render();
}
export function foxHead(i) {
  const s = new HiSprite(45, 45, RAMPS);
  const P = turned(22.5, 22.5, (i / 16) * TAU);
  const stone = { pat: mix2(crackle({ amt: 0.2, scale: 6 }), mottle({ amt: 0.1 })) };
  // a fox of stone seen from above: its body and the brush curled round, the head and long muzzle toward the target,
  // ears up, a jewel in its mouth glowing, a red bib
  s.ellipse(...P(-6, 0), 9, 8, 's', { bias: 0.04, ...stone });
  s.poly([P(-12, -6), P(-18, -2), P(-17, 6), P(-10, 8)], 's', { flat: 0.6, ...stone });
  s.ellipse(...P(5, 0), 6, 6, 's', { bias: 0.08, ...stone });
  s.poly([P(8, -4), P(17, -1.4), P(17, 1.4), P(8, 4)], 's', { flat: 0.62, ...stone });
  for (const n of [-4, 4]) s.poly([P(2, n * 0.6), P(-1, n * 1.6), P(4, n * 1.4)], 's', { flat: 0.5 });
  s.poly([P(1, -6), P(1, 6), P(-3, 5), P(-3, -5)], 'R', { flat: 0.6 });
  s.dot(...P(17.5, 0), 1.8, 0xfff070);
  for (const n of [-2.4, 2.4]) s.dot(...P(9, n), 0.8, 0xff3020);
  return s.render();
}

// ================================================================= bay
// ---------------------------------------------------------------- popcorn: a gull (17 x 13 -> 51 x 39), wings beating
export function kamome(f) {
  const s = new HiSprite(51, 39, RAMPS);
  const cx = 25.5;
  const span = [23, 20, 11, 18][f];
  const lift = [3, 0, -4, -1][f];
  for (const sx of [-1, 1]) {
    const P = (x, y) => [cx + sx * x, y];
    s.poly([P(3, 13), P(span * 0.5, 9 + lift * 0.5), P(span, 12 + lift), P(span * 0.55, 18), P(3, 21)], 'g', { flat: 0.6, ...feathers(sx > 0 ? 0.1 : Math.PI - 0.1, 6) });
    s.poly([P(span * 0.72, 10 + lift * 0.8), P(span, 12 + lift), P(span * 0.8, 15 + lift * 0.4)], 'K', { flat: 0.4 }); // the black tips
    s.line(...P(5, 14), ...P(span * 0.6, 12 + lift * 0.6), 0xa8b0bc, 1, 0.6);
  }
  s.poly([[cx - 3.6, 6], [cx + 3.6, 6], [cx + 2.4, 13], [cx - 2.4, 13]], 'g', { flat: 0.5 });
  s.ellipse(cx, 18, 4.6, 8, 'g', { bias: 0.06 });
  s.ellipse(cx, 27, 3.8, 3.6, 'g', { bias: 0.1 });
  s.poly([[cx - 1.2, 29.5], [cx + 1.2, 29.5], [cx, 34]], 'Q', { flat: 0.7 });
  s.px(cx, 32, 0xd02020);
  for (const sx of [-1, 1]) s.px(cx + sx * 2.2, 26.6, INK);
  return s.render();
}

// ---------------------------------------------------------------- diver: a delivery drone with its parcel (15 x 19 -> 45 x 57)
export function parcelDrone(f) {
  const s = new HiSprite(45, 57, RAMPS);
  const cx = 22.5;
  for (const [sx, y] of [[-1, 10], [1, 10], [-1, 42], [1, 42]]) {
    const rx = cx + sx * 15;
    s.tube(cx + sx * 4, y < 20 ? 18 : 34, rx, y, 1.6, 'x');
    s.ellipse(rx, y, 7, 7, 'c', { glow: true, flat: 0.28 });
    const a = f * 0.8 + sx * 0.6 + y * 0.1;
    s.line(rx - Math.cos(a) * 7, y - Math.sin(a) * 7, rx + Math.cos(a) * 7, y + Math.sin(a) * 7, 0xeef4f8, 1, 0.8);
    s.ellipse(rx, y, 1.8, 1.8, 'K', { bias: 0.1 });
  }
  // the body in yellow and white, the parcel slung under: brown board, tape, a label
  s.ellipse(cx, 26, 6.6, 9, 'Y', { bias: 0.06, ...plastic(10) });
  s.poly([[cx - 8, 22], [cx + 8, 22], [cx + 8, 36], [cx - 8, 36]], 'o', { flat: 0.6, pat: speckle({ amt: 0.12 }) });
  s.poly([[cx - 1.4, 22], [cx + 1.4, 22], [cx + 1.4, 36], [cx - 1.4, 36]], 'p', { flat: 0.4 });
  s.poly([[cx - 6.4, 30], [cx - 2.6, 30], [cx - 2.6, 34], [cx - 6.4, 34]], 'W', { flat: 0.85 });
  for (let k = 0; k < 3; k++) s.line(cx - 6, 31 + k, cx - 3, 31 + k, 0x2a2a30, 1, 0.6);
  s.dot(cx, 16, 1.2, f % 2 ? 0x30ff60 : 0x1a5a28);
  return s.render();
}

// ---------------------------------------------------------------- shooter: a buoy with a gun (19 x 19 -> 57 x 57)
export function gunBuoy(f) {
  const s = new HiSprite(57, 57, RAMPS);
  const [cx, cy] = [28.5, 30];
  // rings on the water round it, going out
  for (let k = 0; k < 2; k++) {
    const r = 21 + ((f + k * 2) % 4) * 1.6;
    for (let a = 0; a < TAU; a += 0.03) s.px(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.8 + 3, 0xc8dcec, 0.45 - ((f + k * 2) % 4) * 0.08);
  }
  // the float in red and white bands, its cage, the lamp on top, and the little gun turned on you
  s.ellipse(cx, cy + 2, 17, 15, 'R', { bias: 0.04, ...plastic(11) });
  for (const r of [12, 7]) for (let a = 0; a < TAU; a += 0.02) for (let q = 0; q < 2.5; q += 0.5) s.px(cx + Math.cos(a) * (r + q), cy + 2 + Math.sin(a) * (r + q) * 0.9, 0xf4f0e8, 0.92);
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * TAU + 0.78;
    s.tube(cx + Math.cos(a) * 9, cy + 2 + Math.sin(a) * 8, cx + Math.cos(a) * 3, cy - 4 + Math.sin(a) * 2.4, 1, 'S');
  }
  s.ellipse(cx, cy - 4, 4, 3.6, 'S', { bias: 0.1 });
  s.dot(cx, cy - 6, 2.2, f % 2 ? 0xfff070 : 0x8a7a30);
  s.tube(cx, cy + 2, cx, cy + 16, 2.4, 'D');
  s.dot(cx, cy + 16.5, 1.6, INK);
  return s.render();
}

// ---------------------------------------------------------------- carrier: a barge with containers (15 x 19 -> 45 x 57)
export function barge(color, f) {
  const s = new HiSprite(45, 57, RAMPS);
  const m = COL[color];
  const cx = 22.5;
  // its wake behind (the top: it comes down the screen)
  for (let k = 0; k < 8; k++) {
    const y = 4 - k * 0.6 + ((f * 2) % 4);
    s.px(cx - 12 - k * 0.8, y + k, 0xc8dcec, 0.5);
    s.px(cx + 12 + k * 0.8, y + k, 0xc8dcec, 0.5);
  }
  s.poly([[7, 5], [38, 5], [38, 46], [33, 54], [12, 54], [7, 46]], 'D', { flat: 0.48, pat: speckle({ amt: 0.12 }) });
  s.poly([[9, 7], [36, 7], [36, 45], [9, 45]], 'x', { flat: 0.34 });
  // three boxes in its colour, corrugated, doors at their ends
  for (let k = 0; k < 3; k++) {
    const y = 9 + k * 12;
    s.poly([[11, y], [34, y], [34, y + 10], [11, y + 10]], m, { flat: 0.6 });
    for (let x = 12; x < 34; x += 2) s.line(x, y + 0.6, x, y + 9.4, 0x1a1420, 1, 0.35);
    s.line(11, y + 0.4, 34, y + 0.4, 0xffffff, 1, 0.5);
  }
  s.poly([[14, 47], [31, 47], [29, 52], [16, 52]], 'W', { flat: 0.7 });
  for (const [x, c] of [[9, 0xff4030], [36, 0x40ff80]]) s.dot(x, 49, 1.2, c);
  return s.render();
}

// ---------------------------------------------------------------- turret: a container with a launcher on its roof
export function containerBase(wreck) {
  const s = new HiSprite(51, 51, RAMPS);
  if (wreck) {
    s.poly([[3, 12], [48, 10], [47, 40], [4, 42]], 'z', { flat: 0.26, pat: speckle({ amt: 0.3, dark: 0.15 }) });
    for (const [x0, y0, x1, y1] of [[8, 14, 42, 38], [42, 14, 10, 38]]) s.line(x0, y0, x1, y1, INK, 2);
    s.dot(26, 26, 2.4, 0xff7a20);
    return s.render();
  }
  // a box of corrugated steel seen from above, its roof cut open round the launcher's ring
  s.poly([[2, 9], [49, 9], [49, 42], [2, 42]], 'z', { flat: 0.55, pat: speckle({ amt: 0.1 }) });
  for (let x = 4; x < 48; x += 3) s.line(x, 10, x, 41, 0x7a3410, 1, 0.5);
  for (const x of [2, 47]) s.poly([[x, 9], [x + 2, 9], [x + 2, 42], [x, 42]], 'S', { flat: 0.5 });
  for (const [x, y] of [[3, 10], [46, 10], [3, 39], [46, 39]]) s.poly([[x, y], [x + 2.4, y], [x + 2.4, y + 2.4], [x, y + 2.4]], 'K', { flat: 0.4 });
  s.ellipse(25.5, 25.5, 11, 11, 'K', { flat: 0.2 });
  s.ellipse(25.5, 25.5, 9, 9, 'S', { bias: 0.06 });
  for (let k = 0; k < 10; k++) s.line(8, 44 + (k % 2), 43, 44 + (k % 2), (k >> 1) % 2 ? 0xe0b830 : 0x1c1c22, 1); // stripes on the ground at its foot
  return s.render();
}
export function launcherHead(i) {
  const s = new HiSprite(45, 45, RAMPS);
  const P = turned(22.5, 22.5, (i / 16) * TAU);
  // a box of four tubes on its turntable, the mouths toward the target, a warning stripe, the sight on its side
  s.poly([P(-10, 10), P(14, 10), P(14, -10), P(-10, -10)], 'D', { flat: 0.5, pat: speckle({ amt: 0.12 }) });
  for (const [t, n] of [[0, -5], [0, 5]]) {
    s.ellipse(...P(14, n - 2.4), 2.4, 2.4, 'K', { flat: 0.2 });
    s.ellipse(...P(14, n + 2.4), 2.4, 2.4, 'K', { flat: 0.2 });
    void t;
  }
  for (const n of [-7.4, -2.6, 2.6, 7.4]) s.dot(...P(14.5, n), 1.6, 0x1a1218);
  for (let k = 0; k < 6; k++) s.line(...P(-8 + k * 3, 9.6), ...P(-6 + k * 3, 9.6), k % 2 ? 0xe0b830 : 0x1c1c22, 2);
  s.poly([P(-4, -10), P(4, -10), P(4, -13), P(-4, -13)], 'x', { flat: 0.5 });
  s.dot(...P(3, -11.5), 1, 0xff3030);
  s.ellipse(22.5, 22.5, 3, 3, 'S', { bias: 0.1 });
  return s.render();
}

// ================================================================= the atlas
export function tokyoEnemies(add) {
  const colours = ['red', 'blue', 'green', 'purple'];
  for (let f = 0; f < 4; f++) {
    add(`t_karasu_${f}`, karasu(f));
    add(`t_koma_${f}`, koma(f));
    add(`t_kanban_${f}`, kanban(f));
    add(`t_kasa_${f}`, kasa(f));
    add(`t_kkasa_${f}`, karasuKasa(f));
    add(`t_camera_${f}`, cameraDrone(f));
    add(`t_pix_${f}`, pikuseru(f));
    add(`t_cart_${f}`, cartridge(f));
    add(`t_capsule_${f}`, capsule(f));
    add(`t_chochin_${f}`, chochin(f));
    add(`t_uchiwa_${f}`, uchiwa(f));
    add(`t_komainu_${f}`, komainu(f));
    add(`t_kamome_${f}`, kamome(f));
    add(`t_parcel_${f}`, parcelDrone(f));
    add(`t_buoy_${f}`, gunBuoy(f));
    for (const c of colours) {
      add(`t_truck_${c}_${f}`, adTruck(c, f));
      add(`t_rickshaw_${c}_${f}`, rickshaw(c, f));
      add(`t_van_${c}_${f}`, capsuleVan(c, f));
      add(`t_mikoshi_${c}_${f}`, mikoshi(c, f));
      add(`t_barge_${c}_${f}`, barge(c, f));
    }
  }
  for (const [name, base, head] of [['ac', acBase, spotHead], ['yagura', yaguraBase, cannonHead], ['arcade', arcadeBase, dishHead], ['censer', censerBase, foxHead], ['box', containerBase, launcherHead]]) {
    add(`t_${name}_base`, base(false));
    add(`t_${name}_wreck`, base(true));
    for (let i = 0; i < 16; i++) add(`t_${name}_${i}`, head(i));
  }
  kasaEnemies(add); // the first miniboss (kasa.mjs)
  taiyakiEnemies(add); // the second (taiyaki.mjs)
  kuroganeEnemies(add); // the mech, in parts (kurogane.mjs)
}
export const TOKYO_PORTRAITS = ['t_komainu_0', 't_karasu_0', 'kg_portrait', 'ko_portrait', 'ty_big_0_0'];
