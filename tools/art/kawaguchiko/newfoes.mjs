// Kawaguchiko's looks for the three shared behaviours (src/game/enemies/chainSplitCart.js, docs/plan-silniejsze-fale.md),
// drawn at 540 px with HiSprite:
//   chain  - koinobori, the carp streamers, strung on a line across Honcho-dori between two poles topped with their
//            arrow wheels (yaguruma) and gilt balls; the wind blows along the line, so each carp streams out from its
//            hoop towards the next: the black father, the red mother, the blue child in turn. The one that wakes is a
//            black carp - its painted eye rolls red and its mouth gapes (these shoot); one catching fire from its
//            tail, the charred hoop left on the line with a rag of cloth
//   split  - a chestnut burr fallen in the maple corridor, split open in four, two glossy chestnuts inside glaring
//            in turn, a maple leaf caught on its spines; then each chestnut on its own, its pale base and its tuft,
//            a spine still stuck in it
//   cart   - a swan pedal boat of the lake gone wild, paddling itself down the water: the white body with its wings
//            raised along the sides, the cockpit with its two seats, pedals and tiller, the long neck at the bow,
//            the orange beak and its black knob, the paddle wheel churning white at the stern under the tail, its
//            wake spreading behind; it breaks up in three stages (the neck knocked askew and cracked at its root:
//            it glares red; the paddle wheel torn off, a crank swinging, the boat yawing; its side stove in, the
//            lake pouring into the cockpit, listing), its wreck awash: only the bent neck, a wing and a seat
//            cushion above the water, rings spreading from it
import { HiSprite, tones, speckle, mottle } from '../../lib/hisprite.mjs';

const INK = 0x14101c;
const TAU = Math.PI * 2;
const RAMPS = {
  kk: tones([0x10121e, 0x2a3048, 0x6a7a9e]), // the black carp
  kr: tones([0x7a0e10, 0xd8241e, 0xff7a5a]), // the red
  kb: tones([0x0e2a6a, 0x2a5ad0, 0x7aa8ff]), // the blue
  kw: tones([0xa8a8a0, 0xeeeee8, 0xffffff]), // their white bellies and eyes
  gd: tones([0x8a5a10, 0xe0a830, 0xfff0a0]), // gilt
  pl: tones([0x4a3a28, 0x8a7458, 0xc8b490]), // the pole, weathered wood
  fl: tones([0xb82a08, 0xff8a1a, 0xfff2a0]), // flame
  ch: tones([0x0e0a08, 0x2a201a, 0x4a3a30]), // charred
  ig: tones([0x3a4a12, 0x7a9a2a, 0xc8d870]), // the burr's green, going brown at the tips
  ib: tones([0x4a3014, 0x8a6a30, 0xc8a860]), // its brown spines
  ku: tones([0x2a120a, 0x6a2e14, 0xb8643a]), // the chestnut's glossy brown
  kp: tones([0x8a7a5a, 0xd8c8a0, 0xf4ecd0]), // its pale base
  mj: tones([0x7a1408, 0xd8401a, 0xffa050]), // a maple leaf
  sw: tones([0x9aa0aa, 0xe8ecf0, 0xffffff]), // the swan's white fibreglass
  sg: tones([0x5a606a, 0x9aa2ae, 0xd0d6de]), // its wings' grey tips
  be: tones([0xa84a08, 0xf08a1a, 0xffc860]), // the beak
  st: tones([0xa82a4a, 0xe86a8a, 0xffb0c0]), // the seats, pink
  fd: tones([0x3a4a5a, 0x6a7a8c, 0xa8b8ca]), // the cockpit's floor
  pd: tones([0x2a2e36, 0x4a525e, 0x8a94a2]), // the pedals and the tiller
  wh: tones([0x4a3a2a, 0x8a7458, 0xc8b490]), // the paddle wheel's wood
  wa: [0x1a4a5a, 0x2e6a78, 0x6aa8b8, 0xc8e8f0, 0xffffff], // the lake churned white
};

// ---------------------------------------------------------------- chain: a koinobori (42 x 24), its hoop at x 4
const CARP = ['kk', 'kr', 'kb'];
/** Half the carp's width t along it (0 the hoop, 1 the tail's root), the cloth filling with the wind in waves. */
const girth = (t, f) => (t < 0 ? 0 : 8.6 * (1 - 0.45 * t) * (0.92 + Math.sin(t * 7.5 - f * 1.6) * 0.08));
function koi(kind, f = 0) {
  const s = new HiSprite(42, 24, RAMPS);
  const [hx, cy, len] = [4, 12, 29]; // the hoop's x, the line the carp streams along, its body's length
  const mat = kind === 'burnt' ? 'ch' : kind === 'eye' || kind === 'lit' ? 'kk' : CARP[kind];
  if (kind === 'burnt') {
    // the charred hoop on the line, a rag of cloth hanging off it, its edge glowing
    s.paint([hx - 3, cy - 10, hx + 3, cy + 10], (x, y) => Math.abs(Math.hypot((x - hx) * 2.6, y - cy) - 7.6) < 1, 'pl', () => 0.3);
    s.poly([[hx + 1, cy - 7], [hx + 11, cy - 5], [hx + 14, cy], [hx + 8, cy + 4], [hx + 1, cy + 6]], 'ch', { flat: 0.45, pat: speckle({ amt: 0.3, seed: 4 }) });
    for (const [x, y] of [[hx + 13, cy - 1], [hx + 8, cy + 4]]) s.dot(x, y, 0.8, 0xff7020, 0.9);
    return s.render({ outline: 2 });
  }
  const at = (x) => (x - hx) / len;
  const sway = (x) => Math.sin(at(x) * 5 - f) * 0.8 * at(x); // (the cloth flapping, more towards the tail)
  // the tail: two lobes forking from its root, flapping
  const tx = hx + len;
  for (const sy of [-1, 1]) s.poly([[tx - 1, cy + sway(tx) + sy * 0.6], [tx + 5, cy + sway(tx) + sy * 4.4], [tx + 8.6, cy + sway(tx) + sy * 9 + Math.sin(f + sy) * 1.1], [tx + 3, cy + sway(tx) + sy * 1.8]], mat, { flat: sy < 0 ? 0.62 : 0.42 });
  // the body: a tube of cloth, rounder where the wind fills it, lit from above
  s.paint([hx, cy - 11, tx + 0.5, cy + 11], (x, y) => Math.abs(y - cy - sway(x)) < girth(at(x), f), mat, (x, y) => 0.68 - ((y - cy - sway(x)) / (girth(at(x), f) + 0.01)) * 0.22 - at(x) * 0.08);
  // its pale belly showing along the lower edge
  s.paint([hx + 3, cy, tx, cy + 11], (x, y) => { const d = y - cy - sway(x); const g = girth(at(x), f); return d > g * 0.55 && d < g; }, 'kw', () => 0.45);
  // the scales painted on the cloth in rows of arcs, the gilt line along its back
  for (let x = hx + 9; x < tx - 1; x += 3.4)
    for (let k = -1; k <= 1; k++) {
      const y = cy + sway(x) + k * girth(at(x), f) * 0.5 + ((x / 3) % 2) * 0.8;
      for (let a = -1.1; a <= 1.1; a += 0.35) s.px(x - 1.4 + Math.cos(a) * 1.6, y + Math.sin(a) * 1.6, mat === 'kk' ? 0xe0b850 : 0xffffff, 0.6);
    }
  for (let x = hx + 4; x < tx; x += 0.5) s.px(x, cy + sway(x) - girth(at(x), f) * 0.15, 0xffe080, 0.35);
  // the little fins at its sides, a third of the way along
  for (const sy of [-1, 1]) s.poly([[hx + 11, cy + sway(hx + 11) + sy * girth(0.24, f)], [hx + 15, cy + sway(hx + 15) + sy * (girth(0.36, f) + 3)], [hx + 17, cy + sway(hx + 17) + sy * girth(0.4, f)]], mat, { flat: 0.35 });
  // the hoop it is tied by at its mouth, the cord to the line
  s.paint([hx - 3, cy - 10, hx + 3, cy + 10], (x, y) => Math.abs(Math.hypot((x - hx) * 2.6, y - cy) - (kind === 'eye' ? 8.4 : 7.6)) < 0.9, 'pl', () => 0.75);
  // the big painted eye: a white disc ringed, the pupil - which, woken, rolls red; the mouth gaping round the hoop
  const ex = hx + 6.2;
  for (const sy of [-1, 1]) {
    const ey = cy + sy * 4.4;
    s.ellipse(ex, ey, 3, 3, 'kw', { flat: 0.95 });
    s.paint([ex - 4, ey - 4, ex + 4, ey + 4], (x, y) => Math.abs(Math.hypot(x - ex, y - ey) - 3) < 0.5, 'K', () => 0.2);
    if (kind === 'eye') {
      s.dot(ex + 0.4, ey + (f ? 0.7 : -0.6) * sy, 1.8, 0xff3a20);
      s.dot(ex + 0.4, ey + (f ? 0.7 : -0.6) * sy, 0.8, INK);
      s.line(ex - 3.4, ey - sy * 3.4, ex + 3.6, ey - sy * 2.4, INK, 1.2); // (its scowl)
    } else {
      s.dot(ex + 0.3, ey, 1.7, INK);
      s.dot(ex - 0.5, ey - 0.8, 0.6, 0xffffff);
    }
  }
  if (kind === 'eye') s.ellipse(hx, cy, 2, 5.4, 'K', { flat: 0.2 }); // (its throat, dark inside the gaping mouth)
  if (kind === 'lit') {
    // fire catching at the tail and eating up the cloth, the edge glowing
    s.paint([hx + 12, cy - 11, tx + 9, cy + 11], (x, y) => x > tx - 9 - Math.sin(y * 0.9 + f) * 2 && Math.abs(y - cy) < 10, 'ch', () => 0.4);
    for (let k = -1; k <= 1; k++) s.ellipse(tx - 3 - ((f + k + 2) % 3) * 2.6, cy + k * 4.6, 6, 3.2, 'fl', { flat: 0.8, glow: true });
    for (let i = 0; i < 5; i++) s.dot(tx + 2 + ((i + f) % 3) * 2, cy - 8 + i * 4, 0.8, 0xfff2a0);
  }
  return s.render({ outline: 2 });
}

/** A koinobori pole seen from above (24 x 24): its arrow wheel, the yaguruma, round the gilt ball at its top, the
 * line's turns about it. */
function pole() {
  const s = new HiSprite(24, 24, RAMPS);
  const c = 12;
  // the line tied round the pole, going off both ways
  s.tube(0, c + 1, 24, c + 1, 0.7, 'pl', { flat: 0.4 });
  // the yaguruma: eight spokes with arrowheads, turned a little in the wind, their fletching gilt
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU + 0.2;
    const [ux, uy] = [Math.cos(a), Math.sin(a)];
    s.line(c, c, c + ux * 9.6, c + uy * 9.6, 0xc8ccd4, 1);
    s.poly([[c + ux * 7.2 - uy * 1.8, c + uy * 7.2 + ux * 1.8], [c + ux * 10.6, c + uy * 10.6], [c + ux * 7.2 + uy * 1.8, c + uy * 7.2 - ux * 1.8]], 'gd', { flat: 0.6 });
  }
  // the gilt ball (kago-dama) at the top
  s.ellipse(c, c, 3, 3, 'gd', { bias: 0.2 });
  return s.render({ outline: 2 });
}

// ---------------------------------------------------------------- split: a chestnut burr (46 x 46), a chestnut (28 x 28)
/** A chestnut at (x, y), its point at angle `a` (0: up the frame): glossy, its pale base, eyes glaring or not. */
function chestnut(s, x, y, a, f, glare, r = 7.4, brows = true) {
  const [ux, uy] = [Math.sin(a), -Math.cos(a)]; // towards its point
  const [vx, vy] = [-uy, ux];
  const at = (p, q) => [x + vx * p + ux * q, y + vy * p + uy * q];
  // the body: round, swelling into the shoulders, tapering to the point
  s.paint([x - r - 4, y - r - 4, x + r + 4, y + r + 4], (px, py) => {
    const dx = px - x, dy = py - y;
    const p = dx * vx + dy * vy, q = dx * ux + dy * uy;
    const w = r * 0.86 * (q > 0 ? Math.max(0, 1 - (q / (r * 1.3)) ** 2) ** 0.7 : Math.sqrt(Math.max(0, 1 - (q / (r * 0.95)) ** 2)));
    return q > -r * 0.95 && q < r * 1.25 && Math.abs(p) < w;
  }, 'ku', (px, py) => 0.62 - (px - x) * 0.02 - (py - y) * 0.025, { pat: mottle({ amt: 0.04, scale: 3, seed: 7 }) });
  // its gloss, the streaks along it
  for (let k = -2; k <= 2; k++) {
    const [ax, ay] = at(k * 1.8, -r * 0.6);
    const [bx, by] = at(k * 1.2, r * 0.9);
    s.line(ax, ay, bx, by, 0x2a120a, 1, 0.35);
  }
  const [gx, gy] = at(-r * 0.4, r * 0.1);
  s.dot(gx, gy, 1.4, 0xffe0c0, 0.75);
  // the pale base, rough, and the tuft at its point
  s.paint([x - r - 3, y - r - 3, x + r + 3, y + r + 3], (px, py) => {
    const dx = px - x, dy = py - y;
    const q = dx * ux + dy * uy, p = dx * vx + dy * vy;
    return q < -r * 0.52 && q > -r * 0.95 && Math.abs(p) < r * Math.sqrt(Math.max(0, 1 - (q / (r * 0.95)) ** 2)) - 0.3;
  }, 'kp', () => 0.55, { pat: speckle({ amt: 0.3, seed: 3 }) });
  for (let k = -1; k <= 1; k++) {
    const [ax, ay] = at(0, r * 1.2);
    s.line(ax, ay, ax + ux * 2.2 + vx * k * 1.2, ay + uy * 2.2 + vy * k * 1.2, 0xd8c8a0, 1);
  }
  // its face, on its broad middle
  for (const sx of [-1, 1]) {
    const [ex, ey] = at(sx * r * 0.44, -r * 0.02);
    s.ellipse(ex, ey, 1.3, glare ? 1.3 : 0.5, 'K', { flat: 0.2 });
    if (glare) s.dot(ex, ey + 0.2, 0.7, 0xff3a20);
    const [bx, by] = at(sx * r * 0.2, r * 0.26);
    const [cx2, cy2] = at(sx * r * 0.62, r * 0.2);
    if (brows) s.line(bx, by, cx2, cy2, INK, 1.1);
  }
}

/** The burr's spines: short straight needles in tufts, `n` round a ring, brown at their tips. */
function spines(s, x, y, rx, ry, from, to, seed, len = 5) {
  for (let k = 0; k < 90; k++) {
    const a = from + ((to - from) * k) / 90 + Math.sin(k * 12.9898 + seed) * 0.03;
    const [ox, oy] = [x + Math.cos(a) * rx, y + Math.sin(a) * ry];
    const l = len * (0.7 + ((k * 7 + seed) % 5) * 0.1);
    const b = a + Math.sin(k * 3.1 + seed) * 0.45;
    s.line(ox, oy, ox + Math.cos(b) * l * 0.55, oy + Math.sin(b) * l * 0.55, 0x8a9a3a, 1);
    s.line(ox + Math.cos(b) * l * 0.55, oy + Math.sin(b) * l * 0.55, ox + Math.cos(b) * l, oy + Math.sin(b) * l, 0xc8a860, 1);
  }
}

function burr(f) {
  const s = new HiSprite(46, 46, RAMPS);
  const c = 23;
  const breathe = [0, 0.6, 1, 0.6][f]; // (the four lobes opening a little and closing, the spines bristling)
  // the four lobes of the husk, split open from the top, thick and green, felted inside
  for (let q = 0; q < 4; q++) {
    const a = (q / 4) * TAU;
    const [ux, uy] = [Math.cos(a), Math.sin(a)];
    const ox = c + ux * (6.4 + breathe), oy = c + uy * (6.4 + breathe);
    s.paint([ox - 13, oy - 13, ox + 13, oy + 13], (x, y) => {
      const dx = x - ox, dy = y - oy;
      const along = dx * ux + dy * uy, side = -dx * uy + dy * ux;
      return along > -5 && along < 9 && Math.abs(side) < 9.6 * Math.sqrt(Math.max(0, 1 - ((along - 2) / 7.6) ** 2));
    }, 'ig', (x, y) => 0.6 - (x - c) * 0.012 - (y - c) * 0.012, { pat: speckle({ amt: 0.2, seed: q + 2 }) });
  }
  // the splits between the four lobes, gaping dark down to the felt
  for (let q = 0; q < 4; q++) {
    const a = (q / 4) * TAU + TAU / 8;
    s.paint([c - 18, c - 18, c + 18, c + 18], (x, y) => {
      const d = Math.hypot(x - c, y - c);
      const off = Math.abs(-(x - c) * Math.sin(a) + (y - c) * Math.cos(a));
      return d > 11.6 && d < 16.6 && off < 1.1 + breathe * 0.5 && (x - c) * Math.cos(a) + (y - c) * Math.sin(a) > 0;
    }, 'K', () => 0.25);
  }
  // the spines all over its outside, bristling
  spines(s, c, c, 16 + breathe, 16 + breathe, 0, TAU, f, 4.4 + breathe);
  // inside: the pale felt, and the two chestnuts side by side, glaring in turn
  s.ellipse(c, c, 12.4, 12, 'ig', { flat: 0.92, pat: speckle({ amt: 0.12, seed: 9 }) });
  chestnut(s, c - 6.4, c + 0.8, -0.18, f, f === 1 || f === 2, 6.6, false);
  chestnut(s, c + 6.4, c + 0.8, 0.18, f, f >= 2, 6.6, false);
  // a maple leaf caught on its spines
  const [lx, ly] = [c + 13, c - 13];
  s.paint([lx - 7, ly - 7, lx + 7, ly + 7], (x, y) => {
    const a = Math.atan2(y - ly, x - lx) + 0.4;
    const r = 5.6 * (0.55 + 0.45 * Math.abs(Math.cos((a * 5) / 2)));
    return Math.hypot(x - lx, y - ly) < r;
  }, 'mj', (x, y) => 0.6 - (y - ly) * 0.03);
  for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU - 0.4 - Math.PI / 2; s.line(lx, ly, lx + Math.cos(a) * 4.4, ly + Math.sin(a) * 4.4, 0x8a1a08, 1, 0.6); }
  s.line(lx, ly, lx - 3, ly + 4, 0x8a1a08, 1);
  return s.render({ outline: 2 });
}

function kuri(f) {
  const s = new HiSprite(28, 28, RAMPS);
  chestnut(s, 14, 13, f ? 0.25 : -0.25, f, true, 8);
  // a spine of the husk still stuck in it; a scrap of the felt
  s.line(20, 6, 24, 2, 0x8a9a3a, 1);
  s.line(24, 2, 25.6, 0.6, 0xc8a860, 1);
  s.dot(6, 22, 1, 0xd8c8a0, 0.8);
  return s.render({ outline: 2 });
}

// ---------------------------------------------------------------- cart: the swan boat (48 x 82), down the screen
// (its bow down the frame: the way it paddles; its wake behind it, up the frame)
/** A fleck of white water (glowing: no outline round it). */
const foam = (s, x, y, v, r = 0.7) => s.paint([x - 2, y - 2, x + 2, y + 2], (px, py) => Math.hypot(px - x, py - y) < r, 'wa', () => v, { glow: true });

function swan(stage, f) {
  const s = new HiSprite(48, 82, RAMPS);
  const c = 24;
  const yaw = stage >= 2 ? 1.6 : 0; // (without its wheel it slews to one side)
  const list = stage >= 3; // (holed: it lists to its right)
  const bw = (y) => {
    const t = (y - 8) / 48; // 0 the tail, 1 the chest
    return t < 0 || t > 1 ? -1 : 16.4 * Math.sin(Math.PI * Math.min(1, t * 0.9 + 0.1)) ** 0.5 * (t > 0.62 ? 1 - (t - 0.62) * 0.9 : 1);
  };
  const tilt = (y) => yaw * ((y - 32) / 24);
  const side = (x, y) => (x - c - tilt(y)) / Math.max(1, bw(y)); // -1 port .. 1 starboard
  // the wake spreading behind it in a V; the paddle wheel under the stern in its churn of white water
  if (stage < 2) {
    for (let k = 0; k < 4; k++) {
      const y = 9 - k * 2.6 - ((f * 1.3) % 2.6);
      for (const sx of [-1, 1]) for (let d = 0; d < 5; d++) foam(s, c + sx * (10 + k * 3 + d * 0.8), y + d * 0.6, 0.8 - k * 0.12);
    }
    s.paint([c - 8, 0, c + 8, 10], (x, y) => Math.hypot((x - c) / 7.4, (y - 5) / 4.6) < 1 + Math.sin(x * 1.3 + f * 2) * 0.12, 'wa', (x, y) => 0.55 + ((x * 3 + y * 5 + f * 7) % 5) * 0.09, { glow: true });
    s.poly([[c - 5, 3], [c + 5, 3], [c + 5, 9], [c - 5, 9]], 'wh', { flat: 0.5 });
    for (let k = 0; k < 3; k++) { const y = 3.6 + ((k * 2 + f) % 5); s.line(c - 5, y, c + 5, y, 0x3a2a1a, 1, 0.9); } // (its paddles turning)
  } else {
    // the wheel torn off: the bare axle's stubs, a crank swinging; only bubbles behind
    s.line(c - 6, 7, c - 3, 7, 0x4a525e, 1.4);
    s.line(c + 3, 7, c + 7, 7, 0x4a525e, 1.4);
    s.line(c + 7, 7, c + 9 + f * 1.4, 3 + f, 0x8a94a2, 1);
    for (let k = 0; k < 3; k++) foam(s, c - 3 + k * 3, 3 + ((k + f) % 2), 0.8, 1);
  }
  // the bow wave curling off both sides of its chest
  for (const sx of [-1, 1]) for (let d = 0; d < 7; d++) foam(s, c + sx * (9 + d) + yaw, 54 - d * 1.6 + (f ? 0.5 : 0), 0.95 - d * 0.06);
  // the body: broad and round like a bird's, widest behind the middle, rounding into the chest
  s.paint([c - 20, 6, c + 20, 58], (x, y) => Math.abs(x - c - tilt(y)) < bw(y), 'sw', (x, y) => 0.7 - side(x, y) * 0.16 - (list ? 0.06 : 0));
  // the wings raised along both sides: their rims, rows of feathers, grey at the tips sweeping round the stern;
  // the tail upturned between them
  for (const sx of [-1, 1]) {
    s.paint([c - 20, 6, c + 20, 52], (x, y) => { const d = side(x, y) * sx; return d > 0.7 && d <= 1 && y < 50; }, 'sw', (x, y) => (sx < 0 ? 0.9 : 0.5) + Math.sin(y * 1.1) * 0.05);
    s.paint([c - 20, 6, c + 20, 22], (x, y) => { const d = side(x, y) * sx; return d > 0.45 && d <= 1 && y < 20 - (1 - d) * 8; }, 'sg', (x, y) => (sx < 0 ? 0.7 : 0.45) + Math.sin(x * 1.7 + y) * 0.06);
    for (let y = 14; y < 48; y += 3.4) { const x0 = c + tilt(y) + sx * (bw(y) - 4); s.line(x0, y, x0 + sx * 3.4, y + 2.2, 0x9aa0aa, 1, 0.75); }
  }
  s.poly([[c - 4.4, 12], [c, 6], [c + 4.4, 12], [c, 15]], 'sw', { flat: 0.85 });
  s.line(c, 7, c, 13, 0xb0b6c0, 1, 0.8);
  // the cockpit: open between the wings, its floor, the two pink seats side by side facing the bow, the pedals in
  // front of them, the tiller between
  const ck = (x, y) => Math.abs(x - c - tilt(y)) < bw(y) - 5.4 && y > 18 && y < 44;
  s.paint([c - 14, 16, c + 14, 46], ck, 'fd', (x, y) => 0.5 - (y - 18) * 0.006);
  for (const sx of [-1, 1]) {
    s.poly([[c + sx * 1.6 + tilt(22), 21], [c + sx * 8.6 + tilt(22), 21], [c + sx * 8.6 + tilt(30), 30], [c + sx * 1.6 + tilt(30), 30]], 'st', { flat: 0.62 });
    s.line(c + sx * 2 + tilt(21), 21.5, c + sx * 8.2 + tilt(21), 21.5, 0xffb0c0, 1, 0.8); // (the seat back's edge)
    for (const k of [0, 1]) s.dot(c + sx * (3.6 + k * 3) + tilt(38), 38 + (f ^ k ? 0.8 : -0.8), 1, 0x8a94a2); // (the pedals, turning)
  }
  s.line(c + tilt(32), 32, c + tilt(40), 41, 0x4a525e, 1.2); // (the tiller)
  s.dot(c + tilt(40), 41, 1, 0xd82a2a);
  if (list) {
    // stove in on its right side: the hull split open at the wing, the lake pouring into the cockpit
    s.paint([c, 18, c + 20, 46], (x, y) => ck(x, y) && x > c + 1 - (y - 32) * 0.1, 'wa', (x, y) => 0.45 + ((x * 3 + y * 7 + f * 5) % 4) * 0.08);
    s.poly([[c + 12, 28], [c + 15.6, 26], [c + 15.4, 35], [c + 12, 37]], 'K', { flat: 0.2 });
    for (let k = 0; k < 4; k++) s.line(c + 12, 28 + k * 2.4, c + 15.4, 27 + k * 2.6, 0x5a606a, 1, 0.8); // (the split fibreglass)
    for (let k = 0; k < 5; k++) s.dot(c + 10 - (k % 2) * 1.6, 29 + k * 1.8 + f, 0.8, 0xffffff, 0.85); // (the water rushing in)
  }
  // the long neck rising from the chest, out past the bow, foreshortened from above; the head on it, the eyes, the
  // black knob and the orange beak - knocked askew once hit, cracked at its root
  const bent = stage >= 1;
  const nx = (t) => c + yaw + (bent ? 7 * t * t : Math.sin(t * 2.4) * 1.2); // t 0 its root .. 1 the head
  const ny = (t) => 48 + t * 18 - (bent ? t * t * 3 : 0);
  for (let k = 0; k <= 24; k++) {
    const t = k / 24;
    s.ellipse(nx(t), ny(t), 4.6 - t * 1.2, 3.8 - t * 0.6, 'sw', { flat: 0.86 - t * 0.12 + (t > 0.5 ? 0.06 : 0) });
  }
  for (let k = 0; k <= 12; k++) { const t = 0.3 + k / 20; s.px(nx(t) + 2.6, ny(t), 0xb0b6c0, 0.8); } // (its shaded side)
  if (bent) for (let k = 0; k < 4; k++) s.line(c + yaw - 4 + k * 2.4, 50 + (k % 2), c + yaw - 3 + k * 2.4, 53, 0x5a606a, 1, 0.9); // (the crack round its root)
  const [hx, hy] = [nx(1), ny(1)];
  s.ellipse(hx, hy, 5.4, 5, 'sw', { bias: 0.25 });
  s.poly([[hx - 2.6, hy + 3.4], [hx + 2.6, hy + 3.4], [hx + 1.4, hy + 11.4], [hx - 1.4, hy + 11.4]], 'be', { flat: 0.65 }); // (the beak, down the frame)
  s.line(hx, hy + 5.4, hx, hy + 11, 0xa84a08, 1, 0.7);
  s.ellipse(hx, hy + 3.8, 2.8, 2, 'K', { flat: 0.3 }); // (the black knob at its root)
  for (const sx of [-1, 1]) {
    s.dot(hx + sx * 3.6, hy + 0.6, 1.4, bent ? 0xff3a20 : INK);
    s.dot(hx + sx * 3.6, hy + 0.6, 0.6, bent ? INK : 0xffffff);
    if (bent) s.line(hx + sx * 1.4, hy - 1.6, hx + sx * 5.4, hy - 0.2, INK, 1.2); // (glaring)
  }
  return s.render({ outline: 2 });
}

function swanWreck() {
  const s = new HiSprite(48, 82, RAMPS);
  const c = 24;
  // the boat gone under: rings spreading on the water from where it lies, the hull's white pale beneath the water,
  // one wing's grey tip above it, the neck bent over with the head on it, a pink seat cushion afloat
  for (let k = 0; k < 3; k++) s.paint([0, 0, 48, 82], (x, y) => Math.abs(Math.hypot((x - c) / 1.2, (y - 40) / 1.9) - (14 + k * 5.4)) < 0.5, 'wa', () => 0.7 - k * 0.12, { glow: true });
  s.ellipse(c, 38, 12, 20, 'wa', { flat: 0.62 });
  for (let y = 22; y < 56; y += 4) {
    const w = 11 * Math.sqrt(Math.max(0, 1 - ((y - 38) / 20) ** 2));
    s.line(c - w, y, c + w, y + 1, 0x6aa8b8, 1, 0.8); // (ripples over it)
  }
  s.poly([[c - 13, 26], [c - 7, 18], [c - 4, 26], [c - 9, 33]], 'sg', { flat: 0.6 });
  s.line(c - 11, 26, c - 7, 21, 0x5a606a, 1, 0.7);
  for (let k = 0; k <= 16; k++) { const t = k / 16; s.ellipse(c + 2 + t * 10, 46 + t * 12 - t * t * 8, 3.8 - t, 3.2 - t * 0.6, 'sw', { flat: 0.78 }); }
  s.ellipse(c + 12, 50, 3.8, 3.4, 'sw', { bias: 0.2 });
  s.poly([[c + 15, 49], [c + 22, 48], [c + 22, 51.4], [c + 15, 52]], 'be', { flat: 0.6 });
  s.line(c + 10.6, 49, c + 12.6, 51, INK, 1);
  s.line(c + 12.6, 49, c + 10.6, 51, INK, 1); // (its eye crossed out)
  s.poly([[c - 7, 58], [c + 1, 57], [c + 2, 63], [c - 6, 64]], 'st', { flat: 0.55 });
  s.line(c - 6, 60.6, c + 1.6, 60, 0xffb0c0, 1, 0.7);
  return s.render({ outline: 2 });
}

/** Kawaguchiko's frames for the shared behaviours (skins.js: kawaguchiko chain, split, cart). */
export function kawaguchikoNewFoes(add) {
  for (let i = 0; i < 3; i++) add(`k_koi_${i}`, koi(i));
  for (let f = 0; f < 2; f++) add(`k_koi_eye_${f}`, koi('eye', f));
  for (let f = 0; f < 2; f++) add(`k_koi_lit_${f}`, koi('lit', f));
  add('k_koi_burnt', koi('burnt'));
  add('k_koi_pole', pole());
  for (let f = 0; f < 4; f++) add(`k_iga_${f}`, burr(f));
  for (let f = 0; f < 2; f++) add(`k_iga_one_${f}`, kuri(f));
  for (let st = 0; st < 4; st++) for (let f = 0; f < 2; f++) add(`k_hakucho_${st}_${f}`, swan(st, f));
  add('k_hakucho_wreck', swanWreck());
}
