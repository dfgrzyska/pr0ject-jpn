// Ueno (u 7200-8084), at night.
//   Okachimachi's shops, and Ameyoko - the market squeezed along the viaduct: a stall to every two steps, crates
//     of fruit and fish out in the way, strings of lamps across, an arch at each end;
//   Ueno Station under its vault; the stone stairs up into the park, the bronze of the man with his dog;
//   Shinobazu pond cut in three by its causeways - lotus in the south, pedal boats in the west, ducks in the
//     east - and the red hall of Bentendō on the island where they meet;
//   the avenue of cherries, paper lamps down both sides, people sitting out under the blossom on blue sheets;
//   the zoo - pandas in the bamboo, elephants, giraffes, the monkeys' rock, flamingos, white bears, the pagoda;
//   the gold shrine of Tōshō-gū behind its rows of lanterns; the fountain; the national museum under its tiled
//     roof with a pond before it, the domed wing, the ball field under its lights, the whale outside the science
//     museum, the concert hall.
// Live: pandas, flamingos, ducks, pedal boats, the fountain, petals, lamps over the market, the trains.
import { lots } from './blocks.mjs';
import { PAL, shade, blend } from './kit.mjs';
import { makeNeon } from './neon.mjs';
import { hashPx } from '../hires.mjs';

export function ueno(ctx) {
  const { kit, blocks, pave, plot, claim, props, near, ROADS, RAILS, S } = ctx;
  const { building, house, tree, crowd, mark, ground, rand, pick, P, R, E, ER, halo, FX, FY, car } = kit;
  kit.setSun(0.1);
  const N = makeNeon(ctx);
  const lampAt = (x, u, c) => mark(x, u, (X, Y) => kit.lamp(X, Y, c));
  const lanternAt = (x, u, c) => mark(x, u, (X, Y) => kit.lantern(X, Y, c));
  const disc = (X, Y, r, col, ry = r) => {
    for (let j = -ry; j <= ry; j++) for (let i = -r; i <= r; i++) if (Math.hypot(i / r, j / ry) <= 1.02) P(X + i, Y + j, col(i, j, Math.hypot(i / r, j / ry)));
  };
  const TILE = 0x4a5260;
  const WARM = 0xffe8b0;

  // ---- Ameyoko: stalls down its west side, crates out front, lamps strung across, an arch at each end
  claim(129.6, 7204, 7.4, 246);
  pave(129.6, 7204, 7.4, 246, 'paving', 161);
  for (let u = 7208, k = 0; u < 7444; u += 8, k++) {
    if (Math.abs(u + 3.5 - 7290) < 6 || Math.abs(u + 3.5 - 7380) < 6) continue;
    const c = PAL.awning[(k * 5) % 8];
    building(130, u, 6.8, 7.4, {
      face: 4, style: 'plain', wall: 0x4a4650, roof: c, shop: true, s: 1500 + k, lit: 1,
      top: ({ X, Y, w, h, R: rect }) => {
        for (let i = 0; i < w; i += 4) rect(X + i, Y, 2, h, 0xf4f0e8);
      },
    });
    // crates: fruit, fish on ice, sweets
    mark(137.2, u + 1 + (k % 3), (X, Y) => {
      const goods = [[0xf09030, 0xe84030, 0x70b040], [0xc8d8e8, 0x8098b0, 0xf0f4f8], [0xf8d040, 0xf080a0, 0x80d0f0]][k % 3];
      for (let q = 0; q < 2; q++) {
        R(X + q * 4, Y, 3, 3, 0x8a6a48);
        P(X + q * 4, Y, goods[q]);
        P(X + q * 4 + 1, Y, goods[(q + 1) % 3]);
        P(X + q * 4 + 1, Y + 1, goods[2]);
        P(X + q * 4 + 2, Y + 1, goods[q]);
      }
    });
    if (k % 2 === 0)
      mark(137, u + 5, (X, Y) => {
        for (let i = 0; i < 18; i += 3) ER(X + i, Y + (i % 6 ? 1 : 0), 1, 1, i % 6 ? 0xff6048 : 0xfff0c0);
        halo(X + 9, Y + 3, 16, 9, 0xffc070, 0.28);
      });
  }
  for (const u of [7207, 7449])
    mark(136.4, u, (X, Y) => {
      R(X, Y - 14, 2, 14, 0x3a6a50);
      R(X + 20, Y - 14, 2, 14, 0x3a6a50);
      R(X - 1, Y - 20, 24, 2, 0x2a2630);
    });
  N.sign('chase', 136.2, 7207 + 6.4, 7.6, 2, 0xf0c020);
  N.sign('chase', 136.2, 7449 + 6.4, 7.6, 2, 0xe03a3a);
  N.twinkle(137, 7440, 6, 230, { cw: 9, ch: 21, ox: 3, oy: 8, p: 0.5, colors: [0xfff0c0, 0xffd080, 0xffffff], seed: 31, fps: 2, size: 1 });
  crowd(137.2, 7208, 5.4, 238, 230);

  // ---- the avenues: lamps, people, cars held at the lights
  for (let u = 7214; u < 7446; u += 22) {
    lampAt(98.6, u, 0xfff0d8);
    lampAt(81.4, u + 11, 0xfff0d8);
  }
  crowd(80.6, 7208, 1.6, 240, 46);
  crowd(97.8, 7208, 1.6, 240, 46);
  for (const [u, hw] of [[7200, 5.4], [7456, 7.4]])
    for (let x = 6; x < 178; x += 22) {
      if (Math.abs(x - 90) < 12 || Math.abs(x - 156) < 13) continue;
      lampAt(x, u + hw);
      lampAt(x + 11, u - hw);
    }
  for (let k = 0; k < 5; k++) {
    car(70 - k * 10, 7458.6 + (k % 2) * 2.8, false, undefined, true);
    car(112 + k * 7, 7452.4 + (k % 2) * 2.8, false, undefined, false);
    if (k < 3) car(66 - k * 9, 7201.6, false, undefined, true);
    if (k < 3) car(112 + k * 8, 7198.4, false, undefined, false);
  }
  crowd(0, 7463.4, 100, 1.4, 30);

  // ---- Ueno Station: a long front of stone, a vault of glass over the tracks, the square with its taxis
  {
    const p = plot('ueno_eki');
    building(p.x, p.u, p.w, p.h, {
      face: 10, style: 'granite', wall: 0xcfc8bc, roof: 0x7c7e84, shop: true, sign: 0x20a060, s: 1510, lit: 0.6,
      top: ({ X, Y, w, h, ac: unit, hut, solar, E: lit, R: rect }) => {
        const [x0, vw] = [FX(145), FX(167) - FX(145)];
        for (let j = 2; j < h - 2; j++)
          for (let i = 0; i < vw; i++) {
            const t = Math.abs(i - vw / 2) / (vw / 2);
            const rib = j % 9 === 0 || i === 0 || i === vw - 1 || Math.abs(i - vw / 2) < 1;
            const c = rib ? 0xdfe6ea : blend(0xbfe0e8, 0x587890, t);
            if (!rib && (j * 3 + i) % 11 < 5) lit(x0 + i, Y + j, blend(c, 0xffeab0, 0.6));
            else rect(x0 + i, Y + j, 1, 1, c);
          }
        solar(X + 6, Y + 10, 66, 20);
        for (let k = 0; k < 24; k++) unit(X + 6 + (k % 8) * 7, Y + 40 + Math.floor(k / 8) * 7);
        hut(X + 20, Y + 80, 14, 7, 0x7c7e84);
        hut(X + 54, Y + 130, 14, 7, 0x7c7e84);
        for (let k = 0; k < 16; k++) unit(X + 6 + (k % 8) * 7, Y + h - 24 + Math.floor(k / 8) * 7);
        for (let k = 0; k < 6; k++) unit(FX(169) + (k % 2) * 7, Y + 30 + Math.floor(k / 2) * 70);
      },
    });
    ctx.cover(p.x, p.u, p.w, p.h);
    for (let k = 0; k < 4; k++) car(120 + k * 6, 7466.6, false, k % 2 ? 0xe8c020 : 0x2a6a4a);
    crowd(116, 7464, 28, 5, 26);
  }

  // ---- what stands in the park, kept clear of its trees
  const kept = [];
  const keep = (x, u, w, h) => kept.push([x, u, w, h]);
  for (const id of ['ueno_eki', 'saigo', 'bentendo', 'zoo', 'toshogu', 'hakubutsukan']) {
    const q = plot(id);
    keep(q.x, q.u, q.w, q.h);
  }
  const walks = ROADS.filter((r) => ['ueno_ishidan', 'ueno_sakura_dori', 'bentendo_michi_1', 'bentendo_michi_2', 'hakubutsukan_michi'].includes(r.id));
  const rail = RAILS.find((r) => r.id === 'yamanote_kita').pts;
  const pond = (x, u, pad = 0) => Math.hypot((x - 50) / (46 + pad), (u - 7650) / (130 + pad)) < 1;
  const free = (x, u, pad = 2) =>
    !pond(x, u, pad) && !kept.some(([a, b, w, h]) => x > a - pad && x < a + w + pad && u > b - pad && u < b + h + pad) &&
    !walks.some((r) => near(r.pts, x, u).d < r.w / 2 + pad) && near(rail, x, u).d > 12 + pad && Math.hypot(x - 126, u - 7900) > 29 + pad;

  // ---- the stairs, and the man with his dog
  ground(() => {
    const st = walks[0].pts;
    for (let k = 0; k < 26; k++) {
      const [x, u] = [st[0][0] + ((st[1][0] - st[0][0]) * k) / 26, st[0][1] + ((st[1][1] - st[0][1]) * k) / 26];
      R(FX(x - 5), FY(u), 30, 1, 0x4a4a52); // (a step's edge)
    }
  });
  {
    const p = plot('saigo');
    pave(p.x - 1, p.u - 1, p.w + 2, p.h + 2, 'gravel', 162);
    mark(p.x + 3, p.u + 1, (X, Y) => {
      for (let k = 1; k <= 3; k++) for (let i = -5; i < 6; i++) ctx.img.hi.tint(X + i + k, Y + k, 0.72);
      R(X - 5, Y - 9, 11, 10, 0xa8a49c); // the plinth
      R(X - 5, Y - 9, 11, 2, 0xc8c4bc);
      R(X - 2, Y - 6, 5, 2, 0x6a6a64);
      R(X - 3, Y - 18, 5, 9, 0x6a7a5a); // the man: bronze gone green, a short robe, a hand on his sword
      R(X - 3, Y - 18, 2, 9, 0x8a9a74);
      R(X - 2, Y - 21, 3, 3, 0x6a7a5a);
      P(X - 2, Y - 21, 0x8a9a74);
      P(X + 2, Y - 14, 0x4a5a40);
      R(X + 3, Y - 12, 3, 2, 0x6a7a5a); // the dog on its lead
      P(X + 5, Y - 13, 0x6a7a5a);
      P(X + 2, Y - 12, 0x4a5a40);
    });
    lampAt(p.x - 1, p.u, WARM);
    lampAt(p.x + p.w + 1, p.u, WARM);
    crowd(p.x - 2, p.u - 4, 10, 3, 6);
  }
  for (let k = 0; k < 6; k++) {
    lanternAt(98.4 + k * 0.9, 7470 + k * 13, 0xe0402a);
    lanternAt(110.4 + k * 0.9, 7470 + k * 13, 0xe0402a);
  }
  crowd(101, 7466, 8, 76, 20);

  // ---- Shinobazu pond
  ground(() => {
    // lotus over the south of it: broad leaves crowding the water, a flower here and there
    for (let u = 7522; u < 7646; u += 2.4)
      for (let x = 6; x < 95; x += 2.6) {
        const [lx, lu] = [x + hashPx(x * 3, u, 61) * 2, u + hashPx(x * 3, u, 62) * 2];
        if (!pond(lx, lu, -3) || Math.abs(lx - 50) < 3.6 || hashPx(x * 3, u, 63) < 0.12) continue;
        const r = 3 + Math.floor(hashPx(x * 3, u, 64) * 2);
        const g = shade(0x3a7a48, 0.8 + hashPx(x * 3, u, 65) * 0.45);
        disc(FX(lx), FY(lu), r, (i, j, d) => (d > 0.8 ? shade(g, 0.72) : i + j < -1 ? shade(g, 1.2) : g));
        if (hashPx(x * 3, u, 66) < 0.22) {
          P(FX(lx), FY(lu) - 1, 0xffd0e0);
          P(FX(lx) + 1, FY(lu) - 1, 0xf890b8);
          P(FX(lx), FY(lu), 0xf890b8);
        }
      }
    // the causeways' edges: a kerb of stone, a rail
    for (const r of walks.slice(2, 4)) {
      const [a, b] = r.pts;
      if (a[0] === b[0]) for (const d of [-2.4, 2.1]) R(FX(a[0] + d), FY(Math.max(a[1], b[1])), 1, Math.abs(b[1] - a[1]) * S, 0x8a8a84);
      else for (const d of [-2.1, 2.4]) R(FX(Math.min(a[0], b[0])), FY(a[1] + d), Math.abs(b[0] - a[0]) * S, 1, 0x8a8a84);
    }
  });
  {
    // Bentendō on its island: an eight-sided hall in red under a green roof, a porch, lanterns, pines
    const p = plot('bentendo');
    ground(() => disc(FX(p.x + 8), FY(p.u + 8), 36, (i, j, d) => (d > 0.93 ? 0x8a8a84 : hashPx(i, j, 67) < 0.5 ? 0xbcb4a2 : 0xb0a896), 33));
    const [cx, cy] = [FX(p.x + 8), FY(p.u + 9)];
    kit.queue(cy + 16, () => {
      for (let j = 13; j < 20; j++) for (let i = -9; i <= 9; i++) P(cx + i, cy + j, i === -9 || i === 9 || j === 19 ? PAL.ink : Math.abs(i) < 2 ? 0x4a2a20 : i % 4 === 0 ? 0xe8dcc0 : 0xc8402e); // the wall under the eave
      for (let j = -15; j <= 15; j++)
        for (let i = -15; i <= 15; i++) {
          const d = Math.max(Math.abs(i), Math.abs(j), (Math.abs(i) + Math.abs(j)) / 1.42) / 15;
          if (d > 1) continue;
          const a = Math.atan2(j, i);
          let c = shade(0x4a8a70, 1.3 - d * 0.4 - (i + j > 0 ? 0.26 : 0));
          if (Math.abs((((a / (Math.PI / 4)) % 1) + 1) % 1 - 0.5) > 0.42) c = shade(0x4a8a70, 0.7);
          if (d > 0.92) c = 0x24323a;
          P(cx + i, cy + j, c);
        }
      R(cx - 1, cy - 2, 3, 3, 0xe8c040);
      R(cx - 6, cy + 20, 12, 4, 0x4a8a70); // the porch
      R(cx - 6, cy + 24, 12, 1, PAL.ink);
    }, () => kit.shadowBox(cx - 15, cy - 15, 30, 34, 4, 0.66));
    for (const [dx, du] of [[-5, -1], [5, -1], [-5, 15], [5, 15]]) lanternAt(p.x + 8 + dx, p.u + du + 1, 0xe0402a);
    for (const [dx, du] of [[-9, 4], [9, 12], [-8, 14], [9, 3]]) tree('pine', p.x + 8 + dx, p.u + 8 + du - 8, 2.2);
    halo(cx, cy + 14, 30, 24, 0xffc080, 0.2);
    crowd(p.x + 2, p.u - 3, 12, 3, 8);
  }
  // lamps and trees round the bank, lamps down the causeways
  for (let k = 0; k < 44; k++) {
    const a = (k / 44) * Math.PI * 2;
    const [x, u] = [50 + Math.cos(a) * 48.6, 7650 + Math.sin(a) * 133];
    if (x < 2 || x > 97 || u < 7468) continue;
    if (k % 2 === 0) lampAt(x, u, WARM);
    else if (free(x, u, 0.5)) tree(pick(['sakura', 'broadleaf', 'broadleaf']), x + (x < 50 ? -1 : 1), u, 2.4 + rand());
  }
  for (let u = 7530; u < 7780; u += 24) if (Math.abs(u - 7650) > 12) lampAt(52.6, u, WARM);
  for (let x = 62; x < 118; x += 18) lampAt(x, 7652.8, WARM);
  crowd(48.6, 7524, 2.8, 110, 22);
  crowd(48.6, 7664, 2.8, 110, 18);
  crowd(60, 7648.6, 56, 2.8, 16);
  // the boat house and its pier on the west bank
  house(0.6, 7696, 6.4, 11, { tile: 0x7c6050, wall: 0xe4dccc, hip: false, lantern: true, s: 1520 });
  ground(() => {
    for (let j = 0; j < 9; j++) for (let i = 0; i < 30; i++) P(FX(7.6) + i, FY(7704) + j, j === 0 || j === 8 ? 0x5a3a28 : i % 3 === 0 ? 0x8a6a48 : 0xa8845c);
  });
  keep(0, 7694, 9, 14);
  {
    // on the water: pedal boats with a bird's neck in the west, ducks in the east
    const boat = (k, c) =>
      kit.frame(5, 3.34, 7710, (put) => {
        for (let j = 3; j < 9; j++) for (let i = 1; i < 12; i++) if (!((i === 1 || i === 11) && (j === 3 || j === 8))) put(i, j, j === 8 ? 0xb8c0cc : 0xf4f4f0);
        for (let j = 4; j < 8; j++) for (let i = 3; i < 8; i++) put(i, j, j === 4 || i === 3 ? shade(c, 1.2) : c); // its little roof
        put(12, 5, 0xf4f4f0);
        put(13, 4, 0xf4f4f0);
        put(13, 3, 0xf4f4f0);
        put(13, 2 - k, 0xf4f4f0);
        put(14, 2 - k, 0xf09030);
        put(0, 6, 0xd0e0f0, 0.6 + k * 0.3);
      });
    props.wander(27, 7712, 13, 40, [0xd04848, 0x4870c8, 0xe8c040].flatMap((c) => [boat(0, c), boat(1, c)]), { n: 6, sp: 2.6, turn: 'flip', fps: 1, idle: 0.3 });
    const duck = (k) =>
      kit.frame(2, 1.34, 7710, (put) => {
        for (let i = 1; i < 5; i++) put(i, 2, i === 1 ? 0x5a4a38 : 0x8a7050);
        for (let i = 2; i < 5; i++) put(i, 3, 0x6a5840);
        put(5, 1 + k, 0x2a6a4a);
        put(0, 3, 0xd0e0f0, 0.5);
      });
    props.wander(72, 7705, 12, 34, [duck(0), duck(1)], { n: 7, sp: 1.6, turn: 'flip', fps: 1, idle: 0.5 });
  }

  // ---- the avenue of cherries: blossom lit from below, paper lamps, people sitting out on blue sheets
  for (let u = 7576, k = 0; u < 7878; u += 7.4, k++) {
    for (const s of [-1, 1]) {
      const x = 126 + s * (8.6 + (k % 2) * 1.2);
      if (!kept.some(([a, b, w, h]) => x > a - 3 && x < a + w + 3 && u > b - 3 && u < b + h + 3)) tree('sakura', x, u + (s > 0 ? 3.4 : 0), 3.2 + rand() * 0.8);
      if (k % 2 === 0) halo(FX(x), FY(u), 24, 22, 0xffb0d0, 0.22);
      lanternAt(126 + s * 5.4, u + 2, k % 2 ? 0xffe0c0 : 0xf08098);
    }
    if (k % 3 === 0)
      for (const s of [-1, 1]) {
        const [x, uu] = [126 + s * (7.4 + rand() * 3), u + 3.6];
        if (kept.some(([a, b, w, h]) => x > a - 2 && x < a + w + 2 && uu > b - 2 && uu < b + h + 2)) continue;
        ground(() => R(FX(x) - 4, FY(uu) - 3, 9, 6, (k / 3) % 2 ? 0x3a6ac8 : 0x4a80d8));
        crowd(x - 1.2, uu - 0.6, 2.4, 1.4, 3);
      }
  }
  crowd(121, 7574, 10, 304, 150);
  {
    const petals = (k) =>
      kit.frame(4, 4, 7700, (put) => {
        for (let q = 0; q < 5; q++) put(Math.floor(hashPx(q, 1, 9) * 8) + k, (Math.floor(hashPx(q, 2, 9) * 6) + k * 1.4) | 0, q % 2 ? 0xffd0e0 : 0xffb0cc, 0.9 - k * 0.15);
      }, true);
    props.spot([[112, 7880, 28, 306]], [petals(0), petals(1), petals(2), petals(3)], { rate: 8, fps: 5, a: 0.8 });
  }

  // ---- the zoo
  {
    const p = plot('zoo');
    pave(p.x, p.u, p.w, p.h, 'paving', 163);
    ground(() => {
      for (let i = 0; i < p.w * S; i++) for (const u of [p.u, p.u + p.h]) P(FX(p.x) + i, FY(u), i % 3 ? 0x2a4a3a : 0x1c3028);
      for (let j = 0; j < p.h * S; j++) if (Math.abs(j - (p.u + p.h - 7690) * S) > 9) P(FX(p.x), FY(p.u + p.h) + j, j % 3 ? 0x2a4a3a : 0x1c3028);
    });
    mark(p.x, 7693, (X, Y) => {
      // the gate
      R(X - 1, Y - 12, 2, 12, 0x3a6a50);
      R(X - 1, Y + 6, 2, 12, 0x3a6a50);
      ER(X - 2, Y - 14, 4, 2, 0xfff0c0);
      ER(X - 2, Y + 18, 4, 2, 0xfff0c0);
    });
    const yard = (x, u, w, h, kind, s) => {
      pave(x, u, w, h, kind, s);
      ground(() => {
        for (let i = 0; i < w * S; i++) for (const uu of [u, u + h]) P(FX(x) + i, FY(uu), i % 4 ? 0x6a6e66 : 0x44463e);
        for (let j = 0; j < h * S; j++) for (const xx of [x, x + w]) P(FX(xx), FY(u + h) + j, j % 4 ? 0x6a6e66 : 0x44463e);
      });
    };
    const pool = (x, u, rx, ry) => ground(() => disc(FX(x), FY(u), rx * S, (i, j, d) => (d > 0.9 ? 0x9aa0a0 : (i + j * 3) % 7 === 0 ? 0x6aa8c8 : 0x2e6a8c), ry * S));
    const beast = (x, u, fn) => mark(x, u, (X, Y) => fn(X, Y));
    // pandas in the bamboo, their house beside it, a queue at the rail
    yard(140, 7674, 21, 24, 'park', 164);
    for (let k = 0; k < 16; k++) tree('bamboo', 141.6 + rand() * 18, 7688 + rand() * 9, 1.6 + rand() * 0.8);
    building(163, 7676, 13, 20, { face: 4, style: 'glass', glass: [0x2a3a58, 0x8eaed4], roof: 0x6c7a74, s: 1530, lit: 0.7 });
    {
      const panda = (k) =>
        kit.frame(3, 2.34, 7685, (put) => {
          for (let j = 1; j < 6; j++) for (let i = 1; i < 8; i++) if (!((i === 1 || i === 7) && (j === 1 || j === 5))) put(i, j, 0xf4f4f0);
          for (const [i, j] of [[6, 0], [8, 2], [7, 2], [6, 2], [2, 2], [3, 2], [2, 3], [3, 3]]) put(i, j, 0x1c1c22); // ears, eyes, shoulders
          for (const i of [2 + k, 5 - k]) {
            put(i, 6, 0x1c1c22);
            put(i + 1, 6, 0x1c1c22);
          }
          put(8, 3, 0xf4f4f0);
          put(8, 4, 0x1c1c22);
        }, true);
      props.wander(150.5, 7681, 8, 4, [panda(0), panda(1)], { n: 3, sp: 1.4, turn: 'flip', fps: 2, idle: 0.6, d: 0.05 });
    }
    crowd(140, 7671, 21, 2.4, 26);
    for (const x of [140, 161]) lampAt(x, 7672, WARM);
    // elephants on sand, a pool to wade in; the monkeys' rock
    yard(138, 7704, 22, 34, 'sand', 165);
    pool(144, 7730, 4.6, 3.4);
    for (const [x, u, f] of [[146, 7712, 1], [154, 7722, -1], [151, 7732, 1]])
      beast(x, u, (X, Y) => {
        for (let k = 1; k <= 2; k++) for (let i = -5; i < 6; i++) ctx.img.hi.tint(X + i + k, Y + 4 + k, 0.74);
        disc(X, Y, 5, (i, j, d) => (d > 0.86 ? 0x5a5e64 : i + j < -2 ? 0xa8acb2 : 0x8a8e96), 4);
        disc(X + f * 5, Y - 1, 3, (i, j) => (i + j < 0 ? 0xa8acb2 : 0x8a8e96));
        R(X + f * 8 - (f < 0 ? 2 : 0), Y, 3, 1, 0x8a8e96); // the trunk
        P(X + f * 3, Y - 4, 0x74787e);
        P(X + f * 3, Y + 2, 0x74787e);
      });
    yard(163, 7706, 13, 30, 'gravel', 166);
    mark(169.5, 7720, (X, Y) => {
      disc(X, Y, 15, (i, j, d) => shade(0x8a8478, 1.3 - d * 0.5 - (i + j > 0 ? 0.2 : 0) + hashPx(i >> 1, j >> 1, 68) * 0.16), 22);
      for (let k = 0; k < 9; k++) {
        const [i, j] = [Math.round((hashPx(k, 1, 69) - 0.5) * 20), Math.round((hashPx(k, 2, 69) - 0.5) * 30)];
        R(X + i, Y + j, 2, 2, 0x8a5a38);
        P(X + i + 1, Y + j, 0xd8a890);
      }
    });
    // giraffes; flamingos round their pond
    yard(138, 7742, 20, 34, 'sand', 167);
    for (const [x, u, f] of [[144, 7752, 1], [152, 7764, -1]])
      beast(x, u, (X, Y) => {
        for (let k = 1; k <= 2; k++) for (let i = -3; i < 4; i++) ctx.img.hi.tint(X + i + k, Y + 5 + k, 0.74);
        for (let j = -4; j <= 4; j++) for (let i = -3; i <= 3; i++) if (Math.abs(i) + Math.abs(j) < 7) P(X + i, Y + j, (i + j * 2) % 3 === 0 ? 0x8a5a28 : 0xe8c070);
        for (let q = 0; q < 8; q++) P(X + f * (2 + (q >> 1)), Y - 4 - q, q % 3 === 0 ? 0x8a5a28 : 0xe8c070); // the neck, a long way up
        R(X + f * 6 - (f < 0 ? 1 : 0), Y - 13, 2, 2, 0xe8c070);
      });
    for (const [x, u] of [[141, 7770], [155, 7748]]) tree('broadleaf', x, u, 2);
    yard(161, 7744, 15, 30, 'park', 168);
    pool(168.5, 7758, 5.6, 9);
    {
      const bird = (k) =>
        kit.frame(1.34, 2.34, 7758, (put) => {
          put(1, 3, 0xff90b0);
          put(2, 3, 0xff70a0);
          put(2, 4, 0xff90b0);
          put(1, 4, 0xff70a0);
          put(3, 2 - k, 0xff90b0);
          put(3, 1 - k, 0xffb0c8);
          put(1 + k, 5, 0xe06080);
          put(1 + k, 6, 0xe06080);
        }, true);
      props.wander(168.5, 7758, 5, 8, [bird(0), bird(1)], { n: 9, sp: 0.8, turn: 'flip', fps: 1, idle: 0.7, d: 0.05 });
    }
    // white bears on their rocks; the pagoda, five roofs one over another
    yard(158, 7782, 18, 34, 'gravel', 169);
    pool(167, 7794, 7, 6);
    mark(167, 7806, (X, Y) => {
      disc(X, Y, 22, (i, j, d) => shade(0xd8dce4, 1.1 - d * 0.3 - (i + j > 0 ? 0.16 : 0) + hashPx(i >> 1, j >> 1, 70) * 0.1), 12);
      for (const [i, j] of [[-8, -2], [6, 3]]) {
        R(X + i, Y + j, 6, 3, 0xfffff8);
        R(X + i + 5, Y + j - 1, 2, 2, 0xfffff8);
        P(X + i + 6, Y + j - 1, 0x1c1c22);
      }
    });
    for (let k = 0; k < 5; k++)
      house(140.6 + k * 0.9, 7786 + k * 3, 11 - k * 1.8, 11 - k * 1.2, { tile: TILE, wall: 0xb83a2a, face: 1.4, s: 1540 + k, ...(k ? { over: 7786, rank: 1 + k } : {}) });
    halo(FX(146), FY(7794), 30, 34, 0xffc080, 0.2);
    for (const [x, u] of [[137.4, 7702], [160.6, 7702], [137.4, 7740], [160, 7740], [137.4, 7780], [156, 7780], [137.4, 7816], [176, 7740]]) lampAt(x, u, WARM);
    crowd(136.6, 7700.4, 40, 2.6, 18);
    crowd(136.6, 7738.6, 40, 2.6, 16);
    crowd(136.6, 7777.6, 40, 2.6, 14);
    crowd(152.4, 7784, 4, 30, 8);
  }

  // ---- Tōshō-gū: a way of stone lanterns from the avenue, a gate, the hall in gold under black tiles
  {
    const p = plot('toshogu');
    pave(p.x, p.u, p.w, p.h, 'gravel', 170);
    pave(p.x + p.w, p.u + 3, 6, 4, 'gravel', 170);
    keep(p.x + p.w, p.u + 2, 6, 6);
    house(p.x + 1.4, p.u + 12, 11.2, 12, { tile: 0x34363c, wall: 0xe0b040, face: 2.4, s: 1550 });
    house(p.x + 3.4, p.u + 8.4, 7.2, 4, { tile: 0x34363c, wall: 0xe0b040, hip: false, s: 1551 }); // the gate
    mark(p.x + p.w + 3, p.u + 8, (X, Y) => {
      // a torii of stone at the way in
      R(X - 6, Y - 12, 2, 12, 0xa8a8a0);
      R(X + 5, Y - 12, 2, 12, 0xa8a8a0);
      R(X - 8, Y - 14, 17, 2, 0xc4c4bc);
      R(X - 6, Y - 10, 13, 1, 0x9a9a92);
    });
    for (let k = 0; k < 6; k++)
      for (const dx of [1, p.w - 1.6])
        mark(p.x + dx, p.u + 1 + k * 1.3 + (dx > 2 ? 0 : 0.4), (X, Y) => {
          R(X, Y - 3, 2, 3, 0x7a7a74);
          ER(X, Y - 5, 2, 2, 0xffd880);
          R(X - 1, Y - 6, 4, 1, 0x8a8a84);
        });
    halo(FX(p.x + 7), FY(p.u + 10), 40, 30, 0xffc040, 0.26);
    crowd(p.x + 3, p.u + 2, 8, 6, 8);
  }

  // ---- the fountain: a long basin, jets in a row, people on its rim
  {
    ground(() => {
      for (let j = 0; j < 30; j++)
        for (let i = 0; i < 96; i++) {
          const rim = Math.min(i, j, 95 - i, 29 - j);
          P(FX(110) + i, FY(7906) + j, rim < 2 ? 0xc8c4bc : rim < 3 ? 0x6a6a64 : (i + j * 2) % 9 === 0 ? 0x6aa8c8 : 0x2e6a8c);
        }
    });
    const jets = (k) =>
      kit.frame(30, 7, 7900, (put) => {
        for (let q = 0; q < 7; q++) {
          const top = 4 + ((q * 5 + k * 3) % 7) + (q === 3 ? -3 : 0);
          for (let j = top; j < 21; j++) {
            put(8 + q * 12, j, 0xf4fcff, 0.9 - (j - top) * 0.02);
            if ((j + k) % 3 === 0) put(8 + q * 12 + (j % 2 ? -1 : 1), j, 0xc8e8f8, 0.7);
          }
          put(7 + q * 12, top + 1, 0xffffff, 0.8);
          put(9 + q * 12, top + 1, 0xffffff, 0.8);
        }
      }, true);
    props.loop(111, 7909, [jets(0), jets(1), jets(2)], { fps: 7, d: 0.05 });
    halo(FX(126), FY(7901), 60, 26, 0xa0d8f0, 0.26);
    for (const [x, u] of [[104, 7884], [148, 7884], [104, 7918], [148, 7918], [126, 7876], [126, 7924]]) lampAt(x, u, WARM);
    crowd(102, 7880, 48, 14, 34);
    crowd(102, 7908, 48, 14, 30);
    crowd(121, 7922, 10, 30, 14);
  }

  // ---- the national museum: the main hall under tiles, the wing with the green dome, the plain one; a pond before it
  {
    const p = plot('hakubutsukan');
    pave(p.x, p.u, p.w, p.h, 'gravel', 171);
    ground(() => {
      for (let u = p.u + 2; u < p.u + 20; u += 1 / 3)
        for (let x = p.x + 2; x < p.x + p.w - 2; x += 1 / 3) {
          const d = Math.hypot((x - 126) / 15, (u - 7965) / 6.4);
          if (d < 1) P(FX(x), FY(u), d > 0.88 ? 0x9aa0a0 : (FX(x) + FY(u) * 3) % 8 === 0 ? 0x5a98b8 : 0x285a7c);
          else if (Math.abs(x - 126) > 19 && Math.abs(x - 126) < 40) P(FX(x), FY(u), hashPx(FX(x), FY(u), 6) < 0.5 ? 0x6c9a4e : 0x76a455);
        }
    });
    building(104, 7978, 44, 30, { face: 8, style: 'granite', wall: 0xd4ccbc, roof: 0x8a8880, s: 1560, lit: 0.4, top: () => {} });
    house(105, 7984, 42, 23, { tile: TILE, wall: 0xd4ccbc, face: 2, s: 1561, over: 7978, rank: 2 });
    house(119, 7981, 14, 12, { tile: TILE, wall: 0xd4ccbc, face: 2, s: 1562, over: 7978, rank: 3 }); // the porch's gable
    building(87, 7962, 14, 24, {
      face: 6, style: 'granite', wall: 0xe0dccc, roof: 0x8a9a8a, s: 1563, lit: 0.3,
      top: ({ X, Y, w, h }) => {
        disc(X + (w >> 1), Y + (h >> 1), 12, (i, j, d) => (d > 0.9 ? 0x2c4038 : shade(0x5c9a80, 1.3 - d * 0.4 - (i + j > 0 ? 0.25 : 0))));
        R(X + (w >> 1) - 1, Y + (h >> 1) - 1, 3, 3, 0xd8c890);
        for (const i of [3, w - 5]) disc(X + i, Y + h - 5, 4, (a, b, d) => shade(0x5c9a80, 1.2 - d * 0.4));
      },
    });
    building(152, 7960, 14, 34, { face: 7, style: 'office', wall: 0xc8c0b0, roof: 0x7c7e84, s: 1564, lit: 0.3 });
    for (const [x, u] of [[104, 7958], [148, 7958], [108, 7974], [144, 7974], [120, 7976], [132, 7976]]) lampAt(x, u, WARM);
    for (const [x, u] of [[92, 7956], [100, 7990], [160, 7998], [150, 8002], [92, 8000]]) tree('pine', x, u, 2.6);
    for (const x of [104, 148]) halo(FX(x + (x < 126 ? 10 : -10)), FY(7976), 50, 22, 0xffd8a0, 0.2);
    crowd(108, 7956, 36, 3, 14);
    crowd(121, 7972, 10, 5, 10);
  }

  // ---- the west of the park: the concert hall, the ball field under its lights, the whale, the gallery
  building(99, 7598, 18, 40, {
    face: 6, style: 'plain', wall: 0xb4b0a8, roof: 0x7a7e86, s: 1570, lit: 0.5,
    tiers: [{ in: [3, 6, 3, 10], face: 4, style: 'plain', roof: 0x8a9088 }],
  });
  keep(98, 7596, 20, 44);
  pave(55, 7880, 3, 114, 'gravel', 172); // a path through the trees, from the fountain to the field and the museums
  pave(55, 7898, 44, 3, 'gravel', 172);
  keep(54, 7879, 5, 116);
  keep(54, 7897, 46, 5);
  {
    const [hx, hu] = [30, 7826];
    ground(() => {
      for (let u = hu - 2; u < hu + 52; u += 1 / 3)
        for (let x = hx - 38; x < hx + 38; x += 1 / 3) {
          const [dx, du] = [x - hx, u - hu];
          const r = Math.hypot(dx, du);
          if (du < Math.abs(dx) - 1.4 || r > 50) continue;
          let c = Math.floor(r / 4) % 2 ? 0x5c9048 : 0x66994e;
          if (r > 48.4) c = 0x2a3a34;
          else if (du < Math.abs(dx)) c = 0xb89868;
          else if (r < 20 && Math.abs(dx) + Math.abs(du - 13) > 8.6) c = hashPx(FX(x), FY(u), 71) < 0.5 ? 0xb89868 : 0xae8e60;
          if (Math.abs(du - Math.abs(dx)) < 0.3 && r < 48) c = 0xf4f0e8;
          if (Math.hypot(dx, du - 13) < 1.2) c = 0xc8a878;
          P(FX(x), FY(u), c);
        }
      for (const [dx, du] of [[0, 0.6], [-12.4, 13], [12.4, 13], [0, 25.4]]) R(FX(hx + dx) - 1, FY(hu + du) - 1, 3, 3, 0xf8f8f4);
    });
    keep(hx - 38, hu - 4, 76, 56);
    for (const [dx, du] of [[-30, 22], [30, 22], [-14, 49], [14, 49]])
      mark(hx + dx, hu + du, (X, Y) => {
        R(X, Y - 12, 1, 13, 0x5a5e66);
        ER(X - 2, Y - 15, 5, 3, 0xffffff);
        halo(X - dx * 0.8, Y + 14 - du * 0.3, 60, 44, 0xf0f4ff, 0.16);
      });
    for (const [dx, du] of [[0, 13], [0, 1.4], [-11, 14], [11, 14], [0, 24], [-7, 20], [7, 20], [-18, 32], [0, 38], [18, 32], [3, -0.6]]) crowd(hx + dx - 0.3, hu + du - 0.3, 0.6, 0.6, 1);
    crowd(hx - 8, hu - 3.6, 16, 1.6, 8);
  }
  building(8, 7926, 42, 34, {
    face: 9, style: 'granite', wall: 0xc8c0b0, roof: 0x7c7e84, shop: false, s: 1571, lit: 0.35,
    tiers: [{ in: [4, 4, 22, 6], face: 3, style: 'granite', heli: 0 }, { in: [24, 8, 4, 4], face: 5, style: 'glass' }],
  });
  keep(6, 7922, 46, 40);
  mark(44, 7919, (X, Y) => {
    // the whale: life size, diving, its tail in the air
    for (let k = 1; k <= 4; k++) for (let i = -18; i < 19; i++) ctx.img.hi.tint(X + i + k * 2, Y + 7 + k, 0.74);
    for (let i = -20; i <= 20; i++) {
      const hw = i < -14 ? (i + 21) * 0.8 : i > 8 ? Math.max(1, (21 - i) * 0.42) : 6 - Math.abs(i + 3) * 0.08;
      for (let j = -Math.round(hw); j <= Math.round(hw); j++) P(X + i, Y + j - Math.round((i + 20) * 0.22), j > hw * 0.45 ? 0xb8c8d4 : j < -hw * 0.5 ? 0x6a8aa8 : 0x4a6a8c);
    }
    for (let q = 0; q < 6; q++) {
      R(X + 19 + (q >> 1), Y - 10 - q, 2, 1, 0x4a6a8c);
      R(X + 19 + (q >> 1), Y - 8 + q, 2, 1, 0x3e5a78);
    }
    P(X - 15, Y + 1, 0x1c2430);
    R(X - 3, Y + 9, 2, 5, 0x6a6e76); // the post it stands on
  });
  keep(34, 7910, 22, 12);
  building(14, 7996, 34, 28, {
    face: 7, style: 'plain', wall: 0xb0aca4, roof: 0x8a8880, s: 1572, lit: 0.3,
    top: ({ X, Y, w, h, R: rect, E: lit }) => {
      for (let k = 0; k < 9; k++) rect(X + 30 + k, Y + 20 + k, 36 - k * 2, 1, k % 2 ? 0xbfe0e8 : 0x8ab0c4); // a skylight in a pyramid
      for (let k = 0; k < 9; k++) rect(X + 30 + k, Y + 38 - k, 36 - k * 2, 1, 0x587890);
      lit(X + 47, Y + 29, 0xffeab0);
      lit(X + 48, Y + 29, 0xffeab0);
    },
  });
  keep(12, 7982, 44, 44);
  pave(14, 7984, 42, 11, 'gravel', 173);
  for (const [x, c] of [[20, 0x3a4a44], [30, 0x4a4238], [40, 0x3a4a44]])
    mark(x, 7988, (X, Y) => {
      R(X - 2, Y - 3, 5, 4, 0xa8a49c);
      R(X - 1, Y - 9, 3, 6, c);
      P(X, Y - 10, c);
      P(X + 2, Y - 7, shade(c, 1.3));
    });
  for (const [x, u] of [[16, 7986], [46, 7986], [54, 7964], [4, 7924], [52, 7924], [58, 7940], [58, 7900], [76, 7896], [94, 7896], [58, 7884]]) lampAt(x, u, WARM);
  crowd(14, 7985, 40, 8, 12);
  crowd(55.4, 7884, 2.2, 108, 14);
  crowd(60, 7898.4, 38, 2.2, 10);

  // ---- the park's trees: thick in the north and the west, thinner by the pond; lamps down the walks
  for (let k = 0; k < 2300; k++) {
    const [x, u] = [rand() * 180, 7468 + rand() * 604];
    if (!free(x, u, 2.4)) continue;
    if (x > 60 && x < 119 && u > 7566 && u < 7880 && rand() < 0.45) continue; // (lawns between the pond and the avenue)
    tree(pick(['broadleaf', 'broadleaf', 'broadleaf', 'cedar', 'pine', 'sakura', 'broadleaf']), x, u, 2.6 + rand() * 2.4);
  }
  for (let u = 7590; u < 7880; u += 30) {
    lampAt(119.4, u, WARM);
    lampAt(132.6, u + 15, WARM);
  }
  for (const u of [7928, 7944]) for (const dx of [-4.6, 4.6]) lampAt(126 + dx, u, WARM);

  // ---- the blocks of Okachimachi: shops and signs toward the market, flats behind
  for (const b of blocks(7200, 7460, 6, 8, true)) {
    const hot = b[0] > 60;
    for (const [x, u, w, h] of lots(b, rand, { depth: [13, 20], width: [9, 16], small: true })) {
      if (w < 6 || h < 7) continue;
      const v = rand();
      if (hot || v < 0.4) {
        const face = Math.min(h - 4, 6 + Math.floor(rand() * 8));
        building(x, u, w - 1, h, { style: pick(['neon', 'neon', 'office', 'depato', 'glass']), wall: pick([0x4a4654, 0x5a5460, 0x54504c, 0xcfc8bc, 0xd8cfc0]), face, shop: true, sign: rand() < 0.8 });
        if (hot && w >= 10 && h >= 14 && rand() < 0.22) N.sign(pick(['blink', 'stack', 'chase']), x + 1, u + h - 0.4, w - 3, 3, pick(PAL.sign), u);
      } else if (v < 0.8) building(x, u, w - 1, h, { style: pick(['office', 'balcony', 'plain', 'balcony']), face: 5 + Math.floor(rand() * 6), shop: rand() < 0.5, sign: rand() < 0.4, heli: 0.1 });
      else if (v < 0.93) house(x, u, w - 1, h - 1, { hip: rand() < 0.6, lantern: rand() < 0.3 });
      else {
        pave(x, u, w - 1, h - 1, 'asphalt');
        for (let i = 3; i < w - 3; i += 4) if (rand() < 0.6) car(x + i, u + h - 5, true);
        lampAt(x + 1, u + h - 1);
      }
    }
  }
  for (const [x, u, w, h] of blocks(7200, 8084, 4, 5, true)) {
    if (u < 7460 && w >= 7 && h >= 8) building(x, u, w - 1, Math.min(h, 16), { style: pick(['plain', 'neon']), face: 4 + Math.floor(rand() * 3), shop: true, sign: rand() < 0.6 });
    else {
      pave(x, u, w - 0.67, h - 0.67, 'park');
      for (let k = 0; k < 1 + Math.floor((w * h) / 40); k++) tree(pick(['broadleaf', 'tiny', 'sakura']), x + 1.2 + rand() * Math.max(0.5, w - 2.4), u + 1.2 + rand() * Math.max(0.5, h - 2.4), 1.6 + rand());
    }
  }
  void E;
}
