// Kurogane's parts (tools/art/tokyo/kurogane.mjs) are all in Tokyo's atlas, the ones that stay on the body packed
// without their margins but keeping the whole frame's size (so they share its middle), and the change from the crane
// to flight runs in order over the plan's second and a half, naming only frames that exist.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { KURO_LAYOUT, KURO_ORDER, KURO_TRANSFORM, KW, KH, kuroganeEnemies } from '../art/tokyo/kurogane.mjs';

const frames = JSON.parse(readFileSync(new URL('../../public/assets/bg/stage9/enemies.json', import.meta.url))).frames;
const portraits = JSON.parse(readFileSync(new URL('../../public/assets/portraits.json', import.meta.url))).frames;

test('every part, in every state, is in the atlas; the body parts keep the whole frame', () => {
  const want = ['kg_gantry_l', 'kg_gantry_r', 'kg_gantry_top', 'kg_clamp_l', 'kg_clamp_r', 'kg_link_0', 'kg_link_1', 'kg_fist_ring', 'kg_katana', 'kg_frame', 'kg_strut', 'kg_barm_l', 'kg_eyes_hot', 'kg_rocket_0', 'kg_rocket_1'];
  for (let w = 0; w < 3; w++) {
    want.push(`kg_body_${w}`);
    for (const s of ['l', 'r']) {
      want.push(`kg_arm_${s}_${w}`, `kg_fist_${s}_${w}`);
      for (let p = 0; p < 3; p++) want.push(`kg_sode_${s}_${p}_${w}`);
    }
    want.push(`kg_barm_r_${w}`, `kg_claw_${w}`);
  }
  for (let k = 0; k < 4; k++) want.push(`kg_legs_${k}`, `kg_jet_${k}`, `kg_jetw_${k}`, `kg_fan_l_${k}`, `kg_fan_r_${k}`, `kg_core_${k}`, `kg_eyes_${k}`, `kg_drone_${k}`);
  want.push('kg_fan_l_x', 'kg_fan_r_x', 'kg_stump_l', 'kg_stump_r', 'kg_eye_flicker_0', 'kg_eye_flicker_1', 'kg_flash_0', 'kg_flash_1');
  for (const f of want) assert.ok(frames[f], f);
  for (const f of ['kg_body_0', 'kg_legs_3', 'kg_sode_l_0_0', 'kg_fan_r_3', 'kg_frame', 'kg_core_0']) {
    assert.equal(frames[f].trimmed, true, f);
    assert.deepEqual(frames[f].sourceSize, { w: KW, h: KH }, f);
  }
  assert.ok(portraits.kg_portrait);
});

test('every layer named in the orders has frames, and every free part has a place', () => {
  kuroganeEnemies(() => {}); // (the places are worked out as the parts are drawn)
  for (const order of Object.values(KURO_ORDER)) for (const name of order) assert.ok(Object.keys(frames).some((f) => f === name || f.startsWith(`${name}_`)), name);
  for (const k of ['kg_gantry_l', 'kg_gantry_r', 'kg_gantry_top', 'kg_clamp_l', 'kg_clamp_r', 'fist_l', 'fist_r', 'chain_l', 'chain_r', 'muzzle', 'hand_0', 'hand_1', 'hand_2', 'fan_l', 'fan_r', 'core', 'grab', 'eyes'])
    assert.ok(Array.isArray(KURO_LAYOUT[k]) && KURO_LAYOUT[k].length === 2, k);
});

test('the change from the crane to flight', () => {
  let st = {};
  let t = -1;
  for (const k of KURO_TRANSFORM) {
    assert.ok(k.t > t, `in order at ${k.t}`);
    t = k.t;
    st = { ...st, ...k };
    assert.ok(frames[`kg_legs_${st.legs}`]);
    if (st.fans >= 0) assert.ok(frames[`kg_fan_l_${st.fans}`]);
  }
  assert.equal(t, 1.5);
  assert.equal(st.legs, 3);
  assert.equal(st.fans, 3);
  assert.equal(st.blade, 1);
  assert.ok(KURO_TRANSFORM.length >= 9, 'at least eight key frames');
});
