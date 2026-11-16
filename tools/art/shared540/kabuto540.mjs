// KABUTO: an armoured ship in the shape of a samurai's helmet, seen from above. Its shoulder plates (sode) lie
// shut against the bowl while the guns rest and swing open as they fire, baring the barrels (three frames: shut,
// half open, open; each level and banking). Black lacquer, red lacing, a gold crest and horns. Layers as
// hullkit.mjs gives them (_p0 the lacquer, _p1 the lacing, _p2 the gold).
import { hullSheet } from './hullkit.mjs';

const W = 84;
const H = 72;
const CX = W / 2;
const MATS = ['K', 'R', 'Y'];
const STEEL = 0x8e93b0;

export function kabuto({ open = 0, bank = 0, layer = null } = {}) {
  const k = hullSheet(W, H, MATS, layer);
  const o = open / 2; // 0..1
  for (const side of [-1, 1]) {
    const narrow = bank === side ? 0.82 : 1;
    const lit = side < 0 ? 0.06 : -0.1;
    // the barrel bared as the plate swings out: a dark housing, the barrel forward of it
    if (open) {
      const gx = CX + side * (10 + o * 5) * narrow;
      k.facet([[gx - 3, 30], [gx + 3, 30], [gx + 3, 44], [gx - 3, 44]], 0, 0.3 + lit);
      k.facet([[gx - 1.6, 13 + (1 - o) * 8], [gx + 1.6, 13 + (1 - o) * 8], [gx + 1.6, 31], [gx - 1.6, 31]], 0, 0.5 + lit);
      for (let y = 15 + (1 - o) * 8; y < 30; y += 3) k.mark(gx - 0.5, y, STEEL, 0.9);
      if (open === 2) {
        k.dot(gx, 13, 1.8, 0x9ff0ff);
        k.dot(gx, 13, 0.9, 0xffffff);
      }
    }
    // the shoulder plate: four lames laced together, hinged at its top, swung out by `o`
    const hinge = [CX + side * (9 + o * 2) * narrow, 23];
    const tilt = side * o * 0.5;
    const rot = ([x, y]) => [hinge[0] + (x * Math.cos(tilt) - y * Math.sin(tilt)) * narrow, hinge[1] + x * Math.sin(tilt) + y * Math.cos(tilt)];
    for (let j = 3; j >= 0; j--) {
      const y0 = j * 8;
      const w = 15 - j * 1.2;
      const x0 = side * (1 + o * 5);
      const q = [[x0, y0], [x0 + side * w, y0 + 1.5], [x0 + side * (w + 1), y0 + 9.5], [x0, y0 + 8]].map(rot);
      k.facet(q, 0, 0.56 + lit + (j % 2 ? -0.1 : 0.06));
      // the lacing along its lower edge, gold rivets above it
      k.facet([[x0, y0 + 6.2], [x0 + side * (w + 0.8), y0 + 7.6], [x0 + side * (w + 1), y0 + 9.5], [x0, y0 + 8]].map(rot), 1, 0.6 + lit);
      for (let i = 1; i <= 3; i++) {
        const [rx, ry] = rot([x0 + side * (w * i) / 4, y0 + 3.4 + i * 0.3]);
        k.mark(rx, ry, 0xfff0a0);
      }
    }
    // the horns (kuwagata): two gold blades sweeping up and out of the brow
    k.feather([CX + side * 3.5, 25], -Math.PI / 2 + side * (0.52 + o * 0.12), 21, 6, 0.74 + lit, [[-1, 2]]);
    // the thrusters under the neck guard
    k.facet([[CX + side * 3, 58], [CX + side * 9, 58], [CX + side * 8, 66], [CX + side * 4, 66]], 0, 0.34 + lit);
    k.line(CX + side * 4.5, 65, CX + side * 7.5, 65, 0xffb040, 1);
  }
  // the neck guard (shikoro): three lames spreading behind the bowl, laced
  for (let j = 2; j >= 0; j--) {
    const y = 44 + j * 5;
    const w = 11 + j * 2.5;
    k.facet([[CX - w, y], [CX, y - 1], [CX, y + 6], [CX - w - 1, y + 6.5]], 0, 0.58 - j * 0.05);
    k.facet([[CX + w, y], [CX, y - 1], [CX, y + 6], [CX + w + 1, y + 6.5]], 0, 0.4 - j * 0.05);
    k.facet([[CX - w - 0.8, y + 4.8], [CX + w + 0.8, y + 4.8], [CX + w + 1, y + 6.5], [CX - w - 1, y + 6.5]], 1, 0.56);
  }
  // the bowl: ridged plates running from the crown to the brim, a gold boss on top, the red brim
  k.ell(CX, 35, 10.5, 13.5, 0, 0.08);
  for (let i = -3; i <= 3; i++) {
    for (let y = 23; y < 47; y++) {
      const x = CX + i * 3.1 * Math.sqrt(Math.max(0, 1 - ((y - 35) / 13.5) ** 2));
      k.mark(x, y, i < 0 ? 0x6a6480 : 0x0a0812, 0.55);
    }
  }
  k.facet([[CX - 10, 44], [CX + 10, 44], [CX + 9, 47.5], [CX - 9, 47.5]], 1, 0.6);
  k.dot(CX, 35, 2.4, 0xe2aa32);
  k.dot(CX - 0.6, 34.4, 1, 0xfff0a0);
  // the crest between the horns (maedate): a gold disc; under it the visor's slit, glowing
  k.ell(CX, 22.5, 4, 4, 2, 0.1);
  k.dot(CX, 22.5, 1.5, 0x9a5f10, 0.8);
  for (let x = -5; x <= 5; x++) k.mark(CX + x, 27.5, Math.abs(x) < 4 ? 0x9ff0ff : 0x3fb6e8, 0.95);
  return k.render();
}

export const KABUTO_FRAMES = [0, 1, 2].flatMap((open) => [['', 0], ['_l', -1], ['_r', 1]].map(([b, bank]) => [`${open ? `_f${open}` : ''}${b}`, { open, bank }]));
