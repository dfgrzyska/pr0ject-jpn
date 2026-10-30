// Stage 4 soundtrack "Hi no Shima" (Island of Fire) — original. The city half is festive, in the bright
// yo scale on D (D E G A B) like the Ohara festival bands: shamisen, fue, taiko and the kane hand gong
// (g). The Satsuma-biwa, struck hard with its big plectrum, carries the drama; Raijū's theme crackles,
// and the volcano's theme drops into the dark in scale on E (E F A B C) with pounding taiko.
// Same token format as score.js; stage songs share an 8-bar progression (D G D A D G A D).

const PROG = ['D', 'G', 'D', 'A', 'D', 'G', 'A', 'D'];

const BIWA = {
  D: 'D3 - - . A3 . D4 . . . A3 . G3 . E3 .',
  G: 'G2 - - . D3 . G3 . . . D3 . B3 . A3 .',
  A: 'A2 - - . E3 . A3 . . . E3 . D3 . B2 .',
};
const BIWA_RIFF = PROG.map((c) => BIWA[c]);

const SHAMISEN = {
  D: 'D5 . A4 . D5 . E5 . A5 . E5 . D5 . B4 .',
  G: 'G4 . D5 . G5 . A5 . B5 . A5 . G5 . D5 .',
  A: 'A4 . E5 . A5 . B5 . E5 . B4 . A4 . E5 .',
};
const SHAMISEN_RIFF = PROG.map((c) => SHAMISEN[c]);

const ROOT = { D: ['D2', 'D3', 'A2'], G: ['G2', 'G3', 'D3'], A: ['A2', 'A3', 'E3'] };
const BASS = PROG.map((c) => {
  const [lo, hi, fifth] = ROOT[c];
  return `${lo} . ${hi} . ${lo} . ${fifth} . ${lo} . ${hi} . ${fifth} . ${hi} .`;
});
const BASS_SLOW = PROG.map((c) => `${ROOT[c][0]} - - - - - - - ${ROOT[c][2]} - - - - - - -`);
const PAD = PROG.map((c) => `${{ D: 'D4+A4', G: 'G3+D4+G4', A: 'A3+E4' }[c]} - - - - - - - - - - - - - - -`);

const LEAD_A = [
  'A5 - - - B5 - A5 - G5 - E5 - D5 - - -',
  'G5 - - - A5 - B5 - D6 - - - B5 - A5 -',
  'A5 - B5 - A5 - G5 - E5 - G5 - A5 - - -',
  'E5 - - - D5 - E5 - G5 - A5 - - - . .',
  'D6 - - - B5 - A5 - B5 - A5 - G5 - E5 -',
  'G5 - - - E5 - D5 - E5 - G5 - A5 - - -',
  'B5 - A5 - G5 - E5 - D5 - E5 - G5 - E5 -',
  'D5 - - - - - - - . . A4 . D5 . E5 .',
];
const LEAD_B = [
  'D6 - - - E6 - D6 - B5 - A5 - B5 - D6 -',
  'B5 - - - A5 - G5 - A5 - B5 - - - . .',
  'A5 - - - D6 - B5 - A5 - G5 - E5 - G5 -',
  'A5 - - - - - B5 - A5 - E5 - D5 - E5 -',
  'D6 - B5 - A5 - G5 - A5 - B5 - D6 - E6 -',
  'D6 - - - B5 - - - A5 - G5 - E5 - D5 -',
  'E5 - G5 - A5 - B5 - A5 - G5 - E5 - G5 -',
  'D5 - - - - - - - D6 . B5 . A5 . E5 .',
];

const repeat = (pattern, n, last) => [...Array(n - 1).fill(pattern), last ?? pattern];
const TAIKO_INTRO = repeat('K . . . . . . . K . . . . . k .', 8, 'K . . . K . . . K . k k K k K .');
const TAIKO_BUILD = repeat('K . . k K . k . K . . k K k . k', 8, 'K . k K K . k K K k K k K K K K');
const TAIKO_FULL = repeat('K . k K x . K k K . k K x K k x', 8, 'K K x K K x K K x K K x K K K K');
const KANE = ['. . g . . . g . . . g . . . g .'];
const KANE_FULL = ['g . g . g . g g g . g . g . g g'];

// Raijū: crackling, fast, tense — biwa tremolo on a rubbing semitone, rattling shaker for static
const HEAVY_BIWA = [
  'D3 D3 D3 D3 Eb3 Eb3 D3 D3 D3 D3 Eb3 Eb3 A3 A3 Ab3 Ab3',
  'D3 D3 D3 D3 Eb3 Eb3 D3 D3 G3 G3 Gb3 Gb3 A3 . E3 .',
];
const HEAVY_BASS = ['D2 . D2 D3 D2 . D2 D3 Eb2 . Eb2 Eb3 D2 . A2 D3', 'D2 . D2 D3 D2 . D2 D3 G2 . G2 G3 A2 . E2 A2'];
const HEAVY_LEAD = ['A5 - - - Bb5 - - - A5 - E5 - Eb5 - - -', 'D5 - - - Eb5 - D5 - A5 - - - Ab5 - - -'];
const HEAVY_DRUMS = repeat('K . k K x . K k K . k K x K x x', 2, 'K K x K K x K K K x K x K K K K');

// Sakurajima: slow and massive, in scale on E, pounding taiko, the biwa struck like a drum
const BOSS_BASS = [
  'E2 - - E2 E2 - - E2 F2 - - F2 E2 - B1 -',
  'E2 - - E2 E2 - - E2 C3 - - C3 B2 - F2 -',
  'A2 - - A2 A2 - - A2 F2 - - F2 E2 - B1 -',
  'E2 - - E2 F2 - - F2 B1 - - B1 E2 E2 E2 E2',
];
const BOSS_BIWA = [
  'E3 - . E3 F3 - . E3 B2 - . B2 E3 - F3 -',
  'E3 - . E3 F3 - . E3 C4 - B3 - A3 - F3 -',
  'A3 - . A3 B3 - . A3 F3 - . F3 E3 - B2 -',
  'E3 - . E3 F3 - . F3 B2 - B2 - E3 . E3 .',
];
const BOSS_LEAD = [
  'E5 - - - - - F5 - E5 - - - B4 - - -',
  'C5 - - - B4 - A4 - F4 - - - E4 - - -',
  'A4 - - - B4 - C5 - B4 - A4 - F4 - - -',
  'E5 - - - F5 - E5 - B4 - - - - - - -',
];
const BOSS_DRUMS = repeat('K . . K K . k . K . . K K k K .', 4, 'K K . K K . K K K K K K K K K K');

export const SONGS4 = {
  s4_intro: {
    bpm: 140,
    bars: 8,
    loop: true,
    sync: true,
    mix: { pad: 0.7, biwa: 0.8 },
    tracks: { biwa: BIWA_RIFF, pad: PAD, bass: BASS_SLOW, drums: TAIKO_INTRO, shaker: KANE },
  },
  s4_build: {
    bpm: 140,
    bars: 8,
    loop: true,
    sync: true,
    mix: { biwa: 0.7, shamisen: 0.8 },
    tracks: { biwa: BIWA_RIFF, shamisen: SHAMISEN_RIFF, bass: BASS, drums: TAIKO_BUILD, shaker: KANE, lead: LEAD_A },
  },
  s4_full: {
    bpm: 140,
    bars: 16,
    loop: true,
    sync: true,
    mix: { shamisen: 0.85, biwa: 0.6 },
    tracks: { shamisen: SHAMISEN_RIFF, biwa: BIWA_RIFF, bass: BASS, drums: TAIKO_FULL, shaker: KANE_FULL, lead: [...LEAD_A, ...LEAD_B] },
  },
  s4_heavy: {
    bpm: 156,
    bars: 2,
    loop: true,
    sync: true,
    mix: { biwa: 0.7, lead: 0.7 },
    tracks: { biwa: HEAVY_BIWA, bass: HEAVY_BASS, lead: HEAVY_LEAD, drums: HEAVY_DRUMS, shaker: ['S s S s S s S s S s S s S s S s'] },
  },
  s4_boss: {
    bpm: 132,
    bars: 4,
    loop: true,
    sync: true,
    mix: { biwa: 1, pad: 1.1 },
    tracks: {
      bass: BOSS_BASS,
      biwa: BOSS_BIWA,
      lead: BOSS_LEAD,
      drums: BOSS_DRUMS,
      shaker: ['g . . . . . . . g . . . . . . .'],
      pad: ['E3+B3 - - - - - - - - - - - - - - -'],
    },
  },
};
