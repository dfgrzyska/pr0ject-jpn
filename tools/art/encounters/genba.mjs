// Random encounter 3 (ex3): the construction site cat and its tower. The cat is the game's own: a big ginger tabby
// with a white muzzle, chest and socks, a yellow hard hat with a headlamp and a green cross on the front, an orange
// high-vis vest with silver bands, a tool belt; never the pose or the catchphrase of the known meme. Its frames: at
// ease (breathing, its tail swaying), blinking, winding up and throwing, hissing; crouched with its rump wiggling
// before a pounce, in the leap, landing; a claw raised and swiped; running flat out (its zoomies); sitting to wash a
// paw. Hatless versions of all that (its hat thrown). The tower it is building: a steel frame wrapped in scaffolding
// and the green mesh Japanese sites hang round them, hazard stripes, a lamp on the roof, a tower crane; then cracked
// and leaning; then a heap of rubble. Its I-beams and their shadows, the crane's hook, a spanner, its hard hat thrown,
// lumps of rubble, dust, its claw marks.
import { HiSprite, tones, fur, speckle, mix2 } from '../../lib/hisprite.mjs';

const INK = 0x14101c;
const RAMPS = {
  c: tones([0x8a4a14, 0xe0882a, 0xffc878]), // ginger fur
  d: tones([0x5a2a08, 0xa8541a, 0xd8803a]), // its stripes
  w: tones([0x9a948a, 0xeae6de, 0xffffff]), // white fur
  y: tones([0x9a7a10, 0xf0c830, 0xfff6a8]), // the hard hat
  v: tones([0x9a3a08, 0xf06a18, 0xffb070]), // the vest
  s: tones([0x5a5a64, 0xb8bac4, 0xf4f6ff]), // steel, the bands
  f: tones([0x5a1a10, 0xa83a20, 0xe07050]), // the tower's steel, red primer
  n: [0x0a2a1a, 0x1a4a2a, 0x2a6a3a, 0x4a8a50, 0x8ac088], // the green mesh
  p: tones([0x6a5a40, 0xa8946a, 0xd8c8a0]), // scaffold boards
  k: tones([0x18161e, 0x2e2c36, 0x4e4c58]), // dark
  g: tones([0x4a4846, 0x8a8682, 0xc4c0ba]), // concrete, rubble
  e: tones([0x2a6a2a, 0x4ab84a, 0xa8f0a0]), // eyes, the green cross
  b: tones([0x3a2414, 0x6a4428, 0x9a6a40]), // the tool belt, leather
  r: tones([0x8a2a3a, 0xe07a8a, 0xffc0c8]), // the pink of nose, tongue, pads
};
const silk = (seed, a = Math.PI / 2) => ({ pat: mix2(fur(a, { amt: 0.14, len: 6, w: 1.4, gap: 0.05, seed }), speckle({ amt: 0.04 })) });

// ---------------------------------------------------------------- the cat (40 x 44 -> 120 x 132)
// pose: 'stand' | 'blink' | 'throw0' | 'throw1' | 'hiss' | 'crouch0' | 'crouch1' | 'leap' | 'land' | 'scratch0' |
// 'scratch1' | 'run0' | 'run1' | 'nap'; idle: 0 / 1 (breathing, the tail); bare: its hat thrown
export function cat(pose, { bare = false, idle = 0 } = {}) {
  const s = new HiSprite(120, 132, RAMPS);
  const cx = 60;
  const crouch = pose === 'crouch0' || pose === 'crouch1';
  const leap = pose === 'leap';
  const land = pose === 'land';
  const run = pose === 'run0' || pose === 'run1';
  const nap = pose === 'nap';
  // where things are: lower when crouched or landing, stretched when leaping, the breath lifting it a little
  const by = (crouch ? 14 : land ? 10 : nap ? 8 : leap ? -6 : 0) - (idle ? 1 : 0);
  const hy = 40 + by + (crouch ? 6 : 0); // the head's centre
  const wig = pose === 'crouch1' ? 4 : pose === 'crouch0' ? -4 : 0; // the rump wiggling before a pounce
  // ---- the tail, ringed, behind it all (up and curling at ease, lashing when angry, low and swishing crouched)
  const angry = pose === 'hiss' || pose.startsWith('scratch') || run;
  const tail = crouch ? [[cx + 18 + wig, 104 + by], [cx + 36 + wig * 2, 108 + by], [cx + 50 + wig * 3, 98 + by]]
    : leap ? [[cx + 14, 100 + by], [cx + 30, 116 + by], [cx + 46, 124 + by]]
      : nap ? [[cx + 20, 112 + by], [cx + 36, 120 + by], [cx + 20, 126 + by]]
        : [[cx + 18, 104 + by], [cx + 34 + (idle ? 2 : 0), 84 + by], [cx + 30 + (angry ? 8 : idle ? 4 : 0), 60 + by - (angry ? 6 : 0)]];
  for (let k = 0; k < tail.length - 1; k++) {
    const [ax, ay] = tail[k];
    const [bx, bb] = tail[k + 1];
    s.tube(ax, ay, bx, bb, angry ? 6.5 - k : 5.5 - k * 0.8, 'c', { rb: angry ? 5.5 - k : 4.6 - k * 0.8, ...silk(3 + k) });
    for (let q = 0.2; q < 1; q += 0.3) s.line(ax + (bx - ax) * q - 4, ay + (bb - ay) * q, ax + (bx - ax) * q + 4, ay + (bb - ay) * q + 2, 0x8a4a14, 2);
  }
  const [tx, ty] = tail[tail.length - 1];
  s.ellipse(tx, ty, angry ? 6 : 4.6, angry ? 6 : 4.6, 'w', { bias: 0.1 });
  // ---- the legs and feet (white socks)
  const legs = crouch ? [[-14 + wig, 112, -18, 122], [14 + wig, 112, 18, 122]]
    : leap ? [[-10, 104, -16, 124], [10, 104, 16, 124]]
      : land ? [[-14, 108, -24, 120], [14, 108, 24, 120]]
        : run ? (pose === 'run0' ? [[-10, 104, -20, 116], [10, 104, 14, 124]] : [[-10, 104, -14, 124], [10, 104, 20, 116]])
          : nap ? [[-12, 112, -16, 124], [12, 112, 16, 124]]
            : [[-11, 104, -12, 124], [11, 104, 12, 124]];
  for (const [x0, y0, x1, y1] of legs) {
    s.tube(cx + x0, y0 + by * 0.4, cx + x1, y1, 6.5, 'c', { rb: 5.5, ...silk(5) });
    s.ellipse(cx + x1, y1 + 2, 7, 4.6, 'w', { flat: 0.82 });
    for (let t = -1; t <= 1; t++) s.line(cx + x1 + t * 2.6, y1 + 3, cx + x1 + t * 2.6, y1 + 6, 0xb8b0a4, 1);
  }
  // ---- the body: round, the white chest down the middle, the vest over it with its silver bands, the tool belt
  const bx = cx + wig * 0.5;
  const bcy = 86 + by;
  const brx = crouch ? 25 : 22;
  const bry = crouch ? 20 : leap ? 26 : 23;
  s.ellipse(bx, bcy, brx, bry, 'c', { bias: 0.05, ...silk(7) });
  for (let k = -1; k <= 1; k++) s.line(bx - brx + 3, bcy - 8 + k * 9, bx - brx + 9, bcy - 6 + k * 9, 0x8a4a14, 2); // the tabby stripes on its flank
  s.paint([bx - brx - 1, bcy - bry, bx + brx + 1, bcy + bry], (x, y) => ((x - bx) / (brx - 0.5)) ** 2 + ((y - bcy) / (bry - 0.5)) ** 2 < 1 && y > bcy - bry + 6, 'v', (x, y) => 0.62 - (x - bx) / 70 - (y - bcy) / 120, { pat: speckle({ amt: 0.04 }) });
  for (const yy of [bcy - 2, bcy + 8]) for (let x = bx - brx + 2; x <= bx + brx - 2; x++) if (((x - bx) / brx) ** 2 + ((yy - bcy) / bry) ** 2 < 1) for (let j = 0; j < 2; j++) s.px(x, yy + j, j ? 0xa8aab4 : 0xf4f6ff);
  s.paint([bx - 6, bcy - bry, bx + 6, bcy + bry], (x, y) => Math.abs(x - bx) < 5 - (y - bcy) * 0.05 && y > bcy - bry + 4 && y < bcy + bry - 6, 'w', () => 0.85, silk(8));
  s.paint([bx - brx, bcy + 13, bx + brx, bcy + 19], (x, y) => ((x - bx) / brx) ** 2 + ((y - bcy) / bry) ** 2 < 1 && y > bcy + 13 && y < bcy + 19, 'b', () => 0.5);
  s.paint([bx - 3, bcy + 12, bx + 3, bcy + 20], (x, y) => Math.abs(x - bx) < 3 && y > bcy + 12 && y < bcy + 20, 's', () => 0.75); // the buckle
  // ---- the arms
  const arm = (sx, hx, hy2, claws = false) => {
    s.tube(bx + sx * 15, bcy - 14, hx, hy2, 6, 'c', { rb: 5, ...silk(9 + sx) });
    s.ellipse(hx, hy2, 6.4, 5.6, 'w', { flat: 0.84 });
    if (claws) for (let t = -1; t <= 1; t++) s.poly([[hx + t * 3 - 1, hy2 - 4], [hx + t * 3 + 1, hy2 - 4], [hx + t * 3.6, hy2 - 11]], 'w', { flat: 1 });
  };
  if (pose === 'throw0') { arm(-1, bx - 20, bcy + 6); arm(1, bx + 30, bcy - 30); }
  else if (pose === 'throw1') { arm(-1, bx - 20, bcy + 6); arm(1, bx + 14, bcy - 44); }
  else if (pose === 'hiss') { arm(-1, bx - 28, bcy - 10, true); arm(1, bx + 28, bcy - 10, true); }
  else if (pose === 'scratch0') { arm(-1, bx - 20, bcy + 4); arm(1, bx + 32, bcy - 40, true); }
  else if (pose === 'scratch1') { arm(-1, bx - 20, bcy + 4); arm(1, bx - 10, bcy + 14, true); }
  else if (crouch) { arm(-1, bx - 22, 118); arm(1, bx + 22, 118); }
  else if (leap) { arm(-1, bx - 26, bcy - 42, true); arm(1, bx + 26, bcy - 42, true); }
  else if (land) { arm(-1, bx - 32, 116, true); arm(1, bx + 32, 116, true); }
  else if (run) { arm(-1, bx - 24, bcy + (pose === 'run0' ? -8 : 10)); arm(1, bx + 24, bcy + (pose === 'run0' ? 10 : -8)); }
  else if (nap) { arm(-1, bx - 18, bcy + 10); arm(1, bx + 4, hy + 18); } // a paw up to its mouth, washing
  else { arm(-1, bx - 20, bcy + 10); arm(1, bx + 20, bcy + 10 - idle); }
  // ---- the head: round, stripes on the brow, the white muzzle, ears; its face by mood; whiskers
  const hx = cx + (pose === 'scratch0' ? -2 : 0);
  s.ellipse(hx, hy, 23, 20, 'c', { bias: 0.06, ...silk(11) });
  for (const sx of [-1, 1]) {
    const flat = pose === 'hiss' || crouch; // ears flattened back
    s.poly([[hx + sx * 8, hy - 14], [hx + sx * (flat ? 26 : 21), hy - (flat ? 22 : 32)], [hx + sx * 22, hy - 6]], 'c', { flat: 0.6 });
    s.poly([[hx + sx * 12, hy - 14], [hx + sx * (flat ? 23 : 19), hy - (flat ? 20 : 27)], [hx + sx * 19, hy - 11]], 'r', { flat: 0.55 });
  }
  for (let k = -1; k <= 1; k++) s.line(hx + k * 5, hy - 19, hx + k * 5.5, hy - 10, 0x8a4a14, 2);
  for (const sx of [-1, 1]) for (let k = 0; k < 2; k++) s.line(hx + sx * 22, hy - 2 + k * 6, hx + sx * 15, hy - 1 + k * 6, 0x8a4a14, 2);
  s.ellipse(hx, hy + 9, 13, 8.5, 'w', { flat: 0.84 });
  const closed = pose === 'blink' || nap;
  for (const sx of [-1, 1]) {
    const ex = hx + sx * 9;
    const ey = hy - 1;
    if (closed) {
      s.line(ex - 4, ey + 1, ex, ey + 3, INK, 2);
      s.line(ex, ey + 3, ex + 4, ey + 1, INK, 2);
    } else {
      const narrow = pose === 'hiss' || crouch || pose.startsWith('scratch');
      s.ellipse(ex, ey, 5.2, narrow ? 3 : 5, 'e', { flat: 0.95, glow: true });
      // pupils: slits when angry, round and wide when about to pounce or running flat out
      if (crouch || run || leap) s.ellipse(ex, ey, 2.6, narrow ? 2.4 : 3.6, 'k', { flat: 0.1, glow: true });
      else s.line(ex, ey - (narrow ? 2 : 4), ex, ey + (narrow ? 2 : 4), INK, 2);
      s.dot(ex - 1.8, ey - 1.8, 1.1, 0xffffff);
      if (narrow) s.line(ex - sx * 6, ey - 6, ex + sx * 4, ey - 3, INK, 2); // a cross brow
    }
    for (const dy of [-1, 3]) s.line(hx + sx * 11, hy + 9 + dy, hx + sx * 30, hy + 6 + dy * 2, 0xf4f4f0, 1, 0.85); // whiskers
  }
  s.poly([[hx - 3, hy + 4], [hx + 3, hy + 4], [hx, hy + 7]], 'r', { flat: 0.7 }); // the nose
  if (pose === 'hiss' || pose.startsWith('scratch') || leap) {
    // mouth open: fangs, the pink inside
    s.paint([hx - 7, hy + 8, hx + 7, hy + 17], (x, y) => Math.abs(x - hx) < 7 - (y - hy - 8) * 0.5 && y > hy + 8.5, 'k', () => 0.2);
    s.paint([hx - 4, hy + 12, hx + 4, hy + 16], (x, y) => Math.abs(x - hx) < 3.5 - (y - hy - 12) * 0.5 && y > hy + 12, 'r', () => 0.6);
    for (const sx of [-1, 1]) s.poly([[hx + sx * 5, hy + 9], [hx + sx * 2.6, hy + 9], [hx + sx * 3.8, hy + 13.5]], 'w', { flat: 0.98 });
  } else if (nap) s.ellipse(hx + 2, hy + 12, 2.4, 2, 'r', { flat: 0.7 }); // the tongue out, washing
  else {
    s.line(hx, hy + 7, hx - 4, hy + 10, INK, 1);
    s.line(hx, hy + 7, hx + 4, hy + 10, INK, 1);
  }
  if (!bare) {
    // the hard hat: dome, brim, the green cross, the headlamp (lit), the strap
    s.paint([hx - 24, hy - 38, hx + 24, hy - 8], (x, y) => ((x - hx) / 20) ** 2 + ((y - hy + 13) / 21) ** 2 < 1 && y < hy - 11, 'y', (x, y) => 0.74 - (x - hx) / 60 - (y - hy + 26) / 90);
    s.paint([hx - 25, hy - 15, hx + 25, hy - 9], (x, y) => Math.abs(x - hx) < 24.5 && y > hy - 15 && y < hy - 9.5, 'y', () => 0.45);
    s.line(hx - 15, hy - 30, hx + 15, hy - 30, 0xc8a020, 1);
    for (let k = -3; k <= 3; k++) {
      s.px(hx + k, hy - 24, 0x2a8a2a);
      s.px(hx, hy - 24 + k, 0x2a8a2a);
    }
    s.ellipse(hx, hy - 16.5, 4.6, 3, 'w', { flat: 1, glow: true });
    s.line(hx - 18, hy - 17, hx + 18, hy - 17, 0x4a4a52, 1, 0.8);
  }
  if (run) for (let k = 0; k < 3; k++) s.dot(cx - 26 - k * 7, 124 - k * 2, 3 - k * 0.7, 0xc8b8a0, 0.7); // dust kicked up
  return s.render();
}

// ---------------------------------------------------------------- the tower (62 x 90 -> 186 x 270)
// state 0 / 1: being built (the roof lamp off / on); 'lean': cracked, leaning, pieces gone (phase 2); 'rubble'
export function tower(state) {
  const s = new HiSprite(186, 270, RAMPS);
  if (state === 'rubble') {
    // a heap of concrete and broken boards, bent red beams sticking out, a scrap of the green mesh, a tilted crane
    s.paint([4, 160, 182, 268], (x, y) => y > 266 - Math.max(0, 88 - Math.abs(x - 93) * 0.9) - Math.sin(x * 0.3) * 4, 'g', (x, y) => 0.5 - (x - 93) / 300 + Math.sin(x * 0.7 + y * 0.4) * 0.12, { pat: speckle({ amt: 0.06 }) });
    for (const [x0, y0, x1, y1] of [[46, 250, 80, 186], [100, 258, 136, 196], [70, 252, 120, 214], [128, 256, 160, 226], [30, 260, 60, 230]]) s.tube(x0, y0, x1, y1, 3.4, 'f', { rb: 2.8 });
    for (const [x0, y0, x1, y1] of [[20, 240, 70, 250], [110, 236, 170, 246]]) s.tube(x0, y0, x1, y1, 2.6, 'p', { rb: 2.6 });
    s.poly([[22, 258], [52, 222], [70, 262]], 'n', { flat: 0.45 });
    s.poly([[130, 262], [150, 232], [176, 264]], 'n', { flat: 0.4 });
    return s.render();
  }
  const lean = state === 'lean';
  const sx = (y) => (lean ? (270 - y) * 0.07 : 0); // (leaning: the higher, the further over)
  const X0 = 8;
  const X1 = 178;
  const TOP = 44;
  // the green mesh round the scaffolding, hung in panels, tied back here and there to show the frame
  s.paint([0, TOP, 186, 266], (x, y) => x - sx(y) > X0 && x - sx(y) < X1 && y > TOP && y < 264 && !(lean && x - sx(y) > 128 && y < 120), 'n', (x, y) => 0.42 + (Math.floor((x - sx(y)) / 28) % 2 ? 0.08 : -0.03) + (y % 44 < 2 ? -0.22 : 0) + (Math.floor((x - sx(y)) * 0.5 + y * 0.5) % 6 === 0 ? 0.05 : 0), { pat: speckle({ amt: 0.06 }) });
  // the steel frame behind it where the mesh is tied back: columns and floors, red primer
  for (const fx of [28, 80, 132]) s.paint([0, TOP, 186, 262], (x, y) => Math.abs(x - sx(y) - fx - 14) < 12 && y > TOP + 8 && y < 258 && y % 44 > 8, 'k', () => 0.18);
  for (const fx of [28, 80, 132]) for (let y = TOP + 8; y < 258; y++) if (y % 44 > 8) for (const dx of [fx + 3, fx + 24]) for (let i = 0; i < 3; i++) s.px(dx + i + sx(y), y, i === 1 ? 0xd05030 : 0x7a2a18);
  for (let fy = TOP; fy < 266; fy += 44) for (let x = X0 + 2; x < X1 - 2; x++) for (let j = 0; j < 5; j++) s.px(x + sx(fy), fy + j, j === 0 ? 0xe07050 : j < 4 ? 0xa83a20 : 0x5a1a10);
  // a lit window or two inside (workers' lamps), a ladder up the side
  for (const [wx, wy] of [[42, 110], [138, 198]]) for (let y = wy; y < wy + 14; y++) for (let x = wx; x < wx + 16; x++) s.px(x + sx(y), y, 0xfff0b0, 0.8);
  for (let y = TOP + 6; y < 262; y++) {
    s.px(X0 + 14 + sx(y), y, 0xc8cad0);
    s.px(X0 + 24 + sx(y), y, 0xc8cad0);
    if (y % 7 === 0) for (let x = X0 + 14; x <= X0 + 24; x++) s.px(x + sx(y), y, 0xa8aab0);
  }
  // the scaffold poles and boards outside the mesh, the hazard stripes along the bottom
  for (const px of [X0 - 4, X1 + 2]) for (let y = TOP - 6; y < 266; y++) for (let i = 0; i < 3; i++) s.px(px + i + sx(y), y, i === 1 ? 0xf4f4f8 : 0x9a9aa4);
  for (let fy = TOP + 40; fy < 266; fy += 44) for (let x = X0 - 6; x < X1 + 6; x++) for (let j = 0; j < 4; j++) s.px(x + sx(fy), fy + j, j === 0 ? 0xe8d8b0 : 0x8a7a54);
  for (let y = 254; y < 266; y++) for (let x = X0; x < X1; x++) s.px(x, y, Math.floor((x + y) / 8) % 2 ? 0xf0c830 : 0x1a1a20);
  // the roof: a slab, the site office hut with its lamp, the tower crane: mast, jib out over the side, counterweight
  s.paint([X0, TOP - 10, X1, TOP + 2], (x, y) => x - sx(y) > X0 && x - sx(y) < X1 && y > TOP - 9, 'g', (x) => 0.6 - (x - X0) / 400);
  s.paint([X0 + 100, TOP - 30, X1 - 16, TOP - 8], (x, y) => x - sx(y) > X0 + 100 && x - sx(y) < X1 - 16 && y > TOP - 29, 's', (x) => 0.75 - (x - X0) / 400);
  for (let x = X0 + 104; x < X1 - 20; x += 10) for (let y = TOP - 24; y < TOP - 16; y++) s.px(x + sx(y), y, 0x26405c);
  s.dot(X1 - 24 + sx(TOP - 32), TOP - 33, 3, state === 1 ? 0xff6a30 : 0x8a2a10);
  if (state === 1) s.dot(X1 - 24 + sx(TOP - 32), TOP - 33, 6, 0xffa060, 0.35);
  for (let y = 4; y < TOP - 8; y++) for (const dx of [0, 8]) for (let i = 0; i < 2; i++) s.px(X0 + 34 + dx + i + sx(y), y, 0xf0c830);
  for (let y = 6; y < TOP - 8; y += 6) s.line(X0 + 34 + sx(y), y, X0 + 42 + sx(y + 6), y + 6, 0xc8a020, 1);
  for (let x = X0 + 10; x < X1 + 4; x++) for (let j = 0; j < 4; j++) s.px(x + sx(6), 4 + j, j === 0 ? 0xfff090 : j < 3 ? 0xf0c830 : 0x8a6a10);
  s.paint([X0 + 2, 2, X0 + 22, 14], (x, y) => y > 2 && y < 14 && x > X0 + 2 && x < X0 + 22, 'g', () => 0.4);
  if (lean) {
    // cracks, a corner gone, a floor sagging, sparks
    for (const [x0, y0, x1, y1] of [[40, 140, 72, 176], [72, 176, 62, 222], [118, 96, 152, 124], [100, 200, 128, 236]]) s.line(x0 + sx(y0), y0, x1 + sx(y1), y1, 0xf4f0e8, 1);
    s.dot(140 + sx(130), 132, 2.4, 0xfff0a0);
    s.dot(144 + sx(134), 136, 1.4, 0xff9a40);
  }
  return s.render();
}

// ---------------------------------------------------------------- what it throws and drops
export function ibeam() {
  const s = new HiSprite(30, 132, RAMPS); // (10 x 44 -> 30 x 132), falling end on
  s.paint([2, 2, 28, 130], (x, y) => x >= 3 && x <= 27 && y >= 3 && y <= 129 && (x < 9 || x > 21 || Math.abs(x - 15) < 3), 'f', (x) => 0.68 - (x - 3) / 60);
  for (let y = 10; y < 126; y += 16) {
    s.dot(6, y, 1.4, 0xe8a080);
    s.dot(24, y, 1.4, 0x7a2a18);
  }
  return s.render();
}

/**
 * Its shadow on the ground as it falls: a dark slot with a bright rim (warm yellow, then a dark edge) so it reads on
 * any ground; the game grows, darkens and pulses it.
 */
export function beamShadow() {
  const s = new HiSprite(42, 126, RAMPS);
  for (let y = 0; y < 126; y++) for (let x = 0; x < 42; x++) {
    const d = Math.sqrt(((x - 21) / 17) ** 2 + ((y - 63) / 59) ** 2);
    if (d < 0.86) s.px(x, y, 0x0a0806, 0.78 * Math.min(1, (0.86 - d) * 6));
    else if (d < 1) s.px(x, y, 0xffd860, 0.95);
    else if (d < 1.09) s.px(x, y, 0x1a1006, 0.9);
  }
  return s.render({ outline: 0 });
}

export function hook() {
  const s = new HiSprite(42, 63, RAMPS);
  s.paint([8, 0, 34, 24], (x, y) => x > 9 && x < 33 && y < 24, 'y', (x) => 0.72 - (x - 9) / 50); // the block, yellow
  for (let y = 2; y < 22; y++) if (Math.floor(y / 4) % 2) for (let x = 10; x < 33; x++) if ((x + y) % 8 < 4) s.px(x, y, 0x1a1a20);
  s.ellipse(21, 12, 4, 4, 'k', { flat: 0.3 });
  s.tube(21, 24, 21, 34, 2.8, 's', { rb: 2.8 });
  for (let a = 0; a < Math.PI * 1.5; a += 0.05) s.dot(21 + Math.cos(a + Math.PI) * 11, 47 - Math.sin(a + Math.PI) * 11, 2.8, 0xb8bac4);
  return s.render();
}

export function spanner(f) {
  const s = new HiSprite(42, 42, RAMPS);
  const a = (f * Math.PI) / 4;
  const ex = 21 + Math.cos(a) * 14;
  const ey = 21 + Math.sin(a) * 14;
  s.tube(21 - Math.cos(a) * 14, 21 - Math.sin(a) * 14, ex, ey, 2.8, 's', { rb: 2.8 });
  s.ellipse(ex, ey, 5.4, 5.4, 's', { flat: 0.7 });
  s.ellipse(ex + Math.cos(a) * 2.4, ey + Math.sin(a) * 2.4, 2.4, 2.4, 'k', { flat: 0.2 });
  s.ellipse(21 - Math.cos(a) * 14, 21 - Math.sin(a) * 14, 3.6, 3.6, 's', { flat: 0.6 });
  return s.render();
}

export function hardhat(f) {
  const s = new HiSprite(54, 36, RAMPS);
  s.paint([4, 2, 50, 30], (x, y) => ((x - 27) / 20) ** 2 + ((y - 24) / 19) ** 2 < 1 && y < 26, 'y', (x, y) => 0.75 - (x - 27) / 60 - (y - 8) / 70);
  s.paint([0, 24, 54, 31], (x, y) => Math.abs(x - 27) < 25 && y > 24 && y < 30, 'y', () => 0.45);
  for (let k = -3; k <= 3; k++) {
    s.px(27 + k, 14, 0x2a8a2a);
    s.px(27, 14 + k, 0x2a8a2a);
  }
  s.ellipse(27, 22, 4.4, 2.8, 'w', { flat: 1, glow: !!f });
  return s.render();
}

/** A lump of rubble kicked about (2 frames, tumbling). */
export function chunk(f) {
  const s = new HiSprite(24, 24, RAMPS);
  const pts = f ? [[4, 8], [14, 3], [21, 10], [17, 20], [6, 19]] : [[6, 4], [18, 6], [20, 16], [10, 21], [3, 13]];
  s.poly(pts, 'g', { ball: [12, 12, 10, 10], bias: 0.1 });
  s.line(8, 10, 15, 14, 0x5a5654, 1);
  return s.render();
}

/** Three claw marks torn across the screen (a long frame, laid at an angle by the game... upright: no turning). */
export function claws() {
  const s = new HiSprite(60, 60, RAMPS);
  for (let k = -1; k <= 1; k++) for (let t = 0; t < 1; t += 0.01) {
    const x = 10 + t * 40 + k * 9;
    const y = 8 + t * 44 - k * 4;
    const w = Math.sin(t * Math.PI) * 2.6 + 0.4;
    for (let i = -w; i <= w; i++) s.px(x + i, y - i * 0.3, i * i < 1 ? 0xfff4d8 : 0xff7a4a, 0.9);
  }
  return s.render({ outline: 0 });
}

export function genbaEnemies(add) {
  for (const bare of [false, true]) {
    const b = bare ? '_bare' : '';
    for (const p of ['stand', 'blink', 'throw0', 'throw1', 'hiss', 'crouch0', 'crouch1', 'leap', 'land', 'scratch0', 'scratch1', 'run0', 'run1', 'nap']) add(`neko_${p}${b}`, cat(p, { bare }));
    add(`neko_stand1${b}`, cat('stand', { bare, idle: 1 }));
  }
  // (the old names, kept for what still asks for them)
  add('neko_0', cat('stand'));
  add('neko_1', cat('throw1'));
  add('neko_pounce', cat('crouch0'));
  add('neko_hiss_bare', cat('hiss', { bare: true }));
  add('neko_pounce_bare', cat('crouch0', { bare: true }));
  add('tower_0', tower(0));
  add('tower_1', tower(1));
  add('tower_lean', tower('lean'));
  add('tower_rubble', tower('rubble'));
  add('ibeam', ibeam());
  add('beam_shadow', beamShadow());
  add('crane_hook', hook());
  for (let f = 0; f < 4; f++) add(`spanner_${f}`, spanner(f));
  for (let f = 0; f < 2; f++) add(`hardhat_${f}`, hardhat(f));
  for (let f = 0; f < 2; f++) add(`chunk_${f}`, chunk(f));
  add('claws', claws());
}
