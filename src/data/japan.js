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

// The map drawn again, finer, where the cities are (tools/art/japan.mjs): shown over the whole map when the camera
// is close. box in map units, S fine pixels to a unit (the whole map has 3).
export const TILES = [
  { key: 'japan_west', box: [0, 204, 70, 290], S: 13 },
  { key: 'japan_centre', box: [50, 186, 132, 248], S: 15 },
  { key: 'japan_north', box: [104, 86, 178, 152], S: 7 },
  { key: 'japan_okinawa', box: [114, 222, 180, 278], S: 8 },
];
