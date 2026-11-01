// Stage 1 boss: Kyūbi no kitsune, the nine-tailed fox, woken on the Daimonji slope at dusk. A shrine fox
// grown wild: a straw shimenawa rope with paper shide round its neck, the hōju jewel on its chest.
// The body and each tail are separate sprites: the game fans the tails out behind the body (the right-hand
// ones are the left-hand ones mirrored) and takes them away one by one as the fox weakens.
// Frames: body idle / blinking / casting (eyes blazing, mouth open); each tail in three swaying frames;
// the fox-fire bullets and the wisp a lost tail turns into.
import { MATERIALS, Mask, renderMask } from '../../lib/spritekit.mjs';

const MAT = {
  ...MATERIALS,
  H: [0x8a6a30, 0xd8b060, 0xf4dc98], // straw rope
};
const render = (m, glow = '') => renderMask(m, { materials: MAT, glow });

// Tail i (0 = far left, 4 = straight up, 8 = far right) leaves the root at tailAngle(i), tailLen(i) px long,
// the outer ones drooping at the tip. Keep in step with kyubiTail() in src/game/Enemies.js.
const tailAngle = (i) => -Math.PI + 0.12 + (i + 0.5) * ((Math.PI - 0.24) / 9);
const tailLen = (i) => 36 - Math.abs(i - 4) * 1.5;
const droop = (i) => -(4 - i) * 1.1;
const ROOT = 4; // the tails start this far out from the root (hidden in the body)
const SWAY = 3; // frames

function ellipse(m, cx, cy, rx, ry, c) {
  for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++)
    for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++)
      if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) m.set(x, y, c);
}
function triangle(m, a, b, c, ch) {
  const side = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  for (let y = Math.floor(Math.min(a[1], b[1], c[1])); y <= Math.max(a[1], b[1], c[1]); y++)
    for (let x = Math.floor(Math.min(a[0], b[0], c[0])); x <= Math.max(a[0], b[0], c[0]); x++) {
      const pt = [x + 0.5, y + 0.5];
      const d1 = side(a, b, pt);
      const d2 = side(b, c, pt);
      const d3 = side(c, a, pt);
      if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) m.set(x, y, ch);
    }
}

/** The spine of tail i (left half, 0..4) in swaying frame f, relative to the root: [{ x, y, r, t }]. */
function spine(i, f) {
  const phase = (f / SWAY) * Math.PI * 2 + i * 0.9;
  const a = tailAngle(i) + Math.sin(phase) * 0.05;
  const ux = Math.cos(a);
  const uy = Math.sin(a);
  const nx = -uy;
  const ny = ux;
  const bend = Math.sin(phase) * 2.2 + droop(i);
  const pts = [];
  for (let k = 0; k <= 60; k++) {
    const t = k / 60;
    const d = ROOT + t * tailLen(i);
    const r = 1.6 + 3.8 * Math.sin(Math.PI * Math.min(0.97, 0.06 + 0.78 * t)) ** 1.2;
    pts.push({ x: ux * d + nx * bend * t * t, y: uy * d + ny * bend * t * t, r, t });
  }
  // the brush of the white tip, drawn out to a point
  const [p, q] = [pts[59], pts[60]];
  const dx = (q.x - p.x) / Math.hypot(q.x - p.x, q.y - p.y);
  const dy = (q.y - p.y) / Math.hypot(q.x - p.x, q.y - p.y);
  for (let e = 1; e <= 4; e++) pts.push({ x: q.x + dx * e * 0.8, y: q.y + dy * e * 0.8, r: Math.max(0.6, q.r - e * 0.45), t: 1 });
  return pts;
}

/** Tail i (0..4) in frame f, drawn round its root at the centre pixel of a (2hw+1) x (2hh+1) mask. */
function tailMask(i, f, hw, hh) {
  const m = new Mask(2 * hw + 1, 2 * hh + 1);
  const ox = hw + 0.5;
  const oy = hh + 0.5;
  const pts = spine(i, f);
  // vermilion at the root, warming to orange, a white brush at the tip (ragged where the colours meet)
  const fur = (t, k) => (t > 0.84 + 0.03 * Math.sin(k * 2.7) ? 'F' : t > 0.54 + 0.05 * Math.sin(k * 1.9) ? 'Q' : 'R');
  pts.forEach((p, k) => m.disc(ox + p.x, oy + p.y, p.r, fur(p.t, k)));
  // fur tufts on both edges, combed towards the tip
  for (let k = 8; k < 60; k += 5) {
    const p = pts[k];
    const q = pts[k + 1];
    const l = Math.hypot(q.x - p.x, q.y - p.y);
    const dx = (q.x - p.x) / l;
    const dy = (q.y - p.y) / l;
    for (const side of [-1, 1]) {
      const ex = p.x - dy * side * (p.r - 0.5);
      const ey = p.y + dx * side * (p.r - 0.5);
      const c = fur(p.t, k);
      m.line(ox + ex, oy + ey, ox + ex - dy * side * 1.4 + dx * 2.4, oy + ey + dx * side * 1.4 + dy * 2.4, c);
    }
  }
  return m;
}

/** Half-size of the mask that holds every frame of tail i (root in the middle). */
function tailBox(i) {
  let hw = 0;
  let hh = 0;
  for (let f = 0; f < SWAY; f++)
    for (const p of spine(i, f)) {
      hw = Math.max(hw, Math.ceil(Math.abs(p.x) + p.r + 3));
      hh = Math.max(hh, Math.ceil(Math.abs(p.y) + p.r + 3));
    }
  return [hw, hh];
}

/** The body: 27 x 47, the tails' root 7 px below its centre. pose: idle | blink | cast */
function bodyMask(pose) {
  const W = 27;
  const H = 47;
  const C = 13; // centre pixel column
  const cx = C + 0.5;
  const m = new Mask(W, H);
  const X = (sx, dx) => C + sx * dx; // mirrored pixel column

  // body, white chest ruff, front paws with their toes
  m.disc(cx, 34, 9.5, 'k');
  m.disc(cx, 34, 8.5, 'R');
  ellipse(m, cx, 37.5, 5, 6, 'F');
  for (const sx of [-1, 1]) {
    for (const [dx, y] of [[-8, 30], [-8, 33], [-7, 36]]) m.set(X(sx, -dx), y, 'K'); // fur on the flanks
    m.disc(cx + sx * 4.5, 43, 3.2, 'k');
    m.disc(cx + sx * 4.5, 43, 2.3, 'F');
    m.set(X(sx, 4) + (sx > 0 ? 0 : 1) - 1, 45, 'k');
    m.set(X(sx, 6) + (sx > 0 ? 0 : 1) - 1, 45, 'k');
  }
  // the shimenawa: a twisted straw rope round the neck
  for (let x = C - 8; x <= C + 8; x++)
    for (const y of [32, 33]) if (m.get(x, y) !== '.' && m.get(x, y) !== 'k') m.set(x, y, (x + y) % 3 === 0 ? 'N' : 'H');
  // hōju jewel on the chest, a gold cap on it
  m.disc(cx, 38.5, 2.6, 'k');
  m.disc(cx, 38.5, 2, 'M');
  m.set(C - 1, 37, 'w');
  m.rect(C - 1, 35, 3, 1, 'Y');

  // tall ears: red outside, pale fluff inside, black tips
  for (const sx of [-1, 1]) {
    const P = (dx, y) => [cx + sx * dx, y];
    triangle(m, P(-12.5, 0.5), P(-11.5, 19), P(-1.5, 14.5), 'k');
    triangle(m, P(-11.5, 2), P(-10.5, 18), P(-2.5, 15), 'R');
    triangle(m, P(-9.5, 7), P(-9, 17), P(-4.5, 15.5), 'F');
    triangle(m, P(-11.5, 2), P(-11, 6.5), P(-8.5, 5.5), 'K');
  }
  // head: cheeks with tufts, muzzle, nose
  ellipse(m, cx, 22.5, 10.5, 9, 'k');
  ellipse(m, cx, 22.5, 9.5, 8, 'R');
  for (const sx of [-1, 1]) {
    ellipse(m, cx + sx * 6, 26, 3, 2.2, 'F');
    m.set(X(sx, 10), 26, 'F'); // tufts sticking out of the cheeks
    m.set(X(sx, 10), 27, 'F');
    m.set(X(sx, 11), 27, 'k');
    m.set(X(sx, 9), 28, 'F');
  }
  ellipse(m, cx, 27.5, 3.8, 3.2, 'F');
  m.rect(C - 1, 28, 3, 1, 'k');
  m.set(C, 29, 'k');
  if (pose === 'cast') {
    // the mouth open on a fox cry: dark inside, fangs, tongue
    m.rect(C - 2, 30, 5, 2, 'k');
    m.set(C - 2, 30, 'w');
    m.set(C + 2, 30, 'w');
    m.set(C, 31, 'M');
  } else {
    m.set(C - 2, 30, 'k');
    m.set(C + 2, 30, 'k');
  }
  // narrow glowing eyes under slanted dark brows (closed in a blink, blazing wide when it casts)
  for (const sx of [-1, 1]) {
    const E = (dx) => X(sx, -dx);
    for (const [dx, y] of [[-8, 21], [-7, 21], [-6, 20], [-5, 20], [-4, 20]]) m.set(E(dx), y, 'k');
    if (pose === 'blink') {
      for (const [dx, y] of [[-7, 22], [-6, 22], [-5, 22], [-4, 21]]) m.set(E(dx), y, 'k');
    } else if (pose === 'cast') {
      for (const [dx, y] of [[-7, 22], [-6, 21], [-6, 22], [-6, 23], [-5, 21], [-5, 23], [-4, 21], [-4, 22]]) m.set(E(dx), y, 'y');
      m.set(E(-5), 22, 'k'); // slit pupil
      m.set(E(-7), 21, 'w');
    } else {
      for (const [dx, y] of [[-7, 22], [-6, 22], [-5, 21], [-4, 21]]) m.set(E(dx), y, 'y');
      m.set(E(-5), 22, 'k');
    }
  }
  // gold flame mark on the forehead (flaring when it casts)
  m.rect(C, 15, 1, 3, pose === 'cast' ? 'y' : 'Y');
  m.set(C - 1, 17, 'Y');
  m.set(C + 1, 17, 'Y');
  if (pose === 'cast') m.set(C, 14, 'y');
  return m;
}

/** Fox-fire wisp, round head down (it flies head first: the game turns it), flickering tail up. */
function wisp(f) {
  const m = new Mask(9, 13);
  for (let k = 0; k <= 8; k++) {
    const t = k / 8;
    const x = 4.5 + Math.sin(t * 3 + f * 2.2) * (1 - t) * 1.4 * (f ? -1 : 1);
    m.disc(x, 9 - t * 8, 3.4 * (1 - t) ** 0.8 + 0.4, 'a');
  }
  m.disc(4.5, 9, 2.4, 'c');
  m.disc(4.5, 9.3, 1.2, 'w');
  m.set(4, 6 - f, 'c');
  return m;
}

export function kyubiSprites(add) {
  for (const pose of ['idle', 'blink', 'cast']) add(`kyubi_${pose}`, render(bodyMask(pose)));
  for (let i = 0; i <= 4; i++) {
    const [hw, hh] = tailBox(i);
    for (let f = 0; f < SWAY; f++) add(`kyubi_tail_${i}_${f}`, render(tailMask(i, f, hw, hh)));
  }
  for (let f = 0; f < 2; f++) add(`kitsunebi_${f}`, render(wisp(f)));
  const raw = (rows) => renderMask(Mask.fromRows(rows), { outline: false });
  add('eb_fox', raw(['..kkk..', '.kaaak.', 'kacccak', 'kacwcak', 'kacccak', '.kaaak.', '..kkk..']));
  add('eb_fox_s', raw(['.kkk.', 'kacak', 'kcwck', 'kacak', '.kkk.']));
}
