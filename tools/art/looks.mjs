// Small looks out of the gachapon (plan-gacha.md, 4.1 and 4.4), in the gacha atlas: the HUD's life icons
// (lifeicon_<id>, the size of icon_life in sprites540) and whatever else is a small picture of its own.
import { Raster } from '../lib/raster.mjs';

export const INK = 0x14101c;
const TAU = Math.PI * 2;

/** A dark line round whatever is painted (the canvas keeps a pixel of margin for it). */
export function rim(r, col = INK) {
  const solid = (x, y) => r.alpha(x, y) > 128;
  const add = [];
  for (let y = 0; y < r.h; y++)
    for (let x = 0; x < r.w; x++) if (!r.alpha(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) add.push([x, y]);
  for (const [x, y] of add) r.set(x, y, col);
  return r;
}

/** Paint by a function of the pixel's centre: fn(x, y) -> a colour, or null (leave what is there). */
export function paint(r, fn) {
  for (let y = 0; y < r.h; y++)
    for (let x = 0; x < r.w; x++) {
      const c = fn(x + 0.5, y + 0.5);
      if (c != null) r.set(x, y, c);
    }
  return r;
}

/** A ball or an egg shaded from the upper left: ramp from dark to light. */
export function ball(r, cx, cy, rx, ry, ramp) {
  return paint(r, (x, y) => {
    const dx = (x - cx) / rx;
    const dy = (y - cy) / ry;
    const d = dx * dx + dy * dy;
    if (d > 1) return null;
    const l = 0.5 + 0.5 * (-dx * 0.55 - dy * 0.6 + Math.sqrt(1 - d) * 0.6);
    return ramp[Math.max(0, Math.min(ramp.length - 1, Math.floor(l * ramp.length)))];
  });
}

export const inPoly = (pts, x, y) => {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
export const poly = (r, pts, col) => paint(r, (x, y) => (inPoly(pts, x, y) ? col : null));
export const starPts = (cx, cy, n, R, inner, rot = 0) => Array.from({ length: n * 2 }, (_, i) => {
  const a = rot - Math.PI / 2 + (i * Math.PI) / n;
  const q = i % 2 ? inner : R;
  return [cx + Math.cos(a) * q, cy + Math.sin(a) * q];
});

// ------------------------------------------------------------------ life icons: 27 x 24
const LW = 27;
const LH = 24;
const RED = [0x8a1420, 0xd0283a, 0xf0485a, 0xff8a8a];
export const LIFE_ICONS = {
  heart: () => {
    const r = new Raster(LW, LH);
    paint(r, (x, y) => {
      const u = ((x - 13.5) / 10.5) * 1.2;
      const v = -((y - 11.5) / 10.5) * 1.2 + 0.15;
      if ((u * u + v * v - 1) ** 3 - u * u * v * v * v > 0) return null;
      return x + y < 17 ? RED[3] : x + y < 26 ? RED[2] : x + y < 33 ? RED[1] : RED[0];
    });
    r.rect(7, 6, 3, 2, 0xffffff);
    return rim(r);
  },
  sakura: () => {
    const r = new Raster(LW, LH);
    for (let k = 0; k < 5; k++) {
      const a = (k * TAU) / 5;
      ball(r, 13.5 + Math.sin(a) * 6.2, 12 - Math.cos(a) * 6.2, 4.6, 4.6, [0xd86a9a, 0xf08bb0, 0xffb8d0, 0xffe0ec]);
    }
    r.disc(13.5, 12, 2.6, 0xffe080);
    r.disc(13.5, 12, 1.2, 0xd0703a);
    return rim(r);
  },
  onigiri: () => {
    const r = new Raster(LW, LH);
    paint(r, (x, y) => {
      // a rounded triangle of rice
      const half = 2.5 + ((y - 2) / 19) * 9.5;
      if (y < 2 || y > 21.5 || Math.abs(x - 13.5) > half) return null;
      if (y > 19.5 && Math.abs(x - 13.5) > half - 1.5) return null;
      return x - 13.5 < -half * 0.3 ? 0xffffff : x - 13.5 > half * 0.5 ? 0xc8c8dc : 0xeeeef6;
    });
    r.rect(9, 14, 9, 8, 0x1c2a24);
    r.rect(10, 15, 2, 6, 0x34493c);
    return rim(r);
  },
  daruma: () => {
    const r = new Raster(LW, LH);
    ball(r, 13.5, 12.5, 10, 10.5, RED);
    ball(r, 13.5, 10.5, 6.2, 5, [0xd8c8a0, 0xf4e8c8, 0xfff8e4]);
    r.disc(11, 10, 1.5, INK);
    r.disc(16, 10, 1.5, INK);
    r.rect(12, 13, 3, 1, 0x8a1420);
    r.rect(10, 18, 7, 2, 0xffd040);
    return rim(r);
  },
  star: () => {
    const r = new Raster(LW, LH);
    poly(r, starPts(13.5, 12.6, 5, 11, 5), 0xf0b432);
    poly(r, starPts(13.5, 12.6, 5, 8, 3.6), 0xffe04f);
    r.disc(12, 10.5, 1.6, 0xfff8c0);
    return rim(r);
  },
  lantern: () => {
    const r = new Raster(LW, LH);
    ball(r, 13.5, 12, 9, 8.5, RED);
    paint(r, (x, y) => (Math.hypot((x - 13.5) / 9, (y - 12) / 8.5) <= 1 && Math.floor(y) % 4 === 1 ? 0x8a1420 : null)); // its ribs
    r.disc(13.5, 12, 3.2, 0xffe080);
    r.disc(13.5, 12, 1.6, 0xffffff);
    r.rect(9, 2, 9, 2, INK);
    r.rect(9, 20, 9, 2, INK);
    r.rect(13, 22, 1, 1, 0xffd040);
    return rim(r);
  },
};

/** Every frame for the gacha atlas. */
export function lookArt() {
  const out = [];
  for (const [id, make] of Object.entries(LIFE_ICONS)) out.push({ name: `lifeicon_${id}`, raster: make() });
  return out;
}
