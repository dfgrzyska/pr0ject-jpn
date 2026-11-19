// Kyoto's stronger waves (docs/plan-silniejsze-fale.md): popcorn down to about 55% of what can be shot down (lighter
// than the other cities: Kyoto is often the first); the omikuji on ropes over its streets, their posts off the
// shrines' and temples' grounds; the kai-awase pairs; the yamaboko each on its street all the while it is on the
// screen, one at a time, never in the quiet before the fights.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const st = JSON.parse(readFileSync(new URL('../../src/data/stage1.json', import.meta.url)));
const W = st.waves;
const of = (type) => W.filter((w) => w.type === type);
// Kyoto's streets as tools/art/kyoto/mid.mjs paves them ([x0, x1, u0, u1]): Hanamikoji in Gion, the approach to
// Fushimi Inari, Gojo-zaka across the foot of the hill, the steps of Sannenzaka winding up to Kiyomizu
const STREETS = { hanamikoji: [80, 100, 0, 512], sando: [70, 110, 650, 1130], gojozaka: [0, 180, 4989, 5001], sannenzaka: [74, 106, 5004, 5400] };
const onStreet = (x, u) => Object.entries(STREETS).filter(([, [x0, x1, u0, u1]]) => x >= x0 && x <= x1 && u >= u0 && u <= u1).map(([k]) => k);
// the holy grounds: Fushimi Inari's shrine and its thousand torii, Kinkaku-ji and Ryoan-ji, Kiyomizu-dera above the old town
const HOLY = [[1130, 2700], [3500, 4900], [5420, 6300]];
const holy = (u) => HOLY.some(([a, b]) => u >= a && u <= b);
const skin = readFileSync(new URL('../../src/game/skins.js', import.meta.url), 'utf8');

test('the mix: popcorn about 55%, 3-5 ropes of omikuji, 10-14 shells, 2 floats', () => {
  const n = (type) => of(type).reduce((s, w) => s + (type === 'chain' ? w.n : w.count ?? 1), 0);
  const all = ['popcorn', 'diver', 'shooter', 'turret', 'carrier', 'ambush', 'chain', 'cart'].reduce((s, t) => s + n(t), 0) + n('split') * 3;
  const share = n('popcorn') / all;
  assert.ok(share > 0.48 && share <= 0.57, `popcorn ${n('popcorn')} of ${all}`);
  assert.ok(of('chain').length >= 3 && of('chain').length <= 5);
  for (const w of of('chain')) assert.ok(w.n >= 4 && w.n <= 7 && w.x2 > w.x, `rope at ${w.t} s`);
  assert.ok(n('split') >= 10 && n('split') <= 14);
  assert.equal(of('cart').length, 2);
  for (const k of ['chain:', 'split:', 'cart:']) assert.ok(skin.slice(skin.indexOf('kyoto: {'), skin.indexOf('okinawa: {')).includes(k), k);
});

test('each rope hangs over a street, its posts off the street and off the holy grounds', () => {
  for (const w of of('chain')) {
    const u = 434 + 30 * w.t;
    const sk = w.skew ?? 0;
    for (const [x, du] of [[w.x, 0], [w.x2, sk]]) {
      assert.ok(!holy(u + du), `rope at ${w.t} s: a post on holy ground (u ${u + du})`);
      assert.equal(onStreet(x, u + du).length, 0, `rope at ${w.t} s: a post in the street at (${x}, ${u + du})`);
    }
    let over = false;
    for (let k = 1; k < 20; k++) over ||= onStreet(w.x + ((w.x2 - w.x) * k) / 20, u + (sk * k) / 20).length > 0;
    assert.ok(over, `rope at ${w.t} s over no street`);
  }
});

test('the floats drive on their streets while on the screen, one at a time', () => {
  const carts = of('cart');
  for (const [i, w] of carts.entries()) {
    if (typeof w.dir === 'number') {
      // across Gojo-zaka: on the street's line, all the way over
      const u = 420 + 30 * w.t - w.y;
      assert.deepEqual(onStreet(90, u), ['gojozaka'], `float at ${w.t} s off Gojo-zaka (u ${u})`);
    } else {
      for (let s = 0; s < 9; s += 0.5) {
        const u = 440 + 30 * w.t - 14 * s;
        assert.ok(onStreet(w.x, u).length, `float at ${w.t} s off its street after ${s} s (u ${u})`);
      }
    }
    if (i) assert.ok(w.t - carts[i - 1].t > 9.5, `two floats at once at ${w.t} s`);
  }
});

test('nothing new in the quiet before the tanuki nor before Kyubi', () => {
  const heavy = of('heavy')[0];
  const boss = of('boss')[0];
  for (const w of [...of('chain'), ...of('cart'), ...of('split')]) {
    const stays = w.type === 'chain' ? 13 : w.type === 'cart' ? 9 : 0;
    // (the tanuki does not hold the scroll: its fight runs on for up to about fifty seconds, 45 s once it is in
    // place; a pair there only in place of a wave of popcorn)
    assert.ok(w.t + stays <= heavy.t - 1 || w.t >= heavy.t + 52 || w.type === 'split', `${w.type} at ${w.t} s at the tanuki's fight`);
    assert.ok(w.t < boss.t - 9, `${w.type} at ${w.t} s just before Kyubi`);
  }
});
