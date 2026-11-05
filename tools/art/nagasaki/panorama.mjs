import { Raster, rng, mix, fbm, rgb } from '../../lib/raster.mjs';
import { polygon, glow } from './paint.mjs';
import { farShore, nearShore, hillRoad } from '../../../src/data/nagasakiView.js';

// Hand-composed pixel painting. Lighting, materials, haze and broken reflections are
// baked offline; the game only composites seven layers and bounded traffic pools.
export function buildPanorama() {
  const W = 216, H = 420, random = rng(333081);
  const sky = new Raster(W, H), city = new Raster(W, H), near = new Raster(W, H);
  const lights = Array.from({ length: 4 }, () => new Raster(W, H));
  const warm = [0xffdb9a, 0xf6b966, 0xffedbd, 0xe9a35b], cool = [0xa5d6ec, 0xd4e9ef, 0x81b8cf];
  const ridge = x => 105 + 7 * Math.sin(x * .039) + 5 * Math.sin(x * .099);
  const treeLine = x => 391 - x * .22 + Math.sin(x * .046) * 13;
  const woodedHill = (x, y) => y < 176 - .035 * (x - 162) ** 2 || (x > 186 && y < 151 - .02 * (x - 216) ** 2);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = mix(0x06142e, 0x3e607b, Math.round(Math.min(1, y / 145) * 20) / 20);
    const cloud = fbm(x, y * 3, { seed: 9, scale: 40, octaves: 2 });
    if (cloud > .57) c = mix(c, 0x607a94, (cloud - .57) * .55);
    sky.set(x, y, c);
  }
  for (let i = 0; i < 28; i++) sky.set(random.int(1, 215), random.int(9, 70), 0x8ba2b8, random.range(.25, .75));
  for (let n = 0; n < 3; n++) for (let x = 0; x < W; x++) {
    const y0 = 85 + n * 10 + 7 * Math.sin(x * .024 + n * 2) + 3 * Math.sin(x * .13);
    sky.rect(x, y0, 1, H - y0, [0x29445e, 0x213b53, 0x1a3046][n]);
  }
  for (let x = 0; x < W; x++) for (let y = Math.floor(ridge(x)); y < H; y++) {
    const water = y > farShore(x) && y < nearShore(x);
    const n = fbm(x, y, { seed: 31, scale: water ? 18 : 24, octaves: 2 });
    let c = water ? mix(0x071d32, 0x20415a, n * .65) : mix(0x112b35, 0x314553, n * .9);
    if (!water && (woodedHill(x, y) || y > nearShore(x) + 12)) {
      const foliage = fbm(x, y, { seed: 718, scale: 4, octaves: 2 });
      c = mix(0x0b2530, 0x26454b, Math.round(foliage * 4) / 4);
    }
    if (water && y % 3 === 0) c = mix(c, 0x557285, .10 * n);
    city.set(x, y, c);
  }
  for (const [x, y, rad] of [[32, 208, 45], [82, 189, 30], [135, 183, 22], [176, 158, 18]]) glow(city, x, y, rad, 0xe4a36c, .23);
  const light = (x, y, c, group = random.int(0, 3), bright = 1) => {
    city.set(x, y, mix(c, 0x233b53, .18)); lights[group].set(x, y, c, bright);
  };
  function house(x, y, w, h, distant = false) {
    const wall = random.pick([0x2a3948, 0x354652, 0x393c4b, 0x2d4249, 0x423f4d]);
    city.rect(x + 1, y - h + 2, w + 1, h + 1, 0x081e30, .65);
    city.rect(x, y - h, w, h, wall);
    city.rect(x + w - 1, y - h + 1, 2, h - 1, mix(wall, 0x091c2b, .4));
    const roof = random.pick([0x34495a, 0x3f5263, 0x293a4c, 0x314c53]);
    polygon(city, [[x - 1, y - h], [x + w / 2, y - h - 2], [x + w + 1, y - h], [x + w, y - h + 1]], roof);
    for (let yy = y - h + 2; yy < y; yy += 3) for (let xx = x + 1; xx < x + w - 1; xx += 3) {
      if (random() < .26) { city.set(xx, yy, 0x0b2533); continue; }
      const c = random() < .20 ? random.pick(cool) : random.pick(warm);
      light(xx, yy, c, random.int(0, 3), distant ? .6 : .9);
      if (!distant && w > 5 && random() < .25) glow(city, xx, yy, 2, c, .18);
      if (!distant && w > 5) city.set(xx + 1, yy, mix(c, wall, .45));
    }
    if (w > 5 && random() < .4) { city.rect(x + 1, y - h - 2, 2, 2, 0x60717a); city.set(x + 1, y - h - 2, 0x9aabad); }
  }
  // Irregular terraces and dark ravines replace the old checkerboard of windows.
  for (let y = 111; y < 249; y += 3) for (let x = -4; x < W; x += random.int(3, 7)) {
    const yy = y + random.int(-2, 2);
    if (yy < ridge(x) + 3 || yy > farShore(x) - 5 || woodedHill(x, yy)) continue;
    const ravine = Math.abs(x - (74 + Math.sin(y * .044) * 16)) < 5 || Math.abs(x - (152 + Math.sin(y * .057) * 12)) < 4;
    if ((ravine && random() < .8) || random() < .15) continue;
    const depth = Math.max(0, (yy - 110) / 130);
    house(x, yy, random.int(3, 4 + Math.floor(depth * 5)), random.int(3, 4 + Math.floor(depth * 7)), depth < .25);
  }
  for (let n = 0; n < 6; n++) {
    let prev;
    for (let x = 0; x < W; x++) {
      const y = 124 + n * 17 - x * .065 + Math.sin(x * .035 + n) * (6 + n);
      if (y < ridge(x) + 4 || y > farShore(x) - 5 || woodedHill(x, y)) { prev = null; continue; }
      city.set(x, y, 0x293b47);
      if (prev) city.line(prev[0], prev[1], x, y, 0x8e795a, .7);
      if (x % 4 === n % 4) light(x, y, n > 3 ? 0xffcf89 : 0xc0c9b4, n % 4, .75);
      if (x % 31 === 0 && y - 12 > ridge(x)) { glow(city, x, y, 4, 0xf8b26d, .3); city.line(x, y, x - 5, y - 12, 0x8e8069, .65); }
      prev = [x, y];
    }
  }
  for (let x = -4; x < 145; x += random.int(9, 15)) {
    const y = Math.floor(farShore(x)) - 3;
    house(x, y, random.int(7, 11), random.int(8, 15));
    if (x % 3 === 0) { city.rect(x + 1, y - 9, 2, 7, 0x90bbc6); light(x + 1, y - 8, 0xb2e0e8, 2); }
  }
  // Tapered, fragmented warm and cool reflections reach into the water.
  for (let x = 0; x < W; x++) {
    const y = Math.round(farShore(x)); city.line(x, y, x, y + 2, 0x394d5b);
    if (x % 3 !== 0) continue;
    const c = random.pick([...warm, ...cool]); light(x, y, c); glow(city, x, y, 5, c, .27);
    const length = random.int(9, 37);
    for (let k = 3; k < length && y + k < nearShore(x) - 3; k++) {
      if (random() < .42) continue;
      const xx = x + random.int(-1, 1), a = (1 - k / length) * .45;
      city.rect(xx, y + k, random.int(1, 3), 1, c, a); lights[x % 4].rect(xx, y + k, 2, 1, c, a * .65);
    }
  }
  // Shipyard hangars, sawtooth roofs, lattice cranes and lit gantries.
  for (let x = -6; x < 152; x += 21) {
    const y = Math.round(nearShore(x));
    polygon(city, [[x, y], [x + 17, y - 6], [x + 21, y + 8], [x + 3, y + 13]], 0x3a4b59);
    city.line(x, y, x + 17, y - 6, 0xb0bcc0);
    for (let k = 0; k < 3; k++) {
      polygon(city, [[x + 2, y + k * 4], [x + 17, y - 5 + k * 4], [x + 20, y - 2 + k * 4], [x + 4, y + 3 + k * 4]], k % 2 ? 0x4c6376 : 0x3c5369);
      city.line(x + 3, y + 1 + k * 4, x + 17, y - 4 + k * 4, 0x85949c);
    }
    for (let k = 0; k < 6; k++) light(x + k * 3, y + 13 - k, 0xf2cb86, 1);
    if (x < 110 && Math.round((x + 6) / 21) % 2 === 0) {
      city.line(x + 10, y, x + 10, y - 25, 0x546e81); city.line(x + 12, y, x + 10, y - 25, 0x9ab4c1);
      city.line(x + 2, y - 25, x + 26, y - 32, 0x9ab4c1); city.line(x + 10, y - 25, x + 24, y - 16, 0x6d8b9d);
      city.line(x + 24, y - 31, x + 24, y - 17, 0x6d8b9d); light(x + 10, y - 26, 0xfb8b72, 0);
    }
  }
  polygon(city, [[24, 301], [64, 286], [72, 290], [69, 297], [31, 311]], 0x081b2b);
  polygon(city, [[30, 301], [61, 290], [66, 292], [63, 297], [34, 307]], 0x65828f);
  city.line(34, 300, 59, 291, 0xf1dfad);
  city.rect(42, 295, 6, 4, 0x8ba6b0); city.rect(48, 292, 5, 3, 0xc0c5b3);
  for (const x of [43, 45, 49, 51]) light(x, x < 48 ? 296 : 293, 0xf4d6a1, 2);
  for (const [x, y] of [[31, 298], [64, 288], [74, 305]]) { glow(city, x, y, 8, 0xc8dfeb, .34); light(x, y, 0xf7f5d9, 2); }
  // Cable-stayed Megami: both A-shaped pylons, suspended deck, stays and floodlights.
  const deck = x => 228 - (x - 130) * .30;
  for (let x = 129; x < 211; x++) { city.set(x, deck(x), 0xc7dce2); city.set(x, deck(x) + 2, 0x3b6279); }
  for (const x of [151, 185]) {
    const y = deck(x), top = y - 28; glow(city, x, top + 14, 12, 0x7eafcf, .23);
    city.line(x - 3, y + 3, x, top, 0xe5eff0); city.line(x + 3, y + 3, x, top, 0xb8d6df);
    city.line(x - 2, y - 9, x + 2, y - 9, 0xf2e7ce);
    for (const d of [-21, -16, -11, -6, 6, 11, 16, 21]) city.line(x, top + 3, x + d, deck(x + d), 0x8bafc5, .85);
    light(x, top, 0xffc6ad, 0);
  }
  for (let y = 269; y < 377; y += 5) for (let x = 4; x < W; x += random.int(6, 10)) {
    if (y < nearShore(x) + 19 || y > treeLine(x) - 3) continue;
    if (fbm(x, y, { seed: 735, scale: 23, octaves: 2 }) > .49) house(x, y, random.int(4, 8), random.int(4, 8));
  }
  for (let x = 5; x < W - 5; x++) {
    const y = 338 - x * .23 + Math.sin(x * .065) * 6;
    city.set(x, y, 0x55646a);
    if (x % 7 === 0) { light(x, y, 0xc8d9cf, 1, .8); glow(city, x, y, 4, 0x9cc6ca, .2); }
  }
  for (let x = 0; x < W; x++) for (let y = Math.floor(treeLine(x)); y < H; y++) {
    const n = fbm(x, y, { seed: 128, scale: 5, octaves: 3 });
    near.set(x, y, [0x061820, 0x0c2429, 0x142f32, 0x1a3939][Math.min(3, Math.floor(n * 4))]);
  }
  for (let x = 0; x < W; x++) {
    const y = hillRoad(x); city.rect(x, y, 1, 3, 0x3d474e); city.set(x, y, 0x8b8170);
    if (x % 5 === 0) { light(x, y, 0xf5ad62, 3); glow(city, x, y, 5, 0xffad57, .35); }
    if (x % 13 === 0) house(x, y - 4, 8, 7);
  }
  // Do not let lights from a distant roof float through a nearer roof drawn over it.
  for (const mask of lights) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (mask.alpha(x, y) < 130) continue;
    const sum = c => rgb(c).reduce((a, b) => a + b, 0);
    if (sum(city.get(x, y)) < sum(mask.get(x, y)) * .42) mask.clear(x, y);
  }
  return { sky, city, near, ...Object.fromEntries(lights.map((r, i) => [`lights${i}`, r])) };
}
