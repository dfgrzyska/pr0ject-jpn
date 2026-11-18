// Onomichi's middle layer. For now a block-out only (phase 0 of docs/plan-onomichi.md): the stretches as plain
// ground, the sea left open to the far layer (Innoshima's strait, the Onomichi strait across and then up the left
// edge), the bridges, the railway along the foot of the hillside, the arcade, the hillside's terraces, the ropeway,
// the two arenas ringed, a ruler up the left edge (a tick every 100 u, a long one every 500). The route proper comes
// in phase 1.
import { Raster, mix, scaleColor } from '../../lib/raster.mjs';
import { W, S, L, SECTIONS, isSea, OHASHI, TWINS, RAIL, ARCADE, ROPEWAY, ARENAS, suidoShores } from './route.mjs';

const hash = (a, b) => {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

export function buildMid() {
  const img = new Raster(W * S, L * S);
  const Y = (u) => (L - u) * S; // strip row of a height u
  const rect = (x, u0, w, h, c) => img.rect(Math.round(x * S), Y(u0 + h), Math.round(w * S), h * S, c);
  for (const [from, to, , , ground] of SECTIONS) {
    for (let u = from; u < to; u += 16)
      for (let x = 0; x < W; x += 20) {
        const k = hash(Math.floor(x / 20), Math.floor(u / 16) + 11);
        rect(x, u, 20, Math.min(16, to - u), scaleColor(mix(ground, 0x202028, k * 0.18), 0.92 + k * 0.16));
      }
    rect(0, from, W, 2, 0xf0e8d0); // the stretch's edge
  }
  // the hillside past the bend: terraces stepping up to the right of the railway, each wall a dark line
  for (let u = 2900; u < 6600; u += 12)
    for (let x = RAIL.x(u) + 6; x < W; x += 1) if (Math.sin(x / 7 + u / 40) > 0.94) rect(x, u, 1, 12, 0x3e3a34);
  for (let u = 2900; u < 6600; u += 12) rect(RAIL.x(u) + 6, u, W - RAIL.x(u) - 6, 1, 0x4a443c);
  // the sea: open, a beach and a quay wall round it
  for (let u = 0; u < L; u++)
    for (let x = 0; x < W; x++) {
      if (isSea(x, u)) {
        for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) img.clear(x * S + i, Y(u + 1) + j);
      } else if (isSea(x - 2, u) || isSea(x + 2, u) || isSea(x, u - 2) || isSea(x, u + 2)) rect(x, u, 1, 1, u > 2700 ? 0x9a968a : 0xc8b890);
    }
  // the railway from the bend to the station, the arcade beside it
  for (let u = RAIL.from; u < L; u++) rect(RAIL.x(u), u, 4, 1, u % 4 ? 0x3a3634 : 0x6a5a48);
  rect(ARCADE.x, ARCADE.from, 12, ARCADE.to - ARCADE.from, 0xa8b0b8);
  // the bridges: their decks, and the towers
  rect(OHASHI.x - 4, OHASHI.from, 8, OHASHI.to - OHASHI.from, 0x8a8c90);
  for (const t of OHASHI.towers) rect(OHASHI.x - 7, t - 3, 14, 6, 0xd0d4d8);
  for (const b of TWINS) rect(b.x - 3, b.from, 6, b.to - b.from, 0x8a8c90);
  // the ferries' crossings over the strait past the bend
  for (const u of [3300, 5600, 6500]) {
    const [w, e] = suidoShores(u);
    for (let x = Math.ceil(w); x < e; x += 4) rect(x, u, 2, 1, 0xf0e8d0);
  }
  // the ropeway
  const [[x0, u0], [x1, u1]] = ROPEWAY;
  for (let i = 0; i <= 200; i++) rect(x0 + ((x1 - x0) * i) / 200, Math.round(u0 + ((u1 - u0) * i) / 200), 1, 1, 0x202020);
  for (const [u] of ARENAS)
    for (let a = 0; a < 720; a++) {
      const t = (a / 720) * Math.PI * 2;
      img.rect(Math.round((90 + Math.cos(t) * 62) * S), Math.round(Y(u) + Math.sin(t) * 62 * S), 2, 2, 0xffd040);
    }
  for (let u = 0; u < L; u += 100) rect(0, u, u % 500 ? 4 : 10, 1, 0xffffff);
  return { strip: img, meta: { width: W, artScale: S, length: L } };
}
