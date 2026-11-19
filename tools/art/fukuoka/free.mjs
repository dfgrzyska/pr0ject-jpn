// Fukuoka: the ground the route leaves free between u0 and u1, for a stretch's painter to build on (houses, blocks,
// trees). Taken: the roads with their pavements, the tracks, the plots, the grounds of their own kind, the water open
// or painted. boxFree asks whether a box is all free; claim takes it.
import { near, inShape, railHalf } from '../tokyo/geom.mjs';
import { W, ROADS, RAILS, PLOTS, GROUNDS, WATER, isSea } from './route.mjs';

export function freeMap(U0, U1, { keep = [] } = {}) {
  const NU = U1 - U0;
  const busy = new Uint8Array(W * NU);
  const mark_ = (test, x0, u0, x1, u1) => {
    for (let u = Math.max(U0, Math.floor(u0)); u < Math.min(U1, Math.ceil(u1)); u++)
      for (let x = Math.max(0, Math.floor(x0)); x < Math.min(W, Math.ceil(x1)); x++) if (!busy[(u - U0) * W + x] && test(x + 0.5, u + 0.5)) busy[(u - U0) * W + x] = 1;
  };
  for (const r of ROADS) {
    const reach = r.w / 2 + (r.cls === 'street' ? 1.6 : r.cls === 'avenue' ? 2.4 : 0.6);
    const xs = r.pts.map((p) => p[0]);
    const us = r.pts.map((p) => p[1]);
    if (Math.max(...us) + reach < U0 || Math.min(...us) - reach > U1) continue;
    mark_((x, u) => near(r.pts, x, u).d <= reach, Math.min(...xs) - reach, Math.min(...us) - reach, Math.max(...xs) + reach, Math.max(...us) + reach);
  }
  for (const r of RAILS) {
    const reach = railHalf(r) + 0.8;
    mark_((x, u) => near(r.pts, x, u).d <= reach, 0, U0, W, U1);
  }
  for (const [, x, u, w, h] of PLOTS) mark_(() => true, x - 0.6, u - 0.6, x + w + 0.6, u + h + 0.6);
  for (const g of GROUNDS) if (!keep.includes(g.id)) mark_((x, u) => inShape(g, x, u), 0, U0, W, U1);
  for (const wt of WATER) mark_((x, u) => inShape(wt, x, u), 0, U0, W, U1);
  mark_((x, u) => isSea(x, u), 0, U0, W, U1);
  const taken = (x, u) => u < U0 || u >= U1 || x < 0 || x >= W || busy[(Math.floor(u) - U0) * W + Math.floor(x)] === 1;
  const boxFree = (x, u, w, h) => {
    for (let j = 0; j <= h; j += 1) for (let i = 0; i <= w; i += 1) if (taken(x + Math.min(i, w - 0.01), u + Math.min(j, h - 0.01))) return false;
    return true;
  };
  const claim = (x, u, w, h) => mark_(() => true, x, u, x + w, u + h);
  return { taken, boxFree, claim };
}
