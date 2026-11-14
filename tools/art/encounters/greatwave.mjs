// The arena of encounter 1 (ex1): Hokusai's Great Wave off Kanagawa (c. 1831, long in the public domain), redrawn
// in pixels and gone fizzy: the wave is soda, carbonation rising through its Prussian blue, its claws of foam
// throwing bubbles instead of spray; the three fishing boats it bears down on are floating cans and a bottle;
// Fuji sits small in the trough as it does in the print; the cartouche in the sky is a drink's label, its
// writing only brush marks. The strip pans up slowly through the fight: the sea and Fuji first, the crest last.
import { Raster, fbm, rng, mix, scaleColor } from '../../lib/raster.mjs';
import { rampColor, grade } from '../nature.mjs';
import { PropKit, tintTable } from '../props.mjs';

export const S = 3;
const W = 180;
const L = 896; // one chunk of 896 logical rows
const FW = W * S;
const FH = L * S;

const PAPER = [0xb8a888, 0xcfc0a0, 0xe0d4b8, 0xece4cc];
const PRUSSIAN = [0x0e1e3e, 0x183462, 0x24508a, 0x4a7ab0, 0x8ab4d8];
const FOAM = [0xb8c8d0, 0xdce6ea, 0xf6f8f4];
const INK = 0x1a1420;

/** The big wave's spine: from its foot, bottom left, up the wall, over the crest and down into the claw. */
const SPINE = [[-10, 2690], [20, 2300], [60, 1900], [120, 1560], [190, 1290], [270, 1140], [350, 1110], [420, 1170], [462, 1270], [470, 1390]];
function spineAt(t) {
  const n = SPINE.length - 1;
  const f = Math.min(n - 1e-6, Math.max(0, t * n));
  const i = Math.floor(f);
  const k = f - i;
  // Catmull-Rom through the points
  const p0 = SPINE[Math.max(0, i - 1)];
  const p1 = SPINE[i];
  const p2 = SPINE[i + 1];
  const p3 = SPINE[Math.min(n, i + 2)];
  const cr = (a, b, c, d) => 0.5 * (2 * b + (c - a) * k + (2 * a - 5 * b + 4 * c - d) * k * k + (3 * b - a - 3 * c + d) * k * k * k);
  return [cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])];
}
const width = (t) => 185 * (1 - t) ** 1.3 + 16; // thick at the foot, thin at the claw's tip

export function buildFar() {
  // far below the paper sky, never really seen: the same paper, with a few bubbles (a seamless loop)
  const r = new Raster(FW, 1152);
  for (let y = 0; y < r.h; y++) for (let x = 0; x < FW; x++) r.set(x, y, rampColor(PAPER, 0.55 + (fbm(x, y, { seed: 3, scale: 40, periodX: FW, periodY: 1152 }) - 0.5) * 0.3, x, y));
  return r;
}

export function buildMid() {
  const img = new Raster(FW, FH);
  const rand = rng(1831);
  const horizon = 1720;
  // ---- the sky: aged paper, darker towards the top as in the print, its fibres
  for (let y = 0; y < horizon; y++)
    for (let x = 0; x < FW; x++) {
      const n = fbm(x * 0.6, y * 0.08, { seed: 11, scale: 6 }) - 0.5;
      const v = 0.72 - Math.max(0, 900 - y) / 2400 + n * 0.12;
      img.set(x, y, rampColor(PAPER, v, x, y));
    }
  // a pale bottle-cap sun with its crimped rim, high up
  {
    const [cx, cy, R] = [410, 430, 46];
    for (let y = cy - R - 8; y <= cy + R + 8; y++)
      for (let x = cx - R - 8; x <= cx + R + 8; x++) {
        const a = Math.atan2(y - cy, x - cx);
        const rr = R + 5 * (Math.cos(a * 21) > 0 ? 1 : 0.4);
        const d = Math.hypot(x - cx, y - cy);
        if (d > rr) continue;
        img.set(x, y, d > R - 2 ? mix(0xc8302a, 0x8a1a18, (x - cx + R) / (2 * R)) : mix(0xe85a3a, 0xffb090, Math.max(0, (cx - x + cy - y) / (2 * R))));
      }
  }
  // the cartouche, top left, a drink's label: a red border, the paper, brush marks for writing
  {
    const [x0, y0, w, h] = [40, 210, 92, 168];
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++) {
        const edge = Math.min(x - x0, x0 + w - 1 - x, y - y0, y0 + h - 1 - y);
        img.set(x, y, edge < 4 ? 0xb82a24 : edge < 6 ? 0xe8d8b0 : rampColor(PAPER, 0.85, x, y));
      }
    const br = rng(77);
    for (let col = 0; col < 2; col++)
      for (let k = 0; k < 7; k++) {
        const cx = x0 + 28 + col * 34;
        const cy = y0 + 18 + k * 20;
        const len = 6 + br() * 8;
        for (let s = 0; s < 3; s++) {
          const ang = br() * Math.PI;
          for (let q = -len; q <= len; q++) for (let th = 0; th < 3; th++) img.set(cx + Math.cos(ang) * q, cy + Math.sin(ang) * q * 0.6 + th - 1, INK, 0.85);
        }
      }
  }
  // ---- Fuji, small in the trough: its blue flanks, the snow cap with its ragged edge
  {
    const [px, py, half] = [410, 1590, 84];
    for (let y = py; y < horizon + 8; y++) {
      const t = (y - py) / (horizon + 8 - py);
      const w = 6 + t * half;
      for (let x = Math.floor(px - w); x <= px + w; x++) {
        const snow = y < py + 52 + Math.sin(x * 0.35) * 9 + Math.sin(x * 0.11) * 6;
        const lit = (x - px) < 0;
        img.set(x, y, snow ? (lit ? 0xf4f2e8 : 0xc8ccd0) : rampColor(PRUSSIAN, lit ? 0.4 : 0.22, x, y));
      }
    }
  }
  // ---- the sea, from the horizon down: swell after swell in Prussian blue, white lines on their crests
  for (let y = horizon; y < FH; y++)
    for (let x = 0; x < FW; x++) {
      const swell = Math.sin(x * 0.018 + y * 0.012) * 30 + Math.sin(x * 0.05 - y * 0.02) * 10;
      const band = ((y + swell) % 70 + 70) % 70;
      const n = fbm(x, y, { seed: 21, scale: 18 }) - 0.5;
      let c = rampColor(PRUSSIAN, 0.18 + band / 140 + n * 0.25, x, y);
      if (band > 62) c = rampColor(FOAM, 0.4 + n, x, y);
      img.set(x, y, c);
    }
  // ---- the great wave: every pixel near the spine, banded along its flow, foam on its outer edge
  const samples = [];
  for (let i = 0; i <= 260; i++) {
    const t = i / 260;
    const [x, y] = spineAt(t);
    const [x2, y2] = spineAt(Math.min(1, t + 0.004));
    const len = Math.hypot(x2 - x, y2 - y) || 1;
    // the outer side (towards the sky and forward) is the normal turned to the left of the direction of travel
    samples.push({ t, x, y, nx: (y2 - y) / len, ny: -(x2 - x) / len, w: width(t) });
  }
  for (let y = 1000; y < FH; y++)
    for (let x = 0; x < FW; x++) {
      let best = null;
      let bd = 1e9;
      for (const s of samples) {
        const d = (x - s.x) ** 2 + (y - s.y) ** 2;
        if (d < bd) {
          bd = d;
          best = s;
        }
      }
      const d = Math.sqrt(bd);
      if (d > best.w) continue;
      const side = (x - best.x) * best.nx + (y - best.y) * best.ny; // >0 outer, <0 inner (the hollow)
      const k = side / best.w; // -1 .. 1
      const n = fbm(x, y, { seed: 31, scale: 7 }) - 0.5;
      // Hokusai's lines: streaks running along the wave
      const streak = Math.sin(k * 26 + best.t * 40 + n * 2) > 0.82;
      let v = 0.22 + (k + 1) * 0.18 + n * 0.12;
      let c = rampColor(PRUSSIAN, v, x, y);
      if (streak) c = PRUSSIAN[3];
      if (k > 0.78) c = rampColor(FOAM, 0.3 + (k - 0.78) * 3 + n, x, y);
      else if (k > 0.66) c = mix(c, FOAM[1], 0.5);
      // the soda: bubbles rising inside the water
      const h = (Math.floor(x / 9) * 7349 + Math.floor((y + x * 0.3) / 9) * 911) % 97;
      if (h < 4 && k < 0.6) {
        const bx = Math.floor(x / 9) * 9 + 4;
        const byy = Math.floor((y + x * 0.3) / 9) * 9 + 4 - x * 0.3;
        const dd = Math.hypot(x - bx, y - byy);
        if (dd < 3.2 && dd > 1.8) c = PRUSSIAN[4];
        else if (dd < 1.2) c = 0xffffff;
      }
      img.set(x, y, c);
    }
  // its claws: along the outer edge of the crest, fingers of foam curling forward and down
  for (let t = 0.5; t < 0.99; t += 0.026) {
    const s = samples[Math.round(t * 260)];
    let fx = s.x + s.nx * s.w * 0.9;
    let fy = s.y + s.ny * s.w * 0.9;
    let ang = Math.atan2(s.ny, s.nx) + 0.5;
    let r = 9 + rand() * 6;
    for (let q = 0; q < 7; q++) {
      for (let yy = -r - 2; yy <= r + 2; yy++)
        for (let xx = -r - 2; xx <= r + 2; xx++) {
          const dd = Math.hypot(xx, yy);
          if (dd > r + 1.5) continue;
          img.set(fx + xx, fy + yy, dd > r - 0.5 ? PRUSSIAN[1] : rampColor(FOAM, 0.75 - (xx + yy) / (r * 5), fx + xx, fy + yy));
        }
      fx += Math.cos(ang) * r * 1.1;
      fy += Math.sin(ang) * r * 1.1;
      ang += 0.55; // curling round
      r *= 0.78;
    }
  }
  // the spray off the crest: bubbles, outlined, a glint each
  const sr = rng(5);
  for (let k = 0; k < 140; k++) {
    const t = 0.45 + sr() * 0.55;
    const s = samples[Math.round(t * 260)];
    const out = s.w * (1 + sr() * 1.4);
    const bx = s.x + s.nx * out + (sr() - 0.5) * 30;
    const by = s.y + s.ny * out + (sr() - 0.5) * 30;
    const r = 2 + sr() * 5;
    for (let a = 0; a < Math.PI * 2; a += 0.08) img.set(bx + Math.cos(a) * r, by + Math.sin(a) * r, PRUSSIAN[3]);
    img.set(bx - r * 0.4, by - r * 0.4, 0xffffff);
  }
  // ---- the "boats": a can and a bottle afloat in the troughs, and a can riding up the face of the wave
  const floater = (cx, cy, ang, bottle, col) => {
    const len = bottle ? 70 : 50;
    const rad = bottle ? 13 : 16;
    for (let q = -len / 2; q <= len / 2; q += 0.5)
      for (let w = -rad; w <= rad; w += 0.5) {
        const neck = bottle && q > len / 2 - 22 ? Math.max(5, rad - (q - (len / 2 - 22)) * 0.9) : rad;
        if (Math.abs(w) > neck) continue;
        const x = cx + Math.cos(ang) * q - Math.sin(ang) * w;
        const y = cy + Math.sin(ang) * q + Math.cos(ang) * w;
        const lit = 0.75 - w / (rad * 2.2);
        let c = bottle ? mix(0x9ad8c8, 0xffffff, lit * 0.4) : scaleColor(col, 0.6 + lit * 0.6);
        if (!bottle && Math.abs(q) > len / 2 - 3) c = 0xb8bac4;
        if (bottle && q > -10 && q < 12) c = scaleColor(col, 0.6 + lit * 0.6);
        if (Math.abs(Math.abs(w) - neck) < 0.8) c = INK;
        img.set(x, y, c);
      }
  };
  floater(120, 2470, -0.2, false, 0xd02a26);
  floater(250, 2560, 0.15, true, 0x2a7ad8);
  floater(420, 2440, -0.35, false, 0xe8b830);
  floater(160, 1880, -1.1, false, 0x3aa84a);
  // the paper's grain over everything, and the print's border line
  for (let y = 0; y < FH; y++)
    for (let x = 0; x < FW; x++) {
      const g = fbm(x * 1.7, y * 0.4, { seed: 91, scale: 3 }) - 0.5;
      if (Math.abs(g) > 0.42) img.tint?.(x, y, g > 0 ? 1.05 : 0.95);
    }
  // muted a little, like every stage's middle layer, so the bullets stand out
  grade(img, { sat: 0.8, bright: 0.84, tint: 0x182030, tintAmt: 0.05 });
  // ---- the moving parts: bubbles rising off the wave and the sea, glints on the foam
  const kit = new PropKit(1832, { artScale: S });
  const bubble = (r) => {
    const out = new Raster(r * 2 + 3, r * 2 + 3);
    for (let a = 0; a < Math.PI * 2; a += 0.05) out.set(r + 1 + Math.cos(a) * r, r + 1 + Math.sin(a) * r, 0xd8f0ff, 0.9);
    out.set(r + 1 - r * 0.45, r + 1 - r * 0.45, 0xffffff);
    return kit.frame(out);
  };
  const b = [bubble(3), bubble(5), bubble(7)];
  const rise = [[b[0], b[1], b[2]]];
  for (const [x, y] of [[60, 2100], [140, 1700], [230, 1300], [330, 1180], [420, 1260], [470, 1500], [250, 2300], [400, 2200], [80, 2550]]) kit.emit(Math.round(x / S), Math.round(L - y / S), rise, { rate: 1.2, life: [2.5, 4], vy: 14, sx: 10, wf: 0.6, a: 0.85, tint: 1 });
  const glint = (() => {
    const out = new Raster(9, 9);
    for (let i = -4; i <= 4; i++) {
      out.set(4 + i, 4, 0xffffff, 1 - Math.abs(i) / 5);
      out.set(4, 4 + i, 0xffffff, 1 - Math.abs(i) / 5);
    }
    return kit.frame(out);
  })();
  const parts = [];
  for (let k = 0; k < 40; k++) {
    const s = samples[Math.round((0.5 + (k / 40) * 0.48) * 260)];
    parts.push([0, Math.round((s.x + s.nx * s.w * 0.9) / S), Math.round(L - (s.y + s.ny * s.w * 0.9) / S), k * 0.4]);
  }
  kit.wave([glint], parts, { w: 2.2, a0: 0, a1: 1, pw: 6 });
  return {
    strip: img,
    props: kit.pack(),
    meta: { width: W, artScale: S, chunkHeight: L, chunks: 1, length: L, tint: tintTable(L, () => [255, 255, 255]) },
  };
}
