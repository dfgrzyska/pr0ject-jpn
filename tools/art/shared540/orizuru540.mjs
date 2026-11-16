// ORIZURU: a hull that moves, a paper crane seen from above, drawn at 540 px as folded paper: flat facets, each
// in its own light, creases between them. Its wings beat (three frames: spread, half raised, raised; each level
// and banking), and it folds itself out of a sheet as it flies in (three more: the sheet, the bird base, the
// crane with its wings still shut). As the other ships (ships540.mjs), every frame comes with a neutral white
// one (_g) and a layer for each of its livery's colours (_p0: the paper, _p1: the red tips, _p2: the gold), for
// the paint jobs (src/game/shipSkin.js).
import { HiSprite, tones, inPoly } from '../../lib/hisprite.mjs';

export const ORIZURU = 'ship_orizuru';
const W = 78;
const H = 72;
const CX = W / 2;
const RAMPS = { PW: tones([0x8e8aaa, 0xd8d5e8, 0xffffff]) };
const MATS = ['PW', 'R', 'Y'];
const CREASE = 0x6c6a86;

/**
 * One frame. flap 0..2: the wings spread, half raised, raised (shorter as seen from above, their front facets
 * catching more light); bank -1/1: the wing on that side foreshortened; fold 0..2: the sheet, the bird base, the
 * crane with shut wings; layer: null (the crane in its own colours), 'g' (all in white) or a role's number.
 */
export function crane({ flap = 0, bank = 0, fold = null, layer = null } = {}) {
  const s = new HiSprite(W, H, RAMPS);
  const role = new Int8Array(W * H).fill(-1);
  const one = typeof layer === 'number' ? layer : null;
  /** A facet of paper: a polygon in one light; clip(x, y) keeps a part of it. */
  const facet = (pts, r, v, clip = null) => {
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const test = (x, y) => inPoly(pts, x, y) && (!clip || clip(x, y));
    for (let y = Math.max(0, Math.floor(Math.min(...ys))); y <= Math.min(H - 1, Math.max(...ys)); y++)
      for (let x = Math.max(0, Math.floor(Math.min(...xs))); x <= Math.min(W - 1, Math.max(...xs)); x++) if (test(x + 0.5, y + 0.5)) role[y * W + x] = r;
    if (one != null && r !== one) return;
    s.paint([Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], test, layer != null ? 'W' : MATS[r], () => v, { tex: 0.05, seed: 3 });
  };
  /** A facet in the livery's three colours by `u(x, y)`: paper, a gold band from a, red from b. */
  const striped = (pts, v, u, a, b) => {
    facet(pts, 0, v, (x, y) => u(x, y) < a);
    facet(pts, 2, v, (x, y) => u(x, y) >= a && u(x, y) < b);
    facet(pts, 1, v, (x, y) => u(x, y) >= b);
  };
  /** A crease or a mark, only on the paper that is there (and, in a layer, on that layer's). */
  const mark = (x, y, c, a) => {
    const i = Math.floor(y) * W + Math.floor(x);
    if (x < 0 || y < 0 || x >= W || y >= H || role[i] < 0 || (one != null && role[i] !== one)) return;
    s.px(x, y, c, a);
  };
  const crease = (x0, y0, x1, y1, a = 0.5) => {
    const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2) || 1;
    for (let k = 0; k <= n; k++) mark(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n, CREASE, a);
  };
  /** The washi print on the red: a seed of pale dots. */
  const print = () => {
    for (let y = 1; y < H; y += 3) for (let x = (y % 2) * 2; x < W; x += 4) if (role[y * W + x] === 1) mark(x, y, 0xffe2d8, 0.6);
  };

  if (fold === 0) {
    // the sheet: a square on its corner, its four quarters each in its own light, the corners printed red
    const R = 31;
    const u = (x, y) => Math.abs(x - CX) + Math.abs(y - 36);
    const c = [CX, 36];
    striped([[CX, 36 - R], [CX - R, 36], c], 0.82, u, 23, 25.5);
    striped([[CX, 36 - R], [CX + R, 36], c], 0.64, u, 23, 25.5);
    striped([[CX - R, 36], [CX, 36 + R], c], 0.6, u, 23, 25.5);
    striped([[CX + R, 36], [CX, 36 + R], c], 0.44, u, 23, 25.5);
    crease(CX, 36 - R, CX, 36 + R, 0.55);
    crease(CX - R, 36, CX + R, 36, 0.55);
    crease(CX - R / 2, 36 - R / 2, CX + R / 2, 36 + R / 2, 0.35);
    crease(CX + R / 2, 36 - R / 2, CX - R / 2, 36 + R / 2, 0.35);
    print();
    return s.render({ outline: one != null ? 0 : 2 });
  }
  if (fold === 1) {
    // the bird base: a long kite, its flaps folded in to the spine
    const u = (x, y) => Math.max(14 - y, y - 58) + 20;
    striped([[CX, 4], [CX - 13, 30], [CX, 30]], 0.8, u, 20, 23);
    striped([[CX, 4], [CX + 13, 30], [CX, 30]], 0.56, u, 20, 23);
    striped([[CX - 13, 30], [CX, 68], [CX, 30]], 0.64, u, 20, 23);
    striped([[CX + 13, 30], [CX, 68], [CX, 30]], 0.42, u, 20, 23);
    // (the flaps lying on it: a lighter and a darker wedge along the spine)
    facet([[CX, 12], [CX - 6, 30], [CX, 52]], 0, 0.9, (x, y) => u(x, y) < 20);
    facet([[CX, 12], [CX + 6, 30], [CX, 52]], 0, 0.7, (x, y) => u(x, y) < 20);
    crease(CX, 4, CX, 68, 0.6);
    crease(CX - 13, 30, CX + 13, 30, 0.45);
    crease(CX - 6, 30, CX, 12, 0.4);
    crease(CX + 6, 30, CX, 12, 0.4);
    print();
    return s.render({ outline: one != null ? 0 : 2 });
  }

  // ---- the crane. The wings first (the body lies on them): a front and a rear facet each, a crease between
  const span = fold === 2 ? 13 : [35, 28, 20][flap];
  const tipY = fold === 2 ? 33 : [45, 40, 35][flap];
  const lift = fold === 2 ? 2 : flap;
  for (const side of [-1, 1]) {
    const S = span * (bank === side ? 0.78 : 1);
    const X = (d) => CX + side * d;
    // a broad triangle swept back to its tip, folded along the line from the root to the tip; a pleat at the root
    const A = [X(3), 24];
    const B = [X(3), 47];
    const M = [X(4), 35];
    const T = [X(S), tipY];
    const u = (x) => side * (x - CX);
    const lit = side < 0 ? 0 : -0.2; // (the light comes from the upper left)
    striped([A, T, M], 0.9 + lit + lift * 0.04, u, S * 0.6, S * 0.68);
    striped([M, T, B], 0.56 + lit - lift * 0.05, u, S * 0.6, S * 0.68);
    const K = [X(Math.min(S * 0.5, 13)), (35 + tipY) / 2 - 1];
    facet([A, K, M], 0, 0.72 + lit, (x) => u(x) < S * 0.6);
    facet([M, K, B], 0, 0.66 + lit, (x) => u(x) < S * 0.6);
    crease(M[0], M[1], T[0], T[1], 0.6);
    crease(A[0], A[1], K[0], K[1], 0.4);
    crease(B[0], B[1], K[0], K[1], 0.4);
  }
  // the tail: a long point, its tip red
  const tailU = (x, y) => y;
  striped([[CX, 42], [CX - 5.5, 50], [CX, 69]], 0.74, tailU, 59, 61.5);
  striped([[CX, 42], [CX + 5.5, 50], [CX, 69]], 0.42, tailU, 59, 61.5);
  // the back: a diamond of four facets round its peak
  const P = [CX, 36];
  facet([[CX, 20], [CX - 9, 36], P], 0, 0.84);
  facet([[CX, 20], [CX + 9, 36], P], 0, 0.5);
  facet([[CX - 9, 36], [CX, 52], P], 0, 0.64);
  facet([[CX + 9, 36], [CX, 52], P], 0, 0.34);
  // (a red sun on it, as on a tanchō crane's crown)
  for (const [dx, v] of [[-1, 0.66], [1, 0.48]]) facet([[CX, 32.5], [CX + dx * 3.5, 36.5], [CX, 40.5]], 1, v);
  // the neck, up to the beak; the beak gold
  const neckU = (x, y) => 12 - y;
  facet([[CX, 3], [CX - 3.6, 25], [CX, 29]], 0, 0.8, (x, y) => y >= 10);
  facet([[CX, 3], [CX + 3.6, 25], [CX, 29]], 0, 0.52, (x, y) => y >= 10);
  facet([[CX, 3], [CX - 3.6, 25], [CX, 29]], 2, 0.78, (x, y) => neckU(x, y) > 2);
  facet([[CX, 3], [CX + 3.6, 25], [CX, 29]], 2, 0.5, (x, y) => neckU(x, y) > 2);
  crease(CX, 5, CX, 29, 0.45);
  crease(CX, 21, CX, 51, 0.35);
  crease(CX - 9, 36, CX + 9, 36, 0.4);
  crease(CX, 51, CX, 68, 0.45);
  print();
  // the body's shadow on the wings beside it
  s.shade([CX - 12, 26, CX + 12, 48], (x, y) => role[Math.floor(y) * W + Math.floor(x)] >= 0 && Math.abs(x - CX) > 9 - Math.abs(y - 36) * 0.56 && Math.abs(x - CX) < 12.5 - Math.abs(y - 36) * 0.56, -0.14);
  return s.render({ outline: one != null ? 0 : 2 });
}

/** Every frame of the hull: [suffix, what to draw]. */
export const ORIZURU_FRAMES = [
  ...[0, 1, 2].flatMap((flap) => [['', 0], ['_l', -1], ['_r', 1]].map(([b, bank]) => [`${flap ? `_f${flap}` : ''}${b}`, { flap, bank }])),
  ...[0, 1, 2].map((fold) => [`_o${fold}`, { fold }]),
];

export function orizuru540(add) {
  for (const [suffix, opts] of ORIZURU_FRAMES) {
    const name = `${ORIZURU}${suffix}`;
    add(name, crane(opts));
    add(`${name}_g`, crane({ ...opts, layer: 'g' }));
    for (let i = 0; i < MATS.length; i++) add(`${name}_p${i}`, crane({ ...opts, layer: i }));
  }
}
