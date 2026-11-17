// Kawaguchiko (stage 10, docs/plan-kawaguchiko.md): the route as data. Everything that draws a part of the strip
// reads its measures from here, so that the roads, the railway, the lake, the trail and the plots the landmarks stand
// on line up whoever draws them. Coordinates: x across the strip (0..180), u up it from the bottom (0..L), in the
// game's 180-px units. Pure data: no imports, so the tests can read it (tools/tests/kawaguchikoRoute.test.mjs).
//
// The flight: Fujiyoshida (Fujisan station, Honcho-dori aimed at the mountain, the Chureito pagoda on its hill, the
// cedar avenue to the Sengen shrine) - Kawaguchiko station, the hotels on the shore, Mt Tenjo and its ropeway, Oishi
// park's lavender on the peninsula, the Ohashi bridge over the narrows - the lake with Unoshima (the miniboss's
// arena on open water) - the south shore's beach and camp, the lava forest with its caves - the toll road winding up
// through the thinning forest to the fifth station - the Yoshida trail zigzagging up the black then red scoria past
// the huts of the sixth to ninth stations, the descent road beside it - the summit: its torii, shrine and huts, the
// path round the crater, the weather station on the far rim; the sea of clouds where the ground falls away.
export const W = 180;
export const S = 3; // fine pixels per logical one
export const CHUNK = 896; // (the height of the pieces the game loads)
export const CHUNKS = 8;
export const L = CHUNK * CHUNKS; // 7168

// [from u, to u, id, name, ground colour]: the ground is what is left between everything else
export const SECTIONS = [
  [0, 1300, 'fujiyoshida', 'FUJIYOSHIDA', 0x8a8274],
  [1300, 2100, 'shore', 'OISHI', 0x7a7c64],
  [2100, 3900, 'lake', 'KAWAGUCHI-KO', 0x6c7c58],
  [3900, 4700, 'lava', 'FUNATSU', 0x3c5232], // (the lava forest is never named: docs/plan-kawaguchiko.md, rule 2)
  [4700, 5600, 'road', 'OKUNIWA', 0x4c5a3e],
  [5600, 6700, 'trail', 'YOSHIDA-GUCHI', 0x2e2a2c],
  [6700, L, 'summit', 'FUJI-SAN', 0x5a3426],
];

// where the fights are: [x, u, name, radius]. Nothing tall may stand inside (the tests check the plots).
// The first holds the scroll ("hold" in the stage file); the second is the crater, where the strip ends.
export const ARENAS = [
  [90, 3400, 'KACHI-KACHI USAGI', 62],
  [90, 6950, 'DAIDARABOTCHI', 62],
];

// the crater on the summit: its middle and radius (its rim walked round by the ohachi-meguri path)
export const CRATER = [90, 6950, 46];

// The time of day along the strip (props.mjs, todGrade): [u, [mul r, g, b], tint, tint amount, gamma].
// Afternoon in the town, the golden hour on the lake, sunset over the lava, dusk at the fifth station, night on the
// trail, the violet before dawn and the gold of sunrise on the summit.
export const TOD = [
  [0, [1.0, 0.98, 0.94], 0xffe0b0, 0.04],
  [1300, [1.02, 0.96, 0.88], 0xffc880, 0.06],
  [2400, [1.04, 0.92, 0.78], 0xffa050, 0.1],
  [3900, [1.0, 0.8, 0.7], 0xff7040, 0.14],
  [4700, [0.7, 0.66, 0.82], 0x5a4a80, 0.16],
  [5600, [0.64, 0.66, 0.84], 0x1e2a5a, 0.12, 1.1], // (a clear night under the moon: the mountain stays legible)
  [6400, [0.62, 0.64, 0.84], 0x1a2454, 0.12, 1.1],
  [6760, [0.72, 0.62, 0.8], 0x6a3a7a, 0.14, 1.05],
  [6920, [0.96, 0.82, 0.74], 0xffa060, 0.12],
  [L, [1.04, 0.94, 0.84], 0xffc070, 0.08],
];

// ---- shapes: { rect: [x, u, w, h] } | { ell: [cx, cu, rx, ru] } | { poly: [[x, u], ...] } |
//      { chain: [[x, u, half width], ...] } (a ribbon) | { ring: [x, u, w, h, thickness] }  (tools/art/tokyo/geom.mjs)

// Water. open: cut out of the strip, the far layer shows through (the lake; at the summit, the sea of clouds below
// where the ground falls away); otherwise painted (ponds). Its shore gets an edge of pebbles.
export const WATER = [
  { id: 'kawaguchiko', open: true, shore: true, poly: [
    [180, 2140], [150, 2128], [120, 2136], [96, 2150], [82, 2182], [77, 2262], [75, 2340], [66, 2392], [42, 2412], [18, 2404], [0, 2418],
    [0, 3862], [22, 3874], [52, 3860], [82, 3868], [112, 3882], [142, 3866], [166, 3872], [180, 3860],
  ] },
  { id: 'unkai_nishi', open: true, clouds: true, poly: [[0, 6890], [12, 6960], [8, 7070], [22, 7168], [0, 7168]] },
  { id: 'unkai_higashi', open: true, clouds: true, poly: [[180, 6900], [168, 6990], [174, 7090], [158, 7168], [180, 7168]] },
  { id: 'shrine_ike', ell: [18, 1240, 9, 6] }, // (a pond by the shrine's cedars)
];

// Ground of a kind of its own: [kind, shape]. Kinds: park (lawn and trees), forest (cedar, mixed wood), gravel
// (shrine grounds), plaza, sand, flowers (lavender), kochia (round shrubs in rows), lava (old flows, moss on them),
// treeline (sparse larch and shrubs bent by the wind), scoria (black), scoria_red, snow, crater. Drawn in this
// order; `over` ones after the water (the island, the piers' pontoons).
export const GROUNDS = [
  // Fujiyoshida
  { id: 'fujisan_ekimae', kind: 'plaza', rect: [56, 120, 30, 34] },
  { id: 'arakurayama', kind: 'forest', rect: [98, 720, 82, 300] },
  { id: 'churei_hiroba', kind: 'gravel', rect: [104, 872, 46, 40] },
  { id: 'sando_mae', kind: 'plaza', rect: [70, 996, 40, 20] },
  { id: 'sengen_mori', kind: 'forest', rect: [0, 1016, 180, 270] },
  { id: 'sengen_keidai', kind: 'gravel', rect: [56, 1150, 76, 110] },
  // the shore
  { id: 'kawaguchiko_ekimae', kind: 'plaza', rect: [20, 1340, 72, 38] },
  { id: 'tenjoyama', kind: 'forest', rect: [0, 1470, 64, 490] },
  { id: 'tenjo_sancho', kind: 'gravel', rect: [6, 1560, 46, 40] },
  { id: 'oishi_kochia', kind: 'kochia', rect: [0, 2024, 58, 76] },
  { id: 'oishi_koen', kind: 'flowers', rect: [0, 2100, 70, 300] },
  { id: 'marina', kind: 'plaza', rect: [84, 2104, 46, 18] },
  // the lake: Unoshima, the pontoons at the piers' ends, the south shore's beach and camp
  { id: 'unoshima', kind: 'forest', over: true, ell: [128, 3080, 13, 11] },
  { id: 'unoshima_hama', kind: 'sand', over: true, ell: [128, 3072, 15, 8] },
  { id: 'pontoon_1', kind: 'plaza', over: true, rect: [96, 2190, 10, 6] },
  { id: 'pontoon_2', kind: 'plaza', over: true, rect: [118, 2186, 10, 6] },
  { id: 'minami_hama', kind: 'sand', rect: [0, 3840, 180, 64] },
  // the lava forest, the camp in a clearing of it
  { id: 'jukai', kind: 'forest', rect: [0, 3930, 180, 780] },
  { id: 'camp', kind: 'park', rect: [96, 3936, 78, 64] },
  { id: 'yogan_1', kind: 'lava', ell: [40, 4180, 30, 70] },
  { id: 'yogan_2', kind: 'lava', ell: [148, 4380, 28, 60] },
  { id: 'yogan_3', kind: 'lava', poly: [[60, 4560], [110, 4520], [130, 4600], [90, 4660], [50, 4630]] },
  // up the mountain: the zones of height, then the fifth station's square
  { id: 'shinrin_gen', kind: 'treeline', rect: [0, 4980, 180, 520] },
  { id: 'gogome_hiroba', kind: 'plaza', rect: [26, 5470, 128, 112] },
  { id: 'kuroi_jari', kind: 'scoria', rect: [0, 5582, 180, 640] },
  { id: 'akai_jari', kind: 'scoria_red', rect: [0, 6222, 180, 946] },
  { id: 'yuki_1', kind: 'snow', poly: [[150, 6420], [156, 6400], [164, 6520], [160, 6640], [152, 6600]] },
  { id: 'yuki_2', kind: 'snow', poly: [[44, 6560], [50, 6540], [56, 6660], [52, 6760], [46, 6720]] },
  { id: 'yuki_3', kind: 'snow', poly: [[164, 6700], [170, 6690], [176, 6800], [170, 6860]] },
  { id: 'kakou', kind: 'crater', ell: [90, 6950, 46, 46] },
  { id: 'kakou_yuki', kind: 'snow', ell: [96, 6936, 12, 8] },
];

// Roads: { id, cls, w (width), pts }. Classes: avenue and street (asphalt, pavements, a centre line), lane (a back
// street), road (a mountain road: asphalt with a white edge line, no pavements), walk (a way for people: shrine
// avenues, park paths, the steps up to the pagoda), deck (a pier), bridge (a road over the water on its piers),
// trail (the climbers' way: packed scoria between stone walls and roped posts), descent (the way down: wide loose
// scoria, the supply bulldozer's track along it). An end must be on the strip's edge, on another road, or at a plot
// or a ground (the tests check).
export const ROADS = [
  // Fujiyoshida: Honcho-dori aimed straight at the mountain (its bronze torii, the kanadorii, spans it at u 820)
  { id: 'honcho_dori', cls: 'street', w: 10, pts: [[90, 0], [90, 996]] },
  { id: 'kokudo', cls: 'avenue', w: 10, pts: [[160, 0], [160, 2098]] },
  { id: 'yoshida_1', cls: 'street', w: 7, pts: [[0, 250], [180, 250]] },
  { id: 'yoshida_2', cls: 'lane', w: 4, pts: [[0, 480], [155, 480]] },
  { id: 'yoshida_3', cls: 'street', w: 7, pts: [[0, 700], [180, 700]] },
  { id: 'ekimae_dori', cls: 'lane', w: 4, pts: [[0, 136], [56, 136]] },
  { id: 'gekou_roji', cls: 'lane', w: 4, pts: [[90, 380], [155, 380]] },
  { id: 'churei_kaidan', cls: 'walk', w: 3, pts: [[127, 703], [127, 872]] }, // (the steps up to the pagoda)
  { id: 'sando', cls: 'walk', w: 6, pts: [[90, 1016], [90, 1150]] }, // (the cedar avenue)
  { id: 'sengen_michi', cls: 'lane', w: 4, pts: [[130, 1200], [155, 1200]] },
  // the shore
  { id: 'eki_dori', cls: 'street', w: 7, pts: [[90, 1360], [155, 1360]] },
  { id: 'onsen_dori', cls: 'street', w: 7, pts: [[60, 1480], [155, 1480]] },
  { id: 'kohan_dori', cls: 'street', w: 7, pts: [[0, 2004], [64, 2004], [82, 2050], [110, 2088], [160, 2096]] },
  { id: 'onsen_tate', cls: 'lane', w: 4, pts: [[100, 1480], [100, 2075]] },
  { id: 'onsen_yoko', cls: 'lane', w: 4, pts: [[60, 1700], [155, 1700]] },
  { id: 'hanto_dori', cls: 'street', w: 7, pts: [[72, 2030], [72, 2282]] }, // (up the peninsula to the bridge)
  { id: 'ohashi', cls: 'bridge', w: 8, pts: [[72, 2282], [180, 2282]] },
  { id: 'oishi_michi', cls: 'walk', w: 3, pts: [[10, 2004], [10, 2380], [60, 2380], [60, 2282]] },
  { id: 'sanbashi_1', cls: 'deck', w: 3, pts: [[101, 2121], [101, 2190]] },
  { id: 'sanbashi_2', cls: 'deck', w: 3, pts: [[123, 2121], [123, 2186]] },
  // the south shore and the lava forest
  { id: 'kohan_minami', cls: 'street', w: 7, pts: [[0, 3918], [180, 3918]] },
  { id: 'hyoketsu_michi', cls: 'walk', w: 3, pts: [[142, 3922], [142, 4110]] },
  { id: 'fuketsu_michi', cls: 'walk', w: 3, pts: [[30, 3922], [30, 4040]] },
  { id: 'tainai_michi', cls: 'walk', w: 3, pts: [[72, 3922], [72, 4060]] },
  // the toll road winding up to the fifth station
  { id: 'yuryo_doro', cls: 'road', w: 7, pts: [[88, 3922], [88, 4380], [150, 4460], [150, 4560], [40, 4640], [40, 4760], [150, 4860], [150, 4960], [40, 5060], [40, 5160], [140, 5260], [140, 5360], [104, 5430], [96, 5470]] },
  // the Yoshida trail, the descent beside it, the path round the crater
  { id: 'yoshida_trail', cls: 'trail', w: 3, pts: [
    [104, 5580], [104, 5640], [138, 5700], [138, 5760], [110, 5810], [62, 5850], [130, 5900], [62, 5950], [130, 6000], [70, 6050], [130, 6100], [70, 6150],
    [130, 6200], [78, 6250], [130, 6300], [78, 6350], [130, 6400], [86, 6450], [130, 6500], [92, 6560], [122, 6620], [96, 6680], [114, 6740], [102, 6800], [110, 6860],
  ] },
  { id: 'gesan_doro', cls: 'descent', w: 6, pts: [
    [62, 5850], [22, 5900], [32, 5980], [10, 6040], [32, 6100], [8, 6160], [32, 6220], [8, 6280], [34, 6340], [8, 6400], [34, 6460], [8, 6520], [34, 6580],
    [8, 6640], [34, 6700], [12, 6760], [32, 6820], [76, 6872],
  ] },
  { id: 'chojo_michi', cls: 'walk', w: 3, pts: [[111, 6866], [104, 6898]] }, // (from the torii to the rim)
  { id: 'ohachi_meguri', cls: 'walk', w: 3, pts: Array.from({ length: 33 }, (_, i) => {
    const a = Math.atan2(-52, 14) + (i / 32) * Math.PI * 2; // (round from where the path from the torii meets it)
    return [Math.round((90 + Math.cos(a) * 54) * 10) / 10, Math.round((6950 + Math.sin(a) * 54) * 10) / 10];
  }) },
];

// Tracks: { id, tracks, pts, style }. The local line from Fujisan station to Kawaguchiko (one track, its passing
// loops at the stations); the ropeway up Mt Tenjo (style rope: two cables, the gondolas hung on them).
export const RAILS = [
  { id: 'fujikyu', tracks: 1, pts: [[0, 40], [26, 120], [36, 300], [42, 560], [40, 760], [36, 1000], [40, 1240], [46, 1384]] },
  { id: 'tenjo_ropeway', tracks: 1, style: 'rope', pts: [[110, 1986], [30, 1580]] },
];

// Plots for the landmarks: [id, x, u, w, h, what stands there, low]. low: lies flat or stands low (a statue, a well,
// a torii over a path): may stand in an arena. Every plot gets its own drawing in phases 2-5.
export const PLOTS = [
  // Fujiyoshida
  ['fujisan_eki', 14, 150, 44, 40, 'stacja Fujisan: budynek z dachem jak góra, peron z mijanką'],
  ['udon_ya_1', 96, 270, 30, 30, 'jadłodajnia z udonem z Yoshidy: noren, ławka, para z kuchni'],
  ['sento', 50, 280, 34, 34, 'stara łaźnia z kominem'],
  ['shoten_1', 96, 400, 34, 34, 'sklepiki z lat 50.: blaszane szyldy bez napisów'],
  ['shoten_2', 52, 400, 32, 32, 'tkalnia jedwabiu (miasto słynie z tkanin): suszące się beli'],
  ['shoten_3', 96, 500, 30, 40, 'kawiarnia retro z markizą'],
  ['shoten_4', 46, 500, 38, 40, 'sklep z sake i beczkami przed wejściem'],
  ['shoten_5', 96, 590, 30, 50, 'kamieniczki ze sklepami, Fuji na końcu ulicy'],
  ['shoten_6', 46, 590, 38, 50, 'stary bank z kamienną fasadą'],
  ['shimoyoshida_eki', 22, 740, 34, 36, 'stacja Shimoyoshida z mijanką'],
  ['churei_to', 114, 880, 22, 26, 'pięciopiętrowa pagoda Chūreitō'],
  ['arakura_jinja', 138, 760, 16, 20, 'chram Arakurayama Sengen u stóp schodów'],
  ['tenbodai', 106, 940, 40, 20, 'taras widokowy nad pagodą', 'low'],
  ['ootorii', 76, 1040, 28, 10, 'wielka drewniana torii nad aleją', 'low'],
  ['honden', 64, 1196, 52, 44, 'chram Kitaguchi Hongū Fuji Sengen: pawilon w czerwieni i złocie'],
  ['kagura_den', 118, 1160, 14, 16, 'pawilon tańców kagura'],
  ['taimatsu_ko', 136, 1060, 18, 24, 'pochodnie festiwalu ognia oparte o ścianę szopy'],
  // the shore
  ['kawaguchiko_eki', 30, 1384, 50, 30, 'stacja Kawaguchiko: drewniany budynek z kopułą'],
  ['basu_noriba', 56, 1342, 30, 10, 'przystanek autobusów pod daszkiem', 'low'],
  ['ryokan_1', 110, 1380, 40, 40, 'ryokan z gorącymi źródłami: dachy i ogród'],
  ['ryokan_2', 106, 1500, 46, 50, 'ryokan z łaźnią na tarasie'],
  ['ryokan_3', 106, 1576, 46, 50, 'hotel nad jeziorem'],
  ['ryokan_4', 70, 1716, 26, 40, 'pensjonat z ogrodem'],
  ['ryokan_5', 106, 1716, 46, 40, 'ryokan z widokiem na Fuji'],
  ['mise_kohan', 106, 1800, 46, 40, 'sklepy z pamiątkami i wypożyczalnia rowerów'],
  ['ropeway_sanroku', 104, 1970, 22, 18, 'dolna stacja kolejki linowej'],
  ['ropeway_sancho', 18, 1566, 24, 18, 'górna stacja kolejki na górze Tenjō'],
  ['usagi_jinja', 44, 1572, 10, 10, 'kapliczka zająca na szczycie Tenjō', 'low'],
  ['tenbo_tenjo', 6, 1606, 22, 14, 'taras widokowy z dzwonem', 'low'],
  ['oishi_center', 18, 2030, 34, 20, 'pawilon parku Ōishi ze sklepikiem'],
  // the lake
  ['unoshima_jinja', 124, 3082, 8, 6, 'kapliczka na wyspie z torii nad wodą', 'low'],
  ['kanko_sen_noriba', 132, 2104, 22, 16, 'przystań statku wycieczkowego'],
  // the south shore and the lava forest
  ['camp_tent', 108, 3950, 30, 24, 'namioty i ognisko kempingu', 'low'],
  ['camp_lodge', 146, 3966, 24, 22, 'domek kempingu'],
  ['narusawa_hyoketsu', 140, 4110, 22, 18, 'wejście do jaskini lodowej: drewniane schodki w dół', 'low'],
  ['fugaku_fuketsu', 20, 4040, 22, 18, 'wejście do jaskini wiatru', 'low'],
  ['funatsu_tainai', 62, 4060, 22, 18, 'chram przy jaskini w lawie po drzewach', 'low'],
  ['ryokinjo', 96, 4300, 20, 16, 'bramka płatnej drogi pod Fuji'],
  // up the mountain
  ['okuniwa', 120, 4660, 36, 36, 'parking i stara chatka na Okuniwa, karłowate modrzewie'],
  ['tenbo_gogome', 60, 5300, 30, 20, 'punkt widokowy nad jeziorem w dole', 'low'],
  ['bus_taminaru', 32, 5476, 54, 22, 'pętla autobusów piątej stacji'],
  ['gogome_mise_1', 32, 5512, 40, 32, 'sklep z laskami wspinaczkowymi i pieczątkami'],
  ['gogome_mise_2', 118, 5512, 32, 32, 'jadłodajnia i sklep z pamiątkami'],
  ['komitake_jinja', 76, 5540, 22, 24, 'kapliczka Komitake'],
  ['umaya', 118, 5476, 32, 18, 'konie juczne pod daszkiem'],
  ['rokugome', 144, 5770, 24, 16, 'chatka szóstej stacji: punkt bezpieczeństwa'],
  ['rakuseki_1', 90, 5872, 16, 10, 'zadaszenie przed spadającymi kamieniami nad szlakiem', 'low'],
  ['kyugo', 140, 5880, 20, 14, 'punkt pierwszej pomocy'],
  ['nanagome_1', 136, 5992, 24, 14, 'chatka siódmej stacji'],
  ['nanagome_2', 40, 6042, 24, 14, 'chatka siódmej stacji'],
  ['nanagome_3', 136, 6092, 24, 14, 'chatka siódmej stacji'],
  ['nanagome_4', 40, 6142, 24, 14, 'chatka siódmej stacji z torii'],
  ['nanagome_5', 136, 6192, 24, 14, 'chatka siódmej stacji'],
  ['hachigome_1', 50, 6242, 24, 14, 'chatka ósmej stacji'],
  ['hachigome_2', 136, 6292, 24, 14, 'chatka ósmej stacji'],
  ['hachigome_3', 50, 6342, 24, 14, 'chatka ósmej stacji'],
  ['hachigome_4', 136, 6392, 24, 14, 'chatka ósmej stacji z kapliczką'],
  ['hon_hachigome', 58, 6442, 24, 14, 'główna ósma stacja: chatka i kapliczka'],
  ['rakuseki_2', 112, 6466, 14, 10, 'zadaszenie przed spadającymi kamieniami', 'low'],
  ['kyugome', 126, 6612, 14, 10, 'małe torii dziewiątej stacji', 'low'],
  // the summit
  ['chojo_torii', 102, 6860, 18, 8, 'torii na wejściu na szczyt', 'low'],
  ['kusushi_jinja', 124, 6862, 28, 18, 'kapliczka na szczycie'],
  ['chojo_goya', 54, 6852, 34, 18, 'kamienne domki szczytowe z ławkami'],
  ['ginmeisui', 150, 6996, 8, 8, 'źródlana studnia', 'low'],
  ['kengamine', 24, 7036, 28, 22, 'najwyższy punkt i budynek stacji pogodowej'],
];
