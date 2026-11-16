// Random encounter 4 (ex4): the endless cat. A smoke-grey tabby whose body never ends: a head (seen from above,
// nose down, the game turns it to where it goes), and a body of round furry segments, darker stripes across them,
// a pair of white-socked paws every so often; far down its length it thins out into smoke. Its hairballs and the
// balls of yarn it bats about.
import { HiSprite, tones, fur, speckle, mix2, hash } from '../../lib/hisprite.mjs';

const INK = 0x14101c;
const RAMPS = {
  c: tones([0x3a3e4a, 0x7a808e, 0xb8bcc8]), // smoke-grey fur
  d: tones([0x1a1c24, 0x34384a, 0x5a5e6e]), // its stripes
  w: tones([0x9a948a, 0xeae6de, 0xffffff]), // white socks, muzzle
  p: tones([0x8a3a4a, 0xe07a8a, 0xffc0c8]), // the pink of nose and mouth
  e: tones([0x6a5a10, 0xe0c030, 0xfff4a0]), // its eyes, gold
  r: tones([0x7a1418, 0xd02a26, 0xff7a5e]), // yarn
  b: tones([0x1a2a6a, 0x3a5ad0, 0x9ab8ff]), // yarn
};
const furry = (seed, a = Math.PI / 2) => ({ pat: mix2(fur(a, { amt: 0.16, len: 5, w: 1.3, gap: 0.05, seed }), speckle({ amt: 0.04 })) });

// ---------------------------------------------------------------- the head (20 x 22 -> 60 x 66), nose down
// mood: 0 | 'blink' | 'meow' | 'purr'. A round tabby face: ears with pink insides, dark tips and pale tufts, fluffed
// cheeks, the M on its forehead and stripes back from the eyes, big gold eyes with slit pupils, a white muzzle in
// two pads with their whisker dots, a pink nose, long whiskers.
export function head(mood) {
  const s = new HiSprite(60, 66, RAMPS);
  const cx = 30;
  const cy = 32;
  for (const sx of [-1, 1]) {
    s.poly([[cx + sx * 7, cy - 12], [cx + sx * 21, cy - 30], [cx + sx * 24, cy - 6]], 'c', { flat: 0.5, ...furry(2) });
    s.poly([[cx + sx * 18.5, cy - 25], [cx + sx * 21, cy - 30], [cx + sx * 22.5, cy - 21]], 'd', { flat: 0.42 });
    s.poly([[cx + sx * 11, cy - 13], [cx + sx * 19, cy - 24], [cx + sx * 21, cy - 9]], 'p', { flat: 0.42 });
    s.poly([[cx + sx * 13, cy - 13], [cx + sx * 18, cy - 20], [cx + sx * 19, cy - 11]], 'p', { flat: 0.2 });
    for (let k = 0; k < 3; k++) s.line(cx + sx * (11 + k * 2.5), cy - 11, cx + sx * (13 + k * 2.5), cy - 17 - k, 0xe4e6ee, 1, 0.9);
    // the cheek's ruff, in points
    for (let k = 0; k < 4; k++) s.poly([[cx + sx * 16, cy + 1 + k * 4], [cx + sx * (27 - k * 1.5), cy + 7 + k * 4], [cx + sx * 15, cy + 9 + k * 4]], 'c', { flat: 0.52 - k * 0.05 });
  }
  s.ellipse(cx, cy, 23, 20, 'c', { bias: 0.06, ...furry(3) });
  s.shade([cx - 23, cy + 6, cx + 23, cy + 21], (x, y) => ((x - cx) / 23) ** 2 + ((y - cy) / 20) ** 2 > 0.72, -0.08); // (under the jaw)
  // the markings
  for (let k = -1; k <= 1; k++) s.tube(cx + k * 6, cy - 19, cx + k * 6.6, cy - 9.5, 1.9, 'd', { rb: 1 });
  for (const sx of [-1, 1]) {
    s.tube(cx + sx * 13, cy - 16, cx + sx * 11.5, cy - 10, 1.4, 'd', { rb: 0.8 });
    for (const dy of [0, 5]) s.tube(cx + sx * 22, cy + dy, cx + sx * 15.5, cy + 2.5 + dy, 1.6, 'd', { rb: 0.7 });
  }
  // the muzzle: two pads and the chin, the dots the whiskers grow from
  s.ellipse(cx, cy + 13, 6, 5, 'w', { flat: 0.74 });
  for (const sx of [-1, 1]) s.ellipse(cx + sx * 5.4, cy + 10.5, 6.6, 5.4, 'w', { bias: 0.12 });
  for (const sx of [-1, 1]) for (const [dx, dy] of [[4, 9], [7, 10.5], [5, 12.5], [8.5, 13]]) s.px(cx + sx * dx - (sx < 0 ? 1 : 0), cy + dy, 0x8a8c98);
  const eye = (sx) => {
    const ex = cx + sx * 9.6;
    const ey = cy - 1;
    if (mood === 'purr') {
      // shut in a smile
      for (let t = -1; t <= 1; t += 0.05) {
        s.px(ex + t * 5.4, ey + 1.5 - (1 - t * t) * 3.4, INK);
        s.px(ex + t * 5.4, ey + 2.5 - (1 - t * t) * 3.4, INK);
      }
      return;
    }
    s.ellipse(ex, ey, 6.6, 6, 'd', { flat: 0.12 });
    s.ellipse(ex, ey, 5.6, 5, 'e', { bias: 0.16, glow: true });
    s.shade([ex - 6, ey - 5, ex + 6, ey - 1], () => true, -0.14); // (the lid's shadow)
    const wide = mood === 'meow';
    s.paint([ex - 4, ey - 5, ex + 4, ey + 5], (x, y) => ((x - ex) / (wide ? 3.2 : 1.5)) ** 2 + ((y - ey) / 4.4) ** 2 < 1, 'd', () => 0.02);
    s.px(ex - 2.6, ey - 3, 0xffffff);
    s.px(ex - 1.6, ey - 3, 0xffffff);
    s.px(ex - 2.6, ey - 2, 0xffffff);
    s.px(ex + 1.6, ey + 2, 0xfff8d0);
    if (mood === 'blink') {
      // the lid most of the way down
      s.paint([ex - 7, ey - 7, ex + 7, ey + 2], (x, y) => ((x - ex) / 6.6) ** 2 + ((y - ey) / 6) ** 2 < 1 && y < ey + 1.5, 'c', () => 0.5, furry(4));
      for (let t = -1; t <= 1; t += 0.05) s.px(ex + t * 6, ey + 1.5 + (1 - t * t) * 0.8, INK);
    } else for (let t = -1; t <= 1; t += 0.04) s.px(ex + t * 6.2, ey - 0.6 - (1 - t * t) * 5.2, INK); // (the upper lid's line)
  };
  eye(-1);
  eye(1);
  for (const sx of [-1, 1]) for (const [dy, len, rise] of [[9, 17, -3], [11, 18, 0], [13, 15, 3]]) s.line(cx + sx * 8, cy + dy, cx + sx * (8 + len), cy + dy + rise, 0xf4f4f0, 1, 0.9);
  s.poly([[cx - 3, cy + 5.5], [cx + 3, cy + 5.5], [cx, cy + 9]], 'p', { flat: 0.72 });
  s.px(cx - 1.5, cy + 6, 0xffe0e4);
  if (mood === 'meow') {
    // the mouth wide: the dark of it, the tongue, four teeth
    s.paint([cx - 7, cy + 9, cx + 7, cy + 24], (x, y) => ((x - cx) / 6) ** 2 + ((y - cy - 16) / 7) ** 2 < 1, 'p', (x, y) => 0.14 + (y - cy - 9) / 90);
    s.ellipse(cx, cy + 19.5, 3.8, 3, 'p', { flat: 0.72 });
    s.line(cx, cy + 18, cx, cy + 21.5, 0xb85a6a, 1, 0.9);
    for (const sx of [-1, 1]) {
      s.poly([[cx + sx * 4.8, cy + 10], [cx + sx * 2.8, cy + 10], [cx + sx * 3.8, cy + 14]], 'w', { flat: 0.95 });
      s.poly([[cx + sx * 3.6, cy + 22.5], [cx + sx * 2, cy + 22.5], [cx + sx * 2.8, cy + 20]], 'w', { flat: 0.9 });
    }
  } else {
    s.line(cx, cy + 9, cx, cy + 11, INK, 1);
    s.line(cx, cy + 11, cx - 4, cy + 13.5, INK, 1);
    s.line(cx, cy + 11, cx + 4, cy + 13.5, INK, 1);
    if (mood === 'purr') for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) s.line(cx + sx * (15 + k * 2), cy + 5, cx + sx * (14 + k * 2), cy + 8, 0xe07a8a, 1, 0.8); // (a blush)
  }
  return s.render();
}

// ---------------------------------------------------------------- a length of body (13 x 9 -> 39 x 27); with paws
// The body runs up and down the frame and the game lays the lengths over one another ten fine px apart, each over
// the one behind it. So a length is a piece of one round tube, lit across and the same from end to end, with no
// outline over its ends; its tabby rings repeat every ten px and so run on unbroken from length to length: a dark
// line down the spine, the rings sweeping back from it.
export function segment(kind) {
  const s = new HiSprite(45, 27, RAMPS);
  const cx = 22.5;
  const R = 13.4;
  const edge = (y) => R - (y < 2 ? 2 - y : 0) - (hash(1, Math.floor(y), kind === 'b' ? 5 : 3) < 0.4 ? 1 : 0); // (the fur's ragged edge)
  if (kind === 'paws')
    for (const sx of [-1, 1]) {
      // a leg out to the side, the white sock, three toes
      s.tube(cx + sx * 10, 11, cx + sx * 17, 16, 3.4, 'c', { rb: 2.8, ...furry(5) });
      s.ellipse(cx + sx * 17.8, 17.5, 4.3, 3.9, 'd', { flat: 0.2 });
      s.ellipse(cx + sx * 17.8, 17.5, 3.4, 3, 'w', { bias: 0.1 });
      for (const k of [-1, 0, 1]) s.px(cx + sx * 17.8 + k * 2 - 0.5, 19.5, 0x9a948a);
      s.tube(cx + sx * 11, 9, cx + sx * 14.5, 11.5, 1.1, 'd', { rb: 0.8 });
    }
  s.paint([cx - 15, 0, cx + 15, 26], (x, y) => Math.abs(x - cx) <= edge(y), 'c', (x) => {
    const d = (x - cx) / R;
    return 0.92 - d * d * 0.5 - d * 0.07;
  }, furry(kind === 'b' ? 7 : 9));
  // the rings (every ten px, swept back from the spine) and the spine's own line
  s.paint([cx - 15, 0, cx + 15, 26], (x, y) => {
    const d = Math.abs(x - cx);
    if (d > edge(y)) return false;
    const v = (((y + d * 0.5) % 10) + 10) % 10;
    return (v < 2.3 && d > 3 && d < R - 1.6) || d < 1.3;
  }, 'd', (x) => 0.86 - Math.abs((x - cx) / R) * 0.3);
  // pale fur along its flanks, where the light catches the long hairs
  for (let y = 4; y < 27; y++) if (hash(2, y, 7) < 0.5) s.px(cx - edge(y) + 2 + (y % 2), y, 0xd0d4de, 0.7);
  // its edge drawn down the two sides only
  for (let y = 3; y < 27; y++) for (const sx of [-1, 1]) s.px(cx + sx * (edge(y) + 0.5) - 0.5, y, 0x2a2c38);
  return s.render({ outline: 0, rim: 0 });
}

export function hairball(f) {
  const s = new HiSprite(24, 24, RAMPS);
  s.ellipse(12, 12, 8, 7.5, 'c', { bias: 0.1, ...furry(11 + f, f) });
  return s.render();
}

export function yarn(col) {
  const s = new HiSprite(33, 33, RAMPS);
  s.ellipse(16.5, 16.5, 12, 12, col, { bias: 0.12 });
  for (let k = 0; k < 6; k++) {
    const a = k * 0.55;
    for (let t = -11; t <= 11; t += 0.5) s.px(16.5 + Math.cos(a) * t - Math.sin(a) * Math.sqrt(Math.max(0, 121 - t * t)) * 0.3, 16.5 + Math.sin(a) * t + Math.cos(a) * Math.sqrt(Math.max(0, 121 - t * t)) * 0.3, 0xffffff, 0.35);
  }
  for (let t = 0; t < 12; t++) s.px(28 + t * 0.4, 22 + Math.sin(t * 0.8) * 2, col === 'r' ? 0xd02a26 : 0x3a5ad0);
  return s.render();
}

export function nagaiEnemies(add) {
  add('nagai_head_0', head(0));
  add('nagai_head_blink', head('blink'));
  add('nagai_head_meow', head('meow'));
  add('nagai_head_purr', head('purr'));
  add('nagai_seg_a', segment('a'));
  add('nagai_seg_b', segment('b'));
  add('nagai_seg_paws', segment('paws'));
  for (let f = 0; f < 2; f++) add(`hairball_${f}`, hairball(f));
  add('yarn_r', yarn('r'));
  add('yarn_b', yarn('b'));
}
