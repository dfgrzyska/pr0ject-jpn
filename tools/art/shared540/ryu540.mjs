// RYŪ: a dragon seen from above. The ship is its head (two frames: the jaws shut, and open while the guns fire);
// its body is a chain of segments that follow the head's path (_seg, and _tail for the last: see Player). Jade
// scales, a gold mane, horns and fins, red spines and whiskers. Every frame is drawn on a sheet of the same size
// (the paint jobs need that). Layers as hullkit.mjs gives them (_p0 the jade, _p1 the gold, _p2 the red).
import { hullSheet } from './hullkit.mjs';

const W = 66;
const H = 72;
const CX = W / 2;
const MATS = ['G', 'Y', 'R'];
const INK = 0x14121c;

/** Rows of scales over what is drawn round (cx, cy): pale arcs, each row half a scale across from the last. */
function scales(k, cx, cy, rx, ry) {
  for (let row = 0, y = cy - ry + 3; y < cy + ry - 1; y += 4, row++)
    for (let j = -4; j <= 4; j++) {
      const c = cx + j * 4.4 + (row % 2 ? 2.2 : 0);
      for (let a = 0; a <= Math.PI; a += 0.2) {
        const x = c + Math.cos(a) * 2.2;
        const yy = y + Math.sin(a) * 2.2;
        if (((x - cx) / (rx - 1.5)) ** 2 + ((yy - cy) / (ry - 1.5)) ** 2 <= 1) k.mark(x, yy, 0xa8f08e, 0.7);
      }
    }
}

export function dragon({ part = 'head', jaw = 0, layer = null } = {}) {
  const k = hullSheet(W, H, MATS, layer);
  if (part === 'seg' || part === 'tail') {
    const tail = part === 'tail';
    const cy = tail ? 28 : 36;
    const rx = tail ? 8 : 11;
    const ry = tail ? 12 : 14;
    if (tail) {
      // the tuft at its end: a fan of gold and red plumes
      for (const [a, len, r, v] of [[-0.7, 20, 1, 0.7], [0.7, 20, 1, 0.48], [-0.35, 26, 2, 0.66], [0.35, 26, 2, 0.46], [0, 30, 1, 0.6]]) k.feather([CX + a * 5, 34], Math.PI / 2 - a, len, 6, v, [[-1, r]]);
    } else {
      // a fin either side
      for (const side of [-1, 1]) k.feather([CX + side * 8, 36], Math.PI / 2 - side * 1.15, 13, 7, side < 0 ? 0.72 : 0.5, [[-1, 1]]);
    }
    k.ell(CX, cy, rx, ry, 0, 0.02);
    scales(k, CX, cy, rx, ry);
    // the spine down its back
    k.feather([CX, cy - ry * 0.55], Math.PI / 2, ry * 1.25, 5.5, 0.66, [[-1, 2]]);
    return k.render();
  }
  // ---- the head. Behind it the mane (short, dark gold); the antlers sweeping out and back over it, a tine on each
  for (const [a, len, v] of [[-1.2, 11, 0.5], [1.2, 11, 0.34], [-0.6, 14, 0.46], [0.6, 14, 0.32], [0, 16, 0.4]]) k.feather([CX + a * 6, 46], Math.PI / 2 - a * 0.7, len, 6.5, v, [[-1, 1]]);
  const reach = jaw ? 3 : 0;
  for (const side of [-1, 1]) {
    const lit = side < 0 ? 0.06 : -0.12;
    // a fin at the cheek
    k.feather([CX + side * 9, 40], Math.PI / 2 - side * 1.3, 12, 7, 0.6 + lit, [[-1, 1]]);
    // the whisker: one long barbel curving out from beside the nose and back along the head
    for (let t = 0; t <= 1; t += 0.02) {
      const u = 1 - t;
      const x = CX + side * (u * u * 5 + 2 * u * t * 24 + t * t * 25);
      const y = u * u * (14 + reach) + 2 * u * t * 4 + t * t * 34;
      k.ell(x, y, 1.5 - t * 0.5, 1.5 - t * 0.5, 2, lit);
    }
  }
  // the jaws open: a forked tongue out between them
  if (jaw) for (const a of [-0.3, 0.3]) k.feather([CX, 12], -Math.PI / 2 + a, 11, 2.6, 0.66, [[-1, 2]]);
  // the skull and the long snout, narrowing to the nose
  k.facet([[CX - 9, 34], [CX, 34], [CX, 9 + reach], [CX - 4.5, 9 + reach]], 0, 0.7);
  k.facet([[CX + 9, 34], [CX, 34], [CX, 9 + reach], [CX + 4.5, 9 + reach]], 0, 0.46);
  k.ell(CX, 10 + reach, 5, 4.2, 0, 0.04);
  k.ell(CX, 38, 12, 12.5, 0, 0.04);
  scales(k, CX, 39, 12, 12);
  for (const side of [-1, 1]) {
    // the antlers, bright over the mane
    const lit = side < 0 ? 0.06 : -0.12;
    k.feather([CX + side * 7, 41], Math.PI / 2 - side * 0.95, 27, 5, 0.92 + lit, [[-1, 1]]);
    k.feather([CX + side * 17, 49], Math.PI / 2 - side * 0.2, 11, 3.6, 0.86 + lit, [[-1, 1]]);
    // the fangs showing at the sides of the open jaws
    if (jaw) for (const y of [13, 17]) k.facet([[CX + side * 4.6, y], [CX + side * 4.6, y + 3], [CX + side * 7.6, y + 1.5]], 1, 0.95);
  }
  // the brow ridges, the eyes under them: gold, a slit of black; the nostrils
  for (const side of [-1, 1]) {
    k.facet([[CX + side * 3, 27], [CX + side * 11, 29], [CX + side * 10, 32.5], [CX + side * 3, 30.5]], 1, side < 0 ? 0.76 : 0.54);
    k.dot(CX + side * 6.4, 33.4, 2.5, INK);
    k.dot(CX + side * 6.4, 33.4, 1.8, 0xfff0a0);
    k.line(CX + side * 6.4, 31.8, CX + side * 6.4, 35, INK, 1);
    k.dot(CX + side * 2.4, 9.5 + reach, 1.1, INK, 0.9);
  }
  // the ridge down the snout, red spines along the top of the skull
  k.line(CX, 12 + reach, CX, 30, 0x1d6a3a, 0.7);
  for (let y = 16 + reach; y < 28; y += 4) k.line(CX - 3 - (y - 14) * 0.12, y, CX + 3 + (y - 14) * 0.12, y, 0x1d6a3a, 0.4);
  for (let j = 0; j < 3; j++) k.feather([CX, 36 + j * 5], Math.PI / 2, 6, 4, 0.66, [[-1, 2]]);
  return k.render();
}

export const RYU_FRAMES = [['', { jaw: 0 }], ['_f1', { jaw: 1 }], ['_seg', { part: 'seg' }], ['_tail', { part: 'tail' }]];
