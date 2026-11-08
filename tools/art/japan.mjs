// The map of Japan at 540 px, shown between stages and to choose a city: the four main islands and their smaller ones, in
// relief (lit from the north-west: plains, forest, bare rock and snow), rivers and Lake Biwa; Okinawa in an inset; a night-
// blue sea with its shallows, wave-scales, the Kuroshio, junks and a whale, bands of cloud, a compass rose; Mt Fuji.
// Coastlines are simplified polygons in lon/lat, projected with src/data/japan.js (the game's logical units x 3).
import { Raster, fbm, mix, rng, scaleColor } from '../lib/raster.mjs';
import { hashPx } from './hires.mjs';
import { MAP, INSET, project } from '../../src/data/japan.js';

const S = 3;

const HONSHU = [
  [130.92, 33.95], [130.85, 34.25], [131.2, 34.45], [131.65, 34.67], [132.1, 34.95], [132.6, 35.4], [133.05, 35.58], [133.35, 35.5],
  [133.65, 35.52], [134.25, 35.55], [134.8, 35.67], [135.2, 35.75], [135.45, 35.55], [135.85, 35.63], [136.05, 35.95], [136.25, 36.3],
  [136.65, 36.65], [136.75, 37.0], [136.9, 37.4], [137.35, 37.5], [137.1, 37.05], [136.95, 36.8], [137.4, 36.85], [137.9, 37.05],
  [138.25, 37.18], [138.6, 37.5], [139.05, 37.95], [139.45, 38.4], [139.75, 38.95], [140.0, 39.6], [139.75, 39.95], [140.0, 40.3],
  [139.92, 40.62], [140.25, 41.0], [140.35, 41.25], [140.65, 41.0], [140.85, 40.85], [141.2, 41.15], [141.15, 41.45], [140.95, 41.5],
  [141.4, 41.4], [141.45, 40.6], [141.85, 40.1], [142.05, 39.55], [141.75, 39.0], [141.6, 38.6], [141.1, 38.3], [140.95, 37.9],
  [141.0, 37.4], [140.9, 36.9], [140.65, 36.4], [140.6, 36.1], [140.85, 35.75], [140.4, 35.3], [139.85, 34.9], [139.8, 35.3],
  [139.95, 35.6], [139.75, 35.65], [139.65, 35.45], [139.7, 35.15], [139.35, 35.3], [139.1, 35.15], [139.15, 34.85], [138.95, 34.6],
  [138.75, 34.75], [138.8, 35.05], [138.5, 35.05], [138.2, 34.6], [137.7, 34.68], [137.25, 34.62], [137.05, 34.75], [136.9, 35.05],
  [136.65, 34.95], [136.6, 34.6], [136.9, 34.45], [136.5, 34.25], [136.25, 34.05], [135.95, 33.65], [135.75, 33.45], [135.4, 33.75],
  [135.15, 34.0], [135.1, 34.3], [135.35, 34.55], [135.45, 34.7], [135.2, 34.7], [134.95, 34.65], [134.6, 34.78], [134.15, 34.62],
  [133.75, 34.5], [133.35, 34.4], [132.85, 34.25], [132.45, 34.35], [132.2, 34.05], [131.8, 34.0], [131.4, 34.0], [131.15, 33.95],
];
const KYUSHU = [
  [130.95, 33.92], [131.05, 33.75], [131.25, 33.6], [131.55, 33.65], [131.65, 33.4], [131.5, 33.27], [131.85, 33.1], [131.75, 32.75],
  [131.65, 32.4], [131.45, 31.9], [131.35, 31.4], [131.05, 31.25], [130.75, 31.0], [130.7, 31.4], [130.6, 31.6], [130.45, 31.25],
  [130.2, 31.2], [130.2, 31.55], [130.15, 31.95], [130.35, 32.2], [130.55, 32.6], [130.65, 32.85], [130.4, 33.0], [130.2, 32.75],
  [130.3, 32.6], [130.05, 32.7], [129.85, 32.7], [129.75, 33.0], [129.6, 33.25], [129.95, 33.45], [130.25, 33.6], [130.4, 33.62],
  [130.6, 33.85],
];
const SHIKOKU = [
  [132.75, 33.85], [132.9, 34.05], [133.3, 34.0], [133.6, 34.25], [134.05, 34.35], [134.45, 34.2], [134.6, 34.05], [134.65, 33.85],
  [134.5, 33.55], [134.2, 33.25], [133.95, 33.5], [133.55, 33.5], [133.25, 33.35], [133.0, 32.8], [132.7, 32.85], [132.5, 33.2],
  [132.35, 33.35], [132.0, 33.35], [132.4, 33.5], [132.6, 33.7],
];
const HOKKAIDO = [
  [141.95, 45.52], [142.25, 45.2], [142.6, 44.75], [143.15, 44.35], [143.65, 44.15], [144.25, 44.0], [144.75, 43.95], [145.35, 44.35],
  [145.1, 43.95], [145.3, 43.6], [145.6, 43.35], [145.15, 43.25], [144.4, 42.98], [143.6, 42.6], [143.25, 41.95], [142.75, 42.2],
  [142.15, 42.5], [141.6, 42.6], [141.0, 42.35], [140.6, 42.55], [140.45, 42.15], [140.75, 42.0], [140.95, 41.75], [140.75, 41.75],
  [140.45, 41.55], [140.05, 41.42], [139.9, 41.6], [140.1, 42.05], [139.8, 42.25], [139.85, 42.65], [140.3, 43.0], [140.35, 43.35],
  [140.75, 43.2], [141.0, 43.15], [141.35, 43.3], [141.45, 43.8], [141.65, 44.3], [141.7, 44.9],
];
const OKINAWA = [
  [127.68, 26.08], [127.85, 26.15], [127.82, 26.35], [128.0, 26.45], [128.1, 26.6], [128.3, 26.85], [128.2, 26.88], [128.0, 26.7],
  [127.85, 26.6], [127.7, 26.45], [127.72, 26.3], [127.65, 26.2],
];
// small islands as ellipses: lon, lat, rx, ry (degrees)
const ISLETS = [
  [138.4, 38.05, 0.32, 0.22], // Sado
  [134.85, 34.42, 0.1, 0.22], // Awaji
  [129.32, 34.4, 0.08, 0.3], // Tsushima
  [129.72, 33.8, 0.08, 0.07], // Iki
  [133.2, 36.2, 0.12, 0.1], // Oki
  [130.52, 30.35, 0.14, 0.11], // Yakushima
  [130.98, 30.62, 0.07, 0.24], // Tanegashima
  [134.25, 34.5, 0.1, 0.06], // Shōdoshima
  [139.4, 34.75, 0.06, 0.06], // Izu Ōshima
  [126.8, 26.35, 0.08, 0.06], // Kume
  [132.31, 34.27, 0.07, 0.06], // Miyajima (Itsukushima)
  [141.22, 45.18, 0.09, 0.08], // Rishiri
  [141.02, 45.4, 0.04, 0.08], // Rebun
  [139.45, 42.15, 0.06, 0.1], // Okushiri
  [139.25, 38.45, 0.04, 0.05], // Awashima
  [130.15, 32.42, 0.16, 0.13], // Amakusa
  [129.5, 33.35, 0.05, 0.08], // Hirado
  [129.15, 32.72, 0.08, 0.16], // Gotō
  [131.05, 34.05, 0.03, 0.04],
  [133.4, 34.25, 0.04, 0.03], // the Inland Sea's little islands
  [133.0, 34.15, 0.05, 0.04],
  [132.72, 34.0, 0.05, 0.04],
  [133.75, 34.42, 0.03, 0.025],
  [139.55, 34.25, 0.03, 0.04], // the Izu chain
  [139.28, 34.05, 0.03, 0.03],
  [139.52, 33.88, 0.03, 0.03],
  [139.8, 33.1, 0.05, 0.05],
  [129.5, 28.3, 0.2, 0.1], // Amami
  [129.75, 29.0, 0.05, 0.05], // Tokara
  [130.2, 29.6, 0.05, 0.05],
  [127.3, 26.2, 0.05, 0.04], // Kerama
  [127.82, 26.72, 0.06, 0.04], // Ie
];
const LAKES = [
  [136.08, 35.3, 0.09, 0.24], // Biwa
  [140.88, 40.46, 0.05, 0.05], // Towada
  [140.45, 36.05, 0.07, 0.07], // Kasumigaura
  [141.2, 42.72, 0.05, 0.05], // Shikotsu
  [144.35, 43.45, 0.07, 0.06], // Kussharo
];
const RIVERS = [
  [[141.35, 43.24], [141.75, 43.28], [142.05, 43.55], [142.3, 43.75]], // Ishikari
  [[140.95, 38.45], [141.1, 39.0], [141.2, 39.6]], // Kitakami
  [[139.85, 38.85], [140.2, 38.4]], // Mogami
  [[139.0, 37.9], [138.8, 37.3], [138.35, 36.8], [138.1, 36.4]], // Shinano
  [[140.75, 35.75], [140.0, 36.05], [139.3, 36.4], [139.05, 36.7]], // Tone
  [[136.72, 35.0], [136.95, 35.45], [137.3, 35.8]], // Kiso
  [[135.45, 34.72], [135.75, 34.95], [136.0, 35.05]], // Yodo
  [[130.45, 33.15], [130.8, 33.3], [131.1, 33.25]], // Chikugo
  [[133.0, 33.05], [133.1, 33.4], [133.55, 33.75]], // Shimanto, Yoshino
];
// the ranges: lon, lat, half length and width in the game's units, how high
const RANGES = [
  [137.6, 36.2, 8, 14, 1.0], // the Japan Alps
  [138.2, 36.0, 6, 10, 0.7],
  [140.7, 39.6, 3.5, 26, 0.56], // the Ōu spine
  [139.7, 37.5, 5, 9, 0.62],
  [142.85, 43.5, 8, 8, 0.8], // Daisetsu
  [142.85, 42.6, 3, 9, 0.72], // Hidaka
  [144.4, 43.8, 7, 3, 0.45], // Shiretoko
  [141.2, 42.85, 4, 4, 0.5],
  [135.85, 34.0, 6, 5, 0.6], // Kii
  [133.5, 33.75, 11, 3, 0.62], // Shikoku's spine
  [133.2, 35.15, 14, 3, 0.42], // Chūgoku
  [131.15, 32.75, 4, 9, 0.6], // Kyūshū, Aso
  [130.75, 31.75, 2.5, 3, 0.4],
  [139.0, 36.75, 5, 5, 0.6],
];

const G = (x, y, cx, cy, rx, ry) => Math.exp(-(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2));
const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function buildJapanMap() {
  const W = MAP.w * S;
  const H = MAP.h * S;
  const img = new Raster(W, H);
  const land = new Uint8Array(W * H);
  const lake = new Uint8Array(W * H);
  const shapes = [HONSHU, KYUSHU, SHIKOKU, HOKKAIDO, OKINAWA].map((pts) => {
    const p = pts.map(([lon, lat]) => project(lon, lat));
    const xs = p.map((q) => q[0]);
    const ys = p.map((q) => q[1]);
    return { p, x0: Math.min(...xs) - 3, x1: Math.max(...xs) + 3, y0: Math.min(...ys) - 3, y1: Math.max(...ys) + 3 };
  });
  const inside = ({ p, x0, x1, y0, y1 }, x, y) => {
    if (x < x0 || x > x1 || y < y0 || y > y1) return false;
    let c = false;
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      const [xi, yi] = p[i];
      const [xj, yj] = p[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  const ellipseAt = (list, x, y, grow = 1) => {
    for (const [lon, lat, rx, ry] of list) {
      const [cx, cy] = project(lon, lat);
      const west = lon < MAP.lon0;
      const sx = west ? INSET.sx : MAP.sx;
      const sy = west ? INSET.sy : MAP.sy;
      if (((x - cx) / Math.max(0.8, rx * sx * grow)) ** 2 + ((y - cy) / Math.max(0.8, ry * sy * grow)) ** 2 < 1) return true;
    }
    return false;
  };
  // the coast: the polygons roughened at two scales, so they read as coast close up
  for (let Y = 0; Y < H; Y++)
    for (let X = 0; X < W; X++) {
      const x = (X + 0.5) / S;
      const y = (Y + 0.5) / S;
      const nx = fbm(x, y, { seed: 201, scale: 7, octaves: 3 }) - 0.5;
      const ny = fbm(x, y, { seed: 202, scale: 7, octaves: 3 }) - 0.5;
      const wx = x + nx * 3.4;
      const wy = y + ny * 3.4;
      if (shapes.some((s) => inside(s, wx, wy)) || ellipseAt(ISLETS, x + nx * 1.2, y + ny * 1.2)) land[Y * W + X] = 1;
      if (ellipseAt(LAKES, x + nx * 0.6, y + ny * 0.6)) lake[Y * W + X] = 1;
    }
  // distance inland (for the mountains) and out to sea (for the shallows), in fine pixels
  const dist = (target) => {
    const d = new Float32Array(W * H).fill(1e4);
    for (let i = 0; i < W * H; i++) if (land[i] !== target) d[i] = 0;
    for (let pass = 0; pass < 2; pass++)
      for (let k = 0; k < W * H; k++) {
        const i = pass ? W * H - 1 - k : k;
        const x = i % W;
        const y = Math.floor(i / W);
        for (const [dx, dy, c] of pass ? [[1, 0, 1], [0, 1, 1], [1, 1, 1.4], [-1, 1, 1.4]] : [[-1, 0, 1], [0, -1, 1], [-1, -1, 1.4], [1, -1, 1.4]]) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          if (d[ny * W + nx] + c < d[i]) d[i] = d[ny * W + nx] + c;
        }
      }
    return d;
  };
  const inland = dist(1);
  const offshore = dist(0);
  // the height of the land: ranges, ridged noise, rising from the coast
  const ranges = RANGES.map(([lon, lat, rx, ry, h]) => {
    const [cx, cy] = project(lon, lat);
    return [cx, cy, rx, ry, h];
  });
  const [fx, fy] = project(138.73, 35.36); // Mt Fuji
  const height = new Float32Array(W * H);
  for (let Y = 0; Y < H; Y++)
    for (let X = 0; X < W; X++) {
      const i = Y * W + X;
      if (!land[i]) continue;
      const x = X / S;
      const y = Y / S;
      let r = 0;
      for (const [cx, cy, rx, ry, h] of ranges) r = Math.max(r, G(x, y, cx, cy, rx * 1.15, ry * 1.15) * h);
      const big = fbm(x, y, { seed: 203, scale: 9, octaves: 4 });
      const ridged = 1 - Math.abs(fbm(x, y, { seed: 204, scale: 5, octaves: 3 }) * 2 - 1);
      const coast = smooth(0, 9 * S, inland[i]);
      let h = coast * (0.1 + big * 0.26) + (r * 0.75 + 0.1 * coast) * (0.32 + ridged * 0.95);
      h *= smooth(0, 4, inland[i]);
      height[i] = Math.max(0, h);
    }
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : height[y * W + x]);
  const lat = (Y) => MAP.lat0 - (Y / S - MAP.oy) / MAP.sy;

  // ---- the sea and the land
  for (let Y = 0; Y < H; Y++)
    for (let X = 0; X < W; X++) {
      const i = Y * W + X;
      const x = X / S;
      const y = Y / S;
      if (land[i] && !lake[i]) {
        const h = height[i];
        const slope = ((at(X - 2, Y) - at(X + 2, Y)) + (at(X, Y - 2) - at(X, Y + 2))) * 7;
        const g = hashPx(X, Y, 205);
        const north = smooth(40, 44, lat(Y));
        const south = smooth(34, 31, lat(Y));
        const snow = 0.86 - north * 0.2 + south * 0.2;
        let c;
        if (h < 0.1) {
          // the plains: fields in little patches, a town here and there
          const cell = hashPx(X >> 3, Y >> 3, 206);
          c = mix(0x7e9a58, 0x5e8a4c, cell);
          if (cell > 0.86) c = 0xa8a868;
          if (hashPx(X >> 2, Y >> 2, 207) < 0.03) c = 0x9a8a78;
        } else if (h < 0.4) {
          c = mix(0x4c8850, 0x367046, (h - 0.1) / 0.3);
          const t = hashPx(X >> 1, Y >> 1, 208);
          if (t < 0.18) c = scaleColor(c, 0.88);
          else if (t > 0.86) c = scaleColor(c, 1.12);
        } else if (h < snow) {
          c = mix(0x4e6a44, 0x94886e, (h - 0.4) / Math.max(0.05, snow - 0.4));
          if (g < 0.12) c = scaleColor(c, 0.9);
        } else {
          c = mix(0xdfe4ea, 0xfafcff, g);
        }
        c = scaleColor(c, Math.max(0.68, Math.min(1.45, 1 + slope)));
        if (inland[i] < 2.2) c = hashPx(X, Y, 209) < 0.35 ? 0xc0ae78 : 0xdccc98; // the beach
        img.set(X, Y, c);
        continue;
      }
      // the sea: deepening away from the coast, lighter in the south
      const o = lake[i] ? 0 : offshore[i] / S;
      const swell = fbm(x, y * 2.2, { seed: 210, scale: 18, octaves: 3 });
      let c = mix(0x0c1a34, 0x16305a, swell * 0.7 + (y / MAP.h) * 0.35);
      if (lake[i]) c = mix(0x3a7a9a, 0x5a9ab4, swell);
      else {
        c = mix(c, 0x1c4670, smooth(9, 2, o) * 0.7);
        c = mix(c, 0x3a7c98, smooth(3, 0.6, o) * 0.75);
        // contour lines of the shelf
        for (const k of [2.6, 5.6]) if (Math.abs(o - k - (swell - 0.5) * 2) < 0.18) c = mix(c, 0x6aa0b8, 0.2);
        if (o < 0.55) c = 0xe0eeee; // the surf
        else if (o < 1 && hashPx(X >> 1, Y >> 1, 211) < 0.25) c = mix(c, 0xe0eeee, 0.5);
      }
      img.set(X, Y, c);
    }
  // the rivers: from the mountains down to the sea, wandering
  for (const pts of RIVERS) {
    const P = pts.map(([lon, la]) => project(lon, la).map((v) => v * S));
    for (let k = 0; k + 1 < P.length; k++) {
      const n = Math.ceil(Math.hypot(P[k + 1][0] - P[k][0], P[k + 1][1] - P[k][1]));
      for (let t = 0; t <= n; t++) {
        const u = t / n;
        const wob = (fbm(P[k][0] + u * 40, P[k][1] + t, { seed: 212, scale: 12 }) - 0.5) * 8;
        const X = Math.round(P[k][0] + (P[k + 1][0] - P[k][0]) * u + wob);
        const Y = Math.round(P[k][1] + (P[k + 1][1] - P[k][1]) * u - wob * 0.6);
        if (X < 0 || Y < 0 || X >= W || Y >= H || !land[Y * W + X]) continue;
        img.set(X, Y, 0x5aa0c4);
        img.set(X + 1, Y, 0x3e7ea0, 0.6);
      }
    }
  }

  // ---- what's drawn on the sea
  const sea = (X, Y, margin = 6) => X >= 0 && Y >= 0 && X < W && Y < H && !land[Y * W + X] && offshore[Y * W + X] > margin * S;
  // a faint grid of lines every five degrees, dotted
  for (let lon = 130; lon <= 145; lon += 5) {
    const X = Math.round(project(lon, 40)[0] * S);
    for (let Y = 90; Y < H - 90; Y++) if ((Y >> 1) % 4 === 0 && sea(X, Y, 1)) img.set(X, Y, 0x4a648c, 0.55);
  }
  for (let la = 30; la <= 45; la += 5) {
    const Y = Math.round(project(135, la)[1] * S);
    for (let X = 0; X < W; X++) if ((X >> 1) % 4 === 0 && sea(X, Y, 1)) img.set(X, Y, 0x4a648c, 0.55);
  }
  // wave-scales in the empty corners of the sea, fading into it
  const scales = (x0, y0, w, h) => {
    for (let row = 0; row * 18 < h * S + 36; row++)
      for (let c = -1; c * 36 < w * S + 36; c++) {
        const cx = x0 * S + c * 36 + (row % 2) * 18;
        const cy = y0 * S + row * 18;
        for (const rad of [17, 12, 7])
          for (let a = Math.PI; a < Math.PI * 2; a += 0.05) {
            const X = Math.round(cx + Math.cos(a) * rad);
            const Y = Math.round(cy + Math.sin(a) * rad);
            if (!sea(X, Y, 7)) continue;
            const edge = Math.min(X - x0 * S, x0 * S + w * S - X, Y - y0 * S, y0 * S + h * S - Y);
            if (edge < 0) continue;
            img.set(X, Y, rad === 17 ? 0x5a7ca0 : 0x3a5a84, Math.min(1, edge / 40) * (rad === 17 ? 0.55 : 0.35));
          }
      }
  };
  scales(0, 296, 118, 70);
  scales(146, 66, 34, 130);
  scales(0, 40, 66, 44);
  // little crests of waves, scattered
  const wr = rng(213);
  for (let k = 0; k < 900; k++) {
    const X = Math.floor(wr() * W);
    const Y = Math.floor(wr() * H);
    if (!sea(X, Y, 3)) continue;
    const n = 3 + Math.floor(wr() * 6);
    for (let i = -n; i <= n; i++) {
      const dy = Math.round((i / n) ** 2 * 2);
      if (sea(X + i, Y + dy, 2)) img.set(X + i, Y + dy, 0x7aa2c4, 0.32 * (1 - Math.abs(i) / (n + 1)));
    }
  }
  // the Kuroshio: long streaks up the Pacific side
  for (let t = 0; t < 1; t += 0.0007) {
    const x = 92 + t * 76 + Math.sin(t * 19) * 3;
    const y = 300 - t * 118 - Math.sin(t * 7) * 6;
    for (let k = -4; k <= 4; k++) {
      if (hashPx(Math.floor(t * 300), k, 214) < 0.55) continue;
      const X = Math.round((x + k * 0.7) * S);
      const Y = Math.round((y + k * 1.4) * S);
      if (sea(X, Y, 4) && !(X > INSET.x * S - 8 && X < (INSET.x + INSET.w) * S + 8 && Y > INSET.y * S - 8 && Y < (INSET.y + INSET.h) * S + 8)) img.set(X, Y, 0x4a88b4, 0.3);
    }
  }
  // bands of cloud in the old manner: long rounded bars, gilt on their edges
  const cloud = (x0, y0, bars) => {
    bars.forEach(([dx, dy, w, h]) => {
      const X0 = (x0 + dx) * S;
      const Y0 = (y0 + dy) * S;
      const hS = h * S;
      const wS = w * S;
      const r = hS / 2;
      for (let Y = Y0 - 2; Y < Y0 + hS + 2; Y++)
        for (let X = X0 - 2; X < X0 + wS + 2; X++) {
          const qx = Math.max(X0 + r - X, X - (X0 + wS - r), 0);
          const qy = Y - (Y0 + r);
          const d = Math.hypot(qx, qy);
          if (d > r + 1) continue;
          img.set(X, Y, d > r - 1.5 ? 0xd8b878 : mix(0x2a3a64, 0x1a2848, (Y - Y0) / hS), 0.94);
        }
    });
  };
  cloud(6, 74, [[6, 0, 34, 5], [0, 4, 52, 6], [14, 9, 28, 5]]);
  cloud(138, 306, [[8, 0, 28, 5], [0, 4, 40, 6], [12, 9, 22, 4]]);
  cloud(146, 64, [[0, 0, 26, 4], [8, 3, 28, 5]]);
  // junks under sail, a whale blowing
  const junk = (x, y) => {
    const X = x * S;
    const Y = y * S;
    for (let k = 0; k < 16; k++) img.set(X - 14 - k, Y + 8 + Math.round(k * 0.3), 0xc8e0e8, 0.5 - k * 0.03);
    for (let j = 0; j < 7; j++) {
      const hw = 14 - j * 0.8;
      for (let i = -hw; i <= hw + 3; i++) img.set(Math.round(X + i), Y + j + 4, j === 0 ? 0xc8a070 : j < 3 ? 0x7a5636 : 0x4a3424);
    }
    for (let j = -20; j < 4; j++) img.set(X - 1, Y + j, 0x3a2a1c);
    for (let j = 0; j < 20; j++)
      for (let i = 0; i < 16 - j * 0.1; i++) img.set(X + i, Y - 19 + j, j % 5 === 0 ? 0xa89878 : i < 3 ? 0xd8cca8 : 0xf0e8d0);
    for (let j = 0; j < 14; j++) for (let i = 0; i < 8; i++) img.set(X - 12 + i, Y - 13 + j, j % 5 === 0 ? 0xa89878 : 0xe0d4b4);
    img.set(X + 2, Y - 22, 0xc83a2a);
    img.set(X + 3, Y - 22, 0xc83a2a);
    img.set(X + 4, Y - 21, 0xc83a2a);
  };
  junk(74, 112);
  junk(26, 168);
  junk(150, 218);
  junk(108, 310);
  {
    const X = 150 * S;
    const Y = 166 * S;
    for (let i = -18; i <= 18; i++) {
      const hw = 6 * Math.sqrt(1 - (i / 19) ** 2);
      for (let j = -hw; j <= hw * 0.5; j++) img.set(X + i, Math.round(Y + j), j < -hw * 0.45 ? 0x6a84a8 : 0x344a70);
    }
    for (let k = 0; k < 6; k++) for (let j = -k * 0.8; j <= k * 0.8; j++) img.set(X - 19 - k, Math.round(Y + j - k * 0.7), 0x344a70);
    for (let k = 0; k < 7; k++) {
      img.set(X + 10, Y - 7 - k, 0xe0f0f8, 0.8);
      img.set(X + 10 - k * 0.7, Y - 8 - k, 0xe0f0f8, 0.55);
      img.set(X + 10 + k * 0.7, Y - 8 - k, 0xe0f0f8, 0.55);
    }
    for (let i = -24; i <= 24; i += 2) img.set(X + i, Y + 4 + (i % 4 === 0 ? 1 : 0), 0xc8e0e8, 0.55);
  }

  // ---- Mt Fuji standing up from the map, with its shadow, its snow and a band of cloud
  {
    const X = Math.round(fx * S);
    const Yb = Math.round(fy * S) + 4;
    const hgt = 28;
    for (let j = 0; j < hgt; j++) {
      const hw = 2.5 + j * 0.56 + (j * j) * 0.008;
      for (let i = 0; i < hgt - j; i++) img.set(X + Math.round(hw) + i, Yb - hgt + j + Math.round(i * 0.45), 0x101820, 0.26);
      for (let i = -Math.round(hw); i <= hw; i++) {
        const lit = i < -hw * 0.1;
        const fing = Math.sin(i * 0.9) * 2 + hashPx(i + 90, 2, 215) * 2;
        let c = j < 11 + fing ? (lit ? 0xf8fcff : 0xb4c2d8) : lit ? 0x6e7e9c : 0x46567a;
        if (Math.abs(i) >= hw - 1) c = scaleColor(c, 0.8);
        img.set(X + i, Yb - hgt + j, c, j > hgt - 7 ? (hgt - j) / 7 : 1);
      }
    }
    for (let i = -2; i <= 2; i++) img.set(X + i, Yb - hgt, 0x7a8aa4);
    for (let j = 0; j < 3; j++) for (let i = -13 + j; i <= 16 - j; i++) if (hashPx(i >> 2, j, 216) > 0.3) img.set(X + i, Yb - 12 + j, 0xf0f4f8, 0.6);
  }

  // ---- the Okinawa inset: a chart of its own, in a gilt frame, a dashed line from Kyūshū
  {
    const x0 = INSET.x * S;
    const y0 = INSET.y * S;
    const w = INSET.w * S;
    const h = INSET.h * S;
    for (let Y = y0 + 4; Y < y0 + h - 3; Y++)
      for (let X = x0 + 4; X < x0 + w - 3; X++) {
        if (land[Y * W + X]) continue;
        const o = offshore[Y * W + X] / S;
        let c = mix(0x1c5a84, 0x2a7ca0, fbm(X, Y, { seed: 217, scale: 24 }));
        c = mix(c, 0x68c0c8, smooth(5, 0.7, o) * 0.85);
        if (o < 0.55) c = 0xf0f8f4;
        img.set(X, Y, c);
      }
    for (let k = 0; k < 4; k++) {
      const c = [0x4a3a20, 0xe8c878, 0xb8945a, 0x4a3a20][k];
      for (let X = x0 + k; X < x0 + w - k; X++) {
        img.set(X, y0 + k, c);
        img.set(X, y0 + h - 1 - k, c);
      }
      for (let Y = y0 + k; Y < y0 + h - k; Y++) {
        img.set(x0 + k, Y, c);
        img.set(x0 + w - 1 - k, Y, c);
      }
    }
    for (const [X, Y] of [[x0, y0], [x0 + w - 1, y0], [x0, y0 + h - 1], [x0 + w - 1, y0 + h - 1]]) {
      for (let j = -5; j <= 5; j++) for (let i = -5; i <= 5; i++) if (Math.abs(i) + Math.abs(j) <= 6) img.set(X + i, Y + j, Math.abs(i) + Math.abs(j) > 4 ? 0x4a3a20 : 0xe8c878);
      img.set(X, Y, 0xfff4c8);
    }
    const [ax, ay] = project(130.9, 30.9).map((v) => v * S);
    const bx = x0;
    const by = y0 + h / 2;
    const n = Math.round(Math.hypot(bx - ax, by - ay));
    for (let k = 10; k < n - 6; k++) {
      if (k % 12 >= 6) continue;
      const X = Math.round(ax + ((bx - ax) * k) / n);
      const Y = Math.round(ay + ((by - ay) * k) / n);
      img.set(X, Y, 0xe8c878, 0.85);
      img.set(X, Y + 1, 0x4a3a20, 0.6);
    }
  }

  // ---- the compass rose: sixteen points, the north in gold, ringed, with its letter
  {
    const cx = 26 * S;
    const cy = 118 * S;
    const ring = (rad, c, a = 1) => {
      for (let t = 0; t < Math.PI * 2; t += 0.008) img.set(Math.round(cx + Math.cos(t) * rad), Math.round(cy + Math.sin(t) * rad), c, a);
    };
    for (let Y = cy - 34; Y <= cy + 34; Y++)
      for (let X = cx - 34; X <= cx + 34; X++) if (Math.hypot(X - cx, Y - cy) < 33) img.set(X, Y, 0x0c1a34, 0.55);
    ring(33, 0xe8c878);
    ring(31, 0x8a7a50);
    ring(23, 0x8a7a50, 0.8);
    for (let k = 0; k < 32; k++) {
      const a = (k / 32) * Math.PI * 2;
      for (let d = 29; d < 33; d++) img.set(Math.round(cx + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d), k % 4 ? 0x8a7a50 : 0xe8c878);
    }
    const point = (a, len, half, lit, dark) => {
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      for (let d = 0; d < len; d++) {
        const w = half * (1 - d / len);
        for (let s = -w; s <= w; s += 0.4) img.set(Math.round(cx + ca * d - sa * s), Math.round(cy + sa * d + ca * s), s < 0 ? lit : dark);
      }
    };
    for (let k = 0; k < 16; k += 2) if (k % 4) point(((k + 1 - 1) / 16) * Math.PI * 2 - Math.PI / 2, 22, 3, 0xb8a878, 0x6a5a38);
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 - Math.PI / 2;
      point(a, k === 0 ? 40 : 33, 5.5, k === 0 ? 0xffe8a0 : 0xe8d090, k === 0 ? 0xc8302a : 0x8a7a50);
    }
    img.set(cx, cy, 0xfff8e0);
    for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (Math.abs(i) + Math.abs(j) < 3) img.set(cx + i, cy + j, 0xfff0c0);
    // the N
    const nx = cx - 6;
    const ny = cy - 57;
    for (let k = 0; k < 13; k++) {
      for (const w of [0, 1]) {
        img.set(nx + w, ny + k, 0xffe8a0);
        img.set(nx + 11 + w, ny + k, 0xffe8a0);
        img.set(nx + Math.round((k * 11) / 12) + w, ny + k, 0xffe8a0);
      }
    }
  }
  // its edges fade out into the screen's own dark sea (at 0.8 in the city menu it doesn't fill the screen)
  for (let Y = 0; Y < H; Y++)
    for (let X = 0; X < W; X++) {
      const e = Math.min(X / 15, (W - 1 - X) / 15, Y / 45, (H - 1 - Y) / 45);
      if (e < 1) img.data[(Y * W + X) * 4 + 3] = Math.round(255 * Math.max(0, e));
    }
  return img;
}
