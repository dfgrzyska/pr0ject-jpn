// The map of the Kagoshima strip: the coast round Kinkō Bay, Sakurajima's shore, the river, the roads. One source for
// the painters and for the kit's water. u = distance from the bottom of the strip (stage start).
import { fbm } from '../../lib/raster.mjs';

export const W = 180;
export const L = 7168;

export const CITY = [0, 1300];
export const RIVER = [1300, 1345];
export const SENGAN = [1345, 2200];
export const COAST = [2200, 2850];
export const BAY = [2850, 4250];
export const ISLAND = [4250, 5400];
export const LAVA = [5400, 6560];
export const CRATER = { x: 90, u: 7088, rx: 66, ry: 46 };
export const VENTS = [[40, 7050], [140, 7050]];

export const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** The sea lies east of seaX on the mainland; past the head of the bay it swings off to the west. */
export const seaX = (u) => {
  if (u < SENGAN[0]) return 999;
  const n = (fbm(u, 5, { seed: 91, scale: 30, octaves: 2 }) - 0.5) * 10;
  if (u < BAY[0]) return 172 - smooth(SENGAN[0], BAY[0], u) * 60 + n;
  return 112 - smooth(BAY[0], BAY[0] + 110, u) * 140 + n;
};
/** Sakurajima's south shore. */
export const shoreU = (x) => ISLAND[0] + 18 + 22 * Math.sin(x / 26 + 1) + (fbm(x, 3, { seed: 92, scale: 12 }) - 0.5) * 16;
/** The black beach of the sand baths pushes out into the sea past the coast road. */
export const sandBeach = (u) => 26 * smooth(2230, 2270, u) * (1 - smooth(2386, 2426, u));

export const landD = (x, u) => {
  let d = seaX(u) + sandBeach(u) - x;
  if (u > BAY[0] + 900) d = Math.max(d, u - shoreU(x));
  return d;
};
/** Shinjima, "New Island", thrown up by the 1779 eruption: a low green islet out in the bay. */
export const SHINJIMA = { x: 146, u: 3850, rx: 26, ry: 38 };
export const onShinjima = (x, u) => ((x - SHINJIMA.x) / SHINJIMA.rx) ** 2 + ((u - SHINJIMA.u) / SHINJIMA.ry) ** 2 + (fbm(x, u, { seed: 93, scale: 12, octaves: 2 }) - 0.5) * 0.5 < 1;
export function isWater(x, u) {
  if (u >= RIVER[0] + 3 && u <= RIVER[1] - 3) return true;
  if (u > 3780 && u < 3920 && x > 110 && onShinjima(x, u)) return false;
  return u < L && landD(x, u) <= 0;
}

// ------------------------------------------------------------ roads
export const STREETS = [120, 250, 450, 600, 850, 1100, 1166];
export const STREET_HW = 5;
export const COLUMNS = [{ x: 30, hw: 5 }, { x: 90, hw: 10 }, { x: 150, hw: 5 }];
export const VIADUCT = [425, 437];
export const DEPOT = { x0: 56, x1: 141, u0: 1174, u1: RIVER[0] - 3 };
export const ARCADE = { x0: 54, x1: 66, u0: 610, u1: 1090 };

/** The coast road north of the river: off the right-hand bridge, then keeping to the shore. */
export const coastX = (u) => {
  const coast = seaX(u) - 14;
  return u < 1400 ? 150 + (coast - 150) * smooth(SENGAN[0], 1400, u) : coast;
};
export const TUNNEL = 1392; // the railway comes out from under Shiroyama here
/** The Nippō line keeps 9 inland of the coast road. */
export const railX = (u) => coastX(u) - 9;

/** Sakurajima's road: up from the port through the village, then winding up over the 1914 lava. */
export const LAVA_ROAD = [5440, 5600];
export const lavaRoadX = (u) => {
  const wind = 70 + 40 * Math.sin((u - LAVA[0]) / 170);
  return u < LAVA_ROAD[1] ? 150 + (wind - 150) * smooth(LAVA_ROAD[0], LAVA_ROAD[1], u) : wind;
};
export const ROAD_END = 6104; // the Yunohira observatory: no road goes on to the crater
