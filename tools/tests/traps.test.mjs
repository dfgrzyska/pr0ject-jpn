// Every city has its indestructible traps set into its map (src/game/enemies/traps.js), like Beppu's geysers: each
// skin names its trap, whose four frames are in the shared 540 px atlas; each stage (Beppu has its geysers) places
// 8 to 14 of them, never where a fight is coming or going on, nor in Nagasaki's moment of remembrance.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SKINS } from '../../src/game/skins.js';
import { cities } from './cities.mjs';

const json = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const atlas = json('../../public/assets/sprites540.json').frames;
const stages = cities();

test('every city but Beppu has a trap, drawn in four frames', () => {
  for (const st of stages) {
    const look = SKINS[st.skin].trap;
    if (st.skin === 'beppu') continue;
    assert.ok(look, st.skin);
    assert.equal(look.frames.length, 4);
    for (const f of look.frames) assert.ok(atlas[f], f);
    assert.ok(['ring', 'fan'].includes(look.volley.kind) && look.volley.n > 0 && look.every >= 3, st.skin);
  }
});

test('8 to 14 traps a stage, clear of the fights and the quiet stretches', () => {
  for (const st of stages) {
    const traps = st.waves.filter((w) => w.type === 'trap');
    if (st.skin === 'beppu') {
      assert.equal(traps.length, 0);
      continue;
    }
    assert.ok(traps.length >= 8 && traps.length <= 14, `${st.id}: ${traps.length}`);
    const fights = st.waves.filter((w) => w.type === 'heavy' || w.type === 'boss');
    for (const w of traps) {
      assert.ok(w.x >= 20 && w.x <= 160, `${st.id} x ${w.x}`);
      for (const f of fights) {
        // (a trap is on the screen some 13 s; a fight on a held arena stops the clock, one on the move lasts a while)
        const after = f.type === 'boss' ? Infinity : f.hold ? 0 : 45;
        assert.ok(w.t < f.t - 13 || w.t > f.t + after, `${st.id}: trap at ${w.t} s by the ${f.type} at ${f.t} s`);
      }
      if (st.interlude?.title) assert.ok(w.t < st.interlude.from - 13 || w.t > st.interlude.to, `${st.id}: trap at ${w.t} s in the quiet stretch`);
    }
    // (sorted in with the other waves)
    const ts = st.waves.map((w) => w.t);
    assert.deepEqual(ts, [...ts].sort((a, b) => a - b), st.id);
  }
});
