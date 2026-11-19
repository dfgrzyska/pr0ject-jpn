// Fukuoka (stage 12, docs/plan-fukuoka.md): the route as data. Everything that draws a part of the strip reads its
// measures from here, so that the roads, the railways, the rivers, the paths and the plots the landmarks stand on
// line up whoever draws them. Coordinates: x across the strip (0..180), u up it from the bottom (0..L), in the
// game's 180-px units. Pure data and its arithmetic: no imports, so the tests can read it
// (tools/tests/fukuokaRoute.test.mjs).
//
// A whole day, from night to sunset, and the flight turns with the map. Off Hakata Bay at night it heads south over
// Momochi (the beach, the tower, the dome, the old stone wall in the pines), Ohori's pond with its islands and the
// castle's ruins, Tenjin; it turns east over the Naka river and then south up it, along Nakasu between the Naka and
// the Hakata rivers (the food stalls on the bank: the miniboss's arena); at dawn the canal of Sumiyoshi, Gion's
// temples, Hakata station and its tracks, the Mikasa river and the airport with its runway; at noon the mountains of
// Sasaguri and Nanzo-in's reclining Buddha; in the afternoon Dazaifu: the approach, the pond and its bridges,
// Tenmangu among its plum trees, the museum on its hill, Kanzeon-ji; at sunset the field of the old government's
// ruins under the Mizuki earthwork, where the boss rises.
export const W = 180;
export const S = 3; // fine pixels per logical one
export const CHUNK = 896; // (the height of the pieces the game loads)
export const CHUNKS = 8;
export const L = CHUNK * CHUNKS; // 7168

// [from u, to u, id, name, ground colour]: the ground is what is left between everything else
export const SECTIONS = [
  [0, 800, 'momochi', 'MOMOCHI', 0x86847c],
  [800, 1500, 'ohori', 'OHORI', 0x84827a],
  [1500, 2000, 'tenjin', 'TENJIN', 0x8a8780],
  [2000, 3000, 'nakasu', 'NAKASU', 0x8a8780],
  [3000, 3800, 'hakata', 'HAKATA', 0x8c8a82],
  [3800, 4400, 'eki', 'HAKATA-EKI', 0x8a887e],
  [4400, 5200, 'sasaguri', 'SASAGURI', 0x6e7458],
  [5200, 6500, 'dazaifu', 'DAZAIFU', 0x8a8670],
  [6500, L, 'mizuki', 'MIZUKI', 0x7e8660],
];

// where the fights are: [x, u, name, radius]. Nothing tall may stand inside (the tests check the plots).
// The first holds the scroll ("hold" in the stage file) over the food stalls on Nakasu's bank of the Naka; the second
// is the field of the old government's ruins, the Mizuki earthwork across its top, where the strip ends.
export const ARENAS = [
  [76, 2700, 'YATAI-OBAKE', 48],
  [90, 7072, 'NURIKABE', 62],
];

// The time of day along the strip (props.mjs, todGrade): [u, [mul r, g, b], tint, tint amount, gamma].
// Night over the bay and the town, the sky paling over Nakasu's end, a pink dawn at Sumiyoshi, a clear morning at
// the station and the airport, noon in Sasaguri, a warm afternoon in Dazaifu, the golden hour by Kanzeon-ji and the
// sun going down over the ruins and the earthwork.
export const TOD = [
  [0, [0.48, 0.48, 0.72], 0x18143c, 0.12, 1.2],
  [2400, [0.5, 0.5, 0.74], 0x1a163e, 0.12, 1.18],
  [2900, [0.62, 0.6, 0.8], 0x30305a, 0.12, 1.1],
  [3250, [0.92, 0.8, 0.84], 0xf0a080, 0.1],
  [3650, [1.0, 0.96, 0.92], 0xffe0c0, 0.05],
  [4400, [1.0, 1.0, 0.98], 0xfff4e0, 0.03],
  [5600, [1.02, 0.98, 0.92], 0xffd8a0, 0.05],
  [6200, [1.04, 0.93, 0.8], 0xffb060, 0.08],
  [6700, [1.04, 0.86, 0.72], 0xff8848, 0.11],
  [L, [0.98, 0.8, 0.74], 0xe07050, 0.13],
];

// ---- the water open to the far layer: Hakata Bay at the bottom, the rivers (the Naka across the strip below
// Nakasu and then up it, the Hakata along Nakasu's other side joining it at both ends, the Mikasa by the airport).
const wave = (v, a, b, c, d) => a * Math.sin(v / b) + c * Math.sin(v / d + 1);
/** The bay's shore (the beach's foot) at x. */
export const bayShore = (x) => 300 + wave(x, 8, 31, 4, 11);
// rivers as centre lines with a half width
export const RIVERS = [
  { id: 'naka_kako', half: 13, pts: [[-10, 1950], [60, 1958], [120, 1968], [190, 1980]] }, // (its mouth: across, below Nakasu)
  { id: 'naka_gawa', half: 13, pts: [[36, 1955], [36, 2950], [34, 3200], [18, 3280], [-10, 3296]] },
  { id: 'hakata_gawa', half: 7, pts: [[121, 1966], [121, 2860], [104, 2920], [70, 2944], [36, 2950]] },
  { id: 'mikasa_gawa', half: 6, pts: [[-10, 3950], [70, 3958], [190, 3970]] },
];
/** Distance from (x, u) to a polyline. */
export function dist(pts, x, u) {
  let best = Infinity;
  for (let i = 0; i + 1 < pts.length; i++) {
    const [[ax, au], [bx, bu]] = [pts[i], pts[i + 1]];
    const [dx, du] = [bx - ax, bu - au];
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (u - au) * du) / (dx * dx + du * du || 1)));
    best = Math.min(best, Math.hypot(x - ax - t * dx, u - au - t * du));
  }
  return best;
}
/** Whether the point (x, u) is open water (the bay or a river). */
export function isSea(x, u) {
  if (u < bayShore(x)) return true;
  if (u < 1900 || (u > 3320 && u < 3930) || u > 3990) return false;
  return RIVERS.some((r) => dist(r.pts, x, u) <= r.half);
}

// ---- shapes: { rect: [x, u, w, h] } | { ell: [cx, cu, rx, ru] } | { poly: [[x, u], ...] } |
//      { chain: [[x, u, half width], ...] } (a ribbon) | { ring: [x, u, w, h, thickness] }  (tools/art/tokyo/geom.mjs)

// Railways: { id, tracks, pts, style }. At Hakata station the main line's tracks and the shinkansen's on its viaduct
// run across the strip; Sasaguri's line along its valley; Dazaifu's branch line in from the left to its terminus.
export const RAILS = [
  { id: 'kagoshima_honsen', tracks: 6, pts: [[0, 3852], [180, 3852]] },
  { id: 'shinkansen', tracks: 2, style: 'viaduct', pts: [[0, 3878], [180, 3878]] },
  { id: 'sasaguri_sen', tracks: 1, pts: [[0, 4452], [180, 4470]] },
  { id: 'dazaifu_sen', tracks: 1, pts: [[0, 5212], [58, 5222]] },
];

// Water painted on the strip (not open): Ohori's pond, the castle's moat, the canal in Sumiyoshi, a stream in
// Sasaguri, Shinji-ike before Tenmangu, the moat before the Mizuki earthwork, a garden's pond
export const WATER = [
  { id: 'ohori_ike', ell: [80, 1140, 40, 182] },
  { id: 'hori', rect: [127, 930, 5, 490] },
  { id: 'tatara_gawa', chain: [[0, 4570, 2.5], [44, 4610, 2.5], [84, 4650, 3], [132, 4700, 3], [150, 4800, 3], [146, 4950, 3], [164, 5100, 3], [180, 5140, 2.5]] },
  { id: 'shinji_ike', ell: [92, 5630, 44, 24] },
  { id: 'mizuki_hori', rect: [0, 7104, 180, 22] },
  { id: 'teien_ike', ell: [30, 1356, 10, 7] },
];

// Ground of a kind of its own: [kind, shape]. Kinds: beach (sand), park (lawn and trees), forest (pines, camphors,
// cedars, bamboo), gravel (temple and shrine grounds), plaza (a square), stone (the castle's walls and terraces),
// apron (an airport's concrete), runway, field (rice paddies after winter, rape in flower on the bunds), ume (a plum
// garden), ruins (the ruins' lawn), dorui (the earthwork's grassy bank). Drawn in this order; `over` ones after the
// water (islands in the pond, a pier's deck out over the bay).
export const GROUNDS = [
  // Momochi: the beach, the seaside park, the pines along the old shore
  { id: 'hama', kind: 'beach', poly: [[0, 280], [180, 280], [180, 336], [0, 336]] },
  { id: 'kaihin_koen', kind: 'park', rect: [0, 336, 180, 50] },
  { id: 'matsubara', kind: 'forest', rect: [128, 400, 52, 120] },
  { id: 'marizon', kind: 'plaza', over: true, rect: [52, 262, 22, 22] },
  // Ohori: the park round the pond, its islands, the castle's terraces and the plum garden in them
  { id: 'ohori_koen', kind: 'park', ell: [80, 1140, 48, 192] },
  { id: 'shima_1', kind: 'park', over: true, ell: [80, 1060, 9, 15] },
  { id: 'shima_2', kind: 'park', over: true, ell: [80, 1150, 12, 20] },
  { id: 'shima_3', kind: 'park', over: true, ell: [80, 1236, 8, 13] },
  { id: 'jo', kind: 'stone', rect: [134, 930, 46, 490] },
  { id: 'umeen_maizuru', kind: 'ume', rect: [140, 1250, 40, 64] },
  // Tenjin: the central park
  { id: 'tenjin_koen', kind: 'park', rect: [118, 1562, 62, 40] },
  // Nakasu and Gion: Kushida's grounds
  { id: 'kushida_keidai', kind: 'gravel', rect: [130, 2504, 30, 80] },
  // Hakata: the shrines' and temples' grounds, the station square
  { id: 'sumiyoshi_mori', kind: 'forest', rect: [54, 3236, 42, 104] },
  { id: 'tochoji_keidai', kind: 'gravel', rect: [132, 3030, 48, 50] },
  { id: 'shofukuji_keidai', kind: 'forest', rect: [132, 3120, 48, 80] },
  { id: 'ekimae', kind: 'plaza', rect: [66, 3792, 76, 32] },
  // the airport
  { id: 'kuko_apron', kind: 'apron', rect: [40, 3996, 66, 396] },
  { id: 'kassoro', kind: 'runway', rect: [118, 3996, 16, 396] },
  { id: 'kuko_shiba', kind: 'park', rect: [134, 3996, 46, 396] },
  // Sasaguri: the wooded mountains, fields in the valley, Nanzo-in's terrace
  { id: 'yama_w', kind: 'forest', rect: [0, 4640, 46, 560] },
  { id: 'yama_e', kind: 'forest', rect: [128, 4560, 52, 640] },
  { id: 'yama_n', kind: 'forest', rect: [46, 4880, 82, 320] },
  { id: 'tanbo_s1', kind: 'field', rect: [84, 4486, 92, 70] },
  { id: 'tanbo_s2', kind: 'field', rect: [0, 4486, 56, 120] },
  { id: 'nanzoin_keidai', kind: 'gravel', rect: [50, 4760, 76, 100] },
  // Dazaifu: the approach's square, Tenmangu's grounds, the plum gardens, the museum's hill, the fields
  { id: 'dazaifu_ekimae', kind: 'plaza', rect: [76, 5212, 34, 22] },
  { id: 'tenmangu_keidai', kind: 'gravel', rect: [56, 5658, 72, 72] },
  { id: 'umeen_w', kind: 'ume', rect: [0, 5590, 50, 320] },
  { id: 'umeen_e', kind: 'ume', rect: [140, 5590, 40, 130] },
  { id: 'umeen_n', kind: 'ume', rect: [54, 5732, 70, 160] },
  { id: 'hakubutsukan_yama', kind: 'forest', rect: [128, 5880, 52, 290] },
  { id: 'tanbo_d', kind: 'field', rect: [0, 6040, 120, 170] },
  { id: 'kanzeonji_keidai', kind: 'gravel', rect: [30, 6240, 80, 60] },
  // the ruins and the earthwork, Ono-yama's foot beyond
  { id: 'tofuro', kind: 'ruins', rect: [0, 6640, 180, 400] },
  { id: 'dorui', kind: 'dorui', rect: [0, 7040, 180, 64] },
  { id: 'ono_yama', kind: 'forest', rect: [110, 7126, 70, 42] },
  { id: 'tanbo_m', kind: 'field', rect: [0, 7126, 110, 42] },
];

// Roads: { id, cls, w (width), pts }. Classes: express (the city expressway, raised on piers: what it crosses passes
// under it), avenue and street (asphalt, pavements, a centre line), lane (a back street), walk (a way for people: a
// promenade, a temple's path, the approach to a shrine, a bridge in a garden), arcade (a covered shopping street),
// deck (a pier), bridge (over a river on its piers), taxi (an airport's taxiway). An end must be on the strip's edge,
// on another road, or at a plot or a ground (the tests check).
const RING = []; // Ohori's path round the pond
for (let k = 0; k <= 32; k++) {
  const a = -Math.PI / 2 + (k / 32) * Math.PI * 2;
  RING.push([Math.round((80 + Math.cos(a) * 45) * 10) / 10, Math.round((1140 + Math.sin(a) * 186) * 10) / 10]);
}
export const ROADS = [
  // Momochi: the expressway along the coast on its piers, the avenue behind the park, the streets to Ohori
  { id: 'toshi_kosoku', cls: 'express', w: 10, pts: [[0, 560], [180, 560]] },
  { id: 'yokatopia_dori', cls: 'avenue', w: 10, pts: [[0, 600], [180, 600]] },
  { id: 'kaihin_dori', cls: 'street', w: 7, pts: [[0, 392], [180, 392]] },
  { id: 'tower_dori', cls: 'street', w: 7, pts: [[100, 392], [100, 920]] },
  { id: 'momochi_2', cls: 'lane', w: 4, pts: [[0, 700], [180, 700]] },
  { id: 'kaihin_sanpo', cls: 'walk', w: 3, pts: [[0, 340], [180, 340]] },
  { id: 'marizon_hashi', cls: 'deck', w: 3, pts: [[63, 282], [63, 340]] },
  // Ohori: the avenue below the park, the path round the pond and across its islands, the castle's paths
  { id: 'ohori_dori', cls: 'avenue', w: 10, pts: [[0, 920], [180, 920]] },
  { id: 'ohori_iriguchi', cls: 'walk', w: 3, pts: [[80, 920], [80, 954]] },
  { id: 'ohori_ring', cls: 'walk', w: 3, pts: RING },
  { id: 'ohori_watari', cls: 'walk', w: 3, pts: [[80, 954], [80, 1326]] },
  { id: 'jo_michi', cls: 'walk', w: 3, pts: [[125, 1140], [158, 1140], [158, 1148]] },
  { id: 'jo_kaidan', cls: 'walk', w: 2, pts: [[158, 1140], [158, 1060], [150, 1040]] },
  { id: 'jo_mon', cls: 'walk', w: 3, pts: [[150, 920], [150, 1000]] },
  // Tenjin: Meiji-dori and Showa-dori across, Watanabe-dori up to the bridge into Nakasu, the back streets
  { id: 'meiji_dori', cls: 'avenue', w: 10, pts: [[0, 1460], [180, 1460]] },
  { id: 'showa_dori', cls: 'avenue', w: 10, pts: [[0, 1880], [180, 1880]] },
  { id: 'watanabe_dori', cls: 'avenue', w: 10, pts: [[84, 1460], [84, 1928]] },
  { id: 'tenjin_1', cls: 'street', w: 7, pts: [[0, 1660], [180, 1660]] },
  { id: 'tenjin_2', cls: 'lane', w: 4, pts: [[40, 1460], [40, 1880]] },
  { id: 'tenjin_3', cls: 'lane', w: 4, pts: [[140, 1600], [140, 1880]] },
  { id: 'tenjin_4', cls: 'lane', w: 4, pts: [[0, 1770], [180, 1770]] },
  { id: 'kawazoi_t', cls: 'walk', w: 3, pts: [[0, 1932], [180, 1950]] },
  // the bridges over the Naka's mouth: into Nakasu, onto the west bank, onto Gion's side
  { id: 'nakasu_ohashi', cls: 'bridge', w: 10, pts: [[84, 1928], [84, 2002]] },
  { id: 'deai_bashi', cls: 'bridge', w: 4, pts: [[62, 1938], [62, 1996]] },
  { id: 'nishi_bashi', cls: 'bridge', w: 6, pts: [[10, 1933], [10, 1990]] },
  { id: 'higashi_bashi', cls: 'bridge', w: 7, pts: [[170, 1948], [170, 2012]] },
  // Nakasu: the riverside walk (the stalls stand on it), its streets, the bridges over both rivers
  { id: 'nakasu_kawabata', cls: 'walk', w: 4, pts: [[62, 1996], [52, 2004], [52, 2905]] },
  { id: 'nakasu_kawabata_e', cls: 'walk', w: 3, pts: [[84, 2004], [110, 2012], [110, 2860], [96, 2900], [96, 2905]] },
  { id: 'nakasu_dori', cls: 'street', w: 7, pts: [[84, 2002], [84, 2905]] },
  { id: 'nakasu_1', cls: 'lane', w: 4, pts: [[52, 2150], [110, 2150]] },
  { id: 'nakasu_2', cls: 'lane', w: 4, pts: [[52, 2350], [110, 2350]] },
  { id: 'nakasu_3', cls: 'lane', w: 4, pts: [[52, 2550], [110, 2550]] },
  { id: 'nakasu_4', cls: 'lane', w: 4, pts: [[52, 2830], [110, 2830]] },
  { id: 'nakasu_5', cls: 'lane', w: 4, pts: [[52, 2905], [96, 2905]] },
  { id: 'haruyoshi_bashi', cls: 'bridge', w: 7, pts: [[14, 2350], [52, 2350]] },
  { id: 'nishi_nakashima_bashi', cls: 'bridge', w: 7, pts: [[14, 2830], [52, 2830]] },
  { id: 'kawabata_bashi', cls: 'bridge', w: 6, pts: [[108, 2150], [134, 2150]] },
  { id: 'gion_bashi', cls: 'bridge', w: 6, pts: [[108, 2550], [134, 2550]] },
  { id: 'haruyoshi_dori', cls: 'lane', w: 4, pts: [[10, 1990], [10, 2990]] },
  { id: 'kawabata_arcade', cls: 'arcade', w: 7, pts: [[154, 2150], [154, 2496]] },
  { id: 'gion_dori', cls: 'street', w: 7, pts: [[170, 2012], [170, 2990]] },
  { id: 'gion_1', cls: 'lane', w: 4, pts: [[134, 2150], [170, 2150]] },
  { id: 'gion_5', cls: 'lane', w: 4, pts: [[154, 2496], [170, 2496]] },
  // Sumiyoshi and Gion at dawn: Kokutai-dori over the Naka, the avenue to the station, the old streets
  { id: 'sumiyoshi_bashi', cls: 'bridge', w: 8, pts: [[14, 2990], [56, 2990]] },
  { id: 'kokutai_dori', cls: 'avenue', w: 9, pts: [[56, 2990], [180, 2990]] },
  { id: 'ekimae_dori', cls: 'avenue', w: 10, pts: [[106, 2990], [106, 3792]] },
  { id: 'hakata_1', cls: 'street', w: 7, pts: [[50, 3420], [180, 3420]] },
  { id: 'hakata_2', cls: 'lane', w: 4, pts: [[126, 2990], [126, 3792]] },
  { id: 'hakata_3', cls: 'lane', w: 4, pts: [[50, 3600], [180, 3600]] },
  { id: 'hakata_4', cls: 'lane', w: 4, pts: [[0, 3340], [50, 3340], [50, 3600]] },
  { id: 'gion_4', cls: 'lane', w: 4, pts: [[126, 3220], [180, 3220]] },
  { id: 'sumiyoshi_sando', cls: 'walk', w: 3, pts: [[94, 3290], [106, 3290]] },
  // the airport: the road off the left edge over the Mikasa to the terminal; the taxiways along the runway
  { id: 'kuko_dori', cls: 'avenue', w: 9, pts: [[0, 3922], [24, 3922], [24, 3936]] },
  { id: 'mikasa_bashi', cls: 'bridge', w: 9, pts: [[24, 3936], [24, 3974]] },
  { id: 'kuko_dori_2', cls: 'avenue', w: 9, pts: [[24, 3974], [24, 4130], [40, 4130]] },
  { id: 'yudo_ro', cls: 'taxi', w: 6, pts: [[108, 4010], [108, 4380]] },
  { id: 'yudo_1', cls: 'taxi', w: 5, pts: [[108, 4010], [118, 4010]] },
  { id: 'yudo_2', cls: 'taxi', w: 5, pts: [[108, 4200], [118, 4200]] },
  { id: 'yudo_3', cls: 'taxi', w: 5, pts: [[108, 4380], [118, 4380]] },
  // Sasaguri: the valley road to Nanzo-in, the pilgrims' path between its little temples
  { id: 'sasaguri_kaido', cls: 'street', w: 7, pts: [[0, 4420], [60, 4430], [70, 4470], [70, 4744]] },
  { id: 'sasaguri_2', cls: 'lane', w: 4, pts: [[70, 4560], [180, 4560]] },
  { id: 'henro_michi', cls: 'walk', w: 2, pts: [[70, 4620], [100, 4640], [116, 4690], [124, 4740], [124, 4800]] },
  { id: 'henro_michi_2', cls: 'walk', w: 2, pts: [[50, 4800], [36, 4860], [30, 4960], [44, 5060], [70, 5160], [90, 5200]] },
  { id: 'nanzoin_sando', cls: 'walk', w: 3, pts: [[70, 4744], [70, 4760]] },
  // Dazaifu: the approach from the station to the pond, the bridges over it, the paths, the old road
  { id: 'toge_michi', cls: 'lane', w: 4, pts: [[90, 5200], [92, 5212]] },
  { id: 'sando', cls: 'walk', w: 6, pts: [[92, 5232], [92, 5604]] },
  { id: 'shinji_bashi', cls: 'walk', w: 4, pts: [[92, 5600], [92, 5660]] },
  { id: 'koen_michi', cls: 'walk', w: 2, pts: [[92, 5420], [70, 5420], [52, 5440], [40, 5480]] },
  { id: 'niji_michi', cls: 'walk', w: 3, pts: [[118, 5716], [124, 5790], [148, 5850], [150, 5960]] },
  { id: 'dazaifu_kaido', cls: 'street', w: 7, pts: [[0, 5930], [128, 5930]] },
  { id: 'dazaifu_2', cls: 'lane', w: 4, pts: [[118, 6040], [118, 6230], [180, 6230]] },
  { id: 'kanzeonji_michi', cls: 'lane', w: 4, pts: [[0, 6230], [118, 6230]] },
  { id: 'tofuro_dori', cls: 'street', w: 7, pts: [[0, 6620], [180, 6620]] },
  { id: 'tofuro_michi', cls: 'walk', w: 3, pts: [[90, 6620], [90, 6896]] },
  { id: 'dorui_michi', cls: 'walk', w: 2, pts: [[0, 7036], [180, 7036]] },
  { id: 'kanzeonji_2', cls: 'lane', w: 4, pts: [[60, 6298], [60, 6620]] },
];

// Boats: the fishing boats putting out into the bay, the river cruises along Nakasu: each from a pier to a pier
// or off the strip's edge (into the bay)
export const FERRIES = [
  { id: 'gyosen_1', pts: [[63, 282], [20, 60], [-10, 0]] },
  { id: 'gyosen_2', pts: [[63, 282], [140, 80], [190, 20]] },
];

// Plots for the landmarks: [id, x, u, w, h, what stands there, low]. low: lies flat or stands low (a stall, a
// garden, foundation stones): may stand in an arena. Every plot gets its own drawing.
export const PLOTS = [
  // Momochi
  ['fukuoka_tower', 105, 404, 22, 100, 'wieża Fukuoka: trójkątna w przekroju, lustrzana, oświetlona nocą, u stóp plac (234 m: rysowana w górę taśmy)'],
  ['dome', 8, 410, 56, 50, 'kopuła stadionu (bez nazwy), parking dookoła'],
  ['hotel_kaihin', 68, 420, 20, 32, 'hotel nad morzem w kształcie statku (bez nazwy)'],
  ['borui', 136, 470, 40, 8, 'resztki kamiennego muru wzdłuż dawnego brzegu w sosnach', 'low'],
  ['hakubutsukan_m', 120, 620, 40, 36, 'muzeum miejskie z kolumnadą i placem z fontanną'],
  ['toshokan', 30, 620, 34, 30, 'biblioteka i archiwum'],
  // Ohori
  ['bijutsukan', 10, 980, 26, 30, 'muzeum sztuki w parku'],
  ['nihon_teien', 14, 1330, 32, 34, 'ogród japoński: staw, wodospad, herbaciarnia', 'low'],
  ['boat_house', 25, 1180, 10, 10, 'przystań łódek na stawie: łabędzie, łódki', 'low'],
  ['tamon_yagura', 142, 1010, 30, 8, 'wieżyczka tamon na murze zamku'],
  ['tenshudai', 148, 1150, 26, 22, 'kamienna podstawa nieistniejącej wieży zamku z tarasem widokowym'],
  ['otemon', 138, 1400, 12, 10, 'brama zamku w murze', 'low'],
  ['korokan', 136, 1060, 16, 24, 'ruiny dawnego domu gości (fundamenty pod dachem z blachy)', 'low'],
  // Tenjin
  ['acros', 94, 1606, 30, 40, 'budynek z ogrodem na tarasach schodzących do parku'],
  ['shiyakusho', 46, 1474, 30, 30, 'ratusz z placem'],
  ['kego_jinja', 10, 1680, 24, 24, 'chram Kego w środku miasta'],
  ['depato_1', 46, 1680, 32, 44, 'domy towarowe przy alei (bez nazw)'],
  ['depato_2', 92, 1680, 42, 44, 'wieżowce biurowe i dworzec autobusowy (bez nazw)'],
  ['yatai_tenjin', 96, 1784, 26, 10, 'jatai na chodniku przy alei: płachty, lampiony, stołki', 'low'],
  // Nakasu
  ['yatai_1', 56, 2030, 10, 9, 'jatai na nabrzeżu rzeki: lada, lampiony, para', 'low'],
  ['yatai_2', 56, 2080, 10, 9, 'jatai: oden i ramen, kolejka', 'low'],
  ['yatai_3', 56, 2200, 10, 9, 'jatai: yakitori, dym', 'low'],
  ['yatai_4', 56, 2260, 10, 9, 'jatai: tempura, stołki', 'low'],
  ['yatai_5', 56, 2400, 10, 9, 'jatai: gyoza, płyta', 'low'],
  ['yatai_6', 56, 2460, 10, 9, 'jatai: ramen, para', 'low'],
  ['yatai_7', 56, 2600, 10, 9, 'jatai: oden, lampion', 'low'],
  ['yatai_8', 56, 2660, 10, 9, 'jatai: ramen, kolejka', 'low'],
  ['yatai_9', 56, 2730, 10, 9, 'jatai: mentaiko z grilla', 'low'],
  ['hakataza', 132, 2040, 14, 40, 'teatr z dachem w dawnym stylu i chorągwiami (bez napisów)'],
  ['kushida_jinja', 132, 2512, 22, 28, 'chram Kushida: brama, sala, święte drzewo'],
  ['kazariyama', 146, 2552, 10, 16, 'wóz festiwalowy Yamakasa: wysoka dekorowana konstrukcja z lalkami'],
  // Sumiyoshi, Gion, the station
  ['kyanaru', 54, 3008, 40, 220, 'kanał między budynkami w łuku, kolorowe tarasy, fontanny (bez nazwy i szyldów)'],
  ['sumiyoshi_jinja', 64, 3270, 24, 22, 'chram Sumiyoshi w lesie'],
  ['tochoji', 136, 3036, 26, 30, 'Tōchō-ji: sala z wielkim drewnianym Buddą'],
  ['tochoji_to', 166, 3040, 12, 12, 'cynobrowa pięciopiętrowa pagoda Tōchō-ji'],
  ['shofukuji', 140, 3130, 30, 32, 'Shōfuku-ji: brama, kamienny mostek, sala, sosny'],
  ['machiya', 134, 3250, 34, 20, 'drewniane domy kupieckie Hakaty'],
  ['hakata_eki', 60, 3826, 90, 40, 'dworzec Hakata: perony pod dachami, budynek z placem'],
  // the airport
  ['kuko_terminal', 48, 4100, 34, 70, 'terminal z rękawami do samolotów'],
  ['kanseito', 86, 4300, 10, 10, 'wieża kontroli lotów'],
  ['kakunoko', 48, 4300, 34, 30, 'hangar'],
  // Sasaguri
  ['sasaguri_eki', 120, 4446, 22, 12, 'stacyjka linii lokalnej'],
  ['fudasho_1', 104, 4632, 8, 8, 'kapliczka pielgrzymów z czerwonymi czapeczkami posągów', 'low'],
  ['fudasho_2', 118, 4700, 8, 8, 'kapliczka pielgrzymów', 'low'],
  ['fudasho_3', 28, 4900, 8, 8, 'kapliczka pielgrzymów', 'low'],
  ['fudasho_4', 34, 5020, 8, 8, 'kapliczka pielgrzymów', 'low'],
  ['nanzoin_sanmon', 64, 4762, 12, 10, 'brama Nanzō-in', 'low'],
  ['nehanzo', 58, 4782, 60, 20, 'leżący Budda z brązu na boku, na kamiennym tarasie'],
  ['nanzoin_hondo', 62, 4818, 26, 18, 'sala główna Nanzō-in'],
  ['fudo_taki', 100, 4818, 18, 26, 'wodospad Fudō z posągami w skale'],
  ['ishibotoke', 92, 4766, 26, 10, 'rzędy małych kamiennych posągów', 'low'],
  // Dazaifu
  ['dazaifu_eki', 58, 5214, 18, 14, 'stacja Dazaifu, końcowa linii'],
  ['ichi_torii', 86, 5260, 12, 4, 'pierwsza kamienna brama torii nad aleją', 'low'],
  ['umegae_1', 98, 5300, 12, 10, 'sklepik z paleniskami umegae-mochi, kolejka', 'low'],
  ['umegae_2', 74, 5360, 12, 10, 'sklepik z umegae-mochi', 'low'],
  ['komyozenji', 22, 5470, 30, 30, 'Kōmyōzen-ji: suchy ogród z kamieni i mchu'],
  ['romon', 84, 5662, 16, 8, 'brama wieżowa Tenmangū'],
  ['honden', 74, 5680, 36, 26, 'główna sala Tenmangū (teren bez walki)'],
  ['tobiume', 112, 5694, 8, 8, 'stara śliwa tobiume przy sali', 'low'],
  ['kyokusui', 128, 5734, 30, 24, 'ogród krętego strumienia: uczta poetycka w strojach Heian', 'low'],
  ['hakubutsukan_k', 132, 5960, 44, 44, 'Muzeum Narodowe Kiusiu: falisty szklany dach na wzgórzu'],
  ['kanzeonji', 40, 6248, 30, 26, 'Kanzeon-ji: sala i dzwonnica z najstarszym dzwonem'],
  ['kaidanin', 80, 6252, 20, 18, 'Kaidan-in'],
  // the ruins under the earthwork
  ['tofuro_ishizue', 70, 6880, 40, 18, 'kamienie fundamentów dawnej głównej sali na trawie', 'low'],
  ['ishibumi', 40, 6856, 8, 8, 'kamienne słupy z napisami', 'low'],
  ['chumon', 82, 6720, 16, 8, 'kamienie bramy środkowej', 'low'],
];
