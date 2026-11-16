// Akihabara (u 6050-7200), at night: the brightest stretch of the flight. Nothing here is anyone's mark or
// character - the screens show pictures of their own, the signs are strokes.
//   the Kanda river under its bridge, the brick arcades of Manseibashi along the bank, tables on their deck;
//   the house with the screen (a boxy creature walking across it), the game arcade - floor on floor of machines
//     behind glass, a stick and buttons the size of a lorry on its roof; the parts shops under a forest of aerials;
//   the station where the line across passes over the line along, a vault of glass over each; the stalls packed
//     under the viaduct beside it, a bulb over every one;
//   the hall of capsule machines, a capsule on its roof; the cafés in pink, mint and lilac, girls in aprons out
//     in the lane with leaflets; the signs of the north end.
// Live: fourteen screens, signs that blink, fill and chase, machines winking behind glass, the trains of two
// lines along and one across, cars on Chūō-dōri.
import { lots } from './blocks.mjs';
import { PAL, shade, blend } from './kit.mjs';
import { makeNeon } from './neon.mjs';
import { hashPx } from '../hires.mjs';

export function akihabara(ctx) {
  const { kit, blocks, pave, plot, claim, props, RAILS, S } = ctx;
  const { building, house, tree, crowd, mark, ground, rand, pick, P, R, E, ER, halo, FX, FY, car, LIT } = kit;
  kit.setSun(0.1);
  const N = makeNeon(ctx);
  const lampAt = (x, u, c) => mark(x, u, (X, Y) => kit.lamp(X, Y, c));
  /** A drinks machine against a wall: a lit front, its glow on the lane. */
  const vend = (x, u, k = 0) =>
    mark(x, u, (X, Y) => {
      const c = [0xf4f8ff, 0xff5a48, 0x58a8ff, 0xfff0a0][k % 4];
      R(X, Y - 5, 3, 5, 0x3a3e48);
      ER(X, Y - 5, 3, 3, c);
      P(X + 1, Y - 1, 0xc8ccd0);
      halo(X + 1, Y + 1, 7, 6, c, 0.24);
    });
  const disc = (X, Y, r, col) => {
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (Math.hypot(i, j) <= r + 0.3) P(X + i, Y + j, col(i, j, Math.hypot(i, j)));
  };

  // floors of game machines behind glass: a band of the house's colour, then a row of screens, then the cabinets
  kit.WALLS.arcade = (o) => (i, j, w, h, s) => {
    const fj = j % 12;
    if (fj < 3) return LIT | (fj === 1 && i % 4 < 2 ? 0xfff0e0 : o.wall);
    if (i % 6 === 5) return LIT | 0xffe8b8;
    if (fj < 8) return LIT | [0x60e0ff, 0xff70b0, 0xfff060, 0x70f090, 0xb080ff][Math.floor(hashPx(Math.floor(i / 6), Math.floor(j / 12), s) * 5)];
    return fj === 11 ? 0x1c1a24 : 0x34303c;
  };
  // rows of capsule machines: a white box, a window full of capsules above, the slot and the chute below
  kit.WALLS.gacha = (o) => (i, j, w, h, s) => {
    const [ci, cj] = [i % 6, j % 9];
    if (ci === 5 || cj === 8) return 0x5a5e68;
    if (cj < 4) return LIT | (hashPx(i, j, s) < 0.55 ? PAL.sign[Math.floor(hashPx(i >> 1, j >> 1, s + 3) * PAL.sign.length)] : 0xf4f8ff);
    if (cj === 5 && ci >= 1 && ci <= 3) return 0x2a2a30;
    return cj === 7 ? 0xc8ccd4 : 0xf0f2f4;
  };

  // ---- the bridge over the Kanda: stone parapets, a lamp at each corner; the brick arcades along the far bank
  ground(() => {
    for (const x of [80.6, 98.8]) {
      R(FX(x), FY(6166), 2, (6166 - 6124) * S, 0xb4b0a4);
      R(FX(x) + 2, FY(6166), 1, (6166 - 6124) * S, 0x5a5850);
    }
  });
  for (const u of [6126, 6164]) for (const x of [80, 100]) lampAt(x, u, 0xffe8b0);
  {
    const p = plot('manseibashi');
    building(p.x, p.u, p.w, p.h, {
      face: 5, style: 'brick', wall: 0xa8483a, roof: 0x8a7a60, s: 1401, lit: 0.9,
      top: ({ X, Y, w, h, parasol, person, R: rect, E: lit }) => {
        for (let i = 0; i < w; i += 4) rect(X + i, Y, 1, h, 0x74664e); // the deck's boards
        for (let k = 0; k * 20 + 8 < w; k++) {
          parasol(X + 8 + k * 20, Y + h - 6, PAL.awning[k % 8]);
          person(X + 14 + k * 20, Y + h - 8, 40 + k);
          person(X + 2 + k * 20, Y + 3, 60 + k);
        }
        for (let i = 2; i < w; i += 9) lit(X + i, Y, 0xffe8b0); // lamps along the rail over the water
      },
    });
    halo(FX(p.x + p.w / 2), FY(p.u) + 6, p.w * S * 0.5, 12, 0xffb060, 0.22);
    crowd(p.x, p.u + p.h + 1, p.w, 2, 14);
  }

  // ---- the house with the screen
  {
    const p = plot('akiba_gamen');
    building(p.x, p.u, p.w, p.h, {
      face: 34, style: 'plain', wall: 0x2c2a3a, roof: 0x5a5e6a, shop: true, s: 1410, lit: 0.9,
      top: ({ X, Y, w, h, ac: unit, tank, hut, mast }) => {
        mast(X + 10, Y + 30, 22);
        mast(X + w - 12, Y + 26, 16);
        for (let k = 0; k < 12; k++) unit(X + 6 + (k % 6) * 7, Y + h - 20 + Math.floor(k / 6) * 7);
        hut(X + w - 22, Y + 34, 12, 6, 0x5a5e6a);
        tank(X + 12, Y + 46, 5);
        tank(X + 26, Y + 46, 5);
      },
    });
    N.screen(p.x + 2, p.u + 33, 28, 28, 0, p.u, 8, 6);
    N.screen(p.x + 2, p.u + p.h - 1, 28, 4, 6, p.u, 8, 8); // (a ticker along the roof's far edge)
    crowd(p.x, p.u - 5, p.w, 4, 14);
  }

  // ---- the game arcade
  {
    const p = plot('akiba_geemu');
    building(p.x, p.u, p.w, p.h, {
      face: 30, style: 'arcade', wall: 0xe02838, roof: 0x70747c, shop: true, s: 1420, lit: 0.9,
      top: ({ X, Y, w, h, ac: unit, tank, hut, R: rect, E: lit }) => {
        // a stick and six buttons, the size of a lorry
        const [bx, by] = [X + (w >> 1) - 22, Y + 70];
        for (let k = 1; k <= 5; k++) for (let i = 0; i < 44; i++) ctx.img.hi.tint(bx + i + k, by + 31 + k, 0.72);
        rect(bx, by, 44, 28, 0x24222c);
        rect(bx, by, 44, 2, 0x4a4854);
        rect(bx, by + 28, 44, 4, 0x14121a);
        rect(bx + 9, by - 10, 3, 20, 0xb0b4bc);
        disc(bx + 10, by - 14, 7, (i, j, d) => (d > 6 ? 0x8a1420 : i + j < -4 ? 0xff9098 : 0xe02838));
        for (let k = 0; k < 6; k++) {
          const [cx, cy] = [bx + 23 + (k % 3) * 7, by + 8 + Math.floor(k / 3) * 10];
          const c = [0xfff060, 0x60e0ff, 0xff70b0, 0x70f090, 0xffffff, 0xff9040][k];
          for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (Math.abs(i) + Math.abs(j) < 4) lit(cx + i, cy + j, c);
        }
        for (let k = 0; k < 16; k++) unit(X + 6 + (k % 8) * 7, Y + h - 22 + Math.floor(k / 8) * 7);
        for (let k = 0; k < 3; k++) tank(X + 10 + k * 14, Y + 124, 5);
        hut(X + w - 24, Y + 118, 14, 7, 0x70747c);
        hut(X + 8, Y + 26, 12, 6, 0x70747c);
      },
    });
    N.screen(p.x + 3, p.u + 29, 28, 9, 9, p.u, 8, 8);
    N.twinkle(p.x + 0.34, p.u + 19, 33, 16, { cw: 6, ch: 12, ox: 1, oy: 4, p: 0.45, seed: 11 });
    N.screen(p.x + 3, p.u + p.h - 1, 28, 12, 1, p.u, 6, 6); // (a board on the roof's far edge)
    N.sign('chase', p.x + 9, p.u + 5.4, 16, 2.4, 0xf0c020, p.u);
    crowd(p.x, p.u - 5, p.w, 4, 22);
  }

  // ---- the parts shops: three in a row, aerials, dishes and drums of cable on their roofs
  {
    const p = plot('akiba_denki');
    for (let k = 0; k < 3; k++) {
      const u = p.u + k * 36;
      building(p.x, u, p.w, 35, {
        face: 10 + k * 2, style: 'neon', wall: 0x54504c, roof: [0x7a7670, 0x848c8e, 0x70747c][k], shop: true, sign: [0xf0c020, 0x2a6ad0, 0xe03a3a][k], s: 1430 + k, lit: 0.8,
        top: ({ X, Y, w, h, mast, ac: unit, R: rect }) => {
          for (let q = 0; q < 5; q++) mast(X + 5 + q * 11, Y + 22 + ((q * 7) % 12), 10 + ((q * 5) % 9));
          // an aerial of rods on a pole, and another
          for (const [ax, ay] of [[12, 46], [w - 16, 40]]) {
            rect(X + ax, Y + ay - 14, 1, 14, 0x9aa0a8);
            for (let q = 0; q < 5; q++) rect(X + ax - 5 + q, Y + ay - 14 + q * 2, 11 - q * 2, 1, 0xc8ccd0);
          }
          disc(X + (w >> 1), Y + 54, 5, (i, j, d) => (d > 4 ? 0x6a6e76 : i + j < 0 ? 0xe4e8ec : 0xb4b8c0)); // a dish
          P(X + (w >> 1), Y + 54, 0x3a3e48);
          for (let q = 0; q < 3; q++) disc(X + 8 + q * 9, Y + h - 12, 3, (i, j, d) => (d < 1.2 ? 0x3a2a20 : d > 2.4 ? 0x8a5a30 : [0xd04848, 0x4870c8, 0xe8c040][q])); // drums of cable
          for (let q = 0; q < 4; q++) unit(X + w - 28 + q * 7, Y + h - 12);
        },
      });
      N.sign(k === 1 ? 'stack' : 'blink', p.x + 1 + k * 5, u + 10 + k * 2 - 0.4, 2, 6, [0x20a060, 0xd040a0, 0xf07a20][k], u);
    }
    N.screen(p.x + 6, p.u + 9, 12, 5, 7, p.u, 6, 6);
    crowd(p.x, p.u - 4, p.w, 3, 8);
  }

  // ---- the station: the line across over the line along, glass over both
  {
    const p = plot('akiba_eki');
    claim(110, 6500, 34, 30);
    pave(110, 6500, 34, 30, 'plaza', 151);
    building(p.x, p.u, p.w, p.h, {
      face: 7, style: 'glass', glass: [0x2a3a58, 0x8eaed4], roof: 0x70747c, shop: true, s: 1440, lit: 0.8,
      top: ({ X, Y, w, h, ac: unit, hut, solar, E: lit, R: rect }) => {
        const vault = (x0, y0, vw, vh, along) => {
          for (let j = 0; j < vh; j++)
            for (let i = 0; i < vw; i++) {
              const [a, b, bl] = along ? [j, i, vw] : [i, j, vh];
              const t = Math.abs(b - bl / 2) / (bl / 2);
              const rib = a % 9 === 0 || b === 0 || b === bl - 1 || Math.abs(b - bl / 2) < 1;
              const c = rib ? 0xdfe6ea : blend(0xbfe0e8, 0x587890, t);
              if (!rib && (a * 3 + b) % 11 < 5) lit(x0 + i, y0 + j, blend(c, 0xffeab0, 0.6));
              else rect(x0 + i, y0 + j, 1, 1, c);
            }
        };
        vault(FX(146), Y + 2, FX(166) - FX(146), h - 4, true); // over the platforms of the line along
        vault(X + 2, FY(6578), FX(144) - X - 2, FY(6562) - FY(6578), false); // over those of the line across
        solar(X + 6, Y + 8, 60, 18);
        for (let k = 0; k < 14; k++) unit(X + 6 + (k % 7) * 7, Y + 36 + Math.floor(k / 7) * 7);
        hut(X + 70, Y + 10, 14, 7, 0x70747c);
        for (let k = 0; k < 10; k++) unit(X + 6 + (k % 5) * 7, Y + h - 20 + Math.floor(k / 5) * 7);
        hut(X + 60, Y + h - 28, 14, 7, 0x70747c);
        for (let k = 0; k < 6; k++) unit(FX(168) + (k % 2) * 7, Y + 20 + Math.floor(k / 2) * 50);
      },
    });
    ctx.cover(p.x, p.u, p.w, p.h);
    N.sign('blink', p.x + 6, p.u + 6.6, 20, 3, 0x2a6ad0, p.u);
    N.screen(p.x + 2, 6529, 10, 6, 13, 6500, 8, 4);
    // the square before it: taxis, trees in tubs, lamps, people coming and going
    for (let k = 0; k < 4; k++) car(113 + k * 6, 6503, false, k % 2 ? 0xe8c020 : 0x2a6a4a);
    for (const [x, u] of [[114, 6524], [140, 6524], [114, 6510], [140, 6510]]) lampAt(x, u, 0xffe8b0);
    for (const x of [120, 127, 134]) tree('broadleaf', x, 6518, 1.8);
    crowd(111, 6502, 32, 26, 60);
    // the trains: two lines along, each way, turning back at Tokyo Station; one across
    const run = RAILS.find((r) => r.id === 'yamanote_kita').pts;
    const south = [...run].reverse();
    south[south.length - 1] = [156, 6020];
    for (const [off, band, s0, sp] of [[2.5, 0x8cc63c, 0.1, 40], [-2.5, 0x8cc63c, 0.6, 38], [7.5, 0x40a8e0, 0.35, 44], [-7.5, 0x40a8e0, 0.85, 42]])
      kit.trainOn(kit.offset(south, off), band, { n: 7, sp, s0, u: 6800, mode: 'pp', hold: 6 });
    kit.train(6567.5, -1, 0xf0c820, { stop: 132, n: 6, s0: 0.2 });
    kit.train(6572.5, 1, 0xf0c820, { stop: 132, n: 6, s0: 0.7 });
    ctx.cover(81, 6563, 18, 14, -0.1); // (the viaduct over Chūō-dōri, shown again over the cars)
  }

  // ---- the stalls under the viaduct: six lanes of them, an awning and a bulb to each
  {
    const p = plot('akiba_gado');
    pave(p.x, p.u, p.w, p.h, 'paving', 152);
    for (let r = 0; r < 6; r++)
      for (let k = 0; k < 6; k++) {
        const [x, u] = [p.x + 1 + k * 7.4, p.u + 2 + r * 10.6];
        const c = PAL.awning[(r * 3 + k * 5) % 8];
        building(x, u, 6.6, 8, {
          face: 4, style: 'plain', wall: 0x4a4650, roof: c, shop: true, s: 1450 + r * 6 + k, lit: 1,
          top: ({ X, Y, w, h, R: rect }) => {
            for (let i = 0; i < w; i += 4) rect(X + i, Y, 2, h, 0xf4f0e8);
          },
        });
        mark(x + 3.3, u - 0.4, (X, Y) => {
          ER(X, Y - 1, 1, 1, 0xfff0c0);
          halo(X, Y + 2, 9, 7, 0xffd080, 0.3);
        });
      }
    for (let r = 0; r < 6; r++) crowd(p.x + 1, p.u + r * 10.6, p.w - 4, 1.6, 9);
    N.sign('chase', p.x + 8, p.u + p.h + 2.6, 28, 2.6, 0xe03a3a, p.u + p.h - 6);
  }

  // ---- the hall of capsule machines
  {
    const p = plot('akiba_gacha');
    building(p.x, p.u, p.w, p.h, {
      face: 17, style: 'gacha', wall: 0xf0f2f4, roof: 0x848c8e, s: 1460, lit: 0.9,
      top: ({ X, Y, w, h, ac: unit, hut, tank }) => {
        // a capsule the height of a house, lying on its side: teal one end, clear the other, a toy inside
        const [cx, cy] = [X + (w >> 1), Y + 62];
        for (let k = 1; k <= 6; k++) for (let i = -16; i <= 16; i++) ctx.img.hi.tint(cx + i + k, cy + 17 + k, 0.74);
        disc(cx, cy, 17, (i, j, d) => {
          if (d > 16) return 0x4a4e58;
          if (i < -1) return i + j < -14 ? 0xa0f0f8 : j > 8 ? 0x1c8aa0 : 0x28b0c8;
          return Math.hypot(i - 7, j - 1) < 5 ? (j < 0 ? 0xff80b0 : 0xf05090) : i + j < 2 ? 0xfdf6d8 : 0xe8d8a0;
        });
        for (let k = 0; k < 5; k++) disc(X + 12 + k * 18, Y + 104, 5, (i, j, d) => (d > 4.2 ? 0x4a4e58 : i < 0 ? [0xf0c020, 0x20a060, 0xd040a0, 0x7a40c0, 0xf07a20][k] : 0xfdf6d8));
        for (let k = 0; k < 14; k++) unit(X + 6 + (k % 7) * 7, Y + h - 22 + Math.floor(k / 7) * 7);
        hut(X + 8, Y + 22, 12, 6, 0x848c8e);
        tank(X + w - 14, Y + 26, 5);
      },
    });
    N.twinkle(p.x + 0.34, p.u + 17, 33, 14, { cw: 6, ch: 9, ox: 2, oy: 1, p: 0.3, seed: 23, colors: [0xffffff, 0xfff060, 0xff70b0, 0x60e0ff] });
    N.screen(p.x + 10, p.u + p.h - 1, 14, 12, 10, p.u, 8, 5);
    N.sign('stack', p.x + 2, p.u + p.h - 3, 2.4, 14, 0xd040a0, p.u);
    N.sign('stack', p.x + p.w - 4.4, p.u + p.h - 3, 2.4, 14, 0x20b0c0, p.u);
    crowd(p.x, p.u - 5, p.w, 4, 18);
  }

  // ---- the cafés: pink, mint, lilac; terraces on their roofs; girls in aprons with leaflets out in the lanes
  {
    const p = plot('akiba_kissa');
    const maid = (x, u, k) =>
      mark(x, u, (X, Y) => {
        ctx.img.hi.tint(X + 2, Y + 3, 0.7);
        ctx.img.hi.tint(X + 2, Y + 4, 0.7);
        P(X, Y - 1, 0xf8f8f8);
        P(X + 1, Y - 1, 0xf8f8f8);
        P(X, Y, [0x2a2228, 0x6a4a30, 0xd88898, 0x5a3a7a][k % 4]);
        P(X + 1, Y, PAL.skin[k % 3]);
        R(X, Y + 1, 2, 3, 0x2a2430);
        P(X + 1, Y + 2, 0xf8f8f8);
        P(X + 1, Y + 3, 0xf8f8f8);
        P(X + 2, Y + 1, 0xfff4c0); // (the leaflet held out)
      });
    for (let k = 0; k < 3; k++) {
      const u = p.u + k * 37;
      const c = [0xf0b8c8, 0xb8e0d0, 0xc8b8e8][k];
      building(p.x, u, p.w, 36, {
        face: 13, style: 'depato', wall: c, trim: [0xd04878, 0x3a9a80, 0x7a50c0][k], roof: 0x9a958a, shop: true, sign: [0xd040a0, 0x20a060, 0x7a40c0][k], s: 1470 + k, lit: 0.85,
        top: ({ X, Y, w, h, parasol, person, greenery, lamp, R: rect }) => {
          rect(X + 2, Y + 2, w - 4, h - 4, 0xc8b8a0); // the terrace
          greenery(X + 3, Y + 3, w - 6, 5, 40 + k);
          // a bed of flowers in the shape of a heart
          for (let j = -8; j <= 8; j++)
            for (let i = -9; i <= 9; i++) {
              const [hx, hy] = [i / 7.5, -j / 7.5 + 0.25];
              if ((hx * hx + hy * hy - 1) ** 3 - hx * hx * hy * hy * hy < 0) P(X + (w >> 1) + i, Y + 22 + j, hashPx(i, j, 50 + k) < 0.75 ? [0xf06890, 0xf8f0a0, 0xc890f0][k] : 0x4a8a44);
            }
          for (let q = 0; q < 6; q++) parasol(X + 9 + (q % 2) * (w - 20), Y + 16 + Math.floor(q / 2) * 12, [0xf8a0b8, 0xa0e0c8, 0xc8a8f0][k]);
          for (let q = 0; q < 7; q++) person(X + 6 + ((q * 29) % (w - 12)), Y + 38 + ((q * 11) % 14), 80 + q);
          lamp(X + 5, Y + h - 5);
          lamp(X + w - 6, Y + h - 5);
        },
      });
      N.screen(p.x + 4 + k * 6, u + 12, 12, 8, [11, 12, 8][k], u, 8, [5, 6, 8][k]);
      for (let q = 0; q < 2; q++) maid(36.6, u + 6 + q * 17 + k, k * 2 + q);
    }
    for (let q = 0; q < 5; q++) maid(7 + q * 6, 6766 + (q % 2), q + 1);
    crowd(4, 6763, 32, 5, 12);
    crowd(36, 6772, 2, 104, 14);
  }

  // ---- the north end: three houses of signs
  {
    const p = plot('akiba_kita');
    const walls = [0x3a3644, 0x4a4654, 0x343844];
    for (let k = 0; k < 3; k++) {
      const u = p.u + k * 37;
      const f = [18, 22, 14][k];
      building(p.x, u, p.w, 36, { face: f, style: 'neon', wall: walls[k], roof: 0x70747c, shop: true, s: 1480 + k, lit: 0.8 });
      N.screen(p.x + 2, u + f - 1, 14, 8, [4, 3, 5][k], u, 8, [8, 5, 4][k]);
      N.screen(p.x + 18, u + f - 1, 14, 8, [2, 13, 12][k], u, 8, [4, 3, 6][k]);
      N.sign(['chase', 'stack', 'blink'][k], p.x + 4, u + 35.4, 26, 3, [0xf0c020, 0x20b0c0, 0xe03a3a][k], u);
      N.sign('stack', p.x + 0.4 + k * 14, u + f - 9.6, 2, Math.min(8, f - 12), [0xd040a0, 0x20a060, 0xf07a20][k], u);
    }
    crowd(p.x, p.u - 5, p.w, 4, 16);
  }

  // ---- Chūō-dōri: lamps down both pavements, people along them, cars; the avenue that crosses it
  for (let u = 6060; u < 7196; u += 22) {
    if (Math.abs(u - 6900) < 12 || (u > 6120 && u < 6170) || Math.abs(u - 6570) < 10) continue;
    lampAt(98.6, u, 0xfff0d8);
    lampAt(81.4, u + 11, 0xfff0d8);
  }
  crowd(80.6, 6190, 1.6, 700, 190);
  crowd(97.8, 6190, 1.6, 700, 190);
  crowd(80.6, 6910, 1.6, 284, 50);
  crowd(97.8, 6910, 1.6, 284, 50);
  kit.traffic(86.3, 6056, 7446, { sp: 24, gap: 150, s0: 0.2 });
  kit.traffic(88.9, 6056, 7446, { sp: 19, gap: 230, s0: 0.7 });
  kit.traffic(93.7, 7446, 6056, { sp: 23, gap: 170, s0: 0.45 });
  kit.traffic(91.1, 7446, 6056, { sp: 18, gap: 250, s0: 0.9 });
  for (let x = 6; x < 178; x += 22) {
    if (Math.abs(x - 90) < 12 || Math.abs(x - 156) < 13) continue;
    lampAt(x, 6907.4);
    lampAt(x + 11, 6892.6);
  }
  for (let k = 0; k < 5; k++) {
    car(70 - k * 10, 6902.6 + (k % 2) * 2.8, false, undefined, true);
    car(110 + k * 7, 6896.4 + (k % 2) * 2.8, false, undefined, false);
  }
  crowd(0, 6907.2, 80, 1.4, 22);
  crowd(100, 6891.4, 44, 1.4, 12);
  // drinks machines in the lanes
  for (const [u, x0, x1] of [[6290, 2, 80], [6400, 2, 80], [6540, 2, 80], [6660, 2, 80], [6760, 44, 80], [6300, 100, 142], [6420, 100, 142], [6700, 100, 142], [6800, 100, 142], [7040, 2, 80], [7120, 2, 80], [6990, 100, 142], [7090, 100, 142], [6180, 2, 142]])
    for (let x = x0 + rand() * 8; x < x1; x += 7 + rand() * 12) vend(x, u + 2.4, Math.floor(rand() * 4));

  // ---- the blocks: houses of signs along the avenue, narrower and quieter away from it
  for (const b of blocks(6050, 7200, 6, 8, true)) {
    const hot = b[0] + b[2] > 40 && b[0] < 128;
    for (const [x, u, w, h] of lots(b, rand, hot ? { depth: [14, 24], width: [9, 16], small: true } : { depth: [12, 18], width: [8, 14], small: true })) {
      if (w < 6 || h < 7) continue;
      const v = rand();
      if (hot || v < 0.5) {
        const face = Math.min(h - 4, 7 + Math.floor(rand() * (hot ? 12 : 6)));
        building(x, u, w - 1, h, { style: pick(['neon', 'neon', 'neon', 'office', 'glass']), wall: pick([0x4a4654, 0x5a5460, 0x3e4250, 0x54504c, 0x403c4c]), face, shop: true, sign: rand() < 0.85 });
        const r = rand();
        if (hot && w >= 10 && h >= 14 && r < 0.3) N.sign(pick(['blink', 'stack', 'chase']), x + 1, u + h - 0.4, w - 3, 3, pick(PAL.sign), u);
        else if (hot && face >= 12 && r < 0.5) N.sign(pick(['blink', 'stack']), x + 0.6 + Math.floor(rand() * Math.max(1, w - 5)), u + face - 2, 2, Math.min(8, face - 5), pick(PAL.sign), u);
      } else if (v < 0.85) building(x, u, w - 1, h, { style: pick(['office', 'balcony', 'plain']), face: 5 + Math.floor(rand() * 6), shop: rand() < 0.5, sign: rand() < 0.4, heli: 0.1 });
      else if (v < 0.94) house(x, u, w - 1, h - 1, { hip: rand() < 0.6, lantern: rand() < 0.3 });
      else {
        pave(x, u, w - 1, h - 1, 'asphalt');
        for (let i = 3; i < w - 3; i += 4) if (rand() < 0.6) car(x + i, u + h - 5, true);
        lampAt(x + 1, u + h - 1);
      }
    }
  }
  for (const [x, u, w, h] of blocks(6050, 7200, 4, 5, true)) {
    if (w >= 7 && h >= 8) building(x, u, w - 1, Math.min(h, 16), { style: pick(['plain', 'neon']), face: 4 + Math.floor(rand() * 3), shop: true, sign: rand() < 0.6 });
    else {
      pave(x, u, w - 0.67, h - 0.67, 'park');
      tree(pick(['broadleaf', 'tiny']), x + w / 2, u + h / 2, 1.6 + rand());
    }
  }
  void E;
  void shade;
}
