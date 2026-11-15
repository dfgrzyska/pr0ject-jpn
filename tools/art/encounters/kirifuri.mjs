// The arena of encounter 7 (ex7): Hokusai's Kirifuri Waterfall at Mount Kurokami (c. 1832, from A Tour of the
// Waterfalls of the Provinces, long in the public domain), gone weepy: the falls pour in long fingers of water down a
// cliff of angular blue-green rock capped with ochre, but they spring from two great eyes squeezed shut in the
// rock; pilgrims under umbrellas look up at it from a ledge at the foot. The eyes are low in the strip, so they are
// on screen (under the conference table) from the first second; the strip creeps up the cliff to the pines on its
// top. What moves: the water running down every finger, the tears welling along the lids, mist rising off the pool,
// spray where the falls land, ripples, the pilgrims shifting under their umbrellas.
import { Raster, fbm, rng, mix } from '../../lib/raster.mjs';
import { rampColor, grade } from '../nature.mjs';
import { PropKit, tintTable } from '../props.mjs';

export const S = 3;
const W = 180;
const L = 896;
const FW = W * S;
const FH = L * S;
const INK = 0x0e1c22;
const SKY = [0xb8b49a, 0xccc8ae, 0xdedac0, 0xece8d0];
const ROCK = [0x163236, 0x24524e, 0x347468, 0x5e9a84];
const OCHRE = [0x7a5a20, 0xa88434, 0xccaa50, 0xe6cc7c];
const MOSS = [0x1c3a20, 0x2c5a2c, 0x467e38, 0x74a650];
const WATER = [0x3e6ea8, 0x6c9cd2, 0xb0d2ee, 0xf2f9ff];
const POOL = [0x2c5a92, 0x4c80ba, 0x7caad8, 0xc4e0f4];

const Y = (u) => FH - u * S; // a height up the strip (logical) -> a row of the picture
const EYE_U = 236; // the eyes: this far up the strip
const EYE_DX = 112; // and this far either side of its middle (fine px)
const POOL_Y = Y(64); // the pool's surface
const TOP_Y = Y(640); // the cliff's top
const hash = (a, b, s = 1) => {
  let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/** The cliff's sides: stepped, as if cut with a knife. */
const edge = (y, side) => {
  const q = Math.round(y / 46) * 46;
  const v = side < 0 ? 26 + Math.sin(q * 0.004) * 22 + hash(q, 1, 3) * 16 : FW - 26 - Math.sin(q * 0.005 + 1) * 22 - hash(q, 2, 3) * 16;
  return Math.round(v / 6) * 6;
};

/**
 * The rock at (x, y): tall angular shards (cells of a stretched grid, measured city-block, so every edge is straight
 * and at one of a few angles), each a shade off its neighbours and lit from its upper left; ink where two meet.
 */
function shard(x, y) {
  const C = 58;
  const X = x;
  const V = y * 0.4;
  const gx = Math.floor(X / C);
  const gy = Math.floor(V / C);
  let d1 = 1e9;
  let d2 = 1e9;
  let id = 0;
  let cx = 0;
  let cy = 0;
  for (let j = -1; j <= 1; j++)
    for (let i = -1; i <= 1; i++) {
      const px = (gx + i + 0.15 + hash(gx + i, gy + j, 11) * 0.7) * C;
      const py = (gy + j + 0.15 + hash(gx + i, gy + j, 12) * 0.7) * C;
      const d = Math.abs(X - px) + Math.abs(V - py) * 1.3;
      if (d < d1) {
        d2 = d1;
        d1 = d;
        id = (gx + i) * 131 + (gy + j) * 17;
        cx = px;
        cy = py;
      } else if (d < d2) d2 = d;
    }
  return { id, line: d2 - d1 < 2.4, lit: (cx - X + (cy - V) * 1.6) / C, top: (cy - V) / C };
}

export function buildFar() {
  const r = new Raster(FW, 1152);
  for (let y = 0; y < r.h; y++) for (let x = 0; x < FW; x++) r.set(x, y, rampColor(SKY, 0.5 + (fbm(x, y, { seed: 3, scale: 40, periodX: FW, periodY: 1152 }) - 0.5) * 0.3, x, y));
  return r;
}

/** The fingers of water under one eye: [x at the lid, x at the pool, width at the lid, width at the pool, wobble]. */
function fingers(sx) {
  const ex = FW / 2 + sx * EYE_DX;
  const out = [];
  for (let f = 0; f < 6; f++) {
    const x0 = ex - 40 + f * 16;
    out.push({ x0, x1: x0 + (x0 - ex) * 1.5 + sx * 14, w0: 4, w1: 11 + (f % 2) * 3, ph: f * 1.7 + (sx > 0 ? 3 : 0) });
  }
  return out;
}
const fingerAt = (f, y) => {
  const y0 = Y(EYE_U) + 20;
  const t = Math.max(0, Math.min(1, (y - y0) / (POOL_Y - y0)));
  return { x: f.x0 + (f.x1 - f.x0) * t * t * 0.5 + (f.x1 - f.x0) * t * 0.5 + Math.sin(y * 0.012 + f.ph) * 5 * t, w: f.w0 + (f.w1 - f.w0) * t };
};

export function buildMid() {
  const img = new Raster(FW, FH);
  const rand = rng(29);
  const set = (x, y, c, a = 1) => img.set(Math.round(x), Math.round(y), c, a);
  // the sky: old paper, a band of mist-coloured cloud behind the cliff's top
  for (let y = 0; y < FH; y++)
    for (let x = 0; x < FW; x++) {
      let v = 0.55 + (fbm(x * 0.6, y * 0.2, { seed: 4, scale: 10 }) - 0.5) * 0.2;
      if (y < TOP_Y + 200) v += Math.max(0, 0.25 - Math.abs(fbm(x, y * 2.2, { seed: 8, scale: 60 }) - 0.5)) * 0.5; // (streaks of cloud)
      set(x, y, rampColor(SKY, v, x, y));
    }
  // ---- the cliff
  for (let y = TOP_Y; y < FH; y++) {
    const xl = edge(y, -1);
    const xr = edge(y, 1);
    for (let x = xl; x <= xr; x++) {
      const s = shard(x, y);
      if (s.line || x - xl < 2 || xr - x < 2) {
        set(x, y, INK);
        continue;
      }
      const tone = hash(s.id, 5, 2);
      // the tops of some shards are ochre, sunlit; here and there moss
      const ochre = hash(s.id, 6, 2) > 0.72 && s.top > 0.05;
      const moss = !ochre && hash(s.id, 7, 2) > 0.8 && s.top > 0.2;
      const v = 0.3 + tone * 0.34 + s.lit * 0.22 + (fbm(x, y, { seed: 7, scale: 7 }) - 0.5) * 0.14;
      set(x, y, rampColor(ochre ? OCHRE : moss ? MOSS : ROCK, v, x, y));
      // hatching down the shaded side of a shard
      if (s.lit < -0.25 && (x + Math.floor(y / 3)) % 7 === 0 && hash(x, Math.floor(y / 9), 9) > 0.3) set(x, y, INK, 0.45);
    }
  }
  // the cliff's top: ochre turf, a row of pines against the sky
  for (let x = edge(TOP_Y, -1); x <= edge(TOP_Y, 1); x++) {
    const h = 8 + Math.round(fbm(x, 0, { seed: 12, scale: 20 }) * 12);
    for (let j = 0; j < h; j++) set(x, TOP_Y - j, rampColor(OCHRE, 0.7 - j / h * 0.3, x, TOP_Y - j));
    set(x, TOP_Y - h, INK);
  }
  for (let k = 0; k < 9; k++) {
    const px = 60 + k * 52 + Math.round(rand() * 20);
    const base = TOP_Y - 10;
    const h = 70 + Math.round(rand() * 50);
    for (let j = 0; j < h; j++) for (let i = -2; i <= 2; i++) set(px + i + Math.sin(j * 0.05 + k) * 4, base - j, 0x3a2a1c);
    // flat tiers of needles, as in the prints
    for (let tier = 0; tier < 4; tier++) {
      const ty = base - h * (0.45 + tier * 0.18);
      const tw = 30 - tier * 5 + rand() * 8;
      const tx = px + Math.sin((base - ty) * 0.05 + k) * 4 + (tier % 2 ? 8 : -8);
      for (let j = -7; j <= 5; j++) for (let i = -tw; i <= tw; i++) if ((i / tw) ** 2 + (j / 7) ** 2 < 1) set(tx + i, ty + j, j > 3 ? INK : rampColor(MOSS, 0.35 + (-j / 7) * 0.4 + (hash(tx + i, ty + j, 4) - 0.5) * 0.3, tx + i, ty + j));
    }
  }
  // ---- the face in the rock: brows of dark scrub (their inner ends raised: misery), lids squeezed shut
  const ey = Y(EYE_U);
  for (const sx of [-1, 1]) {
    const ex = FW / 2 + sx * EYE_DX;
    // the brow: a ledge of bushes
    for (let k = -56; k <= 56; k++) {
      const by = ey - 86 + k * sx * 0.3;
      const bump = Math.round(Math.abs(Math.sin(k * 0.22)) * 7 + hash(k, sx, 14) * 3);
      for (let w = -bump; w < 13; w++) set(ex + k, by + w, w > 10 || w === -bump ? INK : rampColor(MOSS, 0.2 + (1 - (w + bump) / (13 + bump)) * 0.55, ex + k, by + w));
    }
    // the socket: the rock darkened round the eye
    for (let y = -46; y <= 36; y++) for (let x = -70; x <= 70; x++) if ((x / 70) ** 2 + ((y + 4) / 42) ** 2 < 1 && (x + y * 2) % 4 === 0) set(ex + x, ey + y, INK, 0.3);
    // the lid: a thick arch, lashes turned down from it, a swollen bag under it catching the light
    for (let k = -56; k <= 56; k++) {
      const ly = ey + 20 - Math.sqrt(Math.max(0, 1 - (k / 58) ** 2)) * 26;
      for (let w = 0; w < 8; w++) set(ex + k, ly + w, INK);
      for (let w = 8; w < 12; w++) set(ex + k, ly + w, rampColor(WATER, 0.75, ex + k, ly + w)); // tears welling under it
      if (k % 13 === 0 && Math.abs(k) < 52) for (let j = 0; j < 12; j++) for (let w = 0; w < 3; w++) set(ex + k + w + (j * k) / 70, ly + 10 + j, INK);
      const bag = ey + 34 + Math.sqrt(Math.max(0, 1 - (k / 58) ** 2)) * 10;
      if (Math.abs(k) < 50) for (let w = 0; w < 3; w++) set(ex + k, bag + w, rampColor(ROCK, 0.95, ex + k, bag + w));
    }
  }
  // ---- the falls: long fingers of water from under each lid, widening down to the pool; ink at their edges, white
  // threads along them (Hokusai's water is combed)
  const falls = [...fingers(-1), ...fingers(1)];
  for (const f of falls) {
    for (let y = ey + 22; y < POOL_Y + 6; y++) {
      const { x, w } = fingerAt(f, y);
      for (let i = -w - 2; i <= w + 2; i++) {
        const q = Math.abs(i) / w;
        if (q > 1) {
          set(x + i, y, 0x1e3e6e);
          continue;
        }
        const thread = Math.abs(Math.sin((i / w) * 4.2 + f.ph)) > 0.86;
        set(x + i, y, rampColor(WATER, (thread ? 0.95 : 0.5) + (1 - q) * 0.18 + Math.sin(y * 0.07 + f.ph * 3 + i * 0.3) * 0.06, Math.round(x + i), y));
      }
    }
  }
  // ---- the pool: ripples round where each finger lands, rings of foam; the far bank's rocks
  for (let y = POOL_Y; y < FH; y++)
    for (let x = 0; x < FW; x++) {
      const d = (y - POOL_Y) / (FH - POOL_Y);
      let v = 0.42 + d * 0.1 + (fbm(x * 0.5, y * 1.6, { seed: 9, scale: 9 }) - 0.5) * 0.35;
      if (Math.abs(Math.sin(y * 0.33 + Math.sin(x * 0.03) * 2.4)) > 0.95) v += 0.3; // long ripples
      set(x, y, rampColor(POOL, v, x, y));
    }
  for (const f of falls) {
    const { x, w } = fingerAt(f, POOL_Y);
    for (let a = 0; a < Math.PI * 2; a += 0.02) {
      for (const [r, c] of [[w + 8, 0xf2f9ff], [w + 15, 0xb0d2ee], [w + 24, 0x7caad8]]) set(x + Math.cos(a) * r * 1.5, POOL_Y + 9 + Math.sin(a) * r * 0.42, c);
    }
    for (let k = 0; k < 26; k++) {
      const a = rand() * Math.PI * 2;
      const r = rand() * (w + 6);
      img.disc(Math.round(x + Math.cos(a) * r * 1.4), Math.round(POOL_Y + 6 + Math.sin(a) * r * 0.5), 2 + rand() * 2.5, k % 3 ? 0xf2f9ff : 0xb0d2ee);
    }
  }
  // ---- the ledge at the foot, lower left: turf and stones, where the pilgrims stand (they are moving parts, below)
  const ledge = (x) => POOL_Y + 34 + Math.round(Math.sin(x * 0.02) * 8 + (x > 150 ? (x - 150) * 0.7 : 0));
  for (let x = 0; x < 250; x++) {
    const top = ledge(x);
    for (let y = top; y < FH; y++) {
      const v = 0.75 - (y - top) / 200 + (fbm(x, y, { seed: 21, scale: 6 }) - 0.5) * 0.3;
      set(x, y, y - top < 2 ? INK : rampColor(y - top < 26 ? MOSS : OCHRE, v, x, y));
    }
    if (x % 9 === 0) for (let j = 0; j < 7; j++) set(x + j * 0.4, top - j, 0x2c5a2c); // grass
  }
  for (const [bx, by, r] of [[236, POOL_Y + 78, 20], [300, POOL_Y + 120, 14], [470, POOL_Y + 96, 24], [520, POOL_Y + 140, 16]]) {
    for (let y = -r; y <= r * 0.7; y++) for (let x = -r * 1.3; x <= r * 1.3; x++) if (Math.abs(x) / 1.3 + Math.abs(y) * 1.2 < r) set(bx + x, by + y, Math.abs(x) / 1.3 + Math.abs(y) * 1.2 > r - 2.5 ? INK : rampColor(ROCK, 0.5 - (x + y) / (r * 3), bx + x, by + y));
  }
  // every stage's middle layer is muted a little, so bullets stand out
  grade(img, { sat: 0.82, bright: 0.68, tint: 0x203040, tintAmt: 0.08 });

  // ---------------------------------------------------------------- the moving parts
  const kit = new PropKit(1832, { artScale: S });
  const lx = (x) => Math.round((x / S) * 10) / 10;
  const lu = (y) => Math.round(((FH - y) / S) * 10) / 10;
  // the water running down each finger: bright streaks, one after another
  const streak = (len, w, a) => {
    const r = new Raster(w + 2, len);
    for (let y = 0; y < len; y++) for (let x = 0; x < w; x++) r.set(x + 1, y, 0xf2f9ff, a * Math.sin((y / len) * Math.PI) * (x === 0 || x === w - 1 ? 0.5 : 1));
    return kit.frame(r);
  };
  const streaks = [streak(30, 3, 0.85), streak(42, 2, 0.7), streak(22, 4, 0.75)];
  for (const [n, f] of falls.entries()) {
    const pts = [];
    for (let k = 0; k <= 6; k++) {
      const y = ey + 26 + ((POOL_Y - ey - 26) * k) / 6;
      pts.push([lx(fingerAt(f, y).x + ((n * 7) % 5) - 2), lu(y)]);
    }
    kit.path(pts, [streaks[n % 3]], { sp: 62 + (n % 4) * 9, n: 7, gap: 24 + (n % 3) * 3, mode: 'wrap', turn: 'none', a: 0.9, fx: 1 });
    // a second, thinner thread beside it, out of step
    kit.path(pts.map(([x, u]) => [x + (n % 2 ? 2 : -2), u]), [streaks[(n + 1) % 3]], { sp: 84 + (n % 3) * 8, n: 4, gap: 41, mode: 'wrap', turn: 'none', a: 0.7, fx: 1 });
  }
  // tears welling along the lids: glints running from the inner corner out
  const glint = (() => {
    const r = new Raster(9, 9);
    for (let i = -4; i <= 4; i++) {
      r.set(4 + i, 4, 0xffffff, 1 - Math.abs(i) / 5);
      r.set(4, 4 + i, 0xffffff, 1 - Math.abs(i) / 5);
    }
    return kit.frame(r);
  })();
  const lids = [];
  for (const sx of [-1, 1])
    for (let k = -5; k <= 5; k++) {
      const x = FW / 2 + sx * EYE_DX + sx * k * 10;
      const y = ey + 30 - Math.sqrt(Math.max(0, 1 - ((k * 10) / 58) ** 2)) * 26;
      lids.push([0, lx(x) - 1.5, lu(y) + 1.5, (k + 5) * 0.5]);
    }
  kit.wave([glint], lids, { w: 3, a0: 0, a1: 1, pw: 5 });
  // big drops falling from the outer corners of the eyes, where no finger of the falls runs
  const drop = (() => {
    const r = new Raster(9, 15);
    for (let y = 0; y < 15; y++) for (let x = 0; x < 9; x++) if (((x - 4) / (1 + (y / 15) * 3.2)) ** 2 + ((y - 10) / 5) ** 2 < 1 || (Math.abs(x - 4) < 1 && y < 10)) r.set(x, y, y > 11 || x < 3 ? 0xb0d2ee : 0xf2f9ff, 0.95);
    return kit.frame(r);
  })();
  for (const sx of [-1, 1]) {
    const x = FW / 2 + sx * (EYE_DX + 62 * sx * sx);
    kit.path([[lx(FW / 2 + sx * (EYE_DX + 60)), lu(ey + 24)], [lx(FW / 2 + sx * (EYE_DX + 66)), lu(ey + 200)]], [drop], { sp: 46, n: 3, gap: 26, mode: 'wrap', turn: 'none', a: 0.9, fx: 1 });
    void x;
  }
  // mist rising off the pool where the falls land
  const cloud = (r0, seed) => {
    const r = new Raster(r0 * 2 + 1, r0 * 2 + 1);
    for (let y = -r0; y <= r0; y++)
      for (let x = -r0; x <= r0; x++) {
        const d = Math.hypot(x, y * 1.25) / r0 + (fbm(x + seed * 31, y, { seed, scale: 5 }) - 0.5) * 0.5;
        if (d < 1) r.set(x + r0, y + r0, 0xf2f6f8, Math.min(0.6, (1 - d) * 0.9));
      }
    return kit.frame(r);
  };
  const mist = [[cloud(9, 1), cloud(9, 2)], [cloud(15, 3), cloud(15, 4)], [cloud(22, 5), cloud(22, 6)]];
  for (const sx of [-1, 1]) for (const dx of [-60, 0, 62]) kit.emit(lx(FW / 2 + sx * (EYE_DX + 20) + dx), lu(POOL_Y + 4), mist, { rate: 0.9, life: [3, 4.5], vy: 9, sx: 9, wf: 0.5, a: 0.55, tint: 1 });
  // spray where the water lands: splashes going off all along the foot of the falls
  const splash = (k) => {
    const r = new Raster(27, 18);
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (0.15 + (i / 6) * 0.7);
      const d = 3 + k * 4;
      r.disc(Math.round(13 - Math.cos(a) * d * 1.4), Math.round(16 - Math.sin(a) * d), k === 2 ? 1 : 1.6, 0xf2f9ff, k === 2 ? 0.6 : 0.95);
    }
    return kit.frame(r);
  };
  kit.spot([[lx(FW / 2 - EYE_DX - 110), lu(POOL_Y) + 3, 86, 6], [lx(FW / 2 + EYE_DX - 150), lu(POOL_Y) + 3, 86, 6]], [splash(0), splash(1), splash(2)], { rate: 9, fps: 10, a: 0.9 });
  // ripples drifting across the pool
  const ripple = (() => {
    const r = new Raster(33, 5);
    for (let x = 0; x < 33; x++) r.set(x, 2 + Math.round(Math.sin(x * 0.4) * 1.2), 0xf2f9ff, 0.8 * Math.sin((x / 32) * Math.PI));
    return kit.frame(r);
  })();
  const rip = [];
  for (let k = 0; k < 22; k++) rip.push([0, 84 + Math.round(rand() * 86), 4 + Math.round(rand() * 50), k * 0.7]);
  kit.wave([ripple], rip, { w: 1.3, a0: 0, a1: 0.9, pw: 3 });
  // the pilgrims on the ledge, looking up: straw hats, travelling cloaks, paper umbrellas against the spray; each
  // shifts his weight and tips his umbrella now and then
  const pilgrim = (cloak, brolly, f, point) => {
    const r = new Raster(48, 66);
    const px = (x, y, c) => r.set(Math.round(x), Math.round(y), c);
    const tip = f ? 2 : 0;
    // the umbrella: a shallow cone of oiled paper, ribs, held on a pole
    for (let y = 0; y < 15; y++) for (let x = -22; x <= 22; x++) if (Math.abs(x) <= (y + 1) * 1.5) px(24 + x + tip, 4 + y + (x * tip) / 22, y > 12 ? INK : (Math.round(x / (y + 1) * 3.4) + 20) % 2 ? brolly : mix(brolly, 0x101010, 0.25));
    for (let y = 19; y < 44; y++) px(34 + tip * 0.5, y, 0x3a2a1c);
    // the hat (seen a little from behind), the head tipped back, the cloak, leggings, sandals
    for (let x = -9; x <= 9; x++) for (let y = 0; y < 5; y++) if (Math.abs(x) <= 3 + y * 1.6) px(22 + x, 24 + y - f, y === 4 ? INK : 0xd8b860);
    for (let y = 0; y < 5; y++) for (let x = -3; x <= 3; x++) px(22 + x, 29 + y - f, 0xe0b890);
    for (let y = 34; y < 54; y++) for (let x = -7 - (y - 34) * 0.25; x <= 7 + (y - 34) * 0.25; x++) px(22 + x, y, Math.abs(x) > 6 + (y - 34) * 0.25 - 1 ? INK : (y + Math.round(x)) % 6 === 0 ? mix(cloak, 0xffffff, 0.25) : cloak);
    for (const sx of [-1, 1]) for (let y = 54; y < 64; y++) for (let x = 0; x < 3; x++) px(22 + sx * 4 + x - 1, y, y > 61 ? 0x3a2a1c : 0xe8e4d8);
    // one arm to the umbrella's pole, the other (for some) pointing up at the falls
    for (let k = 0; k < 9; k++) px(27 + k * 0.8, 40 - k * 0.4, cloak);
    if (point) for (let k = 0; k < 12; k++) for (let w = 0; w < 2; w++) px(16 - k * 0.7, 38 - k * (f ? 1.1 : 0.9) + w, k > 9 ? 0xe0b890 : cloak);
    return kit.frame(r);
  };
  const people = [[14, 0x2a3a6a, 0xc03428, true], [38, 0x6a3a2a, 0xd8b860, false], [58, 0x2a4a3a, 0x3a5a9a, true], [79, 0x4a3a5a, 0xd8c8a0, false]];
  for (const [x, cloak, brolly, point] of people) {
    const top = lu(ledge(x * S + 22)) + 20;
    kit.loop(x - 8, top, [pilgrim(cloak, brolly, 0, point), pilgrim(cloak, brolly, 1, point)], { fps: 1.1 + (x % 3) * 0.2, seq: [0, 0, 0, 1, 1, 0, 1, 1] });
  }
  return {
    strip: img,
    props: kit.pack(),
    meta: { width: W, artScale: S, chunkHeight: L, chunks: 1, length: L, tint: tintTable(L, () => [173, 173, 180]) },
  };
}
