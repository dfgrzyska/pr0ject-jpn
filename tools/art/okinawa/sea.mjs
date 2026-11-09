// The water's edge: the Kerama islands with a hamlet, a pier and dive boats; the resort beach and its hotel; the open sea with its
// islets, a phantom sandbar and the lighthouse island; then everything alive on the sea, waves, glints, boats, turtles, mantas,
// humpbacks and squalls. Only what floats or flies moves, and it moves on the water.
import { C as _C, S, hashPx, scaleColor, rampColor, rng, fbm, mix, HiCanvas } from '../nagasaki/canvas.mjs';
import { puff } from '../props.mjs';
import { W, L, ISLETS, REEFS, MAIN_S, ROAD_U, VILLAGE, landD, shallowS, reefD, kindAt, KIND, isWater } from './geo.mjs';
import { C } from './common.mjs';

const WHITE_DECK = 0xf2f2ee;

/** A boat with its bow to the right: paint(r, FL, FH) adds the deck. */
export const craft = (k, w, h, u, hull, deck, paint) => k.hull(w, h, u, hull, deck, paint);
export const fisher = (k, u, col) => craft(k, 16, 6, u, col, 0xc8c0b0, (r, FL, FHh) => {
  for (let j = 4; j < FHh - 4; j++) for (let i = 8; i < 20; i++) r.px(i, j, j === 4 ? 0xffffff : i > 16 ? 0x2a3a4a : 0xe8e8e0);
  r.rectPx(28, 6, 8, FHh - 12, 0x3a5a4a);
});
export const sail = (k, u, col) => craft(k, 15, 5, u, col, 0xe8e4d8, (r, FL, FHh) => {
  for (let j = 4; j < FHh - 4; j++) for (let i = 10; i < 22; i++) r.px(i, j, j === 4 ? 0xffffff : 0xd8d8d0);
  for (let i = 3; i < 38; i++) r.px(i, FHh >> 1, 0x8a8e94, 0.8);
  for (let i = 8; i < 38; i++) for (let j = 0; j < 4; j++) r.px(i, (FHh >> 1) - 1 - Math.round(Math.sin(((i - 8) / 30) * Math.PI) * 4) - j, 0xf8f8f4, 0.9 - j * 0.2);
});

export function paintKerama(k) {
  const { img, Y, kit, objects } = k;
  const { plant, house, flat } = k.t;
  const kr = rng(2203);
  const wake = (u) => ({ f: k.wakeF(u), every: 4, life: 1.8 });
  // limestone boulders round every island's shore
  for (const [iu, ix, R, kd] of ISLETS) {
    if (kd !== 'k') continue;
    for (let i = 0; i < Math.ceil(R / 2.2); i++) {
      const a = kr() * 6.283;
      const x = ix + Math.cos(a) * (R - 1 + kr() * 2);
      const u = iu + Math.sin(a) * (R - 1 + kr() * 2);
      if (x < 2 || x > W - 3 || !isWater(x, u + 3)) continue;
      k.rockPx(x * S, Y(u) * S, 2.6 + kr() * 4.4, C.rock, i + iu);
      for (let q = 0; q < 10; q++) img.px(x * S + Math.cos(q * 0.7) * 7, Y(u) * S + 3 + Math.sin(q * 0.7) * 3, 0xeef8f4, 0.45);
    }
  }
  // Zamami's little harbour: a hamlet of red roofs on the island's east side, a concrete pier out from its shore, boats alongside
  const PIER_U = 236;
  let sx = 20;
  while (sx < 90 && landD(sx, PIER_U) > 0) sx++;
  {
    const len = 26;
    const x0 = sx - 5;
    img.fine(x0, Y(PIER_U) - 2, len, 4, (X, Yy) => {
      const j = Yy - (Y(PIER_U) - 2) * S;
      if (j < 1) return 0xd8d6cc;
      if (j > 10) return X % 18 < 3 ? 0x2a2a30 : 0x6a685f;
      return X % 12 === 0 ? 0x8a887f : rampColor([0x9e9c92, 0xb0aea4, 0xc0beb4], hashPx(X >> 2, Yy >> 2, 2204), X, Yy);
    });
    for (let X = x0 * S; X < (x0 + len) * S; X++) for (let j = 0; j < 4; j++) if (k.wetPx(X, (Y(PIER_U) + 2) * S + j)) img.px(X, (Y(PIER_U) + 2) * S + j, 0x0a1a2a, 0.34 - j * 0.07);
    k.reserve(x0, Y(PIER_U) - 2, len, 5);
    k.standing(x0 + 10, Y(PIER_U) - 2, 14, 2, 3, 2205, undefined);
    k.streetLamp(x0 + len - 1, PIER_U + 1);
    kit.loop(sx + 2, PIER_U + 9, [fisher(k, PIER_U, 0x2a5a8a)], { d: 0.02 });
    kit.loop(sx + 6, PIER_U - 4, [fisher(k, PIER_U, 0xe8e4dc)], { d: 0.02 });
    const fits = (x, u, w, h) => [[x, u], [x + w, u], [x, u + h], [x + w, u + h]].every(([a, b]) => landD(a, b) > 8);
    let n = 0;
    for (let u = 208; u < 292 && n < 9; u += 16)
      for (let x = 4 + (u % 3) * 2; x < 56 && n < 9; x += 16) {
        const w = 12 + (x + u) % 3;
        if (!fits(x, u, w, 12) || k.anyRes(x - 1, Y(u + 12) - 1, w + 2, 14)) continue;
        if ((x + u) % 5 === 0) flat(x, Y(u + 12), w, 8, 3);
        else house(x, Y(u + 12), w, 8, { faceH: 3 });
        n++;
      }
    k.strollers(sx - 12, PIER_U + 4, 8, 12, 3);
  }

  // kayaks pulled up on the sand, a thatched beach hut and its sun-loungers
  const onBeach = (x, u) => landD(x, u) > 1 && landD(x, u) < 7 && kindAt(x, u) === KIND.kerama;
  let kay = 0;
  for (const [u0, x0, dx] of [[250, 50, 1], [215, 60, 1], [575, 128, -1], [600, 134, -1], [540, 126, -1], [190, 58, 1]])
    for (let q = 0; q < 16; q++) {
      const x = x0 + dx * q;
      if (!onBeach(x, u0)) continue;
      const X = x * S;
      const Yy = Y(u0) * S;
      const col = [0xf0c020, 0xe0402a, 0xf08a20][kay % 3];
      for (let j = 0; j < 18; j++) {
        const hw = Math.min(3, 1 + Math.min(j, 17 - j) * 0.6);
        for (let i = -hw; i <= hw; i++) img.px(X + i, Yy + j, Math.abs(j - 9) < 2 && Math.abs(i) < 2 ? 0x2a2a30 : i > hw - 1 ? scaleColor(col, 0.7) : col);
        img.tintPx(X + hw + 1, Yy + j, 0.7);
      }
      kay++;
      break;
    }
  {
    const hx = 150;
    const hu = 536;
    objects.push({
      y: Y(hu) + 1,
      shadow: () => k.shadowRect(hx + 2, Y(hu) - 6, 11, 7, 0.55),
      draw: () => {
        const X = hx * S;
        const Yb = Y(hu) * S;
        for (const q of [1, 26]) for (let j = 0; j < 9; j++) img.px(X + q, Yb - j, C.wood[1]);
        for (let j = 0; j < 15; j++) for (let i = -2; i < 31; i++) {
          const v = hashPx((i + j * 2) >> 1, j >> 1, 2207);
          img.px(X + i, Yb - 9 - j, j === 7 ? 0x7a5a30 : v < 0.2 ? 0x8a6a3a : j < 7 ? 0xc8a868 : 0xb0905a);
        }
      },
    });
  }
  // dive boats moored off the beaches, the dive flag at the stern, divers' bubbles round them
  const bubbles = [3, 6, 9, 9].map((r, i) => {
    const out = new HiCanvas(9, 9);
    for (let a = 0; a < 6.3; a += 0.2) out.px(13 + Math.cos(a) * r, 13 + Math.sin(a) * r, 0xf4fcfc, i === 3 ? 0.4 : 0.8);
    if (i < 2) out.discPx(13, 13, 1.4, 0xffffff);
    return k.sprite(9, 9, 300, (q) => {
      for (let a = 0; a < 6.3; a += 0.2) q.px(13 + Math.cos(a) * r, 13 + Math.sin(a) * r, 0xf4fcfc, i === 3 ? 0.4 : 0.8);
      if (i < 2) q.discPx(13, 13, 1.4, 0xffffff);
    });
  });
  for (const [bx, bu] of [[74, 262], [104, 590]]) {
    const b = craft(k, 16, 6, bu, 0x2a5a9a, WHITE_DECK, (r, FL, FHh) => {
      for (let j = 5; j < FHh - 5; j++) for (let i = 22; i < 36; i++) r.px(i, j, j === 5 ? 0xffffff : i > 32 ? 0x3a5a8a : 0xd8dce4);
      for (let q = 0; q < 6; q++) r.discPx(6 + (q % 3) * 5, 6 + (q >> 1) * 3, 1.6, 0x8a8a90);
      r.rectPx(0, 3, 4, 4, 0xe0302a);
      r.rectPx(0, 4, 4, 1, 0xffffff);
    });
    kit.loop(bx, bu, [b], { d: 0.02 });
    kit.spot([[bx - 14, bu + 22, 34, 34]], bubbles, { rate: 1.1, fps: 5, a: 0.9 });
  }
  // the ferry from Tomari, kayaks paddling, boats under sail
  const ferry = craft(k, 36, 12, 300, 0x2a4a8a, WHITE_DECK, (r, FL, FHh) => {
    for (let j = 6; j < FHh - 6; j++) for (let i = 14; i < 74; i++) r.px(i, j, j === 6 ? 0xffffff : (i - 14) % 9 === 0 ? 0x5a6a7a : j % 3 ? 0xe0e4ea : 0x3a5a9a);
    for (let j = 9; j < FHh - 9; j++) for (let i = 66; i < 74; i++) r.px(i, j, 0x2a3a5a);
    r.discPx(24, FHh >> 1, 4, 0xe04a2a);
    r.discPx(24, FHh >> 1, 2, 0x1a1a1e);
  });
  kit.path([[210, 170], [96, 280], [sx + 30, PIER_U]], [ferry], { sp: 8, mode: 'pp', hold: 9, turn: 'rot', d: 0.02, s0: 0.5, wake: wake(300) });
  kit.path([[60, 660], [120, 500], [60, 330], [120, 240]], [sail(k, 450, 0xe8e4d8)], { sp: 5, mode: 'pp', hold: 4, turn: 'rot', d: 0.02, s0: 0.3, wake: wake(450) });
  kit.path([[30, 700], [100, 640], [40, 560], [110, 450]], [sail(k, 600, 0x3a6ab0)], { sp: 5, mode: 'pp', hold: 5, turn: 'rot', d: 0.02, s0: 0.6, wake: wake(600) });
  void plant;
}

export function paintResort(k) {
  const { img, Y, kit, objects, pool } = k;
  const { plant, flat } = k.t;
  const g = rng(760);
  const wake = (u) => ({ f: k.wakeF(u), every: 3, life: 1.6 });
  // umbrellas in their rows along the sand, towels and sunbathers, a volleyball net, a lifeguard's chair, sandcastles
  const umb = (x, u, col) => {
    const CX = x * S;
    const CY = Y(u) * S;
    objects.push({
      y: Y(u) + 2,
      shadow: () => {
        for (let j = -10; j <= 10; j++) for (let i = -10; i <= 10; i++) if (i * i + j * j < 100) img.tintPx(CX + i + 5, CY + j + 7, 0.72);
      },
      draw: () => {
        for (let j = -10; j <= 10; j++)
          for (let i = -10; i <= 10; i++) {
            if (i * i + j * j >= 100) continue;
            const seg = Math.floor(((Math.atan2(j, i) + 3.15) / 6.3) * 8) % 2;
            const c = seg ? col : 0xf6f2e6;
            img.px(CX + i, CY + j, i + j > 8 ? scaleColor(c, 0.8) : c);
          }
        img.discPx(CX, CY, 1.2, 0x6a4a2a);
      },
    });
  };
  const towel = (x, u, col) => {
    const X = x * S;
    const Yy = Y(u) * S;
    for (let j = 0; j < 15; j++) for (let i = 0; i < 8; i++) img.px(X + i, Yy + j, (j >> 2) % 2 ? col : 0xf6f2e6);
    if (g() < 0.7) {
      // somebody on it
      for (let j = 2; j < 13; j++) for (let i = 2; i < 6; i++) img.px(X + i, Yy + j, j > 6 && j < 10 ? [0xd04040, 0x3a6ad0, 0x2a2a3a][Math.floor(x) % 3] : 0xe0b090);
      img.discPx(X + 3.5, Yy + 1, 2, 0x2a2026);
    }
  };
  for (let x = 6; x < W; x += 13 + Math.floor(g() * 7)) {
    const u = Math.round(MAIN_S + 12 + g() * 12);
    if (landD(x, u) <= 3) continue;
    umb(x, u, [0xe0402a, 0x2a7ad0, 0xf0b020, 0x2aa060][Math.floor(g() * 4)]);
    towel(x + 4, u + 2, [0xe86a9a, 0x5ac0e0, 0xf6d040][Math.floor(g() * 3)]);
    if (g() < 0.4) towel(x - 7, u - 1, [0xe86a9a, 0x5ac0e0, 0xf6d040][Math.floor(g() * 3)]);
  }
  k.reserve(0, Y(MAIN_S + 30), W, 34);
  // the volleyball court
  {
    const x0 = 60;
    const u0 = MAIN_S + 14;
    img.fine(x0, Y(u0 + 11), 16, 11, (X, Yy, x, y) => {
      const e = Math.min(x - x0, x0 + 16 - x, y - Y(u0 + 11), Y(u0) - y);
      return e < 0.3 ? 0x2a6ac8 : null;
    });
    objects.push({
      y: Y(u0 + 5),
      draw: () => {
        for (const q of [0, 16]) for (let j = 0; j < 15; j++) img.px((x0 + q) * S, Y(u0 + 5) * S - j, 0x5a5e66);
        for (let i = 0; i <= 48; i++) for (let j = 8; j < 15; j++) if ((i + j) % 3 === 0) img.px(x0 * S + i, Y(u0 + 5) * S - j, 0xf0f0e8);
      },
    });
    k.standing(x0 + 1, Y(u0 + 10), 14, 9, 6, 762, undefined);
  }
  // the lifeguard's tower with its flag
  objects.push({
    y: Y(MAIN_S + 16),
    shadow: () => k.shadowRect(113, Y(MAIN_S + 20), 8, 5, 0.6),
    draw: () => {
      const X = 112 * S;
      const Yb = Y(MAIN_S + 16) * S;
      for (const q of [0, 15]) for (let j = 0; j < 18; j++) img.px(X + q, Yb - j, 0xe8e4d8);
      for (let j = 18; j < 24; j++) for (let i = -2; i < 18; i++) img.px(X + i, Yb - j, j % 3 === 0 ? 0xc83a2a : 0xf0ece0);
      for (let j = 24; j < 33; j++) for (let i = -3; i < 19; i++) img.px(X + i, Yb - j, (i >> 2) % 2 ? 0xf0ece0 : 0xc83a2a);
      for (let j = 33; j < 42; j++) img.px(X + 7, Yb - j, 0x5a5e66);
      for (let i = 0; i < 9; i++) for (let j = 0; j < 5; j++) img.px(X + 8 + i, Yb - 42 + j, 0xe0402a);
    },
  });
  // the beach bar: thatch over a horseshoe counter, stools, a path up to the hotel
  objects.push({
    y: Y(MAIN_S + 34),
    shadow: () => k.shadowRect(43, Y(MAIN_S + 42), 15, 8, 0.55),
    draw: () => {
      const X = 42 * S;
      const Yb = Y(MAIN_S + 34) * S;
      for (let j = 0; j < 9; j++) for (let i = 0; i < 42; i++) img.px(X + i, Yb - j, j < 2 ? C.wood[3] : j < 5 ? 0x4a3a2a : C.wood[1]);
      for (let j = 0; j < 18; j++)
        for (let i = -3 + (j >> 1); i < 45 - (j >> 1); i++) {
          const v = hashPx((i + j * 2) >> 1, j >> 1, 763);
          img.px(X + i, Yb - 9 - j, v < 0.2 ? 0x8a6a3a : j > 9 ? 0xc8a868 : 0xb0905a);
        }
      for (let i = 2; i < 42; i += 6) img.discPx(X + i, Yb + 3, 1.4, 0xd83a2a);
    },
  });
  k.reserve(42, Y(MAIN_S + 44), 16, 11);
  // the palms along the top of the beach, in a loose line
  for (let x = 4; x < W; x += 11 + Math.floor(g() * 6)) plant('palm', x + g() * 4, Y(MAIN_S + 36 + g() * 8), 6 + g() * 2, Math.floor(x * 7));
  // the sea wall of coral stone and the promenade behind it
  k.road([[-4, MAIN_S + 54], [W + 4, MAIN_S + 54]], 1.5, { side: 0, kerb: C.coral[1], paint: (X, Yy) => k.settPx(X, Yy, 764, C.coral), over: false });
  k.walkers([[2, MAIN_S + 54], [178, MAIN_S + 54]], 7, MAIN_S + 54, { sp: 3, gap: 40 });

  // ---- the hotel: a long white curve of balconies over its gardens, pools in the shape of a lagoon, the drive behind
  const hx = 96;
  const hu = 906;
  const hd = 14;
  {
    // the garden: lawn, winding paths, hibiscus, a lagoon pool with a swim-up bar and loungers
    const gu0 = MAIN_S + 58;
    const gu1 = hu;
    img.fine(84, Y(gu1), 82, gu1 - gu0, (X, Yy, x, y) => {
      const u = 7168 - y;
      const e = ((x - 124) / 34) ** 2 + ((u - 868) / 24) ** 2 + (fbm(x, y, { seed: 765, scale: 12, octaves: 2 }) - 0.5) * 0.5;
      if (e < 1) {
        if (e > 0.9) return 0xe8e0c8;
        const isle = ((x - 126) / 7) ** 2 + ((u - 866) / 4) ** 2;
        if (isle < 1) return isle > 0.72 ? 0xd8ccb0 : k.lawnPx(X, Yy, 0.5, C.grass);
        return hashPx(X >> 1, Yy, 766) < 0.08 ? 0xc8f4f8 : rampColor([0x2ab0c8, 0x3ac0d8, 0x5ad0e0, 0x8ae4ec], 0.2 + (1 - e) * 0.5 + fbm(x, y, { seed: 767, scale: 4 }) * 0.25, X, Yy);
      }
      if (e < 1.25) return k.settPx(X, Yy, 768, [0xc8b89c, 0xd8c8ac, 0xe4d8bc]);
      return null;
    });
    k.reserve(90, Y(896), 68, 56);
    plant('palm', 126, Y(866), 5, 769);
    for (let q = 0; q < 22; q++) {
      const a = (q / 22) * 6.283;
      const X = (124 + Math.cos(a) * 38) * S;
      const Yy = Y(868 + Math.sin(a) * 27) * S;
      for (let i = 0; i < 12; i++) for (let j = 0; j < 5; j++) img.px(X + i, Yy + j, j === 0 ? 0xffffff : 0xf0ece0);
    }
    // loungers' people round the pool's rim, not in it
    for (let q = 0; q < 16; q++) {
      const a = (q / 16) * 6.283 + 0.2;
      k.standing(124 + Math.cos(a) * 39, Y(868 + Math.sin(a) * 28), 1, 1, 1, 770 + q, undefined);
    }
    kit.wander(124, 866, 22, 14, [0, 1].map((f) => k.sprite(4, 3, 866, (r) => {
      r.discPx(6, 4, 2, 0xe0b090);
      r.rectPx(2 + f, 6, 8, 1, 0xf8fcfc, 0.8);
    }, false)), { n: 4, sp: 2, idle: 0.5, turn: 'flip', fps: 2 });
    // the hotel itself: two wings stepping back, floors of balconies, the lobby's porte-cochère
    flat(hx, Y(hu + 44), 60, hd + 16, 14, {
      wall: 0xf0ece0,
      extra: () => {
        const X0 = hx * S;
        const FY = (Y(hu + 44) + hd + 16) * S;
        for (let j = 2; j < 42; j++)
          for (let i = 0; i < 180; i++) {
            const row = j % 8;
            let c = row < 1 ? 0xffffff : row < 2 ? 0x8a8e94 : (i >> 2) % 3 === 0 ? 0xdcd8cc : hashPx(i >> 3, j >> 3, 771) < 0.5 ? 0x3a5a7a : 0x5a84a4;
            if (row === 7) c = 0xb8bcc0;
            if (i > 176) c = scaleColor(c, 0.7);
            img.px(X0 + i, FY + j, c);
          }
        for (let i = 72; i < 108; i++) for (let j = 34; j < 44; j++) img.px(X0 + i, FY + j, j < 36 ? 0xffffff : 0x4a6a8a);
        // the roof: its plant in a row, a garden with its paths, a helipad's H
        const X = (hx + 4) * S;
        const Yy = (Y(hu + 44) + 3) * S;
        for (let q = 0; q < 7; q++) for (let j = 0; j < 9; j++) for (let i = 0; i < 12; i++) img.px(X + q * 22 + i, Yy + j, j < 2 ? 0xe8e8e8 : i % 3 === 0 ? 0x5a5e66 : 0x9aa0a8);
        for (let j = 0; j < 42; j++) for (let i = 0; i < 90; i++) img.px(X + i, Yy + 18 + j, i % 30 < 3 || j % 21 < 3 ? 0xc8bca0 : hashPx(i >> 1, j >> 1, 772) < 0.5 ? 0x4e7c30 : 0x3a6628);
        const HX = (hx + 48) * S;
        const HY = Yy + 38;
        for (let a = 0; a < 6.3; a += 0.04) img.px(HX + Math.cos(a) * 22, HY + Math.sin(a) * 16, 0xf0f0e8);
        for (let j = -9; j <= 9; j++) for (const s of [-8, 8]) img.rectPx(HX + s, HY + j, 3, 1, 0xf0f0e8);
        for (let i = -8; i <= 8; i++) img.rectPx(HX + i, HY, 1, 3, 0xf0f0e8);
      },
    });
    // the drive to the coast road, cars at the door
    k.road([[128, hu + 46], [128, ROAD_U - 3]], 3, { side: 1, lanes: false, piece: true });
    img.fine(106, Y(hu + 58), 44, 12, (X, Yy) => k.asphaltPx(X, Yy));
    k.reserve(106, Y(hu + 58), 44, 12);
    k.t.parked(108, Y(hu + 56), 0xe8e8ec);
    k.t.parked(116, Y(hu + 56), 0x2a5ab0);
    k.t.parked(136, Y(hu + 56), 0xc8302a);
    k.t.parked(143, Y(hu + 56), 0x3a3a42);
    pool(124, Y(868), 22, 0xc0f0f8, 0.1);
  }
  // a pad of bungalows among the palms on the west side
  for (const [x, u] of [[8, 840], [28, 852], [8, 900], [50, 896], [26, 930], [60, 960]]) if (!k.anyRes(x, Y(u + 14), 16, 18)) k.t.house(x, Y(u + 14), 14, 9, { faceH: 3 });
  const paths = [[[10, 830], [26, 870], [16, 906], [40, 944], [70, 980], [88, ROAD_U - 3]]];
  for (const p of paths) k.road(p, 1.2, { side: 0, kerb: C.coral[1], piece: true, paint: (X, Yy) => k.settPx(X, Yy, 773, C.lane) });
  k.walkers(paths[0], 3, 900, { sp: 2.6, gap: 40 });
  // the coast road
  k.road([[-14, ROAD_U + 5], [W + 14, ROAD_U + 5]], 4, { side: 1, lanes: true });
  // Bise's main lane comes down through the trees to it
  k.road([[90, ROAD_U + 9], [90, VILLAGE[0] + 4]], 4, { side: 0, kerb: C.lane[0], piece: true, paint: (X, Yy) => rampColor(C.lane, 0.5 + hashPx(X >> 2, Yy >> 2, 52) * 0.45, X, Yy) });

  // water sports off the beach: a parasail, a banana boat, jet skis, all on the water
  const tow = (para) => k.sprite(para ? 34 : 26, 9, 716, (r) => {
    for (let i = 0; i < 21; i++) for (let j = 9; j < 18; j++) r.px(i, j, j < 11 || j > 15 ? 0xd8d8d4 : i > 14 ? 0x3a5a8a : WHITE_DECK);
    for (let x = 22; x < (para ? 66 : 48); x++) r.px(x, 13, 0x2a2a30, 0.5);
    if (para) {
      for (let x = 66; x < 102; x++) for (let y = 3; y < 24; y++) if (((x - 84) / 18) ** 2 + ((y - 13) / 10.5) ** 2 < 1) r.px(x, y, (x >> 2) % 2 ? 0xe0402a : 0xf0c020);
    } else {
      for (let x = 48; x < 78; x++) for (let y = 11; y < 16; y++) r.px(x, y, y < 13 ? 0xffe040 : 0xd8b820);
      for (let x = 52; x < 76; x += 6) r.discPx(x, 11, 2, [0xe05a5a, 0x3a6ad0, 0xe8e8f0, 0x5aaa6a][(x >> 2) % 4]);
    }
  });
  kit.path([[-40, 716], [220, 716]], [tow(true)], { sp: 9, mode: 'pp', hold: 2, turn: 'rot', wake: wake(716), s0: 0.3, d: 0.02 });
  kit.path([[-30, 734], [210, 734]], [tow(false)], { sp: 7, mode: 'pp', hold: 2, turn: 'rot', wake: wake(734), s0: 0.7, d: 0.02 });
  const jf = k.sprite(5, 3, 720, (r) => {
    for (let j = 1; j < 8; j++) for (let i = 0; i < 12; i++) r.px(i, j, j < 2 ? 0xffffff : j > 6 ? 0xb8b8c0 : i > 3 && i < 8 ? 0xe05a2a : 0xe8e8ee);
    r.px(12, 4, 0xe8e8ee);
  });
  for (const [cx, cu, r, s0] of [[46, 700, 14, 0.1], [130, 724, 11, 0.6]]) {
    const pts = [];
    for (let a = 0; a <= 6.3; a += 0.39) pts.push([cx + Math.cos(a) * r * 1.6, cu + Math.sin(a) * r]);
    kit.path(pts, [jf], { sp: 14, turn: 'rot', wake: wake(720), s0, d: 0.02 });
  }
}

export function paintOpenSea(k) {
  const { img, Y, kit, objects, glowPx } = k;
  const { plant, house } = k.t;
  const wake = (u) => ({ f: k.wakeF(u), every: 4, life: 2 });
  // the islets: palms, rocks, a torii on one
  for (const [iu, ix, R, kd] of ISLETS) {
    if (kd) continue;
    const g = rng(iu);
    for (let i = 0; i < 2 + R / 5; i++) {
      const a = g() * 6.283;
      const r = g() * R * 0.5;
      plant(i % 2 ? 'palm' : 'tropic', ix + Math.cos(a) * r, Y(iu + Math.sin(a) * r), 5 + g() * 2.4, Math.floor(iu + i));
    }
    for (let i = 0; i < R / 2; i++) {
      const a = g() * 6.283;
      k.rockPx((ix + Math.cos(a) * (R - 2)) * S, Y(iu + Math.sin(a) * (R - 2)) * S, 2.4 + g() * 3, C.rock, i);
    }
    k.reserve(ix - R, Y(iu + R), R * 2, R * 2);
  }
  // the phantom sandbar: a white crescent standing out of the reef, tour boats nosed up to it, people walking it, parasols
  {
    const g = rng(5960);
    for (let q = 0; q < 8; q++) {
      const x = 26 + q * 5.4 + g() * 2;
      const u = 5952 + q * 1.8 + (g() - 0.5) * 5;
      if (landD(x, u) > 1.4) {
        const X = x * S;
        const Yy = Y(u) * S;
        const c = [0xe0402a, 0x2a7ad0, 0xf0b020][q % 3];
        for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) if (i * i + j * j < 34) img.tintPx(X + i + 3, Yy + j + 4, 0.76);
        for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) if (i * i + j * j < 32) img.px(X + i, Yy + j, Math.floor(((Math.atan2(j, i) + 3.15) / 6.3) * 8) % 2 ? c : scaleColor(c, 1.25));
      }
    }
    k.standing(30, Y(5966), 36, 8, 10, 5961, undefined);
    kit.loop(46, 5945, [fisher(k, 5940, 0xe8e4dc)], { d: 0.02 });
    kit.loop(66, 5956, [fisher(k, 5950, 0x2a5a8a)], { d: 0.02 });
    k.reserve(14, Y(5980), 70, 40);
  }
  // a cruise liner passing far out, sailboats, fishers working, a long line of floats
  const cruise = k.hull(44, 12, 5500, 0x22304a, 0xf2f2ee, (r, FL, FHh) => {
    for (let j = 7; j < FHh - 7; j++) for (let i = 18; i < 104; i++) r.px(i, j, (i - 18) % 8 === 0 ? 0x8a9aa8 : j % 3 ? 0xf8f8f4 : 0x3a6a9a);
    for (let j = 12; j < FHh - 12; j++) for (let i = 40; i < 60; i++) r.px(i, j, 0x3ab0d8);
    r.discPx(28, FHh >> 1, 4, 0xe8a020);
    r.discPx(28, FHh >> 1, 2, 0x1a1a1e);
  });
  kit.path([[-80, 5480], [W + 80, 5560]], [cruise], { sp: 6, turn: 'rot', d: 0.02, s0: 0.5, wake: wake(5500) });
  kit.path([[20, 5000], [40, 5500], [10, 5900]], [sail(k, 5400, 0xf2eee0)], { sp: 5, mode: 'pp', hold: 5, turn: 'rot', d: 0.02, s0: 0.2, wake: wake(5400) });
  kit.path([[150, 5300], [130, 5700], [150, 6100]], [sail(k, 5700, 0xe04a2a)], { sp: 5, mode: 'pp', hold: 5, turn: 'rot', d: 0.02, s0: 0.5, wake: wake(5700) });
  kit.path([[-20, 5640], [90, 5660], [W + 20, 5630]], [fisher(k, 5650, 0xe8e4dc)], { sp: 4.5, turn: 'rot', d: 0.02, s0: 0.6, wake: wake(5650) });
  kit.path([[W + 20, 6470], [90, 6450], [-20, 6480]], [fisher(k, 6460, 0x2a5a8a)], { sp: 4.5, turn: 'rot', d: 0.02, s0: 0.3, wake: wake(6460) });
  for (const [x, u, c] of [[26, 5200, 0x3a7a5a], [150, 5860, 0xe8e4dc], [24, 6420, 0x8a3a2a]]) kit.loop(x, u, [fisher(k, u, c)], { d: 0.02 });
  for (const [x0, u0, x1, u1, bow] of [[100, 5430, 170, 5390, 18], [10, 5760, 70, 5790, -14], [120, 6060, 176, 6040, 12]]) {
    let last = null;
    for (let t = 0; t <= 1.0001; t += 0.015) {
      const X = (x0 + (x1 - x0) * t) * S;
      const Yy = Y(u0 + (u1 - u0) * t + Math.sin(t * Math.PI) * bow) * S;
      if (last) img.linePx(Math.round(last[0]), Math.round(last[1]), Math.round(X), Math.round(Yy), 0xc8d4d4, 0.35);
      last = [X, Yy];
      if (Math.round(t / 0.015) % 3 === 0) {
        const c = Math.round(t / 0.015) % 6 === 0 ? 0xe8783a : 0xe8e4d8;
        img.discPx(X, Yy, 1.6, scaleColor(c, 0.7));
        img.px(X - 1, Yy - 1, c);
      }
    }
  }
  // ---- the lighthouse island: a white tower on the summit, the keeper's house, the trail down to a jetty and the supply boat
  {
    const [iu, ix] = ISLETS.find((i) => i[3] === 'l');
    const lx = ix;
    const lu = iu + 6;
    img.fine(lx - 9, Y(lu + 8), 18, 15, (X, Yy, x, y) => {
      const e = ((x - lx) / 9) ** 2 + ((y - Y(lu)) / 7) ** 2;
      return e > 1 ? null : k.settPx(X, Yy, 2230, C.coral);
    });
    objects.push({
      y: Y(lu) + 2,
      shadow: () => k.shadowEllipse(lx + 7, Y(lu) + 2, 9, 3, 0.55),
      draw: () => {
        const X = lx * S;
        const Yb = Y(lu) * S;
        for (let j = 0; j < 54; j++) {
          const hw = 9 - j * 0.07;
          for (let i = -hw; i <= hw; i++) {
            const q = (i + hw) / (2 * hw);
            let c = q < 0.2 ? 0xffffff : q < 0.72 ? 0xf0ece4 : 0xb8b4ac;
            if (j % 18 < 3) c = 0xc8c4bc;
            img.px(X + i, Yb - j, c);
          }
        }
        for (let i = -9; i <= 9; i++) for (let j = 0; j < 3; j++) img.px(X + i, Yb - 54 - j, j === 2 ? 0xe8e4dc : 0x4a4e54);
        for (let j = 0; j < 9; j++) for (let i = -5; i <= 5; i++) glowPx(X + i, Yb - 57 - j, i % 3 === 0 ? 0x4a5058 : 0xfff2a0, 0.95);
        for (let j = 0; j < 5; j++) for (let i = -6 + j; i <= 6 - j; i++) img.px(X + i, Yb - 66 - j, 0xc8302a);
      },
    });
    k.reserve(lx - 9, Y(lu + 8), 18, 15);
    const flash = [3, 6].map((r) => k.sprite(7, 7, lu, (q) => {
      q.discPx(10, 10, r + 3, 0xfff2a0, 0.4);
      q.discPx(10, 10, r, 0xffffff);
    }, false));
    kit.loop(lx - 3, lu + 24, flash, { seq: [1, 0, -1, 1, 0, ...Array(18).fill(-1)], fps: 8, fx: 1 });
    house(ix - 24, Y(iu - 10), 16, 10, { faceH: 3.4 });
    // the trail, the jetty, the boat
    const trail = [[lx - 8, lu - 7], [lx - 16, iu - 13], [ix - 8, iu - 24], [ix - 1, iu - 42]];
    k.road(trail, 1.3, { side: 0, kerb: 0x7a6a50, piece: true, paint: (X, Yy) => rampColor(C.lane, 0.3 + hashPx(X >> 1, Yy >> 1, 2231) * 0.5, X, Yy) });
    img.fine(ix - 3, Y(iu - 40), 4, 16, (X, Yy) => (X % 12 < 2 ? C.wood[0] : Yy % 6 === 0 ? C.wood[0] : hashPx(X >> 2, Yy >> 2, 2232) < 0.5 ? C.wood[2] : C.wood[3]));
    for (let Yy = Y(iu - 40) * S; Yy < Y(iu - 56) * S; Yy++) for (let i = 0; i < 4; i++) if (k.wetPx((ix + 1) * S + i, Yy)) img.px((ix + 1) * S + i, Yy, 0x0a1a2a, 0.3);
    k.reserve(ix - 3, Y(iu - 40), 4, 16);
    kit.loop(ix + 3, iu - 44, [fisher(k, iu, 0xf2eee0)], { d: 0.02 });
    k.walkers(trail, 1, iu, { sp: 2.2, gap: 40 });
    k.standing(lx - 6, Y(lu - 2), 12, 3, 3, 2233, undefined);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * 6.283 + hashPx(i, 1, 2234) * 0.4;
      const tx = ix + Math.cos(a) * 30;
      const ty = Y(iu + Math.sin(a) * 28);
      if (!k.isRes(tx, ty) && !k.isRes(tx + 4, ty) && !k.isRes(tx - 4, ty)) plant(i % 3 ? 'tropic' : 'palm', tx, ty, 6 + hashPx(i, 2, 2234) * 2, i + 2235);
    }
  }
  void objects;
  void rampColor;
  void fbm;
  void mix;
}

export function paintLiveSea(k) {
  const { Y, kit } = k;
  // ---- waves rolling in: foam dashes laid along the coast at four distances out, each lit in turn, towards the sand. They don't move:
  // they swell and die in place. One little tile per direction the coast runs, used over and over.
  const DIRS = [[1, 0], [0.7, 0.7], [0, 1], [-0.7, 0.7]];
  const tiles = DIRS.flatMap(([dx, dy], n) => [0, 1].map((v) => k.sprite(14, 14, 1000, (r) => {
    const g = rng(n * 7 + v + 91);
    for (let q = -20; q <= 20; q++) {
      const o = Math.sin(q * 0.22 + v * 2) * 2.4;
      if (hashPx(q + 40, v, 92 + n) < 0.3) continue;
      const X = 21 + dx * q - dy * o;
      const Yy = 21 + dy * q + dx * o;
      r.px(X, Yy, C.foam, 0.92);
      if (g() < 0.5) r.px(X - dy * 1.5, Yy + dx * 1.5, 0xd8f0f0, 0.55);
      if (g() < 0.3) r.px(X - dy * 3.5, Yy + dx * 3.5, 0xd8f0f0, 0.35);
    }
  })));
  const STEP = 11;
  for (let u0 = 0; u0 < L; u0 += 320) {
    const parts = [];
    for (let line = 0; line < 4; line++) {
      const dk = 3.5 + line * 4;
      for (let u = u0; u < Math.min(L, u0 + 320); u += STEP)
        for (let x = 0; x < W; x += STEP) {
          const jx = x + hashPx(x, u, 96 + line) * STEP;
          const ju = u + hashPx(x, u, 97 + line) * STEP;
          // find the contour within this cell
          let best = null;
          for (let q = 0; q < 6; q++) {
            const px = jx + hashPx(q, x + u, 98) * STEP - STEP / 2;
            const pu = ju + hashPx(q, x + u, 99) * STEP - STEP / 2;
            const d = landD(px, pu);
            if (d >= 0) continue;
            const e = Math.abs(d + dk);
            if (e < 1.4 && (!best || e < best[2])) best = [px, pu, e];
          }
          if (!best) continue;
          const [px, pu] = best;
          const gx = landD(px + 1.5, pu) - landD(px - 1.5, pu);
          const gu = landD(px, pu + 1.5) - landD(px, pu - 1.5);
          if (Math.hypot(gx, gu) < 0.02) continue;
          // the crest runs across the slope; on screen, y runs down
          const ang = (Math.atan2(gx, gu) + Math.PI) % Math.PI; // of the crest
          const dir = Math.round((ang / Math.PI) * 4) % 4;
          parts.push([dir * 2 + (Math.floor(px + pu) % 2 ? 1 : 0), px - 7, pu + 7, line * 1.1 + hashPx(Math.floor(px / 30), Math.floor(pu / 30), 100) * 0.3]);
        }
    }
    if (parts.length) kit.wave(tiles, parts, { w: 1.4, a0: 0, a1: 0.92, pw: 3 });
  }
  // white water breaking over the reef edges, in place
  for (const [ru, rx, R] of REEFS) {
    const parts = [];
    for (let q = 0; q < R * 1.3; q++) {
      const a = (q / (R * 1.3)) * 6.283;
      const px = rx + Math.cos(a) * R;
      const pu = ru + Math.sin(a) * R;
      if (px < -6 || px > W + 6 || landD(px, pu) > -2) continue;
      if (hashPx(q, ru, 101) < 0.35) continue;
      const dir = Math.round((((a + Math.PI / 2) % Math.PI) / Math.PI) * 4) % 4;
      parts.push([dir * 2 + (q % 2), px - 7, pu + 7, q * 0.8]);
    }
    if (parts.length) kit.wave(tiles, parts, { w: 1.1, a0: 0, a1: 0.85, pw: 4 });
  }
  // the lagoons glint: short bright ripples coming and going over the shallows
  const glint = [9, 15, 9].map((len, i) => k.sprite(5, 1, 1000, (r) => {
    for (let x = (15 - len) >> 1; x < ((15 - len) >> 1) + len; x++) r.px(x, 1, i === 1 ? 0xffffff : 0xd8f4f0, i === 1 ? 0.9 : 0.6);
  }));
  for (let u0 = 0; u0 < L; u0 += 256) {
    const rects = [];
    for (let u = u0 + 8; u <= u0 + 256 && u <= L; u += 8)
      for (let x = 0; x + 12 <= W; x += 12) {
        const ok = [[0, 0], [11, 0], [0, -7], [11, -7], [6, -4]].every(([dx, du]) => landD(x + dx, u + du) < -4 && shallowS(x + dx, u + du) > 0.3);
        if (ok) rects.push([x, u, 12, 8]);
      }
    if (rects.length) kit.spot(rects, glint, { rate: Math.min(14, rects.length * 0.08), fps: 7, a: 0.8 });
  }
  const shade = 0x0e2a34;
  // sea turtles gliding in the water, half seen through it
  const turtle = [0, 1].map((f) => k.sprite(11, 9, 300, (r) => {
    r.discPx(14, 13, 8, shade);
    for (let q = 0; q < 8; q++) r.px(10 + (q % 3) * 4, 9 + (q >> 1) * 3, 0x24505a);
    r.discPx(25, 13, 3.4, shade);
    for (const s of [-1, 1]) {
      for (let t = 0; t < 8; t++) r.rectPx(18 - t * (f ? 0.2 : 0.7), 13 + s * (6 + t), 3, 2, shade);
      for (let t = 0; t < 3; t++) r.rectPx(7 - t, 13 + s * (6 + t), 2, 2, shade);
    }
  }));
  kit.wander(92, 320, 34, 76, turtle, { n: 2, sp: 4, idle: 0.1, fps: 1.5, a: 0.45, d: -0.4 });
  kit.wander(60, 5330, 30, 90, turtle, { n: 2, sp: 4, idle: 0.1, fps: 1.5, a: 0.45, d: -0.4 });
  kit.wander(60, 6000, 30, 60, turtle, { n: 1, sp: 4, idle: 0.1, fps: 1.5, a: 0.45, d: -0.4 });
  // schools of fish and manta rays under the surface
  const school = [0, 1].map((f) => k.sprite(14, 10, 300, (r) => {
    const g = rng(400 + f);
    for (let i = 0; i < 34; i++) {
      const a = g() * 6.283;
      const d = Math.sqrt(g()) * 12;
      const X = 21 + Math.cos(a) * d * 1.4;
      const Yy = 15 + Math.sin(a) * d * 0.9;
      r.px(X, Yy, shade);
      r.px(X - 1, Yy, shade, 0.7);
      r.px(X + 1, Yy, shade, 0.5);
      if (g() < 0.14) r.px(X, Yy - 1, 0xa8d8e0, 0.8);
    }
  }));
  for (const [x, u, rx, ry] of [[80, 5300, 50, 90], [110, 5980, 40, 70], [60, 6700, 44, 120], [130, 300, 30, 80]]) kit.wander(x, u, rx, ry, school, { n: 1, sp: 9, idle: 0, fps: 2, a: 0.4, d: -0.4 });
  const manta = [0, 1].map((f) => k.sprite(15, 15, 5200, (r) => {
    const span = f ? 18 : 21;
    for (let j = -span; j <= span; j++) {
      const w0 = 12 * (1 - Math.abs(j) / span) ** 0.8;
      for (let i = -w0; i <= w0 * 0.6; i++) r.px(22 + i, 22 + j, shade);
    }
    for (const s of [-1, 1]) for (let q = 0; q < 5; q++) r.px(29 + q, 22 + s * 3, shade);
    for (let i = 1; i <= 14; i++) r.px(22 - 11 - i, 22, shade, 0.7);
    for (let q = 0; q < 5; q++) r.px(18 + q * 2, 19 + (q % 2) * 6, 0x24505a);
  }));
  kit.path([[-20, 5180], [80, 5240], [190, 5200]], manta, { sp: 6, turn: 'rot', fps: 1.2, a: 0.42, d: -0.4 });
  kit.path([[200, 5700], [100, 5660], [-20, 5720]], manta, { sp: 5, turn: 'rot', fps: 1, a: 0.42, d: -0.4 });
  kit.path([[-20, 6500], [90, 6440], [200, 6520]], manta, { sp: 6, turn: 'rot', fps: 1.2, a: 0.42, d: -0.4 });
  // a humpback breaching, its fluke going under, a blow
  const SZ = 23;
  const whale = (q) => k.sprite(SZ, SZ, 6000, (r) => {
    const c = 34;
    const spray = (rr, n, a) => {
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * 6.283;
        const d = rr * 3 + ((i * 7) % 7) - 3;
        r.discPx(c + Math.cos(ang) * d, c + Math.sin(ang) * d * 0.8, 1.2, 0xf4fafa, a);
      }
    };
    const body = (len, wide, fins) => {
      for (let j = -len * 3; j <= len * 3; j++) {
        const w0 = wide * 3 * Math.sqrt(Math.max(0, 1 - (j / (len * 3 + 3)) ** 2));
        for (let i = -w0; i <= w0; i++) r.px(c + i, c + j, i > w0 - 3 ? 0x8a98a4 : j > 0 && Math.abs(i) < w0 * 0.5 && (i + 40) % 4 < 2 ? 0xc8d0d8 : j < -len * 3 + 6 ? 0x2a3440 : 0x3a4654);
      }
      if (fins) for (let t = 1; t <= 18; t++) for (const s of [-1, 1]) r.discPx(c + s * (wide * 3 + t), c - 6 + t * 0.6, 1.4, t > 12 ? 0xe8eef0 : 0xd0d8dc);
    };
    if (q === 0) for (let j = -21; j <= 21; j++) for (let i = -9; i <= 9; i++) if ((i / 9) ** 2 + (j / 21) ** 2 < 1) r.px(c + i, c + j, 0x0a1e2a, 0.35);
    if (q === 1) {
      for (let j = -21; j <= 21; j++) for (let i = -9; i <= 9; i++) if ((i / 9) ** 2 + (j / 21) ** 2 < 1) r.px(c + i, c + j, 0x0a1e2a, 0.4);
      spray(4, 14, 0.8);
    }
    if (q === 2) {
      body(4, 2, false);
      spray(6, 18, 0.9);
    }
    if (q === 3) {
      body(8, 3, true);
      spray(8, 22, 0.7);
    }
    if (q === 4) {
      r.discPx(c, c, 21, 0xf4fafa, 0.9);
      r.discPx(c, c, 12, 0xffffff);
      spray(9, 24, 0.8);
    }
    if (q === 5) {
      for (let rr = 6; rr <= 9; rr++) spray(rr, 28, rr === 9 ? 0.8 : 0.4);
      r.discPx(c, c, 9, 0xe8f6f6, 0.6);
    }
    if (q === 6) spray(10, 30, 0.5);
    if (q === 7) spray(10.5, 16, 0.3);
  });
  const breach = [0, 0, 1, 2, 3, 3, 4, 5, 6, 7].map(whale);
  const dive = [0, 1, 2, 3, 3, 4, 5, 6].map((q) => k.sprite(15, 9, 6000, (r) => {
    const h = [1, 2, 3, 3, 2, 1, 0][q];
    if (h) {
      for (let i = 1; i <= 18; i++) for (const s of [-1, 1]) for (let j = 0; j < Math.min(h, 2) * 3; j++) r.px(22 + s * i, 9 + j - i * 0.25 + 3, i > 12 ? 0x2a3440 : 0x3a4654);
      r.rectPx(21, 12, 3, h * 3 + 3, 0x3a4654);
      r.rectPx(20, 7, 5, 2, 0xd8e0e4);
    }
    for (let i = -14 - (q > 3 ? 6 : 0); i <= 14 + (q > 3 ? 6 : 0); i += 2) if ((i + q) % 4 === 0) r.discPx(22 + i, 22, 1, 0xf0f8f8, 0.7);
  }));
  const blow = [6, 9, 12, 12].map((rr, i) => k.sprite(11, 11, 6000, (r) => {
    for (let n = 0; n < 30; n++) {
      const a = n * 2.4;
      const d = (n % 5) * (rr / 5) + 1;
      r.px(16 + Math.cos(a) * d, 16 + Math.sin(a) * d, 0xf8fcfc, i === 3 ? 0.4 : 0.85);
    }
  }));
  const open = [[10, 5640, 160, 140], [30, 6080, 120, 120], [20, 6960, 140, 160]];
  kit.spot(open, breach, { rate: 0.07, fps: 6, a: 0.95 });
  kit.spot(open, dive, { rate: 0.08, fps: 4, a: 0.9 });
  kit.spot(open, blow, { rate: 0.12, fps: 5, a: 0.9 });
  // gulls and terns over the islands and boats (they do fly)
  const gull = [0, 1].map((f) => k.sprite(9, 4, 500, (r) => {
    for (let i = 1; i < 12; i++) {
      const dy = f ? Math.round(i * 0.3) : Math.round(i * -0.24 + (i > 7 ? (i - 7) * 0.5 : 0));
      for (let j = 0; j < (i > 8 ? 1 : 2); j++) {
        r.px(13 - i, 6 + dy + j, i > 9 ? 0x3a3a40 : 0xe8ecec);
        r.px(13 + i, 6 + dy + j, i > 9 ? 0x3a3a40 : 0xc8ccd0);
      }
    }
    for (let j = 4; j < 9; j++) for (let i = -1; i <= 1; i++) r.px(13 + i, j, 0xf8f8f8);
  }));
  for (const [x, u, rr, n, w] of [[30, 250, 26, 3, 0.3], [150, 590, 22, 2, -0.26], [60, 720, 34, 2, 0.28], [38, 5420, 20, 2, 0.3], [90, 6230, 40, 3, -0.26], [46, 5958, 26, 2, 0.32], [110, 4900, 30, 2, -0.3]]) kit.orbit(x, u, rr, gull, { ry: rr * 0.7, w, n, d: 2.2, a: 0.9 });
  // squalls: a dark shower cloud's shadow and its slanting rain drifting over the sea
  const sq = k.sprite(110, 76, 500, (r) => {
    for (let y = 0; y < 228; y++)
      for (let x = 0; x < 330; x++) {
        const lx = x / 3;
        const ly = y / 3;
        const d = ((lx - 55) / 53) ** 2 + ((ly - 38) / 36) ** 2 + (fbm(lx, ly, { seed: 2231, scale: 14, octaves: 2 }) - 0.5) * 0.8;
        if (d >= 1) continue;
        if (d > 0.65 && (d - 0.65) / 0.35 > hashPx(x >> 1, y >> 1, 102)) continue;
        r.px(x, y, (x * 3 + y * 2) % 33 < 2 && d < 0.8 ? 0x8a9aa8 : 0x0a1420);
      }
  }, false);
  kit.path([[-80, 300], [260, 520]], [sq], { sp: 5, turn: 'none', a: 0.3, d: 0.4, fx: 1, s0: 0.35 });
  kit.path([[260, 5300], [-80, 5700]], [sq], { sp: 4, turn: 'none', a: 0.28, d: 0.4, fx: 1, s0: 0.5 });
  void puff;
  void Y;
  void reefD;
}
