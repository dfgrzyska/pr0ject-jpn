// Far layer (Sapporo): the snowy fir-and-birch valley far below the ski jump, at dusk. Seamless vertical loop,
// drawn at 3x the game's resolution (540 x 1152): drifts with wind ripples, a frozen creek with dark open water
// and its snowy banks, a path along it, a farm or two buried to the eaves, Todo firs in tiers with snow on
// them, bare birches with fine twigs, their long shadows.
import { Raster, fbm, rng, scaleColor } from '../../lib/raster.mjs';
import { grade, rampColor } from '../nature.mjs';
import { hashPx } from '../hires.mjs';

const S = 3;
export const FAR_W = 180 * S;
export const FAR_H = 384 * S;

const SNOW = [0x8e98b4, 0xaab4cc, 0xc4cce0, 0xdce2ee];
const FIR = [0x0e201c, 0x16302a, 0x22463a, 0x345e4c, 0x4a7a62];

export function buildFar() {
  const W = FAR_W;
  const H = FAR_H;
  const img = new Raster(W, H);
  img.wrapY = true;
  const rand = rng(3301);
  const TAU = Math.PI * 2;
  const set = (x, y, c, a = 1) => img.set(((x % W) + W) % W, y, c, a);

  // snowfield with soft drifts and wind ripples
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const n = fbm(x / S, y / S, { seed: 61, scale: 40, octaves: 4, periodY: H / S });
      const rip = fbm(x * 0.17, y * 0.6, { seed: 62, scale: 6, octaves: 2, periodY: H * 0.6 });
      const g = hashPx(x, y, 60);
      img.set(x, y, g < 0.003 ? 0xffffff : rampColor(SNOW, 0.3 + n * 0.6 + (rip - 0.5) * 0.18 + (hashPx(x >> 1, y >> 1, 59) - 0.5) * 0.06, x, y));
    }

  // the frozen creek winding through the valley: snowy banks, the ice, dark water open in the middle
  const creekX = (y) => (60 + 30 * Math.sin((TAU * y) / H) + 10 * Math.sin((2 * TAU * y) / H + 0.7)) * S;
  for (let y = 0; y < H; y++) {
    const cx = creekX(y);
    for (let x = Math.floor(cx - 18); x <= cx + 18; x++) {
      const d = Math.abs(x + 0.5 - cx);
      if (d > 15) set(x, y, d > 17 ? 0xe4e8f2 : SNOW[1]);
      else if (d > 10) set(x, y, d > 13 ? 0x7c8cac : hashPx(x, y, 58) < 0.1 ? 0xb8c8dc : 0x9ab0cc);
      else if (d > 3.5 + Math.sin(y * 0.05) * 1.5) set(x, y, (x + y) % 9 === 0 ? 0xc8d8e8 : 0x8aa0c0);
      else set(x, y, fbm(x * 0.3, y, { seed: 57, scale: 3 }) > 0.62 ? 0x3a5068 : 0x223448);
    }
  }
  // a path trodden along the creek, footprints in it
  for (let y = 0; y < H; y++) {
    const px = creekX(y) + 34 + Math.sin(y * 0.02) * 6;
    for (let x = Math.floor(px - 3); x <= px + 3; x++) set(x, y, hashPx(x, y, 56) < 0.12 ? SNOW[0] : 0xb4bcd0);
  }

  // a farm or two, buried to the eaves: a steep tin roof with snow on it, the walls, a lit window, a shed
  const farms = [[124, 70], [30, 250], [150, 330]];
  const busy = [];
  for (const [fx, fy] of farms) {
    const X = fx * S;
    const Y0 = fy * S;
    const w = 42;
    const h = 30;
    busy.push([X - 10, Y0 - 10, w + 30, h + 30]);
    for (let j = 0; j < h + 12; j++) for (let i = 0; i < w; i++) img.set(X + i + 8, (Y0 + j + 8) % H, scaleColor(img.get(X + i + 8, (Y0 + j + 8) % H), 0.7));
    const roof = [0x8a3a2a, 0x2a4a7a, 0x3a5a3a][fx % 3];
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const north = j < h / 2;
        const tongue = fbm((X + i) * 0.5, (Y0 + j) * 0.16, { seed: fx, scale: 4 }) + (north ? 0.1 : -0.05);
        let c = tongue > 0.42 ? (north ? SNOW[3] : SNOW[2]) : i % 4 === 0 ? scaleColor(roof, 0.8) : roof;
        if (j === Math.floor(h / 2)) c = scaleColor(roof, 0.65);
        img.set(X + i, (Y0 + j) % H, c);
      }
    for (let j = h; j < h + 12; j++) for (let i = 2; i < w - 2; i++) img.set(X + i, (Y0 + j) % H, j < h + 2 ? 0x3a3238 : (j % 2 ? 0xb8b0a0 : 0xc8c0b0));
    for (const wx of [8, 22, 32]) for (let j = h + 4; j < h + 8; j++) for (let i = 0; i < 4; i++) img.set(X + wx + i, (Y0 + j) % H, 0xf0c070);
    for (let j = 0; j < 12; j++) for (let i = 0; i < 18; i++) img.set(X + w + 6 + i, (Y0 + 12 + j) % H, j < 5 ? SNOW[3] : j < 7 ? 0x3a3238 : 0x7a6a5a);
  }

  // forest: dense Todo firs in tiers with snow on their lit side, bare birches in the clearings
  const trees = [];
  for (let gy = 0; gy < H; gy += 15)
    for (let gx = 0; gx < W; gx += 15) {
      const x = gx + rand() * 15;
      const y = gy + rand() * 15;
      const dens = fbm(x / S, y / S, { seed: 63, scale: 48, octaves: 2, periodY: H / S });
      if (Math.abs(x - creekX(y)) < 21 || Math.abs(x - creekX(y) - 34) < 6) continue;
      if (busy.some(([bx, by, bw, bh]) => x > bx && x < bx + bw && ((y - by + H) % H) < bh)) continue;
      if (rand() > dens * 1.25 - 0.1) continue;
      trees.push({ x, y, r: (2 + rand() * 2.2) * S, fir: rand() < 0.78, seed: Math.floor(rand() * 1e6) });
    }
  const firPx = (cx, cy, R, seed) => {
    const fr = rng(seed);
    const out = [];
    for (let t = 0; t < 3; t++) {
      const rt = R * (1 - t * 0.28);
      const sprays = 9 + Math.floor(fr() * 4);
      const ph = fr() * TAU;
      for (let j = -Math.ceil(rt); j <= rt; j++)
        for (let i = -Math.ceil(rt); i <= rt; i++) {
          const a = Math.atan2(j, i);
          const d = Math.hypot(i, j) / (rt * (0.8 + 0.2 * Math.cos(sprays * a + ph)));
          if (d > 1) continue;
          const lit = (-i - j) / (rt * 1.6) + 0.5;
          const x = Math.round(cx + i);
          const y = Math.round(cy - t * R * 0.15 + j);
          let c = rampColor(FIR, Math.max(0, Math.min(1, lit * 0.8 + (1 - d) * 0.2 + t * 0.07 + (hashPx(x, y, 55) - 0.5) * 0.3)), x, y);
          if (d > 0.3 && d < 0.9 && lit > 0.45 && fbm(x * 0.5, y * 0.5, { seed: seed & 255, scale: 2 }) > 0.45) c = lit > 0.62 ? 0xdce4f0 : 0xb8c4d8;
          out.push([x, y, c]);
        }
    }
    return out;
  };
  for (const t of trees) {
    if (t.fir) for (const [x, y] of firPx(t.x, t.y, t.r, t.seed)) set(x + 6, (y + 8 + H) % H, scaleColor(img.get(((x + 6) % W + W) % W, (y + 8 + H) % H), 0.72));
    else
      for (let k = 0; k < 14; k++) set(Math.round(t.x) + 3 + k, (Math.round(t.y) + 4 + Math.round(k * 0.6) + H) % H, scaleColor(img.get(((Math.round(t.x) + 3 + k) % W + W) % W, (Math.round(t.y) + 4 + Math.round(k * 0.6) + H) % H), 0.8));
  }
  for (const t of trees) {
    const cx = Math.round(t.x);
    const cy = Math.round(t.y);
    if (!t.fir) {
      // a bare birch: the white trunk seen from above, its twigs forking out purple-grey
      const br = rng(t.seed);
      for (let k = 0; k < 5; k++) {
        const a = br() * TAU;
        const len = t.r * (0.7 + br() * 0.4);
        for (let j = 1; j <= len; j++) {
          const x = Math.round(cx + Math.cos(a) * j);
          const y = Math.round(cy + Math.sin(a) * j * 0.8);
          set(x, (y + H) % H, j > len - 3 ? 0x7a6e7e : 0x5a4e5e);
          if (j > len * 0.5 && j % 3 === 0) set(Math.round(x + Math.cos(a + 0.9) * 2), (Math.round(y + Math.sin(a + 0.9) * 2) + H) % H, 0x7a6e7e);
        }
      }
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) set(cx + i, (cy + j + H) % H, 0xe8e4e8);
      continue;
    }
    for (const [x, y, c] of firPx(t.x, t.y, t.r, t.seed)) set(x, (y + H) % H, c);
  }

  // a dusky blue valley, darker than the ridge above it
  grade(img, { sat: 0.8, bright: 0.66, tint: 0x2a2a60, tintAmt: 0.2 });
  return img;
}
