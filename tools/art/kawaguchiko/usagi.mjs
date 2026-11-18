// KACHI-KACHI USAGI, Kawaguchiko's miniboss (docs/plan-kawaguchiko.md, 6.1; the fight: src/game/enemies/
// kawaguchiko-usagi.js). The white hare of the old tale in a red headband, sitting in his wooden boat on the lake,
// a striker and a flint in his paws. Seen from above, the boat's bow down the screen (towards the ship), the hare
// facing the same way, his long ears laid back along the boat. Poses: at rest (an ear twitching), striking sparks,
// throwing a burning bundle of brushwood, rowing (four strokes), beating the water with an oar, worn out; the
// empty boat; leaping, and waving from the ropeway's gondola as it carries him off. The tanuki's boats of mud with a
// clay hare in each (soft, soaking, crumbling), the bundles burning on the water, the crock of red pepper paste and
// its flakes.
import { HiSprite, tones, speckle, mottle, mix2, fur } from '../../lib/hisprite.mjs';

const INK = 0x14101c;
const RAMPS = {
  w: tones([0x5a3a1c, 0x9a6a3a, 0xd8a868]), // the boat's cedar boards
  h: tones([0x9a94a8, 0xeceaf2, 0xffffff]), // the hare's white fur
  r: tones([0x7a0e14, 0xd02a30, 0xff7a6a]), // his red headband
  p: tones([0x9a4a5a, 0xe08a9a, 0xffc8d0]), // pink: the insides of his ears, his nose
  m: tones([0x3a2614, 0x6a4a2a, 0x9a7448]), // wet mud
  c: tones([0x6a4a30, 0xa8784a, 0xd8a878]), // clay, the doll's
  s: tones([0x4a3418, 0x7a5a2c, 0xb08a4a]), // brushwood
  f: [0xa0400a, 0xe06a10, 0xff9a30, 0xffd070, 0xffffff], // flame
  g: tones([0x3a4a5a, 0x8a98a8, 0xd8e0e8]), // the gondola's paint
  o: tones([0x6a5a3a, 0xb8a06a, 0xe8d8a8]), // the oars
  k: tones([0x2a1a14, 0x6a3a22, 0xa8683a]), // the crock's dark glaze
  q: tones([0x8a1006, 0xe0301a, 0xff8a4a]), // red pepper
  n: tones([0x6a5a30, 0xb09a5a, 0xe0d098]), // straw rope
};
const W = 66;
const H = 102;
const CX = 33;
const grain = () => ({ pat: mix2(fur(Math.PI / 2, { amt: 0.16, len: 12, w: 1.4, gap: 0.05 }), speckle({ amt: 0.08 })) });
const furry = (a) => ({ pat: fur(a, { amt: 0.12, len: 3, seed: 5 }) });

/** The wooden boat, bow down: its planks, the gunwale, two thwarts, water beading on it. */
function boat(s, { mud = false, crumble = 0 } = {}) {
  const mat = mud ? 'm' : 'w';
  s.paint([CX - 18, 6, CX + 18, 98], (x, y) => {
    const t = (y - 8) / 88; // 0 stern .. 1 bow
    if (t < 0 || t > 1) return false;
    const half = 15 * (t < 0.08 ? 0.75 + t * 3 : t > 0.7 ? Math.sqrt(Math.max(0, (1 - t) / 0.3)) : 1);
    if (crumble && ((x * 7 + y * 3) % 13) < crumble * 4 && Math.abs(x - CX) > half - 4) return false; // (bits fallen off)
    return Math.abs(x - CX) <= half;
  }, mat, (x) => 0.38 + 0.5 * Math.max(0, 1 - Math.abs(x - CX + 5) / 18), mud ? { pat: mottle({ amt: 0.3, scale: 3, seed: 3 }) } : grain());
  // the hollow inside: darker, its floorboards
  s.shade([CX - 13, 14, CX + 13, 88], (x, y) => {
    const t = (y - 8) / 88;
    const half = 11 * (t > 0.7 ? Math.sqrt(Math.max(0, (1 - t) / 0.3)) : 1);
    return Math.abs(x - CX) < half && y > 14 && y < 86;
  }, -0.26);
  if (!mud) {
    for (const y of [34, 66]) s.line(CX - 13, y, CX + 13, y, 0x4a2e14, 2); // the thwarts
    for (let y = 18; y < 84; y += 6) s.line(CX - 1, y, CX + 1, y + 3, 0x5a3a1c, 1, 0.5);
    for (const [x, y] of [[CX - 15, 30], [CX + 15, 50], [CX - 14, 72]]) s.dot(x, y, 0.9, 0xd8f0ff, 0.8);
  } else for (const [x, y] of [[CX - 10, 30], [CX + 8, 60], [CX - 6, 76]]) s.dot(x, y, 2, 0x2a1a0c, 0.7); // pits where it is going soft
}

/** The hare, sitting at the middle thwart facing down the boat. pose: rest|strike|throw|row|tired|leap. */
function hare(s, pose, f = 0, y0 = 50) {
  const tired = pose === 'tired';
  // his ears, long, laid back along the boat (towards the stern); one twitching at rest; drooping when worn out
  for (const sx of [-1, 1]) {
    const tw = pose === 'rest' && f === 1 && sx > 0 ? 3 : 0;
    const [ex, ey] = tired ? [CX + sx * 16, y0 - 6] : [CX + sx * (5 + tw), y0 - 30];
    s.tube(CX + sx * 4, y0 - 4, ex, ey, 3.4, 'h', { rb: 2.6, ...furry(-Math.PI / 2) });
    s.tube(CX + sx * 4, y0 - 6, ex, ey + (tired ? 0 : 3), 1.5, 'p', { rb: 1.2, bias: 0.1 });
  }
  // the body, round and white, a little shadow under it
  s.ellipse(CX, y0 + 2, 11, 10, 'h', { bias: 0.04, ...furry(Math.PI / 2) });
  // the head towards us, the red headband round it, its ends flying back
  s.ellipse(CX, y0 + 11, 9, 8, 'h', { bias: 0.06, ...furry(Math.PI / 2) });
  s.paint([CX - 10, y0 + 5, CX + 10, y0 + 9], (x, y) => ((x - CX) / 9.4) ** 2 + ((y - y0 - 11) / 8.4) ** 2 <= 1 && y > y0 + 5.5 && y < y0 + 8.5, 'r', () => 0.6);
  s.tube(CX + 7, y0 + 6, CX + 14, y0 - 2 + f, 1.2, 'r', { rb: 0.8 });
  s.tube(CX + 8, y0 + 7, CX + 15, y0 + 3 - f, 1.1, 'r', { rb: 0.7 });
  // the face: red eyes (white hares have them), a pink nose, whiskers; worn out: eyes shut, tongue out, sweat
  for (const sx of [-1, 1]) {
    if (tired) s.line(CX + sx * 4 - 1.5, y0 + 11, CX + sx * 4 + 1.5, y0 + 12, INK, 1);
    else {
      s.dot(CX + sx * 4, y0 + 11, 1.6, 0xc8202a);
      s.dot(CX + sx * 4 - 0.5, y0 + 10.5, 0.6, 0xffffff);
    }
    for (const dy of [-0.8, 0.8]) s.line(CX + sx * 2, y0 + 15, CX + sx * 9, y0 + 15 + dy * 2, 0x9a94a8, 1, 0.7);
  }
  s.ellipse(CX, y0 + 15, 1.6, 1.2, 'p', { flat: 0.7 });
  if (tired) {
    s.ellipse(CX, y0 + 18, 1.4, 1.8, 'p', { flat: 0.5 });
    for (const [x, y] of [[CX - 11, y0 + 4], [CX + 12, y0 + 9]]) s.ellipse(x, y + f, 1, 1.6, 'C', { flat: 0.8 });
  }
  // the paws
  if (pose === 'strike') {
    // striker and flint knocked together in front of him, sparks flying
    s.ellipse(CX - 3, y0 + 20, 2.4, 2, 'h', { flat: 0.7 });
    s.ellipse(CX + 3, y0 + 20, 2.4, 2, 'h', { flat: 0.7 });
    s.poly([[CX - 5, y0 + 21], [CX - 1, y0 + 20], [CX - 2, y0 + 23]], 'E', { flat: 0.6 }); // the flint
    s.line(CX + 1, y0 + 22, CX + 6, y0 + 22, 0x3a3a40, 2); // the steel striker
    if (f === 1) for (let i = 0; i < 7; i++) s.ellipse(CX + Math.cos(i * 0.9 + 0.4) * (5 + i % 3 * 2), y0 + 24 + Math.sin(i * 0.9) * 4, 0.9, 0.9, 'f', { flat: 0.9, glow: true });
  } else if (pose === 'throw') {
    // one arm up and back with a bundle of brushwood alight
    s.tube(CX + 8, y0 + 2, CX + 16, y0 - 12, 2.4, 'h', { rb: 2 });
    s.tube(CX + 12, y0 - 10, CX + 22, y0 - 18, 2.6, 's', { rb: 2.2, ...grain() });
    for (let i = 0; i < 4; i++) s.ellipse(CX + 20 + i, y0 - 22 - i * 2, 2.4 - i * 0.4, 3 - i * 0.5, 'f', { flat: 0.6 + i * 0.1, glow: true });
    s.ellipse(CX - 6, y0 + 18, 2.4, 2, 'h', { flat: 0.7 });
  } else if (pose === 'row') {
    // the oars, pulled: their looms over the gunwales, the blades in the water swinging fore and aft
    const sw = [-12, -4, 12, 4][f];
    for (const sx of [-1, 1]) {
      s.tube(CX + sx * 6, y0 + 10, CX + sx * 30, y0 + 6 + sw, 1.1, 'o');
      s.ellipse(CX + sx * 30, y0 + 6 + sw, 2.4, 4.4, 'o', { flat: 0.55 });
      s.ellipse(CX + sx * 6, y0 + 12, 2.2, 2, 'h', { flat: 0.72 });
    }
  } else if (pose === 'slam') {
    // one oar in both paws: f 0 swung up over his head (its blade high, nearer us, over the stern), f 1 brought down
    // on the water before the bow in a splash
    const [bx, by] = f ? [CX + 20, y0 + 42] : [CX + 15, y0 - 24];
    s.tube(CX + 3, y0 + 12, bx, by, f ? 1.2 : 1.7, 'o');
    s.ellipse(bx, by, f ? 3 : 4.6, f ? 5 : 7.4, 'o', { flat: f ? 0.5 : 0.7 });
    for (const sx of [-1, 1]) s.ellipse(CX + 3 + sx * 3 + (f ? 1 : 0), y0 + (f ? 17 : 13), 2.5, 2.1, 'h', { flat: 0.74 });
    if (f) {
      // the splash: drops thrown out round the blade, the water white over it
      s.dot(bx, by, 5.4, 0xe8f4ff, 0.4);
      for (let i = 0; i < 11; i++) {
        const a = (i / 11) * Math.PI * 2 + 0.3;
        const r = 6.5 + (i % 3) * 1.6;
        s.dot(bx + Math.cos(a) * r, by + Math.sin(a) * r * 0.75, 0.9 + (i % 2) * 0.5, 0xf4faff, 0.95);
      }
    }
  } else if (pose === 'rest' || tired) {
    for (const sx of [-1, 1]) s.ellipse(CX + sx * 6, y0 + 18, 2.4, 2, 'h', { flat: 0.7 });
  }
}

/** The hare in his boat: pose and frame. */
export function usagi(pose, f = 0) {
  const s = new HiSprite(W, H, RAMPS);
  boat(s);
  if (pose !== 'row') for (const sx of pose === 'slam' ? [-1] : [-1, 1]) s.tube(CX + sx * 10, 22, CX + sx * 9, 84, 1, 'o', { bias: 0.1 }); // (the oars shipped along the sides; beating the water, he has the other)
  if (pose === 'empty') return s.render();
  hare(s, pose, f);
  return s.render();
}

/** The hare in the air, leaping up out of the boat (seen from above: stretched, ears streaming). */
export function leap() {
  const s = new HiSprite(45, 66, RAMPS);
  for (const sx of [-1, 1]) s.tube(22.5 + sx * 3, 30, 22.5 + sx * 6, 4, 3, 'h', { rb: 2.2, ...furry(-Math.PI / 2) });
  s.ellipse(22.5, 36, 9, 13, 'h', { bias: 0.04, ...furry(Math.PI / 2) });
  s.ellipse(22.5, 50, 7.5, 7, 'h', { bias: 0.06 });
  s.line(16, 47, 29, 47, 0xd02a30, 2);
  for (const sx of [-1, 1]) {
    s.dot(22.5 + sx * 3.4, 50, 1.4, 0xc8202a);
    s.tube(22.5 + sx * 8, 34, 22.5 + sx * 16, 22, 2, 'h', { rb: 1.6 }); // arms up for the gondola
  }
  s.ellipse(22.5, 54, 1.4, 1, 'p', { flat: 0.7 });
  return s.render();
}

/** The ropeway's gondola carrying him off, the hare at its window waving (two frames). */
export function gondola(f) {
  const s = new HiSprite(51, 51, RAMPS);
  const c = 25.5;
  s.tube(c, 2, c, 12, 1.4, 'E'); // the hanger from the cable
  s.poly([[8, 12], [43, 12], [46, 46], [5, 46]], 'g', { flat: 0.55, pat: speckle({ amt: 0.08 }) });
  s.poly([[10, 14], [41, 14], [41, 20], [10, 20]], 'g', { flat: 0.75 }); // its roof's edge lit
  s.poly([[10, 24], [41, 24], [42, 36], [9, 36]], 'C', { flat: 0.4 }); // the window
  // the hare in the window, one paw waving
  s.ellipse(c, 33, 7, 6, 'h', { bias: 0.06 });
  for (const sx of [-1, 1]) s.tube(c + sx * 3, 29, c + sx * 5, 20, 2, 'h', { rb: 1.4 });
  s.line(c - 6, 30, c + 6, 30, 0xd02a30, 1.5);
  for (const sx of [-1, 1]) s.dot(c + sx * 2.6, 33, 1, 0xc8202a);
  const wv = f ? -3 : 2;
  s.tube(c + 7, 34, c + 14 + wv, 22, 1.8, 'h', { rb: 1.6 });
  s.ellipse(c + 14 + wv, 21, 2.2, 2, 'h', { flat: 0.75 });
  return s.render();
}

/** A boat of mud with a clay hare in it: the tanuki's trick (k: 0 whole, 1 soaking, 2 crumbling). */
export function dorobune(k) {
  const s = new HiSprite(W, H, RAMPS);
  boat(s, { mud: true, crumble: k });
  // the clay hare, crude: a lump with two ears, a band of red paint, eyes poked in
  const y0 = 50 + k * 2;
  for (const sx of [-1, 1]) s.tube(CX + sx * 4, y0 - 4, CX + sx * (6 + k * 2), y0 - 26 + k * 6, 3, 'c', { rb: 2.4 });
  s.ellipse(CX, y0 + 4, 11, 11, 'c', { bias: 0.04, pat: mottle({ amt: 0.2, scale: 3, seed: 8 }) });
  s.line(CX - 9, y0 + 5, CX + 9, y0 + 5, 0xa83a2a, 2);
  for (const sx of [-1, 1]) s.dot(CX + sx * 4, y0 + 9, 1.4, 0x2a1a0c);
  if (k >= 1) for (const [x, y] of [[CX - 8, y0 + 14], [CX + 9, y0 - 2], [CX, y0 + 20]]) s.dot(x, y, 1.6 + k * 0.4, 0x3a2614); // it runs
  if (k === 2) s.line(CX - 6, y0 - 2, CX + 4, y0 + 10, 0x2a1a0c, 1.5); // and cracks
  return s.render();
}

/** A bundle of brushwood burning on the water (two frames of flame). */
export function shiba(f) {
  const s = new HiSprite(36, 36, RAMPS);
  for (const [x0, y0, x1, y1] of [[8, 22, 28, 18], [9, 17, 27, 24], [10, 20, 26, 20]]) s.tube(x0, y0, x1, y1, 1.6, 's', { ...grain() });
  s.line(17, 16, 19, 25, 0xb8a060, 1.5); // the binding
  for (let i = 0; i < 5; i++) s.ellipse(12 + i * 3, 15 - (i % 2) * 3 - f * 1.5, 2.6, 4 + (i % 2) * 2, 'f', { flat: 0.6 + (i % 3) * 0.12, glow: true });
  return s.render();
}

/** The crock of red pepper paste he throws (the tale's "medicine" for the burnt tanuki): a small dark-glazed jar seen
 * from above, the paste red in its mouth, a straw rope round its neck. */
export function tsubo() {
  const s = new HiSprite(33, 33, RAMPS);
  s.ellipse(16.5, 18, 12, 11, 'k', { bias: 0.08, pat: speckle({ amt: 0.06 }) });
  s.dot(12, 13, 2.2, 0xd8a070, 0.45); // the glaze's shine
  s.ellipse(16.5, 15, 7.4, 6.6, 'n', { pat: fur(0, { amt: 0.2, len: 2, seed: 9 }) }); // the rope round the neck
  s.ellipse(16.5, 15, 5.6, 5, 'k', { flat: 0.3 }); // the rim
  s.ellipse(16.5, 15, 4.2, 3.6, 'q', { bias: 0.1, pat: mottle({ amt: 0.25, scale: 1.5, seed: 4 }) }); // the paste
  for (const [x, y] of [[15, 14], [18, 16], [17, 13]]) s.dot(x, y, 0.6, 0xffd0a0, 0.9); // its seeds
  s.tube(22, 12, 28, 6, 1, 'n'); // the rope's ends
  s.tube(22, 13, 29, 11, 1, 'n');
  return s.render();
}

/** A flake of red pepper flying (a bullet of his): a curled sliver in a hot glow, so that it reads as a shot over
 * the maple leaves drifting on the lake; two turns of it. */
export function flake(f) {
  const s = new HiSprite(27, 27, RAMPS);
  s.ellipse(13.5, 13.5, 8.6, 8.6, 'f', { flat: 0.62, glow: true }); // the glow, hot orange to its pale core
  s.ellipse(13.5, 13.5, 5.6, 5.6, 'f', { flat: 0.86, glow: true });
  // a long curled sliver of the pod's skin: across, or end on as it turns over
  if (f) s.poly([[9, 6], [15, 5], [19, 10], [18, 19], [12, 21], [9, 14]], 'q', { flat: 0.4 });
  else s.poly([[5, 17], [8, 10], [15, 6], [22, 8], [17, 12], [11, 15], [7, 20]], 'q', { flat: 0.4 });
  if (f) s.line(11, 7, 16, 6, 0xffb070, 1.2, 0.95);
  else s.line(8, 13, 15, 8, 0xffb070, 1.2, 0.95); // its lit edge
  s.dot(13, 13, 1, 0xfff0c8); // a seed stuck to it
  return s.render();
}

/** Every frame of the fight, for the city's atlas (enemies.mjs). */
export function usagiFrames(add) {
  for (const f of [0, 1]) add(`k_usagi_rest_${f}`, usagi('rest', f));
  for (const f of [0, 1]) add(`k_usagi_strike_${f}`, usagi('strike', f));
  add('k_usagi_throw', usagi('throw'));
  for (let f = 0; f < 4; f++) add(`k_usagi_row_${f}`, usagi('row', f));
  for (const f of [0, 1]) add(`k_usagi_tired_${f}`, usagi('tired', f));
  add('k_usagi_empty', usagi('empty'));
  add('k_usagi_leap', leap());
  for (const f of [0, 1]) add(`k_gondola_${f}`, gondola(f));
  for (const k of [0, 1, 2]) add(`k_dorobune_${k}`, dorobune(k));
  for (const f of [0, 1]) add(`k_shiba_${f}`, shiba(f));
  for (const f of [0, 1]) add(`k_usagi_slam_${f}`, usagi('slam', f));
  add('k_tsubo', tsubo());
  for (const f of [0, 1]) add(`k_flake_${f}`, flake(f));
}
