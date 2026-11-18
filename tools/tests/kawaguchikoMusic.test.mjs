// Kawaguchiko's music (src/audio/score10.js): every song parses, plays only instruments and drum hits the game has,
// the stage songs share one 8-bar progression and tempo (so they can change on any bar), stage 10 names only its
// own songs, the giant's theme changes at sunset, and the sounds of the plan's section 7 exist and are used.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SONGS, PERCUSSION, parseSong } from '../../src/audio/score.js';
import { SONGS10 } from '../../src/audio/score10.js';
import { Synth } from '../../src/audio/synth.js';
import { Sfx } from '../../src/audio/Sfx.js';

const stage = JSON.parse(readFileSync(new URL('../../src/data/stage10.json', import.meta.url)));
const read = (p) => readFileSync(new URL(`../../src/${p}`, import.meta.url), 'utf8');
const music = read('audio/Music.js');

test('every Kawaguchiko song parses and plays only what the synth has', () => {
  const hits = new Set([...music.matchAll(/e\.hit === '(.)'/g)].map((m) => m[1]));
  for (const [name, def] of Object.entries(SONGS10)) {
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
  for (const [, n] of stage.music.schedule) {
    assert.equal(SONGS10[n].bpm, 112, n);
    assert.equal(SONGS10[n].bars % 8, 0, n);
    assert.ok(SONGS10[n].sync && SONGS10[n].loop, n);
  }
});

test('stage 10 names only its own songs; the hare and the giant bring theirs', () => {
  const m = stage.music;
  const times = m.schedule.map(([t]) => t);
  assert.deepEqual(times, [...times].sort((a, b) => a - b));
  for (const n of [...m.schedule.map(([, n]) => n), m.heavy, m.boss, m.night]) assert.ok(SONGS10[n], n);
  assert.deepEqual(stage.waves.filter((w) => w.type === 'heavy').map((w) => w.music), ['s10_usagi']);
  assert.ok(read('game/enemies/kawaguchiko-daidara.js').includes("g.song = 's10_dusk'"), 'his theme brightens at sunset');
  assert.ok(SONGS10.s10_dusk);
  assert.ok(read('scenes/Stage.js').includes('return g.song;'), 'the stage plays a boss group\'s own song');
});

test('the Kawaguchiko sounds exist and are played', () => {
  for (const k of ['flint', 'oar', 'crackle', 'rustle', 'earth', 'rope', 'crock']) assert.equal(typeof Sfx.prototype[k], 'function', k);
  const used = read('game/enemies/kawaguchiko-usagi.js') + read('game/enemies/kawaguchiko-daidara.js') + read('game/skins.js');
  for (const k of ['flint?.(', 'oar?.(', 'crackle?.(', 'earth?.(', 'rope?.(', 'crock?.(', "'rustle'", "sound: 'crackle'"]) assert.ok(used.includes(k), k);
});
