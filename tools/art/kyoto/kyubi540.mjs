// Kyūbi at 540 px as the white fox of the Inari shrines (the byakko of the Fushimi Inari statues): white fur,
// a red bib, red lines round almond eyes, the hōju jewel held in its mouth, gold-tipped tails. Picked from three
// proposals (ukiyo-e, byakko, kabuki). Same frame (87 x 147) and tail spines as the old sprites.
import { HiSprite, S, tones, fur, mottle } from '../../lib/hisprite.mjs';
import { spine, tailBox } from './kyubi.mjs';

const INK = 0x14101c;

const V = {
  ramps: {
    a: tones([0xa8a4a8, 0xece8e4, 0xffffff]), // white fur
    b: tones([0xb8b4b4, 0xf6f2ee, 0xffffff]), // the paler ruff, cheeks and tufts
    c: tones([0x9a9496, 0xe0dcd8, 0xfcfaf6]), // the tails' middle
    d: tones([0x8a1010, 0xd02020, 0xff6a50]), // the red of the bib, the ear tips and the brow mark
    p: tones([0xa86a78, 0xe8aab4, 0xffd8dc]), // inside the ears
    j: [0x8a5a00, 0xd09000, 0xffd040, 0xfff0a0, 0xffffff], // gold: the jewel, the tail tips
  },
  eye: 0xe8b020,
  liner: 0xd02020,
  tail: ['a', 'c', 'j'],
};

/** The body, pose idle | blink | cast. */
export function body(pose = 'idle') {
  const s = new HiSprite(87, 147, V.ramps);
  const cx = 43.5;
  const furOut = (y0) => fur((x, y) => Math.atan2(y - y0, x - cx), { amt: 0.4, len: 6, w: 1.5, seed: 21 });
  // seated: haunches, the slender chest, two straight forelegs
  for (const sx of [-1, 1]) s.ellipse(cx + sx * 15, 122, 13, 16, 'a', { pat: furOut(100) });
  s.ellipse(cx, 110, 15, 22, 'a', { pat: furOut(88) });
  // the white ruff down the chest, ragged
  s.poly([[cx - 11, 94], [cx + 11, 94], [cx + 6, 114], [cx, 126], [cx - 6, 114]], 'b', { flat: 0.6, pat: fur(Math.PI / 2, { amt: 0.4, len: 5, w: 1.5 }) });
  for (let k = -2; k <= 2; k++) s.poly([[cx + k * 3.4 - 2.2, 112 - Math.abs(k) * 4], [cx + k * 3.4 + 2.2, 112 - Math.abs(k) * 4], [cx + k * 3.6, 119 - Math.abs(k) * 4]], 'b', { flat: 0.5 });
  for (const sx of [-1, 1]) {
    s.tube(cx + sx * 7, 112, cx + sx * 7.5, 139, 4, 'a', { pat: fur(Math.PI / 2, { amt: 0.35, len: 5, w: 1.4 }) });
    s.ellipse(cx + sx * 7.5, 140, 5, 3.4, 'b', { flat: 0.6 });
    for (const k of [-1, 1]) s.line(cx + sx * 7.5 + k * 1.8, 139, cx + sx * 7.5 + k * 1.8, 142, 0x6a5a50, 1);
  }
  // the neck, between the head and the chest
  s.ellipse(cx, 92, 12, 11, 'a', { pat: furOut(80) });
  s.poly([[cx - 8, 86], [cx + 8, 86], [cx + 5, 100], [cx - 5, 100]], 'b', { flat: 0.55, pat: fur(Math.PI / 2, { amt: 0.35, len: 4, w: 1.3 }) });
  // what it wears at the neck
  {
    // the red yodarekake bib of the shrine foxes
    s.poly([[cx - 15, 90], [cx + 15, 90], [cx + 10, 103], [cx, 109], [cx - 10, 103]], 'd', { flat: 0.55, pat: mottle({ amt: 0.12 }) });
    s.line(cx - 14, 91, cx + 14, 91, 0x8a1010, 1);
  }
  // tall pointed ears growing out of the skull: the base inside the head's outline, the outer edge bowed out,
  // the inside pale with tufts of white fur coming out of it, the tips dark (red on the shrine fox)
  for (const sx of [-1, 1]) {
    const P = (dx, y) => [cx + sx * dx, y];
    const outer = [];
    for (let k = 0; k <= 8; k++) {
      const t = k / 8; // from the base up to the tip, bowing outwards
      outer.push(P(20 + (29 - 20) * t + Math.sin(t * Math.PI) * 3.5, 54 - (54 - 9) * t));
    }
    const inner = [];
    for (let k = 8; k >= 0; k--) {
      const t = k / 8;
      inner.push(P(29 - (29 - 6) * (1 - t) + Math.sin(t * Math.PI) * -1.5, 9 + (44 - 9) * (1 - t)));
    }
    s.poly([...outer, ...inner], 'a', { flat: 0.52, pat: fur(-Math.PI / 2 - sx * 0.35, { amt: 0.32, len: 6, w: 1.4 }) });
    // the hollow of the ear
    s.poly([P(24, 46), P(27.5, 19), P(12.5, 44)], 'p', { flat: 0.3, pat: fur(-Math.PI / 2 - sx * 0.3, { amt: 0.25, len: 4, w: 1.2 }) });
    s.shade([0, 0, 87, 60], (x, y) => y > 20 && y < 46 && Math.abs(x - (cx + sx * 20)) < 5, -0.18);
    // white tufts out of the hollow
    for (let k = 0; k < 4; k++) s.poly([P(14 + k * 2.5, 45 - k * 3), P(19 + k * 2.2, 30 - k * 3.5), P(17.5 + k * 2.5, 45 - k * 3)], 'b', { flat: 0.7 });
    // the tip
    s.poly([P(29, 9), P(30.5, 18), P(25, 16.5)], 'd', { flat: 0.45 });
  }
  // a narrow head: cheeks with tufts sweeping out and down, a long snout
  const face = [[cx - 18, 49], [cx - 8, 42], [cx + 8, 42], [cx + 18, 49], [cx + 23, 61], [cx + 15, 71], [cx + 6, 82], [cx, 88], [cx - 6, 82], [cx - 15, 71], [cx - 23, 61]];
  s.poly(face, 'a', { ball: [cx, 62, 24, 26], pat: furOut(92) });
  for (const sx of [-1, 1]) {
    for (let k = 0; k < 3; k++) s.poly([[cx + sx * 20, 58 + k * 5], [cx + sx * (31 - k * 2), 66 + k * 5], [cx + sx * 18, 66 + k * 4]], k === 2 ? 'b' : 'a', { flat: 0.5 - k * 0.05, pat: fur(sx > 0 ? 0.6 : Math.PI - 0.6, { amt: 0.3, len: 5, w: 1.3 }) });
  }
  // fur of the crown growing over the roots of the ears
  for (const sx of [-1, 1]) for (let k = 0; k < 5; k++) {
    const x0 = cx + sx * (8 + k * 3);
    const y0 = 44 + k * 1.6;
    s.poly([[x0 - 2.2, y0 + 3], [x0 + 2.2, y0 + 3], [x0 + sx * 1.5, y0 - 4 - (k % 2) * 2]], 'a', { flat: 0.62, pat: fur(-Math.PI / 2, { amt: 0.25, len: 4, w: 1.2 }) });
  }
  // a paler muzzle
  s.poly([[cx - 17, 66], [cx - 9, 70], [cx, 69], [cx + 9, 70], [cx + 17, 66], [cx + 13, 72], [cx + 6, 82], [cx, 88], [cx - 6, 82], [cx - 13, 72]], 'b', { ball: [cx, 72, 16, 16], pat: fur((x, y) => Math.atan2(y - 66, x - cx), { amt: 0.3, len: 4, w: 1.3 }) });
  // the black nose, the mouth's line (a sly smile; open on the cry)
  s.ellipse(cx, 85.5, 2.8, 2, 'K');
  s.px(cx - 1, 84.5, 0x9ea6d0);
  if (pose === 'cast') {
    s.poly([[cx - 8, 80], [cx + 8, 80], [cx + 4, 90], [cx - 4, 90]], 'K', { flat: 0.1 });
    s.poly([[cx - 6.5, 80], [cx - 4.5, 80], [cx - 5.5, 84]], 'W', { flat: 0.8 });
    s.poly([[cx + 4.5, 80], [cx + 6.5, 80], [cx + 5.5, 84]], 'W', { flat: 0.8 });
    s.ellipse(cx, 88, 2.4, 1.4, 'M');
  } else {
    s.line(cx - 11, 76, cx - 3, 82, INK, 1);
    s.line(cx + 3, 82, cx + 11, 76, INK, 1);
    s.line(cx, 87, cx, 89, INK, 1);
  }
  // the jewel in the mouth (the Inari foxes hold the hōju)
  {
    s.ellipse(cx, 91, 4, 4.4, 'j', { flat: 0.75, glow: true });
    s.dot(cx - 1.5, 89.5, 1.1, 0xffffff);
  }
    // the gold (or red) flame mark on the brow
    s.poly([[cx, 43], [cx + 3, 49], [cx + 1.5, 52], [cx - 1.5, 52], [cx - 3, 49]], 'd', { flat: 0.7, glow: pose === 'cast' });
  // almond eyes slanting up to the temples, lined in red, a slit pupil
  for (const sx of [-1, 1]) {
    const ex = cx + sx * 11;
    const ey = 62;
    s.line(ex - sx * 6, ey + 1.5, ex + sx * 9, ey - 5, V.liner, 2);
    s.line(ex + sx * 9, ey - 5, ex + sx * 14, ey - 9, V.liner, 1);
    if (pose === 'blink') s.line(ex - sx * 6, ey + 1, ex + sx * 7, ey - 3, INK, 2);
    else {
      const open = pose === 'cast' ? 2.6 : 1.8;
      s.poly([[ex - sx * 6, ey + 1], [ex + sx * 1, ey - open - 1], [ex + sx * 8, ey - 4], [ex + sx * 2, ey + open - 0.5]], 'K', { flat: 0.2 });
      for (let k = -5; k <= 6; k++) {
        const x = ex + sx * k;
        const top = ey - 0.5 - (k + 5) * 0.3 - (open - 1) * Math.sin(((k + 5) / 11) * Math.PI);
        const bot = ey + 0.5 - (k + 5) * 0.28 + (open - 1.2) * Math.sin(((k + 5) / 11) * Math.PI) * 0.6;
        for (let y = Math.ceil(top); y <= bot; y++) s.px(x, y, V.eye);
      }
      s.line(ex + sx * 1.5, ey - open, ex + sx * 1.5, ey + 0.5, INK, 1);
      if (pose === 'cast') s.px(ex - sx * 3, ey - 1, 0xffffff);
    }
    // a dark brow line
    s.line(ex - sx * 5, ey - 6, ex + sx * 6, ey - 9, INK, 1);
  }
  return s.render();
}

/** Tail i (0..4) in swaying frame f (of 6). */
export function tail(i, f) {
  const [hw, hh] = tailBox(i);
  const s = new HiSprite((2 * hw + 3) * S, (2 * hh + 3) * S, V.ramps);
  const ox = s.w / 2;
  const oy = s.h / 2;
  const pts = spine(i, (f * 3) / 6);
  const slim = 0.86;
  const [root, mid, tip] = V.tail;
  const tone = (t, k) => (t > 0.8 + 0.04 * Math.sin(k * 2.7) ? tip : t > 0.45 + 0.05 * Math.sin(k * 1.9) ? mid : root);
  pts.forEach((p, k) => {
    const q = pts[Math.min(pts.length - 1, k + 1)];
    const r = pts[Math.max(0, k - 1)];
    const along = Math.atan2(q.y - r.y, q.x - r.x);
    const t = tone(p.t, k);
    s.ellipse(ox + p.x * S, oy + p.y * S, p.r * S * slim, p.r * S * slim, t, { flat: 0.55, pat: fur(along, { amt: 0.46, len: 7, w: 1.6, seed: 31 + i }) });
  });
  // a lit side and a shadowed side along the tail
  for (let k = 1; k < pts.length; k++) {
    const p = pts[k];
    const q = pts[k - 1];
    const d = Math.hypot(p.x - q.x, p.y - q.y) || 1;
    const nx = -(p.y - q.y) / d;
    const ny = (p.x - q.x) / d;
    const side = nx * -0.6 + ny * -0.8 > 0 ? 1 : -1;
    const cxp = ox + p.x * S;
    const cyp = oy + p.y * S;
    const r = p.r * S * slim;
    s.shade([cxp - r - 1, cyp - r - 1, cxp + r + 1, cyp + r + 1], (x, y) => (x - cxp) ** 2 + (y - cyp) ** 2 <= r * r, (x, y) => (((x - cxp) * nx + (y - cyp) * ny) / r) * side * 0.2);
  }
  s.shade([0, 0, s.w, s.h], (x, y) => Math.hypot(x - ox, y - oy) < 30 * S * 0.45, (x, y) => -0.35 * (1 - Math.hypot(x - ox, y - oy) / (30 * S * 0.45)));
  // tufts along both edges, combed to the tip
  for (let k = 4; k < 62; k += 3) {
    const p = pts[k];
    const q = pts[Math.min(pts.length - 1, k + 1)];
    const d = Math.hypot(q.x - p.x, q.y - p.y) || 1;
    const dx = (q.x - p.x) / d;
    const dy = (q.y - p.y) / d;
    for (const side of [-1, 1]) {
      const r = p.r * S * slim;
      const bx = ox + p.x * S - dy * side * (r - 1.5);
      const by = oy + p.y * S + dx * side * (r - 1.5);
      const len = 5 + ((k * 13 + (side > 0 ? 5 : 0)) % 4) + Math.sin(f * 1.05 + k * 0.3) * 1.2;
      const out = 4.5 + ((k * 7) % 3) * 0.8;
      const tx = bx - dy * side * out + dx * len;
      const ty = by + dx * side * out + dy * len;
      const t = tone(p.t, k);
      s.poly([[bx - dx * 2.5, by - dy * 2.5], [tx, ty], [bx + dx * 2.2 + dy * side * 1.5, by + dy * 2.2 - dx * side * 1.5]], t, { flat: 0.5 + side * 0.1 });
    }
  }
  const e = pts[pts.length - 1];
  const tx = ox + e.x * S;
  const ty = oy + e.y * S;
  // a gold tip
  s.ellipse(tx, ty, 2.4, 2.4, 'j', { flat: 0.8, glow: true });
  return s.render();
}
