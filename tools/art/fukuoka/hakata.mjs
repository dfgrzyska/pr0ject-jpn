// Sumiyoshi and Gion (u 2990-3800, docs/plan-fukuoka.md phase 4) at dawn: the canal winding between buildings that
// curve along it in terraces of red, violet, green and ochre, a fountain playing in it, bridges over it, early
// people on its terraces (no names, no signs); Sumiyoshi shrine in its wood, its hall straight-gabled in vermilion and
// white; Gion's temples - Tocho-ji's hall of the great wooden Buddha and its vermilion five-storeyed pagoda (drawn
// tall, up the strip), Shofuku-ji behind its gate with a stone bridge over its pond among pines; the old merchants'
// houses; then the blocks to Hakata station. The food stalls going home: little trucks towing them along the avenues.
import { PAL, shade } from '../tokyo/kit.mjs';
import { hashPx } from '../hires.mjs';
import { ROADS } from './route.mjs';
import { freeMap } from './free.mjs';
import { makeParts, VERMILION } from '../kawaguchiko/parts.mjs';

const [U0, U1] = [2990, 3800];
const road = (id) => ROADS.find((r) => r.id === id);
const TERRACE = [0xb8403a, 0x7a4a8a, 0x5a8a5a, 0xc89a40, 0x3a6a9a, 0xd87a4a];

export function hakata(ctx) {
  const { kit, plot, props, S, pave, W } = ctx;
  const { house, building, mark, ground, rand, pick, P, R, FX, FY, queue, shadowBox, hi, lamp, crowd, E, ER, halo, car, trafficOn, tree, glint } = kit;
  const { roof, torii, toro } = makeParts(ctx);
  const { boxFree, claim } = freeMap(U0, U1);

  // ---- the canal: a curve of water through the plot, its banks of pale stone, buildings in arcs either side stepping
  // up in coloured terraces, bridges over it, the fountain playing (frames), people on the terraces
  {
    const p = plot('kyanaru');
    const cxAt = (u) => p.x + p.w / 2 + Math.sin(((u - p.u) / p.h) * Math.PI * 1.4 - 0.4) * (p.w * 0.22);
    ground(() => {
      for (let Y = FY(p.u + p.h); Y < FY(p.u); Y++) {
        const u = ctx.L - Y / S;
        const c = cxAt(u);
        for (let X = FX(p.x); X < FX(p.x + p.w); X++) {
          const d = Math.abs(X / S - c);
          if (d < 3.4) P(X, Y, shade(0x2a6a7a, 1 - d * 0.04 + hashPx(X, Y, 3) * 0.06)); // the water
          else if (d < 4.6) P(X, Y, 0xd8d0c0); // its stone bank
          else if (d < 7.4) P(X, Y, shade(0xc8bca8, 0.94 + hashPx(X >> 1, Y >> 1, 4) * 0.08)); // the walk along it
        }
      }
    });
    // the buildings in arcs: each a run of terraces stepping back from the canal, a colour each
    for (let u = p.u + 2, k = 0; u < p.u + p.h - 14; u += 16 + (k % 3) * 4, k++)
      for (const side of [-1, 1]) {
        const c = cxAt(u + 8);
        const [x0, x1] = side < 0 ? [p.x + 0.5, c - 7.6] : [c + 7.6, p.x + p.w - 0.5];
        if (x1 - x0 < 5) continue;
        const col = TERRACE[(k * 2 + (side > 0 ? 1 : 0)) % TERRACE.length];
        const col2 = TERRACE[(k * 2 + (side > 0 ? 0 : 1) + 3) % TERRACE.length];
        building(x0, u, x1 - x0, 14 + (k % 2) * 3, {
          style: 'plain', face: 4, wall: col, roof: shade(col, 0.8), shop: true, s: 23000 + k * 2 + side,
          tiers: [{ in: side < 0 ? [0, 1, 2.5, 1] : [2.5, 1, 0, 1], face: 3, style: 'balcony', wall: col2, roof: 0x4a7a3a, tiers: [{ in: side < 0 ? [0, 1, 2, 1] : [2, 1, 0, 1], face: 3, style: 'glass', wall: shade(col, 1.15), roof: shade(col2, 0.85) }] }],
        });
        // its terraces' edges: planters along them, the green showing over the parapets
        mark(side < 0 ? x1 - 3 : x0 + 1, u + 2, (X, Y) => {
          for (let j = 0; j < 30; j += 3) { P(X, Y - j, 0x4a8a3a); P(X + 1, Y - j - 1, 0x6aa04a); }
        }, u + 1);
      }
    for (const u of [p.u + 40, p.u + 120, p.u + 190]) mark(cxAt(u) - 4.5, u, (X, Y) => {
      for (let i = 0; i < 27; i++) for (let j = 0; j < 5; j++) P(X + i, Y - j, j === 0 || j === 4 ? 0xe8e4dc : 0xa8a49a); // a bridge over the canal
    });
    const fx = cxAt(p.u + 80);
    const spout = (k) => kit.frame(6, 6, p.u + 80, (put) => {
      for (let a = 0; a < 18; a++) {
        const r = 3 + ((a * 5 + k * 3) % 7);
        put(9 + Math.round(Math.cos(a / 18 * 6.28) * r), 9 + Math.round(Math.sin(a / 18 * 6.28) * r * 0.7), a % 3 ? 0xe8f4f8 : 0xb8dce8);
      }
      for (let j = 0; j < 6; j++) put(9, 9 - j, 0xf4fcff);
    });
    props.loop(fx - 3, p.u + 77, [spout(0), spout(1), spout(2)], { fps: 6, d: 0.05 });
    crowd(p.x + 2, p.u + 60, p.w - 4, 120, 12);
  }

  // ---- Sumiyoshi shrine in its wood: the straight gable of its hall, vermilion with white walls, its torii
  {
    const s = plot('sumiyoshi_jinja');
    pave(s.x, s.u, s.w, s.h, 'gravel', 2301);
    queue(FY(s.u + 4), () => {
      const [X, Y] = [FX(s.x + 5), FY(s.u + s.h - 3)];
      const [w, h] = [FX(s.x + s.w - 5) - X, FY(s.u + 4) - Y];
      roof(X, Y, w, h - 6, 0x6a5a4a, { bark: true });
      for (let i = 0; i < w; i++) for (let j = 0; j < 6; j++) P(X + i, Y + h - 6 + j, i % 6 < 2 ? VERMILION : 0xf0ece4); // its posts and white walls
      R(X + (w >> 1) - 1, Y - 2, 3, h - 6, 0xd8b040); // the ridge's crossed boards (chigi) seen as a gold line
    }, () => shadowBox(FX(s.x + 5), FY(s.u + s.h - 3), FX(s.x + s.w - 5) - FX(s.x + 5), FY(s.u + 4) - FY(s.u + s.h - 3), 3, 0.66));
    torii(s.x + s.w + 2, s.x + s.w + 8, s.u + s.h / 2, VERMILION, 3.6);
    for (let k = 0; k < 26; k++) {
      const [x, u] = [55 + rand() * 40, 3238 + rand() * 100];
      if (x > s.x - 2 && x < s.x + s.w + 2 && u > s.u - 2 && u < s.u + s.h + 2) continue;
      tree(rand() < 0.5 ? 'broadleaf' : 'cedar', x, u, 2 + rand() * 1.4);
    }
  }

  // ---- Tocho-ji: the hall of the great wooden Buddha, and its pagoda - five roofs in vermilion, drawn tall
  {
    const t = plot('tochoji');
    pave(t.x, t.u, t.w, t.h, 'gravel', 2302);
    house(t.x + 2, t.u + 8, t.w - 4, t.h - 10, { tile: 0x4a4e58, wall: VERMILION, hip: true, face: 3.2, s: 23021 });
    const g = plot('tochoji_to');
    const [CX, CY] = [FX(g.x + g.w / 2), FY(g.u + 2)];
    queue(CY + 2, () => {
      for (let k = 0; k < 5; k++) {
        const z = k * 15;
        const hw = 15 - k * 1.6;
        for (let j = -6; j <= 6; j++)
          for (let i = -Math.round(hw); i <= Math.round(hw); i++) {
            const edge = Math.abs(i) >= Math.round(hw) - 1 || Math.abs(j) >= 6;
            P(CX + i, CY - z - 6 + j, edge ? 0x2a2a30 : shade(0x3e4250, (i < 0 ? 1.1 : 0.85) * (j < 0 ? 1.04 : 0.94))); // a roof
          }
        for (let j = 0; j < 7; j++) for (let i = -6 + k; i <= 6 - k; i++) P(CX + i, CY - z + 1 + j - 8, i < 0 ? 0xd84a30 : 0xa83a24); // the vermilion storey under it
      }
      R(CX - 1, CY - 92, 3, 18, 0xc8a040); // the finial's rings
      for (let j = 0; j < 18; j += 3) R(CX - 2, CY - 92 + j, 5, 1, 0xe0c060);
    }, () => shadowBox(CX - 15, CY - 6, 30, 12, 6, 0.62));
  }
  // ---- Shofuku-ji: its gate, a stone bridge over its pond, the hall among the pines
  {
    const s = plot('shofukuji');
    pave(s.x, s.u, s.w, s.h, 'gravel', 2303);
    house(s.x + 6, s.u + 16, s.w - 12, s.h - 18, { tile: 0x4a4e58, wall: 0xd8c8a8, hip: true, face: 2.8, s: 23031 });
    house(s.x + s.w / 2 - 4, s.u, 8, 5, { tile: 0x4a4e58, wall: 0x8a6a4a, hip: false, face: 2, s: 23032 }); // the gate
    ground(() => {
      const [X, Y] = [FX(s.x + 6), FY(s.u + 13)];
      for (let j = 0; j < 14; j++) for (let i = 0; i < 54; i++) if ((i - 27) ** 2 / 729 + (j - 7) ** 2 / 49 < 1) P(X + i, Y + j, shade(0x2a5a5a, 0.95 + hashPx(i, j, 5) * 0.1));
      for (let j = 0; j < 14; j++) for (let i = 24; i < 30; i++) P(X + i, Y + j, j === 0 || j === 13 ? 0x8a867a : 0xb8b4a8); // the stone bridge
    });
    for (const [x, u] of [[s.x + 3, s.u + 6], [s.x + s.w - 3, s.u + 6], [s.x + 3, s.u + s.h - 4], [s.x + s.w - 3, s.u + s.h - 4]]) tree('pine', x, u, 2.8);
    for (let k = 0; k < 18; k++) tree(rand() < 0.6 ? 'pine' : 'broadleaf', 133 + rand() * 46, 3122 + rand() * 76, 1.8 + rand());
  }
  // ---- the merchants' houses: a row of two-storeyed wooden houses under grey tile, lattices on their fronts
  {
    const m = plot('machiya');
    for (let k = 0; k < 5; k++) house(m.x + k * 6.8, m.u + 1, 6.2, m.h - 3, { tile: 0x4e5662, wall: 0x6a4a34, hip: false, face: 2.6, s: 23040 + k });
    mark(m.x, m.u + 1, (X, Y) => {
      for (let i = 0; i < FX(m.x + m.w) - X; i += 2) P(X + i, Y - 2, 0x3a2a20); // the lattice along their fronts
    });
  }

  // ---- the rest: offices, hotels and shops towards the station, houses in Gion's lanes; trees along the avenues
  for (let u = U0; u < U1 - 4; u += 1)
    for (let x = 0; x < W - 4; x += 1) {
      const w = 9 + Math.floor(rand() * 14);
      const h = 9 + Math.floor(rand() * 12);
      if (!boxFree(x, u, w, h)) continue;
      claim(x - 1, u - 1, w + 2, h + 2);
      const old = x > 128 && u < 3420 && rand() < 0.6;
      if (old) house(x + 0.5, u + 0.5, Math.min(w, 10) - 1, Math.min(h, 9) - 1, { tile: pick(PAL.tile), s: Math.floor(rand() * 1e6) });
      else building(x + 0.5, u + 0.5, w - 1, h - 1, { style: pick(['office', 'glass', 'plain', 'balcony', 'granite']), face: 6 + Math.floor(rand() * 9), wall: pick(PAL.walls), roof: pick(PAL.roofs), shop: true, sign: rand() < 0.3 });
      x += w;
    }
  for (const id of ['kokutai_dori', 'ekimae_dori']) {
    const r = road(id);
    const [[x0, u0], [x1, u1]] = [r.pts[0], r.pts.at(-1)];
    const n = Math.floor(Math.hypot(x1 - x0, u1 - u0) / 9);
    for (let k = 1; k < n; k++)
      for (const side of [-1, 1]) {
        const [x, u] = [x0 + ((x1 - x0) * k) / n, u0 + ((u1 - u0) * k) / n];
        const [tx, tu] = x0 === x1 ? [x + side * (r.w / 2 + 2.6), u] : [x, u + side * (r.w / 2 + 2.6)];
        if (boxFree(tx - 0.5, tu - 0.5, 1, 1)) tree('broadleaf', tx, tu, 1.3);
      }
  }

  // ---- morning traffic, and the food stalls going home: a little truck towing a stall, its canopy folded
  for (const id of ['kokutai_dori', 'ekimae_dori', 'hakata_1', 'gion_dori']) {
    const r = road(id);
    trafficOn(r.pts, { sp: 18, gap: 80, s0: rand() });
    trafficOn([...r.pts].reverse(), { sp: 16, gap: 100, s0: rand() });
  }
  const tow = kit.frame(2.67, 10, 3100, (put) => {
    for (let j = 0; j < 30; j++)
      for (let i = 0; i < 8; i++) {
        let c = null;
        if (j < 11) c = j < 4 ? 0x3a4a5a : i === 0 || i === 7 ? 0x2a2a30 : 0xe8e8ec; // the little truck: cab, its glass, its body
        else if (j < 13) c = i === 3 || i === 4 ? 0x2a2a30 : null; // the tow bar
        else c = j === 13 || j === 29 || i === 0 || i === 7 ? 0x5a4a3a : (j - 13) % 4 === 0 ? 0x9a8a6a : 0xc8bca0; // the stall, its canopy folded on it
        if (c !== null) put(i, j, c);
      }
  });
  props.path(road('ekimae_dori').pts, [tow], { sp: 9, n: 2, gap: 260, mode: 'wrap', turn: 'none', s0: 0.3 });
  props.path([...road('kokutai_dori').pts].reverse(), [tow], { sp: 9, n: 1, gap: 200, mode: 'wrap', turn: 'rot', s0: 0.7 });
  void hi;
  void lamp;
  void E;
  void ER;
  void halo;
  void car;
  void glint;
  void toro;
}
