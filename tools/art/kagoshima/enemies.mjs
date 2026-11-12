// Kagoshima's enemies at 540 px (docs/enemies-540-plan.md): Sakurajima's volcanic bombs, crusted black and
// split by glowing seams; a drone carrying a tanegashima matchlock (lacquered stock, iron barrel, the slow
// match smouldering); the black-vinegar jars of Fukuyama in their fields, glazed dark brown under straw caps;
// the garappa, Kagoshima's kappa, its water dish, shell and beak; shirokuma, the shaved ice of Tenmonkan,
// milk-soaked, its bear face laid in fruit, melting; Raijū the thunder beast as the old scrolls draw it, a
// wolfish blue-black body in a mane of lightning; and the volcano itself, its vents and summit crater.
// Every frame is three times the old one's size (old mask coordinate m -> fine (m + 1) * 3).
import { HiSprite, tones, fur, speckle, crackle, mottle, mix2 } from '../../lib/hisprite.mjs';
import { breakOpen, lightning } from '../breakopen.mjs';
import * as V from './volcano540.mjs';

const INK = 0x14101c;
const TAU = Math.PI * 2;
const M = (m) => (m + 1) * 3;
const RAMPS = {
  x: tones([0x14100e, 0x2e2622, 0x524640]), // lava crust, basalt
  e: tones([0x3a3432, 0x5e5654, 0x8a807c]), // cooled rock, ash
  f: [0xa02a00, 0xff5a10, 0xff9a20, 0xffd060, 0xfff4c0], // molten lava
  g: tones([0x1a0e08, 0x3a2216, 0x6a4430]), // black-vinegar glaze
  G2: [0x140a06, 0x3a2010, 0x6a3a1a, 0xa0622a, 0xd8a060], // the jars' amber-brown glaze
  t: tones([0x8a6a2a, 0xc8a050, 0xf0d890]), // straw
  z: tones([0x24502a, 0x3e7e3a, 0x7ab060]), // kappa green
  s: tones([0x4a3a1c, 0x7a6030, 0xb09450]), // its shell
  h: tones([0xa8b0c0, 0xe8ecf4, 0xffffff]), // shaved ice
  m: tones([0xc8b890, 0xf0e8d0, 0xffffff]), // condensed milk
  b: tones([0x101a3a, 0x203a7a, 0x4a72c0]), // Raijū's blue-black
  n: tones([0x5a3018, 0x8a5428, 0xc08a50]), // stock wood
  l: tones([0x7a1420, 0xc83a4a, 0xf08a96]), // ear hollows
  y: [0x9a5a00, 0xe8a800, 0xffe040, 0xfff8a0, 0xffffff], // lightning
};

// ---------------------------------------------------------------- popcorn: a volcanic bomb (13 -> 39), and its halves (9 -> 27)
export function kazan(r, f, size) {
  const s = new HiSprite(size, size, RAMPS);
  const c = size / 2;
  const R = r * 3;
  // a rough lump: a lumpy outline, the crust breadcrusted by seams of glowing lava
  const lump = (x, y) => {
    const a = Math.atan2(y - c, x - c);
    return Math.hypot(x - c, y - c) < R * (0.92 + 0.08 * Math.sin(a * 5 + 1) + 0.05 * Math.sin(a * 9));
  };
  s.paint([0, 0, size, size], lump, 'x', (x, y) => 0.36 + 0.5 * Math.max(0, 1 - Math.hypot(x - c + R * 0.35, y - c + R * 0.35) / (R * 1.6)), { pat: mix2(speckle({ amt: 0.25, dark: 0.12, light: 0.06 }), mottle({ amt: 0.12, scale: 4 })) });
  // the seams: a network of cracks glowing from inside, turning with the frames
  s.paint([0, 0, size, size], (x, y) => {
    if (!lump(x, y)) return false;
    const a = Math.atan2(y - c, x - c) - f * 0.7;
    const d = Math.hypot(x - c, y - c) / R;
    return Math.abs(Math.sin(a * 3 + d * 2.2)) < 0.12 + (1 - d) * 0.12 || d < 0.22;
  }, 'f', (x, y) => 0.85 - Math.hypot(x - c, y - c) / (R * 1.6), { glow: true });
  s.dot(c, c, R * 0.12 + 0.5, 0xfff4c0);
  return s.render();
}

// ---------------------------------------------------------------- shooter: a drone carrying a tanegashima matchlock (17 x 21 -> 51 x 63), aiming down
export function teppo(f) {
  const s = new HiSprite(51, 63, RAMPS);
  const cx = 25.5;
  // four rotors, a blur of blades
  for (const [x, y] of [[2, 3], [12, 3], [2, 11], [12, 11]]) {
    const X = M(x) + 1.5;
    const Y = M(y) + 1.5;
    s.tube(X, Y, cx, M(7) + 1.5, 1.4, 'S');
    s.ellipse(X, Y, 7, 7, 'S', { flat: 0.4 });
    s.ellipse(X, Y, 2, 2, 'K', { flat: 0.4 });
    const a = f * 1.1 + x;
    s.line(X - Math.cos(a) * 6.5, Y - Math.sin(a) * 6.5, X + Math.cos(a) * 6.5, Y + Math.sin(a) * 6.5, 0xd8dcf0, 1, 0.75);
  }
  // the hub, black lacquer, the red maru crest
  s.ellipse(cx, 24, 13, 13, 'K', { pat: speckle({ amt: 0.12 }) });
  s.ellipse(cx, 24, 5, 5, 'R', { bias: 0.05 });
  s.dot(cx - 3, 20, 1.2, 0xffffff, 0.8);
  // the gun: the wooden stock up top with its brass fittings, the long octagonal iron barrel down at the player
  s.poly([[cx - 4.5, 2], [cx + 4.5, 2], [cx + 3.5, 18], [cx - 3.5, 18]], 'n', { flat: 0.58, pat: fur(Math.PI / 2, { amt: 0.2, len: 8, w: 1.2 }) });
  s.tube(cx, 18, cx, 57, 2, 'D', { rb: 1.7 });
  for (const y of [8, 14, 30, 44]) s.line(cx - 2.8, y, cx + 2.8, y, 0xe2aa32, 1);
  s.dot(cx, 58, 1.3, INK);
  s.dot(cx + 3.5, 15, 1.3, 0xe2aa32); // the pan and serpentine
  // the slow match, smouldering, a thread of smoke
  s.line(cx + 4, 13, cx + 8, 9, 0x8a6a3a, 1);
  s.dot(cx + 8.5, 8.5, 1.1, f ? 0xffd060 : 0xff5a10);
  for (let k = 0; k < 5; k++) s.px(cx + 9 + Math.sin(k + f * 2) * 1.2, 7 - k * 1.4, 0xc8c8d0, 0.6 - k * 0.1);
  return s.render();
}

// ---------------------------------------------------------------- turret: a black-vinegar jar (base 19 -> 57), its straw cap (15 -> 45)
export function tsuboBase(wreck) {
  const s = new HiSprite(57, 57, RAMPS);
  const c = 28.5;
  const glaze = { pat: mix2(mottle({ amt: 0.18, scale: 6 }), speckle({ amt: 0.12, dark: 0.04, light: 0.04 })) };
  if (!wreck) {
    // the jar from above, set in the earth of the field: a ring of soil and straw round it; the glazed shoulder,
    // warm amber-brown running to near-black, glossy, drips of a paler glaze running down it, a broad reflection of
    // the sky on the side towards the light; the raised neck ring, the mouth with the vinegar dark in it
    s.ellipse(c, c, 26, 26, 'e', { flat: 0.4, pat: mix2(speckle({ amt: 0.3, dark: 0.15, light: 0.1 }), fur((x, y) => Math.atan2(y - c, x - c) + 1.5, { amt: 0.2, len: 3, w: 1 })) });
    s.paint([c - 23, c - 23, c + 23, c + 23], (x, y) => Math.hypot(x - c, y - c) < 22.5, 'G2', (x, y) => {
      const nx = (x - c) / 22.5;
      const ny = (y - c) / 22.5;
      const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      return 0.22 + 0.62 * Math.max(0, -nx * 0.5 - ny * 0.62 + nz * 0.6);
    }, glaze);
    // a few runs of paler glaze spilled down from the neck, uneven
    for (const [a, len] of [[0.5, 6], [1.7, 3.5], [2.6, 7], [4.1, 4.5], [5.3, 5.5]]) {
      let px = c + Math.cos(a) * 12.5;
      let py = c + Math.sin(a) * 12.5;
      for (let t = 1; t <= len; t++) {
        const r = 12.5 + t;
        const nx = c + Math.cos(a + Math.sin(t * 1.3 + a) * 0.06) * r;
        const ny = c + Math.sin(a + Math.sin(t * 1.3 + a) * 0.06) * r;
        s.tube(px, py, nx, ny, 1.5 - t / (len * 1.6), 'G2', { bias: 0.18 });
        px = nx;
        py = ny;
      }
      s.dot(px, py, 1.3, 0xc08a50, 0.9);
    }
    // the sky's reflection: a soft arc of light, a hard glint
    for (let a = -2.6; a < -1.0; a += 0.02) for (let r = 15; r < 19; r += 1) s.px(c + Math.cos(a) * r, c + Math.sin(a) * r, 0xf0d8b0, 0.22 + (1 - Math.abs(a + 1.8)) * 0.3);
    s.dot(c - 9, c - 13, 1.6, 0xffffff, 0.9);
    s.ellipse(c, c, 12.5, 12.5, 'G2', { bias: 0.14, ...glaze });
    for (let a = 0; a < TAU; a += 0.03) s.px(c + Math.cos(a) * 12.5, c + Math.sin(a) * 12.5, 0x2a1408, 0.8);
    s.ellipse(c, c, 9.5, 9.5, 'K', { flat: 0.12 });
    s.ellipse(c + 1, c + 1, 7.6, 7.6, 'x', { flat: 0.22, pat: mottle({ amt: 0.2, scale: 3 }) });
    s.line(c - 4, c - 3, c + 1, c - 5, 0xb07a40, 1, 0.8);
  } else {
    // smashed: shards of glaze, the spilt vinegar, a bit of the straw cap
    s.ellipse(c, c + 2, 20, 16, 'x', { flat: 0.25, pat: mottle({ amt: 0.2 }) });
    for (const [x, y, r] of [[M(5), M(6), 9], [M(11), M(5), 7.5], [M(9), M(11), 9.6], [M(4), M(12), 6]]) {
      s.poly([[x - r, y], [x - r * 0.2, y - r * 0.9], [x + r, y - r * 0.3], [x + r * 0.5, y + r * 0.8], [x - r * 0.6, y + r * 0.7]], 'g', { ball: [x, y, r, r], ...glaze });
    }
    s.poly([[39, 3], [48, 6], [45, 13], [37, 10]], 't', { flat: 0.6, pat: fur(0.4, { amt: 0.25, len: 4, w: 1 }) });
  }
  return s.render();
}

export function tsuboLid(open) {
  const s = new HiSprite(45, 45, RAMPS);
  const o = open ? M(3.5) - 1.5 : 22.5;
  // a woven straw cap, its strands spiralling in, tied at the top
  s.ellipse(o, o, 14, 14, 't', { pat: mix2(fur((x, y) => Math.atan2(y - o, x - o) + Math.PI / 2, { amt: 0.3, len: 5, w: 1.6, gap: 0.1 }), speckle({ amt: 0.1 })) });
  for (let r = 4; r < 14; r += 3.5) for (let a = 0; a < TAU; a += 0.05) s.px(o + Math.cos(a) * r, o + Math.sin(a) * r, 0x8a6a2a, 0.55);
  s.ellipse(o, o, 4.6, 4.6, 'n', { bias: 0.05 });
  s.line(o - 3, o, o + 3, o, 0x5a3018, 1);
  return s.render();
}

// ---------------------------------------------------------------- diver: the garappa (17 x 19 -> 51 x 57), head down, and its ripples (19 x 13 -> 57 x 39)
export function kappa(f) {
  const s = new HiSprite(51, 57, RAMPS);
  const cx = 25.5;
  const skin = { pat: mix2(speckle({ amt: 0.16, dark: 0.06, light: 0.04 }), mottle({ amt: 0.12, scale: 5 })) };
  // limbs splayed, webbed hands and feet, kicking
  for (const [x, y, dx] of [[2, 5, -1], [12, 5, 1], [3, 12, -1], [11, 12, 1]]) {
    const ex = M(x + (f ? dx : 0)) + 1.5;
    const ey = M(y + (f ? -1 : 1)) + 1.5;
    s.tube(cx + Math.sign(dx) * 6, M(y) + 1.5, ex, ey, 2.4, 'z', { rb: 2, ...skin });
    for (let k = -1; k <= 1; k++) {
      const a = Math.atan2(ey - M(y) - 1.5, ex - cx) + k * 0.5;
      s.line(ex, ey, ex + Math.cos(a) * 5, ey + Math.sin(a) * 5, 0x24502a, 1);
    }
    s.ellipse(ex + Math.sign(dx) * 2, ey, 3.4, 3.4, 'z', { flat: 0.5 });
  }
  // the shell on its back: a plastron of hexagonal plates, a pale rim
  s.ellipse(cx, 27, 14, 16.5, 's', { pat: speckle({ amt: 0.14, dark: 0.05 }) });
  for (const [x, y] of [[0, -9], [-6, -3], [6, -3], [0, 3], [-6, 9], [6, 9], [0, 14]]) {
    const X = cx + x;
    const Y = 27 + y;
    const hex = [0, 1, 2, 3, 4, 5].map((k) => [X + Math.cos((k / 6) * TAU) * 3.6, Y + Math.sin((k / 6) * TAU) * 3.2]);
    for (let k = 0; k < 6; k++) s.line(hex[k][0], hex[k][1], hex[(k + 1) % 6][0], hex[(k + 1) % 6][1], 0x3a2c14, 1);
    s.px(X - 1, Y - 1, 0xc8aa60);
  }
  for (let a = 0; a < TAU; a += 0.03) s.px(cx + Math.cos(a) * 13.5, 27 + Math.sin(a) * 16, 0xb09450);
  // the head: green, the fringe of dark hair round the dish of water on its crown, the yellow beak, round eyes
  s.ellipse(cx, 42.5, 9.5, 8, 'z', { bias: 0.04, ...skin });
  for (let a = Math.PI * 0.9; a < Math.PI * 2.1; a += 0.1) s.line(cx + Math.cos(a) * 6, 40.5 + Math.sin(a) * 4.5, cx + Math.cos(a) * 8.5, 40.5 + Math.sin(a) * 6.5, 0x101a10, 1);
  s.ellipse(cx, 40, 5.6, 4.2, 'h', { flat: 0.6 });
  s.ellipse(cx, 40, 4.2, 3, 'C', { flat: 0.55 });
  s.dot(cx - 1.5, 39, 1, 0xffffff);
  for (const sx of [-1, 1]) {
    s.dot(cx + sx * 4.6, 45, 1.7, 0xfff4c0);
    s.dot(cx + sx * 4.6, 45.4, 1, INK);
  }
  s.poly([[cx - 3.5, 47.5], [cx + 3.5, 47.5], [cx + 2, 51], [cx, 52.5], [cx - 2, 51]], 'Y', { flat: 0.65 });
  s.line(cx - 2.5, 49.5, cx + 2.5, 49.5, 0x9a5f10, 1);
  return s.render();
}

export function ripple(i) {
  const s = new HiSprite(57, 39, RAMPS);
  const r = [4, 6, 8][i] * 3;
  for (let a = 0; a < TAU; a += 0.012) s.px(28.5 + Math.cos(a) * r, 19.5 + Math.sin(a) * r * 0.55, 0xc8dce0, 0.85 - i * 0.22);
  for (let a = 0; a < TAU; a += 0.016) s.px(28.5 + Math.cos(a) * r * 0.55, 19.5 + Math.sin(a) * r * 0.32, 0xe8f4f4, 0.65 - i * 0.16);
  // something dark and green under the surface
  if (i < 2) for (let a = 0; a < TAU; a += 0.05) for (let rr = 0; rr < 5; rr += 1) s.px(28.5 + Math.cos(a) * rr, 19.5 + Math.sin(a) * rr * 0.7, 0x24502a, 0.18);
  return s.render({ outline: 0 });
}

// ---------------------------------------------------------------- carrier: shirokuma, the shaved ice (19 -> 57), three stages of melting
const NOSE = { red: 0xd8203a, blue: 0x3a72f0, green: 0x37b35a };
export function shirokuma(color, melt) {
  const s = new HiSprite(57, 57, RAMPS);
  const c = 28.5;
  // the glass bowl, a puddle of milk spreading in it as the ice melts
  s.ellipse(c, c + 2, 24, 22, 'C', { flat: 0.55 });
  s.ellipse(c, c + 2, 21, 19, 'm', { flat: 0.6 + melt * 0.04, pat: mottle({ amt: 0.1, scale: 6 }) });
  for (let a = 0; a < TAU; a += 0.03) s.px(c + Math.cos(a) * 23, c + 2 + Math.sin(a) * 21, 0xc8fbff, 0.7);
  s.dot(c - 15, c - 10, 1.6, 0xffffff);
  // the mound of shaved ice soaked in condensed milk, sinking
  const r = 18 - melt * 4.5;
  s.ellipse(c, c, r, r * 0.95, 'h', { bias: 0.04, pat: mix2(speckle({ amt: 0.2, dark: 0.05, light: 0.18, seed: 3 }), mottle({ amt: 0.1, scale: 4 })) });
  for (let k = 0; k < 14; k++) s.px(c + Math.cos(k * 2.4) * r * 0.7, c + Math.sin(k * 2.4) * r * 0.66, 0xe8dcc0, 0.8);
  // the bear's face in fruit: mandarin ears, raisin eyes, a cherry nose (the colour of its weapon), azuki mouth,
  // melon and pineapple round the edge
  if (melt < 2) {
    for (const sx of [-1, 1]) {
      s.ellipse(c + sx * r * 0.68, c - r * 0.66, 4.4, 4, 'Q', { pat: fur(sx * 0.6, { amt: 0.2, len: 2, w: 1 }) });
      s.line(c + sx * r * 0.68 - 3, c - r * 0.66, c + sx * r * 0.68 + 3, c - r * 0.66, 0xffc070, 1);
    }
    for (const [x, y, col] of [[-0.85, 0.3, 0x8aca50], [0.85, 0.3, 0xf0d040], [-0.45, 0.8, 0xf0d040], [0.5, 0.78, 0x8aca50]]) s.dot(c + x * r, c + y * r, 2.4 - melt * 0.6, col);
  }
  for (const sx of [-1, 1]) s.ellipse(c + sx * (5.5 - melt), c - 3 + melt, 2, 1.6, 'x', { flat: 0.4 });
  s.ellipse(c, c + 2 + melt, 3.6, 3.6, 'R', { flat: 0.5 });
  s.dot(c, c + 2 + melt, 3.2, NOSE[color]);
  s.dot(c - 1, c + 1 + melt, 1, 0xffffff);
  s.line(c, c + 6 + melt, c, c + 9 + melt, 0x6a1a14, 1);
  s.line(c - 3, c + 10 + melt, c + 3, c + 10 + melt, 0x6a1a14, 1);
  // a sprig of mint on top
  s.line(c - 2, c - r + 2, c + 2, c - r + 4, 0x37b35a, 1);
  return s.render();
}

// ---------------------------------------------------------------- heavy: Raijū, the thunder beast (51 x 48 -> 153 x 144)
export function raiju(f) {
  const s = new HiSprite(153, 144, RAMPS);
  const cx = M(24.5);
  const pelt = { pat: mix2(fur((x, y) => Math.atan2(y - 66, x - cx) + Math.PI / 2 * 0, { amt: 0.3, len: 6, w: 1.5, gap: 0.12, seed: 3 }), speckle({ amt: 0.1, dark: 0.05 })) };
  // the zigzag lightning tail rising behind one shoulder
  let tx = cx + 33;
  let prev = [tx, M(30)];
  for (let y = M(30); y >= 2; y -= 3) {
    tx += (Math.floor((y / 3 + f * 2) / 4) % 2 ? 1 : -1) * 3.9 + 0.75;
    s.tube(prev[0], prev[1], tx, y, 3.2, 'y', { glow: true });
    prev = [tx, y];
  }
  // the mane: forks of lightning branching out all round the head
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * TAU + f * 0.2;
    const len = (16 + ((k + f) % 3) * 2.5) * 3;
    let px = cx;
    let py = M(21);
    for (let j = 0; j < len; j += 3) {
      const nx = px + Math.cos(a) * 3 + (j % 9 === 3 ? Math.cos(a + 1.6) * 2.4 : j % 9 === 6 ? -Math.cos(a + 1.6) * 2.4 : 0);
      const ny = py + Math.sin(a) * 2.7;
      s.tube(px, py, nx, ny, j > len - 9 ? 1.8 : 3.2, 'y', { glow: true });
      if (j === 36 && k % 2) s.tube(nx, ny, nx + Math.cos(a + 0.8) * 12, ny + Math.sin(a + 0.8) * 12, 1.6, 'y', { glow: true });
      px = nx;
      py = ny;
    }
  }
  // the shoulders and the two front legs, claws out
  s.ellipse(cx, M(34), 42, 22, 'b', pelt);
  for (const sx of [-1, 1]) {
    const lx = cx + sx * 24;
    s.tube(lx, M(34), lx + sx * 2, M(42) + (f % 2) * 3, 8, 'b', { rb: 7, ...pelt });
    for (const d of [-5, 0, 5]) s.poly([[lx + sx * 2 + d - 1.5, M(43) + (f % 2) * 3], [lx + sx * 2 + d + 1.5, M(43) + (f % 2) * 3], [lx + sx * 2 + d, M(45) + (f % 2) * 3]], 'W', { flat: 0.85 });
    // the lightning in its fur
    s.line(lx - sx * 4, M(33), lx + sx * 3, M(37), 0x9af4ff, 1);
  }
  // the head: a wolf's, long pointed ears, slanted glowing eyes, the pale snout, fangs bared
  for (const sx of [-1, 1]) {
    s.poly([[cx + sx * 12, M(16)], [cx + sx * 33, M(3)], [cx + sx * 27, M(19)]], 'b', { ball: [cx + sx * 24, M(11), 12, 18], ...pelt });
    s.poly([[cx + sx * 16, M(15)], [cx + sx * 29, M(6)], [cx + sx * 25, M(16)]], 'l', { flat: 0.45 });
  }
  s.ellipse(cx, M(21), 31, 27, 'b', pelt);
  for (const sx of [-1, 1]) s.poly([[cx + sx * 26, M(20)], [cx + sx * 38, M(24)], [cx + sx * 27, M(27)]], 'b', { flat: 0.45, ...pelt }); // cheek ruffs
  s.ellipse(cx, M(26), 14, 11, 'C', { bias: 0.04, pat: fur(Math.PI / 2, { amt: 0.18, len: 3, w: 1.2 }) });
  for (const sx of [-1, 1]) {
    s.poly([[cx + sx * 6, M(19.5)], [cx + sx * 17, M(17)], [cx + sx * 15, M(20.5)]], 'y', { glow: true, flat: 0.8 });
    s.dot(cx + sx * 11, M(19.2), 1.3, 0xffffff);
    s.line(cx + sx * 4, M(17), cx + sx * 17, M(14.5), INK, 2); // the brow
  }
  s.ellipse(cx, M(23.8), 4.6, 3, 'K', { bias: 0.1 });
  s.line(cx - 10, M(28), cx + 10, M(28), INK, 2);
  for (const sx of [-1, 1]) s.poly([[cx + sx * 7, M(28)], [cx + sx * 3.5, M(28)], [cx + sx * 5.5, M(30.5)]], 'W', { flat: 0.85 });
  // stray sparks (put on after the outline: outlined, they were dark dots)
  const r = s.render();
  for (let k = 0; k < 6; k++) {
    const x = ((k * 13 + f * 7) % 49) * 3 + 3;
    const y = ((k * 7 + f * 5) % 46) * 3 + 3;
    r.set(x, y, 0xffffff);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) r.set(x + dx, y + dy, 0x9af4ff, 0.8);
  }
  return r;
}

// ---------------------------------------------------------------- boss: Sakurajima's side vents (23 -> 69) and summit crater (47 x 35 -> 141 x 105)
export function vent(f, dead) {
  const s = new HiSprite(69, 69, RAMPS);
  const c = 34.5;
  const rock = { pat: mix2(speckle({ amt: 0.3, dark: 0.14, light: 0.06, seed: 7 }), mottle({ amt: 0.15, scale: 6 })) };
  // a cone of black scoria, its flanks ribbed by old flows
  s.ellipse(c, c, 31, 31, 'e', rock);
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * TAU;
    s.line(c + Math.cos(a) * 21, c + Math.sin(a) * 21, c + Math.cos(a + 0.12) * 30, c + Math.sin(a + 0.12) * 30, 0x3a3432, 1);
  }
  s.ellipse(c, c, 22, 22, 'x', { ...rock, bias: 0.05 });
  if (!dead) {
    // the throat full of lava, a crust floating on it and breaking
    s.ellipse(c, c, 17, 17, 'f', { glow: true, flat: 0.5, pat: mottle({ amt: 0.25, scale: 5, seed: 3 + f }) });
    for (const [x, y] of f ? [[-5, -3], [6, 4], [0, 8], [-7, 7]] : [[4, -6], [-6, 6], [9, 1], [1, 3]]) s.ellipse(c + x, c + y, 3.4, 2.4, 'x', { flat: 0.35 });
    s.ellipse(c, c, 6, 6, 'f', { glow: true, flat: 0.92 });
    for (let a = 0; a < TAU; a += 0.04) s.px(c + Math.cos(a) * 17.5, c + Math.sin(a) * 17.5, 0xffd060, 0.8);
  } else {
    s.ellipse(c, c, 17, 17, 'x', { flat: 0.3, pat: crackle({ amt: 0.25, scale: 6 }) });
    s.dot(c + 3, c - 2, 1.4, 0xff5a10, 0.8);
    for (let k = 0; k < 6; k++) s.px(c - 4 + k * 1.6, c - 12 - (k % 2) * 2, 0xb0aaa8, 0.5);
  }
  return s.render();
}

export function crater(state, f) {
  const s = new HiSprite(141, 105, RAMPS);
  const cx = 70.5;
  const cy = 52.5;
  const rock = { pat: mix2(speckle({ amt: 0.32, dark: 0.14, light: 0.06, seed: 11 }), mottle({ amt: 0.16, scale: 9 })) };
  // the summit's rim, gullied by ash, sulphur-yellow staining in patches
  s.ellipse(cx, cy, 67, 49, 'e', rock);
  for (let k = 0; k < 22; k++) {
    const a = (k / 22) * TAU + (k % 3) * 0.05;
    s.line(cx + Math.cos(a) * 54, cy + Math.sin(a) * 39, cx + Math.cos(a + 0.05) * 66, cy + Math.sin(a + 0.05) * 48, 0x3a3432, 1);
  }
  for (const [x, y] of [[-40, -20], [44, 12], [-20, 34], [30, -32]]) s.ellipse(cx + x, cy + y, 6, 4, 'Y', { flat: 0.42, pat: speckle({ amt: 0.3, dark: 0.3 }) });
  s.ellipse(cx, cy, 52, 37, 'x', { ...rock, bias: -0.02 });
  if (state === 'open') {
    // the lava lake, a fountain at its heart, crusts drifting, bursting bubbles
    s.ellipse(cx, cy, 45, 31, 'f', { glow: true, flat: 0.48, pat: mottle({ amt: 0.25, scale: 8, seed: 5 + f }) });
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * TAU + f * 0.35;
      s.poly([[cx + Math.cos(a) * 30, cy + Math.sin(a) * 20], [cx + Math.cos(a + 0.2) * 38, cy + Math.sin(a + 0.2) * 25], [cx + Math.cos(a + 0.35) * 31, cy + Math.sin(a + 0.35) * 21]], 'x', { flat: 0.35 });
    }
    s.ellipse(cx, cy, 24, 16.5, 'f', { glow: true, flat: 0.78 });
    s.ellipse(cx, cy, 11, 7.5, 'f', { glow: true, flat: 0.98 });
    for (const [x, y] of f ? [[14, 12], [30, 20], [25, 9], [17, 21]] : [[16, 18], [28, 12], [20, 10], [31, 17]]) {
      s.dot(M(x) + 1.5, M(y) + 1.5, 4.5, 0xff9a20);
      s.dot(M(x) + 1.5, M(y) + 1.5, 2, 0xfff4c0);
    }
    for (let a = 0; a < TAU; a += 0.02) s.px(cx + Math.cos(a) * 45.5, cy + Math.sin(a) * 31.5, 0xffd060, 0.8);
  } else if (state === 'shut') {
    // plugged by a dome of crust, cracks glowing
    s.ellipse(cx, cy, 45, 31, 'x', { bias: 0.06, pat: mix2(speckle({ amt: 0.28, dark: 0.1 }), crackle({ amt: 0.2, scale: 8 })) });
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * TAU + 0.3;
      let px = cx;
      let py = cy;
      for (let j = 1; j <= 9; j++) {
        const nx = cx + Math.cos(a + Math.sin(j * 1.7 + k) * 0.08) * 5 * j;
        const ny = cy + Math.sin(a + Math.sin(j * 1.7 + k) * 0.08) * 3.4 * j;
        s.tube(px, py, nx, ny, j < 4 ? 1.6 : 1, 'f', { glow: true });
        px = nx;
        py = ny;
      }
    }
    s.ellipse(cx, cy, 5, 3.5, 'f', { glow: true, flat: 0.85 });
  } else {
    // cold: grey crust, a wisp of steam, nothing left glowing
    s.ellipse(cx, cy, 45, 31, 'e', { flat: 0.42, pat: mix2(crackle({ amt: 0.25, scale: 8 }), speckle({ amt: 0.2 })) });
    for (const [x, y] of [[18, 12], [26, 18], [22, 15]]) s.ellipse(M(x), M(y), 4, 3, 'x', { flat: 0.3 });
  }
  return s.render();
}

export function kagoshimaEnemies(add) {
  for (let f = 0; f < 4; f++) {
    add(`kazan_${f}`, kazan(5, f, 39));
    add(`kazan_s_${f}`, kazan(2.8, f, 27));
    add(`teppo_${f}`, teppo(f));
    add(`kappa_${f}`, kappa(f % 2 === 0 ? 0 : 1));
    add(`raiju_${f}`, raiju(f));
  }
  for (let i = 0; i < 3; i++) add(`ripple_${i}`, ripple(i));
  add('tsubo_base', tsuboBase(false));
  add('tsubo_wreck', tsuboBase(true));
  add('tsubo_lid_0', tsuboLid(false));
  add('tsubo_lid_1', tsuboLid(true));
  for (const c of ['red', 'blue', 'green']) for (let k = 0; k < 3; k++) add(`shirokuma_${c}_${k}`, shirokuma(c, k));
  add('vent_0', V.vent(0, false));
  add('vent_1', V.vent(1, false));
  add('vent_dead', V.vent(0, true));
  add('crater_shut', V.crater('shut', 0));
  add('crater_0', V.crater('open', 0));
  add('crater_1', V.crater('open', 1));
  add('crater_cold', V.crater('cold', 0));
  // step 2a: the crater's crust breaking open as the second phase begins; lightning crackling in Raijū's fur
  const shut = V.crater('shut', 0);
  const open = V.crater('open', 0);
  [0.15, 0.4, 0.62, 0.85].forEach((k, i) => add(`crater_open_${i}`, breakOpen(shut, open, k, { seed: 512, cells: 34, centre: [0.5, 0.45], seam: 0xff6a10, lip: 0xffd080 })));
  for (let f = 0; f < 4; f++) add(`raiju_spark_${f}`, lightning(raiju(0), f, { arcs: 5, seed: 31 }));
}
export const KAGOSHIMA_PORTRAITS = ['kappa_0', 'raiju_0', 'vent_0', 'crater_0'];
