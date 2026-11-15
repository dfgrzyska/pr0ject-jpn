// The arena of encounter 2 (ex2): the Tōkaidō of Hiroshige's Fifty-three Stations (1833-34, long in the public
// domain), seen from above and gone modern: the old highway between Edo and Kyoto in ochre earth, lined with its
// pines, between paddies shaded in the prints' bokashi blues and greens, thatched teahouses and a river with its
// wooden bridge; down its middle someone has painted lane lines. The far layer is a seamless loop that races by
// (the chase); the middle layer only holds the start: Nihonbashi, the bridge in Edo where the road begins, with a
// daimyō's procession setting out over it, as in the first print of the series.
import { Raster, fbm, rng, mix } from '../../lib/raster.mjs';
import { rampColor, grade } from '../nature.mjs';
import { tintTable } from '../props.mjs';

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
  // Nihonbashi: the arched wooden bridge across the bottom of the first screen, the canal under it, the
  // procession setting out over it (banners, spears, the palanquin), the gate posts at its end
  const by = L * S - 300; // the bridge's middle
  for (let y = by - 120; y < by + 120; y++)
    for (let x = 0; x < FW; x++) {
      const d = Math.abs(y - by);
      const canal = d > 60;
      const w = fbm(x * 0.4, y * 1.5, { seed: 23, scale: 9 });
      let c = canal ? rampColor(SKYWATER, 0.3 + w * 0.5 + (w > 0.7 ? 0.3 : 0), x, y) : (y - by + 66) % 10 < 1 ? 0x3a2a1a : rampColor(EARTH, 0.4 + (60 - d) / 300 + (w - 0.5) * 0.2, x, y);
      if (!canal && d > 52) c = (x % 22 < 4) ? 0x3a2a1a : 0x8a5a30; // the rails, their posts
      img.set(x, y, c);
    }
  // the procession: a line of little figures over the bridge, banners on poles, the palanquin in the middle
  const pr = rng(1603);
  for (let k = 0; k < 30; k++) {
    const x = 30 + k * 16 + pr() * 4;
    const y = by - 20 + (k % 3) * 14 + pr() * 4;
    for (let j = -4; j <= 4; j++) for (let i = -3; i <= 3; i++) if (i * i / 9 + j * j / 16 < 1) img.set(x + i, y + j, k % 5 === 0 ? 0x7a1a14 : 0x2a2a3a);
    for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (i * i + j * j < 5) img.set(x + i, y - 6 + j, 0x1a1414);
    if (k % 4 === 1) {
      for (let j = 0; j < 22; j++) img.set(x + 4, y - 4 - j, 0x3a2a1a);
      for (let j = 0; j < 9; j++) for (let i = 0; i < 6; i++) img.set(x + 5 + i, y - 24 + j, j === 0 ? INK : 0xf0ece0);
    }
  }
  for (let y = by - 12; y < by + 12; y++) for (let x = 250; x < 290; x++) img.set(x, y, Math.abs(y - by) > 9 || Math.abs(x - 270) > 17 ? INK : 0x1a1a24); // the palanquin
  // (no moving parts here: the fight's own cars, cones and skid marks are what moves)
  grade(img, { sat: 0.82, bright: 0.86, tint: 0x182030, tintAmt: 0.05 });
  return {
    strip: img,
    props: null,
    meta: { width: W, artScale: S, chunkHeight: L, chunks: 1, length: L, tint: tintTable(L, () => [255, 255, 255]) },
  };
}
