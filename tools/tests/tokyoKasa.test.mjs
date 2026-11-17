// Kasa-obake (src/game/enemies/tokyo-kasa.js) finds every frame it asks for in Tokyo's atlas (tools/art/tokyo/kasa.mjs),
// and the stage file sends it in over the scramble with its card.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const json = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const frames = json('../../public/assets/bg/stage9/enemies.json').frames;
const src = readFileSync(new URL('../../src/game/enemies/tokyo-kasa.js', import.meta.url), 'utf8');

test('every frame of the umbrella is in the atlas', () => {
  const want = new Set(src.match(/'ko_[a-z_0-9]+'/g).map((s) => s.slice(1, -1)));
  for (const st of ['shut', 'half', 'wide', 'open', 'air', 'squash']) for (let w = 0; w < 4; w++) want.add(`ko_${st}_${w}`);
  for (let f = 0; f < 4; f++) {
    for (const w of [0, 1]) want.add(`ko_spin_${f}_${w}`);
    for (const w of [2, 3]) want.add(`ko_top_${f}_${w}`);
  }
  for (const p of ['stand', 'crouch1', 'crouch2', 'stretch', 'air', 'land']) want.add(`ko_leg_${p}`);
  for (const k of ['l2', 'l1', 'c', 'r1', 'r2', 'half', 'shut', 'angry', 'wide', 'hurt', 'happy']) want.add(`ko_eye_${k}`);
  for (let f = 0; f < 7; f++) want.add(`ko_mini_${f}`);
  for (const k of ['off', 'red', 'go0', 'go1']) want.add(`ko_sig_${k}`);
  for (let f = 0; f < 3; f++) want.add(`ko_ripple_${f}`);
  for (const k of ['ko_bow_0', 'ko_bow_1', 'ko_split', 'ko_clear_0', 'ko_clear_1', 'ko_tongue_tip_0', 'ko_tongue_tip_1']) want.add(k);
  for (const f of want) assert.ok(frames[f], f);
});

test('it comes in over the scramble, holding the city, with its card', () => {
  const stage = json('../../src/data/stage9.json');
  const w = stage.waves.find((v) => v.look === 'kasa');
  assert.ok(w && w.type === 'heavy' && w.hold && w.card[0] === 'KASA-OBAKE');
  const skins = readFileSync(new URL('../../src/game/skins.js', import.meta.url), 'utf8');
  assert.match(skins, /kasa: \{ frame: 'ko_open_0', kind: 'kasa' \}/);
});
