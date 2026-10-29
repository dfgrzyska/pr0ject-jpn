// Stage 3 soundtrack "Kita no Yoru" (Northern Night) — original, in the min'yō scale on D (D F G A C),
// the scale of Japanese folk songs such as Hokkaido's Sōran-bushi. Yosakoi-style: shamisen riffs,
// a fue-like lead, taiko, naruko clappers (n) of the dancers, sleigh bells (j) and Otaru music boxes.
// Same token format as score.js. Played straight (no swing), unlike Okinawa's shuffle.
//
// Stage songs share an 8-bar progression (D D C D F G C D) and switch on bar lines.

const PROG = ['D', 'D', 'C', 'D', 'F', 'G', 'C', 'D'];

const SHAMISEN = {
  D: 'D5 . A4 . D5 D5 F5 . G5 . F5 . D5 . A4 .',
  C: 'C5 . G4 . C5 C5 D5 . F5 . D5 . C5 . G4 .',
  F: 'F4 . C5 . F5 F5 G5 . A5 . G5 . F5 . C5 .',
  G: 'G4 . D5 . G5 G5 A5 . C6 . A5 . G5 . D5 .',
};
const SHAMISEN_RIFF = PROG.map((c) => SHAMISEN[c]);

const ORGEL = {
  D: 'D5 . A5 . D6 . F6 . A5 . D6 . F5 . A5 .',
  C: 'C5 . G5 . C6 . D6 . G5 . C6 . D5 . G5 .',
  F: 'F5 . A5 . C6 . F6 . C6 . A5 . F5 . C6 .',
  G: 'G5 . D6 . G6 . A6 . D6 . G6 . A5 . D6 .',
};
const ORGEL_ARP = PROG.map((c) => ORGEL[c]);

const ROOT = { D: ['D2', 'D3', 'A2'], C: ['C2', 'C3', 'G2'], F: ['F2', 'F3', 'C3'], G: ['G2', 'G3', 'D3'] };
const BASS = PROG.map((c) => {
  const [lo, hi, fifth] = ROOT[c];
  return `${lo} . ${hi} . ${lo} . ${hi} . ${lo} . ${hi} . ${fifth} . ${hi} .`;
});
const BASS_SLOW = PROG.map((c) => `${ROOT[c][0]} - - - - - - - ${ROOT[c][2]} - - - - - - -`);
const PAD = PROG.map((c) => `${{ D: 'D4+A4', C: 'C4+G4', F: 'F3+C4+F4', G: 'G3+D4+G4' }[c]} - - - - - - - - - - - - - - -`);

const LEAD_A = [
  'D5 - - - F5 - G5 - A5 - - - G5 - F5 -',
  'G5 - A5 - C6 - A5 - G5 - - - - - . .',
  'C6 - - - A5 - G5 - A5 - C6 - D6 - - -',
  'C6 - A5 - G5 - F5 - D5 - - - - - . .',
  'F5 - G5 - A5 - - - C6 - A5 - G5 - - -',
  'A5 - G5 - F5 - D5 - G5 - - - - - . .',
  'C5 - D5 - F5 - G5 - A5 - G5 - F5 - G5 -',
  'D5 - - - - - - - . . . . A4 - C5 -',
];
const LEAD_B = [
  'D6 - - - C6 - A5 - C6 - - - D6 - F6 -',
  'D6 - C6 - A5 - G5 - A5 - - - - - . .',
  'G5 - A5 - C6 - - - A5 - G5 - F5 - G5 -',
  'A5 - - - D6 - C6 - A5 - - - - - . .',
  'F5 - - - A5 - C6 - D6 - C6 - A5 - - -',
  'G5 - A5 - G5 - F5 - D5 - - - F5 - G5 -',
  'A5 - C6 - D6 - - - C6 - A5 - G5 - A5 -',
  'D6 - - - - - - - . . A5 . C6 . D6 .',
];

const repeat = (pattern, n, last) => [...Array(n - 1).fill(pattern), last ?? pattern];
const TAIKO_INTRO = repeat('K . . . . . . . . . . . . . . .', 8, 'K . . . . . . . K . . . K . k k');
const TAIKO_BUILD = repeat('K . . k x . K . K . . k x . k .', 8, 'K . k K x . K k K . K k K K K K');
const TAIKO_FULL = repeat('K . k K x . K k K . k K x k K x', 8, 'K K x K K x K K x K K x K K K K');
const NARUKO_LIGHT = ['. . n . . . n . . . n . . . n .'];
const NARUKO_FULL = ['j . n . . . n n . . n . j . n n'];
const BELLS = ['j . . . . . . . j . . . . . . .'];

// Yuki-onna: an out-of-tune music box over a heartbeat, notes outside the scale for a chill
const HEAVY_ORGEL = [
  'D6 . . Eb6 . . D6 . A5 . . Ab5 . . A5 .',
  'C6 . . B5 . . C6 . G5 . . Gb5 . . G5 .',
  'D6 . . Eb6 . . D6 . F6 . . E6 . . F6 .',
  'A6 . . Ab6 . . G6 . F6 . Eb6 . D6 . . .',
];
const HEAVY_BASS = ['D2 - - - - - - - Eb2 - - - - - - -', 'C2 - - - - - - - B1 - - - - - - -'];
const HEAVY_SHAMISEN = ['D4 . . D4 . . D4 . Eb4 . . Eb4 . . Eb4 .', 'C4 . . C4 . . C4 . B3 . . B3 . . B3 .'];
const HEAVY_DRUMS = ['K . . . . . . . K . . K . . . .'];
const HEAVY_LEAD = ['A6 - - - - - - - Ab6 - - - - - - -', 'G6 - - - - - - - Gb6 - - - - - - -'];

// the bear: fast and heavy, taiko pounding, shamisen tremolo
const BOSS_BASS = [
  'D2 D2 D3 D2 D2 D3 D2 D3 D2 D2 D3 D2 C3 D2 A2 D2',
  'D2 D2 D3 D2 D2 D3 D2 D3 D2 D2 D3 D2 C3 D2 A2 D2',
  'F2 F2 F3 F2 F2 F3 F2 F3 G2 G2 G3 G2 G2 G3 A2 C3',
  'C2 C2 C3 C2 C2 C3 C2 C3 D2 D2 D3 D2 A2 C3 D3 D2',
];
const BOSS_SHAMISEN = [
  'D5 D5 A4 D5 F5 D5 A4 D5 G5 F5 D5 A4 C5 D5 F5 G5',
  'A5 A5 G5 F5 D5 F5 G5 A5 C6 A5 G5 F5 D5 C5 A4 C5',
  'F5 F5 C5 F5 A5 F5 C5 F5 G5 G5 D5 G5 A5 G5 D5 G5',
  'C6 C6 G5 C6 D6 C6 A5 G5 A5 A5 D5 F5 G5 F5 D5 C5',
];
const BOSS_LEAD = [
  'D6 - - - C6 - A5 - G5 - - - A5 - C6 -',
  'D6 - - - - - - - A5 . G5 . F5 . G5 .',
  'F5 - - - A5 - C6 - D6 - - - C6 - A5 -',
  'C6 - - - - - - - D6 . C6 . A5 . G5 .',
];
const BOSS_DRUMS = repeat('K . k K x K K k K . k K x K K x', 4, 'K K x K K x K K x K K x K K K K');

export const SONGS3 = {
  s3_intro: {
    bpm: 152,
    bars: 8,
    loop: true,
    sync: true,
    mix: { pad: 0.8, orgel: 0.9 },
    tracks: { orgel: ORGEL_ARP, pad: PAD, bass: BASS_SLOW, drums: TAIKO_INTRO, shaker: BELLS },
  },
  s3_build: {
    bpm: 152,
    bars: 8,
    loop: true,
    sync: true,
    mix: { orgel: 0.55 },
    tracks: { shamisen: SHAMISEN_RIFF, orgel: ORGEL_ARP, bass: BASS, drums: TAIKO_BUILD, shaker: NARUKO_LIGHT, lead: LEAD_A },
  },
  s3_full: {
    bpm: 152,
    bars: 16,
    loop: true,
    sync: true,
    mix: { shamisen: 0.9 },
    tracks: { shamisen: SHAMISEN_RIFF, bass: BASS, drums: TAIKO_FULL, shaker: NARUKO_FULL, lead: [...LEAD_A, ...LEAD_B] },
  },
  s3_heavy: {
    bpm: 152,
    bars: 4,
    loop: true,
    sync: true,
    mix: { orgel: 1, shamisen: 0.6, lead: 0.5 },
    tracks: { orgel: HEAVY_ORGEL, bass: HEAVY_BASS, shamisen: HEAVY_SHAMISEN, drums: HEAVY_DRUMS, lead: HEAVY_LEAD, shaker: BELLS },
  },
  s3_boss: {
    bpm: 168,
    bars: 4,
    loop: true,
    sync: true,
    mix: { shamisen: 0.65, pad: 1 },
    tracks: {
      bass: BOSS_BASS,
      shamisen: BOSS_SHAMISEN,
      lead: BOSS_LEAD,
      drums: BOSS_DRUMS,
      shaker: NARUKO_FULL,
      pad: ['D3+A3 - - - - - - - - - - - - - - -'],
    },
  },
};
