// Dazaifu (u 5460-5760 so far: the close-up of docs/plan-fukuoka.md phase 6, section 4.1) in the afternoon, the plum
// trees in full flower. The approach between its shops - the umegae-mochi grills smoking at their fronts, queues at
// them, people walking up and down - under its stone torii; the forecourt with its oxen of bronze, their heads rubbed
// bright; Shinji-ike with its two islands and the three bridges across it, arched, flat, arched, in vermilion; carp and
// turtles; the shrine: the two-storeyed gate, the corridors round the inner court, the main hall under its roof of
// cypress bark with the curved gable at its front, the old plum Tobiume beside it behind its fence, the ema racks and
// the omikuji tied on their lines, students and people praying; camphors behind; the plum groves either side and
// behind in their three colours in clumps, old trees on their crutches with their tags and bamboo fences, gravel paths
// between them, people with cameras and on mats under them; the garden of the winding stream with the poets in
// Heian dress and their cups floating down it; Komyozen-ji's garden of stones and moss in the town by the approach.
// The shrine is a place of worship: nothing of the fight touches it (docs/plan-fukuoka.md, section 3).
import { shade } from '../tokyo/kit.mjs';
import { hashPx } from '../hires.mjs';
import { inShape } from '../tokyo/geom.mjs';
import { ROADS, GROUNDS, WATER } from './route.mjs';
import { freeMap } from './free.mjs';
import { umeKit } from './ume.mjs';
import { makeParts, VERMILION, GOLD } from '../kawaguchiko/parts.mjs';

const [U0, U1] = [5460, 5760];
const road = (id) => ROADS.find((r) => r.id === id);
const BARK = 0x5e4636; // the shrine's roofs of cypress bark
const TILE = [0x4e5058, 0x585a62, 0x5a5048, 0x464850];
const AWNING = [0x8a2a24, 0x2a3a5a, 0x4a3a2e, 0xd8d0b8, 0x3a5a3a, 0x6a2a4a];
const GOODS = [0xe8c040, 0xd84a4a, 0xf0ece0, 0x6a9a5a, 0xe89ab0, 0x8a5a3a];

export function dazaifu(ctx) {
  const { kit, plot, props, S, W, near } = ctx;
  const { house, mark, ground, rand, pick, P, R, FX, FY, queue, shadowBox, person, crowd, tree, glint, smoke, trafficOn } = kit;
  const { roof, torii, toro } = makeParts(ctx);
  const ume = umeKit(kit, S);
  const { boxFree, claim, taken } = freeMap(U0, U1);
  const pond = WATER.find((w) => w.id === 'shinji_ike');
  const islands = GROUNDS.filter((g) => g.id.startsWith('shinji_shima'));
  const [pcx, pcu, prx, pru] = pond.ell;
  const pe = (x, u) => ((x - pcx) / prx) ** 2 + ((u - pcu) / pru) ** 2;
  const ie = (g, x, u) => ((x - g.ell[0]) / g.ell[2]) ** 2 + ((u - g.ell[1]) / g.ell[3]) ** 2;
  const onPond = (x, u) => pe(x, u) < 1 && !islands.some((g) => ie(g, x, u) < 1);
  const nearRoad = (x, u, d = 1) => ROADS.some((r) => near(r.pts, x, u).d < r.w / 2 + d);
  /** Paint the fine pixels of a box: fn(x, u, X, Y) gives a colour or null (leave it). */
  const fill = (x0, u0, x1, u1, fn) =>
    ground(() => {
      for (let Y = Math.max(0, FY(u1)); Y < FY(u0); Y++)
        for (let X = Math.max(0, FX(x0)); X < Math.min(W * S, FX(x1)); X++) {
          const c = fn(X / S, ctx.L - Y / S, X, Y);
          if (c != null) P(X, Y, c);
        }
    });
  const walker = (c, hat = 0x2a2228) => kit.frame(1, 1.67, 5600, (put) => {
    for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (!(j === 0 && i !== 1)) put(i, j, j === 0 ? hat : j === 1 && i === 1 ? 0xe8b890 : j < 4 ? c : 0x2a2a30);
  });

  // the town's lanes (out from the approach to the strip's edges, and across between them) and a car park for the
  // coaches, kept before anything else is built
  const LANES = [[0, 5504, 89, 5507.4], [95, 5504, W, 5507.4], [0, 5532, 89, 5535.4], [95, 5532, W, 5535.4], [95, 5560, W, 5563.4], [0, 5560, 89, 5563.4], [58, U0, 61.4, 5586], [148, U0, 151.4, 5586]];
  const inLane = (x, u) => LANES.some(([x0, u0, x1, u1]) => x >= x0 && x < x1 && u >= u0 && u < u1);
  const PARK = [152, 5466, 26, 30];
  for (const [x0, u0, x1, u1] of LANES) claim(x0, u0 - 0.6, x1 - x0, u1 - u0 + 1.2);
  claim(PARK[0] - 0.6, PARK[1] - 0.6, PARK[2] + 1.2, PARK[3] + 1.2);

  // the town's ground: packed earth and concrete between its houses; the forecourt kept for itself
  fill(0, U0, W, 5578, (x, u, X, Y) => (taken(x, u) ? null : shade(0xa49c8c, 0.94 + hashPx(X >> 1, Y >> 1, 29) * 0.1)));
  claim(54, 5575, 84, 33);

  // ---- the approach: a continuous row of shops either side under grey tile, their fronts open on to it - the eaves,
  // an awning, the goods laid out on trays, a paper lantern or a banner here and there; every third a grill of
  // umegae-mochi at its front with its smoke and its queue
  for (const side of [-1, 1]) {
    let u = U0 + (side > 0 ? 2 : 0); // (whole units: one shop's claim ends where the next begins)
    let k = 0;
    while (u < 5575) {
      const len = 5 + Math.floor(hashPx(k, side, 3) * 4);
      const [x, w] = side < 0 ? [76.4, 11.5] : [96.2, 11.5]; // (as near the approach as its edge allows)
      if (u + len > 5575) break;
      if (!boxFree(x, u, w, len)) { u += 1; continue; }
      claim(x, u, w, len);
      house(x, u, w, len - 0.3, { tile: TILE[(k + (side > 0 ? 1 : 0)) % TILE.length], wall: [0x6a4a34, 0xe4dccc, 0x5a4232][k % 3], hip: false, face: 2.2, s: 26000 + k * 2 + (side > 0 ? 1 : 0) });
      const ex = side < 0 ? x + w : x; // the edge on the approach
      const grill = k % 3 === 1;
      const aw = AWNING[(k * 3 + (side > 0 ? 2 : 0)) % AWNING.length];
      mark(ex, u + len - 0.3, (X, Y) => {
        const n = FY(u) - Y;
        const at = (d) => X + side * -d - (side > 0 ? 1 : 0); // d fine px out from the house towards the approach
        for (let j = 0; j < n; j++) {
          P(at(0), Y + j, 0x2a2a30); // the eaves' shadow line
          P(at(1), Y + j, shade(aw, j % 3 === 0 ? 0.78 : 1)); // the awning, its pleats
          P(at(2), Y + j, shade(aw, 0.82));
          if (!grill) P(at(3), Y + j, j % 2 ? GOODS[(j + k) % GOODS.length] : 0x8a6a4a); // the goods on their trays
        }
        if (k % 4 === 2) { R(at(2) - 1, Y + 2, 2, 3, 0xe8402a); P(at(2), Y + 1, 0x2a2420); } // a paper lantern hung at its eaves
      });
      if (grill) {
        const [gx, gu] = [ex - side * 1.3 - (side > 0 ? 0.6 : 0), u + len / 2];
        mark(gx, gu, (X, Y) => {
          R(X, Y - 3, 2, 7, 0x2a2624); // the iron grill
          for (let j = -2; j < 4; j += 2) { P(X, Y + j, 0xf08030); P(X + 1, Y + j, 0xe8d8a8); } // the coals; the cakes on it
        });
        smoke(gx + 0.5, gu + 1, { rate: 0.8, a: 0.3 });
        for (let q = 0; q < 5 + (k % 3); q++) mark(gx - side * (1.4 + (q % 2) * 0.8), gu - 2.4 - q * 1.2, (X, Y) => person(X, Y, 26100 + k * 10 + q)); // its queue
      }
      if (k % 5 === 3) kit.mark(ex - side * 0.8, u + 1, (X, Y) => { R(X, Y - 10, 1, 11, 0x5a4a3a); R(X + 1, Y - 9, 2, 7, k % 2 ? 0xc8302a : 0xf0ece0); }); // a banner on its pole
      u += len;
      k++;
    }
  }
  // the approach itself: its slabs, its stone torii, people up and down it
  fill(89, U0, 95, 5604, (x, u, X, Y) => (Math.abs(x - 92) < 3 ? ((Y % 6 === 0 || (X + (Math.floor(Y / 6) % 2) * 3) % 6 === 0) ? 0x9a968c : shade(0xbab4a6, 0.96 + hashPx(X >> 1, Y >> 1, 4) * 0.08)) : null));
  for (const u of [5500, 5584]) torii(87.6, 96.4, u, 0x9a968c, 5, true);
  const PEOPLE = [0x2a2a30, 0x4a4a58, 0x8a6a4a, 0xe8e4d8, 0x3a4a6a, 0xa83a3a, 0xd8b090, 0x6a5a7a];
  const crowdFrames = PEOPLE.map((c) => walker(c));
  for (const [x, sp, s0] of [[89.8, 1.8, 0.1], [91.2, 1.5, 0.4]]) props.path([[x, U0 - 20], [x, 5603]], crowdFrames, { sp, n: 18, gap: 8, mode: 'wrap', turn: 'none', s0 });
  for (const [x, sp, s0] of [[92.8, 1.6, 0.55], [94.2, 1.4, 0.8]]) props.path([[x, 5603], [x, U0 - 20]], crowdFrames, { sp, n: 18, gap: 8, mode: 'wrap', turn: 'none', s0 });
  crowd(89.4, U0, 5.2, 116, 70); // the busiest approach in Kyushu

  // ---- the forecourt before the pond: stone slabs, the bronze oxen with their heads rubbed bright, lanterns, plum
  // trees at its edges, people
  fill(56, 5578, 136, 5607, (x, u, X, Y) => {
    if (pe(x, u) < 1.08 || Math.abs(x - 92) < 3) return null;
    return Y % 6 === 0 || (X + (Math.floor(Y / 6) % 2) * 3) % 6 === 0 ? 0x8e8a80 : shade(0xb4b0a4, 0.96 + hashPx(X >> 1, Y >> 1, 6) * 0.08);
  });
  const ox = (x, u, left = true) => {
    const [X, Y] = [FX(x), FY(u)];
    const f = left ? 1 : -1;
    queue(Y, () => {
      R(X - 8, Y - 2, 17, 3, 0x8a867e); // the stone base
      R(X - 8, Y - 2, 17, 1, 0xb0aca2);
      for (let j = -6; j <= 0; j++)
        for (let i = -6; i <= 6; i++) if ((i * i) / 40 + ((j + 3) * (j + 3)) / 10 <= 1) P(X + i * f, Y - 3 + j, shade(0x3e3832, 1.2 - (j + 6) * 0.05 + (i * f < 0 ? 0.12 : -0.06))); // lying, its legs folded under
      for (let i = -5; i <= 3; i++) P(X + i * f, Y - 9, 0x5a524a); // the light along its back
      for (let j = -3; j <= 0; j++) for (let i = 0; i < 4; i++) P(X - (7 + i) * f, Y - 4 + j, i + j < 2 ? 0xd8b060 : 0xb08a3e); // the head, rubbed to gold by many hands
      P(X - 8 * f, Y - 8, 0x2a2420);
      P(X - 10 * f, Y - 8, 0x2a2420); // the horns
    }, () => shadowBox(X - 8, Y - 4, 17, 4, 3, 0.7));
    crowd(x - 3, u - 3, 6, 2, 3);
  };
  ox(84.5, 5590);
  ox(100, 5596, false);
  for (const [x, u] of [[80, 5580], [104, 5580], [62, 5590], [122, 5590], [70, 5604], [114, 5604]]) toro(x, u);
  crowd(58, 5579, 76, 5, 16);
  for (const [x, u, c] of [[60, 5600, 'red'], [126, 5600, 'white'], [132, 5592, 'pink'], [58, 5586, 'white']]) ume(x, u, 2.6, c, { bloom: 1 });

  // ---- Shinji-ike: the stones along its shores and the islands', the water under the bridges, the light on it, carp
  // and turtles; pines and a plum on the islands, a lantern on each
  // its shore drawn in and out in coves and points round the outline the route gives it (the bridges' ends kept)
  const wob = (x, u) => {
    const a = Math.atan2((u - pcu) / pru, (x - pcx) / prx);
    return 0.16 * Math.sin(a * 3 + 0.7) + 0.1 * Math.sin(a * 7 + 2.1) + 0.05 * Math.sin(a * 13);
  };
  fill(46, 5604, 138, 5656, (x, u, X, Y) => {
    const e0 = pe(x, u);
    const e = Math.abs(x - 92) < 4 ? e0 : e0 + Math.max(0, wob(x, u)) * (e0 > 0.6 ? 1 : 0);
    if (e0 < 1 && e >= 1.08) return u < 5612 ? shade(0xb4b0a4, 0.96 + hashPx(X >> 1, Y >> 1, 6) * 0.08) : shade(0x6e6e48, 0.9 + hashPx(X >> 1, Y >> 1, 12) * 0.14); // a point of land
    if (e >= 1 && e < 1.08) return shade(0x8a867c, 0.8 + hashPx(X >> 1, Y >> 1, 7) * 0.4); // the shore's stones
    for (const g of islands) {
      const f = ie(g, x, u);
      if (f < 1 && f > 0.78) return shade(0x8a867c, 0.82 + hashPx(X >> 1, Y >> 1, 8) * 0.4);
    }
    if (Math.abs(x - 92) < 3.2 && onPond(x, u)) return shade(0x325854, 0.96 + hashPx(X, Y, 9) * 0.06); // (no path on the water: the bridges stand over it)
    return null;
  });
  for (let k = 0; k < 40; k++) {
    const [x, u] = [52 + hashPx(k, 1, 31) * 80, 5608 + hashPx(k, 2, 31) * 44];
    if (onPond(x, u) && Math.abs(x - 92) > 5) glint(FX(x), FY(u), 2 + Math.floor(hashPx(k, 3, 31) * 5), x < 80 ? 0xfff0c8 : 0xe8f0f0, 0.45);
  }
  for (const g of islands) {
    const [cx, cu, rx] = g.ell;
    for (const dx of [-rx + 4, rx - 4]) tree('pine', cx + dx, cu + 0.4, 2.2);
    ume(cx + (cu > 5630 ? -6.5 : 6.5), cu - 0.6, 2, cu > 5630 ? 'pink' : 'white', { bloom: 1 });
    toro(cx + (cu > 5630 ? 5 : -5), cu - 1.4);
  }
  const koi = [0xf08030, 0xf4f0e8, 0xd83a2a].map((c, k) => kit.frame(1, 1, 5630, (put) => { put(0, 1, c); put(1, 1, k === 1 ? 0xd83a2a : c); put(2, 1, shade(c, 0.8)); }));
  const loopPts = Array.from({ length: 25 }, (_, k) => [92 + Math.cos((k / 24) * Math.PI * 2) * 34, 5630 + Math.sin((k / 24) * Math.PI * 2) * 13]);
  props.path(loopPts, koi, { sp: 1.6, n: 7, gap: 20, mode: 'wrap', turn: 'none', s0: 0.2, d: -0.02 });
  for (const [x, u] of [[54, 5624], [128, 5638], [70, 5650]])
    mark(x, u, (X, Y) => {
      R(X - 3, Y - 1, 7, 3, 0x8a867c); // a rock in the water
      R(X - 3, Y - 1, 7, 1, 0xa8a49a);
      for (const dx of [-2, 2]) { R(X + dx - 1, Y - 3, 3, 2, 0x3a4a2a); P(X + dx + 1, Y - 3, 0x5a6a3a); } // turtles in the sun
    });

  // ---- the three bridges: arched, flat, arched; vermilion railings with bronze caps on their posts, decks of
  // wood, steps on the arched ones, the posts standing in the water under them, their reflections
  {
    const [XA, XB] = [FX(89.4), FX(94.6)];
    const bw = XB - XA;
    const span = (ua, ub, H) => {
      const zAt = (u) => (H ? H * Math.sin((Math.PI * (u - ua)) / (ub - ua)) : 1 - Math.max(0, 0.6 - Math.min(u - ua, ub - u)) * 0.6);
      queue(FY(ua) + 1, () => {
        // the reflections first, upside down under it in the water
        for (let u = ua; u <= ub; u += 1 / S) {
          const z = zAt(u) * S;
          const Yr = Math.round(FY(u) + z * 0.8);
          if (!onPond(92, ctx.L - Yr / S)) continue;
          for (const X of [XA, XA + 1, XB - 2, XB - 1]) if (hashPx(X, Yr, 5) < 0.7) P(X, Yr, 0x7a3a2a);
        }
        let prev = null;
        for (let u = ub; u >= ua - 1e-6; u -= 1 / S) {
          const z = zAt(u) * S;
          const Y = Math.round(FY(u) - z);
          const rising = H > 0 && u < (ua + ub) / 2;
          const step = Math.round((u - ua) * S);
          // the posts down to the water
          if (step % 6 === 3 && z > 2 && onPond(92, u)) for (const X of [XA + 1, XB - 2]) for (let y = Y + 1; y < FY(u); y++) P(X, y, y === FY(u) - 1 ? 0x2a1e1a : 0x6a2a20);
          for (let y = prev == null || Y < prev ? Y : prev + 1; y <= Y; y++) {
            for (let i = 0; i < bw; i++) {
              let c;
              if (i < 2 || i >= bw - 2) c = shade(VERMILION, i < 2 ? 1.08 : 0.82);
              else {
                c = shade(0xa07a4c, H ? (rising ? 1.12 : 0.8) : 1) * 1;
                if (H && rising && step % 4 === 0) c = shade(0xa07a4c, 0.7); // the steps
                else if (!H && i % 3 === 0) c = shade(0xa07a4c, 0.86); // the flat one's planks
              }
              P(XA + i, y, c);
            }
          }
          // the railing standing over the deck's edges, a post now and then with its bronze cap
          for (const X of [XA, XB - 1]) {
            P(X, Y - 1, shade(VERMILION, 1.2));
            P(X, Y - 2, shade(VERMILION, X === XA ? 1.25 : 0.95));
            if (step % 6 === 0) { P(X, Y - 3, VERMILION); P(X, Y - 4, 0x9a8a5a); }
          }
          prev = prev == null ? Y : Math.max(prev, Y);
        }
      }, () => {
        // its shadow on the water, thrown east by the afternoon sun: the higher the deck, the farther out (the arch
        // shows in it as a bow)
        for (let u = ua; u <= ub; u += 1 / S) {
          const z = zAt(u) * S;
          shadowBox(XA + Math.round(z * 1.1) + 2, FY(u) + Math.round(z * 0.25), bw, 1, 0, 0.6);
        }
      });
    };
    const [i1, i2] = islands.map((g) => [g.ell[1] - g.ell[3], g.ell[1] + g.ell[3]]);
    const shoreAt = (u0, dir) => { let u = u0; while (pe(92, u) >= 1) u += dir * 0.1; return u; };
    span(shoreAt(5600, 1) - 1, i1[0] + 0.8, 4.4);
    span(i1[1] - 0.8, i2[0] + 0.8, 0);
    span(i2[1] - 0.8, shoreAt(5660, -1) + 1, 4.2);
  }

  // ---- the shrine: its gravel, the water basin, the two-storeyed gate, the corridors round the inner court, the
  // main hall, Tobiume, the ema racks and the omikuji, people praying, students; camphors behind
  const KEI = GROUNDS.find((g) => g.id === 'tenmangu_keidai').rect;
  fill(KEI[0], KEI[1], KEI[0] + KEI[2], KEI[1] + KEI[3], (x, u, X, Y) => shade(0xd8d4c8, 0.95 + hashPx(X, Y, 11) * 0.07)); // white gravel
  const hallFace = (x, u, w, f) =>
    mark(x, u, (X, Y) => {
      const [n, h] = [FX(x + w) - X, Math.round(f * S)];
      for (let j = 1; j < h; j++)
        for (let i = 1; i < n - 1; i++) {
          const pillar = i % 7 === 1;
          const door = Math.abs(i - n / 2) < n * 0.18 && j > 1 && j < h - 1;
          P(X + i, Y - h + j, pillar ? VERMILION : j === 1 ? (i % 7 === 4 ? GOLD : 0x3a2a24) : j === h - 1 ? 0x3a2a24 : door ? (i % 2 ? 0x5a3a26 : 0x7a5236) : shade(0xf0ece0, 0.92)); // vermilion pillars, gilt on the beam, white panels, lattice doors
        }
    });
  // the water basin under its little roof
  house(64, 5656.5, 8, 5, { tile: BARK, wall: VERMILION, face: 1.4, s: 26201 });
  mark(68, 5655.4, (X, Y) => { R(X - 4, Y - 2, 9, 2, 0x9a968c); R(X - 3, Y - 2, 7, 1, 0x5a8aa0); });
  // the corridors round the inner court
  for (const [x, u, w, h] of [[62, 5664, 22.4, 3], [99.6, 5664, 22.4, 3], [59.6, 5664, 3, 48], [121.4, 5664, 3, 48], [59.6, 5709, 64.8, 3]]) {
    house(x, u, w, h, { tile: BARK, wall: VERMILION, hip: false, face: 1.3, s: 26210 + x });
    if (w > h) hallFace(x, u, w, 1.3);
  }
  // the gate: two storeys, the upper drawn standing on the lower
  {
    const g = plot('romon');
    house(g.x, g.u, g.w, g.h, { tile: BARK, wall: VERMILION, face: 2.4, s: 26220 });
    hallFace(g.x, g.u, g.w, 2.4);
    house(g.x + 2, g.u + 3.4, g.w - 4, g.h - 3.2, { tile: BARK, wall: VERMILION, face: 1.6, s: 26221, over: g.u, rank: 3 });
    mark(g.x + g.w / 2, g.u + 0.2, (X, Y) => { R(X - 2, Y - 7, 5, 6, 0x2a1e1a); }, g.u); // its passage
  }
  // the main hall: roof of cypress bark, the curved gable over its front steps, gold on the ridge's ends
  {
    const h = plot('honden');
    house(h.x, h.u, h.w, h.h, { tile: BARK, wall: VERMILION, face: 3.4, s: 26230 });
    hallFace(h.x, h.u, h.w, 3.4);
    const [X0, YB] = [FX(h.x), FY(h.u)];
    const cX = FX(h.x + h.w / 2);
    queue(YB + 2, () => {
      // the karahafu: a gable curving out over the steps, its front edge bowed up in the middle, gilt along it
      const fh = Math.round(3.4 * S);
      for (let i = -16; i <= 16; i++) {
        const t = i / 16;
        const edge = YB + 3 - Math.round(4 * (1 - t * t)) + (Math.abs(t) > 0.85 ? 1 : 0);
        for (let y = YB - fh - 3; y <= edge; y++) P(cX + i, y, y === edge ? 0x2a1e1a : shade(BARK, (i < 0 ? 1.12 : 0.86) * ((y - (YB - fh - 3)) % 2 ? 0.94 : 1)));
        P(cX + i, edge + 1, GOLD);
      }
      R(cX - 1, YB - 2, 3, 2, GOLD); // the ornament at its peak
      R(cX - 7, YB + 3, 15, 3, 0x9a968c); // the stone steps
      R(cX - 7, YB + 3, 15, 1, 0xb4b0a6);
      R(cX - 5, YB + 6, 11, 2, 0x4a3022); // the offering box
      for (const dx of [-3, 3]) for (let j = 0; j < 5; j++) P(cX + dx, YB + 1 + j, j % 2 ? 0xc8302a : 0xf0ece0); // the bell ropes
    }, () => shadowBox(cX - 16, YB - 4, 33, 4, 3, 0.72));
    void X0;
    crowd(h.x + 4, h.u - 9, h.w - 8, 7, 26); // people praying, students among them
  }
  // Tobiume: old, white, propped on crutches behind its low fence
  {
    const t = plot('tobiume');
    const [x, u] = [t.x + t.w / 2, t.u + t.h / 2];
    mark(x, u - 3.4, (X, Y) => {
      for (let i = -11; i <= 11; i++) { P(X + i, Y, 0x8a7a5a); P(X + i, Y - 22, 0x8a7a5a); }
      for (let j = -22; j <= 0; j++) { P(X - 11, Y + j, 0x8a7a5a); P(X + 11, Y + j, 0x8a7a5a); }
      for (let i = -11; i <= 11; i += 4) P(X + i, Y - 1, 0x5a4a3a);
    });
    ume(x, u, 4, 'white', { old: true, bloom: 1, seed: 7777 });
  }
  // the ema racks: rows of little wooden plaques with their bright cords; the omikuji knotted white on their lines
  for (const [x, u] of [[64, 5688], [64, 5696]])
    mark(x, u, (X, Y) => {
      R(X - 1, Y - 6, 2, 7, 0x5a4232);
      R(X + 22, Y - 6, 2, 7, 0x5a4232);
      R(X - 1, Y - 7, 25, 1, 0x4a3022);
      for (let row = 0; row < 3; row++) for (let i = 0; i < 22; i += 2) { P(X + 1 + i, Y - 6 + row * 2, shade(0xd8b880, 0.9 + hashPx(i, row, 3) * 0.2)); if (hashPx(i, row, 4) < 0.4) P(X + 1 + i, Y - 5 + row * 2, [0xc8302a, 0xe0b030, 0x3a6aa8][(i + row) % 3]); }
    });
  mark(64, 5676, (X, Y) => { for (let row = 0; row < 2; row++) { for (let i = 0; i < 26; i++) P(X + i, Y - row * 3, i % 2 ? 0xf4f2ec : 0xdcd8cc); R(X - 1, Y - row * 3 - 2, 1, 3, 0x5a4232); R(X + 26, Y - row * 3 - 2, 1, 3, 0x5a4232); } });
  for (const [x, u] of [[86, 5672.5], [98, 5672.5], [86, 5677], [98, 5677]]) toro(x, u);
  mark(70, 5702.6, (X, Y) => {
    for (let i = -8; i <= 8; i++) { P(X + i, Y, 0x8a7a5a); P(X + i, Y - 16, 0x8a7a5a); }
    for (let j = -16; j <= 0; j++) { P(X - 8, Y + j, 0x8a7a5a); P(X + 8, Y + j, 0x8a7a5a); }
  });
  ume(70, 5700, 3, 'red', { old: true, bloom: 1, seed: 7781 });
  crowd(62, 5682, 10, 14, 9);
  crowd(100, 5672, 20, 8, 8);
  crowd(70, 5658, 44, 4, 12);
  // the camphors behind, great and old, one with its rope of rice straw
  for (const [x, u] of [[74, 5716], [94, 5716], [112, 5716]]) {
    house(x - 3, u - 2, 6, 4, { tile: BARK, wall: VERMILION, face: 1.2, s: 26240 + x }); // a small shrine of the grounds
    torii(x - 1.6, x + 1.6, u - 3.4, VERMILION, 2.4);
  }
  for (const [x, u, r] of [[62, 5724, 6.4], [84, 5727, 5.6], [103, 5726, 6], [123, 5722, 5], [66, 5714, 3.4]]) tree('broadleaf', x, u, r);

  // ---- the plum groves: in clumps of white, pink and deep red, gravel paths winding through them to the shrine and
  // the forecourt; old trees with tags and bamboo fences; people with cameras, on mats, on red benches
  const GROVES = ['umeen_w', 'umeen_e', 'umeen_n'].map((id) => GROUNDS.find((g) => g.id === id));
  const PATHS = [
    [[56, 5598], [40, 5603], [24, 5620], [15, 5650], [20, 5690], [36, 5716], [56, 5700]],
    [[24, 5620], [40, 5650], [36, 5716], [30, 5758]],
    [[128, 5600], [150, 5606], [166, 5630], [162, 5668], [146, 5700], [128, 5690]],
    [[60, 5734], [80, 5744], [100, 5740], [118, 5750], [124, 5758]],
  ];
  const nearPath = (x, u, d) => PATHS.some((pts) => near(pts, x, u).d < d);
  const strip = (x, u) => ((x > 124 && x < 140) || (x > 46 && x < 56)) && u > 5606 && u < 5732 && pe(x, u) > 1.15 && !inShape(GROUNDS.find((g) => g.id === 'tenmangu_keidai'), x, u);
  const groveAt = (x, u) => GROVES.some((g) => inShape(g, x, u)) || strip(x, u) || (x > 124 && x < 140 && u > 5716) || (x > 158 && u > 5716);
  fill(0, 5586, W, U1, (x, u, X, Y) => {
    if (!groveAt(x, u)) return null;
    const d = Math.min(...PATHS.map((pts) => near(pts, x, u).d));
    if (d < 1.4) return shade(0xc8bca6, 0.94 + hashPx(X, Y, 13) * 0.08); // gravel
    if (d < 1.8) return 0x8a8270;
    return null;
  });
  const COL = ['white', 'white', 'pink', 'pink', 'red'];
  let n = 0;
  for (let u = 5588; u < U1; u += 6.4)
    for (let x = 2; x < W - 2; x += 6.6) {
      const [tx, tu] = [x + (hashPx(x, u, 1) - 0.5) * 3.6, u + (hashPx(x, u, 2) - 0.5) * 3.2];
      const inGrove = groveAt(tx, tu);
      if (!inGrove || nearPath(tx, tu, 3.2) || nearRoad(tx, tu, 2.4)) continue;
      if (['kyokusui', 'tobiume', 'honden'].some((id) => { const p = plot(id); return tx > p.x - 2 && tx < p.x + p.w + 2 && tu > p.u - 2 && tu < p.u + p.h + 2; })) continue;
      const zone = hashPx(Math.floor(tx / 18), Math.floor(tu / 16), 21);
      const c = COL[Math.floor(zone * COL.length)];
      const old = hashPx(tx, tu, 3) < 0.16;
      const weeping = !old && hashPx(tx, tu, 4) < 0.1;
      ume(tx, tu, 2.6 + hashPx(tx, tu, 5) * 1.1, c, { old, weeping, bloom: 1 });
      if (old)
        mark(tx, tu - 0.4, (X, Y) => {
          for (let i = -6; i <= 6; i++) for (const j of [0, -9]) if (i % 2 === 0) P(X + i, Y + j, 0xc8b070); // its bamboo fence
          for (let j = -9; j <= 0; j++) for (const i of [-6, 6]) if (j % 2 === 0) P(X + i, Y + j, 0xb8a060);
          R(X + 3, Y - 2, 2, 1, 0xf4f0e4); // the tag with its variety
        });
      n++;
    }
  // people in the groves: with cameras on the paths, on mats under the trees, on red benches
  for (let k = 0; k < 26; k++) {
    const pts = PATHS[k % PATHS.length];
    const s = hashPx(k, 7, 41);
    const seg = Math.floor(s * (pts.length - 1));
    const t = hashPx(k, 8, 41);
    const [[ax, au], [bx, bu]] = [pts[seg], pts[seg + 1]];
    const [x, u] = [ax + (bx - ax) * t, au + (bu - au) * t];
    if (u >= U1 - 1) continue;
    mark(x, u, (X, Y) => {
      person(X, Y, 26300 + k);
      if (k % 2) P(X + 2, Y + 1, 0x1a1a1e); // a camera
    });
  }
  for (const [x, u, c] of [[30, 5640, 0x3a6ab0], [10, 5700, 0x5a8a4a], [168, 5650, 0x3a6ab0], [152, 5690, 0xe0b030], [74, 5752, 0x3a6ab0]])
    mark(x, u, (X, Y) => {
      R(X - 5, Y - 3, 11, 6, c); // a mat
      R(X - 5, Y - 3, 11, 1, shade(c, 1.2));
      for (let q = 0; q < 3; q++) person(X - 4 + q * 3, Y - 3 + (q % 2), 26400 + X + q);
    });
  for (const [x, u] of [[44, 5612], [158, 5612], [44, 5706]])
    mark(x, u, (X, Y) => {
      R(X - 6, Y - 1, 12, 2, 0xc8302a); // a bench under red felt
      for (const q of [-4, 1]) person(X + q, Y - 4, 26500 + X + q);
    });

  // ---- the garden of the winding stream: moss, the stream curving through it, the poets in Heian dress sat along it
  // with their cups floating down to them, an attendant, a great red parasol
  {
    const p = plot('kyokusui');
    const at = (x) => p.u + p.h / 2 + Math.sin(((x - p.x) / p.w) * Math.PI * 2.4) * 6;
    fill(p.x, p.u, p.x + p.w, p.u + p.h, (x, u, X, Y) => {
      const q = ((x - p.x - p.w / 2) / (p.w / 2)) ** 2 + ((u - p.u - p.h / 2) / (p.h / 2)) ** 2;
      if (q > 0.9 + hashPx(X >> 2, Y >> 2, 14) * 0.25) return null; // (its edge into the grove's moss)
      const d = Math.abs(u - at(x));
      if (d < 0.9) return shade(0x6a9ab0, 0.96 + hashPx(X, Y, 15) * 0.08);
      if (d < 1.3) return 0x8a867c;
      return shade(0x56703a, 0.92 + hashPx(X >> 1, Y >> 1, 16) * 0.12); // moss
    });
    const ROBES = [[0x6a3a7a, 0xc8302a, 0x3a7a4a], [0x2a2a40, 0x8a2a24, 0xe0d0a0], [0xd8607a, 0xe8c040, 0x4a6aa8], [0x3a3a30, 0x4a6aa8, 0xe8e4d8]];
    for (let k = 0; k < 7; k++) {
      const x = p.x + 3 + k * 4;
      const side = k % 2 ? 2.2 : -2.2;
      const robe = ROBES[k % ROBES.length];
      const man = k % 3 !== 1;
      mark(x, at(x) + side, (X, Y) => {
        for (let j = 0; j < 4; j++) for (let i = -2; i <= 2; i++) if (Math.abs(i) <= 1 + (j >> 1)) P(X + i, Y + j, robe[Math.min(2, Math.abs(i))]); // the layered robe spread on the moss
        P(X, Y - 1, 0xe8c8a8); // the face
        if (man) { P(X, Y - 2, 0x1a1a1e); P(X, Y - 3, 0x1a1a1e); } // the tall black cap
        else for (let j = -1; j < 4; j++) P(X + (k % 2 ? 2 : -2), Y + j, 0x1a1a1e); // the long hair down her back
      });
    }
    const cup = kit.frame(1, 1, p.u, (put) => { put(1, 1, 0xc8302a); put(0, 1, 0xa82a24); put(1, 0, 0xe0b040); });
    const pts = Array.from({ length: 31 }, (_, k) => [p.x + (k / 30) * p.w, at(p.x + (k / 30) * p.w)]);
    props.path(pts, [cup], { sp: 0.9, n: 3, gap: 14, mode: 'wrap', turn: 'none', s0: 0.3, d: -0.02 });
    mark(p.x + 2, p.u + p.h - 2, (X, Y) => {
      for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) if (i * i + j * j <= 38) P(X + i, Y - 8 + j, (i * i + j * j) % 9 === 0 ? 0xa82a24 : i + j < 0 ? 0xe04a3a : 0xc8302a); // the parasol
      R(X, Y - 2, 1, 4, 0x3a2a24);
    });
  }

  // ---- Komyozen-ji in the town: its hall, the garden of stones in raked white gravel before it, the moss garden
  // with its sea of gravel behind, maples
  {
    const p = plot('komyozenji');
    fill(p.x, p.u, p.x + p.w, p.u + p.h, (x, u, X, Y) => {
      if (Math.abs(x - 40) < 1.2 && u < p.u + 12) return null; // (the path to its hall)
      if (u < p.u + 12) return Y % 3 === 0 ? 0xc8c4b6 : shade(0xe4e0d4, 0.97 + hashPx(X, Y, 17) * 0.05); // raked gravel
      if (u > p.u + 22) {
        const sea = Math.abs(u - (p.u + 26 + Math.sin((x - p.x) / 4) * 1.6)) < 1.2;
        return sea ? (Y % 3 === 0 ? 0xc8c4b6 : 0xe4e0d4) : shade(0x4e6a34, 0.9 + hashPx(X >> 1, Y >> 1, 18) * 0.16); // moss, and its sea of gravel
      }
      return shade(0x5a5650, 0.95 + hashPx(X, Y, 19) * 0.06);
    });
    for (const [dx, du, r] of [[4, 4, 2], [8, 6, 1.4], [14, 3, 1.6], [24, 6, 2.2], [27, 3, 1.2], [6, 9, 1]])
      mark(p.x + dx, p.u + du, (X, Y) => {
        const rr = Math.round(r * S);
        for (let j = -rr - 2; j <= rr + 2; j++) for (let i = -rr - 3; i <= rr + 3; i++) {
          const q = (i * i) / ((rr + 3) * (rr + 3)) + (j * j) / ((rr + 2) * (rr + 2));
          if (q <= 1 && (i * i) / (rr * rr + 1) + (j * j) / (rr * rr * 0.5 + 1) > 1) P(X + i, Y + j, q > 0.8 ? 0xb8b4a6 : 0x4e6a34); // moss round the stone, the gravel raked round it
        }
        for (let j = -Math.round(rr * 0.7); j <= 0; j++) for (let i = -rr; i <= rr; i++) if (i * i + j * j * 2 <= rr * rr) P(X + i, Y + j, shade(0x7a766c, 1.15 - (j + rr) * 0.06 + (i < 0 ? 0.08 : -0.08))); // the stone
      });
    house(p.x + 6, p.u + 13, p.w - 12, 9, { tile: 0x4e5058, wall: 0xe8e4d8, face: 1.8, s: 26601 });
    for (const [dx, du] of [[2, 24], [10, 28], [26, 25], [28, 14], [2, 14]]) tree('broadleaf', p.x + dx, p.u + du, 1.6);
  }

  // ---- the town round the approach: lanes from the approach out to the strip's edges and between them, a car park
  // full of coaches, houses under tile with their gardens, a plum in many of them, a few bigger inns
  for (const [x0, u0, x1, u1] of LANES)
    fill(x0, u0, x1, u1, (x, u, X, Y) => (taken(x, u) && !inLane(x, u) ? null : (X - FX(x0)) % 30 === 0 && x1 - x0 > u1 - u0 ? 0x6a6a70 : shade(0x5c5c62, 0.97 + hashPx(X, Y, 23) * 0.05)));
  {
    const [x0, u0, w, h] = PARK;
    fill(x0, u0, x0 + w, u0 + h, (x, u, X, Y) => ((X - FX(x0)) % 9 === 0 && (u - u0) % 14 > 2 && (u - u0) % 14 < 12 ? 0xd8d8d0 : shade(0x56585e, 0.97 + hashPx(X, Y, 24) * 0.05)));
    for (let k = 0; k < 8; k++) {
      if (hashPx(k, 3, 25) < 0.2) continue;
      const [bx, bu] = [x0 + 1 + k * 3, u0 + 2 + (k % 2 ? 14 : 0)];
      mark(bx, bu + 10, (X, Y) => {
        const c = [0xf0ece4, 0xe8e4dc, 0xd8e0e8][k % 3];
        R(X, Y, 7, 30, c); // a coach, its roof from above
        R(X, Y, 7, 2, 0x3a4a5a);
        R(X + 1, Y + 6, 5, 3, shade(c, 0.85)); // its roof hatch
        for (let j = 4; j < 30; j += 9) R(X, Y + j, 7, 1, [0xc8302a, 0x3a6aa8, 0x3a8a5a][k % 3]); // its livery
        kit.hi.tint(X + 7, Y + 2, 0.7);
      });
    }
    crowd(x0 + 2, u0 + h - 3, w - 4, 2, 6);
  }
  for (const [x0, u0, x1, u1] of LANES) if (x1 - x0 > u1 - u0) trafficOn([[x0, (u0 + u1) / 2], [x1, (u0 + u1) / 2]], { sp: 6, gap: 90, s0: rand() });
  for (let u = U0; u < 5586; u += 1)
    for (let x = 0; x < W - 4; x += 1) {
      const big = rand() < 0.12;
      const w = big ? 14 + Math.floor(rand() * 6) : 6 + Math.floor(rand() * 6);
      const h = big ? 10 + Math.floor(rand() * 4) : 6 + Math.floor(rand() * 4);
      if (!boxFree(x, u, w, h)) continue;
      claim(x - 1, u - 1, w + 2, h + 2);
      if (big) {
        // an inn round its courtyard garden
        house(x + 0.5, u + h - 4, w - 1, 3.4, { tile: pick(TILE), wall: 0xe8e4d8, hip: false, face: 1.6, s: Math.floor(rand() * 1e6) });
        house(x + 0.5, u + 0.5, w - 1, 3.4, { tile: pick(TILE), wall: 0x6a4a34, hip: false, face: 1.8, s: Math.floor(rand() * 1e6) });
        fill(x + 1, u + 4, x + w - 1.5, u + h - 4.2, (xx, uu, X, Y) => shade(0x5a7038, 0.9 + hashPx(X >> 1, Y >> 1, 26) * 0.16));
        ume(x + w / 2, u + h / 2, 1.8, pick(COL), { bloom: 1 });
        mark(x + 2, u + h / 2 - 0.4, (X, Y) => { R(X, Y - 1, 3, 2, 0x8a867c); P(X + 1, Y - 2, 0x5a8aa0); }); // a stone basin
      } else {
        const gardenS = rand() < 0.4; // a garden in front
        house(x + 0.5, u + (gardenS ? 2.4 : 0.5), w - 1.5, h - (gardenS ? 3.8 : 2), { tile: pick(TILE), s: Math.floor(rand() * 1e6) });
        if (gardenS) fill(x + 0.5, u + 0.3, x + w - 1, u + 2.2, (xx, uu, X, Y) => shade(0x6a7a44, 0.9 + hashPx(X, Y, 27) * 0.14));
        if (rand() < 0.55) ume(x + w - 1.6, u + h - 1.4, 1.6, pick(COL), { bloom: 1 });
        else if (rand() < 0.4) tree('broadleaf', x + w - 1.4, u + h - 1.2, 1.3);
        if (rand() < 0.25) mark(x + 1, u + 0.2, (X, Y) => { R(X, Y - 2, 4, 2, pick([0xc8c8c8, 0x3a4a6a, 0xa83a3a, 0xf0ece4])); R(X, Y - 2, 4, 1, 0x8ab0c8); }); // a car in the drive
      }
      x += w + 1;
    }
  // what the houses leave: shrubs, a vegetable plot, a shed, bicycles, a parked car
  for (let u = U0; u < 5578; u += 1)
    for (let x = 0; x < W - 3; x += 1) {
      if (!boxFree(x, u, 3, 3)) continue;
      claim(x, u, 3, 3);
      const r = rand();
      if (r < 0.32) tree(pick(['tiny', 'broadleaf']), x + 1.5, u + 1.5, 1 + rand() * 0.5);
      else if (r < 0.44) fill(x + 0.3, u + 0.3, x + 2.7, u + 2.7, (xx, uu, X, Y) => (Y % 2 ? 0x6a8a3a : 0x6a5038)); // a vegetable plot
      else if (r < 0.56) house(x + 0.4, u + 0.4, 2.2, 2.2, { tile: pick([0x7a7e86, 0x8a5a3a]), face: 1, s: Math.floor(rand() * 1e6) });
      else if (r < 0.66) mark(x + 0.5, u + 1.6, (X, Y) => { for (let i = 0; i < 6; i += 2) { P(X + i, Y, 0x2a2a30); P(X + i, Y - 1, pick([0xc8302a, 0x3a6aa8, 0xe8e4d8])); } }); // bicycles
      else if (r < 0.74) mark(x + 0.5, u + 2.4, (X, Y) => { R(X, Y - 4, 4, 6, pick([0xe8e4dc, 0x2a2a30, 0x8a9aa8, 0xa83a3a])); R(X, Y - 3, 4, 1, 0x8ab0c8); kit.hi.tint(X + 4, Y - 2, 0.7); }); // a parked car
      x += 2;
    }
  void n;
}
