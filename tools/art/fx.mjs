// Effects drawn for every city: the smoke that rolls off an explosion, debris, scorch marks left on the
// ground, spray and sparks, the glow an explosion throws on the ground at night, the muzzle flash, cracks
// spreading over a damaged boss and the shadows of clouds drifting over the land.
import { Raster, fbm, bayer } from '../lib/raster.mjs';

/** A rolling puff of smoke: lit from the top left, dark underneath, ragged at the edge. */
function smoke(d, seed) {
  const r = new Raster(d, d);
  const c = d / 2;
  for (let y = 0; y < d; y++)
    for (let x = 0; x < d; x++) {
      const dx = x + 0.5 - c;
      const dy = y + 0.5 - c;
      const n = fbm(x, y, { seed, scale: d / 3, octaves: 3 });
      const dist = Math.hypot(dx, dy) / (c - 0.5) + (n - 0.5) * 0.55;
      if (dist > 1) continue;
      const lit = -(dx + dy) / d + (n - 0.5) * 0.5; // towards the top left
      const col = lit > 0.18 ? 0x9a96a4 : lit > -0.05 ? 0x726e7c : lit > -0.25 ? 0x56525e : 0x403c48;
      r.set(x, y, col, dist > 0.82 && bayer(x, y) > 0.45 ? 0 : dist > 0.7 ? 0.75 : 0.92);
    }
  return r;
}

/** A small piece of wreckage: dark metal with one edge catching the light. */
function debris(rows) {
  const r = new Raster(rows[0].length, rows.length);
  const C = { k: 0x241e2a, m: 0x4a4452, l: 0xa49eb0, o: 0xffa040, y: 0xfff0a0 };
  rows.forEach((row, y) => [...row].forEach((ch, x) => C[ch] && r.set(x, y, C[ch])));
  return r;
}

/** A scorch mark: soot fanning out from a black centre, thinning into dots. */
function scorch(d, seed) {
  const r = new Raster(d, d);
  const c = d / 2;
  for (let y = 0; y < d; y++)
    for (let x = 0; x < d; x++) {
      const n = fbm(x, y, { seed, scale: d / 4, octaves: 3 });
      const dist = Math.hypot(x + 0.5 - c, (y + 0.5 - c) * 1.15) / (c - 0.5) + (n - 0.5) * 0.7;
      if (dist > 1) continue;
      const a = dist < 0.35 ? 0.62 : dist < 0.65 ? 0.42 : 0.26;
      if (dist > 0.6 && bayer(x, y) < (dist - 0.6) * 2) continue;
      r.set(x, y, dist < 0.3 ? 0x0e0a0c : 0x1e161a, a);
    }
  return r;
}

/** White light falling off from the middle in steps (drawn added, tinted by the game). */
function glow(d) {
  const r = new Raster(d, d);
  const c = d / 2;
  for (let y = 0; y < d; y++)
    for (let x = 0; x < d; x++) {
      const t = 1 - Math.hypot(x + 0.5 - c, y + 0.5 - c) / c;
      if (t <= 0) continue;
      const a = Math.round(t ** 1.7 * 6) / 6; // banded, like the light pools on the ground
      if (a > 0) r.set(x, y, 0xffffff, a);
    }
  return r;
}

/** A crack in a boss's hide: a dark split with a branch, a lit lip along one side. */
function crack(pts, w, h) {
  const r = new Raster(w, h);
  for (const [x, y] of pts) {
    r.set(x, y, 0x140c12);
    if (!pts.some(([px, py]) => px === x && py === y - 1)) r.set(x, y - 1, 0xffffff, 0.35);
  }
  return r;
}

/** The shadow of a cloud: a soft blob, solid inside and dithered out at the edge (the game sets its strength). */
function cloudShadow(w, h, lobes, seed) {
  const r = new Raster(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let v = 0;
      for (const [cx, cy, rx, ry] of lobes) v = Math.max(v, 1 - Math.hypot((x - cx) / rx, (y - cy) / ry));
      v += (fbm(x, y, { seed, scale: 14, octaves: 3 }) - 0.5) * 0.35;
      if (v > 0.18 || (v > 0.04 && bayer(x, y) < v / 0.18)) r.set(x, y, 0x000000);
    }
  return r;
}

export function fxSprites() {
  const out = [];
  const add = (name, raster) => out.push({ name, raster });
  [
    [9, 5],
    [12, 17],
    [15, 29],
  ].forEach(([d, seed], i) => add(`smoke_${i}`, smoke(d, seed)));
  add('debris_0', debris(['kl', 'mk']));
  add('debris_1', debris(['.kl', 'kmk', 'k..']));
  add('debris_2', debris(['lmmk', 'kkm.']));
  add('debris_3', debris(['k.', 'ml', 'kk']));
  add('debris_hot', debris(['yo', 'ok']));
  [
    [14, 3],
    [24, 8],
    [36, 13],
  ].forEach(([d, seed], i) => add(`scorch_${i}`, scorch(d, seed)));
  const dot = (rows, colors) => {
    const r = new Raster(rows[0].length, rows.length);
    rows.forEach((row, y) => [...row].forEach((ch, x) => colors[ch] && r.set(x, y, colors[ch])));
    return r;
  };
  add('drop_0', dot(['wc', 'cb'], { w: 0xffffff, c: 0xa8e8ff, b: 0x4aa8d8 }));
  add('drop_1', dot(['w', 'c'], { w: 0xe8faff, c: 0x6ac0e8 }));
  add('dot_1', dot(['w'], { w: 0xffffff }));
  add('dot_2', dot(['ww', 'ww'], { w: 0xffffff }));
  add('glow', glow(48));
  // the muzzle flash at the ship's nose, two shapes that alternate with the volleys
  add('muzzle_0', dot(['.y.y.', 'yowoy', '.ywy.', '..w..'], { w: 0xffffff, y: 0xfff3a0, o: 0xffb050 }));
  add('muzzle_1', dot(['..y..', '.ywy.', '.owo.', '..w..'], { w: 0xffffff, y: 0xfff3a0, o: 0xffb050 }));
  add('crack_0', crack([[4, 0], [4, 1], [3, 2], [3, 3], [4, 4], [5, 4], [6, 5], [7, 6], [2, 4], [1, 5], [0, 6], [4, 5], [4, 6], [3, 7]], 8, 8));
  add('crack_1', crack([[0, 1], [1, 1], [2, 2], [3, 2], [4, 3], [5, 3], [6, 4], [7, 4], [8, 5], [4, 4], [4, 5], [3, 6], [6, 3], [7, 2]], 9, 7));
  add('crack_2', crack([[3, 0], [3, 1], [4, 2], [4, 3], [3, 4], [3, 5], [4, 6], [4, 7], [5, 3], [6, 3], [7, 2], [2, 5], [1, 6], [0, 7]], 8, 8));
  add('cshadow_0', cloudShadow(96, 56, [[30, 30, 26, 20], [56, 24, 30, 20], [74, 34, 20, 16]], 41));
  add('cshadow_1', cloudShadow(80, 44, [[26, 22, 22, 16], [52, 20, 24, 17]], 57));
  return out;
}
