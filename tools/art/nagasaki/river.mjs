// The Nakashima river and Suwa Shrine.
//   The river comes down from the hills off the top-left edge, swings into the middle of the old town and runs
//   south to Shinchi's west side and into Dejima's channel. Stone walls, a walkway at the water on both sides
//   by the bridges, willows and lamps. Every street crosses it on a bridge of its own: a concrete road bridge
//   at the mouth, a stone arch for Shinchi's west gate, the 3660 road bridge, Meganebashi (1634) with its two
//   arches doubled into spectacles by their reflection, the stepping stones below it, the heart-shaped stone in
//   the wall, and a single-arch bridge upstream.
//   Suwa Shrine: the dance ground at the foot of the long stone stairway, three torii up the stairs, lanterns,
//   the gankake komainu, the copper-roofed halls in their camphor grove; the Suwa-jinja tram stop on R1.
import { rng, fbm } from '../../lib/raster.mjs';
import { rampColor } from '../nature.mjs';
import { C, night, scaleColor } from './canvas.mjs';
import { W, riverX, riverHW, channelHW, RIVER, EMBANK, STREETS, R1_HW } from './geo.mjs';

const WILLOW = [0x2a4a2a, 0x3a623a, 0x507a48, 0x6a9258];
const CAMPHOR = [0x1a3422, 0x284a2c, 0x3a6236, 0x527c44];
const SAKURA = [0x4a3040, 0x6a4256, 0x8e5a70, 0xb07a8e];
const CEDAR = Object.assign([0x12261e, 0x1c382a, 0x2a4c38, 0x3e664c], { kind: 'cedar' });
const ROAD_BRIDGES = [2990, 3660, 4060];

export function paintNakashima(k) {
  const { img, Y, kit, objects, glow, pool } = k;
  const R = rng(1634);

  // the channel: keep everything else out of it; walkways at the water's edge by the bridges
  for (let u = RIVER[0]; u < RIVER[1]; u++) {
    const cx = riverX(u);
    const ch = channelHW(u);
    const hw = riverHW(u);
    const y = Y(u);
    k.reserve(Math.floor(cx - ch - 2), y, Math.ceil(ch * 2 + 4), 1);
    for (let x = Math.floor(cx - ch - 1); x <= Math.ceil(cx + ch); x++) {
      if (x < 0 || x >= W || k.wet(x, y)) continue;
      const d = Math.abs(x + 0.5 - cx);
      if (d > ch + 0.5) {
        img.set(x, y, C.granite[3]); // the top of the embankment wall
      } else if (d >= hw) {
        let c = rampColor(C.stoneSet, 0.25 + fbm(x, y, { seed: 1630, scale: 2 }) * 0.5, x, y);
        if (d > ch - 0.5) c = 0x2a2a2c; // the wall's foot in shadow
        else if (d < hw + 1) c = C.granite[2]; // the walkway's edge at the water
        img.set(x, y, c);
      }
    }
    // the water: darker under the banks, glints in the middle
    for (const side of [-1, 1]) {
      const ex = Math.round(cx + side * (hw - 1));
      if (k.wet(ex, y)) img.set(ex, y, 0x0a1a20, 0.5);
    }
  }
  // steps down to the walkways
  for (const u of [3800, 3930, 3990, 4110]) {
    const cx = riverX(u);
    for (const side of [-1, 1]) {
      const x0 = Math.round(cx + side * channelHW(u));
      for (let j = 0; j < 8; j++) for (let i = 0; i < 4; i++) img.set(x0 - side * i, Y(u + j), j % 2 ? C.granite[1] : C.granite[3]);
    }
  }
  // willows and lamps along the banks
  for (let u = EMBANK + 30; u < 4240; u += 24) {
    const cx = riverX(u);
    const ch = channelHW(u);
    for (const side of [-1, 1]) {
      const x = cx + side * (ch + 5);
      if (x < 2 || x > 150 || k.isRes(Math.round(x), Y(u)) && !(u % 48 === 6)) continue;
      if (STREETS.some((s) => Math.abs(s.u - u) < s.hw + 6)) continue;
      if ((u / 24 + (side > 0 ? 1 : 0)) % 2) k.tree(x, Y(u), 4.5, WILLOW, u * 3 + side);
      else k.streetLamp(Math.round(x), u, 0xffe8b8, 6);
    }
  }
  // carp and ducks, glints drifting on the current
  const duck = [0, 1].map((f) => k.sprite(4, 3, 3900, (r) => { r.rect(0, 1, 3, 2, 0x7a6a50); r.set(3, 0, 0x2a5a3a); r.set(3, 1, 0xe8a040); r.set(f ? 0 : 1, 2, 0xd8f0f0, 0.6); }));
  const carp = [0, 1].map((f) => k.sprite(5, 3, 3900, (r) => { r.rect(1, 1, 3, 1, f ? 0xe86a2a : 0xf0e8e0); r.set(0, 1 - f, 0xe86a2a); r.set(4, 1, 0x3a3a3a); }, false));
  kit.wander(90, 3960, 9, 60, duck, { n: 3, sp: 3, turn: 'flip', fps: 2, idle: 0.5 });
  kit.wander(90, 3830, 8, 30, carp, { n: 4, sp: 5, turn: 'flip', fps: 3, idle: 0.2, d: 0.02 });
  kit.wander(18, 3200, 5, 120, duck, { n: 2, sp: 3, turn: 'flip', fps: 2, idle: 0.5 });
  const glint = [0, 1, 2, 3].map((f) => k.sprite(30, 60, 3900, (r) => {
    for (let q = 0; q < 14; q++) r.rect((q * 13 + f * 3) % 28, (q * 17 + f * 9) % 58, 2 + (q % 3), 1, 0x9ac0c4, 0.15 + (q % 3) * 0.08);
  }, false));
  for (const u of [3140, 3420, 3830, 4010]) kit.loop(Math.round(riverX(u)) - 15, u + 30, glint, { fps: 2, fx: 1, d: 0.02 });

  // ---- bridges
  const deckFace = (x0, x1, u, hw, top, face, opt = {}) => {
    // the deck across the channel at u (±hw), its south face over the water, parapets on both sides
    const yN = Y(u + hw + 1);
    const yS = Y(u - hw - 1);
    objects.push({
      y: yS + 1,
      shadow: () => {
        for (let y = yS + 1; y < yS + 6; y++) for (let x = x0; x <= x1; x++) if (k.wet(x, y)) img.set(x, y, 0x061014, 0.4 * (1 - (y - yS) / 6));
      },
      draw: () => {
        for (let y = yN; y <= yS; y++)
          for (let x = x0; x <= x1; x++) {
            const edge = y === yN || y === yS;
            img.set(x, y, edge ? opt.rail ?? C.granite[4] : y === yN + 1 || y === yS - 1 ? opt.rail2 ?? C.granite[2] : top(x, y));
          }
        for (let y = yS + 1; y <= yS + face; y++) for (let x = x0; x <= x1; x++) img.set(x, y, opt.face ? opt.face(x, y - yS) : C.concrete[1 + ((x + y) % 2)]);
        opt.extra?.(yN, yS);
      },
    });
  };
  const asphaltTop = (hw2) => (x, y) => rampColor(C.asphalt, fbm(x, y, { seed: 31, scale: 4 }), x, y);
  for (const u of ROAD_BRIDGES) {
    const s = STREETS.find((st) => st.u === u);
    const cx = riverX(u);
    const ch = channelHW(u);
    const x0 = Math.floor(cx - ch - 2);
    const x1 = Math.ceil(cx + ch + 1);
    deckFace(x0, x1, u, s.hw + 2, asphaltTop(s.hw), 3, {
      rail: 0xd8d8d0,
      extra: (yN, yS) => {
        for (let x = x0 + 1; x < x1; x++) if (Math.floor(x / 3) % 2 === 0) img.set(x, Y(u), 0xdad6c8);
        for (const lx of [x0 + 2, x1 - 2]) {
          img.rect(lx, yN - 5, 1, 5, 0x3a3e46);
          glow(lx, yN - 6, 0xfff0c8, 0.9);
          pool(lx, yN - 3, 6, C.lamp, 0.08 + night(u) * 0.2);
        }
      },
    });
  }
  // Shinchi's west gate bridge: a low stone arch for walkers
  {
    const u = 3330;
    const cx = riverX(u);
    const ch = channelHW(u);
    const x0 = Math.floor(cx - ch - 2);
    const x1 = Math.ceil(cx + ch + 1);
    deckFace(x0, x1, u, 7, (x, y) => rampColor(C.stoneSet, 0.4 + fbm(x, y, { seed: 37, scale: 2 }) * 0.5, x, y), 5, {
      face: (x, j) => {
        const d = Math.abs(x + 0.5 - cx) / (ch - 1);
        const open = j > 1 && d < Math.sqrt(Math.max(0, 1 - ((j - 1) / 5) ** 2)) * 0.9;
        return open ? 0x0e1a1e : (x + j) % 4 === 0 ? C.granite[0] : C.granite[2];
      },
    });
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
    deckFace(x0, x1, u, 5, (x, y) => {
      // the humped deck of fitted granite, the middle catching the light
      const hump = 1 - Math.abs(x + 0.5 - cx) / (ch + 3);
      let c = rampColor(C.granite, 0.3 + hump * 0.4 + fbm(x, y, { seed: 39, scale: 2 }) * 0.25, x, y);
      if ((x + Math.floor(y / 2)) % 5 === 0) c = scaleColor(c, 0.85);
      return c;
    }, face, {
      rail: 0xdedad0,
      rail2: 0xa8a49a,
      face: (x, j) => {
        for (const ax of arches) {
          const dx = Math.abs(x + 0.5 - ax);
          const top = face - Math.sqrt(Math.max(0, ar * ar - dx * dx)) * (face - 1) / ar;
          if (dx < ar && j >= top) return 0x081216; // the dark opening under the arch
          if (dx < ar + 2 && j >= top - 1.6 && j < top) return (Math.round(Math.atan2(j - face, x - ax) * 4) % 2) ? C.granite[3] : C.granite[1]; // voussoirs
        }
        return (x + j * 2) % 5 === 0 ? C.granite[0] : rampColor(C.granite, 0.35 + fbm(x, j, { seed: 41, scale: 2 }) * 0.4, x, j);
      },
    });
    // the reflection: each arch mirrored in the still water below, closing the circle
    const yS = Y(u - 6);
    for (const ax of arches)
      for (let a = 0; a <= Math.PI; a += 0.02) {
        const x = Math.round(ax + Math.cos(a) * (ar + 0.5));
        const y = Math.round(yS + face + Math.sin(a) * (face - 1) * 1.05);
        if (!k.wet(x, y)) continue;
        img.set(x, y, 0x8aa8aa, 0.55);
        img.set(x, y + 1, 0x5a7a7c, 0.35);
      }
    for (let y = yS + face + 1; y < yS + face + 10; y++) for (let x = x0 + 2; x < x1 - 2; x++) if (k.wet(x, y) && (x + y) % 7 === 0) img.set(x, y, 0x6a8a8c, 0.3);
    // the stepping stones a little downstream, the heart-shaped stone in the east wall
    for (let x = Math.round(cx - riverHW(3846)) + 1; x < cx + riverHW(3846) - 2; x += 5) {
      const y = Y(3846);
      img.set(x + 1, y + 2, 0x061014, 0.5);
      img.set(x + 2, y + 2, 0x061014, 0.5);
      img.rect(x, y, 3, 2, C.granite[3]);
      img.set(x, y, C.granite[4]);
      img.set(x - 1, y + 1, 0xc8e0e0, 0.4);
    }
    const hx = Math.round(cx + ch - 1);
    const hy = Y(3862);
    for (const [dx, dy] of [[0, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [2, 1], [3, 1], [0, 2], [1, 2], [2, 2], [1, 3]]) img.set(hx - 1 + dx, hy + dy, 0xe8a8a8);
    k.crowd(hx - 4, hy - 2, 4, 6, 3);
    k.strollers(cx, 3880, 16, 2, 5);
    k.walkers([[cx - ch + 2, 3800], [cx - ch + 2, 3990]], 3, 3880, { sp: 3, gap: 50 });
    k.walkers([[cx + ch - 2, 3995], [cx + ch - 2, 3805]], 3, 3880, { sp: 3, gap: 60 });
  }
  // the single-arch stone bridge upstream, between Meganebashi and S3, for walkers on the walkways
  {
    const u = 3970;
    const cx = riverX(u);
    const hw = riverHW(u);
    const x0 = Math.floor(cx - hw - 1);
    const x1 = Math.ceil(cx + hw);
    deckFace(x0, x1, u, 3, (x, y) => rampColor(C.granite, 0.45 + fbm(x, y, { seed: 43, scale: 2 }) * 0.3, x, y), 7, {
      face: (x, j) => {
        const dx = Math.abs(x + 0.5 - cx);
        const top = 7 - Math.sqrt(Math.max(0, (hw - 2) ** 2 - dx * dx)) * 6 / (hw - 2);
        return dx < hw - 2 && j >= top ? 0x081216 : (x + j) % 4 === 0 ? C.granite[0] : C.granite[2];
      },
    });
  }

  // ---- the old town between the streets, on both sides of the river (houses keep clear of the channel)
  const bands = [[3667, 3873], [3887, 4053], [4067, 4261]];
  for (const [u0, u1] of bands) {
    k.block(0, 150, u0 + 1, u1 - 1, () => (R() < 0.75 ? 'jp' : 'block'), {
      rowH: 21,
      w: [9, 16],
      house: () => ({
        noren: R() < 0.35 ? R.pick([0x2a4a8a, 0x8a2a2a, 0xe8d8b0, 0x3a6a4a]) : undefined,
        roofC: R.pick(C.roofs),
        wall: R.pick([0xd8ccb4, 0xc8bca4, 0xb8ac94, 0xe4dccc, 0xa89a88]),
      }),
    });
  }
  // a temple among the houses: a big tiled hall and its gate, a cemetery of upright stones behind
  for (let u = 4150; u < 4250; u += 5) for (let x = 6; x < 50; x += 3) if (!k.isRes(x, Y(u)) && (x + u) % 2) { img.rect(x, Y(u), 1, 2, C.granite[3]); img.set(x, Y(u) + 2, 0x101418, 0.4); }
  k.grove(0, 150, 3667, 4261, 26, [CAMPHOR, SAKURA], 3667, 3, 4.5);
  // the Meganebashi tram stop
  for (let u = 3940; u < 3966; u++) {
    img.rect(162 + 6, Y(u), 2, 1, u % 4 ? C.concrete[3] : C.concrete[2]);
    img.rect(162 - 7, Y(u), 2, 1, u % 4 ? C.concrete[3] : C.concrete[2]);
  }
  for (let u = 3670; u < 4260; u += 20) if (!k.anyRes(174, Y(u + 18), 6, 18)) k.house(174, Y(u + 18), 6, 8, 9, 'block', { roofC: 0x5a6068 });
}

export function paintSuwa(k) {
  const { img, Y, kit, objects, glow, pool } = k;
  const R = rng(1625);
  const SX0 = 78;
  const SX1 = 102;
  // the dance ground at the foot of the stairs (Kunchi's stage), paved, with lantern posts round it
  for (let u = 4276; u < 4302; u++) for (let x = 52; x < 128; x++) img.set(x, Y(u), rampColor(C.paving, 0.4 + fbm(x, u, { seed: 1626, scale: 3 }) * 0.4, x, Y(u)));
  k.reserve(52, Y(4302), 76, 26);
  for (const x of [54, 70, 110, 126]) k.stoneLantern(x, 4280);
  // the long stairway in flights, landings between them, the hill banked up either side
  for (let u = 4302; u < 4548; u++) {
    const flight = (u - 4302) % 62;
    const landing = flight > 54;
    const y = Y(u);
    for (let x = SX0 - 3; x < SX1 + 3; x++) {
      let c;
      if (x < SX0 || x >= SX1) c = x === SX0 - 3 || x === SX1 + 2 ? C.granite[1] : C.granite[3];
      else if (landing) c = rampColor(C.paving, 0.5 + fbm(x, u, { seed: 1627, scale: 2 }) * 0.3, x, y);
      else c = u % 2 ? C.granite[3] : C.granite[1];
      img.set(x, y, c);
    }
  }
  k.reserve(SX0 - 4, Y(4548), SX1 - SX0 + 8, 248);
  // three torii up the stairs (stone, bronze, stone), lanterns on the landings
  for (const [u, c] of [[4300, C.granite[3]], [4362, 0x6a5a3a], [4486, C.granite[3]]]) {
    const y = Y(u);
    objects.push({
      y: y + 1,
      shadow: () => k.shadowRect(SX0 - 2, y - 2, SX1 - SX0 + 8, 3, 0.55),
      draw: () => {
        img.rect(SX0 - 2, y - 16, 2, 17, c);
        img.rect(SX1, y - 16, 2, 17, c);
        img.rect(SX0 - 5, y - 18, SX1 - SX0 + 10, 2, scaleColor(c, 0.8));
        img.rect(SX0 - 6, y - 19, SX1 - SX0 + 12, 1, scaleColor(c, 1.15));
        img.rect(SX0 - 3, y - 14, SX1 - SX0 + 6, 1, c);
        img.rect((SX0 + SX1) / 2 - 2, y - 17, 4, 3, 0x2a2a2a);
      },
    });
  }
  for (const u of [4360, 4422, 4484]) {
    k.stoneLantern(SX0 - 5, u);
    k.stoneLantern(SX1 + 4, u);
  }
  // the shrine compound: gravel court, chōzuya, komainu, the worship hall and main hall under copper roofs
  for (let u = 4548; u < 4640; u++) for (let x = 40; x < 140; x++) if (!k.isRes(x, Y(u))) img.set(x, Y(u), rampColor(C.paving, 0.55 + fbm(x, u, { seed: 1628, scale: 2 }) * 0.35, x, Y(u)));
  {
    const y = Y(4560);
    objects.push({
      y,
      shadow: () => k.shadowRect(52, y - 46, 80, 48, 0.5),
      draw: () => {
        // main hall behind, worship hall in front with a cusped gable
        k.roof(56, y - 48, 70, 18, C.copper, { gable: 'tri', gw: 18, ridgeC: C.gold });
        for (let yy = y - 30; yy < y - 24; yy++) for (let x = 60; x < 122; x++) img.set(x, yy, x % 5 === 0 ? C.oldWood[1] : 0xe8e0d0);
        k.roof(50, y - 26, 82, 16, C.copper, { gable: 'kara', gw: 24, ridgeC: C.gold });
        for (let yy = y - 10; yy < y; yy++)
          for (let x = 54; x < 128; x++) img.set(x, yy, x % 6 === 0 ? C.vermilion[1] : yy > y - 4 ? 0x2a1e1a : 0x6a4a32);
        img.rect(54, y - 1, 74, 1, C.granite[3]);
        for (let x = 64; x < 120; x += 8) {
          img.rect(x, y - 9, 3, 4, 0xf4f0e0);
          glow(x + 1, y - 8, 0xffe0a0, 0.6);
        }
        img.rect(86, y - 7, 10, 7, 0x1a1210);
        k.glow(91, y - 4, 0xffc070, 0.7);
      },
    });
    k.reserve(48, y - 50, 86, 52);
    // gankake komainu either side of the approach, the chōzuya basin
    for (const x of [72, 108]) {
      img.rect(x, Y(4552), 5, 3, C.granite[2]);
      img.rect(x + 1, Y(4555), 3, 4, C.granite[3]);
      img.set(x + 1, Y(4556), C.granite[4]);
    }
    img.rect(118, Y(4554), 9, 5, C.granite[2]);
    img.rect(119, Y(4553), 7, 3, 0x2a6a7a);
    k.roof(116, Y(4566), 13, 6, C.copper, {});
    k.strollers(90, 4552, 16, 3, 4);
  }
  // the sacred grove round it all; the lane round the back to the street at 4652
  k.forest(0, 150, 4304, 4648, [CAMPHOR, CEDAR, CAMPHOR], 1629, 5, 8, (x, u) => !(x > SX0 - 8 && x < SX1 + 8 && u < 4548) && !(u > 4540 && x > 38 && x < 142));
  k.road([[140, 4600], [146, 4640], [146, 4652]], 1.5, { side: 0, surface: C.paving });
  // the Suwa-jinja tram stop
  for (let u = 4290; u < 4318; u++) {
    img.rect(162 + 6, Y(u), 2, 1, u % 4 ? C.concrete[3] : C.concrete[2]);
    img.rect(162 - 7, Y(u), 2, 1, u % 4 ? C.concrete[3] : C.concrete[2]);
  }
  for (let u = 4280; u < 4645; u += 22) if (!k.anyRes(174, Y(u + 18), 6, 18)) k.tree(177, Y(u + 9), 3.5, CAMPHOR, u);
}
