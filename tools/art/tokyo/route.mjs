// Tokyo (stage 9, docs/plan-tokyo.md): the measures of its strip and the districts along it, shared by every
// file that draws a part of it. u is measured from the strip's bottom, in the game's 180-px units.
export const W = 180;
export const S = 3; // fine pixels per logical one
export const CHUNK = 896; // (the height of the pieces the game loads)
export const CHUNKS = 14;
export const L = CHUNK * CHUNKS; // 12544

// [from u, to u, id, name, ground colour of the block-out]
export const DISTRICTS = [
  [0, 700, 'nakano', 'NAKANO', 0x8a8478],
  [700, 2100, 'shinjuku', 'SHINJUKU', 0x7c8088],
  [2100, 2900, 'harajuku', 'HARAJUKU', 0x5c7a4c],
  [2900, 3900, 'shibuya', 'SHIBUYA', 0x6a6c78],
  [3900, 4900, 'minato', 'MINATO', 0x70685c],
  [4900, 6100, 'chiyoda', 'CHIYODA', 0x5a7450],
  [6100, 7200, 'akihabara', 'AKIHABARA', 0x5c5a74],
  [7200, 8100, 'ueno', 'UENO', 0x567048],
  [8100, 9500, 'asakusa', 'ASAKUSA', 0x86685a],
  [9500, 10700, 'sumida', 'SUMIDA-GAWA', 0x6c6a66],
  [10700, 11500, 'bay', 'TOKYO-WAN', 0x000000],
  [11500, L, 'odaiba', 'ODAIBA', 0x74787c],
];

// where the fights are: [u of the middle, name]; kept clear of anything tall
export const ARENAS = [
  [3350, 'KASA-OBAKE'],
  [9100, 'TAIYAKI'],
  [12300, 'KUROGANE'],
];
