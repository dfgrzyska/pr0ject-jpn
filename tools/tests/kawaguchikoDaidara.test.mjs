// Daidarabotchi's parts (tools/art/kawaguchiko/daidara.mjs) are all in Kawaguchiko's atlas, the ones that sit on the
// body packed without their margins but keeping the whole frame (so they share its middle); the fight
// (src/game/enemies/kawaguchiko-daidara.js) puts them where the art says they go and names only frames that exist,
// and the stage and the game know it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SHOULDER, CORE, DW, DH } from '../art/kawaguchiko/daidara.mjs';

const frames = JSON.parse(readFileSync(new URL('../../public/assets/bg/stage10/enemies.json', import.meta.url))).frames;
const portraits = JSON.parse(readFileSync(new URL('../../public/assets/portraits.json', import.meta.url))).frames;
const fight = readFileSync(new URL('../../src/game/enemies/kawaguchiko-daidara.js', import.meta.url), 'utf8');
const literal = (name) => {
  const at = fight.indexOf(`export const ${name} = {`);
  assert.ok(at >= 0, name);
  return new Function(`return ${fight.slice(fight.indexOf('{', at), fight.indexOf('};', at) + 1)}`)();
};

test('every part, in every state, is in the atlas; the parts on the body keep its whole frame', () => {
  const want = ['dd_body_dusk', 'dd_stump', 'dd_stump_dusk', 'dd_pole', 'dd_pole_dusk', 'dd_basket_full', 'dd_basket_empty', 'dd_sun', 'dd_islet'];
  for (const w of [0, 1, 2]) want.push(`dd_body_${w}`);
  for (const k of ['blink', 'roar']) want.push(`dd_face_${k}`, `dd_face_${k}_dusk`);
  for (const h of ['open', 'cup', 'clod', 'grip']) for (const w of ['0', '1', 'dusk']) want.push(`dd_arm_${h}_${w}`);
  for (const f of [0, 1]) want.push(`dd_core_${f}`, `dd_clod_${f}`, `dd_rock_${f}`);
  for (const f of want) assert.ok(frames[f], f);
  for (const f of ['dd_body_0', 'dd_body_dusk', 'dd_face_roar', 'dd_core_1']) {
    assert.equal(frames[f].trimmed, true, f);
    assert.deepEqual(frames[f].sourceSize, { w: DW, h: DH }, f);
  }
  assert.ok(portraits.dd_body_0);
});

test("the fight's places for the arms, the fissure and the arms' pivot are the art's", () => {
  const DD = literal('DD');
  const S = 3; // (the art is drawn at 3x the game's pixels)
  assert.ok(Math.abs(DD.shoulder - (DW / 2 - SHOULDER[0][0] + 20) / S) < 0.01, 'the arms hang 20 fine px out from the shoulders');
  assert.equal(SHOULDER[0][1], DH / 2, "the shoulders are at the frame's middle height");
  assert.deepEqual(DD.core, [(CORE[0] - DW / 2) / S, (CORE[1] - DH / 2) / S]);
  assert.equal(DD.half, DH / 2 / S);
  assert.ok(Math.abs(DD.pivot - 18 / frames.dd_arm_open_0.sourceSize.h) < 1e-9);
});

test('every frame the fight names outright is in the atlas', () => {
  const named = new Set(fight.match(/'dd_[a-z_0-9]+'/g).map((s) => s.slice(1, -1)));
  for (const f of named) assert.ok(f.endsWith('_') ? Object.keys(frames).some((k) => k.startsWith(f)) : frames[f], f); // (a name ending in _ is a family's prefix)
  for (const m of fight.matchAll(/`(dd_[a-z_]+)\$\{/g)) assert.ok(Object.keys(frames).some((f) => f.startsWith(m[1])), m[1]);
});

test('the phases come in order and the giant ends the stage with his card', () => {
  const D = literal('DAIDARA');
  assert.ok(D.phase[0] > D.phase[1] && D.phase[1] > 0);
  assert.ok(D.outro > JSON.parse(readFileSync(new URL('../../src/data/stage10.json', import.meta.url))).panorama.hold, 'the islet stays through the dusk');
  const stage = JSON.parse(readFileSync(new URL('../../src/data/stage10.json', import.meta.url)));
  const w = stage.waves.find((v) => v.type === 'boss');
  assert.equal(w.boss, 'daidara');
  assert.equal(w.card[0], 'DAIDARABOTCHI');
  const enemies = readFileSync(new URL('../../src/game/Enemies.js', import.meta.url), 'utf8');
  for (const hook of ['spawnDaidara', 'updateDaidara', 'ddDown', 'ddEnd', 'ddCleanup', 'ddMarks', "'islet'"]) assert.ok(enemies.includes(hook), hook);
  assert.match(enemies, /g\.kind === 'daidara'[^\n]*\? g\.awake/, 'the boss bar waits for him to rise');
  assert.ok(readFileSync(new URL('../../src/game/enemies/encounters.js', import.meta.url), 'utf8').includes('this.ddShot(shot)'));
  assert.ok(readFileSync(new URL('../../src/game/FujiView.js', import.meta.url), 'utf8').includes('this.waterY'), 'the view says where the waterline is');
});
