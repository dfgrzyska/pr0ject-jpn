// YATAI-OBAKE, Fukuoka's miniboss (docs/plan-fukuoka.md, 6.1): a food stall of Nakasu come alive, a wooden cart under
// a canvas roof that will not close. Its face: the noren curtains hanging from the roof's front edge are its fringe
// and eyelids, the two red paper lanterns at the corners its eyes, the dark of the stall under the curtains its mouth
// with the counter for a lip, the stools before it its teeth; steam from its tin chimney, a great pot of broth boiling
// at its side, rolling on its wheels. Seen from above and in front like every sprite (its face to the ship).
// Frames (108 x 108 fine px):
//   yt_idle_0..3    swaying on its wheels, the lanterns glowing, steam
//   yt_blink        its curtains dropped over the lanterns
//   yt_ladle_0..1   a ladle out of the pot, flinging noodles
//   yt_shout        mouth wide: KAEDAMA!
//   yt_stun_0..1    broth splashed all over it, its eyes reeling (open)
//   yt_back         turned round: the back of the stall, the gas bottle and its gold valve (open)
//   yt_grill        a griddle pulled out at its front, the gyoza on it
//   yt_run_0..1     running, the curtains blown back, dust off the wheels
//   yt_pant_0..1    stopped, out of breath, its curtains lifted (open)
//   yt_sleep        dozing, the curtains down, the lanterns out
//   yt_bowl_0..1    a ramen bowl spinning (its boomerangs)
//   yt_kaedama_0..1 a gold ball of noodles (the mark it tosses: shoot it into its pot)
//   yt_gyoza_0..1   a dumpling in its arc (low, high)
//   yt_hane_0..1    hanetsuki gyoza flipped out of its iron pan: dumplings in a ring joined by a lacy golden crust
//   yt_oil          a drop of hot oil off its griddle (its bullets)
//   yt_lace         a flake of the crust (its bullets)
//   yt_noodle       a curl of noodle (its bullets)
//   yt_stool        a stool it leaves behind as it runs (bursts into shots)
//   yt_valve_0..1   the gas bottle's valve, gold (the mark of phase 2)
//   yt_truck        the little truck that comes at dawn to tow it home
//   yt_shadow       its shadow
import { HiSprite, tones, speckle, mottle } from '../../lib/hisprite.mjs';

const RAMPS = {
  tp: tones([0x5a1612, 0xa8342a, 0xe8785a]), // the roof's canvas, faded red
  nr: tones([0x0e1634, 0x22346a, 0x4a64a4]), // the noren: indigo cotton
  lt: [0x5a0a0a, 0xb8201a, 0xf04a2a, 0xff9a5a, 0xffe0b0], // the paper lanterns, glowing
  in: tones([0x120a08, 0x26160e, 0x4a2e1e]), // the stall's dark inside
  wd: tones([0x4a2e18, 0x8a5e36, 0xd0a06a]), // its wood
  st: tones([0x8a7c62, 0xe4d8bc, 0xfffaf0]), // the stools' pale tops
  rb: tones([0x0c0c10, 0x26262c, 0x54545c]), // rubber
  pt: tones([0x34363e, 0x8a8c96, 0xdcdee6]), // the pot's steel
  br: tones([0x8a6430, 0xe0b878, 0xfff0d0]), // broth, noodles
  gs: tones([0x4a4c56, 0x9a9ca8, 0xe6e8f0]), // the gas bottle
  gy: tones([0x8a5a24, 0xe6c48a, 0xfff4dc]), // a gyoza's skin
  gb: tones([0x5a3010, 0x9a5a22, 0xd8964a]), // its face fried golden brown
  bw: tones([0x8a8a94, 0xeeeef2, 0xffffff]), // a bowl's porcelain
  Y: tones([0x9a5f10, 0xe2aa32, 0xfff0a0]),
  tk: tones([0x6a7a8a, 0xd8e0e8, 0xffffff]), // the truck's white paint
};
const INK = 0x14101c;
const W = 108;

/** A paper lantern hanging at (x, y): its ribs, black caps, and an eye painted on it (open, half, shut, dizzy, out). */
function lantern(s, x, y, eye, tilt = 0) {
  s.line(x, y - 14, x + tilt, y - 10, 0x2a2420, 1.4); // its cord
  const lit = eye !== 'out' && eye !== 'shut';
  s.ellipse(x + tilt, y, 8.6, 10, lit ? 'lt' : 'tp', { glow: lit, flat: lit ? 0.62 : undefined, bias: lit ? 0 : 0.05 });
  for (const dy of [-7, -3.5, 0, 3.5, 7]) {
    const hw = 8 * Math.sqrt(1 - (dy / 10.4) ** 2);
    s.line(x + tilt - hw, y + dy, x + tilt + hw, y + dy, lit ? 0xc81810 : 0x5a1410, 1, 0.5); // the ribs
  }
  s.ellipse(x + tilt, y - 10, 5, 1.8, 'K', { flat: 0.5 }); // its black caps
  s.ellipse(x + tilt, y + 10, 4.4, 1.6, 'K', { flat: 0.5 });
  const ex = x + tilt;
  const ey = y + 3;
  if (eye === 'open' || eye === 'half') {
    s.ellipse(ex, ey, 5.6, eye === 'half' ? 2.4 : 4.6, 'W', { flat: 0.95 });
    s.dot(ex + (x < 54 ? 0.8 : -0.8), ey + 0.8, eye === 'half' ? 1.8 : 2.8, INK); // looking down at the ship
    s.px(ex - 1, ey - 0.6, 0xffffff);
  } else if (eye === 'dizzy') {
    for (let a = 0; a < 8; a += 0.25) s.px(ex + Math.cos(a * 1.6) * a * 0.62, ey + Math.sin(a * 1.6) * a * 0.55, INK); // reeling
  } else {
    s.line(ex - 5, ey - 0.4, ex, ey + 1.6, INK, 1.4); // shut
    s.line(ex, ey + 1.6, ex + 5, ey - 0.4, INK, 1.4);
  }
}

/** Steam rising in puffs from (x, y), k: the frame. */
function steam(s, x, y, n, k, big = 1) {
  for (let i = 0; i < n; i++) {
    const r = (2.4 + i * 0.9) * big;
    s.ellipse(x + Math.sin(k * 1.3 + i * 1.7) * 2.2, y - i * 5 * big, r, r * 0.85, 'W', { flat: 0.85 - i * 0.08 });
  }
}

/**
 * The stall. o: { sway (px), noren (the curtains' bottom edge, y), eye, mouth (how far its dark opens below the
 * curtains), ladle, splash, grill, run, k (frame) }.
 */
function stall(o) {
  const s = new HiSprite(W, W, RAMPS);
  const dx = o.sway ?? 0;
  const k = o.k ?? 0;
  const run = !!o.run;
  // the wheels at its sides, rubber with a hub
  for (const x of [8, 100]) {
    s.ellipse(x, 76, 4.6, 13, 'rb', { bias: 0.04 });
    s.ellipse(x, 76, 2, 5, 'pt', { bias: 0.1 });
    for (let j = -10; j <= 10; j += 4) s.line(x - 3.6, 76 + j + (k % 2) * 2, x + 3.6, 76 + j + (k % 2) * 2, 0x3a3a42, 1, 0.8); // its tread
    if (run) for (let i = 0; i < 3; i++) s.ellipse(x + (x < 54 ? -3 : 3), 92 + i * 4, 3 + i, 2.4 + i * 0.6, 'E', { flat: 0.8 - i * 0.1 }); // dust off it
  }
  // the counter's front: planks, a strip of red under the lip
  s.poly([[14, 72], [94, 72], [94, 86], [14, 86]], 'wd', { flat: 0.42, pat: speckle({ amt: 0.12, seed: 3 }) });
  for (let x = 22; x < 94; x += 9) s.line(x, 74, x, 86, 0x3a2414, 1, 0.7);
  s.line(14, 75, 94, 75, 0xb02a1e, 1.4);
  // the inside under the curtains (its mouth), steam and the pots in there; the counter's top (its lip)
  const top = Math.max(42, (o.noren ?? 58) - 2);
  const lip = 70 + (o.mouth ?? 0) * 0.3;
  const curve = Array.from({ length: 13 }, (_, i) => [92 - i * 6.3, lip + Math.sin((i / 12) * Math.PI) * (3 + (o.mouth ?? 0) * 0.25)]); // (its lip bowed down in the middle)
  s.poly([[18 + dx, top], [90 + dx, top], ...curve], 'in', { flat: 0.4 });
  if ((o.mouth ?? 0) > 6) s.ellipse(54 + dx * 0.5, lip - 4, 14, 3.4, 'tp', { flat: 0.5 }); // a tongue (the stall's red cloth)
  for (const [x, r] of [[34, 5], [72, 4.4]]) s.ellipse(x + dx * 0.5, lip - 3, r, r * 0.55, 'pt', { bias: 0.1 }); // pots inside
  s.poly([[96, lip - 1], ...curve.map(([x, y]) => [x, y - 1]), [12, lip - 1], [12, lip + 3], ...curve.slice().reverse().map(([x, y]) => [x, y + 3]), [96, lip + 3]], 'wd', { flat: 0.78, pat: mottle({ amt: 0.1, seed: 4 }) });
  for (let x = 18; x < 92; x += 14) s.dot(x, lip + 0.6, 1, 0xe8e0d0); // chopsticks' holders, little dishes
  // the roof: its canvas over the poles, folds across it, the ropes tying it; the valance along its front
  s.poly([[18 + dx, 8], [90 + dx, 8], [96 + dx, 40], [12 + dx, 40]], 'tp', { flat: 0.6, pat: mottle({ amt: 0.12, scale: 5, seed: 6 }) });
  for (const y of [15, 23, 31]) s.line(16 + dx - (y - 8) * 0.2, y, 92 + dx + (y - 8) * 0.2, y, 0x7a2018, 1, 0.5); // its folds
  s.line(54 + dx, 8, 54 + dx, 40, 0xe8785a, 1, 0.6); // the ridge pole under it
  for (const x of [20, 88]) s.line(x + dx, 9, x + dx + (x < 54 ? -4 : 4), 40, 0xe8d8b0, 1, 0.8); // ropes
  s.poly([[12 + dx, 38], [96 + dx, 38], [96 + dx, 43], [12 + dx, 43]], 'tp', { flat: 0.38 });
  for (let x = 14; x < 96; x += 6) s.px(x + dx, 41, 0xf0e0c0); // stitching
  // the tin chimney at the back, steam off it; the pot at its side, boiling over, more steam
  s.tube(84 + dx, 2, 84 + dx, 12, 2.2, 'pt');
  s.ellipse(84 + dx, 2, 3, 1.4, 'K', { flat: 0.4 });
  steam(s, 86 + dx, -2, 2, k, 0.8);
  s.ellipse(14, 30, 11, 8, 'pt', { bias: 0.06 }); // the great pot
  s.ellipse(14, 27, 9, 5, 'br', { flat: 0.68, pat: speckle({ amt: 0.2, light: 0.2, seed: 7 }) }); // its broth
  for (let i = 0; i < 4; i++) s.dot(9 + i * 3.4, 27 + Math.sin(i + k) * 1.4, 1, 0xfff4e0); // boiling
  s.ellipse(14, 24, 10, 3, 'br', { flat: 0.75 }); // boiling over
  steam(s, 13, 16, 3, k + 1);
  // the lanterns under the roof's front: its eyes; then the noren over them - five panels from the valance, slit
  // between, a white wave on each: the middle three its fringe, the outer two its lids (how low they come: its look)
  const tilt = run ? -3 : 0;
  const eye = o.blink ? 'shut' : o.eye ?? 'open';
  for (const x of [25, 83]) lantern(s, x + dx, 56, eye, tilt);
  const nb = run ? 48 : o.noren ?? 58;
  const lid = run ? 45 : eye === 'open' ? 49 : eye === 'half' ? 54 : eye === 'dizzy' ? 47 : 61;
  for (let i = 0; i < 5; i++) {
    const x0 = 16 + i * 15.2 + dx;
    const sw = run ? -3 : Math.sin(k * 1.4 + i) * 0.8;
    const outer = i === 0 || i === 4;
    const bot = outer ? lid : nb;
    // (the lids slant, their inner corners lower: a frown)
    const [bl, br] = outer ? (i === 0 ? [bot - 2, bot + 1] : [bot + 1, bot - 2]) : [bot, bot];
    s.poly([[x0, 43], [x0 + 14.4, 43], [x0 + 14.4 + sw, br], [x0 + sw, bl]], 'nr', { flat: 0.5 - (i % 2) * 0.06 });
    if (bot - 43 > 7) {
      s.line(x0 + 3 + sw * 0.5, bot - 6, x0 + 10 + sw * 0.5, bot - 4, 0xe8eef8, 1.2); // its white wave
      s.line(x0 + 3 + sw * 0.5, bot - 4, x0 + 6 + sw * 0.5, bot - 7, 0xe8eef8, 1);
    }
  }
  // the stools before the counter: its teeth
  if (!run) for (let i = 0; i < 5; i++) { s.ellipse(26 + i * 14, 91, 5, 3.4, 'st', { bias: 0.08 }); s.line(23 + i * 14, 94, 29 + i * 14, 94, 0x5a4a3a, 1); }
  // a ladle out of the pot, flinging
  if (o.ladle != null) {
    const a = -1.2 + o.ladle * 0.9;
    const [lx, ly] = [14 + Math.cos(a) * 20, 26 + Math.sin(a) * 20];
    s.tube(14, 26, lx, ly, 1.2, 'wd');
    s.ellipse(lx, ly, 4, 3.2, 'pt', { bias: 0.1 });
    s.ellipse(lx, ly - 0.6, 2.6, 1.8, 'br', { flat: 0.7 });
  }
  // broth splashed over it
  if (o.splash != null) for (let i = 0; i < 16; i++) { const a = i * 0.9 + o.splash; s.ellipse(54 + Math.cos(a) * (12 + (i % 4) * 9), 50 + Math.sin(a) * (10 + (i % 3) * 8), 2.2, 1.6, 'br', { flat: 0.8 }); }
  // a griddle pulled out at its front, the gyoza in rows on it, sizzling
  if (o.grill) {
    s.poly([[26, 92], [82, 92], [86, 104], [22, 104]], 'K', { flat: 0.45 });
    for (let j = 0; j < 2; j++) for (let i = 0; i < 6; i++) { s.ellipse(32 + i * 9 + j * 3, 96 + j * 5, 3.4, 2, 'gy', { bias: 0.1 }); s.line(30 + i * 9 + j * 3, 97 + j * 5, 35 + i * 9 + j * 3, 97 + j * 5, 0x8a4a14, 1); }
    for (let i = 0; i < 4; i++) s.dot(30 + i * 14 + (k % 2) * 4, 90 - (k % 2) * 2, 1, 0xfff4e0, 0.8);
  }
  return s.render();
}

/** Turned round: the back of the stall - planks, the gas bottle on its stand with its gold valve, crates. */
function back(f) {
  const s = new HiSprite(W, W, RAMPS);
  for (const x of [8, 100]) s.ellipse(x, 76, 4.6, 13, 'rb', { bias: 0.04 });
  s.poly([[12, 40], [96, 40], [96, 88], [12, 88]], 'wd', { flat: 0.5, pat: speckle({ amt: 0.14, seed: 8 }) });
  for (let y = 46; y < 88; y += 7) s.line(12, y, 96, y, 0x3a2414, 1, 0.7);
  s.poly([[18, 8], [90, 8], [96, 40], [12, 40]], 'tp', { flat: 0.52 });
  s.poly([[12, 38], [96, 38], [96, 43], [12, 43]], 'tp', { flat: 0.36 });
  s.tube(24, 2, 24, 12, 2.2, 'pt');
  steam(s, 26, -2, 2, f, 0.8);
  // crates of bottles, a bucket
  s.poly([[66, 64], [90, 64], [90, 86], [66, 86]], 'wd', { flat: 0.62 });
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) s.dot(70 + i * 5.6, 69 + j * 6, 2, 0x3a6a3a);
  s.ellipse(24, 78, 6, 7, 'pt', { bias: 0.08 });
  // the gas bottle, the valve on its top: gold
  s.tube(46, 56, 46, 86, 7, 'gs');
  s.ellipse(46, 54, 6, 3, 'gs', { bias: 0.1 });
  s.ellipse(46, 50, 4.4, 2.6, 'Y', { glow: f === 1, bias: 0.08 });
  s.line(46, 50, 58, 46, 0x2a2a30, 1.4); // the hose to the burners
  for (const x of [15, 93]) { s.line(x, 40, x, 44, 0x2a2420, 1.4); s.ellipse(x, 52, 6.4, 8, 'tp', { bias: 0.05 }); } // the lanterns from behind, dark
  return s.render();
}

function bowl(f) {
  const s = new HiSprite(36, 36, RAMPS);
  s.ellipse(18, 18, 15, 15, 'bw', { bias: 0.06 });
  for (let a = 0; a < 6.28; a += 0.52) s.dot(18 + Math.cos(a + f * 0.26) * 13.4, 18 + Math.sin(a + f * 0.26) * 13.4, 1.4, 0xc8301e); // its red rim pattern
  s.ellipse(18, 18, 11, 11, 'br', { flat: 0.6 });
  for (let i = 0; i < 5; i++) s.line(10, 14 + i * 2, 26, 16 + i * 2 - (i % 2) * 2, 0xfff0c8, 1); // noodles
  s.ellipse(13, 21, 3, 2.4, 'W', { flat: 0.85 }); // fish cake
  s.dot(13, 21, 1, 0xe85a8a);
  s.ellipse(23, 21, 2.6, 2.2, 'Q', { flat: 0.7 }); // pickled ginger
  return s.render();
}

function kaedama(f) {
  const s = new HiSprite(30, 30, RAMPS);
  s.ellipse(15, 15, 11, 10, 'Y', { glow: true, flat: 0.62 });
  for (let i = 0; i < 9; i++) { const a = i * 0.7 + f * 0.4; s.line(15 + Math.cos(a) * 9, 15 + Math.sin(a) * 8, 15 + Math.cos(a + 2.2) * 6, 15 + Math.sin(a + 2.2) * 6, 0xfff4b0, 1); } // the coil of noodles
  for (const [x, y] of [[4, 6], [26, 8], [24, 26], [5, 24]]) s.dot(x, y, 1.2, 0xfff0a0); // its glints
  return s.render();
}

function gyoza(f) {
  const s = new HiSprite(24, 18, RAMPS);
  const r = f ? 1.2 : 1;
  s.ellipse(12, 10, 9 * r, 5.4 * r, 'gy', { bias: 0.06 });
  s.ellipse(12, 12.6, 8 * r, 2.4 * r, 'Q', { flat: 0.45 }); // its crisp brown bottom
  for (let i = -3; i <= 3; i++) s.line(12 + i * 2.2, 5 * r + 2, 12 + i * 2.2 + 0.8, 8, 0xb8945a, 1); // its pleats
  return s.render();
}

/** A pan's worth of gyoza flipped out whole: seven in a ring, their pleats outward, browned bottoms up, joined by the
 * crisp lacy wing (hane) the starch water fried into; chopped green onion in the middle. f: the crust's glints. */
function hane(f) {
  const s = new HiSprite(48, 48, RAMPS);
  const [cx, cy, R] = [24, 24, 22];
  // the lace: a golden disc full of little holes, thinner and more open towards its rim
  const hole = (x, y) => {
    const d = Math.hypot(x - cx, y - cy) / R;
    const h = Math.sin(x * 1.9 + y * 0.7) * Math.cos(y * 1.7 - x * 0.5) + Math.sin((x + y) * 1.1 + f);
    return h > 1.25 - d * 0.9;
  };
  s.paint([0, 0, 48, 48], (x, y) => Math.hypot(x - cx, y - cy) <= R - (Math.sin(Math.atan2(y - cy, x - cx) * 11) > 0.6 ? 2 : 0) && !hole(x, y), 'Y', () => 0.5, { tex: 0.35, seed: 7 + f });
  // the dumplings, browned side up, in a ring
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
    const [ix, iy, ox, oy] = [cx + Math.cos(a) * 6, cy + Math.sin(a) * 6, cx + Math.cos(a) * 16, cy + Math.sin(a) * 16];
    s.tube(ix, iy, ox, oy, 4.2, 'gy', { bias: 0.05 });
    s.tube(ix + Math.cos(a) * 1.5, iy + Math.sin(a) * 1.5, ox - Math.cos(a) * 1.5, oy - Math.sin(a) * 1.5, 2.4, 'gb', { bias: 0.05 }); // the crisp brown face
    // its pleats, along one edge
    for (let k = 0; k < 4; k++) {
      const t = 0.15 + k * 0.22;
      const [px, py] = [ix + (ox - ix) * t, iy + (oy - iy) * t];
      s.line(px + Math.cos(a + 1.57) * 3.6, py + Math.sin(a + 1.57) * 3.6, px + Math.cos(a + 1.57) * 2, py + Math.sin(a + 1.57) * 2, 0xb8945a, 1);
    }
  }
  // green onion in the middle, a few sesame seeds
  for (const [x, y, c] of [[23, 22, 0x5ab84a], [26, 25, 0x8ad86a], [22, 26, 0x5ab84a], [25, 21, 0x8ad86a], [24, 24, 0x3a8a3a]]) s.dot(x, y, 1.2, c);
  for (const [x, y] of [[20, 23], [27, 23], [24, 28]]) s.px(x, y, 0xfff4dc);
  // the crust's glints
  for (let i = 0; i < 6; i++) {
    const a = i * 1.05 + f * 0.5;
    s.px(Math.round(cx + Math.cos(a) * 19), Math.round(cy + Math.sin(a) * 19), 0xfff0a0);
  }
  return s.render();
}

/** A drop of hot oil off the griddle: amber, glossy. */
function oil() {
  const s = new HiSprite(12, 12, RAMPS);
  s.ellipse(6, 6, 3.6, 3.6, 'Y', { glow: true, bias: 0.1 });
  s.dot(5, 5, 1, 0xfff8d0);
  return s.render();
}

/** A flake of the gyoza's lacy crust, broken off. */
function lace() {
  const s = new HiSprite(12, 12, RAMPS);
  s.poly([[2, 4], [6, 1], [10, 3], [11, 8], [7, 11], [2, 9]], 'Y', { flat: 0.55 });
  for (const [x, y] of [[5, 5], [8, 7], [5, 8]]) s.px(x, y, 0x6a3f0a);
  s.px(7, 3, 0xfff0a0);
  return s.render();
}

function noodle() {
  const s = new HiSprite(12, 12, RAMPS);
  for (let t = 0; t < 1; t += 0.05) s.dot(6 + Math.sin(t * 9) * 3, 2 + t * 8, 1.4, 0xfff0c0);
  s.ellipse(6, 6, 3.4, 3.4, 'br', { flat: 0.75, glow: true });
  return s.render();
}

function stool() {
  const s = new HiSprite(18, 18, RAMPS);
  for (const [x, y] of [[4, 14], [14, 14], [4, 6], [14, 6]]) s.dot(x, y, 1, 0x3a3a40);
  s.ellipse(9, 9, 7, 6, 'st', { bias: 0.08 });
  s.ellipse(9, 9, 4, 3.4, 'tp', { flat: 0.6 }); // a red vinyl seat
  return s.render();
}

function valve(f) {
  const s = new HiSprite(18, 18, RAMPS);
  s.ellipse(9, 9, 7, 7, 'Y', { glow: true, flat: 0.55 + f * 0.15 });
  for (let a = 0; a < 6.28; a += 1.05) s.line(9, 9, 9 + Math.cos(a + f * 0.5) * 6.4, 9 + Math.sin(a + f * 0.5) * 6.4, 0x9a5f10, 1); // its spokes
  s.dot(9, 9, 2, 0xfff0a0);
  return s.render();
}

/** The little truck from above, facing left: its cab, the windscreen, its open bed with rails; the tow rope behind. */
function truck() {
  const s = new HiSprite(78, 36, RAMPS);
  for (const [x, y] of [[14, 6], [14, 30], [48, 6], [48, 30]]) s.ellipse(x, y, 4, 2.4, 'rb', { flat: 0.4 });
  s.poly([[4, 8], [26, 8], [26, 28], [4, 28]], 'tk', { flat: 0.7 }); // the cab's roof
  s.poly([[2, 10], [8, 9], [8, 27], [2, 26]], 'C', { flat: 0.6 }); // the windscreen
  s.poly([[26, 7], [58, 7], [58, 29], [26, 29]], 'tk', { flat: 0.5 }); // the bed
  s.poly([[28, 9], [56, 9], [56, 27], [28, 27]], 'E', { flat: 0.48 });
  for (let x = 30; x < 56; x += 4) s.line(x, 9, x, 27, 0x6a6a72, 1, 0.6);
  s.line(58, 18, 76, 18, 0xe8d8b0, 1.4); // the tow rope
  s.dot(76, 18, 1.6, 0x5a5a60);
  return s.render();
}

function shadow() {
  const s = new HiSprite(W, 36, RAMPS);
  s.ellipse(54, 18, 50, 14, 'K', { flat: 0.2 });
  return s.render({ outline: 0 });
}

/** Every frame, under the names the fight uses (src/game/enemies/fukuoka-yatai.js). */
export function yataiFrames(add) {
  for (let f = 0; f < 4; f++) add(`yt_idle_${f}`, stall({ sway: [0, 1, 0, -1][f], k: f, noren: 58 + (f % 2) }));
  add('yt_blink', stall({ k: 0, blink: true }));
  for (let f = 0; f < 2; f++) add(`yt_ladle_${f}`, stall({ k: f, ladle: f, mouth: 4 }));
  add('yt_shout', stall({ k: 1, noren: 50, mouth: 14 }));
  for (let f = 0; f < 2; f++) add(`yt_stun_${f}`, stall({ k: f, eye: 'dizzy', noren: 54, splash: f * 0.5, sway: f ? 2 : -2 }));
  for (let f = 0; f < 2; f++) add(`yt_back_${f}`, back(f));
  for (let f = 0; f < 2; f++) add(`yt_grill_${f}`, stall({ k: f, grill: true, eye: 'open', noren: 56 }));
  for (let f = 0; f < 2; f++) add(`yt_run_${f}`, stall({ k: f, run: true, eye: 'open' }));
  for (let f = 0; f < 2; f++) add(`yt_pant_${f}`, stall({ k: f, eye: 'half', noren: 47 + f, mouth: 10 + f * 3 }));
  add('yt_sleep', stall({ k: 0, eye: 'shut', noren: 64 }));
  for (let f = 0; f < 2; f++) {
    add(`yt_bowl_${f}`, bowl(f));
    add(`yt_kaedama_${f}`, kaedama(f));
    add(`yt_gyoza_${f}`, gyoza(f));
    add(`yt_hane_${f}`, hane(f));
    add(`yt_valve_${f}`, valve(f));
  }
  add('yt_noodle', noodle());
  add('yt_oil', oil());
  add('yt_lace', lace());
  add('yt_stool', stool());
  add('yt_truck', truck());
  add('yt_shadow', shadow());
}
