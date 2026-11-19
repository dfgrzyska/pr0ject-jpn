// Ohori and Tenjin (u 800-2000, docs/plan-fukuoka.md phase 3), at night. Ohori's pond with its three islands and the
// path across them - stone bridges, the vermilion arched one between the last two islands, the pavilion with its
// roof out on the water - lamps all round the path and their light broken on the water, people walking and running
// round it, swan boats tied up at the boathouse, herons on the islands; the art museum, the Japanese garden with its
// pond, tea house and lanterns. The castle's ruins across the moat: its dry-stone walls at every terrace, the long
// white turret on the wall, the stone base of the keep that never was with people on its top, the old guest house's
// ruins under their roof, the gate, the plum garden in flower among the walls, pines. Then Tenjin: offices and
// department stores lit up along Meiji-dori, Watanabe-dori and Showa-dori, the terraced building stepping down in
// green to the central park with the old prefectural guest house in it, the city hall's square, Kego shrine among
// its camphors, the food stalls on the pavement, the riverside walk; the traffic. No names or signs.
import { PAL, shade } from '../tokyo/kit.mjs';
import { hashPx } from '../hires.mjs';
import { inShape } from '../tokyo/geom.mjs';
import { ROADS, WATER, GROUNDS } from './route.mjs';
import { freeMap } from './free.mjs';
import { umeKit } from './ume.mjs';
import { fukuokaParts } from './parts.mjs';
import { makeParts, VERMILION } from '../kawaguchiko/parts.mjs';

const [U0, U1] = [800, 2000];
const OFFICE = [0xc8ccd0, 0xb8bcc4, 0xd8d4cc, 0xa8b0b8, 0xe0dcd4, 0x9aa4ae];
const road = (id) => ROADS.find((r) => r.id === id);

export function ohori(ctx) {
  const { kit, plot, props, S, pave, W } = ctx;
  const { house, building, mark, ground, rand, pick, P, R, FX, FY, queue, shadowBox, hi, lamp, person, crowd, E, ER, halo, car, trafficOn, tree, glint } = kit;
  const { roof, torii, toro } = makeParts(ctx);
  const ume = umeKit(kit, S);
  const { yatai, ishigaki, lampsAlong } = fukuokaParts(ctx);
  const { boxFree, claim } = freeMap(U0, U1);
  const pond = WATER.find((w) => w.id === 'ohori_ike');
  const islands = GROUNDS.filter((g) => /^shima_/.test(g.id));
  const onPond = (x, u) => inShape(pond, x, u) && !islands.some((g) => inShape(g, x, u));

  // ---- the pond: lamps round its path, their light broken into streaks on the water; trees outside the path
  const ring = road('ohori_ring').pts;
  lampsAlong(ring, 11, -2.6);
  for (let k = 0; k < ring.length - 1; k += 1) {
    const [x, u] = ring[k];
    const [dx, du] = [80 - x, 1140 - u];
    const d = Math.hypot(dx, du) || 1;
    const [gx, gu] = [x + (dx / d) * 6, u + (du / d) * 6];
    if (onPond(gx, gu)) glint(FX(gx), FY(gu), 6 + Math.floor(hashPx(k, 1, 2) * 6), 0xffe0a0, 0.5);
  }
  for (let k = 0; k < ring.length - 1; k++) {
    const [x, u] = ring[k];
    const [dx, du] = [x - 80, u - 1140];
    const d = Math.hypot(dx, du) || 1;
    for (const off of [5, 9]) {
      const [tx, tu] = [x + (dx / d) * off + (hashPx(k, off, 1) - 0.5) * 2, u + (du / d) * off];
      if (tx > 2 && tx < 124 && !onPond(tx, tu) && boxFree(tx - 1, tu - 1, 2, 2)) tree(hashPx(k, off, 3) < 0.35 ? 'pine' : 'broadleaf', tx, tu, 2 + hashPx(k, off, 4) * 1.2);
    }
  }
  // the path across the islands: stone bridges between them, railings either side, the vermilion arched bridge
  // between the second and the third island; lamps on the bridges
  {
    const [bx] = road('ohori_watari').pts[0];
    ground(() => {
      for (let u = 954; u < 1326; u += 1 / S) {
        if (!onPond(bx, u)) continue;
        const arch = u > 1168 && u < 1224;
        const Y = FY(u);
        for (let i = -5; i <= 5; i++) {
          const X = FX(bx) + i;
          if (Math.abs(i) >= 4) P(X, Y, arch ? VERMILION : 0xc8c4b8);
          else P(X, Y, arch ? shade(0x9a7a52, 1.1 - Math.abs((u - 1196) / 28) * 0.2) : 0xa8a49a);
        }
      }
    });
    for (const u of [1010, 1100, 1196, 1290]) if (onPond(bx, u)) mark(bx + 2, u, (X, Y) => lamp(X, Y));
  }
  // the islands: pines and willows, a heron or two; the pavilion out on the last one
  for (const g of islands) {
    const [cx, cu, rx, ru] = g.ell;
    for (let k = 0; k < (rx * ru) / 18; k++) {
      const a = hashPx(k, cu, 1) * Math.PI * 2;
      const d = 0.35 + hashPx(k, cu, 2) * 0.5;
      const [x, u] = [cx + Math.cos(a) * rx * d, cu + Math.sin(a) * ru * d];
      if (Math.abs(x - 80) < 2.5) continue; // (the path)
      tree(hashPx(k, cu, 3) < 0.5 ? 'pine' : 'broadleaf', x, u, 1.6 + hashPx(k, cu, 4));
    }
    mark(cx - rx * 0.7, cu - ru * 0.3, (X, Y) => {
      R(X, Y - 3, 2, 3, 0xe8e8e4); // a heron standing at the edge
      P(X - 1, Y - 3, 0x2a2a30);
    });
  }
  {
    const [cx, cu] = GROUNDS.find((g) => g.id === 'shima_3').ell;
    queue(FY(cu - 4), () => {
      const [X, Y] = [FX(cx + 4), FY(cu + 4)];
      roof(X, Y, 18, 14, 0x4a4e58);
      for (const [px, py] of [[X + 1, Y + 14], [X + 15, Y + 14]]) R(px, py, 2, 4, VERMILION);
      E(X + 8, Y + 15, 0xffe0a0);
      halo(X + 9, Y + 12, 14, 10, 0xffd890, 0.3);
    }, () => shadowBox(FX(cx + 4), FY(cu + 4), 18, 18, 3, 0.66));
  }
  // the boathouse and its swan boats tied up on the water
  {
    const p = plot('boat_house');
    pave(p.x, p.u, p.w, p.h, 'plaza', 1301);
    house(p.x + 1, p.u + 1, p.w - 2, p.h - 3, { tile: 0x5a6070, wall: 0xe0d8c8, face: 2, s: 13011 });
    for (let k = 0; k < 5; k++) mark(43 + (k % 2) * 3.4, p.u + 1 + k * 2.2, (X, Y) => {
      R(X - 2, Y - 2, 5, 4, 0xf4f2ee); // a swan boat: its white body, its neck and red-tipped head
      R(X + 2, Y - 4, 1, 3, 0xf4f2ee);
      P(X + 2, Y - 5, 0xe0402a);
      hi.tint(X - 2, Y + 2, 0.8);
    });
  }
  // the art museum among its trees; the Japanese garden
  {
    const p = plot('bijutsukan');
    pave(p.x, p.u, p.w, p.h, 'plaza', 1302);
    building(p.x + 1, p.u + 3, p.w - 2, p.h - 4, { style: 'brick', face: 4, wall: 0x8a5a42, roof: 0x7a6a5e, s: 13021, tiers: [{ in: [3, 3, 8, 3], face: 2, roof: 0x8a7a6a }] });
    const g = plot('nihon_teien');
    pave(g.x, g.u, g.w, g.h, 'gravel', 1303);
    ground(() => {
      for (let k = 0; k < 80; k++) {
        const [x, u] = [g.x + 1 + hashPx(k, 1, 7) * (g.w - 2), g.u + 1 + hashPx(k, 2, 7) * (g.h - 2)];
        if (inShape(WATER.find((w) => w.id === 'teien_ike'), x, u)) continue;
        P(FX(x), FY(u), 0x3a5a30); // moss
      }
    });
    for (const [x, u] of [[g.x + 6, g.u + 26], [g.x + 26, g.u + 28], [g.x + 4, g.u + 6], [g.x + 28, g.u + 4]]) tree('pine', x, u, 2.4);
    house(g.x + 20, g.u + 14, 9, 7, { tile: 0x6a5a48, wall: 0xd8c8a8, face: 1.8, s: 13031 }); // the tea house
    for (const [x, u] of [[g.x + 12, g.u + 12], [g.x + 31, g.u + 22]]) toro(x, u, true);
    mark(g.x + 18, g.u + 30, (X, Y) => {
      for (let j = 0; j < 8; j++) P(X + (j & 1), Y + j, 0xd8e8f0); // a little fall into the pond
      for (let i = -3; i <= 3; i++) P(X + i, Y + 8, 0x9a958a);
    });
  }

  // ---- the castle's ruins across the moat: the moat's wall, the terraces' walls, the turret, the keep's base, the
  // guest house's ruins, the gate, the plum garden, pines; paths with lamps
  ishigaki(132, 930, 4, 490, 5);
  for (const [u, x0] of [[1040, 136], [1124, 140], [1248, 138], [1330, 136]]) ishigaki(x0, u - 4, 180 - x0, 4, 7 + u);
  // gravel paths on the terraces between the walls
  ground(() => {
    for (const r of ['jo_michi', 'jo_kaidan', 'jo_mon'].map(road)) for (const [x, u] of r.pts) for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) if (i * i + j * j < 30) P(FX(x) + i, FY(u) + j, shade(0xb0a690, 0.92 + hashPx(i, j, 4) * 0.1));
  });
  {
    const p = plot('tamon_yagura');
    house(p.x, p.u, p.w, p.h, { tile: 0x4a4e58, wall: 0xf0ece4, hip: true, face: 2.4, s: 13041 });
    const t = plot('tenshudai');
    ishigaki(t.x, t.u, t.w, 4.6, 13);
    pave(t.x, t.u + 4.6, t.w, t.h - 4.6, 'gravel', 1304);
    mark(t.x, t.u + t.h, (X, Y) => {
      const w = FX(t.x + t.w) - X;
      for (let i = 0; i < w; i += 2) P(X + i, Y, 0x5a5650); // its railing
      E(X + 3, Y + 3, 0xfff0c8);
      halo(X + (w >> 1), Y + 12, w / 2, 12, 0xffe8c0, 0.16);
    });
    crowd(t.x + 3, t.u + 7, t.w - 6, t.h - 10, 7);
    mark(t.x - 1, t.u + 1, (X, Y) => {
      for (let j = 0; j < 14; j++) R(X, Y - j, 4, 1, j % 2 ? 0xb8b4a8 : 0x9a968c); // its stone steps
    });
    const k = plot('korokan');
    pave(k.x, k.u, k.w, k.h, 'gravel', 1305);
    building(k.x + 0.5, k.u + 0.5, k.w - 1, k.h - 1, { style: 'plain', face: 2.6, wall: 0x8a8a86, roof: 0xb8bcc0, s: 13051 });
    const o = plot('otemon');
    house(o.x, o.u, o.w, o.h, { tile: 0x4a4e58, wall: 0xe8e4dc, face: 2.6, hip: true, s: 13061 });
  }
  {
    const [x, u, w, h] = GROUNDS.find((g) => g.id === 'umeen_maizuru').rect;
    const cols = ['white', 'pink', 'red', 'white', 'pink'];
    for (let j = 0; j < 5; j++)
      for (let i = 0; i < 5; i++) {
        const [tx, tu] = [x + 4 + i * 8 + (j % 2) * 3, u + 5 + j * 12.5];
        if (tx > x + w - 2) continue;
        ume(tx, tu, 3 + hashPx(i, j, 1) * 0.8, cols[(i + j * 2) % 5], { old: hashPx(i, j, 2) < 0.25, weeping: hashPx(i, j, 3) < 0.12 });
      }
    for (let k = 0; k < 6; k++) mark(x + 3 + k * 6.5, u + 2, (X, Y) => {
      E(X, Y - 2, 0xfff0c8); // the garden's lanterns lit for the plum evenings
      halo(X, Y - 2, 8, 6, 0xffe0b0, 0.3);
    });
  }
  {
    // pines and bare cherries on the terraces, clear of the walls, the paths, the plots and the plum garden
    const inPlot = (x, u) => ['tamon_yagura', 'tenshudai', 'korokan', 'otemon'].some((id) => {
      const p = plot(id);
      return x > p.x - 2 && x < p.x + p.w + 2 && u > p.u - 2 && u < p.u + p.h + 6;
    });
    const nearPath = (x, u) => ['jo_michi', 'jo_kaidan', 'jo_mon'].some((id) => kit.near?.(road(id).pts, x, u)?.d < 3 || ctx.near(road(id).pts, x, u).d < 3);
    for (let k = 0; k < 150; k++) {
      const [x, u] = [138 + rand() * 41, 940 + rand() * 470];
      if (inPlot(x, u) || nearPath(x, u)) continue;
      if (GROUNDS.some((g) => g.id === 'umeen_maizuru' && inShape(g, x, u + 3))) continue;
      if ([1040, 1124, 1248, 1330].some((wu) => u > wu - 7 && u < wu + 2)) continue;
      const pine = rand() < 0.55;
      tree(pine ? 'pine' : 'broadleaf', x, u, pine ? 2 + rand() * 1.6 : 1.6 + rand());
    }
  }
  for (const id of ['jo_michi', 'jo_kaidan', 'jo_mon']) lampsAlong(road(id).pts, 14, 2);

  // ---- Tenjin: the plots
  {
    const a = plot('acros');
    // the terraced building: its glass front to the street, its back stepping down to the park in green terraces
    building(a.x, a.u, a.w, a.h, {
      style: 'glass', face: 12, wall: 0x9ab0c0, roof: 0x3a5a30, s: 13071,
      tiers: [{ in: [1, 1, 1, 6], face: 3, roof: 0x3a5a2e, style: 'plain', wall: 0x4a6a3a, tiers: [{ in: [1, 1, 1, 6], face: 3, roof: 0x3a5a2e, style: 'plain', wall: 0x4a6a3a, tiers: [{ in: [1, 1, 1, 6], face: 3, roof: 0x42622e }] }] }],
    });
    for (let k = 0; k < 22; k++) mark(a.x + 2 + rand() * (a.w - 4), a.u + 2 + rand() * (a.h - 4), (X, Y) => {
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (i * i + j * j < 2) P(X + i, Y + j, shade(0x3a6a2e, 1 + i * 0.1)); // the trees on its terraces
    }, a.u + a.h);
    const c = plot('shiyakusho');
    building(c.x, c.u + 8, c.w, c.h - 8, { style: 'office', face: 9, wall: 0xc8c4bc, roof: 0x8a8e96, s: 13081 });
    pave(c.x, c.u, c.w, 8, 'plaza', 1308);
    for (let i = 0; i < 4; i++) mark(c.x + 3 + i * 8, c.u + 2, (X, Y) => lamp(X, Y));
    crowd(c.x + 2, c.u + 1, c.w - 4, 6, 6);
    const k = plot('kego_jinja');
    pave(k.x, k.u, k.w, k.h, 'gravel', 1309);
    house(k.x + 6, k.u + 9, 13, 10, { tile: 0x4a7a6a, wall: 0xc8402a, hip: true, face: 2.2, s: 13091 });
    torii(k.x + k.w / 2 - 3, k.x + k.w / 2 + 3, k.u + 2, 0x9a968c, 3.4);
    for (const [x, u] of [[k.x + 3, k.u + 20], [k.x + 21, k.u + 21], [k.x + 21, k.u + 6], [k.x + 3, k.u + 6]]) tree('broadleaf', x, u, 3);
    for (const [x, u] of [[k.x + 8, k.u + 4], [k.x + 16, k.u + 4]]) toro(x, u, true);
    for (const [id, style, face] of [['depato_1', 'depato', 12], ['depato_2', 'glass', 16]]) {
      const d = plot(id);
      building(d.x, d.u, d.w, d.h, { style, face, wall: pick(OFFICE), roof: 0x7a7e86, shop: true, sign: true, s: Math.floor(rand() * 1e6), tiers: [{ in: [3, 3, 3, 3], face: 4, style }] });
    }
    const y = plot('yatai_tenjin');
    for (let k2 = 0; k2 < 3; k2++) yatai(y.x + 4.5 + k2 * 8.5, y.u + 5, { kind: ['ramen', 'oden', 'yakitori'][k2], queue: k2 === 0 ? 3 : 0 });
  }
  // the central park: lawns, paths, the old prefectural guest house - white walls, a blue-grey roof, lit windows
  {
    const [x, u, w, h] = GROUNDS.find((g) => g.id === 'tenjin_koen').rect;
    building(x + 34, u + 10, 18, 14, { style: 'balcony', face: 3, wall: 0xf0ece4, roof: 0x6a7a8a, s: 13101 });
    for (let k = 0; k < 18; k++) {
      const [tx, tu] = [x + 2 + rand() * (w - 4), u + 2 + rand() * (h - 4)];
      if (tx > x + 32 && tx < x + 54 && tu > u + 8) continue;
      tree(rand() < 0.3 ? 'pine' : 'broadleaf', tx, tu, 1.8 + rand());
    }
    for (let k = 0; k < 4; k++) mark(x + 6 + k * 14, u + 4, (X, Y) => lamp(X, Y));
  }
  // the riverside walk: lamps and their light on the river
  lampsAlong(road('kawazoi_t').pts, 12, 2);
  for (let x = 6; x < W; x += 12) glint(FX(x), FY(1946 + x * 0.1), 10, 0xffe0a0, 0.45);

  // ---- what is left: in Tenjin offices and shops lit up (signs without words), by Ohori houses and small blocks
  const avenueTrees = (id, every = 9) => {
    const r = road(id);
    const [[x0, u0], [x1, u1]] = [r.pts[0], r.pts.at(-1)];
    const off = r.w / 2 + 2.6;
    const n = Math.floor(Math.hypot(x1 - x0, u1 - u0) / every);
    for (let k = 1; k < n; k++)
      for (const side of [-1, 1]) {
        const [x, u] = [x0 + ((x1 - x0) * k) / n, u0 + ((u1 - u0) * k) / n];
        const [tx, tu] = x0 === x1 ? [x + side * off, u] : [x, u + side * off];
        if (boxFree(tx - 0.5, tu - 0.5, 1, 1)) tree('broadleaf', tx, tu, 1.3);
      }
  };
  for (const id of ['ohori_dori', 'meiji_dori', 'showa_dori', 'watanabe_dori']) avenueTrees(id);
  for (let u = U0; u < 1930; u += 1)
    for (let x = 0; x < W - 6; x += 1) {
      const city = u > 1440;
      const w = city ? 12 + Math.floor(rand() * 14) : 8 + Math.floor(rand() * 8);
      const h = city ? 12 + Math.floor(rand() * 12) : 8 + Math.floor(rand() * 8);
      if (!boxFree(x, u, w, h)) continue;
      claim(x - 1, u - 1, w + 2, h + 2);
      if (city) {
        const style = pick(['office', 'glass', 'depato', 'neon', 'office', 'granite']);
        building(x + 0.5, u + 0.5, w - 1, h - 1, { style, face: 8 + Math.floor(rand() * 10), wall: pick(OFFICE), roof: pick(PAL.roofs), shop: true, sign: rand() < 0.5, tiers: rand() < 0.4 ? [{ in: [2, 2, 2, 2 + rand() * 3], face: 4, style }] : [] });
      } else if (rand() < 0.55) {
        house(x + 0.5, u + 0.5, w - 1, h - 1, { tile: pick(PAL.tile), s: Math.floor(rand() * 1e6) });
        if (rand() < 0.5) tree(rand() < 0.4 ? 'pine' : 'broadleaf', x + w - 1.5, u + 1.5, 1.5 + rand());
      } else building(x + 0.5, u + 0.5, w - 1, h - 1, { style: 'balcony', face: 5 + Math.floor(rand() * 5), wall: pick([0xd8d0c4, 0xcfc8bc, 0xe0dad0]), roof: pick(PAL.roofs) });
      x += w;
    }

  // ---- people and traffic: walkers and runners round the pond, cars and buses on the avenues, taxis in Tenjin
  const runner = (c) => kit.frame(1, 1.67, 1100, (put) => {
    for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (!(j === 0 && i !== 1)) put(i, j, j === 0 ? 0xe8b890 : j < 3 ? c : 0x2a2a30);
  });
  props.path(ring, [runner(0xd84a3a), runner(0x3a6aa8), runner(0xf0ece0), runner(0x2a2a30)], { sp: 4, n: 4, gap: 70, mode: 'wrap', turn: 'none', s0: 0.1 });
  props.path([...ring].reverse(), [runner(0xe8c040), runner(0x5a8a5a)], { sp: 2.2, n: 2, gap: 120, mode: 'wrap', turn: 'none', s0: 0.6 });
  for (const id of ['ohori_dori', 'meiji_dori', 'showa_dori', 'watanabe_dori', 'tenjin_1']) {
    const r = road(id);
    trafficOn(r.pts, { sp: 18, gap: 90, s0: rand() });
    trafficOn([...r.pts].reverse(), { sp: 16, gap: 110, s0: rand() });
  }
  void person;
  void car;
  void ER;
  void P;
}
