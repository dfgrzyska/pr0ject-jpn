// Middle layer of stage 1: a flight over Kyoto, cut into 512px chunks.
// Gion (Hanamikōji's machiya, maiko and rickshaws, the Yasaka pagoda, Yasaka shrine's west gate) →
// the Kamo river (turtle stepping stones, Pontochō's summer terraces, couples along the bank) →
// the approach to Fushimi Inari and the shrine (Rōmon, honden, foxes) → the Senbon torii tunnels on the
// ridge → Arashiyama (the bamboo grove, Nonomiya's black torii, Togetsukyō bridge over the Katsura) →
// Kinkaku-ji, the Golden Pavilion mirrored in its pond → Ryōan-ji's rock garden → Kiyomizu-dera
// (Sannenzaka, the Niōmon, the three-storey pagoda, the great wooden stage on its lattice of pillars,
// Otowa falls) → the Daimonji mountain at dusk with the 大 burning on its slope.
//
// Coordinates: `u` = distance from the bottom of the strip (stage start), strip y = L - u.
// At time t the top edge of the screen shows u = anchor + mid * t (see src/data/stage1.json).
// The ridge sections are transparent beside the ridge: the far layer (the valley) shows through.
//
// Live (see ../props.mjs): the Kamo and Katsura flow, boats row below Togetsukyō, gusts of wind sweep the
// bamboo grove, the Golden Pavilion's reflection ripples and koi swim in its pond, Otowa's three streams
// run, rickshaws pull through Gion and the bamboo grove, the nobori banners flutter, and the fires of
// the 大 flicker and smoke.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Raster, fbm, rng, bayer, scaleColor, rgb } from '../../lib/raster.mjs';
import { crownPixels, grade, rampColor } from '../nature.mjs';
import { PropKit, Window, puff, tintTable } from '../props.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export const W = 180;
export const CHUNK = 512;
export const CHUNKS = 14;
export const L = CHUNK * CHUNKS;

const GION = [0, 540];
const KAMO = [540, 650];
const SANDO = [650, 1130];
const SHRINE = [1130, 1830];
const TORII = [1830, 2700];
const ARASHI = [2700, 3500];
const KINKAKU = [3500, 4400];
const RYOAN = [4400, 5000];
const KIYOMIZU = [5000, 6300];

// ---- palette
const C = {
  K: 0x1c1418, // lacquer black
  R1: 0xe2421f, // vermilion lit
  R2: 0xb83018, // vermilion shade
  R3: 0x7e2014,
  IN: 0x22150f, // tunnel interior
  gold: 0xe2aa32,
  goldHi: 0xfff0a0,
  white: 0xe9e2d0,
  stone: [0x4e4b50, 0x6c6870, 0x8a8790, 0xaaa7ae],
  gravel: [0x5c5648, 0x6d6656, 0x7e7765, 0x908874],
  whiteGravel: [0xa8a69c, 0xbab8ae, 0xcac8be, 0xdad8ce],
  dirt: [0x3a2e22, 0x4a3b2a, 0x5a4a35, 0x6b5a42],
  floor: [0x1d2919, 0x263421, 0x314029, 0x3e4d30],
  moss: [0x2a4a24, 0x345a2a, 0x426a32, 0x547a3c],
  bambooFloor: [0x2a3a1e, 0x34482a, 0x405432, 0x4e6238],
  water: [0x16323e, 0x1e4250, 0x285464, 0x6aa2ae],
  river: [0x1e4a54, 0x285a64, 0x346a72, 0x7ab0b8],
  pond: [0x1c3a34, 0x244a40, 0x2e584c, 0x5a8a7a],
  roofBark: [0x2b2224, 0x3d3033, 0x544246, 0x6e5a5c],
  roofTile: [0x2a303c, 0x3c4452, 0x515b6c, 0x6a7588],
  roofTileDark: [0x262426, 0x37333a, 0x4a454e, 0x605a64],
  wood: [0x2e2018, 0x46301f, 0x5e4229, 0x7a5835],
  hinoki: [0x8a6a44, 0xa07c50, 0xb8925e, 0xccaa74],
  earthWall: [0x8a6a44, 0x9a7a52, 0xaa8a60],
  warm: 0xffd27a,
};
const KIMONO = [0xe86a9a, 0x9a5ac8, 0xd83a3a, 0x3a8ac8, 0xf0a040, 0x5aaa6a, 0xf0d0e0];

const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function buildMid() {
  const stage = JSON.parse(readFileSync(join(root, 'src', 'data', 'stage1.json'), 'utf8'));
  const { mid: V, anchor } = stage.scroll;
  let img = new Raster(W, L);
  const rand = rng(2026);
  const Y = (u) => L - u;
  const U = (y) => L - y;
  const reserved = new Uint8Array(W * L);
  const isRes = (x, y) => {
    x = Math.floor(x);
    y = Math.floor(y);
    return x >= 0 && x < W && y >= 0 && y < L && reserved[y * W + x];
  };
  const anyRes = (x0, y0, w, h) => {
    for (let y = Math.floor(y0); y < y0 + h; y++) for (let x = Math.max(0, Math.floor(x0)); x < Math.min(W, x0 + w); x++) if (isRes(x, y)) return true;
    return false;
  };
  const reserveRect = (x0, y0, w, h) => {
    for (let y = Math.max(0, Math.floor(y0)); y < Math.min(L, y0 + h); y++)
      for (let x = Math.max(0, Math.floor(x0)); x < Math.min(W, x0 + w); x++) reserved[y * W + x] = 1;
  };
  const reserveDisc = (cx, cy, r) => {
    for (let y = Math.floor(cy - r); y <= cy + r; y++)
      for (let x = Math.floor(cx - r); x <= cx + r; x++)
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r && x >= 0 && x < W && y >= 0 && y < L) reserved[y * W + x] = 1;
  };
  const objects = []; // { y: sort key (strip y of the base), draw(), shadow?() }
  const lights = []; // drawn after the grade: lanterns, fires
  const glow = (x, y, c, a = 1) => lights.push([Math.round(x), Math.round(y), c, a]);
  const kit = new PropKit(2036); // the moving parts
  const canopy = new Uint8Array(W * L); // bamboo leaves (the gusts brighten them)
  let ripple = null; // where the Golden Pavilion is mirrored in its pond
  /** Draw with the stage's own helpers into a frame at (x0, y0), graded like its place on the strip, lights on top. */
  const capture = (x0, y0, w, h, draw, u = U(y0 + h / 2)) => {
    const keep = img;
    const nl = lights.length;
    img = new Window(x0, y0, w, h);
    draw();
    const out = img;
    img = keep;
    const lit = lights.splice(nl);
    gradeAt(out, u);
    for (const [x, y, c, a] of lit) out.set(x, y, c, a);
    return kit.frame(out);
  };

  // turret pads come from the wave file: keep them clear of everything
  const pads = stage.waves.filter((w) => w.type === 'turret').map((w) => ({ x: w.x, u: anchor + V * w.t + 10 }));
  for (const p of pads) reserveDisc(p.x, Y(p.u), 13);

  // ------------------------------------------------------------ layout: the ridge sections
  const ridgeAmt = (u) => smooth(1820, 1980, u) * (1 - smooth(2620, 2740, u));
  const pathX = (u) => {
    const s = ridgeAmt(u);
    const k = u - 1820;
    return 90 + s * (20 * Math.sin(k / 230) + 9 * Math.sin(k / 83 + 1.1));
  };
  const widen = () => 0;
  const ridgeEdges = (u) => {
    const s = ridgeAmt(u);
    const rc = pathX(u) * 0.55 + 90 * 0.45;
    const hw = 50 + 12 * Math.sin(u / 170) + widen(u);
    const nl = (fbm(0, u, { seed: 41, scale: 24, octaves: 3 }) - 0.5) * 16;
    const nr = (fbm(7, u, { seed: 43, scale: 24, octaves: 3 }) - 0.5) * 16;
    return [(rc - hw + nl) * s + -20 * (1 - s), (rc + hw + nr) * s + 200 * (1 - s)];
  };

  // ------------------------------------------------------------ 1. terrain base
  for (let y = 0; y < L; y++) {
    const u = L - y;
    const [l, r] = ridgeEdges(u);
    for (let x = 0; x < W; x++) {
      if (x < l || x > r) continue;
      let c = rampColor(C.floor, fbm(x, y, { seed: 12, scale: 16, octaves: 3 }), x, y);
      const dl = x - l;
      const dr = r - x;
      if (dl < 6) c = scaleColor(c, 0.62 + dl * 0.06);
      if (dr < 7) c = scaleColor(c, 0.5 + dr * 0.07);
      img.set(x, y, c);
    }
    for (let d = 1; d <= 7; d++) {
      const xr = Math.floor(r) + d;
      if (xr >= 0 && xr < W) img.set(xr, y, 0x05070a, 0.5 * (1 - d / 8));
      const xl = Math.ceil(l) - d;
      if (d <= 3 && xl >= 0 && xl < W) img.set(xl, y, 0x05070a, 0.3 * (1 - d / 4));
    }
  }

  // ------------------------------------------------------------ helpers: ground
  const fillGround = (x0, y0, w, h, ramp, seed = 3, scale = 6) => {
    for (let y = Math.floor(y0); y < y0 + h; y++)
      for (let x = Math.floor(x0); x < x0 + w; x++) {
        if (x < 0 || x >= W || y < 0 || y >= L || !img.alpha(x, y)) continue;
        img.set(x, y, rampColor(ramp, fbm(x, y, { seed, scale, octaves: 2 }), x, y));
      }
  };
  const paving = (x0, y0, w, h, ramp = C.stone) => {
    for (let y = Math.floor(y0); y < y0 + h; y++)
      for (let x = Math.floor(x0); x < x0 + w; x++) {
        if (!img.alpha(x, y)) continue;
        const row = Math.floor((y - y0) / 5);
        const joint = (y - y0) % 5 === 4 || (x - x0 + (row % 2) * 4) % 8 === 7;
        const n = fbm(x, y, { seed: 5, scale: 4, octaves: 2 });
        img.set(x, y, joint ? ramp[0] : rampColor(ramp, 0.35 + n * 0.5, x, y));
      }
  };
  // vertical path following a centre function, gravel or stairs
  const path = (u0, u1, cxf, hw, style = 'gravel') => {
    for (let u = u0; u <= u1; u++) {
      const y = Y(u);
      const cx = cxf(u);
      for (let x = Math.floor(cx - hw); x <= cx + hw; x++) {
        if (!img.alpha(x, y)) continue;
        const edge = Math.abs(x + 0.5 - cx) > hw - 1;
        const n = fbm(x, y, { seed: 8, scale: 4, octaves: 2 });
        let c = rampColor(C.gravel, 0.25 + n * 0.6, x, y);
        if (style === 'stairs') {
          const s = (u - u0) % 4;
          c = s === 0 ? C.stone[0] : s === 1 ? C.stone[3] : rampColor(C.stone, 0.4 + n * 0.4, x, y);
        }
        if (edge) c = scaleColor(c, 0.75);
        img.set(x, y, c);
      }
      reserveRect(cx - hw - 3, y, hw * 2 + 7, 1);
    }
  };
  /** A body of water: an irregular ellipse filled from a ramp, rimmed with stones. */
  const pondAt = (cx, cu, rx, ry, ramp, seed, rim = C.stone) => {
    const cy = Y(cu);
    for (let y = Math.floor(cy - ry - 3); y <= cy + ry + 3; y++)
      for (let x = Math.floor(cx - rx - 3); x <= cx + rx + 3; x++) {
        if (x < 0 || x >= W || y < 0 || y >= L) continue;
        const e = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 + (fbm(x, y, { seed, scale: 12 }) - 0.5) * 0.3;
        if (e >= 1.14) continue;
        if (e > 1) img.set(x, y, rampColor(rim, 0.3 + fbm(x, y, { seed: seed + 3, scale: 2 }) * 0.6, x, y));
        else {
          const n = fbm(x * 0.7, y, { seed: seed + 1, scale: 9, octaves: 2 });
          img.set(x, y, n > 0.7 && (x + y) % 2 ? ramp[3] : rampColor(ramp, 0.08 + n * 0.5 + (e > 0.85 ? -0.1 : 0), x, y));
        }
        reserved[y * W + x] = 1;
      }
  };

  // ------------------------------------------------------------ helpers: objects
  const shadowRect = (x, y, w, h, f = 0.55) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) img.tint(x + i, y + j, f);
  };
  // torii seen from above in 3/4: kasagi (black top + vermilion face), pillars, nuki.
  const gate = (cx, y, hw, tone = 1, black = false) => {
    const R1 = black ? 0x4a3a30 : scaleColor(C.R1, tone);
    const R2 = black ? 0x2e2420 : scaleColor(C.R2, tone);
    for (let r = 2; r <= 5; r++) for (let x = cx - hw + 1; x <= cx + hw - 1; x++) img.set(x, y + r, C.IN);
    for (let r = 1; r <= 5; r++) {
      img.set(cx - hw, y + r, R1);
      img.set(cx + hw, y + r, R2);
    }
    img.set(cx - hw, y + 6, C.K);
    img.set(cx + hw, y + 6, C.K);
    for (let x = cx - hw - 1; x <= cx + hw + 1; x++) img.set(x, y + 3, R2);
    for (let x = cx - hw - 2; x <= cx + hw + 2; x++) {
      img.set(x, y, C.K);
      img.set(x, y + 1, x === cx - hw - 2 || x === cx + hw + 2 ? R2 : R1);
    }
    img.set(cx - hw - 2, y - 1, C.K);
    img.set(cx + hw + 2, y - 1, C.K);
  };
  const gateShadow = (cx, y, hw) => {
    for (let r = 0; r <= 6; r++) {
      img.tint(cx + hw + 3, y + r + 1, 0.55);
      img.tint(cx + hw + 4, y + r + 1, 0.7);
    }
  };
  const tunnel = (u0, u1, cxf, hw, seed = 1) => {
    const tr = rng(seed);
    for (let u = u1; u >= u0; ) {
      const cx = Math.round(cxf(u));
      const y = Y(u);
      const tone = 0.82 + tr() * 0.26;
      objects.push({ y: y + 6, draw: () => gate(cx, y, hw, tone), shadow: () => gateShadow(cx, y, hw) });
      reserveRect(cx - hw - 4, y - 1, hw * 2 + 9, 8);
      u -= tr.chance(0.04) ? 9 + tr.int(0, 8) : tr.chance(0.3) ? 5 : 4;
    }
  };
  const gateSmall = (cx, y, hw, black = false) => {
    objects.push({ y: y + 6, draw: () => gate(cx, y, hw, 1.05, black), shadow: () => gateShadow(cx, y, hw) });
    reserveRect(cx - hw - 4, y - 2, hw * 2 + 9, 10);
  };
  const miniGate = (cx, y, hw) => {
    objects.push({
      y: y + 4,
      shadow: () => shadowRect(cx - hw + 1, y + 2, hw * 2 + 3, 3, 0.65),
      draw: () => {
        for (let r = 1; r <= 3; r++) {
          img.set(cx - hw, y + r, C.R1);
          img.set(cx + hw, y + r, C.R2);
        }
        for (let x = cx - hw; x <= cx + hw; x++) img.set(x, y + 2, C.R2);
        for (let x = cx - hw - 1; x <= cx + hw + 1; x++) {
          img.set(x, y, C.K);
          img.set(x, y + 1, C.R1);
        }
      },
    });
  };
  const greatTorii = (cx, y, hw) => {
    const draw = (sh) => {
      const put = (x, yy, c) => (sh ? img.tint(x + 5, yy + 6, 0.5) : img.set(x, yy, c));
      for (const px of [cx - hw, cx + hw])
        for (let yy = y + 4; yy <= y + 13; yy++)
          for (let x = px - 2; x <= px + 2; x++) put(x, yy, yy >= y + 12 ? C.K : x < px ? C.R1 : x > px ? C.R3 : C.R2);
      for (let x = cx - hw - 4; x <= cx + hw + 4; x++) {
        put(x, y + 8, C.R2);
        put(x, y + 9, C.R3);
      }
      for (let x = cx - hw - 7; x <= cx + hw + 7; x++) {
        put(x, y, C.K);
        put(x, y + 1, C.K);
        put(x, y + 2, C.R1);
        put(x, y + 3, C.R2);
      }
      for (const [x, yy] of [[cx - hw - 8, y - 1], [cx - hw - 8, y - 2], [cx + hw + 8, y - 1], [cx + hw + 8, y - 2], [cx - hw - 8, y], [cx + hw + 8, y]]) put(x, yy, C.K);
      for (let yy = y + 4; yy <= y + 7; yy++) for (let x = cx - 3; x <= cx + 3; x++) put(x, yy, Math.abs(x - cx) < 2 && yy > y + 4 && yy < y + 7 ? C.gold : C.K);
    };
    objects.push({ y: y + 13, shadow: () => draw(true), draw: () => draw(false) });
    reserveRect(cx - hw - 10, y - 3, hw * 2 + 21, 18);
  };
  const lantern = (x, y, lit = true) => {
    objects.push({
      y: y + 4,
      shadow: () => shadowRect(x + 1, y + 2, 4, 3, 0.55),
      draw: () => {
        img.rect(x, y + 2, 3, 3, C.stone[1]);
        img.rect(x, y + 2, 3, 1, C.stone[2]);
        img.set(x + 1, y + 3, lit ? 0xffd27a : C.stone[0]);
        img.rect(x - 1, y, 5, 2, C.stone[0]);
        img.rect(x, y, 3, 1, C.stone[2]);
        img.set(x + 1, y - 1, C.stone[2]);
      },
    });
    reserveRect(x - 2, y - 2, 8, 8);
  };
  /** A red paper lantern (chōchin) hanging under the eaves. */
  const chochin = (x, y, c = 0xe8452a) => {
    img.set(x, y, c);
    img.set(x, y + 1, scaleColor(c, 0.7));
    glow(x, y, scaleColor(c, 1.2), 0.5);
  };
  const fox = (x, y, flip) => {
    objects.push({
      y: y + 6,
      shadow: () => shadowRect(x + 1, y + 2, 5, 5, 0.55),
      draw: () => {
        img.rect(x - 1, y + 3, 6, 4, C.stone[1]);
        img.rect(x - 1, y + 3, 6, 1, C.stone[2]);
        img.rect(x, y, 4, 4, 0xd8d2c6);
        img.set(flip ? x + 3 : x, y - 1, 0xd8d2c6);
        img.set(flip ? x + 2 : x + 1, y - 1, 0xd8d2c6);
        img.set(x + 1, y + 2, C.R1);
        img.set(x + 2, y + 2, C.R1);
        img.set(flip ? x : x + 3, y + 1, 0x3a3030);
      },
    });
    reserveRect(x - 2, y - 2, 9, 10);
  };
  const otsuka = (x, y, w, h) => {
    objects.push({
      y: y + h,
      shadow: () => shadowRect(x + 1, y + 2, w + 1, h, 0.55),
      draw: () => {
        img.rect(x, y, w, h, C.stone[1]);
        img.rect(x, y, w, 1, C.stone[3]);
        img.rect(x + w - 1, y + 1, 1, h - 1, C.stone[0]);
        if (h > 4) img.rect(x + 1, y + 2, Math.max(1, w - 3), h - 4, C.stone[0]);
      },
    });
    reserveRect(x - 1, y - 1, w + 3, h + 3);
  };
  /** People: tourists, and maiko in bright kimono with their black hair and ornaments. */
  const crowd = (x0, y0, w, h, n, any = false, maiko = 0) => {
    for (let i = 0; i < n; i++) {
      const x = Math.round(x0 + rand() * w);
      const y = Math.round(y0 + rand() * h);
      if (!any && isRes(x, y)) continue;
      if (!img.alpha(x, y)) continue;
      img.set(x + 1, y + 1, 0x101418, 0.45);
      if (rand() < maiko) {
        img.rect(x, y, 2, 2, rand.pick(KIMONO));
        img.set(x, y - 1, 0x141014);
        img.set(x + 1, y - 1, rand() < 0.5 ? 0xf0e0a0 : 0xe86a9a);
      } else {
        img.set(x, y, rand() < 0.45 ? rand.pick([0xd04040, 0x3a6ad0, 0xe8c040, 0xe8e8f0, 0x6aaa5a]) : 0x3a3a4a);
        img.set(x, y - 1, 0x2a2024);
      }
    }
  };
  /** A rickshaw frame on its own (puller at the bottom, or at the top when going up the screen). */
  const rickshawFrame = (up, u) =>
    capture(0, Y(u), 5, 8, () => {
      const y = Y(u);
      img.rect(0, y + 1, 1, 5, 0x1a1418);
      img.rect(4, y + 1, 1, 5, 0x1a1418);
      img.rect(1, y + (up ? 4 : 0), 3, 4, 0x8a1a1a);
      img.rect(1, y + (up ? 7 : 0), 3, 1, 0x2a2024);
      img.rect(1, y + (up ? 3 : 4), 3, 1, 0xe8d8b0);
      img.set(2, y + (up ? 0 : 7), 0x2a2a3a);
      img.set(2, y + (up ? 1 : 6), 0xd8c8a0);
    });
  const rickshaw = (x, y) => {
    objects.push({
      y: y + 7,
      shadow: () => shadowRect(x + 1, y + 2, 5, 6, 0.55),
      draw: () => {
        img.rect(x, y + 1, 1, 5, 0x1a1418);
        img.rect(x + 4, y + 1, 1, 5, 0x1a1418);
        img.rect(x + 1, y, 3, 4, 0x8a1a1a);
        img.rect(x + 1, y, 3, 1, 0x2a2024);
        img.rect(x + 1, y + 4, 3, 1, 0xe8d8b0);
        img.set(x + 2, y + 7, 0x2a2a3a);
        img.set(x + 2, y + 6, 0xd8c8a0);
      },
    });
  };
  const umbrella = (x, y, c1 = C.R1, c2 = C.R2) => ({
    y: y + 4,
    shadow: () => {
      for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) if (i * i + j * j <= 18) img.tint(x + i + 2, y + j + 3, 0.55);
    },
    draw: () => {
      for (let j = -4; j <= 4; j++)
        for (let i = -4; i <= 4; i++) {
          if (i * i + j * j > 18) continue;
          const rib = i === 0 || j === 0 || i === j || i === -j;
          img.set(x + i, y + j, rib ? c2 : i + j < 0 ? scaleColor(c1, 1.15) : c1);
        }
      img.set(x, y, C.gold);
    },
  });

  // hall in 3/4 view: hipped-gable roof + facade. Styles:
  //   shrine (bark roof, vermilion and white), gate (the same with a dark passage), machiya (tiles, wood
  //   lattice, noren and a red lantern), temple (dark tiles, wooden posts and white panels), hondo
  //   (bark roof over plain unpainted wood)
  const hall = (x, y, w, roofH, faceH, style = 'shrine') => {
    const bark = style === 'shrine' || style === 'gate' || style === 'hondo';
    const ramp = bark ? C.roofBark : style === 'temple' ? C.roofTileDark : rand() < 0.3 ? C.roofTileDark : C.roofTile;
    const ridge = y + Math.round(roofH * 0.32);
    const hi = Math.round(roofH * 0.42);
    const noren = rand.pick([0x2b3c78, 0x7a1a2a, 0x2a5a3a, 0xe8e0d0]);
    const nx = x + 3 + Math.floor(rand() * Math.max(1, w - 10));
    // a machiya's front: dark wood lattice, or the red bengara walls of a teahouse; little things outside
    const bengara = style === 'machiya' && rand() < 0.16;
    const props = [];
    if (style === 'machiya')
      for (let px = x + 1; px < x + w - 2; px += 3 + Math.floor(rand() * 4)) props.push([px, rand.pick(['pot', 'pot', 'inu', 'inu', 'bike', 'sign', 'none'])]);
    objects.push({
      y: y + roofH + faceH,
      shadow: () => shadowRect(x + 4, y + 5, w, roofH + faceH, 0.5),
      draw: () => {
        for (let yy = y; yy < y + roofH; yy++) {
          const north = yy <= ridge;
          const t = north ? (ridge - yy) / Math.max(1, ridge - y) : (yy - ridge) / Math.max(1, y + roofH - 1 - ridge);
          const inset = hi * (1 - t);
          for (let xx = x; xx < x + w; xx++) {
            let c;
            const lx = xx - x;
            const rx = x + w - 1 - xx;
            if (lx < inset) c = ramp[3];
            else if (rx < inset) c = ramp[0];
            else c = north ? ramp[2] : ramp[1];
            const tex = lx < inset || rx < inset ? (yy - y) % 2 === 0 : (xx - x) % 3 === 0;
            if (tex) c = scaleColor(c, 0.85);
            img.set(xx, yy, c);
          }
        }
        for (let xx = x; xx < x + w; xx++) {
          img.set(xx, y + roofH - 2, bark ? 0x7a6660 : ramp[3]);
          img.set(xx, y + roofH - 1, ramp[0]);
        }
        img.clear(x, y + roofH - 1);
        img.clear(x + w - 1, y + roofH - 1);
        img.clear(x, y);
        img.clear(x + w - 1, y);
        const rc = bark ? C.K : 0x7d889a;
        for (let xx = x + hi; xx < x + w - hi; xx++) {
          img.set(xx, ridge, rc);
          img.set(xx, ridge - 1, bark ? 0x3a3034 : 0x95a0b2);
        }
        if (bark) for (const gx of [x + hi, x + w - hi - 1]) for (const gy of [ridge, ridge - 1]) img.set(gx, gy, C.gold);
        const fy = y + roofH;
        for (let yy = fy; yy < fy + faceH; yy++)
          for (let xx = x + 1; xx < x + w - 1; xx++) {
            const k = (xx - x - 1) % 9;
            const upper = yy - fy < Math.ceil(faceH / 2);
            let c;
            if (style === 'shrine' || style === 'gate') {
              if (k < 2) c = k === 0 ? C.R1 : C.R2;
              else c = upper ? C.white : C.R2;
              if (yy === fy) c = 0x1a1210;
            } else if (style === 'temple') {
              c = k < 1 ? C.wood[1] : upper ? C.white : C.wood[2];
              if (yy === fy) c = 0x15100c;
            } else if (style === 'hondo') {
              c = k < 1 ? C.wood[1] : (xx + yy) % 2 ? C.hinoki[1] : C.hinoki[0];
              if (yy === fy) c = 0x15100c;
            } else {
              c = k < 1 ? C.wood[0] : (xx + yy) % 2 && upper ? C.wood[2] : C.wood[1];
              if (bengara) c = k < 1 ? 0x5a1a14 : (xx % 2) && !upper ? 0x6a2018 : 0xa8382a;
              else if (!upper && (xx - x) % 2 === 0) c = C.wood[0]; // the koshi lattice
              if (yy === fy) c = 0x15100c;
            }
            img.set(xx, yy, c);
          }
        if (style === 'machiya' && faceH >= 3) {
          // the second floor's mushiko slatted window under the eave
          for (let xx = x + 3; xx < x + w - 3; xx++) if ((xx - x) % 7 < 4) img.set(xx, fy + 1, (xx & 1) ? 0x3a2a1e : 0xc8b890);
          const by = fy + faceH + 1;
          for (const [px, kind] of props) {
            if (kind === 'pot') {
              img.set(px, by, 0x6a4a3a);
              img.set(px, by - 1, rand() < 0.5 ? 0x3a7a3a : 0x5a9a4a);
            } else if (kind === 'inu') {
              // inuyarai: the curved bamboo fence protecting the wall
              img.set(px, by, 0xb89a68);
              img.set(px + 1, by, 0xa08050);
              img.set(px + 2, by - 1, 0x8a6a40);
            } else if (kind === 'bike') {
              img.set(px, by, 0x2a2a30);
              img.set(px + 2, by, 0x2a2a30);
              img.set(px + 1, by - 1, rand.pick([0xc83a2a, 0x3a6aa8, 0xe8e8e8]));
            } else if (kind === 'sign') {
              img.rect(px, by - 2, 1, 3, 0xe8e0c8);
              img.set(px, by - 2, 0x1a1a1a);
            }
          }
        }
        if (style === 'gate') {
          const gw = Math.round(w * 0.2);
          img.rect(x + Math.floor(w / 2 - gw / 2), fy + 1, gw, faceH - 1, 0x140c0a);
        }
        if (style === 'machiya') {
          img.rect(nx, fy + 1, 5, 2, noren);
          chochin(nx + 6, fy + 1);
        }
        img.rect(x + 1, fy + faceH, w - 2, 1, C.stone[0]);
      },
    });
    reserveRect(x - 2, y - 2, w + 4, roofH + faceH + 4);
  };
  /** A tiny inner garden (tsubo-niwa) between townhouses: moss, a maple or a pine, a stone lantern. */
  const tsubo = (x, y, w, h) => {
    fillGround(x, y, w, h, C.moss, 51 + x, 3);
    tree(rand() < 0.5 ? 'tiny' : 'pine', x + w / 2, y + h / 2, Math.min(w, h) * 0.35 + 1);
    if (w > 8) {
      img.rect(x + 1, y + h - 3, 2, 2, C.stone[2]);
      img.set(x + 1, y + h - 3, C.stone[3]);
    }
    reserveRect(x, y, w, h);
  };
  /** Rows of machiya townhouses packed along a band, alleys between the rows, now and then a tiny garden. */
  const machiyaRows = (x0, x1, u0, u1, rh = [11, 15]) => {
    let u = u0;
    while (u < u1 - 12) {
      const roofH = rh[0] + Math.floor(rand() * (rh[1] - rh[0] + 1));
      const faceH = 4;
      const bh = roofH + faceH;
      let x = x0 - Math.floor(rand() * 4);
      while (x < x1 - 6) {
        let w = Math.min(x1 - x, 12 + Math.floor(rand() * 12));
        const fits = (ww) => !anyRes(x - 1, Y(u + bh) - 1, ww + 2, bh + 2);
        while (w >= 7 && !fits(w)) w -= 3;
        if (w >= 7) {
          if (rand() < 0.08) tsubo(x, Y(u + bh), w, bh);
          else hall(x, Y(u + bh), w, roofH, faceH, 'machiya');
          x += w + 1;
        } else x += 3;
      }
      // the stone-paved alley (roji) behind the row
      for (let xx = x0; xx < x1; xx++) if (!isRes(xx, Y(u + bh + 2))) img.set(xx, Y(u + bh + 2), (xx >> 1) % 2 ? C.stone[0] : C.stone[1]);
      u += bh + 4;
    }
  };
  /**
   * A pagoda in 3/4 view: square storeys getting smaller, each under a wide roof with lifted corners,
   * and the bronze sōrin finial with its nine rings on top.
   */
  const pagoda = (cx, uBase, tiers, opt = {}) => {
    const { w0 = 30, step = 4, floorH = 7, roofH = 6, wall = 'vermilion', ramp = C.roofTileDark } = opt;
    const y0 = Y(uBase);
    const parts = [];
    let y = y0;
    for (let i = 0; i < tiers; i++) {
      const ww = w0 - i * step;
      parts.push({ ww, wallTop: y - floorH, wallBot: y });
      y = y - floorH - roofH + 2;
    }
    const top = y;
    objects.push({
      y: y0 + 4,
      shadow: () => {
        for (const p of parts) shadowRect(Math.round(cx - p.ww / 2) + 10, p.wallTop + 8, p.ww + 8, p.wallBot - p.wallTop + roofH, 0.55);
        for (let k = 0; k < 18; k++) img.tint(Math.round(cx) + 10 + Math.floor(k * 0.5), top + 8 - k, 0.6);
      },
      draw: () => {
        img.rect(Math.round(cx - w0 / 2) - 4, y0, w0 + 8, 4, C.stone[2]);
        img.rect(Math.round(cx - w0 / 2) - 4, y0, w0 + 8, 1, C.stone[3]);
        for (let k = parts.length - 1; k >= 0; k--) {
          const { ww, wallTop, wallBot } = parts[k];
          const x0 = Math.round(cx - ww / 2);
          for (let yy = wallTop; yy < wallBot; yy++)
            for (let xx = x0; xx < x0 + ww; xx++) {
              const lx = xx - x0;
              let c;
              if (wall === 'vermilion') c = lx % 5 === 0 ? C.R2 : (yy - wallTop) % 3 === 1 && lx % 5 === 2 ? C.white : lx < 2 ? C.R1 : C.R2;
              else c = lx % 5 === 0 ? C.wood[0] : (yy - wallTop) % 3 === 1 && lx % 5 === 2 ? C.white : lx < 2 ? C.wood[3] : C.wood[2];
              if (lx === ww - 1) c = scaleColor(c, 0.7);
              img.set(xx, yy, c);
            }
        }
        for (let k = parts.length - 1; k >= 0; k--) {
          const { ww, wallTop } = parts[k];
          const above = parts[k + 1];
          const eave = wallTop + 1;
          const botW = ww + 12;
          const topW = above ? above.ww : 6;
          for (let xx = Math.round(cx - ww / 2); xx < Math.round(cx + ww / 2); xx++) img.tint(xx, eave + 1, 0.7);
          for (let j = 0; j < roofH; j++) {
            const t = j / Math.max(1, roofH - 1);
            const hw = (botW / 2) * (1 - t) ** 0.55 + (topW / 2) * (1 - (1 - t) ** 0.55);
            for (let xx = Math.round(cx - hw); xx < Math.round(cx + hw); xx++) {
              const lx = xx - (cx - hw);
              const rx = cx + hw - xx;
              img.set(xx, eave - j, lx < 3 ? ramp[3] : rx < 3 ? ramp[0] : j === 0 ? ramp[3] : (xx & 1) ? ramp[1] : ramp[2]);
            }
            if (j === 0) {
              img.set(Math.round(cx - hw) - 1, eave - 1, ramp[3]);
              img.set(Math.round(cx + hw), eave - 1, ramp[1]);
            }
          }
        }
        // the sōrin: nine bronze rings on a mast, a flame-shaped finial
        for (let j = 0; j < 16; j++) img.set(Math.round(cx), top + 2 - j, j % 2 ? 0x8a6a3a : C.gold);
        for (let j = 1; j < 16; j += 2) {
          img.set(Math.round(cx) - 1, top + 2 - j, 0x6a4a2a);
          img.set(Math.round(cx) + 1, top + 2 - j, 0x6a4a2a);
        }
        img.set(Math.round(cx), top - 14, C.goldHi);
      },
    });
    reserveRect(cx - w0 / 2 - 8, top - 16, w0 + 16, y0 - top + 22);
  };
  const tree = (kind, x, y, r) => objects.push(treeObj(kind, x, y, r));

  /**
   * The current: faint streaks of light drifting down a river in lanes between u0 and u1 (dir 1 = to the
   * right), passing under the bridges in the middle (x 76..104).
   */
  function flow(u0, u1, dir, gu) {
    const streak = (len) => {
      const out = new Raster(len, 1);
      for (let i = 0; i < len; i++) out.set(i, 0, i < 2 || i >= len - 2 ? C.river[3] : scaleColor(C.river[3], 1.2));
      return kit.frame(gradeAt(out, gu));
    };
    const f = [streak(6), streak(9), streak(7)];
    for (let u = u0, k = 0; u <= u1; u += 6, k++) {
      const sp = 5 + ((k * 7) % 5);
      for (const [a, b] of [[-12, 76], [104, 192]])
        kit.path(dir > 0 ? [[a, u], [b, u]] : [[b, u], [a, u]], [f[k % 3]], { sp, n: 2, gap: 44, turn: 'none', a: 0.75, fx: 1 });
    }
  }

  // ------------------------------------------------------------ A. Gion (u 0..540)
  {
    fillGround(0, Y(GION[1]), W, GION[1], [0x4e4a46, 0x5a5650, 0x66625a], 3, 4);
    // Hanamikōji: the stone-paved street with gutter stones, stone lanterns, maiko and rickshaws
    paving(80, Y(GION[1]), 20, GION[1]);
    for (let u = 0; u < GION[1]; u++) {
      img.set(79, Y(u), C.stone[3]);
      img.set(100, Y(u), C.stone[3]);
      img.set(78, Y(u), u % 3 ? C.stone[0] : 0x2a2626);
      img.set(101, Y(u), u % 3 ? C.stone[0] : 0x2a2626);
    }
    reserveRect(76, Y(GION[1]), 28, GION[1]);
    // live: rickshaws pulled up and down Hanamikōji
    for (const [x, s0] of [[85, 0.2], [93, 0.7]]) kit.path([[x, 30], [x, 520]], [rickshawFrame(false, 200)], { sp: 9, mode: 'pp', hold: 2, turn: 'none', fd: [rickshawFrame(false, 200)], fu: [rickshawFrame(true, 200)], s0 });
    // the Shirakawa canal across the district: stone walls, willows, the little Tatsumi bridge and shrine
    const k0 = 172;
    const k1 = 184;
    for (let u = k0; u < k1; u++)
      for (let x = 0; x < W; x++) {
        const y = Y(u);
        const n = fbm(x * 0.6, u * 2, { seed: 52, scale: 6 });
        img.set(x, y, u === k0 || u === k1 - 1 ? C.stone[2] : u === k1 - 2 ? C.stone[0] : rampColor(C.river, 0.1 + n * 0.45, x, y));
      }
    reserveRect(0, Y(k1 + 1), W, k1 - k0 + 3);
    objects.push({
      y: Y(k0) + 1,
      draw: () => {
        for (let u = k0 - 1; u <= k1; u++) for (let x = 80; x < 100; x++) img.set(x, Y(u), x === 80 || x === 99 ? C.stone[3] : (u & 1) ? C.stone[1] : C.stone[2]);
      },
    });
    for (let x = 4; x < W; x += 13) if (x < 70 || x > 110) tree('broadleaf', x + rand() * 3, Y(k1 + 5), 4.5); // willows
    hall(110, Y(k1 + 24), 14, 8, 4, 'shrine');
    // the five-storey Yasaka pagoda (Hōkan-ji) rising over the roofs of Higashiyama
    pagoda(148, 360, 5, { w0: 36, step: 5, floorH: 8, roofH: 7, wall: 'wood', ramp: C.roofTileDark });
    // Ichiriki-tei: the famous teahouse with red walls on the corner
    {
      const x = 104;
      const y = Y(80);
      objects.push({
        y: y + 30,
        shadow: () => shadowRect(x + 4, y + 4, 40, 30, 0.5),
        draw: () => {
          for (let yy = y; yy < y + 20; yy++)
            for (let xx = x; xx < x + 40; xx++) {
              const t = Math.abs(yy - (y + 7));
              img.set(xx, yy, (xx - x) < 6 - t * 0.5 ? C.roofTile[3] : x + 40 - xx < 6 - t * 0.5 ? C.roofTile[0] : yy < y + 7 ? C.roofTile[2] : (xx & 1) ? C.roofTile[1] : C.roofTile[2]);
            }
          img.rect(x + 4, y + 7, 32, 1, 0x95a0b2);
          for (let yy = y + 20; yy < y + 30; yy++) for (let xx = x + 1; xx < x + 39; xx++) img.set(xx, yy, yy === y + 20 ? 0x15100c : (xx - x) % 6 === 0 ? 0x5a1a14 : (yy - y) % 3 === 0 ? 0x8a2a20 : 0xb83a2a);
          img.rect(x + 16, y + 24, 8, 6, 0x2a1810);
          img.rect(x + 16, y + 24, 8, 2, 0xe8e0d0);
          chochin(x + 14, y + 22);
          chochin(x + 25, y + 22);
        },
      });
      reserveRect(x - 2, y - 2, 44, 34);
    }
    // Yasaka shrine's vermilion west gate closing the street at the top
    hall(54, Y(536), 72, 24, 12, 'gate');
    lantern(48, Y(500));
    lantern(130, Y(500));
    machiyaRows(0, 76, 4, k0 - 2);
    machiyaRows(104, W, 4, k0 - 2);
    machiyaRows(0, 76, k1 + 4, 494);
    machiyaRows(104, W, k1 + 4, 494);
    for (let u = 12; u < 520; u += 30) {
      if (u > k0 - 6 && u < k1 + 6) continue;
      lantern(81, Y(u));
      lantern(96, Y(u + 15));
    }
    crowd(82, Y(530), 16, 520, 150, true, 0.4);
    for (const u of [60, 230, 320, 450]) rickshaw(84 + (u % 3 ? 7 : 0), Y(u));
    for (const [x, u] of [[90, 130], [86, 280], [92, 400]]) objects.push(umbrella(x, Y(u), 0xe8452a, 0xb83018));
  }

  // ------------------------------------------------------------ B. the Kamo river (u 540..650)
  {
    const w0 = 556;
    const w1 = 628;
    for (let u = KAMO[0]; u < KAMO[1]; u++) {
      const y = Y(u);
      for (let x = 0; x < W; x++) {
        if (u < w0 || u > w1) {
          // sandy riverside walks
          img.set(x, y, rampColor([0x6a6050, 0x7a705e, 0x8a806c], fbm(x, u, { seed: 23, scale: 4 }), x, y));
          if (u === w0 - 1 || u === w1 + 1) img.set(x, y, C.stone[1]);
          continue;
        }
        const n = fbm(x * 0.5, y * 1.6, { seed: 21, scale: 10, octaves: 3 });
        let c = rampColor(C.river, 0.15 + n * 0.55, x, y);
        if (n > 0.66 && (x + y) % 3 === 0) c = C.river[3];
        if (u > w1 - 2) c = scaleColor(C.river[0], 0.7);
        img.set(x, y, c);
      }
    }
    for (let i = 0; i < 60; i++) img.set(Math.floor(rand() * W), Y(w0 + 1 + Math.floor(rand() * (w1 - w0 - 2))), rand() < 0.5 ? 0xf0b8c8 : 0xd88aa4);
    reserveRect(0, Y(KAMO[1]), W, KAMO[1] - KAMO[0]);
    flow(w0 + 4, w1 - 4, 1, 600);
    // the turtle stepping stones across the river
    for (let u = w0 + 3; u < w1 - 2; u += 7) {
      const x = 30 + ((u / 7) % 2 ? 2 : 0);
      const y = Y(u);
      img.ellipse(x, y, 3, 2.2, C.stone[2]);
      img.ellipse(x - 0.5, y - 0.5, 2, 1.4, C.stone[3]);
      img.set(x, y - 3, C.stone[2]);
      for (const [dx, dy] of [[-3, -1], [3, -1], [-3, 2], [3, 2]]) img.set(x + dx, y + dy, C.stone[1]);
    }
    crowd(26, Y(w1), 8, w1 - w0, 6, true);
    // Shijō bridge with its lamp posts
    objects.push({
      y: Y(KAMO[0] - 4),
      shadow: () => shadowRect(80, Y(w1) + 3, 26, w1 - w0, 0.55),
      draw: () => {
        for (let u = KAMO[0] - 4; u <= KAMO[1] + 4; u++) {
          const y = Y(u);
          for (let x = 79; x <= 101; x++) img.set(x, y, x === 79 || x === 101 ? C.stone[3] : x === 80 || x === 100 ? C.stone[2] : u % 3 ? C.stone[1] : C.stone[0]);
          if (u % 12 === 0) {
            img.rect(78, y, 3, 2, C.stone[0]);
            img.rect(100, y, 3, 2, C.stone[0]);
            glow(79, y - 1, 0xfff0c8, 0.7);
            glow(101, y - 1, 0xfff0c8, 0.7);
          }
        }
      },
    });
    crowd(81, Y(KAMO[1] + 4), 18, KAMO[1] - KAMO[0] + 8, 30, true, 0.2);
    // Pontochō's summer terraces (noryō-yuka) along the south bank, lanterns and diners
    for (const [x0, x1] of [[2, 74], [106, 178]])
      objects.push({
        y: Y(w0) + 1,
        draw: () => {
          for (let u = KAMO[0]; u < w0 + 6; u++)
            for (let x = x0; x < x1; x++) img.set(x, Y(u), u >= w0 + 4 ? C.wood[1] : (x - x0) % 12 === 0 ? C.wood[0] : u % 2 ? C.hinoki[1] : C.hinoki[2]);
          for (let x = x0 + 2; x < x1 - 2; x += 6) {
            img.rect(x, Y(KAMO[0] + 8), 3, 2, C.wood[0]);
            chochin(x + 1, Y(w0 + 3), 0xf0e0c0);
          }
        },
      });
    crowd(2, Y(w0 + 2), 72, 12, 24, true);
    crowd(106, Y(w0 + 2), 72, 12, 24, true);
    // couples sitting along the north bank, evenly spaced as they famously do
    for (let x = 4; x < W; x += 9) {
      if (x > 74 && x < 106) continue;
      img.set(x, Y(w1 + 4), rand.pick([0xd04040, 0x3a6ad0, 0xe8e8f0, 0x3a3a4a]));
      img.set(x + 1, Y(w1 + 4), rand.pick([0xe86a9a, 0xe8c040, 0x3a3a4a]));
      img.set(x, Y(w1 + 5), 0x2a2024);
      img.set(x + 1, Y(w1 + 5), 0x2a2024);
    }
    // a heron fishing in the shallows
    for (const [x, u] of [[140, 600], [56, 572]]) {
      img.rect(x, Y(u), 2, 3, 0xf0f0ec);
      img.set(x + 2, Y(u), 0xe8c040);
    }
    for (let x = 4; x < W; x += 16) {
      if (x > 64 && x < 112) continue;
      tree('sakura', x + rand() * 4, Y(KAMO[1] + 6 + rand() * 4), 7 + rand() * 2);
    }
  }

  // ------------------------------------------------------------ C. the approach to Fushimi Inari (u 650..1130)
  {
    fillGround(0, Y(SANDO[1]), W, SANDO[1] - SANDO[0], C.gravel, 4, 8);
    paving(70, Y(SANDO[1]), 40, SANDO[1] - SANDO[0]);
    reserveRect(64, Y(SANDO[1]), 52, SANDO[1] - SANDO[0]);
    for (let u = 660; u < 1110; u += 36) {
      lantern(62, Y(u));
      lantern(115, Y(u));
    }
    greatTorii(90, Y(1010), 24);
    gateSmall(90, Y(720), 12);
    // souvenir shops and food stalls (fox masks, inari-zushi) along the approach
    machiyaRows(22, 58, 664, 1112, [10, 12]);
    machiyaRows(122, 158, 664, 1112, [10, 12]);
    for (let u = 670; u < 1110; u += 22) {
      for (const x of [59, 119]) {
        if (isRes(x, Y(u))) continue;
        img.rect(x, Y(u), 3, 4, C.wood[2]);
        img.set(x + 1, Y(u) + 1, (u >> 1) % 2 ? 0xf0ece0 : C.R1); // fox masks on display
        img.set(x + 1, Y(u) + 2, C.R1);
      }
    }
    for (let u = SANDO[0] - 10; u < SANDO[1]; u += 1) {
      img.set(20, Y(u), C.stone[2]);
      img.set(21, Y(u), C.stone[0]);
      img.set(159, Y(u), C.stone[2]);
      img.set(160, Y(u), C.stone[0]);
    }
    reserveRect(18, Y(1120), 6, 480);
    reserveRect(157, Y(1120), 6, 480);
    crowd(72, Y(1125), 36, 470, 110, true, 0.15);
    for (const [x, u] of [[40, 690], [140, 760], [34, 900], [146, 1040]]) objects.push(umbrella(x, Y(u)));
  }

  // ------------------------------------------------------------ D. Fushimi Inari shrine (u 1130..1830)
  {
    fillGround(14, Y(1830), 152, 700, C.gravel, 6, 8);
    paving(82, Y(1830), 16, 700);
    reserveRect(10, Y(1830), 160, 700);
    for (let u = 1130; u < 1830; u++)
      for (const x of [12, 167]) {
        img.set(x, Y(u), u % 4 === 0 ? C.K : C.R1);
        img.set(x + 1, Y(u), C.R2);
      }
    hall(46, Y(1214), 88, 52, 11, 'gate'); // Rōmon
    fox(64, Y(1142), false);
    fox(111, Y(1142), true);
    lantern(74, Y(1260));
    lantern(103, Y(1260));
    for (let u = 1218; u < 1830; u += 3) for (let x = 15; x < 166; x++) if (x < 81 || x > 98) img.tint(x, Y(u), 0.9);
    hall(22, Y(1352), 40, 26, 7, 'shrine');
    hall(118, Y(1432), 40, 26, 7, 'shrine');
    hall(112, Y(1298), 18, 10, 4, 'shrine');
    img.rect(115, Y(1284), 12, 3, C.stone[3]);
    img.rect(116, Y(1283), 10, 1, C.water[2]);
    // ema plaques and omikuji fortunes tied to their racks
    for (const [x0, u] of [[28, 1420], [130, 1500], [26, 1610]])
      objects.push({
        y: Y(u) + 6,
        shadow: () => shadowRect(x0 + 2, Y(u) + 2, 26, 6, 0.6),
        draw: () => {
          img.rect(x0, Y(u), 26, 1, C.wood[1]);
          for (let i = 0; i < 8; i++) img.rect(x0 + 1 + i * 3, Y(u) + 1, 2, 3, i % 3 ? 0xd8c49a : 0xc8b080);
          img.rect(x0, Y(u) + 4, 26, 1, C.wood[0]);
          for (let i = 0; i < 12; i++) img.set(x0 + 1 + i * 2, Y(u) + 5, 0xf4f0e6);
        },
      });
    for (let u = 1748; u < 1815; u += 20) {
      hall(16, Y(u + 12), 10, 7, 3, 'shrine');
      hall(154, Y(u + 12), 10, 7, 3, 'shrine');
    }
    for (const [kind, x, u, r] of [
      ['sakura', 28, 1240, 9],
      ['pine', 30, 1460, 8],
      ['sakura', 151, 1262, 9],
      ['pine', 151, 1350, 7],
      ['sakura', 22, 1530, 9],
      ['sakura', 158, 1536, 9],
    ])
      tree(kind, x, Y(u), r);
    for (let u = 1270; u < 1490; u += 30) {
      lantern(76, Y(u), true);
      lantern(101, Y(u), true);
    }
    // walls of sake barrels offered to the shrine, and rows of donated stone lanterns
    for (const [x0, u0] of [[16, 1290], [128, 1600]])
      objects.push({
        y: Y(u0) + 12,
        shadow: () => shadowRect(x0 + 3, Y(u0 + 6), 36, 14, 0.55),
        draw: () => {
          img.rect(x0, Y(u0 + 6), 34, 2, C.wood[1]);
          for (let r = 0; r < 3; r++)
            for (let b = 0; b < 8; b++) {
              const bx = x0 + 1 + b * 4 + (r % 2) * 2;
              const by = Y(u0 + 4) + r * 4;
              const c = rand.pick([0xe8e0d0, 0xd8402a, 0x2a4a8a, 0xe8c040, 0x2a6a3a]);
              img.rect(bx, by, 4, 4, c);
              img.rect(bx, by + 3, 4, 1, scaleColor(c, 0.7));
              img.set(bx + 1, by + 1, 0x1a1a1a);
            }
        },
      });
    for (let u = 1600; u < 1700; u += 9) {
      lantern(68, Y(u));
      lantern(110, Y(u));
    }
    // red nobori banners lining the walk, foxes with keys and jewels in their mouths
    // (live) they flutter: the cloth blown out to the side and back
    const banner = [0, 1, 2].map((f) => {
      const out = new Raster(3, 5);
      out.rect(0, 0, 1, 4, C.R1);
      out.set(0, 1, 0xf4f0e6);
      if (f) {
        out.set(1, f === 1 ? 1 : 2, C.R1);
        out.set(1, f === 1 ? 2 : 3, scaleColor(C.R1, 0.8));
      }
      return kit.frame(gradeAt(out, 1360));
    });
    for (let u = 1222; u < 1500; u += 6)
      for (const x of [79, 100]) {
        if (pads.some((p) => Math.hypot(p.x - x, Y(p.u) - Y(u)) < 14)) continue;
        img.set(x + 1, Y(u) + 4, 0x101418, 0.5);
        kit.loop(x, u, banner, { seq: [0, 1, 2, 1], fps: 3 });
      }
    for (const [x, u] of [[30, 1250], [146, 1250], [30, 1500], [146, 1520]]) fox(x, Y(u), x > 90);
    // the kagura stage where the shrine maidens dance
    {
      const x = 126;
      const y = Y(1384);
      img.rect(x, y, 30, 18, C.hinoki[2]);
      for (let yy = y; yy < y + 18; yy += 3) img.rect(x, yy, 30, 1, C.hinoki[1]);
      img.rect(x, y, 30, 1, C.R2);
      for (const px of [x, x + 29]) img.rect(px, y, 1, 18, C.R1);
      img.set(x + 12, y + 8, 0xf0f0ec);
      img.set(x + 12, y + 9, C.R1);
      img.set(x + 17, y + 8, 0xf0f0ec);
      img.set(x + 17, y + 9, C.R1);
      reserveRect(x - 1, y - 1, 32, 20);
    }
    hall(34, Y(1572), 112, 50, 10, 'shrine'); // honden
    hall(72, Y(1508), 36, 12, 0, 'shrine');
    path(1600, 1700, () => 90, 8, 'stairs');
    hall(24, Y(1690), 34, 20, 6, 'shrine');
    hall(124, Y(1740), 34, 20, 6, 'shrine');
    fox(76, Y(1716), false);
    fox(100, Y(1716), true);
    gateSmall(90, Y(1770), 9);
    gateSmall(90, Y(1806), 9);
    for (let k = 0; k < 260; k++) {
      // visitors all over the courtyard, kept off the turret pads
      const x = 16 + rand() * 148;
      const u = 1136 + rand() * 690;
      if (pads.some((p) => Math.hypot(p.x - x, p.u - u) < 12)) continue;
      crowd(x, Y(u), 1, 1, 1, true, 0.12);
    }
    // sacred trees bound with shimenawa ropes and paper streamers
    for (const [x, u] of [[48, 1300], [140, 1660]]) {
      tree('broadleaf', x, Y(u), 8);
      for (let a = 0; a < Math.PI * 2; a += 0.4) img.set(Math.round(x + Math.cos(a) * 3), Math.round(Y(u) + 6 + Math.sin(a) * 1.5), 0xe8d8a0);
      img.set(x, Y(u) + 8, 0xffffff);
    }
    crowd(83, Y(1600), 14, 470, 80, true, 0.15);
  }

  // ------------------------------------------------------------ E. Senbon torii on the ridge (u 1830..2700)
  {
    const split = (u) => 11 * smooth(2140, 2220, u) * (1 - smooth(2500, 2580, u));
    path(TORII[0], TORII[1], pathX, 6);
    tunnel(1840, 2140, pathX, 6, 11);
    path(2140, 2580, (u) => pathX(u) - split(u), 5);
    path(2140, 2580, (u) => pathX(u) + split(u), 5);
    tunnel(2144, 2576, (u) => pathX(u) - split(u), 5, 12);
    tunnel(2144, 2576, (u) => pathX(u) + split(u), 5, 13);
    for (let u = 2230; u < 2490; u++) reserveRect(pathX(u) - 4, Y(u), 9, 1);
    tunnel(2580, 2690, pathX, 6, 14);
    // stone monuments with offering torii on the slopes
    for (const side of [-1, 1])
      for (let u = 1900; u < 2660; u += 9 + Math.floor(rand() * 6)) {
        const x = Math.round(pathX(u) + side * (16 + rand() * 24));
        const y = Y(u);
        if (isRes(x, y) || !img.alpha(x, y) || rand() < 0.4) continue;
        otsuka(x, y, 3 + Math.floor(rand() * 3), 4 + Math.floor(rand() * 5));
        if (rand() < 0.6) miniGate(x + 2, y + 6, 2 + Math.floor(rand() * 2));
      }
  }

  // ------------------------------------------------------------ F. Arashiyama (u 2700..3500)
  {
    const [a0] = ARASHI;
    fillGround(0, Y(3260), W, 3260 - a0, C.bambooFloor, 31, 5);
    // the path through the bamboo grove, low brushwood fences on both sides
    const bx = (u) => 90 + 10 * Math.sin((u - a0) / 80);
    path(a0, 3262, bx, 6);
    for (let u = a0; u < 3262; u++)
      for (const s of [-1, 1]) {
        const x = Math.round(bx(u) + s * 8);
        img.set(x, Y(u), u % 6 === 0 ? 0x5a4428 : 0xb89a68);
        img.set(x + s, Y(u), 0x8a6e44);
        reserveRect(x - 1, Y(u), 3, 1);
      }
    for (const u of [2780, 3180]) rickshaw(Math.round(bx(u)) - 2, Y(u));
    // live: a rickshaw taking its passengers along the winding path
    {
      const pts = [];
      for (let u = a0 + 20; u <= 3240; u += 16) pts.push([Math.round(bx(u)), u]);
      kit.path(pts, [rickshawFrame(false, 2990)], { sp: 8, mode: 'pp', hold: 3, turn: 'none', fd: [rickshawFrame(false, 2990)], fu: [rickshawFrame(true, 2990)], s0: 0.45 });
    }
    crowd(84, Y(3260), 12, 560, 90, true, 0.25);
    // Nonomiya shrine: the black torii of unbarked wood, a little hall, a moss garden
    fillGround(126, Y(2990), 50, 70, C.moss, 32, 4);
    reserveRect(124, Y(2992), 54, 74);
    gateSmall(150, Y(2934), 9, true);
    hall(132, Y(2984), 34, 16, 5, 'hondo');
    // the south bank promenade and the Katsura river with Togetsukyō bridge
    fillGround(0, Y(3330), W, 70, C.gravel, 33, 6);
    for (let u = 3330; u < 3440; u++)
      for (let x = 0; x < W; x++) {
        const y = Y(u);
        const n = fbm(x * 0.5, y * 1.6, { seed: 34, scale: 12, octaves: 3 });
        let c = rampColor(C.river, 0.2 + n * 0.55, x, y);
        if (n > 0.68 && (x + y) % 3 === 0) c = C.river[3];
        if (u > 3436) c = scaleColor(C.river[0], 0.7);
        if (u < 3333) c = C.stone[1];
        img.set(x, y, c);
      }
    reserveRect(0, Y(3440), W, 110);
    flow(3338, 3432, -1, 3390);
    objects.push({
      y: Y(3326),
      shadow: () => shadowRect(84, Y(3440) + 3, 16, 110, 0.55),
      draw: () => {
        for (let u = 3326; u <= 3446; u++) {
          const y = Y(u);
          for (let x = 82; x <= 98; x++) img.set(x, y, x === 82 || x === 98 ? C.wood[0] : x === 83 || x === 97 ? C.wood[2] : u % 2 ? C.hinoki[0] : C.hinoki[1]);
          if (u % 8 === 0) {
            img.set(81, y, C.wood[0]);
            img.set(99, y, C.wood[0]);
          }
        }
      },
    });
    crowd(84, Y(3446), 12, 120, 30, true, 0.2);
    // boats on the Katsura (live): a roofed pleasure boat and rowing boats going to and fro, wakes behind
    for (const [x, u, roofed, x1] of [[30, 3360, true, 60], [130, 3410, false, 158], [110, 3350, false, 158], [8, 3420, false, 62]]) {
      const y = Y(u);
      const f = roofed
        ? capture(x, y - 1, 18, 8, () => {
            img.rect(x, y, 18, 7, 0x6a4a30);
            img.rect(x + 1, y - 1, 16, 5, C.roofTileDark[1]);
            img.rect(x + 2, y + 4, 14, 2, 0xe8d8b0);
            chochin(x + 3, y + 5);
            chochin(x + 14, y + 5);
          })
        : capture(x, y + 1, 10, 4, () => {
            img.rect(x, y + 1, 10, 4, 0x7a5232);
            img.set(x + 4, y + 2, 0x3a3a4a);
            img.set(x + 6, y + 2, 0xd04040);
          });
      const wakeF = [0, 1, 2].map((k) => {
        const w = new Raster(1, (roofed ? 9 : 5) + k * 4);
        w.set(0, 0, 0xd8e8e8);
        w.set(0, w.h - 1, 0xd8e8e8);
        return kit.frame(gradeAt(w, u));
      });
      kit.path([[x + (roofed ? 9 : 5), u - 3], [x1, u - 3]], [f], { sp: roofed ? 3 : 5, mode: 'pp', hold: roofed ? 4 : 2, turn: 'none', wake: { f: wakeF, every: 3, life: 1.6 } });
    }
    // the north bank: cherries, a tea house with red benches and parasols
    fillGround(0, Y(ARASHI[1]), W, 60, C.gravel, 35, 6);
    hall(110, Y(3492), 40, 14, 5, 'machiya');
    img.rect(112, Y(3470), 14, 2, C.R1);
    tree('sakura', 20, Y(3460), 8);
    tree('sakura', 60, Y(3470), 8);
    objects.push(umbrella(152, Y(3466)));
    crowd(4, Y(3496), 172, 50, 40, false, 0.2);
  }

  // ------------------------------------------------------------ G. Kinkaku-ji (u 3500..4400)
  {
    fillGround(0, Y(KINKAKU[1]), W, KINKAKU[1] - KINKAKU[0], C.moss, 36, 4);
    // the clay wall round the temple grounds
    for (let u = KINKAKU[0] + 4; u < KINKAKU[0] + 10; u++) for (let x = 0; x < W; x++) if (x < 132 || x > 148) img.set(x, Y(u), u > KINKAKU[0] + 7 ? C.roofTileDark[(x & 1) + 1] : rampColor(C.earthWall, fbm(x, u * 3, { seed: 46, scale: 3 }), x, Y(u)));
    reserveRect(0, Y(KINKAKU[0] + 10), W, 6);
    // the gravel walk round the pond
    path(KINKAKU[0], 4380, () => 140, 5);
    for (let u = 3980; u < 4010; u++) for (let x = 100; x < 140; x++) img.set(x, Y(u), rampColor(C.gravel, 0.5, x, Y(u)));
    reserveRect(100, Y(4010), 40, 30);
    // Kyōko-chi, the mirror pond, with its islands of pines and rocks
    pondAt(60, 3790, 52, 96, C.pond, 37, C.stone);
    for (const [ix, iu, ir] of [[40, 3770, 9], [84, 3730, 6], [30, 3830, 5], [92, 3820, 4], [58, 3716, 4]]) {
      img.disc(ix, Y(iu), ir, C.stone[1]);
      img.disc(ix - 1, Y(iu) - 1, ir - 1.5, C.moss[2]);
      tree('pine', ix, Y(iu) - 1, ir * 0.7 + 1.5);
    }
    for (let k = 0; k < 16; k++) {
      const x = 20 + rand() * 80;
      const y = Y(3700 + rand() * 180);
      if (((x - 60) / 50) ** 2 + ((y - Y(3790)) / 90) ** 2 > 0.85) continue;
      img.disc(x, y, 1.3, C.stone[2]);
      img.set(Math.round(x) - 1, Math.round(y) - 1, C.stone[3]);
    }
    // the Golden Pavilion on the north shore, and its reflection in the pond
    {
      const cx = 60;
      const y0 = Y(3880);
      const floors = [
        [56, 12, 'wood'],
        [50, 11, 'gold'],
        [34, 10, 'gold'],
      ];
      const roofH = [8, 8, 11];
      const parts = [];
      let y = y0;
      for (let i = 0; i < floors.length; i++) {
        const [ww, fh, st] = floors[i];
        parts.push({ ww, st, wallTop: y - fh, wallBot: y });
        y = y - fh - roofH[i] + 2;
      }
      const top = y;
      ripple = { x0: cx - 36, x1: cx + 36, y0: y0 + 6, y1: y0 + (y0 - top) + 3 };
      objects.push({
        y: y0 + 2,
        shadow: () => {
          for (const p of parts) shadowRect(Math.round(cx - p.ww / 2) + 8, p.wallTop + 6, p.ww + 6, p.wallBot - p.wallTop + 6, 0.55);
        },
        draw: () => {
          for (let k = parts.length - 1; k >= 0; k--) {
            const { ww, st, wallTop, wallBot } = parts[k];
            const x0 = Math.round(cx - ww / 2);
            for (let yy = wallTop; yy < wallBot; yy++)
              for (let xx = x0; xx < x0 + ww; xx++) {
                const lx = xx - x0;
                let c;
                if (st === 'gold') {
                  c = lx < 3 ? C.goldHi : lx > ww - 3 ? 0xa87a22 : (lx + yy) % 7 === 0 ? 0xf8d870 : C.gold;
                  if ((yy - wallTop) % 4 === 2 && lx % 5 === 2) c = 0x6a4a1a;
                } else {
                  c = lx % 5 === 0 ? C.wood[1] : (yy - wallTop) % 4 < 2 ? C.white : C.hinoki[1];
                  if (lx > ww - 3) c = scaleColor(c, 0.75);
                }
                img.set(xx, yy, c);
              }
            // the balcony rail round the upper storeys
            if (st === 'gold') for (let xx = x0 - 1; xx <= x0 + ww; xx++) img.set(xx, wallBot - 1, (xx & 1) ? 0x8a6a2a : C.goldHi);
          }
          for (let k = parts.length - 1; k >= 0; k--) {
            const { ww, wallTop } = parts[k];
            const above = parts[k + 1];
            const rh = roofH[k];
            const eave = wallTop + 1;
            const botW = ww + 10;
            const topW = above ? above.ww : 4;
            for (let xx = Math.round(cx - ww / 2); xx < Math.round(cx + ww / 2); xx++) img.tint(xx, eave + 1, 0.7);
            for (let j = 0; j < rh; j++) {
              const t = j / Math.max(1, rh - 1);
              const hw = (botW / 2) * (1 - t) ** 0.6 + (topW / 2) * (1 - (1 - t) ** 0.6);
              for (let xx = Math.round(cx - hw); xx < Math.round(cx + hw); xx++) {
                const lx = xx - (cx - hw);
                const rx = cx + hw - xx;
                img.set(xx, eave - j, lx < 3 ? C.roofBark[3] : rx < 3 ? C.roofBark[0] : j === 0 ? 0x8a7468 : (xx & 1) ? C.roofBark[1] : C.roofBark[2]);
              }
              if (j === 0) {
                img.set(Math.round(cx - hw) - 1, eave - 1, C.roofBark[3]);
                img.set(Math.round(cx + hw), eave - 1, C.roofBark[1]);
              }
            }
          }
          // the golden phoenix on the top
          img.set(cx, top + 1, C.gold);
          img.set(cx, top, C.goldHi);
          img.set(cx - 1, top - 1, C.gold);
          img.set(cx + 1, top - 1, C.gold);
          img.set(cx, top - 2, C.goldHi);
          // the reflection: the pavilion mirrored in the water below, rippling
          for (let k = 1; k < y0 - top + 4; k++) {
            const ry = y0 + k;
            const sy = y0 - k;
            const ox = Math.round(Math.sin(k * 0.9) * 1.2);
            for (let xx = cx - 36; xx <= cx + 36; xx++) {
              const i = img.idx(xx, ry);
              const si = img.idx(xx + ox, sy);
              if (i < 0 || si < 0 || !isRes(xx, ry)) continue;
              const [r, g, b] = [img.data[si], img.data[si + 1], img.data[si + 2]];
              const bright = r + g + b > 330;
              if (!bright || (k + xx) % 3 === 0) continue;
              img.set(xx, ry, (r << 16) | (g << 8) | b, 0.42 * (1 - k / (y0 - top + 6)));
            }
          }
        },
      });
      reserveRect(cx - 36, top - 4, 72, y0 - top + 8);
      // the jetty in front, stone lanterns, the Ryūmon falls with the carp stone
      for (let x = cx - 6; x < cx + 6; x++) for (let j = 1; j < 6; j++) img.set(x, y0 + j, (x & 1) ? C.hinoki[1] : C.hinoki[0]);
    }
    for (const [x, u] of [[16, 3900], [104, 3896], [110, 3720], [10, 3700]]) lantern(x, Y(u));
    // koi gliding about Kyōko-chi (live)
    for (const [body, tail] of [[0xf06a20, 0xc84a18], [0xf8f4f0, 0xe83a2a], [0xf0b030, 0xc88a20]]) {
      const koi = (flick) => {
        const out = new Raster(4, 3);
        out.rect(1, 1, 3, 1, body);
        out.set(3, 1, scaleColor(body, 1.1));
        out.set(0, flick ? 0 : 2, tail);
        out.set(0, 1, tail);
        return kit.frame(gradeAt(out, 3760));
      };
      kit.wander(68, 3790, 13, 18, [koi(false), koi(true)], { n: 1, sp: 4, idle: 0.3, fps: 3 });
    }
    // the Sōmon entrance gate in the clay wall, the bell tower, the approach
    hall(126, Y(3540), 28, 14, 7, 'temple');
    hall(20, Y(3590), 22, 14, 6, 'temple');
    crowd(132, Y(3600), 16, 60, 30, true, 0.15);
    {
      const x = 106;
      const y = Y(3800);
      img.rect(x, y, 10, 4, C.stone[0]);
      for (let j = 4; j < 12; j++) img.set(x + 5, y + j, j % 2 ? 0xe8f4f8 : 0xb8d8e8);
      img.disc(x + 5, y + 12, 1.5, C.stone[2]);
      reserveRect(x - 1, y - 1, 12, 15);
    }
    // the Sekka-tei tea house, the abbot's hall, visitors on the walks
    hall(130, Y(4168), 30, 12, 5, 'hondo');
    hall(10, Y(4296), 64, 20, 7, 'temple');
    crowd(135, Y(4380), 10, 870, 70, true, 0.15);
    crowd(100, Y(4008), 40, 26, 30, true, 0.15);
  }

  // ------------------------------------------------------------ H. Ryōan-ji (u 4400..5000)
  {
    fillGround(0, Y(RYOAN[1]), W, RYOAN[1] - RYOAN[0], C.moss, 38, 7);
    path(RYOAN[0], 4690, () => 152, 5, 'gravel');
    // Kyōyōchi pond on the way in, with water lilies
    pondAt(80, 4490, 28, 46, C.pond, 39, C.stone);
    for (let k = 0; k < 18; k++) {
      const x = 60 + rand() * 40;
      const y = Y(4450 + rand() * 80);
      if (((x - 80) / 24) ** 2 + ((y - Y(4490)) / 40) ** 2 > 0.8) continue;
      img.disc(x, y, 1.6, 0x3f7a3a);
      img.set(Math.round(x), Math.round(y), k % 4 ? 0x6aa050 : 0xf8c8d8);
    }
    // the rock garden: raked white gravel, fifteen rocks in five mossy groups, the clay wall
    const gx0 = 22;
    const gx1 = 160;
    const gu0 = 4704;
    const gu1 = 4846;
    const rocks = [
      [46, 4800, [5, 3.5, 3, 2.5, 2]],
      [78, 4766, [4, 2.5]],
      [104, 4810, [4.5, 3, 2.5]],
      [128, 4758, [3.5, 2.5]],
      [146, 4806, [4, 3, 2.5]],
    ];
    for (let u = gu0; u < gu1; u++)
      for (let x = gx0; x < gx1; x++) {
        let ring = Infinity;
        for (const [rx, ru] of rocks) ring = Math.min(ring, Math.hypot((x - rx) * 0.9, (u - ru) * 1.2));
        const raked = ring < 22 ? Math.floor(ring) % 2 === 0 : (u >> 0) % 2 === 0;
        img.set(x, Y(u), raked ? C.whiteGravel[1] : C.whiteGravel[3]);
      }
    for (const [rx, ru, sizes] of rocks) {
      for (let y = Y(ru) - 9; y <= Y(ru) + 9; y++)
        for (let x = rx - 11; x <= rx + 11; x++) if (Math.hypot((x - rx) * 0.9, (y - Y(ru)) * 1.2) < 9 && fbm(x, y, { seed: 40, scale: 2 }) > 0.35) img.set(x, y, rampColor(C.moss, 0.4 + fbm(x, y, { seed: 41, scale: 2 }) * 0.5, x, y));
      sizes.forEach((s, i) => {
        const a = i * 2.2;
        const x = rx + (i ? Math.cos(a) * (4 + i) : 0);
        const y = Y(ru) + (i ? Math.sin(a) * (3 + i) : 0);
        img.disc(x + 1, y + 1, s, 0x3a3830);
        img.disc(x, y, s, C.stone[1]);
        img.disc(x - s * 0.3, y - s * 0.3, s * 0.55, C.stone[2]);
        img.set(Math.round(x - s * 0.5), Math.round(y - s * 0.5), C.stone[3]);
      });
    }
    // the clay wall along the south and west sides, its face streaked by oil seeping from the clay
    for (let u = gu0 - 8; u < gu0; u++)
      for (let x = gx0 - 4; x < gx1; x++) img.set(x, Y(u), u >= gu0 - 2 ? C.roofTileDark[(x & 1) + 1] : rampColor(C.earthWall, fbm(x, u * 3, { seed: 42, scale: 3 }), x, Y(u)));
    for (let u = gu0; u < gu1; u++) {
      img.rect(gx0 - 4, Y(u), 2, 1, C.roofTileDark[2]);
      img.rect(gx0 - 2, Y(u), 2, 1, C.earthWall[0]);
    }
    reserveRect(gx0 - 4, Y(gu1), gx1 - gx0 + 4, gu1 - gu0 + 8);
    // the abbot's hall: visitors sitting on the veranda, looking at the garden
    for (let u = gu1; u < gu1 + 8; u++) for (let x = gx0; x < gx1; x++) img.set(x, Y(u), (x + u) % 5 === 0 ? C.hinoki[0] : C.hinoki[2]);
    for (let x = gx0 + 2; x < gx1 - 2; x += 3) if (rand() < 0.7) crowd(x, Y(gu1 + 3), 1, 2, 1, true);
    reserveRect(gx0, Y(gu1 + 8), gx1 - gx0, 8);
    hall(gx0, Y(4892), gx1 - gx0, 30, 8, 'temple');
    crowd(146, Y(4690), 12, 290, 40, true, 0.1);
  }

  // ------------------------------------------------------------ I. Kiyomizu-dera (u 5000..6300)
  {
    fillGround(0, Y(5420), W, 420, [0x3a3634, 0x46423e, 0x524e48], 43, 4);
    // Sannenzaka: stone steps winding up between shops
    const sx = (u) => 90 + 16 * Math.sin((u - 5000) / 60);
    path(5000, 5400, sx, 7, 'stairs');
    for (let u = 5000; u < 5400; u++) {
      const c = sx(u);
      for (const s of [-1, 1]) img.set(Math.round(c + s * 8), Y(u), C.stone[3]);
    }
    machiyaRows(0, 180, 5004, 5396, [11, 14]);
    // pottery shops: kiyomizu-yaki laid out on tables in front
    for (let u = 5016; u < 5390; u += 14)
      for (const s of [-1, 1]) {
        const x = Math.round(sx(u) + s * 11);
        if (isRes(x, Y(u)) && !isRes(x, Y(u) + 3)) continue;
        for (let k = 0; k < 4; k++) img.set(x + k, Y(u), rand.pick([0x3a6aa8, 0xe8e0d0, 0x5a8a6a, 0xa86a3a, 0x2a2a3a]));
      }
    for (let u = 5010; u < 5395; u += 20) {
      chochin(Math.round(sx(u)) - 8, Y(u), 0xe8452a);
      chochin(Math.round(sx(u + 10)) + 8, Y(u + 10), 0xe8452a);
    }
    crowd(70, Y(5400), 40, 400, 140, false, 0.35);
    for (const u of [5080, 5260]) objects.push(umbrella(Math.round(sx(u)) + 10, Y(u), 0x2a4a8a, 0x1a2a5a));
    // the gate courtyard: the vermilion Niōmon, the west gate, the three-storey pagoda
    fillGround(0, Y(5560), W, 140, C.gravel, 44, 6);
    path(5400, 5426, () => 90, 10, 'stairs');
    hall(58, Y(5470), 64, 24, 10, 'gate'); // Niōmon
    fox(68, Y(5432), false); // the komainu guardians (stone lions) in front of it
    fox(108, Y(5432), true);
    hall(14, Y(5520), 34, 16, 8, 'gate'); // Saimon
    hall(110, Y(5536), 18, 12, 6, 'shrine'); // the bell tower
    for (let u = 5440; u < 5550; u += 18) {
      lantern(52, Y(u));
      lantern(126, Y(u));
    }
    pagoda(146, 5500, 3, { w0: 26, step: 4, floorH: 7, roofH: 6, wall: 'vermilion', ramp: C.roofTileDark });
    crowd(4, Y(5556), 172, 80, 70, false, 0.25);
    // Otowa falls: three thin streams off the rock into a pool, a queue with ladles
    {
      const x = 30;
      const y = Y(5612);
      img.rect(x - 6, y - 10, 34, 10, C.stone[0]);
      img.rect(x - 6, y - 10, 34, 2, C.stone[1]);
      img.rect(x - 4, y, 30, 6, C.water[2]);
      img.rect(x - 4, y, 30, 1, C.stone[1]);
      // the three streams running (live), rings spreading in the pool where they land
      const falls = [0, 1, 2].map((f) =>
        capture(x + 4, y - 8, 15, 10, () => {
          for (const k of [4, 11, 18]) for (let j = -8; j < 2; j++) img.set(x + k, y + j, (j + 9 - f) % 3 ? 0xe8f4f8 : 0xb8d8e8);
        }),
      );
      kit.loop(x + 4, U(y - 8), falls, { fps: 9 });
      const ringF = [1, 2, 3].map((r) => {
        const out = new Raster(7, 3);
        for (let i = 3 - r; i <= 3 + r; i++) out.set(i, i === 3 - r || i === 3 + r ? 1 : r > 1 ? 0 : 2, C.water[3]);
        return kit.frame(gradeAt(out, 5612));
      });
      kit.spot([[x - 2, U(y + 1), 26, 3]], ringF, { rate: 3, fps: 5, a: 0.8 });
      reserveRect(x - 6, y - 12, 34, 20);
      crowd(x - 4, y + 7, 30, 4, 18, true, 0.2);
    }
    // the valley of cherries under the stage, the three-storey Koyasu pagoda across it
    pagoda(150, 5600, 3, { w0: 18, step: 3, floorH: 5, roofH: 5, wall: 'vermilion', ramp: C.roofTileDark });
    // the great stage: a deck of hinoki boards on a lattice of huge pillars over the slope
    {
      const x0 = 22;
      const x1 = 158;
      const lat0 = 5690;
      const deck0 = 5724;
      const deck1 = 5756;
      objects.push({
        y: Y(lat0),
        shadow: () => shadowRect(x0 + 6, Y(lat0) - 2, x1 - x0, 12, 0.5),
        draw: () => {
          for (let u = lat0; u < deck0; u++)
            for (let x = x0; x < x1; x++) {
              const px = (x - x0) % 6;
              const beam = (u - lat0) % 9 === 0 || (u - lat0) % 9 === 1;
              let c = px === 0 ? C.wood[3] : px === 1 ? C.wood[2] : px < 3 ? C.wood[1] : 0x140e0a;
              if (beam) c = (u - lat0) % 9 === 0 ? C.wood[3] : C.wood[1];
              img.set(x, Y(u), c);
            }
          for (let u = deck0; u < deck1; u++)
            for (let x = x0; x < x1; x++) img.set(x, Y(u), u === deck0 || u === deck0 + 1 ? C.wood[0] : (u - deck0) % 3 === 0 ? C.hinoki[0] : x % 17 === 0 ? C.hinoki[1] : C.hinoki[2]);
          for (let x = x0; x < x1; x++) img.set(x, Y(deck0 + 2), x % 4 ? C.wood[1] : C.wood[3]); // the front rail
          for (let x = x0; x < x1; x += 4) img.set(x, Y(deck0 + 3), C.wood[0]);
          // the fall of the slope under the lattice, a darker band where the pillars stand in the trees
          for (let x = x0; x < x1; x++) for (let j = 1; j < 4; j++) img.tint(x, Y(lat0) + j, 0.7 + j * 0.08);
        },
      });
      reserveRect(x0, Y(deck1), x1 - x0, deck1 - lat0);
      crowd(x0 + 4, Y(deck1 - 2), x1 - x0 - 8, 26, 90, true, 0.3);
      // the two small wing pavilions on the stage
      hall(x0, Y(deck1 + 14), 20, 10, 4, 'hondo');
      hall(x1 - 20, Y(deck1 + 14), 20, 10, 4, 'hondo');
      // the main hall: a vast cypress-bark roof over plain wood
      hall(30, Y(5812), 120, 40, 10, 'hondo');
    }
    // Okunoin's small stage and the Jishu love shrine
    hall(126, Y(5900), 44, 16, 6, 'hondo');
    hall(16, Y(5880), 36, 16, 6, 'shrine');
    crowd(10, Y(5930), 160, 100, 50, false, 0.2);
    path(5930, 6300, (u) => 90 + 12 * Math.sin((u - 5930) / 90), 5, 'gravel');
  }

  // ------------------------------------------------------------ J. the Daimonji mountain at dusk (u 6300..7168)
  {
    path(6300, L, (u) => 90 + 10 * Math.sin((u - 6300) / 110), 5, 'gravel');
    // the 大 laid out in fire beds on a clearing of the slope
    const strokes = [
      [[30, 6676], [150, 6676]],
      [[90, 6820], [84, 6720], [62, 6580], [34, 6450]],
      [[92, 6676], [114, 6580], [146, 6450]],
    ];
    const beds = [];
    for (const s of strokes)
      for (let i = 0; i < s.length - 1; i++) {
        const [ax, au] = s[i];
        const [bx, bu] = s[i + 1];
        const n = Math.ceil(Math.hypot(bx - ax, bu - au) / 4);
        for (let k = 0; k <= n; k++) {
          const t = k / n;
          beds.push([ax + (bx - ax) * t, au + (bu - au) * t]);
        }
      }
    // the clearing: grass worn down along the strokes
    for (const [bx, bu] of beds)
      for (let y = Y(bu) - 9; y <= Y(bu) + 9; y++)
        for (let x = Math.floor(bx - 9); x <= bx + 9; x++) {
          if (Math.hypot(x - bx, y - Y(bu)) > 9 || !img.alpha(x, y) || isRes(x, y)) continue;
          img.set(x, y, rampColor([0x5a4a30, 0x6a5a3a, 0x7a6a44, 0x8a7a50], 0.3 + fbm(x, y, { seed: 45, scale: 3 }) * 0.6, x, y));
        }
    for (const [bx, bu] of beds) reserveDisc(bx, Y(bu), 8);
    const pyres = [];
    for (const [bx, bu] of beds)
      for (const dx of [-4, 0, 4]) {
        const x = Math.round(bx + dx);
        const y = Y(bu);
        if (!img.alpha(x, y)) continue;
        pyres.push([x, y]);
        objects.push({
          y: y + 2,
          draw: () => {
            // a pyre of stacked pine logs (its flames are live)
            img.rect(x - 1, y, 3, 2, 0x3a2418);
            img.set(x - 1, y, 0x5a3a24);
            glow(x, y, 0xff7a20, 0.5);
          },
        });
      }
    // the fires flicker: every pyre in a stretch of the slope in four frames, each flame different
    for (let y0 = Y(L); y0 < Y(6300); y0 += 64) {
      const here = pyres.filter(([, y]) => y >= y0 && y < y0 + 64);
      if (!here.length) continue;
      const pr = rng(y0);
      const fx0 = Math.min(...here.map(([x]) => x)) - 2;
      const fx1 = Math.max(...here.map(([x]) => x)) + 2;
      const flames = [0, 1, 2, 3].map(() =>
        capture(fx0, y0 - 6, fx1 - fx0 + 1, 72, () => {
          for (const [x, y] of here) {
            const h = 1 + Math.floor(pr() * 3);
            const lean = pr() < 0.3 ? -1 : pr() < 0.4 ? 1 : 0;
            glow(x, y - 1, 0xff9030, 0.95);
            glow(x - 1, y - 1, pr() < 0.5 ? 0xffb040 : 0xff7a20, 0.7);
            glow(x + 1, y - 1, pr() < 0.5 ? 0xff7a20 : 0xffb040, 0.7);
            for (let j = 2; j <= h + 1; j++) glow(x + (j > 2 ? lean : 0), y - j, j === h + 1 ? 0xfff4c0 : 0xffd060, 0.9);
            if (pr() < 0.2) glow(x + lean, y - h - 3, 0xffe080, 0.6); // a spark
          }
        }),
      );
      kit.loop(fx0, U(y0 - 6), flames, { fps: 7, fx: 1 });
    }
    // smoke drifting up off the strokes (live)
    const smoke = [2, 3, 4, 5, 6].map((r) => [0, 1].map((v) => kit.frame(puff(r, r * 13 + v + 5, [0x4a4450, 0x5e5864, 0x787280, 0x948e9c]))));
    for (let i = 0; i < pyres.length; i += 28) {
      const [x, y] = pyres[i];
      kit.emit(x, U(y) + 3, smoke, { rate: 0.9, life: [3, 4], vy: 7, sx: 1, wf: 0.8, a: 0.4, tint: 1 });
    }
    // the little hall at the top of the 大, visitors waiting for dark
    const sc = 90;
    hall(sc - 22, Y(6930), 44, 18, 6, 'temple');
    crowd(sc - 30, Y(6880), 60, 40, 40, false, 0.15);
    gateSmall(sc, Y(6884), 9);
    for (const [x, u] of [[60, 6900], [118, 6900]]) lantern(x, Y(u));
  }

  // ------------------------------------------------------------ turret pads from the wave file
  for (const p of pads) {
    const y = Y(p.u);
    const x = p.x;
    for (let yy = y - 10; yy <= y + 10; yy++)
      for (let xx = x - 10; xx <= x + 10; xx++) {
        const d = Math.hypot(xx + 0.5 - x, yy + 0.5 - y);
        if (d > 10) continue;
        img.set(xx, yy, d > 8.5 ? C.stone[0] : rampColor(C.gravel, 0.3 + fbm(xx, yy, { seed: 2, scale: 3 }) * 0.5, xx, yy));
      }
  }

  // ------------------------------------------------------------ trees
  function sectionKinds(u) {
    if (u < KAMO[1]) return [['sakura', 0.6], ['broadleaf', 1]];
    if (u < SHRINE[1]) return [['sakura', 0.35], ['pine', 0.7], ['broadleaf', 1]];
    if (u < TORII[1]) return [['cedar', 0.55], ['broadleaf', 0.88], ['sakura', 1]];
    if (u < 3260) return [['bamboo', 0.85], ['cedar', 1]];
    if (u < ARASHI[1]) return [['sakura', 0.6], ['broadleaf', 1]];
    if (u < KINKAKU[1]) return [['pine', 0.45], ['broadleaf', 0.8], ['sakura', 1]];
    if (u < RYOAN[1]) return [['pine', 0.4], ['broadleaf', 0.75], ['sakura', 1]];
    if (u < KIYOMIZU[1]) return [['sakura', 0.55], ['broadleaf', 0.85], ['pine', 1]];
    return [['cedar', 0.5], ['broadleaf', 0.85], ['sakura', 1]];
  }
  const RADIUS = { sakura: [6, 9.5], broadleaf: [6, 9], cedar: [4.5, 7], bamboo: [3.5, 5.5], pine: [5, 8] };
  function treeObj(kind, x, y, r) {
    const seed = Math.floor(rand() * 1e9);
    const cx = Math.round(x);
    const cy = Math.round(y);
    const px = () => crownPixels(kind, cx, cy, r, rng(seed), seed & 1023);
    const off = Math.round(2 + r * 0.25);
    return {
      y: cy + r * 0.6,
      shadow: () => {
        for (const p of px()) img.tint(p.x + off, p.y + off + 1, 0.5);
        if (kind === 'sakura')
          for (let i = 0; i < r * 3; i++) {
            const a = rand() * Math.PI * 2;
            const d = r * (0.9 + rand() * 0.6);
            const x2 = Math.round(cx + Math.cos(a) * d);
            const y2 = Math.round(cy + Math.sin(a) * d);
            if (img.alpha(x2, y2)) img.set(x2, y2, rand() < 0.5 ? 0xc87a96 : 0x9a5a74);
          }
      },
      draw: () => {
        for (const p of px()) {
          img.set(p.x, p.y, p.c);
          if (kind === 'bamboo' && p.x >= 0 && p.x < W && p.y >= 0 && p.y < L) canopy[p.y * W + p.x] = 1;
        }
      },
    };
  }
  for (let gy = 0; gy < L; gy += 6)
    for (let gx = -3; gx < W + 3; gx += 6) {
      const x = gx + rand() * 6;
      const y = gy + rand() * 6;
      const u = L - y;
      const ix = Math.round(x);
      const iy = Math.round(y);
      if (ix < 0 || ix >= W) continue;
      if (!img.alpha(ix, iy)) continue;
      const kinds = sectionKinds(u);
      const roll = rand();
      const kind = kinds.find(([, p]) => roll < p)[0];
      const [r0, r1] = RADIUS[kind];
      const r = r0 + rand() * (r1 - r0);
      const k = r * 0.55;
      if (isRes(ix, iy) || isRes(ix - k, iy) || isRes(ix + k, iy) || isRes(ix, iy - k) || isRes(ix, iy + k)) continue;
      // the built-up parts get only the trees placed on purpose (gardens, willows, groves)
      if (u < SANDO[1] && !(u >= SANDO[0] && (ix < 18 || ix > 162))) continue;
      if (u >= 5000 && u < 5560) continue;
      if (rand() < (kind === 'bamboo' ? 0.02 : 0.12)) continue; // occasional gap in the canopy
      objects.push(treeObj(kind, x, y, r));
    }

  // ------------------------------------------------------------ compose
  for (const o of objects) o.shadow?.();
  objects.sort((a, b) => a.y - b.y);
  for (const o of objects) o.draw();

  for (let y = 0; y < L; y++) {
    const d = dusk(L - y);
    if (!d) continue;
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (img.data[i + 3]) for (let k = 0; k < 3; k++) img.data[i + k] = d(img.data[i + k], k);
    }
  }
  grade(img, GRADE);
  for (const [x, y, c, a] of lights) img.set(x, y, c, a);

  // gusts of wind through the bamboo grove (live): the leaves turn their paler undersides, a patch at a
  // time, in waves running across the grove
  for (let y0 = Y(3262); y0 < Y(2700); y0 += 16)
    for (let x0 = 0; x0 < W; x0 += 16) {
      let n = 0;
      const tile = new Window(x0, y0, 16, 16);
      for (let y = y0; y < y0 + 16; y++)
        for (let x = x0; x < Math.min(W, x0 + 16); x++) {
          const i = img.idx(x, y);
          if (!canopy[y * W + x] || i < 0 || !img.data[i + 3]) continue;
          const [r, g, b] = [img.data[i], img.data[i + 1], img.data[i + 2]];
          tile.setRGBA(x, y, Math.min(255, r * 1.25 + 16), Math.min(255, g * 1.3 + 20), Math.min(255, b * 1.05 + 6), 255);
          n++;
        }
      if (n < 12) continue;
      const u = U(y0);
      const ph = -(x0 * 0.05 + u * 0.012) + fbm(x0, u, { seed: 77, scale: 40 }) * 2.5;
      kit.wave([kit.frame(tile)], [[0, x0, u, ph]], { w: 1.1, a0: 0, a1: 0.6, pw: 4 });
    }
  // the Golden Pavilion's reflection ripples: rows of the pond nudged sideways, three ways in turn (live)
  if (ripple) {
    const islands = [[40, 3770, 9], [84, 3730, 6], [30, 3830, 5], [92, 3820, 4], [58, 3716, 4]];
    const frames = [0, 1, 2].map((f) => {
      const out = new Window(ripple.x0, ripple.y0, ripple.x1 - ripple.x0 + 1, ripple.y1 - ripple.y0 + 1);
      for (let y = ripple.y0; y <= ripple.y1; y++) {
        const k = y - ripple.y0;
        const ox = Math.round(Math.sin(k * 0.9 + f * 2.1));
        if (!ox) continue;
        for (let x = ripple.x0; x <= ripple.x1; x++) {
          const sx = x + ox;
          if (((x - 60) / 52) ** 2 + ((y - Y(3790)) / 96) ** 2 > 0.85 || !isRes(x, y) || !isRes(sx, y)) continue;
          if (islands.some(([ix, iu, ir]) => Math.hypot(x - ix, y - Y(iu)) < ir + 7)) continue;
          const i = img.idx(sx, y);
          if (i >= 0 && img.data[i + 3]) out.setRGBA(x, y, img.data[i], img.data[i + 1], img.data[i + 2], 255);
        }
      }
      return kit.frame(out);
    });
    kit.loop(ripple.x0, U(ripple.y0), frames, { fps: 2.5, fx: 1 });
  }

  const chunks = [];
  for (let i = 0; i < CHUNKS; i++) chunks.push(img.crop(0, i * CHUNK, W, CHUNK));
  return {
    strip: img,
    chunks,
    props: kit.pack(),
    meta: { width: W, chunkHeight: CHUNK, chunks: CHUNKS, length: L, tint: tintTable(L, (u) => [0, 1, 2].map((k) => Math.round(gradeAt(whitePx(), u).data[k]))) },
  };
}

// the middle layer is muted so bullets pop
const GRADE = { sat: 0.78, bright: 0.84, tint: 0x182030, tintAmt: 0.06 };

/** Dusk over the last stretch: warmer, then dark blue, so the Daimonji fires burn bright. (v, channel) -> v */
function dusk(u) {
  const a = smooth(5800, 6500, u);
  if (a <= 0) return null;
  const warm = 1 - smooth(6300, 6700, u);
  const tint = rgb(warm > 0.5 ? 0x8a3a3a : 0x1a1a3a);
  const m = [1 - (0.12 + 0.3 * (1 - warm)) * a, 1 - (0.28 + 0.2 * (1 - warm)) * a, 1 - (0.36 + 0.05 * (1 - warm)) * a];
  return (v, k) => v * m[k] + (tint[k] - v * m[k]) * 0.18 * a;
}

/** Grade a frame the way the strip is graded at u. */
function gradeAt(r, u) {
  const d = dusk(u);
  if (d) r.map((R, G, B, A) => (A ? [d(R, 0), d(G, 1), d(B, 2), A] : null));
  grade(r, GRADE);
  return r;
}

function whitePx() {
  const r = new Raster(1, 1);
  r.set(0, 0, 0xffffff);
  return r;
}
