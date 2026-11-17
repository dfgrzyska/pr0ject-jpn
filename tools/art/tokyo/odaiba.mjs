// Odaiba (u 11450-12060), at night: the made land across the bay.
//   The beach - surf running up the sand, palms, the boardwalk with its lamps, the pontoon where the water bus
//     puts in; the copy of the statue with the torch, looking out to sea; the mall with its terraces of decking,
//     the hotels along the shore;
//   the television house: a frame of corridors in a grid, open in its middle, a ball of titanium held up in it;
//   the mall with a shrine on its roof; the station over the guideway; the fountain plaza; the great mall;
//   across the expressway: the museum built as a liner, the wheel turning under its lamps, the museum of science
//     with the globe of the earth glowing through its roof, the gate-shaped tower; the seaside park; the
//     promenade down the middle under its trees.
// Live: surf, the wheel and its lamps, the globe turning, the fountain, the torch, trains (from bay.mjs), cars and
// trucks, dogs on the beach, gulls.
import { lots } from './blocks.mjs';
import { PAL, shade, blend } from './kit.mjs';
import { makeWafu, WARM } from './wafu.mjs';
import { makeUmi } from './umi.mjs';
import { makeNeon } from './neon.mjs';
import { hashPx } from '../hires.mjs';
import { fbm } from '../../lib/raster.mjs';

const TAU = Math.PI * 2;

export function odaiba(ctx) {
  const { kit, blocks, pave, plot, claim, props, S, L, W } = ctx;
  const { building, tree, crowd, mark, ground, rand, pick, P, R, E, ER, halo, FX, FY, queue, glint, car } = kit;
  kit.setSun(0.1);
  const { lampAt, string } = makeWafu(ctx);
  const U = makeUmi(ctx);
  const N = makeNeon(ctx);
  const hi = ctx.img.hi;
  const FW = W * S;
  const wetAt = (x, u) => x >= 0 && x < W && ctx.wet[Math.max(0, Math.min(L * S - 1, FY(u))) * FW + FX(x)] === 1;
  const drop = (X, Y, w, n = 2) => {
    for (let k = 1; k <= n; k++) for (let i = 0; i < w; i++) hi.tint(X + i + k, Y + k, 0.72);
  };
  const disc = (X, Y, r, col, ry = r) => {
    for (let j = -ry; j <= ry; j++) for (let i = -r; i <= r; i++) if (Math.hypot(i / r, j / ry) <= 1.02) P(X + i, Y + j, col(i, j, Math.hypot(i / r, j / ry)));
  };
  const COOL = 0xe8f0ff;

  // ---- the beach: wet sand at the water's line, surf coming in, palms along the back
  const shore = []; // the fine row of the water's edge in each fine column
  for (let X = 0; X < FW; X++) {
    let Y = FY(11440);
    while (Y > FY(11530) && ctx.wet[Y * FW + X] === 1) Y--;
    shore.push(Y);
  }
  ground(() => {
    for (let X = 0; X < FW; X++) {
      const Y = shore[X];
      for (let j = 0; j < 14; j++) {
        const y = Y - j;
        if (ctx.wet[y * FW + X]) continue;
        const c = j < 2 ? 0xd8dcd8 : j < 8 ? shade(0x9a8a66, 0.9 + hashPx(X, y, 251) * 0.08) : blend(0x9a8a66, 0xd8c89a, (j - 8) / 6);
        P(X, y, c);
      }
    }
    // footprints wandering over the dry sand, a track raked by the cleaners' tractor
    for (let k = 0; k < 40; k++) {
      let [x, u] = [rand() * 180, 11474 + rand() * 40];
      for (let q = 0; q < 14; q++) {
        x += Math.cos(k + q * 0.3) * 0.8;
        u += Math.sin(k * 1.7 + q * 0.2) * 0.5;
        if (!wetAt(x, u) && hashPx(k, q, 252) < 0.8) P(FX(x) + (q % 2), FY(u), 0xa89a74);
      }
    }
    for (let x = 4; x < 176; x += 1 / 3) if (Math.floor(x * 3) % 4 < 2) P(FX(x), FY(11517), 0xb4a47c);
    // ripples the wind leaves in the dry sand; the line of weed and shells the last tide left
    for (let X = 0; X < FW; X++)
      for (let Y = FY(11520); Y < shore[X] - 14; Y++) {
        if (ctx.wet[Y * FW + X]) continue;
        const r = Math.sin(Y * 0.55 + Math.sin(X * 0.07 + Y * 0.02) * 2.4 + Math.sin(X * 0.019) * 3);
        if (r > 0.93 && hashPx(X >> 2, Y, 292) < 0.6) hi.tint(X, Y, 0.95);
        else if (r < -0.96 && hashPx(X >> 2, Y, 293) < 0.5) hi.tint(X, Y, 1.04);
      }
    for (let X = 0; X < FW; X++) {
      const Y = shore[X] - 16 - Math.round(Math.sin(X * 0.04) * 3 + Math.sin(X * 0.13) * 1.4);
      if (hashPx(X, 1, 291) < 0.7) P(X, Y, hashPx(X, 2, 291) < 0.85 ? 0x6a6a48 : 0xf0e8e0);
      if (hashPx(X, 3, 291) < 0.3) P(X, Y + 1, 0x7a7454);
    }
  });
  // the beach's kiosks, the showers, chairs stacked for the night, a fence of rope along the back
  for (const [x, c] of [[16, 0x3a8ac0], [104, 0xe08040], [164, 0x40a070]])
    building(x, 11508, 12, 8, { face: 3, style: 'plain', wall: 0xe8e0d0, roof: c, shop: true, s: 1970 + x, lit: 1, top: ({ X, Y, w, h, R: rect }) => {
      for (let i = 0; i < w; i += 4) rect(X + i, Y, 2, h, 0xf4f0e8);
    } });
  for (const x of [38, 74, 132])
    mark(x, 11506, (X, Y) => {
      R(X, Y - 10, 1, 11, 0xb8bcc4);
      R(X - 2, Y - 11, 5, 2, 0xd8dce0);
      for (let k = 0; k < 4; k++) P(X - 2 + k, Y - 8 + (k % 2), 0x8ac8e8);
    });
  for (const x of [46, 90, 142, 170])
    mark(x, 11510, (X, Y) => {
      drop(X, Y + 1, 9);
      for (let q = 0; q < 5; q++) R(X + q, Y - 2 - q, 8, 2, q % 2 ? 0xf4f4f0 : 0x3a8ac0);
    });
  ground(() => {
    for (let x = 2; x < 178; x += 1 / 3) {
      if (x > 142 && x < 158) continue;
      const Y = FY(11519.6) + (Math.floor(x / 4) % 2 ? 0 : 1);
      P(FX(x), Y, 0xc8b890);
      if (Math.floor(x * 3) % 12 === 0) R(FX(x), Y - 3, 1, 4, 0x8a6a48);
    }
  });
  {
    const top = Math.min(...shore) - 4;
    const fh = Math.max(...shore) + 16 - top;
    const surf = (k) =>
      kit.frame(W, fh / S, 11480, (put) => {
        for (let X = 0; X < FW; X++) {
          const Y = shore[X] - top;
          // a breaker further out, closing in frame by frame; the wash running up the sand and back
          const out = 13 - k * 3 + Math.round(Math.sin(X * 0.05 + k) * 1.5);
          if (out > 1) {
            put(X, Y + out, 0xd8e8f4, 0.8);
            if ((X + k) % 5) put(X, Y + out + 1, 0x8aa4bc, 0.55);
          }
          const run = [0, 1, 3, 2][k] + Math.round(Math.sin(X * 0.11 + k * 0.7));
          for (let j = 0; j <= run; j++) put(X, Y - j + 1, j === run ? 0xe4eef8 : 0x9ab4c8, j === run ? 0.85 : 0.35);
        }
      }, true);
    props.loop(0, L - top / S, [surf(0), surf(1), surf(2), surf(3)], { fps: 1.6, d: 0.05 });
  }
  for (let x = 6; x < 178; x += 9 + Math.floor(hashPx(x, 1, 253) * 6)) {
    const u = 11512 + hashPx(x, 2, 253) * 7;
    if (Math.abs(x - 56) < 6 || Math.abs(x - 120) < 4 || (x > 143 && x < 157)) continue;
    U.palm(x, u);
  }
  // a lifeguards' tower, a net for ball games, couples on the sand, dogs walked along the water
  mark(80, 11496, (X, Y) => {
    drop(X - 4, Y + 1, 8);
    for (const i of [-4, 3]) R(X + i, Y - 14, 1, 15, 0xd8d4cc);
    R(X - 5, Y - 18, 10, 5, 0xf4f4f0);
    R(X - 5, Y - 19, 10, 1, 0xd03a30);
    R(X - 3, Y - 17, 6, 2, 0x2a3a4c);
  });
  mark(30, 11500, (X, Y) => {
    R(X, Y - 8, 1, 9, 0x8a8e96);
    R(X + 24, Y - 8, 1, 9, 0x8a8e96);
    for (let i = 1; i < 24; i++) P(X + i, Y - 7 + (i % 2), i % 2 ? 0xd8dce0 : 0x8a8e96);
  });
  for (const [x, u] of [[44, 11492], [96, 11484], [140, 11490], [12, 11496], [166, 11500], [108, 11500], [66, 11504]]) crowd(x, u, 3, 1.6, 2);
  {
    const dog = (k) =>
      kit.frame(1.67, 1, 11480, (put) => {
        for (let i = 0; i < 4; i++) put(i, 1, 0x8a6a48);
        put(4, 0, 0x8a6a48);
        put(0, k ? 0 : 1, 0x6a4a30);
        put(1, 2, 0x6a4a30);
        put(3, 2 - k, 0x6a4a30);
      });
    props.wander(60, 11480, 50, 6, [dog(0), dog(1)], { n: 3, sp: 3, turn: 'flip', fps: 4, idle: 0.4, d: 0.05 });
    props.wander(150, 11486, 20, 6, [dog(0), dog(1)], { n: 1, sp: 3, turn: 'flip', fps: 4, idle: 0.4, d: 0.05 });
  }
  U.gulls(120, 11470, 50, 20, 4);
  // the pontoon where the water bus puts in: a shelter, lamps
  mark(120, 11411, (X, Y) => {
    drop(X - 12, Y + 1, 24, 2);
    R(X - 12, Y - 10, 24, 10, 0xd8dce0);
    R(X - 12, Y - 10, 24, 2, 0xf4f4f0);
    ER(X - 10, Y - 6, 20, 3, 0xfff0c8);
    R(X - 12, Y, 24, 1, 0x3a3e46);
  });
  for (const dx of [-6, 6]) lampAt(120 + dx, 11418, WARM);
  for (let u = 11424; u < 11466; u += 10) lampAt(122.4, u, WARM);
  glint(FX(113), FY(11410) + 3, 20, 0xfff0c8, 0.5);
  glint(FX(127), FY(11410) + 3, 20, 0xfff0c8, 0.5);
  // the boardwalk: lamps, benches, people
  for (let x = 4; x < 178; x += 10) {
    if (x > 143 && x < 157) continue;
    lampAt(x, 11522.6, 0xfff0d8);
    if (Math.floor(x / 10) % 2) mark(x + 4, 11528.4, (X, Y) => {
      R(X, Y - 2, 8, 2, 0x8a6a48);
      R(X, Y - 3, 8, 1, 0x6a4a30);
    });
  }
  crowd(0, 11523.4, 144, 5, 60);
  crowd(156, 11523.4, 24, 5, 10);

  // ---- along the shore: the seaside plaza, the statue, the mall with its terraces, the hotels
  claim(0, 11530, 144, 42);
  claim(156, 11530, 24, 42);
  pave(0, 11530, 28, 42, 'plaza', 254);
  for (const [x, u] of [[4, 11536], [12, 11540], [20, 11536], [6, 11552], [16, 11558], [24, 11548], [8, 11566], [22, 11566]]) U.palm(x, u);
  for (const [x, u] of [[2, 11546], [26, 11546], [14, 11570], [2, 11570]]) lampAt(x, u, WARM);
  crowd(2, 11532, 24, 38, 18);
  {
    const p = plot('liberty');
    pave(p.x - 2, p.u - 2, p.w + 4, p.h + 4, 'paving', 255);
    ground(() => {
      for (let j = 0; j < 4; j++) R(FX(p.x) - j, FY(p.u + 4) + j * 2, p.w * S + j * 2, 1, 0xc8c4bc);
    });
    const [X, Y] = [FX(p.x + p.w / 2), FY(p.u + 6)];
    mark(p.x + p.w / 2, p.u + 6, () => {
      // the pedestal in three steps of granite, the figure in copper gone green, the torch raised in her right hand
      for (let k = 1; k <= 4; k++) for (let j = 0; j < 30; j++) hi.tint(X + 9 + k, Y - j + k, 0.74);
      R(X - 10, Y - 6, 20, 7, 0xb4b0a6);
      R(X - 10, Y - 6, 20, 1, 0xd4d0c6);
      R(X - 7, Y - 18, 14, 12, 0xc4c0b6);
      R(X - 7, Y - 18, 14, 1, 0xe0dcd2);
      R(X + 5, Y - 18, 2, 12, 0x9a968c);
      for (let j = 0; j < 34; j++) {
        const hw = j < 26 ? 4 - Math.floor(j / 14) : 2;
        for (let i = -hw; i <= hw; i++) P(X + i, Y - 19 - j, i < -1 ? 0x8ac0a4 : i > 1 ? 0x4a7a64 : (i + j) % 4 === 0 ? 0x5a8a74 : 0x6aa088); // the robe's folds
      }
      R(X - 2, Y - 56, 4, 4, 0x7ab094); // the head, the crown's rays
      for (const [i, j] of [[-3, -58], [-1, -60], [1, -60], [3, -58], [-4, -56], [4, -56]]) P(X + i, Y + j, 0xa8d8c0);
      for (let q = 0; q < 14; q++) P(X + 3 + (q > 9 ? 1 : 0), Y - 46 - q, q < 6 ? 0x5a8a74 : 0x6aa088); // the arm up
      R(X + 2, Y - 62, 4, 2, 0x6aa088);
      R(X - 6, Y - 40, 3, 6, 0x5a8a74); // the tablet
    });
    const flame = (k) =>
      kit.frame(1.67, 2, p.u, (put) => {
        put(2, 4, 0xffa030);
        put(1, 4, 0xff8020);
        put(3, 4, 0xff8020);
        put(2, 3, 0xffd060);
        put(1 + k, 2, 0xffe890);
        put(2, 1 + k, 0xfff4c0);
        put(2 - k, 1, 0xffd060);
      }, true);
    props.loop((X + 4 - 2) / S, L - (Y - 69) / S, [flame(0), flame(1)], { fps: 5, d: 0.2 });
    halo(X + 4, Y - 64, 18, 18, 0xffb050, 0.4);
    halo(X, Y - 30, 34, 44, 0xc8e0d0, 0.18);
    for (const [dx, du] of [[-3, -1], [p.w + 3, -1], [-3, p.h + 2], [p.w + 3, p.h + 2]]) lampAt(p.x + dx, p.u + du, COOL);
    crowd(p.x - 2, p.u - 3, p.w + 4, 3, 14);
  }
  // the mall with decking terraces stepping down to the boardwalk, tables under umbrellas, bulbs strung over them
  pave(46, 11530, 40, 42, 'plaza', 256);
  building(48, 11540, 36, 30, {
    face: 11, style: 'glass', glass: [0x2a3a58, 0x9cc4dc], roof: 0x8a7c6a, shop: true, sign: 0xf07a20, s: 1951, lit: 0.8,
    tiers: [{ in: [3, 4, 14, 6], face: 4, style: 'glass', roof: 0x9a8a74 }],
  });
  ground(() => {
    for (let j = 0; j < 24; j++) for (let i = 0; i < 108; i++) P(FX(48) + i, FY(11540) + j - 24 + 24, j % 3 === 0 ? 0x7a5a3c : shade(0xa8845c, 0.94 + hashPx(i, j, 257) * 0.1)); // the decking
  });
  for (let k = 0; k < 8; k++) mark(50 + k * 4.4, 11533 + (k % 2) * 2.6, (X, Y) => kit.parasol(X, Y - 3, PAL.awning[k % 8]));
  for (let k = 0; k < 3; k++) string(48, 11538.6 - k * 2.6, 36, [0xfff0a0, 0xffd080, 0xfff4d8], k * 0.3);
  crowd(48, 11531, 36, 8, 24);
  N.sign('chase', 60, 11569.8, 12, 2.6, 0xf0c020, 11540);
  // the hotel on the beach, its front curving, a pool on its terrace; the tall hotel past the guideway
  building(98, 11536, 42, 32, {
    face: 16, style: 'balcony', wall: 0xe0dcd0, roof: 0x8a8e96, shop: true, s: 1952, lit: 0.65,
    tiers: [{ in: [4, 4, 4, 10], face: 3, style: 'balcony', top: ({ X, Y, w, h, R: rect, E: lit, parasol }) => {
      for (let j = 0; j < 14; j++) for (let i = 0; i < 40; i++) lit(X + 8 + i, Y + 6 + j, Math.min(i, j, 39 - i, 13 - j) === 0 ? 0xd8dce0 : (i + j * 3) % 9 === 0 ? 0x9ae8f8 : 0x3ab0d8);
      for (let k = 0; k < 4; k++) parasol(X + 56 + (k % 2) * 10, Y + 8 + Math.floor(k / 2) * 10, 0xf4f0e8);
      rect(X + 4, Y + h - 6, w - 8, 2, 0x8a8e96);
    } }],
  });
  for (const x of [100, 112, 124, 136]) lampAt(x, 11533, WARM);
  crowd(98, 11530.6, 42, 4, 16);
  building(157, 11536, 22, 34, { face: 20, style: 'glass', glass: [0x22324c, 0x7ca4c4], roof: 0x7c8494, shop: true, s: 1953, lit: 0.6, heli: 1 });
  for (const x of [86.4, 93.6]) for (let u = 11532; u < 11572; u += 8) lampAt(x, u, WARM);
  for (let u = 11534; u < 11572; u += 9) for (const x of [84.6, 95.4]) tree('broadleaf', x, u + (x > 90 ? 4.5 : 0), 1.8);

  // ---- the television house
  {
    const p = plot('terebi');
    pave(p.x - 2, p.u - 4, p.w + 4, p.h + 6, 'plaza', 258);
    kit.WALLS.lattice = (o) => (i, j, w, h, s) => {
      const [ci, cj] = [i % 18, j % 15];
      const [col, row] = [Math.floor(i / 18), Math.floor(j / 15)];
      if (ci < 3 || cj < 3) return shade(0xc8ccd4, ci < 3 && cj < 3 ? 1.1 : ci < 3 ? 0.96 : 1.02); // the frame of corridors
      const cols = Math.floor(w / 18);
      if (col >= Math.floor(cols * 0.38) && col <= Math.floor(cols * 0.62) && row < Math.floor(h / 15) - 1 && row > 0) return cj === 3 || ci === 3 ? 0x0c0e16 : 0x181c2a; // open: the night through it
      if (cj % 4 === 1) return 0x7a8494;
      return o.lit && hashPx(col * 7 + (ci >> 2), row * 4 + (cj >> 2), s + 91) < o.lit ? kit.LIT | (hashPx(col, row, s) < 0.5 ? 0xffeec0 : 0xe0f0ff) : PAL.glass[1];
    };
    building(p.x, p.u, p.w, p.h, {
      face: 26, style: 'lattice', roof: 0x9aa0a8, s: 1954, lit: 0.6,
      top: ({ X, Y, w, h, ac }) => {
        // the roof: the grid of corridors over open bays; the ball held in the frame
        for (let j = 0; j < h; j++)
          for (let i = 0; i < w; i++) {
            const [ci, cj] = [i % 18, j % 18];
            const open = i > w * 0.36 && i < w * 0.64 && j > 18 && j < h - 18;
            if (ci < 4 || cj < 4) P(X + i, Y + j, ci < 2 || cj < 2 ? 0xd8dce2 : 0xb4bac2);
            else P(X + i, Y + j, open ? (cj === 4 || ci === 4 ? 0x0a0c12 : 0x141824) : (i * 7 + j * 3) % 23 === 0 ? 0x7a808a : 0x8a9098);
          }
        for (let k = 0; k < 8; k++) ac(X + 8 + (k % 4) * 8, Y + h - 22 + Math.floor(k / 4) * 8);
        const [cx, cy, r] = [X + Math.round(w * 0.66), Y + Math.round(h * 0.34), 36];
        for (let k = 1; k <= 8; k++) for (let i = -r + 6; i <= r - 6; i++) hi.tint(cx + i + k, cy + r - 4 + k, 0.7);
        for (let j = -r; j <= r; j++)
          for (let i = -r; i <= r; i++) {
            const d = Math.hypot(i, j) / r;
            if (d > 1) continue;
            const z = Math.sqrt(1 - d * d);
            const lam = Math.max(0, (-i * 0.5 - j * 0.6 + z * r * 0.7) / r);
            let c = blend(0x5a6470, 0xf4f6f8, Math.min(1, lam * 0.95 + 0.08));
            const [lat, lon] = [Math.asin(j / r), Math.atan2(i, z * r)];
            if (Math.abs(((lat * 8) / Math.PI) % 1) < 0.08 || Math.abs(((lon * 10) / Math.PI) % 1) < 0.07) c = shade(c, 0.82); // the panels' seams
            if (Math.abs(j + r * 0.08) < 2.4 && d < 0.97) {
              E(cx + i, cy + j, Math.abs(i) % 4 === 0 ? 0x8a94a0 : 0xfff0c8); // the deck round its middle, lit
              continue;
            }
            P(cx + i, cy + j, d > 0.97 ? 0x4a525c : c);
          }
        halo(cx, cy, r * 1.8, r * 1.6, 0xd8e8ff, 0.22);
      },
    });
    // the long stair up its front from the plaza
    mark(p.x + 8, p.u + 0.4, (X, Y) => {
      for (let q = 0; q < 40; q++) for (let i = 0; i < 8; i++) P(X + i + q, Y - q * 1.6 - 1, q % 2 ? 0xb4b8be : 0xd8dce0);
      for (let q = 0; q < 40; q += 4) E(X + q, Y - q * 1.6 - 2, 0xfff0c8);
    }, p.u);
    for (const dx of [2, 20, 40, 60, 68]) lampAt(p.x + dx, p.u - 2, COOL);
    crowd(p.x, p.u - 4, p.w, 4, 30);
  }

  // ---- the mall with a shrine on its roof
  {
    const p = plot('aqua');
    building(p.x, p.u, p.w, p.h, {
      face: 10, style: 'glass', glass: [0x283850, 0x88b0d0], roof: 0x8a8880, shop: true, sign: 0x20b0c0, s: 1955, lit: 0.85,
      top: ({ X, Y, w, h, R: rect, ac, lantern, greenery }) => {
        greenery(X + 4, Y + 4, 40, 34, 1956);
        for (let j = 0; j < 22; j++) for (let i = 0; i < 18; i++) P(X + 15 + i, Y + 12 + j, (i + j) % 4 ? 0xbcb29c : 0xa49c88);
        // the torii, the little shrine in red under copper, its lanterns
        rect(X + 16, Y + 34, 2, 6, 0xd03a30);
        rect(X + 30, Y + 34, 2, 6, 0xd03a30);
        rect(X + 14, Y + 32, 20, 2, 0xd03a30);
        rect(X + 14, Y + 31, 20, 1, 0x2a2228);
        for (let j = 0; j < 9; j++) for (let i = 0; i < 12; i++) P(X + 18 + i, Y + 8 + j, j > 5 ? (i === 0 || i === 11 ? 0x2a2228 : 0xc8402e) : shade(0x4a8a70, j < 3 ? 0.8 : 1.1));
        lantern(X + 15, Y + 14, 0xe0402a);
        lantern(X + 31, Y + 14, 0xe0402a);
        for (let k = 0; k < 12; k++) ac(X + 52 + (k % 4) * 8, Y + 10 + Math.floor(k / 4) * 12);
        rect(X + 48, Y + h - 30, w - 54, 22, 0x6a6c72); // the car park on its roof
        for (let i = 0; i < w - 54; i += 7) rect(X + 48 + i, Y + h - 30, 1, 22, 0xd8d4c8);
      },
    });
    for (let k = 0; k < 6; k++) car(p.x + 18 + k * 2.4, p.u + 9, true, undefined, k % 2 === 0);
    N.screen(p.x + 26, p.u + p.h - 2.6, 10, 6, 3, p.u);
    crowd(p.x, p.u - 3, p.w, 3, 22);
  }

  // ---- the stations over the guideway: a roof of glass, stairs down to the street on both sides
  for (const id of ['daiba_eki', 'aomi_eki']) {
    const p = plot(id);
    queue(FY(p.u), () => {
      const [X0, Y0, w, h] = [FX(p.x), FY(p.u + p.h), p.w * S, p.h * S];
      for (let k = 1; k <= 6; k++) for (let j = 0; j < h; j++) hi.tint(X0 + w + k - 1, Y0 + j + k, 0.75);
      for (let j = 0; j < h - 9; j++)
        for (let i = 0; i < w; i++) {
          const t = Math.abs(i - w / 2) / (w / 2);
          const rib = j % 9 === 0 || i === 0 || i === w - 1;
          (rib ? P : E)(X0 + i, Y0 + j, rib ? 0xe8eef2 : blend(0xd0eaf2, 0x6890a8, t));
        }
      for (let j = h - 9; j < h; j++) for (let i = 0; i < w; i++) (j === h - 1 || i === 0 || i === w - 1 ? P : E)(X0 + i, Y0 + j, j === h - 1 ? PAL.ink : i === 0 || i === w - 1 ? 0xb8c0c8 : j < h - 7 ? 0xd8dce0 : i % 4 ? 0xfff0c8 : 0x6a7684);
      for (const [x, s] of [[X0 - 9, 1], [X0 + w, -1]]) for (let q = 0; q < 9; q++) P(x + (s > 0 ? q : 8 - q), Y0 + h - 12 + q, q % 2 ? 0xa8acb2 : 0xc8ccd2); // the stairs
    }, () => kit.shadowBox(FX(p.x), FY(p.u + p.h), p.w * S, p.h * S, 4, 0.7));
    ctx.cover(p.x - 3, p.u, p.w + 6, p.h + 4);
    crowd(p.x - 4, p.u + 2, 3, 6, 4);
    halo(FX(p.x + p.w / 2), FY(p.u), 30, 14, 0xd8f0ff, 0.22);
  }

  // ---- the fountain plaza: jets in a ring and a row, people round them; the tall hotel; the great mall
  claim(0, 11664, 86, 76);
  claim(96, 11662, 46, 78);
  pave(40, 11664, 46, 76, 'plaza', 259);
  ground(() => {
    for (let j = -30; j <= 30; j++)
      for (let i = -42; i <= 42; i++) {
        const d = Math.hypot(i / 42, j / 30);
        if (d > 1) continue;
        P(FX(63) + i, FY(11702) + j, d > 0.92 ? 0xc8c4bc : d > 0.86 ? 0x6a6a64 : (i + j * 3) % 9 === 0 ? 0x6aa8c8 : 0x2e6a8c);
      }
    for (let u = 11668; u < 11738; u += 1 / 3) for (let x = 42; x < 84; x += 1 / 3) if (Math.floor(x) % 6 === 0 && Math.hypot((x - 63) / 15, (u - 11702) / 11) > 1.1) P(FX(x), FY(u), 0x8a867c);
  });
  {
    const jets = (k) =>
      kit.frame(28, 22, 11700, (put) => {
        const [cx, cy] = [42, 40];
        for (let q = 0; q < 12; q++) {
          const a = (q / 12) * TAU;
          const [bx, by] = [Math.round(cx + Math.cos(a) * 30), Math.round(cy + Math.sin(a) * 18)];
          const top = 6 + ((q * 5 + k * 3) % 8);
          for (let j = 0; j < top; j++) put(bx, by - j, 0xf4fcff, 0.85 - j * 0.04);
          put(bx - 1, by - top + 1, 0xd8f0ff, 0.6);
          put(bx + 1, by - top + 1, 0xd8f0ff, 0.6);
        }
        for (let j = 0; j < 30 + (k % 2) * 4; j++) {
          put(cx, cy - j, 0xffffff, 0.9 - j * 0.02);
          if (j % 3 === k % 3) {
            put(cx - 1, cy - j, 0xc8e8f8, 0.6);
            put(cx + 1, cy - j, 0xc8e8f8, 0.6);
          }
        }
      }, true);
    props.loop(63 - 14, 11702 + 22 - 40 / S + 13.3, [jets(0), jets(1), jets(2)], { fps: 7, d: 0.05 });
    halo(FX(63), FY(11702), 70, 40, 0x80d0f0, 0.24);
    for (const [x, u] of [[44, 11668], [82, 11668], [44, 11736], [82, 11736], [63, 11670], [63, 11736]]) lampAt(x, u, COOL);
    crowd(42, 11666, 42, 10, 30);
    crowd(42, 11724, 42, 14, 26);
    crowd(42, 11678, 6, 46, 10);
    crowd(78, 11678, 6, 46, 10);
  }
  building(2, 11668, 34, 66, { face: 24, style: 'glass', glass: [0x283c58, 0xa0c0d8], roof: 0x7c8494, shop: true, s: 1957, lit: 0.6, heli: 1, tiers: [{ in: [4, 6, 4, 18], face: 4, style: 'glass', heli: 1 }] });
  pave(0, 11664, 40, 4, 'plaza', 259);
  building(98, 11666, 42, 70, {
    face: 14, style: 'glass', glass: [0x20304a, 0x7090b8], roof: 0x8a8880, shop: true, sign: 0xd040a0, s: 1958, lit: 0.8,
    top: ({ X, Y, w, h, R: rect, ac, E: lit }) => {
      for (let j = 0; j < h - 12; j++) for (let i = 0; i < 20; i++) ((i % 5 === 0 || j % 8 === 0) ? rect : (x, y, a, b, c) => lit(x, y, c))(X + 50 + i, Y + 6 + j, 1, 1, i % 5 === 0 || j % 8 === 0 ? 0xdfe6ea : 0xb8e0f0); // the atrium's glass
      for (let k = 0; k < 18; k++) ac(X + 6 + (k % 6) * 7, Y + 10 + Math.floor(k / 6) * 40);
    },
  });
  N.screen(104, 11678.4, 14, 8, 6, 11666);
  N.sign('stack', 126, 11679, 3, 10, 0x40b0ff, 11666);
  crowd(96, 11662.6, 46, 3, 20);

  // ---- the streets: lamps, people, cars and trucks keeping left
  for (let x = 4; x < 180; x += 16) {
    if (x > 141 && x < 158) continue;
    lampAt(x, 11587.8, WARM);
    lampAt(x + 8, 11572.4, WARM);
  }
  for (let u = 11592; u < 12100; u += 18) {
    lampAt(162.6, u, WARM);
    lampAt(177.4, u + 9, WARM);
  }
  for (let x = 6; x < 170; x += 18) {
    lampAt(x, 12066, WARM);
    lampAt(x + 9, 12054, WARM);
  }
  const truckF = (c) =>
    kit.frame(4.67, 2.34, 11800, (put) => {
      for (let j = 0; j < 7; j++) for (let i = 0; i < 10; i++) put(i, j, i === 0 || j === 0 || j === 6 ? shade(c, 0.6) : i % 3 === 0 ? shade(c, 0.85) : c); // the box
      for (let j = 1; j < 6; j++) for (let i = 10; i < 14; i++) put(i, j, i === 12 ? 0x2c3a4c : 0xe8e8ec); // the cab
      put(13, 1, 0xf8f0c0);
      put(13, 5, 0xf8f0c0);
    });
  const trucks = [0xc0402a, 0x2a6ab0, 0x2e8a5a, 0xe0a030, 0xd8d8d0].map(truckF);
  const lane = (pts, d, o) => kit.trafficOn(kit.offset(pts, d), o);
  lane([[-12, 11580], [192, 11580]], 3, { sp: 20, gap: 120, u: 11580 });
  lane([[192, 11580], [-12, 11580]], 3, { sp: 19, gap: 140, u: 11580 });
  lane([[170, 11580], [170, 12112]], 2.5, { sp: 18, gap: 150, u: 11800 });
  lane([[170, 12112], [170, 11580]], 2.5, { sp: 17, gap: 170, u: 11800 });
  lane([[-12, 12060], [168, 12060]], 2, { sp: 16, gap: 160, u: 12060 });
  lane([[168, 12060], [-12, 12060]], 2, { sp: 15, gap: 180, u: 12060 });
  // the expressway: cars and the trucks of the port
  for (const [d, sp, s0, rev] of [[1.75, 24, 0.1, false], [5.25, 19, 0.5, false], [1.75, 23, 0.3, true], [5.25, 18, 0.8, true]]) {
    const pts = kit.offset(rev ? [[192, 11750], [-12, 11750]] : [[-12, 11750], [192, 11750]], d);
    if (d > 3) props.path(pts, trucks, { sp, n: 4, gap: 52, mode: 'wrap', turn: 'rot', cars: 1, s0 });
    else kit.trafficOn(pts, { sp, gap: 70, s0, u: 11750 });
  }

  // ---- the promenade down the middle: trees both sides, lamps, benches; under the expressway
  for (let u = 11590; u < 12058; u += 8) {
    if (Math.abs(u - 11750) < 10 || Math.abs(u - 12060) < 6) continue;
    const kept = (x) => (x < 90 ? u > 11786 && u < 11864 && false : false);
    for (const x of [84.4, 95.6]) if (!kept(x)) tree(Math.floor(u / 8) % 3 ? 'broadleaf' : 'sakura', x, u + (x > 90 ? 4 : 0), 1.8);
    if (Math.floor(u / 8) % 2) lampAt(u % 16 < 8 ? 87 : 93, u + 2, COOL);
  }
  crowd(86, 11590, 8, 466, 70);

  // ---- the museum built as a liner: hull, decks stepping up, two funnels; anchors and a screw on its forecourt
  {
    const p = plot('fune_no_kagakukan');
    pave(p.x - 2, p.u - 28, p.w + 6, p.h + 28, 'plaza', 260);
    claim(0, 11760, 86, 30);
    const [x0, x1, cu, hw0, face] = [12, 75, 11828, 12, 8];
    const hwAt = (x) => (x > x1 - 16 ? hw0 * Math.sqrt(Math.max(0, (x1 - x) / 16)) : x < x0 + 3 ? hw0 - (x0 + 3 - x) * 0.8 : hw0);
    queue(FY(cu - hw0) + face * S + 2, () => {
      // the deck
      for (let x = x0; x < x1; x += 1 / 3) {
        const hw = hwAt(x);
        for (let u = cu - hw; u <= cu + hw; u += 1 / 3) {
          const edge = Math.abs(u - cu) > hw - 0.7;
          P(FX(x), FY(u), edge ? 0xf4f4f0 : FY(u) % 3 === 0 ? 0x8a6a48 : 0xb08a5c);
        }
        // the hull's side toward us: white with rows of lit portholes, a dark band, red at the waterline
        const Ys = FY(cu - hw) + 1;
        for (let j = 0; j < face * S; j++) {
          const X = FX(x);
          const t = j / (face * S);
          let c = t < 0.08 ? 0xd8dce0 : t < 0.6 ? 0xf0f0ec : t < 0.86 ? 0x1c2a44 : 0xb83028;
          if (t > 0.15 && t < 0.55 && j % 6 === 2 && X % 4 === 0 && hw > 3) {
            E(X, Ys + j, 0xfff0c0);
            continue;
          }
          P(X, Ys + j, c);
        }
      }
      // the decks: each a box with its own wall of windows, smaller and further aft as they go up
      const box = (xa, xb, ua, ub, f, roof) => {
        const [XA, XB, YT, YB] = [FX(xa), FX(xb), FY(ub), FY(ua)];
        for (let k = 1; k <= 3; k++) for (let X = XA; X < XB; X++) hi.tint(X + k, YB + k, 0.8);
        for (let Y = YT; Y < YB - f; Y++) for (let X = XA; X < XB; X++) P(X, Y, Y === YT || X === XA ? 0xffffff : X === XB - 1 ? 0xb8bcc4 : roof);
        for (let j = 0; j < f; j++) for (let X = XA; X < XB; X++) (j % 4 === 1 && X % 3 ? E : P)(X, YB - f + j, j === f - 1 ? PAL.ink : j % 4 === 1 && X % 3 ? 0xfff0c8 : 0xe8ecf0);
      };
      box(18, 62, cu - 9, cu + 9, 9, 0xdcdfe4);
      box(22, 54, cu - 7, cu + 7, 8, 0xe4e6ea);
      box(30, 46, cu - 5, cu + 5, 7, 0xeceef0);
      // the funnels: red with black tops, leaning aft
      for (const fx of [34, 42]) {
        const [X, Y] = [FX(fx), FY(cu + 1)];
        for (let k = 1; k <= 3; k++) for (let i = -5; i < 6; i++) hi.tint(X + i + k, Y + 8 + k, 0.8);
        for (let j = 0; j < 22; j++) for (let i = -5; i <= 5; i++) P(X + i - (j >> 3), Y + 8 - j, j > 17 ? 0x1c1c22 : i < -3 ? 0xe05040 : i > 3 ? 0x8a2a20 : 0xc03a30);
      }
      for (const [mx, h] of [[24, 30], [58, 26]]) {
        for (let q = 0; q < h; q++) P(FX(mx), FY(cu) - 20 - q, 0xd8dce0);
        ER(FX(mx), FY(cu) - 20 - h, 1, 2, 0xffffff);
      }
      for (let k = 0; k < 5; k++) for (let i = 0; i < 7; i++) for (let q = 0; q < 2; q++) P(FX(22 + k * 7) + i, FY(cu - 9) + 3 + q, 0xf08030); // the boats
    });
    halo(FX(44), FY(11818), 110, 40, 0xd8e8ff, 0.16);
    // the forecourt: an anchor, a ship's screw, a lighthouse lamp from an old station
    mark(20, 11798, (X, Y) => {
      drop(X - 6, Y + 1, 12);
      R(X - 1, Y - 14, 3, 14, 0x3a3e46);
      R(X - 6, Y - 3, 13, 3, 0x3a3e46);
      R(X - 7, Y - 6, 2, 4, 0x3a3e46);
      R(X + 6, Y - 6, 2, 4, 0x3a3e46);
      R(X - 3, Y - 15, 7, 2, 0x3a3e46);
    });
    mark(34, 11796, (X, Y) => {
      drop(X - 7, Y + 1, 14);
      disc(X, Y - 6, 2, () => 0xc89a40);
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * TAU + 0.4;
        for (let r = 2; r < 8; r++) for (let q = -1; q <= 1; q++) P(X + Math.round(Math.cos(a) * r + q * Math.sin(a)), Y - 6 + Math.round(Math.sin(a) * r * 0.8), r < 7 ? 0xd8a848 : 0xa87828);
      }
    });
    mark(64, 11800, (X, Y) => {
      drop(X - 4, Y + 1, 9);
      R(X - 3, Y - 16, 7, 16, 0xf4f4f0);
      R(X - 3, Y - 10, 7, 3, 0xd03a30);
      ER(X - 2, Y - 21, 5, 5, 0xfff0a0);
      R(X - 4, Y - 23, 9, 2, 0x2a2a30);
    });
    for (const [x, u] of [[4, 11764], [28, 11764], [52, 11764], [76, 11764], [4, 11786], [80, 11800], [80, 11850], [4, 11850]]) lampAt(x, u, COOL);
    for (const [x, u] of [[6, 11776], [44, 11776], [74, 11778], [6, 11840], [78, 11830]]) tree('broadleaf', x, u, 2.6);
    crowd(8, 11766, 72, 22, 30);
  }

  // ---- the wheel: a hundred metres of white steel, its lamps changing their pictures, the cabins going round
  {
    const [wx, wb, R0] = [120, 11768, 22];
    const hub = wb + R0 + 4;
    claim(96, 11760, 46, 98);
    pave(96, 11760, 46, 38, 'plaza', 261);
    const [HX, HY] = [FX(wx), FY(hub)];
    const rr = R0 * S;
    const rimLamps = [];
    for (let k = 0; k < 96; k++) {
      const a = (k / 96) * TAU;
      rimLamps.push([Math.round(HX + Math.cos(a) * rr), Math.round(HY + Math.sin(a) * rr), a]);
    }
    queue(FY(wb), () => {
      // the legs: an A of two tubes either side, down to their feet
      for (const s of [-1, 1])
        for (let q = 0; q <= 100; q++) {
          const t = q / 100;
          const [X, Y] = [Math.round(HX + s * 30 * t), Math.round(HY + (FY(wb) - HY) * t)];
          for (let i = -1; i <= 1; i++) P(X + i, Y, i < 0 ? 0xffffff : i > 0 ? 0xa8b0bc : 0xdce2ea);
        }
      // spokes, the rim in two rings, the hub
      for (let k = 0; k < 32; k++) {
        const a = (k / 32) * TAU;
        for (let r = 6; r < rr; r++) P(Math.round(HX + Math.cos(a) * r), Math.round(HY + Math.sin(a) * r), 0x8a96a8);
      }
      for (let a = 0; a < TAU; a += 0.003)
        for (const r of [rr, rr - 3]) P(Math.round(HX + Math.cos(a) * r), Math.round(HY + Math.sin(a) * r), r === rr ? 0xe8eef4 : 0xb8c4d0);
      for (const [X, Y] of rimLamps) E(X, Y, 0xf4f8ff);
      disc(HX, HY, 6, (i, j, d) => (d > 0.7 ? 0xb8c0cc : i + j < 0 ? 0xffffff : 0xd8dee6));
      for (const s of [-1, 1]) {
        R(HX + s * 30 - 4, FY(wb) - 2, 8, 4, 0xb8b8b0);
        R(HX + s * 30 - 4, FY(wb) - 2, 8, 1, 0xdcdcd4);
      }
    });
    const pictures = (k) =>
      kit.frame(2 * R0 + 2, 2 * R0 + 2, hub, (put) => {
        const o = (R0 + 1) * S;
        for (const [X, Y, a] of rimLamps) {
          const t = ((a / TAU) % 1 + 1) % 1;
          const c = k === 0 ? [0xff4060, 0xff9030, 0xffe040, 0x40e080, 0x40a0ff, 0xa060ff][Math.floor(t * 6)]
            : k === 1 ? (Math.floor(t * 24) % 2 ? 0x60c0ff : 0xffffff)
            : k === 2 ? (Math.floor(t * 8) % 2 ? 0xff60b0 : 0xffe080)
            : blend(0xff6040, 0xffe080, Math.abs(Math.sin(t * Math.PI * 3)));
          put(X - HX + o, Y - HY + o, c);
          put(X - HX + o + 1, Y - HY + o, c, 0.5);
        }
        // the picture on the spokes: a flower of light
        if (k === 2) for (let q = 0; q < 8; q++) for (let r = 10; r < rr - 6; r += 3) put(Math.round(o + Math.cos((q / 8) * TAU) * r), Math.round(o + Math.sin((q / 8) * TAU) * r), 0xffa0d0, 0.8);
      }, true);
    props.loop(wx - R0 - 1, hub + R0 + 1, [pictures(0), pictures(1), pictures(2), pictures(3)], { fps: 0.4, d: 0.12 });
    const cabin = kit.frame(1.67, 2, hub, (put) => {
      for (let j = 0; j < 6; j++) for (let i = 0; i < 5; i++) if (!((i === 0 || i === 4) && (j === 0 || j === 5))) put(i, j, j === 0 ? 0xc8ccd4 : i === 0 || i === 4 || j === 5 ? 0xd8dce2 : 0xffffff);
    }, true);
    props.orbit(wx, hub - 1, R0 + 0.6, [cabin], { n: 32, w: 0.06, tc: [0xffffff, 0xffd0e0, 0xd0e8ff, 0xfff0b0, 0xc8ffd8], tw: 0.3, d: 0.13 });
    halo(HX, HY, rr * 1.3, rr * 1.3, 0xc0d8ff, 0.14);
    // the hall for tickets at its foot, the queue, lamps
    building(110, 11762, 20, 7, { face: 3, style: 'glass', glass: [0x2a3a58, 0x9cc4dc], roof: 0xd8dce0, shop: true, s: 1959, lit: 1 });
    crowd(104, 11760.6, 34, 2, 18);
    for (const x of [98, 140]) lampAt(x, 11762, COOL);
    // the mall behind it, built as an old town under a painted sky: a long roof of glass and lead
    building(97, 11800, 46, 54, {
      face: 10, style: 'plain', wall: 0xd8c8a8, roof: 0x7a7e86, shop: true, s: 1960, lit: 0.7,
      top: ({ X, Y, w, h, R: rect, E: lit, ac }) => {
        for (let j = 4; j < h - 4; j++) for (let i = 30; i < 54; i++) (j % 7 === 0 || i % 8 === 6 ? rect : (x, y, a, b, c) => lit(x, y, c))(X + i, Y + j, 1, 1, j % 7 === 0 || i % 8 === 6 ? 0xdfe6ea : blend(0x8ab0d8, 0xffd8a0, (j % 21) / 21));
        for (let k = 0; k < 12; k++) ac(X + 6 + (k % 3) * 7, Y + 8 + Math.floor(k / 3) * 30);
        for (let k = 0; k < 12; k++) ac(X + 90 + (k % 3) * 7, Y + 8 + Math.floor(k / 3) * 30);
      },
    });
  }

  // ---- the museum of science: a long wedge of glass, the globe of the earth glowing in its hall
  {
    const p = plot('miraikan');
    pave(p.x - 2, p.u - 2, p.w + 4, p.h + 4, 'plaza', 262);
    building(p.x + 1, p.u + 8, p.w - 2, p.h - 14, {
      face: 12, style: 'glass', glass: [0x1c2c48, 0x88a8cc], roof: 0x9aa0a8, shop: false, s: 1961, lit: 0.5,
      tiers: [{ in: [4, 6, 24, 30], face: 6, style: 'glass' }],
      top: undefined,
    });
    const [gx, gu, gr] = [p.x + 32, p.u + 26, 8];
    mark(gx, gu, (X, Y) => {
      // the opening in the roof over the hall, ringed in light
      disc(X, Y, gr * S + 6, (i, j, d) => (d > 0.9 ? 0xe8eef4 : 0x101420));
    }, p.u + 8);
    const globe = (k) =>
      kit.frame(2 * gr, 2 * gr, gu, (put) => {
        const r = gr * S;
        for (let j = -r; j < r; j++)
          for (let i = -r; i < r; i++) {
            const d = Math.hypot(i + 0.5, j + 0.5) / r;
            if (d > 1) continue;
            const z = Math.sqrt(1 - d * d);
            const lat = Math.asin((j + 0.5) / r);
            const lon = Math.atan2((i + 0.5) / r, z) + (k / 12) * TAU;
            const land = fbm((((lon / TAU) % 1) + 1) * 24, (lat + 2) * 8, { seed: 271, scale: 5, octaves: 3, periodX: 24 }) > 0.56;
            const ice = Math.abs(lat) > 1.25;
            const lit = 0.55 + 0.45 * z;
            let c = ice ? 0xf0f4f8 : land ? (Math.abs(lat) < 0.4 ? 0x8aa848 : 0x5a9850) : 0x2a6ad0;
            if (!land && !ice && hashPx(Math.floor(lon * 20), Math.floor(lat * 20), 272) < 0.08) c = 0xf0f4ff; // clouds
            put(i + r, j + r, shade(c, lit));
          }
      }, true);
    props.loop(gx - gr, gu + gr, Array.from({ length: 12 }, (_, k) => globe(k)), { fps: 2, d: 0.12 });
    halo(FX(gx), FY(gu), 60, 50, 0x60a0ff, 0.3);
    for (const [dx, du] of [[0, 2], [p.w, 2], [0, p.h - 2], [p.w, p.h - 2], [p.w / 2, 2]]) lampAt(p.x + dx, p.u + du, COOL);
    crowd(p.x, p.u - 1, p.w, 7, 20);
  }

  // ---- the gate-shaped tower: two towers joined at the top by a hall with a view
  {
    const p = plot('telecom');
    pave(p.x - 2, p.u - 2, p.w + 4, p.h + 4, 'plaza', 263);
    const [u0, h, face] = [p.u + 4, p.h - 8, 30];
    for (const x of [p.x, p.x + p.w - 12]) building(x, u0, 12, h, { face, style: 'granite', wall: 0xa8aeb8, roof: 0x8a9098, s: 1962 + x, lit: 0.55 });
    queue(FY(u0) - 1, () => {
      const [XA, XB, YT, YB] = [FX(p.x + 12), FX(p.x + p.w - 12), FY(u0 + h), FY(u0)];
      const fh = face * S;
      for (let Y = YT; Y < YB - fh; Y++) for (let X = XA; X < XB; X++) P(X, Y, Y === YT ? 0xb0b6c0 : 0x8a9098);
      for (let j = 0; j < fh; j++)
        for (let X = XA; X < XB; X++) {
          const Y = YB - fh + j;
          if (j < 24) (j % 6 > 1 ? E : P)(X, Y, j % 6 > 1 ? (X % 5 ? 0xd8ecff : 0x8a9aac) : 0xa8aeb8); // the hall with the view, lit
          else if (j < 28) P(X, Y, 0x6a7078);
          else P(X, Y, j > fh - 14 ? (X % 6 ? 0xffe8b0 : 0x5a6068) : shade(0x1a1e2a, 1 + (j / fh) * 0.4)); // the gate: through it, a lobby lit at its foot
        }
      for (let X = XA; X < XB; X++) for (let j = fh - 14; j < fh; j++) if (X % 6) kit.E(X, YB - fh + j, 0xffe8b0);
    });
    halo(FX(p.x + p.w / 2), FY(u0) - face * S + 12, 50, 18, 0xc8e0ff, 0.22);
    for (const dx of [0, 12, 24, 36]) lampAt(p.x + dx, p.u, COOL);
    crowd(p.x + 12, p.u, 12, 6, 10);
  }

  // ---- the seaside park: lawns, paths among pines, the barbecue ground, a hill to sit on
  {
    const g = [8, 11880, 72, 170];
    const paths = [[[8, 11960], [30, 11950], [50, 11972], [80, 11966]], [[44, 11880], [40, 11930], [50, 11972], [46, 12020], [52, 12050]], [[8, 12030], [30, 12010], [46, 12020]]];
    for (const pts of paths) ctx.along(pts, 1.6, (n, x, u, X, Y) => (x < g[0] || x > g[0] + g[2] || u < g[1] || u > g[1] + g[3] ? null : n.d > 1.2 ? 0x8a8478 : shade(0xc6bca6, 0.94 + hashPx(X, Y, 264) * 0.1)));
    const free = (x, u, pad) => x > g[0] + pad && x < g[0] + g[2] - pad && u > g[1] + pad && u < g[1] + g[3] - pad && !paths.some((pts) => ctx.near(pts, x, u).d < 1.6 + pad) && Math.hypot((x - 26) / 12, (u - 11910) / 14) > 1 && !(x > 56 && u > 11990 && u < 12030);
    ground(() => {
      for (let u = 11896; u < 11926; u += 1 / 3) for (let x = 14; x < 38; x += 1 / 3) {
        const d = Math.hypot((x - 26) / 12, (u - 11910) / 14);
        if (d < 1) P(FX(x), FY(u), shade(0x5a8a48, 1.2 - d * 0.35 - ((x - 26) + (11910 - u)) * -0.008));
      }
      for (let u = 11994; u < 12026; u += 1 / 3) for (let x = 58; x < 78; x += 1 / 3) P(FX(x), FY(u), (FX(x) + FY(u)) % 7 ? 0xa8a294 : 0x8a8478);
    });
    for (let k = 0; k < 8; k++)
      mark(60 + (k % 4) * 4.6, 11998 + Math.floor(k / 4) * 14, (X, Y) => {
        R(X, Y - 3, 9, 3, 0x8a6a48);
        R(X + 3, Y - 6, 3, 3, 0x3a3a40);
        ER(X + 4, Y - 6, 1, 1, 0xff7030);
        kit.person(X - 2, Y - 4, k);
        kit.person(X + 10, Y - 4, k + 9);
      });
    kit.smoke(66, 12006, { rate: 0.7, a: 0.3 });
    crowd(18, 11902, 16, 14, 16);
    for (let k = 0; k < 260; k++) {
      const [x, u] = [g[0] + rand() * g[2], g[1] + rand() * g[3]];
      if (free(x, u, 2.2) && rand() < 0.55) tree(pick(['pine', 'pine', 'broadleaf', 'sakura', 'broadleaf']), x, u, 2.2 + rand() * 1.8);
    }
    for (const pts of paths) for (let k = 1; k < pts.length; k++) lampAt((pts[k][0] + pts[k - 1][0]) / 2 + 2, (pts[k][1] + pts[k - 1][1]) / 2, WARM);
    crowd(10, 11882, 66, 166, 30);
  }

  // ---- the blocks left: offices and hotels of glass, plazas between them, car parks
  for (const b of blocks(11450, 12100, 8, 10, true)) {
    for (const [x, u, w, h] of lots(b, rand, { depth: [18, 30], width: [14, 26], small: true })) {
      if (w < 6 || h < 7) continue;
      const v = rand();
      if (w >= 12 && h >= 16 && v < 0.55) building(x, u, w - 1.4, h - 1.4, { style: pick(['glass', 'glass', 'office', 'granite']), glass: pick([[0x22324c, 0x7ca4c4], [0x2a3a58, 0x9cc4dc], [0x1c2c48, 0x88a8cc]]), face: Math.min(h - 6, 10 + Math.floor(rand() * 14)), shop: rand() < 0.5, heli: 0.6 });
      else if (v < 0.75) {
        pave(x, u, w - 1, h - 1, 'plaza', 265);
        for (let k = 0; k < 2 + Math.floor((w * h) / 120); k++) tree(pick(['broadleaf', 'sakura', 'tiny']), x + 1.6 + rand() * Math.max(0.5, w - 3.2), u + 1.6 + rand() * Math.max(0.5, h - 3.2), 1.8 + rand());
        lampAt(x + 1, u + 1, COOL);
        crowd(x + 1, u + 1, w - 3, h - 3, 3);
      } else {
        pave(x, u, w - 1, h - 1, 'asphalt');
        for (let i = 3; i < w - 3; i += 3.4) for (let j = 4; j < h - 3; j += 9) if (rand() < 0.6) car(x + i, u + j, true);
        lampAt(x + 1, u + h - 1);
      }
    }
  }
  for (const [x, u, w, h] of blocks(11450, 12100, 3, 4, true)) {
    pave(x, u, w - 0.67, h - 0.67, 'park');
    for (let k = 0; k < 1 + Math.floor((w * h) / 30); k++) tree(pick(['broadleaf', 'tiny', 'sakura']), x + 1 + rand() * Math.max(0.3, w - 2), u + 1 + rand() * Math.max(0.3, h - 2), 1.4 + rand());
  }
}
