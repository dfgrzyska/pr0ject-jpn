// Sapporo's looks for two of the shared behaviours (src/game/enemies/chainSplitCart.js, docs/plan-silniejsze-fale.md;
// no cart here: the city has its snowploughs), drawn at 540 px with HiSprite:
//   chain  - salted salmon (shiozake) hung by their tails from a line over the avenue by Nijo market, between
//            two posts capped with snow: in turn one bound in straw rope round its middle (aramaki) and one split
//            open, its red flesh held apart by a bamboo stick; the one that wakes opens its eye and gapes its
//            hooked jaw (these shoot); one smoking and catching fire, the charred tail left on its string
//   split  - jaga-bata from the Snow Festival's stalls: a potato baked in its foil, cut in a cross and pushed open,
//            a pat of butter melting into it, a spoonful of squid shiokara beside, steaming, glaring; shot, it
//            falls apart into its two halves, each dripping butter, which dive
import { HiSprite, tones, speckle, mottle } from '../../lib/hisprite.mjs';

const INK = 0x14101c;
const TAU = Math.PI * 2;
const RAMPS = {
  sb: tones([0x1a2a3e, 0x3a5470, 0x7a94b0]), // the salmon's dark back
  ss: tones([0x7a8494, 0xc8d0da, 0xffffff]), // its silver flanks, crusted with salt
  sr: tones([0x8a1e14, 0xd8503a, 0xff9a78]), // its red flesh
  sw: tones([0x6a5a30, 0xb8a060, 0xe8d8a0]), // straw rope
  bm: tones([0x6a5a2a, 0xb8a060, 0xe8dca0]), // bamboo
  wd: tones([0x3a2a1e, 0x6a5440, 0xa08a6a]), // the post, old wood
  sn: tones([0x8a98bc, 0xdce6f4, 0xffffff]), // snow
  fl: tones([0xb82a08, 0xff8a1a, 0xfff2a0]), // flame
  ch: tones([0x0e0a08, 0x2a201a, 0x4a3a30]), // charred
  fo: tones([0x6a7280, 0xc0c8d2, 0xffffff]), // the foil
  pt: tones([0x5a3a1a, 0x9a6a3a, 0xc89a60]), // the potato's skin
  po: tones([0xb0a070, 0xf2e8c4, 0xfffcee]), // its floury flesh
  bt: tones([0xd08a00, 0xffc818, 0xfff0a0]), // butter
  sk: tones([0x8a2a1a, 0xd86a4a, 0xffb090]), // shiokara
};

// ---------------------------------------------------------------- chain: a salted salmon (24 x 46), hung by its tail
/** The salmon's half width t along it (0 its tail, up the frame; 1 its snout, down). */
const girth = (t) => (t < 0.12 ? 1.6 + t * 10 : 6.6 * Math.sin(Math.PI * Math.min(1, (t - 0.06) * 1.04)) ** 0.55 * (t > 0.8 ? 1 - (t - 0.8) * 1.6 : 1));
function sake(kind, f = 0) {
  const s = new HiSprite(24, 46, RAMPS);
  const c = 12;
  const [y0, len] = [6, 38]; // the tail's root, its length to the snout
  const at = (y) => (y - y0) / len;
  const sw = (y) => Math.sin(f * 1.5 + at(y) * 2) * 0.6 * at(y); // (it turns a little on its string)
  if (kind === 'burnt') {
    // the charred tail left on its string, an ember at its ragged end
    s.line(c, 0, c, 6, 0x6a5a30, 1);
    s.poly([[c - 4, 3], [c + 4, 3], [c + 2, 8], [c + 3, 14], [c - 2, 16], [c - 3, 9]], 'ch', { flat: 0.4, pat: speckle({ amt: 0.3, seed: 6 }) });
    s.dot(c, 15, 0.9, 0xff7020, 0.9);
    return s.render({ outline: 2 });
  }
  // the string it hangs by, and its tail spread above
  s.line(c, 0, c, 4, 0x6a5a30, 1);
  for (const sx of [-1, 1]) s.poly([[c, y0 + 2], [c + sx * 1.2, y0 - 1], [c + sx * 5, y0 - 4], [c + sx * 3.6, y0 + 1]], 'sb', { flat: sx < 0 ? 0.6 : 0.4 });
  // the body: its dark back, the silver flanks below it, lit from the left
  const body = (x, y) => Math.abs(x - c - sw(y)) < girth(at(y)) && at(y) >= 0 && at(y) <= 1;
  s.paint([c - 9, y0, c + 9, y0 + len + 1], body, 'ss', (x, y) => 0.68 - (x - c - sw(y)) * 0.05, { pat: speckle({ amt: 0.18, light: 0.12, seed: 3 }) });
  s.paint([c - 9, y0, c + 9, y0 + len + 1], (x, y) => body(x, y) && Math.abs(x - c - sw(y) + 1) < girth(at(y)) * 0.38, 'sb', (x, y) => 0.55 - (x - c) * 0.04);
  for (let y = y0 + 6; y < y0 + len - 8; y += 2.2) for (const sx of [-1, 1]) s.px(c + sw(y) + sx * girth(at(y)) * 0.55 + ((y * 7) % 3) - 1, y, 0x1a2a3e, 0.5); // (the black spots along its back)
  if (kind === 1) {
    // split open down its belly, the red flesh showing, held apart by a bamboo stick
    s.paint([c - 9, y0 + 8, c + 9, y0 + len - 6], (x, y) => body(x, y) && at(y) > 0.24 && at(y) < 0.78 && Math.abs(x - c - sw(y)) < girth(at(y)) * 0.62, 'sr', (x, y) => 0.6 - Math.abs(x - c - sw(y)) * 0.05, { pat: speckle({ amt: 0.1, seed: 8 }) });
    for (let y = y0 + 11; y < y0 + len - 8; y += 3) s.line(c + sw(y) - girth(at(y)) * 0.5, y, c + sw(y) + girth(at(y)) * 0.5, y + 1.2, 0xffd0c0, 1, 0.45); // (the flakes' white lines)
    const sy = y0 + len * 0.5;
    s.tube(c + sw(sy) - girth(0.5) - 0.6, sy, c + sw(sy) + girth(0.5) + 0.6, sy, 0.8, 'bm', { flat: 0.6 });
  } else {
    // bound in straw rope round its middle (aramaki), the ends hanging
    for (const t of [0.42, 0.52]) {
      const y = y0 + len * t;
      s.tube(c + sw(y) - girth(t) - 0.4, y, c + sw(y) + girth(t) + 0.4, y + 0.6, 0.9, 'sw', { flat: 0.6 });
    }
    s.line(c + 5, y0 + len * 0.52, c + 7, y0 + len * 0.6, 0xb8a060, 1);
  }
  // the head: the gill cover's curve, the eye, the hooked jaw of a male in its autumn run
  const hy = y0 + len * 0.84;
  s.paint([c - 8, hy - 3, c + 8, hy + 1], (x, y) => body(x, y) && Math.abs(y - hy + Math.abs(x - c) * 0.3) < 0.5, 'sb', () => 0.3);
  const woke = kind === 'eye';
  for (const sx of [-1, 1]) {
    const [ex, ey] = [c + sw(hy) + sx * 3.4, hy + 2.6];
    if (woke) {
      s.ellipse(ex, ey, 1.6, 1.6, 'W', { flat: 0.95 });
      s.dot(ex, ey + (f ? 0.4 : 0), 0.9, 0xff3a20);
      s.dot(ex, ey + (f ? 0.4 : 0), 0.4, INK);
      s.line(ex - sx * 0.6, ey - 2.4, ex + sx * 2.2, ey - 1.2, INK, 1); // (glaring)
    } else s.line(ex - 1, ey, ex + 1, ey + 0.3, INK, 1); // (its eye shut, salted dry)
  }
  const sn = y0 + len;
  if (woke) {
    // the hooked jaw gaping, its teeth
    s.poly([[c - 3, sn - 2], [c + 3, sn - 2], [c + 2, sn + 1.6], [c - 2, sn + 1.6]], 'K', { flat: 0.2 });
    for (const sx of [-1, 1]) s.px(c + sx * 1.6, sn - 1.2, 0xffffff);
  }
  s.line(c - 1, sn - 0.5, c + 1.5, sn + (woke ? 1.6 : 0.6), 0x3a5470, 1.2); // (the kype, hooked)
  if (kind === 'lit') {
    // smoking from below, catching fire, the skin blackening up from its head
    s.paint([c - 9, y0 + len * 0.55, c + 9, y0 + len + 1], (x, y) => body(x, y) && y > y0 + len * 0.62 + Math.sin(x * 1.1 + f) * 2, 'ch', () => 0.4);
    for (let k = -1; k <= 1; k++) s.ellipse(c + k * 3.6, y0 + len * 0.72 + ((f + k + 2) % 3) * 1.6, 2.4, 4.6, 'fl', { flat: 0.8, glow: true });
    for (let i = 0; i < 4; i++) s.dot(c - 4 + i * 3, y0 + len * 0.5 - ((i + f) % 3) * 2, 0.7, 0xfff2a0);
  }
  return s.render({ outline: 2 });
}

/** A post the line runs from (21 x 21, seen from above): its cap of snow, the line's turns about it. */
function post() {
  const s = new HiSprite(21, 21, RAMPS);
  s.ellipse(10.5, 10.5, 4.8, 4.8, 'wd', { bias: 0.1 });
  s.paint([4, 4, 17, 17], (x, y) => Math.hypot(x - 10, y - 10) < 4.2 + Math.sin(Math.atan2(y - 10, x - 10) * 5) * 0.6, 'sn', (x, y) => 0.8 - (x - 10) * 0.03 - (y - 10) * 0.03);
  s.tube(1, 11.5, 20, 11, 0.8, 'sw', { flat: 0.55 });
  return s.render({ outline: 2 });
}

// ---------------------------------------------------------------- split: jaga-bata (a potato in its foil 46 x 46, a half 28 x 28)
/**
 * A potato at (x, y), its skin round it, the top cut in a cross and pushed up into four floury lobes; `lobes`: which
 * of them (0 upper left, 1 upper right, 2 lower left, 3 lower right) - all four, or a half's two. `glare`: per half
 * (left, right), its eyes on its upper lobe.
 */
function potato(s, x, y, rx, ry, lobes, glare, seed) {
  const L = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  const inside = (px, py) => {
    const sx = px < x ? -1 : 1, sy = py < y ? -1 : 1;
    return lobes.includes(L.findIndex(([a, b]) => a === sx && b === sy)) && Math.hypot((px - x) / rx, (py - y) / ry) < 1;
  };
  // the skin, brown and rough, its eyes; the cut flesh inside its rim
  s.paint([x - rx - 1, y - ry - 1, x + rx + 1, y + ry + 1], inside, 'pt', (px, py) => 0.58 - (px - x) * 0.02 - (py - y) * 0.025, { pat: speckle({ amt: 0.25, seed }) });
  for (const k of lobes) {
    const [a, b] = L[k];
    const [lx, ly] = [x + a * rx * 0.46, y + b * ry * 0.46];
    // a lobe of the floury flesh, pushed up out of the skin, crumbling at its edges
    s.paint([lx - rx * 0.6, ly - ry * 0.6, lx + rx * 0.6, ly + ry * 0.6], (px, py) => inside(px, py) && Math.hypot((px - lx) / (rx * 0.44), (py - ly) / (ry * 0.44)) < 1 + Math.sin(Math.atan2(py - ly, px - lx) * 6 + k) * 0.06 && Math.abs(px - x) > 0.8 && Math.abs(py - y) > 0.8, 'po', (px, py) => 0.72 - (px - lx) * 0.035 - (py - ly) * 0.04, { pat: mottle({ amt: 0.1, scale: 2.2, seed: seed + k }) });
  }
  for (const [ex, ey] of [[-0.7, 0.55], [0.75, -0.2], [0.2, 0.85]]) if (inside(x + ex * rx, y + ey * ry)) s.dot(x + ex * rx, y + ey * ry, 0.6, 0x3a2410, 0.8); // (eyes of the potato in its skin)
  // the faces: on the upper lobe of each half
  for (const [k, g] of [[0, glare[0]], [1, glare[1]]]) {
    if (!lobes.includes(k) || g == null) continue;
    const [a] = L[k];
    const [fx, fy] = [x + a * rx * 0.46, y - ry * 0.42];
    for (const sx of [-1, 1]) {
      s.ellipse(fx + sx * 2.2, fy, 1.1, g ? 1.2 : 0.45, 'K', { flat: 0.2 });
      if (g) s.dot(fx + sx * 2.2, fy + 0.2, 0.6, 0xff3a20);
      s.line(fx + sx * 0.8, fy - 2.2, fx + sx * 3.8, fy - 1.4, INK, 1);
    }
  }
}

/** The butter pat melting at (x, y) into the cross, its puddle running along the cuts (`m` 0..1), a gleam. */
function butter(s, x, y, m, cross = true) {
  if (cross) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) s.paint([x - 9, y - 9, x + 9, y + 9], (px, py) => (dx ? Math.abs(py - y) < 0.9 && (px - x) * dx > 0 && (px - x) * dx < 3 + m * 6 : Math.abs(px - x) < 0.9 && (py - y) * dy > 0 && (py - y) * dy < 3 + m * 5), 'bt', () => 0.5, { glow: true });
  const h = 3 - m * 0.6;
  s.poly([[x, y - h - 0.6], [x + h + 0.6, y], [x, y + h + 0.6], [x - h - 0.6, y]], 'bt', { flat: 0.45 });
  s.poly([[x, y - h], [x + h, y], [x, y + h], [x - h, y]], 'bt', { flat: 0.85 });
  s.dot(x - 0.8, y - 1, 0.6, 0xffffff, 0.95);
}

/** A wisp of steam (glowing: no outline round it). */
const steam = (s, x, y, v) => s.paint([x - 2, y - 2, x + 2, y + 2], (px, py) => Math.hypot(px - x, py - y) < 0.7, 'sn', () => v, { glow: true });

function jaga(f) {
  const s = new HiSprite(46, 46, RAMPS);
  const c = 23;
  // the foil it was baked in, crumpled open round it, catching the light in creases
  s.paint([2, 3, 44, 44], (x, y) => Math.hypot((x - c) / 19.6, (y - c - 1) / 18.6) < 1 + Math.sin(Math.atan2(y - c, x - c) * 9) * 0.05, 'fo', (x, y) => 0.55 + Math.sin(x * 0.9 + y * 0.4) * 0.12 + Math.sin(y * 1.3 - x * 0.3) * 0.08, { pat: speckle({ amt: 0.12, light: 0.15, seed: 4 }) });
  for (let k = 0; k < 9; k++) { const a = (k / 9) * TAU + 0.3; s.line(c + Math.cos(a) * 15, c + 1 + Math.sin(a) * 14, c + Math.cos(a) * 18.6, c + 1 + Math.sin(a) * 17.6, 0x6a7280, 1, 0.5); } // (its creases)
  // the potato, cut in a cross and pushed open, its two halves glaring in turn, the butter melting into the cross
  potato(s, c, c + 1, 14, 12.4, [0, 1, 2, 3], [f === 1 || f === 2, f >= 2], 5);
  butter(s, c, c + 1, [0.2, 0.45, 0.7, 0.45][f]);
  // a spoonful of squid shiokara on the foil beside it
  s.paint([c + 8, c + 11, c + 20, c + 19], (x, y) => Math.hypot((x - c - 14) / 4.6, (y - c - 15) / 3) < 1, 'sk', () => 0.6, { pat: speckle({ amt: 0.25, seed: 9 }) });
  s.dot(c + 13, c + 14, 0.7, 0xffffff, 0.8);
  // the steam rising off it in the cold
  for (let k = 0; k < 3; k++) {
    const x = c - 9 + k * 9 + Math.sin(f + k) * 1.4;
    for (let y = 1; y < 9; y += 1) steam(s, x + Math.sin(y * 0.7 + f + k) * 1.6, y + ((f + k) % 2), 0.9 - y * 0.06);
  }
  return s.render({ outline: 2 });
}

function jagaOne(f) {
  // a half: its two lobes in their skin, the butter sliding off its cut edge, a drop falling
  const s = new HiSprite(28, 28, RAMPS);
  const side = f ? 1 : 0;
  const x = side ? 8 : 20;
  potato(s, x, 14, 13, 11.6, side ? [1, 3] : [0, 2], side ? [null, true] : [true, null], 6);
  butter(s, x + (side ? 1.4 : -1.4), 14, 0.5, false);
  s.dot(x + (side ? 2 : -2), 25, 1, 0xffd020, 0.9);
  for (let y = 1; y < 5; y++) steam(s, 14 + y * 0.5, 1 + y, 0.85); // (a wisp of steam)
  return s.render({ outline: 2 });
}

/** Sapporo's frames for the shared behaviours (skins.js: sapporo chain, split). */
export function sapporoNewFoes(add) {
  for (let i = 0; i < 2; i++) add(`sp_sake_${i}`, sake(i));
  for (let f = 0; f < 2; f++) add(`sp_sake_eye_${f}`, sake('eye', f));
  for (let f = 0; f < 2; f++) add(`sp_sake_lit_${f}`, sake('lit', f));
  add('sp_sake_burnt', sake('burnt'));
  add('sp_pole', post());
  for (let f = 0; f < 4; f++) add(`sp_jaga_${f}`, jaga(f));
  for (let f = 0; f < 2; f++) add(`sp_jaga_one_${f}`, jagaOne(f));
}
