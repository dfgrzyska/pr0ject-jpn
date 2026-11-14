// Random encounter 4 (ex4): the endless cat. A smoke-grey tabby whose body never ends: a head (seen from above,
// nose down, the game turns it to where it goes), and a body of round furry segments, darker stripes across them,
// a pair of white-socked paws every so often; far down its length it thins out into smoke. Its hairballs and the
// balls of yarn it bats about.
import { HiSprite, tones, fur, speckle, mix2 } from '../../lib/hisprite.mjs';

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

// ---------------------------------------------------------------- the head (16 x 16 -> 48 x 48), nose down
export function head(mood) {
  const s = new HiSprite(48, 54, RAMPS);
  const cx = 24;
  const cy = 26;
  for (const sx of [-1, 1]) {
    s.poly([[cx + sx * 6, cy - 10], [cx + sx * 18, cy - 24], [cx + sx * 19, cy - 6]], 'c', { flat: 0.55 });
    s.poly([[cx + sx * 9, cy - 10], [cx + sx * 16, cy - 20], [cx + sx * 16, cy - 8]], 'p', { flat: 0.5 });
  }
  s.ellipse(cx, cy, 19, 17, 'c', { bias: 0.06, ...furry(3) });
  for (let k = -1; k <= 1; k++) s.tube(cx + k * 5, cy - 16, cx + k * 5.5, cy - 8, 1.6, 'd', { rb: 1 });
  s.ellipse(cx, cy + 9, 10, 7, 'w', { flat: 0.82 });
  const shut = mood === 'purr';
  for (const sx of [-1, 1]) {
    if (shut) {
      s.line(cx + sx * 4, cy, cx + sx * 7, cy - 2, INK, 1);
      s.line(cx + sx * 7, cy - 2, cx + sx * 10, cy, INK, 1);
    } else {
      s.ellipse(cx + sx * 7.5, cy - 1, 4.2, 4, 'e', { flat: 0.95, glow: true });
      s.line(cx + sx * 7.5, cy - 4, cx + sx * 7.5, cy + 2, INK, 1);
      s.px(cx + sx * 7.5 - 1.5, cy - 2.5, 0xffffff);
    }
    for (const dy of [-1, 2]) s.line(cx + sx * 10, cy + 8 + dy, cx + sx * 23, cy + 6 + dy * 2.5, 0xf4f4f0, 1, 0.85);
  }
  s.poly([[cx - 2.4, cy + 5], [cx + 2.4, cy + 5], [cx, cy + 7.5]], 'p', { flat: 0.8 });
  if (mood === 'meow') {
    s.paint([cx - 6, cy + 8, cx + 6, cy + 18], (x, y) => ((x - cx) / 5.5) ** 2 + ((y - cy - 12) / 5) ** 2 < 1, 'p', () => 0.25);
    for (const sx of [-1, 1]) s.poly([[cx + sx * 4.5, cy + 8], [cx + sx * 3, cy + 8], [cx + sx * 3.8, cy + 11]], 'w', { flat: 0.95 });
  } else {
    s.line(cx, cy + 7.5, cx - 3, cy + 10, INK, 1);
    s.line(cx, cy + 7.5, cx + 3, cy + 10, INK, 1);
  }
  return s.render();
}

// ---------------------------------------------------------------- a body segment (9 x 8 -> 27 x 24); with paws; thinning into smoke
export function segment(kind) {
  const s = new HiSprite(39, 27, RAMPS);
  const cx = 19.5;
  if (kind === 'paws')
    for (const sx of [-1, 1]) {
      s.tube(cx + sx * 9, 13, cx + sx * 16, 18, 3, 'c', { rb: 2.6, ...furry(5) });
      s.ellipse(cx + sx * 16.5, 19, 3.2, 2.6, 'w', { flat: 0.85 });
    }
  s.ellipse(cx, 13.5, 12.5, 11.5, 'c', { bias: 0.08, ...furry(kind === 'b' ? 7 : 9, 0) });
  // the tabby stripe across it (alternating thick and thin)
  s.paint([cx - 13, 8, cx + 13, 19], (x, y) => ((x - cx) / 12.5) ** 2 + ((y - 13.5) / 11.5) ** 2 < 1 && Math.abs(y - 13.5 - Math.sin((x - cx) * 0.3) * 1.5) < (kind === 'b' ? 1.6 : 3), 'd', () => 0.5);
  // a thin, soft outline: the segments overlap into one long furry body, not a string of beads
  return s.render({ outline: 1, outlineColor: 0x2a2c38 });
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
  add('nagai_head_meow', head('meow'));
  add('nagai_head_purr', head('purr'));
  add('nagai_seg_a', segment('a'));
  add('nagai_seg_b', segment('b'));
  add('nagai_seg_paws', segment('paws'));
  for (let f = 0; f < 2; f++) add(`hairball_${f}`, hairball(f));
  add('yarn_r', yarn('r'));
  add('yarn_b', yarn('b'));
}
