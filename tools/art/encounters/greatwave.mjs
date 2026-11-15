// The arena of encounter 1 (ex1): Hokusai's Great Wave off Kanagawa (c. 1831, long in the public domain), redrawn
// at the full 540 px and gone fizzy. Hokusai's composition, turned upright for a vertical screen: the great wave
// rises from the bottom left, its wall striped with fine lines along the flow, and arches over the top right where
// its crest breaks into claws of foam that branch into smaller claws; its spray falls as bubbles; Fuji sits small and
// snow-capped in the trough; a smaller wave in front echoes Fuji's shape; three long fishing boats (oshiokuri-bune),
// their rowers bent low, ride the troughs. The twist is in the water: it is soda, bubbles rising through its
// Prussian blue, the sun a crimped red bottle cap, the cartouche a drink's label with only brush marks for writing.
// The strip pans up slowly through the fight: the sea, the boats and Fuji first, the crest last.
import { Raster, fbm, rng, mix } from '../../lib/raster.mjs';
import { grade } from '../nature.mjs';
import { PropKit, tintTable } from '../props.mjs';

export const S = 3;
const W = 180;
const L = 896; // one chunk of 896 logical rows
const FW = W * S;
const FH = L * S;

const PAPER = [0xa89878, 0xc4b494, 0xd8cab0, 0xe8dec8, 0xf2ead8];
const BLUE = [0x0a1630, 0x10264c, 0x1a3c70, 0x2a5a98, 0x4a7eb8, 0x7aa8d4, 0xb4d0e8];
const FOAM = 0xf4f2e8;
const FOAM_SH = 0xc8d4dc;
const LINE = 0x10264c; // the dark blue outline of foam and claws
const INK = 0x1a1420;

/** A smooth colour along a ramp (no dither: at 540 px the gradients can be soft). */
function ramp(r, v) {
  const s = Math.max(0, Math.min(r.length - 1.0001, v * (r.length - 1)));
  const i = Math.floor(s);
  return mix(r[i], r[i + 1], s - i);
}

/** A Catmull-Rom curve through points: f(t) for t in 0..1. */
function curve(pts) {
  const n = pts.length - 1;
  return (t) => {
    const f = Math.min(n - 1e-6, Math.max(0, t * n));
    const i = Math.floor(f);
    const k = f - i;
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(n, i + 2)];
    const cr = (a, b, c, d) => 0.5 * (2 * b + (c - a) * k + (2 * a - 5 * b + 4 * c - d) * k * k + (3 * b - a - 3 * c + d) * k * k * k);
    return [cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])];
  };
}

// the great wave's spine: from its foot, bottom left, up the wall, over the crest and down into the claw
// (all of it set OFF rows lower than the print's proportions would put it: the strip starts at its bottom and the
// fight sees its lower half best, so the crest's claws have to arch over the top of the screen from the start)
const OFF = 320;
const SPINE = curve([[-30, 2700], [10, 2330], [50, 1960], [110, 1620], [180, 1350], [260, 1170], [350, 1110], [430, 1160], [480, 1260], [500, 1380]].map(([x, y]) => [x, y + OFF * (y < 2600 ? 1 : 0.2)]));
const width = (t) => 200 * (1 - t) ** 1.25 + 18; // thick at the foot, thin at the claw's tip

export function buildFar() {
  const r = new Raster(FW, 1152);
  for (let y = 0; y < r.h; y++) for (let x = 0; x < FW; x++) r.set(x, y, ramp(PAPER, 0.6 + (fbm(x, y, { seed: 3, scale: 40, periodX: FW, periodY: 1152 }) - 0.5) * 0.2));
  return r;
}

/** A disc with an outline (foam blobs, claw joints). */
function blob(img, cx, cy, r, fill, edge, shade = true) {
  for (let y = Math.floor(cy - r - 2); y <= cy + r + 2; y++)
    for (let x = Math.floor(cx - r - 2); x <= cx + r + 2; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d > r + 1.6) continue;
      if (d > r) img.set(x, y, edge);
      else img.set(x, y, shade ? mix(fill, FOAM_SH, Math.max(0, (x - cx + (y - cy)) / (r * 3))) : fill);
    }
}

/** A claw of foam: a finger curling forward, branching into smaller fingers near its tip; each claw is painted on
 * its own (white, shaded on its far side, outlined), so the claws overlap like the print's talons. */
function claw(img, x, y, ang, len, r, curl, depth, rand) {
  const discs = [];
  const grow = (x, y, ang, len, r, curl, depth) => {
    const steps = Math.max(3, Math.round(len / Math.max(1.2, r * 0.4)));
    for (let i = 0; i < steps; i++) {
      discs.push([x, y, r * (1 - (i / steps) * 0.55)]);
      x += Math.cos(ang) * (len / steps);
      y += Math.sin(ang) * (len / steps);
      ang += curl / steps;
    }
    if (depth > 0) {
      const n = 2 + Math.floor(rand() * 2);
      for (let j = 0; j < n; j++) grow(x, y, ang + (j - (n - 1) / 2) * 0.75 + (rand() - 0.5) * 0.3, len * 0.55, r * 0.5, curl * 1.2, depth - 1);
    } else discs.push([x, y, r * 0.35]);
  };
  grow(x, y, ang, len, r, curl, depth);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [dx, dy, dr] of discs) {
    x0 = Math.min(x0, dx - dr - 3); y0 = Math.min(y0, dy - dr - 3);
    x1 = Math.max(x1, dx + dr + 3); y1 = Math.max(y1, dy + dr + 3);
  }
  x0 = Math.floor(x0); y0 = Math.floor(y0);
  const w = Math.ceil(x1) - x0 + 1;
  const h = Math.ceil(y1) - y0 + 1;
  const m = new Uint8Array(w * h);
  for (const [dx, dy, dr] of discs)
    for (let yy = Math.floor(dy - dr); yy <= dy + dr; yy++)
      for (let xx = Math.floor(dx - dr); xx <= dx + dr; xx++) if ((xx + 0.5 - dx) ** 2 + (yy + 0.5 - dy) ** 2 <= dr * dr) m[(yy - y0) * w + (xx - x0)] = 1;
  const at = (xx, yy) => xx >= 0 && yy >= 0 && xx < w && yy < h && m[yy * w + xx];
  for (let yy = 0; yy < h; yy++)
    for (let xx = 0; xx < w; xx++) {
      if (at(xx, yy)) img.set(x0 + xx, y0 + yy, !at(xx + 3, yy + 3) ? FOAM_SH : FOAM);
      else if (at(xx - 1, yy) || at(xx + 1, yy) || at(xx, yy - 1) || at(xx, yy + 1) || at(xx - 1, yy - 1) || at(xx + 1, yy + 1)) img.set(x0 + xx, y0 + yy, LINE);
    }
}

export function buildMid() {
  const img = new Raster(FW, FH);
  const rand = rng(1831);
  const horizon = 1760 + OFF;
  // ---- the sky: aged paper, a grey band darkening to the top as in the print, soft fibres
  for (let y = 0; y < horizon; y++)
    for (let x = 0; x < FW; x++) {
      const n = fbm(x * 0.5, y * 0.07, { seed: 11, scale: 7 }) - 0.5;
      const v = 0.78 - Math.max(0, 1000 + OFF - y) / 1900 + n * 0.08;
      img.set(x, y, ramp(PAPER, v));
    }
  // a bottle-cap sun, crimped, high up behind the crest
  {
    const [cx, cy, R] = [400, 520 + OFF, 42];
    for (let y = cy - R - 8; y <= cy + R + 8; y++)
      for (let x = cx - R - 8; x <= cx + R + 8; x++) {
        const a = Math.atan2(y - cy, x - cx);
        const rr = R + 4 + 3 * Math.cos(a * 21);
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        if (d > rr + 1) continue;
        if (d > rr) img.set(x, y, 0x5a1010, 0.6);
        else if (d > R - 3) img.set(x, y, mix(0xd8402e, 0x8a1a18, (x - cx + R) / (2 * R)));
        else img.set(x, y, mix(0xff9878, 0xd8402e, Math.min(1, Math.hypot(x - cx + 12, y - cy + 12) / (R * 1.4))));
      }
  }
  // the cartouche, top left: a drink's label, a red border, brush marks for writing, a red seal
  {
    const [x0, y0, w, h] = [36, 230 + OFF, 96, 176];
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++) {
        const edge = Math.min(x - x0, x0 + w - 1 - x, y - y0, y0 + h - 1 - y);
        img.set(x, y, edge < 4 ? 0xb82a24 : edge < 6 ? 0xf0e4c4 : ramp(PAPER, 0.92 + (fbm(x, y, { seed: 4, scale: 5 }) - 0.5) * 0.1));
      }
    const br = rng(77);
    for (let col = 0; col < 2; col++)
      for (let k = 0; k < 7; k++) {
        const cx = x0 + 30 + col * 34;
        const cy = y0 + 20 + k * 21;
        for (let s = 0; s < 3; s++) {
          const ang = br() * Math.PI;
          const len = 5 + br() * 8;
          for (let q = -len; q <= len; q += 0.5) {
            const th = 1.6 * (1 - Math.abs(q) / (len + 2)) + 0.6;
            for (let o = -th; o <= th; o += 0.5) img.set(cx + Math.cos(ang) * q - Math.sin(ang) * o, cy + Math.sin(ang) * q * 0.6 + Math.cos(ang) * o, INK, 0.85);
          }
        }
      }
    for (let y = y0 + h - 30; y < y0 + h - 12; y++) for (let x = x0 + 60; x < x0 + 78; x++) img.set(x, y, 0xc02a24, 0.9);
  }
  // ---- Fuji, small in the trough: blue flanks with Hokusai's streaks, the snow cap's ragged hem
  {
    const [px, py, half] = [400, 1610 + OFF, 92];
    for (let y = py; y < horizon + 10; y++) {
      const t = (y - py) / (horizon + 10 - py);
      const w = 8 + half * Math.pow(t, 0.85);
      for (let x = Math.floor(px - w); x <= px + w; x++) {
        const hem = py + 50 + Math.sin(x * 0.3) * 8 + Math.sin(x * 0.09) * 6;
        const u = (x - px) / w; // -1 .. 1 across
        if (y < hem) {
          img.set(x, y, u < 0.1 ? mix(0xffffff, 0xe0e4e8, (u + 1) / 2) : mix(0xc8d0d8, 0xa8b4c0, u));
          if (Math.abs(Math.sin(u * 9 + y * 0.02)) < 0.08) img.set(x, y, 0xa8b4c4);
        } else {
          img.set(x, y, ramp(BLUE, 0.42 - u * 0.2 - t * 0.08 + (Math.abs(Math.sin(u * 7 + y * 0.015)) < 0.06 ? 0.15 : 0)));
        }
      }
    }
  }
  // ---- the sea from the horizon down: rolling troughs in Prussian blue, each crest edged with a white lace line
  for (let y = horizon; y < FH; y++)
    for (let x = 0; x < FW; x++) {
      const swell = Math.sin(x * 0.012 + y * 0.008) * 34 + Math.sin(x * 0.035 - y * 0.013) * 12;
      const band = (((y + swell) % 90) + 90) % 90; // 0 at a crest, rising into the trough
      const n = fbm(x, y, { seed: 21, scale: 16 }) - 0.5;
      let c = ramp(BLUE, 0.18 + (band / 90) * 0.42 + n * 0.08 + (y - horizon) / 6000);
      if (band < 3) c = FOAM;
      else if (band < 5) c = BLUE[1];
      else if (band > 30 && band < 32 && Math.sin(x * 0.2 + y * 0.05) > 0.3) c = ramp(BLUE, 0.7); // the fine lines in the troughs
      img.set(x, y, c);
    }
  // ---- the smaller wave in front, bottom right: a little Fuji of water, foam-capped
  {
    const [cx, base, half, top] = [430, FH - 40, 120, FH - 230];
    for (let y = top; y < base; y++) {
      const t = (y - top) / (base - top);
      const w = half * Math.pow(t, 0.7);
      for (let x = Math.floor(cx - w); x <= cx + w; x++) {
        const u = (x - cx) / Math.max(1, w);
        const cap = y < top + 40 + Math.sin(x * 0.4) * 6;
        let c = cap ? FOAM : ramp(BLUE, 0.3 + u * 0.15 + (Math.sin(u * 14 + t * 6) > 0.85 ? 0.25 : 0));
        if (Math.abs(Math.abs(x - cx) - w) < 1.2) c = LINE;
        img.set(x, y, c);
      }
    }
    for (let k = 0; k < 7; k++) claw(img, cx - 40 + k * 13, top + 20 + Math.abs(k - 3) * 6, -Math.PI / 2 - 0.4 + k * 0.13, 22, 6, 1.2, 1, rand);
  }
  // ---- the great wave: every pixel near the spine, its wall striped with lines along the flow
  const samples = [];
  for (let i = 0; i <= 300; i++) {
    const t = i / 300;
    const [x, y] = SPINE(t);
    const [x2, y2] = SPINE(Math.min(1, t + 0.003));
    const len = Math.hypot(x2 - x, y2 - y) || 1;
    samples.push({ t, x, y, nx: (y2 - y) / len, ny: -(x2 - x) / len, w: width(t) });
  }
  const near = (x, y) => {
    let best = null;
    let bd = 1e18;
    for (const s of samples) {
      const d = (x - s.x) ** 2 + (y - s.y) ** 2;
      if (d < bd) {
        bd = d;
        best = s;
      }
    }
    return [best, Math.sqrt(bd)];
  };
  for (let y = 1000 + OFF; y < FH; y++)
    for (let x = 0; x < FW; x++) {
      const [s, d] = near(x, y);
      if (d > s.w) continue;
      const side = (x - s.x) * s.nx + (y - s.y) * s.ny; // >0 outer (towards the sky), <0 the hollow
      const k = side / s.w; // -1 .. 1
      const n = fbm(x, y, { seed: 31, scale: 9 }) - 0.5;
      // the body: dark in the hollow, lighter up the face
      let c = ramp(BLUE, 0.16 + (k + 1) * 0.22 + n * 0.05);
      // Hokusai's lines: fine pale lines running along the wave, closer together towards the crest
      const f = (k + 1) * (9 + s.t * 9);
      if (f - Math.floor(f) < 0.09 && k < 0.6) c = mix(c, BLUE[4], 0.75);
      // near the top of the face, a net of white foam lines
      if (k > 0.45 && k < 0.72 && s.t > 0.42) {
        const m1 = Math.abs(Math.sin(s.t * 160 + k * 18));
        const m2 = Math.abs(Math.sin(s.t * 160 - k * 18));
        if (Math.min(m1, m2) < 0.12) c = mix(c, FOAM, 0.85);
      }
      // the foam lip along the outer edge, outlined
      const lip = s.t > 0.45 ? 0.72 + Math.max(0, 0.55 - s.t) * 2.5 : 2; // (the back of the wave, low down, has no foam on it)
      if (k > lip) c = k > 0.97 ? LINE : mix(FOAM, FOAM_SH, Math.max(0, (k - lip) * 2 - 0.2));
      else if (k > 0.97) c = BLUE[1];
      // the soda: bubbles rising inside the water
      const cell = 11;
      const gx = Math.floor(x / cell);
      const gy = Math.floor((y + x * 0.25) / cell);
      const h = (gx * 7349 + gy * 911) % 97;
      if (h < 5 && k < 0.6) {
        const bx = gx * cell + 5.5;
        const by = gy * cell + 5.5 - x * 0.25;
        const r = 1.6 + (h % 3);
        const dd = Math.hypot(x + 0.5 - bx, y + 0.5 - by);
        if (dd < r + 0.7 && dd > r - 0.7) c = BLUE[6];
        else if (Math.hypot(x + 0.5 - bx + r * 0.4, y + 0.5 - by + r * 0.4) < 0.8) c = 0xffffff;
      }
      img.set(x, y, c);
    }
  // its claws: along the crest's outer edge, branching fingers of foam curling forward and down
  const cr = rng(9);
  for (let t = 0.48; t < 1; t += 0.03) {
    const s = samples[Math.round(t * 300)];
    const tx = -s.ny; // the way the crest is travelling
    const ty = s.nx;
    const front = t > 0.7; // past the top: the claws hang off the curling lip into the hollow
    const side = front ? -0.75 : 0.8;
    const bx = s.x + s.nx * s.w * side;
    const by = s.y + s.ny * s.w * side;
    const ang = front ? Math.atan2(-s.ny + ty * 0.6, -s.nx + tx * 0.6) : Math.atan2(s.ny + ty, s.nx + tx);
    const big = 1 + Math.max(0, t - 0.6) * 2.2; // the claws grow towards the front of the crest
    claw(img, bx, by, ang, (24 + cr() * 16) * big, (7 + cr() * 3) * big, front ? -1.4 : 1.4, 2, cr);
  }
  // the great claw at the very front, reaching down and back towards the boats
  {
    const s = samples[300];
    for (let j = 0; j < 4; j++) claw(img, s.x - j * 8, s.y + j * 4, Math.PI * (0.62 + j * 0.06), 58 + j * 10, 15 - j * 2, -1.5, 2, cr);
  }
  // the spray falling off the crest: Hokusai's flecks of foam, here soda bubbles, outlined
  const sr = rng(5);
  for (let k = 0; k < 260; k++) {
    const t = 0.55 + sr() * 0.45;
    const s = samples[Math.round(t * 300)];
    const out = s.w * (1.1 + sr() * 1.8);
    const bx = s.x + s.nx * out + (sr() - 0.5) * 50;
    const by = s.y + s.ny * out + sr() * 80;
    if (by > 1700 + OFF) continue;
    const r = 1.4 + sr() * 3.6;
    if (sr() < 0.5) blob(img, bx, by, r, FOAM, LINE, false);
    else {
      for (let a = 0; a < Math.PI * 2; a += 0.06) img.set(bx + Math.cos(a) * r, by + Math.sin(a) * r, BLUE[2]);
      img.set(bx - r * 0.4, by - r * 0.4, 0xffffff);
    }
  }
  // ---- the boats: long oshiokuri-bune, pale wood, the rowers in blue bent low over their oars
  const boat = (cx, cy, ang, len) => {
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    for (let q = -len / 2; q <= len / 2; q += 0.5)
      for (let w = -12; w <= 9; w += 0.5) {
        const taper = 1 - Math.pow(Math.abs(q) / (len / 2), 3);
        const top = -3 * taper;
        const bot = 8.5 * taper;
        if (w < top - 1 || w > bot) continue;
        const x = cx + ca * q - sa * w;
        const y = cy + sa * q + ca * w;
        let c = w < top + 1 ? 0x8a6a3a : mix(0xe8d098, 0xb8945a, (w - top) / Math.max(1, bot - top));
        if (w > bot - 1) c = INK;
        img.set(x, y, c);
      }
    // the rowers: a row of hunched figures, blue backs, pale heads, oars slanting into the water
    for (let i = 0; i < 8; i++) {
      const q = -len / 2 + len * (0.15 + i * 0.09);
      const x = cx + ca * q + sa * 7;
      const y = cy + sa * q - ca * 7;
      blob(img, x, y, 5.5, 0x2a4a80, INK, false);
      blob(img, x + ca * 2.5 + sa * 4, y + sa * 2.5 - ca * 4, 2.8, 0xe8d8b8, INK, false);
      for (let o = 0; o < 16; o++) img.set(x - sa * -o * 0.3 + ca * o * 0.6, y + ca * o * 0.9 + sa * o * 0.2, 0x5a4020);
    }
  };
  boat(170, 2470, -0.2, 200);
  boat(360, 2620, 0.1, 170);
  boat(200, 2230, -0.9, 150);
  // the paper's grain over everything, then muted a little (every stage's middle layer is, so bullets stand out)
  for (let y = 0; y < FH; y++)
    for (let x = 0; x < FW; x++) {
      const g = fbm(x * 1.7, y * 0.4, { seed: 91, scale: 3 }) - 0.5;
      if (Math.abs(g) > 0.4) img.tint?.(x, y, g > 0 ? 1.04 : 0.96);
    }
  grade(img, { sat: 0.82, bright: 0.82, tint: 0x182030, tintAmt: 0.05 });
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
  for (const [x, y] of [[60, 2300], [140, 1990], [230, 1670], [330, 1540], [420, 1620], [470, 1820], [250, 2400], [400, 2350], [80, 2600]]) kit.emit(Math.round(x / S), Math.round(L - y / S), rise, { rate: 1.2, life: [2.5, 4], vy: 14, sx: 10, wf: 0.6, a: 0.85, tint: 1 });
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
    const s = samples[Math.round((0.5 + (k / 40) * 0.48) * 300)];
    parts.push([0, Math.round((s.x + s.nx * s.w * 0.9) / S), Math.round(L - (s.y + s.ny * s.w * 0.9) / S), k * 0.4]);
  }
  kit.wave([glint], parts, { w: 2.2, a0: 0, a1: 1, pw: 6 });
  return {
    strip: img,
    props: kit.pack(),
    meta: { width: W, artScale: S, chunkHeight: L, chunks: 1, length: L, tint: tintTable(L, () => [255, 255, 255]) },
  };
}
