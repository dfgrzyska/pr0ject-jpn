// The arena of encounter 4 (ex4): Hokusai's Dragon of Smoke Escaping from Mount Fuji (1849, long in the public
// domain), gone feline. Like the original it is a sumi ink painting on silk, not a colour print: Fuji is the bare,
// unpainted silk, picked out only by the grey wash of the sky around it and a few gullies at the summit; behind it a
// column of black smoke billows up the sky, and where Hokusai's dragon rides it ends in a cat's head of smoke, its
// eyes two slits of bare silk, its whiskers dry brush strokes. Low hills and puffs of trees in the foreground give the
// mountain its size; a red seal in the corner. The strip creeps up through the fight, from the mountain to the head.
import { Raster, fbm, rng, mix } from '../../lib/raster.mjs';
import { tintTable, PropKit } from '../props.mjs';

export const S = 3;
const W = 180;
const L = 896;
const FW = W * S;
const FH = L * S;
const INK = 0x1e1b1a;
const SILK = [0xe2d6ba, 0xd2c5a6];
const SEAL = 0xb4382a;

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** The silk: warm, a weave of fine threads, the odd old stain; darker with age towards the top. */
function silk(x, y, top, period) {
  const o = period ? { periodX: FW, periodY: period } : {};
  const n = fbm(x, y, { seed: 2, scale: 70, ...o });
  const weave = (((x * 7) ^ (y * 3)) & 3) * 0.006 + Math.sin(x * 1.9) * 0.008 + Math.sin(y * 2.3) * 0.006;
  const c = mix(SILK[0], SILK[1], clamp01(0.3 + (n - 0.5) * 0.9 + top * 0.35 + weave));
  return c;
}

export function buildFar() {
  const H = 1152;
  const r = new Raster(FW, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < FW; x++) {
      const d = 0.16 + (fbm(x * 0.3, y, { seed: 21, scale: 40, periodX: FW, periodY: H }) - 0.5) * 0.18;
      r.set(x, y, mix(silk(x, y, 0.5, H), INK, d));
    }
  return r;
}

export function buildMid() {
  const rand = rng(41);
  const D = new Float32Array(FW * FH); // ink density, 0 = bare silk
  const id = (x, y) => (x < 0 || y < 0 || x >= FW || y >= FH ? -1 : (y | 0) * FW + (x | 0));
  const put = (x, y, d, a = 1) => {
    const i = id(x, y);
    if (i >= 0) D[i] += (d - D[i]) * a;
  };
  const add = (x, y, d) => {
    const i = id(x, y);
    if (i >= 0) D[i] = Math.min(0.95, D[i] + d);
  };
  /** A brush stroke along a path: tapering, broken where the brush runs dry. */
  const stroke = (pts, w0, w1, d, seed = 1, dry = 0.72) => {
    for (let k = 0; k < pts.length - 1; k++) {
      const [ax, ay] = pts[k];
      const [bx, by] = pts[k + 1];
      const len = Math.hypot(bx - ax, by - ay);
      for (let s = 0; s < len; s += 0.6) {
        const t = (k + s / len) / (pts.length - 1);
        const x = ax + ((bx - ax) * s) / len;
        const y = ay + ((by - ay) * s) / len;
        const w = w0 + (w1 - w0) * t;
        for (let j = -w; j <= w; j++)
          for (let i = -w; i <= w; i++) {
            if (i * i + j * j > w * w) continue;
            if (fbm(x + i, y + j, { seed, scale: 3, octaves: 2 }) > dry + (1 - t) * 0.1) continue;
            put(x + i, y + j, Math.max(D[id(x + i, y + j)] ?? 0, d));
          }
      }
    }
  };

  // ---- the sky: a thin grey wash, darker towards the top, in long horizontal veils
  for (let y = 0; y < FH; y++) {
    const top = 1 - y / FH;
    for (let x = 0; x < FW; x++) {
      const veil = fbm(x * 0.22, y * 1.4, { seed: 21, scale: 46 });
      const blot = fbm(x, y, { seed: 22, scale: 120 });
      D[y * FW + x] = clamp01(0.1 + top * 0.18 + (veil - 0.5) * 0.24 + (blot - 0.5) * 0.12);
    }
  }
  // bands of mist (Hokusai's long clouds, here as the bare silk left between washes), wavy-edged
  for (const [cy, h, x0, x1] of [[2120, 26, -40, 360], [1880, 20, 240, 600], [1500, 30, -40, 280], [1150, 22, 280, 600], [800, 26, -40, 250], [520, 20, 330, 600]])
    for (let y = cy - h * 2; y < cy + h * 2; y++)
      for (let x = Math.max(0, x0); x < Math.min(FW, x1); x++) {
        const wob = Math.sin(x * 0.021 + cy) * 7 + (fbm(x, y, { seed: 23, scale: 14 }) - 0.5) * 14;
        const v = 1 - Math.abs(y - cy - wob) / h;
        const ends = smooth(0, 60, x - x0) * smooth(0, 60, x1 - x);
        if (v > 0) D[y * FW + x] *= 1 - 0.8 * smooth(0, 0.6, v) * ends;
      }

  // ---- the smoke: out of the crater, behind the mountain, billowing up in a long S, wider as it rises
  const px = 296;
  const py = 2010;
  const headX = 262;
  const headY = 300;
  const path = [];
  for (let k = 0; k <= 400; k++) {
    const t = k / 400;
    const y = py + 30 - (py + 30 - headY - 60) * t;
    const sway = Math.sin(t * Math.PI * 2.6 + 0.2) * (20 + 140 * t) * smooth(0, 0.12, t);
    const x = px + sway - 40 * t + (headX - px + 40) * smooth(0.85, 1, t);
    path.push([Math.max(100, Math.min(FW - 100, x)), y, 30 + 66 * t]);
  }
  /** One billow: a dark wash with a darker wet edge and a paler curl in it; laid over what is under it. */
  const puff = (cx, cy, R, seed, dark = 0.7) => {
    const hx = cx - R * 0.28;
    const hy = cy - R * 0.32;
    for (let y = Math.floor(cy - R * 1.3); y <= cy + R * 1.3; y++)
      for (let x = Math.floor(cx - R * 1.3); x <= cx + R * 1.3; x++) {
        const i = id(x, y);
        if (i < 0) continue;
        const n = fbm(x, y, { seed, scale: 11 });
        const e = Math.hypot(x - cx, y - cy) / R + (n - 0.5) * 0.42;
        if (e >= 1) continue;
        const rim = smooth(0.72, 0.97, e) * 0.2;
        const curl = (1 - smooth(0, 0.55, Math.hypot(x - hx, y - hy) / R)) * 0.3;
        const grain = (fbm(x, y, { seed: seed + 5, scale: 4, octaves: 2 }) - 0.5) * 0.14;
        const d = clamp01(dark + rim - curl + grain + (n - 0.5) * 0.2);
        D[i] += (d - D[i]) * smooth(1, 0.9, e);
      }
  };
  for (let k = 0; k < path.length; k += 3) {
    const [x, y, r] = path[k];
    for (let m = 0; m < 3; m++) {
      const a = rand() * Math.PI * 2;
      const o = r * (0.15 + rand() * 0.5);
      puff(x + Math.cos(a) * o, y + Math.sin(a) * o * 0.6, r * (0.45 + rand() * 0.35), 31 + k + m, 0.6 + rand() * 0.15);
    }
  }
  // ---- the head of smoke at the top: a round of billows, two ears, eyes left as bare silk
  for (let k = 0; k < 18; k++) {
    const a = (k / 18) * Math.PI * 2;
    puff(headX + Math.cos(a) * 92, headY + Math.sin(a) * 70, 52 + rand() * 14, 90 + k, 0.62 + rand() * 0.1);
  }
  puff(headX, headY + 6, 96, 120, 0.66);
  for (const sx of [-1, 1]) {
    // ears: a triangle of smoke, rough-edged, a paler inside
    const tri = [[headX + sx * 22, headY - 62], [headX + sx * 116, headY - 30], [headX + sx * 100, headY - 160]];
    const inT = (x, y, [[x1, y1], [x2, y2], [x3, y3]], m) => {
      const e = (ax, ay, bx, by) => ((bx - ax) * (y - ay) - (by - ay) * (x - ax)) / Math.hypot(bx - ax, by - ay);
      const a1 = e(x1, y1, x2, y2);
      const a2 = e(x2, y2, x3, y3);
      const a3 = e(x3, y3, x1, y1);
      const sgn = Math.sign(a1 + a2 + a3);
      return Math.min(a1 * sgn, a2 * sgn, a3 * sgn) + m;
    };
    const inner = [[headX + sx * 44, headY - 66], [headX + sx * 98, headY - 48], [headX + sx * 94, headY - 128]];
    for (let y = headY - 175; y < headY - 20; y++)
      for (let x = headX + Math.min(sx * 10, sx * 130); x < headX + Math.max(sx * 10, sx * 130); x++) {
        const n = fbm(x, y, { seed: 130 + sx, scale: 8 });
        const depth = inT(x, y, tri, (n - 0.5) * 10);
        if (depth < 0) continue;
        const pale = smooth(-4, 10, inT(x, y, inner, (n - 0.5) * 6)) * 0.3;
        const grain = (fbm(x, y, { seed: 133, scale: 4, octaves: 2 }) - 0.5) * 0.14;
        put(x, y, clamp01(0.68 + (n - 0.5) * 0.2 + (depth < 5 ? 0.16 : 0) - pale + grain), smooth(0, 3, depth));
      }
    // the eyes: almonds of bare silk ringed in ink, a slit of a pupil
    const ex = headX + sx * 46;
    const ey = headY - 12;
    for (let y = ey - 16; y <= ey + 16; y++)
      for (let x = ex - 28; x <= ex + 28; x++) {
        const u = (x - ex) / 25;
        const v = (y - ey + u * sx * 3) / 12.5;
        const e = u * u + v * v * (1 + Math.abs(u) * 0.6);
        if (e < 1) put(x, y, e > 0.72 ? 0.9 : 0);
      }
    for (let y = ey - 10; y <= ey + 10; y++) for (let x = ex - 3; x <= ex + 3; x++) if (Math.abs(x - ex) < 3.2 * (1 - Math.abs(y - ey) / 11)) put(x, y, 0.92);
    // whiskers: dry brush sweeping out of the smoke
    for (const dy of [-14, 0, 14]) {
      const pts = [];
      for (let s = 0; s <= 16; s++) pts.push([headX + sx * (54 + s * 11), headY + 36 + dy + s * dy * 0.05 + Math.sin(s * 0.45) * 5]);
      stroke(pts, 2.6, 0.5, 0.86, 150 + dy + sx, 0.76);
    }
  }
  // nose and mouth
  for (let y = headY + 22; y < headY + 34; y++) for (let x = headX - 9; x <= headX + 9; x++) if (Math.abs(x - headX) < 9 - (y - headY - 22) * 0.75) put(x, y, 0.92);
  for (const sx of [-1, 1]) stroke([[headX, headY + 33], [headX + sx * 6, headY + 42], [headX + sx * 15, headY + 42]], 2, 1, 0.88, 160 + sx, 0.85);

  // ---- Fuji: bare silk over the smoke; its edge drawn by the wash pooling against it and a thin broken line
  const half = (y) => {
    const dy = y - py;
    return 28 + dy * 0.62 + dy * dy * 0.00062;
  };
  const crown = (x) => py + Math.abs(Math.sin((x - px) * 0.22)) * 5 * (Math.abs(x - px) < 30 ? 1 : 0);
  for (let y = py - 8; y < FH; y++)
    for (let x = 0; x < FW; x++) {
      const h = half(y);
      const dx = Math.abs(x - px) - h;
      const i = y * FW + x;
      if (y < crown(x) || dx > 0) {
        if (y >= py && dx > 0 && dx < 14) D[i] = Math.min(0.95, D[i] + 0.2 * (1 - dx / 14));
        continue;
      }
      const dy = y - py;
      const shade = x > px ? 0.07 * smooth(0, 60, x - px) : 0;
      const foot = smooth(380, 640, dy) * (0.14 + (fbm(x, y, { seed: 70, scale: 9 }) - 0.5) * 0.12);
      D[i] = shade + foot;
      if (dx > -1.8 && fbm(x, y, { seed: 71, scale: 5 }) < 0.68) D[i] = 0.55;
    }
  // the crater's lip and the gullies of snow raying down from it
  stroke([[px - 30, py + 1], [px - 14, py + 5], [px, py + 1], [px + 14, py + 5], [px + 30, py + 1]], 1.6, 1.2, 0.6, 170, 0.8);
  for (let k = -5; k <= 5; k++) {
    if (k === 0) continue;
    const len = 50 + rand() * 150;
    const a = Math.PI / 2 - k * (0.13 + rand() * 0.05);
    const bend = (rand() - 0.5) * 0.25;
    const x0 = px + k * 5;
    const pts = [];
    for (let s2 = 0; s2 <= 10; s2++) {
      const r = (len * s2) / 10;
      const aa = a + bend * (s2 / 10);
      pts.push([x0 + Math.cos(aa) * r, py + 6 + Math.sin(aa) * r]);
    }
    stroke(pts, 1.6 + rand(), 0.3, 0.32 + rand() * 0.14, 180 + k, 0.66);
  }
  // a little grey in the flanks, so the cone has some roundness
  for (let y = py; y < FH; y++)
    for (let x = 0; x < FW; x++) {
      const h = half(y);
      const dx = Math.abs(x - px) - h;
      if (dx > 0 || y < crown(x)) continue;
      const near = smooth(-h * 0.5, 0, dx) * (x > px ? 0.1 : 0.05) * (fbm(x * 0.6, y * 0.3, { seed: 75, scale: 14 }) + 0.3);
      add(x, y, near);
    }

  // ---- the foreground: low hills in a darker wash, ridge lines, puffs of trees
  const hills = [[110, FH - 250, 260, 0.52], [440, FH - 200, 240, 0.6], [250, FH - 120, 300, 0.68]];
  for (const [cx, top, w, d] of hills)
    for (let x = Math.max(0, cx - w); x < Math.min(FW, cx + w); x++) {
      const ridge = top + ((x - cx) / w) ** 2 * 120 + (fbm(x, top, { seed: 80, scale: 22 }) - 0.5) * 18;
      for (let y = Math.floor(ridge); y < FH; y++) {
        const n = fbm(x * 0.5, y * 2, { seed: 81 + cx, scale: 10 });
        const edge = y - ridge < 5 ? 0.18 : 0;
        put(x, y, clamp01(d + edge + (n - 0.5) * 0.24 - smooth(0, 160, y - ridge) * 0.1));
      }
      if (rand() < 0.05) {
        // a puff of trees on the ridge: a clump of dabs
        const n = 6 + Math.floor(rand() * 10);
        for (let m = 0; m < n; m++) {
          const tx = x + (rand() - 0.5) * 34;
          const ty = ridge - rand() * 18;
          const r = 2.5 + rand() * 3.5;
          for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r) put(tx + i, ty + j, 0.85);
        }
        stroke([[x, ridge], [x + (rand() - 0.5) * 4, ridge - 12]], 1.2, 0.6, 0.8, 90 + x, 0.9);
      }
    }

  // ---- ink on silk
  const img = new Raster(FW, FH);
  for (let y = 0; y < FH; y++) {
    const top = 1 - y / FH;
    for (let x = 0; x < FW; x++) {
      const g = fbm(x, y, { seed: 99, scale: 3, octaves: 2 });
      const d = clamp01(D[y * FW + x] * (0.92 + g * 0.16));
      img.set(x, y, mix(silk(x, y, top), INK, d));
    }
  }
  // the seal: a square of vermilion, its marks left white (no real characters)
  const [sx0, sy0] = [34, FH - 330];
  for (let y = 0; y < 38; y++)
    for (let x = 0; x < 30; x++) {
      const frame = x < 3 || y < 3 || x > 26 || y > 34;
      const rr = Math.hypot(x - 14.5, y - 18.5);
      const marks = (rr > 7 && rr < 9.2) || rr < 2.6 || (x > 6 && x < 23 && (y === 5 || y === 6 || y === 31 || y === 32));
      const worn = fbm(sx0 + x, sy0 + y, { seed: 200, scale: 3 }) > 0.74;
      if ((frame || !marks) && !worn) img.set(sx0 + x, sy0 + y, SEAL, 0.86);
    }
  // ---- the moving parts: the smoke churns (billows swelling and fading in a wave that runs up the column), puffs
  // keep rising out of the crater, and now and then the smoke-cat slowly blinks
  const kit = new PropKit(1849, { artScale: S });
  const u = (y) => Math.round(L - y / S);
  const smoke = mix(SILK[0], INK, 0.66);
  const billow = (R, seed, pale) => {
    const n2 = Math.ceil(R * 2.6);
    const out = new Raster(n2, n2);
    const c = n2 / 2;
    for (let y = 0; y < n2; y++)
      for (let x = 0; x < n2; x++) {
        const n = fbm(x, y, { seed, scale: 7 });
        const e = Math.hypot(x - c, y - c) / R + (n - 0.5) * 0.45;
        if (e >= 1) continue;
        if (pale) out.set(x, y, SILK[0], 0.5 * (1 - e) ** 0.8);
        else out.set(x, y, mix(SILK[0], INK, 0.62 + smooth(0.7, 0.97, e) * 0.22 + (n - 0.5) * 0.15), 0.85 * Math.min(1, (1 - e) * 4));
      }
    return kit.frame(out);
  };
  const bf = [billow(14, 301, false), billow(20, 302, false), billow(26, 303, false), billow(12, 304, true), billow(18, 305, true)];
  const parts = [];
  for (let k = 8; k < path.length - 10; k += 7) {
    const [x, y, r] = path[k];
    const pale = (k / 7) % 2 === 1;
    const i = pale ? 3 + (k % 2) : Math.min(2, Math.floor(r / 34));
    const [fw, fh] = kit.size(bf[i]);
    // the dark ones on the column's edges, so its outline swells and settles; the pale curls inside it
    const side = (k / 7) % 4 < 2 ? -1 : 1;
    const ox = pale ? (rand() - 0.5) * r * 0.6 : side * r * (0.72 + rand() * 0.2);
    parts.push([i, Math.round((x + ox) / S - fw / 2), u(y) + Math.round(fh / 2), Math.round(-k * 0.045 * 100) / 100]);
  }
  kit.wave(bf, parts, { w: 1.3, a0: 0, a1: 0.8, pw: 2 });
  // puffs out of the crater: small, then bigger as they rise and thin away
  const rising = [[billow(9, 311, false)], [billow(14, 312, false)], [billow(19, 313, false)]];
  for (const ox of [-26, 26]) kit.emit(Math.round((px + ox) / S), u(py - 2), rising, { rate: 0.9, life: [3, 4.5], vy: 14, sx: 4, wf: 0.5, a: 0.8 });
  // the blink: smoke drawn over the eyes, a curved line where they shut
  const shut = new Raster(60, 30);
  for (let y = 0; y < 30; y++)
    for (let x = 0; x < 60; x++) {
      const uu = (x - 30) / 28;
      const vv = (y - 15) / 14;
      if (uu * uu + vv * vv > 1) continue;
      const g = fbm(x, y, { seed: 320, scale: 4, octaves: 2 });
      shut.set(x, y, mix(smoke, INK, (g - 0.5) * 0.2), Math.min(1, (1 - uu * uu - vv * vv) * 5));
    }
  for (let x = 6; x < 54; x++) {
    const t = (x - 30) / 24;
    for (let w = 0; w < 3; w++) shut.set(x, 13 + t * t * 6 + w * 0.7, INK, 0.9);
  }
  const lid = kit.frame(shut);
  const seq = [...Array(52).fill(-1), 0, 0, 0, -1, -1, 0, 0, ...Array(30).fill(-1)];
  for (const sx of [-1, 1]) kit.loop(Math.round((headX + sx * 46 - 30) / S), u(headY - 12 - 15), [lid], { fps: 8, seq, ph: 0 });
  return {
    strip: img,
    props: kit.pack(),
    meta: { width: W, artScale: S, chunkHeight: L, chunks: 1, length: L, tint: tintTable(L, () => [255, 255, 255]) },
  };
}
