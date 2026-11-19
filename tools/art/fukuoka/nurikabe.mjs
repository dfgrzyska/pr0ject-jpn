// NURIKABE, Fukuoka's boss (docs/plan-fukuoka.md, 6.2): the wall that bars the way, risen out of the field of the old
// government's ruins under the Mizuki earthwork at sunset. Our own design (not the flat slab of the comics): a stretch
// of the earthwork itself, seen from above as the strip sees everything - its ridge under grass with young plums on
// it, and its face towards the ship of rammed earth laid in courses of different earths (ochre, tan, red, grey-brown,
// dark loam), each course packed in thin layers, on a footing of dressed stones. Its mouth is the earthwork's old
// wooden conduit, a box of planks through its face with a sluice board; its eyes are of fired clay and open between
// two courses. It runs the width of the screen.
//
// Phase 13 of the plan: the design in its three forms for the author (preview: node tools/art/fukuoka/nurikabe.mjs
// -> tools/preview/stage12_nurikabe.png): the wall; the alley (its core and four stretches of it, a gold cornerstone
// in each one's footing); the night (gone invisible: its shadow, its eyes, the plum petals settled on its ridge).
// Its parts for the fight come once it is approved.
import { HiSprite, tones, fur, speckle, mottle, mix2, hash } from '../../lib/hisprite.mjs';

const RAMPS = {
  gr: tones([0x3a4620, 0x6e7c3a, 0xa8b45c]), // the grass on its ridge
  gd: tones([0x2a3418, 0x4e5a2a, 0x7a8a40]), // the grass in its shade, the tufts
  e1: tones([0x7a5a2e, 0xb08e56, 0xdcc08a]), // ochre earth
  e2: tones([0x5e5444, 0x8a7e66, 0xb8ac90]), // grey-brown
  e3: tones([0x5a321e, 0x8c5434, 0xbc8456]), // red earth
  e4: tones([0x6a5638, 0x9c845a, 0xcab48a]), // tan
  e5: tones([0x3a2e20, 0x5e4c34, 0x8a7454]), // dark loam
  st: tones([0x55524a, 0x928e82, 0xccc8ba]), // the footing's stones
  gs: tones([0x8a6010, 0xd8a028, 0xfff0a0]), // the gold cornerstone
  mn: [0x0e4a3a, 0x2a9a7a, 0x81f3cc, 0xc8fff0, 0xf4fffa], // the footing glowing mint (it can be hit there)
  wd: tones([0x3a2414, 0x6a4a2a, 0xa07a4a]), // the conduit's planks
  cl: tones([0x6a3a20, 0xa86a40, 0xd89a68]), // the eyes' lids of fired clay
  ey: tones([0xa89474, 0xe0d0b0, 0xfff8e8]), // the eyes' whites, biscuit clay
  wa: [0x1a4a7a, 0x3a86c0, 0x8ac8f0, 0xd0f0ff, 0xffffff], // water
  bk: tones([0x2a2018, 0x4a3a2a, 0x6a5a44]), // the plums' bark
  um: [0xa83a5a, 0xe87aa0, 0xffc8d8, 0xfff0f4, 0xffffff], // plum blossom
};
const INK = 0x140c08;
export const WALL_W = 540; // (fine px: the screen's width)
export const WALL_H = 196;
export const COURSES = [['e1', 11], ['e2', 8], ['e3', 12], ['e4', 9], ['e5', 7], ['e1', 13], ['e2', 8], ['e3', 10], ['e4', 9], ['e5', 6], ['e2', 11]]; // (top to bottom)
const RIDGE = [6, 56]; // the ridge's far and near edges (fine y)
const FOOT = [166, 188]; // the footing of stones
export const EYES = [-96, 96]; // (fine x from the middle; between the second and third course)
const EYE_Y = 86;
export const MOUTH = [0, 144];

const wob = (x, a, b, seed) => Math.sin(x / a + seed) * 1.6 + Math.sin(x / b + seed * 2.3) * 0.9;

/**
 * A stretch of the wall `w` fine px wide. o: k (breathing, 0-3: its courses shift a little), eyes ('shut' | 'half' |
 * 'open' | 'glare' | null for none), mouth (0 shut, 1 open, 2 open and gushing), lift (its footing showing, glowing
 * mint), cut ('' | 'l' | 'r' | 'lr': broken off at that end, its courses showing in the break), gold (a cornerstone
 * in its footing, at fine x), plums (fine x of young plums on its ridge), petals (how many settled on its ridge),
 * slot (a small conduit in its face), seed.
 */
export function wallPart(w, o = {}) {
  const s = new HiSprite(w, WALL_H, RAMPS);
  const k = o.k ?? 0;
  const seed = o.seed ?? 1;
  const cx = w / 2;
  const breath = (x) => Math.sin(x / 41 + k * 1.57) * 0.8; // (its courses swelling and settling as it breathes)
  const cutL = (o.cut ?? '').includes('l');
  const cutR = (o.cut ?? '').includes('r');
  // a broken end: ragged, a few px in, its line wandering down the wall
  const endIn = (x, y) => {
    const r = 6 + Math.sin(y / 5 + seed) * 3 + hash(1, Math.floor(y / 3), seed) * 4;
    return (cutL && x < r) || (cutR && x > w - r);
  };
  const top = (x) => RIDGE[0] + wob(x, 37, 13, seed);
  const edge = (x) => RIDGE[1] + wob(x, 29, 11, seed + 1) * 0.8;
  // ---- the footing: dressed stones in a course, mortar between; mint when it lifts
  const lift = !!o.lift;
  let x0 = 0;
  for (let n = 0; x0 < w; n++) {
    const sw = 18 + hash(n, 3, seed) * 16;
    const xa = x0 + 1;
    const xb = Math.min(w - 1, x0 + sw - 1);
    s.poly([[xa, FOOT[0] + 1], [xb, FOOT[0] + 1], [xb + 0.5, FOOT[1] - 1], [xa - 0.5, FOOT[1] - 1]], lift ? 'mn' : 'st', { flat: lift ? 0.55 + hash(n, 5, seed) * 0.15 : 0.5 + hash(n, 4, seed) * 0.2, pat: speckle({ amt: 0.14, seed: n + 3 }), glow: lift });
    s.shade([xa, FOOT[0], xb, FOOT[0] + 4], () => true, 0.12); // (their tops worn, catching the light)
    if (o.gold != null && o.gold > xa && o.gold < xb) {
      // the cornerstone: gilded, a ring cut in its face
      s.poly([[xa, FOOT[0] + 1], [xb, FOOT[0] + 1], [xb + 0.5, FOOT[1] - 1], [xa - 0.5, FOOT[1] - 1]], 'gs', { flat: 0.6, pat: speckle({ amt: 0.12, seed: 9 }) });
      const gx = (xa + xb) / 2;
      for (let a = 0; a < 6.28; a += 0.2) s.px(gx + Math.cos(a) * 5, FOOT[0] + 9 + Math.sin(a) * 4, 0x8a6010);
      s.px(gx - 3, FOOT[0] + 4, 0xffffff).px(gx - 2, FOOT[0] + 4, 0xfff8c0);
    }
    x0 += sw;
  }
  // ---- its face: course on course of rammed earth, each packed in thin layers, pebbles in it
  let y = edge(0);
  const bounds = [];
  let acc = 0;
  for (const [, h] of COURSES) {
    acc += h;
    bounds.push(acc);
  }
  const faceTop = RIDGE[1];
  const faceH = FOOT[0] - faceTop;
  const scale = faceH / acc;
  COURSES.forEach(([mat, h], n) => {
    const y0 = n === 0 ? -99 : faceTop + (bounds[n - 1]) * scale;
    const y1 = faceTop + bounds[n] * scale;
    const b0 = (x) => (n === 0 ? edge(x) : y0 + wob(x, 23 + n * 3, 9 + n, seed + n) * 0.7 + breath(x + n * 30));
    const b1 = (x) => (n === COURSES.length - 1 ? FOOT[0] + 1 : y1 + wob(x, 23 + (n + 1) * 3, 9 + n + 1, seed + n + 1) * 0.7 + breath(x + (n + 1) * 30));
    s.paint([0, Math.max(0, y0 - 4), w, y1 + 4], (px, py) => py >= b0(px) && py < b1(px), mat, (px, py) => 0.5 + (py - b0(px)) * -0.01 + 0.07 * Math.sin(px / 70 + n * 1.7) - (px / w) * 0.08, { pat: mix2(speckle({ amt: 0.16, seed: 20 + n }), mottle({ amt: 0.16, scale: 17, seed: 30 + n })) });
    // its thin packed layers, and the line where one course was rammed on the last
    for (let ly = 1; ly < h * scale; ly += 2.6)
      s.shade([0, y0 + ly - 3, w, y0 + ly + 3], (px, py) => Math.abs(py - (b0(px) + ly)) < 0.5, -0.07);
    s.shade([0, y1 - 4, w, y1 + 4], (px, py) => Math.abs(py - b1(px)) < 0.8, -0.18);
    // pebbles bedded in it
    for (let i = 0; i < w / 14; i++) {
      const px = hash(i, n, seed + 40) * w;
      const py = (b0(px) + b1(px)) / 2 + (hash(i, n, seed + 41) - 0.5) * h * scale * 0.7;
      if (hash(i, n, seed + 42) < 0.45) s.dot(px, py, 0.9 + hash(i, n, 43) * 0.8, hash(i, n, 44) < 0.5 ? 0xb4b0a6 : 0x6a665e);
    }
  });
  void y;
  // shrinkage cracks down two or three courses, roots hanging out under the grass, moss on the footing's tops
  for (let i = 0; i < w / 70; i++) {
    let cx0 = 20 + hash(i, 11, seed) * (w - 40);
    let cy0 = faceTop + 14 + hash(i, 12, seed) * 40;
    const len = 18 + hash(i, 13, seed) * 30;
    for (let t = 0; t < len; t++) {
      s.px(cx0, cy0, 0x2a1e14, 0.85);
      if (hash(i, t, seed + 14) < 0.3) s.px(cx0 + 1, cy0, 0x2a1e14, 0.5);
      cx0 += (hash(i, t, seed + 15) - 0.5) * 1.6;
      cy0 += 1;
    }
  }
  for (let i = 0; i < w / 22; i++) {
    const rx = hash(i, 16, seed) * w;
    let ry = faceTop + 2;
    const len = 4 + hash(i, 17, seed) * 12;
    for (let t = 0; t < len; t++) s.px(rx + Math.sin(t * 0.7 + i) * 1.2, ry++, 0xc8b490, 0.8);
  }
  for (let i = 0; i < w / 6; i++) {
    const mx = hash(i, 18, seed) * w;
    if (hash(i, 19, seed) < 0.55) s.dot(mx, FOOT[0] + 1 + hash(i, 20, seed) * 2, 1 + hash(i, 21, seed), hash(i, 22, seed) < 0.5 ? 0x5a6a2a : 0x7a8a3a, 0.9);
  }
  // the light: the face in the evening sun from the left, the ridge's overhang shading its top
  s.shade([0, faceTop, w, faceTop + 12], (px, py) => py < edge(px) + 6, (px, py) => -0.14 * (1 - (py - edge(px)) / 6));
  // ---- its ridge under grass, the grass hanging over the face's edge in tufts
  s.paint([0, 0, w, RIDGE[1] + 3], (px, py) => py >= top(px) && py < edge(px), 'gr', (px, py) => 0.62 - (py - top(px)) * 0.004, { pat: mix2(fur(Math.PI / 2.4, { amt: 0.26, len: 6, seed: 5 + seed }), mottle({ amt: 0.14, scale: 9, seed: 7 })) });
  for (let i = 0; i < w / 4; i++) {
    const px = i * 4 + hash(i, 1, seed) * 3;
    const len = 2 + hash(i, 2, seed) * 5;
    const e = edge(px);
    s.line(px, e - 1, px + (hash(i, 3, seed) - 0.5) * 2, e + len, hash(i, 4, seed) < 0.5 ? 0x4e5a2a : 0x6e7c3a, 1);
  }
  for (let i = 0; i < w / 9; i++) {
    // darker tufts, clover, a dandelion now and then
    const px = hash(i, 5, seed) * w;
    const py = top(px) + 3 + hash(i, 6, seed) * (edge(px) - top(px) - 6);
    s.ellipse(px, py, 2.4 + hash(i, 7, seed) * 2, 1.6 + hash(i, 8, seed), 'gd', { flat: 0.5 });
    if (hash(i, 9, seed) < 0.12) s.dot(px + 2, py - 1, 1, 0xf0d040);
  }
  // ---- the young plums on its ridge: bare twigs, white and pink blossom, their shadows on the grass
  for (const [n, px] of (o.plums ?? []).entries()) {
    const py = (top(px) + edge(px)) / 2 - 2;
    s.ellipse(px + 8, py + 7, 13, 5, 'gd', { flat: 0.35 });
    for (let b = 0; b < 7; b++) {
      const a = (b / 7) * 6.28 + n;
      s.line(px, py, px + Math.cos(a) * 12, py + Math.sin(a) * 8, 0x3a2e20, 1);
    }
    s.ellipse(px, py, 2.4, 2.4, 'bk');
    for (let b = 0; b < 44; b++) {
      const a = hash(b, n, 60) * 6.28;
      const r = 3 + hash(b, n, 61) * 11;
      s.ellipse(px + Math.cos(a) * r, py + Math.sin(a) * r * 0.7, 1.5, 1.3, 'um', { flat: 0.5 + hash(b, n, 62) * 0.45 });
    }
  }
  // ---- a small conduit in a stretch's face (the alley: water from the gaps)
  if (o.slot) conduit(s, cx, 138, 0.7, o.mouth ?? 0);
  // ---- its mouth: the old wooden conduit, through its face; the earth below it dark with the damp
  if ((o.mouth != null || o.damp) && !o.slot) s.shade([cx - 40, MOUTH[1], cx + 40, FOOT[0]], (px, py) => Math.abs(px - cx) < 30 - (py - MOUTH[1]) * 0.2 + Math.sin(py / 3) * 2, -0.16);
  if (o.mouth != null && !o.slot) conduit(s, cx + MOUTH[0], MOUTH[1], 1.3, o.mouth);
  // ---- its eyes of fired clay, between the second and third course
  if (o.eyes) for (const ex of o.eyeAt ?? EYES) eye(s, cx + ex, EYE_Y + breath(cx + ex), o.eyes, ex < 0 ? -1 : ex > 0 ? 1 : -1);
  // ---- broken ends: the courses showing in the break, darker, crumbs at its foot
  if (cutL || cutR) {
    for (let py = 0; py < WALL_H; py++)
      for (let px = 0; px < w; px++) {
        if (!endIn(px, py)) continue;
        const i = py * w + px;
        if (s.mat[i] && s.mat[i] !== '_') s.mat[i] = null;
        s.over.delete(i);
      }
    for (const side of [cutL ? 1 : 0, cutR ? -1 : 0].filter(Boolean)) {
      const ex = (py) => (side > 0 ? 6 + Math.sin(py / 5 + seed) * 3 + hash(1, Math.floor(py / 3), seed) * 4 : w - 6 - Math.sin(py / 5 + seed) * 3 - hash(1, Math.floor(py / 3), seed) * 4);
      s.shade([0, 0, w, WALL_H], (px, py) => Math.abs(px - ex(py)) < 3, -0.2);
      for (let i = 0; i < 6; i++) s.dot(ex(FOOT[1]) + side * (2 + hash(i, 1, seed) * 8), FOOT[1] + 2 + hash(i, 2, seed) * 4, 1.2, hash(i, 3, seed) < 0.5 ? 0x8a7e66 : 0x5e4c34);
    }
  }
  // ---- plum petals settled on its ridge
  for (let i = 0; i < (o.petals ?? 0); i++) {
    const px = hash(i, 70, seed) * w;
    const py = top(px) + 2 + hash(i, 71, seed) * (edge(px) - top(px) - 3);
    s.px(px, py, hash(i, 72, seed) < 0.6 ? 0xfff0f4 : 0xf8b0c8).px(px + 1, py, 0xffe8f0).px(px, py + 1, 0xf8c0d0, 0.8);
  }
  return s;
}

/** The old wooden conduit: a box of planks out of its face; a sluice board (shut), lifted (open), water gushing. */
function conduit(s, x, y, k, mouth) {
  const bw = 26 * k;
  const bh = 13 * k;
  // its top, seen from above as it juts out towards the ship, planks along it
  s.poly([[x - bw, y - bh - 6 * k], [x + bw, y - bh - 6 * k], [x + bw + 2, y - bh], [x - bw - 2, y - bh]], 'wd', { flat: 0.72, pat: fur(0, { amt: 0.2, len: 12, seed: 4 }) });
  for (let px = x - bw + 6; px < x + bw; px += 9 * k) s.line(px, y - bh - 6 * k, px + 0.5, y - bh, 0x3a2414, 1, 0.7);
  // its mouth: a frame of planks, dark inside
  s.poly([[x - bw - 2, y - bh], [x + bw + 2, y - bh], [x + bw + 2, y + bh], [x - bw - 2, y + bh]], 'wd', { flat: 0.5, pat: fur(0, { amt: 0.22, len: 10, seed: 5 }) });
  const iw = bw - 5 * k;
  const ih = bh - 4 * k;
  const open = mouth > 0;
  s.poly([[x - iw, y - ih], [x + iw, y - ih], [x + iw, y + ih], [x - iw, y + ih]], 'e5', { flat: 0.05 });
  s.paint([x - iw, y - ih, x + iw, y + ih], (px, py) => Math.abs(px - x) < iw && Math.abs(py - y) < ih, 'e5', () => 0, {});
  for (let py = Math.ceil(y - ih); py < y + ih; py++) for (let px = Math.ceil(x - iw); px < x + iw; px++) s.px(px, py, INK, 0.85);
  if (!open) {
    // the sluice board down over most of it, a rope to lift it by
    s.poly([[x - iw - 1, y - ih + 3 * k], [x + iw + 1, y - ih + 3 * k], [x + iw + 1, y + ih + 1], [x - iw - 1, y + ih + 1]], 'wd', { flat: 0.62, pat: fur(0, { amt: 0.18, len: 14, seed: 6 }) });
    s.line(x - iw, y - ih + 3 * k, x + iw, y - ih + 3 * k, 0x2a1a0c, 1);
    s.line(x, y - ih + 3 * k, x, y - bh - 5 * k, 0xb0a070, 1);
  } else {
    // its teeth: the board's broken stubs at the top
    for (let px = x - iw + 2; px < x + iw - 2; px += 6 * k) s.poly([[px, y - ih], [px + 4 * k, y - ih], [px + 2 * k, y - ih + 4 * k]], 'wd', { flat: 0.7 });
    if (mouth > 1) {
      // water gushing out and down its face, spray
      s.poly([[x - iw + 2, y + ih - 6 * k], [x + iw - 2, y + ih - 6 * k], [x + iw + 4, y + bh + 18 * k], [x - iw - 4, y + bh + 18 * k]], 'wa', { flat: 0.6, glow: true, pat: fur(Math.PI / 2, { amt: 0.3, len: 8, seed: 8 }) });
      for (let i = 0; i < 16; i++) s.dot(x + (hash(i, 1, 9) - 0.5) * bw * 2.4, y + bh + 14 * k + hash(i, 2, 9) * 8, 1 + hash(i, 3, 9), 0xd0f0ff, 0.9);
    }
  }
  // iron bands round the box
  for (const bx of [x - bw + 3, x + bw - 3]) s.line(bx, y - bh - 6 * k, bx, y + bh, 0x2a2a30, 1.4);
}

/** One of its eyes of fired clay, opening between two courses. look: shut, half, open, glare, glow (at night). */
function eye(s, x, y, look, side) {
  if (look === 'shut') {
    // the crease between the courses, a lip of clay under it
    for (let dx = -22; dx <= 22; dx++) {
      const yy = y + (1 - (dx / 22) ** 2) * 3;
      s.px(x + dx, yy, 0x2a1a10).px(x + dx, yy + 1, 0xd89a68, 0.6);
    }
    return;
  }
  const ry = look === 'half' ? 5 : look === 'glare' ? 8 : 11;
  // the lids: a rim of fired clay round the opening
  s.ellipse(x, y, 26, ry + 4.4, 'cl', { bias: 0.05 });
  if (look === 'glow') {
    s.ellipse(x, y, 22, ry, 'gs', { flat: 0.82, glow: true });
    s.ellipse(x, y, 16, ry * 0.7, 'gs', { flat: 0.98, glow: true });
    s.dot(x + side * -1, y + 1, 5.6, 0xfff0a0);
    s.dot(x + side * -1, y + 1, 2.8, 0xffffff);
    return;
  }
  s.ellipse(x, y, 22, ry, 'ey', { bias: 0.08 });
  // the pupil: dark iron glaze, looking down and in at the ship
  const pr = look === 'glare' ? 4.6 : 6.4;
  s.dot(x - side * 2, y + Math.min(2, ry - pr), pr, 0x2a1a10);
  s.dot(x - side * 2 - 2, y + Math.min(2, ry - pr) - 2.2, 1.6, 0xfff8e8);
  if (look === 'glare') {
    // the upper lid drawn down towards the middle, a frown
    s.poly([[x - 27, y - ry - 5], [x + 27, y - ry - 5], ...(side < 0 ? [[x + 27, y - 1], [x - 27, y - ry + 2]] : [[x + 27, y - ry + 2], [x - 27, y - 1]])], 'cl', { flat: 0.42 });
  }
  // crumbs of earth falling off the lid
  for (let i = 0; i < 6; i++) s.dot(x + (hash(i, 1, x) - 0.5) * 40, y + ry + 5 + hash(i, 2, x) * 5, 0.9, 0x8a7e66);
}

const EYE_CORE = [-64, 64];

// ---------------------------------------------------------------- the three forms, whole, for the author
/** The wall (phase 1): k breathing, its eyes and mouth; lift: up for a hop, its footing glowing mint. */
export function wall(o = {}) {
  return wallPart(WALL_W, { eyes: 'open', mouth: 0, plums: [118, 404], seed: 1, ...o }).render({ outline: 2 });
}

/** The core it keeps in the alley (phase 2): its face, broken off at both ends. */
export function core(o = {}) {
  return wallPart(240, { eyes: 'glare', eyeAt: EYE_CORE, mouth: 1, cut: 'lr', plums: [60], seed: 2, ...o }).render({ outline: 2 });
}

/** One of the four stretches it breaks into (phase 2), a gold cornerstone in its footing. */
export function stretch(n, o = {}) {
  return wallPart(124, { cut: n % 2 ? 'l' : 'r', gold: 62, slot: true, mouth: o.mouth ?? 0, seed: 3 + n, plums: n === 1 ? [40] : [], ...o }).render({ outline: 2 });
}

/** The night (phase 3): gone invisible but for its eyes and the petals settled on its ridge, its outline a shimmer. */
export function night(o = {}) {
  const s = wallPart(WALL_W, { eyes: o.eyes === undefined ? 'glow' : o.eyes, mouth: null, petals: 520, seed: 1, plums: [] });
  const out = s.render({ outline: 0 });
  // keep only the eyes, the petals and a faint shimmer of its edges
  const keep = (x, y) => {
    const i = (y * WALL_W + x) * 4;
    const [r, g, b] = [out.data[i], out.data[i + 1], out.data[i + 2]];
    return (r > 225 && g > 150) || (r > 230 && b > 150) ? 1 : 0;
  };
  const edgeA = (x, y) => {
    const a = out.data[(y * WALL_W + x) * 4 + 3];
    const n = (dx, dy) => (x + dx >= 0 && y + dy >= 0 && x + dx < WALL_W && y + dy < WALL_H ? out.data[((y + dy) * WALL_W + x + dx) * 4 + 3] : 0);
    if (y > FOOT[0] - 2 && y < FOOT[1] - 2) return 0; // (not the joints of its footing: only its outline)
    return a && (!n(0, -1) || !n(0, 1) || !n(-1, 0) || !n(1, 0)) ? 1 : 0;
  };
  const res = out.clone ? out.clone() : out;
  const flags = new Uint8Array(WALL_W * WALL_H);
  for (let y = 0; y < WALL_H; y++) for (let x = 0; x < WALL_W; x++) flags[y * WALL_W + x] = keep(x, y) ? 2 : edgeA(x, y) ? 1 : 0;
  for (let y = 0; y < WALL_H; y++)
    for (let x = 0; x < WALL_W; x++) {
      const i = (y * WALL_W + x) * 4;
      const f = flags[y * WALL_W + x];
      if (f === 2) continue;
      if (f === 1) {
        res.data[i] = 220;
        res.data[i + 1] = 230;
        res.data[i + 2] = 255;
        res.data[i + 3] = (o.shimmer ?? 0.35) * 255 * (0.5 + hash(x, y, 3) * 0.5);
      } else res.data[i + 3] = 0;
    }
  return res;
}

// ---------------------------------------------------------------- its small things
/** A clod of earth it sheds (its bullets on landing), grass on some. */
export function clod(f) {
  const s = new HiSprite(18, 16, RAMPS);
  s.ellipse(9, 9, 6.4, 5.2, ['e1', 'e3', 'e5', 'e2'][f & 3], { pat: speckle({ amt: 0.2, seed: f + 2 }) });
  s.ellipse(7, 7, 2.6, 2, ['e4', 'e1', 'e2', 'e4'][f & 3], { flat: 0.7 });
  if (f % 2 === 0) for (let i = 0; i < 5; i++) s.line(5 + i * 1.6, 5, 4 + i * 1.8, 1 + (i % 2), 0x6e7c3a, 1);
  return s.render({ outline: 1 });
}

/** A gout of water off its mouth. */
export function gout(f) {
  const s = new HiSprite(14, 18, RAMPS);
  s.ellipse(7, 10, 4.6, 6.4 - f, 'wa', { glow: true, flat: 0.6 });
  s.dot(5.6, 7.6, 1.2, 0xffffff);
  s.ellipse(7, 4 + f, 2.4, 2.4, 'wa', { glow: true, flat: 0.75 });
  return s.render({ outline: 1, outlineColor: 0x0e2a4a });
}

/** A plum petal drifting (f: its turn). */
export function petal(f) {
  const s = new HiSprite(9, 9, RAMPS);
  const rx = [3.6, 2.6, 1.4, 2.6][f & 3];
  s.ellipse(4.5, 4.5, rx, 3, 'um', { flat: 0.75 + (f & 1) * 0.1 });
  s.dot(4.5, 4.5, 0.8, 0xe87aa0);
  return s.render({ outline: 0 });
}

/** The young plum that flowers on its ridge at the end. */
export function plumInBloom() {
  const s = new HiSprite(60, 52, RAMPS);
  s.ellipse(34, 34, 24, 10, 'gd', { flat: 0.25 });
  for (let b = 0; b < 9; b++) {
    const a = (b / 9) * 6.28 + 0.3;
    s.tube(30, 26, 30 + Math.cos(a) * 20, 26 + Math.sin(a) * 15, 1.4, 'bk', { rb: 0.6 });
  }
  s.ellipse(30, 26, 3.2, 3.2, 'bk');
  for (let b = 0; b < 90; b++) {
    const a = hash(b, 1, 80) * 6.28;
    const r = 4 + hash(b, 2, 80) * 18;
    s.ellipse(30 + Math.cos(a) * r, 26 + Math.sin(a) * r * 0.75, 1.8, 1.6, 'um', { flat: 0.55 + hash(b, 3, 80) * 0.4 });
  }
  for (let b = 0; b < 30; b++) s.px(30 + (hash(b, 4, 81) - 0.5) * 36, 26 + (hash(b, 5, 81) - 0.5) * 28, 0xa83a5a);
  return s.render({ outline: 1 });
}

/** Its shadow on the field (the night: all that shows of it). */
export function shadow(w = WALL_W) {
  const s = new HiSprite(w, 40, RAMPS);
  s.paint([0, 0, w, 40], (x, y) => y > 4 + Math.sin(x / 31) * 2 && y < 36 - Math.sin(x / 23) * 2, 'e5', () => 0, {});
  const r = s.render({ outline: 0 });
  for (let i = 0; i < r.data.length; i += 4) {
    if (!r.data[i + 3]) continue;
    const y = Math.floor(i / 4 / w);
    r.data[i] = 10;
    r.data[i + 1] = 8;
    r.data[i + 2] = 16;
    r.data[i + 3] = 150 * Math.min(1, Math.min(y - 4, 36 - y) / 10);
  }
  return r;
}

export { EYE_CORE, WALL_H as H };

// ---------------------------------------------------------------- its parts for the fight (the city's atlas)
// Where they sit, fine px from the middle of the wall's frame (the game has them in logical px, a third of these: NURI
// in fukuoka-nurikabe.js; the test fukuokaNurikabe checks they agree).
export const PARTS = {
  eyes: EYES.map((x) => [x, EYE_Y - WALL_H / 2]),
  eyesCore: EYE_CORE.map((x) => [x, EYE_Y - WALL_H / 2]),
  mouth: [MOUTH[0], MOUTH[1] - WALL_H / 2],
  slot: [0, 138 - WALL_H / 2],
  gold: [0, (FOOT[0] + FOOT[1]) / 2 - WALL_H / 2],
  foot: [0, FOOT[0] - WALL_H / 2, FOOT[1] - WALL_H / 2], // (the footing's top and bottom)
  ridge: [RIDGE[0] - WALL_H / 2, RIDGE[1] - WALL_H / 2],
};
export const EYE_FRAME = { w: 60, h: 36 }; // (its eye in the middle)
export const MOUTH_FRAME = { w: 84, h: 84, oy: 30 }; // (the conduit's mouth at (w / 2, oy))
export const SIZES = { wall: WALL_W, core: 240, stretch: 124 };

/** An eye on its own frame: look (shut, half, open, glare, glow), side -1 (its left) or 1. */
export function eyeFrame(look, side) {
  const s = new HiSprite(EYE_FRAME.w, EYE_FRAME.h, RAMPS);
  eye(s, EYE_FRAME.w / 2, EYE_FRAME.h / 2, look, side);
  return s.render({ outline: look === 'shut' ? 0 : 1 });
}

/** Its mouth on its own frame: 0 shut, 1 open, 2-3 gushing. */
export function mouthFrame(m) {
  const s = new HiSprite(MOUTH_FRAME.w, MOUTH_FRAME.h, RAMPS);
  conduit(s, MOUTH_FRAME.w / 2, MOUTH_FRAME.oy, 1.3, m >= 2 ? 2 : m);
  if (m === 3) s.shade([0, 0, MOUTH_FRAME.w, MOUTH_FRAME.h], (x, y) => y > MOUTH_FRAME.oy + 12 && Math.sin(y / 2.4 + x / 9) > 0.3, 0.12);
  return s.render({ outline: 1 });
}

/** The footing alone, glowing mint (over the wall as it lifts: it can be hit there). */
export function footMint(w = WALL_W) {
  const s = wallPart(w, { lift: true, seed: 1 });
  for (let i = 0; i < s.mat.length; i++) if (Math.floor(i / w) < FOOT[0] - 1) s.mat[i] = null;
  return s.render({ outline: 0 });
}

/** Every frame, under the names the fight uses (src/game/enemies/fukuoka-nurikabe.js). */
export function nurikabeFrames(add) {
  for (let k = 0; k < 4; k++) add(`nu_wall_${k}`, wallPart(WALL_W, { k, damp: true, plums: [118, 404], seed: 1 }).render({ outline: 2 }));
  for (let k = 0; k < 2; k++) add(`nu_core_${k}`, wallPart(240, { k: k * 2, damp: true, cut: 'lr', plums: [60], seed: 2 }).render({ outline: 2 }));
  for (let n = 0; n < 4; n++) add(`nu_stretch_${n}`, wallPart(124, { cut: n % 2 ? 'l' : 'r', gold: 62, slot: true, mouth: 0, seed: 3 + n, plums: n === 1 ? [40] : [] }).render({ outline: 2 }));
  add('nu_foot', footMint());
  add('nu_night', night({ eyes: null }));
  for (const look of ['shut', 'half', 'open', 'glare', 'glow']) for (const [side, n] of [[-1, 'l'], [1, 'r']]) add(`nu_eye_${look}_${n}`, eyeFrame(look, side));
  for (let m = 0; m < 4; m++) add(`nu_mouth_${m}`, mouthFrame(m));
  add('nu_shadow', shadow());
  add('nu_shadow_m', shadow(240));
  add('nu_shadow_s', shadow(124));
  for (let f = 0; f < 4; f++) {
    add(`nu_clod_${f}`, clod(f));
    add(`nu_petal_${f}`, petal(f));
  }
  for (let f = 0; f < 2; f++) add(`nu_gout_${f}`, gout(f));
  add('nu_plum', plumInBloom());
}

// ---------------------------------------------------------------- the preview: the three forms on the ruins' field
if (process.argv[1]?.replace(/\\/g, '/').endsWith('fukuoka/nurikabe.mjs')) {
  const { writeFileSync, existsSync, readFileSync, mkdirSync } = await import('node:fs');
  const { Raster } = await import('../../lib/raster.mjs');
  const [PW, PH] = [540, 1140];
  // the strip's end (its top rows: the field, the earthwork, the moat), cached between runs
  const cache = new URL('../../preview/scratch/s12_end.bin', import.meta.url);
  let field;
  if (existsSync(cache)) field = { w: PW, h: PH, data: readFileSync(cache) };
  else {
    const { buildMid } = await import('./mid.mjs');
    const { strip } = buildMid();
    field = { w: PW, h: PH, data: Buffer.from(strip.data.subarray(0, PW * PH * 4)) };
    mkdirSync(new URL('../../preview/scratch/', import.meta.url), { recursive: true });
    writeFileSync(cache, field.data);
  }
  const out = new Raster(PW * 3 + 40, PH + 300);
  out.rect(0, 0, out.w, out.h, 0x101018);
  const put = (r, x0, y0, scale = 1, alpha = 1) => {
    for (let y = 0; y < r.h * scale; y++)
      for (let x = 0; x < r.w * scale; x++) {
        const i = (Math.floor(y / scale) * r.w + Math.floor(x / scale)) * 4;
        if (r.data[i + 3] < 8) continue;
        const X = x0 + x;
        const Y = y0 + y;
        if (X < 0 || Y < 0 || X >= out.w || Y >= out.h) continue;
        const j = (Y * out.w + X) * 4;
        const a = (r.data[i + 3] / 255) * alpha;
        for (let c = 0; c < 3; c++) out.data[j + c] = r.data[i + c] * a + out.data[j + c] * (1 - a);
      }
  };
  const ground = (ox, tint) => {
    for (let y = 0; y < PH; y++)
      for (let x = 0; x < PW; x++) {
        const i = (y * PW + x) * 4;
        let [r, g, b] = [field.data[i], field.data[i + 1], field.data[i + 2]];
        if (tint === 'dusk') [r, g, b] = [r * 1.0 + 6, g * 0.93, b * 0.84];
        if (tint === 'night') [r, g, b] = [r * 0.3 + 6, g * 0.32 + 8, b * 0.42 + 26];
        out.setRGBA(ox + x, y, Math.min(255, r), Math.min(255, g), Math.min(255, b), 255);
      }
  };
  // 1. the wall: risen in front of the earthwork, across the field, its mouth gushing; the shadow it casts
  ground(0, 'dusk');
  put(shadow(), 8, 560 + 168, 1, 0.9);
  // (put together from its parts, where the game puts them)
  const frames = {};
  nurikabeFrames((name, r) => (frames[name] = r));
  const at = (name, cx, cy, [dx, dy]) => put(frames[name], cx + dx - frames[name].w / 2, cy + dy - frames[name].h / 2);
  const mouthAt = (name, cx, cy) => put(frames[name], cx + PARTS.mouth[0] - MOUTH_FRAME.w / 2, cy + PARTS.mouth[1] - MOUTH_FRAME.oy);
  const face = (body, cx, cy, eyes, look, mouth) => {
    at(body, cx, cy, [0, 0]);
    eyes.forEach((p, i) => at(`nu_eye_${look}_${i ? 'r' : 'l'}`, cx, cy, p));
    mouthAt(`nu_mouth_${mouth}`, cx, cy);
  };
  face('nu_wall_0', 270, 560 + WALL_H / 2, PARTS.eyes, 'open', 2);
  // its next hop flagged: a red band on the ground
  for (let y = 800; y < 940; y++) for (let x = 0; x < PW; x++) if ((x + y) % 10 < 5 && (y < 804 || y > 936)) out.setRGBA(x, y, 255, 115, 94, 255);
  // 2. the alley: its core before the earthwork, four stretches round the ship's lane closing in
  const ox2 = PW + 20;
  ground(ox2, 'dusk');
  put(shadow(240), ox2 + 150 + 6, 410 + 168, 1, 0.9);
  face('nu_core_0', ox2 + 270, 410 + WALL_H / 2, PARTS.eyesCore, 'glare', 3);
  const lanes = [[16, 650, 0], [400, 650, 1], [76, 860, 2], [340, 860, 3]];
  for (const [x, y, n] of lanes) {
    put(shadow(124), ox2 + x + 6, y + 168, 1, 0.9);
    at(`nu_stretch_${n}`, ox2 + x + 62, y + WALL_H / 2, [0, 0]);
  }
  // 3. the night: the sun down, the wall invisible, its shadow, its eyes, the petals on its ridge
  const ox3 = 2 * (PW + 20);
  ground(ox3, 'night');
  put(shadow(), ox3 + 8, 600 + 168, 1, 0.75);
  at('nu_night', ox3 + 270, 600 + WALL_H / 2, [0, 0]);
  PARTS.eyes.forEach((p, i) => at(`nu_eye_glow_${i ? 'r' : 'l'}`, ox3 + 270, 600 + WALL_H / 2, p));
  for (let i = 0; i < 40; i++) put(petal(i & 3), ox3 + hash(i, 1, 5) * PW, 300 + hash(i, 2, 5) * 600);
  // the small things, twice the size, along the bottom
  let x = 10;
  const smalls = [
    wallPart(120, { eyes: 'shut', eyeAt: [0], seed: 1 }).render({ outline: 1 }),
    wallPart(120, { eyes: 'half', eyeAt: [0], seed: 1 }).render({ outline: 1 }),
    wallPart(120, { eyes: 'glare', eyeAt: [0], seed: 1 }).render({ outline: 1 }),
    wallPart(120, { lift: true, eyes: 'open', eyeAt: [0], seed: 1 }).render({ outline: 1 }),
    clod(0), clod(1), clod(2), gout(0), gout(1), petal(0), petal(1), petal(2), plumInBloom(),
  ];
  for (const r of smalls) {
    if (x + r.w * 2 > out.w) break;
    put(r, x, PH + 10, 2);
    x += r.w * 2 + 12;
  }
  mkdirSync(new URL('../../preview/', import.meta.url), { recursive: true });
  writeFileSync(new URL('../../preview/stage12_nurikabe.png', import.meta.url), out.toPNG());
  console.log('stage12_nurikabe.png');
}
