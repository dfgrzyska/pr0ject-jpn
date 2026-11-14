// Random encounter 1 (ex1): the vending machine that has had enough. A Japanese street jidōhanbaiki seen a little
// from the side: cream enamel cabinet with a canopy, a glowing red header that is its face (two big LED eyes under
// heavy brows), the brightly backlit window of sample drinks (plastic bottles, cans, little brown energy bottles) on
// chrome shelves with their price tags and the blue (cold) and red (hot) lit buttons, the coin and note slots, the
// four-digit lottery display of the machines that "might give you another one free", the flap where the can comes out
// (its mouth), two stubby feet. No brand anywhere, no words. Shaken up, it bulges, its window fills with fizz and
// caps pop; hurt, it dents and its glass cracks; smashed, it sparks and rages; stunned by its own jackpot, its eyes
// spin. Its cans (hot coffee, cold drink, the golden prize), their splashes and puddles, the foam it sprays, its
// coins and drops (bullets), its red LED digits.
import { HiSprite, tones, speckle, crackle, mix2 } from '../../lib/hisprite.mjs';
import { mix } from '../../lib/raster.mjs';

const INK = 0x14101c;
const RAMPS = {
  c: tones([0x9a9282, 0xe8e2d2, 0xfffcf2]), // the cabinet, cream enamel
  e: tones([0x6a6458, 0xb8b2a2, 0xdcd6c6]), // its side, in shade
  r: tones([0x7a1418, 0xd02a26, 0xff7a5e]), // the red header
  k: tones([0x18161e, 0x2e2c36, 0x4e4c58]), // dark: the flap, the slots, the feet
  s: tones([0x5a5a64, 0xb8bac4, 0xf4f6ff]), // chrome, can tops
  h: tones([0x5a1408, 0xb8341a, 0xff8a50]), // a hot can
  b: tones([0x0e3070, 0x2a6ad0, 0x9ad0ff]), // a cold can
  o: tones([0x8a6010, 0xe8b830, 0xfff4a8]), // the prize can, gold
  f: tones([0x3a1c08, 0x7a4422, 0xb87e4a]), // coffee
  i: tones([0x5a90c0, 0xa8d8f4, 0xf4fcff]), // slush, ice, frost
  w: tones([0xa8b0b8, 0xe8eef4, 0xffffff]), // foam
  l: [0x9ab0c8, 0xbcd0e4, 0xd8e8f4, 0xeaf4fc, 0xffffff], // the backlit window's light
};
const DRINKS = [0x2a7ad8, 0xd02a26, 0x3aa84a, 0xe8b830, 0xf4f4f0, 0x8a4ab8, 0xe86a20, 0x1a1a2a, 0x6ad0c8, 0xd84a8a];
const W = 168;
const H = 246;
const CX = 80; // the front's centre (the side panel takes the right-hand strip)

/** The front's left and right edges at height y (bulging when it is shaken up). */
const edges = (y, bulge) => {
  const k = bulge ? Math.sin((Math.PI * Math.max(0, Math.min(208, y - 18))) / 208) * bulge : 0;
  return [10 - k, 148 + k];
};

// ---------------------------------------------------------------- the machine (56 x 82 -> 168 x 246)
// look: { eyes: 'calm' | 'blink' | 'angry' | 'squeeze' | 'dizzy' | 'rage', lights: 0 | 1, open, bulge, fizz, hurt, smashed }
export function jihanki(look = {}) {
  const { eyes = 'calm', lights = 0, open = false, bulge = 0, fizz = 0, hurt = false, smashed = false } = look;
  const s = new HiSprite(W, H, RAMPS);
  const dent = hurt || smashed;
  // the feet and the plinth
  for (const fx of [34, 124]) s.paint([fx - 16, 226, fx + 16, 245], (x, y) => y > 226 && Math.abs(x - fx) < 15 - Math.max(0, y - 238) * 0.8, 'k', (x) => 0.5 - (x - fx) / 60);
  s.paint([8, 220, 160, 230], (x, y) => y >= 221 && y <= 229 && x >= 9 && x <= 159 - (y - 221) * 0.2, 'k', () => 0.35);
  // the side panel, in perspective: a strip down the right, its top slanting back
  s.paint([148, 4, 164, 224], (x, y) => x > 148 && x <= 163 && y > 10 - (x - 148) * 0.35 && y <= 222, 'e', (x, y) => 0.5 - (x - 148) / 50 - (y - 110) / 900, { pat: speckle({ amt: 0.04 }) });
  // the front: cream enamel with rounded shoulders, bulging when shaken
  const front = (x, y) => {
    const [l, r] = edges(y, bulge);
    if (x < l || x > r || y < 14 || y > 222) return false;
    const corner = 8;
    if (y < 14 + corner) {
      const dx = Math.max(0, l + corner - x, x - (r - corner));
      return dx * dx + (14 + corner - y) ** 2 <= corner * corner;
    }
    return true;
  };
  s.paint([0, 10, 160, 224], front, 'c', (x, y) => 0.66 - (x - CX) / 320 - (y - 110) / 1000, { pat: mix2(speckle({ amt: 0.035 }), dent ? crackle({ amt: 0.05, scale: 8 }) : () => 0) });
  // the canopy over the header, overhanging, its shadow under it
  s.paint([4, 4, 164, 20], (x, y) => y >= 5 && y <= 17 && x >= 5 + (17 - y) * 0.1 && x <= 162 - (17 - y) * 0.3, 'r', (x, y) => 0.42 - (y - 5) / 40 - (x - 80) / 500);
  for (let x = 12; x < 147; x++) s.px(x, 19, 0x5a1010, 0.5);
  // the header: the face, lit from inside (a glowing panel), the eyes on it
  s.paint([14, 22, 146, 66], (x, y) => x >= 15 && x <= 145 && y >= 23 && y <= 64, 'r', (x, y) => 0.7 - Math.abs(y - 43) / 70 - Math.abs(x - CX) / 500, { glow: true });
  for (let x = 15; x <= 145; x++) {
    s.px(x, 23, 0xff9a7a, 0.8);
    s.px(x, 64, 0x5a0a0a, 0.8);
  }
  face(s, eyes);
  // the window of samples, backlit, on its chrome shelves
  vitrine(s, { lights, fizz, hurt, smashed });
  // the right-hand panel: the note slot (lit green), the coin slot, the return lever, the change cup
  s.paint([124, 70, 144, 180], (x, y) => x >= 125 && x <= 143 && y >= 71 && y <= 179, 'c', () => 0.48);
  s.paint([127, 76, 141, 86], (x, y) => x >= 128 && x <= 140 && y >= 77 && y <= 85, 'k', () => 0.15);
  for (let x = 129; x <= 139; x++) s.px(x, 81, lights ? 0x6aff8a : 0x3ad860, 1);
  s.paint([129, 94, 139, 110], (x, y) => x >= 130 && x <= 138 && y >= 95 && y <= 109, 's', (x) => 0.7 - (x - 130) / 30);
  for (let y = 98; y < 107; y++) s.px(134, y, INK);
  s.tube(129, 122, 139, 122, 2.6, 's', { rb: 2.6 });
  s.ellipse(134, 140, 5, 4, 'k', { flat: 0.2 });
  s.paint([127, 156, 141, 172], (x, y) => x >= 128 && x <= 140 && y >= 157 && y <= 171, 'k', () => 0.25);
  // the lottery display: a black box for the game's four red digits, a little "7" lamp beside it
  s.paint([38, 176, 100, 194], (x, y) => x >= 39 && x <= 99 && y >= 177 && y <= 193, 'k', () => 0.06);
  for (let x = 39; x <= 99; x++) s.px(x, 177, 0x6a6872);
  s.dot(108, 185, 3.5, lights ? 0xffe060 : 0xa88a30);
  // the flap where the can comes out: its mouth
  flap(s, open, eyes === 'rage' || smashed);
  // the wear and tear
  if (dent) {
    s.ellipse(140, 200, 9, 6, 'c', { flat: 0.3 });
    s.ellipse(18, 186, 6, 5, 'c', { flat: 0.3 });
    s.ellipse(60, 214, 7, 3, 'c', { flat: 0.34 });
    for (const [x0, y0, x1, y1] of [[150, 40, 156, 70], [156, 70, 152, 96]]) s.line(x0, y0, x1, y1, 0x4a443a, 1);
  }
  if (smashed) {
    // the canopy buckled, a cable hanging out of the corner, sparks
    s.line(8, 18, 150, 12, 0x3a0808, 2);
    s.tube(20, 168, 14, 200, 1.4, 'k', { rb: 1 });
    s.dot(14, 202, 2.6, 0xfff0a0);
    s.dot(17, 205, 1.6, 0xff9a40);
    s.dot(11, 205, 1.2, 0xff6a30);
  }
  return s.render();
}

/** The face on the header: two big LED eyes, heavy brows. */
function face(s, eyes) {
  const y0 = 44;
  for (const sx of [-1, 1]) {
    const ex = CX + sx * 32;
    const glow = eyes === 'rage' ? 0xff5a3a : 0xfff2b8;
    const iris = eyes === 'rage' ? 0x8a0a0a : INK;
    if (eyes === 'blink') {
      s.line(ex - 14, y0 + 2, ex + 14, y0 + 2, glow, 3);
    } else if (eyes === 'squeeze') {
      // > <  squeezed shut, straining
      s.line(ex - sx * 12, y0 - 8, ex + sx * 8, y0, glow, 3);
      s.line(ex + sx * 8, y0, ex - sx * 12, y0 + 8, glow, 3);
    } else if (eyes === 'dizzy') {
      for (let a = 0; a < Math.PI * 5; a += 0.12) s.px(ex + Math.cos(a * sx) * a * 1.0, y0 + Math.sin(a * sx) * a * 0.75, glow, 1), s.px(ex + Math.cos(a * sx) * a * 1.0 + 1, y0 + Math.sin(a * sx) * a * 0.75, glow, 1);
    } else {
      // an almond of light, the upper lid cut flat and slanting in (angrier: more so), the pupil looking down at you
      const slant = eyes === 'calm' ? 0.18 : 0.4;
      const lid = (x) => y0 - 9 + (x - ex) * sx * -slant + (eyes === 'calm' ? 0 : 2);
      s.paint([ex - 16, y0 - 12, ex + 16, y0 + 12], (x, y) => ((x - ex) / 15) ** 2 + ((y - y0) / 9.5) ** 2 < 1 && y > lid(x), 'w', () => 0.95, { glow: true });
      for (let y = y0 - 12; y <= y0 + 12; y++) for (let x = ex - 16; x <= ex + 16; x++) if (((x - ex) / 15) ** 2 + ((y - y0) / 9.5) ** 2 < 1 && y > lid(x)) s.px(x, y, mix(glow, 0xffffff, Math.max(0, 0.5 - Math.hypot(x - ex, y - y0) / 20)));
      s.ellipse(ex - sx * 3, y0 + 2, 4.6, 5, 'k', { flat: 0.1, glow: true });
      for (let y = y0 - 3; y <= y0 + 7; y++) for (let x = ex - sx * 3 - 5; x <= ex - sx * 3 + 5; x++) if (((x - ex + sx * 3) / 4.6) ** 2 + ((y - y0 - 2) / 5) ** 2 < 1 && y > lid(x)) s.px(x, y, iris);
      s.dot(ex - sx * 3 - 1.5, y0, 1.2, 0xffffff);
    }
    // the brow: a dark bar slanting down to the middle (calm: barely)
    const tilt = eyes === 'calm' || eyes === 'blink' ? 4 : eyes === 'dizzy' ? -3 : 9;
    s.tube(ex - sx * 18, y0 - 15 - (tilt > 0 ? 0 : -tilt), ex + sx * 14, y0 - 15 + tilt, 3, 'k', { rb: 2.4 });
  }
  if (eyes === 'rage') for (const [x, y] of [[CX - 2, 30], [CX + 3, 34], [CX - 1, 38]]) s.dot(x, y, 1.2, 0xffd060); // a vein of light, throbbing
}

/** The window: a backlit cabinet of sample drinks on three chrome shelves, price tags, lit buttons. */
function vitrine(s, { lights, fizz, hurt, smashed }) {
  const X0 = 18;
  const X1 = 120;
  const Y0 = 70;
  const Y1 = 172;
  s.paint([X0, Y0, X1, Y1], () => true, 'l', (x, y) => 0.95 - (y - Y0) / 160 - Math.abs(x - (X0 + X1) / 2) / 260 - (smashed ? 0.25 : 0), { glow: true });
  for (let x = X0; x <= X1; x++) s.px(x, Y0, 0x8a8478);
  for (let y = Y0; y <= Y1; y++) {
    s.px(X0, y, 0x8a8478);
    s.px(X1, y, 0xd8d2c2);
  }
  const rows = [Y0 + 4, Y0 + 37, Y0 + 70];
  rows.forEach((sy, row) => {
    for (let k = 0; k < 6; k++) {
      const cx = X0 + 10 + k * 16.4;
      const col = DRINKS[(k * 7 + row * 3) % DRINKS.length];
      if (smashed && (k + row) % 3 === 0) continue; // fallen off the shelf
      const jig = fizz ? ((k * 13 + row * 7 + fizz * 5) % 5) - 2 : 0;
      const kind = (k + row * 2) % 3;
      if (kind === 0) bottle(s, cx + jig * 0.5, sy, col, fizz && (k + row + fizz) % 3 === 0);
      else if (kind === 1) tin(s, cx + jig * 0.5, sy + 8, col);
      else brown(s, cx + jig * 0.5, sy + 8, col);
    }
    // the shelf: a chrome rail, the price tags along it, the buttons under them
    const ry = sy + 27;
    for (let x = X0 + 1; x < X1; x++) {
      s.px(x, ry, 0xf4f6ff);
      s.px(x, ry + 1, 0x8a8c98);
    }
    const hot = row === 2;
    for (let k = 0; k < 6; k++) {
      const bx = X0 + 10 + k * 16.4;
      for (let y = ry + 2; y < ry + 5; y++) for (let x = bx - 5; x <= bx + 5; x++) s.px(x, y, 0xffffff);
      for (let d = 0; d < 3; d++) s.px(bx - 3 + d * 2, ry + 3, 0xd02a26);
      const on = lights ? k % 2 : (k + 1) % 2;
      s.paint([bx - 5, ry + 5, bx + 5, ry + 9], (x, y) => Math.abs(x - bx) <= 4 && y >= ry + 6 && y <= ry + 8, 'k', () => 0.1, { glow: true });
      for (let y = ry + 6; y <= ry + 8; y++) for (let x = bx - 4; x <= bx + 4; x++) s.px(x, y, hot ? (on ? 0xff6a50 : 0xb02a20) : on ? 0x7ac0ff : 0x2a5ab0);
    }
  });
  // the glass: two long diagonal glints
  for (let k = 0; k < 2; k++) for (let t = 0; t < 70; t++) {
    const x = X0 + 14 + k * 46 + t * 0.55;
    const y = Y1 - 4 - t * 1.4;
    for (let w = 0; w < (k ? 3 : 6); w++) if (x + w < X1 && y > Y0) s.px(x + w, y, 0xffffff, 0.22);
  }
  if (fizz) {
    // shaken up: bubbles everywhere behind the glass, foam piling at the top
    const n = fizz === 1 ? 60 : 110;
    for (let k = 0; k < n; k++) {
      const x = X0 + 4 + ((k * 37 + fizz * 11) % (X1 - X0 - 8));
      const y = Y0 + 6 + ((k * 53 + fizz * 29) % (Y1 - Y0 - 10));
      const r = 1 + ((k * 7) % 3) * 0.8;
      for (let a = 0; a < Math.PI * 2; a += 0.6 / r) s.px(x + Math.cos(a) * r, y + Math.sin(a) * r, 0xffffff, 0.85);
      s.px(x - r * 0.4, y - r * 0.4, 0xffffff);
    }
    const foamH = fizz === 1 ? 10 : 20;
    s.paint([X0 + 1, Y0 + 1, X1 - 1, Y0 + foamH + 6], (x, y) => y < Y0 + foamH + Math.sin(x * 0.4) * 3 + Math.sin(x * 0.13) * 2, 'w', (x, y) => 0.75 + Math.sin(x * 0.7 + y) * 0.1, { glow: true });
  }
  if (hurt || smashed) for (const [x0, y0, x1, y1] of [[34, 90, 62, 124], [62, 124, 54, 160], [62, 124, 96, 116], [96, 116, 110, 148], [62, 124, 70, 96]]) s.line(x0, y0, x1, y1, 0xf4fcff, 1, 0.95);
  if (smashed) {
    // the glass gone in a corner: dark, jagged
    s.paint([X0, Y0, X0 + 46, Y0 + 44], (x, y) => x - X0 + (y - Y0) * 1.05 < 44 + Math.sin(y * 1.3) * 3, 'k', () => 0.1);
    for (const [x0, y0, x1, y1] of [[X0 + 2, Y0 + 2, X0 + 30, Y0 + 26], [X0 + 10, Y0, X0 + 18, Y0 + 16]]) s.line(x0, y0, x1, y1, 0xf4fcff, 1);
  }
}

/** A plastic bottle: shoulders, neck, cap, a coloured label; popped: no cap, foam fountaining out. */
function bottle(s, cx, sy, col, popped) {
  const sh = (y) => (y < sy + 6 ? 2.2 : y < sy + 10 ? 2.2 + (y - sy - 6) * 0.9 : 5.6);
  for (let y = sy + 2; y < sy + 26; y++) for (let x = Math.floor(cx - 6); x <= cx + 6; x++) {
    const d = Math.abs(x - cx);
    if (d > sh(y)) continue;
    s.px(x, y, mix(0xe8f4fc, 0x9ab0c4, d / 6 + (x > cx ? 0.2 : 0)), 0.9);
  }
  for (let y = sy + 12; y < sy + 21; y++) for (let x = Math.floor(cx - 5.6); x <= cx + 5.6; x++) s.px(x, y, mix(col, INK, Math.max(0, (x - cx) / 14)));
  for (let x = Math.floor(cx - 5); x <= cx + 5; x++) s.px(x, sy + 15, 0xffffff, 0.5);
  if (!popped) for (let y = sy - 1; y < sy + 2; y++) for (let x = Math.floor(cx - 2.6); x <= cx + 2.6; x++) s.px(x, y, mix(col, 0xffffff, 0.3));
  else for (let k = 0; k < 8; k++) s.dot(cx + Math.sin(k * 1.7) * 2, sy - k * 1.5, 1.6 - k * 0.1, 0xffffff);
  s.px(cx - 3, sy + 22, 0xffffff, 0.8);
}

/** A can: label wrapped round, rim and top. */
function tin(s, cx, sy, col) {
  for (let y = sy + 2; y < sy + 18; y++) for (let x = Math.floor(cx - 5); x <= cx + 5; x++) s.px(x, y, mix(col, INK, Math.max(0, (x - cx) / 12) + (x < cx - 3 ? -0.1 : 0)));
  for (let y = sy + 2; y < sy + 18; y++) s.px(cx - 4, y, 0xffffff, 0.5);
  for (let x = Math.floor(cx - 5); x <= cx + 5; x++) {
    s.px(x, sy + 1, 0xe0e2ea);
    s.px(x, sy + 9, 0xffffff, 0.55);
  }
}

/** A little brown glass bottle (an energy drink): stubby, a gold cap, a white label. */
function brown(s, cx, sy, col) {
  for (let y = sy + 4; y < sy + 18; y++) for (let x = Math.floor(cx - 4); x <= cx + 4; x++) s.px(x, y, mix(0x6a3a14, 0x2a1408, Math.max(0, (x - cx + 2) / 8)));
  for (let y = sy; y < sy + 4; y++) for (let x = Math.floor(cx - 2); x <= cx + 2; x++) s.px(x, y, 0x6a3a14);
  for (let x = Math.floor(cx - 2); x <= cx + 2; x++) s.px(x, sy - 1, 0xe8b830);
  for (let y = sy + 8; y < sy + 13; y++) for (let x = Math.floor(cx - 4); x <= cx + 4; x++) s.px(x, y, mix(0xf4f0e8, col, 0.25));
  s.px(cx - 3, sy + 6, 0xffffff, 0.8);
}

/** The flap: shut (louvres), or swung up like a jaw, a can in its dark mouth. */
function flap(s, open, angry) {
  const X0 = 26;
  const X1 = 112;
  if (!open) {
    s.paint([X0, 198, X1, 218], (x, y) => x >= X0 + 1 && x <= X1 - 1 && y >= 199 && y <= 217, 'k', (x, y) => 0.4 - (y - 199) / 60);
    for (let k = 0; k < 7; k++) for (let x = X0 + 3; x < X1 - 2; x++) s.px(x, 202 + k * 2.2, 0x5a5862, 0.8);
    for (let x = X0 + 1; x < X1; x++) s.px(x, 199, 0x8a8892);
    return;
  }
  // open: the flap swung up and in, the mouth dark, teeth of the louvres, a can rolling out
  s.paint([X0, 192, X1, 220], (x, y) => x >= X0 + 1 && x <= X1 - 1 && y >= 193 && y <= 219, 'k', () => 0.02);
  for (let x = X0 + 1; x < X1; x++) for (let j = 0; j < 4; j++) s.px(x, 190 + j, j < 2 ? 0x8a8892 : 0x3a3842);
  for (let k = 0; k < 7; k++) s.poly([[X0 + 6 + k * 12, 194], [X0 + 12 + k * 12, 194], [X0 + 9 + k * 12, angry ? 201 : 198]], 's', { flat: 0.75 });
  s.paint([58, 202, 82, 220], (x, y) => x >= 59 && x <= 81 && y >= 204 && y <= 219, 'h', (x) => 0.85 - (x - 59) / 50);
  s.ellipse(70, 204, 11, 3, 's', { flat: 0.8 });
  for (let x = 60; x <= 80; x++) s.px(x, 211, 0xffd080, 0.8);
}

/** Its shadow on the ground (stays put while it hops; the game squashes it). */
export function shadow() {
  const s = new HiSprite(150, 30, RAMPS);
  for (let y = 0; y < 30; y++) for (let x = 0; x < 150; x++) {
    const d = ((x - 75) / 72) ** 2 + ((y - 15) / 13) ** 2;
    if (d < 1) s.px(x, y, 0x0a0812, 0.45 * (1 - d * 0.6));
  }
  return s.render({ outline: 0 });
}

// ---------------------------------------------------------------- the cans it throws (10 x 14 -> 30 x 42)
export function can(kind) {
  const s = new HiSprite(30, 42, RAMPS);
  const m = kind === 'hot' ? 'h' : kind === 'gold' ? 'o' : 'b';
  // the body: a cylinder lit from the left, a band, the label's picture
  s.paint([3, 5, 27, 38], (x, y) => x >= 4 && x <= 26 && y >= 7 && y <= 37, m, (x) => 0.92 - Math.abs(x - 10) / 18);
  for (let x = 4; x <= 26; x++) {
    s.px(x, 12, 0xffffff, 0.5);
    s.px(x, 31, 0x000000, 0.25);
  }
  if (kind === 'hot') {
    // a coffee bean on a cream band, and a wisp of steam drawn on
    for (let y = 16; y < 28; y++) for (let x = 5; x <= 25; x++) s.px(x, y, mix(0xf0dcc0, 0xb89a78, Math.max(0, (x - 12) / 16)));
    s.ellipse(14, 22, 5, 4, 'f', { flat: 0.55 });
    s.line(11, 20, 17, 24, 0x2a1408, 1);
  } else if (kind === 'cold') {
    // a white wave and a snowflake
    for (let x = 5; x <= 25; x++) for (let y = 0; y < 3; y++) s.px(x, 24 + Math.sin(x * 0.5) * 2 + y, 0xffffff, 0.9);
    for (let a = 0; a < 3; a++) s.line(14 - Math.cos(a * 1.05) * 5, 18 - Math.sin(a * 1.05) * 5, 14 + Math.cos(a * 1.05) * 5, 18 + Math.sin(a * 1.05) * 5, 0xffffff, 1);
    for (const [x, y] of [[7, 10], [22, 14], [8, 33], [21, 34]]) s.dot(x, y, 1.1, 0xf4fcff, 0.9); // condensation
  } else {
    for (const [x, y, r] of [[10, 18, 2.4], [20, 26, 1.8], [12, 30, 1.4]]) {
      s.line(x - r * 2, y, x + r * 2, y, 0xffffff, 1);
      s.line(x, y - r * 2, x, y + r * 2, 0xffffff, 1);
    }
  }
  // the top: the rim, the lid, the ring pull; the bottom rim
  s.ellipse(15, 7, 11.4, 3.6, 's', { flat: 0.85 });
  s.ellipse(15, 7, 8.6, 2.4, 's', { flat: 0.6 });
  s.ellipse(18, 6.6, 2.6, 1.2, 'k', { flat: 0.35 });
  s.ellipse(15, 37, 11, 2.6, 's', { flat: 0.45 });
  for (let y = 9; y < 36; y++) s.px(7, y, 0xffffff, 0.45);
  return s.render();
}

// ---------------------------------------------------------------- splashes (crown splash, 3 frames) and puddles
export function splash(hot, f) {
  const s = new HiSprite(60, 48, RAMPS);
  const m = hot ? 'f' : 'i';
  const k = [0.45, 0.8, 1][f];
  // the crown: spikes of liquid rising round a ring, drops flying off the tips
  s.paint([0, 0, 60, 48], (x, y) => ((x - 30) / (24 * k)) ** 2 + ((y - 36) / (8 * k)) ** 2 < 1, m, (x, y) => 0.55 + (y < 36 ? 0.15 : 0));
  for (let n = 0; n < 9; n++) {
    const a = Math.PI * (0.05 + (n / 8) * 0.9);
    const bx = 30 - Math.cos(a) * 22 * k;
    const h = (12 + (n % 3) * 5) * (f === 2 ? 0.7 : 1) * k;
    s.tube(bx, 36, bx - Math.cos(a) * 4 * k, 36 - h, 2.2 * k + 0.6, m, { rb: 1.2 });
    if (f > 0) s.dot(bx - Math.cos(a) * (6 + f * 4), 36 - h - 4 - f * 3, 1.6, hot ? 0x9a6a3a : 0xf4fcff);
  }
  if (!hot) for (let n = 0; n < 4; n++) s.paint([0, 0, 60, 48], (x, y) => Math.abs(x - (16 + n * 9)) < 3 && Math.abs(y - (30 - (n % 2) * 6 - f * 3)) < 3, 'i', () => 0.95); // ice cubes tumbling
  else for (let n = 0; n < 3; n++) for (let y = 8; y < 30; y++) s.px(20 + n * 10 + Math.sin(y * 0.5 + n + f) * 2, y - f * 4, 0xffffff, 0.3); // steam
  return s.render({ outline: 1 });
}

export function puddle(hot, f) {
  const s = new HiSprite(96, 60, RAMPS);
  const lobes = [[48, 30, 36, 16], [24, 33, 17, 11], [72, 26, 19, 12], [42, 20, 15, 9], [62, 39, 15, 9], [14, 26, 7, 5], [86, 36, 6, 4]];
  const inside = (x, y) => lobes.some(([cx, cy, rx, ry]) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1);
  if (hot) {
    // a spreading pool of coffee: flat and glossy, paler where it thins at the edge, the sky's light lying on it in
    // long streaks, a ring rippling out from where the can hit, a little crema foam
    s.paint([0, 0, 96, 60], inside, 'f', (x, y) => 0.42 + Math.sin((x * 0.5 + y * 1.2) * 0.2 + f * 2) * 0.03, { glow: true });
    s.shade([0, 0, 96, 60], (x, y) => inside(x, y) && (!inside(x - 3, y - 2) || !inside(x + 3, y + 2)), 0.25);
    for (const [x0, y0, len] of [[26, 22, 22], [50, 30, 14], [64, 22, 10]]) for (let t = 0; t < len; t++) s.px(x0 + t, y0 - t * 0.12, 0xffe8c8, 0.75 - t / (len * 1.6));
    for (let a = 0; a < Math.PI * 2; a += 0.035) {
      const r = 9 + f * 6;
      s.px(48 + Math.cos(a) * r, 30 + Math.sin(a) * r * 0.45, 0xd8a870, 0.7);
    }
    for (const [x, y] of [[20, 30], [70, 34], [40, 38]]) s.ellipse(x, y, 3, 1.6, 'w', { flat: 0.7 });
  } else {
    // pale blue slush, ice cubes standing in it, frost sparkling round the edge
    s.paint([0, 0, 96, 60], inside, 'i', (x, y) => 0.5 + Math.sin((x + y * 2 + f * 9) * 0.2) * 0.07 - Math.hypot(x - 48, (y - 30) * 2) / 220, { pat: speckle({ amt: 0.06 }) });
    for (const [x, y, z] of [[30, 26, 6], [56, 22, 5], [64, 36, 6], [42, 36, 4], [22, 34, 4]]) {
      s.poly([[x - z, y], [x, y - z * 0.6], [x + z, y], [x, y + z * 0.6]], 'i', { flat: 0.95 });
      s.poly([[x - z, y], [x, y + z * 0.6], [x, y + z * 1.3], [x - z, y + z * 0.7]], 'i', { flat: 0.62 });
      s.poly([[x + z, y], [x, y + z * 0.6], [x, y + z * 1.3], [x + z, y + z * 0.7]], 'i', { flat: 0.42 });
    }
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2 + f * 0.7;
      const x = 48 + Math.cos(a) * 38;
      const y = 30 + Math.sin(a) * 17;
      s.line(x - 2, y, x + 2, y, 0xffffff, 1);
      s.line(x, y - 2, x, y + 2, 0xffffff, 1);
    }
  }
  return s.render({ outline: 1, outlineColor: hot ? 0x1a0c04 : 0x2a4a6a });
}

// ---------------------------------------------------------------- the foam it sprays (soft clouds of bubbles, 4 sizes)
export function foam(size) {
  const r = [5, 8, 11, 15][size];
  const d = Math.ceil(r * 2 + 6);
  const s = new HiSprite(d, d, RAMPS);
  const c = d / 2;
  const blobs = [[0, 0, r], [-r * 0.5, r * 0.25, r * 0.7], [r * 0.5, r * 0.3, r * 0.65], [r * 0.1, -r * 0.45, r * 0.6]];
  for (const [bx, by, br] of blobs) s.ellipse(c + bx, c + by, br, br * 0.9, 'w', { bias: 0.12 });
  for (let k = 0; k < 3 + size * 2; k++) {
    const a = k * 2.3;
    const rr = (k % 3) * 0.4 + 0.8;
    const x = c + Math.cos(a) * r * 0.55;
    const y = c + Math.sin(a) * r * 0.5;
    for (let t = 0; t < Math.PI * 2; t += 0.5) s.px(x + Math.cos(t) * rr * 1.4, y + Math.sin(t) * rr * 1.4, 0x9ab0c8, 0.6);
  }
  return s.render({ outline: 1, outlineColor: 0x5a7090 });
}

/** A bottle cap popping off (spinning: 2 frames). */
export function cap(f) {
  const s = new HiSprite(15, 15, RAMPS);
  if (f) s.paint([2, 6, 13, 9], () => true, 'r', () => 0.6);
  else {
    s.ellipse(7.5, 7.5, 5.5, 5.5, 'r', { bias: 0.1 });
    for (let a = 0; a < Math.PI * 2; a += 0.5) s.px(7.5 + Math.cos(a) * 5.5, 7.5 + Math.sin(a) * 5.5, 0x5a0a0a);
  }
  return s.render({ outline: 1 });
}

// ---------------------------------------------------------------- its bullets: coins, bubbles, coffee drops, ice cubes
/** A 5-yen coin: gold, the hole in the middle, a ring; dark outline so it reads as a bullet. */
export function coin() {
  const s = new HiSprite(21, 21, RAMPS);
  s.ellipse(10.5, 10.5, 8.6, 8.6, 'o', { bias: 0.15, glow: true });
  for (let a = 0; a < Math.PI * 2; a += 0.22) s.px(10.5 + Math.cos(a) * 6.4, 10.5 + Math.sin(a) * 6.4, 0xa87a18);
  s.ellipse(10.5, 10.5, 2.4, 2.4, 'k', { flat: 0.05 });
  s.dot(7, 7, 1.4, 0xffffff);
  return s.render({ outline: 2, outlineColor: 0x3a2400 });
}

export function bubble() {
  const s = new HiSprite(21, 21, RAMPS);
  for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) {
    const d = Math.hypot(x + 0.5 - 10.5, y + 0.5 - 10.5);
    if (d < 8.6) s.px(x, y, d > 6.8 ? 0xf0faff : mix(0x5ab8f0, 0xd8f4ff, d / 8), 1);
  }
  s.dot(7.4, 7.4, 2.2, 0xffffff);
  s.dot(13.5, 14, 1, 0xffffff);
  return s.render({ outline: 2, outlineColor: 0x14406e });
}

export function drop(hot) {
  const s = new HiSprite(21, 21, RAMPS);
  if (hot) {
    // a drop of scalding coffee, glowing hot at the heart (pointing up: the game turns it along its flight)
    s.paint([0, 0, 21, 21], (x, y) => (y > 10 ? Math.hypot(x - 10.5, y - 12.5) < 7.4 : Math.abs(x - 10.5) < (y - 1.5) * 0.85), 'h', (x, y) => 0.62 + (Math.hypot(x - 10.5, y - 12.5) < 3.5 ? 0.35 : 0), { glow: true });
    s.dot(8, 11, 1.4, 0xffe0a0);
    return s.render({ outline: 2, outlineColor: 0x2a0800 });
  }
  // an ice cube
  s.poly([[3, 8], [10.5, 4], [18, 8], [10.5, 12]], 'i', { flat: 0.95, glow: true });
  s.poly([[3, 8], [10.5, 12], [10.5, 19], [3, 15]], 'i', { flat: 0.68, glow: true });
  s.poly([[18, 8], [10.5, 12], [10.5, 19], [18, 15]], 'i', { flat: 0.45, glow: true });
  return s.render({ outline: 2, outlineColor: 0x14306a });
}

/** A curl of steam rising (3 frames: thin, curling, fraying). */
export function steam(f) {
  const s = new HiSprite(18, 30, RAMPS);
  for (let y = 2; y < 28; y++) {
    const x = 9 + Math.sin(y * 0.35 + f * 1.4) * (2 + f) ;
    const w = 1.2 + (28 - y) / 14 + f * 0.4;
    for (let i = -w; i <= w; i++) s.px(x + i, y, 0xffffff, Math.max(0, 0.75 - Math.abs(i) / (w + 1) - f * 0.12) * (y > 24 ? (28 - y) / 4 : 1));
  }
  return s.render({ outline: 0 });
}

// ---------------------------------------------------------------- its lottery display's red LED digits (3 x 5 -> 9 x 15)
const SEGS = ['abcdef', 'bc', 'abdeg', 'abcdg', 'bcfg', 'acdfg', 'acdefg', 'abc', 'abcdefg', 'abcdfg'];
export function led(d) {
  const s = new HiSprite(9, 15, RAMPS);
  const on = d === null ? '' : SEGS[d];
  const seg = { a: [[1, 0], [7, 0]], b: [[8, 1], [8, 6]], c: [[8, 8], [8, 13]], d: [[1, 14], [7, 14]], e: [[0, 8], [0, 13]], f: [[0, 1], [0, 6]], g: [[1, 7], [7, 7]] };
  for (const [k, [[x0, y0], [x1, y1]]] of Object.entries(seg)) s.line(x0, y0, x1, y1, on.includes(k) ? 0xff3a2a : 0x3a1010, 1);
  return s.render({ outline: 0 });
}

export function jihankiEnemies(add) {
  add('jihanki_0', jihanki({ lights: 0 }));
  add('jihanki_1', jihanki({ lights: 1 }));
  add('jihanki_blink', jihanki({ eyes: 'blink' }));
  add('jihanki_open', jihanki({ eyes: 'angry', open: true }));
  add('jihanki_fizz_0', jihanki({ eyes: 'squeeze', bulge: 2.5, fizz: 1, hurt: true }));
  add('jihanki_fizz_1', jihanki({ eyes: 'squeeze', bulge: 5, fizz: 2, hurt: true, lights: 1 }));
  add('jihanki_2', jihanki({ eyes: 'angry', hurt: true }));
  add('jihanki_2_open', jihanki({ eyes: 'angry', hurt: true, open: true }));
  add('jihanki_3', jihanki({ eyes: 'rage', smashed: true, lights: 1 }));
  add('jihanki_3_open', jihanki({ eyes: 'rage', smashed: true, open: true }));
  add('jihanki_dizzy', jihanki({ eyes: 'dizzy', smashed: true }));
  add('jihanki_shadow', shadow());
  for (const k of ['hot', 'cold', 'gold']) add(`can_${k}`, can(k));
  for (let f = 0; f < 3; f++) {
    add(`splash_hot_${f}`, splash(true, f));
    add(`splash_cold_${f}`, splash(false, f));
  }
  for (let f = 0; f < 2; f++) {
    add(`puddle_hot_${f}`, puddle(true, f));
    add(`puddle_cold_${f}`, puddle(false, f));
    add(`cap_${f}`, cap(f));
  }
  for (let k = 0; k < 4; k++) add(`foam_${k}`, foam(k));
  for (let f = 0; f < 3; f++) add(`steam_${f}`, steam(f));
  add('jb_coin', coin());
  add('jb_bubble', bubble());
  add('jb_coffee', drop(true));
  add('jb_ice', drop(false));
  for (let d = 0; d < 10; d++) add(`led_${d}`, led(d));
  add('led_off', led(null));
}
export const JIHANKI_PORTRAITS = ['jihanki_0'];
