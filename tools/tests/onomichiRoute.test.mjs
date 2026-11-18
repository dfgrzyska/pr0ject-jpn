// Onomichi's route (tools/art/onomichi/route.mjs) keeps its promises: the stretches cover the strip, the plots stay
// clear of each other, of the roads, the tracks, the sea and the arenas, every road, step, track and ferry leads
// somewhere, and the boss has open water before the station.
import test from 'node:test';
import assert from 'node:assert/strict';
import { W, L, SECTIONS, ARENAS, ROADS, RAILS, FERRIES, PLOTS, GROUNDS, isSea } from '../art/onomichi/route.mjs';
import { near, inShape, railHalf } from '../art/tokyo/geom.mjs';
import { LANDMARKS } from '../../src/data/landmarks.js';

const onEdge = ([x, u]) => x <= 0 || x >= W || u <= 0 || u >= L;
const inPlot = ([x, u], pad = 0) => PLOTS.some(([, px, pu, w, h]) => x >= px - pad && x <= px + w + pad && u >= pu - pad && u <= pu + h + pad);
const CARS = new Set(['avenue', 'street', 'lane', 'bridge', 'express', 'cycle', 'arcade']);
const cells = (x, u, w, h, fn) => {
  for (let pu = u + 0.5; pu < u + h; pu += 1) for (let px = x + 0.5; px < x + w; px += 1) fn(px, pu);
};
const onLand = (x, u) => !isSea(x, u) || GROUNDS.some((g) => g.over && inShape(g, x, u));

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
  for (const [from, to, name] of LANDMARKS.stage11) {
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

test('no plot stands on a road, and none in the sea but the fireworks barges', () => {
  for (const [id, x, u, w, h] of PLOTS) {
    for (const r of ROADS) {
      if (!CARS.has(r.cls)) continue;
      cells(x, u, w, h, (px, pu) => assert.ok(near(r.pts, px, pu).d > r.w / 2, `${id} on ${r.id} at (${px}, ${pu})`));
    }
    if (/^hanabi_/.test(id)) cells(x, u, w, h, (px, pu) => assert.ok(isSea(px, pu), `${id} not on the water`));
    else cells(x, u, w, h, (px, pu) => assert.ok(onLand(px, pu), `${id} in the sea at (${px}, ${pu})`));
  }
});

test('only a station stands on the tracks', () => {
  for (const [id, x, u, w, h] of PLOTS) {
    if (/_eki$|^ropeway_|^monorail_/.test(id)) continue;
    for (const r of RAILS) {
      if (r.style === 'rope') continue; // (the ropeway's cables pass over the hillside)
      cells(x, u, w, h, (px, pu) => assert.ok(near(r.pts, px, pu).d > railHalf(r), `${id} on ${r.id} at (${px}, ${pu})`));
    }
  }
});

test('the roads keep to the land, but the bridges, the piers and the expressway on its piers', () => {
  for (const r of ROADS) {
    if (r.cls === 'bridge' || r.cls === 'deck' || r.cls === 'express') continue;
    for (let i = 0; i + 1 < r.pts.length; i++) {
      const [[ax, au], [bx, bu]] = [r.pts[i], r.pts[i + 1]];
      const n = Math.ceil(Math.hypot(bx - ax, bu - au));
      for (let k = 0; k <= n; k++) {
        const [x, u] = [ax + ((bx - ax) * k) / n, au + ((bu - au) * k) / n];
        assert.ok(onLand(x, u), `${r.id} in the sea at (${x | 0}, ${u | 0})`);
      }
    }
  }
  // the railway too
  for (const r of RAILS.filter((q) => q.style !== 'rope'))
    for (let i = 0; i + 1 < r.pts.length; i++) {
      const [[ax, au], [bx, bu]] = [r.pts[i], r.pts[i + 1]];
      const n = Math.ceil(Math.hypot(bx - ax, bu - au));
      for (let k = 0; k <= n; k++) {
        const [x, u] = [ax + ((bx - ax) * k) / n, au + ((bu - au) * k) / n];
        for (const dx of [-railHalf(r), 0, railHalf(r)]) assert.ok(!isSea(x + dx, u), `${r.id} in the sea at (${(x + dx) | 0}, ${u | 0})`);
      }
    }
});

test('the bridges span their water: each starts and ends on land, the sea under its middle', () => {
  for (const r of ROADS.filter((q) => q.cls === 'bridge')) {
    const [a, b] = [r.pts[0], r.pts.at(-1)];
    assert.ok(!isSea(...a) && !isSea(...b), `${r.id} ends in the sea`);
    assert.ok(isSea((a[0] + b[0]) / 2, (a[1] + b[1]) / 2), `${r.id} is over no water`);
  }
});

test('nothing tall stands in an arena, and the boss has open water', () => {
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
    if (u >= L) continue;
    assert.ok(isSea(x, u), `the boss's arena is not all water at (${x | 0}, ${u | 0})`);
  }
});

test('every road, step and path leads somewhere: its ends are on the edge, on another road, at a plot or on a ground', () => {
  for (const r of ROADS)
    for (const end of [r.pts[0], r.pts.at(-1)]) {
      const joined = ROADS.some((o) => o !== r && near(o.pts, ...end).d <= o.w / 2 + 2);
      const grounded = GROUNDS.some((g) => g.id !== 'saka' && inShape(g, ...end));
      const docked = r.cls === 'deck' && FERRIES.some((f) => [f.pts[0], f.pts.at(-1)].some(([x, u]) => Math.hypot(x - end[0], u - end[1]) <= 3)); // (a ferry ties up there)
      assert.ok(onEdge(end) || joined || inPlot(end, 2) || grounded || docked, `${r.id} ends nowhere at (${end})`);
    }
});

test('every track leads somewhere: its ends are on the edge or at a station', () => {
  for (const r of RAILS) for (const end of [r.pts[0], r.pts.at(-1)]) assert.ok(onEdge(end) || inPlot(end, 2), `${r.id} ends nowhere at (${end})`);
});

test('every ferry crosses open water from a pier to a pier', () => {
  const piers = ROADS.filter((r) => r.cls === 'deck');
  for (const f of FERRIES) {
    for (const end of [f.pts[0], f.pts.at(-1)]) assert.ok(piers.some((p) => [p.pts[0], p.pts.at(-1)].some(([x, u]) => Math.hypot(x - end[0], u - end[1]) <= 3)), `${f.id} has no pier at (${end})`);
    const [[ax, au], [bx, bu]] = [f.pts[0], f.pts.at(-1)];
    for (let k = 1; k < 10; k++) assert.ok(isSea(ax + ((bx - ax) * k) / 10, au + ((bu - au) * k) / 10), `${f.id} runs aground`);
  }
});
