// Stage 9 (Tokyo): original 80s city pop on synthesizers — electric piano, slap bass, synth brass, a drum
// machine — with a shamisen cutting the off-beats where a guitar would. Akihabara turns it 8-bit, Asakusa
// hands the tune to the flute over taiko. Every stage song shares one 8-bar progression in D
// (Gmaj7 F#m7 Em7 A7 | Dmaj7 Bm7 Em7-A7 F#7), so the music changes district on a bar line without losing
// its place. The two minibosses and Kurogane get themes of their own.

const song = (bpm, bars, tracks, mix = {}) => ({ bpm, bars, loop: true, sync: true, tracks, mix });
const each = (list, fn) => list.map(fn);
const quarters = (b) => b.split(' ').map((t, i) => (i % 4 === 0 ? t : '-')).join(' ');
const REST = '. . . . . . . . . . . . . . . .';

// ---------------------------------------------------------------- the stage theme
// one entry per bar; bar 7 changes chord half-way: [first half, second half]
const CHORDS = ['G3+B3+D4+F#4', 'F#3+A3+C#4+E4', 'E3+G3+B3+D4', 'E3+G3+A3+C#4', 'D3+F#3+A3+C#4', 'D3+F#3+A3+B3', ['E3+G3+B3+D4', 'E3+G3+A3+C#4'], 'E3+F#3+A#3+C#4'];
const ROOTS = [['G2', 'G3'], ['F#2', 'F#3'], ['E2', 'E3'], ['A2', 'A3'], ['D2', 'D3'], ['B1', 'B2'], [['E2', 'E3'], ['A2', 'A3']], ['F#2', 'F#3']];
// the shamisen's off-beat cuts, two notes a half bar
const CUTS = [['D5', 'B4'], ['C#5', 'A4'], ['B4', 'G4'], ['C#5', 'G4'], ['A4', 'F#4'], ['F#4', 'D5'], [['B4', 'G4'], ['C#5', 'A4']], ['A#4', 'C#5']];
// 8-bit arpeggios for Akihabara, four notes of the chord going round
const ARPS = [['G4', 'B4', 'D5', 'F#5'], ['F#4', 'A4', 'C#5', 'E5'], ['E4', 'G4', 'B4', 'D5'], ['E4', 'G4', 'A4', 'C#5'], ['D4', 'F#4', 'A4', 'C#5'], ['D4', 'F#4', 'A4', 'B4'], [['E4', 'G4', 'B4', 'D5'], ['E4', 'G4', 'A4', 'C#5']], ['F#4', 'A#4', 'C#5', 'E5']];
const halves = (x) => (Array.isArray(x[0]) ? x : [x, x]);

// electric piano: the chord on one, again pushed ahead of three
const EP = each(CHORDS, (c) => (Array.isArray(c) ? `${c[0]} - - . . . ${c[0]} - ${c[1]} - - . . . ${c[1]} .` : `${c} - - . . . ${c} - - . ${c} - . . . .`));
const PAD = each(CHORDS, (c) => (Array.isArray(c) ? `${c[0]} - - - - - - - ${c[1]} - - - - - - -` : `${c} - - - - - - - - - - - - - - -`));
const BASS_HALF = each(ROOTS, (r) => { const [a, b] = halves(r); return `${a[0]} - - - - - - - ${b[0]} - - - - - - -`; });
const BASS_Q = each(ROOTS, (r) => { const [a, b] = halves(r); return `${a[0]} . . . ${a[1]} . . . ${b[0]} . . . ${b[1]} . . .`; });
// slap bass: octaves, syncopated
const SLAP = each(ROOTS, (r) => { const [a, b] = halves(r); return `${a[0]} . ${a[1]} . . ${a[0]} ${a[1]} . ${b[0]} . ${b[1]} . . ${b[0]} ${b[1]} .`; });
const CUT = each(CUTS, (c) => { const [a, b] = Array.isArray(c[0]) ? c : [c, c]; return `. . ${a[0]} . . . ${a[1]} . . . ${b[0]} . . . ${b[1]} .`; });
const ARP = each(ARPS, (c) => { const [a, b] = halves(c); return [...a, ...a, ...b, ...b].join(' '); });
// synth brass pushing into the next bar
const BRASS = ['B4+D5+F#5', 'A4+C#5+E5', 'G4+B4+D5', 'G4+C#5+E5', 'A4+C#5+F#5', 'A4+D5+F#5', 'G4+C#5+E5', 'A#4+C#5+E5'].map((c, i) => (i % 2 ? `. . . . . . . . . . . . . . ${c} -` : `${c} - . . . . . . . . . . . . . .`));

const LEAD_A = [
  'B4 - - A4 B4 - D5 - - - F#5 - E5 - D5 -',
  'C#5 - - - - - A4 - - - . . E5 - C#5 -',
  'D5 - - B4 D5 - E5 - - - G5 - F#5 - E5 -',
  'C#5 - - - - - - - . . A4 . B4 . C#5 .',
  'D5 - - C#5 D5 - F#5 - A5 - - - F#5 - E5 -',
  'F#5 - - - D5 - - - B4 - - - A4 - B4 -',
  'G4 - B4 - D5 - E5 - G5 - - - E5 - C#5 -',
  'A#4 - - - C#5 - - - E5 - - - F#5 - - -',
];
const LEAD_B = [
  'F#5 - - - G5 - F#5 - D5 - - - B4 - D5 -',
  'E5 - - - C#5 - - - A4 - C#5 - E5 - A5 -',
  'G5 - - - F#5 - E5 - D5 - - - B4 - D5 -',
  'E5 - - - - - G5 - - - F#5 - E5 - C#5 -',
  'D5 - - - - - - - A4 - D5 - F#5 - A5 -',
  'B5 - - - A5 - - - F#5 - D5 - F#5 - A5 -',
  'G5 - - - E5 - B4 - A5 - - - G5 - E5 -',
  'F#5 - - - - - - - E5 - C#5 - A#4 - C#5 -',
];
const LEAD = [...LEAD_A, ...LEAD_B];

const KIT = 'b . i . r . i . b . i b r . o .';
const KIT_FILL = 'b . i . r . i . b . r r r . r r';
const kit = (beat, fill) => [beat, beat, beat, beat, beat, beat, beat, fill];
const HATS = 'b . i . . . i . . . i b . . i .';

// ---------------------------------------------------------------- Kasa-obake: hopping in the Shibuya rain (E minor)
const KASA_HOP = [
  'E5 . B4 . E5 . G5 . F#5 . E5 . B4 . . .',
  'C5 . G4 . C5 . E5 . D5 . C5 . G4 . . .',
  'A4 . C5 . E5 . A5 . G5 . E5 . C5 . A4 .',
  'B4 . D#5 . F#5 . A5 . B5 - - - A5 . F#5 .',
];
const KASA_LEAD = [REST, REST, REST, REST,
  'E5 - - - D#5 - E5 - G5 - - - F#5 - E5 -',
  'E5 - - - - - - - C5 - D5 - E5 - G5 -',
  'A5 - - - G5 - E5 - C5 - - - E5 - A5 -',
  'B5 - - - - - - - A5 - F#5 - D#5 - B4 -',
];
const KASA_EP = ['E3+G3+B3', 'C3+E3+G3', 'A2+C3+E3', 'B2+D#3+F#3+A3'].map((c) => `${c} - . ${c} - . . . ${c} - . ${c} - . . .`);
const KASA_BASS = ['E2', 'C2', 'A1', 'B1'].map((n) => `${n} . . ${n} . . ${n} . . . ${n} . . ${n} . .`);
// drops off the umbrella's ribs
const KASA_DRIP = ['B5 . . . . . . . . . E6 . . . . .', '. . . . G5 . . . . . . . C6 . . .', 'E6 . . . . . . . A5 . . . . . . .', '. . . . . . F#5 . . . B5 . . . . .'];

// ---------------------------------------------------------------- Taiyaki: festival in front of Senso-ji (D, yo scale)
const TY_FUE = [
  'D5 - E5 - G5 - A5 - B5 - A5 - G5 - E5 -',
  'G5 - - - A5 - G5 - E5 - D5 - E5 - - -',
  'A5 - B5 - A5 - G5 - E5 - G5 - A5 - - -',
  'B5 - A5 - G5 - E5 - D5 - - - - - . .',
];
const TY_SHAMI = [['D4', 'A4', 'D5'], ['G3', 'D4', 'G4'], ['A3', 'E4', 'A4'], ['D4', 'A4', 'D5']].map(([a, b, c]) => `${a} . ${b} . ${c} . ${b} . ${a} . ${b} . ${c} . ${b} .`);
const TY_BASS = ['D2', 'G1', 'A1', 'D2'].map((n) => `${n} - . . ${n} . . . ${n} - . . ${n} . ${n} .`);

// ---------------------------------------------------------------- Kurogane: the mech in the bay (B minor)
const BOSS_ROOTS = [['B1', 'B2'], ['G1', 'G2'], ['A1', 'A2'], ['F#1', 'F#2'], ['B1', 'B2'], ['G1', 'G2'], ['E2', 'E3'], ['F#1', 'F#2']];
const BOSS_SLAP = BOSS_ROOTS.map(([a, b]) => `${a} . ${b} ${a} . ${a} ${b} . ${a} . ${b} ${a} . ${a} ${b} ${a}`);
const BOSS_SHAMI = [['B3', 'F#4'], ['G3', 'D4'], ['A3', 'E4'], ['F#3', 'C#4'], ['B3', 'F#4'], ['G3', 'D4'], ['E4', 'B4'], ['F#3', 'C#4']].map(([a, b]) => `${a} . ${a} ${b} ${a} . ${a} ${b} ${a} . ${a} ${b} ${a} . ${b} ${a}`);
const BOSS_PAD = ['B2+D3+F#3', 'G2+B2+D3', 'A2+C#3+E3', 'F#2+A#2+C#3', 'B2+D3+F#3', 'G2+B2+D3', 'E2+G2+B2', 'F#2+A#2+E3'].map((c) => `${c} - - - - - - - - - - - - - - -`);
const BOSS_BRASS = [
  'B4 - - B4 - - D5 - F#5 - - - E5 - D5 -',
  'D5 - - - B4 - - - G4 - - - B4 - D5 -',
  'E5 - - E5 - - F#5 - A5 - - - G5 - F#5 -',
  'F#5 - - - - - - - . . C#5 . E5 . F#5 .',
  'B5 - - - A5 - F#5 - D5 - - - F#5 - B5 -',
  'G5 - - - F#5 - D5 - B4 - - - D5 - G5 -',
  'E5 - - - G5 - B5 - A5 - G5 - F#5 - E5 -',
  'F#5 - - - A#4 - - - C#5 - - - E5 - - -',
];

export const SONGS9 = {
  // Nakano and the way into Shinjuku: piano, pad and bass, the hats ticking
  s9_intro: song(116, 8, { ep: EP, pad: PAD, slap: BASS_HALF, kit: [HATS] }, { ep: 0.9, pad: 0.8, kit: 0.6 }),
  // the towers: the drum machine and the tune
  s9_build: song(116, 8, { lead: LEAD_A, ep: EP, slap: SLAP, kit: kit(KIT, KIT_FILL) }, { lead: 0.85, kit: 0.75 }),
  // the whole band: the tune's answer, brass, the shamisen cutting
  s9_full: song(116, 16, { lead: LEAD, ep: EP, slap: SLAP, brass: BRASS, shamisen: CUT, kit: kit(KIT, KIT_FILL) }, { lead: 0.85, brass: 0.7, shamisen: 0.65, kit: 0.75 }),
  // Akihabara: the tune and the arpeggios on a pulse wave, the chip bass, claps
  s9_akiba: song(116, 16, { chip: ARP, lead: LEAD, bass: BASS_Q, ep: EP, kit: kit('b . i . q . i . b . i b q . i .', 'b . q . q . q . b q q q q q q q') }, { chip: 1, lead: 0.9, ep: 0.7, kit: 0.85 }),
  // Asakusa: the flute takes the tune over taiko
  s9_asakusa: song(116, 16, { shakuhachi: LEAD, ep: EP, slap: SLAP, shamisen: CUT, drums: ['K . . . x . k . K . x . k k x .'], kit: [HATS] }, { shakuhachi: 0.8, ep: 0.7, shamisen: 0.75, drums: 0.8, kit: 0.5 }),
  s9_kasa: song(132, 8, { shamisen: KASA_HOP, lead: KASA_LEAD, ep: KASA_EP, slap: KASA_BASS, chip: KASA_DRIP, kit: ['b . . i q . i . b b . i q . i .'], shaker: ['s s S s s s S s s s S s s s S s'] }, { shamisen: 0.9, lead: 0.9, ep: 0.8, chip: 0.7, kit: 0.85, shaker: 0.7 }),
  s9_taiyaki: song(144, 4, { shakuhachi: TY_FUE, shamisen: TY_SHAMI, slap: TY_BASS, drums: ['K . k k x . k . K . k k x k x .'], shaker: ['g . . . g . . . g . . . g . g .'], kit: ['b . . . b . . . b . . . b . . .'] }, { shakuhachi: 0.85, shamisen: 0.7, drums: 0.85, shaker: 0.6, kit: 0.6 }),
  s9_boss: song(156, 8, { brass: BOSS_BRASS, slap: BOSS_SLAP, shamisen: BOSS_SHAMI, pad: BOSS_PAD, kit: kit('b . i . r . i b b . i . r . o .', 'b . r . r . r r b r r r r r r r'), drums: ['K . . . . . . . K . . K . . . .'] }, { brass: 0.9, shamisen: 0.6, pad: 0.8, kit: 0.8, drums: 0.8 }),
  // after the fight: the tune slowed down over the bay, fireworks going up
  s9_night: song(84, 8, { lead: LEAD_A.map(quarters), ep: EP.map(quarters), slap: BASS_HALF }, { lead: 0.7, ep: 0.75, slap: 0.6 }),
};
