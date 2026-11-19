// Okinawa's looks for the three shared behaviours (src/game/enemies/chainSplitCart.js, docs/plan-silniejsze-fale.md),
// drawn at 540 px with HiSprite:
//   chain  - surume, squid split and dried in the sun, hung by the tips of their mantles on a blue fishing rope
//            between two weathered posts over the paths down to the beach: amber and translucent, the fins spread,
//            the arms hanging; woken ones open their eyes and glare (these shoot), one toasting (curling up, its
//            edges browning, flames licking), the curled black scrap left of it
//   split  - a coconut, husked, its three pores the two eyes and the mouth of a face, glaring as it falls; then each
//            half, the white flesh round a pool of its water, a pair of eyes in the flesh, on its own
//   cart   - the water-buffalo cart of Bise driving itself out of the fukugi: a grey buffalo in its yoke, a brass
//            bell at its neck, the flat cart behind under its reed awning, two eyes peering from the shade under the
//            awning's fringe; it breaks up in three stages (the awning torn off, showing the benches with their
//            bingata cushions, a sanshin left on one and a basket of cane: the cart sees and fires sooner; a wheel
//            gone and the cart limping; the basket on fire), its wreck on its side. The buffalo is no yokai and is
//            not hurt: when the cart goes down it breaks free of the yoke and runs off down the lane (its own frames)
import { HiSprite, tones, speckle, mottle, fur } from '../../lib/hisprite.mjs';

const INK = 0x141018;
const TAU = Math.PI * 2;
const RAMPS = {
  sq: tones([0x8a4a2a, 0xd8a070, 0xfff0d0]), // a dried squid, amber
  sp: tones([0x6a2a1a, 0xa8502a, 0xd8804a]), // its spots (the dried chromatophores)
  bl: tones([0x0e3a6a, 0x2a70b0, 0x6ab0e8]), // the blue fishing rope
  pl: tones([0x4a3e30, 0x7a6e5a, 0xaaa08a]), // a weathered post
  fl: tones([0xb82a08, 0xff8a1a, 0xfff2a0]), // flame
  ch: tones([0x0e0a08, 0x2a201a, 0x4a3a30]), // charred
  cn: tones([0x2a180c, 0x5a3a20, 0x8a6038]), // a coconut's shell and fibres
  cf: tones([0x5a3a1e, 0x9a7048, 0xc8a070]), // its fibres catching the light
  mt: tones([0xb8b2a4, 0xeeeae0, 0xffffff]), // the flesh
  cw: tones([0x8aa8b8, 0xd0e4ec, 0xf4fcff]), // the water
  bf: tones([0x22242a, 0x44464e, 0x707480]), // the water buffalo's hide
  hn: tones([0x4a4234, 0x8a7e66, 0xd0c4a8]), // its horns
  rd: tones([0x7a5e2a, 0xc0a05a, 0xecd89a]), // the reed awning
  wd: tones([0x3a2414, 0x6a4a30, 0x9a7a54]), // wood
  br: tones([0x7a5a10, 0xd0a030, 0xfff0a0]), // brass
  bg: tones([0x8a1a2a, 0xd83a4a, 0xff8a8a]), // bingata red
  by: tones([0x8a6a08, 0xe8c030, 0xfff090]), // bingata yellow
  bb: tones([0x0e2a6a, 0x2a5ab8, 0x7aa8f0]), // bingata blue
  cg: tones([0x3a5a1a, 0x6a9a3a, 0xb0d870]), // sugar cane
  bk: tones([0x5a4020, 0x9a7a40, 0xd0b070]), // a woven basket
};

// ---------------------------------------------------------------- chain: a dried squid (27 x 40), hung at y 3
function ika(kind, f = 0) {
  const s = new HiSprite(27, 40, RAMPS);
  const c = 13.5;
  if (kind === 'burnt') {
    // the scrap left on the peg: curled up tight and black, a glowing edge, a thread of smoke
    s.line(c, 1, c, 5, 0x6ab0e8, 1);
    s.ellipse(c, 9, 4.4, 4, 'ch', { flat: 0.5, pat: speckle({ amt: 0.3, seed: 4 }) });
    s.poly([[c - 3, 11], [c + 3, 11], [c + 2, 18], [c - 1, 17]], 'ch', { flat: 0.45 });
    for (const [x, y] of [[c - 3, 8], [c + 3.4, 10], [c + 1, 17]]) s.dot(x, y, 0.8, 0xff7020, 0.9);
    return s.render({ outline: 2 });
  }
  const lit = kind === 'lit';
  const curl = lit ? 2 + f : 0; // (toasting, it curls up)
  // the peg on the rope, pinching the mantle's tip
  s.poly([[c - 1.4, 0], [c + 1.4, 0], [c + 1.2, 5], [c - 1.2, 5]], 'pl', { flat: 0.6 });
  // the fins: a broad arrowhead at the top, thin and see-through, ribbed
  const finW = 11.5 - curl * 1.4;
  s.poly([[c, 2.6], [c + finW, 9 + curl * 0.6], [c + 4, 13], [c - 4, 13], [c - finW, 9 + curl * 0.6]], 'sq', { flat: 0.75, pat: mottle({ amt: 0.08, scale: 2, seed: 2 }) });
  for (let k = 1; k < 5; k++) for (const sx of [-1, 1]) s.line(c + sx * 1.4, 4 + k * 1.6, c + sx * (finW - 2.6 * (k - 1) - 1), 8.6 + k * 0.6, 0xc08858, 1, 0.45);
  s.line(c - 4.4, 12.6, c + 4.4, 12.6, 0x8a4a2a, 1, 0.8); // (where the fins meet the mantle)
  // the mantle: split and pressed flat, a long shield narrowing to the head, the darker spots of its skin,
  // the pale line down its middle where the pen was
  const mw = (y) => (5.4 - curl * 0.5) - Math.max(0, y - 20) * 0.12 - Math.max(0, 9 - y) * 0.3;
  s.paint([c - 7, 5, c + 7, 27], (x, y) => y > 6 && y < 26 && Math.abs(x - c) < mw(y), 'sq', (x, y) => 0.6 - Math.abs(x - c) * 0.04 + (y < 12 ? 0.06 : 0), { pat: mottle({ amt: 0.1, scale: 2.4, seed: 5 }) });
  for (let k = 0; k < 14; k++) {
    const y = 8 + ((k * 7.3) % 17);
    const x = c + ((k * 3.7) % 7) - 3.5;
    if (Math.abs(x - c) < mw(y) - 1) s.dot(x, y, 0.7, 0xa8502a, 0.7);
  }
  s.line(c, 7, c, 25, 0xfff0d0, 1, 0.55);
  if (lit) {
    // the edges browning
    s.paint([c - 7, 5, c + 7, 27], (x, y) => y > 6 && y < 26 && Math.abs(x - c) < mw(y) && Math.abs(x - c) > mw(y) - 1.4, 'ch', () => 0.6);
  }
  // the head: the two eyes on its sides, dull and dried - or woken, wide and glaring
  s.ellipse(c, 27.4, 5.4, 2.8, 'sq', { bias: 0.05 });
  const woke = kind === 'eye';
  for (const sx of [-1, 1]) {
    if (woke) {
      s.ellipse(c + sx * 3.6, 27.2, 2.6, f === 1 ? 0.8 : 2.4, 'W', { flat: 0.95 });
      if (f !== 1) { s.dot(c + sx * 3.4, 27.5, 1.4, 0x1a1a24); s.dot(c + sx * 3.9, 26.6, 0.5, 0xffffff); }
      s.line(c + sx * 0.8, 24.2, c + sx * 6.4, 25.6, INK, 1.3); // (a scowl)
    } else {
      s.ellipse(c + sx * 3.4, 27.2, 1.6, 1.3, 'sp', { flat: 0.6 });
      s.line(c + sx * 2, 27.4, c + sx * 4.8, 27.2, 0x6a2a1a, 1, 0.8); // (shut, shrivelled)
    }
  }
  // the arms: hanging and splayed apart, tapering, rows of dark suckers down them, the two long tentacles in the
  // middle with their clubs; curling up as it toasts
  for (let k = 0; k < 8; k++) {
    const t = (k / 7 - 0.5) * 2;
    const long = k === 3 || k === 4;
    const len = (long ? 10.4 : 7 - Math.abs(t) * 1.2) - curl * (long ? 1.8 : 1.4);
    const sw = Math.sin(f * 1.6 + k) * 0.5;
    const x0 = c + t * 2.8, y0 = 29.4;
    const x1 = c + t * (5.4 + len * 0.36) + sw, y1 = y0 + len;
    s.tube(x0, y0, x1, y1, long ? 0.6 : 0.75, 'sq');
    for (let q = 0.3; q < 0.95; q += 0.22) s.px(x0 + (x1 - x0) * q, y0 + (y1 - y0) * q, 0x8a4a2a, 0.8);
    if (curl) s.line(x1, y1, x1 + (t < 0 ? 1.4 : -1.4), y1 - 1.6, 0x6a3a20, 1);
    else if (long) s.ellipse(x1, y1 + 0.4, 0.9, 1.5, 'sq', { flat: 0.6 }); // (the club at the end)
  }
  if (lit) {
    // the flames licking up round it
    for (let k = -1; k <= 1; k++) s.ellipse(c + k * 4.4, 30 - ((f + k + 2) % 3) * 2, 2.4, 5.4, 'fl', { flat: 0.8, glow: true });
    s.ellipse(c, 36, 4.6, 3, 'fl', { flat: 0.7, glow: true });
    for (let i = 0; i < 4; i++) s.dot(c - 6 + i * 4, 18 + ((i + f) % 3) * 3, 0.7, 0xfff2a0);
  }
  return s.render({ outline: 2 });
}

/** A weathered post the rope hangs from (21 x 21, seen from above): its grain, the blue rope's knot. */
function post() {
  const s = new HiSprite(21, 21, RAMPS);
  s.ellipse(10.5, 10.5, 5, 5, 'pl', { bias: 0.1, pat: mottle({ amt: 0.12, scale: 2, seed: 8 }) });
  for (const r of [1.6, 3.2]) s.paint([5, 5, 16, 16], (x, y) => Math.abs(Math.hypot(x - 10.5, y - 10.5) - r) < 0.35, 'pl', () => 0.3); // (its rings)
  s.tube(1, 11, 20, 10, 1.3, 'bl');
  s.ellipse(13, 10.4, 1.8, 1.6, 'bl', { bias: 0.1 }); // (the knot)
  return s.render({ outline: 2 });
}

// ---------------------------------------------------------------- split: a coconut (44 x 44, a half 32 x 30)
function coconut(f) {
  const s = new HiSprite(44, 44, RAMPS);
  const c = 22;
  // the husked nut: brown, hairy with the fibres left on it, the three ridges running down from its pores
  s.ellipse(c, 23, 17, 18, 'cn', { bias: 0.15, pat: fur((x, y) => Math.atan2(y - 23, x - c) + 1.4, { amt: 0.25, len: 4, seed: 3 }) });
  for (let k = 0; k < 70; k++) {
    const a = (k / 70) * TAU + (k % 3) * 0.2;
    const r = 8 + ((k * 5.3) % 9);
    const x = c + Math.cos(a) * r, y = 23 + Math.sin(a) * r * 1.05;
    s.line(x, y, x + Math.cos(a + 1.3) * 3, y + Math.sin(a + 1.3) * 3, k % 4 ? 0x8a6038 : 0xc8a070, 1, 0.7); // (the fibres)
  }
  for (const a of [-0.6, 0.6, Math.PI]) s.line(c + Math.sin(a) * 4, 15 - Math.cos(a) * 3, c + Math.sin(a) * 15, 23 - Math.cos(a) * 12, 0x2a180c, 1.2, 0.7);
  // its three pores: the two eyes and the mouth of a face, sunk in dark rims - glaring red as it wakes
  const glare = [0, 1, 2, 1][f];
  for (const sx of [-1, 1]) {
    s.ellipse(c + sx * 6, 21, 4.2, 3.6, 'K', { flat: 0.2 });
    s.ellipse(c + sx * 6, 21, 3, 2.6, glare ? 'W' : 'cn', { flat: glare ? 0.95 : 0.3 });
    if (glare) {
      s.dot(c + sx * 5.6, 21.4, 1.2 + glare * 0.3, 0xff3a20);
      s.dot(c + sx * 5.6, 21.4, 0.6, INK);
    }
    s.line(c + sx * 1.6, 16.4, c + sx * 10, 17.4, INK, 1.4); // (the brow, a scowl)
  }
  s.ellipse(c, 31, 3.4, 2 + glare * 0.5, 'K', { flat: 0.2 });
  s.ellipse(c, 31.4, 2, 1 + glare * 0.4, 'sp', { flat: 0.4 });
  return s.render({ outline: 2 });
}

function coconutHalf(f) {
  const s = new HiSprite(32, 30, RAMPS);
  const c = 16;
  // a half seen from its cut side, tipped a little towards us: the hairy shell round it and below, the thin brown
  // skin, the ring of white flesh, the hollow with its pool of water (spilling as it flies) - and two eyes cut in
  // the flesh, glaring
  s.ellipse(c, 15.6, 14, 13, 'cn', { bias: 0.1, pat: fur((x, y) => Math.atan2(y - 15, x - c) + 1.4, { amt: 0.3, len: 3, seed: 5 }) });
  s.ellipse(c, 14, 11.8, 10.2, 'sp', { flat: 0.5 });
  s.ellipse(c, 14, 11, 9.4, 'mt', { bias: 0.25 });
  s.ellipse(c, 14.8, 8, 6.6, 'mt', { bias: -0.3 });
  s.ellipse(c, 15.6, 6.6, 5.2, 'cw', { flat: 0.5, pat: mottle({ amt: 0.06, scale: 2, seed: 6 + f }) });
  s.line(c - 3.4, 13.6 + f, c + 2, 13 + f, 0xffffff, 1, 0.7); // (the light on the water)
  for (const sx of [-1, 1]) {
    s.ellipse(c + sx * 5.4, 7.8, 2.2, 1.6, 'K', { flat: 0.3 });
    s.dot(c + sx * 5, 8.1, 1, 0xff3a20);
    s.line(c + sx * 2.4, 5.6, c + sx * 8, 6.6, INK, 1.2);
  }
  for (let i = 0; i < 3; i++) s.dot(c - 8 + i * 8 + f, 27.6 - (i % 2) * 2, 0.8, 0xd0e4ec, 0.9); // (drops spilling)
  return s.render({ outline: 2 });
}

// ---------------------------------------------------------------- cart: the water-buffalo cart (42 x 90), down the screen
/**
 * The buffalo seen from above, its rump at y0, its head down the screen: the barrel of its body broad at the hip
 * bones and the shoulders, the spine's ridge, mud dried on its flanks and legs, the head lowered and its great horns
 * sweeping out and back in two ridged crescents.
 */
function buffalo(s, c, y0, f, { run = false, yoke = true } = {}) {
  const step = f ? 1 : -1;
  const stride = run ? 3 : 1.4;
  const len = run ? 28 : 27;
  // its legs, the hooves stepping out from under it in turn, muddy to the knee
  for (const [sx, y, ph] of [[-1, y0 + 5, 1], [1, y0 + 5, -1], [-1, y0 + 21, -1], [1, y0 + 21, 1]]) {
    const dy = step * ph * stride;
    s.ellipse(c + sx * 7.8, y + dy, 1.7, 3.2, 'bk', { flat: 0.4 });
    s.dot(c + sx * 8, y + dy + (run ? 3.4 : 2.6), 1, 0x141418);
  }
  // the tail, swishing, its tuft
  const tx = c + (run ? 3 : 1.6) * step;
  s.line(c, y0 + 1, tx, y0 - 4, 0x2a2a30, 1);
  s.ellipse(tx, y0 - 4.6, 0.9, 1.4, 'bf', { flat: 0.3 });
  // the body: its outline from the rump to the neck
  const w = (y) => {
    const t = (y - y0) / len;
    if (t < 0 || t > 1) return 0;
    let r = 6.8 + 1.5 * Math.exp(-(((t - 0.15) / 0.14) ** 2)) + 1.9 * Math.exp(-(((t - 0.76) / 0.17) ** 2));
    if (t < 0.07) r *= Math.sqrt(t / 0.07);
    if (t > 0.9) r *= 1 - ((t - 0.9) / 0.1) * 0.42;
    return r;
  };
  s.paint([c - 10, y0, c + 10, y0 + len], (x, y) => Math.abs(x - c) < w(y), 'bf', (x, y) => 0.58 - (x - c) * 0.035 - Math.abs(x - c) / Math.max(1, w(y)) * 0.22, { pat: mottle({ amt: 0.07, scale: 3, seed: 9 }) });
  // the mud dried on its flanks
  s.paint([c - 10, y0, c + 10, y0 + len], (x, y) => Math.abs(x - c) < w(y) && Math.abs(x - c) > w(y) - 1.2 && (y - y0) / len > 0.08 && (y - y0) / len < 0.9, 'bk', (x, y) => 0.3 + Math.sin(y * 0.5) * 0.06, { pat: speckle({ amt: 0.4, dark: 0.3, seed: 21 }) });
  // the spine's ridge, the hip bones and the shoulder blades catching the light, the folds of the neck
  s.line(c, y0 + 3, c, y0 + len - 3, 0x6a6c76, 1, 0.7);
  for (const sx of [-1, 1]) {
    s.ellipse(c + sx * 5, y0 + 4, 1.6, 1.4, 'bf', { bias: 0.55 });
    s.ellipse(c + sx * 3.8, y0 + len * 0.72, 2.2, 3.4, 'bf', { bias: 0.4 });
  }
  for (let k = 0; k < 3; k++) s.line(c - 4 + k * 0.4, y0 + len - 2.6 + k * 1.1, c + 4 - k * 0.4, y0 + len - 2.6 + k * 1.1, 0x18181e, 1, 0.5);
  // the head, lowered, the muzzle paler and wet, its nostrils; the ears out under the horns
  const hy = y0 + len + 4 + (run ? 1 : 0);
  s.ellipse(c, hy - 0.4, 4.6, 6, 'bf', { bias: 0.1 });
  s.ellipse(c, hy + 4.2, 3.4, 2.1, 'bf', { bias: 0.45 });
  s.line(c, hy - 5, c, hy + 2, 0x5a5c66, 1, 0.5);
  for (const sx of [-1, 1]) {
    s.dot(c + sx * 1.3, hy + 4.4, 0.6, 0x0e0e12);
    s.ellipse(c + sx * 5.4, hy + 1.6, 2, 1.1, 'bf', { flat: 0.4 });
  }
  // the rope collar and its brass bell, under the chin
  s.line(c - 3.6, hy - 3.4, c + 3.6, hy - 3.4, 0xc8b890, 1);
  s.ellipse(c + 2.4, hy - 2.4, 1.4, 1.3, 'br', { bias: 0.2 });
  // the yoke across its neck, pegged - or, broken free, a stub of it and the rope trailing at its side
  if (yoke) {
    s.tube(c - 10.4, y0 + len * 0.66, c + 10.4, y0 + len * 0.66, 1.1, 'wd');
    for (const sx of [-1, 1]) s.line(c + sx * 4.4, y0 + len * 0.66 - 1.6, c + sx * 4.4, y0 + len * 0.66 + 1.6, 0x3a2414, 1);
  } else {
    s.tube(c - 4, y0 + len * 0.66, c + 3, y0 + len * 0.66 - 0.6, 1, 'wd');
    const rope = [[c + 3.4, hy - 3.4], [c + 9.6, y0 + len - 6]];
    for (let y = y0 + len - 8; y > y0 - 10; y -= 2.4) rope.push([c + 10.4 + Math.sin(y * 0.4 + f * 2) * 1.4, y]);
    for (let i = 0; i < rope.length - 1; i++) s.line(rope[i][0], rope[i][1], rope[i + 1][0], rope[i + 1][1], 0xc8b890, 1);
    const [ex, ey] = rope.at(-1);
    for (const d of [-1, 0, 1]) s.line(ex, ey, ex + d, ey - 1.6, 0xa8986a, 1); // (its frayed end)
  }
  for (const sx of [-1, 1]) {
    // the horn: out from the poll, round and back towards the shoulders, thick at the root, ridged, paler at the tip
    const pts = [];
    for (let t = 0; t <= 1.001; t += 0.1) {
      const a = Math.PI * (0.02 + t * 0.78);
      pts.push([c + sx * (3 + Math.sin(a) * 9.6), hy - 3 - (1 - Math.cos(a)) * 7.2]);
    }
    for (let i = 0; i < pts.length - 1; i++) s.tube(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 2.3 - i * 0.2, 'hn');
    for (let i = 1; i < pts.length - 2; i++) {
      const [x, y] = pts[i];
      s.line(x - 0.9, y - 0.6, x + 0.9, y + 0.6, 0x2a2620, 1, 0.7); // (its ridges)
    }
    s.dot(pts.at(-1)[0], pts.at(-1)[1], 0.6, 0xf0e8d0);
  }
}

function gyu(stage, f) {
  const s = new HiSprite(42, 90, RAMPS);
  const c = 21;
  const limp = stage >= 2;
  const tilt = limp ? 2 : 0;
  // the shafts from the cart's front out to the yoke, alongside the buffalo
  for (const sx of [-1, 1]) s.tube(c + sx * 9.4, 44, c + sx * 10.2, 52 + 27 * 0.66, 0.9, 'wd');
  buffalo(s, c, 52, f);
  // the two wheels at the cart's sides: iron tyres, the spokes going round, the hubs
  const wheel = (x, y) => {
    s.poly([[x - 1.8, y - 9], [x + 1.8, y - 9], [x + 1.8, y + 9], [x - 1.8, y + 9]], 'wd', { flat: 0.5 });
    for (let k = 0; k < 4; k++) {
      const yy = y - 8 + ((k * 4.6 + f * 2.3) % 17);
      s.line(x - 1.8, yy, x + 1.8, yy, 0x2a1e14, 1, 0.8);
    }
    for (const sy of [-1, 1]) s.line(x - 1.8, y + sy * 9, x + 1.8, y + sy * 9, 0x4a4a52, 1);
    s.dot(x + (x < c ? -1.8 : 1.8), y, 1.2, 0x4a4a52);
  };
  wheel(c - 13.6, 27);
  if (!limp) wheel(c + 13.6 , 27);
  else for (let k = 0; k < 4; k++) s.line(c + 11, 27 + tilt, c + 13 + k, 24 + tilt + k * 1.6, 0x9a7a54, 1); // (the axle's broken end)
  // the bed: planks, its rails
  s.poly([[c - 11.4, 6], [c + 11.4, 6 + tilt], [c + 11.4, 46 + tilt], [c - 11.4, 46]], 'wd', { flat: 0.5, bias: 0.15 });
  for (let x = c - 8.6; x < c + 11; x += 3.4) s.line(x, 7, x, 45 + (x > c ? tilt : 0), 0x3a2414, 1, 0.45);
  for (const sx of [-1, 1]) s.line(c + sx * 11, 6 + (sx > 0 ? tilt : 0), c + sx * 11, 46 + (sx > 0 ? tilt : 0), 0x2a1a0e, 1);
  if (stage === 0) {
    // the reed awning over it on four posts, gabled: the reed combed down from the ridge to the eaves on either
    // side (the sun on one slope, the other in shade), bound in bands, the ridge capped with a bundle tied at
    // intervals; its fringe at the front, and in the shade under it two eyes peering out
    s.paint([c - 18, 2, c + 18, 46], (x, y) => y > 3 && y < 45 && Math.abs(x - c) < 16.4 + Math.sin(y * 0.7) * 0.4, 'rd', (x, y) => (x < c ? 0.8 : 0.3) - Math.abs(x - c) * 0.008 + Math.sin(y * 2.3 + x * 0.2) * 0.05, { pat: speckle({ amt: 0.12, seed: 11 }) });
    for (let y = 5; y < 44; y += 1.5) for (const sx of [-1, 1]) s.line(c + sx * 1.6, y, c + sx * 16, y + 0.8, sx < 0 ? 0xa0844a : 0x7a6030, 1, 0.32); // (the combed reed)
    for (const y of [12, 24, 36]) s.line(c - 16.2, y, c + 16.2, y, 0x5a4018, 1, 0.6); // (its bands)
    s.tube(c, 3.2, c, 44.8, 1.9, 'bk');
    for (let y = 6; y < 44; y += 4.6) s.line(c - 2, y, c + 2, y, 0x3a2810, 1, 0.9); // (the ridge's ties)
    for (const sx of [-1, 1]) s.line(c + sx * 16.4, 4, c + sx * 16.4, 44, sx < 0 ? 0x7a5e2a : 0x4a3410, 1, 0.8); // (the eaves' edge)
    for (let x = c - 16; x < c + 16.6; x += 1.4) s.line(x, 44, x, 46.6 + ((x * 7) % 3) * 0.5, 0xc0a05a, 1); // (the fringe)
    s.paint([c - 11, 46, c + 11, 51], (x, y) => y < 50 && Math.abs(x - c) < 10.4, 'K', () => 0.15);
    for (const sx of [-1, 1]) {
      s.ellipse(c + sx * 5, 48.2, 3, 1.7, 'W', { flat: 0.95 });
      s.dot(c + sx * 4.6, 48.4, 1.1, 0xe0a830);
      s.dot(c + sx * 4.6, 48.4, 0.5, INK);
      s.line(c + sx * 1.6, 46.6, c + sx * 8.4, 47.2, INK, 1.1);
    }
  } else {
    // the awning torn away (shreds of reed left on the posts): two benches across with their bingata cushions
    // (yellow, flowered red and blue), a sanshin left on the back one, the basket of cane between them; the front
    // board glaring red-eyed
    for (const [x, y] of [[c - 11, 6], [c + 11, 6 + tilt], [c - 11, 45], [c + 11, 45 + tilt]]) {
      s.dot(x, y, 1.4, 0x4a3020);
      for (const d of [-1, 1]) s.line(x, y, x + (x < c ? 2.4 : -2.4), y + d * 2.4, 0xc0a05a, 1);
    }
    for (const by of [12, 38]) {
      s.poly([[c - 10.4, by - 3.2], [c + 10.4, by - 3.2 + tilt * 0.5], [c + 10.4, by + 3.2 + tilt * 0.5], [c - 10.4, by + 3.2]], 'wd', { bias: 0.3 });
      s.poly([[c - 9, by - 2.4], [c + 9, by - 2.4 + tilt * 0.5], [c + 9, by + 2.4 + tilt * 0.5], [c - 9, by + 2.4]], 'by', { flat: 0.6 });
      for (let k = 0; k < 4; k++) {
        const x = c - 6.4 + k * 4.3;
        s.dot(x, by + (k % 2 ? 0.9 : -0.9), 1.1, k % 2 ? 0x2a5ab8 : 0xd83a4a);
        s.dot(x + 1.4, by + (k % 2 ? -1 : 1), 0.6, 0xffffff, 0.9);
      }
    }
    // the sanshin on the back bench: its drum of python skin, the long black-lacquered neck, the pegs
    s.poly([[c - 9, 9.4], [c - 4.4, 9.4], [c - 4.4, 14.4], [c - 9, 14.4]], 'mt', { flat: 0.5, pat: speckle({ amt: 0.5, dark: 0.5, seed: 13 }) });
    s.line(c - 4.4, 11.8, c + 8, 10.2, 0x14101a, 1.3);
    for (const d of [-1, 1]) s.line(c + 7, 10.4, c + 7.4, 10.4 + d * 1.6, 0xe8e0c8, 1);
    // the basket of cane, burning once the cart is far gone
    s.ellipse(c, 25, 6, 5.4, 'bk', { bias: 0.1 });
    for (let a = 0; a < TAU; a += 0.6) s.line(c + Math.cos(a) * 3.6, 25 + Math.sin(a) * 3.2, c + Math.cos(a + 0.3) * 5.6, 25 + Math.sin(a + 0.3) * 5, 0x5a4020, 1, 0.6); // (the weave)
    for (let k = 0; k < 5; k++) {
      const [x0, y0, x1, y1] = [c - 4 + k * 2, 20.4 + (k % 2), c - 2.6 + k * 2, 29.6 - (k % 2)];
      s.tube(x0, y0, x1, y1, 0.8, stage >= 3 ? 'ch' : 'cg');
      if (stage < 3) s.px(x0 + (x1 - x0) * 0.5, y0 + (y1 - y0) * 0.5, 0xd8e8a0); // (a node of the cane)
    }
    const fy = 46 + tilt * 0.5;
    s.poly([[c - 11.4, fy - 1], [c + 11.4, fy - 1 + tilt * 0.4], [c + 11.4, fy + 3 + tilt * 0.4], [c - 11.4, fy + 3]], 'wd', { flat: 0.4 });
    for (const sx of [-1, 1]) {
      s.ellipse(c + sx * 5, fy + 1, 3, 1.8, 'W', { flat: 0.95 });
      s.dot(c + sx * 4.6, fy + 1.2, 1.2, 0xff3a20);
      s.dot(c + sx * 4.6, fy + 1.2, 0.5, INK);
      s.line(c + sx * 1.6, fy - 1, c + sx * 8.6, fy - 0.2, INK, 1.2);
    }
    if (stage >= 3) {
      for (let k = 0; k < 4; k++) {
        const x = c - 5 + k * 3.4;
        const h = 6 + ((k * 3 + f * 2) % 5);
        s.paint([x - 3, 22 - h - 6, x + 3, 28], (px, py) => {
          const t = (27 - py) / (h + 8);
          return t > 0 && t < 1 && Math.abs(px - x) < 2.6 * (1 - t) + 0.5;
        }, 'fl', (px, py) => 0.5 + ((27 - py) / (h + 8)) * 0.45, { glow: true });
      }
    }
  }
  return s.render({ outline: 2 });
}

function gyuWreck() {
  const s = new HiSprite(42, 90, RAMPS);
  const c = 21;
  // the cart fallen in on itself in the lane: the bed broken across, one half tipped up, a wheel lying flat
  // beside it, the awning come down in a charred heap of reed, a bench thrown out, the shafts snapped and the
  // yoke left lying, the cane spilt from the burnt basket
  s.poly([[c - 11, 8], [c + 10, 10], [c + 9, 27], [c - 12, 25]], 'wd', { flat: 0.45, pat: speckle({ amt: 0.2, dark: 0.3, seed: 9 }) });
  s.poly([[c - 11, 29], [c + 9, 31], [c + 11, 50], [c - 9, 48]], 'wd', { flat: 0.6, pat: speckle({ amt: 0.2, dark: 0.3, seed: 10 }) });
  for (let x = c - 8; x < c + 9; x += 3.4) { s.line(x, 9, x - 0.4, 26, 0x2a1a0e, 1, 0.5); s.line(x, 30, x + 0.6, 48, 0x2a1a0e, 1, 0.5); }
  for (let k = 0; k < 6; k++) s.line(c - 11 + k * 4, 26 + (k % 2), c - 10 + k * 4, 29.6 - (k % 2), 0x9a7a54, 1); // (its splintered break)
  // the heap of reed, charred, still smouldering
  s.paint([c - 16, 2, c + 14, 30], (x, y) => Math.hypot((x - c + 1) / 13, (y - 15) / 10) < 1 + Math.sin(x * 1.3 + y) * 0.08, 'rd', (x, y) => 0.4 + Math.sin(x * 2.1 + y * 1.7) * 0.1, { pat: speckle({ amt: 0.3, dark: 0.4, seed: 12 }) });
  s.paint([c - 16, 2, c + 14, 30], (x, y) => Math.hypot((x - c + 2) / 9, (y - 14) / 7) < 1 + Math.sin(x * 1.7) * 0.1, 'ch', () => 0.4, { pat: speckle({ amt: 0.3, seed: 14 }) });
  for (let k = 0; k < 9; k++) s.line(c - 12 + k * 3, 6 + (k % 3) * 2, c - 10 + k * 3, 24 - (k % 2) * 3, 0x5a4018, 1, 0.5);
  for (const [x, y] of [[c - 4, 12], [c + 3, 17], [c - 7, 20], [c + 6, 10]]) s.dot(x, y, 0.9, 0xff7020, 0.9);
  // a wheel lying flat by it: rim, spokes, hub
  s.ellipse(c + 13, 41, 6.6, 6.6, 'wd', { flat: 0.4 });
  s.ellipse(c + 13, 41, 4.8, 4.8, 'ch', { flat: 0.2 });
  for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; s.tube(c + 13, 41, c + 13 + Math.cos(a) * 5.4, 41 + Math.sin(a) * 5.4, 0.5, 'wd'); }
  s.dot(c + 13, 41, 1.4, 0x4a4a52);
  // a bench and its cushion thrown out; the cane spilt
  s.poly([[c - 17, 34], [c - 11, 32], [c - 10, 44], [c - 16, 46]], 'wd', { bias: 0.2 });
  s.poly([[c - 16, 35.6], [c - 12, 34.4], [c - 11.4, 42], [c - 15.4, 43.4]], 'by', { flat: 0.4, pat: speckle({ amt: 0.4, dark: 0.4, seed: 5 }) });
  for (let k = 0; k < 5; k++) s.tube(c - 2 + k * 2, 52 + (k % 2) * 2, c + 2 + k * 3, 58 + (k % 3), 0.7, k % 2 ? 'ch' : 'cg');
  // the shafts snapped, the yoke left lying
  for (const sx of [-1, 1]) {
    s.tube(c + sx * 8, 50, c + sx * 8.6, 62, 0.9, 'wd');
    for (let k = 0; k < 3; k++) s.line(c + sx * 8.6, 62, c + sx * (8 + k), 64.4, 0x9a7a54, 1);
  }
  s.tube(c - 10, 74, c + 8, 71, 1.1, 'wd');
  return s.render({ outline: 2 });
}

/** The buffalo broken free, running off down the lane (28 x 50). */
function gyuRun(f) {
  const s = new HiSprite(30, 54, RAMPS);
  buffalo(s, 15, 10, f, { run: true, yoke: false });
  return s.render({ outline: 2 });
}

/** Okinawa's frames for the shared behaviours (skins.js: okinawa chain, split, cart). */
export function okinawaNewFoes(add) {
  add('ok_ika_0', ika('plain'));
  for (let f = 0; f < 2; f++) add(`ok_ika_eye_${f}`, ika('eye', f));
  for (let f = 0; f < 2; f++) add(`ok_ika_lit_${f}`, ika('lit', f));
  add('ok_ika_burnt', ika('burnt'));
  add('ok_pole', post());
  for (let f = 0; f < 4; f++) add(`ok_yashi_${f}`, coconut(f));
  for (let f = 0; f < 2; f++) add(`ok_yashi_one_${f}`, coconutHalf(f));
  for (let st = 0; st < 4; st++) for (let f = 0; f < 2; f++) add(`ok_gyu_${st}_${f}`, gyu(st, f));
  add('ok_gyu_wreck', gyuWreck());
  for (let f = 0; f < 2; f++) add(`ok_gyu_run_${f}`, gyuRun(f));
}
