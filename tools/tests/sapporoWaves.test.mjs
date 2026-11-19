// Sapporo's stronger waves (docs/plan-silniejsze-fale.md): popcorn down to about 45% of what can be shot down;
// salted salmon on lines over the avenues by Nijo market, their posts off the avenues and the streets; jaga-bata
// in place of waves of popcorn; no cart (the city has its snowploughs); never in the quiet before the fights.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SKINS } from '../../src/game/skins.js';

const st = JSON.parse(readFileSync(new URL('../../src/data/stage3.json', import.meta.url)));
const W = st.waves;
const of = (type) => W.filter((w) => w.type === type);
// (tools/art/sapporo/mid.mjs: the avenues [x, half width], the streets' u, Nijo market's hall)
const AVENUES = [[30, 6], [90, 6], [150, 6]];
const STREETS = [1200, 1330, 1600, 1740, 2010, 2140, 2240, 2470, 2650, 3000, 3110, 3230, 3350, 3470];
const NIJO = { x: [105, 139], u: [2660, 2772] };

test('the mix: popcorn about 45%, 2-5 lines of salmon, 16-22 jaga-bata, no cart', () => {
  const n = (type) => of(type).reduce((s, w) => s + (type === 'chain' ? w.n : w.count ?? 1), 0);
  const all = ['popcorn', 'diver', 'shooter', 'turret', 'carrier', 'ambush', 'chain', 'cart'].reduce((s, t) => s + n(t), 0) + n('split') * 3;
  const share = n('popcorn') / all;
  assert.ok(share > 0.35 && share <= 0.46, `popcorn ${n('popcorn')} of ${all}`);
  assert.ok(of('chain').length >= 2 && of('chain').length <= 5);
  assert.ok(n('split') >= 16 && n('split') <= 22);
  assert.equal(of('cart').length, 0);
  const { chain, split, cart } = SKINS.sapporo;
  assert.ok(chain?.frames?.length === 2 && split && !cart, 'its looks: the two salmon in turn, no cart');
});

test('each line of salmon over an avenue by Nijo market, its posts off the avenues and the streets', () => {
  for (const w of of('chain')) {
    const u = 434 + 30 * w.t; // (where the line is put on the map: stripU(-14))
    assert.ok(u > NIJO.u[0] - 20 && u < NIJO.u[1] + 20, `line at ${w.t} s not by the market (u ${u})`);
    assert.ok(AVENUES.some(([x, hw]) => w.x < x - hw && w.x2 > x + hw), `line at ${w.t} s over no avenue`);
    for (const x of [w.x, w.x2]) {
      assert.ok(!AVENUES.some(([ax, hw]) => Math.abs(x - ax) < hw + 1), `line at ${w.t} s: a post on an avenue at x ${x}`);
      assert.ok(x >= 4 && x <= 176, `line at ${w.t} s: a post off the screen`);
    }
    assert.ok(!STREETS.some((s) => Math.abs(u - s) < 8), `line at ${w.t} s: its posts on a street (u ${u})`);
    // (a salmon is some 8 px wide: room for each)
    assert.ok((w.x2 - w.x) / (w.n + 1) >= 8, `line at ${w.t} s: the salmon on top of each other`);
  }
});

test('nothing new in the quiet before Yuki-onna nor before the bear', () => {
  const heavy = of('heavy')[0];
  const boss = of('boss')[0];
  for (const w of [...of('chain'), ...of('split')]) {
    const stays = w.type === 'chain' ? 13 : 0;
    assert.ok(w.t + stays <= heavy.t - 1 || w.t >= heavy.t + 10, `${w.type} at ${w.t} s at Yuki-onna's coming`);
    assert.ok(w.t < boss.t - 9, `${w.type} at ${w.t} s just before the bear`);
  }
});
