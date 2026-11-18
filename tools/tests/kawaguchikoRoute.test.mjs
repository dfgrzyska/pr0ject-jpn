// Kawaguchiko's route (tools/art/kawaguchiko/route.mjs) keeps its promises: the stretches cover the strip, the plots
// stay clear of each other, of the roads, the tracks and the arenas, every road, track and path leads somewhere, the
// lake leaves the miniboss open water, and above the quay the strip is clear for Fuji's panorama.
import test from 'node:test';
import assert from 'node:assert/strict';
import { W, L, SECTIONS, ARENAS, ROADS, RAILS, PLOTS, GROUNDS, WATER, VIEW_FROM } from '../art/kawaguchiko/route.mjs';
import { near, inShape, railHalf } from '../art/tokyo/geom.mjs';
import { LANDMARKS } from '../../src/data/landmarks.js';

const onEdge = ([x, u]) => x <= 0 || x >= W || u <= 0 || u >= L;
const inPlot = ([x, u], pad = 0) => PLOTS.some(([, px, pu, w, h]) => x >= px - pad && x <= px + w + pad && u >= pu - pad && u <= pu + h + pad);
const CARS = new Set(['avenue', 'street', 'lane', 'road', 'bridge']);
const lake = WATER.find((w) => w.id === 'kawaguchiko');

test('the stretches cover the strip end to end', () => {
  let at = 0;
  for (const [from, to] of SECTIONS) {
    assert.equal(from, at);
    assert.ok(to > from);
    at = to;
  }
  assert.equal(at, L);
});

test('the places named on the way are in order, inside the strip, and the lava forest goes unnamed', () => {
  let at = 0;
  for (const [from, to, name] of LANDMARKS.stage10) {
    assert.ok(from >= at && to > from && to <= L, `${name}: ${from}-${to} after ${at}`);
    assert.ok(name.length <= 26, name);
    assert.ok(!/JUKAI|AOKIGAHARA/.test(name), name);
    at = to;
  }
});

test('the plots are inside the strip and clear of each other', () => {
  PLOTS.forEach(([id, x, u, w, h], i) => {
    assert.ok(x >= 0 && u >= 0 && x + w <= W && u + h <= L, id);
    for (const [other, ox, ou, ow, oh] of PLOTS.slice(i + 1)) assert.ok(x + w <= ox || ox + ow <= x || u + h <= ou || ou + oh <= u, `${id} over ${other}`);
  });
});

test('no plot stands on a road, nor in the lake (but what is meant to)', () => {
  for (const [id, x, u, w, h] of PLOTS) {
    for (const r of ROADS) {
      if (!CARS.has(r.cls)) continue;
      for (let pu = u + 0.5; pu < u + h; pu += 1) for (let px = x + 0.5; px < x + w; px += 1) assert.ok(near(r.pts, px, pu).d > r.w / 2, `${id} on ${r.id} at (${px}, ${pu})`);
    }
    if (id === 'unoshima_jinja') continue; // (on its island)
    for (let pu = u + 0.5; pu < u + h; pu += 1) for (let px = x + 0.5; px < x + w; px += 1) assert.ok(!inShape(lake, px, pu), `${id} in the lake`);
  }
});

test('only a station stands on the tracks', () => {
  for (const [id, x, u, w, h] of PLOTS) {
    if (/_eki$|^ropeway_/.test(id)) continue;
    for (const r of RAILS) for (let pu = u + 0.5; pu < u + h; pu += 1) for (let px = x + 0.5; px < x + w; px += 1) assert.ok(near(r.pts, px, pu).d > railHalf(r), `${id} on ${r.id} at (${px}, ${pu})`);
  }
});

test('nothing tall stands in an arena, and the miniboss has open water', () => {
  for (const [ax, au, name, r] of ARENAS)
    for (const [id, x, u, w, h, , low] of PLOTS) {
      if (low) continue;
      const dx = Math.max(x - ax, 0, ax - (x + w));
      const du = Math.max(u - au, 0, au - (u + h));
      assert.ok(Math.hypot(dx, du) >= r, `${id} in the arena of ${name}`);
    }
  const [ax, au, , r] = ARENAS[0];
  for (let a = 0; a < 64; a++) {
    const x = ax + Math.cos((a / 64) * Math.PI * 2) * r * 0.9;
    const u = au + Math.sin((a / 64) * Math.PI * 2) * r * 0.9;
    assert.ok(inShape(lake, x, u) && !GROUNDS.some((g) => g.over && inShape(g, x, u)), `the lake's arena is not all water at (${x | 0}, ${u | 0})`);
  }
  assert.ok(ARENAS[1][1] - ARENAS[1][3] >= VIEW_FROM, 'the boss fights over the panorama');
});

test('every road and path leads somewhere: its ends are on the edge, on another road, at a plot or on a ground', () => {
  for (const r of ROADS)
    for (const end of [r.pts[0], r.pts.at(-1)]) {
      const joined = ROADS.some((o) => o !== r && near(o.pts, ...end).d <= o.w / 2 + 2);
      const grounded = GROUNDS.some((g) => inShape(g, ...end));
      assert.ok(onEdge(end) || joined || inPlot(end, 2) || grounded, `${r.id} ends nowhere at (${end})`);
    }
});

test('every track leads somewhere: its ends are on the edge or under a station', () => {
  for (const r of RAILS) for (const end of [r.pts[0], r.pts.at(-1)]) assert.ok(onEdge(end) || inPlot(end, 2), `${r.id} ends nowhere at (${end})`);
});

test('above the quay the strip is clear: nothing stands there, roads end on the promenade along it', () => {
  const view = WATER.find((w) => w.view);
  assert.deepEqual(view.rect, [0, VIEW_FROM, W, L - VIEW_FROM]);
  assert.equal(SECTIONS.at(-1)[0], VIEW_FROM);
  for (const [id, , u, , h] of PLOTS) assert.ok(u + h <= VIEW_FROM, `${id} past the quay`);
  for (const r of ROADS) for (const [x, u] of r.pts) assert.ok(u <= VIEW_FROM - 20, `${r.id} past the quay at (${x}, ${u})`);
  const quay = GROUNDS.find((g) => g.id === 'gampeki');
  assert.equal(quay.rect[1] + quay.rect[3], VIEW_FROM, 'the quay runs right up to the view');
  const promenade = ROADS.find((r) => r.id === 'kohan_nishi');
  assert.ok(promenade.pts.every(([, u]) => u >= VIEW_FROM - 30), 'the promenade runs along the quay');
});
