// Hiroshima's looks for the three shared behaviours (src/game/enemies/chainSplitCart.js, docs/plan-silniejsze-fale.md),
// drawn at 540 px with HiSprite:
//   chain  - the oyster lines of the bay's rafts (kaki-ikada) strung between the raft's floats: on each, oysters
//            grown in clumps on a string of scallop shells (kaki-renpo), the shells' white fans showing under the
//            rough grey clumps, dripping; one gapes, an eye looking out of it (these shoot); one catching fire, as
//            the oysters grill on the shore (kaki-yaki); the bare wire left with an empty shell. (Clumps on their
//            shells, not one big oyster: Hiroshima's shooter is a single oyster with its pearl.) The post a float of
//            the raft with its bamboo poles lashed across it.
//   split  - a kendama of Hatsukaichi, by Miyajima, where the toy was first made: the ken, its cups and its spike, the
//            red ball on its string swinging, glaring; shot, the string snaps and the ball and the ken dive spinning,
//            each on its own. (In place of the maple leaves: Hiroshima's popcorn already is a maple-leaf spirit, its
//            carrier a momiji manjū.)
//   cart   - the gozabune of Kangen-sai, three boats lashed under one deck with the shrine's hōren under its gilded
//            roof, a purple and white curtain round it, lanterns on its posts, banners and sakaki at its bows, its
//            long sweeps out at the sides, come alive: eyes painted on its bows glaring; it breaks up in three stages
//            (its lanterns put out and falling: it glares red; a sweep gone, the curtain torn; its roof on fire),
//            its wreck swamped, only the roof and the banners above the water
import { HiSprite, tones, speckle, mottle, fur, mix2 } from '../../lib/hisprite.mjs';

const INK = 0x14101c;
const TAU = Math.PI * 2;
const RAMPS = {
  oy: tones([0x3a3638, 0x7a7478, 0xc0b8bc]), // oyster shell, rough grey
  sh: tones([0x9a8a7a, 0xe8dccc, 0xfffaf0]), // scallop shell, white
  mt: tones([0x8a6a62, 0xd8b0a0, 0xfff0e4]), // an oyster's flesh
  wi: tones([0x2a2a30, 0x5a5a62, 0x9a9aa4]), // wire
  fl: tones([0xb82a08, 0xff8a1a, 0xfff2a0]), // flame
  ch: tones([0x0e0a08, 0x2a201a, 0x4a3a30]), // charred
  ft: tones([0x8a9098, 0xdce2e6, 0xffffff]), // the raft's float
  bm: tones([0x6a5a2a, 0xb8a060, 0xe8d8a0]), // bamboo
  rd: tones([0x6a0a10, 0xd02a2a, 0xff7a6a]), // the kendama's red lacquer
  kw: tones([0x6a4a2a, 0xc8945a, 0xf0d0a0]), // its beech wood
  st: tones([0x8a8070, 0xe0d8c8, 0xffffff]), // its string
  hl: tones([0x2a160c, 0x5a3418, 0x8a6040]), // the boats' hulls, dark wood
  dk: tones([0x8a7a5a, 0xd8c8a0, 0xf8ecd0]), // the deck's pale boards
  fe: tones([0x6a0a10, 0xb81e24, 0xe85a50]), // red felt
  pp: tones([0x2a0e3a, 0x5a2a7a, 0x9a6ab8]), // the curtain's purple
  wt: tones([0xa8a49a, 0xeeeae0, 0xffffff]), // white cloth, paper
  gd: tones([0x8a5a10, 0xe0a828, 0xfff0a0]), // gilt
  bk: tones([0x0e0e14, 0x2a2a34, 0x4a4a58]), // black lacquer
  lp: tones([0xa04a08, 0xff9a30, 0xfff0c0]), // a lantern lit
  ld: tones([0x3a2a1a, 0x6a5038, 0x9a7a58]), // a lantern out
  sk: tones([0x1a3a14, 0x3a6a2a, 0x7aa84a]), // sakaki
  wa: tones([0x0e3d52, 0x226e82, 0x8ac8d8]), // the bay's water
  sm: tones([0x6a6a70, 0xb0b0b4, 0xe8e8ea]), // smoke
};

// ---------------------------------------------------------------- chain: a line of oysters (30 x 46)
/** Its wire down from the line and the shells strung on it, the clumps of oysters on them; `open`: the one gaping. */
function renpo(s, c, f, { open = false, burnt = false, flip = 1 } = {}) {
  s.line(c, 2, c, 42, burnt ? 0x2a2622 : 0x5a5a62, 1);
  s.ellipse(c, 3.6, 1.6, 1.2, 'wi', { flat: 0.55 }); // (its knot on the line)
  if (burnt) {
    s.ellipse(c + 1.5, 30, 4.4, 3.2, 'ch', { flat: 0.3 }); // an empty shell, scorched
    for (let k = 0; k < 4; k++) s.line(c - 1 + k * 1.2, 28.5, c + 2.6 + k * 0.6, 31.5, 0x4a3a30, 1, 0.6);
    s.dot(c + 0.5, 36, 0.8, 0xff7020, 0.9);
    return;
  }
  // three scallop shells on the wire, their ribbed fans white under the clumps grown over them
  for (const [y, sx0] of [[12, -1], [23, 1], [34, -1]]) {
    const sx = sx0 * flip;
    s.paint([c - 9, y - 6, c + 9, y + 6], (x, yy) => {
      const a = Math.atan2(yy - y - 3, x - c - sx * 1.5);
      const r = Math.hypot(x - c - sx * 1.5, yy - y - 3);
      return a < -0.2 && a > -2.95 && r < 8.6;
    }, 'sh', (x, yy) => 0.62 + Math.sin(Math.atan2(yy - y - 3, x - c - sx * 1.5) * 16) * 0.2 - Math.hypot(x - c, yy - y - 3) * 0.015);
    s.ellipse(c + sx * 1.5, y + 3, 1.6, 1.2, 'sh', { flat: 0.35 }); // (its hinge)
    // the clump of oysters on it: rough grey shells piled every way, frilled edges, barnacles
    for (const [dx, dy, rx, ry, a] of [[-4.6, 0, 3.4, 2.3, 0.4], [-1.2, 2.2, 3.2, 2.1, -0.3], [-4, -2.8, 2.8, 1.9, 0.6]]) {
      const [ex, ey] = [c + dx * sx, y + dy];
      s.paint([ex - 6, ey - 5, ex + 6, ey + 5], (x, yy) => {
        const u = (x - ex) * Math.cos(a) + (yy - ey) * Math.sin(a), v = -(x - ex) * Math.sin(a) + (yy - ey) * Math.cos(a);
        return (u / rx) ** 2 + (v / ry) ** 2 < 1 + Math.sin(Math.atan2(v, u) * 9) * 0.12;
      }, 'oy', (x, yy) => 0.5 - (x - ex) * 0.04 - (yy - ey) * 0.03 + Math.sin(x * 2.1 + yy * 1.7) * 0.1, { pat: speckle({ amt: 0.22, dark: 0.1, seed: Math.round(y + dx * 7) }) });
    }
    for (let k = 0; k < 3; k++) s.dot(c - 3 + k * 3 * sx, y + 1 + (k % 2) * 2, 0.6, 0xe8e4dc, 0.8); // (barnacles)
  }
  if (open) {
    // the middle clump's oyster gaping, its pale flesh and an eye in it looking out, rolling
    s.ellipse(c + 1, 23.4, 4.6, 3.2, 'ch', { flat: 0.1 });
    s.ellipse(c + 1, 24, 3.6, 2.2, 'mt', { flat: 0.6 });
    s.ellipse(c + 1 + (f ? 0.8 : -0.6), 23.8, 1.6, 1.4, 'wt', { flat: 0.8 });
    s.dot(c + 1.2 + (f ? 1.2 : -0.4), 23.9, 0.8, 0xc81a10);
    s.line(c - 3.4, 21.2, c + 5.4, 20.4 - f, 0x2a2628, 1); // (its upper shell lifted)
  }
  // the sea dripping off it, a ring where a drop falls
  s.dot(c + (f ? 2 : -2), 41 + f, 0.7, 0xb8e0f0, 0.9);
  s.ellipse(c, 44, 3.4, 1.1, 'wa', { flat: 0.6 });
}

function line(kind, f = 0) {
  const s = new HiSprite(30, 46, RAMPS);
  const c = 15;
  if (kind === 'burnt') renpo(s, c, 0, { burnt: true });
  else renpo(s, c, f, { open: kind === 'eye' });
  if (kind === 'lit') {
    // grilling: flames licking up the clumps from below, the shells popping open, smoke
    for (let k = -2; k <= 2; k++) s.ellipse(c + k * 3, 36 - ((f + k + 4) % 3) * 2.4, 1.4, 3.8 + ((k + f) % 2), 'fl', { bias: 0.25, glow: true });
    for (let k = -1; k <= 1; k++) s.ellipse(c + k * 3.4 + 1, 39, 1.2, 2, 'fl', { bias: 0.5, glow: true });
    for (let k = 0; k < 3; k++) s.ellipse(c - 4 + k * 4, 24 - k * 3 - f, 2.6, 2, 'sm', { flat: 0.6 });
    for (let i = 0; i < 3; i++) s.dot(c - 4 + i * 4, 17 - ((i + f) % 3) * 2, 0.7, 0xfff2a0);
  }
  return s.render({ outline: 2 });
}
/** The same line with its shells strung the other way about (for the rope's turn). */
function line1(f = 0) {
  const s = new HiSprite(30, 46, RAMPS);
  renpo(s, 15, f, { flip: -1 });
  return s.render({ outline: 2 });
}

/** The post (22 x 22, from above): a float of the raft, white, its bamboo poles lashed across it, the sea round it. */
function float() {
  const s = new HiSprite(22, 22, RAMPS);
  const c = 11;
  s.ellipse(c, c + 1, 9.6, 7, 'wa', { flat: 0.5, pat: mottle({ amt: 0.2, scale: 2, seed: 3 }) });
  s.ellipse(c, c, 7, 5.4, 'ft', { bias: 0.1, pat: speckle({ amt: 0.1, seed: 4 }) });
  for (const [x0, y0, x1, y1] of [[1, c - 2, 21, c - 2], [c - 3, 1, c - 3, 21]]) s.tube(x0, y0, x1, y1, 1.3, 'bm', { flat: 0.55 });
  for (let k = 1; k < 20; k += 5) s.line(k, c - 3.2, k, c - 0.8, 0x6a5a2a, 1, 0.7); // (its nodes)
  s.ellipse(c - 3, c - 2, 1.8, 1.8, 'wi', { flat: 0.4 }); // the lashing
  return s.render({ outline: 2 });
}

// ---------------------------------------------------------------- split: a kendama (40 x 46), its ball and its ken
/** The ken (from above, along it): the big cup and the small cup at its cross piece, the base cup below, the spike. */
function ken(s, cx, cy, a = 0, sc = 1) {
  const R = (x, y) => [cx + (x * Math.cos(a) - y * Math.sin(a)) * sc, cy + (x * Math.sin(a) + y * Math.cos(a)) * sc];
  const [sx0, sy0] = R(0, -12);
  const [sx1, sy1] = R(0, 9);
  s.tube(sx0, sy0, sx1, sy1, 2.2 * sc, 'kw', { flat: 0.5, pat: fur(a + Math.PI / 2, { amt: 0.1, len: 12, w: 1, gap: 0.05 }) });
  const [tx, ty] = R(0, -15);
  s.poly([R(-1.6, -12), R(1.6, -12), [tx, ty]], 'kw', { flat: 0.7 }); // the spike
  const [px0, py0] = R(-7, 0);
  const [px1, py1] = R(7, 0);
  s.tube(px0, py0, px1, py1, 2.6 * sc, 'kw', { flat: 0.45 }); // the cross piece
  for (const [x, r] of [[-8, 3.4], [8, 2.6]]) {
    const [ex, ey] = R(x, 0);
    s.ellipse(ex, ey, r * sc, r * sc, 'kw', { flat: 0.4 });
    s.ellipse(ex, ey, (r - 1.2) * sc, (r - 1.2) * sc, 'kw', { flat: 0.15 }); // its cup
  }
  const [bx, by] = R(0, 10.5);
  s.ellipse(bx, by, 3 * sc, 3 * sc, 'kw', { flat: 0.4 });
  s.ellipse(bx, by, 1.8 * sc, 1.8 * sc, 'kw', { flat: 0.15 }); // the base cup
}
/** The ball: red lacquer, its hole, the eyes glaring (and red once it is loose), a highlight. */
function tama(s, x, y, f, r = 6, loose = false) {
  s.ellipse(x, y, r, r, 'rd', { bias: 0.15 });
  s.ellipse(x + r * 0.35, y + r * 0.45, r * 0.3, r * 0.28, 'bk', { flat: 0.2 }); // (its hole: the mouth, gaping)
  for (const sx of [-1, 1]) {
    const [ex, ey] = [x + sx * r * 0.36 - r * 0.1, y - r * 0.12];
    s.ellipse(ex, ey, r * 0.2, r * 0.17, 'wt', { flat: 0.8 });
    s.dot(ex + (f ? 0.4 : -0.3), ey, r * 0.1, loose ? 0xff2a10 : INK);
    s.line(ex - sx * r * 0.3, ey - r * 0.32, ex + sx * r * 0.2, ey - r * 0.2, INK, 1); // (its brows)
  }
  s.dot(x - r * 0.45, y - r * 0.5, r * 0.14, 0xffffff, 0.9);
}

function kendama(f) {
  const s = new HiSprite(40, 46, RAMPS);
  const [kx, ky] = [16, 22];
  const sw = Math.sin((f / 4) * TAU); // (the ball swinging on its string)
  const [bx, by] = [kx + 9 + sw * 7, ky + 15 - Math.abs(sw) * 2];
  ken(s, kx, ky, -0.25);
  // the string from the cross piece's hole to the ball, slack
  const [sx, sy] = [kx + 1.5, ky + 1.6];
  for (let t = 0; t <= 1; t += 0.04) s.px(sx + (bx - sx) * t, sy + (by - sy) * t + Math.sin(t * Math.PI) * 2.2, 0xe8e0d0);
  tama(s, bx, by, f % 2);
  return s.render({ outline: 2 });
}
function kenOne(f) {
  const s = new HiSprite(28, 28, RAMPS);
  ken(s, 14, 15, (f / 2) * Math.PI + 0.4, 0.82);
  s.line(14, 15, 14 + (f ? 4 : -3), 15 + (f ? 3 : 5), 0xe8e0d0, 1); // (the snapped string)
  return s.render({ outline: 2 });
}
function tamaOne(f) {
  const s = new HiSprite(28, 28, RAMPS);
  tama(s, 14, 14, f, 7.4, true);
  s.line(14 - 3, 7 - f, 14 - 8, 4 + f * 2, 0xe8e0d0, 1); // (its end of the string, whipping)
  return s.render({ outline: 2 });
}

// ---------------------------------------------------------------- cart: the gozabune (48 x 84), bows down the screen
function goza(stage, f) {
  const s = new HiSprite(48, 84, RAMPS);
  const c = 24;
  const dark = stage >= 1; // (its lanterns out, some fallen)
  const lame = stage >= 2; // (a sweep gone, the curtain torn)
  const fire = stage >= 3;
  // its wake on the water astern and the bow waves
  for (const sx of [-1, 1]) for (let k = 0; k < 6; k++) s.dot(c + sx * (12 + k * 1.6), 4 + k * 2.2 + (f ? 1 : 0), 1.2 - k * 0.1, 0xd8f0f8, 0.6);
  for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) s.dot(c + sx * (16 + k * 1.2), 76 - k * 3, 1, 0xe8f8ff, 0.7);
  // the three hulls side by side, pointed at the bows (down), square at the sterns
  for (const hx of [-14, 0, 14]) {
    s.paint([c + hx - 7, 6, c + hx + 7, 82], (x, y) => {
      const w = 6.4 - Math.max(0, y - 64) * 0.33;
      return Math.abs(x - c - hx) < w && y > 7 && y < 81;
    }, 'hl', (x) => 0.55 - (x - c - hx) * 0.05, { pat: fur(Math.PI / 2, { amt: 0.1, len: 20, w: 1, gap: 0.04 }) });
    // the eye painted on each outer bow, glaring
    if (hx) {
      const [ex, ey] = [c + hx + (hx > 0 ? 2 : -2), 70];
      s.ellipse(ex, ey, 2.4, 1.8, 'wt', { flat: 0.8 });
      s.dot(ex - (hx > 0 ? 0.3 : -0.3), ey + 0.2, 1, dark ? 0xff2a10 : INK);
      s.line(ex - 2.6, ey - 2.2, ex + 2.6, ey - 1.6 * (hx > 0 ? 1 : -1) - 0.4, INK, 1);
    }
    s.ellipse(c + hx, 78, 1.6, 1.6, 'sk', { flat: 0.5 }); // a sakaki branch at each bow
  }
  // the deck across the three: pale boards, a red felt down its middle
  s.paint([c - 17, 10, c + 17, 62], (x, y) => Math.abs(x - c) < 15.6 && y > 11 && y < 61, 'dk', (x, y) => 0.36 + ((y | 0) % 4 === 0 ? -0.16 : 0) - (x - c) * 0.006, { pat: speckle({ amt: 0.08, seed: 6 }) });
  s.paint([c - 5, 12, c + 5, 60], (x, y) => Math.abs(x - c) < 4.4 && y > 12 && y < 60, 'fe', () => 0.5);
  // the musicians in two rows down the felt's sides, the great drum forward
  for (let k = 0; k < 5; k++) for (const sx of [-1, 1]) {
    s.ellipse(c + sx * 8, 40 + k * 4, 1.6, 1.4, k % 2 ? 'wt' : 'pp', { flat: 0.5 });
    s.dot(c + sx * 8, 39.6 + k * 4, 0.7, 0x1a1a1e); // (their black caps)
  }
  s.ellipse(c, 58, 3.6, 3.6, 'fe', { flat: 0.4 });
  s.ellipse(c, 58, 2.6, 2.6, 'wt', { flat: 0.6 }); // the drum's head
  // the curtain round the rail, purple and white in turn (torn and hanging once hit hard)
  for (let y = 11; y < 61; y += 1) for (const sx of [-1, 1]) {
    if (lame && sx > 0 && y > 30 && y < 44) continue;
    for (const d of [0, 0.7]) s.px(c + sx * (16 - d), y, ((y / 5) | 0) % 2 ? (d ? 0x3a1a5a : 0x6a3a8a) : d ? 0xc8c4ba : 0xf4f0e8);
  }
  for (let x = c - 16; x <= c + 16; x++) for (const d of [0, 0.7]) s.px(x, 11 + d, ((x / 5) | 0) % 2 ? 0x6a3a8a : 0xf4f0e8);
  if (lame) for (let k = 0; k < 3; k++) s.line(c + 16, 31 + k * 4, c + 19 + k, 33 + k * 4 + f, 0x6a3a8a, 1); // (torn, trailing)
  // the hōren under its roof: black lacquer, gilt, the roof hipped with a phoenix on its ridge
  {
    // its eaves (black lacquer, a gilt edge) round the hipped roof: four slopes to a short ridge, gilt
    s.paint([c - 10, 13, c + 10, 35], (x, y) => Math.abs(x - c) < 9.4 && y > 14 && y < 34, 'bk', () => 0.5);
    s.paint([c - 9, 14, c + 9, 34], (x, y) => Math.abs(x - c) < 8.2 && y > 15.2 && y < 32.8, 'gd', (x, y) => {
      const dx = Math.abs(x - c) / 8.2, dy = Math.abs(y - 24) / 8.8;
      const side = dx > dy ? (x < c ? 0.78 : 0.42) : y < 24 ? 0.66 : 0.5; // (its four slopes lit from the north-west)
      return side + (((x + y) | 0) % 3 === 0 ? -0.08 : 0);
    });
    for (const [x0, y0, x1, y1] of [[c - 8.2, 15.2, c, 19], [c + 8.2, 15.2, c, 19], [c - 8.2, 32.8, c, 29], [c + 8.2, 32.8, c, 29]]) s.line(x0, y0, x1, y1, 0x8a5a10, 1, 0.8); // (its hips)
    s.line(c, 19, c, 29, 0xfff0a0, 1); // the ridge
    s.ellipse(c, 21, 1.8, 1.4, 'gd', { flat: 0.85, glow: true }); // the phoenix on its ridge
  }
  // its lanterns on the posts round the deck: lit, then out and some fallen
  for (let k = 0; k < 6; k++) for (const sx of [-1, 1]) {
    const y = 13 + k * 9.4;
    if (dark && (k + (sx > 0 ? 1 : 0)) % 3 === 0) continue; // (fallen)
    s.ellipse(c + sx * 20.6, y, 1.3, 1.6, dark ? 'ld' : 'lp', { bias: 0.2, glow: !dark });
  }
  if (dark) for (let k = 0; k < 3; k++) s.ellipse(c - 21 + k * 18, 66 + k * 3, 1.2, 1, 'ld', { flat: 0.5 }); // (lanterns afloat)
  // the banners at the bows' posts, the long sweeps out at the sides (one gone once it is lame)
  for (const [x, col] of [[c - 14, 0xd02a2a], [c, 0xeeeae0], [c + 14, 0x2a6ac8]]) {
    s.line(x, 62, x, 66, 0x5a3a20, 1);
    s.paint([x, 62, x + 4, 66], (px, py) => px > x && px < x + 3.4 && py > 62 && py < 65.5, 'wt', () => 0.6);
    s.line(x + 0.5, 63, x + 3, 63, col, 1);
    s.line(x + 0.5, 64.4, x + 3, 64.4, col, 1);
  }
  const sweep = (sx) => {
    const a = (f ? 0.18 : -0.12) * sx;
    s.tube(c + sx * 20, 46, c + sx * (31 + 0) + Math.sin(a) * 3, 40 + Math.cos(a) * 8, 0.9, 'hl', { flat: 0.6 });
    s.ellipse(c + sx * 31 + Math.sin(a) * 3, 48 + Math.cos(a) * 2, 1.4, 3, 'hl', { flat: 0.5 }); // its blade
  };
  sweep(-1);
  if (!lame) sweep(1);
  else s.dot(c + 21.5, 46, 0.9, 0x8a6040); // (the thole pin bare)
  if (fire) {
    // the hōren's roof on fire, the flames leaning back in the wind of its going, smoke astern
    for (let k = 0; k < 4; k++) {
      const x = c - 6 + k * 4;
      const h = 7 + ((k * 3 + f * 2) % 4);
      s.paint([x - 3, 16 - h, x + 3, 22], (px, py) => {
        const t = (21 - py) / (h + 4);
        return t > 0 && t < 1 && Math.abs(px - x) < 2.6 * (1 - t) + 0.5;
      }, 'fl', (px, py) => 0.5 + ((21 - py) / (h + 4)) * 0.45, { glow: true });
    }
    for (let k = 0; k < 3; k++) s.ellipse(c - 5 + k * 5, 4 - k * 0.6, 2.6, 1.8, 'sm', { flat: 0.6, glow: true });
  }
  return s.render({ outline: 2 });
}

/** Its wreck: swamped, the three hulls under, only the hōren's gilt roof, a banner and the sakaki above the water. */
function gozaWreck() {
  const s = new HiSprite(48, 84, RAMPS);
  const c = 24;
  s.paint([c - 22, 8, c + 22, 80], (x, y) => ((x - c) / 21) ** 2 + ((y - 44) / 34) ** 2 < 1, 'wa', (x, y) => 0.35 + Math.sin(x * 0.8 + y * 0.6) * 0.1, { pat: mottle({ amt: 0.2, scale: 3, seed: 31 }) });
  for (const hx of [-14, 0, 14]) s.paint([c + hx - 6, 14, c + hx + 6, 76], (x, y) => Math.abs(x - c - hx) < 5.4 - Math.max(0, y - 62) * 0.3 && y > 15 && y < 75, 'hl', () => 0.25); // (the hulls dark under the water)
  s.paint([c - 9, 20, c + 9, 40], (x, y) => Math.abs(x - c) < 8.4 && y > 21 && y < 39, 'gd', (x) => 0.45 - (x - c) * 0.02);
  s.line(c, 22, c, 38, 0x6a4a10, 1);
  for (let k = 0; k < 5; k++) s.dot(c - 12 + k * 6, 54 + (k % 2) * 6, 1, 0xe8f8ff, 0.7); // (bubbles)
  s.paint([c + 10, 52, c + 16, 58], (x, y) => x > c + 10.5 && x < c + 15 && y > 52.5 && y < 57, 'wt', () => 0.5); // a banner afloat
  s.ellipse(c - 15, 60, 1.6, 1.6, 'sk', { flat: 0.5 });
  for (let k = 0; k < 2; k++) s.ellipse(c - 18 + k * 34, 30 + k * 18, 1.2, 1, 'ld', { flat: 0.5 });
  return s.render({ outline: 2 });
}

export function hiroshimaNewFoes(add) {
  add('hr_kaki_0', line(0));
  add('hr_kaki_1', line1());
  for (let f = 0; f < 2; f++) add(`hr_kaki_eye_${f}`, line('eye', f));
  for (let f = 0; f < 2; f++) add(`hr_kaki_lit_${f}`, line('lit', f));
  add('hr_kaki_burnt', line('burnt'));
  add('hr_float', float());
  for (let f = 0; f < 4; f++) add(`hr_kendama_${f}`, kendama(f));
  for (let f = 0; f < 2; f++) add(`hr_ken_${f}`, kenOne(f));
  for (let f = 0; f < 2; f++) add(`hr_tama_${f}`, tamaOne(f));
  for (let st = 0; st < 4; st++) for (let f = 0; f < 2; f++) add(`hr_goza_${st}_${f}`, goza(st, f));
  add('hr_goza_wreck', gozaWreck());
}
