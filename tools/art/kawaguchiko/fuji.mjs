// Mount Fuji (u 3930 to the strip's end, docs/plan-kawaguchiko.md section 4.1, phases 4-5): the mountain itself.
//
// fujiGround (before the roads): the ground as relief. A height field - the cone rising to the crater, gullies and
// ridges running out from it (straight down the slope far below, fanning near the top), a rough skin, the crater's
// bowl and its rim - lit from the upper left like everything in the game; over it the zones of height: the lava
// forest's floor, the old flows of black lava with moss, the tree line's shrubs on bare ground, black scoria, red
// scoria with rills, snow lying in the gullies near the top, the crater's walls in bands with scree at their foot.
//
// fujiSlopes (after the roads): what stands on it. The lava forest; the tree line thinning out; the trail's stone
// walls, its roped posts, steps by the huts; the huts of the sixth to ninth stations, each its own; the shelters
// over the trail, the first-aid post; the descent road's berms, the supply bulldozer on it; at night the climbers'
// headlamps creeping up the zigzags; the summit: the torii and its lion-dogs, the shrine, the stone huts, the weather
// station on the highest point, the spring, cairns, the people on the rim waiting for the sun.
import { fbm } from '../../lib/raster.mjs';
import { hashPx } from '../hires.mjs';
import { PAL, shade } from '../tokyo/kit.mjs';
import { makeParts, VERMILION } from './parts.mjs';
import { CRATER } from './route.mjs';

const [CX, CU, CR] = CRATER;
const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** The plots fuji.mjs lays out itself (not hatched by mid.mjs). */
export const FUJI_DRAWN = new Set([
  'rokugome', 'rakuseki_1', 'kyugo', 'nanagome_1', 'nanagome_2', 'nanagome_3', 'nanagome_4', 'nanagome_5', 'hachigome_1', 'hachigome_2', 'hachigome_3', 'hachigome_4',
  'hon_hachigome', 'rakuseki_2', 'kyugome', 'chojo_torii', 'kusushi_jinja', 'chojo_goya', 'ginmeisui', 'kengamine',
]);

// ---------------------------------------------------------------- the relief
/** The mountain's height at (x, u), and how deep in a gully it lies there (0 on a ridge, 1 in its bottom). */
function relief(x, u) {
  const [dx, du] = [x - CX, u - CU];
  const r = Math.hypot(dx, du);
  const th = Math.atan2(dx, -du);
  // Across the slope: far down it the gullies run straight down the strip (x itself); near the top they fan out from
  // the crater (the angle round it, at a fixed scale, so a gully keeps its line as it runs out). Blended between.
  const far = smooth(280, 520, r);
  const K = 170;
  // (round behind the summit the angle wraps: there the noise is blended with its other side, so no seam shows)
  const at = (t) => fbm(t * K + 5000, r * 0.16, { seed: 701, scale: 12, octaves: 3 });
  const wrapW = smooth(Math.PI - 0.5, Math.PI, Math.abs(th)) * 0.5;
  const nNear = far >= 1 ? 0 : wrapW ? at(th) * (1 - wrapW) + at(th - Math.sign(th) * 2 * Math.PI) * wrapW : at(th);
  const nFar = far <= 0 ? 0 : fbm(dx + 5000, r * 0.16, { seed: 701, scale: 12, octaves: 3 });
  const n = nNear * (1 - far) + nFar * far;
  const arc = th * K * (1 - far) + dx * far; // (for the rills)
  const ridge = 1 - Math.abs(2 * n - 1);
  const amp = 7 * smooth(CR - 2, CR + 14, r); // (the crater's bowl is smooth: no gullies run into it)
  let h = -r * 0.6 + amp * ridge + 1.3 * fbm(x, u, { seed: 703, scale: 3, octaves: 2 });
  h += 5 * Math.exp(-(((r - CR - 2) / 5) ** 2)); // the rim
  if (r < CR + 2) h -= 30 * smooth(CR, 24, r); // the bowl
  return { h, gully: (1 - ridge) * smooth(CR, CR + 14, r), r, arc };
}

const ZONE = {
  forest: [0x2a3a22, 0x34442a, 0x3e4e30],
  treeline: [0x4a5a34, 0x5a6a3c, 0x5a5044, 0x6a5e50],
  scoria: [0x262228, 0x2e2a30, 0x3a343a, 0x443c40],
  red: [0x5a3024, 0x6a3a2a, 0x7a4632, 0x8a5a3c],
  snow: [0xc8d4e2, 0xdee6f0, 0xf0f4f8],
  lava: [0x1e1c1c, 0x2a2624, 0x36302c],
  moss: [0x3a5a2a, 0x4a6a32],
  strata: [0x6a3a2a, 0x4a2a24, 0x8a5a3a, 0x3a2a28, 0x7a4a30],
};

export function fujiGround(ctx) {
  const { img, wet, W, S, L, GROUNDS, inShape, bbox } = ctx;
  const hi = img.hi;
  const FW = W * S;
  const U0 = 3930;
  const Y1 = Math.round((L - U0) * S); // (fine rows 0..Y1 hold the mountain)
  // the grounds that keep their own look (the camp, the beach, the fifth station's square), and those drawn here
  const keep = GROUNDS.filter((g) => ['park', 'sand', 'plaza'].includes(g.kind) && bbox(g)[3] > U0);
  const lava = GROUNDS.filter((g) => g.kind === 'lava');
  const snow = []; // (the snow lies where the gullies hold it, below; the route's rough patches only mark where)
  // heights a fine pixel apart, for the light; a row of them at a time with the rows round it
  const Hrow = (Y) => {
    const out = new Float32Array(FW + 2);
    const u = L - (Y + 0.5) / S;
    for (let X = -1; X <= FW; X++) out[X + 1] = relief((X + 0.5) / S, u).h;
    return out;
  };
  const LIGHT = (() => {
    const v = [-0.5, 0.55, 0.67];
    const l = Math.hypot(...v);
    return v.map((c) => c / l);
  })();
  let [above, row, below] = [Hrow(-1), Hrow(0), Hrow(1)];
  for (let Y = 0; Y < Y1; Y++) {
    if (Y > 0) [above, row, below] = [row, below, Hrow(Y + 1)];
    const u = L - (Y + 0.5) / S;
    const keepRow = keep.filter((g) => { const b = bbox(g); return u >= b[1] && u <= b[3]; });
    const lavaRow = lava.filter((g) => { const b = bbox(g); return u >= b[1] && u <= b[3]; });
    const snowRow = snow.filter((g) => { const b = bbox(g); return u >= b[1] && u <= b[3]; });
    for (let X = 0; X < FW; X++) {
      if (wet[Y * FW + X]) continue;
      const x = (X + 0.5) / S;
      if (keepRow.some((g) => inShape(g, x, u))) continue;
      const { gully, r, arc } = relief(x, u);
      // the light on the slope here, against the light on a smooth cone (so the zones keep their own tone)
      const gx = (row[X + 2] - row[X]) * (S / 2);
      const gu = (above[X + 1] - below[X + 1]) * (S / 2);
      const n = [-gx, -gu, 1];
      const nl = Math.hypot(...n);
      const dot = (n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]) / nl;
      const [cgx, cgu] = r > 1 ? [(-0.6 * (x - CX)) / r, (-0.6 * (u - CU)) / r] : [0, 0];
      const c0 = [-cgx, -cgu, 1];
      const dot0 = (c0[0] * LIGHT[0] + c0[1] * LIGHT[1] + c0[2] * LIGHT[2]) / Math.hypot(...c0);
      let lit = Math.max(0.55, Math.min(1.45, 1 + (dot - dot0) * (1.5 + 0.7 * smooth(200, 700, r))));
      const grain = 0.95 + hashPx(X, Y, 711) * 0.1;
      const v = fbm(x, u, { seed: 713, scale: 9, octaves: 2 });
      // (the zones' edges, ragged and frayed: a wavy line, then grain across it)
      const ub = u + 90 * (fbm(x, u, { seed: 715, scale: 14, octaves: 3 }) - 0.5) + (hashPx(X, Y, 739) - 0.5) * 36;
      let pal;
      let k = v;
      if (r < CR) {
        // the crater: its walls in bands, scree at their foot, the floor
        if (r > 28) {
          pal = [ZONE.strata[Math.floor((r - 28 + fbm(x, u, { seed: 717, scale: 6 }) * 2) / 2.6) % ZONE.strata.length]];
          k = 0;
        } else if (r > 22) {
          pal = hashPx(X, Y, 719) < 0.4 ? [0x6a6460, 0x8a847c] : ZONE.red;
        } else pal = [0x4a3428, 0x56402e, 0x624a36];
        if (r > 28) lit = Math.max(0.5, Math.min(1.6, lit * 1.1)); // (steep: the light tells)
      } else if (lavaRow.some((g) => inShape(g, x, u))) {
        // an old flow: rough black rock, moss in its hollows, cracks
        const rough = fbm(x, u, { seed: 721, scale: 2.4, octaves: 2 });
        pal = rough > 0.64 ? ZONE.moss : ZONE.lava;
        lit *= 0.75 + rough * 0.7; // (rugged: bright tops, black hollows)
        if (rough > 0.55 && rough < 0.6) pal = [0x5a524a];
        if (Math.abs(fbm(x, u, { seed: 723, scale: 7 }) - 0.5) < 0.02) pal = [0x0e0c0c];
      } else if (snowRow.some((g) => inShape(g, x, u)) || (ub > 6380 && gully > 0.74 - (ub - 6380) / 2600 && fbm(x, u, { seed: 725, scale: 14 }) > 0.42)) {
        pal = ZONE.snow;
        lit = 1 + (lit - 1) * 1.4; // (snow shows its shading most)
      } else if (ub < 4980) pal = ZONE.forest;
      else if (ub < 5500) {
        // the tree line: mats of shrubs and dwarf larch on bare scoria, thinning upwards
        const green = v > 0.48 + (ub - 4980) / 1300;
        pal = green ? ZONE.treeline.slice(0, 2) : ZONE.treeline.slice(2);
      } else if (ub < 6222) pal = ZONE.scoria;
      else pal = ZONE.red;
      let c = pal[Math.min(pal.length - 1, Math.floor(k * pal.length + (hashPx(X, Y, 727) - 0.5) * 0.8))] ?? pal[0];
      // rills down the scoria, stones lying on it
      if (u > 5500 && r > CR + 6) {
        const rill = ((arc * 0.14 + fbm(x, u, { seed: 729, scale: 20 }) * 3) % 1 + 1) % 1;
        if (rill < 0.07) c = shade(c, 0.82);
        if (hashPx(X, Y, 731) < 0.012) c = shade(c, 1.35);
      }
      hi.set(X, Y, shade(c, lit * grain));
    }
  }
}

// ---------------------------------------------------------------- what stands on it
export function fujiSlopes(ctx) {
  const { kit, props, plot, ROADS, near, S, L, W } = ctx;
  const { tree, mark, crowd, rand, P, R, FX, FY, queue, shadowBox, hi, E, ER, halo, nightAt } = kit;
  const { roof, torii, toro, nobori } = makeParts(ctx);
  const trail = ROADS.find((r) => r.id === 'yoshida_trail');
  const descent = ROADS.find((r) => r.id === 'gesan_doro');
  const FW = W * S;
  const dry = (x, u) => !ctx.wet[Math.round((L - u) * S) * FW + Math.round(x * S)];
  const clearOfRoads = (x, u, pad = 2) => !ROADS.some((r) => near(r.pts, x, u).d < r.w / 2 + pad);
  const inPlots = (x, u, pad = 2) => [...FUJI_DRAWN, 'okuniwa', 'tenbo_gogome', 'ryokinjo', 'narusawa_hyoketsu', 'fugaku_fuketsu', 'funatsu_tainai', 'camp_tent', 'camp_lodge', 'bus_taminaru', 'gogome_mise_1', 'gogome_mise_2', 'komitake_jinja', 'umaya']
    .map(plot).some((p) => x > p.x - pad && x < p.x + p.w + pad && u > p.u - pad && u < p.u + p.h + pad);
  const camp = ctx.ground('camp').rect;
  const square = ctx.ground('gogome_hiroba').rect;
  const inRect = ([rx, ru, rw, rh], x, u, pad = 0) => x > rx - pad && x < rx + rw + pad && u > ru - pad && u < ru + rh + pad;

  // ---------------------------------------------------------------- the lava forest, thinning into the tree line
  for (let k = 0; k < 9000; k++) {
    const u = 3934 + rand() * (5520 - 3934);
    const x = 1 + rand() * 178;
    const t = (u + 90 * (fbm(x, u, { seed: 715, scale: 14, octaves: 3 }) - 0.5) - 4980) / 520; // (0 at the tree line's foot, 1 at its top; ragged)
    if (t > -0.15 && rand() < Math.max(0, t + 0.15) * 0.85 + 0.05) continue; // (thinning out over a band, not at a line)
    if (!dry(x, u) || !clearOfRoads(x, u) || inPlots(x, u, 3) || inRect(camp, x, u, 2) || inRect(square, x, u, 3)) continue;
    const onLava = ctx.GROUNDS.some((g) => g.kind === 'lava' && ctx.inShape?.(g, x, u));
    if (onLava && rand() < 0.7) continue;
    if (t < 0) tree(rand() < 0.5 ? 'fir' : rand() < 0.6 ? 'cedar' : 'broadleaf', x, u, 2.2 + rand() * 1.8);
    else tree(rand() < 0.65 ? 'fir' : 'tiny', x, u, 1.1 + rand() * (1.6 - t));
  }

  // ---------------------------------------------------------------- the trail: its walls, roped posts, steps by the huts
  {
    const pts = trail.pts;
    const huts = [...FUJI_DRAWN].filter((id) => /gome|kyugo/.test(id)).map(plot);
    ctx.along(pts, trail.w / 2 + 1.4, (n, x, u, X, Y) => {
      if (n.d < trail.w / 2 + 0.34) {
        // steps of stone where it runs by a hut
        const byHut = huts.some((p) => Math.hypot(x - (p.x + p.w / 2), u - (p.u + p.h / 2)) < 24);
        if (byHut && Math.floor(n.along * S) % 4 === 0) return 0x6a5a50;
        return null;
      }
      // the wall of piled scoria blocks along each side
      return (Math.floor(n.along * S) + (n.side > 0 ? 1 : 0)) % 3 ? shade(0x4a4248, 0.9 + hashPx(X, Y, 733) * 0.3) : 0x2a2428;
    });
    // posts with a rope between them on the outer side of every bend
    for (let i = 1; i + 1 < pts.length; i++) {
      const [a, b, c] = [pts[i - 1], pts[i], pts[i + 1]];
      const out = Math.sign((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]) || 1);
      for (let k = -2; k <= 2; k++) {
        const ang = Math.atan2(c[1] - a[1], c[0] - a[0]) + Math.PI / 2;
        const [x, u] = [b[0] + Math.cos(ang) * out * 3.4 + k * 1.6 * Math.cos(ang - Math.PI / 2), b[1] + Math.sin(ang) * out * 3.4 + k * 1.6 * Math.sin(ang - Math.PI / 2)];
        mark(x, u, (X, Y) => {
          R(X, Y - 3, 1, 3, 0x8a7a5a);
          if (k < 2) for (let q = 1; q < 5; q++) P(X + q, Y - 2 + (q === 2 ? 1 : 0), 0xd8c890);
        });
      }
    }
  }

  // ---------------------------------------------------------------- the huts: stone walls, tin roofs held down with rocks, each its own
  const HUT_ROOF = [0x2a5a8a, 0x8a2a24, 0x3a6a4a, 0x5a5a62, 0x8a6a2a, 0x4a3a6a];
  const hutAt = (p, s) => {
    const { x, u, w, h } = p;
    const c = HUT_ROOF[s % HUT_ROOF.length];
    const [X0, X1, YT, YB] = [FX(x + 1), FX(x + w - 1), FY(u + h - 1), FY(u + 1)];
    const fh = 8;
    queue(YB, () => {
      // the roof: corrugated sheet in ridges across, rocks laid on it in rows, a stovepipe, a solar panel
      for (let j = 0; j < YB - YT - fh; j++)
        for (let i = 0; i < X1 - X0; i++) {
          let col = (i % 3 === 0 ? shade(c, 0.78) : i % 3 === 1 ? shade(c, 1.12) : c);
          if (i === 0 || j === 0 || i === X1 - X0 - 1 || j === YB - YT - fh - 1) col = shade(c, 0.5);
          P(X0 + i, YT + j, col);
        }
      for (let r = 0; r < 2; r++)
        for (let i = 2; i < X1 - X0 - 2; i += 3 + ((i * 7 + s) % 3)) {
          const [rx, ry] = [X0 + i, YT + 3 + r * Math.max(4, ((YB - YT - fh) >> 1))];
          R(rx, ry, 2, 2, 0x5a5250);
          P(rx, ry, 0x8a8280);
        }
      R(X1 - 7, YT + 2, 2, 4, 0x3a3a3c);
      if (s % 2) for (let j = 0; j < 4; j++) for (let i = 0; i < 9; i++) P(X0 + 4 + i, YT + 2 + j, i % 3 === 2 || j === 2 ? 0x8a94a8 : 0x2a4680);
      // the south wall: stones laid in courses, a door, windows warm at night
      const n = nightAt(YB);
      for (let j = 0; j < fh; j++)
        for (let i = X0; i < X1; i++) {
          const col = j === fh - 1 ? 0x241e20 : ((i + (Math.floor(j / 2) % 2) * 2) % 4 === 0 || j % 2 === 0 ? 0x4a4446 : 0x6a6260);
          const win = j > 1 && j < 5 && (i - X0) % 9 >= 3 && (i - X0) % 9 <= 5 && Math.abs(i - (X0 + X1) / 2) > 3;
          if (win && n > 0.15) E(i, YB - fh + j, 0xffd890);
          else P(i, YB - fh + j, win ? 0x3a4a5a : col);
        }
      R(((X0 + X1) >> 1) - 1, YB - fh + 2, 3, fh - 3, 0x4a3426);
      if (n > 0.15) halo((X0 + X1) >> 1, YB + 4, 14, 8, 0xffc070, 0.3 * n);
      // its bench along the front, its sign, a stack of supplies and a gas bottle
      R(X0 + 2, YB + 2, X1 - X0 - 4, 2, 0x7a5a3a);
      R(X0 + 3, YB - fh - 4, 10, 4, 0xe8dcc0);
      kit.strokes(X0 + 3, YB - fh - 4, 10, 4, 0x3a2a20, s);
      R(X1 - 6, YB - 3, 5, 3, 0x9a8a6a);
      R(X1 - 2, YB - 5, 2, 4, 0xd8d8d0);
    }, () => shadowBox(X0, YT, X1 - X0, YB - YT, 6, 0.62));
    nobori(x + 2, u + 2, [0xc83028, 0x2a5ab0, 0xe0a030][s % 3]);
    crowd(x + 2, u - 3, w - 4, 3, 4);
  };
  [...FUJI_DRAWN].filter((id) => /^(nanagome|hachigome|hon_hachigome|rokugome)/.test(id)).forEach((id, k) => hutAt(plot(id), k + 1));
  {
    // the first-aid post: a white hut, a red cross on its roof
    const p = plot('kyugo');
    const [X0, YT, w, h] = [FX(p.x + 1), FY(p.u + p.h - 1), FX(p.w - 2) - FX(0), FX(p.h - 2) - FX(0)];
    queue(YT + h, () => {
      R(X0, YT, w, h - 6, 0xe8e8e4);
      R(X0, YT, w, 1, 0xffffff);
      R(X0 + (w >> 1) - 1, YT + 2, 3, 9, 0xd03030);
      R(X0 + (w >> 1) - 4, YT + 5, 9, 3, 0xd03030);
      R(X0, YT + h - 6, w, 6, 0xb8b8b4);
      R(X0, YT + h - 1, w, 1, 0x2a2a30);
    }, () => shadowBox(X0, YT, w, h, 5, 0.62));
  }
  for (const id of ['rakuseki_1', 'rakuseki_2']) {
    // a concrete shelter over the trail against falling stones: its roof, ribbed, the trail running under it
    const p = plot(id);
    const [X0, YT, w, h] = [FX(p.x), FY(p.u + p.h), FX(p.w) - FX(0), FX(p.h) - FX(0)];
    queue(YT + h, () => {
      for (let j = 0; j < h - 4; j++) for (let i = 0; i < w; i++) P(X0 + i, YT + j, i % 6 === 0 ? 0x7a7a76 : j === 0 ? 0xc8c8c0 : 0xa8a8a2);
      R(X0, YT + h - 4, w, 4, 0x3a3a3c);
    }, () => shadowBox(X0, YT, w, h, 5, 0.62));
  }
  {
    const p = plot('kyugome');
    torii(p.x + 3, p.x + p.w - 3, p.u + 3, 0x8a8a84, 2.6); // (of stone, weathered)
  }

  // ---------------------------------------------------------------- the descent road: its berms, the bulldozer
  ctx.along(descent.pts, descent.w / 2 + 1.2, (n, x, u, X, Y) => (n.d > descent.w / 2 ? shade(0x5a4038, 0.9 + hashPx(X, Y, 737) * 0.2) : null));
  {
    const dozer = kit.frame(4, 3, 6200, (put) => {
      for (let j = 0; j < 9; j++)
        for (let i = 0; i < 12; i++) {
          let c = j < 2 || j > 6 ? 0x2a2a2c : 0xe0b020; // the tracks either side, the yellow body
          if (j >= 2 && j <= 6 && i >= 7 && i <= 10) c = j === 4 ? 0x2c3a4c : 0xc89818; // the cab
          if (i === 11 && j >= 1 && j <= 7) c = 0x8a8a84; // the blade
          if ((i + (j < 2 ? 0 : 1)) % 2 === 0 && (j < 2 || j > 6)) c = 0x4a4a4c;
          put(i, j, c);
        }
      put(9, 2, 0xfff0c0);
      put(9, 6, 0xfff0c0);
    });
    props.path([...descent.pts].reverse(), [dozer], { sp: 3, n: 1, mode: 'pp', hold: 12, turn: 'rot', s0: 0.35, d: 0.02 });
  }
  // the climbers at night: headlamps creeping up the zigzags, a few coming down
  {
    const lamp = [0, 1].map((k) => kit.frame(1, 1, 6200, (put) => {
      put(1, 1, k ? 0xfff4d0 : 0xffe8a0);
      put(0, 1, 0x806040, 0.6);
      put(2, 1, 0x806040, 0.6);
      put(1, 0, 0xffffff, k ? 1 : 0.6);
    }, true));
    props.path(trail.pts, lamp, { sp: 0.9, n: 120, gap: 9, mode: 'wrap', turn: 'none', fps: 2, s0: 0.1, d: 0.02 });
    props.path([...descent.pts].reverse(), lamp, { sp: 1.6, n: 14, gap: 70, mode: 'wrap', turn: 'none', fps: 2, s0: 0.5, d: 0.02 });
  }

  // ---------------------------------------------------------------- the summit
  {
    const p = plot('chojo_torii');
    torii(p.x + 3, p.x + p.w - 3, p.u + 3, 0x9a948a, 4, true);
    for (const dx of [0.5, p.w - 0.5])
      mark(p.x + dx, p.u + 1, (X, Y) => {
        R(X - 2, Y - 2, 5, 3, 0x8a847c);
        R(X - 1, Y - 6, 3, 4, 0xa8a298);
        R(X - 2, Y - 7, 5, 2, 0x9a948a);
        P(X, Y - 5, 0x3a3a38);
      });
  }
  {
    const p = plot('kusushi_jinja');
    // its stone wall round it against the wind, the hall under a copper roof, the offering box
    mark(p.x, p.u, (X, Y) => {
      const [w, h] = [FX(p.w) - FX(0), FX(p.h) - FX(0)];
      for (let i = 0; i < w; i++) for (const j of [0, h - 1]) P(X + i, Y - j, (i % 3) ? 0x6a6260 : 0x4a4446);
      for (let j = 0; j < h; j++) for (const i of [0, w - 1]) P(X + i, Y - j, (j % 3) ? 0x6a6260 : 0x4a4446);
    }, p.u);
    kit.house(p.x + 6, p.u + 5, p.w - 12, p.h - 7, { tile: 0x4c7a68, face: 2.4, s: 9101 });
    torii(p.x + 10, p.x + p.w - 10, p.u + 3, VERMILION, 2.4);
  }
  {
    const p = plot('chojo_goya');
    for (let k = 0; k < 3; k++) hutAt({ x: p.x + k * (p.w / 3), u: p.u, w: p.w / 3, h: p.h }, 10 + k);
  }
  {
    // the highest point: the weather station, white and low, its mast; the stone that marks the top
    const p = plot('kengamine');
    kit.building(p.x + 2, p.u + 4, p.w - 8, p.h - 8, {
      face: 4, style: 'plain', wall: 0xe8e8e4, roof: 0xc8ccd0, s: 9201,
      top: ({ X, Y, w, h }) => {
        R(X + (w >> 1), Y - 10, 1, 12, 0x5a5e66);
        R(X + (w >> 1) - 3, Y - 10, 7, 1, 0x5a5e66);
        for (let k = 0; k < 3; k++) R(X + 3 + k * 6, Y + h - 6, 4, 4, 0x9aa0a8);
      },
    });
    mark(p.x + p.w - 3, p.u + 3, (X, Y) => {
      R(X - 1, Y - 6, 3, 6, 0x8a847c);
      R(X - 1, Y - 6, 1, 6, 0xb0aaa0);
    });
    crowd(p.x, p.u - 4, p.w, 4, 8);
  }
  {
    const p = plot('ginmeisui');
    mark(p.x + p.w / 2, p.u + 3, (X, Y) => {
      roof(X - 6, Y - 12, 12, 8, 0x5a4a40);
      R(X - 4, Y - 4, 8, 4, 0x6a6460);
      R(X - 3, Y - 3, 6, 2, 0x5a8aa0);
    });
  }
  // cairns, and the people along the rim waiting for the sun on its eastern side
  for (let k = 0; k < 16; k++) {
    const a = rand() * Math.PI * 2;
    const r = CR + 9 + rand() * 8;
    const [x, u] = [CX + Math.cos(a) * r, CU + Math.sin(a) * r];
    if (!dry(x, u) || !clearOfRoads(x, u, 1)) continue;
    mark(x, u, (X, Y) => {
      R(X - 2, Y - 1, 5, 2, 0x6a6260);
      R(X - 1, Y - 3, 3, 2, 0x7a7270);
      P(X, Y - 4, 0x8a8280);
    });
  }
  for (let k = 0; k < 60; k++) {
    const a = -1.3 + rand() * 1.9; // (the east, and round to the south where the trail comes up)
    const r = CR + 6 + rand() * 4;
    mark(CX + Math.cos(a) * r, CU + Math.sin(a) * r, (X, Y) => kit.person(X, Y - 3, 9300 + k));
  }
  void PAL;
  void toro;
  void ER;
  void hi;
}
