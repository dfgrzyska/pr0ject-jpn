// Kagoshima's looks for two of the shared behaviours (src/game/enemies/chainSplitCart.js, docs/plan-silniejsze-fale.md;
// no pair here: its volcanic bombs already split), drawn at 540 px with HiSprite:
//   chain  - hoshi-daikon, radishes drying in pairs astride the lines of a bamboo rack (daikon yagura) over
//            Sakurajima's road by its fields: in turn a pair still white and plump and a pair gone wrinkled and
//            tan, dusted grey with the volcano's ash; the pair that wakes opens two red eyes and gapes (these
//            shoot); one catching fire, the charred knot of leaves left on the line
//   cart   - an ishi-yaki imo cart, the sweet potatoes Satsuma gave its name to roasting on hot stones, rolling
//            down a street of Tenmonkan by itself: a two-wheeled wooden handcart, its shafts out in front with no
//            one between them, the iron oven on it with its lid pushed back (the stones, the potatoes in their
//            purple skins), its two vents glaring and the lid's gap grinning, the stovepipe smoking behind, a red
//            lantern swinging; it breaks up in three stages (the stovepipe knocked askew, puffing: it glares red;
//            a wheel off, the cart dragging on its axle, potatoes rolling out; the cart on fire), its wreck tipped
//            on its side, stones and charred potatoes spilled over the street
import { HiSprite, tones, speckle, mottle } from '../../lib/hisprite.mjs';

const INK = 0x14101c;
const TAU = Math.PI * 2;
const RAMPS = {
  dk: tones([0x9a9688, 0xeeeade, 0xffffff]), // a fresh daikon's white
  dt: tones([0x7a6440, 0xc0a476, 0xead4a8]), // a dried one, wrinkled tan
  lf: tones([0x2a3a12, 0x5a7a2a, 0x9ab85a]), // its leaves
  ly: tones([0x4a4018, 0x8a7a3a, 0xc0b06a]), // its leaves gone dry
  bm: tones([0x5a4a1e, 0xa08a48, 0xd8c890]), // bamboo
  ah: tones([0x4a4a50, 0x7a7a80, 0xb0b0b4]), // volcanic ash
  fl: tones([0xb82a08, 0xff8a1a, 0xfff2a0]), // flame
  ch: tones([0x0e0a08, 0x2a201a, 0x4a3a30]), // charred
  wd: tones([0x3a2414, 0x7a5434, 0xb08a5a]), // the cart's wood
  ir: tones([0x121216, 0x2e2e36, 0x5a5a66]), // the oven's iron
  sn: tones([0x4a4848, 0x8a8682, 0xc8c4bc]), // the river stones
  im: tones([0x3a0e2a, 0x7a2a5a, 0xc0608e]), // sweet potato skin, purple-red
  io: tones([0xb87a10, 0xf0b030, 0xffe08a]), // its flesh, roasted gold
  rd: tones([0x7a0e10, 0xd82a1e, 0xff7a5a]), // the lantern's red paper
  sm: tones([0x6a6a70, 0xb0b0b4, 0xe8e8ea]), // smoke
};

// ---------------------------------------------------------------- chain: a pair of daikon (26 x 46), astride the line
/** A radish from (x, y) (its shoulder, by the line) hanging down to its tip, leaning `lean`; plump or dried. */
function root(s, x, y, len, w, lean, dry, f) {
  const at = (t) => [x + lean * t * len + Math.sin(f * 1.4 + t * 2) * 0.4 * t, y + t * len];
  const half = (t) => w * (t < 0.08 ? 0.75 + t * 3 : (1 - t) ** (dry ? 1.1 : 0.85)) * (dry ? 0.82 + Math.sin(t * 31) * 0.06 : 1);
  s.paint([x - w - 6, y - 1, x + w + 6 + Math.abs(lean) * len, y + len + 1], (px, py) => {
    const t = (py - y) / len;
    if (t < 0 || t > 1) return false;
    return Math.abs(px - at(t)[0]) < half(t);
  }, dry ? 'dt' : 'dk', (px, py) => {
    const t = (py - y) / len;
    return 0.72 - (px - at(t)[0]) / (half(t) + 0.5) * 0.2 + (dry ? Math.sin(py * 1.9) * 0.08 : 0);
  }, { pat: speckle({ amt: dry ? 0.18 : 0.06, seed: Math.round(x) }) });
  // its rings of wrinkles (dried) or the faint fine lines of a fresh one; the root hairs at the tip
  for (let t = 0.12; t < 0.9; t += dry ? 0.07 : 0.14) {
    const [cx, cy] = at(t);
    s.line(cx - half(t) * 0.8, cy, cx + half(t) * 0.8, cy + 0.6, dry ? 0x7a6440 : 0xc8c4b8, 1, dry ? 0.7 : 0.4);
  }
  const [tx, ty] = at(1);
  s.line(tx, ty - 1, tx + lean * 3, ty + 2, dry ? 0x9a8458 : 0xd8d4c8, 1);
  return at;
}

function daikon(kind, f = 0) {
  const s = new HiSprite(32, 50, RAMPS);
  const c = 16;
  if (kind === 'burnt') {
    // the charred knot of leaves left astride the line, an ember in it
    s.poly([[c - 7, 6], [c + 7, 6], [c + 5, 13], [c, 17], [c - 5, 13]], 'ch', { flat: 0.4, pat: speckle({ amt: 0.3, seed: 6 }) });
    s.dot(c + 1, 14, 0.9, 0xff7020, 0.9);
    return s.render({ outline: 2 });
  }
  const dry = kind === 1;
  // the two roots hanging either side, tied together by their leaves over the line
  const ats = [root(s, c - 3.6, 11, 36, 4, -0.2, dry, f), root(s, c + 3.6, 12, 34, 3.9, 0.2, dry, f + 1)];
  // the leaves: their stalks bunched over the line, the blades fanning out along it both ways and drooping,
  // frilled at their edges (gone dry and yellow on the dried pair)
  const mat = dry ? 'ly' : 'lf';
  for (const [ang, len] of [[-2.95, 15], [-2.55, 13], [-0.2, 15], [-0.6, 13], [-1.9, 8], [-1.25, 8], [3.05, 12], [0.1, 12]]) {
    const [ux, uy] = [Math.cos(ang), Math.sin(ang)];
    s.paint([c - 16, 0, c + 16, 20], (x, y) => {
      const a2 = (x - c) * ux + (y - 9) * uy, b2 = -(x - c) * uy + (y - 9) * ux;
      const t = a2 / len;
      return t > 0 && t < 1 && Math.abs(b2 - t * t * 2) < 1.9 * Math.sin(Math.PI * Math.min(1, t * 1.1 + 0.05)) + Math.sin(t * 22) * 0.45;
    }, mat, (x, y) => 0.55 - (x - c) * 0.015 + Math.sin(x * 2.3 + y * 1.7) * 0.1);
    s.line(c, 9, c + ux * len * 0.9, 9 + uy * len * 0.9 + 1.2, dry ? 0x5a5020 : 0x2a4a12, 1, 0.6); // (its midrib)
  }
  s.ellipse(c, 9, 3.6, 2.8, mat, { flat: 0.45 });
  s.tube(c - 7, 9.5, c + 7, 9.5, 0.9, 'bm', { flat: 0.55 }); // (the twine round the stalks)
  // the volcano's ash settled on them, grey on their shoulders
  for (let i = 0; i < 9; i++) s.dot(c - 7 + ((i * 5) % 14), 13 + ((i * 7) % 11), 0.7, 0x8a8a8e, dry ? 0.7 : 0.45);
  if (kind === 'eye') {
    // woken: two red eyes in each root's shoulder and a gaping mouth, their root hairs bristling
    for (const at of ats) {
      const [x, y] = at(0.28);
      for (const sx of [-1, 1]) {
        s.dot(x + sx * 1.8, y, 1.1, 0xff3a20);
        s.dot(x + sx * 1.8, y, 0.45, INK);
        s.line(x + sx * 0.6, y - 1.8, x + sx * 3.2, y - 1.1, INK, 1);
      }
      s.ellipse(x, y + 3.2 + (f ? 0.4 : 0), 1.4, f ? 1.6 : 1, 'K', { flat: 0.2 });
    }
  }
  if (kind === 'lit') {
    // fire catching at their tips and climbing, the roots blackening
    s.paint([0, 24, 32, 50], (x, y) => y > 32 + Math.sin(x * 1.3 + f) * 2 && s.mat[Math.floor(y) * 32 + Math.floor(x)] != null, 'ch', () => 0.4);
    for (let k = -1; k <= 1; k++) s.ellipse(c + k * 4, 38 - ((f + k + 2) % 3) * 1.6, 2.6, 5.4, 'fl', { flat: 0.8, glow: true });
    for (let i = 0; i < 4; i++) s.dot(c - 5 + i * 3.4, 26 - ((i + f) % 3) * 2, 0.7, 0xfff2a0);
  }
  return s.render({ outline: 2 });
}

/** A post of the bamboo rack (22 x 22, seen from above): the cut culm, the cross-poles lashed to it, the line. */
function post() {
  const s = new HiSprite(22, 22, RAMPS);
  s.tube(2, 15, 20, 7, 1.1, 'bm', { flat: 0.5 }); // (a brace)
  s.ellipse(11, 11, 3.6, 3.6, 'bm', { bias: 0.15 });
  s.ellipse(11, 11, 2.2, 2.2, 'wd', { flat: 0.25 }); // (the hollow culm)
  s.tube(0, 11.6, 22, 11, 0.8, 'ly', { flat: 0.6 });
  for (let k = 0; k < 3; k++) s.line(8 + k * 1.6, 8, 8 + k * 1.6, 14, 0x6a5a30, 1, 0.8); // (the lashing)
  return s.render({ outline: 2 });
}

// ---------------------------------------------------------------- cart: the ishi-yaki imo cart (48 x 84), down the screen
// (its shafts down the frame: the way it rolls; its stovepipe behind it, up the frame)
function imo(stage, f) {
  const s = new HiSprite(48, 84, RAMPS);
  const c = 24;
  const limp = stage >= 2;
  const tilt = limp ? 1.6 : 0; // (on its axle on one side, it slews)
  const T = (y) => tilt * ((y - 40) / 30);
  // the two shafts out in front, no one between them, their crossbar
  for (const sx of [-1, 1]) s.tube(c + sx * 10 + T(60), 58, c + sx * 5 + T(80), 83, 0.9, 'wd', { flat: sx < 0 ? 0.6 : 0.42 });
  s.tube(c - 6 + T(79), 79, c + 6 + T(79), 79, 0.7, 'wd', { flat: 0.55 }); // (the bar to push by)
  // the big wheels at its sides, their spokes turning (one gone once hit hard: the axle's end dragging)
  const wheel = (x, y) => {
    s.poly([[x - 2.6, y - 11], [x + 2.6, y - 11], [x + 2.6, y + 11], [x - 2.6, y + 11]], 'wd', { flat: 0.4 });
    for (let k = 0; k < 4; k++) { const yy = y - 10 + ((k * 5.5 + f * 2.7) % 21); s.line(x - 2.6, yy, x + 2.6, yy, 0x2a1a10, 1, 0.9); }
    s.line(x - 2.6, y - 11, x - 2.6, y + 11, 0x6a6a72, 1, 0.8); // (its iron tyre)
  };
  wheel(c - 19 + T(40), 40);
  if (!limp) wheel(c + 19, 40);
  else {
    s.line(c + 16 + T(40), 40, c + 19 + T(40), 41, 0x6a6a72, 1.6);
    for (let k = 0; k < 3; k++) s.dot(c + 20 + k * 1.4, 46 + k * 4, 0.8, 0x8a8682, 0.8); // (the street scraped behind it)
  }
  // the cart's bed: planks, its rails
  s.paint([c - 18, 10, c + 18, 62], (x, y) => Math.abs(x - c - T(y)) < 16.4 && y > 12 && y < 60, 'wd', (x, y) => 0.55 + (Math.floor((x - c - T(y) + 16) / 4.1) % 2 ? 0.06 : -0.04) - (x - c) * 0.008, { pat: speckle({ amt: 0.12, seed: 4 }) });
  for (const sx of [-1, 1]) s.paint([c - 18, 10, c + 18, 62], (x, y) => { const d = (x - c - T(y)) * sx; return d > 14.6 && d < 16.4 && y > 12 && y < 60; }, 'wd', () => (sx < 0 ? 0.8 : 0.35));
  // the oven: an iron box on the bed, its lid pushed back, the stones inside and the potatoes nestled in them
  const ox = (y) => c + T(y);
  s.paint([c - 14, 16, c + 14, 54], (x, y) => Math.abs(x - ox(y)) < 12.6 && y > 18 && y < 52, 'ir', (x, y) => 0.5 - (x - ox(y)) * 0.02);
  s.paint([c - 12, 22, c + 12, 48], (x, y) => Math.abs(x - ox(y)) < 10.6 && y > 24 && y < 48, 'sn', (x, y) => 0.45 + ((Math.floor(x * 1.3) * 7 + Math.floor(y * 1.1) * 13) % 5) * 0.08, { pat: speckle({ amt: 0.2, seed: 8 }) });
  for (let i = 0; i < 11; i++) {
    const x = ox(30) - 9 + ((i * 7) % 19), y = 27 + ((i * 11) % 20);
    s.dot(x, y, 0.7, i % 2 ? 0x4a4848 : 0xc8c4bc, 0.9); // (the stones' cracks and gleams)
  }
  const pots = [[-5, 30, 0.5], [4, 28, -0.4], [-2, 39, 0.2], [6, 42, -0.7], [-7, 44, 0.9]];
  for (const [dx, y, a] of pots.slice(0, stage >= 2 ? 3 : 5)) {
    const x = ox(y) + dx;
    s.paint([x - 6, y - 6, x + 6, y + 6], (px, py) => { const u = (px - x) * Math.cos(a) + (py - y) * Math.sin(a), v = -(px - x) * Math.sin(a) + (py - y) * Math.cos(a); return Math.hypot(u / 4.6, v / 2.2) < 1; }, 'im', (px, py) => 0.6 - (px - x) * 0.05 - (py - y) * 0.05);
    s.dot(x - Math.cos(a) * 1.2, y - Math.sin(a) * 1.2 - 0.6, 0.7, 0xe090b8, 0.8); // (the gleam on its skin)
  }
  // one split open, its gold steaming
  s.ellipse(ox(39) - 2, 39, 2.2, 1, 'io', { flat: 0.75, glow: true });
  // the lid pushed back towards the stovepipe, its face: two vents glaring, the gap grinning over the stones
  s.paint([c - 13, 12, c + 13, 22], (x, y) => Math.abs(x - ox(y)) < 12.8 && y > 13 && y < 21, 'ir', (x, y) => 0.62 - (y - 13) * 0.02);
  for (const sx of [-1, 1]) {
    s.ellipse(ox(17) + sx * 5, 17, 2, 1.6, 'K', { flat: 0.15 });
    s.dot(ox(17) + sx * 5, 17, 1, stage >= 1 ? 0xff3a20 : 0xffa030); // (the fire behind them)
    s.line(ox(15) + sx * 2.4, 14.6, ox(15) + sx * 7.6, 15.6, 0x5a5a66, 1);
  }
  s.line(c - 10 + T(22), 22.5, c + 10 + T(22), 22.5, 0xff8a30, 1, 0.8); // (the glow under the lid's edge)
  // the stovepipe at the back, and its smoke: steady, then puffing out sideways from the pipe knocked askew
  const bent = stage >= 1;
  const [px0, py0] = [c + 9 + T(14), 14];
  const [px1, py1] = bent ? [px0 + 7, py0 - 6] : [px0 + 1, py0 - 9];
  s.tube(px0, py0, px1, py1, 1.8, 'ir', { flat: 0.45 });
  s.ellipse(px1, py1, 2, 1.6, 'K', { flat: 0.2 });
  for (let k = 0; k < 4; k++) {
    const d = k * 3 + (f ? 1.5 : 0);
    const [x, y] = bent ? [px1 + 2 + d * 0.9, py1 + Math.sin(d) * 1.2 - d * 0.3] : [px1 - d * 0.3 + Math.sin(d) * 1, py1 - 1 - d * 0.5];
    if (y > 0.5 && x < 47) s.ellipse(x, y, 1.6 + k * 0.4, 1.3 + k * 0.3, 'sm', { flat: 0.7 - k * 0.1, glow: true });
  }
  // the red lantern swinging at its corner
  const [lx, ly] = [c - 15 + T(60) + (f ? 0.8 : -0.8), 61];
  s.ellipse(lx, ly, 2.6, 3.2, 'rd', { bias: 0.2, glow: true });
  s.line(lx - 2.4, ly - 1, lx + 2.4, ly - 1, 0x6a1010, 1, 0.8);
  if (limp) {
    // potatoes rolled off the bed behind it
    for (const [x, y] of [[c - 13, 6], [c + 6, 3]]) s.ellipse(x, y, 3.2, 1.8, 'im', { flat: 0.55 });
  }
  if (stage >= 3) {
    // the cart's wood on fire round the oven
    for (let k = 0; k < 5; k++) {
      const x = c - 14 + k * 7 + T(50);
      const h = 7 + ((k * 3 + f * 2) % 5);
      s.paint([x - 3, 58 - h - 6, x + 3, 60], (px, py) => {
        const t = (58 - py) / (h + 6);
        return t > 0 && t < 1 && Math.abs(px - x) < 2.8 * (1 - t) + 0.6;
      }, 'fl', (px, py) => 0.5 + ((58 - py) / (h + 6)) * 0.45, { glow: true });
    }
  }
  return s.render({ outline: 2 });
}

function imoWreck() {
  const s = new HiSprite(48, 84, RAMPS);
  const c = 24;
  // the cart tipped on its side, its bed charred, a wheel up, the oven spilt: stones and charred potatoes over the
  // street, the stovepipe off, the lantern burnt
  // the bed on its side: its underside up, planks scorched, charred black at one end
  s.paint([c - 18, 12, c + 4, 66], (x, y) => x > c - 16 + (y - 12) * 0.06 && x < c + 2 + (y - 12) * 0.05 && y > 14 && y < 64, 'wd', (x, y) => 0.5 + (Math.floor((y - 14) / 4.2) % 2 ? 0.05 : -0.05), { pat: speckle({ amt: 0.35, dark: 0.3, seed: 5 }) });
  s.paint([c - 18, 12, c + 4, 66], (x, y) => x > c - 16 + (y - 12) * 0.06 && x < c + 2 + (y - 12) * 0.05 && y > 44 && y < 64, 'ch', () => 0.4, { pat: speckle({ amt: 0.3, seed: 7 }) });
  // a wheel up in the air, round, its spokes; the other off on the street
  s.paint([c - 22, 24, c - 4, 42], (x, y) => Math.abs(Math.hypot(x - c + 13, y - 33) - 7.4) < 1.3, 'wd', () => 0.55);
  for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU + 0.3; s.line(c - 13, 33, c - 13 + Math.cos(a) * 6.6, 33 + Math.sin(a) * 6.6, 0x5a3a20, 1); }
  s.dot(c - 13, 33, 1.3, 0x6a6a72);
  s.paint([c - 22, 66, c - 6, 82], (x, y) => Math.abs(Math.hypot((x - c + 14) / 0.6, y - 74) - 6) < 1.2, 'wd', () => 0.4);
  // the oven tipped out of it, its stones and potatoes spilt over the street, one potato burnt, the pipe rolled off
  s.poly([[c + 2, 22], [c + 14, 20], [c + 16, 42], [c + 4, 44]], 'ir', { flat: 0.35 });
  for (let i = 0; i < 16; i++) s.ellipse(c + 9 + ((i * 7) % 13), 44 + ((i * 11) % 20), 1.8, 1.4, 'sn', { flat: 0.45 + (i % 3) * 0.12 });
  for (const [x, y, a] of [[c + 19, 50, 0.4], [c + 12, 60, -0.3], [c + 20, 30, 1.2]]) s.paint([x - 5, y - 5, x + 5, y + 5], (px, py) => { const u = (px - x) * Math.cos(a) + (py - y) * Math.sin(a), v = -(px - x) * Math.sin(a) + (py - y) * Math.cos(a); return Math.hypot(u / 4.2, v / 2) < 1; }, 'im', () => 0.55);
  s.ellipse(c + 8, 52, 3.4, 1.8, 'ch', { flat: 0.5 });
  s.tube(c + 4, 70, c + 15, 77, 1.6, 'ir', { flat: 0.4 });
  s.ellipse(c - 14, 8, 2.4, 3, 'ch', { flat: 0.4 }); // (the lantern burnt to its frame)
  for (let i = 0; i < 5; i++) s.dot(c - 12 + i * 3.4, 46 + (i % 3) * 5, 0.9, 0xff7020, 0.85);
  return s.render({ outline: 2 });
}

/** Kagoshima's frames for the shared behaviours (skins.js: kagoshima chain, cart). */
export function kagoshimaNewFoes(add) {
  for (let i = 0; i < 2; i++) add(`kg_daikon_${i}`, daikon(i));
  for (let f = 0; f < 2; f++) add(`kg_daikon_eye_${f}`, daikon('eye', f));
  for (let f = 0; f < 2; f++) add(`kg_daikon_lit_${f}`, daikon('lit', f));
  add('kg_daikon_burnt', daikon('burnt'));
  add('kg_pole', post());
  for (let st = 0; st < 4; st++) for (let f = 0; f < 2; f++) add(`kg_imo_${st}_${f}`, imo(st, f));
  add('kg_imo_wreck', imoWreck());
}
