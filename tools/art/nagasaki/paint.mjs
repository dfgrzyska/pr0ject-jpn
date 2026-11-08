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

/**
 * A small sculpture renderer: capsules (limbs) and ellipsoids (torso, head) with a depth buffer, shaded by their
 * surface normals against a light from the upper left. prims: { cap: [ax, ay, bx, by], r, z } | { ell: [cx, cy],
 * rx, ry, z }, coordinates relative to (ox, oy). ramp: dark to light. Returns the covered pixels' mask (Set).
 */
export function sculpt(r, ox, oy, prims, ramp, { outline = true, light = [-0.55, -0.62, 0.56], smooth = 0 } = {}) {
  const ln = Math.hypot(...light);
  const L = light.map((v) => v / ln);
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const p of prims) {
    const pts = p.cap ? [[p.cap[0], p.cap[1]], [p.cap[2], p.cap[3]]] : [p.ell];
    const ext = p.cap ? p.r : Math.max(p.rx, p.ry);
    for (const [px, py] of pts) {
      x0 = Math.min(x0, px - ext);
      x1 = Math.max(x1, px + ext);
      y0 = Math.min(y0, py - ext);
      y1 = Math.max(y1, py + ext);
    }
  }
  const w = Math.ceil(x1 - x0) + 3;
  const h = Math.ceil(y1 - y0) + 3;
  const bx = Math.floor(x0) - 1;
  const by = Math.floor(y0) - 1;
  const depth = new Float32Array(w * h).fill(-Infinity);
  const shade = new Float32Array(w * h);
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const px = bx + i + 0.5;
      const py = by + j + 0.5;
      for (const p of prims) {
        let nx;
        let ny;
        let nz;
        let hgt;
        if (p.cap) {
          const [ax, ay, cx, cy] = p.cap;
          const dx = cx - ax;
          const dy = cy - ay;
          const len2 = dx * dx + dy * dy || 1;
          const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
          const qx = ax + dx * t;
          const qy = ay + dy * t;
          const d = Math.hypot(px - qx, py - qy);
          if (d > p.r) continue;
          nz = Math.sqrt(1 - (d / p.r) ** 2);
          nx = (px - qx) / p.r;
          ny = (py - qy) / p.r;
          hgt = p.z + nz * p.r;
        } else {
          const ex = (px - p.ell[0]) / p.rx;
          const ey = (py - p.ell[1]) / p.ry;
          const d2 = ex * ex + ey * ey;
          if (d2 > 1) continue;
          nz = Math.sqrt(1 - d2);
          nx = ex;
          ny = ey;
          hgt = p.z + nz * Math.min(p.rx, p.ry);
        }
        const k = j * w + i;
        if (hgt <= depth[k]) continue;
        depth[k] = hgt;
        shade[k] = (nx * L[0] + ny * L[1] + nz * L[2]) * 0.62 + 0.42 + (p.tone ?? 0);
      }
    }
  // smooth: the forms melt into one another (muscle, not balloons): shade from the slope of the blurred depth
  if (smooth > 0) {
    let depthB = depth.slice();
    for (let pass = 0; pass < 3; pass++) {
      const next = depthB.slice();
      for (let j = 0; j < h; j++)
        for (let i = 0; i < w; i++) {
          if (depth[j * w + i] === -Infinity) continue;
          let sum = 0;
          let n = 0;
          for (let dj = -smooth; dj <= smooth; dj++)
            for (let di = -smooth; di <= smooth; di++) {
              const q = (j + dj) * w + i + di;
              if (j + dj < 0 || j + dj >= h || i + di < 0 || i + di >= w || depthB[q] === -Infinity) continue;
              sum += depthB[q];
              n++;
            }
          next[j * w + i] = sum / n;
        }
      depthB = next;
    }
    const dz = (a, b) => (a === -Infinity || b === -Infinity ? 0 : a - b);
    const gain = 0.62;
    for (let j = 1; j < h - 1; j++)
      for (let i = 1; i < w - 1; i++) {
        const q = j * w + i;
        if (depth[q] === -Infinity) continue;
        const nx = -dz(depthB[q + 1], depthB[q - 1]) * gain;
        const ny = -dz(depthB[q + w], depthB[q - w]) * gain;
        const len = Math.hypot(nx, ny, 1);
        // keep the tone (rock, cloth) the primitives gave, add the new light
        const tone = shade[q] - Math.round(shade[q] * 4) / 4;
        shade[q] = ((nx * L[0] + ny * L[1] + L[2]) / len) * 0.72 + 0.34 + tone * 0.2;
      }
  }
  const mask = new Set();
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const k = j * w + i;
      if (depth[k] === -Infinity) continue;
      const x = ox + bx + i;
      const y = oy + by + j;
      const edge = outline && (i === 0 || j === 0 || i === w - 1 || j === h - 1 || depth[k - 1] === -Infinity || depth[k + 1] === -Infinity || depth[k - w] === -Infinity || depth[k + w] === -Infinity);
      // a crease where a nearer form overlaps a farther one
      const crease = !edge && !smooth && (depth[k] - depth[k - 1] > 2.2 || depth[k] - depth[k - w] > 2.2);
      let v = shade[k];
      if (crease) v -= 0.12;
      const s = Math.max(0, Math.min(ramp.length - 1.001, v * (ramp.length - 1)));
      const idx = Math.floor(s) + (s % 1 > (((x & 1) ^ (y & 1)) ? 0.62 : 0.38) ? 1 : 0);
      r.set(x, y, edge ? ramp[0] : ramp[Math.min(ramp.length - 1, idx)]);
      mask.add(`${x},${y}`);
    }
  return mask;
}
