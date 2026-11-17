// Kawaguchiko's middle layer. Phase 1 of docs/plan-kawaguchiko.md: the skeleton of the whole route, painted from
// route.mjs - the ground of each stretch and its own grounds (the shrine's gravel, Oishi's lavender, the lava, Fuji's
// zones of height up to the crater), the lake cut out to the far layer with a pebbly shore, the sea of clouds at the
// summit's sides, the roads, the paths, the trail and the descent, the railway and the ropeway, and the plots the
// landmarks will stand on (hatched until their stretch is drawn). Then the strip is graded for the time of day. The
// stretches' own files (phases 2-5) come in through PAINTERS, each given the context this file builds.
//
// Coordinates: x across, u up from the strip's bottom; a fine pixel is a third of a logical one.
import { fbm } from '../../lib/raster.mjs';
import { HiCanvas, hashPx } from '../hires.mjs';
import { todGrade, tintTable, PropKit } from '../props.mjs';
import { makeKit } from '../tokyo/kit.mjs';
import { fujiyoshida } from './fujiyoshida.mjs';
import { shore } from './shore.mjs';
import { lake } from './lake.mjs';
import { W, S, L, SECTIONS, ARENAS, TOD, WATER, GROUNDS, ROADS, RAILS, PLOTS } from './route.mjs';
import { near, inShape, bbox, railHalf } from '../tokyo/geom.mjs';

// the stretches' painters, in the order they are called: (ctx) => void. (Phases 2-5 add theirs here.)
const PAINTERS = [fujiyoshida, shore, lake];
const DRAWN_TO = 3900;
const ARENA_DRAWN = new Set(['KACHI-KACHI USAGI']); // (arenas whose own ground is drawn: no ring; the lake is the miniboss's) // (the stretches drawn so far reach this far up the strip: their plots are not hatched, the painter lays them out)

const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const shade = (c, f) => {
  const k = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
  return (k((c >> 16) & 255) << 16) | (k((c >> 8) & 255) << 8) | k(c & 255);
};

const GROUND = {
  park: [0x4f7c40, 0x5a8a48, 0x66964e],
  forest: [0x24462a, 0x2e5432, 0x3a643a],
  gravel: [0xb0a690, 0xbcb29c, 0xc6bca6],
  plaza: [0x9c988f, 0xa8a49a, 0xb2aea4],
  sand: [0xcdbb8c, 0xd8c89a, 0xe2d4a8],
  flowers: [0x6a5a9a, 0x7a68b0, 0x8c7cc4, 0x5a7a44], // lavender in rows, the green between
  kochia: [0x5a8a3c, 0x6a9c44, 0x7aac4c],
  lava: [0x2a2622, 0x34302a, 0x3e3a30, 0x4a5a34], // old flows, moss on them
  treeline: [0x4a5a3c, 0x56664a, 0x6a6a52, 0x7a7058], // sparse larch, bare ground between
  scoria: [0x26222a, 0x2e2a30, 0x383238],
  scoria_red: [0x5a3024, 0x6a3a2a, 0x7a4632],
  snow: [0xd8e0ea, 0xe6ecf4, 0xf4f8fc],
  crater: [0x3a2420, 0x4a2c24, 0x5a362a],
};
const PAINTED = [0x24505c, 0x2c5c68, 0x366a74, 0x447a82];
const PEBBLES = [0x9a9282, 0xa8a090, 0xb6ae9c];
const SIDEWALK = 0xa9a59c;
const KERB = 0x7e7a72;
const SURFACE = { avenue: 0x45474f, street: 0x4a4c54, lane: 0x5c5c62, road: 0x4c4e54, bridge: 0x56585e };

export function buildMid() {
  const img = new HiCanvas(W, L, S);
  const FW = W * S;
  const FH = L * S;
  const wet = new Uint8Array(FW * FH); // 1: the lake (cut out), 2: painted water, 3: the sea of clouds (cut out)
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
    if (g.kind === 'flowers') return Math.floor(x * 0.75 + u * 0.12) % 3 === 0 ? GROUND.flowers[3] : ramp(GROUND.flowers.slice(0, 3), x, u, 43, 4); // lavender rows
    if (g.kind === 'kochia') return (Math.floor(x / 4) + Math.floor(u / 4)) % 2 ? ramp(GROUND.kochia, x, u, 45, 3) : 0x8a7a5a; // round shrubs in a grid
    return ramp(GROUND[g.kind], x, u, 41);
  });
  for (const g of GROUNDS) if (!g.over) ground(g);

  // ---- the water: the lake and the sea of clouds open to the far layer; ponds painted
  const water = (w) => fill(w, (x, u, X, Yy) => {
    if (w.open) {
      wet[Yy * FW + X] = w.clouds ? 3 : 1;
      img.hi.clear(X, Yy);
      return null;
    }
    wet[Yy * FW + X] = 2;
    return ramp(PAINTED, x * 0.6, u, 57, 7);
  });
  for (const w of WATER) water(w);
  for (const g of GROUNDS) if (g.over) ground(g);
  // the edges: pebbles along the lake and the ponds, a dark drop where the ground falls away into the clouds
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
      img.hi.set(X, Yy, kind === 3 ? shade(0x2a1a16, 0.9 + hashPx(X, Yy, 9) * 0.2) : PEBBLES[Math.floor(hashPx(X, Yy, 9) * 3)]);
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
    if (r.cls === 'trail') along(r.pts, r.w / 2 + 1, (n, x, u, X, Yy) => (n.d > r.w / 2 ? shade(0x5a524c, 0.85 + hashPx(X, Yy, 21) * 0.3) : null)); // its stone walls
  };
  const surface = (r) => {
    const half = r.w / 2;
    if (r.cls === 'walk')
      along(r.pts, half, (n, x, u, X, Yy) => shade(0xb9b1a0, (Math.floor(n.along * S) % 6 === 0 ? 0.86 : 0.97) + hashPx(X, Yy, 7) * 0.06));
    else if (r.cls === 'deck')
      along(r.pts, half, (n, x, u, X, Yy) => shade(0x9a7a52, (Math.floor(n.along * S) % 3 === 0 ? 0.84 : 1) + hashPx(X, Yy, 13) * 0.06));
    else if (r.cls === 'trail')
      along(r.pts, half, (n, x, u, X, Yy) => shade(0x8a7464, 0.9 + hashPx(X, Yy, 23) * 0.16)); // packed scoria
    else if (r.cls === 'descent')
      along(r.pts, half, (n, x, u, X, Yy) => {
        if (Math.abs(Math.abs(n.side) - half * 0.5) < 0.5 && Math.floor(n.along * S) % 2 === 0) return 0x4a3a32; // the bulldozer's tracks
        return shade(0x7a5a48, 0.88 + hashPx(X, Yy, 25) * 0.2); // loose scoria
      });
    else
      along(r.pts, half, (n, x, u, X, Yy) => {
        if (r.cls === 'bridge' && n.d > half - 0.67) return 0xd0ccc4; // its parapets
        return shade(SURFACE[r.cls], 0.96 + hashPx(X, Yy, 15) * 0.08);
      });
  };
  const lines = (r) => {
    if (r.cls === 'road') return along(r.pts, r.w / 2 - 0.5, (n) => (Math.abs(n.d - (r.w / 2 - 0.67)) < 0.17 ? 0xdedad0 : Math.abs(n.side) < 0.17 && Math.floor(n.along * S) % 18 < 10 ? 0xe0c466 : null));
    if (r.cls !== 'avenue' && r.cls !== 'street' && r.cls !== 'bridge') return;
    along(r.pts, r.w / 2 - 1, (n) => {
      const dash = Math.floor(n.along * S) % 18 < 10;
      if (Math.abs(n.side) < 0.17) return r.cls === 'street' ? (dash ? 0xd8d4c4 : null) : 0xe0c466; // the centre line
      return null;
    });
  };
  for (const r of ROADS) edgeOf(r);
  for (const r of ROADS) surface(r);
  for (const r of ROADS) lines(r);

  // ---- the railway (ballast, sleepers, rails) and the ropeway (its two cables, a shadow under them)
  for (const r of RAILS) {
    if (r.style === 'rope') {
      along(r.pts.map(([x, u]) => [x + 3, u - 3]), 1.2, (n, x, u, X, Yy) => {
        if (img.hi.alpha(X, Yy) && Math.abs(Math.abs(n.side) - 0.9) < 0.2) img.hi.tint(X, Yy, 0.8);
        return null;
      });
      along(r.pts, 1.2, (n) => (Math.abs(Math.abs(n.side) - 0.9) < 0.2 ? 0x2a2a30 : null));
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

  // ---- the plots the landmarks will stand on: hatched, edged (a low one paler)
  for (const [, x, u, w, h, , low] of PLOTS.filter((q) => q[2] >= DRAWN_TO))
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
    if (r.style === 'rope') continue; // (the cables pass over what is under them)
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
  const props = new PropKit(10109, { artScale: S });
  const kit = makeKit({ img, W, L, S, seed: 10009, props, tod });
  const covers = []; // boxes of the strip shown again over the moving parts (a station's roof over its train)
  const claim = (x, u, w, h) => {
    for (let j = Math.max(0, Math.floor(u)); j < Math.min(L, u + h); j++) occ.fill(1, j * W + Math.max(0, Math.floor(x)), j * W + Math.min(W, Math.ceil(x + w)));
  };
  const ctx = { near, ROADS, RAILS, GROUND, img, wet, paint, fill, along, ramp, shade, W, S, L, kit, props, tod, blocks, pave, plot, ground: ground_, claim, cover: (x, u, w, h, d = 0.1) => covers.push([x, u, w, h, d]) };
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
  return { strip: img.hi, props: props.pack(), meta: { width: W, artScale: S, length: L, tint: tintTable(L, tod.white) } };
}
