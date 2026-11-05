import { Raster, fbm } from '../../lib/raster.mjs';
import { polygon } from './paint.mjs';

const OX = 31; // the ship's centre line in its 62 x 106 frame

/**
 * Oranda-bune, the Dutch-ship float of Nagasaki Kunchi, seen from above with its bow to the bottom (it comes at
 * the player): lacquered hull with a gilt wale and a vermilion band, planked deck, three masts with their yards
 * and bellying sails, shrouds, the stern castle with lit windows and lanterns, the Dutch flag, the bowsprit and
 * its spritsail, the red lion figurehead, gun ports along both sides, child drummers in festival colours.
 */
function orandaBune(f) {
  const r = new Raster(62, 106);
  const ink = 0x1a1216;
  const half = (y) => {
    // the hull's half-width down its length: a rounded stern, full in the waist, fining to the bow
    if (y < 10) return 15 + y * 0.4;
    if (y < 46) return 19 + Math.sin(((y - 10) / 36) * Math.PI * 0.5) * 3.5;
    return Math.max(0, 22.5 * Math.cos(((y - 46) / 46) * Math.PI * 0.5));
  };
  for (let y = 4; y < 92; y++) {
    const h = half(y);
    for (let x = Math.floor(OX - h); x <= Math.ceil(OX + h); x++) {
      const d = h - Math.abs(x + 0.5 - OX);
      if (d < 0) continue;
      let c;
      if (d < 1) c = ink;
      else if (d < 2) c = x < OX ? 0x7a3a26 : 0x5a2a1e; // lacquered planking
      else if (d < 3) c = 0xe8b830; // the gilt wale
      else if (d < 4.5) c = x < OX ? 0xd8402e : 0xa82c22; // the vermilion band
      else if (d < 5.2) c = 0x3a2418;
      else {
        // the deck: planks along the length, their seams and butts
        const plank = Math.floor((x - OX + 40) / 3);
        c = (plank + Math.floor(y / 14)) % 2 ? 0xc0965e : 0xb08a54;
        if ((x - OX + 40) % 3 === 0) c = 0x8a6a40;
        if ((y + plank * 5) % 17 === 0) c = 0x7a5a36;
      }
      r.set(x, y, c);
    }
  }
  // the darker shade on the right of the deck (light from the upper left)
  for (let y = 10; y < 86; y++) for (let x = OX + 8; x < OX + 18; x++) if (r.alpha(x, y) && r.get(x, y) !== 0xe8b830) r.tint(x, y, 0.9);
  // gun ports with brass muzzles out of both sides
  for (const gy of [30, 40, 50, 60, 70]) {
    for (const side of [-1, 1]) {
      const h = half(gy);
      const x = Math.round(OX + side * (h - 3));
      r.rect(x - 1, gy, 3, 2, 0x140c0c);
      r.set(Math.round(OX + side * (h + 0.5)), gy, 0xd8a840);
      r.set(Math.round(OX + side * (h + 1.5)), gy, f ? 0xb88a30 : 0xe8c060);
    }
  }
  // hatches and gratings down the middle, a capstan
  for (const [y, h] of [[44, 5], [56, 4]]) {
    r.rect(OX - 4, y, 8, h, 0x5a3c22);
    for (let x = OX - 3; x < OX + 4; x += 2) for (let yy = y + 1; yy < y + h - 1; yy += 2) r.set(x, yy, 0x2a1a10);
  }
  r.disc(OX, 64, 2, 0x6a4a2a);
  r.set(OX - 1, 63, 0x9a7a4a);
  // the stern castle: a raised deck with a gilt rail, lit cabin windows, lanterns at the corners
  polygon(r, [[OX - 15, 6], [OX + 15, 6], [OX + 17, 22], [OX - 17, 22]], 0x8a5a36);
  polygon(r, [[OX - 13, 8], [OX + 13, 8], [OX + 15, 20], [OX - 15, 20]], 0xa87448);
  for (let x = OX - 15; x <= OX + 15; x += 2) r.set(x, 22, 0xe8b830);
  r.rect(OX - 16, 23, 33, 2, 0x5a3420);
  for (let x = OX - 14; x <= OX + 13; x += 3) r.rect(x, 23, 2, 2, f ? 0xffd890 : 0xffe8b0);
  for (const [x, y] of [[OX - 15, 7], [OX + 15, 7], [OX - 17, 21], [OX + 17, 21]]) {
    r.disc(x, y, 1.6, 0xe83a2a);
    r.set(x, y - 1, 0xffb070);
  }
  // the captain's cabin on the castle: a red-tiled roof with a gilt ridge, a skylight, the ship's bell
  for (let y = 9; y < 18; y++)
    for (let x = OX - 9; x <= OX + 9; x++) {
      const edge = x === OX - 9 || x === OX + 9 || y === 17;
      r.set(x, y, edge ? 0x5a1a14 : (y - 9) % 2 ? (x < OX ? 0xc8402e : 0x9a2c22) : x < OX ? 0xe05a3e : 0xb03a2a);
    }
  r.rect(OX - 9, 9, 19, 1, 0xe8b830);
  r.rect(OX - 2, 11, 5, 3, 0x2a3a4a);
  r.rect(OX - 1, 11, 1, 3, f ? 0xffe0a0 : 0xffd080);
  r.set(OX + 5, 19, 0xe8b830);
  r.set(OX + 5, 20, 0x8a6a20);
  // the Dutch flag on its staff over the stern, streaming to the side
  r.rect(OX, 0, 1, 8, 0xd8c8a0);
  for (let x = 1; x < 13; x++) {
    const dy = Math.round(Math.sin(x * 0.7 + f * 2.2) * (x / 12) * 1.5);
    r.set(OX + x, 0 + dy, 0xc8302a);
    r.set(OX + x, 1 + dy, 0xc8302a);
    r.set(OX + x, 2 + dy, 0xf4f0e8);
    r.set(OX + x, 3 + dy, 0x2a4a9a);
    r.set(OX + x, 4 + dy, 0x2a4a9a);
  }
  // shrouds from the masts down to the rails
  for (const my of [28, 48, 70]) {
    const h = half(my + 4);
    for (const side of [-1, 1]) for (const dy of [-3, 1, 5]) r.line(OX, my, OX + side * (h - 2), my + dy, 0x3a2418, 0.55);
  }
  // masts, yards and the sails: each sail a cream band bellying towards the bow, shaded on its lower edge
  const sail = (my, w, h, ph) => {
    const yard = my - 3;
    r.rect(OX - w - 2, yard, w * 2 + 5, 1, 0x4a2e1c);
    r.set(OX - w - 2, yard, 0x2a1a10);
    r.set(OX + w + 2, yard, 0x2a1a10);
    for (let x = -w; x <= w; x++) {
      const t = x / w;
      const belly = Math.round((1 - t * t) * (2 + ((f + ph) % 2)));
      for (let j = 0; j < h + belly; j++) {
        const lit = 0.5 - t * 0.35 - (j / (h + belly)) * 0.25 + (fbm(x * 2, j * 2, { seed: 9 + ph, scale: 3 }) - 0.5) * 0.15;
        const c = j >= h + belly - 1 ? 0x9a8c74 : lit > 0.55 ? 0xfaf4e4 : lit > 0.35 ? 0xece2c8 : lit > 0.15 ? 0xd8ccae : 0xbcae92;
        r.set(OX + x, yard + 1 + j, c);
      }
      if (Math.abs(x) % 6 === 3) r.line(OX + x, yard + 1, OX + x, yard + h, 0xc8bca0, 0.5); // seams
    }
    r.disc(OX, my, 2.4, 0x101010);
    r.disc(OX, my, 1.6, 0x6a4628);
  };
  // each sail throws a shadow on the deck below it (light from the upper left)
  for (const [my, w, h] of [[32, 17, 7], [52, 21, 9], [73, 16, 7]])
    for (let y = my + h - 1; y < my + h + 4; y++) for (let x = OX - w + 3; x <= OX + w + 3; x++) if (r.alpha(x, y)) r.tint(x, y, 0.72);
  sail(32, 17, 7, 1);
  sail(52, 21, 9, 0);
  sail(73, 16, 7, 2);
  // the main course carries a red disc in a gold ring
  r.disc(OX, 57, 3, 0xe8b830);
  r.disc(OX, 57, 2, 0xc8302a);
  // the pennant from the main masthead
  for (let x = 1; x < 16; x++) r.set(OX - x, 48 + Math.round(Math.sin(x * 0.6 + f * 2) * 1), x % 6 < 2 ? 0xc8302a : x % 6 < 4 ? 0xf4f0e8 : 0x2a4a9a);
  // the forecastle and the bowsprit with its spritsail, the red lion figurehead with a gilded mane
  polygon(r, [[OX - 9, 84], [OX + 9, 84], [OX + 4, 92], [OX - 4, 92]], 0x9a6a40);
  r.rect(OX - 8, 84, 17, 1, 0xe8b830);
  r.rect(OX, 92, 1, 12, 0x5a3820);
  r.rect(OX - 7, 97, 15, 1, 0x4a2e1c);
  for (let x = -6; x <= 6; x++) for (let j = 0; j < 4; j++) r.set(OX + x, 98 + j + (Math.abs(x) < 3 ? 1 : 0), j === 3 ? 0xbcae92 : 0xece2c8);
  r.disc(OX, 92, 2.6, 0xe8b830);
  r.disc(OX, 93, 1.8, 0xc8302a);
  r.set(OX - 1, 93, 0xffd070);
  r.set(OX + 1, 93, 0xffd070);
  r.set(OX, 95, 0x7a1a14);
  // child drummers and flute players in festival colours on the waist and the castle
  for (const [x, y, c] of [[OX - 8, 38, 0xe85a8a], [OX + 7, 40, 0x3a8ae8], [OX - 6, 62, 0xf0c040], [OX + 8, 64, 0xe85a8a], [OX - 3, 14, 0x3ae890], [OX + 4, 15, 0xf0c040]]) {
    r.set(x, y, c);
    r.set(x, y - 1, 0x2a1a14);
    r.set(x + (f ? 1 : -1), y, 0xf0e0c0);
  }
  return r;
}

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
    add(`n_oranda_${f}`, orandaBune(f));
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
  // the float's two broadside batteries (separate targets riding on its sides), their burnt-out remains, a powder keg
  for (let f = 0; f < 2; f++) {
    r = new Raster(9, 26);
    r.rect(1, 0, 7, 26, ink);
    r.rect(2, 1, 5, 24, 0x6a3a24);
    for (let y = 2; y < 24; y += 5) {
      r.rect(2, y, 5, 3, 0x2a1a14);
      r.rect(0, y + 1, 4, 1, f ? 0xffe090 : 0xd8a840);
      r.set(0, y + 1, f ? 0xfff0c0 : 0xb88a30);
    }
    r.rect(7, 0, 1, 26, gold);
    add(`n_oranda_gun_${f}`, r);
  }
  r = new Raster(9, 26);
  for (let y = 0; y < 26; y++) for (let x = 1; x < 8; x++) r.set(x, y, (x + y) % 3 ? 0x2a1e1a : 0x4a3428);
  for (const [x, y] of [[3, 4], [5, 11], [2, 17], [6, 21]]) { r.set(x, y, 0xe86a2a); r.set(x, y - 1, 0xffb050); }
  add('n_oranda_burnt', r);
  for (let f = 0; f < 2; f++) {
    r = new Raster(9, 11);
    r.ellipse(4, 6, 3.5, 4, ink);
    r.ellipse(4, 6, 2.8, 3.3, 0x8a5a32);
    for (const y of [4, 8]) r.rect(1, y, 7, 1, 0x3a3a40);
    r.set(3, 4, 0xb88a5a);
    r.line(4, 2, 5 + f, 0, 0xffd060);
    r.set(5 + f, 0, f ? 0xffffff : 0xffa040);
    add(`n_keg_${f}`, r);
  }
  r = new Raster(19, 19); r.rect(1, 1, 17, 17, ink); r.rect(3, 3, 13, 13, 0x647480); r.rect(5, 5, 9, 9, gold); add('n_winch_base', r);
  for (let i = 0; i < 16; i++) {
    r = new Raster(19, 19); r.disc(9, 9, 4, 0x364b59); const a = -i * Math.PI / 8;
    r.line(9, 9, 9 + Math.sin(a) * 8, 9 + Math.cos(a) * 8, gold); add(`n_winch_${i}`, r);
  }
  r = new Raster(19, 19); r.rect(3, 5, 13, 10, 0x343c4b); r.line(4, 6, 14, 14, 0x161d2b); add('n_winch_wreck', r);
  return out;
}
