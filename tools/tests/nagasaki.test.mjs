import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { SKINS } from '../../src/game/skins.js';
import { SONGS8 } from '../../src/audio/score8.js';
import { nagasaki } from '../../src/game/enemies/nagasaki.js';
import { NagasakiView } from '../../src/game/NagasakiView.js';
const json = path => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const stage = json('../../src/data/stage8.json');
const atlas = json('../../public/assets/sprites.json').frames;

test('Nagasaki assets, music and quiet memorial interval are complete', () => {
  for (const look of Object.values(SKINS.nagasaki)) {
    if (typeof look !== 'object') continue;
    for (const key of ['frame', 'base', 'wreck']) if (look[key]) {
      for (const c of ['red', 'green', 'blue']) assert(atlas[look[key].replace('{c}', c)], look[key]);
    }
    if (look.head) for (let i = 0; i < 16; i++) assert(atlas[look.head + i]);
  }
  for (const key of ['n_ja_0', 'n_segment', 'n_pearl', 'n_traffic', 'n_view_ferry_0', 'n_view_ferry_1', 'n_view_wake', 'seal_stage8', 'stamp_stage8', 'food_castella', 'food_champon']) assert(atlas[key], key);
  for (const song of Object.values(SONGS8)) for (const bars of Object.values(song.tracks)) for (const bar of bars) assert.equal(bar.split(' ').length, 16, bar);
  assert(!stage.waves.some(w => w.t >= stage.interlude.from && w.t < stage.interlude.to));
  assert(stage.scroll.anchor + stage.interlude.from * stage.scroll.mid <= 4620);
  const boss = stage.waves.find(w => w.type === 'boss');
  assert(boss.t > stage.interlude.to);
  assert(stage.waves.every(w => w.t <= boss.t));
  const meta = json('../../public/assets/bg/stage8/meta.json');
  assert.equal(meta.panorama.length, 7);
  for (const n of meta.panorama) assert(statSync(new URL(`../../public/assets/bg/stage8/view_${n}.png`, import.meta.url)).size > 0);
});

const object = () => ({ x: 0, y: 0, alpha: 1, visible: true,
  setOrigin() { return this; }, setDepth() { return this; },
  setFrame() { return this; },
  setVisible(v) { this.visible = v; return this; },
  setAlpha(a) { assert(a >= 0 && a <= 1); this.alpha = a; return this; },
  setPosition(x, y) { this.x = x; this.y = y; return this; },
});
test('Inasa waits for victory and ascent, holds for 20s after reveal, reuses fixed objects', () => {
  globalThis.location = { search: '' };
  let allocated = 0, banners = 0;
  const make = () => { allocated++; return object(); };
  const s = { stage, H: 320, bossDown: false, parallax: { uTop: 7000 }, hud: { show() { banners++; } },
    add: { image: make, blitter() { return Object.assign(make(), { create: make }); } } };
  const view = new NagasakiView(s), count = allocated;
  view.update(10); assert.equal(view.t, 0);
  s.bossDown = true; s.parallax.uTop = 6699; view.update(10); assert.equal(view.t, 0);
  s.parallax.uTop = 6700;
  for (let i = 0; i < 1500; i++) view.update(1 / 60);
  assert.equal(view.done, false); assert.equal(banners, 1); assert.equal(allocated, count);
  s.H = 420; view.update(2); assert.equal(view.done, true);
  assert.equal(view.layers[0].y, 0);
  globalThis.location.search = '?noprops';
  const still = new NagasakiView(s); still.update(7); assert.equal(still.traffic.visible, false);
});

test('glass volley visibly pauses before turning and stops firing during ceasefire', () => {
  let shots = [];
  const e = { state: 'attack', timer: 0, shots: 0, x: 50, y: 60, dir: 1 };
  const context = { canFire: () => false };
  const b = { shot: (...args) => shots.push(args) };
  nagasaki.biidoro.call(context, e, .1, b); assert.equal(shots.length, 0);
  context.canFire = () => true;
  nagasaki.biidoro.call(context, e, .1, b); assert.equal(shots.length, 5);
  for (const shot of shots) { assert(shot[6].frz.hold > 0); assert.equal(shot[6].frz.turn, .45); }
  for (let i = 0; i < 300; i++) nagasaki.biidoro.call(context, e, .02, b);
  assert.equal(e.state, 'leave'); assert.equal(shots.length, 15);
});
