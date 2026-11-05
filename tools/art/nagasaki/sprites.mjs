import { Raster } from '../../lib/raster.mjs';

export function nagasakiSprites() {
  const out = [], add = (name, r) => out.push({ name, raster: r });
  const gold = 0xf2c35e, red = 0xb33a48, ink = 0x211c34;
  const traffic = new Raster(1, 1); traffic.set(0, 0, 0xf2d6a1); add('n_traffic', traffic);
  for (let f = 0; f < 2; f++) {
    const ferry = new Raster(14, 7);
    ferry.line(0, 5, 10, 5, 0x91a9b5); ferry.line(10, 5, 13, 3, 0xcddce0);
    ferry.rect(1, 3, 11, 2, 0xd6e2dd); ferry.rect(3, 1, 6, 2, 0x6e8c9e);
    for (const x of [3, 5, 7, 9]) ferry.set(x, 3, f ? 0xffeab4 : 0xd5c18b);
    ferry.set(8, 1, 0xcce7eb); ferry.set(11, 3, f ? 0x92cba1 : 0x578d79);
    add(`n_view_ferry_${f}`, ferry);
  }
  const wake = new Raster(20, 7);
  for (let k = 0; k < 17; k++) { const a = (k / 17) * .28; wake.set(k, 1 + k / 7, 0x9ac5d3, a); wake.set(k, 6 - k / 7, 0x9ac5d3, a); }
  add('n_view_wake', wake);
  for (let f = 0; f < 2; f++) {
    let r = new Raster(17, 23);
    r.rect(7, 0, 3, 3, gold); r.disc(8, 10, 7, ink); r.disc(8, 10, 6, red);
    r.ellipse(7, 9, 4, 5, 0xe15b43); r.ellipse(6, 8, 2, 3, 0xef9b55);
    for (const x of [4, 8, 12]) r.line(x, 6, x, 14, f ? 0xef7751 : 0xe9a45b);
    r.rect(5, 4, 7, 2, gold); r.rect(5, 16, 7, 2, gold); r.line(8, 18, 7 + f * 2, 22, red);
    r.set(6, 10, 0xffe5a3); r.set(10, 10, 0xffe5a3); add(`n_lantern_${f}`, r);
    r = new Raster(23, 23);
    r.disc(11, 13, 9, ink); r.disc(11, 13, 8, 0x398b9e); r.disc(11, 13, 6, 0x92d6d6);
    r.disc(12, 14, 4, 0x477b9b); r.rect(9, 1, 5, 7, gold); r.rect(10, 0, 3, 4, 0x9edfe2);
    r.line(6, 8 + f, 5, 14, 0xf4f8df); r.set(15, 16, 0xd6eff0);
    r.line(5, 15, 7, 18, 0xc6e4d8); r.line(14, 7, 17, 10, 0x6bbccc);
    r.line(9, 19, 13, 20, 0x2a526f); r.set(9 + f, 10, 0xd9f0df); add(`n_biidoro_${f}`, r);
    r = new Raster(23, 28);
    for (let y = 1; y < 19; y++) for (let x = 1; x < 22; x++) if (Math.abs(x - 11) / 10 + Math.abs(y - 10) / 9 < 1) r.set(x, y, x < 11 ? 0xd54a49 : 0xe6ded0);
    r.line(11, 1, 11, 20, ink); r.line(2, 10, 20, 10, ink); r.line(11, 20, 9 + f * 4, 24, gold); r.line(9 + f * 4, 24, 12, 27, red); add(`n_hata_${f}`, r);
    r = new Raster(57, 43);
    r.rect(7, 28, 44, 8, ink); r.rect(9, 28, 40, 6, 0x875334);
    r.line(4, 25, 10, 36, gold); r.line(52, 24, 47, 36, gold); r.line(10, 36, 47, 36, gold);
    r.rect(26, 2, 2, 27, 0x8f6449); r.rect(15, 8, 23, 13, 0xe7dfba); r.line(15, 20, 37, 20, gold);
    // Rigging, curved sail folds, plank strakes and the gilded float's carvings.
    for (let y = 9; y < 20; y++) {
      r.set(16 + f, y, 0xc6b386); r.set(36 - f, y, 0xb4a27d);
      r.set(27 + Math.round(Math.sin(y * .3 + f)), y, 0xf7efd0);
    }
    r.line(26, 3, 8, 24, 0xa59d7b); r.line(27, 3, 48, 24, 0xa59d7b);
    r.line(14, 7, 39, 7, 0xc0a26a); r.line(14, 21, 39, 21, 0x866444);
    for (const y of [29, 32, 34]) r.line(10, y, 47, y, y === 32 ? 0xb27a46 : 0x5a3d32);
    for (const x of [15, 27, 39]) r.line(x, 29, x + 2, 34, 0x654535);
    r.rect(28, 1, 12, 2, 0xc34544); r.rect(28, 3, 12, 2, 0xf4ead5); r.rect(28, 5, 12, 2, 0x4c68a0);
    for (const x of [12, 20, 35, 43]) { r.disc(x, 30, 2, ink); r.set(x, 30, f ? gold : 0x9d8262); }
    r.rect(10, 23, 39, 2, gold); for (const x of [12, 22, 34, 44]) r.disc(x, 40, 2, ink);
    for (const x of [10, 16, 22, 34, 40, 46]) { r.rect(x, 21, 1, 5, 0xf0d28b); r.set(x + 1, 26, 0xc8944b); }
    r.line(8, 37, 48, 37, 0x8e5b3c); r.line(8, 38, 48, 38, 0xd6a153);
    r.disc(50, 24, 3, 0xd5a44e); r.set(51, 23, 0xffe9a5); r.set(50, 25, ink);
    add(`n_oranda_${f}`, r);
    r = new Raster(39, 39);
    r.line(8, 12, 3, 0, gold); r.line(30, 12, 35, 0, gold);
    r.disc(19, 19, 16, ink); r.disc(19, 18, 14, 0x356e55); r.disc(19, 23, 10, red);
    r.ellipse(14, 10, 6, 5, 0x579d68); r.ellipse(26, 18, 5, 8, 0x214b46);
    for (const [x, y] of [[9, 8], [15, 6], [23, 7], [29, 10], [6, 17], [31, 20]]) {
      r.line(x, y, x + 2, y - 1, gold); r.line(x + 2, y - 1, x + 4, y, 0xa3864f);
    }
    r.rect(8, 12, 8, 5, gold); r.rect(23, 12, 8, 5, gold); r.rect(11, 13, 3, 3, ink); r.rect(25, 13, 3, 3, ink);
    r.rect(11, 25, 17, 6 + f, ink); for (const x of [12, 17, 22, 26]) r.rect(x, 25, 2, 3, 0xf5e4bb);
    r.line(7, 22, 0, 29 + f, gold); r.line(31, 22, 38, 29 - f, gold);
    r.disc(15, 21, 3, gold); r.disc(23, 21, 3, gold); r.line(19, 4, 19, 10, red);
    r.set(13, 13, 0xf7f2c6); r.set(26, 13, 0xf7f2c6);
    r.line(12, 31 + f, 26, 31 + f, 0xe3694a); r.line(15, 34, 23, 34, gold);
    r.line(4, 2, 8, 11, 0xffe1a0); r.line(34, 2, 30, 11, 0xb88d46); add(`n_ja_${f}`, r);
  }
  let r = new Raster(19, 19); r.disc(9, 9, 9, 0x201b2e); r.disc(9, 9, 8, gold); r.disc(9, 9, 6, 0x34755a);
  for (const y of [5, 9, 13]) for (let x = 4; x < 13; x += 4) { r.line(x, y, x + 2, y + 1, 0x9db568); r.line(x + 2, y + 1, x + 4, y, 0x285349); }
  r.line(5, 3, 11, 2, 0xffe399); add('n_segment', r);
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
