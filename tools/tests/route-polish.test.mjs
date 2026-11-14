import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Parallax } from '../../src/game/Parallax.js';
import { Props } from '../../src/game/Props.js';

const stage = JSON.parse(readFileSync(new URL('../../src/data/stage7.json', import.meta.url)));
test('Hiroshima silence starts at the Dome, lasts 11.5 seconds and preserves later scenery timing', () => {
  const p = { speed: stage.scroll, maxTime: 300 };
  const u = t => { Parallax.prototype.setTime.call(p, t); return stage.scroll.anchor + p.time * stage.scroll.mid; };
  assert.equal(stage.interlude.to - stage.interlude.from, 11.5);
  assert.equal(u(stage.interlude.from), 1245); // Dome block starts at 1246.
  assert(Math.abs(u(stage.interlude.to) - 2055) < 1e-8);
  assert(!stage.waves.some(w => w.t >= stage.interlude.from && w.t < stage.interlude.to));
  assert.equal(u(stage.waves.find(w => w.type === 'heavy').t), 3540);
  for (const t of [0, 27.5, 33, 39, 88.5]) {
    u(t);
    assert.equal(p.scrollClock, t, 'debug/restart retains real elapsed time');
  }
});

test('Hiroshima silence: the fight winds down into it and out of it, and the scroll glides rather than jumps', () => {
  const { interlude: q, scroll } = stage;
  assert(q.lead >= 2 && q.after >= 1);
  assert(!stage.waves.some(w => w.t >= q.from - q.lead && w.t < q.to), 'no spawns in the wind-down (the first ones back come in holding their fire)');
  const p = { speed: scroll, maxTime: 300 };
  const u = t => { Parallax.prototype.setTime.call(p, t); return p.time; };
  const dt = 0.05;
  let last = 1;
  for (let t = q.from - 2; t < q.to + 2; t += dt) {
    const v = (u(t + dt) - u(t)) / dt;
    assert(Math.abs(v - last) < 0.12, `scroll speed jumps at t=${t.toFixed(2)}`);
    last = v;
  }
});

test('Osaka canal boats face their direction of travel on both legs of the route', () => {
  const meta = JSON.parse(readFileSync(new URL('../../public/assets/bg/stage5/meta.json', import.meta.url)));
  const boats = meta.props.filter(p => p.k === 'path' && p.turn === 'vertical');
  assert.equal(boats.length, 3);
  for (const src of boats) {
    const p = Props.prototype.prepare.call({}, src);
    let flipped;
    p.objs = [{ setFlipY(v) { flipped = v; return this; }, setPosition() { return this; }, setAlpha() { return this; } }];
    p.wake = null;
    const props = { time: 0, at: Props.prototype.at, setFrame() {}, snap: x => x, px: { screenY: u => -u }, alphaOf: () => 1 };
    const run = p.total / p.sp;
    props.time = run * (0.5 - p.s0);
    Props.prototype.path.call(props, p);
    assert.equal(flipped, false, 'northbound: bow up');
    props.time += run + p.hold;
    Props.prototype.path.call(props, p);
    assert.equal(flipped, true, 'southbound: bow down');
  }
});
