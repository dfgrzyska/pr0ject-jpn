// The Nagasaki strip's drawing kit, at 3x the game's resolution: layout stays in logical units (180 wide, the units of
// the waves and props), drawing happens in fine pixels. A 3/4 view where every building, tree and lamp is an object
// drawn in order of its foot (shadows first), lights and warm light pools added after the time-of-day grade, and
// helpers for the things the city is made of (roads and tramways, roofs, facades, trees, stone, people).
import { Raster, fbm, rng, scaleColor, rgb, mix } from '../../lib/raster.mjs';
import { RAMPS, crownPixels, rampColor, palmPixels } from '../nature.mjs';
import { PropKit, todGrade, tintTable, puff } from '../props.mjs';
import { HiCanvas, hashPx } from '../hires.mjs';
import { W, L, RIDGE, isWater } from './geo.mjs';

export const S = 3;

export const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export const C = {
  sea: [0x0e2c3e, 0x163a4e, 0x1f4a5e, 0x2c5e70, 0x41788a],
  river: [0x123038, 0x1a3e46, 0x245056, 0x33666a],
  grass: [0x2f5232, 0x3d6438, 0x4f7842, 0x678c50],
  lawn: [0x3a6438, 0x4a7840, 0x5e8e4a, 0x78a45a],
  moss: [0x24402c, 0x305234, 0x40663e, 0x547a48],
  forest: [0x10241c, 0x183226, 0x22402e, 0x2e5038],
  rock: [0x4a4842, 0x605d54, 0x7a766a, 0x96917f, 0xb2ac98],
  granite: [0x6e7072, 0x88898a, 0xa2a2a0, 0xbcbcb6, 0xd6d4cc],
  paving: [0x7e7a72, 0x8e8a80, 0x9e9a8e, 0xaeaa9c],
  plaza: [0x9a9486, 0xaca698, 0xbcb6a8, 0xccc6b8],
  gravel: [0x8e866e, 0xa49c82, 0xb8b096, 0xcac2a8],
  stoneSet: [0x6a645a, 0x7c766a, 0x8e887a, 0xa29a88],
  walk: [0x84868a, 0x94969a, 0xa4a6a8],
  asphalt: [0x34363c, 0x3e4046, 0x484a52],
  tramBed: [0x56524c, 0x66625a, 0x76726a],
  concrete: [0x7e7c76, 0x98968e, 0xb2b0a8, 0xcccac2, 0xe2e0d8],
  quay: [0x5e5c58, 0x74726c, 0x8a8880, 0xa09e94],
  sand: [0x9a8e72, 0xb0a486, 0xc4b89a],
  dirt: [0x6a4e34, 0x7e5e40, 0x94704c],
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
  pine: [0x16301f, 0x234629, 0x34603a, 0x4c7a48],
  camphor: [0x1a3422, 0x284a2c, 0x3a6236, 0x527c44],
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
  [1300, [0.98, 0.84, 0.78], 0xff9a6a, 0.1],
  [2400, [0.8, 0.74, 0.86], 0x8a78b8, 0.12],
  [3600, [0.62, 0.64, 0.82], 0x3c4a8a, 0.14],
  [5000, [0.54, 0.58, 0.76], 0x24345e, 0.16],
  [L, [0.46, 0.52, 0.72], 0x18264a, 0.18],
];
/** How much of the night has fallen at u (lamps and windows come on). */
export const night = (u) => smooth(1500, 4200, u);

export function makeCanvas(seed = 8080) {
  const FW = W * S;
  const FH = L * S;
  const st = { img: new HiCanvas(W, L, S) };
  // one stable object that always draws to the current target (the strip, or a frame being captured)
  const img = {
    get hi() {
      return st.img.hi;
    },
    get x0() {
      return st.img.x0;
    },
    get y0() {
      return st.img.y0;
    },
    S,
    set: (x, y, c, a) => st.img.set(x, y, c, a),
    rect: (x, y, w, h, c, a) => st.img.rect(x, y, w, h, c, a),
    tint: (x, y, f) => st.img.tint(x, y, f),
    clear: (x, y) => st.img.clear(x, y),
    alpha: (x, y) => st.img.alpha(x, y),
    get: (x, y) => st.img.get(x, y),
    disc: (cx, cy, r, c, a) => st.img.disc(cx, cy, r, c, a),
    ellipse: (cx, cy, rx, ry, c, a) => st.img.ellipse(cx, cy, rx, ry, c, a),
    line: (x0, y0, x1, y1, c, a, b) => st.img.line(x0, y0, x1, y1, c, a, b),
    light: (x, y, c, a) => st.img.light(x, y, c, a),
    px: (X, Yy, c, a) => st.img.px(X, Yy, c, a),
    tintPx: (X, Yy, f) => st.img.tintPx(X, Yy, f),
    alphaPx: (X, Yy) => st.img.alphaPx(X, Yy),
    getPx: (X, Yy) => st.img.getPx(X, Yy),
    rgbaPx: (X, Yy) => st.img.rgbaPx(X, Yy),
    setRGBAPx: (X, Yy, r, g, b, a) => st.img.setRGBAPx(X, Yy, r, g, b, a),
    fine: (x, y, w, h, fn) => st.img.fine(x, y, w, h, fn),
    linePx: (X0, Y0, X1, Y1, c, a) => st.img.linePx(X0, Y0, X1, Y1, c, a),
    rectPx: (X, Yy, w, h, c, a) => st.img.rectPx(X, Yy, w, h, c, a),
    discPx: (CX, CY, r, c, a) => st.img.discPx(CX, CY, r, c, a),
  };
  const k = { img, FW, FH, S };
  const rand = rng(seed);
  const kit = new PropKit(seed + 1, { artScale: S });
  const frame0 = kit.frame.bind(kit);
  kit.frame = (r, name) => frame0(r.hi ?? r, name); // (frames are drawn on HiCanvases)
  const tod = todGrade(TOD, smooth);
  const objects = [];
  const lights = [];
  const lightsFine = [];
  const pools = [];
  const reserved = new Uint8Array(W * L);
  const water = new Uint8Array(W * L);
  const crownMask = new Uint8Array(FW * FH);
  const crownHash = new Uint8Array(FW * FH);
  const Y = (u) => Math.round(L - u);
  const U = (y) => L - y;
  Object.assign(k, { rand, kit, tod, objects, lights, pools, reserved, water, Y, U, late: [], hashPx, puff });

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

  // ------------------------------------------------------------ the water, cell by cell, and fine along the shores
  for (let y = 0; y < L; y++) {
    const u = U(y);
    for (let x = 0; x < W; x++) if (isWater(x + 0.5, u - 0.5)) water[y * W + x] = 1;
  }
  const fineWater = new Uint8Array(FW * FH);
  for (let y = 0; y < L; y++)
    for (let x = 0; x < W; x++) {
      const v = water[y * W + x];
      let same = true;
      for (let dy = -1; dy <= 1 && same; dy++) for (let dx = -1; dx <= 1; dx++) if (x + dx >= 0 && x + dx < W && y + dy >= 0 && y + dy < L && water[(y + dy) * W + x + dx] !== v) same = false;
      for (let j = 0; j < S; j++)
        for (let i = 0; i < S; i++) {
          const X = x * S + i;
          const Yy = y * S + j;
          fineWater[Yy * FW + X] = same ? v : isWater((X + 0.5) / S, L - (Yy + 0.5) / S) ? 1 : 0;
        }
    }
  const shoreD = new Uint8Array(FW * FH).fill(255);
  {
    const R = 22;
    for (let Yy = 1; Yy < FH - 1; Yy++)
      for (let X = 1; X < FW - 1; X++) {
        const i = Yy * FW + X;
        if (fineWater[i] === fineWater[i + 1] && fineWater[i] === fineWater[i + FW]) continue;
        for (let j = -R; j <= R; j++) {
          const yy = Yy + j;
          if (yy < 0 || yy >= FH) continue;
          for (let q = -R; q <= R; q++) {
            const xx = X + q;
            if (xx < 0 || xx >= FW) continue;
            const d = Math.round(Math.hypot(q, j));
            if (d < shoreD[yy * FW + xx]) shoreD[yy * FW + xx] = d;
          }
        }
      }
  }
  k.fineWater = fineWater;
  k.shoreD = shoreD;
  k.wetPx = (X, Yy) => X >= 0 && X < FW && Yy >= 0 && Yy < FH && fineWater[Yy * FW + X] === 1;

  // ------------------------------------------------------------ light and shade
  k.glow = (x, y, c, a = 1) => lights.push([Math.round(x), Math.round(y), c, a]);
  k.glowPx = (X, Yy, c, a = 1) => lightsFine.push([Math.round(X), Math.round(Yy), c, a]);
  k.pool = (x, y, r, c, amt = 0.45) => pools.push({ x, y, r, c, k: amt });
  k.shadowRect = (x, y, w, h, f = 0.58) => {
    const X0 = Math.round(x * S);
    const Y0 = Math.round(y * S);
    const X1 = Math.round((x + w) * S);
    const Y1 = Math.round((y + h) * S);
    for (let Yy = Y0; Yy < Y1; Yy++)
      for (let X = X0; X < X1; X++) img.tintPx(X, Yy, X === X0 || X === X1 - 1 || Yy === Y0 || Yy === Y1 - 1 ? 1 - (1 - f) * 0.55 : f);
  };
  k.shadowEllipse = (cx, cy, rx, ry, f = 0.6) =>
    img.fine(cx - rx, cy - ry, 2 * rx + 1, 2 * ry + 1, (X, Yy, x, y) => {
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) img.tintPx(X, Yy, f);
      return null;
    });

  // ------------------------------------------------------------ surfaces
  /** A patch of ground in a ramp: broad noise from the game's units, a fine grain over it. */
  k.fill = (x0, y0, w, h, ramp, seed2, scale = 5) =>
    img.fine(x0, y0, w, h, (X, Yy, x, y) => {
      const c = rampColor(ramp, 0.2 + fbm(x, y, { seed: seed2, scale, octaves: 2 }) * 0.65, X, Yy);
      const g = hashPx(X, Yy, seed2);
      return g < 0.07 ? scaleColor(c, 0.9) : g > 0.94 ? scaleColor(c, 1.09) : c;
    });
  k.lawnPx = (X, Yy, n, ramp, leaves = false) => {
    let c = rampColor(ramp, n, X, Yy);
    const t = hashPx(X >> 1, Yy >> 1, 24);
    if (t < 0.13) c = scaleColor(c, 0.85);
    else if (t > 0.9) c = scaleColor(c, 1.14);
    if (leaves) {
      const g = hashPx(X, Yy, 25);
      if (g > 0.993) c = 0xb88a4a;
      else if (g > 0.987) c = 0x8a9a4a;
    }
    return c;
  };
  k.lawnFill = (x0, y0, w, h, ramp, seed2) =>
    img.fine(x0, y0, w, h, (X, Yy, x, y) => {
      const c = k.lawnPx(X, Yy, 0.22 + fbm(x, y, { seed: seed2, scale: 9, octaves: 3 }) * 0.6, ramp);
      const g = hashPx(X, Yy, seed2 + 1);
      return g > 0.9992 ? 0xf4f0e0 : g < 0.0008 ? 0xe0a030 : c;
    });
  /** Flagged stone: flags of `flag` fine pixels with their joints, each its own tone, worn and stained. */
  k.flagPx = (X, Yy, x, y, ramp, seed2, flag = 18, keep = 0.4) => {
    const XX = X + (Math.floor(Yy / flag) % 2) * (flag >> 1);
    if (XX % flag === 0 || Yy % flag === 0) return scaleColor(ramp[0], 0.86);
    const t = hashPx(Math.floor(XX / flag), Math.floor(Yy / flag), seed2);
    let c = rampColor(ramp, 0.3 + t * keep + (fbm(x, y, { seed: seed2, scale: 8 }) - 0.5) * 0.3, X, Yy);
    const g = hashPx(X, Yy, seed2 + 1);
    if (g < 0.05) c = scaleColor(c, 0.92);
    else if (g > 0.97) c = scaleColor(c, 1.05);
    return c;
  };
  k.flagFill = (x0, y0, w, h, ramp, seed2, flag = 18) => img.fine(x0, y0, w, h, (X, Yy, x, y) => k.flagPx(X, Yy, x, y, ramp, seed2, flag));
  /** Setts laid in courses: long stones, staggered, each its own tone. */
  k.settPx = (X, Yy, seed2 = 0, ramp = C.paving) => {
    const r = Math.floor(Yy / 5);
    const XX = X + r * 4;
    if (Yy % 5 === 0 || XX % 9 === 0) return scaleColor(ramp[0], 0.82);
    let c = rampColor(ramp, 0.15 + hashPx(Math.floor(XX / 9), r, seed2 + 81) * 0.75, X, Yy);
    const g = hashPx(X, Yy, seed2 + 82);
    if (g < 0.06) c = scaleColor(c, 0.91);
    else if (g > 0.97) c = scaleColor(c, 1.07);
    return c;
  };
  k.gravelPx = (X, Yy) => {
    const g = hashPx(X, Yy, 141);
    return g < 0.1 ? scaleColor(C.gravel[0], 0.84) : g > 0.92 ? scaleColor(C.gravel[3], 1.06) : rampColor(C.gravel, hashPx(X >> 1, Yy >> 1, 142), X, Yy);
  };
  k.earthPx = (X, Yy, seed2 = 0) => {
    let c = rampColor(C.dirt, 0.2 + hashPx(X >> 2, Yy >> 1, seed2 + 83) * 0.55, X, Yy);
    const g = hashPx(X, Yy, seed2 + 84);
    if (g > 0.985) c = 0xa8884a;
    else if (g < 0.05) c = 0x5e5a50;
    else if (g < 0.12) c = scaleColor(c, 0.88);
    return c;
  };
  k.asphaltPx = (X, Yy) => {
    const g = hashPx(X, Yy, 38);
    const c = rampColor(C.asphalt, 0.2 + hashPx(X >> 3, Yy >> 3, 31) * 0.5, X, Yy);
    return g < 0.08 ? scaleColor(c, 0.9) : g > 0.96 ? scaleColor(c, 1.14) : c;
  };
  k.pavePx = (X, Yy, ramp = C.walk) => {
    if (X % 6 === 0 || Yy % 6 === 0) return scaleColor(ramp[0], 0.84);
    let c = rampColor(ramp, 0.2 + hashPx(X >> 2, Yy >> 2, 34) * 0.7, X, Yy);
    if (hashPx(X >> 3, Yy >> 3, 32) < 0.05) c = scaleColor(c, 0.9);
    return c;
  };
  /** A clipped polygon of logical [x, y] points, filled in fine pixels. c: colour or fn(X, Yy). */
  k.poly = (pts, c, a = 1) => {
    const lo = Math.floor(Math.min(...pts.map((p) => p[1])) * S);
    const hi = Math.ceil(Math.max(...pts.map((p) => p[1])) * S);
    for (let Yy = lo; Yy <= hi; Yy++) {
      const y = (Yy + 0.5) / S;
      const hits = [];
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [x0, y0] = pts[i];
        const [x1, y1] = pts[j];
        if (y0 > y !== y1 > y) hits.push(x0 + ((y - y0) * (x1 - x0)) / (y1 - y0));
      }
      hits.sort((a2, b) => a2 - b);
      for (let q = 0; q + 1 < hits.length; q += 2)
        for (let X = Math.ceil(hits[q] * S); X <= hits[q + 1] * S; X++) img.px(X, Yy, typeof c === 'function' ? c(X, Yy) : c, a);
    }
  };

  /** Draw into a frame of its own (graded like its row of the strip): a mover, a light, a ripple. */
  k.capture = (x0, y0, w, h, draw, u = U(y0 + h / 2)) => {
    const keep = st.img;
    const nl = lights.length;
    const nf = lightsFine.length;
    const np = pools.length;
    st.img = new HiCanvas(w, h, S, x0, y0);
    draw();
    const out = st.img;
    st.img = keep;
    const lit = lights.splice(nl);
    const litFine = lightsFine.splice(nf);
    const cast = pools.splice(np);
    tod.frame(out, u);
    for (const pl of cast) applyPool(out, pl);
    for (const [x, y, c, a] of lit) out.light(x, y, c, a);
    for (const [X, Yy, c, a] of litFine) out.px(X, Yy, c, a);
    return kit.frame(out);
  };
  /** A small hand-drawn frame: fn(r) paints a w x h canvas (r.px in fine pixels), graded for strip position u. */
  k.sprite = (w, h, u, fn, grade = true) => {
    const r = new HiCanvas(w, h);
    fn(r);
    return kit.frame(grade ? tod.frame(r, u) : r);
  };

  // ------------------------------------------------------------ nature
  /** A tree crown recoloured with its own palette, leaves flecked, shadow thrown to the lower right; it sways. */
  k.tree = (cx, cy, r, palette, seed2, kind = 'broadleaf') => {
    const CX = Math.round(cx) * S + 1;
    const CY = Math.round(cy) * S + 1;
    const pts = crownPixels(kind, CX, CY, r * S, rng(seed2), seed2 & 1023);
    const ramp = RAMPS[kind];
    const off = Math.round((2 + r * 0.3) * S);
    objects.push({
      y: cy + r * 0.6,
      shadow: () => {
        for (const p of pts) img.tintPx(p.x + off, p.y + off, 0.6);
      },
      draw: () => {
        const inCrown = new Set(pts.map((p) => p.x * 65536 + p.y));
        for (const p of pts) {
          const q = Math.max(0, ramp.indexOf(p.c));
          let c = palette[Math.min(palette.length - 1, q)];
          if (!inCrown.has(p.x * 65536 + p.y + 1) || !inCrown.has((p.x + 1) * 65536 + p.y)) c = scaleColor(c, 0.78);
          const g = hashPx(p.x >> 1, p.y >> 1, seed2 & 255);
          if (g > 0.86) c = scaleColor(c, 1.14);
          else if (g < 0.12) c = scaleColor(c, 0.88);
          img.px(p.x, p.y, c);
          if (p.x >= 0 && p.x < FW && p.y >= 0 && p.y < FH) crownMask[p.y * FW + p.x] = 1 + (seed2 % 15);
        }
        for (const p of pts) {
          if (p.x < 0 || p.x >= FW || p.y < 0 || p.y >= FH) continue;
          const q = img.rgbaPx(p.x, p.y);
          if (q) crownHash[p.y * FW + p.x] = (q[0] ^ (q[1] << 1) ^ (q[2] << 2)) & 255;
        }
      },
    });
  };
  k.palm = (cx, cy, r, seed2) => {
    const pts = palmPixels(Math.round(cx) * S + 1, Math.round(cy) * S + 1, r * S, rng(seed2));
    objects.push({
      y: cy + 2,
      shadow: () => {
        for (const p of pts) img.tintPx(p.x + 9, p.y + 9, 0.65);
      },
      draw: () => {
        for (const p of pts) img.px(p.x, p.y, mix(p.c, 0x1a3a30, 0.2));
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
        const pick = g();
        const sd = Math.floor(g() * 1e6);
        if (!keep(xx, uu) || k.isRes(Math.round(xx), y) || k.wet(Math.round(xx), y)) continue;
        const pal = pals[Math.floor(pick * pals.length)];
        k.tree(xx, y, r, pal, sd, pal.kind ?? 'broadleaf');
      }
    }
  };
  /** A trained pine: a twisted trunk and its needles in flat pads like clouds, on a little mound of moss. */
  k.niwaki = (x, u, sz = 1, seed2 = 1) => {
    const y = Y(u);
    const CX = x * S + 1;
    const CY = y * S;
    const g = rng(seed2 * 77 + x * 13 + u);
    const n = 4 + Math.floor(g() * 2);
    const pads = [[CX, CY - 16 * sz, 8 * sz]];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.283 + g();
      const R = (7 + g() * 4) * sz;
      pads.push([CX + Math.cos(a) * R, CY - 9 * sz + Math.sin(a) * R * 0.5, (5 + g() * 3) * sz]);
    }
    pads.sort((p, q) => q[1] - p[1]);
    objects.push({
      y: y + 1,
      shadow: () => {
        for (const [px, py, r] of pads)
          for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if ((i / r) ** 2 + (j / (r * 0.62)) ** 2 <= 1) img.tintPx(Math.round(px + i + 8 * sz), Math.round(py + j + 13 * sz), 0.8);
      },
      draw: () => {
        for (let j = -4; j <= 4; j++)
          for (let i = -9; i <= 9; i++) {
            if ((i / 9) ** 2 + (j / 4) ** 2 > 1) continue;
            img.px(CX + i, CY + j, rampColor(C.moss, 0.65 - (i + j) * 0.035 + (hashPx(i, j, seed2) - 0.5) * 0.3, CX + i, CY + j));
          }
        for (let j = 0; j < 14 * sz; j++) {
          const ox = Math.round(Math.sin(j * 0.45) * 1.6);
          img.px(CX + ox - 1, CY - j, 0x6a4a34);
          img.px(CX + ox, CY - j, 0x4a3224);
          img.px(CX + ox + 1, CY - j, 0x2e2018);
        }
        for (const [px, py] of pads) img.linePx(CX, CY - 8 * sz, Math.round(px), Math.round(py), 0x3a2a1e);
        for (const [px, py, r] of pads)
          for (let j = -r; j <= r; j++)
            for (let i = -r; i <= r; i++) {
              const qx = i / r;
              const qy = j / (r * 0.62);
              if (qx * qx + qy * qy > 1) continue;
              const XX = Math.round(px + i);
              const YY = Math.round(py + j);
              const t = 0.62 - qx * 0.32 - qy * 0.42 + (hashPx(XX >> 1, YY, 149) - 0.5) * 0.35;
              img.px(XX, YY, rampColor(C.pine, Math.max(0.02, Math.min(0.98, t)), XX, YY));
            }
      },
    });
    if (x >= 0 && x < W) k.reserve(x - 2, y - 2, 4, 4);
  };
  /** A clipped hedge between two u's: lit along its upper edge, a shade at its foot, a flower here and there. */
  k.hedge = (x0, x1, u0, u1, seed2 = 1, flower = 0xe85a70, rate = 0.988) => {
    img.fine(x0, Y(u1), x1 - x0, u1 - u0, (X, Yy, x, y) => {
      const t = (y - Y(u1)) / Math.max(1, u1 - u0);
      const g = hashPx(X >> 1, Yy >> 1, seed2);
      const c = rampColor(C.camphor, Math.max(0.05, Math.min(0.98, 0.92 - t * 0.75 + (g - 0.5) * 0.35)), X, Yy);
      return hashPx(rate < 0.9 ? X >> 1 : X, rate < 0.9 ? Yy >> 1 : Yy, seed2 + 1) > rate ? (hashPx(X >> 1, Yy >> 1, seed2 + 2) < 0.3 ? 0xf8e0ea : flower) : c;
    });
    for (let X = x0 * S; X < x1 * S; X++) for (let j = 0; j < 4; j++) img.tintPx(X, Y(u0) * S + j, 0.66 + j * 0.07);
    k.reserve(x0, Y(u1), x1 - x0, u1 - u0);
  };
  /** A boulder at fine (CX, CY), lit from the top left, sitting in its own shadow. */
  k.rockPx = (CX, CY, r, ramp = C.rock, seed2 = 0) => {
    for (let Yy = Math.floor(CY - r); Yy <= CY + r + 2; Yy++)
      for (let X = Math.floor(CX - r); X <= CX + r + 2; X++) if (((X + 0.5 - CX - 1.5) / r) ** 2 + ((Yy + 0.5 - CY - 1.5) / r) ** 2 <= 1) img.tintPx(X, Yy, 0.74);
    for (let Yy = Math.floor(CY - r); Yy <= CY + r; Yy++)
      for (let X = Math.floor(CX - r); X <= CX + r; X++) {
        const dx = (X + 0.5 - CX) / r;
        const dy = (Yy + 0.5 - CY) / r;
        const lump = (hashPx(X >> 1, Yy >> 1, seed2) - 0.5) * 0.35;
        if (dx * dx + dy * dy + lump * 0.5 > 1) continue;
        img.px(X, Yy, rampColor(ramp, Math.max(0, Math.min(0.98, 0.5 - dx * 0.5 - dy * 0.5 + lump)), X, Yy));
      }
  };
  /** A rock outcrop as an object: a lumpy outline, facets catching the light, cracks, moss on its top. */
  k.boulder = (bx, bu, rx, ry, seed2, moss = 0.5, ramp = C.rock) => {
    const by = Y(bu);
    const sc = Math.max(2.4, rx * 0.3);
    objects.push({
      y: by + ry,
      shadow: () => k.shadowEllipse(bx + 3, by + 3, rx, ry * 0.8, 0.6),
      draw: () =>
        img.fine(bx - rx - 2, by - ry - 2, 2 * rx + 4, 2 * ry + 4, (X, Yy, x, y) => {
          const dx = x - bx;
          const dy = y - by;
          const d = (dx / rx) ** 2 + (dy / ry) ** 2 + (fbm(x, y, { seed: seed2 + 800, scale: rx * 0.7, octaves: 2 }) - 0.5) * 0.7;
          if (d > 0.84) return null;
          const h = fbm(x, y, { seed: seed2 + 801, scale: sc, octaves: 3 });
          const h2 = fbm(x + 0.8, y + 0.8, { seed: seed2 + 801, scale: sc, octaves: 3 });
          const sh = 0.5 - (dx / rx) * 0.3 - (dy / ry) * 0.42 + (h - h2) * 6;
          let c = rampColor(ramp, Math.max(0.02, Math.min(0.98, sh)), X, Yy);
          if (Math.abs(fbm(x, y, { seed: seed2 + 802, scale: sc * 1.4 }) - 0.5) < 0.012) c = scaleColor(c, 0.62);
          if (dy < 0 && fbm(x, y, { seed: seed2 + 803, scale: 2.4, octaves: 2 }) > 1.02 - moss * (0.6 - (dy / ry) * 0.5)) c = rampColor(C.moss, 0.3 + hashPx(X >> 1, Yy >> 1, 86) * 0.6, X, Yy);
          if (d > 0.72 && dx + dy > 0) c = scaleColor(c, 0.78);
          const g = hashPx(X, Yy, seed2 & 255);
          return g < 0.07 ? scaleColor(c, 0.9) : g > 0.96 ? scaleColor(c, 1.08) : c;
        }),
    });
    k.reserve(bx - rx * 0.9, by - ry * 0.9, rx * 1.8, ry * 1.8);
  };

  // ------------------------------------------------------------ street furniture and people
  k.streetLamp = (x, u, c = 0xfff0c8) => {
    const y = Y(u);
    const X = Math.round(x * S) + 1;
    const Yy = y * S;
    objects.push({
      y: y + 1,
      shadow: () => {
        for (let q = 0; q < 12; q++) img.tintPx(X + 1 + q, Yy + 1 + Math.floor(q * 0.55), 0.68);
      },
      draw: () => {
        for (let j = -15; j < 1; j++) {
          img.px(X, Yy + j, 0x4a4e56);
          img.px(X + 1, Yy + j, 0x2e323a);
        }
        for (let i = -1; i < 5; i++) img.px(X + i, Yy - 16, 0x4a4e56);
        for (const i of [4, 5]) {
          img.px(X + i, Yy - 15, c);
          k.glowPx(X + i, Yy - 15, c, 0.95);
        }
        k.pool(x, y - 5, 7, C.lamp, 0.08 + night(u) * 0.3);
      },
    });
  };
  k.stoneLantern = (x, u, lit = true) => {
    const y = Y(u);
    const X = Math.round(x * S);
    const Yy = y * S;
    objects.push({
      y: y + 2,
      shadow: () => {
        for (let q = 0; q < 10; q++) for (let t = -1; t <= 1; t++) img.tintPx(X + 3 + q, Yy + 3 + Math.floor(q * 0.55) + t, 0.68);
      },
      draw: () => {
        for (let i = -1; i < 4; i++) for (let j = 5; j < 7; j++) img.px(X + i, Yy + j, j === 5 ? C.granite[3] : C.granite[1]);
        for (let j = 1; j < 5; j++) img.px(X + 1, Yy + j, C.granite[2]);
        for (let j = -2; j < 1; j++) for (let i = -1; i < 4; i++) img.px(X + i, Yy + j, i === 3 ? C.granite[1] : C.granite[2]);
        for (let i = -3; i < 6; i++) img.px(X + i, Yy - 3, i < 1 ? C.granite[4] : C.granite[3]);
        for (let i = -2; i < 5; i++) img.px(X + i, Yy - 4, C.granite[3]);
        img.px(X + 1, Yy - 5, C.granite[4]);
        img.px(X + 1, Yy - 6, C.granite[4]);
        if (lit) {
          k.glowPx(X + 1, Yy - 1, 0xffcc70, 0.95);
          k.glowPx(X + 1, Yy - 2, 0xffe0a0, 0.95);
          k.pool(x, y - 1, 6, C.lamp, 0.12 + night(u) * 0.26);
        } else img.px(X + 1, Yy - 1, 0x2a2622);
      },
    });
  };
  k.bench = (x, y, w = 5) => {
    const X = Math.round(x * S);
    const Yy = Math.round(y * S);
    for (let i = 0; i < w * S; i++) {
      img.px(X + i, Yy, C.wood[3]);
      img.px(X + i, Yy + 1, C.wood[2]);
      img.px(X + i, Yy + 3, C.wood[2]);
      img.px(X + i, Yy + 4, C.wood[0]);
      img.tintPx(X + i + 1, Yy + 6, 0.72);
    }
    for (const i of [1, w * S - 2]) img.px(X + i, Yy + 5, 0x2a2a30);
  };
  /** A wooden notice board on its two posts, under a little roof. */
  k.noticeBoard = (x, u) => {
    const X = x * S;
    const Yb = Y(u) * S;
    objects.push({
      y: Y(u) + 1,
      shadow: () => {
        for (let i = 0; i < 18; i++) img.tintPx(X + i + 2, Yb + 1, 0.72);
      },
      draw: () => {
        for (const i of [1, 15]) for (let j = -15; j < 0; j++) img.px(X + i, Yb + j, C.wood[1]);
        for (let j = -14; j < -5; j++) for (let i = 0; i < 17; i++) img.px(X + i, Yb + j, j === -14 || j === -6 || i === 0 || i === 16 ? C.wood[0] : j % 2 === 0 && i > 2 && i < 14 && hashPx(i, j, x) < 0.7 ? 0x4a4a4a : 0xf0e8d4);
        for (let i = -2; i < 19; i++) {
          img.px(X + i, Yb - 16, C.kawara[3]);
          img.px(X + i, Yb - 15, C.kawara[1]);
        }
      },
    });
  };
  /** A person seen from above in fine pixels: hair or a cap, the face, shoulders and arms, legs, a shadow. */
  k.personPx = (X, Yy, pr, o = {}) => {
    const coat = o.coat ?? pr.pick(COATS);
    const hair = o.cap ?? pr.pick([0x1a1418, 0x2a2024, 0x3a2a20, 0x5a3a28, 0x8a8a8a]);
    for (let i = 0; i < 4; i++) img.px(X + i, Yy + 5, 0x141824, 0.4);
    img.px(X, Yy - 2, hair);
    img.px(X + 1, Yy - 2, scaleColor(hair, 1.2));
    img.px(X + 2, Yy - 2, hair);
    img.px(X, Yy - 1, 0xe8c0a0);
    img.px(X + 1, Yy - 1, 0xf0d0b0);
    img.px(X + 2, Yy - 1, o.cap ? hair : 0xe0b898);
    for (let j = 0; j < 3; j++) for (let i = -1; i < 4; i++) if (!(j === 2 && (i < 0 || i > 2))) img.px(X + i, Yy + j, i < 0 || i > 2 ? scaleColor(coat, 0.75) : i === 0 ? scaleColor(coat, 1.12) : coat);
    const leg = pr() < 0.5 ? 0x2a2a3a : 0x4a4a5a;
    img.px(X, Yy + 3, leg);
    img.px(X + 2, Yy + 3, leg);
    img.px(X, Yy + 4, 0x1a1418);
    img.px(X + 2, Yy + 4, 0x1a1418);
  };
  /** People standing about, painted on the ground now. */
  k.crowd = (x0, y0, w, h, n, cols = COATS) => {
    for (let i = 0; i < n; i++) {
      const x = Math.round(x0 + rand() * w);
      const y = Math.round(y0 + rand() * h);
      if (k.wet(x, y)) continue;
      const coat = rand() < 0.65 ? rand.pick(cols) : 0x3a3a4a;
      const cap = rand() < 0.12 ? 0xe8e0d0 : undefined;
      k.personPx(x * S + (i % 3), y * S + (i % 2), rng(x * 977 + y * 13), { coat, cap });
    }
  };
  /** People standing on something drawn as an object (a deck, a terrace), so they stay on top of it. */
  k.standing = (x0, y0, w, h, n, seed2, cols = COATS) => {
    const g = rng(seed2);
    for (let i = 0; i < n; i++) {
      const x = x0 + g() * w;
      const y = y0 + g() * h;
      const coat = g() < 0.65 ? cols[Math.floor(g() * cols.length)] : 0x3a3a4a;
      const X = Math.round(x * S);
      const Yy = Math.round(y * S);
      objects.push({ y: y + 1.7, draw: () => k.personPx(X, Yy, rng(X * 977 + Yy * 13), { coat }) });
    }
  };
  k.walker = (c, f, u, cap) => {
    const r = new HiCanvas(4, 3);
    const c0 = scaleColor(c, 0.82);
    const hair = cap ?? 0x2a2026;
    r.px(2, 0, hair);
    r.px(3, 0, scaleColor(hair, 1.2));
    r.px(4, 0, hair);
    r.px(2, 1, cap ? hair : 0xe8c0a0);
    r.px(3, 1, 0xf0d0b0);
    r.px(4, 1, 0xe0b898);
    for (let j = 2; j < 5; j++) for (let i = 1; i < 6; i++) if (!(j === 4 && (i < 2 || i > 4))) r.px(i, j, i === 1 || i === 5 ? c0 : i === 2 ? scaleColor(c, 1.12) : c);
    r.px(f ? 2 : 3, 5, 0x2a2a3a);
    r.px(f ? 4 : 3, 6, 0x2a2a3a);
    r.px(f ? 2 : 4, 6, 0x1a1418);
    for (let i = 1; i < 6; i++) r.px(i, 7, 0x141824, 0.35);
    return kit.frame(tod.frame(r, u));
  };
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
  /** A stone stair: treads lit on their nosing, the riser's shade, worn in the middle. In game units. */
  k.stairs = (x, y, w, h, ramp = C.granite) =>
    img.fine(x, y, w, h, (X, Yy) => {
      const q = (Yy - y * S) % 6;
      const a = Math.abs(X - (x + w / 2) * S) / (w * 1.5);
      if (q === 0) return ramp[4];
      if (q >= 4) return q === 5 ? scaleColor(ramp[0], 0.6) : ramp[0];
      const c = a < 0.5 ? ramp[3] : ramp[2];
      return hashPx(X, Yy, 42) < 0.08 ? scaleColor(c, 0.9) : c;
    });
  /** The face of a stone wall: fitted stones in courses, darkening towards the foot, moss in the joints. */
  k.stoneFace = (x0, x1, yTop, h, seed2 = 1, ramp = C.granite) => {
    const r = rng(seed2 * 977 + x0 * 31 + yTop);
    const X0 = Math.round(x0 * S);
    const X1 = Math.round(x1 * S);
    const Y0 = Math.round(yTop * S);
    const H = Math.round(h * S);
    for (let row = 0; row * 6 < H; row++) {
      let X = X0 - Math.floor(r() * 10);
      const rh = Math.min(6, H - row * 6);
      while (X < X1) {
        const sw = 6 + Math.floor(r() * 10);
        const c = ramp[1 + Math.floor(r() * 3)];
        for (let j = 0; j < rh; j++)
          for (let i = 0; i < sw; i++) {
            const XX = X + i;
            if (XX < X0 || XX >= X1) continue;
            let cc = c;
            if (i === sw - 1 || j === rh - 1) cc = scaleColor(ramp[0], 0.82);
            else if (j === 0 || i === 0) cc = scaleColor(c, 1.12);
            cc = scaleColor(cc, 1.06 - ((row * 6 + j) / Math.max(1, H)) * 0.3);
            if ((i === sw - 1 || j === rh - 1) && r() < 0.1) cc = 0x4a6a3a;
            img.px(XX, Y0 + row * 6 + j, cc);
          }
        X += sw;
      }
    }
    for (let X = X0; X < X1; X++) {
      img.px(X, Y0 - 1, ramp[4]);
      img.px(X, Y0 + H, 0x101418, 0.4);
    }
  };

  // ------------------------------------------------------------ architecture in 3/4
  /**
   * A roof from above in 3/4: the north slope lit, the ridge, the south slope in tile courses, hipped ends lit on the
   * left and shaded on the right, an eave with its end tiles and a dark shadow under it. opt: ridge, hip, gable ('tri' |
   * 'kara'), gw, gx, crest, curl (Chinese upturned corners), courses (false: smooth metal or slate), ridgeC, noshi.
   */
  k.roof = (x0, y0, w, h, ramp, opt = {}) => {
    const n = ramp.length;
    const ry = y0 + Math.max(1, Math.round(h * (opt.ridgeAt ?? 0.32)));
    const hipW = opt.hip === false ? 0 : Math.max(2, Math.round(Math.min(w * 0.18, h * 0.7)));
    const X0 = Math.round(x0 * S);
    const X1 = Math.round((x0 + w) * S);
    const Y0 = Math.round(y0 * S);
    const Y1 = Math.round((y0 + h) * S);
    const RY = ry * S + 1;
    const HW = hipW * S;
    const sd = (x0 * 31 + y0) & 1023;
    const south = ramp.slice(1, n - 1);
    for (let Yy = Y0; Yy < Y1; Yy++)
      for (let X = X0; X < X1; X++) {
        const lx = X - X0;
        const rx = X1 - 1 - X;
        let c;
        if (Yy < RY) c = ramp[n - 2];
        else {
          const q = (Yy - RY) / Math.max(1, Y1 - RY);
          const t = 0.85 - q * 0.6;
          const v = Math.max(0, Math.min(0.999, t)) * (south.length - 1);
          c = mix(south[Math.floor(v)], south[Math.min(south.length - 1, Math.floor(v) + 1)], v - Math.floor(v));
        }
        if (opt.courses !== false) {
          const col = (X + ((Yy - Y0) >> 2) % 2) % 3;
          if (col === 0) c = scaleColor(c, 1.13);
          else if (col === 2) c = scaleColor(c, 0.82);
          if ((Yy - Y0) % 4 === 0) c = scaleColor(c, 0.86);
          const t = hashPx(X >> 2, (Yy - Y0) >> 2, sd);
          if (t < 0.08) c = scaleColor(c, 0.9);
          else if (t > 0.94) c = scaleColor(c, 1.1);
        } else {
          // slate or sheet: fine courses, the odd darker slate
          if ((Yy - Y0) % 3 === 0) c = scaleColor(c, 0.9);
          if (hashPx(X >> 2, (Yy - Y0) >> 1, sd) < 0.1) c = scaleColor(c, 0.92);
        }
        const dy = Math.abs(Yy - RY);
        const inset = HW - dy * 0.4;
        if (HW && lx < inset) c = scaleColor(ramp[n - 1], (Yy - Y0) % 3 === 0 ? 0.84 : 1);
        if (HW && rx < inset) c = scaleColor(ramp[0], (Yy - Y0) % 3 === 0 ? 0.84 : 1);
        if (HW && (Math.abs(lx - inset) < 1 || Math.abs(rx - inset) < 1)) c = scaleColor(ramp[n - 1], 1.15);
        if (Yy >= Y1 - 2) c = Yy === Y1 - 1 ? ramp[0] : X % 3 === 0 ? scaleColor(ramp[n - 1], 1.2) : ramp[n - 1];
        img.px(X, Yy, c);
      }
    if (opt.ridge !== false) {
      for (let X = X0 + HW - 2; X < X1 - HW + 2; X++) {
        img.px(X, RY - 1, scaleColor(ramp[n - 1], 1.15));
        img.px(X, RY, ramp[0]);
        img.px(X, RY + 1, scaleColor(ramp[0], 0.8));
        if (opt.noshi) {
          img.px(X, RY - 3, C.plaster[2]);
          img.px(X, RY - 2, C.plaster[1]);
        }
        if (opt.ridgeC) {
          img.px(X, RY - 3, opt.ridgeC);
          img.px(X, RY - 2, scaleColor(opt.ridgeC, 0.8));
        }
      }
      if (HW) for (const ox of [X0 + HW - 3, X1 - HW]) for (let j = -3; j <= 1; j++) for (let i = 0; i < 3; i++) img.px(ox + i, RY + j, j < -1 ? scaleColor(ramp[n - 1], 1.2) : ramp[0]);
    }
    if (opt.curl) {
      // the upturned corners of a Chinese roof, a little gold ornament on each end of the ridge
      for (const [cx, dir] of [[X0 - 1, -1], [X1, 1]]) {
        for (let q = 0; q < 6; q++) {
          img.px(cx + dir * q, Y1 - 3 - Math.round((q * q) / 6), ramp[n - 1]);
          img.px(cx + dir * q, Y1 - 2 - Math.round((q * q) / 6), ramp[1]);
        }
      }
      if (opt.ridge !== false) {
        for (const ox of [X0 + HW - 5, X1 - HW + 3]) {
          img.rectPx(ox, RY - 4, 3, 3, C.gold);
          img.px(ox + 1, RY - 5, C.goldHi);
        }
      }
    } else {
      for (const [X, c] of [[X0 - 2, ramp[n - 1]], [X0 - 1, ramp[n - 1]], [X1, ramp[1]], [X1 + 1, ramp[1]]]) {
        img.px(X, Y1 - 4, c);
        img.px(X, Y1 - 3, scaleColor(c, 0.8));
      }
    }
    if (opt.gable) {
      const gw = opt.gw ?? Math.round(w * 0.32);
      const gx = Math.round(x0 + (opt.gx ?? w / 2));
      const GH = Math.round((gw / 2) * S);
      const GW = gw * S;
      const CX = gx * S + 1;
      const YB = Y1 - 4;
      for (let j = 0; j <= GH; j++) {
        const half = opt.gable === 'kara' ? GW / 2 - (j * j) / Math.max(1, GH) : GW / 2 - j;
        if (half < 0) break;
        for (let X = Math.round(CX - half); X <= Math.round(CX + half); X++) {
          const e = Math.abs(X - CX) - half;
          let c = opt.gableFill ?? (j < S * 2 ? C.plaster[2] : C.plaster[1]);
          if ((X - CX) % 6 === 0 && !opt.gableFill) c = C.plaster[0];
          if (e >= -1.5) c = ramp[0];
          else if (e >= -3) c = ramp[n - 1];
          img.px(X, YB - j, c);
        }
      }
      if (opt.crest) {
        const cy = YB - Math.floor(GH / 2);
        img.discPx(CX, cy, 2.4, C.gold);
        img.px(CX - 1, cy - 1, C.goldHi);
      }
    }
    for (let X = X0; X < X1; X++) for (let j = 0; j < 3; j++) img.tintPx(X, Y1 + j, 0.6 + j * 0.12);
  };

  /** The windows of a front: rows of panes, lit at random towards night (warm or cool), in logical units. */
  k.panes = (x0, y0, w, h, u, opt = {}) => {
    const bay = (opt.bay ?? 4) * S;
    const row = (opt.row ?? 4) * S;
    const lit = opt.lit ?? 0.15 + night(u) * 0.55;
    const pw = (opt.pw ?? 2) * S;
    const ph = (opt.ph ?? 2) * S;
    const X0 = Math.round(x0 * S);
    const Y0 = Math.round(y0 * S);
    const W2 = Math.round(w * S);
    const H2 = Math.round(h * S);
    for (let Yy = Y0 + 2; Yy + ph <= Y0 + H2; Yy += row)
      for (let X = X0 + 2; X + pw <= X0 + W2; X += bay) {
        const on = rand() < lit;
        const c = on ? (rand() < 0.75 ? opt.warm ?? C.warm : C.cool) : opt.dark ?? 0x2a3440;
        for (let j = 0; j < ph; j++)
          for (let i = 0; i < pw; i++) {
            const mull = i === pw >> 1 || j === ph >> 1;
            if (on && !mull) k.glowPx(X + i, Yy + j, c, 0.6 + night(u) * 0.38);
            else img.px(X + i, Yy + j, mull ? 0x5a5e64 : c);
          }
        for (let i = -1; i <= pw; i++) img.px(X + i, Yy + ph, scaleColor(opt.wall ?? 0xc0b8a8, 1.1));
      }
  };

  /**
   * A flat modern roof with what stands on it. Each block is its own: gravel, a roof garden, a stepped-back top storey,
   * a sign on legs, a terrace, or the ordinary fans and tanks. (Its own generator: the rest of the city doesn't shift.)
   */
  const blockRoof = (x, y, w, rh, roofC, wall, u, kindSeed, plain) => {
    const br = rng(x * 131 + y * 17 + kindSeed);
    const X0 = x * S;
    const X1 = (x + w) * S;
    const Y0 = y * S;
    const Y1 = (y + rh) * S;
    let rk = 'std';
    const t = br();
    if (!plain) {
      if (t < 0.13 && w >= 12 && rh >= 10) rk = 'garden';
      else if (t < 0.28 && w >= 13 && rh >= 10) rk = 'setback';
      else if (t < 0.42 && w >= 12) rk = 'sign';
      else if (t < 0.58) rk = 'gravel';
    }
    const adC = [0xd83a2a, 0x2a6ad0, 0xe8c040, 0x2a9a6a, 0xe86aa0, 0xf0f0e8][Math.floor(br() * 6)];
    const adSeed = Math.floor(br() * 999);
    for (let Yy = Y0; Yy < Y1; Yy++)
      for (let X = X0; X < X1; X++) {
        const e = Math.min(X - X0, Yy - Y0);
        const e2 = Math.min(X1 - 1 - X, Y1 - 1 - Yy);
        let c;
        if (e < 2) c = scaleColor(roofC, e === 0 ? 1.25 : 1.12);
        else if (e2 < 2) c = scaleColor(roofC, e2 === 0 ? 0.62 : 0.78);
        else if (e === 2) c = scaleColor(roofC, 0.8);
        else {
          c = roofC;
          if ((X - X0) % 15 === 0 || (Yy - Y0) % 12 === 0) c = scaleColor(roofC, 1.06);
          if (hashPx(X >> 3, Yy >> 3, x + y) > 0.9) c = scaleColor(c, 0.94);
          const g = hashPx(X, Yy, 8);
          if (g < 0.06) c = scaleColor(c, 0.9);
          else if (g > 0.96) c = scaleColor(c, 1.08);
          if (rk === 'gravel') {
            c = scaleColor(mix(roofC, C.granite[1], 0.6), 0.93 + hashPx(X >> 1, Yy >> 1, 9) * 0.12);
            if ((X - X0) % 45 < 2 || (Yy - Y0) % 45 < 2) c = scaleColor(roofC, 0.9);
          }
        }
        img.px(X, Yy, c);
      }
    if (plain) return;
    if (rk === 'garden') {
      const GX0 = X0 + 7;
      const GX1 = X1 - 7;
      const GY0 = Y0 + 7;
      const GY1 = Y1 - 7;
      const midY = Math.round((GY0 + GY1) / 2);
      for (let Yy = GY0; Yy < GY1; Yy++)
        for (let X = GX0; X < GX1; X++) {
          const e = Math.min(X - GX0, GX1 - 1 - X, Yy - GY0, GY1 - 1 - Yy);
          let c;
          if (e < 2) c = e === 0 ? 0x8a8478 : 0xb0a896;
          else if (Math.abs(Yy - midY) < 4) c = (X >> 1) % 3 === 0 ? C.wood[1] : C.wood[2];
          else {
            c = k.lawnPx(X, Yy, 0.3 + hashPx(X >> 3, Yy >> 3, 10) * 0.5, C.lawn);
            if (hashPx(X, Yy, 11) > 0.985) c = [0xf4d040, 0xe85a70, 0xf4f0e0][X % 3];
          }
          img.px(X, Yy, c);
        }
      for (const SY of [GY0 + 8, GY1 - 8])
        for (const SX of [GX0 + 8, GX1 - 8]) {
          img.discPx(SX, SY, 4.2, C.camphor[1]);
          img.discPx(SX - 0.8, SY - 0.8, 3, C.camphor[2]);
          img.px(SX - 1, SY - 2, C.camphor[3]);
        }
      return;
    }
    if (rk === 'setback') {
      const bw = Math.round(w * 0.55 * S);
      const bh = Math.round(rh * 0.45 * S);
      const BX = adSeed % 2 ? X0 + 9 : X1 - 9 - bw;
      const BY = Y0 + 7;
      for (let j = 2; j < bh + 18; j++) for (let i = 2; i < bw + 7; i++) if (i > bw || j > bh + 12) img.tintPx(BX + i, BY + j, 0.72);
      for (let j = 0; j < bh; j++)
        for (let i = 0; i < bw; i++) {
          const e = Math.min(i, j);
          const e2 = Math.min(bw - 1 - i, bh - 1 - j);
          img.px(BX + i, BY + j, e < 2 ? scaleColor(roofC, 1.28) : e2 < 2 ? scaleColor(roofC, 0.72) : scaleColor(roofC, 1.05));
        }
      for (let j = 0; j < 12; j++)
        for (let i = 0; i < bw; i++) {
          const r2 = j % 6;
          img.px(BX + i, BY + bh + j, j < 2 ? scaleColor(wall, 0.55) : r2 >= 2 && r2 <= 4 && i % 6 < 4 && i > 1 && i < bw - 2 ? 0x2e3846 : i > bw - 3 ? scaleColor(wall, 0.8) : wall);
        }
      return;
    }
    if (rk === 'sign') {
      const SX = X0 + 6;
      const SW = X1 - X0 - 12;
      const SY = Y0 + 4;
      const SH = 15;
      for (let i = 6; i < SW; i += 18) for (let j = 0; j < 7; j++) img.px(SX + i, SY + SH + j, 0x4a4e54);
      for (let i = 0; i < SW; i++) for (let j = 0; j < 5; j++) img.tintPx(SX + i + 3, SY + SH + 5 + j, 0.78);
      for (let j = 0; j < SH; j++)
        for (let i = 0; i < SW; i++) {
          const e = Math.min(i, j, SW - 1 - i, SH - 1 - j);
          let c = e === 0 ? 0x24242a : e === 1 ? 0xf0ece0 : adC;
          if (e > 1 && j >= 4 && j < 11 && (i - 4) % 9 < 6) {
            const cell = hashPx(Math.floor((i - 4) / 9), adSeed, 13);
            if (hashPx((i - 4) % 9 >> 1, (j - 4) >> 1, Math.floor(cell * 99)) < 0.6) c = adC === 0xf0f0e8 || adC === 0xe8c040 ? 0x2a2026 : 0xffffff;
          }
          if (night(u) > 0.35 && e > 1) k.glowPx(SX + i, SY + j, c, 0.85);
          else img.px(SX + i, SY + j, c);
        }
      return;
    }
    // the ordinary roof: fans, a tank, a stair hut, solar panels
    const nItems = Math.max(1, Math.floor((w * rh) / 120));
    for (let q = 0; q < nItems; q++) {
      const kind = ['ac', 'ac', 'tank', 'hut', 'solar'][Math.floor(br() * 5)];
      const IX = (x + 2 + Math.floor(br() * Math.max(1, w - 9))) * S;
      const IY = (y + 2 + Math.floor(br() * Math.max(1, rh - 7))) * S;
      if (kind === 'ac') {
        for (let a = 0; a < 2; a++)
          for (let j = 0; j < 8; j++)
            for (let i = 0; i < 7; i++) {
              if (j === 7) {
                img.px(IX + a * 9 + i + 1, IY + j, 0x101018, 0.4);
                continue;
              }
              const d = Math.hypot(i - 3, j - 3.5);
              img.px(IX + a * 9 + i, IY + j, i === 0 || j === 0 ? 0xdadee2 : i === 6 || j === 6 ? 0x7a7e84 : d < 2.6 ? (d < 1 ? 0x8a8e94 : (i + j) % 2 ? 0x3a3e44 : 0x5a5e64) : 0xb8bcc0);
            }
      } else if (kind === 'tank') {
        for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) if (Math.hypot(i - 7, j - 7) < 6) img.tintPx(IX + i + 2, IY + j + 2, 0.6);
        img.discPx(IX + 6, IY + 6, 6, 0x8a8e94);
        img.discPx(IX + 5.5, IY + 5.5, 5, 0xc8ccd0);
        img.discPx(IX + 4.5, IY + 4.5, 2.4, 0xf0f2f4);
      } else if (kind === 'hut') {
        for (let j = 0; j < 15; j++)
          for (let i = 0; i < 18; i++) {
            const top = j < 9;
            let c = top ? (i === 0 || j === 0 ? scaleColor(roofC, 1.14) : i === 17 || j === 8 ? scaleColor(roofC, 0.76) : scaleColor(roofC, 0.94)) : j === 9 ? scaleColor(wall, 0.6) : scaleColor(wall, 0.9);
            if (!top && i >= 7 && i <= 10 && j > 9) c = j === 10 ? 0x4a4a50 : 0x2a2a30;
            img.px(IX + i, IY + j, c);
          }
      } else {
        for (let j = 0; j < 9; j++) for (let i = 0; i < 21; i++) img.px(IX + i, IY + j, i % 7 === 6 || j % 5 === 4 ? 0x7a8aa0 : j % 5 === 0 ? 0x3a4e80 : 0x24346a);
        for (let i = 0; i < 21; i++) img.px(IX + i, IY + 9, 0x101018, 0.45);
      }
    }
  };

  /**
   * A house or shop in 3/4: a roof (rh rows) over a front (fh rows). style: 'jp' (tiled, timber and plaster), 'west'
   * (hipped slate, clapboard, shuttered sashes), 'china' (green tiles with curled eaves, red posts, carved windows),
   * 'block' (flat roof, concrete, rows of windows, a shop on the street). Returns { y: foot }.
   */
  k.house = (x, y, w, rh, fh, style = 'jp', opt = {}) => {
    const u = U(y);
    const wall = opt.wall ?? (style === 'west' ? C.cream[3] : style === 'china' ? rand.pick([0x8a3a32, 0xa8483a, 0x7a5a48, 0xd8c8a8]) : rand.pick(C.walls));
    const ramp = opt.ramp ?? (style === 'west' ? C.slate : style === 'china' ? (rand() < 0.6 ? C.chinaGreen : C.redTile) : style === 'block' ? null : C.kawara);
    const roofC = opt.roofC ?? rand.pick(C.roofs);
    const lit = 0.14 + night(u) * 0.62;
    const seedBits = Array.from({ length: 64 }, () => rand());
    const by = y + rh + fh;
    const X0 = Math.round(x * S);
    const X1 = Math.round((x + w) * S);
    const FY0 = (y + rh) * S;
    const FH2 = fh * S;
    const shopC = [0xc83a2a, 0x2a6a3a, 0x2a4a8a, 0xd8a020, 0x8a2a5a][Math.floor(seedBits[3] * 5)];
    const fv = Math.floor(seedBits[5] * 3);
    objects.push({
      y: by + (opt.bias ?? 0),
      shadow: () => k.shadowRect(x + 3, y + 3, w, rh + fh, 0.55),
      draw: () => {
        for (let j = 0; j < FH2; j++) {
          for (let X = X0; X < X1; X++) {
            const i = X - X0;
            let c = wall;
            if (style === 'jp') {
              const mid = FH2 >> 1;
              const bay = (opt.bay ?? 5) * S;
              if (i % bay < 2) c = i % bay === 0 ? C.oldWood[2] : C.oldWood[0];
              else if (j === mid || j === mid + 1) c = j === mid ? C.oldWood[2] : C.oldWood[0];
              else if (j > mid) {
                // the koshi lattice of the shopfront, its light showing through at night
                const on = seedBits[(Math.floor(i / bay) * 7) & 63] < lit;
                c = i % 3 === 0 ? C.oldWood[1] : on ? 0xe8c070 : 0x2a2622;
              } else if (j >= 3 && j < mid - 1 && i % bay >= 5 && i % bay < bay - 3) {
                // a paper window under the eave
                const on = seedBits[(Math.floor(i / bay) * 5 + 2) & 63] < lit;
                if (i % 3 === 0 || j % 3 === 0) c = C.oldWood[1];
                else if (on) {
                  k.glowPx(X, FY0 + j, 0xffe4a8, 0.5 + night(u) * 0.45);
                  continue;
                } else c = 0xe8e2d4;
              }
            } else if (style === 'china') {
              const mid = FH2 >> 1;
              if (i < 3 || i >= X1 - X0 - 3 || (w > 14 && Math.abs(i - ((X1 - X0) >> 1)) < 2)) c = i % 3 === 0 ? C.vermilion[3] : C.vermilion[1];
              else if (j >= 3 && j < 6) c = (i >> 1) % 2 ? C.gold : 0x2a4a3a;
              else if (j === mid) c = C.vermilion[1];
              else if (j > mid) {
                const on = seedBits[(Math.floor(i / 12) * 3) & 63] < lit + 0.2;
                c = i % 4 === 0 || j % 4 === 0 ? C.vermilion[0] : on ? 0xffc870 : 0x2a1a18;
              } else if (j >= 7 && i % 12 > 2 && i % 12 < 10) {
                const on = seedBits[(Math.floor(i / 12) * 11 + 1) & 63] < lit;
                if (i % 3 === 0 || j % 3 === 0) c = 0x2a1a18;
                else if (on) {
                  k.glowPx(X, FY0 + j, 0xffd080, 0.6 + night(u) * 0.35);
                  continue;
                } else c = 0x4a3a30;
              }
            } else if (style === 'west') {
              if (j % 3 === 0) c = scaleColor(wall, 0.92);
              if (j >= 3 && j < FH2 - 3 && i % 12 >= 3 && i % 12 < 9) {
                const q = i % 12;
                const on = seedBits[(Math.floor(i / 12) * 7 + 3) & 63] < lit;
                if (q === 3 || q === 8) c = 0x3a5a4a;
                else if (j % 5 === 0 || q === 5) c = 0xf0ece0;
                else if (on) {
                  k.glowPx(X, FY0 + j, C.warm, 0.55 + night(u) * 0.4);
                  continue;
                } else c = 0x34404c;
              }
            } else {
              // a block: floors of windows, a shop on the street, the shaded right edge
              const FLOOR = 9;
              const row = j % FLOOR;
              const fl = Math.floor(j / FLOOR);
              const bay2 = (i - 2) % 9;
              const bi = Math.floor((i - 2) / 9);
              c = wall;
              if (i < 2) c = scaleColor(wall, 1.08);
              if (row === 0) c = scaleColor(wall, 0.82);
              const shop = opt.shop !== false && j >= FH2 - 9;
              if (shop) {
                const on = seedBits[(bi * 7) & 63] < lit + 0.25;
                if (j < FH2 - 6) c = (i >> 2) % 2 ? shopC : 0xf0ece0;
                else if (bay2 === 0) c = 0x24242a;
                else if (on) {
                  k.glowPx(X, FY0 + j, C.warm, 0.5 + night(u) * 0.45);
                  continue;
                } else c = 0x3a4a58;
              } else if (i >= 2 && i < X1 - X0 - 2) {
                const inWin = fv === 1 ? row >= 3 && row <= 6 : fv === 2 ? row >= 1 && bay2 >= 3 && bay2 <= 5 : row >= 2 && row <= 6 && bay2 >= 1 && bay2 <= 7;
                if (fv === 2 && bay2 === 0) c = scaleColor(wall, 0.7);
                if (inWin) {
                  const on = seedBits[(fl * 11 + bi) & 63] < lit;
                  const mull = fv === 1 ? bay2 === 0 : bay2 === 4;
                  if (on && !mull) {
                    k.glowPx(X, FY0 + j, bi & 1 ? C.warm : C.cool, 0.6 + night(u) * 0.36);
                    continue;
                  }
                  c = mull ? 0x6a6e74 : row === 2 && bay2 < 4 ? 0x6a7c8c : 0x2e3846;
                }
              }
            }
            if (X >= X1 - 2) c = scaleColor(c, 0.78);
            if (j < 2) c = scaleColor(c, 0.55);
            img.px(X, FY0 + j, c);
          }
        }
        if (opt.door !== false && fh >= 4) {
          const DX = (x + (opt.doorX ?? Math.floor(w / 2) - 1)) * S;
          const DY = (by - 3) * S;
          for (let j = 0; j < 9; j++)
            for (let i = 0; i < 6; i++) {
              if (style === 'china') img.px(DX + i, DY + j, j < 2 ? C.vermilion[1] : 0xe8a040);
              else img.px(DX + i, DY + j, j < 1 ? C.oldWood[0] : night(u) > 0.3 ? 0xd8a860 : 0x3a2a24);
            }
        }
        if (opt.noren) {
          const NY = (by - 3) * S;
          for (let X = X0 + 3; X < X1 - 3; X++)
            for (let j = 0; j < 5; j++) img.px(X, NY + j, X % 6 === 0 ? 0x141014 : (X >> 1) % 2 ? opt.noren : scaleColor(opt.noren, 0.72));
        }
        if (style === 'block') blockRoof(x, y, w, rh, roofC, wall, u, 5, !!opt.plainRoof);
        else k.roof(x - 1, y, w + 2, rh, ramp, { curl: style === 'china', courses: style !== 'west', ridgeC: style === 'china' ? C.vermilion[1] : undefined, ...opt.roof });
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

  /** Build in whatever room is left in a quarter: make(x, u, w, h) for each free plot, largest first. */
  k.fillGaps = (x0, x1, u0, u1, make) => {
    for (let u = u0; u < u1 - 9; u += 3)
      for (let x = x0; x < x1 - 6; x += 2) {
        let done = false;
        for (const h of [17, 14, 11]) {
          for (const w of [15, 11, 8]) {
            if (x + w > x1 || u + h > u1) continue;
            const y = Y(u + h);
            if (k.anyRes(x, y, w, h) || k.anyWet(x, y, w, h)) continue;
            make(x, u, w, h);
            x += w;
            done = true;
            break;
          }
          if (done) break;
        }
      }
  };

  /** A small temple in its walled plot: a gate, a flagged way, the hall under its gable, lanterns, a tree, a few graves. */
  k.smallTemple = (x, u, w = 30, h = 44, seed2 = 1, ramp = C.kawara) => {
    if (k.anyRes(x, Y(u + h), w, h)) return false;
    const yTop = Y(u + h);
    k.fill(x, yTop, w, h, C.gravel, seed2 + 900, 3);
    for (let X = x * S; X < (x + w) * S; X++) {
      for (let j = 0; j < 4; j++) img.px(X, yTop * S + j, j < 1 ? C.kawara[3] : C.plaster[1]);
      for (let j = 0; j < 6; j++) img.px(X, Y(u) * S - 6 + j, j < 2 ? C.kawara[3] : j < 3 ? C.kawara[1] : C.plaster[1]);
    }
    for (let Yy = yTop * S; Yy < Y(u) * S; Yy++) for (const X of [x * S, (x + w) * S - 3]) for (let i = 0; i < 3; i++) img.px(X + i, Yy, i < 1 ? C.kawara[3] : C.plaster[1]);
    k.reserve(x, yTop, w, h);
    const cx = x + Math.floor(w / 2);
    img.fine(cx - 3, Y(u + h - 18), 6, h - 18, (X, Yy, xx, yy) => k.flagPx(X, Yy, xx, yy, C.plaza, seed2 + 901, 12));
    k.house(x + 3, Y(u + h - 2), w - 6, 11, 7, 'jp', { wall: 0xe8e0d0, ramp, roof: { gable: 'tri', gw: 9, noshi: true }, bay: 5, reserve: false });
    k.house(cx - 6, Y(u + 10), 12, 5, 4, 'jp', { wall: 0x6a4a32, ramp, reserve: false, bay: 4, doorX: 5 });
    k.stoneLantern(cx - 5, u + 15, true);
    k.stoneLantern(cx + 5, u + 15, true);
    k.tree(x + 5, Y(u + 14), 3.6, C.pine, seed2 + 902, 'pine');
    k.tree(x + w - 5, Y(u + 16), 4, C.camphor, seed2 + 903);
    // a little plot of upright graves down one side
    const X0 = (x + w - 9) * S;
    for (let j = 0; j < 3; j++)
      for (let i = 0; i < 4; i++) {
        const X = X0 + i * 6;
        const Yy = (Y(u + 8 + j * 4)) * S;
        const hh = 7 + Math.floor(hashPx(i, j, seed2) * 4);
        for (let q = 0; q < hh; q++) for (let e = 0; e < 4; e++) img.px(X + e, Yy - q, q === hh - 1 ? C.granite[4] : e < 1 ? C.granite[3] : e > 2 ? C.granite[0] : C.granite[2]);
        img.px(X + 1, Yy + 1, 0x101418, 0.4);
      }
    return true;
  };

  /**
   * An old quarter between x0..x1, u0..u1: not rows but a fabric. Lanes wander through it and join up; houses of different
   * depths and fronts stand along them, roofs in several tiles, a storehouse or an apartment block among them; yards, a
   * garden with its tree, a vegetable plot, a parked car; lamps at the lanes' corners. temples: [[x, u, w, h]].
   */
  k.oldTown = (x0, x1, u0, u1, seed2, opt = {}) => {
    const g = rng(seed2);
    const gi = (a, b) => a + Math.floor(g() * (b - a + 1));
    const ALLEY = [0x46423c, 0x4e4a44, 0x56524a, 0x5e5a50];
    const GREY = [0x2e3238, 0x3e434a, 0x50565e, 0x666c74, 0x828890];
    const OLD = [0x34302e, 0x4a4440, 0x5e5650, 0x726a62, 0x8a827a];
    img.fine(x0, Y(u1), x1 - x0, u1 - u0, (X, Yy, x, y) => {
      if (k.isRes(x, y) || fineWater[Yy * FW + X]) return null;
      const r = Math.floor(Yy / 3);
      const XX = X + r * 2;
      if (Yy % 3 === 0 && hashPx(XX >> 2, r, seed2 + 1) < 0.6) return scaleColor(ALLEY[0], 0.86);
      return rampColor(ALLEY, 0.1 + hashPx(XX >> 3, r, seed2) * 0.5, X, Yy);
    });
    for (const [tx, tu, tw, th, ramp] of opt.temples ?? []) k.smallTemple(tx, tu, tw, th, seed2 + tx, ramp);
    const lanePaint = (X, Yy) => k.settPx(X, Yy, seed2, C.stoneSet);
    const lane = (pts, hw) => {
      // only where it is free: a lane stops at a bridge, a temple, the river, and goes on beyond
      let run = [];
      const flush = () => {
        if (run.length > 1) {
          k.way(run, hw, { paint: lanePaint, kerb: scaleColor(C.stoneSet[0], 0.8) });
          const m = run[Math.floor(run.length / 2)];
          k.streetLamp(Math.round(m[0] + hw + 1), Math.round(m[1]), 0xffe0b0);
        }
        run = [];
      };
      for (const p of pts) {
        const y = Y(p[1]);
        if (k.anyRes(p[0] - hw - 2, y - hw - 2, hw * 2 + 4, hw * 2 + 4) || k.anyWet(p[0] - hw - 2, y - hw - 2, hw * 2 + 4, hw * 2 + 4)) flush();
        else run.push(p);
      }
      flush();
    };
    const nV = Math.max(2, Math.round((x1 - x0) / 56));
    for (let i = 0; i < nV; i++) {
      let x = x0 + ((i + 0.5) * (x1 - x0)) / nV + gi(-5, 5);
      const pts = [];
      for (let u = u0 + 2; u <= u1 - 2; u += gi(12, 22)) {
        pts.push([x, u]);
        x += gi(-4, 4);
      }
      lane(pts, 1.5);
    }
    for (let u = u0 + gi(40, 70); u < u1 - 20; u += gi(70, 110)) {
      let uu = u;
      const pts = [];
      for (let x = x0 + 2; x <= x1 - 2; x += gi(10, 18)) {
        pts.push([x, uu]);
        uu += gi(-2, 2);
      }
      lane(pts, 1.5);
    }
    const yard = (x, foot, w, h) => {
      const kind = gi(0, 3);
      const yTop = Y(foot + h);
      if (kind === 0 || kind === 3) {
        k.lawnFill(x, yTop, w, h, C.grass, seed2 + x);
        k.tree(x + w / 2, Y(foot + h / 2), Math.min(w, h) * 0.34 + 1, g() < 0.3 ? C.pine : C.camphor, seed2 + x * 7 + foot, g() < 0.3 ? 'pine' : 'broadleaf');
      } else if (kind === 1) {
        img.fine(x, yTop, w, h, (X, Yy) => ((X >> 2) % 2 ? k.earthPx(X, Yy, 4) : hashPx(X >> 1, Yy >> 1, seed2) < 0.6 ? C.moss[3] : C.moss[2]));
      } else {
        img.fine(x, yTop, w, h, (X, Yy) => k.asphaltPx(X, Yy));
        const c = CARS[gi(0, CARS.length - 1)];
        for (let j = 0; j < 18; j++) for (let i = 0; i < 12; i++) img.px(x * S + 3 + i, yTop * S + 2 + j, i < 1 ? scaleColor(c, 1.16) : i > 10 ? scaleColor(c, 0.68) : (j > 3 && j < 7) || (j > 12 && j < 15) ? 0x2a3440 : c);
      }
      k.reserve(x, yTop, w, h);
    };
    let u = u0 + 1;
    while (u + 11 <= u1) {
      const rowH = gi(13, 20);
      let x = x0 + gi(0, 3);
      while (x < x1 - 5) {
        let w = gi(8, 17);
        if (x + w > x1) w = x1 - x;
        if (w < 6) break;
        const foot = u + gi(0, 2);
        let h = rowH - gi(0, 3);
        // a lane or the row before in the way: a shallower house, or move along
        while (h >= 10 && (k.anyRes(x, Y(foot + h), w, h) || k.anyWet(x, Y(foot + h), w, h))) h -= 2;
        if (h < 10) {
          x += 3;
          continue;
        }
        const yTop = Y(foot + h);
        const t = g();
        if (t < 0.1) {
          yard(x, foot, w - 1, h);
          x += w + 1;
          continue;
        }
        if (t < 0.24 && h >= 12) {
          k.house(x, yTop, w - 1, Math.max(6, h - 8), Math.min(8, h - 6), 'block', { roofC: C.roofs[gi(0, C.roofs.length - 1)], wall: C.walls[gi(0, C.walls.length - 1)], shop: g() < 0.5 });
        } else if (t < 0.31 && w <= 13) {
          // a white storehouse
          const rh = Math.max(5, h - 8);
          const fh = h - rh;
          k.house(x, yTop, w - 1, rh, fh, 'jp', {
            wall: 0xeeeae0,
            ramp: C.kawara,
            bay: 20,
            door: false,
            roof: { noshi: true },
            extra: (by) => {
              for (let X = x * S; X < (x + w - 1) * S; X++) for (let j = 0; j < 7; j++) img.px(X, by * S - 7 + j, (X + j) % 6 === 0 || (X - j) % 6 === 0 ? 0xe8e8e4 : 0x3e4450);
              img.rectPx((x + w / 2 - 1) * S, (by - fh + 1) * S + 3, 5, 4, 0x14141a);
            },
          });
        } else {
          const rh = Math.round(h * (0.48 + g() * 0.2));
          const r2 = g();
          k.house(x, yTop, w - 1, rh, h - rh, 'jp', {
            ramp: r2 < 0.5 ? C.kawara : r2 < 0.72 ? GREY : r2 < 0.86 ? OLD : r2 < 0.94 ? C.slate : C.redTile,
            wall: [0xd8ccb4, 0xc8bca4, 0xb8ac94, 0xe4dccc, 0xa89a88, 0xc8b89c][gi(0, 5)],
            noren: g() < 0.3 ? [0x2a4a8a, 0x8a2a2a, 0xe8d8b0, 0x3a6a4a][gi(0, 3)] : undefined,
            bay: gi(3, 6),
            door: g() < 0.7,
            doorX: gi(1, Math.max(1, w - 5)),
            roof: { gable: g() < 0.22 ? 'tri' : null, gw: 5, noshi: g() < 0.25, ridgeAt: 0.25 + g() * 0.16 },
          });
        }
        x += w + gi(0, 1);
      }
      u += rowH + 2;
    }
    // every plot left over gets a small house or its yard, so the quarter closes up round its lanes
    k.fillGaps(x0, x1, u0, u1, (x, uu, w, h) => {
      if (g() < 0.1) return yard(x, uu, w - 1, h - 1);
      const rh = Math.round(h * (0.5 + g() * 0.15));
      const r2 = g();
      k.house(x, Y(uu + h), w - 1, rh, h - rh, 'jp', {
        ramp: r2 < 0.5 ? C.kawara : r2 < 0.75 ? GREY : r2 < 0.9 ? OLD : C.redTile,
        wall: [0xd8ccb4, 0xc8bca4, 0xb8ac94, 0xe4dccc, 0xa89a88, 0xc8b89c][gi(0, 5)],
        noren: g() < 0.2 ? [0x2a4a8a, 0x8a2a2a, 0xe8d8b0, 0x3a6a4a][gi(0, 3)] : undefined,
        bay: gi(3, 5),
        door: g() < 0.6,
        doorX: gi(1, Math.max(1, w - 5)),
      });
    });
  };

  /** A plain modern block with a flat roof and lit windows (offices, apartments, warehouses). */
  k.slab = (x, y, w, h, fh, opt = {}) => k.house(x, y, w, h, fh, 'block', opt);

  // ------------------------------------------------------------ roads, tramways, bridges
  /**
   * A road along a polyline of [x, u] points. hw: half width of the carriageway; side: pavement width.
   * opt: tram (track bed in the middle), lanes (centre dashes), surface (stone setts for a walking street), paint(X, Yy,
   * across, along) for a surface of its own, over (paint over water: a bridge deck), kerb colour, pave ramp.
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
    const XA = Math.max(0, Math.floor((Math.min(...xs) - reach) * S));
    const XB = Math.min(FW - 1, Math.ceil((Math.max(...xs) + reach) * S));
    const YA = Math.max(0, Math.floor((L - Math.min(RIDGE, Math.max(...us) + reach)) * S));
    const YB = Math.min(FH - 1, Math.ceil((L - Math.max(0, Math.min(...us) - reach)) * S));
    for (let Yy = YA; Yy <= YB; Yy++) {
      const pu = L - (Yy + 0.5) / S;
      for (let X = XA; X <= XB; X++) {
        const px = (X + 0.5) / S;
        let best = null;
        for (let n = 0; n < segs.length; n++) {
          const s = segs[n];
          const t0 = (px - s.x0) * s.dx + (pu - s.u0) * s.du;
          const t = Math.max(0, Math.min(s.len, t0));
          const qx = s.x0 + s.dx * t;
          const qu = s.u0 + s.du * t;
          const d = Math.hypot(px - qx, pu - qu);
          if (!best || d < best.d) best = { d, along: s.s0 + t, across: (px - s.x0) * -s.du + (pu - s.u0) * s.dx, past: (n === 0 && t0 < 0) || (n === segs.length - 1 && t0 > s.len) };
        }
        if (!best || best.d > reach || (opt.piece && best.past)) continue;
        if (fineWater[Yy * FW + X] && !opt.over) continue;
        const a = Math.abs(best.across);
        let c;
        if (a > hw + 0.34) {
          if (side <= 0) continue;
          c = k.pavePx(X, Yy, opt.pave ?? C.walk);
          if (a > hw + side - 0.34) c = opt.over ? opt.rail ?? C.granite[3] : scaleColor(C.walk[0], 0.82);
        } else if (a > hw - 0.34) c = opt.kerb ?? (hashPx(X >> 2, Yy >> 2, 91) < 0.5 ? 0x9a9a9e : 0x8a8a8e);
        else if (opt.paint) c = opt.paint(X, Yy, best.across, best.along);
        else if (opt.surface) c = k.settPx(X, Yy, 37, opt.surface);
        else if (opt.tram && a <= 5.5) {
          // the stone-set track bed, two tracks (rails at 1.5 and 4.5 either side of the middle), sleepers of setts
          c = k.settPx(X, Yy, 35, C.tramBed);
          const ra = Math.abs(a - 1.5);
          const rb = Math.abs(a - 4.5);
          if (ra < 0.34 || rb < 0.34) c = 0xd8e0e8;
          else if (ra < 0.67 || rb < 0.67) c = 0x4a4a4e;
        } else {
          c = k.asphaltPx(X, Yy);
          if (opt.lanes !== false && !opt.tram && a < 0.25 && hw >= 4 && Math.floor(best.along / 3) % 2 === 0) c = 0xdad6c8;
          if (hw >= 4 && !opt.tram && Math.abs(a - (hw - 0.8)) < 0.17) c = 0xbcb8aa;
        }
        img.px(X, Yy, c);
      }
    }
    // (reserved in whole cells, along the line)
    for (const s of segs) {
      const n = Math.ceil(s.len / 1.5);
      for (let i = 0; i <= n; i++) {
        const q = s.len * (i / Math.max(1, n));
        const cx = s.x0 + s.dx * q;
        const cu = s.u0 + s.du * q;
        k.reserve(cx - reach + 1, Y(cu) - reach + 1, (reach - 1) * 2, (reach - 1) * 2);
      }
    }
  };

  /**
   * A way through a park or garden: everything within hw of the polyline, with round corners and a kerb, so branches
   * join cleanly. paint(X, Yy, d, x, y) gives the surface (default setts); kerb: its colour or null.
   */
  k.way = (pts, hw, opt = {}) => {
    const P = pts.map(([x, u]) => [x, L - u]);
    const x0 = Math.floor(Math.min(...P.map((p) => p[0])) - hw - 1);
    const x1 = Math.ceil(Math.max(...P.map((p) => p[0])) + hw + 1);
    const y0 = Math.floor(Math.min(...P.map((p) => p[1])) - hw - 1);
    const y1 = Math.ceil(Math.max(...P.map((p) => p[1])) + hw + 1);
    const kerb = opt.kerb === undefined ? C.stone ?? C.granite[1] : opt.kerb;
    const paint = opt.paint ?? ((X, Yy) => k.settPx(X, Yy, opt.seed ?? 0));
    img.fine(Math.max(0, x0), y0, Math.min(W, x1) - Math.max(0, x0), y1 - y0, (X, Yy, x, y) => {
      if (fineWater[Yy * FW + X] && !opt.overWater) return null;
      let d = 1e9;
      for (let q = 0; q + 1 < P.length; q++) {
        const [ax, ay] = P[q];
        const [bx, by] = P[q + 1];
        const vx = bx - ax;
        const vy = by - ay;
        const t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy || 1)));
        d = Math.min(d, Math.hypot(x - ax - t * vx, y - ay - t * vy));
      }
      if (d > hw) return null;
      if (kerb !== null && d > hw - 0.55) return hashPx(X >> 1, Yy >> 1, 85) < 0.5 ? kerb : scaleColor(kerb, 1.14);
      return paint(X, Yy, d, x, y);
    });
    for (let q = 0; q + 1 < P.length; q++) {
      const n = Math.ceil(Math.hypot(P[q + 1][0] - P[q][0], P[q + 1][1] - P[q][1]) / 2);
      for (let i = 0; i <= n; i++) {
        const cx = P[q][0] + ((P[q + 1][0] - P[q][0]) * i) / Math.max(1, n);
        const cy = P[q][1] + ((P[q + 1][1] - P[q][1]) * i) / Math.max(1, n);
        k.reserve(cx - hw, cy - hw, hw * 2, hw * 2);
      }
    }
  };

  /** A zebra crossing across a road at u (x from x0 to x1), or down a road at x (u0..u1). */
  k.zebraH = (x0, x1, u) => {
    for (let X = x0 * S; X <= x1 * S; X++) if (X % 6 < 3) for (let j = 0; j < 9; j++) img.px(X, Y(u + 2) * S + j, 0xe4e2d8);
  };
  k.zebraV = (x, u0, u1) => {
    for (let Yy = Y(u1) * S; Yy <= Y(u0) * S; Yy++) if (Yy % 6 < 3) for (let i = 0; i < 9; i++) img.px(x * S + i, Yy, 0xe4e2d8);
  };

  /** A boat from above, its bow to the right: a pointed hull, its deck, and whatever paint(r, FL, FH) puts on it. */
  k.hull = (w, h, u, hullC, deck, paint, grade = true) =>
    k.sprite(w, h, u, (r) => {
      const FL = w * S;
      const FHh = h * S;
      const mid = (FHh - 1) / 2;
      for (let X = 0; X < FL; X++) {
        const t = FL - 1 - X;
        const hw = Math.min(FHh / 2 - 0.5, 1 + Math.pow(t, 0.72) * (FHh / 2 / Math.pow(FL * 0.3, 0.72)));
        for (let Yy = 0; Yy < FHh; Yy++) {
          const a = Math.abs(Yy - mid);
          if (a > hw) continue;
          const e = hw - a;
          let c = e < 1.2 ? (Yy > mid ? scaleColor(hullC, 0.66) : scaleColor(hullC, 1.2)) : e < 2.4 ? hullC : deck;
          if (X < 2) c = scaleColor(hullC, 0.66);
          r.px(X, Yy, c);
        }
      }
      paint?.(r, FL, FHh);
    }, grade);
  k.wakeF = (u) => [k.sprite(9, 7, u, (r) => {
    for (let i = 0; i < 18; i++) {
      r.px(13 - Math.floor(i * 0.6), i, 0xe8faff, 0.75 - i * 0.035);
      r.px(13 + Math.floor(i * 0.6), i, 0xe8faff, 0.75 - i * 0.035);
    }
  })];

  // ------------------------------------------------------------ finish
  k.finish = () => {
    for (const o of objects) o.shadow?.();
    objects.sort((a, b) => a.y - b.y);
    for (const o of objects) o.draw();
    for (const fn of k.late) fn();
    const hi = st.img.hi;
    const d = hi.data;
    // a crown something else was drawn over no longer sways there
    for (let q = 0; q < crownMask.length; q++) {
      if (!crownMask[q]) continue;
      const i = q * 4;
      if (((d[i] ^ (d[i + 1] << 1) ^ (d[i + 2] << 2)) & 255) !== crownHash[q] || !d[i + 3]) crownMask[q] = 0;
    }
    const tint = TOD.map(([, , t]) => rgb(t));
    for (let Yy = 0; Yy < FH; Yy++) {
      const u = L - (Yy + 0.5) / S;
      let i = 0;
      while (i < TOD.length - 2 && u >= TOD[i + 1][0]) i++;
      const t = smooth(TOD[i][0], TOD[i + 1][0], u);
      const mul = TOD[i][1].map((m, q) => m + (TOD[i + 1][1][q] - m) * t);
      const tc = tint[i].map((c, q) => c + (tint[i + 1][q] - c) * t);
      const amt = TOD[i][3] + (TOD[i + 1][3] - TOD[i][3]) * t;
      for (let X = 0; X < FW; X++) {
        const p = (Yy * FW + X) * 4;
        if (!d[p + 3]) continue;
        for (let q = 0; q < 3; q++) {
          const v = d[p + q] * mul[q];
          d[p + q] = Math.min(255, v + (tc[q] - v) * amt);
        }
      }
    }
    for (const pl of pools) applyPool(st.img, pl);
    for (const [x, y, c, a] of lights) st.img.light(x, y, c, a);
    for (const [X, Yy, c, a] of lightsFine) st.img.px(X, Yy, c, a);
    // the shadows of the clouds drifting over the land, soft-edged
    for (const [i, w, h, lobes, sd] of [
      [0, 96, 56, [[30, 30, 26, 20], [56, 24, 30, 20], [74, 34, 20, 16]], 41],
      [1, 80, 44, [[26, 22, 22, 16], [52, 20, 24, 17]], 57],
    ]) {
      const out = new HiCanvas(w, h);
      for (let FYr = 0; FYr < h * S; FYr++)
        for (let FXr = 0; FXr < w * S; FXr++) {
          const x = FXr / S;
          const y = FYr / S;
          let v = 0;
          for (const [cx, cy, rx, ry] of lobes) v = Math.max(v, 1 - Math.hypot((x - cx) / rx, (y - cy) / ry));
          v += (fbm(x, y, { seed: sd, scale: 14, octaves: 4 }) - 0.5) * 0.35;
          const a = Math.max(0, Math.min(1, (v - 0.02) / 0.22));
          if (a > 0) out.px(FXr, FYr, 0x000000, a);
        }
      kit.frame(out, `cshadow_${i}`);
    }
    // the crowns go into the strip's alpha last of all (240..254: which crown; the game restores them to opaque)
    for (let q = 0; q < crownMask.length; q++) {
      const a = d[q * 4 + 3];
      if (a >= 240 && a < 255) d[q * 4 + 3] = 236; // (only a crown may use these)
      const v = crownMask[q];
      if (v && a === 255) d[q * 4 + 3] = 239 + v;
    }
    return { strip: hi, canvas: st.img, props: kit.pack(), tint: tintTable(L, tod.white) };
  };

  return k;
}

function applyPool(target, { x, y, r, c, k }) {
  const [cr, cg, cb] = rgb(c);
  const CX = x * S;
  const CY = y * S;
  const R = r * S;
  for (let Yy = Math.floor(CY - R); Yy <= CY + R; Yy++)
    for (let X = Math.floor(CX - R); X <= CX + R; X++) {
      const q = target.rgbaPx(X, Yy);
      if (!q || !q[3]) continue;
      const dd = Math.hypot(X + 0.5 - CX, Yy + 0.5 - CY) / R;
      if (dd >= 1) continue;
      const f = (1 - dd) ** 1.6 * k;
      target.setRGBAPx(X, Yy, Math.min(255, q[0] + cr * f), Math.min(255, q[1] + cg * f), Math.min(255, q[2] + cb * f), q[3]);
    }
}

export { mix, scaleColor, rampColor, fbm, rng, Raster, hashPx, HiCanvas };
