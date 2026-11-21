// The map of Japan shown between stages: one projection shared by the art generator (tools/art/japan.mjs)
// and the game (src/game/JapanMap.js). Lon/lat in degrees; the picture is 180 x 420 and is shown centred,
// so everything that matters sits in the middle 320 rows. Okinawa is drawn in an inset box (bottom right).
export const MAP = { w: 180, h: 420, lon0: 129.0, lat0: 45.6, sx: 10, sy: 12, ox: 5, oy: 92 };
export const INSET = { x: 120, y: 230, w: 54, h: 40, lon0: 126.55, lat0: 27.0, sx: 28, sy: 36 };

/** Pixel position on the map picture; places west of 129°E (Okinawa) land in the inset. */
export function project(lon, lat) {
  if (lon < MAP.lon0) return [INSET.x + (lon - INSET.lon0) * INSET.sx, INSET.y + (INSET.lat0 - lat) * INSET.sy];
  return [MAP.ox + (lon - MAP.lon0) * MAP.sx, MAP.oy + (MAP.lat0 - lat) * MAP.sy];
}

// The regions the map zooms to (docs/plan-mapa.md), north to south. box: what must be in view even with one city
// (map units); at: where the region's name goes when the whole of Japan is in view. A new city goes into its
// region's list.
export const REGIONS = [
  { id: 'hokkaido', name: 'HOKKAIDŌ', stages: ['stage3'], box: [112, 92, 172, 146], at: [150, 136] },
  { id: 'kanto', name: 'KANTŌ', stages: ['stage9'], box: [103, 205, 121, 226], at: [127, 216] },
  { id: 'chubu', name: 'CHŪBU', stages: ['stage10'], box: [90, 204, 110, 224], at: [94, 196] },
  { id: 'kansai', name: 'KANSAI', stages: ['stage1', 'stage5'], box: [62, 213, 80, 229], at: [66, 206] },
  { id: 'chugoku', name: 'CHŪGOKU', stages: ['stage11', 'stage7'], box: [34, 217, 56, 233], at: [38, 212] },
  { id: 'kyushu', name: 'KIUSIU', stages: ['stage12', 'stage6', 'stage8', 'stage4'], box: [8, 231, 36, 264], at: [36, 268] },
  { id: 'okinawa', name: 'OKINAWA', stages: ['stage2'], box: [119, 229, 175, 271], at: [147, 277] },
];
/** The region a stage's city is in. */
export const regionOf = (id) => REGIONS.find((r) => r.stages.includes(id));

// The map drawn again, finer (tools/art/japan.mjs), laid over the whole map as the camera closes in: box in map units,
// S fine pixels to a unit (the whole map has 3), fade the zooms between which it comes in. japan_mid is all of Japan
// without the whole map's ornaments (the junks, the clouds, the compass, Fuji's picture, Okinawa's frame), for the
// zooms where the whole map would be blurred and for Hokkaidō; the west and the centre are one to one with the
// screen in their regions' views (z 6: 18 fine pixels to a unit). The inset is Okinawa's chart in its frame, on
// its own: close up it shows only when the camera is on it (MapCamera), not when Kantō's view brushes its corner.
export const TILES = [
  { key: 'japan_mid', box: [0, 34, 180, 352], S: 8, fade: [1.25, 1.8] },
  { key: 'japan_west', box: [2, 185, 68, 293], S: 18, fade: [3.2, 4.4] },
  { key: 'japan_centre', box: [50, 175, 135, 262], S: 18, fade: [3.2, 4.4] },
  { key: 'japan_inset', box: [INSET.x - 2, INSET.y - 2, INSET.x + INSET.w + 2, INSET.y + INSET.h + 2], S: 10, fade: [1.25, 1.8], inset: true },
];
