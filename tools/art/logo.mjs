// The game's logo for the title screen (in the menu's own atlas), and each city's seal for the card at the start of its stage: the
// kanji of its name knocked out of a hanko block, inked unevenly. Seals are drawn white (ink = alpha) and
// tinted by the game in the city's ink, like the stamps; the game shows them at twice the size.
import { Raster, fbm, mix, scaleColor } from '../lib/raster.mjs';
import { KANJI } from './kanji.mjs';
import { hashPx } from './hires.mjs';

const SEALS = { stage1: '京都', stage2: '沖縄', stage3: '札幌', stage4: '鹿児島', stage5: '大阪', stage6: '別府', stage7: '広島', stage8: '長崎' };

/** A seal: a block with a rim, the kanji cut out of it; the ink catches the paper unevenly. */
function seal(text, seed) {
  const n = [...text].length;
  const w = n * 16 + 6;
  const h = 22;
  const r = new Raster(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      // the block, its corners worn round
      const cx = Math.min(x, w - 1 - x);
      const cy = Math.min(y, h - 1 - y);
      if (cx + cy < 1) continue;
      // a cut line inside the rim
      if ((cx === 2 || cy === 2) && cx >= 2 && cy >= 2) continue;
      const ink = fbm(x, y, { seed, scale: 3, octaves: 2 });
      if (ink < 0.2) continue; // speckles where the ink missed
      r.set(x, y, 0xffffff, ink < 0.3 ? 0.7 : 1);
    }
  [...text].forEach((ch, i) => {
    KANJI[ch].forEach((row, y) =>
      [...row].forEach((c, x) => {
        if (c === '#') r.clear(4 + i * 16 + x, 4 + y);
      }),
    );
  });
  return r;
}

// The logo's letters, 2 px strokes on an 11 px x-height (t and the zero rise 3 above it, j and p drop 4
// below; the zero, a digit's height so it reads as one, holds the rising sun).
const L = {
  p: ['######..', '#######.', '##...###', '##....##', '##....##', '##....##', '##....##', '##....##', '##...###', '#######.', '######..', '##......', '##......', '##......', '##......'],
  r: ['##.####', '#######', '###....', '##.....', '##.....', '##.....', '##.....', '##.....', '##.....', '##.....', '##.....'],
  0: ['..#####..', '.#######.', '###...###', '##.....##', '##.sss.##', '##sssss##', '##sssss##', '##sssss##', '##sssss##', '##.sss.##', '##.....##', '###...###', '.#######.', '..#####..'],
  j: ['...##', '...##', '...##', '...##', '...##', '...##', '...##', '...##', '...##', '...##', '...##', '...##', '##.##', '#####', '.###.'],
  e: ['..####..', '.######.', '###..###', '##....##', '########', '########', '##......', '##......', '###...##', '.#######', '..#####.'],
  c: ['..#####.', '.#######', '###...##', '##......', '##......', '##......', '##......', '##......', '###...##', '.#######', '..#####.'],
  t: ['.##...', '.##...', '.##...', '######', '######', '.##...', '.##...', '.##...', '.##...', '.##...', '.##...', '.##...', '.#####', '..####'],
  '-': ['......', '......', '......', '......', '......', '######', '######', '......', '......', '......', '......'],
  n: ['##.####.', '########', '###...##', '##....##', '##....##', '##....##', '##....##', '##....##', '##....##', '##....##', '##....##'],
};
const DOTS = { j: [[3, -3], [4, -3], [3, -2], [4, -2]] }; // the j's dot
const RISE = { t: 3, 0: 3 }; // rows a letter rises above the x-height

/** pr0ject-jpn at 3x: the letters' pixels smoothed (Scale3x), bevelled pearl on a dark outline and a vermilion shadow; the zero a red sun. */
export function logoFine(word = 'pr0ject-jpn') {
  const top = 4; // room for the t and the j's dot
  const gap = 2;
  const glyphs = [...word].map((ch) => ({ ch, rows: L[ch] }));
  const w = glyphs.reduce((s, g) => s + g.rows[0].length + gap, -gap) + 4;
  const h = top + 15 + 4;
  const ink = new Map(); // "x,y" -> 'w' letter | 's' sun
  let x0 = 1;
  for (const { ch, rows } of glyphs) {
    const y0 = top - (RISE[ch] ?? 0);
    rows.forEach((row, y) => [...row].forEach((c, x) => c !== '.' && ink.set(`${x0 + x},${y0 + y}`, c === 's' ? 's' : 'w')));
    for (const [x, y] of DOTS[ch] ?? []) ink.set(`${x0 + x},${top + y}`, 'w');
    x0 += rows[0].length + gap;
  }
  const at = (x, y) => ink.get(`${x},${y}`) ?? '.';
  const S = 3;
  const PAD = 4 * S; // room for the outline and the shadow
  const FW = w * S + PAD * 2;
  const FH = h * S + PAD * 2;
  const fine = new Array(FW * FH).fill('.');
  const put = (X, Y, c) => {
    if (c !== '.') fine[(Y + PAD) * FW + X + PAD] = c;
  };
  for (let y = -1; y <= h; y++)
    for (let x = -1; x <= w; x++) {
      const [A, B, C, D, E, F, G, H, I] = [at(x - 1, y - 1), at(x, y - 1), at(x + 1, y - 1), at(x - 1, y), at(x, y), at(x + 1, y), at(x - 1, y + 1), at(x, y + 1), at(x + 1, y + 1)];
      let e = [E, E, E, E, E, E, E, E, E];
      if (B !== H && D !== F) {
        e = [
          D === B ? D : E,
          (D === B && E !== C) || (B === F && E !== A) ? B : E,
          B === F ? F : E,
          (D === B && E !== G) || (D === H && E !== A) ? D : E,
          E,
          (B === F && E !== I) || (H === F && E !== C) ? F : E,
          D === H ? D : E,
          (D === H && E !== I) || (H === F && E !== G) ? H : E,
          H === F ? F : E,
        ];
      }
      e.forEach((c, k) => put(x * S + (k % 3), y * S + Math.floor(k / 3), c));
    }
  const has = (X, Y) => X >= 0 && Y >= 0 && X < FW && Y < FH && fine[Y * FW + X] !== '.';
  const r = new Raster(FW, FH);
  // the shadow, then the outline, then the letters
  for (let Y = 0; Y < FH; Y++)
    for (let X = 0; X < FW; X++) {
      if (!has(X, Y)) continue;
      for (let j = 0; j <= 6; j++) r.set(X + j, Y + j, j > 4 ? 0x7a1e14 : 0xc8381f);
    }
  for (let Y = 0; Y < FH; Y++)
    for (let X = 0; X < FW; X++) {
      if (!has(X, Y)) continue;
      for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) if (i * i + j * j <= 10) r.set(X + i, Y + j, 0x120e1a);
    }
  const baseY = PAD + top * S;
  for (let Y = 0; Y < FH; Y++)
    for (let X = 0; X < FW; X++) {
      if (!has(X, Y)) continue;
      if (fine[Y * FW + X] === 's') {
        // the sun: hot at the heart, deep red at the edge, a few darker bands across its foot
        const n = (Y - baseY) / (15 * S);
        let c = mix(0xff9a60, 0xd8341a, Math.min(1, Math.abs(n - 0.42) * 2.6));
        if (n > 0.55 && Y % 6 < 2) c = scaleColor(c, 0.82);
        r.set(X, Y, c);
        continue;
      }
      const t = (Y - baseY) / (11 * S);
      let c = t < 0.55 ? mix(0xffffff, 0xf4eef8, t / 0.55) : mix(0xe6dcf0, 0xb4a8cc, (t - 0.55) / 0.6);
      if (!has(X, Y - 1)) c = 0xffffff; // (the bevel: lit from above)
      else if (!has(X, Y + 1)) c = 0x8a7ea8;
      else if (!has(X + 1, Y)) c = scaleColor(c, 0.84);
      else if (!has(X - 1, Y)) c = scaleColor(c, 1.05);
      r.set(X, Y, c);
    }
  return r;
}

/** A city's seal at 6x, its kanji smoothed: white, tinted by the game; shown at (its usual size) / 6. */
export function sealsFine() {
  const K = 6;
  const out = [];
  Object.entries(SEALS).forEach(([id, text], sn) => {
    const chars = [...text];
    const w = chars.length * 16 + 6;
    const h = 22;
    const cut = new Set();
    chars.forEach((ch, i) => KANJI[ch].forEach((row, y) => [...row].forEach((c, x) => c === '#' && cut.add(`${4 + i * 16 + x},${4 + y}`))));
    const at = (x, y) => (cut.has(`${x},${y}`) ? 1 : 0);
    const r = new Raster(w * K, h * K);
    for (let Y = 0; Y < h * K; Y++)
      for (let X = 0; X < w * K; X++) {
        const fx = X / K;
        const fy = Y / K;
        // the block: rounded, worn corners, a cut line inside the rim
        const ex = Math.min(fx, w - fx);
        const ey = Math.min(fy, h - fy);
        const corner = ex < 2 && ey < 2 ? Math.hypot(2 - ex, 2 - ey) : 0;
        if (corner > 2) continue;
        const rim = Math.min(ex, ey);
        if (rim > 2 && rim < 2.9) continue;
        // the cut character: a smooth outline, from a distance to the nearest cut cell's middle
        const cx = Math.floor(fx);
        const cy = Math.floor(fy);
        let hit = at(cx, cy) === 1;
        if (!hit) {
          // bridge the pixels' diagonal steps
          const ix = fx - cx;
          const iy = fy - cy;
          const n = (dx, dy) => at(cx + dx, cy + dy);
          if (ix < 0.34 && iy < 0.34 && n(-1, 0) && n(0, -1)) hit = ix + iy < 0.34;
          if (ix > 0.66 && iy < 0.34 && n(1, 0) && n(0, -1)) hit = 1 - ix + iy < 0.34;
          if (ix < 0.34 && iy > 0.66 && n(-1, 0) && n(0, 1)) hit = ix + 1 - iy < 0.34;
          if (ix > 0.66 && iy > 0.66 && n(1, 0) && n(0, 1)) hit = 2 - ix - iy < 0.34;
        }
        if (hit) continue;
        // the ink catching the paper unevenly
        const ink = fbm(X, Y, { seed: 70 + sn, scale: 14, octaves: 3 });
        const grain = hashPx(X, Y, 71 + sn);
        if (ink < 0.26 && grain < 0.6) continue;
        const edge = Math.min(rim, 2);
        r.set(X, Y, 0xffffff, (ink < 0.34 ? 0.72 : 1) * (edge < 0.2 ? 0.75 : 1) * (grain < 0.04 ? 0.5 : 1));
      }
    out.push({ name: `seal_${id}`, raster: r });
  });
  return out;
}

export function logoSprites() {
  const out = [];
  Object.entries(SEALS).forEach(([id, text], i) => out.push({ name: `seal_${id}`, raster: seal(text, 70 + i) }));
  return out;
}
