// Fukuoka's own small things, drawn the same way wherever they stand (docs/plan-fukuoka.md):
//   yatai(x, u, o)     - a food stall seen from above at night: its cart under a canopy, the noren hung round three
//                        sides, a red paper lantern lit at the front, the counter with stools and people on them, the
//                        steam off its pot; o: { kind (ramen, oden, yakitori, gyoza, tempura, mentaiko), noren, queue }
//   ishigaki(x, u, w, h) - a castle's dry-stone wall face, its stones fitted in courses, lit from the upper left
//   lampsAlong(pts, every, side) - street lamps along a line
import { shade } from '../tokyo/kit.mjs';
import { hashPx } from '../hires.mjs';

const NOREN = [0xf0ece0, 0x2a3a6a, 0xc8302a, 0x3a2a24, 0xe8d8b0];

export function fukuokaParts(ctx) {
  const { kit, props, S } = ctx;
  const { P, R, E, ER, FX, FY, queue, shadowBox, halo, hi, person, lamp, mark, smoke } = kit;

  /** A food stall at (x, u) (its middle), its counter facing down the strip. */
  const yatai = (x, u, { kind = 'ramen', noren = null, queue: line = 0, seed = 0 } = {}) => {
    const [X, Y] = [FX(x), FY(u)];
    const s = seed || Math.floor(hashPx(X, Y, 5) * 1e6);
    const h = (a, b) => hashPx(X + a, Y + b, s);
    const nc = noren ?? NOREN[Math.floor(h(1, 1) * NOREN.length)];
    queue(Y + 6, () => {
      // the canopy: a sheet of canvas over its frame, a little slack between the poles
      for (let j = -9; j <= 3; j++)
        for (let i = -11; i <= 11; i++) {
          const sag = Math.abs(i) % 11 === 0 || j === -9 || j === 3 ? 0.9 : 1.04;
          E(X + i, Y + j, shade(0x8a7c64, sag * (j < -3 ? 1.06 : 0.94))); // (lit from under: it glows faintly)
        }
      for (const i of [-11, 11]) for (let j = -9; j <= 3; j++) P(X + i, Y + j, 0x5a4a3a);
      // the noren round its front: strips of cloth with the slits between them
      for (let i = -11; i <= 11; i++) for (let j = 4; j <= 6; j++) E(X + i, Y + j, i % 4 === 0 ? shade(nc, 0.5) : shade(nc, j === 4 ? 1.05 : 0.9)); // (the light through the cloth)
      // the counter of bare wood, stools before it, bowls and a pot on it; steam coming off
      ER(X - 10, Y + 7, 21, 2, 0xb08a5a);
      ER(X - 10, Y + 7, 21, 1, 0xd8b080);
      for (let i = -9; i <= 9; i += 4) R(X + i, Y + 10, 2, 2, 0x6a2a24);
      const ware = { ramen: 0xf0ece4, oden: 0xc8a050, yakitori: 0x8a4a2a, gyoza: 0xe8c890, tempura: 0xe8c060, mentaiko: 0xd84a4a }[kind] ?? 0xf0ece4;
      for (let i = -8; i <= 8; i += 5) P(X + i, Y + 7, ware);
      // the red lantern at its corner, lit
      ER(X + 10, Y + 3, 3, 4, 0xe03a2a);
      E(X + 11, Y + 4, 0xffb070);
      halo(X + 11, Y + 5, 9, 8, 0xff7040, 0.45);
      halo(X, Y + 9, 26, 14, 0xffc878, 0.42); // the light from under its canopy on the ground before it
      halo(X, Y - 3, 16, 10, 0xffd8a0, 0.2);
    }, () => shadowBox(X - 11, Y - 9, 23, 13, 3, 0.66));
    // its customers on the stools, a queue maybe, the steam
    for (let k = 0; k < 3 + Math.floor(h(3, 3) * 3); k++) mark(x - 3 + k * 1.3, u - 3.4, (PX, PY) => person(PX, PY, s + k));
    for (let k = 0; k < line; k++) mark(x + 4 + k * 1.6, u - 6 - (k % 2), (PX, PY) => person(PX, PY, s + 30 + k));
    smoke(x - 1, u + 1, { rate: 0.9, a: 0.32 });
  };

  /** A dry-stone wall's face on the fine box under (x, u, w, h): stones in courses, the joints dark, its top edge lit. */
  const ishigaki = (x, u, w, h, seed = 3) =>
    kit.ground(() => {
      const [X0, Y0, ww, hh] = [FX(x), FY(u + h), FX(x + w) - FX(x), FY(u) - FY(u + h)];
      for (let j = 0; j < hh; j++) {
        const course = Math.floor(j / 4);
        for (let i = 0; i < ww; i++) {
          const off = course % 2 ? 3 : 0;
          const st = Math.floor((i + off) / 7);
          const joint = j % 4 === 3 || (i + off) % 7 === 6;
          const v = hashPx(st, course, seed);
          let c = joint ? 0x4a463e : shade(0x9a958a, 0.82 + v * 0.3 - j / hh * 0.12);
          if (j === 0) c = 0xc8c4b8;
          P(X0 + i, Y0 + j, c);
        }
      }
    });

  /** Lamps along a line every `every` units, `side` units to one side of it. */
  const lampsAlong = (pts, every, side = 0, c = 0xfff0c8) => {
    let run = 0;
    for (let k = 0; k + 1 < pts.length; k++) {
      const [[ax, au], [bx, bu]] = [pts[k], pts[k + 1]];
      const len = Math.hypot(bx - ax, bu - au) || 1;
      const [nx, nu] = [-(bu - au) / len, (bx - ax) / len];
      for (; run < len; run += every) mark(ax + ((bx - ax) * run) / len + nx * side, au + ((bu - au) * run) / len + nu * side, (X, Y) => lamp(X, Y, c));
      run -= len;
    }
  };

  void props;
  void S;
  void hi;
  return { yatai, ishigaki, lampsAlong };
}
