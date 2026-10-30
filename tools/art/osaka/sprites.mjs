// Stage 5 (Osaka) sprites: flying takoyaki, pufferfish lanterns, kushikatsu skewers, wrapped candy,
// beckoning maneki-neko, the bunraku puppet with its three black-clad puppeteers, and the octopus boss
// (a takoyaki vendor's headband on, tentacles built from segments), ink bullets and thrown takoyaki.
import { MATERIALS, Mask, renderMask } from '../../lib/spritekit.mjs';

const MAT = {
  ...MATERIALS,
  T: [0x7a4a1e, 0xb8783a, 0xe0a860], // takoyaki batter, fried coating
  O: [0xa02a1a, 0xd8482a, 0xf47a50], // octopus red
  H: [0xb0a8a0, 0xe8e4dc, 0xffffff], // porcelain white (cat, puppet face)
  X: [0x0c0a10, 0x1a1620, 0x2e2a36], // kuroko black
  t: [0x8a6a3a, 0xc8a060, 0xecd08a], // bamboo
};
const render = (m, opts = {}) => renderMask(m, { materials: MAT, ...opts });
const raw = (rows) => renderMask(Mask.fromRows(rows), { outline: false, materials: MAT });
const TAU = Math.PI * 2;

function ell(m, ex, ey, rx, ry, c) {
  for (let y = Math.floor(ey - ry); y <= ey + ry; y++)
    for (let x = Math.floor(ex - rx); x <= ex + rx; x++) if (((x + 0.5 - ex) / rx) ** 2 + ((y + 0.5 - ey) / ry) ** 2 < 1) m.set(x, y, c);
}

export function osakaSprites(add) {
  // ------------------------------------------------------------ popcorn: flying takoyaki with dancing bonito flakes
  const takoyaki = (f) => {
    const m = new Mask(11, 11);
    ell(m, 5.5, 6, 4.6, 4.6, 'T');
    m.line(2, 5, 9, 7, 'w');
    m.line(3, 7, 8, 4, 'N');
    for (const [x, y] of f ? [[4, 2], [7, 1], [6, 3]] : [[3, 1], [6, 2], [8, 2]]) m.set(x, y, 'p');
    m.set(5, 6, 'g');
    return render(m);
  };
  add('takoyaki_0', takoyaki(0));
  add('takoyaki_1', takoyaki(1));

  // ------------------------------------------------------------ shooter: pufferfish paper lantern
  const fugu = (f) => {
    const m = new Mask(19, 19);
    ell(m, 9.5, 10, 7.5, 7, 'Y');
    ell(m, 9.5, 11.5, 6, 4.5, 'H');
    for (const [x, y] of [[6, 7], [12, 7], [9, 5], [5, 11], [13, 11]]) m.set(x, y, 'N');
    for (const s of [-1, 1]) {
      m.line(9 + s * 7, 9, 9 + s * 9, f ? 7 : 11, 'Y');
      m.disc(9.5 + s * 3, 9.5, 1.6, 'k');
      m.set(9 + s * 3, 8, 'w');
    }
    m.rect(8, 15, 3, 2, 'R');
    m.rect(9, 0, 1, 3, 'K');
    m.rect(8, 17, 3, 2, 'R'); // tassel
    return render(m);
  };
  add('fugu_0', fugu(0));
  add('fugu_1', fugu(1));

  // ------------------------------------------------------------ diver: kushikatsu, a breaded skewer diving like a spear
  const kushi = (f) => {
    const m = new Mask(7, 17);
    m.rect(3, 0, 1, 4, 't');
    for (let k = 0; k < 3; k++) ell(m, 3.5, 6 + k * 4, 2.8, 2.2, 'T');
    for (const [x, y] of f ? [[1, 5], [5, 9], [2, 13]] : [[5, 6], [1, 10], [4, 14]]) m.set(x, y, 'y');
    m.rect(3, 15, 1, 2, 't');
    return render(m);
  };
  add('kushi_0', kushi(0));
  add('kushi_1', kushi(1));

  // ------------------------------------------------------------ carrier: wrapped candy (ame), twisted ends
  const ame = (mat, f) => {
    const m = new Mask(19, 11);
    ell(m, 9.5, 5.5, 5, 4.2, mat);
    m.set(8, 3, 'w');
    for (const s of [-1, 1]) {
      const x0 = 9.5 + s * 5;
      m.line(Math.round(x0), 5, Math.round(x0 + s * 4), f ? 2 : 1, 'c');
      m.line(Math.round(x0), 5, Math.round(x0 + s * 4), f ? 8 : 9, 'c');
      m.line(Math.round(x0 + s * 4), f ? 2 : 1, Math.round(x0 + s * 4), f ? 8 : 9, 'c');
    }
    return render(m, { glow: 'c' });
  };
  for (const [col, mat] of [['red', 'R'], ['blue', 'B'], ['green', 'G']]) {
    add(`ame_${col}_0`, ame(mat, 0));
    add(`ame_${col}_1`, ame(mat, 1));
  }

  // ------------------------------------------------------------ turret: maneki-neko; the raised paw beckons before it fires
  {
    const body = new Mask(17, 19);
    ell(body, 8.5, 13, 7, 6, 'H');
    ell(body, 8.5, 6, 6, 5, 'H');
    for (const s of [-1, 1]) {
      m3(body, 8 + s * 5, 1, s);
      body.set(8 + s * 3, 6, 'k');
    }
    body.set(8, 8, 'M');
    body.rect(4, 10, 9, 1, 'R'); // red collar
    body.set(8, 11, 'Y'); // golden bell
    ell(body, 11.5, 15, 2.6, 2, 'Y'); // koban coin
    body.rect(10, 15, 3, 1, 'N');
    for (const [x, y] of [[4, 4], [12, 14], [5, 15]]) body.set(x, y, 'O');
    add('neko_base', render(body));
    for (let f = 0; f < 2; f++) {
      const paw = new Mask(7, 9);
      ell(paw, 3.5, f ? 3 : 5, 2.6, 2.6, 'H');
      paw.rect(2, f ? 5 : 7, 3, f ? 4 : 2, 'H');
      paw.set(3, f ? 2 : 4, 'P');
      add(`neko_paw_${f}`, render(paw));
    }
    const w = new Mask(17, 17);
    for (const [x, y, r] of [[5, 7, 3.4], [11, 6, 2.6], [8, 12, 3.6], [13, 12, 2]]) ell(w, x, y, r, r, 'H');
    w.set(8, 12, 'Y');
    w.set(5, 7, 'k');
    w.rect(3, 10, 4, 1, 'R');
    add('neko_wreck', render(w));
  }
  function m3(m, x, y, s) {
    // pointed ears with pink insides
    m.set(x, y + 1, 'H');
    m.set(x, y + 2, 'H');
    m.set(x - s, y + 2, 'H');
    m.set(x, y + 3, 'P');
  }

  // ------------------------------------------------------------ miniboss: bunraku puppet and the three kuroko
  const ningyo = (pose) => {
    const m = new Mask(39, 47);
    const cx = 19.5;
    // kamishimo: stiff winged shoulders over a red and gold kimono
    for (let y = 16; y < 44; y++) {
      const hw = 6 + (y - 16) * 0.22;
      for (let x = 0; x < 39; x++) if (Math.abs(x + 0.5 - cx) < hw) m.set(x, y, (x + y) % 5 === 0 ? 'Y' : 'R');
    }
    m.rect(5, 16, 29, 4, 'D');
    m.rect(5, 16, 29, 1, 'B');
    m.line(17, 20, 19, 28, 'Y');
    m.line(22, 20, 20, 28, 'Y');
    m.rect(14, 28, 11, 2, 'K'); // obi
    // arms: the right (viewer's left) holds a raised sword in pose 1
    if (pose) {
      m.line(9, 20, 5, 10, 'R');
      m.line(10, 20, 6, 10, 'R');
      m.line(5, 10, 5, 0, 'S');
      m.set(5, 0, 'w');
    } else {
      m.line(9, 20, 6, 30, 'R');
      m.line(10, 20, 7, 30, 'R');
      m.line(6, 30, 6, 40, 'S');
    }
    m.line(29, 20, 33, 28, 'R');
    m.line(30, 20, 34, 28, 'R');
    ell(m, 33.5, 29.5, 2, 2, 'H');
    // the painted head: white face, black topknot, fierce brows and eyes
    ell(m, cx, 9, 6, 6.5, 'H');
    m.rect(14, 2, 12, 3, 'K');
    m.rect(18, 0, 4, 2, 'K');
    m.line(15, 6, 18, 7, 'k');
    m.line(24, 6, 21, 7, 'k');
    m.set(17, 9, 'k');
    m.set(22, 9, 'k');
    m.set(17, 8, 'M');
    m.set(22, 8, 'M');
    m.rect(18, 13, 4, 1, 'm');
    // feet
    m.rect(12, 44, 5, 3, 'K');
    m.rect(23, 44, 5, 3, 'K');
    return render(m);
  };
  add('ningyo_0', ningyo(0));
  add('ningyo_1', ningyo(1));
  const kuroko = (f) => {
    const m = new Mask(13, 21);
    ell(m, 6.5, 4.5, 3.5, 3.8, 'X');
    m.rect(5, 4, 3, 1, 'd'); // the gauze over the eyes
    for (let y = 8; y < 21; y++) {
      const hw = 3 + (y - 8) * 0.22;
      for (let x = 0; x < 13; x++) if (Math.abs(x + 0.5 - 6.5) < hw) m.set(x, y, 'X');
    }
    m.line(2, 10, f ? 0 : 1, 6, 'X');
    m.line(10, 10, f ? 12 : 11, 6, 'X');
    m.set(f ? 0 : 1, 5, 'H');
    m.set(f ? 12 : 11, 5, 'H');
    return render(m);
  };
  add('kuroko_0', kuroko(0));
  add('kuroko_1', kuroko(1));

  // ------------------------------------------------------------ boss: the octopus of Osaka Bay
  const tako = (f) => {
    const W = 61;
    const H = 47;
    const m = new Mask(W, H);
    const cx = 30.5;
    ell(m, cx, 20, 22, 19, 'O');
    for (const [x, y, r] of [[18, 12, 2.4], [40, 10, 2], [28, 6, 1.6], [44, 22, 1.8], [15, 24, 1.6]]) ell(m, x, y, r, r, 'R');
    // twisted towel headband, knotted at the side
    for (let x = 9; x < 52; x++) {
      const y = 15 + Math.round(Math.sin(x * 0.3) * 0.5);
      m.set(x, y, (x >> 1) % 2 ? 'H' : 'm');
      m.set(x, y + 1, (x >> 1) % 2 ? 'm' : 'H');
    }
    m.rect(50, 13, 3, 6, 'H');
    // furious eyes, a pouting siphon
    for (const s of [-1, 1]) {
      ell(m, cx + s * 9, 26, 5, 4.4, 'H');
      ell(m, cx + s * 9, 27, 2.4, 2.4, 'k');
      m.set(Math.round(cx + s * 9 - 1), 26, 'w');
      m.line(Math.round(cx + s * 4), 22, Math.round(cx + s * 14), 19, 'k'); // furious brows
      m.line(Math.round(cx + s * 4), 21, Math.round(cx + s * 14), 18, 'k');
    }
    ell(m, cx, 36, 4, f ? 4 : 3, 'O');
    ell(m, cx, 36.5, 2, f ? 2.4 : 1.4, 'k');
    // the base of the arms
    for (const dx of [-16, -6, 6, 16]) ell(m, cx + dx, 41, 4, 4, 'O');
    return render(m);
  };
  add('tako_0', tako(0));
  add('tako_1', tako(1));
  [5.2, 4.2, 3.2].forEach((r, i) => {
    const s = Math.ceil(r * 2) + 1;
    const m = new Mask(s, s);
    ell(m, s / 2, s / 2, r, r, 'O');
    ell(m, s / 2 + r * 0.25, s / 2, r * 0.4, r * 0.4, 'P'); // a suction cup
    add(`tseg_${i}`, render(m));
  });
  {
    const m = new Mask(7, 7);
    ell(m, 3.5, 3.5, 2.6, 2.6, 'O');
    m.set(4, 2, 'P');
    m.set(5, 4, 'O');
    m.set(6, 5, 'O');
    add('ttip', render(m));
  }
  add('eb_ink', raw(['.www.', 'wnnnw', 'wnxnw', 'wnnnw', '.www.']));
  add('eb_ink_m', raw(['..www..', '.wnnnw.', 'wnnxnnw', 'wnxxxnw', 'wnnxnnw', '.wnnnw.', '..www..']));
  add('tako_ball_0', raw(['.kkk.', 'kTTTk', 'kTwTk', 'kTTTk', '.kkk.']));
  add('tako_ball_1', raw(['..kkk..', '.kTTTk.', 'kTTwTTk', 'kTwTwTk', 'kTTTTTk', '.kTTTk.', '..kkk..']));
}
