// Random encounter 7 (ex7): the press conference. A big man in a suit behind a conference table, a bunch of
// microphones in front of him: an invented figure (no name, no likeness, no office), a nod only to the behaviour of a
// famous press conference: the hand cupped to the ear, the wailing, the table banged, the arm waved about, the train
// tickets. He is one puppet drawn in many poses (man(pose)); the table, the microphones, the glass, the pool of tears
// and the used tissues are parts of their own, so they can jump when he bangs the table.
import { HiSprite, tones, ball, fur } from '../../lib/hisprite.mjs';
import { Raster } from '../../lib/raster.mjs';

const INK = 0x14101c;
const SKIN_LINE = 0x9a5a40;
/** The man's frame (fine px), its middle column, and the row of the table's back edge (his body ends there). */
export const MW = 312;
export const MH = 276;
const CX = 156;
const TB = 232;
const K = 1.16; // how much bigger the head is drawn than its own coordinates (a big head: the face reads at a third of this size)

const RAMPS = {
  n: tones([0x141a30, 0x27345c, 0x4c5e90]), // the suit
  v: tones([0x141a30, 0x27345c, 0x4c5e90]), // its sleeves (a material of their own: a seam where they lie on the suit)
  l: tones([0x1a2240, 0x324270, 0x5a6ea4]), // the lapels
  w: tones([0x9a98a8, 0xe6e4ec, 0xffffff]), // shirt, cuffs, tissues, tickets
  f: tones([0xa8684a, 0xe6b08a, 0xffdcc0]), // skin
  r: tones([0xa04838, 0xea8c72, 0xffc4ac]), // skin, flushed with crying
  h: tones([0x0c0a10, 0x1e1a24, 0x40394a]), // hair
  y: tones([0x7a5410, 0xd4a020, 0xf8dc70]), // the tie
  t: tones([0x2a6a9a, 0x5ab0e8, 0xc0ecff]), // tears, water
  k: tones([0x18161e, 0x2e2c36, 0x5a5864]), // microphones, recorders
  s: tones([0x5a5c66, 0x9a9ca8, 0xd8dae4]), // steel: stands, necks
  c: tones([0xa8a49c, 0xeeeae0, 0xffffff]), // the tablecloth
  q: tones([0x7a1418, 0xd02a26, 0xff7a5e]), // red: a windscreen, the ticket's stripe
  b: tones([0x1a3a7a, 0x2e62c0, 0x7aa8f0]), // blue windscreen
  g: tones([0x1e5a2a, 0x3a9a4a, 0x8ad890]), // green windscreen
  o: tones([0x8a5a10, 0xe09a20, 0xffd870]), // orange windscreen
  e: tones([0x7a8088, 0xb8c4cc, 0xf0f8ff]), // glass
};

/** A filled ellipse of detail pixels. */
function fillE(s, cx, cy, rx, ry, c, a = 1) {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) s.px(x, y, c, a);
}

/** A detail line through several points. */
function path(s, pts, c, w = 2) {
  for (let i = 1; i < pts.length; i++) s.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], c, w);
}

// ---------------------------------------------------------------- the head
// (hx, hy): its centre; a: how far it is tipped (radians); f: the face { eyes, brows, mouth, tears, flush, bowed }
function head(s, hx, hy, a, f) {
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const P = (dx, dy) => [hx + (dx * ca - dy * sa) * K, hy + (dx * sa + dy * ca) * K]; // head's own coordinates -> the frame's
  const L = (x, y) => [((x - hx) * ca + (y - hy) * sa) / K, (-(x - hx) * sa + (y - hy) * ca) / K]; // and back
  const skin = f.flush ? 'r' : 'f';
  const box = [hx - 64 * K, hy - 64 * K, hx + 64 * K, hy + 74 * K];
  const jaw = f.mouth === 'huge' ? 9 : f.mouth === 'open' ? 4 : 0; // the jaw drops with the mouth
  const lit = ball(0, 6, 40, 50, 0.05);
  const light = (x, y) => lit(...L(x, y));
  // ears
  for (const sx of [-1, 1]) {
    const [ex, ey] = P(sx * 34, 3);
    s.ellipse(ex, ey, 7 * K, 10.5 * K, skin, { bias: 0.02 });
    s.line(ex + sx, ey - 5, ex + sx * 2, ey + 4, SKIN_LINE, 1);
  }
  // the face: a round skull over a fuller jaw
  s.paint(box, (x, y) => {
    const [u, v] = L(x, y);
    return (u / 33) ** 2 + ((v + 3) / 36) ** 2 <= 1 || (u / 29.5) ** 2 + ((v - 10 - jaw / 2) / (30 + jaw / 2)) ** 2 <= 1;
  }, skin, light);
  // the shadow under the cheekbones and the chin
  s.shade(box, (x, y) => {
    const [u, v] = L(x, y);
    return v > 30 + jaw || Math.abs(u) > 27;
  }, -0.1);
  // hair: short, parted on one side, a little volume over the skull; when he is slumped on the table we see its top
  const bowed = f.bowed ? 90 : 0;
  const strands = fur((x, y) => 0.5 + (L(x, y)[0] + 12) * 0.03, { amt: 0.3, len: 9, w: 1.7, seed: 4 });
  s.paint(box, (x, y) => {
    const [u, v] = L(x, y);
    if ((u / 37) ** 2 + ((v + 7) / 41) ** 2 > 1) return false;
    const line = -20 + bowed + 0.011 * (u - 8) ** 2 - (u > -16 && u < -9 ? 5 : 0);
    return v < line || (Math.abs(u) > 28.5 && v < 2 + bowed * 0.3);
  }, 'h', light, { pat: strands });
  if (f.bowed) {
    // the crown, a whorl of hair
    const [wx, wy] = P(2, -6);
    for (let k = 0; k < 14; k++) s.px(wx + Math.cos(k * 0.9) * k * 0.5, wy + Math.sin(k * 0.9) * k * 0.4, 0x40394a);
    return;
  }
  // brows
  const BROW = { flat: [-12, -12], sad: [-15, -10], sad2: [-18, -9], up: [-17, -17], angry: [-9, -14] }[f.brows ?? 'sad'];
  for (const sx of [-1, 1]) s.line(...P(sx * 7, BROW[0]), ...P(sx * 25, BROW[1]), INK, 3);
  // eyes
  for (const sx of [-1, 1]) {
    const kind = f.eyes === 'squint' ? (sx < 0 ? 'blink' : 'side') : f.eyes;
    const [ex, ey] = P(sx * 16, -3);
    if (kind === 'cry') {
      // squeezed shut, the lids an arch, creases at the outer corner
      path(s, [P(sx * 8, -1), P(sx * 12, -5), P(sx * 18, -6), P(sx * 24, -2)], INK, 3);
      s.line(...P(sx * 25, -4), ...P(sx * 29, -7), SKIN_LINE, 1);
      s.line(...P(sx * 25, -1), ...P(sx * 29, 0), SKIN_LINE, 1);
    } else if (kind === 'blink') {
      path(s, [P(sx * 9, -3), P(sx * 16, -1), P(sx * 23, -3)], INK, 2);
    } else {
      const wide = kind === 'wide';
      fillE(s, ex, ey, (wide ? 8 : 7) * K, (wide ? 6.5 : 4.6) * K, 0xffffff);
      const look = kind === 'side' ? -3 : 0;
      fillE(s, ex + look, ey + (wide ? 0 : 0.5), (wide ? 2.6 : 3.2) * K, (wide ? 2.6 : 3.4) * K, 0x1a1420);
      s.px(ex + look - 1, ey - 1, 0xffffff);
      path(s, [P(sx * 8, -5), P(sx * 16, wide ? -10 : -8), P(sx * 24, -5)], INK, 2); // the upper lid
      if (!wide) s.line(...P(sx * 10, 3), ...P(sx * 22, 3), SKIN_LINE, 1); // a bag under the eye
    }
  }
  // the nose (red when he cries)
  path(s, [P(-1, 1), P(-3, 11), P(3, 12)], SKIN_LINE, 2);
  if (f.flush) fillE(s, ...P(0, 9), (5) * K, (4.5) * K, 0xe0503c, 0.45);
  // the cheeks' flush
  if (f.flush) for (const sx of [-1, 1]) fillE(s, ...P(sx * 21, 10), (8) * K, (6) * K, 0xe0503c, 0.3);
  // the mouth
  const M = 21;
  if (f.mouth === 'open' || f.mouth === 'huge') {
    const rx = (f.mouth === 'huge' ? 15 : 11) * K;
    const ry = (f.mouth === 'huge' ? 15 : 9) * K;
    const [mx, my] = P(0, M + (f.mouth === 'huge' ? 6 : 2));
    fillE(s, mx, my, rx + 1.8, ry + 1.8, INK);
    fillE(s, mx, my, rx, ry, 0x4a0e18);
    // teeth along the top, the tongue at the bottom, the uvula quivering
    for (let x = -rx; x <= rx; x++) for (let y = -ry; y <= -ry + 5; y++) if ((x / rx) ** 2 + (y / ry) ** 2 <= 1) s.px(mx + x, my + y, 0xfffaf0);
    for (let x = -rx; x <= rx; x++) for (let y = ry * 0.35; y <= ry; y++) if ((x / rx) ** 2 + (y / ry) ** 2 <= 1) s.px(mx + x, my + y, 0xd85a5e);
    s.line(mx, my + ry * 0.4, mx, my + ry - 2, 0xb04048, 1);
    if (f.mouth === 'huge') fillE(s, mx, my - ry + 10, 2.4, 3.6, 0xd85a5e);
  } else if (f.mouth === 'o') {
    const [mx, my] = P(-2, M + 2);
    fillE(s, mx, my, (6.5) * K, (7.5) * K, INK);
    fillE(s, mx, my, (5) * K, (6) * K, 0x4a0e18);
  } else if (f.mouth === 'grit') {
    const [mx, my] = P(0, M + 1);
    fillE(s, mx, my, (13.5) * K, (7) * K, INK);
    fillE(s, mx, my, (12) * K, (5.5) * K, 0xfffaf0);
    s.line(mx - 12 * K, my, mx + 12 * K, my, 0x8a8a94, 1);
    for (let k = -2; k <= 2; k++) s.line(mx + k * 4.5 * K, my - 5 * K, mx + k * 4.5 * K, my + 5 * K, 0x8a8a94, 1);
  } else if (f.mouth === 'tremble') {
    // lips pressed and wobbling, the corners pulled down, a slit of the mouth showing
    const pts = [];
    for (let x = -12; x <= 12; x += 2) pts.push(P(x, M + 2 + Math.sin(x * 0.9) * 2 + (x * x) / 40));
    path(s, pts, INK, 3);
    fillE(s, ...P(0, M + 4), (5) * K, (2) * K, 0x4a0e18);
  } else if (f.mouth === 'pout') {
    path(s, [P(-6, M + 3), P(-2, M), P(2, M), P(6, M + 3)], INK, 3);
    s.line(...P(-3, M + 6), ...P(3, M + 6), SKIN_LINE, 1);
  } else {
    // a wobbling line, the corners down
    const pts = [];
    for (let x = -9; x <= 9; x += 2) pts.push(P(x, M + 1 + Math.sin(x * 0.8) * 1.3 + (x * x) / 50));
    path(s, pts, INK, 2);
  }
  // tears: streams down the cheeks and off the jaw (floods when he wails)
  if (f.tears) for (const sx of [-1, 1]) {
    const n = f.tears > 1 ? 2 : 1;
    for (let k = 0; k < n; k++) {
      const [x0, y0] = P(sx * (19 + k * 5), 0);
      const [x1, y1] = P(sx * (22 + k * 6), 20);
      const [x2, y2] = P(sx * (19 + k * 7), 38 + jaw + (f.tears > 1 ? 8 : 0) - k * 6);
      s.tube(x0, y0, x1, y1, f.tears > 1 ? 2.6 : 1.8, 't', { rb: f.tears > 1 ? 3.2 : 2.2, glow: true, bias: 0.2 });
      s.tube(x1, y1, x2, y2, f.tears > 1 ? 3.2 : 2.2, 't', { rb: 1.6, glow: true, bias: 0.2 });
    }
    if (f.tears > 1) s.ellipse(...P(sx * 12, 44 + jaw), 2.6, 3.6, 't', { glow: true, bias: 0.25 }); // a drop off the chin
  }
}

// ---------------------------------------------------------------- hands and arms
// kind: 'flat' on the table, 'fist', 'open' fingers spread, 'cup' behind the ear, 'tissue', 'tickets'; an: where
// the forearm is heading
function hand(s, x, y, kind, sx, an) {
  const ux = Math.cos(an);
  const uy = Math.sin(an);
  const finger = (a, len, r = 3.2) => s.tube(x + Math.cos(a) * 6, y + Math.sin(a) * 6, x + Math.cos(a) * (8 + len), y + Math.sin(a) * (8 + len), r, 'f', { rb: r - 0.6, bias: 0.04 });
  if (kind === 'open') {
    for (let k = -2; k <= 2; k++) finger(an + k * 0.42, k === -2 * sx ? 9 : 14 - Math.abs(k) * 1.5);
    s.ellipse(x, y, 10.5, 10.5, 'f', { bias: 0.04 });
    s.line(x - ux * 3 - uy * 5, y - uy * 3 + ux * 5, x - ux * 3 + uy * 5, y - uy * 3 - ux * 5, SKIN_LINE, 1);
  } else if (kind === 'cup') {
    for (let k = 0; k < 4; k++) finger(-Math.PI / 2 + (k - 1.5) * 0.24 - sx * 0.1, 15 - Math.abs(k - 1.5) * 2.5, 3);
    s.ellipse(x, y, 8.5, 11.5, 'f', { bias: 0.04 });
    finger(-Math.PI / 2 - sx * 1.5, 6, 3.2); // the thumb, towards the ear
  } else if (kind === 'flat') {
    s.ellipse(x, y, 13, 8.5, 'f', { bias: 0.04 });
    for (let k = -1; k <= 1; k++) s.line(x + k * 5 - sx * 2, y + 1, x + k * 5 - sx * 4, y + 7, SKIN_LINE, 1);
    s.ellipse(x - sx * 11, y - 2, 4, 3.4, 'f', { bias: 0.04 }); // the thumb
  } else {
    // a fist (holding something, perhaps)
    if (kind === 'tickets') {
      for (let k = -1; k <= 1; k++) {
        const a = -Math.PI / 2 + k * 0.5 + sx * 0.2;
        const c = Math.cos(a);
        const d = Math.sin(a);
        const q = (u, v) => [x + c * u - d * v, y - 4 + d * u + c * v];
        s.poly([q(2, -7), q(30, -7), q(30, 7), q(2, 7)], 'w', { flat: 0.8 });
        s.poly([q(24, -7), q(30, -7), q(30, 7), q(24, 7)], 'q', { flat: 0.6 });
        s.line(...q(8, -2), ...q(20, -2), 0x5a5864, 1);
        s.line(...q(8, 2), ...q(16, 2), 0x5a5864, 1);
      }
    }
    s.ellipse(x, y, 11, 10, 'f', { bias: 0.04 });
    for (let k = -1; k <= 1; k++) s.line(x + k * 5 - uy * 2, y - 2 + ux * 0, x + k * 5 - uy * 2, y + 5, SKIN_LINE, 1);
    if (kind === 'tissue') {
      s.ellipse(x + 2, y - 9, 9, 7, 'w', { bias: 0.08 });
      s.ellipse(x - 6, y - 5, 6, 5.5, 'w', { bias: 0.04 });
      s.ellipse(x + 8, y - 3, 6, 5, 'w', { bias: 0 });
      s.line(x - 2, y - 11, x + 4, y - 6, 0xb8b6c4, 1);
      s.line(x + 5, y - 12, x + 9, y - 6, 0xb8b6c4, 1);
    }
  }
}

function arm(s, sx, sh, el, ha, kind) {
  const dx = ha[0] - el[0];
  const dy = ha[1] - el[1];
  const l = Math.hypot(dx, dy) || 1;
  const wx = ha[0] - (dx / l) * 13;
  const wy = ha[1] - (dy / l) * 13;
  s.tube(sh[0], sh[1], el[0], el[1], 15.5, 'v', { rb: 13.5 });
  s.ellipse(el[0], el[1], 13.5, 13.5, 'v');
  s.tube(el[0], el[1], wx, wy, 13.5, 'v', { rb: 11 });
  // creases at the elbow, the white cuff
  s.shade([el[0] - 16, el[1] - 16, el[0] + 16, el[1] + 16], (x, y) => Math.abs(Math.hypot(x - el[0], y - el[1]) - 8) < 1.2, -0.14);
  s.tube(wx, wy, wx + (dx / l) * 5, wy + (dy / l) * 5, 10.5, 'w', { bias: 0.1 });
  hand(s, ha[0], ha[1], kind, sx, Math.atan2(dy, dx));
}

// ---------------------------------------------------------------- the man
const REST = { el: [84, 206], ha: [60, 245], kind: 'flat' };
const FIST = { el: [84, 204], ha: [58, 244], kind: 'fist' };
const SAD = { eyes: 'open', brows: 'sad', mouth: 'wobble' };
const WAIL = { eyes: 'cry', brows: 'sad2', mouth: 'huge', tears: 2, flush: true };
const SOB = { eyes: 'cry', brows: 'sad2', mouth: 'open', tears: 2, flush: true };
// each pose: how far he leans (lean) and sinks (drop), a breath taken (breath), the head's shift and tip, the face,
// and the two arms (L: on the left of the picture; el, ha: elbow and hand, x from his middle column outwards)
export const POSES = {
  // sitting, sniffling: breathing, blinking
  idle0: { face: SAD, L: REST, R: REST },
  idle1: { breath: 2, face: SAD, L: REST, R: REST },
  blink: { breath: 1, face: { ...SAD, eyes: 'blink' }, L: REST, R: REST },
  talk: { breath: 1, face: { eyes: 'open', brows: 'sad', mouth: 'open' }, L: REST, R: REST }, // mumbling an answer
  sniff: { breath: 4, hy: -3, face: { eyes: 'cry', brows: 'sad2', mouth: 'pout', tears: 1 }, L: REST, R: REST },
  // the hand going to the ear, cupped behind it (two frames: he strains), and "what?"
  ear0: { lean: -5, hx: -4, tilt: -0.07, face: { eyes: 'side', brows: 'up', mouth: 'o' }, L: { el: [104, 192], ha: [92, 146], kind: 'cup' }, R: REST },
  ear1: { lean: -12, hx: -10, tilt: -0.2, face: { eyes: 'squint', brows: 'up', mouth: 'o' }, L: { el: [114, 174], ha: [80, 108], kind: 'cup' }, R: REST },
  ear2: { lean: -14, hx: -12, hy: 2, tilt: -0.26, face: { eyes: 'squint', brows: 'up', mouth: 'open' }, L: { el: [116, 176], ha: [84, 113], kind: 'cup' }, R: FIST },
  // sobbing: a gulp of breath (head back), the wail (head forward, mouth wide), the head shaken side to side
  sob0: { drop: -3, breath: 3, hy: -8, face: { eyes: 'cry', brows: 'sad2', mouth: 'tremble', tears: 1, flush: true }, L: FIST, R: FIST },
  sob1: { drop: 3, hy: 7, face: WAIL, L: FIST, R: FIST },
  sob2: { drop: 1, hx: 6, hy: 3, tilt: 0.17, face: SOB, L: FIST, R: FIST },
  sob3: { drop: 1, hx: -6, hy: 3, tilt: -0.17, face: SOB, L: FIST, R: FIST },
  // both fists up... and down on the table
  bang0: { drop: -4, breath: 2, hy: -6, face: { eyes: 'cry', brows: 'angry', mouth: 'grit', tears: 1, flush: true }, L: { el: [102, 128], ha: [86, 64], kind: 'fist' }, R: { el: [102, 128], ha: [86, 64], kind: 'fist' } },
  bang1: { drop: 9, hy: 12, face: { ...WAIL, brows: 'angry' }, L: { el: [90, 200], ha: [46, 247], kind: 'fist' }, R: { el: [90, 200], ha: [46, 247], kind: 'fist' } },
  // an arm flung about, the fingers spread: out, up, across
  wave0: { lean: 5, hx: 3, tilt: 0.08, face: { ...SOB, tears: 1 }, L: FIST, R: { el: [100, 142], ha: [130, 92], kind: 'open' } },
  wave1: { drop: -2, face: { ...SOB, tears: 1, mouth: 'huge' }, L: FIST, R: { el: [98, 128], ha: [106, 60], kind: 'open' } },
  wave2: { lean: -5, hx: -3, tilt: -0.08, face: { ...SOB, tears: 1 }, L: FIST, R: { el: [88, 126], ha: [66, 60], kind: 'open' } },
  // the tickets: a fan of them drawn from the jacket, then flung
  throw0: { lean: -3, face: { eyes: 'open', brows: 'angry', mouth: 'grit', tears: 1, flush: true }, L: FIST, R: { el: [96, 198], ha: [44, 186], kind: 'tickets' } },
  throw1: { lean: 6, hx: 3, drop: -2, face: { eyes: 'wide', brows: 'angry', mouth: 'open', tears: 1, flush: true }, L: FIST, R: { el: [104, 140], ha: [128, 86], kind: 'open' } },
  // a tissue to the nose
  wipe0: { hy: 2, face: { eyes: 'cry', brows: 'sad', mouth: 'pout', tears: 1, flush: true }, L: { el: [88, 198], ha: [8, 122], kind: 'tissue' }, R: REST },
  wipe1: { hy: 4, hx: 2, tilt: 0.07, face: { eyes: 'blink', brows: 'sad2', mouth: 'pout', flush: true }, L: { el: [90, 196], ha: [4, 118], kind: 'tissue' }, R: REST },
  // beaten: slumped forward, his forehead on the table, the arms sprawled
  down: { drop: 40, hy: 62, face: { bowed: true }, L: { el: [100, 222], ha: [72, 250], kind: 'flat' }, R: { el: [100, 222], ha: [72, 250], kind: 'flat' } },
};

export function man(name) {
  const p = POSES[name];
  const s = new HiSprite(MW, MH, RAMPS);
  const lean = p.lean ?? 0;
  const drop = p.drop ?? 0;
  const breath = p.breath ?? 0;
  const c = CX + lean;
  const SY = 156 + drop - breath; // the shoulders
  const hx = CX + lean + (p.hx ?? 0);
  const hy = 98 + drop * 0.9 + (p.hy ?? 0) - breath;
  // the jacket, to the table's back edge
  const body = ball(c, SY + 50, 96, 120, 0.02);
  s.poly([[c - 66, SY + 12], [c - 44, SY - 6], [c + 44, SY - 6], [c + 66, SY + 12], [CX + 74 + lean * 0.3, TB], [CX - 74 + lean * 0.3, TB]], 'n', { ball: [c, SY + 50, 96, 120], bias: 0.02 });
  for (const sx of [-1, 1]) s.paint([c + sx * 56 - 18, SY - 6, c + sx * 56 + 18, SY + 30], (x, y) => ((x - c - sx * 56) / 17) ** 2 + ((y - SY - 12) / 17) ** 2 <= 1, 'n', body);
  // the neck, the shirt in the jacket's V, the collar, the tie
  s.tube(c, SY, hx, hy + 30, 14.5, 'f', { rb: 13 });
  s.shade([c - 20, hy + 28, c + 20, SY + 4], () => true, -0.12); // (the chin's shadow)
  s.poly([[c - 21, SY - 6], [c + 21, SY - 6], [CX + lean * 0.6, TB]], 'w', { flat: 0.78 });
  s.poly([[c - 6, SY - 3], [c + 6, SY - 3], [c + 4, SY + 9], [c - 4, SY + 9]], 'y', { flat: 0.7 });
  s.poly([[c - 4, SY + 9], [c + 4, SY + 9], [CX + lean * 0.7 + 6.5, SY + 50], [CX + lean * 0.6, TB], [CX + lean * 0.7 - 6.5, SY + 50]], 'y', { flat: 0.55 });
  for (let k = 0; k < 5 && SY + 21 + k * 11 < TB - 3; k++) s.line(c - 5, SY + 16 + k * 11, c + 5, SY + 21 + k * 11, 0xf8dc70, 2); // its stripes
  for (const sx of [-1, 1]) {
    s.poly([[c + sx * 22, SY - 7], [c + sx * 7, SY - 14], [c + sx * 3, SY + 3], [c + sx * 13, SY + 8]], 'w', { flat: 0.95 }); // collar
    s.poly([[c + sx * 21, SY - 6], [c + sx * 36, SY + 6], [c + sx * 24, SY + 32], [CX + lean * 0.7 + sx * 9, SY + 44]], 'l', { flat: 0.6 }); // lapel
  }
  // the breast pocket, a handkerchief's corner in it
  s.line(c + 34, SY + 36, c + 52, SY + 34, 0x0e1224, 1);
  s.poly([[c + 37, SY + 35], [c + 42, SY + 26], [c + 48, SY + 34]], 'w', { flat: 0.9 });
  // the jacket creasing as he hunches
  s.shade([c - 70, SY, c + 70, TB], (x, y) => Math.abs(((x - c) * 0.35 + (y - SY)) % 34 - 17) < 1.2 && Math.abs(x - c) > 26, -0.08);
  head(s, hx, hy, p.tilt ?? 0, p.face);
  for (const sx of [-1, 1]) {
    const a = sx < 0 ? p.L : p.R;
    arm(s, sx, [c + sx * 57, SY + 12], [CX + sx * a.el[0], a.el[1] + (a.ha[1] > TB ? drop * 0.3 : 0)], [CX + sx * a.ha[0], a.ha[1]], a.kind);
  }
  return s.render();
}

// ---------------------------------------------------------------- the conference table (158 x 40 -> 474 x 120)
// seen a little from above: the cloth's top (he rests his hands on it) and its front, hanging in folds; on it a
// blank name card, two voice recorders, a box of tissues, sheets of notes, the microphones' cables over the edge
export function table() {
  const W = 474;
  const s = new HiSprite(W, 120, RAMPS);
  const TOP = 4;
  const EDGE = 36;
  s.poly([[14, TOP], [W - 14, TOP], [W, EDGE], [0, EDGE]], 'c', { flat: 0.82 });
  const folds = (x, y) => Math.sin(x * 0.085 + Math.sin(x * 0.011) * 3) * 0.1 * Math.min(1, (y - EDGE) / 30) + Math.sin(x * 0.31) * 0.02;
  s.poly([[0, EDGE], [W, EDGE], [W, 116], [0, 116]], 'c', { flat: 0.6, pat: folds });
  s.shade([0, EDGE, W, EDGE + 5], () => true, -0.16); // the top's shadow on the front
  s.shade([0, 108, W, 116], (x, y) => y > 110 + Math.sin(x * 0.085) * 2, -0.2); // the hem
  s.shade([0, TOP, W, EDGE], (x) => x > W - 80, -0.06);
  // sheets of notes
  for (const [x, y, w, a] of [[16, 13, 40, -0.1], [352, 9, 34, 0.06]]) {
    const q = (u, v) => [x + u + v * a * 2, y + v + u * a * 0.3];
    s.poly([q(0, 0), q(w, 0), q(w + 5, 17), q(-5, 17)], 'w', { flat: 0.95 });
    for (let k = 0; k < 4; k++) s.line(...q(4, 3 + k * 3.5), ...q(w - 6 - (k % 2) * 8, 3 + k * 3.5), 0x8a8a9a, 1);
  }
  // the name card: a folded tent of card, nothing but strokes on it
  s.poly([[82, 26], [136, 26], [139, 48], [79, 48]], 'w', { flat: 0.9 });
  s.poly([[82, 26], [136, 26], [133, 21], [85, 21]], 'c', { flat: 0.45 });
  for (const [x0, x1, y] of [[89, 106, 33], [111, 129, 33], [94, 124, 41]]) s.line(x0, y, x1, y, INK, 2);
  // voice recorders, their red lamps on
  for (const [x, y] of [[208, 21], [262, 19], [368, 20]]) {
    s.poly([[x, y], [x + 13, y], [x + 15, y + 13], [x - 2, y + 13]], 'k', { flat: 0.5 });
    s.px(x + 3, y + 3, 0xff4030);
    s.px(x + 4, y + 3, 0xff4030);
    s.line(x + 3, y + 8, x + 10, y + 8, 0x5a5864, 1);
  }
  // a box of tissues, one pulled half out
  s.poly([[400, 8], [440, 8], [444, 30], [396, 30]], 'b', { flat: 0.6 });
  s.poly([[396, 30], [444, 30], [444, 40], [396, 40]], 'b', { flat: 0.4 });
  s.poly([[412, 12], [420, 0], [430, 3], [428, 14]], 'w', { flat: 0.95 });
  s.line(408, 14, 432, 14, 0x1a3a7a, 2);
  // the cables, over the edge and down the cloth
  for (const [x0, x1, sag] of [[222, 204, 60], [232, 236, 74], [246, 262, 52], [240, 280, 80]]) {
    const pts = [];
    for (let t = 0; t <= 1; t += 0.05) pts.push([x0 + (x1 - x0) * t + Math.sin(t * 5 + x0) * 3, TOP + 6 + (EDGE - TOP - 6 + sag) * t]);
    path(s, pts, 0x2e2c36, 2);
  }
  return s.render();
}

// ---------------------------------------------------------------- the microphones (46 x 34 -> 138 x 102)
// a bunch of them on short stands, each broadcaster's in its own colour (plain: no names, no signs); jump: thrown
// into the air and apart by a fist on the table
const MICS_W = 138;
export function mics(jump = false) {
  const s = new HiSprite(MICS_W, 102, RAMPS);
  const base = 96;
  const list = [[-36, 44, 'q', -0.32], [-19, 58, 'b', -0.14], [0, 66, 'k', 0], [18, 56, 'g', 0.16], [36, 42, 'o', 0.34]];
  for (const [dx, h, col, a0] of list) {
    const a = a0 * (jump ? 1.9 : 1);
    const lift = jump ? 5 + Math.abs(dx) * 0.12 : 0;
    const x0 = MICS_W / 2 + dx * 0.85;
    const y0 = base - lift;
    const x1 = x0 + Math.sin(a) * h;
    const y1 = y0 - Math.cos(a) * h;
    s.ellipse(x0, y0, 8, 3.4, 's', { bias: -0.04 }); // the stand's foot
    s.tube(x0, y0, x1, y1, 1.8, 's', { bias: 0.05 }); // its neck
    // the body and the foam windscreen, tilted with the neck; a band where they meet
    s.tube(x1 - Math.sin(a) * 15, y1 + Math.cos(a) * 15, x1 - Math.sin(a) * 4, y1 + Math.cos(a) * 4, 3.4, 'k');
    s.ellipse(x1 + Math.sin(a) * 2, y1 - Math.cos(a) * 2, 7.5, 9, col, { bias: 0.04, tex: 0.12, seed: dx + 40, texScale: 2 });
    s.line(x1 - Math.sin(a) * 6 - Math.cos(a) * 3, y1 + Math.cos(a) * 6 - Math.sin(a) * 3, x1 - Math.sin(a) * 6 + Math.cos(a) * 3, y1 + Math.cos(a) * 6 + Math.sin(a) * 3, 0xd8dae4, 2);
  }
  return s.render();
}

/** A glass of water (8 x 12 -> 24 x 36); empty: knocked dry. */
export function glass(empty = false) {
  const s = new HiSprite(24, 36, RAMPS);
  s.poly([[4, 4], [20, 4], [18, 32], [6, 32]], 'e', { flat: 0.7 });
  if (!empty) s.poly([[5.5, 13], [18.5, 13], [17.5, 30], [6.5, 30]], 't', { flat: 0.62 });
  s.line(7, 7, 8, 28, 0xffffff, 1, 0.8);
  s.line(4, 4, 20, 4, 0xf0f8ff, 1);
  return s.render();
}

/** The pool of tears on the tablecloth, growing: 0 a few drops, 1 a puddle, 2 a flood running off the front. */
export function puddle(n) {
  const s = new HiSprite(210, 96, RAMPS);
  const blob = (x, y, rx, ry) => {
    s.ellipse(x, y, rx, ry, 't', { flat: 0.55, glow: true });
    s.shade([x - rx, y - ry, x + rx, y + ry], (px, py) => ((px - x + rx * 0.25) / (rx * 0.5)) ** 2 + ((py - y + ry * 0.3) / (ry * 0.35)) ** 2 < 1, 0.3); // its sheen
  };
  if (n === 0) {
    blob(88, 14, 9, 3.4);
    blob(118, 20, 7, 2.8);
    blob(104, 10, 4, 1.8);
  } else {
    blob(105, 15, n === 1 ? 38 : 70, n === 1 ? 7 : 10);
    blob(70, 21, n === 1 ? 16 : 30, n === 1 ? 4 : 7);
    blob(140, 20, n === 1 ? 14 : 34, n === 1 ? 4 : 7);
  }
  if (n === 2) {
    // over the edge and down the front of the cloth, in runs that end in drops
    for (const [x, len] of [[58, 34], [84, 52], [108, 40], [131, 58], [156, 30]]) {
      s.tube(x, 24, x + 1, 26 + len, 3, 't', { rb: 2, glow: true, bias: 0.15 });
      s.ellipse(x + 1, 28 + len, 3.2, 4.2, 't', { glow: true, bias: 0.25 });
    }
  }
  return s.render({ outline: 0 });
}

/** Used tissues piling up on the table: n = 1..3. */
export function tissues(n) {
  const s = new HiSprite(66, 36, RAMPS);
  const ball1 = (x, y, r, seed) => {
    s.ellipse(x, y, r, r * 0.8, 'w', { bias: 0.02, tex: 0.3, seed, texScale: 2 });
    s.line(x - r * 0.5, y - r * 0.2, x + r * 0.2, y + r * 0.3, 0xb8b6c4, 1);
    s.line(x + r * 0.1, y - r * 0.5, x + r * 0.5, y, 0xb8b6c4, 1);
  };
  for (const [x, y, r] of [[20, 26, 8], [40, 27, 7], [30, 15, 7.5], [52, 28, 6], [10, 28, 5.5], [44, 16, 6]].slice(0, n * 2)) ball1(x, y, r, x);
  return s.render();
}

/** A train ticket fluttering: 0 flat, 1 tipped, 2 edge on; stamped: the red cross of a day no train ran. */
export function ticket(f, stamped = false) {
  const s = new HiSprite(42, 28, RAMPS);
  if (f === 2) {
    s.poly([[3, 12], [39, 11], [39, 15], [3, 16]], 'w', { flat: 0.6 });
    s.poly([[31, 11], [39, 11], [39, 15], [31, 15]], 'q', { flat: 0.5 });
  } else {
    const k = f === 1 ? 0.55 : 1; // tipped: foreshortened
    const y0 = 14 - 10 * k;
    const y1 = 14 + 10 * k;
    const sk = f === 1 ? 3 : 0;
    s.poly([[3 + sk, y0], [39 + sk * 0.3, y0], [39 - sk, y1], [3 - sk * 0.3, y1]], 'w', { flat: 0.8 });
    s.poly([[30 + sk * 0.5, y0], [39 + sk * 0.3, y0], [39 - sk, y1], [30 - sk * 0.5, y1]], 'q', { flat: 0.6 });
    for (let i = 0; i < 3; i++) s.line(7, 14 + (i - 1) * 5 * k, 24 - i * 4, 14 + (i - 1) * 5 * k, 0x5a5864, 1);
    s.dot(27, 14 + 5 * k, 1.4, 0x5a5864); // the punch
    if (stamped) {
      s.line(8, y0 + 2, 26, y1 - 2, 0xd02a26, 3);
      s.line(26, y0 + 2, 8, y1 - 2, 0xd02a26, 3);
    }
  }
  return s.render({ outline: 1 });
}

/** A camera's flash from the press benches: a four-pointed star of light (n: 0 at its brightest, 1 fading). */
export function flash(n) {
  const R = 30;
  const r = new Raster(R * 2 + 1, R * 2 + 1);
  for (let y = -R; y <= R; y++)
    for (let x = -R; x <= R; x++) {
      const d = Math.hypot(x, y);
      const ray = Math.max(0, 1 - Math.abs(x) / 2.5) * Math.max(0, 1 - Math.abs(y) / R) + Math.max(0, 1 - Math.abs(y) / 2.5) * Math.max(0, 1 - Math.abs(x) / R);
      const core = Math.max(0, 1 - d / (n ? 6 : 10)) ** 1.5;
      const halo = Math.max(0, 1 - d / (R * 0.7)) ** 2 * 0.35;
      const a = Math.min(1, (ray * 0.9 + core + halo) * (n ? 0.55 : 1));
      if (a > 0.02) r.set(x + R, y + R, 0xffffff, a);
    }
  return r;
}

export function kaikenEnemies(add) {
  for (const p of Object.keys(POSES)) add(`kk_${p}`, man(p));
  add('kk_table', table());
  add('kk_mics_0', mics());
  add('kk_mics_1', mics(true));
  add('kk_glass', glass());
  add('kk_glass_dry', glass(true));
  for (let n = 0; n < 3; n++) add(`kk_puddle_${n}`, puddle(n));
  for (let n = 1; n <= 3; n++) add(`kk_tissues_${n}`, tissues(n));
  add('kk_flash_0', flash(0));
  add('kk_flash_1', flash(1));
  add('ticket_0', ticket(0));
  add('ticket_1', ticket(1));
  add('ticket_2', ticket(2));
  add('ticket_x', ticket(0, true));
}
