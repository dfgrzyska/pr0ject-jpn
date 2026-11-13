// Sapporo's enemies at 540 px (docs/enemies-540-plan.md): the shima-enaga, Hokkaido's snow-white long-tailed
// tit (a fluff ball with a black tail and wine-pink shoulders); ice lanterns of the Otaru snow-light path, a
// candle glowing through a block of ice, cracking; the Ezo momonga gliding on its skin sails, its huge black
// eyes; a bowl of Sapporo miso ramen with corn and butter in a raimon-rimmed donburi; a yukidaruma in two
// balls with its red bucket and carrot nose; a rotary snowplough; Yuki-onna as the old prints show her, the
// white burial kimono crossed right over left, her long black hair loose in the wind, her legs gone to snow;
// and the bear: first the Snow Festival's carved snow sculpture, then the higuma inside it.
// Every frame is three times the old one's size (old mask coordinate m -> fine (m + 1) * 3).
import { HiSprite, tones, fur, speckle, crackle, mottle, mix2 } from '../../lib/hisprite.mjs';
import { thaw, frost, breath } from './kuma2a.mjs';

const INK = 0x14101c;
const TAU = Math.PI * 2;
const M = (m) => (m + 1) * 3;
const RAMPS = {
  w: tones([0x8a98bc, 0xdce6f4, 0xffffff]), // snow
  i: tones([0x2a6aa8, 0x7ac0ea, 0xe0f8ff]), // ice
  e: tones([0x121016, 0x2a2630, 0x4e4858]), // enaga's black
  p: tones([0x74404a, 0xb07a84, 0xe8c0c6]), // its wine-pink shoulders
  x: tones([0x44424c, 0x8a8892, 0xcecad0]), // momonga's winter grey
  v: tones([0xa8a094, 0xe4ded0, 0xffffff]), // its pale belly and sail edges
  s: tones([0x7a3c10, 0xc0782a, 0xeab060]), // miso broth
  n: tones([0xb08a2a, 0xecca58, 0xfff2b0]), // noodles, corn
  c: tones([0x5e2c14, 0x9c5a34, 0xd89a6c]), // chashu
  z: tones([0x24140a, 0x4e3018, 0x80583a]), // higuma brown
  t: tones([0x5a3a1e, 0x8e6240, 0xc09670]), // its lighter muzzle
  h: tones([0x0a0a14, 0x1a1a2a, 0x3a3a56]), // Yuki-onna's black hair
  k: tones([0x8a9ac4, 0xdae4f6, 0xffffff]), // her white kimono
  f: tones([0xa0b0cc, 0xe6ecf8, 0xffffff]), // her pale skin
  l: tones([0x9a5a00, 0xe8a020, 0xffe080]), // lantern glow seen through the ice
  r: tones([0x8a1a14, 0xd03424, 0xff7a5a]), // the snowman's red bucket
  o: [0xa0400a, 0xe06a10, 0xff9a30, 0xffd070, 0xffffff], // flame
  a: [0x0a4a6a, 0x1a8ab0, 0x3fd8e8, 0x9af4ff, 0xe8ffff], // icy glow
};
const snowPat = (seed = 3) => mix2(speckle({ amt: 0.14, dark: 0.04, light: 0.08, seed }), mottle({ amt: 0.12, scale: 8, seed: seed + 1 }));
const icePat = (seed = 5) => mix2(crackle({ amt: 0.18, scale: 10, width: 0.03, seed }), mottle({ amt: 0.14, scale: 9, seed: seed + 1 }));
const cut = (s, cx, cy, r) => {
  for (let y = Math.floor(cy - r); y <= cy + r; y++)
    for (let x = Math.floor(cx - r); x <= cx + r; x++) if (s.inside(x, y) && (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) {
      s.mat[y * s.w + x] = null;
      s.over.delete(y * s.w + x);
    }
};

// ---------------------------------------------------------------- popcorn: shima-enaga (17 -> 51), head down
export function enaga(f) {
  const s = new HiSprite(51, 51, RAMPS);
  const cx = 25.5;
  const up = [1, 0.4, -0.4, 0.4][f]; // the wings beat: up, half, down, half
  // the long black tail, white-edged, its tip flared
  s.poly([[cx - 2.5, 24], [cx + 2.5, 24], [cx + 3.5, 4], [cx + 1, 2], [cx - 1, 2], [cx - 3.5, 4]], 'e', { flat: 0.45, pat: fur(-Math.PI / 2, { amt: 0.2, len: 5, w: 1 }) });
  s.line(cx - 3, 5, cx - 2.2, 22, 0xe8ecf4, 1, 0.8);
  s.line(cx + 3, 5, cx + 2.2, 22, 0xe8ecf4, 1, 0.8);
  // the wings: black flight feathers, white-edged tertials, the pink shoulders
  for (const sx of [-1, 1]) {
    const tipY = 21 - up * 9;
    const tipX = cx + sx * 24;
    s.poly([[cx + sx * 6, 22], [tipX, tipY], [tipX - sx * 2, tipY + 5], [cx + sx * 14, 32], [cx + sx * 7, 33]], 'e', { flat: 0.5, pat: fur(sx > 0 ? 0.2 : Math.PI - 0.2, { amt: 0.18, len: 5, w: 1.2 }) });
    for (let k = 0; k < 5; k++) {
      const t = k / 5;
      s.line(cx + sx * (9 + t * 12), 24 + t * (tipY - 23) + 4, cx + sx * (11 + t * 12), 26 + t * (tipY - 23) + 4, 0x4e4858, 1, 0.8);
    }
    s.line(cx + sx * 8, 30, cx + sx * 14, 31, 0xe8ecf4, 1, 0.9);
    s.ellipse(cx + sx * 8.5, 26, 4.2, 5, 'p', { pat: fur(Math.PI / 2, { amt: 0.15, len: 3, w: 1 }) });
  }
  // the round snow-white body and head, all fluff
  s.ellipse(cx, 30, 10, 10.5, 'w', { pat: mix2(fur((x, y) => Math.atan2(y - 30, x - cx), { amt: 0.2, len: 3, w: 1.3, gap: 0.05 }), speckle({ amt: 0.1, dark: 0.03 })) });
  s.ellipse(cx, 38.5, 8, 7.5, 'w', { bias: 0.04, pat: fur((x, y) => Math.atan2(y - 38, x - cx), { amt: 0.18, len: 3, w: 1.2, gap: 0.04, seed: 7 }) });
  // tiny black eyes and beak
  for (const sx of [-1, 1]) {
    s.dot(cx + sx * 3.8, 40, 1.4, INK);
    s.px(cx + sx * 3.8 - 0.6, 39.4, 0xffffff);
  }
  s.poly([[cx - 1.4, 44], [cx + 1.4, 44], [cx, 46.5]], 'K', { flat: 0.3 });
  return s.render();
}

// ---------------------------------------------------------------- shooter: an ice lantern (19 -> 57), three crack stages x two flickers
export function tourou(crack, f) {
  const s = new HiSprite(57, 57, RAMPS);
  const c = 28.5;
  // a round block of ice, its facets catching the light
  s.ellipse(c, c, 23, 23, 'i', { pat: icePat(5), bias: 0.04 });
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * TAU + 0.3;
    s.line(c + Math.cos(a) * 14, c + Math.sin(a) * 14, c + Math.cos(a + 0.4) * 22, c + Math.sin(a + 0.4) * 22, 0xc8f0ff, 1, 0.5);
  }
  // the glow of the candle through the ice
  s.ellipse(c, c, 14, 14, 'l', { glow: true, pat: mottle({ amt: 0.12, scale: 6 }) });
  s.shade([c - 15, c - 15, c + 15, c + 15], (x, y) => Math.hypot(x - c, y - c) > 10, -0.15);
  // the candle and its flame
  s.ellipse(c, c + 4, 3.4, 5, 'w', { flat: 0.7 });
  const fl = f ? 1.2 : 1;
  s.poly([[c - 3 * fl, c + 1], [c + 3 * fl, c + 1], [c + 0.8, c - 8 * fl], [c - 0.4, c - 9 * fl]], 'o', { glow: true, flat: 0.55 });
  s.ellipse(c, c - 1, 1.8 * fl, 3 * fl, 'o', { glow: true, flat: 0.95 });
  // the sheen on the ice
  s.dot(c - 11, c - 13, 2.4, 0xffffff, 0.8);
  s.line(c - 16, c - 6, c - 12, c - 14, 0xffffff, 1, 0.7);
  // cracks
  const lines = [[[2, 5], [6, 8]], [[13, 3], [11, 6]], [[12, 14], [10, 11]], [[3, 12], [5, 10]], [[8, 1], [8, 3]]];
  const n = crack === 0 ? 0 : crack === 1 ? 2 : 5;
  for (let k = 0; k < n; k++) {
    const [[x0, y0], [x1, y1]] = lines[k];
    s.line(M(x0), M(y0), M(x1), M(y1), 0x14406a, 1);
    s.line(M(x0) + 1, M(y0), (M(x0) + M(x1)) / 2 + 2, (M(y0) + M(y1)) / 2 + 1, 0x14406a, 1);
    s.line(M(x0) - 1, M(y0) - 1, M(x1) - 1, M(y1) - 1, 0xe8fbff, 1, 0.8);
  }
  if (crack === 2) for (const [x, y] of [[1, 6], [2, 4], [15, 10], [14, 13], [6, 16], [10, 0]]) cut(s, M(x) + 1.5, M(y) + 1.5, 3);
  return s.render();
}

// ---------------------------------------------------------------- the bare flame left when the ice breaks (11 x 13 -> 33 x 39)
export function wisp(f) {
  const s = new HiSprite(33, 39, RAMPS);
  const cx = 16.5;
  const sway = [0, 1.6, 0, -1.6][f];
  const pts = [];
  for (let k = 0; k <= 30; k++) {
    const t = k / 30;
    const y = 35 - t * 32;
    const hw = 10 * Math.sin(Math.PI * Math.min(1, (1 - t) * 0.75 + 0.25)) * Math.pow(1 - t, 0.6);
    pts.push([cx + hw + sway * t * t * 3, y]);
  }
  for (let k = 30; k >= 0; k--) {
    const t = k / 30;
    const y = 35 - t * 32;
    const hw = 10 * Math.sin(Math.PI * Math.min(1, (1 - t) * 0.75 + 0.25)) * Math.pow(1 - t, 0.6);
    pts.push([cx - hw + sway * t * t * 3, y]);
  }
  s.poly(pts, 'o', { glow: true, flat: 0.42 });
  s.ellipse(cx + sway * 0.3, 27, 6.5, 8, 'o', { glow: true, flat: 0.68 });
  s.ellipse(cx + sway * 0.2, 29, 3.2, 4.4, 'o', { glow: true, flat: 0.95 });
  s.px(cx + sway * 2, 9 + f, 0xffe080);
  return s.render({ outline: 0 });
}

// ---------------------------------------------------------------- diver: the Ezo momonga (17 x 16 -> 51 x 48), head down
export function momonga(f) {
  const s = new HiSprite(51, 48, RAMPS);
  const cx = 25.5;
  const pelt = (seed) => ({ pat: mix2(fur(Math.PI / 2, { amt: 0.2, len: 3, w: 1.2, gap: 0.05, seed }), speckle({ amt: 0.1, dark: 0.04 })) });
  // the flat broad tail
  s.poly([[cx - 3.5, 14], [cx + 3.5, 14], [cx + 4.5, 4], [cx, 1.5], [cx - 4.5, 4]], 'x', { flat: 0.5, ...pelt(3) });
  for (let y = 4; y < 14; y += 2) for (const sx of [-1, 1]) s.px(cx + sx * 4, y, 0x6e5e4c);
  if (f < 2) {
    // the sails stretched between fore- and hind legs, scalloped in between, pale at the edge
    const span = f ? 15 : 18;
    const corners = [[cx - span, 12.5], [cx + span, 12.5], [cx + span - 1, 32], [cx - span + 1, 32]];
    const edge = [];
    const sag = (p, q, d) => {
      for (let k = 0; k <= 12; k++) {
        const t = k / 12;
        const x = p[0] + (q[0] - p[0]) * t;
        const y = p[1] + (q[1] - p[1]) * t;
        const nx = q[1] - p[1];
        const ny = -(q[0] - p[0]);
        const l = Math.hypot(nx, ny);
        edge.push([x + (nx / l) * d * Math.sin(Math.PI * t), y + (ny / l) * d * Math.sin(Math.PI * t)]);
      }
    };
    sag(corners[0], [cx - 5, 10], -2);
    sag([cx + 5, 10], corners[1], -2);
    sag(corners[1], corners[2], -3.5);
    sag(corners[2], [cx + 5, 34], -2.5);
    sag([cx - 5, 34], corners[3], -2.5);
    sag(corners[3], corners[0], -3.5);
    s.poly(edge, 'x', { ball: [cx, 22, span + 3, 15], pat: mix2(fur((x, y) => Math.atan2(y - 22, x - cx), { amt: 0.18, len: 3, w: 1.2, gap: 0.05, seed: 5 }), speckle({ amt: 0.1, dark: 0.04 })) });
    for (let k = 0; k < edge.length; k++) if (k % 13 > 1 && k % 13 < 12) s.px(edge[k][0] + (cx - edge[k][0]) * 0.06, edge[k][1] + (22 - edge[k][1]) * 0.08, 0xeae6e8, 0.9);
    // the limbs under the sail, the hands and feet at its corners
    for (const sx of [-1, 1]) {
      s.tube(cx + sx * 5, 17, cx + sx * (span - 1), 13, 1.6, 'x', { bias: -0.08 });
      s.tube(cx + sx * 5, 29, cx + sx * (span - 1.5), 31.5, 1.8, 'x', { bias: -0.08 });
      s.dot(cx + sx * (span + 0.5), 12.5, 1.6, 0x2a2428);
      s.dot(cx + sx * (span - 0.5), 32, 1.6, 0x2a2428);
    }
    s.ellipse(cx, 22, 6.5, 11, 'x', { bias: 0.04, pat: fur(Math.PI / 2, { amt: 0.16, len: 3, w: 1.2, seed: 6 }) });
  } else s.ellipse(cx, 22, 11, 12, 'x', pelt(5)); // folded, diving
  // the head, round, small ears, the huge black eyes with their dark rings
  s.ellipse(cx, 34.5, 8, 7.5, 'x', { bias: 0.03, ...pelt(9) });
  s.ellipse(cx, 37.5, 5, 4, 'v', { flat: 0.6, pat: fur(Math.PI / 2, { amt: 0.12, len: 2, w: 1 }) });
  for (const sx of [-1, 1]) {
    s.ellipse(cx + sx * 6, 28, 2.2, 2.6, 'x', { flat: 0.5 });
    s.dot(cx + sx * 4.2, 33.5, 3.4, 0x2a2018);
    s.dot(cx + sx * 4.2, 33.5, 2.6, INK);
    s.dot(cx + sx * 4.2 - 1, 32.4, 0.9, 0xffffff);
  }
  s.dot(cx, 41, 1, 0x4a3020);
  return s.render();
}

// ---------------------------------------------------------------- carrier: a bowl of Sapporo miso ramen (17 x 18 -> 51 x 54)
const BOWL = { red: 'R', blue: 'B', green: 'G', purple: 'V' };
export function ramen(color, f) {
  const s = new HiSprite(51, 54, RAMPS);
  const cx = 25.5;
  const cy = 31.5;
  s.ellipse(cx, cy, 19.5, 19.5, BOWL[color], { bias: 0.04, pat: mottle({ amt: 0.08, scale: 8 }) });
  // the white raimon (meander) band round the rim
  for (let k = 0; k < 24; k++) {
    const a0 = (k / 24) * TAU;
    const pts = [[0, 0], [1, 0], [1, 1], [0.35, 1], [0.35, 0.5]];
    let prev = null;
    for (const [u, v] of pts) {
      const a = a0 + (u * TAU) / 24 * 0.8;
      const r = 16.2 + v * 2.2;
      const p = [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
      if (prev) s.line(prev[0], prev[1], p[0], p[1], 0xf4f0e8, 1);
      prev = p;
    }
  }
  // the miso broth, beads of fat on it
  s.ellipse(cx, cy, 15, 15, 's', { flat: 0.55, pat: mottle({ amt: 0.15, scale: 5 }) });
  for (const [x, y] of [[-9, 3], [8, -6], [-3, 9], [10, 6], [-7, -9]]) s.dot(cx + x, cy + y, 1, 0xf8d890, 0.9);
  // noodles in curls
  for (let k = 0; k < 5; k++) {
    for (let a = 0; a < Math.PI * 1.3; a += 0.08) s.px(cx - 9 + k * 2 + Math.cos(a + k) * (4 + k * 0.4), cy + 4 + Math.sin(a + k) * 3, 0xf4d868);
  }
  // chashu, naruto, menma, negi, nori, sweet corn and the pat of butter
  s.ellipse(cx + 5, cy + 5, 5.5, 5, 'c', { pat: mix2(mottle({ amt: 0.2, scale: 3 }), speckle({ amt: 0.12 })) });
  for (let a = 0; a < TAU; a += 0.06) s.px(cx + 5 + Math.cos(a) * 4.8, cy + 5 + Math.sin(a) * 4.3, 0xf0c8a0, 0.7);
  s.ellipse(cx - 7, cy + 1, 4.4, 4.4, 'w', { flat: 0.75 });
  for (let a = 0; a < Math.PI * 3.6; a += 0.06) s.px(cx - 7 + Math.cos(a) * (0.6 + a * 0.32), cy + 1 + Math.sin(a) * (0.6 + a * 0.32), 0xf06a9a);
  for (const [x, y] of [[-4, 9], [-1, 10.5], [2, 9]]) s.poly([[cx + x - 1, cy + y - 3], [cx + x + 1, cy + y - 3], [cx + x + 1.2, cy + y + 2], [cx + x - 1.2, cy + y + 2]], 'n', { flat: 0.4 });
  for (const [x, y] of [[-3, -7], [3, -9], [-10, -4], [9, 0], [-1, -3]]) {
    s.dot(cx + x, cy + y, 1.3, 0x4a9a3a);
    s.px(cx + x, cy + y, 0xc8f0a0);
  }
  for (let k = 0; k < 9; k++) s.dot(cx - 1 + (k % 3) * 2.4, cy - 7 + Math.floor(k / 3) * 2.2, 1.1, 0xffd848);
  s.poly([[cx + 1, cy - 12], [cx + 6, cy - 13], [cx + 7, cy - 8], [cx + 2, cy - 7]], 'n', { flat: 0.92 });
  s.poly([[cx + 8, cy - 18], [cx + 15, cy - 15], [cx + 12, cy - 4], [cx + 6, cy - 6]], 'K', { flat: 0.4, pat: speckle({ amt: 0.2, dark: 0.2, light: 0.1 }) });
  // chopsticks across the rim and the steam rising
  s.line(cx - 18, cy - 15, cx + 2, cy - 21, 0xb08a5a, 1);
  s.line(cx - 18, cy - 13, cx + 3, cy - 18.5, 0xd8b07a, 1);
  for (let k = 0; k < 3; k++) {
    const x0 = cx - 8 + k * 8;
    for (let y = 1; y < 11; y += 0.5) s.px(x0 + Math.sin(y * 0.7 + f * 1.6 + k) * 2, y, 0xf4f8ff, 0.35 + (y / 11) * 0.4);
  }
  return s.render();
}

// ---------------------------------------------------------------- turret: a yukidaruma (base 21 x 19 -> 63 x 57, head 13 -> 39)
export function yukiBase(wreck) {
  const s = new HiSprite(63, 57, RAMPS);
  const cx = 31.5;
  const cy = 28.5;
  if (!wreck) {
    // the twig arms
    for (const sx of [-1, 1]) {
      s.tube(cx + sx * 18, cy, cx + sx * 29, cy - 9, 1.3, 'N', { rb: 0.8 });
      s.tube(cx + sx * 25, cy - 5, cx + sx * 29, cy + 1, 0.9, 'N');
    }
    // the bottom ball seen from above, a red knitted scarf round its neck
    s.ellipse(cx, cy, 20.5, 20, 'w', { pat: snowPat(3) });
    for (let a = 0; a < TAU; a += 0.04) for (let r = 12; r < 15; r += 1) s.px(cx + Math.cos(a) * r, cy + Math.sin(a) * r, ((Math.floor(a * 9) + r) % 2) ? 0xd03424 : 0xa02018);
    s.poly([[cx + 10, cy + 8], [cx + 15, cy + 9], [cx + 17, cy + 19], [cx + 12, cy + 19]], 'r', { flat: 0.55 });
    for (let k = 0; k < 4; k++) s.line(cx + 12 + k * 1.4, cy + 19, cx + 12 + k * 1.4, cy + 21, 0xd03424, 1);
  } else {
    // knocked apart: lumps of snow, the bucket rolled off, the carrot, twigs, the charcoal eyes
    s.ellipse(21, 30, 13.5, 12, 'w', { pat: snowPat(4) });
    s.ellipse(37, 27, 10.5, 9, 'w', { pat: snowPat(6) });
    s.ellipse(29, 40, 9, 7.5, 'w', { pat: snowPat(8) });
    s.poly([[6, 8], [17, 9], [15, 17], [8, 16]], 'r', { flat: 0.55 });
    s.ellipse(11.5, 9, 5.5, 2, 'r', { flat: 0.35 });
    s.tube(40, 13, 44, 17, 1.4, 'Q', { rb: 0.6 });
    s.tube(46, 31, 56, 37, 0.9, 'N');
    s.tube(4, 37, 10, 46, 0.9, 'N');
    for (const [x, y] of [[19, 28], [34, 34], [28, 22]]) s.dot(x, y, 1.4, INK);
  }
  return s.render();
}

export function yukiHead(i) {
  const s = new HiSprite(39, 39, RAMPS);
  const c = 19.5;
  const a = (i / 16) * TAU;
  const dx = -Math.sin(a);
  const dy = Math.cos(a);
  const px = Math.cos(a);
  const py = Math.sin(a);
  s.ellipse(c, c, 12.5, 12.5, 'w', { pat: snowPat(9) });
  // the red bucket on top, pushed back from the face
  const bx = c - dx * 3;
  const by = c - dy * 3;
  s.ellipse(bx, by, 8.4, 8.4, 'r', { pat: speckle({ amt: 0.12 }) });
  s.ellipse(bx - 0.5, by - 0.5, 6, 6, 'r', { bias: 0.1 });
  for (let t = 0; t < TAU; t += 0.05) s.px(bx + Math.cos(t) * 8.4, by + Math.sin(t) * 8.4, 0x8a1a14);
  s.dot(bx - 2.5, by - 2.5, 1.4, 0xffffff, 0.7);
  // the face: charcoal eyes, the carrot nose pointing at the player
  for (const sx of [-1, 1]) s.dot(c + dx * 7 + px * sx * 4.4, c + dy * 7 + py * sx * 4.4, 1.5, INK);
  s.tube(c + dx * 9, c + dy * 9, c + dx * 17, c + dy * 17, 2.2, 'Q', { rb: 0.7 });
  for (let k = 0; k < 2; k++) s.px(c + dx * (11 + k * 3) + px, c + dy * (11 + k * 3) + py, 0xa04a10);
  return s.render();
}

// ---------------------------------------------------------------- plow: a rotary snowplough (15 x 27 -> 45 x 81 down, 81 x 45 turned right)
// Drawn through `at`, which turns the plan for the right-facing frames, so the light still comes from the top left.
export function plow(f, { right = false, wreck = false } = {}) {
  const W = 45;
  const s = new HiSprite(right ? 81 : 45, right ? 45 : 81, RAMPS);
  const at = ([x, y]) => (right ? [y, W - x] : [x, y]);
  const P = (pts, mat, o) => s.poly(pts.map(at), mat, o);
  const L = (x0, y0, x1, y1, c, w = 1, a = 1) => {
    const [a0, b0] = at([x0, y0]);
    const [a1, b1] = at([x1, y1]);
    s.line(a0, b0, a1, b1, c, w, a);
  };
  const D = (x, y, r, c, a = 1) => {
    const [u, v] = at([x, y]);
    s.dot(u, v, r, c, a);
  };
  const body = wreck ? 'K' : 'O';
  const paint = { pat: wreck ? speckle({ amt: 0.3, dark: 0.12 }) : mix2(speckle({ amt: 0.08, dark: 0.04 }), mottle({ amt: 0.06 })) };
  // tracks down both sides, their treads moving
  for (const x0 of [2, 37]) {
    P([[x0, 4], [x0 + 6, 4], [x0 + 6, 56], [x0, 56]], 'K', { flat: 0.4 });
    if (!wreck) for (let y = 5 + ((f * 2) % 4); y < 56; y += 4) L(x0 + 0.5, y, x0 + 5.5, y, 0x5a5a70, 1);
  }
  // the engine housing behind, the cab, the windscreen facing forward
  P([[6, 3], [39, 3], [39, 38], [6, 38]], body, { flat: 0.6, ...paint });
  for (let y = 7; y < 34; y += 4) L(9, y, 15, y, wreck ? 0x2a2638 : 0xa04a00, 1);
  P([[8, 40], [37, 40], [38, 56], [7, 56]], body, { flat: 0.68, ...paint });
  P([[10, 41], [35, 41], [36, 47], [9, 47]], body, { flat: 0.78, ...paint });
  P([[10, 49], [35, 49], [36, 55], [9, 55]], wreck ? 'K' : 'C', { flat: wreck ? 0.2 : 0.62 });
  if (!wreck) {
    L(12, 50, 16, 54, 0xe8ffff, 1);
    L(22.5, 49, 22.5, 55, 0x262941, 1);
    D(13, 42.5, 1.6, f % 2 ? 0xffd040 : 0xa06010); // the amber beacon on the cab roof, turning
    D(32, 42.5, 1.6, f % 2 ? 0xa06010 : 0xffd040);
    L(16, 8, 30, 8, 0x262941, 1);
  }
  // the auger housing across the front, black-and-yellow hazard stripes, the auger turning inside
  P([[0, 57], [45, 57], [45, 76], [0, 76]], 'S', { flat: 0.55, pat: speckle({ amt: 0.12 }) });
  if (!wreck) for (let x = 0; x < 45; x++) for (let y = 57; y < 62; y++) if (((x - y) % 8 + 8) % 8 < 4) {
    const [u, v] = at([x + 0.5, y + 0.5]);
    s.px(u, v, 0xf0c020);
  }
  P([[3, 64], [42, 64], [42, 74], [3, 74]], 'K', { flat: 0.18 });
  if (!wreck) for (let k = 0; k < 6; k++) {
    const x = 4 + ((k * 7 + f * 2.4) % 38);
    L(x, 64.5, x + 3, 73.5, 0xb4b8d4, 1);
    L(x + 1, 64.5, x + 4, 73.5, 0x7d7f9e, 1);
  }
  else for (const [x, y] of [[10, 10], [30, 24], [18, 46], [34, 68]]) D(x, y, 2, 0xf07a20, 0.9);
  return s.render();
}

export function plowChute(i) {
  const s = new HiSprite(33, 33, RAMPS);
  const c = 16.5;
  const a = (i / 16) * TAU;
  const dx = -Math.sin(a);
  const dy = Math.cos(a);
  s.ellipse(c - dx * 2.5, c - dy * 2.5, 7.4, 7.4, 'S', { pat: speckle({ amt: 0.12 }) });
  s.tube(c, c, c + dx * 12, c + dy * 12, 3, 'Y', { rb: 3.8 });
  s.ellipse(c + dx * 12.5, c + dy * 12.5, 3.8, 3.8, 'K', { flat: 0.15 });
  s.dot(c - dx * 2.5 - 2, c - dy * 2.5 - 2, 1.2, 0xffffff, 0.7);
  return s.render();
}

// ---------------------------------------------------------------- Yuki-onna's ice crystals (15 x 17 -> 45 x 51), whole and cracked
export function iceCrystal(f) {
  const s = new HiSprite(45, 51, RAMPS);
  for (const [cx, base, h, hw, lean, seed] of [[3.6, 16, 9, 2.1, -0.28, 2], [11.4, 16, 10, 2.1, 0.3, 3], [7.5, 16, 15, 2.8, 0, 1]]) {
    const pts = [];
    const B = base * 3;
    const top = (base - h) * 3;
    const X = (y) => (cx + lean * (base - y / 3)) * 3;
    const w = hw * 3;
    pts.push([X(B) - w, B], [X(top + w * 1.4) - w, top + w * 1.4], [X(top), top], [X(top + w * 1.4) + w, top + w * 1.4], [X(B) + w, B]);
    s.poly(pts, 'i', { pat: icePat(seed), flat: 0.6 });
    // the facets: lit left, dark right, a bright ridge between
    s.shade([0, top, 45, B], (x, y) => x < X(y) - w * 0.3, 0.16);
    s.shade([0, top, 45, B], (x, y) => x > X(y) + w * 0.35, -0.18);
    s.line(X(top) - 0.5, top + 2, X(B) - 1, B - 1, 0xe8fbff, 1, 0.7);
  }
  s.dot(21, 7, 1.2, 0xffffff);
  s.px(18, 13, 0xffffff);
  if (f) for (const [x0, y0, x1, y1] of [[19, 15, 23, 22], [23, 22, 20, 30], [20, 30, 23, 36], [10, 33, 13, 38], [33, 30, 37, 34]]) s.line(x0, y0, x1, y1, 0x0e2a4a, 1);
  return s.render();
}

// ---------------------------------------------------------------- heavy: Yuki-onna, the snow woman (39 x 50 -> 117 x 150)
export const YUKI_FRAMES = 4;
export function yukionna(f) {
  const s = new HiSprite(117, 150, RAMPS);
  const cx = 58.5;
  const sway = Math.sin((f / YUKI_FRAMES) * TAU);
  // the long black hair, loose and streaming out to both sides in the wind, ragged at its ends
  for (const sx of [-1, 1]) {
    for (let k = 0; k < 9; k++) {
      const t = k / 8;
      const y0 = 18 + t * 10;
      const len = 54 + t * 56;
      const end = [cx + sx * (8 + t * 12 + 30 * (1 - t)) + sx * sway * (2 + t * 4), y0 + len];
      const mid = [cx + sx * (14 + t * 18), y0 + len * 0.5];
      s.tube(cx + sx * 6, y0, mid[0], mid[1], 4.6 - t * 0.8, 'h', { rb: 3.6, pat: fur(Math.PI / 2, { amt: 0.2, len: 9, w: 1, gap: 0.1, seed: k }) });
      s.tube(mid[0], mid[1], end[0], end[1], 3.6, 'h', { rb: 0.9, pat: fur(Math.PI / 2, { amt: 0.2, len: 9, w: 1, gap: 0.1, seed: k + 20 }) });
    }
  }
  // the white kimono, slender, flaring to the hem
  const hem = (y) => 11 + (y - 45) * 0.62;
  s.paint([0, 44, 117, 150], (x, y) => Math.abs(x - cx) < hem(y), 'k', (x, y) => 0.62 - (x - cx) / 120 - (y - 44) / 500, { pat: fur(Math.PI / 2, { amt: 0.08, len: 18, w: 3, gap: 0.04 }) });
  // folds falling down it
  for (const d of [-14, -6, 5, 13]) for (let y = 70; y < 140; y += 1) s.px(cx + d * (y - 30) / 60 + Math.sin(y / 9 + f) * 0.8, y, 0x8a9ac4, 0.5);
  // yukiwa, the old snow-ring crest, faint pale blue on the white
  for (const [x, y, r] of [[-12, 80, 4.5], [10, 92, 5], [-4, 112, 5.5], [16, 124, 5], [-18, 128, 4.5], [3, 70, 3.5]]) {
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * TAU;
      s.dot(cx + x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.42, 0x9ab8e8, 0.55);
    }
    s.dot(cx + x, y, r * 0.32, 0xdae4f6);
  }
  // the long sleeves, the arms held out low, the hands drooping (a ghost's)
  for (const sx of [-1, 1]) {
    const s0 = [cx + sx * 10, 50];
    const tip = [cx + sx * 44, 68 + sway * sx * 2];
    s.poly([s0, [cx + sx * 16, 47], tip, [tip[0] - sx * 2, tip[1] + 30 + sway * sx * 3], [cx + sx * 26, tip[1] + 26], [cx + sx * 12, 76]], 'k', { flat: 0.6, pat: fur(Math.PI / 2 + sx * 0.3, { amt: 0.08, len: 12, w: 3 }) });
    s.line(tip[0], tip[1], tip[0] - sx * 2, tip[1] + 30, 0x9aa8d4, 1);
    s.ellipse(tip[0] + sx * 2, tip[1] + 3, 3, 4.6, 'f', { flat: 0.7 });
    for (let k = 0; k < 3; k++) s.line(tip[0] + sx * (1 + k * 1.3), tip[1] + 5, tip[0] + sx * (1 + k * 1.3), tip[1] + 9, 0xe6ecf8, 1);
  }
  // the collar crossed right over left, as the dead are dressed; the pale grey-blue obi
  s.poly([[cx + 8, 44], [cx + 11, 44], [cx - 3, 67], [cx - 6, 67]], 'f', { flat: 0.75 });
  s.poly([[cx - 8, 44], [cx - 5, 44], [cx + 2, 56], [cx - 1, 58]], 'f', { flat: 0.6 });
  s.line(cx + 9, 44, cx - 4, 66, 0x8a9ac4, 1);
  s.poly([[cx - 18, 67], [cx + 18, 67], [cx + 19, 79], [cx - 19, 79]], 'B', { flat: 0.45, pat: speckle({ amt: 0.1 }) });
  s.line(cx - 18, 72.5, cx + 18, 72.5, 0xa8d0ff, 1);
  s.line(cx - 18, 73.5, cx + 18, 73.5, 0x3a72f0, 1);
  // the hem dissolves into drifting snow
  for (let y = 108; y < 150; y++)
    for (let x = 0; x < 117; x++) {
      const i = y * 117 + x;
      if (s.mat[i] !== 'k') continue;
      const t = (y - 108) / 42;
      // the hem tears into ragged tongues of white that thin and drift away (no checkerboard)
      const tongue = 0.55 + Math.sin(x * 0.42 + f * 0.8) * 0.22 + Math.sin(x * 1.13 + f * 1.7) * 0.12;
      if (t > tongue) s.mat[i] = null;
      else if (t > tongue - 0.22) s.px(x, y, 0xeef4ff, 0.35 + (tongue - t) * 2.5); // thinning to mist at its ends
    }
  for (let k = 0; k < 18; k++) s.dot(28 + ((k * 23 + f * 9) % 62), 118 + ((k * 11 + f * 3) % 30), 0.9, 0xe8ffff, 0.85);
  // the face: pale under straight-cut bangs, long cold eyes, blue lips
  s.ellipse(cx, 22, 15.5, 16.5, 'h', { pat: fur(Math.PI / 2, { amt: 0.2, len: 8, w: 1 }) });
  s.ellipse(cx, 30, 9.5, 11, 'f', { bias: 0.04 });
  s.poly([[cx - 11, 14], [cx + 11, 14], [cx + 11, 25], [cx - 11, 25]], 'h', { flat: 0.4, pat: fur(Math.PI / 2, { amt: 0.25, len: 6, w: 1 }) });
  for (const sx of [-1, 1]) {
    s.line(cx + sx * 2.5, 29, cx + sx * 7.5, 28, INK, 1);
    s.line(cx + sx * 3, 30, cx + sx * 7, 29.5, 0x3fd8e8, 1);
    s.px(cx + sx * 7.8, 27.5, INK);
  }
  s.line(cx - 1, 34, cx + 1, 34, 0xc0c8e0, 1);
  s.line(cx - 2, 37.5, cx + 2, 37.5, 0x5a8ad8, 1);
  s.px(cx, 38.3, 0x3a5aa8);
  // her breath of snow, flakes about her
  for (const [x, y] of [[8 + f * 2, 12], [106 - f * 2, 20], [4, 90 + f * 3], [112, 104 - f * 3], [cx + 4, 42 + f]]) s.dot(x, y, 1, 0xe8ffff);
  return s.render();
}

// ---------------------------------------------------------------- boss: the bear (66 x 60 -> 198 x 180)
// Phase 1 is the Snow Festival's sculpture, carved snow with ice set in (its paws and heart are separate
// parts); phase 2 the brown higuma that breaks out of it, roaring in kuma_1.
export function bear(phase, roar) {
  const s = new HiSprite(198, 180, RAMPS);
  const cx = M(32);
  const mat = phase === 1 ? 'w' : 'z';
  const pelt = phase === 1
    ? { pat: mix2(snowPat(13), crackle({ amt: 0.12, scale: 14, width: 0.025, seed: 4 })) }
    : { pat: mix2(fur((x, y) => Math.atan2(y - 100, x - cx) * 0.3 + Math.PI / 2, { amt: 0.32, len: 6, w: 1.6, gap: 0.12, seed: 21 }), speckle({ amt: 0.12, dark: 0.05 })) };
  // feet
  for (const fx of [23, 41]) s.ellipse(M(fx), M(52), 19.5, 16.5, mat, pelt);
  // the arms raised
  for (const sx of [-1, 1]) {
    const end = phase === 1 ? [cx + sx * 63, M(18)] : [cx + sx * 72, M(14)];
    s.tube(cx + sx * 36, M(27), end[0], end[1], 13, mat, { rb: 12, ...pelt });
    if (phase === 2) {
      s.ellipse(end[0], end[1] - 3, 15.5, 15.5, mat, pelt);
      for (let k = -1.5; k <= 1.5; k++) {
        const x = end[0] + k * 6.5;
        s.poly([[x - 2, end[1] - 14], [x + 2, end[1] - 14], [x + 0.5, end[1] - 24], [x - 0.5, end[1] - 24]], 'W', { flat: 0.8 });
      }
      s.ellipse(end[0], end[1] + 1, 7, 6, 'K', { flat: 0.3 });
    }
  }
  // the body, the head, the round ears
  s.ellipse(cx, M(36), 45, 51, mat, pelt);
  if (phase === 2) s.ellipse(cx, M(39), 27, 33, 't', { pat: fur(Math.PI / 2, { amt: 0.26, len: 5, w: 1.4, seed: 23 }) });
  for (const ex of [23, 41]) {
    s.ellipse(M(ex), M(5), 11.4, 11.4, mat, pelt);
    s.ellipse(M(ex), M(5), 5.5, 5.5, phase === 1 ? 'i' : 'K', { flat: phase === 1 ? 0.6 : 0.3 });
  }
  s.ellipse(cx, M(13), 31.5, 30, mat, pelt);
  s.ellipse(cx, M(17.5), 15.6, 11.4, phase === 1 ? 'w' : 't', phase === 1 ? { bias: 0.08, pat: snowPat(17) } : { pat: fur(Math.PI / 2, { amt: 0.2, len: 3, w: 1.2 }) });
  if (phase === 1) {
    // carved: eyes and nose of clear ice, the hollow for the heart, chisel marks, a sheen of ice glaze
    for (const ex of [27.5, 37.5]) s.ellipse(M(ex), M(11.5), 5.4, 3, 'i', { flat: 0.55 });
    s.ellipse(cx, M(15.8), 8, 4.5, 'i', { flat: 0.5 });
    s.line(cx, M(18), cx, M(20.5), 0x7a98c8, 1);
    s.line(cx - 6, M(20.5), cx + 6, M(20.5), 0x7a98c8, 1);
    s.ellipse(M(32.5), M(33.5), 17, 17, 'i', { flat: 0.35, pat: icePat(8) });
    for (const [x0, y0, x1, y1] of [[22, 40, 26, 46], [42, 40, 38, 46], [20, 30, 23, 36], [44, 30, 41, 36], [32, 47, 32, 50], [16, 22, 19, 26], [48, 22, 45, 26], [28, 2, 30, 6]]) {
      s.line(M(x0), M(y0), M(x1), M(y1), 0x7a98c8, 1);
      s.line(M(x0) - 1, M(y0) - 1, M(x1) - 1, M(y1) - 1, 0xffffff, 1, 0.8);
    }
    for (let k = 0; k < 40; k++) {
      const x = 20 + ((k * 37) % 160);
      const y = 20 + ((k * 53) % 150);
      if (s.mat[y * s.w + x]) s.px(x, y, 0xc8e0f8, 0.6); // (only on the snow: off it they outlined into stray dots)
    }
  } else {
    // the higuma: small furious red eyes, the black nose, the jaws, claws on the feet
    for (const ex of [27.5, 37.5]) {
      s.ellipse(M(ex), M(11), 4.4, 3, 'K', { flat: 0.2 });
      s.dot(M(ex), M(11), 2, 0xff2a3a);
      s.px(M(ex) - 1, M(11) - 1, 0xffb8bf);
      s.line(M(ex) - 6 * Math.sign(ex - 32.5), M(9), M(ex) + 5 * Math.sign(ex - 32.5), M(9.8), 0x24140a, 2);
    }
    s.ellipse(cx, M(15.5), 7, 4.6, 'K', { bias: 0.12 });
    s.dot(cx - 2.5, M(15), 1, 0x8a8aa8);
    if (roar) {
      s.ellipse(cx, M(21.5), 11, 10, 'K', { flat: 0.12 });
      s.ellipse(cx, M(23), 6.5, 4.5, 'l', { flat: 0.45 });
      for (const sx of [-1, 1]) {
        s.poly([[cx + sx * 9, M(18.8)], [cx + sx * 5, M(18.8)], [cx + sx * 7, M(21)]], 'W', { flat: 0.8 });
        s.poly([[cx + sx * 9, M(24.8)], [cx + sx * 5, M(24.8)], [cx + sx * 7, M(22.6)]], 'W', { flat: 0.7 });
      }
    } else s.line(cx - 9, M(20.5), cx + 9, M(20.5), INK, 2);
    for (const fx of [23, 41]) for (let k = -1; k <= 1; k++) s.poly([[M(fx) + k * 6 - 1.5, M(55)], [M(fx) + k * 6 + 1.5, M(55)], [M(fx) + k * 6, M(57.5)]], 'W', { flat: 0.75 });
  }
  return s.render();
}

export function kumaPaw() {
  const s = new HiSprite(51, 51, RAMPS);
  s.ellipse(25.5, 28.5, 17.5, 17.5, 'w', { pat: snowPat(31) });
  // claws of clear ice set in the snow, the pads carved
  for (let k = 0; k < 4; k++) {
    const x = M(3 + k * 3) + 1.5;
    s.poly([[x - 2.5, 13], [x + 2.5, 13], [x + 0.8, 3], [x - 0.6, 3]], 'i', { flat: 0.6 });
  }
  for (const [x, y, r] of [[18, 26, 4], [33, 26, 4], [25.5, 35, 5.4]]) {
    s.ellipse(x, y, r, r * 0.85, 'i', { flat: 0.4, pat: icePat(32) });
    s.px(x - r * 0.4, y - r * 0.4, 0xffffff);
  }
  for (const [x0, y0, x1, y1] of [[12, 40, 18, 44], [36, 40, 31, 44]]) s.line(x0, y0, x1, y1, 0x7a98c8, 1);
  return s.render();
}

export function kumaHeart(f) {
  const s = new HiSprite(45, 45, RAMPS);
  const test = (x, y) => {
    const u = (x - 22.5) / 18;
    const v = -(y - 24) / 18;
    return (u * u + v * v - 1) ** 3 - u * u * v * v * v < 0;
  };
  s.paint([2, 4, 43, 43], (x, y) => test(x, y + 2), 'a', (x, y) => 0.45 - (x - 22.5) / 70 - (y - 20) / 90 + (f ? 0.18 : 0), { glow: !!f, pat: icePat(41) });
  s.shade([0, 0, 45, 45], (x, y) => x < 20 && y < 22, 0.12);
  s.dot(13, 14, 2.2, 0xffffff, 0.9);
  s.dot(17, 11.5, 1, 0xffffff);
  if (f) {
    s.dot(22.5, 24, 6, 0xc8fbff, 0.8);
    s.dot(22.5, 24, 3, 0xffffff);
  }
  return s.render({ outline: f ? 0 : 2 });
}

export function sapporoEnemies(add) {
  for (let f = 0; f < 4; f++) {
    add(`enaga_${f}`, enaga(f));
    add(`wisp_${f}`, wisp(f));
    for (const c of ['red', 'blue', 'green', 'purple']) add(`ramen_${c}_${f}`, ramen(c, f));
    add(`plow_d_${f}`, plow(f));
    add(`plow_r_${f}`, plow(f, { right: true }));
  }
  for (let c = 0; c < 3; c++) for (let f = 0; f < 2; f++) add(`tourou_${c}_${f}`, tourou(c, f));
  for (let f = 0; f < 3; f++) add(`momonga_${f}`, momonga(f));
  add('yuki_base', yukiBase(false));
  add('yuki_wreck', yukiBase(true));
  for (let i = 0; i < 16; i++) {
    add(`yuki_head_${i}`, yukiHead(i));
    add(`plow_chute_${i}`, plowChute(i));
  }
  add('plow_wreck', plow(0, { wreck: true }));
  for (let f = 0; f < 2; f++) add(`ice_crystal_${f}`, iceCrystal(f));
  for (let f = 0; f < YUKI_FRAMES; f++) add(`yukionna_${f}`, yukionna(f));
  add('kuma_ice', bear(1, false));
  add('kuma_0', bear(2, false));
  add('kuma_1', bear(2, true));
  // step 2a: the thaw over the phase break, the frosted coat of the blizzard, the roar's breath
  const ice = bear(1, false);
  const b0 = bear(2, false);
  [0.15, 0.4, 0.62, 0.85].forEach((k, i) => add(`kuma_thaw_${i}`, thaw(ice, b0, k)));
  add('kuma_0f', frost(b0));
  add('kuma_1f', frost(bear(2, true)));
  for (let f = 0; f < 4; f++) add(`kuma_breath_${f}`, breath(f));
  add('kuma_paw', kumaPaw());
  for (let f = 0; f < 2; f++) add(`kuma_heart_${f}`, kumaHeart(f));
}
export const SAPPORO_PORTRAITS = ['yukionna_0', 'kuma_0'];
