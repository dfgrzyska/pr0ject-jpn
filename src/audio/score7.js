// Stage 7 soundtrack "Itsukushima" — original, inspired by Miyajima's Gagaku/Bugaku court music over water
// and Heike-biwa ballads of the Seto Inland Sea.
//
// Stage sections use the noble Japanese Ritsu scale on E (E F# A B C#) over an 8-bar progression
// (E E C# F# A A B B) with swelling shō mouth-organ clusters, biwa plucks, koto ripples, shakuhachi,
// suzu shrine bells (j) and tsuzumi/taiko. Heike-gani (heavy) shifts to a struck Heike-biwa battle
// ostinato in the In scale on E (E F A B C) with snapping hyōshigi (h); Sankibō (boss) drives a fast
// yamabushi Tengu whirlwind at 154 BPM.

const PROG = ['E', 'E', 'C#', 'F#', 'A', 'A', 'B', 'B'];

const ROOT = {
  E: ['E2', 'B2'],
  'C#': ['C#2', 'F#2'],
  'F#': ['F#2', 'C#3'],
  A: ['A1', 'E2'],
  B: ['B1', 'F#2'],
};

const BASS_SLOW = PROG.map((c) => `${ROOT[c][0]} - - - - - - - ${ROOT[c][1]} - - - - - - -`);
const BASS = PROG.map((c) => {
  const [r, f] = ROOT[c];
  return `${r} . ${f} . ${r} . ${f} . ${r} . ${f} . ${r} . ${f} .`;
});

const SHO = [
  'E4+B4 - - - - - - - - - - - - - - -',
  'E4+F#4+B4 - - - - - - - - - - - - - - -',
  'C#4+F#4+B4 - - - - - - - - - - - - - - -',
  'F#4+B4+C#5 - - - - - - - - - - - - - - -',
  'A3+E4+B4 - - - - - - - - - - - - - - -',
  'A3+E4+C#5 - - - - - - - - - - - - - - -',
  'B3+F#4+C#5 - - - - - - - - - - - - - - -',
  'B3+E4+B4 - - - - - - - - - - - - - - -',
];

const KOTO_MAP = {
  E: 'E4 . B4 . E5 . F#5 . B5 . F#5 . E5 . B4 .',
  'C#': 'C#4 . F#4 . B4 . C#5 . F#5 . C#5 . B4 . F#4 .',
  'F#': 'F#4 . A4 . C#5 . E5 . F#5 . E5 . C#5 . A4 .',
  A: 'A3 . E4 . A4 . B4 . E5 . B4 . A4 . E4 .',
  B: 'B3 . F#4 . B4 . C#5 . F#5 . C#5 . B4 . F#4 .',
};
const KOTO_ARP = PROG.map((c) => KOTO_MAP[c]);
const KOTO_SLOW = KOTO_ARP.map((b) =>
  b
    .split(' ')
    .map((t, i) => (i % 4 === 0 ? t : '.'))
    .join(' '),
);

const BIWA_ACCENT = [
  'E3 . . . . . B3 . . . . . E4 . . .',
  '. . . . E3 . . . . . B3 . . . F#4 .',
  'C#3 . . . . . F#3 . . . . . C#4 . . .',
  'F#3 . . . . . C#4 . . . . . E4 . . .',
  'A2 . . . . . E3 . . . . . A3 . . .',
  '. . . . A2 . . . . . E3 . . . C#4 .',
  'B2 . . . . . F#3 . . . . . B3 . . .',
  'B2 . . . F#3 . . . B3 . . . C#4 . B3 .',
];

const TUNE_A = [
  'B4 - - - E5 - - - F#5 - E5 - C#5 - B4 -',
  'E5 - - - - - - - . . B4 . C#5 - E5 -',
  'F#5 - - - E5 - C#5 - B4 - - - A4 - - -',
  'B4 - - - C#5 - - - A4 - - - . . . .',
  'A4 - - - B4 - C#5 - E5 - - - F#5 - E5 -',
  'C#5 - - - B4 - A4 - E4 - - - . . . .',
  'F#4 - A4 - B4 - C#5 - E5 - - - C#5 - B4 -',
  'B4 - - - - - - - - - - - A4 . B4 .',
];

const TUNE_B = [
  'E5 - F#5 - A5 - B5 - A5 - F#5 - E5 - - -',
  'F#5 - E5 - C#5 - B4 - C#5 - E5 - F#5 - - -',
  'A5 - - - F#5 - E5 - C#5 - - - B4 - C#5 -',
  'E5 - - - - - - - . . C#5 . E5 . F#5 .',
  'A5 - - - B5 - A5 - F#5 - E5 - C#5 - E5 -',
  'F#5 - - - E5 - C#5 - B4 - A4 - B4 - C#5 -',
  'E5 - C#5 - B4 - A4 - B4 - C#5 - F#5 - E5 -',
  'E5 - - - - - - - - - - - B4 . C#5 .',
];

const repeat = (pattern, n, last) => [...Array(n - 1).fill(pattern), last ?? pattern];
const DRUMS_INTRO = repeat('K . . . . . . . . . . . k . . .', 8, 'K . . . . . . . K . . k K . k .');
const DRUMS_BUILD = repeat('K . . . x . k . K . . k x . . .', 8, 'K . x . K . k . K k x k K K K K');
const DRUMS_FULL = repeat('K . x k . x K . K . x k . x K x', 8, 'K K x K K x K K x K K x K K K K');
const PERC_INTRO = ['j . . . . . . . z . . . . . . .'];
const PERC_BUILD = ['j . . z . . Z . j . . z . . Z .'];
const PERC_FULL = ['j . z . Z . s . j . z . Z . S z'];

// ---- Heike-gani (miniboss): Heike-biwa sea battle in In scale on E (E F A B C) + snapping hyōshigi claws
const HEAVY_BIWA = [
  'E3 . E3 . F3 . E3 . B3 . A3 . F3 . E3 .',
  'F3 . F3 . C4 . B3 . A3 . F3 . E3 . F3 .',
  'E3 . E3 . B3 . C4 . B3 . A3 . F3 . E3 .',
  'B2 . F3 . E3 . B3 . C4 . B3 . F3 . E3 .',
];
const HEAVY_BASS = [
  'E2 . E2 . F2 . E2 . E2 . B2 . F2 . E2 .',
  'F2 . F2 . C2 . F2 . F2 . C3 . A2 . F2 .',
  'E2 . E2 . B2 . E2 . A2 . A2 . F2 . E2 .',
  'B1 . B1 . F2 . B1 . C2 . B1 . F2 . B1 .',
];
const HEAVY_LEAD = [
  'E5 - - - F5 - E5 - B4 - - - C5 - B4 -',
  'A4 - - - F4 - - - E4 - - - . . . .',
  'B4 - C5 - E5 - F5 - E5 - C5 - B4 - A4 -',
  'B4 - - - - - - - C5 . B4 . A4 . F4 .',
];
const HEAVY_DRUMS = repeat('K . k x K . . x K . k x K k K .', 4, 'K k x K K k x K K K x K K K K K');
const HEAVY_CLACK = ['. . h . . . z . . . h . . Z h .'];

// ---- Sankibō of Mount Misen (boss): Tengu gale in In scale on E at 154 BPM
const BOSS_TUNE = [
  'E5 - F5 - B5 - - - C6 - B5 - A5 - F5 -',
  'E5 - - - F5 - A5 - B5 - - - . . E5 .',
  'C6 - - - B5 - A5 - F5 - E5 - F5 - A5 -',
  'B5 - - - C6 - B5 - E6 - - - B5 - - -',
];
const BOSS_KOTO = [
  'E5 B4 F5 B4 E5 B4 C5 B4 E5 B4 F5 B4 A5 F5 E5 B4',
  'F5 C5 A5 C5 F5 C5 B5 A5 E5 B4 F5 E5 B4 C5 B4 A4',
  'C5 A4 F5 C5 A5 F5 C6 B5 A5 F5 E5 C5 F5 A5 C6 A5',
  'B4 F4 B4 E5 F5 E5 B5 F5 E6 B5 C6 B5 A5 F5 E5 B4',
];
const BOSS_BASS = [
  'E2 E2 B2 E2 F2 E2 B2 E2 E2 E2 B2 E2 C2 B1 F2 E2',
  'F2 F2 C3 F2 A2 F2 C3 F2 E2 E2 B2 E2 F2 E2 B1 E2',
  'A1 A1 E2 A1 F2 A1 E2 A1 F1 F1 C2 F1 A1 F1 C2 F1',
  'B1 B1 F2 B1 C2 B1 F2 B1 B1 B1 F2 B1 C2 B1 B1 B1',
];
const BOSS_SHO = [
  'E4+B4+F5 - - - - - - - - - - - - - - -',
  'F4+C5+A5 - - - - - - - - - - - - - - -',
  'A3+E4+C5 - - - - - - - - - - - - - - -',
  'B3+F4+B4 - - - - - - - - - - - - - - -',
];
const BOSS_DRUMS = repeat('K x k x K x K x K x k x K K x K', 4, 'K K x K K x K K K K K K K K K K');
const BOSS_PERC = ['h . z Z s . h . z . Z s h . Z h'];

export const SONGS7 = {
  s7_intro: {
    bpm: 112,
    bars: 8,
    loop: true,
    sync: true,
    mix: { sho: 0.95, koto: 0.85, biwa: 0.75 },
    tracks: { sho: SHO, koto: KOTO_SLOW, biwa: BIWA_ACCENT, bass: BASS_SLOW, drums: DRUMS_INTRO, shaker: PERC_INTRO },
  },
  s7_build: {
    bpm: 126,
    bars: 8,
    loop: true,
    sync: true,
    mix: { shakuhachi: 0.95, koto: 0.75, biwa: 0.65, sho: 0.65 },
    tracks: { shakuhachi: TUNE_A, sho: SHO, koto: KOTO_ARP, biwa: BIWA_ACCENT, bass: BASS, drums: DRUMS_BUILD, shaker: PERC_BUILD },
  },
  s7_full: {
    bpm: 134,
    bars: 16,
    loop: true,
    sync: true,
    mix: { shakuhachi: 1.0, koto: 0.68, biwa: 0.7, sho: 0.7 },
    tracks: {
      shakuhachi: [...TUNE_A, ...TUNE_B],
      sho: [...SHO, ...SHO],
      koto: KOTO_ARP,
      biwa: BIWA_ACCENT,
      bass: BASS,
      drums: DRUMS_FULL,
      shaker: PERC_FULL,
    },
  },
  s7_heavy: {
    bpm: 136,
    bars: 4,
    loop: true,
    sync: true,
    mix: { biwa: 1.05, shakuhachi: 0.85 },
    tracks: { biwa: HEAVY_BIWA, shakuhachi: HEAVY_LEAD, bass: HEAVY_BASS, drums: HEAVY_DRUMS, shaker: HEAVY_CLACK },
  },
  s7_boss: {
    bpm: 154,
    bars: 4,
    loop: true,
    sync: true,
    mix: { shakuhachi: 1.0, koto: 0.65, sho: 0.75 },
    tracks: { shakuhachi: BOSS_TUNE, koto: BOSS_KOTO, sho: BOSS_SHO, bass: BOSS_BASS, drums: BOSS_DRUMS, shaker: BOSS_PERC },
  },
};
