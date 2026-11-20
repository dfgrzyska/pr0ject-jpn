// Tokyo's waves (src/data/stage9.json) fit its route (tools/art/tokyo/route.mjs): each set of looks comes on as
// the screen reaches its stretch, the turrets stand on dry ground off the streets, tracks and arenas, the fights
// get a breather before them and power-ups after them, and nothing is left for the mech's terminal. The stronger
// waves (docs/plan-silniejsze-fale.md): washing on lines across the lanes of Nakano and Shinjuku, the three-wheeler
// of Kappabashi down its street and round into Asakusa-dori, nigiri from Tsukiji over the bay to Odaiba.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { W, DISTRICTS, ARENAS, ROADS, RAILS, WATER, GROUNDS, PLOTS } from '../art/tokyo/route.mjs';
import { near, inShape, railHalf } from '../art/tokyo/geom.mjs';
import { ENEMIES } from '../../src/config.js';
import { SKINS } from '../../src/game/skins.js';

const stage = JSON.parse(readFileSync(new URL('../../src/data/stage9.json', import.meta.url)));
const { anchor, mid } = stage.scroll;
const top = (t) => anchor + mid * t; // the strip at the screen's top
const tAt = (u) => (u - anchor) / mid;
const fights = stage.waves.filter((w) => w.hold || w.type === 'boss');
const regular = stage.waves.filter((w) => !w.card);
const of = (type) => stage.waves.filter((w) => w.type === type);
const road = (id) => ROADS.find((r) => r.id === id);
// (how long a rope or a cart keeps the screen busy once it is on)
const stays = (w) => (w.type === 'chain' ? 13 : w.type === 'cart' ? 10 : 0);

test('the waves are in order, of known types, and every row starts on the screen', () => {
  for (let i = 1; i < stage.waves.length; i++) assert.ok(stage.waves[i].t >= stage.waves[i - 1].t, `wave ${i} out of order`);
  for (const w of stage.waves) {
    assert.ok(ENEMIES[w.type], w.type);
    assert.ok(w.x >= 8 && w.x <= W - 8, `wave at ${w.t}: x = ${w.x}`);
    if (w.path !== 'row') continue;
    for (let k = 0; k < w.count; k++) {
      const x = w.x + (k - (w.count - 1) / 2) * (w.spacing ?? 22);
      assert.ok(x >= 8 && x <= W - 8, `row at ${w.t}: x = ${x}`);
    }
  }
});

test('each set of looks comes on as the screen reaches its stretch of the city', () => {
  const start = (id) => DISTRICTS.find((d) => d[2] === id)[0];
  const want = { west: 0, centre: start('shibuya'), akiba: start('akihabara'), asakusa: start('asakusa'), bay: start('bay') };
  for (const [from, id] of stage.sets) if (from > 0) assert.ok(Math.abs(top(from) - want[id]) <= 30, `${id} at ${from} s: the screen's top at ${top(from)}, the stretch at ${want[id]}`);
});

test('the fights come over their arenas, the boss once the strip has stopped', () => {
  const [kasa, taiyaki] = stage.waves.filter((w) => w.hold);
  // (the arena on the screen, in its upper half: room for the player under the fight)
  for (const [w, [, u]] of [[kasa, ARENAS[0]], [taiyaki, ARENAS[1]]]) assert.ok(top(w.t) - u >= 80 && top(w.t) - u <= 190, `${w.look} at ${w.t}: the arena ${top(w.t) - u} px under the screen's top`);
  const boss = stage.waves.find((w) => w.type === 'boss');
  assert.ok(top(boss.t) >= ARENAS[2][1] + 60, 'the mech comes when the terminal is on the screen');
  assert.ok(stage.waves.every((w) => w.t <= boss.t));
});

test('a breather before each fight, power-ups after each miniboss, and no long lull anywhere else', () => {
  for (const f of fights) {
    const before = regular.filter((w) => w.t < f.t && w.t > f.t - 6);
    assert.equal(before.length, 0, `waves in the breather before ${f.t}: ${before.map((w) => w.t)}`);
    // (a turret spawned within 12 s of a fight would still stand on the screen during it)
    assert.ok(!regular.some((w) => w.type === 'turret' && w.t < f.t && w.t > f.t - 12), `a turret near the arena at ${f.t}`);
  }
  for (const f of fights.filter((w) => w.hold)) {
    const after = regular.filter((w) => w.t > f.t && w.t <= f.t + 5);
    assert.ok(after.filter((w) => w.type === 'carrier').length >= 2, `two carriers after ${f.t}`);
  }
  let busy = -Infinity;
  for (let i = 1; i < regular.length; i++) {
    const [a, b] = [regular[i - 1].t, regular[i].t];
    busy = Math.max(busy, a, a + stays(regular[i - 1]));
    const quiet = fights.some((f) => b > f.t && a < f.t);
    if (!quiet) assert.ok(b - busy <= 4, `a lull from ${a} to ${b}`);
  }
});

test('turrets stand on dry ground, off the streets, the tracks and the arenas', () => {
  const water = (x, u) => (WATER.some((w) => !w.late && inShape(w, x, u)) && !GROUNDS.some((g) => g.over && inShape(g, x, u))) || WATER.some((w) => w.late && inShape(w, x, u));
  const turrets = regular.filter((w) => w.type === 'turret');
  assert.ok(turrets.length >= 30, `${turrets.length} turrets`);
  for (const w of turrets) {
    const u = top(w.t) + 10;
    for (const [dx, du] of [[0, 0], [-5, 0], [5, 0], [0, -5], [0, 5]]) {
      const [x, v] = [w.x + dx, u + du];
      assert.ok(!water(x, v), `turret ${w.t} on water`);
      for (const r of ROADS) assert.ok(near(r.pts, x, v).d >= r.w / 2 + 2, `turret ${w.t} on ${r.id}`);
      for (const r of RAILS) assert.ok(near(r.pts, x, v).d >= railHalf(r) + 1, `turret ${w.t} on ${r.id}`);
    }
    for (const [ax, au, name, r] of ARENAS) assert.ok(Math.hypot(w.x - ax, u - au) >= r + 12, `turret ${w.t} in ${name}'s arena`);
  }
  // (no two turrets of a pair on top of each other)
  for (const a of turrets) for (const b of turrets) if (a !== b && Math.abs(a.t - b.t) < 1) assert.ok(Math.abs(a.x - b.x) >= 20, `turrets ${a.t} and ${b.t} too close`);
});

test('the longest city is the busiest: more waves than any other stage, spread over the whole flight', () => {
  for (let n = 1; n <= 8; n++) {
    const other = JSON.parse(readFileSync(new URL(`../../src/data/stage${n}.json`, import.meta.url)));
    assert.ok(regular.length > other.waves.length, `stage ${n}`);
  }
  for (const [from, to, id] of DISTRICTS.slice(0, -1)) {
    const [a, b] = [tAt(from), tAt(to)];
    assert.ok(regular.some((w) => w.t >= a && w.t < b), `nothing over ${id}`);
  }
});

test('the stronger waves: 4 lines of washing, the three-wheeler, 17 nigiri; less popcorn than before', () => {
  assert.equal(of('chain').length, 4);
  assert.equal(of('cart').length, 1);
  assert.equal(of('split').length, 17);
  const { chain, split, cart } = SKINS.tokyo;
  assert.ok(chain?.frames?.length === 3 && cart, 'a T-shirt, socks and a towel in turn; a cart');
  assert.ok(split?.other && split.other.one !== split.one, 'the slice of tuna and its rice, two halves');
  const n = {};
  for (const w of stage.waves) n[w.type] = (n[w.type] ?? 0) + (w.type === 'chain' ? w.n : w.count ?? 1);
  const small = Object.entries(n).filter(([k]) => !['trap', 'heavy', 'boss'].includes(k)).reduce((a, [k, v]) => a + v * (k === 'split' ? 3 : 1), 0);
  // (74% before; the ropes fit only the lanes of the west, the cart one street, the nigiri the waterfront)
  assert.ok(n.popcorn / small < 0.66, `popcorn ${Math.round((n.popcorn / small) * 100)}%`);
});

test('the washing hangs across the lanes of Nakano and Shinjuku, its balconies off the streets, the tracks and the stands', () => {
  const lanes = ROADS.filter((r) => ['lane', 'walk'].includes(r.cls) && r.pts.length === 2 && r.pts[0][0] === r.pts[1][0]);
  const spots = of('turret').map((w) => [w.x, top(w.t) + 10]);
  for (const w of of('chain')) {
    const u = top(w.t) + 14; // (where the rope is put on the map: stripU(-14))
    const d = DISTRICTS.find(([a, b]) => u >= a && u < b)[2];
    assert.ok(['nakano', 'shinjuku'].includes(d), `rope at ${w.t} s over ${d}`);
    const lane = lanes.find((r) => u > r.pts[0][1] + 8 && u < r.pts[1][1] - 8 && w.x < r.pts[0][0] - r.w / 2 - 4 && w.x2 > r.pts[0][0] + r.w / 2 + 4);
    assert.ok(lane, `rope at ${w.t} s across no lane`);
    for (const x of [w.x, w.x2]) {
      assert.ok(x >= 2 && x <= W - 2);
      for (const r of ROADS) assert.ok(near(r.pts, x, u).d >= r.w / 2 + 3, `rope at ${w.t} s: a balcony on ${r.id}`);
      for (const r of RAILS) assert.ok(near(r.pts, x, u).d >= railHalf(r) + 3, `rope at ${w.t} s: a balcony on ${r.id}`);
      for (const [sx, su] of spots) assert.ok(Math.hypot(x - sx, u - su) > 14, `rope at ${w.t} s: a balcony on a stand at (${sx}, ${su})`);
    }
    assert.ok((w.x2 - w.x) / (w.n + 1) >= 8, `rope at ${w.t} s: the washing on top of each other`);
  }
});

test('the three-wheeler down Kappabashi, round into Asakusa-dori, nothing standing on its way', () => {
  const [w] = of('cart');
  const [k, a] = [road('kappabashi'), road('asakusa_dori')];
  assert.equal(w.x, k.pts[0][0], 'on Kappabashi');
  const u0 = top(w.t) + 20; // (where it comes on: stripU(-20))
  assert.ok(u0 > k.pts[0][1] + 20 && u0 < k.pts[1][1], `it comes on down the street (u ${u0})`);
  assert.deepEqual(w.turn, [a.pts[0][1], 1], 'it turns east into the avenue');
  assert.ok(!PLOTS.some(([, px, pu, pw, ph]) => w.x > px - 6 && w.x < px + pw + 6 && u0 > pu && u0 - 20 < pu + ph), 'a landmark on its way');
  for (const t of of('turret').concat(of('trap'))) {
    if (Math.abs(t.t - w.t) > 12) continue;
    const u = top(t.t) + 10;
    assert.ok(Math.abs(u - a.pts[0][1]) > a.w / 2 + 10 || t.x < w.x, `a ${t.type} on the avenue at ${t.t} s`);
    assert.ok(Math.abs(t.x - w.x) > 14 || u > u0 + 10 || u < a.pts[0][1] - 10, `a ${t.type} on Kappabashi at ${t.t} s`);
  }
});

test('the nigiri from Tsukiji over the bay to Odaiba', () => {
  const tsukiji = PLOTS.find((p) => p[0] === 'tsukiji');
  const end = DISTRICTS.find((d) => d[2] === 'odaiba')[0] + 600;
  for (const w of of('split')) {
    const u = top(w.t);
    assert.ok(u > tsukiji[2] - 250 && u < end, `nigiri at ${w.t} s over u ${u}`);
  }
});

test('nothing new in the quiet before the parasol, the taiyaki nor the mech', () => {
  for (const w of [...of('chain'), ...of('cart'), ...of('split')]) {
    for (const f of fights) assert.ok(w.t + Math.max(stays(w), 6) <= f.t - 1 || w.t > f.t, `${w.type} at ${w.t} s at the fight at ${f.t} s`);
  }
});
