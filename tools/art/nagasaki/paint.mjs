import { mix, rng } from '../../lib/raster.mjs';
export function polygon(r, pts, color, alpha = 1) {
  const lo = Math.max(0, Math.floor(Math.min(...pts.map(p => p[1]))));
  const hi = Math.min(r.h - 1, Math.ceil(Math.max(...pts.map(p => p[1]))));
  for (let y = lo; y <= hi; y++) {
    const hits = [];
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[j];
      if ((y0 > y) !== (y1 > y)) hits.push(x0 + (y - y0) * (x1 - x0) / (y1 - y0));
    }
    hits.sort((a, b) => a - b);
    for (let k = 0; k < hits.length; k += 2) for (let x = Math.ceil(hits[k]); x <= hits[k + 1]; x++) r.set(x, y, color, alpha);
  }
}
export function glow(r, x, y, radius, color, power = .25) {
  for (let j = -radius; j <= radius; j++) for (let i = -radius; i <= radius; i++) {
    const d = Math.hypot(i, j) / radius;
    if (d < 1) r.set(x + i, y + j, color, (1 - d) ** 2 * power);
  }
}
export function masonry(r, x, y, w, h, base, seed = 2, size = 5) {
  const random = rng(seed);
  r.rect(x, y, w, h, mix(base, 0x071624, .35));
  for (let yy = 0, row = 0; yy < h; yy += size - 1, row++) for (let xx = -size; xx < w; xx += size + 2) {
    const start = Math.max(0, xx + (row % 2) * 3), end = Math.min(w, xx + (row % 2) * 3 + size + 1);
    if (end <= start) continue;
    const c = mix(base, random() < .5 ? 0x171f2b : 0xc2bbaa, random() * .25);
    r.rect(x + start, y + yy, end - start, Math.min(size - 2, h - yy), c);
    r.line(x + start, y + yy, x + end - 1, y + yy, mix(c, 0xd6c9ae, .18));
  }
}
