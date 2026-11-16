// The turrets' pods out of the gachapon (kind 'pod' in src/data/gacha.js; pod_<id> in the gachapon's atlas): what
// sits on the wing tips with the purple power-up instead of the violet pod. 7 x 8 px in the game (21 x 24 here),
// each a small thing of its own, lit from the upper left, an ink line round it: a daruma, a paper lantern, a
// skewer of dango, a bamboo cannon, a kokeshi doll, a shrine's bell, a sake flask, an octopus.
import { Raster } from '../lib/raster.mjs';
import { wingTurret } from './turret.mjs';

const W = 21;
const H = 24;
const SS = 4;
const INK = 0x14121c;
const rgb = (c) => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
const hex = (c) => (Math.round(c[0]) << 16) | (Math.round(c[1]) << 8) | Math.round(c[2]);
const mix = (a, b, t) => {
  const k = Math.max(0, Math.min(1, t));
  const A = rgb(a);
  const B = rgb(b);
  return A.map((v, i) => v + (B[i] - v) * k);
};
const flat = rgb;
const ell = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
/** How lit a point of a blob is (0 its shade, 1 its light), the light coming from the upper left. */
const lit = (x, y, cx, cy, rx, ry) => 0.55 - ((x - cx) / rx) * 0.3 - ((y - cy) / ry) * 0.38;

/** `at(x, y)` (px from the middle) -> a colour or null, sampled 4 x 4 a pixel; then an ink line round it. */
function paint(at) {
  const out = new Raster(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const sum = [0, 0, 0];
      let n = 0;
      for (let j = 0; j < SS; j++)
        for (let i = 0; i < SS; i++) {
          const c = at(x + (i + 0.5) / SS - W / 2, y + (j + 0.5) / SS - H / 2);
          if (!c) continue;
          n++;
          for (let k = 0; k < 3; k++) sum[k] += c[k];
        }
      if (n >= SS * SS * 0.4) out.set(x, y, hex(sum.map((v) => v / n)));
    }
  const solid = (x, y) => x >= 0 && y >= 0 && x < W && y < H && out.alpha(x, y) > 0;
  const edge = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) edge.push([x, y]);
  for (const [x, y] of edge) out.set(x, y, INK);
  return out;
}

// a daruma: red, round, its face in a cream window (brows, eyes, a mouth), a gold sign on its belly, a gold muzzle
const daruma = (x, y) => {
  if (Math.abs(x) < 1.6 && y > -10.4 && y < -6) return mix(0x9a5f10, 0xffe080, 0.6 - x * 0.3);
  if (!ell(x, y, 0, 2, 8.2, 8.4) || y > 9.8) return null;
  if (ell(x, y, 0, -0.6, 5.5, 4.3)) {
    for (const s of [-1, 1]) {
      if (Math.hypot(x - s * 2.3, y + 0.3) < 1.2) return flat(INK);
      if (Math.abs(y + 2.7 + (x - s * 2.3) * s * 0.3) < 0.55 && Math.abs(x - s * 2.4) < 2.1) return flat(INK);
    }
    if (Math.abs(y - 2.2) < 0.5 && Math.abs(x) < 1.5) return flat(0xb83a1a);
    return mix(0xd0a880, 0xfff4e0, lit(x, y, 0, -0.6, 5.5, 4.3) + 0.3);
  }
  if (y > 5 && y < 9.4 && (Math.abs(x) < 0.6 || (Math.abs(y - 6.3) < 0.55 && Math.abs(x) < 2.7) || (Math.abs(y - 8.3) < 0.5 && Math.abs(x) < 1.8))) return flat(0xf4cc58);
  return mix(0x7a0c10, 0xf85a3a, lit(x, y, 0, 2, 8.2, 8.4));
};

// a paper lantern: red paper over ribs, glowing from inside, black caps, a sign brushed on it
const lantern = (x, y) => {
  if (Math.abs(x) < 1.3 && y > -10.4 && y < -8.6) return flat(0xf4cc58);
  if (Math.abs(x) < 4.2 && ((y > -9 && y < -6.8) || (y > 8 && y < 10.2))) return mix(0x14121c, 0x5a5668, 0.5 - x * 0.12);
  if (!ell(x, y, 0, 0.6, 8, 8.2)) return null;
  if ((Math.abs(x) < 0.7 && Math.abs(y - 0.8) < 3.6) || (Math.abs(y + 0.9) < 0.6 && Math.abs(x) < 2.7) || (Math.abs(y - 2.3) < 0.55 && Math.abs(x) < 2)) return flat(0x2a1010);
  const rib = Math.abs(((y + 12) % 2.7) - 1.35) > 1.0;
  const glow = Math.max(0, 1 - Math.hypot(x / 6, (y - 0.6) / 6.5));
  const c = mix(0xa81410, 0xffa040, lit(x, y, 0, 0.6, 8, 8.2) * 0.55 + glow * 0.6);
  return rib ? c.map((v) => v * 0.7) : c;
};

// dango: three dumplings on a skewer, pink, white and green, a glint on each
const dango = (x, y) => {
  for (const [cy, lo, hi] of [[-5.4, 0xc05878, 0xffd0de], [0.6, 0xb8a890, 0xffffff], [6.6, 0x427a24, 0xc8f088]]) {
    if (Math.hypot(x, y - cy) > 3.9) continue;
    if (Math.hypot(x + 1.4, y - cy + 1.5) < 0.75) return flat(0xffffff);
    return mix(lo, hi, lit(x, y, 0, cy, 3.9, 3.9) + 0.1);
  }
  if (Math.abs(x) < 0.75 && y > -10.5 && y < 10.6) return mix(0x7a5a2a, 0xe8c888, 0.5 - x * 0.5);
  return null;
};

// a bamboo cannon: a green cane, its nodes, its dark bore at the top, a rope bound round its foot
const bamboo = (x, y) => {
  if (Math.abs(x) > 4.7 || y < -10.4 || y > 10.4) return null;
  if (y < -8.2) return ell(x, y, 0, -9.3, 3.3, 0.9) ? flat(0x16240f) : flat(0xe4f4a8);
  const t = 0.52 - (x / 4.7) * 0.45;
  if (y > 6.4 && y < 8.6) return (((x + y * 1.4 + 40) % 2.4) < 1.2 ? mix(0xa89060, 0xf4ead2, t + 0.2) : mix(0x76603a, 0xc8b48c, t + 0.2));
  for (const n of [-2.6, 3.4]) {
    if (Math.abs(y - n) < 0.55) return mix(0x123a12, 0x3a7a2a, t);
    if (y > n - 1.5 && y < n - 0.55) return mix(0x5aa03a, 0xe0f890, t);
  }
  return mix(0x1f5a22, 0xb4e06a, t);
};

// a kokeshi: a wooden doll, black hair cut straight, a small face, red bands and a flower on its body
const kokeshi = (x, y) => {
  if (Math.hypot(x, y + 5.4) <= 5) {
    if (y < -7.5 - Math.abs(x) * 0.1 || (Math.abs(x) > 3.7 && y < -4.2)) return mix(0x14121c, 0x545068, 0.35 - x * 0.08 - (y + 8) * 0.12);
    if (Math.hypot(Math.abs(x) - 1.9, y + 5.2) < 0.75) return flat(INK);
    if (Math.hypot(x, y + 3) < 0.7) return flat(0xd2361f);
    if (Math.hypot(Math.abs(x) - 3, y + 3.8) < 0.9) return flat(0xf7a8a0);
    return mix(0xd0a070, 0xfff0d8, lit(x, y, 0, -5.4, 5, 5) + 0.25);
  }
  const half = 3.7 + y * 0.09;
  if (y < -1.4 || y > 10.4 || Math.abs(x) >= half) return null;
  const t = 0.5 - (x / half) * 0.42;
  if ((y > -0.2 && y < 1.4) || (y > 8.4 && y < 9.7)) return mix(0x8a1a1e, 0xf0503a, t);
  if (Math.hypot(x, y - 4.9) < 0.9) return flat(0xf4cc58);
  for (let i = 0; i < 5; i++) if (Math.hypot(x - Math.sin((i / 5) * Math.PI * 2) * 1.9, y - 4.9 + Math.cos((i / 5) * Math.PI * 2) * 1.9) < 1.05) return flat(0xd2361f);
  return mix(0xb08850, 0xfff0c8, t);
};

// a shrine's bell: gold, a band round it, its slit and the hole it ends in, a red cord through its loop
const suzu = (x, y) => {
  const loop = Math.hypot(x, y + 7.8);
  if (loop > 1.1 && loop < 2.5 && y < -5.6) return mix(0x8a1a1e, 0xf0503a, 0.5 - x * 0.2);
  if (!ell(x, y, 0, 2.3, 8, 8)) return null;
  if (Math.abs(y - 1.7) < 0.55) return flat(0x7a4a08);
  if (Math.abs(y - 0.6) < 0.5) return flat(0xfff0a0);
  if ((Math.abs(x) < 0.6 && y > 4.4 && y < 9.8) || Math.hypot(x, y - 4.8) < 1.5) return flat(0x2a1a08);
  if (Math.hypot(x + 3.2, y + 1.8) < 1.1) return flat(0xffffff);
  return mix(0x8a5a08, 0xffe478, lit(x, y, 0, 2.3, 8, 8) + 0.05);
};

// a sake flask: white porcelain, a flared lip, a blue ring at its neck, dots and a wave brushed in blue
const tokkuri = (x, y) => {
  const body = ell(x, y, 0, 3.4, 6.9, 7);
  const neck = y > -9.4 && y < -1.5 && Math.abs(x) < 2.2 + Math.max(0, y + 5.2) * 0.75;
  const lip = Math.abs(x) < 3.4 && y > -10.4 && y < -8.7;
  if ((!body && !neck && !lip) || y > 9.6) return null;
  if (lip && y < -9.7 && Math.abs(x) < 2.1) return flat(0x2a3a5a);
  const t = lit(x, y, 0, 2, 7, 10) + 0.2;
  if (Math.abs(y + 5.6) < 0.6) return mix(0x1a2a6a, 0x4a6ad0, t);
  if (Math.abs(y - 5.2 - Math.sin(x * 1.15) * 1.1) < 0.7) return mix(0x1a2a6a, 0x4a6ad0, t);
  for (const dx of [-3.3, 0, 3.3]) if (Math.hypot(x - dx, y - 1.2) < 0.8) return mix(0x1a2a6a, 0x4a6ad0, t);
  return mix(0x9aa8c4, 0xffffff, t);
};

// an octopus: red, round-headed, a white headband with a red dot, big eyes, a pout, four curled legs
const tako = (x, y) => {
  const head = ell(x, y, 0, -2, 7.8, 7.4);
  let leg = false;
  for (const lx of [-6.2, -2.1, 2.1, 6.2]) {
    if (Math.hypot(x - lx, y - 7.6) < 0.7) return flat(0xffc8b8);
    if (Math.hypot(x - lx, y - 7.2) < 2.5 || (Math.abs(x - lx) < 2 && y > 3 && y < 7.2)) leg = true;
  }
  if (!head && !leg) return null;
  if (head) {
    if (Math.abs(y + 6) < 1) return Math.hypot(x, y + 6) < 0.9 ? flat(0xd2361f) : mix(0xb0b4c8, 0xffffff, 0.6 - x * 0.07);
    for (const s of [-1, 1]) {
      const d = Math.hypot(x - s * 3.1, y + 1.4);
      if (d < 2) return d < 1 ? flat(INK) : flat(0xffffff);
    }
    const m = Math.hypot(x, y - 2.8);
    if (m < 1.7) return m < 0.8 ? flat(0x5a0c10) : flat(0xffa090);
  }
  return mix(0x8a1418, 0xff6e4c, lit(x, y, 0, -1, 8, 9) + 0.05);
};

export const PODS = { daruma, lantern, dango, bamboo, kokeshi, suzu, tokkuri, tako };

export function podArt() {
  return Object.entries(PODS).map(([id, at]) => ({ name: `pod_${id}`, raster: paint(at) }));
}

/** The kind's picture: the turret as it comes, big. */
export function partPod() {
  const out = new Raster(72, 72);
  const t = wingTurret(9);
  out.blit(t, (72 - t.w) >> 1, (72 - t.h) >> 1);
  return out;
}
