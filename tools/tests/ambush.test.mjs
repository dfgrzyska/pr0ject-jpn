// Every city but Kagoshima (whose kappa does it already) has an ambusher hiding in its map (src/game/enemies/ambush.js):
// each skin names it, its five frames are in both shared atlases; each stage places 4 to 10 of them, never where a
// fight is coming or going on, nor in a titled quiet stretch (Hiroshima's Peace Park, Nagasaki's remembrance).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SKINS } from '../../src/game/skins.js';
import { AMBUSH } from '../../src/game/enemies/ambush.js';

const json = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const hi = json('../../public/assets/sprites540.json').frames;
const lo = json('../../public/assets/sprites.json').frames;
const stages = Array.from({ length: 9 }, (_, i) => json(`../../src/data/stage${i + 1}.json`));

test('every city but Kagoshima has an ambusher, drawn in five frames', () => {
  for (const st of stages) {
    const look = SKINS[st.skin].ambush;
    if (st.skin === 'kagoshima') {
      assert.equal(look, undefined);
      continue;
    }
    assert.ok(look, st.skin);
    assert.equal(look.frames.length, 5);
    for (const f of look.frames) assert.ok(hi[f] && lo[f], f);
  }
});

test('4 to 10 ambushers a stage, clear of the fights and the quiet stretches, waking where they may shoot', () => {
  assert.ok(AMBUSH.wake < 320 * 0.5 - 40, 'it wakes high enough on the smallest screen to shoot before the fair line');
  for (const st of stages) {
    const ambushes = st.waves.filter((w) => w.type === 'ambush');
    if (st.skin === 'kagoshima') {
      assert.equal(ambushes.length, 0);
      continue;
    }
    assert.ok(ambushes.length >= 4 && ambushes.length <= 10, `${st.id}: ${ambushes.length}`);
    const fights = st.waves.filter((w) => w.type === 'heavy' || w.type === 'boss');
    for (const w of ambushes) {
      assert.ok(w.x >= 14 && w.x <= 166, `${st.id} x ${w.x}`);
      for (const f of fights) {
        const after = f.type === 'boss' ? Infinity : f.hold ? 0 : 45;
        assert.ok(w.t < f.t - 13 || w.t > f.t + after, `${st.id}: ambush at ${w.t} s by the ${f.type} at ${f.t} s`);
      }
      if (st.interlude?.title) assert.ok(w.t < st.interlude.from - 13 || w.t > st.interlude.to, `${st.id}: ambush at ${w.t} s in the quiet stretch`);
    }
  }
});
