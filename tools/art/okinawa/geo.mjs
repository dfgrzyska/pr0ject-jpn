// The map of the Okinawa strip: coasts, islands, reefs and shallows, one logical cell at a time (the painters read them
// smoothly between cells), plus the roads. u = distance from the bottom of the strip (stage start).
import { fbm } from '../../lib/raster.mjs';

export const W = 180;
export const L = 7168;

export const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export const MAIN_S = 760; // south coast of the main island
export const MAIN_N = 4650; // north coast
export const ROAD_U = 1150; // the coast road
export const VILLAGE = [1350, 1760];
export const GANGALA = [1760, 2090]; // the Valley of Gangala: a collapsed cave, a gorge of forest under limestone walls
export const CAVE = [2090, 2560]; // Gyokusendō: the lit caverns under the ground, in at the valley's head, out at Naha
export const NAHA = [2560, 3200];
export const SHURI = [3200, 3850];
export const JUNGLE = [3850, 4650]; // (the coast's shape: the forest itself starts above the air base)
export const BASE = [3850, 4250]; // Kadena air base: two runways, shelters, the ramp
export const FOREST0 = BASE[1];

// [u, x, r, kind]: islands are unions of these discs. k = the Kerama islands off the start (white beaches, rocky points),
// l = the lighthouse island, o = Kōri island at the end of its bridge, s = the phantom sandbar, nothing but white sand
export const ISLETS = [
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
  [5952, 26, 5, 's'],
  [5958, 38, 7, 's'],
  [5964, 52, 8, 's'],
  [5966, 66, 6, 's'],
];
export const REEFS = [
  [120, 118, 22],
  [480, 28, 18],
  [660, 150, 16],
  [5250, 150, 20],
  [5600, 82, 26],
  [6620, 40, 18],
  [6760, 150, 22],
  [5958, 46, 30],
];
const SHALLOWS = { pts: [[90, 4640], [88, 4760], [94, 4880], [92, 5040]], w: 30 };

export const eastEdge = (u) => 240 - 120 * smooth(JUNGLE[0], JUNGLE[0] + 380, u);
export const KIND = { sea: 0, south: 1, cliff: 2, north: 3, kerama: 4, islet: 5, sand: 6 };

function coast(x, u) {
  let d = -999;
  let kind = KIND.sea;
  if (u > MAIN_S - 40 && u < MAIN_N + 40) {
    const n = (fbm(x, u, { seed: 81, scale: 24, octaves: 3 }) - 0.5) * 18;
    const south = u - MAIN_S + n;
    const north = MAIN_N - u + n;
    const east = eastEdge(u) - x + n * 0.7;
    d = Math.min(south, north, east);
    kind = d === south ? KIND.south : d === east ? KIND.cliff : KIND.north;
  }
  for (const [iu, ix, R, k] of ISLETS) {
    const far = R + 9 - Math.hypot(x - ix, u - iu);
    if (far < d - 4 || far < -80) continue;
    const dd = R - Math.hypot(x - ix, u - iu) + (fbm(x, u, { seed: 83, scale: 8, octaves: 2 }) - 0.5) * 6;
    if (dd > d) {
      d = dd;
      kind = k === 'k' ? KIND.kerama : k === 's' ? KIND.sand : KIND.islet;
    }
  }
  return { d, kind };
}
export const beachW = (kind) => (kind === KIND.south ? 30 : kind === KIND.cliff ? 5 : kind === KIND.kerama ? 6 : kind === KIND.sand ? 99 : 7);

function reefRaw(x, u) {
  let d = -999;
  for (const [ru, rx, R] of REEFS) {
    if (Math.hypot(x - rx, u - ru) > R + 10) continue;
    d = Math.max(d, R - Math.hypot(x - rx, u - ru) + (fbm(x, u, { seed: 85, scale: 10, octaves: 2 }) - 0.5) * 10);
  }
  return d;
}
function shallowRaw(x, u) {
  if (u < SHALLOWS.pts[0][1] - 40 || u > SHALLOWS.pts[SHALLOWS.pts.length - 1][1] + 40) return -999;
  let best = Infinity;
  for (let i = 0; i < SHALLOWS.pts.length - 1; i++) {
    const [ax, au] = SHALLOWS.pts[i];
    const [bx, bu] = SHALLOWS.pts[i + 1];
    const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (u - au) * (bu - au)) / ((bx - ax) ** 2 + (bu - au) ** 2)));
    best = Math.min(best, Math.hypot(x - (ax + (bx - ax) * t), u - (au + (bu - au) * t)));
  }
  return SHALLOWS.w - best + (fbm(x, u, { seed: 86, scale: 14, octaves: 2 }) - 0.5) * 18;
}

// the grids, built once, one value per corner of each logical cell
const GW = W + 2;
const GH = L + 2;
const DG = new Float32Array(GW * GH);
const SG = new Float32Array(GW * GH);
const RG = new Float32Array(GW * GH);
const KG = new Uint8Array(GW * GH);
for (let u = 0; u < GH; u++)
  for (let x = 0; x < GW; x++) {
    const i = u * GW + x;
    const { d, kind } = coast(x, u);
    DG[i] = d;
    KG[i] = kind;
    const reach = kind === KIND.cliff ? 12 : 26;
    const rd = reefRaw(x, u);
    RG[i] = rd;
    let s = Math.max(1 + d / reach, rd > 0 ? 0.42 + Math.min(rd, 14) / 34 : 0);
    if ((kind === KIND.kerama || kind === KIND.sand) && s > 0) s = Math.min(1, s * 1.12 + 0.05); // Kerama blue: clearer, brighter
    const sd = shallowRaw(x, u);
    if (sd > 0) s = Math.max(s, 0.5 + Math.min(sd, 16) / 40); // the emerald shallows under the Kōri bridge
    SG[i] = s;
  }
const bil = (G, x, u) => {
  const cx = Math.max(0, Math.min(GW - 1.001, x));
  const cu = Math.max(0, Math.min(GH - 1.001, u));
  const x0 = Math.floor(cx);
  const u0 = Math.floor(cu);
  const fx = cx - x0;
  const fu = cu - u0;
  const i = u0 * GW + x0;
  return G[i] * (1 - fx) * (1 - fu) + G[i + 1] * fx * (1 - fu) + G[i + GW] * (1 - fx) * fu + G[i + GW + 1] * fx * fu;
};
/** Signed distance to the coast (positive on land), lagoon strength, reef distance, smooth between cells. */
export const landD = (x, u) => bil(DG, x, u);
export const shallowS = (x, u) => bil(SG, x, u);
export const reefD = (x, u) => bil(RG, x, u);
export const kindAt = (x, u) => KG[Math.max(0, Math.min(GH - 1, Math.round(u))) * GW + Math.max(0, Math.min(GW - 1, Math.round(x)))];
export const isWater = (x, u) => landD(x, u) <= 0;
export const isLand = (x, u) => landD(x, u) > beachW(kindAt(x, u));

// ------------------------------------------------------------ roads
// (in from the west and along the air base's fence, Route 58, then winding up through the forest)
const forestRoadX = (u) => 90 + 22 * Math.sin((u - JUNGLE[0]) / 120) * (1 - smooth(4560, 4640, u));
export const ROUTE58_X = 7;
export const roadX = (u) => {
  const west = -14 + (ROUTE58_X + 14) * smooth(3800, 3880, u);
  const k = smooth(4250, 4305, u); // (past the runways' ends and the base's northern fence)
  return west * (1 - k) + forestRoadX(u) * k;
};
export const ROAD = [3800, 4640];
export const BRIDGE = [4628, 5032];
export const ISLAND_ROAD = [[91, BRIDGE[1]], [100, 5064], [112, 5092], [124, 5118], [130, 5132]];
export const KOKUSAI_RD = [76, 104];
