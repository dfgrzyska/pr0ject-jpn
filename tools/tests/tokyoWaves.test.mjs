// Tokyo's waves (src/data/stage9.json) fit its route (tools/art/tokyo/route.mjs): each set of looks comes on as
// the screen reaches its stretch, the turrets stand on dry ground off the streets, tracks and arenas, the fights
// get a breather before them and power-ups after them, and nothing is left for the mech's terminal.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { W, DISTRICTS, ARENAS, ROADS, RAILS, WATER, GROUNDS } from '../art/tokyo/route.mjs';
import { near, inShape, railHalf } from '../art/tokyo/geom.mjs';
import { ENEMIES } from '../../src/config.js';

const stage = JSON.parse(readFileSync(new URL('../../src/data/stage9.json', import.meta.url)));
const { anchor, mid } = stage.scroll;
const top = (t) => anchor + mid * t; // the strip at the screen's top
const tAt = (u) => (u - anchor) / mid;
const fights = stage.waves.filter((w) => w.hold || w.type === 'boss');
const regular = stage.waves.filter((w) => !w.card);

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
  const times = regular.map((w) => w.t);
  for (let i = 1; i < times.length; i++) {
    const quiet = fights.some((f) => times[i] > f.t && times[i - 1] < f.t);
    if (!quiet) assert.ok(times[i] - times[i - 1] <= 4, `a lull from ${times[i - 1]} to ${times[i]}`);
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
