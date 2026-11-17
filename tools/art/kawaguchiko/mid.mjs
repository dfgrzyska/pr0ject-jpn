// Kawaguchiko's middle layer. For now a block-out only (phase 0 of docs/plan-kawaguchiko.md): the stretches as plain
// ground, the lake left open to the far layer with Unoshima in it, the town's streets, Fuji's slopes in its zones of
// height (forest, scoria black then red, snow in the gullies) running up to the crater, the two arenas ringed, a
// ruler up the left edge (a tick every 100 u, a long one every 500). The route proper comes in phase 1.
import { Raster, mix, scaleColor } from '../../lib/raster.mjs';
import { W, S, L, SECTIONS, LAKE, ISLAND, ARENAS, CRATER } from './route.mjs';

const hash = (a, b) => {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

// Fuji's ground by height (u): forest, the tree line, black scoria, red scoria, the summit's rim
const ZONES = [[3900, 0x3c5a34], [4900, 0x4a5a3c], [5500, 0x5a5a46], [5800, 0x2e2a2c], [6300, 0x5a3426], [6800, 0x6a3c2c]];
const zone = (u) => {
  let c = ZONES[0][1];
  for (const [from, col] of ZONES) if (u >= from) c = col;
  return c;
};

export function buildMid() {
  const img = new Raster(W * S, L * S);
  const Y = (u) => (L - u) * S; // strip row of a height u
  const rect = (x, u0, w, h, c) => img.rect(x * S, Y(u0 + h), w * S, h * S, c);
  for (const [from, to, id, , ground] of SECTIONS) {
    if (id === 'lake') continue;
    for (let u = from; u < to; u += 16)
      for (let x = 0; x < W; x += 20) {
        const k = hash(Math.floor(x / 20), Math.floor(u / 16) + 11);
        const base = from >= 3900 ? zone(u) : ground;
        rect(x, u, 20, Math.min(16, to - u), scaleColor(mix(base, 0x202028, k * 0.18), 0.92 + k * 0.16));
      }
    if (id === 'fujiyoshida') {
      rect(84, from, 12, to - from, 0x3a3c44); // Honcho-dori, aimed at the mountain
      for (let u = from + 80; u < to; u += 160) rect(0, u, W, 6, 0x3a3c44);
      rect(20, 900, 30, 40, 0x8a2a20); // the pagoda's hill
    }
    rect(0, from, W, 2, 0xf0e8d0); // the stretch's edge
  }
  // the lake: open between its shores, a beach along them, the island
  for (let x = 0; x < W; x++) {
    const n = Math.round(LAKE.north(x));
    const s = Math.round(LAKE.south(x));
    for (let u = 2060; u < 3940; u++) {
      if (u >= n && u < s) {
        for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) img.clear(x * S + i, Y(u + 1) + j);
      } else if (u >= n - 4 && u < s + 4) img.rect(x * S, Y(u + 1), S, S, 0xc8b890);
      else if (u < 2100 || u >= 3900) continue;
      else img.rect(x * S, Y(u + 1), S, S, 0x6c7c58);
    }
  }
  const [ix, iu, ir] = ISLAND;
  for (let u = iu - ir; u <= iu + ir; u++)
    for (let x = ix - ir; x <= ix + ir; x++) if ((x - ix) ** 2 + (u - iu) ** 2 <= ir * ir) rect(x, u, 1, 1, (x - ix) ** 2 + (u - iu) ** 2 > (ir - 2) ** 2 ? 0xc8b890 : 0x3c5a34);
  // Fuji: ridges and gullies running out from the crater, snow lying in the gullies near the top
  const [cx, cu, cr] = CRATER;
  for (let u = 5600; u < L; u += 1)
    for (let x = 0; x < W; x += 1) {
      const a = Math.atan2(u - cu, x - cx);
      const d = Math.hypot(x - cx, u - cu);
      const ridge = Math.sin(a * 22 + Math.sin(d / 40) * 0.6);
      if (ridge > 0.82) rect(x, u, 1, 1, scaleColor(zone(u), 1.25));
      else if (ridge < -0.85) rect(x, u, 1, 1, d < 700 && u > 6200 ? 0xe8eef4 : scaleColor(zone(u), 0.7));
    }
  for (let u = cu - cr - 6; u <= cu + cr + 6; u++)
    for (let x = 0; x < W; x++) {
      const d = Math.hypot(x - cx, u - cu);
      if (d < cr) rect(x, u, 1, 1, d < cr * 0.35 ? 0xe8eef4 : scaleColor(0x5a3426, 0.55 + (d / cr) * 0.4)); // the crater's floor and walls
      else if (d < cr + 6) rect(x, u, 1, 1, 0x8a5a44); // its rim
    }
  // the trail's zigzags up from the fifth station
  for (let k = 0, u = 5650; u < 6880; k++, u += 60) {
    const [x0, x1] = k % 2 ? [70, 120] : [120, 70];
    for (let i = 0; i <= 60; i++) rect(Math.round(x0 + ((x1 - x0) * i) / 60), u + i, 2, 1, 0xb0a090);
  }
  for (const [u] of ARENAS)
    for (let a = 0; a < 720; a++) {
      const t = (a / 720) * Math.PI * 2;
      img.rect(Math.round((90 + Math.cos(t) * 62) * S), Math.round(Y(u) + Math.sin(t) * 62 * S), 2, 2, 0xffd040);
    }
  for (let u = 0; u < L; u += 100) rect(0, u, u % 500 ? 4 : 10, 1, 0xffffff);
  return { strip: img, meta: { width: W, artScale: S, length: L } };
}
