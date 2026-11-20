// The city kit for Tokyo: what every district's file draws with (docs/plan-tokyo.md, phases 2-7). Seen from
// above in 3/4 view, like the other cities: a building is its roof with the wall that faces south under it, lit
// from the upper left, its shadow thrown to the lower right. Everything is drawn in fine pixels (a third of the
// game's), placed in the route's coordinates: x across, u up from the strip's bottom.
//
// Nothing is painted when it is asked for: each thing is queued with its shadow, and flush() lays every shadow
// on the ground first and then paints the things from the far end of the strip to the near one, so that a wall
// covers what stands behind it and no shadow falls on a roof.
import { rng } from '../../lib/raster.mjs';
import { HiCanvas, hashPx } from '../hires.mjs';
import { crownPixels } from '../nature.mjs';
import { puff } from '../props.mjs';

export const shade = (c, f) => {
  const k = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
  return (k((c >> 16) & 255) << 16) | (k((c >> 8) & 255) << 8) | k(c & 255);
};
export const blend = (a, b, t) => {
  const k = (s) => Math.round(((a >> s) & 255) + (((b >> s) & 255) - ((a >> s) & 255)) * t);
  return (k(16) << 16) | (k(8) << 8) | k(0);
};

// colours shared by the districts
export const PAL = {
  ink: 0x26222c,
  walls: [0xd8cfc0, 0xcfc8bc, 0xbdb6aa, 0xc8b8a4, 0xa8a49c, 0xd6d2c8, 0xb8a894, 0x9aa0a8, 0xc4a890, 0xe0d8c8],
  roofs: [0x8a8880, 0x7c7e84, 0x9a958a, 0x70747c, 0xa39c90, 0x848c8e, 0x7a7670, 0xa8a49c, 0x8c7c70, 0x6c7a74, 0xb0a898, 0x7c8494],
  tile: [0x626a78, 0x565c6c, 0x6e7480, 0x7c6050, 0x62726a, 0x525866, 0x8a6a54, 0x5e6670], // kawara: grey-blue, brown, weathered green
  glass: [0x2e3c50, 0x3a4c62, 0x506880, 0x7c9cb4],
  awning: [0xc03a30, 0x2a5a9a, 0x2e7a4a, 0xe0a030, 0x8a3a7a, 0xd86a2a, 0x3a3a44, 0x1a7a8a],
  sign: [0xe03a3a, 0xf0c020, 0x2a6ad0, 0x20a060, 0xf07a20, 0xd040a0, 0xf4f0e8, 0x20b0c0, 0x7a40c0],
  cars: [0xe8e8ec, 0x2a2a30, 0xc03a30, 0x3a5a9a, 0x9aa0a8, 0xe8d8a0, 0x4a4a52, 0xf0f0f0, 0x6a8a6a],
  cloth: [0xd04848, 0x4870c8, 0x48a868, 0xe8c040, 0xe8e8e8, 0x8858b8, 0xe88840, 0x38383c, 0xf0a0b8],
  skin: [0xf0c8a0, 0xe8b890, 0xd8a880],
};

/** kinds(kind, x, u, r): a stage may turn the trees it is asked for into its own (Kawaguchiko: autumn's); cloth: its
 * people's colours. */
export function makeKit({ img, W, L, S, seed, props, tod, kinds, cloth = PAL.cloth }) {
  const hi = img.hi;
  const FW = W * S;
  const FH = L * S;
  const rand = rng(seed);
  const pick = (a) => a[Math.floor(rand() * a.length)];
  const FX = (x) => Math.round(x * S);
  const FY = (u) => Math.round((L - u) * S); // the fine row at height u (rows grow down the strip)
  // What stands over the ground (1 where a queued thing was painted: a building, a tree, a car, a person), so
  // that what is done to the ground afterwards (a wet street's shine) leaves it alone.
  const raised = new Uint8Array(FW * FH);
  let marking = false;
  const P = (X, Y, c) => {
    hi.set(X, Y, c);
    if (marking && X >= 0 && Y >= 0 && X < FW && Y < FH) raised[Y * FW + X] = 1;
  };
  const R = (X, Y, w, h, c) => {
    hi.rect(X, Y, w, h, c);
    if (marking && X < FW && X + w > 0) for (let j = Math.max(0, Y); j < Math.min(FH, Y + h); j++) raised.fill(1, j * FW + Math.max(0, X), j * FW + Math.min(FW, X + w));
  };
  const objects = [];
  const shMask = new Uint8Array(FW * FH).fill(255);

  // ---- lights. The strip is graded for its hour after everything is painted; a light is a pixel that keeps its
  // colour through that (E), a glow added over the graded strip (halo), or anything else done then (after).
  // night(u): 0 by day .. 1 in full night, from the grade itself, so the lights come on as the strip darkens.
  const LIT = 0x1000000; // a wall's colour with this bit: a lit window
  const lights = []; // idx, colour, idx, colour, ...
  const halos = [];
  const afters = [];
  const glowing = new Uint8Array(FW * FH); // 1 where a light is (after the grade)
  const night = (u) => {
    const w = tod.white(Math.max(0, Math.min(L - 1, u)));
    return Math.max(0, Math.min(1, (0.9 - (w[0] + w[1] + w[2]) / 765) / 0.4));
  };
  const nightAt = (Y) => night(L - Y / S);
  const E = (X, Y, c) => {
    P(X, Y, c);
    if (X >= 0 && Y >= 0 && X < FW && Y < FH) lights.push(Y * FW + X, c);
  };
  const ER = (X, Y, w, h, c) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) E(X + i, Y + j, c);
  };
  /** A glow round the fine pixel (X, Y), rx by ry, of colour c, a strong in its middle. */
  const halo = (X, Y, rx, ry, c, a = 0.4) => halos.push([X, Y, rx, ry, c, a]);
  const after = (fn) => afters.push(fn);
  /** Before the grade: forget the lights something was painted over since. */
  const beforeGrade = () => {
    let n = 0;
    for (let k = 0; k < lights.length; k += 2) {
      const i = lights[k];
      if (hi.get(i % FW, Math.floor(i / FW)) !== lights[k + 1]) continue;
      lights[n++] = i;
      lights[n++] = lights[k + 1];
    }
    lights.length = n;
  };
  /** After the grade: the lights back at their own colour, the glows over them, then the rest. */
  const afterGrade = () => {
    for (let k = 0; k < lights.length; k += 2) {
      const i = lights[k];
      hi.set(i % FW, Math.floor(i / FW), lights[k + 1]);
      glowing[i] = 1;
    }
    const d = hi.data;
    for (const [X, Y, rx, ry, c, a] of halos) {
      const [cr, cg, cb] = [(c >> 16) & 255, (c >> 8) & 255, c & 255];
      for (let j = Math.max(0, Math.floor(Y - ry)); j <= Math.min(FH - 1, Math.ceil(Y + ry)); j++)
        for (let i = Math.max(0, Math.floor(X - rx)); i <= Math.min(FW - 1, Math.ceil(X + rx)); i++) {
          const q = ((i - X) / rx) ** 2 + ((j - Y) / ry) ** 2;
          const o = (j * FW + i) * 4;
          if (q >= 1 || !d[o + 3]) continue;
          const k = a * (1 - q) ** 2;
          d[o] = Math.min(255, d[o] + cr * k);
          d[o + 1] = Math.min(255, d[o + 1] + cg * k);
          d[o + 2] = Math.min(255, d[o + 2] + cb * k);
        }
    }
    for (const fn of afters) fn({ d, FW, FH, raised, glowing });
  };
  // lights lying on open water (the strip is clear there): streaks painted after the grade, part see-through,
  // over the far layer's water
  const glints = [];
  /** A light's reflection on open water: a broken streak len fine pixels down from (X, Y). */
  const glint = (X, Y, len, c, a = 0.8) => glints.push([X, Y, len, c, a]);
  afters.push(({ d }) => {
    for (const [X, Y, len, c, a] of glints)
      for (let j = 0; j < len; j++) {
        if (j % 4 === 3) continue;
        const x = X + Math.round(Math.sin(j * 0.7 + X) * 0.8);
        const y = Y + j;
        if (x < 0 || x >= FW - 1 || y < 0 || y >= FH) continue;
        for (const q of [0, 1]) {
          const o = (y * FW + x + q) * 4;
          if (d[o + 3]) continue;
          d[o] = (c >> 16) & 255;
          d[o + 1] = (c >> 8) & 255;
          d[o + 2] = c & 255;
          d[o + 3] = Math.round(255 * a * 0.6 * (1 - j / len) ** 1.5 * (q ? 0.5 : 1));
        }
      }
  });
  let sun = 0.6; // how long the shadows are (a district sets it for its hour)

  /** The shadow of what stands on the fine box (X, Y, w, h), d fine pixels long, to the lower right. */
  const shadowBox = (X, Y, w, h, d, f = 0.62) => {
    const v = Math.round(f * 255);
    const put = (x0, y0, ww, hh) => {
      const [XA, XB] = [Math.max(0, x0), Math.min(FW, x0 + ww)];
      const [YA, YB] = [Math.max(0, y0), Math.min(FH, y0 + hh)];
      for (let j = YA; j < YB; j++) for (let i = XA; i < XB; i++) if (v < shMask[j * FW + i]) shMask[j * FW + i] = v;
    };
    put(X, Y, w, h);
    for (let k = 1; k <= d; k++) {
      put(X + w + k - 1, Y + k, 1, h);
      put(X + k, Y + h + k - 1, w, 1);
    }
  };
  const queue = (Y, draw, shadow) => objects.push({ y: Y, n: objects.length, draw, shadow });

  /** Lay the shadows, then paint everything queued, far to near. */
  const flush = () => {
    for (const o of objects) o.shadow?.();
    for (let i = 0; i < shMask.length; i++) if (shMask[i] < 255 && hi.data[i * 4 + 3]) hi.tint(i % FW, Math.floor(i / FW), shMask[i] / 255);
    objects.sort((a, b) => a.y - b.y || a.n - b.n);
    marking = true;
    for (const o of objects) o.draw();
    marking = false;
    objects.length = 0;
  };

  // ---- small things, drawn at once at a fine pixel (used inside a queued draw)
  const strokes = (X, Y, w, h, c, s) => {
    // a sign's writing from afar: a few strokes, never letters
    for (let k = 0; k < Math.max(1, Math.floor(w / 3)); k++) {
      const x = X + 1 + k * 3;
      if (x + 1 >= X + w) break;
      const kind = Math.floor(hashPx(x, Y, s) * 4);
      for (let j = 1; j < h - 1; j++) if (kind === 0 || (kind === 1 && j % 2) || (kind === 2 && j !== (h >> 1)) || (kind === 3 && j < h - 2)) P(x, Y + j, c);
      if (kind !== 0 && h > 3) P(x + 1, Y + 1 + (kind % (h - 2)), c);
    }
  };
  const ac = (X, Y) => {
    R(X, Y, 5, 4, 0xc8ccd0);
    R(X, Y + 3, 5, 1, 0x8a8e94);
    R(X + 1, Y + 1, 2, 2, 0x5a5e66);
    P(X + 4, Y + 1, 0x9a9ea4);
  };
  const tank = (X, Y, r) => {
    for (let j = -r; j <= r; j++)
      for (let i = -r; i <= r; i++) {
        const d = Math.hypot(i, j);
        if (d > r + 0.3) continue;
        P(X + i, Y + j, d > r - 0.8 ? 0x6a6e76 : i + j < -r * 0.5 ? 0xe4e8ec : i + j > r * 0.6 ? 0x9aa0a8 : 0xc4c8ce);
      }
    for (let k = 1; k <= 2; k++) for (let i = -r; i <= r; i++) hi.tint(X + i + k, Y + r + k, 0.7);
  };
  const hut = (X, Y, w, h, c) => {
    // a stair or lift head: a small box with its own wall and shadow
    for (let k = 1; k <= 3; k++) {
      for (let j = 0; j < h + 3; j++) hi.tint(X + w + k - 1, Y + j + k, 0.72);
      for (let i = 0; i < w; i++) hi.tint(X + i + k, Y + h + 2 + k, 0.72);
    }
    R(X, Y, w, h, shade(c, 1.12));
    R(X, Y, w, 1, shade(c, 1.25));
    R(X, Y + h, w, 3, shade(c, 0.8));
    R(X + (w >> 1) - 1, Y + h, 2, 3, 0x3a3e48);
    R(X, Y + h + 2, w, 1, PAL.ink);
  };
  const helipad = (X, Y, r) => {
    for (let j = -r; j <= r; j++)
      for (let i = -r; i <= r; i++) {
        const d = Math.hypot(i, j);
        if (d > r) continue;
        P(X + i, Y + j, d > r - 1.2 ? 0xe8d040 : 0x5a6a5c);
      }
    const a = Math.max(2, Math.floor(r / 2.5));
    for (let j = -a; j <= a; j++) for (const i of [-a, a]) P(X + i, Y + j, 0xf4f4f0);
    for (let i = -a; i <= a; i++) P(X + i, Y, 0xf4f4f0);
  };
  const solar = (X, Y, w, h) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) P(X + i, Y + j, i % 4 === 3 || j % 3 === 2 ? 0x8a94a8 : j % 3 === 0 ? 0x3a5a9a : 0x2a4680);
  };
  const parasol = (X, Y, c) => {
    for (let j = -3; j <= 3; j++)
      for (let i = -3; i <= 3; i++) {
        const d = Math.hypot(i, j);
        if (d > 3.4) continue;
        const seg = Math.floor(((Math.atan2(j, i) + Math.PI) / (Math.PI * 2)) * 8) % 2;
        P(X + i, Y + j, d < 0.8 ? 0x4a4a52 : seg ? c : 0xf4f0e8);
      }
    for (let i = -2; i <= 3; i++) hi.tint(X + i + 2, Y + 4, 0.72);
  };
  const greenery = (X, Y, w, h, s) => {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const v = hashPx(X + i, Y + j, s);
        P(X + i, Y + j, v < 0.2 ? 0x2f5a30 : v < 0.6 ? 0x447639 : v < 0.94 ? 0x5a8e44 : 0xe8a0b9);
      }
    R(X, Y + h, w, 1, 0x6a5a48);
  };
  const mast = (X, Y, h) => {
    for (let k = 0; k < h; k++) P(X, Y - k, k % 4 < 2 ? 0xd83030 : 0xf0f0ec);
    for (let k = 0; k < h; k++) hi.tint(X + 1 + (k >> 1), Y + 1 + (k >> 1), 0.75);
  };
  const lantern = (X, Y, c = 0xe0402a) => {
    R(X, Y, 2, 1, 0x2a2228);
    if (nightAt(Y) > 0.12) {
      ER(X, Y + 1, 2, 2, blend(c, 0xffd080, 0.35));
      halo(X + 1, Y + 2, 7, 7, c, 0.3 * nightAt(Y));
      return;
    }
    R(X, Y + 1, 2, 2, c);
    P(X, Y + 1, shade(c, 1.3));
  };
  /** Someone under an umbrella (a wet evening): mostly clear ones and dark ones, a colour now and then. */
  const umbrella = (X, Y, s) => {
    const v = hashPx(X, Y, s);
    const c = v < 0.4 ? 0xdfe8ee : v < 0.62 ? 0x2c2c34 : v < 0.74 ? 0x34406a : PAL.cloth[Math.floor(v * 97) % PAL.cloth.length];
    hi.tint(X + 3, Y + 4, 0.75);
    hi.tint(X + 4, Y + 4, 0.75);
    for (let j = 0; j < 4; j++)
      for (let i = 0; i < 4; i++) {
        if ((i === 0 || i === 3) && (j === 0 || j === 3)) continue;
        P(X + i, Y + j, i + j < 2 ? shade(c, 1.15) : i + j > 4 ? shade(c, 0.8) : (i + j) % 3 === 0 && v < 0.4 ? 0xb8c8d4 : c);
      }
  };
  /** A street lamp at the fine pixel (X, Y): a post, its head, and at night its pool of light. */
  const lamp = (X, Y, c = 0xfff0c8) => {
    R(X, Y - 4, 1, 5, 0x4a4e58);
    const n = nightAt(Y);
    if (n > 0.12) {
      ER(X - 1, Y - 6, 3, 2, c);
      halo(X, Y - 2, 15, 12, c, 0.32 * n);
    } else R(X - 1, Y - 6, 3, 2, 0xd8dce0);
  };
  const person = (X, Y, s) => {
    const c = cloth[Math.floor(hashPx(X, Y, s) * cloth.length)];
    hi.tint(X + 2, Y + 3, 0.7);
    hi.tint(X + 2, Y + 4, 0.7);
    P(X, Y, hashPx(X, Y, s + 1) < 0.75 ? 0x2a2228 : 0x6a4a30);
    P(X + 1, Y, PAL.skin[Math.floor(hashPx(X, Y, s + 2) * 3)]);
    R(X, Y + 1, 2, 2, c);
    R(X, Y + 3, 2, 1, shade(c, 0.55));
  };
  /** A car seen from above, at a fine pixel: lengthwise up the strip (v) or across it. */
  const carAt = (X, Y, v, c, put = P) => {
    const [w, h] = v ? [7, 13] : [13, 7];
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const [a, b] = v ? [i, j] : [j, i]; // a across the car, b along it
        const [wa, hb] = [7, 13];
        if ((a === 0 || a === wa - 1) && (b === 0 || b === hb - 1)) continue;
        let col = c;
        if (a === 0 || a === wa - 1) col = shade(c, 0.72);
        else if (b >= 3 && b <= 4) col = 0x2c3a4c; // the windscreen
        else if (b >= 9 && b <= 10) col = 0x34424e;
        else if (b >= 5 && b <= 8) col = shade(c, 1.12); // the roof
        else if (b === 0) col = a === 1 || a === wa - 2 ? 0xf8f0c0 : shade(c, 0.9);
        else if (b === hb - 1) col = a === 1 || a === wa - 2 ? 0xd83030 : shade(c, 0.8);
        put(X + i, Y + j, col);
      }
  };

  // ---- the walls: fn(i, j, w, h, s) -> colour, for the fine pixel (i, j) of a wall w x h
  const WALLS = {
    // rows of windows between piers
    office: (o) => (i, j, w, h, s) => {
      const [ci, cj] = [i % 4, j % 5];
      if (ci === 0 || cj < 2) return shade(o.wall, cj === 0 ? 1.06 : 1);
      const v = hashPx(Math.floor(i / 4), Math.floor(j / 5), s);
      if (o.lit && hashPx(Math.floor(i / 4), Math.floor(j / 5), s + 91) < o.lit) return LIT | (v < 0.5 ? 0xffe6a0 : v < 0.8 ? 0xfff4d4 : 0xd8ecff);
      const g = v < 0.08 ? 0xcfc8b4 : v < 0.3 ? PAL.glass[2] : v < 0.7 ? PAL.glass[1] : PAL.glass[0];
      return cj === 2 ? shade(g, 1.2) : g;
    },
    // a curtain wall: the sky in it, lighter towards the top, a streak of light across
    glass: (o) => (i, j, w, h, s) => {
      const g = o.glass ?? [0x3a5a80, 0x9cc4dc];
      let c = blend(g[1], g[0], Math.min(1, j / Math.max(1, h) + (hashPx(Math.floor(i / 6), Math.floor(j / 5), s) - 0.5) * 0.3));
      if ((i + j * 0.7 + s * 13) % 97 < 14) c = shade(c, 1.16);
      if (i % 6 === 0) c = shade(c, 0.78);
      else if (j % 5 === 0) c = shade(c, 0.86);
      else if (o.lit && hashPx(Math.floor(i / 6), Math.floor(j / 5), s + 91) < o.lit * 0.8) return LIT | blend(c, hashPx(Math.floor(i / 6), j, s) < 0.7 ? 0xffe8b0 : 0xe0f0ff, 0.78);
      return c;
    },
    // flats: a balcony to every floor, washing out now and then
    balcony: (o) => (i, j, w, h, s) => {
      const [ci, cj] = [i % 10, j % 6];
      if (ci === 0) return shade(o.wall, 0.9);
      if (cj < 2) return shade(o.wall, cj === 0 ? 1.1 : 0.98);
      const v = hashPx(Math.floor(i / 10), Math.floor(j / 6), s);
      if (cj === 2 && v < 0.3 && ci > 1 && ci < 8) return PAL.cloth[Math.floor(v * 30) % PAL.cloth.length];
      if (o.lit && ci < 5 && hashPx(Math.floor(i / 10), Math.floor(j / 6), s + 91) < o.lit) return LIT | (v < 0.6 ? 0xffe0a0 : 0xfff0d0);
      return ci < 5 ? (v < 0.5 ? 0x4a5666 : 0x6a7c8c) : 0x3c3e48;
    },
    // a plain wall with small windows
    plain: (o) => (i, j, w, h, s) => {
      const [ci, cj] = [i % 6, j % 6];
      if (ci >= 2 && ci <= 3 && cj >= 2 && cj <= 4) return o.lit && hashPx(Math.floor(i / 6), Math.floor(j / 6), s + 91) < o.lit ? LIT | 0xffe6a8 : hashPx(Math.floor(i / 6), Math.floor(j / 6), s) < 0.25 ? 0x7c94a8 : PAL.glass[0];
      return shade(o.wall, 1 + (hashPx(i, j, s) - 0.5) * 0.04);
    },
    // a department store: tall strips of window, cloth banners hanging between them, a band for its name on top
    depato: (o) => (i, j, w, h, s) => {
      if (j < 5) return j === 0 || j === 4 ? shade(o.trim ?? 0x8a2a2a, 0.8) : (o.trim ?? 0x8a2a2a);
      const ci = i % 12;
      if (ci >= 9 && ci <= 11 && j > 7 && j < h - 9) {
        const b = PAL.sign[Math.floor(hashPx(Math.floor(i / 12), 3, s) * PAL.sign.length)];
        return ci === 10 && j % 4 === 1 ? 0xf8f4ec : b;
      }
      if (ci >= 2 && ci <= 6 && j > 6) return j % 7 === 0 ? shade(o.wall, 0.9) : o.lit && hashPx(Math.floor(i / 12), Math.floor(j / 7), s + 91) < o.lit * 1.2 ? LIT | 0xfff0c4 : hashPx(Math.floor(i / 12), Math.floor(j / 7), s) < 0.4 ? PAL.glass[2] : PAL.glass[1];
      return shade(o.wall, 1 + (hashPx(i, j, s) - 0.5) * 0.03);
    },
    // an entertainment block: a dark wall behind stacks of signs
    neon: (o) => (i, j, w, h, s) => {
      const col = Math.floor(i / 5);
      const v = hashPx(col, 7, s);
      if (v < 0.62 && i % 5 < 4 && j > 1) {
        const k = Math.floor(j / 6);
        const c = PAL.sign[Math.floor(hashPx(col, k, s) * PAL.sign.length)];
        const [ci, cj] = [i % 5, j % 6];
        if (cj === 5) return 0x2a2630;
        return (o.lit ? LIT : 0) | ((ci === 1 || ci === 2) && cj >= 1 && cj <= 3 && hashPx(col * 7 + ci, k * 5 + cj, s) < 0.6 ? (c === 0xf4f0e8 ? 0x2a2a30 : 0xf8f4ec) : c);
      }
      const [ci, cj] = [i % 5, j % 5];
      if (o.lit && ci >= 1 && ci <= 3 && cj >= 2 && cj <= 3 && hashPx(Math.floor(i / 5), Math.floor(j / 5), s + 91) < o.lit) return LIT | 0xffe0a0;
      return ci >= 1 && ci <= 3 && cj >= 2 && cj <= 3 ? PAL.glass[Math.floor(hashPx(i >> 2, j >> 2, s) * 3)] : shade(o.wall, 0.9);
    },
    // a tower of grey stone: windows in a tight chequer, a lighter band every few floors
    granite: (o) => (i, j, w, h, s) => {
      const [ci, cj] = [i % 5, j % 5];
      if (j % 30 < 2) return shade(o.wall, 1.12);
      if (ci < 3 && cj < 3 && o.lit && hashPx(Math.floor(i / 5), Math.floor(j / 5), s + 91) < o.lit) return LIT | 0xffeab4;
      if (ci < 3 && cj < 3) return (Math.floor(i / 5) + Math.floor(j / 5)) % 2 ? 0x3a4452 : hashPx(i, j, s) < 0.5 ? 0x4c5868 : 0x5e6c7c;
      return shade(o.wall, ci === 4 ? 0.92 : 1);
    },
    // red brick with stone bands
    brick: (o) => (i, j, w, h, s) => {
      const [ci, cj] = [i % 7, j % 7];
      if (cj === 0) return 0xd8ccb4;
      if (ci >= 2 && ci <= 4 && cj >= 2 && cj <= 5) return cj === 2 ? 0xd8ccb4 : o.lit && hashPx(Math.floor(i / 7), Math.floor(j / 7), s + 91) < o.lit ? LIT | 0xffe2a0 : PAL.glass[0];
      return shade(o.wall, (j + (i >> 1)) % 2 ? 1 : 0.93);
    },
  };

  /** The row of shop fronts along the foot of a wall: an awning or a short curtain, glass, a door. */
  const shopfront = (X, Y, w, s, lit = 0) => {
    let at = 0;
    while (at < w) {
      const sw = Math.min(w - at, 8 + Math.floor(hashPx(X + at, Y, s) * 7));
      const c = PAL.awning[Math.floor(hashPx(X + at, Y + 1, s) * PAL.awning.length)];
      const noren = hashPx(X + at, Y + 2, s) < 0.3;
      for (let i = 0; i < sw; i++) {
        const x = X + at + i;
        const edge = i === 0 || i === sw - 1;
        for (let j = 0; j < 7; j++) {
          let col;
          if (edge) col = 0x4a4650;
          else if (j < 3) col = noren ? (j === 2 && i % 3 === 0 ? 0x34303a : c) : j === 2 ? shade(c, 0.75) : i % 4 < 2 ? c : 0xf4f0e8;
          else if (i >= (sw >> 1) - 1 && i <= (sw >> 1)) col = j === 3 ? 0x5a4a3a : 0x3a2e28; // the door
          else col = hashPx(x, Y + j, s) < 0.16 ? 0xffd890 : j === 3 ? 0x4a5a6c : 0x2e3a48;
          if (lit && !edge && j >= 3 && !(i >= (sw >> 1) - 1 && i <= (sw >> 1))) E(x, Y + j, hashPx(x >> 1, Y + j, s) < 0.75 ? 0xffe8b0 : 0xffc870);
          else P(x, Y + j, col);
        }
      }
      at += sw;
    }
  };

  /** What stands on a roof: units, tanks, stair heads, by chance. */
  const rooftop = (X, Y, w, h, o, s) => {
    const r = rng(s);
    if (o.top) return o.top({ X, Y, w, h, r, ac, tank, hut, helipad, solar, parasol, greenery, mast, P, R, E, ER, halo, lantern, person, umbrella, lamp, night: nightAt(Y) });
    if (w < 9 || h < 7) return;
    if (w >= 30 && h >= 30 && r() < (o.heli ?? 0)) helipad(X + (w >> 1), Y + (h >> 1), Math.min(11, (Math.min(w, h) >> 1) - 4));
    else if (w >= 16 && h >= 12 && r() < 0.6) hut(X + 3 + Math.floor(r() * (w - 14)), Y + 2 + Math.floor(r() * Math.max(1, h - 11)), 6 + Math.floor(r() * 3), 4, o.roof);
    const n = Math.floor((w * h) / 520) + (r() < 0.6 ? 1 : 0);
    for (let k = 0; k < n; k++) {
      const x = X + 2 + Math.floor(r() * (w - 9));
      const y = Y + 2 + Math.floor(r() * (h - 8));
      const v = r();
      if (v < 0.5) {
        const m = 1 + Math.floor(r() * 3);
        for (let q = 0; q < m && x + q * 6 + 5 < X + w - 1; q++) ac(x + q * 6, y);
      } else if (v < 0.68 && w > 14 && h > 12) tank(x + 3, y + 3, 3);
      else if (v < 0.8 && w > 16 && h > 10) solar(x, y, Math.min(11, w - 6), 5);
      else if (v < 0.86 && w > 14) greenery(x, y, Math.min(9, w - 6), 4, s + k);
      else P(x, y, 0x5a5e66);
    }
  };

  /**
   * A building on the ground (x, u, w, h): its roof, and under it its south wall `face` high.
   * o: { wall, roof, style (a WALLS name), face, shop (shop fronts along its foot), sign (a board on the wall's
   * top), tiers ([{ in: [left, top, right, bottom], face, style }]: storeys set back on the roof, each a building
   * on it), top (its own rooftop: fn), heli (chance of a helipad), s (seed) }
   */
  const building = (x, u, w, h, o = {}) => {
    const s = o.s ?? Math.floor(rand() * 1e6);
    o = { wall: pick(PAL.walls), roof: pick(PAL.roofs), style: 'office', face: 6, ...o };
    // (how many of its windows are lit: none by day, most at night)
    o.lit ??= night(u) > 0.1 ? Math.min(0.72, night(u) * (o.style === 'balcony' ? 0.7 : 0.9)) : 0;
    const [X0, X1, YT, YB] = [FX(x), FX(x + w), FY(u + h), FY(u)];
    const fh = Math.min(Math.round(o.face * S), YB - YT - 4);
    const YF = YB - fh;
    const box = (BX0, BX1, BT, BF, BB, b, bs, depth) => {
      const [bw, rh, bfh] = [BX1 - BX0, BF - BT, BB - BF];
      // the roof: its field, a parapet lit on the top and left, an inked edge
      for (let j = 0; j < rh; j++)
        for (let i = 0; i < bw; i++) {
          const rim = Math.min(i, j, bw - 1 - i, rh - 1 - j);
          let c = shade(b.roof, 0.97 + hashPx(BX0 + i, BT + j, bs) * 0.06);
          if (rim === 0) c = shade(b.roof, 0.5);
          else if (rim <= 2) c = shade(b.roof, i <= 2 || j <= 2 ? 1.2 : 0.84);
          P(BX0 + i, BT + j, c);
        }
      // the wall, a darker corner on its right, shop fronts along its foot
      const wall = WALLS[b.style ?? 'office'](b);
      for (let j = 0; j < bfh; j++)
        for (let i = 0; i < bw; i++) {
          let c = i === 0 || i === bw - 1 || j === bfh - 1 ? PAL.ink : wall(i, j, bw, bfh, bs);
          if (c >= LIT) {
            E(BX0 + i, BF + j, c & 0xffffff);
            continue;
          }
          if (i >= bw - 3 && i < bw - 1) c = shade(c, 0.8);
          P(BX0 + i, BF + j, c);
        }
      if (b.shop && bfh >= 12) {
        shopfront(BX0 + 1, BB - 8, bw - 2, bs + 5, b.lit);
        if (b.lit > 0.25) halo(BX0 + bw / 2, BB + 2, bw / 2 + 4, 9, 0xffd890, 0.22 * b.lit); // (its light on the pavement)
      }
      if (b.sign && bfh >= 10) {
        const sw = Math.min(bw - 6, 10 + Math.floor(hashPx(BX0, BT, bs) * 14));
        const sx = BX0 + ((bw - sw) >> 1);
        const c = b.sign === true ? PAL.sign[Math.floor(hashPx(BX0, BT, bs + 1) * PAL.sign.length)] : b.sign;
        if (b.lit) ER(sx, BF + 1, sw, 5, c);
        else R(sx, BF + 1, sw, 5, c);
        strokes(sx, BF + 1, sw, 5, c === 0xf4f0e8 || c === 0xf0c020 ? 0x2a2a30 : 0xf8f4ec, bs);
      }
      // the storeys set back on it, each with its own small shadow on this roof
      for (const [k, t] of (b.tiers ?? []).entries()) {
        const [l, tp, r, bt] = t.in.map((v) => Math.round(v * S));
        const tf = Math.round((t.face ?? 3) * S);
        const [TX0, TX1, TT, TB] = [BX0 + l, BX1 - r, BT + tp, BF - bt];
        if (TX1 - TX0 < 6 || TB - TT - tf < 4) continue;
        for (let q = 1; q <= Math.min(9, tf); q++) {
          for (let j = TT; j < TB; j++) if (TX1 + q - 1 < BX1 - 1 && j + q < BF - 1) hi.tint(TX1 + q - 1, j + q, 0.7);
          for (let i = TX0; i < TX1; i++) if (i + q < BX1 - 1 && TB + q - 1 < BF - 1) hi.tint(i + q, TB + q - 1, 0.7);
        }
        box(TX0, TX1, TT, TB - tf, TB, { ...b, tiers: t.tiers, shop: false, sign: false, style: t.style ?? b.style, roof: t.roof ?? shade(b.roof, 1.06), wall: t.wall ?? b.wall, top: t.top, heli: t.heli ?? b.heli }, bs + 17 * (k + 1), depth + 1);
      }
      if (!(b.tiers ?? []).length || b.top) rooftop(BX0 + 3, BT + 3, bw - 6, rh - 6, b, bs + 3);
    };
    queue(YB, () => box(X0, X1, YT, YF, YB, o, s, 0), () => shadowBox(X0, YT, X1 - X0, YB - YT, Math.max(3, Math.round(fh * sun)), 0.62));
  };

  /**
   * A house under a tiled roof on (x, u, w, h): the ridge along it, the slope towards us lit, a low wall with a
   * door and a window under the eave. o: { tile (colour), hip (hipped ends), wall, lantern }
   */
  const house = (x, u, w, h, o = {}) => {
    const s = o.s ?? Math.floor(rand() * 1e6);
    const tile = o.tile ?? pick(PAL.tile);
    const wallC = o.wall ?? pick([0xe4dccc, 0xd8c8b0, 0xcfc4b4, 0x8a6a50, 0xb89a78]);
    const [X0, X1, YT, YB] = [FX(x), FX(x + w), FY(u + h), FY(u)];
    const fh = Math.min(6, Math.max(4, Math.round((o.face ?? 2) * S)));
    const [bw, rh] = [X1 - X0, YB - YT - fh];
    const mid = rh >> 1;
    queue(
      o.over === undefined ? YB : FY(o.over) + (o.rank ?? 1), // (over: a storey standing on the house whose foot is at that height)
      () => {
        for (let j = 0; j < rh; j++)
          for (let i = 0; i < bw; i++) {
            const e = Math.min(i, bw - 1 - i);
            let c;
            if (o.hip !== false && e < Math.abs(j - mid)) c = shade(tile, i < bw / 2 ? 1.08 : 0.74); // the hipped ends
            else c = shade(tile, j < mid ? 0.86 : 1.14);
            if (i % 3 === 0) c = shade(c, 0.9); // the rows of tiles
            if (j === mid && e >= 0) c = shade(tile, 1.4); // the ridge
            if (i === 0 || j === 0 || i === bw - 1 || j === rh - 1) c = shade(tile, 0.5);
            P(X0 + i, YT + j, c);
          }
        for (let j = 0; j < fh; j++)
          for (let i = 1; i < bw - 1; i++) {
            let c = shade(wallC, j === 0 ? 0.7 : 1);
            const d = i - (bw >> 1);
            if (j > 0 && (d === 0 || d === 1)) c = 0x4a3a30; // the door
            else if (j > 0 && j < fh - 1 && i % 6 >= 2 && i % 6 <= 3 && Math.abs(d) > 2) {
              if (hashPx(X0 + (i - (i % 6)), YT, s + 91) < nightAt(YT) * 0.9) {
                E(X0 + i, YT + rh + j, 0xffdc98);
                continue;
              }
              c = hashPx(X0 + i, YT, s) < 0.3 ? 0xffe0a0 : 0x5a6c7c;
            }
            if (j === fh - 1) c = PAL.ink;
            P(X0 + i, YT + rh + j, c);
          }
        if (o.lantern) lantern(X0 + (bw >> 1) + 3, YT + rh + 1);
      },
      () => shadowBox(X0, YT, bw, YB - YT, Math.max(3, Math.round(5 * sun)), 0.66),
    );
  };

  /** A tree at (x, u), its crown r across (nature.mjs: broadleaf, sakura, pine, cedar, bamboo, tiny). */
  const tree = (kind, x, u, r, seed) => {
    if (kinds) kind = kinds(kind, x, u, r);
    const s = seed ?? Math.floor(rand() * 1e9); // (a seed of its own leaves the shared draws to the rest of the city)
    const [cx, cy] = [FX(x), FY(u)];
    const px = () => crownPixels(kind, cx, cy, r * S, rng(s), s & 1023);
    const off = Math.round((1.4 + r * 0.3) * S);
    queue(cy + r * S * 0.6, () => {
      for (const p of px()) P(p.x, p.y, p.c);
    }, () => {
      for (const p of px()) {
        const i = (p.y + off) * FW + p.x + off;
        if (p.x + off < FW && p.y + off < FH && shMask[i] > 150) shMask[i] = 150;
      }
    });
  };

  /**
   * Something small with no shadow: fn(X, Y) at the fine pixel of (x, u). over: the height u of the foot of a
   * building it must show in front of (a mast on its roof, a board on its wall).
   */
  const mark = (x, u, fn, over) => queue(over === undefined ? FY(u) : FY(over) + 1, () => fn(FX(x), FY(u)));
  /** Painted at once, straight on the ground, under every shadow (markings on the road, a court's paving). */
  const ground = (fn) => fn();

  /** A zebra crossing over the ground box (x, u, w, h); bars run across the walkers' way (along: 'x' or 'u'). */
  const zebra = (x, u, w, h, along) =>
    ground(() => {
      const [X0, Y0, ww, hh] = [FX(x), FY(u + h), Math.round(w * S), Math.round(h * S)];
      for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) if ((along === 'x' ? j : i) % 4 < 2) P(X0 + i, Y0 + j, 0xe4e0d6);
    });

  /** A parked or waiting car at (x, u) (its middle). */
  const car = (x, u, v, c = pick(PAL.cars), rev = false) => {
    const [X, Y] = [FX(x) - (v ? 3 : 6), FY(u) - (v ? 6 : 3)];
    // (rev: the other way round - its nose down the strip, or to the right)
    const put = (i, j, col, e) => (e ? E : P)(v ? i : rev ? X + 12 - (i - X) : i, v && rev ? Y + 12 - (j - Y) : j, col);
    queue(FY(u), () => {
      const n = nightAt(Y);
      carAt(X, Y, v, c, (i, j, col) => put(i, j, col, n > 0.2 && (col === 0xf8f0c0 || col === 0xd83030)));
      if (n > 0.2) {
        // its headlamps' beam on the road ahead
        const [hx, hy] = v ? [X + 3, rev ? Y + 19 : Y - 7] : [rev ? X + 19 : X - 7, Y + 3];
        halo(hx, hy, v ? 6 : 10, v ? 10 : 6, 0xfff0c0, 0.3 * n);
      }
    }, () => shadowBox(X, Y, v ? 7 : 13, v ? 13 : 7, 2, 0.7));
  };

  /** People standing about in the ground box (x, u, w, h). */
  const crowd = (x, u, w, h, n, wet = 0) => {
    for (let k = 0; k < n; k++) {
      const [px, pu] = [x + rand() * w, u + rand() * h];
      const umb = wet && hashPx(k, n, 5) < wet;
      queue(FY(pu) + 4, () => (umb ? umbrella : person)(FX(px), FY(pu), 77 + k));
    }
  };

  /** A frame for a moving part: draw(canvas, P) on a canvas w x h (logical), graded for the hour at u. */
  const frame = (w, h, u, draw, raw = false) => {
    const c = new HiCanvas(Math.max(1, Math.round(w * S)) / S, Math.max(1, Math.round(h * S)) / S, S); // (a whole number of fine pixels)
    draw((X, Y, col, a = 1) => c.hi.set(X, Y, col, a), c);
    return props.frame(raw ? c.hi : tod.frame(c.hi, u)); // (raw: a light, shown at its own colours)
  };

  /**
   * A train on the track at height uc: n coaches with a band of its line's colour, pulling in from one side
   * (from: -1 the left, 1 the right) to stop with its middle at x = stop, waiting, and pulling out the way it came.
   */
  const coachFrame = (band, nose, uc) =>
      frame(22, 4, uc, (put) => {
        for (let j = 0; j < 12; j++)
          for (let i = 0; i < 66; i++) {
            let c = j === 0 || j === 11 ? 0x6a7078 : j === 3 || j === 8 ? 0xe4e8ec : 0xc4cad0;
            if (j === 1 || j === 2 || j === 9 || j === 10) c = band;
            if (j >= 4 && j <= 7 && i % 16 >= 4 && i % 16 <= 11) c = (i + j) % 5 ? 0x8a94a0 : 0x6c7682; // the units on the roof
            if (i === 0 || i === 65) c = 0x5a6068;
            if (nose && (nose > 0 ? i >= 61 : i <= 4)) c = j >= 3 && j <= 8 ? 0x2c3a4c : band;
            put(i, j, c);
          }
      });
  const train = (uc, from, band, { stop = 90, n = 6, sp = 34, hold = 7, s0 = rand() } = {}) => {
    const coach = (nose) => coachFrame(band, nose, uc);
    const mid = Array(n - 2).fill(coach(0));
    const half = ((n - 1) * 23) / 2;
    if (from < 0) props.path([[-14, uc], [stop + half, uc]], [coach(1), ...mid, coach(-1)], { sp, n, gap: 23, mode: 'pp', hold, turn: 'none', cars: 1, s0 });
    else props.path([[W + 14, uc], [stop - half, uc]], [coach(-1), ...mid, coach(1)], { sp, n, gap: 23, mode: 'pp', hold, turn: 'none', cars: 1, s0 });
  };

  /** Cars driving along the lane at x from u0 to u1 (up the strip, or down it when u0 > u1), a gap apart. */
  const traffic = (x, u0, u1, { sp = 22, gap = 200, s0 = rand() } = {}) => {
    const up = u1 > u0;
    const fs = PAL.cars.map((c) =>
      frame(2.34, 4.34, (u0 + u1) / 2, (put) => carAt(0, 0, true, c, (X, Y, col) => put(X, up ? Y : 12 - Y, col))),
    );
    const n = Math.max(1, Math.floor(Math.abs(u1 - u0) / gap));
    const order = Array.from({ length: n }, (_, k) => fs[(k * 5 + Math.floor(s0 * 9)) % fs.length]);
    props.path([[x, u0], [x, u1]], order, { sp, n, gap, mode: 'wrap', turn: 'none', cars: 1, s0, d: -0.2 }); // (under the viaducts' covers)
  };

  /** A platform canopy's colour at the fine pixel (i, j) of its h rows: dark slate between pale eaves, a rib every bay, a skylight now and then. */
  const canopy = (i, j, h) => (j === 0 || j === h - 1 ? 0xdfe6ea : i % 12 === 0 ? 0x46525e : j === (h >> 1) ? 0x8794a2 : i % 36 < 5 ? 0x9cc0d4 : 0x66748a);

  /** The line `pts` moved d to the left of the way it runs (a lane beside a road's middle, one track of two). */
  const offset = (pts, d) =>
    pts.map((p, i) => {
      const [a, b] = [pts[Math.max(0, i - 1)], pts[Math.min(pts.length - 1, i + 1)]];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      return [p[0] - ((b[1] - a[1]) / len) * d, p[1] + ((b[0] - a[0]) / len) * d];
    });
  /** A train running the whole of a track that bends (pts, the way it runs), round and round; graded for the hour at u. */
  const trainOn = (pts, band, { n = 6, sp = 38, s0 = rand(), u = pts[0][1], mode = 'wrap', hold = 0 } = {}) => {
    const mid = Array(n - 2).fill(coachFrame(band, 0, u));
    props.path(pts, [coachFrame(band, 1, u), ...mid, coachFrame(band, -1, u)], { sp, n, gap: 23, mode, hold, turn: 'rot', cars: 1, s0 });
  };
  /** Cars along a lane that bends (pts, the way they drive), a gap apart; graded for the hour at u. */
  const trafficOn = (pts, { sp = 22, gap = 200, s0 = rand(), u = pts[0][1], d = -0.2 } = {}) => {
    const fs = PAL.cars.map((c) => frame(4.34, 2.34, u, (put) => carAt(0, 0, false, c, (X, Y, col) => put(12 - X, Y, col))));
    let len = 0;
    for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const n = Math.max(1, Math.floor(len / gap));
    props.path(pts, Array.from({ length: n }, (_, k) => fs[(k * 5 + Math.floor(s0 * 9)) % fs.length]), { sp, n, gap, mode: 'wrap', turn: 'rot', cars: 1, s0, d });
  };

  // smoke off a grill or a chimney: three sizes of puff, shared by every emitter
  let smokeF = null;
  const smoke = (x, u, o = {}) => {
    smokeF ??= [2, 3, 4].map((r) => [0, 1].map((v) => props.frame(puff(r * S, r * 31 + v, [0xa8a8b0, 0xc8c8d0, 0xe4e4ea, 0xffffff]))));
    props.emit(x, u, smokeF, { rate: 1.1, life: [2, 3.2], vy: 9, sx: 2, a: 0.5, tint: 1, ...o });
  };

  return {
    train, trainOn, traffic, trafficOn, offset, smoke, canopy, rand, pick, FX, FY, P, R, queue, flush, shadowBox, building, house, tree, mark, ground, zebra, car, carAt, crowd, frame, strokes, shopfront,
    ac, tank, hut, helipad, solar, parasol, greenery, mast, lantern, person, umbrella, lamp, props, WALLS,
    E, ER, halo, glint, after, night, nightAt, beforeGrade, afterGrade, LIT, raised, hi, FW, FH,
    setSun: (v) => { sun = v; },
  };
}
