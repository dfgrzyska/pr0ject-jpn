// Stage 4 (Kagoshima) sprites: lava bombs that split, a tanegashima matchlock drone, black-vinegar jars
// that lift their lids, kappa (garappa) surfacing from ripples, melting shirokuma, Raijū the thunder
// beast, Sakurajima's vents and summit crater, lava bullets, embers and ash.
import { MATERIALS, Mask, renderMask } from '../../lib/spritekit.mjs';
import { Raster } from '../../lib/raster.mjs';

const MAT = {
  ...MATERIALS,
  H: [0xa8b0c0, 0xe8ecf4, 0xffffff], // shaved ice
  X: [0x14100e, 0x2a2220, 0x4a3e3a], // lava crust / black glaze
  Z: [0x2a5a26, 0x3e7e34, 0x6aaa4a], // kappa green
  t: [0xb08a3a, 0xd8b060, 0xf4dc98], // straw / wood light
  f: [0xff5a10, 0xff9a20, 0xffe070], // molten lava
  e: [0x3a3634, 0x5a5452, 0x7a7270], // cooled rock
};
const render = (m, opts = {}) => renderMask(m, { materials: MAT, ...opts });
const raw = (rows) => renderMask(Mask.fromRows(rows), { outline: false, materials: MAT });
const TAU = Math.PI * 2;

function ell(m, ex, ey, rx, ry, c) {
  for (let y = Math.floor(ey - ry); y <= ey + ry; y++)
    for (let x = Math.floor(ex - rx); x <= ex + rx; x++) if (((x + 0.5 - ex) / rx) ** 2 + ((y + 0.5 - ey) / ry) ** 2 < 1) m.set(x, y, c);
}

export function kagoshimaSprites(add) {
  // ------------------------------------------------------------ near layer: ash and embers
  add('ashf_0', raw(['e']));
  add('ashf_1', raw(['ee']));
  add('ashf_2', raw(['.e', 'ee']));
  add('ember_0', raw(['o']));
  add('ember_1', raw(['y', 'o']));

  // ------------------------------------------------------------ popcorn: volcanic bombs (big ones split in two)
  const bomb = (r, f) => {
    const s = Math.ceil(r * 2) + 1;
    const m = new Mask(s, s);
    ell(m, s / 2, s / 2, r, r, 'X');
    // glowing cracks, rotating between frames
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * TAU + f * 0.9;
      m.line(Math.round(s / 2), Math.round(s / 2), Math.round(s / 2 + Math.cos(a) * r * 0.9), Math.round(s / 2 + Math.sin(a) * r * 0.9), 'f');
    }
    m.set(Math.floor(s / 2), Math.floor(s / 2), 'y');
    return render(m, { glow: 'f' });
  };
  add('kazan_0', bomb(5, 0));
  add('kazan_1', bomb(5, 1));
  add('kazan_s_0', bomb(2.8, 0));
  add('kazan_s_1', bomb(2.8, 1));

  // ------------------------------------------------------------ shooter: drone carrying a tanegashima matchlock
  const teppo = (f) => {
    const m = new Mask(15, 19);
    for (const [x, y] of [[2, 3], [12, 3], [2, 11], [12, 11]]) {
      ell(m, x + 0.5, y + 0.5, 2.2, 2.2, 'S');
      m.set(x, y, f ? 'k' : 'e');
    }
    ell(m, 7.5, 7.5, 4.5, 4.5, 'K');
    m.rect(6, 6, 3, 3, 'R');
    // the gun: wooden stock up top, iron barrel pointing down at the player
    m.rect(6, 0, 3, 6, 'N');
    m.rect(7, 8, 1, 10, 'S');
    m.set(7, 18, 'k');
    m.set(6, 5, 'Y');
    // the smouldering slow match
    m.set(9, 4, 'M');
    m.set(10, f ? 2 : 3, 'e');
    return render(m);
  };
  add('teppo_0', teppo(0));
  add('teppo_1', teppo(1));

  // ------------------------------------------------------------ turret: black-vinegar jar (kurozu tsubo)
  {
    const base = new Mask(17, 17);
    ell(base, 8.5, 8.5, 7.5, 7.5, 'X');
    ell(base, 8.5, 8.5, 4.2, 4.2, 'k');
    ell(base, 8.5, 8.5, 3.4, 3.4, 'n');
    base.set(6, 8, 'y');
    base.set(10, 8, 'y');
    base.set(4, 4, 'e');
    base.set(5, 3, 'e');
    add('tsubo_base', render(base));
    const lid = (open) => {
      const m = new Mask(13, 13);
      const ox = open ? 3.5 : 6.5;
      const oy = open ? 3.5 : 6.5;
      ell(m, ox, oy, 4.6, 4.6, 't');
      ell(m, ox, oy, 1.6, 1.6, 'N');
      return render(m);
    };
    add('tsubo_lid_0', lid(false));
    add('tsubo_lid_1', lid(true));
    const w = new Mask(17, 17);
    for (const [x, y, r] of [[5, 6, 3], [11, 5, 2.5], [9, 11, 3.2], [4, 12, 2]]) ell(w, x, y, r, r, 'X');
    for (const [x, y] of [[7, 8], [8, 9], [10, 8], [6, 10], [12, 11]]) w.set(x, y, 'n');
    w.set(13, 2, 't');
    w.set(14, 3, 't');
    add('tsubo_wreck', render(w));
  }

  // ------------------------------------------------------------ diver: kappa (garappa) and its ripples
  const kappa = (f) => {
    const m = new Mask(15, 17);
    for (const [x, y, dx] of [[2, 5, -1], [12, 5, 1], [3, 12, -1], [11, 12, 1]]) {
      m.line(7, y, x + (f ? dx : 0), y + (f ? -1 : 1), 'Z');
      m.set(x + (f ? dx : 0), y + (f ? -1 : 1), 'G');
    }
    ell(m, 7.5, 8.5, 4.5, 5.5, 'N');
    for (const [x, y] of [[6, 6], [8, 6], [7, 9], [6, 11], [8, 11]]) m.set(x, y, 'X');
    ell(m, 7.5, 13.5, 3, 2.6, 'Z');
    ell(m, 7.5, 13, 1.6, 1.4, 'c');
    m.set(7, 16, 'Y');
    m.set(6, 15, 'k');
    m.set(8, 15, 'k');
    return render(m);
  };
  add('kappa_0', kappa(0));
  add('kappa_1', kappa(1));
  [4, 6, 8].forEach((r, i) => {
    const img = new Raster(19, 13);
    for (let a = 0; a < TAU; a += 0.04) img.set(Math.round(9 + Math.cos(a) * r), Math.round(6 + Math.sin(a) * r * 0.55), 0xc8dce0, 0.8 - i * 0.2);
    for (let a = 0; a < TAU; a += 0.06) img.set(Math.round(9 + Math.cos(a) * r * 0.5), Math.round(6 + Math.sin(a) * r * 0.3), 0xe8f4f4, 0.6 - i * 0.15);
    add(`ripple_${i}`, img);
  });
  {
    const m = new Mask(13, 13);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU;
      m.line(6, 6, Math.round(6 + Math.cos(a) * 6), Math.round(6 + Math.sin(a) * 6), k % 2 ? 'c' : 'w');
    }
    add('splash', render(m, { glow: 'cw' }));
  }

  // ------------------------------------------------------------ carrier: shirokuma (shaved ice with a bear face), melting
  const shirokuma = (mat, melt) => {
    const m = new Mask(17, 17);
    // milk puddle spreading as it melts
    if (melt) ell(m, 8.5, 9.5, 6 + melt * 1.5, 5 + melt * 1.2, 'h');
    const r = 6.5 - melt * 1.6;
    ell(m, 8.5, 8.5, r, r, 'H');
    if (melt < 2) {
      ell(m, 8.5 - r * 0.7, 8.5 - r * 0.7, 1.6, 1.6, 'Q'); // mandarin ears
      ell(m, 8.5 + r * 0.7, 8.5 - r * 0.7, 1.6, 1.6, 'Q');
    }
    m.set(7 - (melt ? 0 : 1), 7, 'k');
    m.set(10 + (melt ? 0 : 1) - 1, 7, 'k');
    ell(m, 8.5, 9.5, 1.4, 1.4, mat); // the cherry nose shows the weapon colour
    m.set(8, 11 + (melt ? 0 : 1), 'N');
    return render(m);
  };
  for (const [col, mat] of [['red', 'R'], ['blue', 'B'], ['green', 'G']]) for (let k = 0; k < 3; k++) add(`shirokuma_${col}_${k}`, shirokuma(mat, k));

  // ------------------------------------------------------------ miniboss: Raijū, the thunder beast
  const RAIJU_FRAMES = 4;
  const raiju = (f) => {
    // front view, facing the player like the other bosses
    const W = 49;
    const H = 46;
    const m = new Mask(W, H);
    const cx = 24.5;
    // zigzag lightning tail rising behind one shoulder
    let tx = cx + 11;
    for (let y = 30; y >= 0; y--) {
      tx += (Math.floor((y + f * 2) / 4) % 2 ? 1 : -1) * 1.3 + 0.25;
      for (let d = -1; d <= 1; d++) m.set(Math.round(tx) + d, y, d ? 'Y' : 'y');
    }
    // mane: lightning spikes radiating all round the head
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * TAU + f * 0.2;
      const len = 13 + ((k + f) % 3) * 2;
      let px = cx;
      let py = 21;
      for (let j = 0; j < len; j++) {
        px += Math.cos(a) + (j % 3 === 1 ? Math.cos(a + 1.6) * 0.8 : 0);
        py += Math.sin(a) * 0.9;
        m.set(Math.round(px), Math.round(py), j > len - 3 ? 'y' : 'Y');
      }
    }
    // shoulders and two front legs with white claws
    ell(m, cx, 34, 14, 7.5, 'B');
    for (const s of [-1, 1]) {
      m.rect(Math.round(cx + s * 8 - 2.5), 34, 5, 9 + (f % 2), 'B');
      for (const d of [-2, 0, 2]) m.set(Math.round(cx + s * 8 + d - 0.5), 43 + (f % 2), 'w');
    }
    // the head: pointed ears, slanted glowing eyes, a pale snout and bared fangs
    for (const s of [-1, 1])
      for (let j = 0; j < 7; j++) for (let k = 0; k <= Math.floor(j * 0.5); k++) m.set(Math.round(cx + s * (7 + k) - 0.5), 13 - (6 - j) + 2, 'B');
    ell(m, cx, 21, 10, 9, 'B');
    ell(m, cx, 26, 4.6, 3.6, 'C');
    for (const s of [-1, 1]) {
      m.set(Math.round(cx + s * 4 - 0.5), 19, 'y');
      m.set(Math.round(cx + s * 5 - 0.5), 18, 'y');
      m.set(Math.round(cx + s * 3 - 0.5), 20, 'y');
    }
    m.rect(23, 24, 3, 1, 'k');
    m.rect(21, 28, 7, 1, 'k');
    m.set(22, 29, 'w');
    m.set(26, 29, 'w');
    // stray sparks
    for (let k = 0; k < 6; k++) m.set((k * 13 + f * 7) % W, (k * 7 + f * 5) % H, 'c');
    return render(m, { glow: 'yc' });
  };
  for (let f = 0; f < RAIJU_FRAMES; f++) add(`raiju_${f}`, raiju(f));
  add('orb_0', raw(['.kkk.', 'kcwck', 'kwwwk', 'kcwck', '.kkk.']));
  add('orb_1', raw(['.kck.', 'kwwwk', 'cwwwc', 'kwwwk', '.kck.']));

  // ------------------------------------------------------------ boss: Sakurajima's side vents and summit crater
  const vent = (f, dead) => {
    const m = new Mask(21, 21);
    ell(m, 10.5, 10.5, 10, 10, 'e');
    ell(m, 10.5, 10.5, 6.5, 6.5, dead ? 'X' : 'f');
    if (!dead)
      for (const [x, y] of f ? [[8, 9], [12, 11], [10, 13]] : [[11, 8], [8, 12], [13, 10]]) {
        m.set(x, y, 'y');
        m.set(x + 1, y, 'o');
      }
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * TAU;
      m.set(Math.round(10 + Math.cos(a) * 8.5), Math.round(10 + Math.sin(a) * 8.5), 'X');
    }
    return render(m, { glow: dead ? '' : 'f' });
  };
  add('vent_0', vent(0, false));
  add('vent_1', vent(1, false));
  add('vent_dead', vent(0, true));
  const crater = (state, f) => {
    const m = new Mask(45, 33);
    ell(m, 22.5, 16.5, 22, 16, 'e');
    ell(m, 22.5, 16.5, 17, 12, state === 'open' ? 'f' : state === 'cold' ? 'X' : 'X');
    if (state === 'shut')
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * TAU + 0.3;
        m.line(22, 16, Math.round(22 + Math.cos(a) * 15), Math.round(16 + Math.sin(a) * 10), 'f');
      }
    if (state === 'open') {
      ell(m, 22.5, 16.5, 8, 5.5, 'y');
      for (const [x, y] of f ? [[14, 12], [30, 20], [25, 9], [17, 21]] : [[16, 18], [28, 12], [20, 10], [31, 17]]) {
        ell(m, x + 0.5, y + 0.5, 1.6, 1.6, 'o');
        m.set(x, y, 'h');
      }
    }
    if (state === 'cold') for (const [x, y] of [[18, 12], [26, 18], [22, 15]]) m.set(x, y, 'e');
    return render(m, { glow: 'fyoh' });
  };
  add('crater_shut', crater('shut', 0));
  add('crater_0', crater('open', 0));
  add('crater_1', crater('open', 1));
  add('crater_cold', crater('cold', 0));
  // lava bullets
  add('lavaball_0', raw(['.kkk.', 'kfyfk', 'kyhyk', 'kfyfk', '.kkk.']));
  add('lavaball_1', raw(['..kkk..', '.kfffk.', 'kfyyyfk', 'kfyhyfk', 'kfyyyfk', '.kfffk.', '..kkk..']));
  add('eb_lava', raw(['.kkk.', 'kofok', 'kfhfk', 'kofok', '.kkk.']));
}
