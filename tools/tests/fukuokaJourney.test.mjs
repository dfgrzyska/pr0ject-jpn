// Fukuoka in the journey (docs/plan-fukuoka.md, phase 16): the twelfth city, out of the works, Tokyo still the last;
// its stamp, seal 福岡, ink and place in the ending's parade; its two dishes fall on the way over the land, clear of
// the fights; the stall and the wall in the album and the gachapon; its captions have their English.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { journeyOrder } from '../../src/data/journeyOrder.js';
import { FOODS, YOKAI, yokaiForEnemy } from '../../src/data/discoveries.js';
import { ITEMS } from '../../src/data/gacha.js';
import { KANJI } from '../art/kanji.mjs';
import { isSea } from '../art/fukuoka/route.mjs';
import { cities } from './cities.mjs';

const json = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const src = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const STAGES = cities();
const fuk = STAGES.find((s) => s.id === 'stage12');
const i18n = src('../../src/i18n.js');
const english = (s) => i18n.includes(`  '${s}': '`) || i18n.includes(`\n  ${s}: '`) || i18n.includes(`  '${s}': "`);

test('Fukuoka is the twelfth city of the journey; Tokyo stays the last', () => {
  assert.ok(fuk && !fuk.wip, 'out of the works');
  assert.match(src('../../src/data/stages.js'), /stage11, stage12\];/);
  assert.equal(STAGES.length, 12);
  const tokyo = STAGES.findIndex((s) => s.id === 'stage9');
  for (let k = 0; k < 20; k++) {
    const order = journeyOrder(STAGES, null, (list) => [...list].sort(() => Math.random() - 0.5));
    assert.equal(order.length, 12);
    assert.ok(order.includes(STAGES.indexOf(fuk)));
    assert.equal(order.at(-1), tokyo);
  }
  assert.equal(journeyOrder(STAGES, STAGES.indexOf(fuk), (l) => l)[0], STAGES.indexOf(fuk));
  assert.match(src('../../src/game/JourneyMenu.js'), /12: 'DWANAŚCIE'/);
});

test('its stamp, seal, ink and parade', () => {
  const sprites = json('../../public/assets/sprites.json').frames;
  const hi = json('../../public/assets/sprites540.json').frames;
  for (const f of ['stamp_stage12', 'food_umegaemochi', 'food_hitokuchigyoza']) assert.ok(sprites[f], f);
  for (const f of ['food_umegaemochi', 'food_hitokuchigyoza']) assert.ok(hi[f], `${f} at 540 px`);
  assert.ok(json('../../public/assets/menu.json').frames.seal_stage12);
  for (const k of ['福', '岡']) {
    assert.ok(KANJI[k], k);
    assert.equal(KANJI[k].length, 16, k);
    for (const row of KANJI[k]) assert.equal(row.length, 16, k);
  }
  assert.match(src('../art/logo.mjs'), /stage12: '福岡'/);
  for (const f of ['yt_idle_0', 'nu_portrait']) assert.ok(json('../../public/assets/portraits.json').frames[f], f);
  assert.match(src('../../src/game/Stamps.js'), /stage12: 0x[0-9a-f]{6}/);
  assert.match(src('../../src/game/Ending.js'), /stage12: \[\['nu_portrait'/);
  for (const id of ['card_post_stage12', 'paint_city_fukuoka', 'card_yatai', 'card_nurikabe']) assert.ok(ITEMS.find((it) => it.id === id), id);
});

test('its dishes fall on land on the way, none by a fight; the stall and the wall go in the album', () => {
  const foods = FOODS.filter((f) => f.stage === 'stage12');
  assert.deepEqual(foods.map((f) => f.id), ['hitokuchigyoza', 'umegaemochi']);
  const fights = fuk.waves.filter((w) => w.type === 'heavy' || w.type === 'boss').map((w) => w.t);
  for (const f of foods) {
    const t = (f.u + 36 - fuk.scroll.anchor) / fuk.scroll.mid; // (when it starts to fall)
    assert.ok(t > 3, `${f.id} falls after the start`);
    for (const at of fights) assert.ok(t < at - 10 || t > at + 5, `${f.id} falls at ${t.toFixed(1)} s, by the fight at ${at} s`);
    assert.ok(!isSea(f.x, f.u), `${f.id} over the land`);
  }
  assert.deepEqual(YOKAI.filter((e) => e.stage === 'stage12').map((e) => e.id), ['yatai', 'nurikabe']);
  assert.equal(yokaiForEnemy('stage12', { type: 'heavy', kind: 'yatai' }).id, 'yatai');
  assert.equal(yokaiForEnemy('stage12', { type: 'boss' }), null, 'the wall only once beaten');
  assert.equal(yokaiForEnemy('stage12', { type: 'boss' }, true).id, 'nurikabe');
});

test('its captions have their English', () => {
  const cards = fuk.waves.filter((w) => w.card).flatMap((w) => w.card.slice(1));
  for (const s of [fuk.subtitle, ...Object.values(fuk.warnings), ...cards, 'SHIME: ZAMYKANIE', 'ZAMKNIĘTE', 'ZAUŁEK', 'NOC', 'DWANAŚCIE MIAST. JEDNA PODRÓŻ.'])
    assert.ok(english(s), s);
  assert.match(src('../../src/data/gachaEn.js'), /'BARWY FUKUOKI': 'COLOURS OF FUKUOKA'/);
});
