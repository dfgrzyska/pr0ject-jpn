// Tokyo's music (src/audio/score9.js): every song parses, plays only instruments and drum hits the game has, the
// stage songs share one 8-bar progression (so they can change on any bar), and stage 9 names only songs that exist.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SONGS, PERCUSSION, parseSong } from '../../src/audio/score.js';
import { SONGS9 } from '../../src/audio/score9.js';
import { Synth } from '../../src/audio/synth.js';
import { Sfx } from '../../src/audio/Sfx.js';

const stage = JSON.parse(readFileSync(new URL('../../src/data/stage9.json', import.meta.url)));
const music = readFileSync(new URL('../../src/audio/Music.js', import.meta.url), 'utf8');

test('every Tokyo song parses and plays only what the synth has', () => {
  const hits = new Set([...music.matchAll(/e\.hit === '(.)'/g)].map((m) => m[1]));
  for (const [name, def] of Object.entries(SONGS9)) {
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
  const stageSongs = new Set(stage.music.schedule.map(([, n]) => n));
  for (const n of stageSongs) {
    assert.equal(SONGS9[n].bpm, 116, n);
    assert.equal(SONGS9[n].bars % 8, 0, n);
    assert.ok(SONGS9[n].sync && SONGS9[n].loop, n);
  }
});

test('stage 9 names only Tokyo songs; each miniboss brings its own', () => {
  const m = stage.music;
  const times = m.schedule.map(([t]) => t);
  assert.deepEqual(times, [...times].sort((a, b) => a - b));
  for (const n of [...m.schedule.map(([, n]) => n), m.heavy, m.boss, m.night]) assert.ok(SONGS9[n], n);
  const heavies = stage.waves.filter((w) => w.type === 'heavy');
  assert.deepEqual(heavies.map((w) => [w.look, w.music]), [['kasa', 's9_kasa'], ['taiyaki', 's9_taiyaki']]);
});

test('the Tokyo sounds exist', () => {
  for (const k of ['rain', 'signal', 'sizzle', 'actuator', 'katana']) assert.equal(typeof Sfx.prototype[k], 'function', k);
});
