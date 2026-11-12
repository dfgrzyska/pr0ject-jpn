// The shared sprites at 540 px (docs/graphics-540-plan.md, step 6): every frame in sprites540 replaces one of the
// same name in sprites.png at exactly three times its size (so pivots, hit circles and offsets stay put), and
// every animation of shared frames is either wholly in sprites540 or wholly not.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => JSON.parse(readFileSync(new URL(`../../${p}`, import.meta.url)));
const legacy = read('public/assets/sprites.json').frames;
const hi = read('public/assets/sprites540.json').frames;
const boot = readFileSync(new URL('../../src/scenes/Boot.js', import.meta.url), 'utf8');

test('every sprites540 frame is three times its namesake in sprites.png', () => {
  assert(Object.keys(hi).length > 0);
  for (const [name, f] of Object.entries(hi)) {
    const old = legacy[name];
    assert(old, `${name} is not in sprites.png`);
    assert.equal(f.frame.w, old.frame.w * 3, `${name} width`);
    assert.equal(f.frame.h, old.frame.h * 3, `${name} height`);
  }
});

test('the shared animations are whole in sprites540 or not in it at all', () => {
  // anim('key', [frames...]) and anim('key', [0, 1, 2].map((i) => `name_${i}`)) in Boot
  for (const m of boot.matchAll(/anim\('([a-z_0-9]+)', \[([0-9, ]+)\]\.map\(\(i\) => `([a-z_0-9]+)_\$\{i\}`\)/g)) {
    const frames = m[2].split(',').map((i) => `${m[3]}_${i.trim()}`);
    const have = frames.filter((f) => hi[f]).length;
    assert(have === 0 || have === frames.length, `${m[1]}: ${have} of ${frames.length} frames in sprites540`);
  }
});
