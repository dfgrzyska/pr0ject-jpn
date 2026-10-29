// Shared drawing helpers for backgrounds: tree crowns, shading ramps, colour grading.
import { fbm, bayer, rgb, pack, mix } from '../lib/raster.mjs';

export const RAMPS = {
  broadleaf: [0x1c3622, 0x2b5530, 0x447639, 0x74a050],
  sakura: [0x7e4060, 0xbe6a8c, 0xe8a0b9, 0xffd8e6],
  cedar: [0x10221c, 0x1b3529, 0x2a4c3a, 0x456c52],
  bamboo: [0x29522a, 0x4a8438, 0x76ae4b, 0xb2d674],
  pine: [0x142c1d, 0x214329, 0x355f35, 0x557f45],
  tiny: [0x1a2e20, 0x274a2c, 0x3b6636, 0x5d8a48],
  // subtropical (Okinawa)
  fukugi: [0x0f2a1a, 0x1a4428, 0x2a6234, 0x4a8a44],
  tropic: [0x1c4a22, 0x2f7a2e, 0x52a83a, 0x9ad25a],
  fern: [0x174222, 0x2a6a30, 0x48963c, 0x86c860],
  banana: [0x2c5a22, 0x4f8c2c, 0x7cba3c, 0xbce070],
  hibiscus: [0x1a4422, 0x2c6a2c, 0x4a8e36, 0x76b44a],
  palm: [0x1e4a1e, 0x337a2a, 0x58a83a, 0x9cd65c],
  // winter (Sapporo): Todo fir and Ezo spruce, dark under the snow
  fir: [0x0c1f1c, 0x15302a, 0x22463a, 0x34604c],
};

const LIGHT = (() => {
  const v = [-0.55, -0.6, 0.58];
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
})();

/** Pick a ramp colour from a 0..1 light value with ordered dithering between steps. */
export function rampColor(ramp, v, x, y) {
  const s = Math.max(0, Math.min(ramp.length - 1.001, v * (ramp.length - 1)));
  const i = Math.floor(s);
  return s - i > bayer(x, y) ? ramp[Math.min(i + 1, ramp.length - 1)] : ramp[i];
}

/**
 * Build a tree crown as a list of pixels {x, y, c} (absolute coords).
 * kind: broadleaf | sakura | cedar | bamboo | pine | tiny
 */
export function crownPixels(kind, cx, cy, r, rand, seed) {
  const clumps = [];
  const spiky = kind === 'cedar' || kind === 'fern' || kind === 'fir';
  if (spiky) {
    clumps.push([0, 0, r]);
  } else if (kind === 'bamboo') {
    const n = 5 + Math.floor(r);
    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2;
      const d = rand() * r * 0.75;
      clumps.push([Math.cos(a) * d, Math.sin(a) * d * 0.8, r * (0.28 + rand() * 0.2)]);
    }
  } else {
    const n = kind === 'tiny' ? 2 : 3 + Math.floor(rand() * 3);
    clumps.push([0, 0, r * 0.75]);
    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2;
      const d = r * (0.3 + rand() * 0.35);
      clumps.push([Math.cos(a) * d, Math.sin(a) * d, r * (0.45 + rand() * 0.25)]);
    }
  }
  const ramp = RAMPS[kind];
  const px = [];
  const R = Math.ceil(r * 1.4) + 1;
  const spikes = 7 + Math.floor(rand() * 3);
  const phase = rand() * 6;
  for (let y = -R; y <= R; y++)
    for (let x = -R; x <= R; x++) {
      let best = null;
      for (const [ox, oy, cr] of clumps) {
        const dx = x + 0.5 - ox;
        const dy = y + 0.5 - oy;
        let rr = cr;
        if (spiky) rr = cr * (0.78 + 0.22 * Math.cos(spikes * Math.atan2(dy, dx) + phase));
        const d2 = (dx * dx + dy * dy) / (rr * rr);
        if (d2 > 1) continue;
        const h = Math.sqrt(1 - d2) * cr + (spiky ? (1 - Math.sqrt(d2)) * cr : 0);
        if (!best || h > best.h) best = { h, nx: dx / rr, ny: dy / rr, nz: Math.sqrt(1 - d2) };
      }
      if (!best) continue;
      const ax = cx + x;
      const ay = cy + y;
      const n = fbm(ax, ay, { seed, scale: kind === 'bamboo' ? 2 : 3, octaves: 2 });
      let v = best.nx * LIGHT[0] + best.ny * LIGHT[1] + best.nz * LIGHT[2];
      v = v * 0.75 + 0.25 + (n - 0.5) * (spiky ? 0.5 : 0.65);
      px.push({ x: ax, y: ay, c: rampColor(ramp, v, ax, ay) });
    }
  return px;
}

/**
 * Coconut palm seen from above: 7-9 arching fronds with leaflets, dark crown with coconuts.
 * Returns pixels {x, y, c} like crownPixels.
 */
export function palmPixels(cx, cy, r, rand) {
  const ramp = RAMPS.palm;
  const px = new Map();
  const put = (x, y, c) => px.set(`${Math.round(x)},${Math.round(y)}`, { x: Math.round(x), y: Math.round(y), c });
  const n = 7 + Math.floor(rand() * 3);
  const rot = rand() * Math.PI * 2;
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2 + (rand() - 0.5) * 0.3;
    const len = r * (0.85 + rand() * 0.3);
    const bend = (rand() - 0.5) * 0.5;
    // fronds facing the light (top-left) are brighter
    const lit = 0.5 - 0.5 * (Math.cos(a) * 0.7 + Math.sin(a) * 0.7);
    for (let k = 1; k <= len * 2; k++) {
      const t = k / (len * 2);
      const ang = a + bend * t;
      const x = cx + Math.cos(ang) * t * len;
      const y = cy + Math.sin(ang) * t * len;
      put(x, y, ramp[t < 0.25 ? 1 : lit > 0.5 ? 3 : 2]);
      // leaflets on both sides, shorter towards the tip
      if (k % 2 === 0 && t > 0.15) {
        const w = Math.max(1, (1 - t) * r * 0.32);
        for (const side of [-1, 1]) {
          const nx = -Math.sin(ang) * side;
          const ny = Math.cos(ang) * side;
          for (let j = 1; j <= w; j++) put(x + nx * j + Math.cos(ang) * j * 0.5, y + ny * j + Math.sin(ang) * j * 0.5, ramp[j > w - 1 ? 0 : lit > 0.5 ? 2 : 1]);
        }
      }
    }
  }
  // crown with coconuts
  for (const [dx, dy, c] of [[0, 0, 0x5a3a1e], [1, 0, 0x6e4a26], [0, 1, 0x4a3018], [-1, 0, 0x7a5a2a], [0, -1, 0x8a6a30], [1, 1, 0x3a2a14]]) put(cx + dx, cy + dy, c);
  return [...px.values()];
}

/** Colour grade: desaturate + darken + optional tint (keeps alpha). */
export function grade(raster, { sat = 1, bright = 1, tint = null, tintAmt = 0 }) {
  raster.map((r, g, b, a) => {
    if (!a) return null;
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    r = l + (r - l) * sat;
    g = l + (g - l) * sat;
    b = l + (b - l) * sat;
    r *= bright;
    g *= bright;
    b *= bright;
    if (tint !== null) {
      const [tr, tg, tb] = rgb(tint);
      r += (tr - r) * tintAmt;
      g += (tg - g) * tintAmt;
      b += (tb - b) * tintAmt;
    }
    return [r, g, b, a];
  });
}

export { mix, pack };
