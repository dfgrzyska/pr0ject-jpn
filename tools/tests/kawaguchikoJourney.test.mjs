// Kawaguchiko in the journey (docs/plan-kawaguchiko.md, phase 15): the tenth city, out of the works, Tokyo still the
// last; its stamp, seal 富士, ink and place in the ending's parade; its two dishes fall on the way, clear of the fights;
// the hare and the giant in the album and the gachapon; its captions have their English.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { journeyOrder } from '../../src/data/journeyOrder.js';
import { FOODS, YOKAI, yokaiForEnemy } from '../../src/data/discoveries.js';
import { ITEMS } from '../../src/data/gacha.js';
import { KANJI } from '../art/kanji.mjs';
import { cities } from './cities.mjs';

const json = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const src = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const STAGES = cities();
const kawa = STAGES.find((s) => s.id === 'stage10');
const i18n = src('../../src/i18n.js');
const english = (s) => i18n.includes(`  '${s}': '`) || i18n.includes(`\n  ${s}: '`);

test('Kawaguchiko is a city of the journey; Tokyo stays the last', () => {
  assert.ok(kawa && !kawa.wip, 'out of the works');
  assert.match(src('../../src/data/stages.js'), /stage9, stage10[,\]]/);
  const tokyo = STAGES.findIndex((s) => s.id === 'stage9');
  for (let k = 0; k < 20; k++) {
    const order = journeyOrder(STAGES, null, (list) => [...list].sort(() => Math.random() - 0.5));
    assert.equal(order.length, STAGES.length);
    assert.ok(order.includes(STAGES.indexOf(kawa)));
    assert.equal(order.at(-1), tokyo);
  }
  // picked in the menu it goes first, like any city
  assert.equal(journeyOrder(STAGES, STAGES.indexOf(kawa), (l) => l)[0], STAGES.indexOf(kawa));
});

test('its stamp, seal, ink and parade', () => {
  const sprites = json('../../public/assets/sprites.json').frames;
  const hi = json('../../public/assets/sprites540.json').frames;
  for (const f of ['stamp_stage10', 'food_hoto', 'food_yoshidaudon']) assert.ok(sprites[f], f);
  for (const f of ['food_hoto', 'food_yoshidaudon']) assert.ok(hi[f], `${f} at 540 px`);
  assert.ok(json('../../public/assets/menu.json').frames.seal_stage10);
  assert.ok(KANJI['富'] && KANJI['士']);
  for (const k of ['富', '士']) for (const row of KANJI[k]) assert.equal(row.length, 16, k);
  assert.match(src('../art/logo.mjs'), /stage10: '富士'/);
  for (const f of ['k_usagi_rest_0', 'dd_portrait']) assert.ok(json('../../public/assets/portraits.json').frames[f], f);
  assert.match(src('../../src/game/Stamps.js'), /stage10: 0x[0-9a-f]{6}/);
  assert.match(src('../../src/game/Ending.js'), /stage10: \[\['dd_portrait'/);
  for (const id of ['card_post_stage10', 'paint_city_kawaguchiko', 'card_kachikachi', 'card_daidarabotchi']) assert.ok(ITEMS.find((it) => it.id === id), id);
});

test('its dishes fall on the way, none in the quiet before a fight; the hare and the giant go in the album', () => {
  const foods = FOODS.filter((f) => f.stage === 'stage10');
  assert.deepEqual(foods.map((f) => f.id), ['yoshidaudon', 'hoto']);
  const fights = kawa.waves.filter((w) => w.type === 'heavy' || w.type === 'boss').map((w) => w.t);
  for (const f of foods) {
    const t = (f.u + 36 - kawa.scroll.anchor) / kawa.scroll.mid; // (when it starts to fall)
    assert.ok(t > 3, `${f.id} falls after the start`);
    for (const at of fights) assert.ok(t < at - 10 || t > at + 5, `${f.id} falls at ${t.toFixed(1)} s, by the fight at ${at} s`);
  }
  assert.deepEqual(YOKAI.filter((e) => e.stage === 'stage10').map((e) => e.id), ['kachikachi', 'daidarabotchi']);
  assert.equal(yokaiForEnemy('stage10', { type: 'heavy', kind: 'usagi' }).id, 'kachikachi');
  assert.equal(yokaiForEnemy('stage10', { type: 'boss' }), null, 'the giant only once beaten');
  assert.equal(yokaiForEnemy('stage10', { type: 'boss' }, true).id, 'daidarabotchi');
});

test('its captions have their English', () => {
  const cards = kawa.waves.filter((w) => w.card).flatMap((w) => w.card.slice(1));
  for (const s of [kawa.subtitle, ...Object.values(kawa.warnings), ...cards, 'KAWAGUCHIKO O ZMIERZCHU', 'KOSZ NA DRĄGU', 'ZACHÓD SŁOŃCA', 'SZCZELINA ODSŁONIĘTA!', 'ŁODZIE Z BŁOTA', 'WIOSŁO'])
    assert.ok(english(s), s);
  assert.match(src('../../src/data/gachaEn.js'), /'BARWY KAWAGUCHIKO': 'COLOURS OF KAWAGUCHIKO'/);
});
