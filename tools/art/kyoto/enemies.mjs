// Kyoto's enemies at 540 px (docs/enemies-540-plan.md): the same silhouettes as the old sprites, three times
// as fine, each frame exactly three times the old one's size so the game's pivots stay put.
// Old mask coordinates (m) map to fine ones as (m + 1) * 3: the old 1 px outline border becomes 3 fine px.
import { HiSprite, S, tones, fur, speckle, crackle, mottle, mix2 } from '../../lib/hisprite.mjs';
import { mix, Raster, fbm } from '../../lib/raster.mjs';
import { body as kyubiBody, tail as kyubiTail } from './kyubi540.mjs'; // (the white fox of the Inari shrines)

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
  const big = breath ?? ({ idle1: 0.6, drum1: 0.6, drum2: 1.1, sake1: 0.3, sake2: 0.5 }[pose] ?? 0);
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
  } else if (pose.startsWith('drum')) {
    // hara-tsuzumi: paws up (0), down on the belly (1), bouncing off it (2), raised high for the next beat (3)
    const [hx, hy] = { drum0: [17.5, 23], drum1: [9.5, 39], drum2: [12, 34], drum3: [19, 18] }[pose];
    for (const sx of [-1, 1]) s.tube(CX + sx * 14.5 * S, M(30), CX + sx * hx * S, M(hy), 3.2 * S, 'G2', glaze);
    if (pose === 'drum1') for (const sx of [-1, 1]) s.line(CX + sx * 5 * S, M(41), CX + sx * 7 * S, M(44), 0x5a3a20, 1, 0.7); // the belly giving under the blow
  } else {
    // sake (the second phase): the flask raised (0), drunk from (1, 2: eyes shut on the gulp), lowered, flushed (3)
    const k = Number(pose.slice(4));
    const [hx, hy] = [[10, 26], [17, 22], [17, 21], [9, 35]][k];
    s.tube(M(12), M(30), M(hx), M(hy), 3.2 * S, 'G2', glaze);
    const fx = M(hx) - 4 * S;
    const fy = M(hy) - (k === 3 ? -4 : 3) * S;
    // the neck: tipped to the mouth while drinking, a short stub either way
    const [tx, ty] = k === 1 || k === 2 ? [M(23), M(23.5)] : [fx + 1.5 * S, fy - 5 * S];
    const nl = Math.hypot(tx - fx, ty - fy);
    const nx = fx + ((tx - fx) / nl) * 6.5 * S;
    const ny = fy + ((ty - fy) / nl) * 6.5 * S;
    s.tube(fx, fy, nx, ny, 1.6 * S, 'W');
    s.ellipse(fx, fy, 4 * S, 5.5 * S, 'W', { pat: mix2(speckle({ amt: 0.2, dark: 0.08 }), crackle({ amt: 0.2, scale: 7 })) });
    s.paint([fx - 4.5 * S, fy - 1.5 * S, fx + 4.5 * S, fy + 1.5 * S], (x, y) => ((x - fx) / (4 * S)) ** 2 + ((y - fy) / (5.5 * S)) ** 2 <= 1, 'B', (x) => 0.75 - (x - fx + 4 * S) / 60);
    s.line(fx, fy + 1.5 * S, fx, fy + 4 * S, INK, 1);
    if (k >= 2) {
      // eyes shut tight on the gulp, then the flush of the sake on the cheeks
      for (const ex of [21.5, 31.5]) {
        s.ellipse(M(ex) - S / 2, M(17) - S / 2, 2.4 * S, 2.2 * S, 'K', glaze);
        s.line(M(ex) - S / 2 - 5, M(17) - S / 2 + 1, M(ex) - S / 2, M(17) - S / 2 - 2, 0xfff0d8, 1);
        s.line(M(ex) - S / 2, M(17) - S / 2 - 2, M(ex) - S / 2 + 5, M(17) - S / 2 + 1, 0xfff0d8, 1);
      }
    }
    if (k === 3)
      for (const ex of [19, 34]) // the sake flush on the cheeks
        for (let y = -6; y <= 6; y++) for (let x = -10; x <= 10; x++) if ((x / 10) ** 2 + (y / 6) ** 2 <= 1) s.px(M(ex) + x, M(22) + y, 0xff4a4a, 0.45 * (1 - (x / 10) ** 2 - (y / 6) ** 2) + 0.15);
    // the ledger stays in the other paw
    s.tube(M(41), M(30), M(45), M(37), 3.2 * S, 'G2', glaze);
    s.poly([[M(42), M(36)], [M(50), M(36)], [M(50), M(46)], [M(42), M(46)]], 'F', { flat: 0.6, pat: fur(Math.PI / 2, { amt: 0.14, len: 3, w: 1, gap: 0.03 }) });
    s.poly([[M(42), M(36)], [M(43), M(36)], [M(43), M(46)], [M(42), M(46)]], 'N', { flat: 0.5 });
    for (const x of [45, 47.5]) for (let y = M(38); y < M(45); y += 2.5) s.line(M(x), y, M(x) + 3, y, 0x3a3048, 1);
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

/** A copy turning back into leaves (3 frames): the figure crumbles from its edges into a swirl of leaves. */
export function tanukiPoof(f) {
  const base = tanuki('idle0', true);
  const w = base.w;
  const h = base.h;
  const out = new Raster(w, h);
  const k = [0.3, 0.55, 0.8][f];
  const cx = w / 2;
  const cy = h * 0.55;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const a = base.alpha(x, y);
      if (!a) continue;
      const edge = Math.hypot((x - cx) / (w * 0.5), (y - cy) / (h * 0.55));
      const v = fbm(x, y, { seed: 33, scale: 9, octaves: 2 }) * 0.6 + edge * 0.55;
      if (v < 1.05 - k) out.set(x, y, base.get(x, y), (a / 255) * (1 - k * 0.5)); // what is left, fading
    }
  // leaves flying out from the body, further each frame (a fixed scatter, so the frames follow on)
  let sd = 909;
  const rnd = () => ((sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296);
  const greens = [0x1d6a3a, 0x3a9a48, 0x7ac85a, 0xc8a040];
  for (let i = 0; i < 16; i++) {
    const ang = rnd() * Math.PI * 2;
    const r0 = 10 + rnd() * 30;
    const r = r0 + k * (30 + rnd() * 40);
    const lx = cx + Math.cos(ang) * r;
    const ly = cy + Math.sin(ang) * r * 0.9 - k * 12;
    const rot = ang + f * 1.3 + i;
    const c = greens[i % 4];
    for (let t = -8; t <= 8; t++)
      for (let u = -4; u <= 4; u++) {
        if ((t / 8.5) ** 2 + (u / 3.8) ** 2 > 1 - (t > 0 ? t / 30 : 0)) continue;
        const px = lx + Math.cos(rot) * t - Math.sin(rot) * u;
        const py = ly + Math.sin(rot) * t + Math.cos(rot) * u;
        out.set(Math.round(px), Math.round(py), u === 0 ? 0x123a20 : (t / 8.5) ** 2 + (u / 3.8) ** 2 > 0.7 ? 0x0e2a18 : c, 1 - k * 0.4);
      }
  }
  return out;
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
const JEWEL = { red: 'R', blue: 'B', green: 'G', purple: 'V' };
const JEWEL_CORE = { red: 0xffd0b0, blue: 0xd8f0ff, green: 0xe0ffd0, purple: 0xf0d8ff };
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
    for (const c of ['red', 'blue', 'green', 'purple']) add(`carrier_${c}_${f}`, carrier(c, f));
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
  // step 2a: the in-between drum beats, the sake of the second phase, a copy going back to leaves
  add('tanuki_drum_2', tanuki('drum2'));
  add('tanuki_drum_3', tanuki('drum3'));
  for (let k = 0; k < 4; k++) add(`tanuki_sake_${k}`, tanuki(`sake${k}`));
  for (let f = 0; f < 3; f++) add(`tanuki_poof_${f}`, tanukiPoof(f));
  for (const pose of ['idle', 'blink', 'cast']) add(`kyubi_${pose}`, kyubiBody(pose));
  for (let i = 0; i <= 4; i++) for (let f = 0; f < TAIL_COUNT; f++) add(`kyubi_tail_${i}_${f}`, kyubiTail(i, f));
}
/** Frames the album and the bosses' parade show (src/data/discoveries.js, src/game/Ending.js). */
export const KYOTO_PORTRAITS = ['popcorn_0', 'diver_0', 'tanuki_0', 'kyubi_idle', ...[0, 1, 2, 3, 4].flatMap((i) => [0, 1, 2].map((f) => `kyubi_tail_${i}_${f}`))];
