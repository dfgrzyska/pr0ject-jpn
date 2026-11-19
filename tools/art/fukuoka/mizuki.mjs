// Tofuro and Mizuki (u 6500-7168, docs/plan-fukuoka.md phase 7) at sunset. The last fields and the houses along the
// road; the wide lawn where the old government of Dazaifu stood, mown in stripes - the foundation stones of its halls
// in rows on their low earthen platforms, the stones of its middle gate either side of the walk, the three stone
// pillars carved with its name on their mound - people on blankets, children running, a dog walked, camphors at its
// edges; then the Mizuki earthwork across the whole strip: a long bank of rammed earth under grass, trees on it at
// both ends, steps up it, the wooden conduit through it, the moat beyond with its reeds, lilies and a heron, the
// sunset in the water; and past it the last fields and the wooded foot of Mt Ono with a stretch of its old castle's
// stone walls. Shown as a monument only (section 3). The boss's field: nothing tall in the arena.
import { shade } from '../tokyo/kit.mjs';
import { hashPx } from '../hires.mjs';
import { fbm } from '../../lib/raster.mjs';
import { ROADS, GROUNDS, WATER, ARENAS, L } from './route.mjs';
import { landKit } from './dazaifu-kita.mjs';

const U0 = 6500;

export function mizuki(ctx) {
  const { kit, plot, props, W, near } = ctx;
  const { house, mark, rand, pick, P, R, FX, FY, queue, shadowBox, person, crowd, tree, trafficOn, glint } = kit;
  const { fm, fill, ume, fields, woods, homes } = landKit(ctx, U0, L);
  const road = (id) => ROADS.find((r) => r.id === id);
  const ground_ = (id) => GROUNDS.find((g) => g.id === id);
  const [ax, au, , ar] = ARENAS.find((a) => a[2] === 'NURIKABE');
  const inArena = (x, u, pad = 2) => Math.hypot(x - ax, u - au) < ar + pad;

  // ---- the last fields and the houses along the road
  fm.claim(0, U0, 58, 60);
  fm.claim(62, U0, W - 62, 60);
  fields(2, U0, 56, 6560, 28100);
  fields(64, U0, W, 6560, 28200);
  homes(6560, 6614, 0, W);
  trafficOn(road('tofuro_dori').pts, { sp: 10, gap: 80, s0: rand() });
  trafficOn([[W, 6621.8], [0, 6621.8]], { sp: 9, gap: 90, s0: rand() });
  trafficOn(road('kanzeonji_2').pts, { sp: 6, gap: 100, s0: rand() });
  mark(98, 6616, (X, Y) => { R(X, Y - 6, 1, 7, 0x6a6a70); R(X - 2, Y - 7, 5, 2, 0x3a6aa8); person(X + 3, Y - 2, 28300); }); // a bus stop, someone waiting

  // ---- the ruins' lawn: mown in broad stripes, clover in it, the warm light of the evening across it
  const RU = ground_('tofuro').rect;
  fill(RU[0], RU[1], RU[0] + RU[2], RU[1] + RU[3], (x, u, X, Y) => {
    if (near(road('tofuro_michi').pts, x, u).d < 1.9) return null;
    const stripe = Math.floor(x / 9) % 2;
    const n = fbm(x, u, { seed: 71, scale: 10, octaves: 2 });
    const base = stripe ? 0x86964e : 0x7a8a48;
    if (n > 0.74 && hashPx(X, Y, 72) < 0.1) return 0xe8e4d0; // clover in flower
    return shade(base, 0.92 + n * 0.14 + (hashPx(X, Y, 73) - 0.5) * 0.05);
  });
  // between the road and the lawn: a strip of gravel with a low hedge along the lawn, pines spaced along it, a car
  // park for the visitors, a rest house, a board with the site's plan
  fill(0, 6625.4, W, RU[1], (x, u, X, Y) => {
    if (near(road('tofuro_michi').pts, x, u).d < 1.9) return null;
    if (u > RU[1] - 1.4) return shade(0x3e5a2a, 0.88 + hashPx(X >> 1, Y >> 1, 92) * 0.24); // the hedge
    if (x > 4 && x < 40) return (X - FX(4)) % 9 === 0 && u > 6627 ? 0xd8d8d0 : shade(0x56585e, 0.97 + hashPx(X, Y, 93) * 0.05); // the car park
    return shade(0xb4aa90, 0.95 + hashPx(X, Y, 94) * 0.07);
  });
  for (let k = 0; k < 9; k++) if (hashPx(k, 1, 95) < 0.6) mark(5 + k * 3.8, 6628, (X, Y) => { R(X, Y - 5, 5, 6, [0xe8e4dc, 0x2a2a30, 0x8a9aa8, 0xa83a3a][k % 4]); R(X, Y - 4, 5, 1, 0x8ab0c8); kit.hi.tint(X + 5, Y - 4, 0.7); });
  for (const x of [52, 70, 112, 130, 172]) tree('pine', x, 6632, 2);
  house(146, 6627, 12, 7, { tile: 0x5a5048, wall: 0xe8e4d8, face: 1.8, s: 28700 }); // the rest house
  mark(100, 6627, (X, Y) => { R(X - 5, Y - 7, 11, 6, 0x5a4632); R(X - 4, Y - 6, 9, 4, 0xe8e4d8); for (let i = -3; i < 4; i += 2) R(X + i, Y - 5, 1, 2, 0x8a7a5a); R(X - 4, Y - 1, 1, 2, 0x3a2a20); R(X + 4, Y - 1, 1, 2, 0x3a2a20); }); // the board with its plan

  // the platforms the halls stood on: low banks of earth edged with stone, the foundation stones on them in rows
  const platform = (x, u, w, h, cols, rows, gap = null) => {
    fill(x, u, x + w, u + h, (px, pu, X, Y) => {
      if (gap && px > gap[0] && px < gap[1]) return null;
      const edge = px - x < 0.7 || x + w - px < 0.7 || pu - u < 0.7 || u + h - pu < 0.7;
      return edge ? shade(0x9a968c, 0.9 + hashPx(X, Y, 74) * 0.2) : shade(0x8a7a5a, 0.94 + hashPx(X >> 1, Y >> 1, 75) * 0.1); // the edging stones; the bank's packed earth
    });
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const [sx, su] = [x + 2 + (i * (w - 4)) / Math.max(1, cols - 1), u + 2 + (j * (h - 4)) / Math.max(1, rows - 1)];
        if (gap && sx > gap[0] - 1 && sx < gap[1] + 1) continue;
        if (hashPx(i, j, x) < 0.06) continue; // (one gone)
        const [X, Y] = [FX(sx), FY(su)];
        queue(Y + 2, () => {
          for (let jj = -3; jj <= 3; jj++)
            for (let ii = -4; ii <= 4; ii++) {
              const q = (ii * ii) / 18 + (jj * jj) / 9;
              if (q > 1) continue;
              P(X + ii, Y + jj, shade(0xb4b0a6, 1.12 - q * 0.25 + (ii + jj < 0 ? 0.06 : -0.08) + (hashPx(X + ii, Y + jj, 76) - 0.5) * 0.1)); // a granite stone, worn flat on top
            }
          P(X - 1, Y - 1, 0xd8d4ca);
          if (hashPx(i, j, 77) < 0.3) P(X + 1, Y, 0x6a6458); // the socket cut in it for a pillar
        }, () => shadowBox(X - 3, Y - 2, 7, 5, 2, 0.75));
      }
  };
  {
    const m = plot('tofuro_ishizue');
    platform(m.x, m.u, m.w, m.h, 7, 4); // the main hall
    const c = plot('chumon');
    platform(c.x, c.u, c.w, c.h, 4, 2, [88, 92]); // the middle gate, the walk through it
    platform(50, 6790, 14, 46, 2, 6); // the side halls, east and west
    platform(116, 6790, 14, 46, 2, 6);
    platform(76, 6930, 28, 12, 5, 2); // the rear hall
  }
  // the old corridor's line, kept as a low clipped hedge round the court
  for (const [x, u, w, h] of [[46, 6740, 88, 2], [46, 6740, 2, 170], [132, 6740, 2, 170], [46, 6908, 88, 2]])
    fill(x, u, x + w, u + h, (px, pu, X, Y) => (near(road('tofuro_michi').pts, px, pu).d < 2.2 ? null : shade(0x3e5a2a, 0.88 + hashPx(X >> 1, Y >> 1, 78) * 0.24)));
  // the three stone pillars with the government's name on them, on their mound inside a stone fence
  {
    const p = plot('ishibumi');
    const [X, Y] = [FX(p.x + p.w / 2), FY(p.u + 2)];
    queue(Y + 2, () => {
      for (let j = -5; j <= 3; j++) for (let i = -11; i <= 11; i++) if ((i * i) / 121 + (j * j) / 25 <= 1) P(X + i, Y + j, shade(0x6e7e40, 0.95 + hashPx(i, j, 79) * 0.1)); // the mound
      for (let i = -12; i <= 12; i += 2) { P(X + i, Y + 4, 0x9a968c); P(X + i, Y - 6, 0x9a968c); } // the stone fence
      for (const [dx, h] of [[-6, 9], [0, 12], [6, 8]]) {
        R(X + dx - 1, Y - h, 3, h, 0x8a8a84); // a pillar, standing up the strip
        R(X + dx - 1, Y - h, 1, h, 0xb0aea6);
        for (let j = 2; j < h - 1; j += 2) P(X + dx, Y - h + j, 0x4a4840); // the carving down its face
      }
    }, () => shadowBox(X - 7, Y - 12, 15, 12, 6, 0.7));
  }
  // camphors at the field's edges (out of the boss's way), young plums along the walk, a bench or two
  for (const [x, u, r] of [[8, 6660, 5], [172, 6670, 5.6], [10, 6760, 4.6], [170, 6790, 5], [8, 6880, 5.4], [172, 6900, 4.8], [10, 6980, 4.4], [170, 6990, 4.2]]) if (!inArena(x, u, r)) tree('broadleaf', x, u, r);
  for (const u of [6660, 6690, 6950]) for (const dx of [-6, 6]) ume(90 + dx, u, 1.8, pick(['white', 'pink', 'red']), { bloom: 0.8 });
  for (const [x, u] of [[84, 6680], [97, 6960]]) mark(x, u, (X, Y) => { R(X - 4, Y - 1, 9, 2, 0x8a6a4a); for (const q of [-3, 2]) person(X + q, Y - 4, 28400 + X + q); });
  // people on blankets, children, someone with a dog, joggers on the walk
  for (const [x, u, c] of [[30, 6700, 0x3a6ab0], [148, 6720, 0xe0b030], [64, 6870, 0xc8302a], [150, 6880, 0x5a8a4a], [28, 6960, 0x3a6ab0], [118, 6980, 0xe8e4d8], [70, 6770, 0xe0b030], [110, 6670, 0xd84a7a], [40, 6800, 0x5a8a4a], [158, 6820, 0x3a6ab0], [100, 6760, 0xe8e4d8]])
    mark(x, u, (X, Y) => {
      R(X - 5, Y - 3, 11, 7, c); // a blanket
      R(X - 5, Y - 3, 11, 1, shade(c, 1.2));
      for (let i = -5; i < 6; i += 3) P(X + i, Y + 3, shade(c, 0.7)); // its fringe
      for (let q = 0; q < 2 + (X % 2); q++) person(X - 3 + q * 3, Y - 2 + (q % 2), 28500 + X + q);
      R(X + 3, Y + 1, 2, 2, 0xf0ece0); // a box of food
    });
  const walker = (c, h = 0x2a2228) => kit.frame(1, 1.67, 6800, (put) => {
    for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (!(j === 0 && i !== 1)) put(i, j, j === 0 ? h : j === 1 && i === 1 ? 0xe8b890 : j < 4 ? c : 0x2a2a30);
  });
  const people = [0x2a2a30, 0x8a6a4a, 0xe8e4d8, 0x3a4a6a, 0xa83a3a, 0xd8b090].map((c) => walker(c));
  const kids = [0xe0b030, 0xd84a4a, 0x4a8ad8].map((c) => kit.frame(1, 1.34, 6800, (put) => { for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) if (!(j === 0 && i !== 1)) put(i, j, j === 0 ? 0x2a2228 : j < 3 ? c : 0x2a2a30); }));
  props.path(road('tofuro_michi').pts, people, { sp: 1.4, n: 4, gap: 50, mode: 'pp', hold: 3, turn: 'none', s0: 0.1 });
  props.path(road('dorui_michi').pts, people, { sp: 1.6, n: 5, gap: 40, mode: 'wrap', turn: 'none', s0: 0.4 });
  props.path([[180, 7035], [0, 7035]], people, { sp: 1.3, n: 4, gap: 50, mode: 'wrap', turn: 'none', s0: 0.7 });
  const loop = (cx, cu, rx, ru, n = 13) => Array.from({ length: n }, (_, k) => [cx + Math.cos((k / (n - 1)) * Math.PI * 2) * rx, cu + Math.sin((k / (n - 1)) * Math.PI * 2) * ru]);
  props.path(loop(36, 6730, 10, 6), kids, { sp: 3.2, n: 3, gap: 6, mode: 'wrap', turn: 'none', s0: 0.2 }); // children chasing round
  props.path(loop(140, 6950, 12, 7), kids, { sp: 3, n: 2, gap: 9, mode: 'wrap', turn: 'none', s0: 0.6 });
  const dog = kit.frame(1.34, 1, 6800, (put) => { for (let i = 0; i < 4; i++) put(i, 1, 0xc89a5a); put(3, 0, 0xc89a5a); put(0, 2, 0x8a6a3a); put(3, 2, 0x8a6a3a); });
  props.path([[20, 6640], [24, 6760], [16, 6880], [22, 7000], [16, 6880], [24, 6760], [20, 6640]], [walker(0x3a5a3a), dog], { sp: 1.2, n: 2, gap: 2, mode: 'wrap', turn: 'none', s0: 0.3 });

  // ---- the earthwork: its bank of rammed earth under grass, lit on the slope towards us, in shade on the far side,
  // the crest's line; trees on it at both ends, out of the boss's way; steps up it; the wooden conduit through it to
  // the moat; a board and a stone marker at its foot
  const DR = ground_('dorui').rect;
  const crest = (x) => DR[1] + DR[3] * 0.52 + Math.sin(x / 23) * 1.2;
  fill(DR[0], DR[1], DR[0] + DR[2], DR[1] + DR[3], (x, u, X, Y) => {
    const t = (u - DR[1]) / DR[3];
    const c = crest(x);
    const n = fbm(x, u, { seed: 81, scale: 6, octaves: 3 });
    const near_ = u < c ? (u - DR[1]) / (c - DR[1]) : 1 - (u - c) / (DR[1] + DR[3] - c); // 0 at the foot, 1 on the crest
    if (Math.abs(u - c) < 0.5) return shade(0xa0aa5a, 0.95 + n * 0.1); // the crest, the last sun on it
    let col = u < c ? shade(0x7e8c44, 0.86 + near_ * 0.22 + n * 0.12) : shade(0x56662e, 0.8 + near_ * 0.2 + n * 0.1); // the slope towards us lit, the far one in shade
    if (Y % 7 === 0 && u < c && t < 0.3 && hashPx(X, Y, 82) < 0.5) col = shade(0x8a7a5a, 0.95); // the rammed layers showing at its foot
    const fall = hashPx(X, Math.floor(Y / 5), 83); // the grass lying down the slope in streaks
    if (fall < 0.12) col = shade(col, u < c ? 1.14 : 1.1);
    else if (fall > 0.9) col = shade(col, 0.88);
    if (u > c && (DR[1] + DR[3] - u) < 2.4) col = shade(col, 0.8); // the shade at its foot by the water
    return col;
  });
  for (let k = 0; k < 60; k++) {
    const x = hashPx(k, 1, 84) < 0.5 ? 2 + hashPx(k, 2, 84) * 22 : 156 + hashPx(k, 2, 84) * 22;
    const u = DR[1] + 6 + hashPx(k, 3, 84) * (DR[3] - 10);
    if (inArena(x, u, 4)) continue;
    const kind = hashPx(k, 4, 84) < 0.35 ? 'cedar' : hashPx(k, 4, 84) < 0.5 ? 'pine' : 'broadleaf';
    tree(kind, x, u, kind === 'cedar' ? 1.6 : 2.2 + hashPx(k, 5, 84) * 1.2);
  }
  fill(26.5, DR[1], 29.5, crest(28), (x, u, X, Y) => (Y % 3 === 0 ? 0x6a5a40 : shade(0xa89a7a, 0.95 + hashPx(X, Y, 85) * 0.08))); // timber steps up the bank
  {
    const x = 160;
    fill(x - 1.6, crest(x) + 2, x + 1.6, DR[1] + DR[3] + 3, (px, pu, X, Y) => (X % 5 === 0 ? 0x3a2a1e : (Y % 4 === 0 ? 0x5a4630 : shade(0x7a5e40, 0.95 + hashPx(X, Y, 86) * 0.1)))); // the conduit's planked box, out over the moat
    mark(x, DR[1] + DR[3] + 3, (X, Y) => { for (let i = -3; i <= 3; i++) P(X + i, Y + 1, 0xa8c8d0); }); // water trickling out of it
  }
  mark(32, DR[1] - 1, (X, Y) => { R(X - 4, Y - 6, 9, 5, 0x5a4632); R(X - 3, Y - 5, 7, 3, 0xe8e4d8); R(X - 3, Y - 1, 1, 2, 0x3a2a20); R(X + 3, Y - 1, 1, 2, 0x3a2a20); }); // a board about it
  mark(152, DR[1] - 1, (X, Y) => { R(X - 1, Y - 6, 3, 7, 0x9a968c); R(X - 1, Y - 6, 1, 7, 0xb4b0a6); }); // a stone marker

  // ---- the moat: reeds along its edges, lilies, a heron standing in it, the sunset in the water
  const MO = WATER.find((w) => w.id === 'mizuki_hori').rect;
  for (let x = 1; x < W - 1; x += 1.2) {
    for (const [u, dir] of [[MO[1] + 0.6, 1], [MO[1] + MO[3] - 0.6, -1]]) {
      if (hashPx(x * 3, u, 87) < 0.45) continue;
      mark(x, u, (X, Y) => { const h = 2 + Math.floor(hashPx(X, Y, 88) * 4); for (let j = 0; j < h; j++) P(X + (j > 2 ? 1 : 0), Y - dir * j, j === h - 1 ? 0xb0a060 : 0x5a7a3a); }); // reeds
    }
  }
  for (let k = 0; k < 44; k++) {
    const [x, u] = [(hashPx(k, 0, 89) < 0.5 ? 4 + hashPx(k, 1, 89) * 40 : 130 + hashPx(k, 1, 89) * 46) + (hashPx(k, 6, 89) - 0.5) * 6, MO[1] + 4 + hashPx(k, 2, 89) * (MO[3] - 8)];
    mark(x, u, (X, Y) => {
      for (let j = -2; j <= 2; j++) for (let i = -3; i <= 3; i++) if (i * i + j * j * 2 <= 9 && !(i > 0 && j === 0)) P(X + i, Y + j, shade(0x4a7a3a, 0.9 + (i + j < 0 ? 0.15 : 0))); // a lily pad, its notch
      if (k % 4 === 0) { P(X, Y - 1, 0xf4f0f0); P(X - 1, Y, 0xf0c8d0); } // a flower
    });
  }
  mark(124, MO[1] + 9, (X, Y) => { R(X, Y - 5, 2, 5, 0xc8ccd0); P(X - 1, Y - 5, 0xc8ccd0); P(X - 2, Y - 5, 0xe0b040); R(X + 1, Y - 3, 2, 2, 0x8a9098); P(X, Y + 1, 0x4a4a40); }); // a heron, still, watching the water
  for (let k = 0; k < 40; k++) {
    const [x, u] = [hashPx(k, 3, 90) * W, MO[1] + 3 + hashPx(k, 4, 90) * (MO[3] - 6)];
    glint(FX(x), FY(u), 2 + Math.floor(hashPx(k, 5, 90) * 6), k % 3 ? 0xffb070 : 0xffe0b0, 0.55);
  }

  // ---- beyond: the last fields; the wooded foot of Mt Ono with a stretch of its old castle's stone walls
  fields(0, 7126, 110, L, 28600);
  const ON = ground_('ono_yama').rect;
  fill(118, 7140, W, 7150, (x, u, X, Y) => {
    const wall = Math.abs(u - (7145 + Math.sin(x / 9) * 3)) < 1.1;
    const d = u - (7145 + Math.sin(x / 9) * 3);
    if (inArena(x, u, 3) || Math.abs(d) > 1.6) return null;
    if (d < -1.1) return 0x2a2a22; // its shadow
    const course = Math.floor((d + 1.6) * 3);
    const stone = ((X + course * 3) % 6 === 0) || Y % 3 === 0;
    return stone ? 0x6a665e : shade(hashPx(X >> 1, Y, 91) < 0.25 ? 0x6a7a4a : 0xb0aca2, 0.85 + hashPx(X, Y, 96) * 0.25); // the stones laid in courses, moss on some
  });
  woods(ON[0], ON[1], ON[0] + ON[2], L, 8, (x, u) => inArena(x, u, 3) || Math.abs(u - (7145 + Math.sin(x / 9) * 3)) < 2.4, ['cedar', 'broadleaf', 'broadleaf']);

  void house; void crowd; void rand; void shadowBox;
}
