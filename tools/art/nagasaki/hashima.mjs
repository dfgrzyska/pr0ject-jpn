// Hashima (Gunkanjima, "Battleship Island"): the high black seawall all round the coal mine's reclaimed ground; the
// crowded concrete apartment blocks on the west, stairways and light wells between them, gutted, salt-stained, their
// roofs fallen in and greened over; Block 30 (1916, Japan's oldest) in the south; the school in the north; the central
// rock with the Stairway to Hell and the Shintō shrine on top; the colliery ruins on the east, the brick office, the
// conveyor's footings; the Dolphin Pier and the tour boat. Abandoned in 1974: nothing here moves but kites and the sea.
import { rng, fbm } from '../../lib/raster.mjs';
import { C, S, hashPx, rampColor, scaleColor, mix } from './canvas.mjs';
import { HASHIMA, inPoly } from './geo.mjs';

const CONC = [0x5e5c52, 0x74705f, 0x8a8672, 0x9e9a84, 0xb2ae98];
const WEED = [0x3a5230, 0x4c683a, 0x628044];

export function paintHashima(k) {
  const { img, kit, Y, objects } = k;
  const R = rng(1974);

  // the reclaimed ground, cracked, rubble-strewn, grown through with weeds
  img.fine(18, Y(862), 140, 540, (X, Yy, x, y) => {
    if (k.fineWater[Yy * k.FW + X] || k.shoreD[Yy * k.FW + X] <= 5) return null;
    const u = 7168 - y;
    if (!inPoly(HASHIMA, x, u)) return null;
    const n = fbm(x, y, { seed: 801, scale: 9, octaves: 3 });
    let c = rampColor(CONC, 0.15 + n * 0.6, X, Yy);
    const g = hashPx(X, Yy, 802);
    if (g < 0.1) c = scaleColor(c, 0.82);
    else if (g > 0.96) c = 0xbcb8a4;
    if (Math.abs(fbm(x, y, { seed: 803, scale: 6 }) - 0.5) < 0.008) c = 0x38382e;
    if (fbm(x, y, { seed: 804, scale: 3, octaves: 3 }) > 0.72) c = rampColor(WEED, hashPx(X >> 1, Yy >> 1, 805), X, Yy);
    return c;
  });

  /** A gutted concrete apartment block: the roof fallen in, floors of empty window holes, rust and salt down its face. */
  const block = (x, footU, w, rh, floors, opt = {}) => {
    const FLOOR = opt.floorH ?? 3;
    const fh = floors * FLOOR;
    const y = Y(footU) - rh - fh;
    if (k.anyRes(x, y, w, rh + fh)) return;
    k.reserve(x - 1, y - 1, w + 2, rh + fh + 2);
    const sd = (x * 31 + footU * 7) & 1023;
    const bits = rng(sd + 11);
    const wall = opt.wall ?? mix(0x8e8a78, 0x74705f, bits());
    const roofC = opt.roof ?? mix(0x7a7868, 0x5e5e52, bits());
    const holes = [];
    const nH = Math.floor((w * rh) / (opt.brick ? 300 : 150));
    for (let i = 0; i < nH; i++) holes.push([x + 2 + bits() * (w - 6), y + 2 + bits() * (rh - 5), 2 + bits() * 4, 1.5 + bits() * 3]);
    const stair = bits() < 0.7 ? Math.floor(2 + bits() * (w - 6)) : -1;
    const gap = bits() < 0.4 ? [x + 2 + bits() * (w - 8), bits() * floors * FLOOR * 0.7, 3 + bits() * 4, 3 + bits() * 6] : null;
    objects.push({
      y: Y(footU),
      shadow: () => k.shadowRect(x + 3 + floors * 0.3, y + 3, w, rh + fh, 0.5),
      draw: () => {
        const X0 = x * S;
        const X1 = (x + w) * S;
        const YR = y * S;
        const YF = (y + rh) * S;
        const YB = Y(footU) * S;
        // the face: floors of empty holes, slabs catching the light, rust and salt streaks
        for (let Yy = YF; Yy < YB; Yy++) {
          const j = Yy - YF;
          const row = j % (FLOOR * S);
          for (let X = X0; X < X1; X++) {
            const i = X - X0;
            const streak = hashPx(i >> 1, 3, sd) < 0.2 ? 0.8 : hashPx(i >> 2, 5, sd) > 0.86 ? 1.1 : 1;
            let c = scaleColor(wall, streak * (1 - (j / (YB - YF)) * 0.12));
            if (hashPx(i >> 1, Yy >> 3, sd + 1) < 0.08) c = 0x6a4a34; // rust
            if (row === 0) c = scaleColor(wall, 1.28); // the slab's edge
            else if (row === 1) c = 0x2a2a26; // its shade
            else if (opt.brick) {
              if (j % 3 === 0) c = scaleColor(c, 0.84);
              else if ((i + (j >> 1)) % 6 === 0) c = scaleColor(c, 0.9);
            }
            const q = i % (opt.bay ?? 9);
            const inWin = row >= 3 && row <= FLOOR * S - 2 && q >= 2 && q <= (opt.bay ?? 9) - 3;
            if (inWin && i > 3 && i < X1 - X0 - 3) {
              c = hashPx(Math.floor(i / 9), Math.floor(j / 9), sd + 2) < 0.12 ? 0x3a3a34 : 0x0e0e10; // hollow, the odd frame left
              if (row === 3 && hashPx(i, j, sd + 3) < 0.5) c = 0x5a5448;
            }
            if (stair >= 0 && X >= stair * S + X0 && X < (stair + 3) * S + X0) c = row % 4 < 2 ? 0x8a8672 : 0x14140f; // the open stair
            if (gap && X >= gap[0] * S && X < (gap[0] + gap[2]) * S && j >= gap[1] * S && j < (gap[1] + gap[3]) * S) {
              c = (i + j) % 7 === 0 ? 0x7a5a3a : 0x161612; // a wall gone, rods showing
            }
            if (X >= X1 - 3) c = scaleColor(c, 0.7);
            if (j >= YB - YF - 3 && hashPx(i, 3, sd) < 0.5) c = rampColor(WEED, 0.5, X, Yy);
            img.px(X, Yy, c);
          }
        }
        // the roof: stained, its parapet broken, slabs fallen in, weeds and bushes on the rubble
        for (let Yy = YR; Yy < YF; Yy++)
          for (let X = X0; X < X1; X++) {
            const e = Math.min(X - X0, Yy - YR);
            const e2 = Math.min(X1 - 1 - X, YF - 1 - Yy);
            let c = rampColor([scaleColor(roofC, 0.8), roofC, scaleColor(roofC, 1.14)], 0.2 + fbm(X / 3, Yy / 3, { seed: sd, scale: 5, octaves: 2 }) * 0.7, X, Yy);
            if (hashPx(X, Yy, sd + 4) < 0.06) c = scaleColor(c, 0.8);
            if ((X - X0) % 24 === 0 || (Yy - YR) % 24 === 0) c = scaleColor(c, 0.84);
            if (fbm(X / 3, Yy / 3, { seed: sd + 5, scale: 3, octaves: 2 }) > 0.66) c = rampColor(WEED, hashPx(X >> 1, Yy >> 1, 806), X, Yy);
            if (e < 2 && hashPx(Math.floor(X / 12), Math.floor(Yy / 12), sd + 6) > 0.18) c = scaleColor(roofC, 1.3);
            if (e2 < 2 && hashPx(Math.floor(X / 12), Math.floor(Yy / 12), sd + 7) > 0.18) c = scaleColor(roofC, 0.6);
            img.px(X, Yy, c);
          }
        for (const [hx, hy, hw, hh] of holes) {
          // a hole in the roof: the dark inside, broken beams across it, its lit far edge
          const HX = Math.round(hx * S);
          const HY = Math.round(hy * S);
          const HW = Math.round(hw * S);
          const HH = Math.round(hh * S);
          for (let j = 0; j < HH; j++)
            for (let i = 0; i < HW; i++) {
              const q = Math.hypot((i - HW / 2) / (HW / 2), (j - HH / 2) / (HH / 2)) + (hashPx(HX + i >> 1, HY + j >> 1, 807) - 0.5) * 0.5;
              if (q > 1) continue;
              let c = j < 2 ? 0x0a0a08 : 0x1c1c16;
              if (i % 7 === 0 && j % 2) c = 0x6a5a44;
              if (j > HH * 0.6 && hashPx(i, j, 808) < 0.4) c = 0x5a5648;
              img.px(HX + i, HY + j, c);
            }
        }
        if (opt.tank) {
          const TX = (x + 3) * S;
          const TY = (y + 2) * S;
          img.rectPx(TX, TY, 15, 9, 0x4a524e);
          img.rectPx(TX, TY, 15, 2, 0x8a928c);
          for (let i = 0; i < 15; i += 3) img.rectPx(TX + i, TY + 9, 1, 3, 0x2a2e2c);
          for (let i = 0; i < 15; i++) if (hashPx(i, 1, sd) < 0.3) img.px(TX + i, TY + 4, 0x7a4a2a);
        }
      },
    });
  };

  // ---- the west: the apartment blocks in their rows, stairs and light wells between
  // Block 65, the great U of ten storeys round its yard in the north-west, children's playground on its roof
  block(30, 778, 20, 16, 10, { wall: 0x8a8672, roof: 0x6e6c5c, bay: 9, tank: true });
  block(52, 790, 28, 13, 9, { wall: 0x868270, roof: 0x72705e, bay: 9 });
  block(52, 752, 12, 10, 6, { wall: 0x7e7a68 });
  block(68, 752, 13, 10, 6, { wall: 0x7a7664 });
  const rows = [];
  for (let u = 366; u < 760; u += 38) rows.push(u);
  rows.forEach((u, i) => {
    block(29 + (i % 2), u, 21 + (i % 3), 11 + (i % 3), 5 + (i % 3), { tank: i % 3 === 0 });
    block(54 + (i % 2), u + 4, 12 + (i % 3), 10 + (i % 3), 5 + (i % 2), { tank: i % 4 === 1 });
    block(69 + (i % 2), u + 2, 12 + (i % 2), 11 + (i % 2), 6 + (i % 2));
    k.reserve(26, Y(u + 3), 60, 2);
  });
  // the narrow north-south alleys and their stairs
  for (const ax of [52, 81]) {
    img.fine(ax, Y(830), 3, 462, (X, Yy) => {
      const q = Yy % 6;
      return q < 2 ? 0xa09c88 : q < 3 ? 0x2a2a24 : hashPx(X, Yy, 809) < 0.3 ? 0x5a5a4a : 0x4a4a3e;
    });
  }
  // Block 30, Japan's first reinforced-concrete apartments (1916): in the south, around its dark courtyard
  block(62, 352, 30, 14, 9, { wall: 0x8a8270, roof: 0x6e6a5a, bay: 12 });
  // the school in the north, seven storeys, its corridors along the front, the schoolyard before it
  block(112, 740, 30, 13, 7, { wall: 0xa8a48e, roof: 0x7e7c6a, bay: 8, tank: true });
  k.fill(114, Y(800), 18, 24, [0x6e6a58, 0x7e7a66, 0x8e8a74], 810, 5);
  for (let x = 116; x < 132; x += 5) k.tree(x, Y(802), 2.6, [0x2a4228, 0x3a5a30, 0x4c6e38, 0x628044], x + 811);
  // the gymnasium and the cinema's shell
  block(114, 708, 26, 10, 3, { wall: 0x8a8e80, bay: 14 });

  // ---- the central rock, the old island: a spine of stone and green terraces with the Stairway to Hell up it
  const rock = [[84, 428], [104, 452], [113, 532], [108, 650], [116, 708], [101, 772], [85, 738], [80, 600]];
  k.poly(rock.map(([x, u]) => [x, Y(u)]), (X, Yy) => {
    const x = X / S;
    const y = Yy / S;
    const n = fbm(x, y, { seed: 812, scale: 6, octaves: 3 });
    if (n > 0.52) return rampColor(WEED, (n - 0.52) * 3 + hashPx(X >> 1, Yy >> 1, 813) * 0.3, X, Yy);
    return rampColor(C.rock, 0.2 + n + (hashPx(X >> 1, Yy, 814) - 0.5) * 0.25, X, Yy);
  });
  for (let u = 440; u < 762; u += 12) {
    const x0 = 86 + Math.sin(u * 0.043) * 4;
    const x1 = 108 + Math.sin(u * 0.03) * 4;
    k.stoneFace(x0, x1, Y(u), 2, u, CONC);
  }
  for (let u = 435; u < 770; u += 8) k.tree(92 + hashPx(u, 1, 815) * 14, Y(u), 2.6 + hashPx(u, 2, 815) * 2.4, [0x2a4228, 0x3a5a30, 0x4c6e38, 0x628044], u + 816);
  // the stairway, the tiny shrine on the summit
  k.stairs(95, Y(620), 6, 60, CONC);
  k.reserve(95, Y(620), 6, 60);
  objects.push({
    y: Y(622),
    shadow: () => k.shadowRect(93, Y(632), 12, 8, 0.6),
    draw: () => {
      k.roof(92, Y(634), 14, 7, C.kawara, { gable: 'tri', gw: 5 });
      img.rectPx(93 * S, (Y(634) + 7) * S, 12 * S, 9, 0x8a7a64);
      img.rectPx(97 * S, (Y(634) + 7) * S + 2, 12, 7, 0x1a1412);
      for (const s of [94, 103]) for (let j = 0; j < 15; j++) img.px(s * S, Y(622) * S - j, C.vermilion[1]);
    },
  });

  // ---- the east: the colliery. The brick office, the shafts' concrete footings, the conveyor's piers, the sea-wall gate
  block(114, 520, 28, 12, 3, { wall: 0x9a6248, roof: 0x5a5046, brick: true, bay: 10 });
  const footings = (x, u, w, h) => {
    const y = Y(u + h);
    objects.push({
      y: Y(u),
      shadow: () => k.shadowRect(x + 3, y + 3, w, h, 0.55),
      draw: () => {
        img.fine(x, y, w, h, (X, Yy) => {
          const i = X - x * S;
          const j = Yy - y * S;
          const e = Math.min(i, j, w * S - 1 - i, h * S - 1 - j);
          if (e < 2) return e === 0 ? 0xb4b09a : CONC[3];
          if (e < 5) return 0x2a2a24;
          if (i % 12 < 3) return j % 9 < 2 ? CONC[3] : 0x4a4a3e;
          return hashPx(X >> 2, Yy >> 2, 817) < 0.1 ? rampColor(WEED, 0.3, X, Yy) : 0x14140f;
        });
      },
    });
    k.reserve(x, y, w, h);
  };
  footings(118, 446, 18, 11);
  footings(118, 472, 16, 12);
  footings(116, 656, 18, 14);
  footings(118, 690, 14, 10);
  // the conveyor's row of tall piers, marching out to where the coal ships lay
  for (let u = 560; u < 650; u += 14) {
    objects.push({
      y: Y(u),
      shadow: () => k.shadowRect(124, Y(u) - 1, 8, 3, 0.6),
      draw: () => {
        const X = 122 * S;
        const Yb = Y(u) * S;
        for (let j = 0; j < 36; j++)
          for (let i = 0; i < 9; i++) img.px(X + i, Yb - j, i < 2 ? CONC[4] : i > 6 ? CONC[0] : hashPx(i, j, u) < 0.14 ? 0x6a4a34 : CONC[2]);
        for (let i = -3; i < 12; i++) {
          img.px(X + i, Yb - 37, CONC[4]);
          img.px(X + i, Yb - 36, CONC[1]);
        }
      },
    });
    k.reserve(121, Y(u) - 2, 11, 3);
  }
  // the roofless power house and the workshops' long shells
  block(116, 384, 22, 8, 3, { wall: 0x7e7a66, bay: 12 });
  block(124, 412, 18, 8, 3, { wall: 0x8a8672, bay: 12 });
  block(118, 548, 24, 9, 2, { wall: 0x8a6a50, roof: 0x5a5046, brick: true, bay: 12 });
  // the No. 2 shaft's rusted headframe
  objects.push({
    y: Y(644),
    shadow: () => k.shadowRect(132, Y(644) - 3, 12, 4, 0.6),
    draw: () => {
      const X = 136 * S;
      const Yb = Y(644) * S;
      const RU = [0x4a3224, 0x6a4a30, 0x8a6240];
      for (let j = 0; j < 66; j++) {
        const hw = 15 - j * 0.14;
        img.px(X - hw, Yb - j, RU[2]);
        img.px(X + hw, Yb - j, RU[0]);
        if (j % 9 === 0) {
          const h2 = 15 - (j + 9) * 0.14;
          img.linePx(Math.round(X - hw), Yb - j, Math.round(X + h2), Yb - j - 9, RU[1]);
          img.linePx(Math.round(X + hw), Yb - j, Math.round(X - h2), Yb - j - 9, RU[0]);
          img.linePx(Math.round(X - hw), Yb - j, Math.round(X + hw), Yb - j, RU[1]);
        }
      }
      img.discPx(X, Yb - 68, 6, RU[0]);
      img.discPx(X, Yb - 68, 3.4, 0x14140f);
    },
  });
  k.reserve(131, Y(644) - 3, 11, 5);
  // the brick chimney stump
  objects.push({
    y: Y(424),
    shadow: () => k.shadowRect(116, Y(424) - 1, 8, 3, 0.6),
    draw: () => {
      const X = 114 * S;
      const Yb = Y(424) * S;
      for (let j = 0; j < 54; j++) {
        const hw = 7 - j * 0.04;
        for (let i = -hw; i <= hw; i++) img.px(X + i, Yb - j, j % 3 === 0 ? 0x5a3a2c : i < -hw * 0.3 ? 0xa06e54 : i < hw * 0.5 ? 0x8a5a44 : 0x5a3a2c);
      }
      for (let i = -5; i <= 5; i++) img.px(X + i, Yb - 54, 0x1a1412);
    },
  });
  k.reserve(112, Y(424) - 3, 6, 4);
  // rubble heaps and rusting gear in the yard
  for (let i = 0; i < 40; i++) {
    const x = R.int(112, 146);
    const u = R.int(380, 760);
    const y = Y(u);
    if (k.isRes(x, y) || k.wet(x, y)) continue;
    const n = 3 + R.int(0, 5);
    for (let q = 0; q < n; q++) k.rockPx(x * S + R.int(-8, 8), y * S + R.int(-4, 4), 1.6 + R() * 2, CONC, i * 7 + q);
    if (i % 4 === 0) img.rectPx(x * S, y * S - 4, 16, 2, 0x7a4a2a);
  }

  // ---- the seawall: tall black-stained concrete with salt tide-lines all the way round
  for (let Yy = Y(862) * S; Yy < Y(325) * S; Yy++)
    for (let X = 16 * S; X < 158 * S; X++) {
      const i = Yy * k.FW + X;
      if (k.fineWater[i]) continue;
      const d = k.shoreD[i];
      if (d > 6) continue;
      const south = k.wetPx(X, Yy + 9);
      if (south) {
        // the wall's face above the water, tide-stained, its lift lines
        const j = Yy % 6;
        let c = j === 0 ? 0xa8a490 : 0x5a584c;
        if (hashPx(X >> 1, 7, 818) < 0.3) c = 0x35352e;
        if (hashPx(X >> 3, Yy >> 2, 819) < 0.14) c = 0x7a6a4a;
        img.px(X, Yy, c);
      } else img.px(X, Yy, d < 2 ? 0x4a4a40 : d < 4 ? 0xb8b4a0 : 0x8e8a78);
    }
  k.reserve(18, Y(862), 140, 540);

  // the Dolphin Pier on the east side, the only way ashore: a concrete arm on piles, its covered gangway, the tour boat
  objects.push({
    y: Y(506) + 3,
    shadow: () => k.shadowRect(148, Y(516), 30, 10, 0.6),
    draw: () => {
      for (let u = 506; u < 514; u++)
        for (let x = 146; x < 176; x++) {
          const yy = Y(u);
          img.rect(x, yy, 1, 1, (x + u) % 5 === 0 ? CONC[1] : CONC[3]);
        }
      for (let X = 146 * S; X < 176 * S; X += 15) for (let j = 0; j < 9; j++) img.px(X, Y(506) * S + j, CONC[0]);
      for (let X = 146 * S; X < 176 * S; X++) {
        img.px(X, Y(514) * S, 0xd8d4c0);
        if (X % 12 < 2) for (let j = 1; j < 6; j++) img.px(X, Y(514) * S + j, 0x8a8678);
      }
      for (let j = 0; j < 24; j++) for (let i = 0; i < 18; i++) img.px(168 * S + i, Y(514) * S - 6 + j, i < 2 || i > 15 ? 0x3a3e46 : j % 6 < 2 ? 0xe8e4d4 : 0xb8b4a4);
    },
  });
  // waves lapping the seawall: broken white lines at its foot, moving a little
  const surf = [0, 1, 2].map((f) => k.sprite(140, 8, 400, (r) => {
    for (let X = 0; X < 420; X += 5) for (let i = 0; i < 4; i++) r.px(X + i, 12 + Math.round(Math.sin((X + f * 20) * 0.04) * 6), 0xdcf0f4, 0.6);
    for (let X = 2; X < 420; X += 9) r.px(X, 16 + Math.round(Math.sin((X + f * 34) * 0.03) * 6), 0xdcf0f4, 0.35);
  }));
  kit.loop(20, 334, surf, { fps: 2, fx: 1 });
  for (const [x, u, h] of [[12, 760, 330], [153, 720, 280]]) {
    const side = [0, 1, 2].map((f) => k.sprite(10, h, u, (r) => {
      for (let Yy = 0; Yy < h * S; Yy += 6) for (let j = 0; j < 4; j++) r.px(12 + Math.round(Math.sin((Yy + f * 24) * 0.05) * 7), Yy + j, 0xdcf0f4, 0.5);
    }));
    kit.loop(x, u, side, { fps: 2, fx: 1 });
  }
  // kites wheeling over the ruin
  const kite = [0, 1].map((f) => k.sprite(11, 5, 600, (r) => {
    const CXk = 16;
    for (let i = 1; i < 15; i++) {
      const dy = f ? Math.round(i * 0.32) : Math.round(i * -0.2 + (i > 8 ? (i - 8) * 0.5 : 0));
      for (let j = 0; j < (i > 11 ? 1 : 2); j++) {
        r.px(CXk - i, 7 + dy + j, i > 10 ? 0x3a2a20 : 0x5a4030);
        r.px(CXk + i, 7 + dy + j, i > 10 ? 0x3a2a20 : 0x5a4030);
      }
    }
    for (let j = 4; j < 11; j++) for (let i = -1; i <= 1; i++) r.px(CXk + i, j, i < 0 ? 0x6a5040 : 0x3a2a20);
  }));
  kit.orbit(70, 560, 40, kite, { ry: 30, w: 0.28, n: 2, d: 2.2, a: 0.85 });
  kit.orbit(120, 700, 30, kite, { ry: 20, w: -0.32, n: 1, d: 2.2, a: 0.85 });
}
