// FUNA-YUREI, Onomichi's boss (docs/plan-onomichi.md, 6.2): a ghost ship of the old sea lords of the Inland Sea come
// up out of the strait on the night of the fireworks. Our own design: a sekibune (a fighting ship of the strait) seen
// from above, its bow to the bottom of the screen: a long box of a hull blackened and hung with weed, its sides walled
// with planking pierced for arrows, oars out through its ports; the house on its deck (yagura) under a hipped roof; a
// mast with a sail of woven mats; torn banners on poles at its stern with a sign of our own (three waves in a ring, no
// family's crest); a great lantern on a post at its bow where a wisp burns (the weak point); and round it, risen out
// of the water, the pale arms of the drowned, each holding a wooden ladle. It glows a cold sea-green along its seams.
//
// Phase 11 of the plan: the design in its three forms for the author (preview: node tools/art/onomichi/funayurei.mjs
// -> tools/preview/stage11_funayurei.png); its parts for the fight come once it is approved.
import { HiSprite, tones, fur, speckle, mottle, mix2 } from '../../lib/hisprite.mjs';

const RAMPS = {
  h: tones([0x161c1e, 0x34403e, 0x5e6e66]), // the hull's wood, sea-grey and green with age
  d: tones([0x24221e, 0x46423a, 0x746c5c]), // the deck's planks, weathered
  o: [0x0a3a3a, 0x168a86, 0x5ae6d4, 0xc0fff0, 0xf0fffa], // the cold sea-green light
  r: tones([0x12161c, 0x2a3038, 0x4e5a66]), // the house's roof
  m: tones([0x26241c, 0x4a4636, 0x787054]), // the sail's woven mats
  c: tones([0x5a6a6a, 0xa8bab6, 0xe4f0ec]), // the banners' cloth, bleached
  s: tones([0x0c2418, 0x1c4428, 0x3a7a3a]), // weed
  g: tones([0x4a7a8a, 0xa8d8e0, 0xeaffff]), // the pale arms of the drowned
  l: tones([0x3a2a1a, 0x6a5034, 0x9a7a52]), // the ladles' wood
  p: tones([0x24160e, 0x50341e, 0x86583a]), // the clay fire pots
  q: tones([0x8a6a5a, 0xe8c8b0, 0xfff4ea]), // the conch shell
};
const GLOW = [0x0a3a3a, 0x168a86, 0x5ae6d4, 0xc0fff0, 0xf0fffa]; // the cold sea-green light along its seams, its wisp
const FIRE = [0x6a1a06, 0xd8501a, 0xffa040, 0xffe08a, 0xfff8e0];
const INK = 0x080a0e;
export const FW = 330; // (fine px: the ship with the arms round it)
export const FH = 500;
const CX = FW / 2;
// the hull: from the square stern at the top to the bow's point at the bottom
const STERN = 34;
const BOW = 470;
const half = (y) => (y < STERN ? 0 : y < 340 ? 100 : 100 * Math.max(0, 1 - ((y - 340) / (BOW - 340)) ** 1.7));

function hull(s, state) {
  const wear = state === 'whirl' ? 2 : state === 'fire' ? 1 : 0;
  const grain = { pat: mix2(fur(Math.PI / 2, { amt: 0.16, len: 14, seed: 3 }), speckle({ amt: 0.1, seed: 4 })) };
  // the oars out through their ports, both sides (some broken off as it wears)
  for (let y = 110; y < 380; y += 22)
    for (const sx of [-1, 1]) {
      const broken = wear && (y * 7 + sx * 3) % (wear === 2 ? 3 : 5) === 0;
      const len = broken ? 14 : 44;
      const [x0, y0] = [CX + sx * (half(y) - 2), y];
      s.tube(x0, y0, x0 + sx * len, y0 + len * 0.35, 1.6, 'l', { rb: 1.2 });
      if (!broken) s.poly([[x0 + sx * (len - 2), y0 + len * 0.35 - 4], [x0 + sx * (len + 8), y0 + len * 0.35 - 2], [x0 + sx * (len + 8), y0 + len * 0.35 + 5], [x0 + sx * (len - 2), y0 + len * 0.35 + 3]], 'l', { flat: 0.45 });
    }
  // weed hanging off its sides, trailing in the water
  for (let y = 60; y < 420; y += 9)
    for (const sx of [-1, 1]) {
      if ((y * 13 + sx * 5) % 4) continue;
      const x0 = CX + sx * half(y);
      s.tube(x0, y, x0 + sx * (4 + (y % 7)), y + 10 + (y % 5), 1.3, 's', { rb: 0.8 });
    }
  // the hull itself: lit from the upper left, darker to the right
  s.paint([CX - 104, STERN, CX + 104, BOW], (x, y) => Math.abs(x - CX) < half(y), 'h', (x) => 0.3 + 0.35 * (1 - (x - CX + 100) / 200), grain);
  // the walls of planking along its sides, pierced for arrows; the deck between them
  s.paint([CX - 100, STERN, CX + 100, BOW], (x, y) => Math.abs(x - CX) < half(y) - 13 && y > STERN + 12, 'd', () => 0.45, { pat: fur(Math.PI / 2, { amt: 0.14, len: 20, seed: 5 }) });
  for (let x = CX - 84; x <= CX + 84; x += 9) s.line(x, STERN + 14, x, 420 - Math.abs(x - CX) * 0.4, 0x15181c, 1, 0.7); // deck seams
  for (let y = STERN + 20; y < 420; y += 24)
    for (const sx of [-1, 1]) {
      const x = CX + sx * (half(y) - 6);
      s.px(x, y, INK);
      s.px(x, y + 1, INK);
      s.px(x, y + 2, INK); // an arrow slit
    }
  // the cold light along its seams and its walls' tops
  for (let y = STERN; y < BOW; y += 1)
    for (const sx of [-1, 1]) {
      if ((y * 11) % 17 < 9) s.px(CX + sx * (half(y) - 1), y, GLOW[2], 0.85);
      if ((y * 5) % 23 < 5) s.px(CX + sx * (half(y) - 12), y, GLOW[1], 0.7);
    }
  for (let x = CX - 98; x <= CX + 98; x++) if ((x * 7) % 13 < 7) s.px(x, STERN + 1, GLOW[2], 0.8);
  // the top rail of its walls, worn pale; a ghostly light all round its outline
  s.paint([CX - 104, STERN, CX + 104, BOW], (x, y) => {
    const e = half(y) - Math.abs(x - CX);
    return y > STERN + 2 && e > 10 && e < 13.5;
  }, 'l', () => 0.75);
  s.paint([CX - 108, STERN - 3, CX + 108, BOW + 3], (x, y) => {
    const e = half(y) - Math.abs(x - CX);
    return (e > -2.4 && e < 0.6 && y > STERN) || (y > STERN - 3 && y < STERN + 1 && Math.abs(x - CX) < 101);
  }, 'o', (x, y) => 0.55 + 0.35 * Math.sin(y * 0.3 + x * 0.1), { glow: true });
  // on the deck: coils of rope, casks, a rack of spears, puddles of the sea it came up out of, wisps drifting
  for (const [x, y] of [[CX - 60, 300], [CX + 58, 320], [CX - 50, 360]]) {
    for (let r = 7; r > 2; r -= 2) for (let a = 0; a < 6.3; a += 0.2) s.px(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.8, r % 4 === 3 ? 0x9a8a62 : 0x6a5a3e);
  }
  for (const [x, y] of [[CX + 40, 210], [CX + 56, 214], [CX + 48, 226], [CX - 70, 260]]) {
    s.ellipse(x, y, 6, 6, 'l', { bias: 0.06 });
    s.line(x - 6, y, x + 6, y, 0x2a2a2a, 1);
  }
  for (let k = 0; k < 6; k++) s.line(CX + 20 + k * 6, 360, CX + 26 + k * 6, 392, 0x8a7a5a, 1); // spears
  for (const [x, y, r] of [[CX - 20, 330, 10], [CX + 30, 380, 7], [CX - 40, 210, 6]]) s.ellipse(x, y, r, r * 0.6, 'o', { flat: 0.35, glow: true });
  for (const [x, y] of [[CX - 30, 280], [CX + 70, 360], [CX - 74, 120], [CX + 74, 150]]) {
    s.ellipse(x, y, 3, 3.6, 'o', { flat: 0.85, glow: true });
    s.dot(x, y, 1.2, 0xf0fffa);
  }
  // the wear: holes stove in its planking, water and light in them
  if (wear)
    for (const [x, y, r] of wear === 2 ? [[CX - 60, 150, 9], [CX + 50, 260, 12], [CX - 30, 330, 8], [CX + 70, 110, 7]] : [[CX + 56, 280, 7]]) {
      s.ellipse(x, y, r, r * 0.8, 'K', { flat: 0.2 });
      s.ellipse(x, y, r * 0.6, r * 0.45, 'C', { flat: 0.5, glow: true });
    }
}

function house(s, state) {
  // the yagura: a two-storeyed house on the deck towards the stern, its walls dark, its hipped roof; in the fire
  // phase its hatch thrown open and the fire inside, the fire pots stacked by it, the conch on its roof
  const [x0, x1, y0, y1] = [CX - 50, CX + 50, 62, 178];
  const roofQ = (ax0, ax1, ay0, ay1, c) => {
    const inset = Math.min(ax1 - ax0, ay1 - ay0) * 0.42;
    s.poly([[ax0, ay0], [ax1, ay0], [ax1 - inset, ay0 + inset], [ax0 + inset, ay0 + inset]], c, { flat: 0.62 });
    s.poly([[ax0, ay0], [ax0 + inset, ay0 + inset], [ax0 + inset, ay1 - inset], [ax0, ay1]], c, { flat: 0.74 });
    s.poly([[ax1, ay0], [ax1, ay1], [ax1 - inset, ay1 - inset], [ax1 - inset, ay0 + inset]], c, { flat: 0.3 });
    s.poly([[ax0, ay1], [ax0 + inset, ay1 - inset], [ax1 - inset, ay1 - inset], [ax1, ay1]], c, { flat: 0.44 });
    s.line(ax0 + inset, ay0 + inset, ax1 - inset, ay1 - inset, 0x6a7a82, 1, 0.0);
    s.poly([[ax0 + inset - 1, ay0 + inset - 1], [ax1 - inset + 1, ay0 + inset - 1], [ax1 - inset + 1, ay1 - inset + 1], [ax0 + inset - 1, ay1 - inset + 1]], c, { flat: 0.82 }); // the ridge
    // rows of tiles down each slope
    for (let k = 4; k < inset; k += 4) {
      s.line(ax0 + k, ay0 + k, ax1 - k, ay0 + k, 0x12161c, 1, 0.55);
      s.line(ax0 + k, ay1 - k, ax1 - k, ay1 - k, 0x12161c, 1, 0.55);
      s.line(ax0 + k, ay0 + k, ax0 + k, ay1 - k, 0x12161c, 1, 0.45);
      s.line(ax1 - k, ay0 + k, ax1 - k, ay1 - k, 0x12161c, 1, 0.45);
    }
  };
  // its front wall (towards the bow), the windows lit with the cold light
  s.poly([[x0 + 4, y1 - 4], [x1 - 4, y1 - 4], [x1 - 4, y1 + 16], [x0 + 4, y1 + 16]], 'h', { flat: 0.4 });
  for (let x = x0 + 10; x < x1 - 10; x += 14) s.paint([x, y1 + 2, x + 8, y1 + 12], (px, py) => px > x && px < x + 8 && py > y1 + 2 && py < y1 + 12, 'o', () => 0.6, { glow: true });
  for (let x = x0 + 4; x <= x1 - 4; x += 7) s.line(x, y1 - 4, x, y1 + 16, 0x161c1e, 1, 0.6);
  roofQ(x0 - 8, x1 + 8, y0 - 6, y1 + 2, 'r');
  roofQ(x0 + 18, x1 - 18, y0 + 14, y1 - 34, 'r'); // its upper storey
  for (const [ex, ey] of [[x0 - 8, y0 - 6], [x1 + 8, y0 - 6], [x0 - 8, y1 + 2], [x1 + 8, y1 + 2]]) s.ellipse(ex, ey, 2.4, 2.4, 'o', { flat: 0.8, glow: true }); // wisps hung at its eaves
  if (state === 'fire') {
    s.poly([[CX - 20, 120], [CX + 20, 120], [CX + 20, 150], [CX - 20, 150]], 'K', { flat: 0.2 });
    s.paint([CX - 18, 122, CX + 18, 148], (x, y) => Math.abs(x - CX) < 18 && y > 122 && y < 148, 'K', () => 0.5);
    for (let k = 0; k < 9; k++) s.ellipse(CX - 14 + (k % 5) * 7, 128 + Math.floor(k / 5) * 10 + (k % 2) * 2, 4, 5, 'K', { flat: 0.4 });
    s.paint([CX - 18, 122, CX + 18, 148], (x, y) => ((x - CX) / 18) ** 2 + ((y - 138) / 12) ** 2 < 1, 'Q', () => 0.85, { glow: true });
    s.ellipse(CX, 138, 8, 6, 'Y', { flat: 0.95, glow: true });
    // the fire pots stacked by the house, ready
    for (let k = 0; k < 6; k++) {
      const [x, y] = [CX - 80 + (k % 3) * 11, 210 + Math.floor(k / 3) * 11];
      s.ellipse(x, y, 5.6, 5.2, 'p', { bias: 0.06 });
      s.line(x, y - 5, x + 2, y - 9, 0xd8c8a0, 1);
    }
    // the conch on the roof's ridge, glowing at its mouth
    s.ellipse(CX + 30, 100, 10, 7, 'q', { bias: 0.05, pat: mottle({ amt: 0.2, scale: 3, seed: 8 }) });
    for (let k = 0; k < 4; k++) s.line(CX + 22 + k * 4, 96, CX + 24 + k * 4, 104, 0x8a6a5a, 1, 0.7);
    s.ellipse(CX + 40, 102, 3, 3, 'C', { flat: 0.9, glow: true });
  }
}

function rigging(s, state) {
  // the mast, the yard across, the sail of mats; broken and burning at the end
  const my = 248;
  if (state === 'whirl') {
    s.ellipse(CX, my, 9, 9, 'l', { bias: 0.05 });
    s.poly([[CX - 5, my - 4], [CX + 6, my - 2], [CX + 2, my + 6], [CX - 4, my + 3]], 'K', { flat: 0.2 }); // the stump, splintered
    // the sail fallen across the deck, burning
    s.poly([[CX - 90, my + 30], [CX + 40, my + 10], [CX + 70, my + 44], [CX - 70, my + 66]], 'm', { flat: 0.45 });
    for (let k = 0; k < 7; k++) s.line(CX - 84 + k * 20, my + 30 - k * 3, CX - 64 + k * 20, my + 64 - k * 3, 0x26241c, 1, 0.8);
    for (let k = 0; k < 10; k++) {
      const [x, y] = [CX - 70 + k * 13, my + 30 + Math.sin(k) * 12];
      s.paint([x - 8, y - 16, x + 8, y + 4], (px, py) => Math.abs(px - x) < 6 * Math.max(0, (py - (y - 14)) / 16) && py < y + 3, 'Q', (px, py) => 0.4 + 0.5 * (1 - (y - py) / 16), { glow: true });
    }
    return;
  }
  const torn = state === 'fire';
  s.paint([CX - 106, my - 12, CX + 106, my + 14], (x, y) => {
    if (Math.abs(x - CX) > 104 || Math.abs(y - my) > 11) return false;
    // holes torn in the mats, ragged at the edges
    const hole = Math.sin(x * 0.11 + 1) * Math.sin(y * 0.6) > (torn ? 0.55 : 0.82) && Math.abs(x - CX) > 20;
    return !hole;
  }, 'm', (x, y) => 0.4 + 0.25 * Math.sin(y * 1.2), { pat: mix2(mottle({ amt: 0.18, scale: 3, seed: 6 }), speckle({ amt: 0.12, seed: 7 })) });
  for (let x = CX - 100; x < CX + 104; x += 12) s.line(x, my - 11, x, my + 11, 0x26241c, 1, 0.8); // the mats' edges
  s.tube(CX - 110, my - 12, CX + 110, my - 12, 2, 'l', { rb: 1.6 }); // the yard
  s.ellipse(CX, my - 2, 8, 8, 'l', { bias: 0.08 }); // the mast's top
  s.dot(CX, my - 2, 3, 0x3a2a1a);
}

function banners(s, state) {
  // two poles at the stern's corners, the banners streaming up the screen (the ship's way), torn; our own sign on them
  for (const sx of [-1, 1]) {
    const [x, y] = [CX + sx * 88, STERN + 6];
    s.ellipse(x, y, 3, 3, 'l', { bias: 0.1 });
    const len = state === 'whirl' ? 36 : 58;
    const wave = (t) => Math.sin(t * 5 + sx) * 3;
    s.paint([x - 10, y - len - 4, x + 10, y], (px, py) => {
      const t = (y - py) / len;
      if (t < 0 || t > 1) return false;
      const c = x + wave(t) * t;
      const ragged = t > 0.75 && Math.sin(px * 1.7) > 0.2;
      return Math.abs(px - c) < 9 && !ragged;
    }, 'c', () => 0.6);
    const [sxc, syc] = [x + wave(0.45) * 0.45, y - len * 0.45];
    for (let a = 0; a < 6.3; a += 0.15) s.px(sxc + Math.cos(a) * 6, syc + Math.sin(a) * 6, 0x1e3a5a);
    for (let k = -1; k <= 1; k++) for (let i = -4; i <= 4; i++) s.px(sxc + i, syc + k * 2.6 + Math.round(Math.sin(i * 1.2)), 0x1e3a5a); // three waves in a ring
  }
}

function lantern(s, state) {
  // the great lantern at the bow on its post, the wisp burning in it: the weak point (brighter when it is open)
  const [x, y] = [CX, 418];
  s.tube(x, y + 18, x, y - 4, 2.4, 'l');
  s.ellipse(x, y, 15, 13, 'c', { bias: 0.02 });
  for (let k = -2; k <= 2; k++) s.line(x - 14, y + k * 4.5, x + 14, y + k * 4.5, 0x3a4a4a, 1, 0.6); // its ribs
  s.ellipse(x, y, 11, 9, 'C', { flat: 0.9, glow: true });
  s.paint([x - 12, y - 12, x + 12, y + 10], (px, py) => ((px - x) / 10) ** 2 + ((py - y) / 8.5) ** 2 < 1, 'C', (px, py) => 0.95 - Math.hypot(px - x, py - y) / 20, { glow: true });
  s.ellipse(x, y + 1, 4.6, 5.6, 'W', { flat: 0.98, glow: true });
  s.poly([[x - 9, y - 12], [x + 9, y - 12], [x + 6, y - 15], [x - 6, y - 15]], 'K', { flat: 0.3 });
  s.poly([[x - 9, y + 12], [x + 9, y + 12], [x + 6, y + 15], [x - 6, y + 15]], 'K', { flat: 0.3 });
  void state;
}

function arms(s, state) {
  // the arms of the drowned risen out of the water along its sides, each holding a ladle: with its bottom (dipping
  // water to fill the ship's enemies), or knocked out (gold rim: a target in the fight; holed: pouring through)
  if (state !== 'ladles') return;
  let k = 0;
  for (const y of [120, 196, 272, 348])
    for (const sx of [-1, 1]) {
      const x0 = CX + sx * (half(y) + 34);
      const [ex, ey] = [x0 + sx * 6, y - 12]; // the elbow
      const [hx, hy] = [x0 - sx * 8, y - 26]; // the hand, gripping the handle
      s.ellipse(x0, y + 6, 9, 3.6, 'o', { flat: 0.35, glow: true }); // the ring of light where it comes up out of the water
      s.tube(x0, y + 4, ex, ey, 3.4, 'g', { rb: 3, pat: speckle({ amt: 0.12, seed: k }) });
      s.tube(ex, ey, hx, hy, 3, 'g', { rb: 2.6, pat: speckle({ amt: 0.12, seed: k + 9 }) });
      for (let f = -1; f <= 1; f++) s.line(hx + f * 2, hy, hx + f * 2.4 - sx, hy - 5, 0xd8f4f8, 1); // fingers round the handle
      const [lx, ly] = [hx + sx * 22, hy - 8];
      s.tube(hx, hy - 2, lx, ly, 1.4, 'l');
      const holed = k % 3 === 2;
      s.ellipse(lx + sx * 7, ly, 9, 8, 'l', { bias: 0.05 });
      s.ellipse(lx + sx * 7, ly, 6.6, 5.6, holed ? 'C' : 'K', { flat: holed ? 0.55 : 0.3 });
      if (!holed) s.ellipse(lx + sx * 7, ly + 1, 4.6, 3.4, 'C', { flat: 0.7 }); // the water in it
      else for (let q = 0; q < 4; q++) s.dot(lx + sx * 7 + (q - 1.5) * 2, ly + 9 + q * 2, 1.1, 0x9ad8ff); // pouring away through the hole
      // its rim gold: it can be shot through
      for (let a = 0; a < 6.3; a += 0.2) if (!holed) s.px(lx + sx * 7 + Math.cos(a) * 9.2, ly + Math.sin(a) * 8.2, 0xffd84a, 0.95);
      k++;
    }
}

/** The whole ship in one of its forms ('ladles', 'fire', 'whirl'), for the author's look at the design. */
export function funayurei(state) {
  const s = new HiSprite(FW, FH, { ...RAMPS });
  hull(s, state);
  house(s, state);
  rigging(s, state);
  banners(s, state);
  lantern(s, state);
  arms(s, state);
  return s.render({ outline: 2 });
}
export const COLORS = { GLOW, FIRE, INK };

// ---------------------------------------------------------------- the preview: the three forms on the strait at night
if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}` || process.argv[1]?.endsWith('funayurei.mjs')) {
  const { writeFileSync, mkdirSync } = await import('node:fs');
  const { Raster } = await import('../../lib/raster.mjs');
  const { buildMid } = await import('./mid.mjs');
  const { buildFarNight } = await import('./far.mjs');
  const { strip } = buildMid();
  const far = buildFarNight();
  const [PW, PH] = [540, 1140];
  const out = new Raster(PW * 3 + 40, PH);
  out.rect(0, 0, out.w, out.h, 0x101018);
  const top = 0; // (the strip's end, at its top row: the water before the station)
  ['ladles', 'fire', 'whirl'].forEach((state, n) => {
    const ox = n * (PW + 20);
    for (let y = 0; y < PH; y++)
      for (let x = 0; x < PW; x++) {
        const i = ((top + y) * strip.w + x) * 4;
        const a = strip.data[i + 3];
        const j = (((top + y) % far.h) * far.w + x) * 4;
        let [r, g, b] = a ? [strip.data[i], strip.data[i + 1], strip.data[i + 2]] : [far.data[j], far.data[j + 1], far.data[j + 2]];
        if (state === 'whirl' && !a) {
          // the whirlpool round it: spiral arms of foam on the dark water
          const [dx, dy] = [x - 240, y - 420];
          const rr = Math.hypot(dx, dy);
          const arm = Math.sin(Math.atan2(dy, dx) * 3 + rr * 0.045);
          if (rr > 150 && rr < 380 && arm > 0.86) [r, g, b] = [r + 70, g + 90, b + 90].map((v) => Math.min(255, v));
        }
        out.setRGBA(ox + x, y, r, g, b, 255);
      }
    const ship = funayurei(state);
    const [sx, sy] = [ox + 240 - FW / 2, 420 - 250];
    for (let y = 0; y < ship.h; y++)
      for (let x = 0; x < ship.w; x++) {
        const i = (y * ship.w + x) * 4;
        if (ship.data[i + 3] < 100) continue;
        out.setRGBA(sx + x, sy + y, ship.data[i], ship.data[i + 1], ship.data[i + 2], 255);
      }
  });
  mkdirSync(new URL('../../preview/', import.meta.url), { recursive: true });
  writeFileSync(new URL('../../preview/stage11_funayurei.png', import.meta.url), out.toPNG());
  console.log('stage11_funayurei.png');
}
