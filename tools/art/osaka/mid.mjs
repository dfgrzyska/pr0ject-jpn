// Middle layer (Osaka): Osaka Castle within its moats and stone walls, Nakanoshima between two rivers
// (the red-brick Central Public Hall, the library dome, a rose garden), the towers of Umeda with the
// Sky Building and the station tracks, Shinsekai with Tsūtenkaku, lanterns and kushikatsu neon,
// Dōtonbori canal lined with giant food signs and neon (Ebisu bridge, a cruise boat), the port at
// Tempozan (the big Ferris wheel, the aquarium, cranes and containers) and the open bay.
// Graded from afternoon to night; windows, neon and lamps glow after the grade. Water is transparent.
//
// Coordinates: u = distance from the bottom of the strip (stage start), strip y = L - u.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Raster, fbm, rng, bayer, scaleColor, rgb } from '../../lib/raster.mjs';
import { crownPixels, rampColor } from '../nature.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export const W = 180;
export const CHUNK = 512;
export const CHUNKS = 14;
export const L = CHUNK * CHUNKS;

const CASTLE = [0, 1290];
const TOSABORI = [1300, 1360];
const NAKANOSHIMA = [1360, 1910];
const DOJIMA = [1910, 1970];
const UMEDA = [1970, 2950];
const SHINSEKAI = [2950, 3750];
const DOTONBORI = [3750, 4950];
const PORT = [4950, 6430];

const C = {
  grass: [0x3e6a34, 0x4c7c3c, 0x5e8c48, 0x749c58],
  gravel: [0xa89e88, 0xb8ae98, 0xc8bea8],
  asphalt: [0x3c3c42, 0x48484e, 0x54545a],
  walk: [0x84868a, 0x929496, 0xa0a2a2],
  stone: [0x6a665e, 0x827e74, 0x9a968a, 0xb2aea0],
  roofs: [0x8a8e96, 0xa8a49c, 0x6a5a4a, 0x4a5a6a, 0x9a4a3a, 0x5a6a5a, 0xc0b8a8],
  copper: [0x3a7a6a, 0x4e9a84, 0x6ab49c],
  brick: [0x8a3a26, 0xa84a30, 0xc05a3a],
  warm: 0xffd88a,
  cool: 0xd8ecff,
  lamp: 0xffb868,
  gold: 0xe8b830,
};
const NEON = [0xff4aa8, 0x40e8ff, 0xffe040, 0x66ff8a, 0xff8a30, 0xb46cff, 0xff5050];

const TOD = [
  [0, [1.0, 0.97, 0.92], 0xffd8a0, 0.05],
  [1900, [1.02, 0.9, 0.78], 0xff9a50, 0.08],
  [2950, [0.74, 0.62, 0.8], 0x6a3a7a, 0.12],
  [3750, [0.5, 0.5, 0.72], 0x18143a, 0.12],
  [L, [0.5, 0.5, 0.72], 0x18143a, 0.12],
];

const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function buildMid() {
  const stage = JSON.parse(readFileSync(join(root, 'src', 'data', 'stage5.json'), 'utf8'));
  const { mid: V, anchor } = stage.scroll;
  const img = new Raster(W, L);
  const rand = rng(5505);
  const Y = (u) => Math.round(L - u);
  const U = (y) => L - y;
  const reserved = new Uint8Array(W * L);
  const water = new Uint8Array(W * L);
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
  const night = (u) => smooth(SHINSEKAI[0] - 200, DOTONBORI[0], u); // how lit the windows are

  const pads = stage.waves.filter((w) => w.type === 'turret').map((w) => ({ x: w.x, u: anchor + V * w.t + 10 }));
  for (const p of pads) reserveRect(p.x - 12, Y(p.u) - 12, 24, 24);

  // ------------------------------------------------------------ 1. ground and water
  const isWater = (x, u) => {
    // rivers across, the canal down the middle, the harbour basins and the open bay
    if ((u >= TOSABORI[0] && u < TOSABORI[1]) || (u >= DOJIMA[0] && u < DOJIMA[1])) return true;
    if (u >= DOTONBORI[0] + 30 && u < DOTONBORI[1] - 30 && x >= 64 && x < 116) return true;
    if (u >= PORT[0] + 260 && u < PORT[0] + 420 && x > 96) return true; // basin by the aquarium
    if (u >= PORT[0] + 560 && u < PORT[0] + 640) return true; // channel before the container quay
    if (u >= PORT[1] + (fbm(x, 3, { seed: 51, scale: 20 }) - 0.5) * 30) return true;
    return false;
  };
  for (let y = 0; y < L; y++) {
    const u = U(y);
    for (let x = 0; x < W; x++) {
      if (isWater(x, u)) {
        water[y * W + x] = 1;
        continue;
      }
      img.set(x, y, rampColor(C.walk, 0.3 + fbm(x, y, { seed: 11, scale: 6, octaves: 2 }) * 0.6, x, y));
    }
  }
  // stone embankments along every water edge
  for (let y = 1; y < L - 1; y++)
    for (let x = 0; x < W; x++) {
      if (water[y * W + x]) continue;
      const edge = water[(y - 1) * W + x] || water[(y + 1) * W + x] || (x > 0 && water[y * W + x - 1]) || (x < W - 1 && water[y * W + x + 1]);
      if (edge) img.set(x, y, C.stone[(x + y) % 3 === 0 ? 1 : 2]);
    }
  const W_ = (x, y) => x >= 0 && x < W && y >= 0 && y < L && water[y * W + x];

  // ------------------------------------------------------------ helpers
  const roadPx = (x, y, across, hw) => {
    if (W_(x, y)) return;
    const a = Math.abs(across);
    let c = a > hw ? rampColor(C.walk, fbm(x, y, { seed: 33, scale: 3 }), x, y) : rampColor(C.asphalt, fbm(x, y, { seed: 31, scale: 4, octaves: 2 }), x, y);
    if (a <= hw && Math.abs(a - hw / 2) < 0.5 && (x + y) % 6 < 3 && hw > 4) c = 0xd8d4c8;
    img.set(x, y, c);
  };
  const vRoad = (cx, hw, u0, u1) => {
    for (let u = u0; u < u1; u++) for (let x = Math.floor(cx - hw - 2); x <= cx + hw + 1; x++) roadPx(x, Y(u), x + 0.5 - cx, hw);
    reserveRect(cx - hw - 3, Y(u1), hw * 2 + 6, u1 - u0);
  };
  const hRoad = (uc, hw, x0 = 0, x1 = W) => {
    for (let u = Math.floor(uc - hw - 2); u <= uc + hw + 1; u++) for (let x = x0; x < x1; x++) roadPx(x, Y(u), u + 0.5 - uc, hw);
    reserveRect(x0, Y(uc + hw + 3), x1 - x0, hw * 2 + 6);
  };
  const bridge = (cx, hw, u0, u1, lamps) =>
    objects.push({
      y: Y(u0),
      shadow: () => shadowRect(cx + hw + 1, Y(u1), 3, u1 - u0, 0.55),
      draw: () => {
        for (let u = u0; u < u1; u++) {
          const y = Y(u);
          for (let x = cx - hw; x <= cx + hw; x++) img.set(x, y, Math.abs(x - cx) === hw ? C.stone[0] : rampColor(C.asphalt, 0.5, x, y));
          if (lamps && u % 14 === 0)
            for (const s of [-1, 1]) {
              glow(cx + s * hw, y, 0xfff0c8);
              pool(cx + s * hw, y, 8, C.lamp, 0.3 * night(u) + 0.05);
            }
        }
      },
    });
  /** Building: flat roof with units, a front face with windows (lit at night), optional neon. */
  const building = (x, y, w, h, faceH, opt = {}) => {
    const roof = opt.roof ?? rand.pick(C.roofs);
    const wall = opt.wall ?? rand.pick([0xd8d0c0, 0xc4c2bc, 0xb8a890, 0xe0dcd2, 0x9aa4ae]);
    const litP = opt.lit ?? 0.15 + night(U(y)) * 0.55;
    const units = [];
    for (let i = 0; i < Math.floor((w * h) / 280); i++) units.push([x + 3 + Math.floor(rand() * Math.max(1, w - 9)), y + 3 + Math.floor(rand() * Math.max(1, h - 8))]);
    const signs = [];
    for (let i = 0; i < (opt.neon ? Math.max(1, Math.floor(w / 6)) : 0); i++) signs.push({ x: x + 1 + Math.floor((i + 0.5) * (w / Math.max(1, Math.floor(w / 6)))) - 1, c: rand.pick(NEON), h: Math.max(3, faceH - 2 - Math.floor(rand() * 3)) });
    const board = opt.billboard ? { c: rand.pick(NEON), w: Math.min(w - 4, 10 + Math.floor(rand() * 10)) } : null;
    objects.push({
      y: y + h + faceH,
      shadow: () => shadowRect(x + 4, y + 4, w, h + faceH, 0.5),
      draw: () => {
        for (let yy = y; yy < y + h; yy++)
          for (let xx = x; xx < x + w; xx++) img.set(xx, yy, xx === x || yy === y ? scaleColor(roof, 1.15) : xx === x + w - 1 ? scaleColor(roof, 0.8) : roof);
        for (const [ux, uy] of units) {
          img.rect(ux + 1, uy + 1, 4, 3, scaleColor(roof, 0.6));
          img.rect(ux, uy, 4, 3, 0x8a8c90);
        }
        if (w * h > 900) for (const [ax, ay] of [[x + 1, y + 1], [x + w - 2, y + 1]]) glow(ax, ay, 0xff3a2a);
        for (let yy = y + h; yy < y + h + faceH; yy++) for (let xx = x; xx < x + w; xx++) img.set(xx, yy, yy === y + h ? scaleColor(wall, 0.6) : xx === x + w - 1 ? scaleColor(wall, 0.8) : wall);
        for (let r = y + h + 2; r < y + h + faceH - 1; r += 2)
          for (let xx = x + 2; xx < x + w - 2; xx += 2) {
            if (rand() < litP) glow(xx, r, rand() < 0.5 ? C.warm : C.cool);
            else img.set(xx, r, 0x2a3444);
          }
        for (const s of signs) {
          for (let k = 0; k < s.h; k++) {
            glow(s.x, y + h + 1 + k, k % 3 === 2 ? 0xffffff : s.c);
            glow(s.x + 1, y + h + 1 + k, s.c, 0.8);
          }
          pool(s.x + 0.5, y + h + faceH + 2, 9, s.c, 0.35);
        }
        if (board) {
          const bx = x + Math.floor((w - board.w) / 2);
          const by = y + 2;
          img.rect(bx, by + 1, board.w, 4, 0x14101a);
          for (let i = 0; i < board.w; i++) {
            glow(bx + i, by, board.c);
            glow(bx + i, by + 5, board.c);
            if (i > 0 && i < board.w - 1 && rand() < 0.5) glow(bx + i, by + 2 + Math.floor(rand() * 2), rand() < 0.7 ? 0xffffff : board.c);
          }
          pool(bx + board.w / 2, by + 3, board.w * 0.7, board.c, 0.3);
        }
      },
    });
    reserveRect(x - 1, y - 1, w + 2, h + faceH + 2);
  };
  const tree = (kind, x, y, r) => {
    const seed = Math.floor(rand() * 1e9);
    const cx = Math.round(x);
    const cy = Math.round(y);
    const px = () => crownPixels(kind, cx, cy, r, rng(seed), seed & 1023);
    const off = Math.round(2 + r * 0.3);
    objects.push({
      y: cy + r * 0.6,
      shadow: () => {
        for (const p of px()) img.tint(p.x + off, p.y + off + 1, 0.55);
      },
      draw: () => {
        for (const p of px()) img.set(p.x, p.y, p.c);
      },
    });
  };
  const lantern = (x, y, c = 0xff5a30) => {
    glow(x, y, c);
    glow(x, y + 1, 0xffd080, 0.8);
    pool(x, y + 1, 5, c, 0.3);
  };
  const crowd = (x0, y0, w, h, n) => {
    for (let i = 0; i < n; i++) {
      const x = Math.round(x0 + rand() * w);
      const y = Math.round(y0 + rand() * h);
      if (isRes(x, y) || W_(x, y)) continue;
      img.set(x, y + 1, 0x2a2a38);
      img.set(x, y, rand() < 0.4 ? rand.pick([0xd04040, 0x3a6ad0, 0xe8c040, 0xe8e8f0, 0xff7ab0]) : 0x3a3a4a);
    }
  };

  // ------------------------------------------------------------ A. Osaka Castle within its moats
  {
    // park lawn inside the outer moat
    for (let u = CASTLE[0]; u < CASTLE[1]; u++)
      for (let x = 0; x < W; x++) {
        const y = Y(u);
        img.set(x, y, rampColor(C.grass, 0.3 + fbm(x, y, { seed: 21, scale: 8, octaves: 2 }) * 0.6, x, y));
      }
    const moat = (x0, x1, u0, u1, w) => {
      for (let u = u0; u < u1; u++)
        for (let x = x0; x < x1; x++) {
          const inner = x >= x0 + w && x < x1 - w && u >= u0 + w && u < u1 - w;
          if (inner) continue;
          const y = Y(u);
          water[y * W + x] = 1;
          img.clear(x, y);
        }
      // massive stone walls (ishigaki) on the inner side of the moat, slightly battered
      for (let u = u0 + w; u < u1 - w; u++)
        for (let x = x0 + w; x < x1 - w; x++) {
          const d = Math.min(x - x0 - w, x1 - w - 1 - x, u - u0 - w, u1 - w - 1 - u);
          if (d < 4) img.set(x, Y(u), (Math.floor(x / 3) + Math.floor(u / 2)) % 2 ? C.stone[1 + (d > 1)] : C.stone[d > 1 ? 3 : 2]);
        }
      reserveRect(x0, Y(u1), x1 - x0, u1 - u0);
    };
    moat(4, 176, 200, 1150, 12);
    // the plaza and paths of the outer grounds (reservation lifted inside)
    for (let u = 216; u < 1134; u++) for (let x = 20; x < 160; x++) reserved[Y(u) * W + x] = 0;
    for (const p of pads) reserveRect(p.x - 12, Y(p.u) - 12, 24, 24);
    moat(52, 128, 540, 900, 10);
    for (let u = 554; u < 886; u++)
      for (let x = 66; x < 114; x++) {
        reserved[Y(u) * W + x] = 0;
        img.set(x, Y(u), rampColor(C.gravel, 0.4 + fbm(x, u, { seed: 22, scale: 4 }) * 0.5, x, Y(u)));
      }
    // bridges and gates across the moats
    for (const [u0, u1] of [[200, 212], [540, 550]]) bridge(90, 6, u0 - 2, u1 + 2, false);
    for (const [u, gw] of [[218, 24], [556, 20]]) building(90 - gw / 2, Y(u + 12), gw, 6, 5, { roof: C.copper[1], wall: 0xf0ece4, lit: 0 });
    // gravel walks across the outer grounds
    for (let u = 216; u < 1134; u++) for (let x = 86; x < 94; x++) if (!isRes(x, Y(u))) img.set(x, Y(u), rampColor(C.gravel, 0.5, x, Y(u)));
    // the main keep: white walls, green copper roofs in five tiers, gold fish on the ridge
    {
      const cx = 90;
      const top = Y(780);
      objects.push({
        y: top + 64,
        shadow: () => shadowRect(cx - 18, top + 6, 44, 60, 0.5),
        draw: () => {
          img.rect(cx - 24, top + 50, 48, 14, C.stone[2]); // stone base
          for (let k = 0; k < 14; k += 2) img.rect(cx - 24, top + 50 + k, 48, 1, C.stone[1]);
          const tiers = [[24, 38, 12], [20, 26, 12], [16, 16, 10], [12, 7, 9], [9, 0, 7]];
          for (const [hw, ty, th] of tiers) {
            for (let yy = top + ty; yy < top + ty + th; yy++)
              for (let xx = cx - hw; xx < cx + hw; xx++) {
                const roof = yy < top + ty + 4;
                img.set(xx, yy, roof ? (yy === top + ty ? C.copper[2] : xx < cx ? C.copper[1] : C.copper[0]) : (xx - cx + hw) % 4 === 1 && yy > top + ty + 5 ? 0x2a2a30 : 0xf2eee6);
              }
            img.rect(cx - hw, top + ty + 4, hw * 2, 1, C.gold);
          }
          // gables with gold trim and the golden shachihoko
          for (const s of [-1, 1]) {
            img.set(cx + s * 6, top - 1, C.gold);
            img.set(cx + s * 6, top - 2, 0xfff0a0);
          }
          img.rect(cx - 3, top + 18, 6, 4, C.copper[2]);
          img.rect(cx - 2, top + 18, 4, 1, C.gold);
        },
      });
      reserveRect(cx - 26, top - 4, 52, 70);
    }
    // plum and cherry groves, pines along the walls
    for (let k = 0; k < 120; k++) {
      const x = 20 + rand() * 140;
      const u = 170 + rand() * 1010;
      const y = Y(u);
      if (!anyRes(x - 5, y - 5, 10, 10)) tree(rand() < 0.4 ? 'sakura' : rand() < 0.6 ? 'pine' : 'broadleaf', x, y, 3.5 + rand() * 2.5);
    }
    crowd(66, Y(570), 48, 14, 30);
    crowd(20, Y(240), 140, 20, 40);
    hRoad(1180, 5);
  }

  // ------------------------------------------------------------ B. Nakanoshima between the two rivers
  {
    for (const bx of [40, 100, 150]) {
      bridge(bx, 6, TOSABORI[0] - 2, TOSABORI[1] + 2, true);
      bridge(bx, 6, DOJIMA[0] - 2, DOJIMA[1] + 2, true);
    }
    for (const bx of [40, 100, 150]) vRoad(bx, 5, NAKANOSHIMA[0], NAKANOSHIMA[1]);
    hRoad(1640, 5);
    // Central Public Hall: red brick, a great arched roof
    {
      const x = 52;
      const y = Y(1600);
      objects.push({
        y: y + 34,
        shadow: () => shadowRect(x + 4, y + 4, 40, 34, 0.5),
        draw: () => {
          for (let yy = y; yy < y + 22; yy++)
            for (let xx = x; xx < x + 40; xx++) {
              const arch = Math.abs(xx - x - 20) < 9 && yy < y + 14;
              img.set(xx, yy, arch ? (yy - y < 4 ? C.copper[2] : C.copper[1]) : (xx + yy) % 3 === 0 ? C.brick[0] : C.brick[1]);
            }
          img.rect(x + 11, y + 13, 18, 1, 0xe8e0d0);
          for (let yy = y + 22; yy < y + 34; yy++) for (let xx = x; xx < x + 40; xx++) img.set(xx, yy, yy === y + 22 ? 0x4a2a20 : (yy - y) % 4 === 0 ? 0xe8e0d0 : C.brick[2]);
          for (let xx = x + 3; xx < x + 38; xx += 4) glow(xx, y + 28, C.warm, 0.8);
        },
      });
      reserveRect(x - 2, y - 2, 44, 38);
    }
    // the library with its dome
    {
      const x = 108;
      const y = Y(1820);
      building(x, y, 34, 18, 7, { roof: 0x9a968a, wall: 0xd8d0c0, lit: 0.2 });
      objects.push({
        y: y + 20,
        draw: () => {
          img.disc(x + 17, y + 9, 6, C.copper[1]);
          img.disc(x + 16, y + 8, 3, C.copper[2]);
        },
      });
    }
    // rose garden at the east tip of the island
    for (let k = 0; k < 160; k++) {
      const x = 4 + rand() * 30;
      const u = 1380 + rand() * 120;
      if (!isRes(x, Y(u))) img.set(x, Y(u), rand.pick([0xe83a5a, 0xf08ab0, 0xf4e0a0, 0xd02a3a, 0xffffff]));
    }
    // Nakanoshima park lawns along the riverbanks
    for (const [u0, u1] of [[1372, 1410], [1866, 1900]])
      for (let u = u0; u < u1; u++)
        for (let x = 0; x < W; x++) if (!isRes(x, Y(u)) && !W_(x, Y(u))) img.set(x, Y(u), rampColor(C.grass, 0.4 + fbm(x, u, { seed: 23, scale: 6 }) * 0.5, x, Y(u)));
    for (let k = 0; k < 40; k++) {
      const x = rand() * W;
      const u = rand() < 0.5 ? 1375 + rand() * 30 : 1870 + rand() * 25;
      if (!anyRes(x - 4, Y(u) - 4, 8, 8)) tree(rand() < 0.5 ? 'sakura' : 'broadleaf', x, Y(u), 3.5 + rand() * 2);
    }
    for (let u = 1420; u < 1600; u += 46) for (const [x, w] of [[2, 28], [50, 40], [110, 30], [160, 18]]) if (!anyRes(x, Y(u + 36), w, 42)) building(x, Y(u + 36), w - 2, 28, 8);
    // towers on the rest of the island
    for (let u = 1660; u < 1860; u += 46) for (const [x, w] of [[2, 28], [50, 40], [110, 30], [160, 18]]) if (!anyRes(x, Y(u + 36), w, 42)) building(x, Y(u + 36), w - 2, 28, 8);
    // river cruise boats
    for (const [x, u] of [[70, 1330], [130, 1945]]) {
      img.rect(x, Y(u), 16, 5, 0xe8e4dc);
      img.rect(x + 2, Y(u) + 1, 12, 3, 0x6a8aa8);
      for (let k = 0; k < 14; k++) img.set(x + 16 + k, Y(u) + 2, 0xeaf0f0, 0.6 * (1 - k / 14));
    }
  }

  // ------------------------------------------------------------ C. Umeda: skyscrapers, the Sky Building, the tracks
  {
    for (const x of [30, 150]) vRoad(x, 5, UMEDA[0], SHINSEKAI[1]);
    vRoad(90, 8, UMEDA[0], DOTONBORI[0] + 30);
    for (const u of [2100, 2350, 2600, 2900]) hRoad(u, 6);
    // the station's rail yard
    for (let u = 2700; u < 2780; u++)
      for (let x = 0; x < W; x++) {
        if (isRes(x, Y(u))) continue;
        const k = (u - 2700) % 8;
        img.set(x, Y(u), k === 0 || k === 3 ? 0x8a8a90 : k === 1 || k === 2 ? 0x4a3a30 : 0x6a645c);
      }
    reserveRect(0, Y(2780), W, 80);
    for (const [u, c] of [[2716, 0xe8e8e8], [2748, 0xf0a020]])
      objects.push({
        y: Y(u),
        draw: () => {
          img.rect(20, Y(u) - 2, 60, 5, c);
          for (let x = 22; x < 78; x += 4) img.rect(x, Y(u) - 1, 2, 2, 0x3a5a7a);
        },
      });
    // the Sky Building: two towers joined at the top by a floating ring garden
    {
      const x = 100;
      const y = Y(2560);
      objects.push({
        y: y + 60,
        shadow: () => shadowRect(x + 6, y + 6, 46, 60, 0.45),
        draw: () => {
          for (const tx of [x, x + 30]) {
            img.rect(tx, y + 10, 16, 50, 0x9aa8b8);
            for (let yy = y + 12; yy < y + 58; yy += 2) for (let xx = tx + 1; xx < tx + 15; xx += 2) (rand() < 0.5 ? glow : img.set.bind(img))(xx, yy, rand() < 0.5 ? 0xb8d8f0 : 0x6a8aa8);
          }
          // the ring and the bridge-like deck between the towers
          for (let a = 0; a < Math.PI * 2; a += 0.03) img.set(Math.round(x + 23 + Math.cos(a) * 18), Math.round(y + 10 + Math.sin(a) * 8), 0xd8e0e8);
          img.rect(x + 8, y + 6, 30, 8, 0xc8d0d8);
          img.rect(x + 8, y + 6, 30, 1, 0xf0f4f8);
          glow(x + 23, y + 4, 0xff3a2a);
        },
      });
      reserveRect(x - 2, y - 2, 52, 66);
    }
    const all = [UMEDA[0] + 10, 2100, 2350, 2600, 2700, 2780, 2900, SHINSEKAI[0]];
    for (let i = 0; i < all.length - 1; i++) {
      const u0 = all[i] + 10;
      const u1 = all[i + 1] - 10;
      if (u1 - u0 < 30) continue;
      for (const [x0, x1] of [[0, 22], [38, 79], [101, 142], [158, W]]) {
        let x = x0 + 1;
        while (x < x1 - 8) {
          const w = Math.min(x1 - x, 16 + Math.floor(rand() * 20));
          const h = u1 - u0 - 4;
          const face = 8 + Math.floor(rand() * 10);
          if (!anyRes(x, Y(u1), w - 1, h)) building(x, Y(u1), w - 2, h - face, face, { cool: true });
          x += w;
        }
      }
    }
  }

  // ------------------------------------------------------------ D. Shinsekai: Tsūtenkaku, lanterns and kushikatsu neon
  {
    for (const u of [3060, 3200, 3300, 3550]) hRoad(u, 5);
    // Tsūtenkaku: lattice legs, a lit observation deck and the big sign
    {
      const cx = 64;
      const top = Y(3290);
      objects.push({
        y: top + 80,
        shadow: () => {
          for (let k = 0; k < 70; k++) shadowRect(cx + 8 + Math.floor(k * 0.4), top + k + 6, 8, 1, 0.55);
        },
        draw: () => {
          img.rect(cx - 10, top, 20, 14, 0xb8b4ac);
          img.rect(cx - 10, top, 20, 2, 0xe0dcd4);
          for (let xx = cx - 9; xx < cx + 9; xx += 2) glow(xx, top + 8, 0xffe8a0);
          img.rect(cx - 12, top + 14, 24, 8, 0x1a1a24);
          for (let xx = cx - 11; xx < cx + 11; xx++) if ((xx + top) % 3) glow(xx, top + 17, rand.pick(NEON));
          pool(cx, top + 18, 22, 0xffa040, 0.3);
          for (let yy = top + 22; yy < top + 80; yy++) {
            const hw = 8 + (yy - top - 22) * 0.18;
            for (const s of [-1, 1]) {
              img.set(Math.round(cx + s * hw), yy, 0x8a8a90);
              if ((yy - top) % 8 === 0) glow(Math.round(cx + s * hw), yy, 0xfff0c0);
            }
            const k = (yy - top - 22) % 10;
            img.set(Math.round(cx - hw + (k / 10) * hw * 2), yy, 0x6a6a72);
            img.set(Math.round(cx + hw - (k / 10) * hw * 2), yy, 0x6a6a72);
          }
        },
      });
      reserveRect(cx - 22, top - 2, 44, 84);
    }
    // Abeno Harukas: a huge stepped glass tower
    building(118, Y(3700), 56, 40, 22, { roof: 0x6a7a8a, wall: 0x4a5a6e, cool: true, lit: 0.6 });
    // Janjan alley with red lanterns
    {
      const ay = Y(3420);
      for (let x = 0; x < W; x++) for (let j = -3; j <= 3; j++) if (!isRes(x, ay + j)) img.set(x, ay + j, Math.abs(j) === 3 ? 0x3a3238 : rampColor(C.walk, 0.3, x, ay + j));
      reserveRect(0, ay - 4, W, 9);
      for (let x = 2; x < W; x += 5) for (const s of [-2, 2]) lantern(x, ay + s);
    }
    // the rest: low shops with neon and billboards
    const all = [SHINSEKAI[0], 3060, 3200, 3300, 3420, 3550, SHINSEKAI[1]];
    for (let i = 0; i < all.length - 1; i++) {
      const u0 = all[i] + 10;
      const u1 = all[i + 1] - 10;
      if (u1 - u0 < 26) continue;
      for (const [x0, x1] of [[0, 22], [38, 79], [101, 142], [158, W]]) {
        let x = x0 + 1;
        while (x < x1 - 8) {
          const w = Math.min(x1 - x, 14 + Math.floor(rand() * 14));
          const h = u1 - u0 - 4;
          const face = 6 + Math.floor(rand() * 6);
          if (!anyRes(x, Y(u1), w - 1, h)) building(x, Y(u1), w - 2, h - face, face, { neon: true, billboard: rand() < 0.7 });
          x += w;
        }
      }
    }
    // Tennōji park lawn on the left edge
    for (let k = 0; k < 30; k++) {
      const x = rand() * 22;
      const u = SHINSEKAI[0] + rand() * 700;
      if (!isRes(x, Y(u))) tree('broadleaf', x, Y(u), 4 + rand() * 2);
    }
  }

  // ------------------------------------------------------------ E. Dōtonbori: the canal, giant food signs, neon
  {
    const [d0, d1] = DOTONBORI;
    // riverside walk (Tombori) on both banks
    for (let u = d0 + 30; u < d1 - 30; u++)
      for (const [x0, x1] of [[56, 64], [116, 124]])
        for (let x = x0; x < x1; x++) img.set(x, Y(u), (x + u) % 5 === 0 ? 0x6a6660 : 0x8a847c);
    reserveRect(56, Y(d1 - 30), 68, d1 - d0 - 60);
    for (let u = d0 + 40; u < d1 - 40; u += 12) for (const x of [58, 121]) lantern(x, Y(u), rand.pick([0xff5a30, 0xffd040]));
    // bridges: Dōtonbori-bashi, Ebisu-bashi (crowded), Taikō-bashi
    for (const u of [d0 + 300, d0 + 640, d0 + 940]) {
      for (let uu = u - 7; uu < u + 7; uu++) for (let x = 56; x < 124; x++) img.set(x, Y(uu), Math.abs(uu - u) > 5 ? C.stone[0] : rampColor(C.walk, 0.6, x, Y(uu)));
      for (let x = 58; x < 122; x += 6) {
        glow(x, Y(u + 6), 0xfff0c8);
        glow(x, Y(u - 6), 0xfff0c8);
      }
      crowd(58, Y(u + 4), 64, 8, u === d0 + 640 ? 70 : 25);
    }
    // a canal cruise boat with its wake
    {
      const x = 84;
      const u = d0 + 480;
      for (let k = 0; k < 30; k++) {
        img.set(x - 1 - Math.floor(k / 5), Y(u) + 22 + k, 0xeaf0f0, 0.6 * (1 - k / 30));
        img.set(x + 13 + Math.floor(k / 5), Y(u) + 22 + k, 0xeaf0f0, 0.6 * (1 - k / 30));
      }
      objects.push({
        y: Y(u) + 22,
        draw: () => {
          img.rect(x, Y(u), 12, 22, 0xe8e4dc);
          img.rect(x + 2, Y(u) + 3, 8, 16, 0x5a8ab0);
          for (let k = 0; k < 4; k++) glow(x + 3 + k * 2, Y(u) + 10, 0xffe0a0);
        },
      });
    }
    // buildings on both banks, lit up, each with a big sign on the roof facing the canal
    for (let u = d0 + 30; u < d1 - 40; u += 54)
      for (const [x0, x1] of [[2, 54], [126, 178]]) {
        const top = Y(u + 50);
        if (!anyRes(x0, top, x1 - x0, 46)) building(x0, top, x1 - x0, 30, 14, { neon: true, billboard: rand() < 0.5, lit: 0.7 });
      }
    // giant food signs: octopus (a takoyaki shop), takoyaki ball, gyoza, sushi, ramen
    const signs = [
      ['tako', 8, d0 + 120],
      ['ball', 140, d0 + 220],
      ['gyoza', 12, d0 + 420],
      ['sushi', 138, d0 + 520],
      ['tako', 132, d0 + 770],
      ['ramen', 14, d0 + 860],
    ];
    for (const [kind, x, u] of signs)
      objects.push({
        y: Y(u) + 40,
        draw: () => {
          const y = Y(u);
          if (kind === 'tako') {
            img.disc(x + 18, y + 12, 11, 0xd8402a);
            img.disc(x + 15, y + 9, 5, 0xe86a4a);
            for (const s of [-1, 1]) {
              img.disc(x + 18 + s * 5, y + 13, 3, 0xffffff);
              img.set(x + 18 + s * 5, y + 14, 0x1a1a1a);
            }
            img.rect(x + 8, y + 3, 20, 3, 0xf2f0ea); // twisted towel headband
            img.rect(x + 8, y + 4, 20, 1, 0xd02a2a);
            for (let k = 0; k < 6; k++) img.line(x + 8 + k * 4, y + 22, x + 4 + k * 5, y + 32, 0xc8362a);
            pool(x + 18, y + 14, 20, 0xff6040, 0.4);
          } else if (kind === 'ball') {
            for (let k = 0; k < 3; k++) {
              img.disc(x + 8 + k * 10, y + 12, 5, 0xb87a3a);
              img.line(x + 4 + k * 10, y + 10, x + 12 + k * 10, y + 14, 0xf4f0e0);
              img.set(x + 8 + k * 10, y + 9, 0x3a8a3a);
            }
            pool(x + 18, y + 12, 18, 0xffb040, 0.35);
          } else if (kind === 'gyoza') {
            for (let k = 0; k < 3; k++) {
              img.ellipse(x + 8 + k * 9, y + 12, 5, 7, 0xf0dcb0);
              for (let j = 0; j < 4; j++) img.set(x + 6 + k * 9 + j, y + 6, 0xd8b880);
            }
            pool(x + 16, y + 12, 18, 0xffe080, 0.35);
          } else if (kind === 'sushi') {
            img.rect(x + 4, y + 10, 26, 8, 0xf8f4ec);
            img.rect(x + 2, y + 5, 30, 7, 0xff7a4a);
            for (let k = 0; k < 6; k++) img.set(x + 4 + k * 5, y + 8, 0xffffff);
            pool(x + 17, y + 12, 18, 0xff8a60, 0.35);
          } else {
            img.disc(x + 16, y + 12, 12, 0xd8302a);
            img.disc(x + 16, y + 12, 9, 0xe8c070);
            for (let k = 0; k < 5; k++) img.line(x + 10, y + 8 + k * 2, x + 22, y + 9 + k * 2, 0xf4e0a0);
            img.disc(x + 12, y + 12, 2.5, 0xf2ece0);
            pool(x + 16, y + 12, 20, 0xff6a40, 0.35);
          }
          // neon frame around every sign
          for (let k = 0; k < 36; k++) glow(x + k, y - 2, NEON[(k >> 2) % NEON.length], 0.9);
        },
      });
  }

  // ------------------------------------------------------------ F. the port: the Ferris wheel, the aquarium, cranes and containers
  {
    const [p0, p1] = PORT;
    vRoad(40, 5, p0, p0 + 260);
    // Tempozan Ferris wheel: a giant ring of coloured lights
    {
      const cx = 46;
      const cy = Y(p0 + 300);
      objects.push({
        y: cy + 36,
        shadow: () => shadowRect(cx - 4, cy + 30, 30, 6, 0.5),
        draw: () => {
          img.rect(cx - 6, cy + 28, 12, 8, 0x8a8a90);
          for (let k = 0; k < 24; k++) {
            const a = (k / 24) * Math.PI * 2;
            img.line(cx, cy, Math.round(cx + Math.cos(a) * 28), Math.round(cy + Math.sin(a) * 28), 0x6a6a74);
          }
          for (let a = 0; a < Math.PI * 2; a += 0.025) {
            const px = Math.round(cx + Math.cos(a) * 29);
            const py = Math.round(cy + Math.sin(a) * 29);
            glow(px, py, NEON[Math.floor((a / (Math.PI * 2)) * 14) % NEON.length]);
          }
          for (let k = 0; k < 16; k++) {
            const a = (k / 16) * Math.PI * 2;
            img.rect(Math.round(cx + Math.cos(a) * 30) - 1, Math.round(cy + Math.sin(a) * 30), 3, 3, 0xd8dce4);
          }
          img.disc(cx + 0.5, cy + 0.5, 3, 0xe8e4dc);
          pool(cx, cy, 36, 0xff70c0, 0.3);
        },
      });
      reserveRect(cx - 32, cy - 32, 64, 70);
    }
    // the aquarium: a block faced with red, blue and glass, across the basin
    {
      const x = 104;
      const y = Y(p0 + 200);
      objects.push({
        y: y + 36,
        shadow: () => shadowRect(x + 4, y + 4, 60, 36, 0.5),
        draw: () => {
          img.rect(x, y, 60, 24, 0x3a4a6a);
          for (let yy = y + 24; yy < y + 36; yy++) for (let xx = x; xx < x + 60; xx++) img.set(xx, yy, Math.floor((xx - x) / 6 + (yy - y) / 4) % 3 === 0 ? 0xd8402a : Math.floor((xx - x) / 6) % 2 ? 0x2a5aa0 : 0x7ab8e0);
          img.rect(x + 8, y + 6, 44, 10, 0x5a7aa0);
          for (let xx = x + 10; xx < x + 50; xx += 3) glow(xx, y + 10, 0x9ad8ff);
          pool(x + 30, y + 30, 30, 0x60a0ff, 0.3);
        },
      });
      reserveRect(x - 2, y - 2, 64, 40);
    }
    // red-brick warehouses and a car park on the quays
    for (let u = p0 + 30; u < p0 + 260; u += 50) for (let x = 54; x < 176; x += 40) if (!anyRes(x, Y(u + 40), 36, 44)) building(x, Y(u + 40), 34, 28, 10, { roof: rand.pick([0x8a4a3a, 0x6a6a72, 0x7a5a4a]), neon: rand() < 0.4 });
    for (let u = p0 + 440; u < p0 + 550; u += 10) for (let x = 10; x < 90; x += 8) if (!isRes(x, Y(u)) && rand() < 0.6) img.rect(x, Y(u), 5, 7, rand.pick([0xc03a2a, 0xe8e8ec, 0x2a2a30, 0x3a6aa8, 0xd8c040]));
    {
      // the sightseeing sailing ship in the basin
      const x = 130;
      const y = Y(p0 + 300);
      objects.push({
        y: y + 34,
        draw: () => {
          for (let j = 0; j < 34; j++) {
            const w = j < 6 ? 3 + j * 2 : 14;
            img.rect(x + Math.floor((14 - w) / 2), y + j, w, 1, j % 6 === 0 ? 0x5a3a22 : 0x7a5230);
          }
          for (const [my, mw] of [[8, 18], [17, 20], [26, 16]]) {
            img.rect(x + 7 - mw / 2, y + my, mw, 2, 0xf0ece0);
            glow(x + 7, y + my - 1, 0xffe0a0);
          }
          pool(x + 7, y + 17, 18, 0xffc070, 0.3);
        },
      });
    }
    // container quay: rows of coloured boxes, gantry cranes reaching out over the water
    for (let u = p0 + 660; u < p1 - 40; u += 34)
      for (let x = 8; x < 140; x += 20) {
        const top = Y(u + 26);
        if (anyRes(x, top, 18, 26)) continue;
        for (let k = 0; k < 3; k++) {
          const c = rand.pick([0xc0402a, 0x2a6aa8, 0x3a8a4a, 0xe0a020, 0x8a8a90, 0xd8d4cc]);
          img.rect(x + 1, top + k * 8 + 1, 16, 7, scaleColor(c, 0.6));
          img.rect(x, top + k * 8, 16, 7, c);
          img.rect(x, top + k * 8, 16, 1, scaleColor(c, 1.25));
        }
      }
    for (const u of [p0 + 800, p0 + 1080, p0 + 1320])
      objects.push({
        y: Y(u) + 8,
        shadow: () => shadowRect(150, Y(u) + 6, 30, 3, 0.5),
        draw: () => {
          img.rect(140, Y(u) - 4, 40, 4, 0xd83a2a);
          img.rect(140, Y(u) + 4, 40, 4, 0xd83a2a);
          for (let x = 140; x < 180; x += 5) img.line(x, Y(u) - 4, x + 5, Y(u) + 4, 0xf0ece4);
          glow(178, Y(u), 0xff3a2a);
        },
      });
    // lamps along the quays
    for (let u = p0 + 40; u < p1; u += 40) for (const x of [6, 174]) if (!W_(x, Y(u))) {
      glow(x, Y(u), 0xfff0c8);
      pool(x, Y(u), 12, C.lamp, 0.35);
    }
  }

  // ------------------------------------------------------------ the open bay: a few buoys and a far-off ship
  for (const [x, u] of [[30, 6700], [150, 6820], [70, 7000], [130, 7080]]) {
    img.disc(x, Y(u), 2, 0xd8402a);
    glow(x, Y(u) - 1, 0xff6040);
    pool(x, Y(u), 8, 0xff6040, 0.3);
  }

  // ------------------------------------------------------------ compose
  for (const o of objects) o.shadow?.();
  objects.sort((a, b) => a.y - b.y);
  for (const o of objects) o.draw();

  // turret pads: a lacquered shop stand where a beckoning cat sits
  for (const p of pads) {
    const y = Y(p.u);
    for (let yy = y - 9; yy <= y + 9; yy++)
      for (let xx = p.x - 9; xx <= p.x + 9; xx++) {
        const d = Math.hypot(xx + 0.5 - p.x, yy + 0.5 - y);
        if (d > 9) continue;
        img.set(xx, yy, d > 7.6 ? C.gold : d > 6.6 ? 0x5a1a14 : (xx + yy) % 4 === 0 ? 0xa83020 : 0xc03a28);
      }
  }

  // ------------------------------------------------------------ time of day, then the lights
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
  // neon reflections dancing on the dark water near lit banks
  for (const [x, y, c] of lights) {
    if (!W_(x, y + 3) || bayer(x, y) < 0.6) continue;
    for (let k = 2; k < 7; k += 2) img.set(x, y + k, c, 0.25);
  }

  const chunks = [];
  for (let i = 0; i < CHUNKS; i++) chunks.push(img.crop(0, i * CHUNK, W, CHUNK));
  return { strip: img, chunks, meta: { width: W, chunkHeight: CHUNK, chunks: CHUNKS, length: L } };
}
