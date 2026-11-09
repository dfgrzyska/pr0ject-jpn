// Sakurajima, u = 4250..5400: the ferry port and its long hot-spring foot bath by the lava shore (Yōgan Nagisa), the village under
// its ash with lava-stone walls and swept lanes, eruption shelters along the road, the giant daikon and little komikan oranges
// that grow nowhere else, farmers at work, Tsukiyomi Shrine, and the torii of Kurokami, buried to its lintel by the 1914 eruption.
import { C, S, night, hashPx, scaleColor, rampColor, rng, fbm } from '../nagasaki/canvas.mjs';
import { W, ISLAND, LAVA_ROAD } from './geo.mjs';
import { vapourOf } from './coast.mjs';
import { LEAF } from './city.mjs';

const ROOFS = [C.kawara, C.redTile, [0x2a3e50, 0x384e60, 0x486072, 0x5c7486, 0x74889a], [0x3e4a3e, 0x4e5a4c, 0x5e6c5a, 0x727e6c, 0x8a9482], [0x4a342a, 0x5e4436, 0x725444, 0x886854, 0x9e7c64]];
const LAVASTONE = [0x2a2422, 0x3a3230, 0x4e4442, 0x645856];
const SWEPT = [0x7a766e, 0x8a867c, 0x9a968a];

export function paintIsland(k) {
  const { img, Y, kit, objects, pool, glowPx } = k;
  const R = rng(4250);
  const [i0, i1] = ISLAND;
  const vapour = vapourOf(k);
  const IU = i0 + 110; // the port's road

  // ------------------------------------------------------------ the road
  k.road([[-14, IU], [W + 14, IU]], 4, { side: 1, lanes: true });
  k.road([[150, IU], [150, LAVA_ROAD[0]]], 4, { side: 1, lanes: true, piece: true });
  img.fine(146, Y(IU + 3.6), 8, 7.2, (X, Yy) => k.asphaltPx(X, Yy));

  // ------------------------------------------------------------ the port
  // the pier the ferries berth at, its covered ramp, the terminal, cars and people coming off the boat
  {
    img.fine(84, Y(i0 + 42), 13, 72, (X, Yy, x, y) => {
      const u = 7168 - y;
      if (k.fineWater[Yy * k.FW + X] && u > i0 + 40) return null;
      const a = x - 84;
      if (a < 0.5 || a > 11.5) return (u | 0) % 12 < 1 ? 0x24242a : 0x7a7670;
      if (Math.abs(a - 6) < 2.4) return (Yy >> 2) % 2 ? 0x8a8a84 : 0x6a6a64;
      return k.pavePx(X, Yy, C.concrete);
    });
    for (let Yy = Y(i0 + 42) * S; Yy < Y(i0 - 28) * S; Yy++) for (let j = 0; j < 5; j++) if (k.wetPx(97 * S + j, Yy)) img.px(97 * S + j, Yy, 0x081820, 0.32);
    k.reserve(84, Y(i0 + 42), 13, 72);
    k.standing(86, Y(i0 + 30), 8, 16, 6, 4251, undefined);
    k.house(70, Y(i0 + 100), 42, 22, 9, 'block', { roofC: 0x8a8e96, wall: 0xd8d4c8, plainRoof: false, extra: (by) => {
      const X = 70 * S;
      for (let i = 0; i < 42 * S; i++) for (let j = 0; j < 6; j++) img.px(X + i, (by - 9) * S + 3 + j, (i >> 3) % 2 ? 0xe0a020 : 0xf0ece0);
    } });
    k.crowd(74, Y(i0 + 64), 32, 5, 10);
    // a car park with a bus for the volcano
    k.fill(114, Y(i0 + 96), 26, 34, SWEPT, 4252, 5);
    k.reserve(114, Y(i0 + 96), 26, 34);
    for (let q = 0; q < 8; q++) {
      const X = (116 + (q % 4) * 6) * S;
      const Yy = (Y(i0 + 92) + (q >> 2) * 12) * S;
      const c = [0xe8e8ec, 0x2c3038, 0xc43a30, 0x3a609c, 0x9aa2aa, 0xe8d69c, 0x6a2a3a, 0xd8d8d0][q];
      for (let j = 0; j < 15; j++) for (let i = 0; i < 9; i++) img.px(X + i, Yy + j, (j === 4 || j === 10) && i > 0 && i < 8 ? 0x2a3440 : c);
    }
  }
  img.fine(66, Y(i0 + 70), 48, 28, (X, Yy) => k.settPx(X, Yy, 4275, C.granite));
  k.reserve(66, Y(i0 + 70), 48, 28);
  // down each side of the plaza, a stone wall and a bed of ash-tolerant cannas
  for (const x of [66, 112]) img.fine(x, Y(i0 + 70), 2, 26, (X, Yy) => (hashPx(X, Yy >> 1, 4283) < 0.3 ? 0xd85a2a : hashPx(X >> 1, Yy >> 1, 4284) < 0.5 ? 0x4a7a3a : 0x3a6a30));
  for (const [x, u] of [[70, i0 + 46], [110, i0 + 46], [70, i0 + 66], [110, i0 + 66]]) k.palm(x, Y(u), 4.6, x + u);
  for (let q = 0; q < 4; q++) {
    // the souvenir stalls with their striped awnings: komikan jam, daikon pickles, volcanic ash in little jars
    const x = 75 + q * 8;
    const u = i0 + 48;
    const c = [0xd83a2a, 0xf0a020, 0x2a6ab8, 0x3a8a5a][q];
    objects.push({
      y: Y(u) + 1,
      shadow: () => k.shadowRect(x + 1, Y(u) - 5, 7, 6, 0.55),
      draw: () => {
        const X = x * S;
        const Yb = Y(u) * S;
        for (let j = 0; j < 9; j++) for (let i = 0; i < 21; i++) img.px(X + i, Yb - j, j > 6 ? 0x8a6a44 : j > 3 ? (i >> 1) % 3 === 0 ? 0xf08a20 : (i >> 1) % 3 === 1 ? 0xe8e4d8 : 0x5a3a2a : 0x2a2420);
        for (let j = 0; j < 7; j++) for (let i = -2; i < 23; i++) img.px(X + i, Yb - 9 - j, (i >> 2) % 2 ? c : 0xf0ece0);
      },
    });
  }
  // the hotel over the lava shore, its pines, its hot spring steaming
  k.house(146, Y(i0 + 90), 30, 18, 24, 'block', { roofC: 0xa8a49c, wall: 0xe0d8c8, plainRoof: false, reserve: true });
  img.fine(116, Y(i0 + 64), 62, 42, (X, Yy, x, y) => {
    if (k.fineWater[Yy * k.FW + X] || k.shoreD[Yy * k.FW + X] < 7) return null;
    const e = ((x - 146) / 30) ** 2 + ((y - Y(i0 + 42)) / 22) ** 2 + (fbm(x, y, { seed: 4276, scale: 7, octaves: 2 }) - 0.5) * 0.7;
    if (e > 1 || (e > 0.84 && hashPx(X, Yy, 4285) > (1 - e) / 0.16)) return null;
    return k.lawnPx(X, Yy, 0.25 + fbm(x, y, { seed: 4286, scale: 6 }) * 0.5, [0x4a5e3a, 0x5a7044, 0x6c8250]);
  });
  for (let q = 0; q < 16; q++) k.tree(118 + q * 3.5, Y(i0 + 34 + (q % 4) * 7), 3 + (q % 3) * 0.7, LEAF.pine, q + 4277, 'pine');
  kit.emit(150, i0 + 44, vapour.slice(0, 2), { rate: 0.8, life: [1.6, 2.4], vy: 5, sx: 3, wf: 1, a: 0.26, tint: 1 });
  for (let q = 0; q < 26; q++) {
    const x = 4 + q * 6.6;
    const u = i0 + 16 + (q % 3) * 6;
    if (!k.wet(x, Y(u))) k.rockPx(x * S, Y(u) * S, 3 + (q % 4), LAVASTONE, q);
  }
  // the long foot bath along the sea wall: a wooden trough of milky water, people sitting along both sides with their feet in it,
  // steam rising off it; the lava shore's black rocks beyond
  {
    const fu = i0 + 54;
    const fy = Y(fu);
    const fr = rng(4431);
    objects.push({
      y: fy + 7,
      shadow: () => k.shadowRect(8, fy + 2, 58, 7, 0.55),
      draw: () => {
        img.fine(6, fy, 58, 6, (X, Yy) => {
          const i = X - 6 * S;
          const j = Yy - fy * S;
          if (j < 2 || j > 15 || i < 2 || i > 171) return j < 1 ? 0xa8885c : (X >> 3) % 2 ? 0x8a6a44 : 0x7a5a38;
          return hashPx(X >> 1, Yy, 4253) < 0.08 ? 0xeaf6f0 : j < 6 ? 0xc8e0d4 : 0xa8c8b8;
        });
        // the roof of cedar shingles on its posts over the middle of it
        for (const q of [14, 56]) for (let j = 0; j < 9; j++) img.px(q * S, fy * S - j, 0x5a4028);
        for (const [dy, dh] of [[-1, -2], [6, 7]])
          for (let x = 8; x < 63; x += 2.4) {
            if (fr() < 0.3) continue;
            const X = Math.round(x * S);
            const c = fr.pick([0xd04040, 0x3a6ad0, 0xe8c040, 0xe8e8f0, 0x6aaa5a, 0x3a3a4a]);
            for (let j = 0; j < 5; j++) for (let i = 0; i < 4; i++) img.px(X + i, (fy + dy) * S + j - (dy < 0 ? 2 : 0), c);
            for (let j = 0; j < 3; j++) for (let i = 1; i < 3; i++) img.px(X + i, (fy + dh) * S + j - (dy < 0 ? 0 : 3), j ? 0xe0b090 : 0x2a2024);
          }
      },
    });
    k.reserve(4, fy - 4, 62, 14);
    for (const x of [16, 34, 52]) kit.emit(x, fu - 2, vapour.slice(0, 2), { rate: 0.7, life: [1.4, 2.2], vy: 5, sx: 3, wf: 1, a: 0.3, tint: 1 });
    // the visitor centre, its lawn of pines on the old lava, the shore path
    k.house(6, Y(i0 + 100), 34, 13, 7, 'jp', { ramp: C.slate, wall: 0xd8d0c0, door: true });
    k.grove(42, 68, i0 + 66, i0 + 100, 6, [LEAF.pine, LEAF.ashen], 4254, 3, 5, 'pine');
    k.strollers(30, i0 + 64, 20, 3, 4);
  }

  // eruption shelters along the road: concrete half-pipes with a dark mouth, a yellow sign, every few hundred metres
  for (let u = i0 + 150; u < i1; u += 120) {
    const uu = u;
    if (k.anyRes(131, Y(uu + 6), 13, 8)) continue;
    objects.push({
      y: Y(uu) + 1,
      shadow: () => k.shadowRect(133, Y(uu + 5), 13, 7, 0.55),
      draw: () => {
        const X = 131 * S;
        const Yy = Y(uu + 6) * S;
        for (let j = 0; j < 21; j++)
          for (let i = 0; i < 36; i++) {
            const t = j / 21;
            let c = j < 15 ? (t < 0.2 ? 0xd8d4cc : t < 0.5 ? 0xc0bcb4 : 0xa8a49c) : j < 17 ? 0x7a7670 : 0x9a968e;
            if (j % 9 === 0 && j < 15) c = 0x8a867e;
            if (i < 12 && j > 4) c = i < 2 ? 0x6a6660 : 0x121216;
            img.px(X + i, Yy + j, c);
          }
        for (let j = 0; j < 7; j++) for (let i = 0; i < 9; i++) img.px(X + 18 + i, Yy + 4 + j, j === 0 ? 0x2a2a2e : 0xe8c030);
      },
    });
    k.reserve(131, Y(uu + 6), 15, 8);
  }

  // ------------------------------------------------------------ the village: lanes that wander, plots of every size, a square
  /** A curve through the given points. */
  const curved = (pts) => {
    const out = [];
    for (let i = 0; i + 1 < pts.length; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let q = 0; q < 6; q++) {
        const t = q / 6;
        const at = (a, b, c, d) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t);
        out.push([at(p0[0], p1[0], p2[0], p3[0]), at(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  };
  const LONG = [
    [[145, i0 + 164], [120, i0 + 158], [92, i0 + 166], [64, i0 + 160], [36, i0 + 172], [0, i0 + 166]],
    [[145, i0 + 222], [116, i0 + 230], [88, i0 + 222], [60, i0 + 228], [30, i0 + 218]],
    [[145, i0 + 296], [112, i0 + 288], [84, i0 + 296], [52, i0 + 290], [26, i0 + 302], [0, i0 + 296]],
    [[145, i0 + 352], [118, i0 + 344], [92, i0 + 354], [70, i0 + 346], [40, i0 + 352], [0, i0 + 344]],
  ].map(curved);
  const SHORT = [
    [[30, i0 + 218], [24, i0 + 196], [36, i0 + 172]],
    [[30, i0 + 218], [20, i0 + 250], [26, i0 + 302]],
    [[104, i0 + 227], [100, i0 + 198], [106, i0 + 162]],
    [[78, i0 + 224], [78, i0 + 240]],
    [[61, i0 + 252], [40, i0 + 244], [20, i0 + 250]],
    [[95, i0 + 250], [122, i0 + 256], [145, i0 + 254]],
    [[70, i0 + 346], [66, i0 + 320], [68, i0 + 292]],
    [[118, i0 + 290], [124, i0 + 320], [118, i0 + 345]],
    [[64, i0 + 115], [60, i0 + 138], [64, i0 + 160]],
    [[118, i0 + 115], [112, i0 + 140], [120, i0 + 158]],
    [[155, i0 + 205], [166, i0 + 200], [184, i0 + 208]],
    [[155, i0 + 322], [170, i0 + 330], [184, i0 + 324]],
  ].map(curved);
  const lanePaint = (X, Yy, across, along) => {
    const v = 0.15 + hashPx(X >> 3, Yy, 4256) * 0.4 + hashPx(X >> 1, Yy >> 1, 4287) * 0.14;
    return Math.abs(across) < 0.5 && Math.floor(along * 0.7) % 3 === 0 ? rampColor(SWEPT, v + 0.2, X, Yy) : rampColor(SWEPT, v, X, Yy);
  };
  // the village square first, its old camphor, its well, its hall, its shop and bus stop
  {
    const cx = 78;
    const cu = i0 + 254;
    img.fine(cx - 18, Y(cu + 16), 36, 32, (X, Yy, x, y) => {
      const e = ((x - cx) / 17) ** 2 + ((y - Y(cu)) / 15) ** 2;
      if (e > 1 + (hashPx(X >> 2, Yy >> 2, 4288) - 0.5) * 0.14) return null;
      return k.settPx(X, Yy, 4289, SWEPT);
    });
    k.reserve(cx - 18, Y(cu + 16), 36, 32);
    k.house(cx - 15, Y(i0 + 287), 30, 12, 7, 'jp', { ramp: C.kawara, wall: 0xe4dccc, noren: 0x2a3a6a, door: true, bay: 6, roof: { gable: 'tri', gw: 8 } });
    // the bench round the tree, the tree over it
    {
      const X = cx * S;
      const Yy = Y(cu - 1) * S;
      for (let j = -14; j <= 14; j++) for (let i = -20; i <= 20; i++) {
        const q = (i / 20) ** 2 + (j / 14) ** 2;
        if (q < 1 && q > 0.56) img.px(X + i, Yy + j, q > 0.86 ? C.wood[1] : C.wood[3]);
      }
    }
    k.tree(cx, Y(cu + 2), 8, LEAF.camphor, 4290);
    // the well, under its little roof
    objects.push({
      y: Y(cu - 8),
      shadow: () => k.shadowEllipse(cx + 12, Y(cu - 8), 4, 2, 0.55),
      draw: () => {
        const X = (cx + 11) * S;
        const Yb = Y(cu - 8) * S;
        for (let j = 0; j < 8; j++) for (let i = -6; i <= 6; i++) img.px(X + i, Yb - j, i > 4 ? LAVASTONE[0] : j % 3 === 0 ? LAVASTONE[1] : LAVASTONE[2]);
        for (const s of [-5, 5]) for (let j = 8; j < 18; j++) img.px(X + s, Yb - j, C.wood[1]);
        for (let j = 0; j < 5; j++) for (let i = -8 + j; i <= 8 - j; i++) img.px(X + i, Yb - 18 - j, j < 2 ? C.kawara[2] : C.kawara[3]);
      },
    });
    // the bus stop, its bench and timetable on the square's south side
    objects.push({
      y: Y(cu - 13),
      draw: () => {
        const X = (cx - 12) * S;
        const Yb = Y(cu - 13) * S;
        for (let j = 0; j < 15; j++) for (const q of [0, 26]) img.px(X + q, Yb - j, 0x4a4e54);
        for (let i = -2; i < 29; i++) for (let j = 0; j < 3; j++) img.px(X + i, Yb - 15 - j, j ? 0x8a9aa2 : 0xc8d0d4);
        for (let i = 3; i < 23; i++) for (let j = 0; j < 2; j++) img.px(X + i, Yb - 5 + j, C.wood[2]);
        for (let j = 0; j < 12; j++) img.px(X - 7, Yb - j, 0x4a4e54);
        img.discPx(X - 7, Yb - 14, 3, 0xe8e8e0);
      },
    });
    // the shop on the east of the square: its awning, crates of komikan and radishes out front
    k.house(cx + 18, Y(i0 + 272), 16, 9, 6, 'jp', {
      ramp: C.redTile, wall: 0xd8ccb4, noren: 0xe8d8b0, door: true, bay: 4,
      extra: (by) => {
        const X = (cx + 18) * S;
        for (let i = -1; i < 16 * S + 1; i++) for (let j = 0; j < 6; j++) img.px(X + i, (by - 5) * S + j, (i >> 2) % 2 ? 0xe0a020 : 0xf0ece0);
        for (let q = 0; q < 6; q++) {
          const c = q % 2 ? 0xf08a20 : 0xf0ece0;
          for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) img.px(X + 3 + q * 7 + i, by * S + 1 + j, j < 2 ? c : C.wood[1]);
        }
      },
    });
    k.crowd(cx - 14, Y(cu + 10), 28, 18, 13);
  }
  for (const lane of [...LONG, ...SHORT]) {
    for (let i = 0; i < lane.length - 1; i += 12) k.road(lane.slice(i, i + 14), 2, { side: 0, paint: lanePaint, kerb: LAVASTONE[1], piece: true });
  }
  // (and again without kerbs, so that where lanes meet they run into each other)
  for (const lane of [...LONG, ...SHORT]) {
    for (let i = 0; i < lane.length - 1; i += 12) k.road(lane.slice(i, i + 14), 1.4, { side: 0, paint: lanePaint, kerb: SWEPT[1], piece: true });
  }
  for (const lane of LONG) k.walkers(lane.filter((_, i) => i % 6 === 0), 3, lane[0][1], { sp: 2.6, gap: 70 });
  for (const lane of SHORT) k.walkers(lane.filter((_, i) => i % 4 === 0), 1, lane[0][1], { sp: 2.4, gap: 50 });
  // telegraph poles and their wires down the long lanes
  for (const lane of LONG) {
    objects.push({
      y: Y(lane[0][1] - 3),
      draw: () => {
        let last = null;
        for (let i = 2; i < lane.length; i += 5) {
          const X = Math.round(lane[i][0] * S);
          const Yb = Math.round((Y(lane[i][1]) - 3.2) * S);
          for (let j = 0; j < 30; j++) img.px(X, Yb - j, j > 26 ? 0x5a5a5e : 0x3a3a3e);
          for (let q = -4; q <= 4; q++) img.px(X + q, Yb - 27, 0x3a3a3e);
          if (last) for (const s of [-3, 3]) img.linePx(last[0] + s, last[1] - 26, X + s, Yb - 26, 0x1a1a1e, 0.55);
          last = [X, Yb];
        }
      },
    });
    // the vending machine where the lane comes out on the main road
    const X = 141 * S;
    const Yy = (Y(lane[0][1]) - 8) * S;
    objects.push({ y: Y(lane[0][1]) - 3, draw: () => {
      for (let j = 0; j < 15; j++) for (let i = 0; i < 8; i++) img.px(X + i, Yy + j, j < 2 ? 0xf0f0f0 : j < 8 ? (i % 2 ? 0x4a8ab0 : 0xe8f4f8) : j < 11 ? 0x2a2a30 : 0xd83a2a);
    } });
    k.reserve(140, Y(lane[0][1]) - 9, 4, 6);
  }
  // kei trucks pulled in at the lanes' sides, bags or radishes in the back
  LONG.forEach((lane, n) => {
    for (const i of [6 + n * 3, 20 + n * 2]) {
      if (!lane[i]) continue;
      const XX = Math.round(lane[i][0] * S);
      const Yy = (Y(lane[i][1]) - 2) * S;
      for (let j = 0; j < 12; j++) for (let q = 0; q < 30; q++) img.px(XX + q, Yy + j, q > 21 ? (j > 2 && j < 9 ? 0x2a3a4a : 0xe8e8ec) : j < 1 || j > 10 ? 0xb8bcc0 : (q >> 1) % 2 ? 0x6e7278 : 0x5e6268);
      for (let q = 0; q < 6; q++) img.discPx(XX + 3 + q * 3, Yy + 4 + (q % 2) * 3, 1.6, n % 2 ? 0xf0d030 : 0xf0ece0);
    }
  });
  /** A patch between the houses: greens in rows, a swept yard with its bags, or rough grass and a tree. */
  const yard = (x, yTop, w, h) => {
    const r = R();
    if (r < 0.4) {
      const across = R() < 0.5;
      img.fine(x, yTop, w, h, (X, Yy) => (((across ? Yy : X) >> 2) % 2 ? rampColor(C.dirt, 0.3, X, Yy) : hashPx(X >> 1, Yy, 4257) < 0.7 ? 0x5a8a3a : 0x3e6a2c));
    } else if (r < 0.56) {
      img.fine(x, yTop, w, h, (X, Yy) => rampColor(SWEPT, 0.3 + hashPx(X >> 3, Yy, 4268) * 0.4, X, Yy));
      for (let q = 0; q < 3; q++) img.discPx((x + 2) * S + q * 7, (yTop + h - 3) * S, 3, 0xf0d030);
    } else {
      k.lawnFill(x, yTop, w, h, [0x4a5e3a, 0x5a7044, 0x6c8250], Math.round(x + yTop));
      k.tree(x + w / 2, yTop + h * 0.6, Math.min(w, h) * 0.34, LEAF.ashen, Math.round(x * 3 + yTop));
    }
    for (let X = Math.round(x * S); X < (x + w) * S; X++) for (let j = 0; j < 4; j++) img.px(X, (yTop + h) * S - j, rampColor(LAVASTONE, 0.2 + hashPx(X >> 2, j, 4269) * 0.7, X, j));
    k.reserve(x, yTop, w, h);
  };
  /** A household's plot: its lava-stone wall with a gate, the house set back, greens or a shed beside it, perhaps a tree. */
  const plot = (x, u, w, h) => {
    const yTop = Y(u + h);
    if (w < 10 || h < 11 || k.anyRes(x, yTop, w, h) || k.anyWet(x, yTop, w, h)) return false;
    img.fine(x, yTop, w, h, (X, Yy) => rampColor(SWEPT, 0.1 + hashPx(X >> 3, Yy, 4268) * 0.42, X, Yy));
    k.reserve(x, yTop, w, h);
    const big = w >= 17;
    const left = R() < 0.5;
    const bw = big ? Math.round(w - 5 - R() * 3) : w - 1;
    const hx = left || !big ? x + 0.5 : x + w - bw - 0.5;
    const hh = Math.min(h - 2.5, 11 + R.int(0, 7));
    const rh = Math.round(hh * (0.56 + R() * 0.12));
    const gate = hx + Math.floor(bw / 2);
    k.house(hx, Math.round(Y(u + 2.5 + hh)), bw, rh, Math.max(4, Math.round(hh - rh)), 'jp', {
      ramp: R.pick(ROOFS),
      wall: R.pick([0xd8ccb4, 0xc8bca4, 0xb8ac94, 0xe4dccc, 0xa89a88]),
      noren: R() < 0.16 ? R.pick([0x2a4a8a, 0x8a2a2a, 0xe8d8b0]) : undefined,
      door: R() < 0.8,
      bay: R.int(3, 5),
      reserve: false,
    });
    if (big) {
      const sx = left ? x + bw + 1 : x + 0.5;
      const sw = w - bw - 1.5;
      if (R() < 0.6) img.fine(sx, yTop + 1, sw, h - 4, (X, Yy) => ((Yy >> 2) % 2 ? rampColor(C.dirt, 0.3, X, Yy) : hashPx(X >> 1, Yy, 4257) < 0.7 ? 0x5a8a3a : 0x3e6a2c));
      else k.house(sx, yTop + 2, sw, 4, 3, 'jp', { ramp: C.kawara, wall: 0x8a7a64, door: false, reserve: false });
    }
    if (R() < 0.34) k.tree(R() < 0.5 ? x + 2 : x + w - 2, yTop + 2, 2.6 + R(), LEAF.ashen, Math.round(x * 3 + u));
    if (R() < 0.3) for (let q = 0; q < 3; q++) img.discPx((x + 1.5) * S + q * 6, (Y(u) - 1.5) * S, 3, 0xf0d030);
    // the wall along the front, broken at the gate
    for (let X = Math.round(x * S); X < (x + w) * S; X++) {
      if (Math.abs(X / S - gate) < 2) continue;
      for (let j = 0; j < 5; j++) img.px(X, Y(u) * S - j, j === 4 ? LAVASTONE[3] : rampColor(LAVASTONE, 0.1 + hashPx(X >> 2, j >> 1, 4269) * 0.6, X, j));
    }
    return true;
  };
  const tryPlot = (x, u, w, h, fromTop) => {
    for (let q = h; q >= 11; q -= 3) if (plot(x, fromTop ? u - q : u, w, q)) return true;
    return false;
  };
  const near = (lane, x) => lane.reduce((best, p) => (Math.abs(p[0] - x) < Math.abs(best[0] - x) ? p : best))[1];
  for (const lane of LONG) {
    const hiX = Math.max(...lane.map((p) => p[0]));
    const loX = Math.min(...lane.map((p) => p[0]));
    for (let x = hiX - 3; x > loX + 6; ) {
      const w = R.int(11, 23);
      const X = Math.max(2, x - w);
      const lu = near(lane, X + w / 2);
      const wob = Math.sin(X * 0.3) * 1.5;
      tryPlot(X, Math.round(lu + 3.5 + R.int(0, 3)), w, R.int(14, 24), false);
      if (R() < 0.86) tryPlot(X + R.int(-2, 2), Math.round(lu - 3.5 - R.int(0, 3) + wob), w, R.int(14, 22), true);
      x -= w + R.int(0, 3);
    }
  }
  // east of the road: a looser scatter
  for (let u = i0 + 118; u < i0 + 382; ) {
    const h = R.int(13, 22);
    plot(156 + R.int(0, 2), u, R.int(14, 22), h);
    u += h + R.int(1, 5);
  }
  const fill = (x, u, w, h) => {
    if (w >= 10.5 && h >= 11 && R() < 0.82 && plot(x, u, w - 0.5, h - 0.5)) return;
    yard(x, Y(u + h), w - 0.5, h - 0.5);
  };
  k.fillGaps(2, 144, i0 + 117, i0 + 383, fill);
  k.fillGaps(155, 180, i0 + 117, i0 + 383, fill);
  // Tsukiyomi Shrine among its old camphors, at the road
  {
    const x = 118;
    const u = i0 + 400;
    k.house(x, Y(u + 26), 22, 15, 7, 'jp', { ramp: C.copper, wall: 0xf0ece0, door: true, roof: { gable: 'tri', gw: 6 } });
    objects.push({
      y: Y(u),
      draw: () => {
        const X = (x + 11) * S;
        const Yb = Y(u) * S;
        for (const s of [-1, 1]) for (let j = 0; j < 27; j++) for (let i = 0; i < 3; i++) img.px(X + s * 15 + i, Yb - j, i < 1 ? C.vermilion[3] : C.vermilion[1]);
        for (let i = -21; i <= 22; i++) {
          for (let j = 0; j < 3; j++) img.px(X + i, Yb - 30 + j, j < 1 ? 0x2a2a2e : C.vermilion[2]);
          if (Math.abs(i) < 18) img.px(X + i, Yb - 24, C.vermilion[1]);
        }
      },
    });
    k.reserve(x, Y(u + 26), 24, 28);
    for (const [xx, uu] of [[x - 4, u + 18], [x + 26, u + 22], [x - 6, u + 2]]) k.tree(xx, Y(uu), 5.5, LEAF.camphor, xx + uu);
    k.stoneLantern(x + 5, u + 3, false);
    k.stoneLantern(x + 18, u + 3, false);
  }
  {
    const x0 = 6;
    const u0 = i0 + 384;
    img.fine(x0, Y(u0 + 34), 66, 34, (X, Yy) => rampColor([0x7a6a58, 0x8a7a66, 0x9a8a74], 0.2 + hashPx(X >> 2, Yy >> 2, 4278) * 0.6, X, Yy));
    k.house(x0 + 2, Y(u0 + 34) - 12, 44, 10, 11, 'block', { roofC: 0x8a8e94, wall: 0xe8e4da, plainRoof: false, shop: false, reserve: false, bias: 1 });
    for (let X = x0 * S; X < (x0 + 66) * S; X++) if ((X >> 1) % 3) img.rectPx(X, Y(u0 + 1) * S, 1, 3, 0x4a4e54);
    k.standing(x0 + 4, Y(u0 + 26), 56, 20, 14, 4279, [0xf0f0f0, 0x2a3a6a]);
    k.strollers(x0 + 32, u0 + 14, 26, 9, 8, { hat: 0xf0d030, cols: [0xf0f0f0, 0x2a3a6a], sp: 6, idle: 0.2 });
    k.reserve(x0, Y(u0 + 34), 66, 34);
    k.tree(x0 + 60, Y(u0 + 36), 3.8, LEAF.ashen, 4280);
  }
  /** Cut a rectangle into fields of unequal size, 3 wide tracks between them. */
  const fieldsOf = (x0, x1, u0, u1, minW, minH) => {
    const out = [];
    const go = (a, b, c, d, depth) => {
      const w = b - a;
      const h = d - c;
      const canW = w > minW * 2 + 3;
      const canH = h > minH * 2 + 3;
      if ((!canW && !canH) || (depth > 2 && R() < 0.24)) {
        out.push([a, b, c, d]);
        return;
      }
      if (canW && (!canH || R() * w > R() * h)) {
        const m = Math.round(a + minW + R() * (w - 2 * minW - 3));
        go(a, m, c, d, depth + 1);
        go(m + 3, b, c, d, depth + 1);
      } else {
        const m = Math.round(c + minH + R() * (h - 2 * minH - 3));
        go(a, b, c, m, depth + 1);
        go(a, b, m + 3, d, depth + 1);
      }
    };
    go(x0, x1, u0, u1, 0);
    return out;
  };
  /** A farmer's shed at the corner of a field, its stack of crates; a heap of compost and straw. */
  const shed = (x, u) => {
    if (k.anyRes(x, Y(u + 11), 12, 13)) return;
    k.reserve(x - 1, Y(u + 11) - 1, 19, 15);
    k.house(x, Y(u + 11), 10, 6, 5, 'jp', { ramp: R.pick([C.kawara, [0x5a5a5e, 0x6e6e72, 0x828286, 0x96969a, 0xaaaaae]]), wall: 0x8a7a64, door: R() < 0.7, reserve: false });
    const X = (x + 11) * S;
    const Yy = Y(u + 2) * S;
    for (let q = 0; q < 5; q++) for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) img.px(X + (q % 3) * 7, Yy - (q > 2 ? 5 : 0) + j, j === 0 ? C.wood[3] : C.wood[1]);
  };
  const kei = (x, u, c) => {
    const X = x * S;
    const Yy = Y(u) * S;
    for (let j = 0; j < 15; j++) for (let i = 0; i < 39; i++) img.px(X + i, Yy + j, i > 30 ? (j > 3 && j < 12 ? 0x2a3a4a : 0xe8e8ec) : j < 1 || j > 13 || i < 1 ? 0xb8bcc0 : 0x6a6e74);
    for (let q = 0; q < 16; q++) img.discPx(X + 4 + (q % 8) * 3.2, Yy + 3 + (q >> 3) * 6 + (q % 2), 2.4, c);
  };

  // ------------------------------------------------------------ the giant Sakurajima daikon: fields of every size, each at its own stage
  {
    const a = i0 + 420;
    const b = i0 + 680;
    img.fine(4, Y(b), 134, b - a, (X, Yy) => rampColor(SWEPT, 0.12 + hashPx(X >> 3, Yy, 4258) * 0.42, X, Yy));
    const KINDS = ['big', 'big', 'young', 'plough', 'greens', 'big', 'straw', 'young'];
    /** One great radish, shouldering out of the ash under its rosette. */
    const daikon = (x, u, sz) => {
      const X = Math.round(x * S);
      const Yy = Y(u) * S;
      const r = 6 * sz;
      if (sz > 0.7) {
        for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j < r * r) img.tintPx(X + i + 2, Yy + j + 3, 0.72);
        for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j < r * r + 1) img.px(X + i, Yy + j, i + j < -r * 0.7 ? 0xffffff : i + j > r * 0.8 ? 0xb8b4a4 : 0xece8dc);
      }
      for (let q = 0; q < 7; q++) {
        const ang = q * 0.9 + (x + u) * 0.3 - 3.14;
        for (let t = 2; t < (9 + (q % 3)) * Math.max(0.6, sz); t++) {
          const LX = X + Math.cos(ang) * t;
          const LY = Yy - 3 * sz + Math.sin(ang) * t * 0.6;
          img.px(LX, LY, q % 2 ? 0x4a8a32 : 0x5e9e3e);
          img.px(LX + 1, LY, t % 3 === 0 ? 0x7ab84a : 0x3a7228);
        }
      }
    };
    fieldsOf(4, 138, a, b, 30, 28).forEach(([x0, x1, u0, u1], n) => {
      const kind = KINDS[n % KINDS.length];
      const across = n % 3 !== 1; // which way its rows run
      const seed2 = 4300 + n;
      img.fine(x0, Y(u1), x1 - x0, u1 - u0, (X, Yy, x, y) => {
        const e = Math.min(x - x0, x1 - x, y - Y(u1), Y(u0) - y);
        if (e < 0.7) return hashPx(X >> 1, Yy >> 1, seed2) < 0.5 ? 0x5a6a40 : 0x4a5a38; // the weedy edge
        const row = ((across ? Yy : X) + (across ? X * 0.02 : Yy * 0.02)) | 0;
        if (kind === 'plough') return row % 9 < 3 ? rampColor(C.dirt, 0.08, X, Yy) : row % 9 < 6 ? rampColor(C.dirt, 0.42 + hashPx(X >> 1, Yy >> 1, seed2) * 0.2, X, Yy) : rampColor(C.dirt, 0.72, X, Yy);
        if (kind === 'straw') return row % 12 < 2 ? rampColor(C.dirt, 0.2, X, Yy) : hashPx(X, Yy >> 1, seed2) < 0.5 ? 0xb8a878 : 0x9a8a60;
        if (kind === 'greens') return row % 9 < 3 ? rampColor(C.dirt, 0.25, X, Yy) : hashPx(X >> 1, Yy >> 1, seed2) < 0.7 ? 0x5e9040 : 0x3e6e2e;
        return row % 12 < 4 ? rampColor(C.dirt, 0.15 + hashPx(X >> 2, Yy, seed2) * 0.3, X, Yy) : rampColor(C.dirt, 0.42 + hashPx(X >> 1, Yy >> 1, seed2) * 0.3, X, Yy);
      });
      if (n % 3 === 0) shed(x0 + 2, u1 - 14);
      if (kind === 'big' || kind === 'young') {
        const [sx, sy] = [[9, 9], [8, 11], [11, 8], [10, 10]][n % 4];
        for (let u = u0 + 5, r = 0; u < u1 - 3; u += sy, r++)
          for (let x = x0 + 5 + (r % 2 && n % 2 ? sx / 2 : 0); x < x1 - 3; x += sx) {
            if (k.anyRes(x - 3, Y(u) - 3, 7, 7)) continue;
            if (kind === 'big' && hashPx(Math.round(x), Math.round(u), seed2) < 0.05) continue; // lifted already
            daikon(x, u, kind === 'big' ? 0.86 + hashPx(Math.round(x), Math.round(u), seed2 + 1) * 0.28 : 0.5);
          }
      }
      if (kind === 'big' || n % 4 === 1) k.standing(x0 + 4, Y(u1) + 4, x1 - x0 - 8, u1 - u0 - 8, 2 + (n % 3), seed2, [0x2a3a5a, 0x4a4a3a, 0x8a3a2a]);
      if (n % 5 === 2 && !k.anyRes((x0 + x1) / 2 - 7, Y(u0), 14, 6)) kei((x0 + x1) / 2 - 6, u0 - 0.5, 0xf0ece0);
    });
    k.reserve(4, Y(b), 134, b - a);
  }

  // ------------------------------------------------------------ the komikan orchards: small dark trees hung with tiny oranges, on terraces of lava stone
  {
    const a = i0 + 720;
    const b = i0 + 960;
    img.fine(4, Y(b), 134, b - a, (X, Yy) => rampColor(SWEPT, 0.12 + hashPx(X >> 3, Yy, 4263) * 0.42, X, Yy));
    const KINDS = ['old', 'old', 'young', 'old', 'nursery', 'old', 'young', 'rest'];
    fieldsOf(4, 138, a, b, 36, 34).forEach(([x0, x1, u0, u1], n) => {
      const kind = KINDS[n % KINDS.length];
      const seed2 = 4400 + n;
      const ramp = kind === 'rest' ? [0x5a6a44, 0x6a7c4e, 0x7c8e58] : n % 2 ? [0x46503a, 0x565e44, 0x68704e] : [0x4e5a3e, 0x5e6c48, 0x707e52];
      img.fine(x0, Y(u1), x1 - x0, u1 - u0, (X, Yy, x, y) => k.lawnPx(X, Yy, 0.2 + fbm(x, y, { seed: seed2, scale: 6 }) * 0.5, ramp));
      k.stoneFace(x0, x1, Y(u1), 2, seed2, LAVASTONE);
      if (n % 3 === 1) shed(x1 - 20, u0 + 2);
      if (kind === 'nursery') {
        for (let u = u0 + 3; u < u1 - 4; u += 5)
          for (let x = x0 + 3; x < x1 - 2; x += 4.4) {
            if (k.anyRes(x - 1, Y(u) - 1, 3, 3)) continue;
            img.discPx(x * S + 2, Y(u) * S + 3, 3, 0x20281c, 0.5);
            img.discPx(x * S, Y(u) * S, 3, hashPx(Math.round(x), Math.round(u), seed2) < 0.5 ? 0x4e7a3a : 0x3e6a30);
            img.px(x * S - 1, Y(u) * S - 1, 0x7aa04e);
          }
      } else {
        if (kind === 'rest') {
          for (let q = 0; q < 10; q++) {
            const X = (x0 + 6 + (q % 5) * 6) * S;
            const Yy = (Y(u0 + 6) - (q >> 2) * 4) * S;
            for (let j = 0; j < 6; j++) for (let i = 0; i < 12; i++) img.px(X + i, Yy + j, j === 0 ? C.wood[3] : j > 3 ? 0xf08a20 : C.wood[1]);
          }
          k.standing(x0 + 6, Y(u0 + 24), x1 - x0 - 12, 20, 5, seed2, [0x2a3a5a, 0x4a4a3a, 0xc86a2a]);
        }
        const [sx, sy] = [[15, 14], [13, 16], [17, 13], [14, 15]][n % 4];
        for (let u = kind === 'rest' ? u0 + 27 : u0 + 5, r = 0; u < u1 - 2; u += sy, r++)
          for (let x = x0 + 6 + (r % 2 ? sx / 2 : 0); x < x1 - 3; x += sx) {
            const tx = x + hashPx(Math.round(x), Math.round(u), 4264) * 3 - 1.5;
            if (k.anyRes(tx - 6, Y(u) - 6, 12, 12)) continue;
            const rr = kind !== 'young' ? 4.4 + hashPx(Math.round(x), Math.round(u), seed2) * 1.2 : 2.8;
            k.tree(tx, Y(u), rr, n % 3 ? LEAF.camellia : [0x1e3a24, 0x2c5030, 0x3e6a3a, 0x568446], Math.round(tx * 7 + u));
            const seed3 = Math.round(tx + u);
            objects.push({
              y: Y(u) + rr * 0.6 + 0.2,
              draw: () => {
                const g = rng(seed3);
                for (let q = 0; q < (kind !== 'young' ? 16 : 5); q++) {
                  const ang = g() * 6.283;
                  const dd = g() * rr * 0.86;
                  img.rectPx((tx + Math.cos(ang) * dd) * S, (Y(u) + Math.sin(ang) * dd * 0.84) * S, 2, 2, g() < 0.8 ? 0xf08a20 : 0xffc040);
                }
              },
            });
          }
      }
      if (n % 4 === 0) k.strollers((x0 + x1) / 2, (u0 + u1) / 2, (x1 - x0) / 2 - 4, (u1 - u0) / 2 - 4, 2, { hat: 0xd8c898, cols: [0x2a3a5a, 0x4a4a3a] });
    });
    k.reserve(4, Y(b), 134, b - a);
  }

  // ------------------------------------------------------------ the torii of Kurokami: only its lintel and the stubs of its posts rise from the ash
  {
    const x = 62;
    const u = i1 - 100;
    const y = Y(u);
    img.fine(x - 24, y - 16, 48, 32, (X, Yy, xx, yy) => {
      const e = ((xx - x) / 24) ** 2 + ((yy - y) / 15) ** 2;
      if (e >= 1) return null;
      return rampColor([0x6e6a64, 0x84807a, 0x9a968e, 0xb0aca2], 0.75 - e * 0.5 + (hashPx(X >> 2, Yy >> 1, 4265) - 0.5) * 0.3, X, Yy);
    });
    objects.push({
      y: y + 4,
      shadow: () => k.shadowRect(x - 8, y + 2, 24, 3, 0.5),
      draw: () => {
        const X = x * S;
        const Yy = y * S;
        for (let i = -36; i <= 36; i++) {
          const lift = Math.abs(i) > 30 ? (Math.abs(i) - 30) * 0.4 : 0;
          for (let j = 0; j < 6; j++) img.px(X + i, Yy - 12 - lift + j, j < 2 ? 0xb4b0a6 : j > 4 ? 0x5a564e : hashPx(i >> 2, j, 4266) < 0.2 ? 0x7a766e : 0x92908a);
        }
        for (let i = -27; i <= 27; i++) for (let j = 0; j < 4; j++) img.px(X + i, Yy + j - 3, j < 1 ? 0xa29e94 : 0x7a766e);
        for (const px of [-21, 18]) for (let j = -3; j < 9; j++) for (let i = 0; i < 6; i++) img.px(X + px + i, Yy + j, i < 2 ? 0xa8a49a : i > 4 ? 0x5a564e : 0x8a867e);
      },
    });
    k.reserve(x - 24, y - 16, 48, 32);
    k.crowd(x - 16, y + 10, 32, 4, 9);
    // the road's little spur to it
    k.road([[x + 28, u - 18], [146, u - 18]], 1.6, { side: 0, surface: SWEPT, kerb: LAVASTONE[1], piece: true });
    k.bench(x + 20, y + 8, 4);
    k.streetLamp(x + 24, u - 12);
  }
  // east of the road, all the way up from the port: smallholdings and windbreaks
  for (let u = i0 + 390; u < i1 + 30; ) {
    const h = R.int(18, 40);
    const y = Y(u + h);
    if (!k.anyRes(158, y, 22, h)) {
      const r = R();
      if (r < 0.36) {
        img.fine(158, y, 22, h, (X, Yy) => ((Yy >> 2) % 3 === 0 ? rampColor(C.dirt, 0.2, X, Yy) : hashPx(X >> 1, Yy >> 1, 4270) < 0.68 ? 0x5a8a3a : 0x3e6a2c));
        k.reserve(158, y, 22, h);
      } else if (r < 0.62 && h > 22) {
        k.house(159, Y(u + 19), 20, 11, 7, 'jp', { ramp: R.pick(ROOFS), wall: R.pick([0xd8ccb4, 0xc8bca4]), door: true });
        k.tree(172, Y(u + h - 2), 3.4, LEAF.ashen, u);
      } else for (let q = 0; q < 5; q++) k.tree(160 + q * 4, Y(u + h * 0.5 + (q % 2) * 4), 3.4, q % 2 ? LEAF.pine : LEAF.camellia, u + q, q % 2 ? 'pine' : 'broadleaf');
    }
    u += h + 2;
  }
  // round the buried torii: the slopes of the old lava already greened over, drystone terraces, camellias, a farm track
  for (let u = i0 + 968; u < i1 - 10; u += 26) k.stoneFace(2, 144, Y(u), 2, u, LAVASTONE);
  img.fine(2, Y(i1 + 20), 142, (i1 + 20) - (i0 + 960), (X, Yy, x, y) => {
    const u = 7168 - y;
    if (u < i0 + 962 || ((x - 62) / 25) ** 2 + ((u - (i1 - 100)) / 16) ** 2 < 1) return null;
    const n = fbm(x, y, { seed: 4271, scale: 11, octaves: 3 });
    if (n < 0.44 || (n < 0.54 && hashPx(X, Yy, 4281) > (n - 0.44) / 0.1)) return null;
    return hashPx(X >> 1, Yy, 4272) < 0.2 ? 0x6e7a56 : k.lawnPx(X, Yy, (n - 0.46) * 1.6 + hashPx(X >> 2, Yy >> 2, 4282) * 0.24, [0x3e4634, 0x4c563e, 0x5c6848]);
  });
  k.grove(4, 146, i0 + 962, i1 + 40, 90, [LEAF.pine, LEAF.ashen, LEAF.camellia], 4267, 2.6, 5, 'pine');
  for (let q = 0; q < 140; q++) {
    const x = R() * 146;
    const u = i0 + 970 + R() * 200;
    if (!k.isRes(x, Y(u))) k.rockPx(x * S, Y(u) * S, 2.4 + R() * 5, LAVASTONE, q);
  }
  void glowPx;
  void pool;
  void night;
  void scaleColor;
  void W;
}
