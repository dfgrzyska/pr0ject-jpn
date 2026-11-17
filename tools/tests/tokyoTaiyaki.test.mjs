// Taiyaki (src/game/enemies/tokyo-taiyaki.js) finds every frame it asks for in Tokyo's atlas (tools/art/tokyo/taiyaki.mjs),
// and the stage file sends it in over Sensō-ji's court with its card.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const json = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const frames = json('../../public/assets/bg/stage9/enemies.json').frames;
const src = readFileSync(new URL('../../src/game/enemies/tokyo-taiyaki.js', import.meta.url), 'utf8');

test('every frame of the mould and its fish is in the atlas', () => {
  const want = new Set(src.match(/'ty_[a-z_0-9]+'/g).map((s) => s.slice(1, -1)).filter((n) => !n.endsWith('_'))); // (prefixes are filled in below)
  for (const st of ['shut', 'crack', 'half', 'open']) want.add(`ty_kata_${st}`).add(`ty_heat_${st}`);
  for (let f = 0; f < 4; f++) {
    want.add(`ty_fish_${f}`);
    for (const fl of ['a', 'k', 'm']) for (let b = 1; b <= 3; b++) want.add(`ty_fish_${fl}${b}_${f}`);
  }
  for (let w = 0; w < 3; w++) {
    want.add(`ty_charge_${w}`);
    for (let f = 0; f < 4; f++) want.add(`ty_big_${w}_${f}`);
    for (let f = 0; f < 2; f++) want.add(`ty_tired_${w}_${f}`);
  }
  for (const f of want) assert.ok(frames[f], f);
});

test('it comes in over the temple court, holding the city, with its card', () => {
  const stage = json('../../src/data/stage9.json');
  const w = stage.waves.find((v) => v.look === 'taiyaki');
  assert.ok(w && w.type === 'heavy' && w.hold && w.card[0] === 'TAIYAKI');
  const skins = readFileSync(new URL('../../src/game/skins.js', import.meta.url), 'utf8');
  assert.match(skins, /taiyaki: \{ frame: 'ty_kata_shut', kind: 'taiyaki' \}/);
});
