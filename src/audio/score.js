// Stage 1 soundtrack "Senbon" — original, in the Japanese "in" scale on A (A Bb D E F).
//
// Every bar is 16 steps (16th notes). Melodic tokens: note name (A4, Bb3, ...) or a chord "A3+E4";
// '-' holds the previous note, '.' is a rest. Percussion tokens: K = big taiko, k = small taiko,
// x = "ka" (rim), s / S = shaker / accented shaker; Okinawa: p = paranku, c = sanba; Sapporo: n = naruko, j = sleigh bells.
//
// Stage songs share one 8-bar progression (A A F F D D Bb E) and are switched on bar lines,
// so the music can grow with the stage without losing its place in the harmony.

import { SONGS2 } from './score2.js';
import { SONGS3 } from './score3.js';

const bar = (s) => s;

// ---- koto arpeggios, one per bar of the progression
const KOTO = [
  bar('A4 . E5 . A5 . E5 . Bb5 . A5 . E5 . D5 .'),
  bar('A4 . E5 . A5 . Bb5 . A5 . E5 . D5 . E5 .'),
  bar('F4 . A4 . D5 . F5 . A5 . F5 . D5 . A4 .'),
  bar('F4 . A4 . D5 . A4 . F5 . D5 . A5 . D5 .'),
  bar('D4 . F4 . A4 . D5 . F5 . D5 . A4 . F4 .'),
  bar('D4 . A4 . F4 . A4 . D5 . A4 . F5 . A4 .'),
  bar('Bb3 . D4 . F4 . Bb4 . D5 . Bb4 . F4 . D4 .'),
  bar('E4 . A4 . Bb4 . E5 . A5 . E5 . Bb4 . A4 .'),
];
// quarter-note version for calm sections
const KOTO_SLOW = KOTO.map((b) =>
  b
    .split(' ')
    .map((t, i) => (i % 4 === 0 ? t : '.'))
    .join(' '),
);

const PAD = ['A3+E4', 'A3+E4', 'F3+A3', 'F3+A3', 'D3+F3+A3', 'D3+F3+A3', 'Bb2+F3+D4', 'E3+A3'].map(
  (c) => `${c} - - - - - - - - - - - - - - -`,
);

const BASS_HALF = ['A2', 'A2', 'F2', 'F2', 'D2', 'D2', 'Bb2', 'E2'].map((n) => `${n} - - - - - - - ${n} - - - - - - -`);

const BASS = [
  'A2 . A3 . A2 . A3 . A2 . A3 . E3 . A3 .',
  'A2 . A3 . A2 . A3 . A2 . A3 . E3 . A3 .',
  'F2 . F3 . F2 . F3 . F2 . F3 . A2 . F3 .',
  'F2 . F3 . F2 . F3 . F2 . F3 . A2 . F3 .',
  'D2 . D3 . D2 . D3 . D2 . D3 . A2 . D3 .',
  'D2 . D3 . D2 . D3 . D2 . D3 . A2 . D3 .',
  'Bb2 . Bb3 . Bb2 . Bb3 . Bb2 . Bb3 . F3 . Bb3 .',
  'E2 . E3 . E2 . E3 . E2 . E3 . Bb2 . D3 .',
];

// ---- main theme
const LEAD_A = [
  'A4 - - E5 - - F5 - E5 - D5 - E5 - - -',
  '- - - - A4 . Bb4 . D5 - - - E5 - - -',
  'F5 - - E5 - - D5 - E5 - F5 - A5 - - -',
  '- - - - F5 . E5 . D5 - - - - - - -',
  'D5 - - F5 - - A5 - Bb5 - A5 - F5 - - -',
  'E5 - F5 - E5 - D5 - - - A4 - - - - -',
  'Bb4 - D5 - F5 - Bb5 - A5 - - - F5 - E5 -',
  'E5 - - - - - - - - - - - D5 . E5 .',
];
// second half: higher, busier answer
const LEAD_B = [
  'E5 . E5 . A5 - - - E5 - D5 - E5 - A4 -',
  'Bb4 - - - A4 - - - . . E5 . F5 . E5 .',
  'F5 . F5 . A5 - - - F5 - E5 - D5 - E5 -',
  'A5 - - - - - - - . . A5 . Bb5 . A5 .',
  'D6 - - - A5 - - - F5 - - - A5 - D6 -',
  'E6 - - - D6 - A5 - F5 - - - D5 - - -',
  'F5 - - - Bb5 - - - A5 - F5 - D5 - F5 -',
  'E5 - - - - - - - E5 . F5 . A5 . Bb5 .',
];

const repeat = (pattern, n, last) => [...Array(n - 1).fill(pattern), last ?? pattern];
const DRUMS_INTRO = repeat('K . . . . . . . K . . k . . . .', 8, 'K . . . K . . . K . k . K . k k');
const DRUMS_BUILD = repeat('K . . . x . . K K . . . x . . .', 8, 'K . x K x . K . K K x K K K K K');
const DRUMS_FULL = repeat('K . . K x . K . K . . K x . K x', 8, 'K . K . K . K . K K K K K K K K');
const SHAKE_8 = ['s . s . S . s . s . s . S . s .'];
const SHAKE_16 = ['s s S s s s S s s s S s s s S s'];

// ---- miniboss: phrygian ostinato A | Bb | A | E
const BOSS_BASS = [
  'A2 A2 A3 A2 A2 A3 A2 A3 A2 A2 A3 A2 Bb2 A2 E3 A2',
  'Bb2 Bb2 Bb3 Bb2 Bb2 Bb3 Bb2 Bb3 Bb2 Bb2 Bb3 Bb2 A2 Bb2 F3 Bb2',
  'A2 A2 A3 A2 A2 A3 A2 A3 A2 A2 A3 A2 Bb2 A2 E3 A2',
  'E2 E2 E3 E2 E2 E3 E2 E3 E2 E2 E3 E2 F2 E2 Bb2 E2',
];
const BOSS_KOTO = [
  'A5 . E5 . Bb5 . E5 . A5 . E5 . Bb5 A5 E5 D5',
  'Bb5 . F5 . D6 . F5 . Bb5 . F5 . A5 Bb5 F5 D5',
  'A5 . E5 . Bb5 . E5 . A5 . E5 . Bb5 A5 E5 D5',
  'E5 . Bb4 . A5 . E5 . E5 . Bb4 . F5 E5 D5 Bb4',
];
const BOSS_LEAD = [
  'A5 - - - Bb5 - A5 - E5 - - - F5 - E5 -',
  'D5 - - - E5 - - - Bb4 - - - A4 - - -',
  'A5 - - - Bb5 - A5 - E6 - - - D6 - Bb5 -',
  'A5 - - - - - - - E5 . F5 . E5 . D5 .',
];
const BOSS_DRUMS = repeat('K . K x K . K x K . K x K K x x', 4, 'K K x K K x K K x K K x K K K K');

const REST = '. . . . . . . . . . . . . . . .';

export const SONGS = {
  title: {
    bpm: 92,
    bars: 8,
    loop: true,
    sync: false,
    mix: { lead: 1.1, koto: 1.5, pad: 1.6 },
    tracks: { koto: KOTO_SLOW, pad: PAD, lead: LEAD_A },
  },
  intro: {
    bpm: 138,
    bars: 8,
    loop: true,
    sync: true,
    tracks: { koto: KOTO, pad: PAD, bass: BASS_HALF, drums: DRUMS_INTRO },
  },
  build: {
    bpm: 138,
    bars: 8,
    loop: true,
    sync: true,
    mix: { koto: 0.85 },
    tracks: { koto: KOTO, bass: BASS, drums: DRUMS_BUILD, shaker: SHAKE_8, lead: LEAD_A },
  },
  full: {
    bpm: 138,
    bars: 16,
    loop: true,
    sync: true,
    mix: { koto: 0.8 },
    tracks: { koto: KOTO, bass: BASS, drums: DRUMS_FULL, shaker: SHAKE_16, lead: [...LEAD_A, ...LEAD_B] },
  },
  final: {
    bpm: 138,
    bars: 8,
    loop: true,
    sync: true,
    mix: { koto: 0.8, pad: 0.8 },
    tracks: { koto: KOTO, bass: BASS, drums: DRUMS_FULL, shaker: SHAKE_16, lead: LEAD_B, pad: PAD },
  },
  boss: {
    bpm: 138,
    bars: 4,
    loop: true,
    sync: true,
    mix: { koto: 0.55, pad: 1.2 },
    tracks: {
      bass: BOSS_BASS,
      koto: BOSS_KOTO,
      lead: BOSS_LEAD,
      drums: BOSS_DRUMS,
      shaker: SHAKE_16,
      pad: ['A2+E3 - - - - - - - - - - - - - - -'],
    },
  },
  clear: {
    bpm: 138,
    bars: 3,
    loop: false,
    sync: false,
    tracks: {
      koto: ['A4 . D5 . E5 . A5 . D6 . E6 . A5 . E6 .', 'A5 - - - - - - - . . . . . . . .', REST],
      lead: ['. . . . . . . . . . . . E5 - F5 -', 'A5 - - - - - - - - - - - - - - -', REST],
      bass: ['A2 . . . . . . . . . . . E2 . E2 .', 'A2 - - - - - - - - - - - - - - -', REST],
      drums: ['K . . . K . . . K . K . K K K K', 'K . . . . . . . . . . . . . . .', REST],
      pad: [REST, 'A3+E4+A4 - - - - - - - - - - - - - - -', REST],
    },
  },
  over: {
    bpm: 84,
    bars: 3,
    loop: false,
    sync: false,
    mix: { koto: 2, pad: 2 },
    tracks: {
      koto: ['E5 - - - D5 - - - Bb4 - - - A4 - - -', 'A3 - - - - - - - - - - - - - - -', REST],
      pad: ['A2+E3 - - - - - - - - - - - - - - -', 'A2+E3 - - - - - - - - - - - - - - -', REST],
    },
  },
};

// stage 2 (Okinawa) songs live in score2.js
Object.assign(SONGS, SONGS2, SONGS3);

// ---------------------------------------------------------------- parsing
const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const NOTE = /^([A-G])(b|#)?(\d)$/;
export const PERCUSSION = new Set(['drums', 'shaker']);

function midi(tok) {
  const m = NOTE.exec(tok);
  if (!m) throw new Error(`music: bad note "${tok}"`);
  return 12 * (Number(m[3]) + 1) + SEMI[m[1]] + (m[2] === 'b' ? -1 : m[2] === '#' ? 1 : 0);
}

/** Turn a song definition into { ...def, events: { [step]: [event] } }. */
export function parseSong(name, def) {
  const events = {};
  for (const [track, bars] of Object.entries(def.tracks)) {
    const tokens = [];
    for (let b = 0; b < def.bars; b++) {
      const t = bars[b % bars.length].trim().split(/\s+/);
      if (t.length !== 16) throw new Error(`music: ${name}.${track} bar ${b} has ${t.length} steps`);
      tokens.push(...t);
    }
    tokens.forEach((tok, i) => {
      if (tok === '.' || tok === '-') return;
      let len = 1;
      while (len < tokens.length && tokens[(i + len) % tokens.length] === '-') len++;
      const ev = PERCUSSION.has(track) ? { track, hit: tok } : { track, notes: tok.split('+').map(midi), len };
      (events[i] ||= []).push(ev);
    });
  }
  return { name, mix: {}, ...def, events };
}
