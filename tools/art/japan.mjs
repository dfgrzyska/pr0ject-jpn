// The map of Japan shown between stages: the four main islands, Okinawa in an inset box, a night-blue
// sea with a faint grid and seigaiha waves, a compass rose, mountains inland, snowy Alps and Mt Fuji.
// Coastlines are simplified polygons in lon/lat, projected with src/data/japan.js.
import { Raster, fbm, bayer, scaleColor } from '../lib/raster.mjs';
import { rampColor } from './nature.mjs';
import { MAP, INSET, project } from '../../src/data/japan.js';

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
];

const SEA = [0x0c1830, 0x10203c, 0x142848, 0x1a3254];
const LAND = [0x2a5a2e, 0x34683a, 0x427a44, 0x588c52];
const HILL = [0x3a5a30, 0x4a6438, 0x5a6a40, 0x6e7a4e];

export function buildJapanMap() {
  const { w: W, h: H } = MAP;
  const img = new Raster(W, H);
  const land = new Uint8Array(W * H);
  const poly = (pts) => pts.map(([lon, lat]) => project(lon, lat));
  const inside = (p, x, y) => {
    let c = false;
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      const [xi, yi] = p[i];
      const [xj, yj] = p[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  const shapes = [HONSHU, KYUSHU, SHIKOKU, HOKKAIDO, OKINAWA].map(poly);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      if (shapes.some((s) => inside(s, px, py))) land[y * W + x] = 1;
      for (const [lon, lat, rx, ry] of ISLETS) {
        const [cx, cy] = project(lon, lat);
        const sx = lon < MAP.lon0 ? INSET.sx : MAP.sx;
        const sy = lon < MAP.lon0 ? INSET.sy : MAP.sy;
        if (((px - cx) / Math.max(1, rx * sx)) ** 2 + ((py - cy) / Math.max(1, ry * sy)) ** 2 < 1) land[y * W + x] = 1;
      }
    }
  // distance inland (for mountains) and distance out to sea (for the shallows)
  const dist = (target) => {
    const d = new Float32Array(W * H).fill(99);
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
          d[i] = Math.min(d[i], d[ny * W + nx] + c);
        }
      }
    return d;
  };
  const inland = dist(1);
  const offshore = dist(0);
  const [fx, fy] = project(138.73, 35.36); // Mt Fuji
  const alps = (x, y) => {
    const [ax, ay] = project(137.6, 36.2);
    return Math.max(0, 1 - Math.hypot((x - ax) / 9, (y - ay) / 12));
  };

  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (land[i]) {
        const d = inland[i];
        const n = fbm(x, y, { seed: 81, scale: 6, octaves: 3 });
        let c = d > 4 ? rampColor(HILL, 0.2 + n * 0.6 + Math.min(0.3, (d - 4) * 0.05), x, y) : rampColor(LAND, 0.25 + n * 0.6, x, y);
        if (alps(x, y) > 0.35 && n > 0.45) c = alps(x, y) > 0.6 && n > 0.55 ? 0xe8ecf0 : 0x8a8a7a; // the snowy Japan Alps
        if (y < project(140, 42)[1] && d > 3 && n > 0.62) c = 0xd8e0e4; // snow on Hokkaido's mountains
        if (d < 1.5) c = 0xd8c890; // the beach line
        img.set(x, y, c);
      } else {
        const o = offshore[i];
        let c = rampColor(SEA, 0.3 + (1 - y / H) * 0.25 + fbm(x, y * 2, { seed: 82, scale: 12 }) * 0.3, x, y);
        if (o < 2.5) c = o < 1.5 ? 0x3a6a8a : 0x2a5070; // shallows round the coast
        else if (fbm(x * 0.8, y * 2.2, { seed: 83, scale: 4 }) > 0.74 && bayer(x, y) > 0.5) c = scaleColor(c, 1.35); // wavelets
        img.set(x, y, c);
      }
    }
  // a faint grid of lines every five degrees
  for (let lon = 130; lon <= 145; lon += 5) {
    const [gx] = project(lon, 40);
    for (let y = 30; y < H - 30; y += 2) if (!land[y * W + Math.round(gx)]) img.set(Math.round(gx), y, 0x2a4068);
  }
  for (let lat = 30; lat <= 45; lat += 5) {
    const [, gy] = project(135, lat);
    for (let x = 0; x < W; x += 2) if (!land[Math.round(gy) * W + x]) img.set(x, Math.round(gy), 0x2a4068);
  }
  // seigaiha waves in the empty corners of the sea
  const seigaiha = (x0, y0, w, h) => {
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++) {
        if (land[y * W + x] || offshore[y * W + x] < 5) continue;
        const cy = Math.floor((y - y0) / 6) * 6 + y0 + 6;
        const cx = Math.floor((x - x0 + (Math.floor((y - y0) / 6) % 2) * 6) / 12) * 12 + x0 + 6 - (Math.floor((y - y0) / 6) % 2) * 6;
        const r = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        if (y + 0.5 < cy && (Math.abs(r - 5.5) < 0.5 || Math.abs(r - 3.5) < 0.5)) img.set(x, y, 0x1e3a60);
      }
  };
  seigaiha(0, 300, 110, 60);
  seigaiha(150, 70, 30, 120);
  // Mt Fuji: a little cone with a snow cap
  for (let j = 0; j < 6; j++)
    for (let k = -j; k <= j; k++) img.set(Math.round(fx) + k, Math.round(fy) - 6 + j, j < 2 ? 0xf4f8fc : k < 0 ? 0x6a7a8a : 0x4a5a6a);
  // the Okinawa inset: a frame with a little label notch
  for (let x = INSET.x; x < INSET.x + INSET.w; x++) {
    img.set(x, INSET.y, 0x8a7a50);
    img.set(x, INSET.y + INSET.h, 0x8a7a50);
  }
  for (let y = INSET.y; y <= INSET.y + INSET.h; y++) {
    img.set(INSET.x, y, 0x8a7a50);
    img.set(INSET.x + INSET.w, y, 0x8a7a50);
  }
  // a dashed line from Kyushu out to the inset: Okinawa really lies far to the south-west
  {
    const [x0, y0] = project(130.9, 30.9);
    const x1 = INSET.x;
    const y1 = INSET.y + INSET.h / 2;
    const n = Math.round(Math.hypot(x1 - x0, y1 - y0));
    for (let k = 4; k < n; k++) if (k % 4 < 2) img.set(Math.round(x0 + ((x1 - x0) * k) / n), Math.round(y0 + ((y1 - y0) * k) / n), 0x8a7a50);
  }
  // compass rose
  {
    const cx = 26;
    const cy = 118;
    for (let a = 0; a < Math.PI * 2; a += 0.05) img.set(Math.round(cx + Math.cos(a) * 9), Math.round(cy + Math.sin(a) * 9), 0x8a7a50);
    for (const [dx, dy, c] of [[0, -1, 0xe8d090], [0, 1, 0x8a7a50], [1, 0, 0x8a7a50], [-1, 0, 0x8a7a50]])
      for (let k = 1; k < 13; k++) {
        const wdt = Math.max(0, Math.round((13 - k) / 5));
        for (let s = -wdt; s <= wdt; s++) img.set(cx + dx * k + (dy ? s : 0), cy + dy * k + (dx ? s : 0), s < 0 ? scaleColor(c, 1.1) : c);
      }
    img.set(cx, cy, 0xfff0c0);
    // the N
    for (let k = 0; k < 5; k++) {
      img.set(cx - 2, cy - 21 + k, 0xe8d090);
      img.set(cx + 2, cy - 21 + k, 0xe8d090);
      img.set(cx - 2 + k, cy - 21 + k, 0xe8d090);
    }
  }
  return img;
}
