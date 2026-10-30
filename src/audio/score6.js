// Stage 6 soundtrack "Yukemuri" (hot-spring steam) — original, after the min'yō of the onsen towns:
// a breathy shakuhachi tune in the min'yō scale on D (D F G A C) over koto, shamisen and the tsuzumi
// hourglass drum (z = "pon", Z = "ta") instead of a shaker. It starts lazy like a soak in the bath and
// gets busier through the hells. The crocodile gets a low semitone ostinato creeping in the in scale
// on A; the oni of Setsubun gets taiko and a screaming shakuhachi in the in scale on D (D Eb G A Bb).
// Same token format as score.js; stage songs share an 8-bar progression (D D C C G G A A).

const PROG = ['D', 'D', 'C', 'C', 'G', 'G', 'A', 'A'];

const ROOT = { D: ['D2', 'A2'], C: ['C2', 'G2'], G: ['G1', 'D2'], A: ['A1', 'E2'] };
const BASS = PROG.map((c) => {
  const [r, f] = ROOT[c];
  return `${r} . . . ${f} . . . ${r} . . . ${f} . . .`;
});
const BASS_SLOW = PROG.map((c) => `${ROOT[c][0]} - - - - - - - ${ROOT[c][1]} - - - - - - -`);
const KOTO = {
  D: 'D4 . A4 . D5 . F5 . A5 . F5 . D5 . A4 .',
  C: 'C4 . G4 . C5 . D5 . G5 . D5 . C5 . G4 .',
  G: 'G3 . D4 . G4 . C5 . D5 . C5 . G4 . D4 .',
  A: 'A3 . E4 . A4 . C5 . E5 . C5 . A4 . E4 .',
};
const KOTO_ARP = PROG.map((c) => KOTO[c]);
const KOTO_SLOW = KOTO_ARP.map((b) =>
  b
    .split(' ')
    .map((t, i) => (i % 4 === 0 ? t : '.'))
    .join(' '),
);
const SHAMISEN = {
  D: '. . D5 . . . A4 . . . D5 . . . F5 .',
  C: '. . C5 . . . G4 . . . C5 . . . D5 .',
  G: '. . G4 . . . D5 . . . G4 . . . C5 .',
  A: '. . A4 . . . E5 . . . A4 . . . C5 .',
};
const SHAMISEN_OFF = PROG.map((c) => SHAMISEN[c]);
const PAD = ['D3+A3+F4', 'D3+A3+F4', 'C3+G3+D4', 'C3+G3+D4', 'G2+D3+C4', 'G2+D3+C4', 'A2+E3+C4', 'A2+E3+C4'].map((c) => `${c} - - - - - - - - - - - - - - -`);

const TUNE_A = [
  'A4 - - - - - D5 - C5 - A4 - G4 - - -',
  'A4 - - - - - - - . . . . F4 - G4 -',
  'G4 - - - - - C5 - D5 - C5 - A4 - - -',
  'G4 - - - - - - - . . . . . . . .',
  'D5 - - - F5 - - - G5 - F5 - D5 - - -',
  'C5 - - - D5 - C5 - A4 - - - G4 - - -',
  'A4 - - - C5 - - - D5 - C5 - A4 - G4 -',
  'A4 - - - - - - - - - - - . . . .',
];
const TUNE_B = [
  'D5 - F5 - G5 - A5 - G5 - F5 - D5 - - -',
  'C5 - D5 - F5 - - - D5 - - - . . . .',
  'C5 - D5 - G5 - - - F5 - D5 - C5 - - -',
  'D5 - - - C5 - A4 - G4 - - - . . . .',
  'G5 - - - A5 - G5 - F5 - D5 - F5 - G5 -',
  'A5 - - - - - G5 - F5 - D5 - C5 - - -',
  'D5 - C5 - A4 - G4 - A4 - C5 - D5 - - -',
  'A4 - - - - - - - - - - - . . . .',
];

const repeat = (pattern, n, last) => [...Array(n - 1).fill(pattern), last ?? pattern];
const TAIKO_INTRO = repeat('K . . . . . . . . . . . . . . .', 8, 'K . . . . . . . K . . . K . k .');
const TAIKO_BUILD = repeat('K . . . k . . . K . . k . . k .', 8, 'K . k . K . k . K k K k K K K K');
const TAIKO_FULL = repeat('K . x k . x K . k . x k K x K x', 8, 'K K x K K x K K x K K x K K K K');
const TSU_INTRO = ['z . . . . . Z . . . . . z . . .'];
const TSU_BUILD = ['z . . Z . . z . . . Z . z . Z .'];
const TSU_FULL = ['z . Z . z . Z z . . Z . z Z . Z'];

// the crocodile: a creeping semitone, ominous long notes, tsuzumi cracks
const HEAVY_BASS = ['A1 . . . Bb1 . . . A1 . . . Bb1 . . .', 'A1 . . . Bb1 . . . A1 . Bb1 . A1 . Bb1 .', 'A1 . Bb1 . A1 . Bb1 . A1 . Bb1 . A1 . Bb1 .', 'A1 Bb1 A1 Bb1 A1 Bb1 A1 Bb1 A1 Bb1 A1 Bb1 A1 Bb1 A1 Bb1'];
const HEAVY_LEAD = ['A4 - - - - - - - - - - - Bb4 - - -', 'A4 - - - - - - - E4 - - - - - - -', 'D5 - - - - - - - Bb4 - - - A4 - - -', 'E5 - - - - - - - F5 - - - E5 - - -'];
const HEAVY_SHAMISEN = ['. . A3 . . . . . . . A3 . . . Bb3 .', '. . A3 . . . E3 . . . A3 . . . Bb3 .', '. . D4 . . . A3 . . . D4 . . . E4 .', '. . E4 . F4 . E4 . . . Bb3 . A3 . . .'];
const HEAVY_DRUMS = ['K . . . . . . . K . . . . . . .', 'K . . . . . . . K . . . K . K .'];
const HEAVY_TSU = ['Z . . . . . . . . . . . Z . . .', 'Z . . . . . Z . . . Z . Z . Z Z'];

// the oni of Setsubun: driving taiko, fast shamisen, the shakuhachi high and fierce
const BOSS_TUNE = [
  'D6 - - - Eb6 - D6 - A5 - - - G5 - A5 -',
  'Bb5 - - - A5 - G5 - D5 - - - . . . .',
  'G5 - A5 - Bb5 - - - A5 - G5 - Eb5 - D5 -',
  'D5 - - - - - - - A5 - - - D6 - - -',
];
const BOSS_SHAMISEN = ['D5 . A4 . D5 . Eb5 . D5 . A4 . G4 . A4 .', 'D5 . A4 . D5 . Eb5 . D5 . Bb4 . A4 . G4 .', 'G4 . D5 . G4 . A4 . Bb4 . A4 . G4 . D4 .', 'A4 . Eb5 . D5 . A4 . D5 . A4 . D5 . D5 .'];
const BOSS_BASS = ['D2 . D2 . A2 . D2 . Eb2 . D2 . A1 . D2 .', 'D2 . D2 . A2 . D2 . Bb1 . C2 . D2 . A1 .', 'G1 . G1 . D2 . G1 . A1 . A1 . Eb2 . A1 .', 'D2 . A1 . D2 . A1 . D2 . Eb2 . D2 . D2 .'];
const BOSS_DRUMS = repeat('K x k x K x k K K x k x K k K x', 4, 'K K x K K x K K K K K K K K K K');
const BOSS_TSU = ['z Z . z Z . z Z z Z . z Z . Z Z'];

export const SONGS6 = {
  s6_intro: {
    bpm: 92,
    swing: 0.12,
    bars: 8,
    loop: true,
    sync: true,
    mix: { shakuhachi: 0.8, koto: 0.8, pad: 0.8 },
    tracks: { shakuhachi: TUNE_A, koto: KOTO_SLOW, pad: PAD, bass: BASS_SLOW, drums: TAIKO_INTRO, shaker: TSU_INTRO },
  },
  s6_build: {
    bpm: 108,
    swing: 0.15,
    bars: 8,
    loop: true,
    sync: true,
    mix: { koto: 0.7 },
    tracks: { shakuhachi: TUNE_A, koto: KOTO_ARP, bass: BASS, drums: TAIKO_BUILD, shaker: TSU_BUILD },
  },
  s6_full: {
    bpm: 116,
    swing: 0.15,
    bars: 16,
    loop: true,
    sync: true,
    mix: { shamisen: 0.75, koto: 0.5 },
    tracks: { shakuhachi: [...TUNE_A, ...TUNE_B], shamisen: SHAMISEN_OFF, koto: KOTO_ARP, bass: BASS, drums: TAIKO_FULL, shaker: TSU_FULL },
  },
  s6_heavy: {
    bpm: 120,
    bars: 4,
    loop: true,
    sync: true,
    mix: { shamisen: 0.9, shakuhachi: 0.8 },
    tracks: { shakuhachi: HEAVY_LEAD, shamisen: HEAVY_SHAMISEN, bass: HEAVY_BASS, drums: HEAVY_DRUMS, shaker: HEAVY_TSU },
  },
  s6_boss: {
    bpm: 152,
    swing: 0.1,
    bars: 4,
    loop: true,
    sync: true,
    mix: { shakuhachi: 1, shamisen: 0.7 },
    tracks: { shakuhachi: BOSS_TUNE, shamisen: BOSS_SHAMISEN, bass: BOSS_BASS, drums: BOSS_DRUMS, shaker: BOSS_TSU },
  },
};
