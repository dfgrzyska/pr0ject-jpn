// Run: node --test tools/tests/gacha.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEM, ITEMS, PITY, RARITIES, RARITY, TICKETS } from '../../src/data/gacha.js';
import { buildShip, equip, grant, layout, loadState, newState, pool, pull, saveState, setHull } from '../../src/game/Loadout.js';

const memory = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
};
/** A repeatable random source. */
const seeded = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);

test('the catalogue is sound', () => {
  assert.equal(new Set(ITEMS.map((it) => it.id)).size, ITEMS.length, 'ids are unique');
  assert.ok(Math.abs(RARITIES.reduce((s, r) => s + RARITY[r].rate, 0) - 1) < 1e-9, 'the odds add up to 1');
  for (const it of ITEMS) {
    assert.ok(it.starter || RARITY[it.rarity], `${it.id} has a rarity`);
    assert.ok(it.name && it.info, `${it.id} has a name and a line about it`);
    if (it.kind === 'hull') for (const id of Object.values(it.fixed ?? {})) assert.ok(ITEM[id], `${it.id}: built-in ${id} exists`);
  }
  assert.ok(ITEMS.length <= 500, 'the machine holds 500 at most');
});

test('the three old ships come out of their parts as they were', () => {
  // (the numbers the three selectable ships had in config.js before the gachapon)
  const old = {
    oni: { name: 'ONI', frame: 'ship_oni', speed: 78, touchGain: 1.0, dragSpeed: 240, damage: 1.25, lives: 3, hit: 1.7, graze: 7, pickup: 11, perBomb: 40, spread: 0.75, rage: 0.2, ram: true, bomb: { kind: 'shock', damage: 75, invulnerable: 2.2, clear: 0.5 }, perk: 'GNIEW SZTURMOWY', stats: [1, 3] },
    kitsune: { name: 'TSURU', frame: 'ship', speed: 112, touchGain: 1.15, dragSpeed: 650, damage: 1.05, lives: 3, hit: 1.4, graze: 8, pickup: 11, perBomb: 32, ofuda: true, bomb: { kind: 'cranes', damage: 45, invulnerable: 2.2, clear: 1.0 }, perk: 'TALIZMANY OFUDA', stats: [2, 2] },
    tsubame: { name: 'TSUBAME', frame: 'ship_tsubame', speed: 150, touchGain: 1.35, dragSpeed: 1400, damage: 0.95, lives: 3, hit: 1.1, graze: 11, pickup: 16, perBomb: 20, momentum: true, bomb: { kind: 'cut', damage: 25, invulnerable: 1.2, clear: 0.6 }, perk: 'PĘD JASKÓŁKI', stats: [3, 1] },
  };
  for (const [id, want] of Object.entries(old)) {
    const ship = buildShip(newState(id));
    assert.equal(ship.id, id);
    for (const k of ['spread', 'rage', 'ram', 'ofuda', 'momentum', ...Object.keys(want)]) assert.deepEqual(ship[k], want[k], `${id}.${k}`);
  }
});

test('a new player has the starter kit and the first tickets', () => {
  const s = newState();
  assert.equal(s.tickets, TICKETS.first);
  assert.equal(s.hull, 'hull_tsuru');
  assert.deepEqual(s.slots, { engine: ['engine_standard'], gun: [], bomb: ['bomb_cranes'], core: ['core_ofuda'], omamori: [] });
  assert.equal(pool(s).length, ITEMS.filter((it) => !it.starter).length);
});

test('the machine empties without repeats, and tickets are spent', () => {
  const s = newState();
  const all = pool(s).length;
  grant(s, all);
  const got = [];
  const rnd = seeded(7);
  for (let it; (it = pull(s, rnd)); ) got.push(it.id);
  assert.equal(got.length, all);
  assert.equal(new Set(got).size, all, 'no capsule twice');
  assert.equal(pool(s).length, 0);
  assert.equal(s.tickets, TICKETS.first, 'an empty machine takes no ticket');
  s.tickets = 0;
  assert.equal(pull(newState(), () => 0)?.rarity, 'N', 'the lowest roll is a plain capsule');
  assert.equal(pull(s), null);
});

test('rarer capsules tend to come out later', () => {
  const order = Object.fromEntries(RARITIES.map((r) => [r, []]));
  for (let seed = 1; seed <= 200; seed++) {
    const s = newState();
    grant(s, 999);
    const rnd = seeded(seed);
    for (let i = 0, it; (it = pull(s, rnd)); i++) order[it.rarity].push(i);
  }
  const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  assert.ok(mean(order.N) < mean(order.SR), 'plain before super rare');
  assert.ok(mean(order.R) < mean(order.UR), 'rare before legendary');
});

test('the guarantee: never ten capsules in a row below SR while better ones are left', () => {
  const from = RARITIES.indexOf(PITY.min);
  const s = newState();
  grant(s, 999);
  let dry = 0;
  const rnd = () => 0; // the worst luck there is
  for (let it; (it = pull(s, rnd)); ) {
    const good = RARITIES.indexOf(it.rarity) >= from;
    dry = good ? 0 : dry + 1;
    if (pool(s).some((q) => RARITIES.indexOf(q.rarity) >= from)) assert.ok(dry < PITY.every, `${dry} plain capsules in a row`);
  }
});

test('parts go only where the hull has a slot', () => {
  const s = newState();
  s.owned.push('gun_power_n', 'gun_power_ur', 'gun_focus', 'hull_oni', 'hull_tsubame', 'engine_swallow', 'oma_small', 'oma_graze', 'bomb_shock');
  assert.equal(equip(s, 'gun', 0, 'engine_swallow'), false, 'an engine is no gun');
  assert.equal(equip(s, 'gun', 1, 'gun_focus'), false, 'Tsuru has one gun slot');
  assert.equal(equip(s, 'gun', 0, 'core_rage'), false, 'not owned');
  assert.ok(equip(s, 'gun', 0, 'gun_power_n'));
  assert.ok(Math.abs(buildShip(s).damage - 1.05 * 1.04) < 1e-9);
  assert.ok(equip(s, 'engine', 0, null), 'the engine can be taken out...');
  assert.deepEqual(s.slots.engine, ['engine_standard'], '...but the standard one goes in');

  // Oni: two guns, the heavy engine built in
  assert.ok(setHull(s, 'hull_oni'));
  assert.deepEqual(layout(s), ITEM.hull_oni.slots);
  assert.deepEqual(s.slots.engine, [], 'the fitted engine came off');
  assert.equal(buildShip(s).speed, 78);
  assert.ok(equip(s, 'gun', 1, 'gun_focus'));
  assert.ok(equip(s, 'gun', 1, 'gun_power_ur'), 'the same upgrade in a higher rarity...');
  assert.deepEqual(s.slots.gun, ['gun_power_ur'], '...replaces the lower one, never joins it');
  assert.ok(equip(s, 'bomb', 0, 'bomb_shock'));

  // Tsubame: two omamori, the light bomb built in
  assert.ok(setHull(s, 'hull_tsubame'));
  assert.deepEqual(s.slots.bomb, []);
  assert.equal(buildShip(s).bomb.kind, 'cut');
  assert.ok(equip(s, 'omamori', 0, 'oma_small'));
  assert.ok(equip(s, 'omamori', 1, 'oma_graze'));
  const ship = buildShip(s);
  assert.ok(Math.abs(ship.hit - 0.9) < 1e-9);
  assert.equal(ship.graze, 13);
  assert.equal(ITEM.bomb_cut.fx.set.bomb.damage, 25, 'building a ship leaves the catalogue alone');
});

test('the save comes back as it was, and a broken one starts afresh', () => {
  const storage = memory();
  const s = loadState(storage, 'oni');
  assert.equal(s.hull, 'hull_oni', 'the old favourite ship is carried over');
  grant(s, 2);
  const it = pull(s, seeded(3));
  saveState(storage, s);
  const back = loadState(storage, 'tsubame');
  assert.deepEqual(back, s);
  assert.ok(back.owned.includes(it.id));
  storage.setItem('shmupjp.gacha', '{"v":1,"owned":["nope","hull_tsuru"],"hull":"hull_gone","tickets":4,"pulls":0,"dry":0,"slots":{"gun":["nope"]}}');
  const fixed = loadState(storage);
  assert.equal(fixed.hull, 'hull_tsuru');
  assert.equal(fixed.tickets, 4);
  assert.deepEqual(fixed.slots.gun, []);
  storage.setItem('shmupjp.gacha', 'not json');
  assert.equal(loadState(storage).tickets, TICKETS.first);
});
