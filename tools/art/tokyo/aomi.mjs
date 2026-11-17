// The container pier at Aomi (u 12060-12544), at night: where the flight ends and the mech waits.
//   The lot for trucks south of the gate, sheds, the gate with its canopy and booths; the control tower;
//   the quay: a container ship moored along it, two gantry cranes standing over her on their rails, booms out
//     over her deck, floodlights under them;
//   stacks of boxes in every colour, the reefers on their racks with their lamps, the yard marked out in lanes
//     and slots - the middle of it kept clear and flat for the fight;
//   masts of floodlights round the edge, tugs and the pilot's boat in the water.
// Live: the cranes' trolleys lifting boxes off the ship, trucks coming in under the canopy, carriers straddling
// the stacks, tugs, gulls, the ship's and the cranes' lamps.
import { PAL, shade, blend } from './kit.mjs';
import { makeWafu } from './wafu.mjs';
import { makeUmi, containerShip, tug, fishingBoat } from './umi.mjs';
import { hashPx } from '../hires.mjs';
import { ARENAS } from './route.mjs';

const CONT = [0xc0402a, 0x2a6ab0, 0x2e8a5a, 0xe0a030, 0x8a8e96, 0xd8d8d0, 0x6a3a8a, 0xb85a2a, 0x1a7a8a, 0xe86a8a, 0x4a4e58];
const SODIUM = 0xffe0a8;

export function aomi(ctx) {
  const { kit, pave, plot, claim, props, S, L, W } = ctx;
  const { building, tree, crowd, mark, ground, rand, pick, P, R, E, ER, halo, FX, FY, queue, glint, car } = kit;
  kit.setSun(0.1);
  const { lampAt } = makeWafu(ctx);
  const U = makeUmi(ctx);
  const hi = ctx.img.hi;
  const [AX, AU, , AR] = ARENAS.find((a) => a[2] === 'KUROGANE');
  const inArena = (x, u, pad = 0) => Math.hypot(x - AX, u - AU) < AR + pad;
  const drop = (X, Y, w, n = 2) => {
    for (let k = 1; k <= n; k++) for (let i = 0; i < w; i++) hi.tint(X + i + k, Y + k, 0.72);
  };

  /**
   * A stack of boxes on the ground (x, u): n boxes side by side, each 8.67 long (along: 'x' or 'u') by 2.67, as
   * many high as `tiers` (a list, one to a box). Each box: its roof ribbed, and its side toward us showing the
   * boxes under it, doors and ribs.
   */
  const stack = (x, u, n, along, tiers, seed) => {
    const [bl, bw] = along === 'x' ? [26, 8] : [8, 26]; // (fine pixels, across x and up the strip)
    for (let k = 0; k < n; k++) {
      const t = tiers[k % tiers.length];
      const [X, Y] = along === 'x' ? [FX(x), FY(u) - (k + 1) * 9] : [FX(x) + k * 9, FY(u) - 26];
      const fh = t * 5;
      const col = (q) => CONT[Math.floor(hashPx(k * 5 + q, seed, 281) * CONT.length)];
      queue(Y + bw, () => {
        const top = col(t);
        for (let j = 0; j < bw - 0; j++)
          for (let i = 0; i < bl; i++) {
            const rib = along === 'x' ? i % 2 === 0 : j % 2 === 0;
            P(X + i, Y - fh + j, i === 0 || j === 0 ? shade(top, 1.3) : i === bl - 1 || j === bw - 1 ? shade(top, 0.6) : rib ? shade(top, 0.86) : top);
          }
        for (let q = 0; q < t; q++) {
          const c = col(t - 1 - q);
          for (let j = 0; j < 5; j++)
            for (let i = 0; i < bl; i++) {
              const y = Y - fh + bw + q * 5 + j;
              P(X + i, y, j === 4 ? shade(c, 0.5) : i === 0 || i === bl - 1 ? shade(c, 0.7) : along === 'x' && i < 3 ? shade(c, 0.78) : i % 2 ? shade(c, 0.9) : shade(c, 0.78));
            }
        }
      }, () => kit.shadowBox(X, Y - fh, bl, bw + fh, Math.max(2, Math.round(fh * 0.3)), 0.66));
    }
  };

  // ---- south of the gate: the lot where the trucks wait, the sheds, the gate itself
  claim(0, 12064, 172, 36);
  pave(0, 12064, 36, 86, 'apron', 282);
  pave(36, 12064, 132, 36, 'asphalt', 283);
  ground(() => {
    for (let x = 40; x < 136; x += 5) for (let u = 12066; u < 12098; u += 1 / 3) if (Math.abs(u - 12082) > 1.4) P(FX(x), FY(u), 0xd8d4c4);
  });
  for (let k = 0; k < 14; k++) {
    if (rand() < 0.3) continue;
    const [x, u] = [42.5 + (k % 7) * 15, k < 7 ? 12070 : 12088];
    mark(x, u, (X, Y) => {
      const c = pick(CONT);
      drop(X - 4, Y + 1, 9, 2);
      for (let j = 0; j < 26; j++) for (let i = 0; i < 8; i++) P(X - 4 + i, Y - 30 + j, i === 0 || i === 7 ? shade(c, 0.7) : j % 2 ? shade(c, 0.88) : c); // the box on its trailer
      for (let j = 0; j < 6; j++) for (let i = 0; i < 8; i++) P(X - 4 + i, Y - 4 + j, j === 2 ? 0x2c3a4c : 0xe8e8ec); // the cab, its nose down the strip
    });
  }
  building(2, 12068, 32, 26, { face: 5, style: 'plain', wall: 0x9a8e80, roof: 0x6a7a78, s: 2001, lit: 0.3, top: ({ X, Y, w, h, R: rect }) => {
    for (let i = 0; i < w; i += 3) rect(X + i, Y, 1, h, 0x4a5456);
    rect(X, Y + (h >> 1), w, 1, 0xa8b4b2);
  } });
  building(2, 12100, 32, 44, { face: 6, style: 'plain', wall: 0xa0968a, roof: 0x5a6670, s: 2002, lit: 0.3, top: ({ X, Y, w, h, R: rect }) => {
    for (let i = 0; i < w; i += 3) rect(X + i, Y, 1, h, 0x3a4648);
  } });
  for (const x of [8, 20, 30]) lampAt(x, 12096, SODIUM);
  // the gate: a canopy over the road, booths between its lanes, a barrier up
  queue(FY(12096), () => {
    const [X0, Y0] = [FX(160), FY(12110)];
    for (let k = 1; k <= 5; k++) for (let i = 0; i < 60; i++) hi.tint(X0 + i + k, Y0 + 30 + k, 0.75);
    for (let j = 0; j < 22; j++) for (let i = 0; i < 60; i++) (j % 7 === 3 ? E : P)(X0 + i, Y0 + j, j === 0 || i === 0 ? 0xe8eaee : j % 7 === 3 ? 0xf4f8ff : i === 59 ? 0x9aa0a8 : 0xc4c8ce);
    for (let j = 22; j < 30; j++) for (let i = 0; i < 60; i++) P(X0 + i, Y0 + j, j === 29 ? PAL.ink : (i >> 2) % 2 ? 0xe0a030 : 0x2a2a30); // its edge in stripes
    for (const i of [2, 28, 56]) {
      R(X0 + i, Y0 + 30, 3, 12, 0x6a7078);
      ER(X0 + i - 1, Y0 + 32, 5, 4, 0xfff0c8);
    }
  });
  ctx.cover(160, 12096, 20, 14, -0.1);
  halo(FX(170), FY(12096), 40, 16, 0xf4f8ff, 0.3);
  // the control tower
  building(141, 12112, 11, 12, {
    face: 22, style: 'granite', wall: 0xc8ccd0, roof: 0x8a9098, s: 2003, lit: 0.7,
    top: ({ X, Y, w, h, R: rect, E: lit }) => {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) (Math.min(i, j, w - 1 - i, h - 1 - j) < 2 ? lit : rect)(X + i, Y + j, 1, 1, Math.min(i, j, w - 1 - i, h - 1 - j) < 2 ? 0xc8f0ff : 0x6a7078);
      rect(X + (w >> 1), Y - 8, 1, 10, 0xd8dce0);
      lit(X + (w >> 1), Y - 9, 0xff4030);
    },
  });

  // ---- the yard: lanes, slots, numbers; floodlit
  for (const id of ['gantry_1', 'gantry_2', 'kontena_b', 'kontena_r']) {
    const q = plot(id);
    pave(q.x, q.u, q.w, q.h, 'apron', 290);
  }
  ground(() => {
    for (let u = 12102; u < 12498; u += 1 / 3)
      for (let x = 37; x < 180; x += 1 / 3) {
        const [X, Y] = [FX(x), FY(u)];
        if ((x > 43.4 && x < 44.4) || (x > 59.6 && x < 60.6)) continue; // (the crane rails)
        const yl = Math.abs(x - 66) < 0.25 || Math.abs(x - 148) < 0.25 || Math.abs(u - 12166) < 0.25 || Math.abs(u - 12104) < 0.25;
        const slot = Math.floor(x * 3) % 27 === 0 && Math.floor(u) % 10 < 7;
        if (yl && Math.floor((x + u) * 1.5) % 4 < 3) P(X, Y, 0xe0b830);
        else if (slot && x > 70 && x < 144) P(X, Y, 0xc8ccd0);
        else if (hashPx(X >> 3, Y >> 3, 284) < 0.03) P(X, Y, shade(0x7e8286, 0.82)); // stains
      }
    // the quay's edge: fenders, bollards
    for (let u = 12150; u < 12500; u += 1 / 3) {
      const Y = FY(u);
      P(FX(36), Y, 0xd8d4cc);
      P(FX(36) + 1, Y, 0xe0b830);
      if (Math.floor(u) % 12 < 2) R(FX(36) - 3, Y, 3, 1, 0x1c1c22);
      if (Math.floor(u * 3) % 30 === 0) R(FX(37.4), Y - 1, 3, 3, 0x3a3a40);
    }
    // the middle, kept flat: the slots for boxes outlined in rows, arrows down the lanes, covers over the drains,
    // the black arcs the carriers' tyres leave turning
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 6; c++) {
        const [x, u] = [74 + c * 11.6, 12286 + r * 12];
        if (u > 12404) continue;
        for (let i = 0; i < 27; i++) for (const j of [0, 8]) P(FX(x) + i, FY(u) - j, 0xb8bcc4);
        for (let j = 0; j <= 8; j++) for (const i of [0, 26]) P(FX(x) + i, FY(u) - j, 0xb8bcc4);
      }
    for (const x of [68.4, 145.6])
      for (let u = 12180; u < 12480; u += 24) {
        const up = x < 100;
        for (let q = 0; q < 9; q++) P(FX(x), FY(u) - q, 0xe8e8e0);
        for (let q = 1; q <= 3; q++) {
          P(FX(x) - q, FY(u) + (up ? -9 + q : -q), 0xe8e8e0);
          P(FX(x) + q, FY(u) + (up ? -9 + q : -q), 0xe8e8e0);
        }
      }
    for (const [x, u] of [[90, 12340], [70, 12290], [130, 12390], [110, 12200], [80, 12450]]) {
      const [X, Y] = [FX(x), FY(u)];
      for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) if (Math.hypot(i, j) < 3.4) P(X + i, Y + j, (i + j) % 2 ? 0x4a4e54 : 0x5a5e64);
    }
    for (const [cx, cu, r, a0] of [[100, 12320, 16, 0.4], [80, 12370, 22, 2.2], [120, 12260, 14, 3.6]])
      for (let a = a0; a < a0 + 1.4; a += 0.01) {
        P(FX(cx + Math.cos(a) * r), FY(cu + Math.sin(a) * r), 0x5a5e62);
        P(FX(cx + Math.cos(a) * (r + 2.4)), FY(cu + Math.sin(a) * (r + 2.4)), 0x5a5e62);
      }
    // the slot numbers painted at the head of each row
    for (let x = 72; x < 144; x += 9) for (const u of [12170, 12262, 12418]) for (let k = 0; k < 3; k++) for (let j = 0; j < 4; j++) if (hashPx(x, k * 7 + j, u) < 0.6) P(FX(x) + k * 2, FY(u) + j, 0xd8dce0);
  });

  // ---- the stacks
  {
    const p = plot('kontena_b');
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 8; c++) {
        const x = p.x + 1 + c * 9.8;
        const u = p.u + 2 + r * 12;
        stack(x, u, 1, 'x', [1 + Math.floor(hashPx(c, r, 285) * 4)], c * 13 + r);
        stack(x, u + 3.67, 1, 'x', [1 + Math.floor(hashPx(c, r, 286) * 4)], c * 17 + r + 91);
      }
    const q = plot('kontena_r');
    for (let r = 0; r < 34; r++)
      for (const [cx, n] of [[q.x + 0.4, 2], [q.x + 9.6, 2], [q.x + 18.4, 2]]) {
        const u = q.u + 2 + r * 9.3;
        if (u + 9 > q.u + q.h) continue;
        stack(cx, u, n, 'u', [1 + Math.floor(hashPx(cx, r, 287) * 4), 1 + Math.floor(hashPx(cx, r, 288) * 4)], r * 3 + cx);
      }
    // the reefers: a rack of towers with a lamp to every box plugged in
    for (let k = 0; k < 4; k++) {
      const u = 12112 + k * 12;
      if (k % 2) continue;
      mark(141.2, u + 10, (X, Y) => {
        for (let j = 0; j < 30; j++) P(X, Y - j, 0xb8bcc4);
        for (let j = 2; j < 28; j += 4) E(X + 1, Y - j, hashPx(j, k, 289) < 0.7 ? 0x60ff90 : 0xff5040);
      });
    }
  }

  // ---- the ship along the quay, her bow to the north, her lamps on
  {
    const [len, wid] = [810, 84];
    queue(FY(12168), () => U.shipAt(containerShip, FX(4), FY(12168), len, wid, 'n', len, wid, 11));
    for (let u = 12176; u < 12168 + len / S; u += 8) glint(FX(3), FY(u), 12, 0xfff0c8, 0.35);
    halo(FX(18), FY(12200), 60, 40, 0xfff0c8, 0.14);
    // her lines to the bollards
    ground(() => {
      for (const [ua, ub] of [[12176, 12164], [12182, 12196], [12430, 12418], [12436, 12450]]) for (let k = 0; k <= 20; k++) P(Math.round(FX(32) + (FX(37.4) - FX(32)) * k / 20), Math.round(FY(ua) + (FY(ub) - FY(ua)) * k / 20), 0xd8d0b0);
    });
  }

  // ---- the gantry cranes: legs on the rails, the portal, the boom out over the ship, the A-frame and its stays
  const crane = (id, s0) => {
    const p = plot(id);
    const uc = p.u + p.h / 2;
    const Z = 34; // (the boom's height)
    const [XS, XE] = [FX(45), FX(59)];
    const YN = FY(p.u + p.h - 1);
    const YS = FY(p.u + 1);
    const RED = 0xd84030;
    const WHITE = 0xe8ecf0;
    const band = (z) => (Math.floor(z / 6) % 2 ? RED : WHITE);
    queue(YS + 4, () => {
      // the legs: four, the north pair behind
      for (const [Y0, f] of [[YN, 0.8], [YS, 1]])
        for (const X0 of [XS, XE]) {
          for (let j = 0; j < Z * S; j++) for (let i = -2; i <= 2; i++) P(X0 + i, Y0 - j, shade(band(j / S), f * (i < -1 ? 1.15 : i > 1 ? 0.7 : 0.95)));
          R(X0 - 4, Y0 - 1, 9, 3, 0x3a3e46); // its bogie on the rail
          E(X0, Y0 - 12, 0xffd060);
        }
      // the sill beams between the legs, low and high
      for (const z of [8, Z - 3])
        for (const Y0 of [YN, YS]) for (let X = XS; X <= XE; X++) for (let q = 0; q < 3; q++) P(X, Y0 - z * S + q, q ? shade(WHITE, 0.8) : WHITE);
      // the boom: two girders out to the tip over the water, back over the yard; trussed
      const [BX0, BX1] = [FX(0.6), FX(70)];
      for (const [Y0, f] of [[YN, 0.82], [YS, 1]]) {
        const Yb = Y0 - Z * S;
        for (let X = BX0; X < BX1; X++)
          for (let q = 0; q < 6; q++) {
            const m = (X - BX0) % 10;
            const lattice = q === 0 || q === 5 || m === 0 || q === Math.round(m / 2) || q === 5 - Math.round(m / 2);
            if (lattice) P(X, Yb - q, shade(q === 0 ? WHITE : RED, f * (q === 5 ? 1.2 : 1)));
          }
        for (let X = BX0; X < BX1; X += 12) E(X, Yb + 1, 0xfff4d0);
      }
      // the walkways across between the girders, the machinery house over the legs
      for (let X = BX0; X < BX1; X += 18) for (let Y = YN - Z * S; Y < YS - Z * S; Y++) P(X, Y, 0x9aa0a8);
      {
        const [X0, Y0] = [FX(46), YS - Z * S - 6];
        for (let j = 0; j < 22; j++) for (let i = 0; i < 40; i++) P(X0 + i, Y0 - 22 + j, j < 14 ? (j === 0 || i === 0 ? 0xf4f4f0 : i === 39 ? 0xa8acb2 : 0xd8dce0) : j % 4 === 1 && i % 4 ? 0xfff0c8 : 0xc8ccd0);
        for (let i = 2; i < 38; i += 4) E(X0 + i, Y0 - 7, 0xfff0c8);
      }
      // the A-frame over the legs and the stays from its head to the tip and the tail
      const [AXh, AYh] = [FX(52), YS - (Z + 22) * S];
      for (const Y0 of [YN, YS]) {
        const Yb = Y0 - Z * S;
        const line = (x0, y0, x1, y1, c) => {
          const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
          for (let k = 0; k <= n; k++) P(Math.round(x0 + ((x1 - x0) * k) / n), Math.round(y0 + ((y1 - y0) * k) / n), c);
        };
        const Yh = AYh + (Y0 - YS);
        line(XS, Yb - 6, AXh, Yh, RED);
        line(XE, Yb - 6, AXh, Yh, RED);
        line(AXh, Yh, BX0 + 2, Yb - 5, 0xb8bcc4);
        line(AXh, Yh, BX0 + 60, Yb - 5, 0xb8bcc4);
        line(AXh, Yh, BX1 - 2, Yb - 5, 0xb8bcc4);
        ER(AXh - 1, Yh - 2, 3, 2, 0xff3020);
      }
    }, () => {
      for (const Y0 of [YN, YS]) for (const X0 of [XS, XE]) kit.shadowBox(X0 - 2, Y0 - 2, 5, 3, 10, 0.7);
    });
    // floodlights under the boom, their light on the ship's deck and the quay
    for (const x of [6, 20, 34, 50]) halo(FX(x), FY(uc) + 4, 26, 22, 0xf4f0d8, 0.24);
    // the trolley running out along the boom and back, a box hanging under it
    const trolley = kit.frame(5, 6, uc, (put) => {
      for (let j = 0; j < 6; j++) for (let i = 0; i < 12; i++) put(i + 1, j, j === 0 || i === 0 || i === 11 ? 0x8a9098 : 0xd0d4da);
      for (let j = 6; j < 10; j++) put(6, j, 0x5a5e66);
      for (let j = 0; j < 3; j++) for (let i = 0; i < 14; i++) put(i, 10 + j, 0xe0b830); // the spreader
      const c = CONT[s0 % CONT.length];
      for (let j = 0; j < 4; j++) for (let i = 0; i < 14; i++) put(i, 13 + j, j === 3 ? shade(c, 0.6) : i % 2 ? c : shade(c, 0.85));
      put(3, 5, 0xfff0c0);
      put(10, 5, 0xfff0c0);
    }, true);
    const yt = L - (FY(uc) - Z * S - 4) / S;
    props.path([[8, yt], [54, yt]], [trolley], { sp: 6, n: 1, mode: 'pp', hold: 3, turn: 'none', s0: s0 * 0.37, d: 0.2 });
  };
  crane('gantry_1', 1);
  crane('gantry_2', 2);

  // ---- the floodlight masts round the edge of the yard (none in the middle)
  for (const [x, u] of [[64, 12150], [104, 12176], [150, 12166], [64, 12470], [110, 12478], [150, 12470], [38.4, 12300]]) {
    if (inArena(x, u, 2)) continue;
    mark(x, u, (X, Y) => {
      drop(X - 2, Y + 1, 5, 3);
      for (let j = 0; j < 90; j++) P(X, Y - j, j % 2 ? 0x9aa0a8 : 0xb8bcc4);
      for (let i = -5; i <= 5; i++) for (let j = 0; j < 3; j++) E(X + i, Y - 92 + j, j === 1 && i % 2 ? 0xffffff : 0xfff4d8);
    });
    halo(FX(x), FY(u) - 4, 76, 50, 0xfff0d0, 0.15);
    halo(FX(x), FY(u) - 92, 16, 6, 0xffffff, 0.5);
  }

  // ---- what moves: trucks in under the canopy and round under the cranes, carriers over the stacks
  {
    const truckF = (c) =>
      kit.frame(4.67, 2.34, 12200, (put) => {
        for (let j = 0; j < 7; j++) for (let i = 0; i < 10; i++) put(i, j, i === 0 || j === 0 || j === 6 ? shade(c, 0.6) : i % 3 === 0 ? shade(c, 0.85) : c);
        for (let j = 1; j < 6; j++) for (let i = 10; i < 14; i++) put(i, j, i === 12 ? 0x2c3a4c : 0xe8e8ec);
        put(13, 1, 0xf8f0c0);
        put(13, 5, 0xf8f0c0);
      });
    const fs = [0xc0402a, 0x2a6ab0, 0xe0a030, 0x2e8a5a, 0xd8d8d0].map(truckF);
    const loop = [[171, 12098], [171, 12104], [54, 12104], [54, 12240], [49, 12244], [49, 12110], [164, 12110], [168, 12098]];
    props.path(loop, fs, { sp: 9, n: 5, gap: 70, mode: 'wrap', turn: 'rot', cars: 1, d: -0.2 });
    const carrier = kit.frame(4, 4.34, 12300, (put) => {
      for (let j = 0; j < 13; j++) for (const i of [0, 1, 10, 11]) put(i, j, j % 4 === 0 ? 0x3a3a40 : 0xe0b830); // the legs
      for (let j = 0; j < 3; j++) for (let i = 0; i < 12; i++) put(i, j, j === 0 ? 0xf0d050 : 0xd0a020);
      for (let j = 10; j < 13; j++) for (let i = 0; i < 12; i++) put(i, j, 0xd0a020);
      for (let j = 3; j < 10; j++) for (let i = 2; i < 10; i++) put(i, j, j === 3 ? 0x8a2a20 : i % 2 ? 0xc0402a : 0xa83426); // a box carried between its legs
      put(5, 1, 0xfff0c0);
      put(6, 1, 0xff9030);
    }, true);
    const q = plot('kontena_r');
    for (const [x, s0] of [[q.x + 8.4, 0.2], [q.x + 17.6, 0.7]]) props.path([[x, q.u + 6], [x, q.u + q.h - 6]], [carrier], { sp: 5, n: 1, mode: 'pp', hold: 4, turn: 'none', s0, d: 0.1 });
  }

  // ---- on the water: tugs standing by the ship, the pilot's boat, gulls over the quay
  props.wander(80, 12522, 60, 12, [U.shipFrame(tug, 20, 9, 12520)], { n: 2, sp: 2.4, turn: 'rot', fps: 1, idle: 0.6, d: -0.4 });
  props.wander(18, 12512, 12, 18, [U.shipFrame(fishingBoat, 27, 9, 12510)], { n: 1, sp: 2, turn: 'rot', fps: 1, idle: 0.5, d: -0.4 });
  U.buoy(150, 12524, 0x20c050);
  U.buoy(176, 12516, 0xe03028);
  U.gulls(30, 12300, 24, 160, 5);
  U.gulls(130, 12520, 40, 14, 3);
  void tree;
  void crowd;
  void car;
  void building;
  void blend;
}
