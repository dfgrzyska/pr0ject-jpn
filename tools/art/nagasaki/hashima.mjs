// Hashima (Gunkanjima): the long seawall, the ruined apartment blocks west of the central rock, the colliery
// ruins on the east, Block 30 in the south, the school in the north, the landing quay.
import { Raster, rng, fbm, mix } from '../../lib/raster.mjs';
import { crownPixels } from '../nature.mjs';
import { masonry } from './paint.mjs';
import { HASHIMA } from './geo.mjs';

export function paintHashima(k) {
  const { img, kit, Y } = k;
  const rand = rng(808);
  const R = rng(89327);
  const rect = (x, u, w, h, c, a = 1) => img.rect(x, Y(u), w, h, c, a);
  const line = (x, u, xx, uu, c) => img.line(x, Y(u), xx, Y(uu), c);
  const poly = (pts, c) => k.poly(pts.map(([x, u]) => [x, Y(u)]), c);
  function tree(x, u, size = 5) {
    const seed = rand.int(1, 999999);
    const pixels = crownPixels('broadleaf', Math.round(x), Y(u), size, rng(seed), seed);
    for (const p of pixels) img.tint(p.x + 3, p.y + 4, 0.58);
    for (const p of pixels) img.set(p.x, p.y, p.c);
  }
  function building(x, u, w, h, floors = 2, roof = 0x63667b, wall = 0xb0a69b) {
    const y = Y(u);
    const rise = floors * 3;
    img.rect(x + 3, y + 3, w, h + rise, 0x07111c, 0.5);
    img.rect(x, y, w, h + rise, wall);
    img.rect(x, y, w, h, roof);
    img.rect(x + 1, y + 1, w - 2, h - 2, mix(roof, 0xc6c0ad, 0.2));
    // concrete aggregate, expansion joints, drainage
    for (let yy = 2; yy < h - 1; yy++)
      for (let xx = 1; xx < w - 1; xx++) if (rand() < 0.28) img.set(x + xx, y + yy, mix(roof, rand() < 0.5 ? 0xe0d7bc : 0x17232f, 0.15));
    img.rect(x + w - 3, y + 2, 2, h + rise - 2, mix(wall, 0x12212c, 0.48));
    for (let yy = 6; yy < h - 2; yy += 9) img.line(x + 2, y + yy, x + w - 4, y + yy, mix(roof, 0x14202d, 0.25));
    for (let j = 1; j < floors + 1; j++)
      for (let xx = 2; xx < w - 2; xx += 4) {
        img.rect(x + xx, y + h + j * 3 - 3, 2, 2, 0x17232b);
        img.set(x + xx, y + h + j * 3 - 1, mix(wall, 0xeee1bf, 0.3));
      }
    // the ruin: exposed beams, missing slabs, rust streaks, open stairwell
    for (let k2 = 0; k2 < w / 3; k2++) img.set(x + rand.int(1, w - 2), y + rand.int(1, h - 2), 0x303a3b);
    img.line(x + w / 2, y, x + w / 2 - 3, y + h + rise, 0x2d3537);
    img.rect(x + 2, y + 2, Math.max(2, w - 5), 1, 0x969486);
    for (let yy = 3; yy < h + rise; yy += 5) {
      img.line(x, y + yy, x + 2, y + yy + 3, 0x4e5b57);
      if (yy > h) img.line(x + 1, y + yy, x + w - 4, y + yy, 0x7c887d);
    }
    img.rect(x + w - 10, y + 5, 6, Math.max(4, h - 10), 0x24332f);
    for (let yy = 6; yy < h - 5; yy += 3) img.line(x + w - 10, y + yy, x + w - 5, y + yy + 1, 0x929789);
    for (let k2 = 0; k2 < 5; k2++) {
      const xx = x + rand.int(2, w - 4);
      const yy = y + rand.int(4, h + rise - 2);
      img.line(xx, yy, xx, yy + 3, 0x725c49);
    }
  }

  poly(HASHIMA, 0x898b80);
  for (let i = 0; i < HASHIMA.length; i++) {
    const [x, u] = HASHIMA[i];
    const [xx, uu] = HASHIMA[(i + 1) % HASHIMA.length];
    line(x, u, xx, uu, 0xc7c3ac);
    line(x + 2, u - 3, xx + 2, uu - 3, 0x3c494b);
  }
  // the central rock above the reclaimed coal yards, with retaining terraces
  poly([[83, 425], [104, 451], [112, 532], [107, 650], [115, 709], [100, 772], [85, 738]], 0x566054);
  for (let u = 440; u < 762; u += 9) {
    const x = 89 + Math.sin(u * 0.043) * 5;
    line(x, u, 106 + Math.sin(u * 0.03) * 4, u + 3, 0x8d927c);
    line(x + 2, u - 3, 107, u, 0x3d4b43);
  }
  for (let u = 390; u < 820; u += 49) {
    const i = Math.round((u - 390) / 49);
    building(30 + (i % 3), u, 23 + (i % 4), 24 + (i % 5), 4 + (i % 3), 0x838981, 0x95968a);
    building(60 - (i % 3), u + 10, 25 + (i % 2), 24, 5 + (i % 3), 0x727f78, 0x969b8f);
    if (i % 2) building(47, u - 23, 24, 8, 3, 0x65736b, 0x8f9b88);
    rect(56, u + 18, 3, 46, 0x394740); // narrow stairs and light wells
    for (let q = 0; q < 8; q++) rect(56, u + 18 - q * 5, 3, 1, 0xb1aea0);
  }
  // Block 30 in the south, U-shaped courts, the school in the north
  building(66, 394, 25, 19, 5, 0x92958b, 0x9c9e91);
  rect(39, 663, 9, 14, 0x303a36);
  rect(67, 716, 10, 12, 0x303a36);
  building(103, 794, 37, 18, 7, 0x8c9089, 0xb3b2a1);
  building(102, 748, 22, 18, 4, 0x7d8580, 0x969e94);
  for (let u = 435; u < 745; u += 13) tree(94 + rand.int(-4, 6), u, 5);
  // roof water tanks, the brick colliery office, shaft foundations, the landing quay
  for (const [x, u] of [[38, 515], [67, 565], [36, 712], [71, 774]]) {
    rect(x, u, 5, 4, 0x405558);
    rect(x, u + 1, 5, 1, 0xabb9b3);
  }
  building(110, 525, 29, 18, 2, 0x655c54, 0xa77054);
  for (let u = 430; u < 690; u += 26) {
    rect(110, u, 30, 4, 0x6d746c);
    rect(111, u - 5, 6, 5, 0x333d3d);
  }
  masonry(img, 110, Y(642), 31, 12, 0x997c61, 80, 5);
  rect(111, 625, 29, 38, 0x505d56);
  rect(116, 621, 18, 28, 0x2c3d39);
  for (let u = 595; u < 627; u += 6) rect(110, u, 32, 2, 0x8a8c77);
  rect(145, 500, 26, 8, 0xabb1a7);
  rect(161, 508, 8, 25, 0x7c8c86);
  for (let u = 380; u < 800; u += 17) {
    rect(27, u, 2, 6, 0xbdbbaa);
    rect(146, u, 2, 6, 0xbdbbaa);
  }

  // salt-stained seawall blocks, fractured concrete, colliery machinery
  for (let u = 405; u < 788; u += 8) {
    masonry(img, 24, Y(u), 5, 7, 0xa6aa98, u, 4);
    masonry(img, 147, Y(u), 5, 7, 0xa6aa98, u + 2, 4);
    for (let q = 0; q < 3; q++) {
      const x = R.int(106, 143);
      rect(x, u + R.int(-3, 3), R.int(1, 4), 1, R.pick([0xb3b4a1, 0x56655d, 0x807a68]));
    }
  }
  for (const [x, u] of [[36, 478], [66, 529], [36, 625], [67, 679], [35, 771]]) {
    rect(x, u, 12, 13, 0x33413c);
    for (let j = 0; j < 4; j++) {
      rect(x + j * 3, u + 1, 2, 14, 0x9b9e8a);
      rect(x - 1, u - j * 4, 14, 1, 0x7b8a7c);
    }
    line(x, u, x + 13, u - 11, 0x453d33);
  }
  for (const [x, u] of [[111, 574], [133, 607]]) {
    rect(x, u, 3, 50, 0x806b51);
    line(x + 3, u, x + 3, u - 50, 0xc0a884);
    for (let j = 0; j < 49; j += 6) line(x - 2, u - j, x + 5, u - j - 5, 0x948773);
  }
  for (const u of [445, 471, 657, 689]) {
    img.ellipse(126, Y(u), 8, 4, 0x87938b);
    rect(118, u, 16, 7, 0x53635e);
    img.ellipse(126, Y(u + 1), 8, 4, 0x9da797);
    img.ellipse(126, Y(u + 2), 5, 2, 0x44544e);
    line(126, u - 7, 141, u - 7, 0x9c967e);
  }
  // the school's windows and parapet, the schoolyard, broken edges of the reclaimed ground
  for (let row = 0; row < 5; row++)
    for (let x = 105; x < 137; x += 4) {
      rect(x, 773 - row * 3, 2, 2, row % 2 ? 0x263638 : 0x314747);
      rect(x, 771 - row * 3, 3, 1, 0xb2b59d);
    }
  rect(101, 837, 34, 31, 0x7e897b);
  for (let x = 101; x < 135; x += 4) rect(x, 838, 1, 5, 0x909d8b);
  for (let q = 0; q < 7; q++) line(84, 832 - q * 3, 98, 832 - q * 3, 0xa3a995);
  for (let q = 0; q < 90; q++) rect(R.int(44, 130), R.int(805, 839), R.int(1, 3), 1, R.pick([0xa4a28b, 0x697767, 0x454e46]));
  // fine texture over the flat concrete
  for (let y = Y(860); y < Y(325); y++)
    for (let x = 20; x < 156; x++) {
      const c = img.get(x, y);
      if (img.get(x - 1, y) === c && img.get(x + 1, y) === c && img.get(x, y - 1) === c && R() < 0.12) img.tint(x, y, 0.93);
    }
  k.reserve(18, Y(862), 140, 540);

  // waves lapping the seawall: three grouped frames
  const surf = [0, 1, 2].map((f) => {
    const r = new Raster(140, 20);
    for (let x = 0; x < 140; x += 4) r.rect(x, 5 + Math.round(Math.sin(x * 0.1 + f) * 3), 3, 1, 0x8dbac4, 0.55);
    return kit.frame(r);
  });
  kit.loop(20, 335, surf, { fps: 2, fx: 1 });
  for (const [x, u] of [[8, 600], [154, 760]]) {
    const side = [0, 1, 2].map((f) => {
      const r = new Raster(16, 90);
      for (let y = 0; y < 90; y += 4) r.rect(4 + Math.round(Math.sin(y * 0.15 + f) * 3), y, 1, 3, 0x9cc8d0, 0.5);
      return kit.frame(r);
    });
    kit.loop(x, u, side, { fps: 2, fx: 1 });
  }
  // abandoned-island moss and weeds breaking through
  for (let q = 0; q < 160; q++) {
    const x = R.int(26, 150);
    const u = R.int(340, 850);
    if (!k.wet(x, Y(u)) && fbm(x, u, { seed: 5, scale: 9 }) > 0.55) img.set(x, Y(u), R.pick([0x4e6a3e, 0x5e7a46, 0x3e5a36]), 0.8);
  }
}
