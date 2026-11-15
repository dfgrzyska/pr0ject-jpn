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
  const names = (id) => {
    const frames = JSON.parse(readFileSync(new URL(`../../public/assets/bg/${id}/enemies.json`, import.meta.url))).frames;
    return new Set(Array.isArray(frames) ? frames.map((f) => f.filename) : Object.keys(frames));
  };
  for (const f of ['kei_0', 'kei_1', 'kei_angry', 'kei_tuned', 'keitora_0', 'keitora_1', 'mini_r', 'mini_b', 'mini_w', 'cone', 'suika_3', 'skid', 'kei_2', 'kei_angry_1', 'kei_beam', 'kei_tuned_1', 'keitora_2', 'mini_y', 'mini_p', 'mini_t', 'suika_splat_2', 'jb_seed']) assert(names('ex2').has(f), f);
  for (const f of ['neko_0', 'neko_1', 'neko_pounce', 'neko_hiss', 'neko_hiss_bare', 'neko_pounce_bare', 'tower_0', 'tower_1', 'tower_rubble', 'ibeam', 'crane_hook', 'spanner_3', 'hardhat_1', 'neko_stand', 'neko_stand1', 'neko_blink', 'neko_throw0', 'neko_crouch1_bare', 'neko_leap', 'neko_land', 'neko_scratch1', 'neko_run0_bare', 'neko_nap', 'tower_lean', 'beam_shadow', 'chunk_1', 'claws']) assert(names('ex3').has(f), f);
  for (const f of ['lect_0', 'lect_ear', 'lect_cry', 'lect_bang', 'lect_wave', 'ticket_0', 'ticket_1', 'ticket_x']) assert(names('ex7').has(f), f);
  for (const f of ['baba_0', 'baba_1', 'baba_shout', 'baba_bare', 'baba_bare_1', 'baba_bare_shout', 'tora_crouch', 'tora_leap', 'tora_roar', 'ame_r_0', 'ame_p_1', 'cart_1']) assert(names('ex6').has(f), f);
  for (const f of ['heya_0', 'heya_1', 'heya_angry', 'heya_night', 'heya_ruin', 'manga_3', 'noodle_1', 'manga_stack', 'gacha_r', 'gacha_gold']) assert(names('ex5').has(f), f);
  for (const f of ['nagai_head_0', 'nagai_head_meow', 'nagai_head_purr', 'nagai_seg_a', 'nagai_seg_b', 'nagai_seg_paws', 'hairball_1', 'yarn_r', 'yarn_b']) assert(names('ex4').has(f), f);
  for (const f of ['jihanki_0', 'jihanki_1', 'jihanki_open', 'jihanki_2', 'jihanki_3', 'can_hot', 'can_cold', 'can_gold', 'puddle_hot_0', 'puddle_cold_1', 'led_7', 'led_off', 'jihanki_blink', 'jihanki_fizz_1', 'jihanki_2_open', 'jihanki_3_open', 'jihanki_dizzy', 'jihanki_shadow', 'splash_hot_2', 'splash_cold_2', 'foam_3', 'cap_1', 'jb_coin', 'jb_bubble', 'jb_coffee', 'jb_ice']) assert(names('ex1').has(f), f);
});
