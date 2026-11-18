// Onomichi's fireworks (src/game/Hanabi.js, tools/art/onomichi/hanabi.mjs): the stage turns them on, they go up from
// its two barges on the strait (the plots where the barges are drawn), clear of where the ghost ship comes up, every
// frame they use is in the city's atlas, and there is a cap on the stars at once.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PLOTS, ARENAS, isSea } from '../art/onomichi/route.mjs';

const stage = JSON.parse(readFileSync(new URL('../../src/data/stage11.json', import.meta.url)));
const frames = JSON.parse(readFileSync(new URL('../../public/assets/bg/stage11/enemies.json', import.meta.url))).frames;
const code = readFileSync(new URL('../../src/game/Hanabi.js', import.meta.url), 'utf8');

test('the shells go up from the barges, on the water, below the ship', () => {
  const H = stage.hanabi;
  assert.ok(H && H.max > 0 && H.max <= 400, 'a cap on the stars');
  const barges = PLOTS.filter((p) => p[0].startsWith('hanabi_dai'));
  assert.equal(H.barges.length, barges.length);
  const [, au, , r] = ARENAS.find((a) => a[2] === 'FUNA-YUREI');
  for (const [x, u] of H.barges) {
    assert.ok(barges.some(([, bx, bu, w, h]) => x >= bx && x <= bx + w && u >= bu - 1 && u <= bu + h), `(${x}, ${u}) on a barge`);
    assert.ok(isSea(x, u), `(${x}, ${u}) on the water`);
    assert.ok(au - u > r, 'below where the ship comes up');
  }
});

test('every frame the fireworks name is in the city atlas, and the stage makes them', () => {
  const named = [...code.matchAll(/'(hb_[a-z_]+)'/g)].map((m) => m[1]);
  assert.ok(named.length >= 4);
  for (const f of named) assert.ok(frames[f], f);
  for (const f of [0, 1, 2]) assert.ok(frames[`hb_smoke_${f}`]);
  assert.ok(readFileSync(new URL('../../src/scenes/Stage.js', import.meta.url), 'utf8').includes('new Hanabi(this, this.stage.hanabi)'));
});
