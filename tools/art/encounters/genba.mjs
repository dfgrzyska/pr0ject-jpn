// Random encounter 3 (ex3): the construction site cat and its tower. The cat is the game's own: a ginger tabby with
// a white muzzle and white socks, a yellow hard hat with a headlamp and a green cross on the front, an orange
// high-vis vest with silver stripes, a spanner in its paw. The tower it is building: a steel frame wrapped in
// scaffolding and the green mesh Japanese sites hang round them, floors, a little crane on the roof; then cracked
// and leaning; then a heap of rubble. Its I-beams, the crane's hook, a spanner, its hard hat thrown.
import { HiSprite, tones, fur, speckle, mix2 } from '../../lib/hisprite.mjs';

const INK = 0x14101c;
const RAMPS = {
  c: tones([0x8a4a14, 0xe0882a, 0xffc878]), // ginger fur
  w: tones([0x9a948a, 0xeae6de, 0xffffff]), // white fur
  y: tones([0x9a7a10, 0xf0c830, 0xfff6a8]), // the hard hat
  v: tones([0x9a3a08, 0xf06a18, 0xffb070]), // the vest
  s: tones([0x5a5a64, 0xb8bac4, 0xf4f6ff]), // steel, the stripes
  f: tones([0x5a1a10, 0xa83a20, 0xe07050]), // the tower's steel, red primer
  n: [0x0a2a1a, 0x1a4a2a, 0x2a6a3a, 0x4a8a50, 0x8ac088], // the green mesh
  p: tones([0x6a5a40, 0xa8946a, 0xd8c8a0]), // scaffold boards
  k: tones([0x18161e, 0x2e2c36, 0x4e4c58]), // dark
  g: tones([0x4a4846, 0x8a8682, 0xc4c0ba]), // concrete, rubble
  e: tones([0x2a6a2a, 0x4ab84a, 0xa8f0a0]), // eyes, the green cross
};
const silk = (seed, a = Math.PI / 2) => ({ pat: mix2(fur(a, { amt: 0.14, len: 6, w: 1.4, gap: 0.05, seed }), speckle({ amt: 0.04 })) });

// ---------------------------------------------------------------- the cat (24 x 30 -> 72 x 90)
// pose: 0 standing, 1 arm up (throwing), 'pounce' crouched to spring, 'hiss' angry (phase 3); bare: its hat
// thrown (it comes back like a boomerang)
export function cat(pose, bare = false) {
  const s = new HiSprite(72, 90, RAMPS);
  const cx = 36;
  const arm = pose === 1;
  const hiss = pose === 'hiss';
  const crouch = pose === 'pounce';
  const hat = !bare;
  const by = crouch ? 6 : 0; // (crouched: lower)
  // the tail, striped, curling up behind
  s.tube(cx + 14, 76, cx + 28, 52, 4, 'c', { rb: 3.2, ...silk(3) });
  s.tube(cx + 28, 52, cx + 24, 36, 3.2, 'c', { rb: 2.4, ...silk(4) });
  for (let k = 0; k < 4; k++) s.line(cx + 16 + k * 3.5, 72 - k * 7, cx + 20 + k * 3.5, 70 - k * 7, 0x8a4a14, 1);
  // the legs, white socks
  for (const sx of [-1, 1]) {
    s.tube(cx + sx * 8, 66 + by * 0.5, cx + sx * (crouch ? 14 : 9), 84, 5, 'c', { rb: 4, ...silk(5) });
    s.ellipse(cx + sx * (crouch ? 14 : 9), 85, 5.5, 3.5, 'w', { flat: 0.8 });
  }
  // the body in its vest, silver stripes
  s.ellipse(cx, 58 + by, 15, 16, 'c', { bias: 0.05, ...silk(7) });
  s.paint([cx - 16, 44 + by, cx + 16, 72 + by], (x, y) => ((x - cx) / 15) ** 2 + ((y - 58 - by) / 15.5) ** 2 < 1 && y > 46 + by, 'v', (x) => 0.6 - (x - cx) / 60);
  for (const yy of [56, 64]) for (let x = cx - 14; x <= cx + 14; x++) if (((x - cx) / 15) ** 2 + ((yy + by - 58 - by) / 15.5) ** 2 < 1) s.px(x, yy + by, 0xe8eaf0);
  s.paint([cx - 4, 44 + by, cx + 4, 70 + by], (x, y) => Math.abs(x - cx) < 3 && y > 46 + by && y < 70 + by, 'w', () => 0.8); // the white chest down the middle
  // the arms: one holding the spanner, the other raised to throw (or both out, pouncing)
  for (const sx of [-1, 1]) {
    const up = arm && sx > 0;
    const hx = cx + sx * (crouch ? 20 : 17);
    const hy = up ? 30 + by : crouch ? 66 : 62 + by;
    s.tube(cx + sx * 11, 50 + by, hx, hy, 4, 'c', { rb: 3.4, ...silk(9 + sx) });
    s.ellipse(hx, hy, 4.2, 3.6, 'w', { flat: 0.82 });
    if (sx < 0 && !crouch) {
      // the spanner
      s.tube(hx, hy, hx - 2, hy + 14, 1.8, 's', { rb: 1.6 });
      s.ellipse(hx - 2, hy + 15, 3.4, 2.6, 's', { flat: 0.7 });
      s.ellipse(hx - 2, hy + 16, 1.4, 1.2, 'k', { flat: 0.3 });
    }
  }
  // the head: round, ginger stripes on the brow, white muzzle, ears; the eyes (slit when hissing), whiskers
  const hy = 30 + by;
  s.ellipse(cx, hy, 16, 14, 'c', { bias: 0.06, ...silk(11) });
  for (const sx of [-1, 1]) s.poly([[cx + sx * 6, hy - 10], [cx + sx * 15, hy - 22], [cx + sx * 15, hy - 6]], 'c', { flat: 0.6 });
  for (const sx of [-1, 1]) s.poly([[cx + sx * 9, hy - 10], [cx + sx * 13, hy - 18], [cx + sx * 13, hy - 9]], 'w', { flat: 0.55 });
  for (let k = -1; k <= 1; k++) s.line(cx + k * 4, hy - 13, cx + k * 4.5, hy - 7, 0x8a4a14, 1);
  s.ellipse(cx, hy + 6, 9, 6, 'w', { flat: 0.82 });
  for (const sx of [-1, 1]) {
    s.ellipse(cx + sx * 6.5, hy - 1, 3.6, hiss ? 2 : 3.4, 'e', { flat: 0.95, glow: true });
    s.line(cx + sx * 6.5, hy - 3, cx + sx * 6.5, hy + 1.5, INK, 1);
    if (hiss) s.line(cx + sx * 10, hy - 5, cx + sx * 3, hy - 3, INK, 1);
    for (const dy of [-1, 2]) s.line(cx + sx * 8, hy + 6 + dy, cx + sx * 20, hy + 4 + dy * 2, 0xf4f4f0, 1, 0.8);
  }
  s.poly([[cx - 2, hy + 3], [cx + 2, hy + 3], [cx, hy + 5]], 'k', { flat: 0.6 }); // the nose
  if (hiss) {
    s.paint([cx - 5, hy + 6, cx + 5, hy + 12], (x, y) => Math.abs(x - cx) < 4.5 - (y - hy - 6) * 0.4 && y > hy + 6.5, 'k', () => 0.2);
    for (const sx of [-1, 1]) s.poly([[cx + sx * 3.5, hy + 7], [cx + sx * 2, hy + 7], [cx + sx * 2.8, hy + 10]], 'w', { flat: 0.95 });
  } else {
    s.line(cx, hy + 5, cx - 3, hy + 8, INK, 1);
    s.line(cx, hy + 5, cx + 3, hy + 8, INK, 1);
  }
  if (hat) {
    // the hard hat: dome, brim, the green cross, the headlamp
    s.paint([cx - 18, hy - 26, cx + 18, hy - 6], (x, y) => ((x - cx) / 15) ** 2 + ((y - hy + 9) / 15) ** 2 < 1 && y < hy - 8, 'y', (x, y) => 0.7 - (x - cx) / 50 - (y - hy + 20) / 80);
    s.paint([cx - 19, hy - 10, cx + 19, hy - 6], (x, y) => Math.abs(x - cx) < 18.5 && y > hy - 10 && y < hy - 6.5, 'y', () => 0.45);
    for (let k = -2; k <= 2; k++) {
      s.px(cx + k, hy - 16, 0x2a8a2a);
      s.px(cx, hy - 16 + k, 0x2a8a2a);
    }
    s.ellipse(cx, hy - 11.5, 3.4, 2.2, 'w', { flat: 1, glow: true });
    s.line(cx - 14, hy - 12, cx + 14, hy - 12, 0x4a4a52, 1, 0.8);
  }
  return s.render();
}

// ---------------------------------------------------------------- the tower (52 x 80 -> 156 x 240)
// state 0: being built; 1: cracked, leaning, pieces gone (phase 2); 'rubble': a heap (phase 3)
export function tower(state) {
  const s = new HiSprite(156, 240, RAMPS);
  if (state === 'rubble') {
    // a heap of concrete, bent red beams sticking out, a scrap of the green mesh, dust
    s.paint([4, 150, 152, 238], (x, y) => y > 236 - Math.max(0, 70 - Math.abs(x - 78) * 0.8) - Math.sin(x * 0.3) * 4, 'g', (x, y) => 0.5 - (x - 78) / 300 + Math.sin(x * 0.7 + y * 0.4) * 0.12);
    for (const [x0, y0, x1, y1] of [[40, 220, 70, 168], [90, 230, 120, 176], [60, 225, 104, 190], [110, 228, 136, 200]]) s.tube(x0, y0, x1, y1, 3, 'f', { rb: 2.5 });
    s.poly([[20, 230], [46, 200], [60, 232]], 'n', { flat: 0.45 });
    return s.render();
  }
  const lean = state === 1;
  const sx = (y) => (lean ? (240 - y) * 0.06 : 0); // (leaning: the higher, the further over)
  // the green mesh round the scaffolding, hung in panels
  s.paint([0, 30, 156, 236], (x, y) => x - sx(y) > 6 && x - sx(y) < 150 && y > 34 && y < 234 && !(lean && x - sx(y) > 110 && y < 110), 'n', (x, y) => 0.4 + (Math.floor((x - sx(y)) / 24) % 2 ? 0.08 : -0.02) + (y % 40 < 2 ? -0.2 : 0), { pat: speckle({ amt: 0.06 }) });
  // the steel frame behind it showing through where the mesh is tied back: columns, floors
  for (const fx of [24, 66, 108]) s.paint([0, 34, 156, 236], (x, y) => Math.abs(x - sx(y) - fx - 12) < 10 && y > 40 && y < 230 && y % 40 > 6, 'k', () => 0.2);
  for (const fx of [24, 66, 108]) for (let y = 40; y < 230; y++) if (y % 40 > 6) for (const dx of [fx + 3, fx + 20]) for (let i = 0; i < 3; i++) s.px(dx + i + sx(y), y, i === 1 ? 0xd05030 : 0x7a2a18);
  for (let fy = 40; fy < 236; fy += 40) for (let x = 8; x < 148; x++) for (let j = 0; j < 4; j++) s.px(x + sx(fy), fy + j, j === 0 ? 0xe07050 : 0x7a2a18);
  // the scaffold poles and boards outside the mesh
  for (const px of [4, 150]) for (let y = 30; y < 236; y++) for (let i = 0; i < 2; i++) s.px(px + i + sx(y), y, 0xc8cad0);
  for (let fy = 72; fy < 236; fy += 40) for (let x = 2; x < 154; x++) for (let j = 0; j < 3; j++) s.px(x + sx(fy), fy + j, j === 0 ? 0xd8c8a0 : 0x8a7a54);
  // the roof: the little crane, its boom out over the side
  s.paint([40, 8, 116, 34], (x, y) => x - sx(y) > 44 && x - sx(y) < 112 && y > 22 && y < 34, 'f', () => 0.55);
  for (let k = 0; k < 18; k++) s.px(70 + sx(20) + k * 0.2, 22 - k, 0xf0c830);
  for (let k = 0; k < 60; k++) {
    s.px(72 + k + sx(6), 6 + k * 0.05, 0xf0c830);
    s.px(72 + k + sx(8), 8 + k * 0.05, 0x9a7a10);
  }
  if (lean) {
    // cracks, a corner gone, a floor sagging, sparks
    for (const [x0, y0, x1, y1] of [[30, 120, 60, 150], [60, 150, 52, 190], [100, 80, 130, 104]]) s.line(x0 + sx(y0), y0, x1 + sx(y1), y1, 0xf4f0e8, 1);
    s.dot(118 + sx(110), 112, 2, 0xfff0a0);
  }
  return s.render();
}

// ---------------------------------------------------------------- what it throws and drops
export function ibeam() {
  const s = new HiSprite(27, 123, RAMPS); // (9 x 41 -> 27 x 123), falling end on
  s.paint([2, 2, 25, 121], (x, y) => x >= 3 && x <= 24 && y >= 3 && y <= 120 && (x < 8 || x > 19 || Math.abs(x - 13.5) < 2.5), 'f', (x) => 0.65 - (x - 3) / 60);
  for (let y = 10; y < 118; y += 18) s.dot(5.5, y, 1.2, 0xe8a080);
  return s.render();
}

export function hook() {
  const s = new HiSprite(36, 54, RAMPS);
  s.paint([8, 0, 28, 20], (x, y) => x > 9 && x < 27 && y < 20, 'y', (x) => 0.7 - (x - 9) / 40); // the block, yellow
  s.tube(18, 20, 18, 30, 2.4, 's', { rb: 2.4 });
  // the hook itself, a curl of steel
  for (let a = 0; a < Math.PI * 1.5; a += 0.05) s.dot(18 + Math.cos(a + Math.PI) * 9, 40 + Math.sin(a + Math.PI) * 9 * -1, 2.4, 0xb8bac4);
  return s.render();
}

export function spanner(f) {
  const s = new HiSprite(36, 36, RAMPS);
  const a = (f * Math.PI) / 4;
  const ex = 18 + Math.cos(a) * 12;
  const ey = 18 + Math.sin(a) * 12;
  s.tube(18 - Math.cos(a) * 12, 18 - Math.sin(a) * 12, ex, ey, 2.4, 's', { rb: 2.4 });
  s.ellipse(ex, ey, 4.4, 4.4, 's', { flat: 0.7 });
  s.ellipse(ex + Math.cos(a) * 2, ey + Math.sin(a) * 2, 2, 2, 'k', { flat: 0.2 });
  return s.render();
}

export function hardhat(f) {
  const s = new HiSprite(39, 27, RAMPS);
  s.paint([2, 2, 37, 24], (x, y) => ((x - 19.5) / 15) ** 2 + ((y - 18) / 14) ** 2 < 1 && y < 20, 'y', (x, y) => 0.75 - (x - 19.5) / 50 - (y - 6) / 60);
  s.paint([0, 18, 39, 24], (x, y) => Math.abs(x - 19.5) < 18 && y > 18 && y < 22, 'y', () => 0.45);
  s.ellipse(19.5, 15, 3, 2, 'w', { flat: 1, glow: !!f });
  return s.render();
}

export function genbaEnemies(add) {
  add('neko_0', cat(0));
  add('neko_1', cat(1));
  add('neko_pounce', cat('pounce'));
  add('neko_hiss', cat('hiss'));
  add('neko_hiss_bare', cat('hiss', true));
  add('neko_pounce_bare', cat('pounce', true));
  add('tower_0', tower(0));
  add('tower_1', tower(1));
  add('tower_rubble', tower('rubble'));
  add('ibeam', ibeam());
  add('crane_hook', hook());
  for (let f = 0; f < 4; f++) add(`spanner_${f}`, spanner(f));
  for (let f = 0; f < 2; f++) add(`hardhat_${f}`, hardhat(f));
}
