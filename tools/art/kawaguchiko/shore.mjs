// The shore (u 1300-2400, docs/plan-kawaguchiko.md phase 3): late afternoon on the lake's north side. Kawaguchiko
// station, a timber lodge where the local line ends, its square of buses for the mountain; the hot-spring town down
// to the water - inns under great tiled roofs round their gardens, their open-air baths steaming on terraces, a hotel
// in tiers, souvenir shops and a bicycle hire; Mt Tenjo's wood with the ropeway climbing it, two gondolas passing on
// the way, the top station with its terrace and bell and the little shrine of the rabbit of the old tale; Oishi
// park on its peninsula, rows of lavender cut back and the round kochia bushes turned crimson, the pavilion selling lavender ice cream; the
// marina, its piers lined with swan boats and rowing boats, the sightseeing boat's landing.
import { lots } from '../tokyo/blocks.mjs';
import { PAL, shade } from '../tokyo/kit.mjs';
import { makeParts, VERMILION } from './parts.mjs';
import { swanFrame, rowboatFrame } from './boats.mjs';

export function shore(ctx) {
  const { kit, blocks, pave, plot, props, S } = ctx;
  const { building, house, tree, car, crowd, mark, ground, rand, pick, P, R, FX, FY, queue, shadowBox, hi } = kit;
  const { roof, torii, toro, pole, wires, nobori, bikes } = makeParts(ctx);
  kit.setSun(0.62);

  for (const id of ['ryokan_1', 'ryokan_2', 'ryokan_3', 'ryokan_4', 'ryokan_5', 'mise_kohan', 'ropeway_sanroku', 'kanko_sen_noriba']) {
    const p = plot(id);
    pave(p.x, p.u, p.w, p.h, 'plaza', 53);
  }
  for (const id of ['ropeway_sancho', 'usagi_jinja', 'tenbo_tenjo']) {
    const p = plot(id);
    pave(p.x, p.u, p.w, p.h, 'gravel');
  }

  // ---------------------------------------------------------------- Kawaguchiko station and its square
  {
    const p = plot('kawaguchiko_eki');
    // the platform where the line ends, its buffer stop, the train's canopy
    ground(() => {
      for (let u = 1340; u < p.u + 2; u++) {
        R(FX(48.5), FY(u), FX(53) - FX(48.5), S, 0xbdb9b0);
        R(FX(48.5), FY(u), 1, S, 0xe8c840);
      }
    });
    mark(46, p.u + 1, (X, Y) => {
      R(X - 3, Y - 2, 7, 2, 0xd8c830);
      R(X - 3, Y - 2, 7, 1, 0x2a2a30);
    });
    // the lodge: a steep roof of dark shingles, its gable's timbers to the square, dormers on its slopes
    const [X0, X1, YT, YB] = [FX(p.x + 2), FX(p.x + p.w - 2), FY(p.u + p.h - 1), FY(p.u + 1)];
    queue(YB, () => {
      const fh = 15;
      roof(X0, YT, X1 - X0, YB - YT - fh, 0x4a3a30);
      for (const i of [0.25, 0.5, 0.75]) {
        const x = X0 + Math.round((X1 - X0) * i) - 4;
        R(x, YT + 6, 8, 6, 0x6a5a4a); // a dormer
        R(x + 2, YT + 9, 4, 3, 0xe0d0a0);
      }
      for (let j = 0; j < fh; j++)
        for (let i = X0 + 1; i < X1 - 1; i++) {
          let c = (i - X0) % 9 === 0 ? 0x4a3020 : j < 2 ? 0x6a4a30 : 0x9a6a42; // logs and posts
          if (j % 4 === 0) c = shade(c, 0.86);
          if (j > 5 && j < fh - 3 && (i - X0) % 9 >= 3 && (i - X0) % 9 <= 6) c = 0x3a4a5a; // its windows
          if (j === fh - 1) c = 0x2a2226;
          P(i, YB - fh + j, c);
        }
      R(((X0 + X1) >> 1) - 5, YB - fh + 1, 10, 4, 0xf0e8d0); // its name board (strokes)
      kit.strokes(((X0 + X1) >> 1) - 5, YB - fh + 1, 10, 4, 0x3a2a20, 11);
    }, () => shadowBox(X0, YT, X1 - X0, YB - YT, 12, 0.6));
    // the canopy over the track's end and the platform, the train under it
    const f = kit.frame(9.67, 44, 1362, (put, c) => {
      for (let j = 0; j < c.hi.h; j++) for (let i = 0; i < c.hi.w; i++) put(i, j, kit.canopy(j, i, c.hi.w));
    });
    props.loop(42.6, 1384, [f], { fps: 1, d: 0.1 });
  }
  {
    const p = plot('basu_noriba');
    mark(p.x, p.u + p.h, (X, Y) => {
      R(X, Y, FX(p.w) - FX(0), 4, 0xc4ccd4);
      R(X, Y + 3, FX(p.w) - FX(0), 1, 0x6a727c);
      R(X + 1, Y + 1, FX(p.w) - FX(0) - 2, 2, 0x8aa4b8);
    });
    // buses for the fifth station, waiting at their stands
    for (const [x, c] of [[60, 0x3a6a4a], [70, 0xe8e8ec], [80, 0x2a4a8a]])
      queue(FY(1356), () => {
        const [X, Y] = [FX(x) - 4, FY(1366)];
        for (let j = 0; j < 30; j++)
          for (let i = 0; i < 9; i++) {
            let col = i === 0 || i === 8 ? shade(c, 0.7) : c;
            if (j < 4) col = 0x2c3a4c; // the windscreen
            else if (i >= 2 && i <= 6 && j % 6 === 2) col = shade(c, 1.2); // roof hatches
            P(X + i, Y + j, col);
          }
      }, () => shadowBox(FX(x) - 4, FY(1366), 9, 30, 2, 0.7));
    crowd(p.x, p.u - 10, p.w, 8, 18);
  }
  crowd(22, 1342, 20, 34, 16);
  for (const x of [26, 88]) tree('broadleaf', x, 1374, 2.4);

  // ---------------------------------------------------------------- the inns: great roofs round a garden, baths on the terrace
  /** An inn on the box: its wings under tiled roofs round a court with a pond and a pine, the bath on its lake side. */
  const ryokan = (p, s, { bath = 'north', tile = 0x5a626e } = {}) => {
    const { x, u, w, h } = p;
    house(x + 1, u + 1, w - 2, 12, { tile, face: 3, s });
    house(x + 1, u + 14, 10, h - 28, { tile, face: 3, s: s + 1 });
    house(x + w - 11, u + 14, 10, h - 28, { tile, face: 3, s: s + 2 });
    house(x + 1, u + h - 13, w - 2, 12, { tile, face: 3, s: s + 3 });
    // the court: moss, a pond with a stone bridge, a pine, stepping stones, a lantern
    pave(x + 12, u + 14, w - 24, h - 28, 'park', s);
    ground(() => {
      const [cx, cu] = [x + w / 2, u + h / 2];
      for (let j = -4; j <= 4; j++) for (let i = -6; i <= 6; i++) if ((i / 6.4) ** 2 + (j / 4.2) ** 2 <= 1) R(FX(cx + i * 0.8), FY(cu + j * 0.8), 2, 2, (i + j) % 3 ? 0x3a6a78 : 0x4a7a88);
      for (let k = 0; k < 5; k++) R(FX(x + 13 + k * 2.2), FY(u + 16 + k * 0.6), 4, 3, 0xb8b0a0);
    });
    tree('pine', x + w / 2 + 4, u + h / 2 + 3, 2.4);
    toro(x + 14, u + h / 2 + 4);
    // the open-air bath: a pool edged with stones, steam over it, a bamboo screen
    const bu = bath === 'north' ? u + h - 4 : u + 4;
    ground(() => {
      for (let j = -3; j <= 3; j++) for (let i = -7; i <= 7; i++) {
        const d = (i / 7.4) ** 2 + (j / 3.4) ** 2;
        if (d > 1) continue;
        R(FX(x + w / 2 + i * 0.8), FY(bu + j * 0.6), 3, 2, d > 0.65 ? (i + j) % 2 ? 0x8a8478 : 0x6a6458 : 0x6ab0b8);
      }
    });
    kit.smoke(x + w / 2, bu + 1, { rate: 0.9, vy: 4, a: 0.28, sx: 3 });
  };
  ryokan(plot('ryokan_1'), 7001);
  ryokan(plot('ryokan_2'), 7011, { tile: 0x4c5a52 });
  {
    // the hotel: tiers of balconies stepping back towards the lake, a garden on the lowest roof
    const p = plot('ryokan_3');
    building(p.x + 1, p.u + 2, p.w - 2, p.h - 4, {
      face: 9, style: 'balcony', wall: 0xe8e0d0, roof: 0x8a8e94, s: 7021,
      tiers: [{ in: [3, 4, 3, 14], face: 6, style: 'balcony', top: ({ X, Y, w, h, ac, tank }) => { tank(X + 8, Y + 6, 4); for (let k = 0; k < 6; k++) ac(X + 14 + k * 6, Y + h - 8); } }],
    });
  }
  ryokan(plot('ryokan_4'), 7031, { tile: 0x6a5a50, bath: 'south' });
  ryokan(plot('ryokan_5'), 7041);
  {
    // souvenir shops and the bicycle hire, banners out front
    const p = plot('mise_kohan');
    for (let k = 0; k < 3; k++) building(p.x + 1 + k * 15, p.u + 14, 14, p.h - 15, { face: 4, style: 'plain', shop: true, sign: true, s: 7051 + k });
    ground(() => {
      for (let r = 0; r < 2; r++) bikes(FX(p.x + 3), FY(p.u + 10 - r * 5), 16);
    });
    for (const dx of [2, 16, 30, 44]) nobori(p.x + dx, p.u + 14, [0x7a5ab0, 0xc83028, 0x2a8a5a, 0xe0a030][dx % 4]);
    crowd(p.x, p.u + 1, p.w, 12, 14);
  }

  // ---------------------------------------------------------------- Mt Tenjo: its wood, the ropeway, the top station
  {
    const g = ctx.ground('tenjoyama').rect;
    const rope = ctx.RAILS.find((r) => r.id === 'tenjo_ropeway').pts;
    const busy = [[2, 1556, 54, 70]];
    for (let k = 0; k < 520; k++) {
      const [x, u] = [g[0] + 2 + rand() * (g[2] - 4), g[1] + 3 + rand() * (g[3] - 6)];
      if (busy.some(([bx, bu, bw, bh]) => x > bx && x < bx + bw && u > bu && u < bu + bh)) continue;
      if (ctx.near(rope, x, u).d < 3) continue; // (the line cleared under the cables)
      tree(rand() < 0.4 ? 'pine' : 'broadleaf', x, u, 2.2 + rand() * 1.6);
    }
    // the pylon half way up
    const [px, pu] = [65.5, 1760];
    mark(px, pu, (X, Y) => {
      for (let k = 0; k < 14; k++) hi.tint(X + 2 + k, Y + Math.round(k * 0.4), 0.72);
      R(X - 3, Y - 14, 2, 14, 0x8a8e94);
      R(X + 2, Y - 14, 2, 14, 0x6a6e74);
      for (let j = 0; j < 14; j += 3) R(X - 3, Y - 14 + j, 7, 1, 0x5a5e66);
      R(X - 5, Y - 16, 11, 2, 0x4a4e56);
    });
  }
  {
    const p = plot('ropeway_sanroku');
    building(p.x + 1, p.u + 1, p.w - 2, p.h - 3, {
      face: 4, style: 'plain', wall: 0xe8e0c8, roof: 0x8a4a3a, shop: true, s: 7101,
      top: ({ X, Y, w, h }) => {
        // the bull wheel under its housing, the cables running in
        for (let j = -5; j <= 5; j++) for (let i = -5; i <= 5; i++) if (i * i + j * j <= 25 && i * i + j * j >= 12) P(X + (w >> 1) + i, Y + (h >> 1) + j, 0x3a3a40);
      },
    });
    crowd(p.x - 2, p.u - 8, p.w + 4, 7, 10);
  }
  {
    const p = plot('ropeway_sancho');
    building(p.x + 1, p.u + 1, p.w - 2, p.h - 2, { face: 3, style: 'plain', wall: 0xe8e0c8, roof: 0x8a4a3a, s: 7111 });
  }
  {
    // the rabbit's shrine: a small hall, a red torii, two white rabbits of stone before it
    const p = plot('usagi_jinja');
    house(p.x + 1, p.u + 4, p.w - 2, p.h - 4, { tile: 0x6a3a2a, face: 1.6, s: 7121 });
    torii(p.x + 2, p.x + p.w - 2, p.u + 2, VERMILION, 2.6);
    for (const dx of [1.5, p.w - 1.5])
      mark(p.x + dx, p.u + 1, (X, Y) => {
        R(X - 1, Y - 3, 3, 3, 0xf4f4ee);
        R(X - 1, Y - 5, 1, 2, 0xf4f4ee);
        R(X + 1, Y - 5, 1, 2, 0xf4f4ee);
        P(X, Y - 2, 0xd04040);
      });
  }
  {
    // the terrace: planks, a rail, the bell in its frame that visitors ring, and the view they came for
    const p = plot('tenbo_tenjo');
    ground(() => {
      for (let u = p.u; u < p.u + p.h; u += 1) R(FX(p.x), FY(u + 1), FX(p.w) - FX(0), S, Math.floor((u - p.u) * S) % 4 === 0 ? 0x7a5a3c : 0x9a7a52);
    });
    mark(p.x + p.w / 2, p.u + p.h / 2, (X, Y) => {
      R(X - 5, Y - 9, 2, 9, 0x6a4a30);
      R(X + 4, Y - 9, 2, 9, 0x6a4a30);
      R(X - 6, Y - 10, 13, 2, 0x3a3a3c);
      R(X - 2, Y - 8, 5, 5, 0x8a6a3a);
      R(X - 2, Y - 8, 1, 5, 0xb08848);
    });
    for (let k = 0; k < 6; k++) mark(p.x + 2 + k * 3.4, p.u + 2, (X, Y) => kit.person(X, Y - 3, 7130 + k));
  }
  // the gondolas: two of them on the cables, one going up as the other comes down, passing at the pylon
  {
    const rope = ctx.RAILS.find((r) => r.id === 'tenjo_ropeway').pts;
    const gondola = (c) =>
      kit.frame(3, 3.67, 1780, (put) => {
        for (let j = 0; j < 11; j++)
          for (let i = 0; i < 9; i++) {
            if ((i === 0 || i === 8) && (j === 0 || j === 10)) continue;
            put(i, j, j < 2 ? shade(c, 1.25) : j > 8 ? shade(c, 0.7) : i === 0 || i === 8 ? shade(c, 0.8) : j > 3 && j < 8 ? 0x2c3a4c : c);
          }
        put(4, 0, 0x3a3a40);
      });
    props.path(kit.offset(rope, -0.9), [gondola(0xd86a2a)], { sp: 7, n: 1, mode: 'pp', hold: 6, turn: 'none', s0: 0.0, d: 0.3 });
    props.path(kit.offset([...rope].reverse(), -0.9), [gondola(0x8a5a2a)], { sp: 7, n: 1, mode: 'pp', hold: 6, turn: 'none', s0: 0.0, d: 0.3 });
  }

  // ---------------------------------------------------------------- the blocks of the hot-spring town
  for (const b of blocks(1300, 2100)) {
    for (const [x, u, w, h] of lots(b, rand, { depth: [10, 15], width: [9, 16] })) {
      if (w < 7 || h < 8) continue;
      const v = rand();
      if (v < 0.42) house(x, u, w - 1, h - 1, { hip: rand() < 0.6, tile: pick(PAL.tile) });
      else if (v < 0.66) building(x, u, w - 1, h, { style: pick(['balcony', 'plain']), face: 4 + Math.floor(rand() * 4), shop: rand() < 0.4, sign: rand() < 0.3, wall: pick([0xe8e0d0, 0xd8cfc0, 0xe0d8c8, 0xc8b8a4]) });
      else if (v < 0.8) {
        // a car park for the inns' guests
        pave(x, u, w - 1, h - 1, 'plaza', 59);
        ground(() => {
          for (let i = 1; i < w - 1; i += 4) R(FX(x + i), FY(u + h - 2), 1, 5 * S, 0xe0dcd0);
        });
        for (let i = 3; i < w - 3; i += 4) if (rand() < 0.65) car(x + i, u + h - 5, true);
      } else {
        pave(x, u, w - 1, h - 1, 'park');
        for (let k = 0; k < 1 + Math.floor((w * h) / 60); k++) tree(pick(['pine', 'broadleaf', 'tiny']), x + 2 + rand() * (w - 5), u + 2 + rand() * (h - 5), 1.8 + rand() * 1.4);
      }
    }
  }
  // poles and wires along the street by the water
  {
    const us = [];
    for (let x = 6; x < 60; x += 16) {
      us.push(x);
      pole(x, 2009.2, false);
    }
    void us;
  }
  for (let x = 96; x < 154; x += 14) tree('kaede', x, 2101, 1.8); // (cherries along the promenade, their leaves turned orange)

  // ---------------------------------------------------------------- Oishi park: kochia turned crimson, the lavender cut back, the pavilion
  {
    const g = ctx.ground('oishi_kochia').rect;
    const c = plot('oishi_center');
    for (let u = g[1] + 3; u < g[1] + g[3] - 2; u += 4.4)
      for (let x = g[0] + 3; x < g[0] + g[2] - 2; x += 4.4) {
        if (x > c.x - 2 && x < c.x + c.w + 2 && u > c.u - 2 && u < c.u + c.h + 2) continue;
        const X = FX(x + ((u * 7) % 3) * 0.3);
        const Y = FY(u);
        queue(Y + 3, () => {
          for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) if (i * i + j * j <= 10) P(X + i, Y + j, i + j < -2 ? 0xe0604a : i + j > 2 ? 0x7a2026 : (i * 5 + j * 3) % 7 ? 0xc03a34 : 0xa82e2e);
        }, () => shadowBox(X - 2, Y - 2, 5, 5, 2, 0.7));
      }
    building(c.x + 1, c.u + 4, c.w - 2, c.h - 6, { face: 3, style: 'plain', wall: 0xf0ece0, roof: 0x7a6aa0, shop: true, s: 7201 });
    for (const dx of [3, c.w - 3]) mark(c.x + dx, c.u + 2, (X, Y) => kit.parasol(X, Y - 3, 0x8a6ac0));
    crowd(c.x, c.u - 6, c.w, 6, 12);
    // its sign of soft ice cream, lavender-coloured, by the door
    mark(c.x + c.w / 2 + 6, c.u + 3, (X, Y) => {
      R(X, Y - 8, 1, 8, 0x5a5a60);
      R(X - 2, Y - 13, 5, 5, 0xe8d8f0);
      R(X - 1, Y - 12, 3, 3, 0x9a7ac8);
      R(X - 1, Y - 9, 3, 2, 0xd8a860);
    });
  }
  {
    // the lavender, cut back for the winter: visitors along its rows, benches by the path, a breeze through the cosmos
    const g = ctx.ground('oishi_koen').rect;
    // by the pavilion, beds of autumn flowers in bands across the lavender: marigolds, white cosmos, pink cosmos, salvia
    ground(() => {
      // (they follow the lavender's rows: only its stripes change colour, the earth between stays)
      const bands = [[2106, 2116, 0xd8a030], [2122, 2130, 0xe4e0d4], [2136, 2144, 0xd8709c], [2150, 2156, 0xc83a34]];
      for (const [u0, u1, c] of bands)
        for (let u = u0; u < u1; u += 1 / S)
          for (let x = g[0] + 15; x < 66; x += 1 / S) {
            if (Math.floor(x * 0.75 + u * 0.12) % 3 === 0) continue;
            const [X, Y] = [FX(x), FY(u)];
            const v = (X * 7 + Y * 13) % 11;
            P(X, Y, v < 3 ? 0x5a6a40 : v < 5 ? shade(c, 0.82) : v === 10 ? shade(c, 1.15) : c);
          }
    });
    // trees along the peninsula's shore, the path under them
    for (let x = 6; x < 62; x += 7) tree(x % 2 ? 'broadleaf' : 'pine', x + rand() * 2, 2392 + rand() * 3, 2.4 + rand());
    crowd(g[0] + 14, g[1] + 6, 50, g[3] - 20, 40);
    for (let u = g[1] + 20; u < g[1] + g[3]; u += 40) mark(13.5, u, (X, Y) => {
      R(X, Y - 3, 8, 2, 0x8a6a48);
      R(X, Y - 3, 8, 1, 0xa8885e);
    });
    const shimmer = [0, 1].map((k) =>
      kit.frame(14, 6, 2200, (put) => {
        for (let j = 0; j < 18; j++) for (let i = 0; i < 42; i++) if ((i * 0.75 * 3 + j * 0.12 * 3 + k * 7) % 9 < 1.4 && (i + j * 3 + k) % 5 < 3) put(i, j, 0xd8dcc8, 0.4);
      }));
    const parts = [];
    for (let u = g[1] + 12; u < g[1] + g[3]; u += 14) for (let x = g[0] + 2; x < g[0] + g[2] - 14; x += 16) parts.push([(parts.length % 2), x, u, (x + u) * 0.05]);
    props.wave(shimmer, parts, { w: 0.9, a0: 0, a1: 0.9, pw: 2, d: 0.02 });
  }

  // ---------------------------------------------------------------- the marina and the sightseeing boat's landing
  {
    const g = ctx.ground('marina').rect;
    // the hire hut, its board, life rings on the rail
    building(g[0] + 2, g[1] + 6, 14, 11, { face: 3, style: 'plain', wall: 0xf0ece4, roof: 0x2a6aa0, shop: true, s: 7301 });
    mark(g[0] + 20, g[1] + 10, (X, Y) => {
      for (const i of [0, 7, 14]) {
        for (let k = 0; k < 8; k++) P(X + i + Math.round(Math.cos(k * 0.8) * 2), Y - 4 + Math.round(Math.sin(k * 0.8) * 2), k % 2 ? 0xf4f4f0 : 0xe04a30);
      }
    });
    crowd(g[0] + 18, g[1] + 2, 26, 6, 10);
    // swan boats tied along both piers, rowing boats between
    for (const [x, u0, u1] of [[101, 2126, 2188], [123, 2126, 2184]])
      for (let u = u0; u < u1; u += 7) {
        const left = (u / 7) % 2 < 1;
        const f = (u + x) % 3 === 0 ? 'row' : 'swan';
        mark(x + (left ? -4.2 : 4.2), u, (X, Y) => (f === 'swan' ? swanAt : rowAt)(X, Y), u);
      }
  }
  {
    // the landing: ticket office, the gangway, the pontoon
    const p = plot('kanko_sen_noriba');
    building(p.x + 1, p.u + 3, p.w - 2, p.h - 5, { face: 3, style: 'plain', wall: 0xf4f0e8, roof: 0x2a5a8a, shop: true, sign: 0x2a5a8a, s: 7311 });
    crowd(p.x, p.u - 3, p.w, 4, 8);
  }

  /** A swan boat seen from above at the fine pixel (X, Y), its head up the strip. */
  function swanAt(X, Y) {
    swanFrame((i, j, c) => P(X - 4 + i, Y - 7 + j, c));
  }
  function rowAt(X, Y) {
    rowboatFrame((i, j, c) => P(X - 3 + i, Y - 7 + j, c));
  }
  void props;
  void pick;
  void wires;
}
