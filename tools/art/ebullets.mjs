// Looks for the enemies' standard bullets and for the ship's hitbox marker, out of the gachapon (plan-gacha.md,
// 4.3). They ride in the gacha atlas.
//
// A shape stands in for eb_s / eb_m (tools/art/sprites.mjs) frame for frame: <frame>_<shape>, e.g. eb_s_3_star,
// eb_m_f0_heart. It is built the way the round bullet is (a soft dark plate, a dark hairline, a pale ring that
// pulses, the magenta body, the white core that pulses) on a canvas of the same size, and it always holds the
// whole round body of the bullet it replaces: what can hit is never larger than what is seen.
// A colour is not drawn at all: the game recolours the magenta of whichever shape is worn (src/game/shipSkin.js,
// with the same rule as recolour() here); eb_pal_<colour> is only its picture for the hangar and the machine.
import { Raster } from '../lib/raster.mjs';

const TAU = Math.PI * 2;
const SIZES = [['eb_s', 8, 5.4, 3], ['eb_m', 11, 7.5, 4.4]];
const lerp3 = (a, b, t) => [0, 1, 2].map((k) => Math.round(a[k] + (b[k] - a[k]) * t));
const inPoly = (pts, x, y) => {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const star = (n, inner, rot = 0) => Array.from({ length: n * 2 }, (_, i) => {
  const a = rot - Math.PI / 2 + (i * Math.PI) / n;
  const r = i % 2 ? inner : 1;
  return [Math.cos(a) * r, Math.sin(a) * r];
});
const ngon = (n, r, rot = 0) => Array.from({ length: n }, (_, i) => [Math.cos(rot - Math.PI / 2 + (i * TAU) / n) * r, Math.sin(rot - Math.PI / 2 + (i * TAU) / n) * r]);
const STAR5 = star(5, 0.5);
const SHURIKEN = star(4, 0.42).map(([x, y]) => [x * 1.15, y * 1.15]);
const HEX = ngon(6, 1.02, Math.PI / 6);
const TRI = ngon(3, 1.32);
const BLADES = [0, 1, 2, 3].map((k) => [[0, 0], [1.08, 0], [0.5, -0.56]].map(([x, y]) => {
  const a = (k * TAU) / 4;
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
}));

// The shapes: is (u, v) inside, in units of the shape's reach (a little past the round bullet's rim); y is down.
// `detail` (optional) paints over the body: (dx, dy, r, core) in pixels -> a colour, or null.
const DARK = [0x5c, 0x18, 0x66]; // (a dark of the body's own colour: it is recoloured with it)
const INK = [0x12, 0x0e, 0x1a];
export const SHAPES = {
  diamond: { in: (u, v) => Math.abs(u) + Math.abs(v) <= 1.12 },
  square: { in: (u, v) => Math.max(Math.abs(u), Math.abs(v)) <= 0.8 },
  hex: { in: (u, v) => inPoly(HEX, u, v) },
  triangle: { in: (u, v) => inPoly(TRI, u, v - 0.12) },
  star: { in: (u, v) => inPoly(STAR5, u / 1.12, v / 1.12) },
  sakura: {
    // five round petals, each notched at its tip
    in: (u, v) => {
      const r = Math.hypot(u, v);
      for (let k = 0; k < 5; k++) {
        const a = (k * TAU) / 5;
        if (Math.hypot(u - Math.sin(a) * 0.62, v + Math.cos(a) * 0.62) > 0.46) continue;
        let off = Math.atan2(u, -v) - a;
        off = Math.abs(Math.atan2(Math.sin(off), Math.cos(off)));
        if (!(r > 0.8 && off < (r - 0.8) * 0.75)) return true;
      }
      return false;
    },
  },
  ume: { in: (u, v) => [0, 1, 2, 3, 4].some((k) => Math.hypot(u - Math.sin((k * TAU) / 5) * 0.56, v + Math.cos((k * TAU) / 5) * 0.56) <= 0.47) },
  shuriken: { in: (u, v) => inPoly(SHURIKEN, u, v) },
  snowflake: {
    in: (u, v) => {
      const r = Math.hypot(u, v);
      if (r > 1.05) return false;
      for (let k = 0; k < 3; k++) {
        const a = (k * Math.PI) / 3;
        const along = Math.abs(u * Math.sin(a) - v * Math.cos(a));
        const off = Math.abs(u * Math.cos(a) + v * Math.sin(a));
        if (off <= 0.11) return true;
        if (along > 0.62 && along < 0.9 && off <= 0.11 + (0.9 - along) * 0.9) return true; // (the barbs)
      }
      return false;
    },
  },
  coin: {
    in: (u, v) => Math.hypot(u, v) <= 0.84,
    detail: (dx, dy, r, core) => {
      const m = Math.max(Math.abs(dx), Math.abs(dy));
      return m <= core * 0.5 ? INK : m <= core * 0.95 ? [255, 255, 255] : null; // (the square hole)
    },
  },
  heart: {
    in: (u, v) => {
      const x = u * 1.22;
      const y = -v * 1.22 + 0.18;
      return (x * x + y * y - 1) ** 3 - x * x * y * y * y <= 0;
    },
  },
  hitodama: {
    in: (u, v) => {
      for (let k = 0; k <= 1; k += 0.05) if (Math.hypot(u - 0.42 * k * k, v - 0.2 + 1.25 * k) <= 0.74 * (1 - k) ** 1.1 + 0.03) return true;
      return false;
    },
  },
  takoyaki: {
    in: (u, v) => Math.hypot(u, v) <= 0.84,
    // sauce over the top, two flakes of nori
    detail: (dx, dy, r, core) => (r > core * 1.25 && Math.abs(dy + core * 0.9 - Math.sin(dx * 0.8) * 1.3) < 1.1 ? DARK : null),
  },
  pinwheel: { in: (u, v) => BLADES.some((b) => inPoly(b, u, v)) },
  kiku: { in: (u, v) => Math.hypot(u, v) <= 0.8 + 0.22 * Math.abs(Math.cos(6 * Math.atan2(u, -v))) ** 0.7 },
  eye: {
    in: (u, v) => Math.hypot(u, v - 0.66) <= 1.28 && Math.hypot(u, v + 0.66) <= 1.28,
    detail: (dx, dy, r, core) => (r <= core * 0.5 ? INK : r <= core * 1.12 ? [255, 255, 255] : null), // (the pupil)
  },
};

/** One frame of a bullet of this shape (null: the round one); t: the pulse, 0..1; flash: 0..1 as it is fired. */
function frame(shape, R, body, core, t, flash = 0) {
  const N = 2 * (R + 6);
  const reach = R + 2;
  const hit = body + 0.8;
  const c = N / 2;
  const at = (x, y) => [x + 0.5 - c, y + 0.5 - c];
  const mask = new Uint8Array(N * N);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const [dx, dy] = at(x, y);
      const r = Math.hypot(dx, dy);
      mask[y * N + x] = shape ? r <= hit || shape.in(dx / reach, dy / reach) : r <= R;
    }
  // how far a pixel is from the nearest one on the other side of the edge
  const edge = (x, y) => {
    const me = mask[y * N + x];
    let best = 9;
    for (let j = -4; j <= 4; j++)
      for (let i = -4; i <= 4; i++) {
        const xx = x + i;
        const yy = y + j;
        const other = xx < 0 || yy < 0 || xx >= N || yy >= N ? 0 : mask[yy * N + xx];
        if (other !== me) best = Math.min(best, Math.hypot(i, j));
      }
    return best;
  };
  const ringW = R - 1 - body;
  const coreR = core * (0.86 + t * 0.26);
  const out = new Raster(N, N);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const [dx, dy] = at(x, y);
      const r = Math.hypot(dx, dy);
      const d = edge(x, y);
      let px = null;
      if (!mask[y * N + x]) px = d <= 3 ? [10, 6, 18, Math.round(90 * (1 - (d - 1) / 2.5))] : null;
      else if (d < 1.45) px = INK;
      else if (d < 1.45 + ringW && r > coreR) px = lerp3([0xee, 0x9c, 0xff], [255, 255, 255], t);
      else if (r > coreR) px = dx + dy < -body * 0.4 ? [0xf4, 0x78, 0xff] : [0xe6, 0x3c, 0xff];
      else px = [255, 255, 255];
      if (px && mask[y * N + x] && d >= 1.45 && shape?.detail) px = shape.detail(dx, dy, r, core) ?? px;
      if (flash) {
        const a = Math.max(0, 1 - r / (R + 5 * flash)) ** 0.5 * flash;
        if (a > 0) {
          const base = px ?? [255, 255, 255, 0];
          const baseA = (base[3] ?? 255) / 255;
          const outA = a + baseA * (1 - a);
          px = [...lerp3(base, [255, 255, 255], a / outA), Math.round(outA * 255)];
        }
      }
      if (px && (px[3] ?? 255) > 0) out.setRGBA(x, y, px[0], px[1], px[2], px[3] ?? 255);
    }
  return out;
}

/** The game's rule for a colour (shipSkin.js): the magenta of a bullet becomes `body`, its tints and darks with it. */
export function recolour(px, body) {
  const [r, g, b] = px;
  if (r - g < 40 || b - g < 40) return px;
  const t = (g - 60) / 195;
  const c = t >= 0 ? lerp3(body, [255, 255, 255], Math.min(1, t)) : body.map((v) => Math.round(v * (g / 60)));
  return [c[0], c[1], c[2], px[3] ?? 255];
}

// ---- the hitbox's markers: 15 x 15, the size of the dot they stand in for (hitbox in sprites540)
const M = 15;
function marker(inside, fill, heart, heartR = 2.1, extra = null) {
  const mask = new Uint8Array(M * M);
  const at = (x, y) => [x + 0.5 - M / 2, y + 0.5 - M / 2];
  for (let y = 0; y < M; y++) for (let x = 0; x < M; x++) mask[y * M + x] = inside(...at(x, y)) ? 1 : 0;
  const on = (x, y) => x >= 0 && y >= 0 && x < M && y < M && mask[y * M + x];
  const out = new Raster(M, M);
  for (let y = 0; y < M; y++)
    for (let x = 0; x < M; x++) {
      if (!on(x, y)) continue;
      const [dx, dy] = at(x, y);
      const rim = !(on(x - 1, y) && on(x + 1, y) && on(x, y - 1) && on(x, y + 1));
      out.set(x, y, rim ? 0x12101c : extra?.(dx, dy) ?? (Math.hypot(dx, dy) <= heartR ? heart : fill));
    }
  return out;
}
const scaled = (pts, k) => pts.map(([x, y]) => [x * k, y * k]);
export const MARKERS = {
  ring: () => marker((x, y) => Math.hypot(x, y) <= 7, 0x4fe8ff, 0xffffff, 2.2, (x, y) => (Math.hypot(x, y) > 3.4 && Math.hypot(x, y) <= 5 ? 0x0c2a3a : null)),
  square: () => marker((x, y) => Math.max(Math.abs(x), Math.abs(y)) <= 5.5, 0xffffff, 0x3a86ff, 2.4),
  diamond: () => marker((x, y) => Math.abs(x) + Math.abs(y) <= 7.2, 0xfff4a8, 0xff8a1e, 2.4),
  cross: () => marker((x, y) => (Math.abs(x) <= 2.5 && Math.abs(y) <= 7) || (Math.abs(y) <= 2.5 && Math.abs(x) <= 7), 0xffffff, 0x2fcf5a, 1.6),
  target: () => marker((x, y) => Math.hypot(x, y) <= 7, 0xffffff, 0xff3838, 1.6, (x, y) => (Math.hypot(x, y) > 3.2 && Math.hypot(x, y) <= 4.8 ? 0xff3838 : null)),
  hinomaru: () => marker((x, y) => Math.hypot(x, y) <= 7, 0xffffff, 0xe0202a, 3.6),
  star: () => marker((x, y) => inPoly(scaled(STAR5, 7.6), x, y - 0.4), 0xffe04f, 0xffffff, 1.8),
  moon: () => marker((x, y) => Math.hypot(x, y) <= 7 && Math.hypot(x - 3.2, y - 0.6) > 5.2 || Math.hypot(x, y) <= 2.2, 0xfff4a8, 0xffffff, 2.2),
  sakura: () => marker((x, y) => SHAPES.ume.in(x / 7.2, y / 7.2), 0xff9ac4, 0xfff4a8, 2),
  heart: () => marker((x, y) => SHAPES.heart.in(x / 7.4, y / 7.4), 0xff4f7a, 0xffffff, 1.7),
  coin: () => marker((x, y) => Math.hypot(x, y) <= 7, 0xf0b432, 0x12101c, 0, (x, y) => (Math.max(Math.abs(x), Math.abs(y)) <= 1.5 ? 0x12101c : Math.max(Math.abs(x), Math.abs(y)) <= 2.6 ? 0xfff4a8 : null)),
  eye: () => marker((x, y) => Math.hypot(x, y - 4.4) <= 8.6 && Math.hypot(x, y + 4.4) <= 8.6, 0xffffff, 0x12101c, 1.3, (x, y) => (Math.hypot(x, y) > 1.3 && Math.hypot(x, y) <= 3 ? 0xa24bff : null)),
};

/** Every frame for the gacha atlas. `palettes`: { id: 0xrrggbb }, the colours' pictures. */
export function enemyBulletSkins(palettes) {
  const out = [];
  for (const [id, shape] of Object.entries(SHAPES))
    for (const [name, R, body, core] of SIZES) {
      for (let k = 0; k < 8; k++) out.push({ name: `${name}_${k}_${id}`, raster: frame(shape, R, body, core, (1 + Math.cos((k / 8) * TAU)) / 2) });
      [1, 0.65, 0.3].forEach((f, k) => out.push({ name: `${name}_f${k}_${id}`, raster: frame(shape, R, body, core, 1, f) }));
      out.push({ name: `${name}_${id}`, raster: frame(shape, R, body, core, 1) });
    }
  for (const [id, c] of Object.entries(palettes)) {
    const body = [(c >> 16) & 255, (c >> 8) & 255, c & 255];
    const src = frame(null, 11, 7.5, 4.4, 0.4);
    const pic = new Raster(src.w, src.h);
    for (let y = 0; y < src.h; y++)
      for (let x = 0; x < src.w; x++) {
        const a = src.alpha(x, y);
        if (!a) continue;
        const col = src.get(x, y);
        const px = recolour([(col >> 16) & 255, (col >> 8) & 255, col & 255, a], body);
        pic.setRGBA(x, y, px[0], px[1], px[2], a);
      }
    out.push({ name: `eb_pal_${id}`, raster: pic });
  }
  for (const [id, make] of Object.entries(MARKERS)) out.push({ name: `hitbox_${id}`, raster: make() });
  return out;
}
