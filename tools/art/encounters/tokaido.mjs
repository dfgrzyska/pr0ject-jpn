// The arena of encounter 2 (ex2): the Tōkaidō of Hiroshige's Fifty-three Stations (1833-34, long in the public
// domain), seen from above and gone modern: the old highway between Edo and Kyoto in ochre earth, lined with its
// pines, between paddies shaded in the prints' bokashi blues and greens, thatched teahouses and a river with its
// wooden bridge; down its middle someone has painted lane lines. The far layer is a seamless loop that races by
// (the chase); the middle layer only holds the start: Nihonbashi, the bridge in Edo where the road begins, with a
// daimyō's procession setting out over it, as in the first print of the series.
import { Raster, fbm, rng, mix } from '../../lib/raster.mjs';
import { rampColor, grade } from '../nature.mjs';
import { tintTable, PropKit } from '../props.mjs';

export const S = 3;
const W = 180;
const L = 896;
const FW = W * S;

const EARTH = [0x8a6a40, 0xa8845a, 0xc4a070, 0xd8bc8c];
const SKYWATER = [0x1a3a6a, 0x2a5a9a, 0x5a8ac0, 0xa8c8e4];
const INK = 0x1a1420;
const FAR_H = 2304; // the far loop: two screens and more, so it does not repeat too soon at the chase's speed
const ROAD0 = 186;
const ROAD1 = 354; // the road's edges (fine px)
const CX = 270;

// smooth ramps (no dither: at 540 px the gradients can be soft)
const ROAD = [0x6a5032, 0x8a6a44, 0xa8845a, 0xc4a070, 0xdcc08e];
const RICE = [0x1e4a2a, 0x2e6a36, 0x4a8a3e, 0x7aac4e, 0xb0cc6a];
const GOLD = [0x8a6a1a, 0xb08a2a, 0xd0aa40, 0xe8c860, 0xf4e090];
const WATER = [0x203a5a, 0x2e5a8a, 0x5a88b8, 0x9ac0e0, 0xdcecf8];
const PINE = [0x0c1e14, 0x142e1c, 0x1e4426, 0x2e5c32, 0x4a7a44];
const TEA = [0x0e2e16, 0x1a4a22, 0x2a6a2e, 0x4a8a3a, 0x7ab050];
const THATCH = [0x4a3418, 0x7a5a30, 0xa07c48, 0xc4a064, 0xe0c890];
const TILE = [0x1a1c24, 0x2a2e3a, 0x3e4454, 0x5a6274, 0x7a8496];
const BAMBOO = [0x1a3a1a, 0x2e5a26, 0x4a7a32, 0x74a044, 0xa8c868];

function ramp(r, v) {
  const s = Math.max(0, Math.min(r.length - 1.0001, v * (r.length - 1)));
  const i = Math.floor(s);
  return mix(r[i], r[i + 1], s - i);
}
const per = (x, y, o) => fbm(x, y, { periodX: FW, periodY: FAR_H, ...o });

/**
 * The far loop: the old Tōkaidō racing by under the chase, seamless top to bottom. Down the middle the road of
 * packed ochre earth, its ruts, stones and tufts, the lane lines someone has painted on it; along both sides its
 * pines, Hiroshige's, dark crowns of needle clumps casting long shadows over the road; beyond them the country of
 * the prints, in turn: flooded paddies mirroring the sky with rows of young rice, and herons; golden ripe rice with
 * the farmers bent over it in straw hats; the curving rows of Shizuoka's tea bushes; a hamlet of thatched farmhouses
 * and a white storehouse with a tiled roof; a shrine's red torii and stone lanterns; a teahouse at the roadside with
 * its benches and banner and travellers resting; a bamboo grove; the milestone mounds (ichirizuka) with their trees;
 * a river with its wooden bridge.
 */
export function buildFar() {
  const r = new Raster(FW, FAR_H);
  r.wrapY = true;
  const rand = rng(53);
  const set = (x, y, c, a = 1) => r.set(x, y, c, a);
  // ---- the fields, by stretch of road (from the top of the loop down) and side
  const left = [[0, 'tea'], [520, 'hamlet'], [880, 'river'], [1120, 'paddy'], [1560, 'bamboo'], [1880, 'gold']];
  const right = [[0, 'paddy'], [420, 'shrine'], [880, 'river'], [1120, 'gold'], [1560, 'teahouse'], [1900, 'tea']];
  const zone = (list, y) => {
    let z = list[0][1];
    for (const [y0, k] of list) if (y >= y0) z = k;
    return z;
  };
  for (let y = 0; y < FAR_H; y++)
    for (let x = 0; x < FW; x++) {
      if (x >= ROAD0 && x < ROAD1) continue;
      const k = zone(x < CX ? left : right, y);
      const n = per(x, y, { seed: 5, scale: 24 }) - 0.5;
      let c;
      if (k === 'paddy' || k === 'river') {
        // flooded paddies: plots between raised bunds, the sky in the water, rows of young rice
        const px = Math.floor((x + (x < CX ? 0 : 37)) / 92);
        const py = Math.floor((y + px * 31) / 110);
        const lx = (x + (x < CX ? 0 : 37)) % 92;
        const ly = (y + px * 31) % 110;
        const bund = lx < 4 || ly < 4;
        const sky = 0.55 + Math.sin((y + px * 50) * 0.01) * 0.15 + n * 0.25 + (((py * 7 + px * 3) % 5) - 2) * 0.04;
        const cloud = Math.max(0, per(x * 0.5, y * 0.25, { seed: 71, scale: 10 }) - 0.6) * 2.5; // clouds lying in the water
        c = bund ? mix(ramp(RICE, 0.62), EARTH[1], lx < 2 || ly < 2 ? 0.6 : 0.2) : mix(ramp(WATER, sky), 0xf4f8fc, Math.min(0.7, cloud));
        if (!bund && lx % 8 < 3 && ly % 6 < 3 && ly > 6) c = ramp(RICE, 0.45 + n * 0.5 + (lx % 8 === 0 ? 0.2 : 0)); // the seedlings in rows
      } else if (k === 'gold') {
        const lx = (x + 11) % 120;
        const ly = (y + Math.floor((x + 11) / 120) * 40) % 130;
        const bund = lx < 4 || ly < 4;
        c = bund ? mix(ramp(RICE, 0.5), EARTH[1], 0.4) : ramp(GOLD, 0.5 + n * 0.5 + Math.sin(x * 0.9 + y * 0.35) * 0.08);
      } else if (k === 'tea') {
        // tea: long rounded hedges in gentle curves, dark furrows between
        const u = x * 0.35 + y + Math.sin(x * 0.012) * 40;
        const row = ((u % 26) + 26) % 26;
        c = row < 18 ? ramp(TEA, 0.35 + Math.sin((row / 18) * Math.PI) * 0.5 + n * 0.3) : mix(EARTH[0], 0x2a2014, 0.4);
      } else if (k === 'bamboo') {
        c = ramp(BAMBOO, 0.3 + n * 0.6 + (per(x * 3, y * 0.6, { seed: 41, scale: 4 }) - 0.5) * 0.5);
      } else {
        // a yard or a verge: trodden earth with grass
        c = mix(ramp(RICE, 0.45 + n * 0.4), EARTH[2], 0.45 + n * 0.3);
      }
      set(x, y, c);
    }
  // herons standing in the paddies, egrets: little white birds with a long neck
  for (let k = 0; k < 14; k++) {
    const y = 1130 + rand() * 400 + (k % 2 ? -1130 + 20 : 0);
    const x = k % 2 ? ROAD1 + 30 + rand() * 140 : 20 + rand() * 140;
    for (let j = -4; j <= 4; j++) for (let i = -3; i <= 3; i++) if ((i / 3) ** 2 + (j / 4) ** 2 < 1) set(x + i, y + j, j < 0 ? 0xffffff : 0xdcdce4);
    for (let j = 0; j < 6; j++) set(x + 1 + j * 0.3, y - 4 - j, 0xf4f4f4);
    set(x + 3, y - 10, 0xe8b830);
    for (let j = 0; j < 6; j++) set(x + 3 + j * 0.5, y + 5 + j * 0.8, 0x0a1a2a, 0.35); // its reflection
  }
  // farmers in the golden rice: straw hats from above, bent backs in indigo
  const hat = (x, y, rr = 7) => {
    for (let j = -rr; j <= rr; j++) for (let i = -rr; i <= rr; i++) {
      const d = Math.hypot(i, j);
      if (d < rr) set(x + i, y + j, d > rr - 1.4 ? 0x5a4020 : mix(0xf0d898, 0xa88848, (i + j + rr * 2) / (rr * 4) + (Math.floor(d) % 2) * 0.08));
    }
    set(x, y, 0x6a4a20);
  };
  for (const [x, y] of [[60, 1980], [110, 2050], [40, 2160], [420, 1200], [470, 1290], [400, 1400], [480, 1460]]) {
    for (let j = 0; j < 10; j++) for (let i = -4; i <= 4; i++) if (Math.abs(i) < 4 - j * 0.2) set(x + i, y + 4 + j, 0x24305a);
    hat(x, y);
  }
  // ---- the hamlet (left): thatched farmhouses (hipped roofs from above: a ridge, four slopes), a white storehouse
  const thatched = (x0, y0, w, h) => {
    for (let y = y0 - 8; y < y0 + h + 10; y++) for (let x = x0 + 6; x < x0 + w + 10; x++) set(x, y, 0x0a1008, 0.35); // its shadow
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++) {
        const u = (x - x0) / w;
        const v = (y - y0) / h;
        const ridge = Math.abs(v - 0.5) < 0.05 && u > 0.2 && u < 0.8;
        // which slope: the four triangles of a hipped roof
        const dl = u;
        const dr = 1 - u;
        const dt = v * (w / h) * 0.6;
        const db = (1 - v) * (w / h) * 0.6;
        const m = Math.min(dl, dr, dt, db);
        const light = m === dt ? 0.82 : m === dl ? 0.66 : m === db ? 0.34 : 0.46;
        const straw = m === dt || m === db ? (x * 0.9 + (y % 3)) % 4 < 1 : (y * 0.9 + (x % 3)) % 4 < 1; // the straw's grain
        let c = ramp(THATCH, light + (per(x * 2, y * 2, { seed: 61, scale: 3 }) - 0.5) * 0.25 + (straw ? -0.08 : 0.02));
        if (ridge) c = 0x3a2a18;
        if (Math.min(x - x0, x0 + w - 1 - x, y - y0, y0 + h - 1 - y) < 2) c = 0x3a2810;
        set(x, y, c);
      }
    // a wisp of smoke from the hearth
    for (let k = 0; k < 18; k++) set(x0 + w * 0.5 + Math.sin(k * 0.6) * 3, y0 + h * 0.5 - k * 1.5, 0xe8e8e8, 0.25);
  };
  const kura = (x0, y0, w, h) => {
    for (let y = y0 - 6; y < y0 + h + 10; y++) for (let x = x0 + 6; x < x0 + w + 8; x++) set(x, y, 0x0a1008, 0.35);
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++) {
        const v = (y - y0) / h;
        let c = ramp(TILE, v < 0.5 ? 0.7 - v * 0.4 : 0.3 + (v - 0.5) * 0.3);
        if ((x - x0) % 5 === 0) c = mix(c, 0x0a0a10, 0.4); // the rows of tiles
        if (Math.abs(v - 0.5) < 0.06) c = 0xe8e4dc; // the white ridge
        set(x, y, c);
      }
    for (let x = x0; x < x0 + w; x++) for (let j = 0; j < 4; j++) set(x, y0 + h + j, j < 3 ? 0xf0ece4 : 0x9a968e); // the white plastered wall below the eaves
  };
  thatched(30, 560, 110, 70);
  thatched(20, 700, 90, 64);
  kura(120, 690, 44, 34);
  for (let x = 14; x < 170; x += 3) set(x, 650 + Math.sin(x * 0.2) * 2, 0x6a5030); // a fence
  // ---- the shrine (right): a red torii facing the road, a stone path, lanterns, the little hall
  {
    const ty = 470;
    for (let y = ty - 2; y < ty + 4; y++) for (let x = ROAD1 + 14; x < ROAD1 + 74; x++) set(x, y, y < ty ? 0x1a1414 : 0xd03a2a); // the top beam
    for (let y = ty + 10; y < ty + 13; y++) for (let x = ROAD1 + 20; x < ROAD1 + 68; x++) set(x, y, 0xb02a20);
    for (const px of [ROAD1 + 24, ROAD1 + 62]) for (let y = ty; y < ty + 16; y++) for (let i = -2; i <= 2; i++) set(px + i, y, 0xc0302a);
    for (let x = ROAD1 + 74; x < 530; x++) for (let j = -6; j <= 6; j++) set(x, ty + 6 + j, mix(0xb8b0a0, 0x8a8478, Math.abs(j) / 8 + ((x >> 3) % 2) * 0.1)); // the stone path
    for (const [lx, ly] of [[ROAD1 + 90, ty - 14], [ROAD1 + 90, ty + 26], [ROAD1 + 130, ty - 14], [ROAD1 + 130, ty + 26]]) {
      for (let j = -5; j <= 5; j++) for (let i = -5; i <= 5; i++) if (Math.abs(i) + Math.abs(j) < 7) set(lx + i, ly + j, mix(0xc8c0b0, 0x7a7468, (i + j + 8) / 16));
      set(lx, ly, 0x3a3428);
    }
    kura(ROAD1 + 120, ty - 60, 50, 36);
  }
  // ---- the river, both sides, and the bridge over it where the road crosses
  const ry = 1000;
  for (let y = ry - 46; y < ry + 46; y++)
    for (let x = 0; x < FW; x++) {
      const d = Math.abs(y - ry - Math.sin((x / FW) * Math.PI * 4) * 8);
      if (d > 42) continue;
      const w = per(x * 0.4, y * 2.2, { seed: 9, scale: 9 });
      let c = d > 36 ? mix(EARTH[0], 0x3a2a18, 0.3) : d > 32 ? ramp(EARTH, 0.6) : ramp(WATER, 0.3 + w * 0.45 + (w > 0.66 ? 0.35 : 0) - d / 120);
      set(x, y, c);
    }
  for (let k = 0; k < 2; k++) {
    // a ferry boat on the river, a boatman poling
    const bx = k ? 450 : 70;
    for (let i = -26; i <= 26; i++) for (let j = -5; j <= 5; j++) if (Math.abs(j) < 5 * (1 - (Math.abs(i) / 27) ** 3)) set(bx + i, ry + j + (k ? 6 : -6), Math.abs(j) > 3.5 ? 0x4a3018 : 0xa8804a);
    hat(bx + 8, ry + (k ? 6 : -6), 5);
  }
  // ---- the road: packed ochre earth, ruts, stones and tufts of grass, the painted lines
  for (let y = 0; y < FAR_H; y++)
    for (let x = ROAD0; x < ROAD1; x++) {
      const bridge = Math.abs(y - ry) < 40;
      const n = per(x, y, { seed: 13, scale: 7 }) - 0.5;
      const fine = per(x * 3, y * 3, { seed: 14, scale: 3 }) - 0.5;
      let c;
      if (bridge) {
        c = ramp(ROAD, 0.42 + n * 0.2 + ((y - ry + 80) % 10 < 1.5 ? -0.25 : 0) + fine * 0.15);
        if ((y - ry + 80) % 10 < 1) c = 0x2a1e14;
      } else {
        c = ramp(ROAD, 0.6 + n * 0.3 + fine * 0.2);
        for (const rx of [218, 238, 302, 322]) if (Math.abs(x - rx) < 4) c = mix(c, 0x4a3420, 0.18 * (1 - Math.abs(x - rx) / 4)); // the ruts
        if (Math.abs(x - CX) < 2.5 && y % 64 < 36) c = mix(0xf4f0e4, c, Math.max(0, fine) * 0.6); // the centre line
        if (Math.abs(x - ROAD0 - 8) < 1.6 || Math.abs(x - ROAD1 + 8) < 1.6) c = mix(0xece4cc, c, 0.25); // the edge lines
      }
      if (x - ROAD0 < 3 || ROAD1 - x < 3) c = mix(c, 0x3a2a18, 0.5);
      set(x, y, c);
    }
  // stones and tufts on the road and its verges
  for (let k = 0; k < 260; k++) {
    const y = rand() * FAR_H;
    if (Math.abs(y - ry) < 44) continue;
    const edge = rand() < 0.6;
    const x = edge ? (rand() < 0.5 ? ROAD0 + 2 + rand() * 10 : ROAD1 - 12 + rand() * 10) : ROAD0 + 20 + rand() * (ROAD1 - ROAD0 - 40);
    if (edge) for (let j = 0; j < 5; j++) set(x + (rand() - 0.5) * 4, y - j, ramp(RICE, 0.5 + rand() * 0.4));
    else {
      const rr = 1 + rand() * 1.6;
      for (let j = -rr; j <= rr; j++) for (let i = -rr; i <= rr; i++) if (i * i + j * j <= rr * rr) set(x + i, y + j, i + j < 0 ? 0xd8ccb0 : 0x6a5a44);
    }
  }
  // the bridge's rails, posts and their shadows
  for (const yy of [ry - 40, ry + 37]) {
    for (let x = ROAD0 - 10; x < ROAD1 + 10; x++) for (let k = 0; k < 4; k++) set(x, yy + k, k === 0 ? 0x9a7048 : k < 3 ? 0x6a4a2a : 0x2a1e14);
    for (let x = ROAD0 - 10; x < ROAD1 + 10; x += 21) for (let j = -3; j < 6; j++) for (let i = 0; i < 4; i++) set(x + i, yy + j, i === 0 ? 0x9a7048 : 0x4a3420);
  }
  // ---- the roadside teahouse (right): a thatched roof, benches out front with travellers resting, its banner
  {
    const [hx, hy] = [ROAD1 + 40, 1620];
    thatched(hx, hy, 120, 76);
    for (const by of [hy + 86, hy + 110]) for (let y = by; y < by + 8; y++) for (let x = ROAD1 + 14; x < ROAD1 + 70; x++) set(x, y, y === by ? 0xd02a26 : 0xa82020); // benches with red cloth
    hat(ROAD1 + 26, hy + 98, 6);
    hat(ROAD1 + 50, hy + 122, 6);
    for (let j = 0; j < 30; j++) for (let i = 0; i < 8; i++) set(ROAD1 + 8 + i, hy + 10 + j, j < 2 ? 0x3a2a18 : i < 1 ? 0x2a1a10 : 0xe8e0d0); // the banner
  }
  // ---- the milestone mounds: a mound each side of the road, a tree on each
  const mound = (x, y) => {
    for (let j = -22; j <= 22; j++) for (let i = -22; i <= 22; i++) {
      const d = Math.hypot(i, j);
      if (d < 22) set(x + i, y + j, ramp(RICE, 0.75 - d / 40 - (i + j) / 90));
    }
  };
  mound(ROAD0 - 30, 1420);
  mound(ROAD1 + 30, 1420);
  // ---- the pines lining the road: crowns of dark needle clumps, lit on top, casting long shadows over the road
  const shadowOf = (cx, cy, rr) => {
    for (let j = -rr; j <= rr * 2; j++) for (let i = -rr; i <= rr * 2; i++) {
      const d = (i / (rr * 1.15)) ** 2 + ((j - rr * 0.3) / (rr * 1.0)) ** 2;
      if (d < 1) set(cx + i + rr * 0.7, cy + j + rr * 0.6, 0x0a1008, 0.26 * Math.min(1, (1 - d) * 3));
    }
  };
  const pine = (cx, cy, rr) => {
    for (let k = 0; k < 13; k++) {
      const a = (k / 13) * Math.PI * 2 + rand() * 0.6;
      const d = rr * (0.3 + rand() * 0.45);
      const px = cx + Math.cos(a) * d;
      const py = cy + Math.sin(a) * d * 0.85;
      const q = rr * (0.42 + rand() * 0.2);
      for (let j = -q; j <= q; j++)
        for (let i = -q; i <= q; i++) {
          const dd = Math.hypot(i, j * 1.3);
          if (dd > q * (0.85 + (per(px + i, py + j, { seed: 17, scale: 2 }) - 0.5) * 0.5)) continue;
          // each clump lit from the top left; needle texture as a speckle of light and dark
          const v = 0.62 - (i + j) / (q * 3.2) - dd / (q * 3) + (per((px + i) * 4, (py + j) * 4, { seed: 19, scale: 2 }) - 0.5) * 0.45;
          set(px + i, py + j, ramp(PINE, v));
        }
      // the needle tips catching the light along the clump's upper left edge
      for (let t = 0; t < 12; t++) {
        const aa = Math.PI * (1.05 + t * 0.04);
        set(px + Math.cos(aa) * q * 0.75, py + Math.sin(aa) * q * 0.6, PINE[4], 0.8);
      }
    }
    // the trunk's dark heart
    for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (i * i + j * j < 5) set(cx + i, cy + j, 0x2a1a10, 0.6);
  };
  const pines = [];
  for (let y = 0; y < FAR_H; y += 58 + rand() * 24) {
    if (Math.abs(y - ry) < 70) continue;
    pines.push([ROAD0 - 22 + rand() * 8, y + rand() * 12, 21 + rand() * 7]);
    pines.push([ROAD1 + 16 + rand() * 8, y + 28 + rand() * 12, 21 + rand() * 7]);
  }
  pines.push([ROAD0 - 30, 1420, 16], [ROAD1 + 30, 1420, 16]); // the mounds' trees
  for (const [x, y, rr] of pines) shadowOf(x, y, rr);
  for (const [x, y, rr] of pines) pine(x, y, rr);
  // the bamboo grove's stems seen from above: light dots in the green, a shadow along its edge
  for (let k = 0; k < 160; k++) {
    const x = 10 + rand() * 160;
    const y = 1570 + rand() * 300;
    set(x, y, 0xd8e8a0);
    set(x + 1, y, 0x8ab060);
  }
  grade(r, { sat: 0.86, bright: 0.84, tint: 0x182030, tintAmt: 0.05 });
  return r;
}

export function buildMid() {
  const img = new Raster(FW, L * S); // transparent, but for the start
  // Nihonbashi, where the road begins: the canal across the bottom of the first screen between its stone
  // embankments, the arched wooden bridge carrying the road over it (planks across, rails with bronze giboshi on
  // their posts, the piles of its piers standing in the water), a daimyō's procession setting out over it as in the
  // first print of the series; on the far quay the fish market and the storehouses, on the near one the notice
  // board and the landing steps; boats on the water.
  const by = L * S - 300; // the bridge's middle
  const WOOD = [0x4a3420, 0x6e4e2c, 0x94703e, 0xb89258, 0xd4b47c];
  const STONE = [0x4e4c48, 0x6a6862, 0x86837a, 0xa29e92, 0xbcb8aa];
  const BX0 = ROAD0 - 16;
  const BX1 = ROAD1 + 16; // the deck's edges
  const pr = rng(1603);
  const shadow = (x, y, w, h, f = 0.72) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) img.tint(Math.round(x + i), Math.round(y + j), f);
  };
  // ---- the quays and the water
  for (let y = by - 172; y < by + 172; y++)
    for (let x = 0; x < FW; x++) {
      const d = Math.abs(y - by);
      const n = fbm(x, y, { seed: 23, scale: 14 });
      if (d >= 110) {
        // packed earth, worn pale along the middle of the quay; its outer edge ragged, grass growing into it
        const edge = 172 - d;
        if (edge < 12 && fbm(x, y, { seed: 29, scale: 5 }) > edge / 12) continue;
        let c = ramp(ROAD, 0.34 + n * 0.4 + (d - 110) / 300);
        if (edge < 16 && fbm(x * 2, y * 2, { seed: 31, scale: 3 }) > 0.56) c = ramp(RICE, 0.2 + n * 0.5);
        if (fbm(x * 3, y * 3, { seed: 37, scale: 2 }) > 0.8) c = mix(c, 0x4a3a24, 0.3);
        img.set(x, y, c);
      } else if (d >= 98) {
        // the embankment: dressed stone in courses, the joints dark, moss low by the water
        const row = Math.floor((d - 98) / 4);
        const col = Math.floor((x + row * 5) / 9);
        const joint = (d - 98) % 4 === 0 || (x + row * 5) % 9 === 0;
        let c = ramp(STONE, 0.3 + ((col * 37 + row * 11) % 7) / 12 + (n - 0.5) * 0.2);
        if (joint) c = mix(c, 0x24221e, 0.6);
        if (d < 102 && fbm(x, y, { seed: 41, scale: 4 }) > 0.5) c = mix(c, 0x3a5a2e, 0.55);
        if (d === 109) c = ramp(STONE, 0.95);
        img.set(x, y, c);
      } else {
        // the canal: deep blue, long ripples of light, darker under the walls
        const w = fbm(x * 0.35, y * 1.6, { seed: 23, scale: 9 });
        let c = ramp(SKYWATER, 0.22 + w * 0.5 + (w > 0.68 ? 0.26 : 0));
        if (d > 84) c = mix(c, 0x0c1c34, ((d - 84) / 14) * 0.6);
        if (y < by && d > 78 && (x + Math.floor(w * 30)) % 23 < 9) c = mix(c, ramp(STONE, 0.6), 0.14); // the wall mirrored
        img.set(x, y, c);
      }
    }
  // ---- people, seen from above: shoulders, a head or a hat, a shadow thrown down and to the right
  const person = (x, y, body, hat = 'head', o = {}) => {
    shadow(x - 1, y + 2, 7, 4, 0.78);
    img.ellipse(x, y, 3.6, 2.6, body);
    img.set(x - 3, y, mix(body, 0xffffff, 0.25));
    img.set(x + 3, y + 1, mix(body, 0x000000, 0.3));
    if (o.swords) {
      img.line(x - 4, y + 1, x - 7, y + 4, 0x1a1420);
      img.set(x - 4, y + 1, 0xc8a040);
    }
    if (hat === 'jingasa') {
      img.disc(x, y - 1, 3, 0x16141c);
      img.set(x, y - 1, 0xd8b048);
      img.set(x - 1, y - 2, 0x4a4858);
    } else if (hat === 'kasa') {
      img.disc(x, y - 1, 3.4, 0xc8a868);
      img.disc(x, y - 1, 2, 0xe0c488);
      img.set(x, y - 1, 0x7a5a30);
    } else {
      img.disc(x, y - 1, 2, 0x1a1414);
      img.set(x, y - 2, 0xe8c8a0);
      img.set(x, y, 0x0a0a0a);
    }
  };
  const bale = (x, y, across) => {
    // a straw rice bale, roped
    const [w, h] = across ? [9, 5] : [5, 9];
    shadow(x + 1, y + 1, w, h, 0.76);
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const along = across ? i : j;
        const side = across ? j : i;
        let c = ramp(THATCH, 0.5 + (side === 0 ? 0.3 : side === 4 ? -0.25 : 0) + ((along * 7) % 3) * 0.04);
        if (along === 2 || along === 6) c = 0x5a4424;
        img.set(x + i, y + j, c);
      }
  };
  const keg = (x, y) => {
    // a sake keg in its straw wrapping, the brewer's mark on its head
    shadow(x - 3, y - 2, 9, 9, 0.76);
    img.disc(x, y, 4.2, 0xa88850);
    img.disc(x, y, 3.2, 0xe8dcc0);
    img.set(x, y, 0xa82a20);
    img.set(x - 1, y, 0x2a2420);
    img.set(x + 1, y, 0x2a2420);
  };
  const tub = (x, y, fish) => {
    // a cooper's tub of the morning's catch
    shadow(x - 3, y - 2, 9, 9, 0.78);
    img.disc(x, y, 4.2, 0x6a4a28);
    img.disc(x, y, 3.2, fish ? 0x5a88b0 : 0x3a5a7a);
    if (fish) for (const [i, j, c] of [[-1, -1, 0xdce8f0], [1, 0, 0xb8c8d8], [0, 1, 0xe8f0f4], [-2, 1, 0x9ab0c4], [1, -2, 0xe86a50]]) img.set(x + i, y + j, c);
  };
  // ---- the far quay, left of the road: the fish market. Stalls under plank awnings weighted with stones, tubs and
  // baskets out in front, fish laid on boards, the buyers; a barge unloading at the wall
  for (const [sx, sw] of [[14, 44], [66, 40], [112, 46]]) {
    const sy = by - 164;
    shadow(sx + 4, sy + 6, sw, 24, 0.7);
    for (let j = 0; j < 22; j++)
      for (let i = 0; i < sw; i++) {
        let c = ramp(WOOD, 0.55 + ((i >> 2) % 3) * 0.08 - j / 90);
        if (i % 4 === 0) c = ramp(WOOD, 0.22);
        if (j === 0 || j === 21) c = ramp(WOOD, 0.12);
        if (j === 1) c = ramp(WOOD, 0.9);
        img.set(sx + i, sy + j, c);
      }
    for (let k = 0; k < 4; k++) {
      const [i, j] = [5 + Math.floor(pr() * (sw - 10)), 4 + Math.floor(pr() * 14)];
      img.disc(sx + i, sy + j, 1.8, ramp(STONE, 0.5 + pr() * 0.4));
      img.set(sx + i + 1, sy + j + 1, 0x2a2824);
    }
    // the boards of fish in front of it
    for (let k = 0; k < Math.floor(sw / 14); k++) {
      const bx = sx + 3 + k * 14;
      img.rect(bx, sy + 24, 10, 6, 0xc8b088);
      img.rect(bx, sy + 29, 10, 1, 0x6a5230);
      for (let q = 0; q < 4; q++) {
        img.rect(bx + 1 + q * 2, sy + 25, 1, 4, q % 2 ? 0xdce8f0 : 0x8aa8c0);
        img.set(bx + 1 + q * 2, sy + 25, k === 1 ? 0xe86a50 : 0x4a6a8a);
      }
    }
  }
  for (const [x, y, f] of [[22, -126, 1], [34, -124, 1], [52, -128, 0], [78, -124, 1], [96, -126, 1], [128, -126, 1], [142, -124, 0], [156, -128, 1]]) tub(x, by + y, f);
  for (const [x, y, c, h] of [[28, -134, 0x3a4a6a, 'head'], [46, -122, 0x7a4a2a, 'kasa'], [62, -132, 0x2a3a4a, 'head'], [88, -134, 0x5a3a5a, 'head'], [106, -122, 0x4a5a3a, 'kasa'], [120, -134, 0x8a6a40, 'head'], [136, -134, 0x3a3a4a, 'head'], [150, -120, 0x6a3028, 'head'], [164, -136, 0x4a4a5a, 'kasa']])
    person(x, by + y, c, h);
  // a fishmonger off with his two baskets on a pole
  person(58, by - 118, 0x2a4a6a, 'kasa');
  img.line(48, by - 118, 68, by - 118, 0x5a4424);
  for (const x of [47, 69]) {
    img.disc(x, by - 117, 3, 0x8a6a3a);
    img.disc(x, by - 117, 2, 0xb8c8d8);
  }
  // ---- the far quay, right of the road: storehouses (white plaster, tiled roofs, the ridge down each), rice bales
  // and sake kegs stacked on the quay, the men carrying them in
  for (const [sx, sw] of [[384, 62], [454, 78]]) {
    const sy = by - 170;
    shadow(sx + 5, sy + 6, sw, 36, 0.66);
    for (let j = 0; j < 34; j++)
      for (let i = 0; i < sw; i++) {
        const up = j < 17;
        let c = ramp(TILE, (up ? 0.62 : 0.36) + ((i % 6) < 1 ? -0.14 : 0) + ((j % 4) === 0 ? -0.08 : 0.04));
        if (j === 16 || j === 17) c = ramp(TILE, 0.88);
        if (i < 2 || i >= sw - 2) c = 0xe8e4d8;
        if (j === 33) c = ramp(TILE, 0.1);
        img.set(sx + i, sy + j, c);
      }
    // the plaster wall's foot showing below the eaves, its doorway and iron-bound shutters
    img.rect(sx, sy + 34, sw, 5, 0xe8e4d8);
    img.rect(sx, sy + 38, sw, 1, 0x8a887e);
    for (let i = 10; i < sw - 8; i += 18) {
      img.rect(sx + i, sy + 34, 7, 5, 0x24222a);
      img.rect(sx + i + 3, sy + 34, 1, 5, 0x6a6a74);
    }
  }
  for (let k = 0; k < 5; k++) bale(392 + k * 11, by - 124, false);
  for (let k = 0; k < 4; k++) bale(398 + k * 11, by - 127, false);
  for (let k = 0; k < 3; k++) for (let q = 0; q < 2; q++) keg(470 + k * 10, by - 126 + q * 9);
  for (let k = 0; k < 3; k++) bale(506 + k * 2, by - 128 + k * 6, true);
  for (const [x, y, c, h] of [[446, -124, 0x4a3a2a, 'head'], [458, -130, 0x2a3a4a, 'head'], [528, -122, 0x6a5a3a, 'kasa']]) person(x, by + y, c, h);
  bale(441, by - 131, true); // (the one on his shoulder)
  // ---- the near quay, left of the road: the kōsatsuba, the shogunate's notice boards under their own roof inside a
  // fence on a stone footing; readers before it. A well; a lantern on its post.
  {
    const [x0, y0] = [40, by + 124];
    img.rect(x0 - 4, y0 - 2, 92, 30, ramp(STONE, 0.62));
    for (let i = 0; i < 92; i += 8) img.rect(x0 - 4 + i, y0 - 2, 1, 30, ramp(STONE, 0.36));
    img.rect(x0 - 4, y0 + 27, 92, 1, ramp(STONE, 0.2));
    shadow(x0 + 4, y0 + 6, 80, 14, 0.68);
    for (let j = 0; j < 12; j++)
      for (let i = 0; i < 80; i++) {
        let c = ramp(TILE, (j < 6 ? 0.6 : 0.34) + (i % 5 === 0 ? -0.12 : 0));
        if (j === 5 || j === 6) c = ramp(TILE, 0.86);
        img.set(x0 + i, y0 + j, c);
      }
    // the boards themselves, showing under the eaves: pale wood, lines of writing
    for (let k = 0; k < 6; k++) {
      img.rect(x0 + 3 + k * 13, y0 + 12, 10, 5, 0xe0cc9c);
      for (let q = 0; q < 4; q++) img.rect(x0 + 4 + k * 13 + q * 2, y0 + 13, 1, 3, 0x2a2420);
    }
    for (let i = -4; i < 88; i += 6) {
      img.rect(x0 + i, y0 + 22, 2, 4, ramp(WOOD, 0.3));
      img.set(x0 + i, y0 + 22, ramp(WOOD, 0.8));
    }
    img.rect(x0 - 4, y0 + 23, 92, 1, ramp(WOOD, 0.5));
    for (const [x, c, h] of [[54, 0x3a4a6a, 'head'], [66, 0x6a3a3a, 'kasa'], [84, 0x4a4a3a, 'head'], [100, 0x2a3a4a, 'head']]) person(x, y0 + 33, c, h);
    // the well: a square curb of timber, the dark water, its bucket and rope
    shadow(152, y0 + 8, 14, 14, 0.72);
    img.rect(148, y0 + 4, 14, 14, ramp(WOOD, 0.5));
    img.rect(148, y0 + 4, 14, 1, ramp(WOOD, 0.9));
    img.rect(151, y0 + 7, 8, 8, 0x0e1a2a);
    img.set(153, y0 + 9, 0x5a8ac0);
    img.disc(166, y0 + 14, 2.4, ramp(WOOD, 0.36));
    img.disc(166, y0 + 14, 1.4, 0x2a4a6a);
    person(142, y0 + 14, 0x8a4a5a, 'head');
  }
  // ---- the near quay, right of the road: stone steps down to the water with boats tied at their foot, mooring
  // posts along the wall, a teahouse's reed awning and benches, travellers waiting for the procession to pass
  {
    const sx = 418;
    for (let j = 0; j < 22; j++)
      for (let i = 0; i < 40; i++) {
        const c = j % 4 === 0 ? ramp(STONE, 0.28) : ramp(STONE, 0.5 + (j >> 2) * 0.08 + ((i * 13 + j) % 5) * 0.02);
        img.set(sx + i, by + 92 + j, c);
      }
    for (let j = 0; j < 10; j++) for (let i = 0; i < 40; i++) if ((i + j) % 2) img.set(sx + i, by + 88 + j, 0x9ac0e0, 0.25 - j * 0.02); // (the lowest steps under water)
    const [tx, ty] = [470, by + 132];
    shadow(tx + 5, ty + 6, 58, 24, 0.7);
    for (let j = 0; j < 22; j++)
      for (let i = 0; i < 58; i++) {
        let c = ramp(THATCH, 0.5 + ((j * 3 + i) % 4) * 0.05 + (j < 11 ? 0.12 : -0.1));
        if (i % 12 === 0) c = ramp(WOOD, 0.3);
        if (j === 0 || j === 21) c = ramp(WOOD, 0.2);
        img.set(tx + i, ty + j, c);
      }
    for (let k = 0; k < 3; k++) {
      img.rect(tx + 4 + k * 18, ty + 26, 13, 5, 0xa82a20);
      img.rect(tx + 4 + k * 18, ty + 30, 13, 1, 0x5a1410);
    }
    for (const [x, y, c, h] of [[478, 27, 0x3a5a4a, 'kasa'], [498, 28, 0x6a4a3a, 'head'], [516, 27, 0x4a4a6a, 'head'], [436, 30, 0x5a3a2a, 'kasa'], [452, 26, 0x2a3a5a, 'head']]) person(x, ty + y, c, h);
    // the teahouse's banner on its pole
    img.rect(466, ty - 2, 1, 24, ramp(WOOD, 0.25));
    img.rect(460, ty, 6, 14, 0xf0ece0);
    for (let q = 0; q < 3; q++) img.rect(462, ty + 2 + q * 4, 2, 2, 0x1a3a6a);
  }
  for (const s of [-1, 1])
    for (let x = 10; x < FW; x += 44) {
      if (x > BX0 - 12 && x < BX1 + 12) continue;
      if (s > 0 && x > 410 && x < 464) continue;
      // mooring posts on the quay's edge
      const y = by + s * 113;
      shadow(x, y + 1, 5, 4, 0.74);
      img.rect(x - 1, y - 2, 4, 4, ramp(WOOD, 0.3));
      img.rect(x - 1, y - 2, 3, 1, ramp(WOOD, 0.75));
    }
  // ---- boats lying at the walls: a flat barge with a hull of planks, its cargo, a man or a pole aboard
  const barge = (x, y, len, wid, cargo) => {
    for (let j = 0; j < wid + 3; j++) for (let i = 0; i < len; i++) img.tint(x + i + 3, y + j + 3, 0.8);
    for (let i = 0; i < len; i++) {
      const t = Math.min(i, len - 1 - i);
      const hw = Math.min(wid / 2, 1 + t * 0.55);
      for (let j = Math.ceil(wid / 2 - hw); j < wid / 2 + hw; j++) {
        const e = Math.min(j - (wid / 2 - hw), wid / 2 + hw - 1 - j);
        img.set(x + i, y + j, e < 1 ? ramp(WOOD, j < wid / 2 ? 0.84 : 0.16) : ramp(WOOD, 0.5 + ((i >> 2) % 2) * 0.07));
      }
    }
    for (let i = 8; i < len - 6; i += 10) img.rect(x + i, y + 2, 1, wid - 4, ramp(WOOD, 0.26));
    cargo(x, y);
    // the ripple along its water side
    for (let i = 2; i < len - 2; i++) if ((i + y) % 3) img.set(x + i, y + wid + 1, 0xdcecf8, 0.4);
  };
  barge(20, by - 97, 62, 14, (x, y) => {
    for (let k = 0; k < 4; k++) tub(x + 14 + k * 10, y + 7, k !== 2);
    person(x + 54, y + 7, 0x2a4a6a, 'kasa');
  });
  barge(100, by - 96, 50, 12, (x, y) => {
    for (let k = 0; k < 3; k++) {
      img.disc(x + 14 + k * 9, y + 6, 3.4, 0x8a6a3a);
      img.disc(x + 14 + k * 9, y + 6, 2.2, k % 2 ? 0xc8d4dc : 0xe8a070);
    }
    person(x + 42, y + 6, 0x6a4a2a, 'head');
  });
  barge(396, by - 96, 70, 15, (x, y) => {
    for (let k = 0; k < 5; k++) bale(x + 10 + k * 9, y + 3, false);
    for (let k = 0; k < 4; k++) bale(x + 14 + k * 9, y + 1, false);
    person(x + 62, y + 7, 0x4a3a2a, 'kasa');
  });
  barge(474, by - 95, 52, 12, (x, y) => {
    for (let k = 0; k < 3; k++) keg(x + 14 + k * 10, y + 6);
  });
  barge(424, by + 78, 30, 9, (x, y) => {
    img.line(x + 4, y + 4, x + 26, y + 4, 0xd8c090);
    person(x + 22, y + 4, 0x3a4a5a, 'kasa');
  });
  barge(48, by + 84, 56, 13, (x, y) => {
    // timber for the builders, lashed in a stack
    for (let k = 0; k < 5; k++) {
      img.rect(x + 9, y + 2 + k * 2, 38, 1, ramp(WOOD, 0.6 + (k % 2) * 0.2));
      img.set(x + 9, y + 2 + k * 2, 0xe8d0a0);
    }
    for (const i of [16, 38]) img.rect(x + i, y + 2, 1, 9, 0x3a2a1a);
    person(x + 51, y + 6, 0x5a4a3a, 'head');
  });
  // ---- the bridge's shadow on the water, and its piers: rows of piles under the deck, their tops and the cross
  // beams showing at its sides, the water parting round them
  for (let y = by - 98; y < by + 98; y++) for (let x = BX1; x < BX1 + 20; x++) img.tint(x, y + 6, 0.58 + ((x - BX1) / 20) * 0.3);
  for (const py of [-66, -22, 22, 66])
    for (const [x0, s] of [[BX0, -1], [BX1 - 1, 1]]) {
      for (let k = 1; k <= 9; k++) img.set(x0 + s * k, by + py, ramp(WOOD, s < 0 ? 0.6 : 0.2));
      for (let k = 1; k <= 9; k++) img.set(x0 + s * k, by + py + 1, ramp(WOOD, 0.1));
      for (const k of [3, 8]) {
        img.rect(x0 + s * k - 1, by + py - 2, 3, 5, ramp(WOOD, s < 0 ? 0.42 : 0.14));
        img.set(x0 + s * k - 1, by + py - 2, ramp(WOOD, 0.8));
      }
      for (let k = 0; k < 16; k++) {
        const a = k / 16;
        img.set(x0 + s * (11 - a * 3), by + py + 3 + k, 0xdcecf8, 0.5 * (1 - a));
        img.set(x0 + s * (2 + a * 2), by + py + 3 + k, 0xdcecf8, 0.4 * (1 - a));
      }
    }
  // ---- the deck: boards laid across, brightest over the crown of the arch, nailed along three beams; worn pale
  // down the middle where everyone walks
  for (let y = by - 130; y <= by + 130; y++) {
    const arch = Math.cos(((y - by) / 130) * (Math.PI / 2));
    const board = Math.floor((y - by + 130) / 5);
    const tone = ((board * 53) % 7) / 28;
    for (let x = BX0; x < BX1; x++) {
      const n = fbm(x * 0.5, y * 2, { seed: 47, scale: 6 });
      const worn = Math.max(0, 1 - Math.abs(x - CX) / 60) * 0.08;
      let c = ramp(WOOD, 0.3 + arch * 0.34 + tone + worn + (n - 0.5) * 0.12);
      if ((y - by + 130) % 5 === 0) c = ramp(WOOD, 0.08 + arch * 0.14);
      else if ((y - by + 130) % 5 === 1) c = mix(c, 0xf0dcb0, 0.14);
      if ((x === BX0 + 30 || x === CX || x === BX1 - 30) && (y - by + 130) % 5 === 3) c = 0x2a2018;
      img.set(x, y, c);
    }
  }
  // the steps of earth and stone at each end, where the road comes up onto the deck
  for (const s of [-1, 1])
    for (let k = 0; k < 3; k++)
      for (let x = BX0 + 6; x < BX1 - 6; x++) {
        const y = by + s * (131 + k * 3);
        for (let j = 0; j < 3; j++) img.set(x, y + (s > 0 ? j : -j), j === (s > 0 ? 0 : 2) ? ramp(STONE, 0.3) : ramp(STONE, 0.6 + ((x * 7 + k) % 5) * 0.03));
      }
  // the rails: a beam down each side on posts; on every post a bronze giboshi, the four end posts taller, theirs
  // bigger and gone green
  for (const x0 of [BX0, BX1 - 8]) {
    shadow(x0 + 3, by - 126, 9, 256, 0.74);
    for (let y = by - 130; y <= by + 130; y++)
      for (let i = 0; i < 8; i++) {
        const arch = Math.cos(((y - by) / 130) * (Math.PI / 2));
        img.set(x0 + i, y, i === 0 ? ramp(WOOD, 0.9) : i === 7 ? ramp(WOOD, 0.08) : i < 3 ? ramp(WOOD, 0.52 + arch * 0.22) : i < 5 ? ramp(WOOD, 0.14) : ramp(WOOD, 0.4 + arch * 0.2));
      }
    for (let y = by - 130; y <= by + 130; y += 26) {
      const end = Math.abs(y - by) === 130;
      const hw = end ? 6 : 5;
      shadow(x0 + 4 - hw + 3, y - hw + 3, hw * 2, hw * 2, 0.7);
      img.rect(x0 + 4 - hw, y - hw, hw * 2, hw * 2, ramp(WOOD, 0.3));
      img.rect(x0 + 4 - hw, y - hw, hw * 2, 1, ramp(WOOD, 0.86));
      img.rect(x0 + 4 - hw, y - hw, 1, hw * 2, ramp(WOOD, 0.7));
      img.disc(x0 + 4, y, end ? 4.2 : 3.2, end ? 0x4a7a62 : 0x8a6a2a);
      img.disc(x0 + 3.4, y - 0.6, end ? 2.8 : 2, end ? 0x6aa88a : 0xc8a040);
      img.set(x0 + 3, y - 1, end ? 0xc8ecd8 : 0xfff0b0);
      img.set(x0 + 4, y, end ? 0x2a4a3a : 0x5a4418);
    }
  }
  // ---- the procession, on its way up the bridge in two files with the lord's palanquin between them
  const LIV = [0x3a558c, 0x54547a, 0x4a6aa0, 0x2e4a78]; // the house's dark blues
  const spear = (x, y, lean) => {
    // a keyari carried upright and tipped forward: the shaft, the black tuft of feathers at its head
    img.line(x + 3, y, x + 3 + lean, y - 22, 0x3a2a1a);
    img.disc(x + 3 + lean, y - 24, 3, 0x14121a);
    img.disc(x + 3 + lean, y - 25, 1.4, 0x3a3848);
    img.set(x + 3 + lean, y - 28, 0xd8b048);
  };
  const banner = (x, y) => {
    img.line(x + 3, y, x + 3, y - 26, 0x3a2a1a);
    shadow(x + 6, y - 22, 8, 16, 0.8);
    img.rect(x + 4, y - 26, 7, 16, 0xf0ece0);
    img.rect(x + 4, y - 26, 7, 1, 0x1a1420);
    img.disc(x + 7, y - 19, 2, 0x1a1420);
    img.set(x + 7, y - 19, 0xf0ece0);
    img.rect(x + 4, y - 13, 7, 2, 0x7a1a14);
  };
  const box = (x, y) => {
    // a hasami-bako on its pole over the shoulder: black lacquer, the crest in gold
    img.line(x, y - 2, x, y + 9, 0x3a2a1a);
    shadow(x - 2, y + 7, 7, 6, 0.76);
    img.rect(x - 3, y + 5, 6, 6, 0x16141c);
    img.rect(x - 3, y + 5, 6, 1, 0x4a4858);
    img.set(x, y + 8, 0xd8b048);
  };
  const files = [CX - 34, CX + 34];
  // the head of the column
  for (const [n, x] of files.entries()) {
    person(x, by - 112, LIV[0], 'head');
    spear(x, by - 112, n ? 4 : -4);
    person(x, by - 96, LIV[1], 'head');
    box(x, by - 96);
    person(x, by - 76, LIV[2], 'head');
    banner(x, by - 76);
    for (let k = 0; k < 3; k++) person(x + (k % 2 ? 2 : -1), by - 58 + k * 14, LIV[(k + n) % 4], 'jingasa', { swords: true });
  }
  for (const y of [-104, -66, -40]) person(CX, by + y, LIV[3], 'jingasa', { swords: true }); // the officers down the middle
  // the norimono: black lacquer and gold, its roof ridged, the long pole through it on the bearers' shoulders
  {
    const y0 = by - 14;
    img.rect(CX - 1, y0 - 18, 3, 68, ramp(WOOD, 0.24));
    img.rect(CX - 1, y0 - 18, 1, 68, ramp(WOOD, 0.7));
    shadow(CX - 9 + 5, y0 + 5, 20, 32, 0.66);
    for (let j = 0; j < 32; j++)
      for (let i = 0; i < 20; i++) {
        const e = Math.min(i, 19 - i, j, 31 - j);
        let c = i < 10 ? 0x2c2a38 : 0x16141e;
        if (e === 0) c = 0xc8a040;
        else if (e === 1) c = 0x0e0c14;
        if (i === 9 || i === 10) c = 0x4a4858;
        if ((j === 8 || j === 23) && e > 1) c = 0x8a6a2a;
        img.set(CX - 10 + i, y0 + j, c);
      }
    img.disc(CX, y0 + 16, 2.4, 0xc8a040);
    img.set(CX, y0 + 16, 0x16141e);
    for (const y of [y0 - 12, y0 - 4, y0 + 36, y0 + 44]) for (const dx of [-7, 7]) person(CX + dx, y, 0x9a7650, 'head');
    // the great red umbrella carried beside it, its ribs and its knob
    shadow(CX + 20, y0 + 10, 22, 22, 0.76);
    img.disc(CX + 26, y0 + 14, 11, 0x8a1c14);
    img.disc(CX + 25, y0 + 13, 9.4, 0xc03424);
    for (let a = 0; a < 12; a++) img.line(CX + 25, y0 + 13, CX + 25 + Math.cos((a * Math.PI) / 6) * 9, y0 + 13 + Math.sin((a * Math.PI) / 6) * 9, 0x8a1c14);
    img.disc(CX + 25, y0 + 13, 1.6, 0xd8b048);
    person(CX - 22, y0 + 14, LIV[0], 'jingasa', { swords: true });
  }
  // the rear: guards, a led pack horse, porters with their loads on poles
  for (const [n, x] of files.entries()) {
    for (let k = 0; k < 2; k++) person(x, by + 44 + k * 14, LIV[(k + n + 1) % 4], 'jingasa', { swords: true });
    person(x, by + 78, 0x4a3a2a, 'kasa');
    img.line(x, by + 70, x, by + 88, 0x5a4424);
    for (const dy of [-10, 10]) {
      shadow(x - 2, by + 78 + dy, 7, 6, 0.78);
      img.rect(x - 3, by + 76 + dy, 6, 5, n ? 0x7a5a30 : 0x2a4a3a);
      img.rect(x - 3, by + 76 + dy, 6, 1, n ? 0xc4a064 : 0x4a7a5a);
    }
    person(x + (n ? -3 : 3), by + 104, 0x3a3a3a, 'kasa');
    box(x + (n ? -3 : 3), by + 104);
  }
  {
    // the horse: its back and quarters, mane and head forward, the two packs across its saddle, the groom at its head
    const [hx, hy] = [CX, by + 84];
    shadow(hx - 5, hy - 8, 14, 30, 0.72);
    img.ellipse(hx, hy, 4.6, 12, 0x6a4426);
    img.ellipse(hx - 1, hy - 1, 3, 10, 0x8a5c34);
    img.ellipse(hx, hy - 15, 2.6, 5, 0x6a4426);
    img.rect(hx, hy - 14, 1, 9, 0x1a1414);
    img.rect(hx - 1, hy + 11, 2, 6, 0x1a1414);
    for (const dx of [-8, 3]) {
      img.rect(hx + dx, hy - 5, 6, 11, 0xa07c48);
      img.rect(hx + dx, hy - 5, 6, 1, 0xe0c890);
      img.rect(hx + dx, hy, 6, 1, 0x5a4424);
    }
    img.rect(hx - 2, hy - 4, 5, 9, 0x8a1c14);
    person(hx - 9, hy - 20, 0x4a4a3a, 'kasa');
    img.line(hx - 7, hy - 19, hx - 1, hy - 18, 0x2a2018);
  }
  // townsfolk gone down on their knees along the rails as it passes
  for (const [x, y, c] of [[BX0 + 15, -84, 0x6a4a3a], [BX0 + 16, -30, 0x3a5a4a], [BX0 + 15, 26, 0x5a3a5a], [BX1 - 15, -58, 0x4a4a6a], [BX1 - 16, 4, 0x7a5a30], [BX1 - 15, 62, 0x3a4a3a]]) {
    shadow(x - 2, by + y + 1, 8, 6, 0.8);
    img.ellipse(x, by + y, 3.4, 4.2, c);
    img.disc(x + (x < CX ? 4 : -4), by + y, 2, 0x1a1414);
  }
  // The fields race by as one looping picture, so nothing can be animated on the ground; what moves besides the
  // fight's own cars, cones and skid marks is in the air and keeps up with the chase: swallows in loose lines and
  // white egrets, crossing over the road.
  const kit = new PropKit(1833, { artScale: S });
  const bird = (wing, c, tip, n) => {
    // seen from above, heading right: a body, swept wings (out, or half folded), a forked tail
    const r = new Raster(n * 2 + 1, n * 2 + 1);
    const px = (x, y, col) => r.set(Math.round(n + x), Math.round(n + y), col);
    for (let i = -n * 0.5; i <= n * 0.55; i++) for (let j = -n * 0.14; j <= n * 0.14; j++) px(i, j, c);
    const span = wing ? n * 0.55 : n * 0.95;
    for (const z of [-1, 1]) for (let q = 0; q <= span; q++) for (let w = 0; w < n * 0.32 * (1 - q / (span * 1.2)); w++) px(n * 0.15 - q * (wing ? 0.75 : 0.35) - w, z * q, q > span * 0.7 ? tip : c);
    for (const z of [-1, 1]) for (let q = 0; q < n * 0.3; q++) px(-n * 0.5 - q, z * q * 0.45, tip);
    return kit.frame(r);
  };
  const swallow = [bird(0, 0x1c2438, 0x101420, 9), bird(1, 0x1c2438, 0x101420, 9)];
  const egret = [bird(0, 0xf2f2ea, 0xc8ccd0, 14), bird(1, 0xf2f2ea, 0xc8ccd0, 14)];
  for (const [f, u0, u1, n, sp, dir] of [[swallow, 520, 610, 5, 34, 1], [swallow, 760, 690, 4, 30, -1], [egret, 640, 700, 3, 20, 1], [swallow, 850, 880, 6, 38, -1], [egret, 820, 770, 2, 18, -1], [swallow, 560, 500, 4, 32, -1]]) {
    const xs = dir > 0 ? [-16, 60, 120, 196] : [196, 120, 60, -16];
    kit.path(xs.map((x, i) => [x, u0 + ((u1 - u0) * i) / 3 + (i % 2 ? 9 : -5)]), f, { sp, n, gap: 13, mode: 'wrap', turn: 'rot', fps: 6, a: 0.95, d: 0.8 });
  }
  // two boats under way on the canal, each keeping to its own side of the bridge: a sculled skiff, its boatman
  // standing aft at the long oar (two frames), a load of baskets forward
  {
    const skiff = (f, load) => {
      const r = new Raster(40, 15);
      for (let i = 0; i < 40; i++) {
        const hw = Math.min(5, 0.8 + (39 - i) * 0.5, 2.5 + i * 0.6);
        for (let j = -Math.floor(hw); j <= hw; j++) {
          const e = hw - Math.abs(j);
          r.set(i, 7 + j, e < 1 ? ramp(WOOD, j < 0 ? 0.84 : 0.16) : ramp(WOOD, 0.52 + ((i >> 2) % 2) * 0.07));
        }
      }
      for (const i of [10, 20, 29]) for (let j = -3; j <= 3; j++) r.set(i, 7 + j, ramp(WOOD, 0.24));
      for (let k = 0; k < 3; k++) {
        r.disc(15 + k * 5, 7, 2.2, 0x8a6a3a);
        r.disc(15 + k * 5, 7, 1.3, load[k % load.length]);
      }
      r.line(6, 7, 0, f ? 3 : 11, 0xd8c090);
      r.ellipse(7, 7, 2.4, 3.2, 0x2a4a6a);
      r.disc(7, 7, 2.6, 0xc8a868);
      r.disc(7, 7, 1.4, 0xe0c488);
      grade(r, { sat: 0.82, bright: 0.86, tint: 0x182030, tintAmt: 0.05 });
      return kit.frame(r);
    };
    const uBy = 300 / S;
    kit.path([[-8, uBy + 17], [44, uBy + 17]], [0, 1].map((f) => skiff(f, [0xc8d4dc, 0xe8a070])), { sp: 5, mode: 'pp', hold: 3, turn: 'flip', fps: 1.5, d: 0.02 });
    kit.path([[140, uBy - 6], [188, uBy - 6]], [0, 1].map((f) => skiff(f, [0x7aac4e, 0xd0aa40])), { sp: 4, mode: 'pp', hold: 4, s0: 0.4, turn: 'flip', fps: 1.5, d: 0.02 });
  }
  grade(img, { sat: 0.82, bright: 0.86, tint: 0x182030, tintAmt: 0.05 });
  return {
    strip: img,
    props: kit.pack(),
    meta: { width: W, artScale: S, chunkHeight: L, chunks: 1, length: L, tint: tintTable(L, () => [255, 255, 255]) },
  };
}
