// Stage 12 (Fukuoka): original music, from night to sunset. Every stage song shares one 8-bar progression in A minor
// (Am F G Em | Am F Dm E) and one tempo, so the music changes district on a bar line without losing its place.
// The night city: the shamisen over a warm bass, a touch of city jazz on the neon of Nakasu (an electric piano's
// chords, brushes of hi-hat, the tune on a reed); dawn: koto and flute; Sasaguri: a hush, the long flute, a gong now
// and then (the temple bell itself rings over the Buddha: stage12.json "bells"); Dazaifu: in the manner of the court
// music (gagaku) of the old government at the empire's edge, the mouth organ (shō) holding its clusters, a reed
// (hichiriki) on the tune, a flute (ryūteki) over it, the drums sparse; the fields at sunset: the koto takes the tune.
// The stall's theme is a cheeky street tune with clappers and a vendor's call on the reed; the wall's is heavy taiko
// and low brass, and falls almost silent as it goes invisible in the night; after it a quiet evening.

const song = (bpm, bars, tracks, mix = {}) => ({ bpm, bars, loop: true, sync: true, tracks, mix });
const quarters = (b) => b.split(' ').map((t, i) => (i % 4 === 0 ? t : t === '.' ? '.' : '-')).join(' ');
const sparse = (b) => b.split(' ').map((t, i) => (i % 4 === 0 ? t : '.')).join(' ');
const REST = '. . . . . . . . . . . . . . . .';
const BPM = 104;
const fill = (beat, last) => [...Array(7).fill(beat), last];

// ---------------------------------------------------------------- the stage's progression
const ROOTS = ['A1', 'F1', 'G1', 'E1', 'A1', 'F1', 'D2', 'E1'];
// each chord's notes low to high (the koto's arpeggios go up and down them)
const KOTO_NOTES = [
  ['A3', 'C4', 'E4', 'G4', 'A4'],
  ['F3', 'A3', 'C4', 'E4', 'F4'],
  ['G3', 'B3', 'D4', 'E4', 'G4'],
  ['E3', 'G3', 'B3', 'D4', 'E4'],
  ['A3', 'C4', 'E4', 'G4', 'A4'],
  ['F3', 'A3', 'C4', 'E4', 'F4'],
  ['D4', 'F4', 'A4', 'C5', 'D5'],
  ['E3', 'A3', 'B3', 'D4', 'E4'],
];
const KOTO = KOTO_NOTES.map((n) => [0, 1, 2, 4, 3, 2, 1, 2].map((k) => `${n[k]} .`).join(' '));
const KOTO_SLOW = KOTO.map(sparse);
const PAD = ['A2+E3+G3', 'F2+C3+E3', 'G2+D3+E3', 'E2+B2+D3', 'A2+E3+G3', 'F2+C3+E3', 'D3+A3+C4', 'E2+B2+D3'].map((c) => `${c} - - - - - - - - - - - - - - -`);
const BASS_HALF = ROOTS.map((n) => `${n} - - - - - - - ${n} - - - - - - -`);
// the warm bass walking under the night city: root, third, fifth and a step to the next chord
const WALK = [['A1', 'C2', 'E2', 'Eb2'], ['F1', 'A1', 'C2', 'Gb1'], ['G1', 'B1', 'D2', 'Eb2'], ['E1', 'G1', 'B1', 'Ab1'], ['A1', 'C2', 'E2', 'Gb2'], ['F1', 'A1', 'C2', 'Db2'], ['D2', 'F2', 'A1', 'Bb1'], ['E1', 'Ab1', 'B1', 'Ab1']].map((q) => q.map((n) => `${n} - . .`).join(' '));
// the electric piano's chords on the neon, off the beat
const EP_CHORDS = ['G3+C4+E4', 'A3+C4+E4', 'G3+B3+E4', 'G3+B3+D4', 'G3+C4+E4', 'A3+C4+E4', 'F3+A3+C4', 'Ab3+D4+E4'];
const EP = EP_CHORDS.map((c) => `. . ${c} - . . . . . . ${c} . . . . .`);
const EP_SLOW = EP_CHORDS.map((c) => `. . . . ${c} - - - . . . . . . . .`);
// the shamisen: root, fifth and octave plucked in a figure that skips
const SHAMI_NOTES = { A1: ['A3', 'E4', 'A4'], F1: ['F3', 'C4', 'F4'], G1: ['G3', 'D4', 'G4'], E1: ['E3', 'B3', 'E4'], D2: ['D3', 'A3', 'D4'] };
const SHAMI = ROOTS.map((n) => {
  const [r, f, o] = SHAMI_NOTES[n];
  return `${r} . . ${f} . ${r} ${o} . ${r} . . ${f} . ${o} ${f} .`;
});
const SHAMI_SLOW = SHAMI.map(sparse);

const LEAD_A = [
  'E5 - - - D5 - C5 - A4 - - - C5 - D5 -',
  'E5 - - - - - F5 - E5 - D5 - C5 - - -',
  'D5 - - - G5 - - - E5 - D5 - B4 - - -',
  'E5 - - - - - - - . . G4 . A4 . B4 .',
  'C5 - - - E5 - - - A5 - G5 - E5 - - -',
  'F5 - - - E5 - C5 - A4 - - - C5 - - -',
  'D5 - - - F5 - - - E5 - D5 - C5 - A4 -',
  'B4 - - - - - - - . . . . . . . .',
];
// the answer, higher
const LEAD_B = [
  'A5 - - - G5 - E5 - G5 - - - A5 - C6 -',
  'A5 - - - - - G5 - F5 - E5 - C5 - - -',
  'D5 - - - E5 - G5 - B5 - - - A5 - G5 -',
  'E5 - - - - - - - E5 . G5 . A5 . B5 .',
  'C6 - - - B5 - A5 - G5 - - - E5 - G5 -',
  'A5 - - - - - G5 - F5 - - - E5 - C5 -',
  'D5 - - - F5 - A5 - C6 - - - B5 - A5 -',
  'Ab5 - - - - - B5 - E5 - - - . . . .',
];
const LEAD = [...LEAD_A, ...LEAD_B];
// the reed's tune an octave down, for the night (a city tune in a bar by the river)
const down = (b) => b.replace(/([A-G]b?)(\d)/g, (m, n, o) => `${n}${Number(o) - 1}`);
const REED = LEAD.map(down);

// drums: the night city (kick, rim and hats, the clappers now and then), the day (taiko), the court (sparse)
const DRUMS_NIGHT = fill('b . i . r . i b . . i . r . i i', 'b . i . r . i b . b i . r h r h');
const DRUMS_NIGHT_SOFT = fill('b . i . . . i . . . i . . . i .', 'b . i . . . i . b . i . h . . .');
const DRUMS_DAY = fill('K . . k x . k . K . k . x . k k', 'K . K . K . K k K K x K K K K K');
const DRUMS_SOFT = fill('K . . . . . . . K . . k . . . .', 'K . . . K . . . K . k . K . k .');
const DRUMS_COURT = fill('K . . . . . . . . . . . z . . .', 'K . . . . . . . Z . . . K . . .');
const GONG = ['g . . . . . . . . . . . . . . .', REST, REST, REST, '. . . . . . . . g . . . . . . .', REST, REST, REST];
const SHAKE = ['s . s . S . s . s . s . S . s .'];
// the court's mouth organ: a cluster held through each bar
const SHO = ['A3+E4+B4', 'F3+C4+G4', 'G3+D4+A4', 'E3+B3+E4', 'A3+E4+B4', 'F3+C4+G4', 'D4+A4+E5', 'E3+B3+E4'].map((c) => `${c} - - - - - - - - - - - - - - -`);
// the stars coming out
const STARS = ['. . . . . . . . E6 . . . . . . .', REST, '. . . . A6 . . . . . . . G6 . . .', REST, '. . E6 . . . . . . . . . . . C7 .', REST, '. . . . . . . . B6 . . . E6 . . .', REST];

// ---------------------------------------------------------------- YATAI-OBAKE: the stall that will not close (D yo, cheeky)
// a vendor's call on the reed, the shamisen jaunty under it, the clappers and the woodblock
const YATAI_CALL = [
  'A4 . B4 . D5 - - . B4 . A4 . G4 - - .',
  'A4 . B4 . D5 . E5 . D5 - - - . . . .',
  'E5 . D5 . B4 . A4 . G4 . A4 . B4 - - .',
  'A4 - - - . . E4 . G4 . A4 - . . . .',
];
const YATAI_SHAMI = [['D3', 'A3', 'D4'], ['G3', 'D4', 'G4'], ['A3', 'E4', 'A4'], ['D3', 'A3', 'D4']].map(([r, f, o]) => `${r} . ${f} . ${o} . ${f} . ${r} . ${f} . ${o} ${f} ${r} .`);
const YATAI_BASS = ['D2', 'G1', 'A1', 'D2'].map((n) => `${n} . . ${n} . . ${n} . ${n} . . ${n} . . ${n} .`);
const YATAI_KOTO = [['D5', 'A5'], ['G4', 'D5'], ['A4', 'E5'], ['D5', 'A5']].map(([a, b]) => `. . ${a}+${b} . . . . . . . ${a}+${b} . . . . .`);

// ---------------------------------------------------------------- NURIKABE: the wall in the way (E in-scale, heavy)
const BOSS_ROOTS = [['E1', 'B1', 'E2'], ['F1', 'C2', 'F2'], ['E1', 'B1', 'E2'], ['C2', 'G2', 'C3'], ['A1', 'E2', 'A2'], ['B1', 'F2', 'B2'], ['E1', 'B1', 'E2'], ['E1', 'F1', 'E2']];
const BOSS_BIWA = BOSS_ROOTS.map(([r, f, o]) => `${r} . . ${r} ${f} . ${r} . ${o} . ${r} . ${f} . ${r} ${r}`);
const BOSS_BASS = BOSS_ROOTS.map(([r]) => `${r} - - - - - ${r} - ${r} - - - ${r} - - -`);
const BOSS_LEAD = [
  'E5 - - - F5 - E5 - B4 - - - C5 - B4 -',
  'A4 - - - - - - - . . E5 . F5 . A5 .',
  'B5 - - - A5 - F5 - E5 - - - F5 - A5 -',
  'E5 - - - - - - - . . C5 . B4 . A4 .',
  'A4 - - - C5 - E5 - F5 - - - E5 - C5 -',
  'B4 - - - A4 - - - E4 - F4 - A4 - B4 -',
  'C5 - - - F5 - - - E5 - C5 - A4 - F4 -',
  'E4 - - - - - - - E4 . F4 . A4 . B4 .',
];
// the low brass, long, like the earth groaning
const BOSS_BRASS = ['E2 - - - - - - - - - - - . . . .', REST, 'E2 - - - - - - - F2 - - - - - - -', REST, 'A1 - - - - - - - - - - - . . . .', REST, 'E2 - - - - - - - - - - - . . . .', 'F2 - - - - - - - E2 - - - - - - -'];
const BOSS_DRUMS = fill('K . . K x . K . K . x K K . x K', 'K . K . K K x . K K K K K x K K');
// the night: nearly nothing, a heartbeat on the big drum, the flute breathing, the biwa now and then
const BOSS_NIGHT_DRUMS = fill('K . . . . . . . K . . . . . . .', 'K . . . . . . . K . . . K . . .');

export const SONGS12 = {
  // by the bay at night: the electric piano, the shamisen picking, the bass, the hats
  s12_intro: song(BPM, 8, { ep: EP_SLOW, shamisen: SHAMI_SLOW, bass: BASS_HALF, clarinet: LEAD_A.map((b) => quarters(down(b))), drums: DRUMS_NIGHT_SOFT }, { ep: 0.93, shamisen: 1.0, bass: 1.0, clarinet: 0.7, drums: 0.78 }),
  // Ōhori's park and the castle: the bass walks, the shamisen comes in
  s12_build: song(BPM, 8, { shamisen: SHAMI, ep: EP, bass: WALK, clarinet: LEAD_A.map(down), drums: DRUMS_NIGHT }, { shamisen: 1.0, ep: 0.8, bass: 1.0, clarinet: 0.87, drums: 0.87 }),
  // Tenjin and Nakasu on the neon: the whole tune on the reed and its answer, the shamisen, the electric piano
  s12_full: song(BPM, 16, { clarinet: REED, shamisen: SHAMI, ep: EP, bass: WALK, drums: DRUMS_NIGHT, shaker: SHAKE }, { clarinet: 1.0, shamisen: 1.0, ep: 0.72, bass: 1.0, drums: 0.94, shaker: 0.51 }),
  // Hakata at dawn: the koto and the flute
  s12_asa: song(BPM, 16, { koto: KOTO, lead: LEAD.map(quarters), pad: [...PAD, ...PAD], bass: BASS_HALF, drums: DRUMS_SOFT }, { koto: 0.84, lead: 0.72, pad: 0.66, bass: 0.66, drums: 0.6 }),
  // the station and the airport by day: the whole tune on the flute, the shamisen and koto, the taiko
  s12_hiru: song(BPM, 16, { lead: LEAD, koto: KOTO, shamisen: SHAMI, bass: BASS_HALF, drums: DRUMS_DAY, shaker: SHAKE }, { lead: 0.8, koto: 0.55, shamisen: 0.6, bass: 0.6, drums: 0.7, shaker: 0.45 }),
  // Sasaguri's valleys in the mist: the long flute, a gong now and then, the koto sparse
  s12_sasaguri: song(BPM, 8, { shakuhachi: LEAD_A.map(quarters), koto: KOTO_SLOW, pad: PAD, bass: BASS_HALF, drums: GONG }, { shakuhachi: 0.94, koto: 0.68, pad: 0.88, bass: 0.61, drums: 0.68 }),
  // Dazaifu: the court music of the old government (shō, hichiriki, ryūteki, the drums sparse)
  s12_dazaifu: song(BPM, 16, { sho: [...SHO, ...SHO], clarinet: LEAD.map(quarters), lead: LEAD_B.concat(LEAD_A).map(sparse), koto: [...KOTO_SLOW, ...KOTO_SLOW], bass: BASS_HALF, drums: DRUMS_COURT }, { sho: 1.0, clarinet: 0.81, lead: 0.61, koto: 0.61, bass: 0.61, drums: 0.81 }),
  // the fields at sunset under the earthwork: the koto takes the tune, the long flute over it
  s12_yugure: song(BPM, 16, { koto: LEAD, shakuhachi: LEAD_B.concat(LEAD_A).map(quarters), pad: [...PAD, ...PAD], bass: BASS_HALF, drums: DRUMS_SOFT }, { koto: 0.92, shakuhachi: 0.57, pad: 0.69, bass: 0.63, drums: 0.57 }),
  s12_yatai: song(150, 4, { clarinet: YATAI_CALL, shamisen: YATAI_SHAMI, koto: YATAI_KOTO, bass: YATAI_BASS, drums: ['h . x . K . h . h . x . K k h .'], shaker: ['s . S . s . S . s . S . s . S s'] }, { clarinet: 0.85, shamisen: 0.8, koto: 0.45, bass: 0.65, drums: 0.85, shaker: 0.45 }),
  s12_boss: song(128, 8, { shakuhachi: BOSS_LEAD, biwa: BOSS_BIWA, brass: BOSS_BRASS, bass: BOSS_BASS, drums: BOSS_DRUMS }, { shakuhachi: 0.8, biwa: 0.65, brass: 0.5, bass: 0.65, drums: 0.78 }),
  // the wall gone invisible: a heartbeat, the flute's breath, the brass far off
  s12_boss_night: song(128, 8, { shakuhachi: BOSS_LEAD.map(sparse), biwa: BOSS_BIWA.map(sparse), brass: BOSS_BRASS, drums: BOSS_NIGHT_DRUMS }, { shakuhachi: 0.55, biwa: 0.4, brass: 0.35, drums: 0.7 }),
  // the evening after it: the koto slow, the flute, the stars coming out
  s12_yube: song(BPM, 16, { koto: [...KOTO_SLOW, ...KOTO_SLOW], lead: LEAD_A.concat(LEAD_B).map(quarters), pad: [...PAD, ...PAD], bass: BASS_HALF, orgel: [...STARS, ...STARS] }, { koto: 0.84, lead: 0.77, pad: 0.84, bass: 0.7, orgel: 0.49 }),
};
