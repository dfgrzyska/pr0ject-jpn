import { Raster, rng, mix } from '../../lib/raster.mjs';
import { polygon, masonry, glow } from './paint.mjs';
import { palmPixels } from '../nature.mjs';

// Architectural detail pass. Every landmark has its own silhouette and materials;
// these are baked into the scroll strip, while the small moving parts use PropKit.
export function enrichLandmarks(img, kit) {
  const R = rng(89327), Y = u => 7168 - u;
  const line = (x, u, xx, uu, c, a = 1) => img.line(x, Y(u), xx, Y(uu), c, a);
  const rect = (x, u, w, h, c, a = 1) => img.rect(x, Y(u), w, h, c, a);
  const poly = (p, c) => polygon(img, p.map(([x, u]) => [x, Y(u)]), c);
  const lamp = (x, u, c = 0xffd18e) => { glow(img, x, Y(u), 8, c, .4); rect(x, u, 1, 2, c); };
  function rail(x, u, w, color = 0xc8c5b6) {
    line(x, u, x + w, u, color); line(x, u - 4, x + w, u - 4, 0x48545a);
    for (let k = 0; k <= w; k += 4) rect(x + k, u + 1, 1, 6, color);
  }
  function window(x, u, w = 4, h = 7, c = 0xefc78c) {
    rect(x - 1, u + 1, w + 2, h + 2, 0x18303d); rect(x, u, w, h, c);
    rect(x + Math.floor(w / 2), u, 1, h, 0x49616a); rect(x, u - Math.floor(h / 2), w, 1, 0x49616a);
    line(x - 1, u - h - 1, x + w, u - h - 1, 0xe2d2b7);
  }
  function roof(x, u, w, h, c = 0x385e65) {
    poly([[x + 5, u], [x + w - 5, u], [x + w + 3, u - h], [x - 3, u - h]], 0x172c38);
    poly([[x + 6, u + 1], [x + w - 6, u + 1], [x + w + 1, u - h + 2], [x - 1, u - h + 2]], c);
    for (let y = 3; y < h - 1; y += 3) for (let xx = 1; xx < w; xx += 3) rect(x + xx, u - y, 2, 1, mix(c, 0xc4d0bf, .34));
    line(x + 5, u + 1, x + w - 5, u + 1, 0xabc0ac);
    line(x + 5, u, x, u - h + 2, 0x7e9a91); line(x + w - 5, u, x + w, u - h + 2, 0x7e9a91);
    line(x - 3, u - h, x + w + 3, u - h, 0xb4b9a4);
  }
  // Hashima: salt-stained seawall blocks, fractured concrete and colliery machinery.
  for (let u = 405; u < 788; u += 8) {
    masonry(img, 24, Y(u), 5, 7, 0xa6aa98, u, 4);
    masonry(img, 147, Y(u), 5, 7, 0xa6aa98, u + 2, 4);
    for (let k = 0; k < 3; k++) { const x = R.int(106, 143); rect(x, u + R.int(-3, 3), R.int(1, 4), 1, R.pick([0xb3b4a1, 0x56655d, 0x807a68])); }
  }
  for (const [x, u] of [[36, 478], [66, 529], [36, 625], [67, 679], [35, 771]]) {
    rect(x, u, 12, 13, 0x33413c);
    for (let j = 0; j < 4; j++) { rect(x + j * 3, u + 1, 2, 14, 0x9b9e8a); rect(x - 1, u - j * 4, 14, 1, 0x7b8a7c); }
    line(x, u, x + 13, u - 11, 0x453d33);
  }
  // Rusted mine supports, vertical ladders, conveyor housings and abandoned tanks.
  for (const [x, u] of [[111, 574], [133, 607]]) {
    rect(x, u, 3, 50, 0x806b51); line(x + 3, u, x + 3, u - 50, 0xc0a884);
    for (let j = 0; j < 49; j += 6) line(x - 2, u - j, x + 5, u - j - 5, 0x948773);
  }
  for (const u of [445, 471, 657, 689]) {
    img.ellipse(126, Y(u), 8, 4, 0x87938b); rect(118, u, 16, 7, 0x53635e);
    img.ellipse(126, Y(u + 1), 8, 4, 0x9da797); img.ellipse(126, Y(u + 2), 5, 2, 0x44544e);
    line(126, u - 7, 141, u - 7, 0x9c967e);
  }
  // School windows, parapet and gymnasium annex remain distinct from the apartments.
  for (let row = 0; row < 5; row++) for (let x = 105; x < 137; x += 4) {
    rect(x, 773 - row * 3, 2, 2, row % 2 ? 0x263638 : 0x314747);
    rect(x, 771 - row * 3, 3, 1, 0xb2b59d);
  }
  rail(103, 795, 37, 0xb0b6a2);
  // Northern schoolyard, retaining steps and the broken edges of reclaimed ground.
  rect(101, 837, 34, 31, 0x7e897b);
  rail(101, 838, 34, 0x909d8b);
  for (let k = 0; k < 7; k++) line(84, 832 - k * 3, 98, 832 - k * 3, 0xa3a995);
  for (let k = 0; k < 90; k++) { const x = R.int(44, 130), u = R.int(805, 839); rect(x, u, R.int(1, 3), 1, R.pick([0xa4a28b, 0x697767, 0x454e46])); }
  // Glover's Western homes: hipped tiled roof, chimneys, glazed veranda, balustrade.
  for (const [x, u, w] of [[15, 1910, 53], [110, 1860, 50], [15, 2100, 48]]) {
    rect(x - 4, u - 26, w + 9, 30, 0x293c40);
    masonry(img, x - 4, Y(u - 45), w + 9, 13, 0x9b9d87, u, 5);
    rect(x, u - 23, w, 23, 0xd4cbb0); roof(x - 1, u + 4, w + 2, 30, 0x3b6864);
    rect(x + 8, u + 10, 5, 13, 0x816d5b); rect(x + 7, u + 11, 7, 2, 0xc0a78b);
    for (let xx = x + 4; xx < x + w - 4; xx += 9) window(xx, u - 28, 5, 10, 0x95b5b1);
    for (let xx = x; xx <= x + w; xx += 7) { rect(xx, u - 26, 2, 22, 0xf4e6c5); rect(xx - 1, u - 26, 4, 2, 0xeee2c6); }
    rail(x - 3, u - 44, w + 6, 0xe4d6b7);
    for (let k = 0; k < 5; k++) rect(x + w / 2 - 8 - k, u - 50 - k * 2, 17 + k * 2, 1, 0xc5b99f);
    for (const xx of [x + 2, x + w - 3]) { img.disc(xx, Y(u - 57), 4, 0x345645); img.disc(xx - 1, Y(u - 57), 2, 0xc7909e); }
  }
  // Garden paving, planted beds, benches and low retaining walls along the hillside.
  for (let u = 1780; u < 2460; u += 42) {
    for (let x = 5; x < 174; x += 6) if (x < 73 || x > 100) rect(x, u + 7, 4, 2, 0x8e9180, .6);
    for (const x of [71, 102]) { rect(x, u - 5, 5, 2, 0xa78b63); rect(x, u - 8, 1, 3, 0x3c4a43); rect(x + 4, u - 8, 1, 3, 0x3c4a43); }
  }
  // Curved garden walks and densely planted terraces replace the empty lawn strips.
  for (const [x, u, w, h] of [[109, 2115, 60, 162], [12, 2440, 55, 250], [12, 2030, 55, 70]]) {
    for (let yy = 0; yy < h; yy++) {
      const bend = Math.round(Math.sin(yy * .035) * 8), cx = x + w / 2 + bend;
      rect(cx - 4, u - yy, 8, 1, 0xb4ad8d); rect(cx - 5, u - yy, 1, 1, 0x7f8a70);
      if (yy % 18 === 0) for (const side of [-1, 1]) {
        const xx = cx + side * 15;
        img.ellipse(xx, Y(u - yy), 8, 5, 0x304d35);
        for (let k = 0; k < 11; k++) rect(xx + R.int(-6, 6), u - yy + R.int(-3, 3), 1, 1, R.pick([0xbe7290, 0xe3b0b0, 0xd2bc6f, 0x90ab64]));
      }
      if (yy % 43 === 0) { rail(cx - 10, u - yy, 20, 0xc9bda0); lamp(cx + 8, u - yy); }
    }
  }
  // Ornamental pond with stone edge, lilies and a tiny curved garden bridge.
  img.ellipse(138, Y(2035), 24, 30, 0xb0b096); img.ellipse(138, Y(2036), 21, 26, 0x264c50);
  for (let k = 0; k < 50; k++) { const x = R.int(120, 155), u = R.int(2015, 2058); if ((x - 138) ** 2 / 400 + (u - 2036) ** 2 / 576 < 1) rect(x, u, 2, 1, R.pick([0x447979, 0x659384, 0x738f67])); }
  for (let k = 0; k < 7; k++) { const x = 124 + k * 4, u = 2039 + Math.round(Math.sin(k / 6 * Math.PI) * 5); rect(x, u, 4, 8, 0xb69b72); line(x, u + 2, x + 3, u + 2, 0xe2c395); }
  // Distinct wings and gables distinguish the main Glover house from the other residences.
  rect(9, 1885, 18, 17, 0xded5b9); roof(5, 1913, 24, 28, 0x3b6864);
  rect(57, 1885, 18, 17, 0xded5b9); roof(55, 1913, 24, 28, 0x3b6864);
  window(13, 1881, 7, 9, 0xa0bab4); window(61, 1881, 7, 9, 0xa0bab4);
  poly([[29, 1876], [41, 1888], [54, 1876]], 0x3f6d65); line(29, 1876, 41, 1888, 0xb4c6ab);
  // Oura Cathedral: Gothic nave, side buttresses, pointed stained-glass windows,
  // slate-green spire, rose window and the central entrance gable.
  masonry(img, 98, Y(2350), 68, 139, 0x8a8f7e, 2300, 7);
  rect(103, 2324, 56, 87, 0xd6d7c1); rect(106, 2322, 50, 79, 0xf1ead0);
  roof(103, 2330, 56, 62, 0x3f7270);
  poly([[106, 2266], [130, 2292], [156, 2266]], 0xf4eed5);
  poly([[110, 2267], [130, 2287], [152, 2267]], 0x90a69b);
  poly([[113, 2267], [130, 2283], [149, 2267]], 0xdce1c9);
  rect(112, 2267, 38, 32, 0xe6e2c9);
  for (const x of [106, 118, 142, 154]) { rect(x, 2276, 3, 41, 0xc0cbb8); rect(x - 1, 2237, 5, 3, 0xf2e7cb); }
  for (const x of [114, 144]) {
    poly([[x, 2259], [x + 2, 2264], [x + 5, 2259], [x + 5, 2247], [x, 2247]], 0x344c5e);
    rect(x + 1, 2258, 3, 9, 0xb5cbb6); rect(x + 2, 2260, 1, 12, 0xe1bd91);
  }
  img.disc(131, Y(2271), 6, 0xb4c2b3); img.disc(131, Y(2271), 4, 0x385a70);
  for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; line(131, 2271, 131 + Math.cos(a) * 4, 2271 + Math.sin(a) * 4, 0xced7be); }
  rect(126, 2254, 11, 20, 0x7b8170); poly([[126, 2253], [131, 2260], [136, 2253]], 0x6b7d70);
  rect(128, 2252, 7, 17, 0x3c4e4a); line(131, 2251, 131, 2235, 0x9aab91);
  rect(126, 2328, 10, 48, 0xe3e4cb); rect(128, 2323, 6, 14, 0x365363);
  poly([[124, 2327], [131, 2353], [138, 2327]], 0x436f70); line(131, 2354, 131, 2367, 0xf5e6be); line(127, 2363, 135, 2363, 0xf5e6be);
  for (let k = 0; k < 7; k++) rect(119 - k, 2234 - k * 2, 25 + k * 2, 1, 0xe0d8bc);
  for (const [x, u] of [[107, 2220], [155, 2213]]) {
    rect(x, u + 20, 2, 24, 0x8c8262);
    for (const p of palmPixels(x, Y(u + 22), 9, rng(x * 61))) img.set(p.x, p.y, mix(p.c, 0x213b3d, .25));
  }
  // Three pointed entrance bays, a tall centre lancet and matching side windows.
  for (const [x, top, h] of [[114, 2250, 16], [128, 2257, 23], [143, 2250, 16]]) {
    poly([[x, top], [x + 3, top + 6], [x + 6, top], [x + 6, top - h], [x, top - h]], 0x344b57);
    line(x + 3, top + 3, x + 3, top - h, 0x728b8c);
    for (let j = 3; j < h; j += 4) line(x + 1, top - j, x + 5, top - j, 0x8e9a8e);
  }
  // Dejima trading post: windows, timber framing, stores, cargo barrels and stone canal.
  for (const x of [25, 51, 77, 103, 129]) {
    const bend = Math.round(18 * (1 - ((x + 12 - 90) / 70) ** 2));
    for (const u of [2815 + bend, 2770 + bend]) {
      for (let xx = x + 2; xx < x + 21; xx += 6) { window(xx, u - 22, 3, 4, 0xc7d3b3); rect(xx - 1, u - 20, 1, 9, 0x594b3d); }
      rail(x, u - 28, 23, 0x908369);
      for (let k = 0; k < 3; k++) { rect(x + 2 + k * 5, u - 34, 4, 4, 0x9c8056); rect(x + 2 + k * 5, u - 35, 4, 1, 0x493f34); }
    }
  }
  rail(83, 2905, 14); for (let u = 2860; u < 2918; u += 4) line(85, u, 94, u, 0x918774);
  // Chinatown: illuminated restaurants, awnings, signboards, pottery and street tables.
  for (const x of [9, 117]) masonry(img, x, Y(3599), 55, 468, 0x625e59, x, 5);
  for (let u = 3150, row = 0; u < 3590; u += 43, row++) for (const side of [0, 1]) {
    const x = side ? 118 : 12, c = [0xefb35f, 0xe88f87, 0x91c8b4][row % 3];
    const styles = (row + side) % 3;
    const widths = styles === 0 ? [19, 25] : styles === 1 ? [27, 17] : [13, 15, 13];
    let off = 0;
    for (let shop = 0; shop < widths.length; shop++) {
      const w = widths[shop], xx = x + off, top = u + 5 - shop * 2;
      const wall = [0x806758, 0x8c826f, 0x73535a, 0x576d72][(row + shop + side) % 4];
      rect(xx + 2, top - 4, w, 36, 0x1e3037, .6); rect(xx, top, w, 34, wall);
      if ((row + shop) % 3) roof(xx, top + 3, w, 14, [0x795244, 0x4f6e65, 0x4e5c67][(row + side) % 3]);
      else {
        rect(xx, top, w, 9, 0x67797b); rect(xx + 2, top - 2, 5, 4, 0xa6afa1);
        line(xx, top + 1, xx + w, top + 1, 0x9da89a);
      }
      for (let k = 2; k < w - 3; k += 6) { window(xx + k, top - 14, 3, 5, c); window(xx + k, top - 25, 3, 7, mix(c, 0xffe2a2, .3)); }
      rect(xx - 1, top - 21, w + 2, 3, 0x8f3838);
      for (let k = 0; k < w; k += 5) rect(xx + k, top - 21, 2, 3, 0xcbab74);
      rail(xx, top - 20, w, 0x938c78);
      if ((row + shop) % 2 === 0) { rect(xx + w - 5, top - 4, 4, 5, 0xa5a58d); line(xx + w - 4, top - 5, xx + w - 4, top - 7, 0x50656a); }
      off += w + 3;
    }
    const signX = side ? x - 5 : x + 47;
    rect(signX, u + 2, 6, 19, 0x3a2c38); rect(signX + 1, u + 1, 4, 17, c);
    for (let k = 0; k < 3; k++) { rect(signX + 2, u - k * 5, 2, 1, 0x553e36); rect(signX + 3, u - k * 5 - 1, 1, 3, 0x553e36); }
    lamp(signX + 2, u - 9, c);
    const xx = side ? 112 : 66; rect(xx, u - 29, 7, 5, 0x705743); rect(xx, u - 29, 7, 1, 0xc89960);
    for (let k = 0; k < 3; k++) img.disc(xx + 1 + k * 2, Y(u - 30), 1, 0xebd3a0);
  }
  for (const u of [3130, 3610]) {
    roof(54, u + 15, 72, 15, 0x315f59); roof(68, u + 28, 44, 14, 0x376e62);
    rect(77, u - 3, 27, 10, 0x273b4c); rail(78, u - 5, 24, 0xcbaa64);
    for (const x of [62, 112]) { rect(x - 1, u - 28, 7, 5, 0x9c8c70); lamp(x + 2, u - 10, 0xffa258); }
  }
  // River embankments and voussoirs make the two stone arches read as masonry.
  for (const x of [57, 120]) masonry(img, x, Y(4120), 4, 470, 0x6d7d7e, x, 6);
  for (const cx of [72, 107]) for (let k = 0; k <= 12; k++) {
    const a = Math.PI + k * Math.PI / 12;
    img.line(cx + Math.cos(a) * 13, Y(3896) + Math.sin(a) * 10, cx + Math.cos(a) * 17, Y(3896) + Math.sin(a) * 14, 0x737d79);
  }
  rail(54, 3918, 74, 0xd9d1b8);
  for (let u = 3670; u < 4090; u += 9) for (let k = 0; k < 3; k++) { const x = R.int(65, 115); rect(x, u, R.int(2, 7), 1, R.pick([0x40727c, 0x2c5666, 0x629096]), .35); }
  // Suwa hall: layered roof, chigi-like ridge finials, posts and a lit offertory porch.
  rect(57, 4481, 67, 36, 0x826751); roof(52, 4520, 77, 39, 0x355e5a);
  roof(62, 4486, 57, 16, 0x426a61); rect(77, 4470, 27, 22, 0x463d34);
  for (const x of [60, 72, 107, 119]) { rect(x, 4480, 3, 31, 0xb3a181); rect(x - 1, 4481, 5, 3, 0xe2caa0); }
  for (const x of [81, 89, 97]) window(x, 4468, 4, 13, 0xe8b979);
  rail(54, 4449, 75, 0xc7b48b); for (let k = 0; k < 5; k++) rect(71 - k, 4445 - k * 2, 39 + k * 2, 1, 0xa8a58c);
  for (const u of [4260, 4390]) { poly([[54, u + 4], [89, u + 2], [126, u + 4], [123, u + 8], [89, u + 5], [57, u + 8]], 0xd4c7a8); rect(86, u, 8, 11, 0x918e7d); }
  for (let u = 4220; u < 4440; u += 35) for (const x of [55, 123]) {
    rect(x, u, 3, 11, 0x8c968a); roof(x - 3, u + 7, 9, 5, 0x6c827b); rect(x - 1, u + 2, 5, 5, 0x3c5856); lamp(x + 1, u, 0xe1c697);
  }
  // Memorial plaza: paving, formal flower beds, fence rhythm and bronze modelling.
  for (let u = 4740; u < 5150; u += 8) for (let x = 54; x < 128; x += 8) {
    if (Math.abs(u - 4860) < 30) continue;
    rect(x, u, 7, 1, 0x9d9c89, .55); rect(x, u, 1, 7, 0x858d7d, .35);
  }
  for (const x of [31, 140]) for (let u = 4770; u < 5130; u += 45) {
    rect(x, u, 9, 23, 0x344d3f);
    for (let k = 0; k < 20; k++) rect(x + R.int(1, 7), u - R.int(1, 20), 1, 1, R.pick([0xb4bda0, 0xcdafa0, 0x849c6c]));
  }
  masonry(img, 64, Y(5164), 53, 25, 0x8e9689, 5, 8);
  for (let k = 0; k < 3; k++) rect(59 - k * 3, 5139 - k * 3, 63 + k * 6, 2, 0xb5b4a0);
  for (const x of [55, 119]) { rect(x, 5152, 8, 6, 0x506c59); for (let k = 0; k < 12; k++) rect(x + R.int(0, 7), 5157 - R.int(0, 7), 1, 1, R.pick([0xe3d9bf, 0xd1b4b0, 0x9fb797])); }
  // Sculpted torso, folded leg and contrasting bronze light/shadow planes.
  poly([[85, 5197], [89, 5199], [96, 5197], [99, 5184], [94, 5177], [83, 5179], [82, 5189]], 0x4e9d93);
  poly([[85, 5196], [89, 5197], [88, 5186], [84, 5180], [82, 5188]], 0x87bbae);
  poly([[94, 5195], [97, 5190], [98, 5182], [93, 5178], [92, 5188]], 0x36786f);
  line(87, 5187, 94, 5187, 0x32776f); line(89, 5195, 90, 5183, 0xafe0c1);
  poly([[82, 5180], [94, 5179], [101, 5175], [100, 5170], [88, 5172], [77, 5169], [74, 5173]], 0x69aa97);
  line(78, 5175, 90, 5175, 0x9ac9af); line(96, 5176, 98, 5166, 0x357a71);
  img.disc(90, Y(5202), 5, 0x4f998f); img.ellipse(89, Y(5202), 3, 4, 0x88bba7);
  line(86, 5202, 88, 5202, 0x315f5d); line(91, 5202, 93, 5202, 0x315f5d); line(90, 5201, 89, 5199, 0xb1cfb4);
  line(98, 5195, 117, 5195, 0x9ac8af); line(98, 5192, 117, 5192, 0x3d857a);
  line(77, 5220, 77, 5199, 0x9acbb3); line(79, 5218, 79, 5200, 0x397b74);
  // Port containers, bollards, rail tracks and service roads.
  for (let u = 5410; u < 5950; u += 72) {
    rail(136, u + 10, 40, 0x748d98);
    for (let k = 0; k < 3; k++) {
      const c = [0x91584a, 0x4d7881, 0x887e51][k]; rect(148, u - 39 - k * 7, 23, 5, c);
      for (let xx = 150; xx < 171; xx += 3) rect(xx, u - 39 - k * 7, 1, 5, mix(c, 0xe1d4af, .24));
    }
    line(139, u - 10, 139, u - 60, 0x9a9c8b); line(142, u - 10, 142, u - 60, 0x586b70);
    lamp(134, u + 13, 0x9fd6de); rect(132, u - 8, 3, 3, 0xc1b78c);
  }
  // Fine texture across the remaining flat paving without painting over architecture.
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    if (!img.alpha(x, y)) continue;
    const c = img.get(x, y);
    if (img.get(x - 1, y) === c && img.get(x + 1, y) === c && img.get(x, y - 1) === c && R() < .12) img.tint(x, y, .93);
  }
  addLife(img, kit, R, Y);
}

function addLife(img, kit, R, Y) {
  // Two-way street traffic, walking visitors and small boats share pre-rendered frames.
  const carFrames = [0xd4c9a9, 0x537e99, 0x9c514d].map(c => {
    const r = new Raster(5, 10); r.rect(0, 1, 5, 8, 0x142737); r.rect(1, 0, 3, 10, c); r.rect(1, 2, 3, 2, 0x96b7bc); r.rect(1, 6, 3, 2, 0x314e61); r.set(0, 0, 0xffe3a0); r.set(4, 0, 0xffe3a0); return kit.frame(r);
  });
  for (const [i, [x, a, b]] of [[47, 3680, 4090], [134, 4090, 3680], [175, 5390, 5940]].entries()) kit.path([[x, a], [x, b]], [carFrames[i]], { n: 2, sp: 17, gap: 100, mode: 'wrap', turn: 'none' });
  const people = [0, 1].map(f => {
    const r = new Raster(3, 6); r.set(1, 0, 0xdac2a0); r.rect(0, 1, 3, 3, 0x9b8791); r.set(f, 4, 0x273e4d); r.set(2 - f, 5, 0x273e4d); return kit.frame(r);
  });
  for (const [x, a, b] of [[78, 1780, 2160], [100, 3170, 3560], [72, 3560, 3170], [52, 4750, 5090], [128, 5090, 4750]]) kit.path([[x, a], [x, b]], people, { n: 3, sp: 3, gap: 37, mode: 'pp', fps: 3, turn: 'none' });
  // Warm signs change their illumination gently, with matching puddle reflections.
  const sign = [0, 1, 2].map(f => {
    const r = new Raster(7, 23); glow(r, 3, 9, 4, 0xffbc67, .3); r.rect(2, 1, 3, 16, [0xe6a35f, 0xffcf7f, 0xeab87b][f]);
    for (let k = 0; k < 3; k++) { r.set(3, 3 + k * 5, 0x573c37); r.set(2, 4 + k * 5, 0x573c37); } r.rect(2, 20, 3, 1, 0xc29659, .3); return kit.frame(r);
  });
  for (let u = 3170; u < 3580; u += 86) kit.loop(u % 3 ? 109 : 59, u, sign, { fps: .8, fx: 1 });
  // Ripple glints and fountain spray are grouped into frames, not individual particles.
  const ripples = [0, 1, 2, 3].map(f => {
    const r = new Raster(50, 70);
    for (let k = 0; k < 26; k++) { const x = (k * 17 + f * 2) % 48, y = (k * 29 + f) % 68; r.rect(x, y, 2 + k % 4, 1, 0x91b8ba, .15 + (k % 3) * .1); }
    return kit.frame(r);
  });
  for (const u of [3750, 3870, 4050]) kit.loop(66, u, ripples, { fps: 3, fx: 1 });
  const wake = [0, 1, 2].map(f => {
    const r = new Raster(13, 31); r.line(6, 1, f, 30, 0xc6e1da, .3); r.line(6, 1, 12 - f, 30, 0xc6e1da, .3); return kit.frame(r);
  });
  kit.path([[164, 390], [160, 790], [151, 1140]], wake, { sp: 9, mode: 'pp', hold: 5, fps: 3, turn: 'none', s0: .9, d: .05 });
  // Working harbour hoists: cable pays out, a suspended crate rises and falls slowly.
  const hoist = Array.from({ length: 6 }, (_, f) => {
    const r = new Raster(12, 35), y = 12 + Math.round(Math.sin(f / 6 * Math.PI * 2) * 8);
    r.line(6, 0, 6, y, 0xc0c1a8); r.line(6, y, 3, y + 3, 0x8c9d97); r.line(6, y, 9, y + 3, 0x8c9d97);
    r.rect(1, y + 3, 10, 6, 0x896653); r.line(1, y + 3, 10, y + 3, 0xc49a65);
    for (let x = 2; x < 11; x += 3) r.line(x, y + 4, x, y + 8, 0xae845f);
    return kit.frame(r);
  });
  for (const u of [5487, 5703, 5919]) kit.loop(113, u, hoist, { fps: 1.2, fx: 0 });
  // Restaurant steam is a short looping sprite; no unbounded emission or new textures.
  const steam = Array.from({ length: 4 }, (_, f) => {
    const r = new Raster(12, 19);
    for (let k = 0; k < 4; k++) r.ellipse(5 + Math.sin(k + f) * 2, 16 - k * 4 - f, 2 + k, 2, 0xdacdb5, .14 - k * .025);
    return kit.frame(r);
  });
  for (const u of [3210, 3382, 3511]) kit.loop(65, u, steam, { fps: 3, fx: 1 });
}
