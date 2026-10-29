// Middle layer: the whole stage-1 strip (Fushimi Inari), cut into 512px chunks.
//
// Coordinates: `u` = distance from the bottom of the strip (stage start), strip y = L - u.
// At time t the top edge of the screen shows u = anchor + mid * t (see src/data/stage1.json).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Raster, fbm, rng, bayer, scaleColor, mix } from '../../lib/raster.mjs';
import { crownPixels, grade, rampColor } from '../nature.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export const W = 180;
export const CHUNK = 512;
export const CHUNKS = 14;
export const L = CHUNK * CHUNKS;

// ---- palette
const C = {
  K: 0x1c1418, // lacquer black
  R1: 0xe2421f, // vermilion lit
  R2: 0xb83018, // vermilion shade
  R3: 0x7e2014,
  IN: 0x22150f, // tunnel interior
  gold: 0xe2aa32,
  white: 0xe9e2d0,
  stone: [0x4e4b50, 0x6c6870, 0x8a8790, 0xaaa7ae],
  gravel: [0x5c5648, 0x6d6656, 0x7e7765, 0x908874],
  dirt: [0x3a2e22, 0x4a3b2a, 0x5a4a35, 0x6b5a42],
  floor: [0x1d2919, 0x263421, 0x314029, 0x3e4d30],
  water: [0x16323e, 0x1e4250, 0x285464, 0x6aa2ae],
  roofBark: [0x2b2224, 0x3d3033, 0x544246, 0x6e5a5c],
  roofTile: [0x2a303c, 0x3c4452, 0x515b6c, 0x6a7588],
  roofTileDark: [0x262426, 0x37333a, 0x4a454e, 0x605a64],
  wood: [0x2e2018, 0x46301f, 0x5e4229, 0x7a5835],
};

const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function buildMid() {
  const stage = JSON.parse(readFileSync(join(root, 'src', 'data', 'stage1.json'), 'utf8'));
  const { mid: V, anchor } = stage.scroll;
  const img = new Raster(W, L);
  const rand = rng(2026);
  const Y = (u) => L - u;
  const reserved = new Uint8Array(W * L);
  const isRes = (x, y) => x >= 0 && x < W && y >= 0 && y < L && reserved[y * W + x];
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

  // ------------------------------------------------------------ layout
  const RIDGE_U = 1820;
  const ridgeAmt = (u) => smooth(RIDGE_U, RIDGE_U + 160, u);
  const pathX = (u) => {
    const s = ridgeAmt(u);
    const k = u - RIDGE_U;
    return 90 + s * (20 * Math.sin(k / 230) + 9 * Math.sin(k / 83 + 1.1));
  };
  // extra ridge width where features need room (pond, viewpoint, summit)
  const widen = (u) =>
    22 * Math.exp(-(((u - 4150) / 140) ** 2)) + 18 * Math.exp(-(((u - 5720) / 120) ** 2)) + 26 * smooth(6250, 6450, u);
  const ridgeEdges = (u) => {
    const s = ridgeAmt(u);
    const rc = pathX(u) * 0.55 + 90 * 0.45;
    const hw = 50 + 12 * Math.sin(u / 170) + widen(u);
    const nl = (fbm(0, u, { seed: 41, scale: 24, octaves: 3 }) - 0.5) * 16;
    const nr = (fbm(7, u, { seed: 43, scale: 24, octaves: 3 }) - 0.5) * 16;
    const l = rc - hw + nl;
    const r = rc + hw + nr;
    return [l * s + -20 * (1 - s), r * s + 200 * (1 - s)];
  };

  // ------------------------------------------------------------ 1. terrain base
  for (let y = 0; y < L; y++) {
    const u = L - y;
    const [l, r] = ridgeEdges(u);
    for (let x = 0; x < W; x++) {
      if (x < l || x > r) continue;
      const n = fbm(x, y, { seed: 12, scale: 16, octaves: 3 });
      let c = rampColor(C.floor, n, x, y);
      // slope bands at the ridge rims (lit on the left, in shadow on the right)
      const dl = x - l;
      const dr = r - x;
      if (dl < 6) c = scaleColor(c, 0.62 + dl * 0.06);
      if (dr < 7) c = scaleColor(c, 0.5 + dr * 0.07);
      img.set(x, y, c);
    }
    // ridge cast shadow / ambient occlusion onto the valley (semi-transparent, scrolls with the ridge)
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

  // ------------------------------------------------------------ helpers: objects
  const shadowRect = (x, y, w, h, f = 0.55) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) img.tint(x + i, y + j, f);
  };

  // torii seen from above in 3/4: kasagi (black top + vermilion face), pillars, nuki.
  const gate = (cx, y, hw, tone = 1) => {
    const R1 = scaleColor(C.R1, tone);
    const R2 = scaleColor(C.R2, tone);
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
  // a tunnel of densely packed gates along a centre function
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
  // small offering torii (otsuka clusters)
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
      const set = sh ? (x, yy) => img.tint(x + 5, yy + 6, 0.5) : null;
      const put = (x, yy, c) => (sh ? set(x, yy) : img.set(x, yy, c));
      // pillars
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

  // hall in 3/4 view: hipped-gable roof + facade
  const hall = (x, y, w, roofH, faceH, style = 'shrine') => {
    const bark = style === 'shrine' || style === 'gate';
    const ramp = bark ? C.roofBark : rand() < 0.3 ? C.roofTileDark : C.roofTile;
    const ridge = y + Math.round(roofH * 0.32);
    const hi = Math.round(roofH * 0.42);
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
            if (lx < inset) c = ramp[3] - 0; // west hip, lit
            else if (rx < inset) c = ramp[0]; // east hip, shade
            else c = north ? ramp[2] : ramp[1];
            const tex = lx < inset || rx < inset ? (yy - y) % 2 === 0 : (xx - x) % 3 === 0;
            if (tex) c = scaleColor(c, 0.85);
            img.set(xx, yy, c);
          }
        }
        // eaves: lit edge of the eave tiles, dark line below, lifted corners
        for (let xx = x; xx < x + w; xx++) {
          img.set(xx, y + roofH - 2, bark ? 0x7a6660 : ramp[3]);
          img.set(xx, y + roofH - 1, ramp[0]);
        }
        img.clear(x, y + roofH - 1);
        img.clear(x + w - 1, y + roofH - 1);
        img.clear(x, y);
        img.clear(x + w - 1, y);
        // ridge
        const rc = bark ? C.K : 0x7d889a;
        for (let xx = x + hi; xx < x + w - hi; xx++) {
          img.set(xx, ridge, rc);
          img.set(xx, ridge - 1, bark ? 0x3a3034 : 0x95a0b2);
        }
        if (bark) {
          img.set(x + hi, ridge, C.gold);
          img.set(x + w - hi - 1, ridge, C.gold);
          img.set(x + hi, ridge - 1, C.gold);
          img.set(x + w - hi - 1, ridge - 1, C.gold);
        }
        // facade
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
            } else {
              c = k < 1 ? C.wood[0] : (xx + yy) % 2 && upper ? C.wood[2] : C.wood[1];
              if (yy === fy) c = 0x15100c;
            }
            img.set(xx, yy, c);
          }
        if (style === 'gate') {
          const gw = Math.round(w * 0.2);
          img.rect(x + Math.floor(w / 2 - gw / 2), fy + 1, gw, faceH - 1, 0x140c0a);
        }
        if (style === 'machiya') {
          // noren curtain + red lantern
          const nx = x + 3 + Math.floor(rand() * Math.max(1, w - 10));
          img.rect(nx, fy + 1, 5, 2, 0x2b3c78);
          img.set(nx + 6, fy + 1, 0xe8452a);
          img.set(nx + 6, fy + 2, 0xa82a18);
        }
        img.rect(x + 1, fy + faceH, w - 2, 1, C.stone[0]);
      },
    });
    reserveRect(x - 2, y - 2, w + 4, roofH + faceH + 4);
  };

  // ------------------------------------------------------------ A. town (u 0..540)
  {
    const sx0 = 78;
    const sx1 = 102;
    paving(sx0, Y(560), sx1 - sx0, 560, C.gravel);
    reserveRect(sx0 - 2, Y(560), sx1 - sx0 + 4, 560);
    for (const [x0, x1] of [[0, sx0 - 3], [sx1 + 3, W]]) {
      let u = 6;
      while (u < 520) {
        const roofH = 15 + Math.floor(rand() * 6);
        const faceH = 4;
        const bh = roofH + faceH;
        let x = x0 - Math.floor(rand() * 10);
        while (x < x1 - 8) {
          const w = Math.min(x1 - x, 18 + Math.floor(rand() * 14));
          if (rand() < 0.12) {
            // small garden with a tree
            fillGround(x, Y(u + bh), w, bh, C.floor);
            objects.push(treeObj('sakura', x + w / 2, Y(u + bh / 2), 6 + rand() * 3));
          } else hall(x, Y(u + bh), w, roofH, faceH, 'machiya');
          x += w + 2;
        }
        u += bh + 3;
      }
    }
    // shop lanterns along the street
    for (let u = 20; u < 520; u += 26) {
      img.set(sx0 + 1, Y(u), 0xe8452a);
      img.set(sx1 - 2, Y(u + 11), 0xe8452a);
    }
  }

  // ------------------------------------------------------------ river (u 540..620) with a vermilion bridge
  {
    const w0 = 548;
    const w1 = 604;
    for (let u = 536; u <= 616; u++) {
      const y = Y(u);
      for (let x = 0; x < W; x++) {
        if (u < w0 || u > w1) {
          const row = Math.floor((u - 536) / 3);
          const joint = (u - 536) % 3 === 2 || (x + (row % 2) * 3) % 7 === 0;
          img.set(x, y, joint ? C.stone[0] : C.stone[1]);
          continue;
        }
        const n = fbm(x * 0.5, y * 1.6, { seed: 21, scale: 10, octaves: 3 });
        let c = rampColor(C.water, 0.15 + n * 0.55, x, y);
        if (n > 0.66 && (x + y) % 3 === 0) c = C.water[3];
        if (u === w1 || u === w1 - 1) c = scaleColor(C.water[0], 0.7);
        img.set(x, y, c);
      }
    }
    // floating petals
    for (let i = 0; i < 70; i++) img.set(Math.floor(rand() * W), Y(w0 + 1 + Math.floor(rand() * (w1 - w0 - 2))), rand() < 0.5 ? 0xf0b8c8 : 0xd88aa4);
    reserveRect(0, Y(624), W, 92);
    // bridge
    const bx0 = 77;
    const bx1 = 103;
    objects.push({
      y: Y(530),
      shadow: () => shadowRect(bx0 + 3, Y(620) + 3, bx1 - bx0, 88, 0.55),
      draw: () => {
        for (let u = 530; u <= 622; u++) {
          const y = Y(u);
          for (let x = bx0 + 2; x <= bx1 - 2; x++) img.set(x, y, (u % 3 === 0 ? C.wood[1] : C.wood[2]));
          img.set(bx0, y, C.R1);
          img.set(bx0 + 1, y, C.R2);
          img.set(bx1, y, C.R2);
          img.set(bx1 - 1, y, C.R3);
          if (u % 10 === 0) {
            img.rect(bx0 - 1, y, 3, 2, C.R1);
            img.rect(bx1 - 1, y, 3, 2, C.R2);
            img.set(bx0, y - 1, C.gold);
            img.set(bx1, y - 1, C.gold);
          }
        }
      },
    });
    // sakura along both banks
    for (let x = 4; x < W; x += 13) {
      if (x > 64 && x < 116) continue;
      objects.push(treeObj('sakura', x + rand() * 4, Y(530 - rand() * 4), 7 + rand() * 3));
      objects.push(treeObj('sakura', x + 6 + rand() * 4, Y(628 + rand() * 4), 7 + rand() * 3));
    }
  }

  // ------------------------------------------------------------ sandō approach (u 630..1130)
  {
    fillGround(0, Y(1130), W, 500, C.gravel, 4, 8);
    paving(70, Y(1130), 40, 500);
    reserveRect(64, Y(1130), 52, 500);
    for (let u = 660; u < 1110; u += 36) {
      lantern(62, Y(u));
      lantern(115, Y(u));
    }
    greatTorii(90, Y(1010), 24);
    gateSmall(90, Y(720), 12);
    // stone walls (tamagaki) lining the approach, sakura behind
    for (let u = 640; u < 1120; u += 1) {
      img.set(20, Y(u), C.stone[2]);
      img.set(21, Y(u), C.stone[0]);
      img.set(159, Y(u), C.stone[2]);
      img.set(160, Y(u), C.stone[0]);
    }
    reserveRect(18, Y(1120), 6, 480);
    reserveRect(157, Y(1120), 6, 480);
  }

  // ------------------------------------------------------------ B. shrine complex (u 1130..1830)
  {
    fillGround(14, Y(1830), 152, 700, C.gravel, 6, 8);
    paving(82, Y(1830), 16, 700);
    reserveRect(10, Y(1830), 160, 700);
    // vermilion fences (tamagaki)
    for (let u = 1130; u < 1830; u++) {
      for (const x of [12, 167]) {
        img.set(x, Y(u), u % 4 === 0 ? C.K : C.R1);
        img.set(x + 1, Y(u), C.R2);
      }
    }
    // Rōmon tower gate
    hall(46, Y(1214), 88, 52, 11, 'gate');
    fox(64, Y(1142), false);
    fox(111, Y(1142), true);
    lantern(74, Y(1260));
    lantern(103, Y(1260));
    // raked gravel lines across the courtyard
    for (let u = 1218; u < 1830; u += 3)
      for (let x = 15; x < 166; x++) if (x < 81 || x > 98) img.tint(x, Y(u), 0.9);
    // side halls, purification pavilion, ema rack, small sub-shrines along the fences
    hall(22, Y(1352), 40, 26, 7, 'shrine');
    hall(118, Y(1432), 40, 26, 7, 'shrine');
    hall(112, Y(1298), 18, 10, 4, 'shrine');
    img.rect(115, Y(1284), 12, 3, C.stone[3]);
    img.rect(116, Y(1283), 10, 1, C.water[2]);
    objects.push({
      y: Y(1414),
      shadow: () => shadowRect(30, Y(1420) + 2, 26, 6, 0.6),
      draw: () => {
        img.rect(28, Y(1420), 26, 1, C.wood[1]);
        for (let i = 0; i < 8; i++) img.rect(29 + i * 3, Y(1419), 2, 3, i % 3 ? 0xd8c49a : 0xc8b080);
        img.rect(28, Y(1416), 26, 1, C.wood[0]);
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
      objects.push(treeObj(kind, x, Y(u), r));
    for (let u = 1270; u < 1490; u += 30) {
      lantern(76, Y(u), true);
      lantern(101, Y(u), true);
    }
    // Honden (main hall) + front canopy
    hall(34, Y(1572), 112, 50, 10, 'shrine');
    hall(72, Y(1508), 36, 12, 0, 'shrine');
    // behind: stairs up and small halls
    path(1600, 1700, () => 90, 8, 'stairs');
    hall(24, Y(1690), 34, 20, 6, 'shrine');
    hall(124, Y(1740), 34, 20, 6, 'shrine');
    fox(76, Y(1716), false);
    fox(100, Y(1716), true);
    gateSmall(90, Y(1770), 9);
    gateSmall(90, Y(1806), 9);
  }

  // ------------------------------------------------------------ C. Senbon torii on the ridge (u 1830..3740)
  {
    const split = (u) => 11 * smooth(2250, 2330, u) * (1 - smooth(2980, 3060, u));
    path(1830, 3740, pathX, 6);
    tunnel(1840, 2240, pathX, 6, 11);
    // split into the famous double tunnel and rejoin
    path(2240, 3070, (u) => pathX(u) - split(u), 5);
    path(2240, 3070, (u) => pathX(u) + split(u), 5);
    tunnel(2244, 3066, (u) => pathX(u) - split(u), 5, 12);
    tunnel(2244, 3066, (u) => pathX(u) + split(u), 5, 13);
    for (let u = 2340; u < 2970; u += 1) {
      // a strip of moss between the two tunnels is reserved too
      reserveRect(pathX(u) - 4, Y(u), 9, 1);
    }
    tunnel(3070, 3240, pathX, 6, 14);
    // Okusha clearing (inner shrine)
    const oc = pathX(3320);
    fillGround(oc - 46, Y(3410), 92, 175, C.gravel, 9, 8);
    reserveRect(oc - 48, Y(3412), 96, 180);
    hall(Math.round(oc - 26), Y(3398), 52, 24, 8, 'shrine');
    lantern(Math.round(oc - 34), Y(3330));
    lantern(Math.round(oc + 31), Y(3330));
    fox(Math.round(oc - 14), Y(3268), false);
    fox(Math.round(oc + 10), Y(3268), true);
    tunnel(3410, 3730, pathX, 6, 15);
  }

  // ------------------------------------------------------------ D. mountain forest (u 3740..5000)
  {
    for (const [a, b, s] of [[3740, 3900, 'gravel'], [3900, 3990, 'stairs'], [3990, 4400, 'gravel'], [4400, 4470, 'stairs'], [4470, 5000, 'gravel']])
      path(a, b, pathX, 5, s);
    for (let u = 3760; u < 5000; u += 34 + Math.floor(rand() * 20)) objects.push(gateObj(Math.round(pathX(u)), Y(u), 6));
    // Shin-ike pond
    const pcx = pathX(4150) - 34;
    const pcy = Y(4150);
    for (let y = pcy - 64; y <= pcy + 64; y++)
      for (let x = Math.floor(pcx - 26); x <= pcx + 26; x++) {
        const d = ((x - pcx) / 24) ** 2 + ((y - pcy) / 60) ** 2;
        const wob = (fbm(x, y, { seed: 61, scale: 12 }) - 0.5) * 0.35;
        if (d + wob > 1.08) continue;
        if (d + wob > 0.9) img.set(x, y, C.stone[1]);
        else {
          const n = fbm(x * 0.7, y, { seed: 62, scale: 9, octaves: 2 });
          img.set(x, y, n > 0.68 && (x + y) % 2 ? C.water[3] : rampColor(C.water, 0.05 + n * 0.45, x, y));
        }
        reserved[y * W + x] = 1;
      }
    for (let i = 0; i < 9; i++) {
      const a = rand() * Math.PI * 2;
      const lx = Math.round(pcx + Math.cos(a) * 12 * rand());
      const ly = Math.round(pcy + Math.sin(a) * 40 * rand());
      img.rect(lx, ly, 2, 2, 0x3f7a3a);
      img.set(lx, ly, 0x6aa050);
    }
    lantern(Math.round(pcx + 22), pcy - 50);
    lantern(Math.round(pcx + 22), pcy + 40);
    // otsuka (stone monuments with offering torii) on both sides of the path
    const cluster = (cx, u0, u1, spread) => {
      for (let u = u0; u < u1; u += 7 + Math.floor(rand() * 4)) {
        const n = 2 + Math.floor(rand() * 3);
        for (let i = 0; i < n; i++) {
          const x = Math.round(cx + (rand() - 0.5) * spread);
          const y = Y(u) + Math.floor(rand() * 4);
          if (isRes(x, y)) continue;
          otsuka(x, y, 3 + Math.floor(rand() * 3), 4 + Math.floor(rand() * 5));
          if (rand() < 0.6) miniGate(x + 2, y + 6, 2 + Math.floor(rand() * 2));
        }
      }
    };
    cluster(pathX(4550) - 26, 4430, 4700, 26);
    cluster(pathX(4580) + 26, 4460, 4720, 24);
    // tea house
    const tx = Math.round(pathX(4850) + 12);
    hall(tx, Y(4876), 30, 16, 5, 'machiya');
    img.rect(tx + 2, Y(4852), 12, 2, C.R1);
    objects.push(umbrella(tx + 22, Y(4848)));
  }

  // ------------------------------------------------------------ E. Yotsutsuji ascent (u 5000..6300)
  {
    path(5000, 5600, pathX, 6, 'stairs');
    tunnel(5004, 5590, pathX, 6, 21);
    // viewpoint plaza on the right rim
    const vx = Math.round(pathX(5720));
    paving(vx - 12, Y(5800), 80, 170);
    reserveRect(vx - 14, Y(5804), 84, 176);
    for (let u = 5632; u < 5800; u++) {
      const [, r] = ridgeEdges(u);
      img.set(Math.floor(r) - 2, Y(u), u % 6 === 0 ? C.wood[3] : C.wood[1]);
    }
    hall(vx - 6, Y(5790), 32, 18, 5, 'machiya');
    objects.push(umbrella(vx + 34, Y(5690)));
    objects.push(umbrella(vx + 14, Y(5660)));
    lantern(vx - 10, Y(5650));
    path(5600, 5640, pathX, 6, 'stairs');
    path(5800, 6300, pathX, 6, 'stairs');
    tunnel(5820, 6260, pathX, 6, 22);
  }

  // ------------------------------------------------------------ F. summit Ichinomine (u 6300..7168)
  {
    path(6300, 6700, pathX, 6, 'gravel');
    for (let u = 6320; u < 6700; u += 40) objects.push(gateObj(Math.round(pathX(u)), Y(u), 6));
    const cluster = (side) => {
      for (let u = 6310; u < 6690; u += 6 + Math.floor(rand() * 3)) {
        for (let i = 0; i < 3; i++) {
          const x = Math.round(pathX(u) + side * (14 + rand() * 30));
          const y = Y(u) + Math.floor(rand() * 3);
          if (isRes(x, y)) continue;
          otsuka(x, y, 3 + Math.floor(rand() * 3), 4 + Math.floor(rand() * 5));
          if (rand() < 0.7) miniGate(x + 2, y + 6, 2 + Math.floor(rand() * 2));
        }
      }
    };
    cluster(-1);
    cluster(1);
    const sc = Math.round(pathX(6780));
    fillGround(sc - 44, Y(6880), 88, 190, C.gravel, 14, 8);
    paving(sc - 8, Y(6880), 16, 190);
    reserveRect(sc - 46, Y(6884), 92, 196);
    greatTorii(sc, Y(6716), 16);
    hall(sc - 30, Y(6846), 60, 30, 8, 'shrine');
    lantern(sc - 22, Y(6760));
    lantern(sc + 19, Y(6760));
    fox(sc - 14, Y(6740), false);
    fox(sc + 10, Y(6740), true);
    path(6880, L, pathX, 5, 'gravel');
  }

  // ------------------------------------------------------------ turret pads from the wave file
  for (const w of stage.waves.filter((w) => w.type === 'turret')) {
    const u = anchor + V * w.t + 10;
    const y = Y(u);
    const x = w.x;
    for (let yy = y - 10; yy <= y + 10; yy++)
      for (let xx = x - 10; xx <= x + 10; xx++) {
        const d = Math.hypot(xx + 0.5 - x, yy + 0.5 - y);
        if (d > 10) continue;
        img.set(xx, yy, d > 8.5 ? C.stone[0] : rampColor(C.gravel, 0.3 + fbm(xx, yy, { seed: 2, scale: 3 }) * 0.5, xx, yy));
      }
    reserveDisc(x, y, 13);
  }

  // ------------------------------------------------------------ trees
  function sectionKinds(u) {
    if (u < 640) return [['sakura', 0.6], ['broadleaf', 1]];
    if (u < 1830) return [['sakura', 0.35], ['pine', 0.7], ['broadleaf', 1]];
    if (u < 3740) return [['cedar', 0.55], ['broadleaf', 0.88], ['sakura', 1]];
    if (u < 5000) return [['cedar', 0.4], ['bamboo', 0.68], ['broadleaf', 0.9], ['sakura', 1]];
    if (u < 6300) return [['sakura', 0.42], ['broadleaf', 0.72], ['cedar', 1]];
    return [['cedar', 0.55], ['broadleaf', 0.88], ['sakura', 1]];
  }
  const RADIUS = { sakura: [6, 9.5], broadleaf: [6, 9], cedar: [4.5, 7], bamboo: [4, 6], pine: [6, 8] };
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
        for (const p of px()) img.set(p.x, p.y, p.c);
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
      if (rand() < 0.12) continue; // occasional gap in the canopy
      objects.push(treeObj(kind, x, y, r));
    }

  // ------------------------------------------------------------ helpers used above (hoisted)
  function gateSmall(cx, y, hw) {
    objects.push({ y: y + 6, draw: () => gate(cx, y, hw, 1.05), shadow: () => gateShadow(cx, y, hw) });
    reserveRect(cx - hw - 4, y - 2, hw * 2 + 9, 10);
  }
  function gateObj(cx, y, hw) {
    reserveRect(cx - hw - 4, y - 2, hw * 2 + 9, 10);
    return { y: y + 6, draw: () => gate(cx, y, hw, 1), shadow: () => gateShadow(cx, y, hw) };
  }
  function umbrella(x, y) {
    return {
      y: y + 4,
      shadow: () => {
        for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) if (i * i + j * j <= 18) img.tint(x + i + 2, y + j + 3, 0.55);
      },
      draw: () => {
        for (let j = -4; j <= 4; j++)
          for (let i = -4; i <= 4; i++) {
            if (i * i + j * j > 18) continue;
            const rib = i === 0 || j === 0 || i === j || i === -j;
            img.set(x + i, y + j, rib ? C.R2 : i + j < 0 ? 0xf05a30 : C.R1);
          }
        img.set(x, y, C.gold);
      },
    };
  }

  // ------------------------------------------------------------ compose
  for (const o of objects) o.shadow?.();
  objects.sort((a, b) => a.y - b.y);
  for (const o of objects) o.draw();

  // readability: the middle layer is muted so bullets pop
  grade(img, { sat: 0.78, bright: 0.84, tint: 0x182030, tintAmt: 0.06 });

  const chunks = [];
  for (let i = 0; i < CHUNKS; i++) chunks.push(img.crop(0, i * CHUNK, W, CHUNK));
  return {
    strip: img,
    chunks,
    meta: { width: W, chunkHeight: CHUNK, chunks: CHUNKS, length: L },
  };
}
