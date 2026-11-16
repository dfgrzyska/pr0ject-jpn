// Nakano (u 0-700): houses south of the tracks, the station over the Chūō line's four tracks, trains pulling in under it; the glass-roofed
// Sun Mall arcade up to Nakano Broadway, a slab of shops with flats on top and a garden on its roof; Arai
// Yakushi's little temple; low houses under tiled roofs, flats, car parks and pocket gardens along the lanes;
// Ōme-kaidō under its street trees; cherries along the Kanda river. An afternoon.
import { lots } from './blocks.mjs';
import { PAL, shade } from './kit.mjs';

export function nakano(ctx) {
  const { kit, blocks, pave, plot, cover, props, L, S } = ctx;
  const { building, house, tree, zebra, car, crowd, mark, ground, rand, pick, P, R, FX, FY } = kit;
  kit.setSun(0.45);

  // ---- the station: a concourse over the tracks, platforms out to both sides under their canopies
  {
    const p = plot('nakano_eki');
    // the platforms (between the tracks of each pair), their yellow lines
    ground(() => {
      for (const uc of [155, 165])
        for (let x = 2; x < 178; x++) {
          if (x >= p.x && x < p.x + p.w) continue;
          R(FX(x), FY(uc + 1.34), S, 8, 0xbdb9b0);
          R(FX(x), FY(uc + 1.34), S, 1, 0xe8c840);
          R(FX(x), FY(uc + 1.34) + 7, S, 1, 0xe8c840);
        }
    });
    building(p.x, p.u, p.w, p.h, {
      face: 6, style: 'office', wall: 0xd6cec2, roof: 0x8e9298, shop: true, sign: 0x2a6ad0, s: 101,
      top: ({ X, Y, w, h, ac: unit, hut }) => {
        // three long skylights over the concourse, the plant in rows beside them
        for (const k of [0, 1, 2]) {
          const y = Y + 12 + k * Math.floor((h - 34) / 2);
          R(X + 14, y, w - 28, 8, 0x5a7890);
          for (let i = 0; i < w - 28; i++) {
            P(X + 14 + i, y, 0xe4ecf0);
            P(X + 14 + i, y + 7, 0x34485a);
            if (i % 9 === 0) for (let j = 0; j < 8; j++) P(X + 14 + i, y + j, 0xc8d4dc);
            else if ((i + k * 5) % 23 < 5) for (let j = 1; j < 4; j++) P(X + 14 + i, y + j, 0x88a8c0);
          }
        }
        for (let i = 0; i < 6; i++) unit(X + 3 + (i % 2) * 6, Y + 3 + Math.floor(i / 2) * 6);
        for (let i = 0; i < 6; i++) unit(X + w - 14 + (i % 2) * 6, Y + h - 22 + Math.floor(i / 2) * 6);
        hut(X + w - 16, Y + 4, 9, 5, 0x8e9298);
      },
    });
    cover(p.x, p.u, p.w, p.h);
    // the canopies, over the trains
    for (const uc of [155, 165])
      for (const [x0, x1] of [[2, p.x], [p.x + p.w, 178]]) {
        const f = kit.frame(x1 - x0, 3.34, uc, (put, c) => {
          for (let j = 0; j < c.hi.h; j++) for (let i = 0; i < c.hi.w; i++) put(i, j, kit.canopy(i, j, c.hi.h));
        });
        props.loop(x0, uc + 1.67, [f], { fps: 1, d: 0.1 });
      }
    // the trains: silver with an orange band; they pull in, wait, pull out the way they came
    kit.train(157.5, -1, 0xf07a20, { stop: 80, s0: 0.15 });
    kit.train(162.5, 1, 0xf07a20, { stop: 80, s0: 0.6 });
    // the square in front: bus shelters, taxis waiting, people
    for (const x of [66, 104]) {
      mark(x, 190, (X, Y) => {
        R(X, Y, 18, 5, 0xc4ccd4);
        R(X, Y + 4, 18, 1, 0x6a727c);
        R(X + 1, Y + 1, 16, 2, 0x8aa4b8);
      });
      tree('broadleaf', x + 14, 200, 2.6);
    }
    for (const [x, c] of [[70, 0xe8c020], [80, 0x2a6a4a], [108, 0xe8c020]]) car(x, 206.5, false, c);
    crowd(62, 187, 56, 14, 22);
    // the arcade's mouth: a board over it
    mark(90, 194, (X, Y) => {
      R(X - 17, Y - 12, 34, 9, 0xf0c020);
      R(X - 17, Y - 12, 34, 1, 0xfae890);
      R(X - 17, Y - 4, 34, 1, 0xa87c10);
      kit.strokes(X - 14, Y - 11, 28, 7, 0xc03020, 3);
      R(X - 17, Y - 3, 2, 6, 0x8a8e96);
      R(X + 15, Y - 3, 2, 6, 0x8a8e96);
    });
  }

  // ---- under the arcade's glass: the shoppers as shapes, the shop lights along both sides
  ground(() => {
    const r = kit.rand;
    for (let k = 0; k < 80; k++) {
      const [X, Y] = [FX(86.4 + r() * 6.6), FY(202 + r() * 122)];
      R(X, Y, 2, 3, r() < 0.5 ? 0x587888 : 0x6a8a98);
    }
    for (let u = 200; u < 326; u += 3) for (const x of [85.67, 94]) if (r() < 0.7) P(FX(x), FY(u), r() < 0.5 ? 0xfff0c0 : 0xf8d8a0);
  });

  // ---- Nakano Broadway: shops below, flats above, the garden and the old pool on its roof
  {
    const p = plot('nakano_broadway');
    building(p.x, p.u, p.w, p.h, {
      face: 13, style: 'balcony', wall: 0xd8d0c2, roof: 0x9a968c, shop: true, sign: 0xf0c020, s: 202,
      // two slabs of flats side by side on the north two thirds, a light well between them
      tiers: [0, 1].map((k) => ({
        in: k ? [29, 5, 3, 62] : [3, 5, 29, 62], face: 6, style: 'balcony', roof: 0xa6a298,
        top: ({ X, Y, w, h, tank, hut, ac: unit, solar }) => {
          for (let q = 0; q < 3; q++) tank(X + 8 + q * Math.floor((w - 16) / 2), Y + 9, 5);
          hut(X + 5, Y + 24, 11, 6, 0xa6a298);
          for (let q = 0; q < 10; q++) unit(X + 22 + (q % 5) * 7, Y + 26 + Math.floor(q / 5) * 7);
          solar(X + 6, Y + 50, w - 12, 14);
          for (let q = 0; q < 12; q++) unit(X + 6 + (q % 6) * 7, Y + 74 + Math.floor(q / 6) * 7);
          hut(X + w - 18, Y + 96, 11, 6, 0xa6a298);
          for (let q = 0; q < 2; q++) tank(X + 9 + q * 14, Y + h - 22, 5);
          // the tenants' end of the roof: washing on lines, a few units, pot plants along the parapet
          for (let j = 118; j < h - 30; j += 11) {
            const off = ((j * 7) % 5) * 3;
            for (const i0 of [5 + off, (w >> 1) + 2 + (off >> 1)]) {
              if ((i0 + j) % 3 === 0) { unit(X + i0, Y + j); unit(X + i0 + 6, Y + j); continue; }
              R(X + i0, Y + j, 17, 1, 0x5a5e66);
              for (let q = 0; q < 5; q++) if ((q + j + i0) % 4) R(X + i0 + 1 + q * 3, Y + j + 1, 2, 3, PAL.cloth[(q * 3 + j + i0) % PAL.cloth.length]);
            }
          }
          for (let j = 120; j < h - 24; j += 5) if (j % 3) R(X + w - 4, Y + j, 2, 2, j % 2 ? 0x447639 : 0x5a8e44);
        },
      })),
      // the south third: the roof garden with its lawns and parasols, and the pool, long dry, its lanes still painted
      top: ({ X, Y, w, h, greenery, parasol, person, P: put, R: rect }) => {
        const g = Y + h - 176;
        greenery(X + 4, g, w - 8, 78, 31);
        for (let j = 0; j < 78; j += 13) rect(X + 4, g + j, w - 8, 2, 0xc8bca0);
        rect(X + (w >> 1) - 2, g, 4, 78, 0xc8bca0);
        for (const [i, j] of [[18, 20], [w - 26, 34], [30, 60], [w - 40, 66]]) parasol(X + i, g + j, PAL.awning[(i + j) % 6]);
        for (let k = 0; k < 9; k++) person(X + 10 + ((k * 37) % (w - 24)), g + 4 + ((k * 23) % 70), 9 + k);
        rect(X + 8, Y + h - 84, w - 16, 34, 0xe8ecec);
        rect(X + 11, Y + h - 81, w - 22, 28, 0x9ed6dc);
        for (let i = 0; i < w - 22; i += 9) rect(X + 11 + i, Y + h - 81, 1, 28, 0x6ab0c0);
        rect(X + 11, Y + h - 81, w - 22, 2, 0xc4ecf0);
        for (let i = 10; i < w - 12; i += 8) put(X + i, Y + h - 44, 0x6a6e76);
        for (const [i, c] of [[14, 0xd04848], [34, 0x4870c8], [w - 30, 0xe8c040]]) parasol(X + i, Y + h - 24, c);
      },
    });
    // by its doors: banks of capsule machines, a hand-painted board on a trestle each side
    for (const dx of [4, p.w - 16])
      mark(p.x + dx, p.u - 1, (X, Y) => {
        for (let k = 0; k < 6; k++) {
          const c = [0xe03a3a, 0xf0c020, 0x2a6ad0, 0x20a060, 0xd040a0, 0xf07a20][(k + dx) % 6];
          R(X + k * 6, Y - 7, 5, 7, 0xf0f0ec);
          R(X + k * 6, Y - 7, 5, 2, c);
          R(X + k * 6 + 1, Y - 4, 3, 2, 0xa8d0e0);
          P(X + k * 6 + 2, Y - 1, c);
        }
      });
    for (const dx of [20, p.w - 24])
      mark(p.x + dx, p.u - 3, (X, Y) => {
        R(X, Y - 5, 8, 5, 0xf4ecd8);
        kit.strokes(X, Y - 5, 8, 5, dx === 20 ? 0xc03020 : 0x2a4a8a, dx);
        P(X, Y, 0x5a4a3a);
        P(X + 7, Y, 0x5a4a3a);
      });
    crowd(p.x + 18, p.u - 6, 20, 5, 10);
  }

  // ---- Arai Yakushi: a gate, the hall under a copper-green roof, pines and a cherry, stone lanterns
  {
    const p = plot('arai_yakushi');
    pave(p.x, p.u, p.w, p.h, 'gravel');
    ground(() => {
      for (let u = p.u + 9; u < p.u + 28; u++) R(FX(p.x + 13), FY(u), 12, S, (u & 1) ? 0x9a948a : 0xa8a298); // the flagged way to the hall
    });
    house(p.x + 5, p.u + 30, 20, 24, { tile: 0x4c6e60, face: 3, s: 303 });
    house(p.x + 9, p.u + 1, 12, 8, { tile: 0x5a626e, s: 304 });
    for (const x of [p.x + 10, p.x + 20])
      mark(x, p.u + 24, (X, Y) => {
        R(X - 1, Y - 6, 4, 2, 0x8a8a84);
        R(X, Y - 4, 2, 2, 0xf0e0a0);
        R(X, Y - 2, 2, 3, 0x7a7a74);
      });
    tree('pine', p.x + 4, p.u + 18, 3);
    tree('sakura', p.x + 27, p.u + 20, 3.4);
    tree('pine', p.x + 27, p.u + 52, 3);
    tree('broadleaf', p.x + 3, p.u + 46, 2.6);
  }

  // ---- the blocks: shops and offices by the station and along the avenue, houses and flats behind
  for (const b of blocks(0, 700)) {
    const busy = (b[1] >= 100 && b[1] < 330) || b[0] >= 118;
    for (const [x, u, w, h] of lots(b, rand, busy ? { depth: [12, 19], width: [10, 20] } : { depth: [9, 13], width: [8, 14] })) {
      if (w < 6 || h < 7) continue;
      const v = rand();
      if (busy) building(x, u, w - 1, h, { style: pick(['office', 'plain', 'office', 'balcony']), face: 4 + Math.floor(rand() * 5), shop: true, sign: rand() < 0.55 });
      else if (v < 0.58) {
        house(x, u, w - 1, h - 1, { hip: rand() < 0.6, lantern: rand() < 0.08 });
      } else if (v < 0.78) building(x, u, w - 1, h, { style: 'balcony', face: 4 + Math.floor(rand() * 3), wall: pick([0xe4dccc, 0xd8d4cc, 0xc8b8a4, 0xd0c8bc]) });
      else if (v < 0.87) {
        // a coin car park: lines, a few cars, a machine by the way in
        pave(x, u, w - 1, h - 1, 'asphalt');
        ground(() => {
          for (let i = 1; i < w - 1; i += 4) R(FX(x + i), FY(u + h - 2), 1, 5 * S, 0xd8d4c8);
        });
        for (let i = 3; i < w - 3; i += 4) if (rand() < 0.6) car(x + i, u + h - 5, true);
        mark(x + 1, u + 2, (X, Y) => {
          R(X, Y - 5, 4, 5, 0xe8e8e4);
          R(X, Y - 5, 4, 2, 0xd03030);
        });
      } else if (v < 0.95) {
        pave(x, u, w - 1, h - 1, 'park');
        for (let k = 0; k < 2 + Math.floor((w * h) / 60); k++) tree(pick(['broadleaf', 'broadleaf', 'sakura', 'pine', 'tiny']), x + 2 + rand() * (w - 5), u + 2 + rand() * (h - 5), 2 + rand() * 1.6);
      } else building(x, u, w - 1, h, { style: 'plain', face: 3 + Math.floor(rand() * 3) });
    }
  }

  // ---- Ōme-kaidō: street trees along both pavements, crossings at Waseda-dōri and by the station
  for (let u = 12; u < 688; u += 17) {
    if ([60, 118, 206, 268, 548].some((c) => Math.abs(u - c) < 9) || Math.abs(u - 160) < 18) continue;
    tree('broadleaf', 133, u, 2.1);
    tree('broadleaf', 147.4, u + 8, 2.1);
  }
  for (const uc of [206, 548]) {
    zebra(134.4, uc + 6, 11.3, 4, 'u');
    zebra(134.4, uc - 10, 11.3, 4, 'u');
  }
  zebra(127, 544.4, 4, 7.3, 'x');
  zebra(149, 544.4, 4, 7.3, 'x');

  // ---- the Kanda river: cherries leaning over it from the north bank, rails along the water
  for (let x = 5; x < 178; x += 10.5) {
    if (x > 128 && x < 152) continue;
    tree('sakura', x + rand() * 2, 724 + rand() * 2, 3 + rand() * 0.8);
  }
  ground(() => {
    for (let x = 0; x < 180; x += 1) if (!(x > 132 && x < 148)) P(FX(x), FY(721) , x % 3 ? 0xc8c8c0 : 0x6a6a66);
  });
  void shade;
  void L;
  void S;
}
