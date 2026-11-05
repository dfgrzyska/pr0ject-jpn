import { Raster } from '../../lib/raster.mjs';

export function nagasakiSprites() {
  const out = [], add = (name, r) => out.push({ name, raster: r });
  const gold = 0xf2c35e, red = 0xb33a48, ink = 0x211c34;
  const traffic = new Raster(1, 1); traffic.set(0, 0, 0xf2d6a1); add('n_traffic', traffic);
  for (let f = 0; f < 2; f++) {
    let r = new Raster(17, 23);
    r.rect(7, 0, 3, 3, gold); r.disc(8, 10, 7, ink); r.disc(8, 10, 6, red);
    for (const x of [4, 8, 12]) r.line(x, 6, x, 14, f ? 0xef7751 : 0xe9a45b);
    r.rect(5, 4, 7, 2, gold); r.rect(5, 16, 7, 2, gold); r.line(8, 18, 7 + f * 2, 22, red);
    r.set(6, 10, 0xffe5a3); r.set(10, 10, 0xffe5a3); add(`n_lantern_${f}`, r);
    r = new Raster(23, 23);
    r.disc(11, 13, 9, ink); r.disc(11, 13, 8, 0x398b9e); r.disc(11, 13, 6, 0x92d6d6);
    r.disc(12, 14, 4, 0x477b9b); r.rect(9, 1, 5, 7, gold); r.rect(10, 0, 3, 4, 0x9edfe2);
    r.line(6, 8 + f, 5, 14, 0xf4f8df); r.set(15, 16, 0xd6eff0); add(`n_biidoro_${f}`, r);
    r = new Raster(23, 28);
    for (let y = 1; y < 19; y++) for (let x = 1; x < 22; x++) if (Math.abs(x - 11) / 10 + Math.abs(y - 10) / 9 < 1) r.set(x, y, x < 11 ? 0xd54a49 : 0xe6ded0);
    r.line(11, 1, 11, 20, ink); r.line(2, 10, 20, 10, ink); r.line(11, 20, 9 + f * 4, 24, gold); r.line(9 + f * 4, 24, 12, 27, red); add(`n_hata_${f}`, r);
    r = new Raster(57, 43);
    r.rect(7, 28, 44, 8, ink); r.rect(9, 28, 40, 6, 0x875334);
    r.line(4, 25, 10, 36, gold); r.line(52, 24, 47, 36, gold); r.line(10, 36, 47, 36, gold);
    r.rect(26, 2, 2, 27, 0x8f6449); r.rect(15, 8, 23, 13, 0xe7dfba); r.line(15, 20, 37, 20, gold);
    r.rect(28, 1, 12, 2, 0xc34544); r.rect(28, 3, 12, 2, 0xf4ead5); r.rect(28, 5, 12, 2, 0x4c68a0);
    for (const x of [12, 20, 35, 43]) { r.disc(x, 30, 2, ink); r.set(x, 30, f ? gold : 0x9d8262); }
    r.rect(10, 23, 39, 2, gold); for (const x of [12, 22, 34, 44]) r.disc(x, 40, 2, ink);
    add(`n_oranda_${f}`, r);
    r = new Raster(39, 39);
    r.line(8, 12, 3, 0, gold); r.line(30, 12, 35, 0, gold);
    r.disc(19, 19, 16, ink); r.disc(19, 18, 14, 0x356e55); r.disc(19, 23, 10, red);
    r.rect(8, 12, 8, 5, gold); r.rect(23, 12, 8, 5, gold); r.rect(11, 13, 3, 3, ink); r.rect(25, 13, 3, 3, ink);
    r.rect(11, 25, 17, 6 + f, ink); for (const x of [12, 17, 22, 26]) r.rect(x, 25, 2, 3, 0xf5e4bb);
    r.line(7, 22, 0, 29 + f, gold); r.line(31, 22, 38, 29 - f, gold);
    r.disc(15, 21, 3, gold); r.disc(23, 21, 3, gold); r.line(19, 4, 19, 10, red); add(`n_ja_${f}`, r);
  }
  let r = new Raster(19, 19); r.disc(9, 9, 9, 0x201b2e); r.disc(9, 9, 8, gold); r.disc(9, 9, 6, 0x34755a);
  for (const y of [5, 9, 13]) r.line(5, y, 13, y, 0x80a666); add('n_segment', r);
  r = new Raster(11, 11); r.disc(5, 5, 5, 0x886330); r.disc(5, 5, 4, gold); r.disc(4, 4, 2, 0xfff0c4); add('n_pearl', r);
  for (const [c, tint] of [['red', red], ['blue', 0x4c9bd4], ['green', 0x63b679]]) for (let f = 0; f < 2; f++) {
    r = new Raster(23, 17); r.rect(1, 3, 21, 13, ink); r.rect(2, 4, 19, 11, 0xe6c875); r.rect(2, 4, 19, 3, 0x86513c);
    r.rect(9, 2, 5, 14, tint); r.rect(8, 0, 7, 3, f ? 0xfbe5ad : tint); add(`n_castella_${c}_${f}`, r);
  }
  r = new Raster(19, 19); r.rect(1, 1, 17, 17, ink); r.rect(3, 3, 13, 13, 0x647480); r.rect(5, 5, 9, 9, gold); add('n_winch_base', r);
  for (let i = 0; i < 16; i++) {
    r = new Raster(19, 19); r.disc(9, 9, 4, 0x364b59); const a = -i * Math.PI / 8;
    r.line(9, 9, 9 + Math.sin(a) * 8, 9 + Math.cos(a) * 8, gold); add(`n_winch_${i}`, r);
  }
  r = new Raster(19, 19); r.rect(3, 5, 13, 10, 0x343c4b); r.line(4, 6, 14, 14, 0x161d2b); add('n_winch_wreck', r);
  return out;
}
