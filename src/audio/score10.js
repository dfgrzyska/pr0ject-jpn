// Stage 10 (Kawaguchiko): an original folk tune in the manner of min'yō, in the "yo" scale on G (G A C D E):
// shakuhachi over koto and shamisen, taiko, the hyōshigi clacking at the village festival. Every stage song shares
// one 8-bar progression (G Em C D | G Am C D), so the music changes district on a bar line without losing its
// place. The hare's theme is a skipping tune with the clappers going "kachi kachi"; the giant's is heavy, on the
// taiko and the biwa in the "in" scale on E (E F A B C), and when the sun goes down behind him it brightens into
// the stage's own tune over the drums; after him, the tune slowed down over the lake at dusk.

const song = (bpm, bars, tracks, mix = {}) => ({ bpm, bars, loop: true, sync: true, tracks, mix });
const quarters = (b) => b.split(' ').map((t, i) => (i % 4 === 0 ? t : t === '.' ? '.' : '-')).join(' ');
const sparse = (b) => b.split(' ').map((t, i) => (i % 4 === 0 ? t : '.')).join(' ');
const REST = '. . . . . . . . . . . . . . . .';

// ---------------------------------------------------------------- the stage theme
const ROOTS = ['G2', 'E2', 'C2', 'D2', 'G2', 'A2', 'C2', 'D2'];
// the notes of the scale over each chord, low to high: the koto's arpeggios go up and down them
const KOTO_NOTES = [
  ['G4', 'A4', 'D5', 'E5', 'G5'],
  ['E4', 'G4', 'A4', 'D5', 'E5'],
  ['C4', 'E4', 'G4', 'C5', 'D5'],
  ['D4', 'E4', 'A4', 'D5', 'E5'],
  ['G4', 'A4', 'D5', 'E5', 'G5'],
  ['A3', 'C4', 'E4', 'A4', 'C5'],
  ['C4', 'E4', 'G4', 'C5', 'E5'],
  ['D4', 'A4', 'C5', 'D5', 'E5'],
];
const KOTO = KOTO_NOTES.map((n) => [0, 2, 3, 4, 3, 2, 1, 2].map((k) => `${n[k]} .`).join(' '));
const KOTO_SLOW = KOTO.map(sparse);
const PAD = ['G3+D4', 'E3+B3', 'C3+G3', 'D3+A3', 'G3+D4', 'A3+E4', 'C3+G3', 'D3+A3'].map((c) => `${c} - - - - - - - - - - - - - - -`);
const BASS_HALF = ROOTS.map((n) => `${n} - - - - - - - ${n} - - - - - - -`);
const BASS = ROOTS.map((n) => `${n} . . ${n} . . ${n} . ${n} . . ${n} . . ${n} .`);
// the shamisen: root, fifth and octave plucked in a lilting figure
const FIFTH = { G2: 'D', E2: 'B', C2: 'G', D2: 'A', A2: 'E' };
const SHAMI = ROOTS.map((n) => {
  const r = `${n[0]}3`;
  const f = `${FIFTH[n]}${'GA'.includes(n[0]) ? 4 : 3}`; // (the fifth above the root)
  const o = `${n[0]}4`;
  return `${r} . ${f} ${r} . ${f} ${o} . ${r} . ${f} ${r} . ${f} ${o} ${f}`;
});

const LEAD_A = [
  'D5 - - E5 G5 - - - A5 - G5 - E5 - D5 -',
  'E5 - - - - - D5 - E5 - G5 - - - - -',
  'C5 - - D5 E5 - G5 - E5 - D5 - C5 - - -',
  'D5 - - - - - - - A4 - C5 - D5 - E5 -',
  'G5 - - A5 G5 - E5 - D5 - - - E5 - G5 -',
  'A5 - - - C6 - A5 - G5 - E5 - - - - -',
  'E5 - G5 - E5 - D5 - C5 - - - A4 - C5 -',
  'D5 - - - - - - - - - - - . . . .',
];
// the answer, higher
const LEAD_B = [
  'G5 - - - A5 - C6 - D6 - - - C6 - A5 -',
  'G5 - - - E5 - - - D5 - E5 - G5 - - -',
  'E5 - G5 - A5 - - - G5 - E5 - D5 - C5 -',
  'D5 - - - - - - - E5 - D5 - C5 - A4 -',
  'D5 - - - G5 - - - A5 - G5 - A5 - C6 -',
  'D6 - - - C6 - A5 - E5 - - - G5 - A5 -',
  'G5 - E5 - D5 - C5 - D5 - - - E5 - - -',
  'D5 - - - - - - - D5 . E5 . G5 . A5 .',
];
const LEAD = [...LEAD_A, ...LEAD_B];

const fill = (beat, last) => [...Array(7).fill(beat), last];
const DRUMS_INTRO = fill('K . . . . . . . K . . k . . . .', 'K . . . K . . . K . k . K . k k');
const DRUMS_BUILD = fill('K . . k x . k . K . . k x . . .', 'K . k k x . k . K k x k K k K K');
const DRUMS_FULL = fill('K . . k x . k . K . k . x . k k', 'K . K . K . K k K K x K K K K K');
// the village festival: the clappers on the beat, the hand gong (chanchiki) running between
const DRUMS_MATSURI = fill('K h . k g . k h K h . k g . k g', 'K h K h K h K h K K g K K g K K');
const SHAKE = ['s . s . S . s . s . s . S . s .'];

// ---------------------------------------------------------------- KACHI-KACHI USAGI: the hare on the lake (G yo, skipping)
const US_HOP = [
  'G4 . A4 . D5 . . E5 D5 . A4 . G4 . . .',
  'C5 . D5 . E5 . . G5 E5 . D5 . C5 . . .',
  'A4 . C5 . D5 . E5 . G5 . E5 . D5 . C5 .',
  'D5 . . . A4 . . . D5 . E5 . G5 . . .',
];
const US_FUE = [REST, 'G5 - - - - - E5 - G5 - A5 - - - - -', REST, 'D6 - - - C6 - A5 - G5 - - - - - - -'];
const US_BASS = ['G2', 'C2', 'A2', 'D2'].map((n) => `${n} . . ${n} . . ${n} . ${n} . . ${n} . . ${n} .`);
const US_KOTO = [['G4', 'D5'], ['C5', 'G5'], ['A4', 'E5'], ['D5', 'A5']].map(([a, b]) => `. . ${a}+${b} . . . ${a}+${b} . . . ${a}+${b} . . . ${a}+${b} .`);

// ---------------------------------------------------------------- DAIDARABOTCHI: the giant in the lake (E in-scale, heavy)
const BOSS_ROOTS = [['E2', 'B2', 'E3'], ['E2', 'B2', 'E3'], ['C2', 'G2', 'C3'], ['C2', 'G2', 'C3'], ['A1', 'E2', 'A2'], ['A1', 'E2', 'A2'], ['F2', 'C3', 'F3'], ['B1', 'B2', 'E3']];
const BOSS_BIWA = BOSS_ROOTS.map(([r, f, o]) => `${r} . ${r} ${f} . ${r} ${f} ${o} ${r} . ${r} ${f} . ${o} ${f} ${r}`);
const BOSS_BASS = BOSS_ROOTS.map(([r]) => `${r} - - - - - ${r} - ${r} - - - ${r} - - -`);
const BOSS_PAD = ['E3+B3', 'E3+B3', 'C3+G3', 'C3+G3', 'A2+E3', 'A2+E3', 'F2+C3', 'B2+E3'].map((c) => `${c} - - - - - - - - - - - - - - -`);
const BOSS_LEAD = [
  'E5 - - - F5 - E5 - B4 - - - C5 - B4 -',
  'A4 - - - - - - - . . E5 . F5 . A5 .',
  'B5 - - - A5 - F5 - E5 - - - F5 - A5 -',
  'E5 - - - - - - - . . C5 . B4 . A4 .',
  'A4 - - - C5 - E5 - F5 - - - E5 - C5 -',
  'B4 - - - A4 - - - E4 - F4 - A4 - B4 -',
  'C5 - - - F5 - - - E5 - C5 - A4 - F4 -',
  'B4 - - - - - - - B4 . C5 . E5 . F5 .',
];
const BOSS_DRUMS = fill('K . . K x . K . K . x K K . x K', 'K . K . K K x . K K K K K x K K');
// at sunset the stage's own tune comes back over the drums, the koto running under it
const DUSK_DRUMS = fill('K . . k x . k . K . . K x . k k', 'K . K k K . K k K K x K K K K K');

export const SONGS10 = {
  // Fujiyoshida in the morning: the koto, the tune on the flute, the big drum now and then
  s10_intro: song(112, 8, { shakuhachi: LEAD_A, koto: KOTO_SLOW, bass: BASS_HALF, drums: DRUMS_INTRO }, { shakuhachi: 0.85, koto: 0.7, bass: 0.6, drums: 0.6 }),
  // the shrine and the town: the shamisen comes in, the drums
  s10_build: song(112, 8, { shakuhachi: LEAD_A, koto: KOTO, shamisen: SHAMI, bass: BASS, drums: DRUMS_BUILD }, { shakuhachi: 0.85, koto: 0.6, shamisen: 0.6, drums: 0.7 }),
  // the shore and the lake: the whole tune and its answer
  s10_full: song(112, 16, { shakuhachi: LEAD, koto: KOTO, shamisen: SHAMI, bass: BASS, drums: DRUMS_FULL, shaker: SHAKE }, { shakuhachi: 0.85, koto: 0.6, shamisen: 0.65, drums: 0.75, shaker: 0.5 }),
  // the village on the north shore: a festival, the clappers and the hand gong
  s10_mura: song(112, 16, { shakuhachi: LEAD, shamisen: SHAMI, koto: KOTO_SLOW, bass: BASS, drums: DRUMS_MATSURI }, { shakuhachi: 0.85, shamisen: 0.75, koto: 0.5, drums: 0.75 }),
  // the maple corridor: the koto takes the tune, the flute holds long notes over it
  s10_momiji: song(112, 16, { koto: LEAD, shakuhachi: LEAD_B.concat(LEAD_A).map(quarters), pad: PAD, bass: BASS_HALF, drums: DRUMS_INTRO, shaker: SHAKE }, { koto: 0.85, shakuhachi: 0.55, pad: 0.6, bass: 0.6, drums: 0.55, shaker: 0.35 }),
  // the quay and Fuji rising over the lake: a hush
  s10_view: song(112, 8, { shakuhachi: LEAD_A.map(quarters), koto: KOTO_SLOW, pad: PAD, bass: BASS_HALF }, { shakuhachi: 0.7, koto: 0.55, pad: 0.75, bass: 0.5 }),
  s10_usagi: song(150, 4, { shamisen: US_HOP, shakuhachi: US_FUE, koto: US_KOTO, bass: US_BASS, drums: ['h . h . K . x . h . h . K k x .'], shaker: ['s . S . s . S . s . S . s . S s'] }, { shamisen: 0.9, shakuhachi: 0.75, koto: 0.5, drums: 0.85, shaker: 0.5 }),
  s10_boss: song(132, 8, { shakuhachi: BOSS_LEAD, biwa: BOSS_BIWA, bass: BOSS_BASS, pad: BOSS_PAD, drums: BOSS_DRUMS }, { shakuhachi: 0.85, biwa: 0.65, bass: 0.6, pad: 0.55, drums: 0.72 }),
  s10_dusk: song(132, 16, { shakuhachi: LEAD, koto: KOTO, shamisen: SHAMI, pad: PAD, bass: BASS, drums: DUSK_DRUMS }, { shakuhachi: 0.9, koto: 0.6, shamisen: 0.6, pad: 0.6, drums: 0.85 }),
  // after him: the tune slowed down over the lake at dusk, the far shore's lights coming on
  s10_night: song(76, 8, { shakuhachi: LEAD_A.map(quarters), koto: KOTO_SLOW, bass: BASS_HALF }, { shakuhachi: 0.7, koto: 0.6, bass: 0.45 }),
};
