// Kagoshima's stronger waves (docs/plan-silniejsze-fale.md): hoshi-daikon drying on bamboo racks over Sakurajima's
// road by its fields, two lines to a rack, the volcano's ash carrying the fire from one to the other; the ishi-yaki
// imo cart down a street of Tenmonkan all the while it is on the screen; no pair (its bombs already split); never
// in the quiet before the fights.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isWater, COLUMNS, CITY, VIADUCT } from '../art/kagoshima/geo.mjs';
import { catching } from '../../src/game/enemies/chainSplitCart.js';
import { CHAIN } from '../../src/config.js';
import { SKINS } from '../../src/game/skins.js';

const st = JSON.parse(readFileSync(new URL('../../src/data/stage4.json', import.meta.url)));
const W = st.waves;
const of = (type) => W.filter((w) => w.type === type);
// (tools/art/kagoshima/island.mjs: the road up from the port at x 150, half width 4; the daikon fields west of it)
const ROAD = { x: 150, hw: 4 };
const FIELDS = { x: [4, 138], u: [4670, 4930] };

test('the mix: 2 racks of 2 lines of daikon, one cart, no pair; the looks', () => {
  assert.equal(of('chain').length, 4);
  assert.equal(of('cart').length, 1);
  assert.equal(of('split').length, 0);
  const { chain, split, cart } = SKINS.kagoshima;
  assert.ok(chain?.frames?.length === 2 && cart && !split, 'the two pairs of daikon in turn, a cart, no pair');
  assert.ok(chain.cross > CHAIN.cross, 'the ash carries the fire further');
});

test('each line over Sakurajima\'s road by the daikon fields, its posts in the field and across the road', () => {
  for (const w of of('chain')) {
    const u = 434 + 30 * w.t; // (where the line is put on the map: stripU(-14))
    assert.ok(u > FIELDS.u[0] && u < FIELDS.u[1], `line at ${w.t} s not by the fields (u ${u})`);
    assert.ok(w.x < ROAD.x - ROAD.hw && w.x2 > ROAD.x + ROAD.hw, `line at ${w.t} s does not cross the road`);
    assert.ok(w.x > FIELDS.x[0] && w.x < FIELDS.x[1], `line at ${w.t} s: its west post not in the field`);
    for (const x of [w.x, w.x2]) {
      assert.ok(Math.abs(x - ROAD.x) > ROAD.hw + 2 && !isWater(x, u) && x <= 178, `line at ${w.t} s: a post off the land at (${x}, ${u})`);
    }
    assert.ok((w.x2 - w.x) / (w.n + 1) >= 8, `line at ${w.t} s: the daikon on top of each other`);
  }
});

test('the two lines of a rack close enough for the ash to carry the fire across, not for a plain rope', () => {
  const chains = of('chain');
  for (let i = 0; i < chains.length; i += 2) {
    const [a, b] = [chains[i], chains[i + 1]];
    const dy = 30 * (b.t - a.t); // (how far apart they hang on the screen)
    assert.ok(dy > CHAIN.cross && dy < SKINS.kagoshima.chain.cross - 1, `the rack at ${a.t} s: its lines ${dy} px apart`);
    const src = { x: 140, y: 100, rope: 'a' };
    const other = { x: 140, y: 100 - dy, rope: 'b', dead: false };
    assert.equal(catching([other], src, CHAIN.cross).length, 0);
    assert.equal(catching([other], src, SKINS.kagoshima.chain.cross).length, 1);
  }
});

test('the imo cart rolls down a street of Tenmonkan all the while it is on the screen', () => {
  const [w] = of('cart');
  assert.ok(COLUMNS.some((c) => c.x === w.x), 'on one of the streets up the city');
  for (let s = 0; s < 10.5; s += 0.5) {
    const u = 440 + 30 * w.t - 14 * s;
    assert.ok(u > CITY[0] + 20 && u < CITY[1] - 20, `the cart out of the city after ${s} s (u ${u})`);
    assert.ok(u < VIADUCT[0] - 14 || u > VIADUCT[1] + 14, `the cart under the viaduct after ${s} s`);
  }
});

test('nothing new in the quiet before Raiju nor before Sakurajima', () => {
  const heavy = of('heavy')[0];
  const boss = of('boss')[0];
  for (const w of [...of('chain'), ...of('cart')]) {
    const stays = w.type === 'chain' ? 13 : 10;
    // (Raiju comes down in some 6 s and flies off after 36 s of its fight, if it is still up)
    assert.ok(w.t + stays <= heavy.t - 1 || w.t >= heavy.t + 42, `${w.type} at ${w.t} s at Raiju's fight`);
    assert.ok(w.t < boss.t - 9, `${w.type} at ${w.t} s just before Sakurajima`);
  }
});
