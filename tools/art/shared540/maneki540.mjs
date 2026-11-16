// MANEKI-NEKO: the lucky cat, sitting, a gold koban held to its belly, its left paw beckoning with every volley
// (three frames: the paw up by the ear, half down, down). White porcelain with calico patches, a red collar and
// ears, a gold bell and coin. Layers as hullkit.mjs gives them (_p0 the porcelain, _p1 the red, _p2 the gold).
import { hullSheet } from './hullkit.mjs';

const W = 66;
const H = 78;
const CX = W / 2;
const MATS = ['F', 'R', 'Y'];
const INK = 0x14121c;

export function cat({ paw = 0, layer = null } = {}) {
  const k = hullSheet(W, H, MATS, layer);
  // the tail curling out behind, the haunches and the body
  k.ell(CX + 17, 62, 6, 9, 0, -0.08);
  k.ell(CX - 11, 66, 9, 7, 0, -0.02);
  k.ell(CX + 11, 66, 9, 7, 0, -0.1);
  k.ell(CX, 54, 17, 18, 0, 0.02);
  // the ears: red inside
  for (const side of [-1, 1]) {
    k.facet([[CX + side * 6, 12], [CX + side * 15, 2], [CX + side * 18, 17]], 0, side < 0 ? 0.78 : 0.52);
    k.facet([[CX + side * 9.5, 12], [CX + side * 14.5, 6], [CX + side * 16, 14.5]], 1, side < 0 ? 0.66 : 0.5);
  }
  // the beckoning arm and its paw: up by the ear, coming down
  const py = [15, 22, 30][paw];
  const px = CX - [21, 23, 22][paw];
  k.facet([[CX - 14, 46], [CX - 9, 40], [px + 5, py + 2], [px - 3, py + 5]], 0, 0.7);
  k.ell(px, py, 6.5, 6, 0, 0.08);
  for (const dx of [-3, 0, 3]) k.line(px + dx, py - 5 + (paw === 2 ? 7 : 0), px + dx, py - 2 + (paw === 2 ? 7 : 0), 0x8e8b96, 0.7);
  // the head
  k.ell(CX, 23, 18, 14.5, 0, 0.06);
  // the calico patches: orange over one ear and brow, black over the other
  for (let y = 9; y < 20; y++) for (let x = -17; x < -3; x++) if (((x + 11) / 7) ** 2 + ((y - 13) / 6) ** 2 <= 1) k.mark(CX + x, y, 0xf58220, 0.85);
  for (let y = 9; y < 18; y++) for (let x = 5; x < 17; x++) if (((x - 11) / 6) ** 2 + ((y - 12.5) / 5) ** 2 <= 1) k.mark(CX + x, y, 0x2a2638, 0.85);
  for (let y = 44; y < 60; y++) for (let x = 8; x < 18; x++) if (((x - 14) / 5) ** 2 + ((y - 52) / 8) ** 2 <= 1) k.mark(CX + x, y, 0xf58220, 0.8);
  // the face: eyes shut in a smile, a pink nose, the mouth, whiskers, a blush
  for (const side of [-1, 1]) {
    for (let a = Math.PI; a <= Math.PI * 2; a += 0.08) {
      k.mark(CX + side * 7.5 + Math.cos(a) * 4, 24 + Math.sin(a) * 3, INK);
      k.mark(CX + side * 7.5 + Math.cos(a) * 4, 24.8 + Math.sin(a) * 3, INK);
    }
    k.dot(CX + side * 11.5, 29, 2.2, 0xff9ab0, 0.55);
    for (const dy of [-1.5, 1.5]) k.line(CX + side * 9, 29 + dy * 0.6, CX + side * 17, 28 + dy * 1.6, 0x55525c, 0.7);
    for (let a = 0; a <= Math.PI; a += 0.12) k.mark(CX + side * 2.2 + Math.cos(a) * 2.2, 29.5 + Math.sin(a) * 2, INK, 0.9);
  }
  k.dot(CX, 27.6, 1.5, 0xf08bb0);
  // the collar and its bell
  k.shape([CX - 16, 35, CX + 16, 41], (x, y) => Math.abs(x - CX) < 14.5 && Math.abs(y - 37.6 - ((x - CX) / 14.5) ** 2 * -1.5) < 2, 1, (x) => 0.66 - ((x - CX) / 14.5) * 0.18);
  k.ell(CX, 41, 3.6, 3.6, 2, 0.1);
  k.line(CX - 2, 42, CX + 2, 42, 0x9a5f10, 0.9);
  k.dot(CX, 43.3, 0.8, 0x9a5f10);
  // the other paw, holding the koban to the belly: a gold oval, its stamps
  k.ell(CX + 4, 56, 8, 11, 2, 0.04);
  for (const [dy, w] of [[-6, 3], [-2, 4.5], [2, 4.5], [6, 3]]) k.line(CX + 4 - w, 56 + dy, CX + 4 + w, 56 + dy, 0x9a5f10, 0.75);
  k.ell(CX + 13, 50, 5.5, 5, 0, -0.04);
  for (const dx of [-2.5, 0, 2.5]) k.line(CX + 13 + dx, 46.5, CX + 13 + dx, 49, 0x8e8b96, 0.7);
  // the toes of the hind paws
  for (const side of [-1, 1]) for (const dx of [-3, 0, 3]) k.line(CX + side * 11 + dx, 68, CX + side * 11 + dx, 71, 0x8e8b96, 0.7);
  return k.render();
}

export const MANEKI_FRAMES = [0, 1, 2].map((paw) => [paw ? `_f${paw}` : '', { paw }]);
