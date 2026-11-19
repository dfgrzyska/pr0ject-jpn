// Onomichi's stronger waves (docs/plan-silniejsze-fale.md): popcorn down to about 45% of what can be shot down; the
// fishermen's flags on ropes over its roads, their poles on land and off the temples' grounds; the hassaku pairs;
// the ferries on their crossings, docking at their piers, one at a time, never in the quiet before the fights.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ROADS, WATER, GROUNDS, FERRIES, isSea } from '../art/onomichi/route.mjs';
import { near, inShape } from '../art/tokyo/geom.mjs';

const st = JSON.parse(readFileSync(new URL('../../src/data/stage11.json', import.meta.url)));
const W = st.waves;
const of = (type) => W.filter((w) => w.type === type);
const wet = (x, u) => isSea(x, u) || WATER.some((w) => inShape(w, x, u));
const holy = (x, u) => GROUNDS.some((g) => ['jodoji_keidai', 'senkoji_keidai'].includes(g.id) && inShape(g, x, u));
const roadsAt = (x, u, pad = 0.5) => ROADS.filter((r) => near(r.pts, x, u).d < r.w / 2 + pad);
const skin = readFileSync(new URL('../../src/game/skins.js', import.meta.url), 'utf8');

test('the mix: popcorn about 45%, 7-9 ropes of flags, 12-15 hassaku, 4 ferries', () => {
  const n = (type) => of(type).reduce((s, w) => s + (type === 'chain' ? w.n : w.count ?? 1), 0);
  const all = ['popcorn', 'diver', 'shooter', 'turret', 'carrier', 'ambush', 'chain', 'cart'].reduce((s, t) => s + n(t), 0) + n('split') * 3;
  const share = n('popcorn') / all;
  assert.ok(share > 0.35 && share <= 0.46, `popcorn ${n('popcorn')} of ${all}`);
  assert.ok(of('chain').length >= 7 && of('chain').length <= 9);
  for (const w of of('chain')) assert.ok(w.n >= 4 && w.n <= 7 && w.x2 > w.x && (w.x2 - w.x) / w.n >= 4, `rope at ${w.t} s`);
  assert.ok(n('split') >= 12 && n('split') <= 15);
  assert.equal(of('cart').length, 4);
  for (const k of ['chain:', 'split:', 'cart:']) assert.ok(skin.slice(skin.indexOf('onomichi: {'), skin.indexOf('fukuoka: {')).includes(k), k);
});

test('each rope hangs over a road, its poles on land, off the roads and the temples\' grounds', () => {
  for (const w of of('chain')) {
    const u = 434 + 30 * w.t; // (where the rope is put on the map: stripU(-14))
    for (const [x, du] of [[w.x, 0], [w.x2, w.skew ?? 0]]) {
      assert.ok(!wet(x, u + du) && !holy(x, u + du), `rope at ${w.t} s: a pole at (${x}, ${u + du})`);
      assert.equal(roadsAt(x, u + du).length, 0, `rope at ${w.t} s: a pole on a road at (${x}, ${u + du})`);
    }
    let crosses = false;
    for (let k = 1; k < 20; k++) crosses ||= roadsAt(w.x + ((w.x2 - w.x) * k) / 20, u + ((w.skew ?? 0) * k) / 20).length > 0;
    assert.ok(crosses, `rope at ${w.t} s over no road`);
  }
});

test('the ferries keep to their crossings while on the screen, dock at their piers, one at a time', () => {
  const carts = of('cart');
  for (const [i, w] of carts.entries()) {
    if (typeof w.dir === 'number') {
      // across from the left edge (Mukaishima's pier) to the town's pier, where it docks: on the crossing's line
      const u = 420 + 30 * w.t - w.y; // (stripU(y))
      const f = FERRIES.find((r) => r.pts[0][1] === r.pts[1][1] && Math.abs(r.pts[0][1] - u) < 2);
      assert.ok(f, `ferry at ${w.t} s on no crossing (u ${u})`);
      assert.equal(w.dir, 1);
      assert.ok(Math.abs(w.stop - f.pts[1][0]) <= 1, `ferry at ${w.t} s docks at ${w.stop}, its pier at ${f.pts[1][0]}`);
    } else {
      // down the strait at Ozaki, all the while it is on the screen (about nine seconds)
      const f = FERRIES.find((r) => r.pts[0][0] === w.x && r.pts[1][0] === w.x);
      assert.ok(f, `ferry at ${w.t} s on no crossing (x ${w.x})`);
      for (let s = 0; s < 9; s += 0.5) {
        const u = 440 + 30 * w.t - 14 * s;
        assert.ok(u >= f.pts[0][1] && u <= f.pts[1][1], `ferry at ${w.t} s off its crossing after ${s} s (u ${u})`);
      }
    }
    if (i) assert.ok(w.t - carts[i - 1].t > 9.5, `two ferries at once at ${w.t} s`);
  }
});

test('nothing new in the quiet before the cat nor before the ghost ship', () => {
  const heavy = of('heavy')[0];
  const boss = of('boss')[0];
  for (const w of [...of('chain'), ...of('cart'), ...of('split')]) {
    const stays = w.type === 'chain' ? 13 : w.type === 'cart' ? 9 : 0;
    assert.ok(w.t + stays <= heavy.t - 1 || w.t > heavy.t, `${w.type} at ${w.t} s at the cat's fight`);
    assert.ok(w.t < boss.t - 9, `${w.type} at ${w.t} s just before the ship`);
  }
});
