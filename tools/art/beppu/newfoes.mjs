// Beppu's looks for two of the shared behaviours (src/game/enemies/chainSplitCart.js, docs/plan-silniejsze-fale.md;
// no pair here: Beppu's eggs already hatch into little oni), drawn at 540 px with HiSprite:
//   chain  - jigoku-mushi: bamboo baskets of food hung from a hemp rope over the steam vents of Kannawa, to cook in
//            the hells' steam, in turn prawns with a scallop, corn with a wedge of pumpkin, and cups of the steamed
//            pudding (jigoku-mushi purin); one wakes, its woven lid lifting on two glaring eyes in the dark of it and
//            the steam pouring out (these shoot); one bursting in a gout of scalding steam that carries to the next;
//            its bail left hanging on the rope with a few broken strips. (No eggs in them: Beppu's popcorn is an egg.)
//   cart   - a daihachi-guruma, the big two-wheeled hand cart, carrying a barrel of hot mud from the mud baths with
//            no one between its shafts: the barrel laid along it on its side (stood up, from above it would be the
//            bath bucket of the carriers), its bamboo hoops, lashed down with straw rope, two knotholes glaring and
//            its bung gaping, the grey mud drooling out of it, steaming; a dipper hung on it, a towel on the crossbar,
//            the bath's board at the back. It breaks up in three stages (a hoop sprung, mud spurting from a seam: it
//            glares red; a wheel gone, the staves split and the mud pouring out behind; the mud boiling over in
//            bursts of steam, the cracks glowing), its wreck the barrel burst open, its staves splayed round a pool
//            of mud
import { HiSprite, tones, speckle, mottle, fur, mix2 } from '../../lib/hisprite.mjs';

const INK = 0x14101c;
const TAU = Math.PI * 2;
const RAMPS = {
  bm: tones([0x6a5a2a, 0xb8a060, 0xe8d8a0]), // split bamboo, weathered
  bd: tones([0x3a2e14, 0x7a6430, 0xb89c58]), // bamboo, the dark weave
  hp: tones([0x5a4a2a, 0x9a8458, 0xd0bc88]), // hemp rope
  pr: tones([0x8a1a10, 0xe0502a, 0xffb08a]), // a steamed prawn
  sc: tones([0x8a6a50, 0xd8b898, 0xfff0e0]), // a scallop's shell
  cn: tones([0x9a6a08, 0xf0c030, 0xfff0a0]), // corn
  hk: tones([0x3a5a1a, 0x7a9a3a, 0xc8d888]), // its husk
  pk: tones([0x1a3a1a, 0x2e5a2a, 0x5a8a4a]), // the pumpkin's green skin
  po: tones([0xa04a08, 0xf08a20, 0xffc870]), // its flesh
  pu: tones([0xa88a50, 0xf0dca0, 0xfff8e0]), // the pudding
  ca: tones([0x3a1a08, 0x7a3a10, 0xc0702a]), // its caramel
  gl: tones([0x8a9aa4, 0xd8e4ea, 0xffffff]), // the glass cups
  st: tones([0xa8b0b8, 0xe8eef2, 0xffffff]), // steam
  ys: tones([0x8a7a10, 0xe8d040, 0xfff8a0]), // sulphur
  ce: tones([0x3a2a1a, 0x6a5038, 0xa08060]), // cedar, weathered
  ir: tones([0x121216, 0x2e2e36, 0x5a5a66]), // iron
  ok: tones([0x4a2e14, 0x8a6030, 0xc89a60]), // the barrel's staves, oak
  md: tones([0x3a3a3a, 0x7a7a76, 0xb8b8b0]), // grey hot mud
  wd: tones([0x2a1a0e, 0x5a3e24, 0x8a6a44]), // the cart's wood
  tw: tones([0x8a93b0, 0xe8ecf4, 0xffffff]), // a towel
  ch: tones([0x0e0a08, 0x2a201a, 0x4a3a30]), // scalded dark
  hot: tones([0xb83a08, 0xff8a1a, 0xfff2a0]), // the glow of the boiling
};
const weave = (seed = 1) => mix2(speckle({ amt: 0.1, dark: 0.06, seed }), mottle({ amt: 0.08, scale: 3, seed: seed + 1 }));

// ---------------------------------------------------------------- chain: a basket (30 x 46) hung off the rope
/**
 * The bail and the basket (open, seen from a little above): its woven sides tapering down, the rim of split bamboo,
 * the opening (an ellipse at `ry`), what is in it painted by `fill`; steam rising off it.
 */
function basket(s, c, f, fill, { lid = 0 } = {}) {
  const top = 22;
  // the bail: a hoop of bamboo from the rim's sides up to the hook on the rope
  for (let a = 0; a <= Math.PI; a += 0.04) s.px(c + Math.cos(a) * 11, top - Math.sin(a) * 15, 0x7a6430);
  for (let a = 0.1; a <= Math.PI - 0.1; a += 0.04) s.px(c + Math.cos(a) * 10.4, top - Math.sin(a) * 14.4, 0xc8b070, 0.8);
  s.line(c, 1, c, 7.5, 0x9a8458, 1.2); // (its cord to the rope)
  s.ellipse(c, 7.4, 1.6, 1.2, 'ir', { flat: 0.6 }); // the hook
  // the woven sides: a bowl tapering to its foot, the weave in diagonals both ways, darker under the rim
  s.paint([c - 13, top - 2, c + 13, 42], (x, y) => {
    const t = (y - top) / 18;
    return t >= 0 && t <= 1 && Math.abs(x - c) < 12 - t * 4 - (t > 0.85 ? (t - 0.85) * 10 : 0);
  }, 'bd', (x, y) => {
    const lit = 0.62 - (x - c) * 0.025 - (y < top + 3 ? 0.18 : 0);
    const d1 = ((x + y) % 3.2) < 1.2, d2 = ((x - y + 40) % 3.2) < 1.2;
    return lit + (d1 && !d2 ? 0.16 : d2 && !d1 ? -0.1 : 0);
  }, { pat: weave(f + 2) });
  s.line(c - 7.5, 40.6, c + 7.5, 40.6, 0x3a2e14, 1); // (its foot ring)
  // the rim of split bamboo, lashed
  for (let a = 0; a < TAU; a += 0.02) s.px(c + Math.cos(a) * 12, top + Math.sin(a) * 4, a < Math.PI ? 0xd8c890 : 0x8a7440);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU + 0.3;
    if (Math.sin(a) > 0) s.line(c + Math.cos(a) * 12, top + Math.sin(a) * 4 - 0.8, c + Math.cos(a) * 12, top + Math.sin(a) * 4 + 1.6, 0x6a5a2a, 1);
  }
  // the opening and what is in it
  s.ellipse(c, top, 11, 3.6, 'bd', { flat: 0.18 });
  if (fill) fill(top);
  if (lid) {
    // its woven lid, lifted on the far side by `lid`
    s.paint([c - 13, top - 9, c + 13, top + 4], (x, y) => ((x - c) / 11.6) ** 2 + ((y - top + 1 + lid * (0.5 - (x - c) / 24) * 0.9) / 4) ** 2 < 1, 'bm', (x, y) => 0.62 - (x - c) * 0.02 + (((x * 1.3 + y) | 0) % 3 === 0 ? 0.12 : 0), { pat: weave(9) });
    s.ellipse(c, top - 1 - lid * 0.45, 2.2, 1.2, 'bd', { flat: 0.5 }); // its knob
  }
}

/** Prawns curled pink-red and a scallop on its shell, a sprig of mitsuba. */
function seafood(s, c) {
  return (top) => {
    for (const [px, flip] of [[c - 4.5, 1], [c + 1.5, -1]]) {
      for (let a = 0.2; a < 3.6; a += 0.12) {
        const r = 3.4 - a * 0.35;
        s.ellipse(px + Math.cos(a) * r * 1.2 * flip, top - 0.6 + Math.sin(a) * r * 0.6, 1.7 - a * 0.22, 1.3, 'pr', { flat: 0.6 });
      }
      for (let a = 0.4; a < 3.2; a += 0.6) s.px(px + Math.cos(a) * 2.6 * flip, top - 0.6 + Math.sin(a) * 1.4, 0xfff0e0, 0.7); // (its segments)
      s.line(px + 3 * flip, top - 1.4, px + 6 * flip, top - 4, 0xd8401e, 1, 0.8); // its feelers
    }
    s.ellipse(c + 6.5, top + 0.4, 3.4, 2.2, 'sc', { flat: 0.55 });
    for (let k = -2; k <= 2; k++) s.line(c + 6.5, top + 1.8, c + 6.5 + k * 1.3, top - 1.2, 0xa08068, 1, 0.6);
    s.ellipse(c + 6.5, top + 0.2, 1.6, 1, 'po', { flat: 0.6 }); // (the scallop's roe)
    for (const [x, y] of [[c - 1, top + 1.6], [c, top + 2]]) s.dot(x, y, 0.6, 0x4a9a3a);
  };
}
/** A cob of corn in its husk, a wedge of pumpkin. */
function corn(s, c) {
  return (top) => {
    s.poly([[c - 9, top + 1], [c - 5, top - 3], [c + 2, top - 2], [c - 3, top + 2.4]], 'hk', { flat: 0.55 });
    s.paint([c - 9, top - 4, c + 4, top + 3], (x, y) => Math.abs((y - top + 0.8) + (x - c + 3) * 0.3) < 1.9 && x > c - 8.5 && x < c + 3, 'cn', (x, y) => 0.62 + (((x * 1.7) | 0) % 2 ? 0.14 : -0.08) + (((y * 1.7) | 0) % 2 ? 0.06 : 0));
    // the pumpkin: its dark green skin, the orange flesh, the seeds' hollow scooped
    s.poly([[c + 1, top + 2], [c + 9.5, top - 1.6], [c + 8, top + 2.2]], 'po', { flat: 0.6 });
    s.line(c + 1, top + 2, c + 9.5, top - 1.6, 0x2e5a2a, 1.4);
    s.line(c + 5, top + 1.2, c + 8.4, top + 0.2, 0xd06a10, 1, 0.6);
  };
}
/** Jigoku-mushi purin: little glass cups of pudding, their caramel. */
function purin(s, c) {
  return (top) => {
    for (const [x, y] of [[c - 5.5, top + 0.2], [c + 0.5, top - 1], [c + 6, top + 0.6], [c - 1.5, top + 1.8]]) {
      s.ellipse(x, y, 3, 2, 'gl', { flat: 0.75 });
      s.ellipse(x, y - 0.2, 2.4, 1.5, 'pu', { flat: 0.7 });
      s.ellipse(x - 0.1, y - 0.3, 1.4, 0.9, 'ca', { flat: 0.6 });
      s.px(x - 1.6, y - 0.8, 0xffffff, 0.8);
    }
  };
}
/** The one woken: its lid lifting on the dark inside, two eyes glaring, the steam pouring out. */
function woken(s, c, f) {
  return (top) => {
    s.ellipse(c, top - 0.4, 10, 3, 'ch', { flat: 0.1 });
    for (const sx of [-1, 1]) {
      const [ex, ey] = [c + sx * 3.6, top - 0.6 - (f ? 0.3 : 0)];
      s.ellipse(ex, ey, 2, f ? 0.9 : 1.4, 'hot', { flat: 0.7, glow: true });
      s.dot(ex + sx * 0.2, ey, 0.6, 0x1a0a08);
    }
    s.line(c - 3, top + 1.4, c + 3, top + 1.4, 0xff5a20, 1, 0.5); // (a grin, faint, in the dark)
  };
}

function kago(kind, f = 0) {
  const s = new HiSprite(30, 46, RAMPS);
  const c = 15;
  if (kind === 'burnt') {
    // left on the rope: the hook, the bail twisted, a few broken strips of the weave hanging off it, dripping
    s.line(c, 1, c, 7.5, 0x6a5a3a, 1.2);
    s.ellipse(c, 7.4, 1.6, 1.2, 'ir', { flat: 0.6 });
    for (let a = 0.5; a <= Math.PI; a += 0.04) s.px(c + Math.cos(a) * 9 + Math.sin(a * 3) * 1.2, 20 - Math.sin(a) * 12, 0x5a4a28);
    for (const [x, len, k] of [[c - 9, 9, 0.3], [c - 6, 6, -0.2], [c + 1, 11, 0.15], [c + 5, 5, -0.3]]) s.line(x, 20, x + k * len, 20 + len, 0x7a6430, 1.2);
    for (const [x, y] of [[c - 6, 28], [c + 2.6, 33]]) s.dot(x, y, 0.7, 0xc8d8e0, 0.7);
    return s.render({ outline: 2 });
  }
  const fills = { 0: seafood(s, c), 1: corn(s, c), 2: purin(s, c), eye: woken(s, c, f), lit: seafood(s, c) };
  basket(s, c, f, fills[kind], { lid: kind === 'eye' ? 3 + f * 1.6 : 0 });
  if (kind === 'eye') for (let k = 0; k < 3; k++) s.ellipse(c - 5 + k * 5, 15 - k - f, 2.4, 1.6, 'st', { flat: 0.7 });
  if (kind === 'lit') {
    // bursting: the lid blown off, a gout of scalding steam billowing up and round it, the weave darkening, sulphur
    // yellow at its heart
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * TAU + f * 0.6;
      s.ellipse(c + Math.cos(a) * (8 + (k % 2) * 2), 18 + Math.sin(a) * 9 - 2, 4.2 - (k % 3) * 0.6, 3.4, 'st', { flat: 0.6, glow: true });
    }
    s.ellipse(c, 19, 6, 4.4, 'ys', { flat: 0.75, glow: true });
    s.ellipse(c, 19, 3.4, 2.4, 'st', { flat: 0.9, glow: true });
    for (let i = 0; i < 4; i++) s.dot(c - 6 + i * 4, 6 + ((i + f) % 3) * 2, 0.7, 0xfffbe0);
  }
  return s.render({ outline: 2 });
}

/** The post (22 x 22, from above): a weathered cedar post, the rope round its top and its iron ring, sulphur at its foot. */
function post() {
  const s = new HiSprite(22, 22, RAMPS);
  const c = 11;
  s.ellipse(c, c, 9.4, 9.4, 'ys', { flat: 0.35, pat: mottle({ amt: 0.25, scale: 2, seed: 4 }) }); // (the crust of sulphur round its foot)
  s.paint([c - 5, c - 5, c + 5, c + 5], (x, y) => Math.abs(x - c) < 4.4 && Math.abs(y - c) < 4.4, 'ce', (x, y) => 0.55 - (x - c) * 0.03 + Math.sin((x - c) * (y - c) * 0.35) * 0.08, { pat: speckle({ amt: 0.14, seed: 3 }) });
  for (let r = 1.2; r < 4.2; r += 1.4) for (let a = 0; a < TAU; a += 0.06) s.px(c + Math.cos(a) * r, c + Math.sin(a) * r, 0x4a3420, 0.4); // (its rings)
  for (let a = 0; a < TAU; a += 0.03) s.px(c + Math.cos(a) * 5.4, c + Math.sin(a) * 5.4, 0x9a8458);
  s.ellipse(c + 5, c + 1, 1.8, 1.8, 'ir', { flat: 0.4 }); // the ring the rope runs through
  s.dot(c + 5, c + 1, 0.8, 0x1a1a1e);
  return s.render({ outline: 2 });
}

// ---------------------------------------------------------------- cart: the mud barrel on its hand cart (48 x 84)
/** Its board at the back: 泥湯 brushed on a plank (two blocks of strokes), hung by two cords. */
function board(s, c, y) {
  s.paint([c - 8, y - 3, c + 8, y + 3], (x, yy) => Math.abs(x - c) < 7.6 && Math.abs(yy - y) < 2.6, 'ce', () => 0.75, { pat: speckle({ amt: 0.1, seed: 5 }) });
  for (const [x0, strokes] of [[c - 5.6, [[0, -1.4, 0, 1.4], [-1, -0.6, 1.2, -0.6], [-1, 0.8, 1.4, 0.8], [1.6, -1.6, 1.6, 1.6]]], [c + 1.8, [[0, -1.6, 0, 1.6], [-1.2, 0, 1.4, 0], [1.8, -1.4, 2.6, 1.6]]]])
    for (const [a, b, cc, d] of strokes) s.line(x0 + a, y + b, x0 + cc, y + d, 0x1a1210, 1);
}

function kuruma(stage, f) {
  const s = new HiSprite(48, 84, RAMPS);
  const c = 24;
  const sprung = stage >= 1; // (a hoop sprung, mud spurting)
  const lame = stage >= 2; // (a wheel gone, the staves split, the mud pouring out)
  const boil = stage >= 3;
  // the shafts out ahead, empty, their crossbar with a towel knotted round it, worn smooth where hands would be
  for (const sx of [-1, 1]) s.tube(c + sx * 9, 58, c + sx * 7, 82, 1.4, 'wd', { flat: sx < 0 ? 0.62 : 0.44 });
  s.tube(c - 8.4, 79, c + 8.4, 79, 1.2, 'wd', { flat: 0.55 });
  s.paint([c - 4, 76, c + 4, 83], (x, y) => Math.abs(x - c + 1) < 3 && Math.abs(y - 79) < 2.2 + (x > c ? 1 : 0), 'tw', () => 0.6);
  for (let k = 0; k < 3; k++) s.dot(c - 3 + k * 2, 79, 0.5, 0x3a5aa8, 0.9);
  s.line(c + 1, 81, c + 2, 83.4, 0xd8dce8, 1);
  // its two big wheels at the middle, seen edge on from above: the iron tyre, the hub; the bed of planks between
  const wheel = (sx) => {
    const wx = c + sx * 20;
    s.ellipse(wx, 35, 3.8, 17, 'ir', { flat: 0.35 }); // (the iron tyre)
    s.ellipse(wx, 35, 2.8, 15.6, 'wd', { flat: 0.5 }); // the felloes
    s.ellipse(wx, 35, 1.6, 13.4, 'wd', { flat: 0.15 });
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * TAU + f * 0.31;
      s.line(wx, 35, wx + Math.cos(a) * 2.4, 35 + Math.sin(a) * 14.6, 0x8a6a44, 1); // its spokes, going round
    }
    s.ellipse(wx + sx * 1.2, 35, 1.8, 2.6, 'ir', { flat: 0.45 }); // its hub
  };
  wheel(-1);
  if (!lame) wheel(1);
  else {
    // its axle's stub dragging, sparks off it, the cart down on that side
    s.ellipse(c + 17, 36, 1.8, 2.4, 'ir', { flat: 0.4 });
    for (let k = 0; k < 3; k++) s.dot(c + 18 + k, 39 + k * 4 + f, 0.7, k % 2 ? 0xffd080 : 0x8a8682, 0.8);
  }
  for (const sx of [-1, 1]) s.tube(c + sx * 14.6, 9, c + sx * 14.6, 61, 1.5, 'wd', { flat: sx < 0 ? 0.62 : 0.4 });
  for (const y of [10, 60]) s.paint([c - 16, y - 2, c + 16, y + 2], (x, yy) => Math.abs(x - c) < 15.5 && Math.abs(yy - y) < 1.6, 'wd', (x) => 0.5 - (x - c) * 0.01, { pat: speckle({ amt: 0.1, seed: 7 }) });
  // the barrel on its side along the cart: oak staves running its length, round across, its two heads at the ends
  const half = (y) => 13 - ((y - 34) / 24) ** 2 * 4.4; // (bellied: 13 across the middle, 8.6 at the heads)
  const body = (x, y) => Math.abs(x - c) < half(y) && y > 10 && y < 58;
  s.paint([c - 13, 9, c + 13, 59], body, 'ok', (x, y) => {
    const t = (x - c) / half(y);
    const round = 0.78 - t * 0.38 - t * t * 0.3; // (lit from the left)
    const seam = ((x - c + 30) * 1.25) % 4 < 0.5 ? -0.22 : 0; // (the staves' joints)
    const bulge = -Math.abs(y - 34) * 0.004;
    return round + seam + bulge;
  }, { pat: mix2(fur(Math.PI / 2, { amt: 0.12, len: 18, w: 1, gap: 0.05, seed: 3 }), speckle({ amt: 0.08, seed: 4 })) });
  for (const y of [10.4, 57.6]) s.line(c - 10, y, c + 10, y, 0x2a1a0c, 1.2); // (its heads' chime edges)
  // the bamboo hoops (taga), braided; one sprung once hit, its end curling up off the barrel
  for (const [i, y] of [[0, 15], [1, 22], [2, 46], [3, 53]]) {
    const hw = half(y);
    if (sprung && i === 1) {
      for (let k = 0; k <= 12; k++) s.dot(c - hw + k * 1.4, y + Math.sin(k * 0.9) * 0.6 - (k > 7 ? (k - 7) * 1.3 : 0), 1, k % 2 ? 0xb8a060 : 0x5a4a20);
      continue;
    }
    // (curved round the barrel: lower at its sides)
    s.paint([c - hw - 1, y - 3, c + hw + 1, y + 3], (x, yy) => Math.abs(x - c) < hw + 0.7 && Math.abs(yy - y - ((x - c) / hw) ** 2 * 1.2) < 1.6, 'bd', (x, yy) => 0.66 - (x - c) * 0.03 + ((((x * 0.9 + yy * 1.8)) | 0) % 2 ? 0.16 : -0.12));
  }
  // straw rope lashing it to the cart
  for (const y of [18.5, 49.5]) for (let k = 0; k < 26; k++) s.dot(c - 13 + k, y + (k % 4 < 2 ? 0.4 : -0.4) + (k - 13) * 0.04, 0.8, k % 3 ? 0xc8b070 : 0x8a7440);
  // its face, looking ahead: two knotholes glaring, the bung gaping under them, grey mud drooling down its sides
  for (const sx of [-1, 1]) {
    s.ellipse(c + sx * 5, 38, 2.4, 2, 'ch', { flat: 0.2 });
    s.ellipse(c + sx * 5 + sx * 0.2, 38.2, 1.3, 1.1, 'hot', { flat: 0.7, glow: true });
    if (sprung) s.dot(c + sx * 5, 38.2, 0.7, 0xff2a10);
    s.line(c + sx * 2.2, 35.4, c + sx * 7.6, 36.4, 0x2a1a0c, 1); // (the grain bunching over them like brows)
  }
  s.ellipse(c, 44.4, 3.4, 2.6, 'ch', { flat: 0.12 });
  s.ellipse(c, 44.6, 2.4, 1.6, 'md', { flat: 0.62, pat: mottle({ amt: 0.3, scale: 2, seed: 8 + f }) });
  s.dot(c - 0.8 + f, 44, 0.7, 0xd8d8d0); // (a bubble on the mud)
  for (const [x0, len] of [[c - 2.6, 6], [c + 2, 9], [c + 3.6, 4]]) for (let k = 0; k < len; k++) s.dot(x0 + Math.sin(k * 0.6) * 0.5 + (x0 > c ? k * 0.35 : -k * 0.3), 46.4 + k, 0.8 - k * 0.04, k % 2 ? 0x7a7a76 : 0x5a5a56);
  // the tap at its front head, a dipper hooked on its side, the bath's board at the back
  s.paint([c - 2, 57, c + 2, 64], (x, y) => Math.abs(x - c) < 1.4 && y > 57.5 && y < 63, 'ce', () => 0.6);
  s.ellipse(c, 63, 1.8, 1.2, 'ce', { flat: 0.5 });
  s.dot(c, 64.4 + f * 0.8, 0.6, 0x6a6a66, 0.9); // (a drip of mud)
  s.line(c - 13.6, 26, c - 13.6, 42, 0x9a7a4a, 1);
  s.ellipse(c - 13.6, 43.6, 1.8, 1.6, 'ce', { flat: 0.4 }); // the dipper
  board(s, c, 6);
  for (const sx of [-1, 1]) s.line(c + sx * 7, 6, c + sx * 9, 10, 0x8a7440, 1);
  if (sprung) {
    // mud spurting from a seam where the hoop gave
    for (let k = 0; k < 6; k++) s.dot(c - 13 - k * 1.3, 22 - k * 0.9 + (f ? 1 : 0), 1.2 - k * 0.12, k % 2 ? 0x8a8a84 : 0x6a6a66);
    s.line(c - 12, 20, c - 9, 24, 0x1a0e06, 1); // (the seam open)
  }
  if (lame) {
    // the staves split along its back, the mud pouring out behind it in a slick
    for (const x of [c - 4, c + 3, c + 8]) s.line(x, 11, x + 1, 20, 0x1a0e06, 1.2);
    s.paint([c - 14, 0, c + 14, 12], (x, y) => ((x - c - 2) / 11) ** 2 + ((y - 4) / 6) ** 2 < 1 + Math.sin(x * 1.3 + f) * 0.15, 'md', (x, y) => 0.45 + Math.sin(x * 0.9 + y * 1.4) * 0.12, { pat: mottle({ amt: 0.25, scale: 2, seed: 12 + f }) });
    for (let k = 0; k < 4; k++) s.dot(c - 6 + k * 4, 3 + ((k + f) % 2) * 2, 0.8, 0xc8c8c0, 0.8);
  }
  if (boil) {
    // the mud boiling over in bursts of steam, the cracks in it glowing
    for (const [x, y, w] of [[c - 6, 30, 5], [c + 5, 24, 4], [c + 1, 50, 6]]) s.line(x - w / 2, y, x + w / 2, y + 2, 0xff7a1a, 1.4, 0.9);
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * TAU + f;
      s.ellipse(c + Math.cos(a) * 9, 34 + Math.sin(a) * 18, 3.6, 2.8, 'st', { flat: 0.65, glow: true });
    }
    for (let k = 0; k < 4; k++) s.dot(c - 9 + k * 6, 40 - ((k + f) % 3) * 5, 1.1, 0x9a9a94);
  }
  return s.render({ outline: 2 });
}

/** Its wreck: the barrel burst open, its staves splayed round a pool of grey mud, a hoop, the wheel lying flat. */
function kurumaWreck() {
  const s = new HiSprite(48, 84, RAMPS);
  const c = 24;
  s.paint([c - 22, 14, c + 22, 70], (x, y) => ((x - c) / 20) ** 2 + ((y - 42) / 25) ** 2 < 1 + Math.sin(Math.atan2(y - 42, x - c) * 5) * 0.12, 'md', (x, y) => 0.38 + Math.sin(x * 0.7 + y * 0.5) * 0.08, { pat: mottle({ amt: 0.3, scale: 3, seed: 21 }) });
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * TAU + 0.2;
    const [x0, y0] = [c + Math.cos(a) * 6, 42 + Math.sin(a) * 9];
    s.tube(x0, y0, x0 + Math.cos(a) * 11, y0 + Math.sin(a) * 15, 1.6, 'ok', { flat: 0.4 + (k % 3) * 0.1 });
  }
  for (let a = 0; a < TAU; a += 0.04) s.px(c + 3 + Math.cos(a) * 10, 40 + Math.sin(a) * 6, 0x8a7a40);
  s.ellipse(c - 13, 66, 8, 8, 'wd', { flat: 0.3 }); // the wheel off, lying flat
  s.ellipse(c - 13, 66, 6, 6, 'wd', { flat: 0.15 });
  for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; s.line(c - 13, 66, c - 13 + Math.cos(a) * 6, 66 + Math.sin(a) * 6, 0x5a3e24, 1); }
  s.ellipse(c - 13, 66, 1.6, 1.6, 'ir', { flat: 0.4 });
  for (const sx of [-1, 1]) s.tube(c + sx * 6, 70, c + sx * 9 + 4, 82, 1.4, 'wd', { flat: 0.5 }); // (the shafts snapped askew)
  for (let k = 0; k < 4; k++) s.dot(c - 4 + k * 3, 38 + (k % 2) * 4, 0.9, 0xd8d8d0, 0.8); // bubbles still rising in it
  return s.render({ outline: 2 });
}

export function beppuNewFoes(add) {
  for (let i = 0; i < 3; i++) add(`bp_kago_${i}`, kago(i));
  for (let f = 0; f < 2; f++) add(`bp_kago_eye_${f}`, kago('eye', f));
  for (let f = 0; f < 2; f++) add(`bp_kago_lit_${f}`, kago('lit', f));
  add('bp_kago_burnt', kago('burnt'));
  add('bp_post', post());
  for (let st = 0; st < 4; st++) for (let f = 0; f < 2; f++) add(`bp_doro_${st}_${f}`, kuruma(st, f));
  add('bp_doro_wreck', kurumaWreck());
}
