// Nagasaki's enemies at 540 px (docs/enemies-540-plan.md): the red silk lanterns of the Lantern Festival with
// their gold caps and tassels; the poppen, the glass toy that pops when you blow it, a bubble of teal glass on a
// long neck; the hata, Nagasaki's fighting kites in their signal-flag colours; castella in its paper, crust and
// sponge and the sugar crystals under it, tied with a ribbon; the harbour's cantilever cranes; the Oranda-bune,
// the Dutch-ship float of the Kunchi festival, with its gun batteries; and the Ja-odori dragon of Kunchi, the
// green-and-gold head and its body on poles, chasing the golden pearl.
// Every frame is three times the old one's size (the old frames had no outline, so m -> fine m * 3).
import { HiSprite, tones, fur, speckle, crackle, mottle, mix2 } from '../../lib/hisprite.mjs';

const INK = 0x14101c;
const TAU = Math.PI * 2;
const RAMPS = {
  l: tones([0x7a0e14, 0xd02a30, 0xff7a6a]), // lantern silk red
  y: tones([0x8a5a10, 0xe2aa32, 0xfff0a0]), // gold
  q: [0x1a5a6a, 0x3a9aae, 0x8ad8dc, 0xd0f4f0, 0xffffff], // poppen glass
  p: tones([0xa8a090, 0xeae4d6, 0xffffff]), // kite paper
  c: tones([0x5a2a10, 0x8a4a1e, 0xc0763a]), // castella crust
  s: tones([0xb08a2a, 0xecc860, 0xfff0b0]), // its sponge
  w: tones([0x6a4a2a, 0xa07a4a, 0xd8b480]), // wood
  h: tones([0x6a3a20, 0x9a5a32, 0xd08a50]), // the float's lacquered hull
  v: tones([0xa8a088, 0xece2c8, 0xfffaf0]), // sails
  d: tones([0x10382a, 0x28704e, 0x5ab07a]), // dragon green
  m: tones([0x2a3a4a, 0x4a6478, 0x8aa0b4]), // crane steel
  r: tones([0x7a1410, 0xc8302a, 0xff7a60]), // vermilion
};
const silk = (seed) => ({ pat: mix2(fur(Math.PI / 2, { amt: 0.12, len: 12, w: 2, gap: 0.02, seed }), mottle({ amt: 0.1, scale: 5, seed })) });

// ---------------------------------------------------------------- popcorn: a festival lantern (17 x 23 -> 51 x 69), swaying
export function lantern(f) {
  const s = new HiSprite(51, 69, RAMPS);
  const cx = 25.5;
  const sway = [0, 1.4, 0, -1.4][f];
  // the gold cap and its hook
  s.tube(cx, 2, cx, 8, 1.6, 'y');
  s.poly([[cx - 8, 8], [cx + 8, 8], [cx + 10, 14], [cx - 10, 14]], 'y', { flat: 0.6, pat: speckle({ amt: 0.12 }) });
  // the round silk body on its ribs, glowing from the candle inside
  s.ellipse(cx, 31, 19.5, 18, 'l', { ...silk(3), bias: 0.06 });
  s.ellipse(cx - 2, 28, 10, 10, 'l', { flat: 0.92, glow: true, pat: mottle({ amt: 0.15, scale: 4 }) });
  for (let k = -3; k <= 3; k++) for (let y = 14; y < 48; y += 0.5) {
    const t = (y - 31) / 18;
    if (Math.abs(t) < 1) s.px(cx + k * 6 * Math.sqrt(1 - t * t) * 0.95, y, 0x8a1a1a, 0.55);
  }
  // a gold character painted on it
  s.line(cx - 4, 27, cx + 4, 27, 0xffd060, 1);
  s.line(cx, 23, cx, 36, 0xffd060, 1);
  s.line(cx - 3, 32, cx + 3, 34, 0xffd060, 1);
  // the gold base, the tassel swinging
  s.poly([[cx - 9, 48], [cx + 9, 48], [cx + 8, 53], [cx - 8, 53]], 'y', { flat: 0.55 });
  s.tube(cx, 53, cx + sway, 57, 1.2, 'y');
  s.poly([[cx - 3 + sway, 57], [cx + 3 + sway, 57], [cx + 4 + sway * 1.8, 67], [cx - 4 + sway * 1.8, 67]], 'r', { flat: 0.6, pat: fur(Math.PI / 2, { amt: 0.3, len: 8, w: 1 }) });
  return s.render();
}

// ---------------------------------------------------------------- shooter: a poppen, the glass toy (23 -> 69)
export function biidoro(f) {
  const s = new HiSprite(69, 69, RAMPS);
  const cx = 34.5;
  // the long thin neck up to the mouthpiece
  s.tube(cx + 2, 4, cx, 22, 3.2, 'q', { rb: 4, glow: true });
  s.ellipse(cx + 2, 4, 3.6, 2.4, 'y', { flat: 0.6 });
  // the bubble: thin teal glass, the far side seen through it, its thin flexing bottom
  s.ellipse(cx, 40, 26, 25, 'q', { glow: true, flat: 0.48, pat: mottle({ amt: 0.12, scale: 7 }) });
  s.shade([cx - 27, 14, cx + 27, 66], (x, y) => Math.hypot(x - cx, y - 40) > 22, 0.22);
  s.shade([cx - 27, 14, cx + 27, 66], (x, y) => Math.hypot(x - cx - 6, y - 48) < 11, -0.12);
  // the bottom flexing in and out (the pop)
  const b = f % 2 ? 5 : 2;
  s.ellipse(cx, 59 - b, 10, 3 + b * 0.4, 'q', { glow: true, flat: 0.75 });
  // a painted spray of flowers on it, the highlights
  for (const [x, y] of [[-12, 34], [-8, 42], [-14, 46]]) {
    for (let k = 0; k < 5; k++) s.dot(cx + x + Math.cos((k / 5) * TAU) * 2.2, y + Math.sin((k / 5) * TAU) * 2.2, 1.1, 0xf08bb0);
    s.dot(cx + x, y, 0.9, 0xfff0a0);
  }
  s.line(cx - 10, 38, cx - 4, 50, 0x37b35a, 1);
  s.ellipse(cx - 11, 26, 4, 6, 'q', { glow: true, flat: 0.98 });
  s.line(cx + 16, 32, cx + 18, 44, 0xffffff, 1, 0.7);
  return s.render();
}

// ---------------------------------------------------------------- diver: a hata, the fighting kite (23 x 28 -> 69 x 84)
export function hata(f) {
  const s = new HiSprite(69, 84, RAMPS);
  const cx = 34.5;
  const flex = [0, 1.5, 0, -1.5][f];
  // the diamond of paper on its bamboo cross, in the colours of a signal flag: red and white halves, a blue band
  const kite = [[cx, 3], [cx + 31 + flex, 30], [cx, 57], [cx - 31 - flex, 30]];
  s.poly(kite, 'p', { flat: 0.68, pat: mix2(fur(0.4, { amt: 0.06, len: 20, w: 3 }), speckle({ amt: 0.05 })) });
  s.paint([0, 0, 69, 60], (x, y) => x < cx && Math.abs(x - cx) / (31 + flex) + Math.abs(y - 30) / 27 < 1, 'l', () => 0.58, silk(5));
  s.paint([0, 0, 69, 60], (x, y) => Math.abs(y - 30) < 3.5 && Math.abs(x - cx) / (31 + flex) + Math.abs(y - 30) / 27 < 1, 'B', () => 0.5);
  s.line(cx, 4, cx, 56, 0x8a6a3a, 2);
  s.line(cx - 30 - flex, 30, cx + 30 + flex, 30, 0x8a6a3a, 1);
  // the bow line, the bridle, the tail of glass-coated line (biidoro yori) streaming
  for (const [x, y] of kite) s.dot(x, y, 1.2, 0x5a3a20);
  s.line(cx, 57, cx - 5 + f * 2, 66, 0xd8d0c0, 1);
  for (let y = 66; y < 83; y += 0.5) s.px(cx - 5 + f * 2 + Math.sin(y * 0.4 + f) * 3, y, (Math.floor(y) % 4) ? 0xd8d0c0 : 0xffffff);
  return s.render();
}

// ---------------------------------------------------------------- carrier: castella in its paper (23 x 17 -> 69 x 51)
const RIBBON = { red: 0xc8302a, blue: 0x3a72f0, green: 0x37b35a };
export function castella(color, f) {
  const s = new HiSprite(69, 51, RAMPS);
  // the block seen from above, cut to show its side: the dark crust on top, the golden sponge, the brown
  // paper under it, the coarse zarame sugar crystals at the bottom
  s.poly([[4, 8], [65, 8], [65, 30], [4, 30]], 'c', { flat: 0.5, pat: mix2(speckle({ amt: 0.18, dark: 0.08 }), mottle({ amt: 0.12, scale: 5 })) });
  s.poly([[4, 30], [65, 30], [65, 44], [4, 44]], 's', { flat: 0.7, pat: mix2(speckle({ amt: 0.25, dark: 0.12, light: 0.08 }), mottle({ amt: 0.1, scale: 3 })) });
  s.line(4, 30, 65, 30, 0x5a2a10, 1);
  for (let x = 6; x < 64; x += 2.6) s.dot(x, 42.5, 0.9, 0xfff8e0);
  s.poly([[3, 44], [66, 44], [66, 48], [3, 48]], 'w', { flat: 0.55 });
  // the paper band round it with the shop's red stamp, the ribbon (the colour of its weapon)
  s.poly([[24, 6], [45, 6], [45, 46], [24, 46]], 'p', { flat: 0.78 });
  s.poly([[32, 12], [37, 12], [37, 24], [32, 24]], 'r', { flat: 0.5 });
  for (const y of [15, 19]) s.line(33, y, 36, y, 0xffffff, 1);
  s.poly([[27, 2], [42, 2], [42, 49], [27, 49]], 'W', { flat: 0.4 });
  s.paint([26, 1, 43, 50], (x, y) => Math.abs(x - 34.5) < 3.4, 'W', () => 0.4);
  for (let y = 1; y < 50; y++) for (let x = 31; x < 38; x++) s.px(x, y, RIBBON[color], 0.92);
  const bow = f % 2 ? 6 : 5;
  for (const sx of [-1, 1]) s.poly([[34.5, 4], [34.5 + sx * 11, 4 - bow], [34.5 + sx * 11, 4 + bow]], 'W', { flat: 0.6 });
  for (const sx of [-1, 1]) for (let k = 0; k < 9; k++) s.line(34.5, 4, 34.5 + sx * 10, 4 - bow + k * (bow * 2 / 8), RIBBON[color], 1, 0.9);
  s.dot(34.5, 4, 2.4, 0xffffff, 0.5);
  return s.render();
}

// ---------------------------------------------------------------- turret: a harbour cantilever crane (base and heads 19 -> 57)
export function winchBase(wreck) {
  const s = new HiSprite(57, 57, RAMPS);
  if (wreck) {
    s.poly([[9, 15], [48, 15], [48, 45], [9, 45]], 'm', { flat: 0.28, pat: speckle({ amt: 0.3, dark: 0.15 }) });
    for (const [x0, y0, x1, y1] of [[12, 18, 44, 42], [44, 18, 14, 40]]) s.line(x0, y0, x1, y1, INK, 2);
    s.dot(30, 30, 2, 0xff7a20);
    return s.render();
  }
  // a square steel tower seen from above: the lattice of its girders, rivets, the slewing ring
  s.poly([[4, 4], [53, 4], [53, 53], [4, 53]], 'm', { flat: 0.55, pat: speckle({ amt: 0.12 }) });
  for (let k = 0; k <= 4; k++) {
    s.line(4 + k * 12.25, 4, 4 + k * 12.25, 53, 0x2a3a4a, 1);
    s.line(4, 4 + k * 12.25, 53, 4 + k * 12.25, 0x2a3a4a, 1);
  }
  for (let k = 0; k < 4; k++) {
    s.line(4 + k * 12.25, 4, 16.25 + k * 12.25, 16.25, 0x3a4c5e, 1);
    s.line(16.25 + k * 12.25, 40.75, 4 + k * 12.25, 53, 0x3a4c5e, 1);
  }
  s.ellipse(28.5, 28.5, 15, 15, 'm', { bias: 0.08 });
  s.ellipse(28.5, 28.5, 12, 12, 'y', { flat: 0.6 });
  s.ellipse(28.5, 28.5, 9, 9, 'm', { flat: 0.4 });
  for (let k = 0; k < 12; k++) s.dot(28.5 + Math.cos((k / 12) * TAU) * 13.5, 28.5 + Math.sin((k / 12) * TAU) * 13.5, 0.8, 0x9ea6d0);
  return s.render();
}

export function winchHead(i) {
  const s = new HiSprite(57, 57, RAMPS);
  const c = 28.5;
  const a = (i / 16) * TAU;
  const dx = -Math.sin(a);
  const dy = Math.cos(a);
  const px = Math.cos(a);
  const py = Math.sin(a);
  // the jib: a lattice girder run out towards the target, the counterweight behind, the hook's cable
  for (const sd of [-1, 1]) s.line(c + px * sd * 3.5, c + py * sd * 3.5, c + dx * 25 + px * sd * 2, c + dy * 25 + py * sd * 2, 0xd8a030, 2);
  for (let k = 0; k < 6; k++) {
    const t0 = 4 + k * 3.6;
    s.line(c + dx * t0 + px * 3, c + dy * t0 + py * 3, c + dx * (t0 + 3.6) - px * 3, c + dy * (t0 + 3.6) - py * 3, 0xa87a20, 1);
  }
  s.ellipse(c + dx * 25.5, c + dy * 25.5, 2.4, 2.4, 'K', { flat: 0.2 });
  s.poly([[c - dx * 6 + px * 7, c - dy * 6 + py * 7], [c - dx * 6 - px * 7, c - dy * 6 - py * 7], [c - dx * 16 - px * 6, c - dy * 16 - py * 6], [c - dx * 16 + px * 6, c - dy * 16 + py * 6]], 'm', { flat: 0.4, pat: speckle({ amt: 0.15 }) });
  // the operator's cab at the pivot
  s.ellipse(c, c, 7, 7, 'y', { bias: 0.06 });
  s.dot(c + dx * 2 - 1, c + dy * 2 - 1, 2, 0x8ad0ff);
  return s.render();
}

// ---------------------------------------------------------------- heavy: the Oranda-bune float (62 x 106 -> 186 x 318), bow down
export function oranda(f) {
  const s = new HiSprite(186, 318, RAMPS);
  const cx = 93;
  const half = (y) => {
    const u = y / 3;
    if (u < 10) return (15 + u * 0.4) * 3;
    if (u < 46) return (19 + Math.sin(((u - 10) / 36) * Math.PI * 0.5) * 3.5) * 3;
    return Math.max(0, 22.5 * Math.cos(((u - 46) / 46) * Math.PI * 0.5)) * 3;
  };
  // the hull: lacquered planking, the gilt wale, the vermilion band, then the deck of long planks
  s.paint([0, 12, 186, 276], (x, y) => Math.abs(x - cx) < half(y) - 1, 'h', (x) => 0.62 - (x - cx) / 160, { pat: fur(Math.PI / 2, { amt: 0.16, len: 30, w: 3, gap: 0.03 }) });
  s.paint([0, 12, 186, 276], (x, y) => Math.abs(x - cx) < half(y) - 13, 'w', (x, y) => 0.6 - (x - cx) / 180 + (Math.floor((x - cx + 120) / 9) % 2 ? 0.04 : -0.03), { pat: mix2(fur(Math.PI / 2, { amt: 0.14, len: 40, w: 9, gap: 0.04 }), speckle({ amt: 0.06 })) });
  for (let y = 14; y < 274; y++) for (const sd of [-1, 1]) {
    const h = half(y);
    if (h < 14) continue;
    s.px(cx + sd * (h - 6.5), y, 0xe8b830);
    s.px(cx + sd * (h - 7.5), y, 0xffe080, 0.6);
    for (let k = 9; k < 12.5; k++) s.px(cx + sd * (h - k), y, sd < 0 ? 0xd8402e : 0xa82c22);
  }
  for (let x = -60; x <= 60; x += 9) for (let y = 40; y < 250; y++) if (s.mat[y * 186 + cx + x] === 'w') s.px(cx + x, y, 0x7a5a36, 0.4); // the deck's seams
  // gun ports along both sides, brass muzzles run out
  for (const gy of [30, 40, 50, 60, 70]) for (const sd of [-1, 1]) {
    const y = gy * 3;
    const h = half(y);
    s.poly([[cx + sd * (h - 12), y], [cx + sd * (h - 4), y], [cx + sd * (h - 4), y + 6], [cx + sd * (h - 12), y + 6]], 'K', { flat: 0.1 });
    s.tube(cx + sd * (h - 2), y + 3, cx + sd * (h + 5), y + 3, 2.2, 'y', { rb: 2.6 });
  }
  // hatches with their gratings, the capstan
  for (const [y, h] of [[132, 15], [168, 12]]) {
    s.poly([[cx - 12, y], [cx + 12, y], [cx + 12, y + h], [cx - 12, y + h]], 'w', { flat: 0.35 });
    for (let x = cx - 10; x < cx + 11; x += 4) for (let yy = y + 2; yy < y + h - 1; yy += 4) s.dot(x, yy, 1, 0x2a1a10);
  }
  s.ellipse(cx, 193, 6, 6, 'w', { bias: 0.1 });
  for (let k = 0; k < 6; k++) s.line(cx, 193, cx + Math.cos((k / 6) * TAU) * 9, 193 + Math.sin((k / 6) * TAU) * 9, 0x5a3a20, 2);
  // the stern castle: a raised deck, a gilt rail, the cabin roofed in red tiles, lit windows, corner lanterns
  s.poly([[cx - 45, 18], [cx + 45, 18], [cx + 51, 66], [cx - 51, 66]], 'h', { flat: 0.55 });
  s.poly([[cx - 39, 24], [cx + 39, 24], [cx + 45, 60], [cx - 45, 60]], 'w', { flat: 0.62, pat: fur(0, { amt: 0.12, len: 30, w: 6 }) });
  for (let x = cx - 45; x <= cx + 45; x += 3) s.px(x, 66, 0xe8b830);
  s.poly([[cx - 48, 69], [cx + 48, 69], [cx + 48, 75], [cx - 48, 75]], 'h', { flat: 0.35 });
  for (let x = cx - 42; x <= cx + 40; x += 9) s.poly([[x, 70], [x + 6, 70], [x + 6, 74], [x, 74]], 'y', { glow: true, flat: f ? 0.8 : 0.95 });
  for (const [x, y] of [[-45, 21], [45, 21], [-51, 63], [51, 63]]) {
    s.ellipse(cx + x, y, 4.8, 4.8, 'l', { glow: true, flat: 0.7 });
    s.px(cx + x - 1, y - 2, 0xffb070);
  }
  s.poly([[cx - 27, 27], [cx + 27, 27], [cx + 27, 53], [cx - 27, 53]], 'r', { flat: 0.55 });
  for (let y = 30; y < 53; y += 4) s.line(cx - 27, y, cx + 27, y, 0x7a1410, 1);
  for (let x = cx - 24; x < cx + 26; x += 4) s.line(x, 27, x, 53, 0xd8402e, 1, 0.5);
  s.line(cx - 27, 27, cx + 27, 27, 0xe8b830, 2);
  s.poly([[cx - 6, 33], [cx + 9, 33], [cx + 9, 42], [cx - 6, 42]], 'B', { flat: 0.3 });
  s.dot(cx, 37, 2, f ? 0xffe0a0 : 0xffd080);
  // the Dutch flag over the stern, streaming
  s.tube(cx, 0, cx, 24, 1.2, 'v');
  for (let x = 2; x < 38; x++) {
    const dy = Math.sin(x * 0.24 + f * 2.2) * (x / 36) * 4.5;
    for (const [y0, col] of [[0, 0xc8302a], [5, 0xf4f0e8], [10, 0x2a4a9a]]) for (let j = 0; j < 5; j++) s.px(cx + x, 1 + y0 + j + dy, col);
  }
  // shrouds from the masts to the rails
  for (const my of [84, 144, 210]) {
    const h = half(my + 12);
    for (const sd of [-1, 1]) for (const d of [-9, 3, 15]) s.line(cx, my, cx + sd * (h - 6), my + d, 0x3a2418, 1, 0.7);
  }
  // the masts, yards and sails bellying towards the bow, each throwing its shadow on the deck
  const sail = (my, w, h, ph) => {
    const yard = my - 9;
    s.shade([cx - w * 3 + 9, my + h * 3 - 3, cx + w * 3 + 12, my + h * 3 + 12], () => true, -0.18);
    s.tube(cx - w * 3 - 6, yard, cx + w * 3 + 6, yard, 2, 'w');
    for (let x = -w * 3; x <= w * 3; x++) {
      const t = x / (w * 3);
      const belly = (1 - t * t) * (6 + ((f + ph) % 2) * 3);
      s.paint([cx + x, yard + 2, cx + x + 1, yard + 2 + h * 3 + belly], () => true, 'v', (px, py) => 0.62 - t * 0.3 - ((py - yard) / (h * 3 + belly)) * 0.32, { pat: speckle({ amt: 0.05 }) });
      if (Math.abs(x) % 18 === 9) s.line(cx + x, yard + 3, cx + x, yard + h * 3, 0xc8bca0, 1, 0.6);
    }
    s.ellipse(cx, my, 6, 6, 'K', { flat: 0.2 });
    s.ellipse(cx, my, 4, 4, 'w', { flat: 0.5 });
  };
  sail(96, 17, 7, 1);
  sail(156, 21, 9, 0);
  sail(219, 16, 7, 2);
  s.ellipse(cx, 171, 9, 9, 'y', { flat: 0.7 });
  s.ellipse(cx, 171, 6, 6, 'r', { flat: 0.55 });
  for (let x = 2; x < 46; x++) s.px(cx - x, 144 + Math.sin(x * 0.2 + f * 2) * 3, x % 18 < 6 ? 0xc8302a : x % 18 < 12 ? 0xf4f0e8 : 0x2a4a9a);
  // the forecastle, the bowsprit with its spritsail, the red lion figurehead with a gilded mane
  s.poly([[cx - 27, 252], [cx + 27, 252], [cx + 12, 276], [cx - 12, 276]], 'h', { flat: 0.6 });
  s.line(cx - 24, 252, cx + 24, 252, 0xe8b830, 2);
  s.tube(cx, 276, cx, 312, 2, 'w');
  s.tube(cx - 21, 292, cx + 21, 292, 1.4, 'w');
  s.paint([cx - 19, 294, cx + 19, 306], (x, y) => y < 304 + (1 - ((x - cx) / 19) ** 2) * 3, 'v', (x) => 0.65 - (x - cx) / 80);
  for (let a = 0; a < TAU; a += 0.4) s.ellipse(cx + Math.cos(a) * 7, 276 + Math.sin(a) * 7, 2.6, 2.6, 'y', { bias: 0.1 });
  s.ellipse(cx, 278, 5.5, 5.5, 'r', { bias: 0.1 });
  for (const sx of [-1, 1]) s.dot(cx + sx * 2.2, 277, 1, 0xffd070);
  // the children on board, drummers and flute players in festival colours
  for (const [x, y, col] of [[-24, 114, 0xe85a8a], [21, 120, 0x3a8ae8], [-18, 186, 0xf0c040], [24, 192, 0xe85a8a], [-9, 42, 0x3ae890], [12, 45, 0xf0c040]]) {
    s.ellipse(cx + x, y + 3, 4.6, 4, 'W', { flat: 0.4 });
    s.dot(cx + x, y + 3, 3.2, col);
    s.dot(cx + x, y - 2, 2.8, 0x2a1a14);
    s.dot(cx + x + (f ? 4 : -4), y + 2, 1.6, 0xf0e0c0);
  }
  return s.render();
}

/** One of the float's broadside batteries (9 x 26 -> 27 x 78), firing (1); and burnt out. */
export function orandaGun(f, burnt) {
  const s = new HiSprite(27, 78, RAMPS);
  if (burnt) {
    s.poly([[4, 2], [23, 2], [23, 76], [4, 76]], 'K', { flat: 0.3, pat: mix2(speckle({ amt: 0.35, dark: 0.2 }), crackle({ amt: 0.2, scale: 4 })) });
    for (const [x, y] of [[9, 12], [15, 33], [7, 51], [18, 63]]) {
      s.dot(x, y, 1.6, 0xe86a2a);
      s.dot(x, y - 2, 1, 0xffb050);
    }
    return s.render();
  }
  s.poly([[4, 2], [23, 2], [23, 76], [4, 76]], 'h', { flat: 0.55, pat: fur(Math.PI / 2, { amt: 0.15, len: 20, w: 3 }) });
  s.line(21, 2, 21, 76, 0xe8b830, 2);
  for (let y = 6; y < 72; y += 15) {
    s.poly([[6, y], [18, y], [18, y + 9], [6, y + 9]], 'K', { flat: 0.1 });
    s.tube(1, y + 4.5, 12, y + 4.5, 2.6, 'y', { rb: 2.2 });
    s.dot(2, y + 4.5, 1.6, f ? 0xfff0c0 : 0x2a1a10);
    if (f) s.dot(1, y + 4.5, 2.4, 0xffe090, 0.8);
  }
  return s.render();
}

// ---------------------------------------------------------------- boss: the Ja-odori dragon (head 39 -> 117, segment 19 -> 57, pearl 11 -> 33)
export function jaHead(f) {
  const s = new HiSprite(117, 117, RAMPS);
  const cx = 58.5;
  const scale = { pat: mix2(crackle({ amt: 0.2, scale: 4, width: 0.06 }), speckle({ amt: 0.1 })) };
  const jaw = f % 2;
  // the horns, branching like antlers, gilt
  for (const sx of [-1, 1]) {
    s.tube(cx + sx * 18, 34, cx + sx * 34, 4, 3.4, 'y', { rb: 1.6 });
    s.tube(cx + sx * 27, 18, cx + sx * 40, 14, 2, 'y', { rb: 1 });
  }
  // the mane: flames of red and gold round the head
  for (let k = 0; k < 14; k++) {
    const a = Math.PI * 0.85 + (k / 13) * Math.PI * 1.3;
    s.tube(cx + Math.cos(a) * 30, 57 + Math.sin(a) * 30, cx + Math.cos(a) * 52, 57 + Math.sin(a) * 50, 5, k % 2 ? 'r' : 'y', { rb: 1, pat: fur(a, { amt: 0.2, len: 5, w: 1 }) });
  }
  // the head: green, scaled, the gold brow ridges over glaring eyes, the long snout
  s.ellipse(cx, 52, 40, 38, 'd', { bias: 0.03, ...scale });
  for (const sx of [-1, 1]) {
    s.tube(cx + sx * 6, 34, cx + sx * 34, 30, 5, 'y', { rb: 3, bias: 0.05 });
    s.ellipse(cx + sx * 20, 42, 9.5, 8, 'W', { flat: 0.85 });
    s.dot(cx + sx * 20, 43, 4.4, 0xd8a020);
    s.dot(cx + sx * 20, 43, 2.4, INK);
    s.dot(cx + sx * 18, 40.5, 1.2, 0xffffff);
    // the whiskers streaming out
    for (let k = 0; k < 2; k++) for (let t = 0; t < 1; t += 0.02) s.px(cx + sx * (16 + t * 40), 70 + k * 4 + Math.sin(t * 6 + f + k) * 5 + t * 18, 0xe8c060, 0.9);
  }
  // the snout, its nostrils; the jaws with fangs, the red mouth, the tongue curling
  s.ellipse(cx, 66, 24, 15, 'd', { bias: 0.1, ...scale });
  for (const sx of [-1, 1]) {
    s.ellipse(cx + sx * 8, 62, 4, 3, 'y', { bias: 0.05 });
    s.ellipse(cx + sx * 8, 63, 2, 1.4, 'K', { flat: 0.1 });
  }
  s.poly([[cx - 24, 75], [cx + 24, 75], [cx + 18, 90 + jaw * 4], [cx - 18, 90 + jaw * 4]], 'r', { flat: 0.35 });
  s.poly([[cx - 8, 82], [cx + 8, 82], [cx + 4, 98 + jaw * 4], [cx - 4, 96 + jaw * 4]], 'P', { flat: 0.55 });
  for (let x = cx - 20; x < cx + 20; x += 5) s.poly([[x, 75], [x + 4, 75], [x + 2, 79]], 'W', { flat: 0.8 });
  for (const sx of [-1, 1]) {
    s.poly([[cx + sx * 21, 75], [cx + sx * 16, 75], [cx + sx * 19, 86]], 'W', { flat: 0.9 });
    s.poly([[cx + sx * 17, 90 + jaw * 4], [cx + sx * 12, 90 + jaw * 4], [cx + sx * 14.5, 81]], 'W', { flat: 0.75 });
  }
  s.ellipse(cx, 92 + jaw * 4, 20, 5, 'd', { flat: 0.45, ...scale }); // the lower jaw's edge
  // the beard under it
  for (let k = 0; k < 7; k++) s.tube(cx - 12 + k * 4, 96 + jaw * 4, cx - 14 + k * 4.6, 112, 2.4, 'y', { rb: 0.8, pat: fur(Math.PI / 2, { amt: 0.2, len: 3, w: 1 }) });
  return s.render();
}

export function jaSegment() {
  const s = new HiSprite(57, 57, RAMPS);
  const c = 28.5;
  // a length of the dragon's body: a hoop of green cloth scaled in gold, the gold ridge of its spine, the pole
  s.ellipse(c, c, 26, 26, 'd', { bias: 0.04, pat: speckle({ amt: 0.08 }) });
  for (let row = -3; row <= 3; row++) for (let k = -3; k <= 3; k++) {
    const x = c + k * 7 + (row % 2) * 3.5;
    const y = c + row * 6.5;
    if (Math.hypot(x - c, y - c) > 21) continue;
    for (let a = 0.2; a < Math.PI - 0.2; a += 0.15) s.px(x + Math.cos(a) * 3.4, y + Math.sin(a) * 3.4, 0xe2aa32, 0.85);
  }
  for (let a = 0; a < TAU; a += 0.02) s.px(c + Math.cos(a) * 24.5, c + Math.sin(a) * 24.5, 0xe2aa32);
  for (let k = -2; k <= 2; k++) s.poly([[c + k * 8 - 3, 5], [c + k * 8 + 3, 5], [c + k * 8, -1 + Math.abs(k)]], 'y', { flat: 0.7 });
  s.dot(c - 9, c - 10, 2.6, 0x9ae0a0, 0.6);
  s.tube(c, c + 10, c, 56, 1.8, 'w');
  return s.render();
}

export function jaPearl() {
  const s = new HiSprite(33, 33, RAMPS);
  // the gyoku, the golden pearl the dragon chases, on its pole, flames licking round it
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU;
    s.poly([[16.5 + Math.cos(a) * 9, 16.5 + Math.sin(a) * 9], [16.5 + Math.cos(a + 0.3) * 15, 16.5 + Math.sin(a + 0.3) * 15], [16.5 + Math.cos(a + 0.55) * 9, 16.5 + Math.sin(a + 0.55) * 9]], 'r', { glow: true, flat: 0.75 });
  }
  s.ellipse(16.5, 16.5, 10, 10, 'y', { bias: 0.08, glow: true });
  s.dot(13, 13, 3, 0xfff8e0);
  return s.render();
}

export function nagasakiEnemies(add) {
  for (let f = 0; f < 4; f++) {
    add(`n_lantern_${f}`, lantern(f));
    add(`n_biidoro_${f}`, biidoro(f));
    add(`n_hata_${f}`, hata(f));
    for (const c of ['red', 'blue', 'green']) add(`n_castella_${c}_${f}`, castella(c, f));
    add(`n_ja_${f}`, jaHead(f));
  }
  for (let f = 0; f < 2; f++) {
    add(`n_oranda_${f}`, oranda(f));
    add(`n_oranda_gun_${f}`, orandaGun(f, false));
  }
  add('n_oranda_burnt', orandaGun(0, true));
  add('n_segment', jaSegment());
  add('n_pearl', jaPearl());
  add('n_winch_base', winchBase(false));
  add('n_winch_wreck', winchBase(true));
  for (let i = 0; i < 16; i++) add(`n_winch_${i}`, winchHead(i));
}
export const NAGASAKI_PORTRAITS = ['n_oranda_0', 'n_ja_0', 'n_segment'];
