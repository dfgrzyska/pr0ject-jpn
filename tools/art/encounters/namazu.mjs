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

// smooth ramps (no dither at 540 px)
const ROOF = [0x2a2c34, 0x3e424c, 0x565a66, 0x747884, 0x9a9eaa];
const LANE = [0x6a5438, 0x8a7050, 0xa88a64, 0xc4a87e, 0xdcc49a];
const DIRT = [0x3a2c1c, 0x54402a, 0x6e563a, 0x8a6e4c, 0xa88a64];
const SLIME = [0x1e2418, 0x34402a, 0x4e5a38, 0x6e7a4a, 0x9aa06a]; // the catfish's olive-brown hide
const STONE = [0x4a4844, 0x6a6862, 0x8e8a82, 0xb4b0a6, 0xd4d0c6];
const WOOD = [0x5a4028, 0x7a5a38, 0x9a7a50, 0xbc9c6c, 0xdcc090];
function sm(r, v) {
  const t = Math.max(0, Math.min(r.length - 1.0001, v * (r.length - 1)));
  const i = Math.floor(t);
  return mix(r[i], r[i + 1], t - i);
}

/**
 * The strip: an Edo town from above, blocks of houses under grey tiled roofs (rows of round tiles, ridges, the
 * eaves' shadow on the lanes), wells and pines in the yards, people about; in the middle the building site behind its
 * plank hoarding: churned earth, plank walkways, stacks of timber, a sand heap, a wheelbarrow; and the pit, shored
 * with planks, where the digging has come down onto the namazu: its broad flat head up out of the mud, little eyes,
 * pale lips, the kaname-ishi on its head with the sacred rope and paper streamers, its long whiskers out over the
 * hoarding with townsfolk hauling on them, others at it with mallets, as in the prints of 1855; cracks running out
 * into the town.
 */
export function buildMid() {
  const img = new Raster(FW, FH);
  const rand = rng(1855);
  const set = (x, y, c, a = 1) => img.set(x, y, c, a);
  const disc = (x, y, r, c, a = 1) => {
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r) set(x + i, y + j, c, a);
  };
  // ---- the town: blocks of houses; each house a gabled roof seen from above, ridge across its middle
  for (let y = 0; y < FH; y++)
    for (let x = 0; x < FW; x++) {
      const by = Math.floor(y / 170);
      const off = (by % 2) * 60;
      const bx = Math.floor((x + off) / 130);
      const lx = (x + off) % 130;
      const ly = y % 170;
      const street = lx < 16 || ly < 18;
      let c;
      if (street) {
        c = sm(LANE, 0.55 + (fbm(x, y, { seed: 5, scale: 8 }) - 0.5) * 0.4);
        // the eaves' shadow along the lane's sides
        if ((lx >= 10 && lx < 16) || (ly >= 12 && ly < 18)) c = mix(c, 0x14100a, 0.32);
      } else {
        const hw = 38 + (hashy(bx, by, 1) * 3 | 0) * 4; // house widths in a block vary
        const house = Math.floor((lx - 16) / hw);
        const hx = (lx - 16) % hw;
        const v = (ly - 18) / 152;
        const ridge = Math.abs(v - 0.5) < 0.025;
        const tiles = (ly - 18) % 6 < 1 ? -0.14 : (hx % 5 < 1 ? -0.06 : 0.03); // the rows and the round tiles
        const tone = (hashy(bx, by, house) - 0.5) * 0.18;
        c = ridge ? ROOF[0] : sm(ROOF, (v < 0.5 ? 0.78 - v * 0.7 : 0.3 + (v - 0.5) * 0.25) + tiles + tone);
        if (hx < 2) c = ROOF[0];
        if (ridge && hx % 9 < 3) c = 0xd8d4cc; // the white ridge caps
      }
      set(x, y, c);
    }
  // yards: a pine here and there, a well, people in the lanes
  for (let k = 0; k < 40; k++) {
    const y = rand() * FH;
    const x = rand() * FW;
    const r = 9 + rand() * 6;
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r) set(x + i, y + j, mix(0x1e3a22, 0x4a7a44, 0.5 - (i + j) / (r * 4) + (fbm(x + i, y + j, { seed: 3, scale: 2 }) - 0.5) * 0.6));
  }
  for (let k = 0; k < 60; k++) {
    const y = Math.floor(rand() * (FH / 170)) * 170 + 9;
    const x = rand() * FW;
    disc(x, y, 3.4, [0x2a3a6a, 0x7a2a2a, 0x4a3a28, 0x2a4a3a][k % 4]);
    disc(x, y - 3, 2, 0x1a1414);
  }
  // ---- the building site: its plank hoarding, the churned earth inside
  const [sx0, sy0, sx1, sy1] = [34, 1240, 506, 2600];
  for (let y = sy0; y < sy1; y++)
    for (let x = sx0; x < sx1; x++) {
      const edge = Math.min(x - sx0, sx1 - 1 - x, y - sy0, sy1 - 1 - y);
      const n = fbm(x, y, { seed: 7, scale: 12 }) - 0.5;
      let c = sm(DIRT, 0.58 + n * 0.45 + (fbm(x * 3, y * 3, { seed: 8, scale: 3 }) - 0.5) * 0.15);
      // wheel tracks
      for (const tx of [120, 140, 400, 420]) if (Math.abs(x - tx - Math.sin(y * 0.01) * 8) < 3) c = mix(c, 0x2a1e12, 0.3);
      if (edge < 10) {
        // the hoarding: pale boards, their joints, a dark top edge
        const along = x - sx0 < 10 || sx1 - 1 - x < 10 ? y : x;
        c = edge < 2 ? 0x3a2a18 : along % 22 < 2 ? sm(WOOD, 0.4) : sm(WOOD, 0.78 - edge / 40);
      }
      set(x, y, c);
    }
  // plank walkways, timber stacks, a sand heap, a wheelbarrow, cones
  const plank = (x0, y0, x1, y1) => {
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) set(x, y, (x0 < x1 - y1 + y0 ? (x - x0) % 16 < 1 : (y - y0) % 16 < 1) ? 0x4a3420 : sm(WOOD, 0.62 + (fbm(x, y, { seed: 21, scale: 4 }) - 0.5) * 0.25));
  };
  plank(70, 1300, 110, 1900);
  plank(430, 1360, 470, 2000);
  for (let k = 0; k < 5; k++) for (let y = 1290 + k * 12; y < 1300 + k * 12; y++) for (let x = 160; x < 270; x++) set(x, y, y % 12 === 0 ? 0x3a2810 : sm(WOOD, 0.7 - (y % 12) / 30));
  for (let j = -34; j <= 34; j++) for (let i = -44; i <= 44; i++) {
    const d = (i / 44) ** 2 + (j / 34) ** 2;
    if (d < 1) set(380 + i, 1340 + j, sm([0x9a8a60, 0xb8a878, 0xd4c494, 0xe8dcb0], 0.9 - d * 0.6 - (i + j) / 200));
  }
  for (let j = 0; j < 22; j++) for (let i = 0; i < 30; i++) set(140 + i, 2440 + j, j < 3 || i < 2 || i > 27 ? 0x3a3a42 : 0x6a7a8a);
  disc(155, 2468, 5, 0x1a1a20);
  for (const [x, y] of [[90, 2000], [460, 2100], [120, 2520], [430, 2500]]) {
    disc(x, y, 8, 0xf06a18);
    disc(x, y, 5, 0xf0f0e8);
    disc(x, y, 2.5, 0xf06a18);
  }
  // ---- cracks from the pit out across the site and into the town
  const crack = (x, y, a, len) => {
    for (let k = 0; k < len; k++) {
      x += Math.cos(a) * 2;
      y += Math.sin(a) * 2;
      a += (rand() - 0.5) * 0.5;
      for (let w = -1; w <= 1; w++) set(x + w, y, w ? 0x2a2014 : 0x0a0806);
      if (rand() < 0.03) crack(x, y, a + (rand() < 0.5 ? 0.8 : -0.8), len - k - 10);
    }
  };
  const [cx, cy] = [270, 2130];
  for (let k = 0; k < 10; k++) crack(cx, cy, (k / 10) * Math.PI * 2, 150);
  // ---- the pit: an irregular hole shored with planks, mud and black water at the bottom
  const pit = (x, y) => ((x - cx) / 230) ** 2 + ((y - cy) / 250) ** 2 + (fbm(x, y, { seed: 9, scale: 22 }) - 0.5) * 0.22;
  for (let y = cy - 290; y < cy + 290; y++)
    for (let x = cx - 260; x < cx + 260; x++) {
      const e = pit(x, y);
      if (e > 1.08) continue;
      if (e > 0.96) {
        // the shoring: upright planks round the rim
        const a = Math.atan2(y - cy, x - cx);
        set(x, y, Math.floor(a * 40) % 2 ? sm(WOOD, 0.62) : sm(WOOD, 0.4));
        continue;
      }
      const n = fbm(x, y, { seed: 11, scale: 5 }) - 0.5;
      let c = sm(DIRT, 0.2 + (1 - e) * 0.18 + n * 0.25);
      if (e < 0.55 && fbm(x * 0.6, y * 0.6, { seed: 12, scale: 9 }) > 0.62) c = mix(0x10181c, 0x4a6a7a, 0.2 + n); // puddles
      set(x, y, c);
    }
  // ---- the namazu: its broad flat head up out of the mud, the body sinking back into it
  for (let y = cy - 240; y < cy + 210; y++)
    for (let x = cx - 220; x < cx + 220; x++) {
      const t = (y - (cy - 240)) / 450; // 0: where it goes under .. 1: the snout
      if (t < 0) continue;
      const half = t < 0.45 ? 40 + t * 220 : t < 0.9 ? 139 + (t - 0.45) * 60 : 166 * Math.sqrt(Math.max(0, 1 - ((t - 0.9) / 0.11) ** 2));
      const d = Math.abs(x - cx);
      if (d > half) continue;
      const k = d / half;
      const mottle = fbm(x, y, { seed: 13, scale: 7 });
      let c = sm(SLIME, 0.28 + (1 - k * k) * 0.4 + (mottle - 0.5) * 0.4 - (x - cx) / 1200 + t * 0.08);
      if (mottle > 0.66) c = mix(c, 0x1a1e12, 0.5); // dark blotches
      if (k > 0.88) c = mix(c, 0xb8b890, 0.5); // the paler flank
      if (t < 0.12) c = mix(c, sm(DIRT, 0.25), (0.12 - t) / 0.12); // sinking into the mud
      set(x, y, c);
    }
  // its eyes: small, gold, far apart; its lips, pale, a wide mouth; the slime's sheen
  for (const sx of [-1, 1]) {
    disc(cx + sx * 98, cy + 120, 9, 0x1a1408);
    disc(cx + sx * 98, cy + 120, 7, 0xd8b840);
    disc(cx + sx * 98, cy + 121, 3.5, 0x0a0806);
    disc(cx + sx * 96, cy + 117, 1.6, 0xffffff);
  }
  for (let x = cx - 130; x <= cx + 130; x++) for (let w = 0; w < 6; w++) set(x, cy + 184 - Math.abs(x - cx) * 0.22 + w, w < 2 ? 0x2a2018 : w < 5 ? 0xd8c8a0 : 0x8a7a5a);
  for (const [x, y, l] of [[cx - 60, cy - 40, 50], [cx + 40, cy + 30, 40], [cx - 20, cy + 90, 30]]) for (let t = 0; t < l; t++) set(x + t, y - t * 0.3, 0xe8f0d0, 0.5);
  // its whiskers: two long ones out from the corners of its mouth, over the hoarding into the lanes, the townsfolk
  // hauling on them; two short ones under the chin
  const whisker = (x, y, a, len, curl) => {
    const pts = [];
    for (let k = 0; k < len; k++) {
      x += Math.cos(a) * 2;
      y += Math.sin(a) * 2;
      a += curl;
      pts.push([x, y]);
      const r = 4.2 - (k / len) * 2.2;
      for (let w = -r; w <= r; w++) for (let v = -r; v <= r; v++) if (w * w + v * v <= r * r) set(x + w, y + v, sm(SLIME, w + v < 0 ? 0.6 : 0.25));
    }
    return pts;
  };
  const left = whisker(cx - 130, cy + 180, Math.PI * 1.25, 240, 0.004);
  const right = whisker(cx + 130, cy + 180, -Math.PI * 0.25, 240, -0.004);
  whisker(cx - 40, cy + 200, Math.PI * 0.62, 40, 0.012);
  whisker(cx + 40, cy + 200, Math.PI * 0.38, 40, -0.012);
  const person = (x, y, robe, lean = 0) => {
    for (let j = -9; j <= 9; j++) for (let i = -6; i <= 6; i++) if ((i * i) / 36 + (j * j) / 81 < 1) set(x + i + lean * j * 0.2, y + j, mix(robe, 0x000000, (i + 6) / 30));
    for (let i = -6; i <= 6; i++) set(x + i, y + 2, 0xd8c890); // the sash
    disc(x - lean * 2, y - 12, 4.4, 0xe8c8a0);
    for (let i = -4; i <= 4; i++) for (let j = -2; j <= 0; j++) set(x - lean * 2 + i, y - 15 + j, 0x1a1414); // the hair, a topknot
  };
  const ROBES = [0x2a3a6a, 0x8a2a2a, 0x4a3a28, 0x2a5a4a, 0x6a3a6a];
  for (const pts of [left, right])
    for (let k = 60, n = 0; k < pts.length; k += 26, n++) {
      const [x, y] = pts[k];
      person(x + 6, y + 12, ROBES[(n + (pts === left ? 0 : 2)) % ROBES.length], pts === left ? 1 : -1);
      for (let q = 0; q < 9; q++) set(x + q * 0.7, y + 6 - q * 0.5, 0xe8c8a0); // arms on the whisker
    }
  // townsfolk at it with mallets, round its head
  for (const [x, y, sx] of [[cx - 190, cy + 60, 1], [cx + 190, cy + 40, -1], [cx - 170, cy + 150, 1], [cx + 175, cy + 160, -1]]) {
    person(x, y, ROBES[(x + y) % 5], 0);
    for (let q = 0; q < 16; q++) set(x + sx * q, y - 10 - q * 0.6, 0x5a4020);
    for (let j = -4; j <= 4; j++) for (let i = -6; i <= 6; i++) set(x + sx * 16 + i, y - 20 + j, sm(WOOD, 0.5));
  }
  // ---- the kaname-ishi on its head: a rounded boulder, its shadow, the sacred rope with its zigzag paper streamers
  {
    const [bx, by, R] = [cx, cy + 50, 60];
    for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) if (Math.hypot(i, j * 1.15) <= R) set(bx + i + 12, by + j + 16, 0x0a0808, 0.45);
    for (let j = -R; j <= R; j++)
      for (let i = -R; i <= R; i++) {
        const d = Math.hypot(i, j * 1.15) / R;
        if (d > 1) continue;
        set(bx + i, by + j, sm(STONE, 0.78 - (i + j) / (R * 3) - d * 0.28 + (fbm(i, j, { seed: 15, scale: 6 }) - 0.5) * 0.3));
      }
    for (let i = -R + 4; i <= R - 4; i++) for (let w = 0; w < 8; w++) set(bx + i, by + 4 + w + Math.sin(i * 0.4) * 1.6, w === 0 || w === 7 ? 0x8a7a40 : (i + w) % 5 < 1 ? 0xb8a050 : 0xe0c878);
    for (const i of [-38, -14, 12, 36]) for (let k = 0; k < 22; k++) for (let w = 0; w < 4; w++) set(bx + i + ((Math.floor(k / 5) % 2) ? 5 : 0) + w, by + 13 + k, w === 3 ? 0xb8b4a8 : 0xfaf8f0);
  }
  grade(img, { sat: 0.82, bright: 0.84, tint: 0x182030, tintAmt: 0.05 });
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
