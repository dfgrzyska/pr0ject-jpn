// Nakano (u 0-700): houses south of the tracks, the station over the Chūō line's four tracks, trains pulling in under it; the glass-roofed
// Sun Mall arcade up to Nakano Broadway, a slab of shops with flats on top and a garden on its roof; Arai
// Yakushi's little temple; low houses under tiled roofs, flats, car parks and pocket gardens along the lanes;
// Ōme-kaidō under its street trees; cherries along the Kanda river. An afternoon.
import { lots } from './blocks.mjs';
import { PAL, shade, blend } from './kit.mjs';
import { fbm, rng } from '../../lib/raster.mjs';
import { hashPx } from '../hires.mjs';

export function nakano(ctx) {
  const { kit, blocks, pave, plot, cover, props, L, S } = ctx;
  const { building, house, tree, zebra, car, crowd, mark, ground, rand, pick, P, R, FX, FY, queue, shadowBox } = kit;
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

  // ---- the Kanda river (u 700-722), the way it runs through Nakano: down in a channel of concrete walls, shallow
  // and clear over stones, waterweed streaming in it, rafts of cherry petals (hana-ikada) drifting where the banks
  // slow it; cherries on both banks leaning out over it until their crowns all but meet, steel railings along the
  // walls, a promenade of tiles on the north bank with benches and lamps, people stopping to look; Ōme-kaidō over
  // it on a bridge with stone parapets and lamps at its corners, a green steel footbridge from the lane at x 40
  {
    for (let k = 0; k < 60; k++) rand(); // (the draws the river took as a ruled line, so the houses after it come out as near as they can to before)
    const kr = rng(7101);
    const { wet, img } = ctx;
    const FW = 180 * S;
    const FH = L * S;
    const hi = img.hi;
    const BRIDGE = [FX(131.4), FX(148.6)]; // (Ōme-kaidō with its pavements)
    const FOOT = [FX(38.5), FX(41.5)]; // (the footbridge)
    const onBridge = (X) => (X >= BRIDGE[0] && X < BRIDGE[1]) || (X >= FOOT[0] && X < FOOT[1]);
    // the channel, column by column: its top (under the north wall's coping) and its bottom row
    const top = new Int32Array(FW).fill(-1);
    const bot = new Int32Array(FW).fill(-1);
    for (let X = 0; X < FW; X++)
      for (let Yy = FY(726); Yy < FY(698); Yy++)
        if (wet[Yy * FW + X] === 2) {
          if (top[X] < 0) top[X] = Yy;
          bot[X] = Yy;
        }
    ctx.claim(0, 697, 180, 37.6); // (both banks are the river's: no block of Shinjuku's on them)
    const WALL = 7; // (fine rows of the north wall's face seen from above: the south wall shows only its coping)
    const fb = (x, y, seed, scale, oct = 2) => fbm(x, y, { seed, scale, octaves: oct });
    ground(() => {
      for (let X = 0; X < FW; X++) {
        if (top[X] < 0 || onBridge(X)) continue;
        const [T, B] = [top[X], bot[X]];
        // the copings: dressed concrete along both walls, lit on top, a dark joint every few metres
        for (const [Yy, lit] of [[T - 2, 1], [T - 1, 0], [B + 1, 1], [B + 2, 0]]) P(X, Yy, X % 26 === 0 ? 0x6e6a62 : lit ? 0xd2cec2 : 0xa8a49a);
        for (let Yy = T; Yy <= B; Yy++) {
          const r = Yy - T;
          let c;
          if (r < WALL) {
            // the north wall's face, in its own shade: panels of board-marked concrete, damp darkening to the water,
            // a band of moss at the waterline, weep holes in a row, rust trailing from the drain outlets, a ladder
            const damp = r / WALL;
            c = shade(0x8e8a80, 0.78 - damp * 0.22 + (fb(X * 0.4, Yy, 7103, 3) - 0.5) * 0.12);
            if (r % 3 === 2) c = shade(c, 0.94);
            if (X % 21 === 0) c = 0x5a564e;
            if (r >= WALL - 2) c = hashPx(X, Yy, 7105) < 0.6 ? 0x4a5a36 : 0x3a4a2c;
            if (r === 2 && X % 21 === 10) c = 0x24221e;
            const pipe = hashPx(Math.floor(X / 40), 1, 7107) < 0.45 && X % 40 >= 18 && X % 40 < 21;
            if (pipe && r < 3) c = r === 0 ? 0x5a5e62 : 0x1a1a1c;
            else if (pipe) c = 0x7a5a3a; // (the rust stain below it)
            const lx = X % 97;
            if (((lx === 40 || lx === 43) || (lx > 40 && lx < 43 && r % 2 === 1)) && r < WALL - 1) c = 0x3a3a3e;
          } else {
            // the water: shallow and clear, in the wall's shadow at first, then over its bed of stones and sand;
            // the current drawing streaks along it, weed streaming, petals gathered into rafts
            const t = (Yy - T - WALL) / Math.max(1, B - T - WALL); // (0 at the wall, 1 at the south coping)
            const deep = 1 - Math.abs(t - 0.45) * 1.6;
            c = blend(0x6a7a5c, 0x2a5258, Math.max(0, Math.min(1, deep * 0.9 + (fb(X * 0.05, Yy * 0.3, 7111, 4) - 0.5) * 0.5)));
            if (r < WALL + 6) c = shade(c, 0.7 + (r - WALL) * 0.05); // (the wall's shadow on the water)
            const streak = fb(X * 0.035, Yy * 0.9, 7113, 3, 3);
            if (streak > 0.68) c = blend(c, 0x8aa8a0, Math.min(1, (streak - 0.68) * 2.2));
            // stones on the bed showing through in the shallows
            if (t > 0.62) {
              const sx = Math.floor(X / 5);
              const sy = Math.floor(Yy / 4);
              const h = hashPx(sx, sy, 7115);
              if (h < 0.4) {
                const d = Math.hypot((X - (sx * 5 + 2 + hashPx(sx, sy, 7116) * 1.5)) / 2.2, (Yy - (sy * 4 + 2)) / 1.6);
                if (d < 1) c = blend(c, h < 0.15 ? 0xa89a7c : 0x7c7462, 0.55 * (1 - d * 0.5));
              }
            }
            // waterweed: dark green strands streaming with the current
            const weed = fb(X * 0.06, Yy * 1.4, 7117, 2);
            if (weed > 0.72 && t > 0.2 && t < 0.85) c = blend(c, hashPx(X, Yy, 7118) < 0.5 ? 0x2e4a26 : 0x4a6a32, 0.75);
            // the petals: rafts of them where the water slows by the walls and behind the stones, strays everywhere
            const raft = fb(X * 0.025, Yy * 0.25, 7119, 3) + (t < 0.18 || t > 0.86 ? 0.16 : 0);
            const g = hashPx(X, Yy, 7121);
            if (raft > 0.66 && g < (raft - 0.62) * 2.4) c = g < 0.12 ? 0xffe8ee : g < 0.3 ? 0xf8c8d6 : 0xe8a8bc;
            else if (g > 0.985) c = 0xf4c4d2;
          }
          P(X, Yy, c);
        }
      }
    });
    // the promenade on the north bank: square tiles, petals swept to its edges; the south bank's strip between the
    // lane and the railing: earth, moss and fallen petals
    ground(() => {
      for (let X = 0; X < FW; X++) {
        if (top[X] < 0 || onBridge(X)) continue;
        for (let Yy = FY(734.4); Yy < top[X] - 2; Yy++) {
          const joint = X % 7 === 0 || Yy % 7 === 0;
          let c = joint ? 0xa49c8c : shade(0xc8bea8, 0.95 + hashPx(X >> 2, Yy >> 2, 7123) * 0.1);
          const g = hashPx(X, Yy, 7125);
          if (g < 0.05 + (Yy > top[X] - 9 ? 0.08 : 0)) c = g < 0.02 ? 0xffe4ec : 0xf0b8cc;
          P(X, Yy, c);
        }
        for (let Yy = bot[X] + 3; Yy < FY(696); Yy++) {
          const g = hashPx(X, Yy, 7127);
          const grass = fb(X * 0.3, Yy * 0.3, 7129, 2);
          P(X, Yy, g < 0.04 ? 0xf0b8cc : g < 0.055 ? 0xffe4ec : grass < 0.62 ? shade((X + Yy * 3) % 5 === 0 ? 0x4e7a3a : 0x5e8a44, 0.9 + g * 0.2) : shade(0x6a5c44, 0.9 + g * 0.16));
        }
      }
    });
    // the railings along the walls' tops: steel posts and two rails, their shadow across the coping
    for (const north of [true, false])
      for (let X0 = 0; X0 < FW; X0 += 48) {
        const X1 = Math.min(FW, X0 + 48);
        const base = (X) => (north ? top[X] - 3 : bot[X] + 4);
        let key = FH;
        for (let X = X0; X < X1; X++) if (top[X] >= 0) key = Math.min(key, base(X));
        if (key === FH) continue;
        queue(key, () => {
          for (let X = X0; X < X1; X++) {
            if (top[X] < 0 || onBridge(X)) continue;
            const Yb = base(X);
            P(X, Yb - 3, 0xc4ccce);
            P(X, Yb - 1, 0x8a9496);
            if (X % 9 === 0) for (let j = 0; j < 4; j++) P(X, Yb - j, j === 3 ? 0xd8dee0 : 0x6a7476);
            hi.tint(X + 1, Yb + 1, 0.8);
          }
        });
      }
    // the bridges: Ōme-kaidō's stone parapets and its lamps; the footbridge's green railings; their shadows
    // across the water, to the lower right
    ground(() => {
      for (const [X0, w] of [[BRIDGE[1], 7], [FOOT[1], 4]])
        for (let i = 0; i < w; i++) {
          const X = X0 + i;
          if (top[X] < 0) continue;
          for (let Yy = top[X] + 1; Yy <= bot[X]; Yy++) hi.tint(X, Yy, 0.62 + i * 0.03);
        }
    });
    for (const [XL, XR, kind] of [[BRIDGE[0], BRIDGE[1] - 2, 'stone'], [FOOT[0] - 1, FOOT[1], 'steel']]) {
      const [YA, YB] = [Math.min(top[XL - 1], top[XR + 2]) - 3, Math.max(bot[XL - 1], bot[XR + 2]) + 3];
      queue(YB + 1, () => {
        for (const X of [XL, XR])
          for (let Yy = YA - 2; Yy <= YB + 2; Yy++) {
            const k = Yy - YA + 2;
            if (kind === 'stone') {
              P(X, Yy, k % 8 === 0 ? 0xe0dcd0 : 0xbcb8ac);
              P(X + 1, Yy, k % 8 === 0 ? 0x9a968a : 0x8a867c);
            } else P(X, Yy, k % 4 === 0 ? 0x2e5a44 : 0x4a8a64);
          }
        if (kind === 'stone')
          for (const X of [XL, XR])
            for (const Yy of [YA - 3, YB + 3]) {
              R(X - 1, Yy - 1, 3, 3, 0xd8d4c8); // (the pillar at each corner, a lamp on it)
              kit.lamp(X, Yy - 1);
              P(X + (X === XL ? 2 : -2), Yy + 1, 0x6a5232); // (the bridge's name on a bronze plate)
            }
      });
    }
    // the cherries: on both banks, leaning out over the water, of every size; a few young ones newly planted
    const banks = [];
    for (let x = 3 + kr() * 4; x < 178; x += 8.5 + kr() * 4.5) banks.push([x, true]);
    for (let x = 7 + kr() * 4; x < 178; x += 9 + kr() * 5) banks.push([x, false]);
    for (const [x, north] of banks) {
      if ((x > 126 && x < 154) || (x > 35 && x < 45)) continue;
      const X = FX(x);
      if (top[X] < 0) continue;
      const edge = north ? L - top[X] / S : L - bot[X] / S;
      const r = kr() < 0.12 ? 2.2 + kr() * 0.6 : 3.4 + kr() * 1.6;
      const lean = (north ? -1 : 1) * (1.2 + kr() * 1.6);
      tree('sakura', x + (kr() - 0.5) * 1.5, edge + (north ? 3.2 : -2.4) + lean, r, Math.floor(kr() * 1e9));
    }
    // along the street side of the promenade: a hedge of clipped azaleas in a stone kerb, zelkovas over it; where the
    // river swings south and the bank is wide, a pocket of lawn with a bench, a vending machine and bicycles
    ground(() => {
      for (let X = 0; X < FW; X++) {
        if (top[X] < 0 || onBridge(X) || (X >= FX(36) && X < FX(44))) continue;
        for (let Yy = FY(734.2); Yy < FY(732); Yy++) {
          const k = Yy - FY(734.2);
          const g = hashPx(X, Yy, 7133);
          P(X, Yy, k === 0 || Yy === FY(732) - 1 ? 0x9a968c : g < 0.06 ? 0xd84a8a : g < 0.1 ? 0xf08ab8 : shade(g < 0.5 ? 0x3e6a34 : 0x4e7c3c, 0.9 + hashPx(X >> 1, Yy, 7134) * 0.2));
        }
        const wide = top[X] - 4 - FY(731.6);
        if (wide > 3 * S + 4)
          for (let Yy = FY(731.6) + 2; Yy < FY(731.6) + 2 + Math.min(wide - 3 * S, 4 * S); Yy++) {
            const g = hashPx(X, Yy, 7135);
            P(X, Yy, g < 0.04 ? 0xf0b8cc : shade((X + Yy * 2) % 7 === 0 ? 0x5a8a44 : 0x669650, 0.92 + g * 0.14));
          }
      }
    });
    for (let x = 8; x < 178; x += 14 + kr() * 4) {
      if ((x > 128 && x < 152) || (x > 34 && x < 46)) continue;
      tree('broadleaf', x, 733.4, 2.1 + kr() * 0.5, Math.floor(kr() * 1e9));
    }
    for (const x of [96, 112]) {
      const X = FX(x);
      const Yy = FY(729);
      queue(Yy + 6, () => {
        R(X, Yy, 3, 6, 0xd83a30); // (a vending machine: red, its white panel, the buttons)
        R(X, Yy + 2, 3, 2, 0xf0f0ec);
        P(X + 1, Yy + 4, 0x3a8ad0);
        for (let i = 0; i < 4; i++) {
          // bicycles in a row beside it
          const BX = X + 5 + i * 2;
          P(BX, Yy + 1, 0x2a2a30);
          P(BX, Yy + 2, [0xc83a3a, 0xe8e8e8, 0x3a6ac8, 0xe8c040][i]);
          P(BX, Yy + 3, [0xc83a3a, 0xe8e8e8, 0x3a6ac8, 0xe8c040][i]);
          P(BX, Yy + 4, 0x2a2a30);
        }
      }, () => shadowBox(X, Yy, 3, 6, 3, 0.66));
    }
    // benches facing the water, lamps along the promenade
    for (let x = 14; x < 178; x += 31) {
      if (x > 126 && x < 156) continue;
      const X = FX(x + kr() * 6);
      if (top[X] < 0) continue;
      const Yb = top[X] - 7;
      queue(Yb + 2, () => {
        R(X, Yb, 8, 2, 0x8a6a48);
        R(X, Yb, 8, 1, 0xa88a60);
        P(X + 1, Yb + 2, 0x3a3436);
        P(X + 6, Yb + 2, 0x3a3436);
      }, () => shadowBox(X, Yb, 8, 2, 2, 0.7));
    }
    for (const x of [20, 66, 112, 168]) {
      const X = FX(x);
      if (top[X] > 0) queue(top[X] - 6, () => kit.lamp(X, top[X] - 6));
    }
    // people: along the promenade and at the railings, looking down at the petals, a phone raised; some crossing
    // the footbridge; a white dog on its lead
    for (let k = 0; k < 34; k++) {
      const x = 2 + kr() * 176;
      const atRail = kr() < 0.4;
      const f = kr();
      if ((x > 129 && x < 151) || (x > 37 && x < 43)) continue;
      const X = FX(x);
      if (top[X] < 0) continue;
      const Yy = atRail ? top[X] - 8 : Math.round(FY(733.5) + f * (top[X] - 10 - FY(733.5)));
      queue(Yy + 4, () => {
        kit.person(X, Yy, 7200 + k);
        if (atRail && hashPx(k, 3, 7131) < 0.5) P(X + 2, Yy + 1, 0xe8ecf0); // (the phone)
      });
    }
    for (let k = 0; k < 3; k++) {
      const Yy = FY(705 + k * 9);
      queue(Yy + 4, () => kit.person(FX(39.3), Yy, 7300 + k));
    }
    {
      const X = FX(96);
      const Yy = top[X] - 9;
      queue(Yy + 2, () => {
        R(X, Yy, 3, 2, 0xe8e0d0);
        P(X + 3, Yy - 1, 0xe8e0d0);
        P(X + 3, Yy, 0x2a2228);
      });
    }
    // in the water: a little egret standing in the shallows, carp holding against the current; ducks paddling
    for (const [x, du] of [[62, 1], [158, 0]]) {
      const X = FX(x);
      const Yy = bot[X] - 3 + du;
      queue(Yy + 1, () => {
        R(X, Yy - 3, 2, 3, 0xf4f4f0);
        P(X + 1, Yy - 4, 0xf4f4f0);
        P(X + 2, Yy - 4, 0x2a2a2a);
        P(X, Yy, 0x2a2a2a);
        P(X + 1, Yy, 0xe0c040);
        hi.tint(X + 1, Yy + 1, 0.7);
      });
    }
    ground(() => {
      for (const [x, c] of [[24, 0x3a3a34], [27, 0x3a3a34], [88, 0xe8783a], [118, 0x3a3a34], [170, 0xf0ece4]]) {
        const X = FX(x);
        const Yy = Math.round((top[X] + WALL + bot[X]) / 2);
        for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) if (!(i === 5 && j === 1)) P(X + i, Yy + j, blend(c, 0x2c4c4c, 0.45));
      }
    });
    const duck = (k) =>
      kit.frame(2.34, 1.67, 712, (put) => {
        for (const [i, j] of [[1, 2], [2, 2], [3, 2], [4, 2], [2, 3], [3, 3], [4, 3], [5, 3]]) put(i, j, j === 3 ? 0x6a5a44 : 0x8a7454);
        put(5 - k, 1, 0x3a5a3a);
        put(6 - k, 1, 0x3a5a3a);
        put(6 - k, 2, 0xe0b030);
        for (let i = 1; i < 6; i++) put(i, 4, 0xc8d8d4, 0.5);
      });
    const ducks = [duck(0), duck(1)];
    for (const [x, n] of [[78, 2], [104, 2], [170, 1]]) {
      const X = FX(x);
      props.wander(x, L - (top[X] + WALL + bot[X]) / 2 / S, 6, 0.8, ducks, { n, sp: 1.6, turn: 'flip', fps: 1, idle: 0.4 });
    }
    // petals coming down off the trees onto the water and the paths
    const petals = (k) =>
      kit.frame(4, 4, 712, (put) => {
        for (let q = 0; q < 5; q++) put(Math.floor(hashPx(q, 1, 9) * 8) + k, Math.floor(hashPx(q, 2, 9) * 6) + k * 1.4 | 0, q % 2 ? 0xffd0e0 : 0xffb0cc, 0.9 - k * 0.15);
      }, true);
    props.spot([[0, 728, 128, 30], [152, 728, 28, 30]], [petals(0), petals(1), petals(2), petals(3)], { rate: 7, fps: 5, a: 0.8 });
  }
  void shade;
  void L;
  void S;
}
