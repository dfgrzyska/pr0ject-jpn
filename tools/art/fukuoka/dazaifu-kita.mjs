// Dazaifu past its shrine (u 5760-6500, docs/plan-fukuoka.md phase 7), the afternoon turning golden. The plum groves
// going on behind the shrine with their gravel paths out to the old road, people under the trees; the wooded hill to
// the east with the walk from the shrine going into it through its tunnel (lit inside in the colours of a rainbow) and
// out by the museum: its long roof of glass rising and falling in waves over the trees, its car park and lawns; the old
// road with the houses along it and cars; the fields after winter, a farmer or two, puddles with the sky in them; the
// quiet grounds of Kanzeon-ji under their great camphors - its hall, the bell tower with the oldest bell in the land,
// the Kaidan-in - and the hamlets and fields beyond, on the way to the old government's ruins.
import { shade } from '../tokyo/kit.mjs';
import { hashPx } from '../hires.mjs';
import { fbm } from '../../lib/raster.mjs';
import { inShape } from '../tokyo/geom.mjs';
import { ROADS, GROUNDS } from './route.mjs';
import { freeMap } from './free.mjs';
import { umeKit } from './ume.mjs';
import { makeParts, VERMILION } from '../kawaguchiko/parts.mjs';

const [U0, U1] = [5760, 6500];
const TILE = [0x4e5058, 0x585a62, 0x5a5048, 0x464850];
const UME_COL = ['white', 'white', 'pink', 'pink', 'red'];

/** Shared by Dazaifu's north and Mizuki: painting boxes a fine pixel at a time, fields, woods, houses. */
export function landKit(ctx, U0_, U1_) {
  const { kit, S, W, near } = ctx;
  const { house, mark, ground, rand, pick, P, R, FX, FY, person, tree, hi } = kit;
  const ume = umeKit(kit, S);
  const fm = freeMap(U0_, U1_);
  const fill = (x0, u0, x1, u1, fn) =>
    ground(() => {
      for (let Y = Math.max(0, FY(u1)); Y < FY(u0); Y++)
        for (let X = Math.max(0, FX(x0)); X < Math.min(W * S, FX(x1)); X++) {
          const c = fn(X / S, ctx.L - Y / S, X, Y);
          if (c != null) P(X, Y, c);
        }
    });
  const nearRoad = (x, u, d = 1) => ROADS.some((r) => near(r.pts, x, u).d < r.w / 2 + d);
  /** Fields after winter in the box: stubble in rows, the bunds with rape in flower on them, puddles with the sky in
   * them, a farmer, a shed at a corner. */
  const fields = (x0, u0, x1, u1, seed) => {
    // small fields in rows, each one its own: stubble, flooded with the sky in it, barley coming up green in rows,
    // rape in flower, fresh furrows; grassy bunds between them, a wider one with a track every few
    const CW = 15;
    const rowH = (r) => 10 + Math.floor(hashPx(r, seed, 7) * 6);
    const rows = [];
    for (let u = u0, r = 0; u < u1; r++) { rows.push([u, Math.min(u1, u + rowH(r))]); u += rowH(r); }
    const cellAt = (x, u) => {
      const r = rows.findIndex(([a, b]) => u >= a && u < b);
      const shift = (r % 2) * 6;
      const c = Math.floor((x - x0 + shift) / CW);
      return { r, c, bx: (x - x0 + shift) % CW, bu: u - rows[Math.max(0, r)][0], kind: Math.floor(hashPx(c, r, seed) * 10) };
    };
    fill(x0, u0, x1, u1, (x, u, X, Y) => {
      if (nearRoad(x, u, 0.4)) return null;
      const { c, bx, bu, kind } = cellAt(x, u);
      const track = c % 4 === 0 && bx < 1.3;
      if (track) return shade(0xb0a07c, 0.94 + hashPx(X, Y, seed) * 0.1); // a farm track
      if (bx < 0.67 || bu < 0.67) return hashPx(X, Y, seed + 1) < 0.18 ? 0xd8d040 : shade(0x7a8a40, 0.9 + hashPx(X, Y, seed + 2) * 0.2); // a bund, a little rape on it
      const n = hashPx(X, Y, seed + 3);
      if (kind < 4) return Y % 4 === 0 && n < 0.5 ? 0xb09868 : shade(0x847250, 0.94 + n * 0.1); // stubble in rows
      if (kind < 6) return n < 0.04 ? 0xfff0d0 : shade(Y % 6 < 3 ? 0x9ab4b8 : 0xb8b4a0, 0.95 + n * 0.06); // flooded, the warm sky in it
      if (kind < 8) return X % 4 < 2 ? shade(0x6a8a3a, 0.92 + n * 0.16) : shade(0x6a5a40, 0.94 + n * 0.08); // barley in rows
      if (kind < 9) return n < 0.6 ? shade(0xe8d040, 0.9 + n * 0.15) : 0x6a8a3a; // rape in flower
      return Y % 3 === 0 ? 0x4a3a2a : shade(0x6a5038, 0.92 + n * 0.12); // fresh furrows
    });
    for (let k = 0; k < 3; k++) {
      const [x, u] = [x0 + 6 + hashPx(k, seed, 5) * (x1 - x0 - 12), u0 + 6 + hashPx(k, seed, 6) * (u1 - u0 - 12)];
      if (!nearRoad(x, u, 2)) mark(x, u, (X, Y) => { person(X, Y, seed + k); P(X + 2, Y + 2, 0x6a5038); }); // a farmer with a hoe
    }
    // a little truck on a track
    const tx = x0 + Math.ceil(0.5 * (x1 - x0) / (CW * 4)) * CW * 4 + 0.6;
    if (tx < x1 - 2)
      mark(tx, u0 + (u1 - u0) * 0.4, (X, Y) => {
        R(X - 2, Y - 7, 5, 8, 0xe8e4dc);
        R(X - 2, Y - 7, 5, 3, 0x8ab0c8);
        R(X - 2, Y - 3, 5, 4, 0xd8d4cc); // its open bed
        hi.tint(X + 3, Y - 6, 0.7);
      });
  };
  /** Woods in the box (or a shape): broadleaf, camphors and some cedar, clear of the roads and of `keep(x, u)`. */
  const woods = (x0, u0, x1, u1, density, keep = () => false, kinds = ['broadleaf', 'broadleaf', 'cedar']) => {
    for (let k = 0; k < ((x1 - x0) * (u1 - u0)) / density; k++) {
      const [x, u] = [x0 + rand() * (x1 - x0), u0 + rand() * (u1 - u0)];
      if (nearRoad(x, u, 2.2) || keep(x, u)) continue;
      const kind = kinds[Math.floor(hashPx(Math.floor(x / 20), Math.floor(u / 24), 61) * kinds.length)];
      tree(kind, x, u, kind === 'cedar' ? 1.6 + rand() * 0.8 : 2 + rand() * 1.6);
    }
  };
  /** Houses on what is free in the band: farmhouses and town houses under tile, gardens, a plum or a persimmon, a
   * car in the drive; then shrubs, plots and sheds in what they leave. */
  const homes = (uA, uB, xA = 0, xB = W) => {
    for (let u = uA; u < uB; u += 1)
      for (let x = xA; x < xB - 4; x += 1) {
        const w = 6 + Math.floor(rand() * 6);
        const h = 6 + Math.floor(rand() * 4);
        if (!fm.boxFree(x, u, w, h)) continue;
        fm.claim(x - 1, u - 1, w + 2, h + 2);
        const garden = rand() < 0.45;
        house(x + 0.5, u + (garden ? 2.4 : 0.5), w - 1.5, h - (garden ? 3.8 : 2), { tile: pick(TILE), s: Math.floor(rand() * 1e6) });
        if (garden) fill(x + 0.5, u + 0.3, x + w - 1, u + 2.2, (xx, uu, X, Y) => shade(0x6a7a44, 0.9 + hashPx(X, Y, 27) * 0.14));
        if (rand() < 0.4) ume(x + w - 1.6, u + h - 1.4, 1.6, pick(UME_COL), { bloom: 0.6 });
        else if (rand() < 0.5) tree('broadleaf', x + w - 1.4, u + h - 1.2, 1.3);
        if (rand() < 0.25) mark(x + 1, u + 0.2, (X, Y) => { R(X, Y - 2, 4, 2, pick([0xc8c8c8, 0x3a4a6a, 0xa83a3a, 0xf0ece4])); R(X, Y - 2, 4, 1, 0x8ab0c8); });
        x += w + 1;
      }
    for (let u = uA; u < uB; u += 1)
      for (let x = xA; x < xB - 3; x += 1) {
        if (!fm.boxFree(x, u, 3, 3)) continue;
        fm.claim(x, u, 3, 3);
        const r = rand();
        if (r < 0.4) tree(pick(['tiny', 'broadleaf']), x + 1.5, u + 1.5, 1 + rand() * 0.5);
        else if (r < 0.55) fill(x + 0.3, u + 0.3, x + 2.7, u + 2.7, (xx, uu, X, Y) => (Y % 2 ? 0x6a8a3a : 0x6a5038)); // a vegetable plot
        else if (r < 0.65) house(x + 0.4, u + 0.4, 2.2, 2.2, { tile: pick([0x7a7e86, 0x8a5a3a]), face: 1, s: Math.floor(rand() * 1e6) });
        x += 2;
      }
  };
  return { fm, fill, ume, fields, woods, homes, nearRoad };
}

export function dazaifuKita(ctx) {
  const { kit, plot, props, W, near } = ctx;
  const { house, building, mark, rand, pick, P, R, FX, FY, queue, shadowBox, person, crowd, tree, trafficOn, hi, glint } = kit;
  const { torii, toro } = makeParts(ctx);
  const { fm, fill, ume, fields, woods, homes, nearRoad } = landKit(ctx, U0, U1);
  const road = (id) => ROADS.find((r) => r.id === id);
  const ground_ = (id) => GROUNDS.find((g) => g.id === id);
  const inPlot = (id, x, u, pad = 2) => {
    const p = plot(id);
    return x > p.x - pad && x < p.x + p.w + pad && u > p.u - pad && u < p.u + p.h + pad;
  };

  // ---- the plum groves going on behind the shrine: gravel paths out to the old road, the trees in their colours in
  // clumps, old ones fenced, people with cameras and on mats
  const GROVES = ['umeen_w', 'umeen_n'].map(ground_);
  const PATHS = [
    [[30, 5758], [26, 5800], [34, 5860], [30, 5926]],
    [[100, 5740], [90, 5790], [96, 5846], [88, 5892], [88, 5926]],
    [[34, 5860], [52, 5850], [70, 5830], [90, 5790]],
  ];
  const nearPath = (x, u, d) => PATHS.some((pts) => near(pts, x, u).d < d);
  const groveAt = (x, u) => GROVES.some((g) => inShape(g, x, u)) || (x >= 50 && x < 54 && u < 5892);
  for (const pts of PATHS)
    for (let i = 0; i + 1 < pts.length; i++)
      for (let t = 0; t <= 1; t += 0.05) fm.claim(pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t - 1.8, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t - 1.8, 3.6, 3.6); // (the paths kept clear out to the road)
  fill(0, U0, 128, 5926, (x, u, X, Y) => {
    const d = Math.min(...PATHS.map((pts) => near(pts, x, u).d));
    if (!groveAt(x, u) && !(d < 1.8 && u > 5880)) return null;
    if (d < 1.4) return shade(0xc8bca6, 0.94 + hashPx(X, Y, 13) * 0.08); // gravel
    if (d < 1.8) return 0x8a8270;
    return null;
  });
  for (let u = 5762; u < 5908; u += 6.4)
    for (let x = 2; x < 126; x += 6.6) {
      const [tx, tu] = [x + (hashPx(x, u, 1) - 0.5) * 3.6, u + (hashPx(x, u, 2) - 0.5) * 3.2];
      if (!groveAt(tx, tu) || nearPath(tx, tu, 3.2) || tu > 5904) continue;
      const c = UME_COL[Math.floor(hashPx(Math.floor(tx / 18), Math.floor(tu / 16), 21) * UME_COL.length)];
      const old = hashPx(tx, tu, 3) < 0.14;
      ume(tx, tu, 2.6 + hashPx(tx, tu, 5) * 1.1, c, { old, weeping: !old && hashPx(tx, tu, 4) < 0.1, bloom: 1 });
      if (old)
        mark(tx, tu - 0.4, (X, Y) => {
          for (let i = -6; i <= 6; i += 2) for (const j of [0, -9]) P(X + i, Y + j, 0xc8b070); // its bamboo fence
          for (let j = -9; j <= 0; j += 2) for (const i of [-6, 6]) P(X + i, Y + j, 0xb8a060);
          R(X + 3, Y - 2, 2, 1, 0xf4f0e4); // the tag with its variety
        });
    }
  for (let k = 0; k < 16; k++) {
    const pts = PATHS[k % PATHS.length];
    const seg = Math.floor(hashPx(k, 7, 43) * (pts.length - 1));
    const t = hashPx(k, 8, 43);
    const [[ax, au], [bx, bu]] = [pts[seg], pts[seg + 1]];
    mark(ax + (bx - ax) * t, au + (bu - au) * t, (X, Y) => {
      person(X, Y, 27300 + k);
      if (k % 2) P(X + 2, Y + 1, 0x1a1a1e); // a camera
    });
  }
  for (const [x, u, c] of [[14, 5790, 0xe0b030], [62, 5812, 0x3a6ab0], [112, 5870, 0x5a8a4a], [40, 5880, 0x3a6ab0]])
    mark(x, u, (X, Y) => {
      R(X - 5, Y - 3, 11, 6, c); // a mat
      R(X - 5, Y - 3, 11, 1, shade(c, 1.2));
      for (let q = 0; q < 3; q++) person(X - 4 + q * 3, Y - 3 + (q % 2), 27400 + X + q);
    });
  const walker = (c) => kit.frame(1, 1.67, 5800, (put) => {
    for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (!(j === 0 && i !== 1)) put(i, j, j === 0 ? 0x2a2228 : j === 1 && i === 1 ? 0xe8b890 : j < 4 ? c : 0x2a2a30);
  });
  const walkers = [0x2a2a30, 0x8a6a4a, 0xe8e4d8, 0x3a4a6a, 0xa83a3a, 0xd8b090].map(walker);
  props.path(PATHS[1], walkers, { sp: 1.3, n: 4, gap: 30, mode: 'pp', hold: 4, turn: 'none', s0: 0.2 });
  props.path(PATHS[0], walkers, { sp: 1.2, n: 3, gap: 40, mode: 'pp', hold: 5, turn: 'none', s0: 0.6 });

  // ---- the wooded hill east of the groves: the walk from the shrine climbing into it, going in through its tunnel
  // (the portals lit in the colours of a rainbow) and coming out under the museum; camphors, broadleaf, a few cedars
  const niji = road('niji_michi').pts;
  const [T0, T1] = [5800, 5846]; // (the stretch of the walk under the hill)
  const onTunnel = (x, u) => u > T0 && u < T1 && near(niji, x, u).d < 2.4;
  fill(122, T0, 160, T1, (x, u, X, Y) => (onTunnel(x, u) ? shade(0x26341e, 0.9 + hashPx(X >> 1, Y >> 1, 33) * 0.2) : null)); // (the hill over it)
  for (const [u, dir] of [[T0, 1], [T1, -1]]) {
    const n = near(niji, 0, u); void n;
    const x = niji.reduce((best, p, i) => (i && niji[i - 1][1] <= u && p[1] >= u ? niji[i - 1][0] + ((p[0] - niji[i - 1][0]) * (u - niji[i - 1][1])) / (p[1] - niji[i - 1][1]) : best), niji[0][0]);
    mark(x, u, (X, Y) => {
      const RAIN = [0xe04040, 0xf09030, 0xf0d040, 0x50b050, 0x4080d0, 0x7050b0];
      R(X - 6, Y - (dir > 0 ? 3 : 0), 13, 3, 0x7a766c); // the portal's concrete
      for (let i = 0; i < 6; i++) R(X - 5 + i * 2, Y - (dir > 0 ? 2 : 1), 2, 2, RAIN[i]); // the light inside
    });
  }
  woods(124, 5760, W, 5880, 12, (x, u) => near(niji, x, u).d < 3 || inPlot('kyokusui', x, u, 3), ['broadleaf', 'broadleaf', 'broadleaf', 'cedar']);

  // ---- the museum on its hill: the woods all round, a lawn before it, the lane up to its car park, and its long
  // roof of glass rising and falling in waves, the sky and the trees in it, ribs of white steel across
  const MU = plot('hakubutsukan_k');
  const hill = ground_('hakubutsukan_yama').rect;
  fill(MU.x - 4, MU.u - 10, MU.x + MU.w + 2, MU.u + MU.h + 4, (x, u, X, Y) => ((fm.taken(x, u) && !inShape(ground_('hakubutsukan_yama'), x, u)) || nearRoad(x, u, 0.6) || near(niji, x, u).d < 1.8 ? null : shade(0x6e7e44, 0.92 + hashPx(X >> 1, Y >> 1, 35) * 0.12))); // its lawns
  {
    const [px, pu, pw, ph] = [130, 5940, 16, 17];
    fill(px, pu, px + pw, pu + ph, (x, u, X, Y) => ((X - FX(px)) % 9 === 0 && (u - pu) % 6 > 1 ? 0xd8d8d0 : shade(0x56585e, 0.97 + hashPx(X, Y, 24) * 0.05))); // the car park
    for (let k = 0; k < 8; k++)
      if (hashPx(k, 4, 36) < 0.7 && Math.abs(px + 1 + (k % 4) * 3.2 + 1 - 142) > 2.4)
        mark(px + 1 + (k % 4) * 3.2, pu + 3 + Math.floor(k / 4) * 9, (X, Y) => {
          R(X, Y - 5, 5, 6, [0xe8e4dc, 0x2a2a30, 0x8a9aa8, 0xa83a3a, 0xf0ece4][k % 5]);
          R(X, Y - 4, 5, 1, 0x8ab0c8);
          hi.tint(X + 5, Y - 4, 0.7);
        });
    crowd(px + 2, pu + ph - 2, pw - 4, 3, 8);
  }
  {
    const [X0, X1, YT, YB] = [FX(MU.x), FX(MU.x + MU.w), FY(MU.u + MU.h), FY(MU.u)];
    const wave = (i) => Math.sin((i / (X1 - X0)) * Math.PI * 3.2 + 0.6);
    queue(YB, () => {
      for (let Y = YT; Y < YB; Y++)
        for (let X = X0; X < X1; X++) {
          const i = X - X0;
          const j = Y - YT;
          // the roof rising and falling across in three long swells: the faces turned west to the low sun bright,
          // the ones turned away in shade with the woods mirrored in them, the glazing's frames fine and pale
          const ph = (i / (X1 - X0)) * Math.PI * 3.2 + 0.6 + (j / (YB - YT)) * 0.5;
          // its outline: the eaves rising and falling with the swells, the ends rounded
          const ph0 = (i / (X1 - X0)) * Math.PI * 3.2 + 0.6;
          const eave = Math.round(4 * (1 - Math.sin(ph0)));
          const [ci, cj] = [Math.min(i, X1 - X0 - 1 - i), Math.min(j - eave, YB - YT - 1 - eave - j)];
          if (cj < 0 || (ci < 10 && (10 - ci) ** 2 + Math.max(0, 10 - cj) ** 2 > 100)) continue;
          const rim = cj < 2 || ci < 1 || (ci < 10 && (10 - ci) ** 2 + Math.max(0, 10 - cj) ** 2 > 70);
          const slope = Math.cos(ph);
          const TONES = [0x2e5068, 0x3e6680, 0x5a86a0, 0x7aa8c0, 0xa0c8dc, 0xd0e4ee];
          let c = TONES[Math.max(0, Math.min(5, Math.round((slope + 1) * 2.5 + (hashPx(X, Y, 37) - 0.5) * 0.6)))];
          if (slope < -0.5 && fbm(X / 3, Y / 3, { seed: 38, scale: 4, octaves: 2 }) > 0.55) c = shade(0x3a5a48, 1 + (slope + 1) * 0.3); // the woods in it
          if (slope > 0.85 && hashPx(X >> 1, Y, 39) < 0.25) c = 0xfff4e0; // the sun caught on it
          if (Math.abs(Math.sin(ph)) > 0.995) c = 0xe8eef2; // the crest of a swell
          if (j % 12 === 0 && hashPx(i, j, 40) < 0.7) c = shade(c, 1.15); // the frames, faint
          if (rim) c = 0xd8dce0; // its white edge
          P(X, Y, c);
        }
      // the front: a long wall of glass under the roof's edge, the entrance hall
      for (let i = 2; i < X1 - X0 - 2; i++) for (let j = 0; j < 5; j++) P(X0 + i, YB - 5 + j, j === 4 ? 0x2a2a30 : i % 6 === 0 ? 0xc8ccd0 : 0x3a5a70);
    }, () => shadowBox(X0, YT, X1 - X0, YB - YT, 12, 0.6));
  }
  woods(hill[0], hill[1], W, hill[1] + hill[3], 11, (x, u) => inPlot('hakubutsukan_k', x, u, 6) || (x > 128 && x < 149 && u > 5936 && u < 5960) || near(niji, x, u).d < 3, ['broadleaf', 'broadleaf', 'cedar', 'broadleaf']);
  // the walk from the tunnel on up to the museum: people on it both ways
  props.path(niji.slice(1), walkers, { sp: 1.3, n: 3, gap: 30, mode: 'pp', hold: 6, turn: 'none', s0: 0.4 });

  // ---- the old road with the houses along it, cars; the lanes up to the fields and to Kanzeon-ji
  trafficOn(road('dazaifu_kaido').pts, { sp: 10, gap: 70, s0: rand() });
  trafficOn(road('kanzeonji_michi').pts, { sp: 6, gap: 90, s0: rand() });
  trafficOn([[118, 5930], [118, 6230], [W, 6230]], { sp: 6, gap: 120, s0: rand() });
  homes(5890, 6040, 0, 126);
  for (const u of [6046, 6120]) for (let x = 121; x < 127; x += 3) tree('broadleaf', x, u + rand() * 60, 1.6); // (trees between the lane and the hill)

  // ---- the fields after winter, the hamlets round them
  const tb = ground_('tanbo_d').rect;
  fields(tb[0], tb[1], tb[0] + tb[2], tb[1] + tb[3], 27500);
  mark(tb[0] + tb[2] - 6, tb[1] + 4, (X, Y) => { R(X, Y - 8, 10, 8, 0x6a6a70); R(X, Y - 8, 10, 2, 0x8a8a90); hi.tint(X + 10, Y - 7, 0.7); }); // a shed of corrugated iron
  homes(6170, 6232, 126, W);
  homes(6206, 6232, 0, 120);

  // ---- Kanzeon-ji's grounds: gravel and moss under great camphors, its hall, the bell tower with its old bell, the
  // Kaidan-in, stone lanterns, a few people walking quietly
  const KZ = ground_('kanzeonji_keidai').rect;
  fill(KZ[0], KZ[1], KZ[0] + KZ[2], KZ[1] + KZ[3], (x, u, X, Y) => {
    const moss = fbm(x, u, { seed: 53, scale: 7, octaves: 3 }) > 0.56;
    const walk = Math.abs(x - 55) < 1.6 || (Math.abs(u - 6278) < 1.4 && x > 55 && x < 90) || (Math.abs(x - 90) < 1.4 && u < 6252);
    if (walk) return (Y % 6 === 0 || (X + (Math.floor(Y / 6) % 2) * 3) % 6 === 0) ? 0x8a867c : shade(0xb0aca2, 0.96 + hashPx(X, Y, 41) * 0.06); // stone walks to the hall and the Kaidan-in
    return moss ? shade(0x56703a, 0.9 + hashPx(X >> 1, Y >> 1, 38) * 0.14) : shade(0xc8c0ac, 0.95 + hashPx(X, Y, 39) * 0.07);
  });
  {
    const p = plot('kanzeonji');
    house(p.x + 2, p.u + 4, p.w - 10, p.h - 8, { tile: 0x4e5058, wall: 0x6a4a34, face: 2.6, s: 27601 }); // the hall
    // the bell tower: a square roof on four posts, the great bell hanging under it
    const [bx, bu] = [p.x + p.w - 5, p.u + 5];
    house(bx - 3, bu, 6, 6, { tile: 0x4e5058, wall: 0x6a4a34, face: 2.8, s: 27602 });
    mark(bx, bu - 0.4, (X, Y) => { R(X - 2, Y - 6, 5, 5, 0x3a4a3a); R(X - 1, Y - 6, 3, 1, 0x5a7a5a); }, bu); // the old bronze, green with age, showing under its roof
    crowd(p.x + 2, p.u + 1, p.w - 4, 3, 4);
  }
  {
    const p = plot('kaidanin');
    fill(p.x + 1, p.u + 1, p.x + p.w - 1, p.u + p.h - 1, (x, u, X, Y) => shade(0xc8c0ac, 0.95 + hashPx(X, Y, 40) * 0.07));
    house(p.x + 3, p.u + 4, p.w - 6, p.h - 7, { tile: 0x5e4636, wall: 0x7a5a40, face: 2.4, s: 27611 }); // under cypress bark
    torii(p.x + 7.6, p.x + 12.4, p.u + 1.6, 0x9a968c, 2.6);
  }
  for (const [x, u] of [[34, 6244], [74, 6244], [106, 6290], [34, 6296]]) toro(x, u);
  for (const [x, u, r] of [[26, 6262, 6], [116, 6266, 6.6], [72, 6296, 5.4], [8, 6282, 5], [150, 6270, 6], [170, 6250, 4.6], [134, 6292, 5], [36, 6292, 4.6], [104, 6246, 4], [78, 6280, 3.6], [100, 6280, 4.2]]) tree('broadleaf', x, u, r); // the camphors
  crowd(52, 6250, 8, 30, 5);
  for (const [x, u] of [[44, 6284], [64, 6286]]) mark(x, u, (X, Y) => { R(X - 4, Y - 1, 9, 2, 0x8a6a4a); person(X - 2, Y - 4, 27650 + X); }); // a bench, someone resting
  woods(0, 6236, 28, 6300, 14, (x, u) => fm.taken(x, u));
  woods(112, 6236, W, 6300, 14, (x, u) => fm.taken(x, u));

  // ---- beyond: a hamlet by the lane, fields on both sides of it out towards the ruins
  fm.claim(0, 6366, 58, 140);
  fm.claim(62, 6426, W - 62, 80);
  homes(6300, 6420, 64, W);
  homes(6300, 6362, 0, 58);
  fields(2, 6366, 56, 6500, 27700);
  fields(64, 6426, W, 6500, 27800);
  trafficOn(road('kanzeonji_2').pts, { sp: 6, gap: 100, s0: rand() });

  void building; void glint; void VERMILION; void pick;
}

