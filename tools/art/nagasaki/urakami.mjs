// Urakami and Mount Inasa.
//   The hypocentre: concentric rings of dark stone round the black cenotaph, the surviving wall of Urakami
//   Cathedral, paper-crane garlands. The Peace Park (a quiet stretch: guns held): steps up from the street, the
//   Fountain of Peace with its jets spread like wings, the long axis with the sculptures given by other
//   countries, the black vault of names, the Peace Statue on its pedestal.
//   The crossing: quays and fish sheds, the inner harbour with its boats and the bridge, the north shore road,
//   Inasa-machi, Fuchi Shrine and the ropeway's lower station by the roundabout.
//   Inasa: the driveway's switchbacks with their lamps and lookouts, the ropeway on its towers over a cleared
//   strip, the forest; the summit car park, the ropeway's top station, the round observatory with its roof deck,
//   the transmitter masts with their red lights. Above the ridge the strip is left clear for the night view.
import { rng, fbm } from '../../lib/raster.mjs';
import { rampColor } from '../nature.mjs';
import { C, night, scaleColor } from './canvas.mjs';
import { W, RIDGE, R1_HW, STREETS, uraSouth, uraNorth, B_X, FUCHI, DRIVE, PARK, ROPE, OBS } from './geo.mjs';
import { peaceStatue, pedestal } from './statue.mjs';

const CAMPHOR = [0x1a3422, 0x284a2c, 0x3a6236, 0x527c44];
const ZELKOVA = [0x22381e, 0x304c28, 0x426434, 0x5a7c42];
const CEDAR = Object.assign([0x10221c, 0x1a3428, 0x264634, 0x386048], { kind: 'cedar' });
const OAK = [0x14281c, 0x1e3a24, 0x2c4e2e, 0x40663a];
const CRANES = [0xff6a6a, 0xffa848, 0xffe068, 0x8ee878, 0x6ac0ff, 0xb898ff, 0xff94cc, 0xffffff];

export function paintUrakami(k) {
  const { img, Y, kit, objects, glow, pool } = k;
  const R = rng(1945);

  // ---- the hypocentre park
  {
    const cx = 80;
    const cu = 4715;
    const cy = Y(cu);
    for (let y = cy - 47; y <= cy + 47; y++)
      for (let x = cx - 48; x <= cx + 48; x++) {
        const d = Math.hypot(x + 0.5 - cx, (y + 0.5 - cy) * 1.0);
        if (d > 46 || k.isRes(x, y)) continue;
        let c;
        if (d > 43) c = rampColor(C.grass, 0.4 + fbm(x, y, { seed: 4701, scale: 3 }) * 0.4, x, y);
        else {
          const ring = Math.floor(d / 4);
          c = ring % 2 ? 0x3a3c40 : 0x6a6a68;
          if (d < 8) c = 0x2a2c30;
          if (Math.abs(d - 18) < 0.6 || Math.abs(d - 34) < 0.6) c = 0xa8a8a0;
        }
        img.set(x, y, c);
      }
    k.reserve(cx - 46, cy - 46, 92, 92);
    // the black cenotaph at the centre, paper-crane garlands at its foot
    objects.push({
      y: cy + 3,
      shadow: () => k.shadowRect(cx + 1, cy - 2, 6, 4, 0.5),
      draw: () => {
        img.rect(cx - 4, cy - 1, 9, 4, 0x4a4c50);
        img.rect(cx - 4, cy - 1, 9, 1, 0x7a7c80);
        img.rect(cx - 2, cy - 20, 5, 19, 0x14161a);
        img.rect(cx - 2, cy - 20, 1, 19, 0x4a4e56);
        img.rect(cx + 2, cy - 20, 1, 19, 0x0a0a0c);
        img.set(cx, cy - 21, 0x2a2c30);
        for (let i = 0; i < 18; i++) img.set(cx - 7 + (i % 15), cy + 4 + Math.floor(i / 15), CRANES[i % CRANES.length]);
        pool(cx, cy, 10, 0xfff0d0, 0.1 + night(cu) * 0.15);
      },
    });
    // the surviving wall of Urakami Cathedral: brick and stone, an arched window, two saints in niches
    objects.push({
      y: Y(4724),
      shadow: () => k.shadowRect(118, Y(4724) - 16, 18, 18, 0.5),
      draw: () => {
        const y = Y(4724);
        for (let yy = y - 18; yy < y; yy++)
          for (let x = 114; x < 132; x++) {
            const stone = (yy - y) % 4 === 0 || (x + Math.floor((yy - y) / 4) * 3) % 6 === 0;
            img.set(x, yy, stone ? 0x5a4a40 : (x < 116 ? 0xb88a6a : 0x9a6e54));
          }
        for (let x = 114; x < 132; x++) if ((x * 7) % 5 < 2) img.set(x, y - 19, 0x8a6a54);
        img.rect(120, y - 14, 6, 10, 0x1a1418);
        img.rect(121, y - 15, 4, 1, 0x1a1418);
        for (const nx of [116, 128]) {
          img.rect(nx, y - 12, 2, 6, 0x3a3030);
          img.rect(nx, y - 11, 2, 4, 0xc8c0b0);
        }
      },
    });
    k.reserve(113, Y(4724) - 20, 20, 22);
    k.grove(0, 152, 4660, 4770, 20, [ZELKOVA, CAMPHOR], 4660, 4, 6);
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) k.streetLamp(Math.round(cx + Math.cos(a) * 44), Math.round(cu + Math.sin(a) * 44), 0xfff4d8, 5);
    k.strollers(cx, cu, 30, 30, 6, { cols: [0x2a2a34, 0x3a3a4a, 0xe8e8f0, 0x5a5a6a] });
  }

  // ---- the Peace Park
  {
    const AX = 90;
    // steps up from the street, then the paved axis to the statue
    for (let u = 4786; u < 4798; u++) for (let x = AX - 22; x < AX + 22; x++) img.set(x, Y(u), u % 2 ? C.granite[3] : C.granite[1]);
    for (let u = 4798; u < 5004; u++)
      for (let x = 46; x < 134; x++) {
        const y = Y(u);
        let c = rampColor(C.paving, 0.45 + fbm(x, y, { seed: 4801, scale: 3 }) * 0.35, x, y);
        if ((x - 46) % 8 === 0 || (u - 4798) % 8 === 0) c = scaleColor(c, 0.88);
        img.set(x, y, c);
      }
    k.reserve(46, Y(5004), 88, 220);
    // the Fountain of Peace: an oval basin, jets spreading like a dove's wings
    const fy = Y(4818);
    k.shadowEllipse(AX + 2, fy + 2, 31, 13, 0.7);
    img.ellipse(AX, fy, 31, 13, C.granite[4]);
    img.ellipse(AX, fy, 29, 11, C.granite[2]);
    img.ellipse(AX, fy, 28, 10, 0x1e5a6a);
    img.ellipse(AX - 4, fy - 2, 18, 5, 0x2a7080);
    for (let a = 0; a < Math.PI * 2; a += 0.3) img.set(Math.round(AX + Math.cos(a) * 24), Math.round(fy + Math.sin(a) * 8), 0x6aa8b8);
    const wings = [0, 1, 2].map((f) =>
      k.sprite(62, 30, 4818, (r) => {
        for (const side of [-1, 1])
          for (let q = 0; q < 9; q++) {
            const len = 8 + q * 2.4 + f;
            const ang = -Math.PI / 2 + side * (0.25 + q * 0.13);
            const x0 = 31 + side * (2 + q * 1.6);
            const y0 = 26;
            for (let t = 0; t < len; t++) {
              const x = x0 + Math.cos(ang) * t * 1.15;
              const y = y0 + Math.sin(ang) * t * (1 - t / (len * 2.6));
              r.set(Math.round(x), Math.round(y), t > len - 3 ? 0xffffff : 0xb8e4ec, 0.55 + (t / len) * 0.35);
            }
          }
        for (let x = 6; x < 56; x += 2) r.set(x + f, 27 + ((x + f) % 3), 0xe8f8ff, 0.6);
      }, false),
    );
    kit.loop(AX - 31, 4836, wings, { fps: 4 });
    for (let x = AX - 26; x < AX + 26; x += 6) pool(x, fy, 6, 0x8ad0ff, 0.06 + night(4818) * 0.18);
    // the sculptures given by other countries along the sides, on their plinths
    const plinth = (x, u, kind) => {
      const y = Y(u);
      objects.push({
        y: y + 1,
        shadow: () => k.shadowRect(x + 1, y - 10, 8, 10, 0.55),
        draw: () => {
          img.rect(x - 3, y - 4, 7, 5, C.granite[3]);
          img.rect(x - 3, y - 4, 7, 1, C.granite[4]);
          const b = kind % 3 === 0 ? [0x3a5a5a, 0x5a8a86] : kind % 3 === 1 ? [0x8a8a86, 0xc8c8c0] : [0x5a4a3a, 0x8a7258];
          if (kind % 2) {
            img.rect(x - 1, y - 12, 3, 8, b[0]);
            img.rect(x - 1, y - 12, 1, 8, b[1]);
            img.disc(x, y - 14, 2, b[0]);
            img.set(x - 1, y - 15, b[1]);
          } else {
            img.disc(x, y - 9, 3.5, b[0]);
            img.disc(x - 1, y - 10, 2, b[1]);
            img.rect(x - 1, y - 6, 3, 2, b[0]);
          }
        },
      });
    };
    let n = 0;
    for (let u = 4856; u < 4990; u += 34) {
      plinth(56, u, n++);
      plinth(124, u + 17, n++);
    }
    // the tree rows and flower beds either side, lamps along the axis
    for (let u = 4800; u < 5000; u += 18) {
      k.tree(40, Y(u), 5, ZELKOVA, u);
      k.tree(140, Y(u + 9), 5, ZELKOVA, u + 1);
    }
    for (const x of [48, 128]) for (let u = 4846; u < 4996; u += 3) for (let i = 0; i < 4; i++) img.set(x + i, Y(u), R() < 0.4 ? 0x2e5032 : R.pick([0xe8e0e8, 0xf4b0c0, 0xd85a7a, 0xf8e070]));
    for (let u = 4850; u < 5000; u += 30) {
      k.streetLamp(66, u, 0xfff4d8, 6);
      k.streetLamp(114, u, 0xfff4d8, 6);
    }
    // the black vault of names, flowers and paper cranes laid before it
    const vy = Y(5000);
    objects.push({
      y: vy + 1,
      shadow: () => k.shadowRect(AX - 5, vy - 4, 14, 6, 0.5),
      draw: () => {
        img.rect(AX - 7, vy - 4, 14, 5, 0x16181c);
        img.rect(AX - 7, vy - 5, 14, 1, 0x4a4e56);
        img.rect(AX - 6, vy - 3, 1, 3, 0x3a3e46);
        for (let i = 0; i < 26; i++) img.set(AX - 12 + (i % 24), vy + 2 + Math.floor(i / 24), i % 3 ? CRANES[i % CRANES.length] : 0xf4f0e8);
        pool(AX, vy, 9, 0xfff4e0, 0.12 + night(5000) * 0.15);
      },
    });
    // the statue on its pedestal, floodlit
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
        pool(AX - 20, seatY + 20, 14, 0xd8f0ff, 0.12 + night(5028) * 0.15);
        pool(AX + 20, seatY + 20, 14, 0xd8f0ff, 0.12 + night(5028) * 0.15);
        glow(AX - 14, seatY - 61, 0xe8fff8, 0.5);
      },
    });
    // a crescent of trees behind it
    for (let a = 0.15; a < Math.PI - 0.1; a += 0.22) k.tree(AX + Math.cos(a) * 52, Y(5040 + Math.sin(a) * 52), 6, CAMPHOR, Math.round(a * 100));
    k.grove(0, 152, 4790, 5100, 28, [ZELKOVA, CAMPHOR], 4790, 4, 6);
    k.crowd(AX - 20, Y(4996), 40, 8, 12, [0x2a2a34, 0x3a3a4a, 0xe8e8f0, 0x2a3a6a, 0x5a5a6a]);
    k.strollers(AX, 4900, 30, 70, 8, { cols: [0x2a2a34, 0x3a3a4a, 0xe8e8f0, 0x2a3a6a, 0xd8d0c0] });
  }
  // the east verge along R1 north of Suwa
  for (let u = 4655; u < 5105; u += 22) if (!k.anyRes(174, Y(u + 8), 6, 8)) k.tree(177, Y(u + 9), 3.5, CAMPHOR, u);

  // ---- the crossing: quays and sheds, the inner harbour, the bridge, the north shore
  for (let x = 0; x < W; x++) {
    const s = Math.round(uraSouth(x));
    for (let u = 5121; u < s; u++) if (!k.isRes(x, Y(u))) img.set(x, Y(u), rampColor(C.quay, 0.4 + fbm(x, u, { seed: 5120, scale: 5 }) * 0.4, x, Y(u)));
  }
  for (const [x, w, h] of [[4, 30, 24], [40, 22, 20], [92, 36, 26], [134, 14, 18]]) {
    const foot = Math.round(Math.min(uraSouth(x), uraSouth(x + w)) - 8);
    if (foot - h > 5122) k.slab(x, Y(foot), w, Math.round(h * 0.6), Math.round(h * 0.4), { roofC: R.pick([0x6a7680, 0x7a6a5a, 0x5a6a74]), wall: R.pick([0xb8b8b0, 0xa8a49a]) });
  }
  // fishing boats moored along the south quay, bow out, lights on
  for (let x = 8; x < 170; x += 13) {
    if (Math.abs(x - B_X) < 12) continue;
    const y = Y(Math.round(uraSouth(x)) + 4);
    if (!k.wet(x + 2, y + 6)) continue;
    objects.push({
      y: y + 14,
      shadow: () => k.shadowRect(x + 2, y + 2, 6, 13, 0.5),
      draw: () => {
        k.poly([[x, y], [x + 6, y], [x + 6, y + 9], [x + 3, y + 13], [x, y + 9]], 0x1a1e24);
        k.poly([[x + 1, y + 1], [x + 5, y + 1], [x + 5, y + 9], [x + 3, y + 12], [x + 1, y + 9]], R.pick([0xe8e8e0, 0x3a6a9a, 0xd8d0b8]));
        img.rect(x + 2, y + 2, 2, 3, 0xe8e8e0);
        img.rect(x + 2, y + 2, 2, 1, 0x3a3e46);
        img.rect(x + 3, y + 5, 1, 4, 0x5a5e66);
        glow(x + 3, y + 4, C.warm, 0.5 + night(5200) * 0.4);
      },
    });
  }
  // the harbour bridge: a frame of its own (boats go under), concrete piers in the water
  {
    const u0 = Math.floor(uraSouth(B_X)) - 4;
    const u1 = Math.ceil(uraNorth(B_X)) + 4;
    const x0 = B_X - 8;
    const deck = k.capture(x0, Y(u1), 17, u1 - u0, () => {
      for (let u = u0; u < u1; u++)
        for (let x = x0; x < x0 + 17; x++) {
          const a = Math.abs(x + 0.5 - B_X);
          const y = Y(u);
          let c;
          if (a > 7) c = 0xd8dad8;
          else if (a > 6) c = 0x8a8e94;
          else c = rampColor(C.asphalt, fbm(x, y, { seed: 31, scale: 4 }), x, y);
          if (a < 0.6 && u % 6 < 3) c = 0xdad6c8;
          img.set(x, y, c);
        }
      for (let u = u0 + 6; u < u1; u += 24) {
        for (const lx of [x0, x0 + 16]) {
          img.set(lx, Y(u), 0x3a3e46);
          glow(lx, Y(u) - 1, 0xfff0c8, 0.9);
        }
        pool(B_X, Y(u), 8, C.lamp, 0.1 + night(5300) * 0.2);
      }
    }, 5300);
    kit.loop(x0, u1, [deck], { d: 0.04 });
    for (let u = u0 + 20; u < u1 - 10; u += 40) {
      img.ellipse(B_X, Y(u), 6, 2, C.concrete[2]);
      img.ellipse(B_X + 1, Y(u) + 2, 6, 2, 0x061420, 0.4);
    }
    for (let u = u0; u < u1; u++) for (let x = B_X + 9; x < B_X + 13; x++) if (k.wet(x, Y(u))) img.set(x, Y(u), 0x061420, 0.3);
    k.reserve(x0, Y(u1), 17, u1 - u0);
  }
  // the north shore: quay, Inasa-machi's houses climbing towards the roundabout
  for (let x = 0; x < W; x++) {
    const n = Math.round(uraNorth(x));
    for (let u = n; u < 5452; u++) if (!k.isRes(x, Y(u))) img.set(x, Y(u), rampColor(C.quay, 0.45 + fbm(x, u, { seed: 5424, scale: 5 }) * 0.35, x, Y(u)));
  }
  k.block(0, 180, 5466, 5584, () => (R() < 0.8 ? 'jp' : 'block'), { rowH: 22, w: [10, 16] });
  k.grove(0, 180, 5466, 5600, 24, [CAMPHOR, OAK], 5466, 3, 5);
  // Fuchi Shrine by the roundabout: torii, lanterns, the hall in its grove, a path to it
  {
    k.road([[FUCHI.x - FUCHI.r - 2, FUCHI.u], [44, FUCHI.u], [36, 5612]], 2, { side: 0, surface: C.paving });
    const y = Y(5612);
    objects.push({
      y: y + 1,
      draw: () => {
        img.rect(29, y - 12, 2, 13, C.vermilion[2]);
        img.rect(42, y - 12, 2, 13, C.vermilion[2]);
        img.rect(26, y - 14, 21, 2, 0x2a2026);
        img.rect(28, y - 10, 17, 1, C.vermilion[2]);
      },
    });
    k.house(20, Y(5650), 32, 16, 10, 'jp', { wall: 0xe8e0d0, ramp: C.copper, roof: { gable: 'kara', gw: 12 }, door: true });
    k.stoneLantern(26, 5620);
    k.stoneLantern(48, 5620);
  }
  // the ropeway's lower station: a glazed hall the cables come out of
  {
    k.road([[FUCHI.x + FUCHI.r + 2, FUCHI.u], [104, FUCHI.u], [110, 5618]], 2, { side: 0, surface: C.paving });
    k.slab(98, Y(5652), 36, 18, 14, { roofC: 0x6a7076, wall: 0xc8d0d4, extra: (by) => { for (let x = 100; x < 132; x += 2) img.rect(x, by - 12, 1, 9, 0x8ab4c8); } });
  }
}

export function paintInasa(k) {
  const { img, Y, kit, objects, glow, pool } = k;
  const R = rng(333);
  // the cleared strip under the ropeway, then the line itself: two cables, two lattice towers
  const [lx, lu] = ROPE.lower;
  const [ux, uu] = ROPE.upper;
  const ropeAt = (t) => [lx + (ux - lx) * t, lu + (uu - lu) * t];
  for (let u = lu; u < uu; u++) {
    const t = (u - lu) / (uu - lu);
    const [x] = ropeAt(t);
    for (let dx = -7; dx <= 7; dx++) {
      const xx = Math.round(x + dx);
      const y = Y(u);
      if (k.isRes(xx, y)) continue;
      img.set(xx, y, rampColor(C.moss, 0.25 + fbm(xx, u, { seed: 6001, scale: 3 }) * 0.5, xx, y));
    }
  }
  for (const t of ROPE.towers) {
    const [x, u] = ropeAt(t);
    const y = Y(u);
    objects.push({
      y: y + 1,
      shadow: () => k.shadowRect(Math.round(x) + 2, y - 4, 10, 5, 0.55),
      draw: () => {
        for (const s of [-1, 1]) img.line(x + s * 4, y, x + s * 2, y - 22, 0x8a96a0);
        for (let yy = y; yy > y - 22; yy -= 4) img.line(x - 4 + (y - yy) / 11, yy, x + 2 - (y - yy) / 11, yy - 4, 0x5a6670);
        img.rect(Math.round(x) - 6, y - 24, 13, 2, 0xa8b4bc);
        glow(x - 6, y - 25, 0xff4030, 0.9);
        glow(x + 6, y - 25, 0xff4030, 0.9);
      },
    });
  }
  // the cables, drawn over everything else on the strip (they run above the trees)
  objects.push({
    y: Y(uu) + 99999,
    draw: () => {
      for (const off of [-2.5, 2.5]) {
        for (let u = lu; u < uu; u++) {
          const t = (u - lu) / (uu - lu);
          const sag = Math.sin(t * Math.PI * 3) * 1.5;
          const [x] = ropeAt(t);
          img.set(Math.round(x + off + sag * 0.2), Y(u), 0xa8b0b8, 0.85);
        }
      }
    },
  });
  // gondolas, one up while the other comes down
  const cabin = [0, 1].map((f) =>
    k.sprite(11, 14, 6200, (r) => {
      r.line(5, 0, 5, 3, 0xc8ccd0);
      r.rect(1, 3, 9, 9, 0x2a2e36);
      r.rect(2, 4, 7, 7, 0xd8e0e4);
      r.rect(2, 5, 7, 4, f ? 0xffd890 : 0x8ac0d8);
      r.rect(2, 10, 7, 1, 0xc83a30);
      r.set(3, 6, 0xffffff);
    }, false),
  );
  for (const [off, s0] of [[-2.5, 0], [2.5, 0.5]]) kit.path([[lx + off, lu + 4], [ux + off, uu - 6]], [cabin[0], cabin[1]], { sp: 9, mode: 'pp', hold: 6, turn: 'none', fps: 0.5, s0, d: 0.7 });

  // the stations at the top: the ropeway's summit station, the round observatory, the paths between them
  k.slab(68, Y(6634), 30, 18, 12, { roofC: 0x5a6068, wall: 0xc8d0d4, extra: (by) => { for (let x = 70; x < 96; x += 2) img.rect(x, by - 10, 1, 7, 0x8ab4c8); } });
  k.road([[82, 6600], [82, 6604]], 2, { side: 0, surface: C.paving });
  k.road([[98, 6618], [106, 6630], [110, OBS.u - 26]], 2, { side: 0, surface: C.paving });
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
        const topC = footY - wall - ry;
        // the glazed drum: lit from inside, mullions every few pixels
        for (let x = -rx; x <= rx; x++) {
          const e = Math.sqrt(Math.max(0, 1 - (x / rx) ** 2)) * ry;
          for (let j = 0; j < wall; j++) {
            const yy = Math.round(topC + e + j);
            const shade = 1 - (x + rx) / (rx * 2) * 0.35;
            let c = (cx + x) % 3 === 0 ? 0x4a5662 : j < 2 ? 0x2a3440 : scaleColor(0xffd890, shade * (0.55 + night(OBS.u) * 0.45));
            img.set(cx + x, yy, c);
            if ((cx + x) % 3 && j > 2 && j < wall - 1 && (x + j) % 2 === 0) glow(cx + x, yy, 0xffe0a0, 0.25 + night(OBS.u) * 0.3);
          }
        }
        // the roof deck: pale paving in rings, a railing round the rim, people looking at the view
        for (let y = -ry; y <= ry; y++)
          for (let x = -rx; x <= rx; x++) {
            const d = (x / rx) ** 2 + (y / ry) ** 2;
            if (d > 1) continue;
            let c = rampColor(C.concrete, 0.55 + fbm(x, y, { seed: 6668, scale: 2 }) * 0.25 - y / ry * 0.1, cx + x, topC + y);
            if (d > 0.86) c = 0xe8ecec;
            else if (Math.abs(Math.sqrt(d) - 0.55) < 0.05) c = 0x9aa4aa;
            img.set(cx + x, topC + y, c);
          }
        img.ellipse(cx, topC, 5, 3, 0x6a7a86);
        img.ellipse(cx, topC - 1, 4, 2, 0x9ab4c4);
        for (let a = 0; a < Math.PI * 2; a += 0.35) glow(cx + Math.cos(a) * (rx - 1), topC + Math.sin(a) * (ry - 1), 0xd8f0ff, 0.6);
        for (let i = 0; i < 14; i++) {
          const a = R() * Math.PI * 2;
          const x = Math.round(cx + Math.cos(a) * (rx - 4));
          const y = Math.round(topC + Math.sin(a) * (ry - 3));
          img.set(x, y, R.pick([0xe8e8f0, 0x3a3a4a, 0xd04040, 0x3a6ad0]));
          img.set(x, y - 1, 0x2a2024);
        }
      },
    });
  }
  // the transmitter masts: red and white lattice, red lights winking at the top and the middle
  const mast = (x, u, h) => {
    const y = Y(u);
    objects.push({
      y: y + 1,
      shadow: () => k.shadowRect(x + 2, y - 3, 12, 4, 0.55),
      draw: () => {
        for (let j = 0; j < h; j++) {
          const half = Math.max(1, Math.round(4 - (j / h) * 3));
          const band = Math.floor((j / h) * 7) % 2 ? 0xd83a2a : 0xf0ece4;
          img.set(x - half, y - j, band);
          img.set(x + half, y - j, scaleColor(band, 0.7));
          if (j % 4 === 0) img.line(x - half, y - j, x + half, y - j - 3, scaleColor(band, 0.85));
        }
        img.rect(x - 5, y - Math.round(h * 0.6), 11, 1, 0x8a8e94);
        img.rect(x - 4, y - h + 6, 9, 1, 0x8a8e94);
      },
    });
    const blink = [k.sprite(7, 7, u, (r) => { r.disc(3, 3, 3.2, 0xff3020, 0.45); r.disc(3, 3, 1.4, 0xffd0c0); }, false)];
    kit.loop(x - 3, u + h + 3, blink, { fps: 0.8, seq: [0, 0, -1, -1], fx: 0 });
    kit.loop(x - 3, u + Math.round(h * 0.6) + 3, blink, { fps: 0.8, seq: [-1, -1, 0, 0], fx: 0 });
  };
  mast(18, 6690, 70);
  mast(160, 6712, 86);
  mast(146, 6640, 54);
  // lamps along the driveway, a lookout terrace at two of the hairpins
  for (let i = 1; i < DRIVE.length - 1; i += 2) {
    const [x, u] = DRIVE[i];
    const [x2, u2] = DRIVE[i + 1];
    const nx = -(u2 - u);
    const nu = x2 - x;
    const n = Math.hypot(nx, nu) || 1;
    const px = Math.round(x + (nx / n) * 7);
    const pu = Math.round(u + (nu / n) * 7);
    if (px > 2 && px < W - 2 && !k.isRes(px, Y(pu))) k.streetLamp(px, pu, 0xfff0c8, 6);
  }
  for (const [x, u] of [[16, 5770], [168, 5962], [16, 6120], [164, 6300]]) {
    for (let j = 0; j < 12; j++) for (let i = 0; i < 9; i++) if (!k.isRes(x - 4 + i, Y(u - 6 + j))) img.set(x - 4 + i, Y(u - 6 + j), C.paving[1 + ((i + j) % 2)]);
    for (let j = 0; j < 12; j++) img.set(x + (x < 90 ? -5 : 5), Y(u - 6 + j), 0xc8c4b8);
    k.reserve(x - 5, Y(u + 6), 11, 13);
  }
  // the forest over everything else, up to the ridge: its crowns make the skyline the night view rises behind
  const pals = [CEDAR, OAK, CAMPHOR, CEDAR];
  k.forest(0, W, 5600, RIDGE - 2, pals, 6100, 4.5, 8, (x, u) => !(u > 6550 && u < 6700 && x > 26 && x < 138));
  // a few grey rock outcrops showing through the trees
  for (let i = 0; i < 18; i++) {
    const x = R.int(4, 176);
    const u = R.int(5720, 6700);
    const y = Y(u);
    if (k.isRes(x, y)) continue;
    img.ellipse(x, y, 3 + R() * 2, 2, C.rock[2]);
    img.set(x - 1, y - 1, C.rock[4]);
  }
}
