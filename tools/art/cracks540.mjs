// Boss damage cracks at 540 px (3x): the fine-art counterpart of fx.mjs's crack_0..2, put into every city's
// enemy atlas under the same names so the wounds on a redrawn boss match its detail (see Enemies.newWound).
import { Raster } from '../lib/raster.mjs';

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** One jagged split: a wandering line with a few shards breaking off it. */
function crack(seed, W = 30, H = 30) {
  const r = rng(seed);
  const segs = []; // [x0, y0, x1, y1, width]
  const walk = (x, y, ang, len, w0, depth) => {
    let px = x;
    let py = y;
    let zig = r() < 0.5 ? 1 : -1;
    for (let i = 0; i < len; i++) {
      zig = -zig; // a split zigzags along the grain, it doesn't meander
      const a = ang + zig * (0.35 + r() * 0.5);
      const step = 2.6 + r() * 1.8;
      const nx = px + Math.cos(a) * step;
      const ny = py + Math.sin(a) * step;
      const w = w0 * (1 - (i / len) * 0.8);
      segs.push([px, py, nx, ny, w]);
      if (depth < 2 && i < len - 1 && r() < (depth ? 0.25 : 0.7))
        walk(nx, ny, ang + (r() < 0.5 ? -1 : 1) * (0.8 + r() * 0.5), Math.max(2, Math.round((len - i) * 0.7)), w * 0.55, depth + 1);
      px = nx;
      py = ny;
    }
  };
  // from near the middle outwards both ways, so the widest part sits in the centre
  const a = r() * Math.PI * 2;
  walk(W / 2, H / 2, a, 4, 2.4, 0);
  walk(W / 2, H / 2, a + Math.PI + (r() - 0.5) * 0.5, 3, 2.1, 0);
  // distance field to the split, and the width there
  const field = (x, y) => {
    let best = 1e9;
    let bw = 0;
    for (const [x0, y0, x1, y1, w] of segs) {
      const dx = x1 - x0;
      const dy = y1 - y0;
      const t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy || 1)));
      const d = Math.hypot(x - x0 - dx * t, y - y0 - dy * t) - w / 2;
      if (d < best) { best = d; bw = w; }
    }
    return [best, bw];
  };
  const out = new Raster(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const [d, w] = field(x + 0.5, y + 0.5);
      if (d > 2.6) continue;
      const [dl] = field(x + 0.5 + 1.2, y + 0.5 + 1.2); // toward the light (upper left) the lip is raised
      if (d <= 0) {
        // the split itself: near-black, a dull ember deep in its widest part
        out.set(x, y, w > 2.1 && d < -0.8 ? 0x4a1410 : 0x120a10);
      } else if (d <= 1.1) {
        if (dl < d) out.set(x, y, 0x2a1a1c, 0.75); // the shadowed wall
        else out.set(x, y, 0xfff4e0, 0.42); // the chipped, lit lip
      } else {
        out.set(x, y, 0x1a0e14, 0.22 * (1 - (d - 1.1) / 1.5)); // bruising round it
      }
    }
  return out;
}

/** Adds crack_0..2 to a city's enemy list. */
export function addCracks(add) {
  [11, 4, 38].forEach((seed, i) => add(`crack_${i}`, crack(seed)));
}
