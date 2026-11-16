// Minato (u 3900-4884), in the blue hour: the sky still has colour, the city is all lamps.
//   Roppongi - the tower on its hill over a garden with a pond, the other tower by its lawn, the crossing under
//     the expressway among its signs;
//   Shiba park - the Tokyo Tower: four legs of lattice in orange and white rising out of the trees to its two
//     decks and the mast, the hall at its foot; its lamps come on from the ground up as it rises into view;
//   Zōjō-ji - the red gate, the great hall, the bell, the censer, the rows of little Jizō in red caps with their
//     pinwheels turning, the walled graves of the shōguns behind.
// Live: the tower's lamps, the pinwheels, the censer's smoke.
import { lots } from './blocks.mjs';
import { PAL, shade, blend } from './kit.mjs';
import { hashPx } from '../hires.mjs';

export function minato(ctx) {
  const { kit, blocks, pave, plot, props, near, ROADS, S, L } = ctx;
  const { building, house, tree, crowd, mark, ground, rand, pick, P, R, E, ER, halo, FX, FY, queue, shadowBox, car } = kit;
  kit.setSun(0.14);
  const road = (id) => ROADS.find((r) => r.id === id).pts;
  const lampAt = (x, u, c) => mark(x, u, (X, Y) => kit.lamp(X, Y, c));
  /** A stone lantern, lit. */
  const toro = (x, u) =>
    mark(x, u, (X, Y) => {
      R(X - 1, Y - 2, 3, 3, 0x6a6a66);
      R(X - 2, Y - 6, 5, 1, 0x8a8a84);
      ER(X - 1, Y - 5, 3, 3, 0xffd880);
      R(X - 1, Y - 7, 3, 1, 0x7a7a74);
      halo(X, Y - 3, 8, 7, 0xffc060, 0.22);
    });

  // ---- the tower on the hill: a garden with a pond at its foot, the mall's wing, the deck on its roof
  {
    const p = plot('roppongi_hills');
    pave(p.x, p.u, p.w, p.h, 'plaza', 101);
    pave(p.x + 2, p.u + 2, p.w - 4, 44, 'park', 102);
    ground(() => {
      const [cx, cu] = [p.x + 24, p.u + 22];
      for (let u = cu - 11; u < cu + 11; u += 1 / 3)
        for (let x = cx - 17; x < cx + 17; x += 1 / 3) {
          const d = ((x - cx) / 16) ** 2 + ((u - cu) / 10) ** 2 + (hashPx(Math.floor(x), Math.floor(u), 5) - 0.5) * 0.08;
          if (d < 1) P(FX(x), FY(u), d > 0.86 ? 0x8c887e : [0x24505c, 0x2c5c68, 0x366a74][Math.floor(hashPx(FX(x) >> 2, FY(u) >> 1, 7) * 3)]);
        }
      for (let i = -3; i <= 3; i++) for (let j = -2; j <= 2; j++) if (Math.hypot(i, j * 1.4) < 3.4) P(FX(cx + 5) + i, FY(cu + 1) + j, 0x5a8a48); // an islet
    });
    toro(p.x + 29, p.u + 23.4);
    for (let k = 0; k < 26; k++) {
      const [x, u] = [p.x + 4 + rand() * (p.w - 8), p.u + 4 + rand() * 40];
      if (((x - p.x - 24) / 18) ** 2 + ((u - p.u - 22) / 12) ** 2 < 1) continue;
      tree(pick(['broadleaf', 'sakura', 'sakura', 'pine']), x, u, 2.2 + rand() * 1.6);
    }
    for (const [x, u] of [[p.x + 6, p.u + 6], [p.x + 44, p.u + 8], [p.x + 50, p.u + 36], [p.x + 8, p.u + 40]]) lampAt(x, u);
    building(p.x + 13, p.u + 50, 40, 74, {
      face: 48, style: 'glass', glass: [0x2a3850, 0x8aa8c8], roof: 0x6c7480, s: 1001, lit: 0.62,
      tiers: [{ in: [3, 3, 3, 3], face: 4, top: ({ X, Y, w, h, helipad, umbrella: _u, lamp, E: lit, R: rect }) => {
        rect(X + 2, Y + 2, w - 4, h - 4, 0x8a8478);
        helipad(X + (w >> 1), Y + (h >> 1), Math.min(13, (h >> 1) - 4));
        for (let i = 3; i < w - 3; i += 6) {
          lit(X + i, Y + 2, 0xfff0c0);
          lit(X + i, Y + h - 3, 0xfff0c0);
        }
        lamp(X + 6, Y + h - 5);
        lamp(X + w - 7, Y + h - 5);
        void _u;
      } }],
    });
    mark(p.x + 33, p.u + 118, (X, Y) => kit.mast(X, Y, 14), p.u + 50);
    building(p.x + 1, p.u + 50, 11, 52, { face: 7, style: 'depato', wall: 0xd8d0c0, trim: 0x3a3a44, roof: 0x8a8880, shop: true, s: 1002 });
    for (let u = p.u + 54; u < p.u + 120; u += 12) tree('broadleaf', p.x + 56.4, u, 2.2);
    crowd(p.x + 13, p.u + 45, 40, 4, 16);
  }
  // ---- the other tower, slimmer, the lawn beside it with its pavilion
  {
    const p = plot('midtown');
    pave(p.x, p.u, p.w, p.h, 'plaza', 103);
    building(p.x + 2, p.u + 2, 30, 60, {
      face: 40, style: 'glass', glass: [0x2c4a48, 0x9cc8c0], roof: 0x70787a, s: 1003, lit: 0.6,
      tiers: [{ in: [3, 3, 3, 3], face: 5, tiers: [{ in: [4, 4, 4, 4], face: 3 }] }],
    });
    pave(p.x + 34, p.u + 2, p.w - 36, p.h - 4, 'park', 104);
    house(p.x + 36, p.u + 44, 13, 10, { tile: 0x626a78, wall: 0xe4dccc, s: 1004 });
    for (let k = 0; k < 12; k++) tree(pick(['broadleaf', 'sakura', 'tiny']), p.x + 36 + rand() * 13, p.u + 5 + rand() * 34, 2 + rand() * 1.4);
    for (const u of [p.u + 6, p.u + 26, p.u + 58]) lampAt(p.x + 34, u);
    crowd(p.x + 2, p.u - 4, 30, 3, 9);
  }

  // ---- Roppongi's crossing: cars held at the lights, lamps down the avenues, people out for the evening
  for (let k = 0; k < 4; k++) {
    car(85.6 + (k % 2) * 2.8, 4046 - k * 8, true, undefined, false);
    car(91.6 + (k % 2) * 2.8, 4074 + k * 8, true, undefined, true);
    car(76 - k * 9, 4061.6 + (k % 2) * 2.6, false, undefined, true);
    car(104 + k * 9, 4055.6 + (k % 2) * 2.6, false, undefined, false);
  }
  for (let u = 3904; u < 4186; u += 22) {
    if (Math.abs(u - 4060) < 12) continue;
    lampAt(98.4, u);
    lampAt(81.6, u + 11);
  }
  for (let x = 8; x < 176; x += 24) {
    if (Math.abs(x - 90) < 14) continue;
    lampAt(x, 4067.4);
    lampAt(x + 12, 4052.6);
  }
  crowd(82.2, 3904, 1.4, 280, 50);
  crowd(96.4, 3904, 1.4, 280, 50);
  crowd(0, 4066.2, 82, 1.2, 26);
  crowd(98, 4052.6, 82, 1.2, 26);
  for (let k = 0; k < 7; k++) {
    car(85.6 + (k % 2) * 2.8, 3906 + k * 19 + rand() * 6, true, undefined, false);
    car(91.6 + (k % 2) * 2.8, 4090 + k * 13 + rand() * 4, true, undefined, true);
  }
  for (const id of ['tower_nishi', 'tower_higashi']) {
    const pts = road(id);
    for (let s = 20; s < 720; s += 26) {
      // (along the street, by its length)
      let [run, at] = [s, null];
      for (let i = 0; i + 1 < pts.length && !at; i++) {
        const len = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
        if (run <= len) at = [pts[i][0] + ((pts[i + 1][0] - pts[i][0]) * run) / len, pts[i][1] + ((pts[i + 1][1] - pts[i][1]) * run) / len, (pts[i + 1][1] - pts[i][1]) / len];
        run -= len;
      }
      if (at) lampAt(at[0] + (id === 'tower_nishi' ? -5.6 : 5.6) * Math.max(0.75, at[2]), at[1] + (at[2] < 0.9 ? 3 : 0));
    }
  }

  // ---- Shiba park: trees thick round the tower, lamps down its paths, people looking up
  {
    const t = plot('tokyo_tower');
    const paths = ['tower_michi_s', 'tower_michi_n', 'tower_michi_w', 'tower_michi_e'].map(road);
    for (let k = 0; k < 430; k++) {
      const [x, u] = [40 + rand() * 100, 4253 + rand() * 366];
      if (x > t.x - 4 && x < t.x + t.w + 4 && u > t.u - 4 && u < t.u + t.h + 3) continue;
      if (paths.some((q) => near(q, x, u).d < 4.4)) continue;
      if (Math.hypot((x - 62) / 14, (u - 4540) / 22) < 1 || Math.hypot((x - 120) / 13, (u - 4290) / 18) < 1) continue; // (two lawns)
      tree(pick(['broadleaf', 'broadleaf', 'broadleaf', 'pine', 'sakura', 'cedar']), x, u, 2.6 + rand() * 2);
    }
    ground(() => {
      for (const [cx, cu, rx, ru] of [[62, 4540, 12, 20], [120, 4290, 11, 16]])
        for (let u = cu - ru; u < cu + ru; u += 1 / 3)
          for (let x = cx - rx; x < cx + rx; x += 1 / 3) {
            const d = ((x - cx) / rx) ** 2 + ((u - cu) / ru) ** 2;
            if (d < 1 && hashPx(FX(x), FY(u), 5) > (d - 0.8) * 5) P(FX(x), FY(u), hashPx(FX(x), FY(u), 6) < 0.5 ? 0x76a455 : 0x6c9a4e);
          }
    });
    for (let u = 4206; u < 4630; u += 20) if (u < t.u - 4 || u > t.u + t.h + 4) lampAt(90 + (Math.round(u / 20) % 2 ? 3.4 : -3.4), u);
    for (const x of [38, 48, 132, 142]) lampAt(x, 4375);
    crowd(88, 4200, 4, 136, 26);
    crowd(88, 4410, 4, 216, 30);
    crowd(t.x + 2, t.u - 4, t.w - 4, 3, 22);
    crowd(54, 4530, 16, 20, 7);

    // ---- the tower. A point z above the ground is drawn z up the strip, so each level is a square further up:
    // four legs curving in to the main deck, the shaft to the top deck, the mast.
    pave(t.x, t.u, t.w, t.h, 'plaza', 105);
    const [CX, CY] = [FX(90), FY(4372)];
    const hwAt = (z) => (z < 135 ? 27 + 63 * (1 - z / 135) ** 2 : z < 255 ? 27 - (15 * (z - 135)) / 120 : Math.max(1, 12 - (11 * (z - 255)) / 135));
    const px = new Map(); // fine pixel -> [colour, z, a window?]
    const put = (X, Y, c, z, win = 0) => px.set(Y * 100000 + X, [X, Y, c, z, win]);
    const line = (x0, y0, x1, y1, c, z) => {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      for (let k = 0; k <= n; k++) put(Math.round(x0 + ((x1 - x0) * k) / n), Math.round(y0 + ((y1 - y0) * k) / n), c, z);
    };
    const paint = (z) => (Math.floor(z / 45) % 2 ? 0xf0ece4 : 0xe8542a);
    const corners = (z) => {
      const h = hwAt(z);
      return [[CX - h, CY - z - h], [CX + h, CY - z - h], [CX + h, CY - z + h], [CX - h, CY - z + h]];
    };
    const RING = 18;
    for (let z = 0; z <= 390; z++) {
      const c = paint(z);
      const q = corners(z);
      if (z % RING === 0 && z < 381) {
        const up = corners(z + RING);
        for (let i = 0; i < 4; i++) {
          line(...q[i], ...q[(i + 1) % 4], shade(c, i === 2 ? 1 : 0.8), z);
          line(...q[i], ...up[(i + 1) % 4], shade(c, 0.86), z); // the bracing, crossed
          line(...q[(i + 1) % 4], ...up[i], shade(c, 0.86), z);
        }
      }
      for (const [k, [x, y]] of q.entries()) {
        put(Math.round(x), Math.round(y), shade(c, k === 3 ? 1.12 : k === 0 ? 1 : 0.84), z);
        if (z < 255) put(Math.round(x) + (k === 0 || k === 3 ? 1 : -1), Math.round(y), shade(c, 0.9), z);
      }
      // the decks: a box of two floors at the main level, a small one near the top
      for (const [dz, dh, wall] of [[135, 31, 11], [255, 14, 6]])
        if (z === dz)
          for (let j = -dh - wall; j <= dh; j++)
            for (let i = -dh; i <= dh; i++) {
              const roof = j < dh - wall;
              const win = !roof && (j - dh + wall) % 5 >= 2 && i % 3 !== 0 && Math.abs(i) < dh;
              put(CX + i, CY - dz + j, roof ? (Math.abs(i) > dh - 2 || j < -dh - wall + 2 ? 0xc8ccd0 : 0x9a9ea6) : win ? 0x3a4a60 : 0xe4e0d8, dz + 1, win ? 1 : 0);
            }
    }
    const tower = [...px.values()].sort((a, b) => a[3] - b[3]);
    queue(FY(t.u), () => {
      for (const [X, Y, c] of tower) P(X, Y, c);
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
        // the legs' feet: blocks of concrete
        R(CX + sx * 90 - 5, CY + sy * 90 - 3, 10, 7, 0xb8b8b0);
        R(CX + sx * 90 - 5, CY + sy * 90 - 3, 10, 2, 0xdcdcd4);
      }
      ER(CX - 1, CY - 392, 2, 2, 0xff4030); // the lamp on the mast's tip
    });
    // the hall at its foot, a little fair on its roof
    building(t.x + 18, t.u + 14, 28, 24, {
      face: 5, style: 'office', wall: 0xd8d4cc, roof: 0x8a8e96, shop: true, sign: 0xe03a3a, s: 1005,
      top: ({ X, Y, w, h, parasol, umbrella: _u, lamp }) => {
        for (let k = 0; k < 6; k++) parasol(X + 10 + (k % 3) * 24, Y + 12 + Math.floor(k / 3) * 22, PAL.awning[k]);
        lamp(X + 5, Y + h - 6);
        lamp(X + w - 6, Y + h - 6);
        void _u;
      },
    });
    // its lamps: nothing, then lit to a third, two thirds, the top, and the glow round it - by the flight
    const [fx0, fy0, fw, fh] = [CX - 96, CY - 396, 192, 492];
    const lit = (upTo) =>
      kit.frame(64, 164, 4372, (putF) => {
        for (const [X, Y, c, z, win] of tower) {
          if (z > upTo) continue;
          const [i, j] = [X - fx0, Y - fy0];
          const white = (c & 255) > 150;
          putF(i, j, win ? 0xfffbe0 : white ? 0xfff4d0 : z % RING === 0 ? 0xffc050 : 0xffa030);
          for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!px.has((Y + dj) * 100000 + X + di) && i + di >= 0 && i + di < fw && j + dj >= 0 && j + dj < fh) putF(i + di, j + dj, 0xff9030, 0.28);
        }
        if (upTo >= 390) for (let j = 0; j < 3; j++) for (let i = 0; i < 2; i++) putF(CX - 1 - fx0 + i, CY - 393 - fy0 + j, 0xff5040);
      }, true);
    const blank = kit.frame(1, 1, 4372, () => {}, true);
    props.loop(58, (L * S - fy0) / S, [blank, lit(110), lit(200), lit(300), lit(400)], { fps: 1, by: [4466, 16], d: 0.3 });
    halo(CX, CY + 20, 150, 120, 0xff9040, 0.12);
  }

  // ---- Zōjō-ji
  {
    const DARK = 0x4a5058;
    const RED = 0xb03a2a;
    // the hall on its stone terrace, a porch over its steps
    const p = plot('zojoji_hondo');
    pave(p.x, p.u, p.w, p.h, 'paving', 111);
    ground(() => {
      for (let j = 0; j < 9; j++) R(FX(p.x + 22), FY(p.u + p.h) - 3 + j * 2 - 18, 48, 1, j % 2 ? 0x8a847a : 0xb4aea2); // (the steps down to the way in)
    });
    house(p.x + 3, p.u + 6, 54, 42, { tile: DARK, wall: 0xe8e0d0, face: 4, s: 1101 });
    house(p.x + 19, p.u + 1, 22, 9, { tile: DARK, wall: RED, s: 1102 });
    for (const dx of [8, 52]) toro(p.x + dx, p.u + 3);
    // the gate: two storeys of vermilion under dark tiles
    const g = plot('sangedatsumon');
    pave(g.x, g.u, g.w, g.h, 'paving', 112);
    house(g.x + 1, g.u + 1, 26, 12, { tile: DARK, wall: RED, face: 4, s: 1103 });
    house(g.x + 3.4, g.u + 7, 21.2, 11, { tile: DARK, wall: RED, face: 3, s: 1104, over: g.u + 1 });
    // the bell under its roof, the censer smoking in front of the hall
    house(46, 4788, 9, 9, { tile: DARK, wall: 0x6a4a38, s: 1105 });
    mark(50.4, 4790, (X, Y) => {
      R(X - 2, Y - 4, 4, 5, 0x4a6a5a);
      R(X - 2, Y - 4, 1, 5, 0x6a8a7a);
    }, 4788);
    mark(90, 4772, (X, Y) => {
      R(X - 4, Y - 2, 8, 3, 0x5a5048);
      R(X - 3, Y - 6, 6, 4, 0x7a6a50);
      R(X - 3, Y - 6, 6, 1, 0xa89060);
      ER(X - 1, Y - 5, 2, 1, 0xff8040);
      R(X - 5, Y - 9, 10, 2, DARK);
    });
    kit.smoke(90, 4774.6, { rate: 0.8, a: 0.4 });
    // the graves of the shōguns behind their wall: a gate of bronze, stone lanterns in rows, the stupas
    pave(54, 4638, 72, 50, 'gravel', 113);
    ground(() => {
      for (let x = 54; x < 126; x += 1 / 3) for (const u of [4638, 4687.67]) P(FX(x), FY(u), Math.floor(x * 3) % 5 ? 0xd8d4c8 : 0x8a8a84);
      for (let u = 4638; u < 4688; u += 1 / 3) for (const x of [54, 125.67]) P(FX(x), FY(u), 0xd8d4c8);
    });
    house(84, 4684, 12, 7, { tile: 0x4a6a5a, wall: 0x5a4a38, s: 1106 });
    for (let k = 0; k < 6; k++)
      mark(62 + k * 11, 4652, (X, Y) => {
        R(X - 3, Y - 2, 7, 3, 0x8a8a84);
        R(X - 2, Y - 8, 5, 6, 0xa4a49c);
        R(X - 2, Y - 8, 1, 6, 0xc4c4bc);
        R(X - 1, Y - 11, 3, 3, 0x9a9a92);
        P(X, Y - 13, 0x7a7a74);
        for (let q = 1; q <= 2; q++) for (let i = -3; i < 4; i++) ctx.img.hi.tint(X + i + q, Y + q, 0.74);
      });
    for (let k = 0; k < 9; k++) for (const u of [4664, 4674]) toro(60 + k * 7.5, u);
    // the Jizō: two rows of little stone children in red caps and bibs, a pinwheel by each
    const j = plot('jizo');
    pave(j.x, j.u, j.w, j.h, 'gravel', 114);
    const SPOT = [];
    for (let u = j.u + 3; u < j.u + j.h - 2; u += 3.4) for (const dx of [2.6, 8.6]) SPOT.push([j.x + dx, u]);
    for (const [x, u] of SPOT)
      mark(x, u, (X, Y) => {
        ctx.img.hi.tint(X + 3, Y, 0.74);
        R(X, Y - 4, 3, 5, 0x9a9a94);
        P(X, Y - 4, 0xbcbcb4);
        R(X, Y - 6, 3, 2, 0xd03a30); // the cap
        R(X, Y - 3, 3, 1, 0xe04a40); // the bib
        R(X + 5, Y - 5, 1, 6, 0x6a5a40); // the pinwheel's stick
      });
    const wheels = (ph) =>
      kit.frame(j.w, j.h, j.u + j.h / 2, (putF) => {
        for (const [k, [x, u]] of SPOT.entries()) {
          const [i, jj] = [Math.round((x - j.x) * S) + 5, Math.round((j.u + j.h - u) * S) - 6];
          const c = [0xf04060, 0xf0c020, 0x40b0e0, 0x60d080, 0xf080c0][k % 5];
          const t = (ph + k) % 3;
          putF(i, jj, 0xf8f4ec);
          // four vanes, turned a little each frame
          for (const [a, b] of t === 0 ? [[-1, 0], [1, 0], [0, -1], [0, 1]] : t === 1 ? [[-1, -1], [1, 1], [1, -1], [-1, 1]] : [[-1, 0], [1, 0], [0, -1], [0, 1]]) putF(i + a, jj + b, t === 2 ? shade(c, 1.25) : c);
        }
      });
    props.loop(j.x, j.u + j.h, [wheels(0), wheels(1), wheels(2)], { fps: 5 });
    crowd(j.x - 5, j.u + 6, 4, 60, 7);
    // lanterns down the way in, pines and cherries round the court, people
    for (let u = 4762; u < 4838; u += 11) for (const dx of [-6, 6]) toro(90 + dx, u);
    for (let k = 0; k < 90; k++) {
      const [x, u] = [40 + rand() * 100, 4632 + rand() * 236];
      if ((x > 52 && x < 128 && u > 4636 && u < 4762) || Math.abs(x - 90) < 9 || (x > 120 && x < 142 && u > 4686 && u < 4774) || (x > 72 && x < 108 && u > 4836) || (x > 43 && x < 58 && u > 4785 && u < 4800)) continue;
      tree(pick(['pine', 'pine', 'sakura', 'broadleaf']), x, u, 2.6 + rand() * 1.8);
    }
    crowd(84, 4762, 12, 76, 22);
    crowd(70, 4690, 40, 8, 10);
  }

  ctx.claim(38, 4622, 104, 8); // (between the park and the temple: the way through, nothing built)
  pave(38, 4622, 104, 8, 'gravel', 115);

  // ---- the blocks: signs round Roppongi's crossing, offices, flats and embassies in their gardens beyond
  for (const b of blocks(3900, 4884, 6, 8, true)) {
    const hot = b[1] > 3960 && b[1] < 4170 && b[0] > 20 && b[0] < 160;
    for (const [x, u, w, h] of lots(b, rand, hot ? { depth: [14, 20], width: [10, 18], small: true } : { depth: [12, 18], width: [9, 16], small: true })) {
      if (w < 6 || h < 7) continue;
      const v = rand();
      if (hot) building(x, u, w - 1, h, { style: pick(['neon', 'neon', 'office', 'glass']), wall: pick([0x4a4654, 0x5a5460, 0x3e4250, 0x54504c]), face: 7 + Math.floor(rand() * 8), shop: true, sign: rand() < 0.8 });
      else if (v < 0.66) building(x, u, w - 1, h, { style: pick(['office', 'balcony', 'glass', 'plain', 'granite']), face: 5 + Math.floor(rand() * 9), shop: rand() < 0.5, sign: rand() < 0.4, heli: 0.15 });
      else if (v < 0.82) house(x, u, w - 1, h - 1, { hip: rand() < 0.7, lantern: rand() < 0.15 });
      else if (v < 0.93) {
        // a walled garden: a house deep among its trees
        pave(x, u, w - 1, h - 1, 'park');
        if (w > 9 && h > 9) house(x + 2, u + 2, w - 6, h - 6, { tile: pick(PAL.tile) });
        for (let k = 0; k < 2 + Math.floor((w * h) / 50); k++) tree(pick(['broadleaf', 'pine', 'sakura']), x + 1.5 + rand() * (w - 3), u + 1.5 + rand() * (h - 3), 1.8 + rand() * 1.4);
      } else {
        pave(x, u, w - 1, h - 1, 'asphalt');
        for (let i = 3; i < w - 3; i += 4) if (rand() < 0.6) car(x + i, u + h - 5, true);
        lampAt(x + 1, u + h - 1);
      }
    }
  }
  for (const [x, u, w, h] of blocks(3900, 4884, 4, 5, true)) {
    if (w >= 7 && h >= 8) building(x, u, w - 1, Math.min(h, 16), { style: pick(['plain', 'office']), face: 4 + Math.floor(rand() * 3), shop: true, sign: rand() < 0.5 });
    else {
      pave(x, u, w - 0.67, h - 0.67, 'park');
      tree(pick(['broadleaf', 'tiny', 'sakura']), x + w / 2, u + h / 2, 1.6 + rand());
    }
  }
  void blend;
  void shade;
}
