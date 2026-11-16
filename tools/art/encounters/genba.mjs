// Random encounter 3 (ex3): the construction site cat and its tower. The cat is the game's own: a big ginger tabby
// with a white muzzle, chest and socks, a yellow hard hat with a headlamp and a green cross on the front, an orange
// high-vis vest with silver bands, a tool belt; never the pose or the catchphrase of the known meme. Its frames: at
// ease (breathing, its tail swaying), blinking, winding up and throwing, hissing; crouched with its rump wiggling
// before a pounce, in the leap, landing; a claw raised and swiped; running flat out (its zoomies); sitting to wash a
// paw. Hatless versions of all that (its hat thrown). The tower it is building: a steel frame wrapped in scaffolding
// and the green mesh Japanese sites hang round them, hazard stripes, a lamp on the roof, a tower crane; then cracked
// and leaning; then a heap of rubble. Its I-beams and their shadows, the crane's hook, a spanner, its hard hat thrown,
// lumps of rubble, dust, its claw marks.
import { HiSprite, tones, fur, speckle, mix2, crackle, inPoly } from '../../lib/hisprite.mjs';

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
// 'scratch1' | 'run0' | 'run1' | 'nap' | 'walk0'-'walk3' | 'look' | 'hurt' | 'yawn'; idle: 0-3 (breathing, the tail
// swaying); bare: its hat thrown
export function cat(pose, { bare = false, idle = 0 } = {}) {
  const s = new HiSprite(120, 132, RAMPS);
  const cx = 60;
  const crouch = pose === 'crouch0' || pose === 'crouch1';
  const leap = pose === 'leap';
  const land = pose === 'land';
  const run = pose === 'run0' || pose === 'run1';
  const nap = pose === 'nap';
  const walk = pose.startsWith('walk') ? +pose[4] : -1; // the walk cycle: 0 left foot up, 2 right foot up
  const sway = [0, 4, 8, 4][idle % 4]; // the tail's tip swaying
  const breath = idle % 2;
  // where things are: lower when crouched or landing, stretched when leaping, the breath lifting it a little
  const by = (crouch ? 14 : land ? 10 : nap ? 8 : leap ? -6 : 0) - breath - (walk === 1 || walk === 3 ? 1.5 : 0);
  const hy = 40 + by + (crouch ? 6 : 0); // the head's centre
  const wig = pose === 'crouch1' ? 4 : pose === 'crouch0' ? -4 : 0; // the rump wiggling before a pounce
  // ---- the tail, ringed, behind it all (up and curling at ease, lashing when angry, low and swishing crouched)
  const angry = pose === 'hiss' || pose.startsWith('scratch') || run;
  const tail = crouch ? [[cx + 18 + wig, 104 + by], [cx + 36 + wig * 2, 108 + by], [cx + 50 + wig * 3, 98 + by]]
    : leap ? [[cx + 14, 100 + by], [cx + 30, 116 + by], [cx + 46, 124 + by]]
      : nap ? [[cx + 20, 112 + by], [cx + 36, 120 + by], [cx + 20, 126 + by]]
        : [[cx + 18, 104 + by], [cx + 34 + sway * 0.4 + (walk >= 0 ? walk % 2 * 3 : 0), 84 + by], [cx + 28 + (angry ? 8 : sway) + (walk >= 0 ? (walk - 1.5) * 3 : 0), 60 + by - (angry ? 6 : 0) + (pose === 'hurt' ? 10 : 0)]];
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
            : walk >= 0 ? [[-11, 104, -12, walk === 0 ? 117 : 124], [11, 104, 12, walk === 2 ? 117 : 124]]
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
  // on the belt: a hammer hanging at its left hip, a tape measure at its right; a pen in the vest's pocket
  if (!crouch && !leap) {
    s.tube(bx - brx + 6, bcy + 18, bx - brx + 3, bcy + 30, 1.6, 'b', { rb: 1.6 });
    s.paint([bx - brx - 2, bcy + 28, bx - brx + 9, bcy + 33], (x, y) => y > bcy + 28 && y < bcy + 33 && x > bx - brx - 2 && x < bx - brx + 9, 's', (x) => 0.7 - (x - bx + brx) / 40);
    s.paint([bx + brx - 10, bcy + 17, bx + brx - 1, bcy + 26], (x, y) => x > bx + brx - 10 && x < bx + brx - 1 && y > bcy + 17 && y < bcy + 26, 'y', () => 0.7);
    s.dot(bx + brx - 5.5, bcy + 21.5, 1.8, 0x2a2a30);
  }
  s.paint([bx + 7, bcy - 12, bx + 15, bcy - 4], (x, y) => x > bx + 7 && x < bx + 15 && y > bcy - 12 && y < bcy - 4, 'v', () => 0.4);
  s.line(bx + 10, bcy - 15, bx + 10, bcy - 9, 0x3a5ad0, 2);
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
  else if (walk >= 0) { arm(-1, bx - 20, bcy + 10 + (walk === 2 ? -5 : walk === 0 ? 4 : 0)); arm(1, bx + 20, bcy + 10 + (walk === 0 ? -5 : walk === 2 ? 4 : 0)); }
  else if (pose === 'hurt') { arm(-1, bx - 26, bcy - 4); arm(1, bx + 26, bcy - 4); }
  else if (pose === 'yawn') { arm(-1, bx - 26, bcy - 18); arm(1, bx + 26, bcy - 18); } // a stretch
  else { arm(-1, bx - 20, bcy + 10); arm(1, bx + 20, bcy + 10 - idle); }
  // ---- the head: round, stripes on the brow, the white muzzle, ears; its face by mood; whiskers
  const hx = cx + (pose === 'scratch0' ? -2 : pose === 'look' ? 5 : pose === 'hurt' ? -4 : 0);
  s.ellipse(hx, hy, 23, 20, 'c', { bias: 0.06, ...silk(11) });
  for (const sx of [-1, 1]) {
    const flat = pose === 'hiss' || crouch || pose === 'hurt'; // ears flattened back
    s.poly([[hx + sx * 8, hy - 14], [hx + sx * (flat ? 26 : 21), hy - (flat ? 22 : 32)], [hx + sx * 22, hy - 6]], 'c', { flat: 0.6 });
    s.poly([[hx + sx * 12, hy - 14], [hx + sx * (flat ? 23 : 19), hy - (flat ? 20 : 27)], [hx + sx * 19, hy - 11]], 'r', { flat: 0.55 });
  }
  for (let k = -1; k <= 1; k++) s.line(hx + k * 5, hy - 19, hx + k * 5.5, hy - 10, 0x8a4a14, 2);
  for (const sx of [-1, 1]) for (let k = 0; k < 2; k++) s.line(hx + sx * 22, hy - 2 + k * 6, hx + sx * 15, hy - 1 + k * 6, 0x8a4a14, 2);
  s.ellipse(hx, hy + 9, 13, 8.5, 'w', { flat: 0.84 });
  const closed = pose === 'blink' || nap || pose === 'yawn';
  for (const sx of [-1, 1]) {
    const ex = hx + sx * 9;
    const ey = hy - 1;
    if (closed) {
      s.line(ex - 4, ey + 1, ex, ey + 3, INK, 2);
      s.line(ex, ey + 3, ex + 4, ey + 1, INK, 2);
    } else if (pose === 'hurt') {
      // > <  squeezed shut
      s.line(ex - sx * 4, ey - 3, ex + sx * 2, ey, INK, 2);
      s.line(ex + sx * 2, ey, ex - sx * 4, ey + 3, INK, 2);
    } else {
      const narrow = pose === 'hiss' || crouch || pose.startsWith('scratch');
      s.ellipse(ex, ey, 5.2, narrow ? 3 : 5, 'e', { flat: 0.95, glow: true });
      // pupils: slits when angry, round and wide when about to pounce or running flat out
      const lx = pose === 'look' ? 2.4 : 0; // looking off to one side
      if (crouch || run || leap) s.ellipse(ex + lx, ey, 2.6, narrow ? 2.4 : 3.6, 'k', { flat: 0.1, glow: true });
      else s.line(ex + lx, ey - (narrow ? 2 : 4), ex + lx, ey + (narrow ? 2 : 4), INK, 2);
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
  } else if (pose === 'yawn') {
    s.ellipse(hx, hy + 13, 6, 7, 'k', { flat: 0.15 });
    s.ellipse(hx, hy + 16, 4, 3, 'r', { flat: 0.6 });
    for (const sx of [-1, 1]) s.poly([[hx + sx * 5, hy + 8], [hx + sx * 2.6, hy + 8], [hx + sx * 3.8, hy + 12]], 'w', { flat: 0.98 });
  } else if (pose === 'hurt') s.ellipse(hx, hy + 12, 2.6, 2.6, 'k', { flat: 0.2 });
  else if (nap) s.ellipse(hx + 2, hy + 12, 2.4, 2, 'r', { flat: 0.7 }); // the tongue out, washing
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
    s.tube(hx + 16, hy - 6, hx + 26, hy - 13, 1.4, 'y', { rb: 1.2 }); // a pencil tucked behind its ear
    s.dot(hx + 26.5, hy - 13.5, 1.2, 0x2a2a30);
  }
  if (run) for (let k = 0; k < 3; k++) s.dot(cx - 26 - k * 7, 124 - k * 2, 3 - k * 0.7, 0xc8b8a0, 0.7); // dust kicked up
  return s.render();
}

// ---------------------------------------------------------------- the tower (62 x 90 -> 186 x 270)
// state 0 / 1: being built (the roof lamp off / on); 'lean': cracked, leaning, pieces gone (phase 2); 'rubble'.
// A steel frame in red primer, five floors of it; round it the scaffolding (poles, ledgers, guard rails, cross
// braces, boards with toe boards, a stair up the left bay) and over the scaffolding the green mesh, hung in panels
// with eyelets down their seams and tied back in some bays, so the floors show: a lamp hanging, cement on a pallet,
// a drum. A safety banner, a blue tarpaulin, the white hoarding and its folding gate at the foot; on the roof the
// starter bars with their orange caps, the site hut, the tower crane.
export function tower(state, f = 0) {
  const s = new HiSprite(186, 270, RAMPS);
  if (state === 'rubble') return rubble(s);
  const lean = state === 'lean';
  const sx = (y) => (lean ? (270 - y) * 0.07 : 0); // (leaning: the higher, the further over)
  const X0 = 8;
  const X1 = 178;
  const TOP = 44;
  const BAY = (X1 - X0) / 4;
  const P = (x, y, c, a = 1) => s.px(Math.round(x + sx(y)), Math.round(y), c, a);
  const H = (x0, x1, y, c, a = 1) => {
    for (let x = x0; x <= x1; x++) P(x, y, c, a);
  };
  const V = (x, y0, y1, c, a = 1) => {
    for (let y = y0; y <= y1; y++) P(x, y, c, a);
  };
  const L = (x0, y0, x1, y1, c, a = 1) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let k = 0; k <= n; k++) P(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n, c, a);
  };
  const R = (x, y, w, h, c, a = 1) => {
    for (let j = 0; j < h; j++) H(x, x + w - 1, y + j, c, a);
  };
  const gone = (x, y) => lean && x > 128 && y < 120; // (the corner that has come away)
  const bayOf = (x) => Math.max(0, Math.min(3, Math.floor((x - X0) / BAY)));
  const floorOf = (y) => Math.max(0, Math.min(4, Math.floor((y - TOP) / 44)));
  // [bay, floor] where the mesh is tied back (more of them once the tower has cracked)
  const OPEN = [[1, 0], [3, 1], [0, 2], [2, 3], [3, 4], ...(lean ? [[2, 1], [1, 2], [0, 4]] : [])];
  const open = (x, y) => OPEN.some(([b, fl]) => b === bayOf(x) && fl === floorOf(y));
  const inside = (x, y) => x - sx(y) > X0 && x - sx(y) < X1 && y > TOP && y < 264 && !gone(x - sx(y), y);
  // ---- inside: the dark of the floors, deeper under each slab; the far columns
  s.paint([0, TOP, 186, 266], inside, 'k', (x, y) => 0.1 + (((y - TOP) % 44) / 44) * 0.26 + (Math.abs(((x - sx(y) - X0) % BAY) - BAY / 2) < 3 ? 0.1 : 0));
  // what stands on the floors where one can see in
  for (const [b, fl] of OPEN) {
    const bx = X0 + b * BAY;
    const fy = TOP + fl * 44 + 44; // the floor's own level (the next slab down)
    if (gone(bx + BAY / 2, fy - 22)) continue;
    const kind = (b * 3 + fl * 5) % 4;
    if (kind === 0 || kind === 3) {
      // a pallet of cement bags
      R(bx + 12, fy - 7, 22, 2, 0x8a6a40);
      for (let k = 0; k < 3; k++) R(bx + 13 + k * 7, fy - 5, 2, 5, 0x5a4428);
      for (let row = 0; row < 3; row++)
        for (let k = 0; k < 3 - (row === 2 ? 1 : 0); k++) {
          R(bx + 13 + k * 7 + (row % 2) * 2, fy - 12 - row * 5, 6, 4, row % 2 ? 0xc8c0b0 : 0xd8d0c0);
          H(bx + 13 + k * 7 + (row % 2) * 2, bx + 18 + k * 7 + (row % 2) * 2, fy - 9 - row * 5, 0x8a8478);
          P(bx + 15 + k * 7 + (row % 2) * 2, fy - 11 - row * 5, 0x2a6a9a);
        }
    }
    if (kind === 1) {
      // a drum and a coil of hose
      R(bx + 22, fy - 18, 10, 13, 0x2a5a9a);
      H(bx + 22, bx + 31, fy - 18, 0x6a9ad0);
      H(bx + 22, bx + 31, fy - 13, 0x1a3a6a);
      H(bx + 22, bx + 31, fy - 9, 0x1a3a6a);
      V(bx + 23, fy - 17, fy - 6, 0x4a7aba);
      for (let a = 0; a < 6.3; a += 0.3) P(bx + 13 + Math.cos(a) * 4, fy - 9 + Math.sin(a) * 3, 0xe8a030);
    }
    if (kind === 2) {
      // a wheelbarrow, a shovel leaning
      R(bx + 14, fy - 14, 14, 6, 0x4a8a50);
      H(bx + 14, bx + 27, fy - 14, 0x8ac088);
      L(bx + 28, fy - 12, bx + 35, fy - 16, 0x8a6a40);
      for (let a = 0; a < 6.3; a += 0.4) P(bx + 15 + Math.cos(a) * 3, fy - 8 + Math.sin(a) * 3, 0x2a2a30);
      L(bx + 9, fy - 6, bx + 11, fy - 26, 0xa8946a);
      R(bx + 9, fy - 30, 4, 5, 0xb8bac4);
    }
    // a work lamp hung from the slab above, its light down the bay
    const lit = (f + b + fl) % 4 !== 0;
    const lx = bx + BAY / 2 + (kind === 2 ? 8 : -6);
    V(lx, fy - 38, fy - 32, 0x2a2a30);
    R(lx - 2, fy - 32, 5, 3, 0xf0c830);
    if (lit) {
      R(lx - 1, fy - 29, 3, 2, 0xfff6c0);
      for (let j = 0; j < 16; j++) for (let i = -1 - j * 0.3; i <= 1 + j * 0.3; i++) P(lx + i, fy - 27 + j, 0xffe890, 0.1 * (1 - j / 16));
      H(lx - 7, lx + 7, fy - 1, 0xffe890, 0.22); // (its pool on the floor)
    } else R(lx - 1, fy - 29, 3, 2, 0x8a7a40);
  }
  // ---- the steel frame, red primer: columns, a beam at every floor, the bolted plates where they meet
  for (let k = 0; k <= 4; k++) {
    const cxk = X0 + k * BAY + (k === 0 ? 3 : k === 4 ? -3 : 0);
    for (let y = TOP + 2; y < 262; y++) {
      if (gone(cxk, y)) continue;
      for (let i = -2; i <= 2; i++) P(cxk + i, y, i === -2 ? 0xe07050 : i === 2 ? 0x5a1a10 : i === 0 ? 0x7a2a18 : 0xa83a20);
    }
  }
  for (let fy = TOP; fy < 266; fy += 44)
    for (let x = X0 + 2; x < X1 - 2; x++) {
      if (gone(x, fy)) continue;
      for (let j = 0; j < 6; j++) P(x, fy + j, j === 0 ? 0xc8c0b4 : j === 1 ? 0xe07050 : j === 5 ? 0x5a1a10 : j === 3 ? 0x7a2a18 : 0xa83a20);
      if ((x - X0) % BAY < 1 || (x - X0) % BAY > BAY - 1) continue;
      if (Math.abs(((x - X0) % BAY) - 6) < 1 || Math.abs(((x - X0) % BAY) - BAY + 6) < 1) for (const j of [2, 4]) P(x, fy + j, 0xf0b090);
    }
  // ---- the mesh: green netting in panels, its folds, the seams with their eyelets; gathered and tied where it is
  // drawn back
  const net = (x, y) => ((Math.round(x - sx(y)) + Math.round(y)) % 4 === 0 || (Math.round(x - sx(y)) - Math.round(y) + 400) % 4 === 0 ? 0.07 : 0);
  s.paint([0, TOP, 186, 266], (x, y) => inside(x, y) && !open(x - sx(y), y), 'n', (x, y) => {
    const u = x - sx(y);
    const seam = (u - X0) % (BAY / 2);
    return 0.4 + (Math.floor((u - X0) / (BAY / 2)) % 2 ? 0.05 : -0.02) + Math.sin(u * 0.45 + Math.floor((y - TOP) / 44)) * 0.04 + ((y - TOP) % 44 < 2 ? -0.2 : 0) + ((y - TOP) % 44 > 40 ? 0.06 : 0) + (seam < 1.2 ? -0.16 : seam < 2.4 ? 0.08 : 0);
  }, { pat: net });
  for (let fl = 0; fl < 5; fl++)
    for (let k = 0; k < 8; k++) {
      const ex = X0 + k * (BAY / 2) + 2;
      for (let y = TOP + fl * 44 + 6; y < TOP + fl * 44 + 42; y += 7) if (inside(ex + sx(y), y) && !open(ex, y)) P(ex, y, 0xd8ecd0);
    }
  for (const [b, fl] of OPEN) {
    // the panel gathered at the bay's side, two cords round it
    const gx = X0 + b * BAY + (b % 2 ? BAY - 9 : 5);
    const y0 = TOP + fl * 44 + 6;
    if (gone(gx, y0 + 10)) continue;
    for (let y = y0; y < y0 + 34; y++) {
      const w = 3 + Math.sin(y * 0.5) * 0.8 - (Math.abs(y - y0 - 10) < 1.5 || Math.abs(y - y0 - 24) < 1.5 ? 1.4 : 0);
      for (let i = -w; i <= w; i++) P(gx + i, y, i < -1 ? 0x4a8a50 : i > 1 ? 0x0e3a20 : 0x2a6a3a);
    }
    for (const dy of [10, 24]) H(gx - 3, gx + 3, y0 + dy, 0xe8d8b0);
    if (lean) for (let k = 0; k < 4; k++) V(X0 + b * BAY + 10 + k * 8, y0 - 4, y0 + 2 + ((k * 7 + fl * 3) % 9), 0x2a6a3a); // (shreds left hanging)
  }
  // the safety banner tied across two bays: white, a green cross, the slogan in four black characters
  {
    const [bx, byy] = [X0 + 8, TOP + 3 * 44 + 12];
    R(bx, byy, 68, 15, 0xf4f4ee);
    H(bx, bx + 67, byy, 0x2a9a3a);
    H(bx, bx + 67, byy + 14, 0x2a9a3a);
    R(bx + 5, byy + 3, 3, 9, 0x2a9a3a);
    R(bx + 2, byy + 6, 9, 3, 0x2a9a3a);
    const GLYPH = [
      ['..#....', '#######', '#.#...#', '.#####.', '..#.#..', '.#...#.', '#.....#'],
      ['...#...', '..#.#..', '.#...#.', '#######', '...#...', '.#####.', '#######'],
      ['.#...#.', '#######', '..#.#..', '#######', '..###..', '.#.#.#.', '#..#..#'],
      ['.......', '.......', '.......', '#######', '.......', '.......', '.......'],
    ];
    GLYPH.forEach((g, n) => g.forEach((row, j) => [...row].forEach((ch, i) => ch === '#' && P(bx + 17 + n * 12 + i, byy + 4 + j, 0x1a1a20))));
    for (const i of [0, 67]) for (const j of [0, 14]) P(bx + i, byy + j, 0x6a6a74);
  }
  // a blue tarpaulin lashed over one panel, a corner of it loose and lifting
  {
    const [tx, ty, tw, th] = [X0 + 2 * BAY + 4, TOP + 2 * 44 + 8, 34, 30];
    for (let j = 0; j < th; j++)
      for (let i = 0; i < tw; i++) {
        const flap = i + (th - j) < 9 + (f % 2) * 4 && j > th - 14;
        if (flap) continue;
        const fold = Math.sin(i * 0.55 + Math.sin(j * 0.2) * 0.8) * 0.6 + (j % 10 === 0 ? -0.5 : 0);
        P(tx + i, ty + j, fold > 0.35 ? 0x5a9ae8 : fold < -0.35 ? 0x1a4a98 : 0x2a6ac8);
      }
    for (let i = 2; i < tw; i += 8) {
      P(tx + i, ty + 1, 0xe8ecf4);
      P(tx + i, ty + th - 2, 0xe8ecf4);
      V(tx + i, ty - 3, ty, 0xe8d8b0);
    }
    L(tx + 8 + (f % 2) * 4, ty + th - 1, tx, ty + th - 10 - (f % 2) * 4, 0x9ac0f4);
  }
  // ---- the scaffolding outside it all: poles, the boards at every lift with their toe boards, guard rails, clamps,
  // cross braces in the outer bays, the stair up the left one
  for (const px of [X0 + BAY, X0 + 2 * BAY, X0 + 3 * BAY]) for (let y = TOP + 2; y < 256; y++) if (!gone(px, y)) for (let i = 0; i < 2; i++) P(px - 5 + i, y, i ? 0x8a8c96 : 0xd8dae2, 0.9);
  for (const px of [X0 - 4, X1 + 2]) for (let y = TOP - 6; y < 266; y++) if (!gone(px - 6, y)) for (let i = 0; i < 3; i++) P(px + i, y, i === 1 ? 0xf4f4f8 : 0x9a9aa4);
  for (let fl = 0; fl < 5; fl++) {
    const by = TOP + 40 + fl * 44;
    for (const b of [0, 3]) {
      if ((fl + b) % 2) continue;
      const [xa, xb] = b ? [X0 + 3 * BAY - 4, X1 + 2] : [X0 - 3, X0 + BAY - 5];
      if (gone(xb - 4, by - 20)) continue;
      L(xa, by, xb, by - 40, 0xb0b2bc, 0.75);
      L(xa, by - 40, xb, by, 0x8a8c96, 0.75);
    }
    for (let x = X0 - 6; x < X1 + 6; x++) {
      if (gone(x, by)) continue;
      P(x, by - 16, 0xc8cad2, 0.85);
      if (x % 2) P(x, by - 8, 0xa8aab2, 0.6);
      for (let j = 0; j < 4; j++) P(x, by + j, j === 0 ? 0xe8d8b0 : (x - X0) % 22 < 1 ? 0x5a4c30 : j === 3 ? 0x5a4c30 : 0x8a7a54);
      P(x, by - 2, 0xc8b890);
      P(x, by - 1, 0xa8946a);
    }
    for (const px of [X0 - 3, X0 + BAY - 5, X0 + 2 * BAY - 5, X0 + 3 * BAY - 5, X1 + 3]) {
      if (gone(px - 4, by)) continue;
      R(px - 1, by - 17, 3, 3, 0x5a5a64);
      P(px, by - 16, 0xf0c830);
    }
  }
  for (let fl = 0; fl < 5; fl++) {
    // the stair: a stringer up each lift, the other way every time, its treads and its handrail
    const by = TOP + 40 + fl * 44;
    const [xa, xb] = fl % 2 ? [X0 + 30, X0 + 8] : [X0 + 8, X0 + 30];
    for (let k = 0; k <= 40; k++) {
      const x = xa + ((xb - xa) * k) / 40;
      const y = by - k;
      P(x, y, 0xd8dae2);
      P(x, y + 1, 0x7a7c86);
      if (k % 5 === 0) H(Math.round(x) - 2, Math.round(x) + 2, y, 0xf4f4f8);
      if (k > 3) P(x, y - 9, 0xf0c830, 0.9);
    }
  }
  // ---- at its foot: the hoarding (white steel panels, ribbed), the folding gate, the notices; hazard stripes
  for (let y = 228; y < 254; y++)
    for (let x = X0 - 2; x < X1 + 2; x++) {
      const gate = x > 72 && x < 116;
      let c = (x - X0) % 9 === 0 ? 0xb8bcc6 : y === 228 ? 0xffffff : y > 250 ? 0xc8ccd4 : 0xeceef2;
      if (gate) {
        const d = (x - 72 + (y - 228)) % 8;
        const e = (x - 72 - (y - 228) + 80) % 8;
        c = d === 0 || e === 0 ? 0xf0c830 : y === 228 || y === 253 ? 0x8a6a10 : 0x1a1a20;
      }
      P(x, y, c);
    }
  R(X0 + 6, 232, 15, 15, 0xffffff);
  R(X0 + 12, 234, 3, 11, 0x2a9a3a);
  R(X0 + 8, 238, 11, 3, 0x2a9a3a);
  R(X0 + 28, 233, 22, 13, 0x2a5a9a);
  for (let j = 0; j < 4; j++) H(X0 + 31, X0 + 46 - (j % 2) * 5, 236 + j * 3, 0xf4f4ee);
  R(X1 - 44, 233, 16, 12, 0xf0c830);
  for (let k = 0; k < 5; k++) L(X1 - 38, 236 + k, X1 - 34 + k, 236 + k, 0x1a1a20);
  V(X1 - 36, 236, 242, 0x1a1a20);
  R(X1 - 22, 234, 14, 10, 0xd83a2a);
  H(X1 - 20, X1 - 11, 239, 0xffffff);
  for (let y = 254; y < 266; y++) for (let x = X0; x < X1; x++) s.px(x, y, Math.floor((x + y) / 8) % 2 ? 0xf0c830 : 0x1a1a20);
  // ---- the roof: the slab, starter bars standing out of it with their orange caps, the site hut with its windows,
  // door and air conditioner, the warning lamp
  s.paint([X0, TOP - 10, X1 + 20, TOP + 2], (x, y) => x - sx(y) > X0 && x - sx(y) < X1 && y > TOP - 9 && !gone(x - sx(y), y + 60), 'g', (x) => 0.6 - (x - X0) / 400, { pat: speckle({ amt: 0.05 }) });
  for (let x = X0 + 52; x < X0 + 98; x += 5) {
    const h = 8 + ((x * 7) % 5);
    V(x, TOP - 9 - h, TOP - 10, 0x8a4a2a);
    R(x - 1, TOP - 11 - h, 3, 2, 0xff8a20);
  }
  if (!lean) {
    s.paint([X0 + 100, TOP - 30, X1 - 16, TOP - 8], (x, y) => x > X0 + 100 && x < X1 - 16 && y > TOP - 29, 's', (x, y) => 0.78 - (x - X0) / 420 - (y < TOP - 26 ? -0.1 : 0));
    for (let x = X0 + 101; x < X1 - 16; x += 4) V(x, TOP - 25, TOP - 10, 0x9a9ca8, 0.5);
    for (let k = 0; k < 3; k++) {
      R(X0 + 105 + k * 14, TOP - 24, 10, 8, 0x26405c);
      H(X0 + 105 + k * 14, X0 + 114 + k * 14, TOP - 24, 0x6a8ab0);
      V(X0 + 110 + k * 14, TOP - 24, TOP - 17, 0xc8cad0);
      if ((f + k) % 3 === 0) R(X0 + 106 + k * 14, TOP - 22, 3, 5, 0xfff0b0, 0.8);
    }
    R(X1 - 30, TOP - 24, 9, 14, 0x7a8a9a);
    P(X1 - 23, TOP - 17, 0xf0c830);
    R(X0 + 101, TOP - 34, 12, 5, 0xd8dae2);
    for (let i = 0; i < 12; i += 2) P(X0 + 101 + i, TOP - 32, 0x5a5a64);
  }
  const lamp = state === 1 || f % 2 === 1;
  s.dot(X1 - 24 + sx(TOP - 32), TOP - 33, 3, lamp ? 0xff6a30 : 0x8a2a10);
  if (lamp) s.dot(X1 - 24 + sx(TOP - 32), TOP - 33, 6, 0xffa060, 0.35);
  // the green-cross safety flag on its pole at the roof's corner, flying
  for (let y = 0; y < TOP - 6; y++) s.px(X1 - 6 + sx(y), y, 0xc8c8d0);
  for (let y = 0; y < 18; y++)
    for (let x = 0; x < 24; x++) {
      const wave = Math.sin(x * 0.3 + f * 1.6) * 2 * (x / 24);
      if (y + wave < 1 || y + wave > 17) continue;
      const cross = (Math.abs(x - 12) < 2 && Math.abs(y - 9) < 7) || (Math.abs(y - 9) < 2 && Math.abs(x - 12) < 7);
      s.px(X1 - 30 + x + sx(y), 2 + y + wave, cross ? 0x2a9a3a : x % 6 === 0 ? 0xd8d8d0 : 0xf4f4ee);
    }
  // ---- the tower crane: a lattice mast, the cab, the jib out over the side with its trolley and line, the
  // counterweights on the short arm
  for (let y = 12; y < TOP - 8; y++) for (const dx of [0, 9]) for (let i = 0; i < 2; i++) P(X0 + 34 + dx + i, y, i ? 0xb89018 : 0xf8d848);
  for (let y = 12; y < TOP - 10; y += 6) {
    L(X0 + 35, y, X0 + 43, y + 6, 0xc8a020);
    L(X0 + 43, y, X0 + 35, y + 6, 0xa88410, 0.8);
    H(X0 + 34, X0 + 44, y, 0xd8b028);
  }
  for (let x = X0 + 10; x < X1 + 4; x++) {
    P(x, 3, 0xfff090);
    P(x, 4, 0xf0c830);
    P(x, 10, 0xd8b028);
    P(x, 11, 0x8a6a10);
  }
  for (let x = X0 + 24; x < X1; x += 8) {
    L(x, 4, x + 4, 10, 0xc8a020);
    L(x + 4, 10, x + 8, 4, 0xa88410);
  }
  s.paint([X0 + 2, 1, X0 + 24, 14], (x, y) => y > 1 && y < 14 && x > X0 + 2 && x < X0 + 24, 'g', (x, y) => 0.5 - (y - 2) / 50);
  for (const x of [X0 + 9, X0 + 16]) V(x + sx(8), 2, 13, 0x4a4846);
  R(X0 + 46, 12, 12, 10, 0xf0c830);
  R(X0 + 48, 14, 8, 5, 0x26405c);
  H(X0 + 48, X0 + 55, 14, 0x8ab0d8);
  {
    const tx = X0 + 96 + f * 5;
    R(tx - 3, 11, 7, 3, 0x2a2a30);
    V(tx, 14, 22, 0x4a4a52);
    R(tx - 2, 22, 5, 4, 0xf0c830);
    P(tx, 27, 0xb8bac4);
    P(tx - 1, 28, 0xb8bac4);
  }
  if (lean) {
    // cracks through the slabs and the mesh, boards hanging by one end, a pole sprung loose, sparks from a cut cable
    for (const [x0, y0, x1, y1] of [[40, 140, 72, 176], [72, 176, 62, 222], [118, 96, 152, 124], [100, 200, 128, 236], [20, 60, 44, 92], [150, 150, 170, 186]]) {
      L(x0, y0, x1, y1, 0xf4f0e8);
      L(x0 + 1, y0 + 1, x1 + 1, y1 + 1, 0x14101c, 0.7);
    }
    for (const [x, y, dx, dy] of [[128, 122, 26, 16], [20, 170, -14, 20], [96, 86, 18, 12]])
      for (let j = 0; j < 3; j++) L(x, y + j, x + dx, y + dy + j, j === 0 ? 0xe8d8b0 : j === 2 ? 0x5a4c30 : 0x8a7a54);
    L(X1 + 3, 150, X1 + 12, 196, 0xd8dae2);
    L(132, 120, 150, 108, 0x7a2a18);
    L(132, 121, 150, 109, 0xa83a20);
    for (const [x, y, c] of [[140, 132, 0xfff0a0], [144, 136, 0xff9a40], [137 + (f % 2) * 3, 140, 0xfff6c0], [147, 129 + (f % 2) * 4, 0xffd060], [142, 144, 0xff9a40]]) {
      P(x, y, c);
      P(x + 1, y, c, 0.6);
      P(x, y + 1, c, 0.6);
    }
  }
  return s.render();
}

/** What is left of it: slabs of concrete with their bars torn out, bent red steel, scaffold poles, the mesh over it all. */
function rubble(s) {
  // the heap itself, and the dust still hanging about its foot
  s.paint([4, 160, 182, 268], (x, y) => y > 266 - Math.max(0, 88 - Math.abs(x - 93) * 0.9) - Math.sin(x * 0.3) * 4, 'g', (x, y) => 0.44 - (x - 93) / 300 + Math.sin(x * 0.7 + y * 0.4) * 0.1, { pat: mix2(speckle({ amt: 0.1 }), crackle({ amt: 0.2, scale: 11 })) });
  // slabs lying on it at all angles: the lit face, the broken edge under it, the bars sticking out, bent
  const slab = (pts, lit, seed) => {
    const edge = pts.map(([x, y]) => [x + 2, y + 6]);
    s.poly([pts[0], pts[1], edge[1], edge[0]], 'g', { flat: 0.22 });
    s.poly([pts[1], pts[2], edge[2], edge[1]], 'g', { flat: 0.3 });
    s.poly([pts[3], pts[2], edge[2], edge[3]], 'g', { flat: 0.26 });
    s.poly(pts, 'g', { flat: lit, pat: speckle({ amt: 0.08, seed }) });
    const [ax, ay] = pts[2];
    for (let k = 0; k < 3; k++) {
      const bx = ax - 2 - k * 4;
      const byy = ay + 2 - k;
      s.line(bx, byy, bx + 5 + k, byy + 7, 0x7a3a20, 1);
      s.line(bx + 5 + k, byy + 7, bx + 9 + k, byy + 5, 0x7a3a20, 1);
    }
  };
  slab([[18, 236], [56, 226], [66, 246], [26, 258]], 0.62, 3);
  slab([[112, 222], [156, 232], [150, 254], [106, 244]], 0.72, 5);
  slab([[58, 206], [92, 198], [100, 216], [64, 226]], 0.8, 7);
  slab([[134, 244], [174, 250], [172, 264], [130, 262]], 0.56, 9);
  slab([[36, 252], [70, 250], [72, 264], [34, 264]], 0.5, 11);
  // the red steel: lengths of I-beam thrown about, their flanges catching the light, the bolt holes
  for (const [x0, y0, x1, y1] of [[46, 252, 78, 190], [104, 258, 138, 200], [70, 254, 122, 218], [128, 258, 162, 228], [28, 262, 58, 232]]) {
    s.tube(x0, y0, x1, y1, 3.6, 'f', { rb: 3 });
    const n = Math.hypot(x1 - x0, y1 - y0);
    const [ux, uy] = [(x1 - x0) / n, (y1 - y0) / n];
    for (let k = 4; k < n - 2; k++) {
      s.px(x0 + ux * k + uy * 3, y0 + uy * k - ux * 3, 0xf0a080);
      s.px(x0 + ux * k - uy * 3, y0 + uy * k + ux * 3, 0x4a140c);
      if (k % 9 === 0) s.px(x0 + ux * k, y0 + uy * k, 0x3a100a);
    }
    for (let j = -4; j <= 4; j++) s.px(x1 + uy * j, y1 - ux * j, 0xe07050);
  }
  // scaffold poles and boards among it, a ledger still clamped to one
  for (const [x0, y0, x1, y1] of [[10, 246, 76, 238], [108, 232, 178, 244], [84, 262, 150, 206], [40, 262, 52, 204]]) {
    s.tube(x0, y0, x1, y1, 1.8, 's', { rb: 1.8 });
    s.dot((x0 + x1) / 2, (y0 + y1) / 2, 2, 0x5a5a64);
    s.px((x0 + x1) / 2, (y0 + y1) / 2, 0xf0c830);
  }
  for (const [x0, y0, x1, y1] of [[20, 242, 66, 252], [112, 240, 166, 248], [78, 232, 110, 250]]) s.tube(x0, y0, x1, y1, 2.6, 'p', { rb: 2.6 });
  // the mesh, fallen across the heap in two great folds, its net, its eyelets, a torn edge
  const net = (x, y) => ((Math.round(x) + Math.round(y)) % 4 === 0 || (Math.round(x) - Math.round(y) + 400) % 4 === 0 ? 0.08 : 0);
  s.paint([8, 214, 78, 266], (x, y) => inPoly([[14, 262], [24, 244], [38, 234], [54, 240], [64, 230], [76, 250], [70, 264]], x, y) && y < 263 - Math.abs(Math.sin(x * 0.9)) * 3, 'n', (x, y) => 0.42 + Math.sin((x + y) * 0.32) * 0.16 - (y - 218) / 240, { pat: net });
  s.paint([118, 222, 184, 268], (x, y) => inPoly([[124, 264], [132, 246], [148, 238], [160, 246], [172, 240], [180, 262]], x, y) && y < 264 - Math.abs(Math.sin(x * 1.1)) * 3, 'n', (x, y) => 0.4 + Math.sin((x - y) * 0.3) * 0.16 - (y - 226) / 260, { pat: net });
  for (const [x, y] of [[30, 240], [40, 232], [50, 226], [146, 236], [156, 232], [164, 242]]) s.px(x, y, 0xd8ecd0);
  // a length of the crane's jib, its lattice; a strip of the hazard boarding; the banner; a hard hat; the flag
  for (let k = 0; k <= 60; k++) {
    const x = 116 + k;
    const y = 214 + k * 0.42;
    s.px(x, y, 0xfff090);
    s.px(x, y + 1, 0xf0c830);
    s.px(x - 3, y + 8, 0xd8b028);
    s.px(x - 3, y + 9, 0x8a6a10);
    if (k % 8 < 4) s.px(x - (k % 8) * 0.75, y + 1 + (k % 8) * 2, 0xc8a020);
    else s.px(x - 3 + ((k % 8) - 4) * 0.75, y + 8 - ((k % 8) - 4) * 2, 0xa88410);
  }
  for (let k = 0; k < 36; k++) for (let j = 0; j < 6; j++) s.px(22 + k + j * 0.3, 222 + k * 0.2 + j, Math.floor((k + j) / 5) % 2 ? 0xf0c830 : 0x1a1a20);
  for (let k = 0; k < 26; k++)
    for (let j = 0; j < 9; j++) {
      const cross = (Math.abs(k - 6) < 2 && j > 1 && j < 8) || (Math.abs(j - 4) < 1.5 && k > 2 && k < 11);
      s.px(132 + k - j * 0.4, 200 + j + k * 0.25 + Math.sin(k * 0.6) * 1.2, cross ? 0x2a9a3a : k % 7 === 0 ? 0xd0d0c8 : 0xf4f4ee);
    }
  s.paint([150, 250, 170, 262], (x, y) => ((x - 160) / 8) ** 2 + ((y - 262) / 9) ** 2 < 1 && y < 262, 'y', (x, y) => 0.8 - (x - 152) / 30);
  for (let x = 150; x < 172; x++) s.px(x, 262, 0x9a7a10);
  // bars standing bent out of the top of it, their orange caps still on
  for (const [x, y, dx] of [[52, 214, -5], [130, 212, 6], [142, 222, 3], [44, 226, -3]]) {
    s.line(x, y + 12, x + dx * 0.4, y + 5, 0x8a4a2a, 1);
    s.line(x + dx * 0.4, y + 5, x + dx, y, 0x8a4a2a, 1);
    s.dot(x + dx, y - 1, 1.6, 0xff8a20);
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

/** A kitten on the site's crew, walking the scaffold boards (2 frames) in its own little hard hat. */
export function koneko(f) {
  const s = new HiSprite(30, 33, RAMPS);
  for (const sx of [-1, 1]) s.tube(15 + sx * 4, 22, 15 + sx * 4 + (f ? sx : -sx), 30, 2.4, 'c', { rb: 2 });
  s.ellipse(15, 21, 7, 7, 'v', { bias: 0.08 });
  s.ellipse(15, 11, 8, 7, 'c', { bias: 0.1 });
  for (const sx of [-1, 1]) s.poly([[15 + sx * 3, 6], [15 + sx * 8, 1], [15 + sx * 8, 8]], 'c', { flat: 0.6 });
  s.paint([6, 2, 24, 9], (x, y) => ((x - 15) / 8) ** 2 + ((y - 9) / 7) ** 2 < 1 && y < 8, 'y', () => 0.75);
  for (const sx of [-1, 1]) s.dot(15 + sx * 3, 12, 1, INK);
  s.ellipse(15, 15, 3, 2, 'w', { flat: 0.85 });
  s.tube(22, 18, 27, 12 + f * 3, 1.6, 'c', { rb: 1.4 });
  return s.render();
}

export function genbaEnemies(add) {
  for (const bare of [false, true]) {
    const b = bare ? '_bare' : '';
    for (const p of ['stand', 'blink', 'throw0', 'throw1', 'hiss', 'crouch0', 'crouch1', 'leap', 'land', 'scratch0', 'scratch1', 'run0', 'run1', 'nap']) add(`neko_${p}${b}`, cat(p, { bare }));
    for (let i = 1; i < 4; i++) add(`neko_stand${i}${b}`, cat('stand', { bare, idle: i }));
    for (const p of ['walk0', 'walk1', 'walk2', 'walk3', 'look', 'hurt', 'yawn']) add(`neko_${p}${b}`, cat(p, { bare }));
  }
  // (the old names, kept for what still asks for them)
  add('neko_0', cat('stand'));
  add('neko_1', cat('throw1'));
  add('neko_pounce', cat('crouch0'));
  add('neko_hiss_bare', cat('hiss', { bare: true }));
  add('neko_pounce_bare', cat('crouch0', { bare: true }));
  for (let f = 0; f < 4; f++) add(`tower_${f}`, tower(0, f));
  add('tower_lean', tower('lean', 0));
  add('tower_lean_1', tower('lean', 1));
  for (let f = 0; f < 2; f++) add(`koneko_${f}`, koneko(f));
  add('tower_rubble', tower('rubble'));
  add('ibeam', ibeam());
  add('beam_shadow', beamShadow());
  add('crane_hook', hook());
  for (let f = 0; f < 4; f++) add(`spanner_${f}`, spanner(f));
  for (let f = 0; f < 2; f++) add(`hardhat_${f}`, hardhat(f));
  for (let f = 0; f < 2; f++) add(`chunk_${f}`, chunk(f));
  add('claws', claws());
}
