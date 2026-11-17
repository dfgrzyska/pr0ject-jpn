// Tokyo Bay (u 10760-11450), at night: the water between the mouth of the Sumida and Odaiba.
//   Takeshiba's pier: the ferry terminal with its mast and sail, palms, the island ferry moored alongside, a
//     jetfoil at the end;
//   Shibaura: the loop the cars climb to the bridge, warehouses, the bridge's west anchorage;
//   the Rainbow Bridge: two white towers, the cables sagging between them hung with lamps that change their
//     colours now and then, the truss under the deck, its piers in the water, its lights lying on the bay;
//   the forts: the third, a park in its stone walls - the earthworks with pines, the old cannons, the magazine,
//     the barracks' footings - reached along a causeway from the beach; the sixth, wild, gone to forest;
//   buoys blinking along the channel.
// Live: the bridge's lamps, cars climbing the loop and crossing, the automated line's trains coming off the
// bridge, a container ship, an island ferry, a water bus to Odaiba and back, pleasure boats, a tug and its barge,
// night fishing boats, gulls, the chop on the water.
import { PAL, shade, blend } from './kit.mjs';
import { makeWafu, WARM } from './wafu.mjs';
import { makeUmi, containerShip, ferry, waterBus, tug, barge, fishingBoat } from './umi.mjs';
import { yakata } from './wafu.mjs';
import { hashPx } from '../hires.mjs';

const TAU = Math.PI * 2;

export function bay(ctx) {
  const { kit, pave, claim, props, S, L, W } = ctx;
  const { building, tree, crowd, mark, ground, rand, pick, P, R, E, ER, halo, FX, FY, queue, glint } = kit;
  kit.setSun(0.1);
  const { lampAt } = makeWafu(ctx);
  const U = makeUmi(ctx);
  const hi = ctx.img.hi;
  const FW = W * S;
  const wetAt = (x, u) => x >= 0 && x < W && ctx.wet[Math.max(0, Math.min(L * S - 1, FY(u))) * FW + FX(x)] === 1;
  const drop = (X, Y, w, n = 2) => {
    for (let k = 1; k <= n; k++) for (let i = 0; i < w; i++) hi.tint(X + i + k, Y + k, 0.72);
  };
  /** Lamps along a quay from (x0, u0) to (x1, u1), every `step`, their light lying on the water beside. */
  const quay = (x0, u0, x1, u1, step, side) => {
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, u1 - u0) / step));
    for (let k = 0; k <= n; k++) {
      const [x, u] = [x0 + ((x1 - x0) * k) / n, u0 + ((u1 - u0) * k) / n];
      lampAt(x, u, WARM);
      glint(FX(x + side[0] * 2), FY(u + side[1] * 2) + 2, 18, 0xffe0a0, 0.45);
    }
  };

  // ---- Takeshiba: the terminal, its mast with a sail of cloth, palms on the forecourt, the island ferry alongside
  {
    building(2, 10898, 22, 24, {
      face: 6, style: 'glass', glass: [0x2a3a58, 0x8eaed4], roof: 0x8a8e96, shop: true, s: 1901, lit: 0.8,
      top: ({ X, Y, w, h, ac, R: rect, E: lit }) => {
        for (let j = 4; j < h - 4; j++) for (let i = 4; i < 22; i++) (j % 5 === 0 || i % 6 === 4 ? rect : (x, y, a, b, c) => lit(x, y, c))(X + i, Y + j, 1, 1, j % 5 === 0 || i % 6 === 4 ? 0xdfe6ea : 0xb0d8e8);
        for (let k = 0; k < 6; k++) ac(X + 30 + (k % 3) * 7, Y + 8 + Math.floor(k / 3) * 9);
      },
    });
    mark(18, 10921, (X, Y) => {
      // the mast: a white spar from the roof, a sail of cloth bellied out from it, a lamp at the head
      for (let q = 0; q < 46; q++) P(X, Y - q, q % 6 < 3 ? 0xf4f4f0 : 0xd8dce0);
      for (let j = 0; j < 30; j++) for (let i = 1; i < Math.round(14 * Math.sin(((j + 2) / 34) * Math.PI)); i++) E(X + i, Y - 44 + j, i % 4 === 0 ? 0xd8e0e8 : blend(0xe8eef4, 0x9ac8e8, i / 16));
      ER(X - 1, Y - 48, 3, 2, 0xff4030);
      halo(X + 6, Y - 30, 26, 28, 0xc8e0ff, 0.18);
    }, 10898);
    for (const [x, u] of [[4, 10884], [12, 10886], [20, 10884], [27, 10890], [4, 10894], [27, 10926]]) U.palm(x, u);
    for (const [x, u] of [[8, 10882], [16, 10882], [24, 10882]]) lampAt(x, u, WARM);
    crowd(2, 10882, 26, 12, 22);
    crowd(26, 10900, 3, 26, 8);
    // the ferry alongside, its gangway down to the pier; a jetfoil at the end
    queue(FY(10883), () => U.shipAt(ferry, FX(30.8), FY(10883), 150, 30, 'n', 150, 30, 5));
    mark(29.6, 10912, (X, Y) => {
      R(X, Y - 2, 5, 3, 0x9aa0a8);
      R(X, Y - 2, 5, 1, 0xd0d4da);
    });
    for (let u = 10886; u < 10932; u += 6) glint(FX(41.4), FY(u), 22, 0xfff0c8, 0.5);
    queue(FY(10931), () => {
      const [X, Y] = [FX(4), FY(10931)];
      for (let j = 0; j < 9; j++)
        for (let i = 0; i < 32; i++) {
          const taper = i > 24 ? (i - 24) * 0.55 : 0;
          if (Math.abs(j - 4) > 4 - taper) continue;
          const edge = Math.abs(j - 4) > 3 - taper;
          (edge || i % 5 ? P : E)(X + i, Y - 9 + j, edge ? 0x2a5aa8 : j === 4 ? 0x2a5aa8 : i % 5 ? 0xe8ecf0 : 0xfff0c8);
        }
    });
    quay(1, 10879.6, 29, 10879.6, 7, [0, -1]);
    quay(29.6, 10882, 29.6, 10928, 9, [1, 0]);
    quay(1, 10930.4, 22, 10930.4, 7, [0, 1]);
  }

  // ---- Shibaura: the loop, warehouses along the quay, the anchorage
  const LOOP = [18, 11004];
  {
    const [cx, cu] = LOOP;
    claim(0, 10966, 38, 100);
    // the street under it, from the loop's foot to the edge of the strip
    ground(() => {
      for (let u = 10989; u < 10997; u += 1 / 3) for (let x = 0; x < 20; x += 1 / 3) P(FX(x), FY(u), Math.abs(u - 10993) < 0.2 && Math.floor(x * 3) % 6 < 3 ? 0xd8d4c4 : shade(0x4a4c54, 0.96 + hashPx(FX(x), FY(u), 231) * 0.08));
      // the lawn inside it
      for (let u = cu - 8; u < cu + 8; u += 1 / 3)
        for (let x = cx - 8; x < cx + 8; x += 1 / 3) if (Math.hypot(x - cx, u - cu) < 7.6) P(FX(x), FY(u), shade(0x4f7c40, 0.95 + hashPx(FX(x), FY(u), 232) * 0.12));
    });
    for (const [dx, du] of [[-3, 2], [3, -3], [0, 4], [-4, -3]]) tree('broadleaf', cx + dx, cu + du, 2.2);
    // the deck of the loop and the ramp up to the bridge: lifted, its shadow to the lower right
    const onDeck = (x, u) => {
      const r = Math.hypot(x - cx, u - cu);
      return (r >= 8 && r <= 14) || (x >= 26 && x <= 32 && u >= cu && u <= 11044);
    };
    const edgeDeck = (x, u) => {
      const r = Math.hypot(x - cx, u - cu);
      const ramp = x >= 26 && x <= 32 && u >= cu && u <= 11044;
      if (ramp && (x - 26 < 0.6 || 32 - x < 0.6) && !(r >= 8 && r <= 14)) return true;
      return !ramp && (r - 8 < 0.6 || 14 - r < 0.6);
    };
    queue(FY(cu - 14) + 1, () => {
      for (let u = cu - 14; u < 11044; u += 1 / 3)
        for (let x = cx - 14; x <= 32; x += 1 / 3) {
          if (!onDeck(x, u)) continue;
          const [X, Y] = [FX(x), FY(u)];
          if (!onDeck(x - 2, u + 2)) for (let k = 1; k <= 6; k++) hi.tint(X + k, Y + k, 0.9); // (its shadow, laid as it is painted)
          const r = Math.hypot(x - cx, u - cu);
          const lane = x >= 26 && u > cu + 2 ? Math.abs(x - 29) < 0.2 : Math.abs(r - 11) < 0.2;
          P(X, Y, edgeDeck(x, u) ? 0xcfd0cc : lane && Math.floor((Math.atan2(u - cu, x - cx) * 30 + u * 3) % 6) < 3 ? 0xdedad0 : shade(0x52545c, 0.96 + hashPx(X, Y, 233) * 0.08));
        }
    });
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU + 0.4;
      lampAt(cx + Math.cos(a) * 14.6, cu + Math.sin(a) * 14.6, 0xfff0d8);
    }
    for (let u = cu + 10; u < 11040; u += 9) lampAt(32.6, u, 0xfff0d8);
    // warehouses along the east quay, the anchorage north of the deck
    building(33, 10968, 4.6, 30, { face: 3, style: 'plain', wall: 0x9a8e80, roof: 0x6a7a78, s: 1902, lit: 0.3 });
    building(33, 11002, 4.6, 32, { face: 3, style: 'plain', wall: 0x8a8478, roof: 0x7a6a5c, s: 1903, lit: 0.3 });
    building(1, 11057, 16, 8, { face: 4, style: 'plain', wall: 0xb8b4ac, roof: 0x9a968e, s: 1904, lit: 0, top: () => {} });
    building(3, 11034, 12, 8, { face: 3, style: 'plain', wall: 0xb8b4ac, roof: 0x9a968e, s: 1905, lit: 0, top: () => {} });
    quay(37.6, 10970, 37.6, 11062, 12, [1, 0]);
    quay(2, 10966.4, 30, 10966.4, 9, [0, -1]);
    pave(1, 10968, 2.6, 18, 'asphalt');
    for (let k = 0; k < 3; k++) kit.car(2.4, 10972 + k * 5, true);
  }

  // ---- the Rainbow Bridge
  const H = 46; // (the towers' height, in the strip's units: a point z up is drawn z up the strip)
  const [TL, TR, UN, US] = [47, 133, 11057.5, 11042.5];
  const zAt = (x) => (x < TL ? H * Math.max(0, (x - 8) / (TL - 8)) ** 1.5 : x > TR ? H * Math.max(0, (222 - x) / (222 - TR)) ** 1.5 : 5 + (H - 5) * ((x - 90) / (TR - 90)) ** 2);
  const lampsOn = []; // [X, Y, along]: the cables' lamps, for the frames that colour them
  {
    // the truss under the deck's south edge, its piers standing in the water
    const YS = FY(11044);
    queue(YS + 20, () => {
      for (let X = 0; X < FW; X++) {
        for (let j = 0; j < 6; j++) {
          const m = X % 12;
          const diag = j === Math.round((m / 12) * 5) || j === 5 - Math.round((m / 12) * 5);
          if (j === 0 || j === 5 || m === 0 || diag) P(X, YS + j, j === 0 ? 0xe4e8ec : shade(0xc8ccd4, 0.8 + j * 0.03));
        }
        if (X % 9 === 0) E(X, YS - 1, 0xfff0d0);
      }
      const pier = (x) => {
        const X = FX(x);
        for (let j = 6; j < 26; j++) for (let i = -4; i <= 4; i++) if (wetAt(x, 11044 - j / S)) P(X + i, YS + j, i === -4 ? 0xd4d0c4 : i === 4 ? 0x7a766c : j === 25 ? 0x5a564e : 0xa8a498);
      };
      for (let x = 146; x < 182; x += 14) pier(x);
      pier(40);
    });
    // the towers: two columns each (the north one behind), banded where the beams cross, floodlit
    for (const tx of [TL, TR]) {
      const X0 = FX(tx) - 6;
      queue(FY(11038), () => {
        for (const [ub, front] of [[11059, false], [11041, true]]) {
          const YB = FY(ub);
          for (let j = 0; j < H * S + 4; j++)
            for (let i = 0; i < 12; i++) {
              const z = j / S;
              const band = Math.abs(z - H) < 2 || Math.abs(z - H * 0.55) < 1.4;
              let c = i < 2 ? 0xffffff : i > 9 ? 0xa8b4c4 : i > 7 ? 0xc8d0dc : 0xe4eaf2;
              if (band) c = shade(c, i > 7 ? 0.9 : 1.08);
              if (!front) c = shade(c, 0.86);
              if (j === H * S + 3) c = 0x9aa4b0;
              (i < 8 ? E : P)(X0 + i, YB - j, c);
            }
          ER(X0 + 4, YB - H * S - 6, 4, 2, 0xff4030); // (the lamps for the aircraft)
        }
        for (let j = 0; j < FY(11041) - FY(11059); j++) for (const z of [H * S - 4, Math.round(H * S * 0.55)]) for (let i = 1; i < 11; i++) P(X0 + i, FY(11041) - z - j, i < 8 ? 0xd8e0ea : 0xa8b4c4);
      });
      halo(FX(tx), FY(11050) - H * S * 0.6, 34, H * S * 0.7, 0xc8dcff, 0.14);
      for (const ub of [11059, 11041]) {
        const red = kit.frame(1.34, 0.67, 11050, (put) => {
          for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) put(i, j, 0xff3020);
        }, true);
        props.loop((FX(tx) - 2) / S, L - (FY(ub) - H * S - 6) / S, [red], { fps: 1, seq: [0, -1], ph: tx * 0.01, d: 0.15 });
      }
    }
    for (const uc of [UN, US]) for (let X = FX(8) + ((4 - FX(8)) % 9 + 9) % 9; X < FW; X += 9) lampsOn.push([X, Math.round(FY(uc) - zAt(X / S) * S) - 1, X / S]);
    // the cables, sagging from tower to tower and down to the anchorages, hangers to the deck, lamps along them
    queue(FY(11038) + 1, () => {
      for (const [uc, f] of [[UN, 0.8], [US, 1]]) {
        const YD = FY(uc);
        let last = null;
        for (let X = FX(8); X < FW; X++) {
          const x = X / S;
          const Y = Math.round(YD - zAt(x) * S);
          if (last !== null) for (let y = Math.min(last, Y); y <= Math.max(last, Y); y++) P(X, y, shade(0xe8eef4, f));
          P(X, Y + 1, shade(0xa8b4c4, f));
          last = Y;
          if (X % 6 === 0 && Math.abs(x - TL) > 2 && Math.abs(x - TR) > 2) for (let y = Y + 2; y < YD; y++) P(X, y, shade(0x8a96a8, f));
          if (X % 9 === 4) {
            E(X, Y - 1, 0xf4f8ff);
            E(X, Y, 0xf4f8ff);
          }
        }
      }
      // the anchorage's blocks where the west cables end
      for (const ub of [11061, 11039]) {
        const [X, Y] = [FX(6), FY(ub)];
        R(X - 6, Y - 12, 14, 13, 0xb8b4ac);
        R(X - 6, Y - 12, 14, 2, 0xd8d4cc);
        R(X + 6, Y - 12, 2, 13, 0x8a8680);
      }
    });
    for (let x = 4; x < 180; x += 8) {
      const z = zAt(x);
      if (wetAt(x, 11040)) glint(FX(x), FY(11040), 30 + Math.round(z * 0.4), 0xe8f0ff, 0.55);
    }
    // now and then the lamps change: the colours of the rainbow along the span, cool blue, warm gold
    const top = FY(UN) - H * S - 4;
    const fh = FY(US) + 3 - top;
    const scheme = (k) =>
      kit.frame(W, fh / S, 11050, (put) => {
        for (const [X, Y, x] of lampsOn) {
          const c =
            k === 0 ? [0xff4040, 0xff9030, 0xffe040, 0x40e060, 0x40a0ff, 0x6060ff, 0xc060ff][Math.min(6, Math.max(0, Math.floor(((x - 8) / 172) * 7)))]
              : k === 1 ? (Math.floor(x / 6) % 2 ? 0x80c0ff : 0xe8f4ff)
              : Math.floor(x / 9) % 3 ? 0xffd070 : 0xfff4d0;
          put(X, Y - top, c);
          put(X, Y + 1 - top, c);
        }
      }, true);
    props.loop(0, L - top / S, [scheme(0), scheme(1), scheme(2)], { fps: 0.5, seq: [-1, -1, -1, 0, 0, 0, -1, -1, -1, 1, 1, -1, -1, -1, 2, 2], d: 0.15 });
    ctx.cover(0, 11036, W, H + 26, 0.1); // (over the boats and the trains under it; the cars run over it)
  }

  // ---- the cars: up the loop and over, back and down; and straight across on the outer lanes
  {
    const [cx, cu] = LOOP;
    const arc = (r, a0, a1) => {
      const out = [];
      const n = Math.ceil(Math.abs(a1 - a0) / 0.18);
      for (let k = 0; k <= n; k++) {
        const a = a0 + ((a1 - a0) * k) / n;
        out.push([cx + Math.cos(a) * r, cu + Math.sin(a) * r]);
      }
      return out;
    };
    const east = [[-12, 10991.5], [cx, 10991.5], ...arc(12.5, -Math.PI / 2, TAU).slice(1), [30.5, 11036], [32, 11046], [37, 11051.5], [192, 11051.5]];
    const west = [[192, 11048.5], [35, 11048.5], [27.5, 11040], ...arc(9.5, 0, -TAU - Math.PI / 2), [-12, 10994.5]];
    kit.trafficOn(east, { sp: 18, gap: 46, u: 11040, d: 0.2 });
    kit.trafficOn(west, { sp: 17, gap: 52, u: 11040, d: 0.2 });
    kit.trafficOn([[-12, 11054.5], [192, 11054.5]], { sp: 24, gap: 70, u: 11050, d: 0.2 });
    kit.trafficOn([[192, 11045.5], [-12, 11045.5]], { sp: 23, gap: 76, u: 11050, d: 0.2 });
  }

  // ---- the automated line's trains, off the bridge's lower deck and up the guideway to Odaiba (and back)
  {
    const line = [[40, 11050], [146, 11050], [150, 11056], [150, 12000], [140, 12040], [110, 12048], [-60, 12048]];
    kit.trainOn(kit.offset(line, 3), 0x3a9ad8, { n: 6, sp: 22, s0: 0.15, u: 11600 });
    kit.trainOn(kit.offset([...line].reverse(), 3), 0x3a9ad8, { n: 6, sp: 22, s0: 0.65, u: 11600 });
    ctx.cover(144, 11057, 12, 393, -0.3); // (the guideway over the boats passing under it)
  }

  // ---- the guideway's piers standing in the water: a cap under the beams, the column seen between them
  ground(() => {
    for (let u = 11076; u < 11450; u += 21) {
      if (!wetAt(150, u) && !wetAt(144, u)) continue;
      for (let j = -5; j <= 5; j++)
        for (let i = -16; i <= 16; i++) {
          const [X, Y] = [FX(150) + i, FY(u) + j];
          const between = Math.abs(i) <= 4;
          if (!(between || (!hi.alpha(X, Y) && Math.abs(j) <= 2))) continue;
          if (!between && Math.abs(i) > 16) continue;
          P(X, Y, Math.abs(j) <= 2 ? (j === -2 ? 0xd8d4cc : j === 2 ? 0x7a766c : 0xb4b0a6) : between ? (i < 0 ? 0xa4a094 : 0x8a867c) : 0xb4b0a6);
        }
      glint(FX(150) - 18, FY(u) + 4, 12, 0xd8e0e8, 0.25);
    }
  });

  // ---- the third fort: stone walls, the earthworks with pines on them, the cannons, the magazine, the footings
  {
    const [fx, fu, rx, ru] = [56, 11270, 22, 18];
    const dE = (x, u) => Math.hypot((x - fx) / rx, (u - fu) / ru);
    const gap = (x, u) => Math.abs(x - fx) < 2.4 && u > fu;
    ground(() => {
      for (let u = fu - ru; u < fu + ru + 14; u += 1 / 3)
        for (let x = fx - rx; x < fx + rx; x += 1 / 3) {
          const d = dE(x, u);
          if (d > 1) continue;
          const [X, Y] = [FX(x), FY(u)];
          let c;
          if (gap(x, u) && d > 0.5) c = (X + Y) % 6 === 0 ? 0x9a948a : shade(0xbcb29c, 0.95 + hashPx(X, Y, 241) * 0.08);
          else if (d > 0.9) c = (Y % 4 === 0 || (X + (Math.floor(Y / 4) % 2) * 3) % 6 === 0) ? 0x6e6a60 : shade(0x9a968a, 0.92 + hashPx(X, Y, 242) * 0.14); // the wall of cut stone
          else if (d > 0.6) {
            // the earthwork: lit on its outer slope to the upper left, dark on its inner
            const t = (d - 0.6) / 0.3;
            const lit = -((x - fx) / rx + (fu - u) / ru) > 0 ? 1 : 0.86;
            c = shade(0x5a8a48, (t > 0.5 ? 1.1 * lit : 0.82) + hashPx(X, Y, 243) * 0.08);
            if (Math.abs(t - 0.5) < 0.06) c = shade(0x6a9a54, 1.12);
          } else c = Math.abs(d - 0.48) < 0.03 ? 0xb4ac98 : shade(0x4f7c40, 0.95 + hashPx(X, Y, 244) * 0.1); // the lawn, a path round it
          P(X, Y, c);
        }
      // the footings of the barracks and the old well
      for (const [x, u, w, h] of [[50, 11262, 14, 5], [58, 11272, 12, 5], [44, 11272, 8, 4]])
        for (let j = 0; j < h * S; j++) for (let i = 0; i < w * S; i++) if (Math.min(i, j, w * S - 1 - i, h * S - 1 - j) < 2) P(FX(x) + i, FY(u + h) + j, 0xa8a294);
      for (let a = 0; a < TAU; a += 0.1) P(FX(66) + Math.round(Math.cos(a) * 4), FY(11262) + Math.round(Math.sin(a) * 3), 0x8a8478);
    });
    // the magazine: stone, a roof of tiles
    kit.house(40, 11262, 7, 6, { tile: 0x5a606a, wall: 0xa8a294, hip: false, s: 1906 });
    // the cannons on the south rampart, looking out to sea
    for (const x of [48, 64])
      mark(x, 11257, (X, Y) => {
        drop(X - 3, Y + 1, 7);
        R(X - 3, Y - 3, 7, 4, 0x6a4a30); // the carriage
        R(X - 3, Y + 1, 2, 1, 0x3a2a20);
        R(X + 2, Y + 1, 2, 1, 0x3a2a20);
        R(X - 1, Y - 2, 3, 9, 0x2a2a30); // the barrel, its mouth toward us
        P(X - 1, Y - 2, 0x4a4a52);
        P(X, Y + 6, 0x101014);
      });
    // pines round the rampart, lamps on the paths
    for (let k = 0; k < 22; k++) {
      const a = (k / 22) * TAU;
      const [x, u] = [fx + Math.cos(a) * rx * 0.75, fu + Math.sin(a) * ru * 0.75];
      if (gap(x, u) || (u < fu - ru * 0.6 && (Math.abs(x - 48) < 4 || Math.abs(x - 64) < 4))) continue;
      tree(k % 3 ? 'pine' : 'broadleaf', x, u, 2.2 + rand() * 1.2);
    }
    for (const [x, u] of [[53.4, 11284], [58.6, 11280], [56, 11270], [45, 11270], [67, 11270], [56, 11260]]) lampAt(x, u, WARM);
    crowd(44, 11258, 24, 18, 14);
    // the causeway from the beach: the path, trees down both sides, lamps
    for (let u = 11290; u < 11462; u += 5.6) {
      tree(u % 11.2 < 5.6 ? 'pine' : 'broadleaf', 52.6, u, 1.6 + rand() * 0.6);
      tree(u % 11.2 < 5.6 ? 'broadleaf' : 'pine', 59.4, u + 2.8, 1.6 + rand() * 0.6);
    }
    for (let u = 11294; u < 11462; u += 14) {
      lampAt(54, u, WARM);
      glint(FX(50.4), FY(u), 16, 0xffe0a0, 0.4);
      glint(FX(61.6), FY(u + 7), 16, 0xffe0a0, 0.4);
    }
    crowd(54.6, 11290, 2.8, 170, 22);
  }

  // ---- the sixth fort: no way out to it, gone wild - a broken wall round a wood, birds on the stones
  {
    const [fx, fu, rx, ru] = [136, 11200, 16, 13];
    const dE = (x, u) => Math.hypot((x - fx) / rx, (u - fu) / ru);
    ground(() => {
      for (let u = fu - ru; u < fu + ru; u += 1 / 3)
        for (let x = fx - rx; x < 143.6; x += 1 / 3) {
          const d = dE(x, u);
          if (d > 1) continue;
          const [X, Y] = [FX(x), FY(u)];
          if (d > 0.86) P(X, Y, hashPx(X >> 1, Y >> 1, 245) < 0.2 ? 0x3a5a34 : (Y % 4 === 0 ? 0x5e5a52 : shade(0x86827a, 0.9 + hashPx(X, Y, 246) * 0.14)));
        }
    });
    for (let k = 0; k < 70; k++) {
      const [x, u] = [fx - rx + rand() * (rx + 6), fu - ru + rand() * ru * 2];
      if (dE(x, u) > 0.78 || x > 141.4) continue;
      tree(pick(['broadleaf', 'broadleaf', 'cedar', 'pine', 'tiny']), x, u, 1.8 + rand() * 1.6);
    }
    const heron = (k) =>
      kit.frame(1.67, 2, 11200, (put) => {
        for (let j = 1; j < 5; j++) put(1, j, 0xe8ecf0);
        put(2, 1, 0xe8ecf0);
        put(3, 0 + k, 0xe0b030);
        put(1, 5, 0x5a5e66);
        put(0, 3, 0xc8ccd4);
      });
    props.wander(128, 11200, 8, 11, [heron(0), heron(1)], { n: 3, sp: 0.6, turn: 'flip', fps: 1, idle: 0.8, d: 0.05 });
  }

  // ---- buoys along the channel under the bridge's middle
  for (const [u, dx] of [[10990, 0], [11170, 4], [11340, 10]]) {
    U.buoy(76 + dx, u, 0xe03028);
    U.buoy(106 + dx, u + 4, 0x20c050);
  }

  // ---- on the water
  {
    const sail = (f, pts, o) => props.path(pts, f, { mode: 'wrap', turn: 'rot', d: -0.4, ...o });
    // a container ship, slow across the bay north of the bridge
    sail([U.shipFrame(containerShip, 216, 42, 11140, 216, 42, 7)], [[270, 11140], [-90, 11140]], { sp: 4.2, n: 1, s0: 0.42, wake: { f: U.wake, every: 14, life: 3 } });
    // the island ferry, out between the piers
    sail([U.shipFrame(ferry, 150, 30, 10948, 150, 30, 3)], [[-60, 10948], [250, 10948]], { sp: 5.6, n: 1, s0: 0.3, wake: { f: U.wake, every: 12, life: 3 } });
    // the water bus from the landing at Hama-rikyū under the bridge to Odaiba's pontoon, and back
    props.path([[46, 10744], [62, 10800], [88, 10900], [92, 11000], [92, 11110], [96, 11220], [108, 11330], [120, 11406]], [U.shipFrame(waterBus, 56, 15, 11000, 56, 15)], { sp: 9, n: 1, mode: 'pp', hold: 5, turn: 'rot', s0: 0.2, d: -0.4, wake: { f: U.wake, every: 9, life: 2.4 } });
    // pleasure boats drifting south of the fort, night fishing boats by the beach, a tug and its barge
    const yak = [0x3a5a4a, 0x5a3a2a, 0x3a4a5a].map((c) => U.shipFrame((put) => yakata(put, c), 45, 15, 11200));
    props.wander(36, 11192, 22, 14, yak, { n: 3, sp: 2, turn: 'rot', fps: 1, idle: 0.4, d: -0.4 });
    props.wander(22, 11384, 12, 34, [U.shipFrame(fishingBoat, 27, 9, 11380)], { n: 3, sp: 1.6, turn: 'rot', fps: 1, idle: 0.5, d: -0.4 });
    for (let k = 0; k < 3; k++) glint(FX(14 + k * 9), FY(11372 + k * 16), 14, 0xf0f8ff, 0.3);
    props.path([[200, 11336], [160, 11326], [112, 11344]], [U.shipFrame(tug, 20, 9, 11330), U.shipFrame(barge, 38, 13, 11330, true)], { sp: 4, n: 2, gap: 14, mode: 'pp', hold: 6, turn: 'rot', cars: 1, s0: 0.5, d: -0.4, wake: { f: U.wake, every: 10, life: 2 } });
    U.gulls(90, 11260, 70, 140, 7);
    U.gulls(20, 10910, 18, 30, 3);
    // the chop: small breaking crests here and there on the open water
    const crest = (k) =>
      kit.frame(3, 1, 11100, (put) => {
        const n = [3, 6, 7, 5][k];
        for (let i = 0; i < n; i++) put(4 - (n >> 1) + i, 1 + (i % 3 === 1 ? -1 : 0), 0xc8dcec, [0.4, 0.55, 0.45, 0.25][k]);
      }, true);
    props.spot([[40, 10930, 140, 60], [40, 11036, 140, 88], [0, 11240, 118, 116], [158, 11240, 22, 116], [62, 11440, 118, 180], [0, 11440, 50, 150]], [crest(0), crest(1), crest(2), crest(3)], { rate: 4, fps: 3, a: 0.9 });
  }
  void PAL;
  void building;
  void E;
}
