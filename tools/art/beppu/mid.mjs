// Middle layer (Beppu): the bay and the black-sand beach of the sand baths, the town with the old
// Takegawara bathhouse, Kannawa wrapped in steam from its chimneys and roadside vents, the Hells
// (the cobalt Umi Jigoku with its red shrine, the grey mud bubbles of Oniishibozu, Kamado's coloured
// pools and its oni cook, the milky Shiraike), the crocodile pens of Oniyama with the red oni statue,
// the monkey woods of Takasakiyama, the stone-walled Tatsumaki geyser, and the blood-red pond of
// Chinoike where the boss rises. Overcast and misty, turning to a red dusk at the end; steam is
// drawn half-transparent over everything. Vents and turret pads come from the wave file.
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

const BAY = [0, 1000];
const TOWN = [1000, 2100];
const KANNAWA = [2100, 3300];
const HELLS = [3300, 4700];
const ONIYAMA = [4700, 5450];
const TAKASAKI = [5450, 6300];
const TATSUMAKI = [6300, 6650];

const C = {
  grass: [0x3e5e3a, 0x4c6e42, 0x5e7e4e, 0x728e5c],
  sand: [0x2e2a2a, 0x3c3836, 0x4c4644, 0x5c5652],
  walk: [0x8a8680, 0x98948e, 0xa6a29c],
  asphalt: [0x44444a, 0x505056, 0x5c5c62],
  stone: [0x6a665e, 0x827e74, 0x9a968a, 0xb2aea0],
  tile: [0x34363e, 0x44464f, 0x565862],
  roofs: [0x44464f, 0x5a5048, 0x6a5a4a, 0x7a3a2a, 0x4a5a6a, 0x8a8e96],
  wood: [0x4a3424, 0x5e4430, 0x76583e],
  cobalt: [0x1a6aa8, 0x2a88c8, 0x48a8e0, 0x7ac8f0],
  mud: [0x5a5652, 0x6e6a64, 0x86827a, 0x9e9a92],
  milk: [0x8ab0c0, 0xa8c8d4, 0xc8dce4, 0xe0ecf0],
  blood: [0x8a1a14, 0xb02a1e, 0xc84028, 0xe0603a],
  warm: 0xffd88a,
};

const TOD = [
  [0, [0.96, 0.96, 0.96], 0xd0d8e0, 0.08],
  [3300, [0.92, 0.89, 0.88], 0xc0a8a8, 0.08],
  [5450, [0.86, 0.74, 0.72], 0x8a4a3a, 0.12],
  [L, [0.74, 0.58, 0.56], 0x5a1a1a, 0.15],
];

const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function buildMid() {
  const stage = JSON.parse(readFileSync(join(root, 'src', 'data', 'stage6.json'), 'utf8'));
  const { mid: V, anchor } = stage.scroll;
  const img = new Raster(W, L);
  const rand = rng(6606);
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
  const steamPuffs = [];
  const glow = (x, y, c, a = 1) => lights.push([Math.round(x), Math.round(y), c, a]);
  const pool = (x, y, r, c, k = 0.5) => pools.push({ x, y, r, c, k });
  const steam = (x, y, size = 1) => steamPuffs.push([x, y, size]);
  const shadowRect = (x, y, w, h, f = 0.6) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) img.tint(x + i, y + j, f);
  };

  const pads = stage.waves.filter((w) => w.type === 'turret').map((w) => ({ x: w.x, u: anchor + V * w.t + 10 }));
  const vents = stage.waves.filter((w) => w.type === 'geyser').map((w) => ({ x: w.x, u: anchor + V * w.t + 10, mud: w.kind === 'mud' }));
  const pond = stage.waves.find((w) => w.type === 'boss').pond;
  for (const p of [...pads, ...vents]) reserveRect(p.x - 12, Y(p.u) - 12, 24, 24);

  // ------------------------------------------------------------ 1. ground: sea at the start, then land
  const shore = (x) => 210 + 18 * Math.sin(x / 30) + (fbm(x, 1, { seed: 61, scale: 14 }) - 0.5) * 14;
  for (let y = 0; y < L; y++) {
    const u = U(y);
    for (let x = 0; x < W; x++) {
      const d = u - shore(x);
      if (d < 0) {
        // bay water: foam at the edge, dithering out into the transparent far layer
        const s = 1 + d / 30;
        if (s <= 0 || (s < 0.4 && s < bayer(x, y) * 0.4)) continue;
        img.set(x, y, d > -1.5 ? 0xdce6e8 : rampColor([0x2a5c6c, 0x3a707e, 0x4e8490, 0x6a9aa4], s, x, y));
        continue;
      }
      if (u < BAY[1] && d < 120) img.set(x, y, rampColor(C.sand, 0.3 + fbm(x, y, { seed: 62, scale: 5 }) * 0.6, x, y)); // black sand
      else if (u > TAKASAKI[0] && u < TAKASAKI[1]) img.set(x, y, rampColor(C.grass, 0.25 + fbm(x, y, { seed: 63, scale: 8, octaves: 3 }) * 0.6, x, y));
      else img.set(x, y, rampColor(C.walk, 0.3 + fbm(x, y, { seed: 64, scale: 6, octaves: 2 }) * 0.6, x, y));
    }
  }

  // ------------------------------------------------------------ helpers
  const roadPx = (x, y, across, hw) => {
    const a = Math.abs(across);
    img.set(x, y, a > hw ? rampColor(C.walk, fbm(x, y, { seed: 33, scale: 3 }), x, y) : rampColor(C.asphalt, fbm(x, y, { seed: 31, scale: 4 }), x, y));
  };
  const vRoad = (cx, hw, u0, u1) => {
    for (let u = u0; u < u1; u++) for (let x = Math.floor(cx - hw - 2); x <= cx + hw + 1; x++) roadPx(x, Y(u), x + 0.5 - cx, hw);
    reserveRect(cx - hw - 3, Y(u1), hw * 2 + 6, u1 - u0);
  };
  const hRoad = (uc, hw, x0 = 0, x1 = W) => {
    for (let u = Math.floor(uc - hw - 2); u <= uc + hw + 1; u++) for (let x = x0; x < x1; x++) roadPx(x, Y(u), u + 0.5 - uc, hw);
    reserveRect(x0, Y(uc + hw + 3), x1 - x0, hw * 2 + 6);
  };
  /** Japanese house or inn: dark tiled hip roof, plastered or wooden front. */
  const house = (x, y, w, h, opt = {}) => {
    const roof = opt.roof ?? rand.pick(C.roofs);
    const wall = opt.wall ?? rand.pick([0xe8e0d0, 0xd8d0c0, 0x8a6a4a, 0xc0b8a8]);
    const faceH = opt.face ?? 4;
    objects.push({
      y: y + h + faceH,
      shadow: () => shadowRect(x + 3, y + 3, w, h + faceH, 0.55),
      draw: () => {
        const ridge = y + Math.floor(h / 2);
        for (let yy = y; yy < y + h; yy++)
          for (let xx = x; xx < x + w; xx++) {
            let c = yy < ridge ? scaleColor(roof, 1.12) : roof;
            if ((yy - y) % 2 === 0) c = scaleColor(c, 0.9);
            if (xx === x || xx === x + w - 1) c = scaleColor(c, 0.8);
            img.set(xx, yy, c);
          }
        img.rect(x + 2, ridge, w - 4, 1, scaleColor(roof, 0.7));
        for (let yy = y + h; yy < y + h + faceH; yy++) for (let xx = x + 1; xx < x + w - 1; xx++) img.set(xx, yy, yy === y + h ? 0x2a2420 : (xx - x) % 4 === 0 ? scaleColor(wall, 0.8) : wall);
        if (opt.lamp) glow(x + Math.floor(w / 2), y + h + 2, C.warm);
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
  /** A hot-spring pool: an irregular pond filled from a ramp, a stone rim, steam rising. */
  const hotPool = (cx, cu, rx, ry, ramp, seed, rim = C.stone[1]) => {
    const cy = Y(cu);
    for (let y = Math.floor(cy - ry - 2); y <= cy + ry + 2; y++)
      for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) {
        const e = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 + (fbm(x, y, { seed, scale: 9 }) - 0.5) * 0.35;
        if (e >= 1.18) continue;
        img.set(x, y, e > 1 ? rim : rampColor(ramp, 0.25 + (1 - e) * 0.5 + fbm(x, y, { seed: seed + 1, scale: 4 }) * 0.25, x, y));
        reserved[y * W + x] = 1;
      }
    for (let k = 0; k < Math.round(rx * ry * 0.04); k++) steam(cx + (rand() - 0.5) * rx * 1.6, cy + (rand() - 0.5) * ry * 1.6, 1 + rand());
  };
  const crowd = (x0, y0, w, h, n) => {
    for (let i = 0; i < n; i++) {
      const x = Math.round(x0 + rand() * w);
      const y = Math.round(y0 + rand() * h);
      if (isRes(x, y)) continue;
      img.set(x, y + 1, 0x2a2a38);
      img.set(x, y, rand() < 0.4 ? rand.pick([0xd04040, 0x3a6ad0, 0xe8c040, 0xe8e8f0]) : 0x3a3a4a);
    }
  };

  // ------------------------------------------------------------ A. the bay and the sand-bath beach
  {
    // a ferry heading in
    {
      const x = 120;
      const y = Y(80);
      for (let k = 0; k < 40; k++) {
        img.set(x - 1 - Math.floor(k / 3), y + 36 + k, 0xeaf0f0, 0.7 * (1 - k / 40));
        img.set(x + 13 + Math.floor(k / 3), y + 36 + k, 0xeaf0f0, 0.7 * (1 - k / 40));
      }
      objects.push({
        y: y + 36,
        draw: () => {
          for (let j = 0; j < 36; j++) {
            const w = j < 6 ? 3 + j * 2 : 13;
            img.rect(x + Math.floor((13 - w) / 2), y + j, w, 1, j < 3 ? 0x2a5aa8 : 0xf2f0ea);
          }
          img.rect(x + 3, y + 12, 7, 14, 0xd8dce4);
          img.rect(x + 3, y + 26, 7, 1, 0xe8a020);
        },
      });
    }
    // people buried in the warm sand to the neck, towels on their heads, sunshades over them
    for (let k = 0; k < 18; k++) {
      const x = 10 + (k % 9) * 18 + (rand() - 0.5) * 4;
      const u = 300 + Math.floor(k / 9) * 40 + rand() * 10;
      const y = Y(u);
      if (anyRes(x - 6, y - 6, 12, 12)) continue;
      img.rect(x - 2, y - 1, 5, 9, C.sand[3]); // the mound
      img.rect(x - 2, y - 1, 5, 1, C.sand[0]);
      img.disc(x + 0.5, y - 2, 1.6, 0xe8c8a8); // the head
      img.rect(x - 1, y - 4, 3, 1, 0xf4f0e6); // towel
      const c = rand.pick([0xe04a3a, 0x3a7ad0, 0xf0b020, 0x3aa060]);
      objects.push({
        y: y - 4,
        draw: () => {
          for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) if (i * i + j * j <= 18) img.set(x + 4 + i, y - 6 + j, Math.floor(((Math.atan2(j, i) + Math.PI) / (Math.PI * 2)) * 6) % 2 ? c : 0xf6f2e6);
        },
      });
      steam(x, y - 1, 0.6);
    }
    crowd(10, Y(420), 160, 30, 30);
    hRoad(480, 5);
    for (let u = 520; u < BAY[1]; u += 60) for (let x = 6; x < 170; x += 28) if (!anyRes(x, Y(u + 30), 24, 34)) house(x, Y(u + 30), 22, 18);
  }

  // ------------------------------------------------------------ B. the town and Takegawara Onsen
  {
    for (const x of [30, 150]) vRoad(x, 5, TOWN[0], KANNAWA[1]);
    vRoad(90, 6, TOWN[0], TOWN[1]);
    for (const u of [1100, 1400, 1700, 2000]) hRoad(u, 5);
    // Takegawara: a dark-tiled wooden bathhouse with its curved karahafu gable
    {
      const x = 52;
      const y = Y(1560);
      objects.push({
        y: y + 34,
        shadow: () => shadowRect(x + 4, y + 4, 34, 34, 0.5),
        draw: () => {
          for (let yy = y; yy < y + 24; yy++) for (let xx = x; xx < x + 34; xx++) img.set(xx, yy, (yy - y) % 2 ? C.tile[1] : C.tile[2]);
          img.rect(x, y + 11, 34, 1, C.tile[0]);
          // the karahafu: a curved gable over the entrance
          for (let xx = x + 8; xx < x + 26; xx++) {
            const k = Math.abs(xx - x - 17) / 9;
            const top = y + 18 + Math.round(k * k * 4);
            img.rect(xx, top, 1, 6, C.tile[2]);
            img.set(xx, top, C.stone[3]);
          }
          for (let yy = y + 24; yy < y + 34; yy++) for (let xx = x + 1; xx < x + 33; xx++) img.set(xx, yy, (xx - x) % 3 === 0 ? C.wood[0] : C.wood[1]);
          img.rect(x + 14, y + 28, 6, 6, 0x1e1814);
          glow(x + 17, y + 27, C.warm);
          steam(x + 8, y - 2, 1.4);
          steam(x + 28, y - 3, 1.2);
        },
      });
      reserveRect(x - 2, y - 2, 38, 38);
    }
    // houses, inns and shops between the streets, steam escaping from a few drains
    const rows = [TOWN[0] + 10, 1100, 1400, 1700, 2000, TOWN[1]];
    for (let i = 0; i < rows.length - 1; i++)
      for (let u = rows[i] + 12; u < rows[i + 1] - 30; u += 36)
        for (const [x0, x1] of [[0, 22], [40, 82], [98, 140], [158, W]])
          for (let x = x0 + 1; x < x1 - 10; x += 20) {
            const w = Math.min(x1 - x, 18);
            if (!anyRes(x, Y(u + 28), w, 32)) house(x, Y(u + 28), w - 2, 18, { lamp: rand() < 0.3 });
          }
    for (let k = 0; k < 16; k++) steam(rand() * W, Y(TOWN[0] + rand() * 1100), 0.8);
  }

  // ------------------------------------------------------------ C. Kannawa: steam from every chimney
  {
    for (const u of [2300, 2600, 2950, 3250]) hRoad(u, 4);
    const rows = [KANNAWA[0], 2300, 2600, 2950, 3250];
    for (let i = 0; i < rows.length - 1; i++)
      for (let u = rows[i] + 12; u < rows[i + 1] - 26; u += 32)
        for (const [x0, x1] of [[0, 22], [40, 140], [158, W]])
          for (let x = x0 + 1; x < x1 - 10; x += 22) {
            const w = Math.min(x1 - x, 20);
            if (anyRes(x, Y(u + 26), w, 30)) continue;
            house(x, Y(u + 26), w - 2, 16, { roof: rand.pick([C.tile[1], C.tile[2], 0x5a5048]), lamp: rand() < 0.4 });
          }
    // stone steam chimneys (yukemuri) with plumes, steam kitchens, a foot bath
    for (let k = 0; k < 40; k++) {
      const x = 6 + rand() * 168;
      const u = KANNAWA[0] + 20 + rand() * 1150;
      const y = Y(u);
      if (isRes(x, y)) continue;
      img.rect(x - 1, y - 1, 3, 3, C.stone[0]);
      img.set(x, y, 0x2a2624);
      for (let j = 0; j < 3; j++) steam(x + j * 3, y - 4 - j * 5, 1.2 + j * 0.5);
    }
    hotPool(110, 2780, 12, 6, C.milk, 71);
    crowd(96, Y(2770), 30, 14, 14);
  }

  // ------------------------------------------------------------ D. the Hells
  {
    // Umi Jigoku: the cobalt-blue "sea hell", a small red shrine and a lotus pond beside it
    hotPool(80, 3400, 44, 30, C.cobalt, 81, 0x7a7670);
    objects.push({
      y: Y(3440) + 10,
      draw: () => {
        const x = 132;
        const y = Y(3440);
        img.rect(x, y, 12, 2, 0xd03a2a); // torii
        img.rect(x + 1, y + 2, 2, 6, 0xd03a2a);
        img.rect(x + 9, y + 2, 2, 6, 0xd03a2a);
        img.rect(x + 14, y - 4, 12, 9, 0xb83a2a); // shrine
        img.rect(x + 14, y - 4, 12, 2, C.tile[1]);
      },
    });
    for (let k = 0; k < 30; k++) {
      const x = 130 + rand() * 40;
      const y = Y(3360 + rand() * 40);
      img.disc(x, y, 1.6, rand() < 0.2 ? 0xf0a0c0 : 0x3a7a3a);
    }
    // Oniishibozu: grey mud pools with bubbles like shaven monks' heads
    for (const [x, u, rx, ry] of [[70, 3620, 26, 16], [130, 3760, 22, 14], [50, 3900, 18, 12]]) {
      hotPool(x, u, rx, ry, C.mud, 90 + u, C.stone[0]);
      for (let k = 0; k < 8; k++) {
        const bx = x + (rand() - 0.5) * rx * 1.2;
        const by = Y(u) + (rand() - 0.5) * ry * 1.2;
        const r = 1.5 + rand() * 2;
        for (let a = 0; a < Math.PI * 2; a += 0.3) img.set(Math.round(bx + Math.cos(a) * r), Math.round(by + Math.sin(a) * r), C.mud[3]);
        img.set(Math.round(bx - r * 0.3), Math.round(by - r * 0.3), 0xd8d4cc);
      }
    }
    // Kamado Jigoku: little pools in different colours and the red oni cook on his giant pot
    for (const [x, u, ramp] of [[40, 4080, C.milk], [70, 4130, C.blood], [130, 4100, C.cobalt], [110, 4320, C.mud], [60, 4360, C.milk]]) hotPool(x, u, 12, 8, ramp, x + u);
    objects.push({
      y: Y(4250) + 20,
      shadow: () => shadowRect(96, Y(4250) + 4, 22, 18, 0.5),
      draw: () => {
        const x = 92;
        const y = Y(4250);
        img.disc(x + 10, y + 12, 10, 0x2a2624); // the pot
        img.disc(x + 9, y + 11, 7, 0x3a3634);
        img.rect(x + 6, y - 4, 8, 12, 0xd8302a); // the oni cook
        img.disc(x + 10, y - 6, 4, 0xd8302a);
        img.set(x + 8, y - 11, 0xf0c030);
        img.set(x + 12, y - 11, 0xf0c030);
        img.rect(x + 7, y + 2, 6, 2, 0xf0c030);
        steam(x + 10, y + 4, 2);
      },
    });
    reserveRect(88, Y(4250) - 12, 30, 36);
    // Shiraike: the milky white pond in a garden
    hotPool(96, 4560, 34, 20, C.milk, 95, 0x7a7670);
    for (let k = 0; k < 40; k++) {
      const x = rand() * W;
      const u = HELLS[0] + rand() * 1400;
      if (!anyRes(x - 5, Y(u) - 5, 10, 10)) tree(rand() < 0.5 ? 'pine' : 'broadleaf', x, Y(u), 3.5 + rand() * 2);
    }
    vRoad(14, 4, HELLS[0], ONIYAMA[1]);
  }

  // ------------------------------------------------------------ E. Oniyama: the crocodile pens, the red oni statue
  {
    for (let u = ONIYAMA[0] + 30; u < ONIYAMA[1] - 60; u += 70)
      for (const x0 of [26, 100]) {
        const y = Y(u + 56);
        if (anyRes(x0, y, 60, 56)) continue;
        // a concrete pen with a steaming pool and crocodiles basking
        img.rect(x0, y, 60, 56, C.stone[1]);
        img.rect(x0 + 2, y + 2, 56, 52, C.stone[2]);
        for (let yy = y + 10; yy < y + 46; yy++) for (let xx = x0 + 6; xx < x0 + 54; xx++) img.set(xx, yy, rampColor([0x3a5a4a, 0x4a6a56, 0x5a7a62], fbm(xx, yy, { seed: 111, scale: 5 }), xx, yy));
        for (let k = 0; k < 3; k++) {
          const cx = x0 + 10 + rand() * 38;
          const cy = y + 12 + rand() * 30;
          const len = 12 + rand() * 6;
          const a = rand() * Math.PI;
          for (let j = 0; j < len; j++) {
            const px = Math.round(cx + Math.cos(a) * (j - len / 2));
            const py = Math.round(cy + Math.sin(a) * (j - len / 2));
            const wdt = j < 3 ? 1 : j > len - 4 ? 1 : 2;
            img.rect(px, py, wdt, wdt, j % 3 ? 0x3a4a2a : 0x4e5e34);
          }
        }
        reserveRect(x0 - 2, y - 2, 64, 60);
        for (let k = 0; k < 4; k++) steam(x0 + 10 + rand() * 40, y + 20 + rand() * 20, 1.2);
      }
    // the red oni statue on his rock by the entrance, club in hand (the boss, before he wakes)
    {
      const x = 150;
      const y = Y(ONIYAMA[0] + 20);
      img.disc(x, y + 6, 6, C.stone[1]);
      img.rect(x - 3, y - 6, 6, 10, 0xd8302a);
      img.disc(x, y - 8, 3, 0xd8302a);
      img.set(x - 2, y - 12, 0xf0c030);
      img.set(x + 2, y - 12, 0xf0c030);
      img.rect(x - 3, y + 1, 6, 2, 0xf0c030);
      img.rect(x + 4, y - 10, 1, 14, 0x1a1a1e);
    }
  }

  // ------------------------------------------------------------ F. Takasakiyama: woods full of monkeys
  {
    for (let k = 0; k < 220; k++) {
      const x = rand() * W;
      const u = TAKASAKI[0] + rand() * (TAKASAKI[1] - TAKASAKI[0]);
      if (!anyRes(x - 5, Y(u) - 5, 10, 10)) tree(rand() < 0.25 ? 'bamboo' : 'broadleaf', x, Y(u), 4 + rand() * 3);
    }
    for (let k = 0; k < 70; k++) {
      const x = Math.round(rand() * W);
      const y = Y(TAKASAKI[0] + rand() * 850);
      if (isRes(x, y)) continue;
      img.rect(x, y, 2, 2, 0x7a5a3a);
      img.set(x, y, 0xe08a8a);
    }
  }

  // ------------------------------------------------------------ G. Tatsumaki geyser: a stone-walled pit
  {
    const [t0, t1] = TATSUMAKI;
    for (let u = t0; u < t1; u++)
      for (let x = 0; x < W; x++) if (!isRes(x, Y(u))) img.set(x, Y(u), rampColor(C.stone, 0.2 + fbm(x, u, { seed: 121, scale: 5, octaves: 2 }) * 0.5, x, Y(u)));
    for (let x = 4; x < 176; x++) {
      img.rect(x, Y(t0 + 10), 1, 3, C.stone[3]);
      img.rect(x, Y(t1 - 10), 1, 3, C.stone[3]);
    }
    crowd(10, Y(t0 + 30), 160, 16, 50);
  }

  // ------------------------------------------------------------ H. Chinoike: the blood-red pond
  {
    const [px, pu] = pond;
    for (let u = TATSUMAKI[1]; u < L; u++)
      for (let x = 0; x < W; x++) if (!isRes(x, Y(u))) img.set(x, Y(u), rampColor(C.stone, 0.3 + fbm(x, u, { seed: 131, scale: 6 }) * 0.5, x, Y(u)));
    hotPool(px, pu, 70, 44, C.blood, 131, 0x6a3a30);
    pool(px, Y(pu), 70, 0xff5030, 0.25);
    // wooden walkways around the pond
    for (let x = 10; x < 170; x++) {
      img.rect(x, Y(pu - 52), 1, 4, x % 4 ? C.wood[1] : C.wood[0]);
      img.rect(x, Y(pu + 52), 1, 4, x % 4 ? C.wood[1] : C.wood[0]);
    }
    crowd(10, Y(pu - 46), 160, 6, 40);
    for (let k = 0; k < 30; k++) steam(px + (rand() - 0.5) * 120, Y(pu) + (rand() - 0.5) * 80, 1.5 + rand());
  }

  // ------------------------------------------------------------ compose
  for (const o of objects) o.shadow?.();
  objects.sort((a, b) => a.y - b.y);
  for (const o of objects) o.draw();

  // geyser vents: wet dark holes with a rim of mineral deposits
  for (const v of vents) {
    const y = Y(v.u);
    for (let yy = y - 9; yy <= y + 9; yy++)
      for (let xx = v.x - 9; xx <= v.x + 9; xx++) {
        const d = Math.hypot(xx + 0.5 - v.x, yy + 0.5 - y);
        if (d > 9) continue;
        img.set(xx, yy, d < 3.5 ? 0x1e1a18 : d < 6 ? (v.mud ? C.mud[1] : 0x8aa0a8) : (xx + yy) % 3 ? 0xe8dcc0 : 0xd8c8a0);
      }
    steam(v.x, y - 4, 1.4);
  }
  // turret pads: stone steam stands
  for (const p of pads) {
    const y = Y(p.u);
    for (let yy = y - 9; yy <= y + 9; yy++)
      for (let xx = p.x - 9; xx <= p.x + 9; xx++) {
        const d = Math.hypot(xx + 0.5 - p.x, yy + 0.5 - y);
        if (d <= 9) img.set(xx, yy, d > 7.6 ? C.stone[0] : rampColor(C.stone, 0.4 + fbm(xx, yy, { seed: 2, scale: 3 }) * 0.4, xx, yy));
      }
  }

  // ------------------------------------------------------------ atmosphere, then light and steam on top
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
  // soft steam puffs, half-transparent, drifting up from pools, vents and chimneys
  for (const [sx, sy, size] of steamPuffs) {
    const r = 3 + size * 3;
    for (let yy = Math.floor(sy - r); yy <= sy + r; yy++)
      for (let xx = Math.floor(sx - r); xx <= sx + r; xx++) {
        const d = Math.hypot(xx + 0.5 - sx, (yy + 0.5 - sy) * 1.3) / r;
        if (d >= 1 || img.alpha(xx, yy) === 0) continue;
        const n = fbm(xx, yy, { seed: 141, scale: 3 });
        const a = (1 - d) * 0.5 * (0.5 + n);
        if (a > bayer(xx, yy) * 0.6) img.set(xx, yy, 0xf4f4f6, Math.min(0.55, a));
      }
  }

  const chunks = [];
  for (let i = 0; i < CHUNKS; i++) chunks.push(img.crop(0, i * CHUNK, W, CHUNK));
  return { strip: img, chunks, meta: { width: W, chunkHeight: CHUNK, chunks: CHUNKS, length: L } };
}
