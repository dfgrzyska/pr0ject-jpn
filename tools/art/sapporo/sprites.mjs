// Stage 3 (Sapporo) sprites: winter skins for the archetypes, the snowplough, Yuki-onna (miniboss),
// the ice-sculpture bear and the brown higuma inside it (boss), special bullets and snow particles.
import { MATERIALS, Mask, renderMask } from '../../lib/spritekit.mjs';
import { Raster } from '../../lib/raster.mjs';

const MAT = {
  ...MATERIALS,
  H: [0x8e9ab8, 0xdce4f2, 0xffffff], // snow
  I: [0x3e6e9a, 0x8cc0e0, 0xe0f6ff], // ice
  Z: [0x3a2214, 0x6a4026, 0x946238], // brown bear fur
  X: [0x5e5e6a, 0x9e9ca8, 0xd8d6e0], // grey winter fur (flying squirrel)
  f: [0xa8b2cc, 0xe8eef8, 0xffffff], // Yuki-onna's pale skin
  t: [0x7a5a3a, 0xb08a60, 0xd2ae80], // bear muzzle
  z: [0x24140a, 0x24140a, 0x24140a], // dark fur shadow
};
const render = (m, opts = {}) => renderMask(m, { materials: MAT, ...opts });
const TAU = Math.PI * 2;

/** Rotate a mask a quarter turn so a down-facing sprite faces right. */
function turnRight(m) {
  const out = new Mask(m.h, m.w);
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) out.g[m.w - 1 - x][y] = m.g[y][x];
  return out;
}

export function sapporoSprites(add) {
  const raw = (rows) => renderMask(Mask.fromRows(rows), { outline: false, materials: MAT });

  // ------------------------------------------------------------ near layer: snow
  add('flake_0', raw(['w']));
  add('flake_1', raw(['wc', 'cw']));
  add('flake_2', raw(['.c.', 'cwc', '.c.']));
  add('streak', raw(['w', 'w', 'c', 'c', 'b']));
  add('dust_0', raw(['.c.', 'cwc', '.c.']));
  add('dust_1', raw(['c.c', '.w.', 'c.c']));
  add('shard_0', raw(['wc', 'cb']));
  add('shard_1', raw(['.w', 'wc', 'c.']));
  add('shard_2', raw(['w.', 'cw']));

  // ------------------------------------------------------------ popcorn: shima-enaga (white long-tailed tit)
  const enagaFrame = (f) => {
    const m = new Mask(15, 15);
    // long thin black tail, flared tip
    for (let y = 1; y < 8; y++) m.set(7, y, 'K');
    m.set(6, 0, 'K');
    m.set(8, 0, 'K');
    // broad wings: dark flight feathers, pinkish shoulders
    for (const s of [-1, 1]) {
      const pts = f === 0 ? [[2, 8], [3, 8], [4, 7], [5, 7], [6, 7], [6, 6]] : [[2, 5], [3, 6], [4, 6], [5, 7], [6, 7], [6, 6]];
      for (const [d, y] of pts) {
        m.set(7 + s * (8 - d), y, 'K');
        m.set(7 + s * (8 - d), y + 1, d < 4 ? 'e' : 'K');
      }
      m.set(7 + s * 3, 9, 'p');
    }
    // round snow-white body and head, tiny eyes and beak
    m.disc(7.5, 9.5, 3.1, 'H');
    m.disc(7.5, 12, 2.4, 'H');
    m.set(6, 12, 'k');
    m.set(8, 12, 'k');
    m.set(7, 14, 'k');
    return render(m);
  };
  add('enaga_0', enagaFrame(0));
  add('enaga_1', enagaFrame(1));

  // ------------------------------------------------------------ shooter: ice lantern (candle in a block of ice)
  // Three crack stages x two flame flickers; once the ice breaks, a bare will-o'-the-wisp flame remains.
  const tourouFrame = (crack, f) => {
    const m = new Mask(17, 17);
    m.disc(8.5, 8.5, 7.6, 'I');
    m.disc(8.5, 8.5, 4.4, 'Q');
    m.disc(8.5, 8.5, 2.8, 'o');
    m.disc(8.5, 8.5, f ? 1.6 : 1.1, 'y');
    m.set(8, 8, 'h');
    if (f) m.set(8, 7, 'h');
    const lines = [
      [[2, 5], [6, 8]],
      [[13, 3], [11, 6]],
      [[12, 14], [10, 11]],
      [[3, 12], [5, 10]],
      [[8, 1], [8, 3]],
    ];
    for (let i = 0; i < (crack === 0 ? 0 : crack === 1 ? 2 : 5); i++) {
      const [[x0, y0], [x1, y1]] = lines[i];
      m.line(x0, y0, x1, y1, 'z');
    }
    if (crack === 2) for (const [x, y] of [[1, 6], [2, 4], [15, 10], [14, 13], [6, 16], [10, 0]]) m.set(x, y, '.');
    return render(m);
  };
  for (let c = 0; c < 3; c++) for (let f = 0; f < 2; f++) add(`tourou_${c}_${f}`, tourouFrame(c, f));
  const WISP = [
    ['....o....', '...oo....', '...oyo...', '..oyyo...', '..oyhyo..', '.ooyhyoo.', '.oyyhhyo.', '.oyhhhyo.', '.oyhwhyo.', '..oyhyo..', '...ooo...'],
    ['.....o...', '....oo...', '...oyo...', '...oyyo..', '..oyhyo..', '.ooyhyoo.', '.oyhhyyo.', '.oyhhhyo.', '.oyhwhyo.', '..oyhyo..', '...ooo...'],
  ];
  WISP.forEach((rows, i) => add(`wisp_${i}`, renderMask(Mask.fromRows(rows), { materials: MAT, glow: '' })));

  // ------------------------------------------------------------ turret: yukidaruma (snowman); the head turns,
  // its carrot nose points at the player. Throws snowballs in an arc.
  {
    const m = new Mask(19, 17);
    m.disc(9.5, 8.5, 7, 'H');
    for (const s of [-1, 1]) {
      m.line(9 + s * 7, 8, 9 + s * 9, 5, 'N');
      m.line(9 + s * 8, 6, 9 + s * 9, 8, 'N');
    }
    add('yuki_base', render(m));
    const w = new Mask(19, 17);
    w.disc(7, 10, 4.5, 'H');
    w.disc(12, 9, 3.5, 'H');
    w.disc(9, 13, 3, 'H');
    w.rect(2, 3, 4, 3, 'T');
    w.set(13, 4, 'Q');
    w.set(14, 5, 'Q');
    w.line(15, 10, 18, 12, 'N');
    w.line(1, 12, 3, 15, 'N');
    for (const [x, y] of [[6, 9], [11, 11], [9, 7]]) w.set(x, y, 'k');
    add('yuki_wreck', render(w));
    const head = new Mask(11, 11);
    head.disc(5.5, 5.5, 4, 'H');
    head.disc(5.5, 4.5, 2.7, 'T');
    head.set(5, 9, 'Q');
    head.set(5, 10, 'Q');
    head.set(4, 8, 'k');
    head.set(6, 8, 'k');
    for (let i = 0; i < 16; i++) add(`yuki_head_${i}`, render(head.rotated((i / 16) * TAU, 11)));
  }
  // lobbed snowball (two sizes for the arc), landing marker rings, impact splat
  {
    const s0 = new Mask(5, 5);
    s0.disc(2.5, 2.5, 2.3, 'H');
    add('snowball_0', render(s0));
    const s1 = new Mask(7, 7);
    s1.disc(3.5, 3.5, 3.3, 'H');
    add('snowball_1', render(s1));
    [7, 5.5, 4].forEach((r, i) => {
      const img = new Raster(17, 17);
      for (let a = 0; a < TAU; a += 0.05) {
        const seg = Math.floor((a / TAU) * 12) % 2;
        if (!seg) continue;
        img.set(Math.round(8 + Math.cos(a) * r), Math.round(8 + Math.sin(a) * r), 0xff4ad8);
      }
      img.set(8, 8, 0xff4ad8);
      add(`lob_mark_${i}`, img);
    });
    const sp = new Mask(11, 11);
    sp.disc(5.5, 5.5, 3, 'H');
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU;
      sp.line(5, 5, Math.round(5 + Math.cos(a) * 5), Math.round(5 + Math.sin(a) * 5), 'H');
    }
    add('splat', render(sp));
  }

  // ------------------------------------------------------------ diver: Ezo momonga (flying squirrel), gliding
  const momongaFrame = (f) => {
    const m = new Mask(15, 14);
    m.rect(6, 0, 3, 3, 'X');
    if (f < 2) {
      const span = f ? 5 : 6;
      for (let y = 3; y <= 9; y++) {
        const hw = span - (y === 3 || y === 9 ? 1 : 0);
        for (let x = 7 - hw; x <= 7 + hw; x++) m.set(x, y, Math.abs(x - 7) === hw ? 'e' : 'X');
      }
      for (const [x, y] of [[7 - span, 3], [7 + span, 3], [7 - span, 9], [7 + span, 9]]) m.set(x, y, 'k');
    } else m.disc(7.5, 6.5, 3.6, 'X');
    m.disc(7.5, 10.5, 2.4, 'X');
    m.set(5, 9, 'X');
    m.set(9, 9, 'X');
    m.rect(5, 10, 2, 2, 'k');
    m.rect(8, 10, 2, 2, 'k');
    m.set(5, 10, 'w');
    m.set(8, 10, 'w');
    m.set(7, 12, 'k');
    return render(m);
  };
  for (let f = 0; f < 3; f++) add(`momonga_${f}`, momongaFrame(f));

  // ------------------------------------------------------------ carrier: a bowl of Sapporo miso ramen
  const ramenFrame = (mat, f) => {
    const m = new Mask(15, 16);
    m.disc(7.5, 9.5, 6.4, mat);
    for (let k = 0; k < 16; k += 2) {
      const a = (k / 16) * TAU;
      m.set(Math.round(7 + Math.cos(a) * 5.8), Math.round(9 + Math.sin(a) * 5.8), 'w');
    }
    m.disc(7.5, 9.5, 4.8, 'Q');
    for (const [x, y] of [[6, 8], [7, 9], [8, 8], [9, 9], [6, 11], [8, 12]]) m.set(x, y, 'y');
    m.disc(5, 10, 1.6, 'P');
    for (const [x, y] of [[10, 11], [9, 12], [11, 10]]) m.set(x, y, 'y');
    for (const [x, y] of [[7, 7], [5, 12], [10, 8]]) m.set(x, y, 'g');
    m.rect(8, 10, 2, 2, 'h');
    m.rect(10, 5, 2, 3, 'K');
    const steam = f ? [[5, 1], [6, 0], [9, 2], [10, 1]] : [[6, 2], [5, 1], [9, 1], [10, 0]];
    for (const [x, y] of steam) m.set(x, y, 'c');
    return render(m, { glow: 'c' });
  };
  for (const [col, mat] of [['red', 'R'], ['blue', 'B'], ['green', 'G']]) {
    add(`ramen_${col}_0`, ramenFrame(mat, 0));
    add(`ramen_${col}_1`, ramenFrame(mat, 1));
  }

  // ------------------------------------------------------------ new ground unit: rotary snowplough
  const plowMask = (f, wreck = false) => {
    const m = new Mask(13, 25);
    const body = wreck ? 'K' : 'Q';
    m.rect(1, 0, 11, 12, body);
    m.rect(2, 2, 9, 2, 'K');
    m.set(1, 0, 'm');
    m.set(11, 0, 'm');
    for (const y of [3, 9, 14]) {
      m.rect(0, y, 1, 3, 'K');
      m.rect(12, y, 1, 3, 'K');
    }
    m.rect(1, 12, 11, 6, body);
    m.rect(2, 16, 9, 2, wreck ? 'k' : 'C');
    if (!wreck) m.set(6, 13, f ? 'y' : 'o');
    m.rect(0, 18, 13, 6, 'S');
    for (let x = 0; x < 13; x++) for (const y of [18, 19]) if (!wreck) m.set(x, y, (x + y) % 4 < 2 ? 'Y' : 'K');
    m.rect(1, 22, 11, 2, 'k');
    for (let x = 1; x < 12; x++) if (x % 3 === (f ? 0 : 1)) m.set(x, 22 + (x % 2), 'E');
    if (wreck) for (const [x, y] of [[3, 5], [8, 9], [5, 14], [9, 3]]) m.set(x, y, 'Q');
    return m;
  };
  for (let f = 0; f < 2; f++) {
    add(`plow_d_${f}`, render(plowMask(f)));
    add(`plow_r_${f}`, render(turnRight(plowMask(f))));
  }
  add('plow_wreck', render(plowMask(0, true)));
  {
    const chute = new Mask(9, 9);
    chute.disc(4.5, 3.5, 2.2, 'S');
    chute.rect(4, 4, 1, 4, 'Y');
    chute.set(3, 7, 'Y');
    chute.set(5, 7, 'Y');
    chute.set(4, 8, 'K');
    for (let i = 0; i < 16; i++) add(`plow_chute_${i}`, render(chute.rotated((i / 16) * TAU, 9)));
  }

  // ------------------------------------------------------------ bullets
  add('eb_ice', raw(['..kkk..', '.kkckk.', 'kkcwckk', 'kcwxwck', 'kkcwckk', '.kkckk.', '..kkk..']));
  add('icicle', raw(['kkkkk', 'kccwk', 'kcwck', 'kcwck', '.kck.', '.kwk.', '.kck.', '.kck.', '..k..']));
  {
    const m = new Mask(7, 13);
    for (let y = 2; y <= 11; y++) {
      const hw = 2.6 * Math.sin((Math.PI * (y - 1)) / 11);
      for (let x = 0; x < 7; x++) if (Math.abs(x + 0.5 - 3.5) < hw) m.set(x, y, x === 3 && y > 2 && y < 10 ? 'S' : 'P');
    }
    for (const [x, y] of [[2, 0], [4, 0], [2, 1], [3, 1], [4, 1]]) m.set(x, y, 'S');
    m.set(2, 10, 'k');
    m.set(4, 10, 'k');
    add('salmon', render(m));
  }

  // ------------------------------------------------------------ miniboss: Yuki-onna, the snow woman
  const YUKI_FRAMES = 4;
  const yukiFrame = (f) => {
    const W = 37;
    const H = 48;
    const cx = 18.5;
    const m = new Mask(W, H);
    const sway = Math.sin((f / YUKI_FRAMES) * TAU);
    // long black hair streaming out behind her in the wind, ragged at the ends
    for (let y = 3; y < 38; y++)
      for (const s of [-1, 1]) {
        const reach = 4 + (y - 3) * 0.24 + s * sway * (y - 3) * 0.08;
        for (let x = 0; x < W; x++) {
          const d = (x + 0.5 - cx) * s;
          if (d >= 1 && d < reach && !(y > 30 && (x * 3 + y + f) % 4 === 0)) m.set(x, y, 'K');
        }
      }
    // slender white kimono flaring to the hem
    for (let y = 14; y < H; y++) {
      const hw = 3.6 + (y - 14) * 0.2;
      for (let x = 0; x < W; x++) if (Math.abs(x + 0.5 - cx) < hw) m.set(x, y, 'H');
    }
    // arms spread low, long sleeves hanging under them, swaying
    for (const s of [-1, 1]) {
      const sx = cx + s * 3.5;
      const wx = cx + s * 14;
      for (let x = 0; x < W; x++) {
        const t = ((x + 0.5 - sx) * s) / (14 - 3.5);
        if (t < 0 || t > 1) continue;
        const top = 16 + t * 6;
        const bottom = top + 3 + t * 10 + sway * s * t * 2;
        for (let y = Math.floor(top); y < bottom; y++) m.set(x, y, y >= bottom - 1.2 || t > 0.93 ? 'I' : 'H');
      }
      m.set(Math.round(wx + s), 22, 'f');
      m.set(Math.round(wx + s * 2), 22, 'f');
    }
    // crossed collar, blue obi, snowflake motifs
    m.line(20, 14, 17, 21, 'I');
    m.line(17, 14, 18, 17, 'I');
    for (let x = 0; x < W; x++) for (let y = 23; y < 27; y++) if (m.get(x, y) === 'H' && Math.abs(x + 0.5 - cx) < 6) m.set(x, y, y === 25 ? 'L' : 'B');
    for (const [x, y] of [[8, 26], [28, 27], [15, 33], [22, 37], [11, 29], [25, 24]]) m.set(x, y, 'c');
    // the hem dissolves into drifting snow
    for (let y = 36; y < H; y++)
      for (let x = 0; x < W; x++) {
        const t = (y - 36) / 11;
        if (m.get(x, y) !== '.' && ((x * 7 + y * 3 + f) % 5) / 5 < t) m.set(x, y, '.');
      }
    for (let k = 0; k < 8; k++) m.set(9 + ((k * 5 + f * 3) % 19), 41 + ((k * 3 + f) % 7), 'c');
    // pale face under straight black bangs, cold eyes, blue lips
    m.disc(cx, 7, 5.4, 'K');
    for (let y = 7; y < 14; y++) for (let x = 15; x < 22; x++) if (((x + 0.5 - cx) / 3.3) ** 2 + ((y + 0.5 - 10) / 3.6) ** 2 < 1) m.set(x, y, 'f');
    m.rect(16, 10, 2, 1, 'k');
    m.rect(19, 10, 2, 1, 'k');
    m.set(17, 10, 'c');
    m.set(19, 10, 'c');
    m.set(18, 12, 'b');
    for (const [x, y] of [[3 + f, 4], [33 - f, 7], [1, 30 + f], [35, 34 - f]]) m.set(x, y, 'c');
    return render(m, { glow: 'c' });
  };
  for (let f = 0; f < YUKI_FRAMES; f++) add(`yukionna_${f}`, yukiFrame(f));

  // ------------------------------------------------------------ boss: the bear. Phase 1 is the Snow Festival
  // sculpture (paws and the ice heart are separate, destructible parts); phase 2 the brown higuma inside.
  const W = 64;
  const H = 58;
  const cx = 32;
  const ell = (x, y, ex, ey, rx, ry) => ((x + 0.5 - ex) / rx) ** 2 + ((y + 0.5 - ey) / ry) ** 2 < 1;
  const capsule = (x, y, ax, ay, bx, by, r) => {
    const dx = bx - ax;
    const dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x + 0.5 - ax) * dx + (y + 0.5 - ay) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(x + 0.5 - (ax + dx * t), y + 0.5 - (ay + dy * t)) < r;
  };
  const bearMask = (phase, roar) => {
    const m = new Mask(W, H);
    const fur = phase === 1 ? 'H' : 'Z';
    const light = phase === 1 ? 'H' : 't';
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        let c = null;
        if (ell(x, y, 23, 52, 6.5, 5.5) || ell(x, y, 41, 52, 6.5, 5.5)) c = fur;
        if (ell(x, y, cx, 36, 15, 17)) c = fur;
        for (const s of [-1, 1]) {
          const end = phase === 1 ? [cx + s * 21, 18] : [cx + s * 24, 14];
          if (capsule(x, y, cx + s * 12, 27, end[0], end[1], 4.2)) c = fur;
          if (phase === 2 && ell(x, y, cx + s * 24, 13, 5.2, 5.2)) c = fur;
        }
        if (ell(x, y, cx, 13, 10.5, 10)) c = fur;
        if (ell(x, y, 23, 5, 3.8, 3.8) || ell(x, y, 41, 5, 3.8, 3.8)) c = fur;
        if (c && ell(x, y, cx, 39, 9, 11) && phase === 2) c = 't';
        if (c && ell(x, y, cx, 17.5, 5.2, 3.8)) c = light;
        if (c) m.set(x, y, c);
      }
    for (const ex of [23, 41]) m.disc(ex, 5, 1.6, phase === 1 ? 'I' : 'z');
    if (phase === 1) {
      // carved details in ice: eyes, nose, the cavity for the heart, chisel marks
      m.rect(26, 11, 3, 1, 'I');
      m.rect(36, 11, 3, 1, 'I');
      m.rect(30, 15, 5, 2, 'I');
      m.line(32, 18, 32, 20, 'I');
      m.disc(cx + 0.5, 33.5, 5.5, 'I');
      for (const [x0, y0, x1, y1] of [[22, 40, 26, 46], [42, 40, 38, 46], [20, 30, 23, 36], [44, 30, 41, 36], [cx, 47, cx, 50]]) m.line(x0, y0, x1, y1, 'I');
    } else {
      m.rect(26, 10, 3, 2, 'M');
      m.rect(36, 10, 3, 2, 'M');
      m.rect(30, 15, 5, 2, 'k');
      if (roar) {
        m.disc(cx + 0.5, 21, 3.4, 'k');
        m.rect(31, 21, 3, 2, 'm');
        for (const x of [29, 35]) m.set(x, 19, 'w');
        for (const x of [29, 35]) m.set(x, 23, 'w');
      } else m.rect(29, 20, 7, 1, 'k');
      for (const s of [-1, 1]) for (let k = -1; k <= 1; k++) {
        m.set(cx + s * 24 + k * 2, 8, 'h');
        m.set(cx + s * 24 + k * 2, 7, 'w');
      }
      // fur texture
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (m.get(x, y) === 'Z' && (x * 13 + y * 7) % 11 === 0) m.set(x, y, 'z');
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) m.set(cx + s * (19 - k * 4), 56, 'h');
    }
    return m;
  };
  add('kuma_ice', render(bearMask(1, false)));
  add('kuma_0', render(bearMask(2, false)));
  add('kuma_1', render(bearMask(2, true)));
  {
    const paw = new Mask(15, 15);
    paw.disc(7.5, 8.5, 5.6, 'H');
    for (let k = 0; k < 4; k++) {
      const x = 3 + k * 3;
      paw.set(x, 2, 'I');
      paw.set(x, 1, 'I');
    }
    for (const [x, y] of [[5, 7], [9, 7], [7, 10]]) paw.disc(x + 0.5, y + 0.5, 1.2, 'I');
    add('kuma_paw', render(paw));
    const heart = (f) => {
      const m = new Mask(13, 13);
      m.disc(4, 4.5, 3.4, 'C');
      m.disc(9, 4.5, 3.4, 'C');
      for (let y = 5; y < 12; y++) for (let x = 0; x < 13; x++) if (Math.abs(x + 0.5 - 6.5) < (12 - y) * 0.95) m.set(x, y, 'C');
      m.set(3, 3, 'w');
      m.set(4, 3, 'c');
      if (f) {
        m.disc(6.5, 6.5, 1.6, 'c');
        m.set(6, 6, 'w');
      }
      return render(m);
    };
    add('kuma_heart_0', heart(0));
    add('kuma_heart_1', heart(1));
  }
}
