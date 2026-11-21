// The map of Japan shown between stages: one projection shared by the art generator (tools/art/japan.mjs)
// and the game (src/game/JapanMap.js). Lon/lat in degrees; the picture is 180 x 420 and is shown centred,
// so everything that matters sits in the middle 320 rows. Okinawa is drawn in an inset box (bottom right).
export const MAP = { w: 180, h: 420, lon0: 129.0, lat0: 45.6, sx: 10, sy: 12, ox: 5, oy: 92 };
export const INSET = { x: 120, y: 230, w: 54, h: 40, lon0: 126.55, lat0: 27.0, sx: 28, sy: 36 };

/** Whether a place is drawn in Okinawa's inset: south of 27.4°N and west of 128.6°E (not the Gotō, not Amami). */
export const inInset = (lon, lat) => lat < 27.4 && lon < 128.6;

/** Pixel position on the map picture; Okinawa and its islands land in the inset. */
export function project(lon, lat) {
  if (inInset(lon, lat)) return [INSET.x + (lon - INSET.lon0) * INSET.sx, INSET.y + (INSET.lat0 - lat) * INSET.sy];
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

// The landmarks on the map (docs/plan-mapa.md, iteration 5; drawn in tools/art/mapmarks.mjs): a miniature by each
// city of a stage, of what its stage and its stamp are about, and the famous places without a stage. at: the place
// itself [lon, lat]; off: where the miniature's foot stands from it, in screen units (beside the city's dot, not on
// it, clear of the ship standing on the dot). They are always the same size on the screen and come in as the camera closes in: each from the zoom at which
// it no longer covers one before it in the list (markZoom), the cities' first.
export const MARKS = [
  { key: 'kyoto', stage: 'stage1', at: [135.729, 35.039], off: [-9, -7] }, // Kinkaku-ji
  { key: 'osaka', stage: 'stage5', at: [135.526, 34.687], off: [-12, -8] }, // the castle
  { key: 'tokyo', stage: 'stage9', at: [139.745, 35.659], off: [-14, -8] }, // Tokyo Tower
  { key: 'sapporo', stage: 'stage3', at: [141.356, 43.061], off: [10, -7] }, // the TV tower
  { key: 'kawaguchiko', stage: 'stage10', at: [138.802, 35.501], off: [14, 4] }, // the Chūreitō pagoda
  { key: 'onomichi', stage: 'stage11', at: [133.2, 34.411], off: [15, 4] }, // Tennei-ji
  { key: 'hiroshima', stage: 'stage7', at: [132.32, 34.296], off: [-6, 8] }, // Itsukushima's torii
  { key: 'fukuoka', stage: 'stage12', at: [130.351, 33.593], off: [17, 3] }, // Fukuoka Tower
  { key: 'beppu', stage: 'stage6', at: [131.49, 33.28], off: [15, 4] }, // Umi Jigoku
  { key: 'kagoshima', stage: 'stage4', at: [130.657, 31.585], off: [5, -9] }, // Sakurajima
  { key: 'nagasaki', stage: 'stage8', at: [129.879, 32.743], off: [-15, 4] }, // Megane-bashi
  { key: 'okinawa', stage: 'stage2', at: [127.715, 26.217], off: [15, 4] }, // Shurei-mon
  { key: 'himeji', at: [134.694, 34.839], off: [0, 2] }, // the castle
  { key: 'ise', at: [136.725, 34.455], off: [0, 2] }, // the shrine
  { key: 'nikko', at: [139.6, 36.758], off: [0, 2] }, // Tōshō-gū
  { key: 'matsushima', at: [141.1, 38.37], off: [3, 3] }, // the islets
  { key: 'kanazawa', at: [136.662, 36.562], off: [0, 2] }, // Kenroku-en
];
/** A miniature's box round its foot, in screen units (what of its 14 x 16 frame is drawn). */
export const MARK_BOX = [-7, -14.4, 7, 1.2];

/** Where a landmark's foot is at zoom z, relative to the map point (0, 0) on the screen. */
const markAt = (m, z) => {
  const [x, y] = project(...m.at);
  return [x * z + m.off[0], y * z + m.off[1]];
};

/** The zoom from which each landmark shows (1.9 at the least): from there on it covers none of those before it. */
export const markZoom = (() => {
  const zs = [];
  const [bx0, by0, bx1, by1] = MARK_BOX;
  const overlap = (a, b, z) => {
    const [ax, ay] = markAt(a, z);
    const [bx, by] = markAt(b, z);
    return Math.abs(ax - bx) < bx1 - bx0 + 1 && Math.abs(ay - by) < by1 - by0 + 1;
  };
  MARKS.forEach((m, i) => {
    let from = 1.9;
    for (let j = 0; j < i; j++) for (let z = 8; z >= 1.9; z -= 0.05) if (overlap(m, MARKS[j], z)) { from = Math.max(from, z + 0.05); break; }
    zs.push(from);
  });
  return zs;
})();
