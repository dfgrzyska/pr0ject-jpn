// Middle layer (Okinawa): islets and reefs, a resort beach, a red-roofed village, cane fields,
// Shuri castle, jungle cliffs, the open sea and a lighthouse island. Water away from the coast is
// left transparent so the deep ocean of the far layer shows through.
//
// Live (see ../props.mjs): waves roll in onto every beach and break white over the reefs, the lagoons
// glint, the boats and the ferry sail on with their wakes, sea turtles glide in the open water, gusts
// sweep the cane fields, banners flutter over Shuri's courtyard and the lighthouse flashes.
//
// Coordinates: u = distance from the bottom of the strip (stage start), strip y = L - u.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Raster, fbm, rng, bayer, scaleColor } from '../../lib/raster.mjs';
import { crownPixels, palmPixels, grade, rampColor } from '../nature.mjs';
import { PropKit, Window, tintTable } from '../props.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export const W = 180;
export const CHUNK = 512;
export const CHUNKS = 14;
export const L = CHUNK * CHUNKS;

const C = {
  sand: [0xc9b78e, 0xd9c9a0, 0xe8dbb4, 0xf3ebcf],
  wetSand: 0xb6a47a,
  lagoon: [0x0d5f86, 0x13799c, 0x1f96ac, 0x3cb6b8, 0x76d2c4], // deep -> shallow
  foam: 0xeef8f4,
  grass: [0x335f26, 0x42742c, 0x568a34, 0x6ea040],
  scrub: [0x2c5222, 0x3a6628, 0x4e7c30, 0x64923a],
  lane: [0xb8ac8c, 0xc8bc9a, 0xd6cba8, 0xe2d8b8],
  redEarth: [0x6e3622, 0x84442a, 0x985434, 0xaa6640],
  stone: [0x7e786a, 0x9a9482, 0xb2ac98, 0xcac4ae],
  roof: [0x8a2e1c, 0xae3e26, 0xc6502e, 0xda663c],
  mortar: 0xf0ece0,
  rock: [0x34302c, 0x4a4540, 0x625c54, 0x7e776c],
  cane: [0x3a7428, 0x579632, 0x7cb646],
  asphalt: [0x3a3c40, 0x46484c, 0x52545a],
  shuri: [0x8e1a14, 0xb8261c, 0xd8402a],
  white: 0xece6d6,
  gold: 0xe2aa32,
};

const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// sections (u)
const MAIN_S = 760; // south coast of the main island
const MAIN_N = 4650; // north coast
const VILLAGE = [1350, 2350];
const FIELDS = [2350, 3200];
const SHURI = [3200, 3850];
const JUNGLE = [3850, 4650];

const ISLETS = [
  [210, 40, 15],
  [400, 142, 12],
  [600, 58, 10],
  [5000, 132, 17],
  [5420, 38, 14],
  [5790, 124, 12],
  [6230, 90, 46], // lighthouse island
];
const REEFS = [
  [120, 118, 22],
  [480, 28, 18],
  [660, 150, 16],
  [4860, 60, 24],
  [5250, 150, 20],
  [5600, 82, 26],
  [6620, 40, 18],
  [6760, 150, 22],
];

export function buildMid() {
  const stage = JSON.parse(readFileSync(join(root, 'src', 'data', 'stage2.json'), 'utf8'));
  const { mid: V, anchor } = stage.scroll;
  const img = new Raster(W, L);
  const rand = rng(1879);
  const Y = (u) => L - u;
  const U = (y) => L - y;
  const reserved = new Uint8Array(W * L);
  const isRes = (x, y) => x >= 0 && x < W && y >= 0 && y < L && reserved[Math.floor(y) * W + Math.floor(x)];
  const reserveRect = (x0, y0, w, h) => {
    for (let y = Math.max(0, Math.floor(y0)); y < Math.min(L, y0 + h); y++)
      for (let x = Math.max(0, Math.floor(x0)); x < Math.min(W, x0 + w); x++) reserved[y * W + x] = 1;
  };
  const objects = [];
  const kit = new PropKit(1889); // the moving parts
  const gradeF = (r) => {
    grade(r, GRADE);
    return kit.frame(r);
  };
  const cane = new Uint8Array(W * L); // sugar cane (the gusts brighten it)
  /**
   * Where a mover should start so it passes its painted spot (sAt px along the route) as the screen goes
   * by there, and never reaches the ends of its route while on screen.
   */
  const passing = (u, sp, sAt, total) => {
    const t = (u - 235) / V;
    return ((((sAt - sp * t) % total) + total) % total) / total;
  };
  const shadowRect = (x, y, w, h, f = 0.55) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) img.tint(x + i, y + j, f);
  };

  // ------------------------------------------------------------ coast field
  const eastEdge = (u) => 240 - 120 * smooth(JUNGLE[0], JUNGLE[0] + 380, u);
  /** signed distance-ish to the coast (positive = land) and which coast it is */
  function coast(x, u) {
    let d = -999;
    let kind = 'sea';
    if (u > MAIN_S - 40 && u < MAIN_N + 40) {
      const n = (fbm(x, u, { seed: 81, scale: 24, octaves: 3 }) - 0.5) * 18;
      const south = u - MAIN_S + n;
      const north = MAIN_N - u + n;
      const east = eastEdge(u) - x + n * 0.7;
      d = Math.min(south, north, east);
      kind = d === south ? 'south' : d === east ? 'cliff' : 'north';
    }
    for (const [iu, ix, R] of ISLETS) {
      const dd = R - Math.hypot(x + 0.5 - ix, u - iu) + (fbm(x, u, { seed: 83, scale: 8, octaves: 2 }) - 0.5) * 6;
      if (dd > d) {
        d = dd;
        kind = 'islet';
      }
    }
    return { d, kind };
  }
  const beachW = (kind) => (kind === 'south' ? 30 : kind === 'cliff' ? 5 : 7);
  function reefD(x, u) {
    let d = -999;
    for (const [ru, rx, R] of REEFS) d = Math.max(d, R - Math.hypot(x + 0.5 - rx, u - ru) + (fbm(x, u, { seed: 85, scale: 10, octaves: 2 }) - 0.5) * 10);
    return d;
  }
  const land = new Int16Array(W * L).fill(-999); // cached coast distance for later passes
  const kinds = new Uint8Array(W * L); // 0 sea, 1 beach, 2 land

  // ------------------------------------------------------------ 1. water, beaches, ground
  for (let y = 0; y < L; y++) {
    const u = U(y);
    for (let x = 0; x < W; x++) {
      const { d, kind } = coast(x, u);
      land[y * W + x] = Math.max(-999, Math.min(999, Math.round(d)));
      const bw = beachW(kind);
      if (d > bw) {
        kinds[y * W + x] = 2;
        continue; // ground painted per section below
      }
      if (d > 0) {
        kinds[y * W + x] = 1;
        if (kind === 'cliff') {
          // limestone cliff: dark rock, lit top edge
          img.set(x, y, rampColor(C.rock, 0.25 + (d / bw) * 0.6 + (fbm(x, y, { seed: 9, scale: 3 }) - 0.5) * 0.4, x, y));
        } else {
          const n = fbm(x, y, { seed: 11, scale: 5, octaves: 2 });
          img.set(x, y, d < 2.5 ? C.wetSand : rampColor(C.sand, 0.35 + n * 0.55, x, y));
        }
        continue;
      }
      // water: shallow lagoon near coasts and over reefs, transparent open sea elsewhere
      const reach = kind === 'cliff' ? 12 : 26;
      const rd = reefD(x, u);
      let s = Math.max(1 + d / reach, rd > 0 ? 0.42 + Math.min(rd, 14) / 34 : 0);
      if (s <= 0) continue;
      if (s < 0.35 && s < bayer(x, y) * 0.35) continue; // dithered drop-off into deep water
      const caust = fbm(x * 1.3, y, { seed: 13, scale: 6, octaves: 2 });
      let c = rampColor(C.lagoon, Math.min(1, s * 0.95 + (caust - 0.5) * 0.18), x, y);
      if (caust > 0.7 && s > 0.45 && (x + y) % 3 === 0) c = scaleColor(c, 1.18);
      if (d > -1.6 && d <= 0) c = C.foam; // surf line
      img.set(x, y, c);
    }
  }
  const K = (x, y) => (x < 0 || x >= W || y < 0 || y >= L ? 0 : kinds[y * W + x]);
  const D = (x, y) => (x < 0 || x >= W || y < 0 || y >= L ? -999 : land[y * W + x]);

  const fillLand = (u0, u1, ramp, seed, scale = 7) => {
    for (let u = u0; u < u1; u++) {
      const y = Y(u);
      for (let x = 0; x < W; x++) if (K(x, y) === 2) img.set(x, y, rampColor(ramp, fbm(x, y, { seed, scale, octaves: 2 }), x, y));
    }
  };
  // ground per section
  fillLand(0, VILLAGE[0], C.grass, 21);
  fillLand(VILLAGE[0], VILLAGE[1], C.lane, 22, 5);
  fillLand(FIELDS[0], FIELDS[1], C.redEarth, 23);
  fillLand(SHURI[0], SHURI[1], C.grass, 24);
  fillLand(JUNGLE[0], L, C.scrub, 25);

  // ------------------------------------------------------------ helpers: buildings & props
  /** Okinawan red-tile hip roof with white mortar, little shisa on the ridge, cream walls below. */
  const house = (x, y, w, h, opt = {}) => {
    const roof = opt.roof ?? C.roof;
    const faceH = opt.faceH ?? 3;
    const ridge = y + Math.round(h * 0.42);
    const hi = Math.round(h * 0.45);
    objects.push({
      y: y + h + faceH,
      shadow: () => shadowRect(x + 3, y + 4, w, h + faceH, 0.5),
      draw: () => {
        for (let yy = y; yy < y + h; yy++) {
          const north = yy <= ridge;
          const t = north ? (ridge - yy) / Math.max(1, ridge - y) : (yy - ridge) / Math.max(1, y + h - 1 - ridge);
          const inset = hi * (1 - t);
          for (let xx = x; xx < x + w; xx++) {
            const lx = xx - x;
            const rx = x + w - 1 - xx;
            const hip = lx < inset || rx < inset;
            let c = lx < inset ? roof[3] : rx < inset ? roof[0] : north ? roof[2] : roof[1];
            const mortarLine = hip ? (yy - y) % 3 === 2 : (xx - x) % 3 === 2;
            if (mortarLine) c = scaleColor(c, 1.25);
            img.set(xx, yy, c);
          }
        }
        // white mortar along ridge and hips
        for (let xx = x + hi; xx < x + w - hi; xx++) img.set(xx, ridge, C.mortar);
        img.line(x, y, x + hi, ridge, C.mortar);
        img.line(x + w - 1, y, x + w - 1 - hi, ridge, C.mortar);
        img.line(x, y + h - 1, x + hi, ridge, C.mortar);
        img.line(x + w - 1, y + h - 1, x + w - 1 - hi, ridge, C.mortar);
        if (opt.shisa !== false) {
          const sx = x + Math.floor(w / 2) - 1;
          img.set(sx, ridge - 1, 0xe08a3a);
          img.set(sx + 2, ridge - 1, 0xe08a3a);
        }
        const fy = y + h;
        for (let yy = fy; yy < fy + faceH; yy++)
          for (let xx = x + 1; xx < x + w - 1; xx++) {
            const k = (xx - x) % 6;
            img.set(xx, yy, yy === fy ? 0x5a4a3a : k === 2 && yy === fy + 1 ? 0x3a3a44 : opt.wall ?? C.white);
          }
      },
    });
    reserveRect(x - 2, y - 2, w + 4, h + faceH + 4);
  };
  /** Modern Okinawan concrete house: flat roof, black water tanks, sometimes a solar panel. */
  const flatHouse = (x, y, w, h) => {
    const tanks = 1 + Math.floor(rand() * 2);
    const solar = rand() < 0.4;
    objects.push({
      y: y + h + 3,
      shadow: () => shadowRect(x + 3, y + 4, w, h + 3, 0.5),
      draw: () => {
        img.rect(x, y, w, h, 0xc4c2ba);
        img.rect(x, y, w, 1, 0xdedcd4);
        img.rect(x + w - 1, y, 1, h, 0x9a988f);
        img.rect(x, y + h - 1, w, 1, 0x8a887f);
        for (let i = 0; i < tanks; i++) {
          const tx = x + 3 + i * 5;
          img.disc(tx + 1.5, y + 3.5, 2, 0x1e1e24);
          img.set(tx + 1, y + 2, 0x5a5a66);
        }
        if (solar) {
          img.rect(x + w - 9, y + 3, 6, 4, 0x24366a);
          img.rect(x + w - 9, y + 3, 6, 1, 0x4a64a0);
        }
        img.rect(x, y + h, w, 3, C.white);
        for (let xx = x + 2; xx < x + w - 2; xx += 5) img.rect(xx, y + h + 1, 2, 1, 0x4a5a6a);
      },
    });
    reserveRect(x - 2, y - 2, w + 4, h + 7);
  };
  /** Coral-limestone wall (ishigaki) along a polyline of points. */
  const wall = (pts, thick = 2) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let k = 0; k <= n; k++) {
        const x = Math.round(x0 + ((x1 - x0) * k) / n);
        const y = Math.round(y0 + ((y1 - y0) * k) / n);
        for (let t = 0; t < thick; t++) {
          img.tint(x + 1 + t, y + 2, 0.6);
          img.set(x + t, y, (x + y + t) % 4 === 0 ? C.stone[0] : t === 0 ? C.stone[3] : C.stone[1]);
        }
        reserveRect(x - 1, y - 1, thick + 2, 3);
      }
    }
  };
  const tree = (kind, x, y, r) => {
    const seed = Math.floor(rand() * 1e9);
    const cx = Math.round(x);
    const cy = Math.round(y);
    const px = () => (kind === 'palm' ? palmPixels(cx, cy, r, rng(seed)) : crownPixels(kind, cx, cy, r, rng(seed), seed & 1023));
    const off = Math.round(2 + r * 0.25);
    objects.push({
      y: cy + r * 0.6,
      shadow: () => {
        for (const p of px()) img.tint(p.x + off, p.y + off + 1, 0.5);
      },
      draw: () => {
        for (const p of px()) img.set(p.x, p.y, p.c);
        if (kind === 'hibiscus') {
          const fr = rng(seed + 1);
          for (let i = 0; i < r * 2; i++) {
            const a = fr() * Math.PI * 2;
            const dd = fr() * r * 0.8;
            img.set(Math.round(cx + Math.cos(a) * dd), Math.round(cy + Math.sin(a) * dd), fr() < 0.7 ? 0xe8303a : 0xffd0d4);
          }
        }
      },
    });
  };
  const umbrella = (x, y, col) => {
    objects.push({
      y: y + 3,
      shadow: () => {
        for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) if (i * i + j * j <= 10) img.tint(x + i + 2, y + j + 2, 0.6);
      },
      draw: () => {
        for (let j = -3; j <= 3; j++)
          for (let i = -3; i <= 3; i++) {
            if (i * i + j * j > 10) continue;
            const seg = Math.floor(((Math.atan2(j, i) + Math.PI) / (Math.PI * 2)) * 6) % 2;
            img.set(x + i, y + j, seg ? col : 0xf6f2e6);
          }
        img.set(x, y, 0x6a4a2a);
      },
    });
  };
  const towel = (x, y, col) => {
    img.rect(x, y, 3, 5, col);
    img.rect(x, y + 1, 3, 1, 0xf6f2e6);
  };
  // boats and the ferry are live: they sail up the screen with their wakes spreading behind them
  const wakeF = (spread) =>
    [0, 1, 2, 3].map((k) => {
      const s = spread + k * 2;
      const out = new Raster(1, s * 2 + 1);
      out.set(0, 0, 0xeaf6fa);
      out.set(0, s * 2, 0xeaf6fa);
      if (k < 2) {
        out.set(0, 1, 0xc8e4ec);
        out.set(0, s * 2 - 1, 0xc8e4ec);
      }
      return gradeF(out);
    });
  const smallWake = wakeF(2);
  const boat = (x, u, len, sail) => {
    const out = new Raster(7, len + 1);
    for (let j = 0; j < len; j++) {
      const w = j < 2 ? 1 : j > len - 2 ? 2 : 3;
      for (let i = 0; i < w; i++) out.set(2 + i + (3 - w > 1 ? 1 : 0), j, j % 3 === 0 ? 0x5a3a22 : 0x7a5230);
    }
    out.set(3, Math.floor(len / 2), 0x3a2a1a);
    for (let j = 2; j <= len; j++) out.set(4 + (j > len - 2 ? 0 : 1), j, 0x0a1a2a, 0.25); // its shadow on the water
    if (sail) {
      out.rect(0, Math.floor(len / 3), 7, 1, 0x6a4a2a);
      out.rect(1, Math.floor(len / 3) + 1, 5, 2, sail);
    }
    const sp = 5;
    kit.path([[x + 3, u - 200], [x + 3, u + 400]], [gradeF(out)], { sp, turn: 'none', wake: { f: smallWake, every: 3, life: 2.2 }, s0: passing(u, sp, 200, 600) });
  };
  const ferry = (x, u) => {
    const out = new Raster(12, 33);
    for (let j = 0; j < 30; j++) {
      const w = j < 4 ? 3 + j * 2 : 9;
      const ox = Math.floor((9 - w) / 2);
      for (let i = 0; i < w; i++) out.set(ox + i, j, i === 0 || i === w - 1 ? 0x2a4a8a : 0xf2f2ee);
    }
    out.rect(2, 10, 5, 10, 0xd8dce4);
    out.rect(3, 12, 3, 2, 0x3a5a9a);
    out.rect(3, 22, 3, 3, 0xe04a2a);
    for (let j = 3; j < 33; j++) for (const i of [9, 10, 11]) if (i - 9 < 3 && j > 2 + (i - 9)) out.set(i, j, 0x0a1a2a, 0.22);
    const sp = 8;
    kit.path([[x + 6, u - 300], [x + 6, u + 500]], [gradeF(out)], { sp, turn: 'none', wake: { f: wakeF(5), every: 3, life: 2.6 }, s0: passing(u, sp, 300, 800) });
  };

  // ------------------------------------------------------------ A. sea start: islets + boats
  const isletDecor = (iu, ix, R, palms) => {
    for (let i = 0; i < palms; i++) {
      const a = rand() * Math.PI * 2;
      const r = rand() * R * 0.45;
      tree('palm', ix + Math.cos(a) * r, Y(iu + Math.sin(a) * r), 6 + rand() * 2);
    }
    // a dark lava rock on the shore
    const a = rand() * Math.PI * 2;
    const rx = Math.round(ix + Math.cos(a) * (R - 6));
    const ry = Y(iu + Math.sin(a) * (R - 6));
    img.disc(rx + 1, ry + 2, 3, 0x000000, 0.35);
    img.disc(rx, ry, 3, C.rock[1]);
    img.disc(rx - 1, ry - 1, 1.5, C.rock[3]);
  };
  for (const [iu, ix, R] of ISLETS.slice(0, 3)) isletDecor(iu, ix, R, 3);
  boat(100, 300, 9, 0xf2eee0);
  boat(150, 560, 8, null);
  boat(30, 680, 9, 0x3a6ab0);

  // ------------------------------------------------------------ B. resort beach
  for (let x = 6; x < W; x += 14 + Math.floor(rand() * 8)) {
    const u = Math.round(MAIN_S + 12 + rand() * 10);
    if (K(x, Y(u)) !== 1) continue;
    umbrella(x, Y(u), [0xe0402a, 0x2a7ad0, 0xf0b020, 0x2aa060][Math.floor(rand() * 4)]);
    towel(x + 4, Y(u) - 2, [0xe86a9a, 0x5ac0e0, 0xf6d040][Math.floor(rand() * 3)]);
  }
  // palms along the top of the beach
  for (let x = 4; x < W; x += 11 + Math.floor(rand() * 6)) tree('palm', x + rand() * 4, Y(MAIN_S + 36 + rand() * 8), 6 + rand() * 2);
  // hotel + pool
  {
    const hx = 104;
    const hy = Y(960);
    objects.push({
      y: hy + 40,
      shadow: () => shadowRect(hx + 5, hy + 6, 56, 40, 0.5),
      draw: () => {
        img.rect(hx, hy, 56, 40, 0xe6e4dc);
        img.rect(hx, hy, 56, 1, 0xf8f6f0);
        img.rect(hx + 55, hy, 1, 40, 0xb8b6ae);
        for (let i = 0; i < 6; i++) img.rect(hx + 5 + i * 8, hy + 8, 4, 3, 0x9aa0a8); // rooftop units
        img.rect(hx + 6, hy + 22, 44, 12, 0xd4d2ca);
        img.rect(hx, hy + 40, 56, 3, 0x7a8a9a); // glass facade
      },
    });
    reserveRect(hx - 2, hy - 2, 60, 48);
    const py = Y(900);
    img.rect(110, py, 40, 16, 0xd8d2c0);
    img.rect(112, py + 2, 36, 12, 0x4ad0e0);
    for (let i = 0; i < 6; i++) img.rect(114 + i * 6, py + 4 + (i % 2), 4, 1, 0x9ae8f0);
    for (let i = 0; i < 5; i++) img.rect(112 + i * 7, py + 18, 4, 2, 0xf6f2e6);
    reserveRect(108, py - 2, 44, 24);
  }
  // coastal road (asphalt with dashed centre line)
  const ROAD_U = 1150;
  for (let u = ROAD_U; u < ROAD_U + 10; u++)
    for (let x = 0; x < W; x++) {
      const y = Y(u);
      if (K(x, y) !== 2) continue;
      img.set(x, y, u === ROAD_U + 5 && x % 8 < 4 ? 0xe8e4d0 : rampColor(C.asphalt, fbm(x, y, { seed: 31, scale: 3 }), x, y));
    }
  reserveRect(0, Y(ROAD_U + 12), W, 14);

  // ------------------------------------------------------------ C. village
  {
    // main street (sand) and plots enclosed by coral walls
    for (let u = VILLAGE[0]; u < VILLAGE[1]; u++) reserveRect(82, Y(u), 16, 1);
    let u = VILLAGE[0] + 10;
    while (u < VILLAGE[1] - 46) {
      const rowH = 32 + Math.floor(rand() * 14);
      for (const [x0, x1] of [[2, 79], [101, 178]]) {
        let x = x0 + Math.floor(rand() * 5);
        while (x < x1 - 22) {
          const pw = Math.min(x1 - x, 26 + Math.floor(rand() * 18));
          const ph = rowH - Math.floor(rand() * 5);
          const top = Y(u + ph) + Math.floor(rand() * 3);
          // garden ground inside the coral walls
          for (let yy = top + 1; yy < top + ph; yy++)
            for (let xx = x + 1; xx < x + pw; xx++)
              if (K(xx, yy) === 2) img.set(xx, yy, rampColor(C.grass, 0.25 + fbm(xx, yy, { seed: 51, scale: 5 }) * 0.6, xx, yy));
          wall([[x, top], [x + pw, top], [x + pw, top + ph], [x, top + ph], [x, top]]);
          const r = rand();
          const hw = Math.min(pw - 8, 16 + Math.floor(rand() * 10));
          const hx = x + 4 + Math.floor(rand() * Math.max(1, pw - hw - 7));
          if (r < 0.55) house(hx, top + 5, hw, 11 + Math.floor(rand() * 5));
          else if (r < 0.88) flatHouse(hx, top + 5, hw, 10 + Math.floor(rand() * 5));
          else tree('tropic', x + pw / 2, top + ph / 2, 8 + rand() * 3);
          // fukugi along the walls, hibiscus and banana in the garden
          tree('fukugi', x + 4, top + 4, 4 + rand() * 1.5);
          if (rand() < 0.7) tree('fukugi', x + pw - 4, top + 4, 4 + rand() * 1.5);
          if (rand() < 0.7) tree('hibiscus', x + 5 + rand() * 4, top + ph - 5, 3.5);
          if (rand() < 0.5) tree('banana', x + pw - 6, top + ph - 6, 4 + rand());
          x += pw + 2 + Math.floor(rand() * 3);
        }
      }
      u += rowH + 4 + Math.floor(rand() * 4);
    }
    // village square with a big banyan (gajumaru)
    tree('tropic', 90, Y(1880), 14);
  }

  // ------------------------------------------------------------ D. fields
  {
    let u = FIELDS[0] + 6;
    while (u < FIELDS[1] - 20) {
      const fh = 50 + Math.floor(rand() * 30);
      let x = 0;
      while (x < W) {
        const fw = 36 + Math.floor(rand() * 26);
        const kind = rand();
        const top = Y(u + fh);
        for (let yy = top; yy < top + fh; yy++)
          for (let xx = x + 2; xx < Math.min(W, x + fw - 2); xx++) {
            if (K(xx, yy) !== 2) continue;
            if (kind < 0.55) {
              // sugar cane: dense vertical rows
              const col = (xx - x) % 3;
              img.set(xx, yy, col === 0 ? C.cane[0] : col === 1 ? C.cane[1] : (yy + xx) % 4 === 0 ? C.cane[2] : C.cane[1]);
              cane[yy * W + xx] = 1;
            } else if (kind < 0.8) {
              // pineapple: spiky dark rosettes in rows on red earth
              if ((xx - x) % 4 < 2 && (yy - top) % 4 < 2) img.set(xx, yy, (xx + yy) % 2 ? 0x2e5a2a : 0x3e7232);
            } else {
              img.set(xx, yy, rampColor(C.grass, fbm(xx, yy, { seed: 41, scale: 6 }), xx, yy));
            }
          }
        reserveRect(x + 2, top, fw - 4, fh);
        x += fw;
      }
      // windbreak of fukugi along the farm road
      for (let xx = 6; xx < W; xx += 9) tree('fukugi', xx + rand() * 3, Y(u + fh + 4), 3.5 + rand());
      u += fh + 10;
    }
    // gusuku ruin on a wooded hill
    const gu = 2960;
    const gx = 74;
    const gy = Y(gu);
    for (let yy = gy - 48; yy < gy + 20; yy++)
      for (let xx = gx - 62; xx < gx + 62; xx++) {
        const e = ((xx - gx) / 60) ** 2 + ((yy - gy + 14) / 34) ** 2;
        if (e < 1 && K(xx, yy) === 2) img.set(xx, yy, rampColor(C.grass, 0.55 - e * 0.35 + fbm(xx, yy, { seed: 52, scale: 6 }) * 0.3, xx, yy));
      }
    const arc = (rx, ry, oy, a0, a1, th) => {
      const pts = [];
      for (let a = a0; a <= a1 + 1e-6; a += 0.04) pts.push([gx + Math.cos(a) * rx, gy + oy + Math.sin(a) * ry]);
      wall(pts, th);
    };
    arc(52, 30, 0, -3.0, -0.15, 4);
    arc(32, 18, -10, -2.8, -0.35, 3);
    for (let i = 0; i < 7; i++) tree('fukugi', gx - 56 + i * 18 + rand() * 4, gy + 10 + rand() * 4, 4 + rand());
  }

  // ------------------------------------------------------------ E. Shuri castle
  {
    // curved outer walls
    for (const [rx, ry, a0, a1] of [[90, 120, -2.9, -0.25], [90, 96, -2.7, -0.45]]) {
      const cy = Y(3420);
      const pts = [];
      for (let a = a0; a <= a1; a += 0.03) pts.push([90 + Math.cos(a) * rx * 0.62, cy + Math.sin(a) * ry * 0.9]);
      wall(pts, 4);
    }
    // Shureimon gate
    const gx = 76;
    const gy = Y(3300);
    objects.push({
      y: gy + 14,
      shadow: () => shadowRect(gx + 3, gy + 4, 30, 12, 0.5),
      draw: () => {
        for (const [ox, oy, w, h] of [[0, 4, 28, 6], [4, 0, 20, 5]]) {
          for (let yy = 0; yy < h; yy++)
            for (let xx = 0; xx < w; xx++) img.set(gx + ox + xx, gy + oy + yy, (xx % 3 === 2 ? scaleColor(C.roof[2], 1.2) : yy < h / 2 ? C.roof[2] : C.roof[1]));
          img.rect(gx + ox, gy + oy + h - 1, w, 1, C.roof[0]);
        }
        for (const px of [2, 9, 18, 25]) img.rect(gx + px, gy + 10, 2, 4, C.shuri[1]);
        img.rect(gx + 11, gy + 2, 6, 2, C.gold);
      },
    });
    reserveRect(gx - 2, gy - 2, 34, 20);
    // Una courtyard: red/white striped paving, Seiden main hall, side halls
    const cyTop = Y(3600);
    for (let yy = cyTop - 4; yy < cyTop + 84; yy++) for (let xx = 46; xx < 134; xx++) img.set(xx, yy, rampColor(C.stone, 0.5 + fbm(xx, yy, { seed: 53, scale: 4 }) * 0.4, xx, yy));
    for (let yy = cyTop; yy < cyTop + 76; yy++) for (let xx = 58; xx < 122; xx++) img.set(xx, yy, Math.floor((xx - 58) / 2) % 2 ? 0xd8cfc0 : 0xb8503a);
    reserveRect(44, cyTop - 6, 92, 92);
    // festival banners on tall poles at the courtyard's corners, fluttering (live)
    for (const [bx, c1, c2] of [[50, 0xe8c030, 0xc8302a], [128, 0xc8302a, 0xe8c030]])
      for (const by of [cyTop + 6, cyTop + 60]) {
        const flag = [0, 1, 2].map((f) => {
          const out = new Raster(6, 12);
          out.rect(0, 0, 1, 12, 0x4a3424);
          for (let j = 1; j < 9; j++) {
            const wv = f === 0 ? 0 : Math.round(Math.sin(j * 0.8 + f * 1.7));
            for (let i = 1; i < 4; i++) out.set(i, j + (i === 3 ? wv : 0), j < 3 ? c2 : c1);
            if (f) out.set(4, j + wv, scaleColor(c1, 0.8));
          }
          out.set(1, 11, 0x0a1010, 0.4);
          return gradeF(out);
        });
        kit.loop(bx, U(by - 10), flag, { seq: [0, 1, 2, 1], fps: 3.5 });
      }
    const sx = 40;
    const sy = Y(3680);
    objects.push({
      y: sy + 46,
      shadow: () => shadowRect(sx + 5, sy + 6, 100, 46, 0.5),
      draw: () => {
        // great red-tile roof (two tiers) over vermilion walls
        for (let yy = 0; yy < 34; yy++)
          for (let xx = 0; xx < 100; xx++) {
            const north = yy < 13;
            let c = north ? C.roof[2] : C.roof[1];
            if (xx < 14 - Math.abs(yy - 13) * 0.6) c = C.roof[3];
            if (xx > 86 + Math.abs(yy - 13) * 0.6) c = C.roof[0];
            if (xx % 3 === 2) c = scaleColor(c, 1.22);
            img.set(sx + xx, sy + yy, c);
          }
        img.rect(sx + 14, sy + 13, 72, 1, C.mortar);
        img.rect(sx + 40, sy + 18, 20, 9, C.roof[2]); // front gable (karahafu)
        img.rect(sx + 40, sy + 26, 20, 1, C.mortar);
        img.rect(sx + 47, sy + 11, 6, 3, C.gold); // dragon ridge ornament
        img.set(sx + 14, sy + 12, C.gold);
        img.set(sx + 85, sy + 12, C.gold);
        for (let yy = 34; yy < 46; yy++)
          for (let xx = 2; xx < 98; xx++) {
            const k = (xx - 2) % 8;
            img.set(sx + xx, sy + yy, yy === 34 ? 0x3a1410 : k < 2 ? C.shuri[0] : yy < 40 ? C.shuri[2] : C.shuri[1]);
          }
        img.rect(sx + 44, sy + 38, 12, 8, C.gold);
      },
    });
    reserveRect(sx - 2, sy - 2, 104, 50);
    house(18, Y(3560), 24, 16, { shisa: false, wall: C.shuri[2] });
    house(138, Y(3560), 24, 16, { shisa: false, wall: C.shuri[2] });
  }

  // ------------------------------------------------------------ H/I. sea islets, boats, lighthouse island
  for (const [iu, ix, R] of ISLETS.slice(3, 6)) isletDecor(iu, ix, R, 2 + Math.floor(R / 7));
  boat(70, 4780, 9, 0xf2eee0);
  ferry(96, 5120);
  boat(150, 5520, 8, 0xe04a2a);
  boat(40, 5930, 9, null);
  {
    const [iu, ix] = ISLETS[6];
    const lx = ix;
    const ly = Y(iu + 6);
    objects.push({
      y: ly + 6,
      shadow: () => {
        for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) if (i * i + j * j <= 18) img.tint(lx + i + 4, ly + j + 6, 0.5);
      },
      draw: () => {
        img.disc(lx + 0.5, ly + 0.5, 4.5, 0xf4f2ea);
        img.disc(lx + 0.5, ly + 0.5, 3, 0xd8d4c8);
        img.disc(lx + 0.5, ly + 0.5, 2, 0xc8302a);
        img.set(lx, ly, 0xfff2a0);
      },
    });
    // the lamp flashes: a double flash every few seconds (live, painted after the grade: it's light)
    {
      const flash = [1, 2].map((r) => {
        const out = new Raster(7, 7);
        for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) if (i * i + j * j <= r * r + 0.5) out.set(3 + i, 3 + j, i || j ? 0xfff2a0 : 0xffffff, i || j ? 0.75 : 1);
        return kit.frame(out);
      });
      kit.loop(lx - 3, U(ly - 3), flash, { seq: [1, 0, -1, 1, 0, ...Array(18).fill(-1)], fps: 8, fx: 1 });
    }
    reserveRect(lx - 7, ly - 7, 14, 14);
    house(ix - 24, Y(iu - 10), 16, 10);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + rand() * 0.4;
      tree('palm', ix + Math.cos(a) * 28, Y(iu + Math.sin(a) * 26), 6 + rand() * 2);
    }
  }

  // ------------------------------------------------------------ turret pads from the wave file
  for (const w of stage.waves.filter((w) => w.type === 'turret')) {
    const y = Y(anchor + V * w.t + 10);
    const x = w.x;
    for (let yy = y - 10; yy <= y + 10; yy++)
      for (let xx = x - 10; xx <= x + 10; xx++) {
        const dd = Math.hypot(xx + 0.5 - x, yy + 0.5 - y);
        if (dd > 10) continue;
        img.set(xx, yy, dd > 8.5 ? C.stone[0] : rampColor(C.stone, 0.4 + fbm(xx, yy, { seed: 2, scale: 3 }) * 0.4, xx, yy));
      }
    reserveRect(x - 13, y - 13, 26, 26);
  }

  // ------------------------------------------------------------ vegetation
  const kindsAt = (u) => {
    if (u < MAIN_S + 400) return [['palm', 0.45], ['hibiscus', 0.65], ['tropic', 1]];
    if (u < VILLAGE[1]) return [['fukugi', 0.5], ['tropic', 0.8], ['banana', 1]];
    if (u < FIELDS[1]) return [['fukugi', 0.6], ['tropic', 1]];
    if (u < SHURI[1]) return [['tropic', 0.5], ['fukugi', 0.8], ['palm', 1]];
    if (u < MAIN_N + 50) return [['tropic', 0.45], ['fern', 0.8], ['banana', 0.9], ['palm', 1]];
    return [['palm', 0.7], ['tropic', 1]];
  };
  const RADIUS = { palm: [5.5, 7.5], tropic: [5, 8], fukugi: [4, 5.5], fern: [4, 6], banana: [3.5, 5], hibiscus: [3, 4.5] };
  for (let gy = 0; gy < L; gy += 7)
    for (let gx = -2; gx < W + 2; gx += 7) {
      const x = gx + rand() * 7;
      const y = gy + rand() * 7;
      const ix = Math.round(x);
      const iy = Math.round(y);
      if (ix < 0 || ix >= W || K(ix, iy) !== 2) continue;
      if (D(ix, iy) < 10) continue;
      const u = U(iy);
      if (u > VILLAGE[0] && u < VILLAGE[1] && rand() < 0.75) continue; // village is mostly built up
      const ks = kindsAt(u);
      const roll = rand();
      const kind = ks.find(([, p]) => roll < p)[0];
      const [r0, r1] = RADIUS[kind];
      const r = r0 + rand() * (r1 - r0);
      const k = r * 0.6;
      if (isRes(ix, iy) || isRes(ix - k, iy) || isRes(ix + k, iy) || isRes(ix, iy - k) || isRes(ix, iy + k)) continue;
      if (rand() < (u > JUNGLE[0] ? 0.05 : 0.3)) continue;
      tree(kind, x, y, r);
    }

  // ------------------------------------------------------------ compose
  for (const o of objects) o.shadow?.();
  objects.sort((a, b) => a.y - b.y);
  for (const o of objects) o.draw();

  grade(img, GRADE);

  // ------------------------------------------------------------ live: the sea
  // waves rolling in: lines of foam at four distances from every beach, lit one after another towards
  // the sand (one frame per line per stretch of coast); white water breaking over the reef edges
  for (let y0 = 0; y0 < L; y0 += 64) {
    const lines = [];
    for (let k = 0; k < 4; k++) {
      const dk = 3 + k * 4;
      const px = [];
      for (let y = y0; y < y0 + 64; y++)
        for (let x = 0; x < W; x++) {
          const d = D(x, y);
          if (d < -dk - 1.5 || d > -dk + 0.5 || K(x, y) !== 0) continue;
          if (fbm(x, y * 0.5 + k * 30, { seed: 91 + k, scale: 7 }) < 0.36 + k * 0.04) continue;
          px.push([x, y, d > -dk - 0.6]);
        }
      if (px.length < 6) continue;
      const xs = px.map((p) => p[0]);
      const ys = px.map((p) => p[1]);
      const out = new Window(Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs) + 1, Math.max(...ys) - Math.min(...ys) + 1);
      for (const [x, y, crest] of px) {
        if (crest) out.set(x, y, C.foam);
        else if (bayer(x, y) < 0.5) out.set(x, y, 0xd8f0f0, 0.7);
      }
      lines.push([gradeF(out), out.x0, U(out.y0), k]);
    }
    if (lines.length)
      kit.wave(
        lines.map((l) => l[0]),
        lines.map(([, x, u, k], i) => [i, x, u, k * 1.1]),
        { w: 1.4, a0: 0, a1: 0.9, pw: 3 },
      );
  }
  for (const [ru, rx, R] of REEFS) {
    const out = new Window(rx - R - 8, Y(ru) - R - 8, R * 2 + 17, R * 2 + 17);
    for (let y = out.y0; y < out.y0 + out.h; y++)
      for (let x = out.x0; x < out.x0 + out.w; x++) {
        const rd = reefD(x, U(y));
        if (rd < -1.5 || rd > 1 || K(x, y) !== 0) continue;
        if (fbm(x, y, { seed: 95, scale: 4 }) < 0.4) continue;
        out.set(x, y, rd > -0.5 ? C.foam : 0xd8f0f0, rd > -0.5 ? 1 : 0.6);
      }
    kit.wave([gradeF(out)], [[0, out.x0, U(out.y0), ru * 0.37]], { w: 1.1, a0: 0, a1: 0.85, pw: 4 });
  }
  // the lagoons glint: short bright ripples coming and going over the shallows
  {
    const glint = [3, 5, 3].map((len, i) => {
      const out = new Raster(5, 1);
      for (let x = (5 - len) >> 1; x < ((5 - len) >> 1) + len; x++) out.set(x, 0, i === 1 ? 0xffffff : 0xd8f4f0, i === 1 ? 0.9 : 0.6);
      return gradeF(out);
    });
    // over every patch of shallow water (cells of 12 x 8 px), grouped by stretch of the strip
    for (let u0 = 0; u0 < L; u0 += 256) {
      const rects = [];
      for (let u = u0 + 8; u <= u0 + 256 && u <= L; u += 8)
        for (let x = 0; x + 12 <= W; x += 12) {
          const ok = [[0, 0], [11, 0], [0, 7], [11, 7], [6, 4]].every(([dx, dy]) => {
            const xx = x + dx;
            const yy = Y(u) + dy;
            const i = img.idx(xx, yy);
            const d = D(xx, yy);
            return K(xx, yy) === 0 && i >= 0 && img.data[i + 3] && ((d < -4 && d > -22) || reefD(xx, U(yy)) > 2);
          });
          if (ok) rects.push([x, u, 12, 8]);
        }
      if (rects.length) kit.spot(rects, glint, { rate: rects.length * 0.08, fps: 7, a: 0.8 });
    }
  }
  // sea turtles gliding in the open water, half seen through it
  {
    const turtle = (f) => {
      const out = new Raster(9, 9);
      out.ellipse(4, 4, 3, 2.5, 0x0e2a34);
      out.disc(7.5, 4, 1.2, 0x0e2a34);
      for (const s of [-1, 1]) {
        out.set(5 + (f ? 1 : 0), 4 + s * 3, 0x0e2a34);
        out.set(4 + (f ? 1 : 0), 4 + s * 4, 0x0e2a34);
        out.set(2, 4 + s * 3, 0x0e2a34);
      }
      out.set(0, 4, 0x0e2a34);
      return gradeF(out);
    };
    const tf = [turtle(0), turtle(1)];
    kit.wander(92, 320, 34, 76, tf, { n: 2, sp: 4, idle: 0.1, fps: 1.5, a: 0.45, d: -0.4 });
    kit.wander(70, 5100, 28, 110, tf, { n: 2, sp: 4, idle: 0.1, fps: 1.5, a: 0.45, d: -0.4 });
    kit.wander(60, 5960, 30, 60, tf, { n: 1, sp: 4, idle: 0.1, fps: 1.5, a: 0.45, d: -0.4 });
  }
  // gusts over the cane fields: the long leaves flash pale, a patch at a time, in waves across the farm
  for (let y0 = Y(FIELDS[1]); y0 < Y(FIELDS[0]); y0 += 16)
    for (let x0 = 0; x0 < W; x0 += 16) {
      let n = 0;
      const tile = new Window(x0, y0, 16, 16);
      for (let y = y0; y < y0 + 16; y++)
        for (let x = x0; x < Math.min(W, x0 + 16); x++) {
          const i = img.idx(x, y);
          if (!cane[y * W + x] || i < 0) continue;
          tile.setRGBA(x, y, Math.min(255, img.data[i] * 1.2 + 24), Math.min(255, img.data[i + 1] * 1.18 + 24), Math.min(255, img.data[i + 2] * 1.05 + 10), 255);
          n++;
        }
      if (n < 12) continue;
      const u = U(y0);
      kit.wave([kit.frame(tile)], [[0, x0, u, -(x0 * 0.06 + u * 0.01) + fbm(x0, u, { seed: 97, scale: 40 }) * 2]], { w: 1.2, a0: 0, a1: 0.55, pw: 4 });
    }

  const chunks = [];
  for (let i = 0; i < CHUNKS; i++) chunks.push(img.crop(0, i * CHUNK, W, CHUNK));
  const white = new Raster(1, 1);
  white.set(0, 0, 0xffffff);
  grade(white, GRADE);
  return { strip: img, chunks, props: kit.pack(), meta: { width: W, chunkHeight: CHUNK, chunks: CHUNKS, length: L, tint: tintTable(L, () => [white.data[0], white.data[1], white.data[2]]) } };
}

// readability: keep the islands bright and inviting, but a touch muted under the bullets
const GRADE = { sat: 0.86, bright: 0.86, tint: 0x102030, tintAmt: 0.05 };
