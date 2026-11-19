// Nagasaki's stronger waves (docs/plan-silniejsze-fale.md): popcorn down to about 45% of what can be shot down; signal
// flags dressing halyards over the coast road by the Matsugae quay and over the shipyard's craneway, their posts on
// land, off the road and the rails; the kakuni-manju; the Kunchi whale down Shinchi's main street once the
// Oranda-bune is gone, all the while it is on the screen; never in the quiet before the fights.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isWater, r1X, R1_HW, CHINA_X, STREETS } from '../art/nagasaki/geo.mjs';
import { SKINS } from '../../src/game/skins.js';

const st = JSON.parse(readFileSync(new URL('../../src/data/stage8.json', import.meta.url)));
const W = st.waves;
const of = (type) => W.filter((w) => w.type === type);
const RAILS = [47, 53]; // the shipyard's craneway (tools/art/nagasaki/harbour.mjs), u 1560..1900
const SHIPYARD = [1560, 1900];
const onR1 = (x, u, pad = 0.5) => Math.abs(x - r1X(u)) < R1_HW + pad;
const onRail = (x, u, pad = 1) => u >= SHIPYARD[0] && u <= SHIPYARD[1] && RAILS.some((r) => Math.abs(x - r) < pad);
// Shinchi's main street, from the street along the embankment (2990) to the 3660 street
const MAIN = [STREETS.find((s) => s.u === 2990).u, STREETS.find((s) => s.u === 3660).u];

test('the mix: popcorn about 45%, 3-5 halyards of flags, 10-14 kakuni-manju, one whale', () => {
  const n = (type) => of(type).reduce((s, w) => s + (type === 'chain' ? w.n : w.count ?? 1), 0);
  const all = ['popcorn', 'diver', 'shooter', 'turret', 'carrier', 'ambush', 'chain', 'cart'].reduce((s, t) => s + n(t), 0) + n('split') * 3;
  const share = n('popcorn') / all;
  assert.ok(share > 0.35 && share <= 0.46, `popcorn ${n('popcorn')} of ${all}`);
  assert.ok(of('chain').length >= 3 && of('chain').length <= 5);
  for (const w of of('chain')) assert.ok(w.n >= 4 && w.n <= 7 && w.x2 > w.x && (w.x2 - w.x) / w.n >= 5, `halyard at ${w.t} s`);
  assert.ok(n('split') >= 10 && n('split') <= 14);
  assert.equal(of('cart').length, 1);
  const { chain, split, cart } = SKINS.nagasaki;
  assert.ok(chain?.frames?.length === 4 && split && cart, 'its looks: the flags in turn');
});

test('each halyard on land, its posts off the road and the rails, over the coast road or the craneway', () => {
  for (const w of of('chain')) {
    const u = 434 + 30 * w.t; // (where the rope is put on the map: stripU(-14))
    for (const x of [w.x, w.x2]) {
      assert.ok(!isWater(x, u), `halyard at ${w.t} s: a post in the water at (${x}, ${u})`);
      assert.ok(!onR1(x, u) && !onRail(x, u), `halyard at ${w.t} s: a post on the road or the rails at (${x}, ${u})`);
      assert.ok(x <= 178, `halyard at ${w.t} s: a post off the screen`);
    }
    let over = false;
    for (let k = 1; k < 20; k++) {
      const x = w.x + ((w.x2 - w.x) * k) / 20;
      over ||= onR1(x, u, 0) || onRail(x, u, 0.5);
    }
    assert.ok(over, `halyard at ${w.t} s over neither the road nor the craneway (u ${u})`);
  }
});

test('the whale drives down Shinchi\'s main street while it is on the screen, after the Oranda-bune', () => {
  const [w] = of('cart');
  assert.equal(w.x, CHINA_X);
  for (let s = 0; s < 10.5; s += 0.5) {
    const u = 440 + 30 * w.t - 14 * s;
    assert.ok(u > MAIN[0] + 6 && u < MAIN[1] - 4, `the whale off the main street after ${s} s (u ${u})`);
  }
  const heavy = of('heavy')[0];
  // (the bot takes the Oranda-bune down in 15-19 s; the stage leaves it the time up to its next wave)
  assert.ok(w.t >= heavy.t + 25, 'not in the Oranda-bune\'s fight');
});

test('nothing new lingers into the moment of remembrance over the Peace Park', () => {
  // (a pair falls slowly: left alone it takes some 18 s to leave the screen; a halyard stays about 13 s, the whale 10)
  const { from, to } = st.interlude;
  for (const w of [...of('chain'), ...of('cart'), ...of('split')]) {
    const stays = w.type === 'chain' ? 13 : w.type === 'cart' ? 10 : 18;
    assert.ok(w.t + stays <= from || w.t >= to, `${w.type} at ${w.t} s in the moment of remembrance (${from}-${to} s)`);
  }
});

test('nothing new in the quiet before the Oranda-bune nor before the dragon', () => {
  const heavy = of('heavy')[0];
  const boss = of('boss')[0];
  for (const w of [...of('chain'), ...of('cart'), ...of('split')]) {
    const stays = w.type === 'chain' ? 13 : w.type === 'cart' ? 10 : 0;
    assert.ok(w.t + stays <= heavy.t - 1 || w.t >= heavy.t + 25, `${w.type} at ${w.t} s at the Oranda-bune's fight`);
    assert.ok(w.t < boss.t - 9, `${w.type} at ${w.t} s just before the dragon`);
  }
});
