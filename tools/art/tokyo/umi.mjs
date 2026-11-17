// Things of the sea shared by Tokyo's bay, Odaiba and the container pier: palms, buoys that blink, gulls, wakes,
// and ships. A ship is drawn once, as a function of its own length and breadth - put(a, b, colour, lit), a along
// it from the stern, b across it from its port side - so the same ship can be laid in the strip (moored, lit by
// its own lamps through the grade) or made into a frame that sails (graded by hand for the hour, its lamps kept).
import { PAL, shade, blend } from './kit.mjs';
import { hashPx } from '../hires.mjs';

const TAU = Math.PI * 2;
const CONT = [0xc0402a, 0x2a6ab0, 0x2e8a5a, 0xe0a030, 0x8a8e96, 0xd8d8d0, 0x6a3a8a, 0xb85a2a, 0x1a7a8a, 0xe86a8a, 0x4a4e58];

/** A container ship: deck stacked with boxes in bays, the house and its funnel aft, its lights. */
export function containerShip(put, len = 216, wid = 42, seed = 1) {
  const cx = (wid - 1) / 2;
  const sc = wid / 42; // (the house and the funnel grow with the ship)
  const [h0, h1] = [Math.round(14 * sc), Math.round(36 * sc)];
  for (let a = 0; a < len; a++) {
    const hw = a > len - 38 ? (wid / 2) * Math.sqrt(Math.max(0, (len - 1 - a) / 38)) : a < 6 ? wid / 2 - (6 - a) * 0.5 : wid / 2;
    for (let b = 0; b < wid; b++) {
      const d = Math.abs(b - cx);
      if (d > hw) continue;
      put(a, b, d > hw - 1.4 ? 0x1c2028 : d > hw - 2.6 ? 0x8a3028 : (a + b) % 9 === 0 ? 0x3e424a : 0x4a4e56);
    }
  }
  for (let a0 = h1 + 4, k = 0; a0 + 12 < len - 30; a0 += 14, k++) {
    for (let b0 = 5; b0 + 4 <= wid - 5; b0 += 4) {
      const v = hashPx(k, b0, seed);
      if (v < 0.07) continue;
      const col = CONT[Math.floor(hashPx(k * 3, b0, seed + 1) * CONT.length)];
      const high = hashPx(k, b0, seed + 2) < 0.5; // (a tier higher: a lighter top)
      for (let a = a0; a < a0 + 12; a++)
        for (let b = b0; b < b0 + 4; b++) put(a, b, b === b0 ? shade(col, high ? 1.35 : 1.15) : b === b0 + 3 ? shade(col, 0.7) : (a - a0) % 3 === 0 ? shade(col, 0.82) : high ? shade(col, 1.1) : col);
    }
    put(a0 + 12, 3, 0xfff0c0, true);
    put(a0 + 12, wid - 4, 0xfff0c0, true);
  }
  // the house: five decks of windows, the bridge with its wings
  for (let a = h0; a < h1; a++)
    for (let b = 6; b < wid - 6; b++) {
      const edge = b === 6 || b === wid - 7 || a === h0;
      const win = a > h0 + 1 && a < h1 - 2 && (a - h0) % 4 === 2 && b % 3 !== 0 && !edge;
      put(a, b, win ? (hashPx(a, b, seed + 3) < 0.7 ? 0xfff0c0 : 0x8aa0b4) : edge ? 0xb8bcc4 : a > h1 - 4 ? 0xf4f4f0 : 0xdcdfe4, win);
    }
  for (let a = h1 - 4; a < h1; a++) for (let b = 1; b < wid - 1; b++) if (b < 6 || b >= wid - 6) put(a, b, 0xe4e6ea);
  const fw = Math.round(4 * sc);
  for (let a = Math.round(7 * sc); a < h0; a++) for (let b = Math.round(cx) - fw; b <= Math.round(cx) + fw; b++) put(a, b, a === Math.round(10 * sc) || a === Math.round(10 * sc) + 1 ? 0xc03a30 : a === Math.round(7 * sc) ? 0x1c1c22 : 0x2a2a30); // the funnel
  put(h1 - 2, 1, 0xff3030, true);
  put(h1 - 2, wid - 2, 0x30ff60, true);
  put(len - 30, Math.round(cx), 0xffffff, true);
  put(1, Math.round(cx), 0xffffff, true);
}

/** A ferry for the islands: white, a blue band, three decks of windows stepping up, a blue funnel, orange boats. */
export function ferry(put, len = 150, wid = 30, seed = 2) {
  const cx = (wid - 1) / 2;
  const hwAt = (a) => (a > len - 34 ? (wid / 2) * Math.sqrt(Math.max(0, (len - 1 - a) / 34)) : a < 6 ? wid / 2 - (6 - a) * 0.6 : wid / 2);
  for (let a = 0; a < len; a++) {
    const hw = hwAt(a);
    for (let b = 0; b < wid; b++) {
      const d = Math.abs(b - cx);
      if (d > hw) continue;
      let c = d > hw - 1.4 ? 0x2a5aa8 : d > hw - 2.6 ? 0xe8ecf0 : 0xb8bcc0;
      let lit = false;
      // the decks: each a step narrower, a row of windows along each side
      for (const [a0, a1, inset] of [[14, len - 30, 3], [22, len - 44, 6], [36, len - 64, 9]])
        if (a >= a0 && a < a1 && d <= hw - inset) {
          const rim = d > hw - inset - 1.4;
          c = rim ? 0xf4f6f8 : inset === 9 ? 0xe0e4e8 : 0xd0d4d8;
          if (d > hw - inset - 2.6 && d <= hw - inset - 1.4 && a % 3 !== 0) [c, lit] = [hashPx(a, b, seed) < 0.75 ? 0xfff0c8 : 0x7a90a4, true];
        }
      put(a, b, c, lit);
    }
  }
  for (let a = 44; a < 54; a++) for (let b = Math.round(cx) - 4; b <= Math.round(cx) + 4; b++) put(a, b, a < 47 ? 0xf4f4f0 : 0x2a5aa8); // the funnel
  for (let k = 0; k < 4; k++)
    for (const b of [2, wid - 4]) for (let a = 0; a < 6; a++) for (let q = 0; q < 2; q++) put(60 + k * 12 + a, b + q, 0xf08030);
  for (let b = 3; b < wid - 3; b++) put(len - 66, b, 0x8ac0e0, true); // the bridge's windows
  put(len - 66, 1, 0xff3030, true);
  put(len - 66, wid - 2, 0x30ff60, true);
  put(len - 20, Math.round(cx), 0xffffff, true);
}

/** A water bus of the future: a low lens of glass, lit inside, ribs over it. */
export function waterBus(put, len = 56, wid = 15) {
  const cx = (wid - 1) / 2;
  for (let a = 0; a < len; a++) {
    const t = (a - len / 2) / (len / 2);
    const hw = (wid / 2) * Math.sqrt(Math.max(0, 1 - t ** 4)) * (a > len / 2 ? 1 - (t - 0.0) * 0.25 : 1);
    for (let b = 0; b < wid; b++) {
      const d = Math.abs(b - cx);
      if (d > hw) continue;
      if (d > hw - 1.2) put(a, b, 0xc8d0d8);
      else if (a % 7 === 0 || d < 0.6) put(a, b, 0xe8eef4);
      else put(a, b, (a + b) % 5 === 0 ? 0xfff4d0 : blend(0x58c8f0, 0xffffff, 0.3 - d / wid), true);
    }
  }
  put(len - 3, Math.round(cx), 0xffffff, true);
}

/** A tug: a black hull, a white house, its mast light. */
export function tug(put) {
  for (let j = 0; j < 9; j++) for (let i = 0; i < 20; i++) if (Math.abs(j - 4) <= 4 - Math.max(0, i - 14) * 0.7) put(i, j, Math.abs(j - 4) > 3 - Math.max(0, i - 14) * 0.7 ? 0x1c1c22 : 0x5a2a20);
  for (let j = 2; j < 7; j++) for (let i = 6; i < 13; i++) put(i, j, j === 2 ? 0xf4f4f0 : i === 12 ? 0xffe8a0 : 0xd8d8d0, i === 12);
  put(4, 4, 0x2a2a30);
  put(4, 5, 0x2a2a30);
  put(18, 4, 0x40ff80, true);
  put(9, 4, 0xffffff, true);
}

/** A barge of gravel or sand. */
export function barge(put, sand = false) {
  for (let j = 0; j < 13; j++)
    for (let i = 0; i < 38; i++) put(i, j, i === 0 || i === 37 || j === 0 || j === 12 ? 0x1c1c22 : j === 1 || j === 11 || i < 3 || i > 34 ? 0x4a4e58 : hashPx(i, j, 225) < 0.5 ? (sand ? 0xb8a070 : 0x6a665c) : sand ? 0xc8b080 : 0x7a766a);
  put(36, 1, 0xff4030, true);
  put(36, 11, 0x40ff80, true);
}

/** A fishing boat for the night: white, its lamps strung over the deck. */
export function fishingBoat(put) {
  for (let j = 0; j < 9; j++) for (let i = 0; i < 26; i++) if (Math.abs(j - 4) <= 4 - Math.max(0, i - 19) * 0.6) put(i, j, Math.abs(j - 4) > 3 - Math.max(0, i - 19) * 0.6 ? 0x8a94a0 : i < 7 ? 0x5a6a7a : 0xe8ecf0);
  for (let j = 2; j < 7; j++) for (let i = 2; i < 7; i++) put(i, j, j === 2 ? 0xf4f4f0 : 0x2c3a4c);
  for (let i = 9; i < 21; i += 3) {
    put(i, 4, 0xfff8e0, true);
    put(i, 3, 0xf0f8ff, true);
  }
}

export function makeUmi(ctx) {
  const { kit, props, S, L } = ctx;
  const { P, R, mark, FX, FY, halo } = kit;
  const hi = ctx.img.hi;
  const wt = (u) => ctx.tod.white(Math.max(0, Math.min(L - 1, u))).map((v) => v / 255);
  /** A colour as the grade at u would leave it (for frames shown at their own colours, their lamps kept). */
  const dimAt = (u) => {
    const [r, g, b] = wt(u);
    return (c) => (Math.round(((c >> 16) & 255) * r) << 16) | (Math.round(((c >> 8) & 255) * g) << 8) | Math.round((c & 255) * b);
  };
  /** A sailing frame of a ship painter: w x h fine pixels, its bow to the right, graded for u, lamps kept. */
  const shipFrame = (draw, w, h, u, ...args) => {
    const dim = dimAt(u);
    return kit.frame(w / S, h / S, u, (put) => draw((a, b, c, lit) => put(a, b, lit ? c : dim(c)), ...args), true);
  };
  /** A ship painter laid in the strip with its stern at fine (X, Y): its bow up the strip (dir 'n') or to the right ('e'). */
  const shipAt = (draw, X, Y, len, wid, dir, ...args) =>
    draw((a, b, c, lit) => {
      const [x, y] = dir === 'n' ? [X + b, Y - a] : dir === 's' ? [X + wid - 1 - b, Y + a] : [X + a, Y + b];
      (lit ? kit.E : P)(x, y, c);
    }, len, wid, ...args);

  /** A palm at the fine pixel (X, Y): a trunk leaning, fronds fanning and drooping from its head. */
  const palmAt = (X, Y) => {
    const lean = hashPx(X, Y, 301) < 0.5 ? -1 : 1;
    const top = 11 + Math.floor(hashPx(X, Y, 303) * 4);
    for (let k = 0; k < 8; k++) hi.tint(X + 2 + k, Y + 1 + (k >> 2), 0.72);
    for (let q = 0; q < top; q++) {
      const x = X + Math.round((lean * q * q) / 50);
      P(x, Y - q, q % 3 === 0 ? 0x6a5038 : 0x8a6a48);
      if (q % 3 === 1) P(x + 1, Y - q, 0x5a4430);
    }
    const [hx, hy] = [X + Math.round((lean * top * top) / 50), Y - top];
    const a0 = hashPx(X, Y, 302) * 2;
    for (let f = 0; f < 8; f++) {
      const a = (f / 8) * TAU + a0;
      for (let r = 1; r <= 7; r++) {
        const [px, py] = [hx + Math.round(Math.cos(a) * r), hy + Math.round(Math.sin(a) * r * 0.7 + r * r * 0.07)];
        P(px, py, r < 3 ? 0x2a5a2e : f % 2 ? 0x3a7a3c : 0x4a8c44);
        if (r > 2 && r < 7) P(px + (Math.abs(Math.sin(a)) > 0.6 ? 1 : 0), py + (Math.abs(Math.sin(a)) > 0.6 ? 0 : 1), 0x285028);
      }
    }
    P(hx, hy, 0x6a5a30);
  };
  const palm = (x, u) => mark(x, u, (X, Y) => palmAt(X, Y));

  // wakes: a V of foam behind a boat (three, fading), shared
  const wake = [0, 1, 2].map((k) =>
    kit.frame(7, 5, 0, (put) => {
      for (let i = 0; i < 20 - k * 3; i++) {
        const y = Math.round((i * (3 + k)) / 9);
        put(20 - i, 7 - y, 0xb8ccdc, 0.45 - k * 0.12 - i * 0.012);
        put(20 - i, 7 + y, 0xb8ccdc, 0.45 - k * 0.12 - i * 0.012);
      }
    }, true));

  /** A buoy on the water at (x, u): a float of colour c, its cage, a lamp blinking on top. */
  const lamps = new Map();
  let nb = 0;
  const buoy = (x, u, c) => {
    const [X, Y] = [FX(x), FY(u)];
    kit.queue(Y, () => {
      for (let j = -2; j <= 2; j++) for (let i = -3; i <= 3; i++) if (Math.hypot(i / 3.2, j / 2.2) <= 1) P(X + i, Y + j, j < 0 ? shade(c, 1.1) : shade(c, 0.72));
      R(X - 1, Y - 6, 1, 5, 0x3a3a40);
      R(X + 1, Y - 6, 1, 5, 0x3a3a40);
      R(X - 1, Y - 7, 3, 1, 0x4a4a52);
    });
    kit.glint(X, Y + 3, 18, c, 0.45);
    if (!lamps.has(c))
      lamps.set(c, kit.frame(1, 1, 0, (put) => {
        put(1, 0, 0xffffff);
        put(0, 1, c);
        put(1, 1, 0xffffff);
        put(2, 1, c);
        put(1, 2, c);
      }, true));
    props.loop((X - 1) / S, L - (Y - 10) / S, [lamps.get(c)], { fps: 1.5, seq: [0, -1, -1, -1, -1], ph: (nb++ * 0.29) % 1, d: 0.1 });
    halo(X, Y - 8, 8, 8, c, 0.18);
  };

  /** Gulls: a few flying round over (x, u), flapping. */
  const gullF = [0, 1].map((k) =>
    kit.frame(2.34, 1.34, 11000, (put) => {
      // (its head to the right: the body along, the wings across, up and down in turn)
      for (let i = 1; i < 6; i++) put(i, 3, i === 5 ? 0xe8ecf0 : 0xd0d4dc);
      put(6, 3, 0xe0a030);
      for (let q = 1; q <= 3; q++) {
        const i = k ? 3 - (q >> 1) : 2 + (q === 3 ? 1 : 0);
        put(i, 3 - q, q === 3 ? 0x5a5e66 : 0xc8ccd4);
        put(i, 3 + q, q === 3 ? 0x5a5e66 : 0xb8bcc4);
      }
    }, true));
  const gulls = (x, u, rx, ry, n = 4) => props.wander(x, u, rx, ry, gullF, { n, sp: 9, turn: 'rot', fps: 3, idle: 0, d: 0.35 });

  return { dimAt, shipFrame, shipAt, palm, palmAt, wake, buoy, gulls };
}
