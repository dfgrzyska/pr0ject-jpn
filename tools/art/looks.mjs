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

// ------------------------------------------------------------------ companions: 27 x 27, flying behind the ship
const PW = 27;
const ORANGE = [0xa8501a, 0xe0782a, 0xf8a04a, 0xffc880];
const BROWN = [0x4a3020, 0x7a5234, 0xa0744c, 0xc89868];
const WHITE = [0xb8b8cc, 0xdcdcea, 0xf4f4fa, 0xffffff];
const CREAM = [0xb89a5a, 0xe8d090, 0xfff0b8, 0xffffd8];
const GREEN = [0x1f5a2a, 0x37903f, 0x5cc05a, 0x9ae48a];
const BLUE = [0x1c3f9a, 0x3a82f0, 0x7ac0ff, 0xc8f0ff];
const PINK = [0xc85a85, 0xf08bb0, 0xffb8d0, 0xffe0ec];
const SHIBA = [0x9a6428, 0xd8964a, 0xf0b870, 0xffd8a0];
const AKITA = [0x9a6a38, 0xd4a872, 0xf0d4a4, 0xfff2d6]; // (Hachiko: an Akita, cream and fawn)
const pal = (fn) => {
  const r = new Raster(PW, PW);
  fn(r);
  return rim(r);
};
const eyes = (r, x1, x2, y, w = 2, h = 2, c = INK) => {
  r.rect(x1, y, w, h, c);
  r.rect(x2, y, w, h, c);
};
export const PALS = {
  kitsune: () => pal((r) => {
    poly(r, [[3, 2], [11, 8], [4, 13]], ORANGE[1]);
    poly(r, [[24, 2], [16, 8], [23, 13]], ORANGE[1]);
    poly(r, [[5, 5], [8, 8], [5, 10]], 0x3a1c10);
    poly(r, [[22, 5], [19, 8], [22, 10]], 0x3a1c10);
    ball(r, 13.5, 14.5, 10, 9, ORANGE);
    ball(r, 8, 19, 4.6, 3.6, WHITE);
    ball(r, 19, 19, 4.6, 3.6, WHITE);
    ball(r, 13.5, 20, 4, 3.4, WHITE);
    eyes(r, 7, 17, 13, 3, 1);
    r.rect(13, 19, 2, 2, INK);
    r.rect(13, 9, 1, 3, 0xd02a26); // (the mark on its brow)
  }),
  tanuki: () => pal((r) => {
    r.disc(6, 6.5, 3.6, BROWN[1]);
    r.disc(21, 6.5, 3.6, BROWN[1]);
    ball(r, 13.5, 14.5, 10.5, 9.5, BROWN);
    r.ellipse(8.5, 13.5, 3.8, 3, 0x2a1a12);
    r.ellipse(18.5, 13.5, 3.8, 3, 0x2a1a12);
    eyes(r, 8, 18, 12, 2, 2, 0xffffff);
    ball(r, 13.5, 19, 5, 3.8, CREAM);
    r.rect(13, 17, 2, 2, INK);
    poly(r, [[11, 1], [17, 2], [13, 7]], GREEN[2]); // (the leaf it changes shape with)
    r.line(12, 2, 14, 5, GREEN[0]);
  }),
  neko: () => pal((r) => {
    poly(r, [[4, 2], [11, 7], [4, 12]], WHITE[2]);
    poly(r, [[23, 2], [16, 7], [23, 12]], WHITE[2]);
    poly(r, [[5, 5], [8, 7], [5, 9]], 0xf08bb0);
    poly(r, [[22, 5], [19, 7], [22, 9]], 0xf08bb0);
    ball(r, 13.5, 13.5, 10, 8.8, WHITE);
    eyes(r, 7, 17, 12, 3, 1);
    r.rect(8, 11, 1, 1, INK);
    r.rect(18, 11, 1, 1, INK);
    r.rect(13, 15, 2, 1, 0xf08bb0);
    r.rect(12, 17, 4, 1, INK);
    r.rect(6, 21, 15, 2, 0xd02a26);
    r.disc(13.5, 23.5, 2, 0xffd040);
    r.rect(13, 24, 1, 1, INK);
  }),
  daruma: () => pal((r) => {
    ball(r, 13.5, 14, 10.5, 11, RED);
    ball(r, 13.5, 11.5, 6.6, 5.6, CREAM);
    r.disc(11, 11, 1.7, INK);
    r.disc(16.5, 11, 1.7, INK);
    r.rect(8, 8, 4, 1, INK);
    r.rect(15, 8, 4, 1, INK);
    r.rect(12, 14, 3, 1, 0x8a1420);
    r.rect(10, 20, 7, 1, 0xffd040);
    r.rect(11, 22, 5, 1, 0xffd040);
  }),
  teruteru: () => pal((r) => {
    paint(r, (x, y) => {
      if (y < 13 || y > 25) return null;
      const half = 5 + ((y - 13) / 12) * 6.5;
      return Math.abs(x - 13.5) > half ? null : x < 10 ? 0xffffff : x > 18 ? 0xc0c4d8 : 0xe8eaf4;
    });
    ball(r, 13.5, 8.5, 7.2, 7, WHITE);
    r.rect(8, 14, 11, 1, 0xd02a26);
    eyes(r, 10, 15, 7);
    r.rect(12, 11, 3, 1, INK);
  }),
  kodama: () => pal((r) => {
    ball(r, 13.5, 21, 4.6, 4.6, WHITE);
    ball(r, 14, 10.5, 8.4, 8.8, WHITE);
    r.disc(10.5, 9.5, 1.8, INK);
    r.disc(17.5, 10.5, 1.8, INK);
    r.disc(13.5, 15, 1.4, INK);
  }),
  chochin: () => pal((r) => {
    ball(r, 13.5, 13.5, 9, 10.5, CREAM);
    paint(r, (x, y) => (Math.hypot((x - 13.5) / 9, (y - 13.5) / 10.5) <= 1 && Math.floor(y) % 4 === 2 ? 0xc8a860 : null));
    r.rect(8, 1, 11, 2, INK);
    r.rect(8, 24, 11, 2, INK);
    r.disc(13.5, 9.5, 3.6, 0xffffff);
    r.disc(13.5, 10, 1.8, INK);
    r.rect(8, 15, 11, 3, 0x5a1418);
    r.rect(12, 16, 4, 6, 0xe0303a);
    r.rect(13, 17, 1, 4, 0xff7a80);
  }),
  kasa: () => pal((r) => {
    paint(r, (x, y) => {
      if (y < 2 || y > 17) return null;
      const half = ((y - 1) / 16) * 11.5;
      if (Math.abs(x - 13.5) > half) return null;
      const rib = Math.abs((((x - 13.5) / Math.max(1, half)) * 3) % 1) < 0.14;
      return rib ? 0x5a1a40 : x < 13.5 ? 0xb04a8a : 0x8a2a68;
    });
    r.disc(13.5, 11, 3.2, 0xffffff);
    r.disc(13.5, 11.5, 1.6, INK);
    r.rect(12, 15, 3, 3, 0xe0303a);
    r.rect(12, 18, 3, 5, 0xf0c8a0);
    r.rect(9, 23, 9, 2, BROWN[1]);
    r.rect(10, 25, 2, 1, BROWN[0]);
    r.rect(15, 25, 2, 1, BROWN[0]);
  }),
  hitodama: () => pal((r) => {
    for (let k = 1; k >= 0; k -= 0.05) {
      const q = 7.6 * (1 - k) ** 1.1 + 0.6;
      ball(r, 13.5 + 5 * k * k, 17 - 14 * k, q, q, BLUE);
    }
    r.disc(12.5, 18, 3.4, 0xe8faff);
    eyes(r, 10, 15, 16, 1, 2);
  }),
  koi: () => pal((r) => {
    poly(r, [[13.5, 18], [21, 26], [13.5, 23], [6, 26]], ORANGE[2]);
    poly(r, [[8, 10], [3, 15], [8, 14]], ORANGE[3]);
    poly(r, [[19, 10], [24, 15], [19, 14]], ORANGE[3]);
    ball(r, 13.5, 11.5, 5.8, 9.5, WHITE);
    r.disc(11.5, 7, 3, 0xf0682a);
    r.disc(15.5, 13.5, 2.8, 0xf0682a);
    r.disc(12, 18, 1.8, 0xf0682a);
    eyes(r, 9, 17, 5, 1, 1);
  }),
  shiba: () => pal((r) => {
    poly(r, [[4, 2], [11, 8], [4, 11]], SHIBA[1]);
    poly(r, [[23, 2], [16, 8], [23, 11]], SHIBA[1]);
    ball(r, 13.5, 14, 10, 9.5, SHIBA);
    ball(r, 7.5, 18, 4, 3.6, WHITE);
    ball(r, 19.5, 18, 4, 3.6, WHITE);
    ball(r, 13.5, 19, 5.5, 4.4, WHITE);
    r.rect(9, 9, 2, 1, 0xfff0d0);
    r.rect(16, 9, 2, 1, 0xfff0d0);
    eyes(r, 8, 17, 12);
    r.rect(12, 16, 3, 2, INK);
    r.rect(13, 20, 2, 3, 0xf08bb0);
  }),
  // Hachiko, the Akita who waited for his master at Shibuya station every day for ten years after he died: a whole dog
  // (not a face like the others), his left ear down as his was, the tail curled over his back. Running after the
  // ship; sitting where it went down, waiting for it to come back (Player: 'wait').
  hachiko: () => pal((r) => {
    ball(r, 7, 9, 3.4, 3, AKITA); // the tail, curled over the back
    r.disc(7, 9, 1, AKITA[0]);
    for (const [x0, x1] of [[4, 1], [8, 6], [19, 22], [22, 25]]) poly(r, [[x0, 15], [x0 + 2, 15], [x1 + 2, 22], [x1, 22]], x0 < 12 ? AKITA[0] : AKITA[1]); // legs, stretched out
    ball(r, 13, 15, 8.5, 4.6, AKITA); // the body
    ball(r, 15, 18, 5, 1.8, WHITE); // the pale belly (urajiro)
    ball(r, 21, 10, 4.6, 4.2, AKITA); // the head
    ball(r, 24.2, 12, 2.4, 1.8, WHITE); // the muzzle
    r.rect(25, 11, 2, 1, INK); // the nose
    poly(r, [[19, 7], [21, 2], [23, 7]], AKITA[1]); // the right ear up
    poly(r, [[16.5, 7], [14.5, 13.5], [17, 14], [19.5, 9]], AKITA[0]); // the left ear down, as his was
    r.rect(22, 9, 1, 2, INK); // the eye
  }),
  hachiko_sit: () => pal((r) => {
    ball(r, 6, 19, 3.4, 3, AKITA); // the tail curled at his side
    r.disc(6, 19, 1, AKITA[0]);
    ball(r, 11, 19, 6.5, 5.5, AKITA); // the haunches
    ball(r, 15, 14, 4.5, 6, AKITA); // the chest up
    ball(r, 16.5, 15, 2.6, 4.4, WHITE); // its pale front
    for (const x of [14, 17]) r.rect(x, 18, 2, 6, x === 14 ? AKITA[1] : AKITA[2]); // the forelegs, straight
    ball(r, 16, 7, 4.6, 4.2, AKITA); // the head, looking along the way
    ball(r, 19.4, 9, 2.4, 1.8, WHITE);
    r.rect(20, 8, 2, 1, INK);
    poly(r, [[14, 4], [16, -1], [18, 4]], AKITA[1]);
    poly(r, [[11.5, 4], [9.5, 10.5], [12, 11], [14.5, 6]], AKITA[0]);
    r.rect(17, 6, 1, 2, INK);
  }),
  crane: () => pal((r) => {
    poly(r, [[13.5, 12], [1, 5], [7, 17]], 0xffffff);
    poly(r, [[13.5, 12], [26, 5], [20, 17]], 0xc8d0e4);
    poly(r, [[13.5, 9], [20, 18], [13.5, 24], [7, 18]], 0xe8ecf6);
    poly(r, [[13.5, 9], [13.5, 24], [7, 18]], 0xffffff);
    poly(r, [[13.5, 11], [10.5, 2], [15, 6]], 0xf4f6fc);
    r.rect(10, 1, 2, 2, 0xd02a26);
    poly(r, [[13.5, 22], [16, 26], [13.5, 25]], 0xc8d0e4);
  }),
  kappa: () => pal((r) => {
    ball(r, 13.5, 15, 10, 9, GREEN);
    paint(r, (x, y) => (y > 4 && y < 9 && Math.abs(x - 13.5) < 8.5 && (Math.floor(x) + Math.floor(y)) % 3 !== 0 ? GREEN[0] : null)); // (its fringe)
    r.ellipse(13.5, 5, 5.5, 2.6, 0xc8f0ff);
    r.rect(11, 4, 3, 1, 0xffffff);
    r.disc(9, 13.5, 1.8, INK);
    r.disc(18, 13.5, 1.8, INK);
    r.rect(9, 13, 1, 1, 0xffffff);
    r.rect(18, 13, 1, 1, 0xffffff);
    ball(r, 13.5, 19, 5, 2.8, [0xb88a20, 0xf0c040, 0xffe890]);
    r.rect(10, 19, 7, 1, 0x8a6010);
  }),
  tengu: () => pal((r) => {
    r.disc(13.5, 3, 2.6, INK);
    ball(r, 13.5, 13.5, 10, 10, RED);
    r.rect(5, 8, 7, 2, 0xffffff);
    r.rect(15, 8, 7, 2, 0xffffff);
    eyes(r, 8, 16, 11, 3, 2);
    r.rect(6, 20, 5, 2, 0xffffff);
    r.rect(16, 20, 5, 2, 0xffffff);
    ball(r, 13.5, 17.5, 2.8, 6, [0xa01828, 0xe04050, 0xff8090]);
  }),
  onigiri: () => pal((r) => {
    paint(r, (x, y) => {
      const half = 3 + ((y - 2) / 22) * 9.5;
      if (y < 2 || y > 24.5 || Math.abs(x - 13.5) > half) return null;
      if (y > 22.5 && Math.abs(x - 13.5) > half - 1.5) return null;
      return x - 13.5 < -half * 0.3 ? 0xffffff : x - 13.5 > half * 0.5 ? 0xc8c8dc : 0xeeeef6;
    });
    r.rect(8, 17, 11, 8, 0x1c2a24);
    r.rect(9, 18, 2, 6, 0x34493c);
    eyes(r, 10, 15, 11);
    r.rect(12, 14, 3, 1, INK);
    r.rect(7, 13, 2, 1, 0xff9ab0);
    r.rect(18, 13, 2, 1, 0xff9ab0);
  }),
  dango: () => pal((r) => {
    r.rect(13, 1, 1, 25, 0x8a6030);
    ball(r, 13.5, 6, 5.2, 4.6, PINK);
    ball(r, 13.5, 13.5, 5.2, 4.6, WHITE);
    ball(r, 13.5, 21, 5.2, 4.6, [0x5a8a3a, 0x8ac060, 0xb8e088, 0xe0f8b8]);
    eyes(r, 11, 15, 13, 1, 1);
  }),
  frog: () => pal((r) => {
    ball(r, 13.5, 16.5, 10.5, 8, GREEN);
    ball(r, 7.5, 8.5, 4.2, 4.2, GREEN);
    ball(r, 19.5, 8.5, 4.2, 4.2, GREEN);
    r.disc(7.5, 8.5, 2.4, 0xffffff);
    r.disc(19.5, 8.5, 2.4, 0xffffff);
    r.disc(7.5, 8.8, 1.2, INK);
    r.disc(19.5, 8.8, 1.2, INK);
    r.rect(7, 18, 13, 1, GREEN[0]);
    ball(r, 13.5, 21.5, 5, 2.4, [0xb8d890, 0xe0f4b8, 0xf8ffe0]);
    r.rect(5, 16, 2, 1, 0xff9ab0);
    r.rect(20, 16, 2, 1, 0xff9ab0);
  }),
  owl: () => pal((r) => {
    poly(r, [[5, 1], [10, 6], [5, 9]], BROWN[1]);
    poly(r, [[22, 1], [17, 6], [22, 9]], BROWN[1]);
    ball(r, 13.5, 14.5, 9.6, 10.6, BROWN);
    paint(r, (x, y) => (y > 16 && y < 24 && Math.abs(x - 13.5) < 5 && (Math.floor(x) + Math.floor(y) * 2) % 4 === 0 ? CREAM[1] : null)); // (its breast)
    r.disc(9, 11, 4.2, CREAM[2]);
    r.disc(18, 11, 4.2, CREAM[2]);
    r.disc(9, 11, 2.3, 0xffc030);
    r.disc(18, 11, 2.3, 0xffc030);
    r.disc(9, 11, 1.1, INK);
    r.disc(18, 11, 1.1, INK);
    poly(r, [[11.5, 13.5], [15.5, 13.5], [13.5, 17.5]], 0xf07a20);
  }),
  dragon: () => pal((r) => {
    poly(r, [[6, 1], [10, 8], [5, 9]], 0xf0b432);
    poly(r, [[21, 1], [17, 8], [22, 9]], 0xf0b432);
    for (const x of [10, 13.5, 17]) poly(r, [[x - 2, 7], [x, 2], [x + 2, 7]], 0xe0303a); // (its mane)
    ball(r, 13.5, 14.5, 9.6, 8.6, GREEN);
    ball(r, 13.5, 20, 6.4, 4.4, [0x37903f, 0x6ac868, 0xa8eca0, 0xd8ffd0]);
    r.disc(9, 13, 2.4, 0xffe04f);
    r.disc(18, 13, 2.4, 0xffe04f);
    r.rect(9, 11, 1, 4, INK);
    r.rect(18, 11, 1, 4, INK);
    eyes(r, 11, 15, 19, 1, 1);
    r.line(8, 21, 2, 25, 0xe0303a);
    r.line(19, 21, 25, 25, 0xe0303a);
    r.rect(11, 22, 5, 1, GREEN[0]);
  }),
  rabbit: () => pal((r) => {
    ball(r, 9, 6.5, 2.8, 6, WHITE);
    ball(r, 18, 6.5, 2.8, 6, WHITE);
    r.rect(9, 3, 1, 6, 0xffb8d0);
    r.rect(18, 3, 1, 6, 0xffb8d0);
    ball(r, 13.5, 17, 9.2, 8, WHITE);
    r.disc(9.5, 16, 1.5, 0xd02a3a);
    r.disc(17.5, 16, 1.5, 0xd02a3a);
    r.rect(13, 19, 2, 1, 0xf08bb0);
    r.rect(13, 20, 1, 2, INK);
    r.rect(6, 19, 2, 1, 0xffb8d0);
    r.rect(20, 19, 2, 1, 0xffb8d0);
  }),
};

// ------------------------------------------------------------------ the wing turrets' shot: 15 x 27, flying up
const TW = 15;
const TH = 27;
const shotArt = (fn) => {
  const r = new Raster(TW, TH);
  fn(r);
  return rim(r);
};
export const TURRET_SHOTS = {
  /** A paper talisman, its red writing and seal. */
  ofuda: () => shotArt((r) => {
    paint(r, (x, y) => (x > 3 && x < 12 && y > 1 && y < 26 ? (x < 6 ? 0xfffbe8 : x > 10 ? 0xd8c890 : 0xf4e8c0) : null));
    for (const y of [5, 9, 13]) r.rect(6, y, 3, 2, 0xd02a26);
    r.rect(5, 7, 5, 1, 0xd02a26);
    r.rect(7, 4, 1, 12, 0xd02a26);
    r.rect(5, 19, 5, 4, 0xd02a26);
    r.rect(6, 20, 3, 2, 0xfffbe8);
  }),
  /** A stalk of green bamboo, cut at a slant. */
  bamboo: () => shotArt((r) => {
    paint(r, (x, y) => {
      if (x < 4 || x > 11 || y > 26 || y < 2 + (x - 4) * 0.5) return null;
      if (Math.floor(y) % 8 === 2) return 0x1f5a2a;
      return x < 6 ? 0x9ae48a : x > 9 ? 0x37903f : 0x5cc05a;
    });
    r.rect(5, 3, 4, 1, 0xe0f8b8);
  }),
  /** A festival rocket: a red tube, a gold nose, sparks behind. */
  rocket: () => shotArt((r) => {
    poly(r, [[7.5, 1], [11, 7], [4, 7]], 0xf0b432);
    r.rect(6, 4, 1, 2, 0xfff4a8);
    paint(r, (x, y) => (x > 4 && x < 11 && y >= 7 && y < 19 ? (x < 6.5 ? 0xff7a80 : x > 9.5 ? 0x8a1420 : 0xd0283a) : null));
    r.rect(5, 10, 6, 1, 0xfff4a8);
    r.rect(5, 15, 6, 1, 0xfff4a8);
    r.rect(7, 19, 1, 3, 0x7a5234);
    for (const [x, y, c] of [[6, 21, 0xffe04f], [9, 22, 0xffa040], [7, 24, 0xffffff], [5, 25, 0xff7a1a], [9, 25, 0xffe04f]]) r.rect(x, y, 1, 1, c);
  }),
  /** A short blade: steel, a bronze guard, a wrapped hilt. */
  tanto: () => shotArt((r) => {
    paint(r, (x, y) => {
      if (y >= 17) return null;
      const half = y < 6 ? ((y - 1) / 5) * 2.6 : 2.6;
      const dx = x - 7.5;
      return y < 1 || Math.abs(dx) > half ? null : dx < -0.8 ? 0xffffff : dx > 1 ? 0x8a96b4 : 0xd0d8ec;
    });
    r.rect(3, 17, 9, 2, 0xc89a3a);
    paint(r, (x, y) => (y >= 19 && y < 26 && Math.abs(x - 7.5) < 2 ? ((Math.floor(y) + Math.floor(x)) % 2 ? 0x2a2634 : 0x5a5668) : null));
  }),
  /** A kokeshi doll: a round head, a painted body. */
  kokeshi: () => shotArt((r) => {
    paint(r, (x, y) => (y >= 11 && y < 26 && Math.abs(x - 7.5) < 3.6 ? (Math.floor(y) % 5 === 3 ? 0xffd040 : x < 6 ? 0xff7a80 : x > 10 ? 0x8a1420 : 0xd0283a) : null));
    ball(r, 7.5, 6.5, 5.2, 5, [0xc8a070, 0xf0d0a0, 0xffe8c8, 0xfff8ec]);
    r.rect(3, 2, 9, 3, 0x1c1620);
    r.rect(5, 7, 1, 1, INK);
    r.rect(9, 7, 1, 1, INK);
    r.rect(7, 9, 1, 1, 0xd0283a);
  }),
  /** A carp streamer flying up into the wind. */
  koinobori: () => shotArt((r) => {
    paint(r, (x, y) => {
      const half = y < 5 ? 1.5 + y * 0.55 : y < 19 ? 4.2 : 4.2 - (y - 19) * 0.3;
      if (y < 1 || y > 25.5 || Math.abs(x - 7.5) > half) return null;
      if (y > 21) return Math.abs(x - 7.5) < 1 ? null : 0x3a82f0;
      const scale = (Math.floor(y / 3) + Math.floor((x + (Math.floor(y / 3) % 2) * 1.5) / 3)) % 2;
      return y < 6 ? 0xf4f4fa : scale ? 0x3a82f0 : 0x7ac0ff;
    });
    r.disc(6, 3.5, 1.3, INK);
    r.rect(4, 6, 7, 1, 0xd02a26);
  }),
  /** A red paper lantern, lit. */
  lantern: () => shotArt((r) => {
    ball(r, 7.5, 13, 5.6, 9, RED);
    paint(r, (x, y) => (Math.hypot((x - 7.5) / 5.6, (y - 13) / 9) <= 1 && Math.floor(y) % 4 === 1 ? 0x8a1420 : null));
    r.disc(7.5, 13, 2.6, 0xffe080);
    r.disc(7.5, 13, 1.2, 0xffffff);
    r.rect(5, 2, 5, 2, INK);
    r.rect(5, 22, 5, 2, INK);
    r.rect(7, 24, 1, 2, 0xffd040);
  }),
  /** A spinning top: a painted disc on a wooden point. */
  koma: () => shotArt((r) => {
    r.rect(7, 1, 1, 6, 0xa0744c);
    paint(r, (x, y) => {
      const d = Math.hypot((x - 7.5) / 6.4, (y - 12) / 6.4);
      if (d > 1) return null;
      return d > 0.78 ? 0xd0283a : d > 0.55 ? 0xffd040 : d > 0.3 ? 0x3a82f0 : 0xffffff;
    });
    poly(r, [[4, 18], [11, 18], [7.5, 26]], 0xa0744c);
    r.rect(5, 18, 2, 3, 0xc89868);
  }),
};

/** Every frame for the gacha atlas. */
export function lookArt() {
  const out = [];
  for (const [id, make] of Object.entries(LIFE_ICONS)) out.push({ name: `lifeicon_${id}`, raster: make() });
  for (const [id, make] of Object.entries(PALS)) out.push({ name: `pal_${id}`, raster: make() });
  for (const [id, make] of Object.entries(TURRET_SHOTS)) out.push({ name: `ps_turret_${id}`, raster: make() });
  return out;
}
