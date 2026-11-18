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
import { Raster } from '../../lib/raster.mjs';

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

/** A banner on its pole, the pole's foot at (x, y): streaming up the screen (the ship's way), torn; our own sign on it.
 * `f` its flutter (0..2), `len` shorter once it is burnt. */
function banner(s, x, y, len, f) {
  s.ellipse(x, y, 3, 3, 'l', { bias: 0.1 });
  const wave = (t) => Math.sin(t * 5 + f * 2.1) * 3 + Math.sin(t * 9 + f * 1.3) * 0.8;
  s.paint([x - 13, y - len - 4, x + 13, y], (px, py) => {
    const t = (y - py) / len;
    if (t < 0 || t > 1) return false;
    const c = x + wave(t) * t;
    const ragged = t > 0.75 && Math.sin(px * 1.7 + f) > 0.2;
    return Math.abs(px - c) < 9 && !ragged;
  }, 'c', (px, py) => 0.55 + 0.18 * Math.sin(((y - py) / len) * 5 + f * 2.1));
  const [sxc, syc] = [x + wave(0.45) * 0.45, y - len * 0.45];
  for (let a = 0; a < 6.3; a += 0.15) s.px(sxc + Math.cos(a) * 6, syc + Math.sin(a) * 6, 0x1e3a5a);
  for (let k = -1; k <= 1; k++) for (let i = -4; i <= 4; i++) s.px(sxc + i, syc + k * 2.6 + Math.round(Math.sin(i * 1.2)), 0x1e3a5a); // three waves in a ring
}

function banners(s, state) {
  // two poles at the stern's corners
  for (const sx of [-1, 1]) banner(s, CX + sx * 88, STERN + 6, state === 'whirl' ? 36 : 58, sx < 0 ? 0 : 1);
}

/** The great lantern at (x, y) on its post: lit (two flickers), open (blazing: the weak point laid bare), out. */
function lanternAt(s, x, y, kind = 'lit', f = 0) {
  s.tube(x, y + 18, x, y - 4, 2.4, 'l');
  const out = kind === 'out';
  s.ellipse(x, y, 15, 13, out ? 'h' : 'c', { bias: 0.02 });
  for (let k = -2; k <= 2; k++) s.line(x - 14, y + k * 4.5, x + 14, y + k * 4.5, 0x3a4a4a, 1, 0.6); // its ribs
  if (!out) {
    const open = kind === 'open';
    s.ellipse(x, y, 11, 9, 'C', { flat: 0.9, glow: true });
    s.paint([x - 12, y - 12, x + 12, y + 10], (px, py) => ((px - x) / 10) ** 2 + ((py - y) / 8.5) ** 2 < 1, 'C', (px, py) => (open ? 1.1 : 0.95) - Math.hypot(px - x, py - y) / 20, { glow: true });
    // the wisp in it, flickering; blazing white when open
    const [wr, wy] = open ? [6.4, 7.4] : f ? [4.2, 6.2] : [4.8, 5.2];
    s.ellipse(x + (f ? 0.6 : -0.4), y + 1, wr, wy, 'W', { flat: 0.98, glow: true });
    s.ellipse(x + (f ? 0.6 : -0.4), y - wy + 1.6, wr * 0.45, 2.2, 'W', { flat: 0.98, glow: true }); // its tongue
    if (open) for (let k = -2; k <= 2; k += 2) s.line(x + k * 3, y - 6, x + k * 3, y + 7, 0x3a4a4a, 1, 0.35);
  } else {
    // gone out: the paper scorched and dark, a thread of smoke
    s.ellipse(x, y, 10, 8, 'K', { flat: 0.35 });
    for (let k = 0; k < 6; k++) s.px(x + Math.sin(k) * 1.5, y - 14 - k * 2, 0x8a9a9a, 0.6 - k * 0.08);
  }
  s.poly([[x - 9, y - 12], [x + 9, y - 12], [x + 6, y - 15], [x - 6, y - 15]], 'K', { flat: 0.3 });
  s.poly([[x - 9, y + 12], [x + 9, y + 12], [x + 6, y + 15], [x - 6, y + 15]], 'K', { flat: 0.3 });
}

function lantern(s) {
  lanternAt(s, CX, 418);
}

// An arm's parts from the ring where it comes out of the water (fine px, for an arm on the ship's right; mirrored on
// its left): the elbow, the hand, the ladle's bowl. The game hit-tests the bowl (FY_ARM in onomichi-funayurei.js).
export const ARM = {
  hold: { elbow: [6, -18], hand: [-8, -32], bowl: [21, -40] },
  throw: { elbow: [9, -15], hand: [13, -24], bowl: [27, -8] },
  rise: { elbow: [3, -10], hand: [2, -18] },
};

/**
 * One arm of the drowned out of the water at (x0, y0), `sx` the side it leans out to (1: right): 'rise' (a hand
 * reaching up), 'hold' (a ladle full of water, its rim gold: a target), 'throw' (swung at the ship, the water
 * flying), 'holed' (its bottom knocked out: pouring away through it).
 */
function arm(s, x0, y0, sx, pose, seed = 0) {
  const P = ARM[pose === 'holed' ? 'hold' : pose];
  const at = ([dx, dy]) => [x0 + sx * dx, y0 + dy];
  const [ex, ey] = at(P.elbow);
  const [hx, hy] = at(P.hand);
  // the ring of light where it comes up out of the water, ripples round it
  s.ellipse(x0, y0, 9, 3.6, 'o', { flat: 0.35, glow: true });
  for (let a = 0; a < 6.3; a += 0.25) if (Math.sin(a * 3 + seed) > -0.3) s.px(x0 + Math.cos(a) * 12, y0 + Math.sin(a) * 4.6, 0x5ae6d4, 0.5);
  s.tube(x0, y0 - 2, ex, ey, 3.4, 'g', { rb: 3, pat: speckle({ amt: 0.12, seed }) });
  s.tube(ex, ey, hx, hy, 3, 'g', { rb: 2.6, pat: speckle({ amt: 0.12, seed: seed + 9 }) });
  for (let k = 0; k < 5; k++) s.px(x0 + sx * (k - 2) * 1.6, y0 - 4 - k * 1.2, 0x9ad8e0, 0.7); // water running off it
  if (pose === 'rise') {
    // fingers spread, reaching
    for (let f = -2; f <= 2; f++) s.tube(hx, hy, hx + f * 2.6, hy - 6 + Math.abs(f) * 1.2, 1, 'g', { rb: 0.8 });
    return;
  }
  for (let f = -1; f <= 1; f++) s.line(hx + f * 2, hy, hx + f * 2.4 - sx, hy - 5, 0xd8f4f8, 1); // fingers round the handle
  const [bx, by] = at(P.bowl);
  s.tube(hx, hy - 2, bx - sx * 7, by + (pose === 'throw' ? -4 : 0), 1.4, 'l');
  if (pose === 'throw') {
    // tipped at the ship: the outside of the bowl, the water flying out of it towards the bottom of the screen
    s.ellipse(bx, by, 8, 6, 'l', { bias: 0.08 });
    s.ellipse(bx + sx, by + 2, 6, 3.4, 'C', { flat: 0.7 });
    for (let a = 0; a < 6.3; a += 0.2) s.px(bx + Math.cos(a) * 8.2, by + Math.sin(a) * 6.2, 0xffd84a, 0.95);
    for (let q = 0; q < 9; q++) s.dot(bx + sx * (1 + q * 1.2) + Math.sin(q * 2) * 2, by + 6 + q * 2.2, q < 5 ? 1.5 : 1, q % 3 ? 0x9ad8ff : 0xe0f8ff, 0.9 - q * 0.06);
    return;
  }
  const holed = pose === 'holed';
  s.ellipse(bx, by, 9, 8, 'l', { bias: 0.05 });
  s.ellipse(bx, by, 6.6, 5.6, holed ? 'C' : 'K', { flat: holed ? 0.55 : 0.3 });
  if (!holed) {
    s.ellipse(bx, by + 1, 4.6, 3.4, 'C', { flat: 0.7 }); // the water in it
    for (let a = 0; a < 6.3; a += 0.2) s.px(bx + Math.cos(a) * 9.2, by + Math.sin(a) * 8.2, 0xffd84a, 0.95); // its rim gold: it can be shot through
  } else {
    // the bottom gone: the dark water below seen through it, splintered edges, the water pouring away
    s.ellipse(bx, by, 4.4, 3.6, 'K', { flat: 0.15 });
    for (let a = 0; a < 6.3; a += 0.7) s.px(bx + Math.cos(a) * 4.6, by + Math.sin(a) * 3.8, 0x9a7a52);
    for (let q = 0; q < 5; q++) s.dot(bx + Math.sin(q) * 1.2, by + 6 + q * 2.4, 1.1, 0x9ad8ff, 0.85 - q * 0.12);
  }
}

function arms(s, state) {
  if (state !== 'ladles') return;
  let k = 0;
  for (const y of ROWS)
    for (const sx of [-1, 1]) {
      arm(s, CX + sx * (half(y) + 34), y + 6, sx, k % 3 === 2 ? 'holed' : 'hold', k);
      k++;
    }
}
const ROWS = [120, 196, 272, 348]; // (fine y of the arms' rows along its sides)

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

// ---------------------------------------------------------------- its parts for the fight (the city's atlas)
// Where they sit, fine px from the middle of the hull's frame (the game has them in logical px, a third of these: FY in
// onomichi-funayurei.js; the test onomichiFunayurei checks they agree).
export const PARTS = {
  lantern: [0, 418 - FH / 2],
  banner: [88, STERN + 6 - FH / 2], // (the right one; the left mirrored)
  hatch: [0, 138 - FH / 2],
  conch: [40, 102 - FH / 2],
  sail: [-10, 288 - FH / 2], // (burning on the deck in the whirl)
  arms: ROWS.map((y) => [half(y) + 34, y + 6 - FH / 2]), // (the rings on the right; the left mirrored)
  oars: [...Array(13)].map((_, k) => [half(110 + k * 22) + 48, 110 + k * 22 + 15 - FH / 2]), // (the oars' blades, right side)
};
// the small frames' canvases and the points they turn on (fine px)
export const ARM_FRAME = { w: 60, h: 76, ox: 16, oy: 54 };
export const LANTERN_FRAME = { w: 36, h: 44, ox: 18, oy: 18 };
export const BANNER_FRAME = { w: 32, h: 72, ox: 16, oy: 68 };
export const FOAM_FRAME = 240; // (its corner is the whirl's middle)

/** The hull with its house and rigging, worn 0 (with the ladles), 1 (fire: the hatch open) or 2 (in the whirl). */
export function fyHull(wear) {
  const state = ['ladles', 'fire', 'whirl'][wear];
  const s = new HiSprite(FW, FH, { ...RAMPS });
  hull(s, state);
  house(s, state);
  rigging(s, state);
  return s.render({ outline: 2 });
}

export function fyBanner(f, torn) {
  const B = BANNER_FRAME;
  const s = new HiSprite(B.w, B.h, { ...RAMPS });
  banner(s, B.ox, B.oy, torn ? 36 : 58, f);
  return s.render({ outline: 2 });
}

export function fyLantern(kind, f = 0) {
  const L = LANTERN_FRAME;
  const s = new HiSprite(L.w, L.h, { ...RAMPS });
  lanternAt(s, L.ox, L.oy, kind, f);
  return s.render({ outline: 2 });
}

export function fyArm(pose) {
  const A = ARM_FRAME;
  const s = new HiSprite(A.w, A.h, { ...RAMPS });
  arm(s, A.ox, A.oy, 1, pose, 3);
  return s.render({ outline: 2 });
}

/** A clay fire pot (hōroku-hiya) thrown from the house: a round pot bound with rope, its fuse spitting sparks. */
export function fyPot(f) {
  const s = new HiSprite(27, 27, { ...RAMPS });
  const [x, y] = [13.5, 15];
  s.ellipse(x, y, 8.4, 8, 'p', { bias: 0.06, pat: speckle({ amt: 0.14, seed: 21 }) });
  for (const k of [-3.4, 3.4]) s.line(x - 8 + Math.abs(k) * 0.2, y + k, x + 8 - Math.abs(k) * 0.2, y + k, 0xb89a62, 1, 0.9); // its rope
  for (const k of [-2.6, 2.6]) s.line(x + k, y - 7.6, x + k, y + 7.6, 0xb89a62, 1, 0.75);
  s.ellipse(x, y - 7, 3.6, 2, 'p', { flat: 0.3 }); // its mouth, stopped
  const [fx, fy] = [x + 3 + f, y - 11 + f];
  s.line(x + 1, y - 8, fx, fy, 0x3a2a1a, 1);
  for (let k = 0; k < 6; k++) {
    const a = k * 1.05 + f * 0.5;
    s.px(fx + Math.cos(a) * (2 + (k % 2)), fy + Math.sin(a) * (2 + (k % 2)), k % 2 ? FIRE[3] : FIRE[2]);
  }
  s.dot(fx, fy, 1.2, FIRE[4]);
  return s.render({ outline: 2 });
}

/** A festival shell lit gold, flying over the strait: pasted paper in strips, a burning fuse. Shot, it bursts. */
export function fyShell(f) {
  const s = new HiSprite(27, 27, { ...RAMPS });
  const [x, y] = [13.5, 13.5];
  s.ellipse(x, y, 8.6, 8.6, 'Y', { bias: 0.08, pat: mottle({ amt: 0.16, scale: 3, seed: 30 + f }) });
  for (let k = -2; k <= 2; k++) {
    // the pasted strips, curved round the ball
    for (let t = -1; t <= 1; t += 0.05) s.px(x + k * 3.2 * Math.sqrt(1 - t * t), y + t * 8, 0x9a5f10, 0.55);
  }
  s.line(x - 8, y, x + 8, y, 0xfff0a0, 1, 0.5);
  const [fx, fy] = [x - 6 - f, y - 7];
  s.line(x - 3, y - 7, fx, fy, 0x3a2a1a, 1);
  for (let k = 0; k < 6; k++) {
    const a = k * 1.05 + f;
    s.px(fx + Math.cos(a) * (1.6 + (k % 2) * 1.4), fy + Math.sin(a) * (1.6 + (k % 2) * 1.4), k % 2 ? 0xfff0a0 : 0xffffff);
  }
  return s.render({ outline: 1 });
}

/** A ladle let go of, floating: bowl and handle (after the end, and holed ones dropped). */
export function fyLadle() {
  const s = new HiSprite(36, 22, { ...RAMPS });
  s.tube(4, 14, 22, 9, 1.4, 'l');
  s.ellipse(27, 9, 7.4, 6.6, 'l', { bias: 0.05 });
  s.ellipse(27, 9, 5.2, 4.4, 'K', { flat: 0.3 });
  s.ellipse(27, 10, 3.6, 2.6, 'C', { flat: 0.6 });
  return s.render({ outline: 2 });
}

/**
 * One arm of the whirlpool's foam, a spiral streak of it on the dark water from near the middle outwards, thinning and
 * breaking up; the frame's top left corner is the whirl's middle (the game turns copies of it round there).
 */
export function fyFoam(f) {
  const N = FOAM_FRAME;
  const s = new HiSprite(N, N, { ...RAMPS });
  const span = 1.3;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const [r, a] = [Math.hypot(x + 0.5, y + 0.5), Math.atan2(y + 0.5, x + 0.5)];
      if (a > span) continue;
      const q = a / span;
      for (const [k, lane] of [[0, 0], [1, 15], [2, -13]]) {
        const rc = 116 + 104 * q + lane;
        const w = (k ? 2.2 : 6) * Math.sqrt(1 - q) + 1;
        const d = Math.abs(r - rc);
        if (d > w) continue;
        // broken into flecks as it thins out, more so on the side lanes
        const fleck = Math.sin(r * 0.9 + a * 40 + f * 2.3 + k) + Math.sin(r * 0.37 - a * 23 + f);
        if (fleck < -0.4 - (1 - q) * 1.2 + k * 0.6) continue;
        const al = (1 - d / w) * (1 - q * 0.75) * (k ? 0.5 : 0.85);
        if (al < 0.12) continue;
        s.px(x, y, d < w * 0.35 && !k ? 0xf4ffff : 0xbfe6ea, al);
      }
    }
  return s.render({ outline: 0 });
}

/** Every frame of the ship for the city's atlas (enemies.mjs): the hulls packed trimmed, so they line up. */
export function funayureiFrames(add) {
  for (const w of [0, 1, 2]) add(`fy_hull_${w}`, fyHull(w), { trim: true });
  for (const f of [0, 1, 2]) {
    add(`fy_banner_${f}`, fyBanner(f, false));
    add(`fy_banner_torn_${f}`, fyBanner(f, true));
  }
  add('fy_lantern_0', fyLantern('lit', 0));
  add('fy_lantern_1', fyLantern('lit', 1));
  add('fy_lantern_open', fyLantern('open'));
  add('fy_lantern_out', fyLantern('out'));
  for (const p of ['rise', 'hold', 'throw', 'holed']) add(`fy_arm_${p}`, fyArm(p));
  for (const f of [0, 1]) {
    add(`fy_pot_${f}`, fyPot(f));
    add(`fy_shell_${f}`, fyShell(f));
    add(`fy_foam_${f}`, fyFoam(f), { trim: true });
  }
  add('fy_ladle', fyLadle());
  add('fy_portrait', fyPortrait());
}

/** Its portrait for the album and the ending's parade: the ship from its sail to its bow, the arms with their ladles. */
export function fyPortrait() {
  const whole = funayurei('ladles');
  const [y0, h] = [190, 292];
  const out = new Raster(FW, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < FW; x++) {
      const i = ((y0 + y) * FW + x) * 4;
      if (whole.data[i + 3]) out.setRGBA(x, y, whole.data[i], whole.data[i + 1], whole.data[i + 2], whole.data[i + 3]);
    }
  return out;
}

// ---------------------------------------------------------------- the preview: the three forms on the strait at night
// put together from the parts as the game puts them (so their places are checked), the small frames along the bottom
if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}` || process.argv[1]?.endsWith('funayurei.mjs')) {
  const { writeFileSync, mkdirSync } = await import('node:fs');
  const { Raster } = await import('../../lib/raster.mjs');
  const { buildMid } = await import('./mid.mjs');
  const { buildFarNight } = await import('./far.mjs');
  const { strip } = buildMid();
  const far = buildFarNight();
  const [PW, PH] = [540, 1140];
  const out = new Raster(PW * 3 + 40, PH + 260);
  out.rect(0, 0, out.w, out.h, 0x101018);
  const put = (r, x0, y0, flip = false, scale = 1) => {
    for (let y = 0; y < r.h * scale; y++)
      for (let x = 0; x < r.w * scale; x++) {
        const sx = Math.floor(x / scale);
        const i = (Math.floor(y / scale) * r.w + (flip ? r.w - 1 - sx : sx)) * 4;
        if (r.data[i + 3] < 20) continue;
        const j = ((y0 + y) * out.w + x0 + x) * 4;
        const a = r.data[i + 3] / 255;
        for (let c = 0; c < 3; c++) out.data[j + c] = r.data[i + c] * a + out.data[j + c] * (1 - a);
        out.data[j + 3] = 255;
      }
  };
  const top = 0; // (the strip's end, at its top row: the water before the station)
  const [shipX, shipY] = [186, 288]; // (fine px: where the game puts the hull's middle, x 62, y 96)
  ['ladles', 'fire', 'whirl'].forEach((state, n) => {
    const ox = n * (PW + 20);
    const wear = n;
    const wx = state === 'whirl' ? shipX - 24 : shipX;
    for (let y = 0; y < PH; y++)
      for (let x = 0; x < PW; x++) {
        const i = ((top + y) * strip.w + x) * 4;
        const a = strip.data[i + 3];
        const j = (((top + y) % far.h) * far.w + x) * 4;
        out.setRGBA(ox + x, y, ...(a ? [strip.data[i], strip.data[i + 1], strip.data[i + 2]] : [far.data[j], far.data[j + 1], far.data[j + 2]]), 255);
      }
    if (state === 'whirl') {
      // the foam's arms round the whirl's middle (in the game: copies of fy_foam turned round it)
      const foam = fyFoam(0);
      for (let k = 0; k < 5; k++) {
        const t = (k / 5) * Math.PI * 2;
        for (let y = 0; y < foam.h; y++)
          for (let x = 0; x < foam.w; x++) {
            const i = (y * foam.w + x) * 4;
            if (!foam.data[i + 3]) continue;
            const [X, Y] = [Math.round(wx + x * Math.cos(t) - y * Math.sin(t)), Math.round(shipY + x * Math.sin(t) + y * Math.cos(t))];
            if (X < 0 || Y < 0 || X >= PW || Y >= PH) continue;
            if (strip.data[((top + Y) * strip.w + X) * 4 + 3]) continue; // (on the water only)
            const j = (Y * out.w + ox + X) * 4;
            const a = foam.data[i + 3] / 255;
            for (let c = 0; c < 3; c++) out.data[j + c] = foam.data[i + c] * a + out.data[j + c] * (1 - a);
          }
      }
    }
    const at = ([dx, dy], flip = false) => [ox + wx + (flip ? -dx : dx), shipY + dy];
    const hullR = fyHull(wear);
    put(hullR, ox + wx - FW / 2, shipY - FH / 2);
    const B = BANNER_FRAME;
    for (const flip of [false, true]) {
      const [bx, by] = at(PARTS.banner, flip);
      put(fyBanner(flip ? 1 : 0, wear === 2), bx - (flip ? B.w - B.ox : B.ox), by - B.oy, flip);
    }
    const L = LANTERN_FRAME;
    const [lx, ly] = at(PARTS.lantern);
    put(fyLantern(state === 'fire' ? 'open' : 'lit'), lx - L.ox, ly - L.oy);
    if (state === 'ladles') {
      const A = ARM_FRAME;
      PARTS.arms.forEach((p, k) => {
        for (const flip of [false, true]) {
          const [ax, ay] = at(p, flip);
          const pose = ['hold', 'throw', 'holed', 'rise'][(k + (flip ? 2 : 0)) % 4];
          put(fyArm(pose), ax - (flip ? A.w - A.ox : A.ox), ay - A.oy, flip);
        }
      });
    }
    if (state === 'fire') put(fyShell(0), ox + 380, 170);
  });
  // the small frames, twice the size
  let x = 10;
  for (const r of [fyArm('rise'), fyArm('hold'), fyArm('throw'), fyArm('holed'), fyLantern('lit', 0), fyLantern('lit', 1), fyLantern('open'), fyLantern('out'), fyBanner(0, false), fyBanner(2, true), fyPot(0), fyPot(1), fyShell(0), fyShell(1), fyLadle()]) {
    put(r, x, PH + 20, false, 2);
    x += r.w * 2 + 14;
  }
  mkdirSync(new URL('../../preview/', import.meta.url), { recursive: true });
  writeFileSync(new URL('../../preview/stage11_funayurei.png', import.meta.url), out.toPNG());
  console.log('stage11_funayurei.png');
}
