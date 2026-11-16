// HOUOU, alive: the phoenix seen from above, its wings beating (three frames: spread, half raised, raised; each
// level and banking). Vermilion body and wings, gold coverts and crest, orange feather tips and tail plumes
// with their gold eyes. Layers for the paint jobs as hullkit.mjs gives them (_p0 vermilion, _p1 gold, _p2 orange).
import { hullSheet } from './hullkit.mjs';

const W = 84;
const H = 78;
const CX = W / 2;
const MATS = ['R', 'Y', 'Q'];
const INK = 0x2a1016;

export function phoenix({ flap = 0, bank = 0, layer = null } = {}) {
  const k = hullSheet(W, H, MATS, layer);
  const span = [35, 28, 20][flap];
  // the tail: three long plumes, swaying with the beat, a gold eye near the end of each
  const sway = [0, 1.5, 0][flap] - (flap === 2 ? 1.5 : 0);
  for (const [a, len, v] of [[-0.52, 24, 0.5], [0.52, 24, 0.38], [0, 30, 0.62]]) {
    const ang = Math.PI / 2 - a + sway * 0.03 * (a || 1);
    k.feather([CX + a * 7, 46], ang, len, 5, v, [[-1, 2], [0.55, 1], [0.66, 2]]);
    const ex = CX + a * 7 + Math.cos(ang) * len * 0.8;
    const ey = 46 + Math.sin(ang) * len * 0.8;
    k.dot(ex, ey, 1.9, 0xfff0a0);
    k.dot(ex, ey, 0.9, 0x1d5a8a);
  }
  // the wings: a fan of feathers out of each shoulder, the rear ones first; gold coverts over their roots
  for (const side of [-1, 1]) {
    const S = span * (bank === side ? 0.78 : 1);
    const sh = [CX + side * 5, 31];
    const lit = side < 0 ? 0.08 : -0.1;
    const n = 7;
    for (let i = n - 1; i >= 0; i--) {
      // (from the leading feather, a little forward of straight out, round to the trailing one; raised wings close up)
      const t = i / (n - 1);
      const a = -0.32 + t * (1.5 - flap * 0.16) - flap * 0.1;
      const len = S * (1 - 0.34 * t * t) * (i === 0 ? 0.94 : 1);
      const ang = side > 0 ? a : Math.PI - a;
      k.feather(sh, ang, len, 7.5 - t * 1.5, 0.62 + lit + (i % 2 ? -0.1 : 0.06) + flap * 0.03, [[-1, 0], [0.58, 1], [0.7, 2]]);
    }
    const X = (d) => CX + side * d;
    k.facet([[X(3), 24], [X(S * 0.56), 26 - flap * 1.5], [X(S * 0.5), 33], [X(4), 35]], 1, 0.74 + lit);
    k.facet([[X(4), 35], [X(S * 0.5), 33], [X(S * 0.4), 39], [X(4), 42]], 1, 0.5 + lit);
    // (rows of small feathers on the coverts)
    for (let j = 0; j < 4; j++) k.line(X(7 + j * S * 0.11), 27, X(6 + j * S * 0.1), 39, 0x9a5f10, 0.5);
    k.line(X(4), 35, X(S * 0.5), 33, 0x9a5f10, 0.55);
  }
  // the body, the breast's gold scales; the neck and the head, the beak and the crest
  k.ell(CX, 38, 7, 13.5, 0, 0.02);
  for (let j = 0; j < 4; j++) for (const dx of [-3, 0, 3]) k.dot(CX + dx + (j % 2 ? 1.5 : 0), 31 + j * 4.2, 1, 0xfff0a0, 0.75);
  k.ell(CX, 22, 4.2, 6, 0, 0.04);
  k.ell(CX, 16.5, 5, 5, 0, 0.08);
  k.facet([[CX - 2.6, 13], [CX, 5], [CX, 14]], 1, 0.82);
  k.facet([[CX + 2.6, 13], [CX, 5], [CX, 14]], 1, 0.52);
  for (const [dx, len] of [[-3.4, 9], [0, 11], [3.4, 9]]) k.feather([CX + dx * 0.6, 18], Math.PI / 2 + dx * 0.16, len, 2.6, 0.8 - Math.abs(dx) * 0.04, [[-1, 1], [0.7, 2]]);
  for (const sx of [-1, 1]) {
    k.dot(CX + sx * 3, 15, 1.2, INK);
    k.mark(CX + sx * 3 - 0.5, 14.4, 0xffffff);
  }
  // the body's shadow on the wings beside it
  k.shade([CX - 13, 26, CX + 13, 50], (x, y) => ((x - CX) / 10) ** 2 + ((y - 38) / 15.5) ** 2 <= 1 && ((x - CX) / 7) ** 2 + ((y - 38) / 13.5) ** 2 > 1, -0.14);
  return k.render();
}

export const HOUOU_FRAMES = [0, 1, 2].flatMap((flap) => [['', 0], ['_l', -1], ['_r', 1]].map(([b, bank]) => [`${flap ? `_f${flap}` : ''}${b}`, { flap, bank }]));
