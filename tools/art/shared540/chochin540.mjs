// CHŌCHIN-OBAKE: a paper lantern come alive: one big eye, a torn mouth, a long tongue. The flame inside it
// pulses (three frames), it blinks now and then (_b) and sticks its tongue right out at a bullet that grazes it
// (_t). Orange paper over bamboo ribs, black lacquer caps, a red tongue. Layers as hullkit.mjs gives them (_p0
// the paper, _p1 the lacquer, _p2 the red).
import { hullSheet } from './hullkit.mjs';

const W = 60;
const H = 78;
const CX = W / 2;
const MATS = ['O', 'K', 'R'];
const INK = 0x14121c;

export function lantern({ glow = 0, blink = false, tongue = false, layer = null } = {}) {
  const k = hullSheet(W, H, MATS, layer);
  const CY = 34;
  // the handle: a wire hoop over the top cap
  for (let a = Math.PI; a <= Math.PI * 2; a += 0.05) k.s.px(CX + Math.cos(a) * 9, 9 + Math.sin(a) * 7, 0x4c4662);
  // the paper body: a barrel between its caps
  k.ell(CX, CY, 23, 27, 0, 0.02 + glow * 0.05, (x, y) => y > 9 && y < 59);
  // the light of the flame inside, strongest low in the middle; the ribs: hoops of bamboo round it
  k.shade([0, 0, W, H], (x, y) => ((x - CX) / 15) ** 2 + ((y - CY - 5) / 17) ** 2 <= 1, 0.1 + glow * 0.09);
  k.shade([0, 0, W, H], (x, y) => ((x - CX) / 8) ** 2 + ((y - CY - 7) / 9) ** 2 <= 1, 0.06 + glow * 0.08);
  for (let y = 14; y < 58; y += 5.5) {
    const r = 23 * Math.sqrt(Math.max(0, 1 - ((y - CY) / 27) ** 2));
    for (let x = -r; x <= r; x += 0.5) k.mark(CX + x, y + (x / r) ** 2 * 1.6, 0x8a3a10, 0.5);
  }
  // the caps: black lacquer, a gold line round each
  k.facet([[CX - 13, 6], [CX + 13, 6], [CX + 15, 12], [CX - 15, 12]], 1, 0.6);
  k.facet([[CX - 15, 57], [CX + 15, 57], [CX + 12, 63], [CX - 12, 63]], 1, 0.42);
  k.line(CX - 14, 11, CX + 14, 11, 0xe2aa32, 0.9);
  k.line(CX - 14, 58, CX + 14, 58, 0xe2aa32, 0.9);
  // the mouth: a tear across the paper, ragged, the dark of the inside in it
  const my = 43;
  const jag = (x) => Math.abs(((x + 60) % 6) - 3) - 1.5;
  const half = tongue ? 5.5 : 3 + glow * 0.6;
  k.shape([CX - 16, my - 8, CX + 16, my + 8], (x, y) => Math.abs(x - CX) < 15 && Math.abs(y - my + jag(x) * 0.8) < half * (1 - ((x - CX) / 15) ** 2), 1, () => 0.2, 0);
  // the tongue: out of the mouth and down over the bottom cap (right out on a graze)
  const len = tongue ? 30 : 13 + glow;
  const tw = tongue ? 5.5 : 4.5;
  k.facet([[CX - tw, my], [CX + tw, my], [CX + tw, my + len - tw], [CX - tw, my + len - tw]], 2, 0.62);
  k.ell(CX, my + len - tw, tw, tw, 2, 0.04);
  k.line(CX, my + 2, CX, my + len - 3, 0x8a1a1e, 0.7);
  // the eye: one, big, a little to the upper left; shut to a lash line in a blink
  const ex = CX - 1;
  const ey = 25;
  if (blink) {
    for (let x = -9; x <= 9; x += 0.5) k.mark(ex + x, ey + (x / 9) ** 2 * 3, INK);
    for (const dx of [-6, 0, 6]) k.line(ex + dx, ey + (dx / 9) ** 2 * 3 + 1, ex + dx * 1.2, ey + 5, INK, 0.9);
  } else {
    for (let y = -8; y <= 8; y++) for (let x = -11; x <= 11; x++) {
      const d = (x / 10) ** 2 + (y / 7) ** 2;
      if (d <= 1) k.mark(ex + x, ey + y, d > 0.74 ? INK : 0xfffaf0);
    }
    k.dot(ex + 1 + glow * 0.5, ey + 0.5, 4.2, 0xd2361f);
    k.dot(ex + 1 + glow * 0.5, ey + 0.5, 2.3, INK);
    k.dot(ex - 1, ey - 1.5, 1.1, 0xffffff);
  }
  return k.render();
}

export const CHOCHIN_FRAMES = [['', { glow: 0 }], ['_f1', { glow: 1 }], ['_f2', { glow: 2 }], ['_b', { glow: 1, blink: true }], ['_t', { glow: 2, tongue: true }]];
