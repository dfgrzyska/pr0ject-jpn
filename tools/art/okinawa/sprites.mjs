// Stage 2 (Okinawa) enemy skins: same six archetypes, island look. Plus the twin-shisa boss.
import { Mask, renderMask } from '../../lib/spritekit.mjs';
import { Raster } from '../../lib/raster.mjs';

export function okinawaSprites(add) {
  const fromRows = (rows, mirror, remap) => {
    const m = Mask.fromRows(rows, mirror);
    if (remap) m.remap(remap);
    return m;
  };

  // Near-layer cumulus clouds: solid puffs with a soft half-transparent rim and a shaded underside.
  const cloud = (w, h, puffs, name) => {
    const r = new Raster(w, h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let best = Infinity;
        for (const [cx, cy, pr] of puffs) best = Math.min(best, Math.hypot(x + 0.5 - cx, y + 0.5 - cy) - pr);
        if (best > 0) continue;
        const shade = y > h * 0.62 ? 0xd6e0ea : y > h * 0.45 ? 0xeaf0f6 : 0xffffff;
        r.set(x, y, shade, best > -1.4 ? 0.55 : 1);
      }
    add(name, r);
  };
  cloud(56, 26, [[14, 15, 9], [26, 10, 10], [38, 13, 9], [46, 17, 7], [28, 18, 9]], 'cloud_0');
  cloud(44, 22, [[12, 13, 8], [22, 9, 8.5], [32, 13, 8], [22, 16, 8]], 'cloud_1');

  // Near-layer seagull (two wing positions).
  add('gull_0', renderMask(fromRows(['S.....S', '.W...W.', '..WWW..', '...W...'])));
  add('gull_1', renderMask(fromRows(['.......', 'SWW.WWS', '..WWW..', '...W...'])));

  // Popcorn: tobiuo — robot flying fish with orange fin-wings.
  const TOBIUO_A = ['....S.', '.....S', '.....S', 'Q...SS', 'QQ..SW', 'QQQSSW', '.QQSSW', '..QSSS', '....SS', '....SM', '.....S'];
  const TOBIUO_B = ['....S.', '.....S', '.....S', '....SS', '.Q..SW', '.QQSSW', '..QSSW', '...SSS', '....SS', '....SM', '.....S'];
  add('tobiuo_0', renderMask(fromRows(TOBIUO_A, true)));
  add('tobiuo_1', renderMask(fromRows(TOBIUO_B, true)));

  // Shooter: hārī — dragon racing boat turned gunship (oars sweep between frames).
  const HARI = [
    '.......N',
    '......RR',
    '......RG',
    'N.....RG',
    '.NN..RYG',
    '.....RYG',
    'N....RYG',
    '.NN..RYG',
    'DD...RYG',
    'DD.N.RYG',
    '.....RYG',
    'N....RYG',
    '.NN..RYG',
    '.....RRG',
    '......RR',
    '.....YYY',
    '.....YMY',
    '......YY',
    '.......K',
  ];
  const HARI_B = HARI.map((r) => (r.startsWith('N.') ? `.N${r.slice(2)}` : r.startsWith('.NN') ? `NN.${r.slice(3)}` : r));
  add('hari_0', renderMask(fromRows(HARI, true)));
  add('hari_1', renderMask(fromRows(HARI_B, true)));

  // Diver: habu — banded pit-viper drone coiled in an S, head down.
  const habuFrame = (f) => {
    const m = new Mask(13, 17);
    const phase = f ? Math.PI : 0;
    for (let k = 0; k <= 60; k++) {
      const t = k / 60;
      const x = 6.5 + 3.6 * Math.sin(t * Math.PI * 1.6 + phase) * (1 - t * 0.6);
      m.disc(x, 1 + t * 11, 1.6, Math.floor(t * 12) % 3 === 0 ? 'Y' : 'N');
    }
    // diamond-shaped head, red eyes, forked tongue
    const head = [[5, 12, 'N'], [6, 12, 'N'], [7, 12, 'N'], [4, 13, 'N'], [5, 13, 'M'], [6, 13, 'N'], [7, 13, 'M'], [8, 13, 'N'], [5, 14, 'N'], [6, 14, 'N'], [7, 14, 'N'], [6, 15, 'N'], [6, 16, 'r']];
    for (const [x, y, c] of head) m.set(x, y, c);
    return renderMask(m);
  };
  add('habu_0', habuFrame(0));
  add('habu_1', habuFrame(1));

  // Carrier: Ryukyu-glass float in a rope net with a little rotor, in the three weapon colours.
  const floatFrame = (mat, f) => {
    const m = new Mask(13, 14);
    m.disc(6.5, 8, 5.4, mat);
    for (const x of [4, 9]) for (let y = 3; y <= 13; y++) if (m.get(x, y) === mat) m.set(x, y, 'N');
    for (const y of [6, 10]) for (let x = 1; x < 12; x++) if (m.get(x, y) === mat) m.set(x, y, 'N');
    m.set(4, 5, 'w');
    m.set(5, 4, 'w');
    m.rect(6, 1, 1, 2, 'Y');
    if (f) m.line(2, 0, 10, 0, 'S');
    else m.line(4, 0, 8, 0, 'S');
    return renderMask(m);
  };
  for (const [col, mat] of [['red', 'R'], ['blue', 'B'], ['green', 'G']]) {
    add(`glass_${col}_0`, floatFrame(mat, 0));
    add(`glass_${col}_1`, floatFrame(mat, 1));
  }

  // Turret: coral-limestone bunker; rotating head under a red-tile roof with white mortar.
  const coralBase = (wreck) => {
    const m = new Mask(15, 15);
    m.disc(7.5, 7.5, 7.4, 'E');
    m.disc(7.5, 7.5, 5.2, 'e');
    m.disc(7.5, 7.5, 4.6, 'E');
    for (const [x, y] of [[2, 6], [12, 9], [5, 2], [9, 12], [3, 10], [11, 4]]) m.set(x, y, 'e');
    if (wreck) {
      for (const [x, y] of [[6, 6], [7, 6], [8, 7], [6, 8], [7, 8], [9, 9], [5, 7], [8, 5]]) m.set(x, y, 'n');
      m.set(7, 7, 'k');
      m.set(9, 6, 'Q');
    }
    return renderMask(m);
  };
  add('coral_base', coralBase(false));
  add('coral_wreck', coralBase(true));
  const CORAL_HEAD = fromRows([
    '.............',
    '....RRRRR....',
    '...RRWRWRR...',
    '..RRRWRWRRR..',
    '..WWWWWWWWW..',
    '..RRRWRWRRR..',
    '..RRRWYWRRR..',
    '..RRRWRWRRR..',
    '...RMMMMMR...',
    '....DDDDD....',
    '.....DDD.....',
    '.....DDD.....',
    '.....DDD.....',
  ]);
  for (let i = 0; i < 16; i++) add(`coral_head_${i}`, renderMask(CORAL_HEAD.rotated((i / 16) * Math.PI * 2, 13)));

  // Heavy: robot manta ray, gliding with slow wing beats; glowing cyan seams.
  const MANTA_FRAMES = 4;
  const mantaFrame = (f) => {
    const W = 63;
    const H = 42;
    const cx = 31.5;
    const m = new Mask(W, H);
    const flap = 0.86 + 0.14 * Math.cos((f / MANTA_FRAMES) * Math.PI * 2);
    m.rect(31, 0, 1, 10, 'K'); // tail
    for (let y = 8; y <= 36; y++) {
      const t = (y - 8) / 28;
      const hw = Math.max(2, 29 * flap * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.05)), 0.75) * (t < 0.55 ? 1 : 1 - (t - 0.55) * 0.9));
      for (let x = Math.floor(cx - hw); x <= cx + hw; x++) m.set(x, y, Math.abs(x + 0.5 - cx) > hw - 1.5 ? 'W' : 'D');
    }
    for (const s of [-1, 1]) {
      // cephalic fins
      m.rect(Math.round(cx + s * 5 - 1), 35, 2, 6, 'D');
      m.set(Math.round(cx + s * 5 - (s > 0 ? 0 : 1)), 40, 'W');
      // glowing seams and eyes
      m.line(Math.round(cx + s * 3), 14, Math.round(cx + s * 20 * flap), 23, 'C');
      m.line(Math.round(cx + s * 3), 26, Math.round(cx + s * 14 * flap), 24, 'C');
      m.set(Math.round(cx + s * 8 - (s > 0 ? 0 : 1)), 33, 'M');
    }
    m.rect(29, 37, 5, 1, 'k');
    m.rect(30, 18, 3, 8, 'S');
    m.set(31, 21, 'M');
    return renderMask(m);
  };
  for (let f = 0; f < MANTA_FRAMES; f++) add(`manta_${f}`, mantaFrame(f));

  // Boss: a pair of shisa (lion-dog guardians). "A" (male) roars with an open mouth and keeps a
  // gold ball under a paw; "Un" (female) keeps her mouth shut. Terracotta like the roof tiles.
  const shisaFrame = (open, f) => {
    const W = 43;
    const H = 41;
    const cx = 21.5;
    const m = new Mask(W, H);
    const body = open ? 'R' : 'Q';
    const fur = open ? 'Q' : 'R';
    const curls = [];
    for (let i = 0; i < 15; i++) {
      const a = Math.PI * 0.95 + (i / 14) * Math.PI * 1.1;
      curls.push([cx + Math.cos(a) * 13.5, 17 + Math.sin(a) * 12]);
    }
    for (const [x, y] of curls) m.disc(x, y, 4.2, 'k');
    for (const [x, y] of curls) {
      m.disc(x, y, 3.4, fur);
      // spiral curl: a 3/4 ring of darker fur around a gold centre (turns with the frame)
      for (let a = 0; a < Math.PI * 1.5; a += 0.35) {
        const r = 1.2 + a * 0.4;
        m.set(Math.round(x - 0.5 + Math.cos(a + (f ? 1.2 : 0)) * r), Math.round(y - 0.5 + Math.sin(a + (f ? 1.2 : 0)) * r), 'N');
      }
      m.set(Math.round(x - 0.5), Math.round(y - 0.5), 'Y');
    }
    // body and front legs
    m.disc(cx, 31, 10.5, 'k');
    m.disc(cx, 31, 9.5, fur);
    for (const dx of [-7, 7]) {
      m.rect(Math.round(cx + dx - 3.5), 29, 7, 10, 'k');
      m.rect(Math.round(cx + dx - 2.5), 30, 5, 9, body);
      for (let c = 0; c < 3; c++) m.set(Math.round(cx + dx - 2 + c * 2), 38, 'k');
    }
    if (open) {
      m.disc(cx + 7, 39, 3, 'k');
      m.disc(cx + 7, 39, 2.2, 'Y');
    }
    // ears, head, brows, bulging eyes
    for (const dx of [-9, 9]) {
      m.disc(cx + dx, 7.5, 3.4, 'k');
      m.disc(cx + dx, 7.5, 2.4, body);
    }
    m.disc(cx, 18, 11.2, 'k');
    m.disc(cx, 18, 10.2, body);
    for (const s of [-1, 1]) {
      m.line(Math.round(cx + s * 3), 12, Math.round(cx + s * 9), 11, 'k');
      m.line(Math.round(cx + s * 3), 13, Math.round(cx + s * 9), 12, fur);
      m.disc(cx + s * 6, 16, 3.1, 'k');
      m.disc(cx + s * 6, 16, 2.4, 'W');
      m.set(Math.round(cx + s * 5.4 - 0.5), 16, f ? 'M' : 'k');
      m.set(Math.round(cx + s * 5.4 - 0.5), 17, 'k');
    }
    // big nose
    m.rect(18, 20, 7, 3, 'N');
    m.rect(18, 20, 7, 1, 'Y');
    m.set(19, 22, 'k');
    m.set(23, 22, 'k');
    if (open) {
      m.rect(14, 24, 15, 6, 'k');
      m.rect(15, 24, 13, 1, 'W');
      m.rect(15, 29, 13, 1, 'W');
      for (const x of [15, 27]) m.rect(x, 25, 1, 2, 'W');
      m.rect(18, 27, 7, 2, 'T');
    } else {
      m.rect(14, 25, 15, 3, 'k');
      m.rect(15, 26, 13, 1, 'W');
      for (const x of [16, 20, 24]) m.set(x, 26, 'k');
      m.set(13, 24, 'k');
      m.set(29, 24, 'k');
    }
    return renderMask(m);
  };
  for (let f = 0; f < 2; f++) {
    add(`shisa_a_${f}`, shisaFrame(true, f));
    add(`shisa_un_${f}`, shisaFrame(false, f));
  }
}
