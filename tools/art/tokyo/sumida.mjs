// The Sumida (u 9500-10760, and Hama-rikyū beyond it to 10840), at night.
//   Sumida park under its cherries along the west bank: the riverside walk, stalls, a running track, the temple
//     on its mound; the shrine with the triple torii on the east bank;
//   the bridges, each in its own colour and lit: Azuma in red on its three arches, Komagata's blue arch over the
//     roadway, the railway's green truss, Ryōgoku, Kiyosu hung from its two towers, Eitai's heavy blue arch;
//   the broadcasting tower, a lattice turning from a triangle at its foot to a circle under its two decks;
//   Ryōgoku: the old station, the sumo hall under its green roof with banners along its front and the drum
//     tower, the museum raised on four legs; a garden round a pond with stepping stones;
//   the terraces along both banks, pleasure boats moored at their jetties; the fish market's curved sheds with
//     tuna laid out in rows, boats at its quay; the towers at the river's mouth;
//   Hama-rikyū: the tide pond with the tea house on it, reached by two wooden bridges, a field in flower, pines.
// Live: pleasure boats hung with lanterns, a water bus, a tug with its barge, the tower's lamps going round,
// trains on the bridge, cars, petals, the stalls' steam.
import { lots } from './blocks.mjs';
import { PAL, shade, blend } from './kit.mjs';
import { makeWafu, yakata as boat, RED, TILE, COPPER, GOLD, WARM } from './wafu.mjs';
import { hashPx } from '../hires.mjs';
import { inShape } from './geom.mjs';
import { GROUNDS, WATER } from './route.mjs';

const TAU = Math.PI * 2;

export function sumida(ctx) {
  const { kit, blocks, pave, plot, claim, props, near, ROADS, S, L, W } = ctx;
  const { building, house, tree, crowd, mark, ground, rand, pick, P, R, E, ER, halo, FX, FY, car, queue } = kit;
  kit.setSun(0.1);
  const { lampAt, lanternAt, disc, drop, toro, temple, string, yatai } = makeWafu(ctx);
  const hi = ctx.img.hi;
  const FW = W * S;
  const road = (id) => ROADS.find((r) => r.id === id);
  const river = WATER.find((w) => w.id === 'sumida');
  const wetAt = (x, u) => x >= 0 && x < W && ctx.wet[Math.min(L * S - 1, FY(u)) * FW + FX(x)] === 1;
  const bankW = (u) => {
    for (let x = 4; x < 130; x += 1 / 3) if (wetAt(x, u)) return x;
    return null;
  };
  const bankE = (u) => {
    for (let x = 179.6; x > 60; x -= 1 / 3) if (wetAt(x, u)) return x + 1 / 3;
    return null;
  };
  const line = (x0, y0, x1, y1, fn) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let k = 0; k <= n; k++) fn(Math.round(x0 + ((x1 - x0) * k) / n), Math.round(y0 + ((y1 - y0) * k) / n));
  };
  const glint = kit.glint;

  // ---- the terraces along both banks: a paved walk at the water's edge, a rail, lamps, people out for the air
  const CROSS = [[9860, 9], [10020, 7.4], [10190, 8], [10240, 7.4], [10420, 7.4], [10590, 9]];
  const crossing = (u, pad = 0) => CROSS.some(([bu, hw]) => Math.abs(u - bu) < hw + pad);
  ground(() => {
    for (let u = 9806; u < 10656; u += 1 / 3) {
      if (crossing(u)) continue;
      for (const [b, s] of [[bankW(u), -1], [bankE(u), 1]]) {
        if (b === null || b > 177) continue;
        for (let q = 0.67; q < 3.6; q += 1 / 3) {
          const [X, Y] = [FX(b + (s < 0 ? -q : q - 1 / 3)), FY(u)];
          P(X, Y, q > 3.2 ? 0x6e6a62 : q < 1 ? 0x5a6068 : (Y % 9 === 0 || (X + Y) % 12 === 0 ? 0x9a948a : shade(0xb4ac9c, 0.95 + hashPx(X, Y, 211) * 0.08)));
        }
      }
    }
  });
  for (let u = 9806; u < 10656; u++) {
    const [a, b] = [bankW(u + 0.5), bankE(u + 0.5)];
    if (a !== null) claim(a - 4, u, 4, 1);
    if (b !== null && b < 177) claim(b, u, 4, 1);
  }
  for (let u = 9814, k = 0; u < 10650; u += 15, k++) {
    if (crossing(u, 3)) continue;
    const [a, b] = [bankW(u), bankE(u)];
    if (a !== null) {
      lampAt(a - 3, u, WARM);
      glint(FX(a + 1.4), FY(u) + 2, 26, 0xffe0a0, 0.5);
      if (k % 2) crowd(a - 3, u + 3, 2, 8, 2 + (k % 3));
    }
    if (b !== null && b < 176) {
      lampAt(b + 3, u + 6, WARM);
      glint(FX(b - 1.6), FY(u + 6) + 2, 26, 0xffe0a0, 0.5);
      if (k % 2 === 0) crowd(b + 1, u + 3, 2, 8, 2 + (k % 3));
    }
  }

  // ---- Sumida park: cherries along the water, the walk under them, stalls, sheets spread for the blossom
  {
    const park = GROUNDS.find((g) => g.id === 'sumida_koen');
    const edo = road('edo_dori').pts;
    const walk = [[178, 9556], [156, 9574]]; // (five steps in from the bank, all the way down it)
    for (let u = 9590; u <= 9850; u += 10) walk.push([bankW(u) - 5, u]);
    const cross = [[30, 9640], [70, 9640], [walk[9][0], walk[9][1]]];
    const cross2 = [[30, 9560], [176, 9544]];
    const paths = [[walk, 2], [cross, 1.4], [cross2, 1.4]];
    for (const [pts, hw] of paths)
      ctx.along(pts, hw, (n, x, u, X, Y) => (wetAt(x, u) ? null : n.d > hw - 0.4 ? 0x8a8478 : shade(0xbcb29c, 0.94 + hashPx(X, Y, 212) * 0.1)));
    const kept = [];
    const keep = (x, u, w, h) => kept.push([x, u, w, h]);
    const free = (x, u, pad = 2) =>
      inShape(park, x, u) && inShape(park, x + pad, u) && inShape(park, x - pad, u) && inShape(park, x, u + pad) && u - pad > 9510 && !wetAt(x + pad, u + pad) && !wetAt(x, u) &&
      near(edo, x, u).d > 6 + pad && !paths.some(([pts, hw]) => near(pts, x, u).d < hw + pad) && !kept.some(([a, b, w, h]) => x > a - pad && x < a + w + pad && u > b - pad && u < b + h + pad);

    // a running track round a pitch, floodlit
    {
      const [cx, cu] = [58, 9600];
      keep(cx - 24, cu - 17, 48, 34);
      ground(() => {
        for (let u = cu - 16; u < cu + 16; u += 1 / 3)
          for (let x = cx - 23; x < cx + 23; x += 1 / 3) {
            const dx = Math.max(0, Math.abs(x - cx) - 9);
            const d = Math.hypot(dx, u - cu);
            if (d > 14) continue;
            const lane = Math.floor((d - 9.4) / 1.15);
            let c = d > 9.4 ? (Math.abs(d - 9.4 - (lane + 0.02) * 1.15) < 0.17 ? 0xf0e8e0 : 0xb0563c) : Math.floor((x - cx + 40) / 3) % 2 ? 0x4f8a44 : 0x5a9650;
            if (d <= 9.4 && (Math.abs(x - cx) < 0.2 || Math.abs(Math.hypot(x - cx, u - cu) - 3.4) < 0.2 || d > 9.1)) c = 0xf0f0e8;
            P(FX(x), FY(u), c);
          }
      });
      for (const [dx, du] of [[-22, -14], [22, -14], [-22, 15], [22, 15]])
        mark(cx + dx, cu + du, (X, Y) => {
          R(X, Y - 14, 1, 15, 0x5a5e66);
          ER(X - 2, Y - 17, 5, 3, 0xffffff);
          halo(X - dx * 1.6, Y + du * 1.2 + 6, 60, 42, 0xf0f4ff, 0.14);
        });
      for (let k = 0; k < 7; k++) crowd(cx - 20 + ((k * 13) % 40), cu + (k % 2 ? 11.4 : -12.4), 2, 1, 1);
      crowd(cx - 7, cu - 6, 14, 12, 9);
    }
    // the temple on its mound west of the road: steps up from the street, the hall among trees
    {
      keep(1, 9694, 20, 50);
      ground(() => disc(FX(10.5), FY(9720), 28, (i, j, d) => shade(0x4f7c40, 1.3 - d * 0.42 + hashPx(i, j, 213) * 0.08), 62));
      ground(() => {
        for (let k = 0; k < 9; k++) R(FX(17.6) + k * 2, FY(9717) - 4, 1, 9, k % 2 ? 0x9a948a : 0xc4bcae);
      });
      temple(4, 9712, 13, 14, { face: 3, bays: 3, open: [1], tile: COPPER });
      toro(18.4, 9712);
      toro(18.4, 9722);
      for (const [x, u] of [[4, 9700], [14, 9702], [3, 9734], [16, 9736], [10, 9742]]) tree(pick(['broadleaf', 'pine']), x, u, 2.8);
    }
    // a playground: swings, a slide, a climbing dome
    keep(100, 9522, 22, 16);
    pave(100, 9522, 22, 16, 'sand', 214);
    mark(104, 9526, (X, Y) => {
      R(X, Y - 8, 1, 8, 0x3a6ac8);
      R(X + 12, Y - 8, 1, 8, 0x3a6ac8);
      R(X, Y - 9, 13, 1, 0x3a6ac8);
      for (const i of [3, 6, 9]) {
        R(X + i, Y - 8, 1, 5, 0x8a8e96);
        R(X + i - 1, Y - 3, 3, 1, 0xe84a40);
      }
    });
    mark(112, 9532, (X, Y) => {
      for (let q = 0; q < 10; q++) R(X + q, Y - 10 + q, 2, 2, 0xf0c020);
      R(X - 1, Y - 12, 2, 12, 0xe84a40);
      disc(X + 20, Y - 4, 6, (i, j, d) => (d > 0.8 || i % 3 === 0 || j % 3 === 0 ? 0x40a8d8 : null), 5);
    });
    crowd(101, 9523, 20, 14, 7);
    // stalls along the walk, sheets on the grass, lanterns from tree to tree
    for (let k = 0; k < 5; k++) {
      const [wx, u] = walk[8 + k * 4];
      const x = wx - 12;
      yatai(x, u, k + 4);
      keep(x - 1, u - 2, 10, 9);
      if (k % 2) kit.smoke(x + 4, u + 5, { rate: 0.8, a: 0.35 });
    }
    for (let k = 0; k < 46; k++) {
      const t = k / 46;
      const seg = Math.min(walk.length - 2, Math.floor(t * (walk.length - 1)));
      const f = t * (walk.length - 1) - seg;
      const [x, u] = [walk[seg][0] + (walk[seg + 1][0] - walk[seg][0]) * f, walk[seg][1] + (walk[seg + 1][1] - walk[seg][1]) * f];
      for (const s of [-1, 1]) {
        const [tx, tu] = [x + s * 3.6 + (s > 0 ? 0.6 : -0.6), u + s * 2.6];
        if (free(tx, tu, 0.4)) {
          tree('sakura', tx, tu, 3 + rand() * 0.8);
          if (k % 2 === 0) halo(FX(tx), FY(tu), 24, 22, 0xffb0d0, 0.2);
        }
      }
      if (k % 2) lanternAt(x - 1.8, u + 0.6, k % 4 === 1 ? 0xf08098 : 0xffe0c0);
      if (k % 5 === 2) {
        const [sx, su] = [x - 9 - rand() * 5, u - 5 - rand() * 3];
        if (free(sx, su, 3)) {
          ground(() => R(FX(sx) - 5, FY(su) - 3, 10, 7, k % 2 ? 0x3a6ac8 : 0x4a80d8));
          crowd(sx - 1.4, su - 0.8, 2.8, 1.6, 4);
          keep(sx - 2, su - 2, 4, 4);
        }
      }
    }
    for (const [pts] of paths) {
      let run = 0;
      for (let i = 0; i + 1 < pts.length; i++) {
        const len = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
        for (let s = 10 - (run % 20); s < len; s += 20) {
          const [x, u] = [pts[i][0] + ((pts[i + 1][0] - pts[i][0]) * s) / len, pts[i][1] + ((pts[i + 1][1] - pts[i][1]) * s) / len];
          if (!wetAt(x + 2.4, u)) lampAt(x + 2.4, u + 1, WARM);
          crowd(x - 1, u - 1, 2, 2, 2);
        }
        run += len;
      }
    }
    for (let k = 0; k < 900; k++) {
      const [x, u] = [rand() * 180, 9512 + rand() * 290];
      if (free(x, u, 2.6)) tree(pick(['broadleaf', 'sakura', 'broadleaf', 'pine', 'sakura', 'cedar']), x, u, 2.4 + rand() * 2);
    }
    {
      const petals = (k) =>
        kit.frame(4, 4, 9700, (put) => {
          for (let q = 0; q < 5; q++) put(Math.floor(hashPx(q, 1, 9) * 8) + k, (Math.floor(hashPx(q, 2, 9) * 6) + k * 1.4) | 0, q % 2 ? 0xffd0e0 : 0xffb0cc, 0.9 - k * 0.15);
        }, true);
      props.spot([[60, 9790, 60, 150], [100, 9660, 70, 90]], [petals(0), petals(1), petals(2), petals(3)], { rate: 7, fps: 5, a: 0.8 });
    }
    // the landing for the water bus by the bridge: a pontoon, a gangway
    mark(57, 9836, (X, Y) => {
      R(X - 6, Y - 2, 6, 2, 0x8a6a48);
      R(X, Y - 8, 24, 12, 0x9aa0a8);
      R(X, Y - 8, 24, 1, 0xd0d4da);
      R(X + 2, Y - 6, 20, 5, 0x5a6a7a);
      ER(X + 4, Y - 5, 16, 1, 0xffe8b0);
      R(X, Y + 3, 24, 1, 0x3a3e46);
    });
  }

  // ---- the shrine on the east bank: the triple torii, the lions, the hall
  {
    const [x0, u0, w, h] = [150, 9744, 28, 56];
    claim(x0, u0, w, h);
    pave(x0, u0, w, h, 'gravel', 215);
    mark(x0 + w / 2, u0 + 5, (X, Y) => {
      for (const [dx, hh] of [[-13, 12], [-5, 17], [5, 17], [13, 12]]) R(X + dx - 1, Y - hh, 2, hh, 0xa8a8a0);
      R(X - 9, Y - 20, 19, 2, 0xc4c4bc);
      R(X - 7, Y - 16, 15, 1, 0x9a9a92);
      for (const s of [-1, 1]) {
        R(X + (s < 0 ? -17 : 5), Y - 14, 13, 2, 0xc4c4bc);
        R(X + (s < 0 ? -15 : 6), Y - 11, 10, 1, 0x9a9a92);
      }
    });
    for (const dx of [-5, 4])
      mark(x0 + w / 2 + dx, u0 + 16, (X, Y) => {
        drop(X, Y + 1, 4);
        R(X, Y - 2, 4, 3, 0x8a8a84);
        R(X, Y - 6, 3, 4, 0xb0b0a8);
      });
    temple(x0 + 4, u0 + 30, 20, 20, { face: 3, bays: 3, open: [1], tile: COPPER, wall: 0x6a4a38 });
    for (const du of [22, 27]) for (const dx of [-6, 6]) toro(x0 + w / 2 + dx - 0.4, u0 + du);
    for (const [dx, du] of [[3, 6], [25, 8], [2, 28], [26, 30], [3, 52], [25, 52], [14, 54]]) tree(pick(['broadleaf', 'cedar']), x0 + dx, u0 + du, 2.8);
    crowd(x0 + 10, u0 + 6, 8, 22, 6);
  }

  // ---- the bridges. Each: the side that faces us under the deck (its girder, its arches, its piers standing in
  // the water), what rises over the roadway, lamps down both sides, their light lying on the river.
  const bridge = (u, w, o) => {
    const { c, kind, piers = 2, pave: pv = 2, H = 0 } = o;
    const half = w / 2 + pv;
    const [xa, xb] = [bankW(u), bankE(u)];
    const [XA, XB, YS, YN] = [FX(xa) - 2, FX(xb) + 2, FY(u - half), FY(u + half)];
    const span = XB - XA;
    const lit = blend(c, 0xffffff, 0.35);
    queue(YS + 16, () => {
      // rails along both edges of the deck
      for (let X = XA; X < XB; X++) {
        E(X, YN, X % 4 ? shade(lit, 0.8) : lit);
        E(X, YS - 1, X % 4 ? shade(lit, 0.8) : lit);
      }
      // the side under the deck
      const n = piers + 1;
      for (let X = XA; X < XB; X++) {
        const t = ((X - XA) / span) * n;
        const f = t - Math.floor(t);
        for (let j = 0; j < 4; j++) P(X, YS + j, j === 0 ? shade(c, 1.15) : X % 6 === 0 ? shade(c, 0.6) : shade(c, 0.8));
        if (kind === 'deck-arch') {
          // an arch under each span, posts from it up to the girder
          const y = Math.round(4 + 9 * (1 - 4 * (f - 0.5) ** 2) * -1 + 9);
          for (let q = 0; q < 2; q++) E(X, YS + y + q, q ? shade(c, 0.7) : lit);
          if (X % 5 === 0) for (let j = 4; j < y; j++) P(X, YS + j, shade(c, 0.7));
        }
      }
      for (let k = 1; k <= piers; k++) {
        const X = XA + Math.round((span * k) / n);
        for (let j = 0; j < 16; j++) for (let i = -3; i <= 3; i++) P(X + i, YS + j, i === -3 ? 0xc4c0b4 : i === 3 ? 0x7a766c : j === 15 ? 0x5a564e : 0xa4a094);
      }
      for (const X of [XA - 2, XB - 4]) for (let j = -1; j < 12; j++) for (let i = 0; i < 6; i++) P(X + i, YS + j, i === 0 ? 0xc4c0b4 : 0x9a968a); // the abutments
    });
    // what stands over the roadway
    if (kind === 'through' || kind === 'tied') {
      // an arch on each side of the road over the middle span, hangers down to the deck, ties across the top
      const [a0, a1] = kind === 'tied' ? [XA + span * 0.18, XB - span * 0.18] : [XA + span * 0.3, XB - span * 0.3];
      const z = (X) => Math.max(0, H * S * (1 - ((X - (a0 + a1) / 2) / ((a1 - a0) / 2)) ** 2));
      queue(YS + 17, () => {
        for (const [Y0, f] of [[YN, 0.8], [YS - 1, 1]])
          for (let X = Math.ceil(a0); X <= a1; X++) {
            const y = Math.round(Y0 - z(X));
            for (let q = 0; q < (kind === 'tied' ? 3 : 2); q++) E(X, y + q, q === 0 ? shade(lit, f) : shade(c, f));
            if (Math.round(X - a0) % 12 === 6) for (let j = y + 2; j < Y0; j++) P(X, j, shade(c, 0.9 * f));
          }
        for (let X = Math.ceil(a0) + 9; X <= a1 - 9; X += 18) if (z(X) > H * S * 0.45) for (let j = Math.round(YN - z(X)); j < YS - z(X); j++) P(X, j, shade(c, 0.75));
      });
    } else if (kind === 'hung') {
      // two towers, the chains from bank to tower to tower, hangers
      const [t0, t1] = [XA + span * 0.25, XB - span * 0.25];
      const z = (X) => {
        const hh = H * S;
        if (X < t0) return hh * ((X - XA) / (t0 - XA)) ** 1.6;
        if (X > t1) return hh * ((XB - X) / (XB - t1)) ** 1.6;
        const q = (X - (t0 + t1) / 2) / ((t1 - t0) / 2);
        return 5 + (hh - 5) * q * q;
      };
      queue(YS + 17, () => {
        for (const [Y0, f] of [[YN, 0.8], [YS - 1, 1]]) {
          for (let X = XA; X <= XB; X++) {
            const y = Math.round(Y0 - z(X));
            E(X, y, shade(lit, f));
            E(X, y + 1, shade(c, f));
            if (X % 9 === 4) for (let j = y + 2; j < Y0; j++) P(X, j, shade(c, 0.85 * f));
          }
          for (const T of [t0, t1]) {
            const X = Math.round(T);
            for (let j = 0; j < H * S + 4; j++) for (let i = -2; i <= 2; i++) P(X + i, Y0 - j, i === -2 ? shade(c, 1.2) : i === 2 ? shade(c, 0.6) : shade(c, 0.9));
            ER(X - 1, Y0 - H * S - 6, 3, 2, 0xfff0c0);
          }
        }
        for (const T of [t0, t1]) for (const dz of [H * S, H * S * 0.55]) R(Math.round(T) - 1, Math.round(YN - dz), 3, YS - YN, shade(c, 0.7)); // (the towers' cross beams)
      });
    } else if (kind === 'truss') {
      // the railway's: a low arch of steel over each track's side, braced in crosses
      queue(YS + 17, () => {
        const z = (X) => 6 + (H * S - 6) * (1 - ((X - (XA + XB) / 2) / (span / 2)) ** 2);
        for (const [Y0, f] of [[YN, 0.8], [YS - 1, 1]])
          for (let X = XA; X <= XB; X++) {
            const y = Math.round(Y0 - z(X));
            P(X, y, shade(c, 1.2 * f));
            P(X, y + 1, shade(c, 0.8 * f));
            const m = (X - XA) % 16;
            if (m === 0) for (let j = y + 2; j < Y0; j++) P(X, j, shade(c, f));
            else if (y + 2 + m < Y0) {
              P(X, y + 2 + Math.round((m / 16) * (Y0 - y - 2)), shade(c, 0.85 * f));
              P(X, Y0 - 1 - Math.round((m / 16) * (Y0 - y - 2)), shade(c, 0.85 * f));
            }
          }
      });
    }
    if (o.lamps !== false)
      for (let x = xa + 5, k = 0; x < xb - 3; x += 13, k++) {
        lampAt(x, u + half - 0.8, 0xfff0d8);
        lampAt(x + 6.5, u - half + 1.2, 0xfff0d8);
        glint(FX(x + 6.5), YS + 18, 34, k % 2 ? lit : 0xffe8b0, 0.7);
      }
    else for (let x = xa + 6; x < xb - 3; x += 16) glint(FX(x), YS + 18, 26, lit, 0.5);
    ctx.cover(0, u - half - 6, W, 2 * half + 6 + H + 3, -0.3); // (the boats pass under it, the cars over)
    if (o.cars !== false) {
      kit.trafficOn(kit.offset([[-12, u], [192, u]], w / 4), { sp: 20, gap: 100, u });
      kit.trafficOn(kit.offset([[192, u], [-12, u]], w / 4), { sp: 18, gap: 120, u });
      crowd(xa, u + w / 2 + 0.3, xb - xa, 1.2, 10);
      crowd(xa, u - half + 0.3, xb - xa, 1.2, 10);
    }
  };
  bridge(9860, 12, { c: 0xc8382a, kind: 'deck-arch', piers: 2 });
  bridge(10020, 10, { c: 0x3a78b8, kind: 'through', piers: 2, pave: 1.34, H: 9 });
  bridge(10190, 13, { c: 0x5a8a70, kind: 'truss', piers: 3, pave: 0, H: 7, lamps: false, cars: false });
  bridge(10240, 10, { c: 0x8a8e96, kind: 'girder', piers: 3, pave: 1.34 });
  bridge(10420, 10, { c: 0x3a6ac0, kind: 'hung', piers: 2, pave: 1.34, H: 11 });
  bridge(10590, 12, { c: 0x3a70a8, kind: 'tied', piers: 2, H: 12 });
  // Ryōgoku's posts: a great ball of stone on each
  for (const x of [bankW(10240) - 1, bankE(10240) + 1])
    for (const du of [-6, 6])
      mark(x, 10240 + du, (X, Y) => {
        R(X - 2, Y - 6, 4, 7, 0xa8a49c);
        disc(X, Y - 9, 3, (i, j) => (i + j < -1 ? 0xd8d4cc : 0xa8a49c));
      });
  // trains over the river
  kit.trainOn([[-14, 10192.5], [194, 10192.5]], 0xf0c020, { n: 6, sp: 34, s0: 0.2, u: 10190 });
  kit.trainOn([[194, 10187.5], [-14, 10187.5]], 0xf0c020, { n: 6, sp: 31, s0: 0.7, u: 10190 });
  kit.trafficOn(kit.offset(road('edo_dori').pts, 2), { sp: 18, gap: 150, u: 10000 });
  kit.trafficOn(kit.offset([...road('edo_dori').pts].reverse(), 2), { sp: 17, gap: 170, u: 10000 });

  // ---- the broadcasting tower: a point z above the ground is drawn z up the strip. A lattice of white steel,
  // three-cornered at its foot, round under its decks, lit in pale blue; lamps going round the lower deck.
  {
    const p = plot('denpato');
    pave(p.x, p.u, p.w, p.h, 'plaza', 216);
    const [CX, CY] = [FX(p.x + 20), FY(p.u + 17)];
    const TOP = 330;
    const rAt = (z) => 34 - 21 * (z / TOP) ** 0.8;
    const pt = (z, k, n = 18) => {
      const a = (k / n) * TAU - Math.PI / 2; // (a corner to the north, a flat side toward us)
      const r = rAt(z);
      const phi = ((((a - Math.PI / 2 + TAU / 6) % (TAU / 3)) + TAU / 3) % (TAU / 3)) - TAU / 6;
      const tri = (r * 0.62) / Math.cos(phi);
      const t = Math.min(1, z / 250);
      const rho = tri + (r - tri) * t;
      return [Math.round(CX + Math.cos(a) * rho), Math.round(CY - z + Math.sin(a) * rho)];
    };
    // the low hall at its foot, a glass roof down its middle
    building(p.x + 1, p.u + 38, p.w - 2, 24, {
      face: 5, style: 'glass', glass: [0x2a3a58, 0x8eaed4], roof: 0x8a8e96, shop: true, s: 1801, lit: 0.8,
      top: ({ X, Y, w, h, E: lit, R: rect, ac }) => {
        for (let j = 4; j < h - 4; j++) for (let i = 30; i < w - 30; i++) (j % 6 === 0 || i % 9 === 0 ? rect : (x, y, a, b, c) => lit(x, y, c))(X + i, Y + j, 1, 1, j % 6 === 0 || i % 9 === 0 ? 0xdfe6ea : blend(0x8ac0d8, 0xffeab0, 0.4));
        for (let k = 0; k < 6; k++) ac(X + 4 + (k % 3) * 7, Y + 6 + Math.floor(k / 3) * 40);
      },
    });
    queue(FY(p.u + 5), () => {
      const RING = 15;
      for (let z = 0; z <= TOP; z += RING) {
        for (let k = 0; k < 18; k++) {
          const [a, b] = [pt(z, k), pt(z, k + 1)];
          line(...a, ...b, (X, Y) => E(X, Y, k >= 4 && k < 14 ? 0x8ad0f8 : 0x5a98c8));
          if (z + RING <= TOP) {
            const [c, d] = [pt(z + RING, k + 1), pt(z + RING, k)];
            line(...a, ...c, (X, Y) => P(X, Y, 0xd8e0e8));
            line(...b, ...d, (X, Y) => P(X, Y, 0xb8c4d0));
          }
        }
      }
      // the shaft inside it
      for (let z = 0; z < TOP; z++) for (let i = -4; i <= 4; i++) P(CX + i, CY - z, i < -2 ? 0x9aa6b4 : i > 2 ? 0x5a6674 : 0x7a8694);
      // the two decks: each a drum wider at its top, windows round it, a flat roof
      const drum = (z0, h, r0, r1) => {
        for (let z = z0; z <= z0 + h; z++) {
          const r = r0 + ((r1 - r0) * (z - z0)) / h;
          const row = (z - z0) % 6;
          for (let i = -Math.round(r); i <= Math.round(r); i++) {
            const y = Math.round(CY - z + Math.sqrt(Math.max(0, r * r - i * i)) * 0.9);
            if (row >= 2 && row <= 3 && Math.abs(i) % 3 !== 0) E(CX + i, y, i < 0 ? 0xfff4d0 : 0xd8ecff);
            else P(CX + i, y, shade(0xc8d0d8, 1.1 - (i + r) / (r * 2) * 0.4));
          }
        }
        disc(CX, CY - z0 - h, Math.round(r1), (i, j, d) => (d > 0.9 ? 0xe8eef4 : d < 0.3 ? 0x7a8694 : shade(0xa8b0ba, 1.1 - (i + j) * 0.01)));
      };
      drum(TOP, 34, 13, 21);
      for (let z = TOP + 34; z < TOP + 62; z++) for (let i = -8; i <= 8; i++) P(CX + i, CY - z, i < -5 ? 0xc8d0d8 : i > 5 ? 0x6a7684 : (z + i) % 5 === 0 ? 0x8ad0f8 : 0x9aa6b4);
      drum(TOP + 62, 18, 10, 15);
      for (let z = TOP + 80; z < 510; z++) {
        const r = z < 440 ? 4 : z < 480 ? 2 : 1;
        for (let i = -r; i <= r; i++) P(CX + i, CY - z, i < 0 ? 0xe8eef4 : 0xa8b0ba);
        if (z % 20 === 0) for (let i = -r - 1; i <= r + 1; i++) E(CX + i, CY - z, 0x8ad0f8);
      }
      ER(CX - 1, CY - 512, 2, 2, 0xff4030);
      for (let k = 0; k < 3; k++) {
        const [X, Y] = pt(0, k * 6);
        R(X - 4, Y - 3, 9, 7, 0xb8b8b0); // its three feet
        R(X - 4, Y - 3, 9, 2, 0xdcdcd4);
      }
    });
    halo(CX, CY - 60, 90, 160, 0x60a8f0, 0.12);
    halo(CX, CY - 350, 60, 60, 0x80c0ff, 0.2);
    // the lamps round the lower deck, three of them chasing each other
    const [fr, fz] = [23, TOP + 30];
    const turn = (k) =>
      kit.frame(16, 14, p.u, (put) => {
        for (let q = 0; q < 3; q++) {
          const a = ((k / 8 + q) / 3) * TAU;
          for (let s = 0; s < 4; s++) {
            const b = a - s * 0.16;
            if (Math.sin(b) < -0.25) continue;
            const [x, y] = [Math.round(24 + Math.cos(b) * fr), Math.round(20 + Math.sin(b) * fr * 0.9)];
            put(x, y, s ? 0xa0d8ff : 0xffffff, 1 - s * 0.24);
            put(x, y + 1, 0x80c0ff, 0.6 - s * 0.14);
          }
        }
      }, true);
    props.loop((CX - 24) / S, (L * S - (CY - fz - 20)) / S, Array.from({ length: 8 }, (_, k) => turn(k)), { fps: 8, d: 0.3 });
    // the square at its foot
    for (const [dx, du] of [[3, 3], [37, 3], [3, 32], [37, 32], [12, 2], [28, 2]]) lampAt(p.x + dx, p.u + du, 0xe0f0ff);
    for (const [dx, du] of [[6, 8], [34, 8], [6, 26], [34, 26]]) tree('tiny', p.x + dx, p.u + du, 1.8);
    crowd(p.x + 2, p.u + 1, p.w - 4, 8, 34);
    crowd(p.x + 2, p.u + 28, p.w - 4, 8, 20);
  }

  // ---- Ryōgoku: the old station, its platform over the tracks
  {
    const p = plot('ryogoku_eki');
    building(p.x, p.u + 2, p.w, p.h - 4, {
      face: 9, style: 'brick', wall: 0xd8cdb8, roof: 0x7c7e84, s: 1802, lit: 0.6,
      top: ({ X, Y, w, h, ac, hut }) => {
        hut(X + 8, Y + 8, 12, 6, 0x7c7e84);
        for (let k = 0; k < 10; k++) ac(X + 30 + (k % 5) * 7, Y + 8 + Math.floor(k / 5) * 9);
      },
    });
    mark(p.x + p.w / 2, p.u + 2.4, (X, Y) => {
      // three tall arches in its front, a clock over the middle one
      for (const dx of [-21, -5, 11]) {
        for (let j = 0; j < 20; j++) for (let i = 0; i < 11; i++) if (j > 4 || Math.hypot(i - 5, j - 5) < 5.6) E(X + dx + i, Y - 22 + j, i === 5 || j === 9 ? 0x6a5a48 : 0xffe2a0);
      }
      disc(X, Y - 26, 3, (i, j, d) => (d > 0.75 ? 0x4a4238 : 0xfff8e0));
      P(X, Y - 27, 0x2a2228);
      P(X + 1, Y - 26, 0x2a2228);
    }, p.u + 2);
    ground(() => {
      for (let j = 0; j < 9; j++) for (let i = 0; i < 44 * S; i++) P(FX(136) + i, FY(10194.6) + j, kit.canopy(i, j, 9));
      for (let j = 0; j < 9; j++) for (let i = 0; i < 44 * S; i++) P(FX(136) + i, FY(10189.4) + j, kit.canopy(i + 6, j, 9));
    });
    ctx.cover(136, 10186, 44, 9);
    for (let k = 0; k < 3; k++) car(142 + k * 6.4, 10232, false, k ? 0xe8c020 : 0x2a6a4a);
    crowd(138, 10230, 40, 3, 16);
  }

  // ---- the sumo hall: a square under a green roof rising to a gold lantern; banners; the drum tower
  {
    const p = plot('kokugikan');
    pave(p.x, p.u, p.w, p.h, 'plaza', 217);
    const [x0, u0, w, h] = [p.x + 2, p.u + 8, 36, 40];
    building(x0, u0, w, h, { face: 6, style: 'plain', wall: 0xe0d8c4, roof: 0x5a9a84, s: 1803, lit: 0.5, top: () => {} });
    queue(FY(u0) + 1, () => {
      const [X0, Y0, rw, rh] = [FX(x0) + 2, FY(u0 + h) + 2, w * S - 4, (h - 6) * S - 4];
      const [cx, cy] = [rw / 2, rh / 2];
      for (let j = 0; j < rh; j++)
        for (let i = 0; i < rw; i++) {
          const [ax, ay] = [Math.abs(i - cx) / cx, Math.abs(j - cy) / cy];
          const d = Math.max(ax, ay);
          let c = 0x5a9a84;
          if (d < 0.2) c = d > 0.16 ? GOLD : (i + j) % 4 < 2 ? 0x7ab8a0 : 0x6aa890;
          else {
            c = shade(c, ax > ay ? (i < cx ? 1.14 : 0.7) : j < cy ? 0.8 : 1.22);
            if (Math.floor(d * 14) !== Math.floor((d + 0.012) * 14)) c = shade(c, 0.7); // the seams, square within square
            if (Math.abs(ax - ay) < 0.02) c = shade(0x5a9a84, 1.4); // the four hips
            if (d > 0.97) c = shade(GOLD, 0.8);
          }
          P(X0 + i, Y0 + j, c);
        }
      ER(X0 + Math.round(cx) - 2, Y0 + Math.round(cy) - 3, 4, 5, 0xffe080);
    });
    halo(FX(x0 + w / 2), FY(u0 + 3), 70, 22, 0xffd8a0, 0.22);
    // banners: tall strips of cloth on poles, each a wrestler's colours
    for (let x = p.x + 3, k = 0; x < p.x + p.w - 2; x += 2.3, k++) {
      if (Math.abs(x - p.x - p.w / 2) < 4) continue;
      mark(x, p.u + 3 + (k % 2) * 0.8, (X, Y) => {
        const c = PAL.cloth[(k * 5) % PAL.cloth.length];
        R(X, Y - 17, 1, 18, 0x4a3a2a);
        for (let j = 0; j < 13; j++) for (let i = 1; i < 4; i++) E(X + i, Y - 17 + j, j < 2 || j > 10 ? 0xf4f0e8 : j % 3 === 1 && i === 2 ? (c === 0xe8e8e8 ? 0x2a2228 : 0xf4f0e8) : shade(c, 0.9));
      });
    }
    // the drum tower: poles lashed together, a hut on top, the drum in it
    mark(p.x + 1.4, p.u + 2, (X, Y) => {
      for (let q = 0; q < 52; q++) {
        P(X - 3 + (q >> 4), Y - q, 0x8a6a48);
        P(X + 3 - (q >> 4), Y - q, 0x6a4a30);
        if (q % 8 === 0) for (let i = -3; i <= 3; i++) P(X + i, Y - q, 0x7a5a3a);
        if (q % 8 < 7) P(X - 2 + ((q % 8) * 5) / 8, Y - q, 0x5a4028);
      }
      R(X - 5, Y - 60, 11, 8, 0x4a3a2a);
      R(X - 6, Y - 62, 13, 3, TILE);
      ER(X - 2, Y - 58, 4, 4, 0xe8d8b0); // the drum's skin
      for (let i = -6; i <= 6; i += 3) E(X + i, Y - 52, i % 2 ? 0xd03a30 : 0xf4f0e8);
    });
    for (const dx of [8, 20, 32]) lampAt(p.x + dx, p.u + 1, WARM);
    crowd(p.x + 2, p.u + 1, p.w - 4, 5, 34);
  }

  // ---- the museum: a great store-house of a building held up over its square on four legs
  {
    const [x0, u0, w, h] = [143, 10314, 37, 96];
    claim(x0, u0, w, h);
    pave(x0, u0, w, h, 'plaza', 218);
    ground(() => {
      for (let u = u0 + 2; u < u0 + h - 2; u += 1 / 3) for (let x = x0 + 2; x < x0 + w - 2; x += 1 / 3) if (FX(x) % 15 === 0 || FY(u) % 15 === 0) P(FX(x), FY(u), 0x8a867c);
    });
    building(x0 + 5, u0 + 22, 28, 60, {
      face: 15, style: 'plain', wall: 0xdcdcd4, roof: 0xb4b8bc, s: 1804, lit: 0.25,
      tiers: [{ in: [3, 8, 3, 8], face: 4, style: 'plain', roof: 0xc4c8cc, tiers: [{ in: [4, 9, 4, 9], face: 4, style: 'plain', roof: 0xd0d4d8, top: () => {} }] }],
    });
    mark(x0 + 5, u0 + 22, (X, Y) => {
      // under it: open, its legs, the lit way up through its floor
      for (let j = 0; j < 20; j++)
        for (let i = 1; i < 83; i++) {
          const leg = (i > 4 && i < 18) || (i > 66 && i < 80);
          if (leg) P(X + i, Y - 20 + j, i === 5 || i === 67 ? 0xe4e4dc : 0xb8b8b0);
          else if (j < 19) E(X + i, Y - 20 + j, j < 3 ? 0x2a2a34 : blend(0x2a2a34, 0xffe8b0, Math.abs(i - 42) < 6 ? 0.8 : 0.12));
        }
      for (let q = 0; q < 18; q++) ER(X + 36 + (q >> 1), Y - 2 - q, 3, 1, 0xe84a40); // the red moving stair
    }, u0 + 22);
    for (const [dx, du] of [[3, 4], [34, 4], [3, 88], [34, 88], [18, 10]]) lampAt(x0 + dx, u0 + du, 0xe0f0ff);
    for (const [dx, du] of [[4, 14], [33, 14], [4, 90], [33, 92]]) tree('broadleaf', x0 + dx, u0 + du, 2.6);
    crowd(x0 + 4, u0 + 3, 30, 16, 26);
  }

  // ---- a garden round a pond: islands, stepping stones across the shallows, a tea house over the water, pines
  {
    const [x0, u0, w, h] = [144, 10434, 36, 144];
    claim(x0, u0, w, h);
    pave(x0, u0, w, h, 'park', 219);
    const isle = (x, u) => Math.hypot((x - 164) / 4.4, (u - 10528) / 7) < 1 || Math.hypot((x - 158) / 3, (u - 10476) / 4.4) < 1;
    const pond = (x, u) => (Math.hypot((x - 162) / 12.4, (u - 10506) / 50) < 1 || Math.hypot((x - 168) / 8, (u - 10548) / 16) < 1) && !isle(x, u);
    ground(() => {
      for (let u = u0; u < u0 + h; u += 1 / 3)
        for (let x = x0; x < 180; x += 1 / 3) {
          const [X, Y] = [FX(x), FY(u)];
          if (x - x0 < 0.67 || u - u0 < 0.67 || u0 + h - u < 0.67) P(X, Y, (X + Y) % 5 ? 0xe8e0d0 : 0x4a5058);
          else if (pond(x, u)) P(X, Y, pond(x - 0.7, u + 0.7) && pond(x + 0.7, u - 0.7) ? ((X + Y * 3) % 9 === 0 ? 0x4a8090 : 0x24505c) : 0x8c887e);
        }
      // stepping stones: across the south bay, and out to the island
      for (let k = 0; k < 9; k++) disc(FX(153 + k * 2.2), FY(10468 + Math.sin(k * 0.9) * 2), 2, (i, j) => (i + j < 0 ? 0xc4c0b4 : 0x9a968a), 2);
      for (let k = 0; k < 5; k++) disc(FX(152.6 + k * 2), FY(10526 + k * 0.4), 2, (i, j) => (i + j < 0 ? 0xc4c0b4 : 0x9a968a), 2);
      // the path round it
      for (let a = 0; a < TAU; a += 0.002) {
        const [x, u] = [162 + Math.cos(a) * 15.4, 10508 + Math.sin(a) * 60];
        if (x < 179 && !pond(x, u)) R(FX(x), FY(u), 3, 3, (FX(x) + FY(u)) % 7 ? 0xbcb29c : 0xa49c88);
      }
    });
    house(160, 10489, 11, 9, { tile: 0x7c6050, wall: 0xe4dccc, lantern: true, s: 1805 }); // the tea house, on posts in the water
    halo(FX(165), FY(10489), 22, 12, 0xffd090, 0.3);
    glint(FX(163), FY(10488) + 2, 14, 0xffd090, 0.6);
    for (const [x, u] of [[150, 10460], [176, 10470], [149, 10520], [176, 10534], [152, 10566], [164, 10528]]) toro(x, u);
    for (let k = 0; k < 150; k++) {
      const [x, u] = [x0 + 2 + rand() * (w - 3), u0 + 2 + rand() * (h - 4)];
      if (pond(x, u) || [3, -3].some((q) => pond(x + q, u) || pond(x, u + q)) || Math.abs(Math.hypot((x - 162) / 15.4, (u - 10508) / 60) - 1) < 0.12 || (x > 157 && x < 173 && u > 10486 && u < 10501)) continue;
      tree(pick(['pine', 'pine', 'broadleaf', 'sakura', 'tiny', 'cedar']), x, u, 2 + rand() * 1.8);
    }
    tree('pine', 164, 10529, 2.6);
    tree('pine', 158, 10477, 1.8);
    crowd(147, 10450, 30, 120, 10);
    const carp = (k) =>
      kit.frame(2, 1, 10500, (put) => {
        for (let i = 0; i < 5; i++) put(i, 1, i < 2 ? 0xf8f8f0 : 0xf07030, 0.85);
        put(5, 1 - k, 0xf07030, 0.7);
        put(5, 1 + k, 0xf07030, 0.7);
      }, true);
    props.wander(162, 10510, 8, 30, [carp(0), carp(1)], { n: 6, sp: 2.2, turn: 'rot', fps: 3, idle: 0.3, d: 0.05 });
  }

  // ---- pleasure boats moored at their jetties north of Ryōgoku's bridge, a boat house
  {
    const u0 = 10262;
    const bx = bankW(u0);
    for (let k = 0; k < 4; k++) {
      const u = u0 + k * 9;
      mark(bx + 0.4, u, (X, Y) => {
        for (let i = 0; i < 20; i++) for (let j = 0; j < 3; j++) P(X + i, Y - 1 + j, j === 2 ? 0x4a3a2a : i % 3 ? 0xa8845c : 0x8a6a48); // the jetty
        boat((i, j, c) => (c === 0xff5038 || c === 0xffe0a0 || c === 0xfff0a0 || c === 0xffd060 ? E : P)(X + 18 + i, Y - 16 + j, c), [0x3a5a4a, 0x5a3a2a, 0x3a4a5a][k % 3]);
        halo(X + 36, Y - 9, 30, 12, 0xff9060, 0.2);
      });
      glint(FX(bx + 12), FY(u) + 4, 12, 0xff8050, 0.5);
    }
  }

  // ---- the fish market: curved sheds one inside another, tuna laid out for the auction, trucks, boats at the quay
  {
    const p = plot('tsukiji');
    pave(p.x, p.u, p.w, p.h, 'apron', 220);
    const [cx, cu] = [p.x + p.w + 3, p.u - 2];
    ground(() => {
      for (let u = p.u; u < p.u + p.h; u += 1 / 3)
        for (let x = p.x; x < p.x + p.w; x += 1 / 3) {
          const [X, Y] = [FX(x), FY(u)];
          const d = Math.hypot((x - cx) * 1.25, u - cu);
          const a = Math.atan2(u - cu, cx - x);
          const band = [[16, 23], [27, 34], [38, 45], [49, 56]].find(([r0, r1]) => d >= r0 && d < r1);
          if (band) {
            const t = (d - band[0]) / (band[1] - band[0]);
            let c = shade(0x6a7a78, t < 0.5 ? 1.12 : 0.84);
            if (Math.floor(a * 60) % 2) c = shade(c, 0.9); // the roofs' ribs
            if (Math.abs(t - 0.5) < 0.07) c = Math.floor(a * 30) % 3 ? 0xffeab0 : 0x8a9a98; // skylights down the ridge
            if (t < 0.05 || t > 0.95) c = 0x343c3c;
            if (c === 0xffeab0) E(X, Y, c);
            else P(X, Y, c);
          } else if (d < 13) {
            // the auction floor: tuna in rows, a number painted on each
            const [gx, gy] = [Math.floor((x - p.x) * 3) % 9, Math.floor((u - p.u) * 3) % 4];
            P(X, Y, gy === 1 && gx > 1 && gx < 8 ? (gx === 7 ? 0x7a8a98 : gx === 4 ? 0xe84a40 : 0xc8d4de) : 0x8a9096);
          } else if (hashPx(X >> 2, Y >> 2, 221) < 0.05) P(X, Y, 0xf4f4f0); // boxes of foam left about
        }
    });
    halo(FX(p.x + p.w - 6), FY(p.u + 6), 30, 26, 0xf0f4ff, 0.22);
    // trucks with a drum for an engine, standing in the lanes
    for (let k = 0; k < 12; k++) {
      const a = 0.25 + (k % 6) * 0.2;
      const r = [25, 36, 47][k % 3];
      const [x, u] = [cx - (Math.cos(a) * r) / 1.25, cu + Math.sin(a) * r];
      if (x < p.x + 1 || u > p.u + p.h - 1) continue;
      mark(x, u, (X, Y) => {
        R(X, Y - 2, 5, 3, 0xe8c020);
        R(X, Y - 4, 2, 2, 0x4a4a52);
        P(X + 3, Y - 3, PAL.skin[k % 3]);
        R(X + 3, Y - 2, 2, 1, 0xf4f4f0);
      });
    }
    crowd(p.x + p.w - 12, p.u + 1, 10, 10, 12);
    crowd(p.x + 2, p.u + 2, 30, 46, 26);
    kit.smoke(p.x + 5, p.u + 44, { rate: 0.7, a: 0.35 });
    // the boats: white hulls, lamps for fishing by night strung over their decks
    for (let k = 0; k < 4; k++) {
      const u = p.u + 6 + k * 11;
      const bx = bankW(u);
      mark(bx + 1, u, (X, Y) => {
        for (let j = 0; j < 9; j++) for (let i = 0; i < 26; i++) if (Math.abs(j - 4) <= 4 - Math.max(0, i - 19) * 0.6) P(X + i, Y - 9 + j, Math.abs(j - 4) > 3 - Math.max(0, i - 19) * 0.6 ? 0x8a94a0 : i < 7 ? 0x5a6a7a : 0xe8ecf0);
        R(X + 2, Y - 8, 5, 6, 0xf4f4f0);
        R(X + 3, Y - 7, 3, 2, 0x2c3a4c);
        for (let i = 9; i < 20; i += 3) E(X + i, Y - 5, 0xfff8e0);
        halo(X + 14, Y - 5, 16, 8, 0xf0f8ff, 0.22);
      });
      glint(FX(bx + 6), FY(u) + 3, 12, 0xf0f8ff, 0.5);
    }
  }

  // ---- Hama-rikyū: the garden where the river meets the bay
  {
    const g = GROUNDS.find((q) => q.id === 'hamarikyu').rect;
    const [x0, u0, w, h] = g;
    const p = plot('nakajima_chaya');
    const pond = (x, u, pad = 0) => Math.hypot((x - 20) / (11 + pad), (u - 10760) / (24 + pad)) < 1;
    const paths = [
      [[20, 10661], [20, 10690], [8, 10712], [6, 10760], [10, 10800], [20, 10822], [20, 10838]],
      [[20, 10690], [33, 10714], [35, 10760], [31, 10800], [20, 10822]],
      [[35, 10744], [39.4, 10744]],
    ];
    for (const pts of paths) ctx.along(pts, 1.4, (n, x, u, X, Y) => (pond(x, u) || x > x0 + w - 0.4 ? null : n.d > 1.05 ? 0x8a8478 : shade(0xc6bca6, 0.94 + hashPx(X, Y, 222) * 0.1)));
    // the bridges of cypress out to the tea house, a rail down each side
    ground(() => {
      for (const [ua, ub] of [[10737, 10756], [10766, 10783]])
        for (let u = ua; u < ub; u += 1 / 3) for (let i = -4; i <= 4; i++) P(FX(20) + i, FY(u), Math.abs(i) === 4 ? 0x5a3a28 : FY(u) % 3 === 0 ? 0x8a6a48 : 0xb08a5c);
      pave(p.x, p.u, p.w, p.h, 'gravel', 223);
      // a field in flower in the south of the garden
      for (let u = 10666; u < 10686; u += 1 / 3)
        for (let x = 24; x < 38; x += 1 / 3) P(FX(x), FY(u), FY(u) % 4 === 0 ? 0x3a6a34 : hashPx(FX(x), FY(u), 224) < 0.55 ? 0xf0d030 : 0x6a9a3c);
    });
    house(p.x + 0.6, p.u + 1.4, 8.8, 7.6, { tile: 0x7c6050, wall: 0xe4dccc, lantern: true, s: 1806 });
    halo(FX(20), FY(10758), 26, 16, 0xffd090, 0.3);
    // the old pine, propped on posts, by the gate
    tree('pine', 12, 10670, 5.4);
    for (const [dx, du] of [[-4, -2], [3, -3], [0, 3]]) mark(12 + dx, 10670 + du, (X, Y) => R(X, Y - 4, 1, 5, 0x8a6a48));
    mark(20, 10661, (X, Y) => {
      // the gate: two great posts of stone and timber
      R(X - 7, Y - 8, 3, 9, 0xa8a49c);
      R(X + 5, Y - 8, 3, 9, 0xa8a49c);
      R(X - 8, Y - 10, 17, 2, 0x4a3a2a);
    });
    // the landing where the boats from up the river put in
    mark(39.6, 10744, (X, Y) => {
      R(X, Y - 2, 12, 5, 0x9aa0a8);
      R(X, Y - 2, 12, 1, 0xd0d4da);
      ER(X + 10, Y - 4, 2, 2, 0xffe8b0);
    });
    glint(FX(44), FY(10744) + 4, 16, 0xffe8b0, 0.5);
    const free = (x, u, pad = 2) => x > x0 + pad && x < x0 + w - pad && u > u0 + pad && u < u0 + h - pad && !pond(x, u, pad) && !paths.some((pts) => near(pts, x, u).d < 1.4 + pad) && !(x > 22 && u < 10688) && Math.hypot(x - 12, u - 10670) > 6 + pad;
    for (let k = 0; k < 420; k++) {
      const [x, u] = [x0 + rand() * w, u0 + rand() * h];
      if (free(x, u, 1.6)) tree(pick(['pine', 'pine', 'pine', 'broadleaf', 'sakura', 'cedar']), x, u, 2.2 + rand() * 2);
    }
    for (const [x, u] of [[22.4, 10664], [22.4, 10692], [5, 10736], [36.6, 10736], [5, 10786], [36.6, 10786], [22.4, 10824], [22.4, 10734], [22.4, 10786]]) lampAt(x, u, WARM);
    for (const [x, u] of [[17.4, 10737.6], [17.4, 10782.6]]) toro(x, u);
    crowd(18.8, 10738, 2.4, 44, 8);
    crowd(4, 10700, 32, 120, 12);
    const duck = (k) =>
      kit.frame(2, 1.34, 10760, (put) => {
        for (let i = 1; i < 5; i++) put(i, 2, i === 1 ? 0x5a4a38 : 0x8a7050);
        for (let i = 2; i < 5; i++) put(i, 3, 0x6a5840);
        put(5, 1 + k, 0x2a6a4a);
        put(0, 3, 0xd0e0f0, 0.5);
      });
    props.wander(26, 10770, 4, 12, [duck(0), duck(1)], { n: 5, sp: 1.4, turn: 'flip', fps: 1, idle: 0.5 });
    props.wander(14, 10748, 4, 10, [duck(0), duck(1)], { n: 4, sp: 1.4, turn: 'flip', fps: 1, idle: 0.5 });
  }

  // ---- on the river: pleasure boats under their lanterns, a water bus, a tug hauling a barge
  {
    const mid = river.chain.map(([x, u]) => [x, u]).slice(1);
    mid.push([90, 10850]);
    const lane = (d) => kit.offset(mid, d);
    const wake = [0, 1, 2].map((k) =>
      kit.frame(7, 5, 10000, (put) => {
        for (let i = 0; i < 20 - k * 3; i++) {
          const y = Math.round((i * (3 + k)) / 9);
          put(20 - i, 7 - y, 0xc8dcec, 0.5 - k * 0.14 - i * 0.012);
          put(20 - i, 7 + y, 0xc8dcec, 0.5 - k * 0.14 - i * 0.012);
        }
      }, true));
    const yakata = [0x3a5a4a, 0x5a3a2a, 0x3a4a5a, 0x4a3a50].map((c) => kit.frame(15, 5, 10000, (put) => boat(put, c), true));
    props.path(lane(14), [yakata[0], yakata[1], yakata[2]], { sp: 5, n: 3, gap: 330, mode: 'wrap', turn: 'rot', cars: 1, s0: 0.1, d: -0.4, wake: { f: wake, every: 9, life: 2.4 } });
    props.path(kit.offset([...mid].reverse(), 13), [yakata[3], yakata[0], yakata[2]], { sp: 4.4, n: 3, gap: 380, mode: 'wrap', turn: 'rot', cars: 1, s0: 0.5, d: -0.4, wake: { f: wake, every: 9, life: 2.4 } });
    props.path(lane(-4), [yakata[1]], { sp: 5.6, n: 1, mode: 'wrap', turn: 'rot', s0: 0.75, d: -0.4, wake: { f: wake, every: 9, life: 2.4 } });
    // the water bus: low, all glass, lit from inside
    const bus = kit.frame(18, 5, 10000, (put) => {
      for (let j = 0; j < 13; j++)
        for (let i = 0; i < 52; i++) {
          const taper = i > 36 ? ((i - 36) / 16) ** 1.5 * 6 : i < 4 ? (4 - i) * 0.7 : 0;
          if (Math.abs(j - 6) > 6 - taper) continue;
          const edge = Math.abs(j - 6) > 5 - taper;
          put(i, j + 1, edge ? 0xb8c0cc : i > 6 && i < 44 && (i % 6 === 0 || j === 6) ? 0xe8f0f8 : i > 6 && i < 44 ? ((i + j) % 4 === 0 ? 0xfff0c0 : 0x8ad8f0) : 0xf4f4f0);
        }
    }, true);
    props.path(kit.offset([...mid].reverse(), 2), [bus], { sp: 11, n: 1, mode: 'wrap', turn: 'rot', s0: 0.3, d: -0.4, wake: { f: wake, every: 8, life: 2.6 } });
    // a tug, and the barge of gravel on its line
    const tug = kit.frame(7, 4, 10000, (put) => {
      for (let j = 0; j < 9; j++) for (let i = 0; i < 20; i++) if (Math.abs(j - 4) <= 4 - Math.max(0, i - 14) * 0.7) put(i, j + 1, Math.abs(j - 4) > 3 - Math.max(0, i - 14) * 0.7 ? 0x1c1c22 : 0x5a2a20);
      for (let j = 3; j < 8; j++) for (let i = 6; i < 13; i++) put(i, j, j === 3 ? 0xf4f4f0 : i === 12 ? 0xffe8a0 : 0xd8d8d0);
      put(4, 5, 0x2a2a30);
      put(4, 6, 0x2a2a30);
      put(18, 5, 0x40ff80);
    }, true);
    const barge = kit.frame(13, 5, 10000, (put) => {
      for (let j = 0; j < 13; j++) for (let i = 0; i < 38; i++) put(i, j + 1, i === 0 || i === 37 || j === 0 || j === 12 ? 0x1c1c22 : j === 1 || j === 11 || i < 3 || i > 34 ? 0x4a4e58 : hashPx(i, j, 225) < 0.5 ? 0x6a665c : 0x7a766a);
      put(36, 2, 0xff4030);
      put(36, 12, 0x40ff80);
    }, true);
    props.path(lane(-16), [tug, barge], { sp: 6, n: 2, gap: 15, mode: 'wrap', turn: 'rot', cars: 1, s0: 0.62, d: -0.4, wake: { f: wake, every: 10, life: 2 } });
  }

  // ---- the blocks along both banks
  const mouth = (x, u) => u > 10596 && x > 140;
  for (const b of blocks(9500, 10760, 6, 8, true)) {
    for (const [x, u, w, h] of lots(b, rand, { depth: [12, 20], width: [9, 16], small: true })) {
      if (w < 6 || h < 7) continue;
      const v = rand();
      if (mouth(x, u) && w >= 9 && h >= 12) {
        // the towers at the river's mouth: forty floors of flats over the water
        building(x, u, w - 1, h, { style: pick(['balcony', 'glass', 'balcony']), wall: pick([0xd8d4cc, 0xc8ccd0, 0xbcb4a8]), face: Math.min(h - 5, 14 + Math.floor(rand() * 8)), heli: 0.7, lit: 0.6 });
      } else if (v < 0.42) building(x, u, w - 1, h, { style: pick(['office', 'balcony', 'plain', 'balcony', 'glass']), face: Math.min(h - 4, 5 + Math.floor(rand() * 8)), shop: rand() < 0.5, sign: rand() < 0.4, heli: 0.1 });
      else if (v < 0.76) house(x, u, w - 1, h - 1, { hip: rand() < 0.6, lantern: rand() < 0.4 });
      else if (v < 0.86) {
        // an eating house of the wrestlers' quarter: a broad roof, a row of lanterns, a banner
        house(x, u, w - 1, h - 1, { tile: pick([0x525866, 0x7c6050]), wall: 0x8a6a50, hip: false });
        for (let i = 1.5; i < w - 2; i += 2.4) lanternAt(x + i, u + 0.4, 0xe0402a);
      } else if (v < 0.95) {
        // a warehouse on the quay: a long roof of sheet, a door for carts
        building(x, u, w - 1, h, { style: 'plain', wall: 0x9a8e80, roof: pick([0x6a7a78, 0x7a6a5c, 0x5a6670]), face: 4, lit: 0.2, top: ({ X, Y, w: rw, h: rh, R: rect }) => {
          for (let i = 0; i < rw; i += 3) rect(X + i, Y, 1, rh, 0x4a5456);
          rect(X, Y + (rh >> 1), rw, 1, 0xa8b4b2);
        } });
      } else {
        pave(x, u, w - 1, h - 1, 'asphalt');
        for (let i = 3; i < w - 3; i += 4) if (rand() < 0.6) car(x + i, u + h - 5, true);
        lampAt(x + 1, u + h - 1);
      }
    }
  }
  for (const [x, u, w, h] of blocks(9500, 10760, 4, 5, true)) {
    if (w >= 6 && h >= 7) house(x, u, w - 0.67, Math.min(h, 12) - 0.67, { hip: false, lantern: true });
    else {
      pave(x, u, w - 0.67, h - 0.67, 'park');
      for (let k = 0; k < 1 + Math.floor((w * h) / 40); k++) tree(pick(['broadleaf', 'tiny', 'sakura']), x + 1.2 + rand() * Math.max(0.5, w - 2.4), u + 1.2 + rand() * Math.max(0.5, h - 2.4), 1.6 + rand());
    }
  }
  for (let u = 9520; u < 10580; u += 24) {
    const pts = road('edo_dori').pts;
    const n = near(pts, 26, u);
    const x = pts[n.seg][0] + (pts[n.seg + 1][0] - pts[n.seg][0]) * n.t;
    if (!crossing(u, 4)) lampAt(x + (u % 48 < 24 ? -5.6 : 5.6), u, WARM);
  }
  void RED;
  void string;
  void house;
}
