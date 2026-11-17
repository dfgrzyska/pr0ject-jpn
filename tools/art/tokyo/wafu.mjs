// Things of old Japan shared by Tokyo's districts along the river (Asakusa, the Sumida): temple halls and gates
// under hipped roofs, stone lanterns, great paper lanterns and strings of small ones that sway, food stalls.
import { PAL, shade, blend } from './kit.mjs';
import { hashPx } from '../hires.mjs';

export const RED = 0xb8382a;
export const TILE = 0x4c5462;
export const COPPER = 0x4a8a70;
export const GOLD = 0xe8c040;
export const WARM = 0xffe8b0;

const boatRoof = (put, x0, y0, len, c) => {
  for (let j = 0; j < 9; j++)
    for (let i = 0; i < len; i++) {
      let col = shade(c, j < 4 ? 0.8 : 1.1);
      if (j === 4) col = shade(c, 1.4);
      if (i % 4 === 0) col = shade(col, 0.85);
      if (j === 0 || j === 8) col = i % 3 === 0 ? 0xff5038 : i % 3 === 1 ? 0xffe0a0 : shade(c, 0.5); // the lanterns along its eaves
      put(x0 + i, y0 + j, col);
    }
};
/** A pleasure boat under its lanterns, 44 x 14 fine pixels, its bow to the right: put(i, j, colour). */
export const yakata = (put, c, lit = 1) => {
  // (bow to the right) the hull, the long roof with lanterns down both eaves, a lamp at the bow
  for (let j = 0; j < 13; j++)
    for (let i = 0; i < 44; i++) {
      const taper = i > 34 ? (i - 34) * 0.62 : i < 3 ? (3 - i) * 0.8 : 0;
      if (Math.abs(j - 6) > 6 - taper) continue;
      put(i, j + 1, Math.abs(j - 6) > 5 - taper ? 0x2a2018 : (i + j) % 5 === 0 ? 0x5a4028 : 0x6a4c30);
    }
  boatRoof(put, 6, 3, 26, c);
  put(40, 7, lit ? 0xfff0a0 : 0x8a8478);
  put(41, 7, lit ? 0xffd060 : 0x6a6458);
  put(2, 6, PAL.cloth[c % 7]);
  put(2, 7, 0x2a2228);
};

export function makeWafu(ctx) {
  const { kit, props, S } = ctx;
  const { crowd, mark, rand, P, R, E, ER, halo, FX, FY, queue } = kit;
  const hi = ctx.img.hi;
  const lampAt = (x, u, c) => mark(x, u, (X, Y) => kit.lamp(X, Y, c));
  const lanternAt = (x, u, c) => mark(x, u, (X, Y) => kit.lantern(X, Y, c));
  const disc = (X, Y, r, col, ry = r) => {
    for (let j = -ry; j <= ry; j++) for (let i = -r; i <= r; i++) if (Math.hypot(i / r, j / ry) <= 1.02) P(X + i, Y + j, col(i, j, Math.hypot(i / r, j / ry)));
  };
  const discE = (X, Y, r, col, ry = r) => {
    for (let j = -ry; j <= ry; j++) for (let i = -r; i <= r; i++) if (Math.hypot(i / r, j / ry) <= 1.02) E(X + i, Y + j, shade(col(i, j, Math.hypot(i / r, j / ry)), 0.82));
  };
  const drop = (X, Y, w, n = 2) => {
    for (let k = 1; k <= n; k++) for (let i = 0; i < w; i++) hi.tint(X + i + k, Y + k, 0.72);
  };
  /** A stone lantern, its flame lit. */
  const toro = (x, u) =>
    mark(x, u, (X, Y) => {
      drop(X - 1, Y, 4);
      R(X - 1, Y - 1, 4, 2, 0x8a8a84);
      R(X, Y - 5, 2, 4, 0xa4a49c);
      ER(X, Y - 7, 2, 2, 0xffd880);
      R(X - 1, Y - 9, 4, 2, 0x9a9a92);
      P(X, Y - 10, 0x7a7a74);
      halo(X + 1, Y - 5, 8, 8, 0xffc070, 0.22);
    });

  /**
   * A hall or a gate of a temple on (x, u, w, h): a hipped roof of tiles with its ridge, and under the eave the
   * south wall `face` high - pillars between `bays`, plaster between them, the `open` bays dark and lit from
   * inside. flood: lit up for the night. over / rank: a storey standing on another (see kit.house).
   */
  const temple = (x, u, w, h, o = {}) => {
    const { tile = TILE, wall = RED, panel = 0xe8e0d0, face = 3, bays = 3, open = [], over, rank = 1, flood = true, ridge = 0.42, trim = GOLD } = o;
    const [X0, X1, YT, YB] = [FX(x), FX(x + w), FY(u + h), FY(u)];
    const fh = Math.round(face * S);
    const [bw, rh] = [X1 - X0, YB - YT - fh];
    const mid = Math.round(rh * ridge);
    queue(over === undefined ? YB : FY(over) + rank, () => {
      for (let j = 0; j < rh; j++)
        for (let i = 0; i < bw; i++) {
          const e = Math.min(i, bw - 1 - i);
          const off = Math.abs(j - mid);
          const hip = e < off * 0.9;
          let c = hip ? shade(tile, i < bw / 2 ? 1.1 : 0.7) : shade(tile, j < mid ? 0.8 : 1.22 - ((j - mid) / Math.max(1, rh - mid)) * 0.24);
          if ((hip ? j : i) % 3 === 0) c = shade(c, 0.87);
          if (rh > 60) {
            // a great roof: the courses of its tiles, the light of the court lying along its lower slope
            if (!hip && j % 9 === 4) c = shade(c, 0.86);
            if (!hip && j > mid) c = shade(c, 1 + 0.5 * Math.max(0, (j - mid) / (rh - mid) - 0.45));
          }
          if (Math.abs(e - off * 0.9) < 1) c = shade(tile, 1.36); // the hips
          if (!hip && (j === mid || j === mid - 1)) c = shade(tile, j === mid ? 1.55 : 0.6); // the ridge
          const rim = Math.min(i, j, bw - 1 - i, rh - 1 - j);
          if (rim === 0) c = shade(tile, 0.42);
          else if (j === rh - 2 && i % 2) c = shade(trim, 0.8); // the rafters' ends under the eave
          P(X0 + i, YT + j, c);
        }
      for (const i of [1, bw - 3]) R(X0 + i, YT + mid - 2, 2, 4, trim); // the ridge's ends
      const [wx, ww] = [X0 + 2, bw - 4];
      const bayW = ww / bays;
      for (let j = 0; j < fh; j++)
        for (let i = 0; i < ww; i++) {
          const b = Math.min(bays - 1, Math.floor(i / bayW));
          const bi = i - Math.round(b * bayW);
          const pillar = bi < 2 || i >= ww - 2;
          let c;
          let lit = flood;
          if (j === fh - 1) [c, lit] = [PAL.ink, false];
          else if (j < 2) [c, lit] = [shade(wall, j ? 0.72 : 0.5), false]; // (the beam in the eave's shadow)
          else if (pillar) c = shade(wall, bi === 0 ? 1.12 : 0.96);
          else if (open.includes(b)) [c, lit] = [blend(0x2a1a16, 0xffb060, 0.2 + 0.25 * (j / fh)), true];
          else c = j === 2 || j === fh - 2 ? shade(wall, 0.86) : shade(panel, 0.9);
          (lit ? E : P)(wx + i, YB - fh + j, lit && !open.includes(b) ? shade(c, 0.9) : c);
        }
      if (flood) halo(X0 + bw / 2, YB - fh / 2, bw * 0.7, fh + 12, 0xffb070, 0.22);
    }, () => kit.shadowBox(X0, YT, bw, YB - YT, 3, 0.64));
  };

  // ---- paper lanterns that sway: the great ones of the gates, and strings of small ones across a street
  const cache = new Map();
  /** A great lantern w x h hanging with its top-left at (x, u). */
  const chochin = (x, u, w, h, c = 0xd8301c, { ph, band = 0x1c1a20, glyph = true } = {}) => {
    const [fw, fh] = [Math.round(w * S), Math.round(h * S)];
    const key = `c|${fw}|${fh}|${c}`;
    if (!cache.has(key))
      cache.set(key, [-1, 0, 1, 0].map((sw) =>
        kit.frame((fw + 2) / S, fh / S, 0, (put) => {
          for (let j = 0; j < fh; j++) {
            const t = j / (fh - 1);
            const cap = j < 2 || j >= fh - 2;
            const half = cap ? Math.max(2, Math.round(fw * 0.3)) : Math.round((fw / 2) * (0.8 + 0.2 * Math.sin(t * Math.PI)));
            const dx = 1 + Math.round(sw * t) + (fw >> 1);
            for (let i = -half; i < half; i++) {
              let col;
              if (cap) col = j === 0 || j === fh - 1 ? band : shade(GOLD, 0.9);
              else {
                col = shade(c, 1.3 - (Math.abs(i + half * 0.25) / half) * 0.55);
                if (j % 3 === 2) col = shade(col, 0.84); // the ribs
                if (glyph && Math.abs(i) < half * 0.5 && t > 0.24 && t < 0.78 && (i % 3 === 0 || (j % 4 === 1 && hashPx(i, j, fw) < 0.8))) col = 0x1c1418; // (writing, as strokes)
              }
              put(dx + i, j, col);
            }
          }
        }, true)));
    props.loop(x - 1 / S, u, cache.get(key), { fps: 2.2, ph: ph ?? rand(), d: 0.2 });
    halo(FX(x + w / 2), FY(u - h / 2), fw * 1.5, fh * 1.3, blend(c, 0xffc080, 0.4), 0.3);
  };
  /** A string of small lanterns from (x, u), w long, sagging a little. */
  const string = (x, u, w, cols, ph = rand()) => {
    const fw = Math.round(w * S);
    const key = `s|${fw}|${cols.join()}`;
    if (!cache.has(key))
      cache.set(key, [0, 1, 0, -1].map((sw) =>
        kit.frame((fw + 2) / S, 2, 0, (put) => {
          const sag = (i) => Math.round(Math.sin((i / (fw - 1)) * Math.PI) * 1.4);
          for (let i = 0; i < fw; i++) put(i + 1, sag(i), 0x2a2228);
          for (let k = 0, i = 2; i + 2 < fw; i += 5, k++) {
            const c = cols[k % cols.length];
            const y = sag(i) + 1;
            put(i + 1, y, shade(c, 1.2));
            put(i + 2, y, c);
            for (let q = 1; q < 3; q++) {
              put(i + 1 + sw, y + q, q === 1 ? blend(c, 0xffe0a0, 0.45) : shade(c, 0.8));
              put(i + 2 + sw, y + q, q === 1 ? c : shade(c, 0.7));
            }
          }
        }, true)));
    props.loop(x - 1 / S, u, cache.get(key), { fps: 2.5, ph, d: 0.2 });
    halo(FX(x + w / 2), FY(u) + 3, fw * 0.75, 9, cols[0], 0.16);
  };

  // ---- a food stall: an awning, a lit front, something cooking, people eating beside it
  const yatai = (x, u, k, special) => {
    const awn = special ? 0xe8b030 : PAL.awning[(k * 3) % PAL.awning.length];
    mark(x, u, (X, Y) => {
      drop(X, Y + 1, 24, 2);
      for (let j = 0; j < 12; j++)
        for (let i = 0; i < 24; i++) P(X + i, Y - 18 + j, i === 0 || i === 23 || j === 0 ? shade(awn, 0.5) : j === 11 ? shade(awn, 0.7) : Math.floor(i / 3) % 2 ? awn : 0xf4f0e8);
      ER(X + 1, Y - 6, 22, 5, 0xffdc98); // the front, lit
      for (let i = 2; i < 22; i += 3) E(X + i, Y - 4, [0xd8a850, 0x8a5a38, 0xf0e0c0, 0xe84030][(i + k) % 4]); // what is cooking
      R(X + 1, Y - 1, 22, 1, 0x6a4a2a);
      R(X, Y, 24, 1, PAL.ink);
      for (let i = 3; i < 22; i += 6) kit.lantern(X + i, Y - 9, k % 2 ? 0xe0402a : 0xfff0d0);
      if (special) {
        // the stall that bakes fish of batter: a golden fish for a sign, the iron mould open on the counter
        for (let i = 0; i < 12; i++) for (let j = -2; j <= 2; j++) if (Math.abs(j) <= (i < 8 ? 2 - Math.abs(i - 4) * 0.4 : (i - 8) * 0.7)) E(X + 6 + i, Y - 22 + j, i === 2 && j === -1 ? 0x2a2228 : (i + j) % 2 ? 0xe8b040 : 0xc88a28);
        R(X + 8, Y - 3, 8, 2, 0x2a2a30);
        E(X + 9, Y - 3, 0xe8b040);
        E(X + 12, Y - 3, 0xe8b040);
      }
      halo(X + 12, Y + 5, 20, 12, 0xffd090, 0.26);
    });
    // a bench, people eating
    crowd(x + 0.4, u - 3.4, 7, 2, 2 + (k % 3));
  };
  return { lampAt, lanternAt, disc, discE, drop, toro, temple, chochin, string, yatai };
}
