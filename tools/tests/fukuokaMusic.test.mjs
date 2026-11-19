// Fukuoka's music (src/audio/score12.js): every song parses and plays only instruments and drum hits the game has,
// the stage songs share one 8-bar progression and tempo (so they can change on any bar), stage 12 names only its own
// songs, the stall and the wall bring their themes (the wall's falling quiet in the night), the evening's after it,
// the temple bell over Nanzo-in falls in the quiet there; and the sounds of the plan's section 7 exist and are used.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SONGS, PERCUSSION, parseSong } from '../../src/audio/score.js';
import { SONGS12 } from '../../src/audio/score12.js';
import { Synth } from '../../src/audio/synth.js';
import { Sfx } from '../../src/audio/Sfx.js';

const stage = JSON.parse(readFileSync(new URL('../../src/data/stage12.json', import.meta.url)));
const read = (p) => readFileSync(new URL(`../../src/${p}`, import.meta.url), 'utf8');
const music = read('audio/Music.js');

test('every Fukuoka song parses and plays only what the synth has', () => {
  const hits = new Set([...music.matchAll(/e\.hit === '(.)'/g)].map((m) => m[1]));
  for (const [name, def] of Object.entries(SONGS12)) {
    assert.equal(SONGS[name], def, `${name} is in the game's songs`);
    const song = parseSong(name, def);
    for (const track of Object.keys(def.tracks)) {
      if (PERCUSSION.has(track)) continue;
      assert.equal(typeof Synth.prototype[track], 'function', `${name}: no instrument "${track}"`);
    }
    for (const events of Object.values(song.events)) for (const e of events) if (e.hit) assert.ok(hits.has(e.hit), `${name}: drum hit "${e.hit}"`);
    for (const t of Object.keys(def.mix)) assert.ok(def.tracks[t], `${name}: mix for a track it hasn't (${t})`);
  }
});

test('the stage songs are in step: one tempo, whole rounds of the 8-bar progression', () => {
  for (const n of [...stage.music.schedule.map(([, n]) => n), stage.music.night]) {
    assert.equal(SONGS12[n].bpm, 104, n);
    assert.equal(SONGS12[n].bars % 8, 0, n);
    assert.ok(SONGS12[n].sync && SONGS12[n].loop, n);
  }
  // the wall's two themes too, so the night's can take over on a bar
  assert.equal(SONGS12.s12_boss.bpm, SONGS12.s12_boss_night.bpm);
  assert.equal(SONGS12.s12_boss.bars, SONGS12.s12_boss_night.bars);
});

test('stage 12 names only its own songs; the stall and the wall bring theirs', () => {
  const m = stage.music;
  const times = m.schedule.map(([t]) => t);
  assert.deepEqual(times, [...times].sort((a, b) => a - b));
  for (const n of [...m.schedule.map(([, n]) => n), m.heavy, m.boss, m.night]) assert.ok(SONGS12[n], n);
  assert.deepEqual(stage.waves.filter((w) => w.type === 'heavy').map((w) => w.music), ['s12_yatai']);
  assert.equal(m.boss, 's12_boss');
  assert.equal(m.night, 's12_yube');
  assert.ok(read('game/enemies/fukuoka-nurikabe.js').includes("song: 's12_boss_night'"));
});

test('the temple bell rings over Nanzo-in, in the quiet there', () => {
  assert.deepEqual(stage.bells.length, 1);
  const [at] = stage.bells;
  // (no wave stands or comes over the Buddha from 148 to 157 s: fukuokaWaves)
  assert.ok(at > 148 && at < 157);
  assert.ok(read('scenes/Stage.js').includes('this.stage.bells'));
});

test('the Fukuoka sounds exist and are played', () => {
  for (const k of ['chain', 'squelch', 'creak', 'spin', 'puff', 'wheel', 'kaedama', 'sizzle', 'don', 'earth', 'bell']) assert.equal(typeof Sfx.prototype[k], 'function', k);
  const used = read('game/enemies/chainSplitCart.js') + read('game/enemies/fukuoka-yatai.js') + read('game/enemies/fukuoka-nurikabe.js') + read('game/skins.js') + read('game/Enemies.js') + read('scenes/Stage.js');
  for (const k of ['chain?.(', "?? 'squelch']?.(", 'creak?.(', 'wheel?.(', 'kaedama?.(', 'sizzle?.(', 'don?.(', 'earth?.(', 'bell?.(', "sound: 'puff'", "sound: 'spin'", 'this.scene.sfx[e.sound]']) assert.ok(used.includes(k), k);
});
