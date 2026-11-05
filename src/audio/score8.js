// Original harbour / Kunchi themes, ending with a sparse nocturne over Inasa.
const melody = [
  'D5 - . A4 D5 . F5 . E5 - D5 . A4 - . .',
  'G4 - A4 . D5 - E5 . F5 - E5 . D5 - . .',
  'A4 . D5 . F5 - A5 . G5 - F5 . E5 - . .',
  'F5 - E5 . D5 - A4 . G4 - A4 . D5 - - -',
];
const bass = ['D2', 'G2', 'F2', 'A2'].map(n => `${n} - . . . . . . ${n} - . . . . . .`);
const koto = ['D4', 'G4', 'F4', 'A4'].map(n => `${n} . A4 . D5 . F5 . A5 . F5 . D5 . A4 .`);
const drums = ['K . x . k . x . K . x k . . x .'];
const song = (bpm, tracks, mix = {}) => ({ bpm, bars: 4, loop: true, sync: true, tracks, mix });
export const SONGS8 = {
  s8_intro: song(112, { shakuhachi: melody, koto, bass }, { koto: .6 }),
  s8_build: song(124, { shakuhachi: melody, koto, bass, drums }, { koto: .7 }),
  s8_heavy: song(138, { biwa: koto, shakuhachi: melody, bass, drums }, { biwa: .9 }),
  s8_boss: song(154, { shakuhachi: melody, biwa: koto, bass, drums, shaker: ['g . . . . . h . g . . . h . h .'] }),
  s8_night: song(76, { shakuhachi: melody.map(bar => bar.split(' ').map((n, i) => i % 4 === 0 ? n : '-').join(' ')), koto: koto.map(bar => bar.split(' ').map((n, i) => i % 4 === 0 ? n : '.').join(' ')), bass }, { shakuhachi: .65, koto: .5, bass: .4 }),
};
