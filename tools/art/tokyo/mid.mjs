// Tokyo's middle layer. For now a block-out only (phase 0 of docs/plan-tokyo.md): the districts as plain ground
// with a street grid, the river and the bay left open to the far layer, the three arenas ringed, a ruler up the
// left edge (a tick every 100 u, a long one every 500). The route proper comes in phase 1, the districts after.
import { Raster, mix, scaleColor } from '../../lib/raster.mjs';
import { W, S, L, DISTRICTS, ARENAS } from './route.mjs';

const hash = (a, b) => {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

export function buildMid() {
  const img = new Raster(W * S, L * S);
  const Y = (u) => (L - u) * S; // strip row of a height u
  const rect = (x, u0, w, h, c) => img.rect(x * S, Y(u0 + h), w * S, h * S, c);
  const ROAD = 0x3a3c44;
  for (const [from, to, id, , ground] of DISTRICTS) {
    if (id === 'bay') {
      // open water, the bridge across it
      rect(0, 11040, W, 22, 0xd8dce0);
      for (let x = 20; x < W; x += 46) rect(x, 11034, 6, 34, 0xf0f2f4);
      continue;
    }
    for (let u = from; u < to; u += 16)
      for (let x = 0; x < W; x += 20) {
        const k = hash(Math.floor(x / 20), Math.floor(u / 16) + 7);
        rect(x, u, 20, Math.min(16, to - u), scaleColor(mix(ground, 0x202028, k * 0.18), 0.92 + k * 0.16));
      }
    if (id === 'sumida') {
      // the river down the middle, a bridge every so often
      for (let u = from; u < to; u++) {
        const x0 = (58 + Math.round(Math.sin(u / 170) * 10)) * S;
        for (let y = Y(u + 1); y < Y(u); y++) for (let x = x0; x < x0 + 64 * S; x++) img.clear(x, y);
      }
      for (let u = from + 110; u < to; u += 290) rect(40, u, 100, 10, 0xc8c4b8);
    } else {
      rect(84, from, 12, to - from, ROAD); // the avenue
      for (let u = from + 64; u < to; u += 128) rect(0, u, W, 6, ROAD); // cross streets
      for (let u = from; u < to; u += 12) rect(89.5, u, 1, 6, 0xd8d0a0); // its centre line
    }
    rect(0, from, W, 2, 0xf0e8d0); // the district's edge
  }
  for (const [u] of ARENAS)
    for (let a = 0; a < 720; a++) {
      const t = (a / 720) * Math.PI * 2;
      img.rect(Math.round((90 + Math.cos(t) * 62) * S), Math.round(Y(u) + Math.sin(t) * 62 * S), 2, 2, 0xffd040);
    }
  for (let u = 0; u < L; u += 100) rect(0, u, u % 500 ? 4 : 10, 1, 0xffffff);
  return { strip: img, meta: { width: W, artScale: S, length: L } };
}
