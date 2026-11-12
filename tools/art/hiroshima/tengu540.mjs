// Sankibō, the great tengu of Misen, at 540 px (52 x 44 -> 156 x 132): no doll but a man of the mountains,
// heavy-shouldered and red-skinned, hovering on his crow's wings. The long thin nose, the face set in a snarl,
// gold eyes, the white hair blown back from the black tokin; a sleeveless yamabushi vest, dark green edged in
// gold with the yuigesa's white pompoms, over a white undershirt, a red sash knotted at the hip with a short
// sword through it; his forearms and shins bound in white; wide grey hakama printed with clouds, gathered at
// the knee; bare red feet on one-toothed geta; a rosary of wooden beads round one fist, the great feather fan
// in the other. Poses: 0..3 the wings beating, fan_l / fan_r the fan swung to raise a gale.
import { HiSprite, tones, fur, speckle, mottle, mix2 } from '../../lib/hisprite.mjs';

const INK = 0x14101c;
const SINEW = 0x5a0a08;
const TAU = Math.PI * 2;
const RAMPS = {
  t: tones([0x5a0c08, 0xb4261c, 0xee6248]), // skin
  k: tones([0x0a0c16, 0x1c202e, 0x3c4258]), // crow-black feathers
  v: tones([0x1a2a1c, 0x34503a, 0x5e7a5c]), // the vest's dark green
  y: tones([0x8a5a10, 0xd8a030, 0xfff0a0]), // gold
  w: tones([0xa8a090, 0xe8e2d6, 0xffffff]), // white cloth, hair, pompoms
  r: tones([0x7a0e10, 0xcc2a24, 0xff7a60]), // the red sash
  g: tones([0x3a3638, 0x6e6a6a, 0xa8a4a0]), // the grey hakama
  b: tones([0x4a2e18, 0x7a5430, 0xb08050]), // wood, beads, fan grip
  f: tones([0x5a4630, 0x9a8060, 0xe0d0b0]), // the fan's pale feathers
};
const skin = (seed) => ({ pat: mix2(mottle({ amt: 0.2, scale: 6, seed }), speckle({ amt: 0.12, dark: 0.06, light: 0.03, seed: seed + 1 })) });
const plume = (seed, a = Math.PI / 2) => ({ pat: mix2(fur(a, { amt: 0.28, len: 6, w: 1.4, gap: 0.1, seed }), speckle({ amt: 0.06 })) });
const cloth = (seed, a = Math.PI / 2) => ({ pat: mix2(fur(a, { amt: 0.1, len: 16, w: 2.4, gap: 0.03, seed }), speckle({ amt: 0.05 })) });
const ink = (s, pts, c = SINEW, a = 0.85) => { for (let k = 0; k < pts.length - 1; k++) s.line(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], c, 1, a); };

function feather(s, x0, y0, x1, y1, w, mat, seed) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const l = Math.hypot(dx, dy);
  const nx = -dy / l;
  const ny = dx / l;
  const pts = [];
  for (let k = 0; k <= 10; k++) {
    const t = k / 10;
    const ww = w * Math.sin(Math.PI * Math.min(1, 0.12 + t * 0.95)) * (1 - t * 0.3);
    pts.push([x0 + dx * t + nx * ww, y0 + dy * t + ny * ww]);
  }
  for (let k = 10; k >= 0; k--) {
    const t = k / 10;
    const ww = w * Math.sin(Math.PI * Math.min(1, 0.12 + t * 0.95)) * (1 - t * 0.3) * 0.7;
    pts.push([x0 + dx * t - nx * ww, y0 + dy * t - ny * ww]);
  }
  s.poly(pts, mat, { flat: 0.42, ...plume(seed, Math.atan2(dy, dx) + 0.6) });
  s.line(x0, y0, x1 - dx * 0.08, y1 - dy * 0.08, mat === 'k' ? 0x5a6684 : 0xfff4e0, 1, 0.8);
}

function wing(s, sx, cx, sy, span, up, seed) {
  const sh = [cx + sx * 18, sy];
  const wr = [cx + sx * (18 + span * 0.62), sy - span * 0.5 * up - 2];
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    const a = sx > 0 ? -0.6 + t * 1.8 - up * 0.2 : Math.PI + 0.6 - t * 1.8 + up * 0.2;
    feather(s, wr[0], wr[1], wr[0] + Math.cos(a) * span * (0.66 - t * 0.16), wr[1] + Math.sin(a) * span * (0.66 - t * 0.16), 5.6 - t * 0.6, 'k', seed + i);
  }
  for (let i = 0; i < 6; i++) {
    const t = (i + 0.5) / 6;
    const x = sh[0] + (wr[0] - sh[0]) * t;
    const y = sh[1] + (wr[1] - sh[1]) * t;
    feather(s, x, y, x + sx * span * 0.12, y + span * (0.56 - t * 0.08), 5.4, 'k', seed + 20 + i);
  }
  s.tube(sh[0], sh[1], wr[0], wr[1], 6, 'k', { rb: 4, ...plume(seed + 40) });
  for (let row = 0; row < 2; row++) for (let k = 0; k < 7; k++) {
    const t = (k + 0.5) / 7;
    const x = sh[0] + (wr[0] - sh[0]) * t;
    const y = sh[1] + (wr[1] - sh[1]) * t + 5 + row * 7;
    s.ellipse(x, y, 4.6, 5.6, 'k', { bias: 0.08 - row * 0.05, ...plume(seed + 50 + k + row * 9) });
    for (let a = 0.3; a < Math.PI - 0.3; a += 0.12) s.px(x + Math.cos(a) * 4.6, y + Math.sin(a) * 5.6, 0x5a6684, 0.8);
  }
}

/** A forearm bound in white cloth: the strips wound round it at a slant. */
function bound(s, ax, ay, bx, by, r) {
  s.tube(ax, ay, bx, by, r, 'w', { rb: r * 0.85, ...cloth(5, Math.atan2(by - ay, bx - ax)) });
  const n = Math.ceil(Math.hypot(bx - ax, by - ay) / 3.4);
  const nx = -(by - ay);
  const ny = bx - ax;
  const l = Math.hypot(nx, ny);
  for (let k = 1; k < n; k++) {
    const t = k / n;
    const x = ax + (bx - ax) * t;
    const y = ay + (by - ay) * t;
    s.line(x - (nx / l) * r, y - (ny / l) * r, x + (nx / l) * r + (bx - ax) / n * 0.6, y + (ny / l) * r + (by - ay) / n * 0.6, 0xa8a090, 1, 0.8);
  }
}

function hauchiwa(s, x, y, ang, r, seed) {
  for (let k = -4; k <= 4; k++) {
    const a = ang + k * 0.2;
    feather(s, x, y, x + Math.cos(a) * r, y + Math.sin(a) * r, 3.8, 'f', seed + k);
  }
  s.ellipse(x, y, 3.6, 3.6, 'r', { flat: 0.6 });
  s.tube(x, y, x - Math.cos(ang) * 9, y - Math.sin(ang) * 9, 1.8, 'b');
}

export function sankibo(pose) {
  const s = new HiSprite(156, 132, RAMPS);
  const cx = 78;
  const beat = { 0: 1, 1: 0.35, 2: -0.2, 3: 0.35, fan_l: 0.6, fan_r: 0.6, fan_up_l: 0.85, fan_up_r: 0.85 }[pose];
  const fanPose = pose === 'fan_l' || pose === 'fan_r';
  const bob = pose === '2' ? 2 : pose === '0' ? -1 : 0;
  const S = skin(9);
  // ---- the wings, beating
  for (const sx of [-1, 1]) wing(s, sx, cx, 40 + bob, 64, beat, sx > 0 ? 10 : 30);

  // ---- the legs: the hakama wide and baggy, gathered at the knee, cloud scrolls printed on it; bound shins; geta
  for (const sx of [-1, 1]) {
    s.paint([cx + sx * 4 - 20, 76 + bob, cx + sx * 4 + 20, 112 + bob], (x, y) => {
      const t = (y - 76 - bob) / 36;
      const c = cx + sx * (11 + t * 4 + Math.sin(t * Math.PI) * 3);
      return Math.abs(x - c) < 10 + Math.sin(t * Math.PI) * 6 - Math.max(0, t - 0.82) * 22 && (x - cx) * sx > (t < 0.2 ? -6 : 1.5);
    }, 'g', (x, y) => 0.6 - (x - cx) / 120 - Math.abs(Math.sin((y - 76) / 12)) * 0.06, cloth(13 + sx));
    for (const [x, y] of [[-6, 88], [5, 98], [-3, 105]]) {
      const X = cx + sx * (12 + x);
      for (let a = 0; a < Math.PI * 2.2; a += 0.12) s.px(X + Math.cos(a) * (1 + a * 0.8), y + bob + Math.sin(a) * (1 + a * 0.6), 0x4a4648, 0.85);
    }
    s.line(cx + sx * 9, 82 + bob, cx + sx * 12, 106 + bob, 0x3a3638, 1);
    s.line(cx + sx * 18, 84 + bob, cx + sx * 19, 104 + bob, 0x3a3638, 1);
    bound(s, cx + sx * 14, 110 + bob, cx + sx * 14, 119 + bob, 4.4);
    // the bare red foot on its one-toothed geta, the cord's orange tassel
    s.ellipse(cx + sx * 15, 121 + bob, 6, 3.6, 't', S);
    for (let k = -1; k <= 1; k++) s.dot(cx + sx * 15 + k * 3, 123 + bob, 1.2, 0xff8a6a);
    s.poly([[cx + sx * 8, 124 + bob], [cx + sx * 22, 124 + bob], [cx + sx * 22, 127 + bob], [cx + sx * 8, 127 + bob]], 'b', { flat: 0.55 });
    s.tube(cx + sx * 15, 127 + bob, cx + sx * 15, 131, 1.6, 'b');
    s.dot(cx + sx * 15, 119 + bob, 1.4, 0xf08020);
  }

  // ---- the torso: broad, the chest bare in the white undershirt's V, the vest over it
  s.poly([[cx - 21, 36 + bob], [cx + 21, 36 + bob], [cx + 17, 76 + bob], [cx - 17, 76 + bob]], 'w', { flat: 0.7, ...cloth(3) });
  s.poly([[cx - 10, 36 + bob], [cx + 10, 36 + bob], [cx + 2, 60 + bob], [cx - 2, 60 + bob]], 't', { ball: [cx, 44 + bob, 12, 20], ...S });
  ink(s, [[cx - 8, 45 + bob], [cx - 3, 48 + bob], [cx, 46 + bob], [cx + 3, 48 + bob], [cx + 8, 45 + bob]]); // the pectorals' edge
  ink(s, [[cx, 40 + bob], [cx, 56 + bob]], SINEW, 0.6);
  // brushed characters on the undershirt
  for (const [x, y] of [[-11, 50], [11, 54]]) {
    ink(s, [[cx + x - 2, y + bob], [cx + x + 2, y + bob]], INK, 0.9);
    ink(s, [[cx + x, y - 2 + bob], [cx + x, y + 4 + bob]], INK, 0.9);
    ink(s, [[cx + x - 2, y + 3 + bob], [cx + x + 2, y + 5 + bob]], INK, 0.9);
  }
  // the vest: dark green, edged in gold, open down the front
  for (const sx of [-1, 1]) {
    s.poly([[cx + sx * 6, 36 + bob], [cx + sx * 24, 37 + bob], [cx + sx * 22, 78 + bob], [cx + sx * 9, 78 + bob], [cx + sx * 3, 62 + bob]], 'v', { flat: 0.5 - sx * 0.06, ...cloth(7 + sx) });
    ink(s, [[cx + sx * 6, 36 + bob], [cx + sx * 3, 62 + bob], [cx + sx * 9, 78 + bob]], 0xd8a030, 1);
    ink(s, [[cx + sx * 24, 37 + bob], [cx + sx * 22, 78 + bob]], 0xd8a030, 1);
  }
  // the yuigesa's white pompoms, two down each side, and the knotted cord between them
  for (const sx of [-1, 1]) for (const [x, y] of [[13, 41], [12, 54]]) {
    s.ellipse(cx + sx * x, y + bob, 5.4, 5.4, 'w', { pat: fur((px, py) => Math.atan2(py - y - bob, px - cx - sx * x), { amt: 0.32, len: 2, w: 1 }) });
  }
  for (let x = -12; x <= 12; x += 2) s.ellipse(cx + x, 60 + bob + Math.abs(x) * 0.08, 1.4, 1.8, 'b', { bias: (x / 2) % 2 ? 0.1 : -0.05 });
  // the red sash knotted at the hip, its ends hanging; the short sword thrust through it
  s.poly([[cx - 19, 70 + bob], [cx + 19, 70 + bob], [cx + 19, 79 + bob], [cx - 19, 79 + bob]], 'r', { flat: 0.55, ...cloth(9, 0) });
  s.ellipse(cx + 9, 74 + bob, 6, 4.6, 'r', { bias: 0.08 });
  s.poly([[cx + 6, 77 + bob], [cx + 11, 77 + bob], [cx + 12, 87 + bob], [cx + 7, 86 + bob]], 'r', { flat: 0.5 });
  s.poly([[cx + 10, 77 + bob], [cx + 15, 76 + bob], [cx + 19, 84 + bob], [cx + 15, 86 + bob]], 'r', { flat: 0.42 });
  s.tube(cx - 26, 66 + bob, cx - 2, 78 + bob, 2.2, 'K', { rb: 1.8 });
  s.tube(cx - 29, 64.5 + bob, cx - 24, 67 + bob, 2.4, 'w');
  s.ellipse(cx - 22, 68.5 + bob, 1.6, 3.4, 'y', { flat: 0.6 });

  // ---- the arms: shoulders bare and heavy, the forearms bound
  // right (viewer's left): the fist with the rosary, or (fan_l) the fan
  // (fan_up_l / fan_up_r: the wind-up, the fan raised high in that hand before the sweep)
  const upL = pose === 'fan_up_l';
  const upR = pose === 'fan_up_r';
  const fanL = pose === 'fan_l' || upL;
  const fanR = (pose === 'fan_r' || !fanPose) && !upL;
  {
    const shoulder = [cx - 24, 40 + bob];
    const elbow = upL ? [cx - 38, 32 + bob] : fanL ? [cx - 38, 40 + bob] : [cx - 32, 56 + bob];
    const hand = upL ? [cx - 34, 18 + bob] : fanL ? [cx - 50, 30 + bob] : [cx - 34, 72 + bob];
    s.ellipse(shoulder[0], shoulder[1] + 2, 9, 8.5, 't', { bias: 0.05, ...S });
    ink(s, [[shoulder[0] - 5, shoulder[1] + 6], [shoulder[0] + 3, shoulder[1] + 9]]);
    s.tube(shoulder[0], shoulder[1] + 3, elbow[0], elbow[1], 7, 't', { rb: 6, ...S });
    bound(s, elbow[0], elbow[1], hand[0], hand[1], 5.4);
    s.ellipse(hand[0], hand[1] + 2, 5.4, 5, 't', S);
    for (let k = -1; k <= 1; k++) s.ellipse(hand[0] + k * 3, hand[1] + 4.5, 1.6, 1.6, 't', { bias: 0.12 });
    if (fanL) hauchiwa(s, hand[0], hand[1], upL ? -Math.PI / 2 + 0.7 : -Math.PI / 2 - 0.5, 24, 60);
    else {
      // the rosary round the fist, its tail hanging with a gilt charm
      for (let a = 0; a < TAU; a += 0.5) s.ellipse(hand[0] + Math.cos(a) * 6, hand[1] + 2 + Math.sin(a) * 3, 1.3, 1.3, 'b', { bias: 0.12 });
      for (let k = 0; k < 7; k++) s.ellipse(hand[0] + Math.sin(k * 0.6) * 1.5, hand[1] + 9 + k * 2.4, 1.3, 1.3, 'b', { bias: 0.12 });
      s.poly([[hand[0] - 2.5, hand[1] + 26], [hand[0] + 2.5, hand[1] + 26], [hand[0], hand[1] + 31]], 'y', { flat: 0.7 });
    }
  }
  // left (viewer's right): the fan raised, or (fan_r) swung out wide; in fan_l it is the rosary hand
  {
    const shoulder = [cx + 24, 40 + bob];
    const elbow = upR ? [cx + 38, 32 + bob] : pose === 'fan_r' ? [cx + 40, 42 + bob] : fanL ? [cx + 32, 56 + bob] : [cx + 36, 48 + bob];
    const hand = upR ? [cx + 34, 18 + bob] : pose === 'fan_r' ? [cx + 54, 40 + bob] : fanL ? [cx + 34, 72 + bob] : [cx + 42, 34 + bob];
    s.ellipse(shoulder[0], shoulder[1] + 2, 9, 8.5, 't', { bias: 0.05, ...S });
    ink(s, [[shoulder[0] + 5, shoulder[1] + 6], [shoulder[0] - 3, shoulder[1] + 9]]);
    s.tube(shoulder[0], shoulder[1] + 3, elbow[0], elbow[1], 7, 't', { rb: 6, ...S });
    bound(s, elbow[0], elbow[1], hand[0], hand[1], 5.4);
    s.tube(elbow[0] - 4, elbow[1] + 1, elbow[0] + 4, elbow[1] + 1, 2.2, 'y'); // a gold armlet
    s.ellipse(hand[0], hand[1], 5.4, 5, 't', S);
    if (fanR) hauchiwa(s, hand[0], hand[1] - 2, pose === 'fan_r' ? 0.1 : upR ? -Math.PI / 2 - 0.7 : -Math.PI / 2 + 0.25, 24, 70);
    else for (let a = 0; a < TAU; a += 0.5) s.ellipse(hand[0] + Math.cos(a) * 6, hand[1] + 2 + Math.sin(a) * 3, 1.3, 1.3, 'b', { bias: 0.12 });
  }

  // ---- the head: a thick neck, the face in three-quarter turn, the snarl, gold eyes; the white hair blown back
  s.tube(cx, 36 + bob, cx, 28 + bob, 6.5, 't', S);
  const hy = 19 + bob;
  // the white hair, blown back and out to the sides from behind the head
  for (let k = 0; k < 15; k++) {
    const side = k < 7 ? -1 : k > 7 ? 1 : 0;
    const j = Math.abs(k - 7) / 7;
    const a = -Math.PI / 2 + side * (0.5 + j * 1.15);
    const len = 15 + j * 9 + (k % 2) * 4;
    s.tube(cx + Math.cos(a) * 6, hy - 3 + Math.sin(a) * 5, cx + Math.cos(a) * len, hy - 2 + Math.sin(a) * len * 0.75 + j * 6, 3.6 - j * 0.6, 'w', { rb: 0.8, pat: fur(a, { amt: 0.28, len: 4, w: 1, seed: k }) });
  }
  s.ellipse(cx, hy, 11, 12.5, 't', { bias: 0.04, ...S });
  // the black tokin on the brow, its cords
  s.poly([[cx - 3.5, hy - 15], [cx + 3.5, hy - 15], [cx + 3.5, hy - 10], [cx - 3.5, hy - 10]], 'K', { ball: [cx, hy - 12.5, 4.5, 4] });
  s.line(cx - 10, hy - 4, cx - 3.5, hy - 10, 0xffffff, 1);
  // the brows bristling white, the eyes gold, glaring
  for (const sx of [-1, 1]) {
    s.tube(cx + sx * 1.5, hy - 5, cx + sx * 11, hy - 9, 2.2, 'w', { rb: 0.8 });
    s.poly([[cx + sx * 2, hy - 2], [cx + sx * 9.5, hy - 4.5], [cx + sx * 9, hy + 0.5], [cx + sx * 2.5, hy + 1]], 'y', { flat: 0.85 });
    s.dot(cx + sx * 5.6, hy - 1.4, 1.4, INK);
    ink(s, [[cx + sx * 6, hy + 3], [cx + sx * 9, hy + 7]]);
  }
  // the long thin nose, straight out to the side and a little up, lit along its top, its shadow on the cheek
  ink(s, [[cx + 1, hy + 4], [cx + 9, hy + 6]], 0x3a0806, 0.5);
  s.poly([[cx - 2, hy - 2], [cx + 2, hy - 1], [cx + 26, hy - 6], [cx + 26.5, hy - 4], [cx + 2, hy + 4], [cx - 2, hy + 3]], 't', { ball: [cx + 8, hy - 2, 20, 6], bias: 0.14 });
  s.line(cx, hy - 1, cx + 26, hy - 5.6, 0xff9a80, 1, 0.85);
  // the mouth pulled back in a snarl, the teeth bared
  s.poly([[cx - 6, hy + 6], [cx + 6, hy + 6], [cx + 5, hy + 9.5], [cx - 5, hy + 9.5]], 'K', { flat: 0.15 });
  for (let x = cx - 5; x < cx + 5; x += 2) s.poly([[x, hy + 6.4], [x + 1.6, hy + 6.4], [x + 1.6, hy + 9], [x, hy + 9]], 'w', { flat: 0.82 });
  ink(s, [[cx - 7, hy + 5], [cx - 6, hy + 10]]);
  ink(s, [[cx + 7, hy + 5], [cx + 6, hy + 10]]);
  // the gale off the fan
  if (fanPose) {
    const gx = pose === 'fan_r' ? cx + 76 : cx - 76;
    for (let k = -3; k <= 3; k++) s.line(gx - Math.sign(gx - cx) * 8, 36 + k * 6 + bob, gx, 36 + k * 6 + bob + 2, 0xe8f4ff, 1, 0.8);
  }
  return s.render();
}
