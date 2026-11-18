// Stage 11 (Onomichi): an original summer festival tune in the manner of min'yō, in the "yo" scale on D (D E G A B):
// a bright flute (the shinobue of the festival bands) over koto and shamisen, taiko, the glass wind bells (fūrin)
// tinkling now and then on the music box's tines. Every stage song shares one 8-bar progression (D Bm G A | D Em G A)
// and one tempo, so the music changes district on a bar line without losing its place. The cat's theme is a cheeky
// tune on the shamisen with the flute mewing over it; the ghost ship's is heavy, in the "in" scale on D (D Eb G A Bb),
// on the taiko and the biwa with the conch blown long and low; after it the festival's own tune, quicker and gladder,
// as the fireworks go on over the strait.

const song = (bpm, bars, tracks, mix = {}) => ({ bpm, bars, loop: true, sync: true, tracks, mix });
const quarters = (b) => b.split(' ').map((t, i) => (i % 4 === 0 ? t : t === '.' ? '.' : '-')).join(' ');
const sparse = (b) => b.split(' ').map((t, i) => (i % 4 === 0 ? t : '.')).join(' ');
const REST = '. . . . . . . . . . . . . . . .';
const BPM = 116;

// ---------------------------------------------------------------- the stage theme
const ROOTS = ['D2', 'B1', 'G2', 'A2', 'D2', 'E2', 'G2', 'A2'];
// the scale's notes over each chord, low to high: the koto's arpeggios go up and down them
const KOTO_NOTES = [
  ['D4', 'E4', 'A4', 'B4', 'D5'],
  ['B3', 'D4', 'E4', 'A4', 'B4'],
  ['G3', 'B3', 'D4', 'E4', 'G4'],
  ['A3', 'B3', 'E4', 'A4', 'B4'],
  ['D4', 'E4', 'A4', 'B4', 'D5'],
  ['E4', 'G4', 'A4', 'B4', 'E5'],
  ['G3', 'B3', 'D4', 'G4', 'A4'],
  ['A3', 'D4', 'E4', 'A4', 'B4'],
];
const KOTO = KOTO_NOTES.map((n) => [0, 1, 2, 4, 3, 2, 1, 2].map((k) => `${n[k]} .`).join(' '));
const KOTO_SLOW = KOTO.map(sparse);
const PAD = ['D3+A3', 'B2+Gb3', 'G2+D3', 'A2+E3', 'D3+A3', 'E3+B3', 'G2+D3', 'A2+E3'].map((c) => `${c} - - - - - - - - - - - - - - -`);
const BASS_HALF = ROOTS.map((n) => `${n} - - - - - - - ${n} - - - - - - -`);
const BASS = ROOTS.map((n) => `${n} . . ${n} . . ${n} . ${n} . . ${n} . . ${n} .`);
// the shamisen: root, fifth and octave plucked in a lilting figure
const SHAMI_NOTES = { D2: ['D3', 'A3', 'D4'], B1: ['B2', 'Gb3', 'B3'], G2: ['G3', 'D4', 'G4'], A2: ['A3', 'E4', 'A4'], E2: ['E3', 'B3', 'E4'] };
const SHAMI = ROOTS.map((n) => {
  const [r, f, o] = SHAMI_NOTES[n];
  return `${r} . ${f} ${r} . ${f} ${o} . ${r} . ${f} ${r} . ${f} ${o} ${f}`;
});

const LEAD_A = [
  'A5 - - B5 D6 - - - B5 - A5 - G5 - E5 -',
  'D5 - - - - - E5 - D5 - B4 - - - - -',
  'G5 - - A5 B5 - - - A5 - G5 - E5 - D5 -',
  'E5 - - - - - - - A4 - B4 - D5 - E5 -',
  'A5 - - B5 A5 - G5 - E5 - - - G5 - A5 -',
  'B5 - - - D6 - B5 - A5 - G5 - - - - -',
  'G5 - A5 - G5 - E5 - D5 - - - B4 - D5 -',
  'E5 - - - - - - - - - - - . . . .',
];
// the answer, higher
const LEAD_B = [
  'D6 - - - E6 - D6 - B5 - - - A5 - B5 -',
  'D6 - - - B5 - - - A5 - B5 - D6 - - -',
  'B5 - D6 - E6 - - - D6 - B5 - A5 - G5 -',
  'A5 - - - - - - - B5 - A5 - G5 - E5 -',
  'A5 - - - D6 - - - E6 - D6 - E6 - G6 -',
  'E6 - - - D6 - B5 - A5 - - - B5 - D6 -',
  'B5 - A5 - G5 - E5 - G5 - - - A5 - - -',
  'D5 - - - - - - - D5 . E5 . G5 . A5 .',
];
const LEAD = [...LEAD_A, ...LEAD_B];
// the wind bells on the eaves, now and then
const FURIN = ['. . . . . . . . A6 . . . . . . .', REST, '. . . . D7 . . . . . . . B6 . . .', REST, '. . A6 . . . . . . . . . . . E7 .', REST, '. . . . . . . . B6 . . . D7 . . .', REST];

const fill = (beat, last) => [...Array(7).fill(beat), last];
const DRUMS_INTRO = fill('K . . . . . . . K . . k . . . .', 'K . . . K . . . K . k . K . k k');
const DRUMS_BUILD = fill('K . . k x . k . K . . k x . . .', 'K . k k x . k . K k x k K k K K');
const DRUMS_FULL = fill('K . . k x . k . K . k . x . k k', 'K . K . K . K k K K x K K K K K');
// the festival on Hondōri: the hand gong (chanchiki) running between the drums, the clappers
const DRUMS_MATSURI = fill('K g . k g . k g K g . k g . k h', 'K g K g K h K g K K g K K g K K');
const SHAKE = ['s . s . S . s . s . s . S . s .'];

// ---------------------------------------------------------------- NEKOMATA: the cat on the roofs (A in-scale, cheeky)
const NEKO_TUNE = [
  'A4 . . E5 . D5 . . A4 . Bb4 . A4 . . .',
  'D5 . . F5 . E5 . . D5 . Bb4 . A4 . . .',
  'A4 . E5 . F5 . E5 . D5 . . Bb4 A4 . . .',
  'E5 . . . . . D5 E5 F5 . E5 . D5 . A4 .',
];
// the flute mewing over it: a note let fall
const NEKO_MEOW = [REST, '. . . . . . . . F6 - E6 - . . . .', REST, '. . . . A6 - F6 - E6 - . . . . . .'];
const NEKO_BASS = ['A2', 'D2', 'A2', 'E2'].map((n) => `${n} . . ${n} . . ${n} . ${n} . . ${n} . . ${n} .`);
const NEKO_KOTO = [['A4', 'E5'], ['D5', 'A5'], ['A4', 'E5'], ['E5', 'Bb5']].map(([a, b]) => `. . ${a}+${b} . . . ${a}+${b} . . . ${a}+${b} . . . ${a}+${b} .`);

// ---------------------------------------------------------------- FUNA-YUREI: the ghost ship (D in-scale, heavy)
const BOSS_ROOTS = [['D2', 'A2', 'D3'], ['D2', 'A2', 'D3'], ['Bb1', 'Gb2', 'Bb2'], ['Bb1', 'Gb2', 'Bb2'], ['G1', 'D2', 'G2'], ['G1', 'D2', 'G2'], ['Eb2', 'Bb2', 'Eb3'], ['A1', 'A2', 'D3']];
const BOSS_BIWA = BOSS_ROOTS.map(([r, f, o]) => `${r} . ${r} ${f} . ${r} ${f} ${o} ${r} . ${r} ${f} . ${o} ${f} ${r}`);
const BOSS_BASS = BOSS_ROOTS.map(([r]) => `${r} - - - - - ${r} - ${r} - - - ${r} - - -`);
const BOSS_LEAD = [
  'D5 - - - Eb5 - D5 - A4 - - - Bb4 - A4 -',
  'G4 - - - - - - - . . D5 . Eb5 . G5 .',
  'A5 - - - G5 - Eb5 - D5 - - - Eb5 - G5 -',
  'D5 - - - - - - - . . Bb4 . A4 . G4 .',
  'G4 - - - Bb4 - D5 - Eb5 - - - D5 - Bb4 -',
  'A4 - - - G4 - - - D4 - Eb4 - G4 - A4 -',
  'Bb4 - - - Eb5 - - - D5 - Bb4 - G4 - Eb4 -',
  'A4 - - - - - - - A4 . Bb4 . D5 . Eb5 .',
];
// the conch (horagai) blown long and low over it
const CONCH = ['D3 - - - - - - - - - - - . . . .', REST, 'Bb2 - - - - - - - - - - - . . . .', REST, 'G2 - - - - - - - - - - - . . . .', REST, 'Eb3 - - - - - - - . . . . . . . .', 'A2 - - - - - - - - - - - . . . .'];
const BOSS_DRUMS = fill('K . . K x . K . K . x K K . x K', 'K . K . K K x . K K K K K x K K');

export const SONGS11 = {
  // Innoshima in the afternoon: the koto, the tune on the flute, the wind bells, the big drum now and then
  s11_intro: song(BPM, 8, { lead: LEAD_A, koto: KOTO_SLOW, bass: BASS_HALF, orgel: FURIN, drums: DRUMS_INTRO }, { lead: 0.8, koto: 0.7, bass: 0.6, orgel: 0.35, drums: 0.6 }),
  // the great bridge and Mukaishima: the shamisen comes in, the drums
  s11_build: song(BPM, 8, { lead: LEAD_A, koto: KOTO, shamisen: SHAMI, bass: BASS, drums: DRUMS_BUILD }, { lead: 0.8, koto: 0.6, shamisen: 0.6, drums: 0.7 }),
  // over the strait and along the town in the golden hour: the whole tune and its answer
  s11_full: song(BPM, 16, { lead: LEAD, koto: KOTO, shamisen: SHAMI, bass: BASS, drums: DRUMS_FULL, shaker: SHAKE }, { lead: 0.8, koto: 0.6, shamisen: 0.65, drums: 0.75, shaker: 0.5 }),
  // the hillside at dusk: the koto takes the tune, the flute holds long notes over it, the bells
  s11_yugure: song(BPM, 16, { koto: LEAD, lead: LEAD_B.concat(LEAD_A).map(quarters), pad: PAD, bass: BASS_HALF, orgel: [...FURIN, ...FURIN], drums: DRUMS_INTRO }, { koto: 0.85, lead: 0.5, pad: 0.6, bass: 0.6, orgel: 0.35, drums: 0.55 }),
  // the festival on Hondōri at night: the gong and the clappers
  s11_matsuri: song(BPM, 16, { lead: LEAD, shamisen: SHAMI, koto: KOTO_SLOW, bass: BASS, drums: DRUMS_MATSURI }, { lead: 0.8, shamisen: 0.75, koto: 0.5, drums: 0.75 }),
  // the water before the station: a hush, the bells
  s11_minato: song(BPM, 8, { lead: LEAD_A.map(quarters), koto: KOTO_SLOW, pad: PAD, bass: BASS_HALF, orgel: FURIN }, { lead: 0.6, koto: 0.55, pad: 0.75, bass: 0.5, orgel: 0.4 }),
  s11_neko: song(144, 4, { shamisen: NEKO_TUNE, lead: NEKO_MEOW, koto: NEKO_KOTO, bass: NEKO_BASS, drums: ['h . h . K . x . h . h . K k x .'], shaker: ['s . S . s . S . s . S . s . S s'] }, { shamisen: 0.9, lead: 0.7, koto: 0.5, drums: 0.85, shaker: 0.5 }),
  s11_boss: song(132, 8, { shakuhachi: BOSS_LEAD, biwa: BOSS_BIWA, brass: CONCH, bass: BOSS_BASS, drums: BOSS_DRUMS }, { shakuhachi: 0.85, biwa: 0.65, brass: 0.4, bass: 0.6, drums: 0.72 }),
  // after it: the festival's tune, gladder, the gong and the bells, the fireworks going on
  s11_hanabi: song(BPM, 16, { lead: [...LEAD_B, ...LEAD_A], shamisen: SHAMI, koto: KOTO, bass: BASS, orgel: [...FURIN, ...FURIN], drums: DRUMS_MATSURI, shaker: SHAKE }, { lead: 0.85, shamisen: 0.7, koto: 0.55, orgel: 0.4, drums: 0.8, shaker: 0.45 }),
};
