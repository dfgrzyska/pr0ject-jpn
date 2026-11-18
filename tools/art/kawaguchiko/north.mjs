// The north shore (u 3900-6748, docs/plan-kawaguchiko.md phase 7), at sunset in late autumn. Kawaguchi, the old
// village of the Fuji pilgrims' lodgings: the oshi houses along its street behind stone walls, their gates, banners
// and gardens, curtains of persimmons drying under the eaves, a persimmon orchard, a thatched farmhouse, cut rice
// fields with the sheaves hung on their racks and straw stacks, a farmyard, bonfires of leaves smoking, the stone jizo
// in red bibs; the Asama shrine in its wood with the seven great cedars roped round, its torii, stage and halls. Then
// the maple corridor along the stream: red and orange maples over the path, lanterns strung along it coming on, the
// autumn fair's stalls, a tea house, little vermilion bridges, crowds; an inn, a guest house, a gallery with a stone
// garden; the terrace over the water, the promenade, and on the quay the photographers lined up with their tripods,
// waiting for Fuji to turn pink. (The panorama over the water: view.mjs.)
import { PAL, shade } from '../tokyo/kit.mjs';
import { lots } from '../tokyo/blocks.mjs';
import { makeParts, VERMILION, GOLD, CEDAR_BARK } from './parts.mjs';
import { WATER } from './route.mjs';

const STREAM = WATER.find((w) => w.id === 'nashi_gawa').chain;
const PERSIMMON = [0xf08a24, 0xe0661c, 0xc8501a];

export function north(ctx) {
  const { kit, props, S, plot, pave, blocks, ROADS, near } = ctx;
  const { tree, crowd, mark, rand, pick, P, R, FX, FY, queue, shadowBox, house, building, ground, hi, lantern } = kit;
  const { roof, torii, toro, pole, wires, nobori } = makeParts(ctx);
  const road = (id) => ROADS.find((r) => r.id === id).pts;
  const walk = road('momiji_michi');

  // ---------------------------------------------------------------- pieces of the village
  /** Persimmons drying: strings of fruit hung in a row under an eave, the fine box from (X, Y) w wide. */
  const hoshigaki = (X, Y, w, n = 5) => {
    for (let i = 0; i < w; i += 2)
      for (let j = 0; j < n; j++) P(X + i, Y + j, j === 0 ? 0x6a5030 : PERSIMMON[(i + j) % 3]);
    for (let i = 0; i < w; i++) hi.tint(X + i + 1, Y + n, 0.8);
  };
  /** A stone wall round the box (x, u, w, h), the gate gap at side 'e' or 'w' (towards the street). */
  const stoneWall = (x, u, w, h, gate) =>
    mark(x, u, (X, Y) => {
      const [ww, hh] = [FX(x + w) - X, Y - FY(u + h)];
      const gy = Math.round(hh / 2);
      const st = (X, Y, k) => {
        P(X, Y, k % 4 === 0 ? 0x6a665c : k % 3 ? 0xa8a296 : 0x948e82);
        hi.tint(X + 1, Y + 1, 0.72);
      };
      for (let i = 0; i < ww; i++) for (const y of [0, 1, -hh, -hh + 1]) st(X + i, Y + y - (y > 0 ? 2 : 0), i + y);
      for (let j = 0; j <= hh; j++) {
        const inGate = Math.abs(j - gy) < 6;
        for (const d of [0, 1]) {
          if (!(gate === 'w' && inGate)) st(X + d, Y - j, j + d);
          if (!(gate === 'e' && inGate)) st(X + ww - 1 - d, Y - j, j + d);
        }
      }
    }, u);
  /** A thatched roof on the fine box: deep straw, combed, its ridge capped dark, moss on the north slope. */
  const thatch = (X0, Y0, w, h) => {
    roof(X0, Y0, w, h, 0x9a8458, { ink: true });
    for (let j = 1; j < h - 1; j++)
      for (let i = 1; i < w - 1; i++) {
        if ((i * 3 + j * 7) % 5 === 0) P(X0 + i, Y0 + j, 0x7a6640);
        if (j < h / 3 && (i + j * 3) % 7 === 0) P(X0 + i, Y0 + j, 0x5a6a3a); // moss
      }
    R(X0 + 3, Y0 + (h >> 1) - 1, w - 6, 3, 0x3a3228);
  };
  /** A pilgrims' lodging (oshi): the main house at the back under a great tiled roof, the gatehouse on the street,
   * a garden with a pine, a lantern and a persimmon tree, the banners at the gate, persimmons drying. */
  const oshi = (id, side, s) => {
    const p = plot(id);
    pave(p.x, p.u, p.w, p.h, 'park', s);
    stoneWall(p.x, p.u, p.w, p.h, side);
    const back = side === 'e' ? p.x + 2 : p.x + p.w * 0.4;
    house(back, p.u + p.h * 0.42, p.w * 0.6, p.h * 0.54, { tile: pick([0x3e444e, 0x48444c]), hip: true, face: 3, s });
    // the storehouse (kura): white plaster, a heavy tiled roof, in the back corner
    const kx = side === 'e' ? p.x + p.w * 0.66 : p.x + 2;
    building(kx, p.u + p.h - 12, 9, 10, { face: 4, style: 'plain', wall: 0xf0ece0, roof: 0x3a3e48, s: s + 5 });
    // the gate (nagaya-mon): a long low house along the street side, the way through it
    const gx = side === 'e' ? p.x + p.w - 7 : p.x + 1;
    house(gx, p.u + 2, 6, p.h * 0.36, { tile: 0x5a5a62, face: 2, s: s + 1 });
    house(gx, p.u + p.h * 0.36 + 8, 6, p.h * 0.18, { tile: 0x5a5a62, face: 2, s: s + 2 });
    mark(back + 2, p.u + p.h * 0.45 + 0.4, (X, Y) => hoshigaki(X, Y - 2, Math.round(p.w * 0.5 * S) - 6), p.u + p.h * 0.45);
    tree('pine', p.x + p.w * (side === 'e' ? 0.62 : 0.2), p.u + p.h * 0.25, 2.2);
    tree('kaki', p.x + p.w * (side === 'e' ? 0.22 : 0.82), p.u + p.h * 0.22, 2);
    toro(p.x + p.w * 0.45, p.u + 6);
    const bx = side === 'e' ? p.x + p.w + 1.5 : p.x - 1.5;
    nobori(bx, p.u + p.h / 2 + 7, 0xe8e4dc);
    nobori(bx, p.u + p.h / 2 - 3, 0x3a4a8a);
  };
  /** A bonfire of leaves: a heap smouldering, its smoke drifting. */
  const takibi = (x, u) => {
    mark(x, u, (X, Y) => {
      for (let j = -2; j <= 2; j++) for (let i = -3; i <= 3; i++) if (i * i / 9 + j * j / 4 <= 1) P(X + i, Y + j, (i + j) % 2 ? 0x8a4a22 : 0x6a3a1c);
      P(X, Y, 0xf0a030);
      P(X + 1, Y - 1, 0xe05a1a);
    });
    kit.smoke(x, u + 1, { rate: 0.8, vy: 5, a: 0.32, sx: 2 });
  };

  // ---------------------------------------------------------------- Kawaguchi: the oshi lodgings along the street
  oshi('oshi_1', 'e', 9101);
  oshi('oshi_2', 'w', 9111);
  oshi('oshi_3', 'e', 9121);
  oshi('oshi_4', 'e', 9131);
  oshi('oshi_5', 'e', 9141);
  {
    // the hoto kitchen: steam from its iron pot, its curtain, benches under a red parasol outside
    const p = plot('hoto_ya');
    pave(p.x, p.u, p.w, p.h, 'plaza', 47);
    house(p.x + 2, p.u + 8, p.w - 4, p.h - 10, { tile: 0x5a4a44, face: 3, s: 9151 });
    mark(p.x + p.w / 2, p.u + 8, (X, Y) => {
      for (let i = -6; i < 6; i++) R(X + i, Y - 4, 1, 3, i % 3 === 0 ? 0xf0ece0 : 0x2a3a6a); // the noren
    }, p.u + 8);
    mark(p.x + 5, p.u + 3, (X, Y) => kit.parasol(X, Y - 3, 0xc83a2a));
    for (const dx of [2, 10]) mark(p.x + dx, p.u + 2, (X, Y) => R(X, Y, 7, 2, 0xc83a2a));
    kit.smoke(p.x + p.w - 6, p.u + p.h - 3, { rate: 1.2, vy: 6, a: 0.35 });
    nobori(p.x - 1.5, p.u + 14, 0xd8a030);
    crowd(p.x, p.u - 1, p.w, 6, 6);
  }
  {
    const p = plot('hoshigaki_1');
    pave(p.x, p.u, p.w, p.h, 'park', 9161);
    house(p.x + 2, p.u + 10, p.w - 4, p.h - 14, { tile: 0x56525a, hip: true, face: 3, s: 9161 });
    // curtains of persimmons from the eave to the ground, two rows of them, and baskets of fruit waiting to be peeled
    for (const off of [0.6, 2.6]) mark(p.x + 3, p.u + 10 - off, (X, Y) => hoshigaki(X, Y - 6, Math.round((p.w - 6) * S), 8), p.u + 10);
    for (let k = 0; k < 3; k++)
      mark(p.x + 6 + k * 6, p.u + 4, (X, Y) => {
        for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (i * i + j * j <= 5) P(X + i, Y + j, i * i + j * j > 3 ? 0x8a6a3a : PERSIMMON[(i + j + 6) % 3]);
      });
    crowd(p.x + 4, p.u + 2, 20, 4, 3);
  }
  {
    // the persimmon orchard: trees in rows hung with fruit, a ladder against one, baskets
    const p = plot('kaki_en');
    pave(p.x, p.u, p.w, p.h, 'park', 9171);
    for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) tree('kaki', p.x + 6 + i * 11 + (j % 2) * 2, p.u + 7 + j * 12, 2.6);
    mark(p.x + 18, p.u + 14, (X, Y) => {
      for (let j = 0; j < 12; j++) {
        P(X + Math.round(j * 0.3), Y - j, 0xa8885a);
        P(X + 4 + Math.round(j * 0.3), Y - j, 0xa8885a);
        if (j % 3 === 0) R(X + Math.round(j * 0.3), Y - j, 5, 1, 0x8a6a48);
      }
    }, p.u + 20);
    crowd(p.x + 4, p.u + 2, p.w - 8, 4, 3);
  }
  {
    // the thatched farmhouse, persimmons under its eave, its yard with a well
    const p = plot('kominka');
    pave(p.x, p.u, p.w, p.h, 'plaza', 9181);
    const [X0, X1, YT, YB] = [FX(p.x + 2), FX(p.x + p.w - 2), FY(p.u + p.h - 2), FY(p.u + 12)];
    queue(YB, () => {
      thatch(X0, YT, X1 - X0, YB - YT - 6);
      for (let j = 0; j < 6; j++) for (let i = X0 + 2; i < X1 - 2; i++) P(i, YB - 6 + j, j === 5 ? 0x2a2226 : (i - X0) % 9 === 0 ? 0x3a2a20 : 0x7a5a3a); // dark timber, earth walls
      hoshigaki(X0 + 6, YB - 6, X1 - X0 - 12, 5);
    }, () => shadowBox(X0, YT, X1 - X0, YB - YT, 12, 0.6));
    mark(p.x + 6, p.u + 5, (X, Y) => {
      for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) if (i * i + j * j <= 9) P(X + i, Y + j, i * i + j * j > 4 ? 0x8a8478 : 0x2a3a44);
    });
    takibi(p.x + p.w - 6, p.u + 5);
  }
  {
    const p = plot('kominkan');
    pave(p.x, p.u, p.w, p.h, 'plaza', 9191);
    building(p.x + 2, p.u + 14, p.w - 4, p.h - 16, { face: 4, style: 'plain', wall: 0xe0d8c8, roof: 0x7a6a5a, s: 9191 });
    // the shelter in its forecourt, a notice board, children about
    queue(FY(p.u + 4), () => {
      const [X, Y] = [FX(p.x + 4), FY(p.u + 12)];
      R(X, Y, FX(14) - FX(0), FX(7) - FX(0), 0x8a9098);
      R(X, Y, FX(14) - FX(0), 1, 0xb8c0c8);
    }, () => shadowBox(FX(p.x + 4), FY(p.u + 12), FX(14) - FX(0), FX(7) - FX(0), 5, 0.66));
    crowd(p.x + 20, p.u + 2, 16, 8, 7);
  }
  {
    // the farmyard: the barn under rusting tin, sheaves stacked, the little tractor, a bonfire of leaves
    const p = plot('nouka');
    pave(p.x, p.u, p.w, p.h, 'plaza', 9201);
    building(p.x + 2, p.u + 20, p.w - 10, p.h - 22, { face: 4, style: 'plain', wall: 0x8a6a4a, roof: 0x8a5a3a, s: 9201,
      top: ({ X, Y, w, h }) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) P(X + i, Y + j, i % 4 === 0 ? 0x6a4028 : (i * 7 + j * 3) % 11 === 0 ? 0xa86a3a : 0x8a5a3a); } });
    house(p.x + 2, p.u + 2, 14, 12, { tile: 0x56525a, face: 3, s: 9202 });
    mark(p.x + 24, p.u + 8, (X, Y) => {
      R(X, Y - 6, 7, 5, 0xd8502a); // the tractor: orange body, its seat, big wheels
      R(X, Y - 6, 7, 1, 0xf07a4a);
      R(X + 2, Y - 8, 3, 2, 0x2a2a30);
      for (const [dx, dy] of [[-1, -6], [7, -6], [-1, -2], [7, -2]]) R(X + dx, Y + dy, 1, 3, 0x1a1a1e);
    });
    for (let k = 0; k < 4; k++)
      mark(p.x + 20 + k * 4, p.u + 18, (X, Y) => {
        for (let j = -3; j <= 2; j++) for (let i = -2; i <= 2; i++) if (i * i + j * j <= 6) P(X + i, Y + j, j < -1 ? 0xd8b060 : (i + j) % 2 ? 0xb8904a : 0xc8a050);
      });
    takibi(p.x + p.w - 4, p.u + 30);
  }
  {
    // the jizo: three little stone figures in red bibs and caps, offerings before them
    const p = plot('jizo');
    pave(p.x, p.u, p.w, p.h, 'gravel', 9211);
    for (let k = 0; k < 3; k++)
      mark(p.x + 3 + k * 4.4, p.u + 4, (X, Y) => {
        R(X, Y - 6, 3, 6, 0x9a968c);
        R(X, Y - 6, 1, 6, 0xb8b4aa);
        R(X, Y - 7, 3, 1, 0xc8302a);
        R(X - 1, Y - 4, 5, 2, 0xd83a2a);
        P(X + 1, Y + 1, PERSIMMON[k]);
      });
    mark(p.x + 1, p.u + 1, (X, Y) => R(X, Y, FX(p.w - 2) - FX(0), 1, 0x6a5a48));
  }
  // the rice fields: sheaves hung on their racks in long rows, straw stacks, a heron, the farmers at work
  for (const id of ['tambo_1', 'tambo_2']) {
    const g = ctx.ground(id).rect;
    for (let u = g[1] + 14; u < g[1] + g[3] - 10; u += 26)
      mark(g[0] + 4, u, (X, Y) => {
        const w = FX(g[0] + g[2] - 8) - X;
        for (let i = 0; i < w; i++) {
          for (let j = 0; j < 3; j++) P(X + i, Y - 3 + j, j === 0 ? 0xe0c070 : (i * 5 + j) % 4 ? 0xc8a050 : 0xa88a3a);
          hi.tint(X + i + 2, Y + 1, 0.72);
          hi.tint(X + i + 3, Y + 2, 0.78);
        }
        for (let i = 0; i < w; i += 18) R(X + i, Y - 4, 1, 5, 0x5a4a34);
      });
    for (let k = 0; k < 5; k++) {
      const [x, u] = [g[0] + 6 + rand() * (g[2] - 12), g[1] + 8 + rand() * (g[3] - 16)];
      mark(x, u, (X, Y) => {
        for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) if (i * i + j * j <= 16) P(X + i, Y + j, i + j < -3 ? 0xe0c070 : i + j > 3 ? 0x9a7a3a : 0xc0a050);
        P(X, Y, 0x8a6a30);
      });
    }
    crowd(g[0] + 4, g[1] + 10, g[2] - 8, g[3] - 20, 6);
    takibi(g[0] + g[2] - 8, g[1] + g[3] - 6);
  }
  {
    // a grey heron standing in the stubble
    const f = [0, 1].map((k) => kit.frame(2.34, 2.34, 4400, (put) => {
      for (let i = 0; i < 5; i++) put(i, 3, 0x8a8e98);
      put(1, 2, 0xb8bcc4);
      put(5, 2 - k, 0xe0e0e0);
      put(6, 2 - k, 0xd8b040);
    }));
    props.wander(40, 4300, 20, 40, f, { n: 1, sp: 0.5, turn: 'flip', fps: 1, idle: 0.8, d: -0.2 });
  }
  // the houses between: tiled roofs, gardens with a persimmon tree, cabbage rows, sheds, cars at the door
  for (const b of blocks(3900, 5300))
    for (const [x, u, w, h] of lots(b, rand, { depth: [10, 15], width: [9, 15] })) {
      if (w < 6 || h < 7) continue;
      const v = rand();
      if (v < 0.36) {
        house(x, u + 3, w - 1, h - 4, { hip: rand() < 0.5, tile: pick([...PAL.tile, 0x4a505c]) });
        if (rand() < 0.5) tree('kaki', x + w * 0.7, u + 2, 1.6);
        else if (rand() < 0.4) kit.car(x + w / 2, u + 1.5, false);
      } else if (v < 0.6) {
        pave(x, u, w - 1, h - 1, 'park');
        ground(() => {
          for (let j = 1; j < h - 2; j += 2) for (let i = 1; i < w - 2; i += 1.4) R(FX(x + i), FY(u + j + 1), S, S, (Math.floor(i) + j) % 3 ? 0x5a8a44 : 0xd8dcc0); // cabbages
        });
        mark(x + w - 4, u + 3, (X, Y) => {
          R(X - 4, Y - 6, 7, 5, 0x8a8a84);
          R(X - 4, Y - 6, 7, 1, 0xb0b0a8);
        });
      } else if (v < 0.9) {
        pave(x, u, w - 1, h - 1, 'park');
        for (let k = 0; k < 1 + Math.floor((w * h) / 80); k++) tree(pick(['kaki', 'broadleaf', 'pine', 'tiny']), x + 2 + rand() * (w - 5), u + 2 + rand() * (h - 5), 1.8 + rand() * 1.2);
      } else if (w >= 9 && h >= 10) building(x + 1, u + 1, Math.min(9, w - 2), Math.min(10, h - 2), { face: 4, style: 'plain', wall: 0xf0ece0, roof: 0x3a3e48 }); // (a white storehouse)
      else pave(x, u, w - 1, h - 1, 'park');
    }
  // poles and wires down the village street, traffic on the roads
  {
    const us = [];
    for (let u = 3930; u < 5300; u += 34) {
      pole(93.5, u, u % 3 === 0);
      us.push(u);
    }
    wires(93.5, us);
    const kaido = road('kawaguchi_kaido');
    kit.trafficOn(kit.offset(kaido, 2), { sp: 16, gap: 260, s0: 0.2, u: 4500 });
    kit.trafficOn(kit.offset([...kaido].reverse(), 2), { sp: 15, gap: 280, s0: 0.7, u: 4500 });
    for (const id of ['kohan_kita', 'kawaguchi_2']) {
      const r = road(id);
      kit.trafficOn(kit.offset(r, 2), { sp: 20, gap: 200, s0: rand(), u: r[0][1] });
      kit.trafficOn(kit.offset([...r].reverse(), 2), { sp: 20, gap: 220, s0: rand(), u: r[0][1] });
    }
  }

  // ---------------------------------------------------------------- the Asama shrine in its wood
  {
    const wood = ctx.ground('asama_mori').rect;
    const keidai = ctx.ground('asama_keidai').rect;
    const busy = [keidai, ...['nanahon_sugi', 'asama_torii', 'kagura_asama', 'asama_honden'].map((id) => { const p = plot(id); return [p.x - 2, p.u - 2, p.w + 4, p.h + 4]; })];
    for (let k = 0; k < 260; k++) {
      const [x, u] = [wood[0] + 2 + rand() * (wood[2] - 4), wood[1] + 3 + rand() * (wood[3] - 6)];
      if (busy.some(([bx, bu, bw, bh]) => x > bx && x < bx + bw && u > bu && u < bu + bh) || Math.abs(u - 5100) < 4) continue;
      tree(rand() < 0.6 ? 'cedar' : 'broadleaf', x, u, 2.4 + rand() * 1.6);
    }
    // the seven cedars, a thousand years old, each girdled with its straw rope and paper streamers
    const p = plot('nanahon_sugi');
    pave(p.x, p.u, p.w, p.h, 'gravel');
    const at = [[6, 6], [18, 4], [30, 7], [40, 4], [10, 20], [24, 22], [37, 19]];
    for (const [dx, du] of at) {
      const [x, u] = [p.x + dx, p.u + du];
      mark(x, u - 3.2, (X, Y) => {
        for (let i = -5; i <= 5; i++) P(X + i, Y + Math.round(Math.abs(i) * 0.2), 0xd8c890); // the rope round the trunk
        for (const i of [-3, 0, 3]) for (let j = 1; j < 4; j++) P(X + i + (j % 2), Y + j, 0xf4f4f0); // its zigzag papers
      }, u - 3.5);
      tree('cedar', x, u, 5.4 + rand() * 1.2);
    }
    torii(105.5, 110.5, 5097, 0x8a867e, 4, true); // (stone)
    for (const x of [95, 101]) toro(x, 5096);
    const k = plot('kagura_asama');
    const [X0, YT, w, h] = [FX(k.x), FY(k.u + k.h), FX(k.w) - FX(0), FX(k.h) - FX(0)];
    queue(YT + h, () => {
      roof(X0 + 1, YT + 1, w - 2, h - 8, CEDAR_BARK, { bark: true });
      for (const i of [2, w - 4]) R(X0 + i, YT + h - 7, 2, 7, 0x7a4a2a);
      R(X0 + 2, YT + h - 2, w - 4, 2, 0x8a6a48);
    }, () => shadowBox(X0, YT, w, h, 8, 0.66));
    // the halls: the worship hall before the main one, plain wood and vermilion, cypress-bark roofs
    const hp = plot('asama_honden');
    const hall = (x, u, w, h, face) => {
      const [A, B, T, Bm] = [FX(x), FX(x + w), FY(u + h), FY(u)];
      const fh = Math.round(face * S);
      queue(Bm, () => {
        roof(A, T, B - A, Bm - T - fh, CEDAR_BARK, { bark: true });
        R(A + 3, T + ((Bm - T - fh) >> 1) - 1, B - A - 6, 3, 0x3a2a20);
        for (const ex of [A + 2, B - 3]) R(ex, T + ((Bm - T - fh) >> 1) - 1, 2, 3, GOLD);
        for (let j = 0; j < fh; j++)
          for (let i = A + 1; i < B - 1; i++) P(i, Bm - fh + j, j === fh - 1 ? 0x2a2226 : (i - A) % 7 === 0 ? VERMILION : j === 0 ? 0xe8d8b8 : 0x7a4a2a);
      }, () => shadowBox(A, T, B - A, Bm - T, Math.round(fh * 0.9), 0.6));
    };
    pave(hp.x - 2, hp.u - 8, hp.w + 4, 8, 'gravel');
    hall(hp.x + 6, hp.u + 14, hp.w - 12, 15, 3);
    hall(hp.x, hp.u + 1, hp.w, 12, 3);
    crowd(keidai[0] + 4, keidai[1] + 4, keidai[2] - 8, 30, 10);
    mark(hp.x + hp.w / 2, hp.u, (X, Y) => {
      R(X - 6, Y - 3, 12, 3, 0x6a4a2a);
      R(X - 6, Y - 3, 12, 1, 0x8a6a48);
    });
    for (const [x, u] of [[122, 5150], [164, 5150]]) tree('icho', x, u, 3.6); // (two old ginkgos by the halls)
    // the way across the grounds to the halls, stone lanterns along it; the water pavilion; the rack of votive boards
    ground(() => {
      for (let u = keidai[1] + 2; u < hp.u - 1; u += 1 / S) for (let x = 140; x < 146; x += 1 / S) P(FX(x), FY(u), (Math.floor(u * S) % 6 === 0) ? 0x8a8478 : 0xb4ac9a);
    });
    for (let u = keidai[1] + 8; u < hp.u - 4; u += 12) for (const x of [137, 149]) toro(x, u);
    queue(FY(5070), () => {
      const [X, Y] = [FX(124), FY(5082)];
      roof(X, Y, FX(12) - FX(0), FX(9) - FX(0), CEDAR_BARK, { bark: true });
      R(X + 4, Y + FX(9) - FX(0) + 1, FX(4) - FX(0), 4, 0x6aa8b8); // the basin of water under it
    }, () => shadowBox(FX(124), FY(5082), FX(12) - FX(0), FX(9) - FX(0), 6, 0.66));
    mark(156, 5130, (X, Y) => {
      R(X, Y - 6, 16, 6, 0x6a4a2a);
      for (let i = 1; i < 15; i += 2) for (let j = 0; j < 3; j++) P(X + i, Y - 5 + j * 2, (i + j) % 3 ? 0xe8d8b0 : 0xd8c090);
    });
  }

  // ---------------------------------------------------------------- the maple corridor
  const nearStream = (x, u) => near(STREAM.map(([a, b]) => [a, b]), x, u).d;
  const nearWalk = (x, u) => near(walk, x, u).d;
  {
    const g = ctx.ground('momiji_mori').rect;
    const plots = ['yatai_1', 'yatai_2', 'koyo_chaya', 'yatai_3'].map((id) => plot(id));
    const inPlot = (x, u) => plots.some((p) => x > p.x - 3 && x < p.x + p.w + 3 && u > p.u - 3 && u < p.u + p.h + 3);
    // the maples: red and orange, thick along both banks and leaning over the path, a ginkgo or a cedar among them
    // (their crowns meet over the path, so that it runs through a tunnel of them; the stream stays open to the sky)
    for (let k = 0; k < 3400; k++) {
      const [x, u] = [g[0] + 1 + rand() * (g[2] - 2), g[1] + 2 + rand() * (g[3] - 4)];
      const [ds, dw] = [nearStream(x, u), nearWalk(x, u)];
      if (ds < 5.5 || dw < 1.2 || inPlot(x, u) || Math.abs(u - 5340) < 4) continue;
      if (dw > 12 && ds > 10 && rand() < 0.45) continue; // (thinner away from the stream and the path)
      const v = rand();
      tree(v < 0.55 ? 'momiji' : v < 0.85 ? 'kaede' : v < 0.93 ? 'icho' : 'cedar', x, u, 2.2 + rand() * 1.6);
    }
    // the path's surface under the trees: leaves fallen on it, swept to its edges
    ground(() => {
      for (let u = g[1]; u < g[1] + g[3]; u += 1 / S)
        for (let x = 52; x < 86; x += 1 / S) {
          const n = near(walk, x, u);
          if (n.d > 1.5) continue;
          const [X, Y] = [FX(x), FY(u)];
          const h = (X * 13 + Y * 7) % 23;
          if (h < (n.d > 1 ? 9 : 3)) P(X, Y, [0xc23a24, 0xd07424, 0xe0b040][h % 3]);
        }
    });
    // little vermilion bridges over the stream, from the path to the far bank
    for (const u of [5520, 5900, 6300, 6560]) {
      const n = near(STREAM.map(([a, b]) => [a, b]), 40, u);
      const sx = STREAM[n.seg][0] + (STREAM[n.seg + 1][0] - STREAM[n.seg][0]) * n.t;
      mark(sx - 8, u, (X, Y) => {
        const w = FX(16) - FX(0);
        for (let i = 0; i < w; i++) {
          const arch = Math.round(Math.sin((i / (w - 1)) * Math.PI) * 2);
          for (let j = 0; j < 5; j++) P(X + i, Y - 2 + j - arch, j === 0 || j === 4 ? VERMILION : 0x8a6a48);
          hi.tint(X + i + 2, Y + 4 - arch + 2, 0.7);
        }
      });
    }
    // the lanterns strung along the path, coming on as the sun goes
    for (let i = 0; i < walk.length - 1; i++) {
      const [a, b] = [walk[i], walk[i + 1]];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      for (let t = 3; t < len; t += 7) {
        const [x, u] = [a[0] + ((b[0] - a[0]) * t) / len, a[1] + ((b[1] - a[1]) * t) / len];
        for (const side of [-2.4, 2.4]) mark(x + side, u, (X, Y) => lantern(X, Y - 6, (Math.round(u) % 14 < 7) ? 0xe0402a : 0xf0c060), u);
      }
    }
    crowd(54, 5340, 30, 1380, 160);
  }
  // the fair's stalls along the path: striped awnings, their wares, steam from the pots, people at the counters
  for (const [id, wares] of [['yatai_1', [0xf08a24, 0xc8a050, 0x6a3a20]], ['yatai_2', [0xe0e0d8, 0xc83a2a, 0x2a4a8a]], ['yatai_3', [0xd8b060, 0xf08a24, 0xe8e0d0]]]) {
    const p = plot(id);
    for (let k = 0; k * 7 < p.w - 2; k++) {
      const [x, c] = [p.x + 1 + k * 7, pick([0xc83a2a, 0x2a5a9a, 0x2e7a4a, 0xe0a030])];
      queue(FY(p.u + 1), () => {
        const [X, Y, w] = [FX(x), FY(p.u + p.h - 2), FX(6) - FX(0)];
        for (let j = 0; j < 22; j++) for (let i = 0; i < w; i++) P(X + i, Y + j, j > 18 ? 0x6a4a2a : (i >> 1) % 2 ? c : 0xf4f0e8);
        for (let i = 1; i < w - 1; i += 2) P(X + i, Y + 24, wares[(i + k) % 3]);
      }, () => shadowBox(FX(x), FY(p.u + p.h - 2), FX(6) - FX(0), 22, 4, 0.66));
      if (k % 2 === 0) kit.smoke(x + 3, p.u + p.h - 4, { rate: 0.7, vy: 5, a: 0.3 });
    }
    crowd(p.x, p.u - 5, p.w, 5, 14);
  }
  {
    // the tea house under the maples across the stream: its red parasol, benches spread with red felt
    const p = plot('koyo_chaya');
    pave(p.x, p.u, p.w, p.h, 'gravel', 9301);
    house(p.x + 2, p.u + 10, p.w - 4, p.h - 12, { tile: 0x5a4a3a, face: 2, s: 9301 });
    mark(p.x + p.w - 7, p.u + 4, (X, Y) => kit.parasol(X, Y - 4, 0xc8302a));
    for (const dx of [3, 11]) mark(p.x + dx, p.u + 3, (X, Y) => R(X, Y, 7, 3, 0xc8302a));
    crowd(p.x + 2, p.u + 1, p.w - 4, 6, 6);
  }
  {
    const p = plot('kyukeijo');
    pave(p.x, p.u, p.w, p.h, 'gravel', 9311);
    house(p.x + 4, p.u + 10, p.w - 8, p.h - 12, { tile: 0x4a4a52, face: 2, s: 9311 });
    mark(p.x + 6, p.u + 4, (X, Y) => kit.parasol(X, Y - 4, 0xc8302a));
    for (const dx of [12, 20]) mark(p.x + dx, p.u + 3, (X, Y) => R(X, Y, 6, 3, 0xc8302a));
    crowd(p.x + 2, p.u + 1, p.w - 4, 6, 5);
  }
  {
    // an inn and a guest house by the water: their wings round a garden, the bath steaming
    const inn = (id, s) => {
      const p = plot(id);
      house(p.x + 1, p.u + 1, p.w - 2, 11, { tile: 0x4a505c, face: 3, s });
      house(p.x + 1, p.u + p.h - 12, p.w - 2, 11, { tile: 0x4a505c, face: 3, s: s + 1 });
      house(p.x + 1, p.u + 13, 9, p.h - 26, { tile: 0x4a505c, face: 3, s: s + 2 });
      pave(p.x + 11, p.u + 13, p.w - 12, p.h - 26, 'park', s);
      tree('momiji', p.x + p.w - 6, p.u + p.h / 2, 2.2);
      ground(() => {
        for (let j = -2; j <= 2; j++) for (let i = -4; i <= 4; i++) if ((i / 4.4) ** 2 + (j / 2.4) ** 2 <= 1) R(FX(p.x + 16 + i * 0.8), FY(p.u + p.h / 2 + j * 0.8), 2, 2, Math.abs(i) > 3 || Math.abs(j) > 1 ? 0x8a8478 : 0x6ab0b8);
      });
      kit.smoke(p.x + 16, p.u + p.h / 2, { rate: 0.8, vy: 4, a: 0.26, sx: 3 });
    };
    inn('ryokan_nishi', 9321);
    inn('minshuku', 9331);
  }
  {
    // the gallery of dyed textiles: a long low building, its garden of raked gravel and standing stones
    const p = plot('gallery');
    pave(p.x, p.u, p.w, p.h, 'gravel', 9341);
    building(p.x + 2, p.u + 26, p.w - 4, p.h - 28, { face: 4, style: 'plain', wall: 0xd8ccb4, roof: 0x5a4a3a, s: 9341 });
    ground(() => {
      for (let u = p.u + 2; u < p.u + 24; u += 1 / S) for (let x = p.x + 2; x < p.x + p.w - 2; x += 1 / S) if (Math.floor(u * S) % 3 === 0) P(FX(x), FY(u), 0xa49c8a); // raked lines
    });
    for (const [dx, du, r] of [[8, 10, 2.4], [20, 16, 3], [30, 8, 2]])
      mark(p.x + dx, p.u + du, (X, Y) => {
        for (let j = -r * 3; j <= r * 3; j++) for (let i = -r * 3; i <= r * 3; i++) if (i * i + j * j <= r * r * 9) P(X + i, Y + j, i + j < 0 ? 0x8a867c : 0x5a5850);
      });
    tree('momiji', p.x + p.w - 6, p.u + 6, 2.4);
  }
  // the houses and shops on the far side of the street: souvenirs, a cafe, homes, the car park full
  // (above the street's bend first: below it the free ground is a wedge, which only the skewed finder fills well)
  for (const b of [...blocks(5400, 6716), ...blocks(5300, 5400, 8, 8, true)]) {
    for (const [x, u, w, h] of lots(b, rand, { depth: [10, 14], width: [9, 14] })) {
      if (w < 6 || h < 7) continue;
      const v = rand();
      if (x < 150 && v < 0.55) building(x, u, w - 1, h, { style: 'plain', face: 3, shop: true, sign: rand() < 0.4, wall: pick([0xd8cfc0, 0xe0d8c8, 0xc8b8a4]) });
      else if (v < 0.85) house(x, u, w - 1, h - 1, { hip: rand() < 0.5 });
      else {
        pave(x, u, w - 1, h - 1, 'park');
        tree(pick(['momiji', 'kaede', 'kaki']), x + w / 2, u + h / 2, 2);
      }
    }
  }
  {
    const g = ctx.ground('momiji_parking').rect;
    for (let u = g[1] + 4; u < g[1] + g[3] - 3; u += 5) for (const x of [g[0] + 6, g[0] + 20]) if (rand() < 0.8) kit.car(x, u, false);
    const kaido = road('kawaguchi_kaido');
    void kaido;
  }
  // the terrace over the water: boards, benches, people at the rail
  {
    const p = plot('tenbo_dai');
    ground(() => {
      for (let u = p.u; u < p.u + p.h; u += 1 / S) for (let x = p.x; x < p.x + p.w; x += 1 / S) P(FX(x), FY(u), Math.floor(x * S) % 4 === 0 ? 0x7a5a3a : 0x9a7a52);
    });
    for (const dx of [6, 18, 30]) mark(p.x + dx, p.u + 8, (X, Y) => R(X, Y, 8, 2, 0x6a4a2a));
    crowd(p.x + 2, p.u + p.h - 6, p.w - 4, 5, 12);
  }
  // the promenade: lamps along the quay, the photographers lined up with their tripods facing the mountain
  {
    for (let x = 6; x < 180; x += 16) mark(x, 6728, (X, Y) => kit.lamp(X, Y));
    const p = plot('shashin');
    for (let k = 0; k < 14; k++) {
      const x = p.x + 2 + k * 4.2 + (k % 3) * 0.4;
      mark(x, p.u + 6 + (k % 2) * 2, (X, Y) => {
        kit.person(X, Y + 2, 900 + k);
        for (const [dx, dy] of [[-2, -2], [3, -2], [1, -4]]) for (let q = 0; q < 3; q++) P(X + Math.round((dx * q) / 3) + 1, Y - 1 + Math.round((dy * q) / 3) - 3, 0x2a2a30); // the tripod's legs
        R(X, Y - 7, 3, 2, 0x1a1a1e); // the camera on it
        P(X + 1, Y - 8, 0x6a7a8a);
      }, p.u + 6);
    }
    crowd(0, 6728, 96, 14, 26);
    crowd(160, 6728, 20, 14, 6);
    const r = road('kohan_nishi');
    kit.trafficOn(kit.offset(r, 2), { sp: 14, gap: 180, s0: 0.3, u: 6722 });
    kit.trafficOn(kit.offset([...r].reverse(), 2), { sp: 14, gap: 200, s0: 0.8, u: 6722 });
  }

  // ---------------------------------------------------------------- what moves: leaves twirling down in the corridor, kites
  {
    const leaf = [0, 1, 2, 3].map((k) => kit.frame(1.34, 1.67, 6000, (put) => {
      const c = [0xd83a24, 0xe07a24, 0xe8b830, 0xc8502a][k];
      const pts = [[[1, 1], [2, 1], [1, 2]], [[1, 1], [1, 2], [2, 2]], [[1, 2], [2, 2], [2, 3]], [[0, 3], [1, 3], [1, 4]]][k];
      for (const [i, j] of pts) put(i, j, c);
    }, true));
    props.spot([[2, 6700, 96, 1340], [100, 5280, 80, 300], [96, 4380, 60, 200]], leaf, { rate: 2.4, fps: 4, d: 0.2 });
  }
  void shade;
}
