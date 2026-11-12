// Beppu's oni at 540 px (63 x 68 -> 189 x 204): the oni of the hell scrolls and of Kawanabe Kyōsai, not a
// bodybuilder: wiry and hunched, pot-bellied, the joints knobbed, three claws to a hand and foot, his skin
// mottled vermilion drawn over with the ink of its sinews and creases, coarse hair on his forearms and shins;
// a mane of black hair like flames, ox horns ringed and yellowed, gold eyes bulging under a knotted brow, the
// tusks thrust up past his lip, a gold ring in his ear; the tiger-skin loincloth with its tail, a twisted rope
// for a belt, the floating sash of the thunder gods, and the iron kanabō, ringed and studded, its grip bound in
// red cord with a tassel. Poses: 0 the club on his shoulder, 1 raised over his head, 2 smashed down, 3 hurt; and
// `broken`, the same with his left horn snapped off (phase 2 on).
import { HiSprite, tones, fur, speckle, crackle, mottle, mix2 } from '../../lib/hisprite.mjs';

const INK = 0x14101c;
const SINEW = 0x5a0a08;
const TAU = Math.PI * 2;
const RAMPS = {
  O: tones([0x5a0c08, 0xb4281c, 0xee6a48]), // vermilion skin
  h: tones([0x0a080c, 0x221a1e, 0x4a3a3a]), // hair
  n: tones([0x6a5a3a, 0xc8b88a, 0xf4ecd0]), // horn
  c: tones([0x1a1410, 0x3a3028, 0x6a5a48]), // claws
  y: tones([0x9a6a10, 0xe8b030, 0xfff0a0]), // tiger yellow, gold
  i: tones([0x16141a, 0x2e2a34, 0x5a5462]), // iron
  s: tones([0x4a6a90, 0x98bcd8, 0xe4f2ff]), // the floating sash
  r: tones([0x7a0e14, 0xc8202a, 0xff6a6a]), // red cord
  t: tones([0x5a4a2a, 0x9a8a5a, 0xd0c090]), // the straw rope
};
const skin = (seed) => ({
  pat: mix2(
    mottle({ amt: 0.26, scale: 6, seed }),
    speckle({ amt: 0.16, dark: 0.08, light: 0.04, seed: seed + 1 }),
    crackle({ amt: 0.1, scale: 5, width: 0.03, seed: seed + 2 }),
  ),
});
const tigerStripe = (x, y) => Math.sin(x * 0.45 + Math.sin(y * 0.38) * 2.6 + y * 0.12) > 0.48;

/** Coarse hair along a limb: short dark strokes leaning one way. */
function bodyHair(s, ax, ay, bx, by, n, seed) {
  for (let k = 0; k < n; k++) {
    const t = (k + 0.5) / n;
    const h = Math.sin(k * 12.9898 + seed) * 43758.5453;
    const j = h - Math.floor(h);
    const x = ax + (bx - ax) * t + (j - 0.5) * 8;
    const y = ay + (by - ay) * t + (j - 0.5) * 4;
    s.line(x, y, x + 2 + j * 2, y + 2.5, 0x2a0806, 1, 0.75);
  }
}

/** Ink along a curve: a sinew, a crease. */
function ink(s, pts, c = SINEW, a = 0.85) {
  for (let k = 0; k < pts.length - 1; k++) s.line(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], c, 1, a);
}

function kanabo(s, x0, y0, x1, y1, cracked = false) {
  const r0 = 4.6;
  const r1 = 10.5;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const l = Math.hypot(dx, dy);
  const nx = -dy / l;
  const ny = dx / l;
  // the octagonal iron shaft, tapering out to the head
  for (let k = 0; k <= 50; k++) {
    const t = k / 50;
    const r = r0 + (r1 - r0) * Math.min(1, t * 1.25);
    s.ellipse(x0 + dx * t, y0 + dy * t, r, r, 'i', { pat: mix2(speckle({ amt: 0.18, dark: 0.08, light: 0.05 }), mottle({ amt: 0.1, scale: 4 })) });
  }
  // a facet line along it, catching the light
  s.line(x0 + dx * 0.25 - nx * 3, y0 + dy * 0.25 - ny * 3, x0 + dx - nx * 6, y0 + dy - ny * 6, 0x8a8494, 1, 0.8);
  // iron bands; the rows of studs, each a pointed spike with a gold cap
  for (const t of [0.24, 0.98]) {
    const r = r0 + (r1 - r0) * Math.min(1, t * 1.25) + 1;
    s.tube(x0 + dx * t - nx * r, y0 + dy * t - ny * r, x0 + dx * t + nx * r, y0 + dy * t + ny * r, 1.8, 'i', { bias: 0.15 });
  }
  for (let t = 0.32; t <= 0.94; t += 0.085) {
    const r = r0 + (r1 - r0) * Math.min(1, t * 1.25);
    const x = x0 + dx * t;
    const y = y0 + dy * t;
    for (const sd of [-1, -0.35, 0.35, 1]) {
      const ox = nx * r * sd;
      const oy = ny * r * sd;
      if (Math.abs(sd) === 1) s.poly([[x + ox - (dx / l) * 1.8, y + oy - (dy / l) * 1.8], [x + nx * (r + 5) * sd, y + ny * (r + 5) * sd], [x + ox + (dx / l) * 1.8, y + oy + (dy / l) * 1.8]], 'S', { flat: 0.72 });
      else {
        s.dot(x + ox, y + oy, 1.8, 0x9a6a10);
        s.dot(x + ox - 0.5, y + oy - 0.5, 1, 0xfff0a0);
      }
    }
  }
  // the grip bound in red cord, a ring and a tassel
  for (let k = 0; k < 6; k++) {
    const t = -0.04 + k * 0.035;
    s.tube(x0 + dx * t - nx * 5.6, y0 + dy * t - ny * 5.6, x0 + dx * t + nx * 5.6, y0 + dy * t + ny * 5.6, 1.6, 'r', { bias: k % 2 ? -0.05 : 0.08 });
  }
  const tx = x0 - (dx / l) * 9;
  const ty = y0 - (dy / l) * 9;
  s.ellipse(tx, ty, 3.4, 3.4, 'y', { flat: 0.6 });
  s.poly([[tx - 3, ty + 2], [tx + 3, ty + 2], [tx + 4, ty + 16], [tx - 4, ty + 16]], 'r', { flat: 0.55, pat: fur(Math.PI / 2, { amt: 0.3, len: 7, w: 1 }) });
  if (!cracked) return;
  // phase 3: the iron split along the shaft, hell's red glowing out of the split, a chip knocked off the head
  const at = (t, side) => {
    const r = r0 + (r1 - r0) * Math.min(1, t * 1.25);
    return [x0 + dx * t + nx * r * side, y0 + dy * t + ny * r * side];
  };
  const pts = [];
  for (let k = 0; k <= 9; k++) {
    const t = 0.5 + k * 0.05;
    pts.push(at(t, (k % 2 ? 0.35 : -0.25) * (1 - k / 12)));
  }
  for (let k = 1; k < pts.length; k++) {
    s.line(pts[k - 1][0], pts[k - 1][1], pts[k][0], pts[k][1], 0x1a0608, k > 2 && k < 8 ? 3 : 2);
    s.line(pts[k - 1][0], pts[k - 1][1], pts[k][0], pts[k][1], k > 2 && k < 8 ? 0xff3a1a : 0x8a1a10, 1);
  }
  // a branch off it, and the notch where a piece is gone (the stud with it)
  const [bx, by] = pts[5];
  const [ex, ey] = at(0.68, 0.95);
  s.line(bx, by, ex, ey, 0x1a0608, 2);
  s.line(bx, by, (bx + ex) / 2, (by + ey) / 2, 0xff5a2a, 1);
  const [cxp, cyp] = at(0.86, 1);
  s.ellipse(cxp, cyp, 4.5, 4.5, 'i', { bias: -0.35 });
  s.dot(cxp - nx, cyp - ny, 2.2, 0x1a0608);
}

export function oni(pose, broken = false, cracked = false) {
  const s = new HiSprite(189, 204, RAMPS);
  const cx = 94.5;
  const hurt = pose === 3;
  const flinch = hurt ? 3 : 0;
  const F = skin(9);

  // ---- the floating sash, an arc behind him, its ends trailing; a band of pattern at its edges
  const sash = [];
  for (let k = 0; k <= 70; k++) {
    const t = k / 70;
    const a = Math.PI * (1.1 - t * 1.2);
    sash.push([cx + Math.cos(a) * (76 + Math.sin(t * Math.PI) * 6), 92 - Math.sin(a) * 60 + Math.sin(t * 13) * 3]);
  }
  for (let k = 0; k < sash.length; k++) {
    const [x, y] = sash[k];
    const tw = Math.sin(k * 0.45);
    const w = (2.4 + Math.abs(tw) * 1.6) * (0.6 + Math.sin((k / 70) * Math.PI) * 0.4);
    s.ellipse(x, y, w, w, 's', { flat: 0.5 + tw * 0.18, pat: fur(0, { amt: 0.1, len: 6, w: 2 }) });
  }
  for (let k = 2; k < sash.length; k += 3) s.dot(sash[k][0], sash[k][1], 1, 0x3a5a88, 0.9);

  // ---- the kanabō: on the shoulder (0, 3), raised overhead (1), smashed down at his side (2)
  const clubAt = { 0: [56, 112, 18, 8], 1: [70, 34, 8, 2], 2: [52, 120, 14, 196], 3: [56, 112, 18, 10] }[pose];
  if (pose !== 1) kanabo(s, ...clubAt, cracked);

  // ---- the legs: sinewy, knees knobbed, splayed in a crouch; three-clawed feet; hair on the shins; gold anklets
  for (const sx of [-1, 1]) {
    const hip = [cx + sx * 18, 140];
    const knee = [cx + sx * 37, 160];
    const foot = [cx + sx * 31, 190];
    s.tube(hip[0], hip[1], knee[0], knee[1], 12, 'O', { rb: 8.5, ...F });
    s.ellipse(knee[0], knee[1], 9, 9, 'O', { bias: 0.08, ...F });
    s.tube(knee[0], knee[1], foot[0], foot[1], 8, 'O', { rb: 5.5, ...F });
    bodyHair(s, knee[0] - sx * 2, knee[1] + 6, foot[0], foot[1] - 8, 9, sx + 3);
    ink(s, [[hip[0] + sx * 4, hip[1] + 4], [knee[0] - sx * 4, knee[1] - 6]]);
    ink(s, [[knee[0] - sx * 3, knee[1] + 9], [foot[0] + sx * 3, foot[1] - 6]]);
    s.tube(foot[0] - 7, foot[1] - 4, foot[0] + 7, foot[1] - 4, 2.4, 'y', { bias: 0.05 });
    s.ellipse(foot[0] + sx * 3, foot[1] + 5, 12.5, 6.5, 'O', F);
    for (let k = -1; k <= 1; k++) {
      const x = foot[0] + sx * 3 + k * 7;
      s.ellipse(x, foot[1] + 8, 3, 2.4, 'O', { bias: 0.1 });
      s.poly([[x - 2, foot[1] + 9], [x + 2, foot[1] + 9], [x + k * 1.5, foot[1] + 14]], 'c', { flat: 0.65 });
    }
  }

  // ---- the tiger-skin loincloth: fur, stripes, the tiger's tail hanging from it; a twisted straw rope for a belt
  s.paint([cx - 42, 116, cx + 42, 160], (x, y) => Math.abs(x - cx) < 37 - (y - 116) * 0.22 && y < 151 + Math.sin(x * 0.9) * 4 + Math.sin(x * 0.37) * 2, 'y', (x, y) => 0.62 - (x - cx) / 140 - (y - 130) / 300, { pat: mix2(fur(Math.PI / 2, { amt: 0.26, len: 4, w: 1.2, gap: 0.08 }), speckle({ amt: 0.06 })) });
  for (let y = 118; y < 156; y++) for (let x = cx - 42; x < cx + 42; x++) {
    const i = y * 189 + Math.floor(x);
    if (s.mat[i] === 'y' && tigerStripe(x, y)) s.px(x, y, 0x1a1208, 0.9);
  }
  s.shade([cx - 42, 116, cx + 42, 160], (x, y) => y > 146 + Math.sin(x * 0.9) * 4, 0.18); // the pale belly fur at the hem
  for (let y = 132; y < 172; y += 1) {
    const x = cx + 24 + Math.sin(y * 0.15) * 5;
    s.ellipse(x, y, 3.4 - (y - 132) / 24, 3.4 - (y - 132) / 24, 'y', { flat: 0.55 });
    if (Math.floor(y / 5) % 2) s.px(x, y, 0x1a1208);
  }

  // ---- the body: a hunched barrel, the belly round and low, ribs under the chest, the navel
  s.ellipse(cx, 106 + flinch, 41, 32, 'O', { bias: 0.02, ...F });
  s.ellipse(cx + 2, 119 + flinch, 30, 22, 'O', { bias: 0.08, ...F });
  s.dot(cx + 2, 123 + flinch, 2.2, SINEW);
  ink(s, [[cx - 26, 116], [cx - 14, 133], [cx + 2, 138], [cx + 18, 133], [cx + 30, 117]], SINEW, 0.6); // the belly's fold
  for (let k = 0; k < 4; k++) for (const sx of [-1, 1]) for (let a = 0.2; a < 1.25; a += 0.05) s.px(cx + sx * (12 + Math.cos(a) * 14), 84 + flinch + k * 5 + Math.sin(a) * 4, SINEW, 0.7);
  ink(s, [[cx - 30, 78 + flinch], [cx - 12, 84 + flinch], [cx, 82 + flinch], [cx + 12, 84 + flinch], [cx + 30, 78 + flinch]], SINEW, 0.7); // collarbones
  for (let k = 0; k < 14; k++) s.line(cx - 8 + (k * 5.3) % 16, 88 + (k * 3.7) % 14, cx - 6 + (k * 5.3) % 16, 91 + (k * 3.7) % 14, 0x2a0806, 1, 0.55); // chest hair
  // the rope belt, twisted, its knot and ends
  for (let x = cx - 39; x < cx + 39; x += 3) s.ellipse(x, 131 + Math.sin(x * 0.2) * 0.6, 2.4, 3.2, 't', { bias: (x / 3) % 2 < 1 ? 0.1 : -0.1 });
  s.ellipse(cx - 14, 132, 6, 5, 't', { bias: 0.08 });
  s.tube(cx - 16, 134, cx - 20, 150, 2, 't');
  s.tube(cx - 12, 134, cx - 10, 152, 2, 't');

  // ---- the arms. Left (viewer's right): reaching, claws spread (in the smash it clenches); right: on the club
  const elbowL = [cx + 55, 102 + flinch];
  const handL = pose === 1 ? [cx + 66, 76] : [cx + 64, 130];
  s.tube(cx + 32, 88 + flinch, elbowL[0], elbowL[1], 11, 'O', { rb: 8, ...F });
  s.ellipse(elbowL[0], elbowL[1], 8.5, 8.5, 'O', { bias: 0.08, ...F });
  s.tube(elbowL[0], elbowL[1], handL[0], handL[1], 7.5, 'O', { rb: 6, ...F });
  bodyHair(s, elbowL[0] + 2, elbowL[1] + 6, handL[0], handL[1] - 6, 8, 11);
  ink(s, [[cx + 36, 84 + flinch], [elbowL[0] - 2, elbowL[1] - 8]]);
  s.tube(elbowL[0] - 6, elbowL[1] + 7, elbowL[0] + 5, elbowL[1] + 11, 2.6, 'y', { bias: 0.05 });
  for (let k = 0; k < 3; k++) s.px(elbowL[0] - 3 + k * 3, elbowL[1] + 9, 0x9a6a10);
  s.ellipse(handL[0], handL[1] + 3, 9, 8, 'O', F);
  for (let k = -1; k <= 1; k++) {
    const a = (pose === 1 ? -Math.PI / 2 : Math.PI / 2) + k * 0.5;
    const L = pose === 2 ? 9 : 15;
    s.tube(handL[0] + Math.cos(a) * 6, handL[1] + 3 + Math.sin(a) * 6, handL[0] + Math.cos(a) * L, handL[1] + 3 + Math.sin(a) * L, 2.6, 'O', { rb: 1.8 });
    s.ellipse(handL[0] + Math.cos(a) * 8, handL[1] + 3 + Math.sin(a) * 8, 2.4, 2.4, 'O', { bias: 0.12 }); // the knuckles
    s.poly([[handL[0] + Math.cos(a) * (L - 1) - 1.6, handL[1] + 3 + Math.sin(a) * (L - 1)], [handL[0] + Math.cos(a) * (L - 1) + 1.6, handL[1] + 3 + Math.sin(a) * (L - 1)], [handL[0] + Math.cos(a) * (L + 6), handL[1] + 3 + Math.sin(a) * (L + 6)]], 'c', { flat: 0.6 });
  }
  if (pose === 1) {
    // both arms up, the club held overhead across the frame
    const handR = [42, 38];
    s.tube(cx - 32, 88, 36, 66, 11, 'O', { rb: 8, ...F });
    s.ellipse(36, 66, 8.5, 8.5, 'O', { bias: 0.08, ...F });
    s.tube(36, 66, handR[0], handR[1], 7.5, 'O', { rb: 6.5, ...F });
    bodyHair(s, 38, 62, handR[0], handR[1] + 6, 7, 7);
    kanabo(s, ...clubAt, cracked);
    s.ellipse(handR[0], handR[1], 8.5, 8.5, 'O', F);
    s.ellipse(handL[0], handL[1], 8.5, 8.5, 'O', F);
  } else {
    const elbowR = pose === 2 ? [44, 104] : [48, 96];
    const handR = [clubAt[0], clubAt[1] + 2];
    s.tube(cx - 32, 88 + flinch, elbowR[0], elbowR[1], 11, 'O', { rb: 8, ...F });
    s.ellipse(elbowR[0], elbowR[1], 8.5, 8.5, 'O', { bias: 0.08, ...F });
    s.tube(elbowR[0], elbowR[1], handR[0], handR[1], 7.5, 'O', { rb: 6.5, ...F });
    bodyHair(s, elbowR[0], elbowR[1] + 5, handR[0], handR[1] - 4, 6, 5);
    s.ellipse(handR[0], handR[1], 9, 8.5, 'O', F);
    for (let k = 0; k < 3; k++) s.ellipse(handR[0] - 5 + k * 4.5, handR[1] - 5, 2.4, 2.4, 'O', { bias: 0.14 });
  }

  // ---- the head, thrust forward and low between the shoulders
  const hy = 58 + flinch;
  // the mane: flames of black hair sweeping up and back, lit at the edges dull red
  for (let k = 0; k < 17; k++) {
    const a = Math.PI * 1.0 + (k / 16) * Math.PI * 1.0;
    const len = 30 + (k % 3) * 9 + (k % 2) * 3;
    const bend = (k < 8 ? -1 : 1) * 0.55;
    const mid = [cx + Math.cos(a) * len * 0.58, hy - 6 + Math.sin(a) * len * 0.58];
    const tip = [cx + Math.cos(a + bend * 0.32) * len, hy - 6 + Math.sin(a + bend * 0.32) * len - 7];
    s.tube(cx, hy - 6, mid[0], mid[1], 9, 'h', { rb: 5, pat: fur(a, { amt: 0.3, len: 6, w: 1.1, gap: 0.12, seed: k }) });
    s.tube(mid[0], mid[1], tip[0], tip[1], 5, 'h', { rb: 0.8, pat: fur(a, { amt: 0.3, len: 6, w: 1.1, gap: 0.12, seed: k + 20 }) });
    s.line(mid[0], mid[1], tip[0], tip[1], 0x7a2a1a, 1, 0.45);
  }
  // the ox horns, curving out and up, ringed, yellowed, darkening to the tips; the left one snapped
  for (const sx of [-1, 1]) {
    const snapped = broken && sx < 0;
    let prev = [cx + sx * 14, hy - 20];
    const n = snapped ? 4 : 11;
    for (let k = 1; k <= n; k++) {
      const t = k / 11;
      const p = [cx + sx * (14 + t * 23 - t * t * 6), hy - 20 - t * 31 + t * t * 4];
      s.tube(prev[0], prev[1], p[0], p[1], 6.2 - t * 4.6, 'n', { bias: 0.04 - t * 0.18, pat: speckle({ amt: 0.1 }) });
      if (k % 2 === 0) s.line(p[0] - 4.5 + t * 2, p[1] + 1, p[0] + 4.5 - t * 2, p[1] - 1, 0x6a5a3a, 1);
      prev = p;
    }
    if (snapped) {
      // the jagged stump, the raw core
      s.poly([[prev[0] - 5, prev[1] + 1], [prev[0] - 2, prev[1] - 4], [prev[0] + 1, prev[1] - 1], [prev[0] + 4, prev[1] - 5], [prev[0] + 5, prev[1] + 2]], 'n', { flat: 0.6 });
      s.ellipse(prev[0], prev[1] - 1, 2.4, 1.6, 'O', { flat: 0.35 });
      for (const [x, y] of [[-9, -6], [6, -10], [-2, -13]]) s.dot(prev[0] + x, prev[1] + y, 0.9, 0xf4ecd0); // splinters
    }
  }
  // the ears, pointed, a gold ring in each
  for (const sx of [-1, 1]) {
    s.poly([[cx + sx * 25, hy - 6], [cx + sx * 40, hy - 14], [cx + sx * 30, hy + 8]], 'O', { ball: [cx + sx * 31, hy - 3, 9, 10], ...F });
    for (let a = 0; a < TAU; a += 0.15) s.px(cx + sx * 31 + Math.cos(a) * 3.6, hy + 9 + Math.sin(a) * 3.6, 0xe8b030);
  }
  s.ellipse(cx, hy, 29, 27, 'O', { bias: 0.03, ...F });
  for (const sx of [-1, 1]) {
    // the jowls and cheekbones, knotted, the wrinkles of a snarl
    s.ellipse(cx + sx * 18, hy + 10, 11, 10, 'O', { bias: 0.06, ...F });
    ink(s, [[cx + sx * 9, hy + 4], [cx + sx * 15, hy + 14], [cx + sx * 22, hy + 20]], SINEW, 0.7);
    ink(s, [[cx + sx * 20, hy + 2], [cx + sx * 26, hy + 12]], SINEW, 0.6);
    // the brow ridge, heavy and knotted
    s.tube(cx + sx * 3, hy - 9, cx + sx * 24, hy - 15, 5.2, 'O', { rb: 3.8, bias: 0.16 });
    for (let k = 0; k < 3; k++) ink(s, [[cx + sx * (16 + k * 3), hy - 12 - k * 2], [cx + sx * (21 + k * 3), hy - 17 - k * 2]], SINEW, 0.7);
    if (hurt) {
      // the eyes screwed shut
      ink(s, [[cx + sx * 5, hy - 2], [cx + sx * 12, hy + 1], [cx + sx * 19, hy - 3]], INK, 1);
      ink(s, [[cx + sx * 6, hy + 3], [cx + sx * 12, hy + 4]], SINEW, 0.8);
    } else {
      // the eyes bulging out under it: gold, a small pupil, the white rimmed and red-veined
      s.ellipse(cx + sx * 12, hy - 1, 8.6, 8.1, 'W', { flat: 0.82 });
      for (let k = 0; k < 4; k++) s.line(cx + sx * (5 + k * 4), hy + 4 - (k % 2) * 8, cx + sx * (8 + k * 3), hy + 1 - (k % 2) * 3, 0xd84040, 1, 0.6);
      s.ellipse(cx + sx * 12, hy - 0.5, 5.8, 5.6, 'y', { flat: 0.7 });
      s.dot(cx + sx * 11.5, hy, 2, INK);
      s.dot(cx + sx * 11.5 - 2.2, hy - 2.2, 1, 0xffffff);
      for (let a = 0; a < TAU; a += 0.04) s.px(cx + sx * 12 + Math.cos(a) * 8.8, hy - 1 + Math.sin(a) * 8.3, 0x3a0606);
      // the heavy upper lid cuts across it in a glare
      s.poly([[cx + sx * 2, hy - 10], [cx + sx * 22, hy - 12], [cx + sx * 21, hy - 3], [cx + sx * 12, hy - 4.5], [cx + sx * 4, hy - 1]], 'O', { bias: 0.04, ...F });
      ink(s, [[cx + sx * 4, hy - 1], [cx + sx * 12, hy - 4.5], [cx + sx * 21, hy - 3]], INK, 1);
    }
  }
  // the broad flat nose, the bridge furrowed, the nostrils flared
  for (let k = 0; k < 3; k++) ink(s, [[cx - 4, hy - 8 + k * 3], [cx + 4, hy - 8 + k * 3]], SINEW, 0.65);
  s.ellipse(cx, hy + 10, 9.5, 6.5, 'O', { bias: 0.12, ...F });
  for (const sx of [-1, 1]) {
    s.ellipse(cx + sx * 4.6, hy + 12, 2.6, 2, 'K', { flat: 0.1 });
    ink(s, [[cx + sx * 9, hy + 8], [cx + sx * 7, hy + 14]], SINEW, 0.7);
  }
  // the mouth split wide (wider when he howls), the gums, a row of teeth, the lower tusks thrust up past the lip
  const mo = hurt ? 15 : 9;
  s.poly([[cx - 21, hy + 18], [cx - 8, hy + 20], [cx + 8, hy + 20], [cx + 21, hy + 18], [cx + 16, hy + 18 + mo], [cx - 16, hy + 18 + mo]], 'K', { flat: 0.12 });
  s.poly([[cx - 18, hy + 19], [cx + 18, hy + 19], [cx + 16, hy + 22], [cx - 16, hy + 22]], 'P', { flat: 0.4 });
  for (let x = cx - 15; x < cx + 15; x += 4.6) s.poly([[x, hy + 20], [x + 4, hy + 20], [x + 2, hy + 24]], 'n', { flat: 0.78 });
  if (hurt) s.ellipse(cx, hy + 28, 7, 4, 'P', { flat: 0.45 }); // the tongue
  for (const sx of [-1, 1]) {
    s.poly([[cx + sx * 15.5, hy + 19 + mo], [cx + sx * 9.5, hy + 19 + mo], [cx + sx * 13, hy + 10]], 'n', { ball: [cx + sx * 12.5, hy + 15 + mo / 2, 5, 10] });
    s.line(cx + sx * 12.5, hy + 13, cx + sx * 13, hy + 17 + mo, 0x8a7a58, 1, 0.6);
  }
  // a scar across the brow
  ink(s, [[cx + 6, hy - 22], [cx + 14, hy - 10]], 0x3a0606, 0.9);
  ink(s, [[cx + 7, hy - 20], [cx + 11, hy - 19]], 0x3a0606, 0.6);
  return s.render();
}
