// The Nakashima river and Suwa Shrine, in fine pixels.
//   The river comes down from the hills off the top-left edge, swings into the middle of the old town and runs south to
//   Shinchi's west side and into Dejima's channel. Stone walls, a walkway at the water on both sides by the bridges,
//   willows and lamps. Every street crosses it on a bridge of its own: a road bridge at the mouth, a stone arch for
//   Shinchi's west gate, the 3660 road bridge, Meganebashi (1634) with its two arches doubled into spectacles by their
//   reflection, the stepping stones below it, the heart-shaped stone in the wall, a single-arch bridge upstream.
//   The old town: tiled houses on their lanes, the Hamanomachi arcade, Sōfuku-ji's vermilion dragon-palace gate and its
//   halls, its hillside of graves.
//   Suwa Shrine: the dance ground of the Kunchi at the foot of the long stone stairway with its tiered seats, three
//   torii up the stairs, lanterns, the gankake komainu, the copper-roofed halls in their camphor grove.
import { rng, fbm } from '../../lib/raster.mjs';
import { C, S, night, scaleColor, rampColor, hashPx } from './canvas.mjs';
import { W, riverX, riverHW, channelHW, RIVER, EMBANK, STREETS } from './geo.mjs';
import { tramStop } from './town.mjs';

const WILLOW = [0x2a4a2a, 0x3a623a, 0x507a48, 0x6a9258];
const CAMPHOR = [0x1a3422, 0x284a2c, 0x3a6236, 0x527c44];
const CEDAR = Object.assign([0x12261e, 0x1c382a, 0x2a4c38, 0x3e664c], { kind: 'cedar' });
const ROAD_BRIDGES = [2990, 3660, 4060];

export function paintNakashima(k) {
  const { img, Y, kit, objects, glowPx, pool } = k;
  const R = rng(1634);

  // the channel: keep everything else out of it; walkways at the water's edge by the bridges, the wall's fine courses
  for (let Yy = Y(RIVER[1]) * S; Yy < Y(RIVER[0]) * S; Yy++) {
    const u = 7168 - (Yy + 0.5) / S;
    const cx = riverX(u);
    const ch = channelHW(u);
    const hw = riverHW(u);
    const XA = Math.max(0, Math.floor((cx - ch - 1.4) * S));
    const XB = Math.min(W * S - 1, Math.ceil((cx + ch + 1.4) * S));
    for (let X = XA; X <= XB; X++) {
      if (k.fineWater[Yy * k.FW + X]) continue;
      const d = Math.abs((X + 0.5) / S - cx);
      if (d > ch + 1.34) continue;
      let c;
      if (d > ch + 0.34) {
        // the top of the embankment wall, dressed stone, a lit edge
        c = (Yy + X) % 15 === 0 ? C.granite[1] : d > ch + 1 ? C.granite[4] : C.granite[3];
      } else if (d >= hw) {
        if (d > ch - 0.5) c = (Yy >> 2) % 2 ? 0x2a2a2c : 0x3a3a3c; // the wall's foot in shadow
        else if (d < hw + 0.67) c = C.granite[2]; // the walkway's edge at the water
        else c = k.settPx(X, Yy, 30, C.stoneSet);
      } else continue;
      img.px(X, Yy, c);
    }
  }
  for (let u = RIVER[0]; u < RIVER[1]; u++) {
    const cx = riverX(u);
    const ch = channelHW(u);
    k.reserve(Math.floor(cx - ch - 2), Y(u), Math.ceil(ch * 2 + 4), 1);
  }
  // steps down to the walkways
  for (const u of [3800, 3930, 3990, 4110]) {
    const cx = riverX(u);
    for (const side of [-1, 1]) {
      const x0 = Math.round(cx + side * channelHW(u));
      k.stairs(side > 0 ? x0 - 4 : x0, Y(u + 8), 4, 8);
    }
  }
  // willows and lamps along the banks
  for (let u = EMBANK + 30; u < 4240; u += 24) {
    const cx = riverX(u);
    const ch = channelHW(u);
    for (const side of [-1, 1]) {
      const x = cx + side * (ch + 5);
      if (x < 2 || x > 150 || (k.isRes(Math.round(x), Y(u)) && !(u % 48 === 6))) continue;
      if (STREETS.some((s) => Math.abs(s.u - u) < s.hw + 6)) continue;
      if ((u / 24 + (side > 0 ? 1 : 0)) % 2) k.tree(x, Y(u), 4.5, WILLOW, u * 3 + side);
      else k.streetLamp(Math.round(x), u, 0xffe8b8);
    }
  }
  // moored sampans under the banks, lanterns on them; carp and ducks; glints on the current
  const sampan = (u) => k.hull(13, 4, u, C.wood[1], C.wood[2], (r, FL, FHh) => {
    for (let i = 8; i < 22; i += 3) r.px(i, FHh >> 1, C.wood[0]);
    r.rectPx(14, 3, 3, 3, 0xe83a2a);
    r.px(15, 4, 0xffc080);
  });
  for (const [x, u] of [[94, 3780], [84, 4000], [84, 3930], [90, 4030], [12, 3120], [12, 3480], [16, 3260]]) kit.loop(x, u + 2, [sampan(u)], { d: 0.02 });
  const duck = [0, 1].map((f) => k.sprite(4, 3, 3900, (r) => {
    for (let i = 1; i < 9; i++) for (let j = 3; j < 8; j++) r.px(i, j, j < 5 ? 0x8a7a60 : 0x6a5a44);
    r.rectPx(9, 1, 2, 3, 0x2a5a3a);
    r.px(11, 2, 0xe8a040);
    r.px(f ? 0 : 2, 8, 0xd8f0f0, 0.6);
  }));
  const carp = (col) => [0, 1].map((f) => k.sprite(4, 3, 3900, (r) => {
    for (let i = 0; i < 10; i++) {
      const hw = Math.sin((i / 9) * Math.PI) * 1.7;
      const cy = 4 + (f ? 1 : -1) * Math.sin(i * 0.5) * 0.7;
      for (let j = -hw; j <= hw; j += 0.5) r.px(i, cy + j, i > 3 && i < 7 ? 0xfff4e8 : col);
    }
  }, false));
  kit.wander(90, 3960, 9, 60, duck, { n: 3, sp: 3, turn: 'flip', fps: 2, idle: 0.5 });
  kit.wander(90, 3830, 8, 30, carp(0xe86a2a), { n: 3, sp: 5, turn: 'rot', fps: 3, idle: 0.2, d: 0.02 });
  kit.wander(90, 3950, 8, 30, carp(0xf0e8e0), { n: 2, sp: 5, turn: 'rot', fps: 3, idle: 0.2, d: 0.02 });
  kit.wander(18, 3200, 5, 120, duck, { n: 2, sp: 3, turn: 'flip', fps: 2, idle: 0.5 });
  const glint = [0, 1, 2, 3].map((f) => k.sprite(30, 60, 3900, (r) => {
    for (let q = 0; q < 34; q++) r.rectPx(((q * 37 + f * 9) % 84), (q * 53 + f * 27) % 174, 3 + (q % 4) * 2, 1, 0xa8d0d4, 0.2 + (q % 3) * 0.1);
  }, false));
  for (const u of [3140, 3420, 3830, 4010]) kit.loop(Math.round(riverX(u)) - 15, u + 30, glint, { fps: 2, fx: 1, d: 0.02 });

  // ---- bridges: a deck across the channel at u (±hw), its south face over the water, parapets on both sides
  const deckFace = (x0, x1, u, hw, top, face, opt = {}) => {
    const yN = Y(u + hw + 1);
    const yS = Y(u - hw - 1);
    objects.push({
      y: yS + 1,
      shadow: () => {
        for (let Yy = (yS + face) * S; Yy < (yS + face + 8) * S; Yy++)
          for (let X = x0 * S; X <= x1 * S; X++) if (k.wetPx(X, Yy)) img.px(X, Yy, 0x061014, 0.5 * (1 - (Yy - (yS + face) * S) / (8 * S)));
      },
      draw: () => {
        const NY = yN * S;
        const SY = (yS + 1) * S;
        for (let Yy = NY; Yy < SY; Yy++)
          for (let X = x0 * S; X < (x1 + 1) * S; X++) {
            const eN = Yy - NY;
            const eS = SY - 1 - Yy;
            let c;
            if (eN < 3 || eS < 3) c = (eN === 0 || eS === 2) ? opt.rail ?? C.granite[4] : opt.rail2 ?? C.granite[2];
            else c = top(X, Yy);
            img.px(X, Yy, c);
          }
        for (let j = 0; j < face * S; j++) for (let X = x0 * S; X < (x1 + 1) * S; X++) img.px(X, SY + j, opt.face ? opt.face(X, j) : hashPx(X >> 1, j >> 1, 1631) < 0.5 ? C.concrete[1] : C.concrete[2]);
        opt.extra?.(yN, yS);
      },
    });
  };
  for (const u of ROAD_BRIDGES) {
    const s = STREETS.find((st) => st.u === u);
    const cx = riverX(u);
    const ch = channelHW(u);
    const x0 = Math.floor(cx - ch - 2);
    const x1 = Math.ceil(cx + ch + 1);
    deckFace(x0, x1, u, s.hw + 2, (X, Yy) => {
      const q = Math.abs(7168 - (Yy + 0.5) / S - u);
      if (q < 0.25 && X % 18 < 9) return 0xdad6c8;
      if (q > s.hw) return k.pavePx(X, Yy);
      if (q > s.hw - 0.34) return 0x8a8a8e;
      return k.asphaltPx(X, Yy);
    }, 3, {
      rail: 0xe8e8e0,
      extra: (yN) => {
        for (const lx of [x0 + 2, x1 - 2]) {
          for (let j = 0; j < 15; j++) {
            img.px(lx * S, yN * S - j, 0x5a5e66);
            img.px(lx * S + 1, yN * S - j, 0x2e323a);
          }
          glowPx(lx * S, yN * S - 16, 0xfff0c8);
          glowPx(lx * S + 1, yN * S - 16, 0xfff0c8);
          pool(lx, yN - 3, 7, C.lamp, 0.1 + night(u) * 0.24);
        }
      },
    });
  }
  /** A stone arch's south face: fitted voussoirs round the dark openings, dressed courses in the spandrels. */
  const archFace = (centres, ar, faceH) => (X, j) => {
    const x = (X + 0.5) / S;
    const v = j / S;
    for (const ax of centres) {
      const dx = Math.abs(x - ax);
      const top = faceH - (Math.sqrt(Math.max(0, ar * ar - dx * dx)) * (faceH - 1)) / ar;
      if (dx < ar && v >= top) return j % 9 < 1 ? 0x101c20 : 0x081216;
      const outer = faceH - (Math.sqrt(Math.max(0, (ar + 1.6) ** 2 - dx * dx)) * (faceH - 0.2)) / (ar + 1.6);
      if (dx < ar + 1.6 && v >= outer && v < top) {
        const ang = Math.floor(Math.atan2(v - faceH, x - ax) * 7);
        return ang % 2 ? C.granite[3] : C.granite[1];
      }
    }
    const row = j >> 2;
    const XX = X + row * 5;
    if (j % 4 === 3 || XX % 12 === 0) return scaleColor(C.granite[0], 0.78);
    return scaleColor(C.granite[1 + Math.floor(hashPx(XX >> 3, row, 1632) * 3)], 1 - (j / (faceH * S)) * 0.2);
  };
  // Shinchi's west gate bridge: a low stone arch for walkers
  {
    const u = 3330;
    const cx = riverX(u);
    const ch = channelHW(u);
    deckFace(Math.floor(cx - ch - 2), Math.ceil(cx + ch + 1), u, 7, (X, Yy) => k.settPx(X, Yy, 37, C.stoneSet), 5, { face: archFace([cx], ch - 1, 5) });
  }
  // Meganebashi: two stone arches; with their reflection they make the spectacles
  {
    const u = 3880;
    const cx = riverX(u);
    const ch = channelHW(u);
    const x0 = Math.floor(cx - ch - 3);
    const x1 = Math.ceil(cx + ch + 2);
    const arches = [cx - ch / 2 + 0.5, cx + ch / 2 - 0.5];
    const ar = ch / 2 - 1.5;
    const face = 9;
    deckFace(x0, x1, u, 5, (X, Yy) => {
      // the humped deck of fitted granite, the middle catching the light
      const x = (X + 0.5) / S;
      const hump = 1 - Math.abs(x - cx) / (ch + 3);
      const XX = X + (Yy >> 3) * 7;
      if (Yy % 8 === 0 || XX % 15 === 0) return scaleColor(C.granite[0], 0.86);
      return rampColor(C.granite, 0.3 + hump * 0.45 + (hashPx(XX >> 3, Yy >> 3, 39) - 0.5) * 0.25, X, Yy);
    }, face, { rail: 0xe6e2d8, rail2: 0xa8a49a, face: archFace(arches, ar, face) });
    // the reflection: each arch mirrored in the still water below, closing the circle
    const yS = Y(u - 6);
    for (const ax of arches)
      for (let a = 0; a <= Math.PI; a += 0.01) {
        const X = Math.round((ax + Math.cos(a) * (ar + 0.5)) * S);
        const Yy = Math.round((yS + face + Math.sin(a) * (face - 1) * 1.05) * S);
        if (!k.wetPx(X, Yy)) continue;
        const wob = Math.round(Math.sin(Yy * 0.5) * 1.2);
        for (let w = 0; w < 4; w++) img.px(X + wob, Yy + w, 0x9ab8ba, 0.6 - w * 0.12);
      }
    for (let Yy = (yS + face + 1) * S; Yy < (yS + face + 12) * S; Yy++) for (let X = (x0 + 2) * S; X < (x1 - 2) * S; X++) if (k.wetPx(X, Yy) && hashPx(X >> 2, Yy, 1633) > 0.9) img.px(X, Yy, 0x7a9a9c, 0.35);
    // the stepping stones a little downstream
    for (let x = Math.round(cx - riverHW(3846)) + 1; x < cx + riverHW(3846) - 2; x += 5) {
      const CX = x * S + 4;
      const CY = Y(3846) * S;
      k.rockPx(CX, CY, 6, C.granite, x);
      for (let i = -7; i <= 7; i += 2) img.px(CX + i, CY + 8, 0xc8e0e0, 0.4);
    }
    // the heart-shaped stone in the east wall, the people looking for it
    const hx = Math.round(cx + ch);
    const HY = Y(3862) * S;
    const HX = hx * S;
    for (let j = -4; j <= 6; j++)
      for (let i = -7; i <= 7; i++) {
        const q = i / 6.5;
        const p = -j / 5.5 + 0.2;
        if ((q * q + p * p - 1) ** 3 - q * q * p * p * p > 0) continue;
        img.px(HX + i, HY + j, q < -0.2 ? 0xf0b8b8 : 0xe0989a);
      }
    k.crowd(hx - 4, Y(3862) - 2, 4, 6, 3);
    k.strollers(cx, 3880, 16, 2, 5);
    k.walkers([[cx - ch + 2, 3800], [cx - ch + 2, 3990]], 3, 3880, { sp: 3, gap: 50 });
    k.walkers([[cx + ch - 2, 3995], [cx + ch - 2, 3805]], 3, 3880, { sp: 3, gap: 60 });
    // lanterns on the bridge, and in the water for the evening
    for (const lx of [x0 + 2, x1 - 2]) k.stoneLantern(lx, 3889, true);
  }
  // the single-arch stone bridge upstream, between Meganebashi and S3, for walkers on the walkways
  {
    const u = 3970;
    const cx = riverX(u);
    const hw = riverHW(u);
    deckFace(Math.floor(cx - hw - 1), Math.ceil(cx + hw), u, 3, (X, Yy) => k.settPx(X, Yy, 43, C.granite), 7, { face: archFace([cx], hw - 2, 7) });
  }

  // ---- Sōfuku-ji, in its own walled compound east of the river: the vermilion dragon-palace gate at the top of its
  // steps, the Daiyūhōden in its Chinese style, a hillside of upright graves behind (Nagasaki's terraced cemeteries)
  {
    const gx0 = 104;
    const gx1 = 150;
    const u0 = 4070;
    const u1 = 4258;
    k.fill(gx0, Y(u1), gx1 - gx0, u1 - u0, C.paving, 4071, 5);
    k.reserve(gx0, Y(u1), gx1 - gx0, u1 - u0);
    for (let Yy = Y(u1) * S; Yy < Y(u0) * S; Yy++) for (const X of [gx0 * S, gx1 * S - 3]) for (let i = 0; i < 3; i++) img.px(X + i, Yy, i === 0 ? 0xf0ece0 : 0xb8b4a8);
    // the terraced graves up the back of the compound, a lane climbing through them
    for (let u = 4182; u < 4254; u += 8) {
      k.stoneFace(gx0 + 2, gx1 - 2, Y(u), 1.4, u, C.granite);
      for (let x = gx0 + 4; x < gx1 - 3; x += 3) {
        if (Math.abs(x - 127) < 3) continue;
        const X = x * S;
        const Yy = Y(u + 2) * S;
        const h = 8 + Math.floor(hashPx(x, u, 4072) * 5);
        for (let j = 0; j < h; j++) for (let i = 0; i < 5; i++) img.px(X + i, Yy + 2 - j, j === h - 1 ? C.granite[4] : i < 1 ? C.granite[3] : i > 3 ? C.granite[0] : C.granite[2]);
        for (let i = 0; i < 6; i++) img.tintPx(X + i + 1, Yy + 3, 0.7);
        if (hashPx(x, u, 4073) < 0.2) {
          img.px(X + 1, Yy + 1, 0xe85a70);
          img.px(X + 3, Yy + 1, 0xf4e080);
        }
      }
    }
    k.stairs(125, Y(4258), 5, 76);
    // the Daiyūhōden: double eaves, red pillars, a stone court with its great incense burner
    k.house(gx0 + 6, Y(4176), gx1 - gx0 - 12, 18, 12, 'china', { ramp: C.kawara, wall: 0x7a2a22, door: true, doorX: 16 });
    k.flagFill(gx0 + 4, Y(4144), gx1 - gx0 - 8, 44, C.plaza, 4074, 15);
    objects.push({
      y: Y(4128),
      shadow: () => k.shadowEllipse(129, Y(4128) + 1, 5, 2, 0.66),
      draw: () => {
        const CX = 127 * S + 1;
        const Yb = Y(4128) * S;
        for (let j = 0; j < 15; j++) {
          const hw = 9 - Math.abs(j - 7) * 0.4;
          for (let i = -hw; i <= hw; i++) img.px(CX + i, Yb - j, i < -hw * 0.4 ? 0x6a5a3a : i < hw * 0.5 ? 0x4a3e28 : 0x2e2618);
        }
        for (let i = -7; i <= 7; i++) img.px(CX + i, Yb - 15, (i & 1) ? 0x1a1414 : 0xff8a40);
        glowPx(CX, Yb - 15, 0xffa050, 0.9);
      },
    });
    kit.emit(127, 4136, [[k.kit.frame(k.puff(5, 77, [0xc89878, 0xe4b890, 0xf8dcb8, 0xfff2dc]))]], { rate: 1.2, life: [1.5, 2.4], vy: 6, sx: 2, wf: 0.8, a: 0.35 });
    // the dragon-palace gate: a vermilion arched lower storey in white, a double curled roof
    objects.push({
      y: Y(4090),
      shadow: () => k.shadowRect(112, Y(4122), 34, 32, 0.55),
      draw: () => {
        const CX = 127 * S;
        const Yb = Y(4090) * S;
        for (let j = 0; j < 36; j++)
          for (let i = -48; i <= 48; i++) {
            let c = (j >> 2) % 5 === 0 ? C.vermilion[1] : C.vermilion[2];
            if (i < -45) c = C.vermilion[3];
            if (i > 45) c = C.vermilion[0];
            const d = Math.hypot(i / 15, (j - 36) / 28);
            if (d < 1) c = d > 0.86 ? 0xf0ece0 : 0x120c0c;
            img.px(CX + i, Yb - j, c);
          }
        for (let i = -48; i <= 48; i++) for (let j = 0; j < 4; j++) img.px(CX + i, Yb - 36 - j, j < 1 ? 0xf8f4e8 : 0xd8d4c8);
        for (let j = 0; j < 18; j++)
          for (let i = -27; i <= 27; i++) {
            let c = i < -24 ? C.vermilion[3] : i > 24 ? C.vermilion[0] : C.vermilion[2];
            if (j > 3 && j < 13 && (i + 60) % 12 > 3 && (i + 60) % 12 < 9) c = (i + j) % 3 === 0 ? 0x2a1a18 : 0xffd080;
            img.px(CX + i, Yb - 54 - j + 18 - 18, c);
          }
        k.roof(110, Y(4090) - 22, 34, 8, C.kawara, { curl: true, ridgeC: C.vermilion[2] });
        k.roof(116, Y(4090) - 32, 22, 7, C.kawara, { curl: true, ridgeC: C.gold });
        for (const s of [-40, 40]) for (let j = 0; j < 9; j++) for (let i = -2; i <= 2; i++) img.px(CX + s + i, Yb - 21 + j, j === 0 || j === 8 ? C.gold : 0xffa070);
        pool(127, Y(4090) - 6, 12, 0xff7040, 0.1 + night(4090) * 0.22);
      },
    });
    k.stairs(121, Y(4090), 12, 16);
    k.reserve(121, Y(4090), 12, 16);
    k.road([[127, 4066], [127, 4074]], 3, { side: 0, surface: C.stoneSet });
    for (const x of [116, 138]) k.stoneLantern(x, 4100, true);
    k.grove(gx0 + 2, gx1 - 2, 4100, 4176, 10, [CAMPHOR, WILLOW], 4075, 3.5, 5);
    k.strollers(127, 4120, 12, 8, 3);
  }
  // ---- the Hamanomachi arcade: a glass-roofed shopping lane through the blocks south of the middle street
  {
    const ax = 126;
    const u0 = 3667;
    const u1 = 3873;
    img.fine(ax - 6, Y(u1), 12, u1 - u0, (X, Yy) => {
      const q = (X + Yy) % 24 < 12 ? 0xb8b0a0 : 0xa4a08e;
      return (X >> 2) % 6 === 0 || (Yy >> 2) % 6 === 0 ? 0x8a8478 : q;
    });
    k.reserve(ax - 7, Y(u1), 14, u1 - u0);
    k.crowd(ax - 5, Y(u1), 10, u1 - u0, 50);
    k.walkers([[ax - 2, u0 + 2], [ax - 2, u1 - 2]], 4, 3760, { sp: 3, gap: 50 });
    k.walkers([[ax + 2, u1 - 2], [ax + 2, u0 + 2]], 4, 3760, { sp: 3, gap: 60 });
    // shopfronts down both sides: awnings and lit windows, facing in
    const NOR = [0xc83a2a, 0x2a5aa8, 0xe8c040, 0x2a7a5a, 0xe86aa0, 0xf0f0e8, 0xe87a30];
    for (const side of [-1, 1]) {
      const X0 = side < 0 ? (ax - 9) * S : (ax + 6) * S;
      img.fine(side < 0 ? ax - 9 : ax + 6, Y(u1), 3, u1 - u0, (X, Yy) => {
        const b = Math.floor(Yy / 24);
        const i = X - X0;
        const inner = side < 0 ? i : 8 - i;
        if (Yy % 24 < 1) return 0x24242a;
        const c = NOR[(b * 3) % NOR.length];
        if (inner > 5) return (Yy >> 1) % 2 ? c : 0xf0ece0;
        return inner > 3 ? 0xffe4a8 : 0x3a3438;
      });
      k.reserve(side < 0 ? ax - 9 : ax + 6, Y(u1), 3, u1 - u0);
    }
    objects.push({
      y: Y(u0) + 2,
      draw: () => {
        // the vault: panes in a steel frame, a ridge lantern, the crowd seen through the glass; banners at intervals
        const YT = (Y(u1) - 3) * S;
        const YB = (Y(u0) - 3) * S;
        const X0 = (ax - 6) * S;
        const X1 = (ax + 6) * S;
        for (let Yy = YT; Yy < YB; Yy++)
          for (let X = X0; X < X1; X++) {
            const i = X - X0;
            const q = i / (X1 - X0);
            if (i < 2 || X1 - X <= 2) {
              img.px(X, Yy, i < 2 ? 0xe8eef2 : 0x7a8088);
              continue;
            }
            if (Math.abs(q - 0.45) < 0.05) {
              img.px(X, Yy, Yy % 12 < 2 ? 0x8a949c : q < 0.45 ? 0xf0f6f8 : 0xc0d4dc);
              continue;
            }
            if (Yy % 36 < 2) img.px(X, Yy, Yy % 36 === 0 ? 0xe8eef2 : 0x8a949c);
            else if (i % 9 === 0 || Yy % 12 === 0) img.px(X, Yy, 0xb0bcc4, 0.7);
            else img.px(X, Yy, q < 0.5 ? 0xc8e4f0 : 0x9cc8dc, night(3760) > 0.3 ? 0.14 : 0.3);
            if (Yy % 108 > 4 && Yy % 108 < 11 && i > 9 && i < 27) img.px(X, Yy, NOR[Math.floor(Yy / 108) % NOR.length], 0.85);
          }
        for (let Yy = YT + 18; Yy < YB; Yy += 36) {
          glowPx(X0 + 6, Yy, 0xfff4d8, 0.8);
          glowPx(X1 - 7, Yy, 0xfff4d8, 0.8);
          pool(ax, Yy / S, 7, 0xffd8a0, 0.1 + night(3760) * 0.2);
        }
      },
    });
  }

  // ---- the old town between the streets, on both sides of the river (houses keep clear of the channel)
  k.oldTown(0, 150, 3668, 3872, 3668, { temples: [[84, 3680, 28, 40]] });
  k.oldTown(0, 150, 3888, 4052, 3888, { temples: [[8, 3900, 30, 44], [118, 3960, 30, 42]] });
  k.oldTown(0, 150, 4068, 4260, 4068, { temples: [[20, 4110, 30, 42, C.copper]] });
  k.grove(0, 150, 3667, 4261, 30, [CAMPHOR, WILLOW, CAMPHOR], 3667, 3, 4.5);
  // the Meganebashi tram stop, the east verge
  tramStop(k, 3940, 3966);
  for (let u = 3670; u < 4260; u += 20) if (!k.anyRes(174, Y(u + 18), 6, 18)) k.house(174, Y(u + 18), 6, 8, 9, 'block', { roofC: 0x5a6068, plainRoof: true });
}

export function paintSuwa(k) {
  const { img, Y, objects, glowPx, pool } = k;
  const SX0 = 78;
  const SX1 = 102;
  // the dance ground at the foot of the stairs (the Kunchi's stage): flags, its tiered seats on the slopes either side,
  // lantern posts round it, paper lanterns strung along the tiers
  k.flagFill(52, Y(4302), 76, 26, C.plaza, 1626, 18);
  k.reserve(52, Y(4302), 76, 26);
  for (const [x0, x1] of [[52, SX0 - 4], [SX1 + 4, 128]]) {
    img.fine(x0, Y(4302), x1 - x0, 12, (X, Yy) => {
      const q = Yy % 9;
      if (q === 0) return C.granite[4];
      if (q < 3) return C.granite[0];
      return (X >> 3) % 2 ? C.wood[3] : C.wood[2];
    });
    k.crowd(x0, Y(4302) + 1, x1 - x0, 11, 12);
  }
  for (const x of [54, 70, 110, 126]) k.stoneLantern(x, 4280);
  for (let x = 54; x < 126; x += 6) {
    if (Math.abs(x - 90) < 13) continue;
    const X = x * S;
    const Yy = Y(4304) * S;
    img.rectPx(X, Yy, 3, 5, 0xf8e8c0);
    img.px(X + 1, Yy + 2, 0xe83a2a);
    glowPx(X + 1, Yy + 1, 0xffd090, 0.85);
  }
  // the dance stage of the Kunchi in the middle of the ground: planks, a vermilion rail, four bamboo poles with the
  // festival's banners, strings of lanterns from pole to pole
  objects.push({
    y: Y(4279),
    shadow: () => k.shadowRect(76, Y(4296), 30, 16, 0.6),
    draw: () => {
      const X0 = 74 * S;
      const Y0 = Y(4296) * S;
      const WW = 32 * S;
      const HH = 15 * S;
      for (let j = 0; j < HH; j++)
        for (let i = 0; i < WW; i++) {
          const b = j >> 2;
          const XX = i + b * 11;
          let c = j % 4 === 3 ? C.wood[0] : XX % 30 === 0 ? C.wood[0] : rampColor(C.wood, 0.5 + hashPx(XX >> 3, b, 1630) * 0.45, X0 + i, Y0 + j);
          const e = Math.min(i, WW - 1 - i, j, HH - 1 - j);
          if (e < 2) c = e < 1 ? C.vermilion[3] : C.vermilion[1];
          img.px(X0 + i, Y0 + j, c);
        }
      for (let i = 0; i < WW; i++) for (let j = 0; j < 6; j++) img.px(X0 + i, Y0 + HH + j, j < 1 ? 0x141014 : i % 18 < 2 ? C.vermilion[1] : 0x2a1e1a);
      for (const [px, py] of [[X0, Y0], [X0 + WW - 1, Y0], [X0, Y0 + HH], [X0 + WW - 1, Y0 + HH]]) {
        for (let j = 0; j < 36; j++) {
          img.px(px, py - j, 0xc8b878);
          img.px(px + 1, py - j, 0x8a7a48);
        }
        for (let j = 3; j < 24; j++) for (let i = 2; i < 8; i++) img.px(px + i, py - 36 + j, (j >> 2) % 2 ? 0xf0ece0 : 0xc8302a);
      }
    },
  });
  k.reserve(74, Y(4296), 32, 18);
  for (const [x0, x1] of [[56, 72], [108, 124]]) {
    for (let x = x0; x < x1; x += 8) {
      // a stall: its striped awning, the counter, a lamp
      objects.push({
        y: Y(4278) + 3,
        shadow: () => k.shadowRect(x + 1, Y(4284), 7, 6, 0.62),
        draw: () => {
          const X = x * S;
          const Yy = Y(4284) * S;
          for (let j = 0; j < 12; j++) for (let i = 0; i < 21; i++) img.px(X + i, Yy + j, j > 10 ? 0x6a1e16 : (i >> 2) % 2 ? 0xdc442e : 0xf0e8d8);
          for (let j = 12; j < 18; j++) for (let i = 1; i < 20; i++) img.px(X + i, Yy + j, j === 12 ? 0x2a1a12 : (i >> 2) % 3 ? 0x6a4a30 : 0xffc880);
          glowPx(X + 10, Yy + 13, 0xffd890, 0.9);
        },
      });
    }
    k.reserve(x0, Y(4284), x1 - x0, 8);
  }
  k.crowd(56, Y(4280), 68, 5, 18);
  for (let X = 58 * S; X < 122 * S; X += 15) {
    const sag = Math.round(Math.sin(((X - 58 * S) / (64 * S)) * Math.PI) * 4);
    img.rectPx(X, Y(4298) * S + sag, 3, 5, 0xf8e8c0);
    img.px(X + 1, Y(4298) * S + sag + 2, 0xe83a2a);
    glowPx(X + 1, Y(4298) * S + sag + 1, 0xffd090, 0.85);
  }
  k.strollers(90, 4286, 30, 5, 5);
  // the long stairway in flights, landings between them, its balustrade, the hill banked up either side
  img.fine(SX0 - 3, Y(4548), SX1 - SX0 + 6, 246, (X, Yy, x, y) => {
    const u = 7168 - y;
    const flight = (u - 4302) % 62;
    const landing = flight > 47;
    const e = Math.min(X - (SX0 - 3) * S, (SX1 + 3) * S - 1 - X);
    if (e < 9) return e < 2 ? C.granite[1] : e > 6 ? C.granite[0] : (Yy % 18 < 2 ? C.granite[4] : C.granite[3]);
    if (landing) return k.flagPx(X, Yy, x, y, C.plaza, 1627, 15);
    const q = Yy % 6;
    const a = Math.abs(X - 90 * S) / (12 * S);
    if (q === 0) return C.granite[4];
    if (q >= 4) return q === 5 ? 0x2e2c28 : C.granite[0];
    const c = a < 0.5 ? C.granite[3] : C.granite[2];
    return hashPx(X, Yy, 1628) < 0.08 ? scaleColor(c, 0.9) : c;
  });
  k.reserve(SX0 - 4, Y(4548), SX1 - SX0 + 8, 248);
  // the banks: stone-faced terraces with clipped azalea on them, stepping up beside each flight
  for (let u = 4304; u < 4540; u += 62) {
    for (const [a, b] of [[SX0 - 13, SX0 - 4], [SX1 + 4, SX1 + 13]]) {
      k.hedge(a, b, u + 3, u + 44, u + a, 0xe86a9a, 0.62);
      k.stoneFace(a, b, Y(u + 3), 2.4, u + a, C.granite);
    }
    // the landing's side: a little shrine on the left, a stone tablet and a pine on the right
    const lu = u + 52;
    if (lu < 4545) {
      k.fill(SX0 - 16, Y(lu + 9), 12, 12, C.plaza, lu, 3);
      k.fill(SX1 + 4, Y(lu + 9), 12, 12, C.plaza, lu + 1, 3);
      k.reserve(SX0 - 16, Y(lu + 9), 12, 12);
      k.reserve(SX1 + 4, Y(lu + 9), 12, 12);
      k.house(SX0 - 15, Y(lu + 9), 9, 5, 4, 'jp', { ramp: C.copper, wall: 0x6a4a32, bay: 4, reserve: false });
      objects.push({
        y: Y(lu) + 1,
        draw: () => {
          const CX = (SX0 - 10) * S;
          const Yb = (Y(lu) + 2) * S;
          for (const s of [-8, 7]) for (let j = -14; j < 1; j++) for (let i = 0; i < 2; i++) img.px(CX + s + i, Yb + j, i ? C.vermilion[1] : C.vermilion[3]);
          for (let i = -11; i <= 11; i++) {
            img.px(CX + i, Yb - 16, 0x2a2026);
            img.px(CX + i, Yb - 15, C.vermilion[2]);
            if (Math.abs(i) < 8) img.px(CX + i, Yb - 10, C.vermilion[2]);
          }
        },
      });
      k.niwaki(SX1 + 11, lu + 2, 0.9, lu);
      objects.push({
        y: Y(lu - 2) + 1,
        draw: () => {
          const X = (SX1 + 6) * S;
          const Yb = Y(lu - 2) * S;
          for (let j = 0; j < 15; j++) for (let i = 0; i < 7; i++) img.px(X + i, Yb - j, j > 11 ? C.granite[3] : i < 1 ? C.granite[3] : i > 5 ? C.granite[0] : j % 3 === 0 && i > 1 && i < 5 ? C.granite[0] : C.granite[1]);
        },
      });
    }
  }
  // the festival's banners up the stairs, white and red, on their bamboo poles
  for (let u = 4306; u < 4540; u += 15) {
    if ((u - 4302) % 62 > 44) continue;
    for (const x of [SX0 - 2, SX1 + 1]) {
      objects.push({
        y: Y(u) + 1,
        draw: () => {
          const X = x * S + 1;
          const Yb = Y(u) * S;
          for (let j = 0; j < 30; j++) img.px(X, Yb - j, 0xc8b878);
          const c = (u >> 1) % 2 ? 0xc8302a : 0xf0ece0;
          for (let j = 2; j < 21; j++) for (let i = 1; i < 6; i++) img.px(X + i, Yb - 30 + j, j > 17 ? 0x2a4a8a : c);
        },
      });
    }
  }
  // three torii up the stairs (stone, bronze, stone), lanterns on the landings
  for (const [u, c] of [[4300, C.granite[3]], [4362, 0x6a5a3a], [4486, C.granite[3]]]) {
    const y = Y(u);
    objects.push({
      y: y + 1,
      shadow: () => k.shadowRect(SX0 - 2, y - 2, SX1 - SX0 + 8, 3, 0.55),
      draw: () => {
        const X0 = (SX0 - 2) * S;
        const X1 = SX1 * S;
        const Yb = y * S;
        for (const X of [X0, X1]) for (let j = -48; j < 3; j++) for (let i = 0; i < 6; i++) img.px(X + i, Yb + j, i < 2 ? scaleColor(c, 1.2) : i > 4 ? scaleColor(c, 0.66) : c);
        for (const X of [X0, X1]) for (let j = 0; j < 3; j++) for (let i = -2; i < 8; i++) img.px(X + i, Yb + 2 + j, j < 1 ? scaleColor(c, 1.2) : scaleColor(c, 0.7));
        const CX = Math.round((X0 + X1 + 6) / 2);
        for (let i = -50; i <= 50; i++) {
          const dx = CX + i - CX;
          for (let j = 0; j < 4; j++) if (X0 + i - 0 >= -999) img.px(CX + i, Yb - 39 + j, j < 1 ? scaleColor(c, 1.2) : j > 2 ? scaleColor(c, 0.66) : c);
          void dx;
        }
        const half = Math.round((X1 - X0) / 2) + 14;
        for (let i = -half; i <= half; i++) {
          const lift = Math.round((i * i) / (half * half) * 5);
          for (let j = 0; j < 8; j++) img.px(CX + i, Yb - 57 - lift + j, j < 2 ? scaleColor(c, 1.3) : j < 6 ? scaleColor(c, 0.85) : scaleColor(c, 0.6));
        }
        for (let j = 0; j < 9; j++) for (let i = -7; i <= 7; i++) img.px(CX + i, Yb - 49 + j, Math.abs(i) === 7 || j === 0 || j === 8 ? C.gold : hashPx(i >> 1, j >> 1, u) < 0.45 ? C.goldHi : 0x241c1c);
      },
    });
  }
  for (const u of [4356, 4418, 4480, 4542, 4310]) {
    k.stoneLantern(SX0 - 5, u);
    k.stoneLantern(SX1 + 4, u);
  }
  k.walkers([[86, 4304], [86, 4546]], 3, 4420, { sp: 2.6, gap: 80 });
  k.walkers([[94, 4546], [94, 4304]], 3, 4420, { sp: 2.6, gap: 90 });
  // the shrine compound: raked gravel court, chōzuya, komainu, the worship hall and main hall under copper roofs
  img.fine(40, Y(4640), 100, 92, (X, Yy, x, y) => {
    if (k.isRes(x, y)) return null;
    const c = k.gravelPx(X, Yy);
    return Yy % 7 === 0 ? scaleColor(c, 0.94) : c;
  });
  {
    const y = Y(4560);
    objects.push({
      y,
      shadow: () => k.shadowRect(52, y - 46, 80, 48, 0.5),
      draw: () => {
        // the main hall behind, the worship hall in front with its cusped gable, a covered way between
        k.roof(56, y - 48, 70, 18, C.copper, { gable: 'tri', gw: 18, ridgeC: C.gold, crest: true });
        for (let Yy = (y - 30) * S; Yy < (y - 24) * S; Yy++) for (let X = 60 * S; X < 122 * S; X++) img.px(X, Yy, X % 15 < 3 ? C.vermilion[1] : (Yy >> 1) % 2 ? 0xe8e0d0 : 0xd8d0c0);
        k.roof(50, y - 26, 82, 16, C.copper, { gable: 'kara', gw: 24, ridgeC: C.gold, crest: true });
        for (let j = 0; j < 30; j++)
          for (let X = 54 * S; X < 128 * S; X++) {
            let c = (X - 54 * S) % 18 < 3 ? C.vermilion[(X - 54 * S) % 18 === 0 ? 3 : 1] : j > 18 ? 0x2a1e1a : (j >> 1) % 2 ? 0x6a4a32 : 0x7a5a3e;
            if (j < 3) c = 0x141014;
            img.px(X, (y - 10) * S + j, c);
          }
        for (let i = -3; i < 74 * S + 3; i++) for (let j = 0; j < 4; j++) img.px(54 * S + i, (y - 1) * S + j, j < 1 ? C.granite[4] : C.granite[2]);
        // paper lanterns and white shoji along the front, the sacred rope with its tassels, the offering box
        for (let X = 62 * S; X < 122 * S; X += 24) {
          for (let j = 0; j < 12; j++) for (let i = 0; i < 9; i++) glowPx(X + i, (y - 9) * S + j, i % 3 === 0 || j % 3 === 0 ? 0xc8a868 : 0xffe8b0, 0.85);
        }
        const CX = 91 * S;
        for (let j = 0; j < 21; j++) for (let i = -15; i <= 15; i++) img.px(CX + i, (y - 7) * S + j, 0x1a1210);
        for (let i = -21; i <= 21; i++) {
          const sag = Math.round(Math.sin(((i + 21) / 42) * Math.PI) * 4);
          for (let j = 0; j < 4; j++) img.px(CX + i, (y - 10) * S + sag + j, (i + j) % 5 < 2 ? 0xa89468 : 0xe8dcb0);
          if (i % 10 === 0) for (let j = 4; j < 11; j++) img.px(CX + i, (y - 10) * S + sag + j, 0xf8f4ec);
        }
        for (let j = 0; j < 9; j++) for (let i = -12; i <= 12; i++) img.px(CX + i, (y - 3) * S + j, j < 2 ? 0x8a6a40 : i % 3 === 0 ? 0x2a1c12 : C.wood[1]);
        glowPx(CX, (y - 4) * S, 0xffc070, 0.8);
        pool(91, y, 24, C.lamp, 0.1 + night(4560) * 0.22);
      },
    });
    k.reserve(48, y - 50, 86, 52);
    // the gankake komainu either side of the approach (wishes tied on with paper), the chōzuya
    for (const x of [72, 108]) {
      objects.push({
        y: Y(4552) + 1,
        shadow: () => k.shadowRect(x + 1, Y(4554), 6, 3, 0.7),
        draw: () => {
          const X = x * S;
          const Yb = Y(4552) * S;
          for (let j = 0; j < 9; j++) for (let i = -1; i < 16; i++) img.px(X + i, Yb - j, j > 6 ? C.granite[4] : i > 13 ? C.granite[0] : C.granite[2]);
          for (let j = 0; j < 12; j++) for (let i = 3; i < 12; i++) img.px(X + i, Yb - 9 - j, i < 5 ? C.granite[4] : i > 10 ? C.granite[1] : C.granite[3]);
          for (let j = 0; j < 7; j++) for (let i = 2; i < 13; i++) img.px(X + i, Yb - 21 - j, j < 1 || i < 4 ? C.granite[4] : C.granite[3]);
          img.px(X + 5, Yb - 24, C.granite[0]);
          img.px(X + 10, Yb - 24, C.granite[0]);
          for (const q of [3, 8, 12]) for (let j = 0; j < 4; j++) img.px(X + q, Yb - 12 + j, 0xf8f4ec);
        },
      });
    }
    objects.push({
      y: Y(4552) + 1,
      shadow: () => k.shadowRect(118, Y(4566) + 2, 14, 14, 0.6),
      draw: () => {
        const X = 118 * S;
        const Yb = Y(4552) * S;
        for (let j = 0; j < 12; j++) for (let i = 0; i < 27; i++) img.px(X + i, Yb - j, j > 9 ? C.granite[0] : j < 2 ? C.granite[4] : j < 7 ? (i < 2 || i > 24 ? C.granite[3] : (i + j) % 7 === 0 ? 0x9ad8e8 : 0x2a6a7a) : C.granite[2]);
        for (const i of [1, 25]) for (let j = 12; j < 36; j++) img.px(X + i, Yb - j, C.vermilion[1]);
        for (let i = 3; i < 25; i += 4) img.rectPx(X + i, Yb - 12, 2, 2, C.oldWood[3]);
        k.roof(116, Y(4566), 13, 6, C.copper, {});
      },
    });
    k.way([[90, 4550], [90, 4560]], 4, { paint: (X, Yy, d, x, yy) => k.flagPx(X, Yy, x, yy, C.plaza, 1629, 15), kerb: C.granite[3] });
    // the kagura hall for the sacred dances, on the west of the court, open on all sides
    k.house(40, Y(4596), 11, 9, 4, 'jp', { ramp: C.copper, wall: 0x2a1e1a, bay: 3, reserve: true });
    // the racks of ema, of omikuji tied in white, the shrine's office and its lit window; a bronze horse
    objects.push({
      y: Y(4556) + 1,
      shadow: () => k.shadowRect(42, Y(4560), 12, 3, 0.7),
      draw: () => {
        const X0 = 40 * S;
        const Yb = Y(4556) * S;
        for (const i of [0, 33]) for (let j = -21; j < 1; j++) img.px(X0 + i, Yb + j, C.wood[1]);
        for (let j = 0; j < 3; j++) {
          for (let i = 0; i < 34; i++) img.px(X0 + i, Yb - 19 + j * 6, C.wood[0]);
          for (let i = 2; i < 32; i += 3) img.rectPx(X0 + i, Yb - 18 + j * 6, 2, 3, hashPx(i, j, 1631) < 0.25 ? C.hinoki?.[2] ?? 0xba8c56 : 0xd4a86e);
        }
        for (let i = -2; i < 36; i++) {
          img.px(X0 + i, Yb - 23, C.copper[3]);
          img.px(X0 + i, Yb - 22, C.copper[1]);
        }
        const X1 = 54 * S;
        for (const i of [0, 24]) for (let j = -15; j < 1; j++) img.px(X1 + i, Yb + j, C.wood[0]);
        for (const j of [-14, -10, -6]) for (let i = 0; i < 25; i++) img.px(X1 + i, Yb + j, i % 2 ? 0xf8f6f0 : 0xdcd8cc);
      },
    });
    k.reserve(40, Y(4562), 24, 7);
    k.house(126, Y(4598), 13, 7, 5, 'jp', { ramp: C.copper, wall: 0xe0d8c8, bay: 4, reserve: true });
    objects.push({
      y: Y(4570) + 1,
      shadow: () => k.shadowRect(132, Y(4574), 7, 3, 0.68),
      draw: () => {
        const X = 132 * S;
        const Yb = Y(4570) * S;
        for (let j = 0; j < 6; j++) for (let i = -2; i < 20; i++) img.px(X + i, Yb - j, j > 4 ? C.granite[4] : C.granite[2]);
        for (let j = 0; j < 7; j++) for (let i = 2; i < 15; i++) img.px(X + i, Yb - 12 - j, j < 1 || i < 4 ? 0x5a8a7a : 0x3a6a5e);
        for (const i of [3, 12]) for (let j = 0; j < 6; j++) img.rectPx(X + i, Yb - 12 + j, 2, 1, 0x2e5a4e);
        for (let j = 0; j < 9; j++) for (let i = 14; i < 18; i++) img.px(X + i, Yb - 17 - j + 3, 0x4a7a6a);
      },
    });
    k.reserve(131, Y(4574), 9, 5);
    // the sacred camphor by the hall, its rope and white papers; a row of little sub-shrines along the back of the court
    k.tree(46, Y(4612), 8, CAMPHOR, 1633);
    for (let x = 58; x < 124; x += 11) k.house(x, Y(4634), 9, 5, 4, 'jp', { ramp: x % 2 ? C.copper : C.kawara, wall: 0x6a4a32, bay: 4, reserve: true });
    for (let x = 56; x < 126; x += 8) k.stoneLantern(x, 4612, true);
    k.strollers(90, 4552, 16, 3, 4);
    k.crowd(84, Y(4556), 14, 6, 6);
  }
  // the sacred grove round it all; the lane round the back to the street at 4652
  k.forest(0, 150, 4304, 4648, [CAMPHOR, CEDAR, CAMPHOR], 1629, 5, 8, (x, u) => !(x > SX0 - 18 && x < SX1 + 18 && u < 4548) && !(u > 4540 && u < 4640 && x > 38 && x < 142));
  k.road([[140, 4600], [146, 4640], [146, 4652]], 1.5, { side: 0, surface: C.paving });
  // the Suwa-jinja tram stop, the verge
  tramStop(k, 4290, 4318);
  for (let u = 4280; u < 4645; u += 22) if (!k.anyRes(174, Y(u + 8), 6, 8)) k.tree(177, Y(u + 9), 3.5, CAMPHOR, u);
}
