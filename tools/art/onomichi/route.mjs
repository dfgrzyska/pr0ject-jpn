// Onomichi (stage 11, docs/plan-onomichi.md): the route as data. Everything that draws a part of the strip reads its
// measures from here, so that the roads, the railway, the sea, the steps and the plots the landmarks stand on line
// up whoever draws them. Coordinates: x across the strip (0..180), u up it from the bottom (0..L), in the game's
// 180-px units. Pure data and its arithmetic: no imports, so the tests can read it (tools/tests/onomichiRoute.test.mjs).
//
// The flight turns with the map. Over the islands it heads north: Innoshima (the sea lords' castle on its hill,
// hassaku orchards, a boatyard, a fishing harbour), the suspension bridge over Innoshima's strait, Mukaishima (a
// shipyard's dry dock, citrus terraces, the village, Iwashiyama, its harbour and ferry). The twin bridges cross the
// Onomichi strait; past them the flight heads west along the town: the strait bends to run up the left edge
// (Mukaishima's shore at the very edge), the coast road and the town beside it, the railway at the foot of the
// hillside, and up the hillside the temples, steps and houses (Jodo-ji, the old temples, Tennei-ji's pagoda, Senko-ji
// and its park, the ropeway); the arcade of Hondori; the water widening before the station for the boss's arena.
export const W = 180;
export const S = 3; // fine pixels per logical one
export const CHUNK = 896; // (the height of the pieces the game loads)
export const CHUNKS = 8;
export const L = CHUNK * CHUNKS; // 7168

// [from u, to u, id, name, ground colour]: the ground is what is left between everything else
export const SECTIONS = [
  [0, 700, 'innoshima', 'INNOSHIMA', 0x8a8466],
  [700, 1500, 'ohashi', 'INNOSHIMA-OHASHI', 0x8a8466],
  [1500, 2300, 'mukaishima', 'MUKAISHIMA', 0x86825e],
  [2300, 2900, 'suido', 'ONOMICHI-SUIDO', 0x8c887a],
  [2900, 3800, 'jodoji', 'JODOJI', 0x8c887a],
  [3800, 5100, 'senkoji', 'SENKOJI', 0x86827a],
  [5100, 6200, 'hondori', 'HONDORI', 0x84807a],
  [6200, L, 'eki', 'ONOMICHI', 0x84807a],
];

// where the fights are: [x, u, name, radius]. Nothing tall may stand inside (the tests check the plots).
// The first holds the scroll ("hold" in the stage file) over the roofs below Senko-ji; the second is over the water
// before the station, where the strip ends.
export const ARENAS = [
  [90, 4300, 'NEKOMATA', 62],
  [62, 7072, 'FUNA-YUREI', 58], // (where the ship lies once the town has stopped: onomichi-funayurei.js HOME)
];

// The time of day along the strip (props.mjs, todGrade): [u, [mul r, g, b], tint, tint amount, gamma].
// A bright summer afternoon on the islands, the golden hour on the bridges, the sun going down at Jodo-ji, dusk on
// Senko-ji's hillside, night over Hondori and the station.
export const TOD = [
  [0, [1.0, 1.0, 0.98], 0xfff0d0, 0.03],
  [1500, [1.02, 0.98, 0.92], 0xffd8a0, 0.05],
  [2300, [1.04, 0.94, 0.82], 0xffb060, 0.08],
  [2900, [1.04, 0.88, 0.74], 0xff8848, 0.11],
  [3800, [0.98, 0.84, 0.8], 0xd07a60, 0.13],
  [4600, [0.84, 0.76, 0.84], 0x7a5a80, 0.13, 1.04],
  [5100, [0.56, 0.54, 0.78], 0x22224e, 0.13, 1.14],
  [6200, [0.48, 0.48, 0.72], 0x18143c, 0.12, 1.2],
  [L, [0.48, 0.48, 0.72], 0x18143c, 0.12, 1.2],
];

// ---- the sea. Innoshima's strait across the strip; the Onomichi strait across it at the bridges, then up the left
// edge between Mukaishima's shore and the town's, widening before the station. Open: cut out of the strip, the far
// layer's water shows through.
const wave = (v, a, b, c, d) => a * Math.sin(v / b) + c * Math.sin(v / d + 1);
export const STRAIT = { south: (x) => 820 + wave(x, 18, 23, 8, 9), north: (x) => 1380 + wave(x, 16, 29, 7, 11) };
export const SUIDO = { south: (x) => 2380 + wave(x, 12, 27, 6, 8), north: (x) => 2700 + wave(x, 10, 33, 5, 7) };
/** How far the water before the station has widened at a height u (0..1). */
export const widen = (u) => Math.min(1, Math.max(0, (u - 6400) / 300));
/** The Onomichi strait's two shores past the bend: [Mukaishima's x, the town's x] at a height u. */
export function suidoShores(u) {
  const t = widen(u);
  const west = 10 + wave(u, 3, 41, 2, 13);
  const east = 58 + wave(u, 3, 57, 1, 17) + t * 70;
  return [west * (1 - t), east];
}
/** Whether the point (x, u) is open sea. */
export function isSea(x, u) {
  if (u >= STRAIT.south(x) && u < STRAIT.north(x)) return true;
  if (u >= SUIDO.south(x) && u < SUIDO.north(x)) return true;
  if (u >= 2670) {
    const [w, e] = suidoShores(u);
    return x >= w && x < e;
  }
  return false;
}

// ---- shapes: { rect: [x, u, w, h] } | { ell: [cx, cu, rx, ru] } | { poly: [[x, u], ...] } |
//      { chain: [[x, u, half width], ...] } (a ribbon) | { ring: [x, u, w, h, thickness] }  (tools/art/tokyo/geom.mjs)

// The railway along the foot of the hillside: in from the right (from the east, past the bridges), at the foot of
// the hill all the way, swinging out round the widening water into the station, out at the top (to the west).
// Tracks: { id, tracks, pts, style }; style mono: a citrus orchard's monorail (one rail on posts, its cart);
// rope: the ropeway up Senkoji-yama (two cables, the gondolas hung on them).
const SANYO = [[180, 2830], [140, 2842], [106, 2880], [100, 2930], [100, 4900], [112, 5060], [112, 6250], [150, 6560], [156, 6800], [156, L]];
export const RAILS = [
  { id: 'sanyo', tracks: 2, pts: SANYO },
  { id: 'monorail_i', tracks: 1, style: 'mono', pts: [[150, 170], [150, 390]] },
  { id: 'monorail_m', tracks: 1, style: 'mono', pts: [[150, 1470], [150, 1750]] },
  { id: 'senkoji_ropeway', tracks: 1, style: 'rope', pts: [[112, 4426], [166, 4762]] },
];
/** The railway's x at a height u (past the bend). */
export function railX(u) {
  for (let i = 3; i + 1 < SANYO.length; i++) {
    const [[x0, u0], [x1, u1]] = [SANYO[i], SANYO[i + 1]];
    if (u >= u0 && u <= u1) return x0 + ((x1 - x0) * (u - u0)) / (u1 - u0);
  }
  return u < SANYO[3][1] ? SANYO[3][0] : SANYO.at(-1)[0];
}

// The coast road along the town: on the quay all the way, following the water as it widens, into the station square
const COAST = [[70, 2760], [70, 6400]];
for (let u = 6450; u <= 6700; u += 50) COAST.push([70 + 70 * widen(u), u]);
COAST.push([140, 6770]);

// Water painted on the strip (not open): a garden pond at Jodo-ji
export const WATER = [
  { id: 'jodoji_ike', ell: [160, 3356, 8, 5] },
];

// Ground of a kind of its own: [kind, shape]. Kinds: park (lawn and trees), forest (pine, camphor, mixed wood),
// gravel (temple grounds), plaza (a square, a quay), sand (a schoolyard), orchard (citrus on terraces: hassaku,
// lemon, mikan in rows), yard (a shipyard's concrete), slope (the hillside: terraces stepping up, walls and steps).
// Drawn in this order; `over` ones after the sea (land put out over the water: a quay, pontoons).
const SLOPE = [...SANYO.slice(2).map(([x, u]) => [x + 7, u]).filter(([, u]) => u >= 2880 && u <= 7000), [161, L], [180, L], [180, 2860]];
export const GROUNDS = [
  // Innoshima: the castle's hill, the orchards, the harbour
  { id: 'shiro_yama', kind: 'forest', rect: [0, 330, 70, 220] },
  { id: 'hassaku_en', kind: 'orchard', rect: [116, 160, 64, 240] },
  { id: 'innoshima_ko', kind: 'plaza', rect: [126, 730, 54, 44] },
  { id: 'ponton_i', kind: 'plaza', over: true, rect: [146, 832, 10, 6] },
  // Mukaishima: the shipyard, the citrus terraces, the schoolyard, Iwashiyama, the harbour
  { id: 'zosensho', kind: 'yard', rect: [0, 1420, 84, 230] },
  { id: 'mikan_en', kind: 'orchard', rect: [114, 1460, 66, 300] },
  { id: 'kotei', kind: 'sand', rect: [10, 1782, 40, 36] },
  { id: 'iwashiyama', kind: 'forest', rect: [36, 2040, 64, 170] },
  { id: 'mukai_ko', kind: 'plaza', rect: [36, 2318, 70, 40] },
  { id: 'ponton_m', kind: 'plaza', over: true, rect: [76, 2392, 8, 6] },
  { id: 'ponton_o', kind: 'plaza', over: true, rect: [76, 2692, 8, 6] },
  // the town past the bend: the hillside, the temples' grounds and woods, Senko-ji's park, the quay of Sumiyoshi,
  // the station square
  { id: 'saka', kind: 'slope', poly: SLOPE },
  { id: 'jodoji_keidai', kind: 'gravel', rect: [112, 3300, 62, 70] },
  { id: 'jodoji_yama', kind: 'forest', rect: [110, 3380, 70, 250] },
  { id: 'senkoji_keidai', kind: 'gravel', rect: [124, 4560, 56, 64] },
  { id: 'senkoji_mori', kind: 'forest', rect: [118, 4624, 62, 76] },
  { id: 'senkoji_koen', kind: 'park', rect: [124, 4700, 56, 180] },
  { id: 'sumiyoshi_hato', kind: 'plaza', over: true, rect: [28, 5660, 36, 150] },
  { id: 'ekimae', kind: 'plaza', rect: [134, 6750, 15, 130] },
];

// Roads: { id, cls, w (width), pts }. Classes: express (the Shimanami expressway, raised on piers: what it crosses
// passes under it), avenue and street (asphalt, pavements, a centre line), lane (a back street), cycle (the cycle
// route, its blue line), walk (a way for people: steps, temple paths, the path of literature), arcade (Hondori under
// its roof), deck (a pier), bridge (over the water on its piers or cables). An end must be on the strip's edge, on
// another road, or at a plot or a ground (the tests check).
export const ROADS = [
  // the Shimanami expressway, from the bottom edge over both bridges and off to the right (north) past the second
  { id: 'shimanami_s', cls: 'express', w: 10, pts: [[104, 0], [104, 790]] },
  { id: 'innoshima_ohashi', cls: 'bridge', w: 10, pts: [[104, 790], [104, 1410]] },
  { id: 'shimanami_m', cls: 'express', w: 10, pts: [[104, 1410], [104, 1800], [122, 2000], [146, 2200], [146, 2352]] },
  { id: 'shin_onomichi_ohashi', cls: 'bridge', w: 10, pts: [[146, 2352], [146, 2712]] },
  { id: 'shimanami_n', cls: 'express', w: 10, pts: [[146, 2712], [158, 2748], [180, 2766]] },
  // the cycle route: up Innoshima to the bridge's lower deck (it rides under the road), on Mukaishima to the ferry
  { id: 'cycle_i', cls: 'cycle', w: 4, pts: [[64, 0], [64, 600], [80, 650], [92, 710], [100, 790]] },
  { id: 'cycle_m', cls: 'cycle', w: 4, pts: [[100, 1412], [92, 1460], [86, 1560], [86, 1720]] },
  { id: 'cycle_m2', cls: 'cycle', w: 4, pts: [[86, 1720], [86, 1980]] },
  { id: 'cycle_m3', cls: 'cycle', w: 4, pts: [[86, 1980], [86, 2318]] },
  // Innoshima's streets
  { id: 'innoshima_kaigan', cls: 'street', w: 7, pts: [[0, 712], [180, 712]] },
  { id: 'innoshima_1', cls: 'street', w: 7, pts: [[0, 300], [180, 300]] },
  { id: 'innoshima_2', cls: 'lane', w: 4, pts: [[0, 150], [180, 150]] },
  { id: 'shiro_michi', cls: 'lane', w: 4, pts: [[56, 712], [56, 590], [40, 586]] },
  { id: 'shiro_kaidan', cls: 'walk', w: 3, pts: [[32, 560], [32, 466]] },
  { id: 'hassaku_michi', cls: 'lane', w: 4, pts: [[150, 300], [150, 388]] },
  { id: 'sanbashi_i', cls: 'deck', w: 3, pts: [[151, 770], [151, 834]] },
  // Mukaishima's streets: the old road to the first bridge, the village streets, the way up Iwashiyama
  { id: 'kokudo_317', cls: 'street', w: 8, pts: [[0, 2240], [120, 2270], [132, 2300], [132, 2352]] },
  { id: 'onomichi_ohashi', cls: 'bridge', w: 8, pts: [[132, 2352], [132, 2712]] },
  { id: 'mukai_dori', cls: 'street', w: 7, pts: [[0, 1720], [180, 1720]] },
  { id: 'mukai_2', cls: 'lane', w: 4, pts: [[0, 1980], [180, 1980]] },
  { id: 'zosen_michi', cls: 'lane', w: 4, pts: [[60, 1646], [60, 1720]] },
  { id: 'iwashiyama_michi', cls: 'walk', w: 3, pts: [[68, 1980], [68, 2040]] },
  { id: 'mikan_michi', cls: 'lane', w: 4, pts: [[150, 1720], [150, 1748]] },
  { id: 'minato_michi', cls: 'lane', w: 4, pts: [[60, 2318], [60, 2257]] },
  { id: 'sanbashi_m', cls: 'deck', w: 3, pts: [[80, 2350], [80, 2394]] },
  // Onomichi past the bend: the old road off the first bridge onto the coast road; the coast road; the pier of the
  // Mukaishima ferry at Ozaki
  { id: 'kokudo_2', cls: 'street', w: 8, pts: [[132, 2712], [112, 2738], [74, 2760]] },
  { id: 'kaigan_dori', cls: 'street', w: 8, pts: COAST },
  { id: 'sanbashi_o', cls: 'deck', w: 3, pts: [[80, 2696], [80, 2752]] },
  // the steps and paths up the hillside (each crosses the railway at its foot)
  { id: 'kairyuji_kaidan', cls: 'walk', w: 2, pts: [[70, 3060], [120, 3070], [140, 3120], [150, 3166]] },
  { id: 'jodoji_sando', cls: 'walk', w: 4, pts: [[70, 3330], [112, 3330]] },
  { id: 'saigoji_kaidan', cls: 'walk', w: 2, pts: [[70, 3690], [124, 3700], [130, 3712]] },
  { id: 'daisanji_kaidan', cls: 'walk', w: 2, pts: [[70, 3830], [114, 3830]] },
  { id: 'fukuzenji_kaidan', cls: 'walk', w: 2, pts: [[70, 3930], [120, 3936], [138, 3930]] },
  { id: 'komyoji_kaidan', cls: 'walk', w: 2, pts: [[120, 3936], [140, 3990], [158, 4038]] },
  { id: 'tennei_kaidan', cls: 'walk', w: 2, pts: [[70, 4120], [116, 4124], [128, 4150], [128, 4180]] },
  { id: 'neko_no_hosomichi', cls: 'walk', w: 2, pts: [[116, 4124], [140, 4206], [134, 4290], [152, 4380], [150, 4560]] },
  { id: 'senkoji_sando', cls: 'walk', w: 3, pts: [[70, 4466], [110, 4466], [118, 4444]] },
  { id: 'senkoji_kaidan', cls: 'walk', w: 3, pts: [[118, 4444], [124, 4500], [132, 4560]] },
  { id: 'bungaku_no_komichi', cls: 'walk', w: 2, pts: [[152, 4624], [164, 4664], [156, 4700]] },
  { id: 'saka_1', cls: 'walk', w: 2, pts: [[86, 5300], [118, 5306], [146, 5350], [150, 5400]] },
  { id: 'saka_2', cls: 'walk', w: 2, pts: [[86, 5600], [118, 5604], [130, 5620]] },
  { id: 'saka_3', cls: 'walk', w: 2, pts: [[86, 5780], [118, 5782], [150, 5800]] },
  { id: 'saka_4', cls: 'walk', w: 2, pts: [[86, 5980], [118, 5984], [134, 6000]] },
  { id: 'saka_5', cls: 'walk', w: 2, pts: [[134, 6020], [150, 6100], [156, 6150]] },
  { id: 'saikokuji_sando', cls: 'walk', w: 3, pts: [[159, 6930], [170, 6960], [170, 7010]] },
  // Hondori: the arcade between the coast road and the railway, its ways out to the road
  { id: 'hondori', cls: 'arcade', w: 8, pts: [[86, 5100], [86, 6250]] },
  { id: 'hondori_minami', cls: 'lane', w: 4, pts: [[70, 5100], [86, 5100]] },
  { id: 'hondori_naka', cls: 'lane', w: 4, pts: [[70, 5520], [86, 5520]] },
  { id: 'hondori_kita', cls: 'lane', w: 4, pts: [[70, 6250], [86, 6250]] },
];

// The ferries over the water, each from a pier's end to a pier's end (or off the left edge, to Mukaishima): the
// Mukaishima ferry across at Ozaki, three crossing to the town past the bend
const ferry = (id, u) => ({ id, pts: [[Math.ceil(suidoShores(u)[0]) + 3, u], [Math.floor(suidoShores(u)[1]) - 2, u]] });
export const FERRIES = [
  { id: 'mukai_watashi', pts: [[80, 2396], [80, 2694]] },
  ferry('watashi_1', 5300),
  ferry('watashi_2', 5950),
  ferry('watashi_3', 6480),
];
// (their piers: on Mukaishima's side out from the left edge, on the town's out from the coast road)
for (const f of FERRIES.slice(1)) {
  const [[x0, u], [x1]] = f.pts;
  ROADS.push({ id: `sanbashi_${f.id}_m`, cls: 'deck', w: 3, pts: [[0, u], [x0, u]] });
  ROADS.push({ id: `sanbashi_${f.id}`, cls: 'deck', w: 3, pts: [[x1, u], [70 + 70 * widen(u), u]] });
}

// Plots for the landmarks: [id, x, u, w, h, what stands there, low]. low: lies flat or stands low (a pier's shed, a
// well, a stall): may stand in an arena. Every plot gets its own drawing.
export const PLOTS = [
  // Innoshima
  ['monorail_i_shita', 142, 160, 16, 10, 'stacyjka kolejki wózków do sadu: platforma, skrzynki', 'low'],
  ['monorail_i_ue', 142, 390, 18, 12, 'szopa na hassaku na górze sadu: skrzynki, waga, wózek', 'low'],
  ['suigun_jo', 12, 430, 40, 36, 'zamek morskich władców (odtworzony): wieża, mur, palisada, flagi z własnym znakiem'],
  ['suigun_kan', 14, 560, 36, 24, 'muzeum z łodziami kobaya i sekibune na brzegu'],
  ['innoshima_zosen', 0, 600, 44, 60, 'mała stocznia: pochylnia z kadłubem łodzi, dźwig, blaszana hala'],
  ['gyoko_ichiba', 130, 740, 26, 16, 'targ przystani rybackiej: skrzynki, sieci, wózki'],
  // Mukaishima
  ['dock', 6, 1430, 40, 200, 'suchy dok z kadłubem statku w budowie: stępka, rusztowania, spawacze, suwnica bramowa na szynach'],
  ['zosen_koba', 50, 1440, 30, 40, 'hala stoczni z blachy, sterty blach i rur'],
  ['monorail_m_shita', 142, 1460, 16, 10, 'stacyjka kolejki wózków do sadu cytryn', 'low'],
  ['monorail_m_ue', 142, 1750, 18, 12, 'szopa sadownika: skrzynki cytryn, wózek', 'low'],
  ['gakko', 10, 1736, 40, 40, 'szkoła z basenem na dachu sali'],
  ['mukai_ryokan', 150, 1800, 30, 30, 'ryokan rowerzystów z ogrodem'],
  ['mukai_shoten', 10, 1830, 40, 30, 'sklepiki wsi: warzywniak, sklep z rowerami (bez marki)'],
  ['iwashiyama_tenbo', 60, 2150, 24, 16, 'taras widokowy na szczycie Iwashiyamy', 'low'],
  ['takotsubo', 40, 2324, 18, 12, 'rzędy glinianych garnków na ośmiornice, suszące się sieci', 'low'],
  // Onomichi: Ozaki and Jodo-ji
  ['ozaki_sento', 78, 3000, 14, 20, 'łaźnia z kominem w Ozaki'],
  ['kairyuji', 140, 3166, 24, 18, 'świątynia Kairyū-ji nad Jōdo-ji'],
  ['jodoji_sanmon', 112, 3324, 10, 12, 'brama Jōdo-ji nad schodami', 'low'],
  ['jodoji_hondo', 124, 3330, 26, 26, 'główna sala Jōdo-ji pod wielkim dachem'],
  ['jodoji_tahoto', 152, 3306, 16, 16, 'dwupiętrowa pagoda tahōtō'],
  ['sake_gura', 78, 3500, 14, 24, 'stary skład sosu sojowego z białymi ścianami'],
  ['saigoji', 130, 3712, 24, 20, 'świątynia Saigō-ji z wielką salą'],
  ['daisanji', 114, 3820, 20, 18, 'świątynia Daisan-ji'],
  ['fukuzenji', 138, 3920, 22, 20, 'świątynia Fukuzen-ji z bramą z rzeźbionym smokiem'],
  ['komyoji', 152, 4038, 22, 18, 'świątynia Kōmyō-ji'],
  // Senko-ji's hillside
  ['tenneiji_to', 122, 4180, 14, 14, 'trzypiętrowa pagoda Tennei-ji nad dachami'],
  ['tenneiji', 142, 4176, 20, 16, 'świątynia Tennei-ji'],
  ['ropeway_sanroku', 104, 4418, 16, 14, 'dolna stacja kolejki linowej'],
  ['senkoji_hondo', 130, 4590, 24, 18, 'czerwona sala Senkō-ji na skale'],
  ['tamanoiwa', 158, 4596, 10, 10, 'skała Tamanoiwa z klejnotem na szczycie (świeci o zmierzchu)'],
  ['kagami_iwa', 170, 4570, 8, 8, 'skała-lustro', 'low'],
  ['shoro', 126, 4564, 10, 10, 'dzwonnica Senkō-ji'],
  ['ropeway_sancho', 158, 4756, 20, 14, 'górna stacja kolejki linowej'],
  ['tenbodai', 128, 4820, 30, 14, 'taras widokowy w parku na szczycie'],
  // Hondori: along the arcade, up the hillside behind it, the quay of Sumiyoshi
  ['ramen_1', 92, 5150, 13, 16, 'bar z ramenem z Onomichi, kolejka przed wejściem'],
  ['sento_h', 92, 5380, 13, 20, 'stara łaźnia przerobiona na sklep z pamiątkami'],
  ['hodoji', 140, 5400, 24, 18, 'świątynia Hōdo-ji'],
  ['kafe_saka', 126, 5620, 22, 16, 'kawiarnia w odnowionym starym domu na stoku'],
  ['kissa', 92, 5640, 13, 14, 'kawiarnia retro z witryną woskowych deserów'],
  ['sumiyoshi_jinja', 32, 5700, 22, 20, 'chram Sumiyoshi na nabrzeżu'],
  ['yatai_matsuri', 32, 5730, 24, 12, 'stragany festiwalu: lampiony, para', 'low'],
  ['kenbutsu', 32, 5770, 26, 12, 'widzowie na nabrzeżu w yukatach, na matach', 'low'],
  ['jizo_do', 150, 5800, 10, 10, 'kapliczka jizō na podeście schodów', 'low'],
  ['ramen_2', 92, 5820, 13, 16, 'drugi bar z ramenem, para z kuchni'],
  ['kominka_yado', 130, 6000, 26, 20, 'stary dom kupiecki przerobiony na pensjonat'],
  ['tenbo_saka', 150, 6150, 24, 12, 'murek widokowy na końcu schodów, ławka, koty', 'low'],
  ['soko', 77, 6270, 30, 40, 'magazyny portowe z cegły i blachy; jeden to hotel i kawiarnia dla rowerzystów (bez nazwy)'],
  // the station and its water
  ['onomichi_eki', 136, 6880, 24, 50, 'dworzec Onomichi: perony pod daszkami, budynek z drewna'],
  ['basu_noriba', 136, 6800, 12, 12, 'przystanek autobusów na placu', 'low'],
  ['saikokuji', 163, 7010, 17, 30, 'brama Niōmon świątyni Saikoku-ji z wielkimi słomianymi sandałami'],
  ['hanabi_dai_1', 14, 6905, 14, 6, 'barka z rurami do fajerwerków', 'low'], // (below the ship: the shells go up over it)
  ['hanabi_dai_2', 96, 6905, 14, 6, 'barka z rurami do fajerwerków', 'low'],
];
