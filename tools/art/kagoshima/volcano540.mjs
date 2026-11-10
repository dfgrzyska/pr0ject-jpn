// Sakurajima's living parts at 540 px, painted to sit inside the background's own crater and cones
// (tools/art/kagoshima/lava.mjs) rather than on top of them: the same rock and lava colours, no outline, the
// edges fraying into what is under them. The summit crater (47 x 35 -> 141 x 105) is the heart of the lava
// lake: plugged by a dome of crust (shut), then the lake heaving open with a fountain at its centre (open),
// then crusted over and cold. The side vents (23 -> 69) are the throats of the parasitic cones, lava welling up
// and spilling over the lip down the slope; dead, a plug of black crust breathing steam.
import { Raster, fbm, mix, bayer } from '../../lib/raster.mjs';
import { hash } from '../../lib/hisprite.mjs';

const ROCK = [0x1e1a1c, 0x2c2628, 0x3c3436, 0x4e4648, 0x625a5a, 0x7a7270];
const ASH = [0x4e4c4c, 0x5e5c5a, 0x6e6c68, 0x807e78, 0x949088];
const HOT = [0xc82a08, 0xff4a10, 0xff8a20, 0xffc040, 0xffe890];
const ramp = (pal, v, x, y) => pal[Math.max(0, Math.min(pal.length - 1, Math.floor(v * pal.length + (bayer(x, y) - 0.5) * 0.9)))];

/** Plates: the distance to the nearest jittered cell point and to the second, the nearest cell's id. */
function cells(x, y, size, seed) {
  const gx = Math.floor(x / size);
  const gy = Math.floor(y / size);
  let d1 = 1e9;
  let d2 = 1e9;
  let id = 0;
  let px = 0;
  let py = 0;
  for (let j = -1; j <= 1; j++)
    for (let i = -1; i <= 1; i++) {
      const cx = (gx + i + 0.15 + hash(gx + i, gy + j, seed) * 0.7) * size;
      const cy = (gy + j + 0.15 + hash(gx + i, gy + j, seed + 1) * 0.7) * size;
      const d = Math.hypot(x - cx, y - cy);
      if (d < d1) {
        d2 = d1;
        d1 = d;
        id = hash(gx + i, gy + j, seed + 2);
        px = cx;
        py = cy;
      } else if (d < d2) d2 = d;
    }
  return { edge: (d2 - d1) / size, id, dx: (x - px) / size, dy: (y - py) / size };
}

/** Fray an edge: past `from` of the radius the pixels thin out (dithered) until none are left at 1. */
const fray = (r, from, x, y) => r < from || (r < 1 && hash(x, y, 77) * 0.5 + bayer(x, y) * 0.5 > (r - from) / (1 - from));

export function crater(state, f) {
  const W = 141;
  const H = 105;
  const img = new Raster(W, H);
  const cx = 70.5;
  const cy = 52.5;
  const spin = f * 0.05; // the lake's crust drifting round between the frames
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      const jag = (fbm(x, y, { seed: 41, scale: 10, octaves: 3 }) - 0.5) * 0.22;
      const r = Math.hypot((px - cx) / 70, (py - cy) / 52) + jag;
      if (!fray(r, 0.72, x, y)) continue;
      const lit = 1 - Math.hypot(px - cx + 24, py - cy + 20) / 120; // the dome catches the light on its upper left
      const a = Math.atan2(py - cy, px - cx) + spin * (1 - r);
      const d = Math.hypot(px - cx, py - cy);
      const qx = cx + Math.cos(a) * d + (fbm(x, y, { seed: 46, scale: 8, octaves: 2 }) - 0.5) * 8;
      const qy = cy + Math.sin(a) * d + (fbm(x + 40, y, { seed: 46, scale: 8, octaves: 2 }) - 0.5) * 8;
      if (state === 'cold') {
        // the lake crusted over and gone grey, its plates' edges sagging, a last dull red in a crack or two
        const p = cells(qx, qy, 9, 70);
        let c = ramp(ROCK, 0.22 + p.id * 0.28 + lit * 0.32 - (p.dx + p.dy) * 0.14 + (hash(x, y, 5) - 0.5) * 0.12, x, y);
        if (hash(x, y, 12) < 0.1 + lit * 0.1) c = ramp(ASH, 0.2 + lit * 0.5, x, y); // ash settled on it
        if (p.edge < 0.08) c = ramp(ROCK, 0.2, x, y);
        if (p.edge < 0.04 && hash(x >> 1, y >> 1, 9) < 0.12) c = 0x7a2010;
        img.set(x, y, c);
        continue;
      }
      if (state === 'shut') {
        // a dome of crust plugging the throat: blocky plates, the cracks between them glowing, hotter at the top
        const p = cells(qx, qy, 8 + r * 6, 71);
        const gap = 0.07 + (1 - Math.min(1, r)) * 0.1;
        // a few long cracks run out from the top of the dome
        const ray = Math.abs(Math.sin(a * 3.5 + fbm(x, y, { seed: 49, scale: 12 }) * 3)) < 0.06 + (1 - r) * 0.06;
        if (p.edge < gap || ray || r < 0.06) {
          const q = (1 - r) * 0.8 + (1 - p.edge / gap) * 0.25 + (fbm(x, y, { seed: 48, scale: 4 }) - 0.5) * 0.3;
          img.set(x, y, HOT[Math.max(0, Math.min(4, Math.floor(q * 4.4)))]);
          continue;
        }
        const v = 0.18 + lit * 0.5 + p.id * 0.18 - (p.dx + p.dy) * 0.16 + (hash(x, y, 6) - 0.5) * 0.14;
        let c = ramp(ROCK, v, x, y);
        if (p.edge < gap + 0.08) c = mix(c, 0x8a2010, 0.5); // the plates' edges lit red from under them
        img.set(x, y, c);
        continue;
      }
      // open: the lake heaving, plates of crust tearing apart, the cracks widest in the middle, a fountain of
      // lava at the centre, spatter flung out of it
      const t = r / 0.72;
      const p = cells(qx, qy, t < 0.45 ? 5.5 : 8, 72 + (f % 2));
      const gap = 0.14 + (1 - t) ** 1.5 * 1.6;
      if (p.edge < gap || t < 0.28) {
        const boil = fbm(x + f * 7, y - f * 5, { seed: 47, scale: 5, octaves: 2 });
        const q = Math.min(1, (1 - p.edge / gap) * 0.3 + (1 - t) * 0.85 + (boil - 0.5) * 0.45);
        img.set(x, y, HOT[q > 0.82 ? 4 : q > 0.62 ? 3 : q > 0.42 ? 2 : q > 0.22 ? 1 : 0]);
        continue;
      }
      img.set(x, y, mix(ramp(ROCK, 0.1 + p.id * 0.26 + lit * 0.2 - (p.dx + p.dy) * 0.14, x, y), 0x8a2010, p.edge < gap + 0.25 ? 0.55 : 0.18));
    }
  if (state === 'open') {
    // the fountain: a burst of molten rock at the centre, blobs thrown up and falling back
    const blobs = f ? [[-14, -10, 3.4], [16, -6, 2.8], [4, -18, 2.4], [-6, 12, 2.6], [22, 10, 2], [-24, 2, 2.2]] : [[-10, -14, 2.8], [12, -12, 3.2], [-2, -20, 2], [8, 12, 2.6], [-22, 8, 2.2], [26, -2, 2]];
    for (const [dx, dy, rr] of blobs) {
      img.disc(cx + dx, cy + dy, rr + 1, HOT[1]);
      img.disc(cx + dx, cy + dy, rr, HOT[3]);
      img.disc(cx + dx - rr * 0.3, cy + dy - rr * 0.3, rr * 0.45, HOT[4]);
    }
    img.ellipse(cx, cy - 2, 9 + f, 7 + f, HOT[3]);
    img.ellipse(cx, cy - 3, 5 + f * 0.5, 4, HOT[4]);
  }
  if (state === 'cold') {
    // steam still curling off it
    for (let k = 0; k < 6; k++) {
      const x0 = 34 + k * 14 + (k % 2) * 4;
      for (let j = 0; j < 20; j++) img.set(Math.round(x0 + Math.sin(j * 0.4 + k) * 2), Math.round(60 - k * 3 - j), 0xe8e4e0, 0.32 - j * 0.014);
    }
  }
  return img;
}

export function vent(f, dead) {
  const S = 69;
  const img = new Raster(S, S);
  const c = 34.5;
  const cy = 30; // the throat sits a little up the cone; the spill runs down from it
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      const jag = (fbm(x, y, { seed: 91, scale: 6, octaves: 2 }) - 0.5) * 0.2;
      const r = Math.hypot((px - c) / 31, (py - cy) / 27) + jag;
      const ang = Math.atan2(py - cy, px - c);
      const lit = -(Math.cos(ang) * 0.6 + Math.sin(ang) * 0.8);
      // the lava spilling over the lower lip, a tongue running down the slope (a crust on its edges)
      const sx = c + Math.sin(py * 0.22 + 1) * 2.5;
      const sw = py > cy ? 6.5 - (py - cy) * 0.11 + (fbm(x, y, { seed: 93, scale: 4 }) - 0.5) * 2 : 0;
      const spill = !dead && py > cy + 6 && py < 67 && Math.abs(px - sx) < sw;
      if (spill) {
        const core = 1 - Math.abs(px - sx) / sw;
        const pulse = (Math.sin(py * 0.5 - f * 1.6) + 1) * 0.5;
        const q = core * 0.7 + pulse * 0.25 - (py - cy) / 90 + (hash(x, y, 3) - 0.5) * 0.2;
        img.set(x, y, core < 0.25 ? (hash(x >> 1, y >> 1, 4) < 0.5 ? ROCK[1] : 0x8a2010) : HOT[Math.max(0, Math.min(4, Math.floor(q * 5)))]);
        continue;
      }
      if (!fray(r, 0.78, x, y)) continue;
      if (r > 0.6) {
        // the lip of the throat, bright where the light catches it, lit red from inside
        const v = 0.62 + lit * 0.28 - (r - 0.6) * 1.2 + (hash(x, y, 5) - 0.5) * 0.2;
        img.set(x, y, mix(ramp(ROCK, v, x, y), 0xa83a18, r < 0.68 ? 0.38 : 0.08));
        continue;
      }
      if (r > 0.42) {
        // the inner wall, banded, falling into the glow
        const band = Math.floor(r * 24 + fbm(x, y, { seed: 95, scale: 8 }) * 2);
        const v = 0.3 - lit * 0.28 + (band % 2 ? 0.1 : -0.05);
        img.set(x, y, mix(ramp(ROCK, v, x, y), dead ? 0x3a2a26 : 0x9a2a10, dead ? 0.2 : ((0.6 - r) / 0.18) ** 2 * 0.7));
        continue;
      }
      if (dead) {
        // plugged: black crust, ash on it, a last ember
        const p = cells(px, py, 6, 96);
        let col = ramp(ROCK, 0.14 + p.id * 0.3 - (p.dx + p.dy) * 0.12, x, y);
        if (p.edge < 0.07) col = ROCK[0];
        if (hash(x, y, 8) < 0.12) col = ASH[2];
        img.set(x, y, col);
        continue;
      }
      // the throat: molten rock welling up, crusts bobbing in it
      const p = cells(px + f * 2, py - f * 1.5, 5, 97 + f);
      const t = r / 0.42;
      const gap = 0.18 + (1 - t) * 1.2;
      if (p.edge < gap) {
        const q = (1 - t) * 0.9 + (1 - p.edge / gap) * 0.3 + (fbm(x + f * 5, y, { seed: 98, scale: 3 }) - 0.5) * 0.3;
        img.set(x, y, HOT[Math.max(0, Math.min(4, Math.floor(q * 4.6)))]);
      } else img.set(x, y, mix(ROCK[1], 0x8a2010, 0.45));
    }
  if (dead) {
    for (let k = 0; k < 3; k++) for (let j = 0; j < 22; j++) img.set(Math.round(c - 6 + k * 6 + Math.sin(j * 0.45 + k * 2) * 1.8), Math.round(cy - 2 - j), 0xe8e4e0, 0.34 - j * 0.014);
    img.disc(c + 3, cy + 1, 1.2, HOT[1]);
  } else {
    // a spatter of lava thrown from the throat
    for (const [dx, dy] of f ? [[-9, -12], [8, -14], [2, -19]] : [[-5, -16], [10, -10], [-12, -6]]) {
      img.disc(c + dx, cy + dy, 1.6, HOT[2]);
      img.set(Math.round(c + dx), Math.round(cy + dy), HOT[4]);
    }
  }
  return img;
}
