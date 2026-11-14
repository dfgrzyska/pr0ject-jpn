import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { rollEncounter as roll } from '../../src/data/encounterRoll.js';
import { ENCOUNTER } from '../../src/config.js';

// (the stage files are JSON, imported by Vite in the game: read them here)
const src = readFileSync(new URL('../../src/data/encounters.js', import.meta.url), 'utf8');
const ENCOUNTERS = [...src.matchAll(/import (\w+) from '\.\/(\w+)\.json'/g)].map(([, , f]) => JSON.parse(readFileSync(new URL(`../../src/data/${f}.json`, import.meta.url))));
const ids = ENCOUNTERS.map((e) => e.id);
const rollEncounter = (met, chance, forced, random) => roll(ids, met, chance, forced, random);

test('random encounters: a fixed one-in-five chance after a city, never the same one twice in a game', () => {
  assert.equal(ENCOUNTER.chance, 0.2);
  assert.equal(rollEncounter([], 0.2, null, () => 0.5), null, 'a roll over the odds: nothing');
  assert.equal(rollEncounter([], 0.2, null, () => 0.1), ENCOUNTERS[0].id, 'a roll under the odds: one of them');
  assert.equal(rollEncounter(ENCOUNTERS.map((e) => e.id), 1, 'any'), null, 'all met already: nothing more');
  assert.equal(rollEncounter([], 0, 'ex1'), 'ex1', 'debug: forced');
  // over many games about a fifth of the flights have one
  let n = 0;
  let seed = 1;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 20000; i++) if (rollEncounter([], ENCOUNTER.chance, null, rnd)) n++;
  assert(Math.abs(n / 20000 - 0.2) < 0.02);
});

test('every encounter is a one-boss arena with its art generated', () => {
  for (const e of ENCOUNTERS) {
    assert(e.encounter && e.boss && /^ex\d+$/.test(e.id));
    assert.equal(e.waves.length, 1);
    assert.equal(e.waves[0].type, 'boss');
    for (const f of ['far.png', 'mid_00.png', 'meta.json', 'enemies.png', 'enemies.json']) assert(existsSync(new URL(`../../public/assets/bg/${e.id}/${f}`, import.meta.url)), `${e.id}/${f}`);
    const meta = JSON.parse(readFileSync(new URL(`../../public/assets/bg/${e.id}/meta.json`, import.meta.url)));
    assert(meta.length >= e.scroll.anchor);
  }
  const frames = JSON.parse(readFileSync(new URL('../../public/assets/bg/ex1/enemies.json', import.meta.url))).frames;
  const names = new Set(Array.isArray(frames) ? frames.map((f) => f.filename) : Object.keys(frames));
  for (const f of ['jihanki_0', 'jihanki_1', 'jihanki_open', 'jihanki_2', 'jihanki_3', 'can_hot', 'can_cold', 'can_gold', 'puddle_hot_0', 'puddle_cold_1', 'led_7', 'led_off']) assert(names.has(f), f);
});
