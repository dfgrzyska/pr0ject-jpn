// KOINOBORI: a carp streamer seen from above, head first, its cloth body waving down its length (four frames of
// the wave). Blue cloth with rows of pale scales, a white band and a gold ring at the mouth, gold fins and a
// forked gold tail. Layers as hullkit.mjs gives them (_p0 the cloth, _p1 the white, _p2 the gold).
import { hullSheet } from './hullkit.mjs';

const W = 54;
const H = 84;
const CX = W / 2;
const MATS = ['B', 'F', 'Y'];
const INK = 0x14121c;

export function carp({ wave = 0, layer = null } = {}) {
  const k = hullSheet(W, H, MATS, layer);
  const ph = (wave * Math.PI) / 2;
  // the body's centre line: still at the mouth (it is held there), swinging wider towards the tail
  const xc = (y) => CX + Math.max(0, (y - 16) / 64) ** 1.3 * 9 * Math.sin(ph + y * 0.105);
  // half its width: the round head, the long taper, the tail flaring out
  const hw = (y) => (y < 6 ? 0 : y < 16 ? 6.5 + Math.sqrt(Math.max(0, 1 - ((16 - y) / 10) ** 2)) * 3.5 : y < 64 ? 10 - ((y - 16) / 48) * 5.2 : 4.8 + ((y - 64) / 16) ** 0.8 * 6.5);
  const inBody = (x, y) => y >= 6 && y <= 80 && Math.abs(x - xc(y)) <= hw(y) && !(y > 72 && Math.abs(x - xc(y)) < (y - 72) * 0.7); // (the tail's fork)
  const light = (x, y) => {
    const d = (x - xc(y)) / Math.max(1, hw(y));
    return 0.66 - d * 0.2 - d * d * 0.26 + Math.sin(ph + y * 0.105 + 1.2) * 0.07; // (a tube of cloth, its folds catching the light)
  };
  const band = (r, from, to) => k.shape([0, from, W, to], (x, y) => inBody(x, y) && y >= from && y < to, r, light);
  // the fins first (the body lies on them): a pair behind the head, a small pair further down
  for (const side of [-1, 1]) {
    k.feather([xc(26) + side * 7, 26], Math.PI / 2 - side * 1.05, 12, 6, side < 0 ? 0.74 : 0.5, [[-1, 2]]);
    k.feather([xc(48) + side * 5, 48], Math.PI / 2 - side * 0.9, 8, 4.5, side < 0 ? 0.7 : 0.46, [[-1, 2]]);
  }
  band(2, 6, 9.5); // the mouth's ring
  band(1, 9.5, 14); // the white band
  band(0, 14, 64);
  band(2, 64, 81); // the tail
  // the scales: rows of pale arcs, each row half a scale across from the last
  for (let row = 0, y = 22; y < 62; y += 5, row++)
    for (let j = -3; j <= 3; j++) {
      const c = xc(y) + j * 5 + (row % 2 ? 2.5 : 0);
      for (let a = 0; a <= Math.PI; a += 0.18) {
        const x = c + Math.cos(a) * 2.5;
        const yy = y + Math.sin(a) * 2.6;
        if (Math.abs(x - xc(yy)) < hw(yy) - 1) k.mark(x, yy, 0xcfe4ff, 0.75);
      }
    }
  // a row of white along the back, the tail's rays
  for (let y = 16; y < 62; y += 1) k.mark(xc(y), y, 0xffffff, y % 5 < 3 ? 0.55 : 0.2);
  for (let j = -2; j <= 2; j++) k.line(xc(66) + j * 1.6, 66, xc(80) + j * 4.2, 80, 0x9a5f10, 0.55);
  // the eyes: big, white, ringed
  for (const side of [-1, 1]) {
    const ex = CX + side * 5.2;
    k.dot(ex, 17.5, 3.4, INK);
    k.dot(ex, 17.5, 2.6, 0xffffff);
    k.dot(ex, 17.8, 1.4, INK);
    k.mark(ex - 1, 16.6, 0xffffff);
  }
  k.line(CX - 5, 14, CX + 5, 14, 0x1c2f8a, 0.6);
  return k.render();
}

export const KOINOBORI_FRAMES = [0, 1, 2, 3].map((wave) => [wave ? `_f${wave}` : '', { wave }]);
