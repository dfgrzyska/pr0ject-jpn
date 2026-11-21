// The map of Japan at 540 px, shown between stages and to choose a city: the four main islands and their smaller ones, in
// relief (lit from the north-west: plains, forest, bare rock and snow), rivers and Lake Biwa; Okinawa in an inset; a night-
// blue sea with its shallows, wave-scales, the Kuroshio, junks and a whale, bands of cloud, a compass rose; Mt Fuji.
// Coastlines are simplified polygons in lon/lat, projected with src/data/japan.js (the game's logical units x 3).
import { Raster, fbm, mix, noise2, rng, scaleColor } from '../lib/raster.mjs';
import { hashPx } from './hires.mjs';
import { MAP, INSET, project } from '../../src/data/japan.js';


const HONSHU = [
  [130.92, 33.95], [130.85, 34.25], [131.2, 34.45], [131.65, 34.67], [132.1, 34.95], [132.6, 35.4], [133.05, 35.58], [133.35, 35.5],
  [133.65, 35.52], [134.25, 35.55], [134.8, 35.67], [135.2, 35.75], [135.45, 35.55], [135.85, 35.63], [136.05, 35.95], [136.25, 36.3],
  [136.65, 36.65], [136.75, 37.0], [136.9, 37.4], [137.35, 37.5], [137.1, 37.05], [136.95, 36.8], [137.4, 36.85], [137.9, 37.05],
  [138.25, 37.18], [138.6, 37.5], [139.05, 37.95], [139.45, 38.4], [139.75, 38.95], [140.0, 39.6], [139.75, 39.95], [140.0, 40.3],
  [139.92, 40.62], [140.25, 41.0], [140.35, 41.25], [140.65, 41.0], [140.85, 40.85], [141.2, 41.15], [141.15, 41.45], [140.95, 41.5],
  [141.4, 41.4], [141.45, 40.6], [141.85, 40.1], [142.05, 39.55], [141.75, 39.0], [141.6, 38.6], [141.1, 38.3], [140.95, 37.9],
  [141.0, 37.4], [140.9, 36.9], [140.65, 36.4], [140.6, 36.1], [140.85, 35.72],
  // (finer from here, for the close-ups: Kujūkuri, Bōsō, Tokyo Bay, Miura, Sagami Bay, Izu, Suruga, Ise and Mikawa Bays, Kii,
  // Osaka Bay, the Inland Sea's coast to Shimonoseki)
  [140.7, 35.6], [140.55, 35.47], [140.42, 35.33], [140.36, 35.18], [140.2, 35.1], [140.05, 35.0], [139.93, 34.91], [139.82, 34.95],
  [139.84, 35.08], [139.82, 35.2], [139.78, 35.32], [139.9, 35.4], [140.05, 35.56], [139.95, 35.66], [139.8, 35.63], [139.76, 35.58],
  [139.73, 35.53], [139.67, 35.46], [139.66, 35.36], [139.72, 35.24], [139.65, 35.14], [139.58, 35.2], [139.55, 35.29], [139.45, 35.3],
  [139.3, 35.31], [139.16, 35.245], [139.12, 35.16], [139.08, 35.1], [139.12, 34.96], [139.1, 34.76], [138.97, 34.66], [138.85, 34.59],
  [138.77, 34.7], [138.75, 34.85], [138.77, 35.0], [138.86, 35.08], [138.7, 35.13], [138.52, 35.02], [138.38, 34.93], [138.3, 34.8],
  [138.22, 34.6], [137.95, 34.65], [137.72, 34.68], [137.58, 34.67], [137.35, 34.62], [137.03, 34.57], [137.12, 34.66], [137.3, 34.74],
  [137.2, 34.81], [137.04, 34.84], [136.97, 34.72], [136.96, 34.68], [136.86, 34.74], [136.84, 34.9], [136.88, 35.04], [136.75, 35.05],
  [136.64, 34.97], [136.55, 34.75], [136.62, 34.55], [136.85, 34.5], [136.9, 34.33], [136.7, 34.27], [136.4, 34.2], [136.25, 34.05],
  [136.02, 33.75], [135.85, 33.5], [135.77, 33.43], [135.55, 33.5], [135.38, 33.65], [135.18, 33.85], [135.1, 34.0], [135.15, 34.2],
  [135.08, 34.3], [135.25, 34.4], [135.42, 34.55], [135.43, 34.65], [135.4, 34.72], [135.25, 34.69], [135.2, 34.675], [135.05, 34.63],
  [134.95, 34.64], [134.8, 34.73], [134.65, 34.77], [134.4, 34.73], [134.25, 34.68], [134.15, 34.62], [133.95, 34.55], [133.8, 34.48],
  [133.6, 34.5], [133.45, 34.45], [133.36, 34.42], [133.25, 34.398], [133.08, 34.37], [132.95, 34.3], [132.78, 34.25], [132.6, 34.2],
  [132.55, 34.3], [132.47, 34.35], [132.4, 34.33], [132.33, 34.3], [132.2, 34.2], [132.15, 34.1], [132.05, 34.0], [131.85, 33.95],
  [131.6, 34.0], [131.4, 33.98], [131.15, 33.95],
];
const KYUSHU = [
  [130.96, 33.95], [131.0, 33.85], [131.05, 33.75], [131.2, 33.62], [131.4, 33.57], [131.55, 33.67], [131.68, 33.62], [131.75, 33.5],
  [131.7, 33.42], [131.55, 33.36], [131.5, 33.32], [131.505, 33.28], [131.55, 33.25], [131.7, 33.25], [131.87, 33.22], [131.85, 33.1],
  [131.95, 33.0], [131.9, 32.85], [131.95, 32.75], [131.75, 32.6], [131.6, 32.4], [131.5, 32.1], [131.45, 31.9], [131.45, 31.6],
  [131.35, 31.38], [131.1, 31.46], [130.95, 31.3], [130.85, 31.1], [130.68, 31.0], [130.72, 31.2], [130.75, 31.42], [130.77, 31.72],
  [130.65, 31.72], [130.575, 31.6], [130.55, 31.45], [130.62, 31.25], [130.52, 31.17], [130.3, 31.25], [130.2, 31.35], [130.22, 31.55],
  [130.17, 31.7], [130.2, 31.9], [130.25, 32.05], [130.35, 32.2], [130.5, 32.35], [130.55, 32.6], [130.62, 32.75], [130.6, 32.85],
  [130.55, 33.0], [130.4, 33.15], [130.25, 33.15], [130.18, 33.05], [130.2, 32.87], [130.3, 32.82], [130.37, 32.75], [130.35, 32.62],
  [130.25, 32.59], [130.15, 32.65], [130.12, 32.75], [130.05, 32.8], [129.98, 32.74], [129.92, 32.68], [129.85, 32.62], [129.76, 32.56],
  [129.8, 32.68], [129.855, 32.735], [129.82, 32.78], [129.7, 32.85], [129.65, 33.0], [129.7, 33.15], [129.6, 33.25], [129.62, 33.38],
  [129.8, 33.38], [129.9, 33.52], [130.05, 33.48], [130.2, 33.6], [130.3, 33.6], [130.38, 33.6], [130.42, 33.65], [130.45, 33.75],
  [130.55, 33.85], [130.7, 33.93], [130.85, 33.92],
];
const SHIKOKU = [
  [132.7, 33.85], [132.85, 34.05], [133.0, 34.08], [133.15, 33.97], [133.3, 33.98], [133.55, 34.03], [133.7, 34.18], [133.8, 34.3],
  [133.95, 34.35], [134.05, 34.35], [134.25, 34.3], [134.45, 34.22], [134.6, 34.15], [134.58, 34.0], [134.7, 33.9], [134.55, 33.7],
  [134.35, 33.5], [134.18, 33.25], [134.0, 33.45], [133.6, 33.5], [133.3, 33.38], [133.05, 33.0], [132.98, 32.72], [132.75, 32.8],
  [132.55, 33.0], [132.45, 33.2], [132.35, 33.38], [132.0, 33.34], [132.3, 33.45], [132.5, 33.6], [132.6, 33.75],
];
const AWAJI = [
  [135.02, 34.6], [134.98, 34.5], [134.92, 34.38], [134.93, 34.3], [134.85, 34.2], [134.7, 34.17], [134.66, 34.25], [134.78, 34.37],
  [134.88, 34.48], [134.97, 34.58],
];
const AMAKUSA = [[130.17, 32.6], [130.35, 32.55], [130.42, 32.45], [130.3, 32.38], [130.2, 32.25], [130.05, 32.2], [130.0, 32.35], [130.05, 32.5]];
const BIWA = [
  [136.07, 35.51], [136.15, 35.52], [136.2, 35.48], [136.25, 35.42], [136.27, 35.38], [136.24, 35.28], [136.17, 35.21], [136.08, 35.15],
  [135.98, 35.08], [135.95, 35.03], [135.9, 34.98], [135.87, 35.0], [135.9, 35.08], [135.93, 35.13], [135.97, 35.24], [136.01, 35.32],
  [136.03, 35.41], [136.04, 35.48],
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
  [[132.45, 34.36], [132.5, 34.52], [132.62, 34.72]], // Ōta, its delta Hiroshima
  [[139.78, 35.64], [139.68, 35.88], [139.35, 36.05]], // Ara, by Tokyo
  [[139.75, 35.54], [139.45, 35.65], [139.1, 35.75]], // Tama
  [[135.68, 34.92], [135.68, 35.03], [135.6, 35.15]], // Katsura, through Kyoto's west
  [[130.6, 32.7], [130.75, 32.8], [130.95, 32.85]], // Shira, by Kumamoto
];
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
  { at: [131.08, 32.88], ring: [9, 12], rim: 0.36, floor: 0.06 }, // Aso, its caldera
  { at: [131.09, 32.885], km: 5, h: 0.53, crater: 0.5, live: true }, // Aso's Naka-dake
  { at: [139.02, 35.23], ring: [5.5, 6.5], rim: 0.36, floor: 0.14 }, // Hakone
  { at: [139.02, 35.235], km: 3.5, h: 0.48, crater: 0.2, live: true }, // Hakone's Kami-yama, Ōwakudani's fumes
  { at: [144.1, 43.45], ring: [12, 12], rim: 0.3, floor: 0.12 }, // Akan
  { at: [144.0, 43.38], km: 5, h: 0.5, crater: 0.4, live: true }, // Meakan
];

// what only the close-up tiles show (TILES in src/data/japan.js): the Inland Sea's islands by Onomichi and Hiroshima,
// the Fuji Five Lakes and Ashi; towns as patches of streets (lon, lat, radius in km); the Shinkansen lines
const FINE_ISLETS = [
  [133.2, 34.372, 0.035, 0.018], // Mukaishima, across the strait from Onomichi
  [133.17, 34.31, 0.045, 0.035], // Innoshima
  [133.09, 34.27, 0.04, 0.03], // Ikuchijima
  [133.0, 34.23, 0.065, 0.05], // Ōmishima
  [133.07, 34.15, 0.045, 0.04], // Ōshima
  [132.47, 34.2, 0.05, 0.05], // Etajima
  [132.52, 34.12, 0.05, 0.04], // Kurahashi
  [132.4, 34.18, 0.03, 0.03], // Nōmijima
  [133.99, 34.455, 0.02, 0.015], // Naoshima
  [134.08, 34.47, 0.03, 0.02], // Teshima
  [129.98, 32.62, 0.03, 0.03], // Iōjima off Nagasaki
  [130.66, 31.58, 0.06, 0.05], // Sakurajima
];
const FINE_LAKES = [
  [138.765, 35.517, 0.045, 0.011], // Kawaguchi
  [138.87, 35.415, 0.03, 0.014], // Yamanaka
  [138.69, 35.497, 0.025, 0.009], // Sai
  [139.0, 35.21, 0.012, 0.03], // Ashi
  [137.6, 34.74, 0.05, 0.05], // Hamana
];
const TOWNS = [
  [139.74, 35.69, 19], [139.62, 35.47, 10], [139.64, 35.87, 9], [139.7, 35.55, 7], [140.11, 35.61, 7], // Tokyo, Yokohama, Saitama, Kawasaki, Chiba
  [139.55, 35.32, 4], [139.07, 35.1, 2.5], [139.15, 35.26, 3], [139.35, 35.65, 7], // Kamakura, Atami, Odawara, Hachiōji
  [135.5, 34.68, 14], [135.62, 34.81, 7], [135.18, 34.69, 8], [135.76, 35.01, 8], [135.81, 34.68, 4], [135.8, 34.89, 3], [134.69, 34.82, 5], // Osaka, Hirakata, Kobe, Kyoto, Nara, Uji, Himeji
  [136.91, 35.17, 13], [137.73, 34.71, 6], [138.38, 34.97, 6], [138.77, 35.5, 2], // Nagoya, Hamamatsu, Shizuoka, Fujikawaguchiko
  [133.92, 34.66, 7], [133.2, 34.41, 2.5], [133.36, 34.49, 4], [132.46, 34.4, 8], [130.95, 33.96, 4], // Okayama, Onomichi, Fukuyama, Hiroshima, Shimonoseki
  [130.4, 33.59, 9], [130.87, 33.87, 7], [130.71, 32.8, 7], [129.87, 32.75, 4], [130.55, 31.59, 5], [131.49, 33.28, 3], [131.61, 33.23, 4], // Fukuoka, Kitakyūshū, Kumamoto, Nagasaki, Kagoshima, Beppu, Ōita
  [141.35, 43.06, 9], [141.0, 43.19, 3], [141.6, 42.64, 3], [142.36, 43.77, 4], [140.73, 41.77, 4], // Sapporo, Otaru, Tomakomai, Asahikawa, Hakodate
  [140.87, 38.27, 7], // Sendai
  [127.69, 26.21, 5], [127.79, 26.33, 3], // Naha, Okinawa City
];
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

// the rivers' courses as drawn: wandering off their straight lines, sampled finely (map units), so that the valleys
// they cut and the water drawn in them are one
const COURSES = RIVERS.map((pts) => {
  const P = pts.map(([lon, la]) => project(lon, la));
  const out = [];
  for (let n = 0; n + 1 < P.length; n++) {
    const base = Math.ceil(Math.hypot(P[n + 1][0] - P[n][0], P[n + 1][1] - P[n][1]) * 3);
    const steps = base * 8;
    for (let t = 0; t <= steps; t++) {
      const u = t / steps;
      const wob = ((fbm(P[n][0] * 3 + u * 40, P[n][1] * 3 + u * base, { seed: 212, scale: 12 }) - 0.5) * 8) / 3;
      out.push([P[n][0] + (P[n + 1][0] - P[n][0]) * u + wob, P[n][1] + (P[n + 1][1] - P[n][1]) * u - wob * 0.6]);
    }
  }
  const xs = out.map((p) => p[0]);
  const ys = out.map((p) => p[1]);
  return { pts: out, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
});

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
  const shapes = [HONSHU, KYUSHU, SHIKOKU, HOKKAIDO, ...(tile ? [] : [OKINAWA]), AWAJI, AMAKUSA].map(outline);
  const islets = tile ? ISLETS.filter(([lon]) => lon >= MAP.lon0) : ISLETS;
  const lakes = [BIWA].map(outline);
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
      const west = lon < MAP.lon0;
      const sx = west ? INSET.sx : MAP.sx;
      const sy = west ? INSET.sy : MAP.sy;
      if (((x - cx) / Math.max(least, rx * sx * grow)) ** 2 + ((y - cy) / Math.max(least, ry * sy * grow)) ** 2 < 1) return true;
    }
    return false;
  };
  // the coast: the polygons roughened at two scales, so they read as coast close up (and a third in the tiles)
  for (let Y = 0; Y < H; Y++)
    for (let X = 0; X < W; X++) {
      const x = ux(X + 0.5);
      const y = uy(Y + 0.5);
      const nx = fbm(x, y, { seed: 201, scale: 7, octaves: 3 }) - 0.5;
      const ny = fbm(x, y, { seed: 202, scale: 7, octaves: 3 }) - 0.5;
      // (close up the coast is drawn truer, warped less: the port cities must stand on their harbours)
      let wx = x + nx * (whole ? 3.4 : 1.1);
      let wy = y + ny * (whole ? 3.4 : 1.1);
      if (!whole) {
        wx += (fbm(x, y, { seed: 218, scale: 1.4, octaves: 3 }) - 0.5) * 0.7;
        wy += (fbm(x, y, { seed: 219, scale: 1.4, octaves: 3 }) - 0.5) * 0.7;
      }
      if (shapes.some((s) => inside(s, wx, wy)) || ellipseAt(islets, x + nx * 1.2, y + ny * 1.2)) land[Y * W + X] = 1;
      if (!whole && ellipseAt(FINE_ISLETS, x + nx * 0.3, y + ny * 0.3, 1, 0.25)) land[Y * W + X] = 1;
      if (ellipseAt(LAKES, x + nx * 0.6, y + ny * 0.6) || lakes.some((l) => inside(l, x + nx * 0.6, y + ny * 0.6))) lake[Y * W + X] = 1;
      if (!whole && ellipseAt(FINE_LAKES, x + nx * 0.15, y + ny * 0.15, 1, 0.2)) lake[Y * W + X] = 1;
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
      // the rivers' valleys: a broad one, and the narrow cut of the river in it
      let dr = 9;
      for (const r of COURSES) {
        if (x < r.x0 - 2.5 || x > r.x1 + 2.5 || y < r.y0 - 2.5 || y > r.y1 + 2.5) continue;
        for (const [qx, qy] of r.pts) {
          const d = (qx - x) ** 2 + (qy - y) ** 2;
          if (d < dr) dr = d;
        }
      }
      if (dr < 9) {
        const d = Math.sqrt(dr);
        h *= 1 - 0.45 * Math.exp(-((d / 1.0) ** 2)) - 0.3 * Math.exp(-((d / 0.3) ** 2));
      }
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
  const surf = whole ? 0.55 : 0.55 / Math.sqrt(k);
  const [fujiX, fujiY] = project(...FUJI);

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
          // the plains: fields in little patches, a town here and there
          const cell = hashPx(X >> 3, Y >> 3, 206);
          c = mix(0x7e9a58, 0x5e8a4c, cell);
          if (cell > 0.86) c = 0xa8a868;
          if (hashPx(X >> 2, Y >> 2, 207) < 0.03) c = 0x9a8a78;
          if (!whole) {
            // close up: parcels in rows, each its own crop (young rice, greens, rapeseed in flower, ploughed earth, tea),
            // the ridges between them, a farmhouse here and there; the patches above still tint them by the village
            const row = Math.floor(Y / 4);
            const col = Math.floor((X + (row % 2) * 3) / 6);
            const p = hashPx(col, row, 230);
            let f = p < 0.36 ? mix(0x8aac5e, 0x70a052, hashPx(col, row, 231)) : p < 0.52 ? 0x5a8a46 : p < 0.62 ? 0xd2c460 : p < 0.76 ? 0x9c8a60 : p < 0.88 ? 0x5e925e : 0x9ab070;
            if (p >= 0.62 && p < 0.76 && Y % 2) f = scaleColor(f, 0.88); // (the furrows)
            if (p >= 0.76 && p < 0.88 && X % 2) f = scaleColor(f, 0.84); // (the tea in its rows)
            c = mix(f, c, 0.3);
            if ((X + (row % 2) * 3) % 6 === 0 || Y % 4 === 0) c = scaleColor(c, 0.86);
            if (hashPx(X >> 1, Y >> 1, 232) < 0.01) c = 0x8a7466;
          }
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
        if (inland[i] < 2.2 * (whole ? 1 : Math.max(1, k * 0.6))) c = hashPx(X, Y, 209) < 0.35 ? 0xc0ae78 : 0xdccc98; // the beach
        img.set(X, Y, c);
        continue;
      }
      // the sea: deepening away from the coast, lighter in the south
      const o = lake[i] ? 0 : offshore[i] / S;
      const swell = fbm(x, y * 2.2, { seed: 210, scale: 18, octaves: whole ? 3 : 5 });
      let c = mix(0x0c1a34, 0x16305a, swell * 0.7 + (y / MAP.h) * 0.35);
      if (lake[i]) c = mix(0x3a7a9a, 0x5a9ab4, swell);
      else {
        c = mix(c, 0x1c4670, smooth(9, 2, o) * 0.7);
        c = mix(c, 0x3a7c98, smooth(3, 0.6, o) * 0.75);
        // contour lines of the shelf
        const cw = whole ? 0.18 : Math.max(0.18 / k, 0.7 / S);
        for (const n of [2.6, 5.6]) if (Math.abs(o - n - (swell - 0.5) * 2) < cw) c = mix(c, 0x6aa0b8, 0.2);
        if (o < surf) c = 0xe0eeee; // the surf
        else if (o < surf * 1.8 && hashPx(X >> 1, Y >> 1, 211) < 0.25) c = mix(c, 0xe0eeee, 0.5);
      }
      img.set(X, Y, c);
    }
  const dry = (X, Y) => X >= 0 && Y >= 0 && X < W && Y < H && land[Y * W + X] && !lake[Y * W + X];
  const blob = (X, Y, r, c, a = 1) => {
    if (r <= 0.6) return img.set(X, Y, c, a);
    for (let j = Math.floor(-r); j <= r; j++) for (let i = Math.floor(-r); i <= r; i++) if (i * i + j * j <= r * r && dry(X + i, Y + j)) img.set(X + i, Y + j, c, a);
  };
  // ---- close up: the towns, blocks of roofs in a grid of streets, avenues every fourth, a park here and there; built up
  // whole in the middle, thinning out into the fields at the edge
  if (!whole) {
    const grid = Math.max(3, Math.round(S * 0.32));
    const ROOFS = [0x8e8a86, 0xa29c94, 0x7c7c84, 0xb4aca0, 0x6e6a6c, 0x8a6a5a, 0x5e6e8c];
    for (const [lon, la, km] of TOWNS) {
      const [cx, cy] = project(lon, la);
      const west = lon < MAP.lon0;
      const rx = ((km * 1.6) / (111 * Math.cos((la * Math.PI) / 180))) * (west ? INSET.sx : MAP.sx);
      const ry = ((km * 1.6) / 111) * (west ? INSET.sy : MAP.sy);
      for (let Y = Math.floor(fy(cy - ry * 1.4)); Y <= fy(cy + ry * 1.4); Y++)
        for (let X = Math.floor(fx(cx - rx * 1.4)); X <= fx(cx + rx * 1.4); X++) {
          if (!dry(X, Y)) continue;
          const x = ux(X);
          const y = uy(Y);
          const d = Math.hypot((x - cx) / rx, (y - cy) / ry) + (fbm(x, y, { seed: 221, scale: 0.9, octaves: 2 }) - 0.5) * 0.8;
          if (d >= 1) continue;
          const gx = Math.floor(X / grid);
          const gy = Math.floor(Y / grid);
          const avenue = (X % (grid * 4) === 0 || Y % (grid * 4) === 0) && d < 0.85;
          const street = X % grid === 0 || Y % grid === 0;
          if (!avenue && hashPx(gx, gy, 222) > (1 - d) * 2.4 + 0.05) continue; // (fields between the houses at the edge)
          let c;
          if (avenue) c = 0xd8ccb4;
          else if (street) c = 0xb8ae9e;
          else if (hashPx(gx, gy, 227) < 0.05) c = hashPx(X, Y, 228) < 0.4 ? 0x3e7a44 : 0x5a9a50; // a park, its trees
          else {
            c = ROOFS[Math.floor(hashPx(gx, gy, 223) * ROOFS.length)];
            if ((X + Y) % grid === 1) c = scaleColor(c, 1.12); // (the lit side of the roofs)
            if (hashPx(X, Y, 224) < 0.1) c = scaleColor(c, 0.84);
          }
          img.set(X, Y, c, street && !avenue ? 0.85 : 1);
        }
    }
  }
  // the rivers: from the mountains down to the sea, wandering, down the valleys they cut
  for (const r of COURSES) {
    let last = -1;
    for (const [px, py] of r.pts) {
      const X = Math.round(fx(px));
      const Y = Math.round(fy(py));
      if (X < 0 || Y < 0 || X >= W || Y >= H || !land[Y * W + X] || Y * W + X === last) continue;
      last = Y * W + X;
      if (whole) {
        img.set(X, Y, 0x5aa0c4);
        img.set(X + 1, Y, 0x3e7ea0, 0.6);
      } else {
        blob(X + 1, Y, S / 12 + 0.4, 0x3e7ea0, 0.5);
        blob(X, Y, S / 12, 0x5aa0c4);
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
