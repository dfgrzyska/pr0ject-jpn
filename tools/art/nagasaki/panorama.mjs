import { Raster, rng, mix, fbm, rgb } from '../../lib/raster.mjs';
import { hashPx } from '../hires.mjs';
import { farShore, nearShore, hillRoad, ropeway } from '../../../src/data/nagasakiView.js';

// The "ten-million-dollar night view" from Mount Inasa, painted light-first at 3x the game's resolution (648 x 1260,
// shown at 216 x 420). The land is almost black; what you see of the city is its light: thousands of windows of different
// strength, strings of street lamps, the arteries running down to the water, all of it blooming into the night air and
// falling in long broken columns on the harbour. Looking east: north on the left (the station's towers, Mt Kompira and its
// masts), the neon of downtown, Dejima's wharf, Oura Cathedral on its hill, the liner at Matsugae, then Megami Ōhashi
// crossing the harbour mouth from the near shore to the far one. Below: the Mitsubishi yard along the near shore, the
// hammerhead crane of 1909, Inasa's own streets, the summit's trees, and at our feet the terrace's rail with people at it.
const S = 3;
const W = 216 * S;
const H = 420 * S;
const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** A float picture: colour added up freely, blurred later, then quantised with an ordered dither so it stays pixel art. */
class Light {
  constructor() {
    this.d = new Float32Array(W * H * 3);
  }
  add(x, y, c, p = 1) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    const i = (y * W + x) * 3;
    const q = rgb(c);
    this.d[i] += q[0] * p;
    this.d[i + 1] += q[1] * p;
    this.d[i + 2] += q[2] * p;
  }
  clearRect(x0, y0, w, h) {
    for (let y = Math.max(0, Math.round(y0)); y < Math.min(H, y0 + h); y++)
      for (let x = Math.max(0, Math.round(x0)); x < Math.min(W, x0 + w); x++) {
        const i = (y * W + x) * 3;
        this.d[i] = this.d[i + 1] = this.d[i + 2] = 0;
      }
  }
}
/** Box blur (twice over, nearly a gaussian) into a new buffer. rx, ry: radii. */
function blur(src, rx, ry) {
  const a = src.slice();
  const tmp = new Float32Array(a.length);
  for (let pass = 0; pass < 2; pass++) {
    for (let c = 0; c < 3; c++) {
      if (rx > 0)
        for (let y = 0; y < H; y++) {
          let sum = 0;
          for (let x = -rx; x <= rx; x++) sum += a[(y * W + Math.max(0, x)) * 3 + c];
          for (let x = 0; x < W; x++) {
            tmp[(y * W + x) * 3 + c] = sum / (2 * rx + 1);
            sum += a[(y * W + Math.min(W - 1, x + rx + 1)) * 3 + c] - a[(y * W + Math.max(0, x - rx)) * 3 + c];
          }
        }
      else for (let i = c; i < a.length; i += 3) tmp[i] = a[i];
      if (ry > 0)
        for (let x = 0; x < W; x++) {
          let sum = 0;
          for (let y = -ry; y <= ry; y++) sum += tmp[(Math.max(0, y) * W + x) * 3 + c];
          for (let y = 0; y < H; y++) {
            a[(y * W + x) * 3 + c] = sum / (2 * ry + 1);
            sum += tmp[(Math.min(H - 1, y + ry + 1) * W + x) * 3 + c] - tmp[(Math.max(0, y - ry) * W + x) * 3 + c];
          }
        }
      else for (let i = c; i < a.length; i += 3) a[i] = tmp[i];
    }
  }
  return a;
}

export function buildPanorama() {
  const random = rng(333081);
  const sky = new Raster(W, H);
  const near = new Raster(W, H);
  const lights = Array.from({ length: 4 }, () => new Raster(W, H));
  const base = new Light(); // the unlit picture
  const mask = new Uint8Array(W * H); // what the city layer covers
  const E = new Light(); // what shines
  const fS = (X) => farShore(X / S) * S;
  const nS = (X) => nearShore(X / S) * S;
  const hR = (X) => hillRoad(X / S) * S;
  const ridge = (X) => (105 + 7 * Math.sin((X / S) * 0.039) + 5 * Math.sin((X / S) * 0.099) + 1.2 * Math.sin((X / S) * 0.37)) * S + (hashPx(X >> 1, 3, 71) - 0.5) * 2.2;
  const treeLine = (X) => (385 - (X / S) * 0.14 + Math.sin((X / S) * 0.046) * 11 + Math.sin((X / S) * 0.19) * 3) * S;
  /** How deep inside the wood a point is (logical px): below 0 is outside. Its edge wanders, it is no clean curve. */
  const woodQ = (X, Y) => {
    const x = X / S;
    const y = Y / S;
    const wander = (fbm(x, y, { seed: 741, scale: 8, octaves: 3 }) - 0.5) * 26;
    return Math.max(176 - 0.035 * (x - 162) ** 2 - y, x > 186 ? 151 - 0.02 * (x - 216) ** 2 - y : -99) + wander;
  };
  const woodedHill = (X, Y) => woodQ(X, Y) > 0;
  const WARM = [0xffc878, 0xffb460, 0xffd898, 0xffa850, 0xffe4b0];
  const WHITE = [0xfff4e0, 0xe8f0ff, 0xd8e8f8, 0xfff8ec];
  const NEON = [0xff4a68, 0xff7ab0, 0x58e0ff, 0xffe058, 0xb080ff, 0x60ff98];

  const setB = (x, y, c, a = 1) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    const i = (y * W + x) * 3;
    const q = rgb(c);
    for (let k = 0; k < 3; k++) base.d[i + k] += (q[k] - base.d[i + k]) * a;
    mask[y * W + x] = 1;
  };
  const clearLights = (x0, y0, w, h) => {
    E.clearRect(x0, y0, w, h);
    for (let y = Math.max(0, Math.round(y0)); y < Math.min(H, y0 + h); y++)
      for (let x = Math.max(0, Math.round(x0)); x < Math.min(W, x0 + w); x++) for (const l of lights) l.clear(x, y);
  };
  const lineB = (x0, y0, x1, y1, c, a = 1) => {
    const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1));
    for (let i = 0; i <= n; i++) setB(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, c, a);
  };
  const lineE = (x0, y0, x1, y1, c, p) => {
    const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1));
    for (let i = 0; i <= n; i++) E.add(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, c, p);
  };
  const polyB = (pts, c, a = 1) => {
    const lo = Math.floor(Math.min(...pts.map((p) => p[1])));
    const hi = Math.ceil(Math.max(...pts.map((p) => p[1])));
    for (let y = lo; y <= hi; y++) {
      const hits = [];
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [x0, y0] = pts[i];
        const [x1, y1] = pts[j];
        if (y0 > y !== y1 > y) hits.push(x0 + ((y - y0) * (x1 - x0)) / (y1 - y0));
      }
      hits.sort((p, q) => p - q);
      for (let q = 0; q + 1 < hits.length; q += 2)
        for (let x = Math.ceil(hits[q]); x <= hits[q + 1]; x++) {
          setB(x, y, typeof c === 'function' ? c(x, y) : c, a);
          clearLights(x, y, 1, 1);
        }
    }
  };
  /** A lit point: its core in the group that twinkles, a steady part in the picture, its power feeds the bloom. */
  const lamp = (x, y, c, p = 1, g = random.int(0, 3)) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    E.add(x, y, c, p);
    if (p > 0.22) lights[g].set(x, y, c, Math.min(1, p * 0.9));
  };

  // ------------------------------------------------------------ the sky
  const MOON = [122 * S, 50 * S];
  for (let y = 0; y < H; y++) {
    const t = Math.min(1, y / (112 * S));
    const c0 = t < 0.6 ? mix(0x040a1c, 0x0a1834, t / 0.6) : t < 0.88 ? mix(0x0a1834, 0x1a2a4c, (t - 0.6) / 0.28) : mix(0x1a2a4c, 0x4a3a58, (t - 0.88) / 0.12);
    for (let x = 0; x < W; x++) {
      let c = c0;
      // the Milky Way, faint, a band across the upper sky
      const band = Math.exp(-(((y - (40 * S - (x - W / 2) * 0.2)) / (17 * S)) ** 2));
      if (band > 0.05) c = mix(c, 0x56668a, band * 0.3 * fbm(x / S, y / S, { seed: 4, scale: 10, octaves: 4 }));
      // thin cloud, moonlit near the moon, underlit by the city low down
      const cloud = fbm(x / (2.6 * S), (y / S) * 2.6, { seed: 9, scale: 34, octaves: 4 });
      if (cloud > 0.6) {
        const md = Math.hypot(x - MOON[0], y - MOON[1]) / (70 * S);
        const moonlit = mix(0x9ab0c8, 0x2a3a58, Math.min(1, md));
        const cityLit = mix(moonlit, 0x7a5a58, smooth(70 * S, 108 * S, y) * (1 - x / W));
        c = mix(c, cityLit, Math.min(0.5, (cloud - 0.6) * 2));
      }
      sky.set(x, y, c);
    }
  }
  // the glow of the city on the air, low over the ridge
  for (let y = 60 * S; y < 125 * S; y++)
    for (let x = 0; x < W; x++) {
      const g = Math.exp(-(((x - 62 * S) / (88 * S)) ** 2)) * smooth(60 * S, 112 * S, y);
      sky.set(x, y, 0xb06a50, g * 0.32);
    }
  // stars: faint ones in their thousands, a few bright, thinning towards the horizon and the moon
  for (let i = 0; i < 1500; i++) {
    const x = random.int(1, W - 2);
    const y = Math.floor(random() ** 1.5 * 88 * S);
    if (Math.hypot(x - MOON[0], y - MOON[1]) < 90) continue;
    sky.set(x, y, random.pick([0xc8d8f0, 0xffffff, 0xe8d8c8, 0xb8c8f0]), random.range(0.14, 0.62) * (1 - (y / (92 * S)) * 0.7));
  }
  for (let i = 0; i < 34; i++) {
    const x = random.int(4, W - 5);
    const y = random.int(6, 66 * S);
    if (Math.hypot(x - MOON[0], y - MOON[1]) < 110) continue;
    sky.set(x, y, 0xffffff);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) sky.set(x + dx, y + dy, 0xc8d8f0, 0.42);
  }
  // the moon, a little past full, soft maria, its halo in the thin cloud
  for (let j = -120; j <= 120; j++)
    for (let i = -120; i <= 120; i++) {
      const d = Math.hypot(i, j);
      if (d > 120 || d < 16) continue;
      sky.set(MOON[0] + i, MOON[1] + j, 0xa8c0e0, 0.26 * (1 - d / 120) ** 2.4);
    }
  for (let j = -17; j <= 17; j++)
    for (let i = -17; i <= 17; i++) {
      const d = Math.hypot(i, j);
      if (d > 16.6) continue;
      const n = fbm((MOON[0] + i) * 0.34, (MOON[1] + j) * 0.34, { seed: 46, scale: 3.2, octaves: 3 });
      const edge = Math.max(0, (Math.hypot(i - 3, j + 2) - 12.5) / 5);
      const c = mix(n > 0.54 ? 0xc8d0d4 : 0xfcfaec, 0x8a98a8, Math.min(0.55, edge));
      sky.set(MOON[0] + i, MOON[1] + j, c, d > 15.8 ? 0.6 : 1);
    }
  // the far mountains, dark, a lighter haze at their feet, their tops rough with trees
  for (let n = 0; n < 4; n++) {
    const top = [0x121a34, 0x0e1830, 0x0a1428, 0x081022][n];
    const foot = [0x3a3a58, 0x2e3250, 0x222a44, 0x182038][n];
    for (let x = 0; x < W; x++) {
      const y0 = (82 + n * 7 + 7 * Math.sin((x / S) * 0.024 + n * 2) + 3 * Math.sin((x / S) * 0.13 + n) + 0.8 * Math.sin((x / S) * 0.5 + n)) * S + (hashPx(x >> 1, n, 72) - 0.5) * 3;
      const yg = (82 + n * 7 + 7 * Math.sin((x / S) * 0.024 + n * 2) + 3 * Math.sin((x / S) * 0.13 + n)) * S;
      for (let y = Math.round(y0); y < H; y++) sky.set(x, y, mix(top, foot, smooth(yg, yg + 54, y)));
    }
  }

  // ------------------------------------------------------------ the land and the water, almost black
  for (let x = 0; x < W; x++) {
    const ry = ridge(x);
    const shore = fS(x);
    const nshore = nS(x);
    for (let y = Math.ceil(ry); y < H; y++) {
      if (y > shore && y < nshore) {
        const t = (y - shore) / (nshore - shore);
        let c = mix(0x040a18, 0x081424, t);
        const st = fbm(x * 0.05, y * 0.5, { seed: 33, scale: 2.6, octaves: 2 });
        if (st > 0.64) c = mix(c, 0x12263a, 0.7);
        setB(x, y, c);
      } else {
        const n = fbm(x / S, y / S, { seed: 31, scale: 18, octaves: 3 });
        const rel = fbm(x / S + 0.8, y / S + 0.8, { seed: 31, scale: 18, octaves: 3 }) - n;
        const t = Math.min(1, (y - ry) / Math.max(1, shore - ry));
        let c = mix(0x070d1a, 0x0e1626, Math.max(0, Math.min(1, n * 0.9 + rel * 5)));
        if (woodedHill(x, y) || y > nshore + 40) {
          const f = fbm(x * 0.42, y * 0.42, { seed: 718, scale: 4, octaves: 3 });
          c = mix(0x050c10, 0x101f24, Math.round(f * 5) / 5);
        }
        if (y < shore) c = mix(c, 0x161a28, t * 0.4);
        setB(x, y, c);
      }
    }
  }

  // ------------------------------------------------------------ what stands on the far side, back to front
  const items = [];
  const PARKS = [[62, 152, 9, 6], [108, 168, 10, 7], [34, 176, 7, 5], [88, 132, 12, 5], [150, 142, 10, 7], [122, 124, 8, 4], [40, 134, 9, 4], [18, 158, 6, 4]];
  const inPark = (X, Y) => {
    const q = fbm(X / S, Y / S, { seed: 744, scale: 5, octaves: 2 }) - 0.5;
    return PARKS.some(([x, y, rx, ry]) => ((X / S - x) / rx) ** 2 + ((Y / S - y) / ry) ** 2 < 1 + q * 1.3);
  };
  // the old neighbourhoods' centres, brighter and thicker than what lies between them
  const CENTRES = [[26, 196, 26, 16, 0.8], [72, 186, 28, 14, 1], [118, 176, 20, 11, 0.55], [50, 158, 18, 9, 0.5], [98, 148, 16, 8, 0.42], [150, 168, 14, 8, 0.4], [20, 140, 16, 7, 0.32]];
  const centre = (x, y) => Math.max(...CENTRES.map(([cx, cy, rx, ry, a]) => a * Math.exp(-(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2))));
  // the city's map: where its streets run decides where its houses stand
  const dens = new Float32Array(216 * 420);
  const splat = (X, Y, r, v) => {
    const cx = Math.round(X / S);
    const cy = Math.round(Y / S);
    for (let j = -r; j <= r; j++)
      for (let i = -r; i <= r; i++) {
        const x = cx + i;
        const y = cy + j;
        if (x < 0 || x >= 216 || y < 0 || y >= 420) continue;
        const d = Math.hypot(i, j) / r;
        if (d < 1) dens[y * 216 + x] = Math.max(dens[y * 216 + x], v * (1 - d) ** 0.8);
      }
  };
  const road = [];
  const addRoad = (pts, r, v) => {
    for (const [X, Y] of pts) splat(X, Y, r, v);
    road.push(pts);
  };
  const contours = [];
  for (let n = 0; n < 13; n++) {
    let run = [];
    const flush = () => {
      if (run.length > 8) {
        addRoad(run, 3, 0.72);
        contours.push([run, n]);
      }
      run = [];
    };
    for (let X = 0; X < W; X += 3) {
      const Y = (112 + n * 9.6 - (X / S) * 0.065 + Math.sin((X / S) * 0.035 + n) * (6 + n) + Math.sin((X / S) * 0.19 + n * 2) * 1.6 + (fbm(X / S, n * 7, { seed: 745, scale: 16, octaves: 3 }) - 0.5) * 16) * S;
      if (Y < ridge(X) + 8 || Y > fS(X) - 12 || woodedHill(X, Y)) flush();
      else run.push([X, Y]);
    }
    flush();
  }
  // the arteries wind down their valleys to the waterfront; each forks once on its way up
  const arteries = [];
  const artery = (X0, X1, Y0, Y1, seed) => {
    const pts = [];
    for (let k = 0; k <= 26; k++) {
      const t = k / 26;
      const wander = (fbm(t * 5, seed, { seed: 746, scale: 2.4, octaves: 2 }) - 0.5) * 30 * Math.min(1, t * 4);
      pts.push([X0 + (X1 - X0) * t + Math.sin(t * 5 + seed) * 7 + wander, Y0 + (Y1 - Y0) * t]);
    }
    addRoad(pts, 5, 1);
    arteries.push(pts);
    return pts;
  };
  for (const [x0, x1, top, fx, ft] of [[30, 22, 150, 44, 128], [52, 66, 118, 40, 112], [74, 96, 124, 112, 112], [98, 112, 140, 88, 118], [126, 146, 150, 124, 134]]) {
    const main = artery(x0 * S, x1 * S, fS(x0 * S) - 3, top * S, x0);
    const [fx0, fy0] = main[12];
    artery(fx0, fx * S, fy0, ft * S, x0 + 3);
  }
  // the lanes that climb from one contour street towards the next
  const lanes = [];
  for (let i = 0; i < 150; i++) {
    const [run] = contours[random.int(0, contours.length - 1)];
    const [X0, Y0] = run[random.int(0, run.length - 1)];
    const dir = random() < 0.5 ? -1 : 1;
    const pts = [];
    let X = X0;
    let Y = Y0;
    let sway = (random() - 0.5) * 0.9;
    const n = random.int(8, 20);
    for (let q = 0; q < n; q++) {
      pts.push([X, Y]);
      sway += (random() - 0.5) * 0.5;
      X += sway * 3;
      Y += dir * 3;
      if (Y < ridge(X) + 8 || Y > fS(X) - 12 || woodedHill(X, Y)) break;
    }
    if (pts.length > 4) {
      addRoad(pts, 2, 0.56);
      lanes.push(pts);
    }
  }
  /** One house or block on the hillside, p its scale with distance (0.4 far .. 1.4 by the water). */
  const house = (X, Y, p, opt = {}) => {
    const w = Math.max(2, Math.round((opt.w ?? 4 + random() * 7) * p));
    const h = Math.max(2, Math.round((opt.h ?? 3 + random() * 6) * p));
    const lit = opt.lit ?? 0.42 + random() * 0.3;
    const warmth = random();
    const bits = random.int(0, 99999);
    items.push({
      y: opt.z ?? Y,
      draw: () => {
        clearLights(X, Y - h, w, h + 1);
        const wall = mix(0x0a1020, 0x161c2c, Math.min(1, p));
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) setB(X + i, Y - h + j, i >= w - 1 ? mix(wall, 0x000000, 0.4) : wall);
        // the roof catches the sky and the street's glow
        for (let i = -1; i <= w; i++) setB(X + i, Y - h - 1, mix(0x182030, 0x38384a, Math.min(1, p * 0.7)));
        const sx = p > 0.9 ? 3 : 2;
        const sy = p > 0.9 ? 4 : 3;
        const g = bits & 3;
        for (let yy = Y - h + 1; yy < Y; yy += sy)
          for (let xx = X + (p > 0.9 ? 1 : 0); xx < X + w - 1; xx += sx) {
            if (hashPx(xx, yy, bits) > lit) continue;
            const t = hashPx(xx + 1, yy, bits);
            const c = warmth < 0.72 ? WARM[Math.floor(t * WARM.length)] : t < 0.5 ? WHITE[Math.floor(t * 8)] : WARM[Math.floor(t * 4)];
            const br = 0.3 + 0.7 * Math.min(1, p) * (0.25 + hashPx(xx, yy + 1, bits) ** 2 * 0.95);
            lamp(xx, yy, c, br, g);
            if (p > 1) lamp(xx + 1, yy, c, br * 0.85, g);
          }
      },
    });
  };
  // the houses in their thousands: thick along the streets and round the old centres, thinning between them, and
  // thinning again towards the woods, where the last few stand among the trees
  for (let Y = 106 * S; Y < 250 * S; ) {
    const t0 = smooth(100 * S, 200 * S, Y);
    const p = 0.42 + t0 * 0.85;
    const stepY = Math.round(2 + p * 3);
    for (let X = -12 + random.int(0, 5); X < W; X += Math.round(2 + p * 4 + random() * 3)) {
      const yy = Math.round(Y + (random() - 0.5) * stepY * 1.5);
      const ry = ridge(X);
      const sh = fS(X);
      if (yy < ry + 5 || yy > sh - 6 || inPark(X, yy)) continue;
      const q = woodQ(X, yy);
      if (q > 9 || (q > 0 && random() > 0.09)) continue;
      const t = (yy - ry) / (sh - ry);
      const x = Math.max(0, Math.min(215, Math.round(X / S)));
      const y = Math.max(0, Math.min(419, Math.round(yy / S)));
      const ravine = Math.abs(X / S - (74 + Math.sin((yy / S) * 0.044) * 16)) < 4 || Math.abs(X / S - (152 + Math.sin((yy / S) * 0.057) * 12)) < 3.5;
      const cluster = fbm(X / S, yy / S, { seed: 735, scale: 13, octaves: 3 });
      const edge = q > 0 ? 1 : 1 - smooth(-12, 0, q) * 0.86;
      const d = (0.3 + dens[y * 216 + x] * 0.9 + centre(x, y) * 0.55) * (0.5 + cluster * 1.05) * (ravine ? 0.3 : 1) * edge * (0.56 + smooth(0, 0.6, t) * 0.5);
      if (random() > d) continue;
      house(X, yy, 0.38 + t * 0.95, { lit: 0.26 + random() * 0.36 + centre(x, y) * 0.2 });
    }
    Y += stepY;
  }
  // scattered lights in the woods and over the top
  for (let i = 0; i < 300; i++) {
    const X = random.int(0, W - 1);
    const Y = random.int(100 * S, 200 * S);
    if (Y < ridge(X) + 6 || Y > fS(X) - 8 || !(woodedHill(X, Y) || inPark(X, Y))) continue;
    if (random() < 0.5) lamp(X, Y, random.pick(WARM), 0.45);
  }
  /** A street as lamps and a faint ribbon of road: a list of [X, Y]. */
  const street = (pts, gap, c, p, opt = {}) => {
    let acc = 0;
    for (let k = 0; k + 1 < pts.length; k++) {
      const [x0, y0] = pts[k];
      const [x1, y1] = pts[k + 1];
      const len = Math.hypot(x1 - x0, y1 - y0);
      for (let q = 0; q < len; q += 1) {
        const X = x0 + ((x1 - x0) * q) / len;
        const Yy = y0 + ((y1 - y0) * q) / len;
        acc += 1;
        const on = Math.floor(acc) % gap === 0;
        const cars = opt.cars && hashPx(Math.floor(acc), 11, 73) < opt.cars;
        const red = hashPx(Math.floor(acc), 12, 75) < 0.5;
        items.push({
          y: Yy + (opt.zb ?? 0.5),
          draw: () => {
            E.add(X, Yy, c, (opt.ribbon ?? 0.06) * p);
            if (on) lamp(X, Yy, c, p * (0.75 + hashPx(Math.floor(X), 5, 74) * 0.45));
            if (cars) lamp(X + (red ? 1 : -1), Yy + (red ? 1 : 0), red ? 0xff4030 : 0xfff8e0, 0.9);
          },
        });
      }
    }
  };
  // the contour streets across the hills, one above another, in sodium and whiter LEDs
  for (const [run, n] of contours) street(run, 4 + (n > 6 ? 1 : 2), n % 3 === 2 ? 0xd8e4f0 : 0xffb868, 0.56 + n * 0.03, { ribbon: 0.035 });
  for (const pts of lanes) street(pts, random.int(4, 7), random() < 0.3 ? 0xd8e4f0 : 0xffb868, 0.44, { ribbon: 0.018 });
  // the arteries: brighter, winding down the valleys to the waterfront, cars on them
  arteries.forEach((pts, i) => street(pts, 3, i % 2 ? 0xffc070 : 0xffd090, i % 2 ? 0.56 : 0.8, { ribbon: i % 2 ? 0.035 : 0.06, cars: i % 2 ? 0.03 : 0.09 }));
  // the waterfront: the road along the harbour, its lamps close together, cars; then the quay's edge right on the water
  {
    const road = [];
    const quay = [];
    for (let X = 0; X < W; X += 2) {
      road.push([X, fS(X) - 6]);
      quay.push([X, fS(X) - 1]);
    }
    street(road, 2, 0xffc878, 1.1, { ribbon: 0.18, cars: 0.22 });
    street(quay, 5, 0xfff0d0, 0.85, { ribbon: 0.06, zb: 2 });
  }
  /** A tall block along the waterfront: a dark slab, floors of windows lit in patches, a light on its roof. */
  const tower = (X, Y, w, h, opt = {}) => {
    const cool = opt.cool ?? random() < 0.35;
    const seed2 = random.int(0, 99999);
    items.push({
      y: Y + 1,
      draw: () => {
        clearLights(X, Y - h, w, h + 1);
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) setB(X + i, Y - h + j, i >= w - 2 ? 0x080c18 : i === 0 ? 0x1c2436 : 0x10162a);
        const g = seed2 & 3;
        for (let yy = Y - h + 2; yy < Y - 1; yy += 3) {
          const floorOn = hashPx(yy, 1, seed2) < 0.82;
          for (let xx = X + 1; xx < X + w - 2; xx += 2) {
            const patch = hashPx(xx >> 3, yy >> 3, seed2) < 0.56;
            if (!floorOn || !patch || hashPx(xx, yy, seed2) < 0.14) continue;
            const c = cool ? (hashPx(xx, yy, seed2 + 1) < 0.8 ? 0xd8ecff : 0xfff0d8) : hashPx(xx, yy, seed2 + 1) < 0.8 ? 0xffd898 : 0xfff4e0;
            lamp(xx, yy, c, 0.34 + hashPx(xx, yy, seed2 + 2) ** 2 * 0.62, g);
          }
        }
        for (let i = 0; i < w; i++) setB(X + i, Y - h - 1, 0x2a3044);
        if (opt.beacon) {
          lamp(X + 1, Y - h - 3, 0xff3a28, 1.6, 0);
          lamp(X + w - 2, Y - h - 3, 0xff3a28, 1.6, 2);
        }
      },
    });
  };
  // downtown and the station: a crowd of blocks on the far shore, highest towards the left
  for (let X = 6; X < 118 * S; X += random.int(10, 22)) {
    const x = X / S;
    const Y = Math.round(fS(X)) - 8;
    const hmax = x < 44 ? 70 : x < 92 ? 52 : 30;
    tower(X, Y - random.int(0, 3), random.int(9, 20), random.int(12, hmax), { beacon: random() < 0.2 });
    if (random() < 0.45) tower(X + random.int(-3, 6), Y - random.int(10, 24), random.int(8, 15), random.int(10, hmax - 2));
  }
  tower(24 * S, Math.round(fS(24 * S)) - 7, 27, 104, { beacon: true, cool: true }); // the station's hotel tower
  tower(34 * S, Math.round(fS(34 * S)) - 7, 21, 82, { beacon: true });
  // the neon of Hamanomachi and Shianbashi: upright signs and strips, reds and pinks, their colour in the air
  items.push({
    y: 1e6,
    draw: () => {
      const g = rng(4242);
      for (let i = 0; i < 44; i++) {
        const X = Math.round((50 + g() * 42) * S);
        const Yy = Math.round(fS(X)) - 8 - Math.floor(g() * 40);
        const c = NEON[Math.floor(g() * NEON.length)];
        const up = g() < 0.6;
        const n = up ? 4 + Math.floor(g() * 6) : 3 + Math.floor(g() * 5);
        const gp = Math.floor(g() * 4);
        for (let q = 0; q < n; q++) lamp(up ? X : X + q, up ? Yy + q : Yy, c, 1.25, gp);
      }
    },
  });
  // Mt Kompira's three masts on the ridge, red lights top and middle
  for (const [mx, mh] of [[46 * S, 58], [54 * S, 42], [40 * S, 36]]) {
    items.push({
      y: 0,
      draw: () => {
        const y = Math.round(ridge(mx)) + 4;
        for (let j = 0; j < mh; j++) {
          const hw = Math.max(1, 4 - (j / mh) * 3);
          setB(mx - hw, y - j, 0x2a3648);
          setB(mx + hw, y - j, 0x1a2434);
          if (j % 5 === 0) lineB(mx - hw, y - j, mx + hw, y - j, 0x222e40);
        }
        lamp(mx, y - mh, 0xff3020, 1.8, 0);
        lamp(mx, y - Math.round(mh * 0.55), 0xff3020, 1.4, 2);
      },
    });
  }
  // Dejima's wharf: a warm string on the water, restaurants' terraces, the fan's dark roofs behind
  items.push({
    y: 1e6 + 1,
    draw: () => {
      const X0 = 96 * S;
      for (let i = 0; i < 60; i += 12) {
        const X = X0 + i;
        const y = Math.round(fS(X)) - 8;
        polyB([[X, y], [X + 6, y - 4], [X + 12, y], [X + 10, y + 3], [X + 2, y + 3]], 0x141c2c);
        for (let q = 2; q < 10; q += 3) lamp(X + q, y + 2, 0xffd090, 0.8);
      }
      for (let i = 0; i < 78; i += 2) lamp(X0 - 6 + i, Math.round(fS(X0 - 6 + i)) - 1, i % 8 === 0 ? 0xff8a4a : 0xffd890, 1.25);
    },
  });
  // Oura Cathedral on its wooded knoll, up from the water: floodlit from below, so bright at its foot and falling off upward
  items.push({
    y: 1e6 + 2,
    draw: () => {
      const cx = 128 * S;
      const cy = Math.round(fS(cx)) - 46;
      // the knoll's trees close round it, and the Glover garden's few lamps
      const g = rng(4343);
      for (let q = 0; q < 34; q++) {
        const a = g() * 6.28;
        const rr = 12 + g() * 15;
        const x0 = cx + Math.cos(a) * rr * 1.2;
        const y0 = cy + 3 + Math.sin(a) * rr * 0.58;
        const r = 3 + g() * 4;
        for (let j = -r; j <= r; j++)
          for (let i = -r; i <= r; i++) {
            if (i * i + j * j > r * r) continue;
            clearLights(x0 + i, y0 + j, 1, 1);
            setB(x0 + i, y0 + j, j < -r * 0.3 ? 0x1a2c30 : 0x0a1418);
          }
      }
      for (let q = 0; q < 7; q++) lamp(cx - 26 + g() * 52, cy + 8 + g() * 8, 0xffd898, 0.5);
      E.add(cx, cy - 2, 0xc8dcf0, 2.6);
      for (let j = 0; j < 9; j++) {
        const t = j / 8;
        for (let i = -7; i <= 7; i++) setB(cx + i, cy - 7 + j, i > 5 ? mix(0x34424e, 0x5a6a78, t) : mix(0x5a6c7c, 0xb8c8d4, t));
      }
      polyB([[cx - 8, cy - 7], [cx, cy - 12], [cx + 8, cy - 7]], (x, y) => (x < cx ? 0x4a5a68 : 0x2a3844));
      for (let j = 0; j < 15; j++) for (let i = -2; i <= 1; i++) setB(cx + i, cy - 14 + j, i > 0 ? mix(0x3a4a58, 0x6a7a88, j / 14) : mix(0x6a7c8c, 0xc8d8e0, j / 14));
      polyB([[cx - 2, cy - 14], [cx, cy - 22], [cx + 1, cy - 14]], 0x4a7a78);
      for (let j = 0; j < 4; j++) lamp(cx, cy - 22 - j, 0xfff4c8, 0.9, 0);
      for (const i of [-1, 1]) lamp(cx + i, cy - 25, 0xfff4c8, 0.8, 0);
      for (const i of [-6, -4, 3, 5]) for (let j = 0; j < 3; j++) lamp(cx + i, cy - 5 + j, j % 2 ? 0xc87a58 : 0x6a98c8, 0.5, 1);
      lamp(cx, cy - 3, 0xffd890, 0.7, 1);
      // the long stair down to the waterfront, its lamps one under another
      for (let j = 3; j < 34; j += 5) lamp(cx - 1 + Math.sin(j * 0.3) * 2, cy + j, 0xffe0b0, 0.72, j & 3);
    },
  });
  // the cruise liner at Matsugae: a long cliff lying on the far shore, deck on deck of lit balconies, her funnel
  items.push({
    y: 1e6 + 3,
    draw: () => {
      const X0 = 108 * S;
      const L = 90;
      const Y0 = Math.round(fS(X0)) + 7;
      const dy = (i) => Math.round(-i * 0.3);
      for (let i = 0; i < L; i++) {
        const bow = i > L - 16 ? (i - (L - 16)) * 0.72 : 0;
        const stern = i < 6 ? (6 - i) * 0.5 : 0;
        const top = 20 - bow - stern;
        clearLights(X0 + i, Y0 + dy(i) - top - 2, 1, top + 3);
        for (let j = 0; j < top; j++) {
          const yy = Y0 + dy(i) - j;
          let c;
          if (j < 4) c = 0x0c1420; // the dark hull at the water
          else if (j < 5) c = 0xa8b4c0; // its white line
          else c = j % 3 === 2 ? 0x8a96a2 : j % 3 === 1 ? 0x5a6672 : 0x3a4654;
          setB(X0 + i, yy, c);
          // each deck a row of separate lit cabins, some dark, the row above them in shade
          if (j >= 6 && j % 3 === 0 && i % 2 === 0 && hashPx(i >> 1, j, 76) < 0.62) lamp(X0 + i, yy, hashPx(i, j, 77) < 0.8 ? 0xffdca0 : 0xc8e8ff, 0.42 + hashPx(i, j, 78) * 0.24, (i >> 3) & 3);
        }
      }
      // the upper decks stepping back, the funnel under a floodlight, the mast's light
      const CI = 40;
      for (let i = 14; i < 66; i++) for (let j = 20; j < 25; j++) setB(X0 + i, Y0 + dy(i) - j, j > 23 ? 0x8a98a8 : 0x3a4656);
      for (let i = 14; i < 66; i += 3) lamp(X0 + i, Y0 + dy(i) - 22, 0xffe4b0, 0.55, 1);
      for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) setB(X0 + CI + i, Y0 + dy(CI + i) - 25 - j, j > 5 ? 0x141418 : i > 6 ? 0x8a2018 : 0xd83828);
      E.add(X0 + CI + 4, Y0 + dy(CI) - 28, 0xff6a50, 1.2);
      lamp(X0 + 64, Y0 + dy(64) - 30, 0xffffff, 1.4, 3);
      lamp(X0 + 8, Y0 + dy(8) - 26, 0xffffff, 1.4, 1);
      E.add(X0 + 40, Y0 + dy(40) - 12, 0xffd8a0, 0.8);
    },
  });
  // the Ōhato ferry pier and two smaller ones: lit canopies out over the water
  items.push({
    y: 1e6 + 4,
    draw: () => {
      for (const [x, len] of [[68, 18], [92, 11], [150, 9]]) {
        const X = x * S;
        const Yy = Math.round(fS(X));
        for (let j = 0; j < len; j++) {
          for (let i = 0; i < 6; i++) setB(X + i + j * 0.3, Yy + j, j % 3 ? 0x1a2230 : 0x2a3444);
          if (j % 3 === 0) {
            lamp(X + j * 0.3, Yy + j, 0xfff0d0, 0.95);
            lamp(X + 5 + j * 0.3, Yy + j, 0xfff0d0, 0.95);
          }
        }
      }
    },
  });

  // ------------------------------------------------------------ the near shore: the Mitsubishi yard
  items.push({
    y: 2e6,
    draw: () => {
      // the quay's long edge, lamps along it close together
      for (let X = 0; X < 150 * S; X += 1) {
        const y = nS(X);
        setB(X, y, 0x3a4656);
        setB(X, y + 1, 0x202a38);
        if (X % 5 === 0) lamp(X, y + 3, X % 15 === 0 ? 0xffffff : 0xffd080, 1);
      }
      // low sheds along it, one roof after another following the shore: their long skylights just glowing
      const g = rng(99);
      for (let X = -6; X < 148 * S; ) {
        const w = 24 + Math.floor(g() * 30);
        const d = 18 + Math.floor(g() * 16);
        const y0 = nS(X) + 8 + g() * 5;
        const m = (nS(X + w) - nS(X)) / w;
        polyB([[X, y0], [X + w, y0 + m * w], [X + w + 5, y0 + m * w + d], [X + 5, y0 + d]], (a, b) => (Math.floor(b + a * 0.5) % 6 === 0 ? 0x1a2432 : 0x101824));
        for (let q = 4; q < d - 2; q += 6) for (let i = 3; i < w - 2; i += 2) if (g() < 0.7) lamp(X + i + q * 0.25, y0 + m * i + q, 0xc8e0e8, 0.32);
        // the end wall's big lit door
        const dy = y0 + d;
        for (let j = 0; j < 7; j++) for (let i = 0; i < 9; i++) if (g() < 0.88) lamp(X + 8 + i, dy + m * 8 - 3 + j * 0.6, 0xffe8b8, 0.75, 1);
        // a yard lamp on its tall pole, its pool of light on the concrete
        if (g() < 0.7) {
          const lx = X + w + 9;
          const ly = nS(lx) + 30;
          lineB(lx, ly, lx, ly - 24, 0x2a3444);
          lamp(lx, ly - 25, 0xfff4e0, 1.5);
          lamp(lx + 1, ly - 25, 0xfff4e0, 1.3);
          for (let i = 0; i < 30; i++) E.add(lx + (g() - 0.5) * 26, ly + (g() - 0.5) * 10, 0xffe8b8, 0.03);
        }
        // a gantry crane at the quay's edge
        if (g() < 0.5) {
          const cx = X + w + 3;
          const cy = nS(cx) + 3;
          const hh = 24 + g() * 14;
          for (const s of [-4, 4]) lineB(cx + s, cy, cx + s * 0.3, cy - hh, 0x4a6276);
          for (let j = 3; j < hh; j += 5) lineB(cx - 4 + j * 0.08, cy - j, cx + 4 - j * 0.08, cy - j - 5, 0x34485a);
          lineB(cx - 12, cy - hh + 2, cx + 26, cy - hh - 3, 0x7a94a6);
          lamp(cx + 26, cy - hh - 4, 0xff4030, 1.5, 2);
          lamp(cx - 12, cy - hh + 1, 0xff4030, 1.2, 0);
          for (let i = -8; i <= 18; i += 4) lamp(cx + i, cy - hh + 1 - i * 0.12, 0xfff0d0, 0.8);
        }
        X += w + 10 + Math.floor(g() * 22);
      }
      // the ship fitting out at the quay: a long dark hull, red at her boot-top, deck lamps in a string, her bridge
      {
        const X0 = 22 * S;
        const yAt = (i) => Math.round(nS(X0 + i)) - 16;
        for (let i = 0; i < 112; i++) {
          const y = yAt(i);
          const bow = i > 96 ? (i - 96) * 0.36 : 0;
          clearLights(X0 + i, y - 2, 1, 16);
          for (let j = bow; j < 12; j++) setB(X0 + i, y + j, j < 2 + bow ? 0x4a5866 : j < 8 ? 0x141c26 : 0x4a1c18);
          if (i % 4 === 0) lamp(X0 + i, y - 1 + bow, 0xffe8b8, 0.9, i & 3);
        }
        const yb = yAt(14);
        for (let j = 0; j < 19; j++) for (let i = 8; i < 28; i++) setB(X0 + i, yb - j, j % 4 === 3 ? 0x3a4656 : i > 25 ? 0x4a5866 : 0x8a98a4);
        for (let yy = yb - 16; yy < yb - 1; yy += 4) for (let i = 10; i < 26; i += 2) if (g() < 0.82) lamp(X0 + i, yy, 0xffe0a0, 0.9, (i >> 2) & 3);
        for (let j = 0; j < 8; j++) for (let i = 13; i < 19; i++) setB(X0 + i, yb - 19 - j, j > 5 ? 0x141418 : 0xa82a20);
      }
      // the goliath over the dry dock: two lit legs, the long bridge beam, a row of bulbs, red at both ends
      {
        const X1 = 102 * S;
        const Y1 = Math.round(nS(X1)) + 24;
        const X2 = 134 * S;
        const Y2 = Math.round(nS(X2)) + 24;
        const hh = 44;
        for (const [X, Yy] of [[X1, Y1], [X2, Y2]]) {
          for (let i = 0; i < 4; i++) lineB(X + i, Yy, X + i, Yy - hh, i < 2 ? 0x8a3028 : 0x5a1c18);
          for (let j = 0; j < hh; j += 8) lineB(X - 1, Yy - j, X + 4, Yy - j - 4, 0xc8c8c0, 0.7);
          lamp(X + 1, Yy - hh - 2, 0xff3020, 1.7, 0);
        }
        for (let q = 0; q <= X2 - X1; q++) {
          const X = X1 + q;
          const Yy = Y1 - hh + ((Y2 - Y1) * q) / (X2 - X1);
          for (let j = 0; j < 9; j++) setB(X, Yy + j, j < 1 ? 0xc85040 : j > 7 ? 0x4a1410 : (X + j) % 9 < 2 ? 0xa83a30 : 0x2a1412);
          if (q % 5 === 0) lamp(X, Yy + 10, 0xfff0d0, 1);
          if (q % 12 === 0) lamp(X, Yy - 1, 0xff9a70, 0.7);
        }
      }
      // the Giant Cantilever Crane of 1909: an uplit lattice tower, its hammerhead against the water, the trolley
      {
        const cx = 66 * S;
        const yB = Math.round(nS(cx)) + 8;
        const yT = yB - 84;
        const slope = -0.08;
        for (let j = 0; j < 84; j++) {
          const hw = 9 - (j / 84) * 4;
          setB(cx - hw, yB - j, 0x8aaabc);
          setB(cx + hw, yB - j, 0x4a6478);
          if (j % 8 === 0) {
            const h2 = 9 - ((j + 8) / 84) * 4;
            lineB(cx - hw, yB - j, cx + h2, yB - j - 8, 0x6a8a9e);
            lineB(cx + hw, yB - j, cx - h2, yB - j - 8, 0x4a6478);
            lineB(cx - hw, yB - j, cx + hw, yB - j, 0x5a7a8e);
          }
        }
        const a = cx - 30;
        const b = cx + 72;
        for (let X = a; X < b; X++) {
          const y1 = yT + (X - cx) * slope;
          setB(X, y1, 0x6a8a9e);
          setB(X, y1 - 11, 0xa8c4d4);
          if ((X - a) % 8 === 0) {
            lineB(X, y1, X + 4, y1 - 11, 0x7a9aae);
            lineB(X + 4, y1 - 11, X + 8, y1, 0x5a7a8e);
          }
        }
        for (let j = 0; j < 10; j++) for (let i = 0; i < 12; i++) setB(a + i, yT - 11 + (a - cx) * slope + j, 0x141c26);
        for (let j = 0; j < 8; j++) for (let i = -8; i <= 8; i++) setB(cx + i, yT - 20 + j, j < 1 ? 0x8aa4b4 : 0x2a3a48);
        for (let i = -6; i <= 6; i += 3) lamp(cx + i, yT - 16, 0xffe0a0, 1);
        for (const [X, Yy] of [[a, yT - 13 + (a - cx) * slope], [b - 1, yT - 12 + (b - cx) * slope], [cx, yT - 22]]) lamp(X, Yy, 0xff3a28, 1.7, 0);
        for (let j = 0; j < 60; j += 3) E.add(cx, yB - j, 0x8ac0e0, 0.5);
      }
      // Megami Ōhashi, from the near shore across to the far one: the white deck, its lamps close together, two A-shaped
      // pylons uplit in pale blue, their fans of stays
      {
        const X0 = 136 * S;
        const Y0 = nS(X0) + 6;
        const X1 = 192 * S;
        const Y1 = fS(X1) - 2;
        const P = (t) => [X0 + (X1 - X0) * t, Y0 + (Y1 - Y0) * t];
        for (const t of [0.3, 0.68]) {
          const [x, y] = P(t);
          for (let j = 0; j < 7; j++) lineB(x - 2 - (1 - t) * 3, y + j, x + 2 + (1 - t) * 3, y + j, 0x3a4c5c);
        }
        for (let q = 0; q <= 1; q += 0.0015) {
          const [x, y] = P(q);
          const hw = 3.6 - q * 2.4;
          clearLights(x - hw, y - 1, hw * 2, 4);
          setB(x, y - hw * 0.5, 0xe8f4f8);
          setB(x + 1, y - hw * 0.5, 0xc8dce6);
          setB(x, y + hw * 0.5, 0xb0c8d4);
          setB(x, y, 0x2a3644);
          setB(x, y + hw * 0.5 + 1, 0x4a6478);
          setB(x, y + hw * 0.5 + 2, 0x1a2a38);
        }
        const nq = 60;
        for (let k = 0; k <= nq; k++) {
          const t = k / nq;
          const [x, y] = P(t);
          const hw = 3.6 - t * 2.4;
          lamp(x, y - hw * 0.5 - 1, 0xf0f8ff, 0.95, k & 3);
          if (k % 2) lamp(x + 1, y + hw * 0.5, 0xfff0c8, 0.8, (k + 2) & 3);
        }
        for (const [t, hh] of [[0.68, 62], [0.3, 92]]) {
          const [x, y] = P(t);
          const top = y - hh;
          const spread = 8 - t * 5;
          for (let q = 1; q <= 9; q++) {
            for (const s of [-1, 1]) {
              const [xs, ys] = P(t + s * q * 0.03);
              lineB(x, top + 5 + q * 1.5, xs, ys, 0x9ac4d8, 0.55);
              lineE(x, top + 5 + q * 1.5, xs, ys, 0x6a9abe, 0.05);
            }
          }
          for (const s of [-1, 1]) {
            lineB(x + s * spread, y + 3, x + s * 0.8, top, s < 0 ? 0xf0fafc : 0xb8d4e0);
            lineB(x + s * spread - 1, y + 3, x + s * 0.8 - 1, top, 0xdcecf2);
            lineE(x + s * spread, y + 3, x + s, top, 0x8ac0e8, 0.22);
          }
          lineB(x - spread * 0.72, y - hh * 0.3, x + spread * 0.72, y - hh * 0.3, 0xe8f0f2);
          lamp(x, top - 1, 0xff4a38, 1.7, 0);
          lamp(x + 1, top - 1, 0xff4a38, 1.2, 0);
        }
      }
    },
  });
  // ------------------------------------------------------------ Inasa's own streets, nearest and largest
  // A real neighbourhood on a slope: lanes along the contours and steps between them, one house after another along
  // each, every roof its own, a few lit windows each rather than a grid; trees in the gaps and the gardens.
  const treeM = (X, Y) => fbm(X / S, Y / S, { seed: 736, scale: 13, octaves: 3 });
  const slopeTop = (X) => nS(X) + 46;
  const slopeEnd = (X) => treeLine(X) + 12;
  const scaleAt = (Y) => 0.82 + smooth(262 * S, 392 * S, Y) * 1.0;
  const home = (X, Y, opt = {}) => {
    const p = scaleAt(Y);
    const style = random();
    const block = !opt.house && style < 0.09;
    const w = Math.round((block ? 15 + random() * 9 : 9 + random() * 8) * p);
    const fh = Math.round((block ? 10 + random() * 6 : 3.4 + random() * 2.4) * p);
    const rh = block ? 1 : Math.round((2.4 + random() * 2) * p);
    const dark = random() < 0.14;
    const bits = random.int(0, 99999);
    const warm = random() < 0.8;
    const tone = random();
    items.push({
      y: 2e6 + Y,
      draw: () => {
        clearLights(X - 2, Y - fh - rh - 1, w + 4, fh + rh + 2);
        const wall = mix(0x10141e, 0x1c202c, tone);
        for (let j = 0; j < fh; j++) for (let i = 0; i < w; i++) setB(X + i, Y - fh + j, i >= w - 1 ? mix(wall, 0x000000, 0.5) : wall);
        if (block) {
          // a little block of flats: flat roof, its parapet catching the sky, floors of windows
          for (let i = -1; i <= w; i++) {
            setB(X + i, Y - fh - 1, 0x3a4252);
            setB(X + i, Y - fh, 0x20242e);
          }
          const sy = Math.max(3, Math.round(3 * p));
          const sx = Math.max(3, Math.round(3.4 * p));
          for (let yy = Y - fh + 2; yy < Y - 1; yy += sy)
            for (let xx = X + 2; xx < X + w - 2; xx += sx) {
              if (hashPx(xx, yy, bits) > 0.5) continue;
              const c = hashPx(xx + 1, yy, bits) < 0.7 ? 0xffd898 : 0xe8f0ff;
              const br = 0.4 + hashPx(xx, yy + 1, bits) * 0.45;
              lamp(xx, yy, c, br, bits & 3);
              lamp(xx + 1, yy, c, br * 0.8, bits & 3);
            }
          return;
        }
        // the roof: a low hipped shape, its two slopes lit differently, the ridge and eaves picked out by the sky
        const ridgeA = X + Math.round(w * 0.22);
        const ridgeB = X + Math.round(w * 0.78);
        const top = Y - fh - rh;
        polyB([[X - 1, Y - fh], [ridgeA, top], [ridgeB, top], [X + w, Y - fh]], (x, y) => {
          const f = (y - top) / Math.max(1, rh);
          const c = x < ridgeA ? mix(0x1a2232, 0x242c3c, f) : x > ridgeB ? mix(0x10161f, 0x161c28, f) : mix(0x28303f, 0x1e2634, f);
          const t2 = mix(c, tone < 0.3 ? 0x3a2a26 : tone < 0.5 ? 0x1e3a40 : tone < 0.62 ? 0x3a3a3e : c, 0.4);
          return (y - top) % 2 === 1 ? mix(t2, 0x000000, 0.2) : t2;
        });
        for (let i = ridgeA; i <= ridgeB; i++) setB(i, top, 0x4a5262);
        for (let i = -1; i <= w; i++) setB(X + i, Y - fh, 0x0a0e14);
        if (dark) return;
        const n = 1 + Math.floor(hashPx(bits, 1, 80) * 3.4);
        const ww = Math.max(2, Math.round(2.2 * p));
        const wh = Math.max(2, Math.round(1.7 * p));
        const room = Math.max(1, w - ww - 2);
        for (let q = 0; q < n; q++) {
          const xx = X + 1 + Math.round(((q + 0.3 + hashPx(q, bits, 81) * 0.4) / n) * room);
          const yy = Y - fh + 1 + Math.floor(hashPx(q, bits, 82) * Math.max(1, fh - wh - 1));
          const c = warm || q ? WARM[Math.floor(hashPx(q, bits, 83) * WARM.length)] : WHITE[Math.floor(hashPx(q, bits, 84) * WHITE.length)];
          const br = 0.34 + hashPx(q, bits, 85) ** 1.5 * 0.56;
          for (let j = 0; j < wh; j++) for (let i = 0; i < ww; i++) lamp(xx + i, yy + j, c, br * (j === 0 ? 0.68 : 1) * (hashPx(i, j + q, bits) < 0.14 ? 0.5 : 1), bits & 3);
        }
        // a porch lamp now and then, its light on the step
        if (hashPx(bits, 2, 86) < 0.32) {
          const xx = X + 2 + Math.floor(hashPx(bits, 3, 87) * Math.max(1, w - 4));
          lamp(xx, Y - 1, 0xffc070, 0.68);
          E.add(xx, Y + 1, 0xffb060, 0.25);
        }
      },
    });
  };
  const crown = (X, Y, r) => {
    const bits = random.int(0, 99999);
    items.push({
      y: 2e6 + Y + r * 0.4,
      draw: () => {
        for (let j = -r; j <= r; j++)
          for (let i = -r; i <= r; i++) {
            const n = hashPx((X + i) >> 1, (Y + j) >> 1, bits) - 0.5;
            if ((i / r) ** 2 + (j / (r * 0.84)) ** 2 + n * 0.34 > 1) continue;
            const lit = 0.5 - (j / r) * 0.5 - (i / r) * 0.14 + n * 0.6;
            clearLights(X + i, Y + j, 1, 1);
            setB(X + i, Y + j, [0x060d10, 0x0a1417, 0x0f1c1e, 0x162628, 0x1e3032][Math.max(0, Math.min(4, Math.floor(lit * 5)))]);
          }
      },
    });
  };
  /** A lane with its lamps, houses on both sides as far as the gardens let them. */
  const neighbourhood = (pts, opt = {}) => {
    const c = opt.c ?? 0xffb868;
    const gap = opt.gap ?? 26;
    let acc = random.int(0, gap);
    let next = random.int(2, 12);
    for (let k = 0; k + 1 < pts.length; k++) {
      const [x0, y0] = pts[k];
      const [x1, y1] = pts[k + 1];
      const len = Math.max(1, Math.hypot(x1 - x0, y1 - y0));
      const wide = opt.wide ?? 2;
      items.push({
        y: 2e6 + Math.max(y0, y1) + 0.4,
        draw: () => {
          for (let q = 0; q <= len; q++) {
            const x = x0 + ((x1 - x0) * q) / len;
            const y = y0 + ((y1 - y0) * q) / len;
            for (let j = 0; j < wide; j++) setB(x, y + j, j === 0 || j === wide - 1 ? 0x262a32 : 0x1c1f28);
            E.add(x, y + 1, c, opt.ribbon ?? 0.022);
          }
        },
      });
      for (let q = 0; q < len; q++) {
        const x = x0 + ((x1 - x0) * q) / len;
        const y = y0 + ((y1 - y0) * q) / len;
        acc += 1;
        if (acc % gap === 0) {
          const lx = x;
          const ly = y;
          const b = hashPx(Math.floor(x), Math.floor(y), 88);
          items.push({
            y: 2e6 + ly + 0.6,
            draw: () => {
              lineB(lx, ly, lx, ly - 7, 0x20242c);
              lamp(lx, ly - 8, c, 0.98 + b * 0.3);
              lamp(lx + 1, ly - 8, c, 0.8);
              for (let n = 0; n < 16; n++) E.add(lx + (hashPx(n, 1, Math.floor(lx)) - 0.5) * 16, ly + (hashPx(n, 2, Math.floor(lx)) - 0.5) * 7, c, 0.04);
            },
          });
        }
        next -= 1;
        if (next > 0) continue;
        next = random.int(11, 21);
        if (Math.abs(y1 - y0) > Math.abs(x1 - x0) * 1.2 && !opt.steep) continue;
        for (const side of [-1, 1]) {
          const hx = Math.round(x + (random() - 0.5) * 3);
          const off = side < 0 ? -random.int(1, 4) : 9 + random.int(6, 13);
          const hy = Math.round(y + off);
          if (hy < slopeTop(hx) || hy > slopeEnd(hx)) continue;
          if (random() > smooth(0.34, 0.5, treeM(hx, hy)) * 0.94) continue;
          home(hx, hy);
          if (side > 0 && random() < 0.5) home(hx + random.int(-4, 6), hy + random.int(11, 17));
        }
      }
    }
  };
  const lower = [];
  for (let X = -3; X < W + 3; X += 3) lower.push([X, (338 - (X / S) * 0.23 + Math.sin((X / S) * 0.065) * 6) * S]);
  const upper = [];
  for (let X = -3; X < W + 3; X += 3) upper.push([X, hR(X)]);
  neighbourhood(lower, { c: 0xd8e8f0, gap: 18, wide: 3, ribbon: 0.05 });
  neighbourhood(upper, { c: 0xffb060, gap: 15, wide: 3, ribbon: 0.05 });
  // the lesser lanes along the contours, each wandering; they stop where the gardens and trees take over
  for (const f of [0.06, 0.2, 0.36, 0.52, 0.68, 0.84, 0.96]) {
    const seed2 = Math.round(f * 100);
    let run = [];
    const flush = () => {
      if (run.length > 9) neighbourhood(run, { c: seed2 % 3 ? 0xffb868 : 0xd8e4f0, gap: 22 + seed2 % 7 });
      run = [];
    };
    for (let X = -3; X < W + 3; X += 3) {
      const Y = slopeTop(X) + (slopeEnd(X) - slopeTop(X)) * f + Math.sin(X * 0.012 + f * 9) * 11 + (fbm(X / S, f * 40, { seed: 747, scale: 12, octaves: 2 }) - 0.5) * 26;
      if (Y < slopeTop(X) || Y > slopeEnd(X) || treeM(X, Y) < 0.33) flush();
      else run.push([X, Y]);
    }
    flush();
  }
  // the steep lanes and steps between them, running down the slope
  for (let n = 0; n < 15; n++) {
    let X = (n + 0.2 + random() * 0.6) * (W / 15);
    let Y = slopeTop(X) + 6;
    const pts = [];
    let sway = (random() - 0.5) * 2;
    while (Y < slopeEnd(X) && pts.length < 70) {
      pts.push([X, Y]);
      sway += (random() - 0.5) * 1.1;
      sway = Math.max(-2.6, Math.min(2.6, sway));
      X += sway;
      Y += 3;
    }
    if (pts.length > 6) neighbourhood(pts, { c: 0xffc080, gap: 21, steep: true });
  }
  // the trees: thick where the gardens and the steep bits are, thinning out among the houses
  for (let i = 0; i < 1500; i++) {
    const X = random.int(0, W - 1);
    const Y = random.int(Math.round(slopeTop(X)) - 3, Math.round(slopeEnd(X)) + 6);
    const m = treeM(X, Y);
    if (random() > 1 - smooth(0.32, 0.5, m) + 0.05) continue;
    crown(X, Y, (3.4 + random() * 4) * scaleAt(Y));
  }
  // a convenience store on the lower road, always the brightest thing on its block; a second up the hill
  for (const [X, pts, wd] of [[62 * S, lower, 30], [132 * S, lower, 26], [38 * S, upper, 32], [164 * S, upper, 28]]) {
    const Yy = pts.reduce((best, q) => (Math.abs(q[0] - X) < Math.abs(best[0] - X) ? q : best))[1] - 3;
    items.push({
      y: 2e6 + Yy + 0.8,
      draw: () => {
        clearLights(X - 1, Yy - 14, wd + 2, 15);
        for (let j = 0; j < 14; j++) for (let i = 0; i < wd; i++) setB(X + i, Yy - 14 + j, j < 3 ? 0x2a2e38 : j < 6 ? 0xd8e8e8 : 0x1a1e26);
        for (let i = 0; i < wd; i++) for (let j = 3; j < 6; j++) lamp(X + i, Yy - 14 + j, j === 4 ? (i < wd * 0.4 ? 0x58e0a0 : 0xfff8e8) : 0xffffff, 0.7, 1);
        for (let i = 2; i < wd - 2; i++) for (let j = 7; j < 13; j++) if (i % 7) lamp(X + i, Yy - 14 + j, 0xf0f8ff, 0.72, 1);
        for (let q = 0; q < 60; q++) E.add(X + hashPx(q, 3, X) * wd, Yy + 2 + hashPx(q, 4, X) * 7, 0xe8f4f0, 0.05);
      },
    });
  }
  // the ropeway, coming up towards us over the rooftops: the lower station's lit hall, two lattice towers, two cables
  items.push({
    y: 3e6,
    draw: () => {
      const { x0, y0, x1, y1, gap } = ropeway;
      const P = (t, o = 0) => [(x0 + (x1 - x0) * t + o) * S, (y0 + (y1 - y0) * t) * S];
      // the station: a pale hall the cables come out of, glass along it, its forecourt lit
      const [sx, sy] = P(0);
      clearLights(sx - 25, sy - 14, 50, 24);
      for (let j = 0; j < 7; j++) for (let i = -24; i < 24; i++) setB(sx + i, sy - 13 + j, j < 1 ? 0x5a6472 : mix(0x2a303a, 0x3a424e, j / 6));
      for (let j = 0; j < 14; j++)
        for (let i = -22; i < 22; i++) {
          setB(sx + i, sy - 6 + j, j > 11 ? 0x1a1e26 : 0x20262e);
          if (j < 10 && i % 5 && j % 4) lamp(sx + i, sy - 6 + j, 0xfff0d0, 0.7, 2);
        }
      for (let q = 0; q < 90; q++) E.add(sx - 30 + hashPx(q, 5, 90) * 60, sy + 10 + hashPx(q, 6, 90) * 12, 0xffe8c8, 0.05);
      for (const o of [-gap, gap]) {
        const [a0, b0] = P(0, o);
        const [a1, b1] = P(1, o);
        lineB(a0, b0 - 8, a1, b1 - 8, 0x6a7a8a, 0.75);
        lineE(a0, b0 - 8, a1, b1 - 8, 0x4a6a8a, 0.012);
      }
      for (const t of [0.24, 0.5]) {
        const [tx, ty] = P(t);
        const hh = 34 + t * 24;
        const b = ty - 8 + hh;
        for (const s of [-1, 1]) {
          lineB(tx + s * (5 + t * 3), b, tx + s * 1.4, ty - 8, s < 0 ? 0x7a8c9c : 0x4a5a68);
          for (let j = 4; j < hh; j += 6) {
            const w0 = 1.4 + ((b - (ty - 8 + j)) / hh) * (4 + t * 3);
            lineB(tx - w0, ty - 8 + j, tx + w0, ty - 8 + j + 3, 0x4a5a68, 0.9);
          }
        }
        for (let i = -9; i <= 9; i++) setB(tx + i, ty - 9, 0x8a9aaa);
        lamp(tx, ty - 12, 0xff3a28, 1.5, 1);
      }
    },
  });
  items.sort((a, b) => a.y - b.y);
  for (const it of items) it.draw();

  // ------------------------------------------------------------ reflections and bloom
  const src = E.d;
  const small = blur(src, 1, 1);
  const refl = new Float32Array(src.length);
  for (let x = 0; x < W; x++) {
    const shore = fS(x);
    const nshore = nS(x);
    for (let y = Math.ceil(shore) + 1; y < nshore - 1; y++) {
      const d = y - shore;
      const t = d / (nshore - shore);
      // the column of light falling from what stands above this water, broken up by the ripples
      const rip = (fbm(x * 0.05, y * 0.7, { seed: 37, scale: 2.4, octaves: 2 }) - 0.5) * (2.2 + d * 0.035);
      const xs = Math.max(0, Math.min(W - 1, Math.round(x + rip)));
      const ys = Math.round(fS(xs) - 2 - d * 0.14);
      if (ys < 0) continue;
      const brk = fbm(x * 0.14, y * 1.2, { seed: 38, scale: 2, octaves: 2 });
      const fade = (1 - t) ** 1.5 * smooth(0.3, 0.58, brk) * 1.15;
      const i = (y * W + x) * 3;
      const q = (ys * W + xs) * 3;
      for (let k = 0; k < 3; k++) refl[i + k] = small[q + k] * fade;
      // and the near shore's lamps, short, upward from the quay
      const dn = nshore - y;
      if (dn < 50) {
        const yn = Math.round(nshore + 3 + dn * 0.2);
        const xn = Math.max(0, Math.min(W - 1, Math.round(x + rip * 0.4)));
        const qn = (yn * W + xn) * 3;
        const fn = (1 - dn / 50) ** 1.6 * smooth(0.3, 0.6, brk) * 0.8;
        for (let k = 0; k < 3; k++) refl[i + k] += small[qn + k] * fn;
      }
    }
  }
  const reflS = blur(refl, 0, 1);
  // the air: tight halos, wider ones, the dome of light over the city
  const b1 = blur(src, 3, 3);
  const b2 = blur(src, 11, 11);
  const b3 = blur(src, 48, 40);
  const city = new Raster(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!mask[y * W + x]) continue;
      const i = (y * W + x) * 3;
      const th = (BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.47) * 5;
      const out = [0, 0, 0];
      for (let k = 0; k < 3; k++) {
        const air0 = b1[i + k] * 1.0 + b2[i + k] * 1.5 + b3[i + k] * 2.5;
        const air = 150 * (1 - Math.exp(-air0 / 150));
        const lit = 210 * (1 - Math.exp(-(reflS[i + k] * 2.4) / 210));
        let v = base.d[i + k] + air + lit;
        v = Math.round((v + th) / 5) * 5; // the ordered dither keeps it pixel art
        out[k] = Math.max(0, Math.min(255, v + src[i + k] * 0.62));
      }
      city.setRGBA(x, y, out[0], out[1], out[2], 255);
    }
  // the brightest of the reflections twinkle with the lights
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 3;
      const v = Math.max(reflS[i], reflS[i + 1], reflS[i + 2]);
      if (v < 70) continue;
      const m = Math.max(1, v);
      lights[(x >> 2) & 3].setRGBA(x, y, Math.min(255, (reflS[i] * 255) / m), Math.min(255, (reflS[i + 1] * 255) / m), Math.min(255, (reflS[i + 2] * 255) / m), Math.min(150, v * 0.8));
    }
  // the moon's path on the water: short pale dashes under it, widening towards us, thickest down its middle, some twinkling
  for (let i = 0; i < 1500; i++) {
    const y0 = fS(MOON[0]);
    const k = random();
    const y = y0 + 12 + k * (nS(MOON[0]) - y0 - 16);
    const spread = 9 + (y - y0) * 0.26;
    const off = (random() + random() + random() - 1.5) * 0.66;
    const x = Math.round(MOON[0] + off * spread * 2);
    if (y < fS(x) + 8 || y > nS(x) - 5) continue;
    const al = random.range(0.12, 0.42) * (1 - Math.abs(off) * 0.8) * (0.55 + k * 0.45);
    const len = random.int(1, 3 + Math.round(k * 4));
    const c = random() < 0.2 ? 0xfff8e8 : 0xc8d8e8;
    if (random() < 0.3) lights[random.int(0, 3)].rect(x, Math.round(y), len, 1, c, Math.min(0.8, al * 2));
    else city.rect(x, Math.round(y), len, 1, c, al);
  }

  // ------------------------------------------------------------ the near layer: the summit's trees, then our rail
  {
    const crowns = [];
    for (let i = 0; i < 700; i++) {
      const x = random() * W;
      const y = treeLine(x) + random() * (H - treeLine(x)) - 6;
      crowns.push([x, y, 11 + random() * 20]);
    }
    crowns.sort((a, b) => a[1] - b[1]);
    for (let x = 0; x < W; x++) for (let y = Math.floor(treeLine(x)) + 18; y < H; y++) near.set(x, y, 0x02070a);
    for (const [cx, cy, r] of crowns) {
      const depth = Math.min(1, Math.max(0, (cy - treeLine(cx)) / 110));
      for (let j = -r; j <= r; j++)
        for (let i = -r; i <= r; i++) {
          const d = (i / r) ** 2 + (j / (r * 0.82)) ** 2;
          const n = fbm((cx + i) * 0.3, (cy + j) * 0.3, { seed: 128, scale: 2.6, octaves: 3 });
          if (d + (n - 0.5) * 1 > 1) continue;
          const lit = 0.5 - (j / r) * 0.62 + (n - 0.5) * 0.9;
          const tones = depth < 0.4 ? [0x03090c, 0x060f12, 0x0a161a, 0x101f22, 0x1a2e30] : [0x020508, 0x03090c, 0x060e11, 0x091418, 0x0e1a1e];
          near.set(cx + i, cy + j, tones[Math.max(0, Math.min(4, Math.floor(lit * 5)))]);
        }
    }
    // the terrace at our feet: its flags in the dark, widening towards us, the rail right across the view, lamps low along it
    const RY = (x) => 397 * S - (x - W / 2) * 0.012;
    const FLOOR0 = RY(W / 2) + 4;
    const rows = [];
    for (let y = FLOOR0, h = 4; y < H; h += 2) {
      rows.push(y);
      y += h;
    }
    for (let x = 0; x < W; x++)
      for (let y = Math.floor(RY(x)) + 4; y < H; y++) {
        const d = (y - FLOOR0) / (H - FLOOR0);
        let r = 0;
        while (r + 1 < rows.length && rows[r + 1] <= y) r++;
        const unit = 34 * (1 + d * 1.1);
        const xx = (x - W / 2) / unit + (r % 2) * 0.5;
        const joint = rows.includes(y) || Math.abs(xx - Math.round(xx)) * unit < 0.6;
        const c = joint ? 0x05090e : mix(mix(0x0c141c, 0x161c26, hashPx(Math.floor(xx), r, 79)), 0x0a0e14, d * 0.5);
        near.set(x, y, c);
      }
    const lampAt = [];
    for (let x = 30; x < W; x += 132) lampAt.push(x);
    for (const lx of lampAt)
      for (let j = 0; j < 44; j++)
        for (let i = -70; i <= 70; i++) {
          const d = Math.hypot(i / 70, j / 44);
          if (d < 1) near.set(lx + i, RY(lx) + 6 + j, 0xffc888, (1 - d) ** 2 * 0.3);
        }
    for (let x = 0; x < W; x++) {
      const y = RY(x);
      near.set(x, y - 13, 0x5a6a74);
      near.set(x, y - 12, 0x101a22);
      near.set(x, y - 7, 0x1c262e);
      near.set(x, y - 2, 0x1c262e);
      if (x % 27 < 2) for (let j = -13; j < 4; j++) near.set(x, y + j, x % 27 === 0 ? 0x2a3640 : 0x0a1218);
    }
    for (const lx of lampAt) for (let i = -2; i <= 2; i++) for (let j = 0; j < 3; j++) near.set(lx + i, RY(lx) + 1 + j, 0xffd898, 1);
    // love locks, in clusters where people like to clip them, on both wires
    for (const [a, b] of [[150, 268], [418, 470]])
      for (let x = a; x < b; x += 2) {
        const dense = 0.12 + Math.sin(((x - a) / (b - a)) * 3.14) * 0.34;
        for (const off of [-11, -6])
          if (hashPx(x, off, 80) < dense) {
            const c = [0xff6a8a, 0xffd868, 0xc8ccd0, 0x6ac0ff, 0xe8a060][Math.floor(hashPx(x, off, 89) * 5)];
            near.rect(x, RY(x) + off, 2, 2, mix(c, 0x10181e, 0.34), 0.92);
            near.set(x, RY(x) + off + 2, mix(c, 0x000000, 0.45));
          }
      }
    /**
     * Somebody at the rail with their back to us, built from limbs: dark against the view, the city's light rimming
     * them along the top and the lamp's warmth at one side. X is the middle of their feet, h their height.
     */
    const figure = (X, h, o = {}) => {
      const foot = RY(X) + (o.foot ?? 24);
      const big = o.child ? 1.22 : 1;
      const parts = [];
      const cap = (x0, y0, x1, y1, r, c) => parts.push([x0, y0, x1, y1, r, c]);
      const coat = o.coat ?? 0x1a2430;
      const legs = o.legs ?? 0x0c1218;
      const skin = 0x201816;
      const hair = o.hair ?? 0x0a0a0e;
      if (!o.seated) {
        cap(-0.05, 0.54, -0.075 - (o.wide ?? 0), 0.96, 0.052, legs);
        cap(0.05, 0.54, 0.075 + (o.wide ?? 0), 0.96, 0.052, legs);
        cap(-0.09, 0.98, -0.06, 0.98, 0.028, 0x060a0e);
        cap(0.09, 0.98, 0.06, 0.98, 0.028, 0x060a0e);
      }
      if (o.skirt) parts.push(['skirt', coat]);
      cap(0, 0.28, 0, 0.5, 0.115, coat);
      cap(-0.06, 0.53, 0.06, 0.53, 0.075, o.long ? coat : legs);
      if (o.long) cap(0, 0.5, 0, 0.72, 0.13, coat);
      cap(-0.1, 0.25, 0.1, 0.25, 0.058, coat);
      const arm = (s, pose) => {
        const sx = s * 0.15;
        if (pose === 'down') cap(sx, 0.27, s * 0.185, 0.54, 0.04, coat);
        else if (pose === 'rail') {
          cap(sx, 0.27, s * 0.2, 0.42, 0.04, coat);
          cap(s * 0.2, 0.42, s * 0.12, 0.47, 0.034, coat);
        } else if (pose === 'phone') {
          cap(sx, 0.27, s * 0.22, 0.14, 0.038, coat);
          cap(s * 0.22, 0.14, s * 0.2, -0.03, 0.032, coat);
        } else if (pose === 'point') {
          cap(sx, 0.27, s * 0.32, 0.2, 0.038, coat);
          cap(s * 0.32, 0.2, s * 0.5, 0.1, 0.03, coat);
        } else if (pose === 'hold') cap(sx, 0.27, s * 0.3, 0.42, 0.04, coat); // down to a hand held
        else if (pose === 'round') cap(sx, 0.25, s * 0.46, 0.27, 0.04, coat); // an arm round the one beside
      };
      arm(-1, o.left ?? 'down');
      arm(1, o.right ?? 'down');
      if (o.pack) parts.push(['pack', o.pack]);
      cap(0, 0.16, 0, 0.21, 0.032, skin);
      const headR = 0.074 * big;
      const headY = 0.095;
      cap(0, headY, 0, headY, headR, skin);
      // the hair, from behind it is most of the head
      if (o.style === 'long') cap(0, headY - 0.01, 0, 0.26, headR + 0.008, hair);
      else if (o.style === 'bun') {
        cap(0, headY - 0.008, 0, headY + 0.02, headR, hair);
        cap(0, headY - headR - 0.01, 0, headY - headR - 0.01, 0.03, hair);
      } else if (o.style === 'cap') {
        cap(0, headY, 0, headY + 0.02, headR, hair);
        cap(-headR * 0.9, headY - 0.03, headR * 0.9, headY - 0.03, 0.03, o.capC ?? 0x3a2a24);
      } else cap(0, headY - 0.006, 0, headY + 0.022, headR + 0.002, hair);
      // rasterise to a stencil, last limb on top
      const R = Math.round(h * 0.7);
      const top = Math.round(foot - h);
      const dw = 2 * R + 1;
      const dh = Math.round(h * 1.16);
      const st = new Int32Array(dw * dh).fill(-1);
      const ty0 = Math.round(h * 0.12);
      parts.forEach((pt, n) => {
        if (pt[0] === 'pack') {
          for (let j = 0; j < dh; j++)
            for (let i = 0; i < dw; i++) if (((i - R) / (0.1 * h)) ** 2 + ((j - ty0 - 0.37 * h) / (0.125 * h)) ** 2 < 1) st[j * dw + i] = n;
          return;
        }
        if (pt[0] === 'skirt') {
          for (let j = Math.round(0.48 * h); j < 0.72 * h; j++) {
            const hw = (0.11 + ((j / h - 0.48) / 0.24) * 0.05) * h;
            for (let i = -hw; i <= hw; i++) st[(j + ty0) * dw + R + Math.round(i)] = n;
          }
          return;
        }
        const [x0, y0, x1, y1, r] = pt;
        const ax = x0 * h;
        const ay = y0 * h;
        const bx = x1 * h;
        const by = y1 * h;
        const rr = r * h;
        for (let j = 0; j < dh; j++)
          for (let i = 0; i < dw; i++) {
            const px = i - R;
            const py = j - ty0;
            const l2 = (bx - ax) ** 2 + (by - ay) ** 2;
            const q = l2 ? Math.max(0, Math.min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / l2)) : 0;
            if (Math.hypot(px - ax - (bx - ax) * q, py - ay - (by - ay) * q) <= rr) st[j * dw + i] = n;
          }
      });
      const colourOf = (n) => {
        const p = parts[n];
        return p[0] === 'pack' ? p[1] : p[0] === 'skirt' ? p[1] : p[5];
      };
      const on = (i, j) => i >= 0 && j >= 0 && i < dw && j < dh && st[j * dw + i] >= 0;
      // their shadow on the flags, thrown towards us by the low lamps
      for (let j = 0; j < 22; j++)
        for (let i = -h * 0.17; i <= h * 0.17; i++) {
          const w0 = 1 - j / 22;
          if (Math.abs(i) < h * 0.17 * w0) near.set(X + i, foot + j - 1, 0x020407, 0.5 * w0);
        }
      for (let j = 0; j < dh; j++)
        for (let i = 0; i < dw; i++) {
          if (!on(i, j)) continue;
          const n = st[j * dw + i];
          let c = colourOf(n);
          // cloth folds, faint
          const fold = hashPx((i >> 1) + Math.round(j * 0.3), j >> 3, 91 + n);
          c = mix(c, fold < 0.5 ? 0x000000 : 0xffffff, fold < 0.5 ? 0.14 : 0.03);
          // the limbs part with a thin dark line
          if (on(i, j - 1) && st[(j - 1) * dw + i] !== n && colourOf(st[(j - 1) * dw + i]) !== colourOf(n)) c = mix(c, 0x000000, 0.3);
          if (!on(i - 1, j)) c = mix(c, 0xffc088, 0.2);
          else if (!on(i + 1, j)) c = mix(c, 0xa8d0f0, 0.2);
          if (!on(i, j - 1)) c = mix(c, 0xd8c8c0, 0.3);
          near.set(X + i - R, top - ty0 + j, c);
        }
      if (o.right === 'phone' || o.left === 'phone') {
        const s = o.right === 'phone' ? 1 : -1;
        const px = X + s * 0.2 * h;
        const py = top - 0.05 * h;
        near.rect(px - 3, py - 8, 7, 11, 0x0a0e14);
        near.rect(px - 2, py - 7, 5, 9, 0xc8e8ff);
        near.rect(px - 1, py - 4, 3, 3, 0xffc878, 0.8);
        for (let j = -12; j < 12; j++) for (let i = -12; i < 12; i++) near.set(px + i, py - 3 + j, 0xa8d8ff, Math.max(0, 0.16 * (1 - Math.hypot(i, j) / 13)));
      }
    };
    // a couple close together, one arm round the other
    figure(30 * S, 57, { coat: 0x18222e, right: 'round', legs: 0x0a1016 });
    figure(35.5 * S, 50, { coat: 0x3a2030, style: 'long', hair: 0x180e0c, left: 'rail', right: 'rail', skirt: true, legs: 0x1a1216 });
    // somebody who has walked up with a rucksack, leaning on the rail
    figure(78 * S, 54, { coat: 0x24303a, left: 'rail', right: 'rail', pack: 0x3a2a1c, style: 'cap', capC: 0x2a4050 });
    // a parent and a child, the child pointing something out
    figure(138 * S, 56, { coat: 0x2a2a32, right: 'hold', legs: 0x10141a, style: 'bun', hair: 0x14100e });
    figure(144.5 * S, 33, { coat: 0x6a3028, child: true, left: 'hold', right: 'point', legs: 0x141a2a, foot: 22 });
    // the one with a phone held up, friends beside them
    figure(165 * S, 57, { coat: 0x141e2c, right: 'phone', legs: 0x0a0e14 });
    figure(174 * S, 51, { coat: 0x303a44, left: 'rail', right: 'rail', legs: 0x12161e, style: 'long', hair: 0x1e1410 });
    figure(186 * S, 44, { coat: 0x4a2a34, right: 'rail', style: 'bun', hair: 0x241814, long: true });
    // a coin telescope on its post, a child on tiptoe at it
    {
      const X = 110 * S;
      const Y = RY(X);
      near.rect(X - 2, Y - 24, 5, 44, 0x10181e);
      near.rect(X - 2, Y - 24, 1, 44, 0x3a4c58);
      near.rect(X - 12, Y - 34, 21, 10, 0x18242c);
      near.rect(X - 12, Y - 34, 21, 1, 0x5a7482);
      near.rect(X - 13, Y - 31, 2, 4, 0xa8d0e0);
      near.rect(X - 8, Y + 20, 13, 3, 0x0a1016);
      figure(105 * S, 36, { coat: 0x2a4a5a, child: true, right: 'rail', left: 'down', legs: 0x1a1a22, foot: 24, style: 'cap', capC: 0xa83a2a });
    }
  }
  // ------------------------------------------------------------ the clouds that move: a sheet that wraps round, drawn over the sky alone
  const CW = W;
  const CH = 84 * S;
  const clouds = new Raster(CW, CH);
  for (let y = 0; y < CH; y++)
    for (let x = 0; x < CW; x++) {
      const f = (X, Yy) => {
        const a = fbm((X + CW) / (2.4 * S), (Yy / S) * 2.4, { seed: 121, scale: 26, octaves: 4 });
        const b = fbm(X / (2.4 * S), (Yy / S) * 2.4, { seed: 121, scale: 26, octaves: 4 });
        return (a * (CW - X)) / CW + (b * X) / CW;
      };
      const n = f(x, y);
      const fade = smooth(0, 16 * S, y) * (1 - smooth(60 * S, 80 * S, y));
      let a = smooth(0.5, 0.66, n) * 0.72 * fade;
      if (a <= 0.01) continue;
      const rim = f(x, Math.max(0, y - 5));
      const lit = Math.max(0, Math.min(1, 0.45 + (n - rim) * 7));
      const th = BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.47;
      a = Math.round((a + th * 0.09) * 10) / 10;
      if (a <= 0) continue;
      const q = rgb(mix(0x2a3852, 0x8ea0bc, lit));
      clouds.setRGBA(x, y, q[0], q[1], q[2], Math.round(a * 255));
    }
  return { sky, clouds, city, near, ...Object.fromEntries(lights.map((r, i) => [`lights${i}`, r])) };
}
