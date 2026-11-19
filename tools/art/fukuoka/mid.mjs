// Fukuoka's middle layer (docs/plan-fukuoka.md): the skeleton of the whole route, painted from route.mjs - the
// ground of each stretch and its own grounds (the beach, the parks, the castle's stone terraces, the shrines' gravel
// and woods, the airport's concrete and runway, the fields after winter, the plum gardens, the ruins' lawn and the
// earthwork's bank), the bay and the rivers cut out to the far layer (sand along the bay, stone embankments along
// the rivers), the roads and paths, the expressway on its piers, the arcade's roof, the railways and the
// shinkansen's viaduct, and the plots the landmarks will stand on (hatched until their stretch is drawn). Then the
// strip is graded for the time of day, from night to sunset. The stretches' own files come in through PAINTERS,
// each given the context this file builds.
//
// Coordinates: x across, u up from the strip's bottom; a fine pixel is a third of a logical one.
import { fbm } from '../../lib/raster.mjs';
import { HiCanvas, hashPx } from '../hires.mjs';
import { todGrade, tintTable, PropKit } from '../props.mjs';
import { makeKit } from '../tokyo/kit.mjs';
import { W, S, L, SECTIONS, ARENAS, TOD, WATER, GROUNDS, ROADS, RAILS, PLOTS, isSea, bayShore } from './route.mjs';
import { near, inShape, bbox, railHalf } from '../tokyo/geom.mjs';
import { momochi } from './momochi.mjs';
import { ohori } from './ohori.mjs';
import { nakasu } from './nakasu.mjs';
import { hakata } from './hakata.mjs';

// the stretches' painters, in the order they are called: (ctx) => void
const PAINTERS = [momochi, ohori, nakasu, hakata];
// (the stretches drawn so far: their plots are not hatched)
const DRAWN = [[0, 3800]];
// arenas with no ring (once their own ground is drawn)
const ARENA_DRAWN = new Set();

const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const shade = (c, f) => {
  const k = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
  return (k((c >> 16) & 255) << 16) | (k((c >> 8) & 255) << 8) | k(c & 255);
};

const GROUND = {
  beach: [0xcdbb8c, 0xd8c89a, 0xe2d4a8],
  park: [0x6a7a44, 0x76864c, 0x828e54], // lawns at winter's end, the green only coming back
  forest: [0x26341e, 0x2e3c22, 0x364626], // the wood's floor in shade
  gravel: [0xb0a690, 0xbcb29c, 0xc6bca6],
  plaza: [0x9c988f, 0xa8a49a, 0xb2aea4],
  stone: [0x5e6a3e, 0x667244, 0x6e7a4a, 0x5a5650], // the castle's terraces: grass on top of its walls, a wall's shadow at each step
  apron: [0xa4a49e, 0xaeaea8, 0xb8b8b2],
  runway: [0x55575c, 0x5c5e63, 0x64666a],
  field: [0x7a6a4a, 0x847250, 0x8c7a56, 0x9aa040], // paddies after winter: stubble and mud, rape in flower on the bunds
  ume: [0x6a6a44, 0x74744a, 0x7e7e50], // a plum garden's moss and grass (the trees come with the stretch)
  ruins: [0x7a8a4a, 0x86964e, 0x92a256], // the ruins' lawn
  dorui: [0x5e7038, 0x687a3e, 0x728444, 0x4c5a2c], // the earthwork's bank: grass on its slope, its rammed layers showing
};
const PAINTED = [0x2a4c4a, 0x325854, 0x3c645c, 0x4a7066]; // ponds and moats: green, still
const SAND = [0xbca878, 0xc8b484, 0xd4c090]; // the wet sand along the bay
const SIDEWALK = 0xa9a59c;
const KERB = 0x7e7a72;
const SURFACE = { avenue: 0x45474f, street: 0x4a4c54, lane: 0x5c5c62, bridge: 0x56585e, express: 0x4c4e56, arcade: 0x8c8a86, taxi: 0x8e8e8a };

export function buildMid() {
  const img = new HiCanvas(W, L, S);
  const FW = W * S;
  const FH = L * S;
  const wet = new Uint8Array(FW * FH); // 1: the bay (cut out), 2: painted water, 4: a river (cut out; stone embankments)
  /** Paint the box (x0, u0)-(x1, u1) a fine pixel at a time: fn(x, u, X, Y) -> a colour, or null to leave it. */
  const paint = (x0, u0, x1, u1, fn) => {
    const XA = Math.max(0, Math.floor(x0 * S));
    const XB = Math.min(FW, Math.ceil(x1 * S));
    const YA = Math.max(0, Math.floor((L - u1) * S));
    const YB = Math.min(FH, Math.ceil((L - u0) * S));
    for (let Yy = YA; Yy < YB; Yy++)
      for (let X = XA; X < XB; X++) {
        const c = fn((X + 0.5) / S, L - (Yy + 0.5) / S, X, Yy);
        if (c !== null && c !== undefined) img.hi.set(X, Yy, c);
      }
  };
  const fill = (shape, fn) => paint(...bbox(shape), (x, u, X, Yy) => (inShape(shape, x, u) ? fn(x, u, X, Yy) : null));
  const ramp = (cols, x, u, seed, scale = 9) => cols[Math.min(cols.length - 1, Math.floor(fbm(x, u, { seed, scale, octaves: 2 }) * cols.length + (hashPx(x * S, u * S, seed) - 0.5) * 0.9))] ?? cols[0];

  // ---- the ground of each stretch: what is left between everything else (across a border it turns into the next
  // one's over BLEND units, so no line shows between the blocks)
  const BLEND = 60;
  const mixC = (a, b, t) => {
    const k = (sh) => Math.round(((a >> sh) & 255) + (((b >> sh) & 255) - ((a >> sh) & 255)) * t);
    return (k(16) << 16) | (k(8) << 8) | k(0);
  };
  SECTIONS.forEach(([from, to, , , ground], i) => {
    const [prev, next] = [SECTIONS[i - 1]?.[4], SECTIONS[i + 1]?.[4]];
    const at = (u) => (prev !== undefined && u - from < BLEND ? mixC(ground, prev, 0.5 - (u - from) / (2 * BLEND)) : next !== undefined && to - u < BLEND ? mixC(ground, next, 0.5 - (to - u) / (2 * BLEND)) : ground);
    paint(0, from, W, to, (x, u, X, Yy) => shade(at(u), 0.95 + fbm(x, u, { seed: 31, scale: 22, octaves: 2 }) * 0.1 + (hashPx(X, Yy, 3) - 0.5) * 0.03));
  });

  const ground = (g) => fill(g, (x, u, X, Yy) => {
    wet[Yy * FW + X] = 0;
    if (g.kind === 'stone') return ((u + 2 * Math.sin(x / 7)) % 26 + 26) % 26 < 1 ? GROUND.stone[3] : ramp(GROUND.stone.slice(0, 3), x, u, 48, 6); // terraces, a wall at each
    if (g.kind === 'field') return Math.floor(u) % 22 < 1 || Math.floor(x) % 30 < 1 ? GROUND.field[3] : ramp(GROUND.field.slice(0, 3), x, u, 47, 5); // the bunds in rape flower
    if (g.kind === 'dorui') return Math.floor(u * S) % 7 < 1 ? GROUND.dorui[3] : ramp(GROUND.dorui.slice(0, 3), x, u, 49, 4); // its rammed layers
    if (g.kind === 'runway') {
      const dx = Math.abs(x - (g.rect[0] + g.rect[2] / 2));
      if (dx < 0.34 && Math.floor(u) % 12 < 6) return 0xe8e8e0; // the centre line
      if (dx > g.rect[2] / 2 - 1 && dx < g.rect[2] / 2 - 0.5) return 0xe8e8e0; // its edges
    }
    return ramp(GROUND[g.kind], x, u, 41);
  });
  for (const g of GROUNDS) if (!g.over) ground(g);

  // ---- the water: the sea open to the far layer; ponds painted
  paint(0, 0, W, L, (x, u, X, Yy) => {
    if (!isSea(x, u)) return null;
    wet[Yy * FW + X] = u < bayShore(x) + 1 ? 1 : 4; // (the rivers between stone embankments)
    img.hi.clear(X, Yy);
    return null;
  });
  const water = (w) => fill(w, (x, u, X, Yy) => {
    wet[Yy * FW + X] = 2;
    return ramp(PAINTED, x * 0.6, u, 57, 7);
  });
  for (const w of WATER) water(w);
  for (const g of GROUNDS) if (g.over) ground(g);
  // the edges: wet sand along the bay, stone embankments along the rivers and round the ponds
  {
    const edge = [];
    for (let Yy = 0; Yy < FH; Yy++)
      for (let X = 0; X < FW; X++) {
        if (wet[Yy * FW + X]) continue;
        let by = 0;
        for (let k = 1; k <= 3 && !by; k++) by = (X >= k && wet[Yy * FW + X - k]) || (X + k < FW && wet[Yy * FW + X + k]) || (Yy >= k && wet[(Yy - k) * FW + X]) || (Yy + k < FH && wet[(Yy + k) * FW + X]);
        if (by) edge.push([Yy * FW + X, by]);
      }
    for (const [i, kind] of edge) {
      const X = i % FW;
      const Yy = Math.floor(i / FW);
      img.hi.set(X, Yy, kind !== 1 ? ((X + Yy) % 10 === 0 ? 0x4a4640 : shade(0x9a948a, 0.88 + hashPx(X >> 1, Yy, 9) * 0.2)) : SAND[Math.floor(hashPx(X, Yy, 9) * 3)]);
    }
  }

  /** Paint along a line: fn(n, x, u, X, Y) gets the nearest point of the line (geom.mjs: near) within `reach`. */
  const along = (pts, reach, fn) => {
    for (let i = 0; i + 1 < pts.length; i++) {
      const [a, b] = [pts[i], pts[i + 1]];
      paint(Math.min(a[0], b[0]) - reach, Math.min(a[1], b[1]) - reach, Math.max(a[0], b[0]) + reach, Math.max(a[1], b[1]) + reach, (x, u, X, Yy) => {
        const n = near(pts, x, u);
        return n.d <= reach ? fn(n, x, u, X, Yy) : null;
      });
    }
  };

  // ---- the roads and paths: every edge first, then every surface, then the lines, so that crossings join cleanly
  const edgeOf = (r) => {
    const walk = r.cls === 'avenue' ? 2 : r.cls === 'street' ? 1.34 : 0;
    if (walk) along(r.pts, r.w / 2 + walk, (n, x, u, X, Yy) => (n.d > r.w / 2 + walk - 0.34 ? KERB : shade(SIDEWALK, 0.96 + hashPx(X, Yy, 5) * 0.08)));
  };
  const surface = (r) => {
    const half = r.w / 2;
    if (r.cls === 'walk')
      along(r.pts, half, (n, x, u, X, Yy) => shade(0xb9b1a0, (Math.floor(n.along * S) % 6 === 0 ? 0.86 : 0.97) + hashPx(X, Yy, 7) * 0.06));
    else if (r.cls === 'deck')
      along(r.pts, half, (n, x, u, X, Yy) => shade(0x9a7a52, (Math.floor(n.along * S) % 3 === 0 ? 0.84 : 1) + hashPx(X, Yy, 13) * 0.06));
    else if (r.cls === 'arcade')
      // its roof of clear panels on a steel frame, a ridge down the middle
      along(r.pts, half, (n, x, u, X, Yy) => (Math.abs(n.side) < 0.34 ? 0x6a6c70 : Math.floor(n.along * S) % 9 === 0 || n.d > half - 0.5 ? 0x7a7c80 : shade(0xb8c0c4, 0.96 + hashPx(X, Yy, 17) * 0.06)));
    else if (r.cls === 'express') {
      // raised on piers: its shadow on what is under it, the deck, parapets
      along(r.pts.map(([x, u]) => [x + 4, u - 4]), half, (n, x, u, X, Yy) => {
        if (img.hi.alpha(X, Yy) && !wet[Yy * FW + X]) img.hi.tint(X, Yy, 0.72);
        return null;
      });
      along(r.pts, half, (n, x, u, X, Yy) => (n.d > half - 0.67 ? 0xd0ccc4 : shade(SURFACE.express, 0.96 + hashPx(X, Yy, 15) * 0.08)));
    } else
      along(r.pts, half, (n, x, u, X, Yy) => {
        if (r.cls === 'bridge' && n.d > half - 0.67) return 0xd0ccc4; // its parapets
        return shade(SURFACE[r.cls], 0.96 + hashPx(X, Yy, 15) * 0.08);
      });
  };
  const lines = (r) => {
    if (r.cls === 'taxi') return along(r.pts, r.w / 2, (n) => (Math.abs(n.side) < 0.3 ? 0xe0c040 : null)); // a taxiway's yellow line
    if (r.cls !== 'avenue' && r.cls !== 'street' && r.cls !== 'bridge' && r.cls !== 'express') return;
    along(r.pts, r.w / 2 - 1, (n) => {
      const dash = Math.floor(n.along * S) % 18 < 10;
      if (Math.abs(n.side) < 0.17) return r.cls === 'street' ? (dash ? 0xd8d4c4 : null) : 0xe0c466; // the centre line
      return null;
    });
  };
  const low = ROADS.filter((r) => r.cls !== 'express');
  for (const r of low) edgeOf(r);
  for (const r of low) surface(r);
  for (const r of low) lines(r);

  // ---- the railways (ballast, sleepers, rails); the shinkansen on its viaduct (a concrete deck with parapets, its
  // shadow on what is under it)
  for (const r of RAILS) {
    if (r.style === 'viaduct') {
      const vh = railHalf(r);
      along(r.pts.map(([x, u]) => [x + 3, u - 4]), vh, (n, x, u, X, Yy) => {
        if (img.hi.alpha(X, Yy) && !wet[Yy * FW + X]) img.hi.tint(X, Yy, 0.72);
        return null;
      });
      along(r.pts, vh, (n, x, u, X, Yy) => {
        if (n.d > vh - 0.67) return 0xc8c4bc; // its parapets
        const s = n.side + (r.tracks - 1) * 2.5;
        const t = Math.abs(s - Math.round(s / 5) * 5);
        if (Math.round(t * S) === 3) return 0xd0d4d8;
        if (t <= 1.7 && Math.floor(n.along * S) % 3 === 0) return 0x8a8680; // slab track
        return shade(0xa8a49c, 0.95 + hashPx(X, Yy, 21) * 0.08);
      });
      continue;
    }
    const half = railHalf(r);
    along(r.pts, half, (n, x, u, X, Yy) => {
      const s = n.side + (r.tracks - 1) * 2.5;
      const t = Math.abs(s - Math.round(s / 5) * 5);
      if (Math.round(t * S) === 3) return 0xd0d4d8; // a rail
      if (t <= 1.7 && Math.floor(n.along * S) % 4 === 0) return 0x4c4238; // a sleeper
      return [0x7a7068, 0x6c645c, 0x857b72][Math.floor(hashPx(X, Yy, 19) * 3)]; // ballast
    });
  }

  // ---- the expressway over everything it crosses
  for (const r of ROADS.filter((q) => q.cls === 'express')) {
    surface(r);
    lines(r);
  }

  // ---- the plots the landmarks will stand on: hatched, edged (a low one paler)
  for (const [, x, u, w, h, , low] of PLOTS.filter((q) => !DRAWN.some(([a, b]) => q[2] >= a && q[2] < b)))
    paint(x, u, x + w, u + h, (px, pu, X, Yy) => {
      const rim = px - x < 0.67 || x + w - px < 0.67 || pu - u < 0.67 || u + h - pu < 0.67;
      if (rim) return 0x34303a;
      return (X + Yy) % 9 < 2 ? (low ? 0xa49e92 : 0x9a9488) : low ? 0xd2ccc0 : 0xc2bcb0;
    });

  // ---- the arenas: a dashed ring until their own ground is drawn
  for (const [ax, au, name, r] of ARENAS)
    if (!ARENA_DRAWN.has(name)) paint(ax - r - 1, au - r - 1, ax + r + 1, au + r + 1, (x, u) => {
      const d = Math.hypot(x - ax, u - au);
      return Math.abs(d - r) < 0.5 && Math.floor(((Math.atan2(u - au, x - ax) + Math.PI) / (Math.PI * 2)) * 72) % 2 === 0 ? 0xffd040 : null;
    });

  // ---- the stretches. What they may build on: the ground that nothing of the route takes (occ: a logical pixel is
  // 1 where there is water, a road with its pavements, tracks, a ground of its own kind or a plot).
  const occ = new Uint8Array(W * L);
  const take = (x0, u0, x1, u1, test) => {
    for (let u = Math.max(0, Math.floor(u0)); u < Math.min(L, Math.ceil(u1)); u++) for (let x = Math.max(0, Math.floor(x0)); x < Math.min(W, Math.ceil(x1)); x++) if (!occ[u * W + x] && test(x + 0.5, u + 0.5)) occ[u * W + x] = 1;
  };
  for (let u = 0; u < L; u++) for (let x = 0; x < W; x++) if (wet[((L - 1 - u) * S + 1) * FW + x * S + 1]) occ[u * W + x] = 1;
  for (const r of ROADS) {
    const reach = r.w / 2 + (r.cls === 'avenue' ? 2.6 : r.cls === 'street' ? 2 : 0.8);
    for (let i = 0; i + 1 < r.pts.length; i++) {
      const [a, b] = [r.pts[i], r.pts[i + 1]];
      take(Math.min(a[0], b[0]) - reach, Math.min(a[1], b[1]) - reach, Math.max(a[0], b[0]) + reach, Math.max(a[1], b[1]) + reach, (x, u) => near(r.pts, x, u).d <= reach);
    }
  }
  for (const r of RAILS) {
    const reach = railHalf(r) + 1;
    for (let i = 0; i + 1 < r.pts.length; i++) {
      const [a, b] = [r.pts[i], r.pts[i + 1]];
      take(Math.min(a[0], b[0]) - reach, Math.min(a[1], b[1]) - reach, Math.max(a[0], b[0]) + reach, Math.max(a[1], b[1]) + reach, (x, u) => near(r.pts, x, u).d <= reach);
    }
  }
  for (const g of GROUNDS) take(...bbox(g), (x, u) => inShape(g, x, u));
  for (const [, x, u, w, h] of PLOTS) take(x - 1, u - 1, x + w + 1, u + h + 1, () => true);
  /** The free ground between u0 and u1 as boxes [x, u, w, h], each at least minW x minH (taken once given out);
   * skew: beside a road or track that runs aslant (tools/art/tokyo/mid.mjs). */
  const blocks = (u0, u1, minW = 8, minH = 8, skew = false) => {
    const out = [];
    if (skew) {
      // (beside streets that run aslant: from each free run the largest box up from it, narrowing as the ground does)
      for (let u = u0; u < u1; u++)
        for (let x = 0; x < W; x++) {
          if (occ[u * W + x]) continue;
          let w = 0;
          while (x + w < W && !occ[u * W + x + w]) w++;
          let [a, b] = [x, x + w];
          let best = null;
          for (let h = 1; u + h - 1 < u1; h++) {
            const row = (u + h - 1) * W;
            if (h > 1) {
              let [ba, bb] = [0, 0];
              for (let i = a; i < b; i++) {
                if (occ[row + i]) continue;
                let j = i;
                while (j < b && !occ[row + j]) j++;
                if (j - i > bb - ba) [ba, bb] = [i, j];
                i = j;
              }
              if (bb - ba < minW) break;
              [a, b] = [ba, bb];
            }
            // (the squarest wins, then the larger: never a sliver the whole length of the street)
            const [sq, bq] = [Math.min(b - a, h), best ? Math.min(best[2], best[3]) : 0];
            if (!best || sq > bq || (sq === bq && (b - a) * h >= best[2] * best[3] && h <= 2.2 * (b - a))) best = [a, u, b - a, h];
          }
          occ.fill(1, u * W + x, u * W + x + w);
          if (best && best[2] >= minW && best[3] >= minH) {
            for (let j = 0; j < best[3]; j++) occ.fill(1, (u + j) * W + best[0], (u + j) * W + best[0] + best[2]);
            out.push(best);
          }
          x += w - 1;
        }
      return out;
    }
    for (let u = u0; u < u1; u++)
      for (let x = 0; x < W; x++) {
        if (occ[u * W + x]) continue;
        let w = 0;
        while (x + w < W && !occ[u * W + x + w]) w++;
        let h = 1;
        grow: for (; u + h < u1; h++) for (let i = 0; i < w; i++) if (occ[(u + h) * W + x + i]) break grow;
        for (let j = 0; j < h; j++) occ.fill(1, (u + j) * W + x, (u + j) * W + x + w);
        if (w >= minW && h >= minH) out.push([x, u, w, h]);
        x += w - 1;
      }
    return out;
  };
  /** Paint the ground box (x, u, w, h) as a ground of a kind. */
  const pave = (x, u, w, h, kind, seed = 41) => paint(x, u, x + w, u + h, (px, pu) => ramp(GROUND[kind], px, pu, seed));
  const plot = (id) => {
    const p = PLOTS.find((q) => q[0] === id);
    return { x: p[1], u: p[2], w: p[3], h: p[4] };
  };
  const ground_ = (id) => GROUNDS.find((g) => g.id === id);
  const tod = todGrade(TOD, smooth);
  const props = new PropKit(12109, { artScale: S });
  const CLOTH = [0x2a2a30, 0x4a4a58, 0x8a6a4a, 0xe8e4d8, 0x3a4a6a, 0xa83a3a, 0x5a6a4a, 0xd8b090, 0x6a5a7a, 0xc8a050]; // coats and scarves at winter's end
  const kit = makeKit({ img, W, L, S, seed: 12009, props, tod, cloth: CLOTH });
  const covers = []; // boxes of the strip shown again over the moving parts (a station's roof over its train)
  const claim = (x, u, w, h) => {
    for (let j = Math.max(0, Math.floor(u)); j < Math.min(L, u + h); j++) occ.fill(1, j * W + Math.max(0, Math.floor(x)), j * W + Math.min(W, Math.ceil(x + w)));
  };
  const ctx = { near, inShape, isSea, GROUNDS, ROADS, RAILS, GROUND, img, wet, paint, fill, along, ramp, shade, W, S, L, kit, props, tod, blocks, pave, plot, ground: ground_, claim, cover: (x, u, w, h, d = 0.1) => covers.push([x, u, w, h, d]) };
  for (const p of PAINTERS) p(ctx);
  kit.flush();
  kit.beforeGrade();

  // ---- the time of day, a band of the strip at a time
  const BAND = 16 * S;
  for (let Y0 = 0; Y0 < FH; Y0 += BAND) {
    const band = img.hi.crop(0, Y0, FW, Math.min(BAND, FH - Y0));
    tod.frame(band, L - (Y0 + BAND / 2) / S);
    img.hi.data.set(band.data, Y0 * FW * 4);
  }
  kit.afterGrade(); // (the lights: windows, lanterns, lamps, their glow)
  for (const [x, u, w, h, d] of covers) props.loop(x, u + h, [props.frame(img.hi.crop(Math.round(x * S), Math.round((L - u - h) * S), Math.round(w * S), Math.round(h * S)))], { fps: 1, d });
  return { strip: img.hi, props: props.pack(), meta: { width: W, artScale: S, length: L, tint: tintTable(L, tod.white), farTint: true } }; // (farTint: the far water takes the time of day too)
}
