// Skins for the player's shots out of the gachapon (plan-gacha.md, 4.2): each the size of the shot it stands in
// for (bullets540.mjs), so nothing about hitting changes, a dark rim round it to read on any background.
// Frames: <the shot's frame>_<skin>, e.g. ps_needle_kunai, ps_laser_2_rainbow; they ride in the gacha atlas.
import { Raster } from '../lib/raster.mjs';

const INK = 0x140c18;
const TAU = Math.PI * 2;

function rim(r, col = INK) {
  const solid = (x, y) => r.alpha(x, y) > 128;
  const add = [];
  for (let y = 0; y < r.h; y++)
    for (let x = 0; x < r.w; x++) if (!r.alpha(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) add.push([x, y]);
  for (const [x, y] of add) r.set(x, y, col);
  return r;
}
/** Paint by a function of the pixel's centre: fn(x, y) -> a colour, or null. */
function paint(w, h, fn) {
  const r = new Raster(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const c = fn(x + 0.5, y + 0.5);
      if (c != null) r.set(x, y, c);
    }
  return r;
}
/** A shaded ball, lit from the upper left. */
function ball(r, cx, cy, R, ramp) {
  for (let y = Math.floor(cy - R); y <= cy + R; y++)
    for (let x = Math.floor(cx - R); x <= cx + R; x++) {
      const dx = (x + 0.5 - cx) / R;
      const dy = (y + 0.5 - cy) / R;
      const d = dx * dx + dy * dy;
      if (d > 1) continue;
      const l = 0.5 + 0.5 * (-dx * 0.55 - dy * 0.6 + Math.sqrt(1 - d) * 0.6);
      r.set(x, y, ramp[Math.max(0, Math.min(ramp.length - 1, Math.floor(l * ramp.length)))]);
    }
  return r;
}

// ------------------------------------------------------------------ the basic shot: 9 x 21, flying up
const NW = 9;
const NH = 21;
const BASIC = {
  /** A kunai: a steel leaf of a blade, a wrapped grip, a ring. */
  kunai: () => {
    const r = paint(NW, NH, (x, y) => {
      if (y < 13) {
        const half = y < 9 ? (y / 9) * 3.6 : ((13 - y) / 4) * 3.6;
        const dx = Math.abs(x - 4.5);
        return dx > half ? null : dx < 0.6 ? 0xffffff : x < 4.5 ? 0xd8e2f4 : 0x9aa6c2;
      }
      if (y < 17) return Math.abs(x - 4.5) < 1.5 ? (Math.floor(y) % 2 ? 0x8a1a1e : 0xd2361f) : null;
      const d = Math.hypot(x - 4.5, y - 18.8);
      return d < 2.3 && d > 0.9 ? 0xc8d0e4 : null;
    });
    return rim(r);
  },
  /** A pair of chopsticks, lacquered tips first. */
  chopsticks: () => {
    const r = new Raster(NW, NH);
    for (const x of [1, 6]) {
      r.rect(x, 1, 2, 19, 0xc89a5a);
      r.rect(x + 1, 1, 1, 19, 0x8a6a3a);
      r.rect(x, 1, 2, 5, 0xd2361f);
      r.set(x, 1, 0xff9a80);
    }
    return rim(r);
  },
  /** A grain of rice. */
  rice: () => {
    const r = paint(NW, NH, (x, y) => {
      const d = ((x - 4.5) / 3.2) ** 2 + ((y - 10.5) / 8.5) ** 2;
      return d > 1 ? null : x < 4 && y < 9 ? 0xffffff : d > 0.6 && x > 4.5 ? 0xd8ccb0 : 0xfff8e8;
    });
    return rim(r);
  },
  /** Three fat pixels in a row. */
  pixels: () => {
    const r = new Raster(NW, NH);
    [0x4fe8ff, 0xff4fb0, 0xffe04f].forEach((c, i) => {
      r.rect(2, 1 + i * 7, 5, 5, c);
      r.rect(2, 1 + i * 7, 2, 2, 0xffffff);
    });
    return rim(r);
  },
  /** A stroke of ink: thick where the brush came down, trailing off. */
  ink: () => {
    const r = paint(NW, NH, (x, y) => {
      const t = y / NH;
      const half = t < 0.25 ? 1.2 + (t / 0.25) * 2.6 : 3.8 * (1 - (t - 0.25) / 0.8);
      const dx = Math.abs(x - 4.5 - Math.sin(y * 0.5) * 0.5);
      return dx > half ? null : dx > half - 1 ? 0xb8b8d0 : 0x2a2a44;
    });
    return rim(r, 0xf0f0ff);
  },
  /** An arrow: steel head, a wooden shaft, red feathers. */
  arrow: () => {
    const r = paint(NW, NH, (x, y) => {
      const dx = Math.abs(x - 4.5);
      if (y < 6) return dx <= (y / 6) * 3.5 ? (dx < 0.6 ? 0xffffff : 0xb8c4dc) : null;
      if (y > 15) return dx <= 0.6 ? 0x8a6a3a : dx <= 1 + (y - 15) * 0.5 ? (x < 4.5 ? 0xff7448 : 0xd2361f) : null;
      return dx <= 0.6 ? 0xc89a5a : null;
    });
    return rim(r);
  },
  /** An icicle, point first. */
  icicle: () => {
    const r = paint(NW, NH, (x, y) => {
      const half = 0.4 + (y / NH) * 3.8;
      const dx = x - 4.5;
      return Math.abs(dx) > half ? null : dx < -half * 0.3 ? 0xffffff : dx < half * 0.4 ? 0xc8f0ff : 0x6ab8e8;
    });
    return rim(r, 0x143a6a);
  },
  /** Dango on a skewer: pink, white, green. */
  dango: () => {
    const r = new Raster(NW, NH);
    r.rect(4, 0, 1, 21, 0xc89a5a);
    ball(r, 4.5, 4, 3.4, [0xc85a85, 0xf08bb0, 0xffd3e2, 0xffffff]);
    ball(r, 4.5, 10.5, 3.4, [0xc8bca0, 0xf4ecd8, 0xffffff, 0xffffff]);
    ball(r, 4.5, 17, 3.4, [0x4a8a3a, 0x8ac85a, 0xc8f0a0, 0xffffff]);
    return rim(r);
  },
  /** A white feather. */
  feather: () => {
    const r = paint(NW, NH, (x, y) => {
      const t = y / NH;
      const half = Math.sin(Math.min(1, t * 1.15) * Math.PI) * 3.6 + 0.3;
      const dx = Math.abs(x - 4.5);
      if (dx > half) return null;
      if (dx < 0.6) return 0xb8b0a0;
      return (Math.floor(y + dx) % 3 === 0) ? 0xd8dcec : 0xffffff;
    });
    return rim(r);
  },
};

// ------------------------------------------------------------------ the spread's pellet: 15 x 15
const SW = 15;
/** A shape by its radius at each angle. */
const radial = (radius, colour) => paint(SW, SW, (x, y) => {
  const dx = x - 7.5;
  const dy = y - 7.5;
  const d = Math.hypot(dx, dy);
  const a = Math.atan2(dy, dx);
  return d <= radius(a) ? colour(d, a, dx, dy) : null;
});
const SPREAD = {
  /** A cherry blossom: five petals round a yellow heart. */
  sakura: () => {
    const r = new Raster(SW, SW);
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + (k * TAU) / 5;
      r.disc(7.5 + Math.cos(a) * 3.6, 7.5 + Math.sin(a) * 3.6, 2.9, 0xf08bb0);
      r.disc(7.5 + Math.cos(a) * 3.2, 7.5 + Math.sin(a) * 3.2, 1.8, 0xffd3e2);
    }
    r.disc(7.5, 7.5, 1.6, 0xffe060);
    return rim(r, 0x6a1a3a);
  },
  /** A maple leaf: seven points, red to orange. */
  momiji: () => rim(radial((a) => 3.2 + 3.6 * Math.abs(Math.cos(a * 3.5 + Math.PI / 4)) ** 1.6, (d) => (d < 2 ? 0xffc040 : d < 4.4 ? 0xf06a1a : 0xd02a1a)), 0x4a0a08),
  /** A shuriken: four blades, a hole in the middle. */
  shuriken: () => rim(radial((a) => 2.4 + 4.6 * Math.abs(Math.cos(a * 2)) ** 3, (d, a, dx, dy) => (d < 1.3 ? null : dx + dy < 0 ? 0xe8eef8 : 0x8a94b0))),
  /** A five-yen coin: brass, a hole through it. */
  coin: () => rim(radial(() => 6.3, (d, a, dx, dy) => (d < 1.6 ? null : d > 5.2 ? 0xb88a1a : dx + dy < -2 ? 0xfff4a8 : 0xf0c040)), 0x4a3008),
  /** A firework's spark: a white heart, rays of every colour. */
  hanabi: () => {
    const r = new Raster(SW, SW);
    const cols = [0xff5a5a, 0xffe04f, 0x6ae486, 0x4fc8ff, 0xff8ad0, 0xffa040, 0xb070f0, 0xffffff];
    cols.forEach((c, k) => {
      const a = (k * TAU) / cols.length;
      r.line(7 + Math.cos(a) * 2.5, 7 + Math.sin(a) * 2.5, 7 + Math.cos(a) * 6.4, 7 + Math.sin(a) * 6.4, c);
    });
    r.disc(7.5, 7.5, 2.4, 0xffffff);
    return rim(r);
  },
  /** Confetti: scraps of coloured paper. */
  confetti: () => {
    const r = new Raster(SW, SW);
    for (const [x, y, w, h, c] of [[1, 2, 4, 3, 0xff5a8a], [8, 1, 3, 4, 0x4fc8ff], [5, 6, 4, 4, 0xffe04f], [10, 8, 4, 3, 0x6ae486], [2, 10, 3, 4, 0xb070f0], [7, 11, 4, 3, 0xffa040]]) {
      r.rect(x, y, w, h, c);
      r.set(x, y, 0xffffff);
    }
    return rim(r);
  },
  /** A snowflake: six arms, barbed. */
  snow: () => {
    const r = new Raster(SW, SW);
    for (let k = 0; k < 6; k++) {
      const a = (k * TAU) / 6 + Math.PI / 6;
      r.line(7, 7, 7 + Math.cos(a) * 6.3, 7 + Math.sin(a) * 6.3, 0xffffff);
      for (const s of [-1, 1]) r.line(7 + Math.cos(a) * 3.6, 7 + Math.sin(a) * 3.6, 7 + Math.cos(a + s * 0.7) * 5.2, 7 + Math.sin(a + s * 0.7) * 5.2, 0xc8ecff);
    }
    r.disc(7.5, 7.5, 1.5, 0xffffff);
    return rim(r, 0x143a6a);
  },
  /** A folding fan, open: red paper, gold ribs. */
  fan: () => {
    const r = paint(SW, SW, (x, y) => {
      const dx = x - 7.5;
      const dy = y - 12.5;
      const d = Math.hypot(dx, dy);
      const a = Math.atan2(-dy, dx);
      if (d > 11.5 || a < 0.35 || a > Math.PI - 0.35) return null;
      if (d < 2) return 0x8a6a3a;
      if (d < 5) return Math.floor(a * 6) % 2 ? 0xe8b830 : 0x8a6a3a;
      return Math.floor(a * 6) % 2 ? 0xd2361f : 0xff6a4a;
    });
    r.disc(7.5, 5, 1.6, 0xfff4a8);
    return rim(r);
  },
  /** A hanafuda card: the full moon over the red hill. */
  hanafuda: () => {
    const r = new Raster(SW, SW);
    r.rect(3, 1, 9, 13, 0x1a1a22);
    r.rect(4, 2, 7, 11, 0xd2361f);
    r.rect(4, 9, 7, 4, 0x1a1a22);
    r.disc(7.5, 6, 2.6, 0xfffaf0);
    return rim(r, 0xf0f0ff);
  },
};

// ------------------------------------------------------------------ the laser: 9 x 42, 15 x 48, 21 x 54
const LASER_SIZE = { 1: [9, 42], 2: [15, 48], 3: [21, 54] };
/**
 * A beam: `bands` are its colours from the heart out; `sway(y)` bends its middle (in half-widths); `mark(d, x, y)`
 * may recolour a pixel (d: 0 at the heart, 1 at the edge); `thin` narrows it.
 */
function beam(lvl, bands, { sway = () => 0, mark = null, thin = 1, rimCol = INK } = {}) {
  const [w, h] = LASER_SIZE[lvl];
  const r = paint(w, h, (x, y) => {
    const t = y / h;
    const taper = Math.min(1, t / 0.1, (1 - t) / 0.12);
    const half = (w / 2 - 1) * thin * (1 - Math.abs(sway(y)) * 0.35);
    const d = Math.abs(x - w / 2 - sway(y) * (w / 2 - 1) * 0.4) / half;
    if (d > taper) return null;
    const c = bands[Math.min(bands.length - 1, Math.floor(d * bands.length))];
    return mark ? mark(d, x, y, c) : c;
  });
  return rim(r, rimCol);
}
const zig = (y, p) => Math.abs(((y / p) % 2) - 1) * 2 - 1; // a triangle wave, -1..1
const RAINBOW = [0xff5a5a, 0xffa040, 0xffe04f, 0x6ae486, 0x4fc8ff, 0xb070f0];
const LASER = {
  /** Raijū's lightning: a jagged bolt. */
  lightning: (l) => beam(l, [0xffffff, 0xfff4a0, 0xffd020, 0xd08a10], { sway: (y) => zig(y, 5), thin: 0.8 }),
  /** A paper streamer: white, a red edge, a gentle wave. */
  paper: (l) => beam(l, [0xffffff, 0xfff4e8, 0xfff4e8, 0xd2361f], { sway: (y) => Math.sin(y * 0.3) * 0.6 }),
  /** A jet of water, foam in it. */
  water: (l) => beam(l, [0xffffff, 0xa8e4ff, 0x3a9af0, 0x1a5ab0], { sway: (y) => Math.sin(y * 0.45) * 0.35, mark: (d, x, y, c) => ((Math.floor(x * 3 + y * 7) % 11 === 0 && d < 0.7) ? 0xffffff : c) }),
  /** A neon tube: a white heart in hot pink. */
  neon: (l) => beam(l, [0xffffff, 0xffb0e8, 0xff3ac0, 0xa0107a]),
  /** A rainbow, its colours side by side. */
  rainbow: (l) => {
    const [w] = LASER_SIZE[l];
    return beam(l, [0xffffff], { mark: (d, x) => RAINBOW[Math.max(0, Math.min(5, Math.floor((x / w) * 6)))] });
  },
  /** Ramen: a wavy noodle. */
  ramen: (l) => beam(l, [0xfff4b0, 0xf8d860, 0xe0a830], { sway: (y) => Math.sin(y * 0.7), thin: 0.6, rimCol: 0x5a3a08 }),
  /** A dragon: green scales, a gold belly, its head leading. */
  dragon: (l) => {
    const [w, h] = LASER_SIZE[l];
    const r = beam(l, [0xf0d040, 0x6ae486, 0x2a9a4a, 0x145a2a], { sway: (y) => Math.sin(y * 0.28) * 0.7, mark: (d, x, y, c) => (d > 0.3 && Math.floor(y / 2) % 2 ? 0x1f7a3a : c) });
    // the head: two horns and the eyes
    const cx = Math.floor(w / 2);
    r.set(cx - 1, 3, 0xffffff);
    r.set(cx + 1, 3, 0xffffff);
    if (l > 1) { r.set(cx - 2, 1, 0xf0d040); r.set(cx + 2, 1, 0xf0d040); }
    r.set(cx, h - 2, 0xf0d040);
    return r;
  },
  /** A moonbeam: pale, soft at the edge. */
  moon: (l) => beam(l, [0xffffff, 0xfffbe0, 0xf4e8a8, 0xc8b870], { rimCol: 0x3a3a5a }),
  /** A thread: thin, red, a knot now and then. */
  thread: (l) => beam(l, [0xffffff, 0xff5a4a, 0xc81a1a], { thin: 0.45, mark: (d, x, y, c) => (Math.floor(y) % 12 < 2 ? 0xff9a80 : c) }),
};

// ------------------------------------------------------------------ the homing orb: 21 x 21
const HW = 21;
const HOMING = {
  /** A dango ball, three colours swirled. */
  dango: () => {
    const r = new Raster(HW, HW);
    ball(r, 10.5, 10.5, 8, [0xc85a85, 0xf08bb0, 0xffd3e2, 0xffffff]);
    for (let y = 0; y < HW; y++) for (let x = 0; x < HW; x++) if (r.alpha(x, y) && y > 12) r.set(x, y, y > 15 ? 0x8ac85a : 0xfff4e8, 0.85);
    return rim(r, 0x4a1a2a);
  },
  /** A hitodama: a will-o'-the-wisp, blue, its tail up behind it. */
  hitodama: () => {
    const r = new Raster(HW, HW);
    for (let k = 0; k < 6; k++) r.disc(10.5 + Math.sin(k * 1.3) * 1.6, 16.5 - k * 0.2 + k * 0.9, Math.max(0.8, 3.4 - k * 0.55), 0x3a8af0);
    ball(r, 10.5, 9, 6.6, [0x1a4ab0, 0x3a9af0, 0xa8e4ff, 0xffffff]);
    r.disc(10.5, 9, 2.6, 0xffffff);
    return rim(r, 0x0a1a4a);
  },
  /** A paper crane, seen from above. */
  crane: () => {
    const r = paint(HW, HW, (x, y) => {
      const dx = Math.abs(x - 10.5);
      const wing = y > 6 && y < 14 && dx < 9.5 - Math.abs(y - 10) * 1.6;
      const body = dx < 1.6 && y > 1 && y < 20;
      const head = y < 6 && dx < (y - 1) * 0.5;
      if (!wing && !body && !head) return null;
      return body ? 0xffffff : x < 10.5 ? 0xfff4e8 : 0xd8ccc0;
    });
    r.set(10, 1, 0xd2361f);
    return rim(r);
  },
  /** A temari ball: bands of bright thread. */
  temari: () => {
    const r = paint(HW, HW, (x, y) => {
      const dx = x - 10.5;
      const dy = y - 10.5;
      const d = Math.hypot(dx, dy);
      if (d > 8) return null;
      const a = Math.atan2(dy, dx);
      const band = Math.floor(((a + Math.PI) / TAU) * 8 + d * 0.18) % 4;
      return d < 1.6 ? 0xffe060 : [0xd2361f, 0xffe060, 0x2a9a7a, 0xffffff][band];
    });
    return rim(r);
  },
  /** A goldfish. */
  fish: () => {
    const r = paint(HW, HW, (x, y) => {
      const dx = x - 10.5;
      const body = (dx / 4.2) ** 2 + ((y - 8) / 6.5) ** 2 <= 1;
      const tail = y > 13 && y < 20 && Math.abs(dx) < (y - 12) * 0.75;
      if (!body && !tail) return null;
      return tail ? (Math.floor(Math.abs(dx)) % 2 ? 0xff7a3a : 0xffb070) : dx < -1 && y < 8 ? 0xffd0a0 : y > 10 ? 0xffffff : 0xf0601a;
    });
    r.set(8, 5, INK);
    r.set(12, 5, INK);
    return rim(r, 0x4a1a08);
  },
  /** A firefly: a small dark body in its own light. */
  firefly: () => {
    const r = new Raster(HW, HW);
    r.disc(10.5, 10.5, 8.5, 0xc8f040, 0.28);
    r.disc(10.5, 10.5, 6, 0xe0ff70, 0.5);
    r.disc(10.5, 11.5, 3.2, 0xf8ffb0);
    r.rect(9, 5, 3, 5, 0x2a2a1a);
    return r;
  },
  /** A soap bubble: a thin skin, a glint. */
  bubble: () => {
    const r = paint(HW, HW, (x, y) => {
      const d = Math.hypot(x - 10.5, y - 10.5);
      if (d > 8.5) return null;
      return d > 7 ? (x + y < 21 ? 0xc8f4ff : 0x8ac8f0) : null;
    });
    r.disc(10.5, 10.5, 7, 0xa8e4ff, 0.22);
    r.rect(6, 6, 3, 2, 0xffffff);
    r.set(6, 8, 0xffffff);
    return r;
  },
  /** A little ghost: white, two eyes, a wisp of a tail. */
  ghost: () => {
    const r = paint(HW, HW, (x, y) => {
      const dx = x - 10.5;
      if (y < 12) return Math.hypot(dx, y - 9) <= 6.5 ? (dx < -2 && y < 8 ? 0xffffff : 0xeef0fa) : null;
      const half = 6.5 - (y - 12) * 0.75 + Math.sin(y * 1.6) * 0.8;
      return Math.abs(dx - (y - 12) * 0.35) <= half ? 0xd8dcf0 : null;
    });
    r.rect(7, 8, 2, 3, INK);
    r.rect(12, 8, 2, 3, INK);
    return rim(r, 0x2a2a5a);
  },
  /** A swallow in flight: dark blue, a white belly, a forked tail. */
  swallow: () => {
    const r = paint(HW, HW, (x, y) => {
      const dx = Math.abs(x - 10.5);
      const wing = y > 5 && y < 12 && dx < 10 - Math.abs(y - 7) * 1.4 && dx > (y - 7) * 0.2;
      const body = dx < 2.2 && y > 1 && y < 14;
      const tail = y >= 14 && y < 20 && dx > (y - 14) * 0.3 && dx < 1 + (y - 14) * 0.7;
      if (!wing && !body && !tail) return null;
      return body && y > 5 && dx < 1.2 ? 0xffffff : y < 4 && body ? 0xd2361f : 0x1a2a6a;
    });
    return rim(r, 0xc8d8ff);
  },
};

/** Every skin's frames: { name, raster }. */
export function shotSkins() {
  const out = [];
  for (const [id, draw] of Object.entries(BASIC)) out.push({ name: `ps_needle_${id}`, raster: draw() });
  for (const [id, draw] of Object.entries(SPREAD)) out.push({ name: `ps_spread_${id}`, raster: draw() });
  for (const [id, draw] of Object.entries(LASER)) for (const l of [1, 2, 3]) out.push({ name: `ps_laser_${l}_${id}`, raster: draw(l) });
  for (const [id, draw] of Object.entries(HOMING)) out.push({ name: `ps_homing_0_${id}`, raster: draw() });
  return out;
}
