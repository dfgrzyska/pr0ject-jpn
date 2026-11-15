// Random encounter 6 (ex6): the grandma. A short, stout Osaka grandma: a tight purple perm, round gold glasses, red
// lipstick, pearls; a black blouse with a huge tiger's face printed on the front, leopard-print trousers, a handbag
// on her arm, sweets in her pockets for everyone. One puppet drawn in many poses (baba(pose, bare)); in phase 3 the
// tiger comes off her blouse (bare: a tiger-shaped gap left on it) and hunts on its own (tora(pose)). Her wrapped
// sweets, the shopping trolley, and what shows an attack coming in the snow: paw prints, wheel ruts.
import { HiSprite, tones, fur, speckle, mix2 } from '../../lib/hisprite.mjs';
import { Raster } from '../../lib/raster.mjs';

const INK = 0x14101c;
const SKIN_LINE = 0x9a5a40;
const GOLD = 0xe0c060;
const RAMPS = {
  v: tones([0x4a1a6a, 0x8a3ac0, 0xd09af0]), // the perm, purple
  f: tones([0xa86a4a, 0xe8b48e, 0xffe0c8]), // skin
  k: tones([0x141218, 0x2a2830, 0x4a4852]), // the blouse, black
  a: tones([0x141218, 0x2a2830, 0x4a4852]), // its sleeves (a seam where they lie on the blouse)
  t: tones([0x9a4a08, 0xf08a1a, 0xffc070]), // the tiger, orange
  w: tones([0x9a948a, 0xeae6de, 0xffffff]), // white
  b: tones([0x4a2a18, 0x8a5430, 0xc8885a]), // the handbag
  l: tones([0x8a5a20, 0xd8a040, 0xf8d888]), // the trousers: leopard print
  s: tones([0x5a5a64, 0xb8bac4, 0xf4f6ff]), // the trolley's steel
  r: tones([0x7a1418, 0xd02a26, 0xff7a5e]), // sweets, lipstick
  y: tones([0x8a6a10, 0xe0b830, 0xfff0a0]),
  g: tones([0x1a5a2a, 0x3a9a4a, 0x8ad88a]),
  p: tones([0x7a2a5a, 0xd05a9a, 0xffa8d0]),
};
const furry = (seed) => ({ pat: mix2(fur(Math.PI / 2, { amt: 0.16, len: 6, w: 1.4, gap: 0.05, seed }), speckle({ amt: 0.04 })) });
const hsh = (x, y) => {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
function fillE(s, cx, cy, rx, ry, c, a = 1) {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) s.px(x, y, c, a);
}
function path(s, pts, c, w = 2) {
  for (let i = 1; i < pts.length; i++) s.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], c, w);
}

/**
 * A tiger's face, front on (on the blouse, or the tiger's own): at (cx, cy), size r. mood: 0 calm, 1 snarling,
 * 2 roaring (jaws wide), 'blink', 'lick'.
 */
function tigerFace(s, cx, cy, r, mood = 0) {
  const lw = Math.max(1, Math.round(r / 9));
  const angry = mood === 1 || mood === 2;
  for (const sx of [-1, 1]) {
    s.ellipse(cx + sx * r * 0.72, cy - r * 0.72, r * 0.3, r * 0.3, 't', { flat: 0.55 });
    fillE(s, cx + sx * r * 0.72, cy - r * 0.68, r * 0.15, r * 0.16, 0xffc8b0);
  }
  s.ellipse(cx, cy, r, r * 0.86, 't', { bias: 0.05, ...furry(3) });
  // the white of the cheeks, the muzzle, over the eyes
  for (const sx of [-1, 1]) s.ellipse(cx + sx * r * 0.62, cy + r * 0.3, r * 0.34, r * 0.3, 'w', { flat: 0.8 });
  s.ellipse(cx, cy + r * 0.42, r * 0.56, r * 0.36, 'w', { flat: 0.86 });
  for (const sx of [-1, 1]) s.ellipse(cx + sx * r * 0.36, cy - r * 0.32, r * 0.2, r * 0.1, 'w', { flat: 0.8 });
  // the stripes: the 王 of the brow, flames down the cheeks
  for (let k = -1; k <= 1; k++) s.line(cx + k * r * 0.2, cy - r * 0.84, cx + k * r * 0.24, cy - r * 0.5, INK, lw);
  s.line(cx - r * 0.3, cy - r * 0.62, cx + r * 0.3, cy - r * 0.62, INK, lw);
  for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) {
    const y0 = cy - r * 0.24 + k * r * 0.24;
    s.poly([[cx + sx * r * 0.99, y0 - r * 0.06], [cx + sx * r * 0.99, y0 + r * 0.07], [cx + sx * r * 0.58, y0 + r * 0.08]], 'k', { flat: 0.1 });
  }
  // eyes
  for (const sx of [-1, 1]) {
    const ex = cx + sx * r * 0.36;
    const ey = cy - r * 0.12;
    if (mood === 'blink') s.line(ex - r * 0.16, ey, ex + r * 0.16, ey, INK, lw);
    else {
      s.ellipse(ex, ey, r * 0.18, r * (angry ? 0.1 : 0.15), 'y', { flat: 0.95, glow: true });
      fillE(s, ex, ey, r * (angry ? 0.04 : 0.07), r * 0.13, INK);
      if (angry) s.line(cx + sx * r * 0.6, cy - r * 0.38, cx + sx * r * 0.14, cy - r * 0.2, INK, lw + 1);
    }
  }
  s.poly([[cx - r * 0.14, cy + r * 0.18], [cx + r * 0.14, cy + r * 0.18], [cx, cy + r * 0.33]], 'p', { flat: 0.6 });
  if (mood === 2) {
    // the roar: jaws wide, four fangs, the tongue
    fillE(s, cx, cy + r * 0.62, r * 0.42, r * 0.34, INK);
    fillE(s, cx, cy + r * 0.62, r * 0.36, r * 0.28, 0x6a1420);
    fillE(s, cx, cy + r * 0.76, r * 0.22, r * 0.13, 0xe86a7a);
    for (const sx of [-1, 1]) {
      s.poly([[cx + sx * r * 0.3, cy + r * 0.36], [cx + sx * r * 0.16, cy + r * 0.36], [cx + sx * r * 0.22, cy + r * 0.62]], 'w', { flat: 0.98 });
      s.poly([[cx + sx * r * 0.26, cy + r * 0.9], [cx + sx * r * 0.14, cy + r * 0.9], [cx + sx * r * 0.2, cy + r * 0.72]], 'w', { flat: 0.98 });
    }
  } else if (mood === 1) {
    s.paint([cx - r * 0.34, cy + r * 0.4, cx + r * 0.34, cy + r * 0.7], (x, y) => Math.abs(x - cx) < r * 0.32 - (y - cy - r * 0.4) * 0.3, 'k', () => 0.15);
    for (const sx of [-1, 1]) s.poly([[cx + sx * r * 0.26, cy + r * 0.42], [cx + sx * r * 0.15, cy + r * 0.42], [cx + sx * r * 0.2, cy + r * 0.62]], 'w', { flat: 0.98 });
  } else {
    s.line(cx, cy + r * 0.33, cx - r * 0.2, cy + r * 0.48, INK, lw);
    s.line(cx, cy + r * 0.33, cx + r * 0.2, cy + r * 0.48, INK, lw);
    if (mood === 'lick') fillE(s, cx + r * 0.12, cy + r * 0.56, r * 0.12, r * 0.16, 0xe86a7a);
  }
  // whiskers
  if (r > 20) for (const sx of [-1, 1]) for (let k = -1; k <= 1; k++) s.line(cx + sx * r * 0.5, cy + r * 0.4 + k * 2, cx + sx * r * 1.12, cy + r * (0.36 + k * 0.14), 0xffffff, 1, 0.9);
}

// ---------------------------------------------------------------- the grandma (62 x 82 -> 186 x 246)
export const BW = 186;
export const BH = 246;
const CX = 93;
const GROUND = 238;

/** A wrapped sweet in the hand. */
function sweetAt(s, x, y, col = 'r') {
  for (const sx of [-1, 1]) s.poly([[x + sx * 5, y], [x + sx * 12, y - 5], [x + sx * 12, y + 5]], col, { flat: 0.45 });
  s.ellipse(x, y, 6.5, 5.5, col, { bias: 0.1 });
}

function bag(s, x, y, ang = 0) {
  // hangs from (x, y) at ang (0: straight down); strap, a trapezoid of brown leather, a gold clasp
  const c = Math.cos(ang);
  const d = Math.sin(ang);
  const q = (u, v) => [x + u * c - v * d, y + u * d + v * c]; // v: down the strap
  s.tube(...q(0, 0), ...q(0, 12), 1.8, 'b');
  s.poly([q(-13, 12), q(13, 12), q(18, 40), q(-18, 40)], 'b', { flat: 0.62 });
  s.shade([x - 44, y - 44, x + 44, y + 44], (px, py) => {
    const v = -(px - x) * d + (py - y) * c;
    return v > 30 && v < 41;
  }, -0.12);
  s.line(...q(-14, 18), ...q(14, 18), 0x4a2a18, 1);
  s.dot(...q(0, 18), 2.6, GOLD);
}

function arm(s, sh, ha, kind, sx) {
  const mx = (sh[0] + ha[0]) / 2 + sx * 5;
  const my = (sh[1] + ha[1]) / 2 + 3;
  s.tube(sh[0], sh[1], mx, my, 10.5, 'a', { rb: 9 });
  s.tube(mx, my, ha[0], ha[1], 9, 'a', { rb: 7.5 });
  const [x, y] = ha;
  if (kind === 'point') s.tube(x, y, x + sx * 14, y - 2, 3, 'f', { rb: 2.4 });
  if (kind === 'open') for (let k = -1; k <= 1; k++) s.tube(x, y, x + sx * 9, y + k * 6 - 3, 2.8, 'f', { rb: 2.2 });
  s.ellipse(x, y, 8.5, 8, 'f', { bias: 0.05 });
  if (kind === 'fist') for (let k = -1; k <= 1; k++) s.line(x + k * 4, y - 3, x + k * 4, y + 3, SKIN_LINE, 1);
  if (kind === 'sweet') sweetAt(s, x + sx * 2, y - 9);
}

const DOWN_L = { ha: [-52, 172], kind: 'fist' };
const DOWN_R = { ha: [52, 172], kind: 'fist' };
const GRIN = { eyes: 'smile', mouth: 'grin' };
// each pose: bob (the whole of her up), lean, feet lifted [left, right], the face, the arms (hand: x from her middle,
// y), where the handbag hangs (on her left forearm unless she whirls it: bagAt [x, y, angle])
export const POSES = {
  walk0: { feet: [7, 0], face: GRIN, L: { ha: [-50, 168], kind: 'fist' }, R: { ha: [54, 176], kind: 'fist' } },
  walk1: { bob: 3, face: GRIN, L: DOWN_L, R: DOWN_R },
  walk2: { feet: [0, 7], face: GRIN, L: { ha: [-54, 176], kind: 'fist' }, R: { ha: [50, 168], kind: 'fist' } },
  peek: { bob: 1, face: { eyes: 'open', mouth: 'smile' }, L: DOWN_L, R: DOWN_R }, // her eyes open for a moment
  // a sweet drawn back over her shoulder, then flung
  throw0: { lean: -3, face: { eyes: 'open', mouth: 'grin' }, L: DOWN_L, R: { ha: [60, 92], kind: 'sweet' } },
  throw1: { lean: 4, bob: 2, face: { eyes: 'smile', mouth: 'o' }, L: DOWN_L, R: { ha: [70, 150], kind: 'open' } },
  // haggling: a hand cupped by her mouth, the other fist shaken
  shout0: { lean: 2, face: { eyes: 'angry', mouth: 'wide' }, L: { ha: [-58, 84], kind: 'fist' }, R: { ha: [30, 100], kind: 'open' } },
  shout1: { lean: 5, bob: 4, face: { eyes: 'angry', mouth: 'huge' }, L: { ha: [-64, 70], kind: 'fist' }, R: { ha: [34, 104], kind: 'open' } },
  // the handbag whirled over her head, four places round the circle
  bag0: { bob: 2, face: { eyes: 'angry', mouth: 'grit' }, L: { ha: [-44, 58], kind: 'fist' }, R: DOWN_R, bagAt: [-44, 52, Math.PI] },
  bag1: { bob: 3, lean: 2, face: { eyes: 'angry', mouth: 'grit' }, L: { ha: [-38, 54], kind: 'fist' }, R: DOWN_R, bagAt: [-38, 50, -Math.PI / 2] },
  bag2: { bob: 2, face: { eyes: 'angry', mouth: 'wide' }, L: { ha: [-44, 62], kind: 'fist' }, R: DOWN_R, bagAt: [-44, 62, 0.25] },
  bag3: { bob: 3, lean: -2, face: { eyes: 'angry', mouth: 'grit' }, L: { ha: [-50, 54], kind: 'fist' }, R: DOWN_R, bagAt: [-50, 50, Math.PI / 2] },
  // calling the trolley in: pointing to the side it comes from (flipped for the other)
  point: { lean: 3, face: { eyes: 'open', mouth: 'o' }, L: DOWN_L, R: { ha: [74, 122], kind: 'point' } },
  // "ohoho": a hand to her mouth, shoulders shaking
  laugh0: { face: { eyes: 'smile', mouth: 'wide' }, L: DOWN_L, R: { ha: [20, 104], kind: 'open' } },
  laugh1: { bob: 4, face: { eyes: 'smile', mouth: 'grin' }, L: DOWN_L, R: { ha: [22, 100], kind: 'open' } },
  // beaten: sat down in the snow, puffing, holding out one last sweet
  down: { sit: true, face: { eyes: 'tired', mouth: 'smile' }, L: { ha: [-56, 196], kind: 'fist' }, R: { ha: [62, 150], kind: 'sweet' } },
};

export function baba(name, bare = false) {
  const p = POSES[name];
  const s = new HiSprite(BW, BH, RAMPS);
  const sit = p.sit ? 26 : 0;
  const bob = -(p.bob ?? 0) + sit;
  const lean = p.lean ?? 0;
  const c = CX + lean;
  const by = 150 + bob; // the blouse's middle
  const hy = 74 + bob; // the head's
  const spots = (x, y) => (hsh(Math.floor(x / 5), Math.floor(y / 5)) > 0.62 && ((x % 5) - 2.5) ** 2 + ((y % 5) - 2.5) ** 2 < 5 ? -0.5 : 0);
  // legs: short, in leopard-print trousers; white socks in sandals
  for (const sx of [-1, 1]) {
    const lift = p.feet?.[sx < 0 ? 0 : 1] ?? 0;
    const fx = CX + sx * (p.sit ? 34 : 17);
    const fy = GROUND - 8 - lift;
    s.tube(CX + sx * 15, 186 + bob, fx, fy - 6, 11, 'l', { rb: 9.5, pat: spots });
    s.ellipse(fx, fy - 2, 9, 6, 'w', { bias: 0.04 });
    s.ellipse(fx + sx * 2, fy + 3, 13, 5.5, 'r', { flat: 0.5 });
    s.line(fx - 6, fy, fx + 8, fy - 2, 0x7a1418, 2);
  }
  // the blouse: stout and round, black, a frill at the hem; the tiger's face on it (or the gap it left)
  s.ellipse(c, by, 47, 45, 'k', { bias: 0.04, pat: speckle({ amt: 0.05 }) });
  for (let k = -4; k <= 4; k++) s.ellipse(c + k * 10, by + 43 - Math.abs(k) * 2.2, 6, 4, 'k', { bias: 0.1 });
  if (!bare) tigerFace(s, c, by + 2, 28, name.startsWith('shout') || name.startsWith('bag') ? 1 : name === 'peek' ? 'blink' : 0);
  else {
    // a tiger-shaped patch of bare cloth, the stitches where the print was
    s.paint([c - 30, by - 26, c + 30, by + 28], (x, y) => ((x - c) / 28) ** 2 + ((y - by - 2) / 24) ** 2 < 1 || ((Math.abs(x - c) - 20) / 9) ** 2 + ((y - by + 18) / 9) ** 2 < 1, 'w', () => 0.3);
    for (let a = 0; a < Math.PI * 2; a += 0.22) s.line(c + Math.cos(a) * 24, by + 2 + Math.sin(a) * 20, c + Math.cos(a + 0.1) * 24, by + 2 + Math.sin(a + 0.1) * 20, 0x6a6872, 1);
    s.line(c - 8, by - 4, c + 8, by + 8, 0x4a4852, 1);
    s.line(c + 8, by - 4, c - 8, by + 8, 0x4a4852, 1);
  }
  // pearls
  for (let k = -4; k <= 4; k++) s.dot(c + k * 6.5, hy + 36 + (16 - k * k) * 0.45, 2.6, 0xf4f0e6);
  // the head: a round face, cheeks, the perm in tight curls all round it, glasses, lipstick
  const hx = c + lean * 0.6;
  s.ellipse(hx, hy + 4, 31, 30, 'f', { bias: 0.06 });
  const curl = (x, y, r) => {
    s.ellipse(x, y, r, r, 'v', { bias: 0.04 });
    s.shade([x - r, y - r, x + r, y + r], (px, py) => Math.abs(Math.hypot(px - x - 1, py - y - 1) - r * 0.5) < 0.9, -0.16);
  };
  const askew = p.sit ? 5 : 0;
  for (let k = 0; k < 15; k++) {
    const a = Math.PI * (0.98 + (k / 14) * 1.04);
    curl(hx + askew + Math.cos(a) * 33, hy - 2 + Math.sin(a) * 30, 11.5);
  }
  for (let k = 0; k < 9; k++) {
    const a = Math.PI * (1.1 + (k / 8) * 0.8);
    curl(hx + askew + Math.cos(a) * 19, hy - 8 + Math.sin(a) * 22, 10.5);
  }
  for (const [x, y] of [[-8, -22], [8, -22], [0, -14]]) curl(hx + askew + x, hy + y, 10);
  for (const sx of [-1, 1]) {
    curl(hx + sx * 33, hy + 8, 9.5);
    curl(hx + sx * 31, hy + 20, 7.5);
    s.dot(hx + sx * 30, hy + 30, 2.6, GOLD); // earrings
    fillE(s, hx + sx * 19, hy + 16, 6, 4.5, 0xf07a7a, 0.5); // cheeks
  }
  const f = p.face;
  for (const sx of [-1, 1]) {
    const ex = hx + sx * 12;
    const ey = hy + 3;
    if (f.eyes === 'smile') path(s, [[ex - 6, ey + 2], [ex, ey - 3], [ex + 6, ey + 2]], INK, 2);
    else if (f.eyes === 'tired') path(s, [[ex - 6, ey - 1], [ex, ey + 2], [ex + 6, ey - 1]], INK, 2);
    else {
      fillE(s, ex, ey, 5.5, f.eyes === 'angry' ? 3.6 : 4.6, 0xffffff);
      fillE(s, ex, ey + 0.5, 2.6, 2.8, INK);
      if (f.eyes === 'angry') s.line(ex - sx * 8, ey - 5, ex + sx * 7, ey - 10, INK, 3);
      else s.line(ex - 6, ey - 5, ex + 6, ey - 5, INK, 1);
    }
    for (let a = 0; a < Math.PI * 2; a += 0.07) for (let w = 0; w < 2; w++) s.px(ex + Math.cos(a) * (9 + w * 0.7), ey + Math.sin(a) * (8 + w * 0.7), GOLD); // the glasses
    s.line(ex - 6, ey - 5, ex - 3, ey - 7, 0xffffff, 1, 0.6);
  }
  s.line(hx - 3, hy + 2, hx + 3, hy + 2, GOLD, 2);
  path(s, [[hx - 1, hy + 8], [hx - 2, hy + 13], [hx + 2, hy + 14]], SKIN_LINE, 1);
  const my = hy + 22;
  if (f.mouth === 'grin') {
    s.paint([hx - 12, my - 3, hx + 12, my + 7], (x, y) => Math.abs(x - hx) < 12 - (y - my + 3) * 1.1 && y > my - 3, 'r', () => 0.55);
    s.line(hx - 9, my - 1, hx + 9, my - 1, 0xffffff, 2);
  } else if (f.mouth === 'smile') {
    path(s, [[hx - 8, my - 1], [hx - 3, my + 2], [hx + 3, my + 2], [hx + 8, my - 1]], 0xd02a26, 3);
  } else if (f.mouth === 'grit') {
    fillE(s, hx, my + 1, 11, 5, 0xd02a26);
    fillE(s, hx, my + 1, 9, 3.4, 0xffffff);
    for (let k = -1; k <= 1; k++) s.line(hx + k * 5, my - 2, hx + k * 5, my + 4, 0x8a8a94, 1);
  } else {
    const [rx, ry] = { o: [5, 6], wide: [9, 8], huge: [12, 11] }[f.mouth];
    fillE(s, hx, my + 2, rx + 2.4, ry + 2.4, 0xd02a26);
    fillE(s, hx, my + 2, rx, ry, 0x4a0e18);
    if (ry > 6) {
      for (let x = -rx; x <= rx; x++) for (let y = -ry; y < -ry + 3; y++) if ((x / rx) ** 2 + (y / ry) ** 2 <= 1) s.px(hx + x, my + 2 + y, 0xfffaf0);
      fillE(s, hx, my + 2 + ry * 0.55, rx * 0.6, ry * 0.35, 0xd85a5e);
    }
  }
  // the arms; the handbag on her left forearm, or whirling
  for (const sx of [-1, 1]) {
    const a = sx < 0 ? p.L : p.R;
    const ha = [CX + a.ha[0], a.ha[1] + (a.ha[1] > 120 ? bob : bob * 0.5)];
    if (sx < 0 && !p.bagAt) bag(s, (c - 36 + ha[0]) / 2 - 4, (by - 22 + ha[1]) / 2 + 6);
    arm(s, [c + sx * 37, by - 22], ha, a.kind, sx);
  }
  if (p.bagAt) bag(s, CX + p.bagAt[0], p.bagAt[1] + bob * 0.5, p.bagAt[2]);
  return s.render();
}

// ---------------------------------------------------------------- the tiger off her blouse (56 x 50 -> 168 x 150)
// sit, blink, lick (resting); crouch0/1 (gathering itself, its haunches wiggling); leap (stretched out in the air);
// land (flat, claws out); roar0/1; walk0/1 (padding back up the snow)
export function tora(pose) {
  const s = new HiSprite(168, 150, RAMPS);
  const cx = 84;
  const leap = pose === 'leap';
  const crouch = pose.startsWith('crouch') || pose === 'land';
  const roar = pose.startsWith('roar');
  const wig = pose === 'crouch1' ? 4 : pose === 'crouch0' ? -4 : 0;
  const step = pose === 'walk0' ? 5 : pose === 'walk1' ? -5 : 0;
  const hy = leap ? 54 : crouch ? 74 : roar ? 54 : 60; // the head
  const byy = leap ? 86 : crouch ? 100 : 98; // the body
  // the tail: up and curled, ringed (lashing when it crouches)
  const tail = [[cx + 30 + wig, byy + 10], [cx + 58 + wig * 2, byy - 6], [cx + 66 + wig * 3, leap ? byy + 30 : byy - 34], [cx + 56 + wig * 3, leap ? byy + 44 : byy - 48]];
  for (let i = 1; i < tail.length; i++) s.tube(...tail[i - 1], ...tail[i], 7 - i, 't', { rb: 6 - i, ...furry(5) });
  for (let i = 1; i < tail.length; i++) {
    const mx = (tail[i - 1][0] + tail[i][0]) / 2;
    const my = (tail[i - 1][1] + tail[i][1]) / 2;
    s.line(mx - 5, my - 2, mx + 5, my + 2, INK, 3);
  }
  s.dot(...tail[3], 4, INK);
  // hind legs, the body (long in a leap, low and bunched in a crouch), its flame stripes, the pale belly
  for (const sx of [-1, 1]) {
    const fy = leap ? 140 : 132;
    s.tube(cx + sx * 20 + wig, byy + 10, cx + sx * (leap ? 26 : 32) + wig, fy - (sx > 0 ? step : -step), 10, 't', { rb: 8.5, ...furry(7) });
    if (!leap) s.ellipse(cx + sx * 33 + wig, fy + 4 - (sx > 0 ? step : -step), 10, 6.5, 'w', { flat: 0.8 });
  }
  s.ellipse(cx + wig * 0.5, byy, 38, leap ? 40 : crouch ? 26 : 32, 't', { bias: 0.04, ...furry(9) });
  if (!crouch) s.ellipse(cx, byy + 12, 18, leap ? 22 : 16, 'w', { flat: 0.82 });
  for (let k = 0; k < 5; k++) for (const sx of [-1, 1]) {
    const y0 = byy - (leap ? 30 : 20) + k * (leap ? 14 : 9);
    s.poly([[cx + sx * 33 + wig * 0.5, y0 - 3], [cx + sx * 33 + wig * 0.5, y0 + 4], [cx + sx * 16, y0 + 5]], 'k', { flat: 0.1 });
  }
  // the forelegs: under it, planted wide in a crouch, flung out ahead in a leap; claws
  for (const sx of [-1, 1]) {
    const fx = cx + sx * (leap ? 50 : crouch ? 44 : 24);
    const fy = leap ? 22 : crouch ? 116 : 128 + (sx > 0 ? step : -step);
    s.tube(cx + sx * 22, byy - 14, fx, fy, 10, 't', { rb: 8, ...furry(11) });
    for (let k = 0; k < 2; k++) s.line(cx + sx * 22 + (fx - cx - sx * 22) * (0.35 + k * 0.25) - 6, byy - 14 + (fy - byy + 14) * (0.35 + k * 0.25), cx + sx * 22 + (fx - cx - sx * 22) * (0.35 + k * 0.25) + 6, byy - 12 + (fy - byy + 14) * (0.35 + k * 0.25), INK, 2);
    s.ellipse(fx, fy + (leap ? -4 : 4), 10.5, 8, 'w', { flat: 0.82 });
    if (leap || pose === 'land' || roar) for (let k = -1; k <= 1; k++) s.line(fx + k * 5, fy + (leap ? -10 : 10), fx + k * 6, fy + (leap ? -17 : 16), 0xffffff, 2);
  }
  tigerFace(s, cx, hy, 31, roar ? (pose === 'roar1' ? 2 : 1) : leap ? 2 : pose === 'land' || crouch ? 1 : pose === 'blink' ? 'blink' : pose === 'lick' ? 'lick' : 0);
  return s.render();
}

// ---------------------------------------------------------------- what she throws and pushes
/** A wrapped sweet, its wrapper twisted at both ends; f: 0 / 1 tumbling, 2 the wrapper coming open (about to burst). */
export function ame(col, f = 0) {
  const s = new HiSprite(42, 26, RAMPS);
  const tilt = f === 1 ? 2.5 : 0;
  const open = f === 2 ? 4 : 0;
  for (const sx of [-1, 1]) s.poly([[21 + sx * 8, 13], [21 + sx * (18 + open * 0.5), 5 - open * 0.6 + tilt * sx], [21 + sx * (18 + open * 0.5), 21 + open * 0.6 - tilt * sx]], col, { flat: 0.45 });
  s.ellipse(21, 13, 10, 8.5, f === 2 ? 'w' : col, { bias: 0.1 });
  if (f === 2) s.ellipse(21, 13, 6.5, 5.5, col, { bias: 0.15 });
  else for (let k = -1; k <= 1; k++) s.line(21 + k * 5 - 2, 6, 21 + k * 5 + 2, 20, 0xffffff, 1, 0.5); // the wrapper's stripes
  s.line(15, 9, 19, 7, 0xffffff, 2, 0.9);
  return s.render({ outline: 1 });
}

/** The shopping trolley, seen from the side (it rams to the left; flipped for the right), its basket heaped. */
export function cart(f) {
  const s = new HiSprite(108, 90, RAMPS);
  const jolt = f % 2 ? 1 : 0;
  // the basket: a wire grid, a tartan cover folded back, the shopping (leeks, a daikon, a box, oranges)
  s.tube(24, 12 + jolt, 20, 0 + jolt, 3, 'g', { rb: 2 });
  s.tube(34, 14 + jolt, 36, 2 + jolt, 3, 'g', { rb: 2.4 });
  s.tube(46, 14 + jolt, 54, 1 + jolt, 5, 'w', { rb: 3.4 });
  s.poly([[58, 6 + jolt], [78, 6 + jolt], [78, 22 + jolt], [58, 22 + jolt]], 'p', { flat: 0.6 });
  for (const [x, y] of [[66, 12], [80, 14], [73, 6]]) s.ellipse(x + 4, y + 4 + jolt, 6.5, 6, 'y', { bias: 0.1 });
  s.paint([10, 18, 92, 62], (x, y) => y > 18 + jolt && y < 60 + jolt && x > 12 + (y - 18) * 0.22 && x < 90, 's', () => 0.55, { pat: (x, y) => (Math.floor(x) % 7 === 0 || Math.floor(y) % 7 === 0 ? 0.2 : -0.32) });
  s.poly([[12, 18 + jolt], [44, 18 + jolt], [40, 34 + jolt], [16, 34 + jolt]], 'r', { flat: 0.6, pat: (x, y) => (Math.floor(x) % 8 < 2 || Math.floor(y) % 8 < 2 ? -0.25 : 0) });
  s.tube(90, 20 + jolt, 104, 6 + jolt, 3, 's'); // the handle
  s.ellipse(104, 6 + jolt, 4, 4, 'k', { flat: 0.3 });
  s.tube(20, 62 + jolt, 86, 62 + jolt, 2.4, 's');
  for (const x of [26, 80]) {
    s.tube(x, 62 + jolt, x, 74, 2, 's');
    s.ellipse(x, 79, 8, 8, 'k', { flat: 0.3 });
    const a = f * (Math.PI / 4);
    s.line(x - 5 * Math.cos(a), 79 - 5 * Math.sin(a), x + 5 * Math.cos(a), 79 + 5 * Math.sin(a), 0xb8bac4, 2);
    s.line(x + 5 * Math.sin(a), 79 - 5 * Math.cos(a), x - 5 * Math.sin(a), 79 + 5 * Math.cos(a), 0xb8bac4, 2);
  }
  return s.render();
}

// ---------------------------------------------------------------- signs in the snow (plain rasters: no outline)
/** A tiger's paw print pressed in the snow (heading up the picture); big: where it will land. */
export function paw(big = false) {
  const k = big ? 2.2 : 1;
  const R = Math.round(11 * k);
  const r = new Raster(R * 2 + 1, R * 2 + 1);
  const blob = (cx, cy, rx, ry) => {
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
      const d = (x / rx) ** 2 + (y / ry) ** 2;
      if (d <= 1) r.set(Math.round(R + cx + x), Math.round(R + cy + y), d > 0.6 ? 0x26324a : 0x3c4c6a, 0.9);
    }
  };
  blob(0, 3 * k, 5.5 * k, 4.5 * k);
  for (const [x, y] of [[-6, -3], [-2.2, -6.5], [2.2, -6.5], [6, -3]]) blob(x * k, y * k, 2.2 * k, 2.6 * k);
  return r;
}

/** The ring of scuffed snow round where the tiger will land (n: 0 / 1, it turns). */
export function pounce(n) {
  const R = 44;
  const r = new Raster(R * 2 + 1, R * 2 + 1);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + n * 0.2;
    for (let d = 0; d < 9; d++) for (let w = -1; w <= 1; w++) r.set(Math.round(R + Math.cos(a) * (32 + d) + Math.sin(a) * w), Math.round(R + Math.sin(a) * (32 + d) * 0.8 - Math.cos(a) * w), i % 2 ? 0xff6a50 : 0xffb050, 0.95);
  }
  return r;
}

/** A stretch of the trolley's wheel ruts in the snow: two grooves, snow thrown up beside them. */
export function rut() {
  const r = new Raster(48, 30);
  for (const y0 of [6, 22]) for (let x = 0; x < 48; x++) {
    for (let w = 0; w < 4; w++) r.set(x, y0 + w, w === 0 || w === 3 ? 0x26324a : 0x3c4c6a, 0.9);
    if ((x * 7) % 5 === 0) r.set(x, y0 - 2, 0xf4f6ff, 0.9);
    if ((x * 3) % 7 === 0) r.set(x, y0 + 5, 0xf4f6ff, 0.8);
  }
  return r;
}

export function obachanEnemies(add) {
  for (const p of Object.keys(POSES)) {
    if (p !== 'down') add(`baba_${p}`, baba(p));
    add(`baba_bare_${p}`, baba(p, true));
  }
  for (const p of ['sit', 'blink', 'lick', 'crouch0', 'crouch1', 'leap', 'land', 'roar0', 'roar1', 'walk0', 'walk1']) add(`tora_${p}`, tora(p));
  for (const c of ['r', 'y', 'g', 'p']) for (let f = 0; f < 3; f++) add(`ame_${c}_${f}`, ame(c, f));
  for (let f = 0; f < 4; f++) add(`cart_${f}`, cart(f));
  add('paw', paw());
  add('paw_big', paw(true));
  add('pounce_0', pounce(0));
  add('pounce_1', pounce(1));
  add('rut', rut());
}
