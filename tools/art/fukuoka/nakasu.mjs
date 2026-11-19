// Nakasu (u 2000-2990, docs/plan-fukuoka.md phase 4): the island between the Naka and the Hakata rivers at night, the
// sky paling towards its far end. The food stalls in a row on its bank of the Naka, their lanterns and steam, people
// on their stools and queueing; the riverside walk's lamps; the neon of the buildings broken on the water in streaks
// of colour (no words: bands, frames, stripes); tour boats with lanterns along their eaves going up and down the
// Naka; the island's lanes with taxis waiting; on the far bank of the Hakata the old-style theatre with its banners,
// the covered arcade lit inside, Kushida shrine with its great ginkgo and the festival's float on show all year round
// under its roof, tall with dolls and scenery; the west bank's little bars. No names or signs.
import { PAL, shade } from '../tokyo/kit.mjs';
import { hashPx } from '../hires.mjs';
import { ROADS, RIVERS } from './route.mjs';
import { freeMap } from './free.mjs';
import { fukuokaParts } from './parts.mjs';
import { makeParts, VERMILION } from '../kawaguchiko/parts.mjs';

const [U0, U1] = [1990, 2990];
const NEON = [0xff3a8a, 0x3ad8ff, 0xffd040, 0x8a5aff, 0x40ff9a, 0xff6a3a, 0xf0f0ff];
const road = (id) => ROADS.find((r) => r.id === id);

export function nakasu(ctx) {
  const { kit, plot, props, S, pave, W, near } = ctx;
  const { house, building, mark, ground, rand, pick, P, R, FX, FY, queue, shadowBox, hi, lamp, person, crowd, E, ER, halo, car, trafficOn, tree, glint, smoke } = kit;
  const { roof, torii, toro } = makeParts(ctx);
  const { yatai, lampsAlong } = fukuokaParts(ctx);
  const { boxFree, claim } = freeMap(U0, U1);

  // ---- the stalls on the bank of the Naka and the walk's lamps
  const kinds = ['ramen', 'oden', 'yakitori', 'tempura', 'gyoza', 'ramen', 'oden', 'ramen', 'mentaiko'];
  kinds.push('yakitori', 'oden', 'ramen');
  for (let k = 1; k <= 12; k++) {
    const p = plot(`yatai_${k}`);
    yatai(p.x + p.w / 2, p.u + 4, { kind: kinds[k - 1], queue: k % 3 === 1 ? 4 : k % 3 === 2 ? 1 : 0, seed: 2200 + k });
    // their light on the river: warm streaks off the bank by each
    for (let i = 0; i < 4; i++) glint(FX(46.6 - (i % 2) * 1.4), FY(p.u + 6 - i * 2.4), 10 + i * 3, i % 2 ? 0xff8a50 : 0xffd090, 0.75);
  }
  {
    // people strolling along the walk by the river, both ways, stopping at the stalls
    const walker = (c, k) => kit.frame(1, 1.67, 2400, (put) => {
      for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (!(j === 0 && i !== 1) && !(j === 4 && i === (k & 1 ? 0 : 2))) put(i, j, j === 0 ? 0x2a2018 : j < 3 ? c : 0x2a2a30);
    });
    const coats = [0x8a6a4a, 0x2a2a3a, 0xc8b8a0, 0x6a2a2a, 0x3a4a6a, 0xe8e4dc];
    const walk = road('nakasu_kawabata').pts.slice(1);
    props.path(walk.map(([x, u]) => [x - 0.8, u]), coats.map((c, k) => walker(c, k)), { sp: 1.6, n: 9, gap: 90, mode: 'pp', hold: 3, turn: 'none', s0: 0.1 });
    props.path([...walk].reverse().map(([x, u]) => [x + 0.8, u]), coats.slice(2).map((c, k) => walker(c, k + 1)), { sp: 1.3, n: 8, gap: 100, mode: 'pp', hold: 4, turn: 'none', s0: 0.55 });
  }
  lampsAlong(road('nakasu_kawabata').pts.slice(1), 16, -2.4);
  lampsAlong(road('nakasu_kawabata_e').pts, 18, 2);

  // ---- the island and the banks: buildings lit in neon - frames, bands, stripes of colour up their faces and round
  // their roofs - and on the far banks lower ones, bars with red lanterns
  const neonFace = (x, u, w, h, s) => {
    const c = NEON[Math.floor(hashPx(s, 1, 2) * NEON.length)];
    const c2 = NEON[Math.floor(hashPx(s, 3, 4) * NEON.length)];
    const kind = Math.floor(hashPx(s, 5, 6) * 4);
    mark(x, u, (X, Y) => {
      const w3 = FX(x + w) - X;
      if (kind === 0) for (let i = 1; i < w3 - 1; i++) E(X + i, Y - 2, (i >> 2) % 2 ? c : c2); // a band along its foot
      else if (kind === 1) for (let j = 0; j < 10; j++) { E(X + 1, Y - 3 - j, c); E(X + w3 - 2, Y - 3 - j, c); } // its corners lit
      else if (kind === 2) for (let i = 2; i < w3 - 2; i += 3) ER(X + i, Y - 9, 2, 6, i % 2 ? c : c2); // a stack of signs
      else ER(X + (w3 >> 2), Y - 8, w3 >> 1, 4, c);
      halo(X + (w3 >> 1), Y + 2, w3 * 0.7, 10, c, 0.22);
    }, u);
  };
  for (let u = U0; u < U1; u += 1)
    for (let x = 0; x < W - 4; x += 1) {
      const island = x > 49 && x < 114;
      const w = island ? 10 + Math.floor(rand() * 14) : 7 + Math.floor(rand() * 8);
      const h = island ? 10 + Math.floor(rand() * 14) : 9 + Math.floor(rand() * 9);
      if (!boxFree(x, u, w, h)) continue;
      claim(x - 1, u - 1, w + 2, h + 2);
      const s = Math.floor(rand() * 1e6);
      if (island) {
        const v = rand();
        if (v < 0.08 && w >= 12 && h >= 12) {
          // a multi-storey car park: its decks open at the sides, cars on its roof
          building(x + 0.5, u + 0.5, w - 1, h - 1, { style: 'plain', face: 8, wall: 0x8a8a86, roof: 0x6a6a6e, s });
          for (let k = 0; k < (w * h) / 40; k++) car(x + 2 + rand() * (w - 4), u + 3 + rand() * (h - 6), true);
        } else if (v < 0.13 && w >= 8) {
          // a little shrine between the buildings: a red torii, a tiny hall, a lantern
          pave(x + 0.5, u + 0.5, w - 1, h - 1, 'gravel', s % 1000);
          house(x + 2, u + 4, Math.min(w - 4, 7), Math.min(h - 6, 6), { tile: 0x4a7a6a, wall: VERMILION, face: 1.8, lantern: true, s });
          torii(x + w / 2 - 2, x + w / 2 + 2, u + 1.5, VERMILION, 2.6);
        } else if (v < 0.22) {
          // a tall hotel: a tower set back on its podium, its rooms' windows
          building(x + 0.5, u + 0.5, w - 1, h - 1, { style: 'balcony', face: 5, wall: 0xc8c4bc, roof: 0x5a5e66, shop: true, s, tiers: [{ in: [2, 2, 2, 2], face: 9, style: 'office', wall: 0xd8d4cc }] });
        } else {
          building(x + 0.5, u + 0.5, w - 1, h - 1, { style: pick(['neon', 'neon', 'depato', 'glass', 'plain']), face: 6 + Math.floor(rand() * 9), wall: pick([0x3a3a48, 0x4a4a58, 0x2e2e3a, 0x5a5468, 0x6a6470]), roof: pick(PAL.roofs), shop: true, sign: rand() < 0.6, s });
          if (rand() < 0.7) neonFace(x + 0.5, u + 0.5, w - 1, h - 1, s);
        }
      } else if (rand() < 0.5) {
        house(x + 0.5, u + 0.5, w - 1, h - 1, { tile: pick(PAL.tile), lantern: true, s });
      } else building(x + 0.5, u + 0.5, w - 1, h - 1, { style: pick(['plain', 'balcony', 'neon']), face: 5 + Math.floor(rand() * 6), wall: pick(PAL.walls), roof: pick(PAL.roofs), shop: true, sign: rand() < 0.5, s });
      x += w;
    }

  // ---- the neon broken on the rivers: streaks of colour on the water off each bank, the stalls' warm light
  for (const r of RIVERS.filter((q) => q.id === 'naka_gawa' || q.id === 'hakata_gawa')) {
    for (let u = U0 + 12; u < 2930; u += 3) {
      for (const side of [-1, 1]) {
        const c = hashPx(u, side, 3) < 0.35 ? 0xffd090 : NEON[Math.floor(hashPx(u, side, 4) * NEON.length)];
        const x = (r.id === 'naka_gawa' ? 36 : 121) + side * (r.half - 2 - hashPx(u, side, 5) * 3);
        if (hashPx(u, side, 6) < 0.55) glint(FX(x), FY(u), 4 + Math.floor(hashPx(u, side, 7) * 8), c, 0.55);
      }
    }
  }
  for (let x = 4; x < W; x += 9) glint(FX(x), FY(1962 + x * 0.12), 6, NEON[(x / 9) % NEON.length | 0], 0.45);

  // ---- tour boats on the Naka: a long low boat under a roof, paper lanterns all along its eaves, people at its tables
  {
    const boat = kit.frame(4.67, 14, 2400, (put) => {
      for (let j = 0; j < 42; j++)
        for (let i = 0; i < 14; i++) {
          const hull = Math.abs(i - 6.5) <= 6.5 - Math.max(0, (Math.abs(j - 21) - 17) * 1.6);
          if (!hull) continue;
          let c = i === 0 || i === 13 || j === 0 || j === 41 ? 0x2a2a30 : 0x6a5a48;
          if (i >= 2 && i <= 11 && j >= 4 && j <= 37) c = (j % 4 === 0) ? 0x3a3a40 : shade(0x4a4e58, i < 7 ? 1.1 : 0.85); // its roof
          if ((i === 1 || i === 12) && j % 4 === 2) c = 0xff5030; // the lanterns along the eaves
          put(i, j, c);
        }
    });
    const lit = kit.frame(4.67, 14, 2400, (put) => {
      for (let j = 2; j < 40; j += 4) { put(1, j, 0xffb070); put(12, j, 0xffb070); }
    }, true);
    const naka = [[36, 2010], [36, 2930]];
    props.path(naka, [boat], { sp: 3, n: 2, gap: 450, mode: 'pp', hold: 6, turn: 'none', s0: 0.2, d: 0.03 });
    props.path(naka, [lit], { sp: 3, n: 2, gap: 450, mode: 'pp', hold: 6, turn: 'none', s0: 0.2, d: 0.04 });
  }

  // ---- the theatre on the far bank: a tiled roof in the old style over its hall, a row of coloured banners before
  // it, its front lit
  {
    const p = plot('hakataza');
    pave(p.x, p.u, p.w, p.h, 'plaza', 2201);
    house(p.x + 1, p.u + 6, p.w - 2, p.h - 7, { tile: 0x3e4250, wall: 0xd8c8a8, hip: true, face: 4, lantern: true, s: 22011 });
    for (let k = 0; k < 7; k++) mark(p.x + 1 + k * 1.9, p.u + 3, (X, Y) => {
      const c = [0xc8302a, 0xf0ece0, 0x2a3a6a, 0xe8c040, 0x5a8a5a][k % 5];
      R(X, Y - 8, 2, 8, c); // a banner on its pole
      P(X, Y - 9, 0x2a2a30);
    });
    mark(p.x + p.w / 2, p.u + 5, (X, Y) => halo(X, Y, 20, 10, 0xffd890, 0.35));
  }
  // ---- the arcade: its roof lit from inside, lamps under it, its mouths spilling light
  {
    const a = road('kawabata_arcade').pts;
    ctx.along(a, 3.5, (n, x, u, X, Yy) => {
      if (Math.floor(n.along * S) % 9 === 4 && Math.abs(n.side) > 0.6 && Math.abs(n.side) < 2.8 && X % 3 === 0) E(X, Yy, 0xfff0c8);
      return null;
    });
    for (let u = a[0][1] + 6; u < a[1][1]; u += 20) halo(FX(154), FY(u), 12, 20, 0xffe8b0, 0.2);
    for (const u of [a[0][1], a[1][1]]) crowd(151, u - 2, 6, 4, 4);
  }
  // ---- Kushida shrine: the gate, the hall under its copper roof, the great ginkgo, the float on show under its roof
  {
    const k = plot('kushida_jinja');
    pave(k.x, k.u, k.w, k.h, 'gravel', 2202);
    house(k.x + 2, k.u + 10, k.w - 4, k.h - 12, { tile: 0x4a7a6a, wall: VERMILION, hip: true, face: 2.6, lantern: true, s: 22021 });
    torii(k.x + 4, k.x + 10, k.u + 3, 0x9a968c, 3.6);
    toro(k.x + 1.5, k.u + 6, true);
    toro(k.x + k.w - 2, k.u + 6, true);
    tree('broadleaf', 136, 2572, 4.6); // the great ginkgo, bare at winter's end
    // the float: a tall frame on its base, scenery of rocks, waves and castles climbing it, dolls of warriors, a roof
    // over it all; drawn tall, the way the game shows height (z up the strip)
    const f = plot('kazariyama');
    const [CX, CY] = [FX(f.x + f.w / 2), FY(f.u + 2)];
    queue(CY + 2, () => {
      R(CX - 14, CY - 4, 29, 5, 0x3a2a24); // its base
      R(CX - 14, CY - 4, 29, 1, 0x6a4a34);
      for (let z = 0; z < 46; z++) {
        const hw = Math.round(12 - z * 0.12);
        for (let i = -hw; i <= hw; i++) {
          const v = hashPx(i, z, 9);
          let c;
          if (z < 6) c = (i + z) % 4 ? 0x2a4a8a : 0xe8e4f0; // waves in blue and white
          else if (z < 18) c = v < 0.3 ? 0xd8b040 : v < 0.6 ? 0x8a4a2a : 0x5a7a3a; // rocks, pines, gold
          else if (z < 32) c = Math.abs(i) < 4 && z % 7 < 5 ? [0xc8302a, 0xf0ece0, 0x2a2a30, 0xe8c040][(i + z) & 3] : v < 0.5 ? 0x8a6a4a : 0xd8b040; // the dolls
          else c = v < 0.4 ? 0xe8e4dc : 0x6a4a8a; // a castle in the clouds at its top
          E(CX + i, CY - 6 - z, shade(c, i < 0 ? 1.08 : 0.88));
        }
      }
      for (let i = -14; i <= 14; i++) for (let j = 0; j < 5; j++) P(CX + i, CY - 52 - j, shade(0x3e4250, j < 2 ? 1.1 : 0.85)); // the roof over it
      halo(CX, CY - 26, 22, 34, 0xffe0b0, 0.3);
    }, () => shadowBox(CX - 14, CY - 6, 29, 6, 5, 0.66));
  }

  // ---- traffic and people: taxis waiting along Nakasu's street, cars on the bridges, people on the lanes
  for (let k = 0; k < 8; k++) car(85.8, 2060 + k * 9, true, k % 2 ? 0x2a2a30 : 0xe8d8a0);
  for (const id of ['nakasu_ohashi', 'nakasu_dori', 'gion_dori', 'haruyoshi_bashi', 'kawabata_bashi']) {
    const r = road(id);
    trafficOn(r.pts, { sp: 14, gap: 70, s0: rand() });
  }
  for (const id of ['nakasu_1', 'nakasu_2', 'nakasu_3', 'nakasu_4', 'gion_1']) {
    const [[x0, u], [x1]] = road(id).pts;
    crowd(Math.min(x0, x1) + 2, u - 1, Math.abs(x1 - x0) - 4, 2, 9);
  }
  void near;
  void smoke;
  void roof;
  void hi;
  void person;
  void lamp;
}
