// Nurikabe's parts (tools/art/fukuoka/nurikabe.mjs) are all in Fukuoka's atlas; the fight
// (src/game/enemies/fukuoka-nurikabe.js) puts them where the art says they go and names only frames that exist; its
// corridor keeps its stretches on the screen; the wall is the stage's boss, out of the earthwork at the strip's end.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PARTS, SIZES, WALL_H, EYE_FRAME, MOUTH_FRAME } from '../art/fukuoka/nurikabe.mjs';
import { ARENAS, L } from '../art/fukuoka/route.mjs';

const atlas = JSON.parse(readFileSync(new URL('../../public/assets/bg/stage12/enemies.json', import.meta.url)));
const frames = Array.isArray(atlas.frames) ? Object.fromEntries(atlas.frames.map((f) => [f.filename, f])) : atlas.frames;
const fight = readFileSync(new URL('../../src/game/enemies/fukuoka-nurikabe.js', import.meta.url), 'utf8');
const stage = JSON.parse(readFileSync(new URL('../../src/data/stage12.json', import.meta.url)));
// (the fight needs the browser: its tables are read from its source)
const literal = (name) => {
  const at = fight.indexOf(`export const ${name} = {`);
  assert.ok(at >= 0, name);
  return new Function(`return ${fight.slice(fight.indexOf('{', at), fight.indexOf('};', at) + 1)}`)();
};
const S = 3;
const near = (a, b, what) => assert.ok(Math.abs(a - b) < 0.02, `${what}: ${a} vs ${b}`);
const NURI = literal('NURI');
const NURIKABE = literal('NURIKABE');

test('every part, in every state, is in the atlas', () => {
  const want = ['nu_foot', 'nu_night', 'nu_shadow', 'nu_shadow_m', 'nu_shadow_s', 'nu_plum'];
  for (let k = 0; k < 4; k++) want.push(`nu_wall_${k}`, `nu_stretch_${k}`, `nu_mouth_${k}`, `nu_clod_${k}`, `nu_petal_${k}`);
  for (let k = 0; k < 2; k++) want.push(`nu_core_${k}`, `nu_gout_${k}`);
  for (const look of ['shut', 'half', 'open', 'glare', 'glow']) want.push(`nu_eye_${look}_l`, `nu_eye_${look}_r`);
  for (const f of want) assert.ok(frames[f], f);
  // every frame the fight names outright, and every family it names by a number
  for (const m of fight.matchAll(/'(nu_[a-z_0-9]+)'/g)) assert.ok(frames[m[1]], m[1]);
  for (const m of fight.matchAll(/`(nu_[a-z]+)_\$\{/g)) assert.ok(frames[`${m[1]}_0`] || frames[`${m[1]}_shut_l`], m[1]);
});

test('the fight puts its parts where the art says they go', () => {
  near(NURI.w, SIZES.wall / S, 'width');
  near(NURI.h, WALL_H / S, 'height');
  near(NURI.core, SIZES.core / S, 'core');
  near(NURI.stretch, SIZES.stretch / S, 'stretch');
  PARTS.eyes.forEach(([x, y], i) => (near(NURI.eyes[i][0], x / S, 'eye x'), near(NURI.eyes[i][1], y / S, 'eye y')));
  PARTS.eyesCore.forEach(([x, y], i) => (near(NURI.eyesCore[i][0], x / S, 'core eye x'), near(NURI.eyesCore[i][1], y / S, 'core eye y')));
  for (const k of ['mouth', 'slot', 'gold']) PARTS[k].forEach((v, i) => near(NURI[k][i], v / S, k));
  near(NURI.foot[0], PARTS.foot[1] / S, 'foot top');
  near(NURI.foot[1], PARTS.foot[2] / S, 'foot bottom');
  PARTS.ridge.forEach((v, i) => near(NURI.ridge[i], v / S, 'ridge'));
  assert.equal(frames.nu_wall_0.sourceSize?.w ?? frames.nu_wall_0.frame.w, SIZES.wall);
  assert.equal(frames.nu_eye_open_l.frame.w, EYE_FRAME.w);
  near(Number(/const MOUTH_O = ([0-9.]+) \/ ([0-9.]+);/.exec(fight).slice(1).reduce((a, b) => a / b)), MOUTH_FRAME.oy / MOUTH_FRAME.h, 'mouth origin');
});

test('its corridor keeps the stretches on the screen and apart, however the ship goes', async () => {
  const half = NURI.stretch / 2;
  // (corridor() is the fight's: Phaser's Clamp in plain terms)
  const src = /export function corridor\(cx, gap\) \{([\s\S]*?)\n\}/.exec(fight)[1].replace('Phaser.Math.Clamp', 'clamp');
  const corridor = new Function('cx', 'gap', 'NURI', 'clamp', src);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  for (let cx = 0; cx <= 180; cx += 5)
    for (const gap of NURIKABE.alley.gap) {
      const [l, r] = corridor(cx, gap, NURI, clamp);
      assert.ok(l - half >= -0.01 && r + half <= 180.01, `off the screen at ${cx}, ${gap}`);
      assert.ok(r - l - 2 * half >= gap - 0.01, `the corridor narrower than ${gap}`);
    }
});

test('the wall is the boss of Fukuoka, out of the earthwork at the strip\'s end, with its card', () => {
  const boss = stage.waves.find((w) => w.type === 'boss');
  assert.equal(boss.boss, 'nurikabe');
  assert.deepEqual(boss.card, ['NURIKABE', 'ŚCIANA NA DRODZE']);
  const [, au] = ARENAS.find((a) => a[2] === 'NURIKABE');
  // (where it comes out of: the earthwork's middle on the screen once the strip has stopped, its top at the strip's end)
  near(Number(/const HOME = ([0-9.]+);/.exec(fight)[1]), L - au, 'its place in the earthwork');
  assert.ok(NURIKABE.phase[0] > NURIKABE.phase[1] && NURIKABE.outro >= 6);
});
