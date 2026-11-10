// The cities' enemies drawn at 540 px (docs/enemies-540-plan.md): every frame three times the size of the old
// one of the same name (so the game's pivots and hit circles stay put), every animation the city atlas takes
// over complete in it, the album's and the parade's portraits there.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CITY_ANIMS } from '../../src/game/enemyArt.js';
import { YOKAI } from '../../src/data/discoveries.js';

const read = (p) => JSON.parse(readFileSync(new URL(`../../${p}`, import.meta.url)));
const legacy = read('public/assets/sprites.json').frames;
const portraits = read('public/assets/portraits.json').frames;
const cities = Array.from({ length: 8 }, (_, i) => read(`src/data/stage${i + 1}.json`)).filter((st) => st.enemyArt);

test('some city has its enemies at 540 px', () => assert(cities.length > 0));

for (const st of cities) {
  const frames = read(`public/assets/bg/${st.id}/enemies.json`).frames;
  test(`${st.id}: every frame is three times its old size`, () => {
    for (const [name, f] of Object.entries(frames)) {
      const old = legacy[name];
      if (!old) continue; // a frame new at 540 px (a longer animation)
      assert.equal(f.frame.w, old.frame.w * 3, `${name} width`);
      assert.equal(f.frame.h, old.frame.h * 3, `${name} height`);
    }
  });
  test(`${st.id}: every enemy the city shows has its frames, every animation it takes over is complete`, () => {
    for (const [key, [list]] of Object.entries(CITY_ANIMS)) {
      const have = list.filter((f) => frames[f]);
      assert(have.length === 0 || have.length === list.length, `${key}: only ${have.length} of ${list.length} frames`);
    }
  });
  test(`${st.id}: the album's portraits are drawn at 540 px too`, () => {
    for (const y of YOKAI.filter((e) => e.stage === st.id)) {
      if (!frames[y.frame]) continue;
      assert(portraits[y.frame], `portrait ${y.frame}`);
      assert.equal(portraits[y.frame].frame.w, frames[y.frame].frame.w);
    }
  });
}
