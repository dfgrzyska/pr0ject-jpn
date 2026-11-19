// The bonus for a whole wave (docs/plan-fukuoka.md, 5.2; src/game/Waves.js): the small fry of one wave share a tally
// - one entry's count, or entries of one type close together - which their last one down pays out; a lone enemy,
// a trap, an ambush or a fight forms no wave.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Waves, PACKED } from '../../src/game/Waves.js';
import { FEEL } from '../../src/config.js';

const spawned = (list, until = 999) => {
  const w = new Waves(list);
  const out = [];
  w.update(until, (q) => out.push(q));
  return out;
};

test('one entry of several is one wave, sharing one tally', () => {
  const out = spawned([{ t: 1, type: 'popcorn', x: 40, path: 'sine', count: 5 }]);
  assert.equal(out.length, 5);
  assert.ok(out.every((q) => q.pack === out[0].pack));
  assert.equal(out[0].pack.n, 5);
});

test('entries of one type within a second of each other are one wave; later or other types are not', () => {
  const out = spawned([
    { t: 20.5, type: 'shooter', x: 54 },
    { t: 21.1, type: 'shooter', x: 126 },
    { t: 21.1, type: 'diver', x: 90, count: 2 },
    { t: 23, type: 'shooter', x: 90 },
  ]);
  const sh = out.filter((q) => q.type === 'shooter');
  assert.equal(sh[0].pack, sh[1].pack);
  assert.equal(sh[0].pack.n, 2);
  assert.equal(sh[2].pack, null, 'a lone shooter later is no wave');
  const dv = out.filter((q) => q.type === 'diver');
  assert.notEqual(dv[0].pack, sh[0].pack);
  assert.equal(dv[0].pack.n, 2);
});

test('traps, ambushes and fights form no wave', () => {
  const out = spawned([
    { t: 4, type: 'trap', x: 80 },
    { t: 4.2, type: 'trap', x: 120 },
    { t: 11, type: 'ambush', x: 140 },
    { t: 30, type: 'heavy', x: 90, card: ['A', 'B'] },
  ]);
  assert.ok(out.every((q) => !q.pack));
  for (const t of ['trap', 'ambush', 'heavy', 'boss']) assert.ok(!PACKED.has(t));
});

test('a run of whole waves pays more each time, up to its cap', () => {
  assert.ok(FEEL.streakStep > 0 && FEEL.streakMax >= 2);
  assert.ok(FEEL.flockEach >= FEEL.waveEach);
  for (const t of FEEL.heavyKill) assert.ok(FEEL.ownBullets.has(t), `${t} goes down hard and turns its bullets to points`);
});
