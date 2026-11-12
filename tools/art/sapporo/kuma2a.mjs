// The bear's extra frames (docs/enemies-540-plan.md, step 2a): the sculpture thawing into the higuma over the
// phase break (kuma_thaw_0..3), the higuma rimed with frost in the phase-3 blizzard (kuma_0f, kuma_1f), and
// the cloud of breath it roars out (kuma_breath_0..3), a layer of its own over the face.
import { Raster, fbm } from '../../lib/raster.mjs';

const INK = 0x14101c;

/** Ice sculpture to bear: cracks run through the snow, chunks fall away, the brown fur shows through. */
export function thaw(ice, bear, k) {
  const w = ice.w;
  const h = ice.h;
  const out = new Raster(w, h);
  // the sculpture splits into chunks (Voronoi cells); each falls away at its own moment, the chest first
  // (the heart broke out there), so the cracks run through the whole block before the first piece drops
  const cells = [];
  let sd = 4242;
  const rnd = () => ((sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 70; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const d = Math.min(1, Math.hypot(x - w / 2, (y - h * 0.48) * 1.15) / (w * 0.55));
    cells.push([x, y, rnd() * 0.55 + d * 0.45]);
  }
  const owner = new Int16Array(w * h);
  const border = new Uint8Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let b1 = 1e9;
      let b2 = 1e9;
      let bi = 0;
      for (let i = 0; i < cells.length; i++) {
        const d = (x - cells[i][0]) ** 2 + (y - cells[i][1]) ** 2;
        if (d < b1) { b2 = b1; b1 = d; bi = i; } else if (d < b2) b2 = d;
      }
      owner[y * w + x] = bi;
      border[y * w + x] = Math.sqrt(b2) - Math.sqrt(b1) < 1.2 ? 1 : 0;
    }
  const gone = (x, y) => x < 0 || y < 0 || x >= w || y >= h ? false : cells[owner[y * w + x]][2] < k;
  const cracked = k > 0.12; // the first frame is cracks only
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const ai = ice.alpha(x, y);
      const ab = bear.alpha(x, y);
      if (gone(x, y)) {
        if (ab) out.set(x, y, bear.get(x, y), ab / 255);
        continue;
      }
      if (!ai) continue;
      const i = y * w + x;
      const near = gone(x + 1, y) || gone(x - 1, y) || gone(x, y + 1) || gone(x, y - 1);
      // how far the crack network has spread: cells close to falling show their seams
      const seam = border[i] && cracked && cells[owner[i]][2] < k + 0.35;
      if (near) out.set(x, y, INK);
      else if (seam) out.set(x, y, 0x3a5a8a);
      else if (border[y * w + x - w] && cracked && cells[owner[i]][2] < k + 0.35) out.set(x, y, 0xffffff, ai / 255);
      else out.set(x, y, ice.get(x, y), ai / 255);
    }
  return out;
}

/** Frost on the fur: rime on the upper edges of every form and a scatter of snow crystals. */
export function frost(bear) {
  const w = bear.w;
  const h = bear.h;
  const out = new Raster(w, h);
  // snowflakes stuck in the fur: little clumps of 2-3 pixels, scattered (a hash, so no pattern shows)
  const hash = (x, y) => { let v = (x * 374761393 + y * 668265263) >>> 0; v = ((v ^ (v >>> 13)) * 1274126177) >>> 0; return ((v ^ (v >>> 16)) >>> 0) / 4294967296; };
  const seed = (x, y) => hash(x, y) < 0.012;
  const flake = (x, y) => seed(x, y) || seed(x - 1, y) || seed(x, y - 1) || (seed(x - 1, y - 1) && hash(x, y + 7) < 0.5);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const a = bear.alpha(x, y);
      if (!a) continue;
      out.set(x, y, bear.get(x, y), a / 255);
      const c = bear.get(x, y);
      const lum = ((c >> 16) & 255) * 0.3 + ((c >> 8) & 255) * 0.5 + (c & 255) * 0.2;
      if (lum < 30) continue; // not the outline, the eyes or the mouth
      // the upper rim of a form: open (or much darker, another form's edge) a few pixels above
      let rim = 0;
      for (let d = 1; d <= 6; d++) if (!bear.alpha(x, y - d)) { rim = 1 - (d - 1) / 6; break; }
      const n = fbm(x, y, { seed: 91, scale: 5, octaves: 2 });
      const rime = rim * (0.55 + n * 0.6);
      if (rime > 0.35) out.set(x, y, 0xe8f4ff, Math.min(0.85, rime));
      else if (flake(x, y)) out.set(x, y, 0xf4fbff, 0.85); // flakes caught in the fur
      else if (n > 0.6) out.set(x, y, 0xc8dcf0, 0.18); // a pale bloom over it
    }
  return out;
}

/** The roar's breath: a cloud of steam bursting from the jaws (downwards, toward the player), 4 frames. */
export function breath(f) {
  const w = 60;
  const h = 72;
  const out = new Raster(w, h);
  const t = (f + 1) / 4; // how far the cloud has rolled out
  const puffs = [];
  for (let i = 0; i < 9; i++) {
    const u = i / 8;
    const reach = t * (0.35 + u * 0.65);
    puffs.push([w / 2 + Math.sin(i * 2.4 + f * 0.7) * (5 + 14 * reach), 6 + reach * 58, 4 + reach * 12 + (i % 3) * 1.5]);
  }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let v = 0;
      for (const [px, py, r] of puffs) v = Math.max(v, 1 - Math.hypot(x - px, y - py) / r);
      if (v <= 0) continue;
      v += (fbm(x, y + f * 9, { seed: 15, scale: 7, octaves: 2 }) - 0.5) * 0.5;
      const fade = 1 - t * 0.55; // thins out as it rolls away
      const a = Math.min(1, v * 2.2) * fade;
      if (a < 0.12) continue;
      // banded like the game's other mists: a bright core, a blue-grey body, a thin edge
      const col = v > 0.55 ? 0xffffff : v > 0.3 ? 0xdcecff : 0xa8c4e4;
      out.set(x, y, col, Math.round(a * 4) / 4 * 0.8);
    }
  return out;
}
