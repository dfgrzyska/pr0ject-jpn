// Asakusa (u 8084-9500), at night, under paper lanterns.
//   Kappabashi - the street of kitchen shops: pots stacked out on the pavement, giant cups, a knife, a bowl of
//     noodles on the roofs; a temple behind its wall with a graveyard;
//   Kaminarimon with its great red lantern, rickshaws waiting; Nakamise - ninety stalls under copper roofs, each
//     with its own goods out on the counter, strings of lanterns across; Denbōin's garden behind its wall;
//   Hōzōmon in two storeys with the giant straw sandals, the five-storey pagoda, the court of Sensō-ji: the
//     censer smoking, the water pavilion, food stalls down both sides (and the one that bakes fish of batter),
//     the great hall floodlit over its steps, the shrine beside it;
//   Hanayashiki, the old fairground: a carousel, a tower with gondolas round it, a drop tower, tea cups, the
//     coaster running round the lot between the houses.
// Live: the lanterns swaying, the censer's smoke and the stalls' steam, pigeons, the fair's rides, cars.
import { lots } from './blocks.mjs';
import { PAL, shade, blend } from './kit.mjs';
import { makeNeon } from './neon.mjs';
import { makeWafu, RED, TILE, COPPER, GOLD, WARM } from './wafu.mjs';
import { hashPx } from '../hires.mjs';

const TAU = Math.PI * 2;

export function asakusa(ctx) {
  const { kit, blocks, pave, plot, claim, props, S } = ctx;
  const { building, house, tree, crowd, mark, ground, rand, pick, P, R, E, ER, halo, FX, FY, car, queue } = kit;
  kit.setSun(0.1);
  const N = makeNeon(ctx);
  const hi = ctx.img.hi;
  const { lampAt, lanternAt, disc, discE, drop, toro, temple, chochin, string, yatai } = makeWafu(ctx);

  // ---- the avenues: lamps, cars (keeping to the left)
  for (const [u, hw] of [[8084, 7.4], [8306, 7.4], [9496, 7.4]])
    for (let x = 6; x < 178; x += 22) {
      if (u === 8306 && Math.abs(x - 90) < 18) continue;
      lampAt(x, u + hw);
      lampAt(x + 11, u - hw);
    }
  for (const [u, s0] of [[8084, 0.1], [8306, 0.4], [9496, 0.7]]) {
    kit.trafficOn(kit.offset([[-12, u], [192, u]], 3), { sp: 21, gap: 110, s0, u });
    kit.trafficOn(kit.offset([[192, u], [-12, u]], 3), { sp: 19, gap: 130, s0: s0 + 0.3, u });
  }
  kit.traffic(154, 8312, 9490, { sp: 18, gap: 260, s0: 0.2 });
  kit.traffic(158, 9490, 8312, { sp: 17, gap: 300, s0: 0.6 });
  for (let u = 8330; u < 9480; u += 26) lampAt(u % 52 < 26 ? 150.4 : 161.6, u, WARM);

  // ---- Kappabashi: the kitchen street
  {
    const p = plot('kappabashi_mise');
    // the shop on the corner: cups and saucers as big as cars along the edge of its roof
    building(p.x, p.u, p.w, p.h, {
      face: 9, style: 'plain', wall: 0xe4dccc, roof: 0x8a8880, shop: true, sign: 0x2a6ad0, s: 1701, lit: 0.7,
      top: ({ X, Y, w, h, ac, hut }) => {
        for (let k = 0; k < 4; k++) {
          const [cx, cy] = [X + 9 + k * 15, Y + h - 9];
          drop(cx - 7, cy + 5, 14, 3);
          discE(cx, cy + 2, 8, (i, j, d) => (d > 0.82 ? 0x2a5aa8 : 0xf4f4f0), 5); // the saucer
          discE(cx, cy - 1, 5, (i, j, d) => (d > 0.8 ? 0xf8f8f4 : d > 0.62 ? 0xd8d8d0 : k % 2 ? 0x6a3a20 : 0x2e6a3a), 4);
          ER(cx + 5, cy - 2, 3, 1, 0xf8f8f4); // its handle
          ER(cx + 7, cy - 1, 1, 2, 0xf8f8f4);
          ER(cx + 5, cy + 1, 3, 1, 0xd8d8d0);
        }
        hut(X + 6, Y + 6, 10, 5, 0x8a8880);
        for (let k = 0; k < 5; k++) ac(X + 24 + k * 7, Y + 8);
      },
    });
    halo(FX(p.x + p.w / 2), FY(p.u + p.h - 6), 40, 18, 0xfff0d0, 0.2);
  }
  // what the shops put on their roofs: a pot, a knife, a fork and a spoon, a bowl of noodles lifted on chopsticks
  const giant = [
    ({ X, Y, w, h }) => {
      const [cx, cy] = [X + (w >> 1), Y + (h >> 1)];
      drop(cx - 8, cy + 7, 16, 3);
      discE(cx, cy, 8, (i, j, d) => (d > 0.85 ? 0x5a5e66 : d > 0.7 ? 0xe4e8ec : i + j < -2 ? 0xc8ccd2 : 0x9aa0a8), 7);
      ER(cx - 12, cy - 1, 4, 2, 0x3a3a40);
      ER(cx + 9, cy - 1, 4, 2, 0x3a3a40);
    },
    ({ X, Y, w, h }) => {
      const [cx, cy] = [X + (w >> 1), Y + (h >> 1)];
      for (let k = 0; k < 16; k++) ER(cx - 8 + k, cy - 2 + (k > 12 ? k - 12 : 0), 1, 4 - (k > 12 ? k - 12 : 0), k % 5 === 4 ? 0xc8ccd2 : 0xeef2f6); // the blade
      ER(cx - 15, cy - 1, 7, 3, 0x4a3a2a);
      E(cx - 13, cy, GOLD);
      E(cx - 10, cy, GOLD);
      drop(cx - 15, cy + 2, 23, 2);
    },
    ({ X, Y, w, h }) => {
      const [cx, cy] = [X + (w >> 1), Y + (h >> 1)];
      for (let k = -8; k <= 8; k++) {
        E(cx + k, cy + Math.round(k * 0.5), 0xe4e8ec);
        E(cx + k, cy - Math.round(k * 0.5), 0xd0d4da);
      }
      discE(cx + 9, cy + 5, 3, () => 0xeef2f6, 2); // the spoon's bowl
      for (const q of [-1, 0, 1]) ER(cx + 8, cy - 5 + q * 2, 4, 1, 0xe4e8ec); // the fork's tines
    },
    ({ X, Y, w, h }) => {
      const [cx, cy] = [X + (w >> 1), Y + (h >> 1) + 2];
      drop(cx - 8, cy + 6, 16, 3);
      discE(cx, cy, 9, (i, j, d) => (d > 0.86 ? 0xb82a20 : d > 0.72 ? 0xf4f0e8 : (i * 3 + j * 5) % 7 < 2 ? 0xf0d890 : 0xd8a850), 6);
      ER(cx - 4, cy - 1, 3, 2, 0xf8f8f0); // an egg, a slice of pork, greens
      E(cx - 3, cy - 1, 0xf0b020);
      ER(cx + 2, cy, 3, 2, 0xd88070);
      ER(cx, cy + 2, 2, 1, 0x3a8a40);
      for (let k = 0; k < 9; k++) {
        E(cx + 1 + (k % 2), cy - 2 - k, 0xf0d890); // noodles in the air
        E(cx - 1 + (k >> 1), cy - 13 + (k >> 2), 0x6a4a2a);
        E(cx + 3 + (k >> 1), cy - 14 + (k >> 2), 0x6a4a2a);
      }
    },
  ];
  // the goods out on the pavement, down both sides
  for (let u = 8096, k = 0; u < 8296; u += 5.2, k++) {
    for (const x of [28.6, 39.2]) {
      if (hashPx(k, x, 181) < 0.25) continue;
      const kind = Math.floor(hashPx(k, x, 182) * 4);
      mark(x, u, (X, Y) => {
        if (kind === 0) for (let q = 0; q < 3; q++) disc(X + 1, Y - q * 2, 2, (i, j, d) => (d > 0.8 ? 0x6a6e76 : 0xd0d4da), 1); // pots, stacked
        else if (kind === 1) for (let q = 0; q < 3; q++) kit.lantern(X, Y - q * 4, q % 2 ? 0xf4f0e8 : 0xe0402a); // lanterns for sale
        else if (kind === 2) {
          R(X, Y - 3, 4, 4, 0x8a6a48);
          for (let q = 0; q < 4; q++) P(X + (q % 2) * 2 + 1, Y - 3 + (q >> 1) * 2, q % 2 ? 0x2a5aa8 : 0xf4f4f0); // blue and white bowls in a crate
        } else {
          R(X, Y - 4, 4, 5, 0xf4f0e8);
          for (let q = 0; q < 4; q++) P(X + (q % 2) * 2, Y - 3 + (q >> 1) * 2, [0xe84030, 0xf0c020, 0x70b040, 0xf08060][q]); // food of wax on a stand
        }
      });
    }
    if (k % 4 === 0) {
      lampAt(27.6, u + 2, WARM);
      lampAt(40.4, u + 4.6, WARM);
    }
  }
  crowd(28.4, 8094, 1.6, 204, 34);
  crowd(38.6, 8094, 1.6, 204, 34);
  for (let k = 0; k < 4; k++) car(32.2, 8110 + k * 46, true, undefined, false);
  for (let k = 0; k < 3; k++) car(35.8, 8140 + k * 52, true, undefined, true);

  // ---- a temple behind its wall: the gate, the hall, a bell, pines, the graves at the back
  {
    const [x0, u0, w, h] = [100, 8126, 54, 136];
    claim(x0, u0, w, h);
    pave(x0, u0, w, h, 'gravel', 183);
    ground(() => {
      for (let i = 0; i < w * S; i++)
        for (const u of [u0, u0 + h - 1]) {
          if (u === u0 && Math.abs(i - (w * S) / 2) < 12) continue;
          R(FX(x0) + i, FY(u) - 3, 1, 3, i % 4 ? 0xe8e0d0 : 0xc8c0b0);
          P(FX(x0) + i, FY(u) - 4, 0x4a5058);
        }
      for (let j = 0; j < h * S; j++) for (const x of [x0, x0 + w - 0.67]) R(FX(x), FY(u0 + h) + j, 2, 1, j % 4 ? 0xe8e0d0 : 0x4a5058);
      for (let j = 0; j < 150; j++) R(FX(x0 + w / 2) - 7, FY(u0 + 4) - j, 14, 1, j % 6 ? 0xb9b1a0 : 0x9a9488); // the way of stone to the hall
    });
    temple(x0 + w / 2 - 7, u0 - 1, 14, 9, { wall: 0x6a4a38, face: 2.4, bays: 3, open: [1], flood: false });
    temple(x0 + 6, u0 + 58, 42, 40, { wall: 0x6a4a38, face: 6, bays: 5, open: [2], tile: 0x525a66 });
    temple(x0 + 17, u0 + 54, 20, 12, { wall: 0x6a4a38, face: 4, bays: 3, open: [0, 1, 2], tile: 0x525a66 });
    house(x0 + 40, u0 + 30, 9, 9, { tile: TILE, wall: 0x6a4a38, s: 1703 }); // the bell
    mark(x0 + 44.4, u0 + 32, (X, Y) => {
      R(X - 2, Y - 4, 4, 5, 0x4a6a5a);
      R(X - 2, Y - 4, 1, 5, 0x6a8a7a);
    }, u0 + 30);
    for (const dx of [-11, 11]) for (const du of [16, 36]) toro(x0 + w / 2 + dx, u0 + du);
    for (const [dx, du] of [[6, 14], [8, 40], [46, 12], [48, 50], [4, 52]]) tree('pine', x0 + dx, u0 + du, 2.8);
    // the graves: rows of stones, a wooden slat behind each
    for (let u = u0 + 104; u < u0 + h - 4; u += 6)
      for (let x = x0 + 4; x < x0 + w - 4; x += 4.2) {
        if (hashPx(x, u, 184) < 0.1) continue;
        mark(x, u, (X, Y) => {
          hi.tint(X + 3, Y, 0.74);
          R(X - 1, Y - 1, 4, 2, 0x8a8a84);
          R(X, Y - 5, 2, 4, hashPx(X, Y, 185) < 0.5 ? 0xa8a8a0 : 0x94948c);
          P(X, Y - 5, 0xc4c4bc);
          if (hashPx(X, Y, 186) < 0.5) R(X + 3, Y - 8, 1, 8, 0xb89a70);
          if (hashPx(X, Y, 187) < 0.2) P(X - 1, Y, 0xf0d040); // flowers left
        });
      }
    tree('broadleaf', x0 + w - 6, u0 + h - 8, 3.4);
    crowd(x0 + w / 2 - 3, u0 + 8, 6, 44, 6);
  }

  // ---- Kaminarimon: the gate, the great lantern in its middle bay, the two guardians behind their grilles
  {
    const p = plot('kaminarimon');
    pave(p.x, p.u, p.w, p.h, 'paving', 188);
    temple(p.x + 1, p.u + 2, 30, 19, { face: 7, bays: 3, open: [1] });
    for (const dx of [3.2, 21.4])
      mark(p.x + dx, p.u + 2.4, (X, Y) => {
        // a guardian: a dark figure behind a green grille, a drum or a bag over him
        for (let j = 0; j < 14; j++) for (let i = 0; i < 19; i++) E(X + i, Y - 15 + j, (i + j) % 3 === 0 ? 0x3a5a48 : Math.hypot(i - 9, (j - 7) * 0.8) < 5 ? 0x5a3a2a : 0x24362c);
        ER(X + 8, Y - 13, 3, 3, 0xc88a50);
      }, p.u + 2);
    chochin(p.x + 12.4, p.u + 8.6, 7.2, 6, 0xd8301c, { ph: 0.1 });
    // rickshaws waiting, their pullers beside them
    for (let k = 0; k < 7; k++) {
      const x = k < 4 ? 50 + k * 5.4 : 110 + (k - 4) * 5.4;
      mark(x, 8313.6, (X, Y) => {
        drop(X - 2, Y + 1, 8);
        R(X - 2, Y - 2, 2, 4, 0x1c1c22); // the wheels
        R(X + 5, Y - 2, 2, 4, 0x1c1c22);
        R(X, Y - 4, 5, 5, 0x2a2228); // the hood
        R(X + 1, Y - 1, 3, 2, 0xd03a30); // a red blanket on the seat
        R(X, Y + 1, 1, 5, 0x6a4a2a); // the shafts
        R(X + 4, Y + 1, 1, 5, 0x6a4a2a);
        R(X + 1, Y + 6, 3, 1, 0x6a4a2a);
        if (k % 2) kit.person(X + 7, Y + 3, 190 + k);
      });
    }
    crowd(p.x - 6, p.u - 5, p.w + 12, 5, 46);
    for (const dx of [-3, p.w + 2]) lampAt(p.x + dx, p.u, WARM);
  }

  // ---- Nakamise: two rows of stalls under copper roofs, a counter of goods before each, lanterns across
  const GOODS = [
    [0xe84030, 0xf4f0e8, 0x2a2228], // masks
    [0xd8a850, 0xb88838, 0xf0d890], // cakes baked in moulds
    [0xf080a0, 0x80c0f0, 0xf8e060], // folding fans
    [0xd03a30, 0xf4f0e8, 0xe8c040], // round red dolls that right themselves
    [0x4870c8, 0xf4f0e8, 0x2a3a6a], // dyed cloth
    [0xe8c890, 0xb89060, 0x8a6a40], // rice crackers
    [0xf4f4f0, 0xd03a30, 0xe8c040], // beckoning cats
    [0x8858b8, 0xe88840, 0x48a868], // paper umbrellas
    [0xf0a0b8, 0xf8f0e0, 0x70b040], // dumplings on sticks, three colours
    [0x2a2228, 0xe8c040, 0xd03a30], // lacquer, chopsticks
    [0xe0402a, 0xffe0a0, 0xf4f0e8], // paper lanterns
    [0x48a868, 0xe8e8e8, 0xd04848], // toys of wood
  ];
  const stall = (x, u, w, h, side, k) => {
    const [X0, Y0, bw, bh] = [FX(x), FY(u + h), Math.round(w * S), Math.round(h * S)];
    const fh = 6;
    const g = GOODS[(k * 5 + (side > 0 ? 3 : 0)) % GOODS.length];
    const awn = PAL.awning[(k * 3 + (side > 0 ? 2 : 5)) % PAL.awning.length];
    queue(FY(u), () => {
      const rh = bh - fh;
      for (let j = 0; j < rh; j++)
        for (let i = 0; i < bw; i++) {
          const front = side < 0 ? bw - 1 - i : i; // (0 at the walk)
          let c = shade(COPPER, (k % 3) * 0.05 + (j < rh / 2 ? 0.82 : 1.06));
          if (i % 4 === 0) c = shade(c, 0.82); // the seams of the copper
          if (j === (rh >> 1)) c = shade(COPPER, 1.3);
          if (front < 5) c = j % 4 < 2 ? awn : front === 4 ? shade(awn, 0.7) : 0xf4f0e8; // the awning over the counter
          if (i === 0 || i === bw - 1 || j === 0) c = shade(COPPER, 0.45);
          P(X0 + i, Y0 + j, c);
        }
      for (let j = 0; j < fh; j++)
        for (let i = 0; i < bw; i++) {
          const c = j === fh - 1 || i === 0 || i === bw - 1 ? PAL.ink : j === 0 ? shade(RED, 0.6) : i % 9 < 2 ? RED : j < 3 ? (i % 3 ? 0x34406a : 0xf4f0e8) : 0xffdc98;
          if (c === 0xffdc98) E(X0 + i, Y0 + rh + j, c);
          else P(X0 + i, Y0 + rh + j, c);
        }
      // its board over the counter, lit
      const sx = side < 0 ? X0 + bw - 8 : X0 + 5;
      const sc = PAL.sign[(k * 7 + (side > 0 ? 1 : 4)) % PAL.sign.length];
      ER(sx, Y0 + 3, 3, rh - 6, sc);
      for (let j = 4; j < rh - 4; j += 2) if (hashPx(k, j, 191) < 0.7) E(sx + 1, Y0 + j, sc === 0xf4f0e8 || sc === 0xf0c020 ? 0x2a2228 : 0xfff8f0);
    }, () => kit.shadowBox(X0, Y0, bw, bh, 2, 0.66));
    // the counter out in the walk
    mark(side < 0 ? x + w + 0.1 : x - 1.1, u + 0.6, (X, Y) => {
      const n = Math.round(h * S) - 5;
      R(X, Y - n, 3, n, 0x8a6a48);
      for (let j = 0; j < n; j++) for (let i = 0; i < 3; i++) if ((i + j * 2 + k) % 3 !== 2) E(X + i, Y - n + j, shade(g[(i + j + (j >> 1)) % 3], 0.85));
      R(X, Y, 3, 1, 0x4a3a2a);
    });
    halo(FX(side < 0 ? x + w + 1 : x - 1), FY(u + h / 2), 10, bh * 0.6, 0xffd090, 0.24);
  };
  for (const [id, side] of [['nakamise_l1', -1], ['nakamise_r1', 1], ['nakamise_l2', -1], ['nakamise_r2', 1]]) {
    const p = plot(id);
    pave(p.x, p.u, p.w, p.h, 'paving', 189);
    const n = Math.round(p.h / 7.4);
    const d = p.h / n;
    for (let k = 0; k < n; k++) stall(p.x, p.u + k * d, p.w, d - 0.34, side, k + (id.endsWith('2') ? 40 : 0));
  }
  for (let u = 8350, k = 0; u < 8886; u += 12, k++) {
    if (Math.abs(u - 8640) < 9) continue;
    string(85.2, u, 9.6, k % 3 === 0 ? [0xf08098, 0xfff0e0] : k % 3 === 1 ? [0xe0402a, 0xffe0a0] : [0xe0402a, 0xf4f0e8, 0xe0402a], (k * 0.37) % 1);
    if (k % 4 === 2)
      mark(85.4, u - 5, (X, Y) => {
        // sprays of paper blossom tied over the way
        for (let q = 0; q < 14; q++) P(X + q * 2 + (q % 3), Y + (q % 2) - (q % 5 === 0 ? 1 : 0), q % 3 ? 0xffc0d8 : 0xf890b8);
      });
  }
  crowd(85.6, 8344, 8.8, 290, 250);
  crowd(85.6, 8646, 8.8, 244, 210);
  // Denbōin-dōri: shops in the old way, a lantern at every door, boards of wood
  for (let x = 4, k = 0; x < 152; x += 6.4, k++) {
    if (Math.abs(x - 90) < 20) continue;
    lanternAt(x, 8643.4, k % 3 ? 0xe0402a : 0xfff0d0);
    lanternAt(x + 3, 8637.4, k % 3 === 1 ? 0xfff0d0 : 0xe0402a);
    if (k % 3 === 0)
      mark(x + 1.6, 8644, (X, Y) => {
        R(X, Y - 7, 3, 7, 0x6a4a2a);
        for (let j = 1; j < 6; j += 2) P(X + 1, Y - 7 + j, 0xf4f0e8);
      });
  }
  crowd(2, 8638.4, 68, 3.2, 60);
  crowd(110, 8638.4, 42, 3.2, 40);

  // ---- Denbōin: the abbot's garden behind its wall - a pond, a tea house, pines, the hall
  {
    const [x0, u0, w, h] = [34, 8690, 34, 190];
    claim(x0, u0, w, h);
    pave(x0, u0, w, h, 'park', 192);
    const pond = (x, u) => Math.hypot((x - 51) / 11, (u - 8752) / 30) < 1 || Math.hypot((x - 46) / 8, (u - 8792) / 16) < 1;
    ground(() => {
      for (let u = u0; u < u0 + h; u += 1 / 3)
        for (let x = x0; x < x0 + w; x += 1 / 3) {
          const [X, Y] = [FX(x), FY(u)];
          if (x - x0 < 0.67 || x0 + w - x < 0.67 || u - u0 < 0.67 || u0 + h - u < 0.67) P(X, Y, (X + Y) % 5 ? 0xe8e0d0 : 0x4a5058); // the wall
          else if (pond(x, u)) P(X, Y, pond(x - 0.7, u + 0.7) && pond(x + 0.7, u - 0.7) ? ((X + Y * 3) % 9 === 0 ? 0x4a8090 : 0x24505c) : 0x8c887e);
        }
      // stepping stones round the water, a bridge of one slab
      for (let k = 0; k < 34; k++) {
        const a = (k / 34) * TAU;
        R(FX(51 + Math.cos(a) * 13.4), FY(8758 + Math.sin(a) * 40), 2, 2, 0xb0aa9c);
      }
      R(FX(44), FY(8776), 16, 3, 0xa8a294);
    });
    temple(x0 + 5, u0 + 150, 24, 24, { wall: 0x6a4a38, face: 3, bays: 4, open: [1, 2], flood: false, tile: 0x525a66 });
    house(x0 + 20, u0 + 96, 10, 9, { tile: 0x7c6050, wall: 0xe4dccc, lantern: true, s: 1704 }); // the tea house
    toro(x0 + 8, u0 + 60);
    toro(x0 + 27, u0 + 30);
    for (let k = 0; k < 60; k++) {
      const [x, u] = [x0 + 2.4 + rand() * (w - 4.8), u0 + 2.4 + rand() * (h - 4.8)];
      if (pond(x, u) || pond(x + 3, u) || pond(x - 3, u) || pond(x, u + 3) || pond(x, u - 3) || (u > u0 + 146 && x > x0 + 2) || (Math.abs(x - x0 - 25) < 8 && Math.abs(u - u0 - 100) < 9)) continue;
      tree(pick(['pine', 'pine', 'broadleaf', 'sakura', 'tiny']), x, u, 2 + rand() * 1.6);
    }
  }

  // ---- Hōzōmon: two storeys, three lanterns in its bays, the straw sandals hung on its outer ones
  {
    const p = plot('hozomon');
    pave(p.x, p.u, p.w, p.h, 'paving', 193);
    temple(p.x + 2, p.u + 2, 44, 20, { face: 8, bays: 5, open: [1, 2, 3] });
    temple(p.x + 6, p.u + 13, 36, 17, { face: 4, bays: 5, over: p.u + 2 });
    chochin(p.x + 20.6, p.u + 9.6, 6.8, 6.4, 0xd8301c, { ph: 0.5 });
    for (const dx of [12.6, 30.4]) chochin(p.x + dx, p.u + 9.4, 4, 5, 0x3a6a5a, { ph: 0.3 + dx * 0.01, glyph: false, band: 0x8a6a20 });
    for (const dx of [4.4, 37.6])
      mark(p.x + dx, p.u + 2.6, (X, Y) => {
        // a sandal of straw, taller than a man
        for (let j = 0; j < 19; j++) for (let i = 0; i < 7; i++) if (!((i === 0 || i === 6) && (j === 0 || j === 18))) E(X + i, Y - 20 + j, (i + j) % 2 ? 0xc8a850 : 0xa88838);
        for (let q = 0; q < 6; q++) {
          E(X + 3 - (q >> 1), Y - 16 + q, 0x6a5020);
          E(X + 3 + (q >> 1), Y - 16 + q, 0x6a5020);
        }
      }, p.u + 2);
    crowd(p.x + 6, p.u - 4, p.w - 12, 5, 30);
  }

  // ---- the pagoda: five roofs, each smaller, the spire of gold rings
  {
    const p = plot('gojunoto');
    pave(p.x, p.u, p.w, p.h, 'gravel', 194);
    ground(() => {
      for (let j = 0; j < 60; j++) for (let i = 0; i < 78; i++) if (Math.min(i, j, 77 - i, 59 - j) < 2) P(FX(p.x + 2) + i, FY(p.u + 22) + j, 0xc8c4bc);
    });
    for (let k = 0; k < 5; k++)
      temple(p.x + 4 + k * 1.4, p.u + 3 + k * 5.6, 22 - k * 2.8, 14 - k * 1.2, { face: 2.4, bays: 3, open: k ? [] : [1], over: k ? p.u + 3 : undefined, rank: 1 + k, ridge: 0.5 });
    const [sx, su] = [p.x + 15, p.u + 3 + 4 * 5.6 + 5];
    queue(FY(p.u + 3) + 9, () => {
      const [X, Y] = [FX(sx), FY(su)];
      for (let q = 0; q < 26; q++) E(X, Y - q, q % 3 === 0 ? 0xfff0a0 : 0xc8a030);
      for (let q = 3; q < 22; q += 3) ER(X - 1, Y - q, 3, 1, 0xe8c040);
      ER(X - 1, Y - 27, 3, 2, 0xfff0a0);
      halo(X, Y - 12, 12, 22, 0xffd060, 0.25);
    });
    for (const [dx, du] of [[3, 2], [27, 2], [3, 40], [27, 40]]) tree('pine', p.x + dx, p.u + du, 2.4);
    halo(FX(p.x + 15), FY(p.u + 20), 54, 66, 0xffb070, 0.16);
  }

  // ---- the court of Sensō-ji (the fight's ground: nothing tall on it)
  {
    // the way of stone slabs from the gate to the hall
    ground(() => {
      for (let u = 8926; u < 9234; u += 1 / 3)
        for (let x = 82; x < 98; x += 1 / 3) {
          const [X, Y] = [FX(x), FY(u)];
          const edge = x - 82 < 0.5 || 98 - x < 0.5;
          P(X, Y, edge ? 0x7e786e : (Y % 18 === 0 || (X + (Math.floor(Y / 18) % 2) * 12) % 24 === 0 ? 0x9a948a : shade(0xbeb6a6, 0.96 + hashPx(X, Y, 195) * 0.07)));
        }
      // a ring of darker stone round the censer
      for (let a = 0; a < TAU; a += 0.004) {
        P(FX(90 + Math.cos(a) * 15), FY(9046 + Math.sin(a) * 15), 0x7e786e);
        P(FX(90 + Math.cos(a) * 15.4), FY(9046 + Math.sin(a) * 15.4), 0x8a847a);
      }
    });
    for (let u = 8944; u < 9226; u += 34) for (const dx of [-10.4, 9.6]) toro(90 + dx, u);

    // the censer under its little roof, the smoke people wave over themselves
    {
      const p = plot('jokoro');
      const [cx, cu] = [p.x + p.w / 2, p.u + 5];
      pave(p.x, p.u, p.w, p.h, 'paving', 196);
      mark(cx, cu, (X, Y) => {
        drop(X - 9, Y + 5, 18, 3);
        for (const i of [-10, 9]) R(X + i, Y - 16, 2, 20, 0x5a3a2a); // the posts
        disc(X, Y, 10, (i, j, d) => (d > 0.84 ? 0x3a4a44 : d > 0.66 ? 0x5a7a6a : (i * 5 + j * 3) % 7 < 2 ? 0xd8d4cc : 0xb8b4ac), 6); // bronze, ash in it
        for (const [i, j] of [[-4, -1], [-1, 1], [2, -2], [5, 0], [0, -1], [-6, 1]]) {
          R(X + i, Y + j - 3, 1, 3, 0x6a8a5a); // sticks of incense, their tips alight
          E(X + i, Y + j - 4, 0xff7030);
        }
        R(X - 8, Y + 6, 3, 3, 0x3a4a44); // its feet
        R(X + 6, Y + 6, 3, 3, 0x3a4a44);
        for (let j = 0; j < 9; j++) for (let i = -13 + (j < 4 ? 4 - j : 0); i < 13 - (j < 4 ? 4 - j : 0); i++) P(X + i, Y - 25 + j, j === 8 ? 0x24323a : j === 3 ? shade(COPPER, 1.3) : shade(COPPER, j < 3 ? 0.8 : 1.05 - (i % 3 === 0 ? 0.14 : 0)));
        halo(X, Y, 22, 16, 0xff9050, 0.2);
      });
      kit.smoke(cx, cu + 2, { rate: 2, a: 0.5, sx: 3, vy: 8, life: [2.4, 3.6] });
      crowd(p.x - 4, p.u - 3, p.w + 8, 3.4, 14);
      crowd(p.x - 4, p.u + 9, 3.4, 5, 3);
      crowd(p.x + p.w + 0.6, p.u + 9, 3.4, 5, 3);
    }
    // the water pavilion: a copper roof on eight posts, the basin, the dragon's spout
    {
      const p = plot('chozuya');
      pave(p.x, p.u, p.w, p.h, 'paving', 197);
      mark(p.x + 7, p.u + 2, (X, Y) => {
        R(X - 12, Y - 9, 24, 8, 0x8a8a84);
        R(X - 12, Y - 9, 24, 2, 0xb0b0a8);
        ER(X - 10, Y - 7, 20, 3, 0x4a90a8);
        for (let i = -9; i < 10; i += 4) E(X + i, Y - 6, 0x8ac8d8);
        R(X - 1, Y - 12, 3, 4, 0x6a8a5a); // the dragon
        P(X, Y - 13, GOLD);
        for (const i of [-17, -6, 5, 16]) R(X + i, Y - 22, 2, 24, 0x5a3a2a);
      });
      temple(p.x + 0.6, p.u + 6, 12.8, 8, { tile: COPPER, wall: 0x5a3a2a, face: 1, bays: 3, open: [0, 1, 2], flood: false, trim: 0x8a6a20 });
      crowd(p.x, p.u - 3, p.w, 3, 8);
    }
    // food stalls down both sides, steam from the griddles
    for (let k = 0; k < 20; k++) {
      const u = 9004 + k * 10.6;
      if (k < 19) yatai(40, u, k);
      if (k > 0) yatai(132, u + 4, k + 7);
    }
    for (const [x, u] of [[44, 9060], [136, 9110], [44, 9170]]) kit.smoke(x, u + 5, { rate: 0.9, a: 0.35 });
    yatai(86, 9176, 3, true);
    kit.smoke(90, 9181, { rate: 1.1, a: 0.4 });
    // fortunes: two stands of small drawers, the racks where the bad ones are tied
    for (const x of [70, 104]) {
      temple(x, 9200, 7, 7, { wall: 0x6a4a38, face: 2, bays: 2, flood: false, panel: 0xc8a878 });
      mark(x + (x < 90 ? 8.4 : -3), 9202, (X, Y) => {
        R(X, Y - 6, 1, 7, 0x6a4a2a);
        R(X + 6, Y - 6, 1, 7, 0x6a4a2a);
        for (let j = 0; j < 3; j++) for (let i = 1; i < 6; i++) P(X + i, Y - 6 + j * 2, i % 2 ? 0xf8f8f0 : 0xe0e0d8);
      });
    }
    // the two Buddhas in bronze on their plinth, the bell on its mound
    mark(120, 8944, (X, Y) => {
      drop(X - 10, Y + 1, 22, 3);
      R(X - 10, Y - 5, 22, 6, 0xa8a49c);
      R(X - 10, Y - 5, 22, 2, 0xc8c4bc);
      for (const i of [-7, 3]) {
        disc(X + i + 2, Y - 9, 4, (a, b) => (a + b < 0 ? 0x7a9a80 : 0x5a7a66), 4);
        disc(X + i + 2, Y - 15, 2, (a, b) => (a + b < 0 ? 0x8aaa8c : 0x5a7a66));
        disc(X + i + 2, Y - 13, 5, (a, b, d) => (d > 0.8 && b < 0 ? 0x4a6a58 : null), 6);
      }
    });
    ground(() => disc(FX(144), FY(8946), 24, (i, j, d) => shade(0x4f7c40, 1.2 - d * 0.3 + hashPx(i, j, 198) * 0.1), 20));
    house(140, 8942, 8, 8, { tile: TILE, wall: 0x6a4a38, s: 1705 });
    for (const [x, u] of [[136, 8940], [151, 8942], [146, 8952]]) tree('broadleaf', x, u, 2.4);
    // small halls along the west side, a six-sided one; the east gate to the street
    temple(22, 9086, 14, 12, { face: 3, bays: 3, open: [1] });
    temple(22, 9140, 13, 13, { face: 3, bays: 3, open: [1], tile: COPPER });
    mark(27, 9118, (X, Y) => {
      drop(X - 8, Y + 1, 16, 3);
      R(X - 6, Y - 6, 12, 7, RED);
      R(X - 6, Y - 6, 12, 1, 0x6a2018);
      R(X - 1, Y - 4, 3, 5, 0x2a1a16);
      for (let j = -8; j <= 8; j++) for (let i = -9; i <= 9; i++) if (Math.max(Math.abs(i), Math.abs(j) * 1.1, (Math.abs(i) + Math.abs(j) * 1.1) / 1.5) <= 9) P(X + i, Y - 14 + j, i === 0 || Math.abs(Math.abs(i) - Math.abs(j) * 1.1) < 1 ? shade(TILE, 1.4) : shade(TILE, i + j < 0 ? 1.1 : 0.8));
      P(X, Y - 14, GOLD);
    });
    temple(150.6, 9186, 9, 13, { face: 4, bays: 1, open: [0] });
    // ginkgos and cherries round the edge, clear of the middle
    for (const [x, u, kind] of [[24, 9000, 'broadleaf'], [24, 9052, 'broadleaf'], [22, 9176, 'sakura'], [24, 9206, 'broadleaf'], [60, 9216, 'broadleaf'], [120, 9216, 'broadleaf'], [156, 9000, 'sakura'], [156, 9120, 'broadleaf'], [154, 9216, 'broadleaf'], [62, 8960, 'sakura'], [114, 8970, 'broadleaf'], [156, 9060, 'broadleaf']])
      tree(kind, x, u, 3 + rand());
    for (const [x, u] of [[62, 8990], [118, 8990], [62, 9110], [118, 9110], [62, 9190], [118, 9190], [44, 8990], [136, 9080]]) lampAt(x, u, WARM);
    // people: thin over the middle, thicker by the stalls and the steps
    crowd(84, 8930, 12, 100, 40);
    crowd(40, 9000, 100, 200, 60);
    crowd(49, 9002, 5, 200, 40);
    crowd(127, 9010, 4.4, 200, 40);
    crowd(70, 9222, 40, 8, 36);
    // pigeons on the stones
    const pigeon = (k) =>
      kit.frame(1.34, 1, 9100, (put) => {
        put(1, 1, 0x8a8e9a);
        put(2, 1, 0x6a6e7a);
        put(2 + k, 0, 0xa8acb8);
        put(0, 1 + k, 0x5a5e6a);
      });
    props.wander(66, 9080, 14, 30, [pigeon(0), pigeon(1)], { n: 7, sp: 1.6, turn: 'flip', fps: 2, idle: 0.7, d: 0.05 });
    props.wander(114, 9130, 14, 30, [pigeon(0), pigeon(1)], { n: 6, sp: 1.6, turn: 'flip', fps: 2, idle: 0.7, d: 0.05 });
  }

  // ---- the great hall: steps, the porch with its lantern, the roof over everything, floodlit
  {
    const p = plot('hondo');
    pave(p.x, p.u, p.w, p.h, 'paving', 199);
    ground(() => {
      for (let j = 0; j < 8; j++) R(FX(64) - j, FY(p.u + 1) - j * 3 - 3, 156 + j * 2, 3, j % 2 ? 0x9a948a : 0xc4bcae);
      // the terrace's rail
      for (let i = 0; i < 80 * S; i++) if (Math.abs(i - 120) > 80) P(FX(50) + i, FY(p.u + 9), i % 4 ? 0xb8382a : 0xe8c040);
    });
    temple(p.x + 3, p.u + 10, 78, 72, { face: 9, bays: 7, open: [2, 3, 4], ridge: 0.36, tile: 0x58606e });
    temple(p.x + 24, p.u + 5, 36, 19, { face: 6, bays: 3, open: [0, 1, 2], tile: 0x58606e });
    chochin(p.x + 38.4, p.u + 10.6, 7.2, 5.4, 0xd8301c, { ph: 0.8 });
    for (const dx of [28.6, 51.4]) chochin(p.x + dx, p.u + 10.4, 4, 4.6, 0x3a6a5a, { ph: dx * 0.02, glyph: false, band: 0x8a6a20 });
    halo(FX(90), FY(p.u + 12), 150, 44, 0xffb070, 0.2);
    halo(FX(90), FY(p.u + 50), 130, 110, 0xffc890, 0.1);
    for (const dx of [-4, p.w + 2]) for (const du of [4, 40, 76]) lampAt(p.x + dx, p.u + du, WARM);
    for (const [dx, du] of [[-3, 20], [p.w + 3, 20], [-3, 60], [p.w + 3, 60]]) tree('broadleaf', p.x + dx, p.u + du, 3);
  }

  // ---- the shrine beside it: a stone torii, the two lions, the hall in red behind its fence
  {
    const p = plot('asakusa_jinja');
    pave(p.x, p.u, p.w, p.h, 'gravel', 200);
    mark(p.x + 6, p.u + 4, (X, Y) => {
      R(X - 9, Y - 16, 2, 16, 0xa8a8a0);
      R(X + 8, Y - 16, 2, 16, 0xa8a8a0);
      R(X - 12, Y - 19, 25, 2, 0xc4c4bc);
      R(X - 11, Y - 20, 23, 1, 0xd8d8d0);
      R(X - 9, Y - 13, 19, 1, 0x9a9a92);
    });
    for (const dx of [2, 9])
      mark(p.x + dx, p.u + 14, (X, Y) => {
        drop(X, Y + 1, 4);
        R(X, Y - 2, 4, 3, 0x8a8a84);
        R(X, Y - 6, 3, 4, 0xb0b0a8);
        P(X + (dx < 5 ? 3 : -1), Y - 6, 0xb0b0a8);
      });
    for (const du of [22, 28]) for (const dx of [1.6, 10]) toro(p.x + dx, p.u + du);
    temple(p.x + 0.6, p.u + 34, 10.8, 12, { face: 3, bays: 3, open: [1] });
    temple(p.x + 2, p.u + 46, 8, 8, { face: 2, bays: 1, over: p.u + 34 });
    for (const [dx, du] of [[1, 52], [11, 50], [0, 8], [12, 30]]) tree('broadleaf', p.x + dx, p.u + du, 2.2);
    crowd(p.x + 3, p.u + 6, 6, 24, 8);
  }

  // ---- Hanayashiki: the old fairground squeezed between the houses
  {
    const p = plot('hanayashiki');
    pave(p.x, p.u, p.w, p.h, 'plaza', 201);
    ground(() => {
      // a floor of tiles in two colours, beds of flowers
      for (let u = p.u + 6; u < p.u + p.h - 6; u += 1 / 3)
        for (let x = p.x + 6; x < p.x + p.w - 6; x += 1 / 3) {
          const [X, Y] = [FX(x), FY(u)];
          if ((Math.floor(X / 6) + Math.floor(Y / 6)) % 2 === 0) P(X, Y, hashPx(X, Y, 203) < 0.5 ? 0xc8a8a0 : 0xc0a098);
        }
      for (const [x, u, w, h] of [[30, 9354, 12, 4], [58, 9384, 8, 5], [10, 9412, 5, 8], [46, 9444, 14, 4]])
        for (let j = 0; j < h * S; j++) for (let i = 0; i < w * S; i++) P(FX(x) + i, FY(u + h) + j, Math.min(i, j, w * S - 1 - i, h * S - 1 - j) === 0 ? 0x8a8a84 : hashPx(i, j, 204) < 0.3 ? [0xf06088, 0xf0c020, 0xf4f0e8][(i + j) % 3] : 0x4a8a48);
      for (let i = 0; i < p.w * S; i++) for (const u of [p.u + 0.34, p.u + p.h]) P(FX(p.x) + i, FY(u), i % 3 ? 0x3a6a8a : 0xf4f0e8);
      for (let j = 0; j < p.h * S; j++) for (const x of [p.x, p.x + p.w - 0.34]) P(FX(x), FY(p.u + p.h) + j, j % 3 ? 0x3a6a8a : 0xf4f0e8);
    });
    // the gate on the street, its sign running with lamps
    mark(60, p.u + 1, (X, Y) => {
      R(X - 2, Y - 18, 3, 18, 0xe84a70);
      R(X + 26, Y - 18, 3, 18, 0xe84a70);
      R(X - 3, Y - 24, 33, 3, 0x2a2630);
    });
    N.sign('chase', 59.4, p.u + 8.4, 10.4, 2.6, 0xf0c020);
    // the carousel: a striped tent turning, horses going round under it
    const turning = (cx, cu, r, draw, fps, n = 6) => {
      const fs = Array.from({ length: n }, (_, k) => kit.frame(2 * r + 2, 2 * r + 4, cu, (put) => draw(put, (r + 1) * S, (r + 1) * S, k / n), true));
      props.loop(cx - r - 1, cu + r + 1, fs, { fps, d: 0.2 });
    };
    {
      const [cx, cu, r] = [24, 9366, 9];
      ground(() => disc(FX(cx), FY(cu - 2), r * S + 3, (i, j, d) => (d > 0.92 ? 0xe8c040 : 0x8a5a48), r * S * 0.6 + 3));
      turning(cx, cu, r, (put, X, Y, t) => {
        const rr = r * S;
        for (let k = 0; k < 10; k++) {
          // the horses, those on the near side of the floor
          const a = (k / 10 + t / 10) * TAU;
          if (Math.sin(a) < 0.15) continue;
          const [hx, hy] = [Math.round(X + Math.cos(a) * rr * 0.86), Math.round(Y + 6 + Math.sin(a) * rr * 0.56)];
          const c = [0xf8f8f4, 0xd8a060, 0x4a3a30, 0xf0c8d8][k % 4];
          for (let i = 0; i < 4; i++) put(hx + i - 2, hy + (k % 2 ? 0 : -1), c);
          put(hx + 2, hy - 1 - (k % 2 ? 0 : 1), c);
          put(hx, hy - 3, 0xe8c040);
          put(hx, hy - 2, 0xe8c040);
        }
        for (let j = -rr; j <= rr; j++)
          for (let i = -rr; i <= rr; i++) {
            const d = Math.hypot(i, j * 1.5) / rr;
            if (d > 1) continue;
            const seg = Math.floor(((Math.atan2(j * 1.5, i) / TAU + t / 8 + 1) % 1) * 16);
            let c = seg % 2 ? 0xf06088 : 0xfff0e0;
            c = shade(c, 1.12 - d * 0.3 - (i + j > 0 ? 0.14 : 0));
            if (d > 0.9) c = (seg + Math.floor(t * 6)) % 3 === 0 ? 0xffffff : 0xe8c040; // lamps running round the rim
            if (d < 0.1) c = 0xe8c040;
            put(X + i, Y - 4 + j, c);
          }
      }, 6);
      halo(FX(cx), FY(cu), 40, 30, 0xffb0c0, 0.26);
      crowd(cx - 12, cu - 10, 24, 3, 12);
    }
    // the tower with little houses flying round it
    {
      const [cx, cu] = [51, 9370];
      mark(cx, cu, (X, Y) => {
        drop(X - 4, Y + 1, 9, 3);
        R(X - 4, Y - 3, 9, 4, 0xa8a49c);
        for (let q = 0; q < 46; q++) R(X - 1, Y - 4 - q, 3, 1, Math.floor(q / 6) % 2 ? 0xf06088 : 0xfff0e0);
        disc(X, Y - 50, 9, (i, j, d) => (d > 0.85 ? 0xe8c040 : (i + 30) % 6 < 3 ? 0x40a8d8 : 0xfff0e0), 5);
        ER(X - 1, Y - 57, 2, 3, 0xff5040);
      });
      const cab = (c) =>
        kit.frame(2.34, 2.34, cu, (put) => {
          for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) if (j > 1 || Math.abs(i - 3) <= j + 1) put(i, j, j < 3 ? shade(c, 0.8) : i === 0 || i === 6 || j === 6 ? shade(c, 0.6) : (i === 2 || i === 4) && j === 4 ? 0xfff0b0 : c);
        }, true);
      props.orbit(cx, cu + 12, 9, [0xe84a70, 0x40a8d8, 0xf0c020, 0x60c080].map(cab), { n: 8, w: 0.5, ry: 4.4, d: 0.2 });
      halo(FX(cx), FY(cu + 10), 36, 30, 0x80d0ff, 0.2);
    }
    // the drop tower: a lattice mast, a ring of seats shot up it and let fall
    {
      const [cx, cu] = [40, 9414];
      mark(cx, cu, (X, Y) => {
        drop(X - 5, Y + 1, 11, 3);
        R(X - 5, Y - 2, 11, 3, 0x8a8e96);
        for (let q = 0; q < 84; q++) {
          P(X - 3, Y - 3 - q, 0xf4f4f0);
          P(X + 3, Y - 3 - q, 0xc8ccd0);
          if (q % 6 < 3) P(X - 2 + (q % 6), Y - 3 - q, 0xe84a40);
          else P(X + 2 - (q % 6) + 3, Y - 3 - q, 0xe84a40);
          if (q % 12 === 0) for (let i = -3; i <= 3; i++) E(X + i, Y - 3 - q, 0xfff0a0);
        }
        ER(X - 1, Y - 90, 3, 3, 0xff5040);
      });
      const ring = kit.frame(5, 2, cu, (put) => {
        for (let i = 0; i < 15; i++) {
          if (Math.abs(i - 7) < 2) continue;
          put(i, 2, 0x3a5aa8);
          put(i, 3, i % 2 ? PAL.cloth[i % 7] : 0x2a2228);
          put(i, 1, i % 2 ? PAL.skin[i % 3] : 0x3a5aa8);
          put(i, 4, 0x2a3a6a);
        }
      }, true);
      props.path([[cx, cu + 3], [cx, cu + 27]], [ring], { sp: 13, n: 1, mode: 'pp', hold: 1.6, turn: 'none', d: 0.25 });
    }
    // tea cups going round on their floor
    {
      const [cx, cu, r] = [22, 9438, 7];
      turning(cx, cu, r, (put, X, Y, t) => {
        const rr = r * S;
        for (let j = -rr; j <= rr; j++)
          for (let i = -rr; i <= rr; i++) {
            const d = Math.hypot(i, j * 1.4) / rr;
            if (d <= 1) put(X + i, Y + j, d > 0.9 ? 0xf4f0e8 : Math.floor(((Math.atan2(j * 1.4, i) / TAU + t / 6 + 1) % 1) * 12) % 2 ? 0x58b8a8 : 0x4aa898);
          }
        for (let k = 0; k < 6; k++) {
          const a = (k / 6 + t / 6) * TAU;
          const [hx, hy] = [Math.round(X + Math.cos(a) * rr * 0.6), Math.round(Y + (Math.sin(a) * rr * 0.6) / 1.4)];
          const c = [0xf06088, 0xf0c020, 0x40a8d8][k % 3];
          for (let j = -2; j <= 2; j++) for (let i = -3; i <= 3; i++) if (Math.hypot(i / 3.2, j / 2.2) <= 1) put(hx + i, hy + j, Math.hypot(i / 3.2, j / 2.2) > 0.7 ? c : i < 0 ? PAL.cloth[(k + 2) % 7] : 0xf4f0e8);
        }
      }, 5);
      halo(FX(cx), FY(cu), 30, 22, 0x80f0d0, 0.2);
    }
    // the haunted house: an old house under a cold light; the stage; tables under parasols; small rides in a row
    house(9, 9400, 16, 13, { tile: 0x34363c, wall: 0x4a4238, s: 1706 });
    halo(FX(17), FY(9402), 30, 18, 0x60c0a0, 0.3);
    mark(12, 9399.6, (X, Y) => ER(X, Y - 3, 2, 3, 0x80ffd0));
    mark(21, 9399.6, (X, Y) => ER(X, Y - 3, 2, 3, 0x80ffd0));
    building(52, 9424, 14, 12, { face: 4, style: 'plain', wall: 0xe84a70, roof: 0xf4d0d8, s: 1707, lit: 1, shop: true });
    mark(54, 9418, (X, Y) => {
      for (let k = 0; k < 4; k++) kit.parasol(X + (k % 2) * 16 + 4, Y - Math.floor(k / 2) * 12, PAL.awning[k + 1]);
    });
    crowd(52, 9414, 14, 8, 14);
    for (let k = 0; k < 6; k++)
      mark(30 + k * 4.2, 9392, (X, Y) => {
        // rides for the small ones: a panda, a car, a swan to sit on
        drop(X, Y + 1, 6);
        R(X, Y - 3, 6, 4, [0xf4f4f0, 0xe84a40, 0xf4f4f0, 0x40a8d8, 0xf0c020, 0xf4f4f0][k]);
        R(X + 1, Y - 5, 3, 2, k % 2 ? 0x2a2228 : 0xf4f4f0);
        if (k % 2 === 0) P(X + 1, Y - 5, 0x1c1c22);
        if (k % 2 === 0) P(X + 3, Y - 5, 0x1c1c22);
      });
    // game booths along the north side, a canal of swans to ride, the ship that swings
    for (let k = 0; k < 4; k++) yatai(13 + k * 9.4, 9450, k + 2);
    {
      const [cx, cu] = [58, 9446];
      ground(() => {
        for (let j = -22; j <= 22; j++) for (let i = -30; i <= 30; i++) {
          const d = Math.hypot(i / 30, j / 22);
          if (d <= 1 && d > 0.5) P(FX(cx) + i, FY(cu) + j, d > 0.93 || d < 0.57 ? 0xd8d4cc : (i + j * 3) % 7 === 0 ? 0x6aa8c8 : 0x2e6a8c);
          else if (d <= 0.5) P(FX(cx) + i, FY(cu) + j, hashPx(i, j, 205) < 0.25 ? 0xf890b8 : 0x4a8a48);
        }
      });
      const swan = kit.frame(2, 1.67, cu, (put) => {
        for (let i = 0; i < 5; i++) for (let j = 2; j < 5; j++) put(i, j, j === 4 ? 0xb8c0cc : 0xf4f4f0);
        put(5, 2, 0xf4f4f0);
        put(5, 1, 0xf4f4f0);
        put(5, 0, 0xf09030);
        put(2, 2, 0xe84a70);
      }, true);
      const ring = Array.from({ length: 25 }, (_, k) => [cx + Math.cos((k / 24) * TAU) * 7.4, cu + Math.sin((k / 24) * TAU) * 5.4]);
      props.path(ring, [swan], { sp: 4, n: 5, gap: 8, mode: 'wrap', turn: 'flip', d: 0.05 });
    }
    {
      // the ship: two frames of the swing would not be enough, so it hangs still between rides, its lamps on
      const [cx, cu] = [58, 9396];
      mark(cx, cu, (X, Y) => {
        drop(X - 12, Y + 1, 24, 3);
        for (const i of [-11, 10]) for (let q = 0; q < 22; q++) P(X + i + (i < 0 ? q >> 1 : -(q >> 1)), Y - q, q % 4 < 2 ? 0xf0c020 : 0x2a2228); // the frame
        for (let j = 0; j < 6; j++) for (let i = -10 + j; i <= 10 - j; i++) P(X + i, Y - 9 + j, j === 0 ? 0xe8c040 : j < 2 ? 0x8a3a2a : 0x6a2a20); // the hull
        for (let i = -8; i <= 8; i += 2) E(X + i, Y - 10, i % 4 ? 0xfff0a0 : PAL.cloth[(i + 8) % 7]);
        R(X - 12, Y - 11, 3, 3, 0xe8c040); // the figurehead
      });
    }
    // bulbs strung over the lot
    for (let k = 0; k < 7; k++) string(8 + (k % 2) * 30, 9352 + k * 15, 30, [0xfff0a0, 0xff80a0, 0x80d0ff, 0xa0f0a0], k * 0.21);
    for (const [x, u] of [[8, 9340], [36, 9340], [70, 9354], [8, 9420], [70, 9420], [36, 9460], [66, 9460], [36, 9404]]) lampAt(x, u, WARM);
    for (const [x, u] of [[10, 9384], [66, 9396], [10, 9456], [62, 9452], [34, 9350]]) tree('tiny', x, u, 1.8);
    crowd(8, 9340, 62, 12, 30);
    crowd(30, 9380, 30, 10, 20);
    crowd(8, 9444, 60, 14, 26);
    // the coaster: a track on trestles round the lot, a train of three cars on it
    const loop = [[8, 9345], [68, 9345], [70.5, 9349], [70.5, 9398], [62, 9410], [70.5, 9424], [70.5, 9458], [67, 9462], [9, 9462], [7, 9458], [7, 9430], [14, 9416], [7, 9400], [7, 9349], [8, 9345]];
    queue(FY(p.u) + 3, () => {
      for (let s = 0; s + 1 < loop.length; s++) {
        const [a, b] = [loop[s], loop[s + 1]];
        const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * S * 1.5);
        const [nx, ny] = [-(b[1] - a[1]), b[0] - a[0]].map((v) => v / Math.hypot(b[0] - a[0], b[1] - a[1]));
        for (let k = 0; k <= n; k++) {
          const [x, u] = [a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n];
          const [X, Y] = [FX(x), FY(u)];
          for (const q of [-1, 1]) E(Math.round(X + nx * q * 2.4), Math.round(Y - ny * q * 2.4), q < 0 ? 0xe8e8e4 : 0xb0b4ba);
          if (k % 5 === 0) for (let q = -2; q <= 2; q++) E(Math.round(X + nx * q), Math.round(Y - ny * q), 0xe84a70);
          if (k % 20 === 0) {
            hi.tint(X + 3, Y + 3, 0.7);
            hi.tint(X + 4, Y + 4, 0.7);
            E(X, Y, 0xfff0a0);
          }
        }
      }
    });
    const cars = [0xe84a40, 0xf0c020, 0x40a8d8].map((c) =>
      kit.frame(3, 2, 9400, (put) => {
        for (let j = 0; j < 6; j++) for (let i = 0; i < 9; i++) put(i, j, i === 0 || i === 8 || j === 0 || j === 5 ? shade(c, 0.6) : (i === 3 || i === 6) && j > 1 && j < 4 ? PAL.skin[i % 3] : c);
      }, true));
    props.path(loop, cars, { sp: 30, n: 3, gap: 3.3, mode: 'wrap', turn: 'rot', cars: 1, d: 0.3 });
  }

  // ---- the blocks: low houses under tiles, lanterns at the doors; shops along the avenues; theatres in the west
  const kitchen = (x, w) => x + w > 20 && x < 46;
  for (const b of blocks(8084, 9500, 6, 8, true)) {
    const [bx, bu] = b;
    for (const [x, u, w, h] of lots(b, rand, { depth: [11, 17], width: [8, 15], small: true })) {
      if (w < 6 || h < 7) continue;
      const v = rand();
      if (bu < 8300 && kitchen(x, w)) {
        const top = v < 0.5 ? giant[Math.floor(rand() * giant.length)] : undefined;
        building(x, u, w - 1, h, { style: pick(['plain', 'office', 'depato']), face: 5 + Math.floor(rand() * 4), wall: pick([0xe4dccc, 0xd8cfc0, 0xc8b8a4, 0xcfc8bc]), shop: true, sign: true, lit: 0.6, ...(top && w >= 9 && h >= 9 ? { top } : {}) });
      } else if (bx < 34 && bu > 8650 && bu < 8920 && v < 0.55) {
        // the old theatre quarter: halls with banners up their fronts
        building(x, u, w - 1, h, { style: 'depato', trim: pick([0x8a2a2a, 0x2a4a8a, 0x6a2a6a]), wall: pick([0x5a5460, 0xcfc8bc, 0x54504c]), face: Math.min(h - 4, 7 + Math.floor(rand() * 4)), shop: true, sign: true, lit: 0.8 });
        if (w >= 9 && rand() < 0.5) N.sign(pick(['blink', 'stack', 'chase']), x + 1, u + h - 0.4, w - 3, 2.6, pick(PAL.sign), u);
      } else if (v < 0.5) {
        house(x, u, w - 1, h - 1, { hip: rand() < 0.6, lantern: rand() < 0.6 });
      } else if (v < 0.78) building(x, u, w - 1, h, { style: pick(['plain', 'balcony', 'plain', 'office']), face: 4 + Math.floor(rand() * 4), shop: rand() < 0.6, sign: rand() < 0.5 });
      else if (v < 0.9) {
        // an inn or an eating house: tiles, a wall of wood, lanterns in a row along its front
        house(x, u, w - 1, h - 1, { tile: pick([0x525866, 0x7c6050]), wall: 0x8a6a50, hip: false, s: 1710 + Math.floor(v * 1000) });
        for (let i = 1.5; i < w - 2; i += 2.4) lanternAt(x + i, u + 0.4, 0xe0402a);
      } else if (v < 0.925) {
        // a pocket shrine between the houses: a red torii, a fox of stone, a tree
        pave(x, u, w - 1, h - 1, 'gravel', 202);
        mark(x + (w - 1) / 2, u + 1.4, (X, Y) => {
          R(X - 5, Y - 9, 2, 9, 0xd03a30);
          R(X + 4, Y - 9, 2, 9, 0xd03a30);
          R(X - 7, Y - 11, 15, 2, 0xd03a30);
          R(X - 7, Y - 12, 15, 1, 0x2a2228);
        });
        house(x + (w - 1) / 2 - 2.4, u + h - 7, 4.8, 5, { tile: TILE, wall: RED, s: 1708 });
        tree('broadleaf', x + 1.6, u + h - 3, 2);
        toro(x + w - 2.6, u + 3);
      } else {
        pave(x, u, w - 1, h - 1, 'asphalt');
        for (let i = 3; i < w - 3; i += 4) if (rand() < 0.6) car(x + i, u + h - 5, true);
        lampAt(x + 1, u + h - 1);
      }
    }
  }
  for (const [x, u, w, h] of blocks(8084, 9500, 4, 5, true)) {
    if (w >= 6 && h >= 7) house(x, u, w - 0.67, Math.min(h, 12) - 0.67, { hip: false, lantern: true });
    else {
      pave(x, u, w - 0.67, h - 0.67, 'park');
      for (let k = 0; k < 1 + Math.floor((w * h) / 40); k++) tree(pick(['broadleaf', 'tiny', 'sakura']), x + 1.2 + rand() * Math.max(0.5, w - 2.4), u + 1.2 + rand() * Math.max(0.5, h - 2.4), 1.6 + rand());
    }
  }
}
