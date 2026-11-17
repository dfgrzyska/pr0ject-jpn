// Tokyo's middle layer. Phase 1 of docs/plan-tokyo.md: the skeleton of the whole route, painted from route.mjs -
// the ground of each district, the parks and courts, the water (the rivers and the bay cut out to the far layer,
// the moats and ponds painted), the streets with their pavements and lines, the tracks, the expressways over it
// all, and the plots the landmarks will stand on (hatched until their district is drawn). Then the strip is graded
// for the time of day. The districts' own files (phases 2-7) come in through PAINTERS, each given the context
// this file builds; they draw on their plots and fill the blocks between the streets.
//
// Coordinates: x across, u up from the strip's bottom; a fine pixel is a third of a logical one.
import { fbm } from '../../lib/raster.mjs';
import { HiCanvas, hashPx } from '../hires.mjs';
import { todGrade, tintTable, PropKit } from '../props.mjs';
import { makeKit } from './kit.mjs';
import { nakano } from './nakano.mjs';
import { shinjuku } from './shinjuku.mjs';
import { harajuku } from './harajuku.mjs';
import { shibuya } from './shibuya.mjs';
import { minato } from './minato.mjs';
import { chiyoda } from './chiyoda.mjs';
import { akihabara } from './akihabara.mjs';
import { ueno } from './ueno.mjs';
import { asakusa } from './asakusa.mjs';
import { sumida } from './sumida.mjs';
import { bay } from './bay.mjs';
import { odaiba } from './odaiba.mjs';
import { aomi } from './aomi.mjs';
import { W, S, L, DISTRICTS, ARENAS, TOD, WATER, GROUNDS, ROADS, RAILS, PLOTS } from './route.mjs';
import { near, inShape, bbox, railHalf } from './geom.mjs';

// the districts' painters, in the order they are called: (ctx) => void. (Phases 2-7 add theirs here.)
const PAINTERS = [nakano, shinjuku, harajuku, shibuya, minato, chiyoda, akihabara, ueno, asakusa, sumida, bay, odaiba, aomi];
const ARENA_DRAWN = new Set(['KASA-OBAKE', 'TAIYAKI', 'KUROGANE']); // (arenas whose own ground is drawn: no ring)

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
  forest: [0x2f5a32, 0x3a6a38, 0x467840],
  gravel: [0xb0a690, 0xbcb29c, 0xc6bca6],
  plaza: [0x9c988f, 0xa8a49a, 0xb2aea4],
  paving: [0x8e887e, 0x9a948a, 0xa49e94],
  sand: [0xcdbb8c, 0xd8c89a, 0xe2d4a8],
  apron: [0x74787c, 0x7e8286, 0x888c90],
  asphalt: [0x43454d, 0x474951, 0x4b4d55],
};
const PAINTED = [0x24505c, 0x2c5c68, 0x366a74, 0x447a82];
const BANK = 0x8c887e;
const SIDEWALK = 0xa9a59c;
const KERB = 0x7e7a72;
const SURFACE = { avenue: 0x45474f, street: 0x4a4c54, lane: 0x5c5c62, express: 0x52545c };

export function buildMid() {
  const img = new HiCanvas(W, L, S);
  const FW = W * S;
  const FH = L * S;
  const wet = new Uint8Array(FW * FH); // 1: open water (cut out), 2: painted water
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

  // ---- the ground of each district: what is left between everything else (the blocks the districts will fill)
  for (const [from, to, , , ground] of DISTRICTS) paint(0, from, W, to, (x, u, X, Yy) => shade(ground, 0.95 + fbm(x, u, { seed: 31, scale: 22, octaves: 2 }) * 0.1 + (hashPx(X, Yy, 3) - 0.5) * 0.03));

  const ground = (g) => fill(g, (x, u, X, Yy) => {
    wet[Yy * FW + X] = 0;
    return ramp(GROUND[g.kind], x, u, 41);
  });
  for (const g of GROUNDS) if (!g.over) ground(g);

  // ---- the water: open to the far layer, or painted
  const water = (w) => fill(w, (x, u, X, Yy) => {
    if (w.open) {
      wet[Yy * FW + X] = 1;
      img.hi.clear(X, Yy);
      return null;
    }
    wet[Yy * FW + X] = 2;
    return ramp(PAINTED, x * 0.6, u, 57, 7);
  });
  for (const w of WATER) if (!w.late) water(w);
  for (const g of GROUNDS) if (g.over) ground(g);
  for (const w of WATER) if (w.late) water(w);
  // its banks: a stone edge two fine pixels wide on the land side
  {
    const edge = [];
    for (let Yy = 0; Yy < FH; Yy++)
      for (let X = 0; X < FW; X++) {
        if (wet[Yy * FW + X]) continue;
        let by = false;
        for (let k = 1; k <= 2 && !by; k++) by = (X >= k && wet[Yy * FW + X - k]) || (X + k < FW && wet[Yy * FW + X + k]) || (Yy >= k && wet[(Yy - k) * FW + X]) || (Yy + k < FH && wet[(Yy + k) * FW + X]);
        if (by) edge.push(Yy * FW + X);
      }
    for (const i of edge) img.hi.set(i % FW, Math.floor(i / FW), shade(BANK, 0.94 + hashPx(i % FW, Math.floor(i / FW), 9) * 0.12));
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

  // ---- the streets: every pavement first, then every roadway, then the lines, so that crossings join cleanly
  const onGround = ROADS.filter((r) => r.cls !== 'express' && !r.over);
  const raised = ROADS.filter((r) => r.cls === 'express' || r.over);
  const pavement = (r) => {
    const walk = r.cls === 'avenue' ? 2 : r.cls === 'street' ? 1.34 : 0;
    if (walk) along(r.pts, r.w / 2 + walk, (n, x, u, X, Yy) => (n.d > r.w / 2 + walk - 0.34 ? KERB : shade(SIDEWALK, 0.96 + hashPx(X, Yy, 5) * 0.08)));
  };
  const roadway = (r) => {
    const half = r.w / 2;
    if (r.cls === 'walk')
      along(r.pts, half, (n, x, u, X, Yy) => {
        const joint = Math.floor(n.along * S) % 6 === 0 || Math.floor((n.side + 60) * S) % 6 === 0;
        return shade(0xb9b1a0, (joint ? 0.86 : 0.97) + hashPx(X, Yy, 7) * 0.06);
      });
    else if (r.cls === 'arcade')
      // a covered shopping street: a glass roof, its ribs across and its ridge along
      along(r.pts, half, (n, x, u, X, Yy) => {
        if (n.d > half - 0.67) return 0xe6ecee;
        if (Math.abs(n.side) < 0.34) return 0xdfe8ea;
        return Math.floor(n.along * S) % 12 === 0 ? 0xd4e0e4 : shade(0x9cc4cc, 0.94 + hashPx(X, Yy, 11) * 0.1);
      });
    else if (r.cls === 'deck')
      along(r.pts, half, (n, x, u, X, Yy) => shade(0x9a7a52, (Math.floor(n.along * S) % 3 === 0 ? 0.84 : 1) + hashPx(X, Yy, 13) * 0.06));
    else
      along(r.pts, half, (n, x, u, X, Yy) => {
        if (r.cls === 'express' && n.d > half - 0.67) return 0xcfd0cc; // its parapets
        return shade(SURFACE[r.cls], 0.96 + hashPx(X, Yy, 15) * 0.08);
      });
  };
  const lines = (r) => {
    if (r.cls !== 'avenue' && r.cls !== 'street' && r.cls !== 'express') return;
    const lanes = r.w >= 12 ? r.w / 4 : 0;
    along(r.pts, r.w / 2 - 1, (n) => {
      const dash = Math.floor(n.along * S) % 18 < 10;
      if (Math.abs(n.side) < 0.17) return r.cls === 'street' ? (dash ? 0xd8d4c4 : null) : 0xe0c466; // the centre line
      if (lanes && Math.abs(Math.abs(n.side) - lanes) < 0.17 && dash) return 0xdedad0;
      return null;
    });
  };
  for (const r of onGround) pavement(r);
  for (const r of onGround) if (r.cls !== 'arcade') roadway(r);
  for (const r of onGround) lines(r);
  for (const r of onGround) if (r.cls === 'arcade') roadway(r); // (its roof over the lanes that cross under it)

  // ---- what stands over the streets: the tracks on their viaducts, the bridges over them, the expressways.
  // Their shadows first (thrown to the lower right, on whatever is painted there).
  const shadowed = new Uint8Array(FW * FH);
  const shadow = (pts, half, len) =>
    along(pts.map(([x, u]) => [x + len, u - len]), half, (n, x, u, X, Yy) => {
      const i = Yy * FW + X;
      if (!shadowed[i] && !wet[i] && img.hi.alpha(X, Yy)) {
        shadowed[i] = 1;
        img.hi.tint(X, Yy, 0.74);
      }
      return null;
    });
  for (const r of RAILS) if (r.style !== 'crane') shadow(r.pts, railHalf(r), r.style === 'guideway' ? 3 : 1.67);
  for (const r of raised) shadow(r.pts, r.w / 2, r.cls === 'express' ? 3 : 1.67);

  for (const r of RAILS) {
    const half = railHalf(r);
    if (r.style === 'guideway')
      // the automated line: two concrete beams on cross ties
      along(r.pts, half, (n, x, u, X, Yy) => {
        const s = Math.abs(n.side);
        if (Math.abs(s - 3) <= 1.34) return shade(0xb8b8b2, (Math.abs(s - 3) > 0.9 ? 0.86 : 1) - hashPx(X, Yy, 17) * 0.05);
        return Math.floor(n.along) % 12 === 0 && Math.floor(n.along * S) % 3 !== 2 ? 0x9a9a94 : null;
      });
    else if (r.style === 'crane')
      along(r.pts, half, (n) => (Math.abs(Math.abs(n.side) - 7) < 0.34 ? 0x34363c : null));
    else
      along(r.pts, half, (n, x, u, X, Yy) => {
        if (n.d > half - 0.67) return 0xb4b0a8; // the viaduct's parapet
        const s = n.side + (r.tracks - 1) * 2.5; // across the tracks, from the first one's middle
        const t = Math.abs(s - Math.round(s / 5) * 5); // from the nearest track's middle
        if (Math.round(t * S) === 3) return 0xd0d4d8; // a rail
        if (t <= 1.7 && Math.floor(n.along * S) % 4 === 0) return 0x4c4238; // a sleeper
        return [0x7a7068, 0x6c645c, 0x857b72][Math.floor(hashPx(X, Yy, 19) * 3)]; // ballast
      });
  }
  for (const r of raised) pavement(r);
  for (const r of raised) roadway(r);
  for (const r of raised) lines(r);

  // ---- the plots the landmarks will stand on: hatched, edged (a low one paler)
  for (const [, x, u, w, h, , low] of PLOTS)
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

  // ---- the districts. What they may build on: the ground that nothing of the route takes (occ: a logical
  // pixel is 1 where there is water, a street with its pavements, tracks, a ground of its own kind or a plot).
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
  /**
   * The free ground between u0 and u1 as boxes [x, u, w, h], each at least minW x minH: the blocks a district
   * fills with its houses. What is given out is taken, so asking again gives what is left.
   */
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
  /** Paint the ground box (x, u, w, h) as a ground of a kind (a plot that is a court, a yard). */
  const pave = (x, u, w, h, kind, seed = 41) => paint(x, u, x + w, u + h, (px, pu) => ramp(GROUND[kind], px, pu, seed));
  const plot = (id) => {
    const p = PLOTS.find((q) => q[0] === id);
    return { x: p[1], u: p[2], w: p[3], h: p[4] };
  };
  const tod = todGrade(TOD, smooth);
  const props = new PropKit(9109, { artScale: S });
  const kit = makeKit({ img, W, L, S, seed: 9009, props, tod });
  const covers = []; // boxes of the strip shown again over the moving parts (a station's roof over its trains)
  // (d: how high - 0.1 is over the trains; -0.1 is over the cars on the ground and under the trains)
  /** Keep the ground box (x, u, w, h) out of the blocks (a forecourt the district lays out itself). */
  const claim = (x, u, w, h) => {
    for (let j = Math.max(0, Math.floor(u)); j < Math.min(L, u + h); j++) occ.fill(1, j * W + Math.max(0, Math.floor(x)), j * W + Math.min(W, Math.ceil(x + w)));
  };
  const ctx = { near, ROADS, RAILS, GROUND, img, wet, paint, fill, along, ramp, shade, W, S, L, kit, props, tod, blocks, pave, plot, claim, cover: (x, u, w, h, d = 0.1) => covers.push([x, u, w, h, d]) };
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
  kit.afterGrade(); // (the lights: windows, signs, lamps, their glow)
  for (const [x, u, w, h, d] of covers) props.loop(x, u + h, [props.frame(img.hi.crop(x * S, (L - u - h) * S, w * S, h * S))], { fps: 1, d });
  return { strip: img.hi, props: props.pack(), meta: { width: W, artScale: S, length: L, tint: tintTable(L, tod.white) } };
}
