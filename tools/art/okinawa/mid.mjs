// Middle layer (Okinawa): the Kerama islands, a resort beach, Bise under its fukugi trees, cane and pineapple
// fields, then Naha on the way up to Shuri: a hillside of turtle-back tombs (one family holding its
// Shīmī picnic in front of theirs), the potters' lane of Tsuboya with its old climbing kiln, the Makishi
// market under its glass roof and the Heiwa-dōri arcade, and Kokusai-dōri with an eisa parade marching up
// it; then Shuri castle, the Yanbaru forest with the Hiji falls, the Kōri bridge to Kōri island, the open
// sea and a lighthouse island. Water away from the coast is left transparent so the deep ocean of the far
// layer shows through.
//
// Live (see ../props.mjs): waves roll in onto every beach and break white over the reefs, the lagoons
// glint, the boats and the ferry sail on with their wakes, divers' bubbles rise round the dive boats, sea
// turtles, fish and mantas glide under the surface, humpbacks breach, cyclists ride Bise's lanes, gusts
// sweep the cane fields, the cane cutters work and the sugar mill smokes, a parasail, a banana boat and jet
// skis play off the resort beach, squalls drift over the sea, banners flutter over Shuri's courtyard, the Hiji
// falls pour, kuina dart across the
// Yanbaru road, mist drifts over the forest, cars cross the Kōri bridge and the lighthouse flashes.
//
// Coordinates: u = distance from the bottom of the strip (stage start), strip y = L - u.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Raster, fbm, rng, bayer, scaleColor } from '../../lib/raster.mjs';
import { crownPixels, palmPixels, grade, rampColor } from '../nature.mjs';
import { PropKit, Window, puff, tintTable } from '../props.mjs';

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
  whiteSand: [0xdcd6c4, 0xebe7d8, 0xf5f2e8, 0xfdfcf6], // the Kerama beaches
  gold: 0xe2aa32,
};

const CORAL = [0x6a5a48, 0x8a5a62, 0x5a6a4a, 0x9a7a5a]; // brain coral, soft coral, staghorn, sand-dusted
const mixColor = (a, b, t) => {
  const ch = (sh) => Math.round(((a >> sh) & 255) * (1 - t) + ((b >> sh) & 255) * t);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
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

// [u, x, r, kind]: islands are unions of these discs. k = the Kerama islands off the start (white beaches,
// rocky points), l = the lighthouse island, o = Kōri island at the end of its bridge
const ISLETS = [
  [230, 20, 30, 'k'],
  [272, 6, 28, 'k'],
  [200, 42, 18, 'k'],
  [585, 158, 27, 'k'],
  [618, 172, 23, 'k'],
  [552, 142, 16, 'k'],
  [420, 98, 5, 'k'], // a lone rock
  [5420, 38, 14],
  [5790, 124, 12],
  [6230, 90, 46, 'l'],
  [5082, 112, 38, 'o'],
  [5114, 140, 32, 'o'],
  [5046, 90, 20, 'o'],
];
const REEFS = [
  [120, 118, 22],
  [480, 28, 18],
  [660, 150, 16],
  [5250, 150, 20],
  [5600, 82, 26],
  [6620, 40, 18],
  [6760, 150, 22],
];
// the shallow channel the Kōri bridge crosses, from the north coast to the island: [x, u] along its middle, half-width
const SHALLOWS = { pts: [[90, 4640], [88, 4760], [94, 4880], [92, 5040]], w: 30 };

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
    for (const [iu, ix, R, k] of ISLETS) {
      const dd = R - Math.hypot(x + 0.5 - ix, u - iu) + (fbm(x, u, { seed: 83, scale: 8, octaves: 2 }) - 0.5) * 6;
      if (dd > d) {
        d = dd;
        kind = k === 'k' ? 'kerama' : 'islet';
      }
    }
    return { d, kind };
  }
  const beachW = (kind) => (kind === 'south' ? 30 : kind === 'cliff' ? 5 : kind === 'kerama' ? 6 : 7);
  function reefD(x, u) {
    let d = -999;
    for (const [ru, rx, R] of REEFS) d = Math.max(d, R - Math.hypot(x + 0.5 - rx, u - ru) + (fbm(x, u, { seed: 85, scale: 10, octaves: 2 }) - 0.5) * 10);
    return d;
  }
  function shallowD(x, u) {
    if (u < SHALLOWS.pts[0][1] - 40 || u > SHALLOWS.pts[SHALLOWS.pts.length - 1][1] + 40) return -999;
    let best = Infinity;
    for (let i = 0; i < SHALLOWS.pts.length - 1; i++) {
      const [ax, au] = SHALLOWS.pts[i];
      const [bx, bu] = SHALLOWS.pts[i + 1];
      const t = Math.max(0, Math.min(1, ((x + 0.5 - ax) * (bx - ax) + (u - au) * (bu - au)) / ((bx - ax) ** 2 + (bu - au) ** 2)));
      best = Math.min(best, Math.hypot(x + 0.5 - (ax + (bx - ax) * t), u - (au + (bu - au) * t)));
    }
    return SHALLOWS.w - best + (fbm(x, u, { seed: 86, scale: 14, octaves: 2 }) - 0.5) * 18;
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
        } else if (kind === 'kerama' && fbm(x, u, { seed: 89, scale: 9 }) > 0.5) {
          // a rocky point: weathered limestone instead of sand
          img.set(x, y, rampColor(C.rock, 0.35 + (d / bw) * 0.5 + (fbm(x, y, { seed: 9, scale: 2 }) - 0.5) * 0.5, x, y));
        } else {
          const n = fbm(x, y, { seed: 11, scale: 5, octaves: 2 });
          img.set(x, y, d < 2.5 ? (kind === 'kerama' ? 0xd8d4c4 : C.wetSand) : rampColor(kind === 'kerama' ? C.whiteSand : C.sand, 0.35 + n * 0.55, x, y));
        }
        continue;
      }
      // water: shallow lagoon near coasts and over reefs, transparent open sea elsewhere
      const reach = kind === 'cliff' ? 12 : 26;
      const rd = reefD(x, u);
      let s = Math.max(1 + d / reach, rd > 0 ? 0.42 + Math.min(rd, 14) / 34 : 0);
      if (kind === 'kerama' && s > 0) s = Math.min(1, s * 1.12 + 0.05); // Kerama blue: clearer, brighter
      const sd = shallowD(x, u);
      if (sd > 0) s = Math.max(s, 0.5 + Math.min(sd, 16) / 40); // the emerald shallows under the Kōri bridge
      if (s <= 0) continue;
      if (s < 0.35 && s < bayer(x, y) * 0.35) continue; // dithered drop-off into deep water
      const caust = fbm(x * 1.3, y, { seed: 13, scale: 6, octaves: 2 });
      let c = rampColor(C.lagoon, Math.min(1, s * 0.95 + (caust - 0.5) * 0.18), x, y);
      if (caust > 0.7 && s > 0.45 && (x + y) % 3 === 0) c = scaleColor(c, 1.18);
      if (rd > 2 && s > 0.45) {
        // the reef itself through the clear water: clumps of coral, pale sand channels between them
        const cn = fbm(x, y, { seed: 87, scale: 2.6, octaves: 2 });
        if (cn > 0.58) c = mixColor(c, CORAL[Math.floor(fbm(x, y, { seed: 88, scale: 5 }) * 7) % 4], cn > 0.68 ? 0.55 : 0.35);
        else if (cn < 0.3) c = scaleColor(c, 1.12);
      }
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

  // ------------------------------------------------------------ islet decor (palms, a lava rock)
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
  // ------------------------------------------------------------ A. sea start: the Kerama islands
  // Steep forested islands with white beaches and rocky points in the clearest water around Japan (Kerama
  // blue); dive boats moored off the beaches with their divers' bubbles breaking the surface, kayaks and a
  // beach hut on the sand.
  {
    const kr = rng(2203);
    for (const [iu, ix, R] of ISLETS.filter((i) => i[3] === 'k')) {
      // limestone boulders along the shore
      for (let i = 0; i < Math.ceil(R / 5); i++) {
        const a = kr() * Math.PI * 2;
        const rx = Math.round(ix + Math.cos(a) * (R - 2));
        const ry = Y(iu + Math.sin(a) * (R - 2));
        if (K(rx, ry) === 0 || rx < 2 || rx > W - 3) continue;
        const r = 1.5 + kr() * 1.6;
        img.disc(rx + 1, ry + 2, r, 0x0a1a2a, 0.3);
        img.disc(rx, ry, r, C.rock[1]);
        img.disc(rx - 0.6, ry - 0.6, r * 0.5, C.rock[3]);
      }
    }
    // kayaks pulled up on the sand, a thatched beach hut
    const onBeach = (x, u) => K(x, Y(u)) === 1 && K(x, Y(u) - 6) >= 1 && K(x + 2, Y(u)) >= 1;
    let kay = 0;
    for (const [u0, x0, dx] of [[250, 50, 1], [215, 60, 1], [575, 128, -1], [600, 134, -1]])
      for (let k = 0; k < 14 && kay < 6; k++) {
        const x = x0 + dx * k;
        if (!onBeach(x, u0)) continue;
        const y = Y(u0);
        const col = [0xf0c020, 0xe0402a, 0xf08a20][kay % 3];
        img.rect(x + 1, y + 1, 2, 6, 0x0a1a2a, 0.3);
        img.rect(x, y, 2, 6, col);
        img.set(x, y + 2, 0x2a2a30);
        img.set(x + 1, y + 2, 0x2a2a30);
        reserveRect(x - 1, y - 1, 4, 8);
        kay++;
        break;
      }
    {
      const hx = 30;
      const hy = Y(212);
      objects.push({
        y: hy + 7,
        shadow: () => shadowRect(hx + 2, hy + 3, 8, 7, 0.55),
        draw: () => {
          for (let j = 0; j < 7; j++)
            for (let i = 0; i < 8; i++) img.set(hx + i, hy + j, (i + j * 2) % 5 === 0 ? 0x8a6a3a : j < 3 ? 0xc8a868 : 0xb0905a);
          img.rect(hx, hy + 3, 8, 1, 0x7a5a30); // the ridge
        },
      });
      reserveRect(hx - 1, hy - 1, 10, 10);
    }
    // dive boats moored off the beaches (white hulls, the dive flag at the stern), divers' bubbles round them
    const bubbles = [1, 2, 3, 3].map((r, i) => {
      const out = new Raster(9, 9);
      for (let j = -4; j <= 4; j++)
        for (let k = -4; k <= 4; k++) {
          const d = Math.hypot(k, j);
          if (Math.abs(d - r) < 0.6) out.set(4 + k, 4 + j, 0xf4fcfc, i === 3 ? 0.4 : 0.85);
        }
      if (i < 2) out.set(4, 4, 0xffffff);
      return gradeF(out);
    });
    for (const [bx, bu, flip] of [[74, 262, false], [104, 590, true]]) {
      const y = Y(bu);
      objects.push({
        y: y + 15,
        shadow: () => {
          for (let j = 0; j < 15; j++) for (let i = 0; i < 6; i++) img.set(bx + i + 3, y + j + 3, 0x0a1a2a, 0.25);
        },
        draw: () => {
          for (let j = 0; j < 15; j++) {
            const w = j < 3 ? 2 + j : 5;
            const ox = Math.floor((5 - w) / 2);
            for (let i = 0; i < w; i++) img.set(bx + ox + i, y + j, i === 0 || i === w - 1 ? 0x2a5a9a : 0xf2f2ee);
          }
          img.rect(bx + 1, y + 5, 3, 4, 0xd8dce4); // the cabin
          img.rect(bx + 1, y + 5, 3, 1, 0x3a5a8a);
          img.rect(bx + 1, y + 12, 3, 2, 0x8a8a90); // tanks on the dive deck
          const fx = flip ? bx - 2 : bx + 5;
          img.rect(fx, y + 13, 2, 2, 0xe0302a); // the dive flag
          img.set(flip ? fx + 1 : fx, y + 13, 0xffffff);
          img.set(flip ? fx : fx + 1, y + 14, 0xffffff);
          img.set(bx + 2, y - 2, 0xf08a20); // the mooring buoy
        },
      });
      kit.spot([[bx - 14, bu + 22, 34, 34]], bubbles, { rate: 1.1, fps: 5, a: 0.9 });
    }
  }
  boat(100, 300, 9, 0xf2eee0);
  boat(84, 620, 8, null);
  boat(30, 680, 9, 0x3a6ab0);

  // water sports off the resort beach (live): a speedboat towing a parasail to and fro, jet skis looping, a
  // banana boat bouncing along behind its boat
  {
    const tow = (kind) => {
      const out = new Raster(kind === 'para' ? 34 : 26, 9);
      out.rect(0, 3, 7, 3, 0xf2f2ee); // the boat, bow to the right
      out.set(7, 4, 0xf2f2ee);
      out.rect(1, 4, 4, 1, 0x3a5a8a);
      for (let x = 8; x < (kind === 'para' ? 22 : 16); x++) out.set(x, 4, 0x2a2a30, 0.5); // the tow line
      if (kind === 'para') {
        for (let x = 22; x < 34; x++) for (let y = 1; y < 8; y++) if (((x - 28) / 6) ** 2 + ((y - 4) / 3.5) ** 2 < 1) out.set(x, y, (x >> 1) % 2 ? 0xe0402a : 0xf0c020); // the canopy
      } else {
        for (let x = 16; x < 26; x++) out.set(x, 4, 0xf0d020); // the banana, riders on it
        for (let x = 17; x < 25; x += 2) out.set(x, 3, [0xe05a5a, 0x3a6ad0, 0xe8e8f0, 0x5aaa6a][(x >> 1) % 4]);
      }
      return gradeF(out);
    };
    kit.path([[-40, 716], [220, 716]], [tow('para')], { sp: 9, mode: 'pp', hold: 2, turn: 'flip', wake: { f: smallWake, every: 3, life: 1.8 }, s0: 0.3 });
    kit.path([[-30, 734], [210, 734]], [tow('banana')], { sp: 7, mode: 'pp', hold: 2, turn: 'flip', wake: { f: smallWake, every: 3, life: 1.6 }, s0: 0.7 });
    const jet = new Raster(5, 3);
    jet.rect(0, 0, 4, 3, 0xe8e8ee);
    jet.set(4, 1, 0xe8e8ee);
    jet.set(1, 1, 0xe05a2a);
    const jf = gradeF(jet);
    for (const [cx, cu, r, s0] of [[46, 700, 14, 0.1], [130, 724, 11, 0.6]]) {
      const pts = [];
      for (let a = 0; a <= Math.PI * 2 + 0.01; a += Math.PI / 8) pts.push([cx + Math.cos(a) * r * 1.6, cu + Math.sin(a) * r]);
      kit.path(pts, [jf], { sp: 14, turn: 'rot', wake: { f: smallWake, every: 2, life: 1.2 }, s0 });
    }
  }

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

  // ------------------------------------------------------------ C. Bise: the fukugi village
  // Sand lanes winding under tight rows of fukugi trees (the Bise fukugi road on the Motobu peninsula); every
  // homestead hides inside its own ring of fukugi (a windbreak against the typhoons): a coral-stone wall, a
  // hinpun screen inside the gate, the old house with its red-tile hip roof and a shisa on the ridge, a
  // smaller annex, a vegetable patch. Cyclists and walkers on the lanes.
  {
    const br = rng(2201);
    const pads = stage.waves.filter((w) => w.type === 'turret').map((w) => [w.x, Y(anchor + V * w.t + 10)]);
    const nearPad = (x0, y0, x1, y1) => pads.some(([px, py]) => px + 13 > x0 && px - 13 < x1 && py + 13 > y0 && py - 13 < y1);
    // lanes up the village: the straight main lane and two that wind; lanes across, each crossing some of them
    const laneX = [(u) => 44 + 5 * Math.sin(u / 70 + 1), () => 90, (u) => 136 + 5 * Math.sin(u / 85 + 3)];
    const halfW = [3, 4, 3];
    const across = []; // [u, from lane, to lane] (-1 = the left edge, 3 = the right edge)
    for (let u = VILLAGE[0] + 2; u < VILLAGE[1] - 20; u += 46 + Math.floor(br() * 40)) {
      const a = br() < 0.4 ? -1 : Math.floor(br() * 2);
      const b = Math.min(3, a + 1 + Math.floor(br() * 3));
      across.push([u, a, b]);
    }
    across.push([VILLAGE[1] - 4, -1, 3]);
    const xOf = (i, u) => (i < 0 ? 0 : i > 2 ? W : laneX[i](u));
    const laneAt = (x, y) => img.set(x, y, rampColor(C.lane, 0.5 + fbm(x, y, { seed: 52, scale: 3 }) * 0.45, x, y));
    for (let y = Y(VILLAGE[1]); y < Y(VILLAGE[0]); y++)
      for (let x = 0; x < W; x++) if (K(x, y) === 2) img.set(x, y, rampColor(C.lane, 0.06 + fbm(x, y, { seed: 53, scale: 4 }) * 0.3, x, y));
    for (let i = 0; i < 3; i++)
      for (let y = Y(VILLAGE[1]); y < Y(VILLAGE[0]); y++) {
        const lx = Math.round(laneX[i](U(y)));
        for (let x = lx - halfW[i]; x < lx + halfW[i]; x++) if (K(x, y) === 2) laneAt(x, y);
        reserveRect(lx - halfW[i], y, halfW[i] * 2, 1);
      }
    for (const [u, a, b] of across)
      for (let y = Y(u + 3); y < Y(u - 3); y++) {
        const x0 = Math.round(xOf(a, U(y)));
        const x1 = Math.round(xOf(b, U(y)));
        for (let x = x0; x < x1; x++) if (K(x, y) === 2) laneAt(x, y);
        reserveRect(x0, y, x1 - x0, 1);
      }
    const fukugi = (x, y) => {
      if (nearPad(x - 4, y - 4, x + 4, y + 4) || K(Math.round(x), Math.round(y)) !== 2 || isRes(x, y)) return;
      tree('fukugi', x + (br() - 0.5) * 1.2, y + (br() - 0.5) * 1.2, 3.7 + br() * 1.2, br);
    };
    const row = (ax, ay, bx, by) => {
      const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / 5.5));
      for (let i = 0; i <= n; i++) fukugi(ax + ((bx - ax) * i) / n, ay + ((by - ay) * i) / n);
    };
    /** A homestead in (x0..x1, top..bot): its fukugi ring, wall, gate and hinpun, house, annex, garden. */
    const homestead = (x0, x1, top, bot) => {
      const pw = x1 - x0;
      const ph = bot - top;
      row(x0 + 2, top + 2, x1 - 2, top + 2);
      row(x0 + 2, bot - 2, x1 - 2, bot - 2);
      row(x0 + 2, top + 7, x0 + 2, bot - 7);
      row(x1 - 2, top + 7, x1 - 2, bot - 7);
      const wx0 = x0 + 6;
      const wx1 = x1 - 6;
      const wt = top + 6;
      const wb = bot - 6;
      if (wx1 - wx0 < 16 || wb - wt < 18 || nearPad(x0, top, x1, bot)) return;
      const r = br();
      if (r < 0.12) {
        // a field: rows of vegetables or a patch of sugar cane, no house
        for (let yy = wt; yy < wb; yy++)
          for (let xx = wx0; xx < wx1; xx++) img.set(xx, yy, (yy - wt) % 3 === 0 ? C.redEarth[1] : r < 0.06 ? C.cane[(xx + yy) % 3] : C.grass[1 + ((xx >> 1) % 2)]);
        reserveRect(wx0, wt, wx1 - wx0, wb - wt);
        return;
      }
      for (let yy = wt + 1; yy < wb; yy++)
        for (let xx = wx0 + 1; xx < wx1; xx++) if (K(xx, yy) === 2) img.set(xx, yy, rampColor(C.grass, 0.25 + fbm(xx, yy, { seed: 51, scale: 5 }) * 0.6, xx, yy));
      const gateUp = br() < 0.5;
      const gx = Math.round((wx0 + wx1) / 2 + (br() - 0.5) * (wx1 - wx0 - 10));
      const gy = gateUp ? wt : wb;
      const fy = gateUp ? wb : wt;
      wall([[gx + 3, gy], [wx1, gy], [wx1, fy], [wx0, fy], [wx0, gy], [gx - 3, gy]]);
      const hinpun = gateUp ? wt + 4 : wb - 4;
      wall([[gx - 4, hinpun], [gx + 4, hinpun]]); // a free-standing screen wall: spirits only go straight
      // the house, its face towards the gate; an annex (kitchen, storehouse) beside it if there's room
      const hw = Math.min(wx1 - wx0 - 4, 15 + Math.floor(br() * 7));
      const hh = 10 + Math.floor(br() * 3);
      const hx = wx0 + 2 + Math.floor(br() * Math.max(1, wx1 - wx0 - hw - 3));
      const hy = gateUp ? wb - hh - 5 : Math.max(wt + 3, hinpun - hh - 9);
      if (gateUp ? hy > hinpun + 2 : hy + hh + 3 < hinpun - 1) house(hx, hy, hw, hh);
      const aw = 8 + Math.floor(br() * 3);
      const ax = hx + hw + 2 + aw <= wx1 - 1 ? hx + hw + 2 : hx - aw - 2 >= wx0 + 1 ? hx - aw - 2 : null;
      if (ax !== null && br() < 0.8) house(ax, hy + 2, aw, 7, { faceH: 2, shisa: false });
      else if (br() < 0.5) {
        // or a water tank on a stand and the laundry pole
        img.disc(wx1 - 4.5, wt + 4.5, 2, 0x1e1e24);
        img.set(wx1 - 5, wt + 3, 0x5a5a66);
      }
      const gy2 = gateUp ? wt + 2 : wb - 3;
      if (br() < 0.7) tree('hibiscus', gateUp ? wx0 + 4 : wx1 - 4, gy2 + (gateUp ? 2 : -2), 2.8 + br());
      if (br() < 0.6) tree('banana', gateUp ? wx1 - 5 : wx0 + 5, gy2 + (gateUp ? 3 : -3), 3.2 + br());
      if (ph > 46 && br() < 0.7)
        for (let k = 0; k < 3; k++) img.rect(wx0 + 3 + k * 4, gateUp ? wb - 4 : wt + 2, 2, 2, k % 2 ? C.grass[3] : C.cane[2]); // a herb bed
    };
    // the homesteads, column by column between the lanes up, stacked between the lanes across
    for (let c = 0; c < 4; c++) {
      const lanesHere = across.filter(([, a, b]) => a < c && b >= c).map(([u]) => u);
      let u = VILLAGE[0] + 6;
      while (u < VILLAGE[1] - 30) {
        const nextLane = lanesHere.find((lu) => lu > u + 20) ?? VILLAGE[1];
        const h = Math.min(nextLane - 4 - u, 34 + Math.floor(br() * 22));
        if (h < 26) {
          u = nextLane + 4;
          continue;
        }
        const top = Y(u + h);
        const bot = Y(u);
        const mu = u + h / 2;
        const x0 = Math.ceil((c === 0 ? 0 : laneX[c - 1](mu) + halfW[c - 1]) + 1);
        const x1 = Math.floor((c === 3 ? W : laneX[c](mu) - halfW[c]) - 1);
        // a wide plot holds two homesteads side by side now and then
        if (x1 - x0 > 46 && br() < 0.5) {
          const xm = Math.round((x0 + x1) / 2 + (br() - 0.5) * 8);
          homestead(x0, xm, top, bot);
          homestead(xm, x1, top, bot);
        } else homestead(x0, x1, top, bot);
        u += h + 1;
      }
    }
    // an old gajumaru (banyan) spreading over the lane crossing in the middle of the village
    tree('tropic', 66, Y(1900), 12, br);
    // cyclists and walkers on the lanes
    const rider = (c, f, up) => {
      const r = new Raster(3, 5);
      r.set(1, up ? 0 : 4, 0x2a2a30); // front wheel
      r.set(1, up ? 4 : 0, 0x2a2a30);
      r.set(1, up ? 1 : 3, 0x2a2026); // head
      r.set(1, 2, c);
      r.set(f ? 0 : 2, 2, c);
      r.set(1, up ? 3 : 1, scaleColor(c, 0.8));
      r.set(2, up ? 4 : 0, 0x101820, 0.35);
      return gradeF(r);
    };
    const riderSide = (c, f) => {
      const r = new Raster(5, 4);
      r.set(0, 3, 0x2a2a30);
      r.set(4, 3, 0x2a2a30);
      r.rect(1, 3, 3, 1, 0x6a6a72);
      r.set(2, 0, 0x2a2026);
      r.set(2, 1, c);
      r.set(f ? 1 : 3, 2, scaleColor(c, 0.8));
      return gradeF(r);
    };
    for (const [c, s0] of [[0xe8e8f0, 0.1], [0xe05a4a, 0.55], [0x4a8ad8, 0.85]])
      kit.path([[90, VILLAGE[0] + 4], [90, VILLAGE[1] - 4]], [rider(c, 0, true), rider(c, 1, true)], { sp: 9, mode: 'pp', hold: 1, turn: 'none', fps: 3, fu: [rider(c, 0, true), rider(c, 1, true)], fd: [rider(c, 0, false), rider(c, 1, false)], s0 });
    for (const [[u, a, b], c] of across.slice(1, -1).filter((_, i) => i % 2 === 0).map((l, i) => [l, [0xf0c040, 0x5ac0a0, 0xe8e8f0, 0xe86a9a][i % 4]]))
      kit.path([[xOf(a, u) + 4, u], [xOf(b, u) - 4, u]], [riderSide(c, 0), riderSide(c, 1)], { sp: 8, mode: 'pp', hold: 2, turn: 'flip', fps: 3 });
    const walker = (c, f) => {
      const r = new Raster(2, 4);
      r.set(0, 0, 0x2a2026);
      r.set(0, 1, c);
      r.set(0, 2, f ? scaleColor(c, 0.8) : c);
      r.set(1, 3, 0x1e1e26, 0.4);
      return gradeF(r);
    };
    for (const [i, c] of [[0, 0xd04060], [2, 0xf0f0f0], [0, 0x3a6ad0], [2, 0xf0c040]]) {
      const pts = [];
      for (let u = VILLAGE[0] + 4; u <= VILLAGE[1] - 4; u += 20) pts.push([Math.round(laneX[i](u)), u]);
      kit.path(pts, [walker(c, 0), walker(c, 1)], { sp: 3, mode: 'pp', hold: 3, turn: 'none', fps: 3, s0: br() });
    }
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

  // the cane harvest and the sugar mill: one field half cut (rows of stubble, bundles of stalks, the cutters at
  // work and a small truck loaded high), and at the edge of the fields the mill, its brick chimney smoking (live)
  {
    const hr = rng(2215);
    // the mill: a long shed of corrugated iron, the boiler house, the chimney, cane stacked in the yard
    const mx = 128;
    const my = Y(2428);
    for (let y = my - 4; y < my + 58; y++)
      for (let x = mx - 4; x < W; x++)
        if (K(x, y) === 2) {
          img.set(x, y, rampColor(C.lane, 0.2 + fbm(x, y, { seed: 2216, scale: 4 }) * 0.4, x, y));
          cane[y * W + x] = 0;
        }
    reserveRect(mx - 6, my - 6, W - mx + 6, 66);
    objects.push({
      y: my + 30,
      shadow: () => shadowRect(mx + 3, my + 4, 38, 30, 0.5),
      draw: () => {
        for (let y = my; y < my + 24; y++)
          for (let x = mx; x < mx + 38; x++) img.set(x, y, (x - mx) % 3 === 0 ? 0x8a9098 : y < my + 12 ? 0xb4bac0 : 0x9aa0a8); // the corrugated roof
        img.rect(mx, my + 11, 38, 1, 0x6a7078);
        for (let y = my + 24; y < my + 30; y++) for (let x = mx + 1; x < mx + 37; x++) img.set(x, y, y === my + 24 ? 0x4a4a52 : 0xd8d4c8);
        img.rect(mx + 6, my + 26, 8, 4, 0x3a3a42); // the loading door
        img.rect(mx + 26, my - 10, 10, 12, C.roof[1]); // the boiler house
        img.rect(mx + 26, my - 10, 10, 1, C.roof[3]);
        img.disc(mx + 31.5, my - 14.5, 3, 0x2a2420); // the chimney seen from above
        img.disc(mx + 31.5, my - 14.5, 2.2, 0x8a3a2a);
        img.disc(mx + 31.5, my - 14.5, 1.2, 0x1a1414);
      },
    });
    for (let k = 0; k < 5; k++) {
      const x = mx + 2 + k * 7;
      const y = my + 36 + (k % 2) * 6;
      img.rect(x + 1, y + 1, 6, 4, 0x101810, 0.4);
      for (let j = 0; j < 4; j++) img.rect(x, y + j, 6, 1, j % 2 ? C.cane[0] : C.cane[2]); // stacks of cut cane
    }
    kit.emit(mx + 32, U(my - 15), [2, 3, 4, 5].map((r) => [0, 1].map((v) => kit.frame(puff(r, r * 13 + v + 211, [0x8a8a90, 0xa8a8b0, 0xc8c8cc, 0xe8e8ea])))), { rate: 1.4, life: [3, 4], vy: 9, sx: 1, wf: 1, a: 0.6 });
    // the field being cut: the most cane-filled patch below the fields' top, its lower half stubble
    let best = null;
    for (let u = 2370; u < 2530; u += 6)
      for (let x = 4; x < 100; x += 6) {
        let n = 0;
        for (let y = Y(u + 26); y < Y(u); y++) for (let xx = x; xx < x + 40; xx++) n += cane[y * W + xx] ? 1 : 0;
        if (!best || n > best.n) best = { n, x, u };
      }
    if (best && best.n > 600) {
      const { x: fx, u: fu } = best;
      for (let y = Y(fu + 13); y < Y(fu); y++)
        for (let x = fx; x < fx + 40; x++) {
          if (!cane[y * W + x]) continue;
          img.set(x, y, (x + y) % 3 === 0 ? 0xc8b878 : (x - fx) % 3 === 0 ? 0x8a7a48 : 0xa89858); // stubble
          cane[y * W + x] = 0;
        }
      for (let k = 0; k < 7; k++) {
        const bx = fx + 3 + Math.floor(hr() * 34);
        const by = Y(fu + 2 + Math.floor(hr() * 10));
        img.rect(bx, by, 4, 1, C.cane[2]); // bundles of stalks
        img.set(bx + 4, by, C.cane[0]);
      }
      // the truck at the edge of the cut, loaded high with cane
      const tx = fx + 30;
      const ty = Y(fu + 4);
      img.rect(tx + 1, ty + 1, 9, 5, 0x101810, 0.4);
      img.rect(tx, ty, 3, 5, 0x3a6ab0); // the cab
      img.rect(tx, ty, 3, 1, 0x8ab0d8);
      for (let j = 0; j < 5; j++) img.rect(tx + 3, ty + j, 6, 1, j % 2 ? C.cane[1] : C.cane[2]);
      const cutter = (f) => {
        const out = new Raster(3, 4);
        out.set(1, 0, 0xe8e0c8); // a sun hat
        out.set(1, 1, 0x5a7ab0);
        out.set(f ? 0 : 2, 1, 0xc0c4c8); // the cane knife
        out.set(1, 2, 0x3a3a4a);
        out.set(2, 3, 0x101810, 0.4);
        return gradeF(out);
      };
      kit.wander(fx + 20, fu + 7, 16, 5, [cutter(0), cutter(1)], { n: 3, sp: 2, idle: 0.6, turn: 'flip', fps: 2 });
    }
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

  // ------------------------------------------------------------ F. Yanbaru: the northern forest
  // A narrow road winds through the forest to the Kōri bridge, Yanbaru kuina (flightless rails found only
  // here) dashing across it by the yellow warning signs; the Hiji falls drop off a rock step into a pool, the
  // stream runs down to the cliffs under a suspension footbridge and the road; mist drifts over the canopy.
  const roadX = (u) => 90 + 22 * Math.sin((u - JUNGLE[0]) / 120) * smooth(3860, 3930, u) * (1 - smooth(4560, 4640, u));
  const ROAD = [3870, 4640];
  {
    const yr = rng(2207);
    // the stream: from the hills off the west edge, over the falls, down to the sea at the cliffs
    const STREAM = [[-6, 4590], [10, 4566], [22, 4540], [30, 4522], [30, 4504], [40, 4482], [54, 4452], [68, 4426], [86, 4398], [104, 4368], [116, 4344], [128, 4326]];
    const FALL = [4522, 4506]; // the rock step (u, top to foot)
    const water = [0x24666e, 0x34848a, 0x4c9e9c, 0x78c0b8];
    const wet = new Uint8Array(W * L); // the stream's bed (the trail crosses it on the footbridge)
    // (the banks first all along, then the water, so no bank covers the water beside it)
    for (const pass of [0, 1])
    for (let i = 0; i < STREAM.length - 1; i++) {
      const [ax, au] = STREAM[i];
      const [bx, bu] = STREAM[i + 1];
      const n = Math.ceil(Math.hypot(bx - ax, bu - au));
      for (let k = 0; k <= n; k++) {
        const x = ax + ((bx - ax) * k) / n;
        const u = au + ((bu - au) * k) / n;
        const w = 2.3 + (i / STREAM.length) * 1.6;
        for (let yy = Math.floor(Y(u) - w - 2); yy <= Y(u) + w + 2; yy++)
          for (let xx = Math.floor(x - w - 2); xx <= x + w + 2; xx++) {
            if (K(xx, yy) !== 2) continue;
            const d = Math.hypot(xx + 0.5 - x, yy + 0.5 - Y(u));
            const nz = fbm(xx, yy, { seed: 61, scale: 3 });
            if (pass && d < w) img.set(xx, yy, nz > 0.78 ? 0xe0f2ee : rampColor(water, 0.25 + nz * 0.7, xx, yy)); // riffles catching the light
            else if (!pass && d < w + 1.6) img.set(xx, yy, fbm(xx, yy, { seed: 62, scale: 2 }) > 0.66 ? rampColor(C.rock, 0.55, xx, yy) : 0x2c3a22); // dark wet banks, a boulder here and there
          }
        if (!pass) continue;
        reserveRect(x - w - 1, Y(u) - w - 1, w * 2 + 2, w * 2 + 2);
        for (let yy = Math.floor(Y(u) - w); yy <= Y(u) + w; yy++) for (let xx = Math.floor(x - w); xx <= x + w; xx++) if (xx >= 0 && xx < W) wet[yy * W + xx] = 1;
      }
    }
    // the rock step across the gorge: a ragged lip, layers of limestone streaked with moss, darker at its foot;
    // the pool below, rimmed with rock; the falls themselves are live (below), with their spray
    for (let x = 8; x <= 52; x++) {
      const half = 22 - Math.abs(x - 30);
      if (half < 0) continue;
      const lip = FALL[0] + Math.round((fbm(x, 0, { seed: 64, scale: 4 }) - 0.5) * 4) + Math.min(4, half * 0.4);
      const foot = FALL[1] + Math.round((fbm(x, 9, { seed: 64, scale: 3 }) - 0.5) * 3);
      for (let u = foot; u <= lip; u++) {
        const y = Y(u);
        if (K(x, y) !== 2) continue;
        const t = (u - foot) / Math.max(1, lip - foot); // 0 at the foot, 1 at the lip
        let c = rampColor(C.rock, 0.1 + t * 0.75 + (fbm(x, y, { seed: 65, scale: 2 }) - 0.5) * 0.35, x, y);
        if ((u - foot) % 4 === 0 && t < 0.9) c = scaleColor(c, 0.75); // the strata
        if (fbm(x, y, { seed: 66, scale: 3 }) > 0.64) c = rampColor(C.scrub, 0.3 + t * 0.5, x, y); // moss and ferns
        if (u === lip) c = scaleColor(c, 1.2);
        img.set(x, y, c);
      }
    }
    for (let yy = Y(FALL[1] + 1); yy <= Y(FALL[1] - 15); yy++)
      for (let xx = 16; xx <= 46; xx++) {
        const n = (fbm(xx, yy, { seed: 67, scale: 4 }) - 0.5) * 0.5;
        const d = ((xx + 0.5 - 31) / 10.5) ** 2 + ((yy + 0.5 - Y(FALL[1] - 6)) / 7) ** 2 + n;
        if (d < 1) img.set(xx, yy, d > 0.86 ? rampColor(C.rock, 0.3 + fbm(xx, yy, { seed: 68, scale: 2 }) * 0.4, xx, yy) : rampColor([0x14424e, 0x1e5a66, 0x2c7078, 0x4a9696], 0.1 + (1 - d) * 0.55 + fbm(xx, yy, { seed: 65, scale: 3 }) * 0.25, xx, yy));
      }
    for (let k = 0; k < 18; k++) img.set(27 + (k % 7), Y(FALL[1] - 1) + Math.floor(k / 7), 0xe8f6f4, 0.85); // churned white where it lands
    reserveRect(10, Y(FALL[0] + 6), 42, 36);
    {
      const fx0 = 28;
      const fy0 = Y(FALL[0] + 1);
      const fh = Y(FALL[1] - 1) - fy0;
      const frames = [0, 1, 2].map((f) => {
        const out = new Window(fx0, fy0, 6, fh);
        for (let j = 0; j < fh; j++)
          for (let i = 0; i < 6; i++) {
            const streak = (j + f * 3 + i * 5) % 7;
            const edge = i === 0 || i === 5;
            if (edge && (j + i + f) % 3 === 0) continue;
            out.set(fx0 + i, fy0 + j, streak < 2 ? 0xffffff : edge ? 0xa8d8dc : 0xd8f0f2, edge ? 0.8 : 1);
          }
        return gradeF(out);
      });
      kit.loop(fx0, U(fy0), frames, { fps: 9 });
      const spray = [3, 4, 5].map((r) => [0, 1].map((v) => kit.frame(puff(r, r * 7 + v + 31, [0xc8dcdc, 0xdcecec, 0xeef8f8, 0xffffff]))));
      kit.emit(31, FALL[1] - 3, spray, { rate: 2.2, life: [0.9, 1.6], vy: 5, sx: 4, wf: 0.4, a: 0.55 });
      const ripple = [3, 5, 7].map((r) => {
        const out = new Raster(r * 2 + 3, r + 3);
        for (let a = 0; a < Math.PI * 2; a += 0.08) out.set(Math.round(r + 1 + Math.cos(a) * r), Math.round(r / 2 + 1 + Math.sin(a) * r * 0.5), 0xe8f6f6, 0.6);
        return gradeF(out);
      });
      kit.spot([[25, FALL[1] - 2, 12, 6]], ripple, { rate: 1.6, fps: 5, a: 0.8 });
    }
    // the trail from the road to the falls: over the stream on a suspension footbridge, to a viewing deck
    const trail = [[roadX(4470) - 4, 4470], [60, 4471], [50, 4474], [38, 4476], [24, 4490], [16, 4500]];
    for (let i = 0; i < trail.length - 1; i++) {
      const [ax, au] = trail[i];
      const [bx, bu] = trail[i + 1];
      const n = Math.ceil(Math.hypot(bx - ax, bu - au));
      for (let k = 0; k <= n; k++) {
        const x = Math.round(ax + ((bx - ax) * k) / n);
        const y = Y(au + ((bu - au) * k) / n);
        if (x < 0 || x >= W || wet[y * W + x]) continue; // (the stream: the footbridge goes over it below)
        img.set(x, y, 0x8a6a44);
        img.set(x, y + 1, 0x6a5034);
        reserveRect(x - 2, y - 2, 5, 5);
      }
    }
    {
      // the footbridge: planks between two red-painted cables, its shadow on the water
      const [x0, y0, x1, y1] = [52, Y(4473), 41, Y(4475)];
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let k = 0; k <= n; k++) {
        const x = Math.round(x0 + ((x1 - x0) * k) / n);
        const y = Math.round(y0 + ((y1 - y0) * k) / n);
        img.set(x + 1, y + 3, 0x0a1a1a, 0.35);
        img.set(x, y, k % 2 ? 0xb08a58 : 0x8a6a40);
        img.set(x, y - 1, 0xc83a2a);
        img.set(x, y + 1, 0xc83a2a);
      }
      // the viewing deck at the end of the trail
      img.rect(12, Y(4502), 7, 5, 0x9a7a4a);
      img.rect(12, Y(4502), 7, 1, 0xb89a68);
      img.rect(12, Y(4502) + 4, 7, 1, 0x6a5034);
    }
    // the road: asphalt with white edge lines, a bridge over the stream; kuina warning signs beside it
    for (let u = ROAD[0]; u <= ROAD[1] + 12; u++) {
      const y = Y(u);
      const cx = roadX(u);
      for (let x = Math.floor(cx - 4); x <= cx + 4; x++) {
        if (K(x, y) === 0) continue;
        const dx = x + 0.5 - cx;
        let c = rampColor(C.asphalt, fbm(x, y, { seed: 66, scale: 3 }), x, y);
        if (Math.abs(dx) > 3.2) c = rampColor(C.redEarth, 0.5, x, y);
        else if (Math.abs(Math.abs(dx) - 2.6) < 0.5) c = 0xd8d8d0;
        else if (Math.abs(dx) < 0.5 && u % 8 < 4) c = 0xe8e4d0;
        img.set(x, y, c);
      }
      reserveRect(cx - 6, y, 12, 1);
    }
    {
      // where the stream passes under it: concrete railings either side
      const bu = 4419;
      const bx = roadX(bu);
      for (const dx of [-5, 5]) img.rect(Math.round(bx + dx), Y(bu + 5), 1, 10, 0xe0ded6);
    }
    for (const [u, side] of [[3990, 1], [4250, -1], [4560, 1]]) {
      const sx = Math.round(roadX(u) + side * 7);
      const sy = Y(u);
      img.set(sx + 1, sy + 2, 0x101410, 0.5);
      img.rect(sx - 1, sy - 1, 3, 3, 0xf0c818);
      img.set(sx - 1, sy - 1, 0x2a2a20);
      img.set(sx + 1, sy - 1, 0x2a2a20);
      img.set(sx - 1, sy + 1, 0x2a2a20);
      img.set(sx + 1, sy + 1, 0x2a2a20);
      img.set(sx, sy, 0x1a1a14); // the bird on the sign
      reserveRect(sx - 2, sy - 2, 5, 5);
    }
    // kuina darting across the road now and then
    const kuina = (f) => {
      const r = new Raster(5, 4);
      r.rect(0, 0, 3, 2, 0x4a4434);
      r.set(1, 0, 0x5e5640);
      r.set(3, 0, 0xd8302a); // red bill
      r.set(4, 1, 0xd8302a);
      r.set(0, 2, 0x2a2a2a);
      r.set(1, 2, 0xe8e8e8);
      r.set(2, 2, 0x2a2a2a);
      r.set(f ? 1 : 0, 3, 0xd8302a); // red legs
      r.set(f ? 2 : 3, 3, 0xd8302a);
      return gradeF(r);
    };
    for (const u of [4010, 4180, 4290, 4520])
      kit.path([[roadX(u) - 12, u], [roadX(u) + 12, u + 3]], [kuina(0), kuina(1)], { sp: 7, mode: 'pp', hold: 4 + yr() * 4, turn: 'flip', fps: 8, s0: yr() });
    // mist drifting over the canopy
    const mist = [12, 15, 18].map((r, i) => kit.frame(puff(r, 71 + i * 13, [0xc8d4d0, 0xd8e2de, 0xe6eeea, 0xf4f8f6])));
    for (const [u, s0] of [[3960, 0.2], [4120, 0.7], [4310, 0.4], [4480, 0.9], [4600, 0.1]])
      kit.path([[-40, u], [220, u + 20]], mist, { sp: 2.5, n: 2, gap: 130, turn: 'none', fps: 0.2, a: 0.32, d: 0.7, fx: 1, s0 });
  }

  // ------------------------------------------------------------ G. the Kōri bridge and Kōri island
  // The two-kilometre Kōri Ōhashi runs straight over the emerald shallows from the north coast to the island:
  // two lanes, lamp posts, its shadow on the water, cars crossing. On the island: red roofs, cane, and on the
  // north shore Tinu beach with the two Heart Rocks standing in the water.
  {
    const kb = rng(2211);
    const B0 = 4628;
    const B1 = 5032;
    for (let u = B0; u <= B1; u++) {
      const y = Y(u);
      const wet = K(91, y) === 0;
      if (wet) for (let x = 97; x <= 99; x++) img.set(x, y + 3, 0x0a1a2a, x === 99 ? 0.15 : 0.3); // its shadow
      if (wet && u % 34 === 0) img.rect(91, y + 2, 3, 2, 0x0a1a2a, 0.3); // a pier's shadow under the deck
      for (let x = 86; x <= 96; x++) {
        let c = x === 86 || x === 96 ? 0xe4e2da : x === 87 || x === 95 ? 0x9a9890 : rampColor(C.asphalt, 0.4 + fbm(x, y, { seed: 67, scale: 3 }) * 0.4, x, y);
        if (x === 91 && u % 8 < 4) c = 0xe8e4d0;
        img.set(x, y, c);
      }
      if (u % 26 === 0) {
        img.set(86, y, 0x4a4a52);
        img.set(96, y, 0x4a4a52);
        img.set(87, y, 0xfff0c0);
        img.set(95, y, 0xfff0c0);
      }
    }
    reserveRect(83, Y(B1 + 2), 17, B1 - B0 + 4);
    // the island road from the bridge round to the parking by Tinu beach
    const iroad = [[91, B1], [100, 5064], [112, 5092], [124, 5118], [130, 5132]];
    for (let i = 0; i < iroad.length - 1; i++) {
      const [ax, au] = iroad[i];
      const [bx, bu] = iroad[i + 1];
      const n = Math.ceil(Math.hypot(bx - ax, bu - au));
      for (let k = 0; k <= n; k++) {
        const x = ax + ((bx - ax) * k) / n;
        const y = Y(au + ((bu - au) * k) / n);
        for (let xx = Math.floor(x - 3); xx <= x + 3; xx++) if (K(xx, Math.round(y)) === 2) img.set(xx, Math.round(y), Math.abs(xx + 0.5 - x) > 2.4 ? 0xb8b4a8 : rampColor(C.asphalt, 0.5, xx, y));
        reserveRect(x - 5, y - 1, 10, 3);
      }
    }
    img.rect(126, Y(5140), 12, 7, 0x6a6c70); // the parking
    for (let i = 0; i < 4; i++) img.rect(127 + i * 3, Y(5140) + 1, 1, 5, 0xd8d8d0);
    reserveRect(124, Y(5142), 16, 11);
    // houses and cane fields
    for (let n = 0, tries = 0; n < 7 && tries < 400; tries++) {
      const hw = 12 + Math.floor(kb() * 5);
      const hh = 9 + Math.floor(kb() * 3);
      const hx = 60 + Math.floor(kb() * 110);
      const hy = Y(5040 + Math.floor(kb() * 110));
      let ok = true;
      for (let yy = hy - 2; yy < hy + hh + 6 && ok; yy++) for (let xx = hx - 2; xx < hx + hw + 2 && ok; xx++) if (K(xx, yy) !== 2 || isRes(xx, yy)) ok = false;
      if (!ok) continue;
      house(hx, hy, hw, hh);
      n++;
    }
    for (const [fx, fu, fw, fh] of [[118, 5076, 22, 14], [84, 5074, 16, 12]]) {
      const fy = Y(fu);
      for (let yy = fy; yy < fy + fh; yy++)
        for (let xx = fx; xx < fx + fw; xx++) if (K(xx, yy) === 2 && !isRes(xx, yy)) img.set(xx, yy, C.cane[(xx + Math.floor(yy / 2)) % 3]);
      for (let yy = fy; yy < fy + fh; yy++)
        for (let xx = fx; xx < fx + fw; xx++)
          if (K(xx, yy) === 2) {
            cane[yy * W + xx] = 1;
            reserved[yy * W + xx] = 1;
          }
    }
    // the Heart Rocks: two limestone stacks with scrub on top, undercut by the waves, in the shallows
    for (const [rx, ru, r] of [[130, 5153, 4.5], [140, 5157, 5.5]]) {
      const ry = Y(ru);
      img.disc(rx + 2, ry + 3, r, 0x0a1a2a, 0.35);
      img.disc(rx, ry, r, C.rock[1]);
      img.disc(rx - 0.5, ry - 0.8, r - 1.2, C.rock[2]);
      img.disc(rx - 0.8, ry - 1.2, r - 2.2, C.scrub[2]);
      img.set(Math.round(rx - 1), Math.round(ry - 2), C.scrub[3]);
      for (let a = 0; a < Math.PI * 2; a += 0.35) if (kb() < 0.5) img.set(Math.round(rx + Math.cos(a) * (r + 1)), Math.round(ry + Math.sin(a) * (r + 0.6)), C.foam, 0.8);
    }
    // cars crossing: up the Yanbaru road, over the bridge, round the island to the beach and back
    const car = (c, up) => {
      const r = new Raster(4, 6);
      r.rect(1, 1, 3, 5, 0x101820, 0.3);
      r.rect(0, 0, 3, 5, c);
      r.rect(0, up ? 1 : 2, 3, 1, 0x2a3a4a); // the windscreen
      r.rect(0, up ? 4 : 0, 3, 1, scaleColor(c, 0.75));
      r.set(1, 2 + (up ? 0 : 0), scaleColor(c, 1.15));
      return gradeF(r);
    };
    const route = [];
    for (let u = ROAD[0]; u < B0; u += 16) route.push([Math.round(roadX(u)) - 2, u]);
    route.push([89, B0], [89, B1], ...iroad.slice(1).map(([x, u]) => [x - 1, u]));
    for (const [c, s0] of [[0xf0f0f0, 0.35], [0xd8343a, 0.62], [0x3a6ac8, 0.82], [0x2a2a30, 0.15]])
      kit.path(route, [car(c, true)], { sp: 16, mode: 'pp', hold: 3, turn: 'none', fu: [car(c, true)], fd: [car(c, false)], s0 });
  }

  // ------------------------------------------------------------ H/I. sea islets, boats, lighthouse island
  for (const [iu, ix, R] of ISLETS.filter((i) => !i[3])) isletDecor(iu, ix, R, 2 + Math.floor(R / 7));
  boat(70, 4780, 9, 0xf2eee0);
  ferry(20, 5650);
  boat(150, 5520, 8, 0xe04a2a);
  boat(40, 5930, 9, null);
  {
    const [iu, ix] = ISLETS.find((i) => i[3] === 'l');
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
    if (u < MAIN_S - 30) return [['tropic', 0.55], ['fern', 0.85], ['palm', 1]]; // the Kerama forest
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
    kit.wander(60, 5330, 30, 90, tf, { n: 2, sp: 4, idle: 0.1, fps: 1.5, a: 0.45, d: -0.4 });
    kit.wander(60, 5960, 30, 60, tf, { n: 1, sp: 4, idle: 0.1, fps: 1.5, a: 0.45, d: -0.4 });
  }
  // life in the open sea past the Kōri bridge: schools of fish and manta rays gliding under the surface,
  // humpback whales (they winter round Okinawa) breaching, blowing and showing their flukes
  {
    const shade = 0x0e2a34;
    const school = (f) => {
      const out = new Raster(14, 10);
      const fr = rng(400 + f);
      for (let i = 0; i < 16; i++) {
        const a = fr() * Math.PI * 2;
        const d = Math.sqrt(fr()) * 4.2;
        const x = Math.round(7 + Math.cos(a) * d * 1.4 + (f ? (fr() - 0.5) : 0));
        const y = Math.round(5 + Math.sin(a) * d * 0.9);
        out.set(x, y, shade);
        out.set(x - 1, y, shade, 0.6);
      }
      return gradeF(out);
    };
    const sf = [school(0), school(1)];
    for (const [x, u, rx, ry] of [[80, 5300, 50, 90], [110, 5980, 40, 70], [60, 6700, 44, 120]]) kit.wander(x, u, rx, ry, sf, { n: 1, sp: 9, idle: 0, fps: 2, a: 0.4, d: -0.4 });
    const manta = (f) => {
      const out = new Raster(13, 13);
      const span = f ? 5 : 6;
      for (let j = -span; j <= span; j++) {
        const w = Math.round(4 - Math.abs(j) * (4 / span) * 0.9);
        for (let i = -w; i <= Math.max(0, w - 1); i++) out.set(6 + i, 6 + j, shade);
      }
      out.set(10, 5, shade); // the horns
      out.set(10, 7, shade);
      for (let i = 1; i <= 4; i++) out.set(6 - 4 - i, 6, shade, 0.7); // the tail
      return gradeF(out);
    };
    const mf = [manta(0), manta(1)];
    kit.path([[-20, 5180], [80, 5240], [190, 5200]], mf, { sp: 6, turn: 'rot', fps: 1.2, a: 0.42, d: -0.4 });
    kit.path([[200, 5700], [100, 5660], [-20, 5720]], mf, { sp: 5, turn: 'rot', fps: 1, a: 0.42, d: -0.4 });
    kit.path([[-20, 6500], [90, 6440], [200, 6520]], mf, { sp: 6, turn: 'rot', fps: 1.2, a: 0.42, d: -0.4 });
    // a humpback breaching: its shape rising, the leap (long white flippers out), the crash and the foam
    const S = 23;
    const whale = (k) => {
      const out = new Raster(S, S);
      const c = 11;
      const spray = (r, n, a) => {
        for (let i = 0; i < n; i++) {
          const ang = (i / n) * Math.PI * 2;
          const rr = r + ((i * 7) % 3) - 1;
          out.set(Math.round(c + Math.cos(ang) * rr), Math.round(c + Math.sin(ang) * rr * 0.8), 0xf4fafa, a);
        }
      };
      const body = (len, wide, fins) => {
        for (let j = -len; j <= len; j++) {
          const w = Math.round(wide * Math.sqrt(1 - (j / (len + 1)) ** 2));
          for (let i = -w; i <= w; i++) out.set(c + i, c + j, i > w - 1 ? 0x8a98a4 : j < -len + 2 ? 0x2a3440 : 0x3a4654);
        }
        if (fins)
          for (let t = 1; t <= 6; t++)
            for (const s of [-1, 1]) out.set(c + s * (wide + t), c - 2 + Math.round(t * 0.6), t > 4 ? 0xe8eef0 : 0xd0d8dc);
      };
      if (k === 0) out.ellipse(c, c, 3, 7, 0x0a1e2a, 0.35);
      if (k === 1) {
        out.ellipse(c, c, 3, 7, 0x0a1e2a, 0.4);
        spray(4, 10, 0.8);
      }
      if (k === 2) {
        body(4, 2, false);
        spray(6, 14, 0.9);
      }
      if (k === 3) {
        body(8, 3, true);
        spray(8, 16, 0.7);
      }
      if (k === 4) {
        out.disc(c + 0.5, c + 0.5, 7, 0xf4fafa, 0.9);
        out.disc(c + 0.5, c + 0.5, 4, 0xffffff);
        spray(9, 18, 0.8);
      }
      if (k === 5) {
        for (let r = 6; r <= 9; r++) spray(r, 22, r === 9 ? 0.8 : 0.4);
        out.disc(c + 0.5, c + 0.5, 3, 0xe8f6f6, 0.6);
      }
      if (k === 6) spray(10, 24, 0.5);
      if (k === 7) spray(10.5, 12, 0.3);
      return gradeF(out);
    };
    const breach = [0, 0, 1, 2, 3, 3, 4, 5, 6, 7].map(whale);
    // a fluke rising out of the water and slipping back under (the dive), and a blow: a puff of spray
    const fluke = (k) => {
      const out = new Raster(15, 9);
      const h = [1, 2, 3, 3, 2, 1, 0][k];
      if (h) {
        for (let i = 1; i <= 6; i++)
          for (const s of [-1, 1]) for (let j = 0; j < Math.min(h, 2); j++) out.set(7 + s * i, 3 + j - Math.round((i / 6) * 1.5) + 1, i > 4 ? 0x2a3440 : 0x3a4654);
        out.rect(7, 4, 1, h + 1, 0x3a4654);
        out.set(7, 2, 0xd8e0e4);
      }
      for (let i = -4 + (k > 3 ? -2 : 0); i <= 4 + (k > 3 ? 2 : 0); i++) if ((i + k) % 2 === 0) out.set(7 + i, 7, 0xf0f8f8, 0.7);
      return gradeF(out);
    };
    const dive = [0, 1, 2, 3, 3, 4, 5, 6].map(fluke);
    const blow = [2, 3, 4, 4].map((r, i) => {
      const out = new Raster(11, 11);
      for (let n = 0; n < 14; n++) {
        const a = n * 2.4;
        const d = (n % 4) * (r / 4) + 0.5;
        out.set(Math.round(5 + Math.cos(a) * d), Math.round(5 + Math.sin(a) * d), 0xf8fcfc, i === 3 ? 0.4 : 0.85);
      }
      return gradeF(out);
    });
    const open = [[10, 5640, 160, 140], [30, 6080, 120, 120], [20, 6960, 140, 160]];
    kit.spot(open, breach, { rate: 0.07, fps: 6, a: 0.95 });
    kit.spot(open, dive, { rate: 0.08, fps: 4, a: 0.9 });
    kit.spot(open, blow, { rate: 0.12, fps: 5, a: 0.9 });
  }
  // tropical squalls: a dark shower cloud's shadow drifting over the sea with its rain falling in streaks
  // (live), one off the south coast, one beyond the Kōri bridge
  {
    const r = new Raster(110, 76);
    for (let y = 0; y < r.h; y++)
      for (let x = 0; x < r.w; x++) {
        const d = ((x - 55) / 53) ** 2 + ((y - 38) / 36) ** 2 + (fbm(x, y, { seed: 2231, scale: 14, octaves: 2 }) - 0.5) * 0.8;
        if (d >= 1) continue;
        if (d > 0.65 && (d - 0.65) / 0.35 > bayer(x, y)) continue;
        r.set(x, y, (x * 3 + y * 2) % 11 === 0 && d < 0.8 ? 0x8a9aa8 : 0x0a1420); // the rain, streaking down at a slant
      }
    const f = gradeF(r);
    kit.path([[-80, 300], [260, 520]], [f], { sp: 5, turn: 'none', a: 0.32, d: 0.4, fx: 1, s0: 0.35 });
    kit.path([[260, 5300], [-80, 5700]], [f], { sp: 4, turn: 'none', a: 0.3, d: 0.4, fx: 1, s0: 0.5 });
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
