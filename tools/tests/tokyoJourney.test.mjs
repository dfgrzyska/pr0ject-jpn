// Tokyo in the journey (docs/plan-tokyo.md, phase 16): the ninth city, always the last one, with its stamp (and the
// English one), its seal, its ink, a place in the ending's parade; its dishes fall on the way, clear of the fights;
// its captions have their English.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { journeyOrder } from '../../src/data/journeyOrder.js';
import { FOODS, YOKAI } from '../../src/data/discoveries.js';
import { ITEMS } from '../../src/data/gacha.js';
import { cities } from './cities.mjs';

const json = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const src = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
// (stages.js and i18n.js need the browser: their files are read here)
const STAGES = cities();
const tokyo = STAGES.find((s) => s.id === 'stage9');
const i18n = src('../../src/i18n.js');
const english = (s) => i18n.includes(`  '${s}': '`) || i18n.includes(`\n  ${s}: '`); // (a phrase in the phrasebook)

test('Tokyo is a city of the journey and always its last', () => {
  assert.match(src('../../src/data/stages.js'), /export const STAGES = \[stage1, stage2, stage3, stage4, stage5, stage6, stage7, stage8, stage9, stage10, stage11\];/);
  assert.ok(tokyo.last && !tokyo.wip, 'Tokyo marked last, out of the works');
  for (let k = 0; k < 20; k++) {
    const order = journeyOrder(STAGES, null, (list) => [...list].sort(() => Math.random() - 0.5));
    assert.equal(order.length, STAGES.length);
    assert.equal(order.at(-1), STAGES.indexOf(tokyo));
  }
});

test('its stamp, seal, ink and parade', () => {
  const sprites = json('../../public/assets/sprites.json').frames;
  for (const f of ['stamp_stage9', 'stamp_stage9_en', 'food_crepe', 'food_melonpan', 'food_ningyoyaki', 'food_monjayaki']) assert.ok(sprites[f], f);
  assert.ok(json('../../public/assets/menu.json').frames.seal_stage9);
  for (const f of ['ko_portrait', 'ty_big_0_0', 'kg_portrait', 't_komainu_0']) assert.ok(json('../../public/assets/portraits.json').frames[f], f);
  assert.match(src('../../src/game/Stamps.js'), /stage9: 0x[0-9a-f]{6}/);
  assert.match(src('../../src/game/Ending.js'), /stage9: \[\['kg_portrait'/);
  assert.ok(ITEMS.find((it) => it.id === 'card_post_stage9'));
  assert.ok(ITEMS.find((it) => it.id === 'paint_city_tokyo'));
});

test('its dishes fall on the way, none in the quiet before a fight', () => {
  const foods = FOODS.filter((f) => f.stage === 'stage9');
  assert.equal(foods.length, 4);
  const fights = tokyo.waves.filter((w) => w.type === 'heavy' || w.type === 'boss').map((w) => w.t);
  for (const f of foods) {
    const t = (f.u + 36 - tokyo.scroll.anchor) / tokyo.scroll.mid; // (when it starts to fall)
    for (const at of fights) assert.ok(t < at - 10 || t > at + 5, `${f.id} falls at ${t.toFixed(1)} s, by the fight at ${at} s`);
  }
  assert.deepEqual(YOKAI.filter((e) => e.stage === 'stage9').map((e) => e.id), ['kasaobake', 'taiyakifish', 'komainu', 'kurogane']);
});

test('its captions have their English', () => {
  const cards = tokyo.waves.filter((w) => w.card).flatMap((w) => w.card.slice(1));
  for (const s of [tokyo.name, tokyo.subtitle, ...Object.values(tokyo.warnings), ...cards, 'ULEWA', 'NADZIENIA', 'PRZEMIANA', 'DRONY-LAMPIONY!', 'PIERŚ OTWARTA!', 'RDZEŃ ODSŁONIĘTY!', 'DZIEWIĘĆ MIAST. JEDNA PODRÓŻ.'])
    assert.ok(english(s), s);
});
