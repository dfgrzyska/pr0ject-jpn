// Nekomata's frames (tools/art/onomichi/nekomata.mjs) are all in Onomichi's atlas, and every frame the fight
// (src/game/enemies/onomichi-nekomata.js) names is one of them; the cat is the stage's miniboss.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SKINS } from '../../src/game/skins.js';
import { HEAVY } from '../../src/config.js';

const atlas = JSON.parse(readFileSync(new URL('../../public/assets/bg/stage11/enemies.json', import.meta.url)));
const names = new Set(Array.isArray(atlas.frames) ? atlas.frames.map((f) => f.filename) : Object.keys(atlas.frames));
const fight = readFileSync(new URL('../../src/game/enemies/onomichi-nekomata.js', import.meta.url), 'utf8');
// (the fight needs the browser: its numbers are read from its source)
const num = (key) => Number(new RegExp(`\n  ${key}: ([0-9.]+)`).exec(fight)[1]);

test('every frame the fight names is in the city atlas', () => {
  const plain = [...fight.matchAll(/'(o_(?:neko|onibi)_[a-z_0-9]+)'/g)].map((m) => m[1]);
  const looped = [...fight.matchAll(/`(o_(?:neko|onibi)_[a-z]+)_\$\{/g)].map((m) => m[1]);
  assert.ok(plain.length > 5 && looped.length > 4);
  for (const f of plain) assert.ok(names.has(f), f);
  for (const base of looped) assert.ok(names.has(`${base}_0`) && names.has(`${base}_1`), base);
  for (let f = 0; f < 4; f++) for (const base of ['o_neko_sit', 'o_neko_dance', 'o_onibi']) assert.ok(names.has(`${base}_${f}`), `${base}_${f}`);
});

test('the cat is the miniboss of Onomichi, its life the same in both places', () => {
  assert.equal(SKINS.onomichi.heavy.kind, 'nekomata');
  assert.ok(names.has(SKINS.onomichi.heavy.frame));
  assert.equal(HEAVY.hp.nekomata, num('hp'));
  assert.ok(num('guard') > 0 && num('guard') < 0.5);
});
