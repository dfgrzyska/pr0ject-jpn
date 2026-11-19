// Fukuoka's enemies at 540 px (docs/plan-fukuoka.md, section 5.2 and phase 9): tobiume, a flying plum flower (from the
// tale of the plum tree that flew after its master to Dazaifu), turning as it flies, in flocks; a hakata-goma, the
// spinning top of Hakata in its bright rings, thrown on its cord; a fugu out of the fish market, puffing itself up
// into a ball of spines before it shoots; an uso, Dazaifu's whittled wooden bullfinch, its curls of shaving for
// feathers and a cord of its power's colour round its neck; and an archer of Hakata clay doll on a lacquered stand,
// drawing its bow at the ship. Each reads at a glance as something that will hurt (eyes, a scowl, spines, an arrow on
// the string), never as a pickup. Seen from above like every city's, drawn with HiSprite (tools/lib/hisprite.mjs).
import { HiSprite, tones, speckle, mottle, mix2, fur } from '../../lib/hisprite.mjs';
import { fukuokaNewFoes } from './newfoes.mjs';
import { yataiFrames } from './yatai.mjs';

const INK = 0x14101c;
const TAU = Math.PI * 2;
const RAMPS = {
  pw: tones([0xc8b4bc, 0xf6f0ee, 0xffffff]), // a white plum petal
  pr: tones([0x6a0a26, 0xc8304e, 0xff8aa0]), // its deep red heart, a red bud
  ye: tones([0x9a6a08, 0xe8c030, 0xfff0a0]), // the stamens' pollen
  br: tones([0x241610, 0x4e3424, 0x7a5a40]), // a plum twig
  gw: tones([0x5a3418, 0x9a6232, 0xd8a060]), // the top's turned wood
  rr: tones([0x7a1010, 0xd02a24, 0xff7a5a]), // its painted rings: red
  rg: tones([0x0e4a2a, 0x2a9a5a, 0x8ae0a0]), // green
  ry: tones([0x8a6a08, 0xe8c020, 0xfff08a]), // yellow
  rk: tones([0x0e0c12, 0x2a2830, 0x5a5662]), // black
  ir: tones([0x1a1a20, 0x4a4a54, 0x9a9aa8]), // iron
  hm: tones([0x8a7a5a, 0xd8c8a0, 0xfff4d8]), // a hemp cord
  fg: tones([0x3a2e10, 0x8a7a34, 0xd0c070]), // a fugu's back
  fb: tones([0xa8a498, 0xf0ece4, 0xffffff]), // its belly, blown up
  sp: tones([0x5a4a2a, 0xb0a070, 0xf0e8c0]), // its spines
  fn: tones([0x6a6a4a, 0xb8b490, 0xf0ecd8]), // its fins, thin
  uw: tones([0x8a6a3a, 0xd8b884, 0xfff0c8]), // an uso's pale whittled wood
  uk: tones([0x0e0c12, 0x2a2632, 0x4e4a58]), // its black paint
  ur: tones([0x7a1010, 0xd02a24, 0xff7a5a]), // its red paint
  ug: tones([0x0e4a2a, 0x2a9a5a, 0x8ae0a0]), // its green paint
  cl: tones([0xb89a80, 0xf4e4d4, 0xffffff]), // a Hakata doll's white clay face
  ar: tones([0x5a0a10, 0xb8242a, 0xff6a5a]), // its armour, lacquer red
  gd: tones([0x8a5a10, 0xe0b040, 0xfff0a0]), // gold
  hk: tones([0x08060c, 0x1e1a24, 0x44404e]), // its black hair
  bw: tones([0x1a0e0a, 0x4a2a1a, 0x8a5a3a]), // the bow's lacquered wood
  pd: tones([0x1a0a0c, 0x4a1418, 0x9a3a30]), // the stand's black-red lacquer
};
const FILL = { red: 0xd8203a, blue: 0x3a72f0, green: 0x37b35a, purple: 0x9c50f0 };

// ---------------------------------------------------------------- popcorn: tobiume, a plum flower in flight (45 x 45), turning
export function tobiume(f) {
  const s = new HiSprite(45, 45, RAMPS);
  const [cx, cy] = [22.5, 23.5];
  const rot = (f * TAU) / 20; // (a fifth of a turn over the four frames: the five petals come round again)
  // the twig it broke off with, trailing up the screen behind it, a red bud on it
  s.tube(cx + 1, cy - 6, cx + 6, cy - 19, 1.1, 'br');
  s.tube(cx + 4, cy - 14, cx + 9, cy - 16, 0.7, 'br');
  s.ellipse(cx + 6.4, cy - 20, 1.8, 2.2, 'pr', { bias: 0.1 });
  s.ellipse(cx + 9.6, cy - 16.4, 1.4, 1.6, 'pr', { bias: 0.1 });
  // the five petals: round (a plum's, no notch), white, flushed red at their bases
  for (let k = 0; k < 5; k++) {
    const a = rot + (k * TAU) / 5 - TAU / 4;
    s.ellipse(cx + Math.cos(a) * 9, cy + Math.sin(a) * 9, 7.6, 7.6, 'pw', { bias: 0.04, pat: speckle({ amt: 0.05, seed: k }) });
  }
  for (let k = 0; k < 5; k++) {
    const a = rot + (k * TAU) / 5 - TAU / 4;
    s.ellipse(cx + Math.cos(a) * 4.6, cy + Math.sin(a) * 4.6, 3.6, 3.6, 'pr', { flat: 0.78 });
    s.line(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6, cx + Math.cos(a) * 13, cy + Math.sin(a) * 13, 0xe8c8d0, 1, 0.5); // a vein
  }
  // its heart, deep red, the stamens out round it tipped with pollen
  s.ellipse(cx, cy, 5.2, 5.2, 'pr', { bias: 0.06 });
  for (let k = 0; k < 14; k++) {
    const a = rot * 1.5 + (k * TAU) / 14;
    const r = 8.5 + (k % 3);
    s.line(cx + Math.cos(a) * 4.6, cy + Math.sin(a) * 4.6, cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0xf4e8c8, 1, 0.7);
    s.dot(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0.9, 0xf0c020);
  }
  // and in the heart two narrowed eyes and a scowl: it is not a flower to pick
  for (const sx of [-1, 1]) {
    s.ellipse(cx + sx * 2.2, cy + 0.8, 1.6, 1.2, 'W', { flat: 0.95 });
    s.dot(cx + sx * 2, cy + 1.2, 0.8, INK);
    s.line(cx + sx * 0.6, cy - 0.6, cx + sx * 3.8, cy - 1.8, INK, 1.2);
  }
  // a petal or two shed behind it
  for (let k = 0; k < 2; k++) s.ellipse(cx - 12 + k * 22 + Math.sin(f + k) * 2, cy - 16 + k * 4 + f, 1.6, 1.2, 'pw', { flat: 0.8 });
  return s.render();
}

// ---------------------------------------------------------------- diver: hakata-goma, a spinning top (45 x 66) on its cord
export function hakataGoma(f) {
  const s = new HiSprite(45, 66, RAMPS);
  const [cx, cy] = [22.5, 40];
  // the cord it was thrown with, trailing up the screen in loose waves, snapping taut as it is about to rush
  const taut = f === 3;
  let [px, py] = [cx, cy - 4];
  for (let k = 1; k <= 12; k++) {
    const y = cy - 4 - k * 2.6;
    const x = cx + (taut ? k * 0.3 : Math.sin(k * 0.8 + f * 1.4) * (1 + k * 0.35));
    s.line(px, py, x, y, 0xd8c8a0, 1.2, 0.9);
    [px, py] = [x, y];
  }
  // the top seen from above, tilted a little: its rings painted bright on turned wood, an iron rim round them
  const ring = (r, mat) => s.ellipse(cx, cy, r, r * 0.86, mat, { bias: 0.03 });
  ring(17, 'ir');
  ring(15.4, 'rk');
  ring(13.4, 'rr');
  ring(10.6, 'ry');
  ring(8, 'rg');
  ring(5.6, 'rr');
  ring(3.4, 'gw');
  // the spin: streaks of light dragged round each ring, moved on a little every frame
  for (const [r, c] of [[16.2, 0xc8c8d8], [14.4, 0xff9a7a], [12, 0xfff4b0], [9.3, 0xb0f0c0], [6.8, 0xff9a7a]])
    for (let k = 0; k < 3; k++) {
      const a0 = (k * TAU) / 3 + f * 0.7;
      for (let a = a0; a < a0 + 0.9; a += 0.08) s.px(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.86, c, 0.75 - (a - a0) * 0.7);
    }
  // its eyes painted on the yellow ring, glaring, and a frown over them
  for (const sx of [-1, 1]) {
    s.ellipse(cx + sx * 6.6, cy - 4.6, 2.4, 2, 'W', { flat: 0.95 });
    s.dot(cx + sx * 6.2, cy - 4, 1.2, INK);
    s.line(cx + sx * 3.8, cy - 7.4, cx + sx * 9.2, cy - 6, INK, 1.4);
  }
  // the iron spindle's head at its middle, catching the light
  s.ellipse(cx, cy - 0.6, 2, 2, 'ir', { bias: 0.2 });
  s.dot(cx - 0.6, cy - 1.4, 0.7, 0xffffff);
  // the wind of its spinning, arcs at its sides
  for (const sx of [-1, 1]) for (let a = -0.7; a <= 0.7; a += 0.14) s.px(cx + sx * 20 * Math.cos(a), cy + 18 * Math.sin(a) + f, 0xe8f0ff, 0.45);
  return s.render();
}

// ---------------------------------------------------------------- shooter: a fugu (66 x 51), puffing itself into a ball of spines
export function fugu(f) {
  const s = new HiSprite(66, 51, RAMPS);
  const [cx, cy] = [33, 25];
  const r = [11.5, 13, 15, 16][f];
  // its tail fin up the screen, its pectoral fins fanning at its sides
  s.poly([[cx - 2, cy - r + 2], [cx + 2, cy - r + 2], [cx + 6, cy - r - 7], [cx - 6, cy - r - 7]], 'fn', { flat: 0.6 });
  for (const sx of [-1, 1]) {
    const flap = [0, 1.6, 0.6, 2][f] * sx;
    s.poly([[cx + sx * (r - 2), cy + 1], [cx + sx * (r + 6) + flap, cy - 3], [cx + sx * (r + 7) + flap, cy + 4], [cx + sx * (r - 1), cy + 5]], 'fn', { flat: 0.55 });
  }
  // the spines standing out all round it as it swells, their tips sharp
  if (f >= 1)
    for (let k = 0; k < 22; k++) {
      const a = (k / 22) * TAU;
      const [l0, l1] = [r - 1, r + (f >= 2 ? 3.6 : 2)];
      s.line(cx + Math.cos(a) * l0, cy + Math.sin(a) * l0 * 0.92, cx + Math.cos(a) * l1, cy + Math.sin(a) * l1 * 0.92, f === 3 ? 0xff8a5a : 0xd8cc9a, 1.2, 0.95);
    }
  // the body: its white belly bulging out at the sides, the speckled back over it
  s.ellipse(cx, cy, r, r * 0.92, 'fb', { bias: 0.03 });
  s.ellipse(cx, cy - 1.4, r * 0.8, r * 0.74, 'fg', { bias: 0.06, pat: mottle({ amt: 0.12, scale: 3, seed: 5 }) });
  for (let k = 0; k < 11; k++) s.dot(cx - r * 0.55 + ((k * 7.3) % (r * 1.1)), cy - r * 0.6 + ((k * 4.7) % (r * 0.9)), 0.8 + (k % 3) * 0.3, 0x3a2a10, 0.75); // its spots
  // its eyes high on its head, toward the ship, green-gold and glaring; the beak of a mouth, teeth showing
  for (const sx of [-1, 1]) {
    const [ex, ey] = [cx + sx * r * 0.36, cy + r * 0.36];
    s.ellipse(ex, ey, 3.6, 3.4, 'W', { flat: 0.95 });
    s.dot(ex, ey + 0.4, 2.4, 0xe8b020);
    s.dot(ex, ey + 0.6, 1.3, INK);
    s.dot(ex - 0.8, ey - 0.6, 0.5, 0xffffff);
    s.line(ex - sx * 3, ey - 3.6, ex + sx * 3, ey - 2, INK, 1.4);
  }
  s.ellipse(cx, cy + r * 0.84, 3.2, 2, 'K', { flat: 0.3 });
  s.line(cx - 2, cy + r * 0.84, cx + 2, cy + r * 0.84, 0xf4f0e8, 1.2);
  if (f === 3) s.dot(cx, cy + r * 0.84 + 2, 1.6, 0xffc0a0); // (it is about to let go)
  return s.render();
}

// ---------------------------------------------------------------- carrier: an uso (45 x 66), the whittled bullfinch of Dazaifu
export function uso(color, f) {
  const s = new HiSprite(45, 66, RAMPS);
  const rock = [0, 0.8, 0, -0.8][f];
  const cx = 22.5 + rock;
  // it flies head first down the screen. Its tail: a short fan of shavings curled at their ends, black-tipped
  for (let k = -1; k <= 1; k++) {
    s.poly([[cx + k * 2.4 - 2, 22], [cx + k * 2.4 + 2, 22], [cx + k * 5.4 + 2.2, 9], [cx + k * 5.4 - 2.2, 9]], 'uw', { flat: 0.6, pat: fur(1.57, { amt: 0.15, len: 4, seed: 2 + k }) });
    s.ellipse(cx + k * 5.4, 8.6, 2.6, 2, 'uk', { bias: 0.1 });
  }
  // the body: plump, pale wood with its grain
  s.ellipse(cx, 33, 12.5, 14, 'uw', { bias: 0.03, pat: fur(1.57, { amt: 0.1, len: 6, seed: 3 }) });
  // the folded wings: shavings curled out in rows, painted green, their undersides in shadow, black at their tips
  for (const sx of [-1, 1]) {
    s.poly([[cx + sx * 3, 22], [cx + sx * 13, 25], [cx + sx * 14.5, 38], [cx + sx * 8, 44], [cx + sx * 4, 40]], 'ug', { flat: 0.55 });
    for (let row = 0; row < 4; row++) {
      const y = 26 + row * 4.4;
      const x0 = cx + sx * (5 + row * 0.6);
      const x1 = cx + sx * (13.6 - row * 0.8);
      s.line(x0, y, x1, y + 1.6, 0x0e2a18, 1.2, 0.85); // a curl's shadowed underside
      s.line(x0, y - 1, x1, y + 0.6, 0x8ae0a0, 1, 0.6); // its lit edge
      s.dot(x1, y + 1.2, 1.2, 0x2a2632); // the curl's black tip
    }
  }
  // the cord of its power's colour round its neck, glowing, a tassel hanging off it
  s.paint([cx - 10, 41, cx + 10, 49], (x, y) => Math.abs(x - cx) <= 9.5 && Math.abs(y + Math.abs(x - cx) * 0.12 - 45) < 2, 'W', () => 0.9, { glow: true });
  for (let x = cx - 9; x <= cx + 9; x++) for (const dy of [-0.8, 0, 0.8]) s.px(x, 45 + dy - Math.abs(x - cx) * 0.12, FILL[color], 0.95);
  s.line(cx + 5, 45, cx + 7 + rock, 50, FILL[color], 1.4);
  s.dot(cx + 7.2 + rock, 51, 1.6, FILL[color]);
  // the head: round, its black cap, red cheeks and throat, the stubby black beak, eyes that glare
  s.ellipse(cx, 53, 9, 8, 'uw', { bias: 0.04 });
  s.ellipse(cx, 50.4, 8.4, 4.8, 'uk', { bias: 0.08 });
  for (const sx of [-1, 1]) s.ellipse(cx + sx * 5.2, 55, 2.8, 2.4, 'ur', { flat: 0.8 });
  s.ellipse(cx, 58.6, 4, 2.4, 'ur', { flat: 0.8 });
  s.poly([[cx - 2, 58.6], [cx + 2, 58.6], [cx, 62.4]], 'uk', { flat: 0.5 });
  for (const sx of [-1, 1]) {
    s.ellipse(cx + sx * 3.2, 54, 1.8, 1.6, 'W', { flat: 0.95 });
    s.dot(cx + sx * 3.1, 54.5, 1, INK);
    s.line(cx + sx * 1, 52, cx + sx * 5.2, 52.8, INK, 1.3);
  }
  return s.render();
}

// ---------------------------------------------------------------- turret: an archer of Hakata clay (base 57 x 57), its bow (head 51 x 51)
// The doll stands on its lacquered dais, seen from the front and above like the cities' buildings: the white clay
// face with its painted fierce brows, black hair in a warrior's topknot under a white band, armour of red lacquer
// laced with gold, a quiver of arrows on its back. Only its bow turns to the ship, the arrow on the string, held in
// its two white clay hands before its chest.
export function standBase(wreck) {
  const s = new HiSprite(57, 57, RAMPS);
  const c = 28.5;
  // the dais: round, black-red lacquer, a band of gold studs
  s.ellipse(c, 47, 20, 8, 'pd', { bias: 0.05 });
  s.ellipse(c, 45, 19, 7, 'pd', { bias: 0.08 });
  for (let k = 0; k < 18; k++) {
    const a = (k / 18) * TAU;
    s.dot(c + Math.cos(a) * 18.6, 46 + Math.sin(a) * 7.4, 0.7, 0xf0c050);
  }
  if (wreck) {
    // the doll smashed: shards of white clay, red lacquer and gold over the dais, its bow snapped, the quiver spilled
    s.ellipse(c, 44, 8, 3.4, 'K', { flat: 0.2 });
    for (const [x, y, a, m] of [[16, 40, 0.3, 'cl'], [40, 38, 1.4, 'ar'], [20, 48, 2.6, 'cl'], [38, 48, 4.2, 'ar'], [28, 36, 5.1, 'hk'], [30, 50, 2, 'gd'], [44, 44, 3, 'cl']])
      s.poly([[x, y], [x + 5 * Math.cos(a), y + 5 * Math.sin(a)], [x + 3 * Math.cos(a + 1.2), y + 3 * Math.sin(a + 1.2)]], m, { flat: 0.6 });
    for (const [x0, y0, x1, y1] of [[10, 42, 20, 38], [34, 46, 47, 42], [24, 41, 30, 39], [26, 44, 33, 43]]) s.line(x0, y0, x1, y1, 0xc8a070, 1);
    return s.render({ outline: 2 });
  }
  // the legs in their armoured skirt, standing on the dais, gold lacing across it
  s.poly([[c - 8, 32], [c + 8, 32], [c + 10, 44], [c - 10, 44]], 'ar', { flat: 0.55 });
  for (let y = 34; y < 44; y += 3) s.line(c - 9, y, c + 9, y, 0xe0b040, 1, 0.7);
  // the quiver on its back, the arrows' white feathers over its right shoulder
  s.tube(c + 9, 10, c + 6, 26, 2.2, 'bw');
  for (let k = 0; k < 4; k++) s.line(c + 8 + k * 0.8, 6 + k * 0.4, c + 8.6 + k * 0.8, 10, 0xf4f0e8, 1);
  // the body: the breastplate, the great shoulder plates out to the sides
  s.ellipse(c, 26, 9.5, 8.5, 'ar', { bias: 0.05 });
  for (const sx of [-1, 1]) {
    s.poly([[c + sx * 6, 18], [c + sx * 15, 20], [c + sx * 15, 31], [c + sx * 7, 29]], 'ar', { flat: 0.6 });
    for (let y = 21; y < 31; y += 2.5) s.line(c + sx * 7, y, c + sx * 14.6, y + 0.6, 0xe0b040, 1, 0.75);
  }
  // the head: white clay face, fierce painted brows and eyes, a red mouth set hard; hair, white band and topknot
  s.ellipse(c, 13, 6.2, 6.6, 'cl', { bias: 0.04 });
  s.ellipse(c, 8.6, 6.4, 3.6, 'hk', { bias: 0.08 });
  s.ellipse(c, 3.6, 2.6, 2.4, 'hk', { bias: 0.1 });
  s.line(c - 6.2, 10, c + 6.2, 10, 0xf4f0e8, 1.4);
  for (const sx of [-1, 1]) {
    s.line(c + sx * 1, 11.6, c + sx * 4.6, 12.4, INK, 1.4);
    s.ellipse(c + sx * 2.6, 13.6, 1.4, 0.9, 'W', { flat: 0.95 });
    s.dot(c + sx * 2.4, 13.8, 0.7, INK);
  }
  s.line(c - 1.6, 17, c + 1.6, 17, 0xc02a2a, 1.2);
  return s.render({ outline: 2 });
}

export function archer(i) {
  const s = new HiSprite(51, 51, RAMPS);
  const c = 25.5;
  const a = (i / 16) * TAU;
  const [dx, dy] = [-Math.sin(a), Math.cos(a)];
  const [px, py] = [-dy, dx];
  const at = (along, across) => [c + dx * along + px * across, c + dy * along + py * across];
  // the bow: long and lacquered, bent across the aim, gilt at its tips; the string drawn back to the right hand
  const bow = (t) => at(9 - 5 * t * t, t * 19);
  for (let t = -1; t < 0.999; t += 0.05) {
    const [x0, y0] = bow(t);
    const [x1, y1] = bow(t + 0.05);
    s.tube(x0, y0, x1, y1, 1.4 - Math.abs(t) * 0.5, 'bw');
  }
  for (const t of [-1, 1]) {
    const [x, y] = bow(t);
    s.dot(x, y, 1.2, 0xf0c050);
  }
  const [hx, hy] = at(-4, 0); // the drawing hand
  for (const t of [-1, 1]) {
    const [x, y] = bow(t);
    s.line(x, y, hx, hy, 0xf0ecd8, 1, 0.9);
  }
  // the arrow on the string: its shaft, its white fletching, its steel head bright toward the ship
  const [ax0, ay0] = at(-5, 0);
  const [ax1, ay1] = at(17, 0);
  s.line(ax0, ay0, ax1, ay1, 0xd8b080, 1.4);
  s.poly([at(22, 0), at(17, -2.2), at(17, 2.2)], 'ir', { flat: 0.85 });
  for (const k of [-1, 1]) {
    const [fx, fy] = at(-3, k * 2.2);
    const [gx, gy] = at(0, k * 0.6);
    s.line(fx, fy, gx, gy, 0xf4f0e8, 1.2);
  }
  // the two white clay hands: one round the grip, one at the string
  const [gx, gy] = at(9, 0);
  s.ellipse(gx, gy, 2.6, 2.6, 'cl', { bias: 0.08 });
  s.ellipse(hx, hy, 2.4, 2.4, 'cl', { bias: 0.08 });
  return s.render();
}

/** Every frame, under the names the skins use (src/game/skins.js: fukuoka). */
export function fukuokaEnemies(add) {
  for (let f = 0; f < 4; f++) {
    add(`f_tobiume_${f}`, tobiume(f));
    add(`f_goma_${f}`, hakataGoma(f));
    add(`f_fugu_${f}`, fugu(f));
    for (const c of ['red', 'blue', 'green', 'purple']) add(`f_uso_${c}_${f}`, uso(c, f));
  }
  add('f_dai_base', standBase(false));
  add('f_dai_wreck', standBase(true));
  for (let i = 0; i < 16; i++) add(`f_ningyo_${i}`, archer(i));
  fukuokaNewFoes(add); // (the lanterns on their ropes, the mentaiko, the oboro-guruma: newfoes.mjs)
  yataiFrames(add); // the miniboss, YATAI-OBAKE (yatai.mjs)
}
export const FUKUOKA_PORTRAITS = ['yt_idle_0'];
