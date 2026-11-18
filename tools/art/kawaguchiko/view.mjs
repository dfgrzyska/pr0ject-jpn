// Fuji's panorama over the lake (docs/plan-kawaguchiko.md, section 4.1 and phase 5): what rises behind the quay at the
// strip's end, as Nagasaki's view does. Painted at 3x the game's resolution (648 x 1260, shown at 216 x 420: 18 to
// spare each side for the sway). Looking south across the lake's western water at sunset in late autumn: the mountain
// in the classic profile, its fresh snow cap breaking into tongues down the gullies, the sun low on the right (west)
// so the right flank and the snow on it glow pink and the left lies in blue shade; the bare scoria under the cap, the
// larches gold at the tree line, the dark forest at its foot in the evening haze; wooded hills in front of its base,
// the far shore's houses along the water; the sky from violet to the glow on the horizon; and in the lake the whole of
// it upside down, darker, broken into bands by the ripples.
//
// The mountain is a cone seen from the side: every point of its face is found by its depth under the summit (how far
// down the mountain) and its azimuth (round the mountain from the face turned to us), and is lit by its slope there,
// the ridges and gullies running down it turning that slope this way and that. Lit in floats, then put down with an
// ordered dither so that it stays pixel art.
import { Raster, fbm, rgb } from '../../lib/raster.mjs';
import { hashPx } from '../hires.mjs';

export const S = 3;
export const VW = 216; // (the view's width in the game's pixels: the screen's 180 and 18 each side)
export const VH = 420;
const W = VW * S;
const H = VH * S;

// the geography of the picture, in the game's pixels from the view's top left
export const FUJI = {
  cx: 109, // the summit's middle
  top: 100, // the summit's flat top
  base: 248, // where the mountain meets the far shore
};
export const WATERLINE = 257; // the far shore's edge on the water: the reflection's axis

const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const lerp = (a, b, t) => a + (b - a) * t;
const mixV = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const C = (c) => rgb(c);
/** A colour ramp: stops [[t, colour]], t rising. */
const ramp = (stops, t) => {
  if (t <= stops[0][0]) return C(stops[0][1]);
  for (let i = 1; i < stops.length; i++)
    if (t <= stops[i][0]) return mixV(C(stops[i - 1][1]), C(stops[i][1]), (t - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]));
  return C(stops.at(-1)[1]);
};
const norm = (v) => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

// ---------------------------------------------------------------------------------------------------------- the sky
const SKY = [
  [0, 0x262a62],
  [60, 0x403a7a],
  [120, 0x7a5a96],
  [170, 0xb8709a],
  [210, 0xe48c92],
  [240, 0xf6a888],
  [WATERLINE, 0xfcc490],
];
/** The sky's colour at (x, y) in the game's pixels: the gradient, warmer and brighter low on the right where the
 * sun has gone down, and the streaks of cloud lit from under. */
function skyAt(x, y) {
  let c = ramp(SKY, y);
  const glow = Math.exp(-(((x - 236) / 70) ** 2) - (((y - 250) / 80) ** 2));
  c = mixV(c, [255, 196, 140], glow * 0.55);
  // the streaks of cloud: long thin bands, their undersides gold and pink, their tops in violet shade
  for (const [cy, x0, x1, th, seed] of [
    [34, 96, 236, 4.5, 11], [44, 150, 236, 3, 16], [58, -10, 84, 3, 12], [96, 168, 236, 2.4, 15],
    [150, 132, 236, 3.4, 13], [162, 164, 236, 2.4, 17], [176, 150, 236, 2, 14], [214, -10, 60, 2.2, 18], [222, 168, 236, 2.6, 19],
  ]) {
    const n = fbm(x * 0.6, cy, { seed, scale: 18, octaves: 3 });
    const lump = fbm(x * 2, cy * 3, { seed: seed + 50, scale: 4, octaves: 2 }); // (the cloud's lumps along its length)
    const mid = cy + (n - 0.5) * 6 + Math.sin(x * 0.05 + seed) * 1.5;
    const reach = smooth(x0, x0 + 34, x) * (1 - smooth(x1 - 34, x1, x));
    const thick = th * reach * (0.3 + n) * (0.6 + lump * 0.8);
    const dy = y - mid;
    if (Math.abs(dy) > thick) continue;
    const under = dy / Math.max(0.5, thick); // -1 top, 1 underside
    const lit = mixV([150, 110, 170], [255, 170 + 40 * (1 - y / 250), 150], smooth(-0.6, 0.8, under));
    c = mixV(c, lit, 0.75 * (1 - Math.abs(dy) / thick) ** 0.6);
  }
  return c;
}

// ------------------------------------------------------------------------------------------------------- the mountain
const { cx: CX, top: TOP, base: BASE } = FUJI;
const DEPTH = BASE - TOP;
/** How far out from the axis the mountain's flank is, at depth d under the summit (left and right a little apart). */
const half = (d, side) => (6 + 0.96 * d + 0.0062 * d * d) * (side < 0 ? 1.05 : 1);
/** The summit's skyline: the crater's rim, two humps and a notch. */
const rim = (x) => TOP - 1.1 * Math.exp(-(((x - CX + 4) / 2.6) ** 2)) - 1.5 * Math.exp(-(((x - CX - 4.6) / 2) ** 2)) + 0.6 * Math.exp(-(((x - CX - 0.6) / 1.3) ** 2)) + (hashPx(Math.round(x * 3), 0, 5) - 0.5) * 0.35;

/** Where (x, y) is on the mountain, or null if it is not: { d (depth), t (0 summit .. 1 base), phi (azimuth), s }. */
function onFuji(x, y) {
  const d = y - TOP;
  if (d < -2) return null;
  const side = x < CX ? -1 : 1;
  const w = half(Math.max(0, d), side);
  const s = (x - CX) / w;
  if (Math.abs(s) > 1) return null;
  if (Math.abs(x - CX) <= 8.5 && y < rim(x)) return null;
  if (d < 0) return null;
  return { d, t: d / DEPTH, phi: Math.asin(s), s };
}

/** The ridges and gullies at azimuth phi, depth t: 0 in a gully's bed, 1 on a ridge's crest. They run straight down
 * the mountain, wander a little, die out into the summit's rim and into the forest's even skirts. */
function relief(phi, t) {
  const a = phi * 11 + (fbm(phi * 3, t * 5, { seed: 71, scale: 1.2, octaves: 2 }) - 0.5) * 2.2;
  const n1 = fbm(a, 0.5 + t * 0.9, { seed: 72, scale: 1.1, octaves: 3 });
  const n2 = fbm(a * 2.6, 0.2 + t * 2.2, { seed: 73, scale: 1.0, octaves: 2 });
  const ridge = 1 - Math.abs(n1 * 2 - 1) ** 0.7; // (broad backs, sharp gully beds)
  return ridge * 0.7 + n2 * 0.3;
}
/** Small-scale roughness: the scoria, boulders and drifts, so that no slope is smooth. */
const rough = (phi, t, seed) => fbm(phi * 70, t * 55, { seed, scale: 1, octaves: 2 }) - 0.5;

const SUN = norm([0.86, 0.22, -0.32]); // low in the west (right), a little behind the mountain
const SUNLIGHT = [255, 168, 128];
const SKYLIGHT = [118, 104, 168]; // the violet sky's light in the shade

/** The mountain's colour at (x, y) (game pixels), or null off it. */
function fujiAt(x, y) {
  const p = onFuji(x, y);
  if (!p) return null;
  const { d, t, phi } = p;
  // the slope: steep under the summit, easing down to the skirts
  const dw = 1.16 + 0.0092 * d;
  const alpha = Math.atan(1.5 / dw);
  const e = 0.002;
  const g = relief(phi, t);
  const dg = (relief(phi + e, t) - relief(phi - e, t)) / (2 * e);
  const amp = 0.06 * smooth(0.0, 0.12, t) * (1 - smooth(0.62, 0.9, t));
  const n0 = [Math.sin(phi) * Math.sin(alpha), Math.cos(alpha), Math.cos(phi) * Math.sin(alpha)];
  const tan = [Math.cos(phi), 0, -Math.sin(phi)];
  const rx = rough(phi, t, 74) * 1.1;
  const ry = rough(phi, t, 75) * 0.7;
  const n = norm([n0[0] - tan[0] * (dg * amp + rx), n0[1] - (g - 0.5) * 0.08 + ry, n0[2] - tan[2] * (dg * amp + rx)]);
  const sun = Math.max(0, dot(n, SUN));
  const sky = 0.55 + 0.45 * n[1];
  // what lies there: the snow cap (lower in the gullies, ragged), scoria, the tree line's larches, the forest
  const rag = (fbm(phi * 40, t * 30, { seed: 81, scale: 1.2, octaves: 2 }) - 0.5) * 0.06 + (hashPx(Math.round(x * 3), Math.round(y * 3), 82) - 0.5) * 0.025;
  const snowLine = 0.3 + (fbm(phi * 2.2, 0, { seed: 83, scale: 0.8, octaves: 2 }) - 0.5) * 0.08 + (1 - g) ** 2 * 0.36 + rag;
  const bareCrest = t > 0.1 && g > 0.86 && fbm(phi * 30, t * 12, { seed: 84, scale: 1, octaves: 1 }) > 0.62; // wind-scoured rock on the crests
  let base;
  let shine = 1;
  if (t < snowLine && !bareCrest) {
    base = [236, 236, 246];
    shine = 1.08;
  } else {
    // the tree line climbs higher up the gullies (shelter) than on the crests, ragged
    const tree = 0.49 + (0.5 - g) * 0.1 + (fbm(phi * 18, t * 6, { seed: 85, scale: 1, octaves: 2 }) - 0.5) * 0.07;
    const fleck = hashPx(Math.round(x * 3), Math.round(y * 3), 86);
    const grit = 0.8 + fleck * 0.25 + rough(phi, t, 76) * 0.5;
    if (t < tree) base = mixV([74, 56, 60], [100, 68, 62], g).map((v) => v * grit); // scoria, dark red-brown, gritty
    else if (t < tree + 0.07) base = fleck < 0.18 + (t - tree) * 3 ? [150, 108, 54] : [70, 62, 56]; // larches gold, thickening down
    else base = fleck < 0.08 ? [96, 70, 46] : fleck < 0.3 ? [42, 58, 54] : [30, 42, 44]; // the forest: evergreens, a little rust
  }
  let c = [0, 1, 2].map((k) => (base[k] / 255) * (SUNLIGHT[k] * sun * 1.15 * shine + SKYLIGHT[k] * sky * 0.85));
  // the evening air: the further down, the more of it between us and the mountain; a mist lies along its foot
  const haze = 0.08 + 0.42 * smooth(0.35, 1, t);
  c = mixV(c, mixV([200, 140, 170], [240, 170, 150], smooth(0, 216, x)), haze);
  const mist = smooth(0.82, 0.98, t) * (0.25 + 0.5 * fbm(x * 0.2, y * 0.8, { seed: 88, scale: 6, octaves: 2 }));
  return mixV(c, [226, 176, 190], mist);
}

// ---------------------------------------------------------------------------------- the hills before it, the far shore
/** The skyline of the wooded hills in front of the mountain's base (game y of their top at x), or Infinity. */
const hillTop = (x) => {
  const crowns = (seed) => (fbm(x, seed, { seed, scale: 3, octaves: 2 }) - 0.5) * 2.4 + (hashPx(Math.round(x * 3), seed, seed) - 0.5) * 0.7;
  const left = 192 + Math.max(0, (x - 4) / 92) ** 1.6 * 60 - Math.exp(-(((x - 4) / 14) ** 2)) * 3 + crowns(91);
  const right = 246 - smooth(132, 200, x) * 18 + Math.sin(x * 0.11) * 1.6 + crowns(92);
  const middle = 245.5 + crowns(93) * 0.6;
  return Math.min(left, right, middle);
};
function hillAt(x, y) {
  const top = hillTop(x);
  if (y < top || y >= WATERLINE) return null;
  const depth = y - top;
  // autumn crowns, each a small round head lit on its upper right: maples rust and red, larch and zelkova gold, the
  // dark of the cedars and pines; the slope turned to the sun warmer, the hollows in shade
  const CW = 2.2 - smooth(200, 250, top) * 0.8; // (the crowns smaller the further off the hill is)
  const [gx, gy] = [Math.floor(x / CW), Math.floor(y / CW)];
  let [f1, f2, best] = [9, 9, [0, 0, 0, 0]];
  for (let j = -1; j <= 1; j++)
    for (let i = -1; i <= 1; i++) {
      const [cx, cy] = [gx + i, gy + j];
      const px = (cx + 0.5 + (hashPx(cx, cy, 94) - 0.5) * 0.9) * CW;
      const py = (cy + 0.5 + (hashPx(cx, cy, 95) - 0.5) * 0.9) * CW;
      const dd = Math.hypot(x - px, (y - py) * 1.2) / CW;
      if (dd < f1) [f2, f1, best] = [f1, dd, [cx, cy, (x - px) / CW, (y - py) / CW]];
      else if (dd < f2) f2 = dd;
    }
  const [bx, by, ux, uy] = best;
  const kind = fbm(bx * 0.3, by * 0.3, { seed: 96, scale: 2.5, octaves: 2 }) + (hashPx(bx, by, 97) - 0.5) * 0.34;
  const base = kind > 0.62 ? [160, 62, 36] : kind > 0.52 ? [172, 118, 46] : kind > 0.42 ? [104, 76, 46] : [34, 52, 42];
  const gap = f2 - f1 < 0.12 ? 0.55 : 1; // the dark between crowns
  const head = gap * (1.08 - ux * 0.35 - uy * 0.45); // each crown lit on its upper right
  const slope = hillTop(x + 3) - hillTop(x - 3); // >0: the ground falls to the right, facing the sun
  const lit = Math.max(0, Math.min(1, 0.35 + slope * 0.1)) * (1 - smooth(2, 30, depth)) * 0.9;
  let c = [0, 1, 2].map((k) => (base[k] / 255) * (SUNLIGHT[k] * lit + SKYLIGHT[k] * 0.62) * head);
  c = mixV(c, [196, 136, 160], 0.14 + 0.16 * smooth(205, 248, top));
  return c;
}
/** The far shore along the water: houses, inns and a hotel among trees, the road on the embankment. */
function shoreAt(x, y) {
  if (y < WATERLINE - 6 || y >= WATERLINE) return null;
  if (y >= WATERLINE - 1) return (Math.floor(x * 3) % 7 === 0 ? [70, 62, 74] : [104, 92, 100]).map((v) => v * 0.9); // the embankment
  // a building every so often between the trees (which are the hills' own crowns, coming down to the water)
  const col = Math.floor(x / 2.6);
  if (hashPx(col, 9, 98) < 0.42) return null;
  const w = 1 + Math.floor(hashPx(col, 7, 96) * 2); // (a building one or two columns wide)
  const first = hashPx(col - 1, 9, 98) < 0.42 || w === 1 ? col : col - 1;
  const h = 1.6 + hashPx(first, 12, 96) * 2.2 + (hashPx(first >> 3, 8, 97) > 0.8 ? 1.6 : 0);
  const roofY = WATERLINE - 1 - h;
  if (y < roofY) return null;
  const wall = [[176, 164, 158], [150, 146, 152], [168, 150, 136], [136, 132, 142]][Math.floor(hashPx(first, 11, 100) * 4)];
  if (y < roofY + 0.7) return [58, 56, 72]; // its roof, tiled dark
  const sunSide = x - first * 2.6 > 1.8; // (the end turned to the sun)
  let c = wall.map((v) => v * (sunSide ? 0.92 : 0.66));
  const [wx, wy] = [Math.floor(x * 3), Math.floor(y * 3)];
  if (wx % 3 === 1 && wy % 3 === 1) c = hashPx(wx, wy, 101) < 0.25 ? [250, 200, 120] : c.map((v) => v * 0.7); // windows, a few lit
  return c;
}

// ----------------------------------------------------------------------------------------------------------- the water
/** The land and sky above the water at (x, y): what the lake reflects. */
function above(x, y) {
  return shoreAt(x, y) ?? hillAt(x, y) ?? fujiAt(x, y) ?? skyAt(x, y);
}
/** The lake at (x, y): the picture above, upside down, darker and cooler, broken into bands by the ripples. */
function waterAt(x, y) {
  const dist = (y - WATERLINE) / (VH - WATERLINE); // 0 at the far shore, 1 at our feet
  const band = Math.floor(y * 3 / (1 + dist * 3));
  const wob = (fbm(x * 0.08, band * 0.7, { seed: 101, scale: 1.6, octaves: 2 }) - 0.5) * (0.6 + dist * 7) + Math.sin(band * 1.7) * dist * 1.4;
  const my = 2 * WATERLINE - y + (fbm(x * 0.1, band, { seed: 102, scale: 2, octaves: 1 }) - 0.5) * dist * 4;
  let c = above(x + wob, Math.max(0, my));
  c = c.map((v, k) => v * 0.72 + [30, 40, 70][k] * 0.18);
  // the ripples' faces: troughs dark, crests catching the sky's light
  const r = fbm(x * (0.35 - dist * 0.2), y * 2.4, { seed: 103, scale: 1.2, octaves: 2 });
  if (r < 0.32) c = c.map((v, k) => v * 0.8 + [20, 24, 50][k] * 0.2);
  else if (r > 0.72) c = mixV(c, [210, 170, 200], 0.22 * (0.4 + dist));
  // a calm line along the far shore, where the reflection is sharpest
  return c;
}

/** The panorama as layers: sky (the sky and its clouds), land (the mountain, the hills and the far shore), water. */
export function buildPanorama() {
  const layers = { sky: new Raster(W, H), land: new Raster(W, H), water: new Raster(W, H) };
  const put = (r, X, Y, c) => {
    const th = (BAYER[(Y & 3) * 4 + (X & 3)] / 16 - 0.47) * 6;
    const q = c.map((v) => Math.max(0, Math.min(255, Math.round((v + th) / 6) * 6)));
    r.setRGBA(X, Y, q[0], q[1], q[2], 255);
  };
  for (let Y = 0; Y < H; Y++)
    for (let X = 0; X < W; X++) {
      const [x, y] = [(X + 0.5) / S, (Y + 0.5) / S];
      if (y >= WATERLINE) {
        put(layers.water, X, Y, waterAt(x, y));
        continue;
      }
      const land = shoreAt(x, y) ?? hillAt(x, y) ?? fujiAt(x, y);
      if (land) put(layers.land, X, Y, land);
      put(layers.sky, X, Y, skyAt(x, y));
    }
  return layers;
}
