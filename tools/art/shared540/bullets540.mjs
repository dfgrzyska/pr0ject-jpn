// Enemy bullets and the player's shots at 540 px (docs/graphics-540-plan.md, step 6, group B and the shots of C):
// each frame three times its namesake in sprites.png. Every bullet keeps a dark rim round a bright body so it
// reads on the fine backgrounds; the standard eb_s / eb_m are already fine-pixel in sprites.png and stay there.
import { Raster, fbm } from '../../lib/raster.mjs';

const INK = 0x140c18;
const TAU = Math.PI * 2;
const mixc = (a, b, t) => {
  const c = (s) => [(s >> 16) & 255, (s >> 8) & 255, s & 255];
  const [x, y] = [c(a), c(b)];
  return x.map((v, i) => Math.round(v + (y[i] - v) * Math.max(0, Math.min(1, t)))).reduce((s, v) => (s << 8) | v, 0);
};

/** A 1 px dark rim round everything solid (alpha over half), outside it. */
function rim(r, col = INK) {
  const solid = (x, y) => r.alpha(x, y) > 128;
  const add = [];
  for (let y = 0; y < r.h; y++)
    for (let x = 0; x < r.w; x++) if (!r.alpha(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) add.push([x, y]);
  for (const [x, y] of add) r.set(x, y, col);
  return r;
}

/** A shaded ball: ramp from dark (shadow side) to light (the light from the upper left), a white glint. */
function ball(w, h, ramp, { R = Math.min(w, h) / 2 - 1.5, cx = w / 2, cy = h / 2, glint = 0xffffff, tex = null } = {}) {
  const r = new Raster(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const dx = (x + 0.5 - cx) / R;
      const dy = (y + 0.5 - cy) / R;
      const d = dx * dx + dy * dy;
      if (d > 1) continue;
      const z = Math.sqrt(1 - d);
      let l = 0.5 + 0.5 * (-dx * 0.55 - dy * 0.6 + z * 0.6);
      if (tex) l += tex(x, y);
      const k = Math.max(0, Math.min(ramp.length - 1, Math.floor(l * ramp.length)));
      r.set(x, y, ramp[k]);
    }
  if (glint) {
    const gx = Math.round(cx - R * 0.38);
    const gy = Math.round(cy - R * 0.42);
    r.set(gx, gy, glint);
    if (R > 4) for (const [ox, oy] of [[1, 0], [0, 1]]) r.set(gx + ox, gy + oy, glint, 0.8);
  }
  return r;
}

/** A flame rising from a round head, `ramp` from its edge to its white heart; frame f sways the tip. */
function flame(w, h, ramp, f, { lean = 0 } = {}) {
  const r = new Raster(w, h);
  const cx = w / 2;
  const cy = h * 0.66;
  const R = w * 0.42;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const ty = (cy - (y + 0.5)) / (h * 0.62); // 0 at the head's middle, 1 at the tip
      const sway = Math.sin(ty * 4 + f * 2.1) * w * 0.08 * Math.max(0, ty) + lean * ty * w * 0.2;
      const head = 1 - Math.hypot(x + 0.5 - cx, (y + 0.5 - cy) * 1.05) / R;
      const tw = R * Math.max(0, 1 - ty) ** 1.3;
      const tongue = ty > 0 ? 1 - Math.abs(x + 0.5 - cx - sway) / Math.max(0.6, tw) : -1;
      let v = Math.max(head, tongue);
      v += (fbm(x, y + f * 5, { seed: 41 + f, scale: Math.max(3, w / 4), octaves: 2 }) - 0.5) * 0.35;
      if (v <= 0) continue;
      r.set(x, y, ramp[Math.min(ramp.length - 1, Math.floor(v * ramp.length * 1.25))]);
    }
  return r;
}

const PEARL = [0x8a5a7a, 0xc89ab4, 0xecd0dc, 0xfff0f6, 0xffffff];
const FOX = [0x1a4aa8, 0x2a8af0, 0x6ad0ff, 0xc8f4ff, 0xffffff];
const FIRE = [0xa02010, 0xe0501a, 0xff9a2a, 0xffe070, 0xffffff];
const SNOW = [0x7a8ab0, 0xb8c8e4, 0xe4eefa, 0xffffff];
const LAVA = [0x6a1a10, 0xc0301a, 0xff6a1a, 0xffb040, 0xfff0a0];
const TAKO = [0x5a2a0a, 0x9a5a20, 0xd09040, 0xf0c070];

function pearl(w, h) {
  // nacre: a faint pink and green sheen moving over it
  return rim(ball(w, h, PEARL, { tex: (x, y) => (fbm(x, y, { seed: 9, scale: 4 }) - 0.5) * 0.25 }), 0x5a1a3a);
}
function orb(w, h, f) {
  const r = ball(w, h, [0x8a90c0, 0xc8d0f0, 0xffffff, 0xffffff]);
  if (f) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (r.alpha(x, y)) r.set(x, y, 0xffffff, 0.35);
  return rim(r);
}
function snowball(w, h) {
  return rim(ball(w, h, SNOW, { tex: (x, y) => (fbm(x, y, { seed: 3, scale: 3 }) - 0.5) * 0.3 }), 0x3a4a6a);
}
function lavaball(w, h) {
  // a crusted rock with the glow in its cracks
  const r = ball(w, h, [0x2a1a1a, 0x4a2a24, 0x6a3a2a, 0x8a4a30]);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!r.alpha(x, y)) continue;
      const n = fbm(x, y, { seed: 17, scale: Math.max(3, w / 3), octaves: 2 });
      if (Math.abs(n - 0.5) < 0.06) r.set(x, y, 0xffb040);
      else if (Math.abs(n - 0.5) < 0.1) r.set(x, y, 0xe0501a);
    }
  return rim(r, 0x2a0a08);
}
function lavaDrop(w, h) {
  return rim(ball(w, h, LAVA), 0x3a0a08);
}
function takoyaki(w, h) {
  const r = ball(w, h, TAKO, { glint: 0, tex: (x, y) => (fbm(x, y, { seed: 5, scale: 3 }) - 0.5) * 0.3 });
  // sauce on top, a zigzag of mayonnaise, green nori flecks
  const R = Math.min(w, h) / 2 - 1.5;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!r.alpha(x, y)) continue;
      const dy = (y + 0.5 - h / 2) / R;
      if (dy < -0.1) r.set(x, y, dy < -0.55 ? 0x5a2a14 : 0x3a1a0c);
      if (Math.abs(dy + 0.35 - Math.sin((x / w) * TAU * 1.5) * 0.15) < 0.09) r.set(x, y, 0xfff4d8);
      if ((x * 7 + y * 13) % 17 === 0 && dy < 0) r.set(x, y, 0x3a8a3a);
    }
  return rim(r, 0x2a1408);
}
function ink(w, h, big) {
  // an ink blot: near black with a violet sheen, a pale rim so it shows on the dark water
  const r = ball(w, h, [0x0a0612, 0x1a1028, 0x3a2050, 0x6a3a8a], { glint: 0xd0b0ff });
  const ring = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!r.alpha(x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => r.alpha(x + a, y + b) > 128)) ring.push([x, y]);
  for (const [x, y] of ring) r.set(x, y, big ? 0xff6aff : 0xe8b0ff);
  return rim(r);
}
function bubble(w, h, f) {
  // sea foam: a clear bubble, a pink rim (the hit edge), a curved highlight, a smaller bubble on it
  const r = new Raster(w, h);
  const R = Math.min(w, h) / 2 - 2;
  const cx = w / 2;
  const cy = h / 2;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / R;
      if (d > 1) continue;
      if (d > 0.82) r.set(x, y, d > 0.92 ? 0xd0306a : 0xff8ab8);
      else r.set(x, y, mixc(0xc8f4ff, 0xffffff, (1 - d) * 0.5), 0.35 + 0.25 * d);
    }
  for (let a = -2.6; a < -1.4; a += 0.05) r.set(Math.round(cx + Math.cos(a) * R * 0.62), Math.round(cy + Math.sin(a) * R * 0.62), 0xffffff);
  const bx = cx + R * (f ? 0.35 : 0.45);
  const by = cy + R * (f ? 0.4 : 0.3);
  for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) if (x * x + y * y <= 9) r.set(Math.round(bx + x), Math.round(by + y), x * x + y * y > 5 ? 0xff8ab8 : 0xffffff, 0.8);
  return rim(r, 0x3a0a1a);
}
function feather(w, h, f) {
  // a tengu's feather blade turning: a red vane with dark barbs, a pale quill
  const r = new Raster(w, h);
  const a = f ? 0.35 : -0.35;
  const cx = w / 2;
  const cy = h / 2;
  const L = Math.min(w, h) / 2 - 1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const u = (dx * Math.cos(a) + dy * Math.sin(a)) / L; // along
      const v = (-dx * Math.sin(a) + dy * Math.cos(a)) / L; // across
      const wid = 0.42 * Math.sqrt(Math.max(0, 1 - u * u)) * (u < 0 ? 0.8 : 1);
      if (Math.abs(v) > wid || Math.abs(u) > 1) continue;
      if (Math.abs(v) < 0.06) r.set(x, y, 0xfff0d8);
      else r.set(x, y, Math.floor((u + 1) * 7) % 2 ? 0xd0301a : 0xa01a10);
      if (Math.abs(v) > wid - 0.08) r.set(x, y, 0x5a0a08);
    }
  return rim(r);
}
function iceShard(w, h) {
  // a six-pointed ice crystal, a white heart
  const r = new Raster(w, h);
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) / 2 - 1.5;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const d = Math.hypot(dx, dy);
      const an = Math.atan2(dy, dx);
      const arm = Math.abs(Math.sin(an * 3));
      if (d > R * (1 - arm * 0.55)) continue;
      r.set(x, y, d < R * 0.3 ? 0xffffff : arm < 0.3 ? 0xc8f0ff : 0x6ac8f0);
    }
  return rim(r, 0x1a3a6a);
}
function icicle(w, h) {
  const r = new Raster(w, h);
  for (let y = 0; y < h; y++) {
    const t = y / (h - 1);
    const half = (w / 2 - 1) * (1 - t) ** 0.8;
    for (let x = 0; x < w; x++) {
      const dx = x + 0.5 - w / 2;
      if (Math.abs(dx) > half) continue;
      r.set(x, y, dx < -half * 0.3 ? 0xffffff : dx < half * 0.3 ? 0xb8e8ff : 0x5aa8e0);
    }
  }
  return rim(r, 0x1a3a6a);
}
function salmon(w, h) {
  // a leaping salmon, head down: silver-pink flank, dark back spotted, the tail fan at the top
  const r = new Raster(w, h);
  const cx = w / 2;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const t = y / h;
      const dx = x + 0.5 - cx;
      const half = t < 0.18 ? (0.18 - t) * w * 2.2 : (w / 2 - 1.5) * Math.sin(Math.PI * Math.min(1, (t - 0.12) / 0.92)) ** 0.7;
      if (Math.abs(dx) > half) continue;
      let c = dx < -half * 0.35 ? 0x3a4a5a : dx < half * 0.2 ? 0xd8a0a8 : 0xf0e0e8;
      if (t < 0.2) c = 0x5a6a7a; // the tail
      if (dx < -half * 0.35 && (x * 5 + y * 3) % 7 === 0) c = 0x14141a;
      r.set(x, y, c);
    }
  r.set(Math.round(cx - 2), Math.round(h * 0.86), 0x14141a);
  r.set(Math.round(cx - 2), Math.round(h * 0.86) - 1, 0xffffff);
  return rim(r);
}
function tokkuri(w, h, f) {
  // a sake flask: white glaze, a blue band, a cork; tumbling (frame 1 tilted)
  const r = new Raster(w, h);
  const cx = w / 2;
  const tilt = f ? 0.35 : 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const dx0 = x + 0.5 - cx;
      const dy0 = y + 0.5 - h / 2;
      const dx = dx0 * Math.cos(tilt) + dy0 * Math.sin(tilt);
      const t = (-dx0 * Math.sin(tilt) + dy0 * Math.cos(tilt) + h / 2) / h;
      const half = t < 0.12 ? w * 0.13 : t < 0.35 ? w * (0.1 + (t - 0.12) * 1.3) : (w / 2 - 1.5) * Math.sqrt(Math.max(0, 1 - ((t - 0.68) / 0.33) ** 2));
      if (Math.abs(dx) > half || t > 1 || t < 0) continue;
      let c = dx < -half * 0.3 ? 0xffffff : dx < half * 0.4 ? 0xe4e0d8 : 0xa8a49c;
      if (t > 0.55 && t < 0.72) c = dx < 0 ? 0x3a6ad0 : 0x24489a;
      if (t < 0.1) c = 0xc08040;
      r.set(x, y, c);
    }
  return rim(r);
}
function keg(w, h, f) {
  // a powder keg: staves, iron hoops, a lit fuse spitting sparks
  const r = new Raster(w, h);
  const top = Math.round(h * 0.28);
  for (let y = top; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const t = (y - top) / (h - 1 - top);
      const bulge = Math.sin(Math.PI * t) * 1.5;
      if (x < 1 - bulge + 1 || x > w - 2 + bulge - 1) continue;
      let c = (x % 4 === 0) ? 0x5a3418 : x < w * 0.4 ? 0xa8703a : 0x8a5a2a;
      if (Math.abs(t - 0.15) < 0.07 || Math.abs(t - 0.85) < 0.07) c = 0x3a3a44;
      r.set(x, y, c);
    }
  for (let y = 2; y < top; y++) r.set(Math.round(w / 2 + (top - y) * 0.3), y, 0x2a2a2a);
  const sx = Math.round(w / 2 + top * 0.3);
  r.set(sx, 1, 0xffffff);
  for (const [ox, oy] of f ? [[-1, 0], [1, -1], [2, 1]] : [[1, 0], [-1, -1], [-2, 1]]) r.set(sx + ox, 1 + oy, 0xffd040);
  return rim(r);
}
function steam(w, h, f) {
  const r = new Raster(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const d = Math.hypot((x + 0.5 - w / 2) / (w / 2 - 1), (y + 0.5 - h / 2) / (h / 2 - 1));
      const v = 1 - d + (fbm(x, y + f * 7, { seed: 77, scale: 6, octaves: 2 }) - 0.5) * 0.6;
      if (v <= 0.05) continue;
      r.set(x, y, v > 0.5 ? 0xffffff : v > 0.28 ? 0xffd8e8 : 0xe890b8, v > 0.28 ? 1 : 0.8);
    }
  return rim(r, 0x5a1a3a);
}
function lobMark(w, h, f) {
  // where a lobbed thing will land: a dashed ring closing in, a dot in the middle
  const r = new Raster(w, h);
  const cx = w / 2;
  const cy = h / 2;
  const R = w / 2 - 2 - f * 2;
  for (let a = 0; a < TAU; a += 0.01) {
    if (Math.floor(((a + f * 0.2) / TAU) * 12) % 2) continue;
    for (const dr of [0, 1, 2]) r.set(Math.round(cx + Math.cos(a) * (R - dr)), Math.round(cy + Math.sin(a) * (R - dr)), dr === 1 ? 0xff5aff : 0x5a0a5a);
  }
  for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) if (x * x + y * y <= 4) r.set(Math.round(cx + x), Math.round(cy + y), x * x + y * y <= 1 ? 0xffffff : 0xff5aff);
  return r;
}

// ---- the player's shots
function needle(w, h) {
  const r = new Raster(w, h);
  for (let y = 0; y < h; y++) {
    const t = y / (h - 1);
    const half = t < 0.15 ? (w / 2) * (t / 0.15) : (w / 2) * (1 - (t - 0.15) * 0.6);
    for (let x = 0; x < w; x++) {
      const dx = Math.abs(x + 0.5 - w / 2);
      if (dx > half) continue;
      r.set(x, y, dx < half * 0.4 ? 0xffffff : t > 0.75 ? 0xff9a2a : 0xffe070);
    }
  }
  return r;
}
function spreadShot(w, h) {
  return ball(w, h, [0xd0301a, 0xff6a2a, 0xffb040, 0xffffff]);
}
function laser(w, h, lvl) {
  const r = new Raster(w, h);
  for (let y = 0; y < h; y++) {
    const t = y / (h - 1);
    const taper = Math.min(1, t / 0.1, (1 - t) / 0.12);
    for (let x = 0; x < w; x++) {
      const d = Math.abs(x + 0.5 - w / 2) / (w / 2);
      if (d > taper) continue;
      r.set(x, y, d < 0.25 ? 0xffffff : d < 0.55 ? 0xa8f4ff : d < 0.8 ? 0x3ab0f0 : 0x1a5ab0);
    }
  }
  return r;
}
function homing(w, h, f) {
  // a green talisman orb with a tail
  const r = ball(w, h, [0x1a7a3a, 0x3ac85a, 0x9af0a8, 0xffffff], { R: w / 2 - 2.5, cy: h / 2 - (f ? 1 : 0) });
  for (let k = 0; k < 3; k++) r.set(Math.round(w / 2 + (f ? k - 1 : 1 - k)), h - 2 - k, 0x9af0a8, 0.7);
  return rim(r, 0x0a3a1a);
}

export function bullets540(add) {
  add('eb_pearl', pearl(21, 21));
  for (let f = 0; f < 2; f++) add(`orb_${f}`, orb(15, 15, f));
  add('snowball_0', snowball(21, 21));
  add('snowball_1', snowball(27, 27));
  add('lavaball_0', lavaball(15, 15));
  add('lavaball_1', lavaball(21, 21));
  add('eb_lava', lavaDrop(15, 15));
  add('tako_ball_0', takoyaki(15, 15));
  add('tako_ball_1', takoyaki(21, 21));
  add('eb_ink', ink(15, 15, false));
  add('eb_ink_m', ink(21, 21, true));
  for (let f = 0; f < 2; f++) add(`eb_bubble_${f}`, bubble(33, 33, f));
  for (let f = 0; f < 2; f++) add(`eb_feather_${f}`, feather(27, 27, f));
  add('eb_ice', iceShard(21, 21));
  add('icicle', icicle(15, 27));
  add('salmon', salmon(27, 45));
  add('tokkuri_0', tokkuri(21, 30, 0));
  add('tokkuri_1', tokkuri(27, 36, 1));
  for (let f = 0; f < 2; f++) add(`n_keg_${f}`, keg(27, 33, f));
  for (let f = 0; f < 2; f++) add(`eb_steam_${f}`, steam(45, 39, f));
  for (let f = 0; f < 3; f++) add(`lob_mark_${f}`, lobMark(51, 51, f));
  add('eb_fox', rim(flame(21, 21, FOX, 0), 0x0a1a4a));
  add('eb_fox_s', rim(flame(15, 15, FOX, 1), 0x0a1a4a));
  for (let f = 0; f < 2; f++) add(`kitsunebi_${f}`, rim(flame(33, 45, FOX, f), 0x0a1a4a));
  for (let f = 0; f < 2; f++) add(`misen_fire_${f}`, rim(flame(51, 51, FIRE, f), 0x3a0a08));
  // the player's
  add('ps_needle', needle(9, 21));
  add('ps_spread', spreadShot(15, 15));
  add('ps_laser_1', laser(9, 42, 1));
  add('ps_laser_2', laser(15, 48, 2));
  add('ps_laser_3', laser(21, 54, 3));
  for (let f = 0; f < 2; f++) add(`ps_homing_${f}`, homing(21, 21, f));
}
