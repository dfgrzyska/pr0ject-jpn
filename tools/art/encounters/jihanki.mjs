// Random encounter 1 (ex1): the vending machine that has had enough. A Japanese street jidōhanbaiki, cream with a
// red header (no brand on it, no words: just its own glowing angry eyes), three shelves of sample drinks behind the
// glass with the blue (cold) and red (hot) price strips under them, the coin and note slots, the little four-digit
// lottery display of the machines that "might give you another one free", and the flap where the can comes out.
// Its cans (hot, cold, the golden prize one), the puddles they leave, and the red LED digits of the lottery.
import { HiSprite, tones, speckle, crackle, mix2 } from '../../lib/hisprite.mjs';

const INK = 0x14101c;
const RAMPS = {
  c: tones([0x9a9282, 0xe8e2d2, 0xfffcf2]), // the cabinet, cream enamel
  r: tones([0x7a1418, 0xd02a26, 0xff7a5e]), // its red header
  g: [0x0a1220, 0x142236, 0x22344c, 0x3a5470, 0x7aa0c0], // the glass, dark, a sheen on it
  k: tones([0x18161e, 0x2e2c36, 0x4e4c58]), // the flap, the slots
  h: tones([0x7a1a10, 0xd8401e, 0xff9a5a]), // a hot can
  b: tones([0x103a7a, 0x2a7ad8, 0x9ad8ff]), // a cold can
  o: tones([0x8a6010, 0xe8b830, 0xfff4a8]), // the prize can
  s: tones([0x5a5a64, 0xb8bac4, 0xf4f6ff]), // can tops, metal
  f: tones([0x3a2010, 0x7a4a24, 0xb8804a]), // spilt coffee
  i: tones([0x6aa0c8, 0xb8e0f4, 0xf4fcff]), // slush and frost
};
const DRINKS = [0x2a7ad8, 0xd02a26, 0x3aa84a, 0xe8b830, 0xf4f4f0, 0x8a4ab8, 0xe86a20, 0x1a1a2a, 0x6ad0c8];

// ---------------------------------------------------------------- the machine (48 x 72 -> 144 x 216)
// state: 0/1 the lights blinking, 'open' the flap up with a can in it, 2 dented and cracked, 3 smashed and raging
export function jihanki(state) {
  const s = new HiSprite(144, 216, RAMPS);
  const hurt = state === 2 || state === 3;
  const smashed = state === 3;
  const blink = state === 1;
  // the cabinet, its plinth, the side seen a little on the right
  s.paint([6, 4, 138, 206], (x, y) => x >= 8 && x <= 136 && y >= 6 && y <= 204, 'c', (x, y) => 0.62 - (x - 72) / 260 - (y - 100) / 900, { pat: mix2(speckle({ amt: 0.04 }), hurt ? crackle({ amt: 0.06, scale: 7 }) : () => 0) });
  s.paint([126, 6, 138, 204], (x, y) => x > 128 && x <= 136, 'c', () => 0.28);
  s.paint([4, 200, 140, 214], (x, y) => y >= 202 && y <= 213 && x >= 6 && x <= 138, 'k', () => 0.45);
  // the red header with its eyes: two glowing slits under heavy brows, angrier as it goes
  s.paint([8, 6, 136, 40], (x, y) => x >= 10 && x <= 134 && y >= 8 && y <= 38, 'r', (x, y) => 0.58 - (y - 8) / 90 - (x - 72) / 300);
  for (const sx of [-1, 1]) {
    const ex = 72 + sx * 28;
    const tilt = smashed ? 7 : hurt ? 5 : 3;
    s.paint([ex - 16, 14, ex + 16, 34], (x, y) => Math.abs(x - ex) < 14 && Math.abs(y - 25 - (x - ex) * sx * -0.12) < 4.2 - Math.abs(x - ex) * 0.18, smashed ? 'r' : 'o', () => 0.95, { glow: true });
    if (!blink || smashed) s.ellipse(ex - sx * 2, 25.5, 2.6, 2.6, smashed ? 'k' : 'k', { flat: 0.2 });
    // the brows
    s.tube(ex - 15, 17 - (sx < 0 ? 0 : tilt), ex + 15, 17 - (sx < 0 ? tilt : 0), 2.6, 'k', { rb: 2.6 });
  }
  // the window with its three shelves of samples
  const WX0 = 16;
  const WX1 = 104;
  s.paint([WX0, 44, WX1, 141], (x, y) => x >= WX0 && x <= WX1 && y >= 44 && y <= 140, 'g', (x, y) => 0.35 + ((x - y * 0.4) % 40 < 6 ? 0.25 : 0) + (smashed ? -0.1 : 0));
  let n = 0;
  for (const [row, sy] of [[0, 47], [1, 77], [2, 107]]) {
    for (let k = 0; k < 6; k++) {
      const cx = WX0 + 9 + k * 14.4;
      const col = DRINKS[(k * 5 + row * 3) % DRINKS.length];
      const fallen = smashed && (k + row) % 3 === 0;
      if (fallen) continue;
      if ((k + row) % 2) {
        // a plastic bottle: shoulders, a neck, a cap
        s.paint([cx - 6, sy, cx + 6, sy + 24], (x, y) => Math.abs(x - cx) < (y < sy + 6 ? 2 : y < sy + 9 ? 2 + (y - sy - 6) * 1.2 : 5.2) && y > sy + 1, 'c', () => 0.85);
        s.paint([cx - 6, sy + 10, cx + 6, sy + 20], (x, y) => Math.abs(x - cx) < 5.2 && y > sy + 11 && y < sy + 19, 'c', () => 0.6);
        for (let y = sy + 11; y < sy + 19; y++) for (let x = cx - 5; x <= cx + 5; x++) s.px(x, y, col, 0.85);
        s.paint([cx - 3, sy - 2, cx + 3, sy + 2], (x, y) => Math.abs(x - cx) < 2.4 && y > sy - 1 && y < sy + 2, 'k', () => 0.6);
      } else {
        // a can: its rim and top, the label wrapped round it
        for (let y = sy + 6; y < sy + 24; y++) for (let x = cx - 5; x <= cx + 5; x++) s.px(x, y, col, 1);
        for (let y = sy + 6; y < sy + 24; y++) {
          s.px(cx - 5, y, 0xffffff, 0.35);
          s.px(cx + 5, y, INK, 0.35);
        }
        s.ellipse(cx, sy + 6, 5.4, 2, 's', { flat: 0.8 });
        for (let x = cx - 4; x <= cx + 4; x++) s.px(x, sy + 15, 0xffffff, 0.6);
      }
      n++;
    }
    // the price strip under the shelf: blue for cold, red for hot (the bottom row is hot), a button on each
    const hot = row === 2;
    for (let y = sy + 26; y < sy + 31; y++) for (let x = WX0 + 1; x < WX1; x++) s.px(x, y, hot ? 0xd02a26 : 0x2a6ad0, 1);
    for (let k = 0; k < 6; k++) {
      const bx = WX0 + 9 + k * 14.4;
      s.ellipse(bx, sy + 28.5, 2.2, 1.6, (blink ? k % 2 : (k + 1) % 2) ? 'o' : 's', { flat: 0.9, glow: true });
    }
  }
  // the right-hand panel: the lottery display (its digits are drawn on by the game), the coin and note slots,
  // the coin return lever
  s.paint([108, 44, 126, 146], (x, y) => x >= 108 && x <= 126 && y >= 44 && y <= 144, 'c', () => 0.5);
  s.paint([109, 52, 125, 66], (x, y) => x >= 109 && x <= 125 && y >= 52 && y <= 66, 'k', () => 0.12);
  s.paint([112, 76, 122, 90], (x, y) => x >= 112 && x <= 122 && y >= 76 && y <= 90, 's', () => 0.6);
  for (let y = 79; y < 88; y++) s.px(117, y, INK);
  s.paint([110, 98, 124, 104], (x, y) => x >= 110 && x <= 124 && y >= 98 && y <= 103, 'k', () => 0.2);
  s.tube(113, 116, 121, 116, 2.4, 's', { rb: 2.4 });
  s.ellipse(117, 132, 4, 4, 'k', { flat: 0.3 });
  // the lottery display under the window: four digits (the game lights them) in a black box
  s.paint([38, 142, 90, 160], (x, y) => x >= 39 && x <= 89 && y >= 143 && y <= 159, 'k', () => 0.08);
  for (let x = 39; x <= 89; x++) s.px(x, 143, 0x5a5862);
  // the flap where the can comes out (the machine's mouth)
  const open = state === 'open';
  s.paint([20, 162, 104, 196], (x, y) => x >= 22 && x <= 102 && y >= 164 && y <= 196, 'k', () => (open ? 0.05 : 0.3));
  if (open) {
    // the flap swung up, the dark inside, a can tumbling into the tray
    s.paint([20, 160, 104, 166], (x, y) => x >= 22 && x <= 102 && y >= 160 && y <= 165, 'k', () => 0.6);
    s.paint([50, 172, 76, 194], (x, y) => x >= 52 && x <= 74 && y >= 176 && y <= 192, 'h', (x) => 0.75 - (x - 52) / 60);
    s.ellipse(63, 176, 11, 3, 's', { flat: 0.8 });
  } else {
    for (let x = 24; x < 101; x++) s.px(x, 166, 0x5a5862);
    for (let k = 0; k < 6; k++) s.line(30 + k * 12, 170, 30 + k * 12, 192, 0x3a3842, 1);
  }
  // the wear and tear
  if (hurt) {
    for (const [x0, y0, x1, y1] of [[30, 60, 58, 100], [58, 100, 50, 130], [58, 100, 90, 92], [90, 92, 100, 120]]) s.line(x0, y0, x1, y1, 0xe8f4ff, 1, 0.9);
    s.ellipse(124, 180, 8, 5, 'c', { flat: 0.32 }); // a dent
    s.ellipse(20, 150, 6, 4, 'c', { flat: 0.3 });
  }
  if (smashed) {
    // the glass gone in a corner, sparks, a cable hanging, the header buckled
    s.paint([WX0, 44, 56, 84], (x, y) => x - WX0 + (y - 44) < 40 && x >= WX0 && y >= 44, 'k', () => 0.08);
    for (const [x0, y0, x1, y1] of [[18, 46, 40, 70], [24, 44, 30, 58], [40, 46, 54, 60]]) s.line(x0, y0, x1, y1, 0xf4fcff, 1);
    s.tube(30, 60, 26, 90, 1.4, 'k', { rb: 1 });
    s.dot(26, 92, 2.4, 0xfff0a0);
    s.dot(29, 94, 1.4, 0xff9a40);
    s.line(10, 40, 134, 36, 0x5a1010, 1);
  }
  return s.render();
}

// ---------------------------------------------------------------- the cans it throws (7 x 10 -> 21 x 30)
export function can(kind) {
  const s = new HiSprite(24, 33, RAMPS);
  const m = kind === 'hot' ? 'h' : kind === 'gold' ? 'o' : 'b';
  s.paint([3, 4, 21, 30], (x, y) => x >= 4 && x <= 20 && y >= 6 && y <= 29, m, (x) => 0.85 - (x - 4) / 22);
  s.ellipse(12, 6, 8.4, 3, 's', { flat: 0.82 });
  s.ellipse(12, 29, 8.4, 2.4, 's', { flat: 0.45 });
  s.ellipse(14, 5.6, 2, 1, 'k', { flat: 0.4 }); // the ring pull
  for (let x = 5; x <= 19; x++) s.px(x, 17, 0xffffff, 0.75);
  for (let x = 5; x <= 19; x++) s.px(x, 18, 0xffffff, 0.35);
  if (kind === 'gold') for (const [x, y] of [[8, 11], [16, 23], [10, 25]]) s.dot(x, y, 1.2, 0xffffff);
  if (kind === 'cold') for (const [x, y] of [[7, 10], [17, 13], [9, 24], [18, 26]]) s.dot(x, y, 1, 0xf4fcff, 0.9);
  return s.render();
}

// ---------------------------------------------------------------- puddles (30 x 18 -> 90 x 54): hot coffee, cold slush
export function puddle(hot, f) {
  const s = new HiSprite(90, 54, RAMPS);
  const m = hot ? 'f' : 'i';
  const lobes = [[45, 27, 34, 15], [24, 30, 16, 10], [66, 24, 18, 11], [40, 18, 14, 8], [58, 35, 14, 8]];
  s.paint([0, 0, 90, 54], (x, y) => lobes.some(([cx, cy, rx, ry]) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1), m, (x, y) => 0.45 + Math.sin((x + y + f * 9) * 0.25) * 0.08 - Math.hypot(x - 45, (y - 27) * 2) / 160);
  if (hot) {
    // a sheen, and the steam curling off it
    s.ellipse(36, 22, 9, 2.5, 'f', { flat: 0.85 });
    for (let k = 0; k < 3; k++) for (let y = 4; y < 22; y++) s.px(28 + k * 16 + Math.sin(y * 0.5 + f * 2 + k) * 2.5, y, 0xffffff, 0.25 + (22 - y) / 60);
  } else {
    // crystals of frost on it and round its edge
    for (let k = 0; k < 9; k++) {
      const x = 14 + ((k * 23 + f * 7) % 62);
      const y = 14 + ((k * 13) % 26);
      s.line(x - 2, y, x + 2, y, 0xffffff, 1);
      s.line(x, y - 2, x, y + 2, 0xffffff, 1);
    }
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
  add('jihanki_0', jihanki(0));
  add('jihanki_1', jihanki(1));
  add('jihanki_open', jihanki('open'));
  add('jihanki_2', jihanki(2));
  add('jihanki_3', jihanki(3));
  for (const k of ['hot', 'cold', 'gold']) add(`can_${k}`, can(k));
  for (let f = 0; f < 2; f++) {
    add(`puddle_hot_${f}`, puddle(true, f));
    add(`puddle_cold_${f}`, puddle(false, f));
  }
  for (let d = 0; d < 10; d++) add(`led_${d}`, led(d));
  add('led_off', led(null));
}
export const JIHANKI_PORTRAITS = ['jihanki_0'];
