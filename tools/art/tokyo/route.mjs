// Tokyo (stage 9, docs/plan-tokyo.md): the route as data. Everything that draws a part of the strip reads its
// measures from here, so that the streets, the tracks, the water and the plots the landmarks stand on line up
// whoever draws them. Coordinates: x across the strip (0..180), u up it from the bottom (0..L), in the game's
// 180-px units. Pure data: no imports, so the tests can read it (tools/tests/tokyoRoute.test.mjs).
//
// The flight: Nakano (the station, the arcade, Broadway) - over the Kanda river - the towers of west Shinjuku,
// across the station's tracks, the shops and Kabukichō, Shinjuku Gyoen - down Meiji-dōri past the forest of
// Meiji Jingū and Harajuku - Shibuya (the station, Hachikō, the scramble) - Roppongi-dōri under its expressway -
// Tokyo Tower and Zōjō-ji - the Diet, the Imperial Palace in its moat, Tokyo Station - up Chūō-dōri through
// Akihabara - Ueno (Ameyoko under the tracks, the pond, the park) - Asakusa (Kaminarimon, Nakamise, Sensō-ji) -
// down the Sumida under its bridges - the bay and the Rainbow Bridge - Odaiba and its container pier.
export const W = 180;
export const S = 3; // fine pixels per logical one
export const CHUNK = 896; // (the height of the pieces the game loads)
export const CHUNKS = 14;
export const L = CHUNK * CHUNKS; // 12544

// [from u, to u, id, name, ground colour]: the ground is what is left between everything else
export const DISTRICTS = [
  [0, 700, 'nakano', 'NAKANO', 0x8e877a],
  [700, 2100, 'shinjuku', 'SHINJUKU', 0x80848c],
  [2100, 2900, 'harajuku', 'HARAJUKU', 0x8a8478],
  [2900, 3900, 'shibuya', 'SHIBUYA', 0x74767f],
  [3900, 4884, 'minato', 'MINATO', 0x7c766c],
  [4884, 6050, 'chiyoda', 'CHIYODA', 0x84807a],
  [6050, 7200, 'akihabara', 'AKIHABARA', 0x6c6a7c],
  [7200, 8084, 'ueno', 'UENO', 0x847c70],
  [8084, 9500, 'asakusa', 'ASAKUSA', 0x8c7466],
  [9500, 10760, 'sumida', 'SUMIDA-GAWA', 0x7a7672],
  [10760, 11450, 'bay', 'TOKYO-WAN', 0x7a7672],
  [11450, L, 'odaiba', 'ODAIBA', 0x7c8084],
];

// where the fights are: [x, u, name, radius]. Nothing tall may stand inside (the tests check the plots).
// The first two hold the scroll ("hold" in the stage file); the last is where the strip ends.
export const ARENAS = [
  [90, 3350, 'KASA-OBAKE', 34], // (the scramble itself: the buildings stand round it)
  [90, 9100, 'TAIYAKI', 62],
  [90, 12340, 'KUROGANE', 62],
];

// The time of day along the strip (props.mjs, todGrade): [u, [mul r, g, b], tint, tint amount, gamma].
// A golden afternoon in Shinjuku, rain at dusk in Shibuya, the blue hour at the tower, night from Akihabara on.
export const TOD = [
  [0, [1.0, 0.98, 0.94], 0xffe0b0, 0.04],
  [700, [1.03, 0.94, 0.82], 0xffb060, 0.08],
  [2100, [1.02, 0.88, 0.76], 0xff9048, 0.1],
  [2900, [0.72, 0.72, 0.84], 0x4a5068, 0.16],
  [3900, [0.6, 0.62, 0.86], 0x283a70, 0.14, 1.1],
  [4884, [0.52, 0.52, 0.76], 0x1c1c48, 0.13, 1.15],
  [6050, [0.46, 0.46, 0.7], 0x16123a, 0.12, 1.2],
  [L, [0.46, 0.46, 0.7], 0x16123a, 0.12, 1.2],
];

// ---- shapes: { rect: [x, u, w, h] } | { ell: [cx, cu, rx, ru] } | { poly: [[x, u], ...] } |
//      { chain: [[x, u, half width], ...] } (a ribbon) | { ring: [x, u, w, h, thickness] } (a moat round a rect)

// Water. open: cut out of the strip, the far layer's water shows through (the rivers, the bay); otherwise
// painted (moats, ponds). Drawn over the ground and under everything else; its banks get a stone edge.
// late: drawn after the land that is put back over the water (GROUNDS: over).
export const WATER = [
  { id: 'kanda_nakano', chain: [[0, 712, 5], [60, 706, 5], [120, 716, 5], [180, 708, 5]] },
  { id: 'gyoen_ike', ell: [76, 1900, 38, 20] },
  { id: 'gyoen_ike2', ell: [112, 1960, 18, 26] },
  { id: 'meiji_ike', ell: [66, 2620, 10, 22] },
  { id: 'kokyo_hori', ring: [8, 5166, 164, 604, 26] },
  { id: 'chidorigafuchi', ell: [26, 5690, 24, 64] },
  { id: 'ninomaru_ike', ell: [124, 5560, 12, 18] },
  { id: 'kanda', open: true, chain: [[0, 6146, 13], [60, 6140, 13], [120, 6150, 13], [180, 6144, 13]] },
  { id: 'shinobazu', ell: [50, 7650, 46, 130] },
  { id: 'sumida', open: true, chain: [[180, 9600, 30], [150, 9630, 32], [112, 9700, 34], [92, 9800, 36], [84, 10000, 38], [92, 10250, 40], [98, 10450, 44], [90, 10640, 50], [90, 10700, 62], [90, 10770, 96]] },
  { id: 'tokyo_wan', open: true, rect: [0, 10760, 180, 690] },
  { id: 'odaiba_kaigan', open: true, poly: [[0, 11450], [180, 11450], [180, 11490], [150, 11470], [90, 11456], [30, 11470], [0, 11500]] },
  { id: 'aomi_berth', open: true, rect: [0, 12150, 36, 394] },
  { id: 'aomi_oki', open: true, rect: [0, 12500, 180, 44] },
  { id: 'hamarikyu_ike', late: true, ell: [20, 10760, 11, 24] }, // (late: on land put back over the water)
];

// Land put back over the water (islands, piers), and ground of a kind of its own: [kind, shape]. Kinds:
// park (lawn and trees), forest, gravel (shrine and palace grounds), plaza, paving (temple courts), sand,
// apron (the pier's concrete), asphalt (the scramble's square). Drawn in this order; `over` ones after the water.
export const GROUNDS = [
  { id: 'nakano_ekimae', kind: 'plaza', rect: [60, 180, 60, 26] },
  { id: 'chuo_koen', kind: 'park', rect: [0, 876, 38, 128] },
  { id: 'gyoen', kind: 'park', rect: [0, 1812, 158, 280] },
  { id: 'meiji_no_mori', kind: 'forest', rect: [0, 2110, 84, 650] },
  { id: 'yoyogi', kind: 'plaza', rect: [0, 2760, 84, 140] },
  { id: 'hachiko_mae', kind: 'plaza', rect: [100, 3150, 76, 146] },
  { id: 'scramble', kind: 'asphalt', rect: [56, 3316, 68, 68] },
  { id: 'shiba_koen', kind: 'park', rect: [38, 4250, 104, 372] },
  { id: 'zojoji_keidai', kind: 'gravel', rect: [38, 4630, 104, 240] },
  { id: 'kokkai_mae', kind: 'park', rect: [38, 4980, 104, 150] },
  { id: 'kokyo', kind: 'forest', rect: [34, 5192, 112, 552] },
  { id: 'kokyo_gyoen', kind: 'park', rect: [40, 5210, 100, 250] },
  { id: 'kokyo_higashi', kind: 'gravel', rect: [64, 5600, 62, 100] },
  { id: 'marunouchi_hiroba', kind: 'plaza', rect: [30, 5850, 120, 50] },
  { id: 'yaesu_hiroba', kind: 'plaza', rect: [30, 6024, 120, 26] },
  { id: 'ueno_koen', kind: 'park', rect: [0, 7466, 180, 608] },
  { id: 'funsui_hiroba', kind: 'plaza', ell: [126, 7900, 28, 28] },
  { id: 'sensoji_keidai', kind: 'paving', rect: [20, 8926, 140, 300] },
  { id: 'sumida_koen', kind: 'park', poly: [[0, 9510], [180, 9510], [180, 9566], [146, 9596], [108, 9666], [58, 9800], [0, 9800]] },
  { id: 'hamarikyu', kind: 'park', over: true, rect: [0, 10660, 40, 180] },
  { id: 'takeshiba', kind: 'apron', over: true, rect: [0, 10880, 30, 50] },
  { id: 'shibaura', kind: 'apron', over: true, rect: [0, 10966, 38, 100] }, // (the bridge's west anchorage on its north end)
  { id: 'daiba3', kind: 'park', over: true, ell: [56, 11270, 22, 18] },
  { id: 'daiba6', kind: 'forest', over: true, ell: [136, 11200, 16, 13] },
  { id: 'daiba_michi', kind: 'park', over: true, rect: [51, 11284, 10, 184] }, // (the causeway from the beach out to the fort)
  { id: 'odaiba_pontoon', kind: 'apron', over: true, rect: [113, 11410, 14, 9] }, // (the water bus's landing)
  { id: 'odaiba_hama', kind: 'sand', poly: [[0, 11500], [30, 11470], [90, 11456], [150, 11470], [180, 11490], [180, 11522], [0, 11522]] },
  { id: 'shiokaze_koen', kind: 'park', rect: [8, 11880, 72, 170] },
  { id: 'aomi_futo', kind: 'apron', rect: [36, 12100, 144, 400] },
];

// Roads: { id, cls, w (width), pts }. Classes: avenue and street (asphalt, pavements, a centre line), lane
// (a back street: no pavement), walk (a paved way for people: shopping streets, park and shrine paths), arcade
// (a covered shopping street: a glass roof), deck (a boardwalk), express (an elevated expressway: drawn over
// everything on the ground, with its shadow). over: drawn after the tracks (a bridge over them).
// An end must be on the strip's edge, on another road, or at a plot or a ground (the tests check).
export const ROADS = [
  // Nakano
  { id: 'ome_kaido', cls: 'avenue', w: 12, pts: [[140, 0], [140, 1806]] },
  { id: 'sun_mall', cls: 'arcade', w: 10, pts: [[90, 194], [90, 330]] },
  { id: 'waseda_dori', cls: 'street', w: 8, pts: [[0, 548], [180, 548]] },
  { id: 'nakano_roji_1', cls: 'lane', w: 4, pts: [[0, 268], [134, 268]] },
  { id: 'nakano_roji_2', cls: 'lane', w: 4, pts: [[0, 420], [60, 420]] },
  { id: 'nakano_roji_3', cls: 'lane', w: 4, pts: [[40, 206], [40, 694]] },
  { id: 'nakano_ekimae_dori', cls: 'street', w: 6, pts: [[0, 206], [134, 206]] },
  // (south of the station: the screen opens on u 100-420, or from 0 on a tall phone, so the station stands at 134-186)
  { id: 'nakano_minami_dori', cls: 'street', w: 6, pts: [[0, 118], [134, 118]] },
  { id: 'nakano_roji_4', cls: 'lane', w: 4, pts: [[0, 60], [134, 60]] },
  { id: 'nakano_roji_5', cls: 'lane', w: 4, pts: [[60, 0], [60, 115]] },
  { id: 'kanda_kishi', cls: 'lane', w: 4, pts: [[0, 694], [180, 694]] },
  // Shinjuku
  { id: 'nishi_1', cls: 'street', w: 8, pts: [[0, 740], [180, 740]] },
  { id: 'nishi_2', cls: 'avenue', w: 10, pts: [[0, 870], [180, 870]] },
  { id: 'nishi_3', cls: 'avenue', w: 10, pts: [[0, 1010], [180, 1010]] },
  { id: 'nishi_4', cls: 'avenue', w: 10, pts: [[0, 1170], [180, 1170]] },
  { id: 'nishi_tate', cls: 'avenue', w: 10, pts: [[44, 740], [44, 1170]] },
  { id: 'shinjuku_dori', cls: 'street', w: 8, pts: [[0, 1400], [140, 1400]] },
  { id: 'shinjuku_roji', cls: 'lane', w: 4, pts: [[73, 1340], [73, 1561]] },
  { id: 'higashi_guchi', cls: 'street', w: 6, pts: [[0, 1340], [134, 1340]] },
  { id: 'yasukuni_dori', cls: 'avenue', w: 14, pts: [[0, 1568], [180, 1568]] },
  { id: 'kabukicho_ichiban', cls: 'walk', w: 8, pts: [[92, 1575], [92, 1801]] },
  { id: 'kabukicho_roji_1', cls: 'lane', w: 4, pts: [[0, 1640], [134, 1640]] },
  { id: 'kabukicho_roji_2', cls: 'lane', w: 4, pts: [[0, 1700], [134, 1700]] },
  { id: 'gyoen_dori', cls: 'avenue', w: 10, pts: [[0, 1806], [180, 1806]] },
  { id: 'gyoen_michi_1', cls: 'walk', w: 3, pts: [[10, 1830], [60, 1866], [110, 1850], [150, 1880], [150, 2060], [90, 2080], [20, 2050], [10, 1830]] },
  { id: 'gyoen_michi_2', cls: 'walk', w: 3, pts: [[90, 1811], [90, 1858]] },
  { id: 'sendagaya_dori', cls: 'street', w: 8, pts: [[0, 2096], [166, 2096]] },
  // Harajuku and Shibuya: Meiji-dōri is the spine
  { id: 'meiji_dori', cls: 'avenue', w: 12, pts: [[166, 1806], [166, 2800], [150, 2850], [104, 2900], [90, 2960], [90, 2990]] },
  { id: 'jingu_bashi', cls: 'street', w: 8, over: true, pts: [[84, 2180], [104, 2180]] },
  { id: 'omotesando', cls: 'avenue', w: 12, pts: [[104, 2180], [166, 2390], [180, 2420]] },
  { id: 'meiji_sando', cls: 'walk', w: 6, pts: [[84, 2180], [50, 2200], [40, 2300], [42, 2400]] },
  { id: 'takeshita_dori', cls: 'walk', w: 5, pts: [[100, 2540], [160, 2540]] },
  { id: 'meiji_gyoen_michi', cls: 'walk', w: 3, pts: [[52, 2476], [48, 2560], [50, 2640], [40, 2680]] }, // (the inner garden, the lawn)
  { id: 'cat_street', cls: 'walk', w: 4, pts: [[150, 2336], [140, 2420], [132, 2470], [132, 2488]] },
  { id: 'harajuku_roji_1', cls: 'lane', w: 4, pts: [[128, 2262], [160, 2262]] },
  { id: 'ura_hara', cls: 'lane', w: 4, pts: [[130, 2584], [130, 2870]] },
  { id: 'ura_hara_1', cls: 'lane', w: 4, pts: [[130, 2660], [160, 2660]] },
  { id: 'ura_hara_2', cls: 'lane', w: 4, pts: [[130, 2760], [160, 2760]] },
  { id: 'shibuya_roji_s', cls: 'lane', w: 4, pts: [[0, 3080], [82, 3080]] },
  { id: 'shibuya_roji_e', cls: 'lane', w: 4, pts: [[98, 3500], [145, 3500]] },
  { id: 'shibuya_roji_n1', cls: 'lane', w: 4, pts: [[0, 3740], [180, 3740]] },
  { id: 'shibuya_roji_n2', cls: 'lane', w: 4, pts: [[0, 3840], [180, 3840]] },
  { id: 'shibuya_roji_t1', cls: 'lane', w: 4, pts: [[40, 3604], [40, 3840]] },
  { id: 'shibuya_roji_t2', cls: 'lane', w: 4, pts: [[140, 3604], [140, 3840]] },
  { id: 'shibuya_odori', cls: 'avenue', w: 16, pts: [[90, 2990], [90, 3420]] },
  { id: 'bunkamura_dori', cls: 'avenue', w: 16, pts: [[0, 3350], [180, 3350]] },
  { id: 'center_gai', cls: 'walk', w: 5, pts: [[46, 3358], [46, 3600]] },
  { id: 'shibuya_roji', cls: 'lane', w: 4, pts: [[0, 3446], [82, 3446]] },
  { id: 'shoto_dori', cls: 'street', w: 8, pts: [[0, 3600], [180, 3600]] },
  // Minato
  { id: 'roppongi_dori', cls: 'avenue', w: 12, pts: [[90, 3420], [90, 4190]] },
  { id: 'shuto_3', cls: 'express', w: 8, pts: [[0, 3650], [50, 3690], [90, 3760], [90, 4120], [130, 4170], [180, 4190]] },
  { id: 'gaien_higashi_dori', cls: 'avenue', w: 10, pts: [[0, 4060], [180, 4060]] },
  { id: 'tower_nishi', cls: 'street', w: 8, pts: [[90, 4190], [44, 4236], [30, 4300], [30, 4884]] },
  { id: 'tower_higashi', cls: 'street', w: 8, pts: [[90, 4190], [136, 4236], [150, 4300], [150, 4884]] },
  { id: 'tower_michi_s', cls: 'walk', w: 5, pts: [[90, 4196], [90, 4338]] },
  { id: 'tower_michi_n', cls: 'walk', w: 5, pts: [[90, 4406], [90, 4632]] },
  { id: 'tower_michi_w', cls: 'walk', w: 4, pts: [[34, 4372], [56, 4372]] },
  { id: 'tower_michi_e', cls: 'walk', w: 4, pts: [[124, 4372], [146, 4372]] },
  { id: 'roppongi_roji_1', cls: 'lane', w: 4, pts: [[96, 3980], [180, 3980]] },
  { id: 'roppongi_roji_2', cls: 'lane', w: 4, pts: [[0, 4130], [84, 4130]] },
  { id: 'roppongi_roji_3', cls: 'lane', w: 4, pts: [[96, 4150], [180, 4150]] },
  { id: 'shiba_roji_w1', cls: 'lane', w: 4, pts: [[0, 4420], [26, 4420]] },
  { id: 'shiba_roji_w2', cls: 'lane', w: 4, pts: [[0, 4600], [26, 4600]] },
  { id: 'shiba_roji_w3', cls: 'lane', w: 4, pts: [[0, 4760], [26, 4760]] },
  { id: 'shiba_roji_e1', cls: 'lane', w: 4, pts: [[154, 4420], [180, 4420]] },
  { id: 'shiba_roji_e2', cls: 'lane', w: 4, pts: [[154, 4600], [180, 4600]] },
  { id: 'shiba_roji_e3', cls: 'lane', w: 4, pts: [[154, 4760], [180, 4760]] },
  { id: 'zojoji_sando', cls: 'walk', w: 8, pts: [[90, 4864], [90, 4756]] },
  { id: 'hibiya_dori', cls: 'avenue', w: 12, pts: [[0, 4884], [180, 4884]] },
  // Chiyoda
  { id: 'sakurada_nishi', cls: 'street', w: 8, pts: [[30, 4884], [30, 5146]] },
  { id: 'sakurada_higashi', cls: 'street', w: 8, pts: [[150, 4884], [150, 5146]] },
  { id: 'kokkai_mae_dori', cls: 'street', w: 8, pts: [[30, 4972], [150, 4972]] },
  { id: 'kasumigaseki_roji', cls: 'lane', w: 4, pts: [[90, 4890], [90, 4968]] },
  { id: 'kasumi_roji_w', cls: 'lane', w: 4, pts: [[0, 5020], [26, 5020]] },
  { id: 'kasumi_roji_e', cls: 'lane', w: 4, pts: [[154, 5020], [180, 5020]] },
  { id: 'uchibori_dori', cls: 'avenue', w: 12, pts: [[0, 5146], [180, 5146]] },
  { id: 'nijubashi', cls: 'walk', w: 8, pts: [[90, 5152], [90, 5300]] },
  { id: 'kokyo_michi_1', cls: 'walk', w: 4, pts: [[90, 5360], [70, 5500], [94, 5640]] },
  { id: 'hirakawa_bashi', cls: 'walk', w: 8, pts: [[94, 5670], [90, 5738], [90, 5790]] },
  { id: 'eitai_dori', cls: 'avenue', w: 12, pts: [[0, 5796], [180, 5796]] },
  { id: 'gyoko_dori', cls: 'avenue', w: 16, pts: [[90, 5796], [90, 5852]] },
  // Akihabara and Ueno: Chūō-dōri is the spine
  { id: 'chuo_dori', cls: 'avenue', w: 14, pts: [[90, 6048], [90, 7456]] },
  { id: 'akiba_roji_w1', cls: 'lane', w: 4, pts: [[0, 6290], [83, 6290]] },
  { id: 'akiba_roji_w2', cls: 'lane', w: 4, pts: [[0, 6400], [83, 6400]] },
  { id: 'akiba_roji_w3', cls: 'lane', w: 4, pts: [[0, 6660], [83, 6660]] },
  { id: 'akiba_roji_w4', cls: 'lane', w: 4, pts: [[0, 6760], [83, 6760]] },
  { id: 'akiba_roji_wt', cls: 'lane', w: 4, pts: [[40, 6180], [40, 6894]] },
  { id: 'kanda_kishi_kita', cls: 'lane', w: 4, pts: [[0, 6180], [180, 6180]] },
  { id: 'akiba_roji_e1', cls: 'lane', w: 4, pts: [[97, 6300], [180, 6300]] },
  { id: 'akiba_roji_e2', cls: 'lane', w: 4, pts: [[97, 6420], [180, 6420]] },
  { id: 'akiba_roji_e3', cls: 'lane', w: 4, pts: [[97, 6700], [180, 6700]] },
  { id: 'akiba_roji_e4', cls: 'lane', w: 4, pts: [[97, 6800], [180, 6800]] },
  { id: 'akiba_roji_et', cls: 'lane', w: 4, pts: [[124, 6180], [124, 6420]] },
  { id: 'akiba_roji_w5', cls: 'lane', w: 4, pts: [[0, 6540], [83, 6540]] },
  { id: 'kuramaebashi_dori', cls: 'avenue', w: 12, pts: [[0, 6900], [180, 6900]] },
  { id: 'akiba_roji_wn', cls: 'lane', w: 4, pts: [[40, 6906], [40, 7196]] },
  { id: 'akiba_roji_n1', cls: 'lane', w: 4, pts: [[0, 7040], [83, 7040]] },
  { id: 'akiba_roji_n2', cls: 'lane', w: 4, pts: [[0, 7120], [83, 7120]] },
  { id: 'akiba_roji_n3', cls: 'lane', w: 4, pts: [[97, 6990], [180, 6990]] },
  { id: 'akiba_roji_n4', cls: 'lane', w: 4, pts: [[97, 7090], [180, 7090]] },
  { id: 'okachimachi_roji_w1', cls: 'lane', w: 4, pts: [[0, 7280], [83, 7280]] },
  { id: 'okachimachi_roji_w2', cls: 'lane', w: 4, pts: [[0, 7370], [83, 7370]] },
  { id: 'okachimachi_roji_wt', cls: 'lane', w: 4, pts: [[40, 7204], [40, 7450]] },
  { id: 'okachimachi_roji_e1', cls: 'lane', w: 4, pts: [[97, 7290], [140, 7290]] },
  { id: 'okachimachi_roji_e2', cls: 'lane', w: 4, pts: [[97, 7380], [140, 7380]] },
  { id: 'kasuga_dori', cls: 'street', w: 8, pts: [[0, 7200], [180, 7200]] },
  { id: 'ameyoko', cls: 'walk', w: 6, pts: [[140, 7204], [140, 7450]] },
  { id: 'shinobazu_dori', cls: 'avenue', w: 12, pts: [[0, 7456], [180, 7456]] },
  { id: 'ueno_ishidan', cls: 'walk', w: 10, pts: [[104, 7462], [110, 7540], [126, 7570]] },
  { id: 'ueno_sakura_dori', cls: 'walk', w: 12, pts: [[126, 7570], [126, 7880]] },
  { id: 'bentendo_michi_1', cls: 'walk', w: 4, pts: [[50, 7516], [50, 7784]] },
  { id: 'bentendo_michi_2', cls: 'walk', w: 4, pts: [[50, 7650], [120, 7650]] },
  { id: 'hakubutsukan_michi', cls: 'walk', w: 8, pts: [[126, 7920], [126, 7952]] },
  // Asakusa
  { id: 'asakusa_dori', cls: 'avenue', w: 12, pts: [[0, 8084], [180, 8084]] },
  { id: 'kappabashi', cls: 'street', w: 8, pts: [[34, 8084], [34, 8306]] },
  { id: 'kaminarimon_dori', cls: 'avenue', w: 12, pts: [[0, 8306], [180, 8306]] },
  { id: 'nakamise', cls: 'walk', w: 10, pts: [[90, 8312], [90, 8930]] },
  { id: 'denboin_dori', cls: 'walk', w: 5, pts: [[0, 8640], [156, 8640]] },
  { id: 'umamichi_dori', cls: 'street', w: 8, pts: [[156, 8306], [156, 9496]] },
  { id: 'kototoi_dori', cls: 'avenue', w: 12, pts: [[0, 9496], [180, 9496]] },
  // the Sumida's banks and bridges
  { id: 'edo_dori', cls: 'street', w: 8, pts: [[26, 9496], [26, 9860], [22, 10300], [20, 10590]] },
  { id: 'azuma_bashi', cls: 'avenue', w: 12, pts: [[0, 9860], [180, 9860]] },
  { id: 'komagata_bashi', cls: 'street', w: 10, pts: [[0, 10020], [180, 10020]] },
  { id: 'ryogoku_bashi', cls: 'street', w: 10, pts: [[0, 10240], [180, 10240]] },
  { id: 'kiyosu_bashi', cls: 'street', w: 10, pts: [[0, 10420], [180, 10420]] },
  { id: 'eitai_bashi', cls: 'avenue', w: 12, pts: [[0, 10590], [180, 10590]] },
  // the bay and Odaiba
  { id: 'rainbow_bridge', cls: 'express', w: 12, pts: [[0, 11050], [180, 11050]] },
  { id: 'odaiba_deck', cls: 'deck', w: 6, pts: [[0, 11526], [180, 11526]] },
  { id: 'daiba_michi', cls: 'walk', w: 4, pts: [[56, 11286], [56, 11466]] },
  { id: 'odaiba_sanbashi', cls: 'deck', w: 4, pts: [[120, 11466], [120, 11414]] },
  { id: 'odaiba_dori', cls: 'avenue', w: 12, pts: [[0, 11580], [180, 11580]] },
  { id: 'wangan_doro', cls: 'express', w: 14, pts: [[0, 11750], [180, 11750]] },
  { id: 'center_promenade_1', cls: 'walk', w: 10, pts: [[90, 11529], [90, 11574]] },
  { id: 'center_promenade_2', cls: 'walk', w: 10, pts: [[90, 11586], [90, 12060]] },
  { id: 'aomi_dori', cls: 'avenue', w: 10, pts: [[170, 11580], [170, 12110]] },
  { id: 'aomi_minami', cls: 'street', w: 8, pts: [[0, 12060], [170, 12060]] },
];

// Tracks: { id, tracks, pts, style }. Styles: rail (ballast, sleepers, two rails a track; on a viaduct through
// the city: drawn over the roads, with its shadow), guideway (the automated line's concrete beams), crane (the
// gantries' two rails along the quay). An end must be on the strip's edge or under a plot (a station).
export const RAILS = [
  { id: 'chuo_sen', tracks: 4, pts: [[0, 160], [180, 160]] },
  { id: 'shinjuku_sen', tracks: 10, pts: [[0, 1266], [180, 1266]] },
  { id: 'yamanote_minami', tracks: 2, pts: [[180, 2140], [150, 2150], [115, 2190], [95, 2250], [95, 2820], [105, 2880], [136, 2960], [136, 3120], [154, 3200], [154, 3560], [164, 3620], [180, 3650]] },
  { id: 'tokyo_sen', tracks: 12, pts: [[0, 5990], [180, 5990]] },
  { id: 'yamanote_kita', tracks: 4, pts: [[156, 5990], [156, 7560], [166, 7620], [180, 7650]] },
  { id: 'sobu_sen', tracks: 2, pts: [[0, 6570], [180, 6570]] },
  { id: 'sobu_kyo', tracks: 2, pts: [[0, 10190], [180, 10190]] },
  { id: 'yurikamome', tracks: 2, style: 'guideway', pts: [[150, 11056], [150, 12000], [140, 12040], [110, 12048], [0, 12048]] },
  { id: 'gantry_rail', tracks: 1, style: 'crane', pts: [[52, 12160], [52, 12490]] },
];

// Plots: the ground a landmark stands on, [id, x, u, w, h, what]. The districts' own files (phases 2-7) draw the
// building on its plot; until then it is hatched. Plots never overlap, and none stands on a street (a station
// stands over its tracks, the bridge's pylons on its deck). low: nothing tall (allowed inside an arena).
export const PLOTS = [
  // Nakano
  ['nakano_eki', 30, 134, 100, 52, 'dworzec Nakano: perony pod dachami'],
  ['nakano_broadway', 62, 330, 56, 190, 'Nakano Broadway: bryła z mieszkaniami na dachu'],
  ['arai_yakushi', 4, 570, 30, 60, 'świątynia Arai Yakushi'],
  // Shinjuku
  ['nishi_a', 54, 752, 36, 106, 'wieżowiec'],
  ['nishi_b', 94, 752, 36, 106, 'wieżowiec w kształcie kokonu'],
  ['nishi_e', 150, 752, 28, 106, 'wieżowiec'],
  ['nishi_w', 2, 752, 34, 106, 'hotel-wieżowiec'],
  ['tocho', 58, 884, 68, 114, 'ratusz: bliźniacza wieża i plac w półkolu'],
  ['nishi_f', 150, 882, 28, 116, 'wieżowiec'],
  ['nishi_c', 54, 1022, 36, 136, 'wieżowiec'],
  ['nishi_d', 94, 1022, 36, 136, 'wieżowiec'],
  ['nishi_g', 150, 1022, 28, 136, 'wieżowiec'],
  ['nishi_v', 2, 1022, 34, 136, 'wieżowiec'],
  ['omoide_yokocho', 2, 1182, 16, 52, 'zaułek barów z dymem z rusztów'],
  ['shinjuku_eki_nishi', 22, 1196, 100, 40, 'dworzec, strona zachodnia: dom towarowy nad peronami'],
  ['shinjuku_eki_higashi', 22, 1296, 100, 38, 'dworzec, strona wschodnia'],
  ['basu_taminaru', 150, 1298, 28, 60, 'dworzec autobusowy nad torami'],
  ['depato_a', 20, 1346, 50, 46, 'dom towarowy z tarasem na dachu'],
  ['depato_b', 77, 1346, 52, 46, 'dom towarowy'],
  ['depato_c', 20, 1408, 50, 60, 'dom towarowy z markizami'],
  ['depato_d', 77, 1408, 52, 60, 'dom towarowy'],
  ['depato_e', 150, 1366, 28, 90, 'pasaż handlowy'],
  ['kabukicho_mon', 80, 1578, 24, 10, 'brama neonów Kabukichō', 'low'],
  ['kabukicho_a', 20, 1584, 56, 50, 'kwartał neonów'],
  ['kabukicho_b', 108, 1584, 22, 50, 'kwartał neonów'],
  ['kabukicho_c', 20, 1646, 56, 48, 'kino i salony gier'],
  ['kabukicho_d', 108, 1646, 22, 48, 'kwartał neonów'],
  ['kabukicho_e', 20, 1706, 56, 90, 'hotele i bary'],
  ['golden_gai', 150, 1584, 28, 100, 'Golden Gai: sześć zaułków malutkich barów'],
  ['gyoen_onshitsu', 20, 1990, 40, 30, 'szklarnia'],
  ['gyoen_chaya', 118, 1890, 18, 14, 'herbaciarnia nad stawem'],
  // Harajuku
  ['otorii', 34, 2290, 14, 6, 'wielka drewniana torii', 'low'],
  ['sake_daru', 20, 2330, 10, 26, 'ściana beczek sake', 'low'],
  ['meiji_honden', 16, 2404, 54, 70, 'Meiji Jingū: dziedziniec i pawilon główny'],
  ['harajuku_eki', 100, 2488, 16, 50, 'stacja Harajuku: drewniany budynek z wieżyczką'],
  ['takeshita_minami', 120, 2490, 38, 44, 'sklepiki Takeshita'],
  ['takeshita_kita', 104, 2546, 54, 36, 'naleśnikarnie i sklepiki Takeshita'],
  ['yoyogi_1', 14, 2770, 60, 56, 'hala Yoyogi: wiszący dach'],
  ['yoyogi_2', 20, 2836, 34, 30, 'mała hala Yoyogi'],
  // Shibuya
  ['shibuya_eki', 110, 2996, 60, 150, 'dworzec Shibuya'],
  ['moyai', 126, 3166, 8, 8, 'posąg Moyai', 'low'],
  ['hachiko', 112, 3236, 8, 8, 'piesek Hachikō na cokole', 'low'],
  ['shibuya_sw', 8, 3176, 44, 136, 'gmachy z ekranami (południowy zachód)'],
  ['shibuya_nw', 4, 3388, 36, 52, 'gmach z wielkim ekranem'],
  ['shibuya_n', 54, 3388, 24, 52, 'wieża mody na rozwidleniu'],
  ['shibuya_ne', 102, 3388, 44, 40, 'gmach z ekranami'],
  ['miyashita', 147, 3420, 14, 140, 'park na dachu nad torami'],
  // Minato
  ['roppongi_hills', 10, 3920, 60, 126, 'wieżowiec na wzgórzu z ogrodem'],
  ['midtown', 116, 4072, 52, 64, 'wieżowiec z parkiem'],
  ['tokyo_tower', 58, 4340, 64, 64, 'Tokyo Tower: cztery nogi kratownicy i pawilon pod nią'],
  ['zojoji_hondo', 60, 4700, 60, 56, 'Zōjō-ji: pawilon główny'],
  ['jizo', 124, 4690, 14, 80, 'rzędy figurek Jizō z wiatraczkami', 'low'],
  ['sangedatsumon', 76, 4840, 28, 20, 'brama Sangedatsumon'],
  // Chiyoda
  ['kokkai', 50, 4996, 80, 70, 'gmach parlamentu z piramidą na wieży'],
  ['seimon', 76, 5200, 28, 14, 'brama główna za mostem Nijūbashi'],
  ['tatsumi_yagura', 126, 5200, 14, 14, 'wieżyczka narożna na murze'],
  ['fujimi_yagura', 44, 5262, 18, 18, 'trzypiętrowa wieżyczka Fujimi'],
  ['kyuden', 58, 5300, 64, 60, 'pałac: sale pod miedzianymi dachami'],
  ['tenshudai', 80, 5640, 30, 30, 'kamienna podstawa dawnej wieży'],
  ['maru_biru_l', 8, 5806, 68, 40, 'biurowiec Marunouchi'],
  ['maru_biru_r', 104, 5806, 68, 40, 'biurowiec Marunouchi'],
  ['tokyo_eki', 12, 5902, 156, 46, 'dworzec Tokio: ceglany gmach z dwiema kopułami'],
  // Akihabara
  ['manseibashi', 16, 6164, 66, 12, 'ceglane arkady Manseibashi nad rzeką'],
  ['akiba_gamen', 4, 6410, 32, 62, 'gmach z ekranem pikselowym'],
  ['akiba_geemu', 46, 6300, 34, 94, 'salon gier: piętra automatów'],
  ['akiba_denki', 100, 6306, 20, 108, 'sklep z częściami: szpule, lampy, anteny'],
  ['akiba_eki', 112, 6530, 64, 80, 'stacja Akihabara pod skrzyżowaniem dwóch linii'],
  ['akiba_gacha', 46, 6670, 34, 84, 'hala automatów z kapsułkami'],
  ['akiba_gado', 100, 6626, 46, 66, 'stragany z elektroniką pod wiaduktem'],
  ['akiba_kissa', 4, 6770, 32, 110, 'kawiarnie: dziewczyny z ulotkami przed wejściem'],
  ['akiba_kita', 46, 6914, 34, 110, 'neony północnej części ulicy'],
  // Ueno
  ['ueno_eki', 116, 7470, 62, 96, 'dworzec Ueno'],
  ['saigo', 104, 7548, 6, 6, 'pomnik samuraja z psem', 'low'],
  ['bentendo', 42, 7642, 16, 16, 'świątynka Bentendō na wyspie'],
  ['zoo', 136, 7670, 42, 150, 'zoo: wybiegi, pandy'],
  ['toshogu', 100, 7770, 14, 26, 'złota kapliczka Tōshō-gū z latarniami'],
  ['hakubutsukan', 84, 7954, 84, 56, 'muzeum narodowe'],
  // Asakusa
  ['kappabashi_mise', 42, 8150, 22, 30, 'sklep z woskowym jedzeniem: filiżanki na dachu'],
  ['kaminarimon', 74, 8318, 32, 22, 'brama Kaminarimon z wielkim lampionem'],
  ['nakamise_l1', 72, 8346, 12, 288, 'stragany Nakamise'],
  ['nakamise_r1', 96, 8346, 12, 288, 'stragany Nakamise'],
  ['nakamise_l2', 72, 8648, 12, 236, 'stragany Nakamise'],
  ['nakamise_r2', 96, 8648, 12, 236, 'stragany Nakamise'],
  ['hozomon', 66, 8892, 48, 34, 'brama Hōzōmon z olbrzymimi sandałami'],
  ['gojunoto', 26, 8930, 30, 46, 'pięciopiętrowa pagoda'],
  ['chozuya', 124, 8996, 14, 14, 'studnia do obmyć pod daszkiem', 'low'],
  ['jokoro', 84, 9040, 12, 12, 'wielka kadzielnica', 'low'],
  ['hondo', 48, 9232, 84, 86, 'Sensō-ji: pawilon główny'],
  ['asakusa_jinja', 138, 9240, 12, 56, 'chram Asakusa'],
  ['hanayashiki', 4, 9336, 70, 130, 'stare wesołe miasteczko: karuzela, wieża, kolejka'],
  // the Sumida
  ['denpato', 136, 9900, 40, 64, 'wysoka wieża nadawcza i plac u jej stóp'],
  ['ryogoku_eki', 138, 10198, 40, 30, 'stacja Ryōgoku'],
  ['kokugikan', 138, 10254, 40, 50, 'hala sumo z zielonym dachem'],
  ['tsukiji', 2, 10600, 34, 50, 'targ rybny'],
  ['nakajima_chaya', 15, 10756, 10, 10, 'herbaciarnia na stawie', 'low'],
  // the bay and Odaiba
  ['shibaura_loop', 4, 10976, 28, 56, 'pętla wjazdowa na most'],
  ['rainbow_to_l', 42, 11038, 10, 24, 'pylon mostu'],
  ['rainbow_to_r', 128, 11038, 10, 24, 'pylon mostu'],
  ['liberty', 30, 11534, 14, 20, 'replika Statuy Wolności'],
  ['terebi', 8, 11592, 70, 70, 'budynek telewizji z kulą (bez logo)'],
  ['aqua', 100, 11592, 40, 60, 'pasaż handlowy nad plażą'],
  ['daiba_eki', 142, 11630, 16, 30, 'stacja kolejki'],
  ['fune_no_kagakukan', 10, 11790, 66, 70, 'muzeum w kształcie statku'],
  ['miraikan', 100, 11860, 44, 80, 'muzeum nauki z wielkim globusem'],
  ['telecom', 100, 11958, 36, 70, 'biurowiec-łuk'],
  ['aomi_eki', 142, 11990, 16, 30, 'stacja kolejki'],
  ['kontena_b', 60, 12110, 80, 50, 'stosy kontenerów'],
  ['gantry_1', 38, 12190, 30, 20, 'suwnica'],
  ['gantry_2', 38, 12420, 30, 20, 'suwnica'],
  ['kontena_r', 154, 12170, 24, 320, 'stosy kontenerów'],
];
