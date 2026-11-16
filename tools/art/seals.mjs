// The seals stamped where an enemy goes down (kind 'seal' in src/data/gacha.js; seal_<id> in the gachapon's
// atlas): a hanko's print in vermilion ink, 13 px across in the game (39 here): a sign inside a ring, or cut out
// of a filled square; the ink broken up a little, as a stamp's is.
import { Raster } from '../lib/raster.mjs';
import { hash } from '../lib/hisprite.mjs';

const N = 39;
const RED = 0xd2361f;
const DEEP = 0x8a1a1e;
const CREAM = 0xfff4e0;
const GOLD = 0xe2aa32;
const g2p = (v) => 8 + (v * 23) / 12; // the sign's 0..12 grid to pixels

const inPoly = (pts, x, y) => {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if (pts[i][1] > y !== pts[j][1] > y && x < ((pts[j][0] - pts[i][0]) * (y - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c;
  return c;
};
const star = (n, r0, r1) => Array.from({ length: n * 2 }, (_, i) => [6 + Math.sin((i / n) * Math.PI) * (i % 2 ? r1 : r0), 6 - Math.cos((i / n) * Math.PI) * (i % 2 ? r1 : r0)]);

// the signs: strokes [x0, y0, x1, y1], discs [x, y, r], rings [x, y, r], polygons, holes (discs cut back out)
const SIGNS = {
  maru: { rings: [[6, 6, 4.6]] },
  batsu: { strokes: [[1.5, 1.5, 10.5, 10.5], [10.5, 1.5, 1.5, 10.5]] },
  paw: { discs: [[6, 8, 3], [1.9, 5, 1.5], [4.4, 2.6, 1.5], [7.6, 2.6, 1.5], [10.1, 5, 1.5]] },
  star: { polys: [star(5, 6, 2.5)] },
  heart: { discs: [[3.6, 4.2, 2.9], [8.4, 4.2, 2.9]], polys: [[[0.9, 5.4], [11.1, 5.4], [6, 11.4]]] },
  sakura: { discs: [0, 1, 2, 3, 4].map((i) => [6 + Math.sin((i / 5) * Math.PI * 2) * 3.5, 6 - Math.cos((i / 5) * Math.PI * 2) * 3.5, 2.5]), holes: [[6, 6, 1.1]] },
  bolt: { polys: [[[8.5, 0], [2, 6.8], [5.6, 6.8], [3.5, 12], [10, 5.2], [6.4, 5.2]]] },
  skull: { discs: [[6, 5, 4.6]], polys: [[[3.2, 7], [8.8, 7], [8.8, 11.4], [3.2, 11.4]]], holes: [[4, 5.2, 1.3], [8, 5.2, 1.3], [6, 7.8, 0.7]], strokes: [] },
  dai: { strokes: [[1, 4, 11, 4], [6, 0.8, 6, 4], [6, 4, 1.5, 11.2], [6, 4, 10.5, 11.2]] },
  naka: { strokes: [[2, 3, 10, 3], [2, 8, 10, 8], [2, 3, 2, 8], [10, 3, 10, 8], [6, 0.5, 6, 11.5]] },
  yama: { strokes: [[6, 1, 6, 10.5], [1.5, 5, 1.5, 10.5], [10.5, 5, 10.5, 10.5], [1.5, 10.5, 10.5, 10.5]] },
  hi: { strokes: [[6, 1, 6, 5], [6, 5, 1.5, 11.2], [6, 5, 10.5, 11.2], [2, 3.2, 3.6, 6], [10, 3.2, 8.4, 6]] },
  ten: { strokes: [[2, 1.8, 10, 1.8], [1, 5.5, 11, 5.5], [6, 1.8, 6, 5.5], [6, 5.5, 1.5, 11.2], [6, 5.5, 10.5, 11.2]] },
  ou: { strokes: [[2, 1.5, 10, 1.5], [2.5, 6, 9.5, 6], [1, 10.5, 11, 10.5], [6, 1.5, 6, 10.5]] },
};

/** Is the pixel (x, y) part of the sign? */
function inSign(sign, x, y) {
  const gx = ((x + 0.5 - 8) * 12) / 23;
  const gy = ((y + 0.5 - 8) * 12) / 23;
  for (const [hx, hy, r] of sign.holes ?? []) if (Math.hypot(gx - hx, gy - hy) <= r) return false;
  for (const [dx, dy, r] of sign.discs ?? []) if (Math.hypot(gx - dx, gy - dy) <= r) return true;
  for (const [rx, ry, r] of sign.rings ?? []) if (Math.abs(Math.hypot(gx - rx, gy - ry) - r) <= 0.85) return true;
  for (const pts of sign.polys ?? []) if (inPoly(pts, gx, gy)) return true;
  for (const [x0, y0, x1, y1] of sign.strokes ?? []) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const t = Math.max(0, Math.min(1, ((gx - x0) * dx + (gy - y0) * dy) / (dx * dx + dy * dy || 1)));
    if (Math.hypot(gx - (x0 + dx * t), gy - (y0 + dy * t)) <= 0.85) return true;
  }
  return false;
}

/** style 'ring': the sign and a ring round it in ink; 'block': a square of ink, the sign left in the paper's colour. */
export function seal(id, style = 'ring', ink = RED, paper = CREAM) {
  const r = new Raster(N, N);
  const sign = SIGNS[id];
  const c = (N - 1) / 2;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const on = inSign(sign, x, y);
      const d = Math.hypot(x - c, y - c);
      let col = null;
      if (style === 'ring') {
        if (on || Math.abs(d - 17) <= 1.6) col = ink;
      } else {
        const edge = Math.max(Math.abs(x - c), Math.abs(y - c));
        const corner = Math.abs(x - c) > 15 && Math.abs(y - c) > 15 && Math.hypot(Math.abs(x - c) - 15, Math.abs(y - c) - 15) > 3.5;
        if (edge <= 18.5 && !corner) col = on ? paper : edge > 16.2 && style === 'block' ? DEEP : ink;
        if (col === DEEP && ink !== RED) col = 0x9a5f10;
      }
      if (col == null) continue;
      // (the ink did not take everywhere: specks of the paper showing through, more towards the edges)
      if (col !== paper && hash(x, y, 31) < 0.05 + Math.max(0, d - 12) * 0.012) continue;
      r.set(x, y, col === ink && hash(x >> 1, y >> 1, 9) < 0.25 ? (ink === RED ? 0xe2503a : 0xfff0a0) : col);
    }
  return r;
}

/** Every seal of the catalogue: [id, sign, style, ink]. */
export const SEALS = [
  ['maru', 'maru', 'ring'], ['batsu', 'batsu', 'ring'], ['paw', 'paw', 'ring'], ['star', 'star', 'ring'], ['heart', 'heart', 'ring'], ['sakura', 'sakura', 'ring'],
  ['bolt', 'bolt', 'ring'], ['skull', 'skull', 'ring'], ['dai', 'dai', 'ring'], ['naka', 'naka', 'ring'], ['yama', 'yama', 'ring'],
  ['hi', 'hi', 'block'], ['ten', 'ten', 'block'], ['ou', 'ou', 'block'], ['gold_dai', 'dai', 'block', GOLD], ['gold_sakura', 'sakura', 'block', GOLD],
];

export function sealArt() {
  return SEALS.map(([id, sign, style, ink]) => ({ name: `seal_${id}`, raster: seal(sign, style, ink ?? RED, ink ? 0x8a1a1e : CREAM) }));
}
