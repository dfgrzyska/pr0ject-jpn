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

export function shinjuku(ctx) {
  const { kit, blocks, pave, plot, claim, props } = ctx;
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
    if (k < 3) car(156 + k * 7.4, 1570 + (k % 2) * 3.4, false);
    car(60 - k * 7.4, 1570.2 + (k % 2) * 3.4, false);
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
  ctx.cover(131, 38, 18, 24, -0.1);
  ctx.cover(131, 1239, 18, 54, -0.1);
  kit.traffic(141.5, -20, 1800, { sp: 24, gap: 190, s0: 0.2 });
  kit.traffic(144.6, -20, 1800, { sp: 19, gap: 260, s0: 0.7 });
  kit.traffic(138.5, 1800, -20, { sp: 23, gap: 210, s0: 0.5 });
  kit.traffic(135.4, 1800, -20, { sp: 18, gap: 280, s0: 0.9 });

  // ---- Shinjuku Gyoen
  {
    // lawns paler where they are mown, the paths' edges
    ground(() => {
      for (let u = 1920; u < 1990; u += 1 / 3)
        for (let x = 14; x < 104; x += 1 / 3) {
          const d = ((x - 58) / 44) ** 2 + ((u - 1954) / 30) ** 2;
          if (d < 1 && hashPx(FX(x), FY(u), 5) > d * 0.5) P(FX(x), FY(u), hashPx(FX(x), FY(u), 6) < 0.5 ? 0x76a455 : 0x6c9a4e);
        }
    });
    // the picnics: a sheet, two or three people, under the cherries
    for (let k = 0; k < 16; k++) {
      const [x, u] = [22 + rand() * 72, 1932 + rand() * 46];
      const c = pick([0x4870c8, 0xd04848, 0xe8c040, 0xf0a0b8, 0x48a868, 0xe8e8e8]);
      mark(x, u, (X, Y) => {
        R(X, Y, 9, 6, c);
        R(X, Y, 9, 1, shade(c, 1.2));
        for (let i = 2; i < 9; i += 3) P(X + i, Y + 3, shade(c, 0.75));
        kit.person(X + 1, Y - 2, k);
        kit.person(X + 6, Y - 1, k + 30);
      });
    }
    const inPond = (x, u) => Math.hypot((x - 76) / 41, (u - 1900) / 23) < 1 || Math.hypot((x - 112) / 21, (u - 1960) / 29) < 1;
    // trees: a belt along the walls, cherry groves by the lawn and the ponds, pines at the tea house
    for (let k = 0; k < 150; k++) {
      const edge = k < 70;
      const x = edge ? (k % 2 ? 2 + rand() * 8 : 148 + rand() * 8) : 6 + rand() * 146;
      const u = edge ? 1816 + rand() * 272 : pick([1816 + rand() * 30, 2060 + rand() * 28, 1880 + rand() * 180]);
      if (!edge && Math.hypot((x - 58) / 46, (u - 1954) / 32) < 1) continue;
      if (inPond(x, u)) continue;
      if (x > 16 && x < 64 && u > 1984 && u < 2026) continue; // (the glasshouse)
      if (x > 92 && x < 148 && u > 1994 && u < 2070) continue; // (the formal garden)
      tree(edge ? pick(['broadleaf', 'broadleaf', 'cedar']) : pick(['sakura', 'sakura', 'broadleaf', 'pine']), x, u, 2.6 + rand() * 2.2);
    }
    for (let k = 0; k < 22; k++) {
      const a = (k / 22) * Math.PI * 2;
      const [x, u] = [58 + Math.cos(a) * 48 + rand() * 3, 1954 + Math.sin(a) * 34 + rand() * 3];
      if (!inPond(x, u)) tree('sakura', x, u, 3 + rand() * 1.4);
    }
    // the formal garden: a long lawn, rose beds down its middle, two rows of plane trees each side
    pave(96, 1998, 48, 68, 'park', 61);
    ground(() => {
      for (let u = 2004; u < 2060; u += 14)
        for (let j = 0; j < 8 * 3; j++)
          for (let i = 0; i < 20 * 3; i++) {
            const v = hashPx(i, j + u, 71);
            P(FX(110) + i, FY(u + 8) + j, i === 0 || j === 0 || i === 59 || j === 23 ? 0x4a6a3a : v < 0.3 ? 0xd83a50 : v < 0.5 ? 0xf0a0b8 : v < 0.62 ? 0xf0d860 : 0x3e7a3c);
          }
    });
    for (let u = 2002; u < 2066; u += 8) for (const x of [99, 104, 136, 141]) tree('broadleaf', x, u, 2.4);
    // the glasshouse: white ribs over the green inside, a higher vault in the middle
    {
      const p = plot('gyoen_onshitsu');
      const [X0, YT] = [FX(p.x), FY(p.u + p.h)];
      const [gw, gh] = [p.w * 3, p.h * 3];
      queue(FY(p.u), () => {
        for (let j = 0; j < gh; j++)
          for (let i = 0; i < gw; i++) {
            const vault = Math.abs(i - gw / 2) < gw * 0.22;
            const rib = i % 9 === 0 || j % 12 === 0 || Math.abs(Math.abs(i - gw / 2) - gw * 0.22) < 1.5 || Math.abs(j - gh / 2) < 1;
            const leaf = hashPx(i >> 1, j >> 1, 81);
            let c = rib ? 0xf8fcfc : blend(leaf < 0.4 ? 0x3a7a44 : leaf < 0.8 ? 0x58a058 : 0x8cc878, 0xc4ecf4, vault ? 0.5 : 0.3);
            if ((i + j) % 31 < 4 && !rib) c = shade(c, 1.14);
            if (i <= 1 || j <= 1 || i >= gw - 2 || j >= gh - 2) c = j >= gh - 2 || i >= gw - 2 ? 0x5a6a72 : 0xdce4e6;
            P(X0 + i, YT + j, c);
          }
      }, () => shadowBox(X0, YT, gw, gh, 6, 0.7));
    }
    // the tea house on the pond's edge, a deck over the water; an arched bridge
    {
      const p = plot('gyoen_chaya');
      pave(p.x, p.u, p.w, p.h, 'park', 63);
      house(p.x + 2, p.u + 3, 13, 10, { tile: 0x7c6050, face: 2, s: 808 });
      // its deck out over the water on posts
      ground(() => {
        for (let j = 0; j < 21; j++) for (let i = 0; i < 30; i++) P(FX(p.x - 9) + i, FY(p.u + 10) + j, i === 0 || j === 0 || j === 20 ? 0x6a4c30 : i % 3 === 0 ? 0x94744c : 0xb08c5c);
        for (const j of [0, 20]) for (let i = 0; i < 30; i += 7) P(FX(p.x - 9) + i, FY(p.u + 10) + j + 1, 0x3a3028);
      });
      mark(p.x - 6, p.u + 6, (X, Y) => kit.parasol(X, Y, 0xc03a30));
      crowd(p.x - 8, p.u + 5, 8, 4, 3);
      for (const [x, u] of [[p.x - 2, p.u + 12], [p.x + 17, p.u + 2]]) tree('pine', x, u, 2.6);
    }
    // the bridge right across the pond at its waist, a red rail each side, a gravel path on from each end:
    // south to the garden's walk, north to the lawn
    ground(() => {
      const path = (x, u0, u1) => {
        for (let Y = FY(u1); Y < FY(u0); Y++) for (let i = -3; i < 3; i++) P(FX(x) + i, Y, hashPx(FX(x) + i, Y, 9) < 0.5 ? 0xb9b1a0 : 0xa8a090);
      };
      path(74, 1862, 1881);
      path(74, 1919, 1930);
      const [X, Y0, Y1] = [FX(74), FY(1921), FY(1879)];
      for (let Y = Y0; Y < Y1; Y++) {
        const t = (Y - Y0) / (Y1 - Y0 - 1);
        const lift = Math.round((1 - (t * 2 - 1) ** 2) * 2);
        for (let i = -4 - lift; i < 4 + lift; i++) P(X + i, Y, (Y - Y0) % 3 === 0 ? 0x8a6a48 : 0xb08c5c);
        P(X - 5 - lift, Y, 0xc03a2a);
        P(X + 4 + lift, Y, 0xc03a2a);
        if (lift === 2) for (let i = 5 + lift; i < 9 + lift; i++) ctx.img.hi.tint(X + i, Y + 2, 0.75); // (its shadow on the water)
      }
    });
    crowd(72.5, 1886, 2, 28, 5);
    crowd(84, 1814, 12, 40, 14);
  }
}
