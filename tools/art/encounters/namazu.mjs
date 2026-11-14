// The arena of encounter 3 (ex3): a namazu-e. After the Ansei earthquake of 1855, Edo was flooded with prints of the
// giant catfish (namazu) that lives under the land and shakes it when the god holding it down looks away, pinned
// by the kaname-ishi stone, townsfolk pulling on its whiskers (long in the public domain). Here a building site in
// an Edo street of grey-tiled roofs has dug down onto it: its huge back in the mud of the pit, the stone on its
// head with its sacred rope, its whiskers trailing out across the site with little figures hauling on them,
// cracks running out into the town. Almost still: the strip creeps up through the fight.
import { Raster, fbm, rng, mix, scaleColor } from '../../lib/raster.mjs';
import { rampColor, grade } from '../nature.mjs';
import { tintTable } from '../props.mjs';

export const S = 3;
const W = 180;
const L = 896;
const FW = W * S;
const FH = L * S;

const TILE = [0x3a3c44, 0x50545e, 0x6a6e7a, 0x8a8e9a];
const EARTH = [0x6a5038, 0x8a6a48, 0xa88a62, 0xc4a87e];
const MUD = [0x1e1a14, 0x2e281e, 0x403828, 0x5a4e38];
const FISH = [0x101a1c, 0x1c2a2c, 0x2a3e40, 0x46605e, 0x7a948a];
const INK = 0x1a1420;

export function buildFar() {
  const r = new Raster(FW, 1152);
  for (let y = 0; y < r.h; y++) for (let x = 0; x < FW; x++) r.set(x, y, rampColor(TILE, 0.4 + (fbm(x, y, { seed: 3, scale: 30, periodX: FW, periodY: 1152 }) - 0.5) * 0.3, x, y));
  return r;
}

export function buildMid() {
  const img = new Raster(FW, FH);
  const rand = rng(1855);
  // the town: blocks of houses under grey tiled roofs, rows of round tiles, the ridges, streets of earth between
  for (let y = 0; y < FH; y++)
    for (let x = 0; x < FW; x++) {
      const bx = Math.floor(x / 120);
      const by = Math.floor(y / 150);
      const lx = x % 120;
      const ly = y % 150;
      const street = lx < 14 || ly < 16;
      let c;
      if (street) c = rampColor(EARTH, 0.45 + (fbm(x, y, { seed: 5, scale: 8 }) - 0.5) * 0.4, x, y);
      else {
        const house = Math.floor((lx - 14) / 53);
        const hx = (lx - 14) % 53;
        const roofT = (ly - 16) / 134;
        const ridge = Math.abs(roofT - 0.5) < 0.03;
        c = ridge ? TILE[0] : rampColor(TILE, (roofT < 0.5 ? 0.75 - roofT : 0.25 + (roofT - 0.5) * 0.5) + ((hx % 6) < 2 ? -0.12 : 0.04) + (hashy(bx, by, house) - 0.5) * 0.15, x, y);
        if (hx < 2) c = TILE[0];
      }
      img.set(x, y, c);
    }
  // the building site: a fenced plot of bare earth (white panels with a green band), tyre ruts
  const [sx0, sy0, sx1, sy1] = [40, 900, 500, 2620];
  for (let y = sy0; y < sy1; y++)
    for (let x = sx0; x < sx1; x++) {
      const edge = Math.min(x - sx0, sx1 - 1 - x, y - sy0, sy1 - 1 - y);
      const n = fbm(x, y, { seed: 7, scale: 10 }) - 0.5;
      let c = rampColor(EARTH, 0.5 + n * 0.5, x, y);
      if ((Math.abs(x - 200) < 6 || Math.abs(x - 230) < 6) && y > 1200) c = scaleColor(c, 0.85);
      if (edge < 8) c = edge < 3 ? 0x2a6a3a : 0xe8e8e0;
      img.set(x, y, c);
    }
  // cracks from the pit out across the site and into the town
  const crack = (x, y, a, len) => {
    for (let k = 0; k < len; k++) {
      x += Math.cos(a) * 2;
      y += Math.sin(a) * 2;
      a += (rand() - 0.5) * 0.5;
      for (let w = -1; w <= 1; w++) img.set(x + w, y, w ? 0x3a2c1e : 0x0a0806);
      if (rand() < 0.03) crack(x, y, a + (rand() < 0.5 ? 0.8 : -0.8), len - k - 10);
    }
  };
  for (let k = 0; k < 9; k++) crack(270, 2060, (k / 9) * Math.PI * 2, 140);
  // the pit, dug to mud, and in it the catfish's back: its broad head towards us, the stone on it
  const [cx, cy] = [270, 2060];
  for (let y = cy - 300; y < cy + 300; y++)
    for (let x = cx - 240; x < cx + 240; x++) {
      const e = ((x - cx) / 220) ** 2 + ((y - cy) / 280) ** 2 + (fbm(x, y, { seed: 9, scale: 20 }) - 0.5) * 0.25;
      if (e > 1) continue;
      img.set(x, y, e > 0.9 ? EARTH[0] : rampColor(MUD, 0.25 + (1 - e) * 0.4 + (fbm(x, y, { seed: 11, scale: 4 }) - 0.5) * 0.3, x, y));
    }
  // the fish: a long body tapering up the pit, the wide flat head at the bottom, the pale lips, the little eyes
  for (let y = cy - 260; y < cy + 230; y++)
    for (let x = cx - 200; x < cx + 200; x++) {
      const t = (y - (cy - 260)) / 490; // 0 tail .. 1 snout
      const half = t < 0.6 ? 26 + t * 200 : t < 0.94 ? 146 + (t - 0.6) * 30 : 156 * Math.sqrt(Math.max(0, 1 - ((t - 0.94) / 0.07) ** 2)); // (the head broad and flat)
      const sway = Math.sin(t * 5) * 16 * (1 - t);
      const d = Math.abs(x - cx - sway);
      if (d > half) continue;
      const k = d / half;
      const mottle = fbm(x, y, { seed: 13, scale: 9 });
      let c = rampColor(FISH, 0.25 + (1 - k) * 0.35 + (mottle - 0.5) * 0.35 - (x - cx) / 900, x, y);
      if (k > 0.86) c = FISH[4]; // the paler flank
      img.set(x, y, c);
    }
  for (const s of [-1, 1]) {
    // the eyes, small and far apart; the pale lip line
    for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) if (i * i + j * j < 36) img.set(cx + s * 92 + i, cy + 130 + j, i * i + j * j < 9 ? INK : 0xd8c890);
  }
  for (let x = cx - 120; x <= cx + 120; x++) img.set(x, cy + 214 - Math.abs(x - cx) * 0.25, 0xc8b890);
  // its whiskers: two long ones from the corners of its mouth, out across the site and over the fence, with the
  // townsfolk hauling on them (little figures), two short ones under the chin
  const whisker = (x, y, a, len, curl) => {
    const pts = [];
    for (let k = 0; k < len; k++) {
      x += Math.cos(a) * 2;
      y += Math.sin(a) * 2;
      a += curl;
      pts.push([x, y]);
      for (let w = -3; w <= 3; w++) for (let v = -3; v <= 3; v++) if (w * w + v * v < 10) img.set(x + w, y + v, FISH[w * w + v * v < 4 ? 3 : 1]);
    }
    return pts;
  };
  const left = whisker(cx - 140, cy + 205, Math.PI * 1.32, 230, 0.0035);
  const right = whisker(cx + 140, cy + 205, -Math.PI * 0.32, 230, -0.0035);
  whisker(cx - 40, cy + 225, Math.PI * 0.6, 40, 0.01);
  whisker(cx + 40, cy + 225, Math.PI * 0.4, 40, -0.01);
  for (const pts of [left, right])
    for (let k = 50; k < pts.length; k += 24) {
      const [x, y] = pts[k];
      // a townsman hauling on it, leaning back: his kimono, his head, his arms on the whisker
      for (let j = -8; j <= 8; j++) for (let i = -6; i <= 6; i++) if ((i * i) / 36 + (j * j) / 64 < 1) img.set(x + i + 8, y + 14 + j, k % 48 ? 0x2a3a6a : 0x7a2a2a);
      for (let j = -5; j <= 5; j++) for (let i = -5; i <= 5; i++) if (i * i + j * j < 25) img.set(x + i + 10, y + 2 + j, i * i + j * j < 9 ? 0xe8c8a0 : 0x1a1414);
      for (let q = 0; q < 10; q++) img.set(x + q * 0.8, y + 8 - q * 0.6, 0xe8c8a0);
    }
  // the kaname-ishi on its head: a rounded boulder, the sacred rope round it with its zigzag paper strips
  {
    const [bx, by, R] = [cx, cy + 60, 64];
    for (let j = -R; j <= R; j++)
      for (let i = -R; i <= R; i++) {
        const d = Math.hypot(i, j * 1.15) / R;
        if (d > 1) continue;
        img.set(bx + i + 10, by + j + 14, mix(img.get(bx + i + 10, by + j + 14), 0x0a0808, 0.5));
      }
    for (let j = -R; j <= R; j++)
      for (let i = -R; i <= R; i++) {
        const d = Math.hypot(i, j * 1.15) / R;
        if (d > 1) continue;
        img.set(bx + i, by + j, rampColor([0x4a4844, 0x6a6862, 0x8e8a82, 0xb4b0a6], 0.75 - (i + j) / (R * 3.2) - d * 0.25 + (fbm(i, j, { seed: 15, scale: 6 }) - 0.5) * 0.3, bx + i, by + j));
      }
    for (let i = -R + 4; i <= R - 4; i++) for (let w = 0; w < 7; w++) img.set(bx + i, by + 4 + w + Math.sin(i * 0.4) * 1.5, w === 0 || w === 6 ? 0x8a7a40 : 0xd8c070);
    for (const i of [-36, -12, 12, 36]) for (let k = 0; k < 18; k++) img.set(bx + i + ((Math.floor(k / 4) % 2) ? 4 : 0), by + 12 + k, 0xf8f6ee);
  }
  // site clutter: a stack of pipes, cones, a hard hat left on the ground
  for (const [x, y] of [[90, 1300], [450, 1500], [100, 2450], [440, 2400]]) for (let j = -8; j <= 8; j++) for (let i = -8; i <= 8; i++) { const d = Math.hypot(i, j); if (d < 8) img.set(x + i, y + j, d < 2.5 ? 0xf06a18 : d < 4.5 ? 0xf0f0e8 : 0xf06a18); }
  for (let k = 0; k < 6; k++) for (let x = 380; x < 480; x++) for (let j = 0; j < 8; j++) img.set(x, 1100 + k * 10 + j, j === 0 ? 0xd8dae0 : j === 7 ? 0x4a4a52 : 0x9a9ca4);
  grade(img, { sat: 0.8, bright: 0.86, tint: 0x182030, tintAmt: 0.05 });
  return {
    strip: img,
    props: null,
    meta: { width: W, artScale: S, chunkHeight: L, chunks: 1, length: L, tint: tintTable(L, () => [255, 255, 255]) },
  };
}

function hashy(a, b, c) {
  const h = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453;
  return h - Math.floor(h);
}
