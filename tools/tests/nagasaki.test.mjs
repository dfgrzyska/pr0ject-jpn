import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { SKINS } from '../../src/game/skins.js';
import { SONGS8 } from '../../src/audio/score8.js';
import { encounters } from '../../src/game/enemies/encounters.js';
import { nagasaki } from '../../src/game/enemies/nagasaki.js';
import { NagasakiView } from '../../src/game/NagasakiView.js';
import { Parallax } from '../../src/game/Parallax.js';
import { LANDMARKS } from '../../src/data/landmarks.js';
import * as geo from '../art/nagasaki/geo.mjs';
const json = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const stage = json('../../src/data/stage8.json');
const atlas = json('../../public/assets/sprites.json').frames;
const meta = json('../../public/assets/bg/stage8/meta.json');
const { W } = geo;

/** Stage time at which the strip reaches strip position u (with the climb's easing at the end). */
function timeAt(u) {
  const { anchor, mid } = stage.scroll;
  const p = { speed: stage.scroll, anchor, maxTime: (meta.length - anchor) / mid, uTop: anchor };
  let t = 0;
  let time = 0;
  while (p.uTop < u && t < 400) {
    time = Math.min(time + (1 / 60) * Parallax.prototype.rate.call(p), p.maxTime);
    p.uTop = anchor + time * mid;
    t += 1 / 60;
  }
  return t;
}

test('Nagasaki assets, music, landmarks and the quiet memorial interval', () => {
  for (const look of Object.values(SKINS.nagasaki)) {
    if (typeof look !== 'object') continue;
    for (const key of ['frame', 'base', 'wreck']) if (look[key]) for (const c of ['red', 'green', 'blue']) assert(atlas[look[key].replace('{c}', c)], look[key]);
    if (look.head) for (let i = 0; i < 16; i++) assert(atlas[look.head + i]);
  }
  for (const key of ['n_ja_0', 'n_segment', 'n_pearl', 'n_traffic', 'n_view_ferry_0', 'n_view_ferry_1', 'n_view_wake', 'n_oranda_0', 'n_oranda_1', 'n_oranda_gun_0', 'n_oranda_gun_1', 'n_oranda_burnt', 'n_keg_0', 'n_keg_1', 'seal_stage8', 'stamp_stage8', 'food_castella', 'food_champon'])
    assert(atlas[key], key);
  for (const song of Object.values(SONGS8)) for (const bars of Object.values(song.tracks)) for (const bar of bars) assert.equal(bar.split(' ').length, 16, bar);
  // the Peace Park is a short quiet stretch, with no wave in it, the statue on screen during it
  const { from, to } = stage.interlude;
  assert(to - from <= 15, 'the memorial stretch stays short');
  assert(!stage.waves.some((w) => w.t >= from && w.t < to));
  const uFrom = stage.scroll.anchor + from * stage.scroll.mid;
  assert(uFrom > 4800 && uFrom < 4950, `the quiet begins over the park (${uFrom})`);
  assert.equal(meta.panorama.length, 8);
  for (const n of meta.panorama) assert(statSync(new URL(`../../public/assets/bg/stage8/view_${n}.png`, import.meta.url)).size > 0);
  // landmarks cover the strip in order without gaps
  const lm = LANDMARKS.stage8;
  for (let i = 1; i < lm.length; i++) assert.equal(lm[i][0], lm[i - 1][1], lm[i][2]);
});

test('Meganebashi keeps regular waves throughout the bridge approach', () => {
  const start = timeAt(3660);
  const end = timeAt(4270);
  const waves = stage.waves.filter(w => w.t >= start && w.t <= end);
  assert(waves.length >= 6);
  const times = [start, ...waves.map(w => w.t), end];
  for (let i = 1; i < times.length; i++) assert(times[i] - times[i - 1] <= 4);
  assert(!waves.some(w => w.type === 'heavy' || w.type === 'boss'));
});

test('the dragon comes once the climb has crested Inasa and the view has risen', () => {
  const boss = stage.waves.find((w) => w.type === 'boss');
  const crest = timeAt(stage.panorama.ridge + 1);
  const stop = timeAt(meta.length - 2);
  assert(boss.t > crest + 10, `the view rises for a while first (crest ${crest.toFixed(1)}, boss ${boss.t})`);
  assert(boss.t - 3 <= stop + 1 && boss.t >= stop - 6, `the boss card comes as the climb stops (${stop.toFixed(1)})`);
  assert(stage.waves.every((w) => w.t <= boss.t));
  // there is something to shoot on the way up, but not much
  const climb = stage.waves.filter((w) => w.t > timeAt(5700) && w.t < boss.t);
  assert(climb.length >= 5 && climb.length <= 10, `${climb.length} waves on the climb`);
  assert(!climb.some((w) => w.type === 'turret' || w.type === 'heavy'));
});

test('every enemy of a row starts on the screen; turrets stand on land, off the roads', () => {
  for (const w of stage.waves) {
    if (w.path !== 'row') continue;
    const n = w.count ?? 1;
    for (let k = 0; k < n; k++) {
      const x = w.x + (k - (n - 1) / 2) * (w.spacing ?? 22);
      assert(x >= 8 && x <= W - 8, `wave at ${w.t}: x = ${x}`);
    }
  }
  const { anchor, mid } = stage.scroll;
  for (const w of stage.waves.filter((v) => v.type === 'turret')) {
    const u = anchor + mid * w.t + 10;
    for (const [dx, du] of [[0, 0], [-8, 0], [8, 0], [0, -8], [0, 8]]) assert(!geo.isWater(w.x + dx, u + du), `turret ${w.t} on water`);
    if (u > 960 && u < 5200) assert(Math.abs(w.x - geo.r1X(u)) > geo.R1_HW + 10, `turret ${w.t} on R1`);
    for (const s of geo.STREETS) assert(Math.abs(u - s.u) > s.hw + 9, `turret ${w.t} on the street at ${s.u}`);
  }
});

test('the map hangs together: roads, the river and the tramway lead somewhere', () => {
  // R1 comes in and goes out off the east edge; every cross street runs edge to edge across it
  assert(geo.R1[0][0] > W && geo.R1.at(-1)[0] > W);
  for (const s of geo.STREETS) assert(s.u > 900 && s.u < geo.RIDGE);
  // the river: from the embankment at Dejima's channel to off the west edge
  assert(geo.riverX(geo.RIVER[1]) + geo.riverHW(geo.RIVER[1]) < 0);
  assert(geo.isWater(geo.riverX(geo.EMBANK + 5), geo.EMBANK + 5) && geo.isWater(geo.riverX(geo.EMBANK - 5), geo.EMBANK - 5));
  for (let u = geo.EMBANK; u < 4290; u += 10) assert(geo.isWater(Math.round(geo.riverX(u)), u), `river at ${u}`);
  // the bay round Dejima reaches the open harbour on the west; the fan is land in water
  assert(geo.isWater(2, 2900) && !geo.isWater(geo.DEJIMA.cx, 2870) && geo.isWater(geo.DEJIMA.cx, 2780));
  // the driveway from the roundabout to the car park
  const [x0, u0] = geo.DRIVE[0];
  const [x1, u1] = geo.DRIVE.at(-1);
  assert(Math.hypot(x0 - geo.FUCHI.x, u0 - geo.FUCHI.u) <= geo.FUCHI.r + 2);
  assert(x1 >= geo.PARK.x0 && x1 <= geo.PARK.x1 && u1 >= geo.PARK.u0 && u1 <= geo.PARK.u1);
  // nothing that moves on the strip appears or vanishes in the middle of it: a route either turns back at its
  // ends (boats, gondolas, walkers), comes round in a loop, or starts and ends off the screen
  const off = ([x]) => x < -4 || x > W + 4;
  const same = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 1;
  let routes = 0;
  for (const p of meta.props.filter((q) => q.k === 'path' && q.mode !== 'pp')) {
    routes++;
    const a = p.pts[0];
    const b = p.pts.at(-1);
    assert(same(a, b) || (off(a) && off(b)), `route from ${a} to ${b}`);
  }
  assert(routes >= 15, `${routes} through routes`);
});

const object = () => ({
  x: 0, y: 0, alpha: 1, visible: true,
  setOrigin() { return this; }, setDepth() { return this; }, setFrame() { return this; },
  setScale() { return this; }, setBlendMode() { return this; }, setTint() { return this; },
  setVisible(v) { this.visible = v; return this; },
  setAlpha(a) { assert(a >= 0 && a <= 1, `alpha ${a}`); this.alpha = a; return this; },
  setPosition(x, y) { this.x = x; this.y = y; return this; },
});
test('the Inasa view rises from behind the ridge, dims for the dragon, flares when it falls, then ends', () => {
  globalThis.location = { search: '' };
  let allocated = 0;
  let banners = 0;
  const make = () => {
    allocated++;
    return object();
  };
  const ridge = stage.panorama.ridge;
  const s = {
    stage, H: 420, t: 0, bossDown: false, player: { alive: true, x: 90 },
    parallax: { uTop: ridge - 50, length: 7168 }, enemies: { bossGroup: null }, hud: { show() { banners++; } },
    add: { image: make, rectangle: make, blitter() { return Object.assign(make(), { create: make }); } },
  };
  const view = new NagasakiView(s);
  const count = allocated;
  view.update(0.1);
  assert(view.layers.every((l) => !l.visible), 'hidden below the ridge');
  // rising: the sky stays put, the city slides up, the near slope comes last
  const at = (u) => {
    s.parallax.uTop = u;
    view.update(1 / 60);
    return view.layers.map((l) => l.y);
  };
  const early = at(ridge + 80);
  const late = at(ridge + 300);
  const full = at(7168);
  assert(view.layers.every((l) => l.visible));
  assert.equal(early[0], late[0]);
  assert(early[1] > late[1] && late[1] > full[1] && full[1] === 0);
  assert(early[6] - full[6] > early[1] - full[1], 'the near slope moves the most');
  // the ship drifting left pulls the near layer more than the sky
  s.player.x = 10;
  for (let i = 0; i < 300; i++) view.update(1 / 60);
  assert(view.layers[6].x - view.layers[0].x > 8);
  // the fight dims it
  s.enemies.bossGroup = { defeated: false };
  for (let i = 0; i < 300; i++) view.update(1 / 60);
  assert(view.shade.alpha > 0.3);
  assert.equal(view.done, false);
  // victory: the lights flare, the shade lifts, the name comes up once, then it is over
  s.enemies.bossGroup.defeated = true;
  s.bossDown = true;
  view.update(1 / 60);
  assert(view.layers[2].alpha > 0.9);
  for (let i = 0; i < 60 * (stage.panorama.hold - 0.5); i++) view.update(1 / 60);
  assert(view.shade.alpha < 0.05);
  assert.equal(banners, 1);
  assert.equal(view.done, false);
  for (let i = 0; i < 60; i++) view.update(1 / 60);
  assert.equal(view.done, true);
  assert.equal(allocated, count, 'no objects made after the start');
  globalThis.location.search = '?noprops';
  const still = new NagasakiView(s);
  still.update(0.1);
  assert(still.points.every((p) => !p.visible), 'nothing moves with ?noprops');
});

/** A fake enemies context for the float: records shots, telegraphs and lobs. */
function float() {
  const sprite = (x = 0, y = 0) => ({
    x, y, rotation: 0, dead: false,
    setPosition(a, b) { this.x = a; this.y = b; return this; },
    setRotation(r) { this.rotation = r; return this; }, setFrame() { return this; }, setFlipX() { return this; }, setDepth() { return this; },
  });
  const shots = [];
  const lobs = [];
  const ctx = {
    ...nagasaki,
    scene: { H: 420, player: { x: 120, y: 360 }, fx: { text() {}, smoke() {}, puff() {} }, sfx: {}, cameras: { main: { shake() {} } } },
    tele: { lineStyle() {}, lineBetween() {}, strokeCircle() {} },
    canFire: () => true,
    pool: { spawn: (f, x, y, props) => Object.assign(sprite(x, y), props) },
    woundPool: { spawn: (f, x, y) => sprite(x, y) },
  };
  const b = {
    fire: (x, y, a) => shots.push({ x, y, a, dx: x - e.x, dy: y - e.y }),
    ring: (x, y, n) => shots.push({ x, y, a: 0, ring: n, dx: 0, dy: 0 }),
    lob: (x, y, tx, ty, t, kind) => lobs.push({ kind, ty }),
  };
  const e = Object.assign(sprite(90, -60), { hp: 560, maxHp: 560, state: 'enter', rotation: 0 });
  ctx.spawnOranda(e, {});
  const run = (sec) => {
    for (let i = 0; i < sec * 60; i++) ctx.oranda(e, 1 / 60, b);
  };
  return { e, ctx, shots, lobs, run };
}

test('Oranda-bune: rolling broadsides from both batteries; a battery shot off silences its side', () => {
  const { e, shots, run } = float();
  assert.equal(e.kuroko.length, 2);
  run(8);
  assert.equal(e.state, 'fight');
  assert(shots.some((s) => s.dx < -10) && shots.some((s) => s.dx > 10), 'both sides fire');
  // the port (screen-left) battery goes
  const left = e.kuroko.find((k) => k.role === -1);
  left.hp = 0;
  left.dead = true;
  run(0.2);
  assert(e.burnt[0], 'its side burns');
  shots.length = 0;
  run(8);
  const side = shots.filter((s) => Math.abs(s.dx) > 14 && Math.abs(s.dy) < 30);
  assert(side.length > 0 && side.every((s) => s.dx > 0), 'only the starboard side still fires');
});

test('Oranda-bune: the mawashi spin turns it twice round firing all ways; at a third it charges and lobs kegs', () => {
  const { e, shots, lobs, run } = float();
  run(3);
  e.hp = 0.6 * e.maxHp;
  shots.length = 0;
  let turned = 0;
  let last = e.rotation;
  for (let i = 0; i < 60 * 9; i++) {
    run(1 / 60);
    turned += Math.abs(e.rotation - last) < 1 ? Math.abs(e.rotation - last) : 0;
    last = e.rotation;
  }
  assert(turned >= Math.PI * 4 - 0.2, `turned ${turned.toFixed(2)}`);
  const angles = shots.filter((s) => !s.ring).map((s) => ((s.a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2));
  const spread = new Set(angles.map((a) => Math.floor(a / (Math.PI / 4))));
  assert(spread.size >= 7, 'shots out in every direction');
  e.hp = 0.3 * e.maxHp;
  let deepest = 0;
  for (let i = 0; i < 60 * 12; i++) {
    run(1 / 60);
    deepest = Math.max(deepest, e.y);
  }
  assert(deepest >= 420 * 0.72, `it charges down (${deepest})`);
  assert(lobs.length >= 3 && lobs.every((l) => l.kind === 'keg'));
});

test('glass volley visibly pauses before turning and stops firing during ceasefire', () => {
  let shots = [];
  const e = { state: 'attack', timer: 0, shots: 0, x: 50, y: 60, dir: 1 };
  const context = { canFire: () => false };
  const b = { shot: (...args) => shots.push(args) };
  nagasaki.biidoro.call(context, e, 0.1, b);
  assert.equal(shots.length, 0);
  context.canFire = () => true;
  nagasaki.biidoro.call(context, e, 0.1, b);
  assert.equal(shots.length, 5);
  for (const shot of shots) {
    assert(shot[6].frz.hold > 0);
    assert.equal(shot[6].frz.turn, 0.45);
  }
  for (let i = 0; i < 300; i++) nagasaki.biidoro.call(context, e, 0.02, b);
  assert.equal(e.state, 'leave');
  assert.equal(shots.length, 15);
});

function dragon(H = 320) {
  const sprite = (x, y, props = {}) => ({
    x, y, alpha: 1, rotation: 0, hp: 1000, ...props,
    play() { return this; }, setDepth() { return this; },
    setPosition(x, y) { Object.assign(this, { x, y }); return this; },
    setRotation(rotation) { this.rotation = rotation; return this; },
    setScale(scale) { this.scale = scale; return this; },
    setAlpha(alpha) { this.alpha = alpha; return this; },
  });
  const shots = [], warnings = [];
  const pool = { spawn: (frame, x, y, props) => sprite(x, y, props) };
  const ctx = {
    ...nagasaki, ...encounters, pool, segPool: pool,
    scene: { H, stage: { panorama: true }, player: { x: 90, y: H - 30 }, hud: { show() {} } },
    canFire() { return !this.scene.ceasefire; },
    aimAt(e, dx, dy) { return Math.atan2(this.scene.player.y - e.y - dy, this.scene.player.x - e.x - dx); },
    tele: { lineStyle() { return this; }, strokeCircle() { return this; }, fillStyle() { return this; }, fillRoundedRect() { return this; }, strokeRect() { return this; }, fillRect() { return this; }, lineBetween(...line) { warnings.push(line); return this; } },
  };
  const head = ctx.spawnJaodori({}, { hp: 1000, maxHp: 1000 });
  const g = ctx.bossGroup;
  const record = (kind, x, y, ...args) => shots.push({ kind, x, y, args, phase: g.phase % 3, lane: g.lane, t: g.t, hx: head.x, hy: head.y, rot: head.rotation });
  ctx.scene.bullets = { fan: (...args) => record('fan', ...args), shot: (frame, ...args) => record('shot', ...args) };
  const run = (seconds, fps = 60) => { for (let i = 0; i < Math.round(seconds * fps); i++) ctx.updateJaodori(g, 1 / fps); };
  return { ctx, g, head, shots, warnings, run };
}

test('Ja-odori rises harmlessly, keeps a long body and stable movement across frame rates', () => {
  const results = [];
  for (const fps of [30, 60, 120]) {
    const d = dragon();
    d.run(2, fps);
    assert.equal(d.head.state, 'rise'); assert(d.head.pass && d.head.harmless);
    assert.equal(d.shots.length, 0);
    d.run(4, fps);
    assert.equal(d.head.state, 'fight'); assert(!d.head.pass && !d.head.harmless);
    assert(d.head.y - d.g.body.at(-1).y > 55, 'body must not collapse into the head');
    assert(d.g.body.every(p => Number.isFinite(p.x + p.y) && p.alpha === 1));
    results.push(d.head.x);
  }
  assert(Math.max(...results) - Math.min(...results) < 1);
});

test('Ja-odori fires three mouth fans, twelve paired waves, then three rows with a fixed safe corridor', () => {
  for (const H of [320, 420]) {
    const d = dragon(H);
    for (let i = 0; i < 1800 && d.g.phase < 3; i++) d.run(1 / 60);
    assert.equal(d.g.phase, 3, 'the full attack cycle completes');
    const fans = d.shots.filter(s => s.kind === 'fan');
    assert.equal(fans.length, 3);
    for (const s of fans) {
      assert(Math.abs(s.x - (s.hx - Math.sin(s.rot) * 18)) < .001);
      assert(Math.abs(s.y - (s.hy + Math.cos(s.rot) * 18)) < .001);
    }
    const streams = d.shots.filter(s => s.phase === 1);
    assert.equal(streams.length, 24);
    assert(streams[0].t - fans.at(-1).t >= 1.19, 'breathing room between attacks');
    const rows = d.shots.filter(s => s.phase === 2);
    assert.equal(new Set(rows.map(s => s.t)).size, 3);
    assert.equal(new Set(rows.map(s => s.lane)).size, 1);
    assert(rows.every(s => Math.abs(s.x - s.lane) > 22));
    assert(rows[0].t - streams.at(-1).t >= 1.39, 'corridor is announced before firing');
    assert(d.warnings.some(line => line[3] === H));
    d.ctx.scene.ceasefire = true;
    const count = d.shots.length, timer = d.g.timer;
    d.run(3);
    assert.equal(d.shots.length, count); assert.equal(d.g.timer, timer);
  }
});
