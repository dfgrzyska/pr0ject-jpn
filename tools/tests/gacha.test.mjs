import { readFileSync } from 'node:fs';
// Run: node --test tools/tests/gacha.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEM, ITEMS, PITY, RARITIES, RARITY, TICKETS, LOOKS, SHOT_FRAMES } from '../../src/data/gacha.js';
import { gachaEn, KEEP, PHRASES, LINES } from '../../src/data/gachaEn.js';
import { fxTint, hue } from '../../src/game/premiumFx.js';
import { seen } from '../../src/game/Loadout.js';
import { buildShip, equip, grant, layout, loadState, newState, pool, pull, saveState, setHull, usePreset, wear, wearNow } from '../../src/game/Loadout.js';

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
    assert.ok(it.name.length <= 24 && it.info.length <= 26, `${it.id}: its name and line fit the screen`);
    if (it.kind === 'hull') for (const id of Object.values(it.fixed ?? {})) assert.ok(ITEM[id], `${it.id}: built-in ${id} exists`);
  }
  assert.ok(ITEMS.length <= 800, 'the machine holds 800 at most');
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
  assert.deepEqual(s.slots, { engine: ['engine_standard'], gun: [null], bomb: ['bomb_cranes'], core: ['core_ofuda'], omamori: [null] });
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
  assert.deepEqual(s.slots.gun, [null, 'gun_power_ur'], '...replaces the lower one, never joins it; the first slot stays empty');
  assert.ok(equip(s, 'gun', 0, 'gun_focus'));
  assert.ok(equip(s, 'gun', 0, null));
  assert.deepEqual(s.slots.gun, [null, 'gun_power_ur'], 'a part stays in its slot when another comes out');
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
  assert.deepEqual(fixed.slots.gun, [null]);
  storage.setItem('shmupjp.gacha', 'not json');
  assert.equal(loadState(storage).tickets, TICKETS.first);
});

test('looks are worn one of a kind, and only owned ones', () => {
  const s = newState();
  assert.deepEqual(s.look, Object.fromEntries(LOOKS.map((k) => [k, null])));
  assert.equal(wear(s, 'paint', 'paint_urushi'), false, 'not owned');
  s.owned.push('paint_urushi', 'flame_lava', 'dye_blue');
  assert.equal(wear(s, 'paint', 'flame_lava'), false, 'a flame is no paint');
  assert.ok(wear(s, 'paint', 'paint_urushi'));
  assert.ok(wear(s, 'flame', 'flame_lava'));
  assert.ok(wear(s, 'dye', 'dye_blue'));
  const ship = buildShip(s);
  assert.deepEqual(ship.look, { paint: ITEM.paint_urushi.colors, flame: ITEM.flame_lava.flame, dye: ITEM.dye_blue.tint, wake: null, shots: {}, marker: null, ebColor: null, ebShape: null, blast: null, bombLook: null, title: null, sound: null, graze: null, hud: null, pal: null, shield: null, decals: null, paintFx: null, aura: null, trail: null, entry: null, victory: null, death: null, palMove: null, shotMove: {}, seal: null, shieldShape: null, pod: null });
  s.owned.push('decal_sym_star');
  assert.ok(wear(s, 'decal_nose', 'decal_sym_star') && wear(s, 'decal_tail', 'decal_sym_star'), 'a sticker goes in any of the four places');
  assert.deepEqual(buildShip(s).look.decals, ['decal_sym_star', null, null, 'decal_sym_star']);
  s.owned.push('shot_laser_dragon', 'shot_basic_kunai');
  assert.ok(wear(s, 'shot_laser', 'shot_laser_dragon'));
  assert.equal(wear(s, 'shot_laser', 'shot_basic_kunai'), false, 'a skin goes on its own weapon');
  assert.deepEqual(buildShip(s).look.shots, { ps_laser_1: 'ps_laser_1_dragon', ps_laser_2: 'ps_laser_2_dragon', ps_laser_3: 'ps_laser_3_dragon' });
  // every skin in the catalogue is drawn
  const drawn = new Set(Object.keys(JSON.parse(readFileSync(new URL('../../public/assets/gacha.json', import.meta.url))).frames));
  for (const it of ITEMS.filter((i) => i.skin)) for (const f of SHOT_FRAMES[it.kind]) assert.ok(drawn.has(`${f}_${it.skin}`), `${f}_${it.skin} is in the gacha atlas`);
  for (const it of ITEMS.filter((i) => i.pic)) assert.ok(drawn.has(it.pic), `${it.pic} is in the gacha atlas`);
  for (const it of ITEMS.filter((i) => i.shape)) for (const n of ['eb_s', 'eb_m']) for (const k of ['', '_0', '_7', '_f0', '_f2']) assert.ok(drawn.has(`${n}${k}_${it.shape}`), `${n}${k}_${it.shape} is in the gacha atlas`);
  s.owned.push('eb_color_cyan', 'eb_shape_star', 'marker_eye');
  assert.ok(wear(s, 'eb_color', 'eb_color_cyan') && wear(s, 'eb_shape', 'eb_shape_star') && wear(s, 'marker', 'marker_eye'));
  const worn = buildShip(s).look;
  assert.deepEqual([worn.ebColor, worn.ebShape, worn.marker], [ITEM.eb_color_cyan.body, 'star', 'hitbox_eye']);
  assert.equal(ship.damage, buildShip(newState()).damage, 'looks change no numbers');
  assert.ok(wear(s, 'paint', null));
  assert.equal(buildShip(s).look.paint, null);
  for (const it of ITEMS.filter((i) => i.kind === 'paint')) assert.equal(it.colors.length, 4, `${it.id} has four colours`);
});

test('every name and line of the catalogue has its English', () => {
  const polish = /[ĄĆĘŁŃÓŚŹŻ]/;
  for (const it of ITEMS) {
    const base = it.name.replace(/ (N|R|SR|SSR|UR)$/, '');
    const which = base.includes(': ') ? base.slice(base.indexOf(': ') + 2) : base;
    assert.ok(KEEP.has(which) || PHRASES[which], `${it.id}: "${which}" is in the phrasebook`);
    const name = gachaEn(it.name);
    assert.ok(!polish.test(name) && name.length <= 26, `${it.id}: "${name}" is English and fits`);
    const info = gachaEn(it.info);
    assert.ok(LINES[it.info.replace(/[+-]?\d+(?:[.,]\d+)?/g, '#')] || info !== it.info, `${it.id}: its line "${it.info}" is translated`);
    assert.ok(!polish.test(info) && info.length <= 28 && !info.includes('#'), `${it.id}: "${info}" is English and fits`);
  }
  assert.equal(gachaEn('SIŁA OGNIA SR'), 'FIREPOWER SR');
  assert.equal(gachaEn('+12% OBRAŻEŃ'), '+12% DAMAGE');
  assert.equal(gachaEn('AURA: TĘCZA'), 'AURA: RAINBOW');
});

test('an animated paint job flows through its colours', () => {
  const anim = { tints: [0xff0000, 0x0000ff], speed: 1 };
  assert.equal(fxTint(anim, 0), 0xff0000);
  assert.equal(fxTint(anim, 1), 0x0000ff);
  assert.equal(fxTint(anim, 0.5), 0x800080);
  assert.equal(fxTint({ ...anim, step: true }, 0.5), 0xff0000);
  assert.equal(hue(0), 0xff0000);
  assert.equal(hue(1 / 3), 0x00ff00);
  assert.equal(hue(0, 0), 0xffffff);
  for (const it of ITEMS.filter((i) => i.kind === 'paint_fx')) assert.ok(fxTint(it.anim, 1.234) >= 0, it.id);
});

test('three sets to switch between, each kept as it was left', () => {
  const s = newState('kitsune');
  s.owned.push('paint_urushi', 'hull_oni');
  wear(s, 'paint', 'paint_urushi');
  const first = structuredClone({ hull: s.hull, slots: s.slots, look: s.look });
  assert.equal(usePreset(s, 0), false, 'it is the fitted one');
  assert.ok(usePreset(s, 1));
  assert.deepEqual({ hull: s.hull, slots: s.slots, look: s.look }, first, 'a new set starts as a copy');
  wear(s, 'paint', null);
  setHull(s, 'hull_oni');
  assert.ok(usePreset(s, 0));
  assert.deepEqual({ hull: s.hull, slots: s.slots, look: s.look }, first, 'the first set is as it was left');
  assert.ok(usePreset(s, 1));
  assert.equal(s.hull, 'hull_oni');
  assert.equal(s.look.paint, null);
  // (the sets survive a save)
  const m = memory();
  saveState(m, s);
  const back = loadState(m);
  assert.equal(back.preset, 1);
  assert.equal(back.presets[0].look.paint, 'paint_urushi');
});

test('a prize is put on at once', () => {
  const s = newState('kitsune');
  assert.equal(wearNow(s, 'paint_urushi'), false, 'not the player\'s');
  s.owned.push('paint_urushi', 'decal_sym_star', 'decal_sym_hinomaru', 'card_kyubi', 'hull_oni');
  assert.ok(wearNow(s, 'paint_urushi'));
  assert.equal(s.look.paint, 'paint_urushi');
  assert.ok(wearNow(s, 'decal_sym_star'));
  assert.ok(wearNow(s, 'decal_sym_hinomaru'));
  assert.deepEqual([s.look.decal_nose, s.look.decal_lwing], ['decal_sym_star', 'decal_sym_hinomaru'], 'stickers take the free places in turn');
  assert.equal(wearNow(s, 'card_kyubi'), false, 'a card is not worn');
  assert.ok(wearNow(s, 'hull_oni'));
  assert.equal(s.hull, 'hull_oni');
});

test('what comes out of the machine is new until it is looked at', () => {
  const s = newState('kitsune');
  grant(s, 5);
  const it = pull(s, seeded(3));
  assert.deepEqual(s.fresh, it.kind === 'card' ? [] : [it.id]);
  if (it.kind !== 'card') {
    assert.ok(seen(s, it.id));
    assert.equal(seen(s, it.id), false);
  }
  assert.deepEqual(s.fresh, []);
  // (a save keeps it; what is not the player's is dropped)
  s.fresh.push('paint_urushi');
  const m = memory();
  saveState(m, s);
  assert.deepEqual(loadState(m).fresh, []);
});

test('a save from before a paint job was renamed keeps it', () => {
  const s = newState('kitsune');
  s.owned.push('paint_famicom');
  s.look.paint = 'paint_famicom';
  const m = memory();
  saveState(m, s);
  const back = loadState(m);
  assert.ok(back.owned.includes('paint_8bit'));
  assert.equal(back.look.paint, 'paint_8bit');
});
