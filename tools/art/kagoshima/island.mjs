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

  // ------------------------------------------------------------ the village
  // lanes of swept ash between the rows of houses, off the main road; lava-stone walls along them
  for (let u = i0 + 151; u < i0 + 380; u += 30) {
    img.fine(0, Y(u + 2), 146, 5, (X, Yy, x, y) => {
      if (k.isRes(x, y)) return null;
      const uu = 7168 - y;
      if (Math.abs(uu - u) > 1.7) return rampColor(LAVASTONE, 0.3 + hashPx(X >> 2, Yy >> 1, 4255) * 0.6, X, Yy);
      return rampColor(SWEPT, 0.2 + hashPx(X >> 3, Yy, 4256) * 0.5 + fbm(x, y, { seed: 481, scale: 3 }) * 0.2, X, Yy);
    });
    k.reserve(0, Y(u + 3), 146, 6);
    k.walkers([[6, u], [140, u]], 2, u, { sp: 2.6, gap: 90 });
  }
  const yard = (x, yTop, w, h) => {
    const r = R();
    if (r < 0.5) {
      // a plot of greens under the ash, in rows
      img.fine(x, yTop, w, h, (X, Yy) => ((Yy >> 2) % 2 ? rampColor(C.dirt, 0.3, X, Yy) : hashPx(X >> 1, Yy, 4257) < 0.7 ? 0x5a8a3a : 0x3e6a2c));
    } else if (r < 0.8) {
      // a yard of swept ash, a stack of bags against the wall
      img.fine(x, yTop, w, h, (X, Yy) => rampColor(SWEPT, 0.3 + hashPx(X >> 3, Yy, 4268) * 0.4, X, Yy));
      for (let q = 0; q < 3; q++) img.discPx((x + 2) * S + q * 7, (yTop + h - 3) * S, 3, 0xf0d030);
    } else {
      k.lawnFill(x, yTop, w, h, [0x4a5e3a, 0x5a7044, 0x6c8250], x + yTop);
      k.tree(x + w / 2, yTop + h * 0.6, Math.min(w, h) * 0.34, LEAF.ashen, x * 3 + yTop);
    }
    // the lava-stone wall round it
    for (let X = x * S; X < (x + w) * S; X++) for (let j = 0; j < 4; j++) img.px(X, (yTop + h) * S - j, rampColor(LAVASTONE, 0.2 + hashPx(X >> 2, j, 4269) * 0.7, X, j));
    k.reserve(x, yTop, w, h);
  };
  const villageRow = (x0, x1, u) => {
    for (let x = x0 + R.int(0, 2); x < x1 - 6; ) {
      const w = Math.min(x1 - x, R.int(10, 20));
      const yTop = Y(u + 17);
      if (!k.anyRes(x - 1, yTop - 1, w + 1, 19)) {
        if (R() < 0.16) yard(x, yTop, w - 1, 17);
        else {
          k.house(x, yTop, w - 1, 11, 6, 'jp', { ramp: R.pick(ROOFS), wall: R.pick([0xd8ccb4, 0xc8bca4, 0xb8ac94, 0xe4dccc]), noren: R() < 0.2 ? R.pick([0x2a4a8a, 0x8a2a2a]) : undefined, door: R() < 0.8, bay: R.int(3, 5) });
          if (R() < 0.34) {
            const X = (x + 1) * S;
            const Yy = (yTop + 18) * S;
            for (let q = 0; q < 3; q++) img.discPx(X + q * 6, Yy, 3, 0xf0d030);
          }
          if (R() < 0.24) k.tree(x + w, yTop + 13, 2.8, LEAF.ashen, x * 3 + u);
        }
      }
      x += w;
    }
  };
  for (let u = i0 + 151; u < i0 + 380; u += 30) {
    // camellia hedge in stretches along the lane, the poles carrying their wires down it
    for (let x = 4; x < 140; x += 10 + (u + x) % 7) {
      if (k.anyRes(x, Y(u - 5), 9, 3)) continue;
      const w = 5 + (x % 5);
      img.fine(x, Y(u - 3), w, 2.4, (X, Yy) => rampColor(LEAF.camellia, 0.3 + hashPx(X >> 1, Yy >> 1, 4273) * 0.6, X, Yy));
    }
    objects.push({
      y: Y(u + 3),
      draw: () => {
        let last = null;
        for (let x = 6; x < 146; x += 28) {
          const X = x * S;
          const Yb = Y(u + 3) * S;
          for (let j = 0; j < 30; j++) img.px(X, Yb - j, 0x3a3a3e);
          for (let i = -4; i <= 4; i++) img.px(X + i, Yb - 28, 0x3a3a3e);
          if (last !== null) for (const s of [-3, 3]) img.linePx(last + s, Yb - 27, X + s, Yb - 27, 0x1a1a1e, 0.55);
          last = X;
        }
      },
    });
    // a vending machine and a bench where the lane meets the main road
    const X = 140 * S;
    const Yy = Y(u + 8) * S;
    objects.push({ y: Y(u + 5), draw: () => {
      for (let j = 0; j < 15; j++) for (let i = 0; i < 8; i++) img.px(X + i, Yy + j, j < 2 ? 0xf0f0f0 : j < 8 ? (i % 2 ? 0x4a8ab0 : 0xe8f4f8) : j < 11 ? 0x2a2a30 : 0xd83a2a);
    } });
    k.reserve(139, Y(u + 8) - 1, 4, 6);
  }
  // a kei truck here and there, loaded, by the houses
  for (const [x, u] of [[46, i0 + 152], [100, i0 + 182], [24, i0 + 212], [76, i0 + 242], [118, i0 + 272], [60, i0 + 302], [20, i0 + 332]]) {
    const XX = x * S;
    const Yy = Y(u) * S;
    for (let j = 0; j < 12; j++) for (let i = 0; i < 30; i++) img.px(XX + i, Yy + j, i > 21 ? (j > 2 && j < 9 ? 0x2a3a4a : 0xe8e8ec) : j < 1 || j > 10 ? 0xb8bcc0 : (i >> 1) % 2 ? 0x6e7278 : 0x5e6268);
    for (let q = 0; q < 6; q++) img.discPx(XX + 3 + q * 3, Yy + 4 + (q % 2) * 3, 1.6, 0xf0d030);
  }
  k.standing(4, Y(i0 + 160), 130, 200, 22, 4274, undefined);
  for (let u = i0 + 130; u < i0 + 380; u += 30) {
    villageRow(2, 144, u);
    villageRow(158, W, u);
    k.fillGaps(2, 144, u, u + 18, (x, uu, w, h) => yard(x, Y(uu + h), w - 1, h - 1));
  }
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

  // ------------------------------------------------------------ the giant Sakurajima daikon: rows of white roots under their leaves
  {
    const a = i0 + 420;
    const b = i0 + 680;
    img.fine(4, Y(b), 134, b - a, (X, Yy, x, y) => {
      if (k.isRes(x, y)) return null;
      const u = 7168 - y;
      if ((u | 0) % 88 < 3) return k.settPx(X, Yy, 4258, SWEPT); // the farm tracks across the fields
      return (Yy >> 2) % 3 === 0 ? rampColor(C.dirt, 0.15 + hashPx(X >> 2, Yy, 4259) * 0.3, X, Yy) : rampColor(C.dirt, 0.4 + hashPx(X >> 1, Yy >> 1, 4260) * 0.3, X, Yy);
    });
    for (let u = a + 6; u < b; u += 9)
      for (let x = 8; x < 136; x += 9) {
        const y = Y(u);
        if (k.anyRes(x - 3, y - 3, 7, 7) || (u - a) % 88 < 6) continue;
        const X = x * S;
        const Yy = y * S;
        for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) if (i * i + j * j < 36) img.tintPx(X + i + 2, Yy + j + 3, 0.72);
        // the root, big as a boulder, shouldering out of the ash
        for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) if (i * i + j * j < 37) img.px(X + i, Yy + j, i + j < -4 ? 0xffffff : i + j > 5 ? 0xb8b4a4 : 0xece8dc);
        // the rosette of long leaves
        for (let q = 0; q < 7; q++) {
          const ang = q * 0.9 + (x + u) * 0.3 - 3.14;
          for (let t = 2; t < 9 + (q % 3); t++) {
            const LX = X + Math.cos(ang) * t;
            const LY = Yy - 3 + Math.sin(ang) * t * 0.6;
            img.px(LX, LY, q % 2 ? 0x4a8a32 : 0x5e9e3e);
            img.px(LX + 1, LY, t % 3 === 0 ? 0x7ab84a : 0x3a7228);
          }
        }
      }
    k.reserve(4, Y(b), 134, b - a);
    // farmers lifting them, a kei truck loaded with them on the track, a basket
    k.standing(30, Y(i0 + 600), 40, 30, 5, 4261, [0x2a3a5a, 0x4a4a3a, 0x8a3a2a]);
    k.standing(90, Y(i0 + 500), 30, 30, 4, 4262, [0x2a3a5a, 0x4a4a3a, 0x8a3a2a]);
    for (const [x, u] of [[62, a + 90], [106, a + 178]]) {
      const X = x * S;
      const Yy = Y(u) * S;
      for (let j = 0; j < 15; j++) for (let i = 0; i < 39; i++) img.px(X + i, Yy + j, i > 30 ? (j > 3 && j < 12 ? 0x2a3a4a : 0xe8e8ec) : j < 1 || j > 13 || i < 1 ? 0xb8bcc0 : 0x6a6e74);
      for (let q = 0; q < 16; q++) {
        const CX = X + 4 + (q % 8) * 3.2;
        const CY = Yy + 3 + (q >> 3) * 6 + (q % 2);
        img.discPx(CX, CY, 2.4, 0xf0ece0);
      }
    }
  }

  // ------------------------------------------------------------ the komikan orchards: small dark trees hung with tiny oranges, lava-stone terraces
  {
    const a = i0 + 720;
    const b = i0 + 960;
    img.fine(4, Y(b), 134, b - a, (X, Yy, x, y) => (k.isRes(x, y) ? null : k.lawnPx(X, Yy, 0.2 + fbm(x, y, { seed: 4263, scale: 6 }) * 0.5, [0x46503a, 0x565e44, 0x68704e])));
    for (let u = a + 42; u < b; u += 56) k.stoneFace(4, 138, Y(u), 2, u, LAVASTONE);
    for (let u = a + 4; u < b; u += 14)
      for (let x = 10; x < 136; x += 15) {
        const tx = x + hashPx(x, u, 4264) * 3;
        if (k.anyRes(tx - 6, Y(u) - 6, 12, 12)) continue;
        const pal = LEAF.camellia;
        k.tree(tx, Y(u), 4.8, pal, Math.round(tx * 7 + u));
        const seed2 = Math.round(tx + u);
        objects.push({
          y: Y(u) + 3,
          draw: () => {
            const g = rng(seed2);
            for (let q = 0; q < 16; q++) {
              const ang = g() * 6.283;
              const dd = g() * 4.2;
              const FX = (tx + Math.cos(ang) * dd) * S;
              const FY = (Y(u) + Math.sin(ang) * dd * 0.84) * S;
              img.rectPx(FX, FY, 2, 2, g() < 0.8 ? 0xf08a20 : 0xffc040);
            }
          },
        });
      }
    k.reserve(4, Y(b), 134, b - a);
    k.strollers(70, a + 120, 50, 100, 4, { hat: 0xd8c898, cols: [0x2a3a5a, 0x4a4a3a] });
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
