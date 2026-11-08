import { Raster, rng, mix, fbm, rgb } from '../../lib/raster.mjs';
import { hashPx } from '../hires.mjs';
import { farShore, nearShore, hillRoad } from '../../../src/data/nagasakiView.js';

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
  const treeLine = (X) => (372 - (X / S) * 0.14 + Math.sin((X / S) * 0.046) * 11 + Math.sin((X / S) * 0.19) * 3) * S;
  const woodedHill = (X, Y) => {
    const x = X / S;
    const y = Y / S;
    return y < 176 - 0.035 * (x - 162) ** 2 || (x > 186 && y < 151 - 0.02 * (x - 216) ** 2);
  };
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
      if (cloud > 0.56) {
        const md = Math.hypot(x - MOON[0], y - MOON[1]) / (70 * S);
        const moonlit = mix(0x9ab0c8, 0x2a3a58, Math.min(1, md));
        const cityLit = mix(moonlit, 0x7a5a58, smooth(70 * S, 108 * S, y) * (1 - x / W));
        c = mix(c, cityLit, Math.min(0.7, (cloud - 0.56) * 2.2));
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
  const PARKS = [[62, 152, 9, 6], [108, 168, 10, 7], [34, 176, 7, 5], [88, 132, 12, 5], [150, 142, 10, 7]];
  const inPark = (X, Y) => PARKS.some(([x, y, rx, ry]) => ((X / S - x) / rx) ** 2 + ((Y / S - y) / ry) ** 2 < 1);
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
  // the terraces of houses climbing the hills in their thousands, thick by the water, thinning to scattered lights
  for (let Y = 106 * S; Y < 250 * S; ) {
    const t0 = smooth(100 * S, 200 * S, Y);
    const p = 0.42 + t0 * 0.85;
    const stepY = Math.round(2 + p * 3);
    for (let X = -12 + random.int(0, 5); X < W; X += Math.round(3 + p * 6 + random() * 3)) {
      const yy = Math.round(Y + (random() - 0.5) * stepY * 1.5);
      const ry = ridge(X);
      const sh = fS(X);
      if (yy < ry + 5 || yy > sh - 6 || woodedHill(X, yy) || inPark(X, yy)) continue;
      const t = (yy - ry) / (sh - ry);
      const ravine = Math.abs(X / S - (74 + Math.sin((yy / S) * 0.044) * 16)) < 4 || Math.abs(X / S - (152 + Math.sin((yy / S) * 0.057) * 12)) < 3.5;
      const cluster = fbm(X / S, yy / S, { seed: 735, scale: 13, octaves: 3 });
      const d = (0.3 + smooth(0, 0.6, t) * 0.7) * (0.25 + cluster * 1.4) * (ravine ? 0.2 : 1);
      if (random() > d) continue;
      house(X, yy, 0.38 + t * 0.95);
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
  for (let n = 0; n < 12; n++) {
    let run = [];
    const flush = () => {
      if (run.length > 8) street(run, 4 + (n > 6 ? 1 : 2), n % 3 === 2 ? 0xd8e4f0 : 0xffb868, 0.62 + n * 0.03, { ribbon: 0.05 });
      run = [];
    };
    for (let X = 0; X < W; X += 3) {
      const Y = (116 + n * 10 - (X / S) * 0.065 + Math.sin((X / S) * 0.035 + n) * (6 + n) + Math.sin((X / S) * 0.19 + n * 2) * 1.6) * S;
      if (Y < ridge(X) + 8 || Y > fS(X) - 12 || woodedHill(X, Y)) flush();
      else run.push([X, Y]);
    }
    flush();
  }
  // the arteries: bright, straight down the valleys to the waterfront, full of cars
  for (const [x0, x1, top] of [[30, 26, 150], [52, 62, 118], [74, 92, 124], [98, 110, 140], [126, 142, 150]]) {
    const X0 = x0 * S;
    const X1 = x1 * S;
    const pts = [];
    for (let k = 0; k <= 14; k++) {
      const t = k / 14;
      const X = X0 + (X1 - X0) * t + Math.sin(t * 5 + x0) * 6;
      pts.push([X, fS(X0) - 3 + (top * S - fS(X0) + 3) * t]);
    }
    street(pts, 2, 0xffc070, 1.05, { ribbon: 0.16, cars: 0.16 });
  }
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
  // Oura Cathedral on its hill, white and floodlit, its spire and cross, a soft glow round it
  items.push({
    y: 1e6 + 2,
    draw: () => {
      const cx = 128 * S;
      const cy = Math.round(fS(cx)) - 26;
      clearLights(cx - 14, cy - 34, 28, 40);
      E.add(cx, cy - 10, 0xd8e8ff, 3);
      const cw = 0xc8d8e4;
      for (let j = 0; j < 12; j++) for (let i = -10; i <= 10; i++) setB(cx + i, cy - 10 + j, i > 7 ? 0x7a8a98 : cw);
      polyB([[cx - 10, cy - 10], [cx - 5, cy - 15], [cx, cy - 10]], 0xe0ecf4);
      polyB([[cx, cy - 10], [cx + 5, cy - 15], [cx + 10, cy - 10]], 0xb0c0cc);
      for (let j = 0; j < 20; j++) for (let i = -2; i <= 2; i++) setB(cx + i, cy - 18 + j, i > 0 ? 0xc0ccd8 : 0xf0f8fc);
      polyB([[cx - 2, cy - 18], [cx, cy - 28], [cx + 2, cy - 18]], 0x6aa8a0);
      for (let j = 0; j < 6; j++) lamp(cx, cy - 28 - j, 0xfff4c8, 1.3, 0);
      for (const i of [-1, 1]) lamp(cx + i, cy - 32, 0xfff4c8, 1.3, 0);
      for (const i of [-8, -5, 5, 8]) for (let j = 0; j < 5; j++) lamp(cx + i, cy - 7 + j, j % 2 ? 0xffa070 : 0x8ab8e8, 1, 1);
      lamp(cx, cy - 8, 0xffd890, 1.2, 1);
      for (let j = 0; j < 3; j++) lamp(cx, cy - 1 + j, 0xffc880, 1.2, 2);
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
          else if (j < 5) c = 0x8a98a8; // its white line
          else c = j % 3 === 2 ? 0x2a3444 : 0x4a5868;
          setB(X0 + i, yy, c);
          if (j >= 6 && j % 3 !== 2 && hashPx(i >> 1, j, 76) < 0.8) lamp(X0 + i, yy, hashPx(i, j, 77) < 0.86 ? 0xffdca0 : 0xc8e8ff, 0.72, (i >> 3) & 3);
        }
      }
      // the upper decks stepping back, the funnel under a floodlight, the mast's light
      const CI = 40;
      for (let i = 14; i < 66; i++) for (let j = 20; j < 25; j++) setB(X0 + i, Y0 + dy(i) - j, j > 23 ? 0x8a98a8 : 0x3a4656);
      for (let i = 14; i < 66; i += 2) lamp(X0 + i, Y0 + dy(i) - 22, 0xffe4b0, 0.8, 1);
      for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) setB(X0 + CI + i, Y0 + dy(CI + i) - 25 - j, j > 5 ? 0x141418 : i > 6 ? 0x8a2018 : 0xd83828);
      E.add(X0 + CI + 4, Y0 + dy(CI) - 28, 0xff6a50, 2.4);
      lamp(X0 + 64, Y0 + dy(64) - 30, 0xffffff, 1.4, 3);
      lamp(X0 + 8, Y0 + dy(8) - 26, 0xffffff, 1.4, 1);
      E.add(X0 + 40, Y0 + dy(40) - 12, 0xffd8a0, 3);
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
  for (let Y = 262 * S; Y < 392 * S; Y += 7) {
    for (let X = 4 + random.int(0, 8); X < W; X += random.int(11, 22)) {
      const yy = Y + random.int(-3, 3);
      if (yy < nS(X) + 44 || yy > treeLine(X) + 8) continue;
      const cluster = fbm(X / S, yy / S, { seed: 736, scale: 11, octaves: 2 });
      const road = Math.abs(yy - hR(X)) < 26 ? 0.3 : 0;
      if (cluster + road > 0.5) house(X, yy, 1.25 + ((yy - 262 * S) / (130 * S)) * 0.9, { w: 6 + random() * 6, h: 4 + random() * 4, lit: 0.34 + random() * 0.28, z: 2e6 + yy });
    }
  }
  // the near streets: the lower road with its white lamps, the hill road in warm sodium, each lamp with its pool of light
  {
    const low = [];
    for (let X = 0; X < W; X += 3) low.push([X, (338 - (X / S) * 0.23 + Math.sin((X / S) * 0.065) * 6) * S]);
    const hill = [];
    for (let X = 0; X < W; X += 3) hill.push([X, hR(X)]);
    for (const [pts, c, gap, zz] of [[low, 0xd8e8f0, 16, 2e6 + 1014], [hill, 0xffb060, 13, 2e6 + 1100]])
      items.push({
        y: zz,
        draw: () => {
          for (let k = 0; k + 1 < pts.length; k++) {
            const [x0, y0] = pts[k];
            const [x1, y1] = pts[k + 1];
            for (let q = 0; q <= 3; q++) {
              const x = x0 + ((x1 - x0) * q) / 3;
              const y = y0 + ((y1 - y0) * q) / 3;
              setB(x, y, 0x2a2c34);
              setB(x, y + 1, 0x1a1c24);
              setB(x, y + 2, 0x2a2c34);
              E.add(x, y + 1, c, 0.1);
            }
            if ((k * 3) % gap < 3) {
              lineB(x0, y0, x0, y0 - 6, 0x20242c);
              lamp(x0, y0 - 7, c, 1.5);
              lamp(x0 + 1, y0 - 7, c, 1.2);
              for (let q = 0; q < 20; q++) E.add(x0 + (random() - 0.5) * 16, y0 + (random() - 0.5) * 7, c, 0.05);
            }
            if (hashPx(k, 9, 78) < 0.05) {
              lamp(x0, y0 + 1, 0xff3828, 1);
              lamp(x0 + 2, y0 + 1, 0xff3828, 1);
            }
          }
        },
      });
  }
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
  // the moon's path on the water: pale dashes under it, widening towards us
  for (let i = 0; i < 420; i++) {
    const y0 = fS(MOON[0]);
    const y = y0 + 16 + random() * 130;
    const spread = 14 + (y - y0) * 0.3;
    const x = Math.round(MOON[0] + (random() - 0.5) * spread * 2);
    if (y > fS(x) + 5 && y < nS(x) - 5) city.rect(x, Math.round(y), random.int(1, 5), 1, 0xb8c8d8, random.range(0.05, 0.22));
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
    // the terrace at our feet: its flags in the dark, the rail right across the view, lamps low along it, people looking
    const RY = (x) => 391 * S - (x - W / 2) * 0.012;
    for (let x = 0; x < W; x++)
      for (let y = Math.floor(RY(x)) + 4; y < H; y++) {
        const fl = (y >> 3) % 2 ? (x + 8) % 32 === 0 : x % 32 === 0;
        const c = y % 8 === 0 || fl ? 0x05090e : mix(0x0c141c, 0x161c26, hashPx(x >> 5, y >> 3, 79));
        near.set(x, y, c);
      }
    const lampAt = [];
    for (let x = 30; x < W; x += 132) lampAt.push(x);
    for (const lx of lampAt)
      for (let j = 0; j < 40; j++)
        for (let i = -60; i <= 60; i++) {
          const d = Math.hypot(i / 60, j / 40);
          if (d < 1) near.set(lx + i, RY(lx) + 6 + j, 0xffc888, (1 - d) ** 2 * 0.22);
        }
    for (let x = 0; x < W; x++) {
      const y = RY(x);
      near.set(x, y - 13, 0x4a5a64);
      near.set(x, y - 12, 0x101a22);
      near.set(x, y - 7, 0x1c262e);
      near.set(x, y - 2, 0x1c262e);
      if (x % 27 < 2) for (let j = -13; j < 4; j++) near.set(x, y + j, x % 27 === 0 ? 0x2a3640 : 0x0a1218);
    }
    for (const lx of lampAt) for (let i = -2; i <= 2; i++) for (let j = 0; j < 3; j++) near.set(lx + i, RY(lx) + 1 + j, 0xffd898, 1);
    // love locks on the rail
    for (let x = 180; x < 300; x += 2) if (hashPx(x, 2, 80) < 0.4) near.set(x, RY(x) - 10, [0xff6a8a, 0xffd868, 0xc8ccd0, 0x6ac0ff][(x >> 1) % 4], 0.85);
    /** Somebody at the rail with their back to us, rimmed by the city's light. */
    const person = (X, h, c, o = {}) => {
      const Y = RY(X) + 18;
      const top = Y - h;
      for (let j = 0; j < h; j++) {
        const q = j / h;
        const hw = q < 0.13 ? 0 : q < 0.2 ? 2.2 : q < 0.32 ? 6.5 : q < 0.6 ? 5.6 : q < 0.64 ? 5 : 4.2;
        if (hw === 0) continue;
        for (let i = -hw; i <= hw; i++) {
          if (q > 0.66 && Math.abs(i) < 0.8) continue; // between the legs
          near.set(X + i, top + j, q < 0.62 ? c : 0x0a1016);
        }
        near.set(X - hw, top + j, mix(c, 0xffc888, 0.5));
        near.set(X + hw, top + j, mix(c, 0xa8d0f0, 0.45));
      }
      for (let j = -5; j <= 5; j++)
        for (let i = -4; i <= 4; i++) {
          if (i * i + j * j > 19) continue;
          near.set(X + i, top + 3 + j, j < 0 ? (o.hair ?? 0x0c0a0c) : 0x161014);
        }
      for (let i = -3; i <= 3; i++) near.set(X + i, top - 2, mix(o.hair ?? 0x0c0a0c, 0xffc888, 0.35));
      if (o.phone) {
        // an arm raised, a phone held up to the view, its little screen lit
        for (let q = 0; q < 16; q++) near.set(X + 5 + q * 0.3, top + 14 - q, c);
        near.rect(X + 7, top - 8, 5, 8, 0x10141a);
        near.rect(X + 8, top - 7, 3, 6, 0xc8e8ff);
      }
    };
    person(36 * S, 54, 0x18222c);
    person(42 * S, 48, 0x2a1e2a, { hair: 0x2a1a14 });
    person(162 * S, 56, 0x141e2c, { phone: true });
    person(176 * S, 50, 0x28303a);
    person(186 * S, 42, 0x3a2028, { hair: 0x241814 });
    // a coin telescope on its post
    {
      const X = 112 * S;
      const Y = RY(X);
      near.rect(X - 2, Y - 24, 5, 40, 0x10181e);
      near.rect(X - 2, Y - 24, 1, 40, 0x3a4c58);
      near.rect(X - 12, Y - 34, 21, 10, 0x18242c);
      near.rect(X - 12, Y - 34, 21, 1, 0x5a7482);
      near.rect(X - 13, Y - 31, 2, 4, 0xa8d0e0);
    }
  }
  return { sky, city, near, ...Object.fromEntries(lights.map((r, i) => [`lights${i}`, r])) };
}
