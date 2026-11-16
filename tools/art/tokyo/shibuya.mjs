// Shibuya (u 2900-3900), at dusk in the rain: the lights are on and the streets shine.
//   the station - a tower of glass with a deck on its roof, the store beside it, the hall over the platforms;
//   the square in front - the stone head of Moyai, Hachikō on his plinth with people waiting round him under
//     umbrellas, the old green tram car, the police box, taxis;
//   the scramble (the first arena) - an open square of wet asphalt, crossings on all four sides and both
//     diagonals, cars held at the lights on every arm, people crossing; round it walls of screens, each with a
//     picture of its own, and the round tower at the fork;
//   Center-gai behind its arch, the park laid out on the roof over the tracks, Roppongi-dōri running on under
//     the expressway.
// Live: the screens, the people on the crossings, the signals, rain rings on the square, the trains (harajuku.mjs).
import { lots } from './blocks.mjs';
import { PAL, shade, blend } from './kit.mjs';
import { hashPx } from '../hires.mjs';

export function shibuya(ctx) {
  const { kit, blocks, pave, plot, props, near, ROADS, S, L } = ctx;
  const { building, house, tree, crowd, mark, ground, rand, pick, P, R, E, ER, halo, FX, FY, queue, shadowBox, car } = kit;
  kit.setSun(0.22); // (an overcast evening: short, soft shadows)
  const WET = 0.8; // how many of the people are under umbrellas

  // ---- a screen on a wall: a picture that moves (frames at their own colours), its first frame painted on the
  // wall itself, its glow on the street below. kind picks the picture.
  const picture = (kind, i, j, w, h, t) => {
    const [x, y] = [i / w, j / h];
    if (kind === 0) {
      // bars of colour sweeping across
      const k = Math.floor((x * 1.4 + y * 0.5 + t) * 6) % 6;
      return [0xf04870, 0xf0a030, 0xf4e050, 0x50d090, 0x40a0f0, 0x9060e0][(k + 6) % 6];
    }
    if (kind === 1) {
      // an equaliser
      const col = Math.floor(i / 6);
      const lvl = 0.25 + 0.6 * Math.abs(Math.sin(col * 1.7 + t * 6.283 + col * col * 0.3));
      if (i % 6 === 5) return 0x10141c;
      return 1 - y < lvl ? blend(0x30e0a0, 0xf04060, 1 - y) : 0x141a28;
    }
    if (kind === 2) {
      // rings running out from the middle
      const d = Math.hypot((x - 0.5) * (w / h), y - 0.5);
      return [0xff60a8, 0x281848, 0x50e0f0, 0x281848][Math.floor(d * 7 - t * 4 + 8) % 4];
    }
    if (kind === 3) {
      // a sun coming up over a sea
      const sun = Math.hypot((x - 0.5) * (w / h), y - (0.8 - t * 0.45));
      if (y > 0.66) return (i + j * 3 + Math.floor(t * 12)) % 9 < 3 ? 0xffc070 : 0x284a8a;
      return sun < 0.22 ? 0xfff4b0 : blend(0x4a2a80, 0xff8050, y / 0.66);
    }
    if (kind === 4) {
      // a heart beating on stripes
      const s = 0.26 + 0.07 * Math.sin(t * 6.283);
      const [hx, hy] = [(x - 0.5) * (w / h) / s, (0.42 - y) / s];
      const heart = (hx * hx + hy * hy - 1) ** 3 - hx * hx * hy * hy * hy < 0;
      return heart ? 0xff4878 : Math.floor(j / 3 + t * 8) % 2 ? 0xfff0f4 : 0xffd0dc;
    }
    // falling blocks of light
    const v = hashPx(Math.floor(i / 4), Math.floor(j / 4 - t * 6), 7);
    return v < 0.2 ? 0x60f0ff : v < 0.3 ? 0xffffff : v < 0.5 ? 0x2060c0 : 0x0c1838;
  };
  /** A screen w x h (logical) with its top-left at (x, u). over: the foot of the building it hangs on. */
  const screen = (x, u, w, h, kind, over, n = 4) => {
    const [fw, fh] = [Math.round(w * S), Math.round(h * S)];
    const draw = (t) => (put) => {
      for (let j = 0; j < fh; j++) for (let i = 0; i < fw; i++) put(i, j, i === 0 || j === 0 || i === fw - 1 || j === fh - 1 ? 0x18181e : picture(kind, i, j, fw, fh, t));
    };
    mark(x, u, (X, Y) => draw(0)((i, j, c) => E(X + i, Y + j, c)), over);
    props.loop(x, u, Array.from({ length: n }, (_, k) => kit.frame(w, h, u, draw(k / n), true)), { fps: 3, d: 0.2 });
    const tone = [0xf08060, 0x40d0a0, 0xc060d0, 0xf09060, 0xff80a0, 0x50a0f0][kind];
    halo(FX(x + w / 2), FY(over) + 14, w * S * 0.8, 34, tone, 0.26);
  };
  /** A billboard standing on a roof's far edge, lit: a picture that does not move. */
  const board = (x, u, w, h, kind, over) =>
    mark(x, u, (X, Y) => {
      const [fw, fh] = [w * S, h * S];
      R(X - 1, Y - 1, fw + 2, fh + 2, 0x2a2630);
      for (let j = 0; j < fh; j++) for (let i = 0; i < fw; i++) E(X + i, Y + j, picture(kind, i, j, fw, fh, 0.3));
      for (const i of [3, fw - 5]) R(X + i, Y + fh + 1, 2, 5, 0x5a5a62);
    }, over);

  // ---- the station
  {
    const p = plot('shibuya_eki');
    pave(p.x, p.u, p.w, p.h, 'plaza', 91);
    // the store on the south-west corner, a garden on its roof
    building(p.x + 1, p.u + 2, 27, 46, {
      face: 13, style: 'depato', wall: 0xe0d8c8, trim: 0x8a2a2a, roof: 0x8a8880, shop: true, s: 901,
      top: ({ X, Y, w, h, greenery, parasol, umbrella, hut, ac: unit, lamp }) => {
        greenery(X + 4, Y + 4, w - 8, 24, 5);
        R(X + 4, Y + 15, w - 8, 3, 0xb4a88c);
        for (let k = 0; k < 4; k++) parasol(X + 12 + k * 15, Y + 38, PAL.awning[k * 2]);
        for (let k = 0; k < 7; k++) umbrella(X + 8 + ((k * 23) % (w - 16)), Y + 46 + ((k * 13) % 20), 30 + k);
        hut(X + w - 20, Y + h - 22, 12, 6, 0x8a8880);
        for (let k = 0; k < 8; k++) unit(X + 6 + (k % 4) * 7, Y + h - 22 + Math.floor(k / 4) * 7);
        lamp(X + 6, Y + 36);
        lamp(X + w - 8, Y + 36);
      },
    });
    // the tower: glass from the street to the deck on its roof
    building(p.x + 30, p.u + 2, 28, 86, {
      face: 58, style: 'glass', glass: [0x243a5c, 0x86b0d4], roof: 0x6c7480, s: 902, lit: 0.6,
      top: ({ X, Y, w, h, helipad, greenery, umbrella, R: rect, E: lit, lamp }) => {
        rect(X + 2, Y + 2, w - 4, h - 4, 0x8a8478); // the deck's boards
        for (let i = 2; i < w - 2; i += 4) rect(X + i, Y + 2, 1, h - 4, 0x7a7468);
        helipad(X + (w >> 1), Y + 22, 13);
        greenery(X + 5, Y + h - 30, w - 10, 12, 8);
        for (let k = 0; k < 9; k++) umbrella(X + 6 + ((k * 19) % (w - 14)), Y + 42 + ((k * 7) % 14), 50 + k);
        for (let i = 3; i < w - 3; i += 6) {
          lit(X + i, Y + 2, 0xfff0c0); // the lamps along the rail
          lit(X + i, Y + h - 3, 0xfff0c0);
        }
        lamp(X + 6, Y + h - 6);
        lamp(X + w - 7, Y + h - 6);
      },
    });
    mark(p.x + 44, p.u + 84, (X, Y) => kit.mast(X, Y, 16), p.u + 2);
    // the hall over the platforms: three vaults of glass, lit from inside
    building(p.x + 1, p.u + 92, 57, 56, {
      face: 9, style: 'office', wall: 0xc8c4bc, roof: 0x70747c, shop: true, sign: 0x2a6ad0, s: 903,
      top: ({ X, Y, w, h, ac: unit, hut, E: lit, R: rect, night }) => {
        for (let k = 0; k < 3; k++) {
          const x0 = X + 8 + k * Math.floor((w - 16) / 3);
          const vw = Math.floor((w - 16) / 3) - 6;
          for (let j = 6; j < h - 30; j++)
            for (let i = 0; i < vw; i++) {
              const a = Math.abs(i - vw / 2) / (vw / 2);
              const rib = j % 8 === 0 || i === 0 || i === vw - 1 || Math.abs(i - vw / 2) < 1;
              const c = rib ? 0xdfe6ea : blend(0xbfe0e8, 0x587890, a);
              if (!rib && night > 0.3 && (i + j * 3) % 11 < 4) lit(x0 + i, Y + j, blend(c, 0xffeab0, 0.6));
              else rect(x0 + i, Y + j, 1, 1, c);
            }
        }
        for (let k = 0; k < 20; k++) unit(X + 8 + (k % 10) * 7, Y + h - 22 + Math.floor(k / 10) * 7);
        hut(X + w - 30, Y + h - 24, 14, 7, 0x70747c);
      },
    });
    ctx.cover(p.x, p.u, p.w, p.h); // (the trains run under it)
    crowd(p.x + 2, p.u - 5, 40, 4, 16, WET);
  }

  // ---- the square: Moyai, Hachikō, the tram car, the police box, taxis, trees in their planters
  {
    const m = plot('moyai');
    pave(m.x, m.u, m.w, m.h, 'plaza', 92);
    mark(m.x + 4, m.u + 2, (X, Y) => {
      kit.greenery(X - 9, Y - 2, 18, 4, 3);
      for (let k = 1; k <= 3; k++) for (let i = -4; i < 5; i++) ctx.img.hi.tint(X + i + k, Y + k - 2, 0.72);
      // the long stone head: a brow, deep eyes, a nose down the middle
      for (let j = 0; j < 16; j++)
        for (let i = -5; i <= 5; i++) {
          if (Math.abs(i) > 5 - (j < 3 ? 3 - j : j > 12 ? j - 12 : 0)) continue;
          let c = i < -2 ? 0x9a9a94 : i > 2 ? 0x5c5c58 : 0x7c7c76;
          if (j === 5) c = 0x4a4a46;
          if (j >= 6 && j <= 7 && Math.abs(i) >= 2 && Math.abs(i) <= 3) c = 0x2e2e2c;
          if (i === 0 && j > 5 && j < 12) c = 0xa8a8a0;
          if (j === 13 && Math.abs(i) < 3) c = 0x3a3a38;
          P(X + i, Y - 18 + j, c);
        }
    });
    crowd(m.x - 6, m.u - 4, 20, 5, 9, WET);

    const h = plot('hachiko');
    pave(h.x, h.u, h.w, h.h, 'plaza', 93);
    mark(h.x + 4, h.u + 3, (X, Y) => {
      for (let k = 1; k <= 3; k++) for (let i = -6; i < 7; i++) ctx.img.hi.tint(X + i + k, Y + k, 0.72);
      R(X - 6, Y - 7, 13, 8, 0xa8a49c); // the plinth
      R(X - 6, Y - 7, 13, 2, 0xc8c4bc);
      R(X - 6, Y, 13, 1, 0x5a5850);
      R(X - 3, Y - 4, 7, 2, 0x6a6a64); // (its plate)
      // the dog, sitting: bronze, one ear down
      R(X - 2, Y - 13, 5, 6, 0x8a6a3a);
      R(X - 2, Y - 13, 2, 6, 0xb08c50);
      R(X - 2, Y - 17, 4, 4, 0x8a6a3a);
      P(X - 2, Y - 18, 0xb08c50);
      P(X + 1, Y - 17, 0x5a4424);
      P(X - 3, Y - 15, 0x5a4424);
      R(X + 2, Y - 9, 2, 2, 0x5a4424);
    });
    // the ring of people waiting for someone
    for (let k = 0; k < 22; k++) {
      const a = (k / 22) * Math.PI * 2 + rand() * 0.2;
      const r = 6 + rand() * 5;
      crowd(h.x + 4 + Math.cos(a) * r, h.u + 2 + Math.sin(a) * r * 0.8, 0.6, 0.6, 1, WET);
    }
    // the old tram car, green with a cream band, its lights on
    mark(103, 3270, (X, Y) => {
      for (let k = 1; k <= 3; k++) for (let i = 0; i < 40; i++) ctx.img.hi.tint(X + i + k, Y + 15 + k, 0.72);
      R(X, Y, 40, 16, 0x3a7a4a);
      R(X + 1, Y + 1, 38, 9, 0x5a9a68);
      R(X + 2, Y + 3, 36, 4, 0x8ab894);
      R(X, Y + 10, 40, 2, 0xe8e0c0);
      for (let i = 3; i < 37; i += 6) ER(X + i, Y + 12, 4, 2, 0xffe8a8);
      R(X, Y + 15, 40, 1, PAL.ink);
    });
    // the police box: a red lamp over its door
    building(165, 3276, 9, 10, { face: 4, style: 'plain', wall: 0xe8e4dc, roof: 0x6c7a74, s: 904, lit: 0.9 });
    mark(169.4, 3280.4, (X, Y) => {
      ER(X, Y, 2, 2, 0xff4030);
      halo(X + 1, Y + 1, 8, 8, 0xff4030, 0.3);
    }, 3276);
    // taxis in their rank east of the tracks, a bus at its stop
    for (let k = 0; k < 5; k++) car(166, 3170 + k * 8, true, k % 3 ? 0xe8c020 : 0x2a6a4a);
    mark(170, 3246, (X, Y) => {
      R(X, Y, 10, 30, 0xe8ecec);
      R(X + 1, Y + 1, 8, 28, 0x4a8ac0);
      R(X + 2, Y + 3, 6, 3, 0x2c3a4c);
      for (let j = 8; j < 27; j += 6) R(X + 3, Y + j, 4, 3, 0xc4d8e8);
      ER(X + 1, Y + 29, 2, 1, 0xd83030);
      ER(X + 7, Y + 29, 2, 1, 0xd83030);
    });
    for (const [x, u] of [[104, 3156], [120, 3156], [142, 3160], [106, 3214], [128, 3206], [104, 3290], [124, 3290], [144, 3286], [172, 3160]]) tree('broadleaf', x, u, 2.4);
    for (const [x, u] of [[112, 3184], [132, 3230], [112, 3256], [138, 3270], [170, 3220], [104, 3240]]) mark(x, u, (X, Y) => kit.lamp(X, Y));
    crowd(102, 3158, 44, 132, 130, WET);
    crowd(162, 3152, 12, 100, 20, WET);
    // benches along the planters
    for (const [x, u] of [[116, 3196], [124, 3250], [134, 3190]]) mark(x, u, (X, Y) => {
      R(X, Y, 9, 3, 0x7a5a38);
      R(X, Y, 9, 1, 0xa88050);
    });
  }

  // ---- the gmachy south-west of the crossing: three buildings shoulder to shoulder, boards on their roofs
  {
    const p = plot('shibuya_sw');
    building(p.x, p.u, p.w, 42, { face: 15, style: 'neon', wall: 0x4a4654, roof: 0x70747c, shop: true, sign: true, s: 911 });
    building(p.x, p.u + 44, p.w, 44, { face: 17, style: 'depato', wall: 0xd8d4cc, trim: 0x2a4a7a, roof: 0x848c8e, shop: true, s: 912 });
    building(p.x, p.u + 90, p.w, 46, { face: 20, style: 'glass', glass: [0x2c3a5c, 0x90b4d8], roof: 0x7c7e84, shop: true, s: 913, lit: 0.65 });
    board(p.x + 4, p.u + 42 - 1, 36, 9, 3, p.u);
    board(p.x + 6, p.u + 88 - 1, 32, 10, 4, p.u + 44);
    board(p.x + 3, p.u + 136 - 1, 38, 11, 0, p.u + 90);
    screen(p.x + 8, p.u + 90 + 18, 28, 12, 5, p.u + 90);
    crowd(p.x, p.u - 5, p.w, 4, 14, WET);
  }

  // ---- the scramble: crossings on four sides and both diagonals, stop lines, cars held on every arm
  {
    const [x0, u0, x1, u1] = [56, 3316, 124, 3384];
    kit.zebra(68, u0 + 6, 44, 6, 'u'); // south
    kit.zebra(68, u1 - 12, 44, 6, 'u'); // north
    kit.zebra(x0 + 6, u0 + 12, 6, 44, 'x'); // west
    kit.zebra(x1 - 12, u0 + 12, 6, 44, 'x'); // east
    ground(() => {
      // the diagonals: bars across the walkers' way
      for (let Y = FY(u1 - 12); Y < FY(u0 + 12); Y++)
        for (let X = FX(68); X < FX(112); X++) {
          const [a, b] = [X - FX(68), Y - FY(u1 - 12)];
          for (const [al, ac] of [[a + b, a - b], [a - b + 132, a + b - 132]]) if (Math.abs(ac) < 9 && Math.floor(al / 3) % 2 === 0 && Math.abs(a - 66) + Math.abs(b - 66) > 10) P(X, Y, 0xe4e0d6);
        }
      // stop lines
      R(FX(82), FY(u0 + 2), 24, 2, 0xe4e0d6);
      R(FX(90), FY(u1 - 2), 24, 2, 0xe4e0d6);
      R(FX(x0 + 2), FY(3358), 2, 24, 0xe4e0d6);
      R(FX(x1 - 2) - 2, FY(3350), 2, 24, 0xe4e0d6);
    });
    // (they keep to the left: north-bound on the west half, east-bound on the north half)
    for (let k = 0; k < 4; k++) {
      car(84.6 + (k % 2) * 3.2, u0 - 6 - k * 7, true, undefined, false);
      car(92.4 + (k % 2) * 3.2, u1 + 8 + k * 7, true, undefined, true);
      car(x0 - 8 - k * 8, 3352.2 + (k % 2) * 3.2, false, undefined, true);
      car(x1 + 8 + k * 8, 3344.6 + (k % 2) * 3.2, false, undefined, false);
    }
    // people waiting at the four corners
    for (const [cx, cu] of [[x0 + 2, u0 + 2], [x1 - 9, u0 + 2], [x0 + 2, u1 - 9], [x1 - 9, u1 - 9]]) crowd(cx, cu, 7, 7, 16, WET);
    // people crossing: little groups under umbrellas, to and fro on every crossing
    const groups = Array.from({ length: 6 }, (_, g) =>
      kit.frame(3, 3, 3350, (put) => {
        for (let k = 0; k < 2 + (g % 2); k++) {
          const [bx, by] = [Math.floor(hashPx(g, k, 3) * 5), Math.floor(hashPx(g, k, 4) * 5)];
          const v = hashPx(g, k, 5);
          const c = v < 0.45 ? 0xd0dae2 : v < 0.7 ? 0x30303a : v < 0.85 ? 0x3a4670 : 0x9a4a5a;
          for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) if (!((i === 0 || i === 3) && (j === 0 || j === 3))) put(bx + i, by + j, i + j < 2 ? shade(c, 1.15) : i + j > 4 ? shade(c, 0.8) : c);
        }
      }));
    const walk = (a, b, s0) => {
      for (const [pts, k] of [[[a, b], 0], [[b, a], 1]]) {
        const off = kit.offset(pts, 1.4);
        props.path(off, [0, 1, 2, 3, 4].map((q) => groups[(q + k * 3 + Math.round(s0 * 10)) % 6]), { sp: 6 + k, n: 5, gap: Math.hypot(b[0] - a[0], b[1] - a[1]) / 5, mode: 'wrap', turn: 'none', cars: 1, s0: s0 + k * 0.37, d: -0.3 });
      }
    };
    walk([66, u0 + 9], [114, u0 + 9], 0.1);
    walk([66, u1 - 9], [114, u1 - 9], 0.5);
    walk([x0 + 9, u0 + 10], [x0 + 9, u1 - 10], 0.3);
    walk([x1 - 9, u0 + 10], [x1 - 9, u1 - 10], 0.7);
    walk([69, u0 + 13], [111, u1 - 13], 0.2);
    walk([111, u0 + 13], [69, u1 - 13], 0.6);
    // the signals at the corners: the walkers' lamp, red then green
    const signal = (on) =>
      kit.frame(1.34, 3, 3350, (put) => {
        for (let j = 0; j < 9; j++) put(1, j, 0x3a3e48);
        for (let j = 0; j < 5; j++) for (let i = 0; i < 4; i++) put(i, j, 0x1c1e26);
        for (const [j, c, lit] of [[1, 0xff4838, !on], [3, 0x40f090, on]]) for (const i of [1, 2]) put(i, j, lit ? c : shade(c, 0.25));
      }, true);
    const [red, green] = [signal(false), signal(true)];
    for (const [x, u, ph] of [[x0 + 3, u0 + 14, 0], [x1 - 4, u0 + 14, 0], [x0 + 3, u1 - 3, 0], [x1 - 4, u1 - 3, 0], [x0 + 14, u0 + 5, 0], [x0 + 14, u1 - 1, 0], [x1 - 15, u0 + 5, 0], [x1 - 15, u1 - 1, 0]])
      props.loop(x, u, [red, green], { fps: 0.2, seq: [1, 1, 1, 0], ph, d: 0.1 });
    // the rain on the open square: rings where the drops fall
    const ring = (r, a) =>
      kit.frame(3, 2, 3350, (put) => {
        for (let k = 0; k < 16; k++) {
          const t = (k / 16) * Math.PI * 2;
          put(Math.round(4 + Math.cos(t) * r), Math.round(2.5 + Math.sin(t) * r * 0.55), 0xc8d8f0, a);
        }
      }, true);
    props.spot([[x0, u1, x1 - x0, u1 - u0], [100, 3296, 46, 140]], [ring(1, 0.7), ring(2.2, 0.5), ring(3.6, 0.3)], { rate: 9, fps: 9, a: 0.7 });
  }

  // ---- the walls of screens north of the crossing
  {
    const a = plot('shibuya_nw');
    building(a.x, a.u, a.w, a.h, {
      face: 27, style: 'office', wall: 0x4c4a56, roof: 0x70747c, shop: true, s: 921, lit: 0.5,
      top: ({ X, Y, w, h, ac: unit, tank, hut }) => {
        for (let k = 0; k < 12; k++) unit(X + 6 + (k % 6) * 7, Y + h - 20 + Math.floor(k / 6) * 7);
        for (let k = 0; k < 2; k++) tank(X + w - 12, Y + 22 + k * 13, 5);
        hut(X + 8, Y + 20, 12, 6, 0x70747c);
      },
    });
    screen(a.x + 2, a.u + 25, 32, 16, 0, a.u, 6);
    board(a.x + 3, a.u + a.h - 1, 30, 10, 2, a.u);

    // the round tower at the fork: bands of light round a drum of silver, a strip of screen down its front
    const n = plot('shibuya_n');
    pave(n.x, n.u, n.w, n.h, 'plaza', 94);
    const [X0, YT, YB] = [FX(n.x), FY(n.u + n.h), FY(n.u)];
    const [cw, ch] = [n.w * 3, YB - YT];
    const [rx, ry] = [cw / 2 - 2, 15];
    queue(YB, () => {
      for (let j = 0; j < ch; j++)
        for (let i = 0; i < cw; i++) {
          const ex = (i + 0.5 - cw / 2) / rx;
          if (Math.abs(ex) > 1) continue;
          const lip = Math.sqrt(1 - ex * ex) * ry;
          const top = ry - lip; // the drum's top edge here
          const foot = ch - 1 - (ry - lip) * 0.4;
          if (j < top || j > foot) continue;
          if (j < ry + lip) {
            // its roof: a ring of plant round a lantern of glass
            const d = Math.hypot(ex, (j - ry) / ry);
            const c = d > 0.9 ? 0x5a5e66 : d > 0.55 ? 0x8a8e96 : d > 0.32 ? 0xc4c8ce : 0x9cc4dc;
            if (d < 0.3) E(X0 + i, YT + j, 0xe8f4ff);
            else P(X0 + i, YT + j, c);
            continue;
          }
          const band = Math.floor((j - ry - lip) / 7);
          const lit = (j - Math.floor(ry + lip)) % 7 < 2;
          const c = shade(0xb8bcc6, 1.15 - 0.5 * Math.abs(ex + 0.3));
          if (lit) E(X0 + i, YT + j, blend([0xff5a8a, 0xffffff, 0x60d0ff][band % 3], 0xffffff, 0.2));
          else P(X0 + i, YT + j, i % 5 === 0 ? shade(c, 0.85) : c);
        }
    }, () => shadowBox(X0 + 3, YT + 8, cw - 6, ch - 10, 8, 0.66));
    screen(n.x + 8, n.u + 30, 8, 22, 5, n.u, 5);
    crowd(n.x, n.u - 4, n.w, 3, 10, WET);

    const e = plot('shibuya_ne');
    building(e.x, e.u, e.w, e.h, {
      face: 22, style: 'glass', glass: [0x2a3454, 0x8098c8], roof: 0x7c7e84, shop: true, s: 922, lit: 0.55,
      top: ({ X, Y, w, h, greenery, ac: unit, umbrella, lamp }) => {
        greenery(X + 4, Y + 4, w - 40, h - 10, 12);
        for (let k = 0; k < 5; k++) umbrella(X + 8 + k * 14, Y + 8 + ((k * 7) % 12), 70 + k);
        for (let k = 0; k < 10; k++) unit(X + w - 34 + (k % 5) * 6, Y + 6 + Math.floor(k / 5) * 7);
        lamp(X + 10, Y + h - 6);
      },
    });
    screen(e.x + 2, e.u + 20, 19, 12, 1, e.u, 6);
    screen(e.x + 23, e.u + 20, 19, 12, 4, e.u, 6);
    board(e.x + 4, e.u + e.h - 1, 36, 9, 3, e.u);
  }

  // ---- Center-gai: an arch at its mouth, lanterns down it, a crowd
  mark(46, 3361, (X, Y) => {
    R(X - 9, Y - 16, 2, 16, 0xc03a30);
    R(X + 7, Y - 16, 2, 16, 0xc03a30);
    ER(X - 10, Y - 21, 20, 5, 0xfff0d8);
    kit.strokes(X - 9, Y - 21, 18, 5, 0xd03040, 5);
    R(X - 10, Y - 22, 20, 1, 0xc03a30);
    halo(X, Y - 12, 16, 14, 0xffd0a0, 0.3);
  });
  for (let u = 3372; u < 3596; u += 9) mark(46 + (Math.round(u / 9) % 2 ? -2.2 : 2.2), u, (X, Y) => kit.lantern(X, Y, Math.round(u / 9) % 3 ? 0xe0402a : 0xf0c040));
  crowd(44.4, 3362, 3.2, 236, 90, WET);

  // ---- the park on the roof over the tracks: a lawn, a skate bowl, a sand court, a wall to climb, a café
  {
    const p = plot('miyashita');
    building(p.x, p.u, p.w, p.h, {
      face: 5, style: 'plain', wall: 0xc8c4bc, roof: 0x8a9088, shop: true, s: 931,
      top: ({ X, Y, w, h, greenery, parasol, umbrella, lamp, R: rect }) => {
        greenery(X + 2, Y + 4, w - 4, 70, 21); // the lawn
        for (let j = 0; j < 70; j += 23) rect(X + 2, Y + 4 + j, w - 4, 2, 0xb4a88c);
        // the bowl: smooth concrete, its lip pale
        for (let j = 0; j < 46; j++) for (let i = 0; i < w - 6; i++) {
          const d = Math.hypot((i - (w - 6) / 2) / ((w - 6) / 2), (j - 23) / 23);
          if (d < 1) rect(X + 3 + i, Y + 84 + j, 1, 1, d > 0.86 ? 0xd8d8d2 : shade(0x9a9c9e, 0.8 + 0.3 * d));
        }
        // the sand court and its net
        rect(X + 3, Y + 140, w - 6, 50, 0xd8c89a);
        rect(X + 3, Y + 140, w - 6, 1, 0xf4f0e0);
        rect(X + 3, Y + 189, w - 6, 1, 0xf4f0e0);
        rect(X + 3, Y + 164, w - 6, 1, 0x3a3a40);
        // the climbing wall: holds of every colour
        rect(X + 3, Y + 200, w - 6, 26, 0x7a7e86);
        for (let k = 0; k < 40; k++) rect(X + 4 + Math.floor(hashPx(k, 1, 9) * (w - 9)), Y + 201 + Math.floor(hashPx(k, 2, 9) * 24), 1, 1, PAL.sign[k % PAL.sign.length]);
        // the café: tables under parasols
        rect(X + 2, Y + 236, w - 4, 60, 0xb4a88c);
        for (let k = 0; k < 6; k++) parasol(X + 9 + (k % 2) * 18, Y + 246 + Math.floor(k / 2) * 18, PAL.awning[k]);
        greenery(X + 2, Y + 304, w - 4, h - 312, 22);
        for (let j = 20; j < h - 10; j += 44) {
          lamp(X + 4, Y + j);
          lamp(X + w - 5, Y + j + 22);
        }
        for (let k = 0; k < 16; k++) umbrella(X + 5 + ((k * 13) % (w - 12)), Y + 10 + ((k * 61) % (h - 24)), 90 + k);
      },
    });
    ctx.cover(p.x, p.u, p.w, p.h);
  }

  // ---- the blocks: signs and lit windows round the crossing and up Center-gai, offices and flats beyond
  for (const b of blocks(2900, 3900, 6, 8, true)) {
    const hot = b[1] > 3140 && b[1] < 3640;
    for (const [x, u, w, h] of lots(b, rand, hot ? { depth: [14, 22], width: [10, 18], small: true } : { depth: [12, 18], width: [9, 16], small: true })) {
      if (w < 6 || h < 7) continue;
      const v = rand();
      if (hot) building(x, u, w - 1, h, { style: pick(['neon', 'neon', 'office', 'glass']), wall: pick([0x4a4654, 0x5a5460, 0x3e4250, 0x54504c, 0xcfc8bc]), face: 7 + Math.floor(rand() * 8), shop: true, sign: rand() < 0.8 });
      else if (v < 0.75) building(x, u, w - 1, h, { style: pick(['office', 'balcony', 'plain', 'glass', 'office']), face: 5 + Math.floor(rand() * 7), shop: rand() < 0.6, sign: rand() < 0.5, heli: 0.1 });
      else if (v < 0.9) house(x, u, w - 1, h - 1, { hip: rand() < 0.6, lantern: rand() < 0.2 });
      else {
        pave(x, u, w - 1, h - 1, 'asphalt');
        for (let i = 3; i < w - 3; i += 4) if (rand() < 0.6) car(x + i, u + h - 5, true);
        mark(x + 1, u + h - 1, (X, Y) => kit.lamp(X, Y));
      }
    }
  }
  for (const [x, u, w, h] of blocks(2900, 3900, 4, 5, true)) {
    if (w >= 7 && h >= 8) building(x, u, w - 1, Math.min(h, 16), { style: pick(['plain', 'neon']), face: 4 + Math.floor(rand() * 3), shop: true, sign: rand() < 0.6 });
    else {
      pave(x, u, w - 0.67, h - 0.67, 'park');
      tree(pick(['broadleaf', 'tiny']), x + w / 2, u + h / 2, 1.6 + rand());
    }
  }

  // ---- the avenues: lamps down both pavements, people along them, cars held further back from the crossing
  for (let u = 2998; u < 3896; u += 22) {
    if (u > 3300 && u < 3400) continue;
    const hw = u < 3420 ? 10.4 : 8.4;
    if (!(u > 2990 && u < 3150)) mark(90 + hw, u, (X, Y) => kit.lamp(X, Y));
    mark(90 - hw, u + 11, (X, Y) => kit.lamp(X, Y));
  }
  for (let x = 6; x < 176; x += 22) {
    if (x > 44 && x < 136) continue;
    mark(x, 3360.4, (X, Y) => kit.lamp(X, Y));
    mark(x + 11, 3339.6, (X, Y) => kit.lamp(X, Y));
  }
  crowd(80, 3000, 1.5, 310, 60, WET);
  crowd(98.2, 3150, 1.5, 160, 30, WET);
  crowd(0, 3358.3, 54, 1.4, 22, WET);
  crowd(126, 3340.2, 20, 1.4, 10, WET);
  crowd(82.2, 3424, 1.4, 470, 60, WET);
  crowd(96.3, 3424, 1.4, 470, 60, WET);
  for (let k = 0; k < 9; k++) {
    car(84.6 + (k % 2) * 3.2, 3000 + k * 31 + rand() * 8, true, undefined, false);
    car(91.6 + (k % 2) * 2.8, 3430 + k * 50 + rand() * 12, true, undefined, true);
    if (k < 8) car(85.6 + (k % 2) * 2.8, 3440 + k * 55 + rand() * 12, true, undefined, false);
  }

  // ---- the rain: every street, the square and the crossing wet - darker, and holding the lights above them
  kit.after(({ d, FW, FH, raised, glowing }) => {
    const seen = new Uint8Array(FW * FH);
    const ease = (a, b, x) => Math.max(0, Math.min(1, (x - a) / (b - a)));
    const wet = (x, u, X, Y) => {
      const i = Y * FW + X;
      if (seen[i] || raised[i] || glowing[i]) return null;
      seen[i] = 1;
      const k = ease(2930, 3000, u) * (1 - ease(3820, 3900, u));
      if (k <= 0) return null;
      const o = i * 4;
      let [r, g, b] = [d[o] * (1 - 0.2 * k), d[o + 1] * (1 - 0.18 * k), d[o + 2] * (1 - 0.1 * k)];
      // the lights that stand up the strip from here, run down into the wet
      const jx = Math.round((hashPx(X, Y >> 1, 3) - 0.5) * 2);
      for (let q = 1; q <= 20; q++) {
        const s = (Y - 3 - q * 3) * FW + X + jx;
        if (s < 0 || !glowing[s]) continue;
        const f = 0.11 * k * (1 - q / 21);
        r += d[s * 4] * f;
        g += d[s * 4 + 1] * f;
        b += d[s * 4 + 2] * f;
      }
      if (hashPx(X >> 1, Y >> 3, 7) < 0.07 * k) [r, g, b] = [r * 1.12 + 6, g * 1.12 + 8, b * 1.12 + 14]; // the sky in it, here and there
      return (Math.min(255, Math.round(r)) << 16) | (Math.min(255, Math.round(g)) << 8) | Math.min(255, Math.round(b));
    };
    for (const r of ROADS) {
      if (r.cls === 'express' || r.cls === 'arcade' || r.cls === 'deck') continue;
      const us = r.pts.map((q) => q[1]);
      if (Math.max(...us) < 2930 || Math.min(...us) > 3900) continue;
      const reach = r.w / 2 + (r.cls === 'avenue' ? 2 : r.cls === 'street' ? 1.34 : 0);
      ctx.along(r.pts, reach, (n, x, u, X, Y) => wet(x, u, X, Y));
    }
    ctx.paint(56, 3316, 124, 3384, wet);
    ctx.paint(100, 3150, 176, 3296, wet);
  });
  void near;
  void L;
}
