// The local dishes drawn at 540 px (60 x 60 fine pixels, shown at a third), each served its own way so that no two
// read alike at a glance: their own vessel (a lacquer tray, a bamboo leaf, an Okinawan pottery bowl, a paper bag,
// a raimon bowl, a skewer, a glass cup, a fune boat, a bamboo zaru, a jar, a hot iron plate, a board...), their
// own colours, their own shape. The old 20 px sprites are these, area-filtered down (foods.mjs).
import { HiSprite, tones, speckle, mottle, mix2, crackle } from '../lib/hisprite.mjs';

const TAU = Math.PI * 2;
const RAMPS = {
  bl: tones([0x245a24, 0x4a9a3a, 0x9ad070]), // bamboo leaf
  mg: tones([0x5a8a44, 0x9cc87e, 0xdcf0c4]), // matcha mochi
  mp: tones([0xb06a7c, 0xeeaabc, 0xffe2ea]), // sakura mochi
  mw: tones([0xb4ac9c, 0xeee8d6, 0xffffff]), // plain mochi, rice, sponge
  an: tones([0x24090c, 0x461a1c, 0x7a3434]), // red bean paste
  ab: tones([0x7a420e, 0xc4842e, 0xf0be5a]), // fried tofu
  yb: tones([0x16345e, 0x3466aa, 0x8ab8e8]), // blue-glazed pottery
  gg: tones([0x23501a, 0x46962a, 0x9ad860]), // goya
  eg: tones([0xc08a0c, 0xf2c634, 0xfff0a0]), // egg
  sp: tones([0xa84848, 0xde8a80, 0xffc4b4]), // spam, shrimp-pink
  ad: tones([0x6a2e08, 0xb86016, 0xeea040]), // andagi crust
  ai: tones([0xc08a3a, 0xf2d07c, 0xfff2c4]), // its cracked-open crumb
  ms: tones([0x86400e, 0xc6782a, 0xf0b25e]), // miso broth
  nd: tones([0xbe9a2c, 0xeed060, 0xfff4b0]), // noodles
  cy: tones([0xa8800c, 0xeec624, 0xfff08c]), // corn
  ch: tones([0x2e1406, 0x5e2c0e, 0x945220]), // char, soy glaze
  ic: tones([0xa8c0dc, 0xe6f2ff, 0xffffff]), // shaved ice
  gl: tones([0x5a8aaa, 0xa4d0ea, 0xeef8ff]), // glass
  kc: tones([0x7e460e, 0xcc8a38, 0xf6cc7a]), // panko crust
  tk: tones([0x6e360c, 0xb87026, 0xe6a64c]), // takoyaki
  sc: tones([0x200c06, 0x42200e, 0x74381a]), // brown sauce
  tb: tones([0xa8743a, 0xe6be78, 0xfff0c8]), // tempura batter, fried golden
  zb: tones([0x8a6a2e, 0xc8a85a, 0xeedc9c]), // woven bamboo
  pd: tones([0xcc9c3c, 0xf6d676, 0xfff4c0]), // custard
  cm: tones([0x401606, 0x74300e, 0xac5c1e]), // caramel
  ok: tones([0x84480e, 0xc4823a, 0xeeb466]), // okonomiyaki
  ir: tones([0x18161c, 0x2e2c34, 0x55525e]), // the iron plate
  kb: tones([0xb87a6a, 0xeeb6a0, 0xffe2d4]), // bonito flakes
  mm: tones([0x86440e, 0xcc8434, 0xf6bc6a]), // baked manjū
  cs: tones([0xc28a1c, 0xf6cc4c, 0xfff0a0]), // castella sponge
  cc: tones([0x441c08, 0x763612, 0xa65a24]), // its crust
  cb: tones([0xc4bca4, 0xeeeadc, 0xfffff4]), // milky champon broth
  cg: tones([0x5e8e38, 0xa4cc6a, 0xdef2ac]), // cabbage
  wd: tones([0x6a4424, 0xa47448, 0xd8ac78]), // pale wood
};
const sprite = () => new HiSprite(60, 60, RAMPS);
const crumb = (seed) => mix2(speckle({ amt: 0.28, dark: 0.12, light: 0.1, seed }), mottle({ amt: 0.12, scale: 3, seed: seed + 1 }));

/** Kyoto: nama yatsuhashi, folded triangles in matcha, sakura and plain, red bean showing, on a black lacquer tray. */
function yatsuhashi() {
  const s = sprite();
  s.poly([[6, 40], [54, 40], [58, 50], [2, 50]], 'K', { flat: 0.5 });
  s.poly([[4, 38], [56, 38], [54, 41], [6, 41]], 'R', { flat: 0.6 });
  const tri = (cx, cy, mat, flip) => {
    const t = flip ? [[cx - 13, cy - 8], [cx + 13, cy - 8], [cx, cy + 10]] : [[cx - 13, cy + 8], [cx + 13, cy + 8], [cx, cy - 12]];
    s.poly(t, mat, { flat: 0.62, pat: mottle({ amt: 0.08, scale: 4 }) });
    s.line(t[0][0] + 3, t[0][1] + (flip ? 2 : -2), t[2][0], t[2][1] + (flip ? -3 : 3), 0x000000, 1, 0.18); // the fold
    s.dot(cx, cy + (flip ? -2 : 3), 2.8, 0x461a1c); // red bean in the fold
  };
  tri(17, 28, 'mg', false);
  tri(43, 28, 'mp', false);
  tri(30, 22, 'mw', true);
  for (let k = 0; k < 18; k++) s.dot(10 + ((k * 37) % 40), 14 + ((k * 23) % 22), 0.5, 0x8a5a2a, 0.7); // cinnamon dust
  return s;
}

/** Fushimi: inari-zushi, glossy fried-tofu pouches with the rice showing at the top, on a bamboo leaf, a fox's red. */
function inari() {
  const s = sprite();
  s.poly([[2, 44], [30, 32], [58, 40], [32, 54]], 'bl', { flat: 0.55 });
  s.line(4, 44, 56, 40, 0xc0e890, 1, 0.6);
  for (const [cx, cy] of [[20, 32], [40, 30]]) {
    s.ellipse(cx, cy, 10, 13, 'ab', { bias: 0.06, pat: crumb(cx) });
    s.ellipse(cx, cy - 10, 8, 4.5, 'mw', { flat: 0.75, pat: speckle({ amt: 0.25, seed: cx }) }); // the rice
    s.line(cx - 6, cy + 2, cx + 5, cy + 6, 0x7a420e, 1, 0.5);
    s.dot(cx - 4, cy - 2, 1.6, 0xfff0c0, 0.7); // its gloss
  }
  s.poly([[48, 8], [56, 10], [52, 16]], 'R', { flat: 0.6 }); // a little torii-red ribbon
  s.line(52, 16, 50, 22, 0xd2361f, 1);
  return s;
}

/** Okinawa: goya champuru in a blue yachimun bowl: green bitter-melon crescents, egg, tofu, pink spam. */
function goya() {
  const s = sprite();
  s.ellipse(30, 38, 27, 16, 'yb', { bias: 0.05 });
  s.paint([0, 22, 60, 56], (x, y) => Math.abs(((x - 30) / 27) ** 2 + ((y - 38) / 16) ** 2 - 0.55) < 0.06, 'mw', () => 0.7); // a white glaze band
  s.ellipse(30, 32, 23, 11, 'eg', { flat: 0.5, pat: mottle({ amt: 0.15, scale: 4 }) });
  for (const [x, y, a] of [[18, 30, 0.4], [30, 26, -0.3], [42, 31, 0.9], [24, 37, 2.2], [37, 36, 1.6]]) {
    s.paint([x - 8, y - 8, x + 8, y + 8], (px, py) => {
      const u = (px - x) * Math.cos(a) + (py - y) * Math.sin(a);
      const v = -(px - x) * Math.sin(a) + (py - y) * Math.cos(a);
      return Math.hypot(u, v) < 6 && Math.hypot(u, v - 3) > 4; // a crescent
    }, 'gg', () => 0.6, { pat: speckle({ amt: 0.3, seed: x }) });
  }
  for (const [x, y] of [[26, 31], [36, 29], [20, 35]]) s.poly([[x - 3, y - 3], [x + 3, y - 3], [x + 3, y + 3], [x - 3, y + 3]], 'mw', { flat: 0.78 });
  for (const [x, y] of [[33, 34], [16, 27], [41, 25]]) s.poly([[x - 3, y - 2], [x + 4, y - 2], [x + 4, y + 2], [x - 3, y + 2]], 'sp', { flat: 0.6 });
  return s;
}

/** Tsuboya: sata andagi, cracked open like a smile, spilling from a red-and-white striped paper bag. */
function andagi() {
  const s = sprite();
  s.poly([[24, 10], [54, 14], [56, 50], [28, 52]], 'W', { flat: 0.75 });
  for (let k = 0; k < 4; k++) s.poly([[28 + k * 7, 11], [32 + k * 7, 12], [34 + k * 7, 51], [30 + k * 7, 51]], 'R', { flat: 0.55 });
  for (const [cx, cy, r] of [[18, 42, 10], [33, 34, 11], [14, 26, 9]]) {
    s.ellipse(cx, cy, r, r * 0.92, 'ad', { bias: 0.08, pat: crumb(cx) });
    // the crack: the golden crumb bursting out of the dark crust
    s.paint([cx - r, cy - r, cx + r, cy + r], (x, y) => Math.abs(y - (cy - r * 0.25) - Math.sin((x - cx) * 0.5) * 1.5) < 2 && Math.abs(x - cx) < r * 0.75, 'ai', () => 0.7, { pat: speckle({ amt: 0.3, seed: cy }) });
  }
  return s;
}

/** Susukino: miso ramen in a red raimon bowl, butter melting on corn, chashu, naruto, chopsticks lifting noodles. */
function ramen() {
  const s = sprite();
  s.ellipse(30, 40, 28, 17, 'R', { bias: 0.05 });
  for (let k = 0; k < 14; k++) { // the raimon key pattern on the rim
    const a = (k / 14) * TAU;
    s.dot(30 + Math.cos(a) * 25.5, 40 + Math.sin(a) * 15.2, 1, 0xfff0d0, 0.8);
  }
  s.ellipse(30, 35, 24, 12, 'ms', { flat: 0.55, pat: mottle({ amt: 0.12, scale: 5 }) });
  for (let y = 30; y < 42; y += 2.6) s.line(10, y + 1, 48, y - 1, 0xfff0a0, 1, 0.75); // noodles under the broth
  for (const [x, y] of [[14, 30], [17, 33], [13, 35], [18, 29], [16, 37]]) s.dot(x, y, 2, 0xf6d030); // corn
  s.poly([[13, 24], [21, 24], [21, 30], [13, 30]], 'eg', { flat: 0.85 }); // butter
  s.ellipse(38, 33, 7, 5, 'ch', { flat: 0.55 }); s.ellipse(38, 32, 5, 3.5, 'sp', { flat: 0.5 }); // chashu
  s.ellipse(27, 39, 4.5, 3, 'mw', { flat: 0.85 }); s.line(25, 39, 29, 39, 0xe06070, 1); // naruto
  s.tube(36, 22, 56, 4, 1.2, 'wd'); s.tube(40, 23, 58, 8, 1.2, 'wd'); // chopsticks
  for (const x of [36, 38, 40]) s.line(x, 24, x + 2, 32, 0xfff0a0, 1);
  return s;
}

/** Odori: grilled corn on a stick, charred and glazed with soy, a twist of paper round the handle. */
function corn() {
  const s = sprite();
  s.tube(36, 8, 22, 48, 9.5, 'cy', { rb: 8 });
  for (let k = 0; k < 9; k++) for (let j = -2; j <= 2; j++) {
    const t = k / 8;
    const x = 36 + (22 - 36) * t + j * 3.4;
    const y = 8 + 40 * t + j * 1.2;
    s.dot(x, y, 1.2, 0xfff6b0, 0.55);
  }
  // the grill's char: dark bars across the cob, the soy glaze browning round them
  for (const t of [0.22, 0.48, 0.74]) {
    const x = 36 + (22 - 36) * t;
    const y = 8 + 40 * t;
    s.line(x - 8, y + 2, x + 8, y - 2, 0x945220, 3, 0.45);
    s.line(x - 7, y + 2, x + 7, y - 1.5, 0x3a1608, 1, 0.8);
  }
  s.tube(22, 48, 16, 58, 2.2, 'wd'); // the stick
  s.poly([[13, 46], [27, 48], [24, 56], [12, 54]], 'W', { flat: 0.78 });
  s.dot(40, 10, 1.6, 0xffffff, 0.8); // the glaze's shine
  return s;
}

/** Kagoshima: shirokuma, shaved ice in a glass cup made into a bear's face: raisin eyes, a cherry nose, fruit round it. */
function shirokuma() {
  const s = sprite();
  s.poly([[12, 40], [48, 40], [42, 56], [18, 56]], 'gl', { flat: 0.6 });
  s.line(16, 44, 44, 44, 0xffffff, 1, 0.5);
  s.ellipse(30, 28, 20, 16, 'ic', { bias: 0.08, pat: speckle({ amt: 0.2, light: 0.1, seed: 9 }) });
  s.ellipse(16, 15, 5, 5, 'ic', { bias: 0.08 }); s.ellipse(44, 15, 5, 5, 'ic', { bias: 0.08 }); // ears
  s.ellipse(30, 34, 8, 5, 'eg', { flat: 0.7 }); // the muzzle: a slice of mandarin
  s.dot(23, 26, 1.8, 0x2a1408); s.dot(37, 26, 1.8, 0x2a1408); // raisin eyes
  s.dot(30, 32, 2.4, 0xd02030); s.dot(29.4, 31.4, 0.8, 0xffffff); // the cherry nose
  for (const [x, y, c] of [[14, 30, 0x58b040], [46, 30, 0x58b040], [20, 40, 0xf06090], [40, 40, 0xf6c030], [30, 42, 0xf06090]]) s.dot(x, y, 2.2, c);
  s.line(14, 22, 46, 22, 0xfffaf0, 1, 0.4); // condensed milk
  return s;
}

/** Sengan-en: karukan, a block of white yam cake cut into slices on a green leaf, one manjū with a red mark. */
function karukan() {
  const s = sprite();
  s.ellipse(30, 42, 27, 12, 'bl', { flat: 0.5 });
  s.line(5, 42, 55, 42, 0xc0e890, 1, 0.5);
  for (let k = 0; k < 3; k++) {
    const x = 9 + k * 11;
    s.poly([[x, 22], [x + 10, 20], [x + 10, 40], [x, 42]], 'mw', { flat: 0.82 - k * 0.04, pat: speckle({ amt: 0.12, seed: k + 3 }) });
    s.poly([[x + 10, 20], [x + 12, 22], [x + 12, 41], [x + 10, 40]], 'mw', { flat: 0.55 });
  }
  s.ellipse(47, 34, 9, 7, 'mw', { bias: 0.1 }); // a karukan manjū
  s.dot(47, 32, 2.4, 0xd2361f); // its red mark
  return s;
}

/** Shinsekai: kushikatsu, panko-crusted skewers on a steel tray, the shared sauce pot, a leaf of cabbage. */
function kushi() {
  const s = sprite();
  s.poly([[4, 34], [56, 34], [58, 54], [2, 54]], 'S', { flat: 0.6 });
  s.poly([[6, 36], [54, 36], [55, 52], [5, 52]], 'S', { flat: 0.45 });
  s.ellipse(46, 44, 10, 7, 'cg', { flat: 0.6, pat: mottle({ amt: 0.2, scale: 3 }) }); // cabbage
  s.ellipse(14, 44, 9, 6, 'K', { flat: 0.4 }); s.ellipse(14, 43, 7, 4, 'sc', { flat: 0.5 }); // the sauce pot
  for (const [x0, y0, x1, y1, shape] of [[18, 8, 30, 46, 0], [30, 6, 38, 46, 1], [40, 8, 44, 44, 2]]) {
    s.tube(x0, y0, x1, y1, 0.9, 'wd');
    const at = (t) => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
    for (const t of [0.2, 0.5]) {
      const [x, y] = at(t);
      if (shape === 1) s.ellipse(x, y, 5, 5, 'kc', { bias: 0.06, pat: crumb(x) });
      else s.poly([[x - 5, y - 5], [x + 5, y - 5], [x + 5, y + 5], [x - 5, y + 5]], 'kc', { flat: 0.6, pat: crumb(y) });
    }
  }
  return s;
}

/** Dotonbori: takoyaki in a little wooden boat, brown sauce, a zigzag of mayonnaise, aonori, dancing bonito, a pick. */
function takoyaki() {
  const s = sprite();
  s.poly([[4, 30], [56, 30], [50, 52], [10, 52]], 'wd', { flat: 0.6 });
  s.poly([[6, 30], [54, 30], [53, 34], [7, 34]], 'wd', { flat: 0.8 });
  for (const [x, y] of [[16, 30], [30, 29], [44, 30], [22, 40], [37, 40]]) {
    s.ellipse(x, y, 7.5, 7, 'tk', { bias: 0.08, pat: crumb(x + y) });
    s.ellipse(x, y - 3, 6, 3.5, 'sc', { flat: 0.55 });
  }
  for (let x = 10; x < 50; x += 1) s.px(x, 27 + Math.round(Math.abs(((x * 0.5) % 4) - 2) * 2), 0xfffaf0); // mayonnaise
  for (let k = 0; k < 16; k++) s.dot(12 + ((k * 29) % 36), 24 + ((k * 17) % 16), 0.6, 0x3a8a2a); // aonori
  for (const [x, y] of [[20, 22], [34, 21], [40, 26], [26, 26]]) s.poly([[x, y], [x + 4, y - 2], [x + 5, y + 1], [x + 1, y + 2]], 'kb', { flat: 0.6 }); // bonito
  s.tube(46, 18, 56, 6, 0.9, 'wd'); // the pick
  return s;
}

/** Beppu: toriten, chicken tempura in pale crisp batter on a woven bamboo zaru, ponzu in a dish, a dab of mustard. */
function toriten() {
  const s = sprite();
  s.ellipse(28, 38, 26, 16, 'zb', { flat: 0.6, pat: (x, y) => (((Math.floor(x / 2) + Math.floor(y / 2)) % 2) ? 0.06 : -0.06) });
  for (const [x, y, a] of [[17, 32, 0.4], [30, 28, -0.3], [40, 36, 0.8], [24, 42, -0.6]]) {
    s.paint([x - 10, y - 8, x + 10, y + 8], (px, py) => {
      const u = (px - x) * Math.cos(a) + (py - y) * Math.sin(a);
      const v = -(px - x) * Math.sin(a) + (py - y) * Math.cos(a);
      return (u / 8.5) ** 2 + (v / 5.5) ** 2 + Math.sin(u * 1.3 + v) * 0.12 < 1; // lumpy batter
    }, 'tb', (px, py) => 0.62 - (px - x) * 0.01 - (py - y) * 0.02, { pat: crumb(x) });
  }
  s.ellipse(50, 18, 8, 6, 'W', { bias: 0.05 }); s.ellipse(50, 17, 6, 4, 'cm', { flat: 0.55 }); // the ponzu dish
  s.dot(44, 46, 2.2, 0xe8c020); // karashi
  return s;
}

/** Beppu: jigoku-mushi pudding in a glass jar, caramel on top, onsen steam rising off it. */
function pudding() {
  const s = sprite();
  s.poly([[16, 18], [44, 18], [46, 52], [14, 52]], 'gl', { flat: 0.55 });
  s.poly([[18, 26], [42, 26], [43, 50], [17, 50]], 'pd', { flat: 0.68, pat: mottle({ amt: 0.06, scale: 5 }) });
  s.poly([[18, 22], [42, 22], [42, 28], [18, 28]], 'cm', { flat: 0.55 });
  s.ellipse(30, 18, 15, 3.5, 'gl', { flat: 0.7 });
  s.line(20, 30, 20, 48, 0xffffff, 1, 0.5); // the glass's shine
  s.poly([[14, 52], [46, 52], [44, 55], [16, 55]], 'K', { flat: 0.5 });
  for (const [x, ph] of [[24, 0], [32, 1.4], [38, 2.6]]) // the steam
    for (let y = 2; y < 15; y++) s.px(x + Math.sin(y * 0.6 + ph) * 2, y, 0xffffff, 0.35 + (y / 15) * 0.3);
  return s;
}

/** Hiroshima: okonomiyaki on the black teppan, layered with noodles and cabbage, sauce, a mayo lattice, a spatula. */
function okonomiyaki() {
  const s = sprite();
  s.poly([[2, 26], [58, 26], [58, 56], [2, 56]], 'ir', { flat: 0.45, pat: speckle({ amt: 0.15, seed: 4 }) });
  s.ellipse(28, 38, 22, 13, 'nd', { flat: 0.6 }); // the noodle layer showing at the edge (the Hiroshima way)
  s.ellipse(28, 36, 21, 12, 'ok', { flat: 0.6, pat: crumb(5) });
  s.ellipse(28, 35, 18, 10, 'sc', { flat: 0.5 });
  for (let k = -3; k <= 3; k++) { // the mayonnaise lattice
    s.line(18 + k * 5, 27, 26 + k * 5, 43, 0xfffaf0, 1, 0.9);
    s.line(38 + k * 5, 27, 30 + k * 5, 43, 0xfffaf0, 1, 0.9);
  }
  for (let k = 0; k < 12; k++) s.dot(14 + ((k * 31) % 28), 29 + ((k * 13) % 12), 0.6, 0x3a8a2a);
  s.poly([[42, 12], [56, 8], [58, 14], [44, 18]], 'S', { flat: 0.7 }); // the spatula
  s.tube(56, 10, 58, 2, 1.2, 'wd');
  return s;
}

/** Miyajima: momiji manjū, two maple-leaf cakes baked golden, a red leaf on a white plate. */
function momiji() {
  const s = sprite();
  s.ellipse(30, 40, 27, 13, 'W', { bias: 0.04 });
  const leaf = (cx, cy, sc, mat, light) => s.paint([cx - 16 * sc, cy - 16 * sc, cx + 16 * sc, cy + 16 * sc], (x, y) => {
    const a = Math.atan2(y - cy, x - cx) + Math.PI / 2;
    const r = Math.hypot(x - cx, y - cy) / sc;
    const lobes = 9 + 5 * Math.abs(Math.cos(a * 2.5)); // five pointed lobes
    return r < lobes && !(y > cy + 2 * sc && Math.abs(x - cx) < 1.5 * sc && r > 9);
  }, mat, light, { pat: crumb(cx) });
  leaf(21, 33, 1, 'mm', (x, y) => 0.65 - (x - 21) * 0.008 - (y - 33) * 0.012);
  leaf(39, 36, 0.95, 'mm', (x, y) => 0.6 - (x - 39) * 0.008 - (y - 36) * 0.012);
  for (const [cx, cy] of [[21, 33], [39, 36]]) for (let k = 0; k < 5; k++) { // the pressed veins
    const a = -Math.PI / 2 + (k - 2) * 0.62;
    s.line(cx, cy + 2, cx + Math.cos(a) * 9, cy + 2 + Math.sin(a) * 9, 0x86440e, 1, 0.6);
  }
  s.dot(48, 16, 3.5, 0xd8301e); s.line(48, 19, 46, 24, 0x8a2010, 1); // a real red leaf
  return s;
}

/** Dejima: castella, slices of golden sponge with their dark crust and the paper under them, on a pale board. */
function castella() {
  const s = sprite();
  s.poly([[2, 38], [58, 32], [58, 48], [2, 54]], 'wd', { flat: 0.6, pat: mottle({ amt: 0.1, scale: 6 }) });
  for (let k = 0; k < 3; k++) {
    const x = 8 + k * 15;
    const y = 18 - k * 2;
    s.poly([[x, y + 4], [x + 13, y + 3], [x + 13, y + 26], [x, y + 27]], 'cs', { flat: 0.7, pat: speckle({ amt: 0.15, seed: k }) });
    s.poly([[x, y], [x + 13, y - 1], [x + 13, y + 4], [x, y + 5]], 'cc', { flat: 0.55 });
    s.poly([[x, y + 25], [x + 13, y + 24], [x + 13, y + 27], [x, y + 28]], 'W', { flat: 0.7 });
    for (let j = 0; j < 4; j++) s.dot(x + 2 + j * 3, y + 26, 0.7, 0xfffaf0); // the zarame sugar
  }
  return s;
}

/** Shinchi: champon in a blue-and-white bowl, milky broth, thick noodles, shrimp, squid, cabbage, kamaboko. */
function champon() {
  const s = sprite();
  s.ellipse(30, 40, 28, 17, 'mw', { bias: 0.05 });
  for (let k = 0; k < 10; k++) { // the blue painted rim
    const a = (k / 10) * TAU;
    s.dot(30 + Math.cos(a) * 25, 40 + Math.sin(a) * 15, 2, 0x3466aa, 0.85);
  }
  s.ellipse(30, 35, 24, 12, 'cb', { flat: 0.68 });
  for (let y = 30; y < 42; y += 3) s.line(10, y, 48, y + 1, 0xeed060, 2, 0.8); // thick noodles
  s.ellipse(22, 31, 9, 5, 'cg', { flat: 0.6, pat: mottle({ amt: 0.2, scale: 3 }) });
  for (const [x, y] of [[36, 30], [30, 36]]) { // shrimp, curled
    s.paint([x - 6, y - 6, x + 6, y + 6], (px, py) => Math.abs(Math.hypot(px - x, py - y) - 3.5) < 1.6 && py > y - 2, 'sp', () => 0.62);
  }
  s.poly([[40, 34], [47, 34], [47, 38], [40, 38]], 'mw', { flat: 0.85 }); // squid
  s.ellipse(18, 38, 3.5, 2.5, 'sp', { flat: 0.75 }); // pink kamaboko
  return s;
}

const DRAW = { yatsuhashi, inari, goya, andagi, ramen, corn, shirokuma, karukan, kushi, takoyaki, toriten, pudding, okonomiyaki, momiji, castella, champon };

/** The dish `id` at 540 px: a 60 x 60 Raster. */
export function food540(id) {
  return DRAW[id]().render({ outline: 2 });
}
