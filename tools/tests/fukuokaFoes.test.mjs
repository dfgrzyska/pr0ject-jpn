// Fukuoka's three new ones (src/game/enemies/chainSplitCart.js, docs/plan-fukuoka.md phase 10): the lanterns on a rope burn
// one after another outward from the one shot, a run paying more each, and catch a rope crossing close by; the pair
// of mentaiko shot apart gives two sacs and no more, and a sac spills its roe; the oboro-guruma breaks up in its
// stages and keeps to its street. Their frames are all in the city's atlas.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { burnOrder, cartStage, catching, chainSplitCart as fukuoka, ropeAt } from '../../src/game/enemies/chainSplitCart.js';
import { CART, CHAIN, ENEMIES, SPLIT, SPLIT_ONE } from '../../src/config.js';
import { SKINS } from '../../src/game/skins.js';
import { Waves, PACKED } from '../../src/game/Waves.js';

const atlas = JSON.parse(readFileSync(new URL('../../public/assets/bg/stage12/enemies.json', import.meta.url)));
const names = new Set(Array.isArray(atlas.frames) ? atlas.frames.map((f) => f.filename) : Object.keys(atlas.frames));

/** A stand-in for Enemies (its pool, scene and effects) with Fukuoka's behaviours mixed in. */
function world() {
  const calls = { coins: 0, chain: [], text: 0 };
  const sprite = (o) => ({ dead: false, age: 0, base: 1, x: 0, y: 0, play() {}, setDepth() { return this; }, setRotation(r) { this.rot = r; return this; }, setScale() { return this; }, ...o });
  const w = {
    ...fukuoka,
    scene: {
      H: 320,
      t: 0,
      parallax: { uTop: 1000, screenY: (u) => 1000 - u, stripU: (y) => 1000 - y },
      score: { mult: 1, add() {} },
      fx: { light() {}, text: () => calls.text++, smoke() {}, spark() {}, coin: () => calls.coins++, debris() {}, shards() {} },
      sfx: { chain: (k) => calls.chain.push(k), squelch() {}, creak() {} },
      cameras: { main: { shake() {} } },
      spawnPickup() {},
    },
    pool: { live: [], spawn: (frame, x, y, props) => { const s = sprite({ frame, x, y, ...props }); w.pool.live.push(s); return s; }, reframe: (s) => s },
    wrecks: { spawn: () => sprite() },
    canFire: () => false,
    aimAt: () => Math.PI / 2,
    calls,
  };
  return w;
}

/** A rope of n lanterns hung in the world (as spawnChain hangs them), returned in order along it. */
function hang(w, n, x = 20, skew = 0, y = 100) {
  const look = SKINS.fukuoka.chain;
  w.scene.parallax.stripU = () => 1000 - y;
  w.spawnChain({ x, n, skew }, { type: 'chain', hp: 8, fuse: 0, chainK: 0 }, look);
  return w.pool.live.filter((e) => e.type === 'chain').slice(-n);
}

test('a rope burns outward from the lantern shot, both ways, one step at a time', () => {
  const order = burnOrder(7, 2);
  assert.deepEqual(order.map(([i]) => i).sort(), [0, 1, 3, 4, 5, 6]);
  for (const [i, k] of order) assert.equal(k, Math.abs(i - 2));
  for (let j = 1; j < order.length; j++) assert.ok(order[j][1] >= order[j - 1][1]);

  // and in play: shot at its third lantern, the rope goes up in burnOrder's steps, each burning paying more
  const w = world();
  const ls = hang(w, 7);
  const burnt = [];
  w.destroy = (e) => {
    e.dead = true;
    burnt.push([e.slot, e.chainK]);
    w.chainDown(e);
  };
  w.destroy(ls[2]);
  for (let t = 0; t < 3; t += 1 / 60) for (const e of ls) if (!e.dead) w.chain(e, 1 / 60, null);
  assert.ok(ls.every((e) => e.dead), 'the whole rope burnt');
  assert.deepEqual(burnt.slice(1).map(([i]) => i).sort(), [0, 1, 3, 4, 5, 6]);
  for (const [i, k] of burnt) assert.equal(k, Math.abs(i - 2), `lantern ${i} burnt at step ${k}`);
  assert.deepEqual(w.calls.chain, burnt.slice(1).map(([, k]) => k), 'a chime for each in the run, rising');
});

test('a burning lantern sets a rope crossing close by alight, not one further off', () => {
  const w = world();
  const a = hang(w, 5, 20, 0, 100);
  // a second rope, slanting up across the first: its middle lantern hangs close to the first rope's middle one
  const b = hang(w, 5, 30, 0, 100 - CHAIN.cross * 0.5);
  const c = hang(w, 5, 20, 0, 100 - CHAIN.cross * 3);
  assert.ok(a.every((l) => l.rope === a[0].rope) && b[0].rope !== a[0].rope);
  for (const l of w.pool.live) l.y = 1000 - l.u;
  const near = catching(w.pool.live, a[2], CHAIN.cross);
  assert.ok(near.length > 0 && near.every((l) => l.rope === b[0].rope));
  assert.ok(!near.some((l) => l.rope === c[0].rope));
  w.destroy = (e) => {
    e.dead = true;
    w.chainDown(e);
  };
  w.destroy(a[2]);
  for (let t = 0; t < 4; t += 1 / 60) for (const e of w.pool.live) if (!e.dead) w.chain(e, 1 / 60, null);
  assert.ok(b.every((l) => l.dead), 'the crossing rope burnt too');
  assert.ok(c.every((l) => !l.dead), 'the far rope did not');
});

test('the rope sags between its poles, the lanterns hanging on it', () => {
  const r = { u: 500, x1: 20, x2: 160, skew: 0, sag: CHAIN.sag };
  assert.deepEqual(ropeAt(r, 0), [20, 500]);
  assert.deepEqual(ropeAt(r, 1), [160, 500]);
  assert.ok(ropeAt(r, 0.5)[1] < 500, 'lower on the screen in the middle');
});

test('a mentaiko pair shot apart gives two sacs, which give none; a sac spills its roe; a bomb takes it whole', () => {
  const w = world();
  const look = SKINS.fukuoka.split;
  const pair = w.spawnSplit({ x: 90 }, { type: 'split', def: ENEMIES.split, hp: 26, pack: { n: 3, hit: 0, lost: false }, x0: 90 }, look);
  w.splitDown(pair, false);
  const sacs = w.pool.live.filter((e) => e.one);
  assert.equal(sacs.length, 2);
  assert.equal(pair.pack.n, 5, 'its two sacs join its wave');
  assert.ok(sacs.every((s) => s.pack === pair.pack && s.def === SPLIT_ONE && s.hp === SPLIT_ONE.hp));
  assert.ok(sacs[0].vx < 0 && sacs[1].vx > 0, 'out to either side');
  w.splitDown(sacs[0], false);
  assert.equal(w.pool.live.filter((e) => e.one).length, 2, 'a sac shot down gives no more');
  assert.equal(w.calls.coins, SPLIT.roe);

  // the sacs take aim and dive at the ship
  const s = sacs[1];
  for (let t = 0; t < 1; t += 1 / 60) w.split(s, 1 / 60, null);
  assert.equal(s.state, 'dive');
  assert.ok(Math.hypot(s.vx, s.vy) > SPLIT.dive * 0.99);

  // a lone pair becomes a wave of three; a bomb gives nothing
  const w2 = world();
  const lone = w2.spawnSplit({ x: 90 }, { type: 'split', def: ENEMIES.split, hp: 26, pack: null, x0: 90 }, look);
  w2.splitDown(lone, false);
  assert.equal(w2.pool.live.filter((e) => e.one)[0].pack.n, 3);
  const w3 = world();
  w3.splitDown(w3.spawnSplit({ x: 90 }, { type: 'split', def: ENEMIES.split, hp: 26, x0: 90 }, look), true);
  assert.equal(w3.pool.live.filter((e) => e.one).length, 0);
});

test('the oboro-guruma breaks up in three stages and keeps to its street', () => {
  assert.equal(cartStage(150, 150), 0);
  assert.equal(cartStage(150 * CART.stages[0], 150), 1);
  assert.equal(cartStage(150 * CART.stages[1] - 1, 150), 2);
  assert.equal(cartStage(1, 150), 3);
  const look = SKINS.fukuoka.cart;
  for (const horiz of [false, true]) {
    const w = world();
    const e = w.spawnCart(horiz ? { dir: 1, y: 120 } : { x: 70 }, { type: 'cart', hp: 150, maxHp: 150, age: 0, shots: 0, cartStage: 0 }, look);
    const [x0, u0] = [e.x, e.u];
    for (let t = 0; t < 4; t += 1 / 60) {
      e.age += 1 / 60;
      if (t > 2) e.hp = 10; // (shot to pieces half way: it limps on, on the same line)
      w.cart(e, 1 / 60, null);
    }
    assert.equal(e.cartStage, 3);
    if (horiz) {
      assert.equal(e.u, u0, 'across: on its street');
      assert.ok(e.x > x0);
    } else {
      assert.equal(e.x, x0, 'down: on its avenue');
      assert.ok(e.u < u0);
    }
  }
});

test('the three are Fukuoka\'s (and Onomichi\'s, Kyoto\'s, Okinawa\'s, Nagasaki\'s, Kawaguchiko\'s; Sapporo, Kagoshima, Osaka and Beppu have two), in waves, their frames in each one\'s atlas', () => {
  const cities = { fukuoka: 'stage12', onomichi: 'stage11', kyoto: 'stage1', okinawa: 'stage2', nagasaki: 'stage8', kawaguchiko: 'stage10', sapporo: 'stage3', kagoshima: 'stage4', osaka: 'stage5', beppu: 'stage6' };
  const without = { cart: new Set(['sapporo']), split: new Set(['kagoshima', 'osaka', 'beppu']) }; // (snowploughs; bombs that split; manzai duos; eggs that hatch)
  for (const t of ['chain', 'split', 'cart']) {
    assert.ok(ENEMIES[t] && PACKED.has(t), t);
    for (const city of Object.keys(SKINS)) if (!cities[city] || without[t]?.has(city)) assert.equal(SKINS[city][t], undefined, `${city} has no ${t}`);
  }
  for (const [city, stage] of Object.entries(cities)) {
    const a = stage === 'stage12' ? atlas : JSON.parse(readFileSync(new URL(`../../public/assets/bg/${stage}/enemies.json`, import.meta.url)));
    const has = new Set(Array.isArray(a.frames) ? a.frames.map((f) => f.filename) : Object.keys(a.frames));
    const { chain, split, cart } = SKINS[city];
    for (const f of [chain.frame, `${chain.eye}0`, `${chain.eye}1`, `${chain.lit}0`, `${chain.lit}1`, chain.burnt, chain.pole]) assert.ok(has.has(f), `${city}: ${f}`);
    if (split) for (const f of [split.frame, split.one]) assert.ok(has.has(f), `${city}: ${f}`);
    for (const f of chain.frames ?? []) assert.ok(has.has(f), `${city}: ${f}`);
    if (!cart) continue;
    assert.ok(has.has(cart.wreck), `${city}: ${cart.wreck}`);
    for (let st = 0; st < 4; st++) for (let f = 0; f < 2; f++) assert.ok(has.has(`${cart.anim}${st}_${f}`), `${city}: ${cart.anim}${st}_${f}`);
    if (cart.runner) for (let f = 0; f < 2; f++) assert.ok(has.has(`${cart.runner.anim}_${f}`), `${city}: ${cart.runner.anim}_${f}`);
  }
  // a rope is one wave of all its lanterns
  const w = new Waves([{ t: 1, type: 'chain', x: 20, n: 5 }]);
  const out = [];
  w.update(9, (q) => out.push(q));
  assert.equal(out[0].pack.n, 5);
  assert.equal(Waves.totalWeight([{ t: 1, type: 'chain', x: 20, n: 5 }]), 5 * ENEMIES.chain.weight);
});
