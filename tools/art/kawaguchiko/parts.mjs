// Things drawn in more than one stretch of Kawaguchiko (on Tokyo's city kit, tools/art/tokyo/kit.mjs): a hipped roof
// (tiles or cypress bark), a torii, a stone lantern, utility poles and their wires, a fluttering nobori banner, bicycles.
import { PAL, shade } from '../tokyo/kit.mjs';

export const VERMILION = 0xc8402a;
export const GOLD = 0xe0b040;
export const CEDAR_BARK = 0x6a4a34; // (shrine roofs of cypress bark)

export function makeParts(ctx) {
  const { kit, props, S } = ctx;
  const { mark, P, R, FX, FY, queue, shadowBox, hi } = kit;
  /** A hipped roof seen from above on the fine box: four slopes lit from the upper left, its ridge and inked edge. */
  const roof = (X0, Y0, w, h, c, { ridge = true, ink = true, bark = false } = {}) => {
    const [cx, cy] = [(w - 1) / 2, (h - 1) / 2];
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const [dx, dy] = [(i - cx) / Math.max(1, cx), (j - cy) / Math.max(1, cy)];
        let f;
        if (Math.abs(dx) > Math.abs(dy)) f = dx < 0 ? 1.16 : 0.74; // the west slope lit, the east in shade
        else f = dy < 0 ? 1.04 : 0.88;
        let col = shade(c, f);
        if (ridge && Math.abs(Math.abs(dx) - Math.abs(dy)) < 0.07) col = shade(c, 1.3); // the hips
        if (bark) {
          // cypress bark laid in courses along the eaves: fine lines parallel to each slope's edge
          if (Math.abs(dx) > Math.abs(dy) ? i % 2 === 0 : j % 2 === 0) col = shade(col, 0.88);
        } else if ((i + j) % 3 === 0 && Math.abs(dx) <= Math.abs(dy)) col = shade(col, 0.94); // rows of tiles
        if (ink && (i === 0 || j === 0 || i === w - 1 || j === h - 1)) col = shade(c, 0.45);
        P(X0 + i, Y0 + j, col);
      }
  };
  /** A torii across a way, seen from above: its two posts at (x0, u) and (x1, u), the beams standing h over them. */
  const torii = (x0, x1, u, c, h = 4, big = false) => {
    const [X0, X1, Y] = [FX(x0), FX(x1), FY(u)];
    const up = Math.round(h * S);
    const t = big ? 3 : 2;
    queue(Y + 2, () => {
      for (const X of [X0, X1]) {
        R(X - 1, Y - up, t, up, shade(c, 0.85)); // the posts, seen leaning up the strip
        R(X - 1, Y - up, 1, up, shade(c, 1.15));
      }
      R(X0 - 4, Y - up - t - 1, X1 - X0 + 9, t + 1, c); // the kasagi, its ends flaring
      R(X0 - 4, Y - up - t - 1, X1 - X0 + 9, 1, shade(c, 1.3));
      R(X0 - 5, Y - up - t, 1, t, c);
      R(X1 + 5, Y - up - t, 1, t, c);
      R(X0 - 2, Y - up + 2, X1 - X0 + 5, 2, shade(c, 0.9)); // the nuki under it
      R(((X0 + X1) >> 1) - 1, Y - up - 1, 3, 3, shade(c, 0.7)); // the tablet between
    }, () => {
      shadowBox(X0 - 4, Y - 2, X1 - X0 + 9, 2, Math.round(up * 0.6), 0.7);
      for (const X of [X0, X1]) shadowBox(X - 1, Y - 1, t, 2, up, 0.72);
    });
  };
  /** A stone lantern (toro) at (x, u). */
  const toro = (x, u, lit = false) =>
    mark(x, u, (X, Y) => {
      R(X - 1, Y - 7, 4, 2, 0x8a8a84);
      R(X - 1, Y - 7, 4, 1, 0xb4b4ac);
      R(X, Y - 5, 2, 2, lit ? 0xf0d080 : 0x3a3a38);
      R(X, Y - 3, 2, 3, 0x7a7a74);
      R(X - 1, Y, 4, 1, 0x6a6a64);
      hi.tint(X + 3, Y - 2, 0.75);
      hi.tint(X + 3, Y - 1, 0.75);
    });
  /** A wooden utility pole at (x, u): its top with a cross-arm and a transformer can now and then. */
  const pole = (x, u, can = false) =>
    mark(x, u, (X, Y) => {
      for (let k = 1; k <= 8; k++) hi.tint(X + 1 + k, Y - 8 + Math.round(k * 1.2), 0.74); // its shadow
      R(X - 1, Y - 9, 2, 10, 0x9a9690); // a concrete pole, seen leaning up the strip
      R(X - 1, Y - 9, 1, 10, 0xc4c0b8);
      R(X - 4, Y - 10, 9, 1, 0x34343a); // the cross-arm and its insulators
      for (const i of [-4, 0, 4]) P(X + i, Y - 11, 0xe8e8e0);
      if (can) {
        R(X + 1, Y - 8, 3, 4, 0x8a9098);
        R(X + 1, Y - 8, 3, 1, 0xb8c0c8);
      }
    });
  /** Wires from pole to pole along the line at x, the poles' tops, u0 to u1. */
  const wires = (x, us) =>
    mark(x, us.at(-1), () => {
      for (let k = 0; k + 1 < us.length; k++) {
        const [Ya, Yb] = [FY(us[k]) - 9, FY(us[k + 1]) - 9];
        for (let Y = Yb; Y <= Ya; Y++) {
          const t = (Y - Yb) / Math.max(1, Ya - Yb);
          const sag = Math.round(Math.sin(t * Math.PI) * 2);
          P(FX(x) - 2 + sag, Y, 0x2a2a30);
          P(FX(x) + 2 + sag, Y, 0x2a2a30);
        }
      }
    }, 0);
  /** A nobori banner on its pole at (x, u), fluttering (three frames). */
  const NOBORI = (c) => [0, 1, 2].map((k) =>
    kit.frame(1.67, 4, 600, (put) => {
      for (let j = 0; j < 12; j++) put(0, j, 0x6a5a48);
      for (let j = 1; j < 10; j++)
        for (let i = 1; i < 5; i++) {
          const wave = Math.round(Math.sin(j * 0.8 + k * 2.1) * 0.6);
          put(i, j + wave, i === 1 ? shade(c, 0.8) : (j + i + k) % 4 === 0 ? 0xf4f0e8 : c);
        }
    }),
  );
  const nobori = (x, u, c) => props.loop(x, u, NOBORI(c), { fps: 3, d: 0.05 });
  const bikes = (X, Y, n) => {
    for (let k = 0; k < n; k++) {
      const c = PAL.cloth[(k * 7 + X) % PAL.cloth.length];
      R(X + k * 3, Y, 1, 5, 0x3a3a40);
      P(X + k * 3, Y + 1, c);
      P(X + k * 3, Y + 3, c);
    }
  };

  return { roof, torii, toro, pole, wires, nobori, bikes };
}
