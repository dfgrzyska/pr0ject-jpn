// Yatai-obake's frames (tools/art/fukuoka/yatai.mjs) are all in Fukuoka's atlas, and every frame the fight
// (src/game/enemies/fukuoka-yatai.js) names is one of them; the stall is the stage's miniboss; its runs at dawn keep
// to Nakasu's streets and bridges, and the tow truck comes for it along the street it is on.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SKINS } from '../../src/game/skins.js';
import { HEAVY } from '../../src/config.js';
import { ROADS, ARENAS } from '../art/fukuoka/route.mjs';
import { near } from '../art/tokyo/geom.mjs';

const atlas = JSON.parse(readFileSync(new URL('../../public/assets/bg/stage12/enemies.json', import.meta.url)));
const names = new Set(Array.isArray(atlas.frames) ? atlas.frames.map((f) => f.filename) : Object.keys(atlas.frames));
const fight = readFileSync(new URL('../../src/game/enemies/fukuoka-yatai.js', import.meta.url), 'utf8');
// (the fight needs the browser and Phaser: its numbers and its streets are read from its source)
const num = (key) => Number(new RegExp(`\n  ${key}: ([0-9.]+)`).exec(fight)[1]);
const NODES = Function(`return ${/export const NODES = (\{[^\n]+\});/.exec(fight)[1]}`)();
const EDGES = JSON.parse(/export const EDGES = (\[[^\n]+\]);/.exec(fight)[1].replace(/'/g, '"'));
const onRoad = (x, u, slack) => ROADS.some((r) => near(r.pts, x, u).d < r.w / 2 + slack);

test('every frame the fight names is in the city atlas', () => {
  const plain = [...fight.matchAll(/'(yt_[a-z_0-9]+)'/g)].map((m) => m[1]);
  const looped = [...fight.matchAll(/`(yt_[a-z]+)_\$\{/g)].map((m) => m[1]);
  assert.ok(plain.length > 5 && looped.length > 8);
  for (const f of plain) assert.ok(names.has(f), f);
  for (const base of looped) assert.ok(names.has(`${base}_0`) && names.has(`${base}_1`), base);
  for (let f = 0; f < 4; f++) assert.ok(names.has(`yt_idle_${f}`));
});

test('the stall is the miniboss of Fukuoka, its life the same in both places', () => {
  assert.equal(SKINS.fukuoka.heavy.kind, 'yatai');
  assert.ok(names.has(SKINS.fukuoka.heavy.frame));
  assert.equal(HEAVY.hp.yatai, num('hp'));
  assert.ok(num('guard') > 0 && num('guard') < 0.5);
  assert.ok(num('time') >= 80 && num('time') <= 110);
});

test('its runs at dawn keep to the streets of Nakasu, by its arena', () => {
  const [ax, au] = ARENAS.find((a) => a[2] === 'YATAI-OBAKE');
  for (const [a, b] of EDGES) {
    const [x0, u0] = NODES[a];
    const [x1, u1] = NODES[b];
    assert.ok(x0 === x1 || u0 === u1, `${a}${b} along a street or across`);
    // every point of a leg on a road (the stall is wide: the bank's row of stalls beside the bank road counts)
    for (let k = 0; k <= 1; k += 0.05) assert.ok(onRoad(x0 + (x1 - x0) * k, u0 + (u1 - u0) * k, 9), `${a}${b} off the streets at ${k}`);
  }
  for (const [x, u] of Object.values(NODES)) assert.ok(Math.abs(u - au) < 200 && x > 14 && x < 166 && Math.abs(x - ax) < 70);
});
