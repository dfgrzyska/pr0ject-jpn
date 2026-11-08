// Urakami and Mount Inasa, in fine pixels.
//   The hypocentre: concentric rings of dark stone round the black cenotaph, the surviving wall of Urakami Cathedral,
//   paper-crane garlands. The Peace Park (a quiet stretch: guns held): steps up from the street, the Fountain of Peace
//   with its jets spread like wings, the long axis with the sculptures given by other countries, the black vault of
//   names, the Peace Statue on its pedestal.
//   The crossing: quays, fish market and sheds, the inner harbour with its squid boats under their lamps and the
//   bridge, the north shore road, Inasa-machi, Fuchi Shrine and the ropeway's lower station by the roundabout.
//   Inasa: a terraced hamlet, Inasayama Park with its deer, azaleas and open-air stage, the driveway's switchbacks with
//   their lamps and lookouts, the ropeway on its towers over a cleared strip, the inclined slope car, a mountain shrine,
//   the forest; the summit car park, the ropeway's top station, the tunnel of lights, the round observatory with its roof
//   deck, the transmitter masts with their red lights, and the long terrace where people stand at the rail looking at
//   the view. Above the ridge the strip is left clear for the night panorama.
import { rng, fbm } from '../../lib/raster.mjs';
import { C, S, night, scaleColor, rampColor, hashPx, CARS } from './canvas.mjs';
import { W, RIDGE, uraSouth, uraNorth, B_X, FUCHI, DRIVE, PARK, ROPE, OBS } from './geo.mjs';
import { peaceStatue, pedestal } from './statue.mjs';
import { sculpt } from './paint.mjs';

const CAMPHOR = [0x1a3422, 0x284a2c, 0x3a6236, 0x527c44];
const ZELKOVA = [0x22381e, 0x304c28, 0x426434, 0x5a7c42];
const CEDAR = Object.assign([0x10221c, 0x1a3428, 0x264634, 0x386048], { kind: 'cedar' });
const OAK = [0x14281c, 0x1e3a24, 0x2c4e2e, 0x40663a];
const CRANES = [0xff6a6a, 0xffa848, 0xffe068, 0x8ee878, 0x6ac0ff, 0xb898ff, 0xff94cc, 0xffffff];

/** Parked cars seen from above, facing up or down. */
function parkedCar(k, X0, Y0, col) {
  const { img } = k;
  k.objects.push({
    y: (Y0 + 18) / S,
    shadow: () => {
      for (let j = 0; j < 18; j++) for (let i = 0; i < 12; i++) img.tintPx(X0 + i + 2, Y0 + j + 2, 0.72);
    },
    draw: () => {
      for (let j = 0; j < 18; j++)
        for (let i = 0; i < 12; i++) {
          const e = Math.min(i, 11 - i);
          if ((j < 1 || j > 16) && e < 1) continue;
          let c = e < 1 ? (i === 0 ? scaleColor(col, 1.16) : scaleColor(col, 0.68)) : col;
          if ((j > 3 && j < 7 && e >= 1) || (j > 12 && j < 15 && e >= 1)) c = 0x2a3440;
          img.px(X0 + i, Y0 + j, c);
        }
    },
  });
}

export function paintUrakami(k) {
  const { img, Y, kit, objects, glowPx, pool } = k;
  const R = rng(1945);

  // ---- the hypocentre park: quiet, in dark stone; the rings as they are laid, a low kerb, nothing added but flowers
  {
    const cx = 80;
    const cu = 4715;
    const cy = Y(cu);
    img.fine(cx - 48, cy - 48, 96, 96, (X, Yy, x, y) => {
      const d = Math.hypot(x - cx, y - cy);
      if (d > 46 || k.isRes(x, y)) return null;
      if (d > 44.5) return C.granite[d > 45.5 ? 1 : 3];
      if (d > 43) return k.lawnPx(X, Yy, 0.35 + fbm(x, y, { seed: 4701, scale: 3 }) * 0.4, C.grass);
      const ring = Math.floor(d / 4);
      const seg = Math.floor(((Math.atan2(y - cy, x - cx) + Math.PI) / 6.2832) * (10 + ring * 7));
      const dd = d % 4;
      if (dd < 0.2) return 0x1e2024;
      const t = hashPx(ring, seg, 4702);
      let c = ring % 2 ? scaleColor(0x3a3c40, 0.9 + t * 0.2) : scaleColor(0x6a6a68, 0.9 + t * 0.2);
      if (((Math.atan2(y - cy, x - cx) + Math.PI) / 6.2832) * (10 + ring * 7) % 1 < 0.05) c = 0x1e2024;
      if (d < 8) c = (X >> 2) % 2 === (Yy >> 2) % 2 ? 0x2a2c30 : 0x303236;
      if (Math.abs(d - 18) < 0.34 || Math.abs(d - 34) < 0.34) c = 0xa8a8a0;
      return c;
    });
    k.reserve(cx - 46, cy - 46, 92, 92);
    // the black cenotaph at the centre, flowers and paper-crane garlands at its foot
    objects.push({
      y: cy + 3,
      shadow: () => k.shadowRect(cx + 1, cy - 2, 6, 4, 0.5),
      draw: () => {
        const CX = cx * S + 1;
        const Yb = cy * S;
        for (let j = -3; j < 9; j++) for (let i = -13; i <= 13; i++) img.px(CX + i, Yb + j, j < -1 ? 0x8a8c90 : j > 6 ? 0x2a2c30 : i > 11 ? 0x34363a : 0x4a4c50);
        for (let j = 0; j < 57; j++)
          for (let i = -6; i <= 6; i++) {
            const taper = j < 3 ? 6 - (3 - j) : 6;
            if (Math.abs(i) > taper) continue;
            img.px(CX + i, Yb - 3 - (56 - j), i < -4 ? 0x5a5e66 : i > 4 ? 0x0a0a0c : (j % 12 === 0 ? 0x1e2024 : 0x14161a));
          }
        for (let q = 0; q < 26; q++) {
          const a = (q / 26) * Math.PI;
          const X = CX + Math.cos(a) * 26 * (q % 2 ? 1 : 0.84);
          const Yy = Yb + 13 + Math.sin(a) * 8;
          img.rectPx(X, Yy, 2, 3, CRANES[q % CRANES.length]);
        }
        for (const s of [-1, 1]) for (let j = 0; j < 4; j++) for (let i = 0; i < 5; i++) img.px(CX + s * 17 + i, Yb + 5 + j, j > 2 ? 0x3a4a3a : (i + j) % 2 ? 0xf8f4ec : 0xe8e0a8);
        pool(cx, cy, 10, 0xfff0d0, 0.12 + night(cu) * 0.15);
      },
    });
    // the surviving wall of Urakami Cathedral: brick and stone, an arched window, two saints in their niches
    objects.push({
      y: Y(4724),
      shadow: () => k.shadowRect(118, Y(4724) - 16, 18, 18, 0.5),
      draw: () => {
        const X0 = 114 * S;
        const Yb = Y(4724) * S;
        for (let j = 0; j < 54; j++)
          for (let i = 0; i < 54; i++) {
            const row = j >> 2;
            const XX = i + row * 5;
            const stone = j % 12 < 4 && (j >> 2) % 3 === 0;
            let c = stone ? (XX % 9 === 0 ? 0x5a4a40 : 0xb0a490) : j % 4 === 3 || XX % 7 === 0 ? 0x4a2e24 : hashPx(XX >> 2, row, 4703) < 0.3 ? 0x8a5a44 : 0xa06e54;
            if (i < 2) c = scaleColor(c, 1.14);
            if (i > 51) c = scaleColor(c, 0.7);
            img.px(X0 + i, Yb - 54 + j, c);
          }
        // the broken top
        for (let i = 0; i < 54; i++) {
          const h = Math.round(hashPx(i >> 1, 3, 4704) * 7);
          for (let j = 0; j < h; j++) img.px(X0 + i, Yb - 55 - j, j === h - 1 ? 0xc89878 : 0x8a5a44);
        }
        // the window: a pointed opening with its stone edge, dark within
        const WX = 123 * S;
        for (let j = 0; j < 30; j++) {
          const hw = j < 9 ? Math.sqrt(Math.max(0, 90 - (9 - j) ** 2)) : 9.4;
          for (let i = -hw - 2; i <= hw + 2; i++) img.px(WX + i, Yb - 45 + j, Math.abs(i) > hw ? 0xc8bca4 : 0x120e12);
        }
        // the saints in their niches, weather-worn
        for (const nx of [117, 129]) {
          const NX = nx * S;
          for (let j = 0; j < 21; j++) for (let i = -4; i <= 4; i++) img.px(NX + i, Yb - 39 + j, 0x2a2224);
          for (let j = 0; j < 15; j++) for (let i = -2; i <= 2; i++) img.px(NX + i, Yb - 34 + j, i < 0 ? 0xd8d0c0 : 0xa8a090);
          img.discPx(NX, Yb - 36, 2.2, 0xc8c0b0);
        }
        pool(123, Y(4724) - 6, 12, 0xfff0d0, 0.06 + night(4724) * 0.1);
      },
    });
    k.reserve(113, Y(4724) - 20, 20, 22);
    k.grove(0, 152, 4660, 4770, 34, [ZELKOVA, CAMPHOR, ZELKOVA], 4660, 4, 6);
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) k.streetLamp(Math.round(cx + Math.cos(a) * 44), Math.round(cu + Math.sin(a) * 44), 0xfff4d8);
    for (const [x, u] of [[33, 4700], [33, 4730], [127, 4700]]) k.bench(x, Y(u), 5);
    k.strollers(cx, cu, 30, 30, 6, { cols: [0x2a2a34, 0x3a3a4a, 0xe8e8f0, 0x5a5a6a] });
  }

  // ---- the Peace Park
  {
    const AX = 90;
    // steps up from the street, then the flagged axis to the statue
    k.stairs(AX - 22, Y(4798), 44, 12);
    img.fine(46, Y(5004), 88, 206, (X, Yy, x, y) => {
      const e = Math.min(x - 46, 134 - x, y - Y(5004), Y(4798) - y);
      if (e < 0.67) return e < 0.34 ? C.granite[4] : C.granite[1];
      const inner = Math.abs(x - AX) < 30;
      const flag = 24;
      if (X % flag === 0 || Yy % flag === 0) return scaleColor(C.paving[0], 0.8);
      const t = hashPx(Math.floor(X / flag), Math.floor(Yy / flag), 4801);
      let c = rampColor(inner ? C.plaza : C.paving, 0.25 + t * 0.45 + (fbm(x, y, { seed: 4802, scale: 7 }) - 0.5) * 0.25, X, Yy);
      const g = hashPx(X, Yy, 4803);
      if (g < 0.05) c = scaleColor(c, 0.92);
      else if (g > 0.97) c = scaleColor(c, 1.05);
      return c;
    });
    k.reserve(46, Y(5004), 88, 220);
    // the Fountain of Peace: an oval basin, its pale rim, jets spreading like a dove's wings
    const fy = Y(4818);
    k.shadowEllipse(AX + 2, fy + 2, 31, 13, 0.7);
    img.fine(AX - 32, fy - 14, 64, 28, (X, Yy, x, y) => {
      const d = Math.hypot((x - AX) / 31, (y - fy) / 13);
      if (d >= 1) return null;
      if (d > 0.94) return Math.floor(Math.atan2(y - fy, x - AX) * 16) % 2 ? C.granite[4] : C.granite[3];
      if (d > 0.88) return C.granite[1];
      const c = rampColor([0x12485a, 0x1e5a6a, 0x2a7080, 0x3a8a9a, 0x6aa8b8], 0.3 + (1 - d) * 0.5 + (fbm(x, y, { seed: 4804, scale: 4 }) - 0.5) * 0.5, X, Yy);
      const ripple = Math.abs((d * 14) % 2 - 1) < 0.1;
      return ripple ? scaleColor(c, 1.22) : c;
    });
    const wings = [0, 1, 2].map((f) =>
      k.sprite(62, 30, 4818, (r) => {
        for (const side of [-1, 1])
          for (let q = 0; q < 14; q++) {
            const len = (8 + q * 1.6 + f) * S;
            const ang = -Math.PI / 2 + side * (0.2 + q * 0.09);
            const x0 = 93 + side * (2 + q) * S;
            for (let t = 0; t < len; t++) {
              const X = x0 + Math.cos(ang) * t * 1.15;
              const Yy = 78 + Math.sin(ang) * t * (1 - t / (len * 2.6));
              r.px(Math.round(X), Math.round(Yy), t > len - 8 ? 0xffffff : 0xb8e4ec, 0.45 + (t / len) * 0.4);
              if (t > len - 10 && (t + q + f) % 3 === 0) r.px(Math.round(X) + ((t + f) % 5) - 2, Math.round(Yy) + 1, 0xffffff, 0.6);
            }
          }
        for (let X = 18; X < 168; X += 3) r.px(X + f, 81 + ((X + f) % 7), 0xe8f8ff, 0.5);
      }, false),
    );
    kit.loop(AX - 31, 4836, wings, { fps: 4 });
    for (let x = AX - 26; x < AX + 26; x += 6) pool(x, fy, 6, 0x8ad0ff, 0.06 + night(4818) * 0.2);
    // the sculptures given by other countries along the sides, each different, on their plinths
    const FORMS = [
      // Czechoslovakia's mother and child; the Soviet mother; Portugal's globe; Bulgaria's woman and doves...
      [{ ell: [0, -11], rx: 3.2, ry: 5, z: 0 }, { ell: [0, -18], rx: 2, ry: 2.2, z: 1 }, { ell: [2.4, -13], rx: 1.8, ry: 2, z: 3 }],
      [{ cap: [0, -2, 0, -14], r: 2.2, z: 0 }, { ell: [0, -17], rx: 1.8, ry: 2, z: 1 }, { cap: [-1, -13, -6, -18], r: 0.9, z: 1 }, { cap: [1, -13, 6, -18], r: 0.9, z: 1 }],
      [{ ell: [0, -9], rx: 6.5, ry: 6.5, z: 0 }, { cap: [-8, -9, 8, -9], r: 0.5, z: 7 }],
      [{ cap: [-3, -2, -1.5, -15], r: 1.8, z: 0 }, { cap: [3, -2, 1.5, -15], r: 1.8, z: 0 }, { ell: [0, -18], rx: 3, ry: 2.2, z: 1 }],
      [{ ell: [0, -8], rx: 4, ry: 5, z: 0 }, { cap: [-3, -11, -8, -8], r: 1, z: 2 }, { cap: [3, -11, 8, -14], r: 1, z: 2 }, { ell: [0, -15], rx: 1.8, ry: 2, z: 2 }],
      [{ cap: [0, 0, 0, -20], r: 1.6, z: 0 }, { ell: [0, -21], rx: 4.5, ry: 1.6, z: 1 }, { ell: [-3, -9], rx: 2, ry: 1, z: 2 }, { ell: [3, -14], rx: 2, ry: 1, z: 2 }],
    ];
    const RAMPS3 = [[0x1e3a3e, 0x2e5a5a, 0x4a7e78, 0x6aa098, 0x98c8bc], [0x5a5a56, 0x8a8a86, 0xb0b0a8, 0xd0d0c8, 0xe8e8e0], [0x3a2e24, 0x5a4a3a, 0x7a6450, 0x9a8268, 0xbaa488]];
    const plinth = (x, u, kind) => {
      const y = Y(u);
      objects.push({
        y: y + 1,
        shadow: () => k.shadowRect(x + 1, y - 10, 8, 10, 0.55),
        draw: () => {
          const X = x * S;
          const Yb = y * S;
          for (let j = 0; j < 15; j++) for (let i = -10; i <= 10; i++) img.px(X + i, Yb - 12 + j, j < 1 ? C.granite[4] : j > 12 ? C.granite[0] : i > 8 ? C.granite[0] : (i + j * 3) % 11 === 0 ? C.granite[1] : C.granite[3]);
          for (let j = 0; j < 3; j++) for (let i = -5; i <= 5; i++) img.px(X + i, Yb - 7 + j, 0x2a3a36);
          const form = FORMS[kind % FORMS.length].map((p) => (p.cap ? { ...p, cap: p.cap.map((v) => v * 1.5), r: p.r * 1.5, z: p.z } : { ...p, ell: p.ell.map((v) => v * 1.5), rx: p.rx * 1.5, ry: p.ry * 1.5, z: p.z }));
          sculpt({ set: (a, b, c) => img.px(a, b, c) }, X, Yb - 12, form, RAMPS3[kind % 3]);
          pool(x, y - 8, 6, 0xd8f0ff, 0.08 + night(u) * 0.12);
        },
      });
    };
    let n = 0;
    for (let u = 4856; u < 4990; u += 34) {
      plinth(56, u, n++);
      plinth(124, u + 17, n++);
    }
    // the tree rows and flower beds either side, lamps along the axis, benches
    for (let u = 4800; u < 5000; u += 18) {
      k.tree(40, Y(u), 5, ZELKOVA, u);
      k.tree(140, Y(u + 9), 5, ZELKOVA, u + 1);
    }
    for (const x of [48, 128]) {
      img.fine(x, Y(4996), 4, 150, (X, Yy) => {
        const e = Math.min(X - x * S, (x + 4) * S - 1 - X);
        if (e < 1) return C.granite[3];
        const g = hashPx(X >> 1, Yy >> 1, 4805);
        if (g < 0.18) return 0x2e5032;
        const band = Math.floor(Yy / 12) % 4;
        const c = [0xe8e0e8, 0xf4b0c0, 0xd85a7a, 0xf8e070][band];
        return g > 0.7 ? scaleColor(c, 0.82) : c;
      });
    }
    for (let u = 4850; u < 5000; u += 30) {
      k.streetLamp(66, u, 0xfff4d8);
      k.streetLamp(114, u, 0xfff4d8);
      k.bench(70, Y(u + 12), 5);
      k.bench(105, Y(u + 12), 5);
    }
    // the black vault of names, flowers and paper cranes laid before it
    const vy = Y(5000);
    objects.push({
      y: vy + 1,
      shadow: () => k.shadowRect(AX - 5, vy - 4, 14, 6, 0.5),
      draw: () => {
        const CX = AX * S;
        const Yb = vy * S;
        for (let j = 0; j < 15; j++) for (let i = -21; i <= 21; i++) img.px(CX + i, Yb - 12 + j, j < 1 ? 0x6a6e76 : i < -19 ? 0x3a3e46 : j % 3 === 2 ? 0x1e2024 : 0x16181c);
        for (let i = -21; i <= 21; i++) for (let j = 0; j < 3; j++) img.px(CX + i, Yb - 15 + j, j < 1 ? 0x8a8e96 : 0x4a4e56);
        for (let q = 0; q < 54; q++) img.rectPx(CX - 34 + (q % 34) * 2, Yb + 5 + (q >> 3), 2, 2, q % 3 ? CRANES[q % CRANES.length] : 0xf4f0e8);
        pool(AX, vy, 9, 0xfff4e0, 0.14 + night(5000) * 0.16);
      },
    });
    // the statue on its pedestal, floodlit from below
    const seatY = Y(5028);
    k.reserve(AX - 40, seatY - 64, 80, 94);
    objects.push({
      y: Y(5002),
      shadow: () => {
        k.shadowRect(AX - 34, seatY + 4, 76, 24, 0.7);
        k.shadowEllipse(AX + 10, seatY - 14, 22, 12, 0.72);
      },
      draw: () => {
        pedestal(img, AX, seatY);
        peaceStatue(img, AX, seatY);
        pool(AX - 20, seatY + 20, 14, 0xd8f0ff, 0.14 + night(5028) * 0.18);
        pool(AX + 20, seatY + 20, 14, 0xd8f0ff, 0.14 + night(5028) * 0.18);
        pool(AX, seatY - 22, 22, 0xc8f0e8, 0.06 + night(5028) * 0.12);
        for (let i = -5; i <= 5; i++) glowPx((AX - 14) * S + 1, (seatY - 61) * S + i, 0xe8fff8, 0.3);
      },
    });
    // a crescent of trees behind it, the wings of the park full of trees
    for (let a = 0.15; a < Math.PI - 0.1; a += 0.22) k.tree(AX + Math.cos(a) * 52, Y(5040 + Math.sin(a) * 52), 6, CAMPHOR, Math.round(a * 100));
    k.grove(0, 152, 4790, 5100, 60, [ZELKOVA, CAMPHOR, ZELKOVA], 4790, 4, 6);
    k.crowd(AX - 20, Y(4996), 40, 8, 12, [0x2a2a34, 0x3a3a4a, 0xe8e8f0, 0x2a3a6a, 0x5a5a6a]);
    k.strollers(AX, 4900, 30, 70, 8, { cols: [0x2a2a34, 0x3a3a4a, 0xe8e8f0, 0x2a3a6a, 0xd8d0c0] });
  }
  // the east verge along R1 north of Suwa
  for (let u = 4655; u < 5105; u += 22) if (!k.anyRes(174, Y(u + 8), 6, 8)) k.tree(177, Y(u + 9), 3.5, CAMPHOR, u);

  // ---- the crossing: quays and sheds, the fish market, the inner harbour, the bridge, the north shore
  img.fine(0, Y(5240), W, 120, (X, Yy, x, y) => {
    const u = 7168 - y;
    if (u <= 5121 || u >= uraSouth(x) || k.isRes(x, y)) return null;
    if (k.fineWater[Yy * k.FW + X] || k.shoreD[Yy * k.FW + X] <= 5) return null;
    const flag = 30;
    if (X % flag === 0 || Yy % flag === 0) return 0x4e4c48;
    return rampColor(C.quay, 0.3 + hashPx(Math.floor(X / flag), Math.floor(Yy / flag), 5120) * 0.3 + (fbm(x, y, { seed: 5121, scale: 7 }) - 0.5) * 0.4, X, Yy);
  });
  // warehouses, cold stores, the long fish market with its open front, its roof vents and boxes, ice trucks
  for (const [x, w, h] of [[4, 30, 24], [40, 22, 20], [134, 14, 18]]) {
    const foot = Math.round(Math.min(uraSouth(x), uraSouth(x + w)) - 8);
    if (foot - h > 5122) k.slab(x, Y(foot), w, Math.round(h * 0.6), Math.round(h * 0.4), { roofC: R.pick([0x6a7680, 0x7a6a5a, 0x5a6a74]), wall: R.pick([0xb8b8b0, 0xa8a49a]), plainRoof: false, shop: false });
  }
  {
    const x0 = 86;
    const w = 44;
    const foot = 5150;
    const y = Y(foot + 32);
    objects.push({
      y: Y(foot),
      shadow: () => k.shadowRect(x0 + 3, y + 3, w, 32, 0.5),
      draw: () => {
        const X0 = x0 * S;
        const WW = w * S;
        for (let j = 0; j < 60; j++)
          for (let i = 0; i < WW; i++) {
            let c = j % 15 < 2 ? 0x5a6a74 : (i >> 1) % 2 ? 0x8a9aa4 : 0x7a8a94;
            if (j % 15 >= 12) c = scaleColor(c, 0.86);
            if (i < 2) c = scaleColor(c, 1.2);
            if (i >= WW - 2) c = scaleColor(c, 0.66);
            if (Math.abs(i - WW / 2) < 8 && j % 30 < 9) c = (i + j) % 3 ? 0xc8d4dc : 0x6a7a84;
            img.px(X0 + i, y * S + j, c);
          }
        // the open market floor, lit: pillars, stacked boxes, people working under the lamps
        for (let j = 0; j < 36; j++)
          for (let i = 0; i < WW; i++) {
            let c = j < 3 ? 0x2a2e34 : i % 24 < 3 ? 0x8a9aa4 : j > 26 ? 0x5a6a74 : 0xffe4a8;
            if (j >= 12 && j < 27 && i % 24 >= 3 && (i >> 2) % 3 === 0) c = (j >> 1) % 2 ? 0x3a8ac8 : 0xe8e8e8;
            img.px(X0 + i, (y + 20) * S + j, c);
          }
        for (let i = 12; i < WW; i += 24) glowPx(X0 + i, (y + 21) * S + 1, 0xfff4d8, 0.95);
        pool(x0 + w / 2, y + 36, 24, 0xffe4a8, 0.14 + night(5150) * 0.2);
      },
    });
    k.reserve(x0 - 1, y - 1, w + 3, 34);
    k.crowd(x0 + 2, Y(foot) + 2, w - 4, 6, 14);
  }
  // fishing boats moored along the south quay, their squid lamps lit in a row, their light on the water
  const squid = (x, y, col) => {
    objects.push({
      y: y + 14,
      shadow: () => {
        for (let Yy = (y + 2) * S; Yy < (y + 16) * S; Yy++) for (let i = 0; i < 6; i++) if (k.wetPx((x + 6) * S + i, Yy)) img.px((x + 6) * S + i, Yy, 0x061420, 0.3);
      },
      draw: () => {
        const X0 = x * S;
        const Y0 = y * S;
        const WW = 21;
        const LL = 42;
        for (let j = 0; j < LL; j++) {
          const t = LL - 1 - j;
          const hw = Math.min(WW / 2, 1 + Math.pow(t, 0.6) * 2.6);
          for (let i = -hw; i <= hw; i++) {
            const e = hw - Math.abs(i);
            img.px(X0 + 10 + i, Y0 + j, e < 1.2 ? (i > 0 ? scaleColor(col, 0.66) : scaleColor(col, 1.2)) : e < 2.4 ? col : j % 6 === 0 ? 0x9a9488 : 0xb8b2a4);
          }
        }
        for (let j = 5; j < 15; j++) for (let i = 5; i < 16; i++) img.px(X0 + i, Y0 + j, j < 7 ? 0xffffff : j > 12 ? 0x9a9e9e : i > 13 ? 0x2a3a4a : 0xe8e8e0);
        // the line of big lamps down the middle, each a white bulb on a cross wire
        for (let j = 17; j < 38; j += 4) {
          for (let i = 3; i < 18; i++) img.px(X0 + i, Y0 + j, 0x4a4e54);
          for (const i of [5, 15]) {
            glowPx(X0 + i, Y0 + j, 0xf8fff0);
            glowPx(X0 + i + 1, Y0 + j, 0xe8fff0, 0.8);
            glowPx(X0 + i, Y0 + j + 1, 0xe8fff0, 0.8);
          }
        }
        pool(x + 3.5, y + 11, 13, 0xc8ffd8, 0.1 + night(5200) * 0.26);
      },
    });
  };
  for (let x = 8; x < 170; x += 13) {
    if (Math.abs(x - B_X) < 12) continue;
    const y = Y(Math.round(uraSouth(x)) + 17);
    if (!k.wet(x + 3, y + 2)) continue;
    squid(x, y, R.pick([0xe8e8e0, 0x3a6a9a, 0xd8d0b8, 0x8a3a2a]));
    // their reflection and the glow of their lamps on the water, going up the screen
    for (let q = 0; q < 70; q += 2) if (hashPx(x, q, 5302) < 0.6) img.rectPx(x * S + 2 + Math.round(Math.sin(q * 0.4) * 3) + Math.floor(hashPx(x, q, 5303) * 14), y * S - q, 3 + Math.floor(hashPx(q, x, 5304) * 4), 1, 0xc8ffe0, 0.34 * (1 - q / 70));
  }
  for (let x = 6; x < 176; x += 22) {
    const u = Math.round(uraSouth(x)) - 7;
    if (Math.abs(x - B_X) < 11 || k.isRes(x, Y(u))) continue;
    k.streetLamp(x, u);
    const X = x * S + 9;
    const Yy = Y(u) * S;
    const kind = (x >> 1) % 4;
    if (kind === 0) for (let q = 0; q < 9; q++) img.rectPx(X + (q % 3) * 6, Yy - 6 + (q >> 1) * 4 - q, 5, 3, q % 2 ? 0x3a8ac8 : 0xe8e8e8);
    else if (kind === 1) img.fine(x + 3, Y(u) - 2, 10, 5, (A, B) => ((A + B) % 4 === 0 || (A - B) % 4 === 0 ? 0x4a6a7a : null));
    else if (kind === 2) {
      for (let j = 0; j < 12; j++) for (let i = 0; i < 27; i++) img.px(X + i, Yy - 6 + j, j === 0 ? 0xffffff : j === 11 ? 0x8a9098 : i > 18 ? (i < 21 ? 0x2a3440 : 0x5a86c8) : 0xe8ecf0);
      for (let i = 0; i < 27; i++) for (let j = 0; j < 3; j++) img.tintPx(X + i + 1, Yy + 6 + j, 0.7);
    }
    k.crowd(x + 2, Y(u) - 3, 8, 6, 2);
  }
  // moored along the north quay too: a coaster and a small ferry at their berths
  for (const [x, col] of [[110, 0x2a5a8a], [140, 0x8a3a2a], [20, 0xe8e4d8]]) {
    const u = Math.round(uraNorth(x)) - 5;
    const hull = k.hull(26, 8, 5400, col, 0xb8b2a4, (r, FL, FHh) => {
      for (let j = 5; j < FHh - 5; j++) for (let i = 6; i < 24; i++) r.px(i, j, j === 5 ? 0xffffff : (i - 6) % 5 === 0 ? 0x3a4a5a : 0xe8e8e0);
      for (let i = 30; i < FL - 12; i += 6) r.rectPx(i, 6, 4, FHh - 12, 0x3a5a6a);
      for (let i = 8; i < 24; i += 3) r.px(i, 6, 0xffe0a0);
    });
    kit.loop(x - 13, u + 4, [hull], { d: 0.03 });
  }
  // the town's lights trembling in the water below the north quay
  for (let X = 2; X < W * S; X += 2) {
    const x = X / S;
    const base = Y(Math.round(uraNorth(x))) * S;
    if (Math.abs(x - B_X) < 11) continue;
    const c = hashPx(Math.floor(X / 12), 1, 5300) < 0.75 ? 0xffc870 : 0xa8d8f0;
    if (hashPx(Math.floor(X / 12), 2, 5300) < 0.4) continue;
    const len = 18 + hashPx(Math.floor(X / 12), 3, 5300) * 48;
    for (let j = 8; j < len; j += 2) {
      if (hashPx(X, j, 5301) < 0.4) continue;
      const Yy = base + j;
      if (k.wetPx(X, Yy)) {
        img.px(X + Math.round(Math.sin(j * 0.4) * 2), Yy, c, 0.7 * (1 - j / len));
        img.px(X + 1 + Math.round(Math.sin(j * 0.4) * 2), Yy, c, 0.5 * (1 - j / len));
      }
    }
  }
  // the harbour bridge: a frame of its own (boats go under), concrete piers in the water, its shadow on the water
  {
    const u0 = Math.floor(uraSouth(B_X)) - 4;
    const u1 = Math.ceil(uraNorth(B_X)) + 4;
    const x0 = B_X - 8;
    const deck = k.capture(x0, Y(u1), 17, u1 - u0, () => {
      img.fine(x0, Y(u1), 17, u1 - u0, (X, Yy, x, y) => {
        const a = Math.abs(x - B_X);
        const u = 7168 - y;
        if (a > 7.4) return Yy % 12 < 2 ? 0x6a6e74 : 0xe0e2e0;
        if (a > 6.5) return 0x8a8e94;
        if (a > 5.2) return k.pavePx(X, Yy);
        if (a > 4.9) return 0xbcb8aa;
        if (a < 0.2 && u % 6 < 3) return 0xdad6c8;
        return k.asphaltPx(X, Yy);
      });
      for (let u = u0 + 6; u < u1; u += 24) {
        for (const lx of [x0, x0 + 16]) {
          const X = lx * S + 1;
          const Yy = Y(u) * S;
          for (let j = 0; j < 9; j++) img.px(X, Yy - j, 0x5a5e66);
          glowPx(X, Yy - 10, 0xfff0c8);
          glowPx(X + 1, Yy - 10, 0xfff0c8);
        }
        pool(B_X, Y(u), 8, C.lamp, 0.1 + night(5300) * 0.22);
      }
    }, 5300);
    kit.loop(x0, u1, [deck], { d: 0.04 });
    // its piers and the water's reflection of its lamps: nothing else in that strip of water
    for (let u = u0 + 20; u < u1 - 10; u += 40) {
      const CX = B_X * S;
      const CY = Y(u) * S;
      for (let j = -6; j <= 6; j++) for (let i = -21; i <= 21; i++) if ((i / 21) ** 2 + (j / 6) ** 2 <= 1) img.px(CX + i, CY + j, j < -2 ? C.concrete[3] : C.concrete[1]);
      for (let a = 0; a < 6.3; a += 0.15) img.px(CX + Math.cos(a) * 24, CY + 2 + Math.sin(a) * 8, 0xc8e0e4, 0.4);
    }
    for (let Yy = Y(u1) * S; Yy < Y(u0) * S; Yy++) for (let i = 0; i < 18; i++) if (k.wetPx((B_X + 9) * S + i, Yy)) img.px((B_X + 9) * S + i, Yy, 0x061420, 0.4 * (1 - i / 18));
    k.reserve(x0, Y(u1), 17, u1 - u0);
  }
  // the north shore: the quay, a row of warehouses' roofs, Inasa-machi's houses climbing towards the roundabout
  img.fine(0, Y(5452), W, 75, (X, Yy, x, y) => {
    const u = 7168 - y;
    if (u < uraNorth(x) || k.isRes(x, y)) return null;
    if (k.fineWater[Yy * k.FW + X] || k.shoreD[Yy * k.FW + X] <= 5) return null;
    const flag = 30;
    if (X % flag === 0 || Yy % flag === 0) return 0x4e4c48;
    return rampColor(C.quay, 0.34 + hashPx(Math.floor(X / flag), Math.floor(Yy / flag), 5424) * 0.28 + (fbm(x, y, { seed: 5425, scale: 7 }) - 0.5) * 0.4, X, Yy);
  });
  for (let x = 6; x < 176; x += 26) {
    const u = Math.round(uraNorth(x)) + 12;
    if (Math.abs(x - B_X) < 16 || k.anyRes(x, Y(u + 12), 18, 12)) continue;
    k.streetLamp(x + 9, u - 6);
    if (u + 12 < 5450) for (let q = 0; q < 3; q++) img.rectPx((x + q * 5) * S, Y(u - 2) * S, 12, 6, q % 2 ? 0x3a6aa8 : 0xd8d0b8);
  }
  k.block(0, 180, 5466, 5584, () => (R() < 0.8 ? 'jp' : 'block'), { rowH: 22, w: [10, 16] });
  k.grove(0, 180, 5466, 5600, 34, [CAMPHOR, OAK], 5466, 3, 5);
  // Fuchi Shrine by the roundabout: torii, lanterns, the hall in its grove, a path to it
  {
    k.road([[FUCHI.x - FUCHI.r - 2, FUCHI.u], [44, FUCHI.u], [36, 5612]], 2, { side: 0, surface: C.paving });
    const y = Y(5612);
    objects.push({
      y: y + 1,
      shadow: () => k.shadowRect(29, y - 2, 20, 3, 0.6),
      draw: () => {
        const CX = 36 * S + 2;
        const Yb = y * S;
        for (const s of [-21, 18]) for (let j = -36; j < 3; j++) for (let i = 0; i < 6; i++) img.px(CX + s + i, Yb + j, i < 1 ? C.vermilion[3] : i > 4 ? C.vermilion[0] : C.vermilion[2]);
        for (let i = -33; i <= 33; i++) {
          const lift = Math.round((i * i) / 300);
          for (let j = 0; j < 7; j++) img.px(CX + i, Yb - 45 - lift + j, j < 2 ? 0x3a3438 : j < 5 ? 0x1a1620 : C.vermilion[1]);
          if (Math.abs(i) < 27) for (let j = 0; j < 3; j++) img.px(CX + i, Yb - 30 + j, j < 1 ? C.vermilion[3] : C.vermilion[1]);
        }
        for (let j = 0; j < 9; j++) for (let i = -5; i <= 5; i++) img.px(CX + i, Yb - 39 + j, Math.abs(i) === 5 || j === 0 || j === 8 ? C.gold : 0x1a1620);
      },
    });
    k.house(20, Y(5650), 32, 16, 10, 'jp', { wall: 0xe8e0d0, ramp: C.copper, roof: { gable: 'kara', gw: 12, crest: true, noshi: true }, door: true });
    k.stoneLantern(26, 5620);
    k.stoneLantern(48, 5620);
    k.crowd(30, Y(5620), 14, 4, 4);
    // the shrine's little ropes of lanterns up the approach
    for (let u = 5614; u < 5624; u += 3) for (const x of [29, 43]) glowPx(x * S, Y(u) * S, 0xffd090, 0.85);
  }
  // the ropeway's lower station: a glazed hall the cables come out of, its forecourt, a coach, people
  {
    k.road([[FUCHI.x + FUCHI.r + 2, FUCHI.u], [104, FUCHI.u], [110, 5618]], 2, { side: 0, surface: C.paving });
    k.flagFill(98, Y(5634), 36, 16, C.plaza, 5635, 15);
    k.reserve(98, Y(5634), 36, 16);
    k.slab(98, Y(5664), 36, 18, 14, {
      roofC: 0x6a7076,
      wall: 0xc8d0d4,
      plainRoof: true,
      shop: false,
      door: false,
      extra: (by) => {
        const X0 = 100 * S;
        const Yb = by * S;
        for (let j = 0; j < 36; j++)
          for (let i = 0; i < 96; i++) {
            let c = (i % 12 < 2 || j % 12 < 1) ? 0x4a5a64 : j > 27 ? 0x3a4a58 : night(5660) > 0.3 ? 0xffe8b8 : 0x8ab4c8;
            if (Math.abs(i - 48) < 9 && j > 15) c = (i + 90) % 9 < 1 ? 0x2a2e34 : 0x2e4252;
            img.px(X0 + i, Yb - 39 + j, c);
          }
        // the sign, red on white
        for (let j = 0; j < 7; j++) for (let i = 0; i < 48; i++) img.px(X0 + 24 + i, Yb - 39 - 6 + j, j === 0 || j === 6 ? 0x2a2e34 : i % 4 < 2 && j > 1 && j < 5 ? 0xc8302a : 0xf4f0e8);
        pool(116, by + 6, 18, 0xffe8b8, 0.14 + night(5660) * 0.22);
      },
    });
    k.crowd(102, Y(5632), 28, 8, 12);
    parkedCar(k, 100 * S, Y(5622) * S, 0xe8e8e0);
    parkedCar(k, 106 * S, Y(5622) * S, 0x3a609c);
  }
}

export function paintInasa(k) {
  const { img, Y, kit, objects, glowPx, pool } = k;
  const R = rng(333);
  // the cleared strip under the ropeway, then the line itself: two cables, two lattice towers
  const [lx, lu] = ROPE.lower;
  const [ux, uu] = ROPE.upper;
  const ropeAt = (t) => [lx + (ux - lx) * t, lu + (uu - lu) * t];
  for (let Yy = Y(uu) * S; Yy < Y(lu) * S; Yy++) {
    const u = 7168 - (Yy + 0.5) / S;
    const t = (u - lu) / (uu - lu);
    const [x] = ropeAt(t);
    for (let X = Math.round((x - 7) * S); X < (x + 7) * S; X++) {
      const xx = X / S;
      const yy = Yy / S;
      if (k.isRes(xx, yy)) continue;
      const e = 7 - Math.abs(xx - x);
      const n = 0.25 + fbm(xx, u, { seed: 6001, scale: 3 }) * 0.5;
      if (e < 1.4 && hashPx(X >> 1, Yy >> 1, 6002) < 0.6) continue;
      img.px(X, Yy, k.lawnPx(X, Yy, n, C.moss));
    }
  }
  for (const t of ROPE.towers) {
    const [x, u] = ropeAt(t);
    const y = Y(u);
    k.reserve(x - 6, y - 4, 12, 6);
    objects.push({
      y: y + 1,
      shadow: () => k.shadowRect(Math.round(x) + 2, y - 4, 10, 5, 0.55),
      draw: () => {
        const CX = Math.round(x * S);
        const Yb = y * S;
        for (const s of [-1, 1]) {
          img.linePx(CX + s * 12, Yb, CX + s * 6, Yb - 66, 0xa8b4bc);
          img.linePx(CX + s * 12 + 1, Yb, CX + s * 6 + 1, Yb - 66, 0x5a6670);
        }
        for (let j = 6; j < 66; j += 9) {
          const a = 12 - (j / 66) * 6;
          const b = 12 - ((j + 9) / 66) * 6;
          img.linePx(CX - a, Yb - j, CX + b, Yb - j - 9, 0x8a96a0);
          img.linePx(CX + a, Yb - j, CX - b, Yb - j - 9, 0x5a6670);
          img.linePx(CX - a, Yb - j, CX + a, Yb - j, 0x8a96a0);
        }
        for (let i = -19; i <= 19; i++) for (let j = 0; j < 5; j++) img.px(CX + i, Yb - 72 + j, j < 1 ? 0xd0dae0 : j > 3 ? 0x5a6670 : 0xa8b4bc);
        for (const s of [-8, 8]) {
          img.discPx(CX + s, Yb - 73, 2.4, 0x3a4048);
          img.px(CX + s - 1, Yb - 74, 0x8a96a0);
        }
        for (const s of [-18, 18]) {
          glowPx(CX + s, Yb - 74, 0xff4030);
          glowPx(CX + s + 1, Yb - 74, 0xff4030, 0.6);
        }
      },
    });
  }
  // the cables, drawn over everything else on the strip (they run above the trees)
  objects.push({
    y: Y(uu) + 99999,
    draw: () => {
      for (const off of [-2.5, 2.5]) {
        for (let Yy = Y(uu) * S; Yy < Y(lu) * S; Yy++) {
          const u = 7168 - Yy / S;
          const t = (u - lu) / (uu - lu);
          const sag = Math.sin(t * Math.PI * 3) * 1.5;
          const [x] = ropeAt(t);
          const X = Math.round((x + off + sag * 0.2) * S);
          img.px(X, Yy, 0xd0d8e0, 0.9);
          img.px(X + 1, Yy, 0x2a3038, 0.7);
        }
      }
    },
  });
  // gondolas, one up while the other comes down, windows lit, people inside
  const cabin = [0, 1].map((f) =>
    k.sprite(11, 14, 6200, (r) => {
      for (let j = 0; j < 10; j++) r.px(16, j, 0xc8ccd0);
      for (let i = -5; i <= 5; i++) r.px(16 + i, 3, 0xa8acb0);
      for (let j = 9; j < 39; j++)
        for (let i = 3; i < 30; i++) {
          const e = Math.min(i - 3, 29 - i, j - 9, 38 - j);
          if (e === 0 && (i === 3 || i === 29) && (j === 9 || j === 38)) continue;
          let c = e < 1 ? 0x2a2e36 : j < 13 ? 0xd8e0e4 : j > 33 ? 0xc83a30 : (i - 3) % 7 === 0 ? 0x4a5058 : f ? 0xffd890 : 0xffe4a8;
          if (j >= 22 && j < 27 && e >= 1 && (i - 3) % 7 > 1 && (i - 3) % 7 < 5) c = 0x2a2026;
          r.px(i, j, c);
        }
      r.px(9, 15, 0xffffff);
    }, false),
  );
  for (const [off, s0] of [[-2.5, 0], [2.5, 0.5]]) kit.path([[lx + off, lu + 4], [ux + off, uu - 6]], [cabin[0], cabin[1]], { sp: 9, mode: 'pp', hold: 6, turn: 'none', fps: 0.5, s0, d: 0.7 });

  // ---- the terraced hamlet on the lower slope: stone walls, houses with their lamps lit, stair lanes, vegetable plots
  {
    const x0 = 44;
    const x1 = 102;
    for (let u = 5722; u < 5812; u += 24) {
      const wob = (u % 7) - 3;
      k.stoneFace(x0, x1, Y(u + wob), 2, u, C.rock);
      img.fine(x0, Y(u + wob + 22), x1 - x0, 22, (X, Yy) => k.lawnPx(X, Yy, 0.25 + hashPx(X >> 3, Yy >> 2, 5701) * 0.45, C.moss));
      k.reserve(x0, Y(u + wob + 24), x1 - x0, 26);
      let x = x0 + 2;
      let q = u % 5;
      while (x < x1 - 12) {
        const w = 12 + (q * 3) % 7;
        if (Math.abs(x + w / 2 - 74) > 8) {
          if (q % 3 === 2) {
            // a vegetable plot in rows
            img.fine(x, Y(u + wob + 18), w, 14, (X, Yy) => ((X >> 2) % 2 ? k.earthPx(X, Yy, 3) : hashPx(X >> 1, Yy >> 1, 5702) < 0.6 ? C.moss[3] : C.moss[2]));
          } else k.house(x, Y(u + wob + 20), w - 1, 8, 6, 'jp', { reserve: false, wall: R.pick(C.walls), bay: 4 });
        }
        x += w + 2;
        q++;
      }
    }
    k.stairs(71, Y(5828), 6, 112, C.rock);
    k.reserve(71, Y(5828), 6, 112);
    for (let u = 5726; u < 5820; u += 24) k.streetLamp(70, u, 0xffd8a0);
  }
  // ---- Inasayama Park, inside the loop of the driveway: the deer's paddock, azalea banks, an open-air stage
  {
    // the azalea slopes in bloom, a walk through them, paved terraces
    const azalea = (x0, x1, u0, u1, sd) => {
      const g = rng(sd);
      for (let q = 0; q < ((x1 - x0) * (u1 - u0)) / 50; q++) {
        const x = x0 + g() * (x1 - x0);
        const u = u0 + g() * (u1 - u0);
        const y = Y(u);
        const c = [0xe86a9a, 0xf4a0c0, 0xd84a7a, 0xf8f0f4][Math.floor(g() * 4)];
        const r = 4 + g() * 5;
        if (k.isRes(x, y)) continue;
        const CX = x * S;
        const CY = y * S;
        for (let j = -r; j <= r; j++)
          for (let i = -r; i <= r; i++) {
            if (i * i + j * j > r * r) continue;
            const h = hashPx(CX + i >> 1, CY + j >> 1, sd);
            img.px(CX + i, CY + j, h < 0.25 ? 0x2a4a2e : i + j < 0 ? scaleColor(c, 1.05) : scaleColor(c, 0.82));
          }
        for (let i = -r; i <= r; i++) img.px(CX + i, CY + r + 1, 0x101a14, 0.5);
      }
    };
    // the deer's paddock: a wooden fence, a shelter, a walk along it, the sika grazing
    const dx0 = 36;
    const dx1 = 92;
    const du0 = 5888;
    const du1 = 5960;
    img.fine(dx0, Y(du1), dx1 - dx0, du1 - du0, (X, Yy, x, y) => k.lawnPx(X, Yy, 0.3 + fbm(x, y, { seed: 5901, scale: 7 }) * 0.5, C.grass, true));
    k.reserve(dx0, Y(du1), dx1 - dx0, du1 - du0);
    for (let X = dx0 * S; X < dx1 * S; X++) for (const Yb of [Y(du1) * S, Y(du0) * S]) {
      img.px(X, Yb, C.wood[3]);
      img.px(X, Yb + 3, C.wood[2]);
      if (X % 15 < 2) for (let j = -2; j < 6; j++) img.px(X, Yb + j, C.wood[1]);
    }
    for (let Yy = Y(du1) * S; Yy < Y(du0) * S; Yy++) for (const X of [dx0 * S, dx1 * S - 1]) {
      img.px(X, Yy, Yy % 15 < 3 ? C.wood[1] : C.wood[3]);
    }
    k.house(40, Y(du1 - 6), 16, 7, 4, 'jp', { wall: C.oldWood[1], reserve: false, bay: 8 });
    for (const [x, u, n] of [[60, 5920, 3], [76, 5905, 2], [48, 5900, 2]]) {
      const deer = [0, 1].map((f) => k.sprite(7, 6, 5900, (r) => {
        for (let i = 2; i < 17; i++) for (let j = 11; j < 14; j++) r.px(i, j + 3, 0x101018, 0.22);
        for (let j = 6; j < 12; j++) for (let i = 3; i < 14; i++) if (!((i === 3 || i === 13) && (j === 6 || j === 11))) r.px(i, j, j === 6 ? 0xd09458 : j > 9 ? 0x9a6030 : 0xb8763c);
        for (const [i, j] of [[5, 7], [8, 8], [11, 7], [6, 9], [10, 9]]) r.px(i, j, 0xf8eed8);
        for (let j = 2; j < 7; j++) for (let i = 13; i < 15; i++) r.px(i, j, i === 13 ? 0xc88446 : 0xa86a34);
        for (let j = 0; j < 3; j++) for (let i = 14; i < 19; i++) r.px(i, j, j === 0 ? 0xd89a58 : 0xc88446);
        r.px(19, 1, 0x2a1a10);
        const fr = f ? 1 : 0;
        for (const [i, st] of [[4, fr], [6, 1 - fr], [11, fr], [13, 1 - fr]]) for (let j = 12; j < 16 + st; j++) r.px(i, j, j > 14 ? 0x3a2618 : 0x7a4e28);
      }));
      kit.wander(x, u, 10, 10, deer, { n, sp: 3, turn: 'flip', fps: 3, idle: 0.7 });
    }
    for (const [x, u, r] of [[50, 5940, 5], [78, 5944, 6], [84, 5900, 5], [44, 5898, 4.5], [68, 5896, 4], [62, 5940, 3.5]]) k.tree(x, Y(u), r, r > 4.4 ? CAMPHOR : OAK, x * 7 + u);
    k.rockPx(60 * S, Y(5912) * S, 8, C.rock, 5);
    // a feeding trough, a salt lick post, a little drinking pond
    img.fine(66, Y(5922), 12, 6, (X, Yy, x, y) => {
      const d = Math.hypot((x - 72) / 6, (y - Y(5919)) / 3);
      if (d >= 1) return null;
      return d > 0.8 ? C.rock[2] : (X + (Yy >> 1)) % 9 === 0 ? 0x8ac0d8 : 0x2a5a6a;
    });
    for (let i = 0; i < 18; i++) for (let j = 0; j < 4; j++) img.px(46 * S + i, Y(5915) * S + j, j < 1 ? C.wood[3] : C.wood[1]);
    k.way([[36, 5966], [96, 5966], [96, 6020]], 1.8, { paint: k.gravelPx, kerb: C.granite[1] });
    k.walkers([[38, 5966], [94, 5966]], 2, 5960, { sp: 3, gap: 40 });
    azalea(36, 96, 5970, 6030, 5902);
    // the open-air stage: a half bowl of grass tiers, the white shell of the stage, the lit front
    {
      const cx = 138;
      const cu = 5920;
      img.fine(cx - 24, Y(cu + 24), 48, 28, (X, Yy, x, y) => {
        const d = Math.hypot(x - cx, y - Y(cu));
        if (d > 22 || y > Y(cu)) return null;
        if (d < 6) return k.flagPx(X, Yy, x, y, C.plaza, 5903, 12);
        const q = d % 3;
        if (q < 0.6) return C.concrete[3];
        if (q < 1) return C.concrete[0];
        return k.lawnPx(X, Yy, 0.45, C.lawn);
      });
      k.reserve(cx - 22, Y(cu + 22), 44, 24);
      objects.push({
        y: Y(cu - 2),
        shadow: () => k.shadowRect(cx - 12, Y(cu + 14), 28, 15, 0.55),
        draw: () => {
          const CX = cx * S;
          const Yb = Y(cu) * S;
          for (let j = 0; j < 9; j++) for (let i = -30; i <= 30; i++) img.px(CX + i, Yb + j, j < 1 ? 0xf0ece0 : j > 7 ? 0x5a5a56 : C.oldWood[(j >> 1) % 2 + 2]);
          for (let i = -30; i <= 30; i += 5) glowPx(CX + i, Yb + 1, 0xfff0c8, 0.85);
        },
      });
      k.crowd(cx - 14, Y(cu + 14), 28, 10, 10);
      k.streetLamp(cx - 22, cu - 4);
      k.streetLamp(cx + 22, cu - 4);
    }
  }
  // ---- a small mountain shrine and a clearing of rocks inside the upper loop, reached by a stepped path
  {
    const sx = 116;
    const su = 6296;
    k.way([[140, 6336], [120, 6316], [sx, su - 12]], 1.8, { paint: k.gravelPx, kerb: C.rock[1] });
    k.fill(sx - 18, Y(su + 14), 36, 28, C.moss, 6297, 5);
    k.reserve(sx - 18, Y(su + 14), 36, 28);
    k.house(sx - 9, Y(su + 12), 18, 9, 5, 'jp', { ramp: C.copper, wall: 0x6a4a32, roof: { gable: 'tri', gw: 7 }, reserve: false });
    for (const [x, u] of [[sx - 6, su - 8], [sx + 6, su - 8], [sx - 10, su - 2], [sx + 10, su - 2]]) k.stoneLantern(x, u, true);
    // a line of little red torii up the path
    for (let q = 0; q < 6; q++) {
      const t = q / 6;
      const x = 140 + (120 - 140) * t;
      const u = 6336 + (6316 - 6336) * t;
      objects.push({
        y: Y(u) + 1,
        draw: () => {
          const CX = Math.round(x * S);
          const Yb = Y(u) * S;
          for (const s of [-7, 6]) for (let j = -15; j < 1; j++) for (let i = 0; i < 2; i++) img.px(CX + s + i, Yb + j, i ? C.vermilion[1] : C.vermilion[3]);
          for (let i = -10; i <= 10; i++) {
            img.px(CX + i, Yb - 18, 0x2a2026);
            img.px(CX + i, Yb - 17, C.vermilion[2]);
            if (Math.abs(i) < 8) img.px(CX + i, Yb - 12, C.vermilion[2]);
          }
        },
      });
    }
    for (const [x, u, rx, ry] of [[92, 6290, 8, 6], [146, 6280, 7, 6], [132, 6246, 6, 5], [90, 6260, 5, 4]]) k.boulder(x, u, rx, ry, x + u, 0.6);
  }
  // the inclined slope car on the east edge: twin rails on their concrete bed, a stair beside them, its lit glass capsule
  {
    const sx = 173;
    const a = 5860;
    const b = 6650;
    img.fine(sx - 4, Y(b), 9, b - a, (X, Yy) => {
      const i = X - (sx - 4) * S;
      if (i < 2 || i > 24) return i === 0 ? C.concrete[4] : C.concrete[0];
      if (i >= 8 && i < 10) return 0xd0d8e0;
      if (i >= 17 && i < 19) return 0xd0d8e0;
      return Yy % 9 === 0 ? C.concrete[0] : C.concrete[2];
    });
    k.reserve(sx - 4, Y(b), 9, b - a);
    for (let u = a + 10; u < b; u += 40) {
      const Yy = Y(u) * S;
      glowPx((sx - 4) * S, Yy, 0xc8e8ff, 0.85);
      glowPx((sx + 5) * S - 1, Yy, 0xc8e8ff, 0.85);
    }
    const capsule = k.sprite(9, 14, 6200, (r) => {
      for (let j = 0; j < 42; j++)
        for (let i = 0; i < 27; i++) {
          const e = Math.min(i, 26 - i, j, 41 - j);
          if (e < 2 && (i < 3 || i > 23) && (j < 3 || j > 38)) continue;
          r.px(i, j, e < 1 ? 0x2a3038 : j < 4 || j > 37 ? 0xe8ecf0 : i % 8 === 0 || j % 10 === 0 ? 0x5a6470 : 0xffeabc);
        }
      for (const [i, j] of [[8, 12], [18, 12], [12, 24], [18, 28]]) r.rectPx(i, j, 3, 4, 0x2a2026);
    }, false);
    kit.path([[sx - 4.5, a + 14], [sx - 4.5, b - 2]], [capsule], { sp: 10, mode: 'pp', hold: 7, turn: 'none', d: 0.7 });
    // its two stations
    k.slab(158, Y(a + 12), 22, 9, 8, { roofC: 0x6a7076, wall: 0xc8d0d4, plainRoof: true, shop: false });
    k.slab(158, Y(b + 16), 22, 9, 8, { roofC: 0x6a7076, wall: 0xc8d0d4, plainRoof: true, shop: false });
  }
  // the lookouts at the hairpins: a flagged bay, a rail, a parked car or two, people
  for (const [x, u] of [[16, 5770], [168, 5962], [16, 6120], [166, 6300]]) {
    k.flagFill(x - 6, Y(u + 7), 13, 14, C.plaza, x + u, 12);
    for (let Yy = Y(u + 7) * S; Yy < Y(u - 7) * S; Yy++) {
      const X = (x + (x < 90 ? -6 : 7)) * S;
      img.px(X, Yy, Yy % 12 < 2 ? 0x5a5e66 : 0xd8d4c8);
      img.px(X + 1, Yy, 0x6a6e72);
    }
    k.reserve(x - 7, Y(u + 7), 15, 15);
    k.crowd(x + (x < 90 ? -4 : 2), Y(u + 5), 3, 10, 4);
    k.streetLamp(x + (x < 90 ? 5 : -5), u);
    parkedCar(k, (x + (x < 90 ? 0 : -3)) * S, Y(u + 3) * S, CARS[(x + u) % CARS.length]);
  }
  // lamps along the driveway with their pools of light, the guard rail on the outside of the bends, curve mirrors
  for (let i = 1; i < DRIVE.length - 1; i++) {
    const [x, u] = DRIVE[i];
    const [x2, u2] = DRIVE[i + 1];
    const nx = -(u2 - u);
    const nu = x2 - x;
    const n = Math.hypot(nx, nu) || 1;
    const steps = Math.floor(n / 24);
    for (let q = 0; q <= steps; q++) {
      const t = (q + 0.5) / (steps + 1);
      const side = (i + q) % 2 ? 1 : -1;
      const px = Math.round(x + (x2 - x) * t + side * (nx / n) * 7);
      const pu = Math.round(u + (u2 - u) * t + side * (nu / n) * 7);
      if (px > 2 && px < W - 2 && !k.isRes(px, Y(pu))) {
        k.reserve(px - 1, Y(pu) - 1, 3, 3);
        k.streetLamp(px, pu, 0xfff0c8);
      }
    }
    // the rail along this leg, on its outer edge
    const m = Math.ceil(n);
    for (let q = 0; q < m * S; q++) {
      const t = q / (m * S);
      const X = Math.round((x + (x2 - x) * t + (nx / n) * 5.4) * S);
      const Yy = Math.round((7168 - (u + (u2 - u) * t + (nu / n) * 5.4)) * S);
      img.px(X, Yy, q % 15 < 2 ? 0x4a4e54 : 0xc8ccd0);
    }
  }

  // ---- the summit
  // the ropeway's top station, a path to the light tunnel
  k.slab(68, Y(6634), 30, 18, 12, {
    roofC: 0x5a6068,
    wall: 0xc8d0d4,
    plainRoof: true,
    shop: false,
    door: false,
    extra: (by) => {
      const X0 = 70 * S;
      const Yb = by * S;
      for (let j = 0; j < 30; j++) for (let i = 0; i < 78; i++) glowPx(X0 + i, Yb - 33 + j, i % 12 < 2 || j % 12 < 1 ? 0x6a7a84 : 0xffe8b8, 0.95);
    },
  });
  k.flagFill(60, Y(6612), 46, 12, C.plaza, 6613, 15);
  k.reserve(60, Y(6612), 46, 12);
  // the summit's ground: lawns, flowerbeds, trimmed hedges in the night light
  k.lawnFill(26, Y(6716), 120, 104, C.lawn, 6701);
  k.reserve(26, Y(6716), 120, 104);
  // parked cars in their bays
  {
    const g = rng(6580);
    for (let row = 0; row < 2; row++)
      for (let q = 0; q < 11; q++) {
        if (g() < 0.3) continue;
        const col = CARS[Math.floor(g() * CARS.length)];
        parkedCar(k, PARK.x0 * S + 3 + q * 18, (Y(PARK.u1) + 3 + row * 26) * S, col);
      }
    for (let x = PARK.x0 + 4; x < PARK.x1; x += 18) k.streetLamp(x, PARK.u0 + 20);
  }
  k.way([[82, 6600], [82, 6604]], 2.4, { paint: (X, Yy) => k.settPx(X, Yy, 6, C.plaza), kerb: null });
  // the tunnel of lights from the station to the observatory: arches of bulbs over the walk, each its own colour, a slow
  // wave of brightness running along it
  const TUN = [[98, 6622], [104, 6630], [106, 6640]];
  k.way(TUN, 3.4, { paint: (X, Yy) => k.settPx(X, Yy, 7, C.plaza), kerb: C.granite[3] });
  {
    const bulb = k.sprite(3, 3, 6630, (r) => {
      r.discPx(4, 4, 4, 0xffffff, 0.3);
      r.discPx(4, 4, 2, 0xffffff, 0.95);
    }, false);
    const parts = [];
    const COLS = [0xff6a8a, 0xffd868, 0x6ae0ff, 0xb898ff, 0x8ee878];
    for (let q = 0; q < 32; q++) {
      const t = q / 31;
      const seg = t < 0.5 ? 0 : 1;
      const f = seg === 0 ? t * 2 : (t - 0.5) * 2;
      const x = TUN[seg][0] + (TUN[seg + 1][0] - TUN[seg][0]) * f;
      const u = TUN[seg][1] + (TUN[seg + 1][1] - TUN[seg][1]) * f;
      for (const s of [-3.4, 3.4]) {
        const X = Math.round((x + s) * S);
        const Yy = Y(u) * S;
        glowPx(X, Yy - 3, COLS[q % 5], 0.95);
        glowPx(X + 1, Yy - 3, COLS[q % 5], 0.6);
        parts.push([0, x + s - 1.5, u + 2, -q * 0.3]);
      }
    }
    kit.wave([bulb], parts, { w: 1.6, a0: 0.1, a1: 0.9, pw: 4 });
  }
  // the round observatory: a glazed drum lit from inside, its roof deck, the rim of blue-white light, the crowd on it
  {
    const cx = OBS.x;
    const footY = Y(OBS.u - 24);
    const rx = 22;
    const ry = 13;
    const wall = 11;
    k.reserve(cx - rx - 2, footY - wall - ry * 2 - 3, rx * 2 + 4, wall + ry * 2 + 5);
    objects.push({
      y: footY,
      shadow: () => k.shadowEllipse(cx + 4, footY - ry + 3, rx + 2, ry + 2, 0.5),
      draw: () => {
        const CX = cx * S;
        const TY = (footY - wall - ry) * S;
        const RX = rx * S;
        const RY = ry * S;
        const WL = wall * S;
        const nt = night(OBS.u);
        // the glazed drum: mullions, two storeys of warm light, people's silhouettes against it
        for (let X = -RX; X <= RX; X++) {
          const e = Math.sqrt(Math.max(0, 1 - (X / RX) ** 2)) * RY;
          for (let j = 0; j < WL; j++) {
            const Yy = Math.round(TY + e + j);
            const ang = Math.acos(Math.max(-1, Math.min(1, X / RX)));
            const m = Math.floor(ang * 16) !== Math.floor((ang + 0.03) * 16);
            const fl = j === 15 || j === 16;
            if (j < 3) img.px(CX + X, Yy, 0x1e2630);
            else if (m || fl) img.px(CX + X, Yy, 0x4a5662);
            else {
              const shade = 1 - ((X + RX) / (RX * 2)) * 0.3;
              const sil = hashPx(Math.floor(X / 5), j > 15 ? 2 : 1, 6668) < 0.14 && (j % 15) > 7;
              const c = sil ? 0x1a1a22 : scaleColor(0xffdc98, shade);
              if (sil) img.px(CX + X, Yy, c);
              else glowPx(CX + X, Yy, c, 0.75 + nt * 0.25);
            }
          }
        }
        // the roof deck: pale paving in rings, the rail round the rim, its beacon dome
        for (let y2 = -RY; y2 <= RY; y2++)
          for (let x2 = -RX; x2 <= RX; x2++) {
            const d = (x2 / RX) ** 2 + (y2 / RY) ** 2;
            if (d > 1) continue;
            const r = Math.sqrt(d);
            let c = rampColor(C.concrete, 0.55 + (hashPx(Math.floor(r * 9), Math.floor((Math.atan2(y2 / RY, x2 / RX) + 3.2) * (2 + Math.floor(r * 9) * 3)), 6669) - 0.5) * 0.25 - (y2 / RY) * 0.1, CX + x2, TY + y2);
            if (r > 0.95) c = 0xf0f4f4;
            else if (r > 0.91) c = 0x5a6670;
            else if (Math.abs(r - 0.55) < 0.015) c = 0x9aa4aa;
            img.px(CX + x2, TY + y2, c);
          }
        for (let j = -9; j <= 9; j++) for (let i = -15; i <= 15; i++) if ((i / 15) ** 2 + (j / 9) ** 2 <= 1) img.px(CX + i, TY + j, j < -2 ? 0x9ab4c4 : 0x6a7a86);
        for (let j = -5; j < 0; j++) for (let i = -6; i <= 6; i++) glowPx(CX + i, TY + j, 0xd8f0ff, 0.5);
        for (let a = 0; a < 6.283; a += 0.13) glowPx(CX + Math.cos(a) * (RX - 2), TY + Math.sin(a) * (RY - 2), 0xd8f0ff, 0.75);
        pool(cx, footY + 2, 26, 0xffdca0, 0.18 + nt * 0.2);
      },
    });
    // people on the roof deck, along the rail, and round its foot; a stair up to it
    const g = rng(6670);
    for (let i = 0; i < 26; i++) {
      const a = g() * 6.283;
      const rr = 0.62 + g() * 0.28;
      const px = cx + Math.cos(a) * rx * rr;
      const py = footY - wall - ry + Math.sin(a) * ry * rr;
      objects.push({ y: footY + 0.5, draw: () => k.personPx(Math.round(px * S), Math.round(py * S), rng(i * 13 + 5), {}) });
    }
    k.crowd(cx - 26, footY + 1, 52, 6, 16);
  }
  // the garden's walks, little ground lights along them, round beds, trees lit from below
  const walks = [[[60, 6614], [44, 6640], [44, 6690], [70, 6708], [110, 6712]], [[44, 6664], [76, 6664], [88, 6650]], [[130, 6640], [138, 6680], [124, 6710]]];
  for (const pts of walks) {
    k.way(pts, 1.8, { paint: k.gravelPx, kerb: C.granite[2] });
    for (let i = 0; i + 1 < pts.length; i++) {
      const n = Math.ceil(Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) / 7);
      for (let q = 0; q < n; q++) {
        const x = pts[i][0] + ((pts[i + 1][0] - pts[i][0]) * q) / n;
        const u = pts[i][1] + ((pts[i + 1][1] - pts[i][1]) * q) / n;
        for (const s of [-2.6, 2.6]) {
          glowPx(Math.round((x + s) * S), Y(u) * S, 0xffe8b8, 0.9);
          pool(x + s, Y(u), 3, 0xffd8a0, 0.14);
        }
      }
    }
  }
  for (const [x, u, r] of [[60, 6690, 7], [92, 6694, 6], [126, 6660, 6]]) {
    img.fine(x - r, Y(u) - r, 2 * r, 2 * r, (X, Yy, xx, yy) => {
      const d = Math.hypot(xx - x, yy - Y(u)) / r;
      if (d >= 1) return null;
      if (d > 0.88) return C.granite[3];
      const g = hashPx(X >> 1, Yy >> 1, x);
      return g < 0.2 ? 0x2e5032 : [0xf4d040, 0xe85a70, 0xf4f0e0, 0xb898ff][Math.floor(d * 4)];
    });
    k.reserve(x - r, Y(u) - r, 2 * r, 2 * r);
  }
  for (const [x, u] of [[74, 6680], [56, 6650], [98, 6702], [132, 6700], [36, 6700], [140, 6654]]) {
    k.tree(x, Y(u), 5, [0x2a5038, 0x4a7a4a, 0x7aa85a, 0xc8d878], x * 3 + u);
    pool(x, Y(u) + 1, 8, 0xe8f0a0, 0.16);
  }
  // beds and hedges round the observatory's lawn, benches
  k.hedge(28, 66, 6642, 6646, 6671);
  k.hedge(138, 146, 6642, 6646, 6672);
  for (const [x, u] of [[34, 6660], [46, 6672], [58, 6660], [40, 6690], [64, 6684]]) k.niwaki(x, u, 0.95, x + u);
  for (let x = 34; x < 80; x += 12) k.bench(x, Y(6650), 5);
  // the long terrace along the ridge: flags, a rail against the sky, everybody with their back to us looking at the view
  {
    const u0 = 6716;
    const u1 = 6744;
    k.flagFill(40, Y(u1), 100, u1 - u0, C.plaza, 6716, 18);
    k.stoneFace(40, 140, Y(u0), 2, 6716, C.granite);
    k.reserve(40, Y(u1), 100, u1 - u0 + 3);
    for (let x = 44; x < 138; x += 16) k.bench(x, Y(u0 + 8), 6);
    k.way([[112, OBS.u + 10], [112, 6716]], 2.8, { paint: (X, Yy) => k.settPx(X, Yy, 9, C.plaza), kerb: C.granite[2] });
    objects.push({
      y: Y(u1) + 4,
      draw: () => {
        for (let X = 40 * S; X < 140 * S; X++) {
          const Yb = Y(u1) * S;
          img.px(X, Yb, 0xe8ecec);
          img.px(X, Yb + 1, 0x6a7078);
          img.px(X, Yb + 5, 0x9aa4aa);
          if (X % 18 < 2) for (let j = 0; j < 9; j++) img.px(X, Yb + j, 0x4a5058);
        }
        // the rail's lamps at foot level, and the fence with its love locks
        for (let X = 42 * S; X < 140 * S; X += 54) glowPx(X, Y(u1) * S + 9, 0xfff0c8, 0.85);
        for (let X = 40 * S; X < 140 * S; X += 2) if (hashPx(X, 1, 6717) < 0.3) img.px(X, Y(u1) * S + 3, [0xff6a8a, 0xffd868, 0xc8ccd0, 0x6ac0ff][X % 4]);
      },
    });
    k.standing(42, Y(u1) + 3, 96, 2, 28, 6718);
    k.standing(46, Y(u1) + 8, 88, 12, 10, 6719);
    k.strollers(90, u0 + 12, 40, 6, 5);
    for (const x of [44, 90, 136]) k.streetLamp(x, u0 + 2);
  }
  // the transmitter masts: red and white lattice, floodlit, red lights winking at the top and the middle
  const mast = (x, u, h) => {
    const y = Y(u);
    k.reserve(x - 5, y - 3, 11, 5);
    objects.push({
      y: y + 1,
      shadow: () => k.shadowRect(x + 2, y - 3, 12, 4, 0.55),
      draw: () => {
        const CX = x * S;
        const Yb = y * S;
        const H3 = h * S;
        for (let j = 0; j < H3; j++) {
          const half = Math.max(2.4, 12 - (j / H3) * 9.6);
          const band = Math.floor((j / H3) * 7) % 2 ? 0xe84a3a : 0xf8f4ec;
          img.px(CX - half, Yb - j, band);
          img.px(CX - half + 1, Yb - j, scaleColor(band, 0.85));
          img.px(CX + half, Yb - j, scaleColor(band, 0.66));
          if (j % 12 === 0) {
            const h2 = Math.max(2.4, 12 - ((j + 12) / H3) * 9.6);
            img.linePx(CX - half, Yb - j, CX + h2, Yb - j - 12, scaleColor(band, 0.9));
            img.linePx(CX + half, Yb - j, CX - h2, Yb - j - 12, scaleColor(band, 0.7));
            img.linePx(CX - half, Yb - j, CX + half, Yb - j, scaleColor(band, 0.8));
          }
        }
        // the platforms and their dishes
        for (const yy of [Math.round(H3 * 0.6), H3 - 18]) {
          const half = Math.max(2.4, 12 - (yy / H3) * 9.6) + 6;
          for (let i = -half; i <= half; i++) {
            img.px(CX + i, Yb - yy, 0xc8ccd0);
            img.px(CX + i, Yb - yy + 1, 0x5a5e66);
          }
          img.discPx(CX - half, Yb - yy - 2, 3, 0xe8ecec);
          img.discPx(CX - half - 0.6, Yb - yy - 2, 1.8, 0xa8b0b6);
        }
        // the floodlights on it
        for (let j = 12; j < H3; j += 24) glowPx(CX, Yb - j, 0xfff0e0, 0.5);
      },
    });
    const blink = [k.sprite(7, 7, u, (r) => { r.discPx(10, 10, 10, 0xff3020, 0.3); r.discPx(10, 10, 4.5, 0xff5a40, 0.7); r.discPx(10, 10, 2, 0xffd0c0); }, false)];
    kit.loop(x - 3, u + h + 3, blink, { fps: 0.8, seq: [0, 0, -1, -1], fx: 0 });
    kit.loop(x - 3, u + Math.round(h * 0.6) + 3, blink, { fps: 0.8, seq: [-1, -1, 0, 0], fx: 0 });
  };
  mast(18, 6690, 70);
  mast(160, 6712, 86);
  mast(146, 6640, 54);
  // the forest over everything else, up to the ridge: its crowns make the skyline the night view rises behind
  const pals = [CEDAR, OAK, CAMPHOR, CEDAR, OAK, [0x24382a, 0x34503a, 0x48683e, 0x62804a]];
  k.forest(0, W, 5600, RIDGE - 2, pals, 6100, 4.5, 8, (x, u) => !(u > 6600 && u < 6745 && x > 26 && x < 146));
  // grey rock outcrops showing through the trees
  for (let i = 0; i < 26; i++) {
    const x = R.int(6, 174);
    const u = R.int(5720, 6700);
    const y = Y(u);
    if (k.isRes(x, y)) continue;
    k.boulder(x, u, 3 + R() * 4, 2 + R() * 3, i * 37, 0.8);
  }
}
