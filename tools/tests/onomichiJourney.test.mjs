// Onomichi in the journey (docs/plan-onomichi.md, phase 15): the eleventh city, out of the works, Tokyo still the
// last; its stamp, seal 尾道, ink and place in the ending's parade; its two dishes fall on the way, clear of the fights;
// the cat and the ghost ship in the album and the gachapon; its captions have their English.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { journeyOrder } from '../../src/data/journeyOrder.js';
import { FOODS, YOKAI, yokaiForEnemy } from '../../src/data/discoveries.js';
import { ITEMS } from '../../src/data/gacha.js';
import { KANJI } from '../art/kanji.mjs';
import { isSea } from '../art/onomichi/route.mjs';
import { cities } from './cities.mjs';

const json = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const src = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const STAGES = cities();
const ono = STAGES.find((s) => s.id === 'stage11');
const i18n = src('../../src/i18n.js');
const english = (s) => i18n.includes(`  '${s}': '`) || i18n.includes(`\n  ${s}: '`) || i18n.includes(`  '${s}': "`);

test('Onomichi is the eleventh city of the journey; Tokyo stays the last', () => {
  assert.ok(ono && !ono.wip, 'out of the works');
  assert.match(src('../../src/data/stages.js'), /stage10, stage11\];/);
  assert.equal(STAGES.length, 11);
  const tokyo = STAGES.findIndex((s) => s.id === 'stage9');
  for (let k = 0; k < 20; k++) {
    const order = journeyOrder(STAGES, null, (list) => [...list].sort(() => Math.random() - 0.5));
    assert.equal(order.length, 11);
    assert.ok(order.includes(STAGES.indexOf(ono)));
    assert.equal(order.at(-1), tokyo);
  }
  assert.equal(journeyOrder(STAGES, STAGES.indexOf(ono), (l) => l)[0], STAGES.indexOf(ono));
  assert.match(src('../../src/game/JourneyMenu.js'), /11: 'JEDENAŚCIE'/);
});

test('its stamp, seal, ink and parade', () => {
  const sprites = json('../../public/assets/sprites.json').frames;
  const hi = json('../../public/assets/sprites540.json').frames;
  for (const f of ['stamp_stage11', 'food_onomichiramen', 'food_hassakudaifuku']) assert.ok(sprites[f], f);
  for (const f of ['food_onomichiramen', 'food_hassakudaifuku']) assert.ok(hi[f], `${f} at 540 px`);
  assert.ok(json('../../public/assets/menu.json').frames.seal_stage11);
  for (const k of ['尾', '道']) {
    assert.ok(KANJI[k], k);
    assert.equal(KANJI[k].length, 16, k);
    for (const row of KANJI[k]) assert.equal(row.length, 16, k);
  }
  assert.match(src('../art/logo.mjs'), /stage11: '尾道'/);
  for (const f of ['o_neko_sit_0', 'fy_portrait']) assert.ok(json('../../public/assets/portraits.json').frames[f], f);
  assert.match(src('../../src/game/Stamps.js'), /stage11: 0x[0-9a-f]{6}/);
  assert.match(src('../../src/game/Ending.js'), /stage11: \[\['fy_portrait'/);
  for (const id of ['card_post_stage11', 'paint_city_onomichi', 'card_nekomata', 'card_funayurei']) assert.ok(ITEMS.find((it) => it.id === id), id);
});

test('its dishes fall on land on the way, none by a fight; the cat and the ship go in the album', () => {
  const foods = FOODS.filter((f) => f.stage === 'stage11');
  assert.deepEqual(foods.map((f) => f.id), ['hassakudaifuku', 'onomichiramen']);
  const fights = ono.waves.filter((w) => w.type === 'heavy' || w.type === 'boss').map((w) => w.t);
  for (const f of foods) {
    const t = (f.u + 36 - ono.scroll.anchor) / ono.scroll.mid; // (when it starts to fall)
    assert.ok(t > 3, `${f.id} falls after the start`);
    for (const at of fights) assert.ok(t < at - 10 || t > at + 5, `${f.id} falls at ${t.toFixed(1)} s, by the fight at ${at} s`);
    assert.ok(!isSea(f.x, f.u), `${f.id} over the land`);
  }
  assert.deepEqual(YOKAI.filter((e) => e.stage === 'stage11').map((e) => e.id), ['nekomata', 'funayurei']);
  assert.equal(yokaiForEnemy('stage11', { type: 'heavy', kind: 'nekomata' }).id, 'nekomata');
  assert.equal(yokaiForEnemy('stage11', { type: 'boss' }), null, 'the ship only once beaten');
  assert.equal(yokaiForEnemy('stage11', { type: 'boss' }, true).id, 'funayurei');
});

test('its captions have their English', () => {
  const cards = ono.waves.filter((w) => w.card).flatMap((w) => w.card.slice(1));
  for (const s of [ono.subtitle, ...Object.values(ono.warnings), ...cards, 'KOCI CHÓR', 'TANIEC', 'OGNISTE GARNKI', 'WIR', 'LATARNIA ODSŁONIĘTA!', 'JEDENAŚCIE MIAST. JEDNA PODRÓŻ.'])
    assert.ok(english(s), s);
  assert.match(src('../../src/data/gachaEn.js'), /'BARWY ONOMICHI': 'COLOURS OF ONOMICHI'/);
});
