// Okinawa's stronger waves (docs/plan-silniejsze-fale.md): popcorn down to about 45% of what can be shot down; the surume
// on their ropes by the beach bar, over the paths to the bungalows and the hotel's drive and by the lighthouse keeper's
// house, their posts on land and off the paths; the coconuts; Bise's water-buffalo cart down the lane out of the village
// (clear of the painted cart that plods its lane inside it), its buffalo running off over the coast road and down the
// path to the beach; never in the quiet before the fights.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isWater, ISLETS, MAIN_S, ROAD_U, VILLAGE } from '../art/okinawa/geo.mjs';
import { near } from '../art/tokyo/geom.mjs';
import { chainSplitCart } from '../../src/game/enemies/chainSplitCart.js';
import { SKINS } from '../../src/game/skins.js';

const st = JSON.parse(readFileSync(new URL('../../src/data/stage2.json', import.meta.url)));
const W = st.waves;
const of = (type) => W.filter((w) => w.type === type);
// the ways a post may not stand on, as tools/art/okinawa/sea.mjs lays them: [points, half-width]
const [iu, ix] = ISLETS.find((i) => i[3] === 'l');
const BEACH_PATH = [[10, 830], [26, 870], [16, 906], [40, 944], [70, 980], [88, ROAD_U - 3]];
const WAYS = [
  [[[-4, MAIN_S + 54], [184, MAIN_S + 54]], 1.5], // the promenade behind the sea wall
  [BEACH_PATH, 1.2], // the path up from the beach past the bungalows
  [[[128, 952], [128, ROAD_U - 3]], 3], // the hotel's drive
  [[[-14, ROAD_U + 5], [194, ROAD_U + 5]], 4], // the coast road
  [[[ix - 8, iu + 6 - 7], [ix - 16, iu - 13], [ix - 8, iu - 24], [ix - 1, iu - 42]], 1.3], // the lighthouse's trail to its jetty
];
const onWay = (x, u, pad = 0.5) => WAYS.some(([pts, w]) => near(pts, x, u).d < w + pad);
// what stands there: the beach bar, the bungalows, the keeper's house ([x0, x1, u0, u1])
const BUILT = [[42, 58, MAIN_S + 33, MAIN_S + 44], ...[[8, 840], [28, 852], [8, 900], [50, 896], [26, 930], [60, 960]].map(([x, u]) => [x, x + 14, u + 5, u + 14]), [ix - 24, ix - 8, iu - 20, iu - 10]];
const built = (x, u) => BUILT.some(([x0, x1, u0, u1]) => x >= x0 - 1 && x <= x1 + 1 && u >= u0 - 1 && u <= u1 + 1);

test('the mix: popcorn about 45%, 4-6 ropes of surume, 11-15 coconuts, one buffalo cart', () => {
  const n = (type) => of(type).reduce((s, w) => s + (type === 'chain' ? w.n : w.count ?? 1), 0);
  const all = ['popcorn', 'diver', 'shooter', 'turret', 'carrier', 'ambush', 'chain', 'cart'].reduce((s, t) => s + n(t), 0) + n('split') * 3;
  const share = n('popcorn') / all;
  assert.ok(share > 0.35 && share <= 0.46, `popcorn ${n('popcorn')} of ${all}`);
  assert.ok(of('chain').length >= 4 && of('chain').length <= 6);
  for (const w of of('chain')) assert.ok(w.n >= 4 && w.n <= 7 && w.x2 > w.x && (w.x2 - w.x) / w.n >= 5, `rope at ${w.t} s`);
  assert.ok(n('split') >= 11 && n('split') <= 15);
  assert.equal(of('cart').length, 1);
  const { chain, split, cart } = SKINS.okinawa;
  assert.ok(chain && split && cart?.runner, 'its looks');
});

test('each rope hangs on land, its posts off the paths and the buildings, over a path or along the top of the beach', () => {
  for (const w of of('chain')) {
    const u = 434 + 30 * w.t; // (where the rope is put on the map: stripU(-14))
    for (const x of [w.x, w.x2]) {
      assert.ok(!isWater(x, u), `rope at ${w.t} s: a post in the water at (${x}, ${u})`);
      assert.ok(!onWay(x, u) && !built(x, u), `rope at ${w.t} s: a post on a way or a building at (${x}, ${u})`);
    }
    let over = false;
    for (let k = 1; k < 20; k++) over ||= onWay(w.x + ((w.x2 - w.x) * k) / 20, u, 0);
    const beach = u > MAIN_S + 30 && u < MAIN_S + 46; // (between the palms and the umbrellas, by the bar)
    assert.ok(over || beach, `rope at ${w.t} s over no path (u ${u})`);
  }
});

test('the buffalo cart drives the lane out of Bise to the coast road, clear of the painted cart inside the village', () => {
  const [w] = of('cart');
  assert.equal(w.x, 90);
  for (let s = 0; s < 10.5; s += 0.5) {
    const u = 440 + 30 * w.t - 14 * s; // (down the map, until it is off the screen)
    assert.ok(u > ROAD_U + 9 && u < VILLAGE[0] - 4, `the cart off its lane after ${s} s (u ${u})`);
  }
  // its buffalo, broken free: down the lane to the coast road, over it to where the path to the beach starts, down that
  const [a, b, c] = w.flee;
  assert.deepEqual(a, [90, ROAD_U + 10]);
  assert.deepEqual(b, BEACH_PATH.at(-1));
  assert.deepEqual(c, BEACH_PATH.at(-2));
});

test('the buffalo runs from one point of its way to the next, facing where it goes', () => {
  const r = { x: 90, u: 1250, vx: 0, vu: -40, turn: [[90, 1160], [88, 1147], [70, 980]], setRotation(a) { this.rot = a; } };
  const killed = [];
  const self = { scene: { parallax: { screenY: (u) => 1300 - u }, H: 420 }, runners: { live: [r], kill: (x) => killed.push(x), sweep() {} } };
  const seen = [];
  for (let i = 0; i < 200 && !killed.length; i++) {
    chainSplitCart.runAway.call(self, 1 / 30);
    seen.push([r.x, r.u, r.rot]);
  }
  for (const [x, u] of r.turn ? [] : [[90, 1160], [88, 1147]]) assert.ok(seen.some(([sx, su]) => Math.hypot(sx - x, su - u) < 0.01), `through (${x}, ${u})`);
  assert.ok(Math.abs(seen[0][2]) < 1e-9, 'down the lane, facing down the screen');
  const last = seen.at(-1);
  assert.ok(last[0] < 88 && last[1] < 1147, 'down the path towards the beach');
  assert.ok(Math.abs(Math.hypot(r.vx, r.vu) - 40) < 1e-6, 'at its pace all the way');
});

test('nothing new in the quiet before the manta nor before the shisa', () => {
  const heavy = of('heavy')[0];
  const boss = of('boss')[0];
  for (const w of [...of('chain'), ...of('cart'), ...of('split')]) {
    const stays = w.type === 'chain' ? 13 : w.type === 'cart' ? 10 : 0;
    // (the manta does not hold the scroll: its fight runs on for up to about forty seconds; a coconut there only
    // in place of a wave of popcorn)
    assert.ok(w.t + stays <= heavy.t - 1 || w.t >= heavy.t + 40 || w.type === 'split', `${w.type} at ${w.t} s at the manta's fight`);
    assert.ok(w.t < boss.t - 9, `${w.type} at ${w.t} s just before the shisa`);
  }
});
