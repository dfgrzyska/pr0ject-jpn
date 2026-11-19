// Kyoto's looks for the three shared behaviours (src/game/enemies/chainSplitCart.js, docs/plan-silniejsze-fale.md),
// drawn at 540 px with HiSprite:
//   chain  - omikuji, the shrines' paper fortunes, folded and knotted on a straw rope between two vermilion posts
//            over the streets of Gion and among the torii of Fushimi Inari: plain ones, unfolded ones glaring (a bad
//            fortune: these shoot), one catching the fox fire, the wisp of ash left of it
//   split  - kai-awase, the shells of the Heian court's matching game: a clam shell lacquered and gilt, its two
//            eyes peering out of the gap; then each half, its gold inside painted with pine and plum, on its own
//   cart   - a yamaboko of the Gion festival driving itself down the street: the float's black roof with its gilt
//            ridge, the halberd on its pole leaning out ahead, the woven hangings at its sides, a demon's face on the
//            hanging at its front, the four great wheels, the pulling ropes trailing with no one on them; it breaks up
//            in three stages (the halberd snapped, a wheel gone and the float limping, the roof on fire), its wreck
import { HiSprite, tones, speckle, mottle } from '../../lib/hisprite.mjs';

const INK = 0x141018;
const TAU = Math.PI * 2;
const RAMPS = {
  pp: tones([0xb0aca0, 0xf2eee4, 0xffffff]), // the omikuji's paper
  vm: tones([0x8a1e0e, 0xd8481e, 0xff9a60]), // vermilion
  lk: tones([0x0e0c12, 0x2a2630, 0x4e4a58]), // black lacquer
  kf: [0x1a2a8a, 0x3a7ae8, 0x8ad0ff, 0xd8f4ff, 0xffffff], // the fox fire, blue-white
  as: tones([0x2a2a34, 0x5a5a66, 0x8a8a96]), // ash
  st: tones([0x7a6a30, 0xb8a060, 0xe8d8a0]), // straw
  sh: tones([0x8a7050, 0xd8c4a0, 0xfff4e0]), // a clam's shell
  gd: tones([0x8a5a10, 0xe0a830, 0xfff0a0]), // gold leaf
  pn: tones([0x1a4a2a, 0x2a7a3a, 0x6ab85a]), // a painted pine
  pm: tones([0xa01a3a, 0xe04a6a, 0xffa0b0]), // a painted plum flower
  wd: tones([0x3a2414, 0x6a4a30, 0x9a7a54]), // wood
  tp: tones([0x6a0e1a, 0xc02a2a, 0xff7a5a]), // a hanging's red ground
  tb: tones([0x0e1e5a, 0x2a4aa8, 0x6a8ae8]), // its blue
  fl: tones([0xb82a08, 0xff8a1a, 0xfff2a0]), // flame
  ch: tones([0x0e0a08, 0x2a201a, 0x4a3a30]), // charred
};

// ---------------------------------------------------------------- chain: an omikuji (27 x 36), hung from the rope at y 3
function kuji(kind, f = 0) {
  const s = new HiSprite(27, 36, RAMPS);
  const c = 13.5;
  if (kind === 'burnt') {
    // a wisp of ash left on the knot, a last blue spark
    s.ellipse(c, 6, 3, 2.4, 'as', { flat: 0.5 });
    s.poly([[c - 2, 7], [c + 2, 7], [c + 3, 14], [c, 18], [c - 2, 13]], 'as', { flat: 0.45, pat: speckle({ amt: 0.3, seed: 4 }) });
    s.dot(c + 1, 15, 0.8, 0x8ad0ff, 0.9);
    return s.render({ outline: 2 });
  }
  // the knot over the rope: the slip folded long and tied round it
  s.ellipse(c, 5, 4.4, 2.6, 'pp', { bias: 0.1 });
  s.line(c - 3.6, 5, c + 3.6, 5, 0xb0aca0, 1, 0.8);
  const lit = kind === 'lit';
  if (kind === 'eye') {
    // unfolded, a bad fortune: the long slip hanging open, its red frame, its printed lines, the shrine's seal - and
    // a great eye glaring out of the middle
    s.poly([[c - 6, 7], [c + 6, 7], [c + 6.6, 33], [c - 5.4, 33]], 'pp', { flat: 0.68 });
    s.poly([[c - 5, 8.4], [c + 5, 8.4], [c + 5.4, 31.6], [c - 4.6, 31.6]], 'pp', { flat: 0.72 });
    for (const x of [c - 5, c + 5]) s.line(x, 8.4, x + 0.4, 31.6, 0xc8301e, 1, 0.9);
    for (let k = 0; k < 4; k++) s.line(c - 3 + k * 2, 10, c - 2.8 + k * 2, 14, 0x2a2420, 1, 0.55); // (lines of print)
    for (let k = 0; k < 4; k++) s.line(c - 3 + k * 2, 25, c - 2.8 + k * 2, 30, 0x2a2420, 1, 0.55);
    s.paint([c + 1, 27, c + 5, 31], (x, y) => x > c + 1.4 && x < c + 4.6 && y > 27.4 && y < 30.6, 'vm', () => 0.6); // the seal
    s.ellipse(c, 19.6, 4.8, f === 1 ? 0.8 : 3.6, 'W', { flat: 0.95 });
    if (f !== 1) {
      s.dot(c + 0.3, 19.8, 2.4, 0x3a7ae8);
      s.dot(c + 0.4, 19.9, 1.3, INK);
      s.dot(c - 1, 18.6, 0.6, 0xffffff);
    }
    s.line(c - 5, 15, c + 4.6, 16.4, INK, 1.4); // (its scowl)
    return s.render({ outline: 2 });
  }
  // folded long: two layers of paper hanging from the knot, the fold's edge, the red print showing through
  const sway = Math.sin(f * 1.7) * 0.6;
  s.poly([[c - 2.8, 7], [c + 2.8, 7], [c + 3.2 + sway, 27], [c - 2.4 + sway, 27]], 'pp', { bias: 0.1 });
  s.line(c + 0.4, 7, c + 0.8 + sway, 27, 0xc8c4b8, 1, 0.9);
  for (let y = 10; y < 25; y += 3.4) s.line(c - 1.6 + sway * (y / 27), y, c - 0.6 + sway * (y / 27), y, 0xc8301e, 1, 0.45);
  s.poly([[c - 2.4 + sway, 27], [c + 3.2 + sway, 27], [c + 0.4 + sway, 30]], 'pp', { flat: 0.5 }); // (the slip's end)
  if (lit) {
    // the fox fire catching: blue-white flames licking round it, wisps rising
    for (let k = -1; k <= 1; k++) s.ellipse(c + k * 3.6, 18 - (f + k + 2) % 3 * 2, 2.6, 6, 'kf', { flat: 0.8, glow: true });
    s.ellipse(c, 24, 4.4, 4, 'kf', { flat: 0.7, glow: true });
    for (let i = 0; i < 4; i++) s.dot(c - 6 + i * 4, 8 + ((i + f) % 3) * 2, 0.7, 0xd8f4ff);
  }
  return s.render({ outline: 2 });
}

/** A vermilion post the rope hangs from (21 x 21, seen from above): its black cap, the rope's knot. */
function post() {
  const s = new HiSprite(21, 21, RAMPS);
  s.poly([[6, 6], [15, 6], [15, 15], [6, 15]], 'vm', { bias: 0.1 });
  s.poly([[7.6, 7.6], [13.4, 7.6], [13.4, 13.4], [7.6, 13.4]], 'lk', { flat: 0.5 }); // (its cap)
  s.tube(1, 11, 20, 10, 1.3, 'st');
  return s.render({ outline: 2 });
}

// ---------------------------------------------------------------- split: kai-awase (closed 48 x 44, a half 32 x 30)
function shell(f) {
  const s = new HiSprite(48, 44, RAMPS);
  const [c, my] = [24, 22];
  const gap = [1.2, 1.8, 2.6, 1.8][f]; // (the valves parting a little, as it breathes)
  // the clam seen from its front edge: two valves, each an arc bulging away from the seam between them, their
  // growth rings, the gilt rims along the seam; the eyes peering out of the dark gap
  const valve = (x, y, sy) => {
    const dy = (y - my) * sy - gap / 2;
    const w = 21 * Math.sqrt(Math.max(0, 1 - (dy / 17) ** 2));
    return dy >= 0 && dy < 17 && Math.abs(x - c) < w;
  };
  for (const sy of [-1, 1]) {
    s.paint([1, 1, 47, 43], (x, y) => valve(x, y, sy), 'sh', (x, y) => (sy < 0 ? 0.72 : 0.5) - Math.abs(x - c) * 0.008, { pat: mottle({ amt: 0.08, scale: 3, seed: 3 + sy }) });
    for (let r = 4; r < 17; r += 3.4)
      s.paint([1, 1, 47, 43], (x, y) => {
        const dy = (y - my) * sy - gap / 2;
        return valve(x, y, sy) && Math.abs(Math.hypot((x - c) / 1.24, 17 - dy) - (17 - r)) < 0.4;
      }, 'sh', () => (sy < 0 ? 0.5 : 0.34));
    s.paint([1, 1, 47, 43], (x, y) => valve(x, y, sy) && (y - my) * sy - gap / 2 < 2.2, 'gd', () => 0.72); // (the gilt rim)
  }
  // a little gilt pine painted on the upper valve, the knob of its hinge at the top
  s.ellipse(c, 11, 4.4, 2.6, 'pn', { flat: 0.6 });
  s.line(c, 11, c, 15, 0x6a4a30, 1);
  s.ellipse(c, 5.6, 3.6, 1.8, 'sh', { bias: 0.2 });
  // the gap: dark inside, two eyes glaring out of it
  s.paint([c - 20, my - gap, c + 20, my + gap], (x, y) => Math.abs(y - my) < gap / 2 + 0.2 && Math.abs(x - c) < 19, 'K', () => 0.1);
  for (const sx of [-1, 1]) {
    s.ellipse(c + sx * 7, my, 3.2, Math.max(0.9, gap * 0.75), 'W', { flat: 0.95 });
    if (gap > 1.4) s.dot(c + sx * 6.4, my, Math.min(1.3, gap * 0.5), 0xff3a20);
  }
  return s.render({ outline: 2 });
}

function shellHalf(f) {
  const s = new HiSprite(32, 30, RAMPS);
  const c = 16;
  // a half seen from inside: gold leaf, a painted pine on a bank and a branch of plum in flower - and two eyes in
  // the gold glaring out at the ship
  const inside = (x, y) => Math.hypot((x - c) / 1.15, (y - 4) * 1.1) < 14 && y > 3;
  s.paint([1, 2, 31, 29], inside, 'sh', () => 0.55);
  s.paint([1, 2, 31, 29], (x, y) => inside(x, y) && Math.hypot((x - c) / 1.15, (y - 4) * 1.1) < 12.4, 'gd', (x, y) => 0.55 + (f ? 0.05 : 0) + Math.sin(x * 0.5 + y * 0.3) * 0.05);
  s.ellipse(c - 5, 19, 4, 2.4, 'pn', { flat: 0.55 });
  s.ellipse(c - 7, 16, 3, 1.8, 'pn', { flat: 0.65 });
  s.line(c - 5, 19, c - 4, 24, 0x6a4a30, 1);
  s.line(c + 2, 22, c + 9, 15, 0x4a2a1a, 1);
  for (const [x, y] of [[c + 4, 19], [c + 7, 16], [c + 9, 18.6]]) s.dot(x, y, 1.3, 0xe04a6a);
  for (const sx of [-1, 1]) {
    s.ellipse(c + sx * 4, 10, 2.2, 1.8, 'W', { flat: 0.95 });
    s.dot(c + sx * 3.6, 10.4, 1, INK);
    s.line(c + sx * 1.6, 7.4, c + sx * 6.4, 8.4, INK, 1.2);
  }
  return s.render({ outline: 2 });
}

// ---------------------------------------------------------------- cart: a yamaboko (60 x 78), driving down the screen
function hoko(stage, f) {
  const s = new HiSprite(60, 78, RAMPS);
  const c = 30;
  const limp = stage >= 2;
  const tilt = limp ? 2 : 0;
  // the pulling ropes trailing out ahead (down the screen), slack, no one on them
  for (const sx of [-1, 1]) for (let y = 62; y < 77; y += 0.5) s.px(c + sx * 6 + Math.sin(y * 0.5 + f + sx) * 1.2 + tilt * 0.5, y, 0xd8c8a0);
  // the four great wheels at its sides, their spokes going round, iron tyres
  const wheel = (x, y) => {
    s.poly([[x - 3, y - 9], [x + 3, y - 9], [x + 3, y + 9], [x - 3, y + 9]], 'wd', { flat: 0.5 });
    for (let k = 0; k < 4; k++) {
      const yy = y - 8 + ((k * 4.6 + f * 2.3) % 17);
      s.line(x - 3, yy, x + 3, yy, 0x2a1e14, 1, 0.8);
    }
    s.line(x - 3, y - 9, x - 3, y + 9, 0x3a3a40, 1);
  };
  wheel(c - 21, 22);
  wheel(c - 21, 52);
  wheel(c + 21, 22 + tilt);
  if (!limp) wheel(c + 21, 52);
  else for (let k = 0; k < 4; k++) s.line(c + 18, 52 + tilt, c + 21 + k, 49 + tilt + k * 1.6, 0x9a7a54, 1); // (the axle's broken end)
  // the woven hangings down its sides, red with gold and blue roundels
  for (const sx of [-1, 1]) {
    const x0 = sx < 0 ? c - 18 : c + 14;
    s.poly([[x0, 12], [x0 + 4, 12 + (sx > 0 ? tilt : 0)], [x0 + 4, 62 + (sx > 0 ? tilt : 0)], [x0, 62]], 'tp', { flat: 0.55 });
    for (let y = 16; y < 60; y += 7) s.dot(x0 + 2, y + (sx > 0 ? tilt : 0), 1.3, y % 14 ? 0xe0a830 : 0x2a4aa8);
  }
  // the roof: black lacquer, gabled, its eaves flaring out at the corners as a temple's do, its gilt ridge down
  // the middle with gilt crests at its ends, gilt fittings on the corners
  const ry = tilt * 0.5;
  const eave = (y) => 14 + Math.max(0, 1 - Math.min(y - 10, 60 - y) / 7) ** 2 * 4; // (half-width: flaring at the ends)
  s.paint([c - 19, 8 + ry, c + 19, 62 + ry], (x, y) => y > 8 + ry && y < 62 + ry && Math.abs(x - c - tilt * 0.3) < eave(y - ry), 'lk', (x, y) => (x < c ? 0.66 : 0.46) + Math.sin(y * 1.6) * 0.04);
  for (let y = 12; y < 60; y += 3) for (const sx of [-1, 1]) s.line(c + sx * 2, y + ry, c + sx * (eave(y) - 1), y + ry, 0x3a3644, 1, 0.5); // (its tiles' rows)
  s.line(c, 9 + ry, c, 61 + ry, 0xe0a830, 1.6);
  for (const y of [10, 60]) s.ellipse(c, y + ry, 2.6, 2, 'gd', { bias: 0.2 }); // (the ridge's crests)
  for (const [x, y] of [[c - 17, 10], [c + 17, 10], [c - 17, 60], [c + 17, 60]]) s.dot(x, y + ry, 1.4, 0xffd860);
  // the pole up through the roof: a bunch of green sakaki at its foot, a band of red and white, the halberd on top
  // leaning out ahead over the street, its blade flashing - snapped off once hit
  s.ellipse(c, 34 + ry, 5, 4, 'pn', { bias: 0.1, pat: speckle({ amt: 0.3, seed: 7 }) });
  if (stage === 0) {
    s.tube(c, 34 + ry, c + 6, 2, 1.6, 'wd');
    for (let k = 0; k < 4; k++) s.line(c + 1.6 + k * 0.2, 24 - k * 1.4, c + 2.6 + k * 0.2, 24 - k * 1.4, k % 2 ? 0xffffff : 0xd8281e, 2);
    s.poly([[c + 4.6, 5], [c + 9, -1], [c + 8, 6], [c + 6.6, 8]], 'W', { flat: 0.95 });
    s.line(c + 5, 6, c + 8.4, 0, 0xc8e0ff, 1, 0.9);
  } else {
    s.tube(c, 34 + ry, c + 2, 22, 1.6, 'wd');
    for (let k = 0; k < 4; k++) s.line(c + 2, 22, c + k - 1, 18.6 - k, 0x9a7a54, 1); // (splintered)
  }
  // the front hanging: a demon's face woven on it, glaring - red-eyed once it is angered
  const fy = 66 + ry;
  s.poly([[c - 15, fy - 4], [c + 15, fy - 4 + tilt * 0.4], [c + 15, fy + 8 + tilt * 0.4], [c - 15, fy + 8]], 'tb', { flat: 0.55 });
  for (const sx of [-1, 1]) for (let y = fy - 3; y < fy + 8; y += 3) s.dot(c + sx * 13.6, y, 0.9, 0xe0a830);
  for (const sx of [-1, 1]) {
    s.ellipse(c + sx * 5.4, fy + 0.6, 3.6, 2.6, 'W', { flat: 0.95 });
    s.dot(c + sx * 5, fy + 0.8, 1.6, stage >= 1 ? 0xff3a20 : 0xe0a830);
    s.dot(c + sx * 5, fy + 0.8, 0.7, INK);
    s.line(c + sx * 1.2, fy - 3.4, c + sx * 9.6, fy - 1.4, INK, 1.6);
  }
  s.paint([c - 5, fy + 3, c + 5, fy + 8], (x, y) => Math.abs(x - c) < 4.6 - (y - fy - 3) * 0.3 && y > fy + 3.6, 'K', () => 0.3);
  for (const sx of [-1, 1]) s.poly([[c + sx * 3.4, fy + 3.8], [c + sx * 2.2, fy + 3.8], [c + sx * 2.8, fy + 6.6]], 'W', { flat: 0.95 }); // (its fangs)
  if (stage >= 3) {
    for (let k = 0; k < 5; k++) {
      const x = c - 11 + k * 5.4;
      const h = 6 + ((k * 3 + f * 2) % 5);
      s.paint([x - 3, 16 - h, x + 3, 30], (px, py) => {
        const t = (28 - py) / (h + 12);
        return t > 0 && t < 1 && Math.abs(px - x) < 2.8 * (1 - t) + 0.6;
      }, 'fl', (px, py) => 0.5 + (28 - py) / (h + 12) * 0.45, { glow: true });
    }
  }
  return s.render({ outline: 2 });
}

function hokoWreck() {
  const s = new HiSprite(60, 78, RAMPS);
  const c = 30;
  // the float tipped on its side across the street: the roof caved in and charred, a hanging torn, a wheel off
  s.poly([[c - 16, 14], [c + 14, 18], [c + 16, 58], [c - 14, 56]], 'ch', { flat: 0.55, pat: speckle({ amt: 0.2, seed: 9 }) });
  s.line(c - 1, 15, c + 1, 57, 0x6a5020, 1.2);
  s.poly([[c + 14, 18], [c + 19, 20], [c + 20, 50], [c + 16, 52]], 'tp', { flat: 0.4, pat: speckle({ amt: 0.3, dark: 0.3, seed: 4 }) });
  s.ellipse(c - 20, 60, 8, 8, 'wd', { flat: 0.4 });
  for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; s.line(c - 20, 60, c - 20 + Math.cos(a) * 7, 60 + Math.sin(a) * 7, 0x2a1e14, 1); }
  s.tube(c - 4, 40, c + 12, 70, 1, 'ch'); // (the pole fallen)
  for (let i = 0; i < 6; i++) s.dot(c - 8 + i * 3.4, 26 + (i % 3) * 8, 0.9, 0xff7020, 0.8);
  return s.render({ outline: 2 });
}

/** Kyoto's frames for the shared behaviours (skins.js: kyoto chain, split, cart). */
export function kyotoNewFoes(add) {
  add('ky_kuji_0', kuji('plain'));
  for (let f = 0; f < 2; f++) add(`ky_kuji_eye_${f}`, kuji('eye', f));
  for (let f = 0; f < 2; f++) add(`ky_kuji_lit_${f}`, kuji('lit', f));
  add('ky_kuji_burnt', kuji('burnt'));
  add('ky_pole', post());
  for (let f = 0; f < 4; f++) add(`ky_kai_${f}`, shell(f));
  for (let f = 0; f < 2; f++) add(`ky_kai_one_${f}`, shellHalf(f));
  for (let st = 0; st < 4; st++) for (let f = 0; f < 2; f++) add(`ky_hoko_${st}_${f}`, hoko(st, f));
  add('ky_hoko_wreck', hokoWreck());
}
