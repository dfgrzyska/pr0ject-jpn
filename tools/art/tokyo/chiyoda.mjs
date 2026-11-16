// Chiyoda (u 4884-6050), in the evening: lamps on the avenues, the palace dark and quiet in its moat.
//   Kasumigaseki's ministries in stone and brick; the Diet - its two wings and the tower under a stepped
//     pyramid - over its garden with a fountain;
//   the Imperial Palace - the moat between walls of fitted stone, swans on it; the stone bridge to the main
//     gate under its lamps; white turrets on the corners of the walls; the palace's halls under copper roofs
//     round their courts; lawns set with black pines; the forest; the east gardens with the stone base of the
//     keep that burned, the pond and its irises; Chidorigafuchi under cherries lit from below, rowing boats out;
//   Marunouchi - towers of glass each side of the avenue of ginkgos, the square, and Tokyo Station: a long front
//     of red brick banded in white under slate, a dome at each end; its platforms and trains behind, the white
//     sail of a roof over the far side.
// Live: the swans, the boats, petals falling, the trains.
import { lots } from './blocks.mjs';
import { PAL, shade, blend } from './kit.mjs';
import { hashPx } from '../hires.mjs';

const COPPER = 0x5c8a78;

export function chiyoda(ctx) {
  const { kit, blocks, pave, plot, claim, props, near, ROADS, S } = ctx;
  const { building, house, tree, crowd, mark, ground, rand, pick, P, R, E, ER, halo, FX, FY, queue, shadowBox, car } = kit;
  kit.setSun(0.1);
  const road = (id) => ROADS.find((r) => r.id === id).pts;
  const lampAt = (x, u, c) => mark(x, u, (X, Y) => kit.lamp(X, Y, c));
  const stone = (i, j, s) => {
    // fitted stones, each its own grey
    const row = Math.floor(j / 3);
    const ii = i + (row % 2) * 3;
    return j % 3 === 0 || ii % 6 === 0 ? 0x44464a : shade(0x8c8e8a, 0.8 + hashPx(Math.floor(ii / 6), row, s) * 0.34);
  };
  kit.WALLS.stone = (o) => (i, j, w, h, s) => stone(i, j, s);
  const WHITE = 0xf0ece4;
  const TILE = 0x4a5260;
  /** A turret on the wall: a stone foot, then storeys of white plaster under tiled roofs, each smaller. */
  const yagura = (x, u, w, h, levels, s) => {
    building(x, u, w, h * 0.5, { style: 'stone', face: 3, roof: 0x8c8e8a, lit: 0, s, top: () => {} });
    for (let k = 0; k < levels; k++) {
      const m = k * 1.5;
      house(x + 1 + m, u + 3 + k * 3.4, w - 2 - m * 2, h - 5 - k * 2.2, { tile: TILE, wall: WHITE, face: 2, s: s + k + 1, over: u, rank: 2 + k });
    }
  };

  // ---- the moat's outer banks are kept clear: gravel set with pines before the main gate, grass under the
  // cherries down the sides and along the north
  for (const [x, u, w, h, kind] of [[0, 5153, 85, 13, 'gravel'], [95, 5153, 85, 13, 'gravel'], [0, 5166, 8, 604, 'park'], [172, 5166, 8, 604, 'park'], [0, 5770, 86, 18, 'park'], [94, 5770, 86, 18, 'park']]) {
    claim(x, u, w, h);
    pave(x, u, w, h, kind, 140 + x);
  }
  for (let x = 5; x < 178; x += 7) {
    if (Math.abs(x - 90) < 8) continue;
    tree('pine', x + rand() * 2, 5157 + rand() * 6, 2 + rand() * 0.8);
    if (Math.abs(x - 90) > 13) tree(pick(['sakura', 'sakura', 'broadleaf']), x + rand() * 2, 5775 + rand() * 9, 2.4 + rand() * 0.8);
  }
  crowd(4, 5154, 172, 10, 22);
  crowd(4, 5772, 172, 12, 18);

  // ---- Kasumigaseki, and the Diet over its garden
  {
    const p = plot('kokkai');
    pave(p.x, p.u, p.w, p.h, 'plaza', 121);
    const pyramid = ({ X, Y, w, h }) => {
      // the tower's roof: steps up to a point
      for (let k = 0; k * 2 < Math.min(w, h) - 2; k++)
        for (let j = k * 2; j < h - k * 2; j++)
          for (let i = k * 2; i < w - k * 2; i++) {
            const edge = j < k * 2 + 2 || i < k * 2 + 2;
            P(X + i, Y + j, shade(0xb4b0a4, (edge ? 1.18 : j >= h - k * 2 - 2 || i >= w - k * 2 - 2 ? 0.7 : 0.94) + k * 0.02));
          }
    };
    building(p.x, p.u + 8, p.w, 54, {
      face: 9, style: 'granite', wall: 0xd4d0c4, roof: 0xc4c0b2, s: 1201, lit: 0.35,
      tiers: [
        { in: [2, 6, 54, 8], face: 5, style: 'granite', roof: 0xaeaa9c }, // the wing of one house
        { in: [54, 6, 2, 8], face: 5, style: 'granite', roof: 0xaeaa9c }, // and of the other
        { in: [29, 4, 29, 6], face: 16, style: 'granite', tiers: [{ in: [2, 2, 2, 2], face: 6, top: pyramid }] },
      ],
    });
    // its drive and garden to the north: a fountain, clipped hedges, ginkgos in rows
    pave(p.x + 30, p.u + 62, 20, 60, 'gravel', 122);
    mark(90, 5100, (X, Y) => {
      for (let j = -9; j <= 9; j++) for (let i = -12; i <= 12; i++) {
        const d = Math.hypot(i / 12, j / 9);
        if (d < 1) P(X + i, Y + j, d > 0.82 ? 0xb0aca0 : d < 0.2 ? 0xe8f4f8 : (i + j) % 5 === 0 ? 0x8cc0d4 : 0x3c7a8c);
      }
      ER(X - 1, Y - 1, 2, 2, 0xe8f8ff);
      halo(X, Y, 18, 14, 0xa0d8f0, 0.22);
    });
    for (let u = 5072; u < 5128; u += 8) for (const x of [76, 104]) tree('broadleaf', x, u, 2.3);
    for (let k = 0; k < 70; k++) {
      const [x, u] = [40 + rand() * 100, 4984 + rand() * 142];
      if (x > p.x - 3 && x < p.x + p.w + 3 && u < p.u + p.h + 2) continue;
      if (Math.abs(x - 90) < 17) continue;
      tree(pick(['broadleaf', 'broadleaf', 'pine', 'sakura']), x, u, 2.2 + rand() * 1.6);
    }
    for (const [x, u] of [[78, 5070], [102, 5070], [78, 5124], [102, 5124], [60, 5072], [120, 5072]]) lampAt(x, u);
    crowd(82, 5068, 16, 52, 10);
  }

  // ---- the moat's walls: fitted stone where a bank faces us, a white wall under tiles along the island's edge
  ground(() => {
    const band = (x0, x1, u, hgt, s) => {
      for (let X = FX(x0); X < FX(x1); X++) for (let j = 0; j < hgt; j++) P(X, FY(u) + j, shade(stone(X, j, s), 1 - j * 0.035));
    };
    band(34, 146, 5192, 12, 3); // the island's south face, down into the water
    band(8, 172, 5770, 9, 4); // the far bank's
    for (let X = FX(34); X < FX(146); X++) {
      for (const [u, t] of [[5192, 1], [5744, 0]]) {
        P(X, FY(u) - 3 + t * 0, TILE);
        P(X, FY(u) - 2, WHITE);
        P(X, FY(u) - 1, X % 9 === 0 ? 0x8a8a84 : WHITE);
      }
    }
    for (let Y = FY(5744); Y < FY(5192); Y++) for (const [x, d] of [[34, 0], [146, -2]]) {
      if (x === 34 && Math.abs(5690 - (ctx.L - Y / S)) < 60) continue; // (Chidorigafuchi opens into the island here)
      P(FX(x) + d, Y, WHITE);
      P(FX(x) + d + 1, Y, TILE);
    }
  });

  // ---- the stone bridge to the main gate: parapets, four lamps on iron posts; the wooden one on the far side
  ground(() => {
    for (let Y = FY(5194); Y < FY(5164); Y++) {
      for (let i = -13; i <= 13; i++) P(FX(90) + i, Y, Math.abs(i) > 10 ? (Math.abs(i) === 13 ? 0x5a5a56 : 0xc4c0b4) : (Y % 6 === 0 ? 0x9a968a : 0xb0ac9e));
      for (let k = 14; k <= 17; k++) ctx.img.hi.tint(FX(90) + k, Y + 2, 0.76);
    }
    for (let Y = FY(5772); Y < FY(5742); Y++) for (let i = -11; i <= 11; i++) P(FX(90) + i, Y, Math.abs(i) > 9 ? 0x5a3a28 : Y % 3 === 0 ? 0x8a6a48 : 0xa8845c);
  });
  for (const u of [5168, 5188]) for (const dx of [-4.4, 4.4]) lampAt(90 + dx, u, 0xffe8b0);
  for (const u of [5746, 5766]) for (const dx of [-3.8, 3.8]) mark(90 + dx, u, (X, Y) => R(X, Y - 3, 2, 3, 0x3a2a20));

  // ---- the gate and the turrets
  {
    const g = plot('seimon');
    pave(g.x, g.u, g.w, g.h, 'gravel', 123);
    building(g.x, g.u, 9, 12, { style: 'stone', face: 4, roof: 0x8c8e8a, lit: 0, s: 1210, top: () => {} });
    building(g.x + 19, g.u, 9, 12, { style: 'stone', face: 4, roof: 0x8c8e8a, lit: 0, s: 1211, top: () => {} });
    house(g.x + 1, g.u + 4, 26, 9, { tile: TILE, wall: WHITE, face: 2, s: 1212, over: g.u, rank: 3 });
    for (const dx of [10, 18]) lampAt(g.x + dx, g.u - 2, 0xffe8b0);
    const t = plot('tatsumi_yagura');
    pave(t.x, t.u, t.w, t.h, 'gravel', 124);
    yagura(t.x, t.u, t.w, t.h, 2, 1220);
    const f = plot('fujimi_yagura');
    pave(f.x, f.u, f.w, f.h, 'gravel', 125);
    yagura(f.x, f.u, f.w, f.h, 3, 1230);
    halo(FX(t.x + 7), FY(t.u + 6), 30, 26, 0xfff0d0, 0.14);
    halo(FX(f.x + 9), FY(f.u + 9), 36, 30, 0xfff0d0, 0.14);
  }

  // ---- the palace: halls under copper round their courts
  {
    const p = plot('kyuden');
    pave(p.x, p.u, p.w, p.h, 'gravel', 126);
    const hall = (x, u, w, h, o = {}) => house(p.x + x, p.u + u, w, h, { tile: COPPER, wall: 0xe8e0d0, ...o });
    hall(3, 36, 58, 17, { face: 3, s: 1241 }); // the hall of state
    hall(3, 8, 13, 27, { hip: false, s: 1242 });
    hall(48, 8, 13, 27, { hip: false, s: 1243 });
    hall(18, 3, 28, 9, { s: 1244 });
    hall(12, 54, 40, 6, { hip: false, s: 1245 });
    ground(() => {
      for (let u = p.u + 14; u < p.u + 34; u += 1 / 3) for (let x = p.x + 18; x < p.x + 46; x += 1 / 3) P(FX(x), FY(u), hashPx(FX(x), FY(u), 127) < 0.5 ? 0xd8d2c4 : 0xcec8ba); // the east court: raked white
    });
    for (const [x, u] of [[20, 16], [44, 16], [20, 32], [44, 32]]) lampAt(p.x + x, p.u + u, 0xffe8b0);
    for (const [x, u] of [[32, 24]]) tree('pine', p.x + x, p.u + u, 3);
  }

  // ---- the plaza garden: lawn set with black pines, each clipped apart from the next
  const michi = [road('nijubashi'), road('kokyo_michi_1'), road('hirakawa_bashi')];
  const PLOTS = ['seimon', 'tatsumi_yagura', 'fujimi_yagura', 'kyuden', 'tenshudai'].map(plot);
  const taken = (x, u, pad) => PLOTS.some((q) => x > q.x - pad && x < q.x + q.w + pad && u > q.u - pad && u < q.u + q.h + pad) || michi.some((q) => near(q, x, u).d < 4 + pad * 0.3);
  for (let k = 0; k < 260; k++) {
    const [x, u] = [43 + rand() * 94, 5213 + rand() * 244];
    if (taken(x, u, 3)) continue;
    tree('pine', x, u, 2.2 + rand() * 1.5);
  }
  for (let u = 5216; u < 5296; u += 16) for (const dx of [-5.4, 5.4]) lampAt(90 + dx, u, 0xffe8b0);

  // ---- the forest, and the east gardens in it
  const pondIn = (x, u, pad = 0) => Math.hypot((x - 124) / (13 + pad), (u - 5560) / (19 + pad)) < 1;
  const chidori = (x, u, pad = 0) => Math.hypot((x - 26) / (24 + pad), (u - 5690) / (64 + pad)) < 1;
  for (let k = 0; k < 1300; k++) {
    const [x, u] = [36 + rand() * 108, 5196 + rand() * 546];
    if (x > 40 && x < 140 && u > 5210 && u < 5460) continue; // (the pines' lawn)
    if (x > 62 && x < 128 && u > 5598 && u < 5702) continue; // (the east gardens' open ground)
    if (taken(x, u, 2) || pondIn(x, u, 2) || chidori(x, u, 2)) continue;
    tree(pick(['broadleaf', 'broadleaf', 'broadleaf', 'cedar', 'pine', 'broadleaf']), x, u, 2.8 + rand() * 2.4);
  }
  {
    // the keep's stone base, a lawn where the inner palace stood, benches
    const p = plot('tenshudai');
    building(p.x, p.u, p.w, p.h, {
      style: 'stone', face: 7, roof: 0x7c9462, lit: 0, s: 1250,
      top: ({ X, Y, w, h, greenery, lamp }) => {
        greenery(X + 2, Y + 2, w - 4, h - 4, 31);
        R(X + 6, Y + 8, w - 12, 5, 0xb9b1a0);
        R(X + (w >> 1) - 3, Y + 8, 6, h - 10, 0xb9b1a0);
        lamp(X + 8, Y + h - 4);
        lamp(X + w - 9, Y + h - 4);
      },
    });
    ground(() => {
      for (let u = 5604; u < 5634; u += 1 / 3)
        for (let x = 68; x < 122; x += 1 / 3) {
          const d = ((x - 95) / 26) ** 2 + ((u - 5619) / 14) ** 2;
          if (d < 1 && hashPx(FX(x), FY(u), 5) > (d - 0.82) * 5) P(FX(x), FY(u), hashPx(FX(x), FY(u), 6) < 0.5 ? 0x76a455 : 0x6c9a4e);
        }
      // the ramp up the base's side
      for (let j = 0; j < 27; j++) R(FX(p.x) - 9, FY(p.u) - j, 9, 1, j % 3 === 0 ? 0x6a6c68 : 0x9a9c96);
    });
    for (const [x, u] of [[68, 5604], [122, 5604], [68, 5696], [122, 5696], [95, 5636]]) lampAt(x, u, 0xffe8b0);
    for (const x of [72, 118]) for (const u of [5650, 5680]) tree('sakura', x, u, 3);
    crowd(70, 5606, 50, 26, 12);
    crowd(92, 5640, 4, 100, 12);
  }
  // the second garden: the pond, irises on its south bank, a tea house, lanterns
  ground(() => {
    for (let u = 5536; u < 5548; u += 1 / 3)
      for (let x = 108; x < 140; x += 1 / 3) {
        if (pondIn(x, u, -0.4) || !pondIn(x, u, 4)) continue;
        const v = hashPx(FX(x), FY(u), 75);
        P(FX(x), FY(u), v < 0.3 ? 0x7a50c0 : v < 0.44 ? 0xb090e0 : v < 0.5 ? 0xf4f0f8 : 0x3e7a3c);
      }
  });
  house(104, 5566, 10, 8, { tile: 0x7c6050, wall: 0xe4dccc, s: 1260 });
  for (const [x, u] of [[110, 5546], [138, 5560], [118, 5582]])
    mark(x, u, (X, Y) => {
      R(X - 1, Y - 2, 3, 3, 0x6a6a66);
      ER(X - 1, Y - 5, 3, 3, 0xffd880);
      R(X - 2, Y - 6, 5, 1, 0x8a8a84);
      halo(X, Y - 3, 9, 8, 0xffc060, 0.24);
    });
  for (let u = 5370; u < 5640; u += 30) lampAt((u < 5500 ? 90 - ((u - 5360) / 140) * 20 : 70 + ((u - 5500) / 140) * 24) + 3.6, u, 0xffe8b0); // (down the path through the forest)

  // ---- Chidorigafuchi: cherries leaning over the water, lit from below; the boat house and its pier
  for (let k = 0; k < 64; k++) {
    const a = (k / 64) * Math.PI * 2;
    const [x, u] = [26 + Math.cos(a) * 27.5 + rand() * 1.4, 5690 + Math.sin(a) * 67.5 + rand() * 1.4];
    if ((x > 8.5 && x < 34 && !chidori(x, u, -2)) || x < 1 || (x > 8 && x < 34)) continue;
    tree('sakura', x, u, 3 + rand());
    if (k % 3 === 0) halo(FX(x), FY(u), 22, 20, 0xffb0d0, 0.2);
  }
  for (let u = 5200; u < 5760; u += 9.5) {
    // (and down both outer banks of the moat)
    tree(u > 5560 ? 'sakura' : pick(['sakura', 'pine', 'broadleaf']), 4.4 + rand(), u, 2.6 + rand() * 0.8);
    tree(pick(['sakura', 'pine', 'broadleaf', 'pine']), 175.6 - rand(), u + 4, 2.6 + rand() * 0.8);
    if (Math.round(u / 9.5) % 4 === 0) {
      lampAt(6.6, u + 4.6, 0xffe8b0);
      lampAt(173.4, u + 0.4, 0xffe8b0);
    }
  }
  house(1, 5596, 6.4, 10, { tile: 0x7c6050, wall: 0xe4dccc, hip: false, lantern: true, s: 1270 });
  ground(() => {
    for (let j = 0; j < 9; j++) for (let i = 0; i < 26; i++) P(FX(8) + i, FY(5604) + j, j === 0 || j === 8 ? 0x5a3a28 : i % 3 === 0 ? 0x8a6a48 : 0xa8845c);
    for (let k = 0; k < 3; k++) {
      // boats tied up along it
      R(FX(8) + 3 + k * 8, FY(5604) + 9, 5, 9, 0x6a4a30);
      R(FX(8) + 4 + k * 8, FY(5604) + 10, 3, 7, [0xe8e0c8, 0xd04848, 0x4870c8][k]);
    }
  });

  // ---- on the water: swans on the moat, rowing boats on Chidorigafuchi, petals coming down
  {
    const swan = (k) =>
      kit.frame(3, 2.34, 5450, (put) => {
        for (const [i, j] of [[1, 3], [2, 3], [3, 3], [4, 3], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [2, 5], [3, 5], [4, 5]]) put(i, j, j === 5 ? 0xc8ccd4 : 0xf8f8f4);
        put(5, 3 - k, 0xf8f8f4);
        put(6, 2 - k, 0xf8f8f4);
        put(6, 1 - k, 0xf8f8f4);
        put(7, 1 - k, 0xf09030);
        put(0, 4, 0xe0e4e8);
      });
    const swans = [swan(0), swan(1)];
    for (const [x, u, rx, ry, n] of [[50, 5179, 26, 7, 3], [132, 5179, 22, 7, 2], [21, 5400, 8, 110, 3], [159, 5470, 8, 150, 4], [60, 5757, 40, 7, 2]]) props.wander(x, u, rx, ry, swans, { n, sp: 2.4, turn: 'flip', fps: 1, idle: 0.3 });
    const boat = (k) =>
      kit.frame(5, 3, 5690, (put) => {
        for (let j = 3; j < 7; j++) for (let i = 1; i < 13; i++) if (!((i === 1 || i === 12) && (j === 3 || j === 6))) put(i, j, j === 3 ? 0xa8845c : j === 6 ? 0x5a3a28 : 0x8a6a48);
        put(5, 4, 0xe8c8a0);
        put(5, 5, 0xd04848);
        put(8, 4, 0x2a2228);
        put(8, 5, 0x4870c8);
        for (let q = 0; q < 3; q++) for (const s of [-1, 1]) put(6 + (k ? q : -q) , 4.5 + s * (2.5 + q) | 0, 0xd8c8a0); // the oars, pulled and feathered
      });
    props.wander(26, 5690, 15, 46, [boat(0), boat(1)], { n: 5, sp: 3, turn: 'rot', fps: 1.5, idle: 0.35 });
    const petals = (k) =>
      kit.frame(4, 4, 5690, (put) => {
        for (let q = 0; q < 5; q++) put(Math.floor(hashPx(q, 1, 9) * 8) + k, Math.floor(hashPx(q, 2, 9) * 6) + k * 1.4 | 0, q % 2 ? 0xffd0e0 : 0xffb0cc, 0.9 - k * 0.15);
      }, true);
    props.spot([[0, 5760, 56, 140], [34, 5700, 100, 100]], [petals(0), petals(1), petals(2), petals(3)], { rate: 9, fps: 5, a: 0.8 });
  }

  // ---- Marunouchi: the towers, the avenue of ginkgos to the station, the square
  for (const [id, sx] of [['maru_biru_l', 0], ['maru_biru_r', 1]]) {
    const p = plot(id);
    pave(p.x, p.u, p.w, p.h, 'plaza', 131);
    for (const k of [0, 1]) {
      const near90 = k === 1 - sx;
      building(p.x + 1 + k * 34, p.u + 1, 32, 38, {
        face: near90 ? 29 : 25, style: near90 ? 'glass' : 'granite', glass: [0x2a3a58, 0x8eaed4], wall: 0xc8c4bc, roof: 0x70747c, shop: true, s: 1300 + sx * 2 + k, lit: 0.62,
        tiers: [{ in: [3, 3, 3, 3], face: 3, heli: near90 ? 1 : 0 }],
      });
    }
  }
  for (let u = 5802; u < 5850; u += 8) for (const dx of [-10.6, 10.6]) tree('broadleaf', 90 + dx, u, 2.2);
  {
    // the square: lawns each side of the paved middle, lamps, people, taxis at the kerb
    ground(() => {
      for (const x0 of [36, 104])
        for (let u = 5858; u < 5894; u += 1 / 3) for (let x = x0; x < x0 + 40; x += 1 / 3) P(FX(x), FY(u), hashPx(FX(x), FY(u), 6) < 0.5 ? 0x6c9a4e : 0x76a455);
      for (let u = 5852; u < 5898; u += 1 / 3) for (let i = -30; i < 30; i++) if ((Math.floor(u * 3) + i) % 12 === 0 || i % 12 === 0) P(FX(90) + i, FY(u), 0x8a867c);
    });
    for (const x of [34, 56, 78, 102, 124, 146]) for (const u of [5854, 5896]) lampAt(x, u, 0xffe8b0);
    for (const x of [40, 72, 108, 140]) tree('broadleaf', x, 5876, 2.6);
    crowd(80, 5852, 20, 46, 40);
    crowd(32, 5852, 116, 5, 24);
    for (let k = 0; k < 5; k++) car(34 + k * 6, 5899.4, false, k % 3 ? 0xe8c020 : 0x2a2a30);
  }

  // ---- Tokyo Station: red brick banded in white, slate above, a dome at each end and a gable in the middle
  {
    const p = plot('tokyo_eki');
    const SLATE = 0x687084;
    claim(p.x, p.u + p.h, p.w, 5958 - p.u - p.h); // (nothing between the station and its platforms)
    pave(p.x, p.u + p.h - 6, p.w, 5958 - p.u - p.h + 6, 'paving', 133);
    building(p.x, p.u, p.w, p.h - 6, {
      face: 10, style: 'brick', wall: 0xa8483a, roof: SLATE, s: 1310, lit: 0.6,
      top: ({ X, Y, w, h, E: lit }) => {
        // the slate in courses, a row of dormers, copper along the ridge
        for (let j = 2; j < h - 2; j += 3) for (let i = 2; i < w - 2; i++) P(X + i, Y + j, shade(SLATE, 0.86));
        for (let i = 0; i < w; i++) P(X + i, Y + (h >> 1), shade(COPPER, 1.1));
        for (let i = 14; i < w - 14; i += 16) {
          R(X + i, Y + h - 16, 6, 6, shade(SLATE, 1.2));
          lit(X + i + 2, Y + h - 12, 0xffe6a0);
          lit(X + i + 3, Y + h - 12, 0xffe6a0);
        }
        // the domes: eight ribbed faces, a lantern on top
        for (const cx of [Math.round(w * 0.14), Math.round(w * 0.86)]) {
          const cy = h >> 1;
          for (let j = -22; j <= 22; j++)
            for (let i = -26; i <= 26; i++) {
              const d = Math.max(Math.abs(i) / 26, Math.abs(j) / 22, (Math.abs(i) / 26 + Math.abs(j) / 22) / 1.42);
              if (d > 1) continue;
              const a = Math.atan2(j, i);
              let c = shade(0x7a8494, 1.25 - d * 0.35 - (i + j > 0 ? 0.22 : 0));
              if (Math.abs(((a / (Math.PI / 4)) % 1 + 1) % 1 - 0.5) > 0.44) c = shade(COPPER, 1.05);
              if (d > 0.93) c = 0x2c2e34;
              P(X + cx + i, Y + cy + j, c);
            }
          R(X + cx - 3, Y + cy - 3, 6, 6, shade(COPPER, 1.2));
          lit(X + cx - 1, Y + cy - 1, 0xfff0c0);
          lit(X + cx, Y + cy - 1, 0xfff0c0);
        }
        // the gable over the middle door
        const m = w >> 1;
        for (let j = 0; j < 18; j++) R(X + m - 18 + j, Y + h - 20 + j, 36 - j * 2, 1, j % 3 === 0 ? shade(SLATE, 0.8) : shade(SLATE, 1.15));
      },
    });
    // its front, floodlit from the square
    for (let x = p.x + 10; x < p.x + p.w; x += 22) halo(FX(x), FY(p.u + 4), 44, 30, 0xffb878, 0.2);
    for (let x = p.x + 6; x < p.x + p.w; x += 12) lampAt(x, p.u - 1.4, 0xffd8a0);
    crowd(p.x + 20, p.u - 4, p.w - 40, 3, 30);

    // the platforms behind: canopies over twelve tracks, trains of every line
    const plats = [5965, 5975, 5985, 5995, 6005, 6015];
    ground(() => {
      for (const uc of plats)
        for (let x = 0; x < 180; x++) {
          R(FX(x), FY(uc + 1.34), 3, 8, 0xbdb9b0);
          R(FX(x), FY(uc + 1.34), 3, 1, 0xe8c840);
          R(FX(x), FY(uc + 1.34) + 7, 3, 1, 0xe8c840);
        }
    });
    for (const [k, uc] of plats.entries()) {
      const f = kit.frame(180, 3.34, uc, (put, c) => {
        for (let j = 0; j < c.hi.h; j++)
          for (let i = 0; i < c.hi.w; i++) {
            if ((i + k * 70) % 250 > 214) continue;
            put(i, j, kit.canopy(i, j, c.hi.h));
          }
      });
      props.loop(0, uc + 1.67, [f], { fps: 1, d: 0.1 });
      for (let x = 10; x < 180; x += 30) halo(FX(x + k * 5), FY(uc), 30, 8, 0xfff0d0, 0.1);
    }
    const LINES = [[0, -1, 0x9acd32, 0.1], [1, 1, 0x40a8e0, 0.5], [2, -1, 0xf07a20, 0.8], [3, 1, 0xf07a20, 0.25], [4, -1, 0x2a6ad0, 0.6], [6, 1, 0xe8c020, 0.9], [7, -1, 0x30a070, 0.35], [9, 1, 0x2a5ab0, 0.7], [10, -1, 0x2a5ab0, 0.15], [11, 1, 0xd03a5a, 0.55]];
    for (const [k, from, band, s0] of LINES) kit.train(5962.5 + 5 * k, from, band, { stop: 74 + ((k * 19) % 34), n: k >= 9 ? 8 : 7, hold: 6 + (k % 3) * 2, sp: k >= 9 ? 44 : 34, s0 });

    // the far side: a long white sail of a roof over the doors, taxis and coaches under the towers
    mark(34, 6040, (X, Y) => {
      for (let j = 0; j < 20; j++)
        for (let i = 0; i < 336; i++) {
          const sag = Math.round(Math.sin((i / 336) * Math.PI) * 4);
          if (j < 4 - sag || j > 17 - sag * 0.4) continue;
          if (j - (4 - sag) < 1 || j > 16 - sag * 0.4) P(X + i, Y - 20 + j, 0x9aa0a8);
          else E(X + i, Y - 20 + j, i % 24 === 0 ? 0xc8d0d8 : j < 9 - sag ? 0xf4f8fc : 0xdce4ec);
        }
      for (let i = 12; i < 336; i += 36) R(X + i, Y, 2, 5, 0x6a6e76);
      for (let k = 1; k <= 3; k++) for (let i = 0; i < 336; i++) ctx.img.hi.tint(X + i + k, Y + 5 + k, 0.78);
    });
    halo(FX(90), FY(6034), 190, 22, 0xe0ecff, 0.14);
    for (let k = 0; k < 7; k++) car(40 + k * 7, 6027, false, k % 3 ? 0xe8c020 : 0x2a6a4a, k % 2 === 0);
    crowd(34, 6026, 112, 10, 46);
    for (const x of [32, 60, 120, 148]) lampAt(x, 6046, 0xffe8b0);
  }

  // ---- the avenues round it all: lamps, cars held at the lights, people
  for (const u of [4877.4, 4890.6, 5139.4, 5152.6, 5789.4, 5802.6]) for (let x = 6 + (Math.round(u) % 2) * 11; x < 178; x += 22) if (Math.abs(x - 90) > 12 || u < 5100) lampAt(x, u);
  for (const x of [25.4, 34.6, 145.4, 154.6]) for (let u = 4896; u < 5140; u += 22) lampAt(x, u + (x % 2 > 1 ? 11 : 0));
  for (let k = 0; k < 5; k++) {
    car(70 - k * 9, 5148.6 + (k % 2) * 2.8, false, undefined, true);
    car(112 + k * 9, 5142.4 + (k % 2) * 2.8, false, undefined, false);
    car(30 + k * 11, 4886.6 + (k % 2) * 2.8, false, undefined, true);
    car(150 - k * 11, 4880.4 + (k % 2) * 2.8, false, undefined, false);
    car(60 - k * 10, 5798.6 + (k % 2) * 2.8, false, undefined, true);
    car(120 + k * 10, 5792.4 + (k % 2) * 2.8, false, undefined, false);
    car(28.2, 4900 + k * 46, true, undefined, false);
    car(151.8, 4920 + k * 44, true, undefined, true);
  }
  crowd(0, 5153.4, 180, 1.4, 40);
  crowd(0, 5788.2, 180, 1.4, 36);

  // ---- the blocks: ministries in stone and brick, offices round the station
  for (const b of blocks(4884, 6050, 6, 8, true)) {
    const gov = b[1] < 5146;
    for (const [x, u, w, h] of lots(b, rand, gov ? { depth: [22, 34], width: [16, 28], small: true } : { depth: [14, 22], width: [10, 18], small: true })) {
      if (w < 5 || h < 7) continue;
      const style = gov ? pick(['granite', 'brick', 'office', 'granite']) : pick(['glass', 'office', 'granite', 'glass']);
      building(x, u, w - 1, h, { style, wall: style === 'brick' ? 0xa8483a : pick([0xd4d0c4, 0xc8c4bc, 0xbdb6aa, 0xd8cfc0]), face: Math.min(h - 4, (gov ? 8 : 9) + Math.floor(rand() * 8)), shop: !gov && rand() < 0.6, sign: !gov && rand() < 0.4, heli: 0.2 });
    }
  }
  for (const [x, u, w, h] of blocks(4884, 6050, 4, 5, true)) {
    pave(x, u, w - 0.67, h - 0.67, 'park');
    for (let k = 0; k < 1 + Math.floor((w * h) / 40); k++) tree(pick(['broadleaf', 'pine', 'sakura']), x + 1.2 + rand() * Math.max(0.5, w - 2.4), u + 1.2 + rand() * Math.max(0.5, h - 2.4), 1.8 + rand());
  }
  void blend;
  void PAL;
  void S;
  void queue;
  void shadowBox;
}
