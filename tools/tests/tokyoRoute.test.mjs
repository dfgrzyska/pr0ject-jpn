// Tokyo's route (tools/art/tokyo/route.mjs) keeps its promises: the districts cover the strip, the plots stay
// clear of each other, of the streets and of the arenas, and every street and track leads somewhere.
import test from 'node:test';
import assert from 'node:assert/strict';
import { W, L, DISTRICTS, ARENAS, ROADS, RAILS, PLOTS, GROUNDS } from '../art/tokyo/route.mjs';
import { near, inShape, railHalf } from '../art/tokyo/geom.mjs';
import { LANDMARKS } from '../../src/data/landmarks.js';

const onEdge = ([x, u]) => x <= 0 || x >= W || u <= 0 || u >= L;
const inPlot = ([x, u], pad = 0) => PLOTS.some(([, px, pu, w, h]) => x >= px - pad && x <= px + w + pad && u >= pu - pad && u <= pu + h + pad);
const CARS = new Set(['avenue', 'street', 'lane', 'express']);

test('the districts cover the strip end to end', () => {
  let at = 0;
  for (const [from, to] of DISTRICTS) {
    assert.equal(from, at);
    assert.ok(to > from);
    at = to;
  }
  assert.equal(at, L);
});

test('the landmarks named on the way are in order and inside the strip', () => {
  let at = 0;
  for (const [from, to, name] of LANDMARKS.stage9) {
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

test('no plot stands on a street', () => {
  for (const [id, x, u, w, h] of PLOTS)
    for (const r of ROADS) {
      if (!CARS.has(r.cls) || id.startsWith('rainbow_to_')) continue; // (the bridge's pylons stand on its deck)
      for (let pu = u + 0.5; pu < u + h; pu += 1) for (let px = x + 0.5; px < x + w; px += 1) assert.ok(near(r.pts, px, pu).d > r.w / 2, `${id} on ${r.id} at (${px}, ${pu})`);
    }
});

test('only a station (or what is built over or under the tracks) stands on tracks', () => {
  const ok = /_eki|^miyashita$|^basu_taminaru$|^akiba_gado$|^gantry_/;
  for (const [id, x, u, w, h] of PLOTS) {
    if (ok.test(id)) continue;
    for (const r of RAILS) for (let pu = u + 0.5; pu < u + h; pu += 1) for (let px = x + 0.5; px < x + w; px += 1) assert.ok(near(r.pts, px, pu).d > railHalf(r), `${id} on ${r.id} at (${px}, ${pu})`);
  }
});

test('nothing tall stands in an arena', () => {
  for (const [ax, au, name, r] of ARENAS)
    for (const [id, x, u, w, h, , low] of PLOTS) {
      if (low) continue;
      const dx = Math.max(x - ax, 0, ax - (x + w));
      const du = Math.max(u - au, 0, au - (u + h));
      assert.ok(Math.hypot(dx, du) >= r, `${id} in the arena of ${name}`);
    }
});

test('every street leads somewhere: its ends are on the edge, on another street, at a plot or on a ground', () => {
  for (const r of ROADS)
    for (const end of [r.pts[0], r.pts.at(-1)]) {
      const joined = ROADS.some((o) => o !== r && near(o.pts, ...end).d <= o.w / 2 + 2);
      const grounded = GROUNDS.some((g) => inShape(g, ...end));
      assert.ok(onEdge(end) || joined || inPlot(end, 2) || grounded, `${r.id} ends nowhere at (${end})`);
    }
});

test('every track leads somewhere: its ends are on the edge, on other tracks or under a plot', () => {
  for (const r of RAILS)
    for (const end of [r.pts[0], r.pts.at(-1)]) {
      const joined = RAILS.some((o) => o !== r && near(o.pts, ...end).d <= railHalf(o)) || ROADS.some((o) => o.cls === 'express' && near(o.pts, ...end).d <= o.w / 2 + 2);
      assert.ok(onEdge(end) || joined || inPlot(end, 2) || GROUNDS.some((g) => g.kind === 'apron' && inShape(g, ...end)), `${r.id} ends nowhere at (${end})`);
    }
});
