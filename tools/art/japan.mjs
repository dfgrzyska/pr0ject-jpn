// The map of Japan at 540 px, shown between stages and to choose a city: the four main islands and their smaller ones, in
// relief (lit from the north-west: plains, forest, bare rock and snow), rivers and Lake Biwa; Okinawa in an inset; a night-
// blue sea with its shallows, wave-scales, the Kuroshio, junks and a whale, bands of cloud, a compass rose; Mt Fuji.
// The geography (coasts, islands, lakes, rivers, trenches) is in japan-geo.mjs, in lon/lat, projected with
// src/data/japan.js (the game's logical units x 3).
import { Raster, fbm, mix, noise2, rng, scaleColor } from '../lib/raster.mjs';
import { hashPx } from './hires.mjs';
import { MAP, INSET, inInset, project } from '../../src/data/japan.js';
import { AIRPORTS, AIRPORT_ISLANDS, FERRIES, PORTS, RAILS, ROADS, CASTLES, CROPS, CROPS_DEFAULT, PARKS, TOWNS, ARCHIPELAGOS, FINE_ISLANDS, FINE_LAKES, FLATS, HOKKAIDO, HONSHU, ISLANDS, ISLETS, KYUSHU, LAKES, LAKE_ISLES, LAKE_SHAPES, RIAS, RIVERS, SHIKOKU, TRENCHES } from './japan-geo.mjs';


const AWAJI = [
  [135.02, 34.6], [134.98, 34.5], [134.92, 34.38], [134.93, 34.3], [134.85, 34.2], [134.7, 34.17], [134.66, 34.25], [134.78, 34.37],
  [134.88, 34.48], [134.97, 34.58],
];
const AMAKUSA = [[130.17, 32.6], [130.35, 32.55], [130.42, 32.45], [130.3, 32.38], [130.2, 32.25], [130.05, 32.2], [130.0, 32.35], [130.05, 32.5]];
// ---- the relief (docs/plan-mapa.md, iteration 1)
// the ranges, each a ridge from end to end: lon/lat of its ends, half its width in km, how high (1 = 3000 m). Close up
// the ridges run along each range's own axis, finer ones branching off them.
const RANGES = [
  [[137.62, 36.95], [137.62, 36.05], 14, 1.0], // Hida, the Northern Alps
  [[137.84, 35.95], [137.78, 35.45], 9, 0.86], // Kiso, the Central Alps
  [[138.26, 35.85], [138.04, 35.12], 13, 0.95], // Akaishi, the Southern Alps
  [[137.0, 36.0], [137.45, 35.6], 16, 0.52], // the Hida highlands, to Ontake
  [[138.55, 36.95], [139.35, 36.75], 18, 0.62], // Echigo and Mikuni
  [[138.55, 35.97], [139.15, 35.85], 14, 0.62], // Okuchichibu
  [[139.05, 35.5], [139.25, 35.45], 7, 0.45], // Tanzawa
  [[136.6, 36.5], [136.8, 35.85], 12, 0.58], // Ryōhaku, Hakusan
  [[136.0, 35.75], [136.6, 35.5], 14, 0.38], // Echizen and Ibuki
  [[136.45, 35.2], [136.38, 34.8], 7, 0.34], // Suzuka
  [[135.88, 35.3], [135.82, 35.05], 5, 0.3], // Hira and Hiei, west of Biwa
  [[135.3, 35.35], [135.75, 35.2], 14, 0.28], // Tanba
  [[135.9, 34.42], [135.85, 33.9], 12, 0.6], // Ōmine
  [[135.5, 34.15], [136.2, 34.0], 22, 0.42], // the Kii mountains
  [[135.65, 34.75], [135.7, 34.45], 4, 0.22], // Ikoma and Kongō, between Osaka and Nara
  [[135.15, 34.77], [135.35, 34.8], 3, 0.3], // Rokkō, over Kōbe
  [[131.8, 34.45], [134.5, 35.25], 16, 0.38], // the Chūgoku mountains
  [[132.3, 34.65], [133.3, 34.7], 12, 0.24], // the Kibi plateau
  [[132.6, 33.65], [134.2, 33.85], 12, 0.6], // Ishizuchi and Tsurugi, Shikoku's spine
  [[132.6, 33.3], [133.4, 33.2], 14, 0.34], // Shikoku's south
  [[131.1, 32.95], [131.2, 32.0], 16, 0.52], // the Kyūshū mountains
  [[130.4, 33.5], [131.0, 33.45], 9, 0.3], // Sefuri and Tsukushi
  [[130.15, 33.25], [130.0, 33.0], 6, 0.22], // the hills of Saga and Nagasaki
  [[140.9, 41.0], [140.8, 39.4], 13, 0.5], // Ōu, Tōhoku's spine
  [[140.8, 39.4], [140.3, 37.9], 13, 0.5],
  [[140.3, 37.9], [139.95, 37.1], 13, 0.5],
  [[140.2, 39.9], [139.9, 38.3], 11, 0.42], // Dewa
  [[141.55, 40.3], [141.35, 38.9], 15, 0.38], // the Kitakami highlands
  [[140.6, 37.8], [140.45, 36.6], 11, 0.3], // Abukuma
  [[139.6, 37.2], [139.4, 36.9], 12, 0.5], // Aizu and Oze
  [[139.1, 37.6], [139.6, 38.2], 12, 0.5], // Iide and Asahi
  [[138.85, 35.0], [138.98, 34.7], 6, 0.32], // Izu
  [[140.05, 35.2], [140.2, 35.1], 8, 0.12], // the Bōsō hills
  [[142.45, 43.05], [143.3, 42.05], 13, 0.68], // Hidaka
  [[142.75, 43.85], [143.0, 43.5], 16, 0.7], // Daisetsu's massif
  [[142.4, 44.5], [143.6, 43.9], 16, 0.4], // Kitami
  [[145.25, 44.15], [144.9, 43.95], 5, 0.5], // Shiretoko
  [[142.05, 43.35], [142.2, 42.75], 8, 0.45], // Yūbari
  [[140.35, 42.5], [140.15, 41.6], 12, 0.34], // the Oshima peninsula
  [[141.1, 42.95], [141.0, 42.6], 10, 0.38], // the hills south-west of Sapporo
  [[144.0, 43.6], [144.6, 43.5], 12, 0.32], // Akan
  [[142.1, 44.8], [141.95, 44.2], 10, 0.24], // Teshio
];
// the plains and the basins between the mountains, where the land lies flat (lon, lat, half their size in km)
const BASINS = [
  [139.65, 36.0, 70, 55], // Kantō
  [136.8, 35.25, 28, 26], // Nōbi
  [135.55, 34.7, 16, 22], // Osaka
  [135.76, 35.0, 6, 9], // Kyoto
  [135.8, 34.6, 7, 11], // Nara
  [136.1, 35.15, 12, 18], // Ōmi, by Biwa
  [139.0, 37.75, 20, 42], // Echigo
  [137.2, 36.65, 16, 12], // Toyama
  [136.6, 36.5, 8, 15], // Kanazawa
  [136.2, 36.05, 10, 10], // Fukui
  [138.57, 35.64, 9, 7], // Kōfu
  [137.95, 36.25, 6, 18], // Matsumoto
  [138.2, 36.65, 6, 12], // Nagano
  [140.95, 38.2, 12, 25], // Sendai
  [140.33, 38.3, 6, 18], // Yamagata
  [139.85, 38.85, 10, 18], // Shōnai
  [140.1, 39.7, 8, 15], // Akita
  [140.4, 40.8, 14, 20], // Tsugaru
  [141.15, 39.4, 8, 35], // Kitakami's valley
  [139.9, 37.5, 9, 12], // Aizu
  [140.45, 37.7, 6, 10], // Fukushima
  [141.6, 43.2, 25, 35], // Ishikari
  [143.2, 42.9, 35, 30], // Tokachi
  [142.35, 43.75, 10, 10], // Kamikawa
  [137.75, 34.75, 12, 6], // Hamamatsu
  [138.38, 34.98, 7, 5], // Shizuoka
  [133.92, 34.65, 16, 8], // Okayama
  [132.45, 34.4, 4, 5], // Hiroshima's delta
  [133.37, 34.5, 6, 4], // Fukuyama
  [133.55, 33.56, 10, 5], // Kōchi
  [134.5, 34.07, 15, 6], // Tokushima
  [132.78, 33.82, 8, 7], // Matsuyama
  [134.0, 34.27, 18, 7], // Sanuki
  [132.75, 35.37, 12, 5], // Izumo
  [130.45, 33.3, 18, 14], // Chikushi
  [130.4, 33.6, 9, 6], // Fukuoka
  [130.72, 32.8, 12, 12], // Kumamoto
  [131.42, 32.0, 8, 20], // Miyazaki
  [131.6, 33.22, 6, 4], // Ōita
  [140.7, 41.85, 8, 6], // Hakodate
];
// the volcanoes: lon, lat, the radius of the cone and of its crater in km, how high (1 = 3000 m), whether it smokes,
// whether it stands alone (the hills round its foot give way to it), how far down its snowcap reaches;
// a caldera has instead the half sizes of its ring in km, its rim's height and its floor's (its cones are lines of
// their own)
const VOLCANOES = [
  { at: [138.727, 35.361], km: 22, h: 1.26, crater: 0.8, cap: 0.38, lone: true }, // Fuji, white down its top half in spring
  { at: [138.523, 36.406], km: 10, h: 0.85, crater: 0.5, live: true }, // Asama
  { at: [137.48, 35.893], km: 10, h: 1.0, crater: 0.6 }, // Ontake
  { at: [137.554, 36.106], km: 8, h: 1.0, crater: 0.3 }, // Norikura
  { at: [136.771, 36.155], km: 9, h: 0.89, crater: 0.4 }, // Haku
  { at: [138.37, 35.97], km: 12, h: 0.96, crater: 0.2 }, // Yatsugatake
  { at: [139.49, 36.765], km: 5, h: 0.83, crater: 0.3 }, // Nantai
  { at: [139.19, 36.56], km: 12, h: 0.6, crater: 1.2 }, // Akagi
  { at: [138.11, 36.89], km: 8, h: 0.82, crater: 0.5 }, // Myōkō
  { at: [140.07, 37.6], km: 9, h: 0.6, crater: 0.6 }, // Bandai
  { at: [140.44, 38.14], km: 9, h: 0.6, crater: 0.5 }, // Zaō
  { at: [140.05, 39.1], km: 12, h: 0.75, crater: 0.5, lone: true }, // Chōkai
  { at: [141.0, 39.85], km: 10, h: 0.68, crater: 0.5, lone: true }, // Iwate
  { at: [140.3, 40.65], km: 8, h: 0.55, crater: 0.3, lone: true }, // Iwaki
  { at: [140.88, 40.66], km: 10, h: 0.53, crater: 0.4 }, // Hakkōda
  { at: [133.54, 35.37], km: 10, h: 0.57, crater: 0.3, lone: true }, // Daisen
  { at: [132.62, 35.14], km: 6, h: 0.39, crater: 0.4 }, // Sanbe
  { at: [131.24, 33.09], km: 8, h: 0.59, crater: 0.4 }, // Kujū
  { at: [131.39, 33.28], km: 5, h: 0.53, crater: 0.2 }, // Yufu and Tsurumi, over Beppu
  { at: [130.29, 32.76], km: 10, h: 0.5, crater: 0.4, live: true }, // Unzen
  { at: [130.87, 31.93], km: 12, h: 0.57, crater: 0.6, live: true }, // Kirishima
  { at: [130.66, 31.58], km: 5.5, h: 0.37, crater: 0.5, live: true }, // Sakurajima
  { at: [130.53, 31.18], km: 4, h: 0.31, crater: 0.2, lone: true }, // Kaimon, the Satsuma Fuji
  { at: [140.81, 42.83], km: 8, h: 0.63, crater: 0.4, cap: 0.45, lone: true }, // Yōtei, the Ezo Fuji
  { at: [142.85, 43.66], km: 14, h: 0.76, crater: 0.6 }, // Asahi, Daisetsu
  { at: [142.68, 43.42], km: 8, h: 0.69, crater: 0.5, live: true }, // Tokachi
  { at: [141.38, 42.69], km: 6, h: 0.34, crater: 0.4, live: true }, // Tarumae
  { at: [141.24, 45.18], km: 7, h: 0.57, crater: 0.3, cap: 0.4, lone: true }, // Rishiri, out at sea
  { at: [139.39, 34.73], km: 4, h: 0.25, crater: 0.5, live: true }, // Mihara on Izu Ōshima
  { at: [131.08, 32.88], ring: [9, 12], rim: 0.36, floor: 0.06 }, // Aso, its caldera
  { at: [131.09, 32.885], km: 5, h: 0.53, crater: 0.5, live: true }, // Aso's Naka-dake
  { at: [139.02, 35.23], ring: [5.5, 6.5], rim: 0.36, floor: 0.14 }, // Hakone
  { at: [139.02, 35.235], km: 3.5, h: 0.48, crater: 0.2, live: true }, // Hakone's Kami-yama, Ōwakudani's fumes
  { at: [144.1, 43.45], ring: [12, 12], rim: 0.3, floor: 0.12 }, // Akan
  { at: [144.0, 43.38], km: 5, h: 0.5, crater: 0.4, live: true }, // Meakan
];

// the Shinkansen lines
const SHINKANSEN = [
  [[129.87, 32.75], [130.02, 33.2]], // Nishi-Kyūshū: Nagasaki to Takeo-Onsen
  [[130.54, 31.58], [130.69, 32.79], [130.42, 33.59]], // Kyūshū: Kagoshima, Kumamoto, Hakata
  // Sanyō: Hakata, Kokura, Shin-Shimonoseki, Hiroshima, Mihara, Fukuyama, Okayama, Himeji, Shin-Kōbe, Shin-Ōsaka
  [[130.42, 33.59], [130.88, 33.89], [130.95, 34.03], [131.4, 34.09], [132.47, 34.4], [133.08, 34.4], [133.36, 34.49], [133.92, 34.67], [134.69, 34.83], [135.2, 34.71], [135.5, 34.73]],
  // Tōkaidō: Kyōto, Maibara, Nagoya, Toyohashi, Hamamatsu, Shizuoka, Mishima, Odawara, Shin-Yokohama, Tōkyō
  [[135.5, 34.73], [135.76, 34.99], [136.29, 35.31], [136.88, 35.17], [137.38, 34.77], [137.73, 34.71], [138.39, 34.97], [138.91, 35.13], [139.16, 35.26], [139.62, 35.51], [139.77, 35.68]],
  // Tōhoku: Ōmiya, Utsunomiya, Fukushima, Sendai, Morioka, Shin-Aomori
  [[139.77, 35.68], [139.62, 35.91], [139.9, 36.56], [140.46, 37.75], [140.88, 38.26], [141.14, 39.7], [140.69, 40.83]],
  [[140.65, 41.9], [140.45, 41.55]], // Hokkaidō: Shin-Hakodate-Hokuto, into the Seikan tunnel
];
const FUJI = [138.73, 35.36];

const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const KM = 9; // km to a map unit (about: 1° of latitude is 12 units, of longitude 10)

// ridged noise: sharp crests where the noise crosses its middle, finer crests weighted to sit on the bigger ones
function ridged(x, y, seed, octaves) {
  let sum = 0;
  let norm = 0;
  let amp = 0.55;
  let f = 1;
  let w = 1;
  for (let o = 0; o < octaves; o++) {
    let v = 1 - Math.abs(noise2(x * f, y * f, seed + o * 37) * 2 - 1);
    v *= v;
    sum += v * amp * w;
    norm += amp;
    w = Math.min(1, v * 1.7);
    f *= 2.07;
    amp *= 0.5;
  }
  return sum / norm;
}

// a line through its points (lon, lat[, 1 for a tunnel]) as a smooth curve, sampled finely (map units)
function smoothPath(pts, per = 24) {
  const P = pts.map(([lon, la, t]) => [...project(lon, la), t ?? 0]);
  const out = [];
  for (let i = 0; i + 1 < P.length; i++) {
    const [p0, p1, p2, p3] = [P[Math.max(0, i - 1)], P[i], P[i + 1], P[Math.min(P.length - 1, i + 2)]];
    const steps = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) * per));
    for (let t = 0; t < steps; t++) {
      const u = t / steps;
      const c = (a, b, c2, d) => 0.5 * (2 * b + (-a + c2) * u + (2 * a - 5 * b + 4 * c2 - d) * u * u + (-a + 3 * b - 3 * c2 + d) * u * u * u);
      out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1]), p1[2] && p2[2] ? 1 : 0]);
    }
  }
  const e = P[P.length - 1];
  out.push([e[0], e[1], e[2]]);
  return out;
}

// the rivers' courses as drawn, sampled finely (map units, with the width of the water there), so that the valleys they
// cut and the water drawn in them are one: a smooth curve through their points, wandering a little, meandering more the
// lower they get, wider towards the mouth; source and mouth stay where they are
const COURSES = RIVERS.map(([pts, size], n) => {
  const P = pts.map(([lon, la]) => project(lon, la));
  // (Catmull-Rom through the points)
  const curve = [];
  for (let i = 0; i + 1 < P.length; i++) {
    const [p0, p1, p2, p3] = [P[Math.max(0, i - 1)], P[i], P[i + 1], P[Math.min(P.length - 1, i + 2)]];
    const steps = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) * 24));
    for (let t = 0; t < steps; t++) {
      const u = t / steps;
      const c = (a, b, c2, d) => 0.5 * (2 * b + (-a + c2) * u + (2 * a - 5 * b + 4 * c2 - d) * u * u + (-a + 3 * b - 3 * c2 + d) * u * u * u);
      curve.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  curve.push(P[P.length - 1]);
  let len = 0;
  const along = curve.map((q, i) => (len += i ? Math.hypot(q[0] - curve[i - 1][0], q[1] - curve[i - 1][1]) : 0));
  const out = [];
  let phase = n * 1.7;
  for (let i = 0; i < curve.length; i++) {
    const f = along[i] / len;
    const [a, b] = [curve[Math.max(0, i - 1)], curve[Math.min(curve.length - 1, i + 1)]];
    const tl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const [nx, ny] = [-(b[1] - a[1]) / tl, (b[0] - a[0]) / tl];
    // (the meanders: a swing whose length wavers, growing downstream; the slow wander over it)
    if (i) phase += ((along[i] - along[i - 1]) / 0.42) * Math.PI * (0.7 + 0.6 * fbm(along[i], n * 13, { seed: 214, scale: 1.5, octaves: 2 }));
    const ends = smooth(0, 0.06, f) * smooth(1, 0.94, f);
    const off = ends * ((fbm(along[i] * 0.4, n * 7, { seed: 212, scale: 1, octaves: 2 }) - 0.5) * 0.7 + Math.sin(phase) * (0.02 + 0.13 * f ** 1.6) * (size > 1 ? 1 : 0.6));
    const w = [0, 0.028, 0.045, 0.06][size] * (0.6 + 1.1 * f);
    out.push([curve[i][0] + nx * off, curve[i][1] + ny * off, w]);
  }
  const xs = out.map((p) => p[0]);
  const ys = out.map((p) => p[1]);
  return { pts: out, size, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
});

// the sea's colours by its depth (m), and its isobaths with how strongly each is drawn
const DEEP = [[0, 0x3a7c98], [40, 0x2c6a8e], [200, 0x1c4670], [1000, 0x16305a], [3000, 0x11284e], [5500, 0x0c1c3c], [8000, 0x081530]];
const seaColor = (d) => {
  for (let n = 0; n + 1 < DEEP.length; n++) if (d < DEEP[n + 1][0]) return mix(DEEP[n][1], DEEP[n + 1][1], (d - DEEP[n][0]) / (DEEP[n + 1][0] - DEEP[n][0]));
  return DEEP[DEEP.length - 1][1];
};
const ISOBATHS = [[200, 0.3], [1000, 0.18], [2000, 0.12], [3000, 0.1], [4000, 0.09], [5000, 0.08], [6000, 0.08], [7000, 0.1]];

/** The whole map, 540 x 1260 (3 fine pixels to a unit). */
export function buildJapanMap() {
  return paintMap({ S: 3, box: [0, 0, MAP.w, MAP.h], whole: true });
}

/**
 * A close-up tile (TILES in src/data/japan.js): the same land and sea, finer, with the towns and the Shinkansen, without
 * the whole map's ornaments; Okinawa only on the inset's own tile (its chart in its frame, clear round it).
 */
export function buildMapTile({ box, S, inset = false }) {
  return paintMap({ S, box, whole: false, inset });
}

function paintMap({ S, box, whole, inset = false }) {
  // (a tile is painted with a margin all round, the coast beyond its edge giving the shallows and the slopes, then cut)
  const M = whole ? 0 : 10;
  const ox = box[0] - M;
  const oy = box[1] - M;
  const W = Math.round((box[2] - box[0] + 2 * M) * S);
  const H = Math.round((box[3] - box[1] + 2 * M) * S);
  const k = S / 3; // how much finer than the whole map
  const ux = (X) => ox + X / S; // fine pixel to map unit
  const uy = (Y) => oy + Y / S;
  const fx = (x) => (x - ox) * S; // map unit to fine pixel
  const fy = (y) => (y - oy) * S;
  const img = new Raster(W, H);
  const land = new Uint8Array(W * H);
  const lake = new Uint8Array(W * H);
  const outline = (pts) => {
    const p = pts.map(([lon, lat]) => project(lon, lat));
    const xs = p.map((q) => q[0]);
    const ys = p.map((q) => q[1]);
    return { p, x0: Math.min(...xs) - 3, x1: Math.max(...xs) + 3, y0: Math.min(...ys) - 3, y1: Math.max(...ys) + 3 };
  };
  // (Okinawa lives in the inset: a close-up tile other than the inset's own leaves it out, the sea there plain)
  const tile = !whole && !inset;
  const okinawan = (pts) => inInset(...pts[0]);
  const shapes = [HONSHU, KYUSHU, SHIKOKU, HOKKAIDO].map(outline);
  const isles = [AWAJI, AMAKUSA, ...ISLANDS, ...(whole ? [] : [...FINE_ISLANDS, ...AIRPORT_ISLANDS])].filter((pts) => !(tile && okinawan(pts))).map(outline);
  const islets = tile ? ISLETS.filter(([lon, la]) => !inInset(lon, la)) : ISLETS;
  const lakes = LAKE_SHAPES.map(outline);
  const rias = RIAS.map(([lon, la, km, f]) => [...project(lon, la), km / KM, f]);
  const strewn = ARCHIPELAGOS.map(([lon, la, kx, ky, f]) => [...project(lon, la), kx / KM, ky / KM, f]);
  // (the drowned coasts kept off the cities' harbours)
  const ports = [[129.87, 32.75], [130.4, 33.59], [130.55, 31.6], [131.49, 33.28], [132.45, 34.39], [133.2, 34.41], [135.5, 34.69], [139.7, 35.68], [127.68, 26.21]].map(([lon, la]) => project(lon, la));
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
  const ellipseAt = (list, x, y, grow = 1, least = 0.8) => {
    for (const [lon, lat, rx, ry] of list) {
      const [cx, cy] = project(lon, lat);
      const west = inInset(lon, lat);
      const sx = west ? INSET.sx : MAP.sx;
      const sy = west ? INSET.sy : MAP.sy;
      if (((x - cx) / Math.max(least, rx * sx * grow)) ** 2 + ((y - cy) / Math.max(least, ry * sy * grow)) ** 2 < 1) return true;
    }
    return false;
  };
  // the coast: the polygons roughened at two scales, so they read as coast close up (and a third in the tiles), finely
  // into inlets and islets where the coast is drowned; the smaller islands warped less, so they keep their shapes
  for (let Y = 0; Y < H; Y++)
    for (let X = 0; X < W; X++) {
      const x = ux(X + 0.5);
      const y = uy(Y + 0.5);
      const nx = fbm(x, y, { seed: 201, scale: 7, octaves: 3 }) - 0.5;
      const ny = fbm(x, y, { seed: 202, scale: 7, octaves: 3 }) - 0.5;
      // (close up the coast is drawn truer, warped less: the port cities must stand on their harbours)
      let wx = x + nx * (whole ? 3.4 : 1.1);
      let wy = y + ny * (whole ? 3.4 : 1.1);
      let fx2 = 0;
      let fy2 = 0;
      if (!whole) {
        fx2 = fbm(x, y, { seed: 218, scale: 1.4, octaves: 3 }) - 0.5;
        fy2 = fbm(x, y, { seed: 219, scale: 1.4, octaves: 3 }) - 0.5;
        wx += fx2 * 0.7;
        wy += fy2 * 0.7;
        let r = 0;
        for (const [cx, cy, rad, f] of rias) {
          const d = Math.hypot(x - cx, y - cy);
          if (d < rad) r = Math.max(r, smooth(rad, rad * 0.55, d) * f);
        }
        if (r > 0) {
          for (const [px, py] of ports) r *= smooth(1.2, 2.2, Math.hypot(x - px, y - py));
          wx += (fbm(x, y, { seed: 290, scale: 0.7, octaves: 4 }) - 0.5) * 2.4 * r;
          wy += (fbm(x, y, { seed: 291, scale: 0.7, octaves: 4 }) - 0.5) * 2.4 * r;
        }
      }
      // (the islets strewn thick, where they are: the peaks of a fine noise standing out of the sea, kept off the harbours)
      if (!whole) {
        let f = 0;
        for (const [cx, cy, rx, ry, t] of strewn) {
          const e = Math.hypot((x - cx) / rx, (y - cy) / ry);
          if (e < 1) f = Math.max(f, smooth(1, 0.6, e) * t);
        }
        if (f > 0) {
          for (const [px, py] of ports) f *= smooth(0.6, 1.2, Math.hypot(x - px, y - py));
          if (fbm(x, y, { seed: 296, scale: 0.55, octaves: 4 }) > 0.79 - f * 0.07) land[Y * W + X] = 1;
        }
      }
      const iw = whole ? 1.2 : 0.3;
      if (shapes.some((s) => inside(s, wx, wy)) || isles.some((s) => inside(s, x + nx * iw + fx2 * 0.25, y + ny * iw + fy2 * 0.25)) || ellipseAt(islets, x + nx * iw, y + ny * iw, 1, whole ? 0.8 : 0.12)) land[Y * W + X] = 1;
      if (ellipseAt(LAKES, x + nx * 0.4, y + ny * 0.4, 1, whole ? 0.6 : 0.2) || lakes.some((l) => inside(l, x + nx * 0.3, y + ny * 0.3))) lake[Y * W + X] = 1;
      if (!whole && ellipseAt(FINE_LAKES, x + nx * 0.15, y + ny * 0.15, 1, 0.2)) lake[Y * W + X] = 1;
      if (!whole && lake[Y * W + X] && ellipseAt(LAKE_ISLES, x, y, 1, 0.12)) lake[Y * W + X] = 0;
    }
  // distance inland (for the mountains) and out to sea (for the shallows), in fine pixels
  const dist = (target) => {
    const d = new Float32Array(W * H).fill(1e4);
    for (let i = 0; i < W * H; i++) if (land[i] !== target) d[i] = 0;
    for (let pass = 0; pass < 2; pass++)
      for (let n = 0; n < W * H; n++) {
        const i = pass ? W * H - 1 - n : n;
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
  // ---- the height of the land (1 = 3000 m): rising from the coast into hills, the ranges along their axes with their
  // ridges and the valleys between, the plains and basins flat, the rivers' valleys cut in, the volcanoes on top
  const segs = RANGES.map(([[lo0, la0], [lo1, la1], km, h]) => {
    const [x0, y0] = project(lo0, la0);
    const [x1, y1] = project(lo1, la1);
    const len = Math.hypot(x1 - x0, y1 - y0) || 1e-6;
    return { x0, y0, len, ca: (x1 - x0) / len, sa: (y1 - y0) / len, w: km / KM, h };
  });
  const basins = BASINS.map(([lon, la, rx, ry]) => [...project(lon, la), rx / KM, ry / KM]);
  const cones = VOLCANOES.map((v) => ({ ...v, c: project(...v.at), R: (v.km ?? 0) / KM, rc: (v.crater ?? 0) / KM }));
  // (as many octaves as the pixels can show: the finest crests a pixel and a half across)
  const oct = (cell) => Math.max(1, Math.round(1 + Math.log2((cell * S) / 1.5)));
  const nR = oct(1.9);
  const nI = oct(2.6);
  const height = new Float32Array(W * H);
  const ash = new Float32Array(W * H); // (bare ash and old lava round the craters of the live ones)
  const capped = new Uint8Array(W * H); // (the snowcaps of the lone cones, down their gullies)
  const valley = new Float32Array(W * H); // (how deep in a river's valley: their floors are farmed)
  for (let Y = 0; Y < H; Y++)
    for (let X = 0; X < W; X++) {
      const i = Y * W + X;
      if (!land[i]) continue;
      const x = ux(X);
      const y = uy(Y);
      // the ranges: how high the nearest lifts the land, and the ridges along each, blended by nearness
      let m = 0;
      let det = 0;
      let wsum = 0;
      for (const s of segs) {
        const px = x - s.x0;
        const py = y - s.y0;
        const along = px * s.ca + py * s.sa;
        const t = Math.max(0, Math.min(s.len, along));
        const d = Math.hypot(px - s.ca * t, py - s.sa * t);
        if (d > s.w * 3) continue;
        // (the crest higher and lower along the range, lower towards its ends)
        const crest = s.h * (0.7 + 0.6 * fbm(along / 2.2 + s.x0, s.y0, { seed: 262, scale: 1, octaves: 2 })) * (0.65 + 0.35 * smooth(-0.3, 1, Math.min(along, s.len - along) / (s.len * 0.2 + 0.5)));
        const g = Math.exp(-((d / s.w) ** 2));
        if (g * crest > m) m = g * crest;
        const wt = Math.exp(-((d / (s.w * 1.6)) ** 2));
        const across = -px * s.sa + py * s.ca;
        // (the spurs run off the main ridge across the range, the valleys between them draining down its flanks)
        det += wt * ridged(along / 1.3 + s.x0 * 0.37, across / 3.4 + s.y0 * 0.37, 260, nR);
        wsum += wt;
      }
      const wx = (fbm(x, y, { seed: 271, scale: 4, octaves: 2 }) - 0.5) * 2.2;
      const wy = (fbm(x, y, { seed: 272, scale: 4, octaves: 2 }) - 0.5) * 2.2;
      const iso = ridged((x + wx) / 2.6, (y + wy) / 2.6, 270, nI);
      const local = wsum > 0 ? iso + (((det / wsum) * 0.75 + iso * 0.25) - iso) * Math.min(1, wsum * 3) : iso;
      const big = fbm(x, y, { seed: 203, scale: 9, octaves: 3 });
      const coast = smooth(0, 4 * S, inland[i]);
      let h = coast * (0.12 + big * 0.3) * (0.55 + iso * 0.9) + m * (0.08 + local ** 1.4 * 1.5);
      h *= smooth(0, 4 * k, inland[i]);
      // the plains and the basins
      let b = 0;
      for (const [cx, cy, rx, ry] of basins) {
        const e = Math.hypot((x - cx) / rx, (y - cy) / ry);
        if (e > 1.4) continue;
        b = Math.max(b, smooth(1.05, 0.6, e + (fbm(x, y, { seed: 275, scale: 1.5, octaves: 3 }) - 0.5) * 0.45));
      }
      h *= 1 - b * 0.93;
      // the rivers' valleys: a broad one for the big rivers, and the narrow cut of the river in it
      let cut = 0;
      for (const r of COURSES) {
        if (x < r.x0 - 2.5 || x > r.x1 + 2.5 || y < r.y0 - 2.5 || y > r.y1 + 2.5) continue;
        let dr = 9;
        for (let q = 0; q < r.pts.length; q += 3) {
          const d = (r.pts[q][0] - x) ** 2 + (r.pts[q][1] - y) ** 2;
          if (d < dr) dr = d;
        }
        if (dr >= 9) continue;
        const d = Math.sqrt(dr);
        cut = Math.max(cut, [0, 0.2, 0.35, 0.45][r.size] * Math.exp(-((d / [0, 0.5, 0.8, 1.0][r.size]) ** 2)) + 0.3 * Math.exp(-((d / 0.3) ** 2)));
      }
      h *= 1 - Math.min(0.8, cut);
      valley[i] = cut;
      // the volcanoes: cones furrowed by their gullies, with craters; calderas, a ring of rim round a flat floor
      for (const v of cones) {
        const [cx, cy] = v.c;
        if (v.ring) {
          const e = Math.hypot((x - cx) / (v.ring[0] / KM), (y - cy) / (v.ring[1] / KM));
          if (e > 1.7) continue;
          const rim = v.rim * (0.85 + fbm(Math.atan2(y - cy, x - cx) * 3, 0, { seed: 276, scale: 1, octaves: 3 }) * 0.3);
          if (e < 0.9) h = v.floor + h * 0.12;
          else if (e < 1) h = v.floor + (rim - v.floor) * smooth(0.9, 1, e);
          else h = Math.max(h, rim * (1 - smooth(1, 1.7, e)));
          continue;
        }
        const d = Math.hypot(x - cx, y - cy);
        if (v.lone && d < v.R * 1.35) h *= 1 - 0.75 * smooth(1.35, 0.85, d / v.R);
        if (d > v.R) continue;
        const p = 1 - d / v.R;
        const gully = fbm(Math.atan2(y - cy, x - cx) * v.R * 4, d * 3, { seed: 225, scale: 1, octaves: 3 });
        let c = v.h * p ** 1.7 * (1 - (gully - 0.5) * 0.35 * (1 - p));
        const rc = Math.max(v.rc, 1.2 / S);
        if (d < rc) c = v.h * (1 - rc / v.R) ** 1.7 - v.h * 0.07 * (1 - (d / rc) ** 2);
        if (c > h) h = c + (h - c) * 0.15 * (1 - p);
        if (v.cap && c >= h - 0.02 && c > v.h * v.cap * (1 + (fbm(Math.atan2(y - cy, x - cx) * 14, d * 0.6, { seed: 226, scale: 1, octaves: 3 }) - 0.5) * 2.4)) capped[i] = 1;
        if (v.live) ash[i] = Math.max(ash[i], smooth(v.R * 0.4, rc, d));
      }
      height[i] = Math.max(0, h);
    }
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : height[y * W + x]);
  // the land's curvature, to light the crests and darken the folds: the height against its blur over half a unit
  const blur = (() => {
    const r = Math.max(1, Math.round(S * 0.5));
    const tmp = new Float32Array(W * H);
    const out = new Float32Array(W * H);
    for (let Y = 0; Y < H; Y++) {
      let acc = 0;
      for (let X = -r; X <= r; X++) acc += height[Y * W + Math.max(0, Math.min(W - 1, X))];
      for (let X = 0; X < W; X++) {
        tmp[Y * W + X] = acc / (2 * r + 1);
        acc += height[Y * W + Math.min(W - 1, X + r + 1)] - height[Y * W + Math.max(0, X - r)];
      }
    }
    for (let X = 0; X < W; X++) {
      let acc = 0;
      for (let Y = -r; Y <= r; Y++) acc += tmp[Math.max(0, Math.min(H - 1, Y)) * W + X];
      for (let Y = 0; Y < H; Y++) {
        out[Y * W + X] = acc / (2 * r + 1);
        acc += tmp[Math.min(H - 1, Y + r + 1) * W + X] - tmp[Math.max(0, Y - r) * W + X];
      }
    }
    return out;
  })();
  const lat = (Y) => MAP.lat0 - (uy(Y) - MAP.oy) / MAP.sy;
  const step = Math.max(2, Math.round(S / 3));
  const surf = whole ? 0.55 : 1.3 / S; // (the surf's width in map units)
  const [fujiX, fujiY] = project(...FUJI);

  // ---- the fields close up: the plain cut into irregular districts, each with its own lay of fields (square in the
  // north and on the old grids) and the crops of its region; field paths between them, shelter belts in Hokkaidō; hamlets
  // of farmhouses in their groves scattered over them
  const zones = CROPS.map(([lon, la, km, z]) => [...project(lon, la), km / KM, z]);
  const districts = new Map();
  const fieldsOf = (id, sx, sy, gx, gy) => {
    let f = districts.get(id);
    if (f) return f;
    let z = CROPS_DEFAULT;
    let r0 = Infinity;
    for (const [cx, cy, r, zz] of zones) if (r < r0 && Math.hypot(sx - cx, sy - cy) < r) [z, r0] = [zz, r];
    const ang = z.grid ? (hashPx(gx, gy, 303) - 0.5) * 0.12 : hashPx(gx, gy, 303) * Math.PI;
    const pu = ((z.km * 2.2) / KM) * (0.75 + 0.5 * hashPx(gx, gy, 304));
    const keys = Object.keys(z.w);
    const total = keys.reduce((n, k2) => n + z.w[k2], 0);
    f = { ca: Math.cos(ang), sa: Math.sin(ang), pu, pv: pu * (0.5 + 0.3 * hashPx(gx, gy, 305)), keys, cum: keys.map(((acc) => (k2) => (acc += z.w[k2] / total))(0)), belts: z.belts };
    districts.set(id, f);
    return f;
  };
  const HAMLET_ROOFS = [0x7c7c84, 0x5e6a7c, 0x8a6a5a, 0x9a948c, 0x4e5a6e];
  const farmland = (X, Y, x, y, hamlets) => {
    // (the district: the nearest of the jittered points of a grid)
    const D = 1.4;
    const gx0 = Math.floor(x / D);
    const gy0 = Math.floor(y / D);
    let best = 1e9;
    let sx = 0;
    let sy = 0;
    let gx = 0;
    let gy = 0;
    for (let j = -1; j <= 1; j++)
      for (let i = -1; i <= 1; i++) {
        const cx = (gx0 + i + hashPx(gx0 + i, gy0 + j, 300)) * D;
        const cy = (gy0 + j + hashPx(gx0 + i, gy0 + j, 301)) * D;
        const d = (x - cx) ** 2 + (y - cy) ** 2;
        if (d < best) [best, sx, sy, gx, gy] = [d, cx, cy, gx0 + i, gy0 + j];
      }
    const f = fieldsOf(gx * 7919 + gy * 104729, sx, sy, gx, gy);
    const u = (x - sx) * f.ca + (y - sy) * f.sa;
    const v = -(x - sx) * f.sa + (y - sy) * f.ca;
    const pi = Math.floor(u / f.pu);
    const pj = Math.floor(v / f.pv);
    const ph = hashPx(pi + gx * 131, pj + gy * 137, 302);
    const p2 = hashPx(pi + gx * 131, pj + gy * 137, 306);
    let k2 = 0;
    while (k2 < f.cum.length - 1 && ph > f.cum[k2]) k2++;
    const a = Math.floor(u * S);
    const b = Math.floor(v * S);
    let c;
    switch (f.keys[k2]) {
      case 'paddy': c = (a + b * 3) % 13 === 0 ? 0xb0ccc4 : mix(0x74a08c, 0x8eb49a, p2); break; // (the water mirroring the sky, the seedlings in it)
      case 'rice': c = b % 2 ? mix(0x7eaa56, 0x92bc60, p2) : mix(0x76a256, 0x88b25a, p2); break;
      case 'wheat': c = mix(0xb0b25c, 0xccc472, p2); break;
      case 'rape': c = b % 2 ? 0xe6d64c : 0xd4c442; break;
      case 'greens': c = b % 2 ? mix(0x5e9446, 0x7aa850, p2) : 0x8a7656; break;
      case 'earth': c = b % 2 ? 0x9a7c5a : 0x86694c; break;
      case 'tea': c = b % 2 ? 0x2e6238 : 0x4a7e44; break;
      case 'peach': c = a % 2 === 0 && b % 2 === 0 ? (hashPx(X, Y, 307) < 0.5 ? 0xf2b4c6 : 0xe496ae) : 0x6e8a4e; break;
      case 'apple': c = a % 2 === 0 && b % 2 === 0 ? (hashPx(X, Y, 307) < 0.5 ? 0xf6f2ea : 0xe4ded2) : 0x6e8a4e; break;
      case 'mikan': c = a % 2 === 0 && b % 2 === 0 ? 0x2e5a34 : 0x5e8248; break;
      case 'glass': c = a % 3 === 0 ? 0x8a949a : mix(0xe4eaee, 0xcad4d8, p2); break;
      case 'pasture': c = mix(0x74a454, 0x8ab65e, p2); break;
      case 'beet': c = b % 2 ? 0x4e8a40 : 0x6e5a40; break;
      case 'lavender': c = b % 2 ? 0x8a6cc0 : 0x5e7a48; break;
      default: c = 0x7e9a58;
    }
    // (the paths between the fields, the shelter belts; the parcels too small at the mid scale for paths)
    if (S >= 12) {
      const eu = (u / f.pu - pi) * f.pu * S;
      const ev = (v / f.pv - pj) * f.pv * S;
      if (f.belts && (eu < 1.2 || ev < 1)) c = hashPx(X, Y, 308) < 0.7 ? 0x3e6a40 : 0x557e4a;
      else if (eu < 0.9 || ev < 0.9) c = mix(c, 0xb4ac88, 0.3);
    }
    // a hamlet: farmhouses among the trees of their groves
    const HC = 0.9;
    const hx = Math.floor(x / HC);
    const hy = Math.floor(y / HC);
    if (hashPx(hx, hy, 309) < hamlets) {
      const cx = (hx + 0.2 + 0.6 * hashPx(hx, hy, 310)) * HC;
      const cy = (hy + 0.2 + 0.6 * hashPx(hx, hy, 311)) * HC;
      const rad = 0.05 + 0.08 * hashPx(hx, hy, 312);
      const d = Math.hypot(x - cx, y - cy) / rad + (hashPx(X, Y, 313) - 0.5) * 0.5;
      if (d < 1) c = hashPx(X >> (S >= 12 ? 0 : 1), Y, 314) < 0.5 ? HAMLET_ROOFS[Math.floor(hashPx(X >> 1, Y >> 1, 315) * HAMLET_ROOFS.length)] : 0x456e40;
    }
    return c;
  };

  // ---- the depth of the sea (m): the shelf to 200 m, the slope down to the basins, the trenches; the mud flats' places
  const trenches = TRENCHES.map(([pts, m]) => ({ P: pts.map(([lon, la]) => project(lon, la)), m }));
  const flats = FLATS.map(([lon, la, km]) => [...project(lon, la), km / KM]);
  const depth = new Float32Array(W * H);
  for (let Y = 0; Y < H; Y++)
    for (let X = 0; X < W; X++) {
      const i = Y * W + X;
      if (land[i]) continue;
      const x = ux(X);
      const y = uy(Y);
      const o = offshore[i] / S;
      // (the basins still deepening slowly far out, so their isobaths run along the slopes and don't break into rings)
      let d = o < 2.6 ? 200 * (o / 2.6) ** 1.3 : 200 + 3000 * smooth(2.6, 10, o) + 70 * Math.min(12, Math.max(0, o - 6));
      d *= 1 + (fbm(x, y, { seed: 292, scale: 3, octaves: whole ? 3 : 4 }) - 0.5) * 0.18 * smooth(14, 5, o);
      for (const { P, m } of trenches) {
        let dt = 1e9;
        for (let n = 0; n + 1 < P.length; n++) {
          const [ax, ay] = P[n];
          const [bx, by] = P[n + 1];
          const l2 = (bx - ax) ** 2 + (by - ay) ** 2;
          const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / l2));
          dt = Math.min(dt, Math.hypot(x - ax - t * (bx - ax), y - ay - t * (by - ay)));
        }
        d = Math.max(d, m * (0.55 * Math.exp(-((dt / 7) ** 2)) + 0.45 * Math.exp(-((dt / 2.2) ** 2))) * smooth(1.5, 5, o));
      }
      depth[i] = d;
    }

  // ---- the sea and the land
  for (let Y = 0; Y < H; Y++)
    for (let X = 0; X < W; X++) {
      const i = Y * W + X;
      const x = ux(X);
      const y = uy(Y);
      if (land[i] && !lake[i]) {
        const h = height[i];
        // the light from the north-west, on the slope at this pixel and over a wider step (the big forms and the
        // fine crests both), the crests lit and the folds darkened
        const ex = S * 1.6; // (the heights exaggerated about five times)
        const gx = ((at(X + 1, Y) - at(X - 1, Y)) * 0.55 * 0.5 + ((at(X + step, Y) - at(X - step, Y)) * 0.45) / (2 * step)) * ex;
        const gy = ((at(X, Y + 1) - at(X, Y - 1)) * 0.55 * 0.5 + ((at(X, Y + step) - at(X, Y - step)) * 0.45) / (2 * step)) * ex;
        const shade = Math.max(0.5, Math.min(1.5, (0.62 * gx + 0.62 * gy + 0.48) / Math.sqrt(1 + gx * gx + gy * gy) / 0.48));
        const curv = Math.max(-0.3, Math.min(0.3, (h - blur[i]) * 5));
        const steep = Math.hypot(gx, gy);
        const g = hashPx(X, Y, 205);
        const la = lat(Y);
        const north = smooth(40, 44, la);
        const south = smooth(34, 31, la);
        // (the tree line and the snow line fall going north; snow lies longer in the gullies)
        const trees = 0.62 - north * 0.26 + south * 0.12;
        let snow = 0.84 - north * 0.3 + south * 0.25 + (fbm(x, y, { seed: 280, scale: 0.8, octaves: 3 }) - 0.5) * 0.1 + curv * 0.5;
        if (capped[i]) snow = Math.min(snow, h - 0.001);
        let c;
        let lit = shade * (1 + curv);
        if (h < 0.1) {
          // the plains: on the whole map fields in little patches; close up the fields of their region (farmland)
          if (whole) {
            const cell = hashPx(X >> 3, Y >> 3, 206);
            c = mix(0x7e9a58, 0x5e8a4c, cell);
            if (cell > 0.86) c = 0xa8a868;
            if (hashPx(X >> 2, Y >> 2, 207) < 0.03) c = 0x9a8a78;
          } else c = farmland(X, Y, x, y, 0.3);
        } else if (h < trees) {
          // the woods: spring's new leaves in the broadleaf hills, plantations of sugi and hinoki darker in patches,
          // the conifers thickening towards the tree line; their crowns close up
          const up = (h - 0.1) / (trees - 0.1);
          c = mix(0x6a9e4c, 0x4a8046, Math.min(1, up * 1.3));
          const plant = fbm(x, y, { seed: 240, scale: 1.1, octaves: 3 });
          if (plant > 0.58 && up < 0.7) c = mix(0x2f6040, 0x3a6c48, hashPx(X >> 1, Y >> 1, 241));
          if (up > 0.65) c = mix(c, 0x2e5444, (up - 0.65) / 0.35);
          if (S >= 6) {
            const cr = hashPx(X, Y, 242);
            if (cr < 0.2) c = scaleColor(c, 0.84);
            else if (cr > 0.9) c = scaleColor(c, 1.1);
          }
          // (wild cherries in flower among the low woods, south of Tōhoku)
          if (!whole && up < 0.35 && la < 38.5 && hashPx(X, Y, 243) < 0.01) c = 0xe8bcc8;
          // terraces of rice on the gentler slopes low down, flooded for the planting: their banks follow the land
          // (the contours of the smoothed land, only where they fall a few pixels apart)
          const bg = Math.hypot(blur[Math.min(i + 1, W * H - 1)] - blur[Math.max(i - 1, 0)], blur[Math.min(i + W, W * H - 1)] - blur[Math.max(i - W, 0)]) / 2;
          if (S >= 12 && up < 0.3 && la < 38.5 && bg * S > 0.06 && bg * S < 0.2 && fbm(x, y, { seed: 245, scale: 0.7, octaves: 2 }) > 0.6) {
            const f = (blur[i] * S * 2.6) % 1;
            c = f < 0.3 ? mix(c, 0x4e7438, 0.6) : mix(0x7ea888, 0x86aa62, fbm(x, y, { seed: 247, scale: 0.25, octaves: 2 }));
            lit = 1 + (lit - 1) * 0.6;
          }
          // the floors of the valleys farmed, a hamlet here and there
          if (!whole && valley[i] > 0.3 && up < 0.3 && steep < 1.1) {
            c = farmland(X, Y, x, y, 0.45);
            lit = 1 + (lit - 1) * 0.5;
          }
        } else if (h < snow) {
          // above the trees: creeping pine and alpine grass, then bare rock and scree
          const t = (h - trees) / Math.max(0.05, snow - trees);
          c = mix(0x56683e, 0x8a8070, Math.min(1, t * 1.5));
          if (g < 0.12) c = scaleColor(c, 0.9);
        } else {
          // snow, its shadows blue
          c = mix(0xe6eaf2, 0xfcfdff, g);
          if (lit < 1) c = mix(c, 0x8494bc, Math.min(1, (1 - lit) * 1.5));
          lit = lit < 1 ? 1 - (1 - lit) * 0.35 : 1 + (lit - 1) * 0.3;
        }
        // cliffs, and the ash and old lava round the live craters
        if (h > 0.25 && h < snow && steep > 1.7) c = mix(c, 0x7a7268, Math.min(0.6, (steep - 1.7) * 0.5));
        if (ash[i] > 0) c = mix(c, hashPx(X, Y, 248) < 0.3 ? 0x5a4e4a : 0x7a6a5e, ash[i] * 0.85);
        c = scaleColor(c, Math.max(0.55, Math.min(1.45, h < 0.1 ? 1 + (lit - 1) * 0.6 : lit)));
        // the shore: a strip of sand where the land is low, rock where the hills come down to the sea
        if (inland[i] < (whole ? 2.2 : 1 + S * 0.03)) {
          if (!whole && blur[i] > 0.13) c = hashPx(X, Y, 209) < 0.4 ? 0x5e5850 : 0x7a7264;
          else c = hashPx(X, Y, 209) < 0.35 ? 0xc0ae78 : 0xdccc98;
        }
        img.set(X, Y, c);
        continue;
      }
      // the sea: coloured by its depth, a little lighter in the south; the isobaths as fine lines; the mud flats of
      // the Ariake Sea bare at low tide, its creeks winding through them
      const o = lake[i] ? 0 : offshore[i] / S;
      const swell = fbm(x, y * 2.2, { seed: 210, scale: 18, octaves: whole ? 3 : 5 });
      let c;
      if (lake[i]) c = mix(0x3a7a9a, 0x5a9ab4, swell);
      else {
        const d = depth[i];
        c = seaColor(d);
        c = scaleColor(c, 0.9 + swell * 0.18 + (y / MAP.h) * 0.08);
        for (const [L, a] of ISOBATHS) {
          const r = X + 1 < W && !land[i + 1] ? depth[i + 1] : d;
          const b = Y + 1 < H && !land[i + W] ? depth[i + W] : d;
          if ((d - L) * (r - L) < 0 || (d - L) * (b - L) < 0) c = mix(c, 0x6aa0b8, a);
        }
        let mud = 0;
        if (!whole && o < 0.9)
          for (const [fx0, fy0, rad] of flats) mud = Math.max(mud, smooth(rad, rad * 0.5, Math.hypot(x - fx0, y - fy0)) * smooth(0.75, 0.2, o + (fbm(x, y, { seed: 293, scale: 0.4, octaves: 3 }) - 0.5) * 0.5));
        if (mud > 0.5 && ridged(x * 2.2, y * 2.2, 294, 3) < 0.78) c = mix(0x7a705c, 0x988e74, fbm(x, y, { seed: 295, scale: 0.15, octaves: 2 }));
        else if (o < surf) c = 0xe0eeee; // the surf
        else if (o < surf * 1.8 && hashPx(X >> 1, Y >> 1, 211) < 0.25) c = mix(c, 0xe0eeee, 0.5);
      }
      img.set(X, Y, c);
    }
  const dry = (X, Y) => X >= 0 && Y >= 0 && X < W && Y < H && land[Y * W + X] && !lake[Y * W + X];
  const blob = (X, Y, r, c, a = 1) => {
    if (r <= 0.6) return img.set(X, Y, c, a);
    for (let j = Math.floor(-r); j <= r; j++) for (let i = Math.floor(-r); i <= r; i++) if (i * i + j * j <= r * r && dry(X + i, Y + j)) img.set(X + i, Y + j, c, a);
  };
  // ---- close up: the towns, spreading over the flat land and stopping at the hills: the downtown's tall blocks, light,
  // each with its shadow, on broad avenues; the houses' roofs in a grid of streets around it, thinning out into the
  // fields; temple groves and parks; the grid square in the old capitals and the north, turned elsewhere. Then the
  // castles in their moats, the palaces' and the parks' grounds
  if (!whole) {
    const B = S >= 12 ? 3 : 2; // (a block and its street, in pixels)
    const ROOFS = [0x8e8a86, 0xa29c94, 0x7c7c84, 0xb4aca0, 0x6e6a6c, 0x8a6a5a, 0x5e6e8c, 0x4e5a6e, 0x9a5e4e];
    TOWNS.forEach(([lon, la, km, square], n) => {
      const [cx, cy] = project(lon, la);
      const west = inInset(lon, la);
      const rx = ((km * 1.6) / (111 * Math.cos((la * Math.PI) / 180))) * (west ? INSET.sx : MAP.sx);
      const ry = ((km * 1.6) / 111) * (west ? INSET.sy : MAP.sy);
      const ang = square ? 0 : (hashPx(n, 0, 320) - 0.5) * 0.9;
      const [ca, sa] = [Math.cos(ang), Math.sin(ang)];
      const core = km >= 10 ? 0.4 : km >= 6 ? 0.32 : km >= 3 ? 0.2 : 0.1;
      const fill = km >= 6 ? 3.2 : 2.4; // (the big cities built up solid further out)
      const [X0, Y0] = [fx(cx), fy(cy)];
      for (let Y = Math.floor(fy(cy - ry * 1.4)); Y <= fy(cy + ry * 1.4); Y++)
        for (let X = Math.floor(fx(cx - rx * 1.4)); X <= fx(cx + rx * 1.4); X++) {
          if (!dry(X, Y)) continue;
          const x = ux(X);
          const y = uy(Y);
          const i = Y * W + X;
          let d = Math.hypot((x - cx) / rx, (y - cy) / ry) + (fbm(x, y, { seed: 221, scale: 0.9, octaves: 3 }) - 0.5) * 0.8;
          d += smooth(0.07, 0.28, height[i]) * 1.6; // (up the hills it gives out)
          if (d >= 1) continue;
          const gu = (X - X0) * ca + (Y - Y0) * sa;
          const gv = -(X - X0) * sa + (Y - Y0) * ca;
          const bi = Math.floor(gu / B);
          const bj = Math.floor(gv / B);
          const [iu, iv] = [Math.floor(gu - bi * B), Math.floor(gv - bj * B)];
          const avenue = ((bi % 6 === 0 && iu === 0) || (bj % 6 === 0 && iv === 0)) && d < 0.9;
          const street = B > 2 ? iu === 0 || iv === 0 : false;
          const downtown = d < core;
          if (!avenue && hashPx(bi + n * 977, bj, 322) > (1 - d) * fill + 0.04) continue; // (fields between the houses at the edge)
          let c;
          if (avenue) c = downtown ? 0xe0dacc : 0xd2c8b0;
          else if (street) c = downtown ? 0x8e8a86 : 0xb8ae9e;
          else if (hashPx(bi + n * 977, bj, 327) < (downtown ? 0.03 : 0.06)) c = hashPx(X, Y, 328) < 0.45 ? 0x3e7a44 : 0x5a9a50; // a grove, a park
          else if (downtown) {
            // (the tall blocks: light concrete and glass, their shadow on the far side)
            const t = hashPx(bi + n * 977, bj, 323);
            c = t < 0.15 ? 0x9ab0c8 : mix(0xc8c8c4, 0xeeece6, t);
            if (iu === B - 1 || iv === B - 1) c = t > 0.6 ? 0x5e5e68 : 0x76767e;
          } else {
            c = ROOFS[Math.floor(hashPx(bi + n * 977, bj, 324) * ROOFS.length)];
            if ((X + Y) % B === 1) c = scaleColor(c, 1.1); // (the lit side of the roofs)
            if (hashPx(X, Y, 325) < 0.12) c = scaleColor(c, 0.84);
          }
          img.set(X, Y, c, street && !avenue ? 0.85 : 1);
        }
    });
    // the castles: a square of moat, the stone of the walls, the green of the grounds, the white keep
    for (const [lon, la, km] of CASTLES) {
      const [cx, cy] = project(lon, la);
      // (drawn as a sign where it is smaller than that: at least five pixels across)
      const half = Math.max(2.5, ((km / 2) * S) / KM);
      if (S < 12) continue;
      const ring = Math.max(1, half * 0.22);
      const [X0, Y0] = [Math.round(fx(cx)), Math.round(fy(cy))];
      for (let j = -Math.ceil(half); j <= half; j++)
        for (let i = -Math.ceil(half); i <= half; i++) {
          const e = half - Math.max(Math.abs(i), Math.abs(j));
          if (e < 0) continue;
          img.set(X0 + i, Y0 + j, e < ring ? 0x4a88a8 : e < ring + 1 ? 0xbab2a0 : hashPx(X0 + i, Y0 + j, 330) < 0.4 ? 0x3e7a44 : 0x5e9a52);
        }
      for (let j = -1; j <= 0; j++) for (let i = -1; i <= 0; i++) img.set(X0 + i, Y0 + j, j < 0 ? 0x3a4250 : 0xf2f0ea);
    }
    for (const [lon, la, wk, hk] of PARKS) {
      const [cx, cy] = project(lon, la);
      if (S < 12) continue;
      const [hw, hh] = [Math.max(1.5, ((wk / 2) * S) / KM), Math.max(1.5, ((hk / 2) * S) / KM)];
      const [X0, Y0] = [Math.round(fx(cx)), Math.round(fy(cy))];
      for (let j = -Math.ceil(hh); j <= hh; j++)
        for (let i = -Math.ceil(hw); i <= hw; i++) if (dry(X0 + i, Y0 + j)) img.set(X0 + i, Y0 + j, hashPx(X0 + i, Y0 + j, 331) < 0.4 ? 0x3e7a44 : 0x5e9a52);
    }
  }
  // the rivers: from the mountains down to the sea, wandering, down the valleys they cut
  // (two passes: the banks' shadow, then the water, so a river crossing itself stays clean)
  for (const pass of [0, 1])
    for (const r of COURSES) {
      if (whole && r.size < 2) continue;
      let last = -1;
      for (const [px, py, w] of r.pts) {
        const X = Math.round(fx(px));
        const Y = Math.round(fy(py));
        if (X < 0 || Y < 0 || X >= W || Y >= H || !land[Y * W + X] || Y * W + X === last) continue;
        last = Y * W + X;
        if (whole) {
          if (pass) img.set(X, Y, 0x5aa0c4, r.size > 2 ? 1 : 0.6);
          else img.set(X + 1, Y, 0x3e7ea0, r.size > 2 ? 0.6 : 0.3);
        } else if (!pass) blob(X + 1, Y + 1, w * S + 0.5, 0x2e5e70, 0.35);
        else blob(X, Y, Math.max(0.5, w * S), mix(0x5aa0c4, 0x7ab8d4, hashPx(X >> 2, Y >> 2, 215) * 0.4));
      }
    }
  // ---- close up: the ways. The expressways amber in a dark edge, on bridges over the straits (a pale deck, its shadow
  // on the water, a tower where it leaves the shore), under the sea in their tunnels; the old main lines dark with pale
  // ticks; the ferries' dashes across the sea; the harbours' piers and cranes behind their breakwaters; the airports'
  // aprons and runways
  if (!whole) {
    const disc = (X, Y, r, c, a = 1) => {
      if (r <= 0.6) return img.set(X, Y, c, a);
      for (let j = Math.floor(-r); j <= r; j++) for (let i = Math.floor(-r); i <= r; i++) if (i * i + j * j <= r * r) img.set(X + i, Y + j, c, a);
    };
    const inside2 = (X, Y) => X >= 0 && Y >= 0 && X < W && Y < H;
    const r = S >= 12 ? 0.8 : 0.4;
    const roads = ROADS.map((pts) => smoothPath(pts, S));
    for (const pass of [0, 1, 2])
      for (const pts of roads) {
        let last = -1;
        let wasWater = null;
        for (const [px, py, tunnel] of pts) {
          const X = Math.round(fx(px));
          const Y = Math.round(fy(py));
          if (!inside2(X, Y) || Y * W + X === last) continue;
          last = Y * W + X;
          const water = !land[last] || lake[last];
          if (tunnel && water) {
            wasWater = null;
            continue;
          }
          if (water) {
            if (pass === 0) disc(X + 1, Y + 2, r + 0.4, 0x0c1828, 0.4);
            else if (pass === 1) disc(X, Y, r, 0xe8e4da);
            else if (wasWater === false && S >= 12) for (let j = 1; j <= 3; j++) img.set(X, Y - j, 0x3a3e4a);
          } else if (pass === 0) disc(X, Y, r + 0.7, 0x5a3e22, 0.5);
          else if (pass === 1) disc(X, Y, r, mix(0xe8b048, 0xf0c460, hashPx(X >> 2, Y >> 2, 340)));
          else if (wasWater === true && S >= 12) for (let j = 1; j <= 3; j++) img.set(X, Y - j, 0x3a3e4a);
          wasWater = water;
        }
      }
    for (const pts of RAILS.map((q) => smoothPath(q, S))) {
      let run = 0;
      let last = -1;
      for (const [px, py] of pts) {
        const X = Math.round(fx(px));
        const Y = Math.round(fy(py));
        if (!inside2(X, Y) || Y * W + X === last) continue;
        last = Y * W + X;
        run++;
        if (!land[last]) continue;
        img.set(X, Y, run % 4 === 0 && S >= 12 ? 0xd8d4c8 : 0x34343e);
      }
    }
    for (const pts of FERRIES.map((q) => smoothPath(q, S))) {
      let run = 0;
      let last = -1;
      for (const [px, py] of pts) {
        const X = Math.round(fx(px));
        const Y = Math.round(fy(py));
        if (!inside2(X, Y) || Y * W + X === last) continue;
        last = Y * W + X;
        run++;
        if (!land[last] && run % 6 < 3) img.set(X, Y, 0xe8f0f4, 0.6);
      }
    }
    for (const [lon, la, km] of PORTS) {
      const [cx, cy] = project(lon, la);
      const R = km / KM;
      for (let Y = Math.max(1, Math.floor(fy(cy - R))); Y < Math.min(H - 1, fy(cy + R)); Y++)
        for (let X = Math.max(1, Math.floor(fx(cx - R))); X < Math.min(W - 1, fx(cx + R)); X++) {
          const i = Y * W + X;
          if (land[i]) continue;
          const x = ux(X);
          const y = uy(Y);
          const dd = Math.hypot(x - cx, y - cy) / R;
          if (dd > 1) continue;
          const o = offshore[i] / S;
          const reach = 0.3 * (1 - dd * 0.6);
          // (along the shore: the offshore distance's gradient gives its normal)
          const gx = offshore[i + 1] - offshore[i - 1];
          const gy = offshore[i + W] - offshore[i - W];
          const gl = Math.hypot(gx, gy) || 1;
          const along = (x * -gy + y * gx) / gl;
          if (o < reach && ((along / 0.26) % 1 + 1) % 1 < 0.42) img.set(X, Y, o > reach - 1.2 / S && hashPx(X, Y, 341) < 0.5 ? 0xc84a3a : mix(0x9a9890, 0xb4b0a6, hashPx(X >> 1, Y >> 1, 342)));
          else if (o > reach + 0.06 && o < reach + 0.06 + 1 / S && fbm(x, y, { seed: 343, scale: 0.3, octaves: 2 }) > 0.42) img.set(X, Y, 0xd8d4cc);
        }
    }
    if (S >= 12) {
      const pads = AIRPORT_ISLANDS.map(outline);
      for (const pad of pads)
        for (let Y = Math.max(0, Math.floor(fy(pad.y0))); Y < Math.min(H, fy(pad.y1)); Y++)
          for (let X = Math.max(0, Math.floor(fx(pad.x0))); X < Math.min(W, fx(pad.x1)); X++) if (land[Y * W + X] && inside(pad, ux(X + 0.5), uy(Y + 0.5))) img.set(X, Y, 0xb4b4b0);
      for (const [lon, la, hdg, runways] of AIRPORTS) {
        const [cx, cy] = project(lon, la);
        const [dx, dy] = [Math.sin((hdg * Math.PI) / 180), -Math.cos((hdg * Math.PI) / 180)];
        const [X0, Y0] = [fx(cx), fy(cy)];
        const k3 = (1.3 * S) / KM; // (km to pixels, the runways a little longer than they are, to read)
        const long = Math.max(...runways.map(([l]) => l)) * k3;
        const wide = (Math.max(...runways.map(([, o]) => Math.abs(o))) + 0.7) * k3;
        for (let t = -long / 2 - 1; t <= long / 2 + 1; t += 0.5)
          for (let w2 = -wide; w2 <= wide; w2 += 0.5) img.set(Math.round(X0 + dx * t - dy * w2), Math.round(Y0 + dy * t + dx * w2), 0xb8b8b4);
        for (const [l, off] of runways)
          for (let t = (-l * k3) / 2; t <= (l * k3) / 2; t += 0.5) {
            const X = Math.round(X0 + dx * t - dy * off * k3);
            const Y = Math.round(Y0 + dy * t + dx * off * k3);
            img.set(X, Y, Math.abs(t) > (l * k3) / 2 - 1 ? 0xf4f4f0 : Math.floor(t) % 3 === 0 ? 0xe8e8e4 : 0x48484e);
          }
      }
    }
  }

  // ---- close up: the Shinkansen, a dashed black and white line on land, under the sea where it goes under the sea
  if (!whole) {
    const r = Math.max(0.8, S / 11);
    for (const pass of [0, 1])
      for (const line of SHINKANSEN) {
        const P = line.map(([lon, la]) => project(lon, la));
        let run = 0;
        for (let n = 0; n + 1 < P.length; n++) {
          const len = Math.hypot(P[n + 1][0] - P[n][0], P[n + 1][1] - P[n][1]);
          const steps = Math.ceil(len * S * 2);
          for (let t = 0; t <= steps; t++) {
            const u = t / steps;
            const X = Math.round(fx(P[n][0] + (P[n + 1][0] - P[n][0]) * u));
            const Y = Math.round(fy(P[n][1] + (P[n + 1][1] - P[n][1]) * u));
            const along = run + len * u;
            if (!pass) blob(X, Y, r + 0.9, 0x1a1c26, 0.85);
            else blob(X, Y, r, Math.floor(along / 0.45) % 2 ? 0xf6f2ea : 0x3a3e4a);
          }
          run += len;
        }
      }
  }

  // ---- what's drawn on the sea
  const sea = (X, Y, margin = 6) => X >= 0 && Y >= 0 && X < W && Y < H && !land[Y * W + X] && offshore[Y * W + X] > margin * S;
  if (whole) {
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
  }
  // little crests of waves, scattered
  const wr = rng(213);
  for (let n = 0; n < (whole ? 900 : Math.round((W * H) / 760)); n++) {
    const X = Math.floor(wr() * W);
    const Y = Math.floor(wr() * H);
    if (!sea(X, Y, whole ? 3 : 1.5)) continue;
    const m = Math.round((3 + Math.floor(wr() * 6)) * (whole ? 1 : Math.sqrt(k)));
    for (let i = -m; i <= m; i++) {
      const dy = Math.round((i / m) ** 2 * 2 * (whole ? 1 : Math.sqrt(k)));
      if (sea(X + i, Y + dy, 1)) img.set(X + i, Y + dy, 0x7aa2c4, 0.32 * (1 - Math.abs(i) / (m + 1)));
    }
  }
  if (whole) {
    // the Kuroshio: long streaks up the Pacific side
    for (let t = 0; t < 1; t += 0.0007) {
      const x = 92 + t * 76 + Math.sin(t * 19) * 3;
      const y = 300 - t * 118 - Math.sin(t * 7) * 6;
      for (let n = -4; n <= 4; n++) {
        if (hashPx(Math.floor(t * 300), n, 214) < 0.55) continue;
        const X = Math.round((x + n * 0.7) * S);
        const Y = Math.round((y + n * 1.4) * S);
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
      for (let n = 0; n < 16; n++) img.set(X - 14 - n, Y + 8 + Math.round(n * 0.3), 0xc8e0e8, 0.5 - n * 0.03);
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
      for (let n = 0; n < 6; n++) for (let j = -n * 0.8; j <= n * 0.8; j++) img.set(X - 19 - n, Math.round(Y + j - n * 0.7), 0x344a70);
      for (let n = 0; n < 7; n++) {
        img.set(X + 10, Y - 7 - n, 0xe0f0f8, 0.8);
        img.set(X + 10 - n * 0.7, Y - 8 - n, 0xe0f0f8, 0.55);
        img.set(X + 10 + n * 0.7, Y - 8 - n, 0xe0f0f8, 0.55);
      }
      for (let i = -24; i <= 24; i += 2) img.set(X + i, Y + 4 + (i % 4 === 0 ? 1 : 0), 0xc8e0e8, 0.55);
    }

    // ---- Mt Fuji standing up from the map, with its shadow, its snow and a band of cloud (close up it is a cone in the relief)
    {
      const X = Math.round(fujiX * S);
      const Yb = Math.round(fujiY * S) + 4;
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
  }

  // ---- the Okinawa inset: a chart of its own, in a gilt frame, a dashed line from Kyūshū (close up on its own tile,
  // the dashed line only on the whole map)
  if (!tile) {
    const x0 = Math.round(fx(INSET.x));
    const y0 = Math.round(fy(INSET.y));
    const w = Math.round(INSET.w * S);
    const h = Math.round(INSET.h * S);
    const b = Math.round(4 * k); // (the frame as thick in map units as on the whole map)
    for (let Y = Math.max(0, y0 + b); Y < Math.min(H, y0 + h - b + 1); Y++)
      for (let X = Math.max(0, x0 + b); X < Math.min(W, x0 + w - b + 1); X++) {
        if (land[Y * W + X]) continue;
        const o = offshore[Y * W + X] / S;
        let c = mix(0x1c5a84, 0x2a7ca0, fbm(ux(X) * 3, uy(Y) * 3, { seed: 217, scale: 24, octaves: whole ? 3 : 4 }));
        c = mix(c, 0x68c0c8, smooth(5, 0.7, o) * 0.85);
        // close up the coral reefs: a pale lagoon inside the reef's edge, the breakers white along it, the deep blue
        // dropping off beyond
        if (!whole) {
          const edge = 0.45 + (fbm(ux(X), uy(Y), { seed: 297, scale: 0.8, octaves: 3 }) - 0.5) * 0.4;
          if (o < edge) c = mix(0xbaf0e2, 0x86d8cc, (o / edge) ** 2);
          else if (o < edge + 1.5 / S) c = hashPx(X, Y, 298) < 0.55 ? 0xf2fbf8 : 0xbcece2;
          else c = mix(c, 0x1a5a88, smooth(edge + 0.1, edge + 0.6, o) * 0.3 * smooth(2, 1, o));
        }
        if (o < surf) c = 0xf0f8f4;
        img.set(X, Y, c);
      }
    const frame = [0x4a3a20, 0xe8c878, 0xb8945a, 0x4a3a20];
    for (let n = 0; n < b; n++) {
      const c = frame[Math.min(3, Math.floor((n * 4) / b))];
      for (let X = x0 + n; X < x0 + w - n; X++) {
        img.set(X, y0 + n, c);
        img.set(X, y0 + h - 1 - n, c);
      }
      for (let Y = y0 + n; Y < y0 + h - n; Y++) {
        img.set(x0 + n, Y, c);
        img.set(x0 + w - 1 - n, Y, c);
      }
    }
    for (const [X, Y] of [[x0, y0], [x0 + w - 1, y0], [x0, y0 + h - 1], [x0 + w - 1, y0 + h - 1]]) {
      const R = 6 * k;
      for (let j = -Math.ceil(R); j <= R; j++) for (let i = -Math.ceil(R); i <= R; i++) if (Math.abs(i) + Math.abs(j) <= R) img.set(X + i, Y + j, Math.abs(i) + Math.abs(j) > R - 2 * k ? 0x4a3a20 : 0xe8c878);
      for (let j = -Math.floor(k / 2); j <= k / 2; j++) for (let i = -Math.floor(k / 2); i <= k / 2; i++) img.set(X + i, Y + j, 0xfff4c8);
    }
    const [ax, ay] = project(130.9, 30.9);
    const [bx, by] = [INSET.x, INSET.y + INSET.h / 2];
    const n = Math.round(Math.hypot(bx - ax, by - ay) * 3);
    for (let t = 10; whole && t < n - 6; t++) {
      if (Math.floor(t) % 12 >= 6) continue;
      const X = Math.round(fx(ax + ((bx - ax) * t) / n));
      const Y = Math.round(fy(ay + ((by - ay) * t) / n));
      for (let j = 0; j < Math.max(1, Math.round(k)); j++) {
        img.set(X, Y + j, 0xe8c878, 0.85);
        img.set(X, Y + j + Math.max(1, Math.round(k)), 0x4a3a20, 0.6);
      }
    }
  }

  if (whole) {
    // ---- the compass rose: sixteen points, the north in gold, ringed, with its letter
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
    for (let n = 0; n < 32; n++) {
      const a = (n / 32) * Math.PI * 2;
      for (let d = 29; d < 33; d++) img.set(Math.round(cx + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d), n % 4 ? 0x8a7a50 : 0xe8c878);
    }
    const point = (a, len, half, lit, dark) => {
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      for (let d = 0; d < len; d++) {
        const w = half * (1 - d / len);
        for (let s = -w; s <= w; s += 0.4) img.set(Math.round(cx + ca * d - sa * s), Math.round(cy + sa * d + ca * s), s < 0 ? lit : dark);
      }
    };
    for (let n = 0; n < 16; n += 2) if (n % 4) point(((n + 1 - 1) / 16) * Math.PI * 2 - Math.PI / 2, 22, 3, 0xb8a878, 0x6a5a38);
    for (let n = 0; n < 4; n++) {
      const a = (n / 4) * Math.PI * 2 - Math.PI / 2;
      point(a, n === 0 ? 40 : 33, 5.5, n === 0 ? 0xffe8a0 : 0xe8d090, n === 0 ? 0xc8302a : 0x8a7a50);
    }
    img.set(cx, cy, 0xfff8e0);
    for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (Math.abs(i) + Math.abs(j) < 3) img.set(cx + i, cy + j, 0xfff0c0);
    // the N
    const nx = cx - 6;
    const ny = cy - 57;
    for (let n = 0; n < 13; n++) {
      for (const w of [0, 1]) {
        img.set(nx + w, ny + n, 0xffe8a0);
        img.set(nx + 11 + w, ny + n, 0xffe8a0);
        img.set(nx + Math.round((n * 11) / 12) + w, ny + n, 0xffe8a0);
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
  // a tile: its margin cut off, its edges fading into the whole map under it; the inset clear round its frame
  const out = img.crop(M * S, M * S, W - 2 * M * S, H - 2 * M * S);
  if (inset) {
    const x0 = Math.round(fx(INSET.x)) - M * S;
    const y0 = Math.round(fy(INSET.y)) - M * S;
    const [w, h] = [Math.round(INSET.w * S), Math.round(INSET.h * S)];
    const R = 6 * k;
    const corners = [[x0, y0], [x0 + w - 1, y0], [x0, y0 + h - 1], [x0 + w - 1, y0 + h - 1]];
    for (let Y = 0; Y < out.h; Y++)
      for (let X = 0; X < out.w; X++) {
        if (X >= x0 && X < x0 + w && Y >= y0 && Y < y0 + h) continue;
        if (corners.some(([cx, cy]) => Math.abs(X - cx) + Math.abs(Y - cy) <= R)) continue;
        out.data[(Y * out.w + X) * 4 + 3] = 0;
      }
    return out;
  }
  const F = 4 * S;
  for (let Y = 0; Y < out.h; Y++)
    for (let X = 0; X < out.w; X++) {
      const e = Math.min(X, out.w - 1 - X, Y, out.h - 1 - Y) / F;
      if (e < 1) out.data[(Y * out.w + X) * 4 + 3] = Math.round(255 * smooth(0, 1, Math.max(0, e)));
    }
  return out;
}

/**
 * The ways along which the map's life moves (src/game/mapLife.js), exactly as they are drawn above: each ferry line's
 * smooth curve and each Shinkansen line, in map units, with the live volcanoes' craters (the ones that smoke).
 */
export function mapPaths() {
  const r2 = (v) => Math.round(v * 100) / 100;
  const thin = (pts) => pts.filter((_, i) => i % 3 === 0 || i === pts.length - 1).map(([x, y]) => [r2(x), r2(y)]);
  return {
    ferries: FERRIES.map((q) => thin(smoothPath(q, 6))),
    shinkansen: SHINKANSEN.map((line) => line.map(([lon, la]) => project(lon, la).map(r2))),
  };
}
