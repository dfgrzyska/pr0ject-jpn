// Senko-ji's hillside (docs/plan-onomichi.md, section 4.1 and phase 5; the close-up of phase 4 was approved by the
// author): the town of slopes seen from above at dusk. Up from the railway the
// hillside rises to the right in terraces along its contours, each held up by a wall of dressed granite (ishigaki)
// with a lane at its foot one person wide, its houses facing the sea under grey tiles, here and there an empty house
// gone to ivy, a garden, a well, a little Jizo chapel; steps climb between the walls, lamps along them coming on.
// Tennei-ji's three-storeyed pagoda stands over the roofs; the cats' lane winds up past walls where cats sleep and
// wash; Senko-ji's vermilion hall stands on its rock among the great boulders, the Tamanoiwa's jewel glowing on its
// top, the mirror rock, the bell; above, the park with its lawns, trees and the lookout, the ropeway's gondolas
// passing over the roofs. Below the railway the narrow town along the coast road, the quay, boats tied up, and across
// the strait Mukaishima's shore. Our own drawing of the place: no artist's painted cats, no film's scenes.
import { PAL, shade } from '../tokyo/kit.mjs';
import { hashPx } from '../hires.mjs';
import { near, inShape, railHalf } from '../tokyo/geom.mjs';
import { W, ROADS, RAILS, PLOTS, GROUNDS, FERRIES, railX, suidoShores, isSea } from './route.mjs';

const FERRY_US = FERRIES.slice(1).map((f) => f.pts[0][1]);
import { makeParts, VERMILION } from '../kawaguchiko/parts.mjs';

export const SENKOJI_FROM = 3800;
export const SENKOJI_TO = 5100;
// the terraces (and their houses, cats, steps and lamps) go on up the hillside behind Hondori to the station
export const HILL_TO = 6900;

// Onomichi's roofs: silver-grey and blue-grey kawara mostly, now and then a brown one or a tin roof gone to rust
const TILES = [0x6a7078, 0x5e646e, 0x747a82, 0x4e5662, 0x585e66, 0x6c625a, 0x7a5a48];
const TIN = [0x4a6a8a, 0x8a4a32, 0x5a7a6a];
const STUCCO = [0xe4dccc, 0xd8cfc0, 0xcfc6b6, 0xb8a890, 0x8a6a50, 0xe8e2d4];
const GRANITE = [0x8a867e, 0x9e9a90, 0xb2aea2, 0xc4c0b4];
// the cats of the town: white, black, ginger, grey tabby, calico, black-and-white
const CATS = [[0xf2efe8, 0xcfc8bc], [0x2a2628, 0x46403e], [0xe0903e, 0xb0662a], [0x8e8a82, 0x5e5a54], [0xf0ece4, 0xd88a3a, 0x2a2628], [0xf0ece4, 0x2a2628]];

/**
 * What the route already takes between u0 and u1 (roads with their pavements, tracks, plots, grounds of their own,
 * the sea) on a grid of logical pixels: taken(x, u), boxFree(x, u, w, h), claim(x, u, w, h) (then taken too).
 */
export function freeMap(U0, U1) {
  const NU = U1 - U0;
  const busy = new Uint8Array(W * NU);
  const mark_ = (test, x0, u0, x1, u1) => {
    for (let u = Math.max(U0, Math.floor(u0)); u < Math.min(U1, Math.ceil(u1)); u++)
      for (let x = Math.max(0, Math.floor(x0)); x < Math.min(W, Math.ceil(x1)); x++) if (!busy[(u - U0) * W + x] && test(x + 0.5, u + 0.5)) busy[(u - U0) * W + x] = 1;
  };
  for (const r of ROADS) {
    const reach = r.w / 2 + (r.cls === 'street' ? 1.6 : r.cls === 'avenue' ? 2.4 : 0.6);
    const xs = r.pts.map((p) => p[0]);
    const us = r.pts.map((p) => p[1]);
    mark_((x, u) => near(r.pts, x, u).d <= reach, Math.min(...xs) - reach, Math.min(...us) - reach, Math.max(...xs) + reach, Math.max(...us) + reach);
  }
  for (const r of RAILS) {
    if (r.style === 'rope') continue;
    const reach = railHalf(r) + 0.8;
    mark_((x, u) => near(r.pts, x, u).d <= reach, 0, U0, W, U1);
  }
  for (const [, x, u, w, h] of PLOTS) mark_(() => true, x - 0.6, u - 0.6, x + w + 0.6, u + h + 0.6);
  for (const g of GROUNDS) if (g.id !== 'saka') mark_((x, u) => inShape(g, x, u), 0, U0, W, U1);
  mark_((x, u) => isSea(x, u), 0, U0, W, U1);
  const taken = (x, u) => u < U0 || u >= U1 || x < 0 || x >= W || busy[(Math.floor(u) - U0) * W + Math.floor(x)] === 1;
  const boxFree = (x, u, w, h) => {
    for (let j = 0; j <= h; j += 1) for (let i = 0; i <= w; i += 1) if (taken(x + Math.min(i, w - 0.01), u + Math.min(j, h - 0.01))) return false;
    return true;
  };
  const claim = (x, u, w, h) => mark_(() => true, x, u, x + w, u + h);
  return { taken, boxFree, claim };
}

export function senkoji(ctx) {
  const { kit, plot, props, S, along, ramp, GROUND } = ctx;
  const { house, building, tree, mark, ground, rand, pick, P, R, FX, FY, queue, shadowBox, hi, lamp, person, crowd, E, halo } = kit;
  const { roof, toro } = makeParts(ctx);
  const [U0, U1] = [SENKOJI_FROM, SENKOJI_TO];
  kit.setSun(0.85); // (the evening's long shadows)

  // ---- what the route already takes, over the whole hillside the terraces climb (to the station's square)
  const [HU0, HU1] = [U0, HILL_TO];
  const NU = HU1 - HU0;
  const { taken, boxFree, claim } = freeMap(HU0, HU1);

  // ---- the terraces: their edges run along the contours, each a little way further up the hill (to the right)
  const contour = (u) => 2.2 * Math.sin(u / 53) + 1.4 * Math.sin(u / 17 + 1);
  const EDGES = [110, 120.4, 131, 141.6, 152.2, 162.8, 173.4];
  const edge = (k, u) => EDGES[k] + contour(u) + 1.1 * Math.sin(u / 29 + k * 1.7);
  const WALL = 1.5; // (the wall's top and face, seen from above)
  const LANE = 1.7; // (the lane along its foot... on the terrace above it: one person wide)
  ground(() => {
    for (let Y = FY(HU1); Y < FY(HU0); Y++) {
      const u = ctx.L - (Y + 0.5) / S;
      for (let k = 0; k < EDGES.length; k++) {
        const e = edge(k, u);
        const [A, B] = [FX(e), FX(e + WALL + LANE)];
        for (let X = A; X < B; X++) {
          const x = (X + 0.5) / S;
          if (taken(x, u) || x < railX(u) + 7) continue;
          let c;
          if (x < e + WALL) {
            // dressed granite in courses, the joints dark; the face catches the low sun from the west
            const row = Math.floor(Y / 4);
            const off = (row % 2) * 3;
            const joint = Y % 4 === 0 || (X + off) % 6 === 0;
            c = joint ? 0x5a564e : shade(GRANITE[Math.floor(hashPx(Math.floor((X + off) / 6), row, 811) * 4)], X - A < 1 ? 1.12 : 1);
            if (hashPx(X, Y, 812) < 0.04) c = 0x4e6a3a; // (a fern in a joint)
          } else c = (Y + X) % 11 === 0 ? 0x8a867c : shade(0xa8a49a, 0.95 + hashPx(X, Y, 813) * 0.08); // the lane's concrete
          P(X, Y, c);
        }
        // the shadow the wall throws on the terrace below it (to its left, the sun behind the hill... low in the west)
        for (let X = FX(e) - 2; X < FX(e); X++) if (!taken((X + 0.5) / S, u) && (X + 0.5) / S > railX(u) + 7) hi.tint(X, Y, 0.82);
      }
    }
  });
  // a terrace's lot (where the houses go): from the lane to the next wall, the narrowest over the length asked
  const lotOf = (k, u, len) => {
    let [a, b] = [-Infinity, Infinity];
    for (let v = u; v <= u + len; v += 1) {
      a = Math.max(a, edge(k, v) + WALL + LANE + 0.3);
      b = Math.min(b, k + 1 < EDGES.length ? edge(k + 1, v) - 0.5 : W);
    }
    return [a, b];
  };

  // ---- the cats: sitting, curled up asleep, stretched out on a wall, washing a paw
  const cat = (x, u, pose = pick(['sit', 'curl', 'curl', 'loaf', 'stretch', 'wash']), coat = pick(CATS)) =>
    mark(x, u, (X, Y) => {
      const [a, b, c] = [coat[0], coat[1], coat[2] ?? coat[1]];
      const dot = (i, j, col) => P(X + i, Y + j, col);
      const shadow = (pts) => pts.forEach(([i, j]) => hi.tint(X + i + 1, Y + j + 1, 0.7));
      if (pose === 'curl') {
        const body = [[-2, -2], [-1, -2], [0, -2], [1, -2], [-3, -1], [-2, -1], [-1, -1], [0, -1], [1, -1], [2, -1], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0]];
        shadow(body);
        body.forEach(([i, j], n) => dot(i, j, n % 5 === 2 ? b : j === -2 ? shade(a, 1.08) : a));
        dot(-3, 0, c); // the tail round its nose
        dot(-2, 1, c);
        dot(1, -3, b); // an ear
      } else if (pose === 'stretch') {
        const body = [[-3, 0], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [-2, -1], [-1, -1], [0, -1], [1, -1]];
        shadow(body);
        body.forEach(([i, j], n) => dot(i, j, n % 4 === 1 ? b : a));
        dot(3, -1, a); // the head, the ears
        dot(3, -2, b);
        dot(4, -2, b);
        dot(-4, 0, c);
        dot(-5, 1, c);
      } else if (pose === 'loaf') {
        const body = [[-1, -2], [0, -2], [1, -2], [-2, -1], [-1, -1], [0, -1], [1, -1], [2, -1], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0]];
        shadow(body);
        body.forEach(([i, j], n) => dot(i, j, n % 6 === 3 ? b : a));
        dot(-1, -3, b);
        dot(1, -3, b);
        dot(0, -2, 0x3a3020); // (eyes shut, a dark nose)
      } else {
        // sitting up (or washing): the head over the body, the ears, the tail curled round its feet
        const body = [[0, -4], [-1, -3], [0, -3], [1, -3], [-1, -2], [0, -2], [1, -2], [-1, -1], [0, -1], [1, -1], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0]];
        shadow(body);
        body.forEach(([i, j], n) => dot(i, j, n % 4 === 2 ? b : j <= -3 ? shade(a, 1.05) : a));
        dot(-1, -5, b);
        dot(1, -5, b);
        dot(3, 0, c);
        dot(3, -1, c);
        if (pose === 'wash') dot(-2, -3, a); // (a paw up to its face)
      }
    });

  // ---- the hillside's houses, terrace by terrace, and what is between them
  const hillLot = (x, u, w, h, k) => {
    const v = rand();
    const tile = pick(TILES);
    if (v < 0.64) {
      house(x, u, w, h, { tile, hip: rand() < 0.55, wall: pick(STUCCO), face: 2 });
      if (rand() < 0.4) laundry(x + 0.6, u + h * (0.3 + rand() * 0.4), Math.min(w - 1.2, 5));
      if (rand() < 0.45) pots(x - 0.2, u - 0.4, Math.min(w, 4 + rand() * 3)); // (along the lane in front)
      if (rand() < 0.3) cat(x + 1 + rand() * (w - 2), u + h * 0.5 + rand() * h * 0.4, pick(['curl', 'loaf', 'stretch']));
      if (rand() < 0.25) mark(x + w - 1.6, u + h * 0.7, (X, Y) => kit.ac(X - 3, Y - 2)); // an air conditioner on the roof's edge
    } else if (v < 0.8) {
      building(x, u, w, h, { style: rand() < 0.6 ? 'plain' : 'balcony', face: 3.6, wall: pick(STUCCO), roof: rand() < 0.5 ? pick(TIN) : 0x8a8680, s: Math.floor(rand() * 1e6) });
      if (rand() < 0.4) pots(x - 0.2, u - 0.4, Math.min(w, 5));
    } else if (v < 0.88) {
      // an empty house (there are many on the slopes): its roof sagging, tiles gone, ivy over it
      house(x, u, w, h, { tile: shade(tile, 0.9), hip: false, wall: 0x8a7a64, face: 2 });
      const s = Math.floor(rand() * 1e6);
      mark(x, u, (X, Y) => {
        const [bw, bh] = [FX(x + w) - X, FY(u) - FY(u + h)];
        for (let j = 1; j < bh - 1; j++)
          for (let i = 1; i < bw - 1; i++) {
            const n = hashPx(Math.floor((X + i) / 3), Math.floor((Y - j) / 3), s);
            if (n < 0.16) P(X + i, Y - bh + j, n < 0.06 ? 0x2a2420 : 0x3a3430); // a hole, the dark rafters
            else if (n > 0.72) P(X + i, Y - bh + j, n > 0.86 ? 0x3e5a2a : 0x4e6a32); // ivy
          }
      }, u);
    } else if (v < 0.97) {
      // a garden: a tree or two, pots, beans on canes, someone's washing
      ctx.pave(x, u, w, h, 'park', 801);
      tree(rand() < 0.5 ? 'broadleaf' : 'tiny', x + w * (0.3 + rand() * 0.4), u + h * (0.3 + rand() * 0.4), 1.6 + rand() * 1.4);
      pots(x + 0.5, u + 0.6, w - 1);
      if (rand() < 0.5) laundry(x + 0.5, u + h - 1.2, w - 1);
      if (rand() < 0.4) cat(x + w * 0.5, u + 1.2);
    } else {
      // a well under its little roof, or a Jizo in a red bib in his chapel, flowers before him
      ctx.pave(x, u, w, h, 'gravel', 802);
      const [cx, cu] = [x + w / 2, u + h / 2];
      if (rand() < 0.5)
        mark(cx, cu, (X, Y) => {
          for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (i * i + j * j <= 5) P(X + i, Y + j, i * i + j * j <= 1 ? 0x1e2a30 : 0x8a867e);
          R(X - 4, Y - 6, 9, 2, 0x5a4a3a); // its roof on two posts
          R(X - 4, Y - 4, 1, 4, 0x5a4a3a);
          R(X + 4, Y - 4, 1, 4, 0x5a4a3a);
        });
      else
        mark(cx, cu, (X, Y) => {
          R(X - 3, Y - 7, 7, 2, 0x5e646e);
          R(X - 3, Y - 5, 7, 5, 0x6a4a30);
          R(X - 1, Y - 4, 3, 3, 0xb4b0a6);
          R(X - 1, Y - 2, 3, 1, 0xc8302a); // his red bib
          P(X - 3, Y + 1, 0xe8d040);
          P(X + 3, Y + 1, 0xe06a8a);
        });
      void k;
    }
  };
  /** Washing on a line: a run of cloths and shirts, w long, across at (x, u). */
  const laundry = (x, u, w) =>
    mark(x, u, (X, Y) => {
      const n = Math.max(1, FX(w) - FX(0));
      R(X, Y - 3, n, 1, 0x2a2a30);
      for (let i = 1; i < n - 1; i += 2) {
        const c = PAL.cloth[Math.floor(hashPx(X + i, Y, 821) * PAL.cloth.length)];
        R(X + i, Y - 2, 2, 2 + (i % 3 === 0 ? 1 : 0), c);
      }
    });
  /** A row of potted plants: morning glories, geraniums, a bonsai pine. */
  const pots = (x, u, w) =>
    mark(x, u, (X, Y) => {
      for (let i = 0; i < FX(w) - FX(0); i += 3) {
        R(X + i, Y - 1, 2, 2, 0x9a5a3a);
        const f = hashPx(X + i, Y, 822);
        P(X + i, Y - 2, 0x4e7a3a);
        P(X + i + 1, Y - 3, f < 0.3 ? 0x6a5ac8 : f < 0.6 ? 0xe04a4a : 0x3e6a2e);
      }
    });

  for (let k = 0; k < EDGES.length; k++)
    for (let u = HU0 + rand() * 4; u < HU1 - 4; ) {
      let len = 5.5 + rand() * 6;
      let [a, b] = lotOf(k, u, len);
      // (a house set back from the lane now and then, or one a little narrower, so the rows do not line up)
      if (rand() < 0.3) a += 0.6 + rand();
      if (rand() < 0.2) b -= 1 + rand() * 1.5;
      let w = Math.min(b - a, 12);
      if (w >= 4.5 && !boxFree(a, u, w, len)) {
        len = 4.2;
        [a, b] = lotOf(k, u, len);
        w = Math.min(b - a, 12);
      }
      if (w >= 4.5 && boxFree(a, u, w, len)) {
        hillLot(a, u, w, len - 0.7, k);
        claim(a, u, w, len);
        u += len;
      } else u += 1;
    }
  // cats on the walls and in the lanes
  for (let n = 0; n < Math.round((70 * NU) / 860); n++) {
    const k = Math.floor(rand() * EDGES.length);
    const u = HU0 + 4 + rand() * (NU - 8);
    const x = edge(k, u) + (rand() < 0.5 ? 0.7 : WALL + LANE * 0.5);
    if (!taken(x, u) && x > railX(u) + 7) cat(x, u);
  }

  // ---- the steps up the hillside: treads across them, a handrail, lamps coming on as it gets dark
  const STEPS = new Set(['saka_1', 'saka_2', 'saka_3', 'saka_4', 'saka_5', 'saikokuji_sando', 'daisanji_kaidan', 'tennei_kaidan', 'neko_no_hosomichi', 'senkoji_kaidan', 'bungaku_no_komichi', 'senkoji_sando', 'fukuzenji_kaidan', 'komyoji_kaidan']);
  for (const r of ROADS) {
    if (!STEPS.has(r.id)) continue;
    const half = r.w / 2;
    along(r.pts, half + 0.4, (n, x, u, X, Yy) => {
      if (u < HU0 || u >= ctx.L) return null;
      if (n.d > half) return 0x6a6a6e; // the handrail
      if (x < railX(u) + 6) return null; // (no treads where the way crosses the flat or the tracks)
      return Math.floor(n.along * S) % 3 === 0 ? 0x7a766c : shade(0xb6b0a2, 0.96 + hashPx(X, Yy, 831) * 0.06);
    });
    let run = 0;
    for (let i = 0; i + 1 < r.pts.length; i++) {
      const [[ax, au], [bx, bu]] = [r.pts[i], r.pts[i + 1]];
      const len = Math.hypot(bx - ax, bu - au);
      for (let t = (14 - (run % 14)) / len; t < 1; t += 14 / len) {
        const [x, u] = [ax + (bx - ax) * t, au + (bu - au) * t];
        if (u < HU0 + 2 || u > ctx.L - 2 || x < railX(u) + 6) continue;
        const side = (Math.floor(u) % 2 ? 1 : -1) * (half + 1);
        mark(x + side, u, (X, Y) => lamp(X, Y));
      }
      run += len;
    }
  }
  // the cats' lane: more cats than anywhere, pots along its walls, small stones painted by the children (plain
  // colours, no one's designs), a shop selling cat things with its noren
  {
    const lane = ROADS.find((r) => r.id === 'neko_no_hosomichi').pts;
    for (let k = 0; k < 40; k++) {
      const t = rand();
      const seg = Math.floor(t * (lane.length - 1));
      const f = t * (lane.length - 1) - seg;
      const [x, u] = [lane[seg][0] + (lane[seg + 1][0] - lane[seg][0]) * f, lane[seg][1] + (lane[seg + 1][1] - lane[seg][1]) * f];
      const side = rand() < 0.5 ? -1.8 : 1.8;
      if (u < U0 || u > U1) continue;
      if (k % 3 === 0) cat(x + side, u);
      else if (k % 3 === 1) pots(x + side - 1, u, 2);
      else
        mark(x + side, u, (X, Y) => {
          for (let q = 0; q < 3; q++) {
            const c = [0xe8c040, 0xd85a4a, 0x5a8ad0, 0xf0ece4][Math.floor(hashPx(X, Y + q, 841) * 4)];
            R(X + q * 3, Y - 1, 2, 2, c);
            P(X + q * 3, Y - 1, shade(c, 1.2));
          }
        });
    }
  }

  // ---- the great boulders of Senko-ji (granite, the temple built among them), in its grounds and its wood
  const boulder = (x, u, r, s = Math.floor(rand() * 1e6)) => {
    const [X0, Y0, Rr] = [FX(x), FY(u), Math.round(r * S)];
    const inside = (i, j) => {
      const a = Math.atan2(j, i);
      const rr = Rr * (0.82 + 0.18 * Math.sin(a * 3 + s) + 0.08 * Math.sin(a * 7 + s * 2));
      return i * i + (j * 1.15) ** 2 <= rr * rr;
    };
    queue(Y0 + Rr, () => {
      for (let j = -Rr; j <= Rr; j++)
        for (let i = -Rr; i <= Rr; i++) {
          if (!inside(i, j)) continue;
          const lit = (-i - j) / (Rr * 1.4); // the upper left lit
          let c = GRANITE[Math.max(0, Math.min(3, Math.round(1.6 + lit * 1.8 + (hashPx(X0 + i, Y0 + j, s) - 0.5) * 0.9)))];
          if (!inside(i + 1, j) || !inside(i, j + 1)) c = 0x4a4640; // its dark lower edge
          if (Math.abs(i - j * 0.6 - (s % 5) + 2) < 0.6 && hashPx(i, j, s + 1) < 0.7) c = 0x6a665e; // a crack
          if (hashPx(X0 + i, Y0 + j, s + 2) < 0.05) c = 0x5a6a3a; // moss
          P(X0 + i, Y0 + j, c);
        }
    }, () => {
      for (let j = -Rr; j <= Rr; j++) for (let i = -Rr; i <= Rr; i++) if (inside(i, j)) hi.tint(X0 + i + Math.round(Rr * 0.7), Y0 + j + Math.round(Rr * 0.5), 0.86);
    });
  };

  // ---- Tennei-ji: its three-storeyed pagoda of plain dark wood over the roofs, the hall beside it
  {
    const p = plot('tenneiji_to');
    ctx.pave(p.x, p.u, p.w, p.h, 'gravel', 803);
    const [X, Y] = [FX(p.x + p.w / 2), FY(p.u + 4)];
    queue(Y + 2, () => {
      for (let k = 0; k < 3; k++) {
        const half = Math.round((6.4 - k * 1.1) * S);
        const lift = Math.round(k * 3.2 * S);
        const rh = Math.round(half * 0.9);
        R(X - half + 4, Y - lift - 6, 2 * half - 8, 6, 0x6a4430); // the storey's wall, old unpainted wood
        for (let i = -half + 4; i < half - 4; i += 3) R(X + i, Y - lift - 5, 1, 4, 0x3a2a22);
        roof(X - half, Y - lift - 6 - rh * 2 + 2, 2 * half, rh * 2 - 2, 0x4a4e56);
        R(X - half + 1, Y - lift - 7, 2 * half - 2, 1, 0x8a8e96);
        for (const ex of [-half, half - 1]) {
          P(X + ex, Y - lift - 7, 0x9a9ea6);
          P(X + ex, Y - lift - 6, 0xb08a3a); // a bronze bell at the eave's corner
        }
      }
      const top = Y - Math.round(2 * 3.2 * S) - Math.round(4.2 * 0.9 * S) * 2;
      R(X - 1, top - 16, 2, 18, 0x5a4a30);
      for (let k = 0; k < 9; k++) R(X - 2, top - 14 + k * 2, 4, 1, 0x9a8048);
      R(X - 1, top - 18, 2, 2, 0xc8a040);
    }, () => {
      for (let k = 0; k < 3; k++) {
        const half = Math.round((6.4 - k * 1.1) * S);
        shadowBox(X - half + 2, Y - Math.round(half * 1.6), 2 * half - 4, Math.round(half * 1.6), Math.round((k + 1) * 3.2 * S * 0.6) + 4, 0.6);
      }
      shadowBox(X, Y - 4, 2, 2, 46, 0.66);
    });
    const h = plot('tenneiji');
    ctx.pave(h.x, h.u, h.w, h.h, 'gravel', 804);
    house(h.x + 1, h.u + 3, h.w - 2, h.h - 4, { tile: 0x50565e, hip: true, wall: 0x7a5a3e, face: 2.4, s: 8101 });
    toro(h.x + 2, h.u + 1.5);
    toro(h.x + h.w - 2, h.u + 1.5);
  }

  // ---- Senko-ji: the grounds among the boulders, the vermilion hall on its rock, the Tamanoiwa, the mirror rock,
  // the bell, the stone lanterns
  {
    const [gx, gu, gw, gh] = ctx.ground('senkoji_keidai').rect;
    const keep = ['senkoji_hondo', 'tamanoiwa', 'kagami_iwa', 'shoro'].map((id) => plot(id)).map((q) => [q.x - 2, q.u - 2, q.w + 4, q.h + 4]);
    const clear = (x, u) => !keep.some(([kx, ku, kw, kh]) => x > kx && x < kx + kw && u > ku && u < ku + kh) && near(ROADS.find((r) => r.id === 'bungaku_no_komichi').pts, x, u).d > 2.4 && near(ROADS.find((r) => r.id === 'senkoji_kaidan').pts, x, u).d > 2.6;
    // the ground: worn granite between the rocks, moss in the shade, the paths of flagstones
    ctx.paint(gx, gu, gx + gw, gu + gh, (x, u, X, Yy) => {
      const n = hashPx(Math.floor(X / 3), Math.floor(Yy / 3), 851);
      return n < 0.18 ? 0x6a7a4a : n < 0.3 ? 0x8a8676 : shade(0xa8a294, 0.94 + hashPx(X, Yy, 852) * 0.1);
    });
    // the grounds' edge: pines and maples (in leaf), then the rocks, the big ones first
    for (let n = 0; n < 26; n++) {
      const side = n % 3;
      const [x, u] = side === 0 ? [gx + 1 + rand() * 4, gu + rand() * gh] : side === 1 ? [gx + gw - 1 - rand() * 4, gu + rand() * gh] : [gx + rand() * gw, gu + gh - 1 - rand() * 4];
      if (clear(x, u)) tree(rand() < 0.5 ? 'pine' : 'broadleaf', x, u, 2 + rand() * 1.6);
    }
    for (let n = 0; n < 40; n++) {
      const [x, u] = [gx + 3 + rand() * (gw - 6), gu + 3 + rand() * (gh - 6)];
      if (clear(x, u)) boulder(x, u, n < 10 ? 3.4 + rand() * 2 : 1.2 + rand() * 2.2);
    }
    // stone Buddhas in a row in red bibs, the rack of ema boards, visitors on their way round
    for (let k = 0; k < 7; k++)
      mark(gx + gw - 8 + (k % 2) * 3, gu + 6 + k * 2.6, (X, Y) => {
        R(X - 1, Y - 4, 3, 4, 0x9a968c);
        R(X - 1, Y - 5, 3, 1, 0xb4b0a6);
        R(X - 1, Y - 2, 3, 1, 0xc8302a);
      });
    mark(gx + 22, gu + gh - 8, (X, Y) => {
      R(X, Y - 8, 18, 2, 0x5a3a2a);
      for (let k = 0; k < 8; k++) R(X + 1 + k * 2, Y - 6, 2, 3, 0xd8b884);
    });
    crowd(gx + 10, gu + 6, 20, 8, 7);
    for (const [id, kind] of [['senkoji_hondo', 'gravel'], ['tamanoiwa', 'gravel'], ['kagami_iwa', 'gravel']]) {
      const q = plot(id);
      ctx.pave(q.x, q.u, q.w, q.h, kind, 806);
    }
    const p = plot('senkoji_hondo');
    // the rock it stands on, the stage out over the drop on its seaward side on tall posts (kakezukuri)
    boulder(p.x + 4, p.u + 3, 5.2, 901);
    const [X0, X1, YT, YB] = [FX(p.x + 5), FX(p.x + p.w), FY(p.u + p.h), FY(p.u + 3)];
    queue(YB + 1, () => {
      // the stage: planks, a vermilion rail round it, the posts under it standing down the rock
      for (let j = YT + 6; j < YB; j++) for (let i = FX(p.x); i < X0 + 2; i++) P(i, j, (j % 3 === 0) ? 0x6a4a30 : 0x8a6a48);
      for (let j = YT + 6; j < YB; j++) P(FX(p.x), j, VERMILION);
      R(FX(p.x), YT + 6, X0 + 2 - FX(p.x), 1, VERMILION);
      R(FX(p.x), YB - 1, X0 + 2 - FX(p.x), 1, VERMILION);
      for (let i = FX(p.x) + 1; i < X0; i += 4) R(i, YB, 1, 6, 0x5a3a24);
      // the hall: vermilion walls, its doors latticed, the roof of grey tiles, the ridge with its ends
      const fh = 8;
      roof(X0, YT, X1 - X0, YB - YT - fh, 0x5c626c);
      R(X0 + 3, YT + ((YB - YT - fh) >> 1) - 1, X1 - X0 - 6, 2, 0x3e424a);
      for (let j = 0; j < fh; j++)
        for (let i = X0 + 1; i < X1 - 1; i++) {
          let c = (i - X0) % 8 === 0 ? 0x7a2a1e : j === 0 ? 0xf0e0c0 : VERMILION;
          if (j > 1 && j < fh - 1 && (i - X0) % 8 >= 2 && (i - X0) % 8 <= 5) c = (i + j) % 2 ? 0x3a2a24 : 0x6a4a34; // latticed doors
          if (j === fh - 1) c = 0x2a2226;
          P(i, YB - fh + j, c);
        }
      // lanterns lit under the eave
      for (let i = X0 + 6; i < X1 - 4; i += 10) {
        E(i, YB - fh + 1, 0xffd070);
        E(i, YB - fh + 2, 0xf0a040);
        halo(i, YB - fh + 2, 6, 4, 0xffc060, 0.3);
      }
    }, () => shadowBox(X0, YT, X1 - X0, YB - YT, 22, 0.6));
    crowd(p.x + 6, p.u - 6, p.w - 6, 5, 6);
    // the Tamanoiwa: the great rock, on its top the jewel that lit the sea, glowing again at dusk
    const t = plot('tamanoiwa');
    boulder(t.x + t.w / 2, t.u + t.h / 2, 4.4, 902);
    mark(t.x + t.w / 2, t.u + t.h / 2 + 1, (X, Y) => {
      R(X - 2, Y - 10, 5, 2, 0x6a6a66); // the stone the jewel sits on
      for (let j = -2; j <= 1; j++) for (let i = -2; i <= 2; i++) if (i * i + j * j <= 4) E(X + i, Y - 13 + j, i * i + j * j <= 1 ? 0xfff8e0 : 0xffd878);
      halo(X, Y - 13, 30, 24, 0xffd890, 0.4);
      halo(X, Y - 13, 9, 7, 0xfff0c0, 0.6);
    }, t.u + t.h / 2);
    // the mirror rock: a flat face polished smooth, the round mirror in it holding the evening light
    const m = plot('kagami_iwa');
    boulder(m.x + m.w / 2, m.u + m.h / 2, 3.2, 903);
    mark(m.x + m.w / 2, m.u + m.h / 2, (X, Y) => {
      for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) if (i * i + j * j <= 9) P(X + i, Y - 4 + j, i + j < -1 ? 0xf0d8c0 : i + j < 2 ? 0xc8a8a0 : 0x8a7a80);
    }, m.u + m.h / 2);
    // the bell in its tower: four posts, a tiled roof, the bronze bell under it
    const b = plot('shoro');
    ctx.pave(b.x, b.u, b.w, b.h, 'gravel', 805);
    const [BX, BY] = [FX(b.x + b.w / 2), FY(b.u + 2)];
    queue(BY, () => {
      for (const [i, j] of [[-10, 0], [9, 0], [-10, -16], [9, -16]]) R(BX + i, BY + j - 8, 2, 9, 0x5a3a24);
      roof(BX - 13, BY - 26, 27, 20, 0x5c626c);
      R(BX - 3, BY - 12, 7, 8, 0x6a5a34);
      R(BX - 3, BY - 12, 2, 8, 0x9a8048);
    }, () => shadowBox(BX - 13, BY - 26, 27, 26, 20, 0.62));
    // stone lanterns lit along the steps up into the grounds
    for (const [x, u] of [[121.6, 4512], [127, 4520], [124.6, 4532], [130.4, 4540], [128.4, 4552], [134.6, 4556]]) toro(x, u, true);
  }
  // the wood under the park: pines and camphor among more boulders
  {
    const [fx, fu, fw, fh] = ctx.ground('senkoji_mori').rect;
    for (let n = 0; n < 8; n++) boulder(fx + 3 + rand() * (fw - 6), fu + 3 + rand() * (fh - 6), 1.8 + rand() * 2.4);
    for (let n = 0; n < 90; n++) {
      const [x, u] = [fx + 2 + rand() * (fw - 4), fu + 2 + rand() * (fh - 4)];
      if (near(ROADS.find((r) => r.id === 'bungaku_no_komichi').pts, x, u).d < 2.6) continue;
      tree(rand() < 0.5 ? 'pine' : 'broadleaf', x, u, 2.2 + rand() * 1.8);
    }
    // the path of literature: stones carved with poems, set along it
    const path = ROADS.find((r) => r.id === 'bungaku_no_komichi').pts;
    for (let k = 0; k < 7; k++) {
      const t = (k + 0.5) / 7;
      const seg = Math.min(path.length - 2, Math.floor(t * (path.length - 1)));
      const f = t * (path.length - 1) - seg;
      const [x, u] = [path[seg][0] + (path[seg + 1][0] - path[seg][0]) * f, path[seg][1] + (path[seg + 1][1] - path[seg][1]) * f];
      mark(x + (k % 2 ? 2.2 : -2.2), u, (X, Y) => {
        R(X - 2, Y - 5, 5, 5, 0x9a968c);
        R(X - 2, Y - 5, 5, 1, 0xb8b4aa);
        for (let q = 0; q < 3; q++) R(X - 1 + q, Y - 4, 1, 3, 0x3a3634); // its lines of verse
        hi.tint(X + 3, Y - 2, 0.75);
      });
    }
  }
  // the park on the top: lawns, cherry trees in leaf, hydrangeas, benches, the lookout, people out in the cool
  {
    const [px, pu, pw, ph] = ctx.ground('senkoji_koen').rect;
    const keep = ['ropeway_sancho', 'tenbodai'].map((id) => plot(id)).map((q) => [q.x - 2, q.u - 2, q.w + 4, q.h + 4]);
    // its walks: gravel, winding between the lawns from the path of literature to the lookout and the station
    const WALKS = [[[156, 4702], [150, 4740], [140, 4770], [144, 4812]], [[150, 4740], [162, 4752]], [[140, 4770], [132, 4800], [136, 4860], [150, 4880]]];
    for (const w of WALKS) along(w, 1.3, (n, x, u, X, Yy) => (u >= U1 ? null : n.d > 1 ? 0x8a8070 : shade(0xc2b8a2, 0.95 + hashPx(X, Yy, 861) * 0.08)));
    const onWalk = (x, u) => WALKS.some((w) => near(w, x, u).d < 2.6);
    const clear = (x, u) => u < U1 - 2 && !onWalk(x, u) && !keep.some(([kx, ku, kw, kh]) => x > kx && x < kx + kw && u > ku && u < ku + kh);
    // benches and lamps along the walks
    for (const w of WALKS)
      for (let k = 1; k < w.length; k++) {
        const [[ax, au], [bx, bu]] = [w[k - 1], w[k]];
        const [x, u] = [(ax + bx) / 2 + 2.4, (au + bu) / 2];
        if (u >= U1 - 2) continue;
        mark(x, u, (X, Y) => {
          R(X, Y - 2, 2, 5, 0x6a4a30);
          R(X, Y - 2, 1, 5, 0x8a6a48);
        });
        mark(x - 4.8, u + 3, (X, Y) => lamp(X, Y));
      }
    for (let n = 0; n < 60; n++) {
      const [x, u] = [px + 3 + rand() * (pw - 6), pu + 3 + rand() * (ph - 6)];
      if (clear(x, u)) tree(rand() < 0.7 ? 'broadleaf' : 'pine', x, u, 2.4 + rand() * 1.6);
    }
    for (let n = 0; n < 26; n++) {
      const [x, u] = [px + 2 + rand() * (pw - 4), pu + 2 + rand() * (ph - 4)];
      if (!clear(x, u)) continue;
      mark(x, u, (X, Y) => {
        for (let j = -2; j <= 1; j++) for (let i = -2; i <= 2; i++) if (i * i + j * j <= 4) P(X + i, Y + j, (i + j) % 2 ? 0x7a8ad8 : (i * j) % 3 ? 0x5a6ac0 : 0x3e6a32); // a hydrangea
      });
    }
    for (let n = 0; n < 14; n++) {
      const [x, u] = [px + 4 + rand() * (pw - 8), pu + 4 + rand() * (ph - 8)];
      if (clear(x, u)) mark(x, u, (X, Y) => person(X, Y, 8200 + n));
    }
    const t = plot('tenbodai');
    if (t.u + t.h <= U1) {
      ctx.pave(t.x, t.u, t.w, t.h, 'park', 807);
      // the lookout: a round deck on a concrete stem, a rail round it, everyone at the rail facing the strait
      const [X, Y, Rr] = [FX(t.x + t.w / 2), FY(t.u + t.h / 2), Math.round((t.h / 2) * S)];
      queue(Y + Rr, () => {
        for (let j = -Rr; j <= Rr; j++)
          for (let i = -Rr; i <= Rr; i++) {
            const d = i * i + j * j;
            if (d > Rr * Rr) continue;
            let c = (Math.round(Math.atan2(j, i) * 6) + Math.round(Math.sqrt(d) / 3)) % 2 ? 0xb8b2a6 : 0xaaa498; // its deck in rings of slabs
            if (d > (Rr - 1.5) ** 2) c = 0x4a4e56; // the rail
            else if (d < 16) c = 0x6a6e76; // the stair head in the middle
            P(X + i, Y + j, c);
          }
      }, () => shadowBox(X - Rr, Y - Rr, Rr * 2, Rr * 2, 18, 0.6));
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        mark(t.x + t.w / 2 + Math.cos(a) * (t.h / 2 - 1.4), t.u + t.h / 2 + Math.sin(a) * (t.h / 2 - 1.4), (X2, Y2) => person(X2, Y2, 8300 + k));
      }
    }
  }

  // ---- the ropeway: the stations, the gondolas passing over the roofs
  {
    const p = plot('ropeway_sanroku');
    ctx.pave(p.x, p.u, p.w, p.h, 'plaza', 808);
    building(p.x + 1, p.u + 1, p.w - 2, p.h - 2, { face: 4, style: 'plain', wall: 0xe8e2d4, roof: 0x5c626c, s: 8401 });
    const q = plot('ropeway_sancho');
    if (q.u + q.h <= U1) ctx.pave(q.x, q.u, q.w, q.h, 'plaza', 809);
    if (q.u + q.h <= U1) building(q.x + 1, q.u + 1, q.w - 2, q.h - 2, { face: 3, style: 'plain', wall: 0xe8e2d4, roof: 0x5c626c, s: 8402 });
    const rope = RAILS.find((r) => r.id === 'senkoji_ropeway').pts;
    const gondola = (c) =>
      kit.frame(3, 3.67, 4600, (put) => {
        for (let j = 0; j < 11; j++)
          for (let i = 0; i < 9; i++) {
            if ((i === 0 || i === 8) && (j === 0 || j === 10)) continue;
            put(i, j, j < 2 ? shade(c, 1.25) : j > 8 ? shade(c, 0.7) : i === 0 || i === 8 ? shade(c, 0.8) : j > 3 && j < 8 ? 0x2c3a4c : c);
          }
        put(4, 0, 0x3a3a40);
      });
    props.path(kit.offset(rope, -0.9), [gondola(0xe8e4d8)], { sp: 6, n: 1, mode: 'pp', hold: 8, turn: 'none', s0: 0.0, d: 0.3 });
    props.path(kit.offset([...rope].reverse(), -0.9), [gondola(0x3a6aa8)], { sp: 6, n: 1, mode: 'pp', hold: 8, turn: 'none', s0: 0.0, d: 0.3 });
  }

  // ---- the old temples on the way along the hillside (the temple walk): a court of raked gravel, the main hall
  // under a great tiled roof with its ridge-end tiles, a gate at the head of the steps, pines, lanterns, the bell
  const temple = (id, { gate = 'plain', bell = false, s }) => {
    const p = plot(id);
    ctx.pave(p.x, p.u, p.w, p.h, 'gravel', s);
    ground(() => {
      for (let u = p.u + 1; u < p.u + p.h - 1; u += 1.34) for (let X = FX(p.x + 1); X < FX(p.x + p.w - 1); X++) P(X, FY(u), 0xa49a84); // raked lines
    });
    const [hx, hu, hw, hh] = [p.x + 6, p.u + 4, p.w - 8, p.h - 6];
    const [X0, X1, YT, YB] = [FX(hx), FX(hx + hw), FY(hu + hh), FY(hu)];
    const fh = 7;
    queue(YB, () => {
      roof(X0 - 2, YT, X1 - X0 + 4, YB - YT - fh, 0x585e68);
      const ry = YT + ((YB - YT - fh) >> 1);
      R(X0 + 2, ry - 1, X1 - X0 - 4, 3, 0x3c4048); // the ridge
      for (const ex of [X0 + 1, X1 - 4]) R(ex, ry - 2, 3, 4, 0x2e3238); // its end tiles
      for (let j = 0; j < fh; j++)
        for (let i = X0 + 1; i < X1 - 1; i++) {
          let c = (i - X0) % 9 === 0 ? 0x4a3424 : j < 2 ? 0xe8e0cc : 0x7a5638; // white plaster under the eave, dark wood
          if (j > 2 && j < fh - 1 && (i - X0) % 9 >= 3 && (i - X0) % 9 <= 6) c = (i + j) % 2 ? 0x3a2a20 : 0x5a4030; // latticed doors
          if (j === fh - 1) c = 0x2a2226;
          P(i, YB - fh + j, c);
        }
    }, () => shadowBox(X0 - 2, YT, X1 - X0 + 4, YB - YT, 20, 0.6));
    // the gate on the side the steps come up (the left), its little roof; Fukuzen-ji's with a dragon carved over it
    const [gx, gu] = [p.x + 2.4, p.u + p.h / 2];
    queue(FY(gu) + 6, () => {
      const [X, Y] = [FX(gx), FY(gu)];
      R(X - 1, Y - 6, 2, 12, 0x4a3424);
      roof(X - 5, Y - 9, 10, 18, 0x585e68);
      if (gate === 'dragon') for (let j = -6; j <= 6; j++) P(X + Math.round(Math.sin(j * 0.9) * 2), Y + j, j % 3 ? 0x4a8a6a : 0xd0a040); // the dragon, green and gilt
    }, () => shadowBox(FX(gx) - 5, FY(gu) - 9, 10, 18, 10, 0.62));
    toro(p.x + 4, p.u + 2, true);
    toro(p.x + 4, p.u + p.h - 2, true);
    tree('pine', p.x + p.w - 2, p.u + 2, 2.4);
    if (bell) {
      const [BX, BY] = [FX(p.x + p.w - 3), FY(p.u + p.h - 4)];
      queue(BY, () => {
        roof(BX - 8, BY - 16, 16, 12, 0x585e68);
        R(BX - 2, BY - 7, 5, 6, 0x6a5a34);
      }, () => shadowBox(BX - 8, BY - 16, 16, 16, 12, 0.62));
    }
    crowd(p.x + 3, p.u + 1, 4, p.h - 2, 2);
  };
  temple('daisanji', { s: 861 });
  temple('fukuzenji', { gate: 'dragon', bell: true, s: 862 });
  temple('komyoji', { bell: true, s: 863 });
  temple('hodoji', { bell: true, s: 864 });

  // ---- up the hillside behind Hondori: a cafe in an old house, a merchant's house that takes guests, a Jizo on a
  // landing of the steps, a wall at the top of the steps where everyone stops for the view
  {
    const c = plot('kafe_saka');
    ctx.pave(c.x, c.u, c.w, c.h, 'plaza', 871);
    house(c.x + 1, c.u + 5, c.w - 2, c.h - 6, { tile: 0x5e646e, hip: false, wall: 0xe8e2d4, face: 2.2, s: 8711 });
    // its terrace out front: tables under parasols, a cat on a chair
    for (let k = 0; k < 3; k++) mark(c.x + 3 + k * 6, c.u + 2.6, (X, Y) => kit.parasol(X, Y, [0xe8e4d8, 0x3a6aa8, 0xe8e4d8][k]));
    cat(c.x + c.w - 3, c.u + 1.6, 'loaf');
    const k = plot('kominka_yado');
    ctx.pave(k.x, k.u, k.w, k.h, 'park', 872);
    house(k.x + 1, k.u + 6, k.w - 6, k.h - 7, { tile: 0x4e5662, hip: true, wall: 0xe0d8c4, face: 2.4, s: 8721 });
    house(k.x + k.w - 7, k.u + 2, 6, 8, { tile: 0x4e5662, hip: true, wall: 0xf0ece0, face: 2, s: 8722 }); // (its white storehouse)
    tree('pine', k.x + 3, k.u + 3, 2.2);
    toro(k.x + 8, k.u + 2.4, true);
    const j = plot('jizo_do');
    mark(j.x + j.w / 2, j.u + j.h / 2, (X, Y) => {
      R(X - 6, Y - 12, 12, 3, 0x5e646e);
      R(X - 5, Y - 9, 10, 9, 0x6a4a30);
      R(X - 2, Y - 8, 5, 6, 0xb4b0a6);
      R(X - 2, Y - 4, 5, 2, 0xc8302a);
      E(X - 4, Y + 1, 0xffc060); // a candle
      halo(X - 4, Y + 1, 8, 6, 0xffc060, 0.35);
    });
    const t = plot('tenbo_saka');
    ctx.pave(t.x, t.u, t.w, t.h, 'plaza', 873);
    mark(t.x, t.u + 1, (X, Y) => R(X, Y - 2, FX(t.w) - FX(0), 2, 0x9a968c)); // the wall at the edge
    mark(t.x + 4, t.u + 6, (X, Y) => {
      R(X, Y - 2, 10, 2, 0x6a4a30);
      R(X, Y - 2, 10, 1, 0x8a6a48);
    });
    for (let q = 0; q < 4; q++) cat(t.x + 3 + q * 5, t.u + 3 + (q % 2) * 3);
    for (let q = 0; q < 3; q++) mark(t.x + 14 + q * 2.4, t.u + 2, (X, Y) => person(X, Y, 8800 + q));
  }

  // ---- the trains along the foot of the hill: a local train each way, all the way from the bend to the station
  {
    const line = RAILS.find((r) => r.id === 'sanyo').pts;
    kit.trainOn(kit.offset(line, 2.5), 0x3a7a5a, { n: 4, sp: 30, s0: 0.1, u: 4400 });
    kit.trainOn(kit.offset([...line].reverse(), 2.5), 0x3a7a5a, { n: 4, sp: 30, s0: 0.55, u: 4400 });
  }

  // ---- cats that move where they sit: the tail swishing, an ear turning, now and then a yawn
  {
    const coatF = (coat, k) =>
      kit.frame(3, 3, 4400, (put) => {
        const [a, b, c] = [coat[0], coat[1], coat[2] ?? coat[1]];
        const body = [[4, 2], [3, 3], [4, 3], [5, 3], [3, 4], [4, 4], [5, 4], [3, 5], [4, 5], [5, 5], [2, 6], [3, 6], [4, 6], [5, 6], [6, 6]];
        body.forEach(([i, j], n) => put(i, j, n % 4 === 2 ? b : a));
        put(3, 1, b);
        put(5, k === 2 ? 2 : 1, b); // (an ear turned)
        if (k === 3) put(4, 3, 0xd86a7a); // (a yawn)
        const tail = [[[7, 6], [7, 5]], [[7, 6], [8, 6]], [[7, 6], [7, 7]], [[7, 6], [7, 5]]][k];
        tail.forEach(([i, j]) => put(i, j, c));
      });
    for (let n = 0; n < 40; n++) {
      const k = Math.floor(rand() * EDGES.length);
      const u = HU0 + 6 + rand() * (NU - 12);
      const x = edge(k, u) + 0.7;
      if (taken(x, u) || x < railX(u) + 7) continue;
      const coat = pick(CATS);
      const f = [0, 1, 2, 3].map((q) => coatF(coat, q));
      props.loop(x, u, f, { fps: 2, seq: [0, 0, 1, 0, 2, 0, 0, 1, 0, 3, 0, 0], d: 0.02 });
    }
  }

  // ---- the town below the railway: narrow houses and shops between the coast road and the tracks, two storeys,
  // their backs to the railway
  for (let u = U0 + 1; u < U1 - 6; ) {
    const len = 5 + rand() * 6;
    const [a, b] = [76.4, railX(u) - railHalf(RAILS[0]) - 1];
    if (boxFree(a, u, b - a, len)) {
      const v = rand();
      if (v > 0.86) {
        // a gap between the houses: a yard with a parked car or a scooter, vending machines lit by the road, a lane
        ctx.pave(a, u, b - a, len - 0.8, 'plaza', 810);
        if (rand() < 0.5) kit.car(a + (b - a) / 2, u + len / 2, false);
        mark(a + 0.4, u + 1, (X, Y) => {
          for (let q = 0; q < 2; q++) {
            kit.ER(X + q * 4, Y - 6, 3, 5, q ? 0xe8e8f0 : 0xd84a3a);
            kit.E(X + q * 4 + 1, Y - 4, 0xfff0c0);
          }
          kit.halo(X + 4, Y - 2, 10, 6, 0xe0f0ff, 0.25);
        });
        claim(a, u, b - a, len);
        u += len;
        continue;
      }
      if (v < 0.5) house(a, u, b - a, len - 0.8, { tile: pick(TILES), hip: rand() < 0.4, wall: pick(STUCCO), face: 2.4 });
      else building(a, u, b - a, len - 0.8, { style: rand() < 0.5 ? 'plain' : 'balcony', face: 4 + Math.floor(rand() * 3), shop: true, sign: rand() < 0.3, wall: pick(STUCCO), roof: pick([0x8a8680, 0x6a6e76, ...TIN]) });
      claim(a, u, b - a, len);
      u += len;
    } else u += 1;
  }
  // the quay's lamps and its rail, people out along the water in the evening
  const QUAY_TO = 6400; // (past it the water widens and the quay is the station's: minato.mjs)
  const onQuay = (x, u) => GROUNDS.some((g) => g.over && inShape(g, x, u)); // (Sumiyoshi's, put out over the water)
  for (let u = U0 + 8; u < QUAY_TO - 4; u += 18) if (!onQuay(60, u)) mark(64.2, u, (X, Y) => lamp(X, Y));
  ground(() => {
    for (let Y = FY(QUAY_TO); Y < FY(U0); Y++) {
      const u = ctx.L - Y / S;
      if (onQuay(suidoShores(u)[1] - 1, u)) continue;
      const X = FX(suidoShores(u)[1] + 0.6);
      P(X, Y, Y % 6 === 0 ? 0x3a3a40 : 0x8a8a90);
    }
  });
  for (let u = U0 + 4; u < QUAY_TO - 8; u += 26 + rand() * 30) crowd(64.6, u, 1.6, 6, 2);
  // boats tied up along the quay
  for (let u = U0 + 20; u < QUAY_TO - 20; u += 34 + rand() * 30) {
    const x = suidoShores(u)[1] - 4.2;
    if (onQuay(x, u + 6) || onQuay(x, u - 6) || FERRY_US.some((f) => Math.abs(f - u) < 10)) continue;
    mark(x, u, (X, Y) => {
      const c = pick([0xf0ece4, 0xe8e4d8, 0x3a6aa8]);
      for (let j = -12; j <= 0; j++) {
        const half = Math.round(4 * Math.sin(((j + 13) / 14) * Math.PI) ** 0.6);
        for (let i = -half; i <= half; i++) P(X + i, Y + j, Math.abs(i) === half ? 0x4a4a50 : j > -8 && j < -3 && Math.abs(i) < 2 ? 0x7a6a5a : c);
      }
      R(X - 1, Y - 6, 3, 3, 0x3a3a40); // the wheelhouse
    });
  }
  // across the strait, Mukaishima's shore: its trees and roofs at the very edge
  for (let u = U0; u < 6700; u += 3) {
    const w = suidoShores(u)[0];
    if (w < 2) continue;
    if (rand() < 0.6) tree(rand() < 0.4 ? 'pine' : 'broadleaf', Math.max(0.8, w * rand() - 0.5), u, 1.6 + rand() * 1.4);
    else if (rand() < 0.3) house(0, u, Math.max(2, w - 2.5), 4, { tile: pick(TILES), hip: true, face: 1.4 });
  }
}
