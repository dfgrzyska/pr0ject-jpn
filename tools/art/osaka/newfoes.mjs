// Osaka's looks for two of the shared behaviours (src/game/enemies/chainSplitCart.js, docs/plan-silniejsze-fale.md;
// no pair here: every enemy of Osaka already goes in a manzai duo), drawn at 540 px with HiSprite:
//   chain  - kitchō, the lucky charms of Tōka Ebisu at Imamiya Ebisu by Shinsekai, hung from a straw rope tied with
//            sprigs of bamboo grass (fukuzasa) over a street: in turn a red sea bream, a gold koban and a rice bale
//            with its red and white tag; the sea bream that wakes rolls its eye and gapes (these shoot); one
//            catching fire, the charred cord and its sprig of leaves left on the rope. (In place of the uchiwa fans:
//            Tokyo's diver already is an uchiwa.)
//   cart   - a danjiri, the carved wooden float of Osaka's festivals, careering down a street by itself: its heavy
//            curved roof, the carpenter dancing on top with a fan in each hand, red lanterns along its eaves, the
//            carved beams under its front gable and a carved face glaring out of the board, its four low wheels,
//            its two long ropes trailing ahead with no one on them; it breaks up in three stages (its carvings
//            knocked off, splinters flying: it glares red; its roof torn off, the drum and the gong inside showing,
//            a wheel gone; on fire), its wreck slewed across the street, the roof's timbers in a heap
import { HiSprite, tones, speckle } from '../../lib/hisprite.mjs';

const INK = 0x14101c;
const TAU = Math.PI * 2;
const RAMPS = {
  tr: tones([0x6a0e10, 0xd8301e, 0xff8a6a]), // the sea bream's red
  gd: tones([0x8a5a10, 0xe0a828, 0xfff0a0]), // gold
  st: tones([0x6a5420, 0xc8a85a, 0xf0dca0]), // straw
  ss: tones([0x1e3a14, 0x3a6a24, 0x7aa84a]), // bamboo grass
  wt: tones([0xa8a49a, 0xeeeae0, 0xffffff]), // white paper
  rp: tones([0x6a0a10, 0xc82024, 0xff6a5a]), // red paper
  fl: tones([0xb82a08, 0xff8a1a, 0xfff2a0]), // flame
  ch: tones([0x0e0a08, 0x2a201a, 0x4a3a30]), // charred
  wd: tones([0x2a160c, 0x5a3418, 0x9a6a3a]), // the danjiri's keyaki wood, dark and oiled
  cv: tones([0x4a2a12, 0x8a5a2a, 0xc8945a]), // its carvings, lighter where they catch the light
  cu: tones([0x1a2a26, 0x3a5a4e, 0x7a9a86]), // the copper on its roof, gone green
  in: tones([0x0e1630, 0x22346a, 0x4a64a4]), // indigo cotton (the carpenter's happi)
  ir: tones([0x121216, 0x2e2e36, 0x5a5a66]), // iron
  sm: tones([0x6a6a70, 0xb0b0b4, 0xe8e8ea]), // smoke
};

// ---------------------------------------------------------------- chain: a charm (30 x 46) on its cord off the rope
/** The cord down from the rope and its sprig of bamboo grass tied at the top (the charm hangs from y0). */
function cord(s, c, y0, burnt = false) {
  s.line(c, 4, c, y0, burnt ? 0x2a201a : 0xd8c890, 1);
  // the sprig: three leaves of bamboo grass fanned out along the rope, a white paper streamer
  for (const [a, len] of [[-2.8, 11], [-0.3, 11], [-1.6, 6]]) {
    const [ux, uy] = [Math.cos(a), Math.sin(a)];
    s.paint([c - 14, 0, c + 14, 12], (x, y) => {
      const a2 = (x - c) * ux + (y - 5) * uy, b2 = -(x - c) * uy + (y - 5) * ux;
      const t = a2 / len;
      return t > 0 && t < 1 && Math.abs(b2 - t * 1.2) < 1.8 * Math.sin(Math.PI * t);
    }, burnt ? 'ch' : 'ss', () => 0.55);
  }
  if (!burnt) s.poly([[c + 2, 6], [c + 4, 6], [c + 5, 14], [c + 3, 13]], 'wt', { flat: 0.7 }); // the streamer
  s.ellipse(c, 5, 1.8, 1.4, burnt ? 'ch' : 'st', { flat: 0.5 }); // the knot on the rope
}

/** A red sea bream hanging head down: its body, the fins, the scales, its eye (and woken: the eye rolling, gaping). */
function tai(s, c, f, kind) {
  const y0 = 14;
  // its tail up at the cord, the body fat in the middle, the head down
  s.poly([[c - 6, y0 - 1], [c + 6, y0 - 1], [c + 2, y0 + 5], [c - 2, y0 + 5]], 'tr', { flat: 0.55 }); // the tail fin
  s.line(c - 5, y0, c - 1, y0 + 4, 0x8a1a10, 1, 0.7);
  s.line(c + 5, y0, c + 1, y0 + 4, 0x8a1a10, 1, 0.7);
  s.ellipse(c, y0 + 17, 7.6, 13, 'tr', { bias: 0.1 });
  // its fins: the spiny back fin along one side, the belly fins on the other, the pectoral fin
  for (let k = 0; k < 6; k++) s.line(c + 6.6, y0 + 9 + k * 2.4, c + 9.4, y0 + 8 + k * 2.4, 0xb82418, 1);
  s.poly([[c - 7, y0 + 14], [c - 10, y0 + 18], [c - 7, y0 + 22]], 'tr', { flat: 0.4 });
  s.poly([[c - 1, y0 + 22], [c - 5, y0 + 24], [c - 1, y0 + 26]], 'tr', { flat: 0.7 });
  // the scales: rows of little arcs, gold glints on them
  for (let j = 0; j < 6; j++) for (let i = -2; i <= 2; i++) {
    const [x, y] = [c + i * 2.6 + (j % 2) * 1.3, y0 + 9 + j * 2.6];
    if (((x - c) / 6.6) ** 2 + ((y - y0 - 17) / 11) ** 2 < 1) s.line(x - 1, y, x + 1, y + 0.6, 0x9a1a10, 1, 0.6);
  }
  for (const [x, y] of [[c - 3, y0 + 12], [c + 2, y0 + 16], [c - 1, y0 + 20]]) s.dot(x, y, 0.6, 0xffd060, 0.9);
  // its head at the bottom: the gill line, the eye, the mouth
  s.line(c - 5, y0 + 24, c + 5, y0 + 25, 0x8a1a10, 1);
  const woke = kind === 'eye';
  s.dot(c + 2.4, y0 + 26.4, woke ? 1.9 : 1.4, 0xfff4e0);
  s.dot(c + 2.4 + (woke ? (f ? 0.6 : -0.6) : 0), y0 + 26.4, woke ? 0.9 : 0.8, woke ? 0xff3a20 : INK);
  if (woke) {
    s.line(c + 0.4, y0 + 24.2, c + 4.6, y0 + 25, INK, 1); // (its brow knit)
    s.ellipse(c, y0 + 30 + (f ? 0.4 : 0), 2.2, f ? 2 : 1.4, 'K', { flat: 0.2 }); // gaping
  } else s.line(c - 1.6, y0 + 29.6, c + 1.6, y0 + 29.6, 0x6a0e10, 1);
}

/** A gold koban: the oval coin, its stamped bands across, the mint's marks, its rim. */
function koban(s, c) {
  const y = 26;
  s.ellipse(c, y, 7.4, 11.6, 'gd', { bias: 0.12 });
  s.ellipse(c, y, 6, 10.2, 'gd', { flat: 0.62 });
  for (let k = -4; k <= 4; k++) s.line(c - Math.sqrt(Math.max(0, 1 - (k / 5) ** 2)) * 5.4, y + k * 2, c + Math.sqrt(Math.max(0, 1 - (k / 5) ** 2)) * 5.4, y + k * 2, 0xb07818, 1, 0.55); // (the hammered bands)
  s.ellipse(c, y - 6, 2, 1.6, 'gd', { flat: 0.35 }); // the stamped marks (a paulownia crest worn smooth, no writing)
  s.ellipse(c, y + 6, 2, 1.6, 'gd', { flat: 0.35 });
  for (const [x, yy] of [[c - 3, y - 8], [c - 4, y - 2]]) s.dot(x, yy, 0.7, 0xfff8d0);
}

/** A rice bale: a straw drum bound with rope, its round ends, its red and white paper tag. */
function tawara(s, c) {
  const y = 26;
  s.paint([c - 9, y - 12, c + 9, y + 12], (x, yy) => Math.abs(x - c) < 7.6 - Math.max(0, Math.abs(yy - y) - 8) * 0.8 && Math.abs(yy - y) < 11, 'st', (x, yy) => 0.6 - (x - c) * 0.03 + Math.sin(yy * 2.4) * 0.05, { pat: speckle({ amt: 0.15, seed: 3 }) });
  for (const k of [-6, 0, 6]) s.line(c - 7.4, y + k, c + 7.4, y + k + 0.4, 0x7a5a20, 1.2); // its ropes
  s.line(c, y - 11, c, y + 11, 0x7a5a20, 1, 0.6);
  for (const k of [-1, 1]) s.ellipse(c, y + k * 10.4, 5.6, 1.4, 'st', { flat: 0.35 }); // (its round ends)
  s.poly([[c + 3, y - 4], [c + 8, y - 3], [c + 7, y + 4], [c + 2, y + 3]], 'wt', { flat: 0.7 }); // the tag
  s.poly([[c + 3, y - 4], [c + 8, y - 3], [c + 7.8, y - 1], [c + 2.8, y - 2]], 'rp', { flat: 0.6 });
}

function kitcho(kind, f = 0) {
  const s = new HiSprite(30, 46, RAMPS);
  const c = 15;
  if (kind === 'burnt') {
    cord(s, c, 18, true);
    s.ellipse(c, 19, 2.2, 1.6, 'ch', { flat: 0.4 });
    s.dot(c + 0.6, 19.4, 0.8, 0xff7020, 0.9);
    return s.render({ outline: 2 });
  }
  cord(s, c, 14);
  if (kind === 1) koban(s, c);
  else if (kind === 2) tawara(s, c);
  else tai(s, c, f, kind);
  if (kind === 'lit') {
    // fire catching under its head and climbing it
    s.paint([0, 26, 30, 46], (x, y) => y > 34 + Math.sin(x * 1.3 + f) * 2 && s.mat[Math.floor(y) * 30 + Math.floor(x)] != null, 'ch', () => 0.4);
    for (let k = -1; k <= 1; k++) s.ellipse(c + k * 3.6, 36 - ((f + k + 2) % 3) * 1.6, 2.4, 5, 'fl', { flat: 0.8, glow: true });
    for (let i = 0; i < 3; i++) s.dot(c - 4 + i * 4, 27 - ((i + f) % 3) * 2, 0.7, 0xfff2a0);
  }
  return s.render({ outline: 2 });
}

/** The pole (22 x 22, from above): a cut bamboo with its tuft of bamboo grass left on, the rope tied round it. */
function pole() {
  const s = new HiSprite(22, 22, RAMPS);
  for (const [a, len] of [[0.4, 10], [1.9, 9], [3.3, 10], [4.6, 9], [5.6, 8]]) {
    const [ux, uy] = [Math.cos(a), Math.sin(a)];
    s.paint([0, 0, 22, 22], (x, y) => {
      const a2 = (x - 11) * ux + (y - 11) * uy, b2 = -(x - 11) * uy + (y - 11) * ux;
      const t = a2 / len;
      return t > 0.2 && t < 1 && Math.abs(b2) < 1.9 * Math.sin(Math.PI * t);
    }, 'ss', (x) => 0.5 + (x - 11) * -0.02);
  }
  s.ellipse(11, 11, 3, 3, 'st', { bias: 0.15 });
  s.ellipse(11, 11, 1.7, 1.7, 'wd', { flat: 0.25 }); // (the hollow culm)
  s.tube(0, 11.6, 22, 11, 0.8, 'st', { flat: 0.6 }); // the straw rope
  return s.render({ outline: 2 });
}

// ---------------------------------------------------------------- cart: the danjiri (48 x 84), down the screen
// (its front, and its ropes, down the frame: the way it careers)
function danjiri(stage, f) {
  const s = new HiSprite(48, 84, RAMPS);
  const c = 24;
  const broke = stage >= 1; // (its carvings knocked off)
  const bare = stage >= 2; // (its roof torn off, a wheel gone)
  const sway = (f ? 0.8 : -0.8) * (bare ? 2 : 1);
  // the two great ropes out ahead, thick and braided, slack and swinging with no one on them, their red tassels
  for (const sx of [-1, 1]) {
    const pts = [];
    for (let t = 0; t <= 1.001; t += 0.05) pts.push([c + sx * (5 + t * t * 13) + Math.sin(t * 6.2 + f * 2 + sx) * 2.4 * t, 66 + t * 19]); // (splaying out, off the frame: long)
    for (let k = 0; k + 1 < pts.length; k++) s.tube(...pts[k], ...pts[k + 1], 1.3, 'st', { flat: sx < 0 ? 0.62 : 0.48 });
    for (let k = 1; k < pts.length; k += 2) s.dot(pts[k][0], pts[k][1], 0.5, 0x8a6a30, 0.8); // (its braid)
    s.ellipse(c + sx * 5, 67, 1.6, 1.4, 'rp', { bias: 0.15 }); // (a red tassel where it is tied on)
  }
  // its wheels: low and solid, iron-rimmed, peeping out at the corners (the back pair under the eaves)
  const wheel = (x, y, h = 5) => {
    s.poly([[x - 2.4, y - h], [x + 2.4, y - h], [x + 2.4, y + h], [x - 2.4, y + h]], 'wd', { flat: 0.45 });
    s.line(x - 2.4, y - h + ((f * 3) % (h * 2)), x + 2.4, y - h + ((f * 3) % (h * 2)), 0x6a6a72, 1, 0.8);
  };
  wheel(c - 16, 60, 4);
  if (!bare) wheel(c + 16, 60, 4);
  else for (let k = 0; k < 3; k++) s.dot(c + 15 + k, 64 + k * 4, 0.8, 0x8a8682, 0.8); // (the axle scraping the street)
  for (const sx of [-1, 1]) wheel(c + sx * 16, 12, 3);
  // the body under the roof: keyaki posts and carved panels down its sides
  s.paint([c - 15, 8, c + 15, 60], (x, y) => Math.abs(x - c) < 13.6 && y > 9 && y < 58, 'wd', (x, y) => 0.42 - (x - c) * 0.01, { pat: speckle({ amt: 0.12, seed: 4 }) });
  if (!bare) {
    // the roof from above: its two slopes either side of the ridge, the eaves flaring out wide at the front, the
    // boards running down from the ridge, the copper ridge gone green and its gilt end
    const half = (y) => 15.5 + Math.max(0, (y - 22) / 12) ** 2 * 3.5 + Math.max(0, (8 - y) / 4) * 1.5;
    s.paint([c - 20, 3, c + 20, 36], (x, y) => Math.abs(x - c) < half(y) && y > 4 && y < 35 - Math.abs(x - c) * 0.08, 'wd', (x, y) => (x < c ? 0.74 : 0.36) - Math.abs(x - c) * 0.006, { pat: speckle({ amt: 0.06, seed: 2 }) });
    for (let x = c - 18; x <= c + 18; x += 2.2) if (Math.abs(x - c) > 1.8) s.line(x, 5, x + (x - c) * 0.12, 34, 0x1a0e08, 1, 0.3); // (its boards)
    s.paint([c - 3, 3, c + 3, 34], (x, y) => Math.abs(x - c) < 1.7 && y > 4 && y < 33, 'cu', (x) => (x < c ? 0.7 : 0.45)); // the ridge
    s.ellipse(c, 4.6, 2.4, 1.6, 'gd', { flat: 0.6 }); // (its gilt end at the back)
    // the red lanterns hung along its eaves, lit
    for (let k = 0; k < 5; k++) for (const sx of [-1, 1]) s.ellipse(c + sx * (half(7 + k * 6) + 0.6), 7 + k * 6 + (f && k % 2 ? 0.5 : 0), 1.3, 1.7, 'rp', { bias: 0.2, glow: true });
    // the carpenter dancing on the roof's front: indigo happi with its white pattern, his headband, a fan flung
    // out in each hand, one knee up
    const [dx, dy] = [c + sway, 24];
    s.ellipse(dx, dy, 3.4, 3.8, 'in', { bias: 0.15 });
    for (let k = -1; k <= 1; k++) s.dot(dx + k * 1.6, dy + 1.2, 0.5, 0xf0ece0, 0.9);
    s.ellipse(dx, dy - 4.4, 2, 2, 'K', { bias: 0.2 }); // (his head, black hair)
    s.line(dx - 2, dy - 5, dx + 2, dy - 5, 0xf0ece0, 1);
    s.line(dx - 1, dy + 3.6, dx - 1 - (f ? 1 : 0), dy + 6.4, 0x2a2a30, 1.2); // (his legs, tabi)
    s.line(dx + 1, dy + 3.6, dx + 1.6 + (f ? 0 : 1), dy + 5.6, 0x2a2a30, 1.2);
    for (const sx of [-1, 1]) {
      const [hx, hy] = [dx + sx * (6 + (f ? 1 : 0)), dy - 2.6 + (f ? -sx : sx) * 1.6];
      s.line(dx + sx * 2.4, dy - 1.4, hx, hy, 0x2a346a, 1.3);
      s.ellipse(hx + sx * 1.6, hy - 0.6, 2, 2, sx < 0 ? 'rp' : 'wt', { flat: 0.62 }); // his fans
      s.line(hx, hy, hx + sx * 1.2, hy - 0.4, 0x6a4a20, 1, 0.8);
    }
    // the front gable: the curved bow of its roof (karahafu), its copper edge, gilt ornament hanging at its peak,
    // a row of lanterns under it
    const bow = (x) => 36 - Math.cos(((x - c) / 21) * Math.PI) * 3.2;
    s.paint([c - 22, 30, c + 22, 46], (x, y) => Math.abs(x - c) < 21 && y > bow(x) - 1 && y < bow(x) + 6, 'wd', (x, y) => 0.6 - (y - bow(x)) * 0.05, { pat: speckle({ amt: 0.06, seed: 6 }) });
    s.paint([c - 22, 30, c + 22, 46], (x, y) => Math.abs(x - c) < 21.4 && Math.abs(y - bow(x) + 1) < 0.9, 'cu', () => 0.65);
    s.ellipse(c, bow(c) + 2.6, 2.2, 2.6, 'gd', { flat: 0.65, glow: true });
    for (let k = -3; k <= 3; k++) s.ellipse(c + k * 5.4, bow(c + k * 5.4) + 6.8 + (f && k % 2 ? 0.4 : 0), 1.2, 1.6, k % 2 ? 'wt' : 'rp', { bias: 0.2, glow: true });
  } else {
    // its roof gone: the posts snapped off, inside the big drum, the gong and the small drums
    s.paint([c - 13, 10, c + 13, 56], (x, y) => Math.abs(x - c) < 12 && y > 11 && y < 55, 'wd', () => 0.2);
    s.ellipse(c, 28, 7, 7, 'cv', { bias: 0.1 });
    s.ellipse(c, 28, 5.4, 5.4, 'wt', { flat: 0.55 }); // the big drum's head
    for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; s.dot(c + Math.cos(a) * 6.2, 28 + Math.sin(a) * 6.2, 0.5, 0xd8b040); }
    s.ellipse(c - 6, 44, 3.2, 3.2, 'gd', { flat: 0.6 }); // the gong
    for (const x of [c + 6, c - 7]) s.ellipse(x, 15, 2.6, 2.2, 'wt', { flat: 0.5 }); // the small drums
    for (const [x, y] of [[c - 12, 10], [c + 12, 10], [c - 12, 47], [c + 12, 47]]) s.line(x, y, x + (x < c ? -2 : 2), y - 3, 0xc8945a, 1.4); // (snapped posts)
  }
  // its front: rows of carved brackets, the great carved panel with a face glaring out of it (a lion among waves),
  // the beams' ends carved as gilt lions' heads; once hit hard, chunks of it gone and splinters
  s.paint([c - 15, 44, c + 15, 66], (x, y) => Math.abs(x - c) < 14 && y > 45 && y < 65, 'cv', (x, y) => 0.42 + Math.sin(x * 2.3 + y * 1.9) * 0.14 + (Math.floor(y) % 4 === 0 ? 0.12 : 0), { pat: speckle({ amt: 0.18, seed: 9 }) });
  for (let x = c - 13; x <= c + 13; x += 2.6) s.ellipse(x, 47, 1, 0.9, 'cv', { flat: 0.7 }); // (the brackets' ends)
  for (let k = 0; k < 6; k++) s.line(c - 12 + k * 4.6, 62, c - 10 + k * 4.6, 60.4, 0x2a5a8a, 1, 0.6); // (carved waves)
  if (broke) for (const [x, y] of [[c - 10, 50], [c + 9, 56], [c - 3, 47]]) s.ellipse(x, y, 2.6, 1.8, 'wd', { flat: 0.15 }); // (chunks gone)
  for (const sx of [-1, 1]) {
    s.ellipse(c + sx * 4.2, 53.6, 2, 1.5, 'K', { flat: 0.15 });
    s.dot(c + sx * 4.2, 53.6, 1, broke ? 0xff3a20 : 0xffc040);
    s.line(c + sx * 1.2, 51.4, c + sx * 6.8, 52.4, INK, 1); // (its brows)
    s.ellipse(c + sx * 14.6, 64, 2, 1.8, 'gd', { flat: 0.6 }); // (a gilt lion's head on the beam's end)
  }
  s.ellipse(c, 57.6, 3, 1.4, 'K', { flat: 0.15 }); // (its mouth)
  for (let i = -2; i <= 2; i += 2) s.dot(c + i, 57, 0.5, 0xfff0d0); // its fangs
  s.paint([c - 17, 63, c + 17, 67], (x, y) => Math.abs(x - c) < 16.4 && y > 63.6 && y < 66.4, 'wd', () => 0.55); // the front beam
  if (stage === 1 || stage === 2) for (let k = 0; k < 4; k++) s.line(c - 18 + k * 12, 70 + (k % 2) * 3 + f, c - 16 + k * 12, 68 + (k % 2) * 3 + f, 0xc8945a, 1); // (splinters flying)
  if (stage >= 3) {
    for (let k = 0; k < 5; k++) {
      const x = c - 14 + k * 7;
      const h = 8 + ((k * 3 + f * 2) % 5);
      s.paint([x - 3, 44 - h - 6, x + 3, 46], (px, py) => {
        const t = (44 - py) / (h + 6);
        return t > 0 && t < 1 && Math.abs(px - x) < 2.8 * (1 - t) + 0.6;
      }, 'fl', (px, py) => 0.5 + ((44 - py) / (h + 6)) * 0.45, { glow: true });
    }
    for (let k = 0; k < 3; k++) s.ellipse(c - 6 + k * 6, 6 - k, 2.4 + k * 0.4, 1.8, 'sm', { flat: 0.6, glow: true });
  }
  return s.render({ outline: 2 });
}

function danjiriWreck() {
  const s = new HiSprite(48, 84, RAMPS);
  const c = 24;
  // the base slewed across the street, charred at one end; the roof's timbers and copper in a heap beside it; a
  // wheel off on the street; the drum split; the ropes slack
  s.paint([0, 0, 48, 84], (x, y) => { const u = (x - c) * 0.86 + (y - 40) * 0.5, v = -(x - c) * 0.5 + (y - 40) * 0.86; return Math.abs(u) < 12 && Math.abs(v) < 22; }, 'wd', (x, y) => 0.45 + (Math.floor((y + x * 0.6) / 3) % 2 ? 0.05 : -0.04), { pat: speckle({ amt: 0.3, dark: 0.3, seed: 5 }) });
  s.paint([0, 0, 48, 84], (x, y) => { const u = (x - c) * 0.86 + (y - 40) * 0.5, v = -(x - c) * 0.5 + (y - 40) * 0.86; return Math.abs(u) < 12 && v > 8 && v < 22; }, 'ch', () => 0.4, { pat: speckle({ amt: 0.3, seed: 7 }) });
  for (let k = 0; k < 7; k++) s.tube(c - 20 + ((k * 7) % 14), 58 + k * 3, c - 6 + ((k * 5) % 10), 62 + k * 2.4, 1.2, k % 3 ? 'wd' : 'cu', { flat: 0.4 + (k % 2) * 0.2 });
  s.ellipse(c + 2, 38, 6, 6, 'cv', { flat: 0.45 });
  s.line(c - 2, 33, c + 5, 43, 0x2a160c, 1.4); // (the drum split)
  s.poly([[c + 14, 64], [c + 19, 64], [c + 19, 74], [c + 14, 74]], 'wd', { flat: 0.35 });
  for (let y = 4; y < 30; y += 0.5) s.dot(c - 10 + Math.sin(y * 0.4) * 4, y, 0.8, 0xc8bca0, 0.9); // (a rope, slack)
  for (let i = 0; i < 5; i++) s.dot(c - 8 + i * 4, 30 + (i % 3) * 6, 0.9, 0xff7020, 0.85);
  return s.render({ outline: 2 });
}

/** Osaka's frames for the shared behaviours (skins.js: osaka chain, cart). */
export function osakaNewFoes(add) {
  for (let i = 0; i < 3; i++) add(`os_kitcho_${i}`, kitcho(i));
  for (let f = 0; f < 2; f++) add(`os_kitcho_eye_${f}`, kitcho('eye', f));
  for (let f = 0; f < 2; f++) add(`os_kitcho_lit_${f}`, kitcho('lit', f));
  add('os_kitcho_burnt', kitcho('burnt'));
  add('os_pole', pole());
  for (let st = 0; st < 4; st++) for (let f = 0; f < 2; f++) add(`os_danjiri_${st}_${f}`, danjiri(st, f));
  add('os_danjiri_wreck', danjiriWreck());
}
