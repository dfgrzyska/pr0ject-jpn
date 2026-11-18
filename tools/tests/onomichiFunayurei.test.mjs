// Funa-yurei's parts (tools/art/onomichi/funayurei.mjs) are all in Onomichi's atlas, the hulls packed without their
// margins but keeping the whole frame (so they share its middle); the fight (src/game/enemies/onomichi-funayurei.js)
// puts the parts where the art says they go and names only frames that exist; the ship is the stage's boss, over the
// water, and the game knows it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PARTS, ARM, FW, FH, ARM_FRAME, LANTERN_FRAME, BANNER_FRAME } from '../art/onomichi/funayurei.mjs';
import { isSea } from '../art/onomichi/route.mjs';

const frames = JSON.parse(readFileSync(new URL('../../public/assets/bg/stage11/enemies.json', import.meta.url))).frames;
const fight = readFileSync(new URL('../../src/game/enemies/onomichi-funayurei.js', import.meta.url), 'utf8');
// (the fight needs the browser: its tables are read from its source)
const literal = (name) => {
  const at = fight.indexOf(`export const ${name} = {`);
  assert.ok(at >= 0, name);
  return new Function(`return ${fight.slice(fight.indexOf('{', at), fight.indexOf('};', at) + 1)}`)();
};
const S = 3; // (the art is drawn at 3x the game's pixels)
const near = (a, b, what) => assert.ok(Math.abs(a - b) < 0.02, `${what}: ${a} vs ${b}`);

test('every part, in every state, is in the atlas; the hulls keep their whole frame', () => {
  const want = ['fy_lantern_0', 'fy_lantern_1', 'fy_lantern_open', 'fy_lantern_out', 'fy_ladle'];
  for (const w of [0, 1, 2]) want.push(`fy_hull_${w}`, `fy_banner_${w}`, `fy_banner_torn_${w}`);
  for (const p of ['rise', 'hold', 'throw', 'holed']) want.push(`fy_arm_${p}`);
  for (const f of [0, 1]) want.push(`fy_pot_${f}`, `fy_shell_${f}`, `fy_foam_${f}`);
  for (const f of want) assert.ok(frames[f], f);
  for (const w of [0, 1, 2]) {
    assert.equal(frames[`fy_hull_${w}`].trimmed, true);
    assert.deepEqual(frames[`fy_hull_${w}`].sourceSize, { w: FW, h: FH });
  }
  assert.deepEqual(frames.fy_arm_hold.sourceSize, { w: ARM_FRAME.w, h: ARM_FRAME.h });
  assert.deepEqual(frames.fy_lantern_0.sourceSize, { w: LANTERN_FRAME.w, h: LANTERN_FRAME.h });
  assert.deepEqual(frames.fy_banner_0.sourceSize, { w: BANNER_FRAME.w, h: BANNER_FRAME.h });
});

test('every frame the fight names outright is in the atlas', () => {
  const named = [...fight.matchAll(/'(fy_[a-z_0-9]+)'/g)].map((m) => m[1]);
  assert.ok(named.length > 5);
  for (const f of named) assert.ok(frames[f], f);
  for (const m of fight.matchAll(/`(fy_[a-z_]+)\$\{/g)) assert.ok(Object.keys(frames).some((f) => f.startsWith(m[1])), m[1]);
});

test("the fight's places for the lantern, banners, hatch, conch, sail, arms, oars and ladles are the art's", () => {
  const FY = literal('FY');
  for (const k of ['lantern', 'banner', 'hatch', 'conch', 'sail']) for (const i of [0, 1]) near(FY[k][i], PARTS[k][i] / S, `${k}[${i}]`);
  PARTS.arms.forEach((p, r) => p.forEach((v, i) => near(FY.arms[r][i], v / S, `arm ${r}`)));
  PARTS.oars.forEach((p, k) => near(FY.oars[k], p[1] / S, `oar ${k}`));
  for (const pose of ['hold', 'throw']) for (const i of [0, 1]) near(FY.bowl[pose][i], ARM[pose].bowl[i] / S, `${pose} bowl`);
  near(FY.bow, (470 - FH / 2) / S, 'bow');
  near(FY.stern, (34 - FH / 2) / S, 'stern');
  assert.match(fight, /arm: \[16 \/ 60, 54 \/ 76\]/, "the arms turn on their rings (ARM_FRAME)");
  assert.equal(ARM_FRAME.ox / ARM_FRAME.w, 16 / 60);
  assert.equal(LANTERN_FRAME.oy / LANTERN_FRAME.h, 18 / 44);
  assert.equal(BANNER_FRAME.oy / BANNER_FRAME.h, 68 / 72);
});

test('the ship rises over the water, its arms too; the phases come in order and it ends the stage with its card', () => {
  const F = literal('FUNA');
  assert.ok(F.phase[0] > F.phase[1] && F.phase[1] > 0);
  assert.ok(F.armour < 1 && F.open.take > 1 && F.stun.take > 1);
  const [hx, hy] = fight.match(/const HOME = \[(\d+), (\d+)\]/).slice(1).map(Number);
  const FY = literal('FY');
  // the strip's top is at the screen's top once the town has come to its end
  const L = 7168;
  for (const [dx, dy] of [[0, FY.stern], [0, FY.bow], [FY.half, 0], [-FY.half, 0], ...FY.arms.flatMap(([x, y]) => [[x + 8, y], [-x - 8, y]])]) assert.ok(isSea(hx + dx, L - (hy + dy)), `(${dx}, ${dy}) on the water`);
  const stage = JSON.parse(readFileSync(new URL('../../src/data/stage11.json', import.meta.url)));
  const w = stage.waves.find((v) => v.type === 'boss');
  assert.equal(w.boss, 'funayurei');
  assert.equal(w.card[0], 'FUNA-YUREI');
  const enemies = readFileSync(new URL('../../src/game/Enemies.js', import.meta.url), 'utf8');
  for (const hook of ['spawnFuna', 'updateFuna', 'fyDown', 'fyEnd', 'fyCleanup', 'fyMarks', 'fyCap', "'funa'", 'onomichiFunayurei']) assert.ok(enemies.includes(hook), hook);
  assert.match(enemies, /g\.kind === 'funayurei'[^\n]*\? g\.awake/, 'the boss bar waits for it to rise');
  assert.ok(readFileSync(new URL('../../src/game/enemies/encounters.js', import.meta.url), 'utf8').includes('this.fyShot(shot)'));
  assert.ok(readFileSync(new URL('../../src/game/Bullets.js', import.meta.url), 'utf8').includes('ghost: {'), 'the rows of arms have their own zone');
});
