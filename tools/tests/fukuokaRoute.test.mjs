// Fukuoka's route (tools/art/fukuoka/route.mjs) keeps its promises: the stretches cover the strip, the plots stay
// clear of each other, of the roads, the tracks, the water and the arenas, every road, path and track leads
// somewhere, Nakasu is an island between its two rivers, the bridges span water, and the boss has the open field
// of the ruins under the earthwork.
import test from 'node:test';
import assert from 'node:assert/strict';
import { W, L, SECTIONS, ARENAS, ROADS, RAILS, FERRIES, PLOTS, GROUNDS, WATER, isSea } from '../art/fukuoka/route.mjs';
import { near, inShape, railHalf } from '../art/tokyo/geom.mjs';
import { LANDMARKS } from '../../src/data/landmarks.js';

const onEdge = ([x, u]) => x <= 0 || x >= W || u <= 0 || u >= L;
const inPlot = ([x, u], pad = 0) => PLOTS.some(([, px, pu, w, h]) => x >= px - pad && x <= px + w + pad && u >= pu - pad && u <= pu + h + pad);
const CARS = new Set(['avenue', 'street', 'lane', 'bridge', 'express', 'arcade', 'taxi']);
const cells = (x, u, w, h, fn) => {
  for (let pu = u + 0.5; pu < u + h; pu += 1) for (let px = x + 0.5; px < x + w; px += 1) fn(px, pu);
};
const onLand = (x, u) => !isSea(x, u) || GROUNDS.some((g) => g.over && inShape(g, x, u));
const along = (pts, fn) => {
  for (let i = 0; i + 1 < pts.length; i++) {
    const [[ax, au], [bx, bu]] = [pts[i], pts[i + 1]];
    const n = Math.ceil(Math.hypot(bx - ax, bu - au));
    for (let k = 0; k <= n; k++) fn(ax + ((bx - ax) * k) / n, au + ((bu - au) * k) / n);
  }
};

test('the stretches cover the strip end to end', () => {
  let at = 0;
  for (const [from, to] of SECTIONS) {
    assert.equal(from, at);
    assert.ok(to > from);
    at = to;
  }
  assert.equal(at, L);
});

test('the places named on the way are in order and inside the strip', () => {
  let at = 0;
  for (const [from, to, name] of LANDMARKS.stage12) {
    assert.ok(from >= at && to > from && to <= L, `${name}: ${from}-${to} after ${at}`);
    assert.ok(name.length <= 26, name);
    at = to;
  }
});

test('the plots are inside the strip and clear of each other', () => {
  PLOTS.forEach(([id, x, u, w, h], i) => {
    assert.ok(x >= 0 && u >= 0 && x + w <= W && u + h <= L, id);
    for (const [other, ox, ou, ow, oh] of PLOTS.slice(i + 1)) assert.ok(x + w <= ox || ox + ow <= x || u + h <= ou || ou + oh <= u, `${id} over ${other}`);
  });
});

test('no plot stands on a road or in the water', () => {
  for (const [id, x, u, w, h] of PLOTS) {
    for (const r of ROADS) {
      if (!CARS.has(r.cls)) continue;
      cells(x, u, w, h, (px, pu) => assert.ok(near(r.pts, px, pu).d > r.w / 2, `${id} on ${r.id} at (${px}, ${pu})`));
    }
    cells(x, u, w, h, (px, pu) => assert.ok(onLand(px, pu), `${id} in the water at (${px}, ${pu})`));
    for (const wt of WATER) if (!/^teien_/.test(wt.id)) cells(x, u, w, h, (px, pu) => assert.ok(!inShape(wt, px, pu), `${id} in ${wt.id} at (${px}, ${pu})`));
  }
});

test('only a station stands on the tracks', () => {
  for (const [id, x, u, w, h] of PLOTS) {
    if (/_eki$/.test(id)) continue;
    for (const r of RAILS) cells(x, u, w, h, (px, pu) => assert.ok(near(r.pts, px, pu).d > railHalf(r), `${id} on ${r.id} at (${px}, ${pu})`));
  }
});

test('the roads and the tracks keep to the land, but the bridges and the piers', () => {
  for (const r of ROADS) {
    if (r.cls === 'bridge' || r.cls === 'deck' || r.cls === 'express') continue;
    along(r.pts, (x, u) => assert.ok(onLand(x, u), `${r.id} in the water at (${x | 0}, ${u | 0})`));
  }
  for (const r of RAILS) along(r.pts, (x, u) => {
    for (const dx of [-railHalf(r), 0, railHalf(r)]) assert.ok(!isSea(x + dx, u), `${r.id} in the water at (${(x + dx) | 0}, ${u | 0})`);
  });
});

test('the bridges span their water: each starts and ends on land, a river under its middle', () => {
  for (const r of ROADS.filter((q) => q.cls === 'bridge')) {
    const [a, b] = [r.pts[0], r.pts.at(-1)];
    assert.ok(!isSea(...a) && !isSea(...b), `${r.id} ends in the water`);
    assert.ok(isSea((a[0] + b[0]) / 2, (a[1] + b[1]) / 2), `${r.id} is over no water`);
  }
});

test('Nakasu is an island: water all round it, between the Naka and the Hakata rivers', () => {
  // walking out of the middle of Nakasu in any direction, one meets water before leaving the strip
  for (const [cx, cu] of [[80, 2200], [80, 2500], [80, 2800]])
    for (let a = 0; a < 32; a++) {
      const [dx, du] = [Math.cos((a / 32) * Math.PI * 2), Math.sin((a / 32) * Math.PI * 2)];
      let wet = false;
      for (let t = 0; t < 1200 && !wet; t += 0.5) {
        const [x, u] = [cx + dx * t, cu + du * t];
        if (x < 0 || x > W) break;
        wet = isSea(x, u);
      }
      assert.ok(wet, `out of Nakasu dry from (${cx}, ${cu}) heading ${a}`);
    }
});

test('nothing tall stands in an arena; the boss has the ruins\' field and the earthwork, no water but the moat', () => {
  for (const [ax, au, name, r] of ARENAS)
    for (const [id, x, u, w, h, , low] of PLOTS) {
      if (low) continue;
      const dx = Math.max(x - ax, 0, ax - (x + w));
      const du = Math.max(u - au, 0, au - (u + h));
      assert.ok(Math.hypot(dx, du) >= r, `${id} in the arena of ${name}`);
    }
  const [ax, au, , r] = ARENAS[1];
  for (let a = 0; a < 64; a++) {
    const x = ax + Math.cos((a / 64) * Math.PI * 2) * r * 0.9;
    const u = au + Math.sin((a / 64) * Math.PI * 2) * r * 0.9;
    if (u >= L || x < 0 || x > W) continue;
    assert.ok(!isSea(x, u), `the boss's arena is in the water at (${x | 0}, ${u | 0})`);
    assert.ok(GROUNDS.some((g) => (g.kind === 'ruins' || g.kind === 'dorui') && inShape(g, x, u)) || WATER.some((wt) => wt.id === 'mizuki_hori' && inShape(wt, x, u)) || u >= 7126, `the boss's arena off the field at (${x | 0}, ${u | 0})`);
  }
});

test('every road and path leads somewhere: its ends are on the edge, on another road, at a plot or on a ground', () => {
  for (const r of ROADS)
    for (const end of [r.pts[0], r.pts.at(-1)]) {
      const joined = ROADS.some((o) => o !== r && near(o.pts, ...end).d <= o.w / 2 + 2);
      const grounded = GROUNDS.some((g) => inShape(g, ...end));
      assert.ok(onEdge(end) || joined || inPlot(end, 2) || grounded, `${r.id} ends nowhere at (${end})`);
    }
});

test('every track leads somewhere: its ends are on the edge or at a station', () => {
  for (const r of RAILS) for (const end of [r.pts[0], r.pts.at(-1)]) assert.ok(onEdge(end) || inPlot(end, 2), `${r.id} ends nowhere at (${end})`);
});

test('the fishing boats put out from the pier over open water', () => {
  const piers = ROADS.filter((r) => r.cls === 'deck');
  for (const f of FERRIES) {
    assert.ok(piers.some((p) => [p.pts[0], p.pts.at(-1)].some(([x, u]) => Math.hypot(x - f.pts[0][0], u - f.pts[0][1]) <= 3)), `${f.id} has no pier`);
    along(f.pts.slice(1).map(([x, u]) => [Math.max(0, Math.min(W, x)), Math.max(0, u)]), (x, u) => assert.ok(isSea(x, u), `${f.id} runs aground at (${x | 0}, ${u | 0})`));
  }
});
