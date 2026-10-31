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
