// The Oranda-bune at 540 px (62 x 106 -> 186 x 318), bow down: the Dutch East Indiaman as the Nagasaki prints draw
// it (and the Kunchi float copies it), seen from above. A black hull with ochre wales and red-painted bulwarks; a
// weathered deck of long planks, caulked, tarred; guns on their carriages along both sides run out through the
// ports; hatches and gratings, the capstan, a ship's boat stowed amidships, casks, coils of rope; the high poop
// with its gilded, carved stern gallery and the great stern lantern; three masts with fighting tops, the yards
// and the sails bellying to the bow, seamed, shaded, their reef points, the main course lettered VOC; shrouds and
// ratlines down to the channels, the stays between the masts; the tricolour and the long pennants; the bowsprit,
// its spritsail, the beakhead and the red lion figurehead; a catted anchor; a few of the crew.
import { HiSprite, tones, fur, speckle, crackle, mottle, mix2 } from '../../lib/hisprite.mjs';

const INK = 0x14101c;
const TAU = Math.PI * 2;
const RAMPS = {
  k: tones([0x0e0c10, 0x1e1a1e, 0x3e3638]), // black lacquered hull
  o: tones([0x6a4a18, 0xb08a3a, 0xe0c070]), // ochre wales
  r: tones([0x5a1410, 0x9a2a1e, 0xd0543a]), // red bulwarks
  d: tones([0x5a4228, 0x8e7048, 0xc4a478]), // weathered deck planking
  w: tones([0x3a2414, 0x664428, 0x9a7048]), // dark timber: masts, yards, hatches
  v: tones([0xa89c80, 0xe2d8bc, 0xfaf4e2]), // sailcloth
  i: tones([0x16141a, 0x302c34, 0x5a5462]), // iron guns
  y: tones([0x8a5a10, 0xd8a030, 0xfff0a0]), // gilt
  l: tones([0x7a1410, 0xc8302a, 0xff7a60]), // the lion's red
};
const timber = (seed, a = Math.PI / 2) => ({ pat: mix2(fur(a, { amt: 0.18, len: 26, w: 2.2, gap: 0.05, seed }), speckle({ amt: 0.1, dark: 0.05, light: 0.04, seed: seed + 1 })) });
const canvas = (seed) => ({ pat: mix2(fur(0, { amt: 0.06, len: 30, w: 4, seed }), mottle({ amt: 0.08, scale: 9, seed: seed + 1 })) });

export function oranda(f) {
  const s = new HiSprite(186, 318, RAMPS);
  const cx = 93;
  // the hull's half-width down its length (in fine pixels): a broad round stern, full in the waist, fine at the bow
  const half = (y) => {
    const u = y / 3;
    if (u < 10) return (15 + u * 0.45) * 3;
    if (u < 46) return (19.5 + Math.sin(((u - 10) / 36) * Math.PI * 0.5) * 3.2) * 3;
    return Math.max(0, 22.7 * Math.pow(Math.cos(((u - 46) / 46) * Math.PI * 0.5), 0.85)) * 3;
  };
  const inHull = (x, y, inset = 0) => y > 12 && y < 278 && Math.abs(x - cx) < half(y) - inset;

  // ---- the hull: black lacquer, the ochre wales running its length, worn pale at the turn of the bilge
  s.paint([0, 10, 186, 280], (x, y) => inHull(x, y), 'k', (x) => 0.58 - (x - cx) / 150, timber(3));
  for (let y = 14; y < 276; y++) for (const sd of [-1, 1]) {
    const h = half(y);
    if (h < 10) continue;
    for (const [d0, d1] of [[2, 4], [7, 8.5]]) for (let d = d0; d < d1; d += 1) s.px(cx + sd * (h - d), y, sd < 0 ? 0xc89a48 : 0x8a6a2a);
  }
  // ---- the bulwarks, red inside, and the deck of long planks, caulked, tarred, worn
  s.paint([0, 10, 186, 280], (x, y) => inHull(x, y, 11), 'r', (x) => 0.55 - (x - cx) / 150, timber(5));
  s.paint([0, 10, 186, 280], (x, y) => inHull(x, y, 15), 'd', (x, y) => 0.62 - (x - cx) / 200 + (Math.floor((x - cx + 120) / 6) % 3 - 1) * 0.03, { pat: mix2(fur(Math.PI / 2, { amt: 0.16, len: 48, w: 6, gap: 0.03, seed: 7 }), speckle({ amt: 0.12, dark: 0.06, light: 0.04, seed: 8 }), mottle({ amt: 0.1, scale: 9 })) });
  for (let x = -60; x <= 60; x += 6) for (let y = 30; y < 262; y++) if (s.mat[y * 186 + Math.round(cx + x)] === 'd' && (y + x * 7) % 41 !== 0) s.px(cx + x, y, 0x3a2a18, 0.55);
  for (const [x, y, r] of [[-20, 120, 5], [24, 160, 4], [-10, 200, 6], [14, 96, 3.6]]) s.dot(cx + x, y, r, 0x2a2018, 0.35); // tar stains

  // ---- the guns on their carriages along both sides, run out through the ports
  for (const gy of [86, 110, 134, 158, 182, 206]) for (const sd of [-1, 1]) {
    const h = half(gy);
    const x0 = cx + sd * (h - 24);
    s.poly([[x0 - 5, gy - 5], [x0 + 5, gy - 5], [x0 + 5, gy + 5], [x0 - 5, gy + 5]], 'w', { flat: 0.45, ...timber(gy) });
    s.tube(x0, gy, cx + sd * (h + 4), gy, 2.8, 'i', { rb: 2.2 });
    s.ellipse(cx + sd * (h + 4.5), gy, 2.6, 2.6, 'i', { bias: 0.1 });
    s.dot(cx + sd * (h + 5), gy, 1.2, INK);
    s.line(x0 - sd * 5, gy - 4, cx + sd * (h - 13), gy - 6, 0xc8b890, 1, 0.8); // the breeching rope
  }

  // ---- hatches with their gratings, the capstan, the ship's boat stowed amidships, casks, a coil of rope
  for (const [y, w, h] of [[118, 26, 16], [170, 22, 14]]) {
    s.poly([[cx - w / 2, y], [cx + w / 2, y], [cx + w / 2, y + h], [cx - w / 2, y + h]], 'w', { flat: 0.52, ...timber(y) });
    for (let x = cx - w / 2 + 3; x < cx + w / 2 - 2; x += 3.5) for (let yy = y + 3; yy < y + h - 2; yy += 3.5) s.dot(x, yy, 0.9, 0x1a1008);
  }
  s.paint([cx - 12, 136, cx + 12, 166], (x, y) => ((x - cx) / 10) ** 2 + ((y - 151) / 14) ** 2 < 1, 'w', (x) => 0.5 - (x - cx) / 40, timber(31)); // the boat
  s.paint([cx - 12, 136, cx + 12, 166], (x, y) => ((x - cx) / 8) ** 2 + ((y - 151) / 12) ** 2 < 1, 'd', () => 0.45, timber(32));
  for (const y of [144, 151, 158]) s.line(cx - 7, y, cx + 7, y, 0x5a4228, 1);
  s.ellipse(cx, 226, 6.6, 6.6, 'w', { bias: 0.08, ...timber(33) });
  for (let k = 0; k < 8; k++) s.line(cx, 226, cx + Math.cos((k / 8) * TAU) * 11, 226 + Math.sin((k / 8) * TAU) * 11, 0x3a2414, 2);
  for (const [x, y] of [[-30, 214], [-24, 220], [30, 100], [26, 106]]) {
    s.ellipse(cx + x, y, 4.4, 4.4, 'w', { bias: 0.1 });
    s.line(cx + x - 4, y, cx + x + 4, y, 0x1a1008, 1);
  }
  for (let a = 0; a < Math.PI * 5; a += 0.12) s.px(cx + 30 + Math.cos(a) * (1 + a * 0.4), 236 + Math.sin(a) * (1 + a * 0.4), 0xc8b890, 0.9);

  // ---- the poop: the raised stern deck, its gilt rail; the stern gallery carved and gilded, its lit windows; the
  // great stern lantern; corner lanterns; the cabin skylight; the helmsman
  s.paint([0, 10, 186, 74], (x, y) => y > 16 && y < 70 && Math.abs(x - cx) < half(y) - 5, 'w', (x) => 0.55 - (x - cx) / 150, timber(41, 0));
  s.paint([0, 10, 186, 74], (x, y) => y > 22 && y < 66 && Math.abs(x - cx) < half(y) - 13, 'd', (x) => 0.66 - (x - cx) / 200, timber(42, 0));
  for (let y = 26; y < 64; y += 6) s.line(cx - half(y) + 14, y, cx + half(y) - 14, y, 0x3a2a18, 1, 0.5);
  for (let x = -40; x <= 40; x += 4) s.dot(cx + x, 69, 1.2, 0xe8b030); // the balusters of its rail
  s.line(cx - 44, 70.5, cx + 44, 70.5, 0x8a5a10, 2);
  // the stern gallery along the top edge: carved gilt work, windows lit by the cabin lamps
  s.paint([cx - 46, 8, cx + 46, 20], (x, y) => y > 9 && y < 19 && Math.abs(x - cx) < 44 - (19 - y) * 0.6, 'y', (x, y) => 0.5 + Math.sin(x * 1.3) * 0.12 + Math.sin(y * 1.9 + x * 0.4) * 0.1, { pat: speckle({ amt: 0.2, dark: 0.12, light: 0.1 }) });
  for (let x = -36; x <= 36; x += 8) s.poly([[cx + x - 2.5, 11], [cx + x + 2.5, 11], [cx + x + 2.5, 17], [cx + x - 2.5, 17]], 'y', { glow: true, flat: f ? 0.86 : 0.98 });
  s.ellipse(cx, 6, 6, 5, 'y', { bias: 0.1 });
  s.ellipse(cx, 6, 3.6, 3, 'y', { glow: true, flat: f ? 0.95 : 0.85 });
  for (const [x, y] of [[-44, 20], [44, 20]]) s.ellipse(cx + x, y, 3.6, 3.6, 'y', { glow: true, flat: 0.9 });
  s.poly([[cx - 10, 34], [cx + 10, 34], [cx + 10, 48], [cx - 10, 48]], 'w', { flat: 0.4 });
  for (let x = cx - 8; x < cx + 9; x += 4) s.poly([[x, 36], [x + 2.6, 36], [x + 2.6, 46], [x, 46]], 'y', { glow: true, flat: 0.7 });
  s.tube(cx - 12, 56, cx + 12, 56, 1.4, 'w'); // the whipstaff
  s.ellipse(cx + 6, 59, 3, 3, 'k', { flat: 0.4 }); // the helmsman's hat
  s.dot(cx + 6, 59, 1.4, 0x5a3a20);

  // ---- the stays between the masts and the shrouds down to the channels, ratlines across them
  const masts = [[cx, 92], [cx, 152], [cx, 216]];
  for (let k = 0; k < 2; k++) s.line(masts[k][0], masts[k][1], masts[k + 1][0], masts[k + 1][1], 0x2a1a10, 1, 0.9);
  s.line(cx, 216, cx, 300, 0x2a1a10, 1, 0.9);
  for (const [mx, my] of masts) for (const sd of [-1, 1]) {
    const pts = [-10, -2, 6, 14].map((d) => [cx + sd * (half(my + d) - 9), my + d]);
    for (const [x, y] of pts) s.line(mx + sd * 3, my, x, y, 0x1e1410, 1, 0.85);
    for (let t = 0.3; t < 1; t += 0.18) s.line(mx + (pts[0][0] - mx) * t, my + (pts[0][1] - my) * t, mx + (pts[3][0] - mx) * t, my + (pts[3][1] - my) * t, 0x3a2a1a, 1, 0.6);
  }

  // ---- the yards and the sails, bellying towards the bow, seamed and shaded, their shadows thrown on the deck
  const sail = (my, w, h, ph, lettered) => {
    const yard = my - 10;
    const W2 = w * 3;
    const H = h * 3;
    // the shadow it throws aft-right onto the deck
    s.shade([cx - W2 + 8, yard + 6, cx + W2 + 12, yard + H + 18], (x, y) => s.mat[Math.floor(y) * 186 + Math.floor(x)] === 'd' || s.mat[Math.floor(y) * 186 + Math.floor(x)] === 'r', -0.22);
    s.tube(cx - W2 - 7, yard, cx + W2 + 7, yard, 2.2, 'w', { rb: 2.2 });
    for (const sd of [-1, 1]) s.dot(cx + sd * (W2 + 7), yard, 1.4, 0x1a1008);
    s.paint([cx - W2, yard + 1, cx + W2, yard + H + 14], (x, y) => {
      const t = (x - cx) / W2;
      const belly = (1 - t * t) * (8 + ((f + ph) % 2) * 3);
      return Math.abs(t) <= 1 && y > yard + 1 && y < yard + H + belly;
    }, 'v', (x, y) => {
      const t = (x - cx) / W2;
      const belly = (1 - t * t) * (8 + ((f + ph) % 2) * 3);
      const k = (y - yard) / (H + belly);
      return 0.74 - t * 0.32 - k * 0.32 + Math.sin(t * 9 + ph) * 0.05;
    }, canvas(ph + 11));
    // the cloths' seams down the sail, the reef points in a row, the bolt-rope at the foot
    for (let x = -W2 + 9; x < W2; x += 9) for (let y = yard + 3; y < yard + H; y++) if (s.mat[y * 186 + Math.round(cx + x)] === 'v') s.px(cx + x, y, 0xb8ac90, 0.65);
    for (let x = -W2 + 4; x < W2 - 3; x += 5) s.px(cx + x, yard + 6, 0x8a7a60);
    for (let x = -W2; x <= W2; x++) {
      const t = x / W2;
      const belly = (1 - t * t) * (8 + ((f + ph) % 2) * 3);
      s.px(cx + x, yard + H + belly - 1, 0x7a6e58);
    }
    if (lettered) {
      // the VOC monogram in red on the main course
      const yy = yard + H * 0.55;
      s.line(cx - 7, yy - 5, cx - 2, yy + 5, 0xb8202a, 2);
      s.line(cx - 2, yy + 5, cx + 3, yy - 5, 0xb8202a, 2);
      for (let a = 0; a < TAU; a += 0.15) s.px(cx - 2 + Math.cos(a) * 3, yy - 1 + Math.sin(a) * 3, 0xb8202a);
      for (let a = 0.6; a < TAU - 0.6; a += 0.15) s.px(cx + 6 + Math.cos(a) * 3, yy + 1 + Math.sin(a) * 3, 0xb8202a);
    }
    // the mast and its fighting top, a round platform, above the sail
    s.ellipse(cx, my, 9, 9, 'w', { bias: 0.06, ...timber(my) });
    s.ellipse(cx, my, 6, 6, 'w', { flat: 0.3 });
    s.ellipse(cx, my, 3.4, 3.4, 'w', { bias: 0.15 });
  };
  sail(102, 17, 8, 1, false);
  sail(162, 21, 10, 0, true);
  sail(226, 16, 8, 2, false);

  // ---- the flags: the tricolour streaming from the ensign staff at the stern; long pennants from the mastheads
  s.tube(cx, 0, cx, 10, 1.2, 'w');
  for (let x = 2; x < 40; x++) {
    const dy = Math.sin(x * 0.22 + f * 2.2) * (x / 38) * 5;
    for (const [y0, col] of [[0, 0xd8402a], [5, 0xf4f0e8], [10, 0x2a4a9a]]) for (let j = 0; j < 5; j++) s.px(cx + x, 1 + y0 + j + dy, (j === 0 && y0 === 0) || (x + j) % 9 === 0 ? (col & 0xfefefe) >> 0 : col);
  }
  // (the pennants stream out past the yardarms, clear of the sails)
  for (const [my, len, dir] of [[86, 80, -1], [146, 88, -1], [210, 76, -1]]) {
    for (let x = 58; x < len; x++) {
      const y = my + Math.sin(x * 0.18 + f * 2 + my) * 3.5;
      const col = x % 15 < 5 ? 0xd8402a : x % 15 < 10 ? 0xf4f0e8 : 0x2a4a9a;
      const w = 2.6 * (1 - (x - 58) / (len - 58)) + 0.6;
      for (let j = -w; j <= w; j++) s.px(cx + dir * x, y + j, col);
    }
  }

  // ---- the forecastle, the beakhead, the bowsprit with its spritsail, the red lion figurehead with a gilt mane
  s.paint([0, 250, 186, 280], (x, y) => y > 254 && Math.abs(x - cx) < half(y) - 4, 'w', (x) => 0.55 - (x - cx) / 120, timber(51, 0));
  s.line(cx - 26, 255, cx + 26, 255, 0xd8a030, 2);
  s.tube(cx, 270, cx, 316, 2.2, 'w', { rb: 1.6 });
  s.tube(cx - 22, 296, cx + 22, 296, 1.4, 'w');
  s.paint([cx - 20, 297, cx + 20, 312], (x, y) => Math.abs(x - cx) < 20 && y < 306 + (1 - ((x - cx) / 20) ** 2) * 4, 'v', (x, y) => 0.7 - (x - cx) / 70 - (y - 297) / 50, canvas(61));
  s.line(cx - 21, 296, cx - 26, 262, 0x1e1410, 1, 0.8);
  s.line(cx + 21, 296, cx + 26, 262, 0x1e1410, 1, 0.8);
  for (let a = 0; a < TAU; a += 0.35) s.ellipse(cx + Math.cos(a) * 7.5, 281 + Math.sin(a) * 7, 2.6, 2.6, 'y', { bias: 0.12 });
  s.ellipse(cx, 283, 5.5, 5.5, 'l', { bias: 0.1 });
  for (const sd of [-1, 1]) s.dot(cx + sd * 2.2, 282, 1, 0xffd070);
  s.line(cx - 2, 286, cx + 2, 286, 0x5a0a08, 1);
  // a catted anchor hanging at the bow, its cable
  s.tube(cx - 30, 246, cx - 30, 262, 1.8, 'i');
  s.tube(cx - 35, 262, cx - 25, 262, 1.6, 'i');
  for (const sd of [-1, 1]) s.dot(cx - 30 + sd * 5, 260, 1.4, 0x302c34);
  s.tube(cx - 34, 244, cx - 26, 244, 1.2, 'w');

  // ---- crew: sailors in hats on the waist and aloft by the tops, the boy drummers of the Kunchi on the poop
  for (const [x, y, col] of [[-30, 128, 0x3a5a9a], [28, 140, 0x8a2a2a], [-22, 196, 0x5a6a3a], [26, 190, 0x3a5a9a]]) {
    s.ellipse(cx + x, y + 3, 4, 3.4, 'W', { flat: 0.4 });
    s.dot(cx + x, y + 3, 3, col);
    s.ellipse(cx + x, y - 1, 3.4, 3, 'k', { flat: 0.4 });
  }
  for (const [x, y, col] of [[-20, 42, 0xe85a8a], [20, 44, 0xf0c040]]) {
    s.dot(cx + x, y + 3, 3, col);
    s.dot(cx + x, y - 1, 2.4, 0x2a1a14);
    s.ellipse(cx + x + (f ? 5 : -5), y + 3, 3, 3, 'r', { bias: 0.1 }); // the drum
  }
  return s.render();
}

/** One of its broadside batteries (9 x 26 -> 27 x 78): a length of black bulwark, three guns run out, firing (1); burnt. */
export function orandaGun(f, burnt) {
  const s = new HiSprite(27, 78, RAMPS);
  s.poly([[5, 2], [22, 2], [22, 76], [5, 76]], 'k', { flat: burnt ? 0.25 : 0.5, ...timber(71) });
  if (burnt) {
    s.shade([0, 0, 27, 78], () => true, -0.1);
    for (const [x, y] of [[10, 12], [16, 33], [9, 51], [17, 63]]) {
      s.dot(x, y, 1.8, 0xe86a2a);
      s.dot(x, y - 2, 1, 0xffb050);
    }
    for (let y = 6; y < 74; y += 9) s.line(6, y, 21, y + 4, 0x3a3034, 1);
    return s.render();
  }
  for (let y = 3; y < 76; y++) {
    s.px(19, y, 0xc89a48);
    s.px(20, y, 0x8a6a2a);
  }
  for (let y = 12; y < 72; y += 22) {
    s.poly([[8, y - 5], [18, y - 5], [18, y + 5], [8, y + 5]], 'r', { flat: 0.4 }); // the port lid, raised
    s.tube(2, y, 13, y, 3, 'i', { rb: 2.4 });
    s.ellipse(2, y, 2.8, 2.8, 'i', { bias: 0.1 });
    s.dot(1.5, y, 1.2, f ? 0xfff0c0 : INK);
    if (f) {
      s.dot(0.5, y, 2.6, 0xffe090, 0.8);
      for (let k = 0; k < 4; k++) s.px(-0.5, y - 3 + k * 2, 0xe8e4e0, 0.6);
    }
  }
  return s.render();
}
