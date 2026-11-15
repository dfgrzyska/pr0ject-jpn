// The arena of encounter 5 (ex5): the hikikomori's wall, papered with "posters" in the manner of Tōshūsai
// Sharaku's actor portraits (1794, long in the public domain): big kabuki heads on a dark mica ground, white faces,
// shaved pates and topknots, crossed eyes under furious brows, a hooked nose, a turned-down red mouth, clawed hands,
// the cartouche and seal in a corner. Gone otaku: one wears headphones, one grips a game controller, one has cat
// ears; they are taped up crooked, edge to edge, on a wall lit only by a screen. None copies a particular print.
import { Raster, fbm, rng, mix } from '../../lib/raster.mjs';
import { grade } from '../nature.mjs';
import { tintTable } from '../props.mjs';

export const S = 3;
const W = 180;
const L = 896;
const FW = W * S;
const FH = L * S;
const PW = 240;
const PH = 330;
const INK = 0x16121a;
const SKIN = 0xf2e8da;
const KIMONO = [0x3a5a3a, 0x7a2a26, 0x2a2e52, 0x8a6a34, 0x4a2a4a];

function wallAt(x, y) {
  // dim wallpaper, faint stripes, the screen's blue glow
  const n = fbm(x, y, { seed: 2, scale: 30, periodX: FW }) - 0.5;
  return mix(0x2e2a3a, 0x3c3850, 0.4 + n * 0.5 + (Math.floor(x / 18) % 2 ? 0.08 : 0));
}

export function buildFar() {
  const r = new Raster(FW, 1152);
  for (let y = 0; y < r.h; y++) for (let x = 0; x < FW; x++) r.set(x, y, wallAt(x, y));
  return r;
}

/** One poster: an actor's big head on mica, in the old manner, with a twist (0 plain, 1 headphones, 2 a controller, 3 cat ears). */
export function poster(seed, twist) {
  const p = new Raster(PW, PH);
  const rand = rng(seed);
  const ell = (cx, cy, rx, ry) => (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
  const fill = (test, c, box = [0, 0, PW, PH]) => {
    for (let y = box[1]; y < box[3]; y++) for (let x = box[0]; x < box[2]; x++) if (test(x, y)) p.set(x, y, typeof c === 'function' ? c(x, y) : c);
  };
  const stroke = (x0, y0, x1, y1, w, c) => {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
    for (let k = 0; k <= n; k++) {
      const x = x0 + ((x1 - x0) * k) / n;
      const y = y0 + ((y1 - y0) * k) / n;
      const ww = typeof w === 'function' ? w(k / n) : w;
      fill(ell(x, y, ww, ww), c, [Math.floor(x - ww - 1), Math.floor(y - ww - 1), Math.ceil(x + ww + 1), Math.ceil(y + ww + 1)]);
    }
  };
  const cx = 120 + Math.floor(rand() * 10) - 5;
  // the mica ground: dark, glinting
  fill(() => true, (x, y) => (rand() < 0.012 ? 0x8a8494 : mix(0x26232c, 0x34303a, fbm(x, y, { seed, scale: 9 }))));
  // the kimono: shoulders, a crest on each
  const robe = KIMONO[Math.floor(rand() * KIMONO.length)];
  fill((x, y) => y > 250 - Math.max(0, 70 - Math.abs(x - cx)) * 0.4 && Math.abs(x - cx) < 40 + (y - 230) * 1.6, (x, y) => mix(robe, 0x000000, (x - cx) / 400 + 0.1));
  fill((x, y) => y > 268 && Math.abs(x - cx) < 22 - (y - 268) * 0.2, 0xe8e0d0); // the white under-collar
  for (const sx of [-1, 1]) {
    fill(ell(cx + sx * 72, 296, 13, 13), 0xe8e0d0);
    fill(ell(cx + sx * 72, 296, 7, 7), robe);
  }
  // neck and face, the jaw set
  fill((x, y) => y > 190 && y < 275 && Math.abs(x - cx) < 22, (x) => (x > cx + 12 ? 0xd8ccbc : SKIN));
  fill((x, y) => ell(cx, 160, 50, 68)(x, y) && y < 220, (x, y) => (x > cx + 34 || y > 210 ? 0xdcd0c0 : SKIN));
  // the hair: black round the back and sides, the shaved pate blue-grey, the topknot over it
  fill((x, y) => ell(cx, 112, 60, 42)(x, y) && !ell(cx, 168, 49, 64)(x, y), INK);
  fill((x, y) => ell(cx - 4, 98, 40, 20)(x, y) && y < 112, 0x8a96aa);
  stroke(cx - 6, 74, cx + 34, 62, 6, INK);
  stroke(cx + 34, 62, cx + 44, 70, 5, INK);
  for (const sx of [-1, 1]) fill((x, y) => ell(cx + sx * 50, 150, 10, 30)(x, y), INK); // the side locks
  // the brows, furious; the eyes crossed; the red lines round them (kumadori) on some
  const fury = 0.7 + rand() * 0.6;
  for (const sx of [-1, 1]) {
    stroke(cx + sx * 40, 128 - fury * 10, cx + sx * 9, 138 + fury * 4, (t) => 4 + t * 3, INK);
    const ex = cx + sx * 24;
    fill((x, y) => Math.abs(y - 152) < 7 * (1 - ((x - ex) / 15) ** 2), 0xfffaf0, [ex - 16, 144, ex + 16, 160]);
    stroke(ex - 15, 152, ex + 15, 150 - sx * 3, 1.2, INK);
    fill(ell(ex - sx * 6, 152, 3.5, 4.5), INK); // the pupils, both towards the nose
    if (seed % 2) stroke(ex - 16, 160, ex + 14, 164 + sx * 2, 1.4, 0xc02a26);
  }
  // the hooked nose, the mouth turned down hard
  stroke(cx + 2, 146, cx - 6, 192, 1.6, INK);
  stroke(cx - 6, 192, cx + 6, 196, 1.6, INK);
  stroke(cx - 22, 216, cx - 10, 210, 2.4, 0xc02a26);
  stroke(cx - 10, 210, cx + 12, 211, 2.4, 0xc02a26);
  stroke(cx + 12, 211, cx + 22, 220, 2.4, 0xc02a26);
  // the twist
  if (twist === 1) {
    stroke(cx - 56, 140, cx - 40, 76, 5, 0x2a2a34);
    stroke(cx - 40, 76, cx + 40, 76, 5, 0x2a2a34);
    stroke(cx + 40, 76, cx + 56, 140, 5, 0x2a2a34);
    for (const sx of [-1, 1]) {
      fill(ell(cx + sx * 56, 150, 14, 20), 0x3a3a46);
      fill(ell(cx + sx * 56, 150, 4, 4), 0xff6ab0);
    }
  } else if (twist === 2) {
    // gripping a game pad up by the chin, in the clawed hands of the old prints
    fill((x, y) => Math.abs(x - cx) < 46 && Math.abs(y - 262) < 14 && !(Math.abs(x - cx) < 14 && y > 268), 0x4a4a56);
    for (const sx of [-1, 1]) fill(ell(cx + sx * 40, 268, 13, 14), 0x4a4a56);
    fill(ell(cx - 30, 260, 4, 4), 0xd0d0d8);
    for (const [dx, dy, c] of [[30, 254, 0xe04a4a], [38, 262, 0x4ab84a], [22, 262, 0x4a6ae0], [30, 270, 0xe0c040]]) fill(ell(cx + dx, dy, 3, 3), c);
    for (const sx of [-1, 1]) for (let f = 0; f < 4; f++) stroke(cx + sx * (56 - f * 7), 250, cx + sx * (52 - f * 8), 236 - (f % 2) * 6, 3, SKIN);
  } else if (twist === 3) {
    for (const sx of [-1, 1]) fill((x, y) => y < 90 && y > 34 && Math.abs(x - (cx + sx * 38)) < (y - 34) * 0.42, INK);
    for (const sx of [-1, 1]) fill((x, y) => y < 86 && y > 50 && Math.abs(x - (cx + sx * 38)) < (y - 50) * 0.25, 0xd07a8a);
  } else {
    // the clawed hands raised at the edge of the frame
    for (let f = 0; f < 5; f++) stroke(30 + f * 9, 300, 22 + f * 11, 250 - (f % 2) * 10, 3.5, SKIN);
  }
  // the cartouche and the seal
  fill((x, y) => x > 186 && x < 224 && y > 16 && y < 96, 0xe8dcc0);
  for (let c = 0; c < 2; c++) for (let k = 0; k < 7; k++) if (rand() < 0.85) stroke(214 - c * 16, 24 + k * 10, 214 - c * 16, 29 + k * 10, 1.4, INK);
  fill((x, y) => x > 196 && x < 214 && y > 102 && y < 120, 0xc02a26);
  return p;
}

export function buildMid() {
  const img = new Raster(FW, FH);
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) img.set(x, y, wallAt(x, y));
  const rand = rng(23);
  // the posters, two across, staggered, crooked, taped at the corners
  let n = 0;
  const K = 0.72; // (drawn at 240 x 330, put up a little smaller: three across)
  for (let row = 0; row * 236 - 120 < FH; row++)
    for (let col = 0; col < 3; col++) {
      const pcx = 92 + col * 178 + (rand() - 0.5) * 16;
      const pcy = row * 236 + (col % 2 ? 118 : 0) + (rand() - 0.5) * 20;
      const ang = (rand() - 0.5) * 0.12;
      const p = poster(31 + n * 7, n % 4);
      n++;
      const ca = Math.cos(ang);
      const sa = Math.sin(ang);
      const R = (Math.hypot(PW, PH) / 2) * K + 4;
      for (let y = Math.floor(pcy - R); y < pcy + R; y++)
        for (let x = Math.floor(pcx - R); x < pcx + R; x++) {
          if (x < 0 || x >= FW || y < 0 || y >= FH) continue;
          const dx = x - pcx;
          const dy = y - pcy;
          const sx = Math.floor((dx * ca + dy * sa) / K + PW / 2);
          const sy = Math.floor((-dx * sa + dy * ca) / K + PH / 2);
          if (sx >= 0 && sx < PW && sy >= 0 && sy < PH) img.set(x, y, p.get(sx, sy));
          else if (sx >= 6 && sx < PW + 6 && sy >= 6 && sy < PH + 8) img.set(x, y, 0x0a0812, 0.4); // its shadow
        }
      // tape at two corners
      for (const [tx, ty] of [[(-PW / 2) * K, (-PH / 2) * K], [(PW / 2) * K, (-PH / 2) * K]]) {
        const qx = pcx + tx * ca - ty * sa;
        const qy = pcy + tx * sa + ty * ca;
        for (let j = -6; j < 6; j++) for (let i = -12; i < 12; i++) img.set(qx + i, qy + j + i * (tx < 0 ? 0.4 : -0.4), 0xe8dcb0, 0.55);
      }
    }
  grade(img, { sat: 0.78, bright: 0.52, tint: 0x203060, tintAmt: 0.1 });
  return {
    strip: img,
    props: null,
    meta: { width: W, artScale: S, chunkHeight: L, chunks: 1, length: L, tint: tintTable(L, () => [255, 255, 255]) },
  };
}
