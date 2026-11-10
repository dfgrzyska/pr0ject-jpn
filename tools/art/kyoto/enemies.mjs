// Kyoto's enemies at 540 px (docs/enemies-540-plan.md): the same silhouettes as the old sprites, three times
// as fine, each frame exactly three times the old one's size so the game's pivots stay put.
// Old mask coordinates (m) map to fine ones as (m + 1) * 3: the old 1 px outline border becomes 3 fine px.
import { HiSprite, S, tones, fur, speckle, crackle, mottle, mix2 } from '../../lib/hisprite.mjs';
import { mix } from '../../lib/raster.mjs';
import { spine, tailBox } from './kyubi.mjs';

const RAMPS = {
  t: tones([0x9a7a54, 0xd2b48a, 0xf2dcb8]), // tanuki belly and muzzle
  H: tones([0x8a6a30, 0xd8b060, 0xf4dc98]), // straw
  g: tones([0x5a3a20, 0x8a5a30, 0xc08850]), // tanuki glaze, brown
  G2: tones([0x5a3a20, 0x8a5a30, 0xc08850]), // the same glaze on the arms (a seam shows where they cross)
  e: tones([0xa04a1e, 0xe0702a, 0xffa860]), // fox fur, orange
  f: tones([0x7a1810, 0xc8301c, 0xf06a40]), // fox fur, vermilion
  w: tones([0xb8b0a8, 0xf2ece4, 0xffffff]), // fox white
  m: [0x8a0010, 0xd01020, 0xff3a3a, 0xff9a80, 0xfff0d0], // glowing red
  y: [0x8a5a00, 0xd09000, 0xffd040, 0xfff0a0, 0xffffff], // glowing gold
};
const M = (v) => (v + 1) * S; // old mask coordinate -> fine
const INK = 0x14101c;

// ---------------------------------------------------------------- popcorn: kitsune-mask drone (13 x 12 -> 39 x 36)
export function popcorn(f) {
  const s = new HiSprite(39, 36, RAMPS);
  const cx = 19.5;
  // rotor arms out to both sides and the rotors themselves (a blur that turns with the frame)
  for (const sx of [-1, 1]) {
    s.tube(cx + sx * 6, 16.5, cx + sx * 16.5, 15, 1.4, 'S');
    const rx = cx + sx * 16.5;
    s.ellipse(rx, 15, 2.2, 2.2, 'D');
    const a = (f * Math.PI) / 4 + (sx > 0 ? 0.6 : 0);
    s.line(rx - Math.cos(a) * 3.4, 15 - Math.sin(a) * 1.4, rx + Math.cos(a) * 3.4, 15 + Math.sin(a) * 1.4, 0xb4b8d4, 1, 0.8);
  }
  // ears, a vermilion inside
  for (const sx of [-1, 1]) {
    const P = (dx, y) => [cx + sx * dx, y];
    s.poly([P(-12, 3), P(-4.5, 10.5), P(-11.5, 15)], 'F', { ball: [cx, 17, 13, 14], pat: crackle({ amt: 0.28, scale: 8, width: 0.04 }) });
    s.poly([P(-10.8, 6), P(-6.5, 10.8), P(-10.5, 13.2)], 'R', { flat: 0.45 });
  }
  // the mask: a broad forehead narrowing to the snout, chin at the bottom
  s.poly([[cx - 12, 11], [cx - 6, 8.5], [cx + 6, 8.5], [cx + 12, 11], [cx + 12.5, 19], [cx + 7, 25], [cx + 3.5, 31], [cx - 3.5, 31], [cx - 7, 25], [cx - 12.5, 19]], 'F', { ball: [cx, 17, 13, 13], pat: mix2(crackle({ amt: 0.28, scale: 8, width: 0.04 }), speckle({ amt: 0.18, dark: 0.06, light: 0.04 })) });
  // red kumadori: swept strokes from the eyes up to the ears, dots on the brow, the cheeks
  for (const sx of [-1, 1]) {
    s.line(cx + sx * 4, 17, cx + sx * 9.5, 12.5, 0xd2361f, 2);
    s.line(cx + sx * 9.5, 12.5, cx + sx * 11, 10.5, 0xd2361f, 1);
    s.dot(cx + sx * 2.5, 11.5, 1.1, 0xd2361f);
    s.line(cx + sx * 6.5, 22, cx + sx * 9, 20.5, 0xd2361f, 1);
    // narrow glowing eyes with a dark lid above
    s.line(cx + sx * 3, 16, cx + sx * 8, 14.5, INK, 1);
    s.ellipse(cx + sx * 5.5, 16.6, 2.6, 1.2, 'm', { flat: 0.7, glow: true });
    s.px(cx + sx * 4.2 - 0.5, 16, 0xfff0d0);
  }
  // snout line and the black nose at the tip, a gold bell on a cord under the chin
  s.line(cx, 21, cx, 28, 0xd8ccbc, 1);
  s.ellipse(cx, 30, 2.4, 1.6, 'K');
  s.line(cx - 4, 32.5, cx + 4, 32.5, 0xd2361f, 1);
  s.ellipse(cx, 34, 1.6, 1.4, 'Y');
  // the porcelain's glaze shine
  for (const [x, y] of [[cx - 7, 12], [cx - 6, 12], [cx - 8, 13]]) s.px(x, y, 0xffffff);
  return s.render();
}

// ---------------------------------------------------------------- tanuki (55 x 60 -> 165 x 180)
function tanukiBody(s, pose, leaf, breath = null) {
  const CX = M(26.5) - S / 2 + 0.5; // centre of the old mask, in fine pixels
  const E = (x, y, rx, ry, mat, o) => s.ellipse(M(x) - S / 2, M(y) - S / 2, rx * S, ry * S, mat, o);
  const big = breath ?? (pose === 'idle1' || pose === 'drum1' ? 0.6 : 0);
  const glaze = { pat: mix2(speckle({ amt: 0.4, dark: 0.16, light: 0.07, seed: 11 }), mottle({ amt: 0.2, scale: 10, seed: 12 }), crackle({ amt: 0.3, scale: 14, width: 0.03 })) };
  // tail, feet, the round glazed body and the belly
  E(43, 47, 6, 4, 'g', glaze);
  E(18.5, 54, 5.5, 3.5, 'g', glaze);
  E(34.5, 54, 5.5, 3.5, 'g', glaze);
  E(26.5, 38, 17, 15.5, 'g', glaze);
  E(26.5, 40, 12 + big, 11.5 + big, 't', { pat: mix2(speckle({ amt: 0.32, dark: 0.13, light: 0.06, seed: 4 }), mottle({ amt: 0.16, scale: 12, seed: 6 })) });
  // glaze pooled darker round the foot of the figurine
  s.shade([0, M(48), s.w, s.h], (x, y) => y > M(49), -0.12);
  // the straw hat: brim behind the head, woven
  const hat = (x, y, rx, ry) => E(x, y, rx, ry, 'H', { pat: fur((px, py) => Math.atan2(py - M(9), px - CX) + Math.PI / 2, { amt: 0.4, len: 5, w: 2, gap: 0.2, seed: 7 }) });
  hat(26.5, 9, 18, 6.5);
  // head
  E(26.5, 18, 11, 9.5, 'g', glaze);
  hat(26.5, 6, 7, 4);
  // weave of the hat: rings and spokes in a darker straw
  for (let k = 1; k <= 4; k++) {
    const rx = (18 * S * k) / 4.6;
    const ry = (6.5 * S * k) / 4.6;
    for (let a = 0; a < Math.PI * 2; a += 0.02) {
      const x = CX + Math.cos(a) * rx;
      const y = M(9) - S / 2 + Math.sin(a) * ry;
      if (y < M(12) || Math.abs(x - CX) > 33) s.px(x, y, 0x9a7034, 0.8);
    }
  }
  s.shade([0, 0, s.w, s.h], (x, y) => ((x - CX) / (13 * S)) ** 2 + ((y - M(9) + 1) / (4.6 * S)) ** 2 > 0.8 && ((x - CX) / (13 * S)) ** 2 + ((y - M(9) + 1) / (4.6 * S)) ** 2 < 1, -0.25);
  // the raccoon-dog mask round the eyes, white eyes looking down at the player, the muzzle and a smug smile
  E(21, 18.5, 5, 4, 'K', glaze);
  E(32, 18.5, 5, 4, 'K', glaze);
  for (const ex of [21.5, 31.5]) {
    s.ellipse(M(ex) - S / 2, M(17) - S / 2, 2.1 * S, 2 * S, 'W');
    s.dot(M(ex) - S / 2 + (ex < 26 ? 1 : -1), M(17.6) - S / 2, 2.2, INK);
    s.px(M(ex) - S / 2 - 1.5, M(16.4) - S / 2, 0xffffff);
  }
  E(26.5, 22.5, 5, 3.6, 't');
  s.ellipse(CX, M(20.6) - S / 2, 4.4, 3, 'K');
  s.px(CX - 1.5, M(20) - S / 2 - 1, 0xffffff);
  s.line(M(23) - 1, M(24) + 1, CX, M(25) + 1, INK, 2);
  s.line(CX, M(25) + 1, M(29) + 1, M(24) + 1, INK, 2);
  if (pose === 'idle0' || pose === 'idle1') {
    // the sake flask (tokkuri) with its blue label and a kanji brushed on it
    s.tube(M(12), M(30), M(8), M(37), 3.2 * S, 'G2', glaze);
    s.tube(M(6.5), M(31.5), M(6.5), M(36), 1.6 * S, 'W');
    s.ellipse(M(6.5), M(41), 4 * S, 5.5 * S, 'W', { pat: mix2(speckle({ amt: 0.2, dark: 0.08 }), crackle({ amt: 0.2, scale: 7 })) });
    s.paint([M(2), M(39.5), M(11), M(42.2)], (x, y) => y > M(39.6) && y < M(42) && ((x - M(6.5)) / (4 * S)) ** 2 + ((y - M(41)) / (5.5 * S)) ** 2 <= 1, 'B', (x) => 0.75 - (x - M(2)) / 60);
    s.line(M(6.5) - 2, M(43), M(6.5) + 2, M(43), INK, 1);
    s.line(M(6.5), M(42.5), M(6.5), M(46), INK, 1);
    // the shop's ledger (tsūchō), its cord and columns of writing
    s.tube(M(41), M(30), M(45), M(37), 3.2 * S, 'G2', glaze);
    s.poly([[M(42), M(36)], [M(50), M(36)], [M(50), M(46)], [M(42), M(46)]], 'F', { flat: 0.6, pat: fur(Math.PI / 2, { amt: 0.14, len: 3, w: 1, gap: 0.03 }) });
    s.poly([[M(42), M(36)], [M(43), M(36)], [M(43), M(46)], [M(42), M(46)]], 'N', { flat: 0.5 });
    for (const x of [45, 47.5]) for (let y = M(38); y < M(45); y += 2.5) s.line(M(x), y, M(x) + 3, y, 0x3a3048, 1);
  } else {
    const down = pose === 'drum1';
    for (const sx of [-1, 1]) s.tube(CX + sx * 14.5 * S, M(30), CX + sx * (down ? 9.5 : 17.5) * S, M(down ? 39 : 23), 3.2 * S, 'G2', glaze);
  }
  // the glaze shine
  for (const [x, y, r] of [[17.5, 30.5, 1.2], [21, 34, 0.8]]) s.dot(M(x), M(y), r, 0xfff6e8, 0.45);
  if (leaf) {
    // the leaf on the hat (the copies keep it: the player's tell)
    s.ellipse(CX, M(3) - 1, 6.5 * S, 3 * S, 'G', { pat: mottle({ amt: 0.18, scale: 4 }) });
    s.line(CX - 5.5 * S, M(3) - 1, CX + 5.5 * S, M(3) - 1, 0x1d6a3a, 1);
    for (let k = -4; k <= 4; k += 2) s.line(CX + k * S, M(3) - 1, CX + (k + 1.5) * S, M(3) - 1 - (k % 4 ? 4 : -4), 0x1d6a3a, 1);
    s.tube(CX + 6.5 * S, M(3), CX + 8 * S, M(5), 1, 'N');
  }
}

export function tanuki(pose, leaf = false, breath = null) {
  const s = new HiSprite(165, 180, RAMPS);
  tanukiBody(s, pose, leaf, breath);
  return s.render();
}

// ---------------------------------------------------------------- Kyūbi: the body (29 x 49 -> 87 x 147)
export function kyubiBody(pose) {
  const s = new HiSprite(87, 147, RAMPS);
  const C = 13; // old centre column
  const cx = M(C) + S / 2; // fine centre
  const Y = (y) => M(y);
  const furTex = { pat: fur((x, y) => Math.atan2(y - Y(29), x - cx), { amt: 0.44, len: 6, w: 1.5, seed: 21 }) };
  // body and the white chest ruff, front paws with toes
  s.ellipse(cx, Y(34) + 1, 8.6 * S, 8.6 * S, 'f', furTex);
  s.ellipse(cx, Y(37.5) + 1, 5.2 * S, 6.2 * S, 'w', furTex);
  for (let k = -2; k <= 2; k++) s.poly([[cx + (k - 0.7) * 2.2 * S, Y(41)], [cx + (k + 0.7) * 2.2 * S, Y(41)], [cx + k * 2.2 * S, Y(43.2) - Math.abs(k)]], 'w', { flat: 0.5 });
  for (const sx of [-1, 1]) {
    s.ellipse(cx + sx * 4.5 * S, Y(43) + 1, 2.6 * S, 2.6 * S, 'w', furTex);
    for (const k of [-1, 0, 1]) s.line(cx + sx * 4.5 * S + k * 2.2, Y(44) + 2, cx + sx * 4.5 * S + k * 2.2, Y(45) + 1, 0x8a8078, 1);
  }
  // fur strands combed down the flanks
  for (let k = 0; k < 18; k++) {
    const sx = k % 2 ? 1 : -1;
    const a = 2 + (k >> 1) * 0.5;
    const x = cx + sx * Math.cos(a - 1.6) * 7.4 * S;
    const y = Y(34) + Math.sin(a - 1.6) * 7.4 * S;
    s.line(x, y, x + sx * 2, y + 4, 0x7a1810, 1);
  }
  // the shimenawa: a twisted straw rope round the neck, white paper shide hanging off it
  for (let x = cx - 8.2 * S; x <= cx + 8.2 * S; x += 1) {
    const ny = Y(32) + 1 + Math.cos(((x - cx) / (8.5 * S)) * 1.4) * 1.5;
    s.paint([x, ny - 3, x, ny + 3], (px, py) => Math.abs(py - ny) < 3, 'H', () => 0.45 + 0.4 * Math.sin((x + ny) * 0.9));
  }
  for (const dx of [-5, 5]) {
    const x = cx + dx * S;
    s.poly([[x - 2, Y(34)], [x + 2, Y(34)], [x + 3, Y(36.5)], [x - 1, Y(36.5)], [x, Y(38.5)], [x - 3, Y(38.5)]], 'W', { flat: 0.75 });
  }
  // the hōju jewel on the chest under its gold cap
  s.ellipse(cx, Y(38.5), 2.4 * S, 2.4 * S, 'm', { glow: true });
  s.dot(cx - 2, Y(37.5), 1.3, 0xffffff);
  s.poly([[cx - 4, Y(35.6)], [cx + 4, Y(35.6)], [cx + 2.5, Y(36.6)], [cx - 2.5, Y(36.6)]], 'Y', { flat: 0.7 });
  s.line(cx, Y(36.6) - 1, cx, Y(34) - 2, 0xfff0a0, 1);
  // tall ears: vermilion outside, pale fluff inside, black tips
  for (const sx of [-1, 1]) {
    const P = (dx, y) => [cx + sx * dx * S, Y(y)];
    s.poly([P(-11.5, 1.6), P(-10.5, 18), P(-2.5, 14.8)], 'f', { ball: [cx, Y(16), 12 * S, 12 * S], ...furTex });
    s.poly([P(-9.5, 7), P(-9, 17), P(-4.5, 15.5)], 'w', { flat: 0.55, tex: 0.1 });
    s.poly([P(-11.5, 1.6), P(-11, 6), P(-8.6, 5.2)], 'K');
    for (let k = 0; k < 4; k++) s.line(cx + sx * (8.6 - k * 0.6) * S, Y(9 + k * 2), cx + sx * (7.4 - k * 0.6) * S, Y(10 + k * 2), 0xfffaf0, 1);
  }
  // the head: cheeks with tufts, the muzzle, nose
  s.ellipse(cx, Y(22.5), 9.5 * S, 8 * S, 'f', furTex);
  for (const sx of [-1, 1]) {
    s.ellipse(cx + sx * 6 * S, Y(26), 3 * S, 2.2 * S, 'w', furTex);
    // cheek ruff: tufts of fur sticking out sideways and down
    for (let k = 0; k < 3; k++) {
      const y0 = Y(23.2 + k * 1.6);
      s.poly([[cx + sx * 7.6 * S, y0], [cx + sx * (11.2 - k * 0.5) * S, y0 + 2.5 + k], [cx + sx * 7.8 * S, y0 + 5]], k ? 'w' : 'f', { flat: k ? 0.62 : 0.5, tex: 0.1 });
    }
  }
  s.ellipse(cx, Y(27.5), 3.8 * S, 3.2 * S, 'w', furTex);
  s.ellipse(cx, Y(28.3), 1.6 * S, 1.1 * S, 'K');
  s.px(cx - 2, Y(28) - 1, 0x737db0);
  if (pose === 'cast') {
    // a fox cry: the mouth open, fangs, the tongue
    s.ellipse(cx, Y(30.8), 2.6 * S, 1.3 * S, 'K', { flat: 0.1 });
    s.ellipse(cx, Y(31.5), 1.2 * S, 0.7 * S, 'M');
    for (const sx of [-1, 1]) s.poly([[cx + sx * 6, Y(30)], [cx + sx * 4, Y(30)], [cx + sx * 5, Y(30) + 4]], 'W', { flat: 0.8 });
  } else {
    s.line(cx - 6, Y(30) + 1, cx - 2, Y(30) + 2, INK, 1);
    s.line(cx + 2, Y(30) + 2, cx + 6, Y(30) + 1, INK, 1);
  }
  // narrow glowing eyes under slanted brows (closed in a blink, blazing when it casts)
  for (const sx of [-1, 1]) {
    const ex = cx + sx * 5.6 * S;
    const ey = Y(21.6);
    s.line(ex - sx * 8, ey - 4, ex + sx * 6, ey - 1, INK, 2);
    if (pose === 'blink') s.line(ex - sx * 5, ey + 1, ex + sx * 5, ey, INK, 2);
    else {
      const h = pose === 'cast' ? 2.4 : 1.6;
      s.poly([[ex - sx * 6, ey - 1], [ex + sx * 5, ey - h], [ex + sx * 6, ey + h - 1], [ex - sx * 4, ey + 2]], 'y', { flat: pose === 'cast' ? 0.9 : 0.6, glow: true });
      s.line(ex, ey - h + 0.5, ex, ey + h, INK, 1);
      if (pose === 'cast') s.px(ex - sx * 4, ey - 1, 0xffffff);
    }
  }
  // the gold flame mark on the brow
  s.poly([[cx, Y(14) - 2], [cx + 2.5, Y(16.5)], [cx + 1, Y(18)], [cx - 1, Y(18)], [cx - 2.5, Y(16.5)]], 'y', { flat: pose === 'cast' ? 0.95 : 0.55, glow: pose === 'cast' });
  return s.render();
}

// ---------------------------------------------------------------- Kyūbi: a tail (old frame (2hw+3) x (2hh+3), root in the middle)
const TAIL_FRAMES = 6;
export function kyubiTail(i, f) {
  const [hw, hh] = tailBox(i);
  const s = new HiSprite((2 * hw + 3) * S, (2 * hh + 3) * S, RAMPS);
  const ox = s.w / 2;
  const oy = s.h / 2;
  // (six frames over the old three's sway: spine() takes the old frame number)
  const pts = spine(i, (f * 3) / TAIL_FRAMES);
  // vermilion at the root, warming to orange, a white brush at the tip (ragged where the colours meet)
  const tone = (t, k) => (t > 0.84 + 0.03 * Math.sin(k * 2.7) ? 'w' : t > 0.54 + 0.05 * Math.sin(k * 1.9) ? 'e' : 'f');
  pts.forEach((p, k) => {
    const q = pts[Math.min(pts.length - 1, k + 1)];
    const r = pts[Math.max(0, k - 1)];
    const along = Math.atan2(q.y - r.y, q.x - r.x);
    s.ellipse(ox + p.x * S, oy + p.y * S, p.r * S, p.r * S, tone(p.t, k), { pat: fur(along, { amt: 0.46, len: 7, w: 1.6, seed: 31 + i }) });
  });
  // a lit side and a shadowed side along the whole tail (it is one round form, not a string of balls)
  const l = pts.length;
  for (let k = 1; k < l; k++) {
    const p = pts[k];
    const q = pts[k - 1];
    const d = Math.hypot(p.x - q.x, p.y - q.y) || 1;
    const nx = -(p.y - q.y) / d;
    const ny = (p.x - q.x) / d;
    const side = nx * -0.6 + ny * -0.8 > 0 ? 1 : -1; // which normal faces the light
    const cxp = ox + p.x * S;
    const cyp = oy + p.y * S;
    const r = p.r * S;
    s.shade([cxp - r - 1, cyp - r - 1, cxp + r + 1, cyp + r + 1], (x, y) => (x - cxp) ** 2 + (y - cyp) ** 2 <= r * r, (x, y) => (((x - cxp) * nx + (y - cyp) * ny) / r) * side * 0.18);
  }
  // fur strands combed towards the tip, darker in the red, pale in the white
  for (let k = 6; k < 60; k += 2) {
    const p = pts[k];
    const q = pts[k + 1];
    const d = Math.hypot(q.x - p.x, q.y - p.y) || 1;
    const dx = (q.x - p.x) / d;
    const dy = (q.y - p.y) / d;
    for (const side of [-1, 1]) {
      const off = (p.r - 0.4) * S * (0.4 + 0.6 * ((k * 7) % 5) / 5);
      const ex = ox + p.x * S - dy * side * off;
      const ey = oy + p.y * S + dx * side * off;
      const c = p.t > 0.86 ? 0xc8c0b8 : p.t > 0.56 ? 0xa04a1e : 0x7a1810;
      s.line(ex, ey, ex + dx * 5 - dy * side * 1.2, ey + dy * 5 + dx * side * 1.2, c, 1, 0.8);
    }
  }
  // tufts along both edges, combed towards the tip
  for (let k = 4; k < 62; k += 3) {
    const p = pts[k];
    const q = pts[Math.min(pts.length - 1, k + 1)];
    const d = Math.hypot(q.x - p.x, q.y - p.y) || 1;
    const dx = (q.x - p.x) / d;
    const dy = (q.y - p.y) / d;
    for (const side of [-1, 1]) {
      const r = p.r * S;
      const bx = ox + p.x * S - dy * side * (r - 1.5);
      const by = oy + p.y * S + dx * side * (r - 1.5);
      const len = 5 + ((k * 13 + (side > 0 ? 5 : 0)) % 4) + Math.sin(f * 1.05 + k * 0.3) * 1.2;
      const out = 4.5 + ((k * 7) % 3) * 0.8; // how far the tuft sticks out of the tail's edge
      const tx = bx - dy * side * out + dx * len;
      const ty = by + dx * side * out + dy * len;
      s.poly([[bx - dx * 2.5, by - dy * 2.5], [tx, ty], [bx + dx * 2.2 + dy * side * 1.5, by + dy * 2.2 - dx * side * 1.5]], tone(p.t, k), { flat: 0.5 + side * 0.12 - (side > 0 ? 0.1 : 0) });
    }
  }
  // fox-fire flickering on the tip (glows: no outline)
  const tip = pts[pts.length - 1];
  s.ellipse(ox + tip.x * S, oy + tip.y * S - 1, 2.6, 3.4, 'y', { flat: 0.55 + 0.25 * Math.sin(f * 2.1 + i), glow: true });
  return s.render();
}

// ---------------------------------------------------------------- shooter: a gunship hung under a torii lintel (23 x 15 -> 69 x 45)
export function shooter(f) {
  const s = new HiSprite(69, 45, RAMPS);
  const cx = 34.5;
  const sway = Math.sin((f / 4) * Math.PI * 2);
  // engine pods under the ends of the beam, exhaust flickering out of them
  for (const sx of [-1, 1]) {
    const px = cx + sx * 21;
    s.tube(px, 22, px, 33, 4.2, 'D', { rb: 3.6, pat: mix2(speckle({ amt: 0.26, dark: 0.09, light: 0.04, seed: 15 }), fur(0.7, { amt: 0.2, len: 4, w: 1.4, gap: 0.05, seed: 16 })) });
    s.ellipse(px, 22, 4.4, 1.6, 'Y', { flat: 0.6 });
    s.ellipse(px, 34.5, 2.6, 1.6 + (f % 2) * 0.7, 'y', { flat: 0.75, glow: true });
    s.line(px - 1, 27, px - 1, 31, 0x737db0, 1);
  }
  // the hull hanging from the beam: gunmetal plates round a red core that pulses
  s.poly([[cx - 10, 12], [cx + 10, 12], [cx + 12, 24], [cx + 8, 36], [cx - 8, 36], [cx - 12, 24]], 'D', { ball: [cx, 22, 13, 14], pat: mix2(speckle({ amt: 0.26, dark: 0.09, light: 0.04, seed: 15 }), fur(0.7, { amt: 0.2, len: 4, w: 1.4, gap: 0.05, seed: 16 })) });
  s.line(cx - 11, 24, cx + 11, 24, 0x262941, 1);
  for (const x of [-7, 7]) s.line(cx + x, 14, cx + x * 1.1, 34, 0x262941, 1);
  for (const [x, y] of [[-9, 15], [9, 15], [-10, 22], [10, 22], [-8, 31], [8, 31], [-4, 13.5], [4, 13.5]]) {
    s.px(cx + x, y, 0x9ea6d0);
    s.px(cx + x + 1, y + 1, 0x262941);
  }
  s.ellipse(cx, 26, 4.2, 5, 'm', { flat: 0.55 + 0.2 * Math.sin((f / 4) * Math.PI * 2), glow: true });
  s.dot(cx - 1.5, 24, 1.1, 0xfff0d0);
  // the cannon out of the keel, a gold muzzle ring
  s.tube(cx, 34, cx, 41.5, 2.4, 'S');
  s.ellipse(cx, 41.5, 2.8, 1.2, 'Y', { flat: 0.7 });
  // the torii: the black kasagi swept up at the ends, the red shimaki under it, the nuki with its posts
  s.poly([[1, 3], [cx, 6.5], [68, 3], [66.5, 9], [cx, 10.5], [2.5, 9]], 'K', { flat: 0.5, pat: fur(0.06, { amt: 0.24, len: 16, w: 1.2, gap: 0.05 }) });
  s.line(4, 5, cx - 6, 7.5, 0x737db0, 1, 0.8);
  s.poly([[5, 10], [64, 10], [63, 13.5], [6, 13.5]], 'R', { flat: 0.55, pat: fur(0, { amt: 0.3, len: 12, w: 1.3, gap: 0.12, seed: 13 }) });
  for (const sx of [-1, 1]) s.poly([[cx + sx * 23.5, 13], [cx + sx * 19.5, 13], [cx + sx * 19.5, 21], [cx + sx * 23.5, 21]], 'R', { flat: 0.45, pat: fur(Math.PI / 2, { amt: 0.3, len: 9, w: 1.3, seed: 14 }) });
  s.poly([[7, 16], [62, 16], [62, 19], [7, 19]], 'R', { flat: 0.6, pat: fur(0, { amt: 0.3, len: 12, w: 1.3, gap: 0.12, seed: 13 }) });
  // a shimenawa across the hull, paper shide hanging off it, swaying
  for (let x = cx - 12; x <= cx + 12; x++) {
    const y = 20.5 + Math.cos(((x - cx) / 12) * 1.4) * 1.6;
    s.px(x, y, (x | 0) % 3 ? 0xd8b060 : 0x8a6a30);
    s.px(x, y + 1, 0x8a6a30);
  }
  for (const dx of [-8, 0, 8]) {
    const x = cx + dx + sway * 0.8;
    s.poly([[x - 1.5, 22], [x + 1.5, 22], [x + 2.5, 25], [x - 0.5, 25], [x + 0.5, 28], [x - 2.5, 28]], 'W', { flat: 0.8 });
  }
  return s.render();
}

// ---------------------------------------------------------------- diver: chōchin-obake, the paper-lantern yōkai (15 x 19 -> 45 x 57)
export function diver(f) {
  const s = new HiSprite(45, 57, RAMPS);
  const cx = 22.5;
  const swing = Math.sin((f / 4) * Math.PI * 2);
  const flicker = [0.12, 0.2, 0.08, 0.18][f];
  // the long tongue lolling out of the tear, swinging as it flies
  s.tube(cx + 1, 36, cx + 1 + swing * 4, 50, 2.6, 'P', { rb: 2.2 });
  s.ellipse(cx + 1 + swing * 4.5, 51, 2.6, 2.2, 'P');
  s.line(cx + 1 + swing * 1.5, 40, cx + 1 + swing * 4, 49, 0xa8476b, 1);
  // red paper on its bamboo ribs, lit from inside by the candle
  s.ellipse(cx, 27, 19, 15.5, 'R', { bias: flicker, pat: mix2(mottle({ amt: 0.24, scale: 6, seed: 5 + f }), fur(Math.PI / 2, { amt: 0.16, len: 3, w: 1, gap: 0.04, seed: 17 }), speckle({ amt: 0.2, dark: 0.04, light: 0.03 })) });
  for (let k = -3; k <= 3; k++) {
    const y = 27 + k * 4.2;
    const rx = 19 * Math.sqrt(Math.max(0, 1 - (k * 4.2 / 15.5) ** 2));
    s.shade([cx - rx, y - 0.5, cx + rx, y + 0.5], (x, yy) => Math.abs(yy - y) < 0.6, -0.3);
  }
  // the torn mouth: a dark gash, ragged paper teeth
  s.poly([[4, 30], [41, 29], [40, 35], [30, 37], [14, 37], [5, 35]], 'K', { flat: 0.15 });
  for (let x = 6; x < 40; x += 5) {
    s.poly([[x, 29.5], [x + 3.5, 29.5], [x + 1.8, 33.5]], 'W', { flat: 0.75 });
    s.poly([[x + 2, 37], [x + 5, 37], [x + 3.5, 34.5]], 'W', { flat: 0.6 });
  }
  // one big eye, looking about
  s.ellipse(17, 18, 6.5, 5.2, 'W');
  s.dot(17 + swing * 1.5 + 0.5, 19, 2.6, INK);
  s.px(15.5 + swing * 1.5, 17, 0xffffff);
  s.line(10, 12.5, 23, 13.5, 0x8a1a1e, 1);
  // the black lacquer cap and the hanger on top, the bottom ring with its gold band
  s.poly([[cx - 8, 5], [cx + 8, 5], [cx + 10, 10], [cx - 10, 10]], 'K', { flat: 0.5 });
  s.tube(cx - 4, 4, cx + 4, 4, 1.2, 'N');
  s.poly([[cx - 9, 42], [cx + 9, 42], [cx + 7, 46], [cx - 7, 46]], 'K', { flat: 0.4 });
  s.line(cx - 7, 43, cx + 7, 43, 0xe2aa32, 1);
  // brushed characters on the paper's other side, showing through
  s.line(30, 15, 33, 22, 0x8a1a1e, 1, 0.7);
  s.line(33, 16, 30, 23, 0x8a1a1e, 1, 0.7);
  return s.render();
}

// ---------------------------------------------------------------- carrier: a winged hōju jewel (15 x 13 -> 45 x 39)
const JEWEL = { red: 'R', blue: 'B', green: 'G' };
const JEWEL_CORE = { red: 0xffd0b0, blue: 0xd8f0ff, green: 0xe0ffd0 };
export function carrier(color, f) {
  const s = new HiSprite(45, 39, RAMPS);
  const cx = 22.5;
  const flap = [0, 1.5, 2.5, 1.5][f];
  // little steel wings on both sides
  for (const sx of [-1, 1]) s.poly([[cx + sx * 8, 17], [cx + sx * 20, 12 + flap], [cx + sx * 21, 16 + flap], [cx + sx * 9, 23]], 'S', { flat: 0.55 });
  // the gold flame-shaped setting round it
  s.poly([[cx, 1.5], [cx + 7, 10], [cx + 11, 20], [cx + 9, 29], [cx, 33], [cx - 9, 29], [cx - 11, 20], [cx - 7, 10]], 'Y', { ball: [cx, 20, 12, 15], pat: mix2(fur((x, y) => Math.atan2(y - 20, x - cx) + Math.PI / 2, { amt: 0.26, len: 4, w: 1.2, gap: 0.15 }), speckle({ amt: 0.2, dark: 0.06 })) });
  // the jewel: an onion shape with its point up
  s.poly([[cx, 6], [cx + 4, 12], [cx + 8, 20], [cx + 7, 26], [cx, 29.5], [cx - 7, 26], [cx - 8, 20], [cx - 4, 12]], JEWEL[color], { ball: [cx - 1, 20, 9, 11], bias: 0.08 });
  // facets cut into the jewel
  for (const [x0, y0, x1, y1] of [[cx, 6, cx - 3, 20], [cx, 6, cx + 3, 20], [cx - 8, 20, cx, 29.5], [cx + 8, 20, cx, 29.5], [cx - 3, 20, cx + 3, 20]]) s.shade([Math.min(x0, x1) - 1, Math.min(y0, y1) - 1, Math.max(x0, x1) + 1, Math.max(y0, y1) + 1], (x, y) => Math.abs((x1 - x0) * (y0 - y) - (x0 - x) * (y1 - y0)) / Math.hypot(x1 - x0, y1 - y0) < 0.7, -0.22);
  s.shade([cx - 8, 6, cx, 20], (x, y) => x < cx - 1 && y < 20 && y > 8, 0.12);
  // the flame inside it, turning
  for (let k = 0; k < 3; k++) {
    const a = (f / 4) * Math.PI * 2 + (k * Math.PI * 2) / 3;
    s.dot(cx + Math.cos(a) * 3, 21 + Math.sin(a) * 2 - k, 1.3, JEWEL_CORE[color], 0.85);
  }
  s.dot(cx - 3, 15, 1.4, 0xffffff);
  // the stem
  s.tube(cx, 31, cx, 36, 2, 'D');
  return s.render();
}

// ---------------------------------------------------------------- turret: the stone lantern (base 17 -> 51, head 15 -> 45)
export function turretBase(wreck) {
  const s = new HiSprite(51, 51, { ...RAMPS, M2: tones([0x2e4024, 0x48602e, 0x6a8040]) });
  const c = 25.5;
  // the stone platform with cut corners, a groove round the inside, the lantern's footing
  s.poly([[6, 3], [45, 3], [48, 6], [48, 45], [45, 48], [6, 48], [3, 45], [3, 6]], 'E', { flat: 0.55, pat: mix2(speckle({ amt: 0.34, dark: 0.15, light: 0.09, seed: 41 }), mottle({ amt: 0.2, scale: 8, seed: 42 })) });
  s.shade([0, 0, 51, 51], (x, y) => Math.max(Math.abs(x - c), Math.abs(y - c)) > 13 && Math.max(Math.abs(x - c), Math.abs(y - c)) < 15.5, -0.28);
  s.shade([0, 0, 51, 51], (x, y) => Math.max(Math.abs(x - c), Math.abs(y - c)) < 13, 0.1);
  // moss in the corners
  for (const [x, y, r] of [[8, 9, 3.5], [43, 44, 3], [42, 8, 2.2], [9, 42, 2.6]]) s.ellipse(x, y, r, r * 0.8, 'M2', { pat: mix2(speckle({ amt: 0.4, dark: 0.2, light: 0.1, seed: x }), mottle({ amt: 0.2, scale: 3 })) });
  // iron bolts at the corners
  for (const [x, y] of [[7, 7], [44, 7], [7, 44], [44, 44]]) s.ellipse(x, y, 1.6, 1.6, 'K');
  if (wreck) {
    // blown open: a black hole of cracked stone, rubble round it, an ember
    s.poly([[17, 15], [28, 13], [36, 18], [37, 30], [31, 37], [19, 36], [13, 27]], 'K', { flat: 0.2, pat: speckle({ amt: 0.3, dark: 0.1 }) });
    for (const [x0, y0, x1, y1] of [[17, 15, 8, 6], [36, 18, 45, 12], [31, 37, 38, 46], [13, 27, 4, 30]]) s.line(x0, y0, x1, y1, 0x262941, 1);
    for (const [x, y, r] of [[21, 22, 2.6], [30, 27, 2], [25, 31, 1.6], [33, 21, 1.4]]) s.ellipse(x, y, r, r, 'E', { pat: speckle({ amt: 0.3, dark: 0.2 }) });
    s.dot(27, 24, 1.3, 0xf07a20);
    s.dot(19, 30, 1, 0xffc070);
  }
  return s.render();
}

export function turretHead(i) {
  const s = new HiSprite(45, 45, RAMPS);
  const c = 22.5;
  const a = (i / 16) * Math.PI * 2;
  const dx = -Math.sin(a);
  const dy = Math.cos(a);
  // the barrel along its direction, a gold muzzle ring
  s.tube(c + dx * 3, c + dy * 3, c + dx * 19, c + dy * 19, 3.4, 'D', { rb: 2.8 });
  s.ellipse(c + dx * 19, c + dy * 19, 3.2, 3.2, 'Y', { flat: 0.6 });
  s.ellipse(c + dx * 19.5, c + dy * 19.5, 1.6, 1.6, 'K', { flat: 0.1 });
  // the lantern's roof as a dome, a red band, the light glowing in its window
  s.ellipse(c, c, 12, 12, 'K', { pat: fur((x, y) => Math.atan2(y - c, x - c) + Math.PI / 2, { amt: 0.28, len: 5, w: 1.2, gap: 0.1 }) });
  for (let k = 0; k < 8; k++) {
    const b = (k / 8) * Math.PI * 2;
    s.line(c + Math.cos(b) * 5, c + Math.sin(b) * 5, c + Math.cos(b) * 11, c + Math.sin(b) * 11, 0x4c4662, 1);
  }
  s.shade([c - 9, c - 9, c + 9, c + 9], (x, y) => Math.abs(Math.hypot(x - c, y - c) - 8) < 1, 0.0);
  for (let b = 0; b < Math.PI * 2; b += 0.04) s.px(c + Math.cos(b) * 8, c + Math.sin(b) * 8, 0xd2361f);
  s.ellipse(c, c, 4.6, 4.6, 'Y', { flat: 0.55 });
  s.ellipse(c + dx * 0.6, c + dy * 0.6, 2.6, 2.6, 'y', { flat: 0.85, glow: true });
  return s.render();
}

// ---------------------------------------------------------------- Kyūbi's spirit flames (the lost tails' fire circling it)
export function spirit(f) {
  const s = new HiSprite(33, 45, RAMPS);
  const blue = { a: [0x1c4ab0, 0x2a70e0, 0x3fb6e8, 0x9ae0ff, 0xe8fbff] };
  s.ramps.a = blue.a;
  for (let k = 0; k <= 10; k++) {
    const t = k / 10;
    const x = 16.5 + Math.sin(t * 3 + f * 1.6) * (1 - t) * 4.5 * (f % 2 ? -1 : 1);
    s.ellipse(x, 31 - t * 26, 9.5 * (1 - t) ** 0.8 + 1.2, 9.5 * (1 - t) ** 0.8 + 1.2, 'a', { flat: 0.35 + t * 0.2, glow: true });
  }
  s.ellipse(16.5, 31, 6.5, 6.5, 'a', { flat: 0.75, glow: true });
  s.ellipse(16.5, 31.5, 3.4, 3.4, 'a', { flat: 0.98, glow: true });
  return s.render({ outline: 0 });
}

// ---------------------------------------------------------------- the lot, and the portraits for the album and the parade
export const TAIL_COUNT = 6;
export function kyotoEnemies(add) {
  for (let f = 0; f < 4; f++) {
    add(`popcorn_${f}`, popcorn(f));
    add(`shooter_${f}`, shooter(f));
    add(`diver_${f}`, diver(f));
    for (const c of ['red', 'blue', 'green']) add(`carrier_${c}_${f}`, carrier(c, f));
    add(`kyubi_spirit_${f}`, spirit(f));
  }
  add('turret_base', turretBase(false));
  add('turret_wreck', turretBase(true));
  for (let i = 0; i < 16; i++) add(`turret_head_${i}`, turretHead(i));
  const breath = [0, 0.3, 0.6, 0.3];
  for (let f = 0; f < 4; f++) {
    add(`tanuki_${f}`, tanuki('idle0', false, breath[f]));
    add(`tanuki_leaf_${f}`, tanuki('idle0', true, breath[f]));
  }
  add('tanuki_drum_0', tanuki('drum0'));
  add('tanuki_drum_1', tanuki('drum1'));
  for (const pose of ['idle', 'blink', 'cast']) add(`kyubi_${pose}`, kyubiBody(pose));
  for (let i = 0; i <= 4; i++) for (let f = 0; f < TAIL_COUNT; f++) add(`kyubi_tail_${i}_${f}`, kyubiTail(i, f));
}
/** Frames the album and the bosses' parade show (src/data/discoveries.js, src/game/Ending.js). */
export const KYOTO_PORTRAITS = ['popcorn_0', 'diver_0', 'tanuki_0', 'kyubi_idle', ...[0, 1, 2, 3, 4].flatMap((i) => [0, 1, 2].map((f) => `kyubi_tail_${i}_${f}`))];
