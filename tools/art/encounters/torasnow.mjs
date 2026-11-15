// The arena of encounter 6 (ex6): Hokusai's Tiger in the Snow (1849, long in the public domain), gone grandma: a
// great tiger crouched in a snowy bamboo grove at night, head thrown back to roar at the falling snow, but with a
// tight purple perm; wrapped sweets lie about in the snow, a shopping trolley half buried. The tiger is low in the
// strip, so it is on screen from the first second; the strip creeps up the grove to the moon. What moves: the snow
// falling, the bamboo's leaves swaying (and shedding their snow), the tiger's breath, its eyes, an ear, the tip of
// its tail, glints on the snow.
import { Raster, fbm, rng, mix } from '../../lib/raster.mjs';
import { rampColor, grade } from '../nature.mjs';
import { PropKit, tintTable } from '../props.mjs';

export const S = 3;
const W = 180;
const L = 896;
const FW = W * S;
const FH = L * S;
const INK = 0x1a1014;
const SKY = [0x222838, 0x30384c, 0x3e4860, 0x4e5a74];
const SNOW = [0x8a94a8, 0xb0b8c8, 0xd0d6e0, 0xeef1f6];
const TIGER = [0x6a3410, 0xa85a1a, 0xd8862e, 0xf2b866];
const CREAM = [0x9a8a70, 0xc8b490, 0xe8d8b8, 0xf8f0dc];
const PERM = [0x4a1a6a, 0x7a34a8, 0xa868d0, 0xd09af0];
const BAMBOO = [0x16342a, 0x28563a, 0x3a784a, 0x5c9c64];
const GRADE = { sat: 0.74, bright: 0.6, tint: 0x203050, tintAmt: 0.12 }; // (dim: the fight goes on over it)

const hash = (a, b, s = 1) => {
  let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const driftAt = (x) => FH - 470 + Math.sin(x * 0.012) * 46 + Math.sin(x * 0.041) * 16; // where the snowfield begins

export function buildFar() {
  const r = new Raster(FW, 1152);
  const rand = rng(4);
  for (let y = 0; y < r.h; y++) for (let x = 0; x < FW; x++) r.set(x, y, rampColor(SKY, 0.5 + (fbm(x, y, { seed: 3, scale: 50, periodX: FW, periodY: 1152 }) - 0.5) * 0.4, x, y));
  // the snow falling, far off: small soft flakes (dim, so they never pass for shots)
  for (let k = 0; k < 900; k++) {
    const x = Math.floor(rand() * FW);
    const y = Math.floor(rand() * r.h);
    r.set(x, y, 0x9aa4b8, 0.6);
    if (rand() < 0.3) r.set(x + 1, y, 0x9aa4b8, 0.4);
  }
  return r;
}

/**
 * A limb or a body as a chain of discs along a spine [[x, y, r], ...]: for a pixel, how deep inside it is (d: 0 on
 * the spine, 1 at the skin; null outside), how far along (s, px) and on which side of the spine (side: -1 its back).
 */
function chain(pts) {
  const segs = [];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay, ar] = pts[i - 1];
    const [bx, by, br] = pts[i];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    segs.push({ ax, ay, ar, bx, by, br, len, acc });
    acc += len;
  }
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const rm = Math.max(...pts.map((p) => p[2]));
  return {
    box: [Math.min(...xs) - rm, Math.min(...ys) - rm, Math.max(...xs) + rm, Math.max(...ys) + rm].map(Math.round),
    at(x, y) {
      let best = null;
      for (const g of segs) {
        const t = Math.max(0, Math.min(1, ((x - g.ax) * (g.bx - g.ax) + (y - g.ay) * (g.by - g.ay)) / (g.len * g.len)));
        const px = g.ax + (g.bx - g.ax) * t;
        const py = g.ay + (g.by - g.ay) * t;
        const d = Math.hypot(x - px, y - py) / (g.ar + (g.br - g.ar) * t);
        if (d <= 1 && (!best || d < best.d)) best = { d, s: g.acc + g.len * t, side: Math.sign((g.bx - g.ax) * (y - g.ay) - (g.by - g.ay) * (x - g.ax)) || 1 };
      }
      return best;
    },
  };
}

/** A bamboo leaf cluster hanging from (0, 0) to the side sx, sheared by `sway` px; snow lying on the upper leaves. */
function leaves(sx, sway, snow = true) {
  const r = new Raster(132, 84);
  const ox = sx > 0 ? 8 : 124;
  for (let k = 0; k < 7; k++) {
    const a = 0.15 + k * 0.2;
    const len = 60 + ((k * 37) % 5) * 9;
    for (let j = 0; j < len; j++) {
      const t = j / len;
      const w = Math.sin(t * Math.PI) * 5 + 0.6;
      const x = ox + sx * (Math.cos(a) * j + sway * t * t);
      const y = 8 + Math.sin(a) * j * 0.8 + t * t * 14;
      for (let q = -w; q <= w; q++) r.set(Math.round(x), Math.round(y + q), snow && q < -w * 0.2 && k < 4 ? rampColor(SNOW, 0.85, x, y) : rampColor(BAMBOO, 0.5 - q * 0.05 + (k % 2) * 0.15, x, y));
    }
  }
  return r;
}

export function buildMid() {
  const img = new Raster(FW, FH);
  const rand = rng(17);
  const set = (x, y, c, a = 1) => img.set(Math.round(x), Math.round(y), c, a);
  // ---- the night sky over the grove, a great pale moon far up it; the snowfield at the bottom, in drifts
  const [mx, my] = [330, FH - 2040];
  for (let y = 0; y < FH; y++)
    for (let x = 0; x < FW; x++) {
      const n = fbm(x, y, { seed: 5, scale: 20 });
      const drift = driftAt(x);
      if (y > drift) {
        // lit along each drift's crest, blue in its hollows; wind ripples
        const v = 0.62 + n * 0.3 - (y - drift) / 2600 + Math.sin(x * 0.03 + y * 0.012) * 0.06 + (y - drift < 10 ? 0.2 : 0);
        set(x, y, rampColor(SNOW, v, x, y));
      } else {
        const dm = Math.hypot(x - mx, y - my);
        const v = 0.42 + (n - 0.5) * 0.3 + (y / FH) * 0.2 + Math.max(0, 1 - dm / 420) * 0.5;
        set(x, y, dm < 150 ? mix(0xe8e4d0, 0xc8c8c0, fbm(x, y, { seed: 31, scale: 30 })) : rampColor(SKY, v, x, y));
      }
    }
  // ---- bamboo up both sides: jointed stalks (a pale ring and a dark line at every node), a highlight down each,
  // thin stalks behind the thick ones
  const stalks = [[26, 13, 0], [74, 9, 1], [118, 6, 0], [16, 5, 1], [432, 6, 1], [478, 10, 0], [518, 14, 1], [534, 5, 0]];
  const stalkX = (bx, y) => bx + Math.sin(y * 0.002 + bx) * 10;
  for (const [bx, w, k] of stalks) {
    const node = 190 + (bx % 5) * 14;
    for (let y = 0; y < FH; y++) {
      const cx = stalkX(bx, y);
      const q = (y + bx * 7) % node;
      for (let i = -w; i <= w; i++) {
        let v = 0.62 - (i / w) * 0.34 - (k ? 0.12 : 0);
        if (Math.abs(i + w * 0.45) < 1.2) v += 0.25; // the highlight
        if (q < 3) v -= 0.5; // the node's line
        else if (q < 9) v += 0.2; // the pale ring under it
        set(cx + i, y, Math.abs(i) > w - 1.2 ? 0x0e2018 : rampColor(BAMBOO, v, Math.round(cx + i), y));
      }
      // snow caught on a node now and then
      if (q === 3 && hash(bx, Math.floor(y / node), 3) > 0.5) for (let i = -w - 2; i <= w + 2; i++) for (let j = 0; j < 4; j++) set(cx + i, y - 4 - j * (1 - Math.abs(i) / (w + 3)), rampColor(SNOW, 0.85, cx + i, y));
    }
  }
  // ---- the tiger: crouched in the drifts, its body one long curve from the haunches to the neck, head thrown
  // back; fur lit from the upper left, Hokusai's stripes: flames across the back, thick on the spine and tapering
  // down the flanks; a pale belly, chest and throat
  const [tx, ty] = [300, FH - 330];
  const fur = (x, y, d, light = 0) => 0.78 - d * d * 0.5 + (fbm(x * 1.6, y * 0.5, { seed: 9, scale: 4 }) - 0.5) * 0.3 + light;
  const drawChain = (pts, { stripes = 0, belly = 0, phase = 0 } = {}) => {
    const c = chain(pts);
    for (let y = c.box[1]; y <= c.box[3]; y++)
      for (let x = c.box[0]; x <= c.box[2]; x++) {
        if (x < 0 || x >= FW) continue;
        const h = c.at(x, y);
        if (!h) continue;
        if (h.d > 0.94) {
          set(x, y, INK);
          continue;
        }
        const under = h.side > 0 ? h.d : 0; // how far down the flank (the spine's far side is its back)
        if (belly && under > belly) {
          set(x, y, rampColor(CREAM, 0.75 - (under - belly) * 0.6 + (fbm(x, y, { seed: 6, scale: 5 }) - 0.5) * 0.2, x, y));
          continue;
        }
        const q = stripes ? ((h.s + phase + Math.sin(h.d * 3 + h.s * 0.02) * 9) % stripes) / stripes : 1;
        const wide = 0.2 * (1 - (h.side > 0 ? h.d * 0.95 : h.d * 0.2));
        if (stripes && Math.abs(q - 0.5) < wide) set(x, y, INK);
        else set(x, y, rampColor(TIGER, fur(x, y, h.d, h.side < 0 ? 0.08 : -0.06), x, y));
      }
  };
  // the tail: curling up behind, ringed, a dark tip (its last curl is a moving part)
  drawChain([[tx + 170, ty + 30, 26], [tx + 222, ty - 30, 22], [tx + 232, ty - 110, 19], [tx + 206, ty - 176, 16]], { stripes: 46 });
  // the far hind leg, the body, the near hind leg's haunch and paw
  drawChain([[tx + 150, ty - 10, 96], [tx + 30, ty - 36, 92], [tx - 96, ty - 46, 88], [tx - 150, ty - 128, 70]], { stripes: 62, belly: 0.62 });
  drawChain([[tx + 150, ty + 6, 70], [tx + 120, ty + 70, 46]], { stripes: 50, phase: 20 });
  // the forelegs planted in the snow
  drawChain([[tx - 150, ty - 20, 44], [tx - 184, ty + 78, 34]], { stripes: 40, phase: 10 });
  drawChain([[tx - 70, ty - 10, 44], [tx - 84, ty + 84, 34]], { stripes: 40 });
  // paws: pale, toes parted by ink
  for (const [px, py] of [[tx - 190, ty + 96], [tx - 88, ty + 102], [tx + 116, ty + 96]]) {
    for (let j = -24; j <= 24; j++) for (let i = -38; i <= 38; i++) {
      const d = (i / 38) ** 2 + (j / 24) ** 2;
      if (d < 1) set(px + i, py + j, d > 0.86 ? INK : rampColor(TIGER, 0.72 - j / 70 + (fbm(px + i, py + j, { seed: 9, scale: 4 }) - 0.5) * 0.2, px + i, py + j));
    }
    for (const dx of [-16, 0, 16]) for (let j = 4; j < 22; j++) for (let w = 0; w < 2; w++) set(px + dx + w, py + j, INK);
  }
  // ---- its head, thrown back to roar up at the snow: cheeks' ruff, white muzzle and brows, eyes, the open jaws
  const [hx, hy] = [tx - 150, ty - 214];
  const HR = 84;
  for (let y = -HR - 10; y <= HR + 16; y++)
    for (let x = -HR - 26; x <= HR + 26; x++) {
      // a wide face: the skull, the ruff of the cheeks either side
      const skull = (x / HR) ** 2 + (y / (HR * 0.9)) ** 2;
      const ruff = ((Math.abs(x) - HR * 0.72) / (HR * 0.5)) ** 2 + ((y - HR * 0.3) / (HR * 0.5)) ** 2;
      const d = Math.min(skull, ruff);
      if (d > 1) continue;
      const X = hx + x;
      const Yp = hy + y;
      if (d > 0.9) {
        set(X, Yp, INK);
        continue;
      }
      const muzzle = (x / (HR * 0.5)) ** 2 + ((y - HR * 0.42) / (HR * 0.36)) ** 2 < 1;
      const cheek = ((Math.abs(x) - HR * 0.66) / (HR * 0.36)) ** 2 + ((y - HR * 0.36) / (HR * 0.34)) ** 2 < 1;
      const brow = ((Math.abs(x) - HR * 0.36) / (HR * 0.22)) ** 2 + ((y + HR * 0.36) / (HR * 0.1)) ** 2 < 1;
      // the stripes of the face: the 王 on the brow, flames in from the cheeks
      const king = (Math.abs(x) < 5 || Math.abs(Math.abs(x) - 22) < 4) && y < -HR * 0.46 && y > -HR * 0.86;
      const bar = Math.abs(x) < 30 && Math.abs(y + HR * 0.62) < 4;
      const flame = Math.abs(x) > HR * 0.56 && Math.abs(((y + HR * 0.3) % 26) - 13) < 5 * ((Math.abs(x) - HR * 0.5) / (HR * 0.5)) + 1 && y > -HR * 0.4 && y < HR * 0.5;
      if (king || bar || flame) set(X, Yp, INK);
      else if (muzzle || cheek || brow) set(X, Yp, rampColor(CREAM, 0.8 - d * 0.3 + (fbm(X, Yp, { seed: 6, scale: 4 }) - 0.5) * 0.2, X, Yp));
      else set(X, Yp, rampColor(TIGER, fur(X, Yp, Math.sqrt(d), x + y < 0 ? 0.08 : -0.04), X, Yp));
    }
  // ears, their pale insides (one of them twitches: a moving part)
  const ear = (r, ex, ey) => {
    for (let j = -24; j <= 20; j++) for (let i = -22; i <= 22; i++) {
      const d = (i / 22) ** 2 + (j / 24) ** 2;
      if (d < 1) r.set(Math.round(ex + i), Math.round(ey + j), d > 0.8 ? INK : (i / 12) ** 2 + ((j - 4) / 14) ** 2 < 1 ? 0xe8c8b0 : rampColor(TIGER, 0.7 - d * 0.2, ex + i, ey + j));
    }
  };
  for (const sx of [-1, 1]) ear(img, hx + sx * 66, hy - 78);
  // eyes: yellow, a slit of a pupil, heavy ink lids slanting in
  const eye = (r, ex, ey, sx, shut) => {
    for (let j = -11; j <= 11; j++) for (let i = -19; i <= 19; i++) {
      const d = (i / 19) ** 2 + (j / 11) ** 2;
      if (d > 1) continue;
      r.set(Math.round(ex + i), Math.round(ey + j), shut ? (Math.abs(j - 2) < 2.5 ? INK : rampColor(TIGER, 0.6, ex + i, ey + j)) : d > 0.76 ? INK : Math.abs(i) < 3.5 ? INK : 0xf2d040);
    }
    if (!shut) for (let k = -22; k <= 22; k++) for (let w = 0; w < 5; w++) r.set(Math.round(ex + k), Math.round(ey - 12 - k * sx * 0.22 + w), INK);
  };
  for (const sx of [-1, 1]) eye(img, hx + sx * 34, hy - 12, sx, false);
  // the nose, the jaws wide: dark mouth, tongue, four fangs; whiskers
  for (let j = 0; j < 16; j++) for (let i = -14 + j * 0.8; i <= 14 - j * 0.8; i++) set(hx + i, hy + 12 + j, j < 2 ? INK : 0xd06a7a);
  for (let j = -30; j <= 30; j++) for (let i = -34; i <= 34; i++) {
    const d = (i / 34) ** 2 + (j / 30) ** 2;
    if (d < 1) set(hx + i, hy + 62 + j, d > 0.84 ? INK : j > 8 && (i / 22) ** 2 + ((j - 20) / 12) ** 2 < 1 ? 0xe07a86 : 0x5a1018);
  }
  for (const sx of [-1, 1]) {
    for (let j = 0; j < 22; j++) for (let i = 0; i < 9 - j * 0.4; i++) set(hx + sx * (24 - i), hy + 34 + j, 0xfffaf0);
    for (let j = 0; j < 14; j++) for (let i = 0; i < 7 - j * 0.5; i++) set(hx + sx * (20 - i), hy + 90 - j, 0xfffaf0);
    for (const dy of [-10, 2, 14]) for (let k = 0; k < 120; k++) set(hx + sx * (46 + k), hy + 44 + dy + k * dy * 0.012 + (k * k) / 1800, 0xeef1f6, 0.85 * (1 - k / 140));
  }
  // ... and its perm: tight purple curls heaped over the top of its head, each one lit and ringed
  const curl = (cx, cy, rr) => {
    for (let j = -rr; j <= rr; j++) for (let i = -rr; i <= rr; i++) {
      const d = Math.hypot(i, j) / rr;
      if (d > 1) continue;
      const ring = Math.abs(Math.hypot(i - 2, j - 2) / rr - 0.52) < 0.07;
      set(cx + i, cy + j, d > 0.9 ? 0x2a0e40 : rampColor(PERM, 0.8 - d * 0.35 - (i + j) / (rr * 5) - (ring ? 0.25 : 0), Math.round(cx + i), Math.round(cy + j)));
    }
  };
  const curls = [];
  for (let k = 0; k < 64; k++) {
    const a = Math.PI * (1.02 + rand() * 0.96);
    const r0 = 50 + rand() * 42;
    curls.push([hx + Math.cos(a) * r0 * 1.02, hy - 44 + Math.sin(a) * r0 * 0.82, 14 + rand() * 7]);
  }
  curls.sort((a, b) => a[1] - b[1]);
  for (const c of curls) curl(...c);
  // ---- the snow drifted up round its belly and paws, heaped where it lies on its back and its perm
  for (let y = ty + 40; y < ty + 190; y++) for (let x = tx - 250; x < tx + 250; x++) {
    const top = driftAt(x) + 250 + Math.sin(x * 0.07) * 9 + Math.sin(x * 0.19) * 4;
    if (y > top) set(x, y, rampColor(SNOW, 0.66 + fbm(x, y, { seed: 5, scale: 20 }) * 0.3 + (y - top < 8 ? 0.2 : 0), x, y));
  }
  for (const [sx0, sx1, sy, th] of [[tx + 20, tx + 190, ty - 120, 12], [hx - 50, hx + 40, hy - 136, 10]]) {
    for (let x = sx0; x < sx1; x++) {
      const t = (x - sx0) / (sx1 - sx0);
      const h = Math.sin(t * Math.PI) * th + Math.sin(x * 0.2) * 2;
      const base = sy + (sy === ty - 120 ? -Math.sin(t * Math.PI) * 8 + t * 34 : -Math.sin(t * Math.PI) * 10);
      for (let j = 0; j < h; j++) set(x, base - j, rampColor(SNOW, 0.7 + j / h * 0.3, x, Math.round(base - j)));
    }
  }
  // ---- sweets in the snow (each in its hollow, its wrapper twisted), and a shopping trolley half buried
  const SWEETS = [0xd02a26, 0xe0b830, 0x3a9a4a, 0xd05a9a];
  for (let k = 0; k < 34; k++) {
    const x = 24 + rand() * (FW - 48);
    const y = FH - 400 + rand() * 380;
    if ((Math.abs(x - tx) < 250 && y < ty + 150) || (Math.abs(x - 124) < 110 && y > FH - 190)) continue; // (not under the tiger or the trolley)
    const c = SWEETS[k % 4];
    for (let j = -3; j <= 9; j++) for (let i = -18; i <= 18; i++) if ((i / 18) ** 2 + ((j - 5) / 5) ** 2 < 1) set(x + i, y + j, 0x8a94a8, 0.5); // its hollow's shadow
    for (let j = -6; j <= 6; j++) for (let i = -15; i <= 15; i++) {
      const body = Math.abs(i) < 8 && (i / 8) ** 2 + (j / 6) ** 2 < 1;
      const twist = Math.abs(i) >= 7 && Math.abs(j) < (Math.abs(i) - 6) * 0.7;
      if (body || twist) set(x + i, y + j, body && i + j < -4 ? mix(c, 0xffffff, 0.45) : twist ? mix(c, 0x101010, 0.25) : c);
    }
    for (let i = -8; i <= 8; i++) for (let j = 0; j < 3; j++) if (hash(i, k, 6) > 0.4) set(x + i, y + 5 + j, rampColor(SNOW, 0.85, x + i, y)); // snow over its lower edge
  }
  const [cx0, cy0] = [124, FH - 96]; // (lower left, clear of the tiger)
  for (let y = cy0 - 66; y < cy0; y++) for (let x = cx0 - 72 + (y - cy0 + 66) * 0.2; x < cx0 + 70; x++) {
    const wire = Math.round(x) % 10 < 2 || Math.round(y) % 10 < 2;
    if (wire) set(x, y, Math.round(x + y) % 3 ? 0xb8bac4 : 0xf4f6ff);
  }
  for (let x = cx0 - 74; x < cx0 + 72; x++) for (let w = 0; w < 4; w++) set(x, cy0 - 68 + w, 0xd8dae4);
  for (let x = cx0 + 66; x < cx0 + 108; x++) for (let w = 0; w < 5; w++) set(x, cy0 - 66 - (x - cx0 - 66) * 0.6 + w, 0xb8bac4);
  for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) if (i * i + j * j < 40) set(cx0 + 110 + i, cy0 - 92 + j, 0x2a2830);
  for (const [lx, c] of [[-40, 0x3a9a4a], [-22, 0x3a9a4a], [6, 0xeae6de]]) for (let j = 0; j < 46; j++) for (let i = -4; i <= 4; i++) set(cx0 + lx + i + j * 0.2, cy0 - 70 - j, j > 30 ? c : 0xeae6de); // leeks, a daikon
  for (let y = cy0 - 26; y < cy0 + 14; y++) for (let x = cx0 - 100; x < cx0 + 100; x++) if (y > cy0 - 18 + Math.sin(x * 0.05) * 7 + Math.abs(x - cx0) * 0.06) set(x, y, rampColor(SNOW, 0.84 - (y - cy0 + 18) / 120, x, y));
  for (let x = cx0 - 70; x < cx0 + 70; x++) for (let j = 0; j < 6 + Math.sin(x * 0.3) * 2; j++) set(x, cy0 - 70 - j, rampColor(SNOW, 0.9, x, cy0)); // snow on its rim
  grade(img, GRADE);

  // ---------------------------------------------------------------- the moving parts
  const kit = new PropKit(1849, { artScale: S });
  const lx = (x) => Math.round((x / S) * 10) / 10;
  const lu = (y) => Math.round(((FH - y) / S) * 10) / 10;
  const graded = (r) => {
    grade(r, GRADE);
    return kit.frame(r);
  };
  // the snow falling: flakes drifting down the whole grove, slanting with the wind (small and grey: never a shot)
  const flake = (r0, a) => {
    const r = new Raster(r0 * 2 + 1, r0 * 2 + 1);
    for (let y = -r0; y <= r0; y++) for (let x = -r0; x <= r0; x++) if (x * x + y * y <= r0 * r0 + 1) r.set(x + r0, y + r0, 0xc8d0dc, a * (1 - Math.hypot(x, y) / (r0 + 1.5)));
    return kit.frame(r);
  };
  const flakes = [flake(2, 0.75), flake(3, 0.7), flake(4, 0.6)];
  for (let k = 0; k < 15; k++) {
    const x0 = -10 + k * 14 + (k % 3) * 3;
    const lean = 26 + (k % 4) * 9;
    const pts = [];
    for (let i = 0; i <= 8; i++) pts.push([x0 + (lean * i) / 8 + Math.sin(i * 1.3 + k) * 5, L + 10 - ((L + 20) * i) / 8]);
    kit.path(pts, [flakes[k % 3]], { sp: 16 + (k % 5) * 4, n: 9, gap: 96 + (k % 4) * 9, mode: 'wrap', turn: 'none', a: 0.9, fx: 1, d: 0.8 });
  }
  // the bamboo's leaves, swaying in it, at the nodes up every thick stalk; now and then one sheds its snow
  const clusters = [-1, 1].map((sx) => [-5, 0, 5, 0].map((sway) => graded(leaves(sx, sway))));
  const shed = [];
  for (const [bx, w] of stalks) {
    if (w < 8) continue;
    const sx = bx < 270 ? 1 : -1;
    for (let k = 0; k < 12; k++) {
      const y = 90 + k * 222 + ((bx * 13 + k * 57) % 80);
      if (y > FH - 140) continue;
      if (w < 12 && y > hy - 150 && y < ty + 80) continue; // (the inner stalks keep their leaves off the tiger's face)
      const x = stalkX(bx, y) + sx * (w - 2);
      kit.loop(lx(sx > 0 ? x - 8 : x - 124), lu(y - 8), clusters[sx > 0 ? 1 : 0], { fps: 1.6 + ((bx + k) % 4) * 0.25, ph: ((bx + k * 3) % 10) / 10 });
      shed.push([lx(sx > 0 ? x + 10 : x - 110), lu(y + 10), 32, 8]);
    }
  }
  const puff = (k) => {
    const r = new Raster(30, 36);
    for (let i = 0; i < 9; i++) r.disc(Math.round(6 + hash(i, 1, 2) * 18), Math.round(3 + k * 9 + hash(i, 2, 2) * (6 + k * 3)), Math.max(1, 2.6 - k * 0.6), 0xd0d6e0, 0.8 - k * 0.2);
    return kit.frame(r);
  };
  kit.spot(shed, [puff(0), puff(1), puff(2)], { rate: 0.5, fps: 6, a: 0.85 });
  // the tiger's breath: steam rolling up out of its jaws
  const cloud = (r0, seed) => {
    const r = new Raster(r0 * 2 + 1, r0 * 2 + 1);
    for (let y = -r0; y <= r0; y++) for (let x = -r0; x <= r0; x++) {
      const d = Math.hypot(x, y) / r0 + (fbm(x + seed * 31, y, { seed, scale: 5 }) - 0.5) * 0.5;
      if (d < 1) r.set(x + r0, y + r0, 0xdfe4ec, Math.min(0.5, (1 - d) * 0.8));
    }
    return kit.frame(r);
  };
  kit.emit(lx(hx), lu(hy + 40), [[cloud(7, 1), cloud(7, 2)], [cloud(12, 3), cloud(12, 4)], [cloud(18, 5), cloud(18, 6)]], { rate: 1.1, life: [2, 3], vy: 11, sx: 4, wf: 0.6, a: 0.5, burst: 0.25, tint: 1 });
  // its eyes blinking (the lids drawn over them for a moment), an ear twitching, the tip of its tail curling
  for (const sx of [-1, 1]) {
    const r = new Raster(48, 34);
    eye(r, 24, 20, sx, true);
    kit.loop(lx(hx + sx * 34 - 24), lu(hy - 12 - 20), [graded(r)], { fps: 8, seq: [...Array(38).fill(-1), 0, 0], ph: 0 });
  }
  {
    const frames = [0, 5].map((tilt) => {
      const r = new Raster(60, 60);
      ear(r, 30 + tilt, 32 + tilt * 0.6);
      return graded(r);
    });
    kit.loop(lx(hx + 66 - 30), lu(hy - 78 - 32), frames, { fps: 7, seq: [...Array(30).fill(0), 1, 0, 1, 0, 0] });
  }
  {
    const frames = [-14, 0, 14, 0].map((bend) => {
      const r = new Raster(110, 90);
      const c = chain([[60, 80, 16], [54 + bend * 0.5, 50, 14], [50 + bend, 20, 11]]);
      for (let y = 0; y < 90; y++) for (let x = 0; x < 110; x++) {
        const h = c.at(x, y);
        if (h) r.set(x, y, h.d > 0.86 || h.s > 44 || (h.s % 30) > 18 ? INK : rampColor(TIGER, 0.8 - h.d * h.d * 0.5, x, y));
      }
      return graded(r);
    });
    kit.loop(lx(tx + 206 - 60), lu(ty - 176 - 76), frames, { fps: 2.2 });
  }
  // glints on the snow, wandering over the drifts
  const glint = (() => {
    const r = new Raster(9, 9);
    for (let i = -4; i <= 4; i++) {
      r.set(4 + i, 4, 0xffffff, 1 - Math.abs(i) / 5);
      r.set(4, 4 + i, 0xffffff, 1 - Math.abs(i) / 5);
    }
    return kit.frame(r);
  })();
  const sparks = [];
  for (let k = 0; k < 36; k++) {
    const x = 6 + rand() * 168;
    sparks.push([0, x, Math.min(lu(driftAt(x * S)) - 6, 8 + rand() * 130), k * 0.9]);
  }
  kit.wave([glint], sparks, { w: 1.6, a0: 0, a1: 0.9, pw: 8 });
  return {
    strip: img,
    props: kit.pack(),
    meta: { width: W, artScale: S, chunkHeight: L, chunks: 1, length: L, tint: tintTable(L, () => [153, 153, 166]) },
  };
}
