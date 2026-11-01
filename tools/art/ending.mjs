// The ending's last picture: Mt Fuji at sunrise above a sea of clouds, seen from the hill of the Chūreitō
// pagoda among cherry trees in bloom, a blossoming branch across the sky. 180 x 420 (the whole screen at its
// tallest; the middle 320 rows hold everything that matters). The cloud bank that drifts across the foot of
// the mountain is a separate strip that tiles sideways (the game scrolls it).
import { Raster, fbm, bayer, mix } from '../lib/raster.mjs';
import { rampColor } from './nature.mjs';

const W = 180;
const H = 420;
const PEAK = { x: 92, y: 150 }; // the summit (the crater's flat top)
const SUN = { x: 127, y: 176, r: 16 }; // rising behind the mountain's right shoulder
const HORIZON = 262;

// the sky from the top of the night down to the dawn at the horizon: [y, colour]
const SKY = [
  [0, 0x0c0e2c],
  [70, 0x1c1a48],
  [130, 0x3e2a66],
  [180, 0x7a3c7a],
  [215, 0xc85a7a],
  [242, 0xf0966a],
  [HORIZON, 0xffcc88],
];

/** The mountain's ridge line: the height of its slopes at x (concave, steepening towards the top). */
const ridge = (x) => {
  const d = Math.max(0, Math.abs(x + 0.5 - PEAK.x) - 5);
  return PEAK.y + 112 * (d / 118) ** 0.78;
};

function skyAt(y) {
  let i = 0;
  while (i < SKY.length - 2 && y >= SKY[i + 1][0]) i++;
  const [y0, c0] = SKY[i];
  const [y1, c1] = SKY[i + 1];
  return [c0, c1, Math.max(0, Math.min(1, (y - y0) / (y1 - y0)))];
}

/**
 * A sea of cloud between y0 and y1: puffs of radius r0..r1 scattered over it, drawn from the far edge to the
 * near one, each shaded like a ball lit by the sun up on the right and flattened underneath. alphaAt fades
 * them out (dithered) where it returns less than 1; wrap draws each puff a width to either side as well (a
 * strip that tiles).
 */
function cloudSea(img, y0, y1, r0, r1, n, seed, alphaAt = () => 1, wrap = false) {
  const ramp = [0x3a2e5a, 0x6a5288, 0xb07ea6, 0xe8a8b8, 0xffd4bc, 0xfff0dc];
  const puffs = [];
  for (let i = 0; i < n; i++) {
    const f = (k) => fbm(i * 7.3, k, { seed: seed + k, scale: 1.3 });
    puffs.push({ x: -r1 + ((f(1) * 9.17) % 1) * (img.w + r1 * 2), y: y0 + ((f(2) * 7.31) % 1) * (y1 - y0), r: r0 + ((f(3) * 5.71) % 1) * (r1 - r0) });
  }
  puffs.sort((a, b) => a.y - b.y);
  for (const p of wrap ? puffs.flatMap((q) => [-1, 0, 1].map((k) => ({ ...q, x: q.x + k * img.w }))) : puffs) {
    const near = (p.y - y0) / Math.max(1, y1 - y0); // nearer puffs are brighter and bigger
    for (let y = Math.floor(p.y - p.r); y <= p.y + p.r * 0.55; y++)
      for (let x = Math.floor(p.x - p.r); x <= p.x + p.r; x++) {
        if (x < 0 || x >= img.w || y < 0 || y >= img.h) continue;
        const dx = (x + 0.5 - p.x) / p.r;
        const dy = (y + 0.5 - p.y) / p.r;
        const n2 = (fbm(x, y, { seed: seed + 9, scale: 3 }) - 0.5) * 0.25;
        if (dx * dx + dy * dy > 1 + n2) continue;
        const nz = Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy));
        let lit = 0.15 + (dx * 0.45 - dy * 0.55 + nz * 0.35) * 0.6 + near * 0.25 + n2;
        if (dy > 0.25) lit -= (dy - 0.25) * 0.8; // the shaded underside
        const a = alphaAt(x, y);
        if (a < 1 && a < bayer(x, y)) continue;
        img.set(x, y, rampColor(ramp, Math.max(0, Math.min(1, lit)), x, y));
      }
  }
}

export function buildEnding() {
  const img = new Raster(W, H);
  // ---- sky with dithered bands, stars fading out towards the dawn, the sun's glow
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const [c0, c1, t] = skyAt(y);
      let c = mix(c0, c1, t);
      const d = Math.hypot(x + 0.5 - SUN.x, y + 0.5 - SUN.y);
      const glow = Math.max(0, 1 - d / 80) ** 2;
      if (glow > 0) c = mix(c, 0xffe8b0, glow * 0.75);
      const q = (v) => {
        const lv = (v / 255) * 20;
        return Math.min(255, Math.round(((lv - Math.floor(lv) > bayer(x, y) ? Math.ceil(lv) : Math.floor(lv)) * 255) / 20));
      };
      img.set(x, y, (q((c >> 16) & 255) << 16) | (q((c >> 8) & 255) << 8) | q(c & 255));
    }
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(fbm(i, 1, { seed: 501, scale: 1 }) * 9999) % W;
    const y = Math.floor(fbm(i, 2, { seed: 502, scale: 1 }) * 9999) % 110;
    img.set(x, y, 0xffffff, (1 - y / 110) * (i % 5 === 0 ? 0.9 : 0.45));
  }
  // rays fanning up from the sun behind the shoulder
  for (let k = 0; k < 9; k++) {
    const a = -Math.PI / 2 + (k - 4) * 0.22;
    for (let s = SUN.r + 4; s < 110; s++) {
      const x = Math.round(SUN.x + Math.cos(a) * s);
      const y = Math.round(SUN.y + Math.sin(a) * s);
      if ((s + k) % 3) img.set(x, y, 0xfff0c8, 0.16 * (1 - s / 110));
    }
  }
  // the sun
  for (let y = SUN.y - SUN.r; y <= SUN.y + SUN.r; y++)
    for (let x = SUN.x - SUN.r; x <= SUN.x + SUN.r; x++) {
      const d = Math.hypot(x + 0.5 - SUN.x, y + 0.5 - SUN.y) / SUN.r;
      if (d <= 1) img.set(x, y, d > 0.85 ? 0xffd890 : d > 0.6 ? 0xfff0b8 : 0xfffce8);
    }

  // ---- Mt Fuji: cool shadowed face, warm rim along the sunlit ridge, ravines, the snow cap reaching down them
  for (let x = 0; x < W; x++) {
    const top = Math.ceil(ridge(x));
    for (let y = top; y < 300; y++) {
      const dx = x + 0.5 - PEAK.x;
      const ang = Math.atan2(y - PEAK.y + 4, dx); // round the summit
      const ravine = Math.sin(ang * 46 + fbm(x, y, { seed: 511, scale: 12 }) * 3) * 0.5 + 0.5;
      const right = dx > 0;
      const depth = (y - top) / 40;
      let v = 0.25 + ravine * 0.25 + (right ? 0.18 : 0) - Math.min(0.2, depth * 0.05) + (fbm(x, y, { seed: 512, scale: 4 }) - 0.5) * 0.15;
      let c = rampColor(right ? [0x2e2a52, 0x463a66, 0x5e4670, 0x7a5478] : [0x24244a, 0x30305a, 0x3e3e6a, 0x50507a], Math.max(0, Math.min(1, v)), x, y);
      // the snow, down to a ragged line, in fingers along the ravines
      const snowLine = PEAK.y + 30 + Math.abs(dx) * 0.28 + ravine * 18 + (fbm(x, y, { seed: 513, scale: 6 }) - 0.5) * 10;
      if (y < snowLine) {
        const sv = 0.35 + ravine * 0.35 + (right ? 0.3 : -0.1) + (fbm(x, y, { seed: 514, scale: 3 }) - 0.5) * 0.2;
        c = rampColor(right ? [0xa890c0, 0xe0a8c0, 0xf8c8d0, 0xfff0f0] : [0x6a6698, 0x8480b0, 0xa8a4cc, 0xc8c4e0], Math.max(0, Math.min(1, sv)), x, y);
      }
      // the sunlit rim along the right-hand ridge
      if (right && y - top < 2 && x > PEAK.x + 2) c = y === top ? 0xffc890 : mix(c, 0xffa070, 0.5);
      img.set(x, y, c);
    }
  }
  // the crater's notched rim
  for (const [x, y] of [[88, 151], [91, 150], [95, 151], [97, 152]]) img.set(x, y, 0xffe8e0);

  // ---- the sea of clouds round the mountain's foot (a far bank, then a nearer, brighter one)
  cloudSea(img, 232, 252, 5, 9, 46, 521);
  cloudSea(img, 248, 286, 8, 15, 40, 531);

  // ---- the foreground hill: forest and cherry trees in bloom, the five-storey Chūreitō pagoda among them
  const hill = (x) => 300 - x * 0.18 + Math.sin(x / 23) * 5 + (fbm(x, 0, { seed: 551, scale: 14 }) - 0.5) * 8;
  for (let x = 0; x < W; x++)
    for (let y = Math.floor(hill(x)); y < H; y++) img.set(x, y, rampColor([0x14162a, 0x1c1e34, 0x262840, 0x30324c], fbm(x, y, { seed: 552, scale: 5 }) * 0.8, x, y));
  const blossom = (cx, cy, r, seed) => {
    for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++)
      for (let x = Math.floor(cx - r * 1.2 - 1); x <= cx + r * 1.2 + 1; x++) {
        const dx = (x + 0.5 - cx) / (r * 1.2);
        const dy = (y + 0.5 - cy) / r;
        const n = fbm(x, y, { seed, scale: 2.2 });
        const e = dx * dx + dy * dy;
        if (e > 0.8 + n * 0.45) continue;
        if (e > 0.62 + n * 0.45) {
          img.set(x, y, 0x1e1424); // the dark gap where it meets the next crown
          continue;
        }
        const lit = 0.3 + dx * 0.35 - dy * 0.35 + (n - 0.5) * 0.6; // lit from the sunrise, up and to the right
        img.set(x, y, rampColor([0x4a2440, 0x7a3e60, 0xb86688, 0xe896b4, 0xfcc8d8], Math.max(0, Math.min(1, lit)), x, y));
        if (n > 0.78 && lit > 0.55) img.set(x, y, 0xfff4f6);
      }
  };
  const evergreen = (cx, cy, r, seed) => {
    for (let y = Math.floor(cy - r); y <= cy + r; y++)
      for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        const dx = (x + 0.5 - cx) / r;
        const dy = (y + 0.5 - cy) / r;
        const n = fbm(x, y, { seed, scale: 2 });
        if (dx * dx + dy * dy > 0.8 + n * 0.4) continue;
        img.set(x, y, rampColor([0x0e1a1e, 0x16262a, 0x22383a, 0x34504a], Math.max(0, Math.min(1, 0.25 + dx * 0.3 - dy * 0.3 + (n - 0.5) * 0.5)), x, y));
      }
  };
  // the canopy behind the pagoda: crowns in rows down the slope, each row a little lower and nearer
  const canopy = (yFrom, yTo, seed) => {
    const cr = (k) => fbm(k * 3.1, seed, { seed, scale: 1.1 });
    const crowns = [];
    for (let k = 0; k < 130; k++) {
      const x = ((cr(k) * 13.7) % 1) * (W + 20) - 10;
      const y = yFrom + ((cr(k + 99) * 11.3) % 1) * (yTo - yFrom);
      if (y < hill(x) - 6) continue;
      crowns.push({ x, y, r: 6 + ((cr(k + 50) * 7.7) % 1) * 7, ever: ((cr(k + 70) * 5.3) % 1) < 0.18 });
    }
    crowns.sort((a, b) => a.y - b.y);
    for (const c of crowns) (c.ever ? evergreen : blossom)(c.x, c.y, c.r, seed + Math.round(c.x * 7 + c.y));
  };
  // trees behind the pagoda, the pagoda, trees in front of it
  canopy(276, 318, 561);
  {
    const px = 44;
    const base = 322;
    // five roofs, each smaller, the vermilion storeys between them, the spire with its nine rings
    for (let k = 0; k < 5; k++) {
      const w = 32 - k * 3;
      const ry = base - 14 - k * 13;
      // the storey under this roof
      for (let y = ry + 3; y < ry + 13; y++)
        for (let x = px - w / 2 + 5; x < px + w / 2 - 5; x++) img.set(Math.round(x), y, x > px + w / 2 - 9 ? 0xf06a3a : x < px - w / 2 + 8 ? 0x7a2418 : 0xb83a24);
      for (let x = px - w / 2 + 6; x < px + w / 2 - 5; x += 3) img.set(Math.round(x), ry + 7, 0x3a1410); // windows
      // the roof: sweeping eaves turned up at the corners, dark tiles, a warm edge where the dawn catches it
      for (let y = 0; y < 4; y++)
        for (let x = px - w / 2 - (3 - y); x < px + w / 2 + (3 - y); x++) img.set(Math.round(x), ry + y, y === 0 ? (x > px ? 0xffa070 : 0x5a5070) : y === 3 ? 0x14141e : 0x2a2a3a);
      img.set(Math.round(px - w / 2 - 3), ry - 1, 0x2a2a3a);
      img.set(Math.round(px + w / 2 + 2), ry - 1, 0xffa070);
    }
    const top = base - 14 - 4 * 13;
    for (let y = top - 16; y < top; y++) img.set(px, y, (y - top) % 2 ? 0xe2aa32 : 0x8a6a20);
    img.set(px + 1, top - 10, 0xfff0a0);
    img.set(px, top - 17, 0xfff0a0);
  }
  canopy(322, 430, 601); // the trees in front, down to the bottom of the picture

  // ---- a blossoming branch reaching across from the left, under the sky's writing
  {
    const pts = [];
    for (let t = 0; t <= 1; t += 0.01) pts.push([t * 62, 108 + t * 22 + Math.sin(t * 5) * 4]);
    for (const [x, y] of pts) {
      img.set(Math.round(x), Math.round(y), 0x1a1220);
      img.set(Math.round(x), Math.round(y) + 1, 0x2a1a24);
      if (x < 30) img.set(Math.round(x), Math.round(y) - 1, 0x1a1220);
    }
    for (const [t, dy] of [[0.25, -8], [0.5, 9], [0.7, -6]])
      for (let s = 0; s < 12; s++) img.set(Math.round(t * 62 + s * 0.6), Math.round(108 + t * 22 + dy * (s / 12)), 0x1a1220);
    for (const [x, y, r] of [[8, 104, 5], [20, 98, 4], [26, 116, 5], [38, 106, 4], [46, 124, 5], [56, 118, 4], [62, 132, 4], [32, 128, 3]]) blossom(x, y, r, 700 + x);
  }
  return img;
}

/** The cloud bank that drifts across the mountain's foot: a strip that tiles sideways, soft at its lower edge. */
export function buildEndingClouds() {
  const r = new Raster(W, 34);
  cloudSea(r, 10, 22, 5, 9, 34, 571, (x, y) => (y < 24 ? 1 : 1 - (y - 24) / 10), true);
  return r;
}

