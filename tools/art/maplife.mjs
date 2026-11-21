// Life on the map (docs/plan-mapa.md, iteration 6): what moves over it, seen from above at 540 px like the landmarks.
// A ferry with its wake, a Shinkansen train, puffs of smoke and steam (drawn white, tinted in the game), the soft
// shadow of a cloud. Each frame is drawn heading east (+x); the game turns it along its way.
import { Raster, fbm } from '../lib/raster.mjs';
import { HiSprite, tones } from '../lib/hisprite.mjs';

const RAMPS = {
  hull: tones([0x8a90a4, 0xe8ebf2, 0xffffff]),
  deck: tones([0x6a7488, 0xb4bccc, 0xeef2f8]),
  funnel: tones([0x7a1810, 0xd8401e, 0xff8a5a]),
  roof: tones([0x9aa0b0, 0xe4e8ee, 0xffffff]),
};

/** A ferry seen from above, bow to the east: a white hull, decks stepping up, the funnel; its wake spreading behind. */
function ferry() {
  const W = 30;
  const H = 11;
  const cy = 5.5;
  const s = new HiSprite(W, H, RAMPS);
  // the hull: a long white shape, the bow pointed, the stern square
  s.poly([[11, cy - 3], [24, cy - 3], [29, cy], [24, cy + 3], [11, cy + 3]], 'hull', { flat: 0.62, pat: (px, py) => (py < cy ? 0.1 : -0.12) });
  // the decks, stepping up towards the bridge
  s.poly([[12.5, cy - 2], [22, cy - 2], [24, cy], [22, cy + 2], [12.5, cy + 2]], 'deck', { flat: 0.6, pat: (px, py) => (py < cy ? 0.1 : -0.1) });
  s.poly([[15, cy - 1.4], [21.5, cy - 1.4], [22.5, cy], [21.5, cy + 1.4], [15, cy + 1.4]], 'hull', { flat: 0.72 });
  // the bridge's windows, the funnel
  s.line(21.6, cy - 1, 21.6, cy + 1, 0x2a3a5a);
  // (the funnel a short red oval with its black top towards the stern, the lifeboats along the sides)
  s.ellipse(16.2, cy, 1.6, 1, 'funnel', { bias: 0.05 });
  s.px(15, cy, 0x2a1a18);
  for (const x of [18.5, 20]) s.px(x, cy - 1.8, 0xe8a030).px(x, cy + 1.6, 0xe8a030);
  const art = s.render({ outline: 1, rim: 0.1, dither: 0.6, grain: 0.06, outlineColor: 0x1a2030 });
  const out = new Raster(W, H);
  // the wake: two lines of foam opening out behind the stern, the churned water between them
  for (let x = 0; x < 12; x++) {
    const t = (12 - x) / 12;
    const spread = 2.6 + t * 2.4;
    const a = 0.75 * (1 - t * 0.8);
    out.set(x, Math.round(cy - spread), 0xf4fbff, a);
    out.set(x, Math.round(cy + spread), 0xf4fbff, a);
    if (x > 4 && x % 2) out.set(x, Math.round(cy), 0xe0f2ff, a * 0.7);
  }
  out.blit(art, 0, 0);
  return out;
}

/** A Shinkansen train seen from above, heading east: white cars, the long noses at both ends, the blue line along it. */
function shinkansen() {
  const W = 34;
  const H = 6;
  const cy = 3;
  const s = new HiSprite(W, H, RAMPS);
  const half = (x) => {
    const nose = 7;
    if (x < nose) return 0.6 + 1.4 * Math.sin(((x / nose) * Math.PI) / 2);
    if (x > W - nose) return 0.6 + 1.4 * Math.sin((((W - x) / nose) * Math.PI) / 2);
    return 2;
  };
  s.paint([0, 0, W - 1, H - 1], (x, y) => Math.abs(y - cy) <= half(x), 'roof', (px, py) => 0.66 + (py < cy ? 0.1 : -0.12));
  // the blue line down each side, the joints between the cars, the pantographs, the drivers' windows
  for (let x = 2; x < W - 2; x++) {
    const h = half(x + 0.5);
    if (h > 1.2) {
      s.px(x, cy - h + 0.6, 0x2a5ac8);
      s.px(x, cy + h - 0.9, 0x1a3a9a);
    }
  }
  for (const x of [11, 17, 23]) s.line(x, cy - 1.4, x, cy + 1.4, 0x5a6070);
  for (const x of [14, 20]) s.px(x, cy - 0.4, 0x3a3a48).px(x, cy + 0.4, 0x3a3a48);
  s.px(5, cy - 0.5, 0x1a2440).px(5, cy + 0.4, 0x1a2440).px(W - 6, cy - 0.5, 0x1a2440).px(W - 6, cy + 0.4, 0x1a2440);
  return s.render({ outline: 1, rim: 0.08, dither: 0.5, grain: 0.04, outlineColor: 0x1a1c26 });
}

/** A soft puff of smoke or steam, white, lit from the top left, its edge thinning out. */
function puff(d, seed) {
  const r = new Raster(d, d);
  const c = (d - 1) / 2;
  for (let y = 0; y < d; y++)
    for (let x = 0; x < d; x++) {
      const nx = (x - c) / (d / 2);
      const ny = (y - c) / (d / 2);
      const n = fbm(x, y, { seed, scale: d / 3, octaves: 2 }) - 0.5;
      const dist = Math.hypot(nx, ny) + n * 0.45;
      if (dist >= 1) continue;
      const a = Math.min(1, (1 - dist) * 2.2);
      const light = 0.78 + (-nx - ny) * 0.14;
      const v = Math.round(255 * Math.max(0.55, Math.min(1, light)));
      r.setRGBA(x, y, v, v, Math.min(255, v + 6), Math.round(a * 255));
    }
  return r;
}

/** A cloud's shadow: a soft, ragged dark patch, darkest in its middle. */
function cloudShadow(seed) {
  const W = 96;
  const H = 64;
  const r = new Raster(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const nx = (x - W / 2) / (W / 2);
      const ny = (y - H / 2) / (H / 2);
      const d = Math.hypot(nx, ny) + (fbm(x, y, { seed, scale: 26, octaves: 3 }) - 0.5) * 0.6;
      if (d >= 1) continue;
      const a = Math.min(1, (1 - d) * 1.3);
      r.setRGBA(x, y, 8, 16, 34, Math.round(a ** 1.6 * 255));
    }
  return r;
}

/** The frames, for the atlas: [{ name, raster }]. */
export function mapLife() {
  return [
    { name: 'ferry', raster: ferry() },
    { name: 'shinkansen', raster: shinkansen() },
    { name: 'puff0', raster: puff(9, 3) },
    { name: 'puff1', raster: puff(13, 5) },
    { name: 'puff2', raster: puff(17, 7) },
  ];
}

/** The clouds' shadows, on their own (the game shows them smoothed, at any size). */
export function mapClouds() {
  return [
    { name: 'cloud0', raster: cloudShadow(11) },
    { name: 'cloud1', raster: cloudShadow(23) },
  ];
}
