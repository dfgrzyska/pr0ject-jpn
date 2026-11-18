// DAIDARABOTCHI, Kawaguchiko's boss (docs/plan-kawaguchiko.md, 6.2 and phases 12-13): the giant of the old tales
// who dug the earth and heaped it into Fuji, the hollows he left filling with water. Our own design (the second, the
// author's direction A of 2026-11-18): a dark giant built of Fuji's own black scoria, his body laid up in the
// mountain's strata of old lava, rusty with iron here and there; a small head sunk between huge hunched shoulders of
// lava blocks, shaped as a little volcanic cone with a crater on top glowing dull red and breathing steam, no face but
// two pale eyes; hands of basalt columns, six-sided, their ends flat; lake water and mud running off him in streams.
// He stands waist-deep in the lake in front of the mountain, facing us (the panorama is seen from the side). His
// tools: a carrying pole and a great woven basket for earth (mokko) on ropes. Beaten, his cracks show the heat inside.
//
// Size: 360 x 300 fine pixels (120 x 100 in the game), his waist at the frame's foot.
//   node tools/art/kawaguchiko/daidara.mjs -> tools/preview/stage10_daidara.png: three poses over the view
import { HiSprite, tones, speckle, mottle, mix2, fur } from '../../lib/hisprite.mjs';
import { Raster } from '../../lib/raster.mjs';

export const DW = 360;
export const DH = 300;
const CX = DW / 2;
const RAMPS = {
  k: tones([0x141018, 0x2c2630, 0x544650]), // black scoria, a little violet
  B: tones([0x16181e, 0x30343e, 0x5a606e]), // basalt, his hands and the rocks
  w: tones([0x4a6a86, 0x9abcd6, 0xeaf6ff]), // lake water
  m: tones([0x22180e, 0x46382a, 0x6e5a42]), // mud
  o: tones([0x9aaaa6, 0xdcece4, 0xffffff]), // his pale eyes
  v: tones([0x8a8890, 0xc8c6cc, 0xf4f2f4]), // steam
  L: [0x8a1a08, 0xd84a14, 0xff8a2a, 0xffd070, 0xfff4c0], // the heat inside him
  s: tones([0x6a5228, 0xb8944a, 0xe8cc88]), // straw of the basket
  p: tones([0x3a2414, 0x6a4628, 0xa0744a]), // the pole
  g: tones([0x2e3a1e, 0x52602e, 0x82904a]), // moss (on the islet he becomes)
  r: tones([0x5a1410, 0xb8301e, 0xf06a3a]), // its maple
};
let seed = 1;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const scoria = (k) => ({ pat: mix2(mottle({ amt: 0.2, scale: 6, seed: k }), speckle({ amt: 0.3, dark: 0.16, light: 0.06, seed: k + 1 })) });

// ---------------------------------------------------------------------------------------------- his shape
const crag = (x) => Math.max(0, Math.sin(x * 0.37) * 5 + Math.sin(x * 0.13 + 1) * 4 + Math.sin(x * 0.71 + 2) * 2);
/** The top of his shoulders at x: a ridge of lava blocks, a hollow in the middle where his head sits. */
const top = (x, lean) => {
  const d = Math.abs(x - CX - lean);
  if (d > 134) return Infinity;
  const ridge = 98 + ((d - 80) / 54) ** 2 * 40;
  return (d < 46 ? Math.max(ridge, 132 - d * 0.3) : ridge) - crag(x);
};
const half = (y) => (y < 132 ? 134 : 134 - (y - 132) * 0.15) + Math.sin(y * 0.21) * 2; // (his waist narrower than his shoulders)
/** The light on him: the sun low on the right and behind, the sky's violet from above; the strata of old flows in
 * bands, each lit along its top edge and dark in the gap under it. */
const light = (lean) => (x, y) => {
  const band = (y + Math.sin(x * 0.05) * 6 + Math.sin(x * 0.17) * 2) % 13;
  return 0.2 + 0.3 * Math.max(0, 1 - Math.hypot(x - CX + 50, y - 110) / 200) + (band < 2 ? 0.14 : band > 11 ? -0.1 : 0) + (y < top(x, lean) + 5 ? 0.12 : 0);
};
const EYES = [[-10, 118], [10, 118]]; // (from the head's middle)

/** Streams of water (and of mud) running down him from (x, y), wandering, thinning, a drop or two falling off. */
function streams(s, list) {
  for (const [x0, y0, len, mud] of list) {
    let [x, w] = [x0, mud ? 2.4 : 1.8];
    for (let y = y0; y < y0 + len; y++) {
      x += Math.sin(y * 0.18 + x0) * 0.35;
      w = Math.max(0.7, w - 0.008);
      s.line(x - w / 2, y, x + w / 2, y, mud ? 0x4a3a2a : y % 7 < 2 ? 0xeaf6ff : 0x9abcd6, 1, mud ? 0.85 : 0.75);
    }
    if (!mud) for (let k = 0; k < 2; k++) s.dot(x + (rnd() - 0.5) * 4, y0 + len + 4 + k * 6, 0.9, 0xd8ecff, 0.9);
  }
}

/** His trunk and his hunched shoulders, one mass, then the small cone of his head. Returns the head's x. */
function body(s, { lean = 0, steam = 5 } = {}) {
  seed = 7;
  const lit = light(lean);
  s.paint([CX - 140, 60, CX + 140, DH], (x, y) => y >= top(x, lean) && Math.abs(x - CX - lean) < half(y), 'k', lit, scoria(3));
  // rust: thin streaks of iron red along a few bands
  for (let k = 0; k < 16; k++) {
    const [x, y] = [CX - 110 + rnd() * 220, 130 + rnd() * 150];
    if (y < top(x, lean) + 4) continue;
    s.line(x, y, x + 6 + rnd() * 10, y + rnd() * 2 - 1, 0x6a3022, 1, 0.8);
  }
  // the chest: a seam down it where the strata do not meet, dark (in the fight it glows: his weak point)
  s.paint([CX + lean - 7, 158, CX + lean + 7, 234], (x, y) => Math.abs(x - CX - lean - Math.sin(y * 0.3) * 2) < 1.4 + Math.sin(((y - 158) / 76) * Math.PI) * 1.6, 'K', () => 0.1);
  for (let k = 0; k < 7; k++) s.line(CX + lean - 3, 166 + k * 9, CX + lean - 12 - k, 170 + k * 9, 0x0c0a0e, 1, 0.8);
  // the head: a small cone in the hollow, ragged, its top a crater glowing dull red, steam rising from it
  const hx = CX + lean * 1.2;
  s.paint([hx - 40, 80, hx + 40, 150], (x, y) => {
    const t = (y - 88) / 56;
    return t >= 0 && Math.abs(x - hx) < 15 + t * 22 + Math.sin(y * 0.6 + x * 0.2) * 1.2;
  }, 'k', (x, y) => lit(x, y) + 0.06, scoria(41));
  s.ellipse(hx, 89, 14, 4.2, 'K', { flat: 0.1 });
  for (let k = 0; k < 6; k++) s.dot(hx - 8 + k * 3.2, 89.5 + (k % 2), 1, 0xd84a20, 0.75);
  s.ellipse(hx, 87.5, 15.5, 2.6, 'k', { flat: 0.6 });
  for (let k = 0; k < steam; k++) s.ellipse(hx - 2 + Math.sin(k * 1.3) * 4, 82 - k * 6, 5 - k * 0.5, 3.4 - k * 0.35, 'v', { flat: 0.6 + k * 0.05 });
  return hx;
}
/** The streams running off his head and shoulders. */
const BODY_STREAMS = (hx) => [
  [hx - 16, 104, 30, false], [hx + 13, 110, 22, false], [hx - 2, 132, 22, true],
  [CX - 101, 100, 64, false], [CX - 87, 104, 150, false], [CX - 58, 102, 46, true], [CX - 33, 150, 92, false], [CX + 41, 146, 60, true],
  [CX + 64, 98, 168, false], [CX + 97, 108, 40, false], [CX - 118, 118, 30, true],
];

/** Two pale eyes and nothing else: narrow, set close, a little glow round them. */
function eyes(s, hx, { wide = false } = {}) {
  for (const [dx, y] of EYES) {
    const x = hx + dx;
    s.ellipse(x, y, wide ? 7.5 : 6, wide ? 4.6 : 3.2, 'o', { flat: 0.86, glow: true });
    s.ellipse(x - Math.sign(dx) * 1.5, y - 0.8, 2.2, 1.1, 'W', { flat: 0.98, glow: true });
  }
}

/** A crack across him: dark, the heat inside glowing along it, a lit lip on its upper side. */
function crack(s, pts) {
  for (let i = 0; i + 3 < pts.length; i += 2) {
    s.line(pts[i], pts[i + 1], pts[i + 2], pts[i + 3], 0x0c0a0e, 3);
    s.line(pts[i], pts[i + 1], pts[i + 2], pts[i + 3], 0xd84a14, 1, 0.9);
    s.line(pts[i], pts[i + 1] - 2, pts[i + 2], pts[i + 3] - 2, 0x6a5a66, 1, 0.8);
  }
}
/** Take a bite out of what is painted: a jagged hole round (cx, cy) (a block knocked off his shoulder). */
function bite(s, cx, cy, r) {
  for (let y = Math.floor(cy - r - 3); y <= cy + r + 3; y++)
    for (let x = Math.floor(cx - r - 3); x <= cx + r + 3; x++) {
      if (!s.inside(x, y)) continue;
      const a = Math.atan2(y - cy, x - cx);
      if (Math.hypot(x - cx, y - cy) < r + Math.sin(a * 5) * 2.5) s.mat[y * s.w + x] = null;
    }
}

/** A hand of basalt columns at the wrist (x, y): open (fingers long), cup (curled, water running), clod (round a
 * lump of black mud), grip (a fist, the columns' flat ends down). */
function hand(s, x, y, kind) {
  if (kind === 'grip') {
    s.ellipse(x, y + 12, 24, 20, 'B', { bias: 0.04, ...scoria(61) });
    for (let k = -2; k <= 1; k++) {
      const fx = x + k * 11 + 5;
      s.poly([[fx - 5, y + 24], [fx - 2.5, y + 20], [fx + 2.5, y + 20], [fx + 5, y + 24], [fx + 2.5, y + 28], [fx - 2.5, y + 28]], 'B', { flat: 0.72 });
    }
    return;
  }
  s.ellipse(x, y + 8, 26, 18, 'B', { bias: 0.03, ...scoria(61) });
  const len = kind === 'open' ? 40 : 28;
  for (let k = -2; k <= 1; k++) {
    const [fx, fy] = [x + k * 11 + 5, y + len];
    s.tube(x + k * 10 + 5, y + 14, fx, fy, 5.4, 'B', { rb: 5 });
    s.poly([[fx - 4.5, fy - 1], [fx - 2, fy - 4], [fx + 2, fy - 4], [fx + 4.5, fy - 1], [fx + 2, fy + 2], [fx - 2, fy + 2]], 'B', { flat: 0.78 }); // its flat six-sided end
  }
  s.tube(x + 24, y + 2, x + 33, y + 14, 5.4, 'B', { rb: 5 }); // the thumb
  if (kind === 'clod') {
    s.ellipse(x, y + 10, 21, 12, 'm', { bias: 0.06, pat: mottle({ amt: 0.25, scale: 3, seed: 71 }) });
    streams(s, [[x - 12, y + 18, 26, false], [x + 2, y + 20, 34, true], [x + 14, y + 18, 22, false]]);
  }
  if (kind === 'cup') streams(s, [[x - 16, y + 24, 30, false], [x - 4, y + 28, 36, false], [x + 8, y + 26, 28, false], [x + 18, y + 22, 24, false]]);
}
/** An arm of scoria from the shoulder (x0, y0) to the wrist (x1, y1), and its hand. */
function arm(s, x0, y0, x1, y1, kind = 'open', wear = 0) {
  s.tube(x0, y0, x1, y1, 24, 'k', { rb: 18, bias: -0.16, ...scoria((x0 | 0) + 5) });
  streams(s, [[(x0 + x1) / 2 - 8, y0 + 10, 60, false], [(x0 + x1) / 2 + 10, y0 + 20, 40, true]]);
  if (wear) crack(s, [x1 - 12, y0 + 42, x1 + 4, y0 + 60, x1 - 6, y0 + 76]);
  hand(s, x1, y1, kind);
}

/** The basket for earth (mokko): woven straw heaped with black earth, hung by four ropes; `gold`: the ropes lit. */
function basket(s, x, y, ropeTop, { gold = false } = {}) {
  for (const dx of [-22, -8, 8, 22]) s.line(x + dx, y - 12, ropeTop[0] + dx * 0.15, ropeTop[1], gold ? 0xffd84a : 0xb8944a, gold ? 3 : 2);
  s.poly([[x - 32, y - 12], [x + 32, y - 12], [x + 24, y + 22], [x - 24, y + 22]], 's', { flat: 0.6, pat: speckle({ amt: 0.12 }) });
  for (let i = -30; i <= 30; i += 6) s.line(x + i, y - 12, x + i * 0.8, y + 22, 0x6a5228, 1, 0.8);
  for (let j = -6; j <= 18; j += 6) s.line(x - 30 + j * 0.2, y + j, x + 30 - j * 0.2, y + j, 0x8a6a34, 1, 0.6);
  s.ellipse(x, y - 14, 30, 9, 'k', { bias: 0.06, ...scoria(81) });
}

/** The lake at his waist, foaming round him. */
function foam(s) {
  for (let x = 16; x < DW - 16; x += 2) s.px(x, DH - 4 + Math.sin(x * 0.2) * 1.5, 0xeaf6ff, 0.9);
  for (let k = 0; k < 30; k++) s.dot(30 + rnd() * (DW - 60), DH - 8 - rnd() * 6, 1 + rnd() * 1.2, 0xeaf6ff, 0.8);
}

/** One of the three poses for review: 'dig' (both hands scooping), 'basket' (the pole on his shoulder), 'dusk'. */
export function daidara(pose) {
  const s = new HiSprite(DW, DH, RAMPS);
  if (pose === 'basket') {
    s.tube(CX - 172, 104, CX + 40, 96, 4.5, 'p', { bias: 0.05 });
    basket(s, CX - 150, 190, [CX - 160, 106], { gold: true });
  }
  const hx = body(s, { lean: pose === 'dig' ? -6 : 0 });
  if (pose === 'basket') {
    arm(s, CX - 112, 128, CX - 104, 104, 'grip');
    arm(s, CX + 116, 132, CX + 142, 240);
  } else for (const sx of [-1, 1]) arm(s, CX + sx * 116, 132, CX + sx * 144, 236, 'clod');
  eyes(s, hx);
  streams(s, BODY_STREAMS(hx));
  foam(s);
  const out = s.render({ outline: 3 });
  return pose === 'dusk' ? silhouette(out) : out;
}

/** Against the setting sun: dark violet, a burning rim on the sun's side (the right); his pale eyes and the heat in
 * his cracks keep their light. */
function silhouette(r, rim = true) {
  const o = new Raster(r.w, r.h);
  const a = (x, y) => (x < 0 || y < 0 || x >= r.w || y >= r.h ? 0 : r.data[(y * r.w + x) * 4 + 3]);
  for (let y = 0; y < r.h; y++)
    for (let x = 0; x < r.w; x++) {
      const i = (y * r.w + x) * 4;
      if (!r.data[i + 3]) continue;
      const [R, G, B] = [r.data[i], r.data[i + 1], r.data[i + 2]];
      const eye = R > 200 && G > 210 && B > 200 && y > 108 && y < 128 && Math.abs(x - CX) < 24; // (his pale eyes)
      const heat = R > 180 && G < 150 && B < 90; // (the heat inside)
      let lit = 0;
      if (rim) for (let k = 1; k <= 4; k++) if (!a(x + k, y) || !a(x + k, y - k)) { lit = 1 - (k - 1) / 4; break; }
      const lum = (R + G + B) / 765;
      let c = [22 + lum * 26, 14 + lum * 18, 32 + lum * 26];
      if (eye || heat) c = [R, G, B];
      else if (lit) c = c.map((v, k) => v + ([255, 150, 70][k] - v) * lit * 0.95);
      o.setRGBA(x, y, c[0], c[1], c[2], r.data[i + 3]);
    }
  return o;
}

// ---------------------------------------------------------------------------------------------- the parts for the fight
// He is put together in the game (phase 13) from: his body (trunk, shoulders, head; three stages of wear), what his
// face does over it (blinking, roaring), two arms on pivots at the shoulders (the same arm, flipped for the other
// side) with the hand open, cupped, holding a clod or gripping, the left one broken off at the end; the carrying pole
// and the basket (its ropes are drawn by the game, lit gold when they can be shot); the fissure in his chest glowing
// (his weak point, mint); clods of mud and pieces of basalt column he throws and rolls; the sun going down behind
// him; and the islet he becomes. In the last phase everything comes again as a silhouette against the sun (_dusk).
export const SHOULDER = [[CX - 92, 150], [CX + 92, 150]]; // where the arms hang from, in the body's frame (20 px out)
export const CORE = [CX, 192]; // the fissure's middle
const CRACKS = [
  [],
  [[CX - 40, 150, CX - 70, 186, CX - 58, 214], [CX + 36, 236, CX + 64, 262, CX + 92, 270], [CX + 14, 120, CX + 24, 138]],
  [[CX - 40, 150, CX - 70, 186, CX - 58, 214, CX - 80, 250], [CX + 36, 236, CX + 64, 262, CX + 92, 270], [CX + 14, 120, CX + 24, 138, CX + 12, 146], [CX + 70, 150, CX + 96, 178, CX + 88, 214], [CX - 20, 244, CX - 34, 280], [CX - 104, 130, CX - 92, 160]],
];

/** His body at a stage of wear (0 whole, 1 cracked, 2 broken up), eyes open. */
export function ddBody(wear) {
  const s = new HiSprite(DW, DH, RAMPS);
  const hx = body(s, { steam: [5, 6, 8][wear] });
  if (wear === 2) {
    bite(s, CX - 124, 120, 13); // blocks knocked off his shoulders
    bite(s, CX + 118, 112, 10);
    bite(s, CX + 40, 104, 7);
  }
  for (const c of CRACKS[wear]) crack(s, c);
  streams(s, BODY_STREAMS(hx));
  eyes(s, hx);
  foam(s);
  return s.render({ outline: 3 });
}
/** What his face does over the body: 'blink' (dark lids over the pale eyes), 'roar' (the eyes flaring, a crack under
 * them gaping on the heat inside, the crater spouting steam). */
export function ddFace(kind) {
  const s = new HiSprite(DW, DH, RAMPS);
  const hx = CX;
  if (kind === 'blink')
    for (const [dx, y] of EYES) {
      s.ellipse(hx + dx, y, 7, 4.2, 'k', { bias: 0.08, ...scoria(91) });
      s.line(hx + dx - 6, y + 1, hx + dx + 6, y + 1, 0x0a080c, 2);
    }
  else {
    // the mouth: a jagged crack opening under the eyes, red-hot inside
    s.poly([[hx - 15, 127], [hx - 8, 124], [hx - 2, 127], [hx + 4, 123], [hx + 11, 126], [hx + 15, 129], [hx + 9, 135], [hx + 2, 133], [hx - 5, 136], [hx - 12, 133]], 'K', { flat: 0.1 });
    s.poly([[hx - 10, 128], [hx - 3, 129], [hx + 4, 126], [hx + 10, 129], [hx + 5, 132], [hx - 6, 132]], 'L', { flat: 0.7, glow: true });
    eyes(s, hx, { wide: true });
    for (let k = 0; k < 6; k++) s.ellipse(hx + Math.sin(k * 1.7) * 7, 80 - k * 7, 7 - k * 0.6, 4.5 - k * 0.4, 'v', { flat: 0.55 + k * 0.06 }); // a gust from the crater
  }
  return s.render({ outline: 2 });
}

const AW = 120;
const AH = 170;
/** An arm hanging from its pivot at the top middle (the right side is this one flipped). hand: open | cup | clod | grip. */
export function ddArm(kind, wear = 0) {
  const s = new HiSprite(AW, AH, RAMPS);
  seed = 13;
  arm(s, AW / 2, 18, AW / 2, 112, kind, wear); // (shoulder to wrist: his hands reach his waist, hanging)
  return s.render({ outline: 3 });
}
/** The left arm broken off above the elbow: a stump crumbling, the heat inside showing at the break. */
export function ddStump() {
  const s = new HiSprite(AW, AH, RAMPS);
  s.tube(AW / 2, 18, AW / 2 - 4, 70, 24, 'k', { rb: 20, bias: -0.16, ...scoria(17) });
  bite(s, AW / 2 - 4, 84, 16);
  s.ellipse(AW / 2 - 4, 70, 12, 4, 'L', { flat: 0.6, glow: true });
  for (let k = 0; k < 6; k++) s.ellipse(AW / 2 - 14 + k * 5, 76 + (k % 2) * 5, 3, 2.4, 'B', { bias: 0.1 });
  return s.render({ outline: 3 });
}
/** The carrying pole, its ends worn. */
export function ddPole() {
  const s = new HiSprite(300, 18, RAMPS);
  s.tube(6, 9, 294, 9, 5, 'p', { bias: 0.05, pat: fur(0, { amt: 0.12, len: 16, seed: 3 }) });
  for (const x of [20, 280]) s.line(x, 4, x, 14, 0x2a1a0c, 2);
  return s.render({ outline: 2 });
}
/** The basket for earth, heaped with black earth (or emptied, tipped out), its hanging point at the top middle. */
export function ddBasket(full) {
  const s = new HiSprite(96, 84, RAMPS);
  const [x, y] = [48, 40];
  s.poly([[x - 40, y - 14], [x + 40, y - 14], [x + 30, y + 30], [x - 30, y + 30]], 's', { flat: 0.6, pat: speckle({ amt: 0.12 }) });
  for (let i = -38; i <= 38; i += 6) s.line(x + i, y - 14, x + i * 0.78, y + 30, 0x6a5228, 1, 0.8);
  for (let j = -8; j <= 24; j += 7) s.line(x - 38 + j * 0.25, y + j, x + 38 - j * 0.25, y + j, 0x8a6a34, 1, 0.6);
  for (const sx of [-1, 1]) s.ellipse(x + sx * 40, y - 14, 3, 3, 'p', { bias: 0.1 }); // the rings the ropes go through
  if (full) {
    s.ellipse(x, y - 18, 38, 12, 'k', { bias: 0.06, ...scoria(83) });
    for (let k = 0; k < 5; k++) s.poly([[x - 28 + k * 13, y - 22], [x - 24 + k * 13, y - 28], [x - 19 + k * 13, y - 22]], 'B', { flat: 0.6 }); // pieces of column in it
  } else s.ellipse(x, y - 12, 34, 6, 'K', { flat: 0.25 });
  return s.render({ outline: 2 });
}
/** The fissure in his chest glowing: his weak point (mint), two frames of its pulse. */
export function ddCore(f) {
  const s = new HiSprite(DW, DH, { ...RAMPS, n: [0x2a8a6a, 0x5ad8a8, 0x9af0cc, 0xd8fff0, 0xffffff] });
  const [cx, cy] = CORE;
  s.paint([cx - 12, cy - 36, cx + 12, cy + 36], (x, y) => Math.abs(x - cx - Math.sin(y * 0.3) * 2) < (3 + f * 1.4) * Math.sin(((y - cy + 34) / 68) * Math.PI) + 1, 'n', (x) => 0.9 - Math.abs(x - cx) * 0.04, { glow: true });
  return s.render({ outline: 0 });
}
/** A clod of black mud he flings (two frames turning), water running off it. */
export function ddClod(f) {
  const s = new HiSprite(42, 36, RAMPS);
  s.ellipse(21, 18, 15 - f, 12 + f, 'm', { bias: 0.05, pat: mottle({ amt: 0.25, scale: 3, seed: 131 + f }) });
  for (let k = 0; k < 4; k++) s.ellipse(12 + k * 6, 12 + ((k + f) % 2) * 4, 2.4, 1.6, 'k', { flat: 0.5 }); // scoria in it
  for (let k = 0; k < 3; k++) s.line(14 + k * 7, 22, 14 + k * 7 + f, 30, 0x9abcd6, 1, 0.8);
  return s.render({ outline: 2 });
}
/** A piece of basalt column he rolls: six-sided, its end face lit; two frames (turned a twelfth). */
export function ddRock(f) {
  const s = new HiSprite(33, 33, RAMPS);
  const hex = (r, a0) => Array.from({ length: 6 }, (_, k) => [16.5 + Math.cos(a0 + (k * Math.PI) / 3) * r, 16.5 + Math.sin(a0 + (k * Math.PI) / 3) * r]);
  const a0 = f ? Math.PI / 6 : 0;
  s.poly(hex(13, a0), 'B', { flat: 0.35, ...scoria(141) }); // its sides
  s.poly(hex(9, a0).map(([x, y]) => [x - 2, y - 2]), 'B', { flat: 0.72 }); // the end face
  s.line(10, 14, 20, 20, 0x0c0e12, 1, 0.7);
  return s.render({ outline: 2 });
}
/** The sun going down behind him: a disc of light (glowing, no outline). */
export function ddSun() {
  const s = new HiSprite(96, 96, { ...RAMPS, u: [0xf06a1a, 0xffa040, 0xffd080, 0xfff0c0, 0xffffff] });
  s.ellipse(48, 48, 40, 40, 'u', { glow: true, bias: 0.15 });
  return s.render({ outline: 0 });
}
/** What he becomes: a little islet of black rock, moss coming on it, a single red maple. */
export function ddIslet() {
  const s = new HiSprite(180, 75, RAMPS);
  seed = 171;
  s.ellipse(90, 52, 80, 20, 'k', { bias: 0.04, ...scoria(171) });
  for (let k = 0; k < 9; k++) s.poly([[30 + k * 15, 50], [34 + k * 15, 40 - (k % 3) * 3], [39 + k * 15, 50]], 'B', { flat: 0.55 }); // columns sticking up
  s.ellipse(90, 44, 56, 11, 'g', { bias: 0.06, pat: mottle({ amt: 0.2, scale: 3 }) });
  s.line(96, 26, 96, 40, 0x3a2414, 2);
  for (const [dx, dy, k] of [[0, -6, 1], [-8, 0, 0.75], [8, 0, 0.75], [0, 3, 0.8]]) s.ellipse(96 + dx * 1.2, 28 + dy * 1.2, 9 * k, 7.6 * k, 'r', { bias: 0.06, pat: mottle({ amt: 0.25, scale: 2, seed: 96 }) });
  for (let x = 12; x < 168; x += 2) s.px(x, 70 + Math.sin(x * 0.2) * 1.5, 0xd8ecff, 0.8);
  return s.render({ outline: 2 });
}

/** His portrait for the album and the ending's parade: the body from the waist up, both arms hanging (as in the fight). */
export function ddPortrait() {
  const [ox, oy, w, h] = [30, 76, 300, 224];
  const out = new Raster(w, h);
  const put = (r, x0, y0, flip = false) => {
    for (let y = 0; y < r.h; y++)
      for (let x = 0; x < r.w; x++) {
        const i = (y * r.w + (flip ? r.w - 1 - x : x)) * 4;
        const [X, Y] = [x0 + x - ox, y0 + y - oy];
        if (r.data[i + 3] && X >= 0 && Y >= 0 && X < w && Y < h) out.setRGBA(X, Y, r.data[i], r.data[i + 1], r.data[i + 2], r.data[i + 3]);
      }
  };
  put(ddBody(0), 0, 0);
  const a = ddArm('open', 0);
  put(a, SHOULDER[0][0] - 20 - AW / 2, SHOULDER[0][1] - 18);
  put(a, SHOULDER[1][0] + 20 - AW / 2, SHOULDER[1][1] - 18, true);
  return out;
}

/** Every frame of the giant, for the city's atlas (enemies.mjs): name -> raster, `trim` for the parts that share
 * the body's frame (so they line up with it in the game). */
export function daidaraFrames(add) {
  const dusk = (r) => silhouette(r);
  for (const w of [0, 1, 2]) add(`dd_body_${w}`, ddBody(w), { trim: true });
  add('dd_body_dusk', dusk(ddBody(2)), { trim: true });
  for (const k of ['blink', 'roar']) {
    add(`dd_face_${k}`, ddFace(k), { trim: true });
    add(`dd_face_${k}_dusk`, silhouette(ddFace(k), false), { trim: true });
  }
  for (const h of ['open', 'cup', 'clod', 'grip']) {
    for (const w of [0, 1]) add(`dd_arm_${h}_${w}`, ddArm(h, w));
    add(`dd_arm_${h}_dusk`, dusk(ddArm(h, 1)));
  }
  add('dd_stump', ddStump());
  add('dd_stump_dusk', dusk(ddStump()));
  add('dd_pole', ddPole());
  add('dd_pole_dusk', dusk(ddPole()));
  for (const full of [true, false]) add(`dd_basket_${full ? 'full' : 'empty'}`, ddBasket(full));
  for (const f of [0, 1]) add(`dd_core_${f}`, ddCore(f), { trim: true });
  for (const f of [0, 1]) add(`dd_clod_${f}`, ddClod(f));
  for (const f of [0, 1]) add(`dd_rock_${f}`, ddRock(f));
  add('dd_sun', ddSun());
  add('dd_islet', ddIslet());
  add('dd_portrait', ddPortrait());
}

// ---- the preview: the three poses over the view as it is in the fight (FujiView: the layers settled)
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('kawaguchiko/daidara.mjs')) {
  const { writeFileSync } = await import('node:fs');
  const { buildPanorama } = await import('./view.mjs');
  const layers = buildPanorama();
  const sheet = new Raster(540 * 3 + 20, 1260);
  ['dig', 'basket', 'dusk'].forEach((pose, n) => {
    const out = new Raster(540, 1260);
    const blit = (img, ox, oy) => {
      for (let y = 0; y < img.h; y++)
        for (let x = 0; x < img.w; x++) {
          const [X, Y] = [x + ox, y + oy];
          if (X < 0 || Y < 0 || X >= out.w || Y >= out.h) continue;
          const i = (y * img.w + x) * 4;
          const al = img.data[i + 3] / 255;
          if (!al) continue;
          const j = (Y * out.w + X) * 4;
          for (let k = 0; k < 3; k++) out.data[j + k] = out.data[j + k] * (1 - al) + img.data[i + k] * al;
          out.data[j + 3] = 255;
        }
    };
    for (const l of pose === 'dusk' ? ['sky', 'fuji', 'hills', 'water'] : ['sky', 'fujiSun', 'hills', 'waterSun']) blit(layers[l], -54, 0);
    blit(daidara(pose), 270 - DW / 2, 257 * 3 - DH);
    for (let y = 0; y < 1260; y++) for (let x = 0; x < 540; x++) {
      const i = (y * 540 + x) * 4;
      sheet.setRGBA(x + n * 550, y, out.data[i], out.data[i + 1], out.data[i + 2], 255);
    }
  });
  writeFileSync('tools/preview/stage10_daidara.png', sheet.toPNG());
  console.log('tools/preview/stage10_daidara.png');
}
