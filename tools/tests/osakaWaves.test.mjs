// Osaka's stronger waves (docs/plan-silniejsze-fale.md): kitchō charms of Tōka Ebisu on straw ropes across the
// avenues of Shinsekai (Imamiya Ebisu is next door), the danjiri careering down a street of Umeda and swung round
// the corner into a cross street (yarimawashi); no pair (its small fry already come as manzai duos); never in the
// quiet before the bunraku.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CART } from '../../src/config.js';
import { SKINS } from '../../src/game/skins.js';

const st = JSON.parse(readFileSync(new URL('../../src/data/stage5.json', import.meta.url)));
const W = st.waves;
const of = (type) => W.filter((w) => w.type === type);
// (tools/art/osaka/mid.mjs: the three avenues up Umeda and Shinsekai, x and half width; their cross streets, u and
// half width; the districts; the station's tracks across Umeda)
const AVENUES = [[30, 5], [90, 8], [150, 5]];
const UMEDA = { u: [1970, 2950], cross: [[2100, 6], [2350, 6], [2600, 6], [2900, 6]], tracks: [2690, 2790] };
const SHINSEKAI = { u: [2950, 3750], cross: [[3060, 5], [3200, 5], [3300, 5], [3550, 5]] };
const TOWER = { x: [40, 84], u: [3206, 3314] }; // Tsūtenkaku: its legs, its deck, its spire

test('the mix: 3 ropes of kitchō, one danjiri, no pair; the looks', () => {
  assert.equal(of('chain').length, 3);
  assert.equal(of('cart').length, 1);
  assert.equal(of('split').length, 0);
  const { chain, split, cart } = SKINS.osaka;
  assert.ok(chain?.frames?.length === 3 && cart && !split, 'the sea bream, the koban and the rice bale in turn; a cart; no pair');
  assert.ok(cart.speed > CART.speed, 'the danjiri careers along');
  // (the duos: none of the three in one)
  for (const w of [...of('chain'), ...of('cart')]) assert.ok(!w.duo && !(w.count > 1), `${w.type} at ${w.t} s in a duo`);
});

test('each rope across an avenue of Shinsekai, its posts off the streets and clear of Tsūtenkaku', () => {
  for (const w of of('chain')) {
    const u = 434 + 30 * w.t; // (where the rope is put on the map: stripU(-14))
    assert.ok(u > SHINSEKAI.u[0] + 20 && u < SHINSEKAI.u[1] - 20, `rope at ${w.t} s not over Shinsekai (u ${u})`);
    assert.ok(AVENUES.some(([x, hw]) => w.x < x - hw && w.x2 > x + hw), `rope at ${w.t} s across no avenue`);
    for (const x of [w.x, w.x2]) {
      assert.ok(AVENUES.every(([ax, hw]) => Math.abs(x - ax) > hw + 2) && x >= 2 && x <= 178, `rope at ${w.t} s: a post on an avenue (x ${x})`);
      assert.ok(!(x > TOWER.x[0] && x < TOWER.x[1] && u > TOWER.u[0] - 6 && u < TOWER.u[1] + 6), `rope at ${w.t} s: a post on Tsūtenkaku`);
    }
    assert.ok(SHINSEKAI.cross.every(([cu, hw]) => Math.abs(u - cu) > hw + 2), `rope at ${w.t} s: its posts on a cross street`);
    assert.ok((w.x2 - w.x) / (w.n + 1) >= 8, `rope at ${w.t} s: the charms on top of each other`);
  }
});

test('the danjiri down an avenue of Umeda, swung round on to a cross street on the screen, clear of the station', () => {
  const [w] = of('cart');
  const speed = SKINS.osaka.cart.speed;
  assert.ok(AVENUES.some(([x]) => x === w.x), 'down one of the avenues');
  const [tu, dir] = w.turn;
  assert.ok(UMEDA.cross.some(([cu]) => cu === tu), 'round on to one of the cross streets');
  assert.ok(dir === -1 || dir === 1);
  const u0 = 440 + 30 * w.t; // (where it comes on: stripU(-20))
  assert.ok(u0 + 14 < UMEDA.tracks[0], 'it comes on south of the station\'s tracks');
  assert.ok(tu - 14 > UMEDA.u[0], 'its cross street in Umeda');
  // it swings round within its first few seconds on the screen (it comes on 20 px above the top)
  const swing = (u0 - tu - CART.swing.r) / speed;
  assert.ok(swing > 1 && swing < 4, `it swings round ${swing.toFixed(1)} s after it comes on`);
  // on along the cross street, towards the far side of the screen (it has the width of it to drive)
  const far = dir < 0 ? w.x - CART.swing.r : 180 - w.x - CART.swing.r;
  assert.ok(far > 100, 'the cross street long enough to drive');
});

test('nothing new in the quiet before the bunraku nor at its fight', () => {
  const heavy = of('heavy')[0];
  const boss = of('boss')[0];
  for (const w of [...of('chain'), ...of('cart')]) {
    const stays = w.type === 'chain' ? 13 : 10;
    // (the bunraku comes down in some 6 s and flies off after 40 s of its fight, if it is still up)
    assert.ok(w.t + stays <= heavy.t - 1 || w.t >= heavy.t + 46, `${w.type} at ${w.t} s at the bunraku's fight`);
    assert.ok(w.t < boss.t - 9, `${w.type} at ${w.t} s just before the octopus`);
  }
});
