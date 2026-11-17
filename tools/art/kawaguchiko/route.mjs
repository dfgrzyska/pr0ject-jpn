// Kawaguchiko (stage 10, docs/plan-kawaguchiko.md): the measures of its strip and the stretches along it, shared by
// every file that draws a part of it. u is measured from the strip's bottom, in the game's 180-px units.
export const W = 180;
export const S = 3; // fine pixels per logical one
export const CHUNK = 896; // (the height of the pieces the game loads)
export const CHUNKS = 8;
export const L = CHUNK * CHUNKS; // 7168

// [from u, to u, id, name, ground colour of the block-out]
export const SECTIONS = [
  [0, 1300, 'fujiyoshida', 'FUJIYOSHIDA', 0x847c70],
  [1300, 2100, 'shore', 'OISHI', 0x6c7c58],
  [2100, 3900, 'lake', 'KAWAGUCHI-KO', 0x000000],
  [3900, 4700, 'lava', 'FUNATSU', 0x3c5a34], // (the lava forest is never named: docs/plan-kawaguchiko.md, rule 2)
  [4700, 5600, 'road', 'GOGOME', 0x4a5a3c],
  [5600, 6700, 'trail', 'YOSHIDA-GUCHI', 0x2e2a2c],
  [6700, L, 'summit', 'FUJI-SAN', 0x6a3c2c],
];

// the lake's shores (u of the north and south shore at x), the island of Unoshima ([x, u, r])
export const LAKE = { north: (x) => 2100 + 34 * Math.sin(x / 31) + 18 * Math.sin(x / 11 + 1), south: (x) => 3900 - 40 * Math.sin(x / 37 + 2) - 14 * Math.sin(x / 13) };
export const ISLAND = [128, 3080, 13];

// where the fights are: [u of the middle, name]; kept clear of anything tall
export const ARENAS = [
  [3400, 'KACHI-KACHI USAGI'],
  [6950, 'DAIDARABOTCHI'],
];

// the crater on the summit: its middle and radius
export const CRATER = [90, 6950, 46];
