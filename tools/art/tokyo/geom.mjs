// Geometry for Tokyo's route (route.mjs): is a point in a shape, how far is it from a line. Pure functions, in
// the route's own coordinates (x across, u up), shared by the painter (mid.mjs) and the tests.

/** The nearest point of the polyline `pts` to (x, u): { d: distance, along: length up to it, side: signed distance }. */
export function near(pts, x, u) {
  let best = { d: Infinity, along: 0, side: 0 };
  let run = 0;
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, au] = pts[i];
    const [bx, bu] = pts[i + 1];
    const dx = bx - ax;
    const du = bu - au;
    const len = Math.hypot(dx, du) || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (u - au) * du) / (len * len)));
    const px = ax + dx * t;
    const pu = au + du * t;
    const d = Math.hypot(x - px, u - pu);
    if (d < best.d) best = { d, along: run + t * len, side: ((x - ax) * du - (u - au) * dx) / len, seg: i, t };
    run += len;
  }
  return best;
}

function inPoly(pts, x, u) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, ui] = pts[i];
    const [xj, uj] = pts[j];
    if (ui > u !== uj > u && x < ((xj - xi) * (u - ui)) / (uj - ui) + xi) inside = !inside;
  }
  return inside;
}

/** Is (x, u) in the shape? (rect, ell, poly, chain, ring: see route.mjs) */
export function inShape(s, x, u) {
  if (s.rect) {
    const [X, U, w, h] = s.rect;
    return x >= X && x < X + w && u >= U && u < U + h;
  }
  if (s.ell) {
    const [cx, cu, rx, ru] = s.ell;
    return ((x - cx) / rx) ** 2 + ((u - cu) / ru) ** 2 <= 1;
  }
  if (s.poly) return inPoly(s.poly, x, u);
  if (s.ring) {
    const [X, U, w, h, t] = s.ring;
    return x >= X && x < X + w && u >= U && u < U + h && !(x >= X + t && x < X + w - t && u >= U + t && u < U + h - t);
  }
  if (s.chain) {
    const n = near(s.chain, x, u);
    const a = s.chain[n.seg];
    const b = s.chain[n.seg + 1];
    return n.d <= a[2] + (b[2] - a[2]) * n.t;
  }
  return false;
}

/** The shape's bounding box: [x0, u0, x1, u1]. */
export function bbox(s) {
  if (s.rect) return [s.rect[0], s.rect[1], s.rect[0] + s.rect[2], s.rect[1] + s.rect[3]];
  if (s.ring) return [s.ring[0], s.ring[1], s.ring[0] + s.ring[2], s.ring[1] + s.ring[3]];
  if (s.ell) return [s.ell[0] - s.ell[2], s.ell[1] - s.ell[3], s.ell[0] + s.ell[2], s.ell[1] + s.ell[3]];
  const pts = s.poly ?? s.chain ?? s.pts;
  const pad = s.chain ? Math.max(...s.chain.map((p) => p[2])) : s.pad ?? 0;
  return [Math.min(...pts.map((p) => p[0])) - pad, Math.min(...pts.map((p) => p[1])) - pad, Math.max(...pts.map((p) => p[0])) + pad, Math.max(...pts.map((p) => p[1])) + pad];
}

/** Half the width of the ground a set of tracks takes (route.mjs: RAILS). */
export function railHalf(r) {
  if (r.style === 'guideway') return 4.7;
  if (r.style === 'crane') return 8;
  return r.tracks * 2.5 + 1.5;
}
