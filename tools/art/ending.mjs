// The ending at 540 px. Its last picture: Mt Fuji at sunrise above a sea of clouds, seen from the hill of the Chūreitō pagoda
// among cherry trees in bloom, a blossoming branch across the sky (the whole screen at its tallest; the middle rows hold
// everything that matters). The cloud bank that drifts across the mountain's foot is a separate strip that tiles sideways
// (the game scrolls it). Also the night sky behind the summary and the bosses' parade, a tile that repeats upwards.
// Layout in the game's units (180 x 420), drawn in fine pixels (x 3).
import { Raster, fbm, mix, rng, scaleColor } from '../lib/raster.mjs';
import { hashPx } from './hires.mjs';
import { flower } from './menu.mjs';

const S = 3;
const W = 180;
const H = 420;
const PEAK = { x: 92, y: 150 }; // the summit (the crater's flat top)
const SUN = { x: 127, y: 176, r: 16 }; // rising behind the mountain's right shoulder

// the sky from the top of the night down to the dawn at the horizon: [y, colour]
const SKY = [[0, 0x0c0e2c], [70, 0x1c1a48], [130, 0x3e2a66], [180, 0x7a3c7a], [215, 0xc85a7a], [242, 0xf0966a], [262, 0xffcc88]];
const CLOUD = [0x3a2e5a, 0x6a5288, 0xb07ea6, 0xe8a8b8, 0xffd4bc, 0xfff0dc];

const ramp = (list, t) => {
  const v = Math.max(0, Math.min(0.9999, t)) * (list.length - 1);
  return mix(list[Math.floor(v)], list[Math.floor(v) + 1], v - Math.floor(v));
};
const stops = (list, y) => {
  for (let i = 0; i + 1 < list.length; i++) if (y <= list[i + 1][0]) return mix(list[i][1], list[i + 1][1], Math.max(0, (y - list[i][0]) / (list[i + 1][0] - list[i][0])));
  return list[list.length - 1][1];
};

/** The mountain's ridge line: the height of its slopes at x (concave, steepening towards the top). */
const ridge = (x) => {
  const d = Math.max(0, Math.abs(x - PEAK.x) - 5);
  return PEAK.y + 112 * (d / 118) ** 0.78;
};

/**
 * A sea of cloud between y0 and y1 (game units): billows of radius r0..r1 drawn from the far edge to the near one, each shaded
 * like a ball lit by the sun up on the right and flattened underneath, frayed by noise. alphaAt fades them; wrap makes a strip
 * that tiles sideways.
 */
function cloudSea(img, y0, y1, r0, r1, n, seed, alphaAt = () => 1, wrap = false) {
  const pr = rng(seed);
  const W_ = img.w / S;
  const puffs = [];
  for (let i = 0; i < n; i++) puffs.push({ x: -r1 + pr() * (W_ + r1 * 2), y: y0 + pr() * (y1 - y0), r: r0 + pr() * (r1 - r0), s: i });
  puffs.sort((a, b) => a.y - b.y);
  for (const p of wrap ? puffs.flatMap((q) => [-1, 0, 1].map((k) => ({ ...q, x: q.x + k * W_ }))) : puffs) {
    const near = (p.y - y0) / Math.max(1, y1 - y0);
    for (let Y = Math.floor((p.y - p.r * 1.1) * S); Y <= (p.y + p.r * 0.6) * S; Y++)
      for (let X = Math.floor((p.x - p.r * 1.15) * S); X <= (p.x + p.r * 1.15) * S; X++) {
        if (X < 0 || X >= img.w || Y < 0 || Y >= img.h) continue;
        const x = (X + 0.5) / S;
        const y = (Y + 0.5) / S;
        const dx = (x - p.x) / p.r;
        const dy = (y - p.y) / p.r;
        const n2 = (fbm(x, y, { seed: seed + 9, scale: 3.2, octaves: 3 }) - 0.5) * 0.5;
        const d = dx * dx + dy * dy;
        if (d > 1 + n2) continue;
        const nz = Math.sqrt(Math.max(0, 1 - d));
        let lit = 0.15 + (dx * 0.45 - dy * 0.55 + nz * 0.35) * 0.6 + near * 0.25 + n2 * 0.6;
        if (dy > 0.25) lit -= (dy - 0.25) * 0.8; // the shaded underside
        const a = alphaAt(x, y) * Math.min(1, (1 + n2 - d) * 5 + 0.3);
        if (a > 0) img.set(X, Y, ramp(CLOUD, lit), a);
      }
  }
}

export function buildEnding() {
  const FW = W * S;
  const FH = H * S;
  const img = new Raster(FW, FH);
  // ---- the sky, stars fading out towards the dawn, thin high cloud catching it, the sun's glow
  for (let Y = 0; Y < FH; Y++)
    for (let X = 0; X < FW; X++) {
      const x = (X + 0.5) / S;
      const y = (Y + 0.5) / S;
      let c = stops(SKY, y + (hashPx(X, Y, 1) - 0.5) * 2.4);
      const d = Math.hypot(x - SUN.x, y - SUN.y);
      const glow = Math.max(0, 1 - d / 86) ** 2;
      if (glow > 0) c = mix(c, 0xffe8b0, glow * 0.75);
      if (y > 90 && y < 250) {
        const n = fbm(x * 0.3, y * 2.3, { seed: 505, scale: 22, octaves: 3 });
        const b = Math.max(0, Math.min(1, (n - 0.56) * 8));
        if (b > 0) c = mix(c, mix(0x8a4a8a, 0xffb090, Math.min(1, (y - 90) / 150)), b * 0.5);
      }
      img.set(X, Y, c);
    }
  const sr = rng(501);
  for (let i = 0; i < 300; i++) {
    const X = Math.floor(sr() * FW);
    const Y = Math.floor(sr() ** 1.5 * 340);
    const a = (1 - Y / 340) * (0.35 + sr() * 0.65);
    img.set(X, Y, sr() < 0.25 ? 0xffe8d0 : 0xffffff, a);
    if (i % 14 === 0) for (const [i2, j2] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) img.set(X + i2, Y + j2, 0xffffff, a * 0.5);
  }
  // rays fanning up from the sun behind the shoulder
  for (let Y = 0; Y < 200 * S; Y++)
    for (let X = 0; X < FW; X++) {
      const x = (X + 0.5) / S;
      const y = (Y + 0.5) / S;
      const a = Math.atan2(y - SUN.y, x - SUN.x);
      const d = Math.hypot(x - SUN.x, y - SUN.y);
      if (d < SUN.r || d > 118 || y > SUN.y) continue;
      const ray = Math.sin(a * 14);
      if (ray > 0.55) img.set(X, Y, 0xfff0c8, 0.14 * (1 - d / 118) * (ray - 0.55) * 2.2);
    }
  // the sun
  for (let Y = (SUN.y - SUN.r - 1) * S; Y <= (SUN.y + SUN.r + 1) * S; Y++)
    for (let X = (SUN.x - SUN.r - 1) * S; X <= (SUN.x + SUN.r + 1) * S; X++) {
      const d = Math.hypot((X + 0.5) / S - SUN.x, (Y + 0.5) / S - SUN.y) / SUN.r;
      if (d <= 1) img.set(X, Y, d > 0.86 ? mix(0xfff0b8, 0xffd890, (d - 0.86) / 0.14) : mix(0xfffcec, 0xfff0b8, d / 0.86));
    }
  // a skein of cranes going across the sun
  const crane = (x, y, s) => {
    const X = Math.round(x * S);
    const Yc = Math.round(y * S);
    for (let i = 0; i <= s; i++) {
      img.set(X - i, Yc - Math.round(i * 0.4), 0x2a1c3a);
      img.set(X + i, Yc - Math.round(i * 0.55), 0x2a1c3a);
      if (i < s - 1) img.set(X + i, Yc - Math.round(i * 0.55) + 1, 0x4a2c4a);
    }
    for (let i = 1; i < 5; i++) img.set(X - i, Yc + 1, 0x2a1c3a);
  };
  [[114, 164, 6], [106, 158, 5], [122, 156, 5], [98, 152, 4], [130, 148, 4], [90, 146, 4], [138, 140, 3]].forEach(([x, y, s]) => crane(x, y, s));

  // ---- Mt Fuji: cool shadowed face, warm rim along the sunlit ridge, ravines, the snow cap reaching down them
  for (let X = 0; X < FW; X++) {
    const x = (X + 0.5) / S;
    const top = Math.ceil(ridge(x) * S);
    for (let Y = top; Y < 300 * S; Y++) {
      const y = (Y + 0.5) / S;
      const dx = x - PEAK.x;
      const ang = Math.atan2(y - PEAK.y + 4, dx); // round the summit
      const wob = fbm(x, y, { seed: 511, scale: 12, octaves: 3 });
      const ravine = Math.sin(ang * 46 + wob * 3) * 0.5 + 0.5;
      const fine = fbm(x, y, { seed: 512, scale: 3, octaves: 3 }) - 0.5;
      const right = dx + (wob - 0.5) * 16 + Math.sin(ang * 46 + wob * 3) * 1.6 > 0;
      const depth = (y - top / S) / 40;
      const v = 0.25 + ravine * 0.25 + (right ? 0.18 : 0) - Math.min(0.2, depth * 0.05) + fine * 0.3;
      let c = ramp(right ? [0x2e2a52, 0x463a66, 0x5e4670, 0x7a5478] : [0x24244a, 0x30305a, 0x3e3e6a, 0x50507a], v);
      const snowLine = PEAK.y + 30 + Math.abs(dx) * 0.28 + ravine * 18 + (fbm(x, y, { seed: 513, scale: 6, octaves: 3 }) - 0.5) * 12;
      if (y < snowLine) {
        const sv = 0.35 + ravine * 0.35 + (right ? 0.3 : -0.1) + fine * 0.35;
        c = ramp(right ? [0xa890c0, 0xe0a8c0, 0xf8c8d0, 0xfff0f0] : [0x6a6698, 0x8480b0, 0xa8a4cc, 0xc8c4e0], sv);
      } else if (y < snowLine + 1.5) c = scaleColor(c, 1.12);
      // the sunlit rim along the right-hand ridge
      if (dx > 0 && Y - top < 5 && x > PEAK.x + 2) c = Y - top < 2 ? 0xffc890 : mix(c, 0xffa070, 0.5);
      img.set(X, Y, c);
    }
  }
  // the crater's notched rim
  for (let X = (PEAK.x - 6) * S; X < (PEAK.x + 6) * S; X++) {
    const n = hashPx(X >> 2, 1, 515);
    if (n > 0.55) for (let j = 0; j < 2; j++) img.set(X, PEAK.y * S + j - 1, 0xffe8e0);
    else if (n < 0.2) img.set(X, PEAK.y * S, 0x8a84b0);
  }

  // ---- the sea of clouds round the mountain's foot (a far bank, then a nearer, brighter one)
  cloudSea(img, 232, 252, 5, 9, 60, 521);
  cloudSea(img, 248, 286, 8, 15, 52, 531);

  // ---- the foreground hill: forest and cherry trees in bloom, the five-storey Chūreitō pagoda among them
  const hill = (x) => 300 - x * 0.18 + Math.sin(x / 23) * 5 + (fbm(x, 0, { seed: 551, scale: 14 }) - 0.5) * 8;
  for (let X = 0; X < FW; X++) {
    const x = X / S;
    for (let Y = Math.floor(hill(x) * S); Y < FH; Y++) img.set(X, Y, ramp([0x14162a, 0x1c1e34, 0x262840, 0x30324c], fbm(X / S, Y / S, { seed: 552, scale: 5, octaves: 3 }) * 0.8));
  }
  /** A cherry in bloom: a crown of shaded mass, then flowers, more of them on the side the sun is on. */
  const blossom = (cx, cy, r, seed) => {
    const fr = rng(seed);
    for (let Y = Math.floor((cy - r - 1) * S); Y <= (cy + r + 1) * S; Y++)
      for (let X = Math.floor((cx - r * 1.2 - 1) * S); X <= (cx + r * 1.2 + 1) * S; X++) {
        const x = (X + 0.5) / S;
        const y = (Y + 0.5) / S;
        const dx = (x - cx) / (r * 1.2);
        const dy = (y - cy) / r;
        const n = fbm(x, y, { seed, scale: 2.2, octaves: 2 });
        const e = dx * dx + dy * dy;
        if (e > 0.8 + n * 0.45) continue;
        if (e > 0.66 + n * 0.45) {
          img.set(X, Y, 0x1e1424); // the dark gap where it meets the next crown
          continue;
        }
        img.set(X, Y, ramp([0x4a2440, 0x7a3e60, 0xb86688, 0xe896b4, 0xfcc8d8], 0.3 + dx * 0.35 - dy * 0.35 + (n - 0.5) * 0.6));
      }
    const nF = r * r * 2.2;
    for (let k = 0; k < nF; k++) {
      const a = fr() * Math.PI * 2;
      const d = Math.sqrt(fr()) * 0.84;
      const dx = Math.cos(a) * d;
      const dy = Math.sin(a) * d;
      const lit = 0.5 + dx * 0.5 - dy * 0.5 + (fr() - 0.5) * 0.45;
      const col = lit > 0.82 ? 0xfff0f4 : lit > 0.58 ? 0xffd2de : lit > 0.36 ? 0xf0a0bc : 0xb86a8c;
      flower(img, (cx + dx * r * 1.2) * S, (cy + dy * r) * S, 1.9 + fr() * 1.3, col, k);
    }
  };
  const evergreen = (cx, cy, r, seed) => {
    for (let Y = Math.floor((cy - r) * S); Y <= (cy + r) * S; Y++)
      for (let X = Math.floor((cx - r) * S); X <= (cx + r) * S; X++) {
        const x = (X + 0.5) / S;
        const y = (Y + 0.5) / S;
        const dx = (x - cx) / r;
        const dy = (y - cy) / r;
        const n = fbm(x, y, { seed, scale: 1.8, octaves: 3 });
        if (dx * dx + dy * dy > 0.8 + n * 0.4) continue;
        img.set(X, Y, ramp([0x0e1a1e, 0x16262a, 0x22383a, 0x34504a], 0.25 + dx * 0.3 - dy * 0.3 + (n - 0.5) * 0.7));
      }
  };
  // the canopy: crowns in rows down the slope, each row a little lower and nearer
  const canopy = (yFrom, yTo, seed, count) => {
    const cr = rng(seed);
    const crowns = [];
    for (let k = 0; k < count; k++) {
      const x = cr() * (W + 20) - 10;
      const y = yFrom + cr() * (yTo - yFrom);
      const r = 6 + cr() * 7;
      const ever = cr() < 0.18;
      if (y >= hill(x) - 6) crowns.push({ x, y, r, ever });
    }
    crowns.sort((a, b) => a.y - b.y);
    for (const c of crowns) (c.ever ? evergreen : blossom)(c.x, c.y, c.r, seed + Math.round(c.x * 7 + c.y));
  };
  canopy(276, 318, 561, 110);
  // the Chūreitō: five vermilion storeys, their balconies and lit lattice, roofs with swept eaves, the dawn on their right, the spire
  {
    const cx = 44 * S;
    const base = 322 * S;
    const TIER = 39;
    for (let k = 0; k < 5; k++) {
      const eave = 48 - k * 5;
      const w = eave - 15;
      const yb = base - 42 + 39 - k * TIER;
      for (let j = 0; j < 27; j++)
        for (let i = -w; i <= w; i++) {
          const y = yb - j;
          const side = (i + w) / (2 * w);
          let c = mix(0x7a2418, 0xf0683a, side);
          const b = (i + 300) % 8;
          if (b < 2) c = scaleColor(c, 0.6);
          else if (j > 7 && j < 20) c = (j - 7) % 4 === 0 || b === 5 ? 0x3a1410 : mix(0x5a2418, 0xffb060, side * 0.9);
          if (j < 6) c = (i + 300) % 4 === 0 ? 0xffc890 : j === 5 ? mix(0xa84a30, 0xffa070, side) : 0x3a1410;
          img.set(cx + i, y, c);
        }
      const roofH = 13;
      const top = yb - 27 - roofH + 1;
      for (let i = -eave; i <= eave; i++) {
        const a = Math.abs(i) / eave;
        const lift = Math.round(a ** 3.2 * 9);
        for (let j = 0; j < roofH; j++) {
          if (Math.abs(i) > eave * (0.42 + (j / roofH) * 0.58) + 1) continue;
          let c = i < 0 ? 0x2a2a3e : 0x4a4258;
          if ((i + 300) % 4 === 0) c = scaleColor(c, 1.28);
          if (j % 3 === 0) c = scaleColor(c, 0.84);
          if (j >= roofH - 3) c = j === roofH - 1 ? 0x14141e : i > 0 ? 0xffa070 : 0x5a5070;
          img.set(cx + i, top + j - lift, c);
        }
      }
      for (let i = 0; i <= eave * 0.42; i++) img.set(cx + i, top, 0xffc890);
      for (const s of [-1, 1]) img.set(cx + s * eave, top + roofH - 8, 0xf0c060);
    }
    const top = base - 42 + 39 - 4 * TIER - 42;
    for (let j = 0; j < 46; j++) {
      img.set(cx, top - j, 0xe2aa32);
      img.set(cx + 1, top - j, 0xfff0a0);
      if (j > 6 && j < 34 && j % 3 === 0) for (let i = -3; i <= 3; i++) img.set(cx + i, top - j, i < 0 ? 0x8a6a20 : 0xf0c860);
    }
    img.disc(cx + 0.5, top - 47, 2.4, 0xfff0a0);
  }
  canopy(322, 430, 601, 120); // the trees in front, down to the bottom of the picture

  // ---- a blossoming branch reaching across from the left, under the sky's writing
  {
    const fr = rng(701);
    const tips = [];
    const bough = (x, y, a, len, th, depth) => {
      for (let i = 0; i < len; i++) {
        x += Math.cos(a);
        y += Math.sin(a);
        a += (fr() - 0.5) * 0.12;
        const t = th * (1 - (i / len) * 0.6);
        for (let j = -t; j <= t; j += 0.5) img.set(Math.round(x), Math.round(y + j), j < -t * 0.3 ? 0x5a3a4c : j < t * 0.4 ? 0x2a1a24 : 0x1a1220);
        if (i % 22 === 11) tips.push([x, y]);
        if (depth > 0 && i > 14 && fr() < 0.035) bough(x, y, a + (fr() < 0.5 ? -1 : 1) * (0.5 + fr() * 0.6), len * (0.3 + fr() * 0.3), t * 0.6, depth - 1);
      }
      tips.push([x, y]);
    };
    bough(-4, 318, 0.26, 210, 4, 2);
    for (const [cols, n, sz] of [[[0x7a3e60, 0x9a5474], 2, 2.6], [[0xd88fa8, 0xe8a0b8], 3, 3.2], [[0xffc9d6, 0xffe0e6, 0xfff4f6], 3, 4]])
      for (const [tx, ty] of tips)
        for (let k = 0; k < n; k++) flower(img, tx + (fr() - 0.5) * 18, ty + (fr() - 0.5) * 15, sz * (0.8 + fr() * 0.5), cols[Math.floor(fr() * cols.length)], k);
  }
  return img;
}

/** The cloud bank that drifts across the mountain's foot: a strip that tiles sideways, soft at its lower edge. */
export function buildEndingClouds() {
  const r = new Raster(W * S, 34 * S);
  cloudSea(r, 10, 22, 5, 9, 40, 571, (x, y) => (y < 24 ? 1 : Math.max(0, 1 - (y - 24) / 10)), true);
  return r;
}

/** The night behind the summary and the parade: a tile that repeats upwards, stars, a band of them, long gilt bars of cloud. */
export function buildEndingNight() {
  const FW = W * S;
  const FH = 240 * S;
  const r = new Raster(FW, FH);
  for (let Y = 0; Y < FH; Y++)
    for (let X = 0; X < FW; X++) {
      const m = fbm(X * 0.5, Y, { seed: 801, scale: 90, octaves: 3, periodY: FH });
      const t = hashPx(X, Y, 802);
      let c = mix(0x080a1c, 0x161a3c, m);
      c = mix(c, 0x241e50, Math.max(0, m - 0.55) * 1.4);
      if (t < 0.1) c = scaleColor(c, 0.95);
      r.set(X, Y, c);
    }
  const sr = rng(803);
  for (let i = 0; i < 620; i++) {
    const X = Math.floor(sr() * FW);
    const Y = Math.floor(sr() * FH);
    const a = sr() ** 2 * 0.9 + 0.1;
    const c = sr() < 0.2 ? 0xffe4c8 : sr() < 0.3 ? 0xc8d8ff : 0xffffff;
    r.set(X, Y, c, a);
    if (a > 0.8) for (const [i2, j2] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) r.set(X + i2, (Y + j2 + FH) % FH, c, a * 0.4);
  }
  const bars = [[8, 40, [[6, 0, 40, 5], [0, 4, 62, 6], [16, 9, 30, 5]]], [112, 128, [[8, 0, 32, 5], [0, 4, 58, 6], [14, 9, 26, 4]]], [34, 206, [[0, 0, 28, 4], [8, 3, 42, 5]]]];
  for (const [x0, y0, list] of bars)
    for (const [dx, dy, w, h] of list) {
      const X0 = (x0 + dx) * S;
      const Y0 = (y0 + dy) * S;
      const hS = h * S;
      const wS = w * S;
      const rad = hS / 2;
      for (let Y = Y0 - 2; Y < Y0 + hS + 2; Y++)
        for (let X = X0 - 2; X < X0 + wS + 2; X++) {
          const qx = Math.max(X0 + rad - X, X - (X0 + wS - rad), 0);
          const d = Math.hypot(qx, Y - (Y0 + rad));
          if (d > rad + 1 || X < 0 || X >= FW) continue;
          r.set(X, (Y + FH) % FH, d > rad - 1.5 ? 0x8a7a54 : mix(0x1e2848, 0x141a36, (Y - Y0) / hS), 0.9);
        }
    }
  return r;
}
