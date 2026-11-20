// Shinjuku (u 700-2100), in the gold of late afternoon, the towers' shadows long across the avenues:
//   the west side - nine skyscrapers, each its own (stone grids, curtain walls, a cocoon of white lattice), the
//     city hall's twin tower over its half-round plaza, Chūō park under its trees;
//   the station - ten tracks under five platform canopies, trains of four lines pulling in and out, the store
//     over the west exit with a beer garden on its roof, taxis in the forecourt, the bus terminal's deck, the
//     smoky lane of grills by the tracks;
//   the east side - department stores with banners down their fronts and gardens, a shrine, a playground on
//     their roofs; Yasukuni-dōri; Kabukichō behind its red gate, blocks hung with signs; the tiny bars of
//     Golden Gai;
//   Shinjuku Gyoen - lawns with picnics, cherry groves, the ponds with a bridge, the glasshouse, the tea
//     house, the formal garden's plane trees and rose beds.
// Live: the trains, cars up and down Ōme-kaidō, the gate's lamps, smoke off the grills.
import { lots } from './blocks.mjs';
import { PAL, shade, blend } from './kit.mjs';
import { hashPx } from '../hires.mjs';
import { fbm, rng } from '../../lib/raster.mjs';
import { near } from './geom.mjs';

export function shinjuku(ctx) {
  const { kit, blocks, pave, plot, claim, props, L, S } = ctx;
  const { building, house, tree, zebra, car, crowd, mark, ground, rand, pick, P, R, FX, FY, queue, shadowBox } = kit;
  kit.setSun(0.78);

  // ---- the towers of the west side
  const crown = (n, face = 4) => (n ? [{ in: [3, 3, 3, 3], face, tiers: crown(n - 1, face) }] : undefined);
  const TOWERS = {
    nishi_a: { face: 62, style: 'office', wall: 0xdcccac, roof: 0x9a9488, tiers: [{ in: [4, 4, 4, 4], face: 4, heli: 1 }] },
    nishi_e: { face: 66, style: 'glass', glass: [0x24406c, 0x8cb8dc], roof: 0x70747c, tiers: crown(2, 5) },
    nishi_w: { face: 56, style: 'office', wall: 0xe8e0d0, roof: 0xa8a49c, tiers: [{ in: [5, 5, 5, 5], face: 3, heli: 1 }] },
    nishi_f: { face: 72, style: 'glass', glass: [0x2c5c58, 0xa4d8cc], roof: 0x6c7a74, tiers: crown(1, 6) },
    nishi_c: { face: 82, style: 'office', wall: 0xeae6de, roof: 0xb0a898, tiers: [{ in: [3, 3, 3, 3], face: 5, tiers: [{ in: [6, 6, 6, 6], face: 4, heli: 1 }] }] },
    nishi_d: { face: 86, style: 'glass', glass: [0x5a4634, 0xdcbc8c], roof: 0x8c7c70, tiers: crown(3, 4) },
    nishi_g: { face: 78, style: 'granite', wall: 0xa8a8a4, roof: 0x7c8494, tiers: [{ in: [4, 4, 4, 4], face: 5, heli: 1 }] },
    nishi_v: { face: 74, style: 'glass', glass: [0x34486c, 0xb4cce4], roof: 0x848c8e, tiers: [{ in: [2, 2, 14, 2], face: 8 }, { in: [22, 6, 2, 2], face: 4 }] },
  };
  for (const [id, o] of Object.entries(TOWERS)) {
    const p = plot(id);
    building(p.x, p.u, p.w, p.h, { ...o, s: id.charCodeAt(6) * 13 });
    // a mast with its warning lamps on the tallest
    if (o.face > 70) mark(p.x + p.w / 2, p.u + p.h - 6, (X, Y) => kit.mast(X, Y, 16), p.u);
    // the forecourt: planters and people at its door
    for (let k = 0; k < 3; k++) tree('broadleaf', p.x + 4 + k * ((p.w - 8) / 2), p.u - 2.4, 1.8);
    crowd(p.x + 4, p.u - 5, p.w - 8, 3, 5);
  }

  // ---- the cocoon: a round tower swelling towards its middle, dark glass under a web of white lattice
  {
    const p = plot('nishi_b');
    pave(p.x, p.u, p.w, p.h, 'plaza', 45);
    const [X0, YT, YB] = [FX(p.x), FY(p.u + p.h), FY(p.u)];
    const [cw, ch] = [p.w * 3, YB - YT];
    const cx = cw / 2;
    const rAt = (t) => (cw / 2 - 3) * (0.62 + 0.38 * Math.sin(Math.PI * Math.min(1, 0.12 + t * 0.9))); // its girth, top to foot
    const ry = (r) => r * 0.42;
    const top = ry(rAt(0)) + 2;
    const span = ch - top - ry(rAt(1)) - 2;
    queue(
      YB,
      () => {
        for (let j = 0; j < ch; j++)
          for (let i = 0; i < cw; i++) {
            // in the tower if in the ellipse of some level between the top and the foot
            let hit = -1;
            for (let k = 0; k <= 48 && hit < 0; k++) {
              const t = k / 48;
              const r = rAt(t);
              if (((i + 0.5 - cx) / r) ** 2 + ((j + 0.5 - top - t * span) / ry(r)) ** 2 <= 1) hit = t;
            }
            if (hit < 0) continue;
            const r0 = rAt(0);
            const cap = ((i + 0.5 - cx) / r0) ** 2 + ((j + 0.5 - top) / ry(r0)) ** 2;
            let c;
            if (cap <= 1) c = cap > 0.8 ? 0xf4f6f8 : cap > 0.3 ? 0xc4ccd4 : 0x8c98a4; // its cap
            else {
              const lat = (i + j * 1.2) % 13 < 2 || (i - j * 1.2 + 4000) % 13 < 2;
              const side = (i - cx) / rAt(Math.min(1, Math.max(0, (j - top) / span))); // -1 .. 1 round the tower
              c = lat ? shade(0xeef2f6, side > 0.5 ? 0.8 : 1) : blend(0x4a78a8, 0x1c3050, Math.min(1, Math.max(0, side * 0.6 + 0.5)));
            }
            P(X0 + i, YT + j, c);
          }
      },
      () => shadowBox(X0 + 6, YT + 20, cw - 12, ch - 24, Math.round(64 * 3 * 0.78), 0.62),
    );
    for (let k = 0; k < 3; k++) tree('broadleaf', p.x + 5 + k * 13, p.u - 2.4, 1.8);
  }

  // ---- the city hall: a half-round plaza ringed by a colonnade, behind it the tower that splits in two
  {
    const p = plot('tocho');
    pave(p.x, p.u, p.w, p.h, 'plaza', 43);
    ground(() => {
      const [cx, cu] = [p.x + p.w / 2, p.u + 34];
      for (let u = p.u + 1; u < p.u + 36; u += 1 / 3)
        for (let x = p.x + 2; x < p.x + p.w - 2; x += 1 / 3) {
          const d = Math.hypot(x - cx, (u - cu) * 1.1);
          if (d > 31 || u > cu) continue;
          const a = Math.atan2(cu - u, x - cx);
          const ring = d > 28.4;
          P(FX(x), FY(u), ring ? (Math.floor(a * 24) % 2 ? 0xe8e4dc : 0x8a8680) : Math.floor(d) % 6 === 0 || Math.floor(a * 9) % 3 === 0 ? 0xa49c90 : 0xc4bcae);
        }
    });
    building(p.x + 3, p.u + 38, p.w - 6, p.h - 38, {
      face: 44, style: 'granite', wall: 0xb0aca4, roof: 0x8a8880, s: 404,
      tiers: [0, 1].map((k) => ({
        in: k ? [36, 3, 3, 4] : [3, 3, 36, 4], face: 15, style: 'granite', roof: 0x969490,
        tiers: [{ in: [3, 3, 3, 3], face: 4 }],
      })),
    });
    for (const dx of [14, p.w - 14]) mark(p.x + dx, p.u + p.h - 12, (X, Y) => kit.mast(X, Y, 18), p.u + 38);
    crowd(p.x + 14, p.u + 6, p.w - 28, 18, 26);
    for (const dx of [8, p.w - 8]) tree('broadleaf', p.x + dx, p.u + 4, 2.6);
  }

  // ---- Chūō park: trees thick round a lawn, a cascade into its pool, a playground
  {
    for (let k = 0; k < 46; k++) {
      const [x, u] = [2 + rand() * 34, 880 + rand() * 120];
      if (Math.hypot(x - 19, (u - 936) * 0.6) < 11) continue;
      tree(pick(['broadleaf', 'broadleaf', 'broadleaf', 'sakura', 'pine']), x, u, 2.4 + rand() * 1.8);
    }
    mark(19, 962, (X, Y) => {
      R(X - 21, Y, 42, 12, 0x8a8a84);
      for (let i = 0; i < 40; i++) for (let j = 0; j < 10; j++) P(X - 20 + i, Y + 1 + j, (i + j * 2) % 5 < 2 ? 0xf0f8fc : 0xa8d4e4);
      R(X - 24, Y + 12, 48, 9, 0x3c7a8c);
      for (let i = 0; i < 48; i += 3) P(X - 24 + i, Y + 13 + (i % 2), 0xd8f0f4);
    });
    crowd(8, 926, 22, 16, 12);
  }

  // ---- the station: platforms and their canopies over the ten tracks, the trains of four lines
  {
    const tracks = (k) => 1243.5 + 5 * k;
    const plats = [1246, 1256, 1266, 1276, 1286];
    ground(() => {
      for (const uc of plats)
        for (let x = 0; x < 180; x++) {
          R(FX(x), FY(uc + 1.34), 3, 8, 0xbdb9b0);
          R(FX(x), FY(uc + 1.34), 3, 1, 0xe8c840);
          R(FX(x), FY(uc + 1.34) + 7, 3, 1, 0xe8c840);
        }
    });
    for (const [k, uc] of plats.entries()) {
      const f = kit.frame(180, 3.34, uc, (put, c) => {
        for (let j = 0; j < c.hi.h; j++)
          for (let i = 0; i < c.hi.w; i++) {
            if ((i + k * 40) % 190 > 160) continue; // (a gap in the canopy: the platform's open end)
            put(i, j, kit.canopy(i, j, c.hi.h));
          }
      });
      props.loop(0, uc + 1.67, [f], { fps: 1, d: 0.1 });
    }
    const LINES = [[0, -1, 0x9acd32, 0.1], [1, 1, 0x9acd32, 0.55], [2, -1, 0xf07a20, 0.8], [3, 1, 0xf07a20, 0.3], [5, -1, 0xf0d020, 0.45], [6, 1, 0x3a7ad0, 0.95], [8, -1, 0x2aa8a0, 0.2], [9, 1, 0xd03a5a, 0.7]];
    for (const [k, from, band, s0] of LINES) kit.train(tracks(k), from, band, { stop: 70 + ((k * 23) % 40), n: 7, hold: 6 + (k % 3) * 2, s0 });

    // the store over the west exit: a band for its name, a beer garden and a little shrine on the roof
    const w = plot('shinjuku_eki_nishi');
    building(w.x, w.u, w.w, w.h, {
      face: 13, style: 'depato', wall: 0xe4dccc, trim: 0x2a5a9a, roof: 0x9a958a, shop: true, s: 505,
      top: ({ X, Y, w: rw, h: rh, parasol, tank, ac: unit, greenery, person, R: rect }) => {
        rect(X + 6, Y + 6, 96, rh - 12, 0xb4a88c); // the decking
        for (let k = 0; k < 14; k++) parasol(X + 14 + (k % 7) * 13, Y + 14 + Math.floor(k / 7) * 22, PAL.awning[(k * 3) % PAL.awning.length]);
        for (let k = 0; k < 16; k++) person(X + 10 + ((k * 29) % 88), Y + 10 + ((k * 17) % (rh - 24)), 40 + k);
        greenery(X + 110, Y + 6, 40, 14, 5);
        // the shrine: a red gate, a tiny hall
        rect(X + 122, Y + 24, 12, 2, 0xd03a2a);
        rect(X + 123, Y + 26, 2, 7, 0xd03a2a);
        rect(X + 131, Y + 26, 2, 7, 0xd03a2a);
        rect(X + 124, Y + 36, 8, 8, 0x5a626e);
        rect(X + 124, Y + 40, 8, 1, 0x8a94a0);
        for (let k = 0; k < 4; k++) tank(X + 166 + k * 13, Y + 14, 5);
        for (let k = 0; k < 24; k++) unit(X + 160 + (k % 8) * 7, Y + 30 + Math.floor(k / 8) * 7);
        for (let k = 0; k < 10; k++) unit(X + 224 + (k % 5) * 7, Y + 10 + Math.floor(k / 5) * 7);
        void rw;
      },
    });
    // its forecourt: taxis in a rank, bus shelters, people streaming to the gates
    claim(20, 1177, 104, 19);
    pave(20, 1177, 104, 19, 'plaza', 47);
    for (let k = 0; k < 6; k++) car(28 + k * 7.5, 1181, false, k % 3 ? 0xe8c020 : 0x2a6a4a);
    for (const x of [84, 104])
      mark(x, 1188, (X, Y) => {
        R(X, Y, 20, 5, 0xc4ccd4);
        R(X, Y + 4, 20, 1, 0x6a727c);
        R(X + 1, Y + 1, 18, 2, 0x8aa4b8);
      });
    crowd(24, 1186, 96, 8, 40);

    // the east side's station building: a big screen on its wall (a picture of nothing in particular)
    const e = plot('shinjuku_eki_higashi');
    building(e.x, e.u, e.w, e.h, {
      face: 12, style: 'office', wall: 0xcfc8bc, roof: 0x848c8e, shop: true, s: 506,
      top: ({ X, Y, h: rh, solar, ac: unit, hut, greenery }) => {
        solar(X + 8, Y + 8, 80, 20);
        greenery(X + 100, Y + 8, 60, 16, 9);
        hut(X + 176, Y + 8, 14, 7, 0x848c8e);
        for (let k = 0; k < 30; k++) unit(X + 204 + (k % 10) * 7, Y + 8 + Math.floor(k / 10) * 7);
        for (let k = 0; k < 12; k++) unit(X + 10 + k * 8, Y + rh - 12);
      },
    });
    mark(e.x + 34, e.u + 11.4, (X, Y) => {
      R(X, Y, 96, 20, 0x1c2230);
      for (let j = 1; j < 19; j++) for (let i = 1; i < 95; i++) P(X + i, Y + j, blend(blend(0x3060c0, 0xf06aa0, i / 95), 0xffe890, Math.max(0, 1 - Math.hypot((i - 60) / 30, (j - 6) / 9))));
    }, e.u);

    // the bus terminal: a deck over the tracks' end, coaches nosed into their bays
    const b = plot('basu_taminaru');
    building(b.x, b.u, b.w, b.h, {
      face: 5, style: 'plain', wall: 0xb8b4ac, roof: 0x5c5e66, s: 507,
      top: ({ X, Y, w: rw, h: rh, R: rect }) => {
        for (let k = 0; k < 6; k++) {
          const y = Y + 6 + k * Math.floor((rh - 20) / 5);
          rect(X + 4, y + 11, rw - 8, 1, 0xd8d4c8);
          if (k === 5) break;
          const c = [0xf0f0ec, 0x3a6ab0, 0xd04040, 0xf0f0ec, 0x3a8a5a][k];
          rect(X + 10 + (k % 2) * 30, y, 26, 9, c);
          rect(X + 10 + (k % 2) * 30, y + 3, 26, 2, shade(c, 0.8));
          rect(X + 10 + (k % 2) * 30 + (k % 2 ? 0 : 23), y + 1, 3, 7, 0x2c3a4c);
        }
      },
    });

    // the lane of grills: lanterns over every door, smoke
    const o = plot('omoide_yokocho');
    pave(o.x, o.u, o.w, o.h, 'asphalt', 49);
    for (let u = o.u + 1; u < o.u + o.h - 6; u += 7) {
      house(o.x, u, 7, 6, { hip: false, lantern: true, tile: pick([0x7c6050, 0x565c6c, 0x8a6a54]) });
      house(o.x + 9, u, 7, 6, { hip: false, lantern: true, tile: pick([0x7c6050, 0x565c6c, 0x62726a]) });
    }
    for (const du of [8, 22, 36]) kit.smoke(o.x + 8, o.u + du, { rate: 0.9 });
    for (let u = o.u + 2; u < o.u + o.h - 2; u += 4) mark(o.x + 8, u, (X, Y) => kit.lantern(X - 1, Y));
  }

  // ---- the department stores of the east side
  {
    const roofs = [
      // a beer garden
      ({ X, Y, w, h, parasol, person, R: rect, tank }) => {
        rect(X + 6, Y + 6, w - 44, h - 12, 0xb4a88c);
        for (let k = 0; k < 10; k++) parasol(X + 14 + (k % 5) * Math.floor((w - 60) / 4), Y + 14 + Math.floor(k / 5) * Math.floor((h - 30) / 1), PAL.awning[(k * 5) % PAL.awning.length]);
        for (let k = 0; k < 12; k++) person(X + 10 + ((k * 31) % (w - 56)), Y + 10 + ((k * 19) % (h - 24)), 60 + k);
        for (let k = 0; k < 3; k++) tank(X + w - 22, Y + 12 + k * 14, 5);
      },
      // a garden with a playground
      ({ X, Y, w, h, greenery, R: rect, ac: unit, hut }) => {
        greenery(X + 6, Y + 6, w - 50, h - 14, 15);
        rect(X + 14, Y + 14, 22, 3, 0xe8c040);
        rect(X + 14, Y + 20, 3, 14, 0xd04848);
        rect(X + 33, Y + 20, 3, 14, 0x4870c8);
        for (let k = 0; k < 3; k++) rect(X + 48 + k * 8, Y + 22, 5, 5, [0xe88840, 0x48a868, 0xf0a0b8][k]);
        hut(X + w - 36, Y + 8, 14, 6, 0x9a958a);
        for (let k = 0; k < 15; k++) unit(X + w - 38 + (k % 5) * 7, Y + 30 + Math.floor(k / 5) * 7);
      },
      // plant and a shrine
      ({ X, Y, w, h, R: rect, ac: unit, tank, solar, greenery }) => {
        solar(X + 6, Y + 6, Math.min(60, w - 60), 20);
        // the shrine's own garden round it, a gravel walk up to the gate, benches
        greenery(X + w - 58, Y + 6, 44, 30, 23);
        rect(X + w - 41, Y + 8, 16, 26, 0xc8bca0);
        for (let k = 0; k < 3; k++) rect(X + 12 + k * 22, Y + 34, 10, 3, 0x8a6a48);
        for (let k = 0; k < 2; k++) rect(X + 74 + k * 26, Y + 10 + k * 14, 14, 9, [0xe8e8e4, 0xc8ccd0][k]); // (skylights)
        rect(X + w - 40, Y + 8, 14, 2, 0xd03a2a);
        rect(X + w - 39, Y + 10, 2, 8, 0xd03a2a);
        rect(X + w - 29, Y + 10, 2, 8, 0xd03a2a);
        rect(X + w - 38, Y + 22, 10, 9, 0x5a626e);
        for (let k = 0; k < 2; k++) tank(X + w - 14, Y + 12 + k * 14, 5);
        for (let k = 0; k < 24; k++) unit(X + 8 + (k % 12) * 7, Y + h - 22 + Math.floor(k / 12) * 7);
      },
    ];
    const SPEC = { depato_a: [0x8a2a2a, 0xe0d8c8, 15], depato_b: [0x2a4a7a, 0xd6d2c8, 13], depato_c: [0x2e6a4a, 0xe4dccc, 16], depato_d: [0x6a3a7a, 0xcfc8bc, 14], depato_e: [0xa86a20, 0xd8cfc0, 12] };
    for (const [k, [id, [trim, wall, face]]] of Object.entries(SPEC).entries()) {
      const p = plot(id);
      building(p.x, p.u, p.w, p.h, { face, style: 'depato', wall, trim, roof: pick(PAL.roofs), shop: true, top: roofs[k % 3], s: 600 + k });
    }
    crowd(4, 1396, 126, 8, 46);
    crowd(4, 1337, 126, 5, 22);
  }

  // ---- Yasukuni-dōri: cars held at the lights on both sides of Ōme-kaidō, the crossing in front of the gate
  for (let k = 0; k < 5; k++) {
    car(124 - k * 7.4, 1563 + (k % 2) * 3.4, false);
    if (k < 3) car(172 - k * 7.4, 1570 + (k % 2) * 3.4, false, undefined, true);
    car(34 + k * 7.4, 1570.2 + (k % 2) * 3.4, false, undefined, true);
  }
  zebra(87, 1561.3, 10, 13.4, 'x');

  // ---- Kabukichō: the red gate with its lamps, blocks hung with signs, a cinema with a billboard on its roof
  {
    const g = plot('kabukicho_mon');
    ctx.paint(g.x, g.u, g.x + g.w, g.u + g.h, (x, u, X, Y) => ((X + Y) % 6 === 0 ? 0xa39b8c : 0xb9b1a0)); // (the street runs on under it)
    const lamps = (on) =>
      kit.frame(24, 5, g.u, (put) => {
        for (let i = 0; i < 72; i++) {
          put(i, 0, 0x8a1a18);
          for (let j = 1; j < 11; j++) put(i, j, j === 1 ? 0xf06048 : 0xd02a22);
          put(i, 11, 0x8a1a18);
          if (i % 6 === 2) for (let j = 4; j < 8; j++) for (const d of [0, 1]) put(i + d, j, (Math.floor(i / 6) + on) % 2 ? 0xfff8d0 : 0xe8a040);
        }
        for (let j = 12; j < 15; j++) for (const i of [0, 1, 2, 69, 70, 71]) put(i, j, 0xa82420);
      });
    props.loop(g.x, g.u + 8, [lamps(0), lamps(1)], { fps: 3 });
    ground(() => {
      for (const dx of [0, 23]) R(FX(g.x + dx), FY(g.u + 4), 3, 12, 0xa82420);
    });
    for (const [id, face] of [['kabukicho_a', 13], ['kabukicho_b', 11], ['kabukicho_d', 12], ['kabukicho_e', 14]]) {
      const p = plot(id);
      // cut the plot into a few buildings standing shoulder to shoulder
      for (const [x, u, w, h] of lots([p.x, p.u, p.w, p.h], rand, { depth: [22, 30], width: [14, 24], lane: 0 })) building(x, u, w, h, { style: 'neon', wall: pick([0x4a4654, 0x5a5460, 0x3e4250, 0x54504c]), face: face - Math.floor(rand() * 4), shop: true, sign: true });
    }
    const c = plot('kabukicho_c');
    building(c.x, c.u, c.w, c.h, {
      face: 15, style: 'neon', wall: 0x4a4654, roof: 0x70747c, shop: true, s: 707,
      top: ({ X, Y, w, h, ac: unit, tank }) => {
        for (let k = 0; k < 18; k++) unit(X + 8 + (k % 9) * 7, Y + 8 + Math.floor(k / 9) * 7);
        for (let k = 0; k < 3; k++) tank(X + w - 14, Y + 12 + k * 13, 5);
        void h;
      },
    });
    // the billboard on the cinema's roof edge: a sunset over a sea, no one's face
    mark(c.x + 6, c.u + 15 + 9, (X, Y) => {
      R(X - 1, Y - 1, 134, 30, 0x2a2630);
      for (let j = 0; j < 28; j++)
        for (let i = 0; i < 132; i++) {
          const sun = Math.hypot(i - 90, j - 15);
          P(X + i, Y + j, j > 17 ? ((i + j * 3) % 9 < 3 ? 0xf0a060 : 0x284a7a) : sun < 7 ? 0xfff0b0 : blend(0x6a3a8a, 0xf08050, j / 17));
        }
      for (const i of [10, 120]) R(X + i, Y + 29, 2, 6, 0x5a5a62);
    }, c.u);
    crowd(88, 1582, 8, 214, 60);
  }

  // ---- Golden Gai: six alleys of bars a few steps wide, a lantern at every door
  {
    const p = plot('golden_gai');
    pave(p.x, p.u, p.w, p.h, 'asphalt', 51);
    for (const [x, u, w, h] of lots([p.x + 1, p.u + 1, p.w - 2, p.h - 2], rand, { depth: [6, 7], width: [5, 8], lane: 2 })) house(x, u, w - 0.67, h, { hip: false, lantern: rand() < 0.7, tile: pick([0x7c6050, 0x565c6c, 0x8a6a54, 0x62726a, 0x6e7480, 0x5a4a44]), face: 2 });
    for (let k = 0; k < 4; k++) tree('tiny', p.x + 3 + rand() * (p.w - 6), p.u + 4 + rand() * (p.h - 8), 1.6);
  }

  // ---- the blocks left over: offices on the west side, shops and signs on the east
  for (const b of blocks(700, 2100)) {
    const west = b[1] < 1190;
    const kabuki = b[1] >= 1576 && b[1] < 1806;
    for (const [x, u, w, h] of lots(b, rand, west ? { depth: [18, 30], width: [14, 26] } : { depth: [12, 20], width: [9, 18] })) {
      if (w < 6 || h < 8) continue;
      if (west) building(x, u, w - 1, h, { style: pick(['office', 'glass', 'office', 'granite']), face: 8 + Math.floor(rand() * 9), heli: 0.2, shop: rand() < 0.5 });
      else building(x, u, w - 1, h, { style: kabuki ? pick(['neon', 'neon', 'office']) : pick(['office', 'neon', 'plain', 'depato']), wall: kabuki ? pick([0x4a4654, 0x5a5460, 0x54504c]) : pick(PAL.walls), trim: pick(PAL.awning), face: 5 + Math.floor(rand() * 6), shop: true, sign: rand() < 0.7 });
    }
  }

  // ---- Ōme-kaidō through it all: trees, crossings, and the cars
  for (let u = 748; u < 1800; u += 17) {
    if ([740, 870, 1010, 1170, 1266, 1340, 1400, 1568, 1640, 1700].some((c) => Math.abs(u - c) < (c === 1266 ? 34 : 11))) continue;
    tree('broadleaf', 133, u, 2.1);
    tree('broadleaf', 147.4, u + 8, 2.1);
  }
  for (const [uc, hw] of [[870, 5], [1010, 5], [1170, 5], [1400, 4], [1568, 7]]) {
    zebra(134.4, uc + hw + 3, 11.3, 4, 'u');
    zebra(134.4, uc - hw - 7, 11.3, 4, 'u');
    zebra(127, uc - hw + 0.4, 4, hw * 2 - 0.8, 'x');
    if (uc !== 1400) zebra(149, uc - hw + 0.4, 4, hw * 2 - 0.8, 'x');
  }
  // (the avenue runs under both stations' tracks: the viaducts are shown again over the cars)
  ctx.cover(131, 148, 18, 24, -0.1);
  ctx.cover(131, 1239, 18, 54, -0.1);
  // (they keep to the left)
  kit.traffic(138.5, -20, 1800, { sp: 24, gap: 190, s0: 0.2 });
  kit.traffic(135.4, -20, 1800, { sp: 19, gap: 260, s0: 0.7 });
  kit.traffic(141.5, 1800, -20, { sp: 23, gap: 210, s0: 0.5 });
  kit.traffic(144.6, 1800, -20, { sp: 18, gap: 280, s0: 0.9 });

  // ---- Shinjuku Gyoen (u 1812-2092), in cherry time, the three gardens it keeps side by side. In by the Shinjuku
  // gate (stone gateposts, the iron gates folded back, the ticket booth, a queue, the visitors' centre under its
  // louvred roof); the Japanese garden: the upper pond in two lobes with an island of pines and a lantern, rock
  // groupings and a pebble beach on its shores, clipped azaleas, black pines leaning over the water, maples in young
  // leaf, the bridge at its waist, the Kyū-Goryōtei standing out over the water on its terrace; the English garden:
  // the great mown lawn under Himalayan cedars and a tulip tree, ringed with cherries (Somei-yoshino, double ones of a
  // deeper pink, two weeping ones), picnics on their sheets all round; the lower pond and the Rakuu-tei tea house
  // with its deck and red parasol; the glasshouse, palms under its faceted glass; the French garden: pleached plane
  // trees in two avenues, bedding in a parterre of box; out by the Sendagaya gate. A hedge and railings all round.
  {
    for (let k = 0; k < 1133; k++) rand(); // (the draws the old park took, so what comes after it keeps its draws)
    const { wet, img, along: alongRoad } = ctx;
    const hi = img.hi;
    const FW = 180 * S;
    const gr = rng(7400);
    const T = (kind, x, u, r) => tree(kind, x, u, r, Math.floor(gr() * 1e9));
    const fb = (x, y, seed, scale, oct = 2) => fbm(x, y, { seed, scale, octaves: oct });
    const WALKS = ['gyoen_michi_1', 'gyoen_michi_2', 'gyoen_michi_3'].map((id) => ctx.ROADS.find((r) => r.id === id));
    const P1 = [[36, 1896], [38, 1886], [46, 1880], [56, 1879], [64, 1883], [70, 1890], [74, 1893], [78, 1889], [86, 1884], [98, 1883], [108, 1887], [114, 1895], [113, 1905], [106, 1913], [96, 1917], [86, 1915], [78, 1911], [74, 1908], [70, 1912], [62, 1918], [50, 1919], [41, 1914], [36, 1906]];
    const P2 = [[98, 1946], [104, 1938], [114, 1936], [124, 1940], [130, 1948], [129, 1958], [124, 1966], [126, 1976], [120, 1984], [110, 1986], [102, 1980], [100, 1970], [96, 1960]];
    const inPoly = (pts, x, u) => {
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, ui] = pts[i];
        const [xj, uj] = pts[j];
        if (ui > u !== uj > u && x < ((xj - xi) * (u - ui)) / (uj - ui) + xi) inside = !inside;
      }
      return inside;
    };
    const shore = (pts, x, u) => near([...pts, pts[0]], x, u).d; // (how far from the pond's edge)
    const LAWN = (x, u) => ((x - 58) / 44) ** 2 + ((u - 1954) / 30) ** 2; // (< 1 on the great lawn)
    const ISLE = [52, 1899, 6, 4];
    const isWet = (X, Yy) => wet[Yy * FW + X] === 2;
    const onWalk = (x, u, pad = 0) => WALKS.some((r) => near(r.pts, x, u).d <= r.w / 2 + pad);
    const PLOTS_HERE = [[20, 1990, 40, 30], [131, 1950, 15, 12], [84, 1915, 20, 11]];
    const onPlot = (x, u) => PLOTS_HERE.some(([px, pu, w, h]) => x >= px && x < px + w && u >= pu && u < pu + h);
    const FORMAL = [96, 1998, 48, 68];
    const inFormal = (x, u) => x >= FORMAL[0] && x < FORMAL[0] + FORMAL[2] && u >= FORMAL[1] && u < FORMAL[1] + FORMAL[3];
    const TURRET = [129, 1897]; // (a turret's stand comes here: open lawn round it)
    const clearOf = (x, u, r) => Math.hypot(x - TURRET[0], u - TURRET[1]) > 9 + r && !onWalk(x, u, r * 0.6 + 0.5) && !onPlot(x, u) && !inPoly(P1, x, u) && !inPoly(P2, x, u);

    // the ground: the lawn mown in broad stripes, the Japanese garden's moss and short grass, the woods' floor of
    // leaf litter; petals fallen thick under the cherries (laid with the trees below)
    ground(() => {
      for (let Yy = FY(2092); Yy < FY(1812); Yy++)
        for (let X = 0; X < FX(158); X++) {
          if (isWet(X, Yy)) continue;
          const x = (X + 0.5) / S;
          const u = L - (Yy + 0.5) / S;
          if (onWalk(x, u) || onPlot(x, u) || inFormal(x, u)) continue;
          const g = hashPx(X, Yy, 7401);
          let c;
          const lawn = LAWN(x, u);
          if (lawn < 1) {
            const band = Math.floor((x + Math.sin(u / 9) * 1.2) / 4.5) % 2;
            c = shade(band ? 0x74a454 : 0x689a4c, 0.95 + fb(X * 0.2, Yy * 0.2, 7402, 3) * 0.1 + (g - 0.5) * 0.06);
            if (lawn > 0.82) c = blend(c, 0x5a8a44, (lawn - 0.82) * 4);
          } else if (u < 1932 && x < 120) {
            const m = fb(X * 0.15, Yy * 0.15, 7403, 3);
            c = shade(m < 0.45 ? 0x3e6a34 : m < 0.6 ? 0x4a7a3a : 0x5a8a40, 0.92 + g * 0.14); // (moss and short grass)
          } else {
            c = shade(0x507a3e, 0.92 + fb(X * 0.25, Yy * 0.25, 7404, 2) * 0.1 + (g - 0.5) * 0.08);
            if (g > 0.95) c = g > 0.98 ? 0x6a5a3c : 0x7a6a44; // (leaf litter)
          }
          P(X, Yy, c);
        }
      // the walks: gravel, raked, its edges darker where the grass meets it
      for (const r of WALKS)
        alongRoad(r.pts, r.w / 2, (n, x, u, X, Yy) => {
          const g = hashPx(X, Yy, 7405);
          const c = shade(0xc8bca2, 0.9 + fb(X * 0.5, Yy * 0.5, 7406, 2) * 0.16 + (g - 0.5) * 0.1);
          return n.d > r.w / 2 - 0.4 ? shade(c, 0.8) : g < 0.04 ? 0x9a8e78 : c;
        });
    });

    // the ponds: deep green water under the trees' reflections, sky in it where it is open, water lilies in the
    // upper pond's west lobe, petals drifting together along the shores; the rocks along the edges, a pebble beach
    ground(() => {
      for (let Yy = FY(1990); Yy < FY(1876); Yy++)
        for (let X = FX(30); X < FX(134); X++) {
          if (!isWet(X, Yy)) continue;
          const x = (X + 0.5) / S;
          const u = L - (Yy + 0.5) / S;
          const P_ = u < 1925 ? P1 : P2;
          const d = shore(P_, x, u);
          const g = hashPx(X, Yy, 7407);
          let c = blend(0x2a4a40, 0x3a6458, fb(X * 0.04, Yy * 0.12, 7408, 3));
          if (d < 2.4) c = shade(c, 0.72 + d * 0.1); // (dark under the bank)
          const sky = fb(X * 0.02, Yy * 0.5, 7409, 3);
          if (sky > 0.66 && d > 3) c = blend(c, 0x9ab8b8, (sky - 0.66) * 1.6);
          if (Math.hypot((x - 44) / 7, (u - 1892) / 6) < 1 || Math.hypot((x - 106) / 5, (u - 1975) / 6) < 1) {
            // water lilies: round notched pads, a flower here and there
            const pi = Math.floor(X / 5);
            const pj = Math.floor(Yy / 4);
            const pc = [pi * 5 + 2.5, pj * 4 + 2];
            if (hashPx(pi, pj, 7410) < 0.6 && Math.hypot(X - pc[0], (Yy - pc[1]) * 1.2) < 2.2 && Math.atan2(Yy - pc[1], X - pc[0]) % 1.4 > -1.1) c = hashPx(pi, pj, 7411) < 0.12 && X === Math.round(pc[0]) ? 0xf8e8ee : g < 0.5 ? 0x4a8a3a : 0x5a9a44;
          }
          const raft = fb(X * 0.03, Yy * 0.06, 7412, 3) + (d < 3 ? 0.08 : 0);
          if (raft > 0.7 && g < (raft - 0.68) * 1.6) c = g < 0.1 ? 0xffe8ee : g < 0.3 ? 0xf6c6d4 : 0xe6a8bc;
          else if (g > 0.99) c = 0xf4c4d2;
          P(X, Yy, c);
        }
    });
    // rocks along the shores (ishigumi): grey boulders lit on top, moss on their shoulders; a pebble beach (suhama)
    // on the upper pond's south-west shore
    const rock = (x, u, r) =>
      queue(FY(u) + Math.round(r * S * 0.5), () => {
        const [CX, CY] = [FX(x), FY(u)];
        const R_ = r * S;
        for (let j = -R_; j <= R_; j++)
          for (let i = -R_ - 1; i <= R_ + 1; i++) {
            const e = (i / (R_ + 1)) ** 2 + (j / R_) ** 2 + (hashPx(CX + i, CY + j, 7413) - 0.5) * 0.2;
            if (e > 1) continue;
            let c = i + j < -R_ * 0.4 ? 0xb8b4aa : i + j > R_ * 0.5 ? 0x5e5c58 : 0x8a8680;
            if (j < -R_ * 0.3 && hashPx(CX + i, CY + j, 7414) < 0.35) c = 0x5a7a3a;
            P(CX + i, CY + j, c);
          }
      }, () => shadowBox(FX(x) - r * S, FY(u) - r * S, r * S * 2, r * S * 2, 2, 0.6));
    for (const P_ of [P1, P2])
      for (let i = 0; i < P_.length; i++) {
        const [ax, au] = P_[i];
        const [bx, bu] = P_[(i + 1) % P_.length];
        for (let t = 0; t < 1; t += 0.5) {
          if (gr() < 0.45) continue;
          const [x, u] = [ax + (bx - ax) * t, au + (bu - au) * t];
          if (onWalk(x, u, 2) || onPlot(x, u) || Math.abs(x - 74) < 4) continue;
          rock(x + (gr() - 0.5), u + (gr() - 0.5), 0.9 + gr() * 0.9);
        }
      }
    ground(() => {
      for (let Yy = FY(1898); Yy < FY(1878); Yy++)
        for (let X = FX(36); X < FX(62); X++) {
          const x = (X + 0.5) / S;
          const u = L - (Yy + 0.5) / S;
          const d = shore(P1, x, u);
          if (d > 2.2 || (isWet(X, Yy) && d > 0.8) || x > 60) continue;
          const g = hashPx(X, Yy, 7415);
          P(X, Yy, g < 0.3 ? 0xd8d4cc : g < 0.6 ? 0xc0bcb2 : g < 0.85 ? 0xa8a49a : 0x8a867e);
        }
    });

    // the island: two black pines and a snow-viewing lantern on it, rocks round its edge
    const yukimi = (x, u) =>
      queue(FY(u) + 2, () => {
        const [X, Y_] = [FX(x), FY(u)];
        for (const [i, j] of [[-2, 1], [2, 1], [0, 2]]) P(X + i, Y_ + j, 0x5a5650); // (its legs)
        for (let j = -3; j <= 0; j++) for (let i = -4 + Math.abs(j + 1); i <= 4 - Math.abs(j + 1); i++) P(X + i, Y_ + j, j === -3 ? 0xc8c4ba : i < 0 ? 0xa8a49a : 0x7e7a72); // (the wide cap)
        P(X, Y_ - 4, 0xd8d4ca); // (the jewel on top)
      }, () => shadowBox(FX(x) - 4, FY(u) - 3, 9, 5, 3, 0.62));
    yukimi(ISLE[0] + 2, ISLE[1] - 1);
    T('pine', ISLE[0] - 2.5, ISLE[1] + 1, 2.6);
    T('pine', ISLE[0] + 3.5, ISLE[1] + 2, 2);
    for (const [dx, du, r] of [[-5, -1, 0.9], [4.5, -2.5, 1], [-1, -3.5, 0.8], [5.5, 1, 0.7]]) rock(ISLE[0] + dx, ISLE[1] + du, r);
    yukimi(41, 1880.5);
    yukimi(110, 1912);
    yukimi(102, 1939);

    // the bridge at the waist: a low arch of boards between red rails, its piers in the water, the gravel on from
    // each end to the walk and to the lawn
    ground(() => {
      for (const [u0, u1] of [[1863.5, 1891], [1910, 1926]])
        for (let Yy = FY(u1); Yy < FY(u0); Yy++) for (let i = -5; i < 5; i++) P(FX(74) + i, Yy, shade(0xc8bca2, 0.9 + hashPx(FX(74) + i, Yy, 7416) * 0.15));
      const [X, Y0, Y1] = [FX(74), FY(1911), FY(1890)];
      for (let Yy = Y0; Yy < Y1; Yy++) {
        const t = (Yy - Y0) / (Y1 - Y0 - 1);
        const lift = Math.round((1 - (t * 2 - 1) ** 2) * 2);
        for (let i = -4 - lift; i < 4 + lift; i++) P(X + i, Yy, (Yy - Y0) % 3 === 0 ? 0x8a6a48 : 0xb08c5c);
        P(X - 5 - lift, Yy, 0xc03a2a);
        P(X + 4 + lift, Yy, 0xc03a2a);
        if ((Yy - Y0) % 7 === 0) {
          P(X - 5 - lift, Yy, 0x6a1a14);
          P(X + 4 + lift, Yy, 0x6a1a14);
        }
        for (let i = 5 + lift; i < 9 + lift; i++) hi.tint(X + i, Yy + 2, 0.72); // (its shadow on the water)
      }
    });

    // the Kyū-Goryōtei: the pavilion given for a prince's wedding, out over the water on its terrace - a hipped
    // roof of grey tiles, its corners swept up and tipped with ornaments, a raised clerestory, red columns, a white
    // balustrade round the terrace, people at the rail
    {
      const [x, u, w, h] = [84, 1915, 20, 11];
      const [X0, YT, BW, BH] = [FX(x), FY(u + h), w * S, h * S];
      queue(FY(u), () => {
        // the terrace and its balustrade, over the water at the front
        for (let j = BH - 10; j < BH; j++) for (let i = 0; i < BW; i++) P(X0 + i, YT + j, j === BH - 1 ? 0x6a5a4a : j === BH - 10 ? 0xe8e4da : i % 4 === 0 ? 0xd8d4ca : 0xb8a888);
        for (let i = 0; i < BW; i += 3) for (let j = BH - 4; j < BH - 1; j++) P(X0 + i, YT + j, 0xf0ece4);
        // the hall: red columns along its front, white walls and lattice between them
        for (let j = 14; j < BH - 10; j++)
          for (let i = 4; i < BW - 4; i++) {
            const k = (i - 4) % 8;
            P(X0 + i, YT + j, k < 2 ? (k ? 0xa82a1e : 0xd8402a) : j === 14 ? 0x2a2a26 : (i + j) % 3 === 0 ? 0x5a8a7a : 0xe8e4d8);
          }
        // the roof: grey tiles in rows, hips running to the corners, the corners swept up with their ornaments
        const RY = 14;
        for (let j = 0; j < RY; j++) {
          const t = j / (RY - 1);
          const inset = Math.round((1 - t) * 7);
          for (let i = inset; i < BW - inset; i++) {
            const hip = i - inset < 2 || BW - inset - 1 - i < 2;
            let c = hip ? 0x3a3c3e : j < 5 ? 0x6a7270 : (i % 3 === 0 ? 0x4e5654 : 0x5e6664);
            if (j === RY - 1) c = 0x2a2c2c;
            P(X0 + i, YT + j, c);
          }
        }
        for (let i = 9; i < BW - 9; i++) for (let j = 2; j < 5; j++) P(X0 + i, YT + j, j === 2 ? 0x8a9290 : 0x3a3c3e); // (the clerestory's ridge)
        for (const [cx, s] of [[0, 1], [BW - 1, -1]]) for (let k = 0; k < 4; k++) P(X0 + cx + s * k, YT + RY - 2 - k, k === 3 ? 0xc8a050 : 0x3a3c3e); // (the swept-up corners)
        for (let k = 0; k < 5; k++) kit.person(X0 + 4 + k * 12, YT + BH - 9, 7420 + k);
      }, () => shadowBox(X0, YT, BW, BH - 10, 8, 0.6));
    }

    // the Rakuu-tei tea house on the lower pond: its thatched-look roof, a deck out over the water with the bench of
    // red felt and the great red parasol (an outdoor tea), stepping stones up from the walk, pines
    {
      const [x, u] = [131, 1950];
      house(x + 3, u + 2, 11, 9, { tile: 0x7a6a50, wall: 0xe0d6c0, face: 2, s: 7430, lantern: true });
      ground(() => {
        for (let j = 0; j < 18; j++) for (let i = 0; i < 15; i++) P(FX(x - 3) + i, FY(u + 9) + j, i === 0 || j === 0 || j === 17 ? 0x6a4c30 : i % 3 === 0 ? 0x94744c : 0xb08c5c);
        for (let k = 0; k < 6; k++) {
          const [X, Y_] = [FX(147 - k * 2.4), FY(u + 4 - k * 0.6)];
          for (let j = -1; j <= 1; j++) for (let i = -2; i <= 2; i++) if (Math.abs(i) + Math.abs(j) < 3) P(X + i, Y_ + j, i + j < 0 ? 0xc8c4ba : 0x9a968c);
        }
      });
      mark(x - 1, u + 6, (X, Y_) => {
        R(X - 1, Y_ + 2, 6, 2, 0xc8302a);
        kit.parasol(X + 2, Y_ - 2, 0xc8302a);
      });
      for (let k = 0; k < 3; k++) mark(x - 1.4 + k * 1.3, u + 4, (X, Y_) => kit.person(X, Y_, 7440 + k));
      T('pine', x + 15, u + 12, 2.4);
      T('pine', x - 1, u + 14, 2);
    }

    // clipped azaleas (karikomi) on the banks and slopes of the Japanese garden: green mounds, the first flowers
    const azalea = (x, u, r) =>
      queue(FY(u) + Math.round(r * S * 0.6), () => {
        const [CX, CY] = [FX(x), FY(u)];
        const R_ = r * S;
        for (let j = -R_; j <= R_; j++)
          for (let i = -R_ - 2; i <= R_ + 2; i++) {
            const e = (i / (R_ + 2)) ** 2 + (j / R_) ** 2;
            if (e > 1) continue;
            const g = hashPx(CX + i, CY + j, 7450);
            let c = e < 0.3 && i + j < 0 ? 0x7ab45a : i + j > R_ * 0.6 ? 0x2e5a2a : (i + j * 2) % 4 === 0 ? 0x4a8a3e : 0x5a9a48;
            if (g < 0.07) c = g < 0.03 ? 0xf06aa8 : 0xd84a8a;
            P(CX + i, CY + j, c);
          }
      }, () => shadowBox(FX(x) - r * S - 2, FY(u) - r * S, r * S * 2 + 4, r * S * 2, 2, 0.6));
    for (let k = 0; k < 170; k++) {
      const x = 30 + gr() * 104;
      const u = 1868 + gr() * 62;
      const r = 1.4 + gr() * 1.4;
      const d = Math.min(shore(P1, x, u), u > 1930 ? 99 : 99);
      if (d < 1.5 + r || d > 9 || !clearOf(x, u, r) || Math.abs(x - 74) < 6 + r) continue;
      azalea(x, u, r);
    }
    // the Japanese garden's trees: black pines leaning out over the water, maples in their young leaf, a red one
    for (let k = 0; k < 36; k++) {
      const x = 26 + gr() * 108;
      const u = 1866 + gr() * 64;
      const near1 = shore(P1, x, u);
      const kind = near1 < 6 ? 'pine' : gr() < 0.9 ? 'broadleaf' : 'nomura';
      const r = kind === 'pine' ? 2.2 + gr() * 1.2 : 2 + gr() * 1.4;
      if (near1 < 1.5 || inPoly(P1, x, u) || !clearOf(x, u, r) || Math.abs(x - 74) < 6) continue;
      T(kind, x, u, r);
    }

    // the English garden: Himalayan cedars and a tulip tree standing on the lawn; the cherries round it
    for (const [kind, x, u, r] of [['cedar', 22, 1944, 5.2], ['cedar', 30, 1968, 4.6], ['cedar', 18, 1976, 4], ['broadleaf', 70, 1972, 6.4], ['broadleaf', 92, 1936, 4.2]]) T(kind, x, u, r);
    const cherries = [];
    for (let k = 0; k < 34; k++) {
      const a = (k / 34) * Math.PI * 2 + gr() * 0.12;
      const x = 58 + Math.cos(a) * (45 + gr() * 5);
      const u = 1954 + Math.sin(a) * (31 + gr() * 4);
      const r = 3.4 + gr() * 2;
      if (!clearOf(x, u, r * 0.6) || x < 4 || x > 154) continue;
      cherries.push([x, u, r]);
      T(gr() < 0.22 ? 'yaezakura' : 'sakura', x, u, r);
    }
    // two weeping cherries by the lawn's south end: their branches streaming down all round
    for (const [x, u, r] of [[40, 1928.5, 4.2], [80, 1928, 3.8]]) {
      T('sakura', x, u, r);
      queue(FY(u) + Math.round(r * S * 0.6) + 1, () => {
        const [CX, CY] = [FX(x), FY(u)];
        const R_ = Math.round(r * S * 1.15);
        for (let j = -R_; j <= R_; j++)
          for (let i = -R_; i <= R_; i++) {
            const d = Math.hypot(i, j) / R_;
            if (d > 1) continue;
            const a = Math.atan2(j, i);
            const streak = Math.sin(a * 17 + d * 2) > 0.35;
            if (!streak || d < 0.35) continue;
            if (d > 0.9 && hashPx(CX + i, CY + j, 7460) < 0.5) continue;
            P(CX + i, CY + j, hashPx(CX + i, CY + j, 7461) < 0.4 ? 0xfff0f4 : d > 0.75 ? 0xe8a0b9 : 0xf6c4d6);
          }
      });
    }
    // petals fallen under the cherries
    ground(() => {
      for (const [x, u, r] of cherries)
        for (let k = 0; k < r * 40; k++) {
          const a = gr() * Math.PI * 2;
          const d = r * (0.6 + gr() * 0.9);
          const [X, Y_] = [FX(x + Math.cos(a) * d), FY(u + Math.sin(a) * d)];
          if (!isWet(X, Y_)) P(X, Y_, gr() < 0.5 ? 0xf4c4d2 : 0xffe4ec);
        }
    });
    // the picnics: sheets spread under the cherries, blue tarps mostly, people sitting round them (the edge of the
    // lawn is full, the middle open); bento, a flask, shoes left at the edge
    const sheet = (x, u, k) => {
      const c = [0x3a6ad0, 0x3a6ad0, 0x4a7ae0, 0xe8c040, 0xd8d0c0, 0xd04848, 0x48a868][k % 7];
      const [w, h] = [9 + (k % 3) * 2, 6 + (k % 2) * 2];
      mark(x, u, (X, Y_) => {
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) P(X + i, Y_ + j, i === 0 || j === 0 || i === w - 1 || j === h - 1 ? shade(c, 0.8) : (i + j * 2) % 9 === 0 ? shade(c, 1.15) : c);
        R(X + 3, Y_ + 2, 3, 2, 0xc02a2a);
        P(X + 4, Y_ + 2, 0xf4f4ee);
        P(X + w - 3, Y_ + 2, 0xd8d8d0);
        for (let i = 0; i < 3; i++) P(X + 1 + i * 2, Y_ + h, i % 2 ? 0x2a2a2a : 0xe8e8e8);
        const n = 2 + (k % 4);
        for (let q = 0; q < n; q++) {
          const side = q % 4;
          const [px, py] = side === 0 ? [X + 1 + q * 2, Y_ - 3] : side === 1 ? [X + w - 1, Y_ + 1] : side === 2 ? [X - 2, Y_ + 2] : [X + 3 + q, Y_ + h - 4];
          kit.person(px, py, 7470 + k * 7 + q);
        }
      });
    };
    let sheets = 0;
    for (let k = 0; k < 120 && sheets < 30; k++) {
      const a = gr() * Math.PI * 2;
      const t = 0.62 + gr() * 0.3;
      const x = 58 + Math.cos(a) * 44 * t;
      const u = 1954 + Math.sin(a) * 30 * t;
      if (!clearOf(x, u, 3) || inPoly(P2, x + 4, u)) continue;
      sheet(x, u, sheets++);
    }
    // on the lawn: people lying in the sun, children running, a frisbee in the air; strollers on the walks
    for (let k = 0; k < 26; k++) {
      const x = 22 + gr() * 72;
      const u = 1932 + gr() * 44;
      if (LAWN(x, u) > 0.7 || !clearOf(x, u, 1)) continue;
      mark(x, u, (X, Y_) => kit.person(X, Y_, 7600 + k));
    }
    mark(60, 1958, (X, Y_) => {
      R(X, Y_, 2, 1, 0xf0f0f0);
      hi.tint(X + 3, Y_ + 4, 0.7);
    });
    for (const r of WALKS)
      for (let k = 0; k < (r.id === 'gyoen_michi_1' ? 46 : 8); k++) {
        const i = Math.floor(gr() * (r.pts.length - 1));
        const t = gr();
        const [ax, au] = r.pts[i];
        const [bx, bu] = r.pts[i + 1];
        mark(ax + (bx - ax) * t + (gr() - 0.5) * 1.6, au + (bu - au) * t + (gr() - 0.5) * 1.6, (X, Y_) => kit.person(X, Y_, 7700 + k * 3 + r.id.length));
      }
    // by the ponds: photographers at the shore, people on the bridge, a gardener raking
    for (let k = 0; k < 12; k++) {
      const [x, u] = [74 + (gr() - 0.5) * 3, 1892 + gr() * 18];
      mark(x, u, (X, Y_) => kit.person(X, Y_, 7800 + k));
    }
    for (let k = 0; k < 14; k++) {
      const i = Math.floor(gr() * P1.length);
      const [x, u] = P1[i];
      const [x2, u2] = [x + (x - 75) * 0.12, u + (u - 1899) * 0.25];
      if (!clearOf(x2, u2, 0.5) || shore(P1, x2, u2) < 0.8) continue;
      mark(x2, u2, (X, Y_) => {
        kit.person(X, Y_, 7900 + k);
        if (k % 3 === 0) P(X + 2, Y_ + 1, 0x2a2a2e); // (a camera)
      });
    }
    mark(58, 1873, (X, Y_) => {
      kit.person(X, Y_, 7990);
      for (let j = 0; j < 4; j++) P(X + 2 + j, Y_ - 1 + j, 0x8a6a40); // (the rake)
    });

    // the glasshouse: a great faceted roof of glass on white steel, palms and a pool seen under it, a walkway
    // through, its entrance on the south side with people going in
    {
      const [x, u, w, h] = [20, 1990, 40, 30];
      const [X0, YT, GW, GH] = [FX(x), FY(u + h), w * S, h * S];
      const facet = (i, j) => Math.floor((i + (j >> 1)) / 15) + Math.floor((i - (j >> 1) + 600) / 15) * 7;
      queue(FY(u), () => {
        for (let j = 0; j < GH; j++)
          for (let i = 0; i < GW; i++) {
            const inner = hashPx(i >> 2, j >> 2, 7501);
            const palm = Math.sin(i * 0.31) * Math.cos(j * 0.27) > 0.55 || inner < 0.12;
            const pool = Math.hypot((i - GW * 0.62) / 16, (j - GH * 0.55) / 9) < 1;
            const walkway = Math.abs(j - GH * 0.75 + (i - GW / 2) * 0.12) < 2;
            let c = pool ? 0x4a8aa0 : walkway ? 0xc8bca4 : palm ? (hashPx(i, j, 7502) < 0.5 ? 0x2e6a3a : 0x3e7e44) : hashPx(i >> 1, j >> 1, 7503) < 0.4 ? 0x5a9a54 : 0x6aaa5e;
            const f = facet(i, j);
            c = blend(c, 0xd8eef4, 0.28 + (hashPx(f, 0, 7504) * 0.25)); // (the glass, each facet catching the light its own way)
            const rib = (i + (j >> 1)) % 15 === 0 || (i - (j >> 1) + 600) % 15 === 0;
            if (rib) c = 0xf4f8f8;
            if (j < 2 || i < 2 || i >= GW - 2) c = 0xe8ecec;
            if (j >= GH - 6) c = j === GH - 1 ? 0x3a4448 : (i % 6 < 2 ? 0x8a9aa0 : 0xbcd0d6); // (its glass front, the doors)
            P(X0 + i, YT + j, c);
          }
        // the entrance canopy, people going in
        R(X0 + GW / 2 - 12, YT + GH - 2, 24, 4, 0xe8ecec);
        for (let k = 0; k < 8; k++) kit.person(X0 + GW / 2 - 14 + k * 4, YT + GH + 4 + (k % 2) * 2, 7510 + k);
      }, () => shadowBox(X0, YT, GW, GH, 9, 0.66));
      ground(() => {
        for (let Yy = FY(u) ; Yy < FY(u - 4); Yy++) for (let X = X0 + GW / 2 - 16; X < X0 + GW / 2 + 16; X++) P(X, Yy, shade(0xc8bca2, 0.92 + hashPx(X, Yy, 7511) * 0.12));
      });
    }

    // the French garden: two avenues of plane trees pleached into a hedge on stilts, gravel under them, benches; the
    // long lawn between, a parterre of box with bedding in it (pansies, tulips, early roses) down the middle
    {
      const [x, u, w, h] = FORMAL;
      ground(() => {
        for (let Yy = FY(u + h); Yy < FY(u); Yy++)
          for (let X = FX(x); X < FX(x + w); X++) {
            const xx = (X + 0.5) / S;
            const uu = L - (Yy + 0.5) / S;
            const g = hashPx(X, Yy, 7520);
            let c;
            if (xx < x + 11 || xx > x + w - 11) c = shade(0xc8bca2, 0.9 + g * 0.14); // (the gravel under the planes)
            else {
              const band = Math.floor((uu - u) / 3) % 2;
              c = shade(band ? 0x72a252 : 0x669848, 0.95 + g * 0.08);
              const px = xx - (x + w / 2);
              const pu = ((uu - u - 6) % 14 + 14) % 14;
              const inBed = Math.abs(px) < 9 && pu > 2 && pu < 11 && uu > u + 6 && uu < u + h - 6;
              if (inBed) {
                const edge = Math.abs(px) > 8.3 || pu < 2.7 || pu > 10.3 || (Math.abs(px) < 0.7) || Math.abs(pu - 6.5) < 0.35;
                c = edge ? 0x2e5a2a : g < 0.25 ? 0xd83a50 : g < 0.42 ? 0xf0a0c0 : g < 0.56 ? 0xf0d040 : g < 0.66 ? 0x8a5ad0 : g < 0.74 ? 0xf4f0e8 : 0x3e7a3c;
              }
            }
            P(X, Yy, c);
          }
      });
      // the pleached planes: square-cut crowns joined into one green wall along each avenue, their trunks below
      for (const ax of [x + 2, x + w - 9])
        queue(FY(u), () => {
          const [XA, XB] = [FX(ax), FX(ax + 7)];
          for (let Yy = FY(u + h - 2); Yy < FY(u + 2); Yy++)
            for (let X = XA; X < XB; X++) {
              const g = hashPx(X, Yy, 7521);
              const k = (Yy - FY(u + h - 2)) % 24; // (one tree's square-cut crown to the next, a notch between)
              if (k > 22 && (X - XA) % 7 > 1) {
                P(X, Yy, 0x2a4a26);
                continue;
              }
              const lit = 1 - (X - XA) / (XB - XA) * 0.5 - k / 24 * 0.25; // (lit from the top left, as everything is)
              const leaf = fb(X * 0.6, Yy * 0.6, 7522, 2);
              let c = shade(leaf < 0.4 ? 0x3a6a30 : leaf < 0.7 ? 0x4e8a3c : 0x66a24c, 0.75 + lit * 0.45);
              if (g < 0.05) c = 0x8ac46a;
              if (k === 0 || X === XA) c = 0x8ac46a;
              P(X, Yy, c);
            }
        }, () => shadowBox(FX(ax), FY(u + h - 2), FX(7), FY(u + 2) - FY(u + h - 2), 6, 0.58));
      for (let uu = u + 8; uu < u + h - 4; uu += 12)
        for (const bx of [x + 10, x + w - 13])
          mark(bx, uu, (X, Y_) => {
            R(X, Y_, 2, 6, 0x8a6a48);
            R(X, Y_, 1, 6, 0xa88a60);
          });
      for (let k = 0; k < 14; k++) mark(x + 10 + gr() * (w - 20), u + 4 + gr() * (h - 8), (X, Y_) => kit.person(X, Y_, 8000 + k));
    }

    // the woods: everywhere the gardens leave - a belt of zelkovas, camphors and cedars along the railings, groves
    // between the walks, cherries scattered through them; open round the lawn, the ponds, the glasshouse and the gates
    for (let gu = 1814; gu < 2092; gu += 4.6)
      for (let gx = 1; gx < 157; gx += 4.6) {
        const x = gx + gr() * 3.4;
        const u = gu + gr() * 3.4;
        const r = 2.3 + gr() * 2;
        const roll = gr();
        if (gr() < 0.2) continue;
        if (!clearOf(x, u, r * 0.6) || inFormal(x, u) || LAWN(x, u) < 1.18 || x > 155.5) continue;
        if (Math.min(shore(P1, x, u), shore(P2, x, u)) < 3 + r * 0.5) continue;
        if (u < 1932 && x > 28 && x < 120 && shore(P1, x, u) < 14) continue; // (the Japanese garden keeps its own)
        if (x > 15 && x < 65 && u > 1984 && u < 2026) continue; // (the glasshouse)
        if ((x > 58 && x < 104 && u < 1834) || (x > 82 && x < 104 && u > 2074)) continue; // (the gates, the visitors' centre)
        if (x > 126 && x < 150 && u > 1944 && u < 1966) continue; // (the tea house)
        T(roll < 0.14 ? 'sakura' : roll < 0.17 ? 'yaezakura' : roll < 0.32 ? 'cedar' : roll < 0.38 ? 'pine' : 'broadleaf', x, u, r);
      }

    // the railings round it: black steel bars on a stone kerb, a hedge inside; the two gates
    const rail = (pts) =>
      ground(() => {
        for (let i = 0; i + 1 < pts.length; i++) {
          const [[ax, au], [bx, bu]] = [pts[i], pts[i + 1]];
          const n = Math.ceil(Math.hypot(bx - ax, bu - au) * S);
          for (let k = 0; k <= n; k++) {
            const [X, Y_] = [FX(ax + ((bx - ax) * k) / n), FY(au + ((bu - au) * k) / n)];
            if (onWalk((X + 0.5) / S, L - (Y_ + 0.5) / S, 0.6)) continue;
            P(X, Y_, 0xa8a49a);
            P(X, Y_ - 1, k % 4 === 0 ? 0x1a1a1e : 0x3a3a40);
            hi.tint(X + 1, Y_ + 1, 0.75);
          }
        }
      });
    rail([[0, 1812.4], [157.6, 1812.4], [157.6, 2091.6], [0, 2091.6]]);
    const gatePosts = (x, u) => {
      for (const s of [-1, 1])
        queue(FY(u) + 2, () => {
          const X = FX(x + s * 3.2) - 2;
          R(X, FY(u) - 4, 5, 6, 0xb8b0a0);
          R(X, FY(u) - 4, 5, 1, 0xd8d0c0);
          R(X + 4, FY(u) - 3, 1, 5, 0x8a8478);
          for (let j = 0; j < 7; j++) P(X + (s < 0 ? 5 + (j >> 1) : -1 - (j >> 1)), FY(u) - 3 + j, 0x2a2a30); // (the iron gate folded back)
        }, () => shadowBox(FX(x + s * 3.2) - 2, FY(u) - 4, 5, 6, 3, 0.6));
    };
    gatePosts(90, 1812.6);
    gatePosts(90, 2091.8);
    // the ticket booth and the queue along the avenue's pavement; the visitors' centre under its louvred roof
    house(96, 1815, 6, 5, { tile: 0x5a5e62, wall: 0xe8e4dc, face: 2, s: 7530 });
    house(98, 2082, 5, 5, { tile: 0x5a5e62, wall: 0xe8e4dc, face: 2, s: 7531 });
    queue(FY(1815), () => {
      // (a flat roof of pale panels with skylights and its plant, a deep eave of cedar louvres, a glass front)
      const [X0, YT, BW, BH] = [FX(64), FY(1826), FX(16), FY(1815) - FY(1826)];
      for (let j = 0; j < BH; j++)
        for (let i = 0; i < BW; i++) {
          let c;
          if (j < BH - 9) {
            c = (i % 12 === 0 || j % 10 === 0) ? 0x9a9690 : shade(0xc4c0b6, 0.96 + hashPx(i >> 2, j >> 2, 7533) * 0.08);
            if (i % 12 > 3 && i % 12 < 9 && j % 10 > 3 && j % 10 < 7) c = 0x6a8a9a; // (the skylights)
          } else if (j < BH - 6) c = (i % 2 ? 0x8a6440 : 0xb08454); // (the louvres)
          else c = j === BH - 1 ? 0x3a3430 : i % 8 < 6 ? 0x7aa0b0 : 0xe4e0d6;
          if (j === 0 || i === 0 || i === BW - 1) c = 0x7a766e;
          P(X0 + i, YT + j, c);
        }
      for (const [i, j] of [[6, 4], [10, 4], [6, 8]]) R(X0 + i, YT + j, 3, 2, 0x8a8e94); // (the plant on its roof)
    }, () => shadowBox(FX(64), FY(1826), FX(16), FY(1815) - FY(1826), 6, 0.62));
    ground(() => {
      for (let Yy = FY(1815); Yy < FY(1812.8); Yy++) for (let X = FX(64); X < FX(88.5); X++) P(X, Yy, shade(0xc8bca2, 0.92 + hashPx(X, Yy, 7532) * 0.12));
    });
    for (let k = 0; k < 22; k++) mark(92 + k * 2.6, 1803.4 + (k % 2) * 0.6, (X, Y_) => kit.person(X, Y_, 8100 + k)); // (the queue)
    for (let k = 0; k < 6; k++) mark(64 + k * 3.4, 1813.6, (X, Y_) => kit.person(X, Y_, 8130 + k));
    // lamps and benches along the walks
    for (const r of WALKS.slice(0, 1))
      for (let i = 0; i + 1 < r.pts.length; i++) {
        const [[ax, au], [bx, bu]] = [r.pts[i], r.pts[i + 1]];
        const len = Math.hypot(bx - ax, bu - au);
        for (let d = 8; d < len - 4; d += 22) {
          const [x, u] = [ax + ((bx - ax) * d) / len, au + ((bu - au) * d) / len];
          const [nx, nu] = [-(bu - au) / len, (bx - ax) / len];
          const [lx, lu] = [x + nx * 2.6, u + nu * 2.6];
          if (!clearOf(lx, lu, 0) && !onWalk(lx, lu, 0) && LAWN(lx, lu) > 1) mark(lx, lu, (X, Y_) => kit.lamp(X, Y_));
          const [bx2, bu2] = [x - nx * 2.8, u - nu * 2.8];
          if (Math.hypot(bx2 - TURRET[0], bu2 - TURRET[1]) > 10 && !inPoly(P1, bx2, bu2) && !inPoly(P2, bx2, bu2))
            mark(bx2, bu2, (X, Y_) => {
              R(X - 3, Y_, 7, 2, 0x8a6a48);
              R(X - 3, Y_, 7, 1, 0xa88a60);
            });
        }
      }

    // live: carp and ducks on the ponds, petals coming down over the lawn's cherries
    const carp = (k) =>
      kit.frame(3, 1.34, 1900, (put) => {
        const c = [0xf08a2a, 0xf4f0e6, 0xe84a2a][k % 3];
        for (let i = 0; i < 8; i++) for (let j = 1; j < 3; j++) if (Math.abs(j - 1.5) < 1 - Math.abs(i - 3.5) * 0.12) put(i, j, (i >> 1) % 2 ? c : 0xf8f4ec);
        put(k > 2 ? 0 : 8, 1, c);
      });
    props.wander(50, 1900, 9, 5, [carp(0), carp(3)], { n: 3, sp: 2.4, turn: 'rot', fps: 2, idle: 0.3 });
    props.wander(96, 1900, 9, 5, [carp(1), carp(4)], { n: 3, sp: 2.4, turn: 'rot', fps: 2, idle: 0.3 });
    props.wander(112, 1960, 7, 10, [carp(2), carp(5)], { n: 3, sp: 2.4, turn: 'rot', fps: 2, idle: 0.3 });
    const duck = (k) =>
      kit.frame(2.34, 1.67, 1900, (put) => {
        for (const [i, j] of [[1, 2], [2, 2], [3, 2], [4, 2], [2, 3], [3, 3], [4, 3], [5, 3]]) put(i, j, j === 3 ? 0x6a5a44 : 0x8a7454);
        put(5 - k, 1, 0x2a6a4a);
        put(6 - k, 1, 0x2a6a4a);
        put(6 - k, 2, 0xe0b030);
        for (let i = 1; i < 6; i++) put(i, 4, 0xc8d8d4, 0.5);
      });
    props.wander(100, 1898, 8, 4, [duck(0), duck(1)], { n: 2, sp: 1.6, turn: 'flip', fps: 1, idle: 0.4 });
    const petals = (k) =>
      kit.frame(4, 4, 1950, (put) => {
        for (let q = 0; q < 5; q++) put(Math.floor(hashPx(q, 1, 9) * 8) + k, Math.floor(hashPx(q, 2, 9) * 6) + k * 1.4 | 0, q % 2 ? 0xffd0e0 : 0xffb0cc, 0.9 - k * 0.15);
      }, true);
    props.spot([[8, 1990, 100, 70], [30, 1932, 56, 14]], [petals(0), petals(1), petals(2), petals(3)], { rate: 9, fps: 5, a: 0.8 });
  }
}
