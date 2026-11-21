// The map's landmarks (docs/plan-mapa.md, iteration 5): a miniature by each city of a stage, of what its stage and
// its stamp are about, and of the famous places that have no stage. Drawn at 540 px like the close-up tiles, so in
// a region's view (18 fine pixels to a map unit, one to one with the screen) they are as sharp as the map under them.
// Each stands on its own little shadow; the game puts the foot of the frame (FOOT) on the place (src/data/japan.js,
// MARKS), so it sits on the map and moves with it.
import { Raster } from '../lib/raster.mjs';
import { HiSprite, tones, inPoly, hash } from '../lib/hisprite.mjs';

export const MARK_W = 42;
export const MARK_H = 48;
export const FOOT = 44; // the row the frame stands on (its anchor in the game: x the middle, y this)

const RAMPS = {
  wood: tones([0x2e1c12, 0x5a3a24, 0x8e6440]),
  hinoki: tones([0x7a5a34, 0xc49a62, 0xf2dcb0]),
  shingle: tones([0x2a2018, 0x4a3a2c, 0x7a6450]),
  tile: tones([0x1a1e2a, 0x363c52, 0x646c88]),
  greytile: tones([0x4c5262, 0x7c8496, 0xc4cad8]),
  copper: tones([0x23524a, 0x4a9480, 0x9cdcc4]),
  plaster: tones([0x9893a0, 0xe6e2da, 0xffffff]),
  verm: tones([0x7a1810, 0xd8401e, 0xff8a5a]),
  gold: tones([0x8a5a10, 0xe0aa2c, 0xfff2a0]),
  stone: tones([0x4a4650, 0x8a8690, 0xcac6cc]),
  tuff: tones([0x7a7060, 0xc8bca0, 0xf4ecd8]),
  pine: tones([0x12301e, 0x2a5e36, 0x5a9a58]),
  leaf: tones([0x1e4a1e, 0x3e8a34, 0x8ccc5a]),
  sugi: tones([0x0e2618, 0x204a2c, 0x467a4a]),
  sakura: tones([0xb05a7a, 0xf0a0bc, 0xffe4ee]),
  plum: tones([0xa04a6a, 0xf4c4d4, 0xffffff]),
  water: tones([0x163c66, 0x3474b0, 0x8ccaf0]),
  cobalt: tones([0x0c4a7a, 0x1e8ac8, 0x8ae4ff]),
  sand: tones([0x8a7450, 0xd0b888, 0xf6e8c4]),
  thatch: tones([0x4a3a22, 0x86683a, 0xc4a466]),
  tower: tones([0x8a2410, 0xe8521e, 0xffa064]),
  white: tones([0x8c90a4, 0xdadde8, 0xffffff]),
  glass: tones([0x203a5a, 0x5a8ab4, 0xd4f0ff]),
  rock: tones([0x2e2622, 0x5e5048, 0x968676]),
  slope: tones([0x24401e, 0x4a7a34, 0x8ab05a]),
  ash: tones([0x3e3a3e, 0x7a7478, 0xc4bec2]),
  rust: tones([0x5a2414, 0xb0482a, 0xe88a5a]),
  redtile: tones([0x7a2a18, 0xc85a34, 0xf0986a]),
  lacquer: tones([0x0e0c14, 0x221e2e, 0x484058]),
  deer: tones([0x4a2a14, 0x9a6232, 0xd8a468]),
  cat: tones([0x8a7a6a, 0xe8dccc, 0xffffff]),
  grass: tones([0x2a5a24, 0x4e9a3a, 0x9ad66a]),
  hibiscus: tones([0x7a0a1a, 0xe02a3a, 0xff9aa0]),
};

const CX = 21; // the middle of the frame
const left = (cx) => (px) => (px < cx ? 0.07 : -0.07); // the side towards the light a shade lighter

/** A rectangle of a material, lit a little from the left. */
function box(s, x0, y0, x1, y1, mat, v = 0.55, opts = {}) {
  const cx = (x0 + x1) / 2;
  return s.paint([x0, y0, x1 - 0.01, y1 - 0.01], () => true, mat, (px) => v + left(cx)(px), opts);
}

/**
 * A Japanese roof: the ridge (half-width hw·top) at y, the eaves th lower, their tips curling up by curl;
 * rows of tiles run down it, a shadow falls under its eaves on what is below.
 */
function roof(s, cx, y, hw, th, mat, { curl = 1.4, top = 0.42, rows = 2, v = 0.62, shadow = true } = {}) {
  const pts = [[cx - hw * top, y], [cx + hw * top, y], [cx + hw, y + th - curl], [cx + hw * 0.72, y + th], [cx - hw * 0.72, y + th], [cx - hw, y + th - curl]];
  s.poly(pts, mat, { flat: v, pat: (px, py) => -((py - y) / th) * 0.28 + left(cx)(px) });
  if (rows) s.shade([cx - hw, y, cx + hw, y + th], (px, py) => inPoly(pts, px, py) && Math.floor(px) % rows === 0 && py > y + 0.8, -0.13);
  // the ridge a line of light, the eave's edge a darker one
  s.shade([cx - hw, y, cx + hw, y + 1], (px, py) => inPoly(pts, px, py), 0.18);
  if (shadow) s.shade([cx - hw, y + th, cx + hw, y + th + 1.6], (px) => Math.abs(px - cx) < hw * 0.72, -0.3);
  return y;
}

/** A tree's crown: a few balls of leaves, lit from the top left, with darker hollows. */
function crown(s, blobs, mat, seed = 1) {
  blobs.forEach(([x, y, rx, ry], k) => s.ellipse(x, y, rx, ry ?? rx, mat, { tex: 0.35, seed: seed + k, texScale: 2 }));
}

/** A pine: a crooked trunk and flat clouds of needles. */
function pine(s, x, y, h, lean = 1, seed = 1) {
  s.tube(x, y, x + lean * 2, y - h * 0.55, 0.9, 'wood', { rb: 0.6 });
  s.tube(x + lean * 2, y - h * 0.55, x + lean * 0.5, y - h, 0.6, 'wood');
  const pads = [[x + lean * 0.5, y - h, h * 0.42, h * 0.17], [x + lean * 2.6, y - h * 0.62, h * 0.36, h * 0.15], [x - lean * 0.8, y - h * 0.4, h * 0.3, h * 0.13]];
  pads.forEach(([px, py, rx, ry], k) => s.ellipse(px, py, rx, ry, 'pine', { tex: 0.4, seed: seed + k, texScale: 1.6, bias: 0.05 }));
}

/** A tall cedar: a narrow dark cone. */
function cedar(s, x, y, h, w, seed = 1) {
  s.poly([[x, y - h], [x + w, y], [x - w, y]], 'sugi', { flat: 0.5, tex: 0.4, seed, texScale: 1.5, pat: left(x) });
}

/** A patch of still water: an ellipse, its ripples lighter rows. */
function pond(s, cx, cy, rx, ry, mat = 'water') {
  s.ellipse(cx, cy, rx, ry, mat, { flat: 0.5, pat: (px, py) => (Math.floor(py) % 3 === 0 && hash(Math.floor(px / 4), Math.floor(py), 3) > 0.5 ? 0.22 : 0) - ((py - cy + ry) / (2 * ry)) * 0.12 });
}

/** A ring of rope-bound bundles of stone round a castle: the base wall, sloping in, its blocks marked. */
function ishigaki(s, x0, x1, y0, y1, slope) {
  const pts = [[x0 + slope, y0], [x1 - slope, y0], [x1, y1], [x0, y1]];
  s.poly(pts, 'stone', { flat: 0.52, tex: 0.25, seed: 4, pat: (px, py) => ((Math.floor(py) % 2 === 0) && (Math.floor(px + (Math.floor(py / 2) % 2) * 1.5) % 3 === 0) ? -0.2 : 0) + left((x0 + x1) / 2)(px) });
}

/** A storey's wall with its windows: a row of dark squares (latticed) and the pillars between. */
function windows(s, x0, x1, y, every, c = 0x2a2230) {
  for (let x = x0; x <= x1; x += every) s.px(x, y, c).px(x + 1, y, c);
}

// ---- the landmarks

const ART = {
  /** Kyōto: Kinkaku-ji, the golden pavilion over its mirror pond, between pines on the islands. */
  kyoto(s) {
    pond(s, CX, 41, 20, 5.5);
    s.ellipse(5, 36, 5, 2, 'rock', { flat: 0.5 });
    s.ellipse(37, 37, 4.5, 2, 'rock', { flat: 0.5 });
    pine(s, 4, 36, 10, 1, 3);
    pine(s, 38, 37, 9, -1, 7);
    // the stone it stands on, at the water's edge
    box(s, 11, 35, 31, 37, 'stone', 0.5);
    // the ground floor: dark wood and white shoji
    box(s, 12, 31, 30, 35, 'plaster', 0.7);
    for (let x = 12; x <= 29; x += 3) s.line(x, 31, x, 34.5, 0x3a2418);
    s.line(12, 31, 29.5, 31, 0x3a2418);
    roof(s, CX, 27.5, 12.5, 3.5, 'shingle', { curl: 1, top: 0.7 });
    // the two upper floors in gold leaf, the first with its balcony
    box(s, 13, 23, 29, 27.5, 'gold', 0.6);
    s.line(12.5, 26, 29.5, 26, 0x6a4010);
    for (let x = 14; x <= 28; x += 2) s.px(x, 26.8, 0x6a4010);
    windows(s, 14.5, 27, 24, 3, 0x7a4a10);
    roof(s, CX, 19.5, 11, 3.5, 'shingle', { curl: 1.2, top: 0.6 });
    box(s, 15, 15, 27, 19.5, 'gold', 0.62);
    // (the bell-shaped windows of the top floor)
    for (const x of [17, 21, 25]) s.px(x, 16, 0x6a4010).px(x - 0.6, 17, 0x6a4010).px(x + 0.6, 17, 0x6a4010).px(x - 0.6, 18, 0x6a4010).px(x + 0.6, 18, 0x6a4010);
    roof(s, CX, 9.5, 9.5, 5.5, 'shingle', { curl: 1.4, top: 0.08, rows: 2 });
    // the phoenix on the top
    // (a bird with its wings raised and its tail swept back, not a cross)
    s.poly([[CX - 1.2, 9.6], [CX - 2.6, 6.4], [CX - 0.4, 7.6], [CX + 0.8, 6.2], [CX + 1.4, 7.8], [CX + 3, 8.4], [CX + 1.2, 9.6]], 'gold', { flat: 0.78 });
  },
  kyotoPost(r) {
    // the pavilion's gold in the water, broken by the ripples
    reflect(r, 12, 30, 38, 46, 0xe8b440, 0.4);
  },

  /** Ōsaka: the castle's keep, white walls under green copper roofs, its top storey black and gold, on its walls of stone. */
  osaka(s) {
    ishigaki(s, 6, 36, 33, 43, 2.5);
    box(s, 10, 28, 32, 33, 'plaster', 0.68);
    windows(s, 11.5, 30, 30, 4);
    roof(s, CX, 24.5, 13.5, 3.8, 'copper', { curl: 1.6 });
    // a gable on the front of the first roof
    s.poly([[CX - 3.5, 27.5], [CX, 23.5], [CX + 3.5, 27.5]], 'copper', { flat: 0.72 });
    s.poly([[CX - 2, 27], [CX, 25], [CX + 2, 27]], 'plaster', { flat: 0.7 });
    box(s, 12, 20.5, 30, 24.5, 'plaster', 0.7);
    windows(s, 13.5, 28, 22, 3);
    roof(s, CX, 17.5, 11.5, 3.3, 'copper', { curl: 1.4 });
    s.poly([[12, 20.5], [15, 17.5], [18, 20.5]], 'copper', { flat: 0.7 });
    s.poly([[24, 20.5], [27, 17.5], [30, 20.5]], 'copper', { flat: 0.7 });
    box(s, 14, 14, 28, 17.5, 'plaster', 0.72);
    windows(s, 15.5, 26, 15.5, 3);
    roof(s, CX, 11, 9.5, 3, 'copper', { curl: 1.3 });
    // the top storey black lacquer with its gold tigers and cranes
    box(s, 15.5, 7.5, 26.5, 11, 'lacquer', 0.5);
    for (let x = 16.5; x <= 25.5; x += 2) s.px(x, 8.5, 0xffd860).px(x + 0.5, 9.6, 0xe0a030);
    roof(s, CX, 3.5, 8.5, 4, 'copper', { curl: 1.5, top: 0.36 });
    s.line(CX - 3, 3.5, CX + 3, 3.5, 0xffe070);
    // the golden shachihoko at the ridge's ends
    s.dot(CX - 3.3, 2.6, 0.9, 0xffe070).dot(CX + 3.3, 2.6, 0.9, 0xffe070);
    s.px(CX - 4, 1.6, 0xfff2a0).px(CX + 3.6, 1.6, 0xfff2a0);
    // the gold on the eaves' tips
    for (const [x, y] of [[CX - 13.5, 26.9], [CX + 12.8, 26.9], [CX - 11.5, 19.4], [CX + 10.8, 19.4], [CX - 9.5, 12.7], [CX + 8.8, 12.7]]) s.px(x, y, 0xffe070);
  },

  /** Himeji: the White Heron, keeps of white plaster and pale grey roofs, gable over gable, the small keep beside. */
  himeji(s) {
    ishigaki(s, 3, 39, 35, 43, 2.5);
    // the small keep to the left, lower
    box(s, 4, 28, 13, 35, 'plaster', 0.72);
    windows(s, 5.5, 11, 31, 3);
    roof(s, 8.5, 25, 6.5, 3, 'greytile', { curl: 1.1 });
    box(s, 5.5, 21.5, 11.5, 25, 'plaster', 0.74);
    roof(s, 8.5, 18.5, 5, 3, 'greytile', { curl: 1 });
    // the main keep
    box(s, 14, 30, 36, 35, 'plaster', 0.7);
    windows(s, 15.5, 34, 32, 3.5);
    roof(s, 25, 26.5, 13, 3.6, 'greytile', { curl: 1.5 });
    s.poly([[16, 30], [19.5, 26], [23, 30]], 'greytile', { flat: 0.72 });
    s.poly([[27, 30], [30.5, 26], [34, 30]], 'greytile', { flat: 0.72 });
    box(s, 16, 22, 34, 26.5, 'plaster', 0.72);
    windows(s, 17.5, 32, 24, 3);
    roof(s, 25, 18.8, 11, 3.3, 'greytile', { curl: 1.4 });
    // a curved karahafu gable in the middle
    s.paint([20, 16, 30, 22], (x, y) => y > 18.5 + Math.abs(x - 25) * 0.15 && ((x - 25) / 4.6) ** 2 + ((y - 22) / 4) ** 2 <= 1 && y < 22, 'greytile', () => 0.75);
    box(s, 18, 14.5, 32, 18.8, 'plaster', 0.74);
    windows(s, 19.5, 30, 16.3, 3);
    roof(s, 25, 11.5, 9, 3, 'greytile', { curl: 1.3 });
    box(s, 19.5, 8, 30.5, 11.5, 'plaster', 0.75);
    windows(s, 21, 29, 9.5, 2.5);
    roof(s, 25, 3.5, 8.5, 4.5, 'greytile', { curl: 1.5, top: 0.32 });
    // the white lines of mortar on the ridges, the shachihoko
    for (const y of [3.5, 11.5, 18.8, 26.5]) s.line(25 - 2.5, y, 25 + 2.5, y, 0xf4f6fa);
    s.dot(25 - 2.7, 2.7, 0.8, 0x4a4a58).dot(25 + 2.7, 2.7, 0.8, 0x4a4a58);
  },

  /** Tōkyō: Tokyo Tower, in white and international orange, standing on its building. */
  tokyo(s) {
    const half = (y) => 1.1 + 13 * Math.max(0, (y - 1) / 40) ** 1.8;
    // the four legs (two seen), as tubes along the tower's curve
    for (const side of [-1, 1]) {
      for (let y = 40; y > 12; y -= 2) s.tube(CX + side * half(y), y, CX + side * half(y - 2), y - 2, y > 30 ? 1.1 : 0.75, 'tower');
      s.tube(CX + side * half(12), 12, CX + side * 0.5, 4, 0.55, 'tower');
    }
    // the main deck and the top deck
    box(s, CX - 6.5, 23, CX + 6.5, 27.5, 'white', 0.66);
    s.line(CX - 6, 24.5, CX + 6, 24.5, 0x3a6aa0).line(CX - 6, 26, CX + 6, 26, 0x3a6aa0);
    box(s, CX - 3, 11, CX + 3, 13.6, 'white', 0.66);
    s.line(CX - 2.5, 12.2, CX + 2.5, 12.2, 0x3a6aa0);
    // the antenna, white and orange
    s.tube(CX, 4.5, CX, 0.5, 0.45, 'white');
    for (let y = 1; y < 4.5; y += 2) s.px(CX, y, 0xe8521e);
    // the building at its feet
    box(s, 8, 37, 34, 44, 'plaster', 0.62);
    for (let y = 38.5; y < 43.5; y += 2) for (let x = 9.5; x < 33; x += 2) s.px(x, y, 0x4a6890);
    s.line(8, 37, 33.6, 37, 0x8a8a96);
  },
  tokyoPost(r) {
    // the lattice: crossed braces between the legs, in bands of orange and white
    const half = (y) => 1.1 + 13 * Math.max(0, (y - 1) / 40) ** 1.8;
    for (let y = 36; y > 12; y -= 3) {
      const band = Math.floor((40 - y) / 6) % 2 ? 0xfaf6f0 : 0xe8521e;
      const [a, b] = [half(y), half(y - 3)];
      line(r, CX - a, y, CX + b, y - 3, band, 0.85);
      line(r, CX + a, y, CX - b, y - 3, band, 0.85);
    }
    // the bands on the legs themselves
    for (let y = 13; y < 37; y += 1) if (Math.floor((40 - y) / 6) % 2) for (const sd of [-1, 1]) r.set(Math.round(CX + sd * half(y) - 0.5), y, 0xf4f0ea, 0.85);
  },

  /** Sapporo: the TV tower with its clock, over Ōdōri Park's flower beds and fountain. */
  sapporo(s) {
    // the park: a long strip of lawn, the beds, a fountain
    s.poly([[1, 39], [41, 39], [41, 44], [1, 44]], 'grass', { flat: 0.55, tex: 0.25, seed: 6 });
    pond(s, 33, 41.5, 4, 1.6, 'water');
    const half = (y) => 1 + 8 * Math.max(0, (y - 4) / 35) ** 1.6;
    for (const side of [-1, 1]) for (let y = 40; y > 9; y -= 2) s.tube(CX + side * half(y), y, CX + side * half(y - 2), y - 2, y > 30 ? 1 : 0.7, 'rust');
    // the observation deck, the clock under it
    box(s, CX - 4.5, 11, CX + 4.5, 14.5, 'rust', 0.6);
    s.line(CX - 4, 12.4, CX + 4, 12.4, 0x9ad0f0);
    box(s, CX - 5.5, 17, CX + 5.5, 21.5, 'white', 0.75);
    // the clock's figures in lights
    for (const [x, d] of [[-4, '1'], [-2, '2'], [1, '3'], [3, '0']]) digit(s, CX + x, 18, d);
    s.px(CX - 0.5, 18.5, 0x2a2a3a).px(CX - 0.5, 20, 0x2a2a3a);
    s.tube(CX, 11, CX, 2.5, 0.5, 'rust');
    s.tube(CX, 4, CX, 0.5, 0.35, 'white');
  },
  sapporoPost(r) {
    const half = (y) => 1 + 8 * Math.max(0, (y - 4) / 35) ** 1.6;
    for (let y = 38; y > 22; y -= 3) {
      const [a, b] = [half(y), half(y - 3)];
      line(r, CX - a, y, CX + b, y - 3, 0xc85a34, 0.9);
      line(r, CX + a, y, CX - b, y - 3, 0xc85a34, 0.9);
    }
    // the flower beds of tulips in rows, the fountain's jets
    for (let x = 3; x < 28; x += 1) {
      const c = [0xff4a5a, 0xffd040, 0xffffff, 0xf080c0][Math.floor(x / 3) % 4];
      if (Math.abs(x - CX) > 3) for (const y of [40, 42]) if (hash(x, y, 9) > 0.25) r.set(x, y, c);
    }
    for (const dx of [-1, 0, 1]) for (let y = 37; y < 41; y++) r.set(33 + dx, y - Math.abs(dx), 0xe8f6ff, 0.7);
  },

  /** Kawaguchiko: the red Chūreitō pagoda above the town, in cherry blossom. */
  kawaguchiko(s) {
    crown(s, [[7, 37, 6, 4], [4, 33, 4, 3], [11, 34, 4, 3]], 'sakura', 2);
    crown(s, [[35, 37, 6, 4], [38, 33, 4, 3], [31, 34, 4, 3]], 'sakura', 5);
    box(s, 15, 40, 27, 43, 'stone', 0.5);
    let y = 40;
    const steps = [[4.2, 10, 4], [3.7, 9, 3.6], [3.3, 8, 3.4], [2.9, 7.2, 3.2], [2.5, 6.5, 3]];
    for (const [bw, hw, bh] of steps) {
      box(s, CX - bw, y - bh, CX + bw, y, 'verm', 0.6);
      s.line(CX - bw + 1, y - bh + 1, CX - bw + 1, y - 0.5, 0x5a1008).line(CX + bw - 1.5, y - bh + 1, CX + bw - 1.5, y - 0.5, 0x5a1008);
      y -= bh;
      roof(s, CX, y - 2.2, hw, 2.6, 'tile', { curl: 1.3, top: 0.3 });
      y -= 2.2;
    }
    spire(s, CX, y, 7);
    crown(s, [[CX - 9, 41, 4, 2.5], [CX + 9, 41, 4, 2.5]], 'sakura', 9);
  },

  /** Onomichi: the three-storey pagoda of Tennei-ji on the hillside, its stone steps and a cat on them. */
  onomichi(s) {
    s.poly([[0, 44], [0, 30], [12, 26], [30, 30], [42, 36], [42, 44]], 'slope', { flat: 0.5, tex: 0.35, seed: 11, texScale: 2 });
    // the steps climbing in a zigzag, stone walls beside
    for (let k = 0; k < 7; k++) box(s, 26 - k * 1.5, 43 - k * 2, 37 - k * 1.5, 44 - k * 2, 'stone', 0.6 - (k % 2) * 0.08);
    crown(s, [[4, 30, 4, 3], [9, 28, 3, 2.5]], 'leaf', 4);
    crown(s, [[38, 33, 4, 3]], 'sakura', 7);
    let y = 33;
    for (const [bw, hw, bh] of [[4.5, 10, 4.5], [3.8, 8.5, 4], [3.2, 7, 3.6]]) {
      box(s, CX - 4 - bw, y - bh, CX - 4 + bw, y, 'wood', 0.55);
      s.line(CX - 4 - bw + 1, y - bh + 1.2, CX - 4 + bw - 1, y - bh + 1.2, 0xe8e0d0);
      y -= bh;
      roof(s, CX - 4, y - 2.4, hw, 2.8, 'tile', { curl: 1.4, top: 0.3 });
      y -= 2.4;
    }
    spire(s, CX - 4, y, 7);
    // the cat, white with a ginger patch, sitting on the steps looking out
    s.ellipse(31, 34.5, 1.8, 1.6, 'cat', { bias: 0.1 });
    s.ellipse(31.3, 32.3, 1.3, 1.2, 'cat', { bias: 0.1 });
    s.px(30.4, 30.9, 0xe8dccc).px(32.2, 30.9, 0xe8dccc);
    s.px(31.6, 32, 0xe0902a).px(32, 32.5, 0xe0902a).px(30.6, 35, 0xe0902a);
    s.line(32.6, 35.6, 34, 34.4, 0xe8dccc);
  },

  /** Hiroshima (and Miyajima): the great torii of Itsukushima standing in the sea, a deer on the shore. */
  hiroshima(s) {
    pond(s, CX + 2, 40, 19, 5, 'water');
    s.ellipse(4, 39.5, 5, 2.3, 'sand', { flat: 0.6 });
    // the deer on the sand
    s.ellipse(4, 37, 1.8, 1, 'deer', { bias: 0.1 });
    s.line(2.8, 37.6, 2.8, 39, 0x4a2a14).line(5, 37.6, 5, 39, 0x4a2a14);
    s.tube(5.4, 36.5, 6.2, 35, 0.5, 'deer').ellipse(6.6, 34.7, 0.8, 0.6, 'deer');
    s.px(6.4, 33.6, 0x4a2a14).px(7, 33.4, 0x4a2a14);
    for (const x of [3, 4.4]) s.px(x, 36.6, 0xf4e0c0);
    // the torii: the two great pillars, the four props round them
    for (const x of [13, 29]) {
      s.tube(x, 38, x, 15, 1.4, 'verm', { rb: 1.2 });
      s.tube(x - 2.6, 38.5, x - 2.6, 28, 0.7, 'verm').tube(x + 2.6, 38.5, x + 2.6, 28, 0.7, 'verm');
      s.line(x - 2.6, 29.5, x + 2.6, 29.5, 0xb02a14).line(x - 2.6, 33, x + 2.6, 33, 0xb02a14);
      s.line(x - 1.2, 37.6, x + 1.2, 37.6, 0x1a1414);
    }
    // the lower beam, the plaque, the double lintel black on top, its ends sweeping up
    box(s, 9, 20.5, 33, 22.5, 'verm', 0.62);
    box(s, 19.5, 15.5, 22.5, 20.5, 'lacquer', 0.5);
    s.line(20.3, 16.5, 21.7, 16.5, 0xffd860).line(20.3, 18, 21.7, 18, 0xffd860).line(20.3, 19.4, 21.7, 19.4, 0xffd860);
    box(s, 8.5, 14, 33.5, 15.8, 'verm', 0.62);
    s.poly([[3.5, 10], [CX, 12.3], [38.5, 10], [38, 12.6], [CX, 14.2], [4, 12.6]], 'lacquer', { flat: 0.55, pat: (px, py) => (py < 11.5 ? 0.15 : 0) });
  },
  hiroshimaPost(r) {
    reflect(r, 11, 31, 37, 46, 0xd8401e, 0.38);
  },

  /** Fukuoka: Fukuoka Tower, a tall prism of mirror glass on the beach of Momochi, a plum tree in flower. */
  fukuoka(s) {
    pond(s, 30, 42, 13, 3.5, 'water');
    s.poly([[0, 44], [0, 40], [16, 39], [26, 40.5], [22, 44]], 'sand', { flat: 0.62, tex: 0.2, seed: 3 });
    // the tower: a narrow prism, its glass catching the sky in diagonal bands
    s.poly([[CX - 3.6, 41], [CX - 2.6, 6], [CX + 2.6, 6], [CX + 3.6, 41]], 'glass', { flat: 0.55, pat: (px, py) => ((Math.floor(py - px * 0.6) % 7 + 7) % 7 < 2 ? 0.25 : 0) + (px < CX ? 0.12 : -0.1) });
    s.line(CX, 6, CX, 41, 0x9ac0e0);
    // the observation room near the top, the antenna
    box(s, CX - 3.4, 7.5, CX + 3.4, 10.5, 'glass', 0.38);
    s.line(CX - 3, 9, CX + 3, 9, 0xfff0b0);
    s.tube(CX, 6, CX, 1, 0.5, 'white');
    box(s, CX - 6, 40, CX + 6, 44, 'plaster', 0.66);
    s.line(CX - 5, 41.5, CX + 5, 41.5, 0x5a7aa0);
    // the plum: dark crooked branches, white-pink flowers
    s.tube(6, 40, 7, 34, 0.9, 'wood').tube(7, 35, 3, 30, 0.6, 'wood').tube(7, 34, 11, 30, 0.6, 'wood');
    crown(s, [[3, 30, 2.6, 2], [11, 30, 2.6, 2], [7, 31, 3, 2]], 'plum', 8);
  },
  fukuokaPost(r) {
    for (let k = 0; k < 14; k++) r.set(1 + hash(k, 1, 4) * 12, 28 + hash(k, 2, 4) * 5, 0xd03060);
  },

  /** Beppu: the cobalt pond of Umi Jigoku among its rocks, the steam rising off it, a bathhouse beside. */
  beppu(s) {
    s.ellipse(17, 39, 15, 5.5, 'rock', { tex: 0.4, seed: 5, texScale: 1.5 });
    pond(s, 17, 39, 12.5, 4, 'cobalt');
    // the bathhouse: dark wood, a thatched roof
    box(s, 29, 31, 39, 39, 'wood', 0.55);
    box(s, 31, 34, 34, 39, 'plaster', 0.4);
    s.line(35.5, 33, 37.5, 33, 0xe8d8b0).line(35.5, 35, 37.5, 35, 0xe8d8b0);
    roof(s, 34, 26, 7.5, 5, 'thatch', { curl: 0.8, top: 0.2, rows: 0 });
    s.line(34 - 1.5, 26, 34 + 1.5, 26, 0x3a2a14);
    // a noren curtain at the door
    s.line(31.2, 34.5, 33.8, 34.5, 0x2a4aa0).line(31.2, 35.5, 33.8, 35.5, 0x2a4aa0);
    s.ellipse(4, 38, 3, 2, 'rock', { flat: 0.6 });
    crown(s, [[3, 34, 3, 2.5]], 'leaf', 3);
  },
  beppuPost(r) {
    // steam: soft white puffs climbing off the pond, leaning in the wind
    for (let k = 0; k < 3; k++) {
      const x0 = 10 + k * 6;
      for (let y = 37; y > 6 + k * 5; y -= 1) {
        const t = (37 - y) / 30;
        const x = x0 + t * 7 + Math.sin(y * 0.45 + k * 2) * (1 + t * 2);
        const rad = 1.2 + t * 2.5;
        const a = 0.22 * (1 - t * 0.7);
        for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) if (dx * dx + dy * dy <= rad * rad) r.set(Math.round(x + dx), Math.round(y + dy), 0xffffff, a * 0.35);
      }
    }
  },

  /** Kagoshima: Sakurajima over its bay, the ash rising off Minami-dake, a ferry crossing. */
  kagoshima(s) {
    pond(s, CX, 41, 20, 4.5, 'water');
    // the island's cone: green lower slopes, bare rock above, two peaks and the crater
    s.poly([[2, 41], [12, 30], [17, 22], [CX - 1, 20.5], [CX + 2, 22], [CX + 4, 21], [27, 24], [32, 31], [40, 41]], 'slope', { flat: 0.55, tex: 0.35, seed: 8, texScale: 2, pat: (px) => (px < CX ? 0.1 : -0.12) });
    s.poly([[13, 29], [17, 22], [CX - 1, 20.5], [CX + 2, 22], [CX + 4, 21], [27, 24], [30, 29], [25, 27], [CX, 28], [17, 27]], 'rock', { flat: 0.55, tex: 0.3, seed: 2, pat: (px) => (px < CX ? 0.1 : -0.12) });
    // the gullies down the slopes
    for (const [x0, x1] of [[17, 12], [CX, 18], [24, 28], [27, 33]]) s.line(x0, 24, x1, 34, 0x3a3020, 1, 0.5);
    // the ferry, white, its wake
    box(s, 8, 40, 14, 41.6, 'white', 0.7);
    box(s, 9.5, 38.6, 12.5, 40, 'white', 0.8);
    s.px(11, 38, 0xd84030);
  },
  kagoshimaPost(r) {
    // the ash: grey billows leaning away to the south-east
    for (let y = 21; y > 1; y -= 1) {
      const t = (21 - y) / 20;
      const x = CX + 3 + t * 9 + Math.sin(y * 0.6) * t * 1.5;
      const rad = 1 + t * 4;
      for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) if (dx * dx + dy * dy <= rad * rad) {
        const shade = dy < -rad * 0.2 && dx < 0 ? 0xc4bec2 : 0x7a7478;
        r.set(Math.round(x + dx), Math.round(y + dy), shade, 0.16 + 0.1 * (1 - t));
      }
    }
    for (let x = 14; x < 19; x++) r.set(x, 41, 0xe0f0ff, 0.6);
  },

  /** Nagasaki: Megane-bashi, the spectacles bridge, its two stone arches making circles with their reflections. */
  nagasaki(s) {
    // the Nakashima river between its stone banks
    s.poly([[0, 31], [42, 31], [42, 41], [36, 45], [6, 45], [0, 41]], 'water', { flat: 0.48, pat: (px, py) => (Math.floor(py) % 3 === 0 && hash(Math.floor(px / 5), Math.floor(py), 5) > 0.55 ? 0.2 : 0) });
    box(s, 0, 27, 5, 32, 'stone', 0.58);
    box(s, 37, 27, 42, 32, 'stone', 0.58);
    // under the arches the dark of their vaults
    for (const ax of [13.5, 28.5]) s.paint([ax - 7, 24, ax + 7, 31], (x, y) => (x - ax) ** 2 + (y - 31) ** 2 < 6.2 ** 2, 'rock', (px) => 0.18 + (px - ax) * 0.02);
    // the bridge: a deck of stone over two round arches, the voussoirs marked round them
    s.paint([4, 22, 38, 31], (x, y) => {
      for (const ax of [13.5, 28.5]) if ((x - ax) ** 2 + (y - 31) ** 2 < 6.2 ** 2) return false;
      return true;
    }, 'stone', (px, py) => 0.58 + left(CX)(px) + (Math.floor(py) % 2 === 0 && Math.floor(px + (Math.floor(py / 2) % 2) * 1.5) % 3 === 0 ? -0.15 : 0));
    for (const ax of [13.5, 28.5]) for (let a = Math.PI * 1.05; a < Math.PI * 1.96; a += 0.16) s.px(ax + Math.cos(a) * 7, 31 + Math.sin(a) * 7, 0x5a5660);
    s.line(4, 22, 37.6, 22, 0xd8d4d8);
    for (let x = 5; x < 38; x += 2) s.px(x, 21.2, 0x8a8690);
    // a willow on the bank, its threads hanging
    s.tube(3, 27, 3.5, 17, 0.8, 'wood');
    crown(s, [[4, 17, 4, 3]], 'leaf', 6);
  },
  nagasakiPost(r) {
    // the arches seen again in the water, closing them into the two circles of the spectacles
    for (const ax of [13.5, 28.5]) {
      for (let y = 31; y < 38; y++)
        for (let x = Math.round(ax - 7); x <= ax + 7; x++) {
          const d = Math.hypot(x + 0.5 - ax, y + 0.5 - 31);
          if (y % 3 === 2) continue;
          if (d < 6.2) r.set(x, y, 0x1a2a40, 0.45);
          else if (d < 7.6) r.set(x, y, 0xb8b4bc, 0.6);
        }
    }
    // the willow's threads
    for (let k = 0; k < 7; k++) line(r, 1 + k, 18, 1 + k + 0.5, 22 + (k % 3) * 2, 0x5aa040, 0.9);
  },

  /** Okinawa: Shurei-mon, the gate of Shuri castle, red under two roofs of red tiles, hibiscus beside. */
  okinawa(s) {
    s.poly([[0, 44], [0, 39], [42, 39], [42, 44]], 'stone', { flat: 0.6, tex: 0.2, seed: 2 });
    crown(s, [[4, 36, 4, 3.5], [38, 36, 4, 3.5]], 'leaf', 3);
    // the four pillars, the beams, the plaque between the roofs
    for (const x of [9, 17, 25, 33]) s.tube(x, 40, x, 22, 1.1, 'verm');
    box(s, 7, 22, 35, 24.5, 'verm', 0.58);
    roof(s, CX, 18.5, 16, 4.2, 'redtile', { curl: 1.6, top: 0.55 });
    box(s, 15, 12.5, 27, 18.5, 'lacquer', 0.5);
    s.line(16.5, 14.5, 25.5, 14.5, 0xffd860).line(16.5, 16.5, 25.5, 16.5, 0xffd860);
    roof(s, CX, 7.5, 12, 5, 'redtile', { curl: 1.8, top: 0.38 });
    // the white mortar on the tiles, the ridge's curled ends
    for (const y of [7.5, 18.5]) s.line(CX - 4, y, CX + 4, y, 0xf6f0e8);
    s.dot(CX - 4.6, 6.8, 0.8, 0xf6f0e8).dot(CX + 4.6, 6.8, 0.8, 0xf6f0e8);
    for (const x of [9, 17, 25, 33]) box(s, x - 1.5, 39, x + 1.5, 41, 'stone', 0.45);
  },
  okinawaPost(r) {
    for (const [cx, cy] of [[3, 35], [6, 37], [2, 38], [37, 35], [40, 37], [36, 38]]) {
      r.set(cx, cy, 0xe02a3a);
      r.set(cx + 1, cy, 0xff6a70);
    }
  },

  /** Ise: the inner shrine, plain hinoki under a thatched roof with its crossed chigi and billets, in the cedars. */
  ise(s) {
    for (const [x, h, w, k] of [[5, 34, 4, 1], [11, 38, 4.5, 2], [31, 37, 4.5, 3], [37, 33, 4, 4], [21, 30, 4, 5]]) cedar(s, x, 40, h, w, k);
    s.poly([[0, 44], [0, 40], [42, 40], [42, 44]], 'sand', { flat: 0.7, pat: (px, py) => (Math.floor(px + py) % 3 === 0 ? -0.08 : 0) });
    // the fence of plain boards
    for (let x = 6; x <= 36; x += 2) s.line(x, 36, x, 41, 0xd8b884);
    s.line(6, 36.5, 36, 36.5, 0xa88050);
    // the hall raised on its posts
    for (const x of [12, 17, 25, 30]) s.tube(x, 37, x, 30, 0.6, 'hinoki');
    box(s, 11, 26, 31, 31, 'hinoki', 0.62);
    for (let x = 13; x < 30; x += 3) s.line(x, 26.5, x, 30.5, 0x9a7444);
    s.line(11, 31, 30.6, 31, 0x7a5a34);
    // the thatched roof, straight, deep
    s.poly([[9, 26.5], [14, 18], [28, 18], [33, 26.5]], 'thatch', { flat: 0.6, tex: 0.3, seed: 6, texScale: 1.2, pat: (px) => (Math.floor(px) % 2 ? -0.06 : 0.04) });
    // the ridge with its billets (katsuogi), gold-tipped, and the chigi crossing up at the gables
    box(s, 13.5, 16.5, 28.5, 18.2, 'hinoki', 0.6);
    for (let x = 15.5; x <= 26.5; x += 2.2) {
      s.tube(x, 16, x, 14.5, 0.75, 'hinoki');
      s.px(x, 14.4, 0xffe070);
    }
    s.tube(14.5, 18, 11.5, 11, 0.55, 'hinoki').tube(14.5, 18, 17, 11.5, 0.55, 'hinoki');
    s.tube(27.5, 18, 30.5, 11, 0.55, 'hinoki').tube(27.5, 18, 25, 11.5, 0.55, 'hinoki');
  },

  /** Nikkō: Yōmei-mon of Tōshō-gū, white and gold, carved and painted all over, under black roofs, in the cedars. */
  nikko(s) {
    for (const [x, h, w, k] of [[4, 38, 4.5, 1], [38, 38, 4.5, 2], [9, 30, 3.5, 3], [33, 30, 3.5, 4]]) cedar(s, x, 42, h, w, k);
    // the stone steps
    for (let k = 0; k < 3; k++) box(s, 9 - k * 1.5, 39 + k * 1.5, 33 + k * 1.5, 40.5 + k * 1.5, 'stone', 0.62 - k * 0.05);
    // the lower storey: white pillars, the gate's dark opening
    box(s, 11, 29, 31, 39, 'white', 0.72);
    box(s, 17.5, 31, 24.5, 39, 'lacquer', 0.4);
    for (const x of [11.5, 16, 26, 30.5]) s.line(x, 29, x, 39, 0xc8ccd8);
    // the brackets, a band of gold and colour
    box(s, 10, 26, 32, 29, 'gold', 0.6);
    for (let x = 10.5; x < 32; x += 1.5) s.px(x, 27, [0x2a8a5a, 0xd8401e, 0x3a6ad0, 0xffffff][Math.floor(x) % 4]).px(x + 0.7, 28, 0x6a4010);
    roof(s, CX, 22.5, 14, 3.5, 'lacquer', { curl: 1.6, top: 0.5 });
    s.line(CX - 14, 25.2, CX + 14, 25.2, 0xe0aa2c);
    // the upper storey, the balcony's railing, the carvings
    box(s, 13, 16, 29, 22.5, 'white', 0.74);
    s.line(12.5, 21.5, 29.5, 21.5, 0xe0aa2c);
    for (let x = 14; x < 29; x += 1.5) s.px(x, 18, [0xd8401e, 0x2a8a5a, 0xe0aa2c, 0x3a6ad0][Math.floor(x * 2) % 4]).px(x + 0.5, 19.5, 0xe0aa2c);
    box(s, 12.5, 13.5, 29.5, 16, 'gold', 0.62);
    // the curved karahafu roof on top, gold on its edge
    s.paint([4, 4, 38, 14], (x, y) => y <= 13.5 && y >= 5 + Math.abs(x - CX) ** 1.6 * 0.035 + (Math.abs(x - CX) > 9 ? (Math.abs(x - CX) - 9) * 0.3 : 0) && Math.abs(x - CX) <= 14.5, 'lacquer', (px, py) => 0.62 - (py - 5) * 0.03 + left(CX)(px));
    s.line(CX - 14, 13.5, CX + 14, 13.5, 0xe0aa2c);
    s.dot(CX, 6, 1, 0xffe070);
  },

  /** Matsushima: islets of white tuff worn by the sea, crowned with pines, the red bridge to one, a boat going round. */
  matsushima(s) {
    pond(s, CX, 39, 21, 7, 'water');
    // three islets, cliffs of pale rock undercut at the waterline
    for (const [x, y, w, h, k] of [[10, 38, 6, 8, 1], [27, 35, 5, 7, 2], [36, 41, 3.5, 4.5, 3]]) {
      s.poly([[x - w, y], [x - w + 1, y - h * 0.6], [x - w * 0.5, y - h], [x + w * 0.6, y - h], [x + w, y - h * 0.5], [x + w - 0.6, y]], 'tuff', { flat: 0.6, tex: 0.3, seed: k, pat: (px, py) => (px < x ? 0.12 : -0.12) + (Math.floor(py) % 2 && hash(Math.floor(px), Math.floor(py), k) > 0.7 ? -0.2 : 0) });
      s.shade([x - w, y - 1.2, x + w, y], () => true, -0.3);
      pine(s, x - 1, y - h + 0.5, h * 0.9, 1, k * 3);
      pine(s, x + w * 0.4, y - h + 0.5, h * 0.7, -1, k * 5);
    }
    // the red Fukuura bridge to the first islet
    s.line(0, 34, 4, 33.2, 0xd8401e, 1);
    s.line(0, 34.8, 4, 34, 0x7a1810, 1);
    for (const x of [1, 3]) s.line(x, 34.5, x, 37, 0x7a1810);
    // the sightseeing boat
    box(s, 15, 42, 23, 43.6, 'white', 0.72);
    box(s, 17, 40.4, 21.5, 42, 'white', 0.82);
    s.line(17.5, 41, 21, 41, 0x3a6aa0);
  },
  matsushimaPost(r) {
    for (let x = 23; x < 31; x++) if (hash(x, 3, 6) > 0.3) r.set(x, 43 + (x % 2), 0xe8f6ff, 0.55);
    for (let k = 0; k < 6; k++) r.set(24 + k * 1.5, 46, 0xc8e8ff, 0.4);
  },

  /** Kanazawa: Kenroku-en's kotoji lantern, one leg in the pond and one on a stone, by the pine held up by its ropes. */
  kanazawa(s) {
    pond(s, 17, 40, 16, 5, 'water');
    s.ellipse(32, 41, 9, 3.5, 'grass', { tex: 0.3, seed: 4 });
    // the pine: a low spreading crown, the pole in the middle and the ropes (yukitsuri) from its top
    s.tube(32, 41, 31, 30, 1.1, 'wood');
    crown(s, [[31, 29, 8, 3.5], [27, 32, 5, 2.4], [36, 32, 5, 2.4]], 'pine', 7);
    s.tube(31, 30, 31, 9, 0.45, 'hinoki');
    // stepping stones, a rock
    s.ellipse(25, 41.5, 1.5, 0.8, 'stone', { flat: 0.7 }).ellipse(22, 43, 1.5, 0.8, 'stone', { flat: 0.7 });
    s.ellipse(14, 38.5, 3.5, 2.4, 'stone', { tex: 0.3, seed: 2 });
    // the lantern: two legs of unequal length like a koto's bridge, a broad cap
    s.tube(10, 41, 11, 30.5, 0.75, 'stone').tube(15, 37, 14.5, 30.5, 0.8, 'stone');
    box(s, 8.5, 29, 17, 30.5, 'stone', 0.6);
    box(s, 10, 25.5, 15.5, 29, 'stone', 0.55);
    s.px(12.5, 27, 0x2a2a30).px(13, 27, 0x2a2a30).px(12.5, 28, 0xfff0a0);
    s.poly([[7, 25.5], [10, 22.5], [15.5, 22.5], [18.5, 25.5]], 'stone', { flat: 0.68 });
    s.ellipse(12.7, 21.5, 1.4, 1.3, 'stone', { bias: 0.1 });
  },
  kanazawaPost(r) {
    // the ropes from the pole's top to the crown's edge, a cone of fine straw lines
    for (let k = 0; k <= 6; k++) line(r, 31, 9.5, 23 + k * 2.7, 27 + Math.abs(k - 3) * 0.6, 0xd8c890, 0.45);
    reflect(r, 8, 18, 41, 46, 0xb8b4bc, 0.3);
  },
};

/** A pagoda's spire (sōrin): a bronze pole with its nine rings, standing at (x, y), h tall. */
function spire(s, x, y, h) {
  s.tube(x, y, x, y - h, 0.45, 'gold');
  for (let k = 1; k < h - 1; k += 0.8) s.px(x - 0.7, y - k, 0x8a5a10).px(x + 0.5, y - k, 0xe0aa2c);
  s.dot(x, y - h, 0.8, 0xfff2a0);
}

/** A seven-segment figure of the clock, 2 wide and 3 tall, in orange light. */
function digit(s, x, y, d) {
  const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd' };
  const c = 0xff7a20;
  const on = (k) => SEG[d].includes(k);
  if (on('a')) s.px(x, y, c).px(x + 1, y, c);
  if (on('g')) s.px(x, y + 1.5, c).px(x + 1, y + 1.5, c);
  if (on('d')) s.px(x, y + 3, c).px(x + 1, y + 3, c);
  if (on('b')) s.px(x + 1.5, y + 0.6, c);
  if (on('c')) s.px(x + 1.5, y + 2.2, c);
  if (on('f')) s.px(x - 0.5, y + 0.6, c);
  if (on('e')) s.px(x - 0.5, y + 2.2, c);
}

/** A thin line on the finished frame (no outline round it), source-over. */
function line(r, x0, y0, x1, y1, c, a = 1) {
  const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2) || 1;
  const seen = new Set();
  for (let k = 0; k <= n; k++) {
    const x = Math.round(x0 + ((x1 - x0) * k) / n);
    const y = Math.round(y0 + ((y1 - y0) * k) / n);
    if (seen.has(x * 1000 + y)) continue;
    seen.add(x * 1000 + y);
    r.set(x, y, c, a);
  }
}

/** What stands over water seen again in it: its colour in streaks, broken by the ripples, on the water's pixels. */
function reflect(r, x0, x1, y0, y1, c, a) {
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++) {
      if (r.alpha(x, y) < 200 || y % 3 === 1 || hash(Math.floor(x / 3), y, 8) < 0.3) continue;
      const px = r.get(x, y);
      const b = px & 255;
      if (b < ((px >> 16) & 255) + 30) continue; // (only on blue water)
      r.set(x, y, c, a * (1 - (y - y0) / (y1 - y0)) * 1.4);
    }
}

/** One landmark's frame: its little shadow on the ground, the drawing, what lies over it. */
function drawMark(key) {
  const s = new HiSprite(MARK_W, MARK_H, RAMPS);
  ART[key](s);
  const art = s.render({ outline: 1, rim: 0.12, dither: 0.7, grain: 0.1, outlineColor: 0x14101a });
  ART[`${key}Post`]?.(art);
  const out = new Raster(MARK_W, MARK_H);
  // (the shadow falls to the south-east, away from the light)
  out.ellipse(CX + 3, FOOT, 15, 3, 0x0a1018, 0.28);
  out.blit(art, 0, 0);
  return out;
}

export const MARK_KEYS = Object.keys(ART).filter((k) => !k.endsWith('Post'));

/** Every landmark, for the atlas: [{ name, raster }]. */
export function mapMarks() {
  return MARK_KEYS.map((k) => ({ name: k, raster: drawMark(k) }));
}

