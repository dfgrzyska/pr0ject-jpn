// Middle layer (Okinawa): islets and reefs, a resort beach, a red-roofed village, cane and pineapple
// fields, then Naha on the way up to Shuri: a hillside of turtle-back tombs (one family holding its
// Shīmī picnic in front of theirs), the potters' lane of Tsuboya with its old climbing kiln, the Makishi
// market under its glass roof and the Heiwa-dōri arcade, and Kokusai-dōri with an eisa parade marching up
// it; then Shuri castle, jungle cliffs, the open sea and a lighthouse island. Water away from the coast is
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
const FIELDS = [2350, 3200]; // laid out in full (see D.), but Naha is built over the part from NAHA[0]
const NAHA = [2560, 3200];
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
  const flatHouse = (x, y, w, h, R = rand) => {
    const tanks = 1 + Math.floor(R() * 2);
    const solar = R() < 0.4;
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
  const tree = (kind, x, y, r, R = rand) => {
    const seed = Math.floor(R() * 1e9);
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
  const objectsBeforeFields = objects.length;
  let fieldsRes = null; // what the fields reserved where Naha now stands (the vegetation pass still asks it)
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

  // ------------------------------------------------------------ D2. Naha, on the way up to Shuri
  // The fields above are still laid out in full, so every random number after them comes out the same (Shuri,
  // the jungle and the northern islets look as they did); what they left above NAHA[0] is cleared away and
  // Naha is built there with random numbers of its own.
  {
    for (let i = objects.length - 1; i >= objectsBeforeFields; i--) if (objects[i].y < Y(NAHA[0])) objects.splice(i, 1);
    fieldsRes = reserved.slice(Y(NAHA[1]) * W, Y(NAHA[0]) * W);
    for (let y = Y(NAHA[1]); y < Y(NAHA[0]); y++)
      for (let x = 0; x < W; x++) {
        reserved[y * W + x] = 0;
        cane[y * W + x] = 0;
      }
    const nr = rng(1899);
    const pick = (a) => a[Math.floor(nr() * a.length)];
    const [n0, n1] = NAHA;
    const TOMBS = [n0, 2690];
    const TSUBOYA = [2690, 2860];
    const MARKET = [2860, 2990];
    const KOKUSAI = [2990, n1];
    const anyRes = (x0, y0, w, h) => {
      for (let y = Math.floor(y0); y < y0 + h; y++) for (let x = Math.max(0, Math.floor(x0)); x < Math.min(W, x0 + w); x++) if (isRes(x, y)) return true;
      return false;
    };
    // the turret stands from the wave file stay clear
    const padsHere = stage.waves.filter((w) => w.type === 'turret').map((w) => [w.x, anchor + V * w.t + 10]).filter(([, u]) => u > n0 - 14 && u < n1 + 14);
    for (const [x, u] of padsHere) reserveRect(x - 13, Y(u) - 13, 26, 26);
    const LIME = [0x8a8470, 0xa8a28a, 0xc6c0a6, 0xe0dac4];
    const PAVE = [0x8e8676, 0xa69e8c, 0xbcb4a0, 0xd0c8b4];
    const GLAZE = [0x2a4a8a, 0x3a6a3a, 0x7a4a26, 0x4a3226, 0xe8e0cc, 0xa8542a, 0x2a7a8a];
    const SKIN = [0xe8c8a8, 0xd8b090, 0xc89a78];
    const CLOTHES = [0xd04040, 0x3a6ad0, 0xe8c040, 0xe8e8f0, 0x6a9a5a, 0xf0a0b0, 0x3a3a4a, 0x2a8ac8, 0xe86a2a];
    /** People seen from above: a head and shoulders, a shadow. */
    const people = (x0, y0, w, h, n, any = false) => {
      for (let i = 0; i < n; i++) {
        const x = Math.round(x0 + nr() * w);
        const y = Math.round(y0 + nr() * h);
        if (!any && isRes(x, y)) continue;
        img.set(x + 1, y + 1, 0x1e1e26, 0.45);
        img.set(x, y, pick(CLOTHES));
        img.set(x, y - 1, nr() < 0.8 ? 0x2a2026 : 0xd8d0c8);
      }
    };
    /** Ishidatami: courses of fitted limestone slabs, each a shade of its own, with dark joints. */
    const pavePx = (x, y) => {
      const yy = y + Math.round(fbm(x, 0, { seed: 501, scale: 9 }) * 2);
      const row = Math.floor(yy / 4);
      const col = Math.floor((x + row * 5 + (row % 3) * 2) / 7);
      if (yy % 4 === 0 || (x + row * 5 + (row % 3) * 2) % 7 === 0) return 0x6e685a;
      return rampColor(PAVE, 0.32 + ((row * 13 + col * 7) % 5) * 0.09 + fbm(x, y, { seed: 503, scale: 2 }) * 0.12, x, y);
    };
    /** A pot, a jar or a stack of plates set out for sale. */
    const pot = (x, y, size = nr() < 0.25 ? 2 : 1) => {
      const c = pick(GLAZE);
      img.set(x + 1, y + 1, 0x1e1a16, 0.4);
      if (size === 2) {
        img.rect(x - 1, y - 1, 3, 3, c);
        img.set(x - 1, y - 1, scaleColor(c, 1.35));
        img.set(x, y - 1, 0x1e1a16); // the mouth of a jar
        img.set(x + 1, y + 1, scaleColor(c, 0.7));
      } else {
        img.rect(x, y, 2, 2, c);
        img.set(x, y, scaleColor(c, 1.4));
      }
    };
    /** A shisa on its gatepost: one of each pair has its mouth open (to let good luck in), one closed. */
    const shisa = (x, y, open) => {
      img.rect(x, y + 1, 3, 2, C.stone[2]);
      img.rect(x, y - 1, 3, 2, 0xc8642e);
      img.set(x + (open ? 2 : 0), y - 1, 0x8a3a1a);
      img.set(x + 1, y - 2, 0xa84a22);
      if (open) img.set(x + 1, y, 0x3a1a10);
    };

    // ---- the ground: a grassy limestone hillside, the potters' quarter, then the city
    for (let u = n0; u < n1; u++) {
      const y = Y(u);
      for (let x = 0; x < W; x++) {
        if (K(x, y) !== 2) continue;
        let c;
        if (u < TOMBS[1]) {
          const n = fbm(x, y, { seed: 511, scale: 7, octaves: 3 });
          c = n > 0.66 ? rampColor(LIME, 0.3 + (n - 0.66) * 2 + fbm(x, y, { seed: 512, scale: 2 }) * 0.3, x, y) : rampColor(C.grass, 0.2 + n * 0.8, x, y);
        } else if (u < TSUBOYA[1]) c = rampColor(C.lane, 0.25 + fbm(x, y, { seed: 513, scale: 4 }) * 0.6, x, y);
        else c = rampColor([0x6a6862, 0x7a7872, 0x8a8880], 0.3 + fbm(x, y, { seed: 514, scale: 3 }) * 0.5, x, y);
        img.set(x, y, c);
      }
    }
    // a farm road and a coral wall where the fields end
    for (let u = n0; u < n0 + 6; u++) for (let x = 0; x < W; x++) if (K(x, Y(u)) === 2) img.set(x, Y(u), rampColor(C.lane, 0.4 + fbm(x, u, { seed: 515, scale: 3 }) * 0.4, x, Y(u)));
    wall([[0, Y(n0 + 7)], [W, Y(n0 + 7)]], 2);

    // ---- 1. the hillside of turtle-back tombs (kamekōbaka)
    /**
     * A turtle-back tomb facing down the slope: the shell (a low dome of stone courses over the family vault,
     * the turtle's back) behind a facade of cut stone with the sealed door, and the two wing walls curving
     * out round a paved forecourt. by = strip y of the forecourt's front edge. Old ones are dark and lichened.
     */
    const tomb = (cx, by, w, opt = {}) => {
      const st = opt.old ? [0x55524a, 0x726e62, 0x928c7e, 0xb0aa98] : [0x948e80, 0xb4ae9e, 0xd0caba, 0xe6e0d0];
      const rx = Math.round(w * 0.42);
      const ry = Math.max(5, Math.round(rx * 0.55));
      const fy = by - 11; // bottom row of the facade
      const ftop = fy - 5; // its top row, where the shell sits
      const seed = Math.floor(nr() * 1000);
      const fam = opt.shiimi ? Array.from({ length: 7 }, () => [pick(CLOTHES), pick(SKIN), nr()]) : null;
      objects.push({
        y: by,
        shadow: () => {
          shadowRect(cx - rx + 4, ftop - ry + 3, rx * 2 + 3, ry + 4, 0.6);
          shadowRect(cx + rx + 2, ftop + 1, 4, by - ftop, 0.6);
        },
        draw: () => {
          // the forecourt between the wing walls, widening to the front, laid with flat stones
          for (let yy = fy + 1; yy <= by; yy++) {
            const t = (yy - fy) / (by - fy);
            const hw = rx + 1 + Math.pow(t, 0.6) * (w / 2 - rx - 1);
            for (let xx = Math.round(cx - hw) + 2; xx < cx + hw - 1; xx++) {
              const joint = (yy - fy) % 4 === 0 || (xx + ((yy - fy) >> 2) * 3) % 6 === 0;
              img.set(xx, yy, joint ? st[1] : rampColor(st, 0.42 + fbm(xx, yy, { seed: 520 + seed, scale: 2 }) * 0.3, xx, yy));
            }
            for (const s of [-1, 1]) {
              const ex = Math.round(cx + s * hw);
              img.set(ex, yy, st[3]);
              img.set(ex + s, yy, st[2]);
              img.set(ex + 2 * s, yy, st[0]);
            }
          }
          for (const s of [-1, 1]) img.rect(Math.round(cx + s * (w / 2)) - (s > 0 ? 2 : 0), by - 1, 3, 2, st[3]); // the posts at their ends
          // the facade: courses of cut stone, the door sealed with a slab under its lintel
          for (let yy = ftop; yy <= fy; yy++)
            for (let xx = cx - rx - 2; xx <= cx + rx + 2; xx++) {
              const r = yy - ftop;
              const joint = r === 3 || (xx + (r > 3 ? 3 : 0)) % 6 === 0;
              img.set(xx, yy, r === 0 ? st[3] : joint ? st[1] : xx === cx + rx + 2 ? st[1] : st[2]);
            }
          img.rect(cx - 3, fy - 4, 7, 1, st[3]);
          img.rect(cx - 2, fy - 3, 5, 4, st[0]);
          img.rect(cx - 1, fy - 2, 3, 3, st[1]);
          // the shell: a low dome of stone courses, lit from the top left, spotted with lichen
          for (let yy = ftop - ry; yy < ftop; yy++)
            for (let xx = cx - rx; xx <= cx + rx; xx++) {
              const nx = (xx + 0.5 - cx) / rx;
              const ny = (yy + 0.5 - ftop) / ry;
              const d = nx * nx + ny * ny;
              if (d > 1) continue;
              const rd = Math.sqrt(d);
              let v = 0.5 - nx * 0.3 - ny * 0.15 + Math.sqrt(1 - d) * 0.25 + (fbm(xx, yy, { seed: 530 + seed, scale: 3 }) - 0.5) * 0.25;
              if (Math.abs(rd - 0.42) < 0.07 || Math.abs(rd - 0.76) < 0.06) v -= 0.2; // the courses
              let c = rampColor(st, v, xx, yy);
              if (fbm(xx, yy, { seed: 540 + seed, scale: 2 }) > (opt.old ? 0.64 : 0.78)) c = opt.old ? 0x4a5636 : 0x8a9478;
              if ((xx * 7 + seed) % 13 === 0 && ny > -0.5) c = scaleColor(c, 0.85); // rain streaks
              img.set(xx, yy, c);
            }
          if (opt.flowers || opt.shiimi) {
            // chrysanthemums in vases at the corners of the forecourt, the incense burner before the door
            for (const s of [-1, 1]) {
              const vx = Math.round(cx + s * (rx - 2));
              img.set(vx, fy + 3, st[0]);
              img.set(vx, fy + 2, 0xf0e8b8);
              img.set(vx + s, fy + 2, 0x3a7a2a);
            }
            img.rect(cx - 1, fy + 2, 3, 2, 0x4a3a2a);
            img.set(cx, fy + 2, 0x9a8a78);
          }
          if (fam) {
            // Shīmī: the family picnicking on a mat in the forecourt, lacquered boxes of food between them
            const my = fy + 5;
            for (let yy = my; yy < my + 5; yy++) for (let xx = cx - 8; xx < cx + 8; xx++) img.set(xx, yy, ((xx >> 1) + (yy >> 1)) % 2 ? 0xc83a3a : 0x3a5aa8);
            for (const [bx, by2] of [[cx - 5, my + 1], [cx - 1, my + 1], [cx + 3, my + 1]]) {
              img.rect(bx, by2, 3, 3, 0x1a1214);
              img.set(bx + 1, by2 + 1, pick([0xe8c040, 0xe86a2a, 0x5ab040, 0xf0e8e0]));
              img.set(bx, by2, 0xb8302a);
            }
            fam.forEach(([cloth, skin, r], i) => {
              const a = (i / fam.length) * Math.PI * 2 + r * 0.4;
              const px = Math.round(cx + Math.cos(a) * 10);
              const py = Math.round(my + 2 + Math.sin(a) * 4);
              img.set(px + 1, py + 1, 0x1e1e26, 0.4);
              img.set(px, py, cloth);
              img.set(px, py - 1, i % 3 ? 0x2a2026 : skin);
            });
          }
        },
      });
      reserveRect(cx - w / 2 - 3, ftop - ry - 2, w + 7, by - (ftop - ry) + 4);
    };
    // a stone path zigzagging up the hill between the terraces
    const stair = (u) => 66 + 7 * Math.sin((u - n0) / 16);
    for (let u = n0 + 8; u < TOMBS[1] + 2; u++) {
      const c = stair(u);
      for (let x = Math.floor(c - 2); x <= c + 2; x++) img.set(x, Y(u), u % 4 === 0 ? LIME[0] : Math.abs(x + 0.5 - c) > 1.6 ? LIME[1] : LIME[2]);
      reserveRect(c - 3, Y(u), 6, 1);
    }
    // two terraces of tombs, a retaining wall below each
    for (const [tu, list] of [
      [2604, [[28, 34, { old: true }], [112, 30, { flowers: true }], [158, 32, { shiimi: true }]]],
      [2658, [[34, 30, { flowers: true }], [100, 36, { old: true }], [150, 28, {}]]],
    ]) {
      wall([[0, Y(tu - 3)], [56, Y(tu - 3)]], 2);
      wall([[76, Y(tu - 3)], [W, Y(tu - 3)]], 2);
      for (const [x, w, opt] of list) if (!anyRes(x - w / 2, Y(tu) - 26, w, 26)) tomb(x, Y(tu), w, opt);
    }
    // cycads, banyans and hibiscus on the slope (the rest is filled by the vegetation pass)
    for (let k = 0; k < 26; k++) {
      const x = 4 + nr() * 172;
      const u = n0 + 12 + nr() * (TOMBS[1] - n0 - 16);
      if (anyRes(x - 4, Y(u) - 4, 8, 8)) continue;
      const kind = nr() < 0.4 ? 'palm' : nr() < 0.5 ? 'hibiscus' : 'tropic';
      tree(kind, x, Y(u), kind === 'palm' ? 3.5 : kind === 'hibiscus' ? 3 : 6 + nr() * 3, nr);
    }

    // ---- 2. Tsuboya: the potters' lane (Yachimun-dōri) and the old climbing kiln
    const lane = (u) => 96 + 8 * Math.sin((u - TSUBOYA[0]) / 40);
    for (let u = TSUBOYA[0] - 2; u < TSUBOYA[1] + 6; u++) {
      const c = lane(u);
      for (let x = Math.floor(c - 7); x <= c + 7; x++) img.set(x, Y(u), Math.abs(x + 0.5 - c) > 6.2 ? 0x7a7466 : pavePx(x, Y(u)));
      reserveRect(c - 8, Y(u), 16, 1);
    }
    // where the turret stands, the lane opens into a little paved square
    for (const [px, pu] of padsHere)
      if (pu > TSUBOYA[0] && pu < TSUBOYA[1])
        for (let y = Y(pu) - 15; y <= Y(pu) + 15; y++) for (let x = px - 15; x <= px + 15; x++) if (Math.hypot(x + 0.5 - px, y + 0.5 - Y(pu)) < 15) img.set(x, y, pavePx(x, y));
    // the old climbing kiln up the slope west of the lane: a sandy work yard, the vaulted chambers stepping
    // up the hill one above another with a stoking port in each side, the shelter's posts, the firebox at
    // the bottom and the flue at the top; firewood stacked beside it, unfired pots drying on boards
    {
      const kx = 32;
      const ku0 = 2790;
      const n = 7;
      const step = 8;
      for (let u = ku0 - 18; u < ku0 + n * step + 10; u++)
        for (let x = 2; x < 76; x++) {
          const e = ((x - 38) / 37) ** 2 + ((u - (ku0 + (n * step) / 2 - 4)) / ((n * step + 28) / 2)) ** 2 + (fbm(x, u, { seed: 523, scale: 6 }) - 0.5) * 0.3;
          if (e < 1 && !isRes(x, Y(u))) img.set(x, Y(u), rampColor(C.lane, 0.15 + fbm(x, u, { seed: 524, scale: 3 }) * 0.5 - (e > 0.85 ? 0.1 : 0), x, Y(u)));
        }
      const BRICK = [0x5a3020, 0x7a4228, 0x9a5634, 0xb46c42];
      objects.push({
        y: Y(ku0 - 8),
        shadow: () => shadowRect(kx - 8, Y(ku0 + n * step) - 2, 24, n * step + 6, 0.6),
        draw: () => {
          for (let k = n - 1; k >= 0; k--) {
            const cy = Y(ku0 + k * step);
            for (let yy = cy - 5; yy <= cy + 4; yy++)
              for (let xx = kx - 11; xx <= kx + 11; xx++) {
                const nx = (xx + 0.5 - kx) / 11;
                const ny = (yy + 0.5 - cy) / 5;
                if (nx * nx + ny * ny > 1) continue;
                const brick = yy % 2 === 0 || (xx + ((yy >> 1) % 2) * 2) % 4 === 0;
                const c = rampColor(BRICK, 0.62 - nx * 0.3 - ny * 0.32, xx, yy);
                img.set(xx, yy, brick ? scaleColor(c, 0.84) : c);
              }
            img.rect(kx - 1, cy + 3, 3, 1, BRICK[0]); // the step down to the chamber below
            for (const s of [-1, 1]) {
              img.rect(kx + s * 10 - (s > 0 ? 1 : 0), cy - 1, 2, 2, 0x140c0a); // stoking ports
              img.set(kx + s * 10, cy - 2, BRICK[3]);
            }
            if (k % 2 === 0) for (const s of [-1, 1]) img.rect(kx + s * 14 - (s > 0 ? 1 : 0), cy - 4, 2, 6, 0x4a3424); // the shelter's posts
          }
          // the firebox: an arched mouth black with soot, ash raked out in front
          const fyy = Y(ku0 - 7);
          img.rect(kx - 6, fyy - 3, 13, 6, BRICK[1]);
          img.rect(kx - 6, fyy - 3, 13, 1, BRICK[3]);
          img.rect(kx - 2, fyy - 1, 5, 4, 0x120c0a);
          img.set(kx - 2, fyy - 1, BRICK[1]);
          img.set(kx + 2, fyy - 1, BRICK[1]);
          for (let i = -5; i < 6; i++) if ((i + 7) % 3) img.set(kx + i, fyy + 4, 0x8a8478);
          // the flue
          const ty = Y(ku0 + n * step) - 3;
          img.rect(kx - 3, ty - 5, 7, 6, BRICK[0]);
          img.rect(kx - 3, ty - 5, 7, 1, BRICK[3]);
          img.rect(kx - 1, ty - 4, 3, 2, 0x120c0a);
          // stacks of firewood: rows of log ends
          for (const [wx, wu] of [[4, 2800], [4, 2822]])
            for (let j = 0; j < 3; j++)
              for (let i = 0; i < 10 - j * 2; i++) {
                img.set(wx + i + j, Y(wu + j * 2), (i + j) % 2 ? 0xa87a4a : 0x8a5a32);
                img.set(wx + i + j, Y(wu + j * 2) + 1, 0x5a3a22);
              }
          // boards of unfired pots drying in the sun
          for (const bu of [2808, 2820, 2832])
            for (let i = 0; i < 18; i++) {
              img.set(52 + i, Y(bu), 0x8a6a4a);
              img.set(52 + i, Y(bu) + 1, 0x5a4432);
              if (i % 3 === 1) {
                img.rect(52 + i, Y(bu) - 2, 2, 2, 0xd8c8a8);
                img.set(52 + i, Y(bu) - 2, 0xece0c4);
              }
            }
        },
      });
      reserveRect(2, Y(ku0 + n * step + 8), 72, n * step + 30);
      house(50, Y(2796), 22, 12, { faceH: 4 }); // the potter's workshop
      tree('banana', 66, Y(2844), 4, nr);
      tree('tropic', 10, Y(2850), 6, nr);
    }
    // workshops, galleries and shops either side of the lane: red-tile houses behind coral walls with a
    // shisa on each gatepost, small white galleries with pottery on the shelves behind their windows, pots
    // and jars set out in the yards; noren flutter in the doorways (live)
    const noren = [0, 1].map((f) => {
      const r = new Raster(4, 3);
      for (let i = 0; i < 4; i++) {
        r.set(i, 0, 0x2a3a6a);
        r.set(i, 1, i === 1 || i === 2 ? 0xf0ece0 : 0x2a3a6a);
        if (!f || i % 2) r.set(i, 2, 0x22305a);
      }
      return gradeF(r);
    });
    const gallery = (x, y, w, h) => {
      const shelf = Array.from({ length: w * 2 }, () => pick(GLAZE));
      objects.push({
        y: y + h + 5,
        shadow: () => shadowRect(x + 3, y + 3, w, h + 5, 0.5),
        draw: () => {
          img.rect(x, y, w, h, 0xe8e6de);
          img.rect(x, y, w, 1, 0xf6f4ee);
          img.rect(x + w - 1, y, 1, h, 0xb8b6ae);
          img.rect(x + 3, y + 3, Math.min(6, w - 6), 3, 0xa8c8d8); // a skylight
          const fy = y + h;
          img.rect(x, fy, w, 5, 0xdedcd4);
          img.rect(x, fy, w, 1, 0x8a887f);
          img.rect(x + 2, fy + 1, w - 4, 3, 0x4a5a66);
          for (let i = 0; i < w - 4; i++) if (i % 2 === 0) img.set(x + 2 + i, fy + 2, shelf[i]); // pots on the shelves
          img.rect(x + w - 5, fy - 2, 3, 2, 0x2a3a6a); // a hanging sign
        },
      });
      reserveRect(x - 1, y - 1, w + 2, h + 7);
    };
    for (const side of [-1, 1]) {
      let u = TSUBOYA[0] + 6;
      while (u < TSUBOYA[1] - 16) {
        const big = nr() < 0.65;
        const w = big ? 18 + Math.floor(nr() * 10) : 13 + Math.floor(nr() * 7);
        const h = big ? 12 + Math.floor(nr() * 4) : 9 + Math.floor(nr() * 3);
        const yard = 3 + Math.floor(nr() * 4);
        if (side < 0 && u + h + 6 > 2768) break; // the kiln's yard
        let edge = side < 0 ? Math.min(lane(u), lane(u + h + 4)) - 9 - yard : Math.max(lane(u), lane(u + h + 4)) + 9 + yard;
        for (const [px, pu] of padsHere) if (Math.abs(pu - (u + h / 2)) < h / 2 + 16) edge = side < 0 ? Math.min(edge, px - 16) : Math.max(edge, px + 16);
        const x = Math.round(side < 0 ? edge - w : edge);
        const y = Y(u + h + 4 + (big ? 0 : 1));
        if (x >= 0 && x + w <= W && !anyRes(x - 1, y - 1, w + 2, h + 7)) {
          if (big) {
            house(x, y, w, h, { faceH: 4 });
            if (nr() < 0.75) kit.loop(x + 3 + Math.floor(nr() * (w - 8)), u + 3, noren, { seq: [0, 0, 1, 0, 1, 1], fps: 2 });
          } else gallery(x, y, w, h);
          // the yard in front: pots and jars set out for sale, sometimes a shisa or two
          for (let i = 1; i < w - 2; i += 3) if (nr() < 0.65) pot(x + i, Y(u - 1));
          if (nr() < 0.4) shisa(x + w - 5, Y(u - 2), nr() < 0.5);
        }
        // the coral wall along the lane, with a gate and a shisa on each gatepost
        const gu = u + Math.floor(h / 2);
        for (let uu = u - 2; uu < u + h + 6; uu++) {
          if (Math.abs(uu - gu) < 3 || padsHere.some(([px, pu]) => Math.hypot(px - lane(uu), pu - uu) < 22)) continue;
          const wx = Math.round(side < 0 ? lane(uu) - 8 : lane(uu) + 8);
          img.set(wx, Y(uu), uu % 4 ? C.stone[3] : C.stone[1]);
          img.set(wx + side, Y(uu), C.stone[0]);
          img.tint(wx + side * 2, Y(uu) + 1, 0.7);
        }
        if (!padsHere.some(([px, pu]) => Math.hypot(px - lane(gu), pu - gu) < 22)) {
          const wx = Math.round(side < 0 ? lane(gu) - 9 : lane(gu) + 7);
          shisa(wx, Y(gu + 3), side > 0);
          shisa(wx, Y(gu - 3) + 2, side < 0);
        }
        u += h + 9 + Math.floor(nr() * 4);
      }
    }
    // pots and jars along the edges of the paving, a few people browsing, banyans with hanging roots
    for (let u = TSUBOYA[0] + 4; u < TSUBOYA[1] - 2; u += 5) {
      const c = lane(u);
      if (padsHere.some(([px, pu]) => Math.hypot(px - c, pu - u) < 18)) continue;
      if (nr() < 0.55) pot(Math.round(c - 6), Y(u));
      if (nr() < 0.55) pot(Math.round(c + 4), Y(u + 2));
    }
    for (let k = 0; k < 12; k++) {
      const u = TSUBOYA[0] + 6 + nr() * (TSUBOYA[1] - TSUBOYA[0] - 12);
      people(Math.round(lane(u) - 3), Y(u), 6, 1, 1, true);
    }
    for (const [x, u] of [[156, 2730], [140, 2846], [30, 2722]]) if (!anyRes(x - 6, Y(u) - 6, 12, 12)) tree('tropic', x, Y(u), 10, nr);
    // cats asleep on the warm paving or padding about the lane (live)
    for (const [fur, patch] of [[0xf0ece4, 0xe08a3a], [0x8a8478, 0x5a564e], [0x2a2622, 0xf0ece4]]) {
      const cat = (f) => {
        const r = new Raster(4, 3);
        r.rect(0, 1, 3, 1, fur);
        r.set(1, 1, patch);
        r.set(3, f ? 0 : 1, fur); // the head
        r.set(0, f ? 0 : 2, patch); // the tail
        r.set(1, 2, 0x1e1a16, 0.35);
        return gradeF(r);
      };
      kit.wander(lane(2800), 2800, 4, 54, [cat(0), cat(1)], { n: 1, sp: 4, idle: 0.6, turn: 'flip', fps: 4 });
    }

    /**
     * A city building on Okinawa: a flat concrete roof with its black and steel water tanks, units and
     * sometimes a billboard or a strip of red tiles along the eaves; below, floors of windows over the shop,
     * its sign and its front: kariyushi shirts on racks, sanshin on the wall, trays of sata andagi, a
     * restaurant's noren and red lanterns, or plain glass.
     */
    const shop = (x, y, w, h, faceH, opt = {}) => {
      const kind = opt.kind ?? pick(['city', 'city', 'souvenir', 'restaurant', 'souvenir', 'andagi']);
      const wallC = pick([0xece6d6, 0xe8dcc0, 0xd8e8d8, 0xf0e0c8, 0xd8dce8, 0xe8d0c8, 0xf4f0e4]);
      const roofC = pick([0xd0cec6, 0xc4c2ba, 0xdcd6c8, 0xbcc0c4]);
      const sign = pick([0xd8302a, 0x2a6ac8, 0xe8a020, 0x2a9a5a, 0xc83a8a, 0x1a1a22, 0xe86a2a]);
      const awn = pick([0xc83a2a, 0x2a6a3a, 0x2a4a8a, 0xd8a020, 0x8a2a5a]);
      const tanks = Array.from({ length: 1 + Math.floor(nr() * 3) }, () => nr() < 0.6);
      const eave = nr() < 0.3;
      const board = !eave && w >= 18 && nr() < 0.45 ? [pick([0xd8302a, 0x2a6ac8, 0xe8c030, 0x2a9a5a]), nr()] : null;
      const vertical = faceH >= 12 && nr() < 0.5 ? pick([0xd8302a, 0xe8c030, 0x2a6ac8]) : null;
      const goods = Array.from({ length: 40 }, () => pick([0xe86a9a, 0xf0d040, 0x3ab0e0, 0xe84a3a, 0x6ac06a, 0xf0ece0]));
      const lit = Array.from({ length: 60 }, () => nr() < 0.3);
      const guard = nr() < 0.3;
      objects.push({
        y: y + h + faceH,
        shadow: () => shadowRect(x + 4, y + 4, w, h + faceH, 0.5),
        draw: () => {
          // the roof
          img.rect(x, y, w, h, roofC);
          img.rect(x, y, w, 1, scaleColor(roofC, 1.12));
          img.rect(x, y, 1, h, scaleColor(roofC, 1.08));
          img.rect(x + w - 1, y, 1, h, scaleColor(roofC, 0.78));
          img.rect(x, y + h - 1, w, 1, scaleColor(roofC, 0.72));
          tanks.forEach((black, i) => {
            const tx = x + 3 + i * 5;
            if (tx > x + w - 5) return;
            img.disc(tx + 1.5, y + 3.5, 2, black ? 0x1e1e24 : 0xc8ccd0);
            img.set(tx + 1, y + 2, black ? 0x5a5a66 : 0xf0f2f4);
            img.set(tx + 2, y + 5, black ? 0x101014 : 0x8a8e94);
          });
          if (w > 18) for (let k = 0; k < 2; k++) {
            img.rect(x + w - 8, y + h - 8 + k * 3, 5, 2, 0xb8bcc0);
            img.set(x + w - 7, y + h - 8 + k * 3, 0x6a6e74);
          }
          if (board) {
            // a billboard on its frame along the back of the roof
            const bw = w - 6;
            img.rect(x + 3, y + 1, bw, 3, board[0]);
            for (let i = 1; i < bw - 1; i++) if ((i * 7 + Math.floor(board[1] * 9)) % 3) img.set(x + 3 + i, y + 2, 0xf8f4e8);
            img.rect(x + 4, y + 4, 1, 1, 0x4a4a52);
            img.rect(x + bw + 1, y + 4, 1, 1, 0x4a4a52);
          }
          if (eave) {
            // a strip of red tiles along the eaves, Ryūkyū style
            for (let yy = y + h - 3; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) img.set(xx, yy, (xx - x) % 3 === 2 ? C.roof[3] : yy === y + h - 3 ? C.roof[2] : C.roof[1]);
            img.rect(x, y + h - 4, w, 1, C.mortar);
          }
          // the front: floors of windows over the shop
          const fy = y + h;
          for (let yy = fy; yy < fy + faceH; yy++)
            for (let xx = x; xx < x + w; xx++) {
              const r = yy - fy;
              let c = wallC;
              if (r === 0) c = scaleColor(wallC, 0.6);
              else if (r % 3 === 2 && r < faceH - 6 && (xx - x) % 4 !== 0 && xx > x && xx < x + w - 1) c = lit[(r * 7 + xx - x) % 60] ? 0xe8e0b0 : 0x3a4a5a;
              if (xx === x + w - 1) c = scaleColor(c, 0.78);
              img.set(xx, yy, c);
            }
          const sy = fy + faceH - 6;
          img.rect(x + 1, sy, w - 2, 2, sign);
          for (let xx = x + 2; xx < x + w - 2; xx++) if ((xx * 5 + fy) % 3) img.set(xx, sy + ((xx >> 1) % 2), 0xf8f4e8);
          if (vertical) {
            img.rect(x + w - 3, fy + 1, 2, faceH - 7, vertical);
            for (let yy = fy + 2; yy < fy + faceH - 7; yy += 2) img.set(x + w - 3, yy, 0xf8f4e8);
          }
          // the shop front itself
          const gy = fy + faceH - 4;
          for (let xx = x + 1; xx < x + w - 1; xx++) for (let yy = gy; yy < gy + 4; yy++) img.set(xx, yy, 0x3a3a40);
          if (kind === 'souvenir') {
            for (let xx = x + 2, i = 0; xx < x + w - 2; xx += 2, i++) {
              img.set(xx, gy + 1, goods[i % 40]);
              img.set(xx, gy + 2, goods[(i + 7) % 40]);
            }
          } else if (kind === 'sanshin') {
            img.rect(x + 1, gy, w - 2, 4, 0x5a3a24);
            for (let xx = x + 2; xx < x + w - 2; xx += 3) {
              img.set(xx, gy, 0x1a1214); // the neck
              img.rect(xx, gy + 1, 2, 2, 0x1a1214); // the body
              img.set(xx + 1, gy + 1, 0xf0ece0); // its snakeskin
            }
          } else if (kind === 'andagi') {
            for (let xx = x + 2; xx < x + w - 2; xx++) img.set(xx, gy + 2, 0xc8c4bc);
            for (let xx = x + 2; xx < x + w - 2; xx += 2) img.set(xx, gy + 1, (xx >> 1) % 3 ? 0xb87a3a : 0x8a5a2a);
          } else if (kind === 'restaurant') {
            for (let xx = x + 2; xx < x + w - 2; xx++) img.set(xx, gy, (xx - x) % 4 === 0 ? 0x22305a : 0x2a3a6a);
            img.set(x + 2, gy + 1, 0xd8302a);
            img.set(x + w - 3, gy + 1, 0xd8302a);
          } else for (let xx = x + 2; xx < x + w - 2; xx++) img.set(xx, gy + 1, (xx + gy) % 3 ? 0x5a7a8a : 0x8aaab8);
          for (let xx = x + 1; xx < x + w - 1; xx++) {
            img.set(xx, gy + 3, (xx >> 1) % 2 ? awn : 0xf0ece0);
          }
          if (guard) {
            // a pair of shisa guarding the door
            for (const sx of [x + 1, x + w - 3]) {
              img.rect(sx, gy + 4, 2, 2, 0xc8642e);
              img.set(sx + (sx > x + 1 ? 1 : 0), gy + 4, 0x8a3a1a);
            }
          }
        },
      });
      reserveRect(x - 1, y - 1, w + 2, h + faceH + 3);
    };

    // ---- 3. the Makishi public market and the Heiwa-dōri arcade
    // the lane bends into the arcade; a small square where the turret stands
    for (let u = TSUBOYA[1] - 6; u < MARKET[0] + 8; u++)
      for (let x = 78; x < 104; x++) img.set(x, Y(u), pavePx(x, Y(u)));
    reserveRect(78, Y(MARKET[0] + 8), 26, 14);
    const AX = [87, 104]; // the arcade's lane
    for (let u = MARKET[0] + 6; u < MARKET[1]; u++) for (let x = AX[0]; x < AX[1]; x++) img.set(x, Y(u), (x + u) % 5 ? 0x8c8a84 : 0x7c7a74);
    // shops opening onto the arcade: colourful goods on both sides, people everywhere
    const goods = [
      () => [0xe86a9a, 0xf0d040, 0x3ab0e0, 0xe84a3a, 0x6ac06a], // kariyushi shirts
      () => [0xe8c040, 0xd8a030, 0xf0e0a0], // chinsukō and sata andagi
      () => [0x1a1a1e, 0xf0ece0, 0x8a5a2a], // sanshin
      () => [0x7a3a8a, 0xa85ab0, 0xe8d0f0], // beni-imo sweets
      () => [0x2a6aa8, 0x3ab0c8, 0xe8f0f0], // Ryūkyū glass
    ];
    for (let u = MARKET[0] + 10; u < MARKET[1] - 6; u += 9)
      for (const x of [AX[0] - 6, AX[1] + 1]) {
        if (isRes(x, Y(u + 4))) continue;
        const cols = pick(goods)();
        img.rect(x, Y(u + 8), 5, 8, 0x4a4440);
        for (let j = 0; j < 7; j += 2) for (let i = 0; i < 5; i += 2) img.set(x + i, Y(u + 7) + j, pick(cols));
      }
    people(AX[0] + 1, Y(MARKET[1] - 4), AX[1] - AX[0] - 2, MARKET[1] - MARKET[0] - 12, 70, true);
    // the arcade's roof: translucent panels on ribs, so the shoppers show through (live, above the wanderers)
    {
      const ry0 = Y(MARKET[1] - 2);
      const roof = new Window(AX[0] - 5, ry0, AX[1] - AX[0] + 10, MARKET[1] - MARKET[0] - 6);
      for (let y = roof.y0; y < roof.y0 + roof.h; y++)
        for (let x = roof.x0; x < roof.x0 + roof.w; x++) {
          const edge = x === roof.x0 || x === roof.x0 + roof.w - 1;
          const rib = (y - roof.y0) % 8 === 0;
          const ridge = x === Math.round((AX[0] + AX[1]) / 2);
          roof.set(x, y, edge ? 0x9aa4ac : rib || ridge ? 0xd8e0e4 : 0xc8dce4, edge || rib ? 0.9 : ridge ? 0.6 : 0.3);
        }
      kit.loop(roof.x0, U(roof.y0), [gradeF(roof)], { d: 0.1 });
      reserveRect(AX[0] - 6, ry0, AX[1] - AX[0] + 12, roof.h + 2);
      const shopper = (c, f) => {
        const r = new Raster(2, 4);
        r.set(0, 0, 0x2a2026);
        r.set(0, 1, c);
        r.set(0, 2, f ? scaleColor(c, 0.8) : c);
        r.set(1, 3, 0x1e1e26, 0.4);
        return gradeF(r);
      };
      for (const c of [0xd04040, 0x3a6ad0, 0xe8c040, 0xe8e8f0])
        kit.wander((AX[0] + AX[1]) / 2, (MARKET[0] + MARKET[1]) / 2, 5, 52, [shopper(c, 0), shopper(c, 1)], { n: 2, sp: 6, idle: 0.6, turn: 'flip', fps: 3 });
    }
    // the market hall east of the arcade: stalls of tropical fish on ice, lobsters, giant clams and sea
    // grapes, fruit and vegetables round the edge, all under a glass roof (live, over the stalls)
    {
      const hx0 = 113;
      const hx1 = 176;
      const hu0 = MARKET[0] + 14;
      const hu1 = MARKET[1] - 8;
      for (let u = hu0; u < hu1; u++) for (let x = hx0; x < hx1; x++) img.set(x, Y(u), (x + u) % 6 ? 0x9a968e : 0x8a8680);
      const FISH = [
        [0x2a7ad8, 0x5ab8e8], // irabuchā, the blue parrotfish
        [0xe03a3a, 0xf06a5a], // akamachi, the red snapper
        [0x3a7ac8, 0xf0d040], // gurukun, yellow-striped
        [0xc84a4a, 0xe8a0a0], // tuna, cut
        [0x6a9a4a, 0x9ac060], // a green wrasse
      ];
      const stall = (x, y, w, kind) => {
        img.rect(x, y, w, 7, 0x3a5a9a); // the counter
        img.rect(x, y + 6, w, 1, 0x24386a);
        img.rect(x + 1, y + 1, w - 2, 4, kind === 'fish' ? 0xdfeaf0 : 0x6a4a2a);
        for (let i = x + 1; i < x + w - 2; i += 3)
          for (const j of [y + 1, y + 3]) {
            if (kind === 'fish') {
              const [a, b] = pick(FISH);
              img.rect(i, j, 2, 1, a);
              img.set(i + 2, j, b);
              if (nr() < 0.2) {
                img.rect(i, j, 3, 2, 0xd84a2a); // a lobster
                img.set(i + 2, j - 1, 0xd84a2a);
              } else if (nr() < 0.15) {
                img.rect(i, j, 2, 2, 0xf0ece0); // a giant clam, its blue mantle
                img.set(i, j, 0x3aa0c8);
              } else if (nr() < 0.15) img.rect(i, j, 2, 2, 0x5ab040); // sea grapes
            } else {
              const fruit = pick([[0xe8c030, 0x3a7a2a], [0xf08a2a, 0xe86a2a], [0xd8307a, 0x6ac04a], [0x5aa03a, 0x3a8a2a], [0x7a3a8a, 0x5a2a6a]]);
              img.rect(i, j, 2, 2, fruit[0]);
              img.set(i, j, fruit[1]);
            }
          }
        img.set(x + 1, y + 5, 0xf0f0f0); // price tags
        img.set(x + w - 3, y + 5, 0xf0f0f0);
        people(x + 1, y - 1, w - 2, 1, Math.floor(w / 4), true); // the stallholders behind the counter
      };
      people(hx0 + 2, Y(hu1 - 2), hx1 - hx0 - 4, hu1 - hu0 - 4, 70, true); // shoppers in the aisles
      for (let u = hu0 + 6, row = 0; u < hu1 - 8; u += 16, row++)
        for (let x = hx0 + 3; x < hx1 - 14; x += 21) stall(x, Y(u + 8), 18, x > hx1 - 30 || row === 0 ? 'fruit' : 'fish');
      const roof = new Window(hx0 - 2, Y(hu1 + 2), hx1 - hx0 + 4, hu1 - hu0 + 6);
      for (let y = roof.y0; y < roof.y0 + roof.h; y++)
        for (let x = roof.x0; x < roof.x0 + roof.w; x++) {
          const edge = x - roof.x0 < 2 || roof.x0 + roof.w - 1 - x < 2 || y - roof.y0 < 2 || roof.y0 + roof.h - 1 - y < 2;
          const frame = (x - roof.x0) % 11 === 0 || (y - roof.y0) % 13 === 0;
          roof.set(x, y, edge ? (y - roof.y0 < 2 || x - roof.x0 < 2 ? 0xe8e6e0 : 0xa8a49c) : frame ? 0xc8ccd0 : 0xb8d8e4, edge ? 1 : frame ? 0.85 : 0.22);
        }
      kit.loop(roof.x0, U(roof.y0), [gradeF(roof)], { d: 0.1 });
      reserveRect(hx0 - 3, roof.y0 - 1, hx1 - hx0 + 6, roof.h + 2);
      img.rect(hx0 + 26, Y(hu0 - 1), 14, 4, 0xc8302a); // the entrance with its red awning
      img.rect(hx0 + 26, Y(hu0 - 1), 14, 1, 0xe85a4a);
    }
    // west of the arcade: souvenir shops, a sanshin maker, a sata andagi stall, palms on the little square
    for (const [x, u, w, kind] of [[4, 2872, 28, 'souvenir'], [34, 2872, 24, 'sanshin'], [4, 2914, 24, 'andagi'], [30, 2914, 26, 'souvenir'], [4, 2954, 26, 'restaurant']])
      if (!anyRes(x, Y(u + 24), w, 24)) shop(x, Y(u + 22), w, 11, 10, { kind });
    people(4, Y(MARKET[1] - 2), 60, MARKET[1] - MARKET[0] - 6, 26);
    for (const [x, u] of [[66, 2880], [66, 2932]]) tree('palm', x, Y(u), 5.5, nr);

    // ---- 4. Kokusai-dōri: the main street, closed for an eisa parade
    const RD = [76, 104]; // the road; pavements either side
    for (let u = KOKUSAI[0]; u < n1; u++) {
      const y = Y(u);
      for (let x = RD[0] - 8; x < RD[1] + 8; x++) {
        const road = x >= RD[0] && x < RD[1];
        img.set(x, y, road ? (x === 90 && u % 8 < 4 ? 0xe8e0c0 : rampColor(C.asphalt, fbm(x, y, { seed: 531, scale: 3 }), x, y)) : (x + u) % 4 ? 0xb8a890 : 0xa89880);
      }
      reserveRect(RD[0] - 9, y, RD[1] - RD[0] + 18, 1);
    }
    for (const cu of [KOKUSAI[0] + 6, 3094, n1 - 8])
      for (let u = cu - 5; u < cu + 5; u++)
        for (let x = 0; x < W; x++) {
          if (x >= RD[0] && x < RD[1]) continue;
          img.set(x, Y(u), Math.abs(u - cu) > 4 ? 0xa89880 : rampColor(C.asphalt, fbm(x, u, { seed: 532, scale: 3 }), x, Y(u)));
          reserved[Y(u) * W + x] = 1;
        }
    // a Ryūkyū-style restaurant: a big red-tile house round a courtyard garden with a stone lantern
    {
      const [x, u] = [6, 3104];
      for (let yy = Y(u + 40); yy < Y(u); yy++) for (let xx = x; xx < x + 60; xx++) img.set(xx, yy, rampColor(C.grass, 0.3 + fbm(xx, yy, { seed: 541, scale: 4 }) * 0.5, xx, yy));
      wall([[x, Y(u + 40)], [x + 60, Y(u + 40)], [x + 60, Y(u)], [x, Y(u)], [x, Y(u + 40)]], 2);
      house(x + 4, Y(u + 36), 36, 16, { faceH: 5 });
      house(x + 42, Y(u + 30), 14, 12, { faceH: 4 });
      for (const [sx, su] of [[x + 10, u + 10], [x + 30, u + 8]]) {
        img.rect(sx, Y(su), 3, 3, C.stone[1]);
        img.rect(sx - 1, Y(su) - 1, 5, 1, C.stone[3]);
      }
      tree('hibiscus', x + 48, Y(u + 8), 3.5, nr);
      tree('palm', x + 20, Y(u + 6), 4, nr);
      shisa(x + 26, Y(u + 1), false);
      shisa(x + 32, Y(u + 1), true);
      reserveRect(x - 1, Y(u + 41), 63, 43);
    }
    // an event square across the street: a little stage, a crowd watching a sanshin band
    {
      const [x, u] = [114, 3104];
      for (let yy = Y(u + 34); yy < Y(u); yy++) for (let xx = x; xx < x + 62; xx++) img.set(xx, yy, ((xx >> 2) + (yy >> 2)) % 2 ? 0xc8b8a0 : 0xb8a890);
      img.rect(x + 20, Y(u + 32), 22, 8, 0x5a3a24);
      img.rect(x + 20, Y(u + 32), 22, 1, 0x8a6a4a);
      for (let i = 0; i < 4; i++) {
        img.set(x + 24 + i * 5, Y(u + 29), 0xf0ece0);
        img.set(x + 24 + i * 5, Y(u + 30), 0x2a2026);
        img.set(x + 25 + i * 5, Y(u + 29), 0x1a1214); // the sanshin
      }
      people(x + 4, Y(u + 22), 54, 18, 70, true);
      tree('palm', x + 6, Y(u + 30), 4.5, nr);
      tree('palm', x + 56, Y(u + 30), 4.5, nr);
      reserveRect(x - 1, Y(u + 35), 64, 37);
    }
    for (const [x0, x1] of [[0, RD[0] - 9], [RD[1] + 9, W]])
      for (const [u0, u1] of [[KOKUSAI[0] + 12, 3088], [3100, n1 - 14]]) {
        let u = u0;
        while (u < u1 - 18) {
          const h = 11 + Math.floor(nr() * 6);
          const faceH = 10 + Math.floor(nr() * 7);
          let x = x0 + Math.floor(nr() * 3);
          while (x < x1 - 12) {
            const w = Math.min(x1 - x, 14 + Math.floor(nr() * 13));
            if (w >= 12 && !anyRes(x, Y(u + h + faceH), w, h + faceH + 2)) shop(x, Y(u + h + faceH), w, h, faceH);
            x += w + 1;
          }
          u += h + faceH + 3;
        }
      }
    // palms along the pavements, crowds lining the street to watch the parade
    for (let u = KOKUSAI[0] + 16; u < n1 - 12; u += 22) {
      if (Math.abs(u - 3094) < 10) continue;
      for (const x of [RD[0] - 5, RD[1] + 4]) tree('palm', x, Y(u), 5, nr);
    }
    people(RD[0] - 8, Y(n1 - 12), 7, n1 - KOKUSAI[0] - 24, 120, true);
    people(RD[1] + 1, Y(n1 - 12), 7, n1 - KOKUSAI[0] - 24, 120, true);
    // strings of festival flags across the street, fluttering (live)
    {
      const flags = [0, 1].map((f) => {
        const r = new Raster(RD[1] - RD[0] + 16, 5);
        for (let i = 0; i < r.w; i++) {
          const sag = Math.round(Math.sin((i / (r.w - 1)) * Math.PI) * 2);
          r.set(i, sag, 0x3a3a40);
          if (i % 4 === 1) {
            const c = [0xd8302a, 0xf0d040, 0x2a6ac8, 0xf0ece0, 0x2a9a5a][(i >> 2) % 5];
            r.set(i, sag + 1, c);
            r.set(i + (f ? 1 : 0), sag + 2, c);
            r.set(i + 1, sag + 1, c);
          }
        }
        return gradeF(r);
      });
      for (const u of [3036, 3070, 3130, 3166]) kit.loop(RD[0] - 8, u, flags, { fps: 2.5 });
    }
    // the eisa parade (live): a banner bearer, rows of drummers with big ōdaiko and small shime-daiko striking
    // as they dance, then dancers and a white-faced chondārā clowning at the back, in two columns coming in
    // along the cross street, marching up Kokusai-dōri and turning off at the top
    {
      const figure = (shirt, sash, head, extra) =>
        [0, 1].map((f) => {
          const r = new Raster(7, 9);
          r.set(4, 8, 0x1e1e26, 0.35);
          r.rect(2, 4, 3, 3, shirt);
          r.set(3, 5, 0x1a1a22); // the black vest
          r.rect(2, 6, 3, 1, sash);
          r.set(3, 3, head);
          r.set(3, 2, 0x6a3a9a); // the purple hachimaki
          r.set(2, 7, 0x1a1a22);
          r.set(4, 7, 0x1a1a22);
          extra(r, f);
          return gradeF(r);
        });
      const banner = figure(0xf0eee8, 0xe8c030, 0xe8c8a8, (r) => {
        r.rect(5, 0, 1, 8, 0x5a3a22);
        r.rect(5, 0, 2, 4, 0xd8302a);
        r.set(6, 1, 0xf0ece0);
      });
      const odaiko = figure(0xf0eee8, 0xd8302a, 0xe8c8a8, (r, f) => {
        r.rect(0, 4, 2, 3, 0xb03a2a);
        r.set(0, 4, 0xe8dcc0);
        r.set(f ? 1 : 5, f ? 2 : 3, 0x8a5a2a); // the stick, up and down
        r.set(f ? 1 : 5, f ? 3 : 4, 0x8a5a2a);
      });
      const shime = figure(0xf0eee8, 0xe8c030, 0xe8c8a8, (r, f) => {
        r.rect(5, 4, 2, 2, 0xe8dcc0);
        r.set(6, 5, 0x6a3a1a);
        r.set(f ? 1 : 2, f ? 3 : 4, 0x8a5a2a);
      });
      const dancer = figure(0x8a3a9a, 0xe86a9a, 0xe8c8a8, (r, f) => {
        r.set(f ? 1 : 5, 4, 0xe8c8a8); // a sleeve flung out
        r.set(f ? 5 : 1, 5, 0x8a3a9a);
      });
      const chondara = figure(0x3a5aa8, 0xe8c030, 0xf8f8f4, (r, f) => {
        r.set(3, 2, 0x1a1a22);
        r.set(f ? 1 : 5, f ? 4 : 6, 0xf8f8f4);
      });
      const order = [banner, odaiko, odaiko, odaiko, shime, shime, shime, dancer, dancer, chondara];
      const sp = 7;
      const total = 392;
      const at = (s) => passing(3094, sp, s, total);
      kit.path([[-12, 3000], [86, 3000], [86, 3188], [192, 3188]], order, { sp, n: 10, gap: 9, turn: 'none', cars: 1, fps: 3, s0: at(192) });
      kit.path([[-12, 2996], [94, 2996], [94, 3192], [184, 3192]], order, { sp, n: 10, gap: 9, turn: 'none', cars: 1, fps: 3, s0: at(192) });
    }
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
    for (let yy = Math.max(Y(NAHA[1]), y - 13); yy < Math.min(Y(NAHA[0]), y + 13); yy++) for (let xx = Math.max(0, x - 13); xx < Math.min(W, x + 13); xx++) fieldsRes[(yy - Y(NAHA[1])) * W + xx] = 1;
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
  // Over Naha the pass still decides as it did over the fields (so it takes the same random numbers and every
  // tree below comes out where it was), but plants nothing there; Naha's gaps get trees of their own after.
  const nahaRow = (y) => y >= Y(NAHA[1]) && y < Y(NAHA[0]);
  const wasRes = (x, y) => {
    x = Math.floor(x);
    y = Math.floor(y);
    return nahaRow(y) ? x >= 0 && x < W && fieldsRes[(y - Y(NAHA[1])) * W + x] : isRes(x, y);
  };
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
      if (wasRes(ix, iy) || wasRes(ix - k, iy) || wasRes(ix + k, iy) || wasRes(ix, iy - k) || wasRes(ix, iy + k)) continue;
      if (rand() < (u > JUNGLE[0] ? 0.05 : 0.3)) continue;
      if (nahaRow(iy)) rand(); // the seed its tree took
      else tree(kind, x, y, r);
    }
  {
    const nr = rng(1907);
    const kinds = (u) => (u < 2690 ? [['tropic', 0.45], ['fukugi', 0.75], ['hibiscus', 1]] : u < 2860 ? [['tropic', 0.5], ['banana', 0.75], ['fukugi', 1]] : [['tropic', 0.6], ['palm', 1]]);
    for (let gy = Y(NAHA[1]); gy < Y(NAHA[0]); gy += 7)
      for (let gx = -2; gx < W + 2; gx += 7) {
        const x = gx + nr() * 7;
        const y = gy + nr() * 7;
        const ix = Math.round(x);
        const iy = Math.round(y);
        if (ix < 0 || ix >= W || !nahaRow(iy) || K(ix, iy) !== 2 || D(ix, iy) < 10) continue;
        const roll = nr();
        const kind = kinds(U(iy)).find(([, p]) => roll < p)[0];
        const [r0, r1] = RADIUS[kind];
        const r = r0 + nr() * (r1 - r0);
        const k = r * 0.6;
        if (isRes(ix, iy) || isRes(ix - k, iy) || isRes(ix + k, iy) || isRes(ix, iy - k) || isRes(ix, iy + k)) continue;
        if (nr() < 0.3) continue;
        tree(kind, x, y, r, nr);
      }
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
  for (let y0 = Y(NAHA[0]); y0 < Y(FIELDS[0]); y0 += 16)
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
