// The station's waterfront (u 6250-7168, docs/plan-onomichi.md phase 6): night before the station, where the strip
// ends over the water the boss fights on. The old port warehouses of brick and corrugated iron, one of them now a
// hotel and cafe for the cyclists (no name); the coast road curving round the widening water into the station square
// with its buses, taxis and people; the station with its platforms under their canopies and the footbridge; behind
// the tracks the hillside and Saikoku-ji's gate with its giant straw sandals; on the water the two barges the
// fireworks go up from, boats of watchers, boats tied up along the quay; lamps all along the promenade.
import { PAL, shade } from '../tokyo/kit.mjs';
import { hashPx } from '../hires.mjs';
import { railHalf } from '../tokyo/geom.mjs';
import { RAILS, railX, suidoShores, widen } from './route.mjs';
import { freeMap } from './senkoji.mjs';
import { makeParts } from '../kawaguchiko/parts.mjs';

const [U0, U1] = [6250, 7168];
const TILES = [0x6a7078, 0x5e646e, 0x747a82, 0x4e5662, 0x585e66];
const STUCCO = [0xe4dccc, 0xd8cfc0, 0xcfc6b6, 0xb8a890, 0xe8e2d4];

export function minato(ctx) {
  const { kit, plot, props, S, pave, L } = ctx;
  const { house, building, tree, mark, ground, rand, pick, P, R, FX, FY, queue, shadowBox, hi, lamp, person, crowd, car, E, ER, halo } = kit;
  const { roof, bikes } = makeParts(ctx);
  const { boxFree, claim, taken } = freeMap(U0, U1);
  const rail = RAILS.find((r) => r.id === 'sanyo');

  // ---- the warehouses on the quay: long sheds of brick and corrugated iron, the one turned into a hotel and cafe
  {
    const p = plot('soko');
    pave(p.x, p.u, p.w, p.h, 'plaza', 951);
    building(p.x + 1, p.u + 22, p.w - 2, p.h - 23, { style: 'brick', face: 4, wall: 0x8a4a32, roof: 0x5a6a7a, s: 9511 });
    building(p.x + 1, p.u + 1, p.w - 10, 19, { style: 'plain', face: 4, wall: 0x6a6e76, roof: 0x4a5a6a, lit: 0.8, s: 9512 });
    // its terrace on the quay side: tables under parasols, bicycles racked, the cyclists
    for (let k = 0; k < 3; k++) mark(p.x + p.w - 7, p.u + 3 + k * 6, (X, Y) => kit.parasol(X, Y, 0xe8e4d8));
    mark(p.x + 2, p.u + 21, (X, Y) => bikes(X, Y - 5, 9));
    for (let k = 0; k < 5; k++) mark(p.x + p.w - 4, p.u + 2 + k * 3.4, (X, Y) => person(X, Y, 9520 + k));
    halo(FX(p.x + p.w / 2), FY(p.u + 10), 40, 30, 0xffd890, 0.22);
  }

  // ---- between the coast road and the tracks: hotels, offices, shops round the curve
  for (let u = U0 + 1; u < U1 - 3; ) {
    const len = 6 + rand() * 8;
    // (the lot from the road's pavement to the railway's ballast; the road follows the water as it widens)
    const roadX = (v) => (v > 6700 ? 140 : 70 + 70 * widen(v));
    const a = Math.max(roadX(u), roadX(u + len)) + 6.2;
    const b = Math.min(railX(u), railX(u + len)) - railHalf(rail) - 1;
    if (b - a >= 6 && boxFree(a, u, b - a, len)) {
      const v = rand();
      if (v < 0.35) building(a, u, b - a, len - 1, { style: 'balcony', face: 7 + Math.floor(rand() * 5), wall: pick(STUCCO), roof: 0x8a8680 });
      else if (v < 0.7) building(a, u, b - a, len - 1, { style: rand() < 0.5 ? 'office' : 'plain', face: 4 + Math.floor(rand() * 4), shop: true, sign: rand() < 0.4, wall: pick(STUCCO) });
      else house(a, u, b - a, len - 1, { tile: pick(TILES), hip: true, wall: pick(STUCCO), face: 2.4 });
      claim(a, u, b - a, len);
      u += len;
    } else u += 1;
  }

  // ---- the promenade round the water: its rail, lamps and benches, people out for the fireworks
  {
    for (let u = U0 + 4; u < 6760; u += 16) {
      const x = suidoShores(u)[1] + 2.2;
      mark(x, u, (X, Y) => lamp(X, Y));
      if (Math.floor(u / 16) % 2) crowd(x + 0.6, u - 6, 2, 8, 3);
    }
    ground(() => {
      for (let Y = FY(6770); Y < FY(U0); Y++) {
        const u = L - Y / S;
        P(FX(suidoShores(u)[1] + 0.6), Y, Y % 6 === 0 ? 0x3a3a40 : 0x8a8a90);
      }
    });
  }

  // ---- the station square: the bus stop's shelter, buses waiting, taxis in their rank, planters, lamps
  {
    const g = ctx.ground('ekimae').rect;
    const busF = (c) => (X, Y) => {
      for (let j = 0; j < 30; j++) for (let i = 0; i < 9; i++) P(X + i, Y - 30 + j, i === 0 || i === 8 || j === 0 || j === 29 ? 0x3a3a40 : i % 8 === 0 ? 0x2a3a4c : (j > 2 && j < 27 && (i === 1 || i === 7)) ? 0x2c3a4c : c);
      for (let j = 4; j < 26; j += 7) R(X + 2, Y - 30 + j, 5, 3, 0x8a9098); // its roof's units
      for (let k = 1; k <= 6; k++) for (let j = 0; j < 30; j++) hi.tint(X + 8 + k, Y - 30 + j + k, 0.75);
    };
    mark(g[0] + 2, g[1] + 46, busF(0xe8e4d8));
    mark(g[0] + 2, g[1] + 82, busF(0xd8dce0));
    const b = plot('basu_noriba');
    pave(b.x, b.u, b.w, b.h, 'plaza', 952);
    mark(b.x + 1, b.u + b.h - 1, (X, Y) => {
      R(X, Y - 2, FX(b.w - 2) - FX(0), 4, 0x5a6a7a);
      R(X, Y - 2, FX(b.w - 2) - FX(0), 1, 0x8a9aaa);
      ER(X + 2, Y + 2, 8, 1, 0xfff0d0);
    });
    crowd(b.x, b.u, b.w, b.h - 2, 8);
    for (let k = 0; k < 3; k++) car(g[0] + 11, g[1] + 92 + k * 9, true, 0x3a3a40);
    for (let u = g[1] + 6; u < g[1] + g[3]; u += 22) mark(g[0] + g[2] - 1.2, u, (X, Y) => lamp(X, Y));
    crowd(g[0] + 1, g[1] + 100, g[2] - 2, 26, 16);
  }

  // ---- the station: its building of wood and glass beside the tracks, the platform under its canopy, a footbridge
  {
    const p = plot('onomichi_eki');
    pave(p.x, p.u, p.w, p.h, 'plaza', 953);
    building(p.x + 0.5, p.u + 2, 12, p.h - 4, { style: 'glass', face: 4, wall: 0xb08a5a, roof: 0x4e5662, glass: [0x5a4a3a, 0xc8a878], lit: 0.7, s: 9531 });
    ground(() => {
      for (let u = p.u + 1; u < p.u + p.h - 1; u += 1 / S) {
        const x = railX(u) - railHalf(rail) + 0.2;
        R(FX(p.x + 13), FY(u), FX(x) - FX(p.x + 13), 1, 0xbdb9b0); // the platform
        P(FX(x) - 1, FY(u), 0xe8c840); // its yellow line
      }
    });
    mark(p.x + 13, p.u + p.h - 2, (X, Y) => {
      const [w, h] = [FX(railX(p.u) - railHalf(rail)) - X, FY(p.u + 2) - FY(p.u + p.h - 2)];
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) P(X + i, Y + j, kit.canopy(j, i, w));
      for (let j = 6; j < h; j += 14) ER(X + 1, Y + j, w - 2, 1, 0xfff4d8);
    }, p.u + 2);
    mark(p.x + 1, p.u + p.h - 4, (X, Y) => {
      // the footbridge over the tracks to the far platform: its deck and roof
      const w = FX(p.x + p.w + 4) - X;
      R(X, Y - 6, w, 6, 0x8a8e94);
      R(X, Y - 6, w, 1, 0xc0c4c8);
      for (let i = 0; i < w; i += 5) ER(X + i, Y - 3, 2, 1, 0xfff0d0);
    }, p.u + 2);
    crowd(p.x + 13, p.u + 6, 2, p.h - 12, 8);
  }

  // ---- behind the tracks: the hillside's houses and trees, Saikoku-ji's gate with the great straw sandals
  {
    const q = plot('saikokuji');
    pave(q.x, q.u, q.w, q.h, 'gravel', 954);
    const [X0, X1, YT, YB] = [FX(q.x + 1), FX(q.x + q.w - 1), FY(q.u + q.h - 2), FY(q.u + 6)];
    queue(YB, () => {
      roof(X0 - 2, YT, X1 - X0 + 4, YB - YT - 9, 0x50565e);
      for (let j = 0; j < 9; j++) for (let i = X0 + 1; i < X1 - 1; i++) P(i, YB - 9 + j, (i - X0) % 8 === 0 ? 0x3a2a20 : j === 8 ? 0x2a2226 : 0x7a4a30);
      // the sandals hung on the gate, each taller than a man, woven straw
      for (const cx of [X0 + 8, X1 - 9])
        for (let j = 0; j < 20; j++)
          for (let i = -4; i <= 4; i++) {
            if ((i / 4.5) ** 2 + ((j - 10) / 10.5) ** 2 > 1) continue;
            P(cx + i, YB - 24 + j, (i + j) % 3 === 0 ? 0xa8905a : j % 2 ? 0xd8c088 : 0xc8ae74);
          }
    }, () => shadowBox(X0 - 2, YT, X1 - X0 + 4, YB - YT, 20, 0.6));
    for (let u = 6900; u < U1 - 3; u += 4 + rand() * 4) {
      const x = railX(u) + railHalf(rail) + 2 + rand() * (W_ - railX(u) - railHalf(rail) - 4);
      if (!taken(x, u)) {
        if (rand() < 0.6) tree(rand() < 0.5 ? 'pine' : 'broadleaf', x, u, 1.8 + rand() * 1.6);
        else if (boxFree(x - 3, u - 3, 6, 6)) {
          house(x - 3, u - 3, 6, 6, { tile: pick(TILES), hip: true, face: 1.8 });
          claim(x - 3, u - 3, 6, 6);
        }
      }
    }
  }

  // ---- on the water: the fireworks barges, boats of watchers drifting, boats tied up at the quay
  for (const id of ['hanabi_dai_1', 'hanabi_dai_2']) {
    const p = plot(id);
    mark(p.x, p.u, (X, Y) => {
      const [w, h] = [FX(p.w) - FX(0), FX(p.h) - FX(0)];
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) P(X + i, Y - h + j, i === 0 || j === 0 || i === w - 1 || j === h - 1 ? 0x2a2a30 : 0x4a4e56);
      for (let j = 3; j < h - 2; j += 3) for (let i = 3; i < w - 10; i += 3) { P(X + i, Y - h + j, 0x1a1a1e); P(X + i + 1, Y - h + j, 0x6a6e76); } // the mortars in their racks
      R(X + w - 8, Y - h + 3, 5, h - 6, 0x8a8e94); // the firers' hut
      E(X + w - 6, Y - h + 4, 0xffd080);
      halo(X + w - 6, Y - h + 4, 6, 5, 0xffc060, 0.3);
      for (let k = 0; k < 3; k++) {
        R(X + 4 + k * 7, Y - 3, 2, 2, 0xe8e8ec); // (their helmets)
      }
    });
  }
  {
    const boatF = kit.frame(9, 3.4, 6900, (put) => {
      for (let j = 0; j < 10; j++)
        for (let i = 0; i < 27; i++) {
          const end = Math.min(i, 26 - i);
          if (end < 3 && (j < 3 - end || j > 6 + end)) continue;
          put(i, j, j === 0 || j === 9 || end === 0 ? 0x4a3a2a : j > 2 && j < 7 && end > 3 ? 0x8a6a48 : 0xa8885e);
        }
      for (let i = 5; i < 23; i += 4) put(i, 4, 0xff9a5a);
    }, true);
    props.path([[20, 6720], [96, 6740]], [boatF], { sp: 2.4, n: 1, mode: 'pp', hold: 10, turn: 'none', s0: 0.2, d: 0.05 });
    props.path([[38, 6948], [84, 6956]], [boatF], { sp: 2, n: 1, mode: 'pp', hold: 12, turn: 'none', s0: 0.6, d: 0.05 }); // (between the barges and where the ship comes up)
  }
  for (let u = 6560; u < 6880; u += 40 + rand() * 30) {
    const x = suidoShores(u)[1] - 4.2;
    mark(x, u, (X, Y) => {
      const c = pick([0xf0ece4, 0xe8e4d8, 0x3a6aa8]);
      for (let j = -12; j <= 0; j++) {
        const half = Math.round(4 * Math.sin(((j + 13) / 14) * Math.PI) ** 0.6);
        for (let i = -half; i <= half; i++) P(X + i, Y + j, Math.abs(i) === half ? 0x4a4a50 : j > -8 && j < -3 && Math.abs(i) < 2 ? 0x7a6a5a : c);
      }
    });
  }
}
const W_ = 180;
