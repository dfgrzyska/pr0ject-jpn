// Osaka's enemies at 540 px (docs/enemies-540-plan.md): takoyaki in their glaze of sauce, mayonnaise in
// threads, aonori and dancing bonito flakes; the paper fugu lantern of Dōtonbori on its bamboo ribs;
// kushikatsu, three pieces in coarse panko on a skewer; candy twisted in cellophane, the kind Osaka's aunties
// carry; the maneki-neko, porcelain, calico-spotted, with its collar, bell and koban; the bunraku puppet, a
// samurai in stiff winged kamishimo, and the three kuroko in black working it; and the octopus of Osaka Bay
// with a twisted towel tied round its head like a takoyaki seller.
// Every frame is three times the old one's size (old mask coordinate m -> fine (m + 1) * 3).
import { HiSprite, tones, fur, speckle, crackle, mottle, mix2 } from '../../lib/hisprite.mjs';

const INK = 0x14101c;
const TAU = Math.PI * 2;
const M = (m) => (m + 1) * 3;
const RAMPS = {
  T: tones([0x6a3a14, 0xb0702e, 0xe8b060]), // fried batter
  u: tones([0x1c0c06, 0x3e200e, 0x7a4a26]), // takoyaki sauce
  O: tones([0x8a1a10, 0xd0402a, 0xf8805a]), // octopus red
  H: tones([0xb0a8a0, 0xeae6de, 0xffffff]), // porcelain, a puppet's painted face
  X: tones([0x08070c, 0x16141e, 0x2e2a3a]), // the kuroko's black
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
  s.ellipse(cx, cy, 15, 12.5, { red: 'R', blue: 'B', green: 'G' }[color], { bias: 0.04, pat: mottle({ amt: 0.1, scale: 5 }) });
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
  const silk = { pat: mix2(fur(Math.PI / 2, { amt: 0.12, len: 14, w: 2, gap: 0.03 }), speckle({ amt: 0.06 })) };
  // the kimono, red brocade with gold, flaring to the hem; the hakama's folds
  s.paint([0, 48, 123, 135], (x, y) => Math.abs(x - cx) < 18 + (y - 48) * 0.22, 'R', (x, y) => 0.6 - (x - cx) / 160, silk);
  for (let y = 54; y < 132; y += 9) for (let x = -24; x <= 24; x += 9) {
    const X = cx + x + ((y / 9) % 2) * 4.5;
    if (Math.abs(X - cx) < 16 + (y - 48) * 0.22) {
      // a gold kikkō-hexagon brocade
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * TAU;
        const b = ((k + 1) / 6) * TAU;
        s.line(X + Math.cos(a) * 3, y + Math.sin(a) * 3, X + Math.cos(b) * 3, y + Math.sin(b) * 3, 0xe2aa32, 1, 0.75);
      }
    }
  }
  for (const d of [-8, 0, 8]) s.line(cx + d, 92, cx + d * 1.4, 132, 0x8a1a1e, 1);
  // the kamishimo: stiff shoulder wings of dark blue, crested
  s.poly([[cx - 44, 48], [cx + 44, 48], [cx + 42, 60], [cx + 16, 62], [cx, 86], [cx - 16, 62], [cx - 42, 60]], 'D', { flat: 0.55, pat: speckle({ amt: 0.08 }) });
  s.line(cx - 44, 48, cx + 44, 48, 0xa8d0ff, 1);
  for (const sx of [-1, 1]) {
    s.ellipse(cx + sx * 28, 54, 3.6, 3.6, 'W', { flat: 0.75 });
    s.dot(cx + sx * 28, 54, 1.6, 0x262941);
  }
  // the crossed collar and the black obi
  s.poly([[cx - 6, 46], [cx - 2, 46], [cx + 6, 74], [cx + 2, 76]], 'H', { flat: 0.75 });
  s.poly([[cx + 6, 46], [cx + 2, 46], [cx - 2, 64], [cx - 5, 62]], 'H', { flat: 0.65 });
  s.poly([[cx - 18, 87], [cx + 18, 87], [cx + 19, 93], [cx - 19, 93]], 'K', { flat: 0.45 });
  // the arms: the left out holding its fan; the right with the sword, raised in pose 1
  const arm = (ax, ay, bx, by) => s.tube(ax, ay, bx, by, 5.5, 'R', { rb: 4.6, ...silk });
  if (pose) {
    arm(M(9), M(20), M(5), M(10));
    s.ellipse(M(5), M(9), 3.6, 3.6, 'H', { flat: 0.75 });
    s.tube(M(5), M(8), M(5), 2, 1.8, 'S', { rb: 1.2 });
    s.line(M(5) - 1, 4, M(5) - 1, M(7), 0xffffff, 1);
    s.ellipse(M(5), M(8.5), 4.5, 1.6, 'Y', { flat: 0.6 }); // the tsuba
  } else {
    arm(M(9), M(20), M(6), M(30));
    s.ellipse(M(6), M(31), 3.6, 3.6, 'H', { flat: 0.75 });
    s.tube(M(6), M(32), M(6), M(43), 1.8, 'S', { rb: 1.2 });
    s.ellipse(M(6), M(32.5), 4.5, 1.6, 'Y', { flat: 0.6 });
  }
  arm(M(29.5), M(20), M(33.5), M(28));
  s.ellipse(M(33.5), M(29.5), 6, 6, 'H', { flat: 0.75 });
  s.poly([[M(33.5), M(29.5)], [M(33.5) + 14, M(29.5) - 6], [M(33.5) + 12, M(29.5) + 8]], 'Y', { flat: 0.6 });
  // the painted head: white gofun face, black hair in a samurai's topknot, the fierce brows, the eyes that roll
  s.ellipse(cx, M(9), 18, 19.5, 'H', { bias: 0.05 });
  s.poly([[cx - 18, 9], [cx + 18, 9], [cx + 18, 18], [cx + 12, 13], [cx - 12, 13], [cx - 18, 18]], 'K', { flat: 0.55, pat: fur(0, { amt: 0.2, len: 6, w: 1 }) });
  s.ellipse(cx, 4, 6, 3.8, 'K', { flat: 0.6 }); // the topknot
  s.line(cx, 0, cx, 4, 0x2a2638, 2);
  for (const sx of [-1, 1]) {
    s.tube(cx + sx * 4, M(7.5), cx + sx * 14, M(6), 1.5, 'K', { rb: 2.2 }); // the brows, cut up in anger
    s.ellipse(cx + sx * 8, M(9), 4.6, 2.6, 'W', { flat: 0.8 });
    s.dot(cx + sx * (8 - (pose ? 2 : 0)), M(9) + 0.5, 1.8, INK);
    s.line(cx + sx * 3.5, M(9) - 2.5, cx + sx * 12.5, M(9) - 3, 0xd8203a, 1, 0.8); // red kumadori lines
    s.line(cx + sx * 12, M(9) + 3, cx + sx * 15, M(12), 0xd8203a, 1, 0.7);
  }
  s.line(cx, M(10), cx, M(11.5), 0xb0a8a0, 1);
  s.poly([[cx - 4.5, M(13)], [cx + 4.5, M(13)], [cx + 3, M(13.8)], [cx - 3, M(13.8)]], 'R', { flat: 0.45 });
  // the feet in tabi
  for (const fx of [12, 23]) s.ellipse(M(fx) + 7, M(45), 7.4, 4.8, 'H', { flat: 0.6 });
  return s.render();
}

export function kuroko(f) {
  const s = new HiSprite(45, 69, RAMPS);
  const cx = 22.5;
  const black = { pat: fur(Math.PI / 2, { amt: 0.14, len: 12, w: 2, gap: 0.05 }) };
  // the robe, the arms reaching up to work the puppet's rods
  s.paint([0, 24, 45, 69], (x, y) => Math.abs(x - cx) < 10 + (y - 24) * 0.22, 'X', (x) => 0.55 - (x - cx) / 90, black);
  for (const sx of [-1, 1]) {
    const hx = cx + sx * (f ? 21 : 18);
    s.tube(cx + sx * 7, 31, hx, 17, 3, 'X', black);
    s.ellipse(hx, 15.5, 2.4, 2.4, 'H', { flat: 0.6 });
    s.line(hx, 14, hx + sx * 2, 2, 0x8a6a3a, 1); // the rod
  }
  // the hood, the gauze over the eyes
  s.ellipse(cx, M(4.5), 10.6, 11.4, 'X', { bias: 0.02, ...black });
  s.poly([[cx - 10, 5], [cx + 10, 5], [cx + 12, 28], [cx - 12, 28]], 'X', { flat: 0.42, ...black });
  s.poly([[cx - 6, 13], [cx + 6, 13], [cx + 6, 17], [cx - 6, 17]], 'D', { flat: 0.4, pat: speckle({ amt: 0.2, dark: 0.3 }) });
  s.dot(cx - 2.5, 15, 0.8, 0x8a8aa8);
  s.dot(cx + 2.5, 15, 0.8, 0x8a8aa8);
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

export function osakaEnemies(add) {
  for (let f = 0; f < 4; f++) {
    add(`takoyaki_${f}`, takoyaki(f));
    add(`fugu_${f}`, fugu(f));
    add(`kushi_${f}`, kushi(f));
    for (const c of ['red', 'blue', 'green']) add(`ame_${c}_${f}`, ame(c, f));
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
  for (let i = 0; i < 3; i++) add(`tseg_${i}`, tseg(i));
  add('ttip', ttip());
}
export const OSAKA_PORTRAITS = ['neko_base', 'tako_0'];
