import { Raster, rng, mix } from '../../lib/raster.mjs';

// View south-east from Inasa: eastern hillside city, winding harbour, Megami Bridge
// on the right, shipyards below, wooded western slope in the foreground.
export function buildPanorama() {
  const W = 216, H = 420, r = rng(80333);
  const sky = new Raster(W, H), city = new Raster(W, H), near = new Raster(W, H);
  const lights = Array.from({ length: 4 }, () => new Raster(W, H));
  for (let y = 0; y < H; y++) sky.rect(0, y, W, 1, mix(0x060d27, 0x405174, Math.min(1, y / 167)));
  for (let i = 0; i < 65; i++) sky.set(r.int(0, W - 1), r.int(12, 110), r.pick([0x4b648b, 0x8c9cba]));
  const ridge = x => 137 + 10 * Math.sin(x * .039) + 5 * Math.sin(x * .11);
  const farShore = x => 228 - x * .24 + 5 * Math.sin(x * .042);
  const nearShore = x => 292 - x * .42 + 7 * Math.sin(x * .04);
  for (let x = 0; x < W; x++) {
    for (let y = Math.floor(ridge(x)); y < H; y++) {
      const water = y > farShore(x) && y < nearShore(x);
      city.set(x, y, water ? mix(0x101e35, 0x1a2d43, (y % 3) / 5) : mix(0x172036, 0x273148, r() * .5));
    }
  }
  // Low-rise city terraces follow the folds of the hills, no invented skyscraper skyline.
  for (let y = 151; y < 295; y += 3) for (let x = 0; x < W; x += 3) {
    if (y < ridge(x) + 7 || (y > farShore(x) - 2 && y < nearShore(x) + 2)) continue;
    // Irregular blocks and unlit ravines break up the hillside grid.
    const ravine = Math.abs(x - (55 + 16 * Math.sin(y * .043))) < 3 || Math.abs(x - (125 + 12 * Math.sin(y * .052))) < 2;
    if (r() < .28 || ravine) continue;
    const jitter = r.int(-1, 1);
    city.rect(x + jitter, y - r.int(0, 2), r.int(2, 4), 3, r.pick([0x283046, 0x30384c, 0x3c4052]));
    const c = r.pick([0xd9a765, 0xb8bcd3, 0xf9cf83, 0x78acbd]);
    city.set(x + 1 + jitter, y, mix(c, 0x283047, .3));
    if (r() < .7) lights[r.int(0, 3)].set(x + 1 + jitter, y, c);
  }
  // Shoreline roads, long exposure-like reflected lights, port facilities.
  for (let x = 0; x < W; x++) {
    const y = Math.round(farShore(x));
    city.set(x, y, x % 5 ? 0xb9aa83 : 0xf8dfad);
    if (x % 5 === 0) for (let k = 1; k < 13; k += 2) lights[x % 4].set(x, y + k, mix(0x9b9674, 0x152239, k / 14));
  }
  for (let i = 0; i < 12; i++) {
    const x = i * 9, y = Math.round(nearShore(x)) + 4;
    city.rect(x, y, 8, 5, 0x434957); city.line(x, y, x + 7, y, 0x9b9f98);
    if (i % 3 === 0) {
      city.line(x + 3, y, x + 3, y - 14, 0x727b87);
      city.line(x - 3, y - 14, x + 11, y - 14, 0x949eab);
      lights[i % 4].set(x + 3, y - 15, 0xf78d73);
    }
  }
  // Megami is a cable-stayed bridge: two illuminated pylons and fan cables.
  city.line(144, 209, 205, 194, 0xaeb9c1);
  for (const [x, y] of [[161, 205], [189, 198]]) {
    city.line(x, y, x, y - 19, 0xf6e5c5);
    city.line(x + 2, y, x + 1, y - 19, 0xb2c8cf);
    for (const dx of [-15, -10, -5, 5, 10, 15]) city.line(x, y - 17, x + dx, y - Math.round(dx * .24), 0x7b92a4);
    lights[0].set(x, y - 20, 0xff766c);
  }
  // Steep, almost black foreground slope anchors the vista.
  for (let x = 0; x < W; x++) {
    const top = 354 - x * .43 + 9 * Math.sin(x * .045);
    for (let y = Math.floor(top); y < H; y++) near.set(x, y, r() < .2 ? 0x0c1b25 : 0x0a1420);
    if (x % 6 === 0) near.set(x, top + 17, 0x8c7956);
  }
  // Sparse neighbourhoods on this side of the port, threaded by a climbing road.
  for (let x = 5; x < 150; x++) {
    const y = 360 - x * .18 + Math.sin(x * .055) * 12;
    near.set(x, y, 0x343d46);
    if (x % 5 === 0) near.set(x, y, 0xb69b70);
    if (x % 9 === 0) { near.rect(x, y + 5, 4, 3, 0x283441); near.set(x + 1, y + 6, 0x9b8860); }
  }
  return { sky, city, near, ...Object.fromEntries(lights.map((a, i) => [`lights${i}`, a])) };
}
