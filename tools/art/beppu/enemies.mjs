// Beppu's enemies at 540 px (docs/enemies-540-plan.md), from the jigoku, the "hells" of Beppu: eggs boiled
// in the springs, their shells stained by the minerals, hatching into little oni in tiger-skin; the iron
// cauldron of Kamado Jigoku with its oni cook; the macaques of Takasakiyama; cypress bath buckets with a
// tenugui folded on them; steam nozzles on stone stands; the milky blue boil of Umi Jigoku and the grey mud
// bubbles of Oniishibozu, like shaven monks' heads; the Oniyama crocodile; and the red oni of Chinoike Jigoku,
// tiger-skinned, with his spiked iron kanabō, risen from the blood pond. Setsubun's masu of roasted beans.
// Every frame is three times the old one's size (old mask coordinate m -> fine (m + 1) * 3).
import { HiSprite, tones, fur, speckle, crackle, mottle, mix2 } from '../../lib/hisprite.mjs';
import { oni as oni540 } from './oni540.mjs';

const INK = 0x14101c;
const TAU = Math.PI * 2;
const M = (m) => (m + 1) * 3;
const RAMPS = {
  O: tones([0x7a1410, 0xd0322a, 0xff7a5a]), // oni red
  e: tones([0x8a7a64, 0xd8ccb4, 0xfaf2e2]), // mineral-stained eggshell
  y: tones([0x9a6a10, 0xe8b030, 0xfff0a0]), // tiger-skin yellow
  h: tones([0x0c0a10, 0x1c1820, 0x3a3440]), // wild black hair
  f: tones([0x4a3424, 0x86603e, 0xc09a70]), // macaque fur
  q: tones([0x7a2a2a, 0xb85048, 0xe8907a]), // its red face
  w: tones([0x8a6a3a, 0xc8a060, 0xf0d898]), // hinoki wood
  u: [0x082a66, 0x1250a8, 0x2a7ad0, 0x6ab8f0, 0xd8f4ff], // Umi Jigoku's cobalt
  a: [0x2a7aa0, 0x5ab8d8, 0x9ae0f0, 0xd0f4ff, 0xffffff], // Umi Jigoku's blue water
  g: tones([0x5a5650, 0x8e8a82, 0xc8c4bc]), // Oniishibozu mud
  z: tones([0x1e2a16, 0x3e5a2a, 0x6e8a44]), // crocodile
  i: tones([0x2a2628, 0x4a4648, 0x7a7678]), // cast iron
  b: tones([0x4a2410, 0x8a5426, 0xc8904a]), // roasted beans
  E: tones([0x4a4644, 0x8a8682, 0xc4c0ba]), // stone
};
const skinPat = (seed = 3) => mix2(speckle({ amt: 0.12, dark: 0.04, light: 0.03, seed }), mottle({ amt: 0.1, scale: 7, seed: seed + 1 }));
const tigerAt = (x, y, sc = 1) => Math.sin((x * 0.5 + Math.sin(y * 0.45) * 2.2 + y * 0.15) / sc) > 0.55;

// ---------------------------------------------------------------- popcorn: a jigoku-boiled egg (11 x 13 -> 33 x 39), cracking
export function tamago(crack) {
  const s = new HiSprite(33, 39, RAMPS);
  s.ellipse(16.5, 19.5, 11, 14, 'e', { bias: 0.03, pat: mix2(speckle({ amt: 0.16, dark: 0.08, light: 0.05 }), mottle({ amt: 0.18, scale: 5 })) });
  // the minerals' stain, brown-grey in a band, the shell's pores
  s.shade([4, 18, 30, 34], (x, y) => y > 24 + Math.sin(x * 0.5) * 2, -0.12);
  s.dot(12, 11, 2.2, 0xffffff, 0.8);
  if (crack === 'hair') {
    // the first hairline crack across the middle (step 2a: before the split)
    const pts = [[8, 18], [11, 19], [15, 16], [19, 20], [22, 18]];
    for (let k = 0; k < pts.length - 1; k++) s.line(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], 0x5a4a3a, 1);
  } else if (crack) {
    // the shell splitting, something red inside, a horn pushing through
    const pts = [[4, 18], [8, 15], [11, 19], [15, 14], [19, 20], [23, 15], [27, 19], [29, 17]];
    for (let k = 0; k < pts.length - 1; k++) s.line(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], 0x3a2a1a, 1);
    for (let k = 1; k < pts.length - 2; k += 2) s.dot(pts[k][0] + 2, pts[k][1] + 1, 1, 0xd0322a);
    s.poly([[14, 7], [16, 1], [17, 7]], 'y', { flat: 0.7 });
  }
  return s.render();
}

// ---------------------------------------------------------------- the little oni that hatches (11 x 12 -> 39 x 42)
export function imp(f) {
  const s = new HiSprite(39, 42, RAMPS);
  const cx = 19.5;
  const arm = f % 2;
  // arms flailing, legs in tiger-skin shorts
  for (const sx of [-1, 1]) {
    s.tube(cx + sx * 8, 20, cx + sx * 16, arm ? 9 : 27, 2.6, 'O', { rb: 2.2, pat: skinPat(4) });
    s.ellipse(cx + sx * 16, arm ? 8 : 28, 2.6, 2.6, 'O', { flat: 0.6 });
  }
  s.poly([[cx - 8, 27], [cx + 8, 27], [cx + 9, 36], [cx - 9, 36]], 'y', { flat: 0.6 });
  s.shade([cx - 10, 26, cx + 10, 37], (x, y) => tigerAt(x, y, 0.6), -0.45);
  for (const sx of [-1, 1]) s.ellipse(cx + sx * 4.5, 38.5, 3.2, 2.4, 'O', { flat: 0.5 });
  // the round red body and head, a tuft of black curls, two little gold horns, a big grin with a fang
  s.ellipse(cx, 20, 10.5, 10.5, 'O', { bias: 0.04, pat: skinPat(5) });
  for (let k = 0; k < 5; k++) s.ellipse(cx - 6 + k * 3, 11 - (k % 2), 3, 2.6, 'h', { pat: fur(Math.PI / 2, { amt: 0.2, len: 2, w: 1 }) });
  for (const sx of [-1, 1]) {
    s.poly([[cx + sx * 4, 11], [cx + sx * 8, 2], [cx + sx * 8, 11]], 'y', { ball: [cx + sx * 7, 7, 4, 6] });
    s.ellipse(cx + sx * 4, 18.5, 2.6, 2.4, 'W', { flat: 0.85 });
    s.dot(cx + sx * 4, 19, 1.3, INK);
    s.line(cx + sx * 1.5, 15.5, cx + sx * 7, 14.5, INK, 1);
  }
  s.poly([[cx - 6, 23.5], [cx + 6, 23.5], [cx + 4, 27], [cx - 4, 27]], 'K', { flat: 0.2 });
  s.line(cx - 5, 24, cx + 5, 24, 0xffffff, 1);
  s.poly([[cx + 2, 24], [cx + 4, 24], [cx + 3, 26.5]], 'W', { flat: 0.9 });
  return s.render();
}

// ---------------------------------------------------------------- shooter: Kamado Jigoku's iron cauldron with its oni cook (19 x 20 -> 57 x 60)
export function kamado(f) {
  const s = new HiSprite(57, 60, RAMPS);
  const cx = 28.5;
  // handles, the cast-iron cauldron, its rim
  for (const sx of [-1, 1]) s.ellipse(cx + sx * 24, 33, 3.6, 4.4, 'i', { flat: 0.5 });
  s.ellipse(cx, 36, 23, 20, 'i', { pat: mix2(speckle({ amt: 0.22, dark: 0.1, light: 0.05 }), mottle({ amt: 0.14 })) });
  s.ellipse(cx, 31, 18.5, 9.5, 'i', { flat: 0.78 });
  // the boiling milky-blue water, bubbles rising
  s.ellipse(cx, 31, 16, 7.6, 'a', { glow: true, flat: 0.55, pat: mottle({ amt: 0.2, scale: 4, seed: 3 + f }) });
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU + f * 0.9;
    s.dot(cx + Math.cos(a) * (7 + (k % 2) * 5), 31 + Math.sin(a) * 3.4, 1.4 + ((k + f) % 2), 0xe8faff);
  }
  // the cook: a little oni on the rim stirring with a ladle, horned, a hachimaki round its brow
  s.ellipse(cx, 13, 8, 8.6, 'O', { bias: 0.03, pat: skinPat(7) });
  for (const sx of [-1, 1]) s.poly([[cx + sx * 3, 6], [cx + sx * 7, 0], [cx + sx * 7.5, 7]], 'y', { flat: 0.7 });
  s.line(cx - 8, 9, cx + 8, 9, 0xf4f0e8, 2);
  for (const sx of [-1, 1]) {
    s.dot(cx + sx * 3, 13, 1.4, 0xfff0a0);
    s.px(cx + sx * 3, 13, INK);
  }
  s.line(cx - 3, 17.5, cx + 3, 17.5, INK, 1);
  const lx = cx + (f % 2 ? 15 : 12);
  const ly = f % 2 ? 26 : 28;
  s.tube(cx + 6, 16, lx, ly, 2, 'O');
  s.tube(lx, ly, lx - 6, ly + 7, 1, 'w');
  s.ellipse(lx - 7, ly + 8, 2.6, 1.8, 'w', { flat: 0.55 });
  // steam rising off it
  for (const [x0, k] of [[cx - 12, 0], [cx + 18, 1]]) for (let y = 0; y < 14; y += 0.5) s.px(x0 + Math.sin(y * 0.6 + f + k) * 1.6, y + (f % 2) * 2, 0xe8f4ff, 0.5);
  return s.render();
}

// ---------------------------------------------------------------- diver: a Takasakiyama macaque (15 -> 51), head down
export function saru(f) {
  const s = new HiSprite(51, 51, RAMPS);
  const cx = 25.5;
  const pelt = (seed) => ({ pat: mix2(fur((x, y) => Math.atan2(y - 22, x - cx) * 0.4 + Math.PI / 2, { amt: 0.28, len: 4, w: 1.3, gap: 0.08, seed }), speckle({ amt: 0.08 })) });
  const reach = [1, 0.5, 0, 0.5][f];
  // the short tail, the limbs scrambling
  s.tube(cx, 10, cx, 2, 2.2, 'f', { rb: 1.6 });
  for (const sx of [-1, 1]) {
    s.tube(cx + sx * 8, 17, cx + sx * 19, 12 - reach * 4, 3, 'f', { rb: 2.4, ...pelt(3) });
    s.tube(cx + sx * 8, 29, cx + sx * 19, 34 + reach * 4, 3, 'f', { rb: 2.4, ...pelt(4) });
    for (const [x, y] of [[cx + sx * 20, 11 - reach * 4], [cx + sx * 20, 35 + reach * 4]]) s.ellipse(x, y, 2.6, 2.4, 'q', { flat: 0.5 });
  }
  s.ellipse(cx, 22, 11, 14, 'f', pelt(5));
  // the head: a ruff of fur round the bare red face, close-set eyes, the nostrils
  s.ellipse(cx, 36, 9.5, 8.5, 'f', pelt(6));
  for (const sx of [-1, 1]) s.ellipse(cx + sx * 8.5, 33, 2.6, 3, 'q', { flat: 0.5 }); // the ears
  s.ellipse(cx, 38, 5.6, 5.2, 'q', { bias: 0.04, pat: speckle({ amt: 0.08 }) });
  for (const sx of [-1, 1]) {
    s.line(cx + sx * 1.5, 34.5, cx + sx * 5, 34.5, 0x7a3a3a, 1);
    s.dot(cx + sx * 2.8, 36, 1.3, INK);
    s.px(cx + sx * 2.8 - 0.5, 35.5, 0xffffff);
    s.px(cx + sx * 1, 40, 0x6a2a2a);
  }
  s.line(cx - 2.5, 42, cx + 2.5, 42, 0x6a2a2a, 1);
  return s.render();
}

// ---------------------------------------------------------------- carrier: a cypress bath bucket, a tenugui folded on it (15 -> 51)
const HOOP = { red: 0xd8302a, blue: 0x3a72f0, green: 0x37b35a };
export function oke(color, f) {
  const s = new HiSprite(51, 51, RAMPS);
  const c = 25.5;
  // the bucket from above: its staves, the hoop (the colour of its weapon), the water in it
  s.ellipse(c, c, 21, 21, 'w', { pat: fur((x, y) => Math.atan2(y - c, x - c), { amt: 0.18, len: 30, w: 1.4, gap: 0.03 }) });
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * TAU;
    s.line(c + Math.cos(a) * 15.5, c + Math.sin(a) * 15.5, c + Math.cos(a) * 20.5, c + Math.sin(a) * 20.5, 0x8a6a3a, 1);
  }
  for (let a = 0; a < TAU; a += 0.015) for (const r of [19.2, 20]) s.px(c + Math.cos(a) * r, c + Math.sin(a) * r, HOOP[color]);
  s.ellipse(c, c, 15.5, 15.5, 'a', { flat: 0.62, pat: mottle({ amt: 0.15, scale: 4, seed: 5 + f }) });
  for (let a = 0; a < TAU; a += 0.05) s.px(c + Math.cos(a) * (8 + f * 2), c + Math.sin(a) * (8 + f * 2), 0xe8faff, 0.45);
  // the tenugui folded over it, dyed with a blue pattern
  s.poly([[c - 13, c - 6], [c + 13, c - 8], [c + 14, c + 4], [c - 12, c + 6]], 'W', { flat: 0.72, pat: fur(0.05, { amt: 0.08, len: 26, w: 2 }) });
  for (let k = 0; k < 6; k++) s.dot(c - 9 + k * 4, c - 1 - k * 0.3, 1.2, 0x3a5aa8);
  s.line(c - 12, c + 5, c + 14, c + 3, 0x8a93b0, 1);
  return s.render();
}

// ---------------------------------------------------------------- turret: a steam nozzle on a stone stand (base 19 -> 57, nozzle 11 -> 33)
export function yuzutsuBase(wreck) {
  const s = new HiSprite(57, 57, RAMPS);
  const c = 28.5;
  const stone = { pat: mix2(speckle({ amt: 0.3, dark: 0.12, light: 0.06 }), mottle({ amt: 0.14, scale: 6 })) };
  if (wreck) {
    for (const [x, y, r] of [[M(5), M(6), 9], [M(11), M(5), 7.8], [M(9), M(11), 10], [M(4), M(12), 6]]) s.poly([[x - r, y], [x - r * 0.3, y - r * 0.9], [x + r, y - r * 0.2], [x + r * 0.5, y + r * 0.8], [x - r * 0.6, y + r * 0.6]], 'E', { ball: [x, y, r, r], ...stone });
    s.tube(30, 33, 40, 38, 2.4, 'Y');
    s.dot(M(9) + 1.5, M(11) + 1.5, 2.4, INK);
    return s.render();
  }
  // a stone stand, cut and fitted, moss in the joints, the pipe's iron collar at the centre
  s.ellipse(c, c, 23, 23, 'E', stone);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU + 0.2;
    s.line(c + Math.cos(a) * 14, c + Math.sin(a) * 14, c + Math.cos(a) * 22, c + Math.sin(a) * 22, 0x3a3634, 1);
  }
  for (const [x, y] of [[11, 18], [41, 30], [20, 43], [36, 10]]) s.dot(x, y, 1.6, 0x4a7a3a, 0.9);
  s.ellipse(c, c, 14, 14, 'i', { flat: 0.4 });
  s.ellipse(c, c, 11, 11, 'S', { pat: speckle({ amt: 0.15 }) });
  for (let k = 0; k < 6; k++) s.dot(c + Math.cos((k / 6) * TAU) * 12.5, c + Math.sin((k / 6) * TAU) * 12.5, 1.1, 0x9ea6d0);
  return s.render();
}

export function nozzle(i) {
  const s = new HiSprite(33, 33, RAMPS);
  const c = 16.5;
  const a = (i / 16) * TAU;
  const dx = -Math.sin(a);
  const dy = Math.cos(a);
  s.ellipse(c - dx * 2.5, c - dy * 2.5, 6.6, 6.6, 'S', { pat: speckle({ amt: 0.12 }) });
  s.tube(c, c, c + dx * 11, c + dy * 11, 2.4, 'Y', { rb: 2 });
  s.tube(c + dx * 10, c + dy * 10, c + dx * 13, c + dy * 13, 3.4, 'Y', { rb: 3.6 });
  s.ellipse(c + dx * 13.5, c + dy * 13.5, 2.4, 2.4, 'K', { flat: 0.1 });
  s.dot(c - dx * 2.5 - 2, c - dy * 2.5 - 2, 1.2, 0xffffff, 0.8);
  return s.render();
}

// ---------------------------------------------------------------- geysers about to blow: Umi Jigoku's blue boil, Oniishibozu's grey mud (17 -> 51)
export function boil(mud, f) {
  const s = new HiSprite(51, 51, RAMPS);
  const c = 25.5;
  // the vent's pool: a rim of pale sinter crusted round it, the water (or mud) inside darker towards the throat
  s.ellipse(c, c, 23, 21, 'E', { flat: 0.55, pat: mix2(speckle({ amt: 0.3, dark: 0.1, light: 0.2 }), mottle({ amt: 0.15, scale: 4 })) });
  for (let a = 0; a < TAU; a += 0.05) s.px(c + Math.cos(a) * 21.5, c + Math.sin(a) * 19.5, 0xe8e0d0, 0.7);
  const mat = mud ? 'g' : 'u';
  s.paint([c - 21, c - 19, c + 21, c + 19], (x, y) => ((x - c) / 20) ** 2 + ((y - c) / 18) ** 2 < 1, mat, (x, y) => 0.2 + 0.45 * Math.min(1, Math.hypot((x - c) / 20, (y - c) / 18)) - (y - c) / 90, { glow: false, pat: mottle({ amt: 0.15, scale: 4, seed: 3 + f }) });
  // ripples spreading from the centre, a burst ring
  for (const r of [7 + f * 3, 13 + f * 3]) for (let a = 0; a < TAU; a += 0.04) s.px(c + Math.cos(a) * r, c + Math.sin(a) * r * 0.9, mud ? 0x4e4a44 : 0xd0f4ff, mud ? 0.6 : 0.5);
  if (mud) {
    // grey domes of mud swelling like shaven heads, each lit on top, dark at its foot, one bursting
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * TAU + f * 0.5;
      const d = 6 + ((k + f) % 3) * 4.5;
      const r = 3 + ((k + f) % 2) * 1.8;
      const x = c + Math.cos(a) * d;
      const y = c + Math.sin(a) * d * 0.9;
      for (let b = 0; b < TAU; b += 0.1) s.px(x + Math.cos(b) * (r + 0.8), y + Math.sin(b) * (r + 0.8) * 0.9, 0x3a3632, 0.8);
      s.ellipse(x, y, r, r * 0.9, 'g', { bias: 0.15 });
      s.dot(x - r * 0.35, y - r * 0.4, r * 0.3, 0xf0eeea, 0.9);
    }
    s.ellipse(c, c, 4 + f * 1.6, 3.6 + f * 1.4, 'g', { bias: 0.2 });
    s.dot(c - 1.5, c - 1.5, 1.2, 0xffffff);
  } else {
    // bubbles boiling up, white-rimmed, a dome of water lifting at the centre, steam beginning to rise
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * TAU + f * 0.5;
      const d = 5 + ((k + f) % 3) * 4.5;
      const r = 1.8 + ((k + f) % 2) * 1.2;
      const x = c + Math.cos(a) * d;
      const y = c + Math.sin(a) * d * 0.9;
      for (let b = 0; b < TAU; b += 0.15) s.px(x + Math.cos(b) * r, y + Math.sin(b) * r, 0xffffff, 0.85);
      s.px(x - r * 0.4, y - r * 0.4, 0xffffff);
    }
    s.ellipse(c, c, 5 + f * 2, 4.6 + f * 2, 'u', { bias: 0.35 });
    for (let k = 0; k < 3; k++) for (let y = 2; y < c - 6; y += 0.5) s.px(c - 8 + k * 8 + Math.sin(y * 0.5 + f + k) * 2, y + f * 2, 0xf4f8ff, 0.18 + (y / c) * 0.3);
  }
  return s.render({ outline: 0 });
}

// ---------------------------------------------------------------- heavy: the Oniyama crocodile (29 x 68 -> 87 x 204), surfaced, and submerged (27 x 26 -> 81 x 78)
export function wani(open) {
  const s = new HiSprite(87, 204, RAMPS);
  const cx = 43.5;
  const hide = { pat: mix2(crackle({ amt: 0.22, scale: 5, width: 0.05, seed: 7 }), speckle({ amt: 0.14, dark: 0.06 })) };
  // the tail, thick at the root, a double crest of scutes down it
  s.paint([0, 0, 87, 80], (x, y) => y < 76 && Math.abs(x - cx) < 3 + (y / 76) * 15, 'z', (x) => 0.55 - (x - cx) / 60, hide);
  for (let y = 6; y < 74; y += 6) for (const sx of [-1, 1]) s.poly([[cx + sx * (1 + y / 30), y], [cx + sx * (3 + y / 22), y + 3], [cx + sx * (1 + y / 30), y + 5]], 'z', { flat: 0.3 });
  // the legs splayed, claws out
  for (const [lx, ly, ex, ey] of [[6, 27, 1, 23], [21, 27, 26, 23], [6, 41, 1, 46], [21, 41, 26, 46]]) {
    s.tube(M(lx), M(ly), M(ex), M(ey), 6, 'z', { rb: 4.5, ...hide });
    for (let k = -1; k <= 1; k++) {
      const a = Math.atan2(M(ey) - M(ly), M(ex) - M(lx)) + k * 0.5;
      s.line(M(ex), M(ey), M(ex) + Math.cos(a) * 7, M(ey) + Math.sin(a) * 7, 0xe8e0c8, 1);
    }
  }
  // the body: rows of armoured scutes, the paler flanks
  s.ellipse(cx, M(34), 25, 40, 'z', { bias: 0.02, ...hide });
  for (let y = M(24); y < M(46); y += 7) for (const dx of [-12, -6, 0, 6, 12]) {
    s.ellipse(cx + dx, y, 2.6, 2.8, 'z', { bias: 0.14 });
    s.px(cx + dx - 1, y - 1, 0x9ab060);
  }
  // the long snout; the jaws open on a pink mouth and rows of teeth
  const jaw = open ? 21 : 15;
  s.paint([0, M(45), 87, 204], (x, y) => {
    const t = (y - M(45)) / (204 - M(45));
    return t < 0.96 && Math.abs(x - cx) < (t < 0.28 ? 18 - t * 8 : jaw * 0.7 - (t - 0.28) * jaw * 0.55);
  }, 'z', (x, y) => 0.6 - (x - cx) / 60 - (y - 150) / 400, hide);
  if (open) {
    s.paint([0, 155, 87, 202], (x, y) => y > 158 && y < 196 && Math.abs(x - cx) < 12 - (y - 158) * 0.25, 'P', () => 0.45);
    for (let y = 160; y < 196; y += 4) for (const sx of [-1, 1]) s.poly([[cx + sx * (12.5 - (y - 158) * 0.25), y], [cx + sx * (12.5 - (y - 158) * 0.25), y + 3], [cx + sx * (10 - (y - 158) * 0.25), y + 1.5]], 'W', { flat: 0.85 });
  } else {
    for (let y = 160; y < 196; y += 5) for (const sx of [-1, 1]) s.poly([[cx + sx * (10.5 - (y - 158) * 0.15), y], [cx + sx * (12 - (y - 158) * 0.15), y + 1.5], [cx + sx * (10.5 - (y - 158) * 0.15), y + 3]], 'W', { flat: 0.8 });
  }
  // the raised eyes, gold, slit pupils; the nostrils at the tip
  for (const sx of [-1, 1]) {
    s.ellipse(cx + sx * 9, M(48), 5.4, 5, 'z', { bias: 0.1 });
    s.ellipse(cx + sx * 9, M(48.5), 3.4, 3, 'Y', { flat: 0.75 });
    s.line(cx + sx * 9, M(48.5) - 2.5, cx + sx * 9, M(48.5) + 2.5, INK, 1);
    s.dot(cx + sx * 3, 197, 1.3, INK);
  }
  return s.render();
}

export function waniSub() {
  const s = new HiSprite(81, 78, RAMPS);
  // only the eyes and nostrils above the water, ripples spreading round them
  for (let a = 0; a < TAU; a += 0.012) {
    s.px(40.5 + Math.cos(a) * 33, 39 + Math.sin(a) * 27, 0xd8e8e8, 0.55);
    s.px(40.5 + Math.cos(a) * 22, 39 + Math.sin(a) * 16, 0xd8e8e8, 0.4);
  }
  s.ellipse(40.5, 40, 16, 22, 'z', { flat: 0.3, pat: crackle({ amt: 0.2, scale: 5 }) });
  for (const sx of [-1, 1]) {
    s.ellipse(40.5 + sx * 9, 31, 5.4, 4.6, 'z', { bias: 0.08 });
    s.ellipse(40.5 + sx * 9, 30, 3.4, 2.6, 'Y', { flat: 0.75 });
    s.line(40.5 + sx * 9, 28, 40.5 + sx * 9, 32, INK, 1);
    s.dot(40.5 + sx * 3, 54, 1.4, INK);
  }
  return s.render({ outline: 0 });
}

// ---------------------------------------------------------------- boss: the red oni (oni540.mjs)

// ---------------------------------------------------------------- Setsubun: a wooden masu of roasted beans (15 -> 51)
export function masu() {
  const s = new HiSprite(51, 51, RAMPS);
  // the box, square, its corners joined, the inside darker
  s.poly([[4, 4], [47, 4], [47, 47], [4, 47]], 'w', { flat: 0.68, pat: fur(0, { amt: 0.14, len: 16, w: 1.4 }) });
  s.poly([[10, 10], [41, 10], [41, 41], [10, 41]], 'w', { flat: 0.38, pat: fur(Math.PI / 2, { amt: 0.12, len: 16, w: 1.4 }) });
  for (const [x0, y0, x1, y1] of [[4, 4, 10, 10], [47, 4, 41, 10], [47, 47, 41, 41], [4, 47, 10, 41]]) s.line(x0, y0, x1, y1, 0x8a6a3a, 1);
  // the roasted soybeans heaped in it
  for (let k = 0; k < 26; k++) {
    const x = 13 + ((k * 7.3) % 25);
    const y = 13 + ((k * 4.7 + (k % 3) * 2) % 25);
    s.ellipse(x, y, 2.6, 2.2, 'b', { bias: 0.08 });
    s.px(x - 0.8, y - 0.8, 0xf0c890);
  }
  // a brushed ink line along the near side
  s.line(14, 44.5, 37, 44.5, 0x2a1a10, 1);
  return s.render();
}

export function beppuEnemies(add) {
  for (let f = 0; f < 2; f++) add(`tamago_${f}`, tamago(f));
  add('tamago_hair', tamago('hair')); // step 2a: a hairline crack before the split
  for (let f = 0; f < 4; f++) {
    add(`imp_${f}`, imp(f));
    add(`kamado_${f}`, kamado(f));
    add(`saru_${f}`, saru(f));
    for (const c of ['red', 'blue', 'green']) add(`oke_${c}_${f}`, oke(c, f));
  }
  for (let f = 0; f < 2; f++) {
    add(`boil_${f}`, boil(false, f));
    add(`mudboil_${f}`, boil(true, f));
  }
  add('yuzutsu_base', yuzutsuBase(false));
  add('yuzutsu_wreck', yuzutsuBase(true));
  for (let i = 0; i < 16; i++) add(`nozzle_${i}`, nozzle(i));
  add('wani_0', wani(false));
  add('wani_1', wani(true));
  add('wani_sub', waniSub());
  // the oni (oni540.mjs), and the same with his left horn snapped off, from phase 2 on
  for (const broken of [false, true]) {
    for (let p = 0; p < 3; p++) add(`oni_${p}${broken ? '_b' : ''}`, oni540(p, broken));
    add(`oni_hurt${broken ? '_b' : ''}`, oni540(3, broken));
  }
  // step 2a: phase 3, the kanabō split open as well (and the horn still snapped)
  for (let p = 0; p < 3; p++) add(`oni_${p}_c`, oni540(p, true, true));
  add('oni_hurt_c', oni540(3, true, true));
  add('masu', masu());
}
export const BEPPU_PORTRAITS = ['oni_0'];
