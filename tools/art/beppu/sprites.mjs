// Stage 6 (Beppu) sprites: hot-spring eggs that hatch into little oni, a cooking pot with its oni cook,
// macaques, wooden bath buckets, steam nozzles, boiling vents, drifting steam, the Oniyama crocodile
// (surfaced and submerged), the red oni with his spiked kanabō, Setsubun bean boxes, beans and blood.
import { MATERIALS, Mask, renderMask } from '../../lib/spritekit.mjs';
import { Raster, fbm } from '../../lib/raster.mjs';

const MAT = {
  ...MATERIALS,
  O: [0x8a1a14, 0xd8302a, 0xff6a50], // oni red
  H: [0xb0a898, 0xece4d4, 0xfffaf0], // eggshell
  Z: [0x2e4024, 0x48602e, 0x6a8040], // crocodile
  t: [0x8a6a3a, 0xc8a060, 0xecd08a], // light wood
  f: [0x6a4a30, 0x9a6e48, 0xc89a6a], // macaque fur
  z: [0x1e2a16, 0x1e2a16, 0x1e2a16], // crocodile scutes
};
const render = (m, opts = {}) => renderMask(m, { materials: MAT, ...opts });
const raw = (rows) => renderMask(Mask.fromRows(rows), { outline: false, materials: MAT });
const TAU = Math.PI * 2;

function ell(m, ex, ey, rx, ry, c) {
  for (let y = Math.floor(ey - ry); y <= ey + ry; y++)
    for (let x = Math.floor(ex - rx); x <= ex + rx; x++) if (((x + 0.5 - ex) / rx) ** 2 + ((y + 0.5 - ey) / ry) ** 2 < 1) m.set(x, y, c);
}

function cloud(w, h, puffs, alpha, name, add) {
  const r = new Raster(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let best = Infinity;
      for (const [cx, cy, pr] of puffs) best = Math.min(best, Math.hypot(x + 0.5 - cx, y + 0.5 - cy) - pr);
      if (best > 0) continue;
      const n = fbm(x, y, { seed: w + h, scale: 4 });
      r.set(x, y, y > h * 0.6 ? 0xe8e4ec : 0xffffff, alpha * (best > -2 ? 0.5 : 1) * (0.75 + n * 0.5));
    }
  add(name, r);
}

export function beppuSprites(add) {
  // ------------------------------------------------------------ steam: big clouds you fly through, small wisps
  cloud(44, 30, [[12, 17, 10], [24, 12, 11], [34, 17, 9], [22, 20, 10]], 0.7, 'steam_0', add);
  cloud(38, 28, [[11, 15, 9], [21, 11, 10], [29, 16, 8], [19, 19, 9]], 0.7, 'steam_1', add);
  cloud(18, 12, [[6, 7, 5], [11, 5, 5], [13, 8, 4]], 0.5, 'wisp_s_0', add);
  cloud(14, 12, [[5, 7, 4], [9, 5, 4.5]], 0.5, 'wisp_s_1', add);
  // boiling at a vent before it erupts
  for (const [name, a, b] of [['boil', 0xd8f4ff, 0x8ac8e0], ['mudboil', 0xb8b0a4, 0x6e6a64]])
    for (let f = 0; f < 2; f++) {
      const r = new Raster(17, 17);
      for (let k = 0; k < 7; k++) {
        const ang = (k / 7) * TAU + f * 0.5;
        const d = 3 + ((k + f) % 3) * 1.6;
        r.disc(8.5 + Math.cos(ang) * d, 8.5 + Math.sin(ang) * d, 1.4 + ((k + f) % 2) * 0.6, k % 2 ? a : b);
      }
      add(`${name}_${f}`, r);
    }

  // ------------------------------------------------------------ popcorn: hot-spring egg, hatches into a little oni
  for (let f = 0; f < 2; f++) {
    const m = new Mask(9, 11);
    ell(m, 4.5, 5.5, 3.6, 4.6, 'H');
    m.set(3, 3, 'w');
    if (f) {
      m.line(1, 5, 3, 4, 'N');
      m.line(3, 4, 5, 6, 'N');
      m.line(5, 6, 7, 4, 'N');
    }
    add(`tamago_${f}`, render(m));
  }
  for (let f = 0; f < 2; f++) {
    const m = new Mask(11, 12);
    ell(m, 5.5, 6, 3.4, 3.6, 'O');
    m.set(3, 1, 'Y');
    m.set(7, 1, 'Y');
    m.set(3, 2, 'Y');
    m.set(7, 2, 'Y');
    m.set(4, 6, 'y');
    m.set(6, 6, 'y');
    m.rect(4, 8, 3, 1, 'w');
    for (const s of [-1, 1]) m.line(5 + s * 3, 6, 5 + s * 5, f ? 3 : 8, 'O');
    m.rect(4, 9, 3, 2, 'Y');
    add(`imp_${f}`, render(m));
  }

  // ------------------------------------------------------------ shooter: Kamado Jigoku's iron pot with its oni cook
  for (let f = 0; f < 2; f++) {
    const m = new Mask(17, 18);
    ell(m, 8.5, 11, 7.5, 6.5, 'K');
    ell(m, 8.5, 9.5, 5.6, 2.6, 'C');
    m.rect(1, 9, 2, 2, 'K');
    m.rect(14, 9, 2, 2, 'K');
    // the little cook on the rim, stirring with a ladle
    ell(m, 8.5, 4, 2.4, 2.6, 'O');
    m.set(7, 1, 'Y');
    m.set(10, 1, 'Y');
    m.line(10, 5, f ? 13 : 12, f ? 8 : 9, 'N');
    for (const [x, y] of f ? [[5, 1], [12, 0]] : [[4, 0], [13, 1]]) m.set(x, y, 'c');
    add(`kamado_${f}`, render(m, { glow: 'c' }));
  }

  // ------------------------------------------------------------ diver: a Takasakiyama macaque, the thief
  for (let f = 0; f < 2; f++) {
    const m = new Mask(15, 15);
    ell(m, 7.5, 7, 3.6, 4.6, 'f');
    for (const s of [-1, 1]) {
      m.line(7 + s * 3, 5, 7 + s * 6, f ? 2 : 4, 'f');
      m.line(7 + s * 3, 9, 7 + s * 6, f ? 12 : 11, 'f');
    }
    m.rect(7, 0, 1, 3, 'f');
    ell(m, 7.5, 11.5, 2.6, 2.2, 'P'); // the red face
    m.set(6, 11, 'k');
    m.set(8, 11, 'k');
    add(`saru_${f}`, render(m));
  }

  // ------------------------------------------------------------ carrier: wooden bath bucket, a towel on top
  const oke = (mat, f) => {
    const m = new Mask(15, 15);
    ell(m, 7.5, 7.5, 6.5, 6.5, 't');
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU;
      m.set(Math.round(7 + Math.cos(a) * 5.5), Math.round(7 + Math.sin(a) * 5.5), 'N');
    }
    for (let a = 0; a < TAU; a += 0.15) m.set(Math.round(7 + Math.cos(a) * 6.2), Math.round(7 + Math.sin(a) * 6.2), mat);
    m.rect(4, 5, 7, 4, 'w');
    m.rect(4, 6, 7, 1, f ? 'b' : 'c');
    return render(m);
  };
  for (const [col, mat] of [['red', 'R'], ['blue', 'B'], ['green', 'G']]) {
    add(`oke_${col}_0`, oke(mat, 0));
    add(`oke_${col}_1`, oke(mat, 1));
  }

  // ------------------------------------------------------------ turret: a steam nozzle on a stone stand
  {
    const base = new Mask(17, 17);
    ell(base, 8.5, 8.5, 7.5, 7.5, 'E');
    ell(base, 8.5, 8.5, 4.6, 4.6, 'k');
    ell(base, 8.5, 8.5, 3.6, 3.6, 'S');
    for (const [x, y] of [[3, 6], [13, 10], [6, 13], [11, 3]]) base.set(x, y, 'e');
    add('yuzutsu_base', render(base));
    const w = new Mask(17, 17);
    for (const [x, y, r] of [[5, 6, 3], [11, 5, 2.6], [9, 11, 3.4], [4, 12, 2]]) ell(w, x, y, r, r, 'E');
    w.set(9, 11, 'k');
    w.set(12, 12, 'S');
    add('yuzutsu_wreck', render(w));
    const nozzle = new Mask(9, 9);
    ell(nozzle, 4.5, 3.5, 2.2, 2.2, 'S');
    nozzle.rect(4, 4, 1, 4, 'Y');
    nozzle.set(3, 7, 'Y');
    nozzle.set(5, 7, 'Y');
    nozzle.set(4, 8, 'c');
    for (let i = 0; i < 16; i++) add(`nozzle_${i}`, render(nozzle.rotated((i / 16) * TAU, 9)));
  }

  // ------------------------------------------------------------ miniboss: the Oniyama crocodile
  const wani = (open) => {
    const W = 27;
    const H = 66;
    const m = new Mask(W, H);
    const cx = 13.5;
    // tail tapering up behind
    for (let y = 0; y < 24; y++) {
      const hw = 1 + (y / 24) * 5;
      for (let x = 0; x < W; x++) if (Math.abs(x + 0.5 - cx) < hw) m.set(x, y, y % 3 === 0 ? 'z' : 'Z');
    }
    // body with ridged scutes
    ell(m, cx, 34, 8, 13, 'Z');
    for (let y = 24; y < 46; y += 3) for (const dx of [-3, 0, 3]) m.set(Math.round(cx + dx - 0.5), y, 'z');
    // splayed legs with claws
    for (const [lx, ly, ex, ey] of [[6, 27, 1, 23], [21, 27, 26, 23], [6, 41, 1, 46], [21, 41, 26, 46]]) {
      m.line(lx, ly, ex, ey, 'Z');
      m.line(lx, ly + 1, ex, ey + 1, 'Z');
      m.set(ex, ey + (ey < 30 ? -1 : 2), 'w');
    }
    // the head with its long snout; open jaws show a pink mouth and teeth
    const jaw = open ? 6.5 : 4.5;
    for (let y = 46; y < 66; y++) {
      const hw = y < 52 ? 5.5 : jaw - (y - 52) * (open ? 0.2 : 0.15);
      for (let x = 0; x < W; x++) if (Math.abs(x + 0.5 - cx) < hw) m.set(x, y, 'Z');
    }
    if (open) {
      for (let y = 53; y < 64; y++) for (let x = 0; x < W; x++) if (Math.abs(x + 0.5 - cx) < 4.5 - (y - 53) * 0.3) m.set(x, y, 'p');
      for (let y = 54; y < 64; y += 2) {
        m.set(Math.round(cx - 4.5 + (y - 53) * 0.3), y, 'w');
        m.set(Math.round(cx + 3.5 - (y - 53) * 0.3), y, 'w');
      }
    }
    for (const s of [-1, 1]) {
      m.set(Math.round(cx + s * 3 - 0.5), 49, 'y');
      m.set(Math.round(cx + s * 3 - 0.5), 48, 'k');
    }
    m.set(12, 64, 'k');
    m.set(14, 64, 'k');
    return render(m);
  };
  add('wani_0', wani(false));
  add('wani_1', wani(true));
  {
    // submerged: only the eyes and nostrils above the water, ripples around
    const r = new Raster(27, 26);
    for (let a = 0; a < TAU; a += 0.05) {
      r.set(Math.round(13 + Math.cos(a) * 11), Math.round(13 + Math.sin(a) * 9), 0xd8e8e8, 0.6);
      r.set(Math.round(13 + Math.cos(a) * 7), Math.round(13 + Math.sin(a) * 5), 0xd8e8e8, 0.4);
    }
    for (const [x, y, c] of [[10, 10, 0x2e4024], [16, 10, 0x2e4024], [10, 9, 0xf0d040], [16, 9, 0xf0d040], [12, 17, 0x1a1a1a], [14, 17, 0x1a1a1a]]) {
      r.set(x, y, c);
      r.set(x + 1, y, c);
    }
    add('wani_sub', r);
  }

  // ------------------------------------------------------------ boss: the red oni with his spiked kanabō
  const oni = (pose) => {
    const W = 61;
    const H = 66;
    const m = new Mask(W, H);
    const cx = 30.5;
    // tiger-skin loincloth, legs with gold anklets
    for (const s of [-1, 1]) {
      m.rect(Math.round(cx + s * 7 - 3.5), 48, 7, 14, 'O');
      m.rect(Math.round(cx + s * 7 - 3.5), 58, 7, 2, 'Y');
      m.rect(Math.round(cx + s * 7 - 4.5), 62, 9, 3, 'O');
    }
    for (let y = 42; y < 50; y++) for (let x = 0; x < W; x++) if (Math.abs(x + 0.5 - cx) < 13) m.set(x, y, (x + y) % 4 < 2 ? 'Y' : 'K');
    // muscular torso and the gold belt buckle
    ell(m, cx, 34, 14, 12, 'O');
    m.line(Math.round(cx), 26, Math.round(cx), 38, 'M');
    ell(m, cx, 41, 2.6, 2.4, 'Y');
    // the left arm (viewer's right) on the hip, a gold armband
    m.line(44, 27, 50, 38, 'O');
    m.line(45, 27, 51, 38, 'O');
    m.rect(46, 31, 4, 2, 'Y');
    ell(m, 50.5, 40, 3, 3, 'O');
    // the right arm and the kanabō, by pose: 0 at rest upright, 1 raised overhead, 2 smashed down
    const club = (x0, y0, x1, y1) => {
      for (let k = 0; k <= 1; k += 0.02) {
        const x = x0 + (x1 - x0) * k;
        const y = y0 + (y1 - y0) * k;
        const r = 1.6 + k * 1.6;
        ell(m, x, y, r, r, 'K');
      }
      for (let k = 0.3; k <= 1; k += 0.14)
        for (const s of [-1, 1]) {
          const x = x0 + (x1 - x0) * k;
          const y = y0 + (y1 - y0) * k;
          const nx = -(y1 - y0);
          const ny = x1 - x0;
          const l = Math.hypot(nx, ny);
          m.set(Math.round(x + (s * nx * (2 + k * 1.6)) / l), Math.round(y + (s * ny * (2 + k * 1.6)) / l), 'w');
        }
    };
    if (pose === 1) {
      m.line(17, 27, 10, 12, 'O');
      m.line(16, 27, 9, 12, 'O');
      club(10, 12, 26, 0);
    } else if (pose === 2) {
      m.line(17, 27, 12, 40, 'O');
      m.line(16, 27, 11, 40, 'O');
      club(11, 40, 2, 64);
    } else {
      m.line(17, 27, 12, 38, 'O');
      m.line(16, 27, 11, 38, 'O');
      club(11, 40, 6, 4);
    }
    m.rect(13, 31, 4, 2, 'Y');
    // the head: wild black hair, gold horns, glaring eyes, fangs
    for (let k = 0; k < 13; k++) {
      const a = Math.PI * 0.95 + (k / 12) * Math.PI * 1.1;
      m.line(Math.round(cx), 13, Math.round(cx + Math.cos(a) * 13), Math.round(13 + Math.sin(a) * 11), 'K');
    }
    ell(m, cx, 14, 9.5, 9.5, 'O');
    for (const s of [-1, 1]) {
      for (let j = 0; j < 7; j++) {
        m.set(Math.round(cx + s * (5 + j * 0.4) - 0.5), 4 - j, 'Y');
        m.set(Math.round(cx + s * (6 + j * 0.4) - 0.5), 4 - j, 'Y');
      }
      if (pose === 3) m.line(Math.round(cx + s * 2), 12, Math.round(cx + s * 6), 14, 'k');
      else {
        ell(m, cx + s * 4, 13, 2.2, 1.8, 'Y');
        m.set(Math.round(cx + s * 4 - 0.5), 13, 'k');
      }
      m.line(Math.round(cx + s * 1), 10, Math.round(cx + s * 7), 9, 'k');
    }
    m.rect(28, 15, 5, 2, 'M');
    m.rect(25, 19, 11, pose === 3 ? 4 : 3, 'k');
    m.rect(26, 19, 9, 1, 'w');
    m.set(26, 20, 'w');
    m.set(34, 20, 'w');
    return render(m);
  };
  add('oni_0', oni(0));
  add('oni_1', oni(1));
  add('oni_2', oni(2));
  add('oni_hurt', oni(3));

  // ------------------------------------------------------------ Setsubun: a wooden masu of roasted beans, the bean pickup, bean shots
  {
    const masu = new Mask(15, 15);
    masu.rect(1, 1, 13, 13, 't');
    masu.rect(3, 3, 9, 9, 'N');
    for (const [x, y] of [[4, 4], [6, 5], [8, 4], [10, 6], [5, 7], [7, 8], [9, 9], [4, 10], [10, 10]]) masu.set(x, y, 'h');
    add('masu', render(masu));
    const p = new Mask(11, 11);
    p.rect(1, 2, 9, 8, 't');
    p.rect(2, 3, 7, 6, 'N');
    for (const [x, y] of [[3, 4], [5, 5], [7, 4], [4, 7], [6, 7]]) p.set(x, y, 'h');
    p.rect(3, 0, 5, 2, 'R'); // a red ribbon, so it reads as special
    add('pickup_mame', render(p));
  }
  add('ps_bean', raw(['.ty.', 'tyyt', 'tyyt', '.tt.']));
  add('bloodball_0', raw(['.kkk.', 'kMmMk', 'kmhmk', 'kMmMk', '.kkk.']));
  add('bloodball_1', raw(['..kkk..', '.kMMMk.', 'kMmmmMk', 'kMmhmMk', 'kMmmmMk', '.kMMMk.', '..kkk..']));
}
