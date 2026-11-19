// Fukuoka's waves (docs/plan-fukuoka.md 5.3, phase 11): popcorn at most 40% of what can be shot down, 8-10 ropes of
// lanterns, 15-20 pairs of mentaiko, five or six ox-carts each on its road and never two at once; nothing over
// Nanzo-in's Buddha (D6) nor in the quiet before the fights; what stands on the map on land and off the holy grounds,
// the turtles in water; traps and ambushes as every city has them.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ROADS, WATER, GROUNDS, PLOTS, isSea } from '../art/fukuoka/route.mjs';
import { near, inShape } from '../art/tokyo/geom.mjs';

const st = JSON.parse(readFileSync(new URL('../../src/data/stage12.json', import.meta.url)));
const W = st.waves;
const U = (t) => 430 + 30 * t; // (where a ground one comes in on the map)
const wet = (x, u) => isSea(x, u) || WATER.some((w) => inShape(w, x, u));
const HOLY = ['kushida_keidai', 'tochoji_keidai', 'shofukuji_keidai', 'sumiyoshi_mori', 'nanzoin_keidai', 'tenmangu_keidai', 'kanzeonji_keidai'];
const holy = (x, u) => GROUNDS.some((g) => HOLY.includes(g.id) && inShape(g, x, u)) || PLOTS.some(([id, px, pu, pw, ph]) => ['nehanzo', 'honden', 'romon', 'kanzeonji', 'kaidanin', 'komyozenji', 'kushida_jinja', 'tochoji', 'shofukuji', 'sumiyoshi_jinja'].includes(id) && x > px - 4 && x < px + pw + 4 && u > pu - 4 && u < pu + ph + 4);
const onRoad = (x, u) => ROADS.some((r) => near(r.pts, x, u).d < r.w / 2 + 0.5);
const of = (type) => W.filter((w) => w.type === type);

test('the mix: popcorn at most 40%, 8-10 ropes, 15-20 pairs of mentaiko, 5-6 ox-carts', () => {
  const n = (type) => of(type).reduce((s, w) => s + (type === 'chain' ? w.n : w.count ?? 1), 0);
  const all = ['popcorn', 'diver', 'shooter', 'turret', 'carrier', 'ambush', 'chain', 'cart'].reduce((s, t) => s + n(t), 0) + n('split') * 3;
  assert.ok(n('popcorn') / all <= 0.4, `popcorn ${n('popcorn')} of ${all}`);
  assert.ok(of('chain').length >= 8 && of('chain').length <= 10);
  for (const w of of('chain')) assert.ok(w.n >= 5 && w.n <= 9 && w.x2 > w.x);
  assert.ok(n('split') >= 15 && n('split') <= 20);
  assert.ok(of('cart').length >= 5 && of('cart').length <= 6);
});

test('the ox-carts drive on their roads while on the screen, one at a time, never in the quiet before a fight', () => {
  const carts = of('cart');
  for (const [i, w] of carts.entries()) {
    for (let s = 0; s < 9; s += 0.5) assert.ok(onRoad(w.x, U(w.t) + 20 - 14 * s), `cart at ${w.t} s off its road after ${s} s`);
    if (i) assert.ok(w.t - carts[i - 1].t > 9.5, `two carts at once at ${w.t} s`);
  }
});

test('nothing over Nanzo-in\'s Buddha nor in the quiet before the fights', () => {
  const heavy = of('heavy')[0];
  const boss = of('boss')[0];
  assert.ok(heavy.hold);
  for (const w of W) {
    if (w.type === 'heavy' || w.type === 'boss') continue;
    const stays = ['turret', 'trap', 'chain', 'ambush'].includes(w.type) ? 13 : w.type === 'cart' ? 9 : 0;
    assert.ok(w.t + stays <= 148 || w.t >= 157, `${w.type} at ${w.t} s over the Buddha`);
    assert.ok(w.t < heavy.t - 4 || w.t > heavy.t, `${w.type} at ${w.t} s just before the stalls' fight`);
    if (stays) assert.ok(w.t + stays <= heavy.t || w.t > heavy.t, `${w.type} at ${w.t} s still standing at the stalls' fight`);
    assert.ok(w.t < boss.t - 9, `${w.type} at ${w.t} s just before the wall`);
  }
});

test('what stands on the map is on land and off the holy grounds; the turtles are in the water', () => {
  for (const w of [...of('turret'), ...of('trap')]) {
    const u = U(w.t);
    assert.ok(!wet(w.x, u) && !holy(w.x, u) && !onRoad(w.x, u), `${w.type} at ${w.t} s (${w.x}, ${u})`);
  }
  for (const w of of('chain')) {
    const u = 434 + 30 * w.t;
    for (const [x, du] of [[w.x, 0], [w.x2, w.skew ?? 0]]) assert.ok(!wet(x, u + du) && !holy(x, u + du), `rope at ${w.t} s: a pole at (${x}, ${u + du})`);
  }
  for (const w of of('ambush')) assert.ok(wet(w.x, U(w.t)), `ambush at ${w.t} s not in water`);
});

test('traps and ambushes as in every city: 8-14 and 4-10, clear of the fights, in order', () => {
  const fights = W.filter((w) => w.type === 'heavy' || w.type === 'boss');
  assert.ok(of('trap').length >= 8 && of('trap').length <= 14);
  assert.ok(of('ambush').length >= 4 && of('ambush').length <= 10);
  for (const w of [...of('trap'), ...of('ambush')]) {
    assert.ok(w.x >= 14 && w.x <= 166);
    for (const f of fights) assert.ok(w.t < f.t - 13 || w.t > f.t + (f.type === 'boss' ? Infinity : f.hold ? 0 : 45), `${w.type} at ${w.t} s by the ${f.type}`);
  }
  const ts = W.map((w) => w.t);
  assert.deepEqual(ts, [...ts].sort((a, b) => a - b));
});
