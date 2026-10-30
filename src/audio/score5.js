// Stage 5 soundtrack "Naniwa Chindon" — original, after Osaka's chindon-ya street bands (said to have
// begun with an Osaka candy seller around 1845): a clarinet tune in the yonanuki major scale on C
// (C D E G A) over a bouncing "pyonko" shuffle, the chin (kane gong, g) and don (taiko) of the band,
// shamisen and an oom-pah bass. The bunraku puppet gets the theatre: a low, tense shamisen and the
// crack of the hyōshigi clappers (h). The octopus gets the band at full tilt.
// Same token format as score.js; stage songs share an 8-bar progression (C F C G C F G C).

const PROG = ['C', 'F', 'C', 'G', 'C', 'F', 'G', 'C'];

const ROOT = { C: ['C2', 'G2'], F: ['F2', 'C3'], G: ['G2', 'D3'] };
const BASS = PROG.map((c) => {
  const [r, f] = ROOT[c];
  return `${r} . . . ${f} . . . ${r} . . . ${f} . . .`;
});
const BASS_SLOW = PROG.map((c) => `${ROOT[c][0]} - - - - - - - ${ROOT[c][1]} - - - - - - -`);
const SHAMISEN = {
  C: '. . E5 . . . G5 . . . E5 . . . C5 .',
  F: '. . A5 . . . F5 . . . A5 . . . C6 .',
  G: '. . D5 . . . G5 . . . B4 . . . D5 .',
};
const SHAMISEN_OFF = PROG.map((c) => SHAMISEN[c]);
const KOTO = {
  C: 'C5 . E5 . G5 . E5 . C5 . G4 . E5 . G5 .',
  F: 'F4 . A4 . C5 . A4 . F5 . C5 . A4 . C5 .',
  G: 'G4 . D5 . G5 . D5 . B4 . D5 . G5 . D5 .',
};
const KOTO_ARP = PROG.map((c) => KOTO[c]);

const TUNE_A = [
  'E5 - . G5 A5 - G5 . E5 - . D5 C5 - - .',
  'D5 - . E5 G5 - A5 . G5 - - - E5 - . .',
  'E5 - . G5 A5 - C6 . A5 - . G5 E5 - - .',
  'D5 - . E5 D5 - C5 . A4 - - - . . . .',
  'C6 - . A5 G5 - A5 . G5 - . E5 D5 - - .',
  'C5 - . D5 E5 - G5 . A5 - - - G5 - . .',
  'G5 - . A5 G5 - E5 . D5 - . E5 D5 - C5 .',
  'C5 - - - - - . . G4 . A4 . C5 . D5 .',
];
const TUNE_B = [
  'G5 . G5 . A5 . C6 . A5 - G5 . E5 - . .',
  'A5 . A5 . G5 . E5 . D5 - - - . . . .',
  'E5 . G5 . A5 . G5 . E5 . D5 . C5 - . .',
  'D5 . E5 . G5 . A5 . G5 - - - . . . .',
  'C6 - . C6 A5 - G5 . A5 - . C6 D6 - . .',
  'C6 - . A5 G5 - E5 . G5 - - - . . . .',
  'A5 - . G5 E5 - D5 . E5 - . D5 C5 - . .',
  'C5 - - - - - . . C6 . A5 . G5 . E5 .',
];

const repeat = (pattern, n, last) => [...Array(n - 1).fill(pattern), last ?? pattern];
const DON_INTRO = repeat('K . . . . . . . k . . . . . . .', 8, 'K . . . k . . . K . k . K k K .');
const DON_BUILD = repeat('K . . k . . K . k . . k . . K .', 8, 'K . k K . k K . K k K k K K K K');
const DON_FULL = repeat('K . x k . x K . k . x k K x K x', 8, 'K K x K K x K K x K K x K K K K');
const CHIN = ['. . g . . . g . . . g . . . g .'];
const CHIN_FULL = ['g . g . . g g . g . g . . g g .'];

// bunraku: the theatre — low, slow, tense, in scale on A, punctuated by the clappers
const HEAVY_SHAMISEN = [
  'A3 . . . A3 . Bb3 . A3 . . . E3 . . .',
  'A3 . . . A3 . Bb3 . D4 . . . C4 . Bb3 .',
  'A3 . . . E4 . . . F4 . E4 . Bb3 . A3 .',
  'E3 . . . . . . . E3 . F3 . E3 . . .',
];
const HEAVY_BASS = ['A1 - - - - - - - A1 - - - - - - -', 'A1 - - - - - - - E2 - - - - - - -'];
const HEAVY_CLAPS = ['h . . . . . . . . . . . h . h .', 'h . . . . . . . h . h . h h h h'];
const HEAVY_DRUMS = ['K . . . . . . . . . K . . . . .'];
const HEAVY_LEAD = ['A4 - - - - - - - Bb4 - - - A4 - - -', 'E5 - - - - - - - F5 - - - E5 - - -'];

// the octopus: the band at full tilt, a frantic clarinet
const BOSS_TUNE = [
  'C6 . A5 . G5 . E5 . G5 . A5 . C6 . D6 .',
  'E6 . D6 . C6 . A5 . G5 - - - . . . .',
  'A5 . G5 . E5 . D5 . E5 . G5 . A5 . C6 .',
  'D6 . C6 . A5 . G5 . A5 - - - G5 . E5 .',
];
const BOSS_BASS = [
  'C2 . G2 . C2 . G2 . C2 . G2 . E2 . G2 .',
  'F2 . C3 . F2 . C3 . F2 . C3 . A2 . C3 .',
  'C2 . G2 . C2 . G2 . A2 . E2 . A2 . E2 .',
  'G2 . D3 . G2 . D3 . G2 . B2 . D3 . B2 .',
];
const BOSS_DRUMS = repeat('K x k x K x k K K x k x K k K x', 4, 'K K x K K x K K K K K K K K K K');

export const SONGS5 = {
  s5_intro: {
    bpm: 120,
    swing: 0.25,
    bars: 8,
    loop: true,
    sync: true,
    mix: { koto: 0.8, clarinet: 0.8 },
    tracks: { koto: KOTO_ARP, bass: BASS_SLOW, drums: DON_INTRO, shaker: CHIN },
  },
  s5_build: {
    bpm: 132,
    swing: 0.32,
    bars: 8,
    loop: true,
    sync: true,
    mix: { shamisen: 0.8 },
    tracks: { clarinet: TUNE_A, shamisen: SHAMISEN_OFF, bass: BASS, drums: DON_BUILD, shaker: CHIN },
  },
  s5_full: {
    bpm: 132,
    swing: 0.32,
    bars: 16,
    loop: true,
    sync: true,
    mix: { shamisen: 0.75, koto: 0.5 },
    tracks: { clarinet: [...TUNE_A, ...TUNE_B], shamisen: SHAMISEN_OFF, koto: KOTO_ARP, bass: BASS, drums: DON_FULL, shaker: CHIN_FULL },
  },
  s5_heavy: {
    bpm: 104,
    bars: 4,
    loop: true,
    sync: true,
    mix: { shamisen: 1.1, lead: 0.6 },
    tracks: { shamisen: HEAVY_SHAMISEN, bass: HEAVY_BASS, shaker: HEAVY_CLAPS, drums: HEAVY_DRUMS, lead: HEAVY_LEAD },
  },
  s5_boss: {
    bpm: 168,
    swing: 0.22,
    bars: 4,
    loop: true,
    sync: true,
    mix: { clarinet: 1, shamisen: 0.7 },
    tracks: { clarinet: BOSS_TUNE, shamisen: SHAMISEN_OFF.slice(0, 4), bass: BOSS_BASS, drums: BOSS_DRUMS, shaker: CHIN_FULL },
  },
};
