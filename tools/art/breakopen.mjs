// Step 2a helpers shared by the cities: a shell breaking open over what is under it (Voronoi chunks falling
// away one by one, the seams lit first), and lightning crackling over a sprite's body.
import { Raster } from '../lib/raster.mjs';

const INK = 0x14101c;

function lcg(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/**
 * `from` breaking into chunks over `to`, k from 0 (only seams showing) to 1 (all gone). Chunks near
 * `centre` (fractions of the frame) go first. `seam` is the colour of the split before it opens (lava light,
 * ice blue), `lip` the lit edge along it.
 */
export function breakOpen(from, to, k, { seed = 4242, cells = 60, centre = [0.5, 0.5], seam = 0x3a5a8a, lip = 0xffffff, edge = INK } = {}) {
  const w = from.w;
  const h = from.h;
  const out = new Raster(w, h);
  const rnd = lcg(seed);
  const pts = [];
  for (let i = 0; i < cells; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const d = Math.min(1, Math.hypot(x / w - centre[0], y / h - centre[1]) / 0.6);
    pts.push([x, y, rnd() * 0.55 + d * 0.45]);
  }
  const owner = new Int16Array(w * h);
  const border = new Uint8Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let b1 = 1e9;
      let b2 = 1e9;
      let bi = 0;
      for (let i = 0; i < pts.length; i++) {
        const d = (x - pts[i][0]) ** 2 + (y - pts[i][1]) ** 2;
        if (d < b1) { b2 = b1; b1 = d; bi = i; } else if (d < b2) b2 = d;
      }
      owner[y * w + x] = bi;
      border[y * w + x] = Math.sqrt(b2) - Math.sqrt(b1) < 1.2 ? 1 : 0;
    }
  const gone = (x, y) => x >= 0 && y >= 0 && x < w && y < h && pts[owner[y * w + x]][2] < k;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const af = from.alpha(x, y);
      const at = to.alpha(x, y);
      if (gone(x, y)) {
        if (at) out.set(x, y, to.get(x, y), at / 255);
        continue;
      }
      if (!af) continue;
      const i = y * w + x;
      const near = gone(x + 1, y) || gone(x - 1, y) || gone(x, y + 1) || gone(x, y - 1);
      const open = pts[owner[i]][2] < k + 0.35; // the cracks run ahead of the chunks that drop
      if (near) out.set(x, y, edge);
      else if (border[i] && open) out.set(x, y, seam);
      else if (y > 0 && border[i - w] && open) out.set(x, y, lip, af / 255);
      else out.set(x, y, from.get(x, y), af / 255);
    }
  return out;
}

/** Lightning crackling over a body (frame `f` of 4): jagged arcs from one point of its edge to another. */
export function lightning(body, f, { arcs = 4, seed = 99, core = 0xffffff, glow = 0x6ad8ff } = {}) {
  const w = body.w;
  const h = body.h;
  const out = new Raster(w, h);
  const rnd = lcg(seed + f * 7919);
  // points on the body's rim (solid, with an open pixel within 3)
  const rim = [];
  for (let y = 3; y < h - 3; y += 2)
    for (let x = 3; x < w - 3; x += 2)
      if (body.alpha(x, y) && (!body.alpha(x - 3, y) || !body.alpha(x + 3, y) || !body.alpha(x, y - 3) || !body.alpha(x, y + 3))) rim.push([x, y]);
  if (!rim.length) return out;
  const plot = (x, y, c, a) => out.set(Math.round(x), Math.round(y), c, a);
  for (let n = 0; n < arcs; n++) {
    const [ax, ay] = rim[Math.floor(rnd() * rim.length)];
    const ang = rnd() * Math.PI * 2;
    const len = 14 + rnd() * 22;
    let x = ax;
    let y = ay;
    const steps = Math.round(len / 3);
    for (let i = 0; i < steps; i++) {
      const nx = x + Math.cos(ang + (rnd() - 0.5) * 1.8) * 3;
      const ny = y + Math.sin(ang + (rnd() - 0.5) * 1.8) * 3;
      for (let t = 0; t <= 1; t += 0.2) {
        const px = x + (nx - x) * t;
        const py = y + (ny - y) * t;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) plot(px + dx, py + dy, glow, 0.55);
        plot(px, py, core, 1);
      }
      if (rnd() < 0.25) {
        // a short fork
        const fa = ang + (rnd() < 0.5 ? 1 : -1) * (0.6 + rnd() * 0.6);
        let fx = nx;
        let fy = ny;
        for (let j = 0; j < 3; j++) {
          const gx = fx + Math.cos(fa + (rnd() - 0.5)) * 2.5;
          const gy = fy + Math.sin(fa + (rnd() - 0.5)) * 2.5;
          for (let t = 0; t <= 1; t += 0.25) plot(fx + (gx - fx) * t, fy + (gy - fy) * t, glow, 0.8);
          fx = gx;
          fy = gy;
        }
      }
      x = nx;
      y = ny;
    }
  }
  return out;
}
