// Life on the water and along its edges, the places the route passes that are otherwise only sea: a trawler and a coaster
// in the open water round Hashima, set nets on their floats, gulls, shoals under the surface; on the western shore the
// cove's slip and squid racks, the hamlets' landing stages; in the bay below Glover Garden a marina on pontoons, the
// Oura landing, a tug with its barge, boats at anchor and anglers along the quay. All of it stays on the water it floats
// on, or flies: nothing here slides against the map.
import { rng } from '../../lib/raster.mjs';
import { C, S, hashPx, night, scaleColor } from './canvas.mjs';
import { W, leftShore, rightShore } from './geo.mjs';

export function paintWaters(k) {
  const { img, kit, Y, objects, glowPx, pool } = k;
  const R = rng(4242);
  const wake = (u) => ({ f: k.wakeF(u), every: 5, life: 1.6 });

  /** A working boat: bow to the right, wheelhouse aft, the deck's gear. */
  const trawler = (u, col) => k.hull(19, 7, u, col, 0xb8b0a0, (r, FL, FHh) => {
    for (let j = 5; j < FHh - 5; j++) for (let i = 8; i < 22; i++) r.px(i, j, j === 5 ? 0xffffff : j === FHh - 6 ? 0x8a8e94 : i > 18 ? 0x2a3a4a : 0xe8e8e0);
    for (let i = 26; i < 36; i += 3) for (let j = 7; j < FHh - 7; j++) r.px(i, j, (i + j) % 2 ? 0x3a5a4a : 0x6a7a5a); // the nets heaped forward
    r.px(14, 3, 0xffd890);
    r.rectPx(2, 8, 4, 5, 0xe8a030);
  });
  const skiff = (u, col) => k.hull(10, 4, u, col, 0xc8bca4, (r, FL, FHh) => {
    for (let i = 8; i < 24; i += 6) for (let j = 2; j < FHh - 2; j++) r.px(i, j, C.wood[1]);
  });
  const yacht = (u, col) => k.hull(15, 5, u, col, 0xe8e4d8, (r, FL, FHh) => {
    for (let j = 4; j < FHh - 4; j++) for (let i = 9; i < 25; i++) r.px(i, j, j === 4 ? 0xffffff : i > 20 ? 0x2a3a4a : 0xd8d8d0);
    for (let i = 3; i < 40; i++) r.px(i, FHh >> 1, 0x8a8e94, 0.8); // the boom and mast's line
  });

  // ------------------------------------------------------------ the open water round Hashima
  kit.path([[-30, 170], [70, 130], [W + 30, 66]], [trawler(120, 0x2a5a7a)], { sp: 5.5, turn: 'rot', d: 0.02, wake: wake(120) });
  kit.path([[W + 40, 288], [90, 250], [-50, 214]], [k.hull(38, 9, 240, 0x7a3a2a, 0x5a6058, (r, FL, FHh) => {
    for (let j = 6; j < FHh - 6; j++) for (let i = 7; i < 26; i++) r.px(i, j, j === 6 ? 0xffffff : i > 21 ? 0x2a3a4a : 0xdcdcd4);
    for (let i = 32; i < 96; i += 16) for (let j = 7; j < FHh - 7; j++) for (let q = 0; q < 13; q++) r.px(i + q, j, j === 7 ? 0x4a7a8a : q % 4 === 0 ? 0x2a4a5a : 0x3a6a7a);
  })], { sp: 4.5, turn: 'rot', d: 0.02, wake: wake(240) });
  kit.path([[20, 910], [90, 950], [150, 925]], [trawler(930, 0x3a7a5a)], { sp: 5, mode: 'pp', hold: 6, turn: 'rot', d: 0.02, wake: wake(930) });
  /** A boat lying to her anchor, a slow ring of ripples round her. */
  const moored = (x, u, f) => {
    kit.loop(x, u, [f], { d: 0.02 });
  };
  moored(136, 72, trawler(60, 0xe8e4d8));
  moored(14, 256, trawler(250, 0x3a5a8a));
  moored(158, 900, skiff(900, 0x2a5a7a));
  // set nets: a long curve of floats, orange and white, the rope between them, a marker flag at each end
  for (const [x0, u0, x1, u1, bow, seed2] of [[20, 70, 100, 30, 22, 1], [108, 190, 170, 130, -18, 2], [18, 960, 74, 930, 14, 3], [120, 985, 176, 970, -10, 4]]) {
    let last = null;
    for (let t = 0; t <= 1.0001; t += 0.015) {
      const X = (x0 + (x1 - x0) * t) * S;
      const Yy = Y(u0 + (u1 - u0) * t + Math.sin(t * Math.PI) * bow) * S;
      if (last) img.linePx(Math.round(last[0]), Math.round(last[1]), Math.round(X), Math.round(Yy), 0xc8d4d4, 0.35);
      last = [X, Yy];
      if (Math.round(t / 0.015) % 3 === 0) {
        const c = Math.round(t / 0.015) % 6 === 0 ? 0xe8783a : 0xe8e4d8;
        img.discPx(X, Yy, 1.6, scaleColor(c, 0.7));
        img.px(X - 1, Yy - 1, c);
        img.px(X, Yy - 1, c);
        img.px(X + 2, Yy + 1, 0xe8f6f6, 0.5);
      }
    }
    for (const [fx, fu] of [[x0, u0], [x1, u1]]) {
      const X = fx * S;
      const Yy = Y(fu) * S;
      for (let j = 0; j < 12; j++) img.px(X, Yy - j, 0x3a3a30);
      for (let j = 0; j < 5; j++) for (let i = 1; i < 7; i++) img.px(X + i, Yy - 12 + j, seed2 % 2 ? 0xd83a2a : 0xe8c838);
    }
  }
  // shoals just under the surface: dark slips of fish and a silver flash, turning slowly, faint enough never to read as anything shot
  const shoal = [0, 1].map((f) => k.sprite(20, 12, 200, (r) => {
    const g = rng(99);
    for (let q = 0; q < 30; q++) {
      const X = 6 + g() * 48;
      const Yy = 4 + g() * 28;
      const c = g() < 0.14 && (q + f) % 2 ? 0xa8c8d0 : 0x0a2028;
      r.px(X + (f ? 1 : 0), Yy, c);
      r.px(X + 1 + (f ? 1 : 0), Yy, c);
      r.px(X + 2 + (f ? 1 : 0), Yy, c, 0.6);
    }
  }, false));
  for (const [x, u, r] of [[58, 240, 20], [130, 300, 14], [64, 940, 16], [20, 2200, 10]]) kit.orbit(x, u, r, shoal, { ry: r * 0.6, w: 0.14, n: 1, a: 0.5, d: 0.02 });
  // gulls, wheeling, off the nets and the boats
  const gull = [0, 1].map((f) => k.sprite(9, 4, 200, (r) => {
    const CX = 13;
    for (let i = 1; i < 12; i++) {
      const dy = f ? Math.round(i * 0.3) : Math.round(i * -0.24 + (i > 7 ? (i - 7) * 0.5 : 0));
      for (let j = 0; j < (i > 8 ? 1 : 2); j++) {
        r.px(CX - i, 6 + dy + j, i > 9 ? 0x3a3a40 : 0xe8ecec);
        r.px(CX + i, 6 + dy + j, i > 9 ? 0x3a3a40 : 0xc8ccd0);
      }
    }
    for (let j = 4; j < 9; j++) for (let i = -1; i <= 1; i++) r.px(CX + i, j, 0xf8f8f8);
  }));
  for (const [x, u, rr, n, w] of [[120, 110, 30, 3, 0.3], [50, 210, 26, 2, -0.26], [100, 940, 36, 2, 0.28], [24, 2120, 16, 2, 0.3], [20, 1320, 18, 2, -0.3]]) kit.orbit(x, u, rr, gull, { ry: rr * 0.7, w, n, d: 2.2, a: 0.9 });

  // ------------------------------------------------------------ the western shore
  // the cove: a slip into the water, a boat drawn up on it, squid drying on their lines, a heap of nets
  {
    const sx = Math.round(leftShore(1300));
    img.fine(sx - 17, Y(1290), 18, 8, (X, Yy) => {
      if (Yy % 6 < 1) return C.wood[0];
      return (X >> 2) % 2 ? C.granite[2] : C.granite[1];
    });
    objects.push({
      y: Y(1283),
      shadow: () => k.shadowRect(sx - 15, Y(1289), 13, 5, 0.5),
      draw: () => {
        const X0 = (sx - 15) * S;
        const Yb = Y(1286) * S;
        for (let i = 0; i < 39; i++) {
          const hw = Math.min(6.5, 1 + Math.pow(38 - i, 0.72) * 1.5);
          for (let j = -hw; j <= hw; j++) img.px(X0 + i, Yb + j, hw - Math.abs(j) < 1.2 ? (j > 0 ? 0x1e3e5e : 0x3a6a9a) : j % 4 === 0 ? 0x9a9080 : 0xb8ae9c);
        }
        for (const i of [8, 26]) for (let j = 7; j < 11; j++) img.px(X0 + i, Yb + j, C.wood[0]);
      },
    });
    // the racks: posts, a line, the squid pegged out in a row
    for (const [x0, u, n] of [[5, 1288, 6], [5, 1283, 5]]) {
      objects.push({
        y: Y(u),
        shadow: () => k.shadowRect(x0 + 1, Y(u) - 1, n * 1.6 + 1, 2, 0.4),
        draw: () => {
          const X0 = x0 * S;
          const Yb = Y(u) * S;
          for (const q of [0, n * 5]) for (let j = 0; j < 15; j++) img.px(X0 + q, Yb - j, C.wood[0]);
          for (let i = 0; i <= n * 5; i++) img.px(X0 + i, Yb - 14, 0xc8c0b0);
          for (let q = 1; q < n; q++) {
            const CX = X0 + q * 5;
            for (let j = 0; j < 9; j++) for (let i = -1; i <= 1; i++) img.px(CX + i, Yb - 13 + j, j > 6 ? (i === 0 ? 0xe8dcc4 : 0xb8a888) : i < 1 ? 0xf0e4cc : 0xc8b898);
          }
        },
      });
    }
    img.fine(27, Y(1298), 6, 4, (X, Yy) => (hashPx(X >> 1, Yy >> 1, 4243) < 0.5 ? 0x3a5a4a : (X + Yy) % 3 ? 0x2a4a3a : 0xe8783a));
  }
  // the hamlets' landing stages: stone steps to the water, a timber stage, a skiff tied up, somebody fishing off the end
  for (const [u, col] of [[1186, 0xe8e4d8], [1416, 0x2a5a8a], [1498, 0x3a7a5a]]) {
    const sx = Math.round(leftShore(u));
    const y = Y(u);
    img.fine(sx - 3, y - 2, 4, 4, (X, Yy) => (Yy % 4 === 0 ? C.granite[4] : Yy % 4 === 1 ? C.granite[0] : C.granite[2]));
    img.fine(sx, y - 1, 14, 2, (X, Yy) => {
      if (X % 6 === 0) return C.wood[0];
      return Yy % 3 === 2 ? C.wood[0] : hashPx(X >> 1, Yy, 4244) < 0.5 ? C.wood[2] : C.wood[3];
    });
    for (let X = sx * S; X < (sx + 14) * S; X++) for (let j = 0; j < 3; j++) img.px(X, (y + 1) * S + j, 0x061420, 0.42 - j * 0.1);
    kit.loop(sx + 3, u - 3, [skiff(u, col)], { d: 0.02 });
    const px = sx + 12;
    objects.push({
      y: y + 1,
      draw: () => {
        k.personPx(px * S, y * S - 10, R);
        img.linePx(px * S + 3, y * S - 9, px * S + 21, y * S - 19, 0x2a2a30);
        img.linePx(px * S + 21, y * S - 19, px * S + 24, y * S + 6, 0xc8d4d4, 0.4);
      },
    });
  }

  // ------------------------------------------------------------ the bay below Glover Garden
  // the marina: three pontoons out from the quay, each its gangway, boats along them, a lamp at each head
  const finger = (u, x0, seed2) => {
    const x1 = Math.floor(rightShore(u)) - 1;
    const y = Y(u);
    img.fine(x0, y - 1, x1 - x0, 3, (X, Yy) => {
      const j = Yy - (y - 1) * S;
      if (j < 1) return 0xc8c0b0;
      if (j > 7) return 0x5a5448;
      if (X % 12 === 0) return C.wood[0];
      return j % 3 === 0 ? C.wood[1] : hashPx(X >> 2, j, seed2) < 0.5 ? C.wood[2] : C.wood[3];
    });
    for (let X = x0 * S; X < x1 * S; X++) for (let j = 0; j < 4; j++) img.px(X, (y + 2) * S + j, 0x061420, 0.4 - j * 0.09);
    // the floats that hold it up, seen along its edge
    for (let X = x0 * S; X < x1 * S; X += 15) for (let j = 0; j < 2; j++) for (let i = 0; i < 9; i++) img.px(X + i, (y + 2) * S + j, 0xd8d8d0);
    k.streetLamp(x0 + 1, u + 1, 0xffe8c0);
  };
  const MU = [2232, 2262, 2292];
  MU.forEach((u, i) => finger(u, 6 + i * 3, 4250 + i));
  for (const [x, u, f] of [
    [10, 2243, yacht(2240, 0xe8e4d8)], [22, 2240, skiff(2240, 0x2a5a8a)],
    [8, 2228, skiff(2230, 0x3a7a5a)], [20, 2229, yacht(2230, 0x2a4a7a)],
    [14, 2273, yacht(2270, 0xc8302a)], [12, 2258, trawler(2260, 0xe8e4d8)],
    [12, 2303, skiff(2300, 0xd8c8a0)], [24, 2303, skiff(2300, 0x2a5a8a)], [16, 2288, yacht(2290, 0x3a6a5a)],
  ]) kit.loop(x, u, [f], { d: 0.02 });
  // the Oura landing: a covered pier, a sightseeing boat alongside, people waiting under the canopy
  {
    const u = 2430;
    const x1 = Math.floor(rightShore(u)) - 1;
    const x0 = 8;
    const y = Y(u);
    img.fine(x0, y - 2, x1 - x0, 5, (X, Yy) => {
      const j = Yy - (y - 2) * S;
      if (j < 1) return 0xd8d0c0;
      if (j > 12) return 0x4a4438;
      return X % 15 === 0 ? 0x5a5448 : k.settPx(X, Yy, 44, C.granite);
    });
    objects.push({
      y: y + 3,
      shadow: () => k.shadowRect(x0 + 8, y - 3, 22, 7, 0.4),
      draw: () => {
        const X0 = (x0 + 6) * S;
        const WW = 66;
        const Yr = (y - 5) * S;
        for (const i of [2, WW - 3]) for (let j = 0; j < 15; j++) img.px(X0 + i, Yr + 6 + j, 0x3a3a40);
        for (let j = 0; j < 7; j++) for (let i = 0; i < WW; i++) img.px(X0 + i, Yr + j, j < 1 ? 0xc8ccd0 : j > 5 ? 0x4a5058 : i % 6 === 0 ? 0x5a7a8a : 0x4a6a7a);
        for (let i = 6; i < WW - 6; i += 12) glowPx(X0 + i, Yr + 7, 0xffe0a8, 0.6 + night(u) * 0.35);
        pool(x0 + 16, y, 12, 0xffd8a0, 0.08 + night(u) * 0.2);
      },
    });
    k.crowd(x0 + 8, y - 2, 14, 2, 5);
    kit.loop(x0 + 2, u + 12, [k.hull(26, 8, u, 0xe8e8e0, 0xc8c8c0, (r, FL, FHh) => {
      for (let j = 5; j < FHh - 5; j++) for (let i = 10; i < 56; i++) r.px(i, j, j === 5 ? 0xf8f8f4 : (i - 10) % 7 === 0 ? 0x4a5a5a : 0x2a6a8a);
      for (let i = 12; i < 54; i += 7) r.px(i, 3, 0xffd890);
    })], { d: 0.02 });
  }
  // a tug towing a loaded barge up and down the bay, the tow rope between them
  const tow = k.sprite(52, 9, 2300, (r) => {
    const YC = 13;
    for (let X = 0; X < 90; X++)
      for (let j = -11; j <= 11; j++) {
        const e = Math.min(X, 89 - X, 11 - Math.abs(j));
        let c = e < 1 ? 0x2a2a30 : e < 3 ? 0x4a4a50 : 0x6a6458;
        if (e >= 4 && hashPx(X >> 1, j >> 1, 4251) < 0.3) c = 0x8a8474;
        r.px(X, YC + j, c);
      }
    for (let X = 90; X < 118; X++) r.px(X, YC, 0xc8c8c0, 0.7);
    for (let X = 118; X < 156; X++) {
      const t = 155 - X;
      const hw = Math.min(8, 1 + Math.pow(t, 0.72) * 1.1);
      for (let j = -hw; j <= hw; j++) r.px(X, YC + j, hw - Math.abs(j) < 1.2 ? (j > 0 ? 0x8a2018 : 0xe84a38) : 0x2a2a30);
    }
    for (let X = 126; X < 142; X++) for (let j = -4; j <= 4; j++) r.px(X, YC + j, j === -4 ? 0xffffff : X > 138 ? 0x2a3a4a : 0xe8e8e0);
  });
  kit.path([[18, 2000], [16, 2200], [8, 2340], [18, 2520], [22, 2620]], [tow], { sp: 5, mode: 'pp', hold: 8, turn: 'rot', d: 0.02, wake: wake(2300) });
  // boats lying at anchor out in the bay
  moored(10, 2120, yacht(2120, 0xe8e4d8));
  moored(20, 2176, trawler(2170, 0x3a6a8a));
  moored(6, 2390, skiff(2390, 0xc8302a));
  moored(10, 2506, yacht(2500, 0x2a4a7a));
  moored(18, 2570, trawler(2570, 0xe8e4d8));
  // anglers along the quay, each with a bucket and a rod out over the water
  for (const u of [2076, 2150, 2204, 2340, 2372, 2472, 2522]) {
    const x = rightShore(u) + 1.5;
    const y = Y(u);
    objects.push({
      y: y + 1,
      draw: () => {
        const X = Math.round(x * S);
        k.personPx(X, y * S - 9, R);
        img.rectPx(X + 5, y * S - 1, 3, 3, 0x3a6aa8);
        img.linePx(X, y * S - 7, X - 18, y * S - 14, 0x2a2a30);
        img.linePx(X - 18, y * S - 14, X - 21, y * S + 8, 0xc8d4d4, 0.35);
        for (let a = 0; a < 6.3; a += 0.7) img.px(X - 21 + Math.cos(a) * 3, y * S + 9 + Math.sin(a) * 1.4, 0xe8f6f6, 0.35);
      },
    });
  }
}
