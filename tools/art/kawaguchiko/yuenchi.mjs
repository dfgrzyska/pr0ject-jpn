// The amusement park at the town's end (u 782-992, docs/plan-kawaguchiko.md): Fujiyoshida has a great one by the
// local line, under the mountain, with record-breaking coasters. Ours is of its own, nothing of that park's rides,
// names or signs: on the east side of the tracks, the gate on Honcho-dori and a hyper coaster, its lift hill climbing
// the whole length of the lot, the first drop sweeping round, a run of camelback hills down the far side and back
// into its station, a train going round; the haunted hospital inside its loop, a concrete ward gone to ruin; a food
// court. Over the tracks by a footbridge, the west side: a Ferris wheel, the swinging ship, a carousel, tea cups and
// a drop tower. Crowds everywhere, flower beds, a fence round it all. Seen from above the way the strip is drawn: what
// stands tall rises up the screen, a shadow to the lower right; the coaster's track with its supports, its shadow on
// the ground thrown the same way.
import { PAL, shade } from '../tokyo/kit.mjs';
import { hashPx } from '../hires.mjs';

const TAU = Math.PI * 2;

export function yuenchi(ctx) {
  const { kit, pave, plot, props, S } = ctx;
  const { building, tree, crowd, mark, ground, P, R, E, FX, FY, queue, hi, halo, parasol } = kit;
  const drop = (X, Y, w, n = 2) => {
    for (let k = 1; k <= n; k++) for (let i = 0; i < w; i++) hi.tint(X + i + k, Y + k, 0.72);
  };
  const disc = (X, Y, r, col, ry = r) => {
    for (let j = -ry; j <= ry; j++) for (let i = -r; i <= r; i++) if (Math.hypot(i / r, j / ry) <= 1.02) P(X + i, Y + j, col(i, j, Math.hypot(i / r, j / ry)));
  };
  const east = plot('yuenchi');
  const west = plot('yuenchi_nishi');

  // ---------------------------------------------------------------- the ground: tiles in two colours, flower beds, the fence
  for (const p of [east, west]) {
    pave(p.x, p.u, p.w, p.h, 'plaza', 811);
    ground(() => {
      for (let u = p.u + 1; u < p.u + p.h - 1; u += 1 / S)
        for (let x = p.x + 1; x < p.x + p.w - 1; x += 1 / S) {
          const [X, Y] = [FX(x), FY(u)];
          if ((Math.floor(X / 6) + Math.floor(Y / 6)) % 2 === 0) P(X, Y, hashPx(X, Y, 812) < 0.5 ? 0xd0b8a8 : 0xc8b0a0);
        }
      // the fence: white posts and blue panels round the lot
      for (let i = 0; i < p.w * S; i++) for (const u of [p.u + 1 / S, p.u + p.h]) P(FX(p.x) + i, FY(u), i % 3 ? 0x3a6a9a : 0xf4f0e8);
      for (let j = 0; j < p.h * S; j++) for (const x of [p.x, p.x + p.w - 1 / S]) P(FX(x), FY(p.u + p.h) + j, j % 3 ? 0x3a6a9a : 0xf4f0e8);
    });
  }
  const bed = (x, u, w, h, seed) =>
    ground(() => {
      for (let j = 0; j < h * S; j++)
        for (let i = 0; i < w * S; i++) {
          const edge = Math.min(i, j, w * S - 1 - i, h * S - 1 - j) === 0;
          P(FX(x) + i, FY(u + h) + j, edge ? 0x8a8a84 : hashPx(i, j, seed) < 0.32 ? [0xf06088, 0xf0c020, 0xf4f0e8, 0xe8603a][(i * 3 + j) % 4] : 0x4a8a48);
        }
    });
  for (const [x, u, w, h, k] of [[2, 828, 10, 4, 1], [22, 828, 9, 4, 2], [3, 896, 6, 8, 3], [48, 940, 7, 4, 4], [74, 960, 7, 4, 5], [2, 984, 12, 4, 6]]) bed(x, u, w, h, 820 + k);

  // ---------------------------------------------------------------- the gate on Honcho-dori
  mark(east.x + east.w - 1, 800, (X, Y) => {
    drop(X - 2, Y + 1, 4, 3);
    drop(X - 2, Y - 35, 4, 3);
    for (const dy of [0, -36]) {
      R(X - 3, Y + dy - 22, 5, 22, 0xe84a70); // its two towers, striped
      for (let q = 0; q < 22; q += 4) R(X - 3, Y + dy - 22 + q, 5, 2, 0xf4f0e8);
      R(X - 4, Y + dy - 26, 7, 4, 0x2a5a9a);
      E(X - 1, Y + dy - 27, 0xffe080);
    }
    // the arch over the way in, a board of coloured stars (no words on it)
    for (let j = -32; j <= -4; j++) {
      R(X - 6, Y + j - 22, 8, 1, j % 6 === 0 ? 0xf0c020 : 0x2a5a9a);
    }
    for (let k = 0; k < 5; k++) E(X - 3, Y - 30 - k * 6 - 22, [0xff5060, 0xffe040, 0x60d0ff, 0x80f080, 0xffa0e0][k]);
  });
  crowd(74, 796, 8, 14, 16);

  // ---------------------------------------------------------------- the coaster
  // its track as [x, u, z]: z the height in game pixels, drawn up the screen. Out of the station north, up the lift
  // hill along the lot's west edge, over the top and down the first drop swinging east, then south over three
  // camelbacks shrinking down the east edge, round and back into the station.
  const TRACK = [
    [52, 792, 1], [52, 806, 1], [52, 818, 2], [52, 860, 18], [52, 910, 36], [53, 930, 42], [56, 944, 44], [62, 952, 43],
    [70, 951, 36], [76, 942, 14], [78, 930, 4], [78, 916, 6], [78, 904, 22], [78, 892, 6], [78, 880, 4], [78, 870, 16],
    [78, 860, 4], [78, 850, 3], [78, 842, 10], [78, 834, 3], [76, 822, 3], [70, 812, 5], [62, 806, 4], [57, 798, 2], [53, 790, 1], [52, 792, 1],
  ];
  // sampled finely: each fine step its place on the ground and in the air
  const steps = [];
  for (let s = 0; s + 1 < TRACK.length; s++) {
    const [a, b] = [TRACK[s], TRACK[s + 1]];
    const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * S * 1.6) + 1;
    for (let k = 0; k < n; k++) {
      const t = k / n;
      // (the height eased along each piece, so the hills round over and the drops steepen)
      const e = t * t * (3 - 2 * t);
      steps.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * e]);
    }
  }
  // its shadow on the ground (the sun on the upper left: thrown down and to the right as far as it is high)
  ground(() => {
    for (const [x, u, z] of steps) {
      const [X, Y] = [FX(x) + Math.round(z * 0.5 * S * 0.5), FY(u) + Math.round(z * 0.35 * S * 0.5)];
      for (let i = -2; i <= 2; i++) hi.tint(X + i, Y, 0.8);
    }
  });
  // the track itself, piece by piece in its place among what stands round it: supports down to their feet, the two
  // rails and the ties between them in red, the steel of the supports white
  for (let s = 0; s + 1 < TRACK.length; s++) {
    const [a, b] = [TRACK[s], TRACK[s + 1]];
    const own = steps.filter(([x, u]) => {
      const t = ((x - a[0]) * (b[0] - a[0]) + (u - a[1]) * (b[1] - a[1])) / ((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2 || 1);
      return t >= 0 && t <= 1 && Math.abs((x - a[0]) * (b[1] - a[1]) - (u - a[1]) * (b[0] - a[0])) < 0.2;
    });
    queue(FY(Math.min(a[1], b[1])) + 2, () => {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const [nx, ny] = [-(b[1] - a[1]) / len, (b[0] - a[0]) / len];
      own.forEach(([x, u, z], k) => {
        const [X, Y] = [FX(x), FY(u) - Math.round(z * S)];
        // a support every so often: a column down to the ground (on the tall parts a lattice of two legs)
        if (z > 1.5 && k % 14 === 0) {
          const foot = FY(u);
          const tall = z > 14;
          for (let y = Y + 2; y <= foot; y++) {
            P(X, y, tall ? 0xc8ccd4 : 0xb8bcc4);
            if (tall) {
              P(X + 3, y, 0x9aa0aa);
              if ((y - Y) % 9 < 4) P(X + 1 + ((y - Y) % 9 > 1 ? 1 : 0), y, 0xb0b6c0); // its bracing, zigzag between the legs
            }
          }
          drop(X - 1, foot, tall ? 5 : 3);
        }
        for (const q of [-1, 1]) P(Math.round(X + nx * q * 2), Math.round(Y - ny * q * 2), q < 0 ? 0xf05040 : 0xb02a24);
        if (k % 3 === 0) for (let q = -1; q <= 1; q++) P(Math.round(X + nx * q), Math.round(Y - ny * q), 0x7a1a18);
      });
    });
  }
  // the station: a long roof over the platform, the queue's switchbacks beside it
  building(46.5, 790, 4, 20, { face: 3, style: 'plain', wall: 0xf4f0e8, roof: 0xd8403a, shop: true, s: 821 });
  ground(() => {
    for (let q = 0; q < 4; q++) for (let i = 0; i < 6 * S; i++) P(FX(56) + i, FY(796 + q * 2.4), i % 2 ? 0x8a8a84 : 0xb8b8b0);
  });
  crowd(56, 794, 6, 9, 14);
  // the train: five cars, riders' heads in them, going round the track (the frames follow it up the screen)
  const cars = [0xd8403a, 0xf0c020, 0x2a6ab8, 0xd8403a, 0xf0c020].map((c, n) =>
    kit.frame(3, 2.34, 900, (put) => {
      for (let j = 0; j < 7; j++)
        for (let i = 0; i < 9; i++) {
          const rim = i === 0 || i === 8 || j === 0 || j === 6;
          put(i, j, rim ? shade(c, 0.6) : (i === 3 || i === 6) && (j === 2 || j === 4) ? PAL.skin[(i + j + n) % 3] : j === 3 ? 0x2a2a30 : c);
        }
    }, true));
  const ride = steps.filter((_, k) => k % 4 === 0).map(([x, u, z]) => [x, u + z]);
  props.path(ride, cars, { sp: 30, n: 5, gap: 3.1, mode: 'wrap', turn: 'rot', cars: 1, d: 0.35 });

  // ---------------------------------------------------------------- the haunted hospital inside the coaster's loop
  building(60, 846, 14, 52, {
    face: 6, style: 'plain', wall: 0x8a8a82, roof: 0x5a5c5c, s: 822,
    top: ({ X, Y, w, h }) => {
      // its flat roof stained and cracked, a water tank, weeds, the stair house; its windows broken
      for (let j = 0; j < h; j++)
        for (let i = 0; i < w; i++) {
          const v = hashPx(X + i, Y + j, 823);
          P(X + i, Y + j, v < 0.08 ? 0x3a3c3a : v < 0.16 ? 0x6a6e66 : v < 0.2 ? 0x4a6a3a : (i + j * 2) % 23 === 0 ? 0x2a2a2a : 0x7a7c78);
        }
      for (let k = 0; k < 3; k++) {
        const [cx, cy] = [X + 8 + k * 12, Y + 20 + k * 40];
        for (let q = 0; q < 14; q++) P(cx + q, cy + Math.round(Math.sin(q * 1.3) * 2), 0x2e302e); // cracks
      }
      R(X + w - 14, Y + 6, 10, 8, 0x6a6c6a); // the stair house
      R(X + w - 14, Y + 6, 10, 2, 0x8a8c88);
      for (let i = 0; i < 6; i++) P(X + 3 + i * 2, Y + h - 3, 0x3a5a2a); // ivy at its edge
    },
  });
  halo(FX(67), FY(872), 40, 70, 0x60c0a0, 0.18); // (a cold light round it)
  mark(74.5, 850, (X, Y) => {
    // its way in, a dark door with a red lamp, the queue along the wall
    R(X - 2, Y - 8, 4, 8, 0x1a1a1a);
    E(X - 1, Y - 10, 0xff3030);
  });
  crowd(75, 846, 2, 30, 14);

  // ---------------------------------------------------------------- the food court
  mark(60, 922, (X, Y) => {
    for (let k = 0; k < 6; k++) parasol(X + (k % 3) * 14 + 4, Y - Math.floor(k / 3) * 12, PAL.awning[(k + 1) % PAL.awning.length]);
  });
  building(60, 928, 14, 8, { face: 3, style: 'plain', wall: 0xf4d8a0, roof: 0xe8603a, shop: true, sign: true, s: 824 });
  crowd(58, 912, 16, 10, 18);
  for (const [x, u] of [[48, 830], [48, 870], [48, 966], [72, 974], [80, 986], [60, 984]]) tree('icho', x, u, 1.8);

  // ---------------------------------------------------------------- the footbridge over the tracks to the west side
  const fb = 902;
  ground(() => {
    for (let i = FX(west.x + west.w - 1); i < FX(east.x + 1); i++) for (let k = 1; k <= 3; k++) hi.tint(i + 3, FY(fb) + 3 + k, 0.75);
  });
  queue(FY(fb - 2), () => {
    const lift = 4 * S;
    for (let i = FX(west.x + west.w - 1); i < FX(east.x + 1); i++)
      for (let j = -4; j <= 4; j++) P(i, FY(fb) - lift + j, Math.abs(j) === 4 ? 0xf4f0e8 : Math.abs(j) === 3 ? 0x8a8e94 : 0xb8b4ac);
    for (const x of [west.x + west.w - 1, east.x + 1]) for (let y = FY(fb) - lift + 4; y < FY(fb) + 3; y++) R(FX(x) - 1, y, 3, 1, 0x9a9a94); // its stairs down
  });
  crowd(33, fb - 1, 13, 2, 5);

  // ---------------------------------------------------------------- the west side: the Ferris wheel
  {
    const [wx, wb, R0] = [16.5, 790, 12];
    const hub = wb + R0 + 3;
    const [HX, HY] = [FX(wx), FY(hub)];
    const rr = R0 * S;
    queue(FY(wb), () => {
      for (const s of [-1, 1])
        for (let q = 0; q <= 60; q++) {
          const t = q / 60;
          const [X, Y] = [Math.round(HX + s * 14 * t), Math.round(HY + (FY(wb) - HY) * t)];
          for (let i = -1; i <= 1; i++) P(X + i, Y, i < 0 ? 0xffffff : i > 0 ? 0xa8b0bc : 0xdce2ea);
        }
      for (let k = 0; k < 24; k++) {
        const a = (k / 24) * TAU;
        for (let r = 4; r < rr; r++) P(Math.round(HX + Math.cos(a) * r), Math.round(HY + Math.sin(a) * r), k % 2 ? 0x8a96a8 : 0xc0c8d4);
      }
      for (let a = 0; a < TAU; a += 0.004) for (const r of [rr, rr - 2]) P(Math.round(HX + Math.cos(a) * r), Math.round(HY + Math.sin(a) * r), r === rr ? 0xf05a6a : 0xf4f0e8);
      disc(HX, HY, 4, (i, j, d) => (d > 0.7 ? 0xb8c0cc : i + j < 0 ? 0xffffff : 0xd8dee6));
      for (const s of [-1, 1]) R(HX + s * 14 - 3, FY(wb) - 2, 6, 3, 0xb8b8b0);
    });
    ground(() => {
      // the wheel's shadow on the tiles: a ring thrown down and to the right
      for (let a = 0; a < TAU; a += 0.01) hi.tint(Math.round(HX + 14 + Math.cos(a) * rr * 0.9), Math.round(FY(wb) + 10 + Math.sin(a) * rr * 0.3), 0.8);
    });
    const cabin = (c) =>
      kit.frame(1.67, 2, hub, (put) => {
        for (let j = 0; j < 6; j++) for (let i = 0; i < 5; i++) if (!((i === 0 || i === 4) && (j === 0 || j === 5))) put(i, j, j === 0 ? shade(c, 0.7) : i === 0 || i === 4 || j === 5 ? shade(c, 0.82) : j === 2 ? 0xd8eef8 : c);
      }, true);
    props.orbit(wx, hub - 1, R0 + 0.5, [0xf05a6a, 0xf0c020, 0x40a8d8, 0x60c080, 0xf4f0e8, 0xa070d8].map(cabin), { n: 16, w: 0.09, d: 0.13 });
    crowd(4, 786, 26, 4, 14);
  }

  // ---------------------------------------------------------------- the ship that swings (still between rides)
  mark(16.5, 848, (X, Y) => {
    drop(X - 14, Y + 1, 28, 3);
    for (const i of [-13, 12]) for (let q = 0; q < 26; q++) P(X + i + (i < 0 ? q >> 1 : -(q >> 1)), Y - q, q % 4 < 2 ? 0xf0c020 : 0x2a2228); // its A-frames
    R(X - 1, Y - 27, 3, 3, 0x2a2228);
    for (let j = 0; j < 7; j++) for (let i = -12 + j; i <= 12 - j; i++) P(X + i, Y - 11 + j, j === 0 ? 0xe8c040 : j < 2 ? 0x8a3a2a : j < 4 ? 0x6a2a20 : 0x5a2018); // the hull
    for (let i = -10; i <= 10; i += 2) P(X + i, Y - 12, PAL.cloth[(i + 10) % 7]); // its riders
    R(X - 14, Y - 13, 3, 3, 0xe8c040); // the figurehead
    for (let j = 0; j < 5; j++) P(X, Y - 17 + j, 0x6a4a2a); // a mast, a flag
    R(X + 1, Y - 17, 4, 2, 0x2a2a30);
  });
  crowd(4, 838, 26, 4, 10);

  // ---------------------------------------------------------------- the carousel and the tea cups, turning
  const turning = (cx, cu, r, draw, fps, n = 6) => {
    const fs = Array.from({ length: n }, (_, k) => kit.frame(2 * r + 2, 2 * r + 4, cu, (put) => draw(put, (r + 1) * S, (r + 1) * S, k / n), true));
    props.loop(cx - r - 1, cu + r + 1, fs, { fps, d: 0.2 });
  };
  {
    const [cx, cu, r] = [16.5, 876, 8];
    ground(() => disc(FX(cx), FY(cu - 2), r * S + 3, (i, j, d) => (d > 0.92 ? 0xe8c040 : 0x8a5a48), Math.round(r * S * 0.6) + 3));
    turning(cx, cu, r, (put, X, Y, t) => {
      const rr = r * S;
      for (let k = 0; k < 10; k++) {
        const a = (k / 10 + t / 10) * TAU;
        if (Math.sin(a) < 0.15) continue;
        const [hx, hy] = [Math.round(X + Math.cos(a) * rr * 0.86), Math.round(Y + 6 + Math.sin(a) * rr * 0.56)];
        const c = [0xf8f8f4, 0xd8a060, 0x4a3a30, 0xf0c8d8][k % 4];
        for (let i = 0; i < 4; i++) put(hx + i - 2, hy + (k % 2 ? 0 : -1), c);
        put(hx + 2, hy - 1 - (k % 2 ? 0 : 1), c);
        put(hx, hy - 3, 0xe8c040);
        put(hx, hy - 2, 0xe8c040);
      }
      for (let j = -rr; j <= rr; j++)
        for (let i = -rr; i <= rr; i++) {
          const d = Math.hypot(i, j * 1.5) / rr;
          if (d > 1) continue;
          const seg = Math.floor(((Math.atan2(j * 1.5, i) / TAU + t / 8 + 1) % 1) * 16);
          let c = seg % 2 ? 0x40a8d8 : 0xfff0e0;
          c = shade(c, 1.12 - d * 0.3 - (i + j > 0 ? 0.14 : 0));
          if (d > 0.9) c = (seg + Math.floor(t * 6)) % 3 === 0 ? 0xffffff : 0xe8c040;
          if (d < 0.1) c = 0xe8c040;
          put(X + i, Y - 4 + j, c);
        }
    }, 6);
    crowd(6, 864, 22, 3, 10);
  }
  {
    const [cx, cu, r] = [18, 916, 6];
    turning(cx, cu, r, (put, X, Y, t) => {
      const rr = r * S;
      for (let j = -rr; j <= rr; j++)
        for (let i = -rr; i <= rr; i++) {
          const d = Math.hypot(i, j * 1.4) / rr;
          if (d <= 1) put(X + i, Y + j, d > 0.9 ? 0xf4f0e8 : Math.floor(((Math.atan2(j * 1.4, i) / TAU + t / 6 + 1) % 1) * 12) % 2 ? 0xf0a0c0 : 0xe890b0);
        }
      for (let k = 0; k < 6; k++) {
        const a = (k / 6 + t / 6) * TAU;
        const [hx, hy] = [Math.round(X + Math.cos(a) * rr * 0.6), Math.round(Y + (Math.sin(a) * rr * 0.6) / 1.4)];
        const c = [0x40a8d8, 0xf0c020, 0x60c080][k % 3];
        for (let j = -2; j <= 2; j++) for (let i = -3; i <= 3; i++) if (Math.hypot(i / 3.2, j / 2.2) <= 1) put(hx + i, hy + j, Math.hypot(i / 3.2, j / 2.2) > 0.7 ? c : i < 0 ? PAL.cloth[(k + 2) % 7] : 0xf4f0e8);
      }
    }, 5);
  }

  // ---------------------------------------------------------------- the drop tower: a lattice mast, a ring of seats shot up it and let fall
  {
    const [cx, cu] = [12, 944];
    mark(cx, cu, (X, Y) => {
      drop(X - 5, Y + 1, 11, 3);
      R(X - 5, Y - 2, 11, 3, 0x8a8e96);
      for (let q = 0; q < 96; q++) {
        P(X - 3, Y - 3 - q, 0xf4f4f0);
        P(X + 3, Y - 3 - q, 0xc8ccd0);
        if (q % 6 < 3) P(X - 2 + (q % 6), Y - 3 - q, 0x2a6ab8);
        else P(X + 5 - (q % 6), Y - 3 - q, 0x2a6ab8);
      }
      R(X - 4, Y - 102, 9, 4, 0xd8403a);
      E(X, Y - 103, 0xff5040);
    });
    ground(() => {
      for (let q = 0; q < 30; q++) for (let i = 0; i < 3; i++) hi.tint(FX(cx) + 4 + q + i, FY(cu) + 2 + (q >> 2), 0.8); // its long shadow
    });
    const ring = kit.frame(5, 2, cu, (put) => {
      for (let i = 0; i < 15; i++) {
        if (Math.abs(i - 7) < 2) continue;
        put(i, 2, 0xd8403a);
        put(i, 3, i % 2 ? PAL.cloth[i % 7] : 0x2a2228);
        put(i, 1, i % 2 ? PAL.skin[i % 3] : 0xd8403a);
        put(i, 4, 0x8a2a24);
      }
    }, true);
    props.path([[cx, cu + 3], [cx, cu + 30]], [ring], { sp: 14, n: 1, mode: 'pp', hold: 1.8, turn: 'none', d: 0.25 });
    crowd(18, 940, 12, 8, 10);
  }
  // ---------------------------------------------------------------- the chain flyer: seats on chains flung out round its top
  {
    const [cx, cu, r] = [22, 964, 7];
    mark(cx, cu - 1, (X, Y) => {
      drop(X - 2, Y + 1, 5, 3);
      for (let q = 0; q < 30; q++) R(X - 1, Y - q, 3, 1, q % 6 < 3 ? 0xf0c020 : 0xf4f0e8); // the mast
    });
    turning(cx, cu + 6, r, (put, X, Y, t) => {
      const rr = r * S;
      // the canopy at the top, striped, and the seats out round it on their chains
      for (let j = -rr * 0.4; j <= rr * 0.4; j++)
        for (let i = -rr * 0.55; i <= rr * 0.55; i++) {
          const d = Math.hypot(i / (rr * 0.55), j / (rr * 0.4));
          if (d <= 1) put(Math.round(X + i), Math.round(Y - 10 + j), Math.floor(((Math.atan2(j, i) / TAU + t / 12 + 1) % 1) * 12) % 2 ? 0xd8403a : 0xf4f0e8);
        }
      for (let k = 0; k < 12; k++) {
        const a = (k / 12 + t / 12) * TAU;
        const [sx, sy] = [Math.round(X + Math.cos(a) * rr), Math.round(Y - 6 + Math.sin(a) * rr * 0.45)];
        const [tx, ty] = [Math.round(X + Math.cos(a) * rr * 0.5), Math.round(Y - 10 + Math.sin(a) * rr * 0.2)];
        for (let q = 0; q <= 4; q++) put(Math.round(tx + ((sx - tx) * q) / 4), Math.round(ty + ((sy - ty) * q) / 4), 0x6a6e76, 0.8);
        put(sx, sy, PAL.cloth[k % 7]);
        put(sx, sy - 1, PAL.skin[k % 3]);
      }
    }, 6);
  }

  // ---------------------------------------------------------------- stalls, benches, machines, a souvenir shop: the small things between the rides
  const stall = (x, u, c) =>
    mark(x, u, (X, Y) => {
      drop(X - 1, Y + 1, 12, 2);
      R(X, Y - 8, 10, 8, 0xe8dcc4); // the counter and its back
      for (let i = 0; i < 10; i++) R(X + i, Y - 11, 1, 4, i % 2 ? c : 0xf4f0e8); // the striped awning
      R(X + 1, Y - 3, 8, 2, 0x8a5a3a);
      for (let i = 0; i < 3; i++) P(X + 2 + i * 3, Y - 5, [0xf06088, 0xf0c020, 0x60c0f0][i]); // what it sells: prizes, sweets
    });
  for (let k = 0; k < 3; k++) stall(3 + k * 10, 930, [0xd8403a, 0x2a6ab8, 0x3a9a5a][k]);
  for (let k = 0; k < 2; k++) stall(3 + k * 11, 898, [0xf0c020, 0xd8403a][k]);
  const machines = (x, u, n) =>
    mark(x, u, (X, Y) => {
      for (let k = 0; k < n; k++) {
        R(X + k * 4, Y - 7, 3, 7, [0xd8403a, 0xf4f0e8, 0x2a6ab8][k % 3]);
        P(X + k * 4 + 1, Y - 5, 0xa8e0ff);
        P(X + k * 4 + 1, Y - 3, 0xfff0a0);
      }
    });
  machines(25, 896, 2);
  machines(49, 905, 3);
  machines(4, 822, 3);
  const benches = (x, u, n) =>
    mark(x, u, (X, Y) => {
      for (let k = 0; k < n; k++) {
        R(X + k * 8, Y - 2, 6, 2, 0x8a5a3a);
        R(X + k * 8, Y - 3, 6, 1, 0xa8784a);
        if ((k + x) % 2) P(X + k * 8 + 2, Y - 4, PAL.cloth[k % 7]);
      }
    });
  benches(4, 858, 3);
  benches(4, 906, 2);
  benches(50, 838, 2);
  benches(62, 960, 3);
  // a souvenir shop and the restrooms by the gate
  building(64, 800, 12, 9, { face: 3, style: 'plain', wall: 0xf4e8d8, roof: 0x2a6ab8, shop: true, sign: true, s: 825 });
  building(68, 974, 9, 7, { face: 3, style: 'plain', wall: 0xe8e4dc, roof: 0x6a8a6a, s: 826 });
  // balloons for sale, a bunch of them by the souvenir shop
  mark(62, 812, (X, Y) => {
    for (let k = 0; k < 7; k++) {
      const [bx, by] = [X + (k % 4) * 3 - 3, Y - 14 - Math.floor(k / 4) * 3];
      P(bx, by, [0xff5060, 0xffe040, 0x60c0ff, 0x80e080, 0xffa0e0][k % 5]);
      P(bx + 1, by, [0xff5060, 0xffe040, 0x60c0ff, 0x80e080, 0xffa0e0][k % 5]);
      P(bx, by - 1, 0xffffff);
      for (let q = 1; q < 8; q++) P(X + Math.round(((bx - X) * (8 - q)) / 8), by + q, 0xd8d8d8, 0.7);
    }
    P(X, Y - 4, PAL.cloth[2]);
    P(X, Y - 5, PAL.skin[1]);
  });
  for (const [x, u] of [[4, 960], [30, 972], [6, 984], [26, 988], [30, 912], [2, 880], [30, 840]]) tree('momiji', x, u, 1.9);
  crowd(2, 952, 30, 30, 24);
  crowd(2, 920, 30, 8, 14);
  crowd(2, 884, 30, 10, 14);
  crowd(46, 812, 34, 26, 26);
  crowd(46, 936, 34, 20, 16);
  void TAU;
}
