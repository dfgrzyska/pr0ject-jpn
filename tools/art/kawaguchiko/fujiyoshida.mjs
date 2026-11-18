// Fujiyoshida (u 0-1300, docs/plan-kawaguchiko.md phase 2): an afternoon in the town at the mountain's foot. Fujisan
// station with its platform and the local train; Honcho-dori running straight at the mountain between its old shops
// (an udon kitchen, a bathhouse with its chimney, a weaver's workshop under a sawtooth roof with cloth drying, a sake
// shop with its barrels and cedar ball, a coffee house, a stone bank), poles and wires along it, the bronze torii
// over its end; houses under tiled roofs, workshops, gardens and vegetable plots in the blocks behind; Shimoyoshida
// station; Arakurayama's wooded hill with the steps up to the five-storeyed Chureito pagoda, its little shrine and
// the terrace where everyone takes the same photograph; the great wooden torii, the avenue of cedars and stone
// lanterns to the Kitaguchi Hongu Fuji Sengen shrine, its halls in vermilion and gold, the kagura stage, the torches
// of the fire festival waiting in their shed, a pond with koi.
import { lots } from '../tokyo/blocks.mjs';
import { PAL, shade, blend } from '../tokyo/kit.mjs';
import { puff } from '../props.mjs';
import { makeParts, VERMILION, GOLD, CEDAR_BARK } from './parts.mjs';


export function fujiyoshida(ctx) {
  const { kit, blocks, pave, plot, cover, props, S } = ctx;
  const { building, house, tree, car, crowd, mark, ground, rand, pick, P, R, FX, FY, queue, shadowBox, hi } = kit;
  kit.setSun(0.5);
  const { roof, torii, toro, pole, wires, nobori, bikes } = makeParts(ctx);

  // ---------------------------------------------------------------- the plots' own ground (yards, forecourts)
  for (const id of ['udon_ya_1', 'sento', 'shoten_1', 'shoten_2', 'shoten_3', 'shoten_4', 'shoten_5', 'shoten_6']) {
    const p = plot(id);
    pave(p.x, p.u, p.w, p.h, 'plaza', 47);
  }
  for (const id of ['arakura_jinja', 'taimatsu_ko']) {
    const p = plot(id);
    pave(p.x, p.u, p.w, p.h, 'gravel');
  }

  // ---------------------------------------------------------------- Fujisan station
  {
    const p = plot('fujisan_eki');
    // the platform beside the track (one face), its yellow line, the canopy over it and the train
    ground(() => {
      for (let u = p.u + 1; u < p.u + p.h - 1; u++) {
        R(FX(32), FY(u), FX(36) - FX(32), S, 0xbdb9b0);
        R(FX(32), FY(u), 1, S, 0xe8c840);
      }
    });
    building(36.5, p.u + 2, 21, p.h - 4, {
      face: 5, style: 'plain', wall: 0xe8e0d0, roof: 0x7a8494, shop: true, s: 1010,
      // its roof shaped as the mountain: a blue-grey cone with snow down its gullies, the name band below
      top: ({ X, Y, w, h }) => {
        const [cx, base] = [X + (w >> 1), Y + h - 4];
        for (let j = 0; j < h - 6; j++) {
          const half = Math.round((j / (h - 6)) * (w / 2 - 2));
          for (let i = -half; i <= half; i++) {
            const snow = j < (h - 6) * 0.32 && Math.abs(Math.sin(i * 0.9)) < 0.6;
            P(cx + i, Y + 2 + j, snow ? 0xf4f6fa : i < 0 ? 0x5a6a8a : 0x46566e);
          }
        }
        R(X + 2, base, w - 4, 2, 0xc04a30);
      },
    });
    {
      const f = kit.frame(5, p.h - 2, p.u + p.h / 2, (put, c) => {
        for (let j = 0; j < c.hi.h; j++) for (let i = 0; i < c.hi.w; i++) put(i, j, kit.canopy(j, i, c.hi.w));
      });
      props.loop(30.6, p.u + p.h - 1, [f], { fps: 1, d: 0.1 });
    }
    // the bicycle park on the other side of the track
    ground(() => {
      for (let r = 0; r < 4; r++) bikes(FX(15), FY(p.u + 36 - r * 9), 9);
    });
    mark(16, p.u + 39, (X, Y) => {
      R(X, Y - 3, FX(25) - X, 2, 0x8a9098);
      R(X, Y - 3, FX(25) - X, 1, 0xb8c0c8);
    });
  }
  // the square in front: a bus shelter, taxis, a clock, people
  {
    const g = ctx.ground('fujisan_ekimae');
    const [x, u, w, h] = g.rect;
    mark(x + 4, u + h - 6, (X, Y) => {
      R(X, Y, 20, 5, 0xc4ccd4);
      R(X, Y + 4, 20, 1, 0x6a727c);
      R(X + 1, Y + 1, 18, 2, 0x8aa4b8);
    });
    for (const [dx, c] of [[5, 0x2a2a30], [13, 0xe8e8ec], [21, 0x2a5a3a]]) car(x + dx, u + 6, true, c);
    mark(x + w - 4, u + h - 4, (X, Y) => {
      R(X, Y - 8, 1, 8, 0x4a4e58);
      R(X - 2, Y - 11, 5, 4, 0xf0f0ec);
      P(X, Y - 10, 0x2a2a30);
      P(X + 1, Y - 9, 0x2a2a30);
    });
    crowd(x + 2, u + 12, w - 4, h - 20, 14);
    tree('broadleaf', x + w - 4, u + 4, 2.6);
  }

  // ---------------------------------------------------------------- Honcho-dori's shops
  {
    const p = plot('udon_ya_1');
    house(p.x + 1, p.u + 6, p.w - 2, p.h - 6, { tile: 0x5a626e, face: 2.4, s: 2001 });
    // the noren over its door, a bench and the menu board out front
    mark(p.x + p.w / 2, p.u + 6, (X, Y) => {
      for (let i = -5; i <= 5; i++) R(X + i, Y - 4, 1, 3, i % 3 === 0 ? 0xf4f0e8 : 0x2a3a6a);
    }, p.u + 6);
    mark(p.x + 3, p.u + 3, (X, Y) => {
      R(X, Y - 2, 9, 2, 0x8a6a48);
      R(X, Y - 2, 9, 1, 0xa8885e);
      R(X + 12, Y - 5, 4, 5, 0x2a2a30);
      kit.strokes(X + 12, Y - 5, 4, 5, 0xf4f0e8, 7);
    });
    kit.smoke(p.x + p.w - 6, p.u + p.h - 4, { rate: 1.3 });
    nobori(p.x + 1, p.u + 8, 0xc83028);
    nobori(p.x + p.w - 3, p.u + 8, 0x2a5ab0);
  }
  {
    const p = plot('sento');
    building(p.x + 1, p.u + 2, p.w - 10, p.h - 4, {
      face: 4, style: 'plain', wall: 0xd8ccb8, roof: 0x6a6e78, s: 2002,
      top: ({ X, Y, w, h, tank }) => {
        for (let i = 2; i < w - 2; i += 3) R(X + i, Y + 2, 1, h - 4, 0x5a5e66); // its long roof of corrugated sheet
        tank(X + w - 8, Y + 6, 3);
      },
    });
    // the boiler house and its tall brick chimney, smoking
    house(p.x + p.w - 9, p.u + 4, 8, 10, { tile: 0x6a5a50, face: 2, s: 2003 });
    queue(FY(p.u + 16), () => {
      const [X, Y] = [FX(p.x + p.w - 5), FY(p.u + 16)];
      for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) if (i * i + j * j <= 9) P(X + i, Y - 30 + j, (i + j) % 3 ? 0x8a4a34 : 0x6a3a2a);
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) P(X + i, Y - 30 + j, 0x1a1414);
      R(X - 3, Y - 27, 7, 27, 0x7a4430);
      for (let j = 0; j < 27; j += 3) R(X - 3, Y - 27 + j, 7, 1, 0x5a3022);
      R(X - 3, Y - 27, 1, 27, 0x9a5a40);
    }, () => shadowBox(FX(p.x + p.w - 8), FY(p.u + 18), 7, 6, 30, 0.6));
    kit.smoke(p.x + p.w - 5, p.u + 16 + 10, { rate: 1.6, vy: 11, a: 0.45 });
    mark(p.x + 10, p.u + 2, (X, Y) => {
      for (let i = 0; i < 9; i++) R(X + i, Y - 4, 1, 3, i < 4 ? 0x2a4a9a : 0xc83a3a); // its two noren: blue for men, red for women
    });
  }
  {
    // the weaver's: a workshop under a sawtooth roof (Fujiyoshida weaves silk), bolts drying on racks in its yard
    const p = plot('shoten_2');
    building(p.x + 1, p.u + 12, p.w - 2, p.h - 13, {
      face: 3, style: 'plain', wall: 0xd0c8b8, roof: 0x8a8e94, s: 2004,
      top: ({ X, Y, w, h }) => {
        for (let j = 0; j < h; j++) {
          const k = j % 7;
          for (let i = 0; i < w; i++) P(X + i, Y + j, k < 2 ? 0x9cb8c8 : k < 5 ? shade(0x8a8e94, 1.1 - k * 0.04) : 0x5a5e66);
        }
      },
    });
    ground(() => {
      for (let r = 0; r < 2; r++) {
        const Y = FY(p.u + 9 - r * 5);
        R(FX(p.x + 2), Y, FX(p.x + p.w - 2) - FX(p.x + 2), 1, 0x5a4a3a);
        for (let k = 0; k < 8; k++) R(FX(p.x + 3) + k * 11, Y + 1, 9, 4, [0x8a3a6a, 0x2a4a8a, 0xd8a840, 0x3a7a5a, 0xc04a40, 0xe8e0d0, 0x5a3a7a, 0x2a6a8a][(k + r * 3) % 8]);
      }
    });
  }
  {
    const p = plot('shoten_1');
    building(p.x + 1, p.u + 2, p.w - 2, p.h - 3, { face: 5, style: 'plain', wall: 0xc8b8a0, roof: 0x7a6a60, shop: true, sign: 0xe0c040, s: 2005 });
    // tin signs on its side wall, a red post box at its corner
    mark(p.x + 2, p.u + 1, (X, Y) => {
      R(X, Y - 6, 3, 6, 0xc83028);
      R(X, Y - 6, 3, 1, 0xe85a48);
    });
  }
  {
    const p = plot('shoten_3');
    building(p.x + 1, p.u + 2, p.w - 2, p.h - 4, {
      face: 5, style: 'brick', wall: 0x9a5a44, roof: 0x5a4a44, shop: true, sign: 0xf4f0e8, s: 2006,
    });
    mark(p.x + 2, p.u + 1, (X, Y) => {
      for (let i = 0; i < 26; i++) R(X + i, Y - 4, 1, 3, i % 4 < 2 ? 0x2a6a4a : 0xf4f0e8); // its striped awning
    }, p.u + 2);
    kit.parasol && mark(p.x + p.w - 6, p.u, (X, Y) => kit.parasol(X, Y - 3, 0x2a6a4a));
  }
  {
    const p = plot('shoten_4');
    building(p.x + 1, p.u + 8, p.w - 2, p.h - 9, { face: 5, style: 'plain', wall: 0xe0d6c4, roof: 0x4a4e58, shop: true, s: 2007 });
    // barrels stacked by the door, the cedar ball (sugidama) hung over it
    for (let k = 0; k < 5; k++)
      mark(p.x + 4 + k * 3.4 + (k > 2 ? 1.7 : 0), p.u + 4 - (k > 2 ? 2.4 : 0), (X, Y) => {
        for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) if (i * i + j * j <= 16) P(X + i, Y + j, i * i + j * j > 9 ? 0x6a4a2a : (i + j) % 4 ? 0xc89a5a : 0xb08048);
        R(X - 4, Y, 9, 1, 0x3a2a1a);
      });
    mark(p.x + p.w - 8, p.u + 8, (X, Y) => {
      for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) if (i * i + j * j <= 16) P(X + i, Y - 8 + j, (i * 3 + j * 5) % 7 < 3 ? 0x5a4a2a : 0x7a6438); // (hung green in the spring, brown by now)
      R(X, Y - 3, 1, 3, 0x3a2a1a);
    }, p.u + 8);
  }
  {
    const p = plot('shoten_5');
    // a row of narrow two-storey shops, each its own
    for (let k = 0; k < 3; k++) building(p.x + 1, p.u + 1 + k * 16, p.w - 2, 15, { face: 4 + (k % 2), style: pick(['plain', 'brick', 'plain']), shop: true, sign: k !== 1, s: 2008 + k });
  }
  {
    const p = plot('shoten_6');
    building(p.x + 1, p.u + 4, p.w - 2, p.h - 6, {
      face: 6, style: 'granite', wall: 0xc8c0b0, roof: 0x7a7c80, s: 2012,
      top: ({ X, Y, w, h, R: rect }) => {
        rect(X + 2, Y + 2, w - 4, 2, 0xa8a49a);
        for (let i = 4; i < w - 4; i += 6) rect(X + i, Y + h - 3, 3, 3, 0xe0dcd0); // the columns' heads over its portico
      },
    });
  }

  // ---------------------------------------------------------------- Honcho-dori: poles and wires, the bronze torii at its end
  for (const x of [83.9, 96.1]) {
    const us = [];
    for (let u = 20; u < 990; u += 38) {
      if ([136, 250, 380, 480, 700].some((c) => Math.abs(u - c) < 8)) continue;
      us.push(u);
      pole(x, u, us.length % 4 === 2);
    }
    wires(x, us);
  }
  torii(83, 97, 962, 0x4a5a4c, 6, true); // (the kanadorii: bronze gone green)
  // shoppers on its pavements, people waiting to photograph the mountain at its end
  crowd(83, 200, 1.5, 760, 34);
  crowd(96.6, 200, 1.5, 760, 30);
  crowd(78, 975, 24, 16, 18);

  // ---------------------------------------------------------------- Shimoyoshida station
  {
    const p = plot('shimoyoshida_eki');
    ground(() => {
      for (let u = p.u + 1; u < p.u + p.h - 1; u++) {
        R(FX(43), FY(u), FX(47) - FX(43), S, 0xbdb9b0);
        R(FX(43), FY(u), 1, S, 0xe8c840);
      }
    });
    house(47.5, p.u + 6, 8, p.h - 12, { tile: 0x7c6050, face: 2.4, s: 3001 });
    const f = kit.frame(4, 16, p.u + p.h / 2, (put, c) => {
      for (let j = 0; j < c.hi.h; j++) for (let i = 0; i < c.hi.w; i++) put(i, j, kit.canopy(j, i, c.hi.w));
    });
    props.loop(42.6, p.u + p.h / 2 + 8, [f], { fps: 1, d: 0.1 });
    ground(() => {
      for (let r = 0; r < 3; r++) bikes(FX(p.x + 2), FY(p.u + 30 - r * 8), 4);
    });
  }

  // ---------------------------------------------------------------- the local line's train: two cars, to Kawaguchiko and back
  {
    const line = ctx.RAILS.find((r) => r.id === 'fujikyu').pts;
    kit.trainOn(line, 0x2a5ab0, { n: 3, sp: 26, mode: 'pp', hold: 7, s0: 0.2, u: 600 });
  }

  // ---------------------------------------------------------------- Arakurayama: the wood, the steps, the pagoda, its shrine
  {
    const g = ctx.ground('arakurayama').rect;
    const keep = [plot('churei_to'), plot('arakura_jinja'), plot('tenbodai')].map((q) => [q.x - 3, q.u - 3, q.w + 6, q.h + 6]);
    keep.push([104, 870, 46, 44], [124, 700, 7, 180]); // (the square and the steps)
    const free = (x, u) => !keep.some(([kx, ku, kw, kh]) => x > kx && x < kx + kw && u > ku && u < ku + kh);
    for (let k = 0; k < 420; k++) {
      const [x, u] = [g[0] + 3 + rand() * (g[2] - 6), g[1] + 4 + rand() * (g[3] - 8)];
      if (!free(x, u) || x > 150) continue;
      tree(rand() < 0.45 ? 'cedar' : 'broadleaf', x, u, 2.4 + rand() * 1.8);
    }
    // the steps: treads across, a rail each side, stone lanterns now and then
    ground(() => {
      for (let u = 704; u < 872; u += 1) {
        R(FX(125.5), FY(u), FX(128.5) - FX(125.5), 1, 0x8a8478);
        R(FX(125.5) - 1, FY(u), 1, S, 0x6a6458);
        R(FX(128.5), FY(u), 1, S, 0x6a6458);
      }
    });
    for (let u = 716; u < 868; u += 22) {
      toro(123.4, u);
      toro(129.6, u + 11);
    }
    crowd(125.6, 720, 2.6, 140, 14);
  }
  {
    // the five-storeyed pagoda: five roofs one over the other, each smaller, vermilion between them, the spire on top
    const p = plot('churei_to');
    const [cx, cu] = [p.x + p.w / 2, p.u + 6];
    const [X, Y] = [FX(cx), FY(cu)];
    queue(Y + 2, () => {
      for (let k = 0; k < 5; k++) {
        const half = Math.round((9.4 - k * 1.25) * S);
        const lift = Math.round(k * 3.1 * S);
        const rh = Math.round(half * 0.9);
        // the storey's wall under the roof (its south face), then the roof
        R(X - half + 5, Y - lift - 6, 2 * half - 10, 6, VERMILION);
        for (let i = -half + 5; i < half - 5; i += 4) R(X + i, Y - lift - 5, 1, 4, 0xe8d8c0);
        R(X - half + 5, Y - lift - 1, 2 * half - 10, 1, 0x3a2a24);
        roof(X - half, Y - lift - 6 - rh * 2 + 2, 2 * half, rh * 2 - 2, 0x4a4442);
        R(X - half + 1, Y - lift - 7, 2 * half - 2, 1, 0x8a8480); // the eave's edge, catching the light
        R(X - half + 1, Y - lift - 6 - rh * 2 + 2, 2 * half - 2, 1, 0x6a6460);
        // the eaves' corners curl up, gold bells hung from them
        for (const [ex, ey] of [[-half, -lift - 6 - rh * 2 + 2], [half - 1, -lift - 6 - rh * 2 + 2], [-half, -lift - 7], [half - 1, -lift - 7]]) {
          P(X + ex, Y + ey, 0x6a6a68);
          P(X + ex, Y + ey + 1, GOLD);
        }
      }
      // the spire: bronze rings on a mast, the flame-shaped finial
      const top = Y - Math.round(4 * 3.1 * S) - Math.round(4.4 * 0.9 * S) * 2 - 2;
      R(X - 1, top - 18, 2, 20, 0x6a5a34);
      for (let k = 0; k < 9; k++) R(X - 2, top - 16 + k * 2, 4, 1, 0xb89a48);
      R(X - 1, top - 21, 2, 3, GOLD);
    }, () => {
      // its shadow steps in with every storey and runs out longer, the spire's a thin line beyond
      for (let k = 0; k < 5; k++) {
        const half = Math.round((9.4 - k * 1.25) * S);
        shadowBox(X - half + 2, Y - Math.round(half * 1.6), 2 * half - 4, Math.round(half * 1.6), Math.round((k + 1) * 3.1 * S * 0.5) + 4, 0.6);
      }
      shadowBox(X, Y - 4, 2, 2, 40, 0.66);
    });
    // the gravel square round it, visitors, benches, two stone lanterns
    crowd(p.x - 8, p.u - 6, 8, 30, 8);
    crowd(p.x + p.w + 1, p.u - 6, 12, 30, 9);
    for (const x of [p.x - 4, p.x + p.w + 4]) toro(x, p.u - 3);
  }
  {
    const p = plot('arakura_jinja');
    house(p.x + 2, p.u + 7, p.w - 4, p.h - 8, { tile: 0x4c6e60, face: 2.4, s: 4001 });
    torii(p.x + 3, p.x + p.w - 3, p.u + 3, VERMILION, 3.4);
    for (const x of [p.x + 1, p.x + p.w - 1]) toro(x, p.u + 1);
  }
  {
    // the terrace over the pagoda: planks, a rail, and everyone at the rail with a camera, turned to the mountain
    const p = plot('tenbodai');
    ground(() => {
      for (let u = p.u; u < p.u + p.h; u += 1) for (let x = p.x; x < p.x + p.w; x += 1) R(FX(x), FY(u + 1), S, S, (Math.floor((u - p.u) * S) % 4 === 0) ? 0x7a5a3c : 0x9a7a52);
    });
    mark(p.x, p.u + p.h, (X, Y) => {
      R(X, Y, FX(p.w), 1, 0x4a3a2a);
      for (let i = 0; i < FX(p.w); i += 6) R(X + i, Y, 1, 3, 0x4a3a2a);
    });
    for (let k = 0; k < 14; k++) mark(p.x + 2 + k * 2.6, p.u + p.h - 2, (X, Y) => kit.person(X, Y - 3, 400 + k));
  }

  // ---------------------------------------------------------------- the approach: the great torii, the cedar avenue, lanterns
  {
    const p = plot('ootorii');
    torii(p.x + 3, p.x + p.w - 3, p.u + 4, VERMILION, 8, true); // (the great torii of the mountain, vermilion)
    for (let u = 1018; u < 1148; u += 12) {
      tree('cedar', 81.5, u + (u % 24 ? 3 : 0), 3.6 + rand() * 0.8);
      tree('cedar', 98.5, u + (u % 24 ? 0 : 3), 3.6 + rand() * 0.8);
      if (u > 1056) {
        toro(85.6, u + 6);
        toro(94.4, u + 6);
      }
    }
    crowd(87.4, 1020, 5, 120, 16);
    // the plaza at the avenue's mouth: a stone signpost, the bus stop, pilgrims setting out
    crowd(72, 998, 36, 16, 14);
  }

  // ---------------------------------------------------------------- the shrine
  {
    const g = ctx.ground('sengen_keidai').rect;
    // the woods round it: cedars, a few of them the shrine's giants
    const forest = ctx.ground('sengen_mori').rect;
    const busy = [[g[0] - 2, g[1] - 2, g[2] + 4, g[3] + 4], [78, 1010, 26, 150], [plot('taimatsu_ko').x - 2, plot('taimatsu_ko').u - 2, 22, 28], [6, 1230, 26, 22], [26, 1010, 12, 290]];
    for (let k = 0; k < 640; k++) {
      const [x, u] = [forest[0] + 2 + rand() * (forest[2] - 4), forest[1] + 3 + rand() * (forest[3] - 6)];
      if (busy.some(([bx, bu, bw, bh]) => x > bx && x < bx + bw && u > bu && u < bu + bh) || (x > 150 && x < 170)) continue;
      tree(rand() < 0.75 ? 'cedar' : 'broadleaf', x, u, 2.6 + rand() * 1.6);
    }
    for (const [x, u] of [[60, 1170], [128, 1180], [62, 1250]]) tree('cedar', x, u, 6.4); // (the giants)
  }
  {
    const p = plot('honden');
    // the worship hall in front, the main hall behind: vermilion walls, cypress-bark roofs, gold on their ridges
    const hall = (x, u, w, h, face, s) => {
      const [X0, X1, YT, YB] = [FX(x), FX(x + w), FY(u + h), FY(u)];
      const fh = Math.round(face * S);
      queue(YB, () => {
        roof(X0, YT, X1 - X0, YB - YT - fh, CEDAR_BARK, { bark: true });
        R(X0 + 3, YT + ((YB - YT - fh) >> 1) - 1, X1 - X0 - 6, 3, 0x3a2a20); // the ridge
        for (let i = X0 + 3; i < X1 - 3; i++) P(i, YT + ((YB - YT - fh) >> 1), (i - X0) % 6 < 3 ? GOLD : 0x3a2a20); // its gilded fittings
        for (const ex of [X0 + 2, X1 - 3]) R(ex, YT + ((YB - YT - fh) >> 1) - 1, 2, 3, GOLD);
        for (let j = 0; j < fh; j++)
          for (let i = X0 + 1; i < X1 - 1; i++) {
            let c = (i - X0) % 7 === 0 ? 0x3a2a24 : j === 0 ? 0xf0e0c0 : VERMILION;
            if (j > 1 && j < fh - 1 && (i - X0) % 7 >= 2 && (i - X0) % 7 <= 4) c = (j + i) % 2 ? GOLD : 0x2a5a4a; // carved and gilded panels
            if (j === fh - 1) c = 0x2a2226;
            P(i, YB - fh + j, c);
          }
      }, () => shadowBox(X0, YT, X1 - X0, YB - YT, Math.round(fh * 0.9), 0.6));
      void s;
    };
    // the low vermilion fence (tamagaki) round the main hall, the worship hall in front of it with its curved gable
    mark(p.x + 3, p.u + 21, (X, Y) => {
      const w = FX(p.w - 6) - FX(0);
      R(X, Y - FX(23) + FX(0), w, 1, VERMILION);
      for (let j = 0; j < FX(23) - FX(0); j += 3) {
        P(X, Y - j, VERMILION);
        P(X + w - 1, Y - j, VERMILION);
      }
    });
    hall(p.x + 6, p.u + 22, p.w - 12, 21, 3, 1);
    hall(p.x, p.u + 2, p.w, 18, 3.4, 2);
    mark(p.x + p.w / 2, p.u + 2, (X, Y) => {
      // the karahafu: a curved gable over the steps, its ridge a gilded wave
      for (let i = -8; i <= 8; i++) {
        const top = Math.round(Math.cos((i / 8) * Math.PI) * 1.6 + 2.6);
        for (let j = 0; j < 6; j++) P(X + i, Y - 13 + j - top, j === 0 ? GOLD : shade(CEDAR_BARK, j < 3 ? 1.15 : 0.9));
      }
      R(X - 6, Y - 7, 13, 1, 0xf0e0c0);
    }, p.u + 2);
    // the offering box and the bell rope at its steps, pilgrims, the ema boards on their rack
    mark(p.x + p.w / 2, p.u + 1, (X, Y) => {
      R(X - 6, Y - 3, 12, 3, 0x6a4a2a);
      R(X - 6, Y - 3, 12, 1, 0x8a6a48);
      for (const dx of [-3, 3]) R(X + dx, Y - 12, 1, 9, (dx > 0 ? 0xe8d8b0 : 0xc83a2a));
    });
    crowd(p.x + 8, p.u - 14, p.w - 16, 12, 16);
    mark(p.x - 6, p.u + 6, (X, Y) => {
      R(X, Y - 8, 14, 2, 0x5a3a2a);
      for (let k = 0; k < 6; k++) R(X + 1 + k * 2, Y - 6, 2, 3, 0xd8b884);
    });
    toro(p.x + 4, p.u - 18);
    toro(p.x + p.w - 4, p.u - 18);
  }
  {
    // the court: its gravel raked in lines, lanterns along the way in, the water pavilion, the sacred tree in its rope,
    // the office selling amulets, the rack where the fortunes are tied
    const [gx, gu, gw, gh] = ctx.ground('sengen_keidai').rect;
    ground(() => {
      for (let u = gu + 2; u < gu + gh - 2; u += 1.34) for (let X = FX(gx + 2); X < FX(gx + gw - 2); X++) P(X, FY(u), 0xa49a84); // raked lines
    });
    for (let u = gu + 6; u < gu + 40; u += 9) {
      toro(84.6, u);
      toro(95.4, u);
    }
    {
      const [X0, YT] = [FX(gx + 6), FY(gu + 26)];
      queue(YT + 18, () => {
        roof(X0, YT, 18, 12, 0x4c6e60);
        R(X0 + 3, YT + 12, 12, 6, 0x5a6a74);
        R(X0 + 4, YT + 13, 10, 3, 0x7ab0c8); // its stone basin, full
        for (const i of [1, 15]) R(X0 + i, YT + 12, 2, 6, VERMILION);
      }, () => shadowBox(X0, YT, 18, 18, 6, 0.66));
    }
    mark(gx + gw - 12, gu + 30, (X, Y) => {
      R(X - 8, Y - 2, 22, 2, 0xe8dcc0); // the shimenawa round the old tree
      for (let i = -8; i < 14; i += 4) R(X + i, Y, 1, 4, 0xf4f4ec);
    });
    building(gx + 4, gu + 52, 22, 14, { face: 3, style: 'plain', wall: 0xf0e8d8, roof: 0x5a4a40, shop: true, s: 6001 });
    mark(gx + gw - 18, gu + 8, (X, Y) => {
      for (let r = 0; r < 3; r++) {
        R(X, Y - 3 - r * 5, 26, 1, 0x5a4a3a);
        for (let i = 1; i < 26; i += 2) P(X + i, Y - 2 - r * 5, 0xf8f4ec);
      }
    });
    crowd(gx + 30, gu + 4, 28, 40, 18);
  }
  {
    // the kagura stage: a roof on posts, open on its four sides
    const p = plot('kagura_den');
    const [X0, YT, w, h] = [FX(p.x), FY(p.u + p.h), FX(p.w) - FX(0), FX(p.h) - FX(0)];
    queue(YT + h, () => {
      roof(X0 + 1, YT + 1, w - 2, h - 8, CEDAR_BARK);
      for (const i of [2, w - 4]) R(X0 + i, YT + h - 7, 2, 7, VERMILION);
      R(X0 + 2, YT + h - 2, w - 4, 2, 0x8a6a48); // its floor of boards
    }, () => shadowBox(X0, YT, w, h, 8, 0.66));
  }
  {
    // the fire festival's torches: tall bundles of pine, waiting under their shed for the end of summer
    const p = plot('taimatsu_ko');
    house(p.x + 1, p.u + 12, p.w - 2, p.h - 12, { tile: 0x5a5048, face: 2, s: 5001 });
    for (let k = 0; k < 4; k++)
      mark(p.x + 3 + k * 4, p.u + 10, (X, Y) => {
        R(X - 1, Y - 14, 4, 14, 0x8a6a3a);
        for (let j = 0; j < 14; j += 3) R(X - 1, Y - 14 + j, 4, 1, 0x4a3a1a);
        R(X - 1, Y - 14, 1, 14, 0xa8884e);
        hi.tint(X + 3, Y - 2, 0.75);
      });
  }
  {
    // the pond: koi turning in it, a stone bridge over its narrow
    const fish = [0xf07a20, 0xf4f0e8, 0xd84a2a].map((c) => kit.frame(1.67, 1, 1240, (put) => {
      for (let i = 0; i < 5; i++) put(i, 1, i === 0 ? 0xf4f0e8 : c);
      put(1, 0, c);
      put(1, 2, c);
    }));
    props.wander(18, 1240, 6, 3.6, fish, { n: 4, sp: 3, idle: 0.3, d: -0.2 });
    mark(18, 1238.5, (X, Y) => {
      R(X - 2, Y - 4, 5, 8, 0x9a948a);
      R(X - 2, Y - 4, 1, 8, 0xb8b2a6);
    });
  }

  // ---------------------------------------------------------------- the blocks: shops along the streets, houses, workshops and plots behind
  for (const b of [...blocks(0, 330, 8, 8, true), ...blocks(330, 1016)]) {
    for (const [x, u, w, h] of lots(b, rand, { depth: [9, 14], width: [8, 15] })) {
      if (w < 6 || h < 7) continue;
      const front = Math.abs(x + w / 2 - 90) < 24 || Math.abs(x + w / 2 - 160) < 20 || [250, 700].some((c) => Math.abs(u - c) < 16 || Math.abs(u + h - c) < 16);
      const v = rand();
      if (front && v < 0.6) building(x, u, w - 1, h, { style: pick(['plain', 'plain', 'brick', 'office']), face: 3 + Math.floor(rand() * 3), shop: true, sign: rand() < 0.5, wall: pick([0xd8cfc0, 0xc8b8a4, 0xe0d8c8, 0xb8a894, 0xcfc8bc]) });
      else if (v < 0.66) house(x, u, w - 1, h - 1, { hip: rand() < 0.55 });
      else if (v < 0.74 && w >= 10 && h >= 10) {
        // a weaver's workshop, its sawtooth roof's glass facing north
        building(x, u, w - 1, h - 1, {
          face: 3, style: 'plain', wall: 0xd0c8b8, roof: 0x8a8e94,
          top: ({ X, Y, w: ww, h: hh }) => {
            for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) P(X + i, Y + j, j % 7 < 2 ? 0x9cb8c8 : shade(0x8a8e94, 1.1 - (j % 7) * 0.04));
          },
        });
      } else if (v < 0.86) {
        // a vegetable plot: rows of greens, a pole frame for beans, a small shed
        pave(x, u, w - 1, h - 1, 'park');
        ground(() => {
          for (let j = 1; j < h - 2; j += 2) for (let i = 1; i < w - 2; i++) R(FX(x + i), FY(u + j + 1), S, S, (i + j) % 3 ? 0x4a7a34 : 0x6a5a3a);
        });
        mark(x + w - 4, u + 3, (X, Y) => {
          R(X - 4, Y - 6, 7, 5, 0x8a8a84);
          R(X - 4, Y - 6, 7, 1, 0xb0b0a8);
        });
      } else if (v < 0.93) {
        pave(x, u, w - 1, h - 1, 'park');
        for (let k = 0; k < 1 + Math.floor((w * h) / 70); k++) tree(pick(['broadleaf', 'pine', 'tiny', 'broadleaf']), x + 2 + rand() * (w - 5), u + 2 + rand() * (h - 5), 1.8 + rand() * 1.4);
      } else building(x, u, w - 1, h, { style: 'balcony', face: 3 + Math.floor(rand() * 3) });
    }
  }
  // the national road: street trees, parked cars at the shops
  for (let u = 14; u < 1290; u += 19) {
    if ([250, 480, 700, 1200].some((c) => Math.abs(u - c) < 10)) continue;
    tree('icho', 153.4, u, 2); // (ginkgos along the national road)
    tree('icho', 166.6, u + 9, 2);
  }

  // ---------------------------------------------------------------- traffic: up and down the national road (and on round the lake), along Honcho-dori
  {
    const national = [[160, -14], [160, 2096], [110, 2088], [82, 2050], [64, 2004], [-14, 2004]];
    kit.trafficOn(kit.offset(national, 2.5), { sp: 22, gap: 150, s0: 0.1, u: 600 });
    kit.trafficOn(kit.offset([...national].reverse(), 2.5), { sp: 20, gap: 170, s0: 0.6, u: 600 });
    const honcho = [[90, -14], [90, 700], [194, 700]];
    kit.trafficOn(kit.offset(honcho, 2.5), { sp: 16, gap: 230, s0: 0.3, u: 400 });
    kit.trafficOn(kit.offset([...honcho].reverse(), 2.5), { sp: 15, gap: 260, s0: 0.8, u: 400 });
  }
  void blend;
  void puff;
  void cover;
}
