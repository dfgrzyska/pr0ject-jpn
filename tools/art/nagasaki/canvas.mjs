// The Nagasaki strip's drawing kit: a 3/4 view where every building, tree and lamp is an object drawn in order
// of its foot (shadows first), lights and warm light pools added after the time-of-day grade, and helpers for
// the things the city is made of (water, embankments, roads and tramways, roofs, facades, Western houses).
import { Raster, fbm, rng, scaleColor, rgb, mix } from '../../lib/raster.mjs';
import { RAMPS, crownPixels, rampColor, palmPixels } from '../nature.mjs';
import { PropKit, Window, todGrade, tintTable } from '../props.mjs';
import { W, L, RIDGE, isWater } from './geo.mjs';

export const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export const C = {
  sea: [0x0e2c3e, 0x163a4e, 0x1f4a5e, 0x2c5e70, 0x41788a],
  river: [0x123038, 0x1a3e46, 0x245056, 0x33666a],
  grass: [0x2f5232, 0x3d6438, 0x4f7842, 0x678c50],
  moss: [0x24402c, 0x305234, 0x40663e, 0x547a48],
  forest: [0x10241c, 0x183226, 0x22402e, 0x2e5038],
  rock: [0x4a4842, 0x605d54, 0x7a766a, 0x96917f, 0xb2ac98],
  granite: [0x6e7072, 0x88898a, 0xa2a2a0, 0xbcbcb6, 0xd6d4cc],
  paving: [0x7e7a72, 0x8e8a80, 0x9e9a8e, 0xaeaa9c],
  stoneSet: [0x6a645a, 0x7c766a, 0x8e887a, 0xa29a88],
  walk: [0x84868a, 0x94969a, 0xa4a6a8],
  asphalt: [0x34363c, 0x3e4046, 0x484a52],
  tramBed: [0x56524c, 0x66625a, 0x76726a],
  concrete: [0x7e7c76, 0x98968e, 0xb2b0a8, 0xcccac2, 0xe2e0d8],
  quay: [0x5e5c58, 0x74726c, 0x8a8880, 0xa09e94],
  sand: [0x9a8e72, 0xb0a486, 0xc4b89a],
  kawara: [0x262a32, 0x343944, 0x434a56, 0x56606c, 0x6e7884],
  copper: [0x2c584c, 0x3c705e, 0x528a74, 0x6aa68e, 0x8ec4aa],
  slate: [0x2e3c40, 0x3c4e52, 0x4c6266, 0x62787a, 0x7e9492],
  redTile: [0x5a2620, 0x74322a, 0x8e4434, 0xa85a42, 0xc07454],
  chinaGreen: [0x1c4a3c, 0x26604c, 0x32765c, 0x46906e, 0x62aa86],
  vermilion: [0x7c1a16, 0xa8261e, 0xcc3626, 0xec5034],
  wood: [0x4a301e, 0x64422a, 0x7e5636, 0x9a6c46],
  oldWood: [0x4e4034, 0x625244, 0x786654, 0x8e7c66],
  plaster: [0xc6c2b8, 0xe0dcd2, 0xf4f0e6],
  cream: [0xc8bc9e, 0xdcd0b2, 0xece2c6, 0xf8f0da],
  brick: [0x5c3428, 0x764636, 0x905a44, 0xa86e54],
  steel: [0x3a4450, 0x4e5a66, 0x66727e, 0x8494a0, 0xa8b6c0],
  gold: 0xe8b830,
  goldHi: 0xfff0a0,
  warm: 0xffd88e,
  cool: 0xc4e2f0,
  lamp: 0xffb868,
  roofs: [0x5c646e, 0x6e7680, 0x4e5660, 0x7a7068, 0x66605a, 0x546270],
  walls: [0xd6cec0, 0xc4c0b8, 0xb8a892, 0xdedad0, 0x9ca4ac, 0xcab8a2, 0xe6dccc],
};
export const CARS = [0xe8e8ec, 0x2c3038, 0xc43a30, 0x3a609c, 0x9aa2aa, 0xe8d69c, 0x6a2a3a, 0xd8d8d0, 0x3a6a4a];
export const COATS = [0xd04040, 0x3a6ad0, 0xe8c040, 0xe8e8f0, 0x3a3a4a, 0xff9ac0, 0x6aaa5a, 0x8a5a3a, 0x2a2a34];

// Golden afternoon over Hashima -> sunset at the harbour mouth -> blue hour over Dejima -> night from Suwa on.
export const TOD = [
  [0, [1.0, 0.95, 0.88], 0xffc88a, 0.06],
  [1300, [0.94, 0.82, 0.8], 0xff9a6a, 0.1],
  [2400, [0.74, 0.7, 0.84], 0x8a78b8, 0.12],
  [3600, [0.56, 0.58, 0.76], 0x3c4a8a, 0.15],
  [5000, [0.46, 0.5, 0.68], 0x24345e, 0.18],
  [L, [0.36, 0.42, 0.6], 0x18264a, 0.22],
];
/** How much of the night has fallen at u (lamps and windows come on). */
export const night = (u) => smooth(1500, 4200, u);

export function makeCanvas(seed = 8080) {
  const st = { img: new Raster(W, L) };
  const k = {};
  Object.defineProperty(k, 'img', { get: () => st.img });
  const rand = rng(seed);
  const kit = new PropKit(seed + 1);
  const tod = todGrade(TOD, smooth);
  const objects = [];
  const lights = [];
  const pools = [];
  const reserved = new Uint8Array(W * L);
  const water = new Uint8Array(W * L);
  const Y = (u) => Math.round(L - u);
  const U = (y) => L - y;
  Object.assign(k, { rand, kit, tod, objects, lights, pools, reserved, water, Y, U, late: [] });

  const img = () => st.img;
  k.isRes = (x, y) => x >= 0 && x < W && y >= 0 && y < L && reserved[Math.floor(y) * W + Math.floor(x)];
  k.anyRes = (x0, y0, w, h) => {
    for (let y = Math.floor(y0); y < y0 + h; y++)
      for (let x = Math.max(0, Math.floor(x0)); x < Math.min(W, x0 + w); x++) if (k.isRes(x, y)) return true;
    return false;
  };
  k.reserve = (x0, y0, w, h) => {
    for (let y = Math.max(0, Math.floor(y0)); y < Math.min(L, y0 + h); y++)
      for (let x = Math.max(0, Math.floor(x0)); x < Math.min(W, x0 + w); x++) reserved[y * W + x] = 1;
  };
  k.wet = (x, y) => x >= 0 && x < W && y >= 0 && y < L && water[Math.floor(y) * W + Math.floor(x)] === 1;
  k.anyWet = (x0, y0, w, h) => {
    for (let y = Math.floor(y0); y < y0 + h; y += 2) for (let x = Math.floor(x0); x < x0 + w; x += 2) if (k.wet(x, y)) return true;
    return false;
  };

  k.glow = (x, y, c, a = 1) => lights.push([Math.round(x), Math.round(y), c, a]);
  k.pool = (x, y, r, c, amt = 0.45) => pools.push({ x, y, r, c, k: amt });
  k.shadowRect = (x, y, w, h, f = 0.58) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) img().tint(x + i, y + j, f);
  };
  k.shadowEllipse = (cx, cy, rx, ry, f = 0.6) => {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
      for (let x = Math.floor(cx - rx); x <= cx + rx; x++) if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) img().tint(x, y, f);
  };
  k.fill = (x0, y0, w, h, ramp, seed2, scale = 5) => {
    for (let y = Math.floor(y0); y < y0 + h; y++)
      for (let x = Math.floor(x0); x < x0 + w; x++) img().set(x, y, rampColor(ramp, 0.2 + fbm(x, y, { seed: seed2, scale, octaves: 2 }) * 0.65, x, y));
  };
  k.poly = (pts, c, a = 1) => {
    const lo = Math.max(0, Math.floor(Math.min(...pts.map((p) => p[1]))));
    const hi = Math.min(L - 1, Math.ceil(Math.max(...pts.map((p) => p[1]))));
    for (let y = lo; y <= hi; y++) {
      const hits = [];
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [x0, y0] = pts[i];
        const [x1, y1] = pts[j];
        if (y0 > y !== y1 > y) hits.push(x0 + ((y - y0) * (x1 - x0)) / (y1 - y0));
      }
      hits.sort((a2, b) => a2 - b);
      for (let q = 0; q < hits.length; q += 2)
        for (let x = Math.ceil(hits[q]); x <= hits[q + 1]; x++) (typeof c === 'function' ? img().set(x, y, c(x, y), a) : img().set(x, y, c, a));
    }
  };

  /** Draw into a frame of its own (graded like its row of the strip): a mover, a light, a ripple. */
  k.capture = (x0, y0, w, h, draw, u = U(y0 + h / 2)) => {
    const keep = st.img;
    const nl = lights.length;
    const np = pools.length;
    st.img = new Window(x0, y0, w, h);
    draw();
    const out = st.img;
    st.img = keep;
    const lit = lights.splice(nl);
    const cast = pools.splice(np);
    tod.frame(out, u);
    for (const pl of cast) applyPool(out, pl);
    for (const [x, y, c, a] of lit) out.set(x, y, c, a);
    return kit.frame(out);
  };
  /** A small hand-drawn frame: fn(r) paints a w x h raster, graded for strip position u. */
  k.sprite = (w, h, u, fn, grade = true) => {
    const r = new Raster(w, h);
    fn(r);
    return kit.frame(grade ? tod.frame(r, u) : r);
  };

  // ------------------------------------------------------------ nature
  /** A tree crown recoloured with its own palette, shadow thrown to the lower right. */
  k.tree = (cx, cy, r, palette, seed2, kind = 'broadleaf') => {
    const pts = crownPixels(kind, Math.round(cx), Math.round(cy), r, rng(seed2), seed2 & 1023);
    const ramp = RAMPS[kind];
    const off = Math.round(2 + r * 0.3);
    objects.push({
      y: cy + r * 0.6,
      shadow: () => {
        for (const p of pts) img().tint(p.x + off, p.y + off, 0.6);
      },
      draw: () => {
        for (const p of pts) img().set(p.x, p.y, palette[Math.min(palette.length - 1, Math.max(0, ramp.indexOf(p.c)))]);
      },
    });
  };
  k.palm = (cx, cy, r, seed2) => {
    const pts = palmPixels(Math.round(cx), Math.round(cy), r, rng(seed2));
    objects.push({
      y: cy + 2,
      shadow: () => {
        for (const p of pts) img().tint(p.x + 3, p.y + 3, 0.65);
      },
      draw: () => {
        for (const p of pts) img().set(p.x, p.y, mix(p.c, 0x1a3a30, 0.2));
      },
    });
  };
  /** A loose grove: n trees inside x0..x1, u0..u1, avoiding reserved ground and water. */
  k.grove = (x0, x1, u0, u1, n, pals, seed2, rMin = 3.5, rMax = 6.5, kind = 'broadleaf') => {
    const g = rng(seed2);
    for (let i = 0; i < n; i++) {
      const x = x0 + g() * (x1 - x0);
      const u = u0 + g() * (u1 - u0);
      const r = rMin + g() * (rMax - rMin);
      const y = Y(u);
      if (k.anyRes(x - r * 0.5, y - r * 0.5, r, r) || k.wet(Math.round(x), y)) continue;
      const pal = pals[Math.floor(g() * pals.length)];
      k.tree(x, y, r, pal, seed2 * 7 + i * 131, pal.kind ?? kind);
    }
  };
  /** Dense forest: crowns packed edge to edge in rows, darker in the gaps. */
  k.forest = (x0, x1, u0, u1, pals, seed2, rMin = 5, rMax = 9, keep = () => true) => {
    const g = rng(seed2);
    for (let u = u0; u < u1; u += rMin * 1.1) {
      for (let x = x0 + g() * 6; x < x1; x += rMin * 1.3 + g() * 4) {
        const xx = x + (g() - 0.5) * 5;
        const uu = u + (g() - 0.5) * 5;
        const r = rMin + g() * (rMax - rMin);
        const y = Y(uu);
        if (!keep(xx, uu) || k.isRes(Math.round(xx), y) || k.wet(Math.round(xx), y)) continue;
        const pal = pals[Math.floor(g() * pals.length)];
        k.tree(xx, y, r, pal, Math.floor(g() * 1e6), pal.kind ?? 'broadleaf');
      }
    }
  };

  // ------------------------------------------------------------ street furniture and people
  k.streetLamp = (x, u, c = 0xfff0c8, tall = 6) => {
    const y = Y(u);
    objects.push({
      y: y + 1,
      shadow: () => k.shadowRect(x + 1, y - 2, 1, 3, 0.6),
      draw: () => {
        img().rect(x, y - tall + 1, 1, tall, 0x3a3e46);
        img().set(x, y - tall, 0x5a5e66);
        k.glow(x, y - tall, c, 0.9);
        k.pool(x, y - tall + 2, 7, C.lamp, 0.06 + night(u) * 0.28);
      },
    });
  };
  k.stoneLantern = (x, u, lit = true) => {
    const y = Y(u);
    objects.push({
      y: y + 2,
      shadow: () => k.shadowRect(x + 1, y, 3, 3, 0.65),
      draw: () => {
        img().rect(x - 1, y - 2, 3, 4, C.granite[2]);
        img().rect(x - 2, y - 3, 5, 1, C.granite[3]);
        img().set(x, y - 4, C.granite[4]);
        img().set(x + 1, y - 1, C.granite[1]);
        if (lit) {
          k.glow(x, y - 1, 0xffcc70, 0.9);
          k.pool(x, y - 1, 6, C.lamp, 0.1 + night(u) * 0.22);
        }
      },
    });
  };
  /** People standing about: a dark head over a coat, a soft shadow. */
  k.crowd = (x0, y0, w, h, n, cols = COATS) => {
    for (let i = 0; i < n; i++) {
      const x = Math.round(x0 + rand() * w);
      const y = Math.round(y0 + rand() * h);
      if (k.wet(x, y)) continue;
      img().set(x + 1, y + 1, 0x1e1e26, 0.45);
      img().set(x, y, rand() < 0.65 ? rand.pick(cols) : 0x3a3a4a);
      img().set(x, y - 1, rand() < 0.12 ? 0xe8e0d0 : 0x2a2024);
    }
  };
  k.walker = (c, f, u, hat) => k.sprite(2, 4, u, (r) => {
    r.set(0, 0, hat ?? 0x2a2026);
    r.set(0, 1, c);
    r.set(0, 2, f ? scaleColor(c, 0.75) : c);
    if (f) r.set(1, 2, scaleColor(c, 0.6));
    r.set(1, 3, 0x101018, 0.4);
  });
  /** n people strolling about inside an ellipse. */
  k.strollers = (x, u, rx, ry, n, opt = {}) => {
    const cols = opt.cols ?? COATS;
    for (let i = 0; i < n; i++) {
      const c = cols[(i * 3 + Math.floor(x + u)) % cols.length];
      const g = Math.round(u / 400) * 400;
      kit.wander(x, u, rx, ry, [k.walker(c, 0, g, opt.hat), k.walker(c, 1, g, opt.hat)], { n: 1, sp: opt.sp ?? 4, turn: 'flip', fps: 3, idle: opt.idle ?? 0.6 });
    }
  };
  /** People walking to and fro along a line. */
  k.walkers = (pts, n, u, opt = {}) => {
    const cols = opt.cols ?? COATS;
    const f = [];
    for (let i = 0; i < n; i++) {
      const c = cols[(i * 5 + Math.floor(pts[0][0] + u)) % cols.length];
      f.push([k.walker(c, 0, u, opt.hat), k.walker(c, 1, u, opt.hat)]);
    }
    kit.path(pts, f, { sp: opt.sp ?? 4, n, gap: opt.gap ?? 23, mode: 'pp', hold: opt.hold ?? 3, turn: 'flip', fps: 3, cars: 1 });
  };

  // ------------------------------------------------------------ architecture in 3/4
  /**
   * A tiled roof from above in 3/4: north slope lit, ridge, south slope in tile courses, hipped ends lit on
   * the left and shaded on the right, eave line, a shadow under the eave. opt: ridge, hip, gable ('tri' |
   * 'kara'), gw, gx, crest, curl (Chinese upturned eave corners), courses (false: smooth metal or slate).
   */
  k.roof = (x0, y0, w, h, ramp, opt = {}) => {
    const n = ramp.length;
    const ry = y0 + Math.max(1, Math.round(h * (opt.ridgeAt ?? 0.32)));
    const hipW = opt.hip === false ? 0 : Math.max(2, Math.round(Math.min(w * 0.18, h * 0.7)));
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++) {
        const lx = x - x0;
        const rx = x0 + w - 1 - x;
        let c;
        if (y < ry) c = ramp[n - 2];
        else {
          const t = (y - ry) / Math.max(1, y0 + h - ry);
          c = rampColor(ramp.slice(1, n - 1), 0.85 - t * 0.6, x, y);
          if (opt.courses !== false && (y - ry) % 2 === 1) c = scaleColor(c, 0.82);
          if (opt.courses !== false && lx & 1 && (y - ry) % 2 === 0) c = scaleColor(c, 1.06);
        }
        const dy = Math.abs(y - ry);
        if (hipW && lx < hipW - Math.floor(dy * 0.4)) c = ramp[n - 1];
        if (hipW && rx < hipW - Math.floor(dy * 0.4)) c = ramp[0];
        if (y === y0 + h - 1) c = ramp[n - 1];
        img().set(x, y, c);
      }
    if (opt.ridge !== false) {
      img().rect(x0 + hipW - 1, ry, w - hipW * 2 + 2, 1, ramp[0]);
      for (let i = 0; i < hipW; i++) {
        img().set(x0 + hipW - 1 - i, ry + Math.round(i * 0.9), ramp[0]);
        img().set(x0 + w - hipW + i, ry + Math.round(i * 0.9), ramp[0]);
      }
      if (opt.ridgeC) img().rect(x0 + hipW, ry - 1, w - hipW * 2, 1, opt.ridgeC);
    }
    if (opt.curl) {
      // the upturned corners of a Chinese roof, with a little gold ornament on each end of the ridge
      for (const [cx, dir] of [[x0 - 1, -1], [x0 + w, 1]]) {
        img().set(cx, y0 + h - 2, ramp[n - 1]);
        img().set(cx + dir, y0 + h - 3, ramp[n - 1]);
        img().set(cx + dir, y0 + h - 4, ramp[n - 2]);
      }
      if (opt.ridge !== false) {
        img().set(x0 + hipW - 2, ry - 1, C.gold);
        img().set(x0 + w - hipW + 1, ry - 1, C.gold);
      }
    } else {
      img().set(x0 - 1, y0 + h - 2, ramp[n - 1]);
      img().set(x0 + w, y0 + h - 2, ramp[1]);
    }
    if (opt.gable) {
      const gw = opt.gw ?? Math.round(w * 0.32);
      const gx = Math.round(x0 + (opt.gx ?? w / 2));
      const gh = Math.round(gw / 2);
      for (let j = 0; j <= gh; j++) {
        const yy = y0 + h - 2 - j;
        const half = opt.gable === 'kara' ? Math.round(gw / 2 - (j * j) / Math.max(1, gh)) : gw / 2 - j;
        if (half < 0) break;
        for (let xx = Math.round(gx - half); xx <= Math.round(gx + half); xx++) {
          const edge = Math.abs(xx - gx) >= half - 0.5;
          img().set(xx, yy, edge ? ramp[0] : opt.gableFill ?? (j < 2 ? C.plaster[2] : C.plaster[1]));
        }
      }
    }
    for (let x = x0; x < x0 + w; x++) img().tint(x, y0 + h, 0.66);
  };

  /** The windows of a front: rows of panes, lit at random towards night (warm or cool). */
  k.panes = (x0, y0, w, h, u, opt = {}) => {
    const bay = opt.bay ?? 4;
    const row = opt.row ?? 4;
    const lit = opt.lit ?? 0.15 + night(u) * 0.55;
    const pw = opt.pw ?? 2;
    const ph = opt.ph ?? 2;
    for (let y = y0 + 1; y + ph <= y0 + h; y += row)
      for (let x = x0 + 1; x + pw <= x0 + w; x += bay) {
        const on = rand() < lit;
        const c = on ? (rand() < 0.75 ? opt.warm ?? C.warm : C.cool) : opt.dark ?? 0x2a3440;
        img().rect(x, y, pw, ph, c);
        if (on) {
          for (let i = 0; i < pw; i++) k.glow(x + i, y, c, 0.55 + night(u) * 0.4);
          if (opt.sill !== false) img().set(x, y + ph, scaleColor(opt.wall ?? 0xc0b8a8, 1.1));
        }
      }
  };

  /**
   * A house or shop in 3/4: a roof (rh rows) over a front (fh rows). style: 'jp' (tiled, timber and plaster),
   * 'west' (hipped slate, white walls, sash windows), 'china' (green tiles with curled eaves, red posts),
   * 'block' (flat roof, concrete). Returns { y: foot }.
   */
  k.house = (x, y, w, rh, fh, style = 'jp', opt = {}) => {
    const u = U(y);
    const wall = opt.wall ?? (style === 'west' ? C.cream[3] : style === 'china' ? rand.pick([0x8a3a32, 0xa8483a, 0x7a5a48, 0xd8c8a8]) : rand.pick(C.walls));
    const ramp = opt.ramp ?? (style === 'west' ? C.slate : style === 'china' ? (rand() < 0.6 ? C.chinaGreen : C.redTile) : style === 'block' ? null : C.kawara);
    const roofC = opt.roofC ?? rand.pick(C.roofs);
    const lit = 0.12 + night(u) * 0.6;
    const seedBits = Array.from({ length: 64 }, () => rand());
    const by = y + rh + fh;
    objects.push({
      y: by + (opt.bias ?? 0),
      shadow: () => k.shadowRect(x + 3, y + 3, w, rh + fh, 0.55),
      draw: () => {
        const im = img();
        // front
        for (let yy = y + rh; yy < by; yy++)
          for (let xx = x; xx < x + w; xx++) {
            let c = wall;
            if (xx === x + w - 1) c = scaleColor(wall, 0.78);
            else if (xx === x) c = scaleColor(wall, 1.06);
            if (yy === y + rh) c = scaleColor(wall, 0.6);
            im.set(xx, yy, c);
          }
        if (style === 'jp') {
          // timber posts, a plastered upper floor, lattice below
          for (let xx = x; xx < x + w; xx += opt.bay ?? 5) im.rect(xx, y + rh, 1, fh, C.oldWood[1]);
          if (fh >= 6) {
            im.rect(x, y + rh + Math.floor(fh / 2), w, 1, C.oldWood[0]);
            for (let xx = x + 1; xx < x + w - 1; xx++) if (xx % 2) im.set(xx, by - 2, C.oldWood[2]);
          }
        } else if (style === 'china') {
          for (const xx of [x, x + w - 1, ...(w > 14 ? [x + Math.floor(w / 2)] : [])]) im.rect(xx, y + rh, 1, fh, C.vermilion[2]);
          im.rect(x, y + rh + 1, w, 1, C.gold);
        } else if (style === 'west') {
          for (let xx = x + 1; xx < x + w - 1; xx += 4) im.rect(xx, y + rh + 1, 1, fh - 1, scaleColor(wall, 0.9));
        }
        let i = 0;
        for (let yy = y + rh + 2; yy + 2 <= by - (fh > 5 ? 2 : 0); yy += 3)
          for (let xx = x + 2; xx + 2 <= x + w - 1; xx += style === 'west' ? 4 : 3) {
            const on = seedBits[i++ % 64] < lit;
            const c = on ? (seedBits[(i * 7) % 64] < 0.8 ? C.warm : C.cool) : style === 'west' ? 0x3c4c5c : 0x2a2a32;
            im.rect(xx, yy, style === 'west' ? 2 : 1, 2, c);
            if (on) k.glow(xx, yy, c, 0.5 + night(u) * 0.45);
          }
        if (opt.door !== false && fh >= 4) {
          const dx = x + (opt.doorX ?? Math.floor(w / 2) - 1);
          im.rect(dx, by - 3, 2, 3, style === 'china' ? 0xe8a040 : 0x3a2a24);
          if (night(u) > 0.3) k.glow(dx, by - 2, C.warm, 0.6);
        }
        if (opt.noren) {
          for (let xx = x + 1; xx < x + w - 1; xx++) im.set(xx, by - 3, (xx >> 1) % 2 ? opt.noren : scaleColor(opt.noren, 0.7));
        }
        // roof
        if (style === 'block') {
          for (let yy = y; yy < y + rh; yy++)
            for (let xx = x; xx < x + w; xx++) {
              let c = roofC;
              if (yy === y || xx === x) c = scaleColor(roofC, 1.18);
              else if (xx === x + w - 1 || yy === y + rh - 1) c = scaleColor(roofC, 0.75);
              else if (fbm(xx, yy, { seed: 7, scale: 3 }) > 0.68) c = scaleColor(roofC, 0.92);
              im.set(xx, yy, c);
            }
          if (w > 9 && rh > 6) {
            im.rect(x + 2, y + 2, 2, 2, 0xb8bcc0);
            im.set(x + 2, y + 4, 0x4a4e54);
            im.disc(x + w - 4, y + 3, 1.8, 0xc8ccd0);
          }
        } else k.roof(x - 1, y, w + 2, rh, ramp, { curl: style === 'china', courses: style !== 'west', ridgeC: style === 'china' ? C.vermilion[1] : undefined, ...opt.roof });
        opt.extra?.(by);
      },
    });
    if (opt.reserve !== false) k.reserve(x - 1, y - 1, w + 2, rh + fh + 2);
    return { y: by };
  };

  /** Fill a block (x0..x1, u0..u1, foot at u0) with houses in rows, facing south. */
  k.block = (x0, x1, u0, u1, style = 'jp', opt = {}) => {
    const rowH = opt.rowH ?? 22;
    for (let u = u0; u + 12 <= u1; u += rowH) {
      const h = Math.min(rowH - 1, u1 - u);
      let x = x0;
      while (x < x1 - 6) {
        let w = Math.round((opt.w?.[0] ?? 10) + rand() * ((opt.w?.[1] ?? 18) - (opt.w?.[0] ?? 10)));
        if (x1 - x - w < 7) w = x1 - x;
        const rh = Math.max(5, Math.round(h * (opt.roofK ?? 0.6)));
        const fh = h - rh;
        const yTop = Y(u + h);
        if (!k.anyRes(x, yTop, w, h) && !k.anyWet(x, yTop, w, h)) k.house(x, yTop, w - 1, rh, fh, typeof style === 'function' ? style() : style, opt.house?.());
        x += w + (opt.gap ?? 1);
      }
    }
  };

  /** A plain modern block with a flat roof and lit windows (offices, apartments, warehouses). */
  k.slab = (x, y, w, h, fh, opt = {}) => k.house(x, y, w, h, fh, 'block', opt);

  // ------------------------------------------------------------ roads, tramways, bridges
  /**
   * A road along a polyline of [x, u] points. hw: half width of the carriageway; side: pavement width.
   * opt: tram (track bed in the middle), lanes (centre dashes), surface (stone setts for a walking street),
   * over (paint over water: a bridge deck), kerb colour.
   */
  k.road = (pts, hw, opt = {}) => {
    const side = opt.side ?? 2;
    const reach = hw + side + 1;
    const segs = [];
    let acc = 0;
    for (let i = 1; i < pts.length; i++) {
      const [x0, u0] = pts[i - 1];
      const [x1, u1] = pts[i];
      const len = Math.hypot(x1 - x0, u1 - u0);
      if (len < 1e-6) continue;
      segs.push({ x0, u0, dx: (x1 - x0) / len, du: (u1 - u0) / len, len, s0: acc });
      acc += len;
    }
    const xs = pts.map((p) => p[0]);
    const us = pts.map((p) => p[1]);
    const xa = Math.max(0, Math.floor(Math.min(...xs) - reach));
    const xb = Math.min(W - 1, Math.ceil(Math.max(...xs) + reach));
    const ua = Math.max(0, Math.floor(Math.min(...us) - reach));
    const ub = Math.min(RIDGE, Math.ceil(Math.max(...us) + reach));
    for (let u = ua; u <= ub; u++)
      for (let x = xa; x <= xb; x++) {
        const px = x + 0.5;
        const pu = u + 0.5;
        let best = null;
        for (const s of segs) {
          const t = Math.max(0, Math.min(s.len, (px - s.x0) * s.dx + (pu - s.u0) * s.du));
          const qx = s.x0 + s.dx * t;
          const qu = s.u0 + s.du * t;
          const d = Math.hypot(px - qx, pu - qu);
          if (!best || d < best.d) best = { d, along: s.s0 + t, across: (px - s.x0) * -s.du + (pu - s.u0) * s.dx };
        }
        if (!best || best.d > reach) continue;
        const y = Y(u);
        if (k.wet(x, y) && !opt.over) continue;
        const a = Math.abs(best.across);
        let c;
        if (a > hw + 0.5) {
          if (side <= 0) continue;
          c = rampColor(opt.pave ?? C.walk, fbm(x, y, { seed: 33, scale: 3 }), x, y);
          if (opt.over && a > hw + side - 0.5) c = opt.rail ?? C.granite[3];
        } else if (a > hw - 0.5) c = opt.kerb ?? 0x8a8a8e;
        else if (opt.surface) {
          c = rampColor(opt.surface, 0.3 + fbm(x, y, { seed: 37, scale: 2 }) * 0.6, x, y);
          if ((Math.floor(best.along / 3) + Math.floor(best.across + 20)) % 2 === 0) c = scaleColor(c, 0.92);
        } else if (opt.tram && a <= 5.5) {
          // the stone-set track bed: two tracks (rails at 1.5 and 4.5 either side of the middle)
          c = rampColor(C.tramBed, fbm(x, y, { seed: 35, scale: 4 }), x, y);
          if (Math.floor(best.along) % 3 === 0) c = scaleColor(c, 0.86);
          if (Math.abs(a - 1.5) < 0.5 || Math.abs(a - 4.5) < 0.5) c = 0xc6ced6;
        } else {
          c = rampColor(C.asphalt, fbm(x, y, { seed: 31, scale: 4, octaves: 2 }), x, y);
          if (opt.lanes !== false && !opt.tram && a < 0.6 && hw >= 4 && Math.floor(best.along / 3) % 2 === 0) c = 0xdad6c8;
        }
        img().set(x, y, c);
        reserved[y * W + x] = 1;
      }
  };

  /** A zebra crossing across a road at u (x from x0 to x1), or down a road at x (u0..u1). */
  k.zebraH = (x0, x1, u) => {
    for (let j = 0; j < 3; j++) for (let x = x0; x <= x1; x++) if (x % 2 === 0) img().set(x, Y(u + j), 0xe4e2d8);
  };
  k.zebraV = (x, u0, u1) => {
    for (let i = 0; i < 3; i++) for (let u = u0; u <= u1; u++) if (u % 2 === 0) img().set(x + i, Y(u), 0xe4e2d8);
  };

  // ------------------------------------------------------------ finish
  k.finish = () => {
    for (const o of objects) o.shadow?.();
    objects.sort((a, b) => a.y - b.y);
    for (const o of objects) o.draw();
    for (const fn of k.late) fn();
    const im = st.img;
    const tint = TOD.map(([, , t]) => rgb(t));
    for (let y = 0; y < L; y++) {
      const u = U(y);
      let i = 0;
      while (i < TOD.length - 2 && u >= TOD[i + 1][0]) i++;
      const t = smooth(TOD[i][0], TOD[i + 1][0], u);
      const mul = TOD[i][1].map((m, q) => m + (TOD[i + 1][1][q] - m) * t);
      const tc = tint[i].map((c, q) => c + (tint[i + 1][q] - c) * t);
      const amt = TOD[i][3] + (TOD[i + 1][3] - TOD[i][3]) * t;
      const d = im.data;
      for (let x = 0; x < W; x++) {
        const p = (y * W + x) * 4;
        if (!d[p + 3]) continue;
        for (let q = 0; q < 3; q++) {
          const v = d[p + q] * mul[q];
          d[p + q] = v + (tc[q] - v) * amt;
        }
      }
    }
    for (const pl of pools) applyPool(im, pl);
    for (const [x, y, c, a] of lights) im.set(x, y, c, a);
    return { strip: im, props: kit.pack(), tint: tintTable(L, tod.white) };
  };

  // the water mask, then the ground under everything
  for (let y = 0; y < L; y++) {
    const u = U(y);
    for (let x = 0; x < W; x++) if (isWater(x, u)) water[y * W + x] = 1;
  }
  return k;
}

function applyPool(target, { x, y, r, c, k }) {
  const [cr, cg, cb] = rgb(c);
  for (let yy = Math.floor(y - r); yy <= y + r; yy++)
    for (let xx = Math.floor(x - r); xx <= x + r; xx++) {
      const i = target.idx(xx, yy);
      if (i < 0 || !target.data[i + 3]) continue;
      const dd = Math.hypot(xx + 0.5 - x, yy + 0.5 - y) / r;
      if (dd >= 1) continue;
      const f = (1 - dd) ** 1.6 * k;
      target.data[i] = Math.min(255, target.data[i] + cr * f);
      target.data[i + 1] = Math.min(255, target.data[i + 1] + cg * f);
      target.data[i + 2] = Math.min(255, target.data[i + 2] + cb * f);
    }
}

export { mix, scaleColor, rampColor, fbm, rng, Raster };
