// Osaka's enemies at 540 px (docs/enemies-540-plan.md): takoyaki in their glaze of sauce, mayonnaise in
// threads, aonori and dancing bonito flakes; the paper fugu lantern of Dōtonbori on its bamboo ribs;
// kushikatsu, three pieces in coarse panko on a skewer; candy twisted in cellophane, the kind Osaka's aunties
// carry; the maneki-neko, porcelain, calico-spotted, with its collar, bell and koban; the bunraku puppet, a
// samurai in stiff winged kamishimo, and the three kuroko in black working it; and the octopus of Osaka Bay
// with a twisted towel tied round its head like a takoyaki seller.
// Every frame is three times the old one's size (old mask coordinate m -> fine (m + 1) * 3).
import { HiSprite, tones, fur, speckle, crackle, mottle, mix2 } from '../../lib/hisprite.mjs';
import { Raster } from '../../lib/raster.mjs';

const INK = 0x14101c;
const TAU = Math.PI * 2;
const M = (m) => (m + 1) * 3;
const RAMPS = {
  T: tones([0x6a3a14, 0xb0702e, 0xe8b060]), // fried batter
  u: tones([0x1c0c06, 0x3e200e, 0x7a4a26]), // takoyaki sauce
  O: tones([0x8a1a10, 0xd0402a, 0xf8805a]), // octopus red
  H: tones([0xb0a8a0, 0xeae6de, 0xffffff]), // porcelain, a puppet's painted face
  X: tones([0x08070c, 0x16141e, 0x2e2a3a]), // the kuroko's black
  Xk: [0x060508, 0x141220, 0x22202e, 0x3a3648, 0x5a5670], // its cotton, with a little sheen
  t: tones([0x8a6a3a, 0xc8a060, 0xecd08a]), // bamboo, skewers
  p: tones([0xc89a6a, 0xf0c89a, 0xfff0d8]), // paper of the lantern
  F: tones([0x9a6a10, 0xe2a830, 0xffe890]), // fugu yellow
  k: tones([0x3a1a0e, 0x6a3418, 0xa05a2e]), // calico brown
  c: [0xa0c8e0, 0xc8e8f8, 0xe8f8ff, 0xf8ffff, 0xffffff], // cellophane
};

// ---------------------------------------------------------------- popcorn: takoyaki (13 -> 39)
export function takoyaki(f) {
  const s = new HiSprite(39, 39, RAMPS);
  const c = 19.5;
  s.ellipse(c, 21, 14.5, 14, 'T', { pat: speckle({ amt: 0.2, dark: 0.08 }) });
  // the sauce glazed over the top, glossy
  s.paint([4, 6, 35, 34], (x, y) => Math.hypot(x - c, y - 19) < 12.5 + Math.sin(Math.atan2(y - 19, x - c) * 6) * 1.2, 'u', (x, y) => 0.4 + 0.5 * Math.max(0, 1 - Math.hypot(x - c + 6, y - 13) / 16), { pat: mottle({ amt: 0.1, scale: 4 }) });
  s.dot(c - 5, 13, 2, 0xffffff, 0.7);
  // mayonnaise in threads, back and forth
  for (let k = 0; k < 4; k++) {
    for (let x = -10; x <= 10; x += 0.3) s.px(c + x, 12 + k * 4.5 + Math.sin(x * 0.6 + k) * 1.4, 0xfff8e0);
  }
  // aonori: green flecks
  for (let k = 0; k < 12; k++) s.px(c - 10 + ((k * 7.3) % 20), 11 + ((k * 5.1) % 17), 0x3a8a2a);
  // the bonito flakes dancing in the heat
  for (const [x, y, a] of f % 2 ? [[-5, 6, 0.6], [4, 4, -0.4], [1, 9, 1.2], [-8, 11, -0.9]] : [[-4, 5, -0.5], [6, 6, 0.5], [-1, 8, 0.2], [8, 10, 1.1]]) {
    const X = c + x;
    const Y = y + (f > 1 ? 1 : 0);
    s.poly([[X - 2.5 * Math.cos(a), Y - 2.5 * Math.sin(a)], [X + 2.5 * Math.cos(a), Y + 2.5 * Math.sin(a)], [X + 2 * Math.cos(a) + Math.sin(a) * 1.5, Y + 2 * Math.sin(a) - Math.cos(a) * 1.5]], 'p', { flat: 0.6 });
    s.px(X, Y, 0xc87a6a, 0.8);
  }
  return s.render();
}

// ---------------------------------------------------------------- shooter: a paper fugu lantern (21 -> 63)
export function fugu(f) {
  const s = new HiSprite(63, 63, RAMPS);
  const cx = 31.5;
  const cy = M(10);
  const fin = f % 2;
  // the side fins, fluttering
  for (const sx of [-1, 1]) s.poly([[cx + sx * 20, cy - 2], [cx + sx * 29, cy - 6 + (fin ? -3 : 3)], [cx + sx * 28, cy + 6 + (fin ? -3 : 3)], [cx + sx * 20, cy + 6]], 'F', { flat: 0.55, pat: fur(sx > 0 ? 0.1 : Math.PI - 0.1, { amt: 0.2, len: 4, w: 1.4 }) });
  // the round paper body on its bamboo ribs, spotted, a white belly, lit from inside
  s.ellipse(cx, cy, 22.5, 21, 'F', { pat: mottle({ amt: 0.1, scale: 8 }) });
  s.ellipse(cx, cy + 5, 18, 13.5, 'p', { flat: 0.82, pat: mottle({ amt: 0.12, scale: 6 }) });
  for (let k = -3; k <= 3; k++) for (let x = -22; x <= 22; x += 0.5) {
    const y = cy + k * 5.5 + Math.cos((x / 22) * Math.PI * 0.5) * 1.4;
    if (((x / 22.5) ** 2 + ((y - cy) / 21) ** 2) < 1) s.px(cx + x, y, 0xb07a1a, 0.55);
  }
  for (const [x, y] of [[-10, -12], [10, -12], [0, -16], [-15, -2], [15, -2], [-6, -6], [6, -6]]) s.dot(cx + x, cy + y, 1.8, 0x5a3a14);
  // the spines along the belly
  for (let k = -3; k <= 3; k++) s.line(cx + k * 5, cy + 18, cx + k * 5.6, cy + 21.5, 0x9a6a10, 1);
  // round eyes, the pouting mouth
  for (const sx of [-1, 1]) {
    s.ellipse(cx + sx * 9, cy - 2, 5, 5, 'H', { flat: 0.8 });
    s.dot(cx + sx * 9, cy - 1.5, 3, INK);
    s.dot(cx + sx * 9 - 1, cy - 3, 1, 0xffffff);
  }
  s.ellipse(cx, cy + 10, 4, 3, 'O', { flat: 0.5 });
  s.ellipse(cx, cy + 10, 2, 1.4, 'K', { flat: 0.1 });
  // the cord it hangs from, the red tassel under it
  s.line(cx, 0, cx, cy - 20, 0x2a2638, 2);
  s.poly([[cx - 4, cy + 21], [cx + 4, cy + 21], [cx + 5, cy + 30], [cx - 5, cy + 30]], 'R', { flat: 0.55, pat: fur(Math.PI / 2, { amt: 0.3, len: 9, w: 1 }) });
  s.ellipse(cx, cy + 22, 3.6, 2.4, 'Y', { flat: 0.7 });
  return s.render();
}

// ---------------------------------------------------------------- diver: kushikatsu (9 x 19 -> 27 x 57), spinning
export function kushi(f) {
  const s = new HiSprite(27, 57, RAMPS);
  const cx = 13.5;
  s.tube(cx, 1, cx, 54, 1.2, 't');
  for (let k = 0; k < 3; k++) {
    const y = M(6 + k * 4) - 1;
    // coarse panko: lumpy edge, a crumb texture
    s.paint([cx - 11, y - 9, cx + 11, y + 9], (x, py) => ((x - cx) / (8.4 + Math.sin(py * 1.7 + k) * 0.6)) ** 2 + ((py - y) / 6.8) ** 2 < 1, 'T', (x, py) => 0.4 + 0.5 * Math.max(0, 1 - Math.hypot(x - cx + 3, py - y + 3) / 10), { pat: mix2(speckle({ amt: 0.35, dark: 0.18, light: 0.16, seed: 3 + k }), mottle({ amt: 0.1, scale: 2 })) });
  }
  // the glint of fat on the crumbs, turning with the spin
  for (const [x, y] of f % 2 ? [[1, 5], [5, 9], [2, 13]] : [[5, 6], [1, 10], [4, 14]]) s.dot(M(x) + 1.5, M(y) + 1.5, 1.2, 0xfff0a0);
  // a dip of sauce on the lowest piece
  s.paint([cx - 9, 40, cx + 9, 50], (x, y) => y > 44 && ((x - cx) / 8.2) ** 2 + ((y - M(14) + 1) / 6.6) ** 2 < 1, 'u', () => 0.55);
  return s.render();
}

// ---------------------------------------------------------------- carrier: candy in cellophane (21 x 13 -> 63 x 39)
export function ame(color, f) {
  const s = new HiSprite(63, 39, RAMPS);
  const cx = 31.5;
  const cy = 19.5;
  // the twisted ends of the wrapper, crinkled, catching the light
  for (const sx of [-1, 1]) {
    const flare = [9, 11, 9, 7][f];
    s.poly([[cx + sx * 13, cy - 3], [cx + sx * 27, cy - flare], [cx + sx * 29, cy - flare + 3], [cx + sx * 28, cy + flare - 3], [cx + sx * 27, cy + flare], [cx + sx * 13, cy + 3]], 'c', { flat: 0.55, glow: true });
    for (let k = -2; k <= 2; k++) s.line(cx + sx * 14, cy + k * 0.6, cx + sx * 27, cy + k * flare * 0.38, 0x8ab0c8, 1, 0.6);
    s.line(cx + sx * 13, cy - 3.5, cx + sx * 13, cy + 3.5, 0x6a90b0, 1);
  }
  // the boiled sweet itself, clear and bright, seen through the cellophane
  s.ellipse(cx, cy, 15, 12.5, { red: 'R', blue: 'B', green: 'G', purple: 'V' }[color], { bias: 0.04, pat: mottle({ amt: 0.1, scale: 5 }) });
  s.shade([cx - 16, cy - 13, cx + 16, cy + 13], (x, y) => Math.hypot((x - cx) / 15, (y - cy) / 12.5) > 0.78, -0.12);
  // a spiral of white in the candy, the cellophane's crinkles over it
  for (let a = 0; a < Math.PI * 3; a += 0.05) s.px(cx + Math.cos(a + f) * (1 + a * 1.1), cy + Math.sin(a + f) * (1 + a * 0.9), 0xffffff, 0.45);
  s.dot(cx - 7, cy - 6, 2.4, 0xffffff, 0.85);
  s.line(cx - 4, cy - 9, cx + 6, cy - 8, 0xffffff, 1, 0.5);
  return s.render();
}

// ---------------------------------------------------------------- turret: maneki-neko (base 19 x 21 -> 57 x 63, paw 9 x 11 -> 27 x 33)
export function nekoBase(wreck) {
  const s = new HiSprite(57, wreck ? 57 : 63, RAMPS);
  const glaze = { pat: mix2(speckle({ amt: 0.08, dark: 0.03, light: 0.04 }), mottle({ amt: 0.05, scale: 8 })) };
  if (wreck) {
    // broken porcelain: shards, the bell, a scrap of the red collar, the coin
    for (const [x, y, r] of [[M(5), M(7), 10], [M(11), M(6), 8], [M(8), M(12), 11], [M(13), M(12), 6]]) s.poly([[x - r, y], [x - r * 0.3, y - r * 0.9], [x + r * 0.9, y - r * 0.4], [x + r * 0.6, y + r * 0.7], [x - r * 0.5, y + r * 0.8]], 'H', { ball: [x, y, r, r], ...glaze });
    s.poly([[9, 31], [22, 30], [22, 34], [9, 35]], 'R', { flat: 0.5 });
    s.ellipse(M(8) + 1.5, M(12) + 1.5, 3, 3, 'Y', { flat: 0.7 });
    s.ellipse(44, 46, 6, 4.5, 'Y', { flat: 0.6 });
    s.dot(M(5) + 1.5, M(7) + 1.5, 1.4, INK);
    return s.render();
  }
  const cx = 28.5;
  // the body, seated, calico patches on the white
  s.ellipse(cx, M(13), 21, 18, 'H', glaze);
  for (const [x, y, r, m] of [[-12, 30, 5, 'k'], [12, 46, 4.5, 'K'], [-10, 48, 4, 'k']]) s.ellipse(cx + x, y, r, r * 0.85, m, { flat: 0.45 });
  // the head, broad, pointed ears with pink inside, painted eyes and whiskers
  s.ellipse(cx, M(6), 18, 15, 'H', { bias: 0.04, ...glaze });
  for (const sx of [-1, 1]) {
    s.poly([[cx + sx * 6, 9], [cx + sx * 14, 1], [cx + sx * 17, 12]], 'H', { ball: [cx + sx * 12, 8, 8, 8], ...glaze });
    s.poly([[cx + sx * 9, 9], [cx + sx * 13.5, 4], [cx + sx * 15, 10]], 'P', { flat: 0.55 });
    // the closed, smiling eyes (curved lines), the whiskers
    for (let a = 0; a <= Math.PI; a += 0.15) s.px(cx + sx * 8 + Math.cos(a) * 3.5, 20 - Math.sin(a) * 2, INK);
    for (let k = -1; k <= 1; k++) s.line(cx + sx * 7, 25 + k, cx + sx * 16, 24 + k * 2.5, 0x6a6878, 1, 0.7);
  }
  s.ellipse(cx - 9, 12, 4, 3, 'k', { flat: 0.45 }); // a brown patch over one ear
  s.dot(cx, 24, 1.6, 0xd83a5a);
  s.line(cx - 2, 27, cx, 26, INK, 1);
  s.line(cx, 26, cx + 2, 27, INK, 1);
  // the red collar, the golden bell, the koban coin held against the chest (painted 千万両)
  s.poly([[cx - 14, 31], [cx + 14, 31], [cx + 13, 35], [cx - 13, 35]], 'R', { flat: 0.55 });
  s.ellipse(cx, 37, 3.6, 3.6, 'Y', { bias: 0.08 });
  s.line(cx - 3, 37.5, cx + 3, 37.5, 0x9a5f10, 1);
  s.ellipse(M(11.5) + 1.5, M(15) + 1.5, 7.8, 5.6, 'Y', { bias: 0.05, pat: speckle({ amt: 0.1 }) });
  for (let k = -1; k <= 1; k++) s.line(M(11.5) + 1.5 + k * 3, M(15) - 1, M(11.5) + 1.5 + k * 3, M(15) + 4, 0x9a5f10, 1);
  return s.render();
}

export function nekoPaw(up) {
  const s = new HiSprite(27, 33, RAMPS);
  const cx = 13.5;
  const py = up ? M(3) : M(5);
  s.tube(cx, py, cx, up ? 32 : 30, 6, 'H', { rb: 6.5 });
  s.ellipse(cx, py, 7.8, 7.8, 'H', { bias: 0.04 });
  // the pink paw pad and toe beans
  s.ellipse(cx, py + 1.5, 3, 2.4, 'P', { flat: 0.6 });
  for (const dx of [-3.6, 0, 3.6]) s.dot(cx + dx, py - 3.5, 1.3, 0xf08bb0);
  return s.render();
}

// ---------------------------------------------------------------- heavy: the bunraku puppet (41 x 49 -> 123 x 147) and a kuroko (15 x 23 -> 45 x 69)
export function ningyo(pose) {
  const s = new HiSprite(123, 147, RAMPS);
  const cx = M(19.5);
  const silk = (seed, a = Math.PI / 2) => ({ pat: mix2(fur(a, { amt: 0.12, len: 16, w: 2.2, gap: 0.03, seed }), speckle({ amt: 0.05 })) });
  // the long hakama, striped, trailing past the feet as a puppet's does, falling in deep pleats
  s.paint([cx - 40, 92, cx + 40, 146], (x, y) => Math.abs(x - cx) < 20 + (y - 92) * 0.36 && y < 144 - Math.abs(Math.sin((x - cx) * 0.18)) * 3, 'D', (x, y) => 0.58 - (x - cx) / 150 + (Math.floor((x - cx + 60) / 4) % 2 ? 0.05 : -0.05), silk(3));
  for (const d of [-26, -14, -4, 6, 16, 28]) s.line(cx + d * 0.6, 96, cx + d * 1.25, 142, 0x1a1e34, 1);
  // the kimono's body, red brocade, the gold kikkō pattern, its folds
  s.paint([cx - 26, 46, cx + 26, 96], (x, y) => Math.abs(x - cx) < 18 + (y - 46) * 0.12, 'R', (x) => 0.6 - (x - cx) / 120, silk(5));
  for (let y = 52; y < 94; y += 8) for (let x = -20; x <= 20; x += 8) {
    const X = cx + x + ((y / 8) % 2) * 4;
    if (Math.abs(X - cx) > 17) continue;
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * TAU;
      const b = ((k + 1) / 6) * TAU;
      s.line(X + Math.cos(a) * 2.6, y + Math.sin(a) * 2.6, X + Math.cos(b) * 2.6, y + Math.sin(b) * 2.6, 0xe2aa32, 1, 0.8);
    }
  }
  // the kataginu: its stiff wings sweeping out from the shoulders, starched, pleated, a white crest on each, its edges
  // catching the light; falling to a point at the waist front and back
  for (const sx of [-1, 1]) {
    s.poly([[cx + sx * 6, 44], [cx + sx * 50, 40], [cx + sx * 54, 46], [cx + sx * 46, 56], [cx + sx * 16, 60], [cx + sx * 4, 90]], 'D', { flat: 0.52 - sx * 0.06, pat: fur(sx > 0 ? -0.08 : Math.PI + 0.08, { amt: 0.1, len: 20, w: 3 }) });
    for (let k = 1; k < 5; k++) s.line(cx + sx * (10 + k * 9), 43 - k * 0.6, cx + sx * (10 + k * 8), 57 - k * 0.4, 0x1a1e34, 1, 0.8);
    s.line(cx + sx * 6, 44, cx + sx * 50, 40, 0x8aa0d8, 1);
    s.ellipse(cx + sx * 30, 49, 4.4, 4.4, 'W', { flat: 0.82 });
    for (let k = 0; k < 4; k++) s.line(cx + sx * 30, 49, cx + sx * 30 + Math.cos(k * 1.57 + 0.78) * 3.6, 49 + Math.sin(k * 1.57 + 0.78) * 3.6, 0x262941, 1);
  }
  // the collar crossed, the dagger's hilt at the belt, the black obi
  s.poly([[cx - 5, 44], [cx - 1, 44], [cx + 6, 68], [cx + 2, 70]], 'H', { flat: 0.8 });
  s.poly([[cx + 5, 44], [cx + 1, 44], [cx - 2, 60], [cx - 5, 58]], 'H', { flat: 0.68 });
  s.poly([[cx - 19, 88], [cx + 19, 88], [cx + 20, 95], [cx - 20, 95]], 'K', { flat: 0.45, pat: fur(0, { amt: 0.1, len: 8, w: 2 }) });
  s.tube(cx - 14, 92, cx - 2, 84, 1.8, 'K', { rb: 1.4 });
  s.ellipse(cx - 13, 92, 2.4, 1.4, 'Y', { flat: 0.6 });
  // the arms in the wide sleeves (the left fist on the hip, the right with the sword, raised in pose 1)
  const sleeve = (ax, ay, bx, by, seed) => {
    s.tube(ax, ay, bx, by, 7, 'R', { rb: 6, ...silk(seed, Math.atan2(by - ay, bx - ax)) });
    s.poly([[bx - 7, by - 2], [bx + 7, by - 2], [bx + 8, by + 12], [bx - 6, by + 10]], 'R', { flat: 0.45, ...silk(seed + 1) }); // the sleeve hanging
  };
  if (pose) {
    sleeve(M(9), M(20), M(5), M(11), 7);
    s.ellipse(M(5), M(10), 3.4, 3.4, 'H', { flat: 0.78 });
    s.tube(M(5), M(9), M(5), 2, 1.8, 'S', { rb: 1.2 });
    s.line(M(5) - 1, 4, M(5) - 1, M(8), 0xffffff, 1);
    s.ellipse(M(5), M(9.5), 4.6, 1.6, 'Y', { flat: 0.6 });
  } else {
    sleeve(M(9), M(20), M(6), M(29), 7);
    s.ellipse(M(6), M(31), 3.4, 3.4, 'H', { flat: 0.78 });
    s.tube(M(6), M(32), M(5), M(43), 1.8, 'S', { rb: 1.2 });
    s.ellipse(M(6), M(32.5), 4.6, 1.6, 'Y', { flat: 0.6 });
  }
  sleeve(M(29.5), M(20), M(33), M(28), 9);
  s.ellipse(M(33), M(29.5), 4, 4, 'H', { flat: 0.78 });
  // the head, carved and painted: the white gofun face, a samurai's shaved pate and topknot, sidelocks, the brows set
  // in a fierce slant, the eyes that roll, the red lines of rage, the mouth turned down
  s.tube(cx, 46, cx, 36, 5, 'H', { flat: 0.7 }); // the neck
  s.ellipse(cx, 24, 15, 17.5, 'H', { bias: 0.06, pat: speckle({ amt: 0.04 }) });
  s.paint([cx - 16, 4, cx + 16, 20], (x, y) => ((x - cx) / 15.5) ** 2 + ((y - 24) / 18) ** 2 < 1 && y < 14 + Math.abs(x - cx) * 0.3, 'S', (x) => 0.62 - (x - cx) / 60, { pat: speckle({ amt: 0.08 }) }); // the shaved pate, blue-grey
  for (const sx of [-1, 1]) s.paint([cx - 17, 8, cx + 17, 40], (x, y) => (x - cx) * sx > 11 && ((x - cx) / 16) ** 2 + ((y - 24) / 18) ** 2 < 1.04 && y < 34, 'K', () => 0.5, { pat: fur(Math.PI / 2, { amt: 0.2, len: 4, w: 1 }) });
  s.poly([[cx - 3, 8], [cx + 3, 8], [cx + 2.4, -0.5], [cx - 2.4, -0.5]], 'K', { flat: 0.55, pat: fur(Math.PI / 2, { amt: 0.2, len: 3, w: 1 }) }); // the topknot
  s.line(cx - 3.5, 7.5, cx + 3.5, 7.5, 0xffffff, 1);
  for (const sx of [-1, 1]) {
    s.tube(cx + sx * 3, 19, cx + sx * 12, 15, 1.8, 'K', { rb: 1.2 });
    s.ellipse(cx + sx * 7, 22.5, 4, 2.4, 'W', { flat: 0.9 });
    s.dot(cx + sx * (7 - (pose ? 1.6 : 0)), 22.6, 1.6, INK);
    s.line(cx + sx * 3, 20, cx + sx * 12, 19, 0xd8203a, 1, 0.8);
    s.line(cx + sx * 10, 27, cx + sx * 13, 33, 0xd8203a, 1, 0.75);
    s.line(cx + sx * 4, 29, cx + sx * 6, 33, 0xb0a8a0, 1);
  }
  s.line(cx, 24, cx, 28.5, 0xb0a8a0, 1);
  s.poly([[cx - 4, 35], [cx + 4, 35], [cx + 3, 36.5], [cx - 3, 36.5]], 'R', { flat: 0.4 });
  s.line(cx - 5, 36, cx - 6, 37.5, 0x8a1a1e, 1);
  s.line(cx + 5, 36, cx + 6, 37.5, 0x8a1a1e, 1);
  return s.render();
}

export function kuroko(f) {
  const s = new HiSprite(45, 69, RAMPS);
  const cx = 22.5;
  const cloth = (seed, a = Math.PI / 2) => ({ pat: mix2(fur(a, { amt: 0.16, len: 12, w: 2, gap: 0.05, seed }), speckle({ amt: 0.05 })) });
  // the black cotton robe, its folds catching what little light there is
  s.paint([0, 24, 45, 69], (x, y) => Math.abs(x - cx) < 10 + (y - 24) * 0.22, 'Xk', (x, y) => 0.52 - (x - cx) / 70 - (y - 24) / 300, cloth(3));
  for (const d of [-6, 0, 6]) s.line(cx + d * 0.6, 34, cx + d * 1.3, 68, 0x4a4660, 1, 0.7);
  // the arms up at the puppet's controls, bare hands on the rods
  for (const sx of [-1, 1]) {
    const hx = cx + sx * (f ? 21 : 18);
    s.tube(cx + sx * 7, 31, hx, 18, 3.4, 'Xk', cloth(5 + sx, Math.atan2(18 - 31, hx - cx - sx * 7)));
    s.line(cx + sx * 8, 30, hx - sx * 1, 19, 0x5a5672, 1, 0.6);
    s.ellipse(hx, 16, 2.6, 2.6, 'H', { flat: 0.55 });
    s.line(hx, 14, hx + sx * 2, 1, 0x8a6a3a, 1);
  }
  // the hood falling to the shoulders, the gauze panel over the face, a shadow of the face behind it
  s.ellipse(cx, M(4.5), 10.6, 11.4, 'Xk', { bias: 0.04, ...cloth(9) });
  s.poly([[cx - 10, 5], [cx + 10, 5], [cx + 12, 28], [cx - 12, 28]], 'Xk', { flat: 0.42, ...cloth(10) });
  for (const d of [-7, 0, 7]) s.line(cx + d * 0.8, 10, cx + d * 1.2, 27, 0x4a4660, 1, 0.6);
  s.poly([[cx - 6.5, 11], [cx + 6.5, 11], [cx + 7, 21], [cx - 7, 21]], 'D', { flat: 0.32, pat: speckle({ amt: 0.3, dark: 0.3, light: 0.2 }) });
  s.dot(cx - 2.6, 15, 1, 0x9a96b0, 0.8);
  s.dot(cx + 2.6, 15, 1, 0x9a96b0, 0.8);
  return s.render();
}

// ---------------------------------------------------------------- boss: the octopus of Osaka Bay (63 x 49 -> 189 x 147), its arm segments and tips
export function tako(f) {
  const s = new HiSprite(189, 147, RAMPS);
  const cx = M(30.5);
  const skin = { pat: mix2(mottle({ amt: 0.18, scale: 8 }), speckle({ amt: 0.14, dark: 0.06, light: 0.04 })) };
  // the base of the arms, curling, suckers showing
  for (const dx of [-16, -6, 6, 16]) {
    s.ellipse(cx + dx * 3, M(41), 12.5, 12.5, 'O', skin);
    for (let k = 0; k < 3; k++) s.ellipse(cx + dx * 3 + (k - 1) * 5, M(41) + 7, 2, 1.6, 'P', { flat: 0.6 });
  }
  // the great mantle, warty, mottled
  s.ellipse(cx, M(20), 66, 57, 'O', { bias: 0.02, ...skin });
  for (const [x, y, r] of [[18, 12, 2.4], [40, 10, 2], [28, 6, 1.6], [44, 22, 1.8], [15, 24, 1.6], [34, 15, 1.2], [22, 18, 1.1]]) {
    s.ellipse(M(x), M(y), r * 3, r * 3, 'R', { bias: 0.08 });
    s.px(M(x) - r, M(y) - r, 0xffb8a0);
  }
  s.dot(cx - 30, M(8), 5, 0xffc8b0, 0.5);
  // the twisted towel headband, red and white, knotted at the side with its ends sticking up
  for (let x = M(9); x < M(52); x += 0.5) {
    const y = M(15) + Math.sin(x * 0.1) * 1.5;
    const tw = Math.floor(x / 5) % 2;
    s.tube(x, y, x + 0.6, y, 3.4, tw ? 'H' : 'R', { flat: tw ? 0.75 : 0.55 });
  }
  for (let x = M(10); x < M(51); x += 10) s.line(x, M(15) - 3, x + 4, M(15) + 3, 0x8a1a1e, 1, 0.6);
  s.ellipse(M(51.5), M(15.5), 6, 6, 'H', { flat: 0.7 });
  s.poly([[M(51), M(14)], [M(55), M(9)], [M(56), M(11)]], 'H', { flat: 0.65 });
  s.poly([[M(52), M(15)], [M(57), M(13)], [M(56.5), M(16)]], 'R', { flat: 0.55 });
  // the furious eyes, the brows knitted, the siphon pouting
  for (const sx of [-1, 1]) {
    s.ellipse(cx + sx * 27, M(26), 15, 13, 'H', { flat: 0.82 });
    s.dot(cx + sx * 25, M(27), 7.2, INK);
    s.dot(cx + sx * 25 - 2.5, M(27) - 3, 2.2, 0xffffff);
    s.tube(cx + sx * 12, M(22), cx + sx * 42, M(18.5), 3.6, 'O', { rb: 2.4, bias: -0.15 });
    s.line(cx + sx * 12, M(22) + 2, cx + sx * 42, M(18.5) + 2, 0x5a0a08, 2);
  }
  s.tube(cx, M(33), cx, M(36) + (f ? 3 : 0), 10 + f, 'O', { rb: f ? 12.5 : 9.5, ...skin });
  s.ellipse(cx, M(36.5) + (f ? 3 : 0), 6, f ? 7.2 : 4.2, 'K', { flat: 0.12 });
  return s.render();
}

export function tseg(i) {
  const size = [42, 36, 30][i];
  const r = [5.2, 4.2, 3.2][i] * 3;
  const s = new HiSprite(size, size, RAMPS);
  const c = size / 2;
  s.ellipse(c, c, r, r, 'O', { pat: mix2(mottle({ amt: 0.15, scale: 5 }), speckle({ amt: 0.1 })) });
  // a sucker on the underside, ringed
  s.ellipse(c + r * 0.3, c, r * 0.42, r * 0.42, 'P', { flat: 0.6 });
  s.ellipse(c + r * 0.3, c, r * 0.2, r * 0.2, 'P', { flat: 0.35 });
  return s.render();
}

export function ttip() {
  const s = new HiSprite(27, 27, RAMPS);
  s.ellipse(13.5, 13.5, 7.8, 7.8, 'O', { pat: speckle({ amt: 0.1 }) });
  s.tube(15, 14, 20, 20, 3, 'O', { rb: 1.2 });
  s.dot(15, 9, 1.8, 0xf08bb0);
  return s.render();
}

/**
 * Tako's eyes over its head frame (step 2a): looking left (0), ahead (1), right (2) after the player, and
 * shut (3) for a blink. Only the eyes are drawn; the brows over them are kept from the head frame.
 */
export function takoEyes(look) {
  const head = tako(0);
  const out = new Raster(head.w, head.h);
  const cx = M(30.5);
  for (const sx of [-1, 1]) {
    const ex = cx + sx * 27;
    const ey = M(26);
    const px = cx + sx * 25 + [-4.5, 0, 4.5][Math.min(look, 2)];
    const py = M(27) + 1.5;
    const skin = head.get(Math.round(ex), Math.round(ey - 20)); // the head's skin just above, for the lids
    for (let y = Math.floor(ey - 14); y <= ey + 14; y++)
      for (let x = Math.floor(ex - 16); x <= ex + 16; x++) {
        const u = (x + 0.5 - ex) / 15;
        const v = (y + 0.5 - ey) / 13;
        if (u * u + v * v > 1 || !head.alpha(x, y)) continue;
        // the brow runs over the top of the eye (from (12, 22) out to (42, 18.5)): it and the outline stay
        const t = Math.max(0, Math.min(1, ((x - cx) * sx - 12) / 30));
        const brow = M(22) + (M(18.5) - M(22)) * t;
        if (u * u + v * v > (look === 3 ? 1.02 : 0.86) || y < brow + 4) continue;
        if (look === 3) {
          // shut: the lid down over it, its rim a dark line across the middle
          out.set(x, y, Math.abs(v - 0.15) < 0.12 ? 0x5a0a08 : skin);
          continue;
        }
        const d = Math.hypot(x + 0.5 - px, y + 0.5 - py);
        if (d < 7.2) out.set(x, y, d < 2.4 && x < px && y < py ? 0xffffff : 0x14101c);
        else out.set(x, y, v > 0.45 ? 0xd8d0c8 : 0xfffaf0); // the white, a little shaded underneath
      }
  }
  return out;
}

// ---------------------------------------------------------------- the boss fight's mooring piles (18 -> 54)
// A wooden pile driven into the bay, seen from above: its sawn top with the growth rings, an iron band, a hemp
// mooring rope wound round it, weed at the waterline and a ring of foam where the water laps it.
export function takoPile() {
  const s = new HiSprite(54, 54, RAMPS);
  const c = 27;
  // foam and the darker water it stirs
  for (let k = 0; k < 40; k++) {
    const a = (k / 40) * TAU + Math.sin(k * 2.3) * 0.06;
    const r = 19.5 + Math.sin(k * 1.7) * 1.4 + (k % 3) * 0.6;
    if (Math.sin(k * 0.9) > -0.55) s.dot(c + Math.cos(a) * r, c + Math.sin(a) * r, 1.1 + (k % 2) * 0.5, 0xe8f4ff, 0.75);
  }
  // weed and barnacles at the waterline
  s.ellipse(c, c + 1, 17, 17, 'G', { flat: 0.3, pat: mottle({ amt: 0.3, scale: 3 }) });
  for (let k = 0; k < 7; k++) s.dot(c + Math.cos(k * 0.9 + 0.4) * 16, c + Math.sin(k * 0.9 + 0.4) * 16, 0.9, 0xd8d0c0, 0.9); // barnacles
  // the pile: a log seen end on, an iron band round it
  s.ellipse(c, c, 15, 15, 'S', { bias: 0.08 });
  s.ellipse(c, c, 13, 13, 'N', { bias: 0.06, pat: speckle({ amt: 0.15, dark: 0.1 }) });
  for (const r of [10, 7, 4]) s.paint([c - 13, c - 13, c + 13, c + 13], (x, y) => Math.abs(Math.hypot(x - c + 0.6, y - c - 0.4) - r) < 0.55, 'N', () => 0.2);
  for (let k = 0; k < 4; k++) s.line(c, c, c + Math.cos(k * 1.7) * 11, c + Math.sin(k * 1.7) * 11, 0x4a2e18, 1, 0.6); // its cracks
  // the hemp rope wound round it, its loose end trailing off
  for (let k = 0; k < 22; k++) {
    const a = (k / 22) * TAU;
    s.dot(c + Math.cos(a) * 14, c + Math.sin(a) * 14, 1.7, k % 2 ? 0xd8b870 : 0xb08a48);
  }
  for (let k = 0; k < 9; k++) s.dot(c + 14 + k * 1.3, c + 3 + k * 1.5, 1.5, k % 2 ? 0xd8b870 : 0xb08a48);
  s.dot(c - 4, c - 5, 1.6, 0xfff0d0, 0.6); // the light on the sawn top
  return s.render();
}

export function osakaEnemies(add) {
  for (let f = 0; f < 4; f++) {
    add(`takoyaki_${f}`, takoyaki(f));
    add(`fugu_${f}`, fugu(f));
    add(`kushi_${f}`, kushi(f));
    for (const c of ['red', 'blue', 'green', 'purple']) add(`ame_${c}_${f}`, ame(c, f));
  }
  add('neko_base', nekoBase(false));
  add('neko_wreck', nekoBase(true));
  add('neko_paw_0', nekoPaw(false));
  add('neko_paw_1', nekoPaw(true));
  add('ningyo_0', ningyo(0));
  add('ningyo_1', ningyo(1));
  add('kuroko_0', kuroko(0));
  add('kuroko_1', kuroko(1));
  add('tako_0', tako(0));
  add('tako_1', tako(1));
  for (let k = 0; k < 4; k++) add(`tako_eyes_${k}`, takoEyes(k)); // step 2a: following the player, blinking
  for (let i = 0; i < 3; i++) add(`tseg_${i}`, tseg(i));
  add('ttip', ttip());
  add('tako_pile', takoPile()); // the boss fight's mooring piles
}
export const OSAKA_PORTRAITS = ['neko_base', 'tako_0'];
