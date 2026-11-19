// Nagasaki's looks for the three shared behaviours (src/game/enemies/chainSplitCart.js, docs/plan-silniejsze-fale.md),
// drawn at 540 px with HiSprite:
//   chain  - signal flags dressing a halyard between two steel posts over the shipyard's craneway and the coast road
//            by the quays: Alfa, Delta, Kilo and Uniform in turn; India, the yellow flag with the black ball, is the
//            one that wakes - its ball opens into an eye and glares (these shoot); one catching fire, the charred
//            rag left on the line
//   split  - kakuni-manju of Shinchi's Chinatown, two on the paper in a bamboo steamer, steam rising, both glaring;
//            then each one on its own: the folded white bun, the slab of braised pork belly and a leaf of lettuce
//   cart   - the whale of the Kunchi festival (kujira no shiofuki) driving itself down Shinchi's main street: the
//            black whale on its float, spouting, its flukes up behind, the float's skirt of blue cloth with white
//            waves, the four wheels, the pulling ropes trailing with no one on them; it breaks up in three stages
//            (the skirt torn open and the spout sputtering: it sees, red-eyed; a wheel gone and the float limping;
//            its back on fire), its wreck tipped over on the street
import { HiSprite, tones, speckle, mottle } from '../../lib/hisprite.mjs';

const INK = 0x14101c;
const TAU = Math.PI * 2;
const RAMPS = {
  fw: tones([0xa8a8a8, 0xf0f0ec, 0xffffff]), // a flag's white
  fb: tones([0x0e1e6a, 0x1e3ea8, 0x4a6ee0]), // its blue
  fy: tones([0xb08a08, 0xf0c818, 0xfff07a]), // its yellow
  fr: tones([0x8a0e10, 0xd8241e, 0xff6a50]), // its red
  st: tones([0x3a4048, 0x6a727c, 0xa8b0ba]), // steel
  fl: tones([0xb82a08, 0xff8a1a, 0xfff2a0]), // flame
  ch: tones([0x0e0a08, 0x2a201a, 0x4a3a30]), // charred
  bm: tones([0x8a6a3a, 0xc8a868, 0xf0dca0]), // bamboo
  bw: tones([0x6a4a22, 0x9a7a44, 0xc8a870]), // the steamer's woven base
  bn: tones([0xc8c0b0, 0xf6f2ea, 0xffffff]), // a steamed bun
  pk: tones([0x4a1e0e, 0x8a3a1a, 0xc86a32]), // braised pork, glazed
  ft: tones([0xc8a070, 0xecd8b0, 0xfff4e0]), // its fat
  lt: tones([0x3a7a1a, 0x6ab83a, 0xb0e870]), // lettuce
  wh: tones([0x0e0e16, 0x22222e, 0x4a4a5c]), // the whale's black
  bl: tones([0x8a8a90, 0xd8d8dc, 0xffffff]), // its white belly
  sp: [0x2a6ab0, 0x6ab0e8, 0xb0e0ff, 0xe8f8ff, 0xffffff], // the spout
  sk: tones([0x0e2a6a, 0x1e4aa0, 0x4a7ad8]), // the float's blue skirt
  wd: tones([0x3a2414, 0x6a4a30, 0x9a7a54]), // wood
  gd: tones([0x8a5a10, 0xe0a830, 0xfff0a0]), // gilt
};

// ---------------------------------------------------------------- chain: a signal flag (30 x 32), hung at y 3
/** The flag's cloth (x0..x1, y0..y1), rippling: a light that comes and goes across it in folds. */
const cloth = (f) => (x, y) => 0.6 + Math.sin(x * 0.55 + y * 0.18 + f * 1.3) * 0.12;
function flag(kind, f = 0) {
  const s = new HiSprite(30, 32, RAMPS);
  const [x0, x1, y0, y1] = [5, 25, 4, 27];
  const c = 15;
  // the clips on the halyard at its two top corners
  for (const x of [x0 + 1, x1 - 1]) s.dot(x, 3, 1.2, 0x8a929c);
  if (kind === 'burnt') {
    // a charred rag left on one clip, a glowing edge
    s.poly([[x0, 4], [x0 + 7, 4], [x0 + 6, 12], [x0 + 2, 15], [x0, 10]], 'ch', { flat: 0.45, pat: speckle({ amt: 0.3, seed: 4 }) });
    for (const [x, y] of [[x0 + 6, 9], [x0 + 3, 14]]) s.dot(x, y, 0.8, 0xff7020, 0.9);
    return s.render({ outline: 2 });
  }
  const rect = (a, b, p, q, mat) => s.paint([a, p, b, q], (x, y) => x >= a && x < b && y >= p && y < q, mat, cloth(f));
  if (kind === 'A') {
    // Alfa: white at the hoist, blue swallow-tailed at the fly (hung by its hoist: white above, the tails below)
    rect(x0, x1, y0, 15, 'fw');
    s.paint([x0, 15, x1, y1], (x, y) => x >= x0 && x < x1 && y >= 15 && y < y1 - Math.max(0, 5 - Math.abs(x - c) * 0.9), 'fb', cloth(f));
  } else if (kind === 'D') {
    // Delta: yellow, blue, yellow
    rect(x0, x1, y0, y1, 'fy');
    rect(x0 + 6, x1 - 6, y0, y1, 'fb');
  } else if (kind === 'K' || kind === 'lit') {
    // Kilo: yellow at the hoist, blue at the fly
    rect(x0, x1, y0, 15.5, 'fy');
    rect(x0, x1, 15.5, y1, 'fb');
  } else if (kind === 'U') {
    // Uniform: red and white in quarters
    rect(x0, x1, y0, y1, 'fw');
    rect(x0, c, y0, 15.5, 'fr');
    rect(c, x1, 15.5, y1, 'fr');
  } else {
    // India (eye; lit): yellow with the black ball - which, woken, is an eye opening and glaring
    rect(x0, x1, y0, y1, 'fy');
    if (kind === 'eye') {
      s.ellipse(c, 15.5, 6.4, 6.4, 'K', { flat: 0.3 });
      s.ellipse(c, 15.5, 5, f === 1 ? 1 : 4.4, 'W', { flat: 0.95 });
      if (f !== 1) {
        s.dot(c + 0.4, 15.8, 2.6, 0xd8241e);
        s.dot(c + 0.4, 15.8, 1.2, INK);
        s.dot(c - 1.4, 14, 0.7, 0xffffff);
      }
      s.line(c - 6.4, 9.6, c + 6.4, 11.6, INK, 1.6); // (its scowl)
    } else s.ellipse(c, 15.5, 6.4, 6.4, 'K', { flat: 0.3, bias: 0.15 });
  }
  // the hem at the hoist, the seams' shadow in the folds
  s.line(x0, y0, x1, y0, 0xc8c8c0, 1, 0.8);
  for (let x = x0 + 3; x < x1; x += 6) s.line(x + f, y0 + 1, x + f + 0.6, y1 - 1, 0x000000, 1, 0.12);
  if (kind === 'lit') {
    // fire catching from below, eating up the cloth, the edge glowing
    s.paint([x0, 18, x1, y1], (x, y) => y > 22 - Math.sin(x * 0.9 + f) * 2, 'ch', () => 0.4);
    for (let k = -1; k <= 1; k++) s.ellipse(c + k * 6, 22 - ((f + k + 2) % 3) * 2, 3, 6.4, 'fl', { flat: 0.8, glow: true });
    for (let i = 0; i < 4; i++) s.dot(x0 + 2 + i * 5, 8 + ((i + f) % 3) * 3, 0.7, 0xfff2a0);
  }
  return s.render({ outline: 2 });
}

/** A steel post the halyard runs from (21 x 21, seen from above): its cap, the cleat, the line's turns. */
function post() {
  const s = new HiSprite(21, 21, RAMPS);
  s.ellipse(10.5, 10.5, 4.6, 4.6, 'st', { bias: 0.15 });
  s.ellipse(10.5, 10.5, 2.4, 2.4, 'st', { bias: -0.2 });
  s.tube(5, 14.6, 16, 14.6, 0.9, 'st'); // (the cleat)
  s.tube(1, 11, 20, 10, 1, 'fw');
  return s.render({ outline: 2 });
}

// ---------------------------------------------------------------- split: kakuni-manju (a steamer 46 x 46, one 32 x 28)
/** A kakuni-manju at (x, y): the white bun folded over the slab of braised pork, a leaf, two eyes glaring. */
function manju(s, x, y, f, glare) {
  // the bun: soft and white, folded over like a purse, rounder at the back; its fold curving along the front
  const fold = (px) => y + 3.4 - ((px - x) / 10) ** 2 * 3; // (the fold's line)
  s.paint([x - 11, y - 8, x + 11, y + 9], (px, py) => Math.hypot((px - x) / 10.6, (py - y + 0.6) / 7.6) < 1 && py < fold(px) + 0.3, 'bn', (px, py) => 0.66 - (py - y) * 0.02 - Math.abs(px - x) * 0.012, { pat: mottle({ amt: 0.04, scale: 3, seed: 3 }) });
  // the filling showing in the fold: a leaf of lettuce frilling out, the glazed pork belly in its layers of fat
  s.paint([x - 11, y - 2, x + 11, y + 9], (px, py) => Math.abs(px - x) < 9.4 && py >= fold(px) - 0.4 && py < fold(px) + 1.4, 'lt', () => 0.6);
  s.paint([x - 11, y - 2, x + 11, y + 10], (px, py) => Math.abs(px - x) < 8 && py >= fold(px) + 1 && py < fold(px) + 4.6, 'pk', (px, py) => 0.55 + (py - fold(px) < 2 ? 0.2 : 0));
  for (const d of [2.6, 3.6]) s.paint([x - 9, y - 2, x + 9, y + 10], (px, py) => Math.abs(px - x) < 7.4 && Math.abs(py - fold(px) - d) < 0.35, 'ft', () => 0.6);
  s.dot(x - 3, fold(x - 3) + 1.8, 0.7, 0xffd8a0, 0.9); // (the glaze's gleam)
  s.paint([x - 11, y - 2, x + 11, y + 11], (px, py) => Math.abs(px - x) < 9 - (py - fold(px) - 4.4) * 1.2 && py >= fold(px) + 4.4 && py < fold(px) + 6.4, 'bn', () => 0.4); // (its lower lip)
  // its face, on the top of the bun
  for (const sx of [-1, 1]) {
    s.ellipse(x + sx * 4, y - 2, 2, glare ? 1.8 : 0.7, 'K', { flat: 0.2 });
    if (glare) s.dot(x + sx * 3.7, y - 1.8, 0.9, 0xff3a20);
    s.line(x + sx * 1.6, y - 4.6, x + sx * 6.4, y - 3.6, INK, 1.1);
  }
}

function steamer(f) {
  const s = new HiSprite(46, 46, RAMPS);
  const c = 23;
  // the bamboo steamer, its lid off: the bands of its rim, the woven base, the paper on it
  s.ellipse(c, 24, 21, 20, 'bm', { bias: 0.15 });
  for (const r of [19.6, 18]) s.paint([1, 2, 45, 45], (x, y) => Math.abs(Math.hypot((x - c) / 21, (y - 24) / 20) * 21 - r) < 0.4, 'bm', () => 0.3);
  s.ellipse(c, 24, 16.6, 15.8, 'bw', { flat: 0.5 });
  for (let k = -16; k <= 16; k += 2.4) s.line(c + k, 9, c + k, 39, 0x6a4a22, 1, 0.35);
  for (let k = -15; k <= 15; k += 2.4) s.line(c - 16, 24 + k, c + 16, 24 + k, 0x6a4a22, 1, 0.25);
  s.poly([[c - 14, 12], [c + 13, 11], [c + 14, 36], [c - 13, 37]], 'fw', { flat: 0.6 });
  // the two buns side by side, glaring in turn
  manju(s, c, 17, f, f === 1 || f === 2);
  manju(s, c, 31, f, f >= 2);
  // the steam rising off them
  for (let k = 0; k < 3; k++) {
    const x = c - 10 + k * 10 + Math.sin(f + k) * 1.4;
    for (let y = 2; y < 12; y += 1) s.px(x + Math.sin(y * 0.7 + f + k) * 1.6, y + ((f + k) % 2), 0xffffff, 0.5 - y * 0.03);
  }
  return s.render({ outline: 2 });
}

function manjuOne(f) {
  const s = new HiSprite(32, 28, RAMPS);
  manju(s, 16, 12, f, true);
  // a drop of the braising sauce flying off it
  s.dot(9 + f * 2, 25, 1, 0x6a2a10);
  for (let y = 0; y < 5; y++) s.px(10 + y * 0.6 - f, 2 - y * 0.2 + 4, 0xffffff, 0.4); // (a wisp of steam)
  return s.render({ outline: 2 });
}

// ---------------------------------------------------------------- cart: the Kunchi whale (52 x 92), down the screen
function kujira(stage, f) {
  const s = new HiSprite(52, 92, RAMPS);
  const c = 26;
  const limp = stage >= 2;
  const tilt = limp ? 2 : 0;
  // the pulling ropes trailing out ahead, red and white, slack, no one on them
  for (const sx of [-1, 1]) for (let y = 80; y < 91; y += 0.5) s.px(c + sx * 7 + Math.sin(y * 0.5 + f + sx) * 1.2 + tilt * 0.5, y, Math.floor(y) % 3 ? 0xe8e4dc : 0xd8241e);
  // the four wheels at the float's corners, peeping out from under its skirt
  const wheel = (x, y) => {
    s.poly([[x - 2.4, y - 7], [x + 2.4, y - 7], [x + 2.4, y + 7], [x - 2.4, y + 7]], 'wd', { flat: 0.5 });
    for (let k = 0; k < 3; k++) {
      const yy = y - 6 + ((k * 4.4 + f * 2.2) % 13);
      s.line(x - 2.4, yy, x + 2.4, yy, 0x2a1e14, 1, 0.8);
    }
  };
  wheel(c - 19.4, 22);
  wheel(c - 19.4, 66);
  wheel(c + 19.4, 22 + tilt);
  if (!limp) wheel(c + 19.4, 66);
  else for (let k = 0; k < 4; k++) s.line(c + 16.6, 66 + tilt, c + 19.6 + k, 63 + tilt + k * 1.6, 0x9a7a54, 1); // (the axle's broken end)
  // the float's skirt: blue cloth printed with white waves (seigaiha) all round - torn open at the front once hit
  const torn = stage >= 1;
  s.paint([c - 19, 8, c + 19, 80], (x, y) => Math.abs(x - c) < 17.6 && y > 9 && y < 79 + (x > c ? tilt : 0) - (torn && Math.abs(x - c - 6) < 7 ? 6 + Math.sin(x * 1.7) * 2 : 0), 'sk', (x, y) => (x < c ? 0.62 : 0.44) + Math.sin(y * 0.6) * 0.03);
  for (let y = 12; y < 78; y += 5) for (let x = c - 15.6 + ((y / 5) % 2) * 2.5; x < c + 16.4; x += 5) {
    if (torn && y > 70 && Math.abs(x - c - 6) < 8) continue;
    s.paint([x - 2.6, y - 2.6, x + 2.6, y + 0.4], (px, py) => {
      const r = Math.hypot(px - x, py - y);
      return py < y && (Math.abs(r - 2.3) < 0.35 || Math.abs(r - 1.2) < 0.3);
    }, 'fw', () => 0.6);
  }
  if (torn) {
    // the frame of the float showing through the tear, the cloth's ragged edge hanging
    s.poly([[c, 72], [c + 12, 72], [c + 12, 79], [c, 79]], 'wd', { flat: 0.5 });
    for (let x = c + 1; x < c + 12; x += 1.6) s.line(x, 71 + Math.sin(x) * 1.5, x + 0.4, 74 + Math.sin(x * 2) * 1.5, 0x1e4aa0, 1);
  }
  // the whale: its flukes raised up behind, the long black back glistening, the white of its belly along its flanks,
  // the head blunt at the front, its mouth's line, the eyes glaring
  const ry = tilt * 0.5;
  for (const sx of [-1, 1]) s.poly([[c, 19 + ry], [c + sx * 3, 12 + ry], [c + sx * 10, 7 + ry], [c + sx * 18, 6 + ry], [c + sx * 15, 10 + ry], [c + sx * 7, 14 + ry], [c + sx * 3, 20 + ry]], 'wh', { bias: sx < 0 ? 0.3 : 0.05 });
  s.line(c, 11 + ry, c, 19 + ry, 0x4a4a5c, 1, 0.6);
  for (const sx of [-1, 1]) s.line(c + sx * 4, 12 + ry, c + sx * 16, 7.4 + ry, 0x4a4a5c, 1, 0.5); // (the light along their edges)
  const bw = (y) => {
    const t = (y - 16) / 60;
    return t < 0 || t > 1 ? 0 : 4 + 9.6 * Math.sin(Math.min(1, t * 1.25) * Math.PI * 0.62) - (t > 0.92 ? (t - 0.92) * 30 : 0);
  };
  s.paint([c - 16, 14 + ry, c + 16, 78 + ry], (x, y) => Math.abs(x - c) < bw(y - ry) + 1.2, 'bl', () => 0.55);
  s.paint([c - 16, 14 + ry, c + 16, 78 + ry], (x, y) => Math.abs(x - c) < bw(y - ry), 'wh', (x, y) => 0.6 - (x - c) * 0.025 + (Math.abs(x - c + 4) < 1.6 ? 0.25 : 0), { pat: mottle({ amt: 0.05, scale: 3, seed: 3 }) });
  for (let y = 58; y < 75; y += 2.2) for (const sx of [-1, 1]) s.line(c + sx * (bw(y) - 0.6), y + ry, c + sx * (bw(y) + 1), y + ry + 0.8, 0x8a8a90, 1, 0.8); // (the grooves of its throat)
  s.line(c - 11, 70 + ry, c + 11, 70 + ry + tilt * 0.4, 0xc8302a, 1.2); // (its mouth's line, lacquered red)
  for (const sx of [-1, 1]) {
    s.ellipse(c + sx * 8, 64 + ry, 3, 2.2, 'W', { flat: 0.95 });
    s.dot(c + sx * 7.6, 64.2 + ry, 1.3, stage >= 1 ? 0xff3a20 : 0xe0a830);
    s.dot(c + sx * 7.6, 64.2 + ry, 0.6, INK);
    s.line(c + sx * 4.6, 61 + ry, c + sx * 11, 62 + ry, 0x6a6a7c, 1.2);
  }
  // the blowhole, and the spout rising from it: full, sputtering once hit, then dry
  s.ellipse(c, 54 + ry, 1.8, 1, 'K', { flat: 0.3 });
  const spout = stage === 0 ? 1 : stage === 1 ? 0.45 : 0;
  if (spout) {
    // a column of water up from the blowhole, bursting at its top into a plume that spreads and falls back as spray
    const h = (30 + f * 3) * spout;
    const top = 54 - h;
    s.paint([c - 3, top, c + 3, 54], (x, y) => Math.abs(x - c) < 1.2 + ((54 - y) / h) * 1.2, 'sp', () => 0.85, { glow: true });
    const pr = 5 + 4 * spout;
    s.paint([c - pr - 3, top - pr, c + pr + 3, top + pr + 2], (x, y) => Math.hypot((x - c) / 1.3, y - top) < pr + Math.sin(Math.atan2(y - top, x - c) * 7 + f * 2) * 1.2, 'sp', (x, y) => 0.4 + (1 - Math.hypot(x - c, y - top) / (pr * 1.3)) * 0.55, { glow: true });
    for (let i = 0; i < 12; i++) {
      const a = Math.PI * (0.05 + (i / 11) * 0.9);
      const d = pr * 1.3 + 2 + ((i * 3 + f * 5) % 6);
      s.dot(c - Math.cos(a) * d * 1.2, top + 2 + Math.sin(a) * d * 0.5 + ((i + f) % 3) * 2, 0.8, 0xe8f8ff, 0.9); // (the spray falling back)
    }
  }
  if (stage >= 3) {
    // its back on fire, the black lacquer cracking
    for (let k = 0; k < 5; k++) {
      const x = c - 8 + k * 4;
      const h = 7 + ((k * 3 + f * 2) % 5);
      s.paint([x - 3, 36 - h - 4, x + 3, 48], (px, py) => {
        const t = (46 - py) / (h + 10);
        return t > 0 && t < 1 && Math.abs(px - x) < 2.8 * (1 - t) + 0.6;
      }, 'fl', (px, py) => 0.5 + ((46 - py) / (h + 10)) * 0.45, { glow: true });
    }
  }
  return s.render({ outline: 2 });
}

function kujiraWreck() {
  const s = new HiSprite(52, 92, RAMPS);
  const c = 26;
  // the float collapsed on the street: the whale tipped over on its side, its white belly and grooves showing, its
  // back charred and split along the lacquer, a fluke broken off, the skirt in rags, a wheel off
  s.poly([[c - 20, 14], [c + 18, 12], [c + 20, 78], [c - 18, 80]], 'sk', { flat: 0.4, pat: speckle({ amt: 0.3, dark: 0.4, seed: 5 }) });
  s.ellipse(c + 3, 46, 11, 28, 'bl', { flat: 0.5 });
  for (let y = 30; y < 70; y += 3) s.line(c - 2, y, c + 11, y + 1, 0x8a8a90, 1, 0.7);
  s.ellipse(c - 6, 46, 8, 27, 'ch', { flat: 0.4, pat: speckle({ amt: 0.3, seed: 9 }) });
  s.line(c - 7, 22, c - 5, 70, 0x6a3a1a, 1);
  s.poly([[c - 4, 10], [c + 10, 4], [c + 8, 10], [c, 16]], 'wh', { flat: 0.4 });
  s.poly([[c - 16, 82], [c - 4, 84], [c - 6, 88], [c - 18, 86]], 'wh', { flat: 0.3 }); // (the fluke broken off)
  s.ellipse(c + 20, 72, 6, 6, 'wd', { flat: 0.4 });
  for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; s.line(c + 20, 72, c + 20 + Math.cos(a) * 5, 72 + Math.sin(a) * 5, 0x2a1e14, 1); }
  for (let i = 0; i < 5; i++) s.dot(c - 10 + i * 4, 30 + (i % 3) * 12, 0.9, 0xff7020, 0.8);
  return s.render({ outline: 2 });
}

/** Nagasaki's frames for the shared behaviours (skins.js: nagasaki chain, split, cart). */
export function nagasakiNewFoes(add) {
  ['A', 'D', 'K', 'U'].forEach((k, i) => add(`ng_flag_${i}`, flag(k)));
  for (let f = 0; f < 2; f++) add(`ng_flag_eye_${f}`, flag('eye', f));
  for (let f = 0; f < 2; f++) add(`ng_flag_lit_${f}`, flag('lit', f));
  add('ng_flag_burnt', flag('burnt'));
  add('ng_pole', post());
  for (let f = 0; f < 4; f++) add(`ng_manju_${f}`, steamer(f));
  for (let f = 0; f < 2; f++) add(`ng_manju_one_${f}`, manjuOne(f));
  for (let st = 0; st < 4; st++) for (let f = 0; f < 2; f++) add(`ng_kujira_${st}_${f}`, kujira(st, f));
  add('ng_kujira_wreck', kujiraWreck());
}
