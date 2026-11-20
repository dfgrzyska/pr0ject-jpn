// Beppu's stronger waves (docs/plan-silniejsze-fale.md): jigoku-mushi baskets on hemp ropes over Kannawa, one over
// the steam kitchen's stone boxes and one across the old lane, Ideyu-zaka, hung high over the steam drifting up; the
// barrel of hot mud on its hand cart across a street of the town; no pair (Beppu's eggs hatch into little oni).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SKINS } from '../../src/game/skins.js';

const st = JSON.parse(readFileSync(new URL('../../src/data/stage6.json', import.meta.url)));
const W = st.waves;
const of = (type) => W.filter((w) => w.type === type);
// (tools/art/beppu/mid.mjs: Kannawa; the old lane winding up it, its half width; the roads along the slope, their
// wobble and half width; the steam kitchen; the town's cross street at u 1560 off Ekimae-dori, the covered arcade
// ending at it; the turret stands and geyser vents, put where their waves come in)
const KANNAWA = [2100, 3300];
const laneX = (u) => 64 + 12 * Math.sin(u / 95 + 0.6);
const CONTOUR = [2380, 2700, 3010];
const KITCHEN = { x: [104, 150], u: [2466, 2500] };
const CROSS = { u: 1560, hw: 4 };
const ARCADE = { x: [114, 127], u: [1310, 1550] };
const spots = W.filter((w) => w.type === 'turret' || w.type === 'geyser').map((w) => [w.x, 430 + 30 * w.t]);

test('the mix: 2 ropes of baskets, one cart, no pair; the looks', () => {
  assert.equal(of('chain').length, 2);
  assert.equal(of('cart').length, 1);
  assert.equal(of('split').length, 0);
  const { chain, split, cart } = SKINS.beppu;
  assert.ok(chain?.frames?.length === 3 && cart && !split, 'prawns, corn and pudding in turn; a cart; no pair');
  assert.ok(chain.high, 'the baskets hang over the steam');
});

test('the ropes over Kannawa: over the steam kitchen and across the old lane, their posts off the ways and the stands', () => {
  const [kitchen, lane] = of('chain');
  for (const w of of('chain')) {
    const u = 434 + 30 * w.t; // (where the rope is put on the map: stripU(-14))
    assert.ok(u > KANNAWA[0] + 20 && u < KANNAWA[1] - 20, `rope at ${w.t} s not over Kannawa (u ${u})`);
    assert.ok(CONTOUR.every((c) => Math.abs(u - c) > 8 + 3 + 6), `rope at ${w.t} s: its posts on a road along the slope`);
    for (const x of [w.x, w.x2]) {
      assert.ok(Math.abs(x - laneX(u)) > 7 + 4 && x >= 2 && x <= 178, `rope at ${w.t} s: a post on the lane (x ${x})`);
      for (const [sx, su] of spots) assert.ok(Math.hypot(x - sx, u - su) > 14, `rope at ${w.t} s: a post on a stand or a vent at (${sx}, ${su})`);
    }
    assert.ok((w.x2 - w.x) / (w.n + 1) >= 8, `rope at ${w.t} s: the baskets on top of each other`);
  }
  const ku = 434 + 30 * kitchen.t;
  assert.ok(ku > KITCHEN.u[0] && ku < KITCHEN.u[1] && kitchen.x < KITCHEN.x[0] && kitchen.x2 > KITCHEN.x[1], 'one over the steam kitchen\'s boxes');
  const lu = 434 + 30 * lane.t;
  assert.ok(lane.x < laneX(lu) - 7 && lane.x2 > laneX(lu) + 7, 'one across the old lane');
});

test('the mud cart along the cross street, in from the west, off the screen before the arcade\'s roof', () => {
  const [w] = of('cart');
  assert.equal(w.dir, 1);
  const u = 420 + 30 * w.t - w.y; // (where it comes on: stripU(y))
  assert.ok(Math.abs(u - CROSS.u) < 2, `on the cross street (u ${u})`);
  assert.ok(u - 8 > ARCADE.u[1], 'clear of the arcade\'s roof as it passes its gate');
  for (const [sx, su] of spots) assert.ok(Math.abs(su - u) > 16 || sx < 0, `a stand or vent on its street at (${sx}, ${su})`);
});

test('nothing new in the quiet before the crocodile nor before the oni', () => {
  const heavy = of('heavy')[0];
  const boss = of('boss')[0];
  for (const w of [...of('chain'), ...of('cart')]) {
    assert.ok(w.t + 14 <= heavy.t - 1, `${w.type} at ${w.t} s at the crocodile's fight`);
    assert.ok(w.t < boss.t - 9, `${w.type} at ${w.t} s just before the oni`);
  }
});
