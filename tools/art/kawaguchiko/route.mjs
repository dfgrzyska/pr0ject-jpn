// Kawaguchiko (stage 10, docs/plan-kawaguchiko.md): the route as data. Everything that draws a part of the strip
// reads its measures from here, so that the roads, the railway, the lake, the trail and the plots the landmarks stand
// on line up whoever draws them. Coordinates: x across the strip (0..180), u up it from the bottom (0..L), in the
// game's 180-px units. Pure data: no imports, so the tests can read it (tools/tests/kawaguchikoRoute.test.mjs).
//
// The flight: Fujiyoshida (Fujisan station, Honcho-dori aimed at the mountain, the Chureito pagoda on its hill, the
// cedar avenue to the Sengen shrine) - Kawaguchiko station, the hotels on the shore, Mt Tenjo and its ropeway, Oishi
// park on the peninsula, the Ohashi bridge over the narrows - the lake with Unoshima (the miniboss's arena on open
// water) - the north shore's beach, the old pilgrims' village of Kawaguchi with its fields and the Asama shrine's
// cedars - the maple corridor along its stream to the quay over the lake's western water. There the strip ends: above
// the quay it is clear, and Fuji's panorama rises behind it (as Nagasaki's view does).
export const W = 180;
export const S = 3; // fine pixels per logical one
export const CHUNK = 896; // (the height of the pieces the game loads)
export const CHUNKS = 8;
export const L = CHUNK * CHUNKS; // 7168

// [from u, to u, id, name, ground colour]: the ground is what is left between everything else
export const SECTIONS = [
  [0, 1300, 'fujiyoshida', 'FUJIYOSHIDA', 0x8a8274],
  [1300, 2100, 'shore', 'OISHI', 0x847a62],
  [2100, 3900, 'lake', 'KAWAGUCHI-KO', 0x7a7258],
  [3900, 5300, 'kawaguchi', 'KAWAGUCHI', 0x76704e],
  [5300, 6748, 'momiji', 'MOMIJI KAIRO', 0x66563e],
  [6748, L, 'view', 'FUJI-SAN', 0x3a4a5a], // (cut out: the panorama shows there)
];

// the quay where the strip ends: above it the strip is clear and Fuji's panorama shows (stage10.json: panorama.ridge)
export const VIEW_FROM = 6748;

// where the fights are: [x, u, name, radius]. Nothing tall may stand inside (the tests check the plots).
// The first holds the scroll ("hold" in the stage file); the second is over the panorama, where the strip ends.
export const ARENAS = [
  [90, 3400, 'KACHI-KACHI USAGI', 62],
  [90, 6958, 'DAIDARABOTCHI', 62],
];

// The time of day along the strip (props.mjs, todGrade): [u, [mul r, g, b], tint, tint amount, gamma].
// Afternoon in the town, the golden hour on the lake, the sun going down over the north shore and the quay.
export const TOD = [
  [0, [1.0, 0.98, 0.94], 0xffe0b0, 0.04],
  [1300, [1.02, 0.96, 0.88], 0xffc880, 0.06],
  [2400, [1.04, 0.92, 0.78], 0xffa050, 0.1],
  [3900, [1.02, 0.86, 0.74], 0xff8040, 0.12],
  [5300, [0.98, 0.8, 0.72], 0xff6a40, 0.14],
  [VIEW_FROM, [0.92, 0.74, 0.72], 0xe05a50, 0.16],
  [L, [0.92, 0.74, 0.72], 0xe05a50, 0.16],
];

// ---- shapes: { rect: [x, u, w, h] } | { ell: [cx, cu, rx, ru] } | { poly: [[x, u], ...] } |
//      { chain: [[x, u, half width], ...] } (a ribbon) | { ring: [x, u, w, h, thickness] }  (tools/art/tokyo/geom.mjs)

// Water. open: cut out of the strip, the far layer shows through (the lake); view: cut out for the panorama above the
// quay; otherwise painted (ponds, the stream). Its shore gets an edge of pebbles, the view's a quay wall.
export const WATER = [
  { id: 'kawaguchiko', open: true, shore: true, poly: [
    [180, 2140], [150, 2128], [120, 2136], [96, 2150], [82, 2182], [77, 2262], [75, 2340], [66, 2392], [42, 2412], [18, 2404], [0, 2418],
    [0, 3862], [22, 3874], [52, 3860], [82, 3868], [112, 3882], [142, 3866], [166, 3872], [180, 3860],
  ] },
  { id: 'shrine_ike', ell: [18, 1240, 9, 6] }, // (a pond by the shrine's cedars)
  // the stream the maple corridor follows down to the lake (it runs out under the promenade's bridge into the view)
  { id: 'nashi_gawa', chain: [[0, 5420, 3], [22, 5460, 3], [40, 5560, 3.5], [46, 5800, 4], [42, 6000, 4], [56, 6200, 4], [52, 6400, 4.5], [60, 6600, 5], [58, 6760, 5.5]] },
  { id: 'miharashi', open: true, view: true, rect: [0, VIEW_FROM, 180, L - VIEW_FROM] },
];

// Ground of a kind of its own: [kind, shape]. Kinds: park (lawn and trees), forest (cedar, mixed wood), gravel
// (shrine grounds), plaza, sand, flowers (Oishi's beds), kochia (round shrubs in rows), field (rice cut, its stubble
// in rows), momiji (the maple wood's floor of fallen leaves). Drawn in this order; `over` ones after the water (the
// island, the piers' pontoons).
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
  // the lake: Unoshima, the pontoons at the piers' ends, the north shore's beach
  { id: 'unoshima', kind: 'forest', over: true, ell: [128, 3080, 13, 11] },
  { id: 'unoshima_hama', kind: 'sand', over: true, ell: [128, 3072, 15, 8] },
  { id: 'pontoon_1', kind: 'plaza', over: true, rect: [96, 2190, 10, 6] },
  { id: 'pontoon_2', kind: 'plaza', over: true, rect: [118, 2186, 10, 6] },
  { id: 'kita_hama', kind: 'sand', rect: [0, 3840, 180, 64] },
  // Kawaguchi: its rice fields cut, the Asama shrine's wood and grounds
  { id: 'tambo_1', kind: 'field', rect: [0, 4230, 80, 280] },
  { id: 'tambo_2', kind: 'field', rect: [96, 4600, 84, 240] },
  { id: 'asama_mori', kind: 'forest', rect: [100, 4960, 80, 330] },
  { id: 'asama_keidai', kind: 'gravel', rect: [118, 5050, 50, 110] },
  // the maple corridor along the stream, its car park; the quay at the strip's end
  { id: 'momiji_mori', kind: 'momiji', rect: [0, 5350, 100, 1366] },
  { id: 'momiji_parking', kind: 'plaza', rect: [148, 5560, 32, 60] },
  { id: 'gampeki', kind: 'plaza', rect: [0, 6727, 180, 21] },
];

// Roads: { id, cls, w (width), pts }. Classes: avenue and street (asphalt, pavements, a centre line), lane (a back
// street), walk (a way for people: shrine avenues, park paths, the steps up to the pagoda), deck (a pier), bridge (a
// road over the water on its piers). An end must be on the strip's edge, on another road, or at a plot or a ground
// (the tests check).
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
  // the north shore: the road along the beach, the old village street up through Kawaguchi and on to the quay
  { id: 'kohan_kita', cls: 'street', w: 7, pts: [[0, 3918], [180, 3918]] },
  { id: 'kawaguchi_kaido', cls: 'street', w: 7, pts: [[88, 3918], [88, 5320], [140, 5400], [140, 6722]] },
  { id: 'kawaguchi_1', cls: 'lane', w: 4, pts: [[0, 4210], [88, 4210]] },
  { id: 'kawaguchi_2', cls: 'street', w: 7, pts: [[0, 4560], [180, 4560]] },
  { id: 'kawaguchi_3', cls: 'lane', w: 4, pts: [[88, 4880], [180, 4880]] },
  { id: 'asama_sando', cls: 'walk', w: 4, pts: [[88, 5100], [118, 5100]] }, // (to the shrine's grounds, under its torii)
  // the maple corridor: in from the village street, along the stream down to the promenade on the quay
  { id: 'momiji_dori', cls: 'lane', w: 4, pts: [[0, 5340], [100, 5340]] },
  { id: 'momiji_michi', cls: 'walk', w: 3, pts: [[62, 5340], [62, 5460], [58, 5600], [66, 5800], [62, 6000], [74, 6200], [70, 6400], [78, 6600], [78, 6722]] },
  { id: 'kohan_nishi', cls: 'street', w: 7, pts: [[0, 6722], [180, 6722]] },
  { id: 'nashi_bashi', cls: 'bridge', w: 7, pts: [[48, 6722], [70, 6722]] }, // (the promenade over the stream's mouth)
];

// Tracks: { id, tracks, pts, style }. The local line from Fujisan station to Kawaguchiko (one track, its passing
// loops at the stations); the ropeway up Mt Tenjo (style rope: two cables, the gondolas hung on them).
export const RAILS = [
  { id: 'fujikyu', tracks: 1, pts: [[0, 40], [26, 120], [36, 300], [42, 560], [40, 760], [36, 1000], [40, 1240], [46, 1384]] },
  { id: 'tenjo_ropeway', tracks: 1, style: 'rope', pts: [[110, 1986], [30, 1580]] },
];

// Plots for the landmarks: [id, x, u, w, h, what stands there, low]. low: lies flat or stands low (a statue, a well,
// a torii over a path): may stand in an arena. Every plot gets its own drawing.
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
  ['yuenchi', 46, 782, 37, 210, 'park rozrywki (własny, bez cudzych atrakcji i znaków): brama od Honcho-dori, wielka kolejka górska, nawiedzony szpital, ogródek z jedzeniem'],
  ['yuenchi_nishi', 0, 782, 32, 210, 'park rozrywki za torami (kładka): diabelski młyn, statek, karuzela, filiżanki, wieża spadowa'],
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
  // Kawaguchi: the pilgrims' lodgings (oshi) along the old street, persimmons drying, farms, the Asama shrine
  ['oshi_1', 44, 3934, 36, 40, 'dom pielgrzymów oshi: brama, mur, chorągwie'],
  ['oshi_2', 96, 3934, 40, 44, 'dom oshi z ogrodem i kamienną latarnią'],
  ['hoto_ya', 142, 3934, 34, 30, 'jadłodajnia z hōtō: kocioł, noren, ławki'],
  ['hoshigaki_1', 44, 4040, 36, 36, 'dom z kurtynami suszonych persymon pod okapem'],
  ['kaki_en', 96, 4060, 44, 40, 'sad persymon: drzewa z owocami, drabina, koszyki'],
  ['oshi_3', 0, 4100, 36, 40, 'dom oshi z bramą w budynku (nagaya-mon)'],
  ['kominka', 140, 4250, 36, 40, 'stara chata kryta strzechą z persymonami pod okapem'],
  ['kominkan', 96, 4420, 40, 36, 'świetlica wiejska z placem i wiatą'],
  ['nouka', 0, 4600, 40, 40, 'zagroda: stodoła, snopki ryżu, mały traktor'],
  ['oshi_4', 44, 4600, 36, 40, 'dom oshi ze składem drewna'],
  ['jizo', 60, 4860, 16, 12, 'kamienne jizō w czerwonych śliniakach', 'low'],
  ['oshi_5', 30, 5000, 40, 40, 'dom oshi z tablicą bractwa pielgrzymów'],
  ['nanahon_sugi', 120, 4994, 44, 30, 'siedem wiekowych cedrów w sznurach shimenawa'],
  ['asama_torii', 104, 5094, 8, 12, 'torii chramu Asama nad ścieżką', 'low'],
  ['kagura_asama', 152, 5060, 16, 18, 'scena kagura'],
  ['asama_honden', 126, 5164, 34, 30, 'chram Kawaguchi Asama: pawilony pod korą cyprysową'],
  // the maple corridor, the promenade and the quay
  ['yatai_1', 72, 5480, 30, 16, 'stragany jarmarku: hōtō, persymony, kasztany', 'low'],
  ['yatai_2', 76, 5700, 30, 16, 'stragany z rękodziełem i maskami', 'low'],
  ['koyo_chaya', 4, 5820, 28, 24, 'dom herbaciany pod klonami'],
  ['yatai_3', 80, 5940, 30, 16, 'stragany z jedzeniem, ławki pod parasolami', 'low'],
  ['ryokan_nishi', 148, 6040, 32, 50, 'ryokan nad jeziorem z ogrodem'],
  ['kyukeijo', 96, 6100, 30, 24, 'herbaciarnia z czerwonym parasolem i ławkami'],
  ['gallery', 96, 6300, 40, 50, 'galeria tkanin w kamiennym ogrodzie'],
  ['minshuku', 148, 6400, 32, 40, 'pensjonat z łaźnią'],
  ['tenbo_dai', 96, 6640, 36, 20, 'taras widokowy nad wodą z ławkami', 'low'],
  ['shashin', 100, 6728, 60, 14, 'fotografowie ze statywami na nabrzeżu czekają na różową Fuji', 'low'],
];
