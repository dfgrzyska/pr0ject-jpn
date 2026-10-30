// Stage 1 miniboss: a tanuki, like the glazed Shigaraki-ware figurines outside Japanese shops and
// restaurants — straw hat, big belly, a sake flask in one paw and a ledger in the other.
// Frames: idle (breathing), belly drumming (hara-tsuzumi), and with a leaf on the hat (shapeshifting;
// the decoy copies keep the leaf). Plus the thrown sake flask and leaf particles.
import { MATERIALS, Mask, renderMask } from '../../lib/spritekit.mjs';

const MAT = {
  ...MATERIALS,
  t: [0x9a7a54, 0xd2b48a, 0xf2dcb8], // belly and muzzle
  H: [0x8a6a30, 0xd8b060, 0xf4dc98], // straw hat
};
const render = (m) => renderMask(m, { materials: MAT });

const W = 53;
const H = 58;
const CX = 26.5;

function ell(m, ex, ey, rx, ry, c) {
  for (let y = Math.floor(ey - ry); y <= ey + ry; y++)
    for (let x = Math.floor(ex - rx); x <= ex + rx; x++) if (((x + 0.5 - ex) / rx) ** 2 + ((y + 0.5 - ey) / ry) ** 2 < 1) m.set(x, y, c);
}

function capsule(m, ax, ay, bx, by, r, c) {
  const dx = bx - ax;
  const dy = by - ay;
  for (let y = Math.floor(Math.min(ay, by) - r); y <= Math.max(ay, by) + r; y++)
    for (let x = Math.floor(Math.min(ax, bx) - r); x <= Math.max(ax, bx) + r; x++) {
      const t = Math.max(0, Math.min(1, ((x + 0.5 - ax) * dx + (y + 0.5 - ay) * dy) / (dx * dx + dy * dy)));
      if (Math.hypot(x + 0.5 - (ax + dx * t), y + 0.5 - (ay + dy * t)) < r) m.set(x, y, c);
    }
}

/** pose: idle0 | idle1 | drum0 (paws up) | drum1 (paws on the belly). */
function tanukiMask(pose, leaf) {
  const m = new Mask(W, H);
  const big = pose === 'idle1' || pose === 'drum1' ? 0.6 : 0;
  ell(m, 43, 47, 6, 4, 'N'); // bushy tail peeking out
  ell(m, 18.5, 54, 5.5, 3.5, 'N');
  ell(m, 34.5, 54, 5.5, 3.5, 'N');
  ell(m, CX, 38, 17, 15.5, 'N');
  ell(m, CX, 40, 12 + big, 11.5 + big, 't');
  // straw hat brim behind the head, head, then the hat's crown on top
  ell(m, CX, 9, 18, 6.5, 'H');
  for (let x = 0; x < W; x++)
    for (let y = 2; y < 16; y++) {
      const d = ((x + 0.5 - CX) / 13) ** 2 + ((y + 0.5 - 9) / 4.6) ** 2;
      if (d > 0.8 && d < 1 && m.get(x, y) === 'H') m.set(x, y, 'Y');
    }
  ell(m, CX, 18, 11, 9.5, 'N');
  ell(m, CX, 6, 7, 4, 'H');
  // raccoon-dog mask, round eyes looking down at the player, muzzle and a smug smile
  ell(m, 21, 18.5, 5, 4, 'K');
  ell(m, 32, 18.5, 5, 4, 'K');
  ell(m, 21.5, 17, 1.9, 1.9, 'W');
  ell(m, 31.5, 17, 1.9, 1.9, 'W');
  m.set(21, 18, 'k');
  m.set(31, 18, 'k');
  ell(m, CX, 22.5, 5, 3.6, 't');
  m.rect(25, 20, 3, 2, 'k');
  m.line(23, 24, 26, 25, 'k');
  m.line(26, 25, 29, 24, 'k');
  if (pose === 'drum0') {
    capsule(m, 12, 30, 9, 23, 3.2, 'N');
    capsule(m, 41, 30, 44, 23, 3.2, 'N');
  } else if (pose === 'drum1') {
    capsule(m, 12, 30, 17, 39, 3.2, 'N');
    capsule(m, 41, 30, 36, 39, 3.2, 'N');
  } else {
    // sake flask (tokkuri) with a blue label, and the shop's ledger (tsūchō)
    capsule(m, 12, 30, 8, 38, 3.2, 'N');
    m.rect(5, 32, 3, 4, 'W');
    ell(m, 6.5, 41, 4, 5.5, 'W');
    m.rect(3, 40, 7, 2, 'B');
    capsule(m, 41, 30, 45, 37, 3.2, 'N');
    m.rect(42, 36, 8, 10, 'F');
    m.rect(42, 36, 1, 10, 'N');
    m.rect(44, 39, 4, 1, 'k');
    m.rect(44, 42, 4, 1, 'k');
  }
  // glaze shine
  for (const [x, y] of [[17, 31], [18, 30], [19, 12], [21, 34], [34, 33], [7, 38]]) if (m.get(x, y) !== '.') m.set(x, y, 'w');
  if (leaf) {
    ell(m, CX, 3, 6.5, 3, 'G');
    m.line(21, 3, 31, 3, 'g');
    m.set(33, 4, 'N');
    m.set(34, 5, 'N');
  }
  return m;
}

export function tanukiSprites(add) {
  add('tanuki_0', render(tanukiMask('idle0', false)));
  add('tanuki_1', render(tanukiMask('idle1', false)));
  add('tanuki_drum_0', render(tanukiMask('drum0', false)));
  add('tanuki_drum_1', render(tanukiMask('drum1', false)));
  add('tanuki_leaf_0', render(tanukiMask('idle0', true)));
  add('tanuki_leaf_1', render(tanukiMask('idle1', true)));

  // thrown sake flask (two sizes for the arc)
  for (const [name, w, h] of [['tokkuri_0', 5, 8], ['tokkuri_1', 7, 10]]) {
    const m = new Mask(w, h);
    const cx = w / 2;
    m.rect(Math.floor(cx) - 1, 0, 2 + (w % 2), Math.round(h * 0.3), 'W');
    ell(m, cx, h * 0.62, w / 2, h * 0.38, 'W');
    m.rect(0, Math.round(h * 0.55), w, 2, 'B');
    add(name, render(m));
  }
  // leaves for the shapeshifting poof
  add('leaf_0', renderMask(Mask.fromRows(['.g', 'Gg', 'G.']), { outline: false, materials: MAT }));
  add('leaf_1', renderMask(Mask.fromRows(['gG.', '.Gg']), { outline: false, materials: MAT }));
}
