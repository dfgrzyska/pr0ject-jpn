// Onomichi's music (src/audio/score11.js): every song parses, plays only instruments and drum hits the game has,
// the stage songs share one 8-bar progression and tempo (so they can change on any bar), stage 11 names only its
// own songs, the cat brings its theme, the festival's tune plays after the ship, and the sounds of the plan's
// section 7 exist and are used.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SONGS, PERCUSSION, parseSong } from '../../src/audio/score.js';
import { SONGS11 } from '../../src/audio/score11.js';
import { Synth } from '../../src/audio/synth.js';
import { Sfx } from '../../src/audio/Sfx.js';

const stage = JSON.parse(readFileSync(new URL('../../src/data/stage11.json', import.meta.url)));
const read = (p) => readFileSync(new URL(`../../src/${p}`, import.meta.url), 'utf8');
const music = read('audio/Music.js');

test('every Onomichi song parses and plays only what the synth has', () => {
  const hits = new Set([...music.matchAll(/e\.hit === '(.)'/g)].map((m) => m[1]));
  for (const [name, def] of Object.entries(SONGS11)) {
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
    assert.equal(SONGS11[n].bpm, 116, n);
    assert.equal(SONGS11[n].bars % 8, 0, n);
    assert.ok(SONGS11[n].sync && SONGS11[n].loop, n);
  }
});

test('stage 11 names only its own songs; the cat and the ship bring theirs', () => {
  const m = stage.music;
  const times = m.schedule.map(([t]) => t);
  assert.deepEqual(times, [...times].sort((a, b) => a - b));
  for (const n of [...m.schedule.map(([, n]) => n), m.heavy, m.boss, m.night]) assert.ok(SONGS11[n], n);
  assert.deepEqual(stage.waves.filter((w) => w.type === 'heavy').map((w) => w.music), ['s11_neko']);
  assert.equal(m.boss, 's11_boss');
  assert.equal(m.night, 's11_hanabi');
});

test('the Onomichi sounds exist and are played', () => {
  for (const k of ['furin', 'meow', 'splash', 'conch', 'hanabi', 'crock']) assert.equal(typeof Sfx.prototype[k], 'function', k);
  const used = read('game/enemies/onomichi-funayurei.js') + read('game/enemies/onomichi-nekomata.js') + read('game/Hanabi.js') + read('game/skins.js') + read('game/Enemies.js');
  for (const k of ['meow?.(', 'splash?.(', 'conch?.(', 'hanabi?.(', 'hanabi?.(true)', 'crock?.(', "sound: 'furin'", "sound: ['splash']", 'this.scene.sfx[e.sound]']) assert.ok(used.includes(k), k);
});
