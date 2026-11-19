// The three new behaviours' looks in Fukuoka (docs/plan-fukuoka.md, 5.2 and phase 10), drawn at 540 px with HiSprite:
//   chain  - red paper lanterns hung on a string between two wooden poles over the street: plain ones, ones with an
//            eye and a lolling tongue (a lantern-ghost, the ones that shoot), one catching fire, its charred frame
//   split  - mentaiko, a pair of pollock-roe sacs joined at the top, plump and glistening, scowling; then each sac on
//            its own
//   cart   - oboro-guruma, a Heian ox-cart with no ox: the cabin under its arched roof, its two great wheels, the
//            shafts out in front, a huge pale face behind the blind at its front; it breaks up in three stages (the
//            blind torn off, a wheel gone and the cart limping on one, the roof on fire), then its wreck
import { HiSprite, tones, speckle, mottle, mix2, fur } from '../../lib/hisprite.mjs';

const INK = 0x14101c;
const TAU = Math.PI * 2;
const RAMPS = {
  lp: tones([0x7a0a14, 0xd02a2a, 0xff8a6a]), // a lantern's red paper
  lg: [0x7a1808, 0xe0501a, 0xff9a3a, 0xffd88a, 0xfff8e0], // lit from inside, glowing
  lk: tones([0x0e0c12, 0x2a2630, 0x4e4a58]), // its black lacquered caps
  ch: tones([0x0e0a08, 0x2a201a, 0x4a3a30]), // charred
  pw: tones([0x3a2414, 0x6a4a30, 0x9a7a54]), // a wooden pole
  tn: tones([0x8a1a3a, 0xe04a6a, 0xff9ab0]), // a tongue
  mr: tones([0x8a1a2a, 0xe0485a, 0xff9aa0]), // mentaiko's red-pink sac
  mm: tones([0xa8606a, 0xf0b8b8, 0xfff0ec]), // the thin skin joining the pair
  ck: tones([0x1a1012, 0x3a2a26, 0x6a5444]), // the cart's black lacquer
  cw: tones([0x4a3420, 0x8a6a44, 0xc8a070]), // its wood
  bm: tones([0x6a5a30, 0xb8a868, 0xe8dca0]), // the bamboo blind
  gf: tones([0x8a9aa8, 0xdce6ee, 0xffffff]), // the ghost's pale face
  fl: tones([0xb82a08, 0xff8a1a, 0xfff2a0]), // flame
};

// ---------------------------------------------------------------- chain: a paper lantern (27 x 36)
function lantern(kind, f = 0) {
  const s = new HiSprite(27, 36, RAMPS);
  const c = 13.5;
  // the cord it hangs by, the hook
  s.line(c, 0, c, 5, 0x2a2420, 1.2);
  if (kind === 'burnt') {
    // what is left: the black caps, the bamboo ribs charred, shreds of paper
    s.ellipse(c, 7, 6, 2.4, 'lk', { bias: 0.1 });
    for (let k = 0; k < 6; k++) {
      const y = 10 + k * 3.6;
      const w = 9.5 * Math.sin(Math.PI * ((y - 7) / 24));
      s.line(c - w, y, c + w, y, 0x2a1e18, 1, 0.9);
    }
    for (const [x, y] of [[c - 6, 14], [c + 5, 22], [c - 3, 25]]) s.ellipse(x, y, 2, 1.6, 'ch', { flat: 0.6 });
    s.ellipse(c, 31, 5.4, 2.2, 'lk', { bias: 0.1 });
    return s.render();
  }
  const lit = kind === 'lit';
  // the body: red paper over bamboo ribs, round in the middle; lit, it glows
  s.ellipse(c, 19, 10.5, 12.5, lit ? 'lg' : 'lp', { bias: 0.03, glow: lit });
  for (let k = 0; k < 7; k++) {
    const y = 9 + k * 3.4;
    const w = 10.2 * Math.sqrt(Math.max(0, 1 - ((y - 19) / 12.5) ** 2));
    s.line(c - w, y, c + w, y, lit ? 0xffd080 : 0x8a1414, 1, 0.55); // the ribs
  }
  s.ellipse(c, 7, 6.4, 2.4, 'lk', { bias: 0.1 }); // the black caps
  s.ellipse(c, 31.4, 6, 2.2, 'lk', { bias: 0.1 });
  if (lit) {
    // the fire catching: flames licking up off the top, sparks
    for (let k = -1; k <= 1; k++) s.ellipse(c + k * 4, 6 - (f + k + 2) % 3, 2.2, 3.4, 'fl', { flat: 0.85, glow: true });
    for (let i = 0; i < 5; i++) s.dot(c - 8 + i * 4, 2 + ((i + f) % 3), 0.7, 0xfff0a0);
    return s.render();
  }
  if (kind === 'eye') {
    // a lantern-ghost: the paper split into a mouth, the tongue out, one great eye (blinking)
    const blink = f === 1;
    s.ellipse(c - 1, 15.4, 4.4, blink ? 0.9 : 3.6, 'W', { flat: 0.95 });
    if (!blink) {
      s.dot(c - 0.6, 16, 2.2, 0xf0c020);
      s.dot(c - 0.4, 16.2, 1.2, INK);
      s.dot(c - 2, 14.6, 0.6, 0xffffff);
    }
    s.line(c - 6, 11.6, c + 4, 12.6, INK, 1.4); // its scowl
    s.paint([c - 8, 21, c + 8, 27], (x, y) => y > 22 && y < 25.4 - Math.abs(x - c) * 0.18 && Math.abs(x - c) < 7.6, 'K', () => 0.3);
    s.ellipse(c + 2, 26.5, 2.6, 3.6, 'tn', { bias: 0.08 }); // the tongue, lolling
  }
  return s.render();
}

/** A wooden pole the string hangs from (21 x 21, seen from above): its round top, a cross-arm, the string's knot. */
function pole() {
  const s = new HiSprite(21, 21, RAMPS);
  s.ellipse(10.5, 10.5, 4, 4, 'pw', { bias: 0.08, pat: fur(0.4, { amt: 0.15, len: 3, seed: 2 }) });
  s.tube(2, 10, 19, 10, 1.4, 'pw');
  s.dot(10.5, 10.5, 1.4, 0x2a1e14);
  return s.render();
}

// ---------------------------------------------------------------- split: mentaiko (pair 54 x 45, one 27 x 42)
function sac(s, cx, cy, len, w, lean, f) {
  // a long slender sac, a little curved, leaning out from the top: its ends rounded, red-orange with chili
  const at = (t) => [cx + lean * t * len * 0.5 + Math.sin(t * 1.4) * 1.2, cy + t * len * 0.5]; // t -1 (top) .. 1 (bottom)
  for (let t = -1; t <= 1.001; t += 0.04) {
    const [x, y] = at(t);
    const r = w * Math.sqrt(Math.max(0.05, 1 - t ** 8)) * (1 - 0.18 * Math.max(0, -t));
    s.ellipse(x, y, r, r, 'mr', { bias: 0.05, pat: mix2(speckle({ amt: 0.22, dark: 0.1, seed: 3 }), mottle({ amt: 0.1, scale: 2, seed: 4 })) });
  }
  // the roe in it: fine grains under the skin, a vein of red, the wet shine down its length
  for (let k = 0; k < 14; k++) {
    const [x, y] = at(-0.85 + (k / 13) * 1.7);
    s.dot(x + ((k * 3) % 5) - 2, y, 0.5, 0xffc0b0, 0.6);
  }
  for (let t = -0.8; t < 0.8; t += 0.1) {
    const [x0, y0] = at(t);
    const [x1, y1] = at(t + 0.1);
    s.line(x0 - w * 0.4, y0, x1 - w * 0.4, y1, 0xffe0e0, 1, 0.55);
  }
  // the scowl, low on it: two narrowed eyes, the brows drawn down
  const [ex, ey] = at(0.45);
  for (const sx of [-1, 1]) {
    s.ellipse(ex + sx * 2.4, ey + (f % 2) * 0.3, 2, 1.6, 'W', { flat: 0.95 });
    s.dot(ex + sx * 2.2, ey + 0.5, 1, INK);
    s.line(ex + sx * 1, ey - 2.2, ex + sx * 3.8, ey - 1.4, INK, 1);
  }
}

function mentaikoPair(f) {
  const s = new HiSprite(54, 45, RAMPS);
  const swell = [0, 0.3, 0.6, 0.3][f];
  // the thin skin joining them at the top, the two sacs lying apart below it in a V
  s.poly([[22, 3], [32, 3], [30, 10], [24, 10]], 'mm', { flat: 0.7 });
  sac(s, 19, 23, 38, 6 + swell, -0.28, f);
  sac(s, 35, 23, 38, 6 + swell, 0.28, f + 1);
  return s.render();
}

function mentaikoOne(f) {
  const s = new HiSprite(27, 42, RAMPS);
  // the torn end where it was joined, a shred of skin
  s.poly([[10, 2], [17, 2], [16, 6], [11, 6]], 'mm', { flat: 0.7 });
  sac(s, 13.5, 22, 36, 6.4 + (f % 2) * 0.3, 0, f);
  return s.render();
}

// ---------------------------------------------------------------- cart: oboro-guruma (60 x 78), driving down the screen
function cart(stage, f) {
  const s = new HiSprite(60, 78, RAMPS);
  const c = 30;
  const limp = stage >= 2;
  const tilt = limp ? 2.4 : 0; // (on one wheel it leans to the side it lost)
  // the shafts out in front (down the screen), the yoke across their ends, no ox
  for (const sx of [-1, 1]) s.tube(c + sx * 7, 50, c + sx * 5 + tilt * 0.5, 74, 1.4, 'ck');
  s.tube(c - 9 + tilt * 0.5, 72, c + 9 + tilt * 0.5, 72, 1.3, 'ck');
  // the wheels: tall, spoked, at the cabin's sides (seen from above, their rims and the spokes turning)
  const wheel = (sx) => {
    const x = c + sx * 20;
    s.poly([[x - 2.6, 18], [x + 2.6, 18], [x + 2.6, 56], [x - 2.6, 56]], 'cw', { flat: 0.55 });
    for (let k = 0; k < 6; k++) {
      const y = 19 + ((k * 6.4 + f * 3.2) % 37);
      s.line(x - 2.6, y, x + 2.6, y, 0x2a1e14, 1, 0.8); // spokes going by
    }
    s.ellipse(x, 37, 3.4, 3.4, 'ck', { bias: 0.1 }); // the hub
  };
  wheel(-1);
  if (!limp) wheel(1);
  else {
    // the axle's broken end where the right wheel was, splinters
    s.tube(c + 13, 37 + tilt, c + 19, 38 + tilt, 1.6, 'cw');
    for (let k = 0; k < 4; k++) s.line(c + 19, 38 + tilt, c + 21 + k, 35 + tilt + k * 1.6, 0xc8a070, 1);
  }
  // the cabin: under its arched roof of black lacquer, the ridges of the roof, gilt at its ends
  const cy = 34 + tilt * 0.6;
  s.poly([[c - 15, cy - 20], [c + 15, cy - 20 + tilt], [c + 15, cy + 16 + tilt], [c - 15, cy + 16]], 'ck', { flat: 0.55 });
  for (let k = -2; k <= 2; k++) s.line(c + k * 6, cy - 19 + tilt * 0.5, c + k * 6, cy + 15 + tilt * 0.5, 0x4e4038, 1, 0.7);
  s.paint([c - 15, cy - 20, c + 15, cy + 17 + tilt], (x, y) => Math.abs(x - c) < 15 && Math.abs(y - cy) < 18 && Math.abs(x - c) > 12.6, 'cw', () => 0.6); // its eaves
  for (const sx of [-1, 1]) s.dot(c + sx * 13, cy - 18, 1.2, 0xe0b040);
  // the front: the blind of split bamboo (rolled half up), the face behind it - or torn away, the whole face glaring
  const fy = cy + 18 + tilt * 0.5;
  s.poly([[c - 13, fy - 3], [c + 13, fy - 3 + tilt * 0.4], [c + 13, fy + 9 + tilt * 0.4], [c - 13, fy + 9]], 'K', { flat: 0.2 });
  s.ellipse(c, fy + 4, 10, 7, 'gf', { bias: 0.04, glow: true });
  for (const sx of [-1, 1]) {
    const ex = c + sx * 4.4;
    s.ellipse(ex, fy + 3, 2.6, stage >= 1 ? 2.4 : 1.6, 'W', { flat: 0.95 });
    s.dot(ex, fy + 3.4, 1.4, stage >= 1 ? 0xff4a2a : INK);
    s.line(ex - sx * 3, fy - 0.2, ex + sx * 2.4, fy + 0.8, INK, 1.6); // the brows, furious
  }
  s.paint([c - 6, fy + 6, c + 6, fy + 10], (x, y) => Math.abs(x - c) < 5.6 - (y - fy - 6) * 0.6 && y > fy + 6.4, 'K', () => 0.3); // the mouth
  for (const sx of [-1, 1]) s.line(c + sx * 3, fy + 6.6, c + sx * 2.4, fy + 8.6, 0xf4f0e8, 1); // its teeth
  if (stage === 0) {
    s.poly([[c - 13, fy - 3], [c + 13, fy - 3], [c + 13, fy + 2.6], [c - 13, fy + 2.6]], 'bm', { flat: 0.6 });
    for (let x = c - 12; x <= c + 12; x += 2) s.line(x, fy - 3, x, fy + 2.6, 0x6a5a30, 1, 0.6);
    for (const sx of [-1, 1]) s.line(c + sx * 9, fy - 3, c + sx * 9, fy + 4, 0xc8302a, 1.2); // its red cords
  } else {
    // shreds of the blind still hanging at its sides
    for (const sx of [-1, 1]) s.poly([[c + sx * 13, fy - 3], [c + sx * 10, fy - 3], [c + sx * 11, fy + 3], [c + sx * 13, fy + 1]], 'bm', { flat: 0.6 });
  }
  if (stage >= 3) {
    // the roof on fire: flames up off it, smoke
    for (let k = 0; k < 5; k++) {
      const x = c - 11 + k * 5.4;
      const h = 6 + ((k * 3 + f * 2) % 5);
      s.paint([x - 3, cy - 20 - h, x + 3, cy - 8], (px, py) => {
        const t = (cy - 10 - py) / (h + 10);
        return t > 0 && t < 1 && Math.abs(px - x) < 2.8 * (1 - t) + 0.6;
      }, 'fl', (px, py) => 0.5 + (cy - 10 - py) / (h + 10) * 0.45, { glow: true });
    }
  }
  return s.render();
}

function cartWreck() {
  const s = new HiSprite(60, 78, RAMPS);
  const c = 30;
  // the cabin burnt out and broken open on the road, its roof fallen in, a wheel on its side, the shafts snapped
  s.poly([[c - 15, 16], [c + 13, 18], [c + 16, 50], [c - 14, 52]], 'ch', { flat: 0.55, pat: speckle({ amt: 0.2, seed: 9 }) });
  for (let k = 0; k < 6; k++) s.line(c - 13 + k * 5, 18, c - 11 + k * 5.4, 50, 0x0e0a08, 1, 0.8);
  s.ellipse(c - 20, 38, 9, 9, 'ch', { flat: 0.5 });
  for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; s.line(c - 20, 38, c - 20 + Math.cos(a) * 8, 38 + Math.sin(a) * 8, 0x2a201a, 1); }
  s.tube(c - 6, 52, c - 9, 66, 1.4, 'ch');
  s.tube(c + 7, 52, c + 12, 60, 1.4, 'ch');
  for (let i = 0; i < 7; i++) s.dot(c - 8 + i * 3, 30 + (i % 3) * 5, 0.9, 0xff7020, 0.8); // embers still glowing
  return s.render({ outline: 2 });
}

/** The new behaviours' frames (src/game/enemies/behaviours-*.js, skins.js: fukuoka). */
export function fukuokaNewFoes(add) {
  add('f_chochin_0', lantern('plain'));
  for (let f = 0; f < 2; f++) add(`f_chochin_eye_${f}`, lantern('eye', f));
  for (let f = 0; f < 2; f++) add(`f_chochin_lit_${f}`, lantern('lit', f));
  add('f_chochin_burnt', lantern('burnt'));
  add('f_pole', pole());
  for (let f = 0; f < 4; f++) add(`f_mentaiko_${f}`, mentaikoPair(f));
  for (let f = 0; f < 2; f++) add(`f_mentaiko_one_${f}`, mentaikoOne(f));
  for (let st = 0; st < 4; st++) for (let f = 0; f < 2; f++) add(`f_cart_${st}_${f}`, cart(st, f));
  add('f_cart_wreck', cartWreck());
}
