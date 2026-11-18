// Hondori (u 5100-6250, docs/plan-onomichi.md phase 6): the night of the fireworks festival in the old town between
// the coast road and the railway. The arcade runs the whole way under its roof of clear panels, lit from inside, its
// entrances hung with paper lanterns; along it narrow shops and houses back to back - the Onomichi ramen bars with
// their queues and the steam off their kitchens, the old bathhouse with its chimney, a coffee house with its awning;
// on the quay of Sumiyoshi, put out over the strait, the shrine with its torii, the festival's stalls and everyone in
// yukata on their mats waiting for the fireworks, lantern strings over them, boats of watchers on the water. The
// ferries cross from Mukaishima to their piers; cars run the coast road both ways. No shop's names or signs.
import { PAL, shade } from '../tokyo/kit.mjs';
import { hashPx } from '../hires.mjs';
import { ROADS, FERRIES, railX } from './route.mjs';
import { railHalf } from '../tokyo/geom.mjs';
import { RAILS } from './route.mjs';
import { freeMap } from './senkoji.mjs';
import { makeParts } from '../kawaguchiko/parts.mjs';

const [U0, U1] = [5100, 6250];
const TILES = [0x6a7078, 0x5e646e, 0x747a82, 0x4e5662, 0x585e66];
const TIN = [0x4a6a8a, 0x8a4a32, 0x5a7a6a, 0x8a8680];
const STUCCO = [0xe4dccc, 0xd8cfc0, 0xcfc6b6, 0xb8a890, 0xe8e2d4];
const YUKATA = [0x2a3a6a, 0xf0ece0, 0x3a6aa8, 0xe8a0b0, 0x6a4a8a, 0xd84a5a, 0x2a2a30, 0xf4d0a0, 0x5a8a8a];

export function hondori(ctx) {
  const { kit, plot, props, S, along, pave } = ctx;
  const { house, building, mark, ground, rand, pick, P, R, FX, FY, queue, shadowBox, hi, lamp, person, crowd, E, ER, halo, smoke } = kit;
  const { roof, torii, toro } = makeParts(ctx);
  const { boxFree, claim } = freeMap(U0, U1);
  const edgeE = (u) => railX(u) - railHalf(RAILS[0]) - 0.9; // (the shops' backs to the railway)

  // ---- the narrow lots on both sides of the arcade: shops of two and three storeys, a house now and then
  const lots = (a, bOf, maxLen) => {
    for (let u = U0 + 1; u < U1 - 3; ) {
      const len = 3.6 + rand() * maxLen;
      const b = bOf(u);
      if (b - a >= 4 && boxFree(a, u, b - a, len)) {
        const v = rand();
        if (v < 0.3) house(a, u, b - a, len - 0.5, { tile: pick(TILES), hip: rand() < 0.4, wall: pick(STUCCO), face: 2.2 });
        else building(a, u, b - a, len - 0.5, { style: rand() < 0.6 ? 'plain' : 'balcony', face: 3 + Math.floor(rand() * 3), wall: pick(STUCCO), roof: pick([...TIN, ...TILES]) });
        claim(a, u, b - a, len);
        u += len;
      } else u += 1;
    }
  };
  lots(76.2, () => 80.9, 4); // (between the coast road's pavement and the arcade)
  lots(91.2, edgeE, 6); // (between the arcade and the railway)

  // ---- the arcade: lit from inside through its roof, the light spilling out at its mouths; its entrances hung with
  // red and white lanterns for the festival, a gate over each with a plain board
  const arcade = ROADS.find((r) => r.id === 'hondori').pts;
  along(arcade, 4, (n, x, u, X, Yy) => {
    if (Math.abs(n.side) < 0.34 || n.d > 3.5) return null;
    if (Math.floor(n.along * S) % 9 === 4 && Math.floor(X / 2) % 3 === 0) E(X, Yy, 0xfff0c8); // the lamps under the panels
    return null;
  });
  for (let u = U0 + 10; u < U1; u += 24) halo(FX(86), FY(u), 14, 22, 0xffe8b0, 0.2);
  for (const u of [5100, 5520, 6250]) {
    mark(86, u, (X, Y) => {
      R(X - 13, Y - 10, 27, 3, 0x3a3a40); // the gate's beam, its board
      R(X - 5, Y - 12, 11, 4, 0xe8e0c8);
      for (let i = -11; i <= 11; i += 3) {
        const c = (i / 3) % 2 ? 0xd83a2a : 0xf4ece0;
        ER(X + i, Y - 6, 2, 3, c);
        halo(X + i, Y - 5, 4, 3, 0xffc070, 0.3);
      }
    });
    crowd(80, u - 3, 12, 6, 6);
  }

  // ---- the plots along the arcade
  {
    for (const id of ['ramen_1', 'ramen_2']) {
      const p = plot(id);
      pave(p.x, p.u, p.w, p.h, 'plaza', 901);
      building(p.x, p.u + 3, p.w, p.h - 3, { style: 'plain', face: 3, wall: 0xd8cfc0, roof: 0x5a5e66, s: hashPx(p.u, 1, 2) * 1e6 | 0 });
      // its noren and lantern at the side door, the queue along its wall, steam off the kitchen
      mark(p.x + 2, p.u + 3, (X, Y) => {
        R(X, Y - 3, 6, 3, 0xc8302a);
        for (let i = 1; i < 6; i += 2) P(X + i, Y - 1, 0x8a1a1a);
        ER(X + 8, Y - 4, 2, 3, 0xff6a3a);
        halo(X + 9, Y - 3, 6, 5, 0xff9050, 0.35);
      });
      for (let k = 0; k < 6; k++) mark(p.x + 1 + k * 2.1, p.u + 1.4, (X, Y) => person(X, Y, 9000 + p.u + k));
      smoke(p.x + p.w - 3, p.u + p.h - 2, { rate: 0.8, a: 0.35 });
    }
    const b = plot('sento_h');
    pave(b.x, b.u, b.w, b.h, 'plaza', 902);
    house(b.x, b.u, b.w, b.h - 1, { tile: 0x4e5662, hip: false, wall: 0xe8e2d4, face: 2.6, s: 9021 });
    mark(b.x + b.w - 3, b.u + b.h - 4, (X, Y) => {
      for (let k = 1; k <= 18; k++) hi.tint(X + 2 + k, Y + Math.round(k * 0.5), 0.72); // the chimney's shadow
      R(X - 1, Y - 18, 4, 18, 0x8a4a32);
      R(X - 1, Y - 18, 1, 18, 0xa85a3e);
      for (let j = 0; j < 18; j += 3) R(X - 1, Y - 18 + j, 4, 1, 0x6a3a28);
    });
    const k = plot('kissa');
    pave(k.x, k.u, k.w, k.h, 'plaza', 903);
    building(k.x, k.u + 2, k.w, k.h - 2, { style: 'brick', face: 3.4, wall: 0x8a4a32, roof: 0x4e5662, s: 9031 });
    mark(k.x + 1, k.u + 2, (X, Y) => {
      for (let i = 0; i < FX(k.w) - FX(0) - 6; i++) R(X + i, Y - 3, 1, 3, Math.floor(i / 3) % 2 ? 0xd83a2a : 0xf4ece0); // its awning
      ER(X + 2, Y, 6, 2, 0xffe0a0);
    });
  }

  // ---- the quay of Sumiyoshi: the shrine, its stone torii towards the road, the stalls, the watchers on their mats,
  // lantern strings over all of it
  {
    const s = plot('sumiyoshi_jinja');
    pave(s.x, s.u, s.w, s.h, 'gravel', 904);
    house(s.x + 3, s.u + 4, s.w - 6, s.h - 6, { tile: 0x4a8a7a, hip: true, wall: 0xc8402a, face: 2.4, s: 9041 }); // (a copper roof gone green)
    torii(s.x + s.w - 1, s.x + s.w + 5, s.u + s.h / 2, 0x9a968c, 3.6);
    toro(s.x + 2, s.u + 2, true);
    toro(s.x + 2, s.u + s.h - 2, true);
    const y = plot('yatai_matsuri');
    for (let k = 0; k < 5; k++) {
      const [x, u] = [y.x + 0.6 + k * 4.7, y.u + 2];
      const c = [0xd83a2a, 0x3a6aa8, 0xe8c040, 0xd83a2a, 0x5a8a5a][k];
      mark(x, u, (X, Y) => {
        for (let j = 0; j < 12; j++) for (let i = 0; i < 13; i++) P(X + i, Y - 12 + j, j < 6 ? (Math.floor(i / 2) % 2 ? c : 0xf4ece0) : j === 6 ? 0x3a3a40 : 0x6a5a48);
        ER(X + 2, Y - 5, 9, 2, 0xffe8b0); // the counter lit
        halo(X + 6, Y - 2, 10, 6, 0xffd890, 0.3);
      });
      if (k % 2 === 0) smoke(x + 2, u + 2, { rate: 0.6, a: 0.3 });
    }
    crowd(y.x, y.u - 1, y.w, 3, 12);
    const m = plot('kenbutsu');
    ground(() => {
      for (let k = 0; k < 5; k++) R(FX(m.x + 1 + k * 5), FY(m.u + m.h - 1), FX(4) - FX(0), FX(m.h - 2) - FX(0), k % 2 ? 0x3a6ac8 : 0x4a7ad0); // blue mats
    });
    for (let k = 0; k < 22; k++) mark(m.x + 1 + rand() * (m.w - 2), m.u + 1 + rand() * (m.h - 2), (X, Y) => {
      const c = YUKATA[Math.floor(hashPx(X, Y, 905) * YUKATA.length)];
      R(X - 1, Y - 3, 3, 3, c);
      P(X, Y - 4, 0x2a2420);
    });
    // the rest of the quay: everyone in yukata, the lantern strings, lamps
    const q = ctx.ground('sumiyoshi_hato').rect;
    crowd(q[0] + 1, q[1] + 2, q[2] - 6, 34, 20);
    crowd(q[0] + 1, q[1] + 96, q[2] - 6, 50, 26);
    for (const u of [q[1] + 6, q[1] + 40, q[1] + 90, q[1] + 120])
      mark(q[0] + 1, u, (X, Y) => {
        const w = FX(q[2] - 4) - FX(0);
        for (let i = 0; i < w; i++) P(X + i, Y - 8 + Math.round(Math.sin((i / w) * Math.PI) * 2), 0x2a2a30);
        for (let i = 2; i < w; i += 5) {
          ER(X + i, Y - 7 + Math.round(Math.sin((i / w) * Math.PI) * 2), 2, 3, (i / 5) % 2 ? 0xd83a2a : 0xf4ece0);
          halo(X + i + 1, Y - 6, 5, 4, 0xffc070, 0.25);
        }
      });
    for (let u = q[1] + 4; u < q[1] + q[3]; u += 20) mark(q[0] + 1.4, u, (X, Y) => lamp(X, Y));
    // boats of watchers tied off the quay, their lanterns lit
    for (const [x, u] of [[22, 5690], [21, 5730], [23, 5772]])
      mark(x, u, (X, Y) => {
        for (let j = -4; j <= 4; j++) {
          const half = Math.round(12 * Math.sin(((j + 5) / 10) * Math.PI) ** 0.5);
          for (let i = -half; i <= half; i++) P(X + i, Y + j, Math.abs(j) === 4 || Math.abs(i) === half ? 0x4a3a2a : Math.abs(j) < 2 && Math.abs(i) < half - 3 ? 0x8a6a48 : 0xa8885e);
        }
        for (let i = -8; i <= 8; i += 4) {
          ER(X + i, Y - 1, 2, 2, 0xff8a4a);
          halo(X + i, Y, 5, 4, 0xffa060, 0.3);
        }
      });
  }

  // ---- the ferries: double-ended, a deck with a car or two and bicycles, the wheelhouse on one side; across the strait
  // from pier to pier and back (the Mukaishima one at Ozaki the long way, up the strip)
  {
    const ferryF = (along) =>
      kit.frame(along ? 7 : 16, along ? 16 : 7, 5600, (put) => {
        const [w, h] = along ? [21, 48] : [48, 21];
        for (let j = 0; j < h; j++)
          for (let i = 0; i < w; i++) {
            const [a, b] = along ? [j, i] : [i, j]; // (a along the ferry, b across it)
            const [L, B] = along ? [h, w] : [w, h];
            const end = Math.min(a, L - 1 - a);
            if (end < 3 && (b < 3 - end || b > B - 4 + end)) continue;
            let c = b === 0 || b === B - 1 || end === 0 ? 0x3a4a5a : b < 3 || b > B - 4 ? 0xe8e8ec : 0x8a8e94; // white sides, grey deck
            if (b === 2 || b === B - 3) c = 0x2a5aa8; // a blue band
            if (a > L * 0.4 && a < L * 0.6 && b > B - 8 && b < B - 3) c = j % 2 ? 0xd8dce0 : 0x4a6a8a; // the wheelhouse
            put(i, j, c);
          }
        // a car and bicycles on the deck
        const car = [0xd84a3a, 0xe8e8ec, 0x3a3a40][along ? 1 : 0];
        for (let a = 8; a < 20; a++) for (let b = 5; b < 11; b++) put(...(along ? [b, a] : [a, b]), (a === 8 || a === 19) ? 0x2a2a30 : car);
        for (let a = 26; a < 36; a += 3) put(...(along ? [8, a] : [a, 8]), 0x3a3a40);
      });
    const [up, across] = [ferryF(true), ferryF(false)];
    FERRIES.forEach((f, k) => props.path(f.pts, [k === 0 ? up : across], { sp: 5, n: 1, mode: 'pp', hold: 7, turn: 'none', s0: (k * 0.27) % 1, d: 0.05 }));
  }

  // ---- cars on the coast road both ways (they keep to the left)
  {
    const road = ROADS.find((r) => r.id === 'kaigan_dori').pts;
    kit.trafficOn(kit.offset(road, 2), { sp: 20, gap: 160, s0: 0.2, u: 5600 });
    kit.trafficOn(kit.offset([...road].reverse(), 2), { sp: 20, gap: 160, s0: 0.7, u: 5600 });
  }
}
