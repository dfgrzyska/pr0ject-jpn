// The stamp book: one ekiben-style station stamp (eki sutanpu) per city, in the manner of the rubber stamps
// at Japanese stations and sights: a frame, the city's landmark and its name knocked out of a band, inked
// unevenly. Drawn white (ink = alpha) so the game tints each in its own ink colour; also the little stamp
// in the HUD and the stamp book button.
import { Raster, fbm } from '../lib/raster.mjs';

const S = 56;
const MID = 27.5;

// a 3x5 alphabet for the names in the bands
const MINI = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'],
  B: ['##.', '#.#', '##.', '#.#', '##.'],
  E: ['###', '#..', '##.', '#..', '###'],
  G: ['.##', '#..', '#.#', '#.#', '.##'],
  H: ['#.#', '#.#', '###', '#.#', '#.#'],
  I: ['###', '.#.', '.#.', '.#.', '###'],
  K: ['#.#', '#.#', '##.', '#.#', '#.#'],
  M: ['#.#', '###', '###', '#.#', '#.#'],
  N: ['#.#', '###', '###', '###', '#.#'],
  O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
  P: ['##.', '#.#', '##.', '#..', '#..'],
  R: ['##.', '#.#', '##.', '#.#', '#.#'],
  S: ['.##', '#..', '.#.', '..#', '##.'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'],
  U: ['#.#', '#.#', '#.#', '#.#', '.#.'],
  W: ['#.#', '#.#', '###', '###', '#.#'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'],
  Z: ['###', '..#', '.#.', '#..', '###'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'],
};

const on = (r, x, y) => r.set(Math.round(x), Math.round(y), 0xffffff);
const off = (r, x, y) => r.clear(Math.round(x), Math.round(y));

function ring(r, cx, cy, rad, th = 1) {
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d <= rad && d > rad - th) on(r, x, y);
    }
}

/** A band of ink from y0 to y1 inside the frame, the name knocked out of it in the small letters. */
function nameBand(r, name, y0, y1, inside) {
  r.band = (y) => y >= y0 && y <= y1;
  for (let y = y0; y <= y1; y++) for (let x = 0; x < S; x++) if (inside(x, y)) on(r, x, y);
  const w = name.length * 4 - 1;
  let x0 = Math.round(MID - w / 2 + 0.5);
  const ty = Math.round((y0 + y1) / 2 - 2);
  for (const ch of name) {
    MINI[ch].forEach((row, j) => [...row].forEach((c, i) => c === '#' && off(r, x0 + i, ty + j)));
    x0 += 4;
  }
}

/** An eave with upturned tips, half-width hw at height y. */
function eave(r, cx, y, hw, th = 2) {
  for (let x = Math.round(cx - hw); x <= cx + hw; x++) for (let k = 0; k < th; k++) on(r, x, y + k);
  for (const s of [-1, 1]) {
    on(r, cx + s * (hw + 1), y - 1);
    on(r, cx + s * (hw + 1), y);
  }
}

/** Uneven ink: some pixels pale, a few missing, like a rubber stamp pressed by hand. */
function inkUp(r, seed) {
  r.map((R, G, B, A, x, y) => {
    if (!A) return null;
    if (!r.band?.(y) && fbm(x, y, { seed: seed + 1, scale: 2 }) > 0.8) return [255, 255, 255, 0]; // (never in the name)
    const a = Math.max(0.55, Math.min(1, 0.7 + (fbm(x, y, { seed, scale: 6, octaves: 2 }) - 0.5) * 0.9));
    return [255, 255, 255, Math.round(a * 255)];
  });
  return r;
}

const insideCircle = (rad) => (x, y) => Math.hypot(x + 0.5 - MID, y + 0.5 - MID) < rad;

/** Kyoto: the five-storey Yasaka pagoda under the moon, sakura petals (KIOTO, or KYOTO in English). */
function kyoto(name = 'KIOTO') {
  const r = new Raster(S, S);
  ring(r, MID, MID, 27.5, 2);
  ring(r, MID, MID, 24.5, 1);
  nameBand(r, name, 40, 46, insideCircle(23.5));
  // the platform and the five tiers, each roof wider than the body below it
  for (let x = 18; x <= 37; x++) on(r, x, 38);
  for (let x = 20; x <= 35; x++) on(r, x, 37);
  for (let i = 0; i < 5; i++) {
    const y = 33 - i * 5;
    const hw = 10 - i * 1.3;
    eave(r, MID, y, hw);
    for (let yy = y + 2; yy < y + 5; yy++) for (let x = Math.round(MID - hw + 3); x <= MID + hw - 3; x++) on(r, x, yy);
    off(r, MID, y + 3); // the doors in each body
  }
  // the spire with its rings
  for (let y = 7; y < 13; y++) on(r, MID, y);
  for (const y of [8, 10]) {
    on(r, MID - 1, y);
    on(r, MID + 1, y);
  }
  ring(r, 42.5, 12.5, 4.5, 1);
  for (const [px, py] of [[10, 18], [13, 26], [43, 28]]) {
    on(r, px, py);
    on(r, px + 1, py);
    on(r, px, py + 1);
  }
  return inkUp(r, 11);
}

/** Okinawa: the Shureimon gate over waves, the sun. */
function okinawa() {
  const r = new Raster(S, S);
  const inside = (x, y) => {
    const dx = Math.max(0, Math.abs(x + 0.5 - MID) - 20);
    const dy = Math.max(0, Math.abs(y + 0.5 - MID) - 20);
    return Math.hypot(dx, dy) < 6.5;
  };
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const dx = Math.max(0, Math.abs(x + 0.5 - MID) - 20);
      const dy = Math.max(0, Math.abs(y + 0.5 - MID) - 20);
      const d = Math.hypot(dx, dy);
      if ((d < 7.5 && d >= 5.6) || (d < 4.2 && d >= 3.2)) on(r, x, y);
    }
  nameBand(r, 'OKINAWA', 42, 48, (x, y) => inside(x, y) && Math.hypot(Math.max(0, Math.abs(x + 0.5 - MID) - 20), Math.max(0, Math.abs(y + 0.5 - MID) - 20)) < 3.2);
  // the gate: two tiers of roof on four pillars, the plaque under the upper roof
  eave(r, MID, 19, 9);
  for (let y = 21; y < 24; y++) for (let x = 21; x <= 34; x++) on(r, x, y);
  for (let x = 25; x <= 30; x++) off(r, x, 22);
  eave(r, MID, 24, 14);
  for (const px of [15, 22, 33, 40]) for (let y = 26; y < 33; y++) on(r, px, y);
  for (let x = 14; x <= 41; x++) on(r, x, 33);
  // waves
  for (let x = 6; x < 50; x++) {
    on(r, x, 37 + Math.round(Math.sin(x / 2.2) * 1.2));
    if (x % 2) on(r, x, 40 + Math.round(Math.sin(x / 2.2 + 1.6) * 1));
  }
  // the sun and its rays
  ring(r, 44.5, 11.5, 3.5, 3.5);
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) on(r, 44.5 + Math.cos(a) * 6, 11.5 + Math.sin(a) * 6);
  return inkUp(r, 23);
}

/** Sapporo: the TV Tower and its clock, snowflakes falling. */
function sapporo() {
  const r = new Raster(S, S);
  const oct = (x, y, k) => {
    const dx = Math.abs(x + 0.5 - MID);
    const dy = Math.abs(y + 0.5 - MID);
    return Math.max(dx, dy, (dx + dy) * 0.72) < k;
  };
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) if ((oct(x, y, 27.6) && !oct(x, y, 25.6)) || (oct(x, y, 24.4) && !oct(x, y, 23.6))) on(r, x, y);
  nameBand(r, 'SAPPORO', 41, 47, (x, y) => oct(x, y, 23.5));
  // the antenna, the observation deck with the big digital clock, the lattice legs spreading down
  for (let y = 5; y < 13; y++) on(r, MID, y);
  for (let y = 13; y < 18; y++) for (let x = 21; x <= 34; x++) on(r, x, y);
  for (let x = 23; x <= 32; x++) off(r, x, 15);
  for (let y = 18; y < 39; y++) {
    const hw = 3 + (y - 18) * 0.42;
    on(r, MID - hw, y);
    on(r, MID + hw, y);
    const k = (y - 18) % 6;
    on(r, MID - hw + (k / 6) * hw * 2, y); // the cross bracing
    on(r, MID + hw - (k / 6) * hw * 2, y);
  }
  const flake = (x, y) => {
    for (let k = -2; k <= 2; k++) {
      on(r, x + k, y);
      on(r, x, y + k);
    }
    on(r, x - 1, y - 1);
    on(r, x + 1, y + 1);
    on(r, x - 1, y + 1);
    on(r, x + 1, y - 1);
  };
  for (const [x, y] of [[12, 17], [44, 22], [13, 32], [42, 35]]) flake(x, y);
  return inkUp(r, 37);
}

/** Kagoshima: Sakurajima erupting over the bay. */
function kagoshima() {
  const r = new Raster(S, S);
  ring(r, MID, MID, 27.5, 3);
  for (let a = 0; a < Math.PI * 2; a += 0.09) on(r, MID + Math.cos(a) * 23.5, MID + Math.sin(a) * 23.5);
  nameBand(r, 'KAGOSHIMA', 37, 43, insideCircle(24.6));
  // the volcano: a broad cone with a notched crater, its ridges left pale
  for (let y = 18; y <= 32; y++) {
    const t = (y - 18) / 14;
    const hw = 5 + t * 17;
    for (let x = Math.round(MID - hw); x <= MID + hw; x++) {
      if (y < 20 && Math.abs(x + 0.5 - MID) < 2.5) continue; // the crater
      const ridge = (Math.round(x - MID + y * 0.6) % 6 === 0 && y > 22) || (Math.round(x - MID - y * 0.6) % 7 === 0 && y > 24);
      if (!ridge) on(r, x, y);
    }
  }
  // the ash cloud billowing up and away: solid puffs, lit edges left pale
  for (const [cx, cy, cr] of [[27, 15, 2.6], [23.5, 11.5, 3.2], [19, 8.5, 3.6], [13.5, 8, 2.8]])
    for (let y = Math.floor(cy - cr); y <= cy + cr; y++)
      for (let x = Math.floor(cx - cr); x <= cx + cr; x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        if (d < cr && !(d > cr - 1.2 && x < cx && y < cy)) on(r, x, y);
      }
  // the bay
  for (let x = 7; x < 49; x++) if ((x + 1) % 4) on(r, x, 34 + (x % 8 < 4 ? 0 : 1));
  return inkUp(r, 41);
}

/** Osaka: the castle keep on its stone walls. */
function osaka() {
  const r = new Raster(S, S);
  const inside = (x, y, k) => {
    const dx = Math.abs(x + 0.5 - MID);
    const dy = y + 0.5 - MID;
    return dx < k - 2 && Math.abs(dy) < k && dx + Math.abs(dy) * 0.35 < k + 4;
  };
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if ((inside(x, y, 27.5) && !inside(x, y, 25.5)) || (inside(x, y, 24) && !inside(x, y, 23))) on(r, x, y);
  nameBand(r, 'OSAKA', 42, 48, (x, y) => inside(x, y, 22.5));
  // the stone base, its blocks
  for (let y = 33; y <= 39; y++) {
    const hw = 13 + (y - 33) * 0.8;
    for (let x = Math.round(MID - hw); x <= MID + hw; x++) if ((y - 33) % 3 !== 2 && (x + (y > 35 ? 2 : 0)) % 5) on(r, x, y);
  }
  // the keep: tiers with gables and upturned eaves, windows left pale, the golden fish on the ridge
  for (const [y, hw] of [[29, 12], [24, 10], [19, 8], [14, 6]]) {
    eave(r, MID, y, hw);
    for (let yy = y + 2; yy < y + 5; yy++) for (let x = Math.round(MID - hw + 2); x <= MID + hw - 2; x++) on(r, x, yy);
    for (let x = Math.round(MID - hw + 3); x <= MID + hw - 3; x += 2) off(r, x, y + 3);
    on(r, MID, y - 1); // the gable's peak
  }
  for (let y = 9; y < 14; y++) for (let x = 24; x <= 31; x++) if (y > 10 || Math.abs(x + 0.5 - MID) < 2.5) on(r, x, y);
  for (const s of [-1, 1]) {
    on(r, MID + s * 3.5, 8);
    on(r, MID + s * 4.5, 7);
  }
  return inkUp(r, 53);
}

/** Beppu: the hot-spring sign ♨, the town's own — three plumes rising out of a bowl. */
function beppu() {
  const r = new Raster(S, S);
  ring(r, MID, MID, 27.5, 2);
  ring(r, MID, MID, 25, 1);
  nameBand(r, 'BEPPU', 40, 46, insideCircle(23.8));
  // the bowl
  for (let y = 28; y <= 36; y++)
    for (let x = 12; x <= 43; x++) {
      const e = ((x + 0.5 - MID) / 16) ** 2 + ((y + 0.5 - 28) / 8.5) ** 2;
      if (e < 1 && (e > 0.55 || y > 33)) on(r, x, y);
    }
  for (let x = 12; x <= 43; x++) on(r, x, 28);
  // three wavy plumes of steam
  for (const [x0, top] of [[20, 10], [MID, 7], [35, 10]])
    for (let y = top; y < 26; y++) {
      const x = x0 + Math.sin((y - top) / 2.6) * 2;
      on(r, x, y);
      on(r, x + 1, y);
    }
  return inkUp(r, 61);
}

/** Hiroshima & Miyajima: the Great Floating Torii (Ō-Torii) standing in Seto waves before Mount Misen. */
function hiroshima(name = 'HIROSZIMA') {
  const r = new Raster(S, S);
  const inside = (x, y, k) => {
    const dx = Math.abs(x + 0.5 - MID);
    const dy = Math.abs(y + 0.5 - MID);
    return dx < k && dy < k && dx + dy < k * 1.68;
  };
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++)
      if ((inside(x, y, 27) && !inside(x, y, 25)) || (inside(x, y, 23.5) && !inside(x, y, 22.5))) on(r, x, y);
  nameBand(r, name, 40, 46, (x, y) => inside(x, y, 21.8));
  // Mount Misen ridge silhouette in the distance
  for (let x = 9; x <= 46; x++) {
    const h1 = Math.round(25 - 6 * Math.exp(-(((x - 18) / 8) ** 2)) - 4 * Math.exp(-(((x - 38) / 7) ** 2)));
    on(r, x, h1);
  }
  // Great Floating Torii: kasagi, shimaki, nuki crossbar, central tablet, main & sleeve pillars
  eave(r, MID, 12, 15, 2);
  eave(r, MID, 14, 13, 1);
  for (let x = 15; x <= 40; x++) {
    on(r, x, 18);
    on(r, x, 19);
  }
  for (let y = 14; y <= 19; y++) for (let x = 26; x <= 29; x++) on(r, x, y);
  off(r, 27, 16);
  off(r, 28, 16);
  for (const s of [-1, 1]) {
    const px = Math.round(MID + s * 8.5);
    for (let y = 14; y <= 34; y++) {
      on(r, px, y);
      on(r, px + (s < 0 ? 1 : -1), y);
    }
    const ox = Math.round(MID + s * 12.5);
    for (let y = 25; y <= 34; y++) on(r, ox, y);
    on(r, Math.round((px + ox) / 2), 27);
    on(r, Math.round((px + ox) / 2), 31);
  }
  for (let x = 9; x <= 46; x++) if ((x + 1) % 4) on(r, x, 35 + (x % 6 < 3 ? 0 : 1));
  for (let x = 13; x <= 42; x++) if ((x + 2) % 5) on(r, x, 38);
  for (const [lx, ly] of [[11, 10], [43, 10]]) {
    on(r, lx, ly);
    on(r, lx - 1, ly + 1);
    on(r, lx + 1, ly + 1);
    on(r, lx, ly + 1);
    on(r, lx, ly + 2);
  }
  return inkUp(r, 71);
}

export function stampSprites() {
  const nagasaki = new Raster(S, S);
  ring(nagasaki, MID, MID, 26, 2);
  for (const [x, h] of [[11, 9], [19, 15], [28, 11], [37, 8]]) {
    nagasaki.rect(x, 32 - h, 7, h, 0xffffff);
    for (let y = 33 - h; y < 30; y += 3) for (let xx = x + 1; xx < x + 6; xx += 3) off(nagasaki, xx, y);
  }
  nagasaki.line(9, 33, 45, 33, 0xffffff);
  nagasaki.line(12, 35, 42, 35, 0xffffff);
  nagasaki.line(29, 9, 29, 16, 0xffffff);
  nagasaki.line(29, 9, 40, 16, 0xffffff);
  nagasaki.line(29, 9, 19, 16, 0xffffff);
  nameBand(nagasaki, 'NAGASAKI', 38, 47, (x, y) => Math.hypot(x - MID, y - MID) < 24);
  const out = [
    { name: 'stamp_stage8', raster: nagasaki },
    { name: 'stamp_stage1', raster: kyoto() },
    { name: 'stamp_stage1_en', raster: kyoto('KYOTO') },
    { name: 'stamp_stage2', raster: okinawa() },
    { name: 'stamp_stage3', raster: sapporo() },
    { name: 'stamp_stage4', raster: kagoshima() },
    { name: 'stamp_stage5', raster: osaka() },
    { name: 'stamp_stage6', raster: beppu() },
    { name: 'stamp_stage7', raster: hiroshima() },
    { name: 'stamp_stage7_en', raster: hiroshima('HIROSHIMA') },
  ];
  // the HUD's little stamp: a round seal (tinted with the city's ink)
  const icon = new Raster(9, 9);
  for (let y = 0; y < 9; y++)
    for (let x = 0; x < 9; x++) {
      const d = Math.hypot(x - 4, y - 4);
      if (d <= 4.3 && (d > 3 || (d < 1.6 && d > 0.4) || (Math.abs(x - 4) < 1 && y > 2 && y < 7))) icon.set(x, y, 0xffffff);
    }
  out.push({ name: 'stamp_icon', raster: icon });
  // the stamp book button: a little booklet with a red seal on its cover
  const book = new Raster(14, 14);
  book.rect(2, 1, 10, 12, 0x120e1a);
  book.rect(3, 2, 8, 10, 0xe8dcc0);
  book.rect(3, 2, 1, 10, 0xb8a888);
  for (let y = 4; y < 9; y++) for (let x = 5; x < 10; x++) if (Math.hypot(x - 7, y - 6) < 2.6 && Math.hypot(x - 7, y - 6) > 1) book.set(x, y, 0xd8402a);
  book.set(7, 6, 0xd8402a);
  out.push({ name: 'btn_book', raster: book });
  return out;
}
