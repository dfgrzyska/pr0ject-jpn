// Tokyo's looks for the three shared behaviours (src/game/enemies/chainSplitCart.js, docs/plan-silniejsze-fale.md),
// drawn at 540 px with HiSprite:
//   chain  - washing on a line strung between the balconies across a lane of Nakano, pegged out in turn: a T-shirt,
//            a pair of socks, a towel; the one that wakes a long strip of white cotton, ittan-momen, its eyes opening
//            and a mouth (these shoot); one catching fire; the pegs left on the line with a scorched scrap. The post
//            a balcony's corner with its rail and the bracket the line is tied to.
//   split  - nigiri from Tsukiji, a slice of tuna over its rice, glaring; shot, the fish slides off and each half
//            dives on its own: the slice flapping, the rice with its dab of wasabi.
//   cart   - an old three-wheeled truck (ōto-sanrin) of the Shōwa years, loaded with the wares of Kappabashi's
//            kitchen shops (pots stacked, steel bowls, a giant plastic bowl of ramen with its chopsticks lifted),
//            driving itself, its one round headlight glaring like the eye of a hitotsume; it breaks up in three stages
//            (the pots tumbling off: its eye goes red; a back wheel gone, it lurches; its canvas hood on fire), its
//            wreck on its side with the pots strewn. (In place of the daihachi-guruma: Beppu's mud barrel already
//            rides on one.)
import { HiSprite, tones, speckle, mottle, fur, mix2 } from '../../lib/hisprite.mjs';

const INK = 0x14101c;
const TAU = Math.PI * 2;
const RAMPS = {
  ts: tones([0x3a6a9a, 0x7ab0e0, 0xd0ecff]), // a T-shirt, sky blue
  so: tones([0x2a2a34, 0x4a4a58, 0x8a8a9a]), // socks, dark grey
  sr: tones([0x8a1a1a, 0xd04040, 0xff9a8a]), // their red heels
  tw: tones([0xa8a49a, 0xeeeae0, 0xffffff]), // white cotton
  tb: tones([0x1e3a6a, 0x3a5aa8, 0x8aa8e0]), // a towel's blue stripes
  pg: tones([0x8a7a10, 0xf0d040, 0xfff8a0]), // pegs, yellow plastic
  fl: tones([0xb82a08, 0xff8a1a, 0xfff2a0]), // flame
  ch: tones([0x0e0a08, 0x2a201a, 0x4a3a30]), // charred
  cn: tones([0x5a5a5e, 0xa8a8ac, 0xe0e0e4]), // concrete, a balcony's rail
  st: tones([0x4a4e56, 0x9aa0a8, 0xf0f4f8]), // steel
  tu: tones([0x5a0a14, 0xb02030, 0xff7080]), // tuna, akami
  ri: tones([0xa8a090, 0xf0ece0, 0xffffff]), // rice
  wa: tones([0x3a5a1a, 0x7aa83a, 0xc8e888]), // wasabi
  tr: tones([0x1a3a5a, 0x3a6a8a, 0x7aa8c8]), // the truck's paint, Shōwa blue
  cv: tones([0x4a4a2a, 0x8a8a5a, 0xc8c89a]), // its canvas hood
  ti: tones([0x101014, 0x24242a, 0x48484e]), // tyres
  al: tones([0x6a6a70, 0xc0c0c8, 0xffffff]), // aluminium pots
  cu: tones([0x6a2a10, 0xc8602a, 0xffa870]), // copper pots
  rm: tones([0x6a1a10, 0xd84a2a, 0xffb080]), // the plastic ramen bowl's red
  nd: tones([0xa88a40, 0xf0d890, 0xfff8d0]), // noodles
  hl: tones([0xa88a20, 0xfff0a0, 0xffffff]), // the headlight lit
  sm: tones([0x6a6a70, 0xb0b0b4, 0xe8e8ea]), // smoke
};

// ---------------------------------------------------------------- chain: washing on the line (30 x 46)
/** A clothes peg on the line at x. */
const peg = (s, x, y = 4) => {
  s.paint([x - 2, y - 2, x + 2, y + 4], (px, py) => Math.abs(px - x) < 1.1 && py > y - 1.6 && py < y + 3.6, 'pg', () => 0.6);
  s.px(x, y + 1, 0x6a5a10);
};
/** The cloth waving a little in the wind: its edge rippling by frame. */
const wave = (x, y, f) => Math.sin(y * 0.6 + f * 2 + x * 0.2) * 0.8;

function tshirt(s, c, f) {
  // its shoulders pegged to the line, the sleeves out, hanging down, a print on its chest
  s.paint([0, 4, 30, 40], (x, y) => {
    const w = wave(x, y, f);
    const body = Math.abs(x - c + w) < 8 && y > 5 && y < 36 - Math.abs(x - c) * 0.05;
    const sleeve = y > 5 && y < 14 - (Math.abs(x - c) - 8) * 0.2 && Math.abs(x - c + w) < 13;
    const neck = ((x - c) / 3.6) ** 2 + ((y - 5) / 2.4) ** 2 < 1;
    return (body || sleeve) && !neck;
  }, 'ts', (x, y) => 0.55 - (x - c) * 0.02 + Math.sin(x * 0.8 + y * 0.3 + f) * 0.08 - (y > 33 ? 0.12 : 0));
  s.ellipse(c, 20, 3.6, 3, 'tw', { flat: 0.6 }); // the print: a white disc
  s.ellipse(c, 20, 2, 1.6, 'tu', { flat: 0.5 }); // (a red sun on it)
  for (const x of [c - 7, c + 7]) peg(s, x);
}
function socks(s, c, f) {
  for (const [x, dx] of [[c - 5, -1], [c + 5, 1]]) {
    s.paint([x - 4, 4, x + 8, 34], (px, py) => {
      const w = wave(px, py, f + dx);
      const leg = Math.abs(px - x + w) < 2.6 && py > 5 && py < 26;
      const foot = py >= 24 && py < 31 && px - x + w > -2.6 && px - x + w < 2.6 + (py - 24) * 0.7 * dx * dx && (dx > 0 ? px > x - 2.6 : true);
      return leg || foot;
    }, 'so', (px) => 0.5 - (px - x) * 0.05);
    s.ellipse(x + dx * 1.5, 29, 2.4, 1.8, 'sr', { flat: 0.6 }); // (their red heels and toes)
    s.line(x - 2.4, 8, x + 2.4, 8, 0x6a6a7a, 1); // (the rib at the top)
    peg(s, x);
  }
}
function towel(s, c, f) {
  s.paint([c - 10, 4, c + 10, 40], (x, y) => Math.abs(x - c + wave(x, y, f)) < 8.6 && y > 5 && y < 38, 'tw', (x, y) => 0.6 - (x - c) * 0.02 + Math.sin(y * 1.1 + f) * 0.05);
  for (const y of [12, 15, 30, 33]) s.line(c - 8 + wave(c, y, f), y, c + 8 + wave(c, y, f), y, 0x3a5aa8, 1);
  for (let x = c - 8; x <= c + 8; x += 2) s.px(x + wave(x, 38, f), 38.5, 0xc8c4ba); // (its fringe)
  for (const x of [c - 6, c + 6]) peg(s, x);
}
/** Ittan-momen: a long strip of white cotton, eyes opening in it, a mouth; its tail flicking. */
function momen(s, c, f) {
  s.paint([0, 4, 30, 46], (x, y) => {
    const w = Math.sin(y * 0.28 + f * 1.6) * 3 * (y / 40);
    return Math.abs(x - c - w) < 5 && y > 5 && y < 45;
  }, 'tw', (x, y) => 0.62 - (x - c - Math.sin(y * 0.28 + f * 1.6) * 3 * (y / 40)) * 0.05);
  for (const sx of [-1, 1]) {
    const [ex, ey] = [c + sx * 2.2 + Math.sin(14 * 0.28 + f * 1.6) * 3 * 0.35, 14];
    s.ellipse(ex, ey, 1.5, f ? 1.3 : 0.6, 'tw', { flat: 0.95 });
    s.dot(ex, ey, f ? 0.8 : 0.5, INK);
  }
  s.line(c - 1.6 + Math.sin(18 * 0.28 + f * 1.6) * 1, 18.5, c + 1.6 + Math.sin(18 * 0.28 + f * 1.6) * 1, 18.5 + f * 0.6, 0x8a1a1a, 1); // its mouth
  peg(s, c);
}

function laundry(kind, f = 0) {
  const s = new HiSprite(30, 46, RAMPS);
  const c = 15;
  if (kind === 'burnt') {
    // the pegs left on the line, a scorched scrap in one, a curl of smoke
    for (const x of [c - 6, c + 6]) peg(s, x);
    s.poly([[c - 7, 7], [c - 3, 7], [c - 4, 13], [c - 6.5, 11]], 'ch', { flat: 0.4 });
    s.dot(c - 5, 12.4, 0.7, 0xff7020, 0.9);
    return s.render({ outline: 2 });
  }
  if (kind === 1) socks(s, c, f);
  else if (kind === 2) towel(s, c, f);
  else if (kind === 'eye') momen(s, c, f);
  else tshirt(s, c, f);
  if (kind === 'lit') {
    // fire catching its hem and climbing it, the cloth blackening under it
    s.paint([0, 22, 30, 40], (x, y) => y > 28 + Math.sin(x * 1.1 + f) * 2 && s.mat[Math.floor(y) * 30 + Math.floor(x)] != null, 'ch', () => 0.4);
    for (let k = -2; k <= 2; k++) s.ellipse(c + k * 3, 30 - ((f + k + 4) % 3) * 2.2, 1.4, 3.6 + ((k + f) % 2), 'fl', { bias: 0.25, glow: true });
    for (let i = 0; i < 3; i++) s.dot(c - 4 + i * 4, 18 - ((i + f) % 3) * 2, 0.7, 0xfff2a0);
  }
  return s.render({ outline: 2 });
}

/** The post (22 x 22, from above): a balcony's corner, its rail, the steel bracket the line is tied to, a pot plant. */
function balcony() {
  const s = new HiSprite(22, 22, RAMPS);
  s.paint([2, 2, 20, 20], (x, y) => x > 3 && x < 19 && y > 3 && y < 19, 'cn', (x, y) => 0.4 + ((x + y) % 4 < 1 ? 0.06 : 0), { pat: speckle({ amt: 0.08, seed: 3 }) });
  for (let k = 3; k < 19; k++) {
    s.px(k, 3, 0xd8d8dc);
    s.px(3, k, 0xd8d8dc);
    s.px(k, 4, 0x6a6a70);
  }
  s.tube(11, 11, 19, 6, 1, 'st', { flat: 0.6 }); // the bracket out over the rail
  s.ellipse(19, 6, 1.4, 1.4, 'st', { flat: 0.3 });
  s.ellipse(7, 15, 2.6, 2.6, 'wa', { flat: 0.4, pat: mottle({ amt: 0.3, scale: 1.5, seed: 5 }) }); // a pot plant
  s.ellipse(15, 15, 2.4, 1.8, 'ts', { flat: 0.5 }); // (a bucket)
  return s.render({ outline: 2 });
}

// ---------------------------------------------------------------- split: nigiri (40 x 40), its slice, its rice
/** The rice: a pressed oval of grains, a dab of wasabi on top. */
function shari(s, x, y, a = 0, sc = 1) {
  s.paint([x - 14, y - 14, x + 14, y + 14], (px, py) => {
    const u = (px - x) * Math.cos(a) + (py - y) * Math.sin(a), v = -(px - x) * Math.sin(a) + (py - y) * Math.cos(a);
    return (u / (11 * sc)) ** 2 + (v / (6.4 * sc)) ** 2 < 1 + Math.sin(Math.atan2(v, u) * 11) * 0.05;
  }, 'ri', (px, py) => 0.55 - (px - x) * 0.02 - (py - y) * 0.03 + ((Math.floor(px * 1.3) + Math.floor(py * 2.1)) % 3 === 0 ? -0.12 : 0.04));
  s.ellipse(x - Math.sin(a) * 0.8, y - 1, 2 * sc, 1.3 * sc, 'wa', { flat: 0.6 });
}
/** The slice of tuna, its sheen and its lines of fat, its eyes glaring. */
function neta(s, x, y, a, f, loose = false, sc = 1) {
  s.paint([x - 15, y - 15, x + 15, y + 15], (px, py) => {
    const u = (px - x) * Math.cos(a) + (py - y) * Math.sin(a), v = -(px - x) * Math.sin(a) + (py - y) * Math.cos(a);
    return (u / (12.6 * sc)) ** 2 + (v / (5.6 * sc)) ** 2 < 1 && v > -5.6 * sc + Math.abs(u) * 0.08;
  }, 'tu', (px, py) => {
    const u = (px - x) * Math.cos(a) + (py - y) * Math.sin(a);
    return 0.52 + Math.sin(u * 0.9) * 0.1 + (Math.abs(Math.sin(u * 0.55 + 0.6)) < 0.08 ? 0.25 : 0) - (py - y) * 0.02;
  });
  for (const sx of [-1, 1]) {
    const [ex, ey] = [x + Math.cos(a) * sx * 4 * sc, y + Math.sin(a) * sx * 4 * sc - 1];
    s.ellipse(ex, ey, 1.6 * sc, 1.3 * sc, 'tw', { flat: 0.85 });
    s.dot(ex + (f ? 0.3 : -0.3), ey + 0.2, 0.7 * sc, loose ? 0xffd040 : INK);
    s.line(ex - sx * 1.8 * sc, ey - 2 * sc, ex + sx * 1.2 * sc, ey - 1.2 * sc, 0x3a0a10, 1); // (scowling)
  }
}
function nigiri(f) {
  const s = new HiSprite(40, 40, RAMPS);
  const bob = [0, 0.5, 1, 0.5][f];
  shari(s, 20, 21 + bob);
  neta(s, 20 + (f % 2 ? 0.6 : -0.6), 18 + bob, 0.04 * (f - 1.5), f % 2);
  return s.render({ outline: 2 });
}
function netaOne(f) {
  const s = new HiSprite(28, 28, RAMPS);
  neta(s, 14, 14, (f / 2) * Math.PI * 0.5 - 0.4, f, true, 0.95); // (flapping as it goes)
  return s.render({ outline: 2 });
}
function shariOne(f) {
  const s = new HiSprite(28, 28, RAMPS);
  shari(s, 14, 14, (f / 2) * Math.PI, 0.95);
  for (const sx of [-1, 1]) s.dot(14 + sx * 3, 13 + (f ? 0.5 : 0), 0.7, 0x2a2a2a); // (two dark grains like eyes)
  return s.render({ outline: 2 });
}

// ---------------------------------------------------------------- cart: the three-wheeler (48 x 84), nose down
function sanrin(stage, f) {
  const s = new HiSprite(48, 84, RAMPS);
  const c = 24;
  const spilt = stage >= 1;
  const lame = stage >= 2;
  const fire = stage >= 3;
  // its wheels: two at the back under the bed, one at the front under the cab
  const tyre = (x, y, h = 6) => {
    s.paint([x - 4, y - h - 1, x + 4, y + h + 1], (px, py) => Math.abs(px - x) < 3 && Math.abs(py - y) < h, 'ti', (px) => 0.55 - (px - x) * 0.08);
    s.ellipse(x + Math.sign(x - c) * 1.6, y, 1.3, 2.2, 'st', { flat: 0.5 }); // (its hub, out at the side)
    s.line(x - 2, y - h + ((f * 3) % (h * 2)), x + 2, y - h + ((f * 3) % (h * 2)), 0x3a3a40, 1); // (its tread going round)
  };
  tyre(c - 17, 20, 7);
  if (!lame) tyre(c + 17, 20, 7);
  else for (let k = 0; k < 3; k++) s.dot(c + 16 + k, 24 + k * 4 + f, 0.8, k % 2 ? 0xffd080 : 0x8a8682, 0.8); // (the hub dragging, sparks)
  tyre(c, 79, 4); // (the front wheel peeping out under its nose, in its fender)
  // the bed: steel sides, its tailgate at the back with the plate
  s.paint([c - 15, 4, c + 15, 50], (x, y) => Math.abs(x - c) < 14 && y > 5 && y < 49, 'tr', (x, y) => (Math.abs(x - c) > 12 || y < 7.5 ? 0.62 : 0.28) - (x - c) * 0.01, { pat: speckle({ amt: 0.08, seed: 4 }) });
  s.paint([c - 5, 4, c + 5, 8], (x, y) => Math.abs(x - c) < 3.4 && y > 4.6 && y < 7.2, 'tw', () => 0.6); // the plate
  s.line(c - 2.4, 5.8, c + 2.4, 5.8, 0x2a6a3a, 1);
  // the load: pots stacked, steel bowls, a giant plastic bowl of ramen with its chopsticks up (fewer once spilt)
  const pots = [[c - 8, 13, 5, 'al'], [c + 7, 12, 4.4, 'cu'], [c - 8, 26, 4.4, 'cu'], [c + 8, 25, 4.6, 'al'], [c - 7, 39, 4, 'al'], [c + 8, 39, 4.2, 'al']];
  pots.forEach(([x, y, r, m], k) => {
    if (spilt && k % 2 === 1) return;
    s.ellipse(x, y, r, r, m, { bias: 0.1 });
    s.ellipse(x, y, r - 1.4, r - 1.4, m, { flat: 0.2 }); // (its inside)
    s.ellipse(x + 0.6, y + 0.6, r - 2.6, r - 2.6, m, { flat: 0.5 }); // (another nested in it)
    s.line(x + r - 0.5, y, x + r + 2.4, y, 0x2a2a2a, 1.2); // its handle
  });
  if (!spilt) {
    s.ellipse(c, 26, 6.4, 6.4, 'rm', { bias: 0.1 });
    s.ellipse(c, 26, 5, 5, 'nd', { flat: 0.55, pat: fur((x, y) => Math.atan2(y - 26, x - c) + 1.4, { amt: 0.25, len: 4, w: 1, gap: 0.2 }) });
    s.ellipse(c + 1.6, 24.6, 1.6, 1.4, 'tu', { flat: 0.55 }); // (chāshū)
    s.ellipse(c - 2, 27.6, 1.2, 1.2, 'tw', { flat: 0.6 }); // (naruto)
    s.tube(c - 1, 26, c + 7, 18, 0.7, 'nd', { flat: 0.7 });
    s.tube(c + 0.6, 26.6, c + 8.6, 19, 0.7, 'nd', { flat: 0.7 }); // the chopsticks lifted, noodles hanging from them
  } else s.ellipse(c, 27, 4, 3, 'ti', { flat: 0.2 }); // (a dent where it stood)
  // the cab: rounded steel, its windscreen, the canvas hood over it, the single round headlight on its nose
  s.paint([c - 13, 50, c + 13, 74], (x, y) => Math.abs(x - c) < 12 - Math.max(0, y - 66) * 1.1 && y > 51 && y < 73, 'tr', (x, y) => 0.55 - (x - c) * 0.025 - (y > 68 ? 0.1 : 0));
  if (!fire) s.paint([c - 12, 50, c + 12, 64], (x, y) => Math.abs(x - c) < 11.4 && y > 51 && y < 63, 'cv', (x, y) => 0.55 - (x - c) * 0.02 + ((x | 0) % 3 === 0 ? -0.06 : 0)); // the hood
  else {
    for (let k = 0; k < 4; k++) {
      const x = c - 7 + k * 4.6;
      const h = 7 + ((k * 3 + f * 2) % 4);
      s.paint([x - 3, 58 - h, x + 3, 63], (px, py) => {
        const t = (62 - py) / (h + 4);
        return t > 0 && t < 1 && Math.abs(px - x) < 2.6 * (1 - t) + 0.5;
      }, 'fl', (px, py) => 0.5 + ((62 - py) / (h + 4)) * 0.45, { glow: true });
    }
    for (let k = 0; k < 3; k++) s.ellipse(c - 5 + k * 5, 46 - k, 2.6, 1.8, 'sm', { flat: 0.6, glow: true });
  }
  s.paint([c - 10, 62, c + 10, 68], (x, y) => Math.abs(x - c) < 9 - (y - 63) * 0.4 && y > 63 && y < 67, 'st', (x) => 0.75 - (x - c) * 0.03); // the windscreen
  for (let k = -2; k <= 2; k++) s.line(c + k * 2, 69.4, c + k * 2, 72, 0x2a3a4a, 1); // (its grille)
  s.ellipse(c, 75.2, 4.4, 3.8, 'st', { flat: 0.4 }); // the lamp's chrome rim
  s.ellipse(c, 75.4, 3.4, 2.9, spilt ? 'tu' : 'hl', { flat: 0.75, glow: true }); // the eye
  s.dot(c + (f ? 0.6 : -0.6), 75.6, 1.2, INK);
  s.line(c - 4.6, 71.6, c + 4.6, 72.8, INK, 1.2); // (its brow, scowling)
  for (const sx of [-1, 1]) s.line(c + sx * 5, 72, c + sx * 9, 70, 0x9aa0a8, 1); // its mirrors
  if (spilt) {
    // pots tumbling off the back, bouncing
    for (const [x, y] of [[c - 13, 2 - f], [c + 11, 0 + f]]) s.ellipse(x, y, 3, 2.6, 'al', { flat: 0.3 });
  }
  return s.render({ outline: 2 });
}

/** Its wreck: on its side across the street, the pots strewn, the plastic bowl rolled away. */
function sanrinWreck() {
  const s = new HiSprite(48, 84, RAMPS);
  const c = 24;
  s.paint([c - 18, 18, c + 18, 68], (x, y) => Math.abs(x - c) < 9 && y > 20 && y < 66, 'tr', (x) => 0.35 - (x - c) * 0.02, { pat: speckle({ amt: 0.12, seed: 9 }) });
  s.paint([c - 9, 20, c + 9, 66], (x, y) => x > c + 6 && x < c + 9 && y > 21 && y < 65, 'ch', () => 0.4); // (its underside, scorched)
  for (const y of [28, 58]) s.ellipse(c - 9, y, 2, 5, 'ti', { flat: 0.3 }); // the wheels in the air
  for (const [x, y, m] of [[c + 14, 18, 'al'], [c - 15, 30, 'cu'], [c + 16, 52, 'al'], [c - 13, 72, 'al'], [c + 8, 76, 'cu']]) s.ellipse(x, y, 3.6, 3.6, m, { flat: 0.3 });
  s.ellipse(c + 13, 34, 5, 5, 'rm', { bias: 0.1 });
  s.ellipse(c + 13, 34, 3.6, 3.6, 'nd', { flat: 0.4 });
  for (let k = 0; k < 3; k++) s.ellipse(c - 2 + k * 3, 14 - k * 2, 2.4, 1.6, 'sm', { flat: 0.6 });
  return s.render({ outline: 2 });
}

export function tokyoNewFoes(add) {
  for (let i = 0; i < 3; i++) add(`tk_sentaku_${i}`, laundry(i));
  for (let f = 0; f < 2; f++) add(`tk_sentaku_eye_${f}`, laundry('eye', f));
  for (let f = 0; f < 2; f++) add(`tk_sentaku_lit_${f}`, laundry('lit', f));
  add('tk_sentaku_burnt', laundry('burnt'));
  add('tk_balcony', balcony());
  for (let f = 0; f < 4; f++) add(`tk_nigiri_${f}`, nigiri(f));
  for (let f = 0; f < 2; f++) add(`tk_neta_${f}`, netaOne(f));
  for (let f = 0; f < 2; f++) add(`tk_shari_${f}`, shariOne(f));
  for (let st = 0; st < 4; st++) for (let f = 0; f < 2; f++) add(`tk_sanrin_${st}_${f}`, sanrin(st, f));
  add('tk_sanrin_wreck', sanrinWreck());
}
