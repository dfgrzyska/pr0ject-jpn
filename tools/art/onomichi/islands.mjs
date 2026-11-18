// The islands and the bridges (u 0-2712, docs/plan-onomichi.md phases 2 and 3): a bright summer afternoon on the
// Shimanami route going golden over the Onomichi strait. Innoshima: the sea lords' castle (rebuilt) on its wooded hill
// behind a palisade, its banners of our own sign; the museum with sea lords' boats drawn up on its lawn; the hassaku
// orchards on their terraces with the monorail and its cart; a boatyard with a hull on its slipway; the fishing
// harbour with its market; farms, houses and gardens between. The suspension bridge over Innoshima's strait: the deck
// and its parapets, the two great towers, the main cables sagging between them with the hangers, the anchorages
// ashore; whirlpools turning in the tidal race under it, a freighter coming through. Mukaishima: the shipyard's dry
// dock with a hull in steel and red primer under the gantry crane, the sheds and stacks of plate; the lemon terraces
// and their monorail; the school with its yard; Iwashiyama's wood with the lookout; the harbour with its octopus
// pots. The twin cable-stayed bridges over the Onomichi strait, their towers and fans of stays. Nothing of any
// shipyard's or company's name.
import { PAL, shade } from '../tokyo/kit.mjs';
import { hashPx } from '../hires.mjs';
import { W, ROADS, RAILS, isSea, STRAIT } from './route.mjs';
import { freeMap } from './senkoji.mjs';
import { makeParts } from '../kawaguchiko/parts.mjs';

const TILES = [0x6a7078, 0x5e646e, 0x747a82, 0x4e5662, 0x7a5a48, 0x8a4a32];
const STUCCO = [0xe4dccc, 0xd8cfc0, 0xcfc6b6, 0xb8a890, 0xe8e2d4];

export function islands(ctx) {
  const { kit, plot, props, S, pave, L } = ctx;
  const { house, building, tree, mark, ground, rand, pick, P, R, FX, FY, queue, shadowBox, hi, person, crowd, car, E, ER, halo, smoke } = kit;
  const { roof, nobori, bikes } = makeParts(ctx);
  const { taken, boxFree, claim } = freeMap(0, 2890);

  // ---- the orchards: rows of round dark crowns along the terraces, green fruit in them, the monorail's cart
  const orchard = (id, seed) => {
    const [ox, ou, ow, oh] = ctx.ground(id).rect;
    for (let u = ou + 2; u < ou + oh - 2; u += 4)
      for (let x = ox + 2 + ((u / 4) % 2) * 1.6; x < ox + ow - 1.5; x += 3.4) {
        if (Math.abs(x - 150) < 2.6) continue; // (the monorail's line)
        tree('tiny', x, u, 1.3 + hashPx(Math.round(x * 3), Math.round(u), seed) * 0.4);
        if (hashPx(Math.round(x), Math.round(u), seed + 1) < 0.5) mark(x, u, (X, Y) => P(X + 1, Y - 1, 0xc8d050));
      }
  };
  orchard('hassaku_en', 601);
  orchard('mikan_en', 602);
  for (const r of RAILS.filter((q) => q.style === 'mono')) {
    const [[x0, u0], [, u1]] = r.pts;
    const cart = kit.frame(2, 3, 800, (put) => {
      for (let j = 0; j < 9; j++) for (let i = 0; i < 6; i++) put(i, j, j < 2 ? 0x3a3a40 : (i + j) % 3 === 0 ? 0xe0c040 : 0x8a6a48); // a cart of fruit boxes
    });
    props.path([[x0, u0 + 4], [x0, u1 - 4]], [cart], { sp: 2, n: 1, mode: 'pp', hold: 9, turn: 'none', s0: rand(), d: 0.02 });
  }
  for (const id of ['monorail_i_shita', 'monorail_i_ue', 'monorail_m_shita', 'monorail_m_ue']) {
    const p = plot(id);
    pave(p.x, p.u, p.w, p.h, 'plaza', 603);
    mark(p.x + 1, p.u + p.h - 1, (X, Y) => {
      R(X, Y - 2, FX(p.w - 2) - FX(0), FX(p.h - 2) - FX(0) - 2, 0x8a7a64);
      for (let k = 0; k < 4; k++) R(X + 2 + k * 5, Y + 2, 4, 3, 0xd8b048); // crates
    });
  }

  // ---- Innoshima: the castle on its hill, the museum, the boatyard, the harbour
  {
    const [hx, hu, hw, hh] = ctx.ground('shiro_yama').rect;
    const c = plot('suigun_jo');
    const keep = [[c.x - 4, c.u - 4, c.w + 8, c.h + 8], [24, 460, 16, 100]];
    for (let n = 0; n < 260; n++) {
      const [x, u] = [hx + 1 + rand() * (hw - 2), hu + 2 + rand() * (hh - 4)];
      if (keep.some(([kx, ku, kw, kh]) => x > kx && x < kx + kw && u > ku && u < ku + kh)) continue;
      tree(rand() < 0.6 ? 'pine' : 'broadleaf', x, u, 2 + rand() * 1.8);
    }
    // the castle: its base of rough stone, the palisade round the top, the keep of white plaster and dark boards
    // under two roofs, banners along the palisade
    pave(c.x - 3, c.u - 3, c.w + 6, c.h + 6, 'gravel', 604);
    ground(() => {
      for (let Y = FY(c.u + c.h + 2); Y < FY(c.u - 2); Y++)
        for (let X = FX(c.x - 2); X < FX(c.x + c.w + 2); X++) {
          const edge = Math.min(X - FX(c.x - 2), FX(c.x + c.w + 2) - X, Y - FY(c.u + c.h + 2), FY(c.u - 2) - Y);
          if (edge < 4) P(X, Y, (X + (Y >> 2) * 3) % 6 === 0 || Y % 4 === 0 ? 0x5a564e : shade(0x9a968c, 0.9 + hashPx(X >> 1, Y >> 1, 605) * 0.2));
          else if (edge < 6) P(X, Y, (X + Y) % 3 ? 0x6a4a2a : 0x4a3220); // the palisade
        }
    });
    building(c.x + 8, c.u + 6, c.w - 16, c.h - 12, { style: 'plain', face: 6, wall: 0xf0ece4, roof: 0x4e5662, s: 6041, tiers: [{ in: [4, 4, 4, 4], face: 4, style: 'plain', wall: 0x3a3634 }] });
    for (let k = 0; k < 6; k++) nobori(c.x - 1 + (k % 2) * (c.w + 2), c.u + 4 + Math.floor(k / 2) * 12, [0x2a4a8a, 0xf0ece4, 0x2a4a8a][k % 3]);
    const m = plot('suigun_kan');
    pave(m.x, m.u, m.w, m.h, 'park', 606);
    building(m.x + 1, m.u + 10, m.w - 2, m.h - 11, { style: 'plain', face: 3, wall: 0xe8e2d4, roof: 0x5c626c, s: 6061 });
    // the sea lords' boats drawn up on the lawn: a long kobaya with its oars, a sekibune with its box of planking
    const boat = (x, u, len, wide, box) =>
      mark(x, u, (X, Y) => {
        const [l, w] = [FX(len) - FX(0), FX(wide) - FX(0)];
        for (let i = 0; i < l; i++) {
          const half = Math.round((w / 2) * Math.sin(((i + 0.5) / l) * Math.PI) ** 0.5);
          for (let j = -half; j <= half; j++) P(X + i, Y + j, Math.abs(j) === half ? 0x3a2a20 : box && i > l * 0.25 && i < l * 0.75 && Math.abs(j) < half - 1 ? 0x8a6a48 : 0xa8885e);
          if (i % 4 === 0 && i > 3 && i < l - 3) {
            P(X + i, Y - half - 1, 0x6a4a30);
            P(X + i, Y + half + 1, 0x6a4a30);
          }
        }
        for (let k = 1; k <= 4; k++) for (let i = 0; i < l; i++) hi.tint(X + i + k, Y + Math.round(w / 2) + k, 0.85);
      });
    boat(m.x + 2, m.u + 4, 14, 3, false);
    boat(m.x + 18, m.u + 5, 15, 4.4, true);
    crowd(m.x + 2, m.u + 1, m.w - 4, 2, 5);
    const z = plot('innoshima_zosen');
    pave(z.x, z.u, z.w, z.h, 'yard', 607);
    // the slipway down to the strait, a fishing boat's hull on it in its cradle, a crane, a shed
    ground(() => {
      for (let Y = FY(z.u + z.h - 6); Y < FY(z.u); Y++) for (let X = FX(z.x + 14); X < FX(z.x + 30); X++) P(X, Y, (Y + X) % 5 === 0 ? 0x6a665e : 0x8a867e);
    });
    mark(z.x + 22, z.u + 30, (X, Y) => {
      for (let j = -36; j <= 0; j++) {
        const half = Math.round(9 * Math.sin(((j + 37) / 38) * Math.PI) ** 0.55);
        for (let i = -half; i <= half; i++) P(X + i, Y + j, Math.abs(i) === half ? 0x2a2a30 : j < -26 ? 0xe8e4dc : i < -half + 2 ? 0xb83a2a : 0x3a6a9a);
      }
      R(X - 4, Y - 20, 8, 8, 0xe8e4dc);
      R(X - 3, Y - 19, 6, 3, 0x2c3a4c);
      for (let k = 1; k <= 8; k++) for (let j = -36; j <= 0; j++) hi.tint(X + 9 + k, Y + j + k, 0.8);
    });
    building(z.x + 1, z.u + z.h - 18, 12, 16, { style: 'plain', face: 4, wall: 0x7a8a9a, roof: 0x4a6a8a, s: 6071 });
    smoke(z.x + 20, z.u + 10, { rate: 0.4, a: 0.25 });
    const g = plot('gyoko_ichiba');
    building(g.x + 1, g.u + 4, g.w - 2, g.h - 5, { style: 'plain', face: 3, wall: 0xd8dce0, roof: 0x5a7a9a, s: 6081 });
    mark(g.x + 1, g.u + 2, (X, Y) => {
      for (let k = 0; k < 8; k++) R(X + k * 4, Y - 2, 3, 2, k % 3 ? 0x3a7ac8 : 0xe8e4dc); // fish boxes
      for (let i = 0; i < 20; i++) P(X + 34 + (i % 6), Y - 1 - Math.floor(i / 6), 0x2a6a5a); // nets
    });
    crowd(g.x, g.u, g.w, 3, 5);
  }

  // ---- the fishing boats tied up at the harbours' piers, the ferry pontoons
  const moored = (x, u, c = pick([0xf0ece4, 0xe8e4d8, 0x3a6aa8, 0xd8dce0])) =>
    mark(x, u, (X, Y) => {
      for (let j = -12; j <= 0; j++) {
        const half = Math.round(4 * Math.sin(((j + 13) / 14) * Math.PI) ** 0.6);
        for (let i = -half; i <= half; i++) P(X + i, Y + j, Math.abs(i) === half ? 0x4a4a50 : j > -8 && j < -3 && Math.abs(i) < 2 ? 0x7a6a5a : c);
      }
      R(X - 1, Y - 6, 3, 3, 0x3a3a40);
    });
  for (const u of [796, 812, 828]) {
    moored(146.4, u);
    moored(155.8, u + 4);
  }

  // ---- Mukaishima: the shipyard, the school, the shops, the inn, Iwashiyama, the harbour
  {
    const d = plot('dock');
    // the dry dock: a basin of concrete stepped down to its floor, a ship's hull filling it in steel and red primer,
    // blocks of its decks set on it, scaffolding along its side; the gantry crane on its rails astride the dock
    ground(() => {
      for (let Y = FY(d.u + d.h); Y < FY(d.u); Y++)
        for (let X = FX(d.x); X < FX(d.x + d.w); X++) {
          const e = Math.min(X - FX(d.x), FX(d.x + d.w) - 1 - X, Y - FY(d.u + d.h));
          P(X, Y, e < 2 ? 0xc0bcb4 : e < 6 ? (e % 2 ? 0x8a867e : 0x9a968e) : 0x5a5a58);
        }
    });
    mark(d.x + d.w / 2, d.u + 6, (X, Y) => {
      const len = FY(d.u + 6) - FY(d.u + d.h - 6);
      for (let j = 0; j < len; j++) {
        const half = Math.round(16 * Math.min(1, Math.sin(((j + 1) / len) * Math.PI) * 1.8));
        for (let i = -half; i <= half; i++) {
          let c = Math.abs(i) === half ? 0x2a2a30 : (j % 18 < 1 || Math.abs(i) % 12 === 0) ? 0x6a6e76 : 0x8a8e96; // the deck's plating
          if (Math.abs(i) >= half - 2) c = 0xb03a2a; // red primer along its sides
          P(X + i, Y - len + j, c);
        }
      }
      for (const [bj, bw, bh] of [[30, 20, 16], [70, 24, 22], [140, 18, 14]]) {
        R(X - (bw >> 1), Y - len + bj, bw, bh, 0xa8acb4); // deck blocks waiting to be welded on
        R(X - (bw >> 1), Y - len + bj, bw, 1, 0xd0d4d8);
      }
      for (let j = 6; j < len - 6; j += 3) P(X + 19, Y - len + j, 0x8a7a54); // scaffolding
      for (let k = 0; k < 6; k++) {
        const [i, j] = [Math.round((hashPx(k, X, 611) - 0.5) * 24), Math.round(hashPx(k, Y, 612) * (len - 20)) + 10];
        E(X + i, Y - len + j, 0xd8f0ff); // a welder's spark
        halo(X + i, Y - len + j, 5, 5, 0xa0d0ff, 0.35);
      }
    });
    const crane = kit.frame(48, 8, 1500, (put) => {
      // the gantry: its girder across the dock (in its colours), the trolley and the cab, the legs at each end
      for (let i = 0; i < 144; i++)
        for (let j = 0; j < 24; j++) {
          let c = null;
          if (j >= 8 && j < 16) c = j === 8 || j === 15 ? 0x6a3a2a : (i + j) % 6 === 0 ? 0xd8a020 : 0xe8b030;
          if ((i < 6 || i > 137) && (j < 4 || j > 19 || (j >= 8 && j < 16))) c = 0xd09020;
          if (i >= 60 && i < 76 && j >= 6 && j < 18) c = j === 6 ? 0xe8e8ec : 0x8a8e96; // the trolley
          if (c !== null) put(i, j, c);
        }
    });
    props.path([[d.x + d.w / 2, d.u + 30], [d.x + d.w / 2, d.u + d.h - 30]], [crane], { sp: 1.5, n: 1, mode: 'pp', hold: 14, turn: 'none', s0: 0.3, d: 0.25 });
    const k = plot('zosen_koba');
    building(k.x, k.u + 2, k.w, k.h - 2, { style: 'plain', face: 6, wall: 0x7a8a9a, roof: 0x3a6a9a, s: 6111 });
    mark(52, 1426, (X, Y) => {
      for (let q = 0; q < 5; q++) R(X + q * 9, Y - 6, 8, 5, 0x6a6e76); // stacks of plate
      for (let q = 0; q < 5; q++) R(X + q * 9, Y - 6, 8, 1, 0x9a9ea6);
    });
    const s = plot('gakko');
    pave(s.x, s.u, s.w, s.h, 'plaza', 613);
    building(s.x, s.u + 18, s.w, s.h - 18, { style: 'balcony', face: 7, wall: 0xf0ece4, roof: 0x8a8680, s: 6131 });
    building(s.x + 2, s.u + 1, 20, 14, { style: 'plain', face: 4, wall: 0xe8e2d4, roof: 0x8a8680, s: 6132, top: ({ X, Y, w, h }) => {
      for (let j = 1; j < h - 1; j++) for (let i = 1; i < w - 1; i++) P(X + i, Y + j, j % 5 === 0 ? 0xf0f4f8 : 0x3a9ad8); // the pool on the gym's roof
    } });
    const yard = ctx.ground('kotei').rect;
    ground(() => {
      const [cx, cy] = [FX(yard[0] + yard[2] / 2), FY(yard[1] + yard[3] / 2)];
      for (let a = 0; a < 720; a++) P(cx + Math.round(Math.cos((a / 720) * Math.PI * 2) * 48), cy + Math.round(Math.sin((a / 720) * Math.PI * 2) * 36), 0xf4f0e8); // the running track
    });
    crowd(yard[0] + 4, yard[1] + 4, yard[2] - 8, yard[3] - 8, 12);
    const r = plot('mukai_ryokan');
    pave(r.x, r.u, r.w, r.h, 'park', 614);
    house(r.x + 2, r.u + 8, r.w - 4, r.h - 9, { tile: 0x4e5662, hip: true, wall: 0xe8e2d4, face: 2.4, s: 6141 });
    mark(r.x + 3, r.u + 3, (X, Y) => bikes(X, Y - 5, 8));
    const sh = plot('mukai_shoten');
    for (let q = 0; q < 3; q++) building(sh.x + q * 13.4, sh.u + 1, 12.6, sh.h - 2, { style: 'plain', face: 3, shop: true, wall: pick(STUCCO), roof: pick([0x8a8680, 0x4a6a8a]) });
    const iw = ctx.ground('iwashiyama').rect;
    const t = plot('iwashiyama_tenbo');
    for (let n = 0; n < 220; n++) {
      const [x, u] = [iw[0] + 1 + rand() * (iw[2] - 2), iw[1] + 2 + rand() * (iw[3] - 4)];
      if (x > t.x - 3 && x < t.x + t.w + 3 && u > t.u - 3 && u < t.u + t.h + 3) continue;
      if (Math.abs(x - 68) < 2.2) continue; // (the path up)
      tree(rand() < 0.55 ? 'pine' : 'broadleaf', x, u, 2 + rand() * 1.8);
    }
    pave(t.x, t.u, t.w, t.h, 'gravel', 615);
    mark(t.x + 2, t.u + t.h - 2, (X, Y) => R(X, Y, FX(t.w - 4) - FX(0), 1, 0x4a3a2a));
    for (let q = 0; q < 6; q++) mark(t.x + 3 + q * 3.2, t.u + t.h - 3, (X, Y) => person(X, Y, 6150 + q));
    const tk = plot('takotsubo');
    mark(tk.x, tk.u + tk.h, (X, Y) => {
      for (let j = 2; j < FX(tk.h) - FX(0); j += 4)
        for (let i = 1; i < FX(tk.w) - FX(0); i += 4) {
          P(X + i, Y + j, 0x6a3a22);
          P(X + i + 1, Y + j, 0x9a5a34);
          P(X + i, Y + j + 1, 0x8a4a2a);
          P(X + i + 1, Y + j + 1, 0x2a1a14); // a pot's mouth
        }
    });
    for (const u of [2366, 2380]) moored(72, u);
  }

  // ---- the houses, farms and gardens on both islands, wherever nothing else stands
  const lot = (x, u, w, h) => {
    const v = rand();
    if (v < 0.5) house(x, u, w - 0.8, h - 0.8, { tile: pick(TILES), hip: rand() < 0.6, wall: pick(STUCCO), face: 2 });
    else if (v < 0.62) building(x, u, w - 0.8, h - 0.8, { style: 'plain', face: 3, wall: pick(STUCCO), roof: pick([0x8a8680, 0x4a6a8a, 0x8a4a32]) });
    else if (v < 0.84) {
      // a vegetable plot: rows of green on dark earth, a scarecrow, a stand of tomatoes or eggplant on canes
      ground(() => {
        for (let Y = FY(u + h - 0.6); Y < FY(u + 0.4); Y++) for (let X = FX(x + 0.4); X < FX(x + w - 0.6); X++) P(X, Y, X % 4 < 2 ? (hashPx(X, Y, 621) < 0.7 ? 0x4e7a32 : 0x6a9a3a) : 0x5a4a34);
      });
    } else for (let q = 0; q < 3; q++) tree(rand() < 0.4 ? 'pine' : 'broadleaf', x + 1 + rand() * (w - 2), u + 1 + rand() * (h - 2), 1.6 + rand() * 1.4);
    claim(x, u, w, h);
  };
  // (and on Ozaki's side of the strait round the bridges' landings, up to where the hillside's terraces begin; the
  // town along the coast road there is the hillside's, senkoji.mjs)
  for (let u = 2; u < 2884; u += 1)
    for (let x = 0; x < W - 4; x += 1) {
      if (taken(x, u) || isSea(x, u) || (u > 2700 && x < 95)) continue;
      const [w, h] = [6 + Math.floor(rand() * 5), 6 + Math.floor(rand() * 4)];
      if (boxFree(x, u, w, Math.min(h, 2884 - u))) {
        lot(x, u, w, h);
        x += w - 1;
      } else if (boxFree(x, u, 4, 4)) {
        tree(rand() < 0.5 ? 'pine' : 'broadleaf', x + 2, u + 2, 1.4 + rand());
        claim(x, u, 4, 4);
        x += 3;
      }
    }

  // ---- the Innoshima bridge: its towers, the main cables sagging from tower to tower and down to the anchorages,
  // the hangers; the anchorages ashore
  {
    const b = ROADS.find((r) => r.id === 'innoshima_ohashi');
    const [x, [u0, u1]] = [b.pts[0][0], [b.pts[0][1], b.pts[1][1]]];
    const TOWERS = [900, 1300];
    const H = 46; // (how far up the strip a tower's top is drawn: it stands that tall)
    const lift = (u) => {
      // the cable's height over the deck: up at the towers, sagging between them, down to the anchorages at the ends
      if (u < TOWERS[0]) return H * Math.max(0, (u - u0) / (TOWERS[0] - u0)) ** 1.2;
      if (u > TOWERS[1]) return H * Math.max(0, (u1 - u) / (u1 - TOWERS[1])) ** 1.2;
      const t = (u - TOWERS[0]) / (TOWERS[1] - TOWERS[0]);
      return H * (0.12 + 0.88 * (2 * t - 1) ** 2);
    };
    for (const u of [u0, u1])
      mark(x, u + (u === u0 ? -2 : 4), (X, Y) => {
        R(X - 24, Y - 12, 48, 14, 0xb8b4ac);
        R(X - 24, Y - 12, 48, 2, 0xd8d4cc);
        for (let k = 1; k <= 6; k++) R(X + 24 + k - 1, Y - 12 + k, 1, 14, 0x6a665e);
      });
    for (const side of [-1, 1]) {
      // each main cable runs just outside the deck's edge, two pixels thick, lit on its top; the hangers drop from it
      // to the deck's edge (seen from above: short ticks across)
      mark(x + side * 6.4, u1, (X, Y) => {
        let prev = null;
        for (let u = u1; u >= u0; u -= 1 / S) {
          const Yc = FY(u) - Math.round(lift(u) * 0.35);
          if (prev !== null)
            for (let yy = Math.min(prev, Yc); yy <= Math.max(prev, Yc); yy++) {
              P(X, yy, 0xf4f4f8);
              P(X + side, yy, 0x9a9ea8);
            }
          prev = Yc;
          if (Math.round(u * S) % 6 === 0) for (let i = 1; i <= 3; i++) P(X - side * i, Yc, 0xc8ccd4);
        }
      }, u0 - 4);
    }
    for (const u of TOWERS)
      mark(x, u, (X, Y) => {
        // two legs of a tower leaning up the strip from the deck, braced, the saddles for the cables on top
        for (const dx of [-22, 17]) {
          for (let j = 0; j < H + 4; j++) for (let i = 0; i < 6; i++) P(X + dx + i, Y - j, i === 0 ? 0xffffff : i === 5 ? 0x6a6e78 : i < 3 ? 0xe0e4ea : 0xb0b4bc);
          for (let k = 1; k <= 14; k++) for (let j = 0; j < 4; j++) hi.tint(X + dx + 4 + k, Y - j + k, 0.8);
        }
        for (const j of [8, 24, H]) {
          R(X - 22, Y - j - 2, 45, 4, 0xc8ccd4);
          R(X - 22, Y - j - 2, 45, 1, 0xf0f0f4);
        }
        R(X - 23, Y - H - 6, 47, 3, 0x4a4e58); // the saddles' housings
      }, u - 1);
    // the freighter coming through the strait, the whirlpools turning in the tidal race
    const ship = kit.frame(46, 10, 1100, (put) => {
      for (let i = 0; i < 138; i++)
        for (let j = 0; j < 30; j++) {
          const end = Math.min(i, 137 - i);
          if (i < 12 && (j < 12 - i || j > 17 + i)) continue;
          if (i > 125 && (j < 1 || j > 28)) continue;
          let c = j === 0 || j === 29 ? 0x2a2a30 : j < 3 || j > 26 ? 0xb03a2a : (i % 24 < 20 && i > 20 && i < 110) ? (j % 9 === 0 ? 0x2a4a6a : 0x3a6a9a) : 0x6a6e76; // red hull, blue hatches
          if (i > 112 && i < 132 && j > 4 && j < 25) c = j % 4 === 0 ? 0x2c3a4c : 0xe8e8ec; // the bridge house
          if (end === 0) c = 0x2a2a30;
          put(i, j, c);
        }
    });
    props.path([[-30, 1120], [W + 30, 1160]], [ship], { sp: 4, n: 1, mode: 'wrap', turn: 'none', s0: 0.4, d: 0.02 });
    const whirl = [0, 1, 2, 3].map((k) =>
      kit.frame(12, 12, 1100, (put) => {
        for (let j = 0; j < 36; j++)
          for (let i = 0; i < 36; i++) {
            const [dx, dy] = [i - 17.5, j - 17.5];
            const r = Math.hypot(dx, dy);
            if (r > 17) continue;
            const a = Math.atan2(dy, dx) + (k * Math.PI) / 8 + r * 0.32;
            if (Math.sin(a * 3) > 0.7) put(i, j, r < 5 ? 0x1a4a5a : 0xd8eef0, r < 5 ? 0.5 : 0.35 + (1 - r / 17) * 0.4);
          }
      }),
    );
    for (const [wx, wu] of [[40, 960], [150, 1220], [72, 1330]]) {
      if (!isSea(wx, wu) || wu < STRAIT.south(wx) + 10) continue;
      props.loop(wx, wu, whirl, { fps: 5, d: 0.01 });
    }
  }

  // ---- the twin bridges over the Onomichi strait: each with its two towers and the fans of stays to the deck
  for (const id of ['onomichi_ohashi', 'shin_onomichi_ohashi']) {
    const b = ROADS.find((r) => r.id === id);
    const x = b.pts[0][0];
    for (const u of [2470, 2600])
      mark(x, u, (X, Y) => {
        const Ht = 34;
        const half = Math.round((b.w / 2 + 0.7) * S);
        // an H of two legs either side of the deck, a beam under the deck and one at the top
        for (const dx of [-half - 2, half - 1])
          for (let j = 0; j < Ht; j++) for (let i = 0; i < 4; i++) P(X + dx + i, Y - j, i === 0 ? 0xffffff : i === 3 ? 0x6a6e78 : 0xd0d4da);
        R(X - half - 2, Y - Ht - 2, 2 * half + 5, 3, 0xc8ccd4);
        // the stays fanning from each leg's top down to the deck's edge, up and down the strip
        for (const dx of [-half, half])
          for (let s = -1; s <= 1; s += 2)
            for (let k = 1; k <= 6; k++) {
              const reach = k * 11;
              for (let q = 0; q <= reach; q++) P(X + dx, Y - Ht + Math.round((q / reach) * Ht) + s * q, q % 3 === 2 ? 0x9aa0a8 : 0xe8ecf0);
            }
      }, u - 1);
  }

  // ---- the expressway's traffic, the cyclists on the cycle route
  {
    const exp = ['shimanami_s', 'innoshima_ohashi', 'shimanami_m', 'shin_onomichi_ohashi', 'shimanami_n'].flatMap((id, k) => {
      const pts = ROADS.find((r) => r.id === id).pts;
      return k ? pts.slice(1) : pts;
    });
    kit.trafficOn(kit.offset(exp, 2.4), { sp: 26, gap: 150, s0: 0.1, u: 1400, d: 0.08 });
    kit.trafficOn(kit.offset([...exp].reverse(), 2.4), { sp: 26, gap: 150, s0: 0.6, u: 1400, d: 0.08 });
    const cyc = ['cycle_i', 'cycle_m', 'cycle_m2', 'cycle_m3'].flatMap((id) => ROADS.find((r) => r.id === id).pts);
    const rider = (c) =>
      kit.frame(1.34, 2.34, 1000, (put) => {
        for (let j = 0; j < 7; j++) put(2, j, 0x2a2a30);
        put(1, 2, c);
        put(2, 2, c);
        put(3, 2, c);
        put(2, 3, c);
        put(2, 1, 0xf0c8a0);
      });
    props.path(cyc, [rider(0x3a8ae0), rider(0xd84a3a), rider(0xe8c040), rider(0x2a2a30)], { sp: 7, n: 4, gap: 60, mode: 'wrap', turn: 'rot', s0: 0.2 });
    kit.trafficOn(kit.offset(ROADS.find((r) => r.id === 'kokudo_317').pts.concat(ROADS.find((r) => r.id === 'onomichi_ohashi').pts.slice(1), ROADS.find((r) => r.id === 'kokudo_2').pts.slice(1)), 2), { sp: 18, gap: 120, s0: 0.3, u: 2400 });
  }
  void car;
  void roof;
  void ER;
  void queue;
  void shadowBox;
  void L;
  void PAL;
}
