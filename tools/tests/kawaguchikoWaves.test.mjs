// Kawaguchiko's stronger waves (docs/plan-silniejsze-fale.md): popcorn down to about 45% of what can be shot down;
// koinobori on lines across Honcho-dori, their poles off the roads and the railway, clear of the bronze torii over
// the street; chestnut burrs falling where there are trees (never over the lake); the swan boat paddling down open
// water all the while it is on the screen, clear of Unoshima; never in the quiet before the fights.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ROADS, RAILS, WATER, SECTIONS } from '../art/kawaguchiko/route.mjs';
import { SKINS } from '../../src/game/skins.js';

const st = JSON.parse(readFileSync(new URL('../../src/data/stage10.json', import.meta.url)));
const W = st.waves;
const of = (type) => W.filter((w) => w.type === type);
const heavy = of('heavy')[0];
const boss = of('boss')[0];

/** How far (x, u) is from a polyline [[x, u], ...]. */
function dist(pts, x, u) {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const [[ax, au], [bx, bu]] = [pts[i - 1], pts[i]];
    const [dx, du] = [bx - ax, bu - au];
    const k = Math.max(0, Math.min(1, ((x - ax) * dx + (u - au) * du) / (dx * dx + du * du || 1)));
    best = Math.min(best, Math.hypot(x - ax - k * dx, u - au - k * du));
  }
  return best;
}
const onRoad = (x, u, pad = 1) => ROADS.some((r) => dist(r.pts, x, u) < r.w / 2 + pad);
const onRail = (x, u) => RAILS.some((r) => r.style !== 'rope' && dist(r.pts, x, u) < 4);
function inPoly(pts, x, u) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [[xi, ui], [xj, uj]] = [pts[i], pts[j]];
    if (ui > u !== uj > u && x < ((xj - xi) * (u - ui)) / (uj - ui) + xi) inside = !inside;
  }
  return inside;
}
const LAKE = WATER.find((w) => w.id === 'kawaguchiko').poly;
const HONCHO = ROADS.find((r) => r.id === 'honcho_dori');
const KANADORII = 820; // (the bronze torii spanning Honcho-dori: tools/art/kawaguchiko/route.mjs)
const UNOSHIMA = [128, 3080];
const section = (u) => SECTIONS.find(([a, b]) => u >= a && u < b)[2];

test('the mix: popcorn about 45%, 3-5 lines of koinobori, 10-14 chestnut burrs, one swan boat', () => {
  const n = (type) => of(type).reduce((s, w) => s + (type === 'chain' ? w.n : w.count ?? 1), 0);
  const all = ['popcorn', 'diver', 'shooter', 'turret', 'carrier', 'ambush', 'chain', 'cart'].reduce((s, t) => s + n(t), 0) + n('split') * 3;
  const share = n('popcorn') / all;
  assert.ok(share > 0.35 && share <= 0.46, `popcorn ${n('popcorn')} of ${all}`);
  assert.ok(of('chain').length >= 3 && of('chain').length <= 5);
  assert.ok(n('split') >= 10 && n('split') <= 14);
  assert.equal(of('cart').length, 1);
  const { chain, split, cart } = SKINS.kawaguchiko;
  assert.ok(chain?.frames?.length === 3 && split && cart, 'its looks: the three carps in turn');
});

test('each line of koinobori across Honcho-dori, its poles off the roads and the railway, clear of the torii', () => {
  for (const w of of('chain')) {
    const u = 434 + 30 * w.t; // (where the line is put on the map: stripU(-14))
    assert.ok(u > HONCHO.pts[0][1] + 20 && u < HONCHO.pts[1][1] - 20, `line at ${w.t} s not over Honcho-dori (u ${u})`);
    assert.ok(Math.abs(u - KANADORII) > 30, `line at ${w.t} s by the bronze torii (u ${u})`);
    assert.ok(w.x < HONCHO.pts[0][0] - HONCHO.w / 2 && w.x2 > HONCHO.pts[0][0] + HONCHO.w / 2, `line at ${w.t} s does not cross the street`);
    for (const x of [w.x, w.x2]) {
      assert.ok(!onRoad(x, u) && !onRail(x, u), `line at ${w.t} s: a pole on a road or the railway at (${x}, ${u})`);
      assert.ok(!inPoly(LAKE, x, u) && x >= 4 && x <= 176, `line at ${w.t} s: a pole off the land at (${x}, ${u})`);
    }
    // (a carp is some 14 px long: room for each, streaming out towards the next)
    assert.ok((w.x2 - w.x) / (w.n + 1) >= 10, `line at ${w.t} s: the carps on top of each other`);
  }
});

test('the swan boat paddles down open water all the while it is on the screen, clear of Unoshima', () => {
  const [w] = of('cart');
  for (let s = 0; s < 10.5; s += 0.5) {
    const u = 440 + 30 * w.t - 14 * s;
    for (const [dx, du] of [[-9, 0], [9, 0], [0, -14], [0, 14]]) assert.ok(inPoly(LAKE, w.x + dx, u + du), `the swan off the water after ${s} s (${w.x + dx}, ${u + du})`);
    assert.ok(Math.hypot(w.x - UNOSHIMA[0], u - UNOSHIMA[1]) > 36, `the swan on Unoshima after ${s} s`);
  }
});

test('the burrs fall where there are trees, never over the lake; four in the maple corridor', () => {
  for (const w of of('split')) {
    const u = 430 + 30 * w.t;
    assert.notEqual(section(u), 'lake', `a burr at ${w.t} s over the lake (u ${u})`);
  }
  assert.ok(of('split').filter((w) => section(430 + 30 * w.t) === 'momiji').length >= 4);
});

test('nothing new in the quiet before the rabbit nor before Daidarabotchi', () => {
  for (const w of [...of('chain'), ...of('cart'), ...of('split')]) {
    const stays = w.type === 'chain' ? 13 : w.type === 'cart' ? 10 : 0;
    assert.ok(w.t + stays <= heavy.t - 1 || w.t >= heavy.t, `${w.type} at ${w.t} s at the rabbit's fight`);
    assert.ok(w.t < boss.t - 9, `${w.type} at ${w.t} s just before Daidarabotchi`);
  }
});
