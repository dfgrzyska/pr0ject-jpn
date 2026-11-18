// Onomichi (stage 11, docs/plan-onomichi.md): the measures of its strip and the stretches along it, shared by every
// file that draws a part of it. u is measured from the strip's bottom, in the game's 180-px units.
//
// The flight turns with the map: over the islands it heads north, across Innoshima's strait and Mukaishima; past the
// twin bridges over the Onomichi strait it heads west along the town, the strait bending to run up the left edge
// (Mukaishima's shore at the very edge), the hillside of temples on the right. (A block-out for now: phase 0.)
export const W = 180;
export const S = 3; // fine pixels per logical one
export const CHUNK = 896; // (the height of the pieces the game loads)
export const CHUNKS = 8;
export const L = CHUNK * CHUNKS; // 7168

// [from u, to u, id, name, ground colour of the block-out]
export const SECTIONS = [
  [0, 700, 'innoshima', 'INNOSHIMA', 0x6c7c4c],
  [700, 1500, 'ohashi', 'INNOSHIMA-OHASHI', 0x6c7c4c],
  [1500, 2300, 'mukaishima', 'MUKAISHIMA', 0x74804e],
  [2300, 2900, 'suido', 'ONOMICHI-SUIDO', 0x7c7868],
  [2900, 3800, 'jodoji', 'JODOJI', 0x847c70],
  [3800, 5100, 'senkoji', 'SENKOJI', 0x6c6a5c],
  [5100, 6200, 'hondori', 'HONDORI', 0x5c5850],
  [6200, L, 'eki', 'ONOMICHI', 0x5c5850],
];

const wave = (v, a, b, c, d) => a * Math.sin(v / b) + c * Math.sin(v / d + 1);

// The sea, as the stretches of it at each height: Innoshima's strait across the strip, the Onomichi strait across it
// at the bridges, then up the left edge (between Mukaishima's shore and the town's), widening before the station
export const STRAIT = { south: (x) => 820 + wave(x, 18, 23, 8, 9), north: (x) => 1380 + wave(x, 16, 29, 7, 11) };
export const SUIDO = { south: (x) => 2380 + wave(x, 12, 27, 6, 8), north: (x) => 2700 + wave(x, 10, 33, 5, 7) };
const widen = (u) => Math.min(1, Math.max(0, (u - 6400) / 300)); // before the station the water widens to the arena
/** The Onomichi strait's two shores past the bend: [Mukaishima's x, the town's x] at a height u. */
export function suidoShores(u) {
  const t = widen(u);
  const west = 10 + wave(u, 3, 41, 2, 13);
  const east = 58 + wave(u, 5, 57, 3, 17) + t * 70;
  return [west * (1 - t), east];
}
/** Whether the point (x, u) is open sea. */
export function isSea(x, u) {
  if (u >= STRAIT.south(x) && u < STRAIT.north(x)) return true;
  if (u >= SUIDO.south(x) && u < SUIDO.north(x)) return true;
  if (u >= SUIDO.north(x) - 30) {
    const [w, e] = suidoShores(u);
    return x >= w && x < e;
  }
  return false;
}

// The bridges: Innoshima's suspension bridge across its strait, the twin cable-stayed ones across the Onomichi strait
export const OHASHI = { x: 104, from: 780, to: 1420, towers: [900, 1300] };
export const TWINS = [{ x: 132, from: 2350, to: 2740 }, { x: 146, from: 2350, to: 2740 }];
// the railway along the foot of the hillside, from the bend to the station; the arcade between it and the water
// (before the station it swings right, round the widening water, into the station's tracks)
export const RAIL = { x: (u) => 100 + 48 * widen(u), from: 2760 };
export const ARCADE = { x: 78, from: 5100, to: 6200 };
// the ropeway up Senkoji-yama: [x, u] of its foot and its top
export const ROPEWAY = [[106, 4420], [166, 4760]];

// where the fights are: [u of the middle, name]; kept clear of anything tall
export const ARENAS = [
  [4300, 'NEKOMATA'],
  [6950, 'FUNA-YUREI'],
];
