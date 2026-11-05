import { Raster, rng, fbm, mix, bayer } from '../../lib/raster.mjs';
import { PropKit } from '../props.mjs';
import { crownPixels } from '../nature.mjs';
import { polygon, masonry, glow as paintGlow } from './paint.mjs';
import { enrichLandmarks } from './landmarks.mjs';

export const W = 180, L = 7168;
const Y = (u) => L - u;

export function buildFar() {
  const r = new Raster(W, 384);
  for (let y = 0; y < r.h; y++) for (let x = 0; x < W; x++) {
    const v = fbm(x * 0.6, y, { seed: 81, scale: 16, periodY: 384 });
    r.set(x, y, mix(0x071c30, 0x275064, v));
    if ((x * 17 + y * 31) % 167 === 0) r.rect(x, y, 3, 1, 0x78969f, 0.45);
  }
  return r;
}

export function buildMid() {
  const img = new Raster(W, L), kit = new PropKit(808), rand = rng(808);
  const night = (u) => Math.max(0, Math.min(1, (u - 1100) / 4600));
  const color = (c, u) => mix(c, 0x121c2c, night(u) * 0.55);
  const rect = (x, u, w, h, c) => img.rect(x, Y(u), w, h, c);
  const line = (x, u, xx, uu, c) => img.line(x, Y(u), xx, Y(uu), c);
  function poly(points, c) {
    const min = Math.max(0, Math.floor(Math.min(...points.map((p) => p[1])))), max = Math.min(L, Math.ceil(Math.max(...points.map((p) => p[1]))));
    for (let u = min; u <= max; u++) for (let x = 0; x < W; x++) {
      let inside = false;
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const [a, b] = points[i], [c, d] = points[j];
        if ((b > u) !== (d > u) && x < (c - a) * (u - b) / (d - b) + a) inside = !inside;
      }
      if (inside) c === null ? img.clear(x, Y(u)) : img.set(x, Y(u), c);
    }
  }
  function tree(x, u, size = 5) {
    const seed = rand.int(1, 999999);
    const pixels = crownPixels(u > 6100 ? 'cedar' : 'broadleaf', Math.round(x), Y(u), size, rng(seed), seed);
    for (const p of pixels) img.tint(p.x + 3, p.y + 4, .58);
    for (const p of pixels) img.set(p.x, p.y, color(p.c, u));
  }
  function building(x, u, w, h, floors = 2, roof = 0x63667b, wall = 0xb0a69b, ruined = false) {
    const y = Y(u), rise = floors * 3;
    img.rect(x + 3, y + 3, w, h + rise, 0x07111c, 0.5);
    img.rect(x, y, w, h + rise, color(wall, u));
    img.rect(x, y, w, h, color(roof, u));
    img.rect(x + 1, y + 1, w - 2, h - 2, color(mix(roof, 0xc6c0ad, 0.2), u));
    // Concrete aggregate, roof expansion joints and sunken drainage channels.
    for (let yy = 2; yy < h - 1; yy++) for (let xx = 1; xx < w - 1; xx++) {
      if (rand() < .28) img.set(x + xx, y + yy, color(mix(roof, rand() < .5 ? 0xe0d7bc : 0x17232f, .15), u));
    }
    img.rect(x + w - 3, y + 2, 2, h + rise - 2, color(mix(wall, 0x12212c, .48), u));
    for (let yy = 6; yy < h - 2; yy += 9) img.line(x + 2, y + yy, x + w - 4, y + yy, color(mix(roof, 0x14202d, .25), u));
    for (let j = 1; j < floors + 1; j++) for (let xx = 2; xx < w - 2; xx += 4) {
      const c = ruined ? 0x17232b : rand() < 0.6 ? 0xffce8d : 0x344354;
      img.rect(x + xx, y + h + j * 3 - 3, 2, 2, c);
      img.set(x + xx, y + h + j * 3 - 1, color(mix(wall, 0xeee1bf, .3), u));
    }
    if (ruined) {
      for (let k = 0; k < w / 3; k++) img.set(x + rand.int(1, w - 2), y + rand.int(1, h - 2), 0x303a3b);
      img.line(x + w / 2, y, x + w / 2 - 3, y + h + rise, 0x2d3537);
      img.rect(x + 2, y + 2, Math.max(2, w - 5), 1, 0x969486);
      // Exposed beams, missing slabs, rust streaks and open stairwell on each ruin.
      for (let yy = 3; yy < h + rise; yy += 5) {
        img.line(x, y + yy, x + 2, y + yy + 3, 0x4e5b57);
        if (yy > h) img.line(x + 1, y + yy, x + w - 4, y + yy, 0x7c887d);
      }
      img.rect(x + w - 10, y + 5, 6, Math.max(4, h - 10), 0x24332f);
      for (let yy = 6; yy < h - 5; yy += 3) img.line(x + w - 10, y + yy, x + w - 5, y + yy + 1, 0x929789);
      for (let k = 0; k < 5; k++) { const xx = x + rand.int(2, w - 4), yy = y + rand.int(4, h + rise - 2); img.line(xx, yy, xx, yy + 3, 0x725c49); }
    } else {
      img.rect(x + 3, y + 3, 4, 3, color(0xb9b4a6, u));
      img.line(x, y, x + w, y, color(0xd3c3a8, u));
      img.rect(x + w - 10, y + 4, 5, 4, color(0x293d4e, u));
      img.line(x + w - 10, y + 4, x + w - 6, y + 4, color(0xb3c8c6, u));
      for (let xx = 4; xx < w - 5; xx += 9) { img.rect(x + xx, y + h + rise - 3, 3, 3, 0x263747); img.set(x + xx, y + h + rise - 3, 0xebca8f); }
    }
  }
  function tiled(x, u, w, h, red = false) {
    building(x, u, w, h, 2, red ? 0x784043 : 0x354653, red ? 0xa7483c : 0xc3bda7);
    const y = Y(u), base = red ? 0x6e3b39 : 0x334c5a;
    polygon(img, [[x + 3, y], [x + w - 3, y], [x + w + 3, y + h], [x - 3, y + h]], color(base, u));
    for (let yy = 2; yy < h; yy += 3) for (let xx = -1; xx < w + 2; xx += 3) {
      img.rect(x + xx, y + yy, 2, 1, color(red ? 0xa57150 : 0x6f8591, u));
      img.set(x + xx + 1, y + yy + 1, color(red ? 0x453238 : 0x243746, u));
    }
    img.line(x + 3, y, x + w / 2, y + h, color(red ? 0xc69462 : 0x9bb0b3, u));
    img.line(x + w - 3, y, x + w / 2, y + h, color(red ? 0xc69462 : 0x9bb0b3, u));
    img.line(x - 3, y + h, x + w + 3, y + h, color(0xb5b29e, u));
    rect(x + 2, u + 2, w - 4, 2, color(0x95785f, u));
  }
  function lamp(x, u, red = false) {
    paintGlow(img, x, Y(u), 7, red ? 0xff7838 : 0xffce86, .38);
    rect(x - 1, u + 1, 2, 3, red ? 0xf5934e : 0xffdc9b);
  }
  function path(x, u0, u1, width = 12) {
    rect(x, u1, width, u1 - u0, color(0x74727a, (u0 + u1) / 2));
    line(x, u0, x, u1, color(0xb3a691, u1)); line(x + width, u0, x + width, u1, color(0xb3a691, u1));
    for (let u = u0 + 12; u < u1; u += 28) { rect(x + width / 2, u, 1, 8, 0xd4c4a0); lamp(x - 2, u); }
  }
  // Mainland hills and neighbourhoods. Sea remains transparent over the moving far layer.
  for (let u = 1650; u < L; u++) for (let x = 0; x < W; x++) {
    const v = fbm(x, u, { seed: 83, scale: 20, octaves: 2 });
    const fine = fbm(x, u, { seed: 184, scale: 3, octaves: 2 });
    const levels = [0x354e38, 0x486242, 0x60764c, 0x7a8859];
    const value = v * 2.3 + (fine - .5) * .8;
    const k = Math.max(0, Math.min(3, Math.floor(value) + (value % 1 > bayer(x, u) ? 1 : 0)));
    img.set(x, Y(u), color(levels[k], u));
  }
  // Hashima: long seawall, apartments west of the ridge, industrial eastern half.
  const island = [[67, 330], [108, 350], [151, 432], [152, 702], [132, 800], [95, 858], [43, 834], [22, 736], [25, 438]];
  poly(island, 0x898b80);
  for (let i = 0; i < island.length; i++) {
    const [x, u] = island[i], [xx, uu] = island[(i + 1) % island.length];
    line(x, u, xx, uu, 0xc7c3ac); line(x + 2, u - 3, xx + 2, uu - 3, 0x3c494b);
  }
  // The central rock rises above the reclaimed coal yards, with retaining terraces.
  poly([[83, 425], [104, 451], [112, 532], [107, 650], [115, 709], [100, 772], [85, 738]], 0x566054);
  for (let u = 440; u < 762; u += 9) {
    const x = 89 + Math.sin(u * .043) * 5;
    line(x, u, 106 + Math.sin(u * .03) * 4, u + 3, 0x8d927c);
    line(x + 2, u - 3, 107, u, 0x3d4b43);
  }
  for (let u = 390; u < 820; u += 49) {
    const i = Math.round((u - 390) / 49);
    building(30 + i % 3, u, 23 + i % 4, 24 + i % 5, 4 + i % 3, 0x838981, 0x95968a, true);
    building(60 - i % 3, u + 10, 25 + i % 2, 24, 5 + i % 3, 0x727f78, 0x969b8f, true);
    if (i % 2) building(47, u - 23, 24, 8, 3, 0x65736b, 0x8f9b88, true);
    rect(56, u + 18, 3, 46, 0x394740); // narrow stairs and light wells
    for (let k = 0; k < 8; k++) rect(56, u + 18 - k * 5, 3, 1, 0xb1aea0);
  }
  // Block 30 on the south side, U-shaped residential courts, school at the north end.
  building(66, 394, 25, 19, 5, 0x92958b, 0x9c9e91, true);
  rect(39, 663, 9, 14, 0x303a36); rect(67, 716, 10, 12, 0x303a36);
  building(103, 794, 37, 18, 7, 0x8c9089, 0xb3b2a1, true);
  building(102, 748, 22, 18, 4, 0x7d8580, 0x969e94, true);
  for (let u = 435; u < 745; u += 13) tree(94 + rand.int(-4, 6), u, 5);
  // Roof water tanks, broken slabs, mine headframe, brick colliery office and landing pier.
  for (const [x, u] of [[38, 515], [67, 565], [36, 712], [71, 774]]) { rect(x, u, 5, 4, 0x405558); rect(x, u + 1, 5, 1, 0xabb9b3); }
  building(110, 525, 29, 18, 2, 0x655c54, 0xa77054, true);
  for (let u = 430; u < 690; u += 26) { rect(110, u, 30, 4, 0x6d746c); rect(111, u - 5, 6, 5, 0x333d3d); }
  // Present-day shaft foundations and broken brickwork, not an intact mine tower.
  masonry(img, 110, Y(642), 31, 12, 0x997c61, 80, 5);
  rect(111, 625, 29, 38, 0x505d56); rect(116, 621, 18, 28, 0x2c3d39);
  for (let u = 595; u < 627; u += 6) rect(110, u, 32, 2, 0x8a8c77);
  rect(145, 500, 26, 8, 0xabb1a7); rect(161, 508, 8, 25, 0x7c8c86);
  for (let u = 380; u < 800; u += 17) { rect(27, u, 2, 6, 0xbdbbaa); rect(146, u, 2, 6, 0xbdbbaa); }
  // Wakes lap the seawall in three grouped frames, not hundreds of separate particles.
  const surf = [0, 1, 2].map((f) => { const r = new Raster(140, 20); for (let x = 0; x < 140; x += 4) r.rect(x, 5 + Math.round(Math.sin(x * 0.1 + f) * 3), 3, 1, 0x8dbac4, 0.55); return kit.frame(r); });
  kit.loop(20, 335, surf, { fps: 2, fx: 1 });
  const ferry = new Raster(10, 23); ferry.ellipse(5, 11, 4, 11, 0xe6dfcf); ferry.rect(2, 5, 6, 12, 0x427f96); ferry.rect(3, 6, 4, 5, 0xece8d8);
  const ferryF = kit.frame(ferry);
  kit.path([[168, 380], [164, 790], [156, 1150]], [ferryF], { sp: 9, mode: 'pp', hold: 5, turn: 'none', d: 0.1 });
  // Port entrance and Megami Ohashi: twin cable-stayed pylons, triangular cable fans.
  for (let u = 1280; u < 1640; u++) {
    const edge = 18 + Math.sin(u * 0.018) * 8;
    rect(0, u, edge, 1, color(0x385344, u)); rect(172 - edge, u, edge + 8, 1, color(0x385344, u));
  }
  rect(0, 1500, 180, 15, 0x5d6370);
  for (let x = 0; x < W; x += 9) rect(x, 1494, 5, 1, 0xe8d6ac);
  for (const x of [38, 142]) {
    rect(x - 2, 1548, 4, 73, 0xbbbcca); rect(x - 7, 1536, 14, 3, 0xddd8d1);
    for (let dx = -32; dx <= 32; dx += 8) line(x, 1547, x + dx, 1495, 0xe5d5b2);
    lamp(x, 1549);
  }
  // Glover hillside: retaining walls, zig-zag steps, gardens and veranda houses.
  for (let u = 1750; u < 2480; u += 42) {
    masonry(img, 0, Y(u), W, 7, color(0x8f8d79, u), u);
    for (let x = 8; x < W; x += 27) tree(x, u - 16, 7);
  }
  path(82, 1700, 2490, 15);
  for (let u = 1730; u < 2470; u += 6) rect(83, u, 13, 1, color(0xc0b6a2, u));
  for (const [x, u, w] of [[15, 1910, 53], [110, 1860, 50], [15, 2100, 48]]) {
    building(x, u, w, 30, 2, 0x477d73, 0xe3d6b6);
    rect(x - 3, u - 36, w + 6, 7, 0xb6a382);
    for (let xx = x; xx <= x + w; xx += 7) rect(xx, u - 29, 1, 15, 0xffe6c3);
    for (let k = 0; k < 12; k++) { img.disc(x + rand.int(0, w), Y(u + rand.int(9, 24)), 2, rand.pick([0xb2617d, 0xe59aa1, 0xdab579])); }
  }
  // Oura church: white Gothic nave, green roofs, pointed windows and central steeple/cross.
  building(106, 2300, 48, 65, 3, 0x4b776f, 0xece5d8);
  rect(124, 2330, 12, 87, 0xd4e3d5);
  for (let k = 0; k < 10; k++) rect(125 + Math.floor(k / 2), 2340 - k, 10 - Math.floor(k / 2) * 2, 1, 0x386c64);
  line(130, 2348, 130, 2335, 0xf5dfb7); line(127, 2344, 133, 2344, 0xf5dfb7);
  for (const x of [112, 121, 139, 148]) { rect(x, 2231, 3, 8, 0xffc583); img.disc(x + 1, Y(2232), 1.5, 0xffc583); }
  rect(124, 2224, 12, 10, 0x5d4c43); img.disc(130, Y(2243), 4, 0x8ba6ae); img.disc(130, Y(2243), 2, 0xffd5a0);
  // Dejima's fan-shaped outline, canal, boundary wall, orderly trading-post roofs.
  rect(0, 3090, W, 590, 0x253b48);
  poly([[12, 2810], [35, 2840], [60, 2856], [90, 2862], [120, 2856], [145, 2840], [168, 2810], [145, 2720], [120, 2736], [90, 2742], [60, 2736], [35, 2720]], color(0xc6b48f, 2790));
  for (const x of [25, 51, 77, 103, 129]) {
    const bend = Math.round(18 * (1 - ((x + 12 - 90) / 70) ** 2));
    tiled(x, 2815 + bend, 23, 21); tiled(x + 2, 2770 + bend, 21, 18);
  }
  for (let x = 23; x < 159; x++) {
    const bend = Math.round(18 * (1 - ((x - 90) / 70) ** 2));
    rect(x, 2787 + bend, 1, 7, 0x9e947f);
    if (x % 7 === 0) rect(x, 2843 + bend, 1, 4, 0xe0cba4);
  }
  rect(84, 2920, 12, 60, 0xc9b28a); // short bridge to the mainland
  for (const u of [2600, 3000]) for (const x of [8, 58, 118]) tiled(x, u, 42, 30);
  // Shinchi: gates at the ends, lantern arcade and dense shops.
  rect(0, 3650, W, 550, color(0x7e6c62, 3350)); path(76, 3110, 3640, 28);
  for (let u = 3140; u < 3620; u += 43) { tiled(8, u, 53, 24, true); tiled(119, u + 8, 53, 24, true); }
  for (const u of [3130, 3610]) {
    for (const x of [62, 112]) rect(x, u, 5, 35, 0xc74736);
    rect(56, u + 6, 70, 10, 0x297866); rect(53, u + 7, 76, 2, 0xe4b665); rect(80, u - 8, 20, 7, 0x283e56);
  }
  const lamps = [0, 1, 2].map((f) => { const r = new Raster(92, 22); r.line(0, 2, 91, 2, 0x8d6e54); for (let x = 8; x < 90; x += 15) { r.ellipse(x, 9 + (x + f) % 2, 4, 6, 0xc54b35); r.rect(x - 1, 6, 2, 6, 0xffc672); r.rect(x - 2, 15, 4, 1, 0xdab56c); } return kit.frame(r); });
  for (let u = 3180; u < 3600; u += 72) kit.loop(44, u, lamps, { fps: 1.5, fx: 0 });
  // Nakashima river and Meganebashi: two arches and reflected circles.
  path(42, 3680, 4100, 10); path(129, 3680, 4100, 10);
  rect(61, 4120, 59, 470, 0x163945);
  for (let u = 3690; u < 4130; u += 28) { tree(25, u, 6); tiled(145, u, 29, 15); lamp(57, u); lamp(124, u); }
  rect(53, 3914, 76, 9, 0xa9a699);
  for (const x of [72, 107]) {
    img.ellipse(x, Y(3900), 17, 13, 0xb6b4a1);
    img.ellipse(x, Y(3896), 12, 10, 0x163945);
    img.ellipse(x, Y(3883), 12, 7, 0x9fa88e, 0.3);
  }
  rect(55, 3915, 72, 2, 0xd4c7aa);
  for (let x = 57; x < 128; x += 6) rect(x, 3918, 1, 6, 0xcac3ad);
  // Suwa shrine on its wooded rise, stair approach, torii and copper roof.
  for (let u = 4180; u < 4560; u += 16) for (const x of [17, 38, 145, 166]) tree(x, u, 9);
  rect(65, 4440, 51, 240, color(0xc4b4a0, 4350));
  for (let u = 4210; u < 4410; u += 6) rect(65, u, 51, 1, 0x867f75);
  tiled(53, 4510, 75, 42); rect(59, 4515, 63, 4, 0x598a7c);
  for (const u of [4260, 4390]) { rect(59, u, 4, 30, 0xa89d8a); rect(117, u, 4, 30, 0xa89d8a); rect(54, u + 3, 72, 4, 0xc2b49d); }
  // Urakami: distinct southern hypocentre and the park's northward memorial axis.
  rect(14, 5250, 152, 630, color(0x769079, 4930));
  rect(40, 5210, 100, 520, color(0xc4b9a6, 4950));
  for (let u = 4660; u < 5230; u += 24) { tree(25, u, 7); tree(155, u, 7); }
  img.disc(90, Y(4690), 25, color(0x908e81, 4690)); rect(86, 4725, 8, 39, 0x222f35); rect(83, 4690, 14, 7, 0xaaa79b);
  // Foundation lines, formal beds and candle bowls.
  for (const x of [44, 132]) { rect(x, 5180, 4, 350, 0x626e65); for (let u = 4820; u < 5170; u += 21) lamp(x + 2, u); }
  img.ellipse(90, Y(4860), 32, 22, 0xb7b6a3); img.ellipse(90, Y(4860), 28, 18, 0x2c6273);
  const fountains = [0, 1, 2].map((f) => { const r = new Raster(62, 40); for (const side of [-1, 1]) for (let k = 0; k < 5; k++) { const x = 31 + side * (7 + k * 4); r.line(31, 34, x, 8 + k * 3 + f, 0x98c5c7, 0.8); r.line(x, 8 + k * 3 + f, x + side * 3, 34, 0xc9ded6, 0.55); } return kit.frame(r); });
  kit.loop(59, 4894, fountains, { fps: 3, fx: 0 });
  rect(65, 5164, 50, 24, 0x797f77); rect(70, 5171, 40, 9, 0xb4b5a4);
  // Peace Statue: the figure's right arm (viewer left) raised; left stretched horizontally.
  const sy = Y(5206), sx = 90;
  img.disc(sx, sy + 3, 5, 0x64b6ad); img.rect(sx - 5, sy + 8, 11, 19, 0x4c9d97);
  img.line(sx - 5, sy + 11, sx - 12, sy + 5, 0x64b6ad); img.rect(sx - 14, sy - 14, 4, 22, 0x5caea5); img.rect(sx - 13, sy - 20, 2, 8, 0x8bcbb9);
  img.rect(sx + 5, sy + 10, 23, 4, 0x6eb8aa); img.rect(sx + 27, sy + 9, 5, 3, 0x86c6b0);
  img.rect(sx - 8, sy + 26, 20, 5, 0x529b91); img.line(sx - 7, sy + 30, sx - 15, sy + 38, 0x64b6ad); img.rect(sx + 7, sy + 28, 5, 14, 0x5da79b);
  img.rect(sx - 2, sy + 2, 1, 1, 0x2c706f); img.rect(sx + 2, sy + 2, 1, 1, 0x2c706f);
  // Port crossing towards Fuchi: quays, cranes, warehouses and hillside street lamps.
  poly([[0, 5330], [100, 5330], [139, 5480], [135, 5740], [66, 5990], [0, 6050]], null);
  for (let u = 5390; u < 5940; u += 72) {
    building(143, u, 32, 24, 2, 0x3d5365, 0x8b8e8b);
    line(136, u - 10, 136, u + 25, 0xc9975e); line(115, u + 25, 156, u + 25, 0xc9975e); line(117, u + 25, 136, u - 4, 0x6c7e83);
  }
  kit.path([[31, 5430], [63, 5640], [62, 5880]], [ferryF], { sp: 7, mode: 'pp', turn: 'none' });
  // Fuchi-jinja lower ropeway station, then the dark wooded flank of Inasa.
  tiled(96, 6110, 52, 28); rect(104, 6125, 34, 16, 0xa7b0a6);
  for (let u = 6150; u < L; u += 11) for (let x = 0; x < W; x += 13) tree(x + rand.int(-7, 7), u + rand.int(-4, 4), rand.int(7, 12));
  path(155, 6150, 6670, 6);
  for (let u = 6150; u < 6760; u += 140) {
    const x = 116 - (u - 6150) * 0.075;
    rect(x - 1, u, 3, 30, 0x6e7a82); rect(x - 12, u + 2, 25, 3, 0x8b9198); lamp(x, u + 4);
  }
  line(115, 6120, 63, 6810, 0x596b7d); line(123, 6120, 71, 6810, 0x596b7d);
  const gondola = new Raster(13, 16); gondola.line(6, 0, 6, 4, 0xc4c7c0); gondola.rect(1, 5, 11, 8, 0xcbd7d6); gondola.rect(2, 6, 9, 5, 0x73b7c0); gondola.rect(3, 7, 2, 3, 0xffd69e); gondola.rect(2, 13, 9, 2, 0xb14441);
  kit.path([[119, 6120], [67, 6810]], [kit.frame(gondola)], { sp: 14, mode: 'pp', hold: 4, turn: 'none', d: 0.2 });
  // Rounded summit observatory and red-lit transmission towers.
  img.ellipse(88, Y(6885), 24, 15, 0x5d6471); img.ellipse(88, Y(6892), 24, 13, 0x9da9ad); img.ellipse(88, Y(6893), 18, 9, 0x293c52);
  for (const x of [33, 145]) { line(x, 6930, x, 6990, 0x697483); for (let u = 6940; u < 6990; u += 10) line(x - 5, u, x + 5, u + 5, 0x697483); lamp(x, 6990, true); }
  // Local trams, small human figures and harbour signal lamps use a bounded pool.
  const tram = new Raster(9, 24); tram.rect(0, 0, 9, 24, 0xcac8b5); tram.rect(1, 4, 7, 15, 0x2f6d6c); tram.rect(2, 3, 5, 3, 0xffcf91); tram.line(4, 0, 4, 23, 0x737e78);
  kit.path([[7, 3700], [7, 4090]], [kit.frame(tram)], { sp: 14, mode: 'pp', hold: 4, turn: 'none' });
  const glow = new Raster(3, 3); glow.disc(1, 1, 1.4, 0xffb875);
  kit.wave([kit.frame(glow)], [[0, 147, 5410, 0], [0, 160, 5630, 2], [0, 33, 6990, 1], [0, 145, 6990, 3]], { w: 0.9, a0: 0.25, a1: 0.9 });
  for (const [u0, u1, xs] of [[1800, 2200, [80, 96]], [3140, 3580, [79, 99]], [4780, 5100, [51, 127]]]) for (let u = u0; u < u1; u += 41) for (const x of xs) { rect(x, u, 2, 3, rand.pick([0xb6906e, 0x987090, 0x6c94a3])); rect(x, u + 1, 2, 1, 0xc3ae91); }
  enrichLandmarks(img, kit);
  return { strip: img, props: kit.pack(), meta: { width: W, chunkHeight: 512, chunks: 14, length: L } };
}
