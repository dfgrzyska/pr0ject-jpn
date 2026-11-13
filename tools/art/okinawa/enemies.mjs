// Okinawa's enemies at 540 px (docs/enemies-540-plan.md), drawn after the real things: the tobiuo flying fish
// as the fish prints draw it (a navy back, silver flanks, the great ribbed pectoral fins), the hārī dragon boat
// with its painted scales, a drummer and the rowers' oars, the habu viper's blotched chain pattern, bubbled
// Ryukyu glass in a rope net, a bunker of porous coral limestone under red akagawara tiles laid in white
// shikkui mortar, a reef manta with the white shoulder chevrons of the real fish (and the robot's cyan seams),
// and the two terracotta shisa of the Tsuboya kilns with their spiral mane curls.
// Every frame is three times the old one's size (old mask coordinate m -> fine (m + 1) * 3).
import { HiSprite, S, tones, fur, speckle, crackle, mottle, mix2 } from '../../lib/hisprite.mjs';
import { shisa } from './shisa540.mjs';
import { Raster, fbm } from '../../lib/raster.mjs';

const INK = 0x14101c;
const TAU = Math.PI * 2;
const RAMPS = {
  n: tones([0x142040, 0x24406e, 0x4a74a8]), // tobiuo's navy back
  v: tones([0x8a96a8, 0xc8d2de, 0xf4f8ff]), // silver flanks
  f: tones([0x4a6a8a, 0x8ab0cc, 0xd0e8f4]), // fin membrane
  r: tones([0x7a1810, 0xc8301c, 0xf06a40]), // boat red
  g: tones([0x1c5a2e, 0x2e8a44, 0x6ac070]), // boat green
  h: tones([0x8a6a3a, 0xc8a060, 0xecd08a]), // light wood
  o: tones([0x7a7030, 0xbab058, 0xe8dc90]), // habu: yellow-olive
  b: tones([0x2a1c10, 0x4a3420, 0x6a5030]), // habu blotches
  c: tones([0x9a8a6a, 0xd8ccb0, 0xf4ecd8]), // coral limestone
  t: tones([0x7a2a14, 0xc04a22, 0xe8784a]), // akagawara tile, terracotta
  m: tones([0x1c2430, 0x2e3a4c, 0x4a5a70]), // manta's back
  q: tones([0x8a3a18, 0xc8602a, 0xf09050]), // shisa terracotta
  k: tones([0x3a1c10, 0x5a2e18, 0x7a4424]), // shisa dark glaze (mane)
  R: tones([0x8a1010, 0xd83020, 0xff8a60]), // Ryukyu glass: red, blue, green (bubbly, a strong sheen)
  B: tones([0x103a7a, 0x2a70c8, 0x8ad0ff]),
  G: tones([0x1a5a2a, 0x3aa050, 0x9ae8a0]),
  y: [0x8a5a00, 0xd09000, 0xffd040, 0xfff0a0, 0xffffff],
  a: [0x0a4a6a, 0x1a8ab0, 0x3fd8e8, 0x9af4ff, 0xe8ffff], // the robots' cyan glow
};

// ---------------------------------------------------------------- popcorn: tobiuo, the flying fish (13 x 13 -> 39 x 39), head down
export function tobiuo(f) {
  const s = new HiSprite(39, 39, RAMPS);
  const cx = 19.5;
  const spread = [1, 0.8, 0.55, 0.8][f]; // the pectoral fins beat: spread, folding, folded, spreading
  // the great pectoral fins: membranes with dark rays, swept back towards the tail
  for (const sx of [-1, 1]) {
    const root = [cx + sx * 2.5, 24];
    const tips = [[cx + sx * 17 * spread, 9 + (1 - spread) * 8], [cx + sx * 18 * spread, 15 + (1 - spread) * 5], [cx + sx * 15 * spread, 21]];
    s.poly([root, ...tips, [cx + sx * 3, 27]], 'f', { flat: 0.6, pat: mottle({ amt: 0.12, scale: 4 }) });
    for (let k = 0; k < 5; k++) {
      const t = k / 4;
      s.line(root[0], root[1], cx + sx * (16 - t * 3) * spread, 9 + t * 12 + (1 - spread) * (8 - t * 3), 0x2e4a6a, 1, 0.8);
    }
  }
  // the forked tail, the lower lobe longer, as the flying fish has it
  s.poly([[cx - 1.5, 8], [cx - 7, 1], [cx - 4, 1.5], [cx, 6]], 'n', { flat: 0.45 });
  s.poly([[cx + 1.5, 8], [cx + 5, 3.5], [cx + 3, 3], [cx, 6]], 'n', { flat: 0.45 });
  // the body: a navy back down the middle, silver flanks, a slim spindle
  s.ellipse(cx, 21, 4.6, 15, 'v', { pat: mix2(fur(Math.PI / 2, { amt: 0.2, len: 3, w: 1.2, gap: 0.05 }), speckle({ amt: 0.15, dark: 0.04, light: 0.06 })) });
  s.ellipse(cx, 20, 2.4, 13.5, 'n', { pat: fur(Math.PI / 2, { amt: 0.2, len: 2.5, w: 1 }) });
  // scales: a net of fine dark arcs over the silver
  for (let y = 10; y < 32; y += 2.5) for (const sx of [-1, 1]) s.px(cx + sx * 3.4, y + (sx > 0 ? 1 : 0), 0x6a7a90, 0.7);
  // pelvic fins, small
  for (const sx of [-1, 1]) s.poly([[cx + sx * 3, 13], [cx + sx * 7.5, 9], [cx + sx * 3.5, 15]], 'f', { flat: 0.5 });
  // the head with its big eyes on the sides, the blunt snout pointing down
  s.ellipse(cx, 33, 4.4, 4.2, 'v', { bias: 0.05 });
  s.ellipse(cx, 32, 2.6, 3, 'n');
  for (const sx of [-1, 1]) {
    s.dot(cx + sx * 3.6, 33, 1.8, 0xe8b830);
    s.dot(cx + sx * 3.6, 33.3, 1.1, INK);
  }
  // drops flung off the fins
  for (const [x, y] of [[cx - 15, 6], [cx + 14, 5], [cx - 11, 3]]) if ((x + f) % 2 < 1) s.px(x, y + f, 0xe8f8ff);
  return s.render();
}

// ---------------------------------------------------------------- shooter: hārī, the dragon boat (17 x 21 -> 51 x 63), bow down
export function hari(f) {
  const s = new HiSprite(51, 63, RAMPS);
  const cx = 25.5;
  const stroke = (f / 4) * TAU;
  // oars: three to a side, sweeping
  for (let k = 0; k < 3; k++) {
    const y = 19 + k * 10;
    for (const sx of [-1, 1]) {
      const sw = Math.sin(stroke + k * 0.6) * 4;
      s.tube(cx + sx * 6, y, cx + sx * 21, y + sw, 0.8, 'h');
      s.ellipse(cx + sx * 21.5, y + sw, 1.6, 2.6, 'h', { flat: 0.6 });
      if (Math.sin(stroke + k * 0.6) > 0.6) s.px(cx + sx * 23, y + sw + 3, 0xe8f8ff);
    }
  }
  // the hull: long and narrow, red with green and gold dragon scales along the sides, a gold rail
  s.poly([[cx - 3, 4], [cx + 3, 4], [cx + 7, 12], [cx + 8, 42], [cx + 6, 50], [cx, 54], [cx - 6, 50], [cx - 8, 42], [cx - 7, 12]], 'r', { flat: 0.55, pat: fur(Math.PI / 2, { amt: 0.2, len: 10, w: 1.4, seed: 4 }) });
  for (let y = 10; y < 50; y += 3) for (const sx of [-1, 1]) {
    const w = y < 14 ? 4 : y > 44 ? 4.5 : 6.5;
    s.dot(cx + sx * (w - 0.5), y, 1.3, (y / 3) % 2 < 1 ? 0x2e8a44 : 0xd8a030);
    s.px(cx + sx * (w - 0.5), y - 1, 0xffffff, 0.5);
  }
  s.line(cx - 6, 12, cx - 6.5, 44, 0xd8a030, 1);
  s.line(cx + 6, 12, cx + 6.5, 44, 0xd8a030, 1);
  // the crew down the middle: white hachimaki headbands on black hair, the drummer and the taiko
  for (let k = 0; k < 3; k++) for (const sx of [-1, 1]) {
    const x = cx + sx * 2.8;
    const y = 19 + k * 10 + Math.sin(stroke + k * 0.6) * 0.8;
    s.ellipse(x, y, 2.2, 2.2, 'K', { flat: 0.4 });
    s.line(x - 2, y, x + 2, y, 0xf4f0e8, 1);
  }
  s.ellipse(cx, 45, 3.2, 3.2, 'h', { flat: 0.55 });
  s.ellipse(cx, 45, 2.2, 2.2, 'W', { flat: 0.7 });
  s.dot(cx, 45, 0.8, 0xd02020);
  // the stern curls up into the dragon's tail, the bow is its head: gold horns, red mouth, white teeth, an eye
  s.poly([[cx - 2, 1], [cx + 2, 1], [cx + 3, 5], [cx - 3, 5]], 'g', { flat: 0.6 });
  s.line(cx, 1, cx, 5, 0xd8a030, 1);
  s.poly([[cx - 5, 51], [cx + 5, 51], [cx + 4, 57], [cx, 61], [cx - 4, 57]], 'g', { flat: 0.55, pat: speckle({ amt: 0.2, dark: 0.1 }) });
  for (const sx of [-1, 1]) {
    s.line(cx + sx * 3, 52, cx + sx * 7, 48, 0xd8a030, 1);
    s.dot(cx + sx * 2.4, 54.5, 1, 0xfff0a0);
    s.px(cx + sx * 2.4, 54.5, INK);
  }
  s.poly([[cx - 2.5, 57], [cx + 2.5, 57], [cx, 61.5]], 'r', { flat: 0.3 });
  s.px(cx - 1, 57.5, 0xffffff);
  s.px(cx + 1, 57.5, 0xffffff);
  // the gun in the bow, glowing
  s.dot(cx, 59.5, 1, 0xff6a3a);
  return s.render();
}

// ---------------------------------------------------------------- diver: habu, the pit viper (15 x 19 -> 45 x 57), head down
export function habu(f) {
  const s = new HiSprite(45, 57, RAMPS);
  const phase = (f / 4) * TAU;
  const at = (t) => [(6.5 + 3.6 * Math.sin(t * Math.PI * 1.6 + phase) * (1 - t * 0.6) + 1) * S, (1 + t * 11 + 1) * S];
  const N = 90;
  for (let k = 0; k <= N; k++) {
    const t = k / N;
    const [x, y] = at(t);
    const r = 1.5 + 4.4 * Math.min(1, t * 2.2) * (1 - t * 0.2);
    s.ellipse(x, y, r, r, 'o', { flat: 0.5, pat: speckle({ amt: 0.18, dark: 0.08, light: 0.04, seed: 3 }) });
  }
  // the chain of dark blotches, each edged in black, along the back
  for (let k = 6; k < N; k += 9) {
    const t = k / N;
    const [x, y] = at(t);
    const [x2, y2] = at(t + 0.01);
    const a = Math.atan2(y2 - y, x2 - x);
    const r = 1.9 * Math.min(1, t * 2.2);
    s.ellipse(x, y, r + 0.8, r + 0.8, 'K', { flat: 0.2 });
    s.ellipse(x, y, r, r * 0.8, 'b', { flat: 0.45 });
    s.px(x + Math.cos(a + 1.6) * (r + 2), y + Math.sin(a + 1.6) * (r + 2), 0x2a1c10, 0.8);
  }
  // the lance-shaped head, its dark stripe back from the eye, gold eyes with slit pupils, the tongue flicking
  const [hx, hy] = at(1);
  s.poly([[hx - 7, hy - 3], [hx + 7, hy - 3], [hx + 5.5, hy + 4], [hx, hy + 8.5], [hx - 5.5, hy + 4]], 'o', { ball: [hx, hy + 2, 8, 7], pat: speckle({ amt: 0.2, dark: 0.08 }) });
  s.poly([[hx - 4, hy - 3], [hx + 4, hy - 3], [hx + 2.5, hy + 3], [hx - 2.5, hy + 3]], 'b', { flat: 0.4 });
  for (const sx of [-1, 1]) {
    s.line(hx + sx * 3, hy + 2, hx + sx * 6, hy - 2, 0x2a1c10, 1);
    s.dot(hx + sx * 3.8, hy + 1.5, 1.3, 0xe8c030);
    s.line(hx + sx * 3.8, hy + 0.5, hx + sx * 3.8, hy + 2.5, INK, 1);
    s.px(hx + sx * 2, hy + 5, INK); // the heat pits
  }
  if (f % 2 === 0) {
    s.line(hx, hy + 8.5, hx, hy + 12, 0xd02020, 1);
    s.px(hx - 1, hy + 13, 0xd02020);
    s.px(hx + 1, hy + 13, 0xd02020);
  }
  return s.render();
}

// ---------------------------------------------------------------- carrier: a Ryukyu-glass float in a rope net (15 x 16 -> 45 x 48)
const GLASS = { red: 'R', blue: 'B', green: 'G', purple: 'V' };
export function glass(color, f) {
  const s = new HiSprite(45, 48, RAMPS);
  const cx = 22.5;
  const cy = 28;
  s.ellipse(cx, cy, 16, 16, GLASS[color], { bias: 0.04, pat: mottle({ amt: 0.12, scale: 6, seed: 5 }) });
  // a darker rim where the glass is thick, the light coming through on the far side
  s.shade([cx - 17, cy - 17, cx + 17, cy + 17], (x, y) => Math.hypot(x - cx, y - cy) > 13, -0.18);
  s.shade([cx - 17, cy - 17, cx + 17, cy + 17], (x, y) => Math.hypot(x - cx - 6, y - cy - 7) < 5, 0.25);
  // bubbles caught in the recycled glass
  for (const [x, y, r] of [[-7, -4, 1.4], [5, -8, 1], [8, 4, 1.6], [-3, 7, 1.1], [1, 0, 0.8], [-9, 5, 0.9], [10, -3, 0.8]]) {
    s.dot(cx + x, cy + y, r, 0xffffff, 0.45);
    s.px(cx + x + r * 0.5, cy + y + r * 0.5, INK, 0.25);
  }
  // the sheen
  s.dot(cx - 7, cy - 8, 2.6, 0xffffff, 0.85);
  s.dot(cx - 4, cy - 11, 1.2, 0xffffff, 0.9);
  // the rope net: a diamond mesh of knotted rope
  for (let k = -2; k <= 2; k++) {
    for (let y = cy - 15; y <= cy + 15; y += 0.5) {
      for (const dir of [-1, 1]) {
        const x = cx + k * 9 + dir * (y - cy) * 0.55;
        if (Math.hypot(x - cx, y - cy) < 15.6) s.px(x, y, (Math.floor(y * 2) % 3) ? 0x8a6a3a : 0xc8a060, 0.75);
      }
    }
  }
  // the cord up to the little rotor, spinning
  s.line(cx, 12, cx, 6, 0x8a6a3a, 1);
  s.ellipse(cx, 5, 2.2, 1.6, 'y', { flat: 0.7 });
  const a = (f / 4) * Math.PI;
  s.line(cx - Math.cos(a) * 10, 3.5 - Math.sin(a) * 1.5, cx + Math.cos(a) * 10, 3.5 + Math.sin(a) * 1.5, 0xb4b8d4, 1, 0.85);
  return s.render();
}

// ---------------------------------------------------------------- turret: the coral-limestone bunker (base 17 -> 51), its tiled head (15 -> 45)
export function coralBase(wreck) {
  const s = new HiSprite(51, 51, RAMPS);
  const c = 25.5;
  // a round wall of porous limestone blocks, fitted like the stones of a gusuku castle
  s.ellipse(c, c, 22, 22, 'c', { flat: 0.55, pat: mix2(speckle({ amt: 0.4, dark: 0.16, light: 0.06, seed: 7 }), mottle({ amt: 0.18, scale: 6 })) });
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * TAU + (k % 2) * 0.1;
    s.line(c + Math.cos(a) * 15, c + Math.sin(a) * 15, c + Math.cos(a + 0.08) * 22, c + Math.sin(a + 0.08) * 22, 0x7a6a50, 1);
  }
  for (let a = 0; a < TAU; a += 0.03) s.px(c + Math.cos(a) * 15, c + Math.sin(a) * 15, 0x7a6a50);
  s.ellipse(c, c, 14.5, 14.5, 'c', { flat: 0.42, pat: speckle({ amt: 0.35, dark: 0.18, seed: 8 }) });
  // fragments of coral in the stone
  for (const [x, y] of [[6, 20], [44, 30], [18, 6], [32, 45], [9, 34], [41, 13]]) {
    s.dot(x, y, 1.2, 0xe8d0c0);
    s.px(x + 1, y + 1, 0x9a7a6a);
  }
  if (wreck) {
    s.poly([[17, 16], [29, 13], [37, 20], [36, 32], [27, 38], [16, 34], [13, 24]], 'K', { flat: 0.18, pat: speckle({ amt: 0.3, dark: 0.1 }) });
    for (const [x, y] of [[21, 22], [31, 27], [24, 31]]) s.poly([[x - 2.5, y], [x + 2, y - 2], [x + 3, y + 2], [x - 1, y + 3]], 't', { flat: 0.5 });
    s.dot(27, 24, 1.3, 0xf07a20);
  }
  return s.render();
}

export function coralHead(i) {
  const s = new HiSprite(45, 45, RAMPS);
  const c = 22.5;
  const a = (i / 16) * TAU;
  const dx = -Math.sin(a);
  const dy = Math.cos(a);
  s.tube(c + dx * 4, c + dy * 4, c + dx * 19, c + dy * 19, 3.2, 'D', { rb: 2.8, pat: speckle({ amt: 0.2, dark: 0.06 }) });
  s.ellipse(c + dx * 19, c + dy * 19, 3, 3, 'y', { flat: 0.6 });
  s.ellipse(c + dx * 19.4, c + dy * 19.4, 1.5, 1.5, 'K', { flat: 0.1 });
  // a little hipped roof of red akagawara tiles, the rows laid in white shikkui mortar, turning with the gun
  s.ellipse(c, c, 13, 13, 't', { pat: mix2(speckle({ amt: 0.25, dark: 0.08, light: 0.05, seed: 9 }), mottle({ amt: 0.15, scale: 5 })) });
  const ux = Math.cos(a);
  const uy = Math.sin(a);
  for (let k = -3; k <= 3; k++) {
    // mortar ridges across the roof, square to the barrel
    for (let t = -13; t <= 13; t += 0.5) {
      const x = c + ux * t + dx * k * 3.6;
      const y = c + uy * t + dy * k * 3.6;
      if (Math.hypot(x - c, y - c) < 12.4) s.px(x, y, 0xf4f0e8);
    }
  }
  // the ridge along the middle and a gold finial
  s.line(c - dx * 12, c - dy * 12, c + dx * 12, c + dy * 12, 0xf4f0e8, 2);
  s.ellipse(c, c, 2.6, 2.6, 'y', { flat: 0.75 });
  return s.render();
}

// ---------------------------------------------------------------- heavy: the reef manta (65 x 44 -> 195 x 132), head down
export const MANTA_FRAMES = 6;
export function manta(f) {
  const s = new HiSprite(195, 132, RAMPS);
  const cx = 97.5;
  const flap = 0.86 + 0.14 * Math.cos((f / MANTA_FRAMES) * TAU);
  const lift = Math.sin((f / MANTA_FRAMES) * TAU); // the wing tips rise and fall: light catches them
  const back = mix2(mottle({ amt: 0.18, scale: 10, seed: 11 }), speckle({ amt: 0.18, dark: 0.05, light: 0.03 }));
  // the whip of a tail
  s.tube(cx, 2, cx, 30, 1.2, 'm', { rb: 2.6 });
  // the wings: a broad diamond, the leading edges curved back, the tips pointed
  const hw = (y) => {
    const t = (y / 3 - 9) / 28;
    if (t < 0 || t > 1) return -1;
    return 29 * S * flap * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.05)), 0.75) * (t < 0.55 ? 1 : 1 - (t - 0.55) * 0.9);
  };
  s.paint([0, 24, 195, 114], (x, y) => Math.abs(x - cx) <= hw(y), 'm', (x, y) => 0.5 + lift * 0.12 * (Math.abs(x - cx) / 87) - (y - 60) / 300, { pat: back });
  // the white shoulder chevrons of the reef manta, either side of the head
  // (drawn into the skin, not pasted on: pale where they are thickest, fading out into the dark at their edges, mottled)
  for (const sx of [-1, 1]) {
    const pts = [[cx + sx * 8, 66], [cx + sx * 32, 52], [cx + sx * 40, 60], [cx + sx * 20, 78], [cx + sx * 9, 82]];
    for (let y = 44; y < 92; y++) for (let x = 0; x < 195; x++) {
      if (s.mat[y * 195 + x] !== 'm') continue;
      // how far inside the chevron (by the distance to its centre line)
      const t = Math.min(1, Math.max(0, (x - cx) * sx - 6) / 34);
      const cyl = 76 - t * 22;
      const half = 12 * (1 - t * 0.75);
      const d = Math.abs(y - cyl) / Math.max(1, half);
      const n = Math.sin(x * 0.31 + y * 0.17) * 0.12 + Math.sin(x * 0.13 - y * 0.23) * 0.12;
      const k = 1 - d + n;
      if (k > 0) s.px(x, y, k > 0.55 ? 0xd8dce4 : k > 0.25 ? 0xa8b0bc : 0x6a7484, Math.min(0.9, k * 1.4));
    }
  }
  // the robot: a steel spine plate, panel lines and the cyan seams glowing along them, rivets
  s.poly([[cx - 6, 52], [cx + 6, 52], [cx + 8, 80], [cx, 86], [cx - 8, 80]], 'S', { flat: 0.55, pat: speckle({ amt: 0.2, dark: 0.06 }) });
  s.dot(cx, 64, 2.4, 0x3fd8e8);
  s.dot(cx - 1, 63, 0.8, 0xe8ffff);
  for (const sx of [-1, 1]) {
    s.line(cx + sx * 9, 42, cx + sx * 60 * flap, 69, 0x3fd8e8, 2);
    s.line(cx + sx * 9, 78, cx + sx * 42 * flap, 72, 0x3fd8e8, 2);
    s.line(cx + sx * 20, 46, cx + sx * 20, 92, 0x141c28, 1);
    for (let k = 0; k < 6; k++) s.px(cx + sx * (24 + k * 9) * flap, 60 + k * 1.5, 0x9ea6d0);
  }
  // the head at the front (bottom): the cephalic fins curled forward, the wide mouth, the eyes on the sides
  for (const sx of [-1, 1]) {
    s.tube(cx + sx * 14, 104, cx + sx * 13, 121, 3.4, 'm', { rb: 2.4, pat: back });
    s.ellipse(cx + sx * 13, 122, 2.6, 2.2, 'W', { flat: 0.6 });
    s.dot(cx + sx * 23.5, 101, 2, 0xff6a3a);
    s.dot(cx + sx * 23.5, 101, 0.9, 0xfff0d0);
  }
  s.poly([[cx - 12, 108], [cx + 12, 108], [cx + 10, 114], [cx - 10, 114]], 'K', { flat: 0.15 });
  s.line(cx - 11, 109, cx + 11, 109, 0x4a5a70, 1);
  return s.render();
}

// ---------------------------------------------------------------- boss: the shisa pair (shisa540.mjs)

/**
 * A hitodama: the soul of the fallen shisa, a teardrop of golden fire with a wavering tail (4 frames), flying
 * to the survivor in the third phase's break.
 */
export function soul(f) {
  const w = 36;
  const h = 54;
  const out = new Raster(w, h);
  const cx = w / 2;
  const cy = 16;
  const r = 9;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      // the round head, and a tail that thins and sways below it
      const ty = (y - cy) / (h - cy - 4);
      const sway = Math.sin(ty * 5 - f * (Math.PI / 2)) * 4 * ty;
      const tw = r * (1 - ty) ** 1.4;
      const head = 1 - Math.hypot(x - cx, (y - cy) * 1.05) / r;
      const tail = ty > 0 && ty < 1 ? 1 - Math.abs(x - cx - sway) / Math.max(0.5, tw) : -1;
      let v = Math.max(head, tail * 0.9);
      v += (fbm(x, y + f * 6, { seed: 61, scale: 5, octaves: 2 }) - 0.5) * 0.35;
      const halo = 1 - Math.hypot(x - cx, y - cy) / (r + 7);
      if (v > 0.6) out.set(x, y, 0xffffff);
      else if (v > 0.38) out.set(x, y, 0xfff0a0);
      else if (v > 0.16) out.set(x, y, 0xffb840, 0.9);
      else if (v > 0) out.set(x, y, 0xe06a10, 0.65);
      else if (halo > 0) out.set(x, y, 0xffc860, Math.round(halo * 3) / 3 * 0.35);
    }
  return out;
}

export function okinawaEnemies(add) {
  for (let f = 0; f < 4; f++) {
    add(`tobiuo_${f}`, tobiuo(f));
    add(`hari_${f}`, hari(f));
    add(`habu_${f}`, habu(f));
    for (const c of ['red', 'blue', 'green', 'purple']) add(`glass_${c}_${f}`, glass(c, f));
    add(`shisa_a_${f}`, shisa(true, f));
    add(`shisa_un_${f}`, shisa(false, f));
  }
  add('coral_base', coralBase(false));
  add('coral_wreck', coralBase(true));
  for (let i = 0; i < 16; i++) add(`coral_head_${i}`, coralHead(i));
  for (let f = 0; f < MANTA_FRAMES; f++) add(`manta_${f}`, manta(f));
  for (let f = 0; f < 4; f++) add(`shisa_soul_${f}`, soul(f)); // step 2a: the third phase's soul
}
export const OKINAWA_PORTRAITS = ['shisa_a_0', 'shisa_un_0'];
