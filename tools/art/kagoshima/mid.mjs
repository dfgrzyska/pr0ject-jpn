// Middle layer (Kagoshima): the city under a haze of volcanic ash (Chūō station with its rooftop Ferris
// wheel, trams on lawn-covered tracks, palm avenues, the Tenmonkan arcade, yellow ash bags), the
// Kōtsuki river with stone arch bridges, Sengan-en garden by the sea, fields of black-vinegar jars on
// the coast, Kinkō Bay (ferry, fish-farm pens, dolphins), Sakurajima (port, ash-covered village,
// eruption shelters, giant daikon and komikan, the buried torii of Kurokami), the 1914 lava fields and
// the summit crater. Graded from hazy day to the red glow of the crater; lava and lamps are painted
// after the grade. Open water stays transparent (the far layer is the bay).
//
// Coordinates: u = distance from the bottom of the strip (stage start), strip y = L - u.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Raster, fbm, rng, bayer, scaleColor, rgb } from '../../lib/raster.mjs';
import { crownPixels, palmPixels, rampColor } from '../nature.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export const W = 180;
export const CHUNK = 512;
export const CHUNKS = 14;
export const L = CHUNK * CHUNKS;

const CITY = [0, 1300];
const RIVER = [1300, 1345];
const SENGAN = [1345, 2200];
const COAST = [2200, 2850];
const BAY = [2850, 4250];
const ISLAND = [4250, 5400];
const LAVA = [5400, 6560];

const C = {
  grass: [0x45563a, 0x56683f, 0x6a7a4a, 0x7e8c58],
  ash: [0x625e5a, 0x76726c, 0x8c8882, 0xa29e96],
  asphalt: [0x3c3c40, 0x48484c, 0x545458],
  walk: [0x908c84, 0xa09c94, 0xb0aca4],
  soil: [0x332a24, 0x43382f, 0x544639],
  rock: [0x2a2422, 0x3a3230, 0x4e4442, 0x645856],
  sand: [0x403c3a, 0x504c48, 0x625e5a],
  shallow: [0x24505a, 0x30626a, 0x447676, 0x5c8a86],
  roofs: [0x8a8e94, 0xb0aca4, 0x6a4a3a, 0x3a5a7a, 0x9a3a2a, 0x5a6a5a, 0xc8c0b0],
  tile: [0x34363e, 0x44464f, 0x565862],
  stone: [0x6a665e, 0x84807a, 0x9e9a90],
  lawn: [0x3e7a32, 0x4e8c3a],
  rail: 0x8a8a90,
  foam: 0xd8dcd8,
  lava: [0xff4a10, 0xff8a20, 0xffd060],
};

// time of day / atmosphere along the strip: [u, multiply rgb, tint, tint amount]
const TOD = [
  [0, [0.97, 0.95, 0.9], 0x8a7a68, 0.1],
  [2400, [0.92, 0.92, 0.92], 0x6e6e72, 0.14],
  [4250, [0.86, 0.8, 0.76], 0x6a4a3a, 0.14],
  [5400, [0.72, 0.6, 0.56], 0x4a2018, 0.18],
  [L, [0.6, 0.46, 0.42], 0x3a1410, 0.22],
];

const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function buildMid() {
  const stage = JSON.parse(readFileSync(join(root, 'src', 'data', 'stage4.json'), 'utf8'));
  const { mid: V, anchor } = stage.scroll;
  // the boss wave holds where the crater and its side vents are (the game places the boss there)
  const bw = stage.waves.find((w) => w.type === 'boss');
  const CRATER = { x: bw.crater[0], u: bw.crater[1], rx: 66, ry: 46 };
  const VENTS = bw.vents;
  const img = new Raster(W, L);
  const rand = rng(4404);
  const Y = (u) => Math.round(L - u);
  const U = (y) => L - y;
  const reserved = new Uint8Array(W * L);
  const isRes = (x, y) => x >= 0 && x < W && y >= 0 && y < L && reserved[Math.floor(y) * W + Math.floor(x)];
  const anyRes = (x0, y0, w, h) => {
    for (let y = Math.floor(y0); y < y0 + h; y++) for (let x = Math.floor(x0); x < x0 + w; x++) if (isRes(x, y)) return true;
    return false;
  };
  const reserveRect = (x0, y0, w, h) => {
    for (let y = Math.max(0, Math.floor(y0)); y < Math.min(L, y0 + h); y++)
      for (let x = Math.max(0, Math.floor(x0)); x < Math.min(W, x0 + w); x++) reserved[y * W + x] = 1;
  };
  const objects = [];
  const lights = [];
  const pools = [];
  const glow = (x, y, c, a = 1) => lights.push([Math.round(x), Math.round(y), c, a]);
  const pool = (x, y, r, c, k = 0.5) => pools.push({ x, y, r, c, k });
  const shadowRect = (x, y, w, h, f = 0.6) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) img.tint(x + i, y + j, f);
  };
  const ashOn = (c, x, y, amt = 0.3) => (fbm(x, y, { seed: 7, scale: 3 }) < amt ? scaleColor(C.ash[3], 0.95) : c); // grey ash dusting

  const pads = stage.waves.filter((w) => w.type === 'turret').map((w) => ({ x: w.x, u: anchor + V * w.t + 10 }));
  for (const p of pads) reserveRect(p.x - 12, Y(p.u) - 12, 24, 24);

  // ------------------------------------------------------------ 1. land and sea
  const seaX = (u) => {
    if (u < SENGAN[0]) return 999;
    const n = (fbm(u, 5, { seed: 91, scale: 30, octaves: 2 }) - 0.5) * 10;
    if (u < BAY[0]) return 172 - smooth(SENGAN[0], BAY[0], u) * 60 + n;
    return 112 - smooth(BAY[0], BAY[0] + 110, u) * 140 + n;
  };
  const shoreU = (x) => ISLAND[0] + 18 + 22 * Math.sin(x / 26 + 1) + (fbm(x, 3, { seed: 92, scale: 12 }) - 0.5) * 16;
  const landD = (x, u) => {
    let d = seaX(u) - x;
    if (u > BAY[0] + 900) d = Math.max(d, u - shoreU(x));
    return d;
  };
  const land = new Int16Array(W * L);
  for (let y = 0; y < L; y++) {
    const u = U(y);
    for (let x = 0; x < W; x++) {
      const d = landD(x, u);
      land[y * W + x] = Math.max(-999, Math.min(999, Math.round(d)));
      if (d > 0) {
        const island = u > ISLAND[0];
        if (d < 5) img.set(x, y, island ? rampColor(C.sand, 0.3 + fbm(x, y, { seed: 12, scale: 3 }) * 0.6, x, y) : d < 2 ? 0x7a7a76 : 0x9a968e); // black sand / sea wall
        else if (u > LAVA[0] + (fbm(x, 7, { seed: 19, scale: 20 }) - 0.5) * 140) {
          // 1914 lava: ropy flow bands running downhill, blocky crust, drifts of ash in the hollows
          const n = fbm(x, y, { seed: 13, scale: 6, octaves: 3 });
          const rope = Math.sin(y * 0.55 + fbm(x, y, { seed: 17, scale: 14 }) * 9);
          const drift = fbm(x, y, { seed: 18, scale: 26, octaves: 2 });
          let c = rampColor(C.rock, 0.25 + n * 0.5 + rope * 0.12, x, y);
          if (drift > 0.6) c = rampColor(C.ash, (drift - 0.6) * 2 + n * 0.3, x, y);
          img.set(x, y, c);
        }
        else if (island) img.set(x, y, rampColor(C.ash, 0.25 + fbm(x, y, { seed: 14, scale: 9, octaves: 3 }) * 0.6, x, y));
        else img.set(x, y, ashOn(rampColor(C.grass, 0.3 + fbm(x, y, { seed: 15, scale: 8, octaves: 3 }) * 0.6, x, y), x, y, 0.22));
        continue;
      }
      // shallow water near the shore, dithering out into the transparent bay
      const s = 1 + d / 22;
      if (s <= 0 || (s < 0.4 && s < bayer(x, y) * 0.4)) continue;
      let c = rampColor(C.shallow, Math.min(1, s * 0.9 + (fbm(x * 1.2, y, { seed: 16, scale: 6 }) - 0.5) * 0.2), x, y);
      if (d > -1.5) c = C.foam;
      img.set(x, y, c);
    }
  }
  const D = (x, y) => (x < 0 || x >= W || y < 0 || y >= L ? -999 : land[y * W + x]);

  // ------------------------------------------------------------ helpers
  const roadPx = (x, y, across, hw) => {
    const a = Math.abs(across);
    if (a > hw) {
      img.set(x, y, rampColor(C.walk, fbm(x, y, { seed: 33, scale: 3 }), x, y));
      return;
    }
    let c = rampColor(C.asphalt, fbm(x, y, { seed: 31, scale: 4, octaves: 2 }), x, y);
    if (Math.abs(a - hw / 2) < 0.5 && (x + y) % 6 < 3 && hw > 4) c = 0xb8b4a8; // lane marks
    img.set(x, y, ashOn(c, x, y, 0.12));
  };
  const vRoad = (cx, hw, u0, u1) => {
    for (let u = u0; u < u1; u++) for (let x = Math.floor(cx - hw - 2); x <= cx + hw + 1; x++) if (D(x, Y(u)) > 0) roadPx(x, Y(u), x + 0.5 - cx, hw);
    reserveRect(cx - hw - 3, Y(u1), hw * 2 + 6, u1 - u0);
  };
  const hRoad = (uc, hw, x0 = 0, x1 = W) => {
    for (let u = Math.floor(uc - hw - 2); u <= uc + hw + 1; u++) for (let x = x0; x < x1; x++) if (D(x, Y(u)) > 0) roadPx(x, Y(u), u + 0.5 - uc, hw);
    reserveRect(x0, Y(uc + hw + 3), x1 - x0, hw * 2 + 6);
  };
  /** Building with a flat or tiled roof dusted with ash and a sunlit front face with windows. */
  const building = (x, y, w, h, faceH, opt = {}) => {
    const roof = opt.roof ?? rand.pick(C.roofs);
    const wall = opt.wall ?? rand.pick([0xd8d0c0, 0xc4c2bc, 0xb8a890, 0xe0dcd2]);
    const units = [];
    for (let i = 0; i < Math.floor((w * h) / 300); i++) units.push([x + 3 + Math.floor(rand() * (w - 9)), y + 3 + Math.floor(rand() * (h - 8))]);
    objects.push({
      y: y + h + faceH,
      shadow: () => shadowRect(x + 3, y + 4, w, h + faceH, 0.55),
      draw: () => {
        for (let yy = y; yy < y + h; yy++)
          for (let xx = x; xx < x + w; xx++) {
            let c = xx === x || yy === y ? scaleColor(roof, 1.15) : xx === x + w - 1 ? scaleColor(roof, 0.8) : roof;
            if (opt.tiles && (yy - y) % 2 === 0) c = scaleColor(c, 0.88);
            img.set(xx, yy, ashOn(c, xx, yy, 0.18));
          }
        for (const [ux, uy] of units) {
          img.rect(ux + 1, uy + 1, 4, 3, scaleColor(roof, 0.6));
          img.rect(ux, uy, 4, 3, 0x8a8c90);
        }
        for (let yy = y + h; yy < y + h + faceH; yy++) for (let xx = x; xx < x + w; xx++) img.set(xx, yy, yy === y + h ? scaleColor(wall, 0.6) : wall);
        for (let r = y + h + 2; r < y + h + faceH - 1; r += 2) for (let xx = x + 2; xx < x + w - 2; xx += 3) img.set(xx, r, 0x4a5a6a);
      },
    });
    reserveRect(x - 1, y - 1, w + 2, h + faceH + 2);
  };
  /** Pile of the city's yellow ash-collection bags at a kerb. */
  const ashBags = (x, y) => {
    for (const [dx, dy] of [[0, 0], [2, 0], [1, 1], [3, 1]]) {
      img.tint(x + dx + 1, y + dy + 1, 0.6);
      img.set(x + dx, y + dy, (dx + dy) % 2 ? 0xe8c020 : 0xf4d840);
    }
  };
  const tree = (kind, x, y, r) => {
    const seed = Math.floor(rand() * 1e9);
    const cx = Math.round(x);
    const cy = Math.round(y);
    const crown = kind === 'komikan' ? 'fukugi' : kind; // mandarin trees: dense dark crowns, fruit added below
    const px = () => (kind === 'palm' ? palmPixels(cx, cy, r, rng(seed)) : crownPixels(crown, cx, cy, r, rng(seed), seed & 1023));
    const off = Math.round(2 + r * 0.3);
    objects.push({
      y: cy + r * 0.6,
      shadow: () => {
        for (const p of px()) img.tint(p.x + off, p.y + off + 1, 0.55);
      },
      draw: () => {
        for (const p of px()) img.set(p.x, p.y, ashOn(p.c, p.x, p.y, kind === 'palm' ? 0.08 : 0.16));
        if (kind === 'komikan') {
          const fr = rng(seed + 1);
          for (let i = 0; i < r * 2.5; i++) {
            const a = fr() * Math.PI * 2;
            const dd = fr() * r * 0.85;
            img.set(Math.round(cx + Math.cos(a) * dd), Math.round(cy + Math.sin(a) * dd), fr() < 0.8 ? 0xf08a20 : 0xffc040);
          }
        }
      },
    });
  };

  // ------------------------------------------------------------ A. the city
  {
    const streets = [120, 250, 450, 600, 850, 1100];
    for (const x of [30, 150]) vRoad(x, 5, 0, RIVER[0]);
    vRoad(90, 10, 0, RIVER[0]);
    for (const u of streets) hRoad(u, 5);
    // the tram line down the middle of the avenue: lawn-covered tracks, a tram here and there
    for (let u = 0; u < RIVER[0]; u++) {
      const y = Y(u);
      if (streets.some((s) => Math.abs(u - s) < 7)) continue;
      for (let x = 85; x <= 95; x++) img.set(x, y, rampColor(C.lawn, fbm(x, y, { seed: 35, scale: 2 }), x, y));
      for (const x of [86, 88, 92, 94]) img.set(x, y, C.rail);
    }
    for (const [u, color] of [[180, 0xd84a2a], [700, 0x2a8a5a], [1180, 0xe8e0d0]])
      objects.push({
        y: Y(u),
        shadow: () => shadowRect(89, Y(u + 26) + 2, 6, 26, 0.55),
        draw: () => {
          img.rect(86, Y(u + 26), 8, 26, color);
          img.rect(86, Y(u + 26), 8, 1, 0xf0ece0);
          for (let k = 2; k < 24; k += 4) img.rect(87, Y(u + 26) + k, 6, 2, 0x8aa8c0);
        },
      });
    // palms along the avenue
    for (let u = 20; u < RIVER[0]; u += 26) {
      if (streets.some((s) => Math.abs(u - s) < 12)) continue;
      for (const x of [76, 104]) tree('palm', x, Y(u), 5 + rand());
    }
    // Kagoshima-Chūō station with the Ferris wheel on its roof
    {
      const x = 102;
      const y = Y(420);
      objects.push({
        y: y + 50,
        shadow: () => shadowRect(x + 5, y + 6, 38, 50, 0.5),
        draw: () => {
          img.rect(x, y, 38, 40, 0xa8a4a0);
          img.rect(x, y, 38, 1, 0xc8c4c0);
          img.rect(x + 2, y + 2, 34, 36, 0x9a9690);
          for (let yy = y + 40; yy < y + 50; yy++) for (let xx = x; xx < x + 38; xx++) img.set(xx, yy, yy === y + 40 ? 0x5a5a5e : (xx - x) % 3 === 1 ? 0x5a7a9a : 0xd0ccc4);
          // the wheel: a red ring with spokes and coloured gondolas
          const cx = x + 19;
          const cy = y + 18;
          for (let a = 0; a < Math.PI * 2; a += 0.02) img.set(Math.round(cx + Math.cos(a) * 15), Math.round(cy + Math.sin(a) * 15), 0xd8302a);
          for (let k = 0; k < 12; k++) {
            const a = (k / 12) * Math.PI * 2;
            img.line(cx, cy, Math.round(cx + Math.cos(a) * 14), Math.round(cy + Math.sin(a) * 14), 0xc8c4bc);
            img.rect(Math.round(cx + Math.cos(a) * 15) - 1, Math.round(cy + Math.sin(a) * 15), 3, 2, [0xf0c030, 0x40a0e0, 0xe85a8a, 0x5ac05a][k % 4]);
          }
          img.rect(cx - 1, cy - 1, 3, 3, 0xe8e4dc);
          img.rect(cx - 4, cy + 15, 9, 3, 0x7a7a80);
        },
      });
      reserveRect(x - 2, y - 2, 42, 56);
    }
    // Tenmonkan: a covered shopping arcade cutting through the blocks
    for (let u = 610; u < 1090; u++) {
      if (streets.some((s) => Math.abs(u - s) < 8)) continue;
      const y = Y(u);
      for (let x = 54; x < 66; x++) img.set(x, y, x === 54 || x === 65 ? 0x7a7c84 : (u % 8 === 0 ? 0x9aa4ae : x % 3 === 0 ? 0xc8d0d8 : 0xb8c2cc));
    }
    reserveRect(52, Y(1090), 16, 480);
    // blocks with buildings
    const blocks = [[0, 22], [41, 51], [69, 77], [104, 142], [159, W]];
    const all = [0, ...streets, RIVER[0] - 6];
    for (let i = 0; i < all.length - 1; i++) {
      const u0 = all[i] + 9;
      const u1 = all[i + 1] - 9;
      for (const [x0, x1] of blocks) {
        let x = x0 + 1;
        while (x < x1 - 7) {
          const w = Math.min(x1 - x, 14 + Math.floor(rand() * 18));
          let u = u0;
          while (u < u1 - 18) {
            const h = Math.min(u1 - u, 22 + Math.floor(rand() * 24));
            const face = 4 + Math.floor(rand() * 6);
            const top = Y(u + h);
            if (!anyRes(x, top, w - 1, h)) building(x, top, w - 1, h - face - 1, face);
            else if (u < u1 - 10 && rand() < 0.6) tree('broadleaf', x + w / 2, Y(u + h / 2), 5);
            u += h + 2;
          }
          x += w;
        }
      }
    }
    // ash bags at the corners, Shiroyama's camphor forest on the hill
    for (const u of streets) for (const x of [22, 40, 79, 102, 140, 160]) ashBags(x, Y(u + 8));
    for (let k = 0; k < 40; k++) {
      const x = rand() * 46;
      const u = 1110 + rand() * 180;
      if (!isRes(x, Y(u))) tree('broadleaf', x, Y(u), 5 + rand() * 3);
    }
  }

  // ------------------------------------------------------------ Kōtsuki river with stone arch bridges
  {
    const [r0, r1] = RIVER;
    for (let u = r0; u < r1; u++)
      for (let x = 0; x < W; x++) {
        const y = Y(u);
        const bank = Math.min(u - r0, r1 - u);
        img.set(x, y, bank < 3 ? C.stone[1] : rampColor(C.shallow, 0.3 + fbm(x, y, { seed: 37, scale: 5 }) * 0.5, x, y));
      }
    reserveRect(0, Y(r1), W, r1 - r0);
    for (const bx of [30, 90, 150])
      objects.push({
        y: Y(r0),
        shadow: () => shadowRect(bx + 7, Y(r1 + 2), 3, r1 - r0 + 4, 0.55),
        draw: () => {
          for (let u = r0 - 2; u < r1 + 2; u++) {
            const y = Y(u);
            for (let x = bx - 6; x <= bx + 6; x++) img.set(x, y, Math.abs(x - bx) === 6 ? C.stone[0] : (u + (x >> 1)) % 4 === 0 ? C.stone[0] : C.stone[2]);
          }
          // the arches show as darker crescents on the sides
          for (const s of [-1, 1]) for (let k = -4; k <= 4; k++) img.set(bx + s * 7, Y((r0 + r1) / 2 + k), 0x2a3a40);
        },
      });
  }

  // ------------------------------------------------------------ B. Sengan-en, the Shimadzu garden by the sea
  {
    const roadX = (u) => seaX(u) - 14;
    for (let u = SENGAN[0]; u < BAY[0] + 30; u++) {
      const cx = Math.round(roadX(u));
      for (let x = cx - 5; x <= cx + 4; x++) if (D(x, Y(u)) > 0) roadPx(x, Y(u), x + 0.5 - cx, 3);
      // the Nippō railway along the shore
      for (const x of [cx - 8, cx - 10]) if (D(x, Y(u)) > 0) img.set(x, Y(u), u % 3 ? C.rail : 0x5a4a3a);
      reserveRect(cx - 12, Y(u), 18, 1);
      if (u % 30 === 0) tree('palm', cx + 7, Y(u), 4.5);
    }
    // pond with an island
    for (let u = 1430; u < 1500; u++)
      for (let x = 60; x < 124; x++) {
        const e = ((x + 0.5 - 92) / 30) ** 2 + ((u - 1465) / 32) ** 2 + (fbm(x, u, { seed: 38, scale: 10 }) - 0.5) * 0.3;
        if (e < 1) {
          img.set(x, Y(u), e > 0.85 ? C.stone[0] : rampColor(C.shallow, 0.4 + fbm(x, u, { seed: 39, scale: 4 }) * 0.4, x, Y(u)));
          reserved[Y(u) * W + x] = 1;
        }
      }
    // the residence: linked halls with dark tile roofs
    for (const [x, u, w, h] of [[24, 1700, 40, 16], [60, 1680, 30, 14], [40, 1640, 26, 12]]) building(x, Y(u), w, h, 5, { roof: C.tile[1], wall: 0xe8e0cc, tiles: true });
    // Shūseikan, the stone factory hall of 1865
    building(14, Y(1935), 60, 18, 7, { roof: 0x4a4c54, wall: 0x9a968a, tiles: true });
    // replica of the Satsuma cannon aimed at the bay
    objects.push({
      y: Y(1850) + 4,
      shadow: () => shadowRect(104, Y(1850) + 3, 18, 3, 0.55),
      draw: () => {
        img.rect(100, Y(1850) - 1, 8, 5, 0x6a4a2a);
        img.rect(104, Y(1850), 16, 3, 0x1e1e22);
        img.set(120, Y(1850) + 1, 0x0a0a0c);
        img.rect(105, Y(1850), 14, 1, 0x4a4a52);
      },
    });
    reserveRect(98, Y(1850) - 3, 26, 10);
    // stone lanterns and garden paths
    for (const [x, u] of [[50, 1560], [100, 1600], [70, 1780], [30, 1820], [110, 1760]]) {
      img.rect(x + 1, Y(u) + 1, 3, 3, 0x2a2a28);
      img.rect(x, Y(u), 3, 3, C.stone[2]);
    }
    for (let u = 1400; u < 2100; u++) {
      const x = Math.round(40 + 22 * Math.sin(u / 60));
      for (let k = -1; k <= 1; k++) if (!isRes(x + k, Y(u))) img.set(x + k, Y(u), rampColor(C.walk, 0.6, x + k, Y(u)));
    }
  }

  // ------------------------------------------------------------ C. black-vinegar jar fields on the coast
  {
    for (let u = COAST[0] + 10; u < BAY[0] + 20; u += 64) {
      const fh = 52;
      for (let x0 = 4; x0 < 130; x0 += 46) {
        for (let jy = 0; jy < fh; jy += 7)
          for (let jx = 0; jx < 40; jx += 7) {
            const x = x0 + jx + 3;
            const y = Y(u + fh - jy);
            if (D(x + 3, y) < 18 || anyRes(x - 1, y - 1, 6, 6)) continue;
            img.rect(x + 1, y + 2, 4, 3, 0x000000, 0.35);
            img.disc(x + 2, y + 2, 2.4, 0x221c1a);
            img.set(x + 1, y + 1, 0x5a5250);
            img.set(x + 2, y + 2, 0x3a3230);
          }
        // farm path between the fields
        for (let k = 0; k < fh; k++) if (D(x0 + 43, Y(u + k)) > 18) img.set(x0 + 43, Y(u + k), rampColor(C.walk, 0.4, x0 + 43, Y(u + k)));
      }
      if (u < BAY[0] - 60) building(8, Y(u + fh + 11), 22, 8, 3, { roof: 0x6a6e78 });
    }
  }

  // ------------------------------------------------------------ D. Kinkō Bay
  {
    const ferry = (x, u, up) => {
      const y = Y(u);
      for (let k = 0; k < 50; k++) {
        const a = 0.8 * (1 - k / 50);
        const spread = Math.floor(k / 3);
        const wy = up ? y + 34 + k : y - k;
        img.set(x - 1 - spread, wy, 0xeaf0f0, a);
        img.set(x + 11 + spread, wy, 0xeaf0f0, a);
      }
      objects.push({
        y: y + 34,
        shadow: () => shadowRect(x + 4, y + 4, 11, 34, 0.5),
        draw: () => {
          for (let j = 0; j < 34; j++) {
            const w = up ? (j < 5 ? 3 + j * 2 : 11) : j > 28 ? 3 + (33 - j) * 2 : 11;
            const ox = Math.floor((11 - w) / 2);
            for (let i = 0; i < w; i++) img.set(x + ox + i, y + j, i === 0 || i === w - 1 ? 0xe0a020 : 0xf2f0ea);
          }
          img.rect(x + 2, y + 11, 7, 12, 0xd8dce0);
          img.rect(x + 3, y + 13, 5, 2, 0x3a5a8a);
          img.rect(x + 2, y + 23, 7, 1, 0xe0a020);
          img.rect(x + 4, y + 25, 3, 3, 0x5a5e66);
        },
      });
    };
    ferry(56, 3300, true);
    ferry(128, 3880, false);
    // fish-farm pens: rings of floats around dark nets
    for (const [x, u, r] of [[146, 3020, 10], [128, 3070, 8], [30, 3520, 11], [150, 3620, 9], [58, 4060, 10], [36, 4120, 8]])
      for (let a = 0; a < Math.PI * 2; a += 0.04) {
        const px = Math.round(x + Math.cos(a) * r);
        const py = Math.round(Y(u) + Math.sin(a) * r);
        img.set(px, py, Math.floor(a * 6) % 2 ? 0xe8e4d8 : 0xd84a2a);
        for (let k = 1; k < r; k++) if ((k + Math.round(a * 20)) % 3 === 0) img.set(Math.round(x + Math.cos(a) * k), Math.round(Y(u) + Math.sin(a) * k), 0x14262e, 0.5);
      }
    // fishing boats and a pod of dolphins
    for (const [x, u] of [[100, 3150], [20, 3720], [160, 3420]]) {
      img.rect(x, Y(u), 3, 8, 0xe8e4dc);
      img.rect(x + 1, Y(u) + 2, 1, 3, 0x3a5a8a);
      for (let k = 0; k < 14; k++) img.set(x + 1, Y(u) + 8 + k, 0xeaf0f0, 0.6 * (1 - k / 14));
    }
    for (const [x, u] of [[80, 3560], [88, 3572], [74, 3584], [92, 3590]]) {
      img.rect(x, Y(u), 5, 2, 0x6a7a86);
      img.set(x + 2, Y(u) - 1, 0x4a5a66);
      img.set(x + 5, Y(u) + 1, 0xeaf0f0, 0.7);
    }
  }

  // ------------------------------------------------------------ E. Sakurajima: port, village, fields, shelters, buried torii
  {
    const [i0, i1] = ISLAND;
    // ferry terminal and pier
    building(70, Y(i0 + 90), 40, 16, 6, { roof: 0x8a8e96 });
    for (let u = i0 - 30; u < i0 + 40; u++) for (let x = 84; x < 96; x++) if (D(x, Y(u)) <= 2) img.set(x, Y(u), u % 4 ? 0x8a8a84 : 0x6a6a64);
    hRoad(i0 + 110, 4);
    vRoad(150, 4, i0 + 110, LAVA[0] + 60);
    // village with ash on the roofs
    for (let u = i0 + 130; u < i0 + 380; u += 30)
      for (let x = 6; x < 140; x += 24 + Math.floor(rand() * 6)) {
        const w = 14 + Math.floor(rand() * 6);
        if (!anyRes(x - 2, Y(u + 16) - 2, w + 4, 24)) building(x, Y(u + 16), w, 11, 4, { roof: rand.pick([0x6a4a3a, 0x3a5a7a, 0x9a3a2a, 0x5a6a5a]), tiles: true });
      }
    // eruption shelters along the road: concrete half-pipes with a dark opening
    for (let u = i0 + 150; u < i1; u += 120)
      objects.push({
        y: Y(u) + 6,
        shadow: () => shadowRect(136, Y(u) + 2, 10, 6, 0.55),
        draw: () => {
          img.rect(132, Y(u), 10, 6, 0xb4b0a8);
          img.rect(132, Y(u), 10, 1, 0xd0ccc4);
          img.rect(132, Y(u) + 5, 10, 1, 0x7a7670);
          img.rect(133, Y(u) + 2, 2, 3, 0x1a1a1c);
        },
      });
    // giant Sakurajima daikon: rows of white roots under green leaf rosettes
    for (let u = i0 + 420; u < i0 + 680; u += 9)
      for (let x = 8; x < 136; x += 9) {
        const y = Y(u);
        if (anyRes(x - 3, y - 3, 7, 7)) continue;
        img.set(x, y, 0x3a2e26);
        img.disc(x + 0.5, y + 0.5, 2.4, 0xece8dc);
        img.set(x - 1, y - 1, 0xffffff);
        for (const [dx, dy] of [[-3, 0], [3, 0], [0, -3], [-2, -2], [2, -2]]) img.set(x + dx, y + dy, (dx + dy) % 2 ? 0x4a8a32 : 0x5a9a3a);
      }
    // komikan orchard
    for (let u = i0 + 720; u < i0 + 960; u += 14) for (let x = 10; x < 136; x += 15) if (!anyRes(x - 6, Y(u) - 6, 12, 12)) tree('komikan', x + rand() * 3, Y(u), 5);
    // the buried torii of Kurokami: only the top beam and pillar stubs rise from the ash
    {
      const x = 62;
      const y = Y(i1 - 100);
      for (let yy = y - 10; yy < y + 12; yy++) for (let xx = x - 18; xx < x + 18; xx++) if (((xx - x) / 18) ** 2 + ((yy - y) / 11) ** 2 < 1) img.set(xx, yy, rampColor(C.ash, 0.7, xx, yy));
      objects.push({
        y: y + 4,
        shadow: () => shadowRect(x - 8, y + 2, 22, 3, 0.5),
        draw: () => {
          img.rect(x - 11, y - 3, 22, 2, 0x8a867e);
          img.rect(x - 12, y - 4, 24, 1, 0xa29e94);
          img.rect(x - 8, y, 16, 1, 0x7a766e);
          for (const px of [x - 7, x + 6]) img.rect(px, y - 1, 2, 4, 0x8a867e);
        },
      });
      reserveRect(x - 20, y - 12, 40, 26);
    }
  }

  // ------------------------------------------------------------ F. lava fields and the climb
  {
    const roadX = (u) => 70 + 40 * Math.sin((u - LAVA[0]) / 170);
    for (let u = LAVA[0]; u < CRATER.u - CRATER.ry - 30; u++) {
      const cx = Math.round(roadX(u));
      for (let x = cx - 5; x <= cx + 5; x++) roadPx(x, Y(u), x + 0.5 - cx, 4);
      reserveRect(cx - 6, Y(u), 13, 1);
    }
    // the Yunohira observatory with its car park
    building(118, Y(6150), 34, 14, 6, { roof: 0x9a968e });
    for (let k = 0; k < 6; k++) img.rect(118 + k * 6, Y(6110), 4, 6, 0x56565a);
    // jagged lava: dark ridges, pioneer pines, steaming cracks that glow more towards the summit
    for (let k = 0; k < 260; k++) {
      const x = rand() * W;
      const u = LAVA[0] + rand() * (CRATER.u - LAVA[0] - 40);
      const y = Y(u);
      if (isRes(x, y)) continue;
      const len = 4 + rand() * 10;
      const a = rand() * Math.PI;
      const hot = smooth(5900, 6900, u);
      for (let j = 0; j < len; j++) {
        const px = Math.round(x + Math.cos(a) * j);
        const py = Math.round(y + Math.sin(a) * j);
        if (isRes(px, py)) continue;
        img.set(px, py, C.rock[0]);
        img.set(px + 1, py, C.rock[3]);
        if (rand() < hot * 0.5) glow(px, py, rand() < 0.6 ? C.lava[0] : C.lava[1]);
      }
      if (rand() < hot * 0.4) pool(x, y, 8, 0xff5a20, 0.3);
    }
    for (let k = 0; k < 160; k++) {
      const x = rand() * W;
      const u = LAVA[0] + rand() * 600;
      if (!isRes(x, Y(u))) tree('pine', x, Y(u), 2.5 + rand() * 2);
    }
    // boulders and tufts of silver grass (susuki), the first plants on the lava
    for (let k = 0; k < 220; k++) {
      const x = Math.round(rand() * W);
      const y = Y(LAVA[0] + rand() * (CRATER.u - LAVA[0] - 60));
      if (isRes(x, y)) continue;
      if (rand() < 0.55) {
        const r = 1.5 + rand() * 2.5;
        img.disc(x + 1.5, y + 2, r, 0x000000, 0.35);
        img.disc(x + 0.5, y + 0.5, r, C.rock[2]);
        img.disc(x, y, r * 0.5, C.rock[3]);
      } else if (U(y) < 6300)
        for (let j = 0; j < 5; j++) img.set(x + Math.round((j - 2) * 0.8), y - (j % 2), j % 2 ? 0xc8b88a : 0xa89a70);
    }
    for (let k = 0; k < 30; k++) {
      const x = rand() * W;
      const y = Y(LAVA[0] + 300 + rand() * 1200);
      for (let j = 0; j < 7; j++) img.set(x + Math.round(Math.sin(j) * 1.5), y - j, 0xffffff, 0.3 - j * 0.035);
    }
  }

  // ------------------------------------------------------------ G. the summit crater and two side vents
  {
    const { x: cx, u: cu, rx, ry } = CRATER;
    const cy = Y(cu);
    for (let y = cy - ry - 30; y < Math.min(L, cy + ry + 60); y++)
      for (let x = 0; x < W; x++) {
        if (y < 0) continue;
        const e = Math.hypot((x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry) + (fbm(x, y, { seed: 41, scale: 10 }) - 0.5) * 0.12;
        if (e > 1.6) continue;
        let c;
        if (e > 1.08) {
          // outer slope with radial gullies
          const ang = Math.atan2(y - cy, x - cx);
          c = rampColor(C.rock, 0.35 + (Math.sin(ang * 22) * 0.5 + 0.5) * 0.3 + (1.6 - e) * 0.4, x, y);
        } else if (e > 0.94) c = C.rock[3]; // rim
        else {
          c = rampColor(C.rock, 0.1 + e * 0.3 + fbm(x, y, { seed: 42, scale: 5 }) * 0.2, x, y);
          if (e < 0.75 && fbm(x, y, { seed: 43, scale: 6 }) > 0.62) glow(x, y, e < 0.4 ? C.lava[2] : C.lava[0], 0.9);
        }
        img.set(x, y, c);
        reserved[y * W + x] = 1;
      }
    pool(cx, cy, rx * 0.9, 0xff4a10, 0.55);
    for (const [vx, vu] of VENTS) {
      const vy = Y(vu);
      for (let y = vy - 9; y <= vy + 9; y++) for (let x = vx - 9; x <= vx + 9; x++) if (Math.hypot(x + 0.5 - vx, y + 0.5 - vy) < 9) img.set(x, y, Math.hypot(x + 0.5 - vx, y + 0.5 - vy) > 7 ? C.rock[3] : C.rock[0]);
      pool(vx, vy, 14, 0xff6020, 0.45);
    }
    // steam drifting off the rim
    for (let k = 0; k < 40; k++) {
      const a = rand() * Math.PI * 2;
      const x = cx + Math.cos(a) * rx * 1.05;
      const y = cy + Math.sin(a) * ry * 1.05;
      for (let j = 0; j < 6; j++) img.set(Math.round(x + j * 0.5), Math.round(y - j), 0xffffff, 0.25 - j * 0.035);
    }
  }

  // ------------------------------------------------------------ vegetation on the remaining land
  const kindsAt = (u) => {
    if (u < CITY[1]) return { p: 0.06, k: [['broadleaf', 0.7], ['palm', 1]] };
    if (u < SENGAN[1]) return { p: 0.45, k: [['pine', 0.45], ['broadleaf', 0.85], ['bamboo', 1]] };
    if (u < COAST[1]) return { p: 0.1, k: [['broadleaf', 0.6], ['palm', 1]] };
    if (u < ISLAND[1]) return { p: 0.12, k: [['broadleaf', 0.6], ['pine', 1]] };
    return { p: 0, k: [] };
  };
  const RADIUS = { broadleaf: [4, 6.5], palm: [4.5, 6], pine: [3.5, 5], bamboo: [3, 4.5] };
  for (let gy = 0; gy < L; gy += 7)
    for (let gx = -2; gx < W + 2; gx += 7) {
      const x = gx + rand() * 7;
      const y = gy + rand() * 7;
      const ix = Math.round(x);
      const iy = Math.round(y);
      if (ix < 0 || ix >= W || iy < 0 || iy >= L || D(ix, iy) < 8) continue;
      const { p, k } = kindsAt(U(iy));
      if (rand() > p) continue;
      const roll = rand();
      const kind = k.find(([, q]) => roll < q)[0];
      const [r0, r1] = RADIUS[kind];
      const r = r0 + rand() * (r1 - r0);
      const s = r * 0.7;
      if (isRes(ix, iy) || isRes(ix - s, iy) || isRes(ix + s, iy) || isRes(ix, iy - s) || isRes(ix, iy + s)) continue;
      tree(kind, x, y, r);
    }

  // ------------------------------------------------------------ compose
  for (const o of objects) o.shadow?.();
  objects.sort((a, b) => a.y - b.y);
  for (const o of objects) o.draw();

  // turret pads: bare earth where a living jar stands among the others
  for (const p of pads) {
    const y = Y(p.u);
    for (let yy = y - 9; yy <= y + 9; yy++)
      for (let xx = p.x - 9; xx <= p.x + 9; xx++) {
        const d = Math.hypot(xx + 0.5 - p.x, yy + 0.5 - y);
        if (d > 9) continue;
        img.set(xx, yy, d > 7.6 ? C.soil[0] : rampColor(C.soil, 0.4 + fbm(xx, yy, { seed: 2, scale: 3 }) * 0.5, xx, yy));
      }
  }

  // ------------------------------------------------------------ atmosphere grade, then lava light
  const tint = TOD.map(([, , t]) => rgb(t));
  for (let y = 0; y < L; y++) {
    const u = U(y);
    let i = 0;
    while (i < TOD.length - 2 && u >= TOD[i + 1][0]) i++;
    const t = smooth(TOD[i][0], TOD[i + 1][0], u);
    const mul = TOD[i][1].map((m, k) => m + (TOD[i + 1][1][k] - m) * t);
    const tc = tint[i].map((c, k) => c + (tint[i + 1][k] - c) * t);
    const amt = TOD[i][3] + (TOD[i + 1][3] - TOD[i][3]) * t;
    for (let x = 0; x < W; x++) {
      const p = (y * W + x) * 4;
      const d = img.data;
      if (!d[p + 3]) continue;
      for (let k = 0; k < 3; k++) {
        const v = d[p + k] * mul[k];
        d[p + k] = v + (tc[k] - v) * amt;
      }
    }
  }
  for (const { x, y, r, c, k } of pools) {
    const [cr, cg, cb] = rgb(c);
    for (let yy = Math.floor(y - r); yy <= y + r; yy++)
      for (let xx = Math.floor(x - r); xx <= x + r; xx++) {
        const i = img.idx(xx, yy);
        if (i < 0 || !img.data[i + 3]) continue;
        const dd = Math.hypot(xx + 0.5 - x, yy + 0.5 - y) / r;
        if (dd >= 1) continue;
        const f = (1 - dd) ** 1.6 * k;
        img.data[i] += cr * f;
        img.data[i + 1] += cg * f;
        img.data[i + 2] += cb * f;
      }
  }
  for (const [x, y, c, a] of lights) img.set(x, y, c, a);

  const chunks = [];
  for (let i = 0; i < CHUNKS; i++) chunks.push(img.crop(0, i * CHUNK, W, CHUNK));
  return { strip: img, chunks, meta: { width: W, chunkHeight: CHUNK, chunks: CHUNKS, length: L } };
}
