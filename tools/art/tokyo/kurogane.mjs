// The boss of Tokyo (docs/plan-tokyo.md, 6.3): KUROGANE, the mech of Tokyo Bay. Our own design, built like a
// samurai's armour out of a container port's iron: black steel, vermilion lacquer, gold. Shoulder plates of lacquered
// lames laced with cord (sode), a helmet bowl of riveted ridges with a flaring neck guard and turned-back wings, on its
// brow a round crescent cradling a disc; an iron face mask with a stern grille; eyes like paper lanterns, ribbed, amber.
// From the port: hazard stripes, hooks, hydraulic rams, chains.
//   In the gantry (phase 1): plugged into a container crane's portal, fists on chains, missile hatches in the shoulder
//   plates, a cannon in the chest. In flight (phase 2): the crane gone, the legs folded into thrusters, two folding
//   fans for wings, a blade of light; four lantern drones about it. The frame (phase 3): the armour blown off - the
//   skeleton of struts and cables, the reactor glowing in its cage, the crescent gone, one eye flickering.
import { HiSprite, tones, mottle, speckle, mix2, hash } from '../../lib/hisprite.mjs';

const TAU = Math.PI * 2;
const INK = 0x120e14;
const GOLD = 0xe8b030;
const RAMPS = {
  K: tones([0x0c0c12, 0x262832, 0x62667a]), // black steel
  V: tones([0x4a0808, 0xb4241a, 0xff6a44]), // vermilion lacquer
  Y: tones([0x5a3c06, 0xc8901c, 0xfff098]), // gold
  C: tones([0x30343e, 0x8a909c, 0xeef2f8]), // chrome: the rams
  G: tones([0x141a26, 0x34445a, 0x7286a0]), // the crane's steel
  H: tones([0x6a4a00, 0xe0ac00, 0xfff070]), // hazard yellow
  N: tones([0x2a0a10, 0x6a1a24, 0xa84a50]), // cables, red
  F: tones([0x3a0610, 0x8c1622, 0xd84a3a]), // the fans' cloth
  L: [0x8a3000, 0xff7a10, 0xffb040, 0xffe08a, 0xffffff], // lantern light
  R: [0xa83a00, 0xff8a20, 0xffd060, 0xfff4c0, 0xffffff], // the reactor
  B: [0xc87a10, 0xffc040, 0xfff0a0, 0xfffff0, 0xffffff], // the blade of light
  J: [0xc84a08, 0xff8a20, 0xffd070, 0xfff6d0, 0xffffff], // thrust
};
export const KW = 432;
export const KH = 384;
const CX = 216;

// ---------------------------------------------------------------- helpers
const mirror = (fn) => [-1, 1].forEach((sx) => fn(sx));
const rect = (x0, y0, x1, y1) => (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
const ellT = (cx, cy, rx, ry) => (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
const lit = (x0, y0, x1, y1, base = 0.55) => (x, y) => base + 0.22 * (1 - (x - x0) / Math.max(1, x1 - x0)) * 0.6 + 0.18 * (1 - (y - y0) / Math.max(1, y1 - y0));
const steel = { pat: mix2(speckle({ amt: 0.1, dark: 0.06, light: 0.04, seed: 91 }), mottle({ amt: 0.06, scale: 6, seed: 92 })) };
const lacq = { pat: mottle({ amt: 0.05, scale: 8, seed: 93 }) };

/**
 * Lacquered lames laced with cord, over the region `test` within box [x0, y0, x1, y1]: each lame lit along its top,
 * a black lacquered edge, the cords running down in pairs, gold knots. tilt: how far the rows slope (px across).
 */
function lames(s, box, test, { row = 9, lace = 11, mat = 'V', tilt = 0, base = 0.5 } = {}) {
  const [x0, y0, x1, y1] = box;
  const rowAt = (x, y) => (y - y0 - tilt * ((x - x0) / Math.max(1, x1 - x0))) / row;
  s.paint(box, test, mat, (x, y) => {
    const f = rowAt(x, y) % 1;
    return base + 0.28 * (1 - f) - 0.08 * ((x - x0) / Math.max(1, x1 - x0));
  }, lacq);
  for (let y = Math.floor(y0); y <= y1; y++)
    for (let x = Math.floor(x0); x <= x1; x++) {
      if (!test(x + 0.5, y + 0.5)) continue;
      const r = rowAt(x + 0.5, y + 0.5);
      const f = r - Math.floor(r);
      if (f > 0.9) s.px(x, y, 0x1a0606); // the lame's lower edge, lacquered black
      else if (f < 0.1) s.shade([x, y, x, y], () => true, 0.12); // its lit top
      const lx = (x - x0) % lace;
      if ((lx === 4 || lx === 6) && f < 0.86 && f > 0.14) s.px(x, y, 0x3a0c14); // the cords, in pairs
      if (lx === 5 && f > 0.78 && f < 0.9 && Math.floor(r) % 2 === 0) s.px(x, y, GOLD); // a knot
    }
}

/** Diagonal hazard stripes over the box. */
function hazard(s, [x0, y0, x1, y1], test = () => true, w = 6) {
  s.paint([x0, y0, x1, y1], (x, y) => test(x, y), 'H', () => 0.62);
  for (let y = Math.floor(y0); y <= y1; y++) for (let x = Math.floor(x0); x <= x1; x++) if (test(x + 0.5, y + 0.5) && Math.floor((x + y) / w) % 2) s.px(x, y, 0x18141a);
}

function rivets(s, pts, r = 1.4) {
  for (const [x, y] of pts) {
    s.dot(x, y, r + 0.6, 0x3a2a08);
    s.dot(x, y, r, GOLD);
    s.px(x - 0.5, y - 0.5, 0xfff4b0);
  }
}

// ---------------------------------------------------------------- the head
/** A HiSprite seen through a zoom about (cx, cy): shapes and points are scaled by z (for drawing a part bigger). */
function zoomed(s, cx, cy, z) {
  const P = (x, y) => [cx + (x - cx) * z, cy + (y - cy) * z];
  const inv = (x, y) => [cx + (x - cx) / z, cy + (y - cy) / z];
  const box = ([x0, y0, x1, y1]) => [...P(x0, y0), ...P(x1, y1)];
  return {
    paint: (b, test, mat, light, o) => s.paint(box(b), (x, y) => test(...inv(x, y)), mat, (x, y) => light(...inv(x, y)), o?.pat ? { ...o, pat: (x, y) => o.pat(...inv(x, y)) } : o),
    ellipse: (x, y, rx, ry, mat, o) => s.ellipse(...P(x, y), rx * z, ry * z, mat, o),
    poly: (pts, mat, o) => s.poly(pts.map((p) => P(...p)), mat, o),
    tube: (ax, ay, bx, by, r, mat, o) => s.tube(...P(ax, ay), ...P(bx, by), r * z, mat, o && o.rb ? { ...o, rb: o.rb * z } : o),
    line: (x0, y0, x1, y1, c, w = 1, a = 1) => s.line(...P(x0, y0), ...P(x1, y1), c, Math.max(1, Math.round(w * z)), a),
    dot: (x, y, r, c, a) => s.dot(...P(x, y), r * z, c, a),
    px: (x, y, c, a) => {
      const [X, Y] = P(x, y);
      for (let j = 0; j < Math.ceil(z); j++) for (let i = 0; i < Math.ceil(z); i++) s.px(X + i, Y + j, c, a);
    },
    shade: (b, test, dv) => s.shade(box(b), (x, y) => test(...inv(x, y)), dv),
  };
}
// o: { crescent (bool), crack (0-2), eyes: [l, r] each 'on' | 'dim' | 'dead' | 'flicker' }
function head(s0, cx, cy, o = {}) {
  // (drawn a quarter bigger than its numbers: every coordinate and size goes through Z)
  const Z = 1.25;
  const s = zoomed(s0, cx, cy, Z);
  const crescent = o.crescent ?? true;
  // the neck guard: lames flaring out and down behind the mask
  lames(s, [cx - 56, cy + 6, cx + 56, cy + 44], (x, y) => {
    const t = (y - cy - 6) / 38;
    return Math.abs(x - cx) < 34 + t * 22 && y > cy + 6;
  }, { row: 10, lace: 12, base: 0.44 });
  // the turned-back wings at the sides, gold-edged
  mirror((sx) => {
    const pts = [[cx + sx * 30, cy - 6], [cx + sx * 50, cy - 10], [cx + sx * 56, cy + 10], [cx + sx * 36, cy + 14]];
    s.poly(pts, 'V', { flat: 0.58, ...lacq });
    for (let k = 0; k < 4; k++) s.line(...pts[k], ...pts[(k + 1) % 4], GOLD, 1);
    s.dot(cx + sx * 46, cy + 2, 3.2, GOLD);
    s.dot(cx + sx * 46, cy + 2, 1.6, 0x7a4a08);
  });
  // the bowl: riveted ridges, black, a gold band at its brim
  s.paint([cx - 36, cy - 34, cx + 36, cy + 4], (x, y) => y < cy && ((x - cx) / 35) ** 2 + ((y - cy) / 33) ** 2 <= 1, 'K', (x, y) => {
    const ridge = Math.abs(Math.sin(((x - cx) / 35) * 5.2));
    return 0.44 + 0.3 * (1 - ridge) * 0.5 + 0.22 * Math.max(0, -(x - cx) / 35) + 0.12 * (1 - (cy - y) / 33);
  }, steel);
  for (let k = -4; k <= 4; k++) {
    // the ridges' rivets
    const a = (k / 5) * 1.15;
    for (let r = 10; r < 31; r += 7) rivets(s, [[cx + Math.sin(a) * r * 1.06, cy - Math.cos(a) * r]], 0.9);
  }
  s.paint([cx - 38, cy - 4, cx + 38, cy + 4], (x, y) => Math.abs(y - cy) < 3.4 && Math.abs(x - cx) < 38, 'Y', (x, y) => 0.55 + (y < cy ? 0.15 : -0.05));
  // the brow's ornament: a round crescent cradling a disc, on a post
  if (crescent) {
    s.paint([cx - 3, cy - 46, cx + 3, cy - 30], rect(cx - 2.5, cy - 46, cx + 2.5, cy - 30), 'Y', () => 0.5);
    s.paint([cx - 24, cy - 76, cx + 24, cy - 38], (x, y) => Math.hypot(x - cx, y - (cy - 58)) < 22 && Math.hypot(x - cx, (y - (cy - 66)) * 1.05) > 18.5, 'Y', (x, y) => 0.5 + 0.3 * Math.max(0, -(x - cx) / 22) + 0.1 * ((y - (cy - 76)) / 38));
    s.ellipse(cx, cy - 58, 8.5, 8.5, 'V', { bias: 0.05, ...lacq });
    s.dot(cx - 2.5, cy - 61, 2, 0xff9a70);
  } else {
    // (shot off: the post's stump, bent)
    s.paint([cx - 4, cy - 42, cx + 6, cy - 30], (x, y) => Math.abs(x - cx - (cy - 30 - y) * 0.25) < 2.5 && y > cy - 42, 'Y', () => 0.4);
  }
  // the mask: iron, a ridge of a nose, cheek plates, a stern grille for a mouth, a throat guard of lames below
  lames(s, [cx - 22, cy + 26, cx + 22, cy + 44], (x, y) => Math.abs(x - cx) < 22 - (y - cy - 26) * 0.4 && y > cy + 26, { row: 7, lace: 9, base: 0.45 });
  s.paint([cx - 26, cy + 2, cx + 26, cy + 32], (x, y) => ((x - cx) / 25) ** 2 + ((y - cy - 12) / 20) ** 2 <= 1 && y > cy + 2, 'K', (x, y) => 0.42 + 0.3 * Math.max(0, -(x - cx) / 25) + 0.1 * (1 - (y - cy) / 30), steel);
  s.line(cx, cy + 6, cx, cy + 16, 0x6a6e80, 2); // the nose's ridge
  mirror((sx) => {
    s.line(cx + sx * 6, cy + 18, cx + sx * 22, cy + 12, 0x08080c, 1); // the cheeks' edges
    s.line(cx + sx * 4, cy + 30, cx + sx * 18, cy + 24, 0x3a3e4a, 1);
  });
  for (let k = -3; k <= 3; k++) s.line(cx + k * 3, cy + 21, cx + k * 3, cy + 27, k % 2 ? 0x08080c : 0x4a4e5a, 1); // the grille
  s.line(cx - 11, cy + 20, cx + 11, cy + 20, 0x08080c, 1);
  s.line(cx - 11, cy + 28, cx + 11, cy + 28, GOLD, 1);
  // the eyes: paper lanterns, ribbed
  const eyes = o.eyes ?? ['on', 'on'];
  mirror((sx) => {
    const st = eyes[sx < 0 ? 0 : 1];
    const [ex, ey] = [cx + sx * 12, cy + 8];
    s.ellipse(ex, ey, 7.4, 5.6, 'K', { flat: 0.2 });
    if (st === 'dead') {
      s.ellipse(ex, ey, 5.6, 4, 'K', { flat: 0.12 });
      s.line(ex - 4, ey - 3, ex + 3, ey + 3, 0x5a5e6a, 1); // cracked
    } else {
      const dim = st === 'dim';
      s.paint([ex - 6, ey - 5, ex + 6, ey + 5], ellT(ex, ey, 5.8, 4.2), 'L', (x, y) => (dim ? 0.35 : 0.7) + 0.25 * (1 - Math.abs(y - ey) / 4.2), { glow: true });
      for (const dy of [-2, 0, 2]) s.line(ex - 5, ey + dy, ex + 5, ey + dy, dim ? 0x5a2000 : 0xc85a00, 1); // the ribs
      s.dot(ex - 1.5, ey - 1, 1.2, dim ? 0xffa040 : 0xffffff);
      if (st === 'flicker') for (let k = 0; k < 6; k++) s.px(ex + (hash(k, 1, 3) - 0.5) * 10, ey + (hash(k, 2, 3) - 0.5) * 8, 0xffffff);
    }
  });
  // cracks (the frame): a gash across the bowl, the mask split
  if (o.crack) {
    for (let t = 0; t < 1; t += 0.02) {
      const x = cx - 26 + t * 40;
      const y = cy - 22 + Math.sin(t * 9) * 3 + t * 10;
      s.px(x, y, INK);
      s.px(x + 1, y + 1, 0x6a6e80);
    }
    if (o.crack >= 2) for (let t = 0; t < 1; t += 0.03) s.px(cx + 8 + Math.sin(t * 7) * 2, cy + 4 + t * 26, INK);
  }
}

// ---------------------------------------------------------------- the body
function torso(s, cx, cy, o = {}) {
  // the breastplate: lames sloping to the waist, a gold-edged chest plate, the cannon's muzzle in the middle
  const top = cy - 40;
  const bot = cy + 46;
  const half = (y) => {
    const t = (y - top) / (bot - top);
    return 62 - 18 * t * t + 4 * Math.sin(t * Math.PI); // (a broad chest, curving in to the waist)
  };
  const band = 13;
  s.paint([cx - 68, top, cx + 68, bot], (x, y) => Math.abs(x - cx) < half(y) && y >= top && y <= bot, 'V', (x, y) => {
    const f = ((y - top) % band) / band;
    const n = (x - cx) / half(y);
    return 0.4 + 0.3 * Math.sqrt(Math.max(0, 1 - n * n)) - 0.12 * n + 0.14 * (1 - f) - (f > 0.88 ? 0.2 : 0);
  }, lacq);
  for (let y = top + band; y < bot; y += band) {
    const h = half(y);
    for (let x = cx - h + 2; x < cx + h - 2; x++) s.px(x, y - 1, 0x2a0606);
    rivets(s, [-0.82, -0.5, 0.5, 0.82].map((k) => [cx + k * h, y + 3]), 1.1);
  }
  for (let y = top; y < bot; y++) s.px(cx + 1, y, 0xff8a60); // the ridge down the middle, catching the light
  s.paint([cx - 46, top - 4, cx + 46, top + 26], (x, y) => Math.abs(x - cx) < 46 - (y - top) * 0.4 && y > top - 4 && y < top + 26, 'K', lit(cx - 46, top - 4, cx + 46, top + 26, 0.4), steel);
  for (let x = cx - 46; x <= cx + 46; x++) s.px(x, top - 4, GOLD);
  rivets(s, [[cx - 36, top + 4], [cx + 36, top + 4], [cx - 22, top + 18], [cx + 22, top + 18]]);
  if (o.cannon !== false) {
    hazard(s, [cx - 17, cy - 9, cx + 17, cy + 25], (x, y) => Math.hypot(x - cx, y - cy - 8) < 16.5 && Math.hypot(x - cx, y - cy - 8) > 11.5, 5);
    s.ellipse(cx, cy + 8, 11, 11, 'K', { flat: 0.18 });
    s.ellipse(cx, cy + 8, 7, 7, 'K', { flat: 0.08 });
    s.paint([cx - 5, cy + 3, cx + 5, cy + 13], ellT(cx, cy + 8, 4.4, 4.4), 'L', () => 0.5, { glow: true });
  }
  // the belt: gold cord in a knot, black steel buckle with a hook
  s.paint([cx - 52, bot - 2, cx + 52, bot + 8], rect(cx - 52, bot - 2, cx + 52, bot + 8), 'K', lit(cx - 52, bot - 2, cx + 52, bot + 8, 0.36), steel);
  for (let x = cx - 52; x <= cx + 52; x += 3) s.px(x, bot + 3, GOLD);
  s.ellipse(cx, bot + 3, 7, 6, 'Y', { bias: 0.05 });
  s.line(cx, bot + 6, cx + 3, bot + 14, 0x8a909c, 2); // the hook
  s.line(cx + 3, bot + 14, cx - 1, bot + 16, 0x8a909c, 2);
}

function skirt(s, cx, y0, h = 46) {
  // five flaps of lames, the middle one in front
  for (const [k, dx, w] of [[0, -50, 26], [1, -24, 26], [2, 0, 28], [3, 24, 26], [4, 50, 26]]) {
    const x0 = cx + dx - w / 2;
    const yy = y0 + (k === 2 ? 2 : 0);
    const slant = dx * 0.12;
    lames(s, [x0 - 4, yy, x0 + w + 4, yy + h], (x, y) => {
      const t = (y - yy) / h;
      return y >= yy && t <= 1 && x >= x0 + slant * t - 1 && x <= x0 + w + slant * t + 1;
    }, { row: 11, lace: 12, base: 0.44 + (k === 2 ? 0.08 : 0) });
  }
}

/** A shoulder plate: lames, gold edging, the missile pod's hatches at its top (open: 0-1), a hazard band. */
function sode(s, cx, cy, sx, open = 0, wearN = 0) {
  const w = 46;
  const h = 64;
  const skew = sx * 8;
  const x0 = cx - w / 2;
  const test = (x, y) => {
    const t = (y - cy) / h;
    return y >= cy && t <= 1 && x >= x0 + skew * t && x <= x0 + w + skew * t;
  };
  lames(s, [x0 - 10, cy, x0 + w + 10, cy + h], test, { row: 12, lace: 12, base: 0.5 });
  for (let y = cy; y <= cy + h; y++) {
    const t = (y - cy) / h;
    s.px(x0 + skew * t, y, GOLD);
    s.px(x0 + w + skew * t, y, GOLD);
  }
  hazard(s, [x0, cy - 6, x0 + w, cy], rect(x0, cy - 6, x0 + w, cy - 1), 5);
  // the hatches
  for (let k = 0; k < 4; k++) {
    const [hx, hy] = [x0 + 6 + (k % 2) * 18, cy + 5 + Math.floor(k / 2) * 12];
    s.paint([hx, hy, hx + 14, hy + 9], rect(hx, hy, hx + 14, hy + 9), 'K', () => (open ? 0.12 : 0.42), steel);
    if (open) {
      // (half open: the lid lifting, a glow behind it; open: the rocket's nose in the light)
      s.paint([hx + 2, hy + 2, hx + 12, hy + 7], ellT(hx + 7, hy + 4.5, 4, 2.6), 'L', () => (open > 1 ? 0.6 : 0.35), { glow: true });
      if (open > 1) s.ellipse(hx + 7, hy + 4.5, 2.2, 2.2, 'C', { bias: 0.1 });
      s.line(hx, hy - 1 - open * 2, hx + 14, hy - 1 - open * 0.5, 0x3a3e4a, 2); // the lid, up
    } else rivets(s, [[hx + 2, hy + 2], [hx + 12, hy + 2]], 0.7);
    s.line(hx, hy + 9, hx + 14, hy + 9, GOLD, 1);
  }
  wear(s, [x0 - 8, cy - 6, x0 + w + 8, cy + h], wearN, 11 + sx);
}

/** An arm: the shoulder's joint, an upper arm with a ram alongside, the forearm's guard, and a fist (or a frame hand). */
function arm(s, sx, sh, el, wr, o = {}) {
  s.ellipse(sh[0], sh[1], 13, 13, 'K', { bias: 0.04, ...steel });
  rivets(s, [[sh[0], sh[1]]], 2);
  s.tube(sh[0], sh[1], el[0], el[1], 10, 'K', { rb: 9, ...steel });
  s.tube(sh[0] + sx * 9, sh[1] + 4, el[0] + sx * 9, el[1] - 4, 2.4, 'C'); // the ram
  s.tube(sh[0] + sx * 9, sh[1] + 4, (sh[0] + el[0]) / 2 + sx * 9, (sh[1] + el[1]) / 2, 3.4, 'K');
  s.ellipse(el[0], el[1], 10, 10, 'K', { bias: 0.04, ...steel });
  if (o.bare) {
    // the forearm's frame: two struts and a cable
    s.tube(el[0] - 4, el[1], wr[0] - 3, wr[1], 3.4, 'K');
    s.tube(el[0] + 4, el[1], wr[0] + 3, wr[1], 3, 'K');
    s.tube(el[0], el[1] + 2, wr[0], wr[1] - 2, 1.6, 'N');
  } else {
    // the guard: lacquered plates down the forearm, gold bands
    s.tube(el[0], el[1], wr[0], wr[1], 11, 'V', { rb: 12, ...lacq });
    for (const t of [0.3, 0.62, 0.9]) {
      const [x, y] = [el[0] + (wr[0] - el[0]) * t, el[1] + (wr[1] - el[1]) * t];
      s.line(x - 11, y - 1, x + 11, y + 1, GOLD, 1);
    }
  }
  if (o.fist !== false) fist(s, wr[0], wr[1] + 18, sx, o.shackle);
  else if (o.hand) {
    // a hand gripping (the katana's hilt goes through it)
    const [fx, fy] = [wr[0], wr[1] + 12];
    s.ellipse(fx, fy, 10, 9, 'K', { bias: 0.04, ...steel });
    for (let k = -1; k <= 1; k++) s.line(fx - 8, fy + k * 3, fx + 8, fy + k * 3, 0x08080c, 1);
  }
}

/** A fist: armoured knuckles, a hazard band round the wrist, a chain's shackle. */
function fist(s, fx, fy, sx, shackle) {
  {
    hazard(s, [fx - 15, fy - 22, fx + 15, fy - 15], rect(fx - 15, fy - 22, fx + 15, fy - 16), 4);
    s.ellipse(fx, fy, 17, 16, 'K', { bias: 0.04, ...steel });
    for (let k = -1.5; k <= 1.5; k++) s.ellipse(fx + k * 8, fy + 9, 4.6, 4, 'V', { bias: 0.1, ...lacq }); // knuckles
    s.line(fx - 15, fy + 3, fx + 15, fy + 3, GOLD, 1);
    s.ellipse(fx - sx * 15, fy - 3, 5, 7, 'K', { bias: 0.1 }); // the thumb
    if (shackle) {
      s.line(fx - 4, fy - 22, fx - 4, fy - 30, 0x8a909c, 2);
      s.line(fx + 4, fy - 22, fx + 4, fy - 30, 0x8a909c, 2);
      s.line(fx - 4, fy - 30, fx + 4, fy - 30, 0x8a909c, 2);
    }
  }
}

/** A chain from (x0, y0) to (x1, y1): links alternately face on and edge on. */
function chain(s, x0, y0, x1, y1) {
  const n = Math.floor(Math.hypot(x1 - x0, y1 - y0) / 6);
  for (let k = 0; k <= n; k++) {
    const [x, y] = [x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n];
    if (k % 2) s.ellipse(x, y, 2.4, 4, 'C', { bias: 0.05 });
    else {
      s.ellipse(x, y, 3.6, 4.4, 'C', { bias: 0.05 });
      s.ellipse(x, y, 1.6, 2.4, 'K', { flat: 0.1 });
    }
  }
}

function legs(s, cx, y0, o = {}) {
  mirror((sx) => {
    const x = cx + sx * 30;
    // the thigh's guard (haidate): small plates; the shin's (suneate): black with gold splints; the foot, clamped
    lames(s, [x - 18, y0, x + 18, y0 + 30], rect(x - 17, y0, x + 17, y0 + 30), { row: 8, lace: 10, base: 0.42 });
    s.ellipse(x, y0 + 36, 12, 10, 'K', { bias: 0.04, ...steel }); // the knee
    s.paint([x - 15, y0 + 40, x + 15, y0 + 84], (xx, y) => Math.abs(xx - x) < 15 - (y - y0 - 40) * 0.08 && y > y0 + 40 && y < y0 + 84, 'K', lit(x - 15, y0 + 40, x + 15, y0 + 84, 0.38), steel);
    for (const dx of [-8, 0, 8]) s.line(x + dx, y0 + 44, x + dx * 0.9, y0 + 80, GOLD, 1);
    s.tube(x - sx * 13, y0 + 42, x - sx * 12, y0 + 78, 2.2, 'C'); // a ram down the calf
    s.poly([[x - 18, y0 + 84], [x + 18, y0 + 84], [x + 22, y0 + 98], [x - 22, y0 + 98]], 'K', { flat: 0.4, ...steel });
    hazard(s, [x - 22, y0 + 94, x + 22, y0 + 98], rect(x - 22, y0 + 94, x + 22, y0 + 98), 4);
    if (o.clamp) {
      s.paint([x - 26, y0 + 86, x - 18, y0 + 100], rect(x - 26, y0 + 86, x - 18, y0 + 100), 'G', () => 0.5);
      s.paint([x + 18, y0 + 86, x + 26, y0 + 100], rect(x + 18, y0 + 86, x + 26, y0 + 100), 'G', () => 0.5);
    }
  });
}

// ---------------------------------------------------------------- phase 1: in the crane's portal
function gantry(s, only = null) {
  const want = (k) => !only || only === k;
  // two legs of box girder with their bracing, a beam over the top with its trolley, the hook, cable drums
  mirror((sx) => {
    const x0 = sx < 0 ? 6 : KW - 40;
    if (want('legs')) {
    s.paint([x0, 0, x0 + 34, KH], rect(x0, 0, x0 + 34, KH - 1), 'G', (x, y) => 0.42 + (x - x0 < 6 ? 0.2 : x - x0 > 28 ? -0.1 : 0), steel);
    for (let y = 18; y < KH; y += 36) {
      s.line(x0 + 3, y, x0 + 31, y + 30, 0x0c1018, 2);
      s.line(x0 + 31, y, x0 + 3, y + 30, 0x0c1018, 2);
      s.line(x0, y, x0 + 34, y, 0x1a2230, 2);
    }
    hazard(s, [x0, KH - 40, x0 + 34, KH - 1], rect(x0, KH - 40, x0 + 34, KH - 1), 7);
    }
    if (!want('clamps')) return;
    // the clamp arm out to the shoulder, a ram working it
    const yC = 128;
    s.paint([Math.min(x0 + 17, CX + sx * 120), yC - 7, Math.max(x0 + 17, CX + sx * 120), yC + 7], (x, y) => Math.abs(y - yC) < 7 && (sx < 0 ? x > x0 + 17 && x < CX - 120 : x < x0 + 17 && x > CX + 120), 'G', () => 0.5, steel);
    s.tube(x0 + 17, yC + 14, CX + sx * 118, yC + 6, 2.4, 'C');
    hazard(s, [CX + sx * 120 - 8, yC - 9, CX + sx * 120 + 8, yC + 9], rect(CX + sx * 120 - 7, yC - 9, CX + sx * 120 + 7, yC + 9), 4);
  });
  if (!want('top')) return;
  s.paint([0, 0, KW - 1, 24], rect(0, 0, KW - 1, 24), 'G', (x, y) => 0.5 - y * 0.008, steel);
  for (let x = 10; x < KW; x += 20) s.line(x, 2, x + 10, 22, 0x0c1018, 1);
  s.paint([CX - 30, 18, CX + 30, 36], rect(CX - 30, 18, CX + 30, 36), 'K', () => 0.45, steel); // the trolley
  hazard(s, [CX - 30, 32, CX + 30, 36], rect(CX - 30, 32, CX + 30, 36), 4);
  // cables from the trolley down into its back, a lamp on the beam
  for (const dx of [-20, 20]) s.tube(CX + dx, 36, CX + dx * 0.8, 74, 2.2, 'N');
  s.dot(CX + 44, 14, 3, 0xffd060);
}

// ---------------------------------------------------------------- phase 2: in flight
function fan(s, px, py, a0, a1, r, broken = 0) {
  // a folding fan: black ribs from the pivot, cloth between them with gold waves, a black edge band
  const n = 9;
  s.paint([px - r - 2, py - r - 2, px + r + 2, py + r + 2], (x, y) => {
    const d = Math.hypot(x - px, y - py);
    if (d > r || d < r * 0.28) return false;
    let a = Math.atan2(y - py, x - px);
    if (a < a0 - 0.01) a += TAU;
    if (a < a0 || a > a1) return false;
    if (broken) {
      const k = Math.floor(((a - a0) / (a1 - a0)) * n);
      if ((k * 7 + broken) % 3 === 0 && d > r * (0.45 + hash(k, 1, 9) * 0.3)) return false; // torn away
      if (d > r * (0.8 - hash(Math.floor(a * 30), 2, 9) * 0.25)) return false; // ragged
    }
    return true;
  }, 'F', (x, y) => {
    const a = Math.atan2(y - py, x - px);
    const k = ((a - a0) / (a1 - a0)) * n;
    return 0.48 + 0.18 * Math.abs(Math.sin(k * Math.PI)) + 0.1 * (Math.hypot(x - px, y - py) / r);
  }, lacq);
  // waves in gold over the cloth
  for (let y = Math.floor(py - r); y <= py + r; y++)
    for (let x = Math.floor(px - r); x <= px + r; x++) {
      const d = Math.hypot(x - px, y - py);
      let a = Math.atan2(y - py, x - px);
      if (a < a0 - 0.01) a += TAU;
      if (d > r - 1 || d < r * 0.5 || a < a0 || a > a1) continue;
      const wave = Math.abs(((d / 9 + Math.sin(a * 12) * 0.35) % 1) - 0.5) < 0.06;
      if (wave && !broken) s.px(x, y, 0xd8a028);
      if (d > r - 6) s.px(x, y, INK);
    }
  for (let k = 0; k <= n; k++) {
    const a = a0 + ((a1 - a0) * k) / n;
    const rr = broken && k % 3 === 1 ? r * 0.55 : r;
    s.line(px + Math.cos(a) * r * 0.2, py + Math.sin(a) * r * 0.2, px + Math.cos(a) * rr, py + Math.sin(a) * rr, 0x1a1c24, 2);
  }
  s.ellipse(px, py, 7, 7, 'Y', { bias: 0.05 });
  s.dot(px, py, 2, 0x5a3c06);
}

function katana(s, hx, hy, a, len, o = {}) {
  // the hilt wrapped in cord, a round guard in gold, the blade of light (a wavy temper line along it)
  const [dx, dy] = [Math.cos(a), Math.sin(a)];
  s.tube(hx - dx * 22, hy - dy * 22, hx + dx * 4, hy + dy * 4, 4.2, 'K');
  for (let t = -20; t < 4; t += 4) s.line(hx + dx * t - dy * 4, hy + dy * t + dx * 4, hx + dx * (t + 2) + dy * 4, hy + dy * (t + 2) - dx * 4, 0xb4241a, 1);
  s.ellipse(hx + dx * 6, hy + dy * 6, 9, 9, 'Y', { bias: 0.06 });
  s.paint([Math.min(hx, hx + dx * len) - 8, Math.min(hy, hy + dy * len) - 8, Math.max(hx, hx + dx * len) + 8, Math.max(hy, hy + dy * len) + 8], (x, y) => {
    const t = (x - hx) * dx + (y - hy) * dy;
    const n = -(x - hx) * dy + (y - hy) * dx;
    const curve = (t / len) ** 2 * 10; // (curved, as a katana is)
    return t > 9 && t < len && Math.abs(n + curve) < 3.6 * (1 - Math.max(0, (t - len + 16) / 16) * 0.8);
  }, 'B', (x, y) => {
    const n = -(x - hx) * dy + (y - hy) * dx;
    return 0.75 - Math.abs(n) * 0.05;
  }, { glow: true });
  for (let t = 12; t < len - 8; t += 1) {
    const curve = (t / len) ** 2 * 10;
    s.px(hx + dx * t - dy * (Math.sin(t * 0.5) * 1.2 - curve), hy + dy * t + dx * (Math.sin(t * 0.5) * 1.2 - curve), 0xffffff);
  }
  void o;
}

function thrusters(s, cx, y0, k = 1, bells = true) {
  mirror((sx) => {
    const x = cx + sx * 28;
    // the legs folded into nozzles: thigh plates over a bell of black steel, the flame below
    if (bells) {
    lames(s, [x - 16, y0, x + 16, y0 + 22], rect(x - 15, y0, x + 15, y0 + 22), { row: 8, lace: 10, base: 0.42 });
    s.poly([[x - 14, y0 + 22], [x + 14, y0 + 22], [x + 18, y0 + 44], [x - 18, y0 + 44]], 'K', { flat: 0.38, ...steel });
    for (const t of [0.35, 0.7]) s.line(x - 15 - t * 3, y0 + 22 + t * 22, x + 15 + t * 3, y0 + 22 + t * 22, GOLD, 1);
    s.ellipse(x, y0 + 44, 18, 5, 'K', { flat: 0.1 });
    }
    if (k <= 0) return;
    const fl = 26 * k;
    s.paint([x - 16, y0 + 44, x + 16, y0 + 46 + fl], (xx, y) => {
      const t = (y - y0 - 44) / Math.max(1, fl);
      return t >= 0 && t <= 1 && Math.abs(xx - x) < 15 * (1 - t * 0.85) + Math.sin(y * 0.9 + x) * 1.2 * t;
    }, 'J', (xx, y) => 0.95 - ((y - y0 - 44) / Math.max(1, fl)) * 0.7 - Math.abs(xx - x) * 0.02, { glow: true });
  });
}

// ---------------------------------------------------------------- phase 3: the frame
function frame(s, cx, cy) {
  // the spine, ribs of steel round the reactor's cage, cables hanging loose
  s.tube(cx, cy - 40, cx, cy + 50, 7, 'K', steel);
  for (let k = 0; k < 5; k++) {
    const y = cy - 34 + k * 14;
    mirror((sx) => {
      const pts = [[cx, y], [cx + sx * 34, y - 4], [cx + sx * 52, y + 6 - k], [cx + sx * 46, y + 14]];
      for (let i = 1; i < pts.length; i++) s.tube(...pts[i - 1], ...pts[i], 3, 'K');
    });
  }
  // the reactor: a sphere of light in a cage, glowing through
  s.paint([cx - 26, cy - 22, cx + 26, cy + 30], ellT(cx, cy + 4, 24, 24), 'R', (x, y) => {
    const d = Math.hypot(x - cx + 4, y - cy + 2) / 24;
    return 0.98 - d * 0.6;
  }, { glow: true });
  for (let a = 0; a < TAU; a += TAU / 8) s.line(cx + Math.cos(a) * 8, cy + 4 + Math.sin(a) * 8, cx + Math.cos(a) * 25, cy + 4 + Math.sin(a) * 25, 0x2a1c14, 2);
  for (const r of [12, 24]) for (let a = 0; a < TAU; a += 0.02) s.px(cx + Math.cos(a) * r, cy + 4 + Math.sin(a) * r, 0x2a1c14);
  // cables torn loose, a hazard-striped collar round the reactor's mount
  mirror((sx) => {
    for (let k = 0; k < 3; k++) {
      let [x, y] = [cx + sx * (30 + k * 6), cy - 30 + k * 4];
      for (let t = 0; t < 14; t++) {
        const [nx, ny] = [x + sx * (1.5 - t * 0.12), y + 3];
        s.tube(x, y, nx, ny, 1.6, k === 1 ? 'H' : 'N');
        [x, y] = [nx, ny];
      }
    }
  });
  hazard(s, [cx - 30, cy + 30, cx + 30, cy + 38], rect(cx - 30, cy + 30, cx + 30, cy + 38), 5);
}

// ---------------------------------------------------------------- the three forms
export function kuroganeForm(form) {
  const s = new HiSprite(KW, KH, RAMPS);
  const hy = 90; // the head's middle
  if (form === 'gantry') {
    gantry(s);
    legs(s, CX, 262, { clamp: true });
    skirt(s, CX, 222);
    // the arms down, fists on chains up to the beam
    mirror((sx) => arm(s, sx, [CX + sx * 78, 138], [CX + sx * 96, 182], [CX + sx * 94, 220], { shackle: true }));
    mirror((sx) => chain(s, CX + sx * 94, 212, CX + sx * 150, 30));
    torso(s, CX, 176);
    mirror((sx) => sode(s, CX + sx * 96, 116, sx));
    head(s, CX, hy);
  } else if (form === 'flight') {
    // the fans spread behind, the legs folded into thrusters, the blade drawn
    fan(s, CX - 52, 128, Math.PI * 0.98, Math.PI * 1.62, 132);
    fan(s, CX + 52, 128, -Math.PI * 0.62, -Math.PI * 0.02, 132);
    thrusters(s, CX, 236);
    skirt(s, CX, 222, 30);
    arm(s, -1, [CX - 78, 138], [CX - 100, 176], [CX - 92, 212], { bare: true, fist: false, hand: true });
    arm(s, 1, [CX + 78, 138], [CX + 104, 168], [CX + 120, 200], { bare: true, fist: false, hand: true });
    torso(s, CX, 176);
    mirror((sx) => sode(s, CX + sx * 96, 116, sx, 0, 1));
    katana(s, CX + 120, 212, -Math.PI * 0.32, 150);
    head(s, CX, hy);
  } else {
    // the frame: torn fans, sputtering thrusters, the armour gone, one arm reaching out
    fan(s, CX - 52, 128, Math.PI * 0.98, Math.PI * 1.62, 120, 1);
    fan(s, CX + 52, 128, -Math.PI * 0.62, -Math.PI * 0.02, 120, 2);
    thrusters(s, CX, 236, 0.45);
    frame(s, CX, 176);
    arm(s, -1, [CX - 62, 136], [CX - 92, 186], [CX - 70, 238], { bare: true, fist: false });
    // the grab: a claw of a hand, open
    const [gx, gy] = [CX - 66, 262];
    s.tube(CX - 70, 238, gx, gy - 6, 3.4, 'K'); // (the wrist, its last strut)
    s.tube(CX - 74, 238, gx - 5, gy - 4, 1.4, 'N');
    s.ellipse(gx, gy, 10, 9, 'K', { bias: 0.04, ...steel });
    for (const [dx, dy] of [[-12, 10], [-4, 16], [5, 16], [12, 9]]) s.tube(gx + dx * 0.4, gy + 4, gx + dx, gy + dy + 4, 2.4, 'K');
    arm(s, 1, [CX + 62, 136], [CX + 80, 170], [CX + 84, 200], { bare: true, fist: false });
    mirror((sx) => {
      s.ellipse(CX + sx * 66, 130, 15, 13, 'K', { bias: 0.04, ...steel }); // the bare shoulder joints
      for (let k = 0; k < 3; k++) s.tube(CX + sx * (58 + k * 6), 120, CX + sx * (64 + k * 9), 104 - k * 4, 1.4, k === 1 ? 'H' : 'N'); // torn cables
    });
    head(s, CX, hy, { crescent: false, crack: 2, eyes: ['flicker', 'dead'] });
  }
  return s.render({ outline: 2, rim: 0.08 });
}

/** A lantern drone (phase 2): a paper lantern on a rotor, a gun under it. f: the rotor's blur. */
export function lanternDrone(f) {
  const s = new HiSprite(78, 78, RAMPS);
  const [cx, cy] = [39, 42];
  s.paint([cx - 18, cy - 20, cx + 18, cy + 20], ellT(cx, cy, 16, 19), 'L', (x, y) => 0.55 + 0.3 * (1 - Math.hypot(x - cx + 4, y - cy + 4) / 20), { glow: true });
  for (let k = -3; k <= 3; k++) {
    const y = cy + k * 5;
    const w = 16 * Math.sqrt(Math.max(0, 1 - (k * 5 / 19) ** 2));
    s.line(cx - w, y, cx + w, y, 0x8a3000, 1);
  }
  s.paint([cx - 12, cy - 24, cx + 12, cy - 17], rect(cx - 12, cy - 24, cx + 12, cy - 17), 'K', () => 0.4, steel);
  s.paint([cx - 12, cy + 17, cx + 12, cy + 24], rect(cx - 12, cy + 17, cx + 12, cy + 24), 'K', () => 0.4, steel);
  s.tube(cx, cy + 24, cx, cy + 32, 2.6, 'C'); // its gun
  // the rotor over it, blurred
  const a = (f / 4) * Math.PI;
  for (const k of [0, 1]) {
    const b = a + k * Math.PI;
    s.line(cx, cy - 26, cx + Math.cos(b) * 30, cy - 26 + Math.sin(b) * 6, 0x8a909c, 2, 0.8);
  }
  s.ellipse(cx, cy - 26, 32, 7, 'C', { flat: 0.6 });
  s.dot(cx, cy - 26, 3, GOLD);
  return s.render({ outline: 2 });
}

// ================================================================ the parts the game moves (phase 13)
// Parts that stay on the body share its middle (frames the size of the whole mech, packed without their empty
// margins: { trim: true }); parts that fly about have frames of their own, and KURO_LAYOUT says where they sit
// (logical px from the body's middle). Wear 0-2: whole, cracked and chipped, broken open and scorched.
const MID = [CX, KH / 2];
const lg = (x, y) => [Math.round(((x - MID[0]) / 3) * 10) / 10, Math.round(((y - MID[1]) / 3) * 10) / 10];
const whole = () => new HiSprite(KW, KH, RAMPS);
const done = (s, o = {}) => s.render({ outline: 2, rim: 0.08, ...o });
/** A part on a frame of its own, w x h fine px, cut from the whole around (cx, cy). */
const own = (s, cx, cy, w, h, o) => done(s, o).crop(Math.round(cx - w / 2), Math.round(cy - h / 2), w, h);

/** Wear on what is drawn in the box: lacquer flaked off to the steel, cracks with a lit lip, scorch (2). */
function wear(s, [x0, y0, x1, y1], w, seed = 1) {
  if (!w) return;
  const R = (k, m = 0) => hash(k, seed + m, 77);
  const at = (x, y) => (x >= 0 && y >= 0 && x < s.w && y < s.h ? Math.floor(y) * s.w + Math.floor(x) : -1);
  for (let k = 0; k < 4 + 5 * w; k++) {
    const [cx, cy, r] = [x0 + R(k) * (x1 - x0), y0 + R(k, 50) * (y1 - y0), 2 + R(k, 100) * (1.5 + w * 2.2)];
    for (let y = Math.floor(cy - r); y <= cy + r; y++)
      for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        const i = at(x, y);
        if (i < 0 || (s.mat[i] !== 'V' && s.mat[i] !== 'F') || Math.hypot(x - cx, y - cy) > r * (0.65 + 0.35 * hash(x, y, seed))) continue;
        s.mat[i] = 'K';
        s.v[i] = 0.5 + (hash(x, y, seed + 3) - 0.5) * 0.2;
        s.over.delete(i);
      }
  }
  for (let k = 0; k < 2 + w * 3; k++) {
    let [x, y] = [x0 + R(k, 200) * (x1 - x0), y0 + R(k, 300) * (y1 - y0)];
    let a = R(k, 400) * TAU;
    for (let n = 0; n < 10 + w * 8; n++) {
      a += (R(k * 31 + n, 500) - 0.5) * 1.4;
      x += Math.cos(a) * 1.6;
      y += Math.sin(a) * 1.6;
      const i = at(x, y);
      if (i < 0 || !s.mat[i] || s.glow[i]) continue;
      s.px(x, y, INK);
      const j = at(x - 1, y - 1);
      if (j >= 0 && s.mat[j]) s.px(x - 1, y - 1, 0x8a8e9c);
    }
  }
  if (w >= 2)
    for (let k = 0; k < 5; k++) {
      const [cx, cy, r] = [x0 + R(k, 600) * (x1 - x0), y0 + R(k, 700) * (y1 - y0), 6 + R(k, 800) * 8];
      s.shade([cx - r, cy - r, cx + r, cy + r], (x, y) => Math.hypot(x - cx, y - cy) < r * (0.6 + 0.4 * hash(Math.floor(x), Math.floor(y), 9)), (x, y) => -0.22 * (1 - Math.hypot(x - cx, y - cy) / r));
    }
}

const HEAD_Y = 90;
const SHOULDER = (sx) => [CX + sx * 78, 138];
const ARM = { el: (sx) => [CX + sx * 96, 182], wr: (sx) => [CX + sx * 94, 220] };
const FLIGHT_R = [
  { el: [CX + 110, 118], wr: [CX + 124, 92] }, // the blade raised over the shoulder
  { el: [CX + 104, 168], wr: [CX + 120, 200] }, // held out
  { el: [CX + 90, 182], wr: [CX + 58, 222] }, // across the body, after the cut
];
const FAN = { l: [CX - 52, 128, Math.PI * 0.98, Math.PI * 1.62], r: [CX + 52, 128, -Math.PI * 0.62, -Math.PI * 0.02] };
const LEGS_Y = 262;
const JET_Y = 236 + 44;

/** The legs: standing (0), the knees coming up (1), folding (2), folded into nozzles (3). */
function legPose(s, k) {
  if (k === 0) return legs(s, CX, LEGS_Y);
  if (k === 3) return thrusters(s, CX, 236, 0);
  mirror((sx) => {
    const x = CX + sx * 30;
    const y0 = LEGS_Y - k * 12;
    lames(s, [x - 18, y0, x + 18, y0 + 30 - k * 4], rect(x - 17, y0, x + 17, y0 + 30 - k * 4), { row: 8, lace: 10, base: 0.42 });
    const ky = y0 + 34 - k * 4;
    s.ellipse(x, ky, 12, 10 - k, 'K', { bias: 0.04, ...steel });
    const shin = 44 * (1 - 0.32 * k); // (foreshortened as the shin swings up behind)
    s.paint([x - 16, ky, x + 16, ky + shin], (xx, y) => Math.abs(xx - x) < 15 - (y - ky) * 0.06 && y > ky + 2 && y < ky + shin, 'K', lit(x - 15, ky, x + 15, ky + shin, 0.34), steel);
    for (const dx of [-8, 0, 8]) s.line(x + dx, ky + 4, x + dx * 0.9, ky + shin - 2, GOLD, 1);
    // the foot turning over into the nozzle's bell
    const fy = ky + shin;
    const bell = k / 3;
    s.poly([[x - 18 + bell * 4, fy], [x + 18 - bell * 4, fy], [x + 20, fy + 10 + bell * 8], [x - 20, fy + 10 + bell * 8]], 'K', { flat: 0.36, ...steel });
    s.ellipse(x, fy + 10 + bell * 8, 20, 3 + bell * 2, 'K', { flat: 0.12 });
    hazard(s, [x - 20, fy + 6, x + 20, fy + 9], rect(x - 19, fy + 6, x + 19, fy + 9), 4);
  });
}

/** The thrust under the nozzles: f the flicker, k the strength (1 full; .45 the frame's sputter). */
function jet(s, f, k = 1) {
  mirror((sx) => {
    const x = CX + sx * 28;
    const fl = (24 + [0, 4, 1, 6][f]) * k;
    s.paint([x - 16, JET_Y, x + 16, JET_Y + fl + 2], (xx, y) => {
      const t = (y - JET_Y) / Math.max(1, fl);
      return t >= 0 && t <= 1 && Math.abs(xx - x) < 15 * (1 - t * 0.85) + Math.sin(y * 0.9 + x + f * 1.7) * 1.4 * t;
    }, 'J', (xx, y) => 0.98 - ((y - JET_Y) / Math.max(1, fl)) * 0.7 - Math.abs(xx - x) * 0.02, { glow: true });
    for (let n = 0; n < 4; n++) s.dot(x + (hash(n, f, 3) - 0.5) * 16, JET_Y + fl + 2 + hash(n, f, 4) * 8 * k, 1, 0xffd070);
  });
}

/** The chest cannon's flash. */
function muzzle(s, f) {
  const [x, y] = [CX, 184];
  s.paint([x - 22, y - 10, x + 22, y + 34], (xx, yy) => {
    const d = Math.hypot((xx - x) / (f ? 20 : 14), (yy - y - 6) / (f ? 26 : 16));
    return d < 1 && (Math.floor(Math.atan2(yy - y, xx - x) * 4) % 2 === 0 || d < 0.6);
  }, 'L', (xx, yy) => 1 - Math.hypot(xx - x, yy - y) / 30, { glow: true });
}

/** The eyes' light, moving across them (f 0-3), flaring (hot), or the one eye left flickering (phase 3). */
function eyesLight(s, kind, f = 0) {
  const E = [[CX - 15, HEAD_Y + 10], [CX + 15, HEAD_Y + 10]];
  E.forEach(([ex, ey], i) => {
    if (kind === 'flicker' && i === 1) return;
    s.paint([ex - 9, ey - 7, ex + 9, ey + 7], ellT(ex, ey, 7.2, 5.2), 'L', (x) => {
      if (kind === 'hot') return 0.98;
      if (kind === 'flicker') return f ? 0.95 : 0.4;
      const band = (((x - (CX - 26)) / 52) * 4 - f + 4) % 4; // (a light sliding across, left to right)
      return 0.55 + 0.45 * Math.max(0, 1 - Math.abs(band - 1.5) * 1.3);
    }, { glow: true });
    for (const dy of [-2.5, 0, 2.5]) s.line(ex - 6, ey + dy, ex + 6, ey + dy, 0xc85a00, 1, 0.6);
  });
}

/** The reactor's heat, pulsing (f 0-3): a glow over the cage. */
function core(s, f) {
  const [x, y] = [CX, 180];
  const r = 26 + [0, 3, 5, 2][f];
  s.paint([x - r, y - r, x + r, y + r], (xx, yy) => Math.hypot(xx - x, yy - y) < r, 'R', (xx, yy) => 0.98 - (Math.hypot(xx - x, yy - y) / r) * 0.8, { glow: true });
  for (let a = 0; a < TAU; a += TAU / 8) s.line(x + Math.cos(a + f * 0.1) * 9, y + Math.sin(a + f * 0.1) * 9, x + Math.cos(a + f * 0.1) * 26, y + Math.sin(a + f * 0.1) * 26, 0x2a1c14, 2);
}

function rocket(f) {
  const s = new HiSprite(18, 36, RAMPS);
  s.tube(9, 4, 9, 22, 3.4, 'C');
  s.ellipse(9, 4, 3.4, 3, 'V', { bias: 0.1 });
  s.line(5, 6, 13, 6, GOLD, 1);
  s.poly([[4, 18], [9, 22], [14, 18], [15, 24], [3, 24]], 'K', { flat: 0.4 });
  s.paint([4, 24, 14, 35], (x, y) => Math.abs(x - 9) < 4 * (1 - (y - 24) / (10 + f * 2)), 'J', (x, y) => 0.95 - (y - 24) * 0.05, { glow: true });
  return s.render({ outline: 2 });
}

function strut() {
  const s = new HiSprite(27, 72, RAMPS);
  s.tube(13.5, 6, 13.5, 66, 4.6, 'K', steel);
  s.tube(19, 12, 19, 60, 1.8, 'C');
  s.ellipse(13.5, 6, 6, 6, 'K', { bias: 0.04 });
  s.ellipse(13.5, 66, 6, 6, 'K', { bias: 0.04 });
  rivets(s, [[13.5, 6], [13.5, 66]], 1.2);
  s.tube(9, 14, 8, 58, 1.4, 'N');
  return s.render({ outline: 2 });
}

/** The grabbing hand of the frame: open (0), closing (1), shut on nothing (2); its palm in the frame's middle. */
function claw(k) {
  const s0 = new HiSprite(99, 99, RAMPS);
  const s = zoomed(s0, 49.5, 45, 1.5); // (drawn half as big again as its numbers)
  const [cx, cy] = [49.5, 45];
  s.ellipse(cx, cy, 11, 10, 'K', { bias: 0.04, ...steel });
  const spread = [1, 0.6, 0.2][k];
  for (const [i, base] of [[-1.5, -0.5], [-0.5, -0.15], [0.5, 0.15], [1.5, 0.5]]) {
    const a = Math.PI / 2 + base * spread * 1.4;
    const [x1, y1] = [cx + i * 5, cy + 6];
    const [x2, y2] = [x1 + Math.cos(a) * 12, y1 + Math.sin(a) * 12];
    const curl = (1 - spread) * 1.4 * (i < 0 ? -1 : 1);
    const [x3, y3] = [x2 + Math.cos(a - curl) * 9, y2 + Math.sin(a - curl) * 9];
    s.tube(x1, y1, x2, y2, 2.6, 'K');
    s.tube(x2, y2, x3, y3, 2.2, 'K');
    s.dot(x3, y3, 1.6, 0xc8ccd8);
  }
  s.tube(cx - 12, cy - 4, cx - 16, cy + 10, 2.6, 'K'); // the thumb
  s.tube(cx, cy - 10, cx, cy - 26, 3.6, 'K'); // the wrist
  s.tube(cx + 3, cy - 10, cx + 4, cy - 26, 1.4, 'N');
  return s0.render({ outline: 2 });
}

/** What is left at the shoulder when an arm is torn off: the joint, cables torn short, a glow in the socket. */
function stump(s, sx) {
  const [x, y] = SHOULDER(sx);
  s.ellipse(x, y, 14, 14, 'K', { bias: 0.04, ...steel });
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 2 + sx * (0.2 + k * 0.25);
    s.tube(x, y, x + Math.cos(a) * (10 + k * 3), y + Math.sin(a) * (10 + k * 3), 1.6, k % 2 ? 'N' : 'H');
  }
  s.ellipse(x, y + 2, 7, 6, 'K', { flat: 0.1 });
  s.paint([x - 4, y - 2, x + 4, y + 6], ellT(x, y + 2, 4, 3.4), 'L', () => 0.7, { glow: true });
}

export const KURO_LAYOUT = {};

/**
 * How the parts lie over one another, back to front, in each form (the game gives them depths in this order).
 * gantry: the crane and the mech in it; flight: on its fans; frame: the armour gone.
 */
export const KURO_ORDER = {
  gantry: ['kg_gantry_top', 'kg_gantry_l', 'kg_gantry_r', 'kg_legs', 'kg_arm_l', 'kg_arm_r', 'kg_fist_l', 'kg_fist_r', 'kg_body', 'kg_flash', 'kg_eyes', 'kg_sode_l', 'kg_sode_r', 'kg_clamp_l', 'kg_clamp_r'],
  flight: ['kg_fan_l', 'kg_fan_r', 'kg_jet', 'kg_legs', 'kg_barm_l', 'kg_body', 'kg_eyes', 'kg_sode_l', 'kg_sode_r', 'kg_barm_r', 'kg_katana'],
  frame: ['kg_fan_l', 'kg_fan_r', 'kg_jetw', 'kg_legs', 'kg_strut', 'kg_claw', 'kg_frame', 'kg_core', 'kg_eye_flicker'],
};

/**
 * The change from the crane to flight (the plan's 1.5 s interlude), as key frames the game plays through (at time t,
 * in seconds): the arms already gone; the clamps swing back (deg), the crane's legs topple outward (deg) and fall, its
 * beam lifts away; the legs fold up into nozzles, the thrust lights; the fans open; the bare arms come out and the
 * blade is drawn over the shoulder. Fields not given carry on from the frame before.
 */
export const KURO_TRANSFORM = [
  { t: 0, legs: 0, eyes: 'hot', clamp: 0, crane: 0, beam: 0, fans: -1, jet: 0, arms: 'stump', blade: 0 },
  { t: 0.15, clamp: 35 },
  { t: 0.3, clamp: 70, crane: 6, beam: -6 }, // (the chains snap)
  { t: 0.45, crane: 22, beam: -20, legs: 1 },
  { t: 0.6, crane: 48, beam: -40, legs: 2 },
  { t: 0.75, crane: 80, beam: -70, legs: 3, jet: 0.45 }, // (the crane gone off the screen's edges)
  { t: 0.9, jet: 1, fans: 0, eyes: 'scan' },
  { t: 1.05, fans: 1, arms: 'bare' },
  { t: 1.2, fans: 2, blade: 0.5 },
  { t: 1.35, fans: 3, blade: 1 },
  { t: 1.5 },
];

export function kuroganeEnemies(add) {
  const T = { trim: true };
  const part = (name, draw, o) => {
    const s = whole();
    draw(s);
    add(name, done(s, o), T);
  };
  // ---- the crane: two legs, the beam with its trolley, the clamps (frames of their own: they fall away)
  {
    const piece = (k) => {
      const s = whole();
      gantry(s, k);
      return done(s);
    };
    const [legsR, topR, clampR] = [piece('legs'), piece('top'), piece('clamps')];
    for (const [name, r, x, y, w, h] of [['kg_gantry_l', legsR, 23, KH / 2, 42, KH], ['kg_gantry_r', legsR, KW - 23, KH / 2, 42, KH], ['kg_gantry_top', topR, CX, 40, KW, 80], ['kg_clamp_l', clampR, 84, 132, 120, 42], ['kg_clamp_r', clampR, KW - 84, 132, 120, 42]]) {
      add(name, r.crop(Math.round(x - w / 2), Math.round(y - h / 2), w, h));
      KURO_LAYOUT[name] = lg(x, y);
    }
  }
  // ---- the body (torso, skirt, head), its wear
  for (let w = 0; w < 3; w++)
    part(`kg_body_${w}`, (s) => {
      skirt(s, CX, 222);
      torso(s, CX, 176);
      wear(s, [CX - 66, 134, CX + 66, 270], w, 21);
      head(s, CX, HEAD_Y);
    });
  // ---- the legs folding, the thrust
  for (let k = 0; k < 4; k++) part(`kg_legs_${k}`, (s) => legPose(s, k));
  for (let f = 0; f < 4; f++) {
    part(`kg_jet_${f}`, (s) => jet(s, f, 1), { outline: 0 });
    part(`kg_jetw_${f}`, (s) => jet(s, f, 0.45), { outline: 0 });
  }
  // ---- the shoulder plates: hatches shut, opening, open; wear
  for (const [side, sx] of [['l', -1], ['r', 1]])
    for (let p = 0; p < 3; p++) for (let w = 0; w < 3; w++) part(`kg_sode_${side}_${p}_${w}`, (s) => sode(s, CX + sx * 96, 116, sx, p, w));
  // ---- the arms (the fist on a frame of its own), what is left when one is torn off
  for (const [side, sx] of [['l', -1], ['r', 1]]) {
    for (let w = 0; w < 3; w++) {
      part(`kg_arm_${side}_${w}`, (s) => {
        arm(s, sx, SHOULDER(sx), ARM.el(sx), ARM.wr(sx), { fist: false });
        wear(s, [CX + sx * 70 - 20, 130, CX + sx * 104 + 20, 230], w, 31 + sx);
      });
      const s = whole();
      const [fx, fy] = [ARM.wr(sx)[0], ARM.wr(sx)[1] + 18];
      fist(s, fx, fy, sx, true);
      wear(s, [fx - 18, fy - 20, fx + 18, fy + 18], w, 41 + sx);
      add(`kg_fist_${side}_${w}`, own(s, fx, fy - 6, 51, 63));
      KURO_LAYOUT[`fist_${side}`] = lg(fx, fy - 6);
      KURO_LAYOUT[`chain_${side}`] = lg(CX + sx * 150, 30); // (where its chain hangs from the beam)
    }
    part(`kg_stump_${side}`, (s) => stump(s, sx));
  }
  {
    const s = new HiSprite(18, 18, RAMPS);
    s.ellipse(9, 9, 4.4, 6, 'C', { bias: 0.05 });
    s.ellipse(9, 9, 2, 3.4, 'K', { flat: 0.1 });
    add('kg_link_0', s.render({ outline: 2 }));
    const t = new HiSprite(18, 18, RAMPS);
    t.ellipse(9, 9, 2.4, 6, 'C', { bias: 0.05 });
    add('kg_link_1', t.render({ outline: 2 }));
  }
  {
    // the mint ring round a fist coming back (open to hits)
    const s = new HiSprite(69, 69, RAMPS);
    for (let a = 0; a < TAU; a += 0.01) for (const [r, c] of [[30, 0x81f3cc], [31, 0x81f3cc], [32.5, 0xffffff]]) s.px(34.5 + Math.cos(a) * r, 34.5 + Math.sin(a) * r, c, 0.9);
    add('kg_fist_ring', s.render({ outline: 0 }));
  }
  part('kg_flash_0', (s) => muzzle(s, 0), { outline: 0 });
  part('kg_flash_1', (s) => muzzle(s, 1), { outline: 0 });
  KURO_LAYOUT.muzzle = lg(CX, 184);
  KURO_LAYOUT.pods = { l: lg(CX - 96, 128), r: lg(CX + 96, 128) };
  // ---- in flight: bare arms (the right one in three places for its cuts), the blade, the fans opening
  part('kg_barm_l', (s) => arm(s, -1, SHOULDER(-1), [CX - 100, 176], [CX - 92, 212], { bare: true, fist: false, hand: true }));
  FLIGHT_R.forEach(({ el, wr }, k) => {
    part(`kg_barm_r_${k}`, (s) => arm(s, 1, SHOULDER(1), el, wr, { bare: true, fist: false, hand: true }));
    KURO_LAYOUT[`hand_${k}`] = lg(wr[0], wr[1] + 12);
  });
  {
    const s = new HiSprite(60, 198, RAMPS);
    katana(s, 30, 164, -Math.PI / 2, 150);
    add('kg_katana', s.render({ outline: 2 }));
    KURO_LAYOUT.katanaOrigin = [0.5, Math.round((164 / 198) * 1000) / 1000]; // (the hilt: turn it about there)
  }
  for (const [side, [px, py, a0, a1]] of Object.entries(FAN)) {
    const mid = (a0 + a1) / 2;
    for (let k = 0; k < 4; k++) {
      const open = [0.08, 0.35, 0.7, 1][k];
      const half = ((a1 - a0) / 2) * open;
      const tilt = (1 - open) * (side === 'l' ? -0.6 : 0.6); // (folded, it lies back along the body)
      part(`kg_fan_${side}_${k}`, (s) => fan(s, px, py, mid - half + tilt, mid + half + tilt, 132 * [0.55, 0.8, 0.95, 1][k]));
    }
    part(`kg_fan_${side}_x`, (s) => fan(s, px, py, a0, a1, 120, side === 'l' ? 1 : 2));
    KURO_LAYOUT[`fan_${side}`] = lg(px, py);
  }
  // ---- the frame: the body without its armour, the reactor's heat, the arm that grabs (struts and a claw)
  part('kg_frame', (s) => {
    frame(s, CX, 176);
    arm(s, 1, [CX + 62, 136], [CX + 80, 170], [CX + 84, 200], { bare: true, fist: false });
    mirror((sx) => {
      s.ellipse(CX + sx * 66, 130, 15, 13, 'K', { bias: 0.04, ...steel });
      for (let k = 0; k < 3; k++) s.tube(CX + sx * (58 + k * 6), 120, CX + sx * (64 + k * 9), 104 - k * 4, 1.4, k === 1 ? 'H' : 'N');
    });
    head(s, CX, HEAD_Y, { crescent: false, crack: 2, eyes: ['dim', 'dead'] });
  });
  for (let f = 0; f < 4; f++) part(`kg_core_${f}`, (s) => core(s, f), { outline: 0 });
  KURO_LAYOUT.core = lg(CX, 180);
  KURO_LAYOUT.grab = lg(CX - 66, 130); // (the grabbing arm's shoulder)
  add('kg_strut', strut());
  for (let k = 0; k < 3; k++) add(`kg_claw_${k}`, claw(k));
  // ---- the eyes' light
  for (let f = 0; f < 4; f++) part(`kg_eyes_${f}`, (s) => eyesLight(s, 'scan', f), { outline: 0 });
  part('kg_eyes_hot', (s) => eyesLight(s, 'hot'), { outline: 0 });
  for (let f = 0; f < 2; f++) part(`kg_eye_flicker_${f}`, (s) => eyesLight(s, 'flicker', f), { outline: 0 });
  KURO_LAYOUT.eyes = lg(CX, HEAD_Y + 10);
  // ---- its bullets, its drones, its portrait
  add('kg_rocket_0', rocket(0));
  add('kg_rocket_1', rocket(1));
  for (let f = 0; f < 4; f++) add(`kg_drone_${f}`, lanternDrone(f));
  {
    const s = whole();
    head(s, CX, HEAD_Y);
    add('kg_portrait', own(s, CX, HEAD_Y - 6, 165, 171));
  }
}
