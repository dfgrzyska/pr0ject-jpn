// The arena of encounter 5 (ex5): the otaku's room itself, seen from above at a slant (like an old RPG's rooms),
// scrolling from the front door up to the back wall where the desk (the boss) stands. At the bottom the entrance:
// shoes kicked off, an umbrella, parcels never opened, bags of rubbish, flyers under the door slot. Then the tatami:
// an unmade futon with a phone glowing on it, clothes, open manga; a kotatsu with mandarins, a pad and a noodle cup,
// facing an old TV on a low stand with a console wired to it; bookcases of manga along the left wall, a laundry
// rack and a fan along the right; cans, a pizza box, a beanbag, cables snaking up to the desk. At the top the back
// wall: posters in the manner of Sharaku's actor prints (1794, long in the public domain; see sharaku.mjs), a window
// with the curtains shut and a slit of city light, a shelf of little figures (no one's characters), the aircon.
// Moving: the TV's game, the phone's notifications, the fan, the router's lights, the light in the curtains, steam.
import { Raster, fbm, rng, mix } from '../../lib/raster.mjs';
import { HiSprite, tones, speckle, mottle } from '../../lib/hisprite.mjs';
import { grade } from '../nature.mjs';
import { tintTable, PropKit } from '../props.mjs';
import { poster } from './sharaku.mjs';

export const S = 3;
const W = 180;
const L = 896;
const FW = W * S;
const FH = L * S;
const WALL_Y = 380; // the back wall's foot
const GENKAN_Y = 2360; // the step down to the entrance
const SIDE = 26; // the side walls' thickness, seen from above
const INK = 0x14121a;

const RAMPS = {
  q: tones([0x2a2a5a, 0x40448a, 0x6a74c0]),
  w: tones([0x9a948a, 0xe8e4dc, 0xffffff]),
  o: tones([0x5a3a22, 0x8a6038, 0xc0905a]),
  O: tones([0x3a2414, 0x5a3a22, 0x8a6038]),
  b: tones([0x6a4a24, 0xa87a44, 0xd8aa70]),
  k: tones([0x14121a, 0x26242e, 0x44424e]),
  s: tones([0x4a4a54, 0x8a8c96, 0xd0d2da]),
  m: tones([0x8a8470, 0xc8c2a8, 0xf0ead0]),
  r: tones([0x7a1a1a, 0xd03a2a, 0xff8a6a]),
  g: tones([0x1a5a2a, 0x3a9a4a, 0x8ad88a]),
  u: tones([0x1a2a6a, 0x3a5ac0, 0x8aa8f0]),
  y: tones([0x8a6a10, 0xe0b830, 0xfff0a0]),
  p: tones([0x7a2a5a, 0xd05a9a, 0xffa8d0]),
  c: tones([0x1a5a6a, 0x3aa8b8, 0x9af0f0]),
  n: tones([0x6a3a10, 0xe0882a, 0xffc070]), // mandarin orange
  K: tones([0x6a2a1a, 0xa8483a, 0xd8806a]), // the kotatsu quilt
  t: tones([0x2a4a7a, 0x4a7ab8, 0x9ac0e8]), // translucent rubbish bags
  f: tones([0xb07a5a, 0xe8b894, 0xffe0c8]),
};
const SERIES = ['r', 'g', 'u', 'y', 'p', 'c', 'n', 'w', 'k'];

/** Lay a rendered sprite on the strip, its top-left at (x, y). */
function stamp(img, spr, x, y) {
  img.blit(spr, Math.round(x), Math.round(y));
}
/** The soft shadow a thing casts on the floor (down and to the right, the light being up-left). */
function shadow(img, x, y, w, h, a = 0.35) {
  for (let j = -4; j < h + 8; j++)
    for (let i = -4; i < w + 8; i++) {
      const dx = Math.max(0, Math.max(-i, i - w)) / 8;
      const dy = Math.max(0, Math.max(-j, j - h)) / 8;
      const d = Math.min(1, Math.hypot(dx, dy));
      img.set(x + i + 6, y + j + 8, 0x0a0812, a * (1 - d));
    }
}

// ---------------------------------------------------------------- the floor and walls
function tatami(x, y) {
  // mats two by one, alternating; dark cloth borders; the straw's fine weave; worn patches
  const mw = 180;
  const mh = 90;
  const row = Math.floor((y - WALL_Y) / mh);
  const off = row % 2 ? mw / 2 : 0;
  const lx = (x - SIDE + off) % mw;
  const ly = (y - WALL_Y) % mh;
  if (lx < 5 || ly < 5) return mix(0x1a2a1a, 0x2a3a24, (x * 3 + y) % 5 === 0 ? 0.6 : 0.2);
  const weave = (y % 3 === 0 ? -0.06 : 0) + (fbm(x, y, { seed: 3, scale: 2, octaves: 1 }) - 0.5) * 0.08;
  const wear = fbm(x, y, { seed: 4, scale: 60 }) - 0.5;
  return mix(0x6e6a48, 0xa49c6c, 0.55 + weave + wear * 0.4);
}
function wallpaper(x, y) {
  const n = fbm(x, y, { seed: 7, scale: 40 }) - 0.5;
  const stripe = Math.floor(x / 24) % 2 ? 0.05 : 0;
  const dots = (x % 24 === 12 && y % 24 === 12) ? 0.1 : 0;
  return mix(0x6a6478, 0x8a8498, 0.5 + n * 0.4 + stripe + dots);
}
function concrete(x, y) {
  const tile = (x % 90 < 3 || (y - GENKAN_Y) % 90 < 3) ? -0.25 : 0;
  return mix(0x4a4a50, 0x7a7a80, 0.5 + (fbm(x, y, { seed: 9, scale: 6 }) - 0.5) * 0.4 + tile);
}

// ---------------------------------------------------------------- things in the room (HiSprites, in 3/4 view)
function futon() {
  const s = new HiSprite(230, 310, RAMPS);
  s.paint([4, 4, 226, 306], () => true, 'w', (x, y) => 0.7 - x / 900 - y / 1600, { pat: speckle({ amt: 0.04 }) });
  s.ellipse(115, 40, 60, 24, 'w', { bias: 0.1 }); // the pillow
  s.shade([55, 30, 175, 52], (x, y) => Math.abs(y - 42 - Math.sin(x * 0.1) * 3) < 2, -0.2);
  // the quilt thrown back, crumpled: blue with a check, its edge turned over
  s.paint([0, 90, 230, 310], (x, y) => y > 100 + Math.sin(x * 0.05) * 14 + (x > 150 ? (x - 150) * 0.6 : 0), 'q', (x, y) => 0.55 + Math.sin(x * 0.06 + y * 0.03) * 0.12, { pat: mottle({ amt: 0.1 }) });
  s.shade([0, 90, 230, 310], (x, y) => (Math.floor(x / 22) + Math.floor(y / 22)) % 2 === 0, 0.08);
  s.paint([0, 90, 230, 130], (x, y) => y > 100 + Math.sin(x * 0.05) * 14 && y < 118 + Math.sin(x * 0.05) * 14 && x < 150, 'w', () => 0.6);
  // a phone on the pillow side (its screen is a prop), an open manga, a sock
  s.paint([170, 60, 192, 98], () => true, 'k', () => 0.3);
  s.poly([[30, 150], [62, 140], [66, 170], [34, 180]], 'w', { flat: 0.8 });
  s.poly([[62, 140], [94, 146], [92, 176], [66, 170]], 'w', { flat: 0.65 });
  s.tube(150, 250, 176, 270, 8, 'p', { rb: 9 });
  return s.render();
}
function kotatsu() {
  const s = new HiSprite(250, 230, RAMPS);
  // the quilt spread out on all sides, a pattern of rings; the table top on it
  s.paint([0, 10, 250, 230], (x, y) => Math.hypot(Math.max(0, Math.abs(x - 125) - 80), Math.max(0, Math.abs(y - 120) - 70)) < 40, 'K', (x, y) => 0.55 + Math.sin(x * 0.08) * Math.cos(y * 0.07) * 0.1, { pat: mottle({ amt: 0.08 }) });
  for (let k = 0; k < 14; k++) {
    const cx = 20 + ((k * 73) % 210);
    const cy = 30 + ((k * 47) % 180);
    s.shade([cx - 10, cy - 10, cx + 10, cy + 10], (x, y) => Math.abs(Math.hypot(x - cx, y - cy) - 7) < 1.5, 0.18);
  }
  s.paint([40, 40, 210, 186], () => true, 'o', (x, y) => 0.68 - (x - 40) / 600 - (y - 40) / 800, { pat: speckle({ amt: 0.05 }) });
  s.paint([40, 178, 210, 196], () => true, 'O', () => 0.5); // its front edge
  // on it: a bowl of mandarins (one peeled), a pad on a cable, a noodle cup, the TV remote, peel
  s.ellipse(90, 80, 26, 18, 'w', { bias: 0.05 });
  for (const [x, y] of [[80, 74], [96, 72], [88, 84], [104, 82]]) s.ellipse(x, y, 8, 7, 'n', { bias: 0.08 });
  s.poly([[118, 104], [130, 98], [136, 110], [124, 114]], 'n', { flat: 0.75 });
  s.paint([150, 120, 190, 144], (x, y) => ((x - 170) / 20) ** 2 + ((y - 132) / 12) ** 2 < 1 || (Math.abs(x - 170) < 12 && Math.abs(y - 132) < 6), 'k', () => 0.35);
  for (const [x, y, c] of [[180, 128, 0xe04a4a], [184, 132, 0x4ab84a], [176, 132, 0x4a6ae0]]) s.dot(x, y, 1.6, c);
  s.dot(158, 130, 2.4, 0x3a3a46);
  s.tube(160, 70, 160, 92, 12, 'w', { rb: 10 });
  s.paint([148, 66, 172, 72], () => true, 'r', () => 0.6);
  s.paint([56, 130, 66, 166], () => true, 'k', () => 0.4);
  return s.render();
}
function zabuton(c) {
  const s = new HiSprite(80, 80, RAMPS);
  s.paint([4, 4, 76, 76], (x, y) => Math.hypot(Math.max(0, Math.abs(x - 40) - 26), Math.max(0, Math.abs(y - 40) - 26)) < 10, c, (x, y) => 0.65 - Math.hypot(x - 40, y - 40) / 160);
  s.dot(40, 40, 2, 0x2a1a1a);
  return s.render();
}
function tvStand() {
  // a low stand, the old TV on it facing the room (its screen a prop), a console and its pads in front
  const s = new HiSprite(200, 170, RAMPS);
  s.paint([0, 96, 200, 160], () => true, 'O', (x, y) => (y < 108 ? 0.65 : 0.4));
  s.paint([10, 116, 90, 154], () => true, 'k', () => 0.15);
  s.paint([110, 116, 190, 154], () => true, 'k', () => 0.15);
  s.paint([16, 124, 70, 140], () => true, 's', () => 0.5); // the console
  s.dot(24, 132, 2, 0xff4a4a);
  for (let k = 0; k < 5; k++) s.paint([116 + k * 14, 120, 126 + k * 14, 150], () => true, SERIES[k], () => 0.6); // game boxes
  s.paint([30, 10, 170, 100], () => true, 'm', (x, y) => 0.62 - (x - 30) / 600 - (y - 10) / 500);
  s.paint([40, 18, 160, 88], () => true, 'k', () => 0.15);
  s.dot(158, 94, 1.6, 0x6aff6a);
  return s.render();
}
function bookcase(h) {
  // against the left wall, seen from above-front: shelves, the volumes' spines in runs of colour
  const s = new HiSprite(80, h, RAMPS);
  s.paint([0, 0, 80, h], () => true, 'O', (x) => 0.5 - x / 400);
  const rand = rng(h);
  for (let y = 6; y < h - 10; y += 34) {
    s.paint([6, y, 74, y + 28], () => true, 'k', () => 0.15);
    let x = 7;
    let ser = Math.floor(rand() * SERIES.length);
    while (x < 72) {
      const w = 5 + Math.floor(rand() * 2);
      s.paint([x, y + 2 + Math.floor(rand() * 3), x + w - 1, y + 28], () => true, SERIES[ser], () => 0.55 + rand() * 0.1);
      s.px(x + 2, y + 8, 0xffffff, 0.7);
      x += w;
      if (rand() < 0.18) ser = Math.floor(rand() * SERIES.length);
    }
  }
  return s.render();
}
function laundry() {
  const s = new HiSprite(70, 320, RAMPS);
  s.tube(8, 0, 8, 320, 2.5, 's');
  s.tube(60, 0, 60, 320, 2.5, 's');
  const rand = rng(5);
  for (let y = 12; y < 300; y += 26) {
    const c = SERIES[Math.floor(rand() * SERIES.length)];
    s.paint([12, y, 56, y + 22], (x, yy) => Math.abs(x - 34) < 20 - Math.abs(yy - y - 6) * 0.3, c, (x) => 0.55 + Math.sin(x * 0.4) * 0.1);
  }
  return s.render();
}
function fanBase() {
  const s = new HiSprite(90, 120, RAMPS);
  s.ellipse(45, 104, 26, 12, 'w', { bias: 0.1 });
  s.tube(45, 104, 45, 70, 4, 'w');
  s.ellipse(45, 40, 40, 40, 's', { flat: 0.35 });
  return s.render();
}
function fanBlades(f) {
  const r = new Raster(84, 84);
  for (let b = 0; b < 4; b++) {
    const a = (b / 4) * Math.PI * 2 + f * 0.5;
    for (let d = 6; d < 34; d++)
      for (let w = -7; w <= 7; w++) {
        const aa = a + (w / d) * 0.6;
        r.set(42 + Math.cos(aa) * d, 42 + Math.sin(aa) * d, 0xc8e8ff, 0.7);
      }
  }
  for (let a = 0; a < Math.PI * 2; a += 0.02) for (const rr of [38, 39]) r.set(42 + Math.cos(a) * rr, 42 + Math.sin(a) * rr, 0xe8e8f0);
  for (let k = 0; k < 8; k++) for (let d = 6; d < 38; d++) r.set(42 + Math.cos(k * 0.785) * d, 42 + Math.sin(k * 0.785) * d, 0xe8e8f0, 0.6);
  for (let y = -5; y <= 5; y++) for (let x = -5; x <= 5; x++) if (x * x + y * y < 26) r.set(42 + x, 42 + y, 0x8a8c96);
  return r;
}
function beanbag() {
  const s = new HiSprite(110, 100, RAMPS);
  s.ellipse(55, 52, 50, 42, 'g', { bias: 0.08, pat: mottle({ amt: 0.12 }) });
  s.ellipse(52, 46, 24, 18, 'g', { flat: 0.35 });
  return s.render();
}
function pizza() {
  const s = new HiSprite(80, 80, RAMPS);
  s.paint([2, 2, 78, 78], () => true, 'w', (x, y) => 0.68 - x / 300 - y / 400);
  s.paint([2, 2, 78, 10], () => true, 'r', () => 0.6);
  s.ellipse(40, 46, 20, 20, 'k', { flat: 0.12 });
  return s.render();
}
function small(kind, seed) {
  const s = new HiSprite(40, 40, RAMPS);
  const rand = rng(seed);
  const c = SERIES[Math.floor(rand() * SERIES.length)];
  if (kind === 'can') {
    s.tube(10, 20, 30, 24, 6, c);
    s.paint([18, 14, 22, 30], () => true, 'w', () => 0.8);
  } else if (kind === 'manga') {
    s.poly([[6, 10], [32, 6], [36, 30], [10, 34]], c, { flat: 0.62 });
    s.poly([[8, 12], [18, 10], [20, 22], [10, 24]], 'w', { flat: 0.82 });
  } else if (kind === 'cup') {
    s.ellipse(20, 20, 12, 12, 'w', { bias: 0.1 });
    s.ellipse(20, 20, 8, 8, 'k', { flat: 0.3 });
    s.shade([8, 8, 32, 32], (x, y) => Math.abs(Math.hypot(x - 20, y - 20) - 10.5) < 1.2, -0.25);
  } else if (kind === 'sock') {
    s.tube(8, 12, 26, 18, 5, c, { rb: 6 });
    s.tube(26, 18, 30, 30, 6, c);
  } else if (kind === 'bag') {
    s.ellipse(20, 22, 15, 13, 'w', { bias: 0.05 });
    s.tube(12, 10, 28, 10, 2, 'w');
    s.paint([12, 20, 28, 24], () => true, SERIES[seed % 4], () => 0.6);
  }
  return s.render();
}
function parcel(w, h) {
  const s = new HiSprite(w, h, RAMPS);
  s.paint([0, 0, w, h], () => true, 'b', (x, y) => 0.62 - x / (w * 3) - y / (h * 5), { pat: speckle({ amt: 0.05 }) });
  s.paint([w / 2 - 3, 0, w / 2 + 3, h], () => true, 'm', () => 0.74);
  s.paint([6, h - 18, 30, h - 6], () => true, 'w', () => 0.85);
  return s.render();
}
function rubbish() {
  const s = new HiSprite(90, 80, RAMPS);
  s.ellipse(45, 44, 40, 32, 't', { bias: 0.1 });
  s.tube(40, 10, 50, 10, 4, 't');
  for (const [x, y, c] of [[30, 40, 'w'], [52, 52, 'y'], [44, 30, 'r'], [60, 36, 'w']]) s.ellipse(x, y, 6, 4, c, { flat: 0.55 });
  s.shade([5, 12, 85, 76], () => true, 0.08);
  return s.render();
}
function shoes(c) {
  const s = new HiSprite(60, 50, RAMPS);
  for (const [dx, dy, a] of [[18, 22, 0.3], [40, 28, -0.4]]) {
    s.paint([dx - 12, dy - 18, dx + 12, dy + 18], (x, y) => {
      const u = (x - dx) * Math.cos(a) + (y - dy) * Math.sin(a);
      const v = -(x - dx) * Math.sin(a) + (y - dy) * Math.cos(a);
      return (u / 8) ** 2 + (v / 16) ** 2 < 1;
    }, c, () => 0.55);
    s.dot(dx, dy - 4, 3, 0xe8e4dc);
  }
  return s.render();
}
function umbrella() {
  const s = new HiSprite(30, 140, RAMPS);
  s.tube(15, 4, 15, 128, 6, 'u', { rb: 2 });
  s.tube(15, 128, 20, 136, 2, 'O');
  return s.render();
}
function figure(seed) {
  // a little figure on the shelf: a stand, a body, a big head with a colour of hair (no one's character)
  const s = new HiSprite(30, 48, RAMPS);
  const rand = rng(seed);
  const hair = SERIES[Math.floor(rand() * 6)];
  const cloth = SERIES[Math.floor(rand() * 6)];
  s.ellipse(15, 44, 10, 3, 'k', { flat: 0.4 });
  s.poly([[9, 42], [21, 42], [18, 24], [12, 24]], cloth, { flat: 0.6 });
  s.ellipse(15, 16, 9, 9, 'f', { bias: 0.1 });
  s.paint([5, 5, 25, 15], (x, y) => ((x - 15) / 10) ** 2 + ((y - 13) / 9) ** 2 < 1 && y < 13, hair, () => 0.6);
  s.dot(12, 17, 1.2, INK);
  s.dot(18, 17, 1.2, INK);
  return s.render();
}
function aircon() {
  const s = new HiSprite(200, 60, RAMPS);
  s.paint([0, 0, 200, 52], () => true, 'w', (x, y) => 0.7 - y / 200);
  s.paint([10, 40, 190, 50], () => true, 'm', () => 0.45);
  for (let k = 0; k < 8; k++) s.line(14, 42 + k, 186, 42 + k, 0x8a8470, 1, 0.4);
  s.dot(176, 14, 2, 0x6aff6a);
  return s.render();
}
function windowCurtain() {
  const s = new HiSprite(170, 260, RAMPS);
  s.paint([0, 0, 170, 12], () => true, 's', () => 0.6);
  // curtains drawn shut, folds; the slit between them (the city's light is a prop)
  for (const [x0, x1] of [[4, 82], [88, 166]])
    s.paint([x0, 10, x1, 250], () => true, 'u', (x) => 0.45 + Math.sin(x * 0.35) * 0.15, { pat: speckle({ amt: 0.04 }) });
  s.paint([82, 10, 88, 250], () => true, 'k', () => 0.2);
  return s.render();
}
function shelf() {
  const s = new HiSprite(170, 30, RAMPS);
  s.paint([0, 0, 170, 12], () => true, 'o', () => 0.65);
  s.paint([0, 12, 170, 18], () => true, 'O', () => 0.4);
  for (const x of [20, 150]) s.poly([[x - 4, 18], [x + 4, 18], [x, 30]], 's', { flat: 0.5 });
  return s.render();
}
function router() {
  const s = new HiSprite(40, 24, RAMPS);
  s.paint([0, 6, 40, 24], () => true, 'k', () => 0.4);
  for (const x of [8, 32]) s.tube(x, 6, x, -10, 1.4, 'k');
  return s.render();
}

function mangaPile(seed) {
  const s = new HiSprite(50, 70, RAMPS);
  const rand = rng(seed);
  for (let k = 0; k < 7; k++) {
    const y = 60 - k * 8;
    s.poly([[6 + rand() * 4, y - 8], [42 + rand() * 4, y - 9], [44, y], [6, y + 1]], SERIES[Math.floor(rand() * SERIES.length)], { flat: 0.62 });
    s.px(14, y - 4, 0xffffff, 0.8);
  }
  return s.render();
}
function clothes() {
  const s = new HiSprite(110, 80, RAMPS);
  for (const [x, y, rx, ry, c] of [[40, 44, 34, 26, 'u'], [70, 40, 30, 22, 'k'], [52, 30, 22, 14, 'r'], [78, 54, 20, 14, 'w']]) s.ellipse(x, y, rx, ry, c, { bias: 0.05, pat: mottle({ amt: 0.15 }) });
  s.tube(20, 60, 6, 74, 6, 'u');
  return s.render();
}
function dumbbell() {
  const s = new HiSprite(60, 30, RAMPS);
  s.tube(12, 15, 48, 15, 3, 's');
  for (const x of [10, 50]) s.ellipse(x, 15, 7, 12, 'k', { bias: 0.1 });
  return s.render();
}
function gameBoxes(seed) {
  const s = new HiSprite(60, 50, RAMPS);
  const rand = rng(seed);
  for (let k = 0; k < 4; k++) s.poly([[6 + k * 2, 40 - k * 9], [48 + k * 2, 38 - k * 9], [50, 46 - k * 9], [6, 48 - k * 9]], SERIES[Math.floor(rand() * 6)], { flat: 0.6 });
  return s.render();
}

export function buildFar() {
  const r = new Raster(FW, 1152);
  for (let y = 0; y < r.h; y++) for (let x = 0; x < FW; x++) r.set(x, y, mix(0x1a1824, 0x24202e, fbm(x, y, { seed: 2, scale: 30, periodX: FW, periodY: 1152 })));
  return r;
}

export function buildMid() {
  const img = new Raster(FW, FH);
  const rand = rng(23);
  // ---- floor, back wall, entrance
  for (let y = 0; y < FH; y++)
    for (let x = 0; x < FW; x++) {
      let c;
      if (y < WALL_Y) c = wallpaper(x, y);
      else if (y < WALL_Y + 16) c = mix(0x3a2414, 0x5a3a22, y < WALL_Y + 4 ? 1 : 0.3); // the skirting
      else if (y < GENKAN_Y) c = tatami(x, y);
      else if (y < GENKAN_Y + 22) c = mix(0x5a3a22, 0x8a6038, y < GENKAN_Y + 6 ? 0.9 : 0.4); // the step's wooden edge
      else c = concrete(x, y);
      img.set(x, y, c);
    }
  // shadow under the skirting, the step
  for (let y = 0; y < 18; y++) for (let x = 0; x < FW; x++) img.set(x, WALL_Y + 16 + y, 0x0a0812, 0.35 * (1 - y / 18));
  for (let y = 0; y < 26; y++) for (let x = 0; x < FW; x++) img.set(x, GENKAN_Y + 22 + y, 0x0a0812, 0.45 * (1 - y / 26));
  // ---- the back wall: aircon, posters, the window, the shelf of figures and the router on it
  stamp(img, aircon(), 300, 18);
  const K = 0.44;
  for (const [i, px0, py0, ang] of [[0, 18, 80, -0.04], [1, 128, 60, 0.05], [2, 470, 110, 0.03]]) {
    const p = poster(31 + i * 7, i + 1);
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    const pw = 240 * K;
    const ph = 330 * K;
    const cx = px0 + pw / 2;
    const cy = py0 + ph / 2;
    for (let y = Math.floor(cy - ph); y < cy + ph; y++)
      for (let x = Math.floor(cx - pw); x < cx + pw; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const sx = Math.floor((dx * ca + dy * sa) / K + 120);
        const sy = Math.floor((-dx * sa + dy * ca) / K + 165);
        if (sx >= 0 && sx < 240 && sy >= 0 && sy < 330) img.set(x, y, p.get(sx, sy));
        else if (sx >= 0 && sx < 252 && sy >= 0 && sy < 344) img.set(x, y, 0x0a0812, 0.35);
      }
    for (const tx of [-1, 1]) for (let j = -4; j < 4; j++) for (let i2 = -8; i2 < 8; i2++) img.set(cx + tx * pw * 0.48 + i2, cy - ph / 2 + j + i2 * tx * 0.3, 0xe8dcb0, 0.6);
  }
  stamp(img, windowCurtain(), 270, 90);
  stamp(img, shelf(), 40, 270);
  for (let k = 0; k < 5; k++) stamp(img, figure(60 + k), 50 + k * 30, 226);
  stamp(img, router(), 300, 360 - 24);
  // ---- side walls (their tops, seen from above) along the whole room
  for (let y = WALL_Y; y < FH; y++)
    for (let x = 0; x < SIDE; x++) {
      const c = mix(0x2a2634, 0x3a3648, fbm(x, y, { seed: 12, scale: 20 }));
      img.set(x, y, x > SIDE - 4 ? 0x1a1824 : c);
      img.set(FW - 1 - x, y, x > SIDE - 4 ? 0x1a1824 : c);
    }
  for (let y = WALL_Y; y < FH; y++) for (let k = 0; k < 14; k++) img.set(SIDE + k, y, 0x0a0812, 0.3 * (1 - k / 14));
  // cables snaking from the TV and the kotatsu up the room to the desk
  for (const [x0, y0, c] of [[200, 1080, 0x1a1a20], [330, 1300, 0x2a2a3a], [250, 1080, 0xd0d0d0]]) {
    let x = x0;
    let y = y0;
    while (y > WALL_Y + 20) {
      x = Math.max(SIDE + 90, Math.min(FW - SIDE - 90, x + Math.sin(y * 0.013 + x0) * 2.2));
      y -= 1;
      for (let w = 0; w < 3; w++) img.set(x + w, y, c, w === 1 ? 1 : 0.7);
    }
  }
  // ---- along the left wall: bookcases; along the right: the laundry rack, the fan
  shadow(img, SIDE + 2, 470, 80, 520);
  stamp(img, bookcase(260), SIDE + 2, 470);
  stamp(img, bookcase(260), SIDE + 2, 730);
  shadow(img, FW - SIDE - 74, 520, 70, 320, 0.3);
  stamp(img, laundry(), FW - SIDE - 74, 520);
  shadow(img, FW - SIDE - 96, 900, 80, 110, 0.3);
  stamp(img, fanBase(), FW - SIDE - 96, 900);
  // ---- the middle of the room: TV, kotatsu and cushions, beanbag, the futon, a pizza box, things everywhere
  shadow(img, 170, 1060, 200, 160);
  stamp(img, tvStand(), 170, 1060);
  shadow(img, 150, 1290, 250, 230, 0.3);
  stamp(img, kotatsu(), 150, 1290);
  stamp(img, zabuton('p'), 230, 1530);
  stamp(img, zabuton('c'), 64, 1360);
  shadow(img, 400, 1640, 110, 100, 0.3);
  stamp(img, beanbag(), 400, 1640);
  shadow(img, 60, 1800, 230, 310, 0.25);
  stamp(img, futon(), 60, 1800);
  stamp(img, pizza(), 380, 1900);
  const things = [['can', 22], ['manga', 16], ['cup', 10], ['sock', 5], ['bag', 6]];
  let seed = 1;
  for (const [kind, n] of things)
    for (let k = 0; k < n; k++) {
      const x = SIDE + 40 + rand() * (FW - 2 * SIDE - 120);
      const y = WALL_Y + 60 + rand() * (GENKAN_Y - WALL_Y - 120);
      // (not on the big things)
      if ((x > 140 && x < 410 && y > 1040 && y < 1540) || (x > 40 && x < 300 && y > 1790 && y < 2120)) continue;
      stamp(img, small(kind, seed++), x, y);
    }
  for (const [fn, x, y] of [[() => mangaPile(1), 120, 1000], [() => mangaPile(2), 400, 1150], [() => mangaPile(3), 360, 2140], [() => mangaPile(4), 110, 640], [clothes, 300, 1700], [clothes, 380, 760], [dumbbell, 420, 2250], [() => gameBoxes(5), 390, 1240], [() => gameBoxes(6), 140, 1560], [() => small('bag', 9), 300, 2200]]) {
    const spr = fn();
    shadow(img, x, y, spr.w - 8, spr.h - 8, 0.25);
    stamp(img, spr, x, y);
  }
  // ---- the entrance: the door at the bottom, shoes, an umbrella, parcels, rubbish, flyers
  for (let y = FH - 60; y < FH; y++) for (let x = 170; x < 370; x++) img.set(x, y, mix(0x5a5a64, 0x8a8c96, (x - 170) / 400 + (y > FH - 56 ? 0 : 0.3)));
  img.set(270, FH - 30, 0xd0d0d8);
  for (let k = 0; k < 7; k++) stamp(img, small('manga', 90 + k), 200 + rand() * 120, FH - 100 + rand() * 30); // (flyers under the slot)
  for (const [x, y, c] of [[90, 2440, 'k'], [180, 2470, 'r'], [300, 2420, 'w'], [120, 2560, 'u']]) stamp(img, shoes(c), x, y);
  stamp(img, umbrella(), FW - SIDE - 40, 2440);
  shadow(img, 400, 2400, 90, 70, 0.3);
  stamp(img, parcel(90, 70), 400, 2400);
  stamp(img, parcel(70, 56), 410, 2350 + 30);
  stamp(img, parcel(110, 80), 380, 2500);
  stamp(img, rubbish(), SIDE + 6, 2560);
  stamp(img, rubbish(), SIDE + 70, 2590);
  // ---- light: a warm pool from the ceiling lamp over the middle, the corners dim, the entrance dark
  for (let y = 0; y < FH; y++)
    for (let x = 0; x < FW; x++) {
      const dx = (x - FW / 2) / FW;
      const dy = (y - FH * 0.45) / FH;
      const d = Math.hypot(dx * 1.4, dy * 1.6);
      const dim = Math.min(0.55, d * 0.9) + (y > GENKAN_Y ? 0.12 : 0);
      img.set(x, y, 0x0a0812, dim);
    }
  grade(img, { sat: 0.85, bright: 0.8, tint: 0x203060, tintAmt: 0.08 });
  // ---- the moving parts
  const kit = new PropKit(1794, { artScale: S });
  const u = (y) => Math.round(L - y / S);
  // the TV: a game on its screen (120 x 70 at (210, 1078))
  const tv = [0, 1, 2].map((f) => {
    const r = new Raster(120, 70);
    for (let y = 0; y < 70; y++)
      for (let x = 0; x < 120; x++) {
        const sky = mix(0x2a3a8a, 0x8ab0ff, y / 70);
        const h = 46 + Math.sin((x + f * 10) * 0.07) * 6;
        r.set(x, y, y > h ? mix(0x2a8a3a, 0x1a5a2a, (y - h) / 20) : sky);
        if (y % 3 === 0) r.set(x, y, 0x000000, 0.2);
      }
    for (let y = 0; y < 12; y++) for (let x = 0; x < 10; x++) if ((x - 5) ** 2 + (y - 6) ** 2 < 30) r.set(40 + x, 30 - [0, 8, 3][f] + y, 0xffffff);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 14; x++) r.set(90 - f * 10 + x, 40 + y, 0xff6a4a);
    return kit.frame(r);
  });
  kit.loop(Math.round(210 / S), u(1078), tv, { fps: 4 });
  // the phone on the futon: a notification now and then
  const ph = (() => {
    const r = new Raster(22, 38);
    for (let y = 0; y < 38; y++) for (let x = 0; x < 22; x++) r.set(x, y, mix(0x3a6aff, 0xa8d0ff, y / 38));
    for (let x = 3; x < 19; x++) for (const y of [6, 7, 12, 13]) r.set(x, y, 0xffffff);
    return kit.frame(r);
  })();
  kit.loop(Math.round((60 + 170) / S), u(1800 + 60), [ph], { fps: 2, seq: [-1, -1, -1, -1, -1, 0, 0, -1, 0, -1, -1, -1] });
  // the fan
  kit.loop(Math.round((FW - SIDE - 96 + 3) / S), u(900 - 2), [0, 1, 2].map((f) => kit.frame(fanBlades(f))), { fps: 10 });
  // the router's lights, the light at the curtains' slit, the aircon's lamp
  const led = (c) => {
    const r = new Raster(4, 4);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) r.set(x, y, c);
    return kit.frame(r);
  };
  const leds = [led(0x6aff6a), led(0x6ab8ff)];
  kit.wave(leds, [0, 1, 0, 1].map((i, k) => [i, Math.round((306 + k * 8) / S), u(350), k * 1.7]), { w: 6, a0: 0.1, a1: 1, pw: 4 });
  const slit = (() => {
    const r = new Raster(6, 236);
    for (let y = 0; y < 236; y++) for (let x = 0; x < 6; x++) r.set(x, y, 0xffe8b0, (1 - Math.abs(x - 2.5) / 3) * 0.8);
    return kit.frame(r);
  })();
  kit.wave([slit], [[0, Math.round(352 / S), u(100), 0]], { w: 0.7, a0: 0.35, a1: 0.9, pw: 1 });
  // steam off the noodle cup on the kotatsu
  const st = [0, 1, 2].map((k) => {
    const r = new Raster(16, 16);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const d = Math.hypot(x - 8, y - 8) / (3 + k * 2) + (fbm(x, y, { seed: 70 + k, scale: 3 }) - 0.5) * 0.5;
      if (d < 1) r.set(x, y, 0xf0f4ff, 0.5 * (1 - d));
    }
    return kit.frame(r);
  });
  kit.emit(Math.round(310 / S), u(1290 + 66), [[st[0]], [st[1]], [st[2]]], { rate: 1.2, life: [1.5, 2.5], vy: 8, sx: 2, wf: 0.4, a: 0.7 });
  return {
    strip: img,
    props: kit.pack(),
    meta: { width: W, artScale: S, chunkHeight: L, chunks: 1, length: L, tint: tintTable(L, () => [255, 255, 255]) },
  };
}
