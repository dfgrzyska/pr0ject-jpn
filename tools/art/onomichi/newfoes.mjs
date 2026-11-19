// Onomichi's looks for the three shared behaviours (src/game/enemies/chainSplitCart.js, docs/plan-silniejsze-fale.md),
// drawn at 540 px with HiSprite:
//   chain  - tairyo-bata, the fishermen's flags for a big catch, hung on a rope between two bamboo poles over the
//            harbour streets and the shipyard: plain ones (a red sea bream leaping a blue wave, the rising sun), ones
//            whose fish has woken (a great eye, its mouth open: these shoot), one catching fire, its charred scrap
//   split  - a hassaku, the island's big citrus, scowling, its peel splitting down the middle; then each half, its
//            segments bared, flying on its own
//   cart   - the ferry across the strait: a little car ferry seen from above, its open deck, the wheelhouse on its
//            side (its windows two eyes), the funnel, a flag at the stern, the ramp at its bow (its jaw); it breaks
//            up in three stages (the flag torn off, the ramp gone and the ferry listing, the funnel on fire), then
//            its wreck, low in the water
import { HiSprite, tones, speckle, mottle, mix2 } from '../../lib/hisprite.mjs';

const INK = 0x141018;
const TAU = Math.PI * 2;
const RAMPS = {
  fw: tones([0xb8b0a4, 0xf2ece0, 0xffffff]), // the flag's cotton
  fr: tones([0x8a0e14, 0xd8282a, 0xff7a60]), // its red: the fish, the sun, the border
  fb: tones([0x0e2a6a, 0x2456b0, 0x6a9ae8]), // its indigo wave
  lg: [0x7a1808, 0xe0501a, 0xff9a3a, 0xffd88a, 0xfff8e0], // burning
  ch: tones([0x0e0a08, 0x2a201a, 0x4a3a30]), // charred
  bo: tones([0x3a5a1a, 0x7a9a3a, 0xc8d080]), // bamboo
  hs: tones([0xb05a08, 0xf09a1a, 0xffd060]), // the hassaku's peel
  hp: tones([0xc8b88a, 0xf4ecd0, 0xfffcf0]), // its pith
  hj: tones([0xc86a10, 0xf8b030, 0xffe490]), // its segments, juicy
  lf: tones([0x1e4a1a, 0x3a7a2a, 0x7ab84a]), // a leaf
  hw: tones([0x8a96a4, 0xdce4ec, 0xffffff]), // the ferry's white paint
  hb: tones([0x12305a, 0x2a5aa0, 0x6a9ad8]), // its blue band
  dk: tones([0x3a3c44, 0x62666e, 0x9498a0]), // the car deck, steel
  gl: [0x0a1a2a, 0x1a3a5a, 0x4a8ab8, 0xa8e0ff, 0xf0fcff], // the wheelhouse windows
  fn: tones([0x8a1010, 0xd02a20, 0xff7a5a]), // the funnel's red
  fl: tones([0xb82a08, 0xff8a1a, 0xfff2a0]), // flame
  wt: tones([0x0e2a3a, 0x2a5a6a, 0x6a9aa8]), // the water about the wreck
};

// ---------------------------------------------------------------- chain: a tairyo-bata (27 x 36)
// (hung from the rope at its top, as the lanterns are: the rope runs through y 3)
function flag(kind, f = 0) {
  const s = new HiSprite(27, 36, RAMPS);
  const [x0, x1, y0, y1] = [3, 24, 4, 33];
  const sway = (y) => Math.sin((y - y0) / 7 + f * 1.6) * 0.8 * ((y - y0) / (y1 - y0)); // (stirring in the wind)
  // the ties over the rope
  for (const x of [6, 13.5, 21]) s.line(x, 1.5, x, y0 + 1, 0x2a2420, 1.2);
  if (kind === 'burnt') {
    // a charred scrap left on the ties, its edge glowing here and there
    s.poly([[x0 + 1, y0], [x1 - 1, y0], [x1 - 3, y0 + 7], [17, y0 + 11], [12, y0 + 8], [7, y0 + 12], [x0 + 2, y0 + 6]], 'ch', { flat: 0.6, pat: speckle({ amt: 0.2, seed: 5 }) });
    for (const [x, y] of [[9, 13], [16, 12], [20, 9]]) s.dot(x, y, 0.8, 0xff7a20, 0.8);
    return s.render({ outline: 2 });
  }
  const lit = kind === 'lit';
  // the cloth: a red border, the white field, the rising sun top right, the indigo wave along the foot
  s.paint([x0, y0, x1 + 1, y1], (x, y) => x >= x0 + sway(y) && x <= x1 + sway(y) && y <= y1 - (lit ? Math.abs(Math.sin(x * 1.3 + f)) * 6 : 0), 'fr', () => 0.55);
  s.paint([x0, y0, x1 + 1, y1], (x, y) => x >= x0 + 2 + sway(y) && x <= x1 - 2 + sway(y) && y >= y0 + 2 && y <= y1 - 2, 'fw', (x, y) => 0.6 - (y - y0) * 0.006);
  s.dot(20 + sway(8), 8.4, 2.4, 0xd8282a);
  for (let x = x0 + 2; x <= x1 - 2; x += 0.5) {
    const top = 26 + Math.sin(x * 0.7) * 1.6;
    for (let y = top; y <= y1 - 2; y += 0.5) s.px(x + sway(y), y, y < top + 1 ? 0xffffff : 0x2456b0);
  }
  // the sea bream leaping over the wave: a plump red body arched across the cloth, its white belly, the forked
  // tail up at the back, the fins; outlined dark so it reads at the game's size
  const body = (x, y) => ((x - 12.5 - sway(y)) / 8.4) ** 2 + ((y - 19 + (x - 12.5) * 0.28) / 4.6) ** 2 <= 1;
  s.paint([3, 12, 23, 27], (x, y) => body(x, y) || body(x - 0.8, y) || body(x, y - 0.8) || body(x, y + 0.8), 'K', () => 0.15);
  s.paint([3, 12, 23, 27], body, 'fr', (x, y) => 0.75 - (y - 15) * 0.05);
  s.paint([3, 12, 23, 27], (x, y) => body(x, y) && y > 20.6 - (x - 12.5) * 0.28, 'fw', () => 0.7); // (its belly)
  s.poly([[19.5, 15.6], [24, 10.5], [23, 15.5], [24.6, 19], [20.4, 17.4]], 'fr', { flat: 0.6 }); // the forked tail
  s.poly([[10, 15], [14, 12.6], [16, 15]], 'fr', { flat: 0.45 }); // the dorsal fin
  for (let k = 0; k < 4; k++) s.line(9 + k * 2.4, 17 + k * 0.4, 10 + k * 2.4, 18.6 + k * 0.4, 0x8a0e14, 1, 0.6); // (its scales)
  const [ex, ey] = [7.2 + sway(19), 19.6];
  if (kind === 'eye') {
    // the fish woken: a great eye glaring, its mouth gaping
    s.dot(ex, ey, 2.6, 0xffffff);
    s.dot(ex + 0.3, ey + 0.2, 1.7, f === 1 ? 0xff3a20 : 0xf0c020);
    s.dot(ex + 0.4, ey + 0.3, 0.9, INK);
    s.line(ex - 2.4, ey - 3, ex + 2.2, ey - 2.2, INK, 1.3);
    s.dot(ex - 2.6, ey + 2.6, 1.3, INK); // (the mouth gaping)
  } else {
    s.dot(ex, ey, 1.3, 0xffffff);
    s.dot(ex, ey, 0.8, INK);
  }
  if (lit) {
    // the fire running up from its ragged foot, sparks off it
    for (let k = 0; k < 4; k++) {
      const x = x0 + 3 + k * 5.4;
      const h = 9 + ((k * 3 + f * 2) % 4);
      s.paint([x - 3, y1 - 6 - h, x + 3, y1], (px, py) => {
        const t = (y1 - 2 - py) / h;
        return t > 0 && t < 1 && Math.abs(px - x) < 2.6 * (1 - t) + 0.5;
      }, 'lg', (px, py) => 0.4 + (y1 - 2 - py) / h * 0.5, { glow: true });
    }
    for (let i = 0; i < 4; i++) s.dot(x0 + 3 + i * 6, y1 - 14 - ((i + f) % 3) * 2, 0.7, 0xfff0a0);
  }
  return s.render({ outline: 2 });
}

/** A bamboo pole the rope hangs from (21 x 21, seen from above): its cut top, a node's ring, the rope's knot. */
function pole() {
  const s = new HiSprite(21, 21, RAMPS);
  s.ellipse(10.5, 10.5, 4.2, 4.2, 'bo', { bias: 0.1 });
  s.ellipse(10.5, 10.5, 2.6, 2.6, 'bo', { flat: 0.35 }); // (hollow)
  s.tube(2, 11, 19, 10, 1.2, 'bo');
  s.dot(10.5, 10.5, 1.2, 0x2a3414);
  return s.render({ outline: 2 });
}

// ---------------------------------------------------------------- split: a hassaku (whole 48 x 48, a half 30 x 36)
function hassaku(f) {
  const s = new HiSprite(48, 48, RAMPS);
  const c = 24;
  const swell = [0, 0.4, 0.8, 0.4][f];
  // the fruit: big, a little flattened, its peel dimpled with oil glands
  s.ellipse(c, 27, 17 + swell, 15.5 + swell, 'hs', { bias: 0.05, pat: mix2(speckle({ amt: 0.2, dark: 0.12, seed: 3 }), mottle({ amt: 0.1, scale: 3, seed: 4 })) });
  for (let k = 0; k < 30; k++) {
    const a = (k * 2.4) % TAU;
    const r = 4 + ((k * 7) % 12);
    s.dot(c + Math.cos(a) * r, 27 + Math.sin(a) * r * 0.9, 0.5, 0xffe08a, 0.5);
  }
  // the split down its middle, the pith and a segment showing in it
  s.paint([c - 3, 11, c + 3, 26], (x, y) => Math.abs(x - c - Math.sin(y * 0.9) * 0.9) < 0.6 + Math.sin(((y - 11) / 15) * Math.PI) * 1.4, 'hp', () => 0.6);
  s.paint([c - 2, 13, c + 2, 24], (x, y) => Math.abs(x - c - Math.sin(y * 0.9) * 0.9) < Math.sin(((y - 13) / 11) * Math.PI) * 0.8, 'hj', () => 0.6);
  // the stalk, a leaf
  s.tube(c - 1, 12, c - 2, 7, 1, 'lf');
  s.poly([[c - 2, 8], [c + 9, 3], [c + 14, 6], [c + 6, 10]], 'lf', { bias: 0.1 });
  s.line(c - 1, 8, c + 12, 5, 0x1e4a1a, 1, 0.8);
  // the scowl: an eye on each side of the split, the brows drawn down, a sour mouth
  for (const sx of [-1, 1]) {
    const ex = c + sx * 7.5;
    s.ellipse(ex, 25, 2.8, f === 2 ? 0.8 : 2.4, 'W', { flat: 0.95 });
    if (f !== 2) s.dot(ex - sx * 0.4, 25.4, 1.3, INK);
    s.line(ex - sx * 3.6, 21.6, ex + sx * 2.6, 23, INK, 1.4);
  }
  s.paint([c - 5, 32, c + 5, 37], (x, y) => y > 33 + Math.abs(x - c) * 0.25 && y < 35.6 - Math.abs(x - c) * 0.1 && Math.abs(x - c) < 4.6, 'K', () => 0.3); // (a sour mouth)
  return s.render({ outline: 2 });
}

function hassakuHalf(f) {
  const s = new HiSprite(30, 36, RAMPS);
  const [cx, cy] = [15, 18];
  // a half seen from its cut face: the peel's rim, the pith, eight segments round the core, juice beading
  s.ellipse(cx, cy, 13, 15, 'hs', { bias: 0.08 });
  s.ellipse(cx, cy, 11.4, 13.4, 'hp', { flat: 0.6 });
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU + f * 0.1;
    s.paint([cx - 11, cy - 13, cx + 11, cy + 13], (x, y) => {
      const d = Math.atan2((y - cy) / 1.15, x - cx);
      const da = Math.abs(((d - a + TAU * 1.5) % TAU) - Math.PI);
      const r = Math.hypot(x - cx, (y - cy) / 1.15);
      return da > Math.PI - 0.32 && r > 1.6 && r < 9.6;
    }, 'hj', (x, y) => 0.45 + Math.hypot(x - cx, y - cy) * 0.03);
  }
  for (let k = 0; k < 5; k++) s.dot(cx - 5 + k * 2.6, cy - 6 + (k % 2) * 9, 0.7, 0xffffff, 0.8);
  // two angry eyes over the core
  for (const sx of [-1, 1]) {
    s.ellipse(cx + sx * 3.4, cy - 1, 2, 1.8, 'W', { flat: 0.95 });
    s.dot(cx + sx * 3, cy - 0.6, 1, INK);
    s.line(cx + sx * 1.2, cy - 3.6, cx + sx * 5.4, cy - 2.6, INK, 1.2);
  }
  return s.render({ outline: 2 });
}

// ---------------------------------------------------------------- cart: the ferry (60 x 78), sailing down the screen
function ferry(stage, f) {
  const s = new HiSprite(60, 78, RAMPS);
  const c = 30;
  const list = stage >= 2 ? 1.6 : 0; // (listing once the ramp is gone)
  // the wake off its stern (up the screen)
  for (const sx of [-1, 1]) for (let k = 0; k < 6; k++) s.line(c + sx * (5 + k * 2), 3 + k * 1.6 + (f % 2), c + sx * (9 + k * 2.4), 5 + k * 1.6 + (f % 2), 0xe8f4ff, 1, 0.55 - k * 0.07);
  // the hull: broad, its sides bowed, both ends rounded off (it sails either way), white over a blue band
  const half = (y) => 19 * Math.sqrt(Math.max(0, 1 - ((y - 40) / 32) ** 6)) - list * ((y - 40) / 32);
  const hull = (x, y) => Math.abs(x - c) < half(y) && y > 8 && y < 72;
  s.paint([c - 20, 8, c + 20, 72], hull, 'hb', () => 0.55);
  s.paint([c - 20, 8, c + 20, 72], (x, y) => Math.abs(x - c) < half(y) - 2 && y > 10 && y < 70, 'hw', () => 0.62);
  // the car deck, steel, and on it a few cars and a bicycle, as they cross
  s.paint([c - 16, 14, c + 16, 66], (x, y) => Math.abs(x - c) < half(y) - 4.4 && y > 14 && y < 66, 'dk', () => 0.45, { pat: speckle({ amt: 0.12, seed: 6 }) });
  for (const [x, y, col] of [[c - 8, 21, 0xc83a30], [c + 7, 23, 0xe8e8ec], [c - 8, 55, 0x3a5aa8], [c + 7, 57, 0x2a2a30]]) {
    s.poly([[x - 3.6, y - 6], [x + 3.6, y - 6], [x + 3.6, y + 6], [x - 3.6, y + 6]], 'K', { flat: 0.3 });
    for (let yy = y - 5; yy <= y + 5; yy += 0.5) s.line(x - 2.8, yy, x + 2.8, yy, col, 1, 1);
    s.line(x - 2.4, y - 2.6, x + 2.4, y - 2.6, 0x9ad0f0, 1, 0.9); // (the windscreen)
    s.line(x - 2.4, y + 3, x + 2.4, y + 3, 0x6a8aa0, 1, 0.8);
  }
  s.line(c - 1, 61, c + 2, 65, 0x2a2a30, 1); // (a bicycle)
  s.dot(c - 1, 61, 0.9, 0x2a2a30);
  s.dot(c + 2, 65, 0.9, 0x2a2a30);
  // the bridge across its middle: a white house, its two windows the ferry's eyes, glaring once it has seen; the
  // funnel at its end
  s.poly([[c - 18, 33], [c + 18, 33], [c + 18, 45], [c - 18, 45]], 'hw', { bias: 0.15 });
  s.line(c - 18, 45, c + 18, 45, 0x8a96a4, 1);
  for (const sx of [-1, 1]) {
    const ex = c + sx * 8;
    s.ellipse(ex, 39, 5, 3.4, 'gl', { bias: 0.1, glow: stage >= 1 });
    s.dot(ex - sx * 0.6, 39.6, 1.8, stage >= 1 ? 0xff4a2a : 0xf0e060);
    s.dot(ex - sx * 0.6, 39.6, 0.8, INK);
    s.line(ex - sx * 5, 34.4 + (stage >= 1 ? 1 : 0), ex + sx * 4, 35.6 - (stage >= 1 ? 0.6 : 0), INK, 1.4); // (its brows)
  }
  s.ellipse(c + 15, 39, 2.6, 3, 'fn', { bias: 0.1 }); // the funnel
  s.dot(c + 15, 39, 1, 0x1a1012);
  // the stern up the screen: the flag on its staff (torn off once it has been hit)
  if (stage === 0) {
    s.line(c, 9, c, 12, 0x6a4a30, 1);
    s.poly([[c, 8], [c - 7, 6 + (f % 2)], [c - 7, 10 + (f % 2)], [c, 11]], 'fr', { flat: 0.6 });
  } else s.line(c, 9, c - 2, 11, 0x6a4a30, 1);
  // the bow down the screen: the ramp raised - the ferry's jaw, a row of teeth along its lip
  if (stage < 2) {
    s.poly([[c - 13, 66], [c + 13, 66], [c + 11, 72], [c - 11, 72]], 'dk', { bias: 0.15 });
    for (let x = c - 10; x <= c + 10; x += 2.5) s.poly([[x - 1, 71.6], [x + 1, 71.6], [x, 74.6]], 'W', { flat: 0.9 });
  } else {
    // gone: the open bow, a broken hinge, water slopping in
    s.line(c - 12, 66, c + 12, 66, 0x2a2c34, 1.4);
    s.line(c + 11, 66, c + 14, 70, 0x62666e, 1.2);
    for (let k = 0; k < 4; k++) s.dot(c - 8 + k * 5, 63, 1, 0xa8d8f0, 0.7);
  }
  if (stage >= 3) {
    // the funnel on fire
    for (let k = 0; k < 3; k++) {
      const x = c + 13 + k * 2;
      const h = 7 + ((k * 3 + f * 2) % 4);
      s.paint([x - 3, 37 - h - 2, x + 3, 40], (px, py) => {
        const t = (38 - py) / h;
        return t > 0 && t < 1 && Math.abs(px - x) < 2.4 * (1 - t) + 0.5;
      }, 'fl', (px, py) => 0.5 + (38 - py) / h * 0.45, { glow: true });
    }
  }
  return s.render({ outline: 2 });
}

function ferryWreck() {
  const s = new HiSprite(60, 78, RAMPS);
  const c = 30;
  // low in the water, listing: the ripples about it, the hull half under, the deck awash, the wheelhouse burnt out
  s.ellipse(c, 40, 22, 34, 'wt', { flat: 0.5, pat: mottle({ amt: 0.2, scale: 3, seed: 8 }) });
  for (let k = 0; k < 8; k++) s.line(c - 20 + k * 5, 8 + (k % 3) * 2, c - 16 + k * 5, 8 + (k % 3) * 2, 0xa8d0e0, 1, 0.6);
  s.poly([[c - 12, 16], [c + 14, 20], [c + 12, 64], [c - 14, 60]], 'hw', { flat: 0.45, pat: speckle({ amt: 0.25, dark: 0.3, seed: 9 }) });
  s.poly([[c - 10, 22], [c + 6, 24], [c + 4, 56], [c - 12, 54]], 'wt', { flat: 0.55 });
  s.poly([[c + 7, 28], [c + 13, 30], [c + 12, 48], [c + 6, 46]], 'ch', { flat: 0.55 });
  for (let i = 0; i < 5; i++) s.dot(c + 8 + (i % 2) * 3, 32 + i * 3, 0.9, 0xff7020, 0.7);
  return s.render({ outline: 2 });
}

/** Onomichi's frames for the shared behaviours (skins.js: onomichi chain, split, cart). */
export function onomichiNewFoes(add) {
  add('o_bata_0', flag('plain'));
  for (let f = 0; f < 2; f++) add(`o_bata_eye_${f}`, flag('eye', f));
  for (let f = 0; f < 2; f++) add(`o_bata_lit_${f}`, flag('lit', f));
  add('o_bata_burnt', flag('burnt'));
  add('o_pole', pole());
  for (let f = 0; f < 4; f++) add(`o_hassaku_${f}`, hassaku(f));
  for (let f = 0; f < 2; f++) add(`o_hassaku_one_${f}`, hassakuHalf(f));
  for (let st = 0; st < 4; st++) for (let f = 0; f < 2; f++) add(`o_ferry_${st}_${f}`, ferry(st, f));
  add('o_ferry_wreck', ferryWreck());
}
