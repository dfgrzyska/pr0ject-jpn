// Random encounter 7 (ex7): the weeping lectern. A press-conference lectern come to life (no person, no likeness:
// only the behaviour of a famous press conference): a wooden podium with a fan of microphones on top, a face on its
// front panel, an ear on its side, two white-gloved hands. It cups a hand to its ear and does not hear; it wails,
// tears flying; it bangs the desk; it waves an arm about. Its train tickets (one in five stamped "no train ran").
import { HiSprite, tones } from '../../lib/hisprite.mjs';

const INK = 0x14101c;
const RAMPS = {
  o: tones([0x4a2a14, 0x8a5428, 0xc88a50]), // the podium's wood
  d: tones([0x2a1a10, 0x4a3020, 0x6a4a30]), // its darker front panel
  k: tones([0x18161e, 0x2e2c36, 0x5a5864]), // microphones
  w: tones([0x9a948a, 0xeae6de, 0xffffff]), // gloves, tickets
  f: tones([0xa86a4a, 0xe8b48e, 0xffe0c8]), // the ear
  t: tones([0x2a6a9a, 0x5ab0e8, 0xc0ecff]), // tears
  r: tones([0x7a1418, 0xd02a26, 0xff7a5e]), // the ticket's stripe, the stamp
  y: tones([0x8a6a10, 0xe0b830, 0xfff0a0]), // the brass plate
};

// ---------------------------------------------------------------- the lectern (32 x 35 -> 96 x 105)
// pose: 0 sniffling, 'ear' a hand cupped to its ear (it hears nothing), 'cry' wailing, 'bang' both fists up,
// 'wave' an arm flung up
export function lectern(pose) {
  const s = new HiSprite(96, 105, RAMPS);
  const cx = 48;
  const cry = pose === 'cry' || pose === 'bang';
  // the microphones fanned out on top, their stems
  for (const [dx, h] of [[-14, 18], [-6, 22], [2, 24], [10, 21], [17, 17]]) {
    s.tube(cx + dx * 0.4, 30, cx + dx, 30 - h, 1.2, 'k', { rb: 1 });
    s.ellipse(cx + dx, 28 - h, 3.2, 4.2, 'k', { bias: 0.1 });
    if (dx === 2) s.paint([cx + dx - 3, 26 - h, cx + dx + 3, 30 - h], (x, y) => y > 28 - h, 'r', () => 0.6); // one with a coloured flag
  }
  // the podium: a slanted top, the body tapering down, the front panel with the face, a brass plate
  s.poly([[cx - 30, 30], [cx + 30, 30], [cx + 34, 40], [cx - 34, 40]], 'o', { flat: 0.75 });
  s.poly([[cx - 30, 40], [cx + 30, 40], [cx + 24, 102], [cx - 24, 102]], 'o', { flat: 0.55 });
  s.shade([cx - 34, 40, cx + 34, 102], (x) => x > cx + 14, -0.15);
  s.poly([[cx - 22, 44], [cx + 22, 44], [cx + 18, 92], [cx - 18, 92]], 'd', { flat: 0.5 });
  s.paint([cx - 10, 84, cx + 10, 89], () => true, 'y', () => 0.7);
  // the face on the panel: eyes squeezed shut, brows up in misery, the mouth (wailing, or a wobbling line)
  for (const sx of [-1, 1]) {
    s.line(cx + sx * 4, 52, cx + sx * 14, 48 + (cry ? 0 : 1), INK, 2); // brows, the inner ends up
    if (pose === 'ear') s.line(cx + sx * 4, 58, cx + sx * 13, 58, 0xf4eee0, 2); // squinting, straining to hear
    else {
      s.line(cx + sx * 4, 57, cx + sx * 9, 60, 0xf4eee0, 2);
      s.line(cx + sx * 9, 60, cx + sx * 14, 57, 0xf4eee0, 2);
    }
    // the tears: streams down the panel (floods when wailing)
    const n = cry ? 3 : 1;
    for (let k = 0; k < n; k++) s.tube(cx + sx * (9 + k * 2), 61, cx + sx * (10 + k * 3), cry ? 92 : 72, 1.4, 't', { rb: 1.8, glow: true });
  }
  if (cry) {
    s.ellipse(cx, 74, 9, 8, 'k', { flat: 0.1 });
    s.paint([cx - 6, 78, cx + 6, 82], (x, y) => ((x - cx) / 6) ** 2 + ((y - 80) / 3) ** 2 < 1, 'r', () => 0.5); // the tongue
  } else for (let x = -7; x <= 7; x++) s.px(cx + x, 73 + Math.round(Math.sin(x * 1.1)), INK);
  // the ear, on its left side
  s.ellipse(cx - 32, 56, 5, 8, 'f', { bias: 0.08 });
  s.line(cx - 32, 52, cx - 31, 60, 0xa86a4a, 1);
  // the gloved hands
  const glove = (x, y, fist = false) => {
    s.ellipse(x, y, 7, 6.5, 'w', { bias: 0.08 });
    if (!fist) for (let k = 0; k < 3; k++) s.ellipse(x - 4 + k * 4, y - 6, 2.2, 3.4, 'w', { bias: 0.1 });
    s.line(x - 5, y + 5, x + 5, y + 5, 0xb8b4aa, 1);
  };
  const arm = (x0, y0, x1, y1) => s.tube(x0, y0, x1, y1, 2.6, 'k', { rb: 2.4 });
  if (pose === 'ear') {
    arm(cx - 26, 64, cx - 42, 54);
    glove(cx - 42, 52); // cupped behind the ear
    arm(cx + 26, 64, cx + 36, 76);
    glove(cx + 36, 78);
  } else if (pose === 'bang') {
    for (const sx of [-1, 1]) {
      arm(cx + sx * 26, 60, cx + sx * 34, 20);
      glove(cx + sx * 34, 18, true);
    }
  } else if (pose === 'wave') {
    arm(cx - 26, 64, cx - 36, 76);
    glove(cx - 36, 78);
    arm(cx + 26, 60, cx + 42, 22);
    glove(cx + 42, 18);
  } else {
    for (const sx of [-1, 1]) {
      arm(cx + sx * 26, 64, cx + sx * 34, 38);
      glove(cx + sx * 34, 36, true); // fists on the desk
    }
  }
  return s.render();
}

/** A train ticket fluttering: 0 flat, 1 edge on; stamped: the red cross of a day no train ran. */
export function ticket(f, stamped = false) {
  const s = new HiSprite(27, 18, RAMPS);
  if (f === 1) s.paint([2, 7, 25, 10], () => true, 'w', () => 0.6);
  else {
    s.paint([2, 2, 25, 15], () => true, 'w', () => 0.75);
    s.paint([2, 2, 25, 5], () => true, 'r', () => 0.55);
    for (let k = 0; k < 3; k++) s.line(5, 8 + k * 2.5, 16 - k * 3, 8 + k * 2.5, 0x5a5864, 1);
    if (stamped) {
      s.line(15, 6, 23, 14, 0xd02a26, 2);
      s.line(23, 6, 15, 14, 0xd02a26, 2);
    }
  }
  return s.render({ outline: 1 });
}

export function mownicaEnemies(add) {
  for (const p of [0, 'ear', 'cry', 'bang', 'wave']) add(`lect_${p}`, lectern(p));
  add('ticket_0', ticket(0));
  add('ticket_1', ticket(1));
  add('ticket_x', ticket(0, true));
}
