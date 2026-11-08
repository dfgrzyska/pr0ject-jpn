// The title screen at 540 px: a festival evening under a torii, Fuji and the moon, a pagoda and a town with its windows
// lit, with room for the logo and the four menu cards; the lanterns, the cards, their icons and a petal. Layout in the
// game's units x 3, every frame shown at a third of its size (see JourneyMenu.js). Kept apart from the sprite atlas.
import { Raster, fbm, mix, rng, scaleColor } from '../lib/raster.mjs';
import { hashPx } from './hires.mjs';
import { logoFine, sealsFine } from './logo.mjs';

const S = 3;
const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const ramp = (stops, y) => {
  for (let i = 0; i + 1 < stops.length; i++) if (y <= stops[i + 1][0]) return mix(stops[i][1], stops[i + 1][1], Math.max(0, (y - stops[i][0]) / (stops[i + 1][0] - stops[i][0])));
  return stops[stops.length - 1][1];
};

const SKY = [[0, 0x0d1430], [120, 0x1a1f48], [230, 0x3f2c5c], [310, 0x7a4366], [370, 0xb85f5e], [420, 0xe88f5e], [480, 0xf0a868]];
const MOON = [393, 270, 51];
export const EVENING_TOP = 60; // (game units of night sky over the scene)
const FUJI_X = 273;

function sky(r) {
  const [mx, my, mr] = MOON;
  for (let y = 0; y < r.h; y++)
    for (let x = 0; x < r.w; x++) {
      const d = Math.hypot(x - mx, y - my);
      let c = ramp(SKY, y + (hashPx(x, y, 1) - 0.5) * 7);
      if (d < 240) c = mix(c, 0xffc890, (1 - d / 240) ** 2.4 * 0.55);
      r.set(x, y, c);
    }
  // the stars, more of them high up
  const sr = rng(11);
  for (let k = 0; k < 420; k++) {
    const x = Math.floor(sr() * r.w);
    const y = Math.floor(sr() ** 1.7 * 300);
    const a = (1 - y / 300) * (0.3 + sr() * 0.7);
    const big = sr() < 0.05;
    r.set(x, y, sr() < 0.3 ? 0xffe4c8 : 0xdfe6ff, a);
    if (big) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) r.set(x + dx, y + dy, 0xffffff, a * 0.5);
  }
  // the moon: its seas, a brighter limb, a soft halo
  for (let y = my - mr - 8; y <= my + mr + 8; y++)
    for (let x = mx - mr - 8; x <= mx + mr + 8; x++) {
      const dx = x + 0.5 - mx;
      const dy = y + 0.5 - my;
      const d = Math.hypot(dx, dy);
      if (d > mr + 1) {
        if (d < mr + 8) r.set(x, y, 0xffe0b0, (1 - (d - mr) / 8) * 0.3);
        continue;
      }
      const sea = fbm(x, y, { seed: 21, scale: 16, octaves: 3 });
      let c = mix(0xffeccb, 0xffcf96, (dx + dy * 0.5) / (mr * 2) + 0.5);
      if (sea > 0.54) c = mix(c, 0xe6a97e, Math.min(1, (sea - 0.54) * 5) * 0.6);
      if (hashPx(x >> 1, y >> 1, 22) > 0.985) c = scaleColor(c, 0.92);
      r.set(x, y, c, d > mr ? 0.5 : 1);
    }
  // long thin clouds lit from below, one drawn across the moon
  for (let y = 190; y < 400; y++)
    for (let x = 0; x < r.w; x++) {
      const n = fbm(x * 0.28, y * 2.4, { seed: 31, scale: 26, octaves: 3 });
      const band = smooth(0.54, 0.68, n + (y > 250 ? 0.05 : 0) - Math.abs(y - 300) * 0.0004);
      if (band <= 0) continue;
      const lit = fbm(x * 0.28, (y + 3) * 2.4, { seed: 31, scale: 26, octaves: 3 }) < n;
      r.set(x, y, lit ? mix(0x8a4e70, 0xffb080, smooth(220, 400, y)) : mix(0x35284e, 0xa85a66, smooth(220, 400, y)), band * 0.62);
    }
  // a skein of birds going home past the moon
  const bird = (x, y, s) => {
    for (let i = 0; i <= s; i++) {
      r.set(x - i, y - Math.round(i * 0.5), 0x1a1730, 0.9);
      r.set(x + i, y - Math.round(i * 0.5), 0x1a1730, 0.9);
    }
  };
  [[318, 234, 4], [304, 226, 3], [332, 222, 3], [290, 216, 3], [346, 212, 2], [276, 208, 2]].forEach(([x, y, s]) => bird(x, y, s));
}

function fuji(r) {
  const ridge = (x) => {
    const d = Math.max(0, Math.abs(x - FUJI_X) - 10);
    return 262 + d * 0.5 + d * d * 0.00125 + (fbm(x, 3, { seed: 41, scale: 22 }) - 0.5) * 5 * Math.min(1, d / 30) + (d === 0 ? (hashPx(x >> 2, 1, 42) > 0.5 ? 1 : 0) : 0);
  };
  for (let x = 0; x < r.w; x++) {
    const top = Math.round(ridge(x));
    const d = x - FUJI_X;
    for (let y = top; y < 480; y++) {
      const t = d / (y - 244);
      const g = fbm(t * 70, y * 0.22, { seed: 43, scale: 6, octaves: 3 });
      const side = smooth(-34, 40, d + (g - 0.5) * 60);
      let c = mix(0x2c3158, 0x74587a, side);
      c = scaleColor(c, 0.78 + g * 0.55);
      const snowline = 318 + (g - 0.5) * 120 + Math.sin(t * 24) * 11;
      if (y < snowline) {
        let snow = mix(0x989cc6, 0xffe6d0, side);
        if (g < 0.4) snow = mix(snow, c, 0.5);
        else if (g > 0.62) snow = scaleColor(snow, 1.05);
        c = snow;
      } else {
        // the forest climbing its foot
        const f = smooth(350, 430, y);
        if (f > 0) c = mix(c, hashPx(x >> 1, y >> 1, 44) < 0.5 ? 0x232a4a : 0x2c3454, f);
      }
      if (y === top) c = scaleColor(c, 1.14);
      r.set(x, y, c);
    }
  }
}

function hills(r) {
  const layers = [
    { c: 0x4b4765, base: 396, a: 15, p: 58, seed: 51 },
    { c: 0x303a55, base: 418, a: 14, p: 72, seed: 52 },
    { c: 0x202c43, base: 448, a: 13, p: 90, seed: 53 },
  ];
  layers.forEach((l, k) => {
    const crest = new Float32Array(r.w);
    for (let x = 0; x < r.w; x++) crest[x] = l.base + Math.sin(x / l.p + k * 1.7) * l.a + (fbm(x, k, { seed: l.seed, scale: 34 }) - 0.5) * 22;
    for (let x = 0; x < r.w; x++)
      for (let y = Math.round(crest[x]); y < r.h; y++) {
        const dep = y - crest[x];
        let c = mix(l.c, mix(0xc8706a, 0x6a4f6e, k / 2), smooth(6, 70, dep) * 0.42);
        const t = hashPx(x >> 1, y >> 1, l.seed);
        if (t < 0.22) c = scaleColor(c, 0.9);
        else if (t > 0.86) c = scaleColor(c, 1.08);
        r.set(x, y, c);
      }
    // cedars along the ridge and down the near slope
    const tr = rng(l.seed + 9);
    for (let n = 0; n < 240 + k * 50; n++) {
      const x = Math.floor(tr() * r.w);
      const y = crest[x] + (tr() < 0.55 ? 0 : tr() * 22);
      const h = 7 + tr() * (6 + k * 4);
      const dark = scaleColor(l.c, 0.8);
      const lit = mix(l.c, 0xd88a6a, 0.22);
      for (let j = 0; j < h; j++) {
        const hw = (j / h) * (h * 0.32);
        for (let i = -Math.round(hw); i <= hw; i++) r.set(x + i, Math.round(y - h + j), i > 0 ? lit : dark);
      }
    }
  });
}

/** A house among the hills at dusk: tiled hip roof, plaster, its windows lit. */
function townHouse(r, x, y, w, h, seed) {
  const hr = rng(seed);
  const rh = Math.round(h * 0.62);
  for (let j = 0; j < rh; j++) {
    const ins = Math.round((1 - j / rh) * (w * 0.22));
    for (let i = ins - 3; i < w - ins + 3; i++) {
      const edge = j === rh - 1;
      let c = i < w * 0.5 ? 0x2a2f49 : 0x3d3f5a;
      if (i % 3 === 0) c = scaleColor(c, 1.2);
      if (j % 3 === 0) c = scaleColor(c, 0.84);
      if (edge) c = 0x151a2c;
      r.set(x + i, y + j, c);
    }
  }
  for (let i = Math.round(w * 0.22); i < w - w * 0.22; i++) r.set(x + i, y, 0x8a7a88);
  for (let j = rh; j < h; j++)
    for (let i = 1; i < w - 1; i++) {
      let c = i < 3 ? 0x5a4c58 : 0x8a7a70;
      if (i % 12 === 0) c = 0x2c2228;
      if (j === rh) c = 0x171320;
      r.set(x + i, y + j, c);
    }
  for (let wx = 4; wx + 5 < w - 2; wx += 9) {
    const lit = hr() < 0.75;
    for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) r.set(x + wx + i, y + rh + 2 + j, lit ? (i === 2 || j === 2 ? 0xc87a3a : 0xffc878) : 0x28283a);
  }
}

function town(r) {
  // a small castle on its stone base on the hill, its windows lit
  const cx = 424;
  const by = 408;
  for (let j = 0; j < 14; j++) {
    const hw = 24 + j * 0.8;
    for (let i = -Math.round(hw); i <= hw; i++) {
      let c = i < 0 ? 0x3e3a54 : 0x62566e;
      if ((j + (i >> 3)) % 4 === 0) c = scaleColor(c, 0.8);
      r.set(cx + i, by + j, c);
    }
  }
  [[22, 12], [16, 10], [10, 9]].forEach(([hw, wh], t) => {
    const yy = by - 9 - t * 16 - 2;
    for (let j = 0; j < wh; j++)
      for (let i = -hw + 3; i <= hw - 3; i++) {
        let c = i < 0 ? 0xa4a0b8 : 0xe8d0c4;
        if (j > 2 && j < 7 && (i + 40) % 8 < 3) c = 0xffc070;
        r.set(cx + i, yy + j, c);
      }
    for (let i = -hw - 4; i <= hw + 4; i++) {
      const up = Math.round(((Math.abs(i) / (hw + 4)) ** 3) * 4);
      for (let j = 0; j < 6; j++) r.set(cx + i, yy - 5 + j - up + 3, j < 2 ? (i < 0 ? 0x4a4e70 : 0x7e7a96) : i % 3 === 0 ? 0x25294a : 0x30345a);
    }
  });
  for (let i = -7; i <= 7; i++) for (let j = 0; j < 3; j++) r.set(cx + i, by - 56 + j - Math.round((Math.abs(i) / 7) ** 3 * 3), 0x4a4e70);
  r.set(cx - 7, by - 60, 0xf0c060);
  r.set(cx + 7, by - 60, 0xf0c060);
  // the town below it
  const hr = rng(61);
  const houses = [];
  for (let x = 286; x < 500; ) {
    const w = 26 + Math.floor(hr() * 18);
    houses.push([x, 400 + Math.floor(hr() * 18), w, 28 + Math.floor(hr() * 6)]);
    x += w + 2 + Math.floor(hr() * 6);
  }
  houses.sort((a, b) => a[1] - b[1]);
  houses.forEach(([x, y, w, h], k) => townHouse(r, x, y, w, h, 70 + k));
  // kitchen smoke going straight up in the still air
  for (const [x, y] of [[312, 400], [392, 404], [472, 402]])
    for (let j = 0; j < 46; j++) {
      const w = 1 + j * 0.05;
      const ox = Math.sin(j / 9 + x) * (j * 0.09);
      for (let i = -Math.round(w); i <= w; i++) r.set(Math.round(x + ox + i), y - j, 0xd8c0c8, 0.22 * (1 - j / 46));
    }
  // a string of lanterns across the roofs
  for (let x = 296; x < 490; x++) {
    const y = 386 + Math.sin((x - 296) / 31) * 6;
    r.set(x, Math.round(y), 0x201a28, 0.8);
    if ((x - 296) % 15 === 0) {
      for (let j = 1; j < 5; j++) for (let i = -1; i <= 1; i++) r.set(x + i, Math.round(y) + j, j === 1 || j === 4 ? 0xc8402a : 0xffb060);
    }
  }
}

function pagoda(r) {
  const cx = 87;
  const bottom = 456;
  const WALL = [15, 18, 21, 24, 27];
  const HALF = [30, 36, 42, 48, 54];
  const TIER = 37;
  for (let t = 4; t >= 0; t--) {
    const base = bottom - (4 - t) * TIER;
    const w = WALL[t];
    const eave = HALF[t];
    // the wall: lacquered posts and lit paper between, a railing round the balcony
    for (let j = 0; j < 22; j++)
      for (let i = -w; i <= w; i++) {
        const y = base - j;
        let c = i < -w * 0.4 ? 0x45242e : 0x6e3540;
        const k = (i + w + 300) % 10;
        if (k < 2) c = i < 0 ? 0x3a1e28 : 0x8a4048;
        else if (j > 5 && j < 17) c = (j - 5) % 4 === 0 || k === 6 ? 0xc87a3a : 0xffc070;
        if (j <= 4) c = (i + 300) % 4 === 0 ? 0xc8604a : j === 4 ? 0xe08058 : 0x2c1820;
        r.set(cx + i, y, c);
      }
    // the roof: curved eaves rising at the corners, rows of tiles, a pale row of end tiles, a bell at each corner
    const roofH = 13;
    const top = base - 22 - roofH + 1;
    for (let i = -eave; i <= eave; i++) {
      const a = Math.abs(i) / eave;
      const lift = Math.round(a ** 3.2 * 9);
      for (let j = 0; j < roofH; j++) {
        const y = top + j - lift;
        const inRoof = Math.abs(i) <= eave * (0.42 + (j / roofH) * 0.58) + 1;
        if (!inRoof) continue;
        let c = i < 0 ? 0x1b2640 : 0x34405e;
        if ((i + 300) % 4 === 0) c = scaleColor(c, 1.3);
        if (j % 3 === 0) c = scaleColor(c, 0.84);
        if (j >= roofH - 3) c = j === roofH - 1 ? 0x0e1220 : (i + 300) % 3 === 0 ? 0xc0a0a0 : 0x5a4a60;
        r.set(cx + i, y, c);
      }
    }
    for (let i = -Math.round(eave * 0.42); i <= eave * 0.42; i++) r.set(cx + i, top, i < 0 ? 0x4a5478 : 0xa08a98);
    for (const s of [-1, 1]) {
      r.set(cx + s * eave, top + roofH - 7, 0xf0c060);
      r.set(cx + s * eave, top + roofH - 6, 0xb88a30);
    }
  }
  // the finial: the mast, its nine rings, the jewel on top
  const top = bottom - 4 * TIER - 34;
  for (let j = 0; j < 44; j++) {
    r.set(cx, top - j, 0xd8b078);
    r.set(cx + 1, top - j, 0x8a6a48);
    if (j > 6 && j < 34 && j % 3 === 0) for (let i = -3; i <= 3; i++) r.set(cx + i, top - j, i < 0 ? 0x8a6a48 : 0xe8c080);
  }
  r.disc(cx + 0.5, top - 45, 2.4, 0xf8d890);
  r.set(cx, top - 46, 0xffffff);
}

function torii(r) {
  const W = r.w;
  const POSTS = [33, 486];
  // the posts: worn vermilion, lit on the side towards the moon, grain and scuffs, black feet
  POSTS.forEach((x0, k) => {
    for (let y = 96; y < 525; y++)
      for (let i = 0; i < 27; i++) {
        let c;
        if (i >= 21) c = k ? 0x4e2230 : 0x341a28;
        else {
          c = k === 0 ? mix(0x8a3232, 0xe8784e, i / 20) : mix(0xe8784e, 0x8a3232, i / 20);
          const grain = fbm(i * 3, y * 0.12, { seed: 61 + k, scale: 5, octaves: 2 });
          c = scaleColor(c, 0.84 + grain * 0.3);
          if (hashPx(x0 + i, y >> 2, 63) > 0.97) c = scaleColor(c, 0.7);
          if (y > 480) c = y < 484 ? 0xc8a050 : i < 3 ? 0x2a2c40 : 0x171a2a; // the copper-bound foot
        }
        r.set(x0 + i, y, c);
      }
    // the wedge through the tie beam
    for (let y = 126; y < 150; y++) for (let i = -3; i < 30; i++) if (y >= 128 && y < 148 && (i < 0 || i >= 27)) r.set(x0 + i, y, 0x5a2a30);
  });
  // the tie beam
  for (let y = 132; y < 146; y++)
    for (let x = 18; x < W - 18; x++) {
      const e = y - 132;
      let c = e < 2 ? 0xf08a5e : e > 10 ? 0x6a2a30 : 0xb8473c;
      c = scaleColor(c, 0.9 + fbm(x * 0.2, y * 2, { seed: 65, scale: 8 }) * 0.2);
      r.set(x, y, c);
    }
  for (let x = 18; x < W - 18; x++) for (let j = 0; j < 4; j++) r.set(x, 146 + j, 0x141020, 0.32 - j * 0.07);
  // the top beam: gently curved, its ends lifting; a green-black copper cap over it, a darker beam beneath
  const baseAt = (x) => 72 + 16 * Math.sin((x / W) * Math.PI);
  for (let x = 0; x < W; x++) {
    const b = Math.round(baseAt(x));
    for (let j = -11; j < 30; j++) {
      const y = b + j;
      let c;
      if (j < -1) {
        c = (x % 7 < 2 ? 0x2c3a44 : 0x1a2632);
        if (j <= -10) c = 0x6e8a88;
        else if (j <= -8) c = 0x42565a;
      } else if (j < 20) {
        c = j < 2 ? 0xf29a68 : j > 15 ? 0x7a2e32 : mix(0xd85a44, 0xa83c38, j / 20);
        c = scaleColor(c, 0.9 + fbm(x * 0.25, y * 2, { seed: 66, scale: 9 }) * 0.2);
      } else if (j < 22) c = 0x1a1420;
      else c = j < 24 ? 0xb8473c : j > 27 ? 0x5a2228 : 0x8a3634;
      if (x < 3 || x > W - 4) c = scaleColor(c, 0.7);
      r.set(x, y, c);
    }
  }
  // the name plaque between the beams, gold on black: Japan
  {
    const x0 = 252;
    const y0 = 106;
    for (let j = 0; j < 48; j++)
      for (let i = 0; i < 36; i++) {
        const e = Math.min(i, 35 - i, j, 47 - j);
        r.set(x0 + i, y0 + j, e === 0 ? 0x20141c : e < 3 ? (i < 18 ? 0xe8b860 : 0xa87a38) : 0x1c1826);
      }
    const gold = (i, j, w, h) => r.rect(x0 + i, y0 + j, w, h, 0xf0c868);
    // 日
    gold(11, 6, 14, 2);
    gold(11, 13, 14, 2);
    gold(11, 20, 14, 2);
    gold(11, 6, 2, 16);
    gold(23, 6, 2, 16);
    // 本
    gold(9, 28, 18, 2);
    gold(17, 25, 2, 18);
    gold(12, 38, 12, 2);
    for (let k = 0; k < 8; k++) {
      r.set(x0 + 16 - k, y0 + 30 + k, 0xf0c868);
      r.set(x0 + 15 - k, y0 + 30 + k, 0xf0c868);
      r.set(x0 + 19 + k, y0 + 30 + k, 0xf0c868);
      r.set(x0 + 20 + k, y0 + 30 + k, 0xf0c868);
    }
  }
  // the sacred rope just under the tie beam, paper streamers at either side of the logo
  for (let x = 60; x < W - 60; x++) {
    if (x > 248 && x < 292) continue;
    const y = 146 + Math.sin(((x - 60) / (W - 120)) * Math.PI) * 3;
    for (let j = 0; j < 4; j++) r.set(x, Math.round(y) + j, (x + j * 2) % 5 < 2 ? 0xa89468 : 0xe0d0a0);
  }
  for (const sx of [100, 440]) {
    for (let k = 0; k < 4; k++) {
      const yy = 150 + k * 5;
      const off = k % 2 ? 2 : -2;
      r.rect(sx + off, yy, 7, 5, k % 2 ? 0xd8d4c8 : 0xf8f4ec);
    }
  }
}

/** One blossom: five notched petals, a dark heart, the stamens. */
export function flower(r, cx, cy, s, col, seed) {
  const a0 = hashPx(cx, cy, seed) * 6.28;
  for (let p = 0; p < 5; p++) {
    const a = a0 + (p / 5) * Math.PI * 2;
    r.disc(cx + Math.cos(a) * s * 0.62, cy + Math.sin(a) * s * 0.62, s * 0.52, p < 2 ? scaleColor(col, 0.92) : col);
    r.set(Math.round(cx + Math.cos(a) * s * 1.05), Math.round(cy + Math.sin(a) * s * 1.05), scaleColor(col, 0.72));
  }
  r.disc(cx, cy, Math.max(0.8, s * 0.26), 0xc8486a);
  if (s > 3) {
    r.set(Math.round(cx) + 1, Math.round(cy) - 1, 0xffe080);
    r.set(Math.round(cx) - 1, Math.round(cy) + 1, 0xffe080);
  }
}

function blossoms(r, dy) {
  [-1, 1].forEach((side) => {
    const br = rng(side < 0 ? 71 : 72);
    const ox = side < 0 ? 0 : r.w - 1;
    const tips = [];
    const bough = (x, y, a, len, th, depth) => {
      for (let i = 0; i < len; i++) {
        x += Math.cos(a);
        y += Math.sin(a);
        a += (br() - 0.5) * 0.14;
        if (y > 82 + dy) a -= 0.08 * side * -1 * (Math.cos(a) > 0 ? 1 : -1);
        const t = th * (1 - (i / len) * 0.55);
        for (let j = -t; j <= t; j += 0.5) {
          r.set(Math.round(x), Math.round(y + j), j < -t * 0.3 ? 0x7a5468 : j < t * 0.4 ? 0x3e2638 : 0x271828);
        }
        if (i % 7 === 0) tips.push([x, y]);
        if (depth > 0 && i > 6 && br() < 0.075) bough(x, y, a + (br() < 0.5 ? -1 : 1) * (0.5 + br() * 0.5), len * (0.35 + br() * 0.25), t * 0.62, depth - 1);
      }
      tips.push([x, y]);
    };
    const ang = (d) => (side < 0 ? d : Math.PI - d);
    bough(ox, 40 + dy, ang(-0.3), 138, 4.2, 3);
    bough(ox, 58 + dy, ang(0.32), 104, 3.2, 3);
    bough(ox, 4 + dy, ang(-0.02), 96, 2.6, 2);
    // the flowers, the shaded ones first, the sunlit ones over them
    for (const [cols, n, size] of [[[0x7e4464, 0x9a5474], 2.4, 2.4], [[0xc47a96, 0xd88fa8], 2.8, 3.1], [[0xf0aebc, 0xffc9d0, 0xffdde0], 2.2, 3.8]]) {
      for (const [tx, ty] of tips)
        for (let k = 0; k < n; k++) {
          const x = tx + (br() - 0.5) * 22;
          const y = ty + (br() - 0.5) * 18;
          if (y > 96 + dy || (y > 58 + dy && Math.abs(x - r.w / 2) < 170)) continue;
          flower(r, x, y, size * (0.8 + br() * 0.5), cols[Math.floor(br() * cols.length)], k);
        }
    }
    // little green leaves and buds among them
    for (const [tx, ty] of tips) {
      if (br() < 0.16) {
        const x = Math.round(tx + (br() - 0.5) * 20);
        const y = Math.round(ty + (br() - 0.5) * 16);
        if (y > 96 + dy) continue;
        r.set(x, y, 0x6a8a4a);
        r.set(x + 1, y, 0x88a85a);
        r.set(x + 1, y + 1, 0x4e6e3a);
      }
    }
  });
}

function evening() {
  const r = new Raster(180 * S, 220 * S);
  sky(r);
  fuji(r);
  // the mist lying round its foot
  for (let y = 380; y < 450; y++)
    for (let x = 0; x < r.w; x++) {
      const n = fbm(x * 0.4, y * 1.6, { seed: 47, scale: 24, octaves: 3 });
      r.set(x, y, 0xf0b090, smooth(0.42, 0.7, n) * (1 - Math.abs(y - 415) / 36) * 0.55);
    }
  hills(r);
  town(r);
  pagoda(r);
  torii(r);
  // a smooth fade into the navy cloth under the menu
  for (let y = 522; y < r.h; y++) for (let x = 0; x < r.w; x++) r.set(x, y, 0x111c2b, Math.min(1, (y - 522) / 135));
  // more night above it, for a tall screen; the blossom over all of it
  const TOP = EVENING_TOP * S;
  const out = new Raster(r.w, r.h + TOP);
  for (let y = 0; y < TOP; y++)
    for (let x = 0; x < out.w; x++) out.set(x, y, mix(0x070b1e, 0x0d1430, (y + (hashPx(x, y, 2) - 0.5) * 5) / TOP));
  const sr = rng(12);
  for (let k = 0; k < 260; k++) {
    const a = 0.3 + sr() * 0.7;
    const x = Math.floor(sr() * out.w);
    const y = Math.floor(sr() * TOP);
    out.set(x, y, sr() < 0.3 ? 0xffe4c8 : 0xdfe6ff, a);
    if (sr() < 0.06) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) out.set(x + dx, y + dy, 0xffffff, a * 0.5);
  }
  out.blit(r, 0, TOP);
  blossoms(out, TOP);
  return out;
}

/** The paper lantern, with its glow. Its string is at the top of the frame's middle. */
function lantern() {
  const r = new Raster(30 * S, 40 * S);
  const cx = r.w / 2;
  const cy = 51;
  // the glow round it, in the frame itself
  for (let y = 0; y < r.h; y++)
    for (let x = 0; x < r.w; x++) {
      const d = Math.hypot(x + 0.5 - cx, (y + 0.5 - cy) * 0.86) / 45;
      if (d < 1) r.set(x, y, 0xffa050, (1 - d) ** 2 * 0.4);
    }
  for (let y = 0; y < 18; y++) r.set(Math.floor(cx), y, y % 3 ? 0xc89d72 : 0x8a6a48);
  for (let y = cy - 34; y <= cy + 34; y++)
    for (let x = cx - 26; x <= cx + 26; x++) {
      const dx = (x + 0.5 - cx) / 25;
      const dy = (y + 0.5 - cy) / 33;
      const d = dx * dx + dy * dy;
      if (d > 1) continue;
      const rib = (y - cy + 60) % 5 === 0;
      const inner = 1 - Math.hypot(dx * 1.3, dy);
      let c = mix(0xb83a30, 0xff9a50, Math.max(0, inner) ** 0.8);
      if (inner > 0.55) c = mix(c, 0xffd890, (inner - 0.55) * 2);
      if (d > 0.82) c = scaleColor(c, 0.72);
      if (rib) c = scaleColor(c, 0.74);
      r.set(x, y, c);
    }
  // the painted crest: a ring and three commas
  for (let a = 0; a < Math.PI * 2; a += 0.03) r.set(Math.round(cx + Math.cos(a) * 12), Math.round(cy + Math.sin(a) * 12), 0x6a1a18);
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + 0.4;
    r.disc(cx + Math.cos(a) * 5.5, cy + Math.sin(a) * 5.5, 3.2, 0x6a1a18);
    for (let t = 0; t < 1; t += 0.1) {
      const b = a + t * 1.3;
      r.set(Math.round(cx + Math.cos(b) * (6 + t * 3)), Math.round(cy + Math.sin(b) * (6 + t * 3)), 0x6a1a18);
    }
  }
  for (const [yy, hw] of [[cy - 35, 12], [cy + 31, 12]])
    for (let j = 0; j < 6; j++)
      for (let i = -hw; i <= hw; i++) r.set(Math.round(cx + i), yy + j, j === 0 ? 0x5a5468 : i < 0 ? 0x2a2634 : 0x3e3a48);
  for (let y = cy + 37; y < cy + 44; y++) r.set(Math.floor(cx), y, 0xeb9a56);
  for (let y = cy + 44; y < cy + 58; y++) for (let i = -4; i <= 4; i++) if (y < cy + 46 || (i + 4) % 2 === 0) r.set(Math.floor(cx) + i, y, y < cy + 46 ? 0xf0c060 : 0xc34e3d);
  return r;
}

/** The seigaiha cloth under the menu, a repeating tile. */
function waves() {
  const r = new Raster(180 * S, 24 * S);
  for (let y = 0; y < r.h; y++)
    for (let x = 0; x < r.w; x++) {
      const weave = (x % 3 === 0 ? 3 : 0) + (y % 3 === 0 ? 2 : 0);
      const t = hashPx(x, y, 81);
      const c = 0x111c2b + (weave << 16) + (weave << 8) + weave;
      r.set(x, y, t < 0.12 ? scaleColor(c, 0.9) : t > 0.92 ? scaleColor(c, 1.12) : c);
    }
  for (let row = 0; row < 6; row++)
    for (let cx = -36; cx < r.w + 72; cx += 72) {
      const x = cx + (row % 2) * 36;
      const cy = row * 18 + 18;
      // each scale paints out what's behind it, then its rings, the top ring in thread of gold
      for (let yy = cy - 36; yy <= cy; yy++)
        for (let xx = x - 36; xx <= x + 36; xx++) {
          const d = Math.hypot(xx + 0.5 - x, yy + 0.5 - cy);
          if (d > 36) continue;
          let c = null;
          let a = 1;
          if (d > 34.5) c = 0x38465c;
          else if (Math.abs(d - 27) < 0.8 || Math.abs(d - 18) < 0.8 || Math.abs(d - 9) < 0.8) { c = 0x263448; a = 0.9; }
          else c = mix(0x142236, 0x0f1a29, d / 36);
          const py = ((yy % r.h) + r.h) % r.h;
          const px = xx;
          if (px >= 0 && px < r.w) r.set(px, py, c, a);
        }
    }
  return r;
}

/** Handmade paper for the books: fibres, mottling. A repeating tile. */
function washi() {
  const N = 256;
  const r = new Raster(N, N);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const m = fbm(x, y, { seed: 91, scale: 40, octaves: 3, periodX: N, periodY: N });
      const t = hashPx(x, y, 92);
      let c = mix(0xddd0b2, 0xeee3c8, m);
      if (t < 0.06) c = scaleColor(c, 0.97);
      else if (t > 0.95) c = scaleColor(c, 1.02);
      r.set(x, y, c);
    }
  const fr = rng(93);
  for (let k = 0; k < 170; k++) {
    let x = fr() * N;
    let y = fr() * N;
    let a = fr() * 6.28;
    const len = 8 + fr() * 26;
    const c = fr() < 0.7 ? 0xc4b48e : 0xf8f0da;
    for (let i = 0; i < len; i++) {
      x += Math.cos(a);
      y += Math.sin(a);
      a += (fr() - 0.5) * 0.3;
      r.set(((Math.round(x) % N) + N) % N, ((Math.round(y) % N) + N) % N, c, 0.5);
    }
  }
  return r;
}

const ORNAMENT = (card, x, y, sx, sy, c, c2) => {
  // a little fitting in the corner: a bracket with a curled end
  for (let k = 0; k < 15; k++) {
    card.set(x + sx * k, y, c);
    card.set(x, y + sy * k, c);
    if (k < 13) {
      card.set(x + sx * k, y + sy, c2);
      card.set(x + sx, y + sy * k, c2);
    }
  }
  card.disc(x + sx * 15, y + sy * 1, 1.6, c);
  card.disc(x + sx * 1, y + sy * 15, 1.6, c);
  card.disc(x + sx * 6, y + sy * 6, 1.8, c);
  card.set(x + sx * 6, y + sy * 6, c2);
};

function card(primary, active) {
  const r = new Raster(152 * S, 30 * S);
  const W = r.w;
  const H = 27 * S;
  // its shadow on the cloth
  for (let j = 0; j < 9; j++) for (let i = 4; i < W - 2; i++) r.set(i, H + j - 2, 0x05080e, 0.7 * (1 - j / 9));
  if (primary) {
    // a lacquered board: deep vermilion, streaks of the brush, a sheen across its top, gold rules, gilt corner fittings
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const t = y / H;
        let c = active ? mix(0xe25a42, 0xa8302c, t) : mix(0xb0463e, 0x7e2c30, t);
        const s = fbm(x * 0.12, y * 2.2, { seed: 101, scale: 9, octaves: 2 });
        c = scaleColor(c, 0.9 + s * 0.2);
        if (y < 22 && (x + y * 3) % 90 < 34) c = mix(c, 0xffb88a, 0.08);
        // a faint hemp-leaf pattern pressed into the lacquer
        const px = x % 36;
        const py = y % 36;
        if (px === py || px + py === 36 || px === 18) if (y > 8 && y < H - 8 && x > 10 && x < W - 10) c = scaleColor(c, 1.05);
        r.set(x, y, c);
      }
    const gold = active ? 0xffd68a : 0xd8a860;
    const gold2 = active ? 0xb87a30 : 0x8a5e2c;
    for (let x = 6; x < W - 6; x++) {
      r.set(x, 6, gold);
      r.set(x, 7, gold2);
      r.set(x, H - 8, gold2);
      r.set(x, H - 7, gold);
    }
    for (let y = 6; y < H - 6; y++) {
      r.set(6, y, gold);
      r.set(7, y, gold2);
      r.set(W - 8, y, gold2);
      r.set(W - 7, y, gold);
    }
    for (const [x, y, sx, sy] of [[3, 3, 1, 1], [W - 4, 3, -1, 1], [3, H - 4, 1, -1], [W - 4, H - 4, -1, -1]]) ORNAMENT(r, x, y, sx, sy, gold, gold2);
    for (let x = 0; x < W; x++) {
      r.set(x, 0, active ? 0xffc890 : 0xd87a58);
      r.set(x, 1, active ? 0xffa878 : 0xb85a48);
      r.set(x, H - 1, 0x4a181c);
      r.set(x, H - 2, 0x6a2428);
    }
    for (let y = 0; y < H; y++) {
      r.set(0, y, 0xd87a58);
      r.set(W - 1, y, 0x4a181c);
    }
  } else {
    // handmade paper pasted on a thin dark board: fibres, a printed double rule, cells for the icon and the count
    const base = active ? [0xfff2d0, 0xffe6b8] : [0xe9dcbc, 0xd9c8a2];
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const m = fbm(x, y, { seed: 111, scale: 26, octaves: 3 });
        const t = hashPx(x, y, 112);
        let c = mix(base[1], base[0], m);
        if (t < 0.05) c = scaleColor(c, 0.96);
        else if (t > 0.96) c = scaleColor(c, 1.03);
        r.set(x, y, c);
      }
    const fr = rng(113);
    for (let k = 0; k < 90; k++) {
      let x = 4 + fr() * (W - 8);
      let y = 4 + fr() * (H - 8);
      let a = fr() * 6.28;
      const len = 6 + fr() * 18;
      for (let i = 0; i < len; i++) {
        x += Math.cos(a);
        y += Math.sin(a);
        a += (fr() - 0.5) * 0.35;
        if (x > 2 && x < W - 2 && y > 2 && y < H - 2) r.set(Math.round(x), Math.round(y), 0xa88e60, 0.28);
      }
    }
    // a faint wave watermark behind the name
    for (let row = 0; row < 3; row++)
      for (let cx = 100; cx < W - 90; cx += 48) {
        const x = cx + (row % 2) * 24;
        const cy = 18 + row * 24 + 12;
        for (const rad of [8, 16, 23])
          for (let a = Math.PI; a < Math.PI * 2; a += 0.04) {
            const px = Math.round(x + Math.cos(a) * rad);
            const py = Math.round(cy + Math.sin(a) * rad);
            if (py > 5 && py < H - 5 && px > 96 && px < 360) r.set(px, py, 0xb49b74, 0.14);
          }
      }
    const ink = active ? 0xa8321a : 0x8a6e4e;
    const ink2 = active ? 0xd87a50 : 0xb49b74;
    for (let x = 5; x < W - 5; x++) {
      r.set(x, 5, ink);
      r.set(x, 8, ink2);
      r.set(x, H - 9, ink2);
      r.set(x, H - 6, ink);
    }
    for (let y = 5; y < H - 5; y++) {
      r.set(5, y, ink);
      r.set(8, y, ink2);
      r.set(W - 9, y, ink2);
      r.set(W - 6, y, ink);
    }
    for (const dx of [93, 360]) for (let y = 12; y < H - 12; y++) if (y % 4 < 2) r.set(dx, y, ink2);
    for (const [x, y, sx, sy] of [[8, 8, 1, 1], [W - 9, 8, -1, 1], [8, H - 9, 1, -1], [W - 9, H - 9, -1, -1]]) ORNAMENT(r, x, y, sx, sy, ink, ink2);
    for (let x = 0; x < W; x++) {
      r.set(x, 0, 0xfff8e0);
      r.set(x, H - 1, 0x6a5038);
      r.set(x, H - 2, 0x9a805a);
    }
    for (let y = 0; y < H; y++) {
      r.set(0, y, 0xfff8e0);
      r.set(W - 1, y, 0x6a5038);
    }
    if (active) for (let y = 3; y < H - 3; y++) for (let i = 0; i < 4; i++) {
      r.set(i + 1, y, 0xd84a30);
      r.set(W - 2 - i, y, 0xd84a30);
    }
  }
  return r;
}

/** A hanko: a red block, its corners worn, the character for "seal" cut out; the ink uneven. */
function iconStamp() {
  const r = new Raster(48, 48);
  for (let y = 4; y < 44; y++)
    for (let x = 4; x < 44; x++) {
      const e = Math.min(x - 4, 43 - x, y - 4, 43 - y);
      if (e === 0 && (x === 4 || x === 43) && (y === 4 || y === 43)) continue;
      const n = hashPx(x >> 1, y >> 1, 121);
      let c = mix(0xd84a38, 0x9c2a22, (x + y) / 88);
      if (n > 0.9) c = scaleColor(c, 1.2);
      else if (n < 0.1) c = scaleColor(c, 0.82);
      r.set(x, y, c, e < 1 ? 0.8 : 1);
    }
  const cut = (x, y, w, h) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) r.set(x + i, y + j, 0xf8e8d0);
  };
  // the rim
  cut(7, 7, 34, 2);
  cut(7, 39, 34, 2);
  cut(7, 7, 2, 34);
  cut(39, 7, 2, 34);
  // 旅, simplified: a journey
  cut(12, 13, 10, 2);
  cut(16, 11, 2, 26);
  cut(12, 20, 9, 2);
  cut(11, 30, 7, 2);
  cut(26, 12, 11, 2);
  cut(25, 18, 13, 2);
  cut(28, 18, 2, 18);
  cut(34, 22, 2, 15);
  cut(25, 27, 7, 2);
  return r;
}

/** A fox mask: white lacquer, red markings, gold eyes. */
function iconYokai() {
  const r = new Raster(54, 54);
  const cx = 27;
  const inFace = (x, y) => {
    const u = Math.abs(x - cx);
    if (y < 10) return false;
    if (y < 22) return u < 6 + (y - 10) * 1.1 + (y < 16 ? 0 : 0) && u > 0;
    const w = 19 - (y - 22) * 0.62;
    return u < w && y < 48;
  };
  const ear = (x, y, s) => {
    const dx = (x - cx) * s;
    return dx > 8 && dx < 21 && y > 3 + (21 - dx) * 0.2 + (dx - 14) * (dx > 14 ? 1.2 : 0) && y < 24;
  };
  for (let y = 0; y < 54; y++)
    for (let x = 0; x < 54; x++) {
      const face = inFace(x, y) || ear(x, y, 1) || ear(x, y, -1);
      if (!face) {
        if (inFace(x - 2, y - 2) || ear(x - 2, y - 2, 1) || ear(x - 2, y - 2, -1)) r.set(x, y, 0x1a1420, 0.3);
        continue;
      }
      const edge = !(inFace(x + 1, y + 1) || ear(x + 1, y + 1, 1) || ear(x + 1, y + 1, -1));
      let c = mix(0xfffcf0, 0xcfc4b0, (x - cx + 20) / 50 * 0.6 + (y / 54) * 0.4);
      if (edge) c = 0x6a5a50;
      r.set(x, y, c);
    }
  for (const s of [-1, 1]) {
    // inner ear, cheek flames, eye slit
    for (let k = 0; k < 11; k++) for (let i = 0; i < Math.max(1, 5 - k * 0.3); i++) r.set(cx + s * (13 + i + k * 0.2), 10 + k, 0xc8302a);
    for (let k = 0; k < 12; k++) {
      r.set(cx + s * (5 + k), 24 + Math.round(k * 0.34) - (k > 8 ? k - 8 : 0), 0x1a1420);
      r.set(cx + s * (5 + k), 25 + Math.round(k * 0.34) - (k > 8 ? k - 8 : 0), 0x1a1420);
      if (k > 2 && k < 8) r.set(cx + s * (5 + k), 26 + Math.round(k * 0.34), 0xf0b830);
    }
    for (let k = 0; k < 8; k++) for (let j = 0; j < 2; j++) r.set(cx + s * (7 + k * 1.1), 33 + k * 0.7 + j, 0xc8302a);
    r.set(cx + s * 2, 15, 0xc8302a);
    r.set(cx + s * 2, 16, 0xc8302a);
  }
  // the brow mark and the nose
  for (let j = 0; j < 7; j++) for (let i = -Math.max(0, 2 - j * 0.3); i <= Math.max(0, 2 - j * 0.3); i++) r.set(Math.round(cx + i), 12 + j, 0xc8302a);
  r.disc(cx, 42, 2.6, 0x1a1420);
  r.set(cx - 1, 41, 0x6a6a7a);
  for (let k = 0; k < 6; k++) r.set(cx, 44 + (k >> 2), 0x1a1420);
  return r;
}

/** A maple-leaf cake on a little plate, a green leaf beside it. */
function iconFood() {
  const r = new Raster(54, 54);
  const cx = 27;
  const cy = 26;
  // the plate
  for (let y = 30; y < 50; y++)
    for (let x = 4; x < 50; x++) {
      const d = ((x - cx) / 23) ** 2 + ((y - 39) / 10) ** 2;
      if (d > 1) continue;
      r.set(x, y, d > 0.76 ? 0x2b5a8a : d > 0.6 ? 0xd8dce4 : mix(0xeef0f4, 0xb8bcc8, d));
    }
  // the leaf: seven points
  const inside = (x, y) => {
    const dx = x + 0.5 - cx;
    const dy = y + 0.5 - cy;
    const a = Math.atan2(dy, dx);
    const d = Math.hypot(dx, dy);
    const k = Math.abs(Math.sin(((a + Math.PI / 2) * 7) / 2));
    return d < 11 + 10 * k ** 0.8 * (dy > 8 ? 0.45 : 1);
  };
  for (let y = 2; y < 48; y++)
    for (let x = 2; x < 52; x++) {
      if (!inside(x, y)) continue;
      const edge = !inside(x + 1, y + 1);
      const top = !inside(x - 1, y - 1);
      let c = mix(0xe89a4a, 0xb85a26, (x + y - 28) / 44);
      if (edge) c = 0x6a2e14;
      else if (top) c = 0xffc880;
      const a = Math.atan2(y - cy, x - cx);
      if (Math.abs(Math.sin(((a + Math.PI / 2) * 7) / 2)) < 0.08) c = scaleColor(c, 0.82); // (the veins)
      r.set(x, y, c);
    }
  r.disc(cx, cy, 3, 0x8a3e1a);
  r.disc(cx - 1, cy - 1, 1.4, 0xd88a4a);
  for (let k = 0; k < 8; k++) {
    r.set(cx + k, cy + 18 + (k >> 2), 0x6a2e14);
    r.set(cx + k, cy + 19 + (k >> 2), 0x8a3e1a);
  }
  return r;
}

/** A gilt corner for the panels: a bracket, a curl, a wave. Top left; the game flips it. */
function corner() {
  const r = new Raster(66, 66);
  const G = 0xe8c878;
  const D = 0x8a7240;
  for (let k = 0; k < 66; k++) {
    const f = 1 - k / 66;
    r.set(k, 0, G, f + 0.2);
    r.set(k, 1, G, f + 0.2);
    r.set(k, 2, D, f);
    r.set(0, k, G, f + 0.2);
    r.set(1, k, G, f + 0.2);
    r.set(2, k, D, f);
    if (k > 6 && k < 44) {
      r.set(k, 7, D, f);
      r.set(7, k, D, f);
    }
  }
  for (const rad of [6, 11, 16])
    for (let a = 0; a < Math.PI / 2; a += 0.02) {
      r.set(Math.round(3 + Math.cos(a) * rad), Math.round(3 + Math.sin(a) * rad), rad === 16 ? G : D);
      r.set(Math.round(4 + Math.cos(a) * rad), Math.round(3 + Math.sin(a) * rad), rad === 16 ? G : D, 0.6);
    }
  r.disc(4.5, 4.5, 2.6, G);
  r.set(3, 3, 0xfff4c8);
  return r;
}

/** Dark mountains and a town's lamps along the foot of the summary, a torii on the near hill, a little dawn behind them. */
function nightRidge() {
  const r = new Raster(180 * S, 80 * S);
  for (let y = 0; y < r.h; y++)
    for (let x = 0; x < r.w; x++) r.set(x, y, 0x5a2e5e, smooth(40, 200, y) * 0.5);
  const lands = [[0x1a1d3e, 104, 22, 70, 811], [0x12142e, 138, 16, 54, 812], [0x0b0c20, 176, 12, 42, 813]];
  lands.forEach(([c, base, a, p, seed], k) => {
    for (let x = 0; x < r.w; x++) {
      const top = Math.round(base + Math.sin(x / p + k * 2) * a + (fbm(x, k, { seed, scale: 26 }) - 0.5) * 22);
      for (let y = top; y < r.h; y++) r.set(x, y, hashPx(x >> 1, y >> 1, seed) < 0.2 ? scaleColor(c, 1.14) : c);
      if (k === 2 && x % 7 === 0 && hashPx(x, 3, 814) < 0.5) {
        const h = 5 + hashPx(x, 4, 814) * 8;
        for (let j = 0; j < h; j++) for (let i = -Math.round(j * 0.3); i <= j * 0.3; i++) r.set(x + i, Math.round(top - h + j), c);
      }
    }
  });
  const lr = rng(815);
  for (let k = 0; k < 90; k++) {
    const x = Math.floor(lr() * r.w);
    const y = 160 + Math.floor(lr() * 70);
    const c = lr() < 0.7 ? 0xffc070 : 0xff7a4a;
    r.set(x, y, c);
    if (lr() < 0.4) r.set(x + 1, y, c, 0.6);
  }
  // the torii, black against the glow
  const tx = 400;
  const ty = 186;
  const dark = 0x05060f;
  for (let j = 0; j < 40; j++) {
    r.rect(tx - 22, ty - j, 4, 1, dark);
    r.rect(tx + 18, ty - j, 4, 1, dark);
  }
  for (let i = -32; i <= 32; i++) {
    const up = Math.round((Math.abs(i) / 32) ** 2.6 * 4);
    r.rect(tx + i, ty - 44 - up, 1, 5, dark);
  }
  r.rect(tx - 27, ty - 33, 54, 3, dark);
  return r;
}

/** The ribbon behind the thanks: dark silk, gilt edges, swallowtail ends. */
function ribbon() {
  const w = 138 * S;
  const h = 16 * S;
  const r = new Raster(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const v = Math.abs(y - h / 2) / (h / 2);
      const e = Math.min(x, w - 1 - x);
      if (e < 12 * v * 0 + 12 * (1 - v)) continue;
      const edge = y < 3 || y >= h - 3;
      r.set(x, y, edge ? (y === 1 || y === h - 2 ? 0xf0d890 : 0x8a7240) : mix(0x2a1a4a, 0x1a1234, y / h), edge ? 1 : 0.86);
    }
  return r;
}

function petal(c, c2) {
  const r = new Raster(9, 6);
  for (let y = 0; y < 6; y++)
    for (let x = 0; x < 9; x++) {
      const d = ((x + 0.5 - 4.5) / 4.5) ** 2 + ((y + 0.5 - 3) / 3) ** 2;
      if (d > 1) continue;
      if (x === 8 && y === 3) continue;
      r.set(x, y, x < 3 ? c2 : c);
    }
  return r;
}

export function menuAtlas() {
  const out = [];
  const add = (name, raster) => out.push({ name, raster });
  add('evening', evening());
  add('lantern', lantern());
  add('logo', logoFine());
  for (const primary of [false, true]) for (const active of [false, true]) add(`${primary ? 'start' : 'paper'}_${active ? 'on' : 'off'}`, card(primary, active));
  add('icon_stamp', iconStamp());
  add('icon_yokai', iconYokai());
  add('icon_food', iconFood());
  add('petal_0', petal(0xffc7ca, 0xf0a4b0));
  add('petal_1', petal(0xe99dac, 0xd08098));
  add('corner', corner());
  add('night_ridge', nightRidge());
  add('ribbon', ribbon());
  for (const { name, raster } of sealsFine()) add(name, raster);
  return out;
}

export const menuWaves = waves;
export const menuWashi = washi;
