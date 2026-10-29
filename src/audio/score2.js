// Stage 2 soundtrack "Churaumi" — original, in the Okinawan (Ryukyu) scale on C (C E F G B).
// Sanshin riffs, a fue-like lead, eisa drums (K = big drum, p = paranku hand drum), sanba clacks (c)
// and a kachāshī shuffle (swing). Same token format as score.js.
//
// Stage songs share an 8-bar progression (C F C G | C F G C) and switch on bar lines.

const SANSHIN = {
  C: 'C5 . E5 . G5 . E5 . C5 . G4 . B4 . C5 .',
  F: 'F4 . C5 . F5 . C5 . E5 . C5 . F4 . C5 .',
  G: 'G4 . B4 . E5 . B4 . G5 . E5 . B4 . G4 .',
};
const PROG = ['C', 'F', 'C', 'G', 'C', 'F', 'G', 'C'];
const SANSHIN_RIFF = PROG.map((c) => SANSHIN[c]);

const BASS_HOP = {
  C: 'C2 . . . G2 . . . C3 . . . G2 . . .',
  F: 'F2 . . . C3 . . . F2 . . . C3 . . .',
  G: 'G2 . . . B2 . . . G2 . . . E2 . . .',
};
const BASS = PROG.map((c) => BASS_HOP[c]);
const BASS_SLOW = PROG.map((c) => `${{ C: 'C2', F: 'F2', G: 'G2' }[c]} - - - - - - - ${{ C: 'G2', F: 'C3', G: 'B2' }[c]} - - - - - - -`);
const PAD = PROG.map((c) => `${{ C: 'C4+E4+G4', F: 'F3+C4+F4', G: 'G3+B3+E4' }[c]} - - - - - - - - - - - - - - -`);

const LEAD_A = [
  'E5 - - G5 - - E5 - C5 - E5 - G5 - - -',
  'F5 - - E5 - - C5 - F5 - - - E5 - C5 -',
  'E5 - G5 - C6 - - - B5 - G5 - E5 - - -',
  'G5 - - - B5 - G5 - E5 - - - - - - -',
  'C6 - - B5 - - G5 - E5 - G5 - C6 - - -',
  'F5 - - G5 - - F5 - E5 - C5 - F5 - - -',
  'G5 - - - E5 - - - B4 - C5 - E5 - G5 -',
  'C5 - - - - - - - - - - - . . . .',
];
const LEAD_B = [
  'G5 . G5 . C6 - - - B5 - G5 - E5 - G5 -',
  'F5 - E5 - F5 - G5 - C6 - - - B5 - G5 -',
  'E5 . E5 . G5 - - - C6 - B5 - G5 - E5 -',
  'B5 - - - G5 - - - E5 . F5 . G5 - - -',
  'C6 - B5 - G5 - E5 - G5 - - - C6 - - -',
  'F5 - G5 - F5 - E5 - C5 - - - F5 - G5 -',
  'B5 - - - G5 - E5 - G5 - - - B5 - C6 -',
  'C6 - - - - - - - G5 . E5 . C5 . . .',
];

const repeat = (pattern, n, last) => [...Array(n - 1).fill(pattern), last ?? pattern];
const EISA_INTRO = repeat('K . . . . . . . K . . . p . p .', 8, 'K . . . K . . . K . p . K p K p');
const EISA_BUILD = repeat('K . . . p . p . K . . K p . p .', 8, 'K . p K p . K p K K p K K p K p');
const EISA_FULL = repeat('K . p . K . p p K . p . K p K p', 8, 'K p K p K p K p K K K K p p p p');
const SANBA_8 = ['c . . . c . c . c . . . c . c .'];
const SANBA_16 = ['c . c c c . c c c . c c c . c c'];

// manta: tense F/E rub, driving
const HEAVY_BASS = [
  'F2 . F2 F3 F2 . F2 F3 F2 . F2 F3 E2 . E2 E3',
  'F2 . F2 F3 F2 . F2 F3 F2 . F2 F3 E2 . C3 E3',
];
const HEAVY_SANSHIN = ['F5 E5 C5 E5 F5 E5 C5 E5 F5 E5 C5 E5 B4 C5 E5 C5', 'F5 E5 C5 E5 F5 E5 C5 E5 G5 F5 E5 C5 B4 C5 B4 G4'];
const HEAVY_LEAD = [
  'F5 - - - E5 - - - B4 - C5 - E5 - - -',
  'F5 - - - G5 - F5 - E5 - - - C5 - - -',
  'F5 - - - E5 - - - B4 - C5 - E5 - F5 -',
  'G5 - - - - - - - B5 . G5 . F5 . E5 .',
];

// shisa: fast heroic battle
const BOSS_BASS = [
  'C2 C2 C3 C2 C2 C3 C2 C3 C2 C2 C3 C2 G2 C2 B2 C2',
  'C2 C2 C3 C2 C2 C3 C2 C3 C2 C2 C3 C2 G2 C2 B2 C2',
  'F2 F2 F3 F2 F2 F3 F2 F3 F2 F2 F3 F2 E2 F2 C3 F2',
  'G2 G2 G3 G2 G2 G3 G2 G3 G2 G2 G3 G2 B2 G2 E3 G2',
];
const BOSS_SANSHIN = [
  'C6 . G5 . E5 . G5 . C6 . G5 . E5 G5 C6 E6',
  'C6 . G5 . E5 . G5 . C6 . B5 . G5 E5 G5 B5',
  'F5 . C6 . F5 . C6 . E5 . C6 . E5 F5 G5 B5',
  'G5 . B5 . E5 . B5 . G5 . B5 . E6 C6 B5 G5',
];
const BOSS_LEAD = [
  'C6 - - - B5 - G5 - E5 - - - G5 - B5 -',
  'C6 - - - - - - - G5 . E5 . C5 . E5 .',
  'F5 - - - E5 - C5 - B4 - - - C5 - E5 -',
  'G5 - - - - - - - B5 . G5 . E5 . B4 .',
];
const BOSS_DRUMS = repeat('K . p K p . K p K . p K p K K p', 4, 'K K p K K p K K p K K p K K K K');

export const SONGS2 = {
  s2_intro: {
    bpm: 148,
    swing: 0.3,
    bars: 8,
    loop: true,
    sync: true,
    mix: { pad: 0.8 },
    tracks: { sanshin: SANSHIN_RIFF, pad: PAD, bass: BASS_SLOW, drums: EISA_INTRO },
  },
  s2_build: {
    bpm: 148,
    swing: 0.3,
    bars: 8,
    loop: true,
    sync: true,
    mix: { sanshin: 0.9 },
    tracks: { sanshin: SANSHIN_RIFF, bass: BASS, drums: EISA_BUILD, shaker: SANBA_8, lead: LEAD_A },
  },
  s2_full: {
    bpm: 148,
    swing: 0.3,
    bars: 16,
    loop: true,
    sync: true,
    mix: { sanshin: 0.85 },
    tracks: { sanshin: SANSHIN_RIFF, bass: BASS, drums: EISA_FULL, shaker: SANBA_16, lead: [...LEAD_A, ...LEAD_B] },
  },
  s2_heavy: {
    bpm: 148,
    swing: 0.15,
    bars: 4,
    loop: true,
    sync: true,
    mix: { sanshin: 0.6 },
    tracks: { bass: HEAVY_BASS, sanshin: HEAVY_SANSHIN, lead: HEAVY_LEAD, drums: EISA_FULL.slice(0, 4), shaker: SANBA_16 },
  },
  s2_boss: {
    bpm: 160,
    swing: 0.12,
    bars: 4,
    loop: true,
    sync: true,
    mix: { sanshin: 0.6, pad: 1 },
    tracks: {
      bass: BOSS_BASS,
      sanshin: BOSS_SANSHIN,
      lead: BOSS_LEAD,
      drums: BOSS_DRUMS,
      shaker: SANBA_16,
      pad: ['C3+G3 - - - - - - - - - - - - - - -'],
    },
  },
};
