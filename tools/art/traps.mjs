// Every city's indestructible trap (src/game/enemies/traps.js), drawn at 540 px for the shared atlas: 60 x 60 fine
// pixels (20 x 20 in the game), seen from above the way the cities are, its foot in the middle, a shadow to the
// lower right. Four frames each: 0 at rest, 1 waking (lit inside), 2 and 3 bursting.
import { HiSprite, tones, speckle, mottle } from '../lib/hisprite.mjs';

const TAU = Math.PI * 2;
const RAMPS = {
  st: tones([0x5e5a54, 0x9a958a, 0xd4cfc2]), // weathered granite
  ms: tones([0x2e4a22, 0x5a7a3a, 0x9ab868]), // moss
  ff: tones([0x2a5ad0, 0x7ab8ff, 0xf0fbff]), // fox fire
  lr: tones([0x4a4640, 0x7e776c, 0xb8b0a0]), // reef limestone
  sea: tones([0x0e5a6a, 0x2aa8b8, 0x9af0f0]), // shallow sea over the reef
  fm: tones([0x9ac8d8, 0xe8f8ff, 0xffffff]), // foam, spray, snow
  sg: tones([0x6a7484, 0xb0bac8, 0xeef2f8]), // snow gun's painted steel
  ye: tones([0x9a6a08, 0xe8b020, 0xfff08a]), // safety yellow
  as: tones([0x2e2a2a, 0x5a5452, 0x8e8682]), // volcanic ash and rock
  su: tones([0x8a7a10, 0xd8c838, 0xfff8a0]), // sulphur crust
  lv: tones([0x8a1808, 0xf05a1a, 0xffd070]), // embers, the glow inside
  ir: tones([0x18161c, 0x34303a, 0x5c5866]), // black iron
  tk: tones([0x6e360c, 0xb87026, 0xe6a64c]), // takoyaki, browning
  wd: tones([0x4a2a14, 0x8a5a30, 0xc89a60]), // wood, logs
  fl: tones([0xb82a08, 0xff8a1a, 0xfff2a0]), // flame
  cr: tones([0x5a3a1c, 0x9a6a3a, 0xd8a868]), // crate boards
  pp: tones([0x8a1a1e, 0xd2361f, 0xff8a6a]), // the mortars' red paper
  co: tones([0x3a3e46, 0x6e7480, 0xa8b0bc]), // concrete pole, grey cans
  sk: tones([0x3a5ad8, 0x9ad0ff, 0xffffff]), // the electric arc
  lv2: tones([0x5a1a0c, 0xb83a1c, 0xe8803a]), // fallen maple leaves, red and rust
  lg: tones([0x6a4a10, 0xc8902a, 0xf0c860]), // fallen ginkgo and larch, gold
  sm: tones([0x6a666a, 0xa8a4a4, 0xdcd8d4]), // leaf smoke
  pg: tones([0x6a2e14, 0xb0602e, 0xe89a64]), // a terracotta pig
};
const sprite = () => new HiSprite(60, 60, RAMPS);
const shadow = (s, cx, cy, rx, ry) => {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
    for (let x = Math.floor(cx - rx); x <= cx + rx; x++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1) s.px(x, y, 0x0a0812, 0.32);
};
// a flame seen from above-ish: a teardrop leaning up the screen, flickering with `k`
const flame = (s, cx, cy, h, w, k, mat = 'fl') => {
  s.paint([cx - w - 2, cy - h - 2, cx + w + 2, cy + 2], (x, y) => {
    const t = (cy - y) / h;
    if (t < 0 || t > 1) return false;
    const half = w * Math.sin(Math.PI * Math.min(1, t * 1.15 + 0.08)) * (1 - t * 0.45) + Math.sin(t * 9 + k * 2.3) * 0.8;
    return Math.abs(x - cx - Math.sin(t * 4 + k) * 1.5 * t) < half;
  }, mat, (x, y) => 0.5 + (cy - y) / h * 0.45 - Math.abs(x - cx) / (w * 3), { glow: true });
};

/** Kyoto: a stone lantern (tōrō) on its square base, moss on it; fox fire wakes in its firebox and leaps out blue. */
function kyoto(f) {
  const s = sprite();
  shadow(s, 34, 40, 14, 6);
  s.poly([[18, 34], [42, 34], [44, 44], [16, 44]], 'st', { flat: 0.55, tex: 0.3, seed: 2 }); // the base
  s.tube(30, 38, 30, 28, 4, 'st', { tex: 0.2 }); // the post
  s.poly([[21, 20], [39, 20], [40, 30], [20, 30]], 'st', { flat: 0.62, tex: 0.25, seed: 3 }); // the firebox
  const lit = f > 0;
  for (const x of [24, 33]) s.paint([x, 22, x + 4, 28], () => true, lit ? 'ff' : 'ir', () => (lit ? 0.8 + (f > 1 ? 0.15 : 0) : 0.3), { glow: lit }); // its windows
  s.poly([[14, 19], [46, 19], [41, 12], [19, 12]], 'st', { flat: 0.7, tex: 0.2, seed: 4 }); // the roof, its corners curling
  for (const x of [13, 47]) s.dot(x, 19, 1.4, 0xb8b2a4);
  s.ellipse(30, 10, 3, 3, 'st', { bias: 0.05 }); // the jewel on top
  s.paint([16, 34, 44, 44], (x, y) => (x + y * 0.6) % 7 < 2 && y > 39, 'ms', () => 0.55, { tex: 0.4 }); // moss on the base
  if (f >= 2) {
    for (const [dx, k] of [[-5, 0], [5, 1.5], [0, 3]]) flame(s, 30 + dx, 12, 10 + (f === 3 ? 4 : 0) + (dx ? 0 : 4), 3.4, k + f, 'ff');
    for (let i = 0; i < 6; i++) s.dot(30 + Math.cos(i + f) * 14, 14 + Math.sin(i * 2 + f) * 8, 1.1, 0xc8ecff);
  }
  return s;
}

/** Okinawa: a blowhole in a limestone outcrop on the reef; the sea heaves in it, then it spouts. */
function okinawa(f) {
  const s = sprite();
  // (the sea round it is the map's own)
  s.paint([4, 12, 56, 52], (x, y) => { const d = Math.hypot((x - 30) / 20, (y - 32) / 15); return d < 1 && d > 0.38 + Math.sin(Math.atan2(y - 32, x - 30) * 5) * 0.06; }, 'lr', (x, y) => 0.6 - (y - 32) * 0.012, { tex: 0.5, seed: 5 });
  for (let i = 0; i < 9; i++) s.dot(30 + Math.cos(i * 0.7) * 16, 32 + Math.sin(i * 0.7) * 12, 0.9, 0x2a2622, 0.7); // pits in the rock
  s.ellipse(30, 32, 7.5, 5.5, 'sea', { flat: f ? 0.35 : 0.25 }); // the hole
  if (f === 1) for (let i = 0; i < 8; i++) s.dot(30 + Math.cos(i) * 5, 32 + Math.sin(i * 1.3) * 3.5, 1.2, 0xe8f8ff); // foam swelling
  if (f >= 2) {
    const r = f === 2 ? 9 : 12;
    s.ellipse(30, 30, r, r * 0.8, 'fm', { bias: 0.1, glow: true, pat: speckle({ amt: 0.2, seed: f }) });
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU + f; s.dot(30 + Math.cos(a) * (r + 5), 30 + Math.sin(a) * (r + 3), 1.4, 0xffffff); }
  }
  return s;
}

/** Sapporo: a snow gun, its round fan housing on a yellow stand, turned down the screen; it blows a plume of snow. */
function sapporo(f) {
  const s = sprite();
  shadow(s, 34, 44, 14, 5);
  for (const [x0, x1] of [[20, 26], [40, 34], [30, 30]]) s.tube(x0, 46, x1, 36, 1.6, 'ye'); // the stand's legs
  s.ellipse(30, 30, 13, 11, 'sg', { bias: 0.05, tex: 0.15 }); // the housing
  s.ellipse(30, 33, 9.5, 7.5, 'ir', { flat: 0.35 }); // the barrel's mouth (pointing at us, down the screen)
  for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + f * 0.6; s.line(30, 33, 30 + Math.cos(a) * 8, 33 + Math.sin(a) * 6, 0x8a94a4, 1); } // the fan
  s.ellipse(30, 33, 2, 1.6, 'sg', { flat: 0.7 });
  const lamp = f === 1 ? 0x7af0ff : f >= 2 ? 0xc8ffff : 0x3a5a6a;
  s.dot(21, 23, 1.6, lamp); // its running light
  s.line(19, 26, 41, 26, 0x5a6474, 1, 0.8);
  if (f >= 2) {
    const L = f === 2 ? 14 : 20;
    s.paint([16, 34, 44, 34 + L + 6], (x, y) => { const t = (y - 36) / L; return t >= 0 && t <= 1.15 && Math.abs(x - 30) < 5 + t * 9 + Math.sin(y * 0.8 + f) * 1.2; }, 'fm', (x, y) => 0.95 - (y - 36) / L * 0.3, { glow: true, pat: speckle({ amt: 0.3, seed: f + 7 }) });
  }
  return s;
}

/** Kagoshima: a fumarole, a mound of ash with sulphur crusting its lip; it glows within, then belches ash and embers. */
function kagoshima(f) {
  const s = sprite();
  s.ellipse(30, 34, 22, 15, 'as', { bias: 0.04, tex: 0.5, seed: 6 });
  s.paint([8, 20, 52, 50], (x, y) => { const d = Math.hypot((x - 30) / 12, (y - 32) / 8.5); return d < 1 && d > 0.62; }, 'su', () => 0.6, { tex: 0.6, seed: 7 }); // the sulphur lip
  s.ellipse(30, 32, 7.5, 5, f ? 'lv' : 'as', { flat: f ? 0.65 + f * 0.08 : 0.2, glow: f > 0 });
  for (const [x, y] of [[14, 40], [46, 28], [22, 22], [44, 44]]) s.ellipse(x, y, 2.5, 2, 'as', { bias: 0.1 }); // stones
  if (f >= 2) {
    for (let i = 0; i < 4; i++) s.ellipse(30 + Math.sin(i * 2 + f) * 4, 26 - i * 5 - (f === 3 ? 3 : 0), 6 + i * 1.5, 4 + i, 'as', { flat: 0.28 + i * 0.05, glow: false, pat: mottle({ amt: 0.2, scale: 3, seed: i + f }) });
    for (let i = 0; i < 8; i++) s.dot(30 + Math.cos(i * 1.7 + f) * (8 + i), 24 + Math.sin(i * 2.3) * 9, 1, i % 2 ? 0xffb050 : 0xff5a1a);
  }
  return s;
}

/** Osaka: a takoyaki griddle on a stall's counter, its iron plate of half-round cups; it heats red, then spits fire. */
function osaka(f) {
  const s = sprite();
  shadow(s, 33, 42, 18, 6);
  s.poly([[8, 22], [52, 22], [54, 44], [6, 44]], 'cr', { flat: 0.55, tex: 0.25, seed: 8 }); // the counter
  s.poly([[12, 24], [48, 24], [48, 40], [12, 40]], 'ir', { flat: f === 1 ? 0.55 : 0.4 }); // the plate
  if (f === 1) s.paint([12, 24, 48, 40], () => true, 'lv', () => 0.35, { glow: true, pat: (x, y) => ((x + y) % 5 < 1 ? 0.15 : 0) });
  for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) {
    const x = 16 + c * 5.6;
    const y = 27 + r * 5.6;
    s.ellipse(x, y, 2.3, 2.3, 'tk', { bias: 0.05, pat: speckle({ amt: 0.2, seed: r * 6 + c }) });
    if ((r + c) % 3 === 0) s.dot(x - 0.6, y - 0.8, 0.8, 0x3a1a08); // a sprinkle of nori
  }
  s.poly([[6, 44], [54, 44], [52, 47], [8, 47]], 'pp', { flat: 0.6 }); // the stall's red trim
  for (const x of [14, 46]) s.tube(x, 20, x - 4, 10, 0.9, 'wd'); // two picks resting on the plate
  if (f >= 2) for (const [x, k] of [[18, 0], [30, 1.3], [42, 2.6]]) flame(s, x, 24, f === 2 ? 9 : 13, 3, k + f);
  return s;
}

/** Hiroshima: a kagaribi, an iron fire basket on three legs on the shore of Miyajima; it flares and throws sparks. */
function hiroshima(f) {
  const s = sprite();
  shadow(s, 34, 46, 12, 5);
  for (const [x0, x1] of [[22, 26], [38, 34], [30, 30]]) s.tube(x0, 48, x1, 30, 1.3, 'ir'); // the legs
  s.ellipse(30, 26, 11, 7, 'ir', { bias: 0.02 }); // the basket
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI; s.line(30 + Math.cos(a) * 11, 26 + Math.sin(a) * 7 * -0.2, 30 + Math.cos(a) * 8, 32, 0x5c5866, 1); } // its iron bands
  for (const [x0, y0, x1, y1] of [[22, 22, 38, 27], [24, 28, 37, 20], [27, 19, 33, 30]]) s.tube(x0, y0, x1, y1, 1.6, 'wd'); // the logs
  const k = f === 0 ? 0.4 : f === 1 ? 0.75 : 1;
  for (let i = 0; i < 5; i++) s.dot(26 + i * 2.2, 24 + (i % 2) * 2, 1.2, f ? 0xffa030 : 0xc04010, k);
  if (f >= 1) flame(s, 30, 24, f === 1 ? 6 : f === 2 ? 15 : 19, f === 1 ? 3 : 5, f);
  if (f >= 2) for (let i = 0; i < 7; i++) s.dot(30 + Math.sin(i * 2.1 + f) * 10, 8 + i * 2, 0.8, 0xffe08a);
  return s;
}

/** Nagasaki: a festival mortar, three tubes in red paper in a wooden crate on the quay; a fuse sparks, then they fire. */
function nagasaki(f) {
  const s = sprite();
  shadow(s, 34, 44, 16, 6);
  s.poly([[14, 22], [46, 22], [48, 44], [12, 44]], 'cr', { flat: 0.55, tex: 0.3, seed: 9 });
  for (const y of [28, 36]) s.line(13, y, 47, y, 0x4a2e14, 1, 0.9); // its boards
  for (const [x, y] of [[22, 30], [38, 30], [30, 37]]) {
    s.ellipse(x, y, 5.5, 5, 'pp', { bias: 0.04 });
    s.ellipse(x, y, 3.2, 3, f >= 2 ? 'fl' : 'ir', { flat: f >= 2 ? 0.8 : 0.25, glow: f >= 2 }); // its mouth
  }
  if (f >= 1) for (let i = 0; i < 5; i++) s.dot(46 + Math.cos(i * 1.3 + f) * 3, 20 + Math.sin(i * 2 + f) * 3, 0.8, i % 2 ? 0xffe08a : 0xffffff); // the fuse
  s.line(44, 22, 47, 18, 0x2a2622, 1);
  if (f >= 2) {
    for (const [x, y] of [[22, 30], [38, 30], [30, 37]]) flame(s, x, y - 2, f === 2 ? 10 : 14, 2.4, x, 'fl');
    for (let i = 0; i < 10; i++) s.dot(30 + Math.cos(i * 0.63) * 22, 22 + Math.sin(i * 0.63) * 14, 1, [0xff5a8a, 0x8ad8ff, 0xffe080][i % 3]);
  }
  return s;
}

/** Tokyo: the top of a concrete utility pole, its crossarm, two grey transformer cans; it arcs. (No wires: they would
 * end at the frame's edge, going nowhere.) */
function tokyo(f) {
  const s = sprite();
  shadow(s, 36, 38, 8, 8);
  s.ellipse(30, 30, 5, 5, 'co', { bias: 0.08 }); // the pole's top
  s.poly([[12, 28], [48, 28], [48, 32], [12, 32]], 'co', { flat: 0.55 }); // the crossarm
  for (const x of [14, 46]) s.ellipse(x, 30, 1.6, 1.6, 'fm', { flat: 0.8 }); // insulators
  for (const [x, y] of [[22, 21], [38, 39]]) {
    s.ellipse(x, y, 5, 5, 'co', { bias: 0.05 });
    s.ellipse(x, y, 2.4, 2.4, 'co', { flat: 0.75 });
  }
  if (f === 1) for (const [x, y] of [[22, 21], [38, 39]]) s.dot(x + 3, y - 3, 1.4, 0xfff08a); // a fizz on the bushings
  if (f >= 2) {
    // arcs: jagged lines out from the cans
    for (let n = 0; n < (f === 2 ? 4 : 6); n++) {
      const a = (n / 6) * TAU + f;
      let [x, y] = [30, 30];
      for (let k = 0; k < 5; k++) {
        const nx = x + Math.cos(a + Math.sin(k * 3 + n) * 0.8) * 4;
        const ny = y + Math.sin(a + Math.cos(k * 2 + n) * 0.8) * 4;
        s.line(x, y, nx, ny, k % 2 ? 0xffffff : 0x9ad0ff, 1);
        [x, y] = [nx, ny];
      }
    }
    s.ellipse(30, 30, 4, 4, 'sk', { flat: 0.95, glow: true });
  }
  return s;
}

/** Kawaguchiko: a bonfire of fallen leaves raked into a pit ringed with stones; it burns
 * low all the time, its smoke rising, so it reads as a fire and never as something to pick up (no plate under it, no
 * handle off it); then it catches and throws up a burst of sparks. */
function kawaguchiko(f) {
  const s = sprite();
  // the ring of stones round the pit, ash grey between them
  for (let k = 0; k < 13; k++) {
    const a = (k / 13) * TAU + 0.2;
    s.ellipse(30 + Math.cos(a) * 16, 35 + Math.sin(a) * 10, 2.8 - (k % 3) * 0.3, 2.2, 'st', { bias: Math.sin(a) * -0.1, tex: 0.3, seed: k });
  }
  // the heap: leaves of every colour, red maples, gold ginkgo and larch, the edges blackened, sticks across
  for (let k = 0; k < 22; k++) {
    const a = k * 2.399;
    const r = Math.sqrt(k / 22) * 10;
    const [x, y] = [30 + Math.cos(a) * r, 35 + Math.sin(a) * r * 0.62];
    s.ellipse(x, y, 3.2, 2.2, k % 3 === 0 ? 'lg' : 'lv2', { bias: 0.02 + (k % 2) * 0.05 });
    if (r > 6) s.dot(x + Math.cos(a) * 2, y + Math.sin(a) * 1.4, 1.1, 0x1a1210, 0.8);
  }
  for (const [x0, y0, x1, y1] of [[22, 32, 32, 38], [34, 30, 39, 39]]) s.tube(x0, y0, x1, y1, 0.9, 'wd');
  // embers glowing through it, flames always, higher as it wakes
  for (let i = 0; i < 7; i++) s.dot(24 + i * 2, 35 + (i % 2), 1.2, f ? 0xffb040 : 0xff7020, 0.9);
  flame(s, 27, 34, f === 0 ? 7 : f === 1 ? 11 : f === 2 ? 16 : 20, f === 0 ? 3 : f === 1 ? 4.5 : 7, f);
  flame(s, 33, 35, f === 0 ? 5 : f === 1 ? 8 : 12, f === 0 ? 2.4 : 3.6, f + 1.7);
  // its smoke going up the screen in puffs, thick while it smoulders
  for (let i = 0; i < 3; i++) s.ellipse(29 + Math.sin(i * 1.7 + f) * 2.5, 23 - i * 5, 3.4 - i * 0.6, 2.8 - i * 0.5, 'sm', { flat: 0.78 + i * 0.06 });
  if (f >= 2) for (let i = 0; i < 9; i++) s.ellipse(30 + Math.sin(i * 2.3 + f) * 13, 6 + i * 2.4, 0.9, 0.9, 'fl', { flat: i % 3 ? 0.95 : 0.7, glow: true }); // sparks
  return s;
}

/** Onomichi: a mosquito-coil pig (katori-buta), the terracotta pot a coil smoulders in on summer verandas: its snout
 * a round mouth breathing smoke, its ears, its curly tail; the coil glows red inside it, then it puffs out rings. */
function onomichi(f) {
  const s = sprite();
  shadow(s, 33, 40, 15, 7);
  // the pig lying on its side (seen from above): its round body, the hollow of its open snout at the bottom
  s.ellipse(30, 31, 14, 12, 'pg', { bias: 0.04, tex: 0.25 });
  for (const sx of [-1, 1]) s.poly([[30 + sx * 6, 20], [30 + sx * 11, 17], [30 + sx * 10, 23]], 'pg', { flat: 0.55 }); // its ears
  for (const sx of [-1, 1]) s.ellipse(30 + sx * 9, 41, 2.6, 2, 'pg', { bias: 0.1 }); // its trotters
  s.ellipse(30, 43, 6.4, 4.4, 'pg', { bias: 0.08 });
  s.ellipse(30, 43, 4.4, 2.8, 'ir', { flat: 0.2 }); // the dark mouth of the snout
  for (const sx of [-1, 1]) s.dot(30 + sx * 4.6, 33, 1.2, 0x2a1408); // its eyes
  s.tube(41, 26, 45, 23, 0.8, 'pg'); // the curly tail
  s.dot(45.5, 22, 1, 0xb0602e);
  // the coil inside, seen through the snout: a red ember, brighter as it wakes
  s.dot(30, 43, f === 0 ? 1.2 : 2, f === 0 ? 0x8a2a10 : 0xff7020);
  if (f > 0) s.ellipse(30, 43, 2.2, 1.4, 'lv', { flat: 0.9, glow: true });
  // its smoke: a thin thread at rest, rings puffing out of the snout and rising up the screen as it bursts
  if (f < 2) for (let i = 0; i < 4; i++) s.dot(30 + Math.sin(i * 1.3 + f) * 1.6, 38 - i * 5, 1.4 - i * 0.2, 0xc8c4c0, 0.7 - i * 0.12);
  else
    for (let k = 0; k < (f === 2 ? 2 : 3); k++) {
      const [ry, y] = [3 + k * 2.4, 36 - k * 8];
      for (let a = 0; a < TAU; a += 0.35) s.ellipse(30 + Math.cos(a) * (ry + 2), y + Math.sin(a) * ry * 0.6, 1.4, 1.2, 'sm', { flat: 0.8 });
    }
  return s;
}

const DRAW = { kyoto, okinawa, sapporo, kagoshima, osaka, hiroshima, nagasaki, tokyo, kawaguchiko, onomichi };
export const TRAP_CITIES = Object.keys(DRAW);

/** Every trap's four frames, for the shared 540 px atlas. */
export function trapSprites540(add) {
  for (const [city, draw] of Object.entries(DRAW)) for (let f = 0; f < 4; f++) add(`trap_${city}_${f}`, draw(f).render({ outline: 2 }));
}
