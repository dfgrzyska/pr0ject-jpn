// The map of the Nagasaki strip: shorelines, the Nakashima river, roads and the tramway. One source for the
// painter, the traffic and the tests, so every road, bridge, track and river leads somewhere and lines up.
//
//   u =    0..880   open sea and Hashima (Gunkanjima)
//   u =  880..1560  the coasts close in; Megami Ōhashi across the harbour mouth (deck at u = 1390)
//   u = 1560..1900  inner harbour: Mitsubishi shipyard (west), Matsugae cruise terminal (east)
//   u = 1900..2560  Oura: Ishibashi tram terminus, Oura Cathedral, Glover Garden above the seawall
//   u = 2560..2990  Dejima in its bay, the Omotemon bridge to the town
//   u = 2990..3660  Shinchi Chinatown, the Nakashima river along its west side
//   u = 3660..4280  the Nakashima's stone bridges: Meganebashi in the middle
//   u = 4280..4650  Suwa Shrine on its hill
//   u = 4650..5100  Urakami: the hypocentre and the Peace Park
//   u = 5100..5700  the inner harbour crossing, Fuchi Shrine and the lower ropeway station
//   u = 5700..6748  Mount Inasa: the driveway, the ropeway, the summit observatory and towers
//   u > 6748        nothing: the night panorama shows through above the summit ridge
import { fbm } from '../../lib/raster.mjs';

export const W = 180;
export const L = 7168;
export const RIDGE = 6748;

const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * t;
const wob = (u, seed, amp, scale = 40) => (fbm(u, seed, { seed, scale, octaves: 3 }) - 0.5) * 2 * amp;

/** Land west of the harbour lies at x < leftShore(u). */
export function leftShore(u) {
  if (u < 960 || u > 1960) return -99;
  if (u < 1150) return lerp(-8, 34, smooth(960, 1150, u)) + wob(u, 11, 6);
  if (u < 1530) return 34 + wob(u, 11, 7);
  if (u < 1580) return lerp(34 + wob(u, 11, 7), 58, smooth(1530, 1580, u));
  if (u < 1870) return 58; // the shipyard quay
  return lerp(58, -30, smooth(1870, 1960, u));
}

/** Water lies west of rightShore(u) (to x < rightShore) up to the town embankment north of Dejima. */
export function rightShore(u) {
  if (u < 930) return 999;
  if (u < 1100) return lerp(196, 146, smooth(930, 1100, u)) + wob(u, 13, 5);
  if (u < 1540) return 146 + wob(u, 13, 6);
  if (u < 1580) return lerp(146 + wob(u, 13, 6), 124, smooth(1540, 1580, u));
  if (u < 1880) return 124; // Matsugae quay
  if (u < 2000) return lerp(124, oura(u), smooth(1880, 2000, u));
  if (u < 2540) return oura(u);
  if (u < 2660) return lerp(oura(u), 150, smooth(2540, 2660, u));
  return 150;
}
const oura = () => 38;
export const EMBANK = 2975; // the town's stone embankment north of Dejima's channel

/** Dejima: the fan, its curved seaward side to the south. */
export const DEJIMA = { cx: 82, u0: 2800, u1: 2942, x0: 22, x1: 142, gate: 92 };
export const dejimaSouth = (x) => DEJIMA.u0 + 22 * ((x - DEJIMA.cx) / 60) ** 2; // the seaward arc, lowest in the middle
export const dejimaNorth = (x) => DEJIMA.u1 - 12 * (1 - ((x - DEJIMA.cx) / 60) ** 2); // the shorter landward arc
export function dejimaFan(x, u) {
  if (x < DEJIMA.x0 || x > DEJIMA.x1) return false;
  return u >= dejimaSouth(x) && u <= dejimaNorth(x);
}

/** Hashima's seawall outline (x, u). */
export const HASHIMA = [[67, 330], [108, 350], [151, 432], [152, 702], [132, 800], [95, 858], [43, 834], [22, 736], [25, 438]];
export function inPoly(pts, x, u) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [a, b] = pts[i];
    const [c, d] = pts[j];
    if (b > u !== d > u && x < ((c - a) * (u - b)) / (d - b) + a) inside = !inside;
  }
  return inside;
}

/** The Nakashima river: centre line and half width of the water (u from the embankment to the west edge). */
export function riverX(u) {
  if (u < 3600) return 18;
  if (u < 3790) return lerp(18, 90, smooth(3600, 3790, u));
  if (u < 4080) return 90;
  return lerp(90, -40, smooth(4080, 4320, u));
}
export function riverHW(u) {
  if (u < 3600) return 10;
  if (u < 3790) return lerp(10, 16, smooth(3600, 3790, u));
  if (u < 4080) return 16;
  return lerp(16, 11, smooth(4080, 4300, u));
}
/** Half width of the river's walled channel: the water plus the stone walkways at water level. */
export function channelHW(u) {
  return riverHW(u) + (u > 3720 && u < 4150 ? 7 * smooth(3720, 3790, u) * (1 - smooth(4080, 4150, u)) : 0);
}
export const RIVER = [EMBANK - 4, 4330];

/** The inner harbour by the Urakami mouth: water between the south and north quays. */
export const uraSouth = (x) => 5206 + wob(x, 17, 9, 30) + (x < 40 ? (40 - x) * 0.6 : 0);
export const uraNorth = (x) => 5424 + wob(x, 19, 10, 30) - (x > 120 ? (x - 120) * 0.5 : 0);

export function isWater(x, u) {
  if (u < 0 || u >= RIDGE) return false;
  if (u < EMBANK) {
    if (inPoly(HASHIMA, x, u)) return false;
    if (dejimaFan(x, u)) return false;
    return x > leftShore(u) && x < rightShore(u);
  }
  if (u >= RIVER[0] && u < RIVER[1] && Math.abs(x + 0.5 - riverX(u)) < riverHW(u)) return true;
  if (u > 5150 && u < 5480) return u > uraSouth(x) && u < uraNorth(x);
  return false;
}

// ------------------------------------------------------------ roads (centre lines, half widths)
// R1: the coast road and the tramway, Ishibashi terminus to the north edge past the Peace Park.
export const R1_HW = 9;
export const TRAM_U0 = 2016; // Ishibashi terminus: the tracks start here (on a boundary of the R1 pieces)
export function r1X(u) {
  if (u < 1100) return lerp(200, 166, smooth(960, 1100, u));
  if (u < 1880) return 166;
  if (u < 2000) return rightShore(u) + 12;
  if (u < 2540) return oura(u) + 12;
  if (u < 2660) return rightShore(u) + 12;
  if (u < 5120) return 162;
  return lerp(162, 206, smooth(5120, 5200, u));
}
export const R1 = [];
for (let u = 960; u <= 5200; u += 8) R1.push([r1X(u), u]);

export const MEGAMI_U = 1390; // Megami Ōhashi's deck, edge to edge
// East-west streets, edge to edge (x = -14..194), crossing R1. kind: car | walk (no cars).
export const STREETS = [
  { u: MEGAMI_U, hw: 6, kind: 'car', bridge: true },
  { u: 2990, hw: 5, kind: 'car' }, // along the embankment, over the Nakashima mouth
  { u: 3330, hw: 6, kind: 'walk' }, // Shinchi's cross street, west and east gates
  { u: 3660, hw: 5, kind: 'car' },
  { u: 3880, hw: 5, kind: 'walk' }, // the street over Meganebashi
  { u: 4060, hw: 5, kind: 'car' },
  { u: 4268, hw: 5, kind: 'car' }, // in front of Suwa's stairway
  { u: 4652, hw: 5, kind: 'car' },
  { u: 4778, hw: 5, kind: 'car' }, // between the hypocentre and the Peace Park
  { u: 5112, hw: 6, kind: 'car' },
  { u: 5458, hw: 5, kind: 'car' }, // the north shore road at the foot of Inasa
];
// Shinchi's main street, south gate to north gate, from the Omotemon bridge to the 3660 street.
export const CHINA_X = 92;
// B: from the 5112 street over the harbour bridge to the Fuchi Shrine roundabout.
export const B_X = 71;
export const FUCHI = { x: 71, u: 5598, r: 11 };
// The Inasa driveway: switchbacks from the roundabout to the summit car park.
export const DRIVE_HW = 4;
export const DRIVE = [
  [71, 5609], [64, 5660], [36, 5714], [22, 5770], [30, 5822], [70, 5850], [128, 5872], [158, 5912],
  [162, 5962], [140, 6008], [92, 6036], [44, 6070], [22, 6120], [28, 6174], [66, 6206], [124, 6232],
  [156, 6276], [158, 6330], [134, 6380], [98, 6420], [68, 6466], [56, 6520], [60, 6560],
];
export const PARK = { x0: 30, x1: 96, u0: 6560, u1: 6600 }; // the summit car park
// The Inasa Ropeway: Fuchi-jinja station to the summit station.
export const ROPE = { lower: [116, 5650], upper: [82, 6612], towers: [0.36, 0.71] };
export const OBS = { x: 112, u: 6668 }; // the round summit observatory

/** Polyline helpers: total length and the point at distance s (x, u, heading in radians). */
export function polyLen(pts) {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return s;
}
/** Offset a polyline sideways (positive = to the left of the direction of travel). */
export function offset(pts, d) {
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const du = b[1] - a[1];
    const n = Math.hypot(dx, du) || 1;
    return [p[0] - (du / n) * d, p[1] + (dx / n) * d];
  });
}
