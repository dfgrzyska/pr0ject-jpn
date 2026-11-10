// The shisa pair at 540 px (45 x 43 -> 135 x 129): glazed Tsuboya-kiln lion dogs, seated, the head as big as
// the body the way the potters make them. A flame-tufted mane in dark glaze, each tuft incised with a spiral;
// heavy curled brows over bulging glaring eyes; a wide flat lion nose; cheek puffs and a chin curl; the paws
// with their toes and pale claws. A (open) roars with its tongue curled and holds the gold tama under its paw,
// Un (closed) bares its clenched teeth, its fangs crossing the lips. The glaze shines: gloss on every round.
import { HiSprite, tones, speckle, mottle, mix2, fur } from '../../lib/hisprite.mjs';

const INK = 0x14101c;
const TAU = Math.PI * 2;
const RAMPS = {
  q: tones([0x8a3414, 0xd0682a, 0xf8ac5c]), // amber-orange glaze
  u: tones([0xa04a1c, 0xe08a40, 0xffd08a]), // the lighter glaze of the chest, muzzle and cheeks
  k: tones([0x2a1208, 0x5c2c12, 0xa0602a]), // dark brown glaze of the mane and brows
  l: tones([0x7a1420, 0xc83a4a, 0xf08a96]), // tongue and gums
  y: [0x7a4a00, 0xc88a00, 0xf8c830, 0xffec90, 0xffffff], // the gold tama
  w: tones([0xb0a890, 0xf0ecdc, 0xffffff]), // eye whites, teeth (glazed cream)
};
const GROOVE = 0x2e1408;
const GLOSS = 0xfff4e0;

const glaze = (seed) => ({ pat: mix2(mottle({ amt: 0.12, scale: 10, seed }), speckle({ amt: 0.14, dark: 0.05, light: 0.03, seed: seed + 1 })) });

/** An incised spiral groove: `turns` round from radius r inwards. */
function spiral(s, x, y, r, turns, a0, c = GROOVE, sense = 1) {
  const n = Math.ceil(turns * 60);
  for (let k = 0; k <= n; k++) {
    const t = k / n;
    const a = a0 + sense * t * turns * TAU;
    const rr = r * (1 - t * 0.92);
    s.px(x + Math.cos(a) * rr, y + Math.sin(a) * rr, c, 0.85);
  }
}

/** A flame-shaped tuft of mane: round at its root, curling to a point at `ang`, a spiral in its root. */
function tuft(s, x, y, ang, len, w, sense, seed) {
  const cos = Math.cos(ang);
  const sin = Math.sin(ang);
  const nx = -sin;
  const ny = cos;
  const pts = [];
  // a teardrop whose tip bends to one side
  for (let k = 0; k <= 20; k++) {
    const t = k / 20;
    const hw = w * Math.sin(Math.PI * Math.min(1, 0.15 + t * 0.85)) * (1 - t * 0.85);
    const bend = sense * t * t * w * 1.1;
    pts.push([x + cos * len * t + nx * (hw + bend), y + sin * len * t + ny * (hw + bend)]);
  }
  for (let k = 20; k >= 0; k--) {
    const t = k / 20;
    const hw = w * Math.sin(Math.PI * Math.min(1, 0.15 + t * 0.85)) * (1 - t * 0.85);
    const bend = sense * t * t * w * 1.1;
    pts.push([x + cos * len * t - nx * (hw - bend), y + sin * len * t - ny * (hw - bend)]);
  }
  s.poly(pts, 'k', { ball: [x + cos * len * 0.3, y + sin * len * 0.3, len * 0.75, len * 0.75], pat: mix2(fur(ang, { amt: 0.2, len: 6, w: 1.5, gap: 0.08, seed }), speckle({ amt: 0.1, dark: 0.04, seed })) });
  spiral(s, x + cos * len * 0.22, y + sin * len * 0.22, w * 0.8, 1.6, ang, GROOVE, sense);
  // a groove along the flame to its tip
  for (let k = 8; k <= 17; k++) {
    const t = k / 20;
    const bend = sense * t * t * w * 1.1;
    s.px(x + cos * len * t + nx * bend * 0.6, y + sin * len * t + ny * bend * 0.6, GROOVE, 0.7);
  }
  // gloss on the side towards the light
  s.px(x + cos * len * 0.2 - w * 0.45, y + sin * len * 0.2 - w * 0.5, GLOSS, 0.8);
}

export function shisa(open, f) {
  const s = new HiSprite(135, 129, RAMPS);
  const cx = 67.5;
  const phase = (f / 4) * TAU;
  const breath = Math.sin(phase);
  const g = glaze(open ? 21 : 31);
  const hy = 50; // the head's centre

  // ---- the tail, a flame of mane rising behind the haunch
  tuft(s, cx + (open ? 30 : -30), 92, -Math.PI / 2 + (open ? 0.5 : -0.5), 30, 7, open ? -1 : 1, 5);

  // ---- the seated body: haunches, the barrel of the chest
  for (const sx of [-1, 1]) {
    s.ellipse(cx + sx * 31, 108, 14, 13, 'q', g);
    spiral(s, cx + sx * 31, 107, 8, 1.7, 0, GROOVE, sx);
  }
  s.ellipse(cx, 97 + breath * 0.6, 30, 26, 'q', g);
  s.ellipse(cx, 99 + breath * 0.6, 17, 17, 'u', { ...g, bias: 0.04 });
  for (let k = 0; k < 4; k++) s.line(cx - 10 + k * 2, 88 + k * 6, cx + 10 - k * 2, 88 + k * 6, 0xb05a24, 1, 0.5); // the chest's folds

  // ---- the front legs and paws (A's right paw on the gold tama)
  for (const sx of [-1, 1]) {
    const onBall = open && sx > 0;
    const py = onBall ? 106 : 117;
    if (onBall) {
      s.ellipse(cx + 18, 118, 10.5, 10, 'y', { bias: 0.02 });
      for (let a = 0.3; a < Math.PI - 0.3; a += 0.45) s.line(cx + 18 + Math.cos(a) * 3, 119 + Math.sin(a) * 2, cx + 18 + Math.cos(a) * 8.5, 119 + Math.sin(a) * 7.5, 0x8a5a00, 1, 0.55);
      s.dot(cx + 12, 114, 1, 0xffffff, 0.9);
    }
    s.tube(cx + sx * 17, 84, cx + sx * 18, py - 4, 8, 'q', { rb: 7.5, ...g });
    s.ellipse(cx + sx * 18, py, 10.5, 6.5, 'q', { ...g, bias: 0.04 });
    for (let k = -1; k <= 1; k++) {
      s.line(cx + sx * 18 + k * 3.6, py - 2, cx + sx * 18 + k * 3.6, py + 4, GROOVE, 1, 0.8);
    }
    for (let k = -1.5; k <= 1.5; k++) {
      s.dot(cx + sx * 18 + k * 3.6, py + 5.4, 1.2, 0xf0e8d0);
      s.px(cx + sx * 18 + k * 3.6, py + 6.4, 0x8a7a60);
    }
    // curls of fur at the elbow
    spiral(s, cx + sx * 18, 92, 5, 1.5, 0, GROOVE, -sx);
    s.px(cx + sx * 18 - 4, 84, GLOSS, 0.7);
  }

  // ---- the mane: an outer crown of flame tufts and a ring of curls inside it
  const sway = Math.sin(phase) * 0.06;
  for (let i = 0; i < 15; i++) {
    const a = Math.PI * 0.82 + (i / 14) * Math.PI * 1.36;
    const r = 26;
    tuft(s, cx + Math.cos(a) * r, hy + Math.sin(a) * r * 0.95, a + sway * (i % 2 ? 1 : -1), 18, 9, i < 7 ? -1 : 1, 40 + i);
  }
  for (let i = 0; i < 11; i++) {
    const a = Math.PI * 0.9 + (i / 10) * Math.PI * 1.2;
    const x = cx + Math.cos(a) * 28;
    const y = hy + Math.sin(a) * 26;
    s.ellipse(x, y, 7, 7, 'k', { pat: mix2(fur(a, { amt: 0.18, len: 4, w: 1.4, seed: 60 + i }), speckle({ amt: 0.1, dark: 0.05 })) });
    spiral(s, x, y, 5.2, 1.8, a + phase * 0.25, GROOVE, i < 5 ? -1 : 1);
    s.px(x - 2.5, y - 3, GLOSS, 0.85);
  }

  // ---- the ears, folded forward out of the mane
  for (const sx of [-1, 1]) {
    s.poly([[cx + sx * 15, 30], [cx + sx * 30, 18], [cx + sx * 31, 32], [cx + sx * 22, 36]], 'q', { ball: [cx + sx * 24, 28, 9, 9], ...g });
    s.poly([[cx + sx * 20, 31], [cx + sx * 28, 23], [cx + sx * 28.5, 31]], 'l', { flat: 0.42 });
  }

  // ---- the head, broad and heavy-jawed
  s.ellipse(cx, hy, 28, 25, 'q', g);
  for (const sx of [-1, 1]) s.ellipse(cx + sx * 19, hy + 15, 12, 10, 'u', { ...g, bias: 0.03 }); // the cheek puffs
  s.ellipse(cx, hy + 13, 13, 9, 'u', { ...g, bias: 0.05 }); // the muzzle
  s.dot(cx - 13, hy - 18, 2.4, GLOSS, 0.75);
  s.dot(cx - 9, hy - 20, 1.2, 0xffffff, 0.9);
  // the furrowed brow: three wrinkles over the nose
  for (let k = 0; k < 3; k++) s.line(cx - 5 + k, hy - 10 + k * 3, cx + 5 - k, hy - 10 + k * 3, GROOVE, 1, 0.65);

  // ---- the heavy curled brows
  for (const sx of [-1, 1]) {
    s.tube(cx + sx * 5, hy - 9, cx + sx * 24, hy - 14, 3.4, 'k', { rb: 5.4, pat: fur(sx > 0 ? -0.2 : Math.PI + 0.2, { amt: 0.2, len: 4, w: 1.2 }) });
    s.ellipse(cx + sx * 26, hy - 17, 5.5, 5.5, 'k', { pat: speckle({ amt: 0.1 }) });
    spiral(s, cx + sx * 26, hy - 17, 4.2, 1.6, Math.PI / 2, GROOVE, sx);
    for (let k = 0; k < 4; k++) s.line(cx + sx * (8 + k * 4), hy - 10 - k * 1.2, cx + sx * (10 + k * 4), hy - 13 - k * 1.2, GROOVE, 1, 0.7);
  }

  // ---- the bulging eyes, glaring down at the player, a heavy lid over each
  const look = [0, 0.8, 0, -0.8][f];
  for (const sx of [-1, 1]) {
    const ex = cx + sx * 13;
    const ey = hy - 1;
    s.ellipse(ex, ey, 8.6, 7.6, 'w', { bias: 0.04 });
    s.dot(ex + look, ey + 1.8, 4.6, 0xd08a10);
    s.dot(ex + look, ey + 1.8, 3.4, 0x8a4a00);
    s.dot(ex + look, ey + 2.2, 2.4, INK);
    s.dot(ex + look - 1.6, ey + 0.4, 1, 0xffffff);
    s.px(ex - 4, ey - 4, 0xffffff);
    for (let a = 0; a < TAU; a += 0.04) s.px(ex + Math.cos(a) * 9, ey + Math.sin(a) * 8, 0x3a1a0a);
    // the upper lid, glaring
    s.tube(ex - sx * 8, ey - 3, ex + sx * 8, ey - 6, 2.4, 'q', { rb: 2, ...g });
  }

  // ---- the broad flat nose, big nostrils
  s.ellipse(cx, hy + 9, 11.5, 7, 'u', { ...g, bias: 0.1 });
  s.line(cx, hy - 6, cx, hy + 3, 0xb05a24, 1, 0.7);
  for (const sx of [-1, 1]) {
    s.ellipse(cx + sx * 5.2, hy + 11, 3, 2.3, 'K', { flat: 0.1 });
    s.px(cx + sx * 5.2 - 1, hy + 10, 0x6a2a10);
  }
  s.dot(cx - 5, hy + 5, 1.6, GLOSS, 0.9);

  if (open) {
    // ---- A: the mouth wide open in a roar, the rolled lip round it, teeth and four fangs, the tongue curled up
    const mouth = [[cx - 24, hy + 17], [cx - 12, hy + 20], [cx + 12, hy + 20], [cx + 24, hy + 17], [cx + 19, hy + 36], [cx, hy + 41], [cx - 19, hy + 36]];
    s.poly(mouth.map(([x, y]) => [x + Math.sign(x - cx) * 2, y + (y > hy + 25 ? 2 : -1)]), 'q', { ...g, flat: 0.5 }); // the lip
    s.poly(mouth, 'l', { flat: 0.22 });
    s.poly([[cx - 15, hy + 30], [cx + 15, hy + 30], [cx + 11, hy + 38], [cx, hy + 40], [cx - 11, hy + 38]], 'K', { flat: 0.15 }); // the throat
    const tongue = Math.sin(phase) * 1.2;
    s.ellipse(cx, hy + 33 + tongue, 11, 6, 'l', { bias: 0.06 });
    s.line(cx, hy + 29 + tongue, cx, hy + 37 + tongue, 0x8a1a24, 1, 0.8);
    s.dot(cx - 4, hy + 31 + tongue, 1, 0xffd0d8);
    for (let x = cx - 18; x < cx + 17; x += 4.6) s.poly([[x, hy + 19.5], [x + 4, hy + 19.5], [x + 2, hy + 23.5]], 'w', { flat: 0.75 });
    for (const sx of [-1, 1]) {
      s.poly([[cx + sx * 22, hy + 18], [cx + sx * 16.5, hy + 19], [cx + sx * 20, hy + 30]], 'w', { flat: 0.85 }); // upper fangs
      s.poly([[cx + sx * 17, hy + 37], [cx + sx * 12, hy + 38.5], [cx + sx * 15.5, hy + 28]], 'w', { flat: 0.7 }); // lower fangs
    }
  } else {
    // ---- Un: the jaws clenched in a wide grin, the teeth showing between the lips, the fangs crossing them
    const smile = (x) => hy + 25 - Math.pow((x - cx) / 24, 2) * 7;
    s.poly([[cx - 25, smile(cx - 25) - 4], ...[-20, -10, 0, 10, 20].map((d) => [cx + d, smile(cx + d) - 3.5]), [cx + 25, smile(cx + 25) - 4], [cx + 23, smile(cx + 23) + 5], ...[20, 10, 0, -10, -20].map((d) => [cx + d, smile(cx + d) + 5]), [cx - 23, smile(cx - 23) + 5]], 'K', { flat: 0.12 });
    for (let x = cx - 21; x < cx + 20; x += 4.4) {
      s.poly([[x, smile(x) - 3], [x + 3.8, smile(x + 3.8) - 3], [x + 3.8, smile(x + 3.8) + 0.4], [x, smile(x) + 0.4]], 'w', { flat: 0.72 });
      s.poly([[x + 0.6, smile(x) + 1.2], [x + 4.2, smile(x + 4.2) + 1.2], [x + 4.2, smile(x + 4.2) + 4.2], [x + 0.6, smile(x) + 4.2]], 'w', { flat: 0.6 });
    }
    // the lips rolled over the teeth
    s.tube(cx - 25, smile(cx - 25) - 5, cx, hy + 20.5, 1.6, 'q', { ...g });
    s.tube(cx, hy + 20.5, cx + 25, smile(cx + 25) - 5, 1.6, 'q', { ...g });
    s.tube(cx - 23, smile(cx - 23) + 6, cx + 23, smile(cx + 23) + 6, 1.8, 'q', { ...g });
    for (const sx of [-1, 1]) {
      s.poly([[cx + sx * 23, smile(cx + sx * 23) + 7], [cx + sx * 18.5, smile(cx + sx * 18.5) + 7], [cx + sx * 21.5, smile(cx + sx * 21) - 5]], 'w', { flat: 0.85 }); // lower fangs up over the lip
      s.poly([[cx + sx * 15, smile(cx + sx * 15) - 5], [cx + sx * 11, smile(cx + sx * 11) - 5], [cx + sx * 13.5, smile(cx + sx * 13) + 4]], 'w', { flat: 0.8 }); // upper fangs down
    }
  }
  // whisker curls at the cheeks
  for (const sx of [-1, 1]) {
    tuft(s, cx + sx * 27, hy + 18, Math.PI / 2 + sx * -0.6, 15, 5, sx, 80 + sx);
  }
  return s.render();
}
