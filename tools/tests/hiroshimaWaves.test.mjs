// Hiroshima's stronger waves (docs/plan-silniejsze-fale.md): a line of oysters strung between floats in the bay by
// the rafts, before the crab; the gozabune of Kangen-sai come alive, down the bay to the ferry piers of
// Miyajimaguchi, where it lies alongside; kendama of Hatsukaichi in place of waves of popcorn, their ball and their
// ken coming apart. The bay runs past fast (scroll.fast): where a wave meets the map counts it in.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fastExtra } from '../../src/game/Parallax.js';
import { SKINS } from '../../src/game/skins.js';

const st = JSON.parse(readFileSync(new URL('../../src/data/stage7.json', import.meta.url)));
const W = st.waves;
const of = (type) => W.filter((w) => w.type === type);
const at = (t, y) => 420 + 30 * (t + fastExtra(st.scroll.fast, t)) - y; // (the strip's u at screen y, at second t: the fast stretch runs the strip ahead of the clock)
// (tools/art/hiroshima/mid.mjs: the bay between the quay and Miyajima; the two ferry piers out from the quay; the
// oyster rafts' first row; the gozabune's own loop is no longer drawn on the map)
const BAY = [2870, 4520];
const PIERS = [[72, 82], [98, 108]];
const PIERS_U = 3010;
const RAFTS_FROM = 3170;
const spots = W.filter((w) => w.type === 'turret').map((w) => [w.x, at(w.t, -10)]);

test('the mix: a line of oysters, the gozabune, 12 kendama; popcorn down to some 45%', () => {
  assert.equal(of('chain').length, 1);
  assert.equal(of('cart').length, 1);
  assert.equal(of('split').length, 12);
  const { chain, split, cart } = SKINS.hiroshima;
  assert.ok(chain && cart && split?.other && split.other.one !== split.one, 'the ball and the ken, two halves');
  const n = {};
  for (const w of W) n[w.type] = (n[w.type] ?? 0) + (w.type === 'chain' ? w.n : w.count ?? 1);
  const small = Object.entries(n).filter(([k]) => !['trap', 'heavy', 'boss'].includes(k)).reduce((a, [k, v]) => a + v * (k === 'split' ? 3 : 1), 0);
  const share = n.popcorn / small;
  assert.ok(share > 0.4 && share < 0.5, `popcorn ${Math.round(share * 100)}%`);
});

test('the line of oysters over the bay by the rafts, its floats clear of the piers and the stands', () => {
  for (const w of of('chain')) {
    const u = at(w.t, -14);
    assert.ok(u > PIERS_U + 20 && u < RAFTS_FROM + 10 && u < BAY[1], `the line at ${w.t} s not out in the bay by the rafts (u ${u})`);
    for (const x of [w.x, w.x2]) {
      assert.ok(u > PIERS_U + 6 || PIERS.every(([a, b]) => x < a - 4 || x > b + 4), `a float on a pier (x ${x})`);
      assert.ok(x >= 2 && x <= 178);
      for (const [sx, su] of spots) assert.ok(Math.hypot(x - sx, u - su) > 14, `a float on a stand at (${sx}, ${su})`);
    }
    assert.ok((w.x2 - w.x) / (w.n + 1) >= 8, 'the oysters on top of each other');
  }
});

test('the gozabune down the bay to the ferry piers, alongside one, never on it', () => {
  const [w] = of('cart');
  const u0 = at(w.t, -20);
  assert.ok(u0 > BAY[0] + 100 && u0 < RAFTS_FROM - 14, `it comes on out in the bay, short of the rafts (u ${u0})`);
  assert.ok(w.stop > BAY[0] + 14 && w.stop < PIERS_U, 'it lies alongside the piers, off the quay');
  for (const [a, b] of PIERS) assert.ok(w.x + 8 < a - 2 || w.x - 8 > b + 2, `its hulls on the pier at x ${a}-${b}`);
});

test('nothing new in the quiet before the crab nor before Sankibō', () => {
  const heavy = of('heavy')[0];
  const boss = of('boss')[0];
  for (const w of [...of('chain'), ...of('cart'), ...of('split')]) {
    const stays = w.type === 'chain' ? 13 : w.type === 'cart' ? 10 : 6;
    // (the crab comes down in some 6 s and goes off after 35 s of its fight, if it is still up)
    assert.ok(w.t + stays <= heavy.t - 1 || w.t >= heavy.t + 41, `${w.type} at ${w.t} s at the crab's fight`);
    assert.ok(w.t < boss.t - 9, `${w.type} at ${w.t} s just before Sankibō`);
  }
});
