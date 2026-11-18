// Onomichi's enemies at 540 px (docs/plan-onomichi.md, section 5 and phase 8): swallows of summer, nesting under the
// arcade's eaves, in flocks; a debera, the flatfish Onomichi dries on strings, come alive and gliding flat as a kite;
// a furin, a glass wind bell with an eye in its glass, ringing before it shoots; an onigawara, the demon tile on a
// roof's ridge, turning its scowl to the ship and glowing in its mouth before it fires; a firework shell with its fuse
// lit, a band in the colour of its power. Each reads at a glance as something that will hurt (eyes, a scowl, a
// burning fuse), never as a pickup. Seen from above like every city's, drawn with HiSprite (tools/lib/hisprite.mjs).
import { HiSprite, tones, speckle, mottle, mix2, fur } from '../../lib/hisprite.mjs';
import { nekomataFrames } from './nekomata.mjs';
import { funayureiFrames } from './funayurei.mjs';

const INK = 0x14101c;
const TAU = Math.PI * 2;
const RAMPS = {
  n: tones([0x0e1428, 0x1e2a4a, 0x46608a]), // a swallow's glossy blue-black
  r: tones([0x7a1a14, 0xc8402a, 0xf08a5a]), // its rust-red throat
  b: tones([0xb0a898, 0xece6da, 0xffffff]), // its white breast
  d: tones([0x6a4a2a, 0xb08a5a, 0xe0c494]), // dried flatfish, golden brown
  e: tones([0x8a7a5a, 0xd8ccb0, 0xfff8e8]), // its pale underside, the fins' fringe
  g: tones([0x1e4a6a, 0x5aa0c8, 0xc8ecff]), // the bell's glass, the summer sky in it
  k: tones([0x8a1a20, 0xe0402a, 0xff9a6a]), // a goldfish painted on the glass
  p: tones([0xa89a7a, 0xf0e8d0, 0xffffff]), // the paper strip
  c: tones([0x3a3e46, 0x6a707a, 0xa8b0bc]), // fired clay tile, silver-grey
  t: tones([0x26282e, 0x464a54, 0x7a808a]), // the roof's tiles, dark
  s: tones([0x6a4a24, 0xa87a40, 0xe0b878]), // a firework shell's kraft paper
  f: tones([0x9a3a08, 0xf0901a, 0xfff0a0]), // the fuse's sparks
};
const FILL = { red: 0xd8203a, blue: 0x3a72f0, green: 0x37b35a, purple: 0x9c50f0 };

// ---------------------------------------------------------------- popcorn: tsubame, a swallow (45 x 45), its long wings beating
export function tsubame(f) {
  const s = new HiSprite(45, 45, RAMPS);
  const cx = 22.5;
  const beat = [1, 0.8, 0.55, 0.8][f];
  // the wings: long, swept, pointed, dark above with a blue sheen (up and down by turns, foreshortened)
  for (const sx of [-1, 1]) {
    const tip = [cx + sx * 21 * beat, 14 + (1 - beat) * 6];
    s.poly([[cx + sx * 2, 20], [cx + sx * 4, 26], tip, [cx + sx * 15 * beat, 14 + (1 - beat) * 4]], 'n', { flat: 0.55, pat: fur(sx > 0 ? 0.3 : 2.8, { amt: 0.12, len: 5, seed: 3 }) });
    s.line(cx + sx * 4, 22, tip[0], tip[1], 0x5a7aaa, 1, 0.5); // the sheen along the leading edge
  }
  // the forked tail at the top (it flies down the screen), its streamers
  for (const sx of [-1, 1]) s.poly([[cx, 14], [cx + sx * 3, 14], [cx + sx * 6 + (f % 2) * sx, 1], [cx + sx * 4.4, 2]], 'n', { flat: 0.5 });
  // the body: dark back, the white breast, the rust-red throat and forehead at the bottom, a sharp black eye
  s.ellipse(cx, 22, 4.6, 9, 'n', { bias: 0.04 });
  s.ellipse(cx, 25, 3.2, 5.6, 'b', { flat: 0.6 });
  s.ellipse(cx, 31, 3.4, 3, 'r', { bias: 0.1 });
  s.ellipse(cx, 34, 2.6, 2, 'n', { bias: 0.1 });
  for (const sx of [-1, 1]) s.dot(cx + sx * 1.8, 33.6, 0.9, 0xfff0d0);
  s.poly([[cx - 1, 35.6], [cx + 1, 35.6], [cx, 37.6]], 'K', { flat: 0.3 });
  return s.render();
}

// ---------------------------------------------------------------- diver: a debera (45 x 66), a dried flatfish come alive, gliding flat
export function debera(f) {
  const s = new HiSprite(45, 66, RAMPS);
  const cx = 22.5;
  const ripple = (y) => Math.sin(y * 0.35 + f * (TAU / 4)) * 1.6; // (the fringe of fin rippling down its edges)
  // the fringe of fins all round, pale, rippling; then the flat oval body, golden, dried in the sun, spotted
  s.paint([2, 6, 43, 58], (x, y) => {
    const t = (y - 8) / 48;
    if (t < 0 || t > 1) return false;
    const w = 19 * Math.sin(Math.PI * Math.min(1, t * 0.95 + 0.04)) + ripple(y);
    return Math.abs(x - cx) < w;
  }, 'e', () => 0.6, { pat: fur(0, { amt: 0.25, len: 2, seed: 2 }) });
  s.paint([4, 8, 41, 56], (x, y) => {
    const t = (y - 10) / 44;
    if (t < 0 || t > 1) return false;
    return Math.abs(x - cx) < 15 * Math.sin(Math.PI * Math.min(1, t * 0.95 + 0.04));
  }, 'd', (x, y) => 0.4 + 0.4 * (1 - Math.abs(x - cx + 5) / 18), { pat: mix2(mottle({ amt: 0.22, scale: 4, seed: 5 }), speckle({ amt: 0.15, dark: 0.12, seed: 6 })) });
  for (let k = 0; k < 7; k++) s.dot(cx - 9 + ((k * 7) % 18), 16 + k * 5, 1.2 + (k % 3) * 0.4, 0x5a3a1a, 0.6); // darker spots
  s.line(cx, 14, cx, 50, 0x8a6a3a, 1, 0.6); // the line down its middle
  // the tail at the top, its spread fan
  s.poly([[cx - 2, 8], [cx + 2, 8], [cx + 7 + ripple(4), 1], [cx - 7 + ripple(4), 1]], 'e', { flat: 0.55 });
  // its head at the bottom: both eyes on one side (a flatfish), wide awake and glaring yellow, the little mouth
  for (const [x, y] of [[cx - 5, 48], [cx + 1, 50.5]]) {
    s.ellipse(x, y, 2.6, 2.4, 'K', { flat: 0.3 });
    s.dot(x, y, 1.6, 0xf0d040);
    s.dot(x + 0.3, y + 0.3, 0.8, INK);
  }
  s.line(cx - 3, 55, cx + 2, 54, 0x3a2410, 1.5);
  // the string it hung from, snapped, trailing from its tail
  s.line(cx, 1, cx + 3 + (f % 2), -2, 0xd8ccb0, 1, 0.8);
  return s.render();
}

// ---------------------------------------------------------------- shooter: a furin (66 x 51), a glass wind bell with an eye, its paper strip
export function furin(f) {
  const s = new HiSprite(66, 51, RAMPS);
  const cx = 33;
  const swing = [0, 1.6, 0, -1.6][f];
  // the cord it hung from, frayed off at the top
  s.line(cx, 1, cx, 8, 0xc8302a, 1.5);
  // the glass dome: clear, the sky in it, a rim of thicker glass at its mouth
  s.ellipse(cx, 20, 15, 13, 'g', { bias: 0.02, glow: false });
  s.paint([cx - 15, 8, cx + 15, 34], (x, y) => Math.abs(x - cx) < 15 && y > 30 && y < 34 && ((x - cx) / 15) ** 2 + ((y - 20) / 13) ** 2 < 1.15, 'g', () => 0.95);
  // goldfish painted on the glass, and its one great eye looking out of it at the ship
  for (const [x, y, a] of [[cx - 9, 16, 0.4], [cx + 9, 24, -2.6]]) {
    s.ellipse(x, y, 3, 2, 'k', { flat: 0.6 });
    s.poly([[x - 3 * Math.cos(a), y - 3 * Math.sin(a)], [x - 6 * Math.cos(a) - 2 * Math.sin(a), y - 6 * Math.sin(a) + 2 * Math.cos(a)], [x - 6 * Math.cos(a) + 2 * Math.sin(a), y - 6 * Math.sin(a) - 2 * Math.cos(a)]], 'k', { flat: 0.55 });
  }
  const blink = f === 2;
  s.ellipse(cx, 21, 6, blink ? 1.4 : 5, 'W', { flat: 0.95 });
  if (!blink) {
    s.dot(cx, 22.5, 3.2, 0x2a3a8a);
    s.dot(cx, 22.5, 1.6, INK);
    s.dot(cx - 1.4, 21, 0.9, 0xffffff);
  }
  s.line(cx - 6.5, 16.5, cx + 6.5, 16.5, INK, 1.2); // a scowling brow
  // the clapper and the paper strip hanging below, fluttering
  s.line(cx, 30, cx + swing * 0.5, 36, 0x6a6a74, 1.5);
  s.dot(cx + swing * 0.5, 36.5, 1.6, 0x8a8a94);
  s.poly([[cx - 4 + swing, 38], [cx + 4 + swing, 38], [cx + 4 + swing * 2, 50], [cx - 4 + swing * 2, 50]], 'p', { flat: 0.8 });
  for (let k = 0; k < 3; k++) s.line(cx - 1 + swing * 1.5, 41 + k * 3, cx + 1 + swing * 1.5, 41 + k * 3, 0x3a3a50, 1, 0.7); // a line of verse brushed on it
  // ringing: the sound in arcs either side
  if (f === 3) for (const sx of [-1, 1]) for (let k = 0; k < 2; k++) for (let a = -0.6; a <= 0.6; a += 0.15) s.px(cx + sx * (19 + k * 4) * Math.cos(a), 20 + (19 + k * 4) * Math.sin(a), 0xe8f8ff, 0.8);
  return s.render();
}

// ---------------------------------------------------------------- carrier: a firework shell (45 x 66), its fuse burning, a band of its colour
export function hanabidama(color, f) {
  const s = new HiSprite(45, 66, RAMPS);
  const cx = 22.5;
  // the shell: a ball of kraft paper pasted in strips, the fuse coming out of its top, the band of its power glowing
  s.ellipse(cx, 38, 17, 17, 's', { bias: 0.04, pat: mix2(fur(0.7, { amt: 0.16, len: 6, seed: 3 }), speckle({ amt: 0.1, seed: 4 })) });
  for (let k = -2; k <= 2; k++) {
    const h = Math.sqrt(Math.max(0, 16 ** 2 - (k * 6) ** 2)); // (the strips of paper pasted round it, inside its outline)
    s.line(cx + k * 6, 38 - h, cx + k * 6, 38 + h, 0x6a4a24, 1, 0.45);
  }
  s.paint([cx - 17, 33, cx + 17, 43], (x, y) => ((x - cx) / 17) ** 2 + ((y - 38) / 17) ** 2 < 1 && Math.abs(y - 38) < 3.4, 'W', () => 0.9, { glow: true });
  s.paint([cx - 17, 33, cx + 17, 43], (x, y) => ((x - cx) / 17) ** 2 + ((y - 38) / 17) ** 2 < 1 && Math.abs(y - 38) < 2.4, 'K', () => 0.5);
  for (let x = cx - 16; x <= cx + 16; x++) if (((x - cx) / 17) ** 2 < 1) for (let y = 36; y <= 40; y++) s.px(x, y, FILL[color], 0.95);
  s.dot(cx - 7, 37, 1.4, 0xffffff, 0.7);
  // a scowl on the shell: two narrowed eyes over the band (it means to go off)
  for (const sx of [-1, 1]) {
    s.line(cx + sx * 4, 29, cx + sx * 9, 31, INK, 2);
    s.dot(cx + sx * 6.5, 31.6, 1, 0xffe080);
  }
  // the fuse: a twisted cord up the screen, its end burning, sparks off it
  s.tube(cx, 21, cx + 2, 9, 1.1, 's');
  s.ellipse(cx + 2, 8, 2.4, 2.4, 'f', { flat: 0.9, glow: true });
  for (let i = 0; i < 7; i++) {
    const a = i * 0.9 + f * 0.7;
    s.dot(cx + 2 + Math.cos(a) * (4 + (i % 3) * 2), 7 + Math.sin(a) * (3 + (i % 2) * 2), 0.8, i % 2 ? 0xfff0a0 : 0xff9a3a);
  }
  return s.render();
}

// ---------------------------------------------------------------- turret: a ridge of temple tiles (base 57 x 57) and its onigawara (head 51 x 51)
// The demon tile at a roof's ridge end, turning its scowl to the ship: grey fired clay, horns, a heavy brow, round
// glaring eyes, the mouth wide with fangs (glowing red as it is about to fire: skins.js, heat).
export function ridgeBase(wreck) {
  const s = new HiSprite(57, 57, RAMPS);
  const c = 28.5;
  // the roof under it: rows of round-ended tiles down both slopes, the ridge of stacked tiles across the middle
  s.poly([[4, 6], [53, 6], [53, 52], [4, 52]], 't', { flat: 0.5 });
  for (let y = 8; y < 52; y += 5)
    for (let x = 6; x < 52; x += 6) {
      if (Math.abs(y - c) < 7) continue;
      s.ellipse(x + ((y / 5) % 2) * 3, y, 2.6, 2, 't', { bias: y < c ? 0.12 : -0.05 });
    }
  s.poly([[4, c - 6], [53, c - 6], [53, c + 6], [4, c + 6]], 'c', { flat: 0.62 });
  for (let x = 6; x < 52; x += 4) s.line(x, c - 6, x, c + 6, 0x2a2c32, 1, 0.5);
  if (wreck) {
    // the tile smashed off its seat, shards over the ridge, a hole in the roof
    s.ellipse(c, c, 9, 7, 'K', { flat: 0.2 });
    for (const [x, y, a] of [[14, 20, 0.3], [40, 18, 1.4], [18, 40, 2.6], [42, 40, 4.2], [30, 12, 5.1]]) s.poly([[x, y], [x + 5 * Math.cos(a), y + 5 * Math.sin(a)], [x + 3 * Math.cos(a + 1.2), y + 3 * Math.sin(a + 1.2)]], 'c', { flat: 0.6 });
    return s.render({ outline: 2 });
  }
  s.ellipse(c, c, 12, 12, 'c', { bias: 0.02 }); // its seat at the ridge's end
  return s.render({ outline: 2 });
}

export function onigawara(i) {
  const s = new HiSprite(51, 51, RAMPS);
  const c = 25.5;
  const a = (i / 16) * TAU;
  const dx = -Math.sin(a);
  const dy = Math.cos(a);
  const [px, py] = [-dy, dx]; // (across)
  const at = (along, across) => [c + dx * along + px * across, c + dy * along + py * across];
  const clay = { pat: mix2(speckle({ amt: 0.16, dark: 0.1, seed: 3 }), mottle({ amt: 0.12, scale: 4, seed: 4 })) };
  // the plate: a rounded shield of clay, the horns curling back from its top (away from the ship)
  s.ellipse(c, c, 14, 14, 'c', { bias: 0.03, ...clay });
  // (round its rim the swirl of cloud the tile is moulded with, so its outline is no animal's head)
  for (let k = 0; k < 10; k++) {
    const b = (k / 10) * TAU;
    s.ellipse(c + Math.cos(b) * 13.5, c + Math.sin(b) * 13.5, 3, 3, 'c', { bias: 0.08, ...clay });
    s.dot(c + Math.cos(b) * 13.5, c + Math.sin(b) * 13.5, 1, 0x2a2c32, 0.8);
  }
  for (const k of [-1, 1]) {
    // the horns: thin, ridged, sweeping back and out from the brow, their tips curling
    const [hx, hy] = at(-5, k * 6);
    const [mx, my] = at(-13, k * 11);
    const [tx, ty] = at(-19, k * 9);
    s.tube(hx, hy, mx, my, 1.8, 'c', { rb: 1.3 });
    s.tube(mx, my, tx, ty, 1.3, 'c', { rb: 0.8 });
    s.line(hx, hy, mx, my, 0x2a2c32, 1, 0.5);
  }
  // the brow, heavy and knotted; the eyes round and glaring; the nose; the mouth wide open toward the ship, fangs
  const [b1, b2] = [at(-2, -9), at(-2, 9)];
  s.line(b1[0], b1[1], b2[0], b2[1], 0x2a2c32, 3);
  for (const k of [-1, 1]) {
    const [wx, wy] = at(-4, k * 4);
    s.line(wx, wy, b1[0] + (k > 0 ? b2[0] - b1[0] : 0) * 0.5, b1[1] + (k > 0 ? b2[1] - b1[1] : 0) * 0.5, 0x2a2c32, 1.5); // the knotted frown
  }
  for (const k of [-1, 1]) {
    const [ex, ey] = at(0.5, k * 5.5);
    s.ellipse(ex, ey, 3, 3, 'W', { flat: 0.9 });
    s.dot(ex + dx * 0.8, ey + dy * 0.8, 1.6, INK);
    s.dot(ex, ey, 0.6, 0xffffff);
  }
  const [nx, ny] = at(4, 0);
  s.ellipse(nx, ny, 2.4, 2.4, 'c', { bias: 0.1 });
  const [mx, my] = at(9, 0);
  s.ellipse(mx, my, 5.6, 5.6, 'K', { flat: 0.2 });
  s.ellipse(mx, my, 3, 3, 'r', { flat: 0.6 }); // the dark red throat
  for (const k of [-1, 1]) {
    const [fx, fy] = at(6.4, k * 3.6);
    const [gx, gy] = at(10.5, k * 2.6);
    s.line(fx, fy, gx, gy, 0xf4f0e8, 1.5); // the fangs
  }
  return s.render();
}

/** Every frame, under the names the skins use (src/game/skins.js: onomichi). */
export function onomichiEnemies(add) {
  for (let f = 0; f < 4; f++) {
    add(`o_tsubame_${f}`, tsubame(f));
    add(`o_debera_${f}`, debera(f));
    add(`o_furin_${f}`, furin(f));
    for (const c of ['red', 'blue', 'green', 'purple']) add(`o_hanabi_${c}_${f}`, hanabidama(c, f));
  }
  add('o_ridge_base', ridgeBase(false));
  add('o_ridge_wreck', ridgeBase(true));
  for (let i = 0; i < 16; i++) add(`o_oni_head_${i}`, onigawara(i));
  nekomataFrames(add); // the miniboss, NEKOMATA (nekomata.mjs)
  funayureiFrames(add); // the boss, FUNA-YUREI's ship in parts (funayurei.mjs)
}
export const ONOMICHI_PORTRAITS = ['o_neko_sit_0'];
