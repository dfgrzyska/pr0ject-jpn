// Bise under its fukugi: sand lanes winding between tight rows of trees, every homestead inside its own windbreak with a coral wall,
// a hinpun screen behind the gate, a red-tile house with a shisa on the ridge, an annex, a kitchen garden; the old banyan at the
// crossing where the elders play sanshin, a soba shop, a bicycle hire, the water-buffalo cart plodding up the main lane.
import { S, hashPx, scaleColor, rampColor, rng, fbm, mix } from '../nagasaki/canvas.mjs';
import { W, VILLAGE, isLand } from './geo.mjs';
import { C } from './common.mjs';

const lanePaint = (k, seed) => (X, Yy) => rampColor(C.lane, 0.45 + hashPx(X >> 2, Yy >> 2, seed) * 0.3 + hashPx(X, Yy, seed + 1) * 0.18, X, Yy);

export function paintBise(k) {
  const { img, Y, kit, objects } = k;
  const { plant, house, wall, flat } = k.t;
  const br = rng(2201);
  const [v0, v1] = VILLAGE;
  const laneX = [(u) => 44 + 5 * Math.sin(u / 70 + 1), () => 90, (u) => 136 + 5 * Math.sin(u / 85 + 3)];
  const halfW = [3, 4, 3];
  const across = [];
  for (let u = v0 + 2; u < v1 - 20; u += 46 + Math.floor(br() * 40)) {
    const a = br() < 0.4 ? -1 : Math.floor(br() * 2);
    const b = Math.min(3, a + 1 + Math.floor(br() * 3));
    across.push([u, a, b]);
  }
  across.push([v1 - 4, -1, 3]);
  const xOf = (i, u) => (i < 0 ? -6 : i > 2 ? W + 6 : laneX[i](u));
  const paint = lanePaint(k, 52);
  for (let i = 0; i < 3; i++) {
    const pts = [];
    for (let u = v0; u <= v1; u += 10) pts.push([laneX[i](u), u]);
    for (let q = 0; q < pts.length - 1; q += 12) k.road(pts.slice(q, q + 14), halfW[i], { side: 0, kerb: C.lane[0], paint, piece: true });
  }
  for (const [u, a, b] of across) k.road([[xOf(a, u), u], [xOf(b, u), u]], 3, { side: 0, kerb: C.lane[0], paint, piece: true });
  // the crossings' kerbs cleared: where lanes meet they run into one another
  for (let i = 0; i < 3; i++)
    for (const [u, a, b] of across) {
      if (a >= i + 1 || b <= i) continue;
      const cx = laneX[i](u);
      img.fine(cx - halfW[i] - 1, Y(u + 2.4), halfW[i] * 2 + 2, 4.8, paint);
    }
  // leaf litter and shade dappling the lanes
  for (let q = 0; q < 900; q++) {
    const i = q % 3;
    const u = v0 + br() * (v1 - v0);
    const X = (laneX[i](u) + (br() - 0.5) * halfW[i] * 2) * S;
    const Yy = Y(u) * S;
    if (br() < 0.5) img.rectPx(X, Yy, 2, 1, br() < 0.5 ? 0x8a7a48 : 0xa89858);
    else for (let j = -3; j <= 3; j++) for (let t = -6; t <= 6; t++) if (t * t + j * j * 4 < 36 && (t + j) % 2 === 0) img.tintPx(X + t, Yy + j, 0.9);
  }
  const fukugi = (x, y) => {
    if (k.isRes(x, y) || !isLand(x, 7168 - y)) return;
    k.tree(x + (br() - 0.5) * 1.2, y + (br() - 0.5) * 1.2, 3.7 + br() * 1.2, undefined ?? [0x0f2a1a, 0x1a4428, 0x2a6234, 0x4a8a44], Math.floor(br() * 1e8), 'fukugi');
  };
  const row = (ax, ay, bx, by) => {
    const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / 5.5));
    for (let i = 0; i <= n; i++) fukugi(ax + ((bx - ax) * i) / n, ay + ((by - ay) * i) / n);
  };
  const anyPad = (x0, y0, x1, y1) => k.pads.some((p) => p.x + 13 > x0 && p.x - 13 < x1 && Y(p.u) + 13 > y0 && Y(p.u) - 13 < y1);
  /** A homestead in (x0..x1, top..bot): its fukugi ring, wall, gate and hinpun, house, annex, garden. */
  const homestead = (x0, x1, top, bot) => {
    row(x0 + 2, top + 2, x1 - 2, top + 2);
    row(x0 + 2, bot - 2, x1 - 2, bot - 2);
    row(x0 + 2, top + 7, x0 + 2, bot - 7);
    row(x1 - 2, top + 7, x1 - 2, bot - 7);
    const wx0 = x0 + 6;
    const wx1 = x1 - 6;
    const wt = top + 6;
    const wb = bot - 6;
    if (wx1 - wx0 < 16 || wb - wt < 18 || anyPad(x0, top, x1, bot)) return;
    const r = br();
    if (r < 0.12) {
      // a field: rows of vegetables or a patch of cane, no house
      const across2 = br() < 0.5;
      img.fine(wx0, wt, wx1 - wx0, wb - wt, (X, Yy) => {
        const q = (across2 ? Yy : X) % 9;
        if (q < 3) return rampColor(C.redEarth, 0.3 + hashPx(X >> 1, Yy >> 1, 2202) * 0.4, X, Yy);
        return r < 0.06 ? C.cane[(X + Yy) % 3] : hashPx(X >> 1, Yy >> 1, 2203) < 0.6 ? C.grass[2] : C.grass[1];
      });
      k.reserve(wx0, wt, wx1 - wx0, wb - wt);
      if (br() < 0.5) k.standing(wx0 + 2, wt + 2, wx1 - wx0 - 4, wb - wt - 4, 2, Math.floor(wx0 + wt), [0x3a3a4a, 0x5a7ab0]);
      return;
    }
    img.fine(wx0 + 1, wt + 1, wx1 - wx0 - 1, wb - wt - 1, (X, Yy, x, y) => k.lawnPx(X, Yy, 0.25 + fbm(x, y, { seed: 51, scale: 5 }) * 0.6, C.grass, true));
    const gateUp = br() < 0.5;
    const gx = Math.round((wx0 + wx1) / 2 + (br() - 0.5) * (wx1 - wx0 - 10));
    const gy = gateUp ? wt : wb;
    const fy = gateUp ? wb : wt;
    wall([[gx + 3, gy], [wx1, gy], [wx1, fy], [wx0, fy], [wx0, gy], [gx - 3, gy]]);
    const hinpun = gateUp ? wt + 4 : wb - 4;
    wall([[gx - 4, hinpun], [gx + 4, hinpun]]); // the free-standing screen: spirits only go straight
    // a little path of coral gravel from the gate
    img.fine(gx - 1, Math.min(gy, hinpun), 2, Math.abs(gy - hinpun), (X, Yy) => (hashPx(X, Yy, 2204) < 0.5 ? C.coral[3] : C.coral[2]));
    const hw = Math.min(wx1 - wx0 - 4, 15 + Math.floor(br() * 7));
    const hh = 10 + Math.floor(br() * 3);
    const hx = wx0 + 2 + Math.floor(br() * Math.max(1, wx1 - wx0 - hw - 3));
    const hy = gateUp ? wb - hh - 5 : Math.max(wt + 3, hinpun - hh - 9);
    if (gateUp ? hy > hinpun + 2 : hy + hh + 3 < hinpun - 1) house(hx, hy, hw, hh);
    const aw = 8 + Math.floor(br() * 3);
    const ax = hx + hw + 2 + aw <= wx1 - 1 ? hx + hw + 2 : hx - aw - 2 >= wx0 + 1 ? hx - aw - 2 : null;
    if (ax !== null && br() < 0.8) house(ax, hy + 2, aw, 7, { faceH: 2, shisa: false });
    else if (br() < 0.5) {
      // or the water tank on its stand, the washing pole with the wash out
      const X = (wx1 - 5) * S;
      const Yy = (wt + 4) * S;
      img.discPx(X, Yy, 5, 0x18181e);
      img.discPx(X - 1, Yy - 1, 2.6, 0x4a4a56);
      for (let i = 0; i < 24; i++) img.px(X - 34 + i, Yy + 9, 0x6a6a70);
      for (let q = 0; q < 5; q++) for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) img.px(X - 32 + q * 5 + i, Yy + 10 + j, [0xf0f0e8, 0x3a6ad0, 0xe86a9a, 0xf0d040, 0xf0f0e8][q]);
    }
    const gy2 = gateUp ? wt + 2 : wb - 3;
    if (br() < 0.7) plant('hibiscus', gateUp ? wx0 + 4 : wx1 - 4, gy2 + (gateUp ? 2 : -2), 2.8 + br(), Math.floor(br() * 1e8));
    if (br() < 0.6) plant('banana', gateUp ? wx1 - 5 : wx0 + 5, gy2 + (gateUp ? 3 : -3), 3.2 + br(), Math.floor(br() * 1e8));
    // a herb bed or a row of goya on its trellis
    if (wb - wt > 26 && br() < 0.7) {
      const X0 = (wx0 + 3) * S;
      const Yy = (gateUp ? wb - 5 : wt + 2) * S;
      for (let j = 0; j < 9; j++) for (let i = 0; i < 36; i++) img.px(X0 + i, Yy + j, i % 9 === 0 ? 0x4a3a2a : hashPx(i >> 1, j >> 1, 2205) < 0.6 ? 0x3e7232 : hashPx(i, j, 2206) < 0.1 ? 0xe8e080 : 0x5e9040);
    }
  };
  for (let c = 0; c < 4; c++) {
    const lanesHere = across.filter(([, a, b]) => a < c && b >= c).map(([u]) => u);
    let u = v0 + 6;
    while (u < v1 - 30) {
      const nextLane = lanesHere.find((lu) => lu > u + 20) ?? v1;
      const h = Math.min(nextLane - 4 - u, 34 + Math.floor(br() * 22));
      if (h < 26) {
        u = nextLane + 4;
        continue;
      }
      const top = Y(u + h);
      const bot = Y(u);
      const mu = u + h / 2;
      const x0 = Math.ceil((c === 0 ? 0 : laneX[c - 1](mu) + halfW[c - 1]) + 1);
      const x1 = Math.floor((c === 3 ? W : laneX[c](mu) - halfW[c]) - 1);
      if (x1 - x0 > 46 && br() < 0.5) {
        const xm = Math.round((x0 + x1) / 2 + (br() - 0.5) * 8);
        homestead(x0, xm, top, bot);
        homestead(xm, x1, top, bot);
      } else homestead(x0, x1, top, bot);
      u += h + 1;
    }
  }
  // the old banyan over the crossing in the middle of the village: a great crown, hanging roots, a bench round it, the elders with their sanshin
  {
    const cx = 66;
    const cu = 1585;
    objects.push({
      y: Y(cu) + 3,
      draw: () => {
        const X = cx * S;
        const Yb = Y(cu) * S;
        for (let q = 0; q < 26; q++) {
          const ox = hashPx(q, 1, 2207) * 72 - 36;
          const len = 8 + hashPx(q, 2, 2207) * 16;
          for (let j = 0; j < len; j++) img.px(X + ox, Yb - j, q % 2 ? 0x4a3a2a : 0x6a5a44);
        }
        for (let a = 0; a < 6.3; a += 0.05) for (let w0 = 0; w0 < 3; w0++) img.px(X + Math.cos(a) * (24 + w0), Yb + Math.sin(a) * (10 + w0), w0 ? C.wood[1] : C.wood[3]);
      },
    });
    plant('tropic', cx, Y(cu) - 2, 12, 2208);
    k.crowd(cx - 9, Y(cu) + 4, 18, 3, 7, [0x3a5a8a, 0xe8e0c8, 0x6a3a2a, 0x3a3a4a]);
  }
  // a soba shop on the main lane under its banner, a stack of crates; the bicycle hire at the village's foot
  for (const [x, u, noren] of [[100, 1690, 0x2a3a6a], [100, 1470, 0x8a2a2a]])
    if (!k.anyRes(x, Y(u + 18), 16, 20))
      house(x, Y(u + 18), 16, 11, {
        faceH: 5,
        wall: 0xe0d8c0,
        extra: () => {
          const X = x * S;
          const Yb = Y(u) * S + 3;
          for (let i = 3; i < 45; i++) for (let j = 0; j < 6; j++) img.px(X + i, Yb - 12 + j, i % 7 === 0 ? 0x141014 : noren);
        },
      });
  {
    const x = 62;
    const u = v0 + 4;
    if (!k.anyRes(x, Y(u + 16), 22, 18)) {
      flat(x, Y(u + 14), 20, 9, 4);
      for (let q = 0; q < 8; q++) {
        const X = (x + 1 + q * 2.4) * S;
        const Yy = Y(u) * S;
        const c = [0xe05a4a, 0x4a8ad8, 0xe8e8f0, 0xf0c040][q % 4];
        for (let i = 0; i < 13; i++) img.px(X, Yy - 2 + i, i === 0 || i === 12 ? 0x2a2a30 : c);
      }
    }
  }
  // whatever ground is left between the lanes: kitchen gardens, a little lawn with bananas, a small house in its own wall
  k.fillGaps(2, W - 2, v0 + 2, v1 - 3, (x, u, w, h) => {
    const yTop = Y(u + h);
    const r = br();
    if (r < 0.34 && w >= 11 && h >= 14) {
      img.fine(x, yTop, w - 0.5, h - 0.5, (X, Yy, xx, yy) => k.lawnPx(X, Yy, 0.25 + fbm(xx, yy, { seed: 51, scale: 5 }) * 0.6, C.grass, true));
      k.reserve(x, yTop, w, h);
      house(x + 1, yTop + 1, w - 2.5, h - 6, { faceH: 2.6, reserve: false });
      for (let X = x * S; X < (x + w - 0.5) * S; X++) for (let j = 0; j < 4; j++) img.px(X, Y(u) * S - 2 + j, (X + j * 3) % 5 === 0 ? C.coral[0] : j === 0 ? C.coral[4] : C.coral[2]);
      return;
    }
    if (r < 0.7) {
      const down = br() < 0.5;
      const cane = br() < 0.3;
      img.fine(x, yTop, w - 0.5, h - 0.5, (X, Yy) => {
        const q = (down ? X : Yy) % 9;
        if (q < 3) return rampColor(C.redEarth, 0.3 + hashPx(X >> 1, Yy >> 1, 2202) * 0.4, X, Yy);
        return cane ? C.cane[(X + Yy) % 3] : hashPx(X >> 1, Yy >> 1, 2203) < 0.6 ? C.grass[2] : C.grass[1];
      });
    } else {
      img.fine(x, yTop, w - 0.5, h - 0.5, (X, Yy, xx, yy) => k.lawnPx(X, Yy, 0.25 + fbm(xx, yy, { seed: 51, scale: 5 }) * 0.6, C.grass, true));
      plant(br() < 0.5 ? 'banana' : 'hibiscus', x + w / 2, yTop + h / 2, 2.8 + br(), Math.floor(br() * 1e8));
    }
    k.reserve(x, yTop, w, h);
  });
  // riders on the lanes: bicycles pointing right, turned by their route
  const rider = (c, f) => k.sprite(6, 5, 1800, (r) => {
    for (const q of [2, 15]) r.discPx(q, 11, 2, 0x2a2a30);
    for (let i = 3; i < 15; i++) r.px(i, 11, 0x6a6a72);
    for (let j = 2; j < 10; j++) for (let i = 7; i < 11; i++) r.px(i + (j < 5 ? 1 : 0), j, c);
    r.discPx(10, 1.6, 2, 0x2a2026);
    r.px(f ? 7 : 11, 9, scaleColor(c, 0.7));
    r.px(f ? 11 : 7, 12, 0x1a1a22);
  });
  const up = (i) => {
    const pts = [];
    for (let u = v0 + 4; u <= v1 - 4; u += 20) pts.push([laneX[i](u) + (i === 1 ? 1 : 0), u]);
    return pts;
  };
  for (const [c, s0] of [[0xe8e8f0, 0.1], [0xe05a4a, 0.55], [0x4a8ad8, 0.85]]) kit.path(up(1), [rider(c, 0), rider(c, 1)], { sp: 9, mode: 'pp', hold: 1, turn: 'rot', fps: 3, s0, d: 0.45 });
  across.slice(1, -1).filter((_, i) => i % 2 === 0).forEach(([u, a, b], i) => {
    const c = [0xf0c040, 0x5ac0a0, 0xe8e8f0, 0xe86a9a][i % 4];
    kit.path([[Math.max(4, xOf(a, u) + 4), u], [Math.min(W - 4, xOf(b, u) - 4), u]], [rider(c, 0), rider(c, 1)], { sp: 8, mode: 'pp', hold: 2, turn: 'rot', fps: 3, d: 0.45 });
  });
  for (const [i, c] of [[0, 0xd04060], [2, 0xf0f0f0], [0, 0x3a6ad0], [2, 0xf0c040]]) kit.path(up(i), [k.walker(c, 0, 1800), k.walker(c, 1, 1800)], { sp: 3, mode: 'pp', hold: 3, turn: 'flip', fps: 3, s0: br(), d: 0.45 });
  // the water-buffalo cart: a grey buffalo in its yoke, the flat cart under its reed awning, passengers, the driver with a sanshin
  const cart = [0, 1].map((f) => k.sprite(22, 8, 1800, (r) => {
    for (let i = 42; i < 62; i++) for (let j = 8; j < 18; j++) r.px(i, j, j < 10 ? 0x7a7a80 : j > 16 ? 0x3e3e44 : 0x5a5a62);
    r.discPx(62, 13, 4, 0x4e4e56);
    for (const s of [-1, 1]) {
      r.linePx(64, 13 + s * 3, 60, 13 + s * 9, 0xd8d0b8);
      r.px(46 + (f ? 2 : 0), 13 + s * 6, 0x2a2a30);
      r.px(58 - (f ? 2 : 0), 13 + s * 6, 0x2a2a30);
    }
    for (let i = 30; i < 42; i++) r.px(i, 13, C.wood[0]);
    for (let i = 2; i < 30; i++) for (let j = 4; j < 22; j++) r.px(i, j, j === 4 || j === 21 ? C.wood[0] : (i >> 2) % 2 ? C.wood[3] : C.wood[2]);
    for (let q = 0; q < 6; q++) r.discPx(6 + (q % 3) * 9, 8 + (q > 2 ? 10 : 0), 2, [0xd04040, 0x3a6ad0, 0xe8c040, 0xe8e8f0, 0x6a9a5a, 0xf0a0b0][q]);
    for (let i = 3; i < 29; i += 2) for (let j = 6; j < 20; j++) if ((j + i) % 5 === 0) r.px(i, j, 0xc0a470, 0.8);
    for (const q of [0, 16]) r.discPx(10 + q, 3, 1.6, 0x2a2a30);
    r.discPx(33, 13, 2, 0xe8e0c8);
  }));
  kit.path(up(1), cart, { sp: 2.6, mode: 'pp', hold: 6, turn: 'rot', fps: 2, s0: 0.42, d: 0.45 });
  // a kitchen garden of street trees at the lanes' feet
  void mix;
}
