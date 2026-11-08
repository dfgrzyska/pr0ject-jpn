// Middle layer of stage 1: a flight over Kyoto, cut into 512px chunks.
// Gion (Hanamikōji's machiya, maiko and rickshaws, the Yasaka pagoda, Yasaka shrine's west gate) →
// the Kamo river (turtle stepping stones, Pontochō's summer terraces, couples along the bank) →
// the approach to Fushimi Inari and the shrine (Rōmon, honden, foxes) → the Senbon torii tunnels on the
// ridge → Arashiyama (the bamboo grove, Nonomiya's black torii, Togetsukyō bridge over the Katsura) →
// Kinkaku-ji, the Golden Pavilion mirrored in its pond → Ryōan-ji's rock garden → Kiyomizu-dera
// (Sannenzaka, the Niōmon, the three-storey pagoda, the great wooden stage on its lattice of pillars,
// Otowa falls) → the Daimonji mountain at dusk with the 大 burning on its slope.
//
// Coordinates: `u` = distance from the bottom of the strip (stage start), strip y = L - u.
// At time t the top edge of the screen shows u = anchor + mid * t (see src/data/stage1.json).
// The ridge sections are transparent beside the ridge: the far layer (the valley) shows through.
//
// Live (see ../props.mjs): the Kamo and Katsura flow with rafts of fallen petals on them, boats row below
// Togetsukyō, gusts of wind sweep the bamboo grove, the Golden Pavilion's reflection ripples and koi swim in
// its pond, Otowa's three streams run, rickshaws pull through Gion and the bamboo grove, maiko under red
// umbrellas and tourists stroll Hanamikōji, pilgrims climb through the torii tunnels, a fox slips between
// the stone monuments under shafts of sunlight, kites wheel over the Kamo, strollers in kimono walk the
// bamboo path under shafts of light, a monk rakes Ryōan-ji's gravel, the nobori banners flutter, and the
// fires of the 大 flicker and smoke while the fire-keepers carry torches up the path and embers fly.
// Hanami picnics on blue tarps under the sakura at Arashiyama and below Kiyomizu; Tenryū-ji's Sōgenchi
// garden where the bamboo grove ends.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Raster, fbm, rng, bayer, scaleColor, rgb, mix } from '../../lib/raster.mjs';
import { crownPixels, grade, rampColor } from '../nature.mjs';
import { PropKit, puff, tintTable } from '../props.mjs';
import { HiCanvas, hashPx } from '../hires.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export const W = 180;
export const S = 3; // fine pixels per logical one: the strip is drawn 540 px wide, laid out in the game's 180
export const CHUNK = 512;
export const CHUNKS = 14;
export const L = CHUNK * CHUNKS;

const GION = [0, 540];
const KAMO = [540, 650];
const SANDO = [650, 1130];
const SHRINE = [1130, 1830];
const TORII = [1830, 2700];
const ARASHI = [2700, 3500];
const KINKAKU = [3500, 4400];
const RYOAN = [4400, 5000];
const KIYOMIZU = [5000, 6300];

// ---- palette
const C = {
  K: 0x1c1418, // lacquer black
  R1: 0xe2421f, // vermilion lit
  R2: 0xb83018, // vermilion shade
  R3: 0x7e2014,
  IN: 0x22150f, // tunnel interior
  gold: 0xe2aa32,
  goldHi: 0xfff0a0,
  white: 0xe9e2d0,
  stone: [0x4e4b50, 0x6c6870, 0x8a8790, 0xaaa7ae],
  gravel: [0x5c5648, 0x6d6656, 0x7e7765, 0x908874],
  whiteGravel: [0xa8a69c, 0xbab8ae, 0xcac8be, 0xdad8ce],
  dirt: [0x3a2e22, 0x4a3b2a, 0x5a4a35, 0x6b5a42],
  floor: [0x1d2919, 0x263421, 0x314029, 0x3e4d30],
  moss: [0x2a4a24, 0x345a2a, 0x426a32, 0x547a3c],
  bambooFloor: [0x2a3a1e, 0x34482a, 0x405432, 0x4e6238],
  water: [0x16323e, 0x1e4250, 0x285464, 0x6aa2ae],
  river: [0x1e4a54, 0x285a64, 0x346a72, 0x7ab0b8],
  pond: [0x1c3a34, 0x244a40, 0x2e584c, 0x5a8a7a],
  roofBark: [0x2b2224, 0x3d3033, 0x544246, 0x6e5a5c],
  roofTile: [0x2a303c, 0x3c4452, 0x515b6c, 0x6a7588],
  roofTileDark: [0x262426, 0x37333a, 0x4a454e, 0x605a64],
  wood: [0x2e2018, 0x46301f, 0x5e4229, 0x7a5835],
  hinoki: [0x8a6a44, 0xa07c50, 0xb8925e, 0xccaa74],
  earthWall: [0x8a6a44, 0x9a7a52, 0xaa8a60],
  warm: 0xffd27a,
};
const KIMONO = [0xe86a9a, 0x9a5ac8, 0xd83a3a, 0x3a8ac8, 0xf0a040, 0x5aaa6a, 0xf0d0e0];

const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function buildMid() {
  const stage = JSON.parse(readFileSync(join(root, 'src', 'data', 'stage1.json'), 'utf8'));
  const { mid: V, anchor } = stage.scroll;
  let img = new HiCanvas(W, L, S);
  const FY = (u) => Math.round((L - u) * S); // fine strip row of u
  const rand = rng(2026);
  const Y = (u) => L - u;
  const U = (y) => L - y;
  const reserved = new Uint8Array(W * L);
  const isRes = (x, y) => {
    x = Math.floor(x);
    y = Math.floor(y);
    return x >= 0 && x < W && y >= 0 && y < L && reserved[y * W + x];
  };
  const anyRes = (x0, y0, w, h) => {
    for (let y = Math.floor(y0); y < y0 + h; y++) for (let x = Math.max(0, Math.floor(x0)); x < Math.min(W, x0 + w); x++) if (isRes(x, y)) return true;
    return false;
  };
  // what actually stands on the ground (buildings, paths, water, pads), not counting whole courtyards kept
  // clear of the random trees (ground = true): where the extra detail can still go
  const occ = new Uint8Array(W * L);
  const laneMargin = new Uint8Array(W * L);
  const reserveRect = (x0, y0, w, h, ground = false) => {
    for (let y = Math.max(0, Math.floor(y0)); y < Math.min(L, y0 + h); y++)
      for (let x = Math.max(0, Math.floor(x0)); x < Math.min(W, x0 + w); x++) {
        reserved[y * W + x] = 1;
        if (!ground) occ[y * W + x] = 1;
      }
  };
  const reserveDisc = (cx, cy, r) => {
    for (let y = Math.floor(cy - r); y <= cy + r; y++)
      for (let x = Math.floor(cx - r); x <= cx + r; x++)
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r && x >= 0 && x < W && y >= 0 && y < L) reserved[y * W + x] = occ[y * W + x] = 1;
  };
  const objects = []; // { y: sort key (strip y of the base), draw(), shadow?() }
  const lights = []; // drawn after the grade: lanterns, fires
  const glow = (x, y, c, a = 1) => lights.push([Math.round(x), Math.round(y), c, a]);
  const lightsFine = []; // the same, single fine pixels: lamp panes, flames, sparks
  const glowPx = (X, Yy, c, a = 1) => lightsFine.push([Math.round(X), Math.round(Yy), c, a]);
  const kit = new PropKit(2036, { artScale: S }); // the moving parts
  const frame0 = kit.frame.bind(kit);
  kit.frame = (r, name) => frame0(r.hi ?? r, name); // (frames are drawn on HiCanvases)
  const canopy = new Uint8Array(W * S * L * S); // bamboo leaves, fine pixels (the gusts brighten them)
  const canopyAt = (X, Y) => X >= 0 && X < W * S && Y >= 0 && Y < L * S && canopy[Y * W * S + X];
  const markCanopy = (X, Y) => {
    if (X >= 0 && X < W * S && Y >= 0 && Y < L * S) canopy[Y * W * S + X] = 1;
  };
  let ripple = null; // where the Golden Pavilion is mirrored in its pond
  const pyreKeepers = []; // the 大's pyres, for the fire-keepers standing by them
  // for the live effects at the end: the cherry crowns (and their blossom, fine pixels, for the gusts), the
  // lanterns (they flicker), the townhouses' kitchens (they smoke)
  const sakuraCrowns = [];
  const bloom = new Uint8Array(W * S * L * S);
  const crownMask = new Uint8Array(W * S * L * S); // (the crowns of the trees, each its own 1..15: the wind runs through them)
  const crownHash = new Uint8Array(W * S * L * S); // (what each crown drew there, to know if something was drawn over it)
  const lamps = [];
  const kitchens = [];
  /** Draw with the stage's own helpers into a frame at (x0, y0), graded like its place on the strip, lights on top. */
  let capturing = 0; // (inside a frame: its lanterns move with it, they are no fixed lamps)
  const capture = (x0, y0, w, h, draw, u = U(y0 + h / 2)) => {
    const keep = img;
    capturing++;
    const nl = lights.length;
    const nf = lightsFine.length;
    img = new HiCanvas(w, h, S, x0, y0);
    draw();
    capturing--;
    const out = img;
    img = keep;
    const lit = lights.splice(nl);
    const litFine = lightsFine.splice(nf);
    gradeAt(out, u);
    for (const [x, y, c, a] of lit) out.light(x, y, c, a);
    for (const [X, Yy, c, a] of litFine) out.px(X, Yy, c, a);
    return kit.frame(out);
  };

  // turret pads come from the wave file: keep them clear of everything
  const pads = stage.waves.filter((w) => w.type === 'turret').map((w) => ({ x: w.x, u: anchor + V * w.t + 10 }));
  for (const p of pads) reserveDisc(p.x, Y(p.u), 13);

  // ------------------------------------------------------------ layout: the ridge sections
  const ridgeAmt = (u) => smooth(1820, 1980, u) * (1 - smooth(2620, 2740, u));
  const pathX = (u) => {
    const s = ridgeAmt(u);
    const k = u - 1820;
    return 90 + s * (20 * Math.sin(k / 230) + 9 * Math.sin(k / 83 + 1.1));
  };
  const widen = () => 0;
  /** The path through the bamboo grove (from where the ridge path comes in). */
  const groveX = (u) => 90 + 10 * Math.sin((u - ARASHI[0]) / 80) - (90 - pathX(ARASHI[0])) * (1 - smooth(ARASHI[0], ARASHI[0] + 80, u));
  // glades in the grove, where a culm has fallen and let the light in: [centre x, half width, u of the far edge,
  // u of the near edge]. A culm is far taller than a glade is deep, so to see the ground the culms standing in
  // front of it have to go as well
  const GLADES = [[36, 14, 2860, 2790], [58, 11, 3010, 2950], [24, 13, 3110, 3050], [140, 14, 2820, 2760], [156, 13, 3100, 3040], [124, 11, 3220, 3165]];
  /** No culm grows here: in a glade, or where the grove thins (it stands in clumps, dark lanes between them). */
  const groveOpen = (x, y) => {
    const u = L - y;
    const n = (fbm(x, u, { seed: 1231, scale: 9, octaves: 2 }) - 0.5) * 8;
    for (const [gx, rx, u1, u0] of GLADES) if (Math.abs(x - gx) < rx + n && u < u1 + n && u > u0 + n) return true;
    return fbm(x, u, { seed: 1233, scale: 7, octaves: 2 }) < 0.4;
  };
  const ridgeEdges = (u) => {
    const s = ridgeAmt(u);
    const rc = pathX(u) * 0.55 + 90 * 0.45;
    const hw = 50 + 12 * Math.sin(u / 170) + widen(u);
    const nl = (fbm(0, u, { seed: 41, scale: 24, octaves: 3 }) - 0.5) * 16;
    const nr = (fbm(7, u, { seed: 43, scale: 24, octaves: 3 }) - 0.5) * 16;
    return [(rc - hw + nl) * s + -20 * (1 - s), (rc + hw + nr) * s + 200 * (1 - s)];
  };

  // ------------------------------------------------------------ 1. terrain base
  // (fine: undergrowth in leaf-sized flecks over the broad patches, the odd fern or stone, the slopes darker
  // where the ridge falls away)
  for (let FYr = 0; FYr < L * S; FYr++) {
    const y = (FYr + 0.5) / S;
    const u = L - y;
    const [l, r] = ridgeEdges(u);
    for (let FXr = 0; FXr < W * S; FXr++) {
      const x = (FXr + 0.5) / S;
      if (x < l || x > r) continue;
      const v = fbm(x, y, { seed: 12, scale: 16, octaves: 3 }) + (fbm(FXr, FYr, { seed: 13, scale: 3, octaves: 2 }) - 0.5) * 0.34;
      let c = rampColor(C.floor, v, FXr, FYr);
      const fleck = hashPx(FXr, FYr, 14);
      if (fleck < 0.012) c = C.floor[3];
      else if (fleck > 0.994) c = C.stone[1];
      const dl = x - l;
      const dr = r - x;
      if (dl < 6) c = scaleColor(c, 0.62 + dl * 0.06);
      if (dr < 7) c = scaleColor(c, 0.5 + dr * 0.07);
      img.px(FXr, FYr, c);
    }
    for (let d = 1; d <= 7 * S; d++) {
      const xr = Math.floor(r * S) + d;
      if (xr >= 0 && xr < W * S) img.px(xr, FYr, 0x05070a, 0.5 * (1 - d / (8 * S)));
      const xl = Math.ceil(l * S) - d;
      if (d <= 3 * S && xl >= 0 && xl < W * S) img.px(xl, FYr, 0x05070a, 0.3 * (1 - d / (4 * S)));
    }
  }

  // ------------------------------------------------------------ helpers: ground
  // (all in fine pixels: grit and pebbles in the gravel, every flagstone its own tone with a lit top edge,
  // hairline joints with moss in them, steps with lit nosings and shadowed risers)
  const fillGround = (x0, y0, w, h, ramp, seed = 3, scale = 6) =>
    img.fine(x0, y0, w, h, (FXr, FYr, x, y) => {
      if (x < 0 || x >= W || y < 0 || y >= L || !img.alphaPx(FXr, FYr)) return null;
      const v = fbm(x, y, { seed, scale, octaves: 2 }) + (fbm(FXr, FYr, { seed: seed + 50, scale: 3 }) - 0.5) * 0.3;
      const g = hashPx(FXr, FYr, seed);
      return g < 0.02 ? ramp[ramp.length - 1] : g > 0.985 ? ramp[0] : rampColor(ramp, v, FXr, FYr);
    });
  const flag = (ramp, FXr, FYr, PX, PY, rowH = 15, colW = 24) => {
    const row = Math.floor(PY / rowH);
    const inRow = PY - row * rowH;
    const sx = PX + (row % 2) * (colW >> 1) + ((row * 7) % 5);
    const col = Math.floor(sx / colW);
    const inCol = sx - col * colW;
    if (inRow === rowH - 1 || inCol === colW - 1) return hashPx(FXr >> 1, FYr >> 1, 31) < 0.25 ? 0x34482c : scaleColor(ramp[0], 0.85);
    const tone = hashPx(col, row, 5);
    if (inRow === 0 || inCol === 0) return rampColor(ramp, 0.75 + tone * 0.2, FXr, FYr);
    if (inRow === rowH - 2 || inCol === colW - 2) return rampColor(ramp, 0.12 + tone * 0.2, FXr, FYr);
    return rampColor(ramp, 0.3 + tone * 0.38 + (hashPx(FXr, FYr, 9) - 0.5) * 0.16, FXr, FYr);
  };
  const paving = (x0, y0, w, h, ramp = C.stone) =>
    img.fine(x0, y0, w, h, (FXr, FYr) => (img.alphaPx(FXr, FYr) ? flag(ramp, FXr, FYr, FXr - Math.floor(x0 * S), FYr - Math.floor(y0 * S)) : null));
  const gravelPx = (FXr, FYr, seed = 8) => {
    const n = fbm(FXr / S, FYr / S, { seed, scale: 4, octaves: 2 }) + (fbm(FXr, FYr, { seed: seed + 40, scale: 2 }) - 0.5) * 0.35;
    const g = hashPx(FXr, FYr, seed);
    return g < 0.04 ? C.gravel[3] : g > 0.975 ? C.gravel[0] : rampColor(C.gravel, 0.22 + n * 0.62, FXr, FYr);
  };
  // vertical path following a centre function, gravel or stairs
  const path = (u0, u1, cxf, hw, style = 'gravel') => {
    for (let FYr = Y(u1) * S; FYr < (Y(u0) + 1) * S; FYr++) {
      const u = L - FYr / S;
      const cx = cxf(Math.max(u0, Math.min(u1, u)));
      const k = Math.round((u - u0) * S);
      for (let FXr = Math.floor((cx - hw) * S); FXr <= (cx + hw) * S; FXr++) {
        if (!img.alphaPx(FXr, FYr)) continue;
        const a = Math.abs((FXr + 0.5) / S - cx);
        let c = gravelPx(FXr, FYr);
        if (style === 'stairs') {
          const s = ((k % 12) + 12) % 12;
          c = s === 0 || s === 1 ? (s === 0 ? 0x2a282c : C.stone[0]) : s === 11 ? C.stone[3] : flag(C.stone, FXr, FYr, FXr - Math.floor((cx - hw) * S), s - 2, 9, 21 + (Math.floor(k / 12) % 3) * 4);
        }
        if (a > hw - 0.7) c = scaleColor(c, 0.62);
        else if (a > hw - 1.2) c = scaleColor(c, 0.8);
        img.px(FXr, FYr, c);
      }
    }
    for (let u = u0; u <= u1; u++) reserveRect(cxf(u) - hw - 3, Y(u), hw * 2 + 7, 1);
  };
  // horizontal gravel walk over x0..x1, rows u0..u1 (the side ways off the paths to the halls)
  const walk = (x0, x1, u0, u1) => {
    img.fine(x0, Y(u1), x1 - x0, u1 - u0 + 1, (FXr, FYr) => {
      if (!img.alphaPx(FXr, FYr)) return null;
      const e = Math.min(FYr - Y(u1) * S, (Y(u0) + 1) * S - 1 - FYr);
      return e < 2 ? scaleColor(gravelPx(FXr, FYr), e ? 0.8 : 0.62) : gravelPx(FXr, FYr);
    });
    reserveRect(x0 - 3, Y(u1 + 3), x1 - x0 + 6, u1 - u0 + 7);
  };
  /** A body of water: an irregular ellipse filled from a ramp, rimmed with stones. */
  const pondAt = (cx, cu, rx, ry, ramp, seed, rim = C.stone) => {
    const cy = Y(cu);
    const eAt = (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + (fbm(x, y, { seed, scale: 12 }) - 0.5) * 0.3;
    for (let y = Math.floor(cy - ry - 3); y <= cy + ry + 3; y++)
      for (let x = Math.floor(cx - rx - 3); x <= cx + rx + 3; x++) if (x >= 0 && x < W && y >= 0 && y < L && eAt(x + 0.5, y + 0.5) < 1.14) reserved[y * W + x] = occ[y * W + x] = 1;
    // the water: dark under the rim, ripples catching the sky; the rim: rounded stones with gaps between them
    img.fine(cx - rx - 3, cy - ry - 3, rx * 2 + 7, ry * 2 + 7, (FXr, FYr, x, y) => {
      if (x < 0 || x >= W || y < 0 || y >= L) return null;
      const e = eAt(x, y);
      if (e >= 1.14) return null;
      if (e > 1) {
        const s = fbm(FXr, FYr, { seed: seed + 3, scale: 2.6 });
        return s < 0.32 ? scaleColor(rim[0], 0.7) : rampColor(rim, 0.15 + s * 0.85, FXr, FYr);
      }
      const n = fbm(x * 0.7, y, { seed: seed + 1, scale: 9, octaves: 2 });
      const wave = fbm(FXr * 0.35, FYr * 1.4, { seed: seed + 7, scale: 4 });
      if (wave > 0.7 && n > 0.45) return ramp[3];
      if (e > 0.88) return scaleColor(rampColor(ramp, 0.05 + n * 0.3, FXr, FYr), 0.8);
      return rampColor(ramp, 0.08 + n * 0.5 + (wave - 0.5) * 0.2, FXr, FYr);
    });
  };

  // ------------------------------------------------------------ helpers: objects
  const shadowRect = (x, y, w, h, f = 0.55) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) img.tint(x + i, y + j, f);
  };
  // (the objects below are drawn in fine pixels; X, Y in them are fine coordinates of the strip: logical x S)
  const shadowPx = (X, Y, w, h, f = 0.55) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) img.tintPx(X + i, Y + j, f);
  };
  /** A written character as seen from afar: a few strokes in an s x s box at fine (X, Y), drawn by put. */
  const glyph = (X, Yy, s, c, r, put = (gx, gy, gc) => img.px(gx, gy, gc)) => {
    for (let k = 0; k < s; k++) {
      put(X + k, Yy, c);
      if (r() < 0.5) put(X + k, Yy + s - 1, c);
    }
    const vx = X + 1 + Math.floor(r() * Math.max(1, s - 2));
    for (let k = 0; k < s; k++) put(vx, Yy + k, c);
    if (r() < 0.6) for (let k = 0; k < s - 1; k++) put(X + k, Yy + Math.floor(s / 2), c);
  };
  /** A boulder of radius R at fine (CX, CY): lit from the top left, lichen on it, its shadow on the ground. */
  const boulderPx = (CX, CY, R) => {
    for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) if (i * i + j * j <= R * R) img.px(CX + i + 3, CY + j + 3, 0x14201c, 0.5);
    for (let j = -R; j <= R; j++)
      for (let i = -R; i <= R; i++) {
        const d = Math.hypot(i, j * 1.1) / R;
        if (d > 1 + (hashPx(CX + i, CY + j, 81) - 0.5) * 0.25) continue;
        const lit = (-i - j) / (R * 1.4) + 0.5;
        let c = rampColor(C.stone, lit, CX + i, CY + j);
        if (hashPx(CX + i, CY + j, 82) < 0.08) c = 0x7a8a5a;
        img.px(CX + i, CY + j, c);
      }
  };
  /** Shading across a round post or pillar w fine pixels wide: lit on the left, a highlight, dark on the right. */
  const roundShade = (lit, mid, dark, i, w) => {
    const t = w <= 1 ? 0.5 : i / (w - 1);
    return t < 0.18 ? mid : t < 0.42 ? lit : t < 0.75 ? mid : dark;
  };
  /** The rows of a torii's parts, shared by the gate and the beams drawn over the pilgrims (fine pixels). */
  const toriiDims = (span, h, plaque = false, black = false) => {
    const H = Math.round(h * S);
    const SP = Math.round(span * S);
    const KB = Math.max(2, Math.round(H * 0.055));
    const KF = Math.max(2, Math.round(H * 0.07));
    const ST = black ? 0 : Math.max(2, Math.round(H * 0.06));
    const GAP = plaque ? Math.round(H * 0.17) : Math.max(2, Math.round(H * 0.085));
    const NT = Math.max(2, Math.round(H * 0.06));
    return { H, SP, KB, KF, ST, GAP, NT, BEAM: KB + KF + ST, PW: Math.max(3, Math.round(SP * 0.16)), LEAN: Math.round(H * 0.035), OVER: Math.round(SP * (black ? 0.1 : 0.18)) };
  };
  /**
   * A torii standing on row `foot` (logical), `span` between its pillars and `h` high, seen a little from above:
   * round pillars leaning in towards the top on their black nemaki (and a stone kamebara on the big ones), the
   * nuki running through them with its wedges, the gakuzuka strut (or a tablet) up to the shimagi, and on top the
   * kasagi: its black upper face, its vermilion front, its ends sweeping up. `black` is a shrine's gate of
   * unbarked logs, all straight; `inside` fills the opening with a torii tunnel's gloom.
   */
  const toriiPx = (cx, foot, span, h, o = {}) => {
    const { tone = 1, black = false, inside = false, plaque = false, rope = false, beamsOnly = false, seed = 1, put = (X, Yy, c) => img.px(X, Yy, c) } = o;
    const R1 = black ? 0x5a4a3e : scaleColor(C.R1, tone);
    const R2 = black ? 0x3a2e28 : scaleColor(C.R2, tone);
    const R3 = black ? 0x221a16 : scaleColor(C.R3, tone);
    const HI = black ? 0x7a6a5a : scaleColor(0xf27a4a, tone);
    const { H, SP, KB, KF, ST, GAP, NT, BEAM, PW, LEAN, OVER } = toriiDims(span, h, plaque, black);
    const CX = Math.round(cx * S) + 1;
    const FOOT = Math.round(foot * S);
    const TOP = FOOT - H;
    const NY = TOP + BEAM + GAP;
    const big = H >= 45;
    const KL = Math.round(SP / 2 + PW / 2 + OVER);
    const CURV = black ? 0 : Math.max(2, Math.round(H * 0.06));
    const lift = (dx) => Math.round(CURV * (Math.abs(dx) / KL) ** 2.6);
    const half = (Yy) => Math.round(SP / 2 - LEAN * (1 - (Yy - TOP) / H)); // (from the axis to a pillar's centre)
    const hs = (a, b) => hashPx(a + 512, b + 512, seed + 40);
    // the tunnel beyond the opening: gloom, the next gates fading into it, the floor catching what light there is
    if (inside) {
      const R0 = BEAM + GAP + NT + 6;
      for (let Yy = TOP + BEAM; Yy < FOOT; Yy++) {
        const a = half(Yy);
        const row = Yy - TOP;
        const t = (row - R0) / Math.max(1, H - R0);
        for (let X = -a; X <= a; X++) {
          let c = row < BEAM + 3 ? 0x150c08 : C.IN;
          if (t >= 0) {
            const inner = a * (0.72 - t * 0.12);
            const lane = a * (0.2 + t * 0.62);
            if (Math.abs(X) <= lane && t > 0.35) c = (Yy % 4 === 0 ? 0x4e3626 : 0x3c2a1e); // (the path, stripes of light from between the gates)
            else if (Math.abs(Math.abs(X) - inner) < 1) c = scaleColor(R3, 0.72);
            else if (t < 0.14 && Math.abs(X) < inner) c = scaleColor(R3, 0.55);
          }
          put(CX + X, Yy, c);
        }
      }
    }
    // the nuki, tied through the pillars, its ends standing proud of them
    {
      const NL = Math.round(half(NY) + PW / 2 + OVER * 0.55);
      for (let X = -NL; X <= NL; X++)
        for (let j = 0; j < NT; j++) {
          let c = j === 0 ? (black ? R1 : HI) : j < NT - 1 ? R1 : R2;
          if (Math.abs(X) === NL) c = R3;
          put(CX + X, NY + j, c);
        }
    }
    // the pillars
    if (!beamsOnly) {
      const NEM = Math.max(2, Math.round(H * 0.09));
      for (const side of [-1, 1])
        for (let Yy = TOP + KB; Yy < FOOT; Yy++) {
          const P0 = CX + side * half(Yy) - Math.floor(PW / 2);
          const up = FOOT - 1 - Yy;
          for (let i = 0; i < PW; i++) {
            let c;
            if (up < NEM) c = up === NEM - 1 ? (big ? C.gold : 0x4a4048) : i === 0 ? 0x3a3034 : C.K;
            else {
              c = roundShade(HI, R1, R3, i, PW);
              if (black && hs(i * 3, Yy >> 1) < 0.34) c = 0x221a16; // (the bark's furrows)
              else if (hs(i * 5 + side, Yy >> 2) < 0.1) c = scaleColor(c, 0.9); // (the grain)
              if (Yy < TOP + BEAM + 2) c = scaleColor(c, 0.72); // (in the beams' shade)
              if (up < NEM + H * 0.12 && hs(i, Yy) < 0.22) c = scaleColor(c, 0.8); // (weathered near the ground)
              if (!black && PW >= 4 && !big && side < 0 && i === PW >> 1 && Yy > NY + NT + 2 && (Yy - TOP) % 5 < 3 && hs(1, (Yy - TOP) >> 2) < 0.75) c = 0x2a1a14; // (the donor's name)
            }
            put(P0 + i, Yy, c);
          }
          if (big && up < 4) for (let i = -3 + up; i < PW + 3 - up; i++) put(P0 + i, Yy, i < 0 ? C.stone[3] : i >= PW ? C.stone[0] : up === 0 ? C.stone[1] : C.stone[2]); // (the kamebara)
        }
      // the wedges where the nuki leaves each pillar
      if (PW >= 5) {
        const a = half(NY) + Math.ceil(PW / 2);
        for (const side of [-1, 1]) for (let i = 0; i < 2; i++) for (let j = 0; j < NT; j++) put(CX + side * (a + i), NY + j, j === 0 ? 0x4a3a3e : C.K);
      }
    }
    // the sacred rope: twisted straw sagging under the nuki, its zigzags of white paper
    if (rope) {
      const a = half(NY) - Math.ceil(PW / 2);
      const ry = NY + NT + 1;
      const sag = Math.max(2, Math.round(H * 0.05));
      const thick = Math.max(2, Math.round(H * 0.035));
      for (let X = -a; X <= a; X++) {
        const d = Math.round((1 - (X / a) ** 2) * sag);
        for (let j = 0; j < thick; j++) put(CX + X, ry + d + j, (X + j) % 3 === 0 ? 0x9a8a5a : j === 0 ? 0xe8dcb0 : 0xc8b888);
      }
      for (const t of [-0.6, -0.2, 0.2, 0.6]) {
        const X = Math.round(t * a);
        const y0 = ry + Math.round((1 - t * t) * sag) + thick;
        for (let j = 0; j < 6; j++) for (let i = 0; i < 2; i++) put(CX + X + i + ((j >> 1) % 2), y0 + j, i ? 0xc8c8c0 : 0xf4f4ec);
      }
    }
    // the gakuzuka, or the tablet with the shrine's name in gold
    if (!black) {
      const SB = TOP + BEAM;
      if (plaque) {
        const W = Math.round(SP * 0.11);
        const y1 = NY + NT + Math.round(H * 0.05);
        for (let Yy = SB - 1; Yy < y1; Yy++)
          for (let X = -W; X <= W; X++) {
            const e = Math.min(W - Math.abs(X), Yy - SB + 1, y1 - 1 - Yy);
            let c = e === 0 ? 0x3a2e30 : e === 1 ? C.gold : C.K;
            if (e >= 3) {
              // two gold characters, one above the other, built of strokes rather than specks
              const CH = Math.floor((y1 - SB - 7) / 2);
              const cy = Yy - SB - 3;
              const k = Math.floor(cy / (CH + 1));
              const ly = cy - k * (CH + 1);
              if (k < 2 && ly < CH) {
                const v = (i) => Math.abs(X - Math.round(((i - 1) * (W - 3)) / 1.5)) < 1;
                const hz = (t) => ly === Math.round(t * (CH - 1));
                const top = k === 0;
                if (top ? hz(0) || hz(0.45) || hz(1) || (v(1) && ly > CH * 0.1) : hz(0.2) || hz(0.75) || (v(0) && ly > CH * 0.2) || (v(2) && ly > CH * 0.2)) c = X < 0 ? C.goldHi : C.gold;
              }
            }
            put(CX + X, Yy, c);
          }
      } else {
        const W = Math.max(1, Math.round(PW * 0.35));
        for (let Yy = SB; Yy < NY; Yy++) for (let X = -W; X <= W; X++) put(CX + X, Yy, Yy < SB + 1 ? R3 : X === -W ? R1 : X === W ? R3 : R2);
      }
      // the shimagi under the kasagi
      const SL = KL - Math.round(OVER * 0.3);
      for (let X = -SL; X <= SL; X++)
        for (let j = 0; j < ST; j++) put(CX + X, TOP + KB + KF + j - lift(X), j === 0 ? R3 : j < ST - 1 ? R1 : R2);
    }
    // the kasagi
    for (let X = -KL; X <= KL; X++) {
      const l = lift(X);
      const end = Math.abs(X) >= KL - (big ? 2 : 0);
      for (let j = 0; j < KB; j++) {
        let c = j === 0 ? 0x4a3a3e : C.K;
        if (black) c = hs(X >> 1, j) < 0.3 ? 0x221a16 : j === 0 ? 0x7a6a5a : R2;
        else if (hs(X, j * 3) < (tone < 0.92 ? 0.18 : 0.05)) c = j === 0 ? 0x5a6a3a : 0x3a4a2a; // (moss on the older ones)
        else if (big && j === 1 && X % 9 === 0) c = 0x3a2e30; // (the joints of its sheathing)
        put(CX + X, TOP + j - l, c);
      }
      for (let j = 0; j < KF; j++) {
        let c = j === 0 ? HI : j < KF - 1 ? R1 : R2;
        if (end) c = big ? C.gold : C.K;
        put(CX + X, TOP + KB + j - l, c);
      }
    }
  };
  /** Its shadow on the ground: the gate thrown down and to the right by the sun, every pixel shaded once. */
  const toriiShadow = (cx, foot, span, h, o = {}, seen = new Set()) => {
    const FOOT = Math.round(foot * S);
    toriiPx(cx, foot, span, h, {
      ...o,
      inside: false,
      put: (X, Yy) => {
        const z = FOOT - Yy;
        const SX = Math.round(X + z * 0.5);
        const SY = Math.round(FOOT + z * 0.22);
        const key = SY * 4096 + SX;
        if (seen.has(key)) return;
        seen.add(key);
        img.tintPx(SX, SY, 0.6);
      },
    });
  };
  // the ground the old tunnels kept clear (the same random numbers, so the trees keep their places)
  const tunnelGround = (u0, u1, cxf, hw, seed = 1) => {
    const tr = rng(seed);
    for (let u = u1; u >= u0; ) {
      reserveRect(Math.round(cxf(u)) - hw - 4, Y(u) - 1, hw * 2 + 9, 8);
      tr();
      u -= tr.chance(0.04) ? 9 + tr.int(0, 8) : tr.chance(0.3) ? 5 : 4;
    }
  };
  // what crosses the middle of a gate is cut out again and laid over the pilgrims, so they walk under the beams
  const beamFrames = new Map();
  const beamFrame = (span, h, k, tone) => {
    const key = span + '_' + k;
    if (beamFrames.has(key)) return beamFrames.get(key);
    const { SP, BEAM, GAP, NT, PW, LEAN } = toriiDims(span, h);
    const ce = Math.ceil(span / 2);
    const rows = Math.ceil((BEAM + GAP + NT) / S) + 1;
    const out = new HiCanvas(ce * 2 + 1, rows);
    const inner = Math.round(SP / 2 - LEAN - PW / 2) - 1;
    const CXo = ce * S + 1;
    toriiPx(ce, h + 1, span, h, {
      tone,
      seed: k,
      beamsOnly: true,
      put: (X, Yy, c) => {
        if (Math.abs(X - CXo) <= inner && Yy >= 0 && Yy < rows * S) out.px(X, Yy, c);
      },
    });
    const fr = [kit.frame(gradeAt(out, 2260))];
    beamFrames.set(key, fr);
    return fr;
  };
  /** A tunnel of gates, close enough that each hides the feet of the one behind it, with the odd sunlit gap. */
  const tunnel = (u0, u1, cxf, span, seed = 1) => {
    const tr = rng(seed * 31 + 7);
    const h = span + 2;
    const seen = new Set();
    for (let u = u1; u >= u0; ) {
      const cx = Math.round(cxf(u));
      const foot = Y(u) + 7;
      const k = Math.floor(tr() * 8);
      const tone = 0.82 + (k / 7) * 0.26;
      objects.push({ y: foot, draw: () => toriiPx(cx, foot, span, h, { tone, seed: k, inside: true }), shadow: () => toriiShadow(cx, foot, span, h, { tone, seed: k }, seen) });
      kit.loop(cx - Math.ceil(span / 2), U(foot - h - 1), beamFrame(span, h, k, tone), { fps: 1, d: 0.2 });
      u -= tr.chance(0.05) ? 10 + tr.int(0, 8) : tr.chance(0.35) ? 6 : 5;
    }
  };
  /** A gate standing alone across a path; it keeps the ground the old, wider one kept. */
  const gateSmall = (cx, y, hw, black = false, o = {}) => {
    const { span = hw * 2, h = Math.round(hw * 2.2), rope = black } = o;
    const foot = y + 7;
    const opt = { tone: 1.05, black, rope, seed: cx + 3 };
    objects.push({ y: foot, draw: () => toriiPx(cx, foot, span, h, opt), shadow: () => toriiShadow(cx, foot, span, h, opt) });
    reserveRect(cx - hw - 4, y - 2, hw * 2 + 9, 10);
  };
  const miniGate = (cx, y, hw) => {
    const foot = y + 4;
    const span = hw * 2;
    const h = span + 2;
    const opt = { tone: 0.95, seed: cx };
    objects.push({ y: foot, shadow: () => toriiShadow(cx, foot, span, h, opt), draw: () => toriiPx(cx, foot, span, h, opt) });
  };
  /** The great gate over the approach: as high as it is wide, its pillars at the edges of the paving. */
  const greatTorii = (cx, foot, span, h) => {
    const opt = { plaque: true, seed: 5 };
    objects.push({ y: foot, shadow: () => toriiShadow(cx, foot, span, h, opt), draw: () => toriiPx(cx, foot, span, h, opt) });
    reserveRect(56, foot - 16, 69, 18); // (the ground the old, wider gate kept, so the trees and shops keep their places)
  };
  /** A stone lantern (tōrō): base, post, the fire box with its window lit, a curled roof, the jewel on top. */
  const lantern = (x, y, lit = true) => {
    if (lit) lamps.push([x + 1, y + 1, 0xffd27a]);
    const X = x * S - 1;
    const Yy = y * S - 2;
    objects.push({
      y: y + 4,
      shadow: () => {
        for (let j = 0; j < 9; j++) for (let i = 0; i < 12; i++) if (((i - 6) / 6) ** 2 + ((j - 4) / 4) ** 2 < 1) img.tintPx(X + 3 + i, Yy + 12 + j, 0.55);
      },
      draw: () => {
        const st = (i, w) => (i === 0 ? C.stone[3] : i === w - 1 ? C.stone[0] : C.stone[1]);
        for (let i = 0; i < 9; i++) for (let j = 0; j < 3; j++) img.px(X + i, Yy + 14 + j, j === 0 ? C.stone[2] : st(i, 9));
        for (let i = 0; i < 3; i++) for (let j = 0; j < 5; j++) img.px(X + 3 + i, Yy + 9 + j, st(i, 3));
        for (let i = 0; i < 9; i++) img.px(X + i, Yy + 8, i ? C.stone[2] : C.stone[3]);
        for (let i = 0; i < 7; i++) for (let j = 0; j < 4; j++) img.px(X + 1 + i, Yy + 4 + j, st(i, 7));
        for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) img.px(X + 3 + i, Yy + 5 + j, lit ? (j ? 0xffb050 : 0xffe0a0) : 0x26222a);
        for (let i = -2; i < 11; i++) {
          img.px(X + i, Yy + 3, C.stone[0]);
          img.px(X + i, Yy + 2, i < 1 ? C.stone[3] : i > 7 ? C.stone[1] : C.stone[2]);
          if (i > -1 && i < 10) img.px(X + i, Yy + 1, C.stone[2]);
        }
        img.px(X - 3, Yy + 1, C.stone[2]);
        img.px(X + 11, Yy + 1, C.stone[1]);
        for (let i = 3; i < 6; i++) img.px(X + i, Yy, C.stone[3]);
        img.px(X + 4, Yy - 1, C.stone[3]);
        if (lit) glow(x + 1, y + 1, 0xffd27a, 0.55);
      },
    });
    reserveRect(x - 2, y - 2, 8, 8);
  };
  /** A red paper lantern (chōchin) hanging under the eaves: black caps, ribbed paper, lit from inside. */
  const chochin = (x, y, c = 0xe8452a) => {
    if (!capturing) lamps.push([x + 1, y + 2, c]);
    const X = x * S;
    const Yy = y * S;
    for (let i = 0; i < 3; i++) {
      img.px(X + i, Yy, 0x1a1418);
      img.px(X + i, Yy + 5, 0x1a1418);
      for (let j = 1; j < 5; j++) img.px(X + i, Yy + j, j % 2 === 0 ? scaleColor(c, 0.82) : i === 1 ? scaleColor(c, 1.18) : c);
    }
    img.px(X - 1, Yy + 2, scaleColor(c, 0.7));
    img.px(X + 3, Yy + 2, scaleColor(c, 0.6));
    glow(x, y + 1, scaleColor(c, 1.2), 0.45);
  };
  /** A stone fox (kitsune) on its plinth: sitting, ears up, a red bib, its tail curled, a key or jewel held. */
  const fox = (x, y, flip) => {
    const X = x * S;
    const Yy = y * S;
    const f = (i) => (flip ? X + 11 - i : X + i);
    objects.push({
      y: y + 6,
      shadow: () => shadowPx(X + 3, Yy + 6, 15, 15, 0.55),
      draw: () => {
        for (let i = -3; i < 15; i++)
          for (let j = 9; j < 21; j++) img.px(X + i, Yy + j, j === 9 ? C.stone[3] : j < 12 ? C.stone[2] : i === -3 ? C.stone[2] : i === 14 ? C.stone[0] : (j - 12) % 4 === 3 ? C.stone[0] : C.stone[1]);
        const body = 0xd8d2c6;
        const sh = 0xa8a296;
        for (let j = 2; j < 10; j++) for (let i = 1; i < 10; i++) if (((i - 5) / 4.6) ** 2 + ((j - 6.5) / 4.2) ** 2 < 1) img.px(f(i), Yy + j, i < 4 ? 0xece6da : i > 7 ? sh : body);
        for (let j = -2; j < 3; j++) for (let i = 2; i < 8; i++) if (((i - 5) / 3) ** 2 + ((j - 0.5) / 2.6) ** 2 < 1) img.px(f(i), Yy + j, i < 4 ? 0xece6da : body);
        for (const [i, j] of [[2, -4], [2, -3], [3, -3], [7, -4], [7, -3], [6, -3]]) img.px(f(i), Yy + j, body);
        img.px(f(2), Yy - 3, 0xc8a090);
        img.px(f(7), Yy - 3, 0xc8a090);
        img.px(f(4), Yy, 0x2a2024);
        img.px(f(6), Yy, 0x2a2024);
        img.px(f(5), Yy + 1, 0x3a3030);
        for (let i = 2; i < 9; i++) for (let j = 3; j < 5; j++) img.px(f(i), Yy + j, j === 4 && (i === 2 || i === 8) ? C.R2 : C.R1);
        img.px(f(5), Yy + 2, C.gold); // the key in its mouth
        img.px(f(6), Yy + 2, C.goldHi);
        for (const [i, j] of [[10, 8], [11, 7], [11, 6], [12, 5], [12, 4], [11, 3], [10, 3]]) img.px(f(i), Yy + j, i === 12 ? 0xf4f0e8 : body);
      },
    });
    reserveRect(x - 2, y - 2, 9, 10);
  };
  /** A stone monument (otsuka) on the slope: a slab with a rounded head, carved lines, moss at its foot. */
  const otsuka = (x, y, w, h) => {
    const X = x * S;
    const Yy = y * S;
    const Wd = w * S;
    const Hd = h * S;
    const sr = rng(x * 131 + y);
    objects.push({
      y: y + h,
      shadow: () => shadowPx(X + 3, Yy + 6, Wd + 3, Hd, 0.55),
      draw: () => {
        for (let j = 0; j < Hd; j++)
          for (let i = 0; i < Wd; i++) {
            if (j < 3 && (i < 2 - j || i > Wd - 3 + j)) continue;
            let c = j < 2 ? C.stone[3] : i < 2 ? C.stone[2] : i > Wd - 3 ? C.stone[0] : C.stone[1];
            if (hashPx(X + i, Yy + j, 7) < 0.06) c = scaleColor(c, 0.85);
            if (j > Hd - 4 && hashPx(X + i, Yy + j, 8) < 0.45) c = C.moss[1 + (i % 2)];
            img.px(X + i, Yy + j, c);
          }
        const lines = Math.max(1, Math.floor((Wd - 4) / 3));
        for (let k = 0; k < lines; k++) {
          const LX = X + 2 + k * 3;
          for (let j = 4; j < Hd - 4; j++) if (sr() < 0.7) img.px(LX, Yy + j, 0x3a3640);
        }
      },
    });
    reserveRect(x - 1, y - 1, w + 3, h + 3);
  };
  /** A person seen from above in 3/4: hair, a face if turned our way, clothes with arms, legs, a shadow.
   * Maiko: black hair dressed with kanzashi, a white face, a bright kimono with its obi and the long tails. */
  const personPx = (X, Yy, o) => {
    const pr = rng(X * 7919 + Yy);
    for (let i = 0; i < 4; i++) img.px(X + 1 + i, Yy + 6, 0x101418, 0.4);
    if (o.maiko) {
      const k = o.kimono;
      img.px(X, Yy - 3, 0x141014);
      img.px(X + 1, Yy - 3, 0x141014);
      img.px(X + 2, Yy - 3, 0x141014);
      img.px(X + 1, Yy - 4, 0x141014);
      img.px(X + (o.orn ? 0 : 2), Yy - 4, o.orn ? 0xf0e0a0 : 0xe86a9a);
      img.px(X + 2, Yy - 4, 0xff9ac0);
      img.px(X + 1, Yy - 2, 0xf8f0e8);
      img.px(X, Yy - 2, 0x141014);
      img.px(X + 2, Yy - 2, 0x141014);
      for (let j = -1; j < 5; j++) for (let i = -1; i < 4; i++) if (!(j > 2 && (i < 0 || i > 2))) img.px(X + i, Yy + j, i === -1 ? scaleColor(k, 0.8) : i === 3 ? scaleColor(k, 0.72) : j === 1 ? o.obi : k);
      if (pr() < 0.6) img.px(X + 1, Yy + 2, o.obi);
      img.px(X + 1, Yy + 5, 0x2a1a14);
    } else {
      const coat = o.coat;
      img.px(X, Yy - 2, o.hair);
      img.px(X + 1, Yy - 2, o.hair);
      img.px(X + 2, Yy - 2, o.hair);
      img.px(X, Yy - 1, o.face ? 0xe8c0a0 : o.hair);
      img.px(X + 1, Yy - 1, o.face ? 0xe8c0a0 : o.hair);
      img.px(X + 2, Yy - 1, o.face ? 0xd8a888 : o.hair);
      for (let j = 0; j < 3; j++) for (let i = -1; i < 4; i++) if (!(j === 2 && (i < 0 || i > 2))) img.px(X + i, Yy + j, i < 0 || i > 2 ? scaleColor(coat, 0.75) : i === 0 ? scaleColor(coat, 1.12) : coat);
      img.px(X, Yy + 3, o.legs);
      img.px(X + 2, Yy + 3, o.legs);
      img.px(X + (pr() < 0.5 ? 0 : 2), Yy + 4, o.legs);
      img.px(X, Yy + 5, 0x1a1a20);
      img.px(X + 2, Yy + 5, 0x1a1a20);
      if (pr() < 0.15) for (let j = 1; j < 3; j++) img.px(X + 3, Yy + j, pr.pick([0xe8e0d0, 0xc8a060, 0x2a2a30]));
    }
  };
  /** People: tourists, and maiko in bright kimono with their black hair and ornaments. */
  const crowd = (x0, y0, w, h, n, any = false, maiko = 0) => {
    for (let i = 0; i < n; i++) {
      const x = Math.round(x0 + rand() * w);
      const y = Math.round(y0 + rand() * h);
      if (!any && isRes(x, y)) continue;
      if (!img.alpha(x, y)) continue;
      const pr = rng(x * 1009 + y);
      const X = x * S + Math.floor(pr() * S);
      const Yy = y * S + Math.floor(pr() * S);
      if (rand() < maiko) {
        const kimono = rand.pick(KIMONO);
        const orn = rand() < 0.5;
        personPx(X, Yy, { maiko: true, kimono, orn, obi: pr.pick([0xe8c040, 0x2a2a6a, 0xf4f0e6, 0xc83a3a, 0x3a8a6a]) });
      } else {
        const coat = rand() < 0.45 ? rand.pick([0xd04040, 0x3a6ad0, 0xe8c040, 0xe8e8f0, 0x6aaa5a]) : pr.pick([0x3a3a4a, 0x4a4038, 0x2a3040, 0x5a5a62]);
        personPx(X, Yy, { coat, hair: pr.pick([0x2a2024, 0x1a1418, 0x3a2a20, 0x6a5a48]), face: pr() < 0.5, legs: pr.pick([0x2a2a34, 0x3a4a6a, 0x1a1a20, 0x5a5048]) });
      }
    }
  };
  /** A rickshaw from above: the folded black hood, the red seat with two passengers under a blanket, the big
   * spoked wheels edge on, the shafts and the puller in his straw hat (at the top when going up the screen). */
  const rickshawPx = (X, Yy, up, step = 0) => {
    const seatY = Yy + (up ? 12 : 0);
    for (const WX of [X, X + 13])
      for (let j = 3; j < 18; j++) img.px(WX + (j % 5 === step % 5 ? 1 : 0), seatY + j - (up ? 9 : 0), j === 3 || j === 17 ? 0x5a4a3a : 0x1a1418);
    for (let j = 0; j < 12; j++)
      for (let i = 2; i < 13; i++) {
        let c = j < 3 ? (j === 0 ? 0x3a3034 : 0x1a1418) : j < 9 ? (i === 2 ? 0xa82a2a : i === 12 ? 0x6a1414 : 0x8a1a1a) : 0xe8d8b0;
        if (j >= 4 && j < 8 && (i === 5 || i === 9)) c = 0x2a2024; // the passengers' heads
        if (j === 8 && i > 3 && i < 11) c = 0x3a6a8a;
        img.px(X + i, seatY + j, c);
      }
    const py = up ? Yy : Yy + 14;
    for (let j = 0; j < 10; j++) {
      img.px(X + 3, py + (up ? 9 - j : j) - (up ? 0 : 2), 0x6a4a2a);
      img.px(X + 11, py + (up ? 9 - j : j) - (up ? 0 : 2), 0x6a4a2a);
    }
    const hy = up ? Yy - 1 : Yy + 20;
    for (let i = 4; i < 11; i++) img.px(X + i, hy, i === 4 || i === 10 ? 0xa8905a : 0xd8c088);
    for (let i = 5; i < 10; i++) img.px(X + i, hy + (up ? 1 : -1), 0xc8b078);
    img.px(X + 7, hy + (up ? 2 : 1), 0x2a2a3a);
    img.px(X + 6, hy + (up ? 2 : 1), 0x2a2a3a);
    img.px(X + 8, hy + (up ? 2 : 1), 0x2a2a3a);
    img.px(X + 7, hy + (up ? 3 : 2), 0xf0ece4);
  };
  const rickshawFrame = (up, u) =>
    capture(-1, Y(u) - 1, 7, 10, () => rickshawPx(0, (Y(u) - 1) * S + 2, up));
  const rickshaw = (x, y) => {
    objects.push({
      y: y + 7,
      shadow: () => shadowPx(x * S + 3, y * S + 6, 15, 18, 0.55),
      draw: () => rickshawPx(x * S, y * S, false),
    });
  };
  /** A paper umbrella (wagasa) from above: many fine ribs, the paper lit on one side, the ring and the boss. */
  const umbrella = (x, y, c1 = C.R1, c2 = C.R2) => {
    const CX = x * S + 1;
    const CY = y * S + 1;
    const R = 12.5;
    return {
      y: y + 4,
      shadow: () => {
        for (let j = -13; j <= 13; j++) for (let i = -13; i <= 13; i++) if (i * i + j * j <= R * R) img.tintPx(CX + i + 6, CY + j + 9, 0.55);
      },
      draw: () => {
        for (let j = -13; j <= 13; j++)
          for (let i = -13; i <= 13; i++) {
            const d = Math.hypot(i, j);
            if (d > R) continue;
            const a = Math.atan2(j, i);
            const rib = Math.abs(((a / (Math.PI * 2)) * 24 + 24) % 1 - 0.5) > 0.42;
            let c = i + j < -4 ? scaleColor(c1, 1.15) : i + j > 6 ? scaleColor(c1, 0.85) : c1;
            if (rib) c = c2;
            if (d > R - 1.2) c = scaleColor(c2, 0.8);
            if (d > 3.5 && d < 4.6) c = 0xf0e0b0;
            img.px(CX + i, CY + j, c);
          }
        img.discPx(CX + 0.5, CY + 0.5, 2, C.gold);
        img.px(CX, CY, C.goldHi);
      },
    };
  };

  // hall in 3/4 view: hipped-gable roof + facade. Styles:
  //   shrine (bark roof, vermilion and white), gate (the same with a dark passage), machiya (tiles, wood
  //   lattice, noren and a red lantern), temple (dark tiles, wooden posts and white panels), hondo
  //   (bark roof over plain unpainted wood)
  // In fine pixels: the bark roofs in layered courses, the tiled ones in rows of round tiles with their lit
  // and shaded flanks and the round tile ends along the eave, the ridge with its end tiles (onigawara) or the
  // shrine's gold-capped ridge; the fronts with posts, plaster panels, koshi lattices, slatted windows,
  // noren with a crest, the lanterns and the little things outside the townhouses.
  const hall = (x, y, w, roofH, faceH, style = 'shrine') => {
    const bark = style === 'shrine' || style === 'gate' || style === 'hondo';
    const ramp = bark ? C.roofBark : style === 'temple' ? C.roofTileDark : rand() < 0.3 ? C.roofTileDark : C.roofTile;
    const ridge = y + Math.round(roofH * 0.32);
    const hi = Math.round(roofH * 0.42);
    const noren = rand.pick([0x2b3c78, 0x7a1a2a, 0x2a5a3a, 0xe8e0d0]);
    const nx = x + 3 + Math.floor(rand() * Math.max(1, w - 10));
    // a machiya's front: dark wood lattice, or the red bengara walls of a teahouse; little things outside
    const bengara = style === 'machiya' && rand() < 0.16;
    const props = [];
    if (style === 'machiya')
      for (let px = x + 1; px < x + w - 2; px += 3 + Math.floor(rand() * 4)) props.push([px, rand.pick(['pot', 'pot', 'inu', 'inu', 'bike', 'sign', 'none'])]);
    const hr = rng(x * 977 + y * 13 + w);
    if (style === 'machiya') kitchens.push([x, y, w]);
    const nightAmt = smooth(5950, 6500, L - y); // (towards the 大 the halls light up)
    const X0 = x * S;
    const X1 = (x + w) * S; // (exclusive)
    const RY0 = y * S;
    const RY1 = (y + roofH) * S;
    const RIDGE = ridge * S + 1;
    const HI = hi * S;
    objects.push({
      y: y + roofH + faceH,
      shadow: () => shadowPx(X0 + 4 * S, RY0 + 5 * S, w * S, (roofH + faceH) * S, 0.5),
      draw: () => {
        // the roof
        for (let Yy = RY0; Yy < RY1; Yy++) {
          const north = Yy <= RIDGE;
          const t = north ? (RIDGE - Yy) / Math.max(1, RIDGE - RY0) : (Yy - RIDGE) / Math.max(1, RY1 - 1 - RIDGE);
          const inset = HI * (1 - t);
          for (let X = X0; X < X1; X++) {
            const lx = X - X0;
            const rx = X1 - 1 - X;
            if ((Yy === RY0 || Yy === RY1 - 1) && (lx < S || rx < S)) continue; // (the roof's corners rounded off)
            let c;
            const hipL = lx < inset;
            const hipR = rx < inset;
            if (hipL) c = ramp[3];
            else if (hipR) c = ramp[0];
            else c = north ? ramp[2] : ramp[1];
            if (bark) {
              // cypress bark laid in thin courses, a lighter fleck here and there
              if ((hipL || hipR ? lx + rx + Yy : Yy) % 3 === 0) c = scaleColor(c, 0.86);
              if (hashPx(X, Yy, 21) < 0.05) c = scaleColor(c, 1.12);
            } else if (hipL || hipR) {
              // the hips: tile rows running down the slope
              if ((Yy - RY0 + (hipL ? lx : rx)) % 4 === 0) c = scaleColor(c, 0.82);
            } else {
              // round tiles in rows: a lit flank, a shaded one, the joint between the courses
              const k = (X - X0) % 4;
              c = k === 0 ? scaleColor(c, 0.7) : k === 1 ? scaleColor(c, 1.14) : k === 3 ? scaleColor(c, 0.88) : c;
              if ((Yy - RIDGE) % 5 === 4 && !north) c = scaleColor(c, 0.8);
              if ((RIDGE - Yy) % 5 === 4 && north) c = scaleColor(c, 0.84);
            }
            // the weather on it: the slope lit towards the ridge, streaks where the rain runs off, moss where it
            // stays damp (the north side, the hips, along the eave), lichen
            c = scaleColor(c, north ? 1.03 : 1.07 - t * 0.17);
            if (fbm(X * 0.7, Yy * 0.06, { seed: 24, scale: 3 }) > 0.7) c = scaleColor(c, 0.86);
            const damp = (north ? 0.3 : 0) + (t > 0.72 ? (t - 0.72) * 1.6 : 0) + (hipL || hipR ? 0.12 : 0);
            if (fbm(X * 0.3, Yy * 0.3, { seed: 25, scale: 3, octaves: 2 }) + damp * 0.35 > 0.86) c = mix(c, bark ? 0x4a5a30 : 0x55643c, 0.5);
            else if (hashPx(X, Yy, 26) < 0.01) c = bark ? 0x9a9a7a : 0xa8aca0;
            img.px(X, Yy, c);
          }
        }
        // the eave: the round tile ends (or the bark's thick edge), then the shadow line under it
        for (let X = X0 + 1; X < X1 - 1; X++) {
          const e1 = bark ? (X % 5 === 0 ? 0x5a4a44 : 0x7a6660) : (X - X0) % 4 === 1 ? scaleColor(ramp[3], 1.15) : (X - X0) % 4 === 3 ? ramp[1] : ramp[3];
          img.px(X, RY1 - 2 * S + 1, e1);
          img.px(X, RY1 - 2 * S + 2, bark ? 0x6a5650 : ramp[2]);
          for (let j = 0; j < S; j++) img.px(X, RY1 - S + j, j === S - 1 ? 0x141012 : ramp[0]);
        }
        // the ridge: dark bark with gold caps, or tiles with a pale line and the end tiles
        const rc = bark ? C.K : 0x7d889a;
        for (let X = X0 + HI; X < X1 - HI; X++) {
          img.px(X, RIDGE - 2, bark ? 0x4a3a3e : 0xb0bac8);
          img.px(X, RIDGE - 1, bark ? 0x2a2024 : 0x95a0b2);
          img.px(X, RIDGE, rc);
          img.px(X, RIDGE + 1, bark ? 0x1a1214 : 0x5a6474);
        }
        for (const gx of [X0 + HI, X1 - HI - 3])
          for (let i = 0; i < 3; i++)
            for (let j = -3; j < 2; j++) img.px(gx + i, RIDGE + j, bark ? (j < -1 ? C.goldHi : C.gold) : j === -3 ? 0xb0bac8 : 0x6a7484);
        if (bark && w > 30) for (let X = X0 + HI + 6; X < X1 - HI - 6; X += 9) for (let j = -2; j < 1; j++) img.px(X, RIDGE + j, j === -2 ? C.goldHi : C.gold); // katsuogi logs
        // the front
        const FY0 = RY1;
        const FY1 = (y + roofH + faceH) * S;
        const upperH = Math.ceil(faceH / 2) * S;
        for (let Yy = FY0; Yy < FY1; Yy++)
          for (let X = X0 + S; X < X1 - S; X++) {
            const lx = X - X0 - S;
            const k = lx % 27;
            const fy = Yy - FY0;
            const upper = fy < upperH;
            let c;
            if (style === 'shrine' || style === 'gate') {
              if (k < 5) c = roundShade(0xf06a40, C.R1, C.R3, k, 5);
              else if (upper) c = fy % 9 === 8 ? C.R2 : (lx + fy) % 13 === 0 ? 0xd8d0be : C.white;
              else c = (X + Yy) % 3 === 0 ? C.R3 : C.R2;
              if (fy === upperH - 1 || fy === upperH) c = C.R3;
            } else if (style === 'temple') {
              if (k < 3) c = roundShade(C.wood[3], C.wood[2], C.wood[0], k, 3);
              else if (upper) c = fy === upperH - 1 ? C.wood[1] : C.white;
              else c = (fy - upperH) % 3 === 0 ? C.wood[1] : C.wood[2];
            } else if (style === 'hondo') {
              if (k < 3) c = roundShade(C.wood[3], C.wood[2], C.wood[0], k, 3);
              else c = (lx % 6 === 0) ? C.hinoki[0] : (hashPx(X, Yy >> 2, 23) < 0.2 ? C.hinoki[2] : C.hinoki[1]);
            } else {
              // machiya: posts, the slatted upper storey, the koshi lattice below
              if (k < 2) c = k === 0 ? C.wood[0] : C.wood[1];
              else if (upper) c = lx % 2 ? C.wood[2] : C.wood[1];
              else c = lx % 2 === 0 ? C.wood[0] : fy % 6 === 0 ? C.wood[1] : C.wood[2];
              if (bengara) c = k < 2 ? 0x5a1a14 : !upper && lx % 2 === 0 ? 0x6a2018 : fy % 4 === 0 ? 0x8a2a20 : 0xa8382a;
            }
            if (fy < 2) c = 0x15100c; // (the shadow under the eave)
            img.px(X, Yy, c);
          }
        // towards dusk the shōji glow: warm light through the white panels, some rooms lit, some not
        if (nightAmt > 0.05)
          for (let Yy = FY0 + 3; Yy < FY0 + upperH - 1; Yy++)
            for (let X = X0 + S; X < X1 - S; X++) {
              const bay = Math.floor((X - X0 - S) / 27);
              const k = (X - X0 - S) % 27;
              if (k > 5 && k < 25 && hashPx(bay, y, 77) < 0.7) glowPx(X, Yy, (X + Yy) % 6 === 0 ? 0xe8b060 : 0xffd890, nightAmt * 0.7);
            }
        if (style === 'machiya' && faceH >= 3) {
          // the second floor's mushiko slatted window under the eave, lit from inside
          // (some houses have rolled a bamboo blind, sudare, down over it)
          const blind = hr() < 0.35;
          for (let X = X0 + 3 * S; X < X1 - 3 * S; X++)
            if ((X - X0) % 21 < 12)
              for (let j = 2; j < (blind ? 6 : 5); j++) img.px(X, FY0 + j, blind ? (j % 2 ? 0xb89a68 : 0xd8c088) : (X & 1) ? 0x3a2a1e : j === 3 ? 0xf0d898 : 0xc8b890);
          // a shop sign (kanban) by the door: a board of dark wood with its name in white
          if (hr() < 0.4 && w > 10) {
            const KX = X0 + S + 1;
            for (let Yy = FY0 + 2; Yy < FY1 - 1; Yy++) for (let i = 0; i < 4; i++) img.px(KX + i, Yy, i === 0 ? 0x5a4028 : i === 3 ? 0x1a120c : 0x2a1e14);
            glyph(KX + 1, FY0 + 3, 2, 0xf0ece0, hr);
            glyph(KX + 1, FY0 + 7, 2, 0xf0ece0, hr);
          }
          const BY = FY1 + S;
          const pr = rng(x * 31 + y);
          for (const [px, kind] of props) {
            const PX = px * S;
            if (kind === 'pot') {
              for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) img.px(PX + i, BY + j, i === 0 ? 0x8a5a4a : 0x6a4a3a);
              const leaf = pr() < 0.5 ? 0x3a7a3a : 0x5a9a4a;
              for (const [i, j] of [[0, -1], [1, -2], [2, -1], [1, -1], [-1, -2], [3, -2]]) img.px(PX + i, BY + j, (i + j) % 2 ? leaf : scaleColor(leaf, 1.2));
            } else if (kind === 'inu') {
              // inuyarai: the curved bamboo fence protecting the wall
              for (let i = 0; i < 8; i++) img.px(PX + i, BY + Math.round(Math.sin((i / 7) * Math.PI) * -2) + 1, i % 2 ? 0xb89a68 : 0xa08050);
              for (let i = 0; i < 8; i += 2) img.px(PX + i, BY + 1, 0x8a6a40);
            } else if (kind === 'bike') {
              for (let i = 0; i < 7; i++) img.px(PX + i, BY + 1, i === 0 || i === 6 ? 0x1a1a20 : pr() < 0.1 ? 0x8a8a90 : 0x2a2a30);
              const fc = pr.pick([0xc83a2a, 0x3a6aa8, 0xe8e8e8]);
              img.px(PX + 2, BY, fc);
              img.px(PX + 3, BY, fc);
              img.px(PX + 4, BY - 1, 0x2a2a30);
              img.px(PX + 1, BY - 1, 0x8a8a90);
            } else if (kind === 'sign') {
              for (let j = -4; j < 2; j++) {
                img.px(PX, BY + j, j === -4 ? 0x1a1a1a : 0xe8e0c8);
                img.px(PX + 1, BY + j, j === -4 ? 0x1a1a1a : 0xd8d0b8);
              }
              img.px(PX, BY - 2, 0x2a2a2a);
              img.px(PX + 1, BY - 1, 0x2a2a2a);
            }
          }
        }
        if (style === 'gate') {
          const gw = Math.round(w * 0.2) * S;
          const GX = Math.round((x + w / 2) * S - gw / 2);
          for (let Yy = FY0 + S; Yy < FY1; Yy++) for (let X = GX; X < GX + gw; X++) img.px(X, Yy, Yy < FY0 + S + 2 ? 0x080404 : 0x140c0a);
        }
        if (style === 'machiya') {
          // the noren across the door: indigo or red cloth in three panels, the crest in white
          const NX = nx * S;
          for (let Yy = FY0 + S; Yy < FY0 + 3 * S + 1; Yy++)
            for (let i = 0; i < 15; i++) img.px(NX + i, Yy, i % 5 === 4 && Yy > FY0 + S + 2 ? 0x15100c : Yy === FY0 + S ? scaleColor(noren, 0.7) : noren);
          img.discPx(NX + 7.5, FY0 + S + 3.5, 1.6, noren === 0xe8e0d0 ? 0x2a2a3a : 0xf0ece4);
          chochin(nx + 6, (FY0 + S) / S);
        }
        for (let X = X0 + S; X < X1 - S; X++) {
          img.px(X, FY1, C.stone[1]);
          img.px(X, FY1 + 1, C.stone[0]);
          if (X % 6 === 0) img.px(X, FY1, C.stone[2]);
        }
        if (style === 'shrine' && faceH >= 6) {
          // a pair of lanterns hanging at the front, the bell rope
          const MX = Math.round((x + w / 2) * S);
          for (let j = 0; j < 9; j++) img.px(MX, FY0 + 2 + j, j % 2 ? 0xe8d8a0 : 0xf4f0e6);
          img.discPx(MX + 0.5, FY0 + 2.5, 1.5, C.gold);
        }
        // rain chains (kusari-doi) hanging from the front corners of the bigger halls into stone basins
        if (style !== 'machiya' && w >= 24 && faceH >= 4)
          for (const CXc of [X0 + S + 2, X1 - S - 3]) {
            for (let Yy = RY1 - 2; Yy < FY1 + 2; Yy++) img.px(CXc, Yy, (Yy >> 1) % 2 ? C.gold : 0x6a5a2a);
            for (let i = -2; i <= 2; i++) img.px(CXc + i, FY1 + 2, i === -2 ? C.stone[3] : C.stone[1]);
            img.px(CXc, FY1 + 3, C.water[2]);
          }
        // now and then a pigeon or a crow resting on the ridge
        if (w > 20 && hr() < 0.3) {
          const BX = X0 + HI + 4 + Math.floor(hr() * Math.max(1, X1 - X0 - 2 * HI - 10));
          const crowOn = hr() < 0.4;
          const body = crowOn ? 0x141216 : 0x8a8e98;
          for (const [i, j] of [[0, -2], [1, -2], [2, -2], [3, -2], [0, -3], [1, -3], [2, -3], [3, -3], [4, -3]]) img.px(BX + i, RIDGE + j, body);
          img.px(BX + 4, RIDGE - 4, crowOn ? 0x141216 : 0x5a8a7a);
          img.px(BX + 5, RIDGE - 4, crowOn ? 0x3a3436 : 0xd8b8a8);
        }
      },
    });
    for (let yy = y - 2; yy < y + roofH + faceH + 2; yy++)
      for (let xx = x - 2; xx < x + w + 2; xx++) {
        if (xx < 0 || xx >= W || yy < 0 || yy >= L) continue;
        const foot = xx >= x && xx < x + w && yy >= y && yy < y + roofH + faceH;
        if (foot) laneMargin[yy * W + xx] = 0;
        else if (!isRes(xx, yy)) laneMargin[yy * W + xx] = 1;
      }
    reserveRect(x - 2, y - 2, w + 4, roofH + faceH + 4);
  };
  /** A tiny inner garden (tsubo-niwa) between townhouses: moss, a maple or a pine, a stone lantern. */
  const tsubo = (x, y, w, h) => {
    fillGround(x, y, w, h, C.moss, 51 + x, 3);
    tree(rand() < 0.5 ? 'tiny' : 'pine', x + w / 2, y + h / 2, Math.min(w, h) * 0.35 + 1);
    if (w > 8) {
      const X = (x + 1) * S;
      const Yy = (y + h - 3) * S;
      for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) img.px(X + i, Yy + j, j === 0 ? C.stone[3] : i === 5 ? C.stone[0] : (i + j) % 4 === 0 ? 0x34482c : C.stone[2]);
    }
    reserveRect(x, y, w, h);
  };
  /** Rows of machiya townhouses packed along a band, alleys between the rows, now and then a tiny garden. */
  const machiyaRows = (x0, x1, u0, u1, rh = [11, 15]) => {
    let u = u0;
    while (u < u1 - 12) {
      const roofH = rh[0] + Math.floor(rand() * (rh[1] - rh[0] + 1));
      const faceH = 4;
      const bh = roofH + faceH;
      let x = x0 - Math.floor(rand() * 4);
      while (x < x1 - 6) {
        let w = Math.min(x1 - x, 12 + Math.floor(rand() * 12));
        const fits = (ww) => !anyRes(x - 1, Y(u + bh) - 1, ww + 2, bh + 2);
        while (w >= 7 && !fits(w)) w -= 3;
        if (w >= 7) {
          if (rand() < 0.08) tsubo(x, Y(u + bh), w, bh);
          else hall(x, Y(u + bh), w, roofH, faceH, 'machiya');
          x += w + 1;
        } else x += 3;
      }
      // the stone-paved alley (roji) behind the row: setts with a gutter of darker stones down the middle
      const ay = Y(u + bh + 2);
      for (let xx = x0; xx < x1; xx++)
        if (!isRes(xx, ay))
          for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
            const X = xx * S + i;
            img.px(X, ay * S + j, j === 1 && (X >> 1) % 3 === 0 ? 0x2a2626 : (X + (j % 2) * 2) % 4 === 0 ? C.stone[0] : hashPx(X, j, 4) < 0.5 ? C.stone[1] : C.stone[2]);
          }
      u += bh + 4;
    }
  };
  /**
   * A pagoda in 3/4 view: square storeys getting smaller, each under a wide roof with lifted corners,
   * and the bronze sōrin finial with its nine rings on top. In fine pixels: posts, white plaster and
   * green-barred windows on each storey, the bracket rows under the eaves, the roofs in rows of tiles
   * with the corners swept up and a bell hanging from each, the rings of the sōrin catching the light.
   */
  const pagoda = (cx, uBase, tiers, opt = {}) => {
    const { w0 = 30, step = 4, floorH = 7, roofH = 6, wall = 'vermilion', ramp = C.roofTileDark } = opt;
    const y0 = Y(uBase);
    const parts = [];
    let y = y0;
    for (let i = 0; i < tiers; i++) {
      const ww = w0 - i * step;
      parts.push({ ww, wallTop: y - floorH, wallBot: y });
      y = y - floorH - roofH + 2;
    }
    const top = y;
    const CXf = Math.round(cx * S) + 1;
    objects.push({
      y: y0 + 4,
      shadow: () => {
        for (const p of parts) shadowPx(Math.round((cx - p.ww / 2) * S) + 10 * S, (p.wallTop + 8) * S, (p.ww + 8) * S, (p.wallBot - p.wallTop + roofH) * S, 0.55);
        for (let k = 0; k < 18 * S; k++) img.tintPx(CXf + 10 * S + Math.floor(k * 0.5), (top + 8) * S - k, 0.6);
      },
      draw: () => {
        // the stone platform with its steps
        const PX0 = Math.round((cx - w0 / 2 - 4) * S);
        const PW = (w0 + 8) * S;
        for (let j = 0; j < 4 * S; j++) for (let i = 0; i < PW; i++) img.px(PX0 + i, y0 * S + j, j === 0 ? C.stone[3] : j % 4 === 0 ? C.stone[1] : i === 0 ? C.stone[3] : i === PW - 1 ? C.stone[0] : C.stone[2]);
        for (let k = parts.length - 1; k >= 0; k--) {
          const { ww, wallTop, wallBot } = parts[k];
          const WX0 = Math.round((cx - ww / 2) * S);
          const WW = ww * S;
          for (let Yy = wallTop * S; Yy < wallBot * S; Yy++)
            for (let i = 0; i < WW; i++) {
              const bay = i % 15;
              const fy = Yy - wallTop * S;
              let c;
              if (wall === 'vermilion') c = bay < 3 ? roundShade(0xf06a40, C.R1, C.R3, bay, 3) : fy % 7 < 3 && bay > 5 && bay < 12 ? (bay % 2 ? 0x2e6a4a : C.white) : i < 6 ? C.R1 : C.R2;
              else c = bay < 3 ? roundShade(C.wood[3], C.wood[2], C.wood[0], bay, 3) : fy % 7 < 3 && bay > 5 && bay < 12 ? (bay % 2 ? 0x2a2a2a : C.white) : i < 6 ? C.wood[3] : C.wood[2];
              if (fy < 3) c = fy === 0 ? 0x1a1210 : (i % 3 === 0 ? C.wood[1] : C.wood[3]); // (the brackets under the eave)
              if (i >= WW - 2) c = scaleColor(c, 0.7);
              img.px(WX0 + i, Yy, c);
            }
          // the balcony rail round the storey
          if (k > 0) for (let i = -3; i < WW + 3; i++) img.px(WX0 + i, wallBot * S - 2, i % 3 === 0 ? C.wood[0] : wall === 'vermilion' ? C.R1 : C.wood[3]);
        }
        for (let k = parts.length - 1; k >= 0; k--) {
          const { ww, wallTop } = parts[k];
          const above = parts[k + 1];
          const eave = wallTop * S + S;
          const botW = (ww + 12) * S;
          const topW = (above ? above.ww : 6) * S;
          const RH = roofH * S;
          for (let X = Math.round((cx - ww / 2) * S); X < Math.round((cx + ww / 2) * S); X++) for (let j = 1; j < 4; j++) img.tintPx(X, eave + j, 0.72 + j * 0.06);
          for (let j = 0; j < RH; j++) {
            const t = j / Math.max(1, RH - 1);
            const hw = (botW / 2) * (1 - t) ** 0.55 + (topW / 2) * (1 - (1 - t) ** 0.55);
            const L0 = Math.round(CXf - hw);
            const L1 = Math.round(CXf + hw);
            for (let X = L0; X < L1; X++) {
              const lx = X - L0;
              const rx = L1 - 1 - X;
              let c = lx < 6 ? ramp[3] : rx < 6 ? ramp[0] : j < 2 ? (X % 4 === 1 ? scaleColor(ramp[3], 1.15) : ramp[3]) : (X - L0) % 4 === 0 ? scaleColor(ramp[1], 0.75) : (X - L0) % 4 === 1 ? ramp[2] : ramp[1];
              if (j > 1 && j % 5 === 0 && lx >= 6 && rx >= 6) c = scaleColor(c, 0.82);
              img.px(X, eave - j, c);
            }
            if (j < 3) {
              // the corners swept up, a bronze bell under each
              for (let q = 1; q < 5 - j; q++) {
                img.px(L0 - q, eave - j - q, ramp[3]);
                img.px(L1 - 1 + q, eave - j - q, ramp[1]);
              }
            }
          }
          for (const BX of [Math.round(CXf - botW / 2) - 2, Math.round(CXf + botW / 2) + 1]) {
            img.px(BX, eave + 1, 0x6a5a2a);
            img.px(BX, eave + 2, C.gold);
          }
        }
        // the sōrin: nine bronze rings on a mast, the water flame, the jewel
        const T = top * S;
        for (let j = 0; j < 16 * S; j++) img.px(CXf, T + 6 - j, 0x6a4a2a);
        for (let r = 0; r < 9; r++) {
          const RY = T + 2 - r * 4;
          for (let i = -3; i <= 3; i++) img.px(CXf + i, RY, i < -1 ? C.goldHi : i > 1 ? 0x8a6a3a : C.gold);
        }
        for (let j = 0; j < 5; j++) for (let i = -2; i <= 2; i++) if (Math.abs(i) <= 2 - (j >> 1)) img.px(CXf + i, T - 36 - j, j % 2 ? C.gold : 0xb08a3a);
        img.discPx(CXf + 0.5, T - 43, 1.8, C.goldHi);
      },
    });
    reserveRect(cx - w0 / 2 - 8, top - 16, w0 + 16, y0 - top + 22);
  };
  // ---- the great buildings, each drawn for itself (fine pixels throughout)
  /**
   * A roof of cypress bark in 3/4 view between fine X0..X1, Y0 (back edge) .. Y1 (the eave at its middle):
   * the short back slope, the ridge, the long front slope lit towards the top, hips at the sides, the eave
   * sweeping up at the corners (sori), the bark laid in fine wavy courses, rain streaks, moss along the eave
   * and the hips, the thick layered edge (koba) and under it the vermilion rafter ends with gold caps.
   * Returns eaveAt(X): the eave's fine row at X.
   */
  const barkRoofPx = (X0, X1, Y0, Y1, ridge, hipW, o = {}) => {
    const { lift = 10, curve = 0.3, seed = 1, ridgeGold = true, tiles = false } = o; // (tiles: round tiles instead of bark)
    const R = tiles ? C.roofTileDark : C.roofBark;
    const CXr = (X0 + X1) / 2;
    const half = (X1 - X0) / 2;
    const eaveAt = (X) => {
      const e = (Math.abs(X - CXr) - half * (1 - curve)) / (half * curve);
      return Y1 - Math.round(e > 0 ? e * e * lift : 0);
    };
    for (let X = X0; X < X1; X++) {
      const EY = eaveAt(X);
      for (let Yy = Y0; Yy <= EY; Yy++) {
        const north = Yy <= ridge;
        const t = north ? (ridge - Yy) / Math.max(1, ridge - Y0) : (Yy - ridge) / Math.max(1, EY - ridge);
        const inset = hipW * (1 - t);
        const lx = X - X0;
        const rx = X1 - 1 - X;
        if (north && (lx < inset * 0.6 || rx < inset * 0.6)) continue; // (the back slope narrower: the gables)
        const hipL = lx < inset;
        const hipR = rx < inset;
        let c = hipL ? R[3] : hipR ? R[0] : north ? R[2] : rampColor(R, 0.98 - t * 0.6, X, Yy);
        if (!north && t < 0.12 && !hipL && !hipR) c = scaleColor(c, 1.12 - t); // (the sun on the top of the slope)
        const wave = Math.round(Math.sin(X * 0.11 + seed) * 1.2);
        if (tiles && !hipL && !hipR) {
          const k = (X - X0) % 4;
          c = k === 0 ? scaleColor(c, 0.7) : k === 1 ? scaleColor(c, 1.16) : k === 3 ? scaleColor(c, 0.88) : c;
          if ((Yy - ridge) % 5 === 4) c = scaleColor(c, 0.82);
        } else if ((hipL || hipR ? (hipL ? lx : rx) + Yy : Yy + wave) % 3 === 0) c = scaleColor(c, 0.84);
        if (hashPx(X, Yy, seed + 3) < 0.04) c = scaleColor(c, 1.14);
        if (fbm(X * 0.7, Yy * 0.05, { seed: seed + 5, scale: 3 }) > 0.7) c = scaleColor(c, 0.85);
        const damp = (t > 0.75 && !north ? (t - 0.75) * 1.8 : 0) + (hipL || hipR ? 0.15 : 0) + (north ? 0.2 : 0);
        if (fbm(X * 0.28, Yy * 0.28, { seed: seed + 7, scale: 3, octaves: 2 }) + damp * 0.4 > 0.84) c = mix(c, 0x4a5a30, 0.5);
        if (EY - Yy < 6 && !north) {
          if (tiles) c = EY - Yy === 0 ? 0x1a1618 : EY - Yy < 3 ? ((X - X0) % 4 === 1 ? 0x8a8692 : (X - X0) % 4 === 3 ? R[1] : R[3]) : R[1]; // (the round tile ends)
          else c = EY - Yy === 0 ? 0x3a2a26 : EY - Yy < 2 ? 0x8a7468 : EY - Yy < 4 ? (X % 4 === 0 ? 0x5a4a44 : 0x7a6660) : 0x6a5650; // (the koba)
        }
        img.px(X, Yy, c);
      }
      // the rafter ends under the eave: vermilion with gold caps, the shadow between
      for (let j = 1; j < 5; j++) {
        const k = (X - X0) % 6;
        img.px(X, EY + j, j === 4 ? 0x100a08 : k < 3 ? (j === 1 && k === 1 ? C.goldHi : j === 1 ? C.gold : k === 0 ? 0xf06a40 : C.R1) : 0x1a1210);
      }
    }
    // the hip ridges (sumi-mune) running down from the ridge's ends to the corners, the end tiles on them
    for (let Yy = ridge; Yy < Y1; Yy++) {
      const t = (Yy - ridge) / Math.max(1, Y1 - ridge);
      const inset = hipW * (1 - t);
      for (const [HX, s] of [[X0 + inset, 1], [X1 - 1 - inset, -1]]) {
        const RXh = Math.round(HX);
        if (Yy > eaveAt(RXh) - 4) continue;
        img.px(RXh - s, Yy, 0x5a4a4e);
        img.px(RXh, Yy, C.K);
        img.px(RXh + s, Yy, 0x2a2024);
        img.px(RXh + 2 * s, Yy, 0x120c0e);
      }
    }
    for (const [CXh, s] of [[X0 + 1, 1], [X1 - 2, -1]]) {
      const EY = eaveAt(CXh + s * 4);
      for (let j = -6; j < 0; j++) for (let i = 0; i < 5; i++) img.px(CXh + s * i, EY + j, j === -6 ? C.goldHi : i === 0 ? 0x8a6a2a : C.gold);
    }
    // the ridge: a heavy bark ridge with its gold fittings and the ornate end pieces
    const RX0 = Math.round(X0 + hipW * 0.6);
    const RX1 = Math.round(X1 - hipW * 0.6);
    for (let X = RX0; X < RX1; X++) {
      for (let j = -4; j <= 2; j++) img.px(X, ridge + j, j === -4 ? 0x5a4a4e : j === -3 ? 0x3a2e32 : j === 2 ? 0x120c0e : C.K);
      if (ridgeGold && (X - RX0) % 18 < 3) for (let j = -3; j <= 1; j++) img.px(X, ridge + j, j === -3 ? C.goldHi : C.gold);
    }
    for (const EX of [RX0 - 4, RX1 - 2])
      for (let j = -8; j <= 2; j++)
        for (let i = 0; i < 6; i++) if (!(j < -5 && (i === 0 || i === 5))) img.px(EX + i, ridge + j, j < -6 ? C.goldHi : i === 0 || j === -8 ? C.goldHi : (i + j) % 3 === 0 ? 0x8a6a2a : C.gold);
    return eaveAt;
  };
  /** A bronze hanging lantern (tsuri-dōrō): its little roof, the pierced fire box lit from inside, the chain. */
  const hangingLantern = (X, Yy) => {
    img.px(X + 2, Yy - 2, 0x3a4a40);
    img.px(X + 2, Yy - 1, 0x3a4a40);
    for (let i = 0; i < 5; i++) img.px(X + i, Yy, i === 0 ? 0x7a9a7a : 0x4a6a5a);
    for (let j = 1; j < 6; j++)
      for (let i = 0; i < 5; i++) {
        const win = i > 0 && i < 4 && j > 1 && j < 5 && (i + j) % 2 === 0;
        img.px(X + i, Yy + j, win ? 0xffd890 : i === 0 ? 0x5a7a6a : 0x2e4a40);
        if (win) glowPx(X + i, Yy + j, 0xffd890, 0.8);
      }
    img.px(X + 2, Yy + 6, 0x3a4a40);
  };
  /** The Rōmon: the two-storey tower gate, its great bark roof with a front gable, brackets and a balcony
   * round the upper storey, the zuishin guardians seated in their niches either side of the passage.
   * o.tiles: a tiled roof; o.guards: 'nio' for the two fierce Niō standing in a temple gate's niches. */
  const romon = (x, y, w, roofH, faceH, o = {}) => {
    rand.pick([0]); // (the same two draws hall() would make, so the trees elsewhere keep their places)
    rand();
    const X0 = x * S;
    const X1 = (x + w) * S;
    const Y0 = y * S;
    const RY1 = Y0 + roofH * S - 22;
    const WX0 = X0 + 18;
    const WX1 = X1 - 18;
    const FB = (y + roofH + faceH) * S;
    objects.push({
      y: y + roofH + faceH,
      shadow: () => shadowPx(X0 + 12, Y0 + 15, X1 - X0, FB - Y0, 0.5),
      draw: () => {
        // the lower storey first (the roof overhangs it): five bays between round vermilion posts
        const LY0 = RY1 + 30;
        for (let Yy = LY0; Yy < FB; Yy++)
          for (let X = WX0; X < WX1; X++) {
            const bw = (WX1 - WX0) / 5;
            const bay = Math.floor((X - WX0) / bw);
            const k = (X - WX0) - bay * bw;
            const fy = Yy - LY0;
            let c;
            if (k < 7) c = roundShade(0xf06a40, C.R1, C.R3, Math.floor(k), 7);
            else if (fy < 3) c = fy === 0 ? 0x140c0a : C.R2; // (the head beam)
            else if (bay === 2) c = fy < 10 ? (k > bw / 2 - 12 && k < bw / 2 + 12 ? (fy > 3 && fy < 9 ? (fy % 2 && (Math.floor(k) % 4 === 0) ? C.goldHi : C.K) : C.K) : C.R2) : mix(0x140c0a, 0x3a2a20, (fy - 10) / (FB - LY0 - 10)); // (the passage, its gold-lettered plaque)
            else if (bay === 1 || bay === 3) {
              // the niches: a lattice in front of the seated guardians
              const sx = bay === 1 ? 0 : 1;
              const fx = k - 7 - (bw - 7) / 2;
              const fyy = fy - 6;
              let g = 0x24160e;
              if (o.guards === 'nio' && fyy > -3 && fyy < 30 && Math.abs(fx) < 11) {
                // a Niō: topknot, a glaring face, the bare muscled chest, arms flung out, the skirt and the sash
                const body = sx ? 0x5a4a5a : 0x9a3a28;
                const shade = scaleColor(body, 0.65);
                if (fyy < 0) g = Math.abs(fx) < 2 ? 0x141014 : g;
                else if (fyy < 6) g = Math.abs(fx) < 3.5 ? (fyy === 2 && Math.abs(fx) > 0.5 && Math.abs(fx) < 2.5 ? 0xf4f0e6 : fyy === 4 && !sx && Math.abs(fx) < 1.5 ? 0x2a0a08 : body) : g;
                else if (fyy < 18) g = Math.abs(fx) < 7 - (fyy > 14 ? 2 : 0) ? ((Math.round(fx) + fyy) % 5 === 0 ? shade : fx < -2 ? scaleColor(body, 1.15) : body) : fyy < 11 && Math.abs(fx) < 10.5 ? body : g;
                else if (fyy < 20) g = Math.abs(fx) < 6 ? C.R1 : g;
                else g = Math.abs(fx) < 7 - (fyy - 20) * 0.2 ? (Math.round(fx + fyy) % 4 === 0 ? 0x9a9488 : 0xc8c2b4) : Math.abs(fx) < 9 && fyy < 24 ? 0xe8e0c8 : g;
              } else if (o.guards !== 'nio' && fyy > 0 && fyy < 28 && Math.abs(fx) < 9) {
                if (fyy < 4) g = Math.abs(fx) < 3 ? 0x141014 : g; // (the court hat)
                else if (fyy < 8) g = Math.abs(fx) < 3 ? (sx ? 0xf0d8c0 : 0xd8603a) : g; // (the face)
                else if (fyy < 24) g = Math.abs(fx) < 8 - (fyy < 12 ? 3 : 0) ? (sx ? 0x1e1a24 : 0xb8302a) : g; // (the robes)
                else g = Math.abs(fx) < 8 ? 0x5a4a3a : g;
                if (fyy > 8 && fyy < 22 && Math.round(fx) === (sx ? -7 : 7)) g = 0xc8a050; // (the bow)
              }
              c = Math.floor(k) % 4 === 0 ? 0x3a1a10 : g;
            } else c = fy < 14 ? (fy % 7 === 6 ? C.R2 : C.white) : (fy % 3 === 0 ? C.R3 : C.R2);
            if (k < 7 && (fy === 2 || fy === 3)) c = C.gold; // (the gold fittings at the post heads)
            img.px(X, Yy, c);
          }
        for (let X = WX0 - 4; X < WX1 + 4; X++) for (let j = 0; j < 4; j++) img.px(X, FB + j, j === 0 ? C.stone[3] : j === 3 ? C.stone[0] : C.stone[1]);
        // the lanterns in the outer bays, white with a red band and their name in black
        if (FB - LY0 > 28) for (const LX of [WX0 + 22, WX1 - 28]) {
          const LY = LY0 + 10;
          for (let j = 0; j < 14; j++)
            for (let i = 0; i < 7; i++) {
              if ((j === 0 || j === 13) && (i === 0 || i === 6)) continue;
              img.px(LX + i, LY + j, j < 2 || j > 11 ? 0x1a1418 : j === 2 || j === 11 ? C.R1 : i === 0 ? 0xc8c0b0 : 0xf4f0e6);
            }
          glyph(LX + 2, LY + 4, 3, 0x1a1418, rng(LX));
          glyph(LX + 2, LY + 8, 3, 0x1a1418, rng(LX + 1));
        }
        // the pent roof between the storeys
        for (let X = WX0 - 8; X < WX1 + 8; X++) for (let j = 0; j < 10; j++) img.px(X, RY1 + 20 + j, j === 0 ? 0x8a7468 : j > 7 ? (j === 9 ? 0x120c0e : 0x5a4a44) : (X + j) % 3 === 0 ? C.roofBark[1] : C.roofBark[2]);
        // the upper storey: the bracket sets (green, white, vermilion, gold) and the balcony railing
        for (let X = WX0 + 4; X < WX1 - 4; X++) {
          const k = (X - WX0) % 12;
          for (let j = 0; j < 8; j++) img.px(X, RY1 + 5 + j, j < 3 ? (k < 4 ? 0x2e6a4a : k < 8 ? C.white : C.R1) : j < 5 ? (k % 6 < 3 ? C.R2 : 0x2e6a4a) : k === 5 ? C.gold : C.R1);
          img.px(X, RY1 + 14, C.R1);
          img.px(X, RY1 + 15, k % 4 === 0 ? C.R3 : 0x2a1810);
          img.px(X, RY1 + 16, k % 4 === 0 ? C.R3 : 0x2a1810);
          img.px(X, RY1 + 17, 0x140c0a);
          if (k === 0) {
            img.px(X, RY1 + 13, C.goldHi);
            img.px(X, RY1 + 14, C.gold);
          }
        }
        // the great roof, then the front gable (chidori-hafu) rising out of it
        const RH = RY1 - Y0;
        const ridge = Y0 + Math.round(RH * 0.2);
        barkRoofPx(X0, X1, Y0, RY1, ridge, Math.round((X1 - X0) * 0.2), { lift: Math.max(5, Math.round(RH * 0.09)), curve: 0.32, seed: 11 + x, tiles: o.tiles });
        const GCX = (X0 + X1) / 2;
        const GB = ridge + Math.round(RH * 0.46);
        const GT = ridge + Math.round(RH * 0.16);
        const GW = (X1 - X0) * 0.17;
        const GR = Math.max(6, Math.round(RH * 0.1));
        for (let Yy = GT; Yy < GB; Yy++) {
          const hw = ((Yy - GT) / (GB - GT)) * GW;
          for (let X = Math.round(GCX - hw); X <= GCX + hw; X++) {
            const e = hw - Math.abs(X - GCX);
            let c = e < 2 ? C.K : e < 4 ? (Yy % 5 === 0 ? C.goldHi : C.gold) : e < 6 ? C.R2 : (Yy - GT) % 6 === 0 ? 0xd8d0be : C.white;
            if (Yy > GB - 7) c = Yy === GB - 1 ? 0x140c0a : Yy > GB - 3 ? C.R3 : C.R1;
            img.px(X, Yy, c);
          }
        }
        // its gable ornament (gegyo) in gold, the roof of the gable sloping back into the main roof
        for (let j = 0; j < 9; j++) for (let i = -3 + Math.floor(j / 3); i <= 3 - Math.floor(j / 3); i++) img.px(Math.round(GCX) + i, GT + 6 + j, j < 2 ? C.goldHi : C.gold);
        for (let Yy = GT - GR; Yy < GT + 2; Yy++) {
          const hw = GW * 0.17 + ((Yy - (GT - GR)) / (GR + 2)) * GW * 0.87;
          for (let X = Math.round(GCX - hw); X <= GCX + hw; X++) {
            const top = Yy === GT - GR;
            img.px(X, Yy, top ? 0x5a4a4e : Math.abs(X - GCX) > hw - 3 ? C.K : (Yy + Math.round(Math.sin(X * 0.11) * 1.2)) % 3 === 0 ? 0x4a3a3e : C.roofBark[2]);
          }
        }
        // bronze lanterns hanging from the corners of the eave
        for (const HX of w > 50 ? [X0 + 26, X1 - 31, WX0 + 40, WX1 - 45] : [X0 + 12, X1 - 17]) hangingLantern(HX, RY1 + 5);
      },
    });
    for (let yy = y - 2; yy < y + roofH + faceH + 2; yy++)
      for (let xx = x - 2; xx < x + w + 2; xx++) {
        if (xx < 0 || xx >= W || yy < 0 || yy >= L) continue;
        const foot = xx >= x && xx < x + w && yy >= y && yy < y + roofH + faceH;
        if (foot) laneMargin[yy * W + xx] = 0;
        else if (!isRes(xx, yy)) laneMargin[yy * W + xx] = 1;
      }
    reserveRect(x - 2, y - 2, w + 4, roofH + faceH + 4);
  };
  /** The honden: the main sanctuary under its great nagare-zukuri roof (the front slope sweeping far out over
   * the steps), gold fittings on the ridge, a row of bronze lanterns hanging along the eave, vermilion posts
   * and lattice shutters, the shimenawa rope across the front with its paper streamers.
   * o.wood: a temple's main hall instead (plain hinoki posts and boards, two great paper lanterns at the door). */
  const honden = (x, y, w, roofH, faceH, o = {}) => {
    const P = o.wood ? [C.wood[3], C.wood[2], C.wood[0]] : [0xf06a40, C.R1, C.R3];
    rand.pick([0]); // (as hall() would)
    rand();
    const X0 = x * S;
    const X1 = (x + w) * S;
    const Y0 = y * S;
    const RY1 = (y + roofH) * S - 4;
    const FB = (y + roofH + faceH) * S;
    objects.push({
      y: y + roofH + faceH,
      shadow: () => shadowPx(X0 + 12, Y0 + 15, X1 - X0, FB - Y0, 0.5),
      draw: () => {
        // the front: posts, lattice shutters with gold corners, the open middle bay with the altar's gold
        const FY0 = RY1 + 4;
        const WX0 = X0 + 12;
        const WX1 = X1 - 12;
        for (let Yy = FY0; Yy < FB; Yy++)
          for (let X = WX0; X < WX1; X++) {
            const k = (X - WX0) % 34;
            const bay = Math.floor((X - WX0) / 34);
            const fy = Yy - FY0;
            const mid = Math.abs(X - (X0 + X1) / 2) < 30;
            let c;
            if (k < 6) c = roundShade(P[0], P[1], P[2], k, 6);
            else if (fy < 3) c = fy === 0 ? 0x140c0a : o.wood ? C.wood[1] : C.R2;
            else if (mid) c = fy < 12 ? mix(0x2a1a10, 0x8a6a2a, ((X * 7 + fy * 3) % 11) / 20) : fy < 16 ? (X % 3 ? C.gold : 0x8a6a2a) : 0x1a100a;
            else if (o.wood) c = k % 5 === 0 ? C.hinoki[0] : hashPx(X >> 2, Yy >> 3, 98) < 0.3 ? C.hinoki[2] : C.hinoki[1]; // (the boards)
            else c = (k % 4 === 2 || fy % 4 === 2) ? 0x2a1208 : C.R1; // (the shitomi lattice)
            if (!mid && k >= 6 && (k === 7 || k === 33) && (fy === 4 || fy === FB - FY0 - 2)) c = C.gold;
            if (bay % 2 && !mid && k > 6 && fy > 3 && fy < 6) c = C.gold;
            img.px(X, Yy, c);
          }
        // the roof
        const ridge = Y0 + 20;
        const eaveAt = barkRoofPx(X0, X1, Y0, RY1, ridge, 40, { lift: 14, curve: 0.25, seed: 31 });
        // the karahafu over the steps: the cusped, curving gable board of the front porch
        const KCX = (X0 + X1) / 2;
        const KY = RY1 - 10;
        for (let X = Math.round(KCX - 46); X <= KCX + 46; X++) {
          const t = (X - KCX) / 46;
          const arch = Math.round(KY - 12 * Math.cos(t * Math.PI * 0.5) ** 1.5 + (Math.abs(t) > 0.8 ? (Math.abs(t) - 0.8) * 20 : 0));
          for (let j = 0; j < 7; j++) img.px(X, arch + j, j < 2 ? C.K : j < 4 ? (X % 6 === 0 ? C.goldHi : C.gold) : j < 6 ? P[1] : P[2]);
          for (let Yy = arch + 7; Yy < eaveAt(X) + 1; Yy++) img.px(X, Yy, Yy % 4 === 0 ? 0xd8d0be : C.white);
        }
        for (let j = 0; j < 8; j++) for (let i = -2; i <= 2; i++) img.px(Math.round(KCX) + i, KY - 12 + j, j < 2 ? C.goldHi : C.gold);
        // the bronze lanterns all along the eave
        for (let HX = X0 + 16; HX < X1 - 20; HX += 24) if (Math.abs(HX - KCX) > 50) hangingLantern(HX, eaveAt(HX) + 6);
        // the shimenawa: a thick twisted straw rope sagging across the front, paper streamers hanging off it (or,
        // at a temple, the two great paper lanterns either side of the door)
        if (o.wood)
          for (const LX of [KCX - 40, KCX + 30]) {
            const LY = FY0 + 4;
            for (let j = 0; j < 20; j++)
              for (let i = 0; i < 11; i++) {
                const e = ((i - 5) / 5.5) ** 2 + ((j - 10) / 10.5) ** 2;
                if (e > 1 && j > 1 && j < 18) continue;
                img.px(Math.round(LX) + i, LY + j, j < 2 || j > 17 ? 0x1a1418 : j === 2 || j === 17 ? C.R1 : i < 3 ? 0xd8d0c0 : 0xf4f0e6);
              }
            glyph(Math.round(LX) + 3, LY + 5, 5, 0x1a1418, rng(LX));
            glyph(Math.round(LX) + 3, LY + 11, 5, 0x1a1418, rng(LX + 3));
          }
        else for (let X = WX0 + 6; X < WX1 - 6; X++) {
          const t = ((X - WX0) % 68) / 68;
          const Yy = FY0 + 4 + Math.round(Math.sin(t * Math.PI) * 3);
          img.px(X, Yy, Math.floor(X / 3) % 2 ? 0xe8d8a0 : 0xc8b070);
          img.px(X, Yy + 1, 0xa8904e);
          if ((X - WX0) % 34 === 17) for (let j = 2; j < 8; j++) img.px(X + (j % 2) - (j % 4 === 3 ? 1 : 0), Yy + j, 0xffffff);
        }
        for (let X = WX0 - 4; X < WX1 + 4; X++) for (let j = 0; j < 4; j++) img.px(X, FB + j, j === 0 ? C.stone[3] : j === 3 ? C.stone[0] : C.stone[1]);
      },
    });
    for (let yy = y - 2; yy < y + roofH + faceH + 2; yy++)
      for (let xx = x - 2; xx < x + w + 2; xx++) {
        if (xx < 0 || xx >= W || yy < 0 || yy >= L) continue;
        const foot = xx >= x && xx < x + w && yy >= y && yy < y + roofH + faceH;
        if (foot) laneMargin[yy * W + xx] = 0;
        else if (!isRes(xx, yy)) laneMargin[yy * W + xx] = 1;
      }
    reserveRect(x - 2, y - 2, w + 4, roofH + faceH + 4);
  };
  /** The worship hall's porch roof (kōhai) in front of the sanctuary: a curving karahafu of bark, gold at its
   * tip, on four vermilion posts. */
  const kohai = (x, y, w, roofH) => {
    rand.pick([0]); // (as hall() would)
    rand();
    const X0 = x * S;
    const X1 = (x + w) * S;
    const Y0 = y * S;
    const Y1 = (y + roofH) * S;
    objects.push({
      y: y + roofH,
      shadow: () => shadowPx(X0 + 9, Y0 + 9, X1 - X0, Y1 - Y0, 0.5),
      draw: () => {
        for (const PX of [X0 + 6, X0 + 30, X1 - 36, X1 - 12]) for (let j = 0; j < 8; j++) for (let i = 0; i < 4; i++) img.px(PX + i, Y1 - 2 + j, roundShade(0xf06a40, C.R1, C.R3, i, 4));
        barkRoofPx(X0, X1, Y0, Y1 - 6, Y0 + 8, 18, { lift: 6, curve: 0.4, seed: 41, ridgeGold: true });
        const CXk = (X0 + X1) / 2;
        for (let X = X0 + 8; X < X1 - 8; X++) {
          const t = (X - CXk) / ((X1 - X0) / 2 - 8);
          const arch = Math.round(Y1 - 10 - 7 * Math.cos(t * Math.PI * 0.5) ** 2);
          for (let j = 0; j < 4; j++) img.px(X, arch + j, j < 1 ? C.K : j < 3 ? C.gold : C.R1);
        }
      },
    });
    reserveRect(x - 2, y - 2, w + 4, roofH + 4);
  };
  const tree = (kind, x, y, r) => objects.push(treeObj(kind, x, y, r));

  /**
   * The current: faint streaks of light drifting down a river in lanes between u0 and u1 (dir 1 = to the
   * right), passing under the bridges in the middle (x 76..104).
   */
  function flow(u0, u1, dir, gu) {
    const streak = (len) => {
      // (a hairline of light, brightest in the middle, tapering off at both ends)
      const out = new HiCanvas(len, 1);
      for (let I = 0; I < len * S; I++) {
        const t = Math.min(I, len * S - 1 - I) / (len * S * 0.5);
        out.px(I, 1, scaleColor(C.river[3], 1 + t * 0.25), Math.min(1, t * 1.8));
      }
      return kit.frame(gradeAt(out, gu));
    };
    const f = [streak(6), streak(9), streak(7)];
    for (let u = u0, k = 0; u <= u1; u += 6, k++) {
      const sp = 5 + ((k * 7) % 5);
      for (const [a, b] of [[-12, 76], [104, 192]])
        kit.path(dir > 0 ? [[a, u], [b, u]] : [[b, u], [a, u]], [f[k % 3]], { sp, n: 2, gap: 44, turn: 'none', a: 0.75, fx: 1 });
    }
  }

  /**
   * Hanaikada, "flower rafts": clumps of fallen sakura petals drifting down a river between u0 and u1 (dir 1 =
   * to the right), passing under the bridges in the middle.
   */
  function petalRafts(u0, u1, dir, gu, seed) {
    const pr = rng(seed);
    const raft = () => {
      const out = new HiCanvas(9, 4);
      for (let i = 0; i < 18; i++) {
        const x = Math.floor(pr() * 9);
        const y = Math.floor(pr() * 4);
        if (Math.abs(x - 4) / 4.5 + Math.abs(y - 1.5) / 2 < 1.1) {
          // a few petals, each a pixel or two, pink with a paler edge
          const c = pr() < 0.6 ? 0xf6c8d4 : 0xffe6ee;
          const h = hashPx(x, y, i);
          const X = x * S + Math.floor(h * S);
          const Yy = y * S + Math.floor(hashPx(y, x, i) * S);
          out.px(X, Yy, c);
          if (h < 0.5) out.px(X + 1, Yy, 0xffeef4);
          if (h > 0.3) out.px(X, Yy + 1, scaleColor(c, 0.9));
        }
      }
      return kit.frame(gradeAt(out, gu));
    };
    const f = [raft(), raft(), raft()];
    for (let u = u0, k = 0; u <= u1; u += 11, k++)
      for (const [a, b] of [[-12, 76], [104, 192]])
        kit.path(dir > 0 ? [[a, u], [b, u]] : [[b, u], [a, u]], [f[k % 3]], { sp: 4 + pr() * 3, n: 1, turn: 'none', s0: pr() });
  }

  // ------------------------------------------------------------ A. Gion (u 0..540)
  {
    fillGround(0, Y(GION[1]), W, GION[1], [0x4e4a46, 0x5a5650, 0x66625a], 3, 4);
    // Hanamikōji: the stone-paved street with gutter stones, stone lanterns, maiko and rickshaws
    paving(80, Y(GION[1]), 20, GION[1]);
    // the kerbs and the gutters: a dressed kerbstone, then the channel with its granite cover slabs, an iron
    // grate every so often
    img.fine(78, Y(GION[1]), 2, GION[1], (FXr, FYr) => {
      const k = FXr - 78 * S;
      const g = (FYr >> 2) % 9 === 0;
      return k >= 4 ? (FYr % 12 === 0 ? C.stone[2] : C.stone[3]) : k === 3 ? C.stone[0] : g ? (FYr % 2 ? 0x2a2626 : 0x4a4648) : FYr % 6 === 0 ? 0x2a2626 : k === 0 ? C.stone[1] : C.stone[0];
    });
    img.fine(100, Y(GION[1]), 2, GION[1], (FXr, FYr) => {
      const k = FXr - 100 * S;
      const g = (FYr >> 2) % 9 === 4;
      return k <= 1 ? (FYr % 12 === 6 ? C.stone[2] : C.stone[3]) : k === 2 ? C.stone[0] : g ? (FYr % 2 ? 0x2a2626 : 0x4a4648) : FYr % 6 === 3 ? 0x2a2626 : k === 5 ? C.stone[1] : C.stone[0];
    });
    reserveRect(76, Y(GION[1]), 28, GION[1]);
    // live: rickshaws pulled up and down Hanamikōji
    for (const [x, s0] of [[85, 0.2], [93, 0.7]]) kit.path([[x, 30], [x, 520]], [rickshawFrame(false, 200)], { sp: 9, mode: 'pp', hold: 2, turn: 'none', fd: [rickshawFrame(false, 200)], fu: [rickshawFrame(true, 200)], s0 });
    // live: maiko under their red paper umbrellas and tourists strolling along Hanamikōji
    {
      const wagasa = (c) => {
        const out = new HiCanvas(6, 6);
        for (let j = 0; j < 18; j++)
          for (let i = 0; i < 18; i++) {
            const d = Math.hypot(i - 8.5, j - 8.5);
            if (d > 7.8) continue;
            const a = Math.atan2(j - 8.5, i - 8.5);
            const rib = Math.abs(((a / (Math.PI * 2)) * 20 + 20) % 1 - 0.5) > 0.4;
            let col = i + j < 13 ? scaleColor(c, 1.15) : i + j > 22 ? scaleColor(c, 0.82) : c;
            if (rib || d > 7) col = scaleColor(c, 0.72);
            if (d > 2.2 && d < 3) col = 0xf0e0b0;
            out.px(i, j, col);
          }
        out.px(8, 8, 0xf0e0b0);
        out.px(9, 9, C.gold);
        for (let i = 0; i < 6; i++) out.px(11 + i, 16 + (i >> 2), 0x101418, 0.35);
        return kit.frame(gradeAt(out, 260));
      };
      const tourist = (c, f) => {
        const out = new HiCanvas(2, 4);
        out.px(1, 0, 0x2a2024);
        out.px(2, 0, 0x2a2024);
        out.px(1, 1, 0x2a2024);
        out.px(2, 1, 0xe8c0a0);
        for (let j = 2; j < 6; j++) for (let i = 0; i < 4; i++) if (!(j > 4 && (i === 0 || i === 3))) out.px(i, j, i === 0 || i === 3 ? scaleColor(c, 0.75) : c);
        out.px(f ? 1 : 2, 6, 0x2a2a34);
        out.px(f ? 2 : 1, 7, 0x2a2a34);
        out.px(f ? 1 : 2, 8, 0x1a1a20);
        for (let i = 2; i < 6; i++) out.px(i, 10, 0x101418, 0.4);
        return kit.frame(gradeAt(out, 260));
      };
      for (const [x, c, s0] of [[82, 0xc8302a, 0.15], [97, 0xe0803a, 0.6], [83, 0xb83a6a, 0.85]]) kit.path([[x, 24], [x, 526]], [wagasa(c)], { sp: 2.2, mode: 'pp', hold: 4, turn: 'none', s0 });
      for (const [x, c, s0] of [[89, 0x3a6ad0, 0.3], [96, 0xe8e8f0, 0.5], [81, 0xe8c040, 0.75], [90, 0x6aaa5a, 0.05]])
        kit.path([[x, 24], [x, 526]], [tourist(c, 0), tourist(c, 1)], { sp: 3.5, mode: 'pp', hold: 2, turn: 'none', fps: 3, s0 });
    }
    // the Shirakawa canal across the district: walls of dressed stone with the waterline stained dark, the
    // shallow water running clear over pebbles, the stepping-down weir, weeping willows, the little Tatsumi
    // bridge with its stone posts, the Tatsumi shrine
    const k0 = 172;
    const k1 = 184;
    img.fine(0, Y(k1 - 1), W, k1 - k0, (FXr, FYr, x, y) => {
      const u = L - y;
      const r = Math.floor((u - k0) * S);
      if (r <= 2 || r >= (k1 - k0) * S - 6) {
        // the walls: block courses, the top lit, the face in shadow
        const top = r <= 2 ? r : (k1 - k0) * S - 1 - r;
        const blk = (FXr + (Math.floor(FYr / 3) % 2) * 5) % 10 === 0;
        return top === 0 ? C.stone[3] : blk ? C.stone[0] : top < 3 ? C.stone[2] : C.stone[1];
      }
      const n = fbm(x * 0.6, u * 2, { seed: 52, scale: 6 });
      const peb = fbm(FXr, FYr, { seed: 53, scale: 1.6 });
      const flowL = fbm(FXr * 0.25, FYr * 1.5, { seed: 54, scale: 3 });
      let c = rampColor(C.river, 0.12 + n * 0.4 + (peb > 0.62 ? 0.18 : 0), FXr, FYr);
      if (flowL > 0.72) c = C.river[3];
      if (r === 3 || r === 4) c = scaleColor(c, 0.65); // (the shadow under the south wall)
      return c;
    });
    reserveRect(0, Y(k1 + 1), W, k1 - k0 + 3);
    objects.push({
      y: Y(k0) + 1,
      draw: () => {
        // Tatsumi-bashi: a stone deck of long slabs, low parapets with posts at the corners
        img.fine(80, Y(k1), 20, k1 - k0 + 2, (FXr, FYr) => {
          const k = FXr - 80 * S;
          if (k < 3 || k >= 57) return (FYr % 9) < 2 ? C.stone[3] : k === 0 || k === 59 ? C.stone[1] : C.stone[2];
          return FYr % 7 === 0 ? C.stone[0] : rampColor(C.stone, 0.45 + hashPx(k >> 3, FYr / 7 | 0, 6) * 0.35, FXr, FYr);
        });
        for (const PX of [80 * S - 1, 100 * S - 3])
          for (const PY of [Y(k1) * S - 1, Y(k0 - 1) * S - 2]) for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) img.px(PX + i, PY + j, j === 0 ? C.stone[3] : i === 3 ? C.stone[0] : C.stone[2]);
      },
    });
    // weeping willows along the canal: a dark trunk, curtains of long thin strands falling to the water
    const willow = (x, y) => {
      const seed = Math.floor(rand() * 1e9);
      const wr = rng(seed);
      const CX = Math.round(x * S);
      const CY = y * S;
      const strands = [];
      for (let k = 0; k < 130; k++) {
        const a = wr() * Math.PI * 2;
        const d = Math.sqrt(wr()) * 14;
        strands.push([CX + Math.cos(a) * d, CY - 16 + Math.sin(a) * d * 0.6, 9 + Math.floor(wr() * 16), wr.pick([0x5a8a3a, 0x6e9a44, 0x82aa52, 0x4a7432, 0x98b866])]);
      }
      objects.push({
        y: y + 2,
        shadow: () => {
          for (const [SX, SY, len] of strands) for (let j = 0; j < len; j++) img.tintPx(Math.round(SX) + 6, Math.round(SY) + j + 6, 0.8);
        },
        draw: () => {
          for (let j = 0; j < 12; j++) {
            img.px(CX, CY - j, 0x3a2a20);
            img.px(CX + 1, CY - j, 0x2a1e18);
          }
          for (const [SX, SY, len, c] of strands)
            for (let j = 0; j < len; j++) img.px(Math.round(SX + Math.sin(j * 0.35) * 0.6), Math.round(SY) + j, j > len - 3 ? scaleColor(c, 0.8) : (j + Math.round(SX)) % 4 === 0 ? scaleColor(c, 1.18) : c);
        },
      });
    };
    for (let x = 4; x < W; x += 13) if (x < 70 || x > 110) willow(x + rand() * 3, Y(k1 + 5));
    hall(110, Y(k1 + 24), 14, 8, 4, 'shrine');
    // the five-storey Yasaka pagoda (Hōkan-ji) rising over the roofs of Higashiyama
    pagoda(148, 360, 5, { w0: 36, step: 5, floorH: 8, roofH: 7, wall: 'wood', ramp: C.roofTileDark });
    // Ichiriki-tei: the famous teahouse on the corner, its red bengara walls, the bamboo fence curving out
    // along their foot, the noren and the two lanterns at the door, bamboo blinds upstairs
    {
      const x = 104;
      const y = Y(80);
      objects.push({
        y: y + 30,
        shadow: () => shadowPx((x + 4) * S, (y + 4) * S, 40 * S, 30 * S, 0.5),
        draw: () => {
          img.fine(x, y, 40, 20, (FXr, FYr) => {
            const lx = FXr - x * S;
            const rx = (x + 40) * S - 1 - FXr;
            const t = Math.abs(FYr - (y + 7) * S) / S;
            if (lx < (6 - t * 0.5) * S) return (FYr + lx) % 4 === 0 ? scaleColor(C.roofTile[3], 0.85) : C.roofTile[3];
            if (rx < (6 - t * 0.5) * S) return (FYr + rx) % 4 === 0 ? scaleColor(C.roofTile[0], 0.85) : C.roofTile[0];
            const k = lx % 4;
            const c = FYr < (y + 7) * S ? C.roofTile[2] : C.roofTile[1];
            return k === 0 ? scaleColor(c, 0.7) : k === 1 ? scaleColor(c, 1.14) : (FYr - y * S) % 5 === 4 ? scaleColor(c, 0.82) : c;
          });
          for (let FXr = (x + 4) * S; FXr < (x + 36) * S; FXr++) {
            img.px(FXr, (y + 7) * S, 0xb0bac8);
            img.px(FXr, (y + 7) * S + 1, 0x95a0b2);
            img.px(FXr, (y + 7) * S + 2, 0x5a6474);
          }
          for (let FXr = x * S + 1; FXr < (x + 40) * S - 1; FXr++) img.px(FXr, (y + 20) * S - 1, (FXr - x * S) % 4 === 1 ? 0x8a96a8 : C.roofTile[3]);
          img.fine(x + 1, y + 20, 38, 10, (FXr, FYr) => {
            const lx = FXr - (x + 1) * S;
            const fy = FYr - (y + 20) * S;
            if (fy < 2) return 0x15100c;
            if (fy < 12) return lx % 18 < 3 ? 0x5a1a14 : (fy + lx) % 2 && fy > 3 && fy < 10 && lx % 18 > 5 && lx % 18 < 16 ? 0xd8c890 : 0xb83a2a; // (blinds upstairs)
            return lx % 18 < 3 ? 0x5a1a14 : fy % 3 === 0 ? 0x8a2a20 : 0xb83a2a;
          });
          // the inuyarai along the foot of the walls
          for (let FXr = (x + 1) * S; FXr < (x + 39) * S; FXr++) {
            if (FXr >= (x + 16) * S && FXr < (x + 24) * S) continue;
            const t = ((FXr - (x + 1) * S) % 15) / 14;
            img.px(FXr, (y + 30) * S - 1 - Math.round(Math.sin(t * Math.PI) * 2), FXr % 2 ? 0xb89a68 : 0xa08050);
            if (FXr % 3 === 0) img.px(FXr, (y + 30) * S, 0x8a6a40);
          }
          for (let FYr = (y + 24) * S; FYr < (y + 30) * S; FYr++) for (let FXr = (x + 16) * S; FXr < (x + 24) * S; FXr++) img.px(FXr, FYr, FYr < (y + 26) * S ? (FXr % 8 === 0 ? 0xb8b0a0 : 0xe8e0d0) : 0x2a1810);
          img.discPx((x + 20) * S, (y + 25) * S, 2, 0x8a2a20);
          chochin(x + 14, y + 22);
          chochin(x + 25, y + 22);
        },
      });
      reserveRect(x - 2, y - 2, 44, 34);
    }
    // Yasaka shrine's vermilion west gate closing the street at the top
    romon(54, Y(536), 72, 24, 12);
    lantern(48, Y(500));
    lantern(130, Y(500));
    machiyaRows(0, 76, 4, k0 - 2);
    machiyaRows(104, W, 4, k0 - 2);
    machiyaRows(0, 76, k1 + 4, 494);
    machiyaRows(104, W, k1 + 4, 494);
    for (let u = 12; u < 520; u += 30) {
      if (u > k0 - 6 && u < k1 + 6) continue;
      lantern(81, Y(u));
      lantern(96, Y(u + 15));
    }
    crowd(82, Y(530), 16, 520, 150, true, 0.4);
    for (const u of [60, 230, 320, 450]) rickshaw(84 + (u % 3 ? 7 : 0), Y(u));
    for (const [x, u] of [[90, 130], [86, 280], [92, 400]]) objects.push(umbrella(x, Y(u), 0xe8452a, 0xb83018));
  }

  // ------------------------------------------------------------ B. the Kamo river (u 540..650)
  {
    const w0 = 556;
    const w1 = 628;
    // the riverside walks of packed sand with footpaths worn into them, stone edges to the water; the river
    // running over a low weir (the water piled white along it, smooth above and broken below), currents,
    // sand bars with grass at the edges
    const weir = (x) => 596 + (x - 90) * 0.12;
    img.fine(0, Y(KAMO[1] - 1), W, KAMO[1] - KAMO[0], (FXr, FYr, x, y) => {
      const u = L - y;
      if (u < w0 || u > w1 + 1) {
        const worn = Math.abs(u - (u < w0 ? 548 : 640)) < 2.2;
        const c = rampColor([0x6a6050, 0x7a705e, 0x8a806c], fbm(x, u, { seed: 23, scale: 4 }) + (hashPx(FXr, FYr, 23) - 0.5) * 0.3 + (worn ? 0.25 : 0), FXr, FYr);
        return hashPx(FXr, FYr, 24) < 0.02 ? 0x9a9078 : c;
      }
      if (u < w0 + 0.7 || u > w1 + 0.3) return (FXr % 7 === 0 ? C.stone[0] : u < w0 + 0.7 ? C.stone[2] : C.stone[1]);
      const n = fbm(x * 0.5, y * 1.6, { seed: 21, scale: 10, octaves: 3 });
      const cur = fbm(FXr * 0.18, FYr * 1.3, { seed: 25, scale: 4, octaves: 2 });
      const dw = u - weir(x);
      let c = rampColor(C.river, 0.15 + n * 0.5 + (cur - 0.5) * 0.25, FXr, FYr);
      if (cur > 0.7) c = C.river[3];
      if (dw > -0.4 && dw < 0.6) c = hashPx(FXr, FYr, 26) < 0.7 ? 0xe8f2f2 : 0xb8d8dc; // (the weir's crest)
      else if (dw < 0 && dw > -4 && hashPx(FXr, FYr >> 1, 27) < 0.35 + dw * 0.08) c = 0xd8ecee; // (white water below it)
      if (u > w1 - 2) c = scaleColor(C.river[0], 0.7);
      return c;
    });
    // fallen petals floating (fine flecks, in drifts)
    for (let i = 0; i < 60; i++) {
      const x = Math.floor(rand() * W);
      const u = w0 + 1 + Math.floor(rand() * (w1 - w0 - 2));
      const c = rand() < 0.5 ? 0xf0b8c8 : 0xd88aa4;
      const pr = rng(i * 37 + 5);
      for (let k = 0; k < 5; k++) img.px(x * S + Math.floor(pr() * 6) - 1, Y(u) * S + Math.floor(pr() * 3), k % 2 ? c : 0xffe6ee);
    }
    reserveRect(0, Y(KAMO[1]), W, KAMO[1] - KAMO[0]);
    flow(w0 + 4, w1 - 4, 1, 600);
    petalRafts(w0 + 8, w1 - 8, 1, 600, 1171);
    // black kites (tobi) wheeling over the river on the warm air, high above the bank (live)
    {
      const kite = (f) => {
        const out = new HiCanvas(11, 7);
        const lift = f ? -1 : 1;
        // the body with its forked tail, the long wings with the pale patches near their tips
        for (let j = 4; j < 17; j++) for (let i = 15; i < 18; i++) out.px(i, j, i === 15 ? 0x4a3828 : j < 6 ? 0x2a1e18 : 0x3a2a22);
        for (const [i, j] of [[14, 17], [13, 18], [18, 17], [19, 18], [15, 17], [17, 17]]) out.px(i, j, 0x3a2a22);
        for (let k = 1; k < 15; k++) {
          const dy = Math.round((k * lift) / 5);
          for (const s of [-1, 1]) {
            const i = 16 + s * (k + 1);
            for (let w = 0; w < (k < 11 ? 3 : 2); w++) out.px(i, 9 + dy + w - (k > 11 ? 1 : 0), k > 9 && k < 12 && w === 1 ? 0x8a7a68 : w === 0 ? 0x5a4434 : 0x4a3828);
          }
        }
        return kit.frame(gradeAt(out, 600));
      };
      kit.wander(90, 600, 70, 70, [kite(0), kite(0), kite(1)], { n: 2, sp: 11, idle: 0, turn: 'rot', fps: 1.5, d: 2.4, a: 0.9 });
    }
    // the turtle stepping stones across the river: shells of rock with the head and four feet carved, moss
    for (let u = w0 + 3; u < w1 - 2; u += 7) {
      const x = 30 + ((u / 7) % 2 ? 2 : 0);
      const y = Y(u);
      const CX = x * S + 1;
      const CY = y * S + 1;
      for (let j = -9; j <= 9; j++)
        for (let i = -11; i <= 11; i++) if (((i + 2) / 10) ** 2 + ((j + 3) / 7.5) ** 2 < 1) img.px(CX + i + 2, CY + j + 3, 0x14282e, 0.5);
      for (let j = -7; j <= 7; j++)
        for (let i = -9; i <= 9; i++) {
          const e = (i / 9) ** 2 + (j / 6.6) ** 2;
          if (e > 1) continue;
          const plate = (Math.floor((i + 9) / 4) + Math.floor((j + 7) / 4)) % 2;
          img.px(CX + i, CY + j, e > 0.8 ? C.stone[0] : i + j < -6 ? C.stone[3] : hashPx(CX + i, CY + j, 61) < 0.12 ? C.moss[1] : plate ? C.stone[2] : C.stone[1]);
        }
      for (let j = -11; j < -7; j++) for (let i = -2; i <= 2; i++) img.px(CX + i, CY + j, j === -11 ? C.stone[3] : C.stone[2]);
      for (const [dx, dy] of [[-10, -4], [10, -4], [-9, 5], [9, 5]]) for (let k = 0; k < 3; k++) img.px(CX + dx + (dx < 0 ? -k % 2 : k % 2), CY + dy + (k >> 1), C.stone[1]);
    }
    crowd(26, Y(w1), 8, w1 - w0, 6, true);
    // Shijō bridge: a deck with pavements and a roadway, railings with their posts, the lamp standards
    objects.push({
      y: Y(KAMO[0] - 4),
      shadow: () => shadowPx(80 * S, (Y(w1) + 3) * S, 26 * S, (w1 - w0) * S, 0.55),
      draw: () => {
        img.fine(79, Y(KAMO[1] + 4), 23, KAMO[1] - KAMO[0] + 9, (FXr) => {
          const k = FXr - 79 * S;
          if (k < 2 || k > 66) return k === 0 || k === 68 ? C.stone[3] : C.stone[2];
          if (k < 4 || k > 64) return 0x2a2a30;
          if (k < 12 || k > 56) return (k % 6 === 0 ? C.stone[1] : C.stone[2]);
          if (k === 12 || k === 56) return C.stone[3];
          return k === 34 ? 0xd8d4c8 : 0x4a4850;
        });
        for (let u = KAMO[0] - 4; u <= KAMO[1] + 4; u++) {
          const y = Y(u);
          if (u % 12 === 0) {
            for (const LX of [78 * S + 1, 101 * S + 1]) {
              for (let j = 0; j < 5; j++) img.px(LX, y * S - j, 0x2a2a30);
              for (let i = -1; i <= 1; i++) img.px(LX + i, y * S - 5, 0x3a3a42);
            }
            glow(79, y - 1, 0xfff0c8, 0.7);
            glow(101, y - 1, 0xfff0c8, 0.7);
          }
        }
        // the people crossing on its pavements (drawn with the bridge, so it doesn't hide them)
        const pr = rng(5401);
        for (let k = 0; k < 34; k++) {
          const X = (pr() < 0.5 ? 82 + pr() * 6 : 93 + pr() * 6) * S;
          const Yy = (Y(KAMO[1] + 2) + pr() * (KAMO[1] - KAMO[0] + 2)) * S;
          personPx(Math.round(X), Math.round(Yy), pr() < 0.2 ? { maiko: true, kimono: pr.pick(KIMONO), orn: true, obi: 0xe8c040 } : { coat: pr.pick([0xd04040, 0x3a6ad0, 0xe8c040, 0xe8e8f0, 0x3a3a4a]), hair: 0x2a2024, face: pr() < 0.5, legs: 0x2a2a34 });
        }
      },
    });
    crowd(81, Y(KAMO[1] + 4), 18, KAMO[1] - KAMO[0] + 8, 30, true, 0.2);
    // Pontochō's summer terraces (noryō-yuka) along the south bank: decks on posts over the water, tatami
    // to sit on, low tables with dishes, paper lanterns along the rail, the diners
    for (const [x0, x1] of [[2, 74], [106, 178]])
      objects.push({
        y: Y(w0) + 1,
        draw: () => {
          img.fine(x0, Y(w0 + 5), x1 - x0, w0 + 6 - KAMO[0], (FXr, FYr, x, y) => {
            const u = L - y;
            const lx = FXr - x0 * S;
            if (u >= w0 + 4) return lx % 12 < 2 ? 0x1a120c : C.wood[1]; // (the posts and the edge over the water)
            if (lx % 36 < 2) return C.wood[0];
            const mat = (lx % 36) - 2;
            if (mat < 30 && u > KAMO[0] + 3 && u < w0 + 3) return mat % 15 === 0 || FYr % 12 === 0 ? 0x2a3424 : FYr % 2 ? 0x8a8456 : 0x7a7448; // (tatami, their dark borders)
            return FYr % 2 ? C.hinoki[1] : C.hinoki[2];
          });
          // on each mat a low lacquered table set with dishes, cushions round it, the diners sitting on them
          const dr = rng(x0 * 13 + 7);
          for (let BX = x0 * S + 2; BX < x1 * S - 34; BX += 36) {
            const TX = BX + 11;
            const TY = Y(w0 - 2) * S + 2;
            for (const [cx, cy] of [[TX - 4, TY + 1], [TX + 14, TY + 1], [TX + 2, TY - 5], [TX + 8, TY + 8]]) for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) img.px(cx + i, cy + j, j === 0 ? 0x4a5aa0 : 0x2a3a7a);
            for (let i = 0; i < 12; i++) for (let j = 0; j < 7; j++) img.px(TX + i, TY + j, j === 0 ? 0x5a2a20 : j === 6 ? 0x140808 : 0x2a1210);
            for (const [i, j, c] of [[2, 2, 0xf4f0e6], [3, 2, 0xf4f0e6], [6, 3, 0xc83a2a], [9, 2, 0x3a6a3a], [5, 4, 0xe8c040], [8, 4, 0xf4f0e6]]) img.px(TX + i, TY + j, c);
            for (const [cx, cy] of [[TX - 4, TY + 1], [TX + 14, TY + 1], [TX + 2, TY - 5], [TX + 8, TY + 8]]) {
              if (dr() < 0.25) continue;
              const c = dr() < 0.4 ? dr.pick(KIMONO) : dr.pick([0x3a3a4a, 0xe8e8f0, 0x3a6ad0, 0xd04040]);
              for (let i = 0; i < 3; i++) {
                img.px(cx + i, cy - 3, 0x2a2024);
                img.px(cx + i, cy - 2, i === 1 ? 0xe8c0a0 : 0x2a2024);
                img.px(cx + i, cy - 1, i === 2 ? scaleColor(c, 0.75) : c);
                img.px(cx + i, cy, i === 2 ? scaleColor(c, 0.75) : c);
              }
            }
          }
          for (let x = x0 + 2; x < x1 - 2; x += 6) chochin(x + 1, Y(w0 + 3), 0xf0e0c0);
        },
      });
    crowd(2, Y(w0 + 2), 72, 12, 24, true);
    crowd(106, Y(w0 + 2), 72, 12, 24, true);
    // couples sitting along the north bank, evenly spaced as they famously do
    for (let x = 4; x < W; x += 9) {
      if (x > 74 && x < 106) continue;
      const a = rand.pick([0xd04040, 0x3a6ad0, 0xe8e8f0, 0x3a3a4a]);
      const b = rand.pick([0xe86a9a, 0xe8c040, 0x3a3a4a]);
      const X = x * S;
      const Yy = Y(w1 + 4) * S;
      for (const [dx, c, hair] of [[0, a, 0x2a2024], [4, b, 0x3a2a20]]) {
        img.px(X + dx, Yy - 2, hair);
        img.px(X + dx + 1, Yy - 2, hair);
        img.px(X + dx, Yy - 1, hair);
        img.px(X + dx + 1, Yy - 1, 0xe8c0a0);
        for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) img.px(X + dx + i - (dx ? 0 : 1), Yy + j, i === 1 ? c : scaleColor(c, 0.85));
        img.px(X + dx, Yy + 3, 0x2a2a34);
        img.px(X + dx + 1, Yy + 4, 0x2a2a34);
      }
      for (let i = -1; i < 8; i++) img.px(X + i, Yy + 5, 0x101418, 0.35);
    }
    // a grey heron and an egret fishing in the shallows, their reflections broken by the current
    for (const [x, u, egret] of [[140, 600, false], [56, 572, true]]) {
      const X = x * S;
      const Yy = Y(u) * S;
      const body = egret ? 0xf4f4f0 : 0x9aa0a8;
      for (let j = 0; j < 6; j++) for (let i = 0; i < 4; i++) if (!(j === 0 && i === 3) && !(j === 5 && i === 0)) img.px(X + i, Yy + j, i === 3 ? scaleColor(body, 0.8) : body);
      for (let j = -3; j < 0; j++) img.px(X + 1, Yy + j, body);
      img.px(X + 1, Yy - 4, egret ? body : 0x2a2a30);
      for (let k = 1; k < 4; k++) img.px(X + 1 + k, Yy - 4, 0xe8c040);
      for (let j = 6; j < 9; j++) {
        img.px(X + 1, Yy + j, 0x3a3a30);
        img.px(X + 3, Yy + j, 0x3a3a30);
      }
      for (let j = 10; j < 15; j += 2) for (let i = 0; i < 4; i++) img.px(X + i + (j % 4 === 0 ? 1 : 0), Yy + j, body, 0.3);
    }
    for (let x = 4; x < W; x += 16) {
      if (x > 64 && x < 112) continue;
      tree('sakura', x + rand() * 4, Y(KAMO[1] + 6 + rand() * 4), 7 + rand() * 2);
    }
  }
  // ------------------------------------------------------------ C. the approach to Fushimi Inari (u 650..1130)
  {
    fillGround(0, Y(SANDO[1]), W, SANDO[1] - SANDO[0], C.gravel, 4, 8);
    paving(70, Y(SANDO[1]), 40, SANDO[1] - SANDO[0]);
    reserveRect(64, Y(SANDO[1]), 52, SANDO[1] - SANDO[0]);
    for (let u = 660; u < 1110; u += 36) {
      lantern(62, Y(u));
      lantern(115, Y(u));
    }
    greatTorii(90, Y(1010) + 13, 36, 38);
    gateSmall(90, Y(720), 12);
    // souvenir shops and food stalls (fox masks, inari-zushi) along the approach
    machiyaRows(22, 58, 664, 1112, [10, 12]);
    machiyaRows(122, 158, 664, 1112, [10, 12]);
    // the stalls' counters: a rack of white fox masks with their red markings, or trays of inari-zushi
    // (golden pouches of fried tofu), a little awning over each
    for (let u = 670; u < 1110; u += 22) {
      for (const x of [59, 119]) {
        if (isRes(x, Y(u))) continue;
        const X = x * S;
        const Yy = Y(u) * S;
        const masks = (u >> 1) % 2;
        for (let i = -1; i < 10; i++) for (let j = -2; j < 0; j++) img.px(X + i, Yy + j, (i >> 1) % 2 ? 0xf2f0ea : C.R1);
        for (let i = 0; i < 9; i++) for (let j = 0; j < 12; j++) img.px(X + i, Yy + j, j === 0 ? C.wood[3] : i === 0 || i === 8 ? C.wood[1] : C.wood[2]);
        for (let k = 0; k < 2; k++)
          for (let m = 0; m < 2; m++) {
            const MX = X + 1 + m * 4;
            const MY = Yy + 2 + k * 5;
            if (masks) {
              for (const [i, j] of [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1], [1, 2]]) img.px(MX + i, MY + j, 0xf4f0e8);
              img.px(MX, MY + 1, C.R1);
              img.px(MX + 2, MY + 1, C.R1);
              img.px(MX + 1, MY + 2, 0x2a2024);
            } else {
              for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) img.px(MX + i, MY + j, j === 0 ? 0xe8b860 : (i + j) % 2 ? 0xc8903a : 0xd8a048);
            }
          }
      }
    }
    // the kerbs along the outer walks: a dressed edge, the shadow of the step
    img.fine(20, Y(SANDO[1] - 1), 2, SANDO[1] - SANDO[0] + 10, (FXr, FYr) => ((FXr - 20 * S) < 3 ? (FYr % 15 === 0 ? C.stone[1] : C.stone[2]) : FXr - 20 * S < 4 ? C.stone[3] : C.stone[0]));
    img.fine(159, Y(SANDO[1] - 1), 2, SANDO[1] - SANDO[0] + 10, (FXr, FYr) => ((FXr - 159 * S) < 3 ? (FYr % 15 === 7 ? C.stone[1] : C.stone[2]) : FXr - 159 * S < 4 ? C.stone[3] : C.stone[0]));
    reserveRect(18, Y(1120), 6, 480);
    reserveRect(157, Y(1120), 6, 480);
    crowd(72, Y(1125), 36, 470, 110, true, 0.15);
    for (const [x, u] of [[40, 690], [140, 760], [34, 900], [146, 1040]]) objects.push(umbrella(x, Y(u)));
  }

  // ------------------------------------------------------------ D. Fushimi Inari shrine (u 1130..1830)
  {
    fillGround(14, Y(1830), 152, 700, C.gravel, 6, 8);
    paving(82, Y(1830), 16, 700);
    reserveRect(10, Y(1830), 160, 700, true);
    // the vermilion tamagaki fence round the precinct: a top rail, posts with black caps, the boards
    img.fine(12, Y(1829), 2, 700, (FXr, FYr) => {
      const k = FXr - 12 * S;
      const post = FYr % 12 < 3;
      return post ? (FYr % 12 === 0 ? C.K : k < 2 ? 0xf06a40 : k < 4 ? C.R1 : C.R3) : k < 2 ? C.R1 : k < 4 ? C.R2 : 0x3a1a10;
    });
    img.fine(167, Y(1829), 2, 700, (FXr, FYr) => {
      const k = FXr - 167 * S;
      const post = FYr % 12 < 3;
      return post ? (FYr % 12 === 0 ? C.K : k < 2 ? 0xf06a40 : k < 4 ? C.R1 : C.R3) : k < 2 ? C.R1 : k < 4 ? C.R2 : 0x3a1a10;
    });
    romon(46, Y(1214), 88, 52, 11);
    fox(64, Y(1142), false);
    fox(111, Y(1142), true);
    lantern(74, Y(1260));
    lantern(103, Y(1260));
    // the gravel of the courtyard raked in fine grooves either side of the walk
    for (let FYr = Y(1830) * S; FYr < Y(1218) * S; FYr += 4)
      for (let FXr = 15 * S; FXr < 166 * S; FXr++) if (FXr < 81 * S || FXr > 99 * S) img.tintPx(FXr, FYr, 0.88);
    // the courtyard worn by the visitors: paler packed tracks across the gravel from the walk to the halls,
    // the water basin, the stage and the racks; stepping stones to the side halls' doors
    const track = (x0, u0, x1, u1, hw) =>
      img.fine(Math.min(x0, x1) - hw - 1, Y(Math.max(u0, u1)) - hw - 1, Math.abs(x1 - x0) + hw * 2 + 2, Math.abs(u1 - u0) + hw * 2 + 2, (FXr, FYr, x, y) => {
        const ax = x - x0;
        const ay = L - y - u0;
        const bx = x1 - x0;
        const by = u1 - u0;
        const t = Math.max(0, Math.min(1, (ax * bx + ay * by) / (bx * bx + by * by || 1)));
        const d = Math.hypot(ax - bx * t, ay - by * t);
        if (d > hw + (hashPx(FXr >> 1, FYr >> 1, 95) - 0.5) * 1.5) return null;
        return [hashPx(FXr, FYr, 96) < 0.06 ? C.gravel[2] : 0x9a927e, 0.55 * (1 - d / (hw + 1))];
      });
    const stepping = (x0, u0, x1, u1) => {
      const n = Math.max(2, Math.round(Math.hypot(x1 - x0, u1 - u0) / 4.5));
      for (let k = 0; k <= n; k++) {
        const t = k / n;
        const CX = (x0 + (x1 - x0) * t) * S;
        const CY = Y(u0 + (u1 - u0) * t) * S;
        for (let j = -4; j <= 4; j++)
          for (let i = -6; i <= 6; i++) {
            const e = (i / 6.2) ** 2 + (j / 4.2) ** 2 + (hashPx(i + k * 31, j, 97) - 0.5) * 0.15;
            if (e <= 1) img.px(Math.round(CX + i), Math.round(CY + j), e > 0.75 ? C.stone[0] : i + j < -3 ? C.stone[3] : C.stone[2]);
          }
      }
    };
    track(98, 1290, 120, 1283, 3);
    track(98, 1366, 128, 1372, 3.5);
    track(82, 1418, 54, 1418, 3);
    track(98, 1497, 130, 1497, 3);
    track(82, 1560, 40, 1600, 2.5);
    track(98, 1650, 150, 1640, 2.5);
    stepping(80, 1316, 44, 1316);
    stepping(100, 1396, 138, 1396);
    hall(22, Y(1352), 40, 26, 7, 'shrine');
    hall(118, Y(1432), 40, 26, 7, 'shrine');
    hall(112, Y(1298), 18, 10, 4, 'shrine'); // (the roof over the chōzuya)
    // the chōzuya: the stone basin full to the brim, the bronze dragon pouring into it, ladles laid across
    {
      const X = 115 * S;
      const Yy = Y(1284) * S;
      for (let j = 0; j < 9; j++) for (let i = 0; i < 36; i++) img.px(X + i, Yy + j, j === 0 ? C.stone[3] : j < 2 || i < 2 || i > 33 ? C.stone[2] : j === 8 ? C.stone[0] : C.water[j < 4 ? 2 : 1]);
      for (let i = 4; i < 32; i += 9) img.px(X + i, Yy + 4, C.water[3]);
      for (let k = 0; k < 4; k++) {
        const LX = X + 6 + k * 7;
        for (let i = 0; i < 5; i++) img.px(LX + i, Yy + 1, 0xc8a870);
        img.px(LX, Yy + 2, 0xa8884e);
        img.px(LX + 1, Yy + 2, 0xa8884e);
      }
      for (let j = -4; j < 1; j++) img.px(X + 18, Yy + j, j < -2 ? 0x3a6a5a : 0x5a8a7a);
      img.px(X + 18, Yy + 2, 0xe8f4f8);
    }
    // ema racks: the shrine's fox-faced plaques (white, each with a face drawn on), and omikuji fortunes
    // folded and tied along strings
    for (const [x0, u] of [[28, 1420], [130, 1500], [26, 1610]])
      objects.push({
        y: Y(u) + 6,
        shadow: () => shadowPx((x0 + 2) * S, (Y(u) + 2) * S, 26 * S, 6 * S, 0.6),
        draw: () => {
          const X = x0 * S;
          const Yy = Y(u) * S;
          const er = rng(x0 * 17 + u);
          for (let i = 0; i < 78; i++) {
            img.px(X + i, Yy, C.wood[3]);
            img.px(X + i, Yy + 1, C.wood[1]);
            img.px(X + i, Yy + 11, C.wood[2]);
            img.px(X + i, Yy + 12, C.wood[0]);
          }
          for (let k = 0; k < 12; k++) {
            const EX = X + 2 + k * 6 + Math.floor(er() * 2);
            const EY = Yy + 2 + Math.floor(er() * 3);
            for (const [i, j] of [[0, 0], [4, 0], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [1, 3], [2, 3], [3, 3], [2, 4]]) img.px(EX + i, EY + j, 0xf4f0e8);
            img.px(EX + 1, EY + 2, C.R1);
            img.px(EX + 3, EY + 2, C.R1);
            img.px(EX + 2, EY + 3, 0x2a2024);
            if (er() < 0.5) img.px(EX + 2, EY + 1, er.pick([0xe8c040, 0x3a6ad0, 0xd04040]));
          }
          for (let i = 0; i < 78; i += 2) {
            img.px(X + i, Yy + 14, 0x8a7a60);
            if (er() < 0.8) {
              img.px(X + i, Yy + 15, 0xf8f6f0);
              img.px(X + i, Yy + 16, er() < 0.5 ? 0xf8f6f0 : 0xe8e4da);
            }
          }
        },
      });
    for (let u = 1748; u < 1815; u += 20) {
      hall(16, Y(u + 12), 10, 7, 3, 'shrine');
      hall(154, Y(u + 12), 10, 7, 3, 'shrine');
    }
    for (const [kind, x, u, r] of [
      ['sakura', 28, 1240, 9],
      ['pine', 30, 1460, 8],
      ['sakura', 151, 1262, 9],
      ['pine', 151, 1350, 7],
      ['sakura', 22, 1530, 9],
      ['sakura', 158, 1536, 9],
    ])
      tree(kind, x, Y(u), r);
    for (let u = 1270; u < 1490; u += 30) {
      lantern(76, Y(u), true);
      lantern(101, Y(u), true);
    }
    // walls of sake barrels offered to the shrine: straw-wrapped casks bound with rope, each with its
    // brewer's label, stacked on a wooden stand
    for (const [x0, u0] of [[16, 1290], [128, 1600]])
      objects.push({
        y: Y(u0) + 12,
        shadow: () => shadowPx((x0 + 3) * S, Y(u0 + 6) * S, 36 * S, 14 * S, 0.55),
        draw: () => {
          const br = rng(x0 * 7 + u0);
          for (let i = 0; i < 34 * S; i++) for (let j = 0; j < 2 * S; j++) img.px(x0 * S + i, Y(u0 + 6) * S + j, j === 0 ? C.wood[3] : j === 5 ? C.wood[0] : C.wood[1]);
          for (let r = 0; r < 3; r++)
            for (let b = 0; b < 8; b++) {
              const BX = (x0 + 1 + b * 4 + (r % 2) * 2) * S;
              const BY = (Y(u0 + 4) + r * 4) * S;
              const c = br.pick([0xe8e0d0, 0xd8402a, 0x2a4a8a, 0xe8c040, 0x2a6a3a]);
              for (let j = 0; j < 12; j++)
                for (let i = 0; i < 12; i++) {
                  if ((i === 0 || i === 11) && (j === 0 || j === 11)) continue;
                  let col = j < 2 ? 0xc8b078 : j > 9 ? 0x8a7848 : (i + j) % 3 === 0 ? 0xb8a068 : 0xd0bc88; // (the straw)
                  if (j === 2 || j === 9) col = 0x5a4a30; // (the rope bands)
                  if (i > 2 && i < 9 && j > 3 && j < 8) col = i === 3 || j === 4 ? scaleColor(c, 1.15) : c;
                  if (i > 0 && i < 11 && j === 11) col = 0x3a3020;
                  img.px(BX + i, BY + j, col);
                }
              glyph(BX + 4, BY + 4, 4, c === 0xe8e0d0 || c === 0xe8c040 ? 0x1a1a1a : 0xf4f0e6, br, (gx, gy, gc) => img.px(gx, gy, gc));
            }
        },
      });
    for (let u = 1600; u < 1700; u += 9) {
      lantern(68, Y(u));
      lantern(110, Y(u));
    }
    // red nobori banners lining the walk, white characters down them, foxes with keys and jewels in their
    // mouths; (live) they flutter: the cloth blown out to the side and back
    const banner = [0, 1, 2].map((f) => {
      const out = new HiCanvas(3, 5);
      for (let j = 0; j < 15; j++) out.px(0, j, 0x2a2a30); // (the pole)
      for (let j = 0; j < 12; j++)
        for (let i = 1; i < 4 + (f ? 2 : 0); i++) {
          const sway = f ? Math.round(Math.sin((j / 12) * Math.PI) * (f === 1 ? 1 : 2)) : 0;
          out.px(i + sway, j + 1, i === 1 ? scaleColor(C.R1, 0.85) : C.R1);
        }
      for (let j = 3; j < 12; j += 3) {
        out.px(2 + (f ? 1 : 0), j, 0xf4f0e6);
        out.px(2 + (f ? 1 : 0), j + 1, 0xf4f0e6);
      }
      return kit.frame(gradeAt(out, 1360));
    });
    for (let u = 1222; u < 1500; u += 6)
      for (const x of [79, 100]) {
        if (pads.some((p) => Math.hypot(p.x - x, Y(p.u) - Y(u)) < 14)) continue;
        for (let k = 0; k < 4; k++) img.px((x + 1) * S + k, (Y(u) + 4) * S + 2, 0x101418, 0.45);
        kit.loop(x, u, banner, { seq: [0, 1, 2, 1], fps: 3 });
      }
    for (const [x, u] of [[30, 1250], [146, 1250], [30, 1500], [146, 1520]]) fox(x, Y(u), x > 90);
    // the kagura stage where the shrine maidens dance: hinoki boards, vermilion posts, two miko in white and
    // red with their bells and fans, a drummer at the back, the curtain of purple
    {
      const x = 126;
      const y = Y(1384);
      img.fine(x, y, 30, 18, (FXr, FYr) => {
        const lx = FXr - x * S;
        const fy = FYr - y * S;
        if (lx < 3 || lx >= 87) return roundShade(0xf06a40, C.R1, C.R3, lx < 3 ? lx : lx - 87, 3);
        if (fy < 3) return fy === 0 ? C.R1 : C.R2;
        if (fy < 8) return (lx % 6 < 3 ? 0x6a3a7a : 0x5a2a6a); // (the curtain)
        return (fy - 8) % 6 === 0 ? C.hinoki[0] : lx % 30 === 0 ? C.hinoki[1] : C.hinoki[2];
      });
      for (const [MX, fan] of [[x * S + 34, C.gold], [x * S + 50, 0xe8452a]]) {
        const MY = (y + 9) * S;
        for (let i = 0; i < 3; i++) {
          img.px(MX + i, MY, 0x141014);
          img.px(MX + i, MY + 1, i === 1 ? 0xf8f0e8 : 0x141014);
          for (let j = 2; j < 5; j++) img.px(MX + i, MY + j, 0xf8f6f0);
          for (let j = 5; j < 9; j++) img.px(MX + i, MY + j, C.R1);
        }
        img.px(MX - 1, MY + 3, 0xf8f6f0);
        img.px(MX + 3, MY + 3, fan);
        img.px(MX + 4, MY + 2, fan);
        img.px(MX + 4, MY + 3, fan);
        img.px(MX - 2, MY + 2, C.gold);
      }
      img.discPx(x * S + 45, (y + 6) * S, 3, 0x8a5a3a);
      img.discPx(x * S + 45, (y + 6) * S, 2, 0xd8c8a0);
      reserveRect(x - 1, y - 1, 32, 20);
    }
    honden(34, Y(1572), 112, 50, 10);
    kohai(72, Y(1508), 36, 12);
    path(1600, 1700, () => 90, 8, 'stairs');
    hall(24, Y(1690), 34, 20, 6, 'shrine');
    hall(124, Y(1740), 34, 20, 6, 'shrine');
    fox(76, Y(1716), false);
    fox(100, Y(1716), true);
    gateSmall(90, Y(1770), 9, false, { rope: true });
    gateSmall(90, Y(1806), 9, false, { rope: true });
    for (let k = 0; k < 260; k++) {
      // visitors all over the courtyard, kept off the turret pads
      const x = 16 + rand() * 148;
      const u = 1136 + rand() * 690;
      if (pads.some((p) => Math.hypot(p.x - x, p.u - u) < 12)) continue;
      crowd(x, Y(u), 1, 1, 1, true, 0.12);
    }
    // sacred trees bound with shimenawa: a thick twisted straw rope round the trunk, zigzag paper streamers
    for (const [x, u] of [[48, 1300], [140, 1660]]) {
      tree('broadleaf', x, Y(u), 8);
      const CX = x * S + 1;
      const CY = (Y(u) + 6) * S;
      for (let a = 0; a < Math.PI * 2; a += 0.05) {
        const X = Math.round(CX + Math.cos(a) * 9);
        const Yy = Math.round(CY + Math.sin(a) * 4.5);
        img.px(X, Yy, Math.floor(a * 6) % 2 ? 0xe8d8a0 : 0xc8b070);
        img.px(X, Yy + 1, 0xa8904e);
      }
      for (const dx of [-6, 0, 6]) for (let j = 0; j < 6; j++) img.px(CX + dx + (j % 2 ? 1 : 0) - (j % 4 === 3 ? 1 : 0), CY + 5 + j, 0xffffff);
    }
    crowd(83, Y(1600), 14, 470, 80, true, 0.15);
  }
  // ------------------------------------------------------------ E. Senbon torii on the ridge (u 1830..2700)
  {
    const split = (u) => 11 * smooth(2140, 2220, u) * (1 - smooth(2500, 2580, u));
    path(TORII[0], TORII[1], pathX, 6);
    tunnelGround(1840, 2140, pathX, 6, 11);
    path(2140, 2580, (u) => pathX(u) - split(u), 5);
    path(2140, 2580, (u) => pathX(u) + split(u), 5);
    tunnelGround(2144, 2576, (u) => pathX(u) - split(u), 5, 12);
    tunnelGround(2144, 2576, (u) => pathX(u) + split(u), 5, 13);
    for (let u = 2230; u < 2490; u++) reserveRect(pathX(u) - 4, Y(u), 9, 1);
    tunnelGround(2580, 2690, pathX, 6, 14);
    // one tunnel until there is room for two side by side, then two until they close up again
    let fork0 = 2140;
    while (split(fork0) < 6.5) fork0++;
    let fork1 = 2580;
    while (split(fork1) < 6.5) fork1--;
    tunnel(1840, fork0, pathX, 9, 11);
    tunnel(fork0 + 6, fork1 - 6, (u) => pathX(u) - split(u), 8, 12);
    tunnel(fork0 + 6, fork1 - 6, (u) => pathX(u) + split(u), 8, 13);
    tunnel(fork1, 2690, pathX, 9, 14);
    // at each mouth of the tunnels: a pair of stone lanterns and a pair of foxes keeping watch
    for (const [u, fx] of [[1832, pathX], [2588, pathX], [2696, pathX], [2136, (uu) => pathX(uu) - split(uu)], [2136, (uu) => pathX(uu) + split(uu)]]) {
      const cx = Math.round(fx(u));
      for (const s of [-1, 1]) {
        if (!isRes(cx + s * 13, Y(u)) && img.alpha(cx + s * 13, Y(u))) lantern(cx + s * 13 - 1, Y(u) - 2);
        if (!isRes(cx + s * 19, Y(u) + 3) && img.alpha(cx + s * 19, Y(u) + 3)) fox(cx + s * 19 - 2, Y(u) + 1, s > 0);
      }
    }
    // stone monuments with offering torii on the slopes
    for (const side of [-1, 1])
      for (let u = 1900; u < 2660; u += 9 + Math.floor(rand() * 6)) {
        const x = Math.round(pathX(u) + side * (16 + rand() * 24));
        const y = Y(u);
        if (isRes(x, y) || !img.alpha(x, y) || rand() < 0.4) continue;
        otsuka(x, y, 3 + Math.floor(rand() * 3), 4 + Math.floor(rand() * 5));
        if (rand() < 0.6) miniGate(x + 2, y + 6, 2 + Math.floor(rand() * 2));
      }
    // between the two tunnels where they part: a strip of moss with little stone foxes and votive torii
    // stacked against the rocks, the offerings people leave
    {
      const vr = rng(1185);
      for (let u = 2236; u < 2486; u += 3) {
        const cx = pathX(u);
        const X = Math.round(cx * S) - 7 + Math.floor(vr() * 12);
        const Yy = Y(u) * S + Math.floor(vr() * 3);
        const k = vr();
        if (k < 0.35) {
          // a miniature torii, a hand high
          for (let j = -2; j < 4; j++) {
            img.px(X, Yy + j, C.R1);
            img.px(X + 4, Yy + j, C.R2);
          }
          for (let i = -1; i < 6; i++) img.px(X + i, Yy - 3, C.K);
          for (let i = 0; i < 5; i++) img.px(X + i, Yy - 1, C.R1);
        } else if (k < 0.5) {
          for (const [i, j] of [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]]) img.px(X + i, Yy + j, 0xd8d2c6);
          img.px(X + 1, Yy + 2, C.R1);
        } else if (k < 0.7) {
          for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) img.px(X + i, Yy + j, j === 0 ? C.stone[3] : C.stone[1]);
        } else for (let i = 0; i < 2; i++) img.px(X + i, Yy, C.moss[3]);
      }
    }
    // live: pilgrims climbing and coming down through the tunnels, glimpsed between the gates; a fox slipping
    // between the stone monuments; shafts of sunlight slanting through the trees on the slopes
    {
      const er = rng(1181);
      const pilgrim = (c) => {
        const out = new HiCanvas(1, 3);
        out.px(0, 0, 0x2a2024);
        out.px(1, 0, 0x2a2024);
        out.px(2, 0, 0x2a2024);
        out.px(1, 1, 0xe8c0a0);
        for (let j = 2; j < 6; j++) for (let i = 0; i < 3; i++) out.px(i, j, i === 2 ? scaleColor(c, 0.75) : c);
        out.px(0, 6, 0x2a2a34);
        out.px(2, 7, 0x2a2a34);
        out.px(0, 8, 0x1a1a20);
        return kit.frame(gradeAt(out, 2260));
      };
      const along = (u0, u1, fx) => {
        const pts = [];
        for (let u = u0; u <= u1; u += 16) pts.push([Math.round(fx(u)), u]);
        return pts;
      };
      const routes = [along(1846, fork0 - 2, pathX), along(fork0 + 10, fork1 - 10, (u) => pathX(u) - split(u)), along(fork0 + 10, fork1 - 10, (u) => pathX(u) + split(u)), along(fork1 + 4, 2684, pathX)];
      for (const [i, pts] of routes.entries())
        for (const c of [0xe8e8f0, 0x3a3a4a, 0xd04040].slice(0, i === 3 ? 1 : 2)) kit.path(pts, [pilgrim(c)], { sp: 3, mode: 'pp', hold: 4, turn: 'none', s0: er() });
      // the fox: russet back, pale throat and belly, black-tipped ears and legs, the white tip of its brush
      const foxF = (f) => {
        const out = new HiCanvas(8, 4);
        for (let j = 3; j < 8; j++) for (let i = 6; i < 18; i++) if (((i - 12) / 6.2) ** 2 + ((j - 5.5) / 2.6) ** 2 < 1) out.px(i, j, j > 6 ? 0xf0d8b8 : j === 3 ? 0xb85a2a : 0xd8783a);
        for (let j = 1; j < 6; j++) for (let i = 17; i < 22; i++) if (((i - 19.5) / 2.6) ** 2 + ((j - 3.5) / 2.3) ** 2 < 1) out.px(i, j, j > 3 && i > 18 ? 0xf0d8b8 : 0xd8783a);
        out.px(18, 0, 0x2a1a14);
        out.px(20, 0, 0x2a1a14);
        out.px(22, 3, 0x2a1a14);
        out.px(20, 2, 0x1a1210);
        for (let i = 0; i < 7; i++) for (let j = 4; j < 7; j++) if (Math.abs(j - 5 + (i < 3 ? 1 : 0)) < 1.6) out.px(i, j, i < 2 ? 0xf4f0e8 : 0xd8783a);
        for (const [i, d] of [[8, f], [10, 1 - f], [15, 1 - f], [17, f]]) for (let j = 8; j < 10 + d; j++) out.px(i + (f && j > 8 ? 1 : 0), j, 0x3a2a20);
        return kit.frame(gradeAt(out, 2350));
      };
      kit.wander(pathX(2350) - 30, 2350, 10, 160, [foxF(0), foxF(1)], { n: 1, sp: 7, idle: 0.5, turn: 'flip', fps: 6 });
      const shaft = (len) => {
        const out = new HiCanvas(len, Math.ceil(len * 0.6) + 4);
        for (let K = 0; K < len * S; K++)
          for (let w = 0; w < 4 * S; w++) {
            const t = K / (len * S);
            const edge = Math.min(w, 4 * S - 1 - w) / (2 * S);
            out.px(K, Math.round(K * 0.6) + w, 0xfff2d0, Math.min(1, edge * 1.6) * 0.75 * (1 - t) ** 0.5);
          }
        return kit.frame(out);
      };
      const shafts = [shaft(26), shaft(34)];
      const parts = [];
      for (let u = 1880; u < 2680; u += 46) {
        const side = parts.length % 2 ? 1 : -1;
        parts.push([parts.length % 2, Math.round(pathX(u) + side * 24 - (side < 0 ? 26 : 0)), u, er() * 6]);
      }
      kit.wave(shafts, parts, { w: 0.35, a0: 0, a1: 0.32, pw: 2, d: 0.6 });
    }
  }

  // ------------------------------------------------------------ F. Arashiyama (u 2700..3500)
  {
    const [a0] = ARASHI;
    fillGround(0, Y(3260), W, 3260 - a0, C.bambooFloor, 31, 5);
    // the path through the bamboo grove, low brushwood fences (shiba-gaki) on both sides: bundles of twigs
    // bound to rails, a post every so often
    const bx = groveX;
    path(a0, 3262, bx, 6);
    for (let FYr = Y(3262) * S; FYr < (Y(a0) + 1) * S; FYr++) {
      const u = L - FYr / S;
      for (const s of [-1, 1]) {
        const X0 = Math.round((bx(u) + s * 8) * S);
        for (let k = 0; k < 6; k++) {
          const X = X0 + (s > 0 ? k : -k) - (s > 0 ? 2 : -2);
          const post = Math.floor(u) % 6 === 0 && FYr % S === 0;
          const twig = hashPx(X, FYr >> 1, 71);
          let c = k < 4 ? (twig < 0.3 ? 0x8a6e44 : twig < 0.6 ? 0xb89a68 : 0xa08458) : 0x5a4428;
          if (post && k < 4) c = 0x4a3420;
          if (FYr % 9 === 0 && k < 4) c = 0x6a5030; // (the binding rails)
          img.px(X, FYr, k >= 4 ? c : c);
        }
      }
    }
    for (let u = a0; u < 3262; u++) for (const s of [-1, 1]) reserveRect(Math.round(bx(u) + s * 8) - 1, Y(u), 3, 1);
    for (const u of [2780, 3180]) rickshaw(Math.round(bx(u)) - 2, Y(u));
    // live: a rickshaw taking its passengers along the winding path
    {
      const pts = [];
      for (let u = a0 + 20; u <= 3240; u += 16) pts.push([Math.round(bx(u)), u]);
      kit.path(pts, [rickshawFrame(false, 2990)], { sp: 8, mode: 'pp', hold: 3, turn: 'none', fd: [rickshawFrame(false, 2990)], fu: [rickshawFrame(true, 2990)], s0: 0.45 });
    }
    crowd(84, Y(3260), 12, 560, 90, true, 0.25);
    // Tenryū-ji's Sōgenchi garden where the grove ends: the pond with its rock "dragon gate" waterfall and
    // islet pine, raked gravel along the veranda of the abbot's hall, pines and maples round it
    {
      const tr = rng(1201);
      img.fine(0, Y(3262), 76, Y(3168) - Y(3262), (FXr, FYr, x, y) => {
        const v = 0.3 + fbm(x, y, { seed: 1202, scale: 4 }) * 0.5 + (fbm(FXr, FYr, { seed: 1204, scale: 2 }) - 0.5) * 0.3;
        return hashPx(FXr, FYr, 1206) < 0.015 ? C.moss[3] : rampColor(C.moss, v, FXr, FYr);
      });
      reserveRect(0, Y(3264), 78, 98);
      pondAt(38, 3198, 30, 20, C.pond, 1203, C.stone);
      // the rocks: shaded boulders with lichen, set in groups
      for (const [rx, ru, r] of [[18, 3214, 3], [22, 3210, 2], [14, 3208, 2.5], [56, 3186, 2.5], [44, 3192, 2]]) boulderPx(rx * S, Y(ru) * S, Math.round(r * S));
      for (let j = 0; j < 18; j++) img.px(16 * S + 1 + (j % 5 === 0 ? 1 : 0), Y(3214) * S + j, j % 3 ? 0xd8e8e8 : 0xb8d0d4); // the "dragon gate" falls
      for (let i = -3; i <= 3; i++) img.px(16 * S + 1 + i, Y(3214) * S + 18, 0xe8f4f4, 0.6);
      img.fine(44, Y(3204) - 4, 8, 8, (FXr, FYr, x, y) => (Math.hypot(x - 48, y - Y(3204)) < 4 ? rampColor(C.moss, 0.4 + fbm(FXr, FYr, { seed: 1207, scale: 2 }) * 0.5, FXr, FYr) : null)); // the islet
      tree('pine', 48, Y(3206), 4.5);
      // raked gravel along the veranda: long straight lines, every groove a fine shadow and a lit ridge
      img.fine(4, Y(3236), 68, 10, (FXr, FYr) => {
        const k = FYr % 4;
        return k === 0 ? C.whiteGravel[0] : k === 1 ? C.whiteGravel[3] : hashPx(FXr, FYr, 83) < 0.1 ? C.whiteGravel[1] : C.whiteGravel[2];
      });
      hall(6, Y(3260), 64, 16, 6, 'temple');
      for (const [x, u, k] of [[72, 3172, 'pine'], [4, 3176, 'broadleaf'], [70, 3240, 'broadleaf'], [26, 3172, 'sakura']]) tree(k, x, Y(u), 5 + tr() * 2);
    }
    // live: strollers in rented kimono along the bamboo path, and shafts of sunlight slanting through the grove
    {
      const wr = rng(1205);
      const stroller = (c, f) => {
        const out = new HiCanvas(2, 4);
        for (let i = 0; i < 3; i++) out.px(i, 0, 0x141014);
        out.px(1, 1, 0xf0d8c0);
        out.px(0, 1, 0x141014);
        out.px(2, 1, 0x141014);
        out.px(2, 0, f ? 0xf0e0a0 : 0xe86a9a); // (a hair ornament)
        for (let j = 2; j < 9; j++) for (let i = 0; i < 4; i++) if (!(j > 6 && (i === 0 || i === 3))) out.px(i, j, j === 4 ? 0xe8c040 : i === 3 ? scaleColor(c, 0.75) : c);
        out.px(f ? 1 : 2, 9, 0x2a1a14);
        for (let i = 2; i < 6; i++) out.px(i, 10, 0x101418, 0.4);
        return kit.frame(gradeAt(out, 2980));
      };
      for (const c of [KIMONO[0], KIMONO[1], KIMONO[3], KIMONO[4], KIMONO[6]]) {
        const side = wr() < 0.5 ? -2 : 2;
        const pts = [];
        for (let u = a0 + 10; u <= 3250; u += 16) pts.push([Math.round(bx(u)) + side, u]);
        kit.path(pts, [stroller(c, 0), stroller(c, 1)], { sp: 2.5, mode: 'pp', hold: 3, turn: 'none', fps: 3, s0: wr() });
      }
      const beam = (len) => {
        const out = new HiCanvas(len, Math.ceil(len * 0.7) + 4);
        for (let K = 0; K < len * S; K++)
          for (let w = 0; w < 4 * S; w++) {
            const t = K / (len * S);
            const edge = Math.min(w, 4 * S - 1 - w) / (2 * S);
            out.px(K, Math.round(K * 0.7) + w, 0xf8ffd8, Math.min(1, edge * 1.6) * 0.65 * (1 - t) ** 0.6);
          }
        return kit.frame(out);
      };
      const beams = [beam(24), beam(32)];
      const parts = [];
      for (let u = a0 + 40; u < 3150; u += 38) parts.push([parts.length % 2, Math.floor(wr() * 140), u, wr() * 6]);
      kit.wave(beams, parts, { w: 0.3, a0: 0, a1: 0.28, pw: 2, d: 0.6 });
      // the odd dry leaf spiralling down through the grove
      const turning = [0, 1, 2, 3].map((k) => {
        const out = new HiCanvas(3, 3);
        const c = k < 2 ? 0xd4bc60 : 0xb09a48;
        const [dx, dy] = [[1, 0], [1, 1], [0, 1], [-1, 1]][k];
        for (let i = -2; i <= 2; i++) out.px(4 + dx * i, 4 + dy * i, Math.abs(i) === 2 ? scaleColor(c, 0.8) : c);
        return kit.frame(gradeAt(out, 2990));
      });
      const dry = [[...turning, ...turning, ...turning]]; // (an emitter takes variants, each a list of frames over its life)
      for (let u = 2730; u < 3240; u += 34) {
        const side = wr() < 0.5 ? -1 : 1;
        kit.emit(Math.round(bx(u) + side * (6 + wr() * 34)), u + 18, dry, { rate: 0.14, life: [3.5, 5], vy: -5, sx: 7, wf: 1.4, a: 0.9, rise: 0, tint: 1 });
      }
    }
    // Nonomiya shrine: the black torii of unbarked wood, a little hall, a moss garden
    fillGround(126, Y(2990), 50, 70, C.moss, 32, 4);
    reserveRect(124, Y(2992), 54, 74);
    gateSmall(150, Y(2934), 9, true, { span: 11, h: 14 });
    hall(132, Y(2984), 34, 16, 5, 'hondo');
    walk(bx(2916) + 5, 154, 2913, 2918); // its approach, through a gap in the fence and the torii to the hall
    path(2913, 2964, () => 150, 3);
    // the south bank promenade and the Katsura river with Togetsukyō bridge: the water wide and green, the
    // current in long streaks, the stone edge of the bank
    fillGround(0, Y(3330), W, 70, C.gravel, 33, 6);
    img.fine(0, Y(3439), W, 110, (FXr, FYr, x, y) => {
      const u = L - y;
      if (u < 3333) return FXr % 9 === 0 ? C.stone[0] : u < 3331 ? C.stone[2] : C.stone[1];
      const n = fbm(x * 0.5, y * 1.6, { seed: 34, scale: 12, octaves: 3 });
      const cur = fbm(FXr * 0.16, FYr * 1.4, { seed: 36, scale: 4, octaves: 2 });
      let c = rampColor(C.river, 0.2 + n * 0.5 + (cur - 0.5) * 0.25, FXr, FYr);
      if (cur > 0.71) c = C.river[3];
      if (u > 3436) c = scaleColor(C.river[0], 0.7);
      return c;
    });
    reserveRect(0, Y(3440), W, 110);
    flow(3338, 3432, -1, 3390);
    petalRafts(3344, 3426, -1, 3390, 1173);
    // Togetsukyō: the long low bridge, a deck of planks on wooden piers, railings with a post every bay
    objects.push({
      y: Y(3326),
      shadow: () => shadowPx(84 * S, (Y(3440) + 3) * S, 16 * S, 110 * S, 0.55),
      draw: () => {
        img.fine(82, Y(3446), 17, 121, (FXr, FYr, x, y) => {
          const k = FXr - 82 * S;
          const u = L - y;
          if (k < 2 || k > 48) return k === 0 || k === 50 ? C.wood[0] : C.wood[1]; // (the railings)
          if (k < 5 || k > 45) return Math.floor(u) % 8 === 0 && FYr % S < 2 ? C.wood[0] : C.wood[2];
          return FYr % 3 === 0 ? C.hinoki[0] : (FYr >> 2) % 7 === 0 && k % 16 === 0 ? C.hinoki[0] : hashPx(k >> 4, FYr / 3 | 0, 37) < 0.3 ? C.hinoki[2] : C.hinoki[1];
        });
        for (let u = 3326; u <= 3446; u += 8)
          for (const PX of [81 * S, 99 * S]) for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) img.px(PX + i, Y(u) * S + j, j === 0 ? C.wood[3] : C.wood[0]);
        // people strolling over it, rickshaws' passengers looking at the river (drawn with the bridge)
        const pr = rng(5402);
        for (let k = 0; k < 30; k++)
          personPx(Math.round((84 + pr() * 12) * S), Math.round((Y(3444) + pr() * 116) * S), pr() < 0.25 ? { maiko: true, kimono: pr.pick(KIMONO), orn: pr() < 0.5, obi: 0xf4f0e6 } : { coat: pr.pick([0xd04040, 0x3a6ad0, 0xe8e8f0, 0x3a3a4a, 0x6aaa5a]), hair: 0x2a2024, face: pr() < 0.5, legs: 0x2a2a34 });
      },
    });
    crowd(84, Y(3446), 12, 120, 30, true, 0.2);
    // boats on the Katsura (live): a roofed pleasure boat (yakatabune) with lanterns and guests at low tables,
    // and rowing boats with their oars, wakes behind
    for (const [x, u, roofed, x1] of [[30, 3360, true, 60], [130, 3410, false, 158], [110, 3350, false, 158], [8, 3420, false, 62]]) {
      const y = Y(u);
      const f = roofed
        ? capture(x, y - 1, 18, 8, () => {
            img.fine(x, y, 18, 7, (FXr, FYr) => {
              const lx = FXr - x * S;
              const fy = FYr - y * S;
              const hull = Math.abs(lx - 26.5) > 26 - Math.min(fy, 20 - fy) * 0.8;
              if (hull) return null;
              if (fy < 2 || fy > 18 || lx < 2 || lx > 51) return fy < 2 ? 0x8a6a48 : 0x4a3020;
              return 0x6a4a30;
            });
            img.fine(x + 1, y - 1, 16, 5, (FXr, FYr) => {
              const lx = FXr - (x + 1) * S;
              const fy = FYr - (y - 1) * S;
              return fy === 0 ? C.roofTileDark[3] : fy === 14 ? C.roofTileDark[0] : lx % 4 === 0 ? C.roofTileDark[0] : fy < 7 ? C.roofTileDark[2] : C.roofTileDark[1];
            });
            img.fine(x + 2, y + 4, 14, 2, (FXr, FYr) => ((FXr - (x + 2) * S) % 6 === 0 ? 0x3a2a20 : FYr % 2 ? 0xe8d8b0 : 0xd8c8a0));
            for (let k = 0; k < 5; k++) {
              img.px((x + 4) * S + k * 7, (y + 4) * S + 2, 0x2a2024);
              img.px((x + 4) * S + k * 7 + 1, (y + 4) * S + 2, rng(k + x)() < 0.5 ? 0xd04040 : 0x3a6ad0);
            }
            chochin(x + 3, y + 5);
            chochin(x + 14, y + 5);
          })
        : capture(x - 2, y, 14, 6, () => {
            img.fine(x, y + 1, 10, 4, (FXr, FYr) => {
              const lx = FXr - x * S;
              const fy = FYr - (y + 1) * S;
              if (Math.abs(fy - 5.5) > 6 - Math.max(0, Math.abs(lx - 15) - 9) * 0.7) return null;
              return Math.abs(fy - 5.5) > 4.5 - Math.max(0, Math.abs(lx - 15) - 9) * 0.7 ? 0x5a3a20 : lx % 7 === 0 ? 0x6a4628 : 0x9a6a3e;
            });
            for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) img.px((x + 4) * S + i, (y + 2) * S + j, j === 0 ? 0x2a2024 : 0x3a3a4a);
            for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) img.px((x + 6) * S + i + 1, (y + 2) * S + j, j === 0 ? 0x2a2024 : 0xd04040);
            for (let k = 0; k < 8; k++) {
              img.px((x + 5) * S - k, (y + 1) * S - Math.floor(k * 0.3), 0xb89a68); // (the oars)
              img.px((x + 5) * S + 1 - k, (y + 5) * S + 1 + Math.floor(k * 0.3), 0xb89a68);
            }
          });
      const wakeF = [0, 1, 2].map((k) => {
        const w = new HiCanvas(1, (roofed ? 9 : 5) + k * 4);
        for (let j = 0; j < 3; j++) {
          w.px(1, j, 0xd8e8e8, 1 - j * 0.3);
          w.px(1, w.h * S - 1 - j, 0xd8e8e8, 1 - j * 0.3);
        }
        return kit.frame(gradeAt(w, u));
      });
      kit.path([[x + (roofed ? 9 : 5), u - 3], [x1, u - 3]], [f], { sp: roofed ? 3 : 5, mode: 'pp', hold: roofed ? 4 : 2, turn: 'none', wake: { f: wakeF, every: 3, life: 1.6 } });
    }
    // the north bank: cherries, a tea house with red benches and parasols
    fillGround(0, Y(ARASHI[1]), W, 60, C.gravel, 35, 6);
    hall(110, Y(3492), 40, 14, 5, 'machiya');
    // its benches under red felt (mōsen), a tray of dango and tea on each
    for (const BX of [112 * S, 119 * S]) {
      const BY = Y(3470) * S;
      for (let i = 0; i < 18; i++) for (let j = 0; j < 6; j++) img.px(BX + i, BY + j, j === 0 ? 0xf05a3a : j === 5 ? 0x8a1a10 : C.R1);
      for (let i = 0; i < 18; i += 17) for (let j = 6; j < 8; j++) img.px(BX + i, BY + j, C.wood[0]);
      img.px(BX + 5, BY + 2, 0xf4f0e6);
      img.px(BX + 6, BY + 2, 0x6aa050);
      img.px(BX + 7, BY + 2, 0xf8c8d8);
      img.px(BX + 12, BY + 2, 0x3a6a3a);
    }
    tree('sakura', 20, Y(3460), 8);
    tree('sakura', 60, Y(3470), 8);
    objects.push(umbrella(152, Y(3466)));
    crowd(4, Y(3496), 172, 50, 40, false, 0.2);
  }
  // ------------------------------------------------------------ G. Kinkaku-ji (u 3500..4400)
  {
    fillGround(0, Y(KINKAKU[1]), W, KINKAKU[1] - KINKAKU[0], C.moss, 36, 4);
    // the clay wall round the temple grounds: the earthen face streaked by the weather, the tiled cap with
    // its round tiles and their ends along the edge
    img.fine(0, Y(KINKAKU[0] + 9), W, 6, (FXr, FYr, x, y) => {
      if (x >= 132 && x <= 149) return null;
      const r = FYr - Y(KINKAKU[0] + 9) * S;
      if (r < 7) {
        const k = FXr % 4;
        return r === 0 ? C.roofTileDark[3] : r === 6 ? (k === 1 ? C.roofTileDark[3] : C.roofTileDark[0]) : k === 0 ? C.roofTileDark[0] : k === 1 ? C.roofTileDark[3] : C.roofTileDark[2];
      }
      if (r === 7) return 0x2a2226;
      const streak = fbm(FXr * 0.8, FYr * 0.12, { seed: 47, scale: 3 });
      return rampColor(C.earthWall, fbm(x, y * 3, { seed: 46, scale: 3 }) * 0.7 + (streak - 0.5) * 0.4, FXr, FYr);
    });
    reserveRect(0, Y(KINKAKU[0] + 10), W, 6);
    // the gravel walk round the pond
    path(KINKAKU[0], KINKAKU[1], () => 140, 5); // (on into Ryōan-ji)
    img.fine(100, Y(4009), 40, 30, (FXr, FYr) => gravelPx(FXr, FYr, 48));
    reserveRect(100, Y(4010), 40, 30);
    // Kyōko-chi, the mirror pond, with its islands of pines and rocks
    pondAt(60, 3790, 52, 96, C.pond, 37, C.stone);
    for (const [ix, iu, ir] of [[40, 3770, 9], [84, 3730, 6], [30, 3830, 5], [92, 3820, 4], [58, 3716, 4]]) {
      // the islands: a rim of rocks at the waterline, moss over them, a stone or two
      img.fine(ix - ir - 1, Y(iu) - ir - 1, ir * 2 + 3, ir * 2 + 3, (FXr, FYr, x, y) => {
        const d = Math.hypot(x - ix, y - Y(iu)) / ir + (hashPx(FXr >> 1, FYr >> 1, 49) - 0.5) * 0.12;
        if (d > 1) return null;
        if (d > 0.82) return rampColor(C.stone, 0.2 + fbm(FXr, FYr, { seed: 50, scale: 2 }) * 0.7, FXr, FYr);
        return rampColor(C.moss, 0.35 + fbm(FXr, FYr, { seed: 51, scale: 2.5 }) * 0.5 - (x - ix + y - Y(iu)) * 0.02, FXr, FYr);
      });
      tree('pine', ix, Y(iu) - 1, ir * 0.7 + 1.5);
    }
    for (let k = 0; k < 16; k++) {
      const x = 20 + rand() * 80;
      const y = Y(3700 + rand() * 180);
      if (((x - 60) / 50) ** 2 + ((y - Y(3790)) / 90) ** 2 > 0.85) continue;
      boulderPx(Math.round(x * S), Math.round(y * S), 4);
    }
    // the Golden Pavilion on the north shore, and its reflection in the pond: the first storey in plain wood
    // and white plaster with its shutters, the two upper ones covered in gold leaf, the upper with its
    // cusped windows, balconies round them, roofs of cypress bark curving out, the golden phoenix on top
    {
      const cx = 60;
      const y0 = Y(3880);
      const floors = [
        [56, 12, 'wood'],
        [50, 11, 'gold'],
        [34, 10, 'gold'],
      ];
      const roofH = [8, 8, 11];
      const parts = [];
      let y = y0;
      for (let i = 0; i < floors.length; i++) {
        const [ww, fh, st] = floors[i];
        parts.push({ ww, st, wallTop: y - fh, wallBot: y, top: i === floors.length - 1 });
        y = y - fh - roofH[i] + 2;
      }
      const top = y;
      ripple = { x0: cx - 36, x1: cx + 36, y0: y0 + 6, y1: y0 + (y0 - top) + 3 };
      const CXf = cx * S + 1;
      objects.push({
        y: y0 + 2,
        shadow: () => {
          for (const p of parts) shadowPx(Math.round((cx - p.ww / 2) * S) + 8 * S, (p.wallTop + 6) * S, (p.ww + 6) * S, (p.wallBot - p.wallTop + 6) * S, 0.55);
        },
        draw: () => {
          for (let k = parts.length - 1; k >= 0; k--) {
            const { ww, st, wallTop, wallBot, top: last } = parts[k];
            const WX0 = Math.round((cx - ww / 2) * S);
            const WW = ww * S;
            for (let Yy = wallTop * S; Yy < wallBot * S; Yy++)
              for (let i = 0; i < WW; i++) {
                const fy = Yy - wallTop * S;
                const bay = i % 15;
                let c;
                if (st === 'gold') {
                  c = i < 6 ? C.goldHi : i > WW - 6 ? 0xa87a22 : hashPx(WX0 + i, Yy, 88) < 0.06 ? 0xfff6c0 : (i + fy) % 11 === 0 ? 0xf8d870 : C.gold;
                  if (bay < 2) c = i < 6 ? 0xf8e090 : 0xc89a2a; // (the posts)
                  if (last && fy > 6 && fy < 22 && bay > 4 && bay < 13) {
                    // the cusped windows: a bell-shaped opening, dark inside
                    const cxw = bay - 8.5;
                    const shape = fy > 9 + Math.abs(cxw) * 0.9 - (Math.abs(cxw) < 1 ? 2 : 0);
                    if (shape) c = fy > 19 ? 0x6a4a1a : 0x2a1e10;
                  } else if (!last && fy % 12 === 6 && bay > 3 && bay < 14) c = 0x6a4a1a;
                } else {
                  c = bay < 2 ? C.wood[1] : fy < 18 ? (fy % 6 === 0 ? 0xc8beaa : bay % 4 === 0 ? 0xd8d0be : C.white) : (bay + fy) % 3 === 0 ? C.hinoki[0] : C.hinoki[1];
                  if (fy === 17 || fy === 18) c = C.wood[2];
                  if (i > WW - 6) c = scaleColor(c, 0.75);
                }
                img.px(WX0 + i, Yy, c);
              }
            // the balcony rail round the upper storeys
            if (st === 'gold') for (let i = -3; i <= WW + 2; i++) {
              img.px(WX0 + i, wallBot * S - 3, (i & 1) ? 0x8a6a2a : C.goldHi);
              if (i % 4 === 0) img.px(WX0 + i, wallBot * S - 2, 0x8a6a2a);
              img.px(WX0 + i, wallBot * S - 1, 0x6a4a1a);
            }
          }
          for (let k = parts.length - 1; k >= 0; k--) {
            const { ww, wallTop } = parts[k];
            const above = parts[k + 1];
            const RH = roofH[k] * S;
            const eave = wallTop * S + S;
            const botW = (ww + 10) * S;
            const topW = (above ? above.ww : 4) * S;
            for (let X = Math.round((cx - ww / 2) * S); X < Math.round((cx + ww / 2) * S); X++) for (let j = 1; j < 4; j++) img.tintPx(X, eave + j, 0.7 + j * 0.06);
            for (let j = 0; j < RH; j++) {
              const t = j / Math.max(1, RH - 1);
              const hw = (botW / 2) * (1 - t) ** 0.6 + (topW / 2) * (1 - (1 - t) ** 0.6);
              const L0 = Math.round(CXf - hw);
              const L1 = Math.round(CXf + hw);
              for (let X = L0; X < L1; X++) {
                const lx = X - L0;
                const rx = L1 - 1 - X;
                let c = lx < 7 ? C.roofBark[3] : rx < 7 ? C.roofBark[0] : j < 3 ? (j === 0 ? 0x5a4a44 : 0x8a7468) : (j + (X >> 3)) % 3 === 0 ? scaleColor(C.roofBark[1], 0.86) : j % 2 ? C.roofBark[1] : C.roofBark[2];
                if (hashPx(X, eave - j, 89) < 0.04) c = scaleColor(c, 1.15);
                img.px(X, eave - j, c);
              }
              if (j < 3) for (let q = 1; q < 4 - j; q++) {
                img.px(L0 - q, eave - j - q, C.roofBark[3]);
                img.px(L1 - 1 + q, eave - j - q, C.roofBark[1]);
              }
            }
          }
          // the golden phoenix on the top: body, raised wings, the long tail
          const T = top * S;
          for (const [i, j, c] of [[0, 3, C.gold], [0, 2, C.goldHi], [0, 1, C.goldHi], [-1, 1, C.gold], [1, 1, C.gold], [-2, 0, C.goldHi], [2, 0, C.goldHi], [-3, -1, C.gold], [3, -1, C.gold], [0, 0, C.gold], [0, -1, C.goldHi], [0, -2, C.gold], [1, 4, C.gold], [2, 5, 0xc89a2a], [-1, 4, C.gold], [-2, 5, 0xc89a2a]]) img.px(CXf + i, T + j, c);
          for (let j = 4; j < 9; j++) img.px(CXf, T + j, 0x8a6a2a);
          // the reflection: the pavilion mirrored in the water below, rippling
          for (let K = 1; K < (y0 - top + 4) * S; K++) {
            const k = K / S;
            const RY = y0 * S + K;
            const SY = y0 * S - K;
            const ox = Math.round(Math.sin(k * 0.9) * 1.2 * S);
            for (let X = (cx - 36) * S; X < (cx + 37) * S; X++) {
              const q = img.rgbaPx(X + ox, SY);
              if (!q || !isRes(X / S, RY / S)) continue;
              const [r, g, b] = q;
              if (r + g + b <= 330 || (K + X) % 4 === 0 || K % 3 === 2) continue;
              img.px(X, RY, (r << 16) | (g << 8) | b, 0.42 * (1 - k / (y0 - top + 6)));
            }
          }
        },
      });
      reserveRect(cx - 36, top - 4, 72, y0 - top + 8);
      // the landing stage in front: planks on posts over the water
      img.fine(cx - 6, y0 + 1, 12, 5, (FXr, FYr) => ((FYr - (y0 + 1) * S) % 3 === 0 ? C.hinoki[0] : (FXr & 1) ? C.hinoki[1] : C.hinoki[2]));
      for (const PX of [(cx - 6) * S, (cx + 6) * S - 1]) for (let j = 0; j < 4; j++) img.px(PX, (y0 + 6) * S + j, C.wood[0]);
    }
    for (const [x, u] of [[16, 3900], [104, 3896], [110, 3720], [10, 3700]]) lantern(x, Y(u));
    // koi gliding about Kyōko-chi (live): bodies with their patterns, fins out, the tail flicking
    for (const [body, tail] of [[0xf06a20, 0xc84a18], [0xf8f4f0, 0xe83a2a], [0xf0b030, 0xc88a20]]) {
      const koi = (flick) => {
        const out = new HiCanvas(4, 3);
        for (let i = 2; i < 11; i++) for (let j = 3; j < 6; j++) if (Math.abs(j - 4) < 1.5 - (i > 8 ? (i - 8) * 0.4 : 0) - (i < 4 ? (4 - i) * 0.3 : 0)) out.px(i, j, (i + j) % 4 === 0 ? tail : i > 8 ? scaleColor(body, 1.1) : body);
        out.px(10, 4, 0x2a2020);
        for (const [i, j] of [[7, 2], [7, 6]]) out.px(i, j, scaleColor(body, 0.8));
        for (let j = 0; j < 3; j++) out.px(1 - (j === 1 ? 0 : 1), flick ? 2 + j : 4 + j, tail);
        out.px(1, 4, tail);
        return kit.frame(gradeAt(out, 3760));
      };
      kit.wander(68, 3790, 13, 18, [koi(false), koi(true)], { n: 1, sp: 4, idle: 0.3, fps: 3 });
    }
    // the Sōmon entrance gate in the clay wall, the bell tower, the approach
    hall(126, Y(3540), 28, 14, 7, 'temple');
    hall(20, Y(3590), 22, 14, 6, 'temple');
    walk(26, 137, 3564, 3569);
    crowd(132, Y(3600), 16, 60, 30, true, 0.15);
    // the Ryūmon falls: water dropping over a ledge of rock past the carp stone, into a little pool
    {
      const x = 106;
      const y = Y(3800);
      boulderPx(x * S + 4, y * S + 4, 6);
      boulderPx(x * S + 26, y * S + 3, 5);
      for (let j = 6; j < 34; j++) for (const i of [14, 15, 16, 17]) img.px(x * S + i, y * S + j, (j + i * 3) % 5 === 0 ? 0xb8d8e8 : 0xe8f4f8);
      boulderPx(x * S + 17, y * S + 22, 3); // (the carp stone, half under the falling water)
      img.discPx(x * S + 16, (y + 12) * S, 4.5, C.water[2]);
      img.discPx(x * S + 16, (y + 12) * S, 2.5, 0xe8f4f8, 0.6);
      reserveRect(x - 1, y - 1, 12, 15);
    }
    // the Sekka-tei tea house, the abbot's hall, visitors on the walks
    hall(104, Y(4168), 30, 12, 5, 'hondo');
    hall(10, Y(4296), 64, 20, 7, 'temple');
    walk(36, 137, 4262, 4267);
    crowd(135, Y(4380), 10, 870, 70, true, 0.15);
    crowd(100, Y(4008), 40, 26, 30, true, 0.15);
  }

  // ------------------------------------------------------------ H. Ryōan-ji (u 4400..5000)
  {
    fillGround(0, Y(RYOAN[1]), W, RYOAN[1] - RYOAN[0], C.moss, 38, 7);
    path(RYOAN[0], 4880, (u) => 140 + 30 * smooth(4420, 4600, u), 5, 'gravel'); // (to the abbot's hall's east door)
    // Kyōyōchi pond on the way in, with water lilies: round notched pads, the odd pink flower open
    pondAt(80, 4490, 28, 46, C.pond, 39, C.stone);
    for (let k = 0; k < 18; k++) {
      const x = 60 + rand() * 40;
      const y = Y(4450 + rand() * 80);
      if (((x - 80) / 24) ** 2 + ((y - Y(4490)) / 40) ** 2 > 0.8) continue;
      const CX = x * S;
      const CY = y * S;
      const notch = (k * 1.7) % (Math.PI * 2);
      for (let j = -5; j <= 5; j++)
        for (let i = -5; i <= 5; i++) {
          const d = Math.hypot(i, j);
          if (d > 4.8) continue;
          const a = Math.atan2(j, i);
          if (d > 1 && Math.abs(((a - notch + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 0.3) continue;
          img.px(Math.round(CX + i), Math.round(CY + j), d > 4 ? 0x2f6a2a : i + j < -2 ? 0x5a9a4a : 0x3f7a3a);
        }
      if (k % 4 === 0) {
        img.discPx(CX + 0.5, CY + 0.5, 1.8, 0xf8c8d8);
        img.px(Math.round(CX), Math.round(CY), 0xffe860);
      }
    }
    // live: a monk in grey work clothes raking the straight lines at the garden's edge, to and fro
    {
      const monk = (f) => {
        const out = new HiCanvas(9, 5);
        for (let i = 17; i < 21; i++) out.px(i, 0, 0xd8a888); // the shaved head
        for (let i = 17; i < 21; i++) out.px(i, 1, 0xc89878);
        for (let j = 2; j < 10; j++) for (let i = 15; i < 23; i++) if (!(j > 7 && (i < 16 || i > 21))) out.px(i, j, i < 17 ? 0x5a5450 : i > 20 ? 0x3a3430 : 0x4a4440);
        out.px(f ? 16 : 20, 11, 0x2a2420); // the feet
        out.px(f ? 20 : 17, 12, 0x2a2420);
        for (let i = 0; i < 14; i++) out.px(15 - i, 5 + Math.floor(i * 0.55), 0x8a6a44); // the rake's handle
        for (let j = 11; j < 14; j++) for (let i = 0; i < 5; i++) out.px(i, j, j === 11 ? 0x6a5034 : i % 2 ? 0x5a4028 : 0x6a5034); // its head and teeth
        for (let i = 20; i < 26; i++) out.px(i, 13, 0x101418, 0.4);
        return kit.frame(gradeAt(out, 4712));
      };
      kit.path([[30, 4712], [152, 4712]], [monk(0), monk(1)], { sp: 2.5, mode: 'pp', hold: 4, turn: 'flip', fps: 3 });
    }
    // the rock garden: white gravel raked in fine grooves (rings round each group of rocks, long straight
    // lines between), fifteen rocks in five mossy groups, the clay wall
    const gx0 = 22;
    const gx1 = 160;
    const gu0 = 4704;
    const gu1 = 4846;
    const rocks = [
      [46, 4800, [5, 3.5, 3, 2.5, 2]],
      [78, 4766, [4, 2.5]],
      [104, 4810, [4.5, 3, 2.5]],
      [128, 4758, [3.5, 2.5]],
      [146, 4806, [4, 3, 2.5]],
    ];
    img.fine(gx0, Y(gu1 - 1), gx1 - gx0, gu1 - gu0, (FXr, FYr, x, y) => {
      const u = L - y;
      let ring = Infinity;
      for (const [rx, ru] of rocks) ring = Math.min(ring, Math.hypot((x - rx) * 0.9, (u - ru) * 1.2));
      const ph = ring < 22 ? ring * S * 0.75 : FYr * 0.75;
      const k = ((ph % 2) + 2) % 2;
      let c = k < 0.5 ? C.whiteGravel[0] : k < 1 ? C.whiteGravel[3] : C.whiteGravel[2];
      if (hashPx(FXr, FYr, 91) < 0.05) c = C.whiteGravel[1];
      return c;
    });
    for (const [rx, ru, sizes] of rocks) {
      img.fine(rx - 11, Y(ru) - 9, 23, 19, (FXr, FYr, x, y) => {
        if (Math.hypot((x - rx) * 0.9, (y - Y(ru)) * 1.2) >= 9 || fbm(x, y, { seed: 40, scale: 2 }) + (fbm(FXr, FYr, { seed: 42, scale: 1.5 }) - 0.5) * 0.3 <= 0.35) return null;
        return rampColor(C.moss, 0.4 + fbm(FXr, FYr, { seed: 41, scale: 2 }) * 0.5, FXr, FYr);
      });
      sizes.forEach((s, i) => {
        const a = i * 2.2;
        const x = rx + (i ? Math.cos(a) * (4 + i) : 0);
        const y = Y(ru) + (i ? Math.sin(a) * (3 + i) : 0);
        boulderPx(Math.round(x * S), Math.round(y * S), Math.round(s * S));
      });
    }
    // the clay wall along the south and west sides, its face streaked by oil seeping from the clay, the
    // tiled cap over it
    img.fine(gx0 - 4, Y(gu0 - 1), gx1 - gx0 + 4, 8, (FXr, FYr, x, y) => {
      const u = L - y;
      if (u >= gu0 - 2) {
        const k = FXr % 4;
        return k === 0 ? C.roofTileDark[0] : k === 1 ? C.roofTileDark[3] : C.roofTileDark[2];
      }
      const oil = fbm(FXr * 0.5, FYr * 0.08, { seed: 43, scale: 3 });
      return rampColor(C.earthWall, fbm(x, u * 3, { seed: 42, scale: 3 }) * 0.6 - (oil > 0.6 ? 0.35 : 0), FXr, FYr);
    });
    img.fine(gx0 - 4, Y(gu1), 4, gu1 - gu0, (FXr) => {
      const k = FXr - (gx0 - 4) * S;
      return k < 6 ? (k % 3 === 0 ? C.roofTileDark[0] : C.roofTileDark[2]) : k < 9 ? C.earthWall[0] : C.earthWall[1];
    });
    reserveRect(gx0 - 4, Y(gu1), gx1 - gx0 + 4, gu1 - gu0 + 8);
    // the abbot's hall: visitors sitting on the veranda, looking at the garden
    img.fine(gx0, Y(gu1 + 7), gx1 - gx0, 8, (FXr, FYr) => (FYr % 6 === 0 ? C.hinoki[0] : (FXr >> 4) % 2 && FYr % 6 === 3 ? C.hinoki[1] : C.hinoki[2]));
    for (let x = gx0 + 2; x < gx1 - 2; x += 3) if (rand() < 0.7) crowd(x, Y(gu1 + 3), 1, 2, 1, true);
    reserveRect(gx0, Y(gu1 + 8), gx1 - gx0, 8);
    hall(gx0, Y(4892), gx1 - gx0, 30, 8, 'temple');
    crowd(136, Y(4480), 10, 80, 12, true, 0.1);
    crowd(166, Y(4880), 9, 280, 28, true, 0.1);
  }
  // ------------------------------------------------------------ I. Kiyomizu-dera (u 5000..6300)
  {
    fillGround(0, Y(5420), W, 420, [0x3a3634, 0x46423e, 0x524e48], 43, 4);
    // Sannenzaka: stone steps winding up between shops
    const sx = (u) => 90 + 16 * Math.sin((u - 5000) / 60) * (1 - smooth(5320, 5400, u)); // (straightening out to meet the gate's steps)
    // Gojō-zaka: the stone-paved street across the foot of the hill that the steps go up from
    paving(0, Y(5001), W, 12);
    img.fine(0, Y(4990), W, 1, (FXr, FYr) => (FYr % 3 === 1 ? C.stone[3] : C.stone[0]));
    img.fine(0, Y(5001), W, 1, (FXr, FYr) => (FYr % 3 === 1 ? C.stone[3] : C.stone[0]));
    reserveRect(0, Y(5004), W, 18);
    crowd(0, Y(4999), W, 7, 26, true, 0.3);
    path(5002, 5400, sx, 7, 'stairs');
    // the kerbstones either side of the steps
    for (let FYr = Y(5400) * S; FYr < Y(5000) * S; FYr++) {
      const c = sx(L - FYr / S);
      for (const s of [-1, 1]) {
        const X = Math.round((c + s * 8) * S) + 1;
        img.px(X - 1, FYr, C.stone[3]);
        img.px(X, FYr, FYr % 15 === 0 ? C.stone[0] : C.stone[2]);
        img.px(X + 1, FYr, C.stone[0]);
      }
    }
    machiyaRows(0, 180, 5004, 5396, [11, 14]);
    // pottery shops: kiyomizu-yaki laid out on tables in front: bowls, cups, a vase, each glazed with its
    // highlight
    for (let u = 5016; u < 5390; u += 14)
      for (const s of [-1, 1]) {
        const x = Math.round(sx(u) + s * 11);
        if (isRes(x, Y(u)) && !isRes(x, Y(u) + 3)) continue;
        const X = x * S;
        const Yy = Y(u) * S;
        for (let i = -1; i < 13; i++) for (let j = 0; j < 4; j++) img.px(X + i, Yy + j, j === 0 ? C.wood[3] : j === 3 ? C.wood[0] : C.wood[2]);
        for (let k = 0; k < 4; k++) {
          const c = rand.pick([0x3a6aa8, 0xe8e0d0, 0x5a8a6a, 0xa86a3a, 0x2a2a3a]);
          const PX = X + k * 3;
          if (k === 2) {
            for (let j = -4; j < 1; j++) for (let i = 0; i < 2; i++) img.px(PX + i, Yy + j, j === -4 ? scaleColor(c, 0.7) : i === 0 ? scaleColor(c, 1.25) : c);
          } else {
            img.px(PX, Yy, c);
            img.px(PX + 1, Yy, scaleColor(c, 1.3));
            img.px(PX, Yy + 1, scaleColor(c, 0.75));
            img.px(PX + 1, Yy + 1, c);
          }
        }
      }
    for (let u = 5010; u < 5395; u += 20) {
      chochin(Math.round(sx(u)) - 8, Y(u), 0xe8452a);
      chochin(Math.round(sx(u + 10)) + 8, Y(u + 10), 0xe8452a);
    }
    crowd(70, Y(5400), 40, 400, 140, false, 0.35);
    for (const u of [5080, 5260]) objects.push(umbrella(Math.round(sx(u)) + 10, Y(u), 0x2a4a8a, 0x1a2a5a));
    // the gate courtyard: the vermilion Niōmon, the west gate, the three-storey pagoda
    fillGround(0, Y(5560), W, 140, C.gravel, 44, 6);
    path(5400, 5426, () => 90, 10, 'stairs');
    romon(58, Y(5470), 64, 24, 10, { tiles: true, guards: 'nio' }); // Niōmon
    // the komainu guardians in front of it: stone lion-dogs with curled manes, one with its mouth open
    // (a), one with it shut (un)
    const komainu = (x, y, flip) => {
      const X = x * S;
      const Yy = y * S;
      const f = (i) => (flip ? X + 11 - i : X + i);
      objects.push({
        y: y + 6,
        shadow: () => shadowPx(X + 3, Yy + 6, 15, 15, 0.55),
        draw: () => {
          for (let i = -3; i < 15; i++)
            for (let j = 9; j < 21; j++) img.px(X + i, Yy + j, j === 9 ? C.stone[3] : j < 12 ? C.stone[2] : i === -3 ? C.stone[2] : i === 14 ? C.stone[0] : (j - 12) % 4 === 3 ? C.stone[0] : C.stone[1]);
          const body = 0xa8a49a;
          for (let j = 1; j < 10; j++) for (let i = 0; i < 11; i++) if (((i - 5.5) / 5.2) ** 2 + ((j - 6) / 4.6) ** 2 < 1) img.px(f(i), Yy + j, i < 3 ? 0xc8c4b8 : i > 8 ? 0x86827a : body);
          // the mane: tight curls round the head
          for (let j = -4; j < 4; j++) for (let i = 1; i < 10; i++) if (((i - 5) / 4.4) ** 2 + ((j + 0.5) / 3.8) ** 2 < 1) img.px(f(i), Yy + j, (i + j) % 3 === 0 ? 0x6e6a62 : (i + j) % 3 === 1 ? 0xb8b4aa : body);
          img.px(f(3), Yy - 1, 0x2a2826);
          img.px(f(7), Yy - 1, 0x2a2826);
          if (!flip) for (let i = 4; i < 7; i++) img.px(f(i), Yy + 2, 0x4a2a24); // (the open mouth)
          else for (let i = 4; i < 7; i++) img.px(f(i), Yy + 2, 0x6e6a62);
          for (const [i, j] of [[1, 9], [9, 9], [2, 10], [8, 10]]) img.px(f(i), Yy + j, 0x86827a);
          for (const [i, j] of [[11, 3], [12, 2], [12, 4], [13, 3]]) img.px(f(i), Yy + j, 0x6e6a62); // (the curly tail)
        },
      });
      reserveRect(x - 2, y - 2, 9, 10);
    };
    komainu(68, Y(5432), false);
    komainu(108, Y(5432), true);
    romon(14, Y(5520), 34, 16, 8, { tiles: true }); // Saimon
    hall(110, Y(5536), 18, 12, 6, 'shrine'); // the bell tower
    for (let u = 5440; u < 5550; u += 18) {
      lantern(52, Y(u));
      lantern(126, Y(u));
    }
    pagoda(146, 5500, 3, { w0: 26, step: 4, floorH: 7, roofH: 6, wall: 'vermilion', ramp: C.roofTileDark });
    crowd(4, Y(5556), 172, 80, 70, false, 0.25);
    // Otowa falls: under a little roof, three streams pour off the end of bamboo pipes jutting from the rock
    // into the pool, a queue with long-handled ladles
    {
      const x = 30;
      const y = Y(5612);
      img.fine(x - 6, y - 10, 34, 10, (FXr, FYr) => {
        const r = FYr - (y - 10) * S;
        if (r < 6) return r === 0 ? C.roofTileDark[3] : (FXr % 4 === 0 ? C.roofTileDark[0] : r < 3 ? C.roofTileDark[2] : C.roofTileDark[1]);
        if (r === 6) return 0x1a1418;
        return rampColor(C.stone, 0.15 + fbm(FXr, FYr, { seed: 57, scale: 2.5 }) * 0.6, FXr, FYr);
      });
      for (const k of [4, 11, 18]) for (let j = -5; j < -1; j++) img.px((x + k) * S + 1, y * S + j * 3, 0x9ab06a); // (the pipes, end on)
      img.fine(x - 4, y, 30, 6, (FXr, FYr) => {
        const r = FYr - y * S;
        if (r < 2) return C.stone[r ? 1 : 3];
        const ripple = fbm(FXr * 0.5, FYr, { seed: 58, scale: 2 });
        return ripple > 0.68 ? C.water[3] : r > 15 ? C.stone[1] : C.water[r < 6 ? 1 : 2];
      });
      // the three streams running (live), rings spreading in the pool where they land
      const falls = [0, 1, 2].map((f) =>
        capture(x + 4, y - 8, 15, 10, () => {
          for (const k of [4, 11, 18])
            for (let J = -8 * S; J < 2 * S; J++)
              for (let i = 0; i < 2; i++) img.px((x + k) * S + i, y * S + J, (J + 30 - f * 3) % 7 < 2 ? 0xb8d8e8 : i ? 0xd8ecf2 : 0xf0f8fa);
        }),
      );
      kit.loop(x + 4, U(y - 8), falls, { fps: 9 });
      const ringF = [1, 2, 3].map((r) => {
        const out = new HiCanvas(7, 3);
        for (let a = 0; a < Math.PI * 2; a += 0.06) out.px(Math.round(10.5 + Math.cos(a) * r * 3), Math.round(4.5 + Math.sin(a) * r * 1.2), C.water[3], 1 - r * 0.2);
        return kit.frame(gradeAt(out, 5612));
      });
      kit.spot([[x - 2, U(y + 1), 26, 3]], ringF, { rate: 3, fps: 5, a: 0.8 });
      reserveRect(x - 6, y - 12, 34, 20);
      crowd(x - 4, y + 7, 30, 4, 18, true, 0.2);
      for (let k = 0; k < 6; k++) for (let i = 0; i < 7; i++) img.px((x - 2) * S + k * 13 + i, (y + 6) * S + 1 - Math.floor(i / 3), i === 0 ? 0xd8c8a0 : 0xb89a68); // (ladles held out)
    }
    // the valley of cherries under the stage, the three-storey Koyasu pagoda across it
    pagoda(150, 5600, 3, { w0: 18, step: 3, floorH: 5, roofH: 5, wall: 'vermilion', ramp: C.roofTileDark });
    // the great stage: a deck of hinoki boards on a lattice of huge keyaki pillars and tie-beams over the slope
    {
      const x0 = 22;
      const x1 = 158;
      const lat0 = 5690;
      const deck0 = 5724;
      const deck1 = 5756;
      objects.push({
        y: Y(lat0),
        shadow: () => shadowPx((x0 + 6) * S, (Y(lat0) - 2) * S, (x1 - x0) * S, 12 * S, 0.5),
        draw: () => {
          img.fine(x0, Y(deck0 - 1), x1 - x0, deck0 - lat0, (FXr, FYr) => {
            const px = (FXr - x0 * S) % 18;
            const fy = FYr - Y(deck0 - 1) * S;
            const beam = fy % 27;
            if (beam < 4) return beam === 0 ? C.wood[3] : beam === 3 ? 0x140e0a : beam === 1 ? C.wood[2] : C.wood[1];
            if (px < 7) return roundShade(C.wood[3], C.wood[2], C.wood[0], px, 7);
            if (px === 7) return 0x0a0806;
            // the shadows between the pillars, the slope and the treetops glimpsed far below
            const deep = fbm(FXr, FYr, { seed: 59, scale: 3 });
            return deep > 0.62 ? 0x1e2a18 : deep > 0.55 ? 0x182014 : 0x120c08;
          });
          img.fine(x0, Y(deck1 - 1), x1 - x0, deck1 - deck0, (FXr, FYr) => {
            const fy = FYr - Y(deck1 - 1) * S;
            const rows = (deck1 - deck0) * S;
            if (fy >= rows - 6) return fy >= rows - 2 ? C.wood[0] : (FXr % 12 < 2 ? C.wood[0] : fy === rows - 6 ? C.wood[3] : C.wood[1]); // (the front rail)
            if (fy % 4 === 0) return C.hinoki[0];
            return ((FXr + (Math.floor(fy / 4) * 37)) % 61 === 0) ? C.hinoki[0] : hashPx(FXr >> 3, fy >> 2, 60) < 0.25 ? C.hinoki[3] : hashPx(FXr, FYr, 61) < 0.05 ? C.hinoki[1] : C.hinoki[2];
          });
          for (let FXr = x0 * S; FXr < x1 * S; FXr++) for (let j = 1; j < 10; j++) img.tintPx(FXr, Y(lat0) * S + j, 0.7 + j * 0.03);
          // the visitors on the deck, crowding the rail for the view over the valley
          const vr = rng(5757);
          for (let k = 0; k < 110; k++) {
            const nearRail = k < 45;
            const X = Math.round((x0 + 3 + vr() * (x1 - x0 - 6)) * S);
            const Yy = nearRail ? Y(deck0 + 4) * S - Math.floor(vr() * 6) : Math.round((Y(deck1 - 3) + vr() * (deck1 - deck0 - 10)) * S);
            const maiko = vr() < 0.25;
            if (maiko) personPx(X, Yy, { maiko: true, kimono: vr.pick(KIMONO), orn: vr() < 0.5, obi: vr.pick([0xe8c040, 0x2a2a6a, 0xf4f0e6, 0xc83a3a]) });
            else personPx(X, Yy, { coat: vr.pick([0xd04040, 0x3a6ad0, 0xe8c040, 0xe8e8f0, 0x6aaa5a, 0x3a3a4a, 0x2a3040]), hair: vr.pick([0x2a2024, 0x1a1418, 0x3a2a20]), face: vr() < 0.5, legs: 0x2a2a34 });
          }
        },
      });
      reserveRect(x0, Y(deck1), x1 - x0, deck1 - lat0);
      crowd(x0 + 4, Y(deck1 - 2), x1 - x0 - 8, 26, 90, true, 0.3);
      // the two small wing pavilions on the stage
      hall(x0, Y(deck1 + 14), 20, 10, 4, 'hondo');
      hall(x1 - 20, Y(deck1 + 14), 20, 10, 4, 'hondo');
      // the main hall: a vast cypress-bark roof over plain wood
      honden(30, Y(5812), 120, 40, 10, { wood: true });
    }
    // Okunoin's small stage and the Jishu love shrine
    hall(126, Y(5900), 44, 16, 6, 'hondo');
    hall(16, Y(5880), 36, 16, 6, 'shrine');
    crowd(10, Y(5930), 160, 100, 50, false, 0.2);
    path(5812, 5930, () => 90, 5, 'gravel'); // from behind the main hall
    walk(30, 152, 5846, 5851);
    path(5846, 5857, () => 34, 3); // to the Jishu shrine
    path(5846, 5877, () => 148, 3); // to Okunoin
    crowd(86, Y(5930), 8, 118, 10, true, 0.25);
    path(5930, 6300, (u) => 90 + 12 * Math.sin(((u - 5930) * Math.PI) / 185), 5, 'gravel'); // (meets the mountain path)
  }

  // ------------------------------------------------------------ J. the Daimonji mountain at dusk (u 6300..7168)
  {
    path(6300, L, (u) => 90 + 10 * Math.sin((u - 6300) / 110), 5, 'gravel');
    // the 大 laid out in fire beds on a clearing of the slope
    const strokes = [
      [[30, 6676], [150, 6676]],
      [[90, 6820], [84, 6720], [62, 6580], [34, 6450]],
      [[92, 6676], [114, 6580], [146, 6450]],
    ];
    const beds = [];
    for (const s of strokes)
      for (let i = 0; i < s.length - 1; i++) {
        const [ax, au] = s[i];
        const [bx, bu] = s[i + 1];
        const n = Math.ceil(Math.hypot(bx - ax, bu - au) / 4);
        for (let k = 0; k <= n; k++) {
          const t = k / n;
          beds.push([ax + (bx - ax) * t, au + (bu - au) * t]);
        }
      }
    // the clearing: grass worn down to earth along the strokes, tufts at the edges, scorched patches
    for (const [bx, bu] of beds)
      img.fine(bx - 9, Y(bu) - 9, 19, 19, (FXr, FYr, x, y) => {
        const d = Math.hypot(x - bx, y - Y(bu));
        if (d > 9 || !img.alphaPx(FXr, FYr) || isRes(x, y)) return null;
        const v = 0.3 + fbm(x, y, { seed: 45, scale: 3 }) * 0.6 + (hashPx(FXr, FYr, 62) - 0.5) * 0.25;
        if (d > 7.5 && hashPx(FXr, FYr, 63) < 0.3) return 0x4a5a2a;
        return d < 3 && hashPx(FXr >> 1, FYr >> 1, 64) < 0.3 ? 0x2a221a : rampColor([0x5a4a30, 0x6a5a3a, 0x7a6a44, 0x8a7a50], v, FXr, FYr);
      });
    for (const [bx, bu] of beds) reserveDisc(bx, Y(bu), 8);
    const pyres = [];
    for (const [bx, bu] of beds)
      for (const dx of [-4, 0, 4]) {
        const x = Math.round(bx + dx);
        const y = Y(bu);
        if (!img.alpha(x, y)) continue;
        pyres.push([x, y]);
        pyreKeepers.push([x, y]);
        objects.push({
          y: y + 2,
          draw: () => {
            // a pyre of pine logs stacked crosswise (igeta), the ends charred
            const X = x * S - 2;
            const Yy = y * S - 1;
            for (let j = 0; j < 6; j++)
              for (let i = 0; i < 7; i++) {
                const log = j % 2 === 0 ? true : i % 3 === 0;
                if (!log) continue;
                img.px(X + i, Yy + j, i === 0 || i === 6 ? 0x1a120c : j % 2 === 0 ? (i < 3 ? 0x6a4428 : 0x5a3a24) : 0x4a2e1c);
              }
            glowPx(X + 3, Yy + 2, 0xffa040, 0.85);
            glowPx(X + 2, Yy + 3, 0xff7a20, 0.6);
          },
        });
      }
    // the fires flicker: every pyre in a stretch of the slope in four frames, each flame different, tongues
    // of fire in fine pixels, dark red at the roots, white-gold at the tips, sparks over them
    for (let y0 = Y(L); y0 < Y(6300); y0 += 64) {
      const here = pyres.filter(([, y]) => y >= y0 && y < y0 + 64);
      if (!here.length) continue;
      const pr = rng(y0);
      const fx0 = Math.min(...here.map(([x]) => x)) - 2;
      const fx1 = Math.max(...here.map(([x]) => x)) + 2;
      const flames = [0, 1, 2, 3].map(() =>
        capture(fx0, y0 - 6, fx1 - fx0 + 1, 72, () => {
          for (const [x, y] of here) {
            const X = x * S + 1;
            const Yy = y * S;
            for (let t = 0; t < 3; t++) {
              const h = 4 + Math.floor(pr() * 6);
              const lean = (pr() - 0.5) * 0.5;
              const tx = X - 2 + t * 2;
              for (let j = 0; j < h; j++) {
                const k = j / h;
                const c = k < 0.25 ? 0xd8401a : k < 0.55 ? 0xff8a20 : k < 0.85 ? 0xffc850 : 0xfff4c0;
                glowPx(tx + Math.round(lean * j), Yy - j, c, 0.95 - k * 0.2);
                if (k < 0.5) glowPx(tx + Math.round(lean * j) + 1, Yy - j, k < 0.25 ? 0xb83010 : 0xff7a20, 0.8);
              }
            }
            glowPx(X, Yy + 1, 0xffb040, 0.7);
            if (pr() < 0.3) glowPx(X + Math.round((pr() - 0.5) * 6), Yy - 11 - Math.floor(pr() * 4), 0xffe080, 0.8); // a spark
          }
        }),
      );
      kit.loop(fx0, U(y0 - 6), flames, { fps: 7, fx: 1 });
    }
    // smoke drifting up off the strokes (live)
    const smoke = [2, 3, 4, 5, 6].map((r) => [0, 1].map((v) => kit.frame(puff(r * S, r * 13 + v + 5, [0x4a4450, 0x5e5864, 0x787280, 0x948e9c]))));
    for (let i = 0; i < pyres.length; i += 28) {
      const [x, y] = pyres[i];
      kit.emit(x, U(y) + 3, smoke, { rate: 0.9, life: [3, 4], vy: 7, sx: 1, wf: 0.8, a: 0.4, tint: 1 });
    }
    // live: the fire-keepers carrying torches up the path in a line, and embers flying up off the beds
    {
      const torch = (f) => {
        const out = new HiCanvas(3, 6);
        // the bearer in white, a headband, dark against the dusk, the torch held up on a pole
        for (let i = 2; i < 5; i++) out.px(i, 9, 0x1a1418);
        out.px(3, 10, 0xe8e0d0);
        for (let j = 11; j < 15; j++) for (let i = 2; i < 5; i++) out.px(i, j, i === 4 ? 0x9a948a : 0xd8d2c6);
        out.px(2, 15, 0x2a2024);
        out.px(4, 16, 0x2a2024);
        for (let i = 1; i < 6; i++) out.px(i, 17, 0x0a0a10, 0.4);
        for (let j = 3; j < 12; j++) out.px(6, j, 0x5a3a24);
        for (let j = 0; j < 4; j++) for (let i = 5; i < 8; i++) if (!(j === 0 && i !== 6)) out.px(i + (f && j < 2 ? 1 : 0) - 0, j + 1, j < 1 ? 0xfff4c0 : j < 2 ? 0xffc850 : 0xff8a20);
        return kit.frame(out);
      };
      const tp = [];
      for (let u = 6310; u <= 6900; u += 18) tp.push([Math.round(90 + 10 * Math.sin((u - 6300) / 110)) + 3, u]);
      kit.path(tp, [torch(0), torch(1)], { sp: 3, n: 7, gap: 13, mode: 'pp', hold: 6, turn: 'none', fps: 5, fx: 1 });
      const ember = [0, 1, 2, 3, 4, 5].map((k) => {
        const out = new HiCanvas(3, 9);
        const X = 4 + (k % 2 ? 2 : 0) - (k > 3 ? 2 : 0);
        const Yy = 24 - k * 4;
        out.px(X, Yy, k < 2 ? 0xffe080 : k < 4 ? 0xff9a30 : 0xc84a20, k < 5 ? 1 : 0.5);
        if (k < 3) out.px(X, Yy + 1, 0xff7a20, 0.5);
        return kit.frame(out);
      });
      const rects = [];
      for (const st of strokes)
        for (let i = 0; i < st.length - 1; i++) {
          const [ax, au] = st[i];
          const [bx2, bu] = st[i + 1];
          rects.push([Math.min(ax, bx2) - 2, Math.max(au, bu) + 8, Math.abs(bx2 - ax) + 4, Math.abs(bu - au) + 8]);
        }
      kit.spot(rects, ember, { rate: 7, fps: 8, a: 0.95 });
    }
    // the little hall at the top of the 大, visitors waiting for dark
    const sc = 90;
    hall(sc - 22, Y(6930), 44, 18, 6, 'temple');
    crowd(sc - 30, Y(6880), 60, 40, 40, false, 0.15);
    gateSmall(sc, Y(6884), 9);
    for (const [x, u] of [[60, 6900], [118, 6900]]) lantern(x, Y(u));
  }

  // ------------------------------------------------------------ turret pads from the wave file
  // (a round stone platform: gravel inside a ring of cut granite blocks, each block lit on top)
  for (const p of pads) {
    const y = Y(p.u);
    const x = p.x;
    img.fine(x - 10, y - 10, 21, 21, (FXr, FYr, xx, yy) => {
      const d = Math.hypot(xx - x, yy - y);
      if (d > 10) return null;
      if (d > 8.5) {
        const a = Math.atan2(yy - y, xx - x);
        const seg = Math.abs(((a / (Math.PI * 2)) * 18 + 18) % 1 - 0.5) > 0.46;
        return seg ? 0x2a282c : d > 9.6 ? C.stone[0] : yy < y ? C.stone[3] : C.stone[1];
      }
      return d > 8 ? 0x2a2826 : gravelPx(FXr, FYr, 2);
    });
  }

  // ------------------------------------------------------------ hanami: picnics on blue tarps under the sakura
  // (Arashiyama's river bank, the valley below Kiyomizu): people sitting round the edge, bento boxes and cups
  // in the middle, shoes left at the edge, a cherry tree spreading over each
  {
    const hr = rng(1191);
    let n = 0;
    for (let tries = 0; tries < 600 && n < 9; tries++) {
      const [ua, ub] = [[3262, 3330], [3440, 3496], [5040, 5300], [5640, 6240]][tries % 4];
      const x = 10 + Math.floor(hr() * (W - 30));
      const y = Y(ua + Math.floor(hr() * (ub - ua)));
      let ok = true;
      for (let yy = y - 9; yy < y + 17 && ok; yy++) for (let xx = x - 9; xx < x + 20 && ok; xx++) if (isRes(xx, yy) || !img.alpha(xx, yy)) ok = false;
      if (!ok) continue;
      const X = x * S;
      const Yy = y * S;
      // the tarp, creased where it was folded, its edges hemmed
      for (let j = 0; j < 21; j++) for (let i = 0; i < 33; i++) img.px(X + i + 3, Yy + j + 3, 0x101418, 0.3);
      for (let j = 0; j < 21; j++)
        for (let i = 0; i < 33; i++) {
          let c = i === 0 || j === 0 || i === 32 || j === 20 ? 0x2a52b0 : (i + j * 2) % 11 === 0 ? 0x5a8ae8 : 0x3a6ad0;
          if (i === 16 || j === 10) c = 0x325cc0;
          img.px(X + i, Yy + j, c);
        }
      // the picnickers round the edge, sitting (heads and shoulders)
      for (const [dx, dy] of [[1, 1], [5, 0], [9, 1], [10, 4], [1, 5], [6, 6]].filter(() => hr() < 0.75)) {
        const c = hr.pick([0xd04040, 0xe8e8f0, 0x3a3a4a, 0xe8c040, 0xe86a9a]);
        const PX = X + dx * S;
        const PY = Yy + dy * S;
        for (let i = 0; i < 3; i++) {
          img.px(PX + i, PY - 2, 0x2a2024);
          img.px(PX + i, PY - 1, i === 1 ? 0xe8c0a0 : 0x2a2024);
          for (let j = 0; j < 3; j++) img.px(PX + i - 1 + (j > 1 ? 0 : 0), PY + j, i === 0 ? scaleColor(c, 1.1) : c);
        }
        img.px(PX + 3, PY + 1, scaleColor(c, 0.8));
      }
      // the bento: a lacquered box, red outside, black inside, rice and the dishes in its compartments
      for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) img.px(X + 12 + i, Yy + 9 + j, i === 0 || j === 0 || i === 5 || j === 5 ? 0xc02a2a : j < 3 ? (i < 3 ? 0xf4f4ee : 0xe8a040) : i < 3 ? 0x6aa050 : 0xd84a3a);
      img.px(X + 22, Yy + 9, 0xf4f4f0); // a sake bottle and cups
      img.px(X + 22, Yy + 10, 0xf4f4f0);
      img.px(X + 22, Yy + 11, 0xd8d8d0);
      img.px(X + 22, Yy + 12, 0xd8d8d0);
      img.px(X + 9, Yy + 15, 0xf0e8d0);
      img.px(X + 25, Yy + 14, 0xf0e8d0);
      for (let k = 0; k < 4; k++) for (let i = 0; i < 2; i++) img.px(X + 6 + k * 6 + i * 3, Yy + 24, k % 2 ? 0x2a2024 : 0xe8e8e8); // shoes at the edge
      reserveRect(x - 9, y - 9, 29, 26); // a clearing, so the crowns round it leave the picnic in sight
      tree('sakura', x + (hr() < 0.5 ? -2 : 13), y - 4, 6.5 + hr() * 1.5);
      n++;
    }
  }

  // ------------------------------------------------------------ the new detail the fine pixels make room for
  // stalls with their goods and steam, the offering box with its bell, an incense burner smoking, a tea
  // ceremony under a red parasol, a tour group behind its guide's flag, pigeons pecking in the courtyards,
  // the fire-keepers at the 大, and the bamboo grove grown dense
  {
    const er = rng(7001);
    const occAny = (x0, y0, w, h) => {
      for (let y = Math.floor(y0); y < y0 + h; y++) for (let x = Math.max(0, Math.floor(x0)); x < Math.min(W, x0 + w); x++) if (y >= 0 && y < L && occ[y * W + x]) return true;
      return false;
    };
    const free = (x, y, w, h) =>
      x >= 2 && x + w <= W - 2 && !occAny(x - 2, y - 2, w + 4, h + 4) && img.alpha(x, y) && img.alpha(x + w - 1, y + h - 1) && !pads.some((p) => Math.hypot(p.x - (x + w / 2), Y(p.u) - (y + h / 2)) < 18);
    const findSpot = (x0, x1, u0, u1, w, h) => {
      for (let k = 0; k < 160; k++) {
        const x = Math.round(x0 + er() * Math.max(0, x1 - x0 - w));
        const y = Math.round(Y(u1) + er() * Math.max(0, u1 - u0 - h));
        if (free(x, y, w, h)) return [x, y];
      }
      return null;
    };
    const take = (x, y, w, h) => reserveRect(x - 1, y - 1, w + 2, h + 2);
    for (let u = 1130; u < 1830; u++) for (let x = 78; x < 102; x++) occ[Y(u) * W + x] = 1; // (the shrine's paved walk)
    for (let u = 5400; u < 5560; u++) for (let x = 78; x < 102; x++) occ[Y(u) * W + x] = 1; // (the way up through Kiyomizu's gates)

    // stalls: a striped awning or a little tiled roof, the counter with its goods, the stallholder behind
    // it, a noren with the stall's name, a lantern; the grills steam (live)
    const steam = [2, 3, 4].map((r) => [0, 1].map((v) => kit.frame(puff(r * S, r * 31 + v + 7, [0x9a9aa2, 0xbabac2, 0xdadae0, 0xf4f4f8]))));
    const STALLS = {
      omamori: { awn: [0xf4f0e6, 0xc8302a], roof: true },
      yakitori: { awn: [0xe8c040, 0x2a2a30], smoke: true },
      dango: { awn: [0xf4f0e6, 0x3a8a5a] },
      taiyaki: { awn: [0xf4f0e6, 0x2a4a8a], smoke: true },
      ramune: { awn: [0x3a8ad0, 0xf4f0e6] },
      kitsune: { awn: [0xf4f0e6, 0xc8302a] },
    };
    const stall = (x, y, kind) => {
      const k = STALLS[kind];
      const X = x * S;
      const Yy = y * S;
      const sr = rng(x * 131 + y * 7);
      objects.push({
        y: y + 12,
        shadow: () => shadowPx(X + 5, Yy + 5, 54, 34, 0.5),
        draw: () => {
          // the roof
          for (let j = 0; j < 15; j++)
            for (let i = 0; i < 54; i++) {
              let c;
              if (k.roof) c = j === 0 ? C.roofTile[3] : j === 14 ? C.roofTile[0] : i % 4 === 0 ? scaleColor(C.roofTile[1], 0.7) : i % 4 === 1 ? C.roofTile[3] : j < 7 ? C.roofTile[2] : C.roofTile[1];
              else {
                c = Math.floor(i / 6) % 2 ? k.awn[0] : k.awn[1];
                if (j === 0) c = scaleColor(c, 1.15);
                if (j > 11 && ((i % 6) === 0 || (i % 6) === 5) && j === 14) continue; // (the scalloped edge)
                if (j === 13) c = scaleColor(c, 0.8);
              }
              img.px(X + i, Yy + j, c);
            }
          // the counter and its front
          for (let j = 15; j < 36; j++)
            for (let i = 1; i < 53; i++) img.px(X + i, Yy + j, j < 17 ? C.wood[3] : j === 17 ? C.wood[0] : j > 21 ? ((i - 1) % 13 === 0 ? C.wood[0] : (j % 4 === 0 ? C.wood[1] : C.wood[2])) : C.wood[2]);
          // the stallholder at the back, in a headband
          for (let i = 0; i < 3; i++) {
            img.px(X + 40 + i, Yy + 14, 0x2a2024);
            img.px(X + 40 + i, Yy + 15, i === 1 ? 0xe8c0a0 : 0xf4f0e6);
            img.px(X + 40 + i, Yy + 16, 0xe8c0a0);
          }
          // the goods on the counter (rows 17..21)
          const G = Yy + 18;
          if (kind === 'omamori' || kind === 'kitsune')
            for (let i = 3; i < 36; i += 3) {
              const c = kind === 'kitsune' ? 0xf4f0e8 : sr.pick([0xc8302a, 0xf4f0e6, 0xe8c040, 0x3a6ad0, 0xff9ac0, 0x3a8a5a]);
              for (let j = 0; j < 3; j++) {
                img.px(X + i, G + j, c);
                img.px(X + i + 1, G + j, scaleColor(c, 0.82));
              }
              img.px(X + i, G - 1, C.gold);
              if (kind === 'kitsune') {
                img.px(X + i, G + 1, C.R1);
                img.px(X + i + 1, G + 1, C.R1);
              }
            }
          else if (kind === 'yakitori') {
            for (let i = 4; i < 36; i++) for (let j = 0; j < 4; j++) img.px(X + i, G + j, j === 3 ? 0x1a1414 : 0x2a2220);
            for (let i = 5; i < 35; i += 2) glowPx(X + i, G + 2, sr() < 0.5 ? 0xff7a20 : 0xd8401a, 0.8);
            for (let i = 6; i < 34; i += 4) for (let j = -1; j < 4; j++) img.px(X + i, G + j, j === -1 ? 0xc8a870 : j % 2 ? 0x8a4a24 : 0xb8703a);
          } else if (kind === 'dango')
            for (let i = 4; i < 36; i += 5) {
              for (let j = 0; j < 4; j++) img.px(X + i + 1, G - 1 + j, 0xc8a870);
              img.px(X + i, G, 0xf8b8c8);
              img.px(X + i + 2, G, 0xf8b8c8);
              img.px(X + i, G + 1, 0xf4f0e6);
              img.px(X + i + 2, G + 1, 0xf4f0e6);
              img.px(X + i, G + 2, 0x8ac06a);
              img.px(X + i + 2, G + 2, 0x8ac06a);
            }
          else if (kind === 'taiyaki') {
            for (let i = 4; i < 36; i++) for (let j = 0; j < 4; j++) img.px(X + i, G + j, 0x2a2626);
            for (let i = 5; i < 33; i += 6) for (const [a, b] of [[0, 1], [1, 0], [1, 1], [2, 1], [3, 1], [1, 2], [4, 0], [4, 2]]) img.px(X + i + a, G + b, a === 1 && b === 0 ? 0xf0c070 : 0xc88a3a);
          } else
            for (let i = 4; i < 36; i++)
              for (let j = 0; j < 4; j++) img.px(X + i, G + j, (i + j) % 3 === 0 ? 0xc8e4f0 : 0x8ac0d8); // (the tub of iced water)
          if (kind === 'ramune') for (let i = 6; i < 34; i += 3) {
            img.px(X + i, G, 0xb8e0f0);
            img.px(X + i, G + 1, 0x9ad0e8);
            img.px(X + i, G - 1, 0x3a8ad0);
          }
          // the noren with the stall's name, a paper lantern at the corner
          for (let j = 15; j < 24; j++) for (let i = 2; i < 12; i++) img.px(X + i, Yy + j, i % 5 === 1 && j > 17 ? 0x1a1414 : k.awn[1] === 0xf4f0e6 ? k.awn[0] : k.awn[1]);
          glyph(X + 4, Yy + 17, 4, 0xf4f0e6, sr);
          chochin(x + 17, y + 4, kind === 'omamori' ? 0xf0e0c0 : 0xe8452a);
        },
      });
      take(x, y, 18, 12);
      if (k.smoke) kit.emit(x + 9, U(y + 5), steam, { rate: 1.4, life: [1.4, 2.2], vy: 6, sx: 1, wf: 0.6, a: 0.45, tint: 1 });
    };
    const placeStall = (x0, x1, u0, u1, kind) => {
      const p = findSpot(x0, x1, u0, u1, 18, 12);
      if (p) stall(p[0], p[1], kind);
      return p;
    };
    // at Fushimi Inari: charms by the Rōmon, food stalls (grilled skewers, inari foxes) in the courtyard
    const inariStalls = [placeStall(16, 78, 1222, 1300, 'omamori'), placeStall(102, 164, 1222, 1300, 'yakitori'), placeStall(16, 78, 1440, 1560, 'kitsune'), placeStall(102, 164, 1440, 1560, 'dango'), placeStall(102, 164, 1620, 1720, 'omamori')];
    // in Kiyomizu's gate courtyard, and at Arashiyama's river bank, and at the foot of the 大 for the crowd
    placeStall(4, 76, 5440, 5560, 'omamori');
    placeStall(104, 176, 5430, 5480, 'taiyaki');
    placeStall(4, 176, 3446, 3500, 'dango');
    placeStall(4, 176, 3262, 3326, 'ramune');
    placeStall(110, 170, 6840, 6930, 'yakitori');

    // the offering box in front of the shrine's main hall: a slatted chest, the bell rope of twisted red and
    // white cloth hanging from the great bell under the eave
    {
      const X = 83 * S;
      const Yy = Y(1492) * S;
      objects.push({
        y: Y(1492) + 6,
        shadow: () => shadowPx(X + 4, Yy + 4, 42, 16, 0.5),
        draw: () => {
          for (let j = 0; j < 15; j++) for (let i = 0; i < 42; i++) img.px(X + i, Yy + j, j < 6 ? (i % 4 === 0 ? 0x2a1a10 : j === 0 ? C.wood[3] : C.wood[2]) : i === 0 || i === 41 ? C.wood[0] : j % 3 === 0 ? C.wood[1] : C.wood[2]);
          for (let i = 0; i < 42; i++) img.px(X + i, Yy + 6, C.gold);
          for (const RX of [X + 14, X + 27]) {
            for (let j = -16; j < 2; j++) {
              img.px(RX, Yy + j, (j >> 1) % 2 ? C.R1 : 0xf4f0e6);
              img.px(RX + 1, Yy + j, (j >> 1) % 2 ? 0xf4f0e6 : C.R2);
            }
            img.discPx(RX + 1, Yy - 18, 2.6, C.gold);
            img.px(RX, Yy - 19, C.goldHi);
          }
        },
      });
      take(83, Y(1492), 14, 5);
    }

    // Kiyomizu's great bronze incense burner under its little roof, the smoke curling up (live)
    {
      const p = free(84, Y(5512), 12, 10) ? [84, Y(5512)] : findSpot(60, 120, 5480, 5550, 12, 10);
      if (p) {
        const [x, y] = p;
        const X = x * S;
        const Yy = y * S;
        objects.push({
          y: y + 10,
          shadow: () => shadowPx(X + 6, Yy + 8, 36, 24, 0.5),
          draw: () => {
            for (let j = 0; j < 9; j++) for (let i = 4; i < 32; i++) img.px(X + i, Yy + j, j === 0 ? 0x6a7a6a : i % 4 === 0 ? 0x2a3430 : j < 4 ? 0x4a5a50 : 0x3a4640); // (the roof, verdigris)
            for (let q = 1; q < 4; q++) {
              img.px(X + 4 - q, Yy + 8 - q, 0x4a5a50);
              img.px(X + 31 + q, Yy + 8 - q, 0x3a4640);
            }
            for (const PX of [X + 8, X + 27]) for (let j = 9; j < 14; j++) img.px(PX, Yy + j, 0x2a2420);
            for (let j = 13; j < 27; j++)
              for (let i = 3; i < 33; i++) {
                const e = ((i - 17.5) / 15) ** 2 + ((j - 20) / 7) ** 2;
                if (e > 1) continue;
                img.px(X + i, Yy + j, j === 13 || j === 14 ? 0x8a7a5a : i < 9 ? 0x7a6a4a : i > 27 ? 0x2a2420 : e > 0.8 ? 0x3a3228 : 0x5a4a34);
              }
            for (let i = 8; i < 28; i++) img.px(X + i, Yy + 14, i % 3 ? 0x8a8478 : 0xe8e0d0); // (the ash and the sticks)
            for (const LX of [X + 8, X + 27]) for (let j = 26; j < 30; j++) img.px(LX, Yy + j, 0x2a2420);
          },
        });
        take(x, y, 12, 10);
        const smoke = [2, 3, 4, 5].map((r) => [0, 1].map((v) => kit.frame(puff(r * S, r * 17 + v + 3, [0x8a8a96, 0xa8a8b4, 0xc8c8d2, 0xe4e4ea]))));
        kit.emit(x + 6, U(y + 4), smoke, { rate: 1.2, life: [2.5, 3.5], vy: 5, sx: 1.2, wf: 0.9, a: 0.4, tint: 1 });
        crowd(x - 6, y + 10, 24, 4, 10, true, 0.2);
      }
    }

    // a tea ceremony out of doors (nodate) by the Sekka-tei: red felt laid on a bench, the great red parasol
    // over it, two guests kneeling, the host whisking, the bowls
    {
      const p = findSpot(80, 176, 4120, 4250, 24, 14);
      if (p) {
        const [x, y] = p;
        const X = x * S;
        const Yy = y * S;
        objects.push({
          y: y + 14,
          shadow: () => {
            for (let j = -30; j <= 30; j++) for (let i = -30; i <= 30; i++) if (i * i + j * j < 900) img.tintPx(X + 36 + i + 10, Yy + 18 + j + 14, 0.6);
          },
          draw: () => {
            for (let j = 0; j < 15; j++) for (let i = 0; i < 60; i++) img.px(X + 6 + i, Yy + 20 + j, j === 0 ? 0xf05a3a : j === 14 ? 0x8a1a10 : (i + j) % 7 === 0 ? 0xc02a1a : C.R1);
            for (const [GX, c] of [[X + 16, 0x9a5ac8], [X + 30, 0x3a8ac8], [X + 46, 0x2a2a30]]) {
              for (let i = 0; i < 4; i++) {
                img.px(GX + i, Yy + 22, 0x141014);
                for (let j = 23; j < 27; j++) img.px(GX + i, Yy + j, i === 3 ? scaleColor(c, 0.75) : c);
              }
              img.px(GX + 1, Yy + 23, 0xe8c0a0);
            }
            img.discPx(X + 38, Yy + 30, 2, 0x2a4a3a);
            img.px(X + 38, Yy + 30, 0x6aa050);
            img.discPx(X + 26, Yy + 30, 1.6, 0x6a3a2a);
            // the parasol: a great disc of red paper on many ribs
            for (let j = -27; j <= 27; j++)
              for (let i = -27; i <= 27; i++) {
                const d = Math.hypot(i, j);
                if (d > 26.5) continue;
                const a = Math.atan2(j, i);
                const rib = Math.abs(((a / (Math.PI * 2)) * 40 + 40) % 1 - 0.5) > 0.44;
                let c = i + j < -10 ? 0xf05a3a : i + j > 14 ? 0xb02a1a : C.R1;
                if (rib) c = 0xa02010;
                if (d > 25.5) c = 0x8a1a10;
                if (d > 6 && d < 7.5) c = 0xf0e0b0;
                img.px(X + 36 + i, Yy + 6 + j, c);
              }
            img.discPx(X + 36.5, Yy + 6.5, 2.5, 0x2a2024);
          },
        });
        take(x, y - 6, 24, 20);
      }
    }

    // a tour group following its guide's yellow flag along Kinkaku-ji's walk, all in the same caps
    {
      const p = findSpot(100, 140, 3600, 3700, 14, 10);
      if (p) {
        const [x, y] = p;
        const gr = rng(7003);
        objects.push({
          y: y + 10,
          draw: () => {
            const X = x * S;
            const Yy = y * S;
            for (let j = 0; j < 14; j++) img.px(X + 3, Yy - 8 + j, 0x8a8a90);
            for (let j = 0; j < 5; j++) for (let i = 0; i < 8; i++) img.px(X + 4 + i, Yy - 8 + j, j === 0 ? 0xffe060 : 0xe8c040);
            personPx(X + 1, Yy + 6, { coat: 0x2a4a8a, hair: 0x2a2024, face: true, legs: 0x2a2a34 });
            for (let k = 0; k < 11; k++)
              personPx(X + 6 + Math.floor(gr() * 30), Yy + 8 + Math.floor(gr() * 20), { coat: gr.pick([0xe8e8f0, 0xd04040, 0x3a6ad0, 0x6aaa5a, 0x3a3a4a]), hair: 0xe8c040, face: gr() < 0.5, legs: 0x2a2a34 });
          },
        });
      }
    }

    // pigeons pecking about the courtyards (live): grey with dark wing bars, a green and purple sheen on the
    // neck, the head bobbing down
    const pigeon = (f, u) => {
      const out = new HiCanvas(4, 3);
      for (let j = 2; j < 7; j++) for (let i = 1; i < 9; i++) if (((i - 4.5) / 3.8) ** 2 + ((j - 4.5) / 2.3) ** 2 < 1) out.px(i, j, j === 4 && i > 2 && i < 7 ? 0x4a4e58 : i < 3 ? 0x6a6e78 : 0x8a8e98);
      out.px(8, 3, 0x5a8a7a);
      out.px(8, 4, 0x7a5a8a);
      out.px(9, f ? 4 : 2, 0x6a6e78);
      out.px(10, f ? 5 : 2, 0xd8b8a8);
      out.px(4, 7, 0xc87a6a);
      out.px(6, 7, 0xc87a6a);
      out.px(0, 4, 0x3a3e48);
      return kit.frame(gradeAt(out, u));
    };
    for (const [x, u, n] of [[50, 1300, 7], [130, 1560, 5], [40, 5500, 6], [70, 6880, 4], [120, 640 - 90, 0]]) {
      if (!n) continue;
      kit.wander(x, u, 14, 10, [pigeon(0, u), pigeon(1, u)], { n, sp: 3, idle: 0.6, turn: 'flip', fps: 3 });
    }

    // the fire-keepers at the 大: men in white happi coats with long poles, standing by the beds
    for (let i = 0; i < pyreKeepers.length; i += 9) {
      const [kx, ky] = pyreKeepers[i];
      objects.push({
        y: ky + 3,
        draw: () => {
          const X = kx * S + 7;
          const Yy = ky * S - 6;
          for (let q = 0; q < 3; q++) {
            img.px(X + q, Yy, 0x1a1418);
            img.px(X + q, Yy + 1, q === 1 ? 0xd8a888 : 0xf4f0e6);
            for (let j = 2; j < 6; j++) img.px(X + q, Yy + j, q === 2 ? 0xa8a49a : 0xe8e4da);
          }
          img.px(X, Yy + 6, 0x2a2a34);
          img.px(X + 2, Yy + 7, 0x2a2a34);
          for (let j = -6; j < 7; j++) img.px(X + 4, Yy + j, 0x6a4a2a);
          for (let k = 0; k < 5; k++) img.px(X + 1 + k, Yy + 9, 0x0a0a10, 0.35);
        },
      });
    }

    // the courtyards dressed: benches with people resting on them, little sub-shrines (massha) each with its
    // torii, stone steles, bonsai on their stands, shrine maidens crossing, a school trip in navy uniforms
    const bench = (x, y) => {
      const X = x * S;
      const Yy = y * S;
      const br = rng(x * 37 + y);
      objects.push({
        y: y + 4,
        shadow: () => shadowPx(X + 3, Yy + 4, 36, 8, 0.5),
        draw: () => {
          for (let i = 0; i < 36; i++) for (let j = 0; j < 6; j++) img.px(X + i, Yy + j, j === 0 ? C.wood[3] : j === 5 ? C.wood[0] : j % 2 ? C.wood[2] : C.wood[1]);
          for (const LX of [X + 2, X + 33]) for (let j = 6; j < 9; j++) img.px(LX, Yy + j, C.wood[0]);
          for (let k = 0; k < 4; k++) {
            if (br() < 0.4) continue;
            const PX = X + 3 + k * 8;
            const c = br.pick(br() < 0.3 ? KIMONO : [0xd04040, 0x3a6ad0, 0xe8e8f0, 0x3a3a4a, 0x6aaa5a]);
            for (let i = 0; i < 3; i++) {
              img.px(PX + i, Yy - 4, 0x2a2024);
              img.px(PX + i, Yy - 3, i === 1 ? 0xe8c0a0 : 0x2a2024);
              for (let j = -2; j < 2; j++) img.px(PX + i, Yy + j, i === 2 ? scaleColor(c, 0.75) : c);
            }
          }
        },
      });
      take(x, y - 2, 12, 6);
    };
    const massha = (x, y) => {
      // a small hall on a stone base, its own little torii in front, a pair of foxes
      const X = x * S;
      const Yy = y * S;
      objects.push({
        y: y + 14,
        shadow: () => shadowPx(X + 6, Yy + 6, 30, 36, 0.5),
        draw: () => {
          for (let j = 0; j < 4; j++) for (let i = -2; i < 32; i++) img.px(X + i, Yy + 26 + j, j === 0 ? C.stone[3] : C.stone[1]);
          for (let j = 0; j < 14; j++)
            for (let i = 0; i < 30; i++) {
              const t = Math.abs(j - 5) / 9;
              const ins = 6 * (1 - t);
              img.px(X + i, Yy + j, i < ins ? C.roofBark[3] : 29 - i < ins ? C.roofBark[0] : j % 3 === 0 ? scaleColor(C.roofBark[2], 0.86) : j < 5 ? C.roofBark[2] : C.roofBark[1]);
            }
          for (let i = 6; i < 24; i++) img.px(X + i, Yy + 4, C.K);
          for (const gx of [X + 6, X + 22]) for (let j = 2; j < 5; j++) img.px(gx, Yy + j, C.gold);
          for (let j = 14; j < 26; j++) for (let i = 2; i < 28; i++) img.px(X + i, Yy + j, (i - 2) % 9 < 2 ? C.R1 : j < 19 ? C.white : C.R2);
          img.rectPx(X + 12, Yy + 17, 6, 9, 0x140c0a);
          // its torii, and the foxes either side of it
          for (let j = 0; j < 14; j++) {
            for (let i = 0; i < 2; i++) {
              img.px(X + 10 + i, Yy + 27 + j, i ? C.R2 : C.R1);
              img.px(X + 19 + i, Yy + 27 + j, i ? C.R3 : C.R2);
            }
          }
          for (let i = 6; i < 25; i++) {
            const up = i < 8 || i > 22 ? 1 : 0;
            img.px(X + i, Yy + 26 - up, C.K);
            img.px(X + i, Yy + 27 - up, C.R1);
            if (i > 7 && i < 23) img.px(X + i, Yy + 31, i % 2 ? C.R1 : C.R2);
          }
          for (const FX of [X + 2, X + 26])
            for (const [i, j] of [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]]) img.px(FX + i, Yy + 36 + j, j === 2 && i === 1 ? C.R1 : 0xd8d2c6);
        },
      });
      take(x, y, 11, 14);
    };
    const stele = (x, y) => otsuka(x, y, 4, 7);
    const bonsai = (x, y) => {
      const X = x * S;
      const Yy = y * S;
      const sr = rng(x * 53 + y);
      objects.push({
        y: y + 5,
        shadow: () => shadowPx(X + 3, Yy + 6, 14, 9, 0.5),
        draw: () => {
          for (let i = 0; i < 14; i++) for (let j = 8; j < 11; j++) img.px(X + i, Yy + j, j === 8 ? C.wood[3] : C.wood[2]); // (the stand)
          for (const LX of [X + 1, X + 12]) for (let j = 11; j < 14; j++) img.px(LX, Yy + j, C.wood[0]);
          for (let i = 3; i < 11; i++) for (let j = 5; j < 8; j++) img.px(X + i, Yy + j, j === 5 ? 0x5a7a8a : 0x3a5a6a); // (the pot)
          for (let k = 0; k < 3; k++) {
            const CX = X + 3 + k * 4;
            const CY = Yy + 1 - (k === 1 ? 2 : 0);
            for (let j = -2; j <= 2; j++) for (let i = -3; i <= 3; i++) if (i * i + j * j * 2 < 9 && sr() < 0.85) img.px(CX + i, CY + j, j < 0 ? 0x5a8a3a : 0x3a6a2a);
          }
          for (let j = 2; j < 5; j++) img.px(X + 7 - (j === 2 ? 1 : 0), Yy + j, 0x4a3020);
        },
      });
      take(x, y, 5, 5);
    };
    const school = (x, y, n = 12) => {
      // a school trip: navy uniforms, a few in white shirts, caps or bobs, the teacher with a flag
      const gr = rng(x * 71 + y);
      objects.push({
        y: y + 12,
        draw: () => {
          const X = x * S;
          const Yy = y * S;
          for (let k = 0; k < n; k++)
            personPx(X + Math.floor(gr() * 36), Yy + Math.floor(gr() * 24), { coat: gr() < 0.75 ? 0x1e2a48 : 0xe8e8f0, hair: gr() < 0.5 ? 0x1a1418 : 0x2a3a5a, face: gr() < 0.5, legs: 0x1e2a48 });
          personPx(X + 40, Yy + 10, { coat: 0x5a5a62, hair: 0x2a2024, face: true, legs: 0x2a2a34 });
          for (let j = -10; j < 4; j++) img.px(X + 44, Yy + j, 0x8a8a90);
          for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) img.px(X + 45 + i, Yy - 10 + j, j === 0 ? 0xff8a8a : 0xe85a5a);
        },
      });
    };
    const miko = (x, y) => {
      const X = x * S;
      const Yy = y * S;
      objects.push({
        y: y + 3,
        draw: () => {
          for (let i = 0; i < 3; i++) {
            img.px(X + i, Yy - 3, 0x141014);
            img.px(X + i, Yy - 2, i === 1 ? 0xf0d8c0 : 0x141014);
            for (let j = -1; j < 2; j++) img.px(X + i, Yy + j, 0xf8f6f0);
            for (let j = 2; j < 6; j++) img.px(X + i, Yy + j, i === 2 ? C.R2 : C.R1);
          }
          img.px(X + 1, Yy - 4, 0xf8f6f0); // (the white paper tie in her hair)
          for (let k = 0; k < 4; k++) img.px(X + k, Yy + 7, 0x101418, 0.35);
        },
      });
    };
    const dress = (x0, x1, u0, u1, list) => {
      for (const [what, count, w, h] of list)
        for (let k = 0; k < count; k++) {
          const p = findSpot(x0, x1, u0, u1, w, h);
          if (p) what(p[0], p[1]);
        }
    };
    // Fushimi Inari's courtyard
    dress(16, 164, 1220, 1820, [
      [massha, 3, 11, 14],
      [bench, 5, 12, 4],
      [stele, 4, 4, 7],
      [bonsai, 4, 5, 5],
      [(x, y) => lantern(x, y), 6, 4, 6],
    ]);
    for (let k = 0; k < 6; k++) {
      const p = findSpot(16, 164, 1220, 1820, 3, 3);
      if (p) miko(p[0], p[1]);
    }
    {
      const p = findSpot(16, 164, 1240, 1480, 16, 10);
      if (p) school(p[0], p[1]);
    }
    // ---- Fushimi Inari is never empty: the approach and the courtyard full of people, thick where people really
    // gather (at the offering box and its bell ropes, the stalls, the water basin, the dance stage, the plaques,
    // the foxes, under the gates for a photograph) and in twos and threes everywhere else. Every one is an object
    // sorted with the buildings, so they stand in front of and behind things properly. All of it on its own
    // random numbers, so the rest of the map keeps its place; the turret pads stay clear.
    {
      const fr = rng(1301);
      const QUIET = [0x3a3a4a, 0x4a4038, 0x2a3040, 0x5a5a62, 0x6a6258, 0x34404c];
      const BRIGHT = [0xd04040, 0x3a6ad0, 0xe8c040, 0xe8e8f0, 0x6aaa5a, 0xe07a30, 0x8a5ab0];
      const onWalk = (x, u) => (u > 660 && u < 1130 && x >= 70 && x < 110) || (u >= 1130 && u < 1830 && x >= 78 && x < 102);
      const taken = new Set();
      const open = (x, y) => {
        const ix = Math.round(x);
        const iy = Math.round(y);
        if (ix < 15 || ix > 164 || iy < 0 || iy >= L || !img.alpha(ix, iy)) return false;
        if (pads.some((p) => Math.hypot(p.x - x, Y(p.u) - y) < 15)) return false;
        return onWalk(x, L - y) || !occ[iy * W + ix];
      };
      /** One person, dressed at random: a rented kimono (some under a paper parasol), a sun hat, a rucksack. */
      const visitor = (x, y, o = {}) => {
        const cell = Math.round(x / 1.4) * 8192 + Math.round(y / 1.6);
        if (taken.has(cell) || !open(x, y)) return false;
        taken.add(cell);
        const X = Math.round(x * S);
        const Yy = Math.round(y * S);
        const kind = o.kimono ?? fr() < 0.14;
        const look = kind
          ? { maiko: true, kimono: fr.pick(KIMONO), orn: fr() < 0.5, obi: fr.pick([0xe8c040, 0x2a2a6a, 0xf4f0e6, 0xc83a3a, 0x3a8a6a]) }
          : { coat: o.coat ?? (fr() < 0.42 ? fr.pick(BRIGHT) : fr.pick(QUIET)), hair: o.hair ?? fr.pick([0x2a2024, 0x1a1418, 0x3a2a20, 0x6a5a48, 0xc8c8c8]), face: o.face ?? fr() < 0.5, legs: o.legs ?? fr.pick([0x2a2a34, 0x3a4a6a, 0x1a1a20, 0x5a5048]) };
        const extra = fr();
        const parasol = kind && extra < 0.35 ? fr.pick([0xc8302a, 0xe0803a, 0xb83a6a, 0x3a5ab0]) : 0;
        const hat = !kind && !o.coat && extra < 0.13 ? fr.pick([0xe8e0c8, 0xc8a868, 0xf4f4f0]) : 0;
        const pack = !kind && !o.coat && extra > 0.78 ? fr.pick([0x2a3a5a, 0x5a3a2a, 0x3a5a3a, 0x8a2a2a]) : 0;
        const cap = o.cap ?? 0;
        const phone = !kind && extra > 0.68 && extra <= 0.78;
        objects.push({
          y: (Yy + 5) / S,
          draw: () => {
            if (pack) for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) img.px(X + i, Yy + j, i === 2 ? scaleColor(pack, 0.75) : pack);
            personPx(X, Yy, look);
            if (pack) for (let j = 0; j < 3; j++) img.px(X + 1, Yy + j, pack);
            if (hat) {
              for (let i = -1; i < 4; i++) img.px(X + i, Yy - 2, hat);
              img.px(X + 1, Yy - 3, hat);
            }
            if (cap) {
              for (let i = 0; i < 3; i++) img.px(X + i, Yy - 2, cap);
              img.px(X + 1, Yy - 3, cap);
            }
            if (phone) {
              img.px(X + 3, Yy, 0xe8c0a0);
              img.px(X + 4, Yy - 1, 0x141418);
              img.px(X + 4, Yy - 2, 0xa8c8e0);
            }
            if (parasol)
              for (let j = -3; j <= 2; j++)
                for (let i = -6; i <= 6; i++) {
                  if ((i / 6.2) ** 2 + (j / 3.2) ** 2 > 1) continue;
                  img.px(X + 1 + i, Yy - 6 + j, i === 0 || (i + 12) % 4 === 0 ? scaleColor(parasol, 0.78) : i < -1 ? scaleColor(parasol, 1.15) : parasol);
                }
          },
        });
        return true;
      };
      const normal = () => (fr() + fr() + fr() - 1.5) / 1.5; // (roughly -1..1, thickest in the middle)
      /** A knot of n people round (cx, u). */
      const gather = (cx, u, rx, ry, n, o = {}) => {
        for (let k = 0; k < n * 2 && n > 0; k++) if (visitor(cx + normal() * rx, Y(u) + normal() * ry, o)) n--;
      };
      /** People waiting one behind another, from the head of the line back along (dx, du). */
      const queue = (x, u, dx, du, n, o = {}) => {
        for (let k = 0; k < n; k++) visitor(x + dx * k + (fr() - 0.5) * 0.8, Y(u + du * k), { face: false, ...o });
      };
      /** A tour party: all in the company's caps, close together behind a guide with a flag on a pole. */
      const tour = (x, u, n, cap, flag) => {
        gather(x, u, 7, 3.5, n, { cap, kimono: false });
        const X = Math.round((x + 9) * S);
        const Yy = Y(u) * S;
        if (!open(x + 9, Y(u))) return;
        objects.push({
          y: (Yy + 5) / S,
          draw: () => {
            personPx(X, Yy, { coat: flag, hair: 0x2a2024, face: true, legs: 0x2a2a34 });
            for (let j = -14; j < 2; j++) img.px(X + 4, Yy + j, 0x8a8a90);
            for (let j = 0; j < 5; j++) for (let i = 0; i < 8 - j; i++) img.px(X + 5 + i, Yy - 14 + j, j === 0 ? scaleColor(flag, 1.2) : flag);
          },
        });
      };

      // --- the approach: a river of people up the paving, thickening towards the shops
      for (let k = 0; k < 520; k++) visitor(71 + fr() * 38, Y(664 + fr() * 466));
      for (const side of [-1, 1]) for (let k = 0; k < 90; k++) visitor(90 + side * (24 + fr() * 6), Y(664 + fr() * 466));
      gather(90, 724, 16, 6, 26); // (under the small gate)
      gather(90, 1006, 19, 8, 44); // (under the great gate, for its photograph)
      tour(78, 860, 12, 0xe8c040, 0xe8c040);
      tour(100, 1070, 11, 0xd04040, 0xd04040);

      // --- the walk through the courtyard, two ways at once, the throng growing towards the shrine
      for (let k = 0; k < 330; k++) {
        const t = fr() ** 0.7;
        visitor(90 + normal() * 8, Y(1220 + t * 262));
      }
      // the throng before the offering box, everyone with their back to us, three lines at the bell ropes
      gather(90, 1474, 30, 12, 130, { face: false });
      gather(90, 1484, 14, 3, 30, { face: false });
      for (const x of [85, 90, 95]) queue(x, 1484, 0, -2.2, 14);
      // on past the hall, up the steps and under the two gates
      for (let k = 0; k < 150; k++) visitor(90 + normal() * 7, Y(1600 + fr() * 100));
      for (let k = 0; k < 100; k++) visitor(90 + normal() * 8, Y(1700 + fr() * 128));
      for (const u of [1754, 1790]) {
        gather(90, u, 12, 4, 22); // (posing under the gate)
        queue(90, u - 12, 0, 0, 1, { face: true, coat: 0x3a3a4a });
      }
      // along both flanks of the hall, the way round to the back
      for (const x of [24, 156]) for (let k = 0; k < 46; k++) visitor(x + (fr() - 0.5) * 18, Y(1500 + fr() * 100));
      // and either side of the great gate, and at its foxes, where everyone stops on the way in
      for (let k = 0; k < 110; k++) visitor(16 + fr() * 148, Y(1132 + fr() * 88));
      gather(68, 1134, 12, 3, 12);
      gather(115, 1134, 12, 3, 12);
      gather(90, 1136, 16, 4, 30);

      // --- more stalls down both sides, with people round every one
      const more = [[16, 78, 1222, 1300, 'taiyaki'], [102, 164, 1222, 1300, 'ramune'], [16, 78, 1370, 1420, 'dango'], [102, 164, 1300, 1360, 'kitsune'], [16, 78, 1440, 1500, 'yakitori'], [102, 164, 1440, 1490, 'taiyaki'], [16, 78, 1700, 1820, 'ramune'], [102, 164, 1745, 1825, 'yakitori']];
      const spot = (x0, x1, u0, u1, w, h) => {
        for (let k = 0; k < 200; k++) {
          const x = Math.round(x0 + fr() * Math.max(0, x1 - x0 - w));
          const y = Math.round(Y(u1) + fr() * Math.max(0, u1 - u0 - h));
          if (free(x, y, w, h)) return [x, y];
        }
        return null;
      };
      const all = [...inariStalls];
      for (const [x0, x1, u0, u1, kind] of more) {
        const p = spot(x0, x1, u0, u1, 18, 12);
        if (p) stall(p[0], p[1], kind);
        all.push(p);
      }
      for (const p of all) {
        if (!p) continue;
        const u = U(p[1] + 15);
        gather(p[0] + 9, u, 11, 2.5, 13, { face: false });
        queue(p[0] + 5, u - 3, (fr() < 0.5 ? -1 : 1) * 0.6, -2.2, 6);
      }

      // --- where people stop: the water basin, the dance stage, the plaques, the sake, the foxes, the side halls
      gather(121, 1279, 11, 2.5, 16, { face: false });
      queue(112, 1279, -1.6, 1, 7);
      gather(141, 1359, 17, 4, 40, { face: false }); // (the audience at the kagura stage)
      for (const [x0, u] of [[28, 1420], [130, 1500], [26, 1610]]) gather(x0 + 13, u - 8, 14, 2.5, 13, { face: false });
      for (const [x0, u0] of [[16, 1290], [128, 1600]]) gather(x0 + 17, u0 - 13, 16, 3, 10);
      for (const [x, u] of [[30, 1250], [146, 1250], [30, 1500], [146, 1520], [76, 1716], [100, 1716]]) gather(x + 5, u - 9, 7, 3, 6);
      for (const [x, u, w] of [[42, 1314, 17], [138, 1394, 17], [41, 1659, 15], [141, 1709, 15]]) gather(x, u, w, 3, 16, { face: false });
      for (const [x, u] of [[48, 1300], [140, 1660]]) gather(x, u - 8, 10, 3, 9);

      // --- parties being shown round
      tour(50, 1340, 14, 0xe8e8f0, 0x3a6ad0);
      tour(128, 1262, 12, 0xe8c040, 0xe07a30);
      tour(52, 1470, 13, 0x3a8a5a, 0x3a8a5a);
      tour(130, 1660, 12, 0xd04040, 0xd04040);
      tour(52, 1740, 11, 0x3a6ad0, 0x3a6ad0);

      // --- red-felt benches under big paper parasols, where people rest with their tea and dango
      const teaBench = (x, y) => {
        const X = x * S;
        const Yy = y * S;
        const br = rng(x * 41 + y);
        objects.push({
          y: y + 5,
          shadow: () => shadowPx(X + 4, Yy + 7, 36, 8, 0.55),
          draw: () => {
            for (const LX of [X + 3, X + 30]) for (let j = 6; j < 12; j++) img.px(LX, Yy + j, C.wood[0]);
            for (let j = 0; j < 7; j++) for (let i = 0; i < 34; i++) img.px(X + i, Yy + j, j === 0 ? 0xf05a48 : j === 6 ? 0x8a1a14 : j < 3 ? 0xd83a2a : 0xc02a20);
            for (let k = 0; k < 4; k++) {
              if (br() < 0.25) continue;
              personPx(X + 3 + k * 8, Yy - 5, { coat: br.pick([...BRIGHT, ...QUIET]), hair: br.pick([0x2a2024, 0x1a1418, 0x6a5a48]), face: br() < 0.7, legs: 0x2a2a34 });
            }
            // the parasol: a great red circle of paper on bamboo ribs, its pole down behind the bench
            const CX = X + 17;
            const CY = Yy - 15;
            for (let j = -6; j < 13; j++) {
              img.px(CX, Yy + j, 0x8a6a3a);
              img.px(CX + 1, Yy + j, 0x5a4428);
            }
            for (let j = -10; j <= 10; j++)
              for (let i = -20; i <= 20; i++) {
                const e = (i / 20) ** 2 + (j / 10) ** 2;
                if (e > 1) continue;
                const a = Math.atan2(j * 2, i);
                const rib = Math.abs(((a + Math.PI) * 4) % (Math.PI / 2) - Math.PI / 4) < 0.05;
                img.px(CX + i, CY + j, e < 0.03 ? 0x2a2024 : e > 0.84 ? 0x8a1a14 : rib ? 0xa82a20 : i + j < -8 ? 0xf05a48 : 0xd83a2a);
              }
          },
        });
        take(x, y - 7, 12, 11);
      };
      for (const [x0, x1, u0, u1] of [[16, 76, 1220, 1320], [104, 164, 1300, 1356], [16, 76, 1440, 1500], [104, 164, 1650, 1700], [16, 76, 1760, 1825]]) {
        const p = spot(x0, x1, u0, u1, 12, 10);
        if (p) teaBench(p[0], p[1] + 7);
      }

      // --- and everybody else, in ones, twos and threes, more in some parts of the gravel than in others
      for (let k = 0, placed = 0; k < 4000 && placed < 480; k++) {
        const x = 16 + fr() * 148;
        const u = 1218 + fr() * 610;
        if (fbm(x, u, { seed: 1307, scale: 26, octaves: 2 }) < 0.46) continue;
        const n = 1 + Math.floor(fr() ** 1.6 * 4);
        for (let i = 0; i < n; i++) if (visitor(x + (fr() - 0.5) * 7, Y(u + (fr() - 0.5) * 5))) placed++;
      }

      // --- (live) people walking: both ways along the paving, the worn tracks out to the side halls, and strolling
      // about the gravel. The gates' beams would be walked over, so every line stops short of them
      const walker = (c, step) => {
        const out = new HiCanvas(2, 4);
        for (let i = 1; i < 3; i++) out.px(i, 0, 0x2a2024);
        out.px(1, 1, 0x2a2024);
        out.px(2, 1, 0xe8c0a0);
        for (let j = 2; j < 6; j++) for (let i = 0; i < 4; i++) if (!(j > 4 && (i === 0 || i === 3))) out.px(i, j, i === 0 || i === 3 ? scaleColor(c, 0.75) : c);
        out.px(step ? 1 : 2, 6, 0x2a2a34);
        out.px(step ? 2 : 1, 7, 0x2a2a34);
        out.px(step ? 1 : 2, 8, 0x1a1a20);
        for (let i = 2; i < 6; i++) out.px(i, 10, 0x101418, 0.4);
        return kit.frame(gradeAt(out, 1300));
      };
      const walkers = [...BRIGHT, ...QUIET, ...KIMONO.slice(0, 3)].map((c) => [walker(c, 0), walker(c, 1)]);
      const lane = (pts, n = 1, gap = 60) => kit.path(pts, fr.pick(walkers), { sp: 2.6 + fr() * 1.8, n, gap, mode: 'pp', hold: 1.5 + fr() * 2, turn: 'none', fps: 3, s0: fr() });
      for (const [u0, u1, xs] of [[672, 725, [76, 84, 92, 100]], [745, 1015, [72, 76, 80, 84, 88, 92, 96, 100, 104]], [1040, 1124, [78, 86, 94, 102]], [1222, 1484, [83, 85, 87, 89, 91, 93, 95, 97]], [1600, 1755, [84, 88, 92, 96]], [1786, 1808, [86, 94]]])
        for (const x of xs) lane([[x, u0], [x, u1]], u1 - u0 > 200 ? 2 : 1, 110);
      // a whole party on the move, close together in the same yellow caps
      const caps = [0, 1].map((step) => {
        const out = new HiCanvas(2, 4);
        for (let i = 1; i < 3; i++) out.px(i, 0, 0xe8c040);
        out.px(1, 1, 0x2a2024);
        out.px(2, 1, 0xe8c0a0);
        for (let j = 2; j < 6; j++) for (let i = 0; i < 4; i++) if (!(j > 4 && (i === 0 || i === 3))) out.px(i, j, i === 0 || i === 3 ? 0x2a3040 : 0x3a4a60);
        out.px(step ? 1 : 2, 6, 0x2a2a34);
        out.px(step ? 2 : 1, 7, 0x2a2a34);
        for (let i = 2; i < 6; i++) out.px(i, 10, 0x101418, 0.4);
        return kit.frame(gradeAt(out, 1300));
      });
      kit.path([[86, 1222], [86, 1484]], caps, { sp: 2.8, n: 9, gap: 4, mode: 'pp', hold: 5, turn: 'none', fps: 3, s0: 0.3 });
      kit.path([[94, 760], [94, 1015]], caps, { sp: 2.8, n: 8, gap: 4, mode: 'pp', hold: 5, turn: 'none', fps: 3, s0: 0.65 });
      for (const pts of [[[98, 1290], [112, 1284]], [[102, 1366], [126, 1362]], [[80, 1418], [58, 1414]], [[110, 1490], [128, 1490]], [[102, 1650], [148, 1642]], [[78, 1650], [32, 1640]], [[102, 1340], [150, 1338]], [[78, 1262], [30, 1262]]]) lane(pts, 2, 18);
      for (let k = 0; k < 9; k++) {
        const p = spot(16, 164, 1220, 1825, 22, 14);
        if (p) kit.wander(p[0] + 11, U(p[1] + 7), 11, 7, fr.pick(walkers), { n: 2, sp: 3, idle: 0.5, turn: 'none', fps: 3 });
      }
    }
    // Kiyomizu's gate courtyard and the walks behind the main hall
    dress(4, 176, 5428, 5560, [
      [bench, 3, 12, 4],
      [bonsai, 3, 5, 5],
      [stele, 2, 4, 7],
    ]);
    for (const [u0, u1] of [[5430, 5560], [5840, 5930]]) {
      const p = findSpot(4, 176, u0, u1, 16, 10);
      if (p) school(p[0], p[1], 14);
    }
    // Kinkaku-ji's approach and the abbot's garden
    dress(20, 138, 3560, 3700, [
      [bench, 2, 12, 4],
      [bonsai, 2, 5, 5],
    ]);
    dress(76, 138, 4170, 4300, [[bench, 2, 12, 4], [stele, 2, 4, 7]]);

    // rain puddles left on Hanamikōji's flagstones, the sky and the eaves showing in them
    for (let k = 0; k < 9; k++) {
      const CX = (82 + er() * 16) * S;
      const CY = (Y(20 + er() * 500)) * S;
      const rx = 6 + er() * 9;
      const ry = 2.5 + er() * 3;
      for (let j = -Math.ceil(ry); j <= ry; j++)
        for (let i = -Math.ceil(rx); i <= rx; i++) {
          const e = (i / rx) ** 2 + (j / ry) ** 2 + (hashPx(CX + i, CY + j, 93) - 0.5) * 0.2;
          if (e > 1) continue;
          img.px(Math.round(CX + i), Math.round(CY + j), e > 0.75 ? 0x2a2a34 : j < -ry * 0.3 && Math.abs(i) < rx * 0.6 ? 0x8a9aae : 0x4a5468, e > 0.75 ? 0.45 : 0.7);
        }
    }
    // reeds along the Kamo's north bank, in clumps, leaning in the current's air
    for (let x = 2; x < W - 2; x += 3 + er() * 5) {
      if ((x > 74 && x < 106) || (x > 20 && x < 40) || er() < 0.35) continue;
      const X0 = Math.round(x * S);
      const Y0 = Y(627) * S;
      const n = 4 + Math.floor(er() * 6);
      for (let k = 0; k < n; k++) {
        const len = 4 + Math.floor(er() * 6);
        const lean = (er() - 0.3) * 0.6;
        const c = er() < 0.6 ? 0x5a7a3a : er() < 0.5 ? 0x8a9a4a : 0xb8a860;
        for (let j = 0; j < len; j++) img.px(X0 + k + Math.round(lean * j), Y0 + 2 - j + 6, j === len - 1 ? 0xc8b878 : c);
      }
    }
    // the bamboo grove grown dense: culms every few paces between the planted ones, off the path and the
    // gardens, so the walk runs through a green wall as it does in Arashiyama
    for (let u = 2704; u < 3256; u += 3)
      for (let gx = 2; gx < W - 2; gx += 4) {
        const x = gx + er() * 3;
        const y = Y(u + er() * 2);
        if (er() < 0.8) continue;
        if (occAny(x - 1, y - 1, 3, 3) || !img.alpha(x, y)) continue;
        const culmSeed = Math.floor(er() * 1e9);
        if (groveOpen(x, y)) continue;
        objects.push(treeObj('bamboo', x, y, 0, culmSeed));
      }
    // the floor of the grove: a litter of narrow fallen leaves, straw and rust and a few still green, moss
    // creeping over the shady parts, the thin culms' roots breaking the surface
    {
      const lr = rng(1241);
      const free = (X, Yy) => X >= 0 && X < W * S && !isRes(X / S, Yy / S) && img.alpha(X / S, Yy / S);
      for (let n = 0; n < 26000; n++) {
        const X = Math.floor(lr() * W * S);
        const Yy = Math.floor((Y(3262) + lr() * (3262 - 2704)) * S);
        if (!free(X, Yy)) continue;
        const moss = fbm(X * 0.05, Yy * 0.05, { seed: 1243, scale: 3, octaves: 2 }) > 0.62;
        if (moss) {
          for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) if (free(X + i, Yy + j) && lr() < 0.7) img.px(X + i, Yy + j, rampColor(C.moss, 0.3 + lr() * 0.6, X + i, Yy + j));
          continue;
        }
        const k = lr();
        const c = k < 0.4 ? 0xa89658 : k < 0.7 ? 0x8a6e3e : k < 0.88 ? 0xc4b070 : 0x6a7a3c;
        const dx = lr() < 0.5 ? 1 : -1;
        const dy = lr() < 0.5 ? 0 : 0.5;
        const len = 3 + Math.floor(lr() * 4);
        for (let i = 0; i < len; i++) {
          const LX = X + dx * i;
          const LY = Math.round(Yy + dy * i);
          if (free(LX, LY)) img.px(LX, LY, i === 0 ? scaleColor(c, 0.8) : c);
        }
      }
      for (const [gx, rx, u1] of GLADES)
        for (let n = 0; n < 320; n++) {
          const X = Math.round((gx + (lr() - 0.5) * 2 * rx) * S);
          const Yy = Math.round(Y(u1 - lr() * 46) * S);
          const c = lr() < 0.5 ? 0xa8945a : lr() < 0.6 ? 0x8a7040 : 0xbca868;
          const dx = lr() < 0.5 ? 1 : -1;
          const len = 3 + Math.floor(lr() * 4);
          for (let i = 0; i < len; i++) if (free(X + dx * i, Yy + (i >> 1))) img.px(X + dx * i, Yy + (i >> 1), c);
        }
      // a bamboo shoot (takenoko): a spear of overlapping brown sheaths, hairy and dark-flecked, green at the tip
      const shoot = (X, Yy, n) => {
        objects.push({
          y: Yy / S,
          shadow: () => shadowPx(X - 2, Yy - 2, 12, 4, 0.6),
          draw: () => {
            for (let j = 0; j < n; j++) {
              const t = j / n;
              const w = Math.max(1, Math.round((n * 0.2 + 1) * (1 - t) ** 0.8));
              for (let i = -w; i <= w; i++) {
                const band = (j + (i > 0 ? 2 : 0)) % 4;
                let c = t > 0.8 ? 0x7a9a44 : band === 0 ? 0x3a2a1a : i < -w * 0.3 ? 0xb88a50 : i > w * 0.5 ? 0x5a3e24 : 0x8a6236;
                if (t <= 0.8 && hashPx(i, j, X) < 0.16) c = 0x2a1e14;
                img.px(X + i, Yy - j, c);
              }
            }
          },
        });
      };
      // a cut stump: a short length of culm, its top a pale ring round the hollow
      const stump = (X, Yy, w, tall) => {
        objects.push({
          y: Yy / S,
          shadow: () => shadowPx(X, Yy - 1, w + 5, 3, 0.6),
          draw: () => {
            for (let j = 0; j < tall; j++) for (let i = 0; i < w; i++) img.px(X + i, Yy - j, i < 1 ? 0x7a8a48 : i < w / 2 ? 0x8a9450 : i < w - 1 ? 0x5a6a38 : 0x3a4a28);
            for (let i = 0; i < w; i++) img.px(X + i, Yy - (tall >> 1), 0xc2c088);
            for (let i = -1; i <= w; i++) for (const j of [0, 1, 2]) {
              const e = Math.abs(i - (w - 1) / 2) / (w / 2 + 1);
              if (e > 1 - (j === 1 ? 0 : 0.35)) continue;
              img.px(X + i, Yy - tall - j, j === 1 && e < 0.5 ? 0x2a2014 : 0xe0d4a0);
            }
          },
        });
      };
      // a fallen culm lying across the leaves, its nodes still showing, gone the colour of straw
      const fallen = (X0, Y0, X1, Y1) => {
        const len = Math.hypot(X1 - X0, Y1 - Y0);
        const old = lr() < 0.5;
        const R = old ? [0x6a5834, 0xac9860, 0xd8c488, 0xf4e4ac] : [0x3e5a30, 0x7a9c54, 0xa0bc6c, 0xd0e094];
        const nodeAt = 15 + Math.floor(lr() * 8);
        objects.push({
          y: Math.max(Y0, Y1) / S,
          shadow: () => {
            for (let i = 0; i < len; i++) {
              const t = i / len;
              for (let j = 2; j < 7; j++) img.tintPx(Math.round(X0 + (X1 - X0) * t + 2), Math.round(Y0 + (Y1 - Y0) * t) + j, 0.7);
            }
          },
          draw: () => {
            for (let i = 0; i < len; i++) {
              const t = i / len;
              const X = Math.round(X0 + (X1 - X0) * t);
              const Yy = Math.round(Y0 + (Y1 - Y0) * t);
              const ring = i % nodeAt < 2;
              for (let j = 0; j < 5; j++) img.px(X, Yy + j, ring ? (j < 3 ? R[3] : R[1]) : j === 0 ? R[1] : j === 1 ? R[3] : j < 3 ? R[2] : j === 3 ? R[1] : R[0]);
              if (i % nodeAt === 2) for (let j = 0; j < 5; j++) img.px(X, Yy + j, R[0]);
            }
            // its dead twigs still sticking out
            for (let b = nodeAt; b < len - 4; b += nodeAt * 2) {
              const t = b / len;
              const X = X0 + (X1 - X0) * t;
              const Yy = Y0 + (Y1 - Y0) * t;
              for (let i = 0; i < 8; i++) img.px(Math.round(X + i * 0.5), Math.round(Yy - i * 0.8), R[1]);
            }
          },
        });
      };
      // culms the grove-keepers have cut, stacked on two sleepers for the fence-makers
      const stack = (X, Yy, len) => {
        objects.push({
          y: Yy / S,
          shadow: () => shadowPx(X + 3, Yy - 1, len + 6, 5, 0.72),
          draw: () => {
            for (const sx of [X + 8, X + len - 12]) for (let j = 0; j < 4; j++) for (let i = 0; i < 5; i++) img.px(sx + i, Yy - j, j === 3 ? 0x7a6a48 : 0x4a3c28);
            const rows = [[0, 5], [1, 4], [2, 3], [3, 2]];
            for (const [row, n] of rows)
              for (let k = 0; k < n; k++) {
                const y0 = Yy - 3 - (row + 1) * 5;
                const x0 = X + row * 3 + (k % 2);
                const tint = 0.9 + hashPx(k, row, X) * 0.22;
                for (let i = 0; i < len - row * 6; i++) {
                  const dy = k * 0;
                  for (let j = 0; j < 5; j++) {
                    const node = (i + k * 7) % 22 < 2;
                    const c = node ? 0xf0e8b0 : j === 0 ? 0x8a9a54 : j === 1 ? 0xe4e4a0 : j < 4 ? 0xc0c878 : 0x6e7e48;
                    if (j >= k * 0) img.px(x0 + i, y0 + j + dy, scaleColor(c, tint));
                  }
                }
              }
          },
        });
      };
      const gr = rng(1247);
      GLADES.forEach(([gx, rx, u1], g) => {
        const near = (d) => Y(u1 - d) * S; // (a row of the glade, d back from its far edge)
        const across = () => Math.round((gx - rx * 0.8 + gr() * rx * 1.6) * S);
        for (let k = 0; k < 7; k++) shoot(across(), near(8 + gr() * 34), 7 + Math.floor(gr() * 8));
        for (let k = 0; k < 5; k++) stump(across(), near(6 + gr() * 34), 5 + Math.floor(gr() * 4), 3 + Math.floor(gr() * 5));
        const fx = across();
        fallen(fx - 36, near(14 + gr() * 8), fx + 30, near(10 + gr() * 22));
        if (g % 2) fallen(fx - 18, near(26), fx + 34, near(32 + gr() * 6));
        if (g % 3 === 0) stack(Math.round((gx - 9) * S), near(30), 54);
      });
    }
    // ---- the sections' own life: clearings in the woods, each reached by a trail from the main path (sub-temples, tea
    // houses, ponds, little shrines, picnics); Gion's lanes; the squares of the old town. The trees come after this and
    // grow round whatever is here
    {
      const kr = rng(8101);
      const COATS = [0xd04040, 0x3a6ad0, 0xe8c040, 0xe8e8f0, 0x6aaa5a, 0xe07a30, 0x3a3a4a, 0x4a4038, 0x2a3040, 0x5a5a62];
      const padClear = (x, y, r = 14) => !pads.some((p) => Math.hypot(p.x - x, Y(p.u) - y) < r);
      const kfolk = (x, y, o = {}) => {
        if (!padClear(x, y)) return;
        const X = Math.round(x * S);
        const Yy = Math.round(y * S);
        const kim = o.kimono ?? kr() < 0.16;
        const look = kim
          ? { maiko: true, kimono: kr.pick(KIMONO), orn: kr() < 0.5, obi: kr.pick([0xe8c040, 0x2a2a6a, 0xf4f0e6, 0xc83a3a]) }
          : { coat: o.coat ?? kr.pick(COATS), hair: kr.pick([0x2a2024, 0x1a1418, 0x3a2a20, 0x6a5a48]), face: kr() < 0.5, legs: kr.pick([0x2a2a34, 0x3a4a6a, 0x1a1a20]) };
        objects.push({ y: (Yy + 5) / S, draw: () => personPx(X, Yy, look) });
      };
      const near = () => (kr() + kr() + kr() - 1.5) / 1.5;
      const knot = (cx, y, rx, ry, n, o = {}) => {
        for (let k = 0; k < n; k++) kfolk(cx + near() * rx, y + near() * ry, o);
      };
      /** A winding gravel trail through [x, u] points, its edges worn, reserved so the trees leave it open. */
      const trail = (pts, hw = 2.2) => {
        for (let i = 1; i < pts.length; i++) {
          const [x0, u0] = pts[i - 1];
          const [x1, u1] = pts[i];
          const n = Math.ceil(Math.hypot(x1 - x0, u1 - u0) * 2);
          for (let k = 0; k <= n; k++) {
            const t = k / n;
            const wob = Math.sin(t * 7 + i) * 1.2;
            const cx = x0 + (x1 - x0) * t + (Math.abs(u1 - u0) > Math.abs(x1 - x0) ? wob : 0);
            const cu = u0 + (u1 - u0) * t + (Math.abs(u1 - u0) > Math.abs(x1 - x0) ? 0 : wob);
            const CX = Math.round(cx * S);
            const CY = Math.round(Y(cu) * S);
            const R = Math.round(hw * S);
            for (let j = -R; j <= R; j++)
              for (let a = -R; a <= R; a++) {
                const d = Math.hypot(a, j);
                if (d > R || !img.alphaPx(CX + a, CY + j)) continue;
                const c = gravelPx(CX + a, CY + j);
                img.px(CX + a, CY + j, d > R - 1.5 ? scaleColor(c, 0.74) : c);
              }
            reserveRect(Math.floor(cx - hw - 1), Math.floor(Y(cu) - hw - 1), Math.ceil(hw * 2 + 3), Math.ceil(hw * 2 + 3), true);
          }
        }
        // somebody walking it, and a stone lantern here and there along it
        const frames = kr.pick(strollers);
        const len = pts.reduce((a, p, i) => a + (i ? Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
        if (len > 18) kit.path(pts, frames, { sp: 2.6 + kr() * 1.2, n: 1 + Math.floor(len / 40), gap: 34, mode: 'pp', hold: 2.5, turn: 'none', fps: 3, s0: kr() });
      };
      const stroller2 = (c, st, u) => {
        const out = new HiCanvas(2, 4);
        for (let i = 1; i < 3; i++) out.px(i, 0, 0x2a2024);
        out.px(1, 1, 0x2a2024);
        out.px(2, 1, 0xe8c0a0);
        for (let j = 2; j < 6; j++) for (let i = 0; i < 4; i++) if (!(j > 4 && (i === 0 || i === 3))) out.px(i, j, i === 0 || i === 3 ? scaleColor(c, 0.75) : c);
        out.px(st ? 1 : 2, 6, 0x2a2a34);
        out.px(st ? 2 : 1, 7, 0x2a2a34);
        for (let i = 2; i < 6; i++) out.px(i, 9, 0x101418, 0.4);
        return kit.frame(gradeAt(out, u));
      };
      var strollers = [0xd04040, 0x3a6ad0, 0xe8c040, 0xe8e8f0, 0x6aaa5a, ...KIMONO.slice(0, 3)].map((c) => [stroller2(c, 0, 4100), stroller2(c, 1, 4100)]);
      /** A clearing: soft moss and fallen petals where the woods stand back. */
      const clearing = (cx, cu, rx, ry, seed) => {
        const cy = Y(cu);
        img.fine(Math.floor(cx - rx - 2), Math.floor(cy - ry - 2), Math.ceil(rx * 2 + 4), Math.ceil(ry * 2 + 4), (FXr, FYr, x, y) => {
          const e = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + (fbm(x, y, { seed, scale: 7 }) - 0.5) * 0.35;
          if (e >= 1 || !img.alphaPx(FXr, FYr)) return null;
          const g = hashPx(FXr, FYr, seed);
          if (g < 0.012) return 0xf0b8cc;
          if (g < 0.02) return 0xd8cfa0;
          return rampColor(C.moss, 0.42 + fbm(x, y, { seed: seed + 1, scale: 4 }) * 0.5 + (hashPx(FXr >> 1, FYr >> 1, seed + 2) - 0.5) * 0.18, FXr, FYr);
        });
        for (let y = Math.floor(cy - ry - 2); y <= cy + ry + 2; y++)
          for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1.05) reserveRect(x, y, 1, 1, true);
      };
      const gravelYard = (x0, y0, w, h) =>
        img.fine(x0, y0, w, h, (FXr, FYr) => {
          const k = FYr % 4;
          return k === 0 ? C.whiteGravel[0] : k === 1 ? C.whiteGravel[3] : hashPx(FXr, FYr, 83) < 0.1 ? C.whiteGravel[1] : C.whiteGravel[2];
        });
      const rock = (x, y, r) => boulderPx(x * S, y * S, r);
      /** A sub-temple: its hall, raked gravel with a group of rocks, lanterns, visitors at the door. */
      const subTemple = (cx, cu) => {
        clearing(cx, cu, 27, 19, 8200 + cu);
        hall(cx - 15, Y(cu + 13), 30, 12, 5, 'temple');
        const yy = Y(cu + 13) + 18;
        gravelYard(cx - 15, yy, 30, 12);
        rock(cx - 8, yy + 5, 5);
        rock(cx - 3, yy + 7, 3);
        rock(cx + 8, yy + 6, 4);
        reserveRect(cx - 16, yy, 32, 13);
        for (const x of [cx - 19, cx + 18]) lantern(x, yy + 2);
        knot(cx, yy - 1, 11, 1, 7);
        knot(cx, yy + 15, 12, 1.5, 4);
      };
      /** A tea house, its bench under a red parasol, stepping stones, a stone basin, a bamboo fence. */
      const teaHouse = (cx, cu) => {
        clearing(cx, cu, 19, 14, 8300 + cu);
        hall(cx - 9, Y(cu + 9), 18, 8, 4, 'hondo');
        const yy = Y(cu + 9) + 12;
        const X = cx * S;
        objects.push({
          y: yy + 6,
          shadow: () => shadowPx(X - 18, yy * S + 2, 16, 8, 0.6),
          draw: () => {
            // the bench with its red felt, the great parasol
            for (let j = 0; j < 7; j++) for (let i = -24; i < 0; i++) img.px(X + i, yy * S + 4 + j, j === 0 ? 0xf05a48 : j > 5 ? 0x8a1a14 : 0xd83a2a);
            for (let j = -9; j <= 9; j++) for (let i = -16; i <= 16; i++) if ((i / 16) ** 2 + (j / 9) ** 2 < 1) img.px(X - 12 + i, yy * S - 6 + j, (Math.floor(Math.atan2(j * 1.8, i) * 2.6 + 9) % 2 ? 0xe8402e : 0xc8301e));
            // the stone basin with its bamboo spout
            for (let j = -4; j <= 4; j++) for (let i = -5; i <= 5; i++) if (i * i + j * j < 24) img.px(X + 16 + i, yy * S + 6 + j, i * i + j * j < 10 ? C.water[2] : C.stone[2]);
            for (let i = 0; i < 9; i++) img.px(X + 16 + i, yy * S + 1, 0x8a9a4a);
            // the bamboo fence behind it
            for (let i = 8; i < 42; i++) for (let j = 0; j < 7; j++) img.px(X + i, Y(cu + 9) * S + 12 + j, i % 3 === 0 ? 0x5a4a28 : j === 3 ? 0x2a1e14 : 0xa89a58);
          },
        });
        for (let k = 0; k < 3; k++) kfolk(cx - 8 + k * 2.4, yy - 1, { kimono: k === 1 });
        for (let k = 0; k < 5; k++) {
          const CX = cx * S - 2 + k * 2;
          const CY = (yy + 7 + k * 2) * S;
          for (let j = -3; j <= 3; j++) for (let i = -5; i <= 5; i++) if ((i / 5) ** 2 + (j / 3) ** 2 < 1) img.px(CX + i, CY + j, i + j < -2 ? C.stone[3] : C.stone[2]);
        }
      };
      /** A pond with its koi, a little red bridge over the neck of it, lanterns, water lilies. */
      const pondGarden = (cx, cu, rx, ry) => {
        clearing(cx, cu, rx + 7, ry + 6, 8400 + cu);
        pondAt(cx, cu, rx, ry, C.pond, 8500 + cu, C.stone);
        const lr = rng(cu);
        for (let n = 0; n < rx * 3; n++) {
          const a = lr() * Math.PI * 2;
          const q = 0.25 + lr() * 0.6;
          const LX = Math.round((cx + Math.cos(a) * rx * q) * S);
          const LY = Math.round((Y(cu) + Math.sin(a) * ry * q) * S);
          for (let j = -2; j <= 2; j++) for (let i = -3; i <= 3; i++) if ((i / 3) ** 2 + (j / 2) ** 2 < 1) img.px(LX + i, LY + j, i < 0 ? 0x6ab85a : 0x3a8a44);
          if (lr() < 0.3) img.px(LX, LY - 1, 0xffc0d8);
        }
        // the bridge across at the middle
        const X0 = (cx - 3) * S;
        for (let j = 0; j < (ry * 2 + 4) * S; j++) {
          const Yy = (Y(cu) - ry - 2) * S + j;
          for (let i = 0; i < 18; i++) img.px(X0 + i, Yy, i < 2 || i > 15 ? (j % 12 < 3 ? 0x1a1210 : C.R1) : j % 5 === 0 ? C.wood[1] : C.wood[3]);
        }
        const koiF = [0xf08a2a, 0xf4f0e6, 0xe84a2a].map((c) => {
          const out = new HiCanvas(5, 2);
          for (let i = 0; i < 12; i++) for (let j = 1; j < 5; j++) if (Math.abs(j - 2.5) < 2 - Math.abs(i - 5) * 0.28) out.px(i, j, (i >> 1) % 2 ? c : 0xf8f4ec);
          return kit.frame(gradeAt(out, cu));
        });
        kit.wander(cx - rx * 0.5, cu, rx * 0.3, ry * 0.5, [koiF[0], koiF[1]], { n: 2, sp: 3, idle: 0.3, fps: 2 });
        kit.wander(cx + rx * 0.5, cu, rx * 0.3, ry * 0.5, [koiF[2], koiF[1]], { n: 2, sp: 3, idle: 0.3, fps: 2 });
        knot(cx, Y(cu) + ry + 4, rx * 0.7, 1.5, 7);
      };
      /** A little shrine: its hall, red torii one behind another up the path, foxes. */
      const smallShrine = (cx, cu) => {
        clearing(cx, cu, 17, 16, 8600 + cu);
        hall(cx - 9, Y(cu + 12), 18, 9, 4, 'shrine');
        for (const uu of [cu - 2, cu - 8]) gateSmall(cx, Y(uu), 4, false, { span: 8, h: 10, rope: false });
        fox(cx - 13, Y(cu - 4), false);
        fox(cx + 8, Y(cu - 4), true);
        knot(cx, Y(cu - 10), 9, 1.5, 5);
      };
      const picnic = (cx, cu) => {
        clearing(cx, cu, 14, 10, 8700 + cu);
        for (const [dx, dy, c] of [[-9, -3, 0x3a72d8], [3, 0, kr() < 0.5 ? 0x3a72d8 : 0xe8d050]]) {
          const X = (cx + dx) * S;
          const Yy = (Y(cu) + dy) * S;
          for (let j = 0; j < 15; j++) for (let i = 0; i < 21; i++) img.px(X + i, Yy + j, j === 7 || i === 10 ? scaleColor(c, 1.12) : j > 12 ? scaleColor(c, 0.7) : (i + j) % 4 === 0 ? scaleColor(c, 0.88) : c);
          for (const [a, b, col] of [[7, 4, 0x8a1a14], [11, 4, 0x1a1414], [8, 8, 0xf4f0e6]]) for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) img.px(X + a + i, Yy + b + j, col);
          for (const [a, b] of [[-1, -1], [16, -2], [-1, 9], [16, 8], [8, -3]]) kfolk((X + a) / S, (Yy + b) / S);
        }
      };

      // --- the Golden Pavilion's woods
      subTemple(48, 4122);
      trail([[76, 4120], [104, 4112], [135, 4116]]);
      teaHouse(28, 4018);
      trail([[47, 4022], [78, 4040], [110, 4030], [135, 4032]]);
      pondGarden(66, 4218, 20, 11);
      trail([[90, 4220], [110, 4212], [135, 4212]]);
      picnic(22, 4206);
      smallShrine(166, 3986);
      trail([[150, 3986], [146, 3986]]);
      picnic(166, 3756);
      teaHouse(164, 4160);
      trail([[146, 4150], [150, 4155]]);
      subTemple(68, 3640);
      trail([[68, 3622], [62, 3600], [66, 3570]]);
      picnic(30, 3640);
      // --- Ryōan-ji's woods
      subTemple(76, 4628);
      trail([[104, 4624], [130, 4634], [164, 4632]]);
      trail([[112, 4490], [130, 4494], [150, 4490]]);
      picnic(20, 4566);
      smallShrine(140, 4552);
      trail([[150, 4552], [162, 4552]]);
      teaHouse(30, 4600);
      trail([[48, 4610], [58, 4620]]);
      // --- the valley under Kiyomizu's stage
      teaHouse(46, 5668);
      trail([[90, 5562], [80, 5610], [66, 5650], [60, 5666]]);
      smallShrine(120, 5640);
      trail([[92, 5575], [108, 5610], [118, 5624]]);
      // --- the way up the mountain
      subTemple(146, 5992);
      trail([[118, 5990], [104, 5990]]);
      smallShrine(38, 6042);
      trail([[54, 6042], [76, 6036], [97, 6040]]);
      teaHouse(148, 6104);
      trail([[130, 6104], [112, 6098], [97, 6100]]);
      picnic(30, 6176);
      smallShrine(44, 6262);
      trail([[60, 6262], [74, 6256], [82, 6258]]);
      subTemple(140, 6240);
      trail([[112, 6236], [98, 6236]]);
      for (const [u0, u1, fx] of [[3510, 4410, () => 140], [4430, 4690, (u) => 140 + 30 * smooth(4420, 4600, u)], [5940, 6290, (u) => 90 + 12 * Math.sin(((u - 5930) * Math.PI) / 185)]])
        for (let u = u0; u < u1; u += 26)
          for (const sd of [-1, 1]) {
            const x = Math.round(fx(u) + sd * 8);
            if (!isRes(x, Y(u)) && !isRes(x, Y(u) + 3)) lantern(x - 1, Y(u));
          }

      // --- Gion: the lanes paved in small setts, worn along the middle; people in them, bicycles, potted plants, wooden
      // signs, lamps at the corners
      const groundish = (X, Yr) => {
        const q = img.rgbaPx(X, Yr);
        return q && q[3] && q[0] > 0x30 && q[0] < 0x74 && Math.abs(q[0] - q[1]) < 11 && q[1] >= q[2] - 2 && q[1] - q[2] < 16;
      };
      const setts = (x0, x1, u0, u1, a, b, c, clear) => {
        for (let Yr = Y(u1) * S; Yr < Y(u0) * S; Yr++)
          for (let X = x0 * S; X < x1 * S; X++) {
            if (clear(X / S, L - Yr / S) || !groundish(X, Yr)) continue;
            const row = Yr >> 2;
            const XX = X + (row % 2) * 3;
            const joint = Yr % 4 === 0 || XX % 6 === 0;
            const tone = hashPx(XX >> 2, row, 8801);
            let col = joint ? c : tone < 0.5 ? a : b;
            if (hashPx(X >> 3, Yr >> 3, 8802) < 0.06 && !joint) col = scaleColor(col, 0.86);
            img.px(X, Yr, col);
          }
      };
      const stairsX = (u) => 90 + 16 * Math.sin((u - 5000) / 60) * (1 - smooth(5320, 5400, u));
      setts(0, W, 2, 540, 0x8c8678, 0x7e786c, 0x524c44, (x) => x > 75 && x < 105);
      setts(0, W, 5000, 5424, 0x948e80, 0x867f72, 0x565046, (x, u) => Math.abs(x - stairsX(u)) < 11);
      const laneOk = (x, y) => {
        const i = Math.floor(y) * W + Math.floor(x);
        return i >= 0 && i < W * L && (laneMargin[i] || !isRes(Math.floor(x), Math.floor(y)));
      };
      const lanes = (u0, u1, n, clear) => {
        const spots = [];
        for (let k = 0; k < n * 16 && spots.length < n + 70; k++) {
          const x = 3 + kr() * 174;
          const u = u0 + kr() * (u1 - u0);
          const y = Y(u);
          if (!clear(x, u) && laneOk(x, y) && laneOk(x, y + 2) && laneOk(x + 1, y) && laneOk(x, y - 1)) spots.push([x, y]);
        }
        return spots;
      };
      const dressed = (spots, n) =>
        spots.slice(0, n).forEach(([x, y], k) => {
          if (k % 6 === 0) {
            // a bicycle, a tub of bamboo or a little signboard
            const X = Math.round(x * S);
            const Yy = Math.round(y * S);
            const v = k % 18;
            objects.push({
              y: y + 2,
              draw: () => {
                if (v === 0) {
                  for (const i of [0, 9]) for (let j = -2; j <= 2; j++) img.px(X + i, Yy + j, 0x1a1a22);
                  for (let i = 0; i < 10; i++) img.px(X + i, Yy, 0xc83a2a);
                  img.px(X + 7, Yy - 2, 0xa8a8b0);
                } else if (v === 6) {
                  for (let j = 0; j < 5; j++) for (let i = 0; i < 6; i++) img.px(X + i, Yy + j, j === 0 ? 0x7a5835 : 0x5e4229);
                  for (let j = -8; j < 0; j++) for (let i = 1; i < 5; i++) if ((i + j) % 2 === 0) img.px(X + i, Yy + j, (j + 20) % 3 ? 0x4a8a3e : 0x2a5a2a);
                } else {
                  for (let j = -4; j < 6; j++) for (let i = 0; i < 6; i++) img.px(X + i, Yy + j, j === -4 || i === 0 || i === 5 ? 0x2a1e18 : 0xf0e8d8);
                  glyph(X + 1, Yy - 2, 4, 0x1a1414, rng(k + X), (gx, gy, gc) => img.px(gx, gy, gc));
                }
              },
            });
          } else kfolk(x, y);
        });
      const gionSpots = lanes(4, 492, 560, (x) => x > 74 && x < 106);
      dressed(gionSpots, 500);
      const townSpots = lanes(5026, 5386, 330, (x, u) => Math.abs(x - stairsX(u)) < 12);
      dressed(townSpots, 280);
      const spots = [...gionSpots.slice(500), ...townSpots.slice(280)];
      // the corners lit, red paper lanterns on brackets
      for (const [x, y] of spots) lampPost(x, y);
      function lampPost(x, y) {
        const X = Math.round(x * S);
        const Yy = Math.round(y * S);
        objects.push({
          y: y + 2,
          draw: () => {
            for (let j = -12; j < 4; j++) img.px(X, Yy + j, 0x2a2024);
            for (let j = 0; j < 7; j++) for (let i = 0; i < 5; i++) if (!((j === 0 || j === 6) && (i === 0 || i === 4))) img.px(X + 1 + i, Yy - 12 + j, j === 0 || j === 6 ? 0x1a1414 : j % 2 ? 0xe8452a : 0xc8301e);
          },
        });
      }
      // --- the square before Yasaka's west gate: granite setts, stalls, cherries, the people gathering
      for (const [x, u, kind] of [[8, 520, 'dango'], [30, 520, 'yakitori'], [132, 520, 'omamori'], [154, 520, 'taiyaki'], [20, 498, 'ramune'], [150, 498, 'kitsune']]) {
        const y = Y(u);
        if (free(x, y, 18, 12)) {
          stall(x, y, kind);
          knot(x + 9, y + 15, 8, 2, 7);
        }
      }
      knot(90, Y(490), 22, 4, 26);
      for (let k = 0; k < 60; k++) {
        const x = 4 + kr() * 172;
        const y = Y(494 + kr() * 44);
        if (!isRes(Math.floor(x), Math.floor(y))) kfolk(x, y);
      }
      // --- the old town's two cross streets on the way up to Kiyomizu
      for (const [u, list] of [[5020, [[6, 'dango'], [28, 'taiyaki'], [50, 'omamori'], [112, 'ramune'], [134, 'kitsune'], [156, 'yakitori']]], [5418, [[6, 'kitsune'], [30, 'dango'], [120, 'taiyaki'], [150, 'omamori']]]]) {
        for (const [x, kind] of list) {
          const y = Y(u);
          if (free(x, y, 18, 12)) {
            stall(x, y, kind);
            knot(x + 9, y + 15, 8, 2, 6);
          }
        }
        for (let k = 0; k < 70; k++) {
          const x = 3 + kr() * 174;
          const y = Y(u - 18 + kr() * 18);
          if (!isRes(Math.floor(x), Math.floor(y))) kfolk(x, y);
        }
        const ws = strollers;
        for (const [a, b] of [[[6, u - 14], [70, u - 14]], [[174, u - 10], [110, u - 10]]]) kit.path([a, b], kr.pick(ws), { sp: 3, n: 2, gap: 24, mode: 'pp', hold: 2, turn: 'none', fps: 3, s0: kr() });
      }
      // --- Hanamikōji: the white lanterns with Gion's red dumplings all down the eaves of both sides
      const dango = (X, Yy) => {
        for (let j = 0; j < 11; j++)
          for (let i = 0; i < 7; i++) {
            if ((j === 0 || j === 10) && (i === 0 || i === 6)) continue;
            img.px(X + i, Yy + j, j === 0 || j === 10 ? 0x1a1414 : i === 0 ? 0xf8f4ea : i === 6 ? 0xc8c4b8 : (j + 2) % 3 === 0 ? 0xd8d4c8 : 0xf0ecdc);
          }
        for (const a of [1, 3, 5]) for (const b of [3, 5, 7]) if (a === 3 || b === 5) img.px(X + a, Yy + b, 0xc8201a);
        img.px(X + 3, Yy - 1, 0x2a2024);
      };
      for (let u = 8; u < 490; u += 7) {
        if (u > 165 && u < 192) continue;
        for (const x of [76, 103]) {
          const y = Y(u);
          objects.push({ y: y + 3, draw: () => dango(x * S, y * S) });
        }
      }
      // parasols among the crowd on the street, tourists stopping to photograph a maiko
      const parasolFolk = (x, y, c) =>
        objects.push({
          y: y + 2,
          draw: () => {
            const X = Math.round(x * S);
            const Yy = Math.round(y * S);
            personPx(X, Yy, { maiko: true, kimono: kr.pick(KIMONO), orn: true, obi: 0xe8c040 });
            for (let j = -4; j <= 3; j++) for (let i = -7; i <= 7; i++) if ((i / 7.2) ** 2 + (j / 4.2) ** 2 <= 1) img.px(X + 1 + i, Yy - 7 + j, i === 0 || (i + 14) % 4 === 0 ? scaleColor(c, 0.74) : i < -2 ? scaleColor(c, 1.18) : c);
          },
        });
      for (const u of [70, 250, 420]) {
        parasolFolk(88 + kr() * 6, Y(u), 0xc8302a);
        knot(90, Y(u) + 5, 8, 2, 8);
      }
      // --- the Kamo: children hopping the turtle stones (live), herons in the shallows, lanterns along the terraces' rails
      {
        const kid = strollers[1];
        kit.path([[32, 568], [32, 624]], kid, { sp: 2.4, n: 2, gap: 26, mode: 'pp', hold: 3, turn: 'none', fps: 4, s0: 0.2 });
        for (const u of [580, 604]) kfolk(32, Y(u) - 1, { coat: 0xe07a30 });
        const heron = (x, y) =>
          objects.push({
            y: y + 2,
            draw: () => {
              const X = x * S;
              const Yy = y * S;
              for (const [i, j, c] of [[0, 0, 0xe8e8ec], [1, 0, 0xffffff], [2, 0, 0xffffff], [3, 0, 0xd8d8e0], [4, 1, 0xa8a8b4], [0, -1, 0xffffff], [0, -2, 0xffffff], [0, -3, 0xffffff], [-1, -3, 0xe8c040], [-2, -3, 0xe8c040], [1, 1, 0x4a3a2a], [1, 2, 0x4a3a2a], [3, 1, 0x4a3a2a], [3, 2, 0x4a3a2a]]) img.px(X + i, Yy + j, c);
            },
          });
        for (const [x, u] of [[10, 612], [56, 574], [122, 616], [168, 578], [146, 566]]) heron(x, Y(u));
        for (const [x0, x1] of [[4, 72], [108, 176]])
          for (let x = x0; x < x1; x += 6) {
            const y = Y(561);
            objects.push({
              y: y + 3,
              draw: () => {
                for (let j = 0; j < 8; j++) for (let i = 0; i < 5; i++) if (!((j === 0 || j === 7) && (i === 0 || i === 4))) img.px(x * S + i, y * S + j, j === 0 || j === 7 ? 0x1a1414 : j % 2 ? 0xf8f0d8 : 0xe8d8b0);
                img.px(x * S + 2, y * S + 3, 0xc8301e);
              },
            });
          }
      }
      // --- the Katsura: the weir above the bridge with the water piled white on it, rental boats tied up along the bank,
      // their mooring posts, the old fisherman with cormorants and his fire basket (live)
      {
        for (let X = 0; X < W * S; X++) {
          const Yc = Math.round(Y(3398 + (X / S - 90) * 0.1) * S);
          if (X > 80 * S && X < 100 * S) continue;
          for (let j = -6; j < 16; j++) {
            const n = hashPx(X >> 1, j, 8101);
            if (j < 0 && n < 0.5 + j * 0.08) img.px(X, Yc + j, 0xd8ecf0, 0.5);
            else if (j >= 0 && j < 4) img.px(X, Yc + j, n < 0.8 ? 0xf8fcff : 0xc8e0e8);
            else if (j >= 4 && n < 0.5 - j * 0.03) img.px(X, Yc + j, n < 0.2 ? 0xf0f8fc : 0xa8d0d8, 0.8);
          }
        }
        const rowboat = (x, y, c) =>
          objects.push({
            y: y + 8,
            draw: () => {
              const X = x * S;
              const Yy = y * S;
              for (let j = 0; j < 27; j++) {
                const hw = j < 6 ? 1 + j * 0.9 : 6;
                for (let i = -hw; i <= hw; i++) {
                  const e = hw - Math.abs(i);
                  img.px(X + Math.round(i), Yy + j, e < 1 ? scaleColor(c, 0.6) : e < 2 ? (i < 0 ? 0xf4f0e6 : 0xc8c4b8) : j % 7 < 2 ? 0x7a5835 : 0x9a7040);
                }
              }
              for (let j = 27; j < 33; j++) img.px(X, Yy + j, 0xc8b888);
            },
          });
        for (const [x0, x1] of [[6, 76], [104, 176]])
          for (let x = x0; x < x1; x += 8) rowboat(x, Y(3350) + Math.floor(kr() * 3), kr.pick([0x2a5ab0, 0xc8302a, 0x2a8a6a, 0xe8c040]));
        const ukai = [0, 1, 2].map((k) => {
          const out = new HiCanvas(30, 12);
          const OY = 18;
          for (let i = 0; i < 90; i++) {
            const hw = i < 18 ? 2 + i * 0.5 : i > 80 ? 5 : 11;
            for (let j = -hw; j <= hw; j++) out.px(i, OY + Math.round(j), Math.abs(j) > hw - 1.5 ? 0x2a1e14 : (i >> 2) % 3 ? 0x5e4229 : 0x46301f);
          }
          // the fisherman in his straw skirt, a helper at the stern, the cormorants on their leashes in the water
          for (const [i, j, c] of [[40, -1, 0x2a2024], [41, -1, 0x2a2024], [42, -1, 0x2a2024], [40, 0, 0xc8a868], [41, 0, 0xc8a868], [42, 0, 0xc8a868], [40, 1, 0xa88848], [42, 1, 0xa88848], [70, 0, 0x2a2a34], [71, 0, 0x2a2a34]]) out.px(i, OY + j, c);
          for (let i = 12; i < 30; i++) out.px(i, OY - 15 + (k % 2), 0x8a8a90, 0.5);
          for (const [bx, by] of [[10, -14], [24, -13 + k], [32, -16]]) {
            for (const [a, b] of [[0, 0], [1, 0], [2, 0], [0, -1], [-1, -1]]) out.px(bx + a, OY + by + b, 0x101014);
            out.px(bx + 3, OY + by, 0xd8ecf0, 0.7);
          }
          // the iron basket of fire hung over the bow, sparks, its light on the water
          for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) if (i * i + j * j < 38) out.px(10 + i, OY + j, i * i + j * j < 12 ? 0xfff0a0 : (i + j + k) % 3 ? 0xff8a2a : 0xd83a1a);
          for (let q = 0; q < 4; q++) out.px(10 + ((q * 7 + k * 5) % 11) - 5, OY - 8 - ((q * 3 + k) % 6), 0xffc060);
          return kit.frame(gradeAt(out, 3380));
        });
        kit.path([[30, 3366], [76, 3366]], ukai, { sp: 2, mode: 'pp', hold: 5, turn: 'flip', fps: 6, s0: 0.3 });
        kit.path([[150, 3420], [104, 3420]], ukai, { sp: 2, mode: 'pp', hold: 6, turn: 'flip', fps: 6, s0: 0.7 });
      }
      // --- Ryōan-ji: the old clay wall's tile cap, a stone basin by the veranda, the wall stained by age
      {
        const wy = Y(4700) * S;
        for (let X = 18 * S; X < 160 * S; X++)
          for (let j = -5; j < 4; j++) img.px(X, wy + j, j === -5 ? 0x8a94a4 : j === 3 ? 0x1a181c : (X + (j > -1 ? 2 : 0)) % 5 < 2 ? 0x3c4452 : 0x515b6c);
        for (let k = 0; k < 60; k++) {
          const X = Math.floor((18 + kr() * 142) * S);
          for (let j = 4; j < 12; j++) if (kr() < 0.7) img.tintPx(X, wy + j, 0.82);
        }
      }
      // --- Kiyomizu: the queue for Otowa's three streams, parasols and cameras along the stage's rail, its visitors
      for (let k = 0; k < 26; k++) kfolk(60 + k * 1.2, Y(5604 - k * 0.5));
      for (let x = 30; x < 150; x += 11 + Math.floor(kr() * 9)) parasolFolk(x + kr() * 4, Y(5726), kr.pick([0xc8302a, 0xe0803a, 0xb83a6a, 0x3a5ab0]));
      // --- Daimonji: lit lanterns all the way up the mountain path, pilgrims with hand lamps climbing it (live), the crowd
      // gathering below the fires
      for (let u = 6310; u < 6860; u += 18) {
        const px = 90 + 10 * Math.sin((u - 6300) / 110);
        for (const sd of [-1, 1]) {
          const x = Math.round(px + sd * 8);
          if (!isRes(x, Y(u)) && padClear(x, Y(u), 13)) lantern(x - 1, Y(u));
        }
      }
      {
        const walker = (st) => {
          const out = new HiCanvas(3, 4);
          for (let i = 1; i < 3; i++) out.px(i, 0, 0x2a2024);
          for (let j = 1; j < 6; j++) for (let i = 0; i < 4; i++) out.px(i, j, 0x4a4a5a);
          out.px(st ? 1 : 2, 6, 0x2a2a34);
          out.px(st ? 2 : 1, 7, 0x2a2a34);
          gradeAt(out, 6500);
          for (let j = 2; j < 5; j++) for (let i = 5; i < 8; i++) out.px(i, j, 0xffd890);
          return kit.frame(out);
        };
        const pts = [];
        for (let u = 6310; u < 6870; u += 18) pts.push([90 + 10 * Math.sin((u - 6300) / 110) - 2, u]);
        kit.path(pts, [walker(0), walker(1)], { sp: 2.6, n: 6, gap: 80, mode: 'pp', hold: 3, turn: 'none', fps: 3, s0: 0.1 });
      }
    }
  }

  // ------------------------------------------------------------ trees
  function sectionKinds(u) {
    if (u < KAMO[1]) return [['sakura', 0.6], ['broadleaf', 1]];
    if (u < SHRINE[1]) return [['sakura', 0.35], ['pine', 0.7], ['broadleaf', 1]];
    if (u < TORII[1]) return [['cedar', 0.55], ['broadleaf', 0.88], ['sakura', 1]];
    if (u < 3260) return [['bamboo', 0.85], ['cedar', 1]];
    if (u < ARASHI[1]) return [['sakura', 0.6], ['broadleaf', 1]];
    if (u < KINKAKU[1]) return [['pine', 0.45], ['broadleaf', 0.8], ['sakura', 1]];
    if (u < RYOAN[1]) return [['pine', 0.4], ['broadleaf', 0.75], ['sakura', 1]];
    if (u < KIYOMIZU[1]) return [['sakura', 0.55], ['broadleaf', 0.85], ['pine', 1]];
    return [['cedar', 0.5], ['broadleaf', 0.85], ['sakura', 1]];
  }
  const RADIUS = { sakura: [6, 9.5], broadleaf: [6, 9], cedar: [4.5, 7], bamboo: [3.5, 5.5], pine: [5, 8] };
  /**
   * A bamboo branch: a thin twig rising from the node and bending under its own weight, with fans of narrow
   * spindle-shaped leaves all along it, hanging. Each leaf drops a little shade on what lies under it, lit along
   * its upper edge, its tip paler, and here and there a yellow one about to fall.
   */
  function groveSpray(put, shade, X0, Y0, side, len, LEAF, r) {
    const tone = r();
    const at = (t) => [X0 + side * len * t, Y0 - len * 0.62 * t + len * 0.5 * t * t];
    for (let i = 0; i <= len; i++) {
      const [X, Y] = at(i / len);
      put(X, Y, i < len * 0.5 ? LEAF[0] : LEAF[1]);
    }
    for (let d = 4 + r() * 3; d <= len; d += 4 + r() * 4) {
      const [X, Y] = at(d / len);
      const fan = 3 + Math.floor(r() * 3);
      for (let k = 0; k < fan; k++) {
        const ang = -0.75 + (k / (fan - 1)) * 2 + (r() - 0.5) * 0.35; // (a fan: from up and out, through out along the twig, to hanging)
        const dx = side * Math.cos(ang);
        const dy = Math.sin(ang);
        const n = 8 + Math.floor(r() * 6);
        const base = Math.min(4, Math.floor(1 + tone * 3 + r() * 1.5 - (ang > 1 ? 1 : 0)));
        const yellow = r() < 0.025;
        for (let i = 0; i < n; i++) {
          const t = i / n;
          const LX = X + dx * i;
          const LY = Y + dy * i + t * t * 3; // (every leaf tip sags a little)
          shade(LX + 2, LY + 3, 0.8);
          const wide = t > 0.14 && t < 0.72;
          let c = yellow ? (t > 0.6 ? 0xe0c860 : 0xc8b04c) : LEAF[Math.max(1, base - (t < 0.12 ? 1 : 0))];
          if (!yellow && t > 0.85) c = LEAF[Math.min(4, base + 1)];
          put(LX, LY, c, true);
          if (wide) put(LX - dy * side, LY + 1, yellow ? 0xa8903c : LEAF[Math.max(0, base - 2)], true);
        }
      }
    }
  }
  function treeObj(kind, x, y, r, seed = Math.floor(rand() * 1e9)) {
    const cx = Math.round(x);
    const cy = Math.round(y);
    if (kind === 'bamboo') {
      // a culm in fine pixels, of its own age and girth: bright and powdery when young, deep green in its prime,
      // yellowing and blotched with lichen when old, straw-coloured and bare when dead. It tapers and bows as
      // it rises, its internodes short at the foot and long in the middle, each node a swollen ring with the
      // groove under it and the white bloom below; roots at its foot, the sheaths it has shed round them
      const h = 45 + seed % 19;
      const br = rng(seed);
      const CX = cx * S + 1;
      const CY = cy * S + 2;
      const H = h * S;
      const age = br();
      const AGE = age < 0.2 ? 0 : age < 0.72 ? 1 : age < 0.95 ? 2 : 3;
      const RAMP = [
        [0x2e5a34, 0x6ea85a, 0x9ccc78, 0xd4eeb0],
        [0x20402c, 0x4e8048, 0x6f9c58, 0xa4c47c],
        [0x3a4624, 0x74843f, 0x949f50, 0xc4c478],
        [0x54442a, 0xa08c56, 0xc0a96c, 0xe2d094],
      ][AGE];
      const LEAF = [
        [0x34662f, 0x5c9a42, 0x7ab84e, 0xa2d060, 0xc4e27c],
        [0x28522c, 0x467a38, 0x5e8f42, 0x7aa64c, 0x9cbb62],
        [0x34522a, 0x567636, 0x74903e, 0x96a84a, 0xbcbc5c],
        [0x5a4c28, 0x806c34, 0xa08a44, 0xbca458, 0xd4bc70],
      ][AGE];
      const girth = br();
      const W0 = girth < 0.14 ? 9 : girth < 0.45 ? 7 : girth < 0.85 ? 6 : 4;
      const lean = (seed % 5) - 2 + (br() - 0.5);
      const bow = (br() - 0.5) * 3;
      const stalk = (Y) => {
        const t = (CY - Y) / H;
        return CX + S * (lean * t + bow * t * t);
      };
      const widthAt = (Y) => Math.max(2, Math.round(W0 * (1 - 0.6 * ((CY - Y) / H) ** 1.6)));
      const put = (X, Y, c, leaf = false) => {
        X = Math.round(X);
        Y = Math.round(Y);
        if (X < 0 || X >= W * S || Y < 0 || Y >= L * S || isRes(X / S, Y / S)) return;
        img.px(X, Y, c);
        if (leaf) markCanopy(X, Y);
        else canopy[Y * W * S + X] = 0;
      };
      const shade = (X, Y, f) => {
        X = Math.round(X);
        Y = Math.round(Y);
        if (X >= 0 && X < W * S && Y >= 0 && Y < L * S && !isRes(X / S, Y / S)) img.tintPx(X, Y, f);
      };
      // the nodes, counted up from the ground (row -> rows past the node)
      const nodes = [];
      for (let Y = CY - 3, step = 7 + br() * 3; Y > CY - H; Y -= Math.round(step)) {
        nodes.push(Y);
        const t = (CY - Y) / H;
        step = (t < 0.5 ? 9 + t * 34 : 26 - (t - 0.5) * 22) * (0.92 + br() * 0.16);
      }
      const crownFrom = CY - H * 0.36;
      const sprays = [];
      if (AGE < 3 || br() < 0.3)
        nodes.forEach((Y, i) => {
          if (Y > crownFrom) return;
          const side = i % 2 ? 1 : -1;
          const t = (crownFrom - Y) / (crownFrom - (CY - H));
          sprays.push([Y, side, Math.round((20 - t * 8) * (0.8 + br() * 0.4)), Math.floor(br() * 1e9)]);
        });
      // and the tuft at the very top
      for (const side of [-1, 1]) sprays.push([CY - H, side, 10 + Math.floor(br() * 5), Math.floor(br() * 1e9)]);
      return {
        y: cy,
        shadow: () => {
          // thrown down and to the right along the ground, as far as the gloom lets it show
          for (let z = 0; z < 66; z++) {
            const X = CX + z * 0.5;
            const Y = CY + z * 0.22;
            const f = 0.78 + (z / 66) * 0.16;
            for (let i = 0; i < Math.ceil(W0 / 2); i++) shade(X + i, Y, f);
          }
          for (let i = -6; i <= 6; i++) for (let j = -2; j <= 2; j++) if ((i / 6) ** 2 + (j / 2) ** 2 < 1) shade(CX + i, CY + j, 0.74);
        },
        draw: () => {
          // the shed sheaths and the roots round its foot
          const lr = rng(seed + 3);
          for (let k = 0; k < 5; k++) {
            const X = CX + (lr() - 0.5) * 18;
            const Y = CY + (lr() - 0.3) * 5;
            const c = lr() < 0.5 ? 0xb49a62 : 0x8a7044;
            for (let i = 0; i < 3 + lr() * 3; i++) put(X + i, Y + (i >> 1), c);
          }
          for (const side of [-1, 1])
            for (let i = 0; i < 4 + W0 / 3; i++) put(CX + side * (W0 / 2 + i), CY - 1 + (i >> 1), i < 2 ? RAMP[0] : 0x2a2418);
          for (let Y = CY; Y >= CY - H; Y--) {
            const X = stalk(Y);
            let w = widthAt(Y);
            let k = 99;
            for (const n of nodes)
              if (n <= Y) {
                k = Math.min(k, Y - n);
              }
            const flare = CY - Y < 5 ? Math.round((5 - (CY - Y)) / 2) : 0;
            const ring = k === 0 || k === 1;
            if (ring) w += 1;
            w += flare;
            const X0 = Math.round(X - w / 2);
            for (let i = 0; i < w; i++) {
              const t = w <= 1 ? 0.5 : i / (w - 1);
              let c = t < 0.12 ? RAMP[1] : t < 0.3 ? RAMP[2] : t < 0.42 ? RAMP[3] : t < 0.72 ? RAMP[1] : RAMP[0];
              const hs = hashPx(i * 3 + seed % 97, Y >> 2, 88);
              if (ring) c = k === 0 ? (t > 0.72 ? RAMP[1] : scaleColor(RAMP[3], 1.06)) : t > 0.72 ? RAMP[0] : RAMP[2];
              else if (k === 2) c = scaleColor(c, 0.55); // (the groove under the node)
              else if (k < 8 && AGE < 2 && t < 0.72) c = mix(c, 0xd8e4cc, ((8 - k) / 6) * (AGE ? 0.22 : 0.42)); // (the white bloom)
              else if (hs < 0.08) c = scaleColor(c, 0.88); // (the grain)
              if (AGE === 2 && hashPx(X0 + i, Y, seed & 255) < 0.05) c = 0x4a4630; // (dark flecks of age)
              if (AGE === 2 && hashPx(0, Y >> 4, seed & 255) < 0.3 && hashPx(X0 + i, Y >> 1, 93) < 0.3) c = mix(c, 0xc8ccae, 0.6); // (lichen)
              if (CY - Y < 12 && t > 0.1 && hashPx(i, Y, 91) < 0.25) c = scaleColor(c, 0.82); // (soil splashed at its foot)
              put(X0 + i, Y, c);
            }
            if (ring && w >= 5) put(X0 + w, Y, 0x24301c);
          }
          for (const [Y0, side, len, sd] of sprays) groveSpray(put, shade, stalk(Y0), Y0, side, len, LEAF, rng(sd));
        },
      };
    }
    // the crown worked out in fine pixels (leaf clusters a third the size), a darker rim, its shadow on the
    // ground; cherries get petals on the ground round them and blossom catching the light
    const px = () => crownPixels(kind, cx * S + 1, cy * S + 1, r * S, rng(seed), seed & 1023);
    const off = Math.round((2 + r * 0.25) * S);
    const pr = rng(seed + 1);
    if (kind === 'sakura') sakuraCrowns.push([cx, cy, r]);
    return {
      y: cy + r * 0.6,
      shadow: () => {
        for (const p of px()) img.tintPx(p.x + off, p.y + off + S, 0.5);
        if (kind === 'sakura')
          for (let i = 0; i < r * 10; i++) {
            const a = pr() * Math.PI * 2;
            const d = r * S * (0.85 + pr() * 0.7);
            const X = Math.round(cx * S + Math.cos(a) * d);
            const Y = Math.round(cy * S + Math.sin(a) * d);
            if (img.alphaPx(X, Y)) img.px(X, Y, pr() < 0.5 ? 0xe8a8bc : pr() < 0.6 ? 0xc87a96 : 0xf4d0dc);
          }
      },
      draw: () => {
        const list = px();
        const inCrown = new Set(list.map((p) => p.x * 65536 + p.y));
        const blossom = kind === 'sakura' ? 1 : 0;
        for (const p of list) {
          const rim = !inCrown.has(p.x * 65536 + p.y + 1) || !inCrown.has((p.x + 1) * 65536 + p.y);
          img.px(p.x, p.y, rim ? scaleColor(p.c, 0.78) : p.c);
          if (p.x >= 0 && p.x < W * S && p.y >= 0 && p.y < L * S) {
            bloom[p.y * W * S + p.x] = blossom;
            crownMask[p.y * W * S + p.x] = 1 + (seed % 15);
          }
        }
        if (kind === 'sakura')
          for (const p of list) if (((p.x * 7 + p.y * 13 + seed) & 31) === 0) img.px(p.x, p.y, (p.x + p.y) & 1 ? 0xffe8f0 : 0xfff6fa);
        for (const p of list) {
          if (p.x < 0 || p.x >= W * S || p.y < 0 || p.y >= L * S) continue;
          const q = img.rgbaPx(p.x, p.y);
          if (q) crownHash[p.y * W * S + p.x] = (q[0] ^ (q[1] << 1) ^ (q[2] << 2)) & 255;
        }
      },
    };
  }
  for (let gy = 0; gy < L; gy += 6)
    for (let gx = -3; gx < W + 3; gx += 6) {
      const x = gx + rand() * 6;
      const y = gy + rand() * 6;
      const u = L - y;
      const ix = Math.round(x);
      const iy = Math.round(y);
      if (ix < 0 || ix >= W) continue;
      if (!img.alpha(ix, iy)) continue;
      const kinds = sectionKinds(u);
      const roll = rand();
      const kind = kinds.find(([, p]) => roll < p)[0];
      const [r0, r1] = RADIUS[kind];
      const r = r0 + rand() * (r1 - r0);
      const k = r * 0.55;
      if (isRes(ix, iy) || isRes(ix - k, iy) || isRes(ix + k, iy) || isRes(ix, iy - k) || isRes(ix, iy + k)) continue;
      // the built-up parts get only the trees placed on purpose (gardens, willows, groves)
      if (u < SANDO[1] && !(u >= SANDO[0] && (ix < 18 || ix > 162))) continue;
      if (u >= 5000 && u < 5560) continue;
      if (rand() < (kind === 'bamboo' ? 0.02 : 0.12)) continue; // occasional gap in the canopy
      if (kind === 'bamboo' && gy % 36 !== 0) { rand(); continue; } // preserve the seed stream outside the grove
      if (kind === 'bamboo' && groveOpen(x, y)) { rand(); continue; }
      if (kind === 'cedar' && L - y > ARASHI[0] + 20 && L - y < 3260) { rand(); continue; }
      objects.push(treeObj(kind, x, y, r));
    }

  // ------------------------------------------------------------ compose
  for (const o of objects) o.shadow?.();
  objects.sort((a, b) => a.y - b.y);
  for (const o of objects) {
    o.draw();
    o.afterDraw?.();
  }
  // a crown something else was drawn over no longer sways there
  {
    const D = img.hi.data;
    for (let k = 0; k < crownMask.length; k++) {
      if (!crownMask[k]) continue;
      const i = k * 4;
      if (((D[i] ^ (D[i + 1] << 1) ^ (D[i + 2] << 2)) & 255) !== crownHash[k] || !D[i + 3]) crownMask[k] = 0;
    }
  }

  // the bamboo grove: sprays leaning out over the fence and the path, so the walk runs under a green eave; then
  // the light on the leaves gathered into pools and the gloom between them, so the grove is not one even carpet
  {
    const fr = rng(1251);
    const LEAF = [0x28522c, 0x467a38, 0x5e8f42, 0x7aa64c, 0x9cbb62];
    const put = (X, Yy, c, leaf = false) => {
      X = Math.round(X);
      Yy = Math.round(Yy);
      if (X < 0 || X >= W * S || Yy < 0 || Yy >= L * S) return;
      img.px(X, Yy, c);
      if (leaf) markCanopy(X, Yy);
    };
    const shade = (X, Yy, f) => {
      X = Math.round(X);
      Yy = Math.round(Yy);
      if (X >= 0 && X < W * S && Yy >= 0 && Yy < L * S) img.tintPx(X, Yy, f);
    };
    for (let u = 2720; u < 3250; u += 3 + fr() * 4)
      for (const side of [-1, 1]) {
        if (fr() < 0.3) continue;
        // (only where the fence backs onto the grove, not by the gardens)
        if (side < 0 && u > 3160) continue;
        if (side > 0 && u > 2905 && u < 2925) continue;
        const X = (groveX(u) + side * (10 + fr() * 2)) * S;
        groveSpray(put, shade, X, Y(u) * S, -side, 12 + Math.floor(fr() * 16), LEAF, rng(Math.floor(fr() * 1e9)));
      }
    const D = img.hi.data;
    const row = W * S * 4;
    for (let Yy = Y(3262) * S; Yy < Y(2704) * S; Yy++)
      for (let X = 0; X < W * S; X++) {
        const leaf = canopyAt(X, Yy);
        if (!leaf && isRes(X / S, Yy / S)) continue;
        const i = Yy * row + X * 4;
        if (!D[i + 3]) continue;
        const v = fbm((X >> 2) / S, (Yy >> 2) / S, { seed: 1253, scale: 26, octaves: 3 });
        const gust = hashPx(X >> 1, Yy >> 1, 1255) * 0.08;
        let f = 0.62 + Math.max(0, Math.min(1, (v - 0.32) / 0.36)) * 0.62 + gust;
        if (!leaf) {
          // (the sun reaches the floor of the glades)
          const u = L - Yy / S;
          for (const [gx, rx, u1] of GLADES) {
            const e = ((X / S - gx) / (rx + 3)) ** 2 + ((u - (u1 - 22)) / 28) ** 2;
            if (e < 1) f = Math.max(f, 0.78 + (1 - e) * 0.42);
          }
        }
        const warm = v > 0.6 ? (v - 0.6) * 30 : 0;
        D[i] = Math.min(255, D[i] * f + warm);
        D[i + 1] = Math.min(255, D[i + 1] * f + warm * 0.7);
        D[i + 2] = Math.min(255, D[i + 2] * (f - (v < 0.42 ? -0.06 : 0)));
      }
  }

  {
    const D = img.hi.data;
    const row = W * S * 4;
    for (let Y = 0; Y < L * S; Y++) {
      const d = dusk(L - Y / S);
      if (!d) continue;
      for (let i = Y * row; i < (Y + 1) * row; i += 4) if (D[i + 3]) for (let k = 0; k < 3; k++) D[i + k] = d(D[i + k], k);
    }
  }
  grade(img.hi, GRADE);
  for (const [x, y, c, a] of lights) img.light(x, y, c, a);
  for (const [X, Yy, c, a] of lightsFine) img.px(X, Yy, c, a);

  // wind in the crowns (live): nothing here moves against the ground. A gust is a band of leaves turning their pale
  // undersides, which runs across the woods in one direction; where it passes leaves and petals are torn loose
  {
    const wr = rng(8901);
    const R = 27;
    const speck = (lit, dark, seed, u) => {
      const out = new HiCanvas(18, 18);
      const r = rng(seed);
      for (let n = 0; n < 150; n++) {
        const a = r() * Math.PI * 2;
        const d = Math.sqrt(r()) * R;
        const CX = Math.round(27 + Math.cos(a) * d);
        const CY = Math.round(27 + Math.sin(a) * d);
        const fall = Math.min(1, ((R - d) / R) * 2.2);
        const pale = r() < 0.72;
        const size = 1 + Math.floor(r() * 2);
        for (let j = -size; j <= size; j++)
          for (let i = -size - 1; i <= size + 1; i++) {
            if ((i / (size + 1.2)) ** 2 + (j / (size + 0.2)) ** 2 > 1) continue;
            out.px(CX + i, CY + j, pale ? (j < 0 ? lit[1] : lit[0]) : dark, (pale ? 0.62 : 0.4) * fall);
          }
      }
      return kit.frame(gradeAt(out, u));
    };
    const zones = [[4000, [0xb4d48c, 0xd4eca8], 0x1e4424, [0xffdce8, 0xfff0f6], 0xa86a84], [6400, [0x7e9a6a, 0x9ab484], 0x18241c, [0xc8a8b8, 0xe0c4d0], 0x4a3440]];
    const frames = zones.map(([u, gl, gd, pl, pd], z) => ({
      green: [0, 1, 2].map((k) => speck(gl, gd, 8910 + z * 10 + k, u)),
      pink: [0, 1, 2].map((k) => speck(pl, pd, 8950 + z * 10 + k, u)),
    }));
    const STEP = 15;
    for (let c0 = 0; c0 < L; c0 += 128) {
      const parts = [[], []];
      const sets = [[...frames[0].green, ...frames[0].pink], [...frames[1].green, ...frames[1].pink]];
      for (let y0 = L - c0 - 128; y0 < L - c0; y0 += STEP)
        for (let x0 = -6; x0 < W; x0 += STEP) {
          const u = L - y0;
          if (u < 16 || (u > 2700 && u < 3262)) continue;
          let inCrown = 0;
          let pink = 0;
          let all = 0;
          for (let j = -21; j <= 21; j += 7)
            for (let i = -21; i <= 21; i += 7) {
              if (i * i + j * j > 441) continue;
              const X = (x0 + 9) * S + i;
              const Yy = (y0 + 9) * S + j;
              if (X < 0 || X >= W * S || Yy < 0 || Yy >= L * S) continue;
              all++;
              const k = Yy * W * S + X;
              if (crownMask[k]) {
                inCrown++;
                if (bloom[k]) pink++;
              }
            }
          if (!all || inCrown / all < 0.8) continue;
          const z = u > 6000 ? 1 : 0;
          const v = Math.floor(wr() * 3) + (pink / inCrown > 0.5 ? 3 : 0);
          const ph = -(x0 * 0.05 + u * 0.02) + fbm(x0, u, { seed: 8990, scale: 50 }) * 2.4;
          parts[z].push([v, x0, u, ph]);
        }
      for (const z of [0, 1]) if (parts[z].length) kit.wave(sets[z], parts[z], { w: 0.9, a0: 0, a1: z ? 0.42 : 0.62, pw: 3 });
    }
    // leaves and petals torn off in the gusts, carried away on the same wind
    const flight = (cols, seed, u) =>
      [0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
        const out = new HiCanvas(26, 12);
        const r = rng(seed);
        for (let n = 0; n < 4; n++) {
          const x0 = r() * 14;
          const y0 = 4 + r() * 16;
          const c = cols[n % cols.length];
          const ph = r() * 6;
          const X = Math.round(x0 + k * 7.5);
          const Yy = Math.round(y0 + k * 1.1 + Math.sin(k * 0.9 + ph) * 3);
          const flat = (k + n) % 2;
          for (const [i, j] of flat ? [[0, 0], [1, 0], [2, 0]] : [[0, 0], [1, 1], [0, 1]]) out.px(X + i, Yy + j, c, k > 5 ? 0.5 : 1);
        }
        return kit.frame(gradeAt(out, u));
      });
    const zonesF = [[3262, 3500, [0xf8c8d8, 0xfff0f4, 0xe8a0b8], 4000], [3500, 5000, [0xf8c8d8, 0x7aa84a, 0xfff0f4, 0x9ac05a], 4000], [5560, 6300, [0xf8c8d8, 0xfff0f4, 0xe8a0b8], 5000], [6300, 6880, [0xc8a8b8, 0x7e9a6a], 6400]];
    zonesF.forEach(([u0, u1, cols, gu], z) => {
      const fl = flight(cols, 8970 + z, gu);
      for (let u = u0; u < u1; u += 240) kit.spot([[0, Math.min(u + 240, u1), 150, Math.min(240, u1 - u)]], fl, { rate: 0.7, fps: 8, a: 0.9 });
    });
  }

  // gusts of wind through the bamboo grove (live): the leaves turn their paler undersides, a patch at a
  // time, in waves running across the grove
  for (let y0 = Y(3262); y0 < Y(2700); y0 += 16)
    for (let x0 = 0; x0 < W; x0 += 16) {
      let n = 0;
      const tile = new HiCanvas(16, 16, S, x0, y0);
      for (let Y = y0 * S; Y < (y0 + 16) * S; Y++)
        for (let X = x0 * S; X < Math.min(W, x0 + 16) * S; X++) {
          const q = img.rgbaPx(X, Y);
          if (!canopyAt(X, Y) || !q || !q[3]) continue;
          // (not every leaf turns; the patch fades out from its middle, so no square shows)
          if (hashPx(X >> 2, Y >> 1, 1261) < 0.35) continue;
          const r = Math.hypot(X - (x0 + 8) * S, Y - (y0 + 8) * S) / (8 * S);
          const e = Math.max(0, Math.min(1, (1.08 - r) * 1.8));
          if (e <= 0) continue;
          tile.setRGBAPx(X, Y, Math.min(255, q[0] * 1.14), Math.min(255, q[1] * 1.24), Math.min(255, q[2] * 0.98), Math.round(255 * e));
          n++;
        }
      if (n < 12 * S * S) continue;
      const u = U(y0);
      const ph = -(x0 * 0.05 + u * 0.012) + fbm(x0, u, { seed: 77, scale: 40 }) * 2.5;
      kit.wave([kit.frame(tile)], [[0, x0, u, ph]], { w: 1.1, a0: 0, a1: 0.3, pw: 3 });
    }
  // the Golden Pavilion's reflection ripples: rows of the pond nudged sideways, three ways in turn (live)
  if (ripple) {
    const islands = [[40, 3770, 9], [84, 3730, 6], [30, 3830, 5], [92, 3820, 4], [58, 3716, 4]];
    const frames = [0, 1, 2].map((f) => {
      const out = new HiCanvas(ripple.x1 - ripple.x0 + 1, ripple.y1 - ripple.y0 + 1, S, ripple.x0, ripple.y0);
      for (let FYr = ripple.y0 * S; FYr < (ripple.y1 + 1) * S; FYr++) {
        const y = FYr / S;
        const ox = Math.round(Math.sin((y - ripple.y0) * 0.9 + f * 2.1) * 2); // (fine pixels)
        if (!ox) continue;
        for (let FXr = ripple.x0 * S; FXr < (ripple.x1 + 1) * S; FXr++) {
          const x = FXr / S;
          if (((x - 60) / 52) ** 2 + ((y - Y(3790)) / 96) ** 2 > 0.85 || !isRes(x, y) || !isRes(x + ox / S, y)) continue;
          if (islands.some(([ix, iu, ir]) => Math.hypot(x - ix, y - Y(iu)) < ir + 7)) continue;
          const q = img.rgbaPx(FXr + ox, FYr);
          if (q && q[3]) out.setRGBAPx(FXr, FYr, q[0], q[1], q[2], 255);
        }
      }
      return kit.frame(out);
    });
    kit.loop(ripple.x0, U(ripple.y0), frames, { fps: 2.5, fx: 1 });
  }

  // ------------------------------------------------------------ living light and air: reflections, glints, wind,
  // flickering lanterns, the lights of dusk, birds, ducks, cyclists, kitchen smoke
  {
    const fr = rng(7101);
    // the north banks mirrored in the rivers below them (trees, walls, lanterns), broken up by the current
    const mirror = (uEdge, u0, x0, x1, skip = () => false) => {
      const YE = FY(uEdge);
      const Y1 = FY(u0);
      for (let FYr = YE + 1; FYr < Y1; FYr++) {
        const k = FYr - YE;
        const ox = Math.round(Math.sin(k * 0.55) * 2 + Math.sin(k * 0.13) * 1.5);
        const fade = 0.32 * (1 - k / (Y1 - YE)) ** 1.3;
        for (let FXr = x0 * S; FXr < x1 * S; FXr++) {
          if (skip(FXr / S) || (k + (FXr >> 1)) % 6 === 0) continue;
          const q = img.rgbaPx(FXr + ox, YE - k);
          if (q && q[3]) img.px(FXr, FYr, (q[0] << 16) | (q[1] << 8) | q[2], fade);
        }
      }
    };
    mirror(629, 598, 0, W, (x) => (x > 76 && x < 104) || (x > 22 && x < 38));
    mirror(3440, 3404, 0, W, (x) => x > 79 && x < 101);
    mirror(183, 176, 0, W, (x) => x > 78 && x < 102);

    // sunlight glinting off the water: little stars that open and close (live)
    const glint = [1, 2, 3, 4, 3, 2, 1].map((s) => {
      const out = new HiCanvas(3, 3);
      out.px(4, 4, 0xffffff);
      for (let k = 1; k < s; k++)
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) out.px(4 + dx * k, 4 + dy * k, k === 1 ? 0xf4fbff : 0xd8eefa, 1 - k * 0.25);
      if (s > 2) for (const [dx, dy] of [[1, 1], [-1, -1], [1, -1], [-1, 1]]) out.px(4 + dx, 4 + dy, 0xe8f6ff, 0.5);
      return kit.frame(out);
    });
    for (const [rects, rate] of [
      [[[0, 624, 76, 64], [104, 624, 76, 64]], 3],
      [[[0, 3432, 80, 94], [100, 3432, 80, 94]], 3],
      [[[0, 182, 78, 8], [102, 182, 78, 8]], 1],
      [[[22, 3860, 76, 130]], 1.4],
      [[[62, 4522, 36, 64]], 0.7],
      [[[16, 3212, 44, 26]], 0.6],
    ])
      kit.spot(rects, glint, { rate, fps: 10, a: 0.9 });
    // the koi rising in Kyōko-chi: rings spreading where one nosed the surface (live)
    const rings = [1, 2, 3, 4, 5].map((r) => {
      const out = new HiCanvas(10, 5);
      for (let a = 0; a < Math.PI * 2; a += 0.04) out.px(Math.round(15 + Math.cos(a) * r * 2.6), Math.round(7.5 + Math.sin(a) * r * 1.2), 0xc8e8e0, 0.9 - r * 0.15);
      return kit.frame(gradeAt(out, 3790));
    });
    kit.spot([[30, 3850, 60, 110]], rings, { rate: 0.6, fps: 5, a: 0.8 });
    // and the gold leaf of the pavilion catching the sun
    kit.spot([[38, 3918, 44, 26]], glint, { rate: 1.6, fps: 10, a: 1 });

    // the wind through the cherries: gusts running over the crowns, the blossom turning paler where it
    // passes (live), and petals let go, drifting down to the ground below the trees (live)
    {
      const tiles = [];
      for (let y0 = 0; y0 < L; y0 += 16)
        for (let x0 = 0; x0 < W; x0 += 16) {
          const tile = new HiCanvas(16, 16, S, x0, y0);
          let n = 0;
          for (let FYr = y0 * S; FYr < (y0 + 16) * S; FYr++)
            for (let FXr = x0 * S; FXr < (x0 + 16) * S; FXr++) {
              if (!bloom[FYr * W * S + FXr]) continue;
              const q = img.rgbaPx(FXr, FYr);
              if (!q || !q[3] || q[0] < q[1] + 14) continue; // (still blossom, nothing drawn over it)
              const e = Math.min(FXr - x0 * S, (x0 + 16) * S - 1 - FXr, FYr - y0 * S, (y0 + 16) * S - 1 - FYr); // (feathered, so no tile shows its edge)
              tile.setRGBAPx(FXr, FYr, Math.min(255, q[0] * 1.1 + 18), Math.min(255, q[1] * 1.12 + 16), Math.min(255, q[2] * 1.1 + 18), Math.round(255 * Math.min(1, (e + 1) / 12)));
              n++;
            }
          if (n >= 160) tiles.push([n, tile, x0, y0]);
        }
      tiles.sort((a, b) => b[0] - a[0]);
      for (const [, tile, x0, y0] of tiles.slice(0, 360)) {
        const u = U(y0);
        const ph = -(x0 * 0.06 - u * 0.01) + fbm(x0, u, { seed: 78, scale: 40 }) * 2.5;
        kit.wave([kit.frame(tile)], [[0, x0, u, ph]], { w: 0.9, a0: 0, a1: 0.42, pw: 5 });
      }
      const petal = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((t) => {
        const out = new HiCanvas(5, 9);
        const X = 7 + Math.round(Math.sin(t * 0.9) * 3);
        const Yy = 2 + t * 2.6;
        const a = t < 7 ? 1 : 0.5;
        out.px(X, Math.round(Yy), t % 2 ? 0xffe0ea : 0xf4b8c8, a);
        out.px(X + (t % 3 === 0 ? 1 : 0), Math.round(Yy) + (t % 3 === 0 ? 0 : 1), 0xf8c8d6, a * 0.8);
        return kit.frame(gradeAt(out, 3000));
      });
      const buckets = new Map();
      for (const [cx, cy, r] of sakuraCrowns) {
        const k = Math.floor(U(cy) / 256);
        if (!buckets.has(k)) buckets.set(k, []);
        buckets.get(k).push([cx - r, U(cy) + r * 0.4, r * 2, r * 1.2]);
      }
      for (const rects of buckets.values()) kit.spot(rects, petal, { rate: Math.min(4, 0.18 * rects.length), fps: 6, a: 0.9 });
    }

    // the lanterns flicker: a warm halo round each, breathing at its own pace (live); by dusk, pools of their
    // light on the ground round them
    {
      const halo = (c) => {
        const out = new HiCanvas(5, 5);
        for (let j = 0; j < 15; j++)
          for (let i = 0; i < 15; i++) {
            const d = Math.hypot(i - 7, j - 7) / 7.5;
            if (d < 1) out.px(i, j, c, (1 - d) ** 2 * 0.75);
          }
        return kit.frame(out);
      };
      const halos = [halo(0xffc878), halo(0xff7a50)];
      const groups = new Map();
      lamps.forEach(([x, y, c], i) => {
        const u = U(y);
        const red = (c >> 16) > 0xd0 && ((c >> 8) & 0xff) < 0x90;
        const k = `${Math.floor(u / 256)}:${i % 2}`;
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push([red ? 1 : 0, x - 2.5, u + 2.5, fr() * 6.28]);
      });
      let g = 0;
      for (const parts of groups.values()) kit.wave(halos, parts, { w: g++ % 2 ? 9 : 6, a0: 0.12, a1: 0.5, pw: 1.5 });
      // (the pools at dusk, painted)
      for (const [x, y, c] of lamps) {
        const n = smooth(5950, 6500, U(y));
        if (n < 0.05) continue;
        const [cr, cg, cb] = rgb(c);
        const CX = x * S + 1;
        const CY = y * S + 2;
        const R = 22;
        for (let FYr = CY - R; FYr <= CY + R; FYr++)
          for (let FXr = CX - R; FXr <= CX + R; FXr++) {
            const d = Math.hypot(FXr - CX, (FYr - CY) * 1.3) / R;
            const q = d < 1 && img.rgbaPx(FXr, FYr);
            if (!q || !q[3]) continue;
            const f = (1 - d) ** 1.8 * 0.4 * n;
            img.setRGBAPx(FXr, FYr, Math.min(255, q[0] + cr * f), Math.min(255, q[1] + cg * f), Math.min(255, q[2] + cb * f), q[3]);
          }
      }
    }

    // sparrows hopping about the streets and the courtyards, pecking (live)
    const sparrow = (f, u) => {
      const out = new HiCanvas(2, 2);
      for (const [i, j, c] of [[1, 2, 0x8a6a4a], [2, 2, 0x7a5a3a], [3, 2, 0x6a4a30], [1, 3, 0xc8b8a0], [2, 3, 0x8a6a4a], [3, 3, 0x5a3a24], [0, 3, 0x4a3020]]) out.px(i, j - f, c);
      out.px(4, 2 - f, 0x5a3a2a);
      out.px(4, 1 - f, 0x2a1e18);
      out.px(5, 2 - f + (f ? 1 : 0), 0x3a3030);
      out.px(2, 5, 0x101418, 0.35);
      return kit.frame(gradeAt(out, u));
    };
    for (const [x, u, rx, ry, n] of [[90, 260, 7, 220, 7], [90, 880, 14, 200, 5], [50, 1640, 24, 60, 4], [90, 4996, 80, 3, 5], [100, 3600, 30, 20, 3]])
      kit.wander(x, u, rx, ry, [sparrow(0, u), sparrow(1, u)], { n, sp: 6, idle: 0.75, turn: 'flip', fps: 5 });
    // crows crossing high over the city, wings beating (live)
    const crow = (f) => {
      const out = new HiCanvas(7, 4);
      for (let i = 6; i < 15; i++) out.px(i, 5, 0x141216);
      for (let i = 14; i < 17; i++) out.px(i, 4, 0x141216);
      out.px(17, 4, 0x3a3436);
      for (let i = 3; i < 7; i++) out.px(i, 5 + (i % 2), 0x1a1618);
      for (let k = 0; k < 7; k++)
        for (const s of [-1, 1]) {
          const j = 5 + s * (k + 1) * (f ? 0.9 : 0.35);
          out.px(9 + Math.round(k * 0.3), Math.round(j), k > 4 ? 0x2a2628 : 0x1a1618);
          out.px(10 + Math.round(k * 0.3), Math.round(j), 0x141216);
        }
      return kit.frame(out);
    };
    for (const [u, s0] of [[900, 0.1], [2520, 0.6], [4300, 0.3], [6050, 0.8], [1800, 0.45]])
      kit.path([[-14, u], [194, u - 30]], [crow(0), crow(1), crow(0)], { sp: 16, mode: 'wrap', turn: 'rot', fps: 5, d: 3, s0, a: 0.9 });
    // ducks paddling on the Kamo and the Katsura, a ripple trailing them (live)
    const duck = (f) => {
      const out = new HiCanvas(4, 3);
      for (let i = 2; i < 10; i++) for (let j = 3; j < 7; j++) if (((i - 6) / 4) ** 2 + ((j - 5) / 2) ** 2 < 1) out.px(i, j, i < 5 ? 0x5a4a3a : j < 5 ? 0x9a8a78 : 0x7a6a58);
      out.px(9, 3, 0x2a6a3a);
      out.px(10, 3, 0x2a6a3a);
      out.px(10, 2, 0x2a6a3a);
      out.px(11, 3, 0xe8b830);
      out.px(9, 4, 0xf4f0e6);
      out.px(1, f ? 4 : 5, 0xd8e8e8, 0.6);
      out.px(0, f ? 5 : 4, 0xd8e8e8, 0.4);
      return kit.frame(gradeAt(out, 600));
    };
    kit.wander(46, 594, 26, 14, [duck(0), duck(1)], { n: 3, sp: 3, idle: 0.3, turn: 'flip', fps: 2 });
    kit.wander(140, 3388, 30, 22, [duck(0), duck(1)], { n: 3, sp: 3, idle: 0.3, turn: 'flip', fps: 2 });
    // cyclists along Gojō-zaka at the foot of the hill, both ways (live)
    const cyclist = (c, f) => {
      const out = new HiCanvas(5, 3);
      for (let i = 1; i < 14; i++) out.px(i, 5, i === 1 || i === 13 ? 0x1a1a20 : 0x3a3a42);
      out.px(2, 4, 0x1a1a20);
      out.px(12, 4, 0x1a1a20);
      for (let i = 5; i < 9; i++) out.px(i, 4, 0x8a8a90);
      for (let j = 1; j < 4; j++) for (let i = 6; i < 9; i++) out.px(i, j, i === 8 ? scaleColor(c, 0.8) : c);
      out.px(7, 0, 0x2a2024);
      out.px(8, 0, 0x2a2024);
      out.px(f ? 6 : 8, 5, 0x2a2a34);
      out.px(11, 3, 0x8a8a90);
      out.px(3, 7, 0x101418, 0.3);
      for (let i = 4; i < 11; i++) out.px(i, 7, 0x101418, 0.3);
      return kit.frame(gradeAt(out, 4996));
    };
    kit.path([[-10, 4998], [190, 4998]], [cyclist(0x3a6ad0, 0), cyclist(0x3a6ad0, 1)], { sp: 14, n: 2, gap: 120, mode: 'wrap', turn: 'flip', fps: 4, s0: 0.2 });
    kit.path([[190, 4994], [-10, 4994]], [cyclist(0xe8e8f0, 0), cyclist(0xe8e8f0, 1)], { sp: 12, n: 2, gap: 130, mode: 'wrap', turn: 'flip', fps: 4, s0: 0.7 });
    // thin smoke from the townhouses' kitchens, a chimney here and there (live)
    const wisp = [1, 2, 3].map((r) => [0, 1].map((v) => kit.frame(puff(r * S, r * 23 + v + 11, [0x7a7a84, 0x9a9aa4, 0xbabac2, 0xd8d8de]))));
    kitchens.forEach(([x, y, w], i) => {
      const u = U(y);
      if (i % 7 !== 3 || !(u < 540 || (u > 5000 && u < 5400) || (u > 650 && u < 1130))) return;
      kit.emit(x + w * 0.7, u - 2, wisp, { rate: 0.4, life: [2, 3], vy: 4, sx: 0.6, wf: 1, a: 0.28, tint: 1 });
    });
  }

  // the shadows of the clouds drifting over the city, at the fine resolution: soft-edged instead of dithered
  // (the game takes these in place of its shared ones when the stage has them)
  for (const [i, w, h, lobes, seed] of [
    [0, 96, 56, [[30, 30, 26, 20], [56, 24, 30, 20], [74, 34, 20, 16]], 41],
    [1, 80, 44, [[26, 22, 22, 16], [52, 20, 24, 17]], 57],
  ]) {
    const out = new HiCanvas(w, h);
    for (let FYr = 0; FYr < h * S; FYr++)
      for (let FXr = 0; FXr < w * S; FXr++) {
        const x = FXr / S;
        const y = FYr / S;
        let v = 0;
        for (const [cx, cy, rx, ry] of lobes) v = Math.max(v, 1 - Math.hypot((x - cx) / rx, (y - cy) / ry));
        v += (fbm(x, y, { seed, scale: 14, octaves: 4 }) - 0.5) * 0.35;
        const a = Math.max(0, Math.min(1, (v - 0.02) / 0.22));
        if (a > 0) out.px(FXr, FYr, 0x000000, a);
      }
    kit.frame(out, `cshadow_${i}`);
  }

  {
    const D = img.hi.data;
    for (let k = 0; k < crownMask.length; k++) {
      let v = crownMask[k];
      if (!v && canopy[k]) {
        const X = k % (W * S);
        const Yy = Math.floor(k / (W * S));
        v = 1 + Math.floor(hashPx(X >> 5, Yy >> 5, 9001) * 15);
      }
      if (v && D[k * 4 + 3] === 255) D[k * 4 + 3] = 239 + v;
    }
  }
  const chunks = [];
  for (let i = 0; i < CHUNKS; i++) chunks.push(img.crop(0, i * CHUNK, W, CHUNK));
  return {
    strip: img.hi,
    chunks,
    props: kit.pack(),
    meta: { width: W, artScale: S, chunkHeight: CHUNK, chunks: CHUNKS, length: L, sway: true, tint: tintTable(L, (u) => [0, 1, 2].map((k) => Math.round(gradeAt(whitePx(), u).data[k]))) },
  };
}

// the middle layer is muted so bullets pop
const GRADE = { sat: 0.78, bright: 0.84, tint: 0x182030, tintAmt: 0.06 };

/** Dusk over the last stretch: warmer, then dark blue, so the Daimonji fires burn bright. (v, channel) -> v */
function dusk(u) {
  const a = smooth(5800, 6500, u);
  if (a <= 0) return null;
  const warm = 1 - smooth(6300, 6700, u);
  const tint = rgb(warm > 0.5 ? 0x8a3a3a : 0x1a1a3a);
  const m = [1 - (0.12 + 0.3 * (1 - warm)) * a, 1 - (0.28 + 0.2 * (1 - warm)) * a, 1 - (0.36 + 0.05 * (1 - warm)) * a];
  return (v, k) => v * m[k] + (tint[k] - v * m[k]) * 0.18 * a;
}

/** Grade a frame the way the strip is graded at u. */
function gradeAt(r, u) {
  const R = r.hi ?? r;
  const d = dusk(u);
  if (d) R.map((r0, g0, b0, a0) => (a0 ? [d(r0, 0), d(g0, 1), d(b0, 2), a0] : null));
  grade(R, GRADE);
  return r;
}

function whitePx() {
  const r = new Raster(1, 1);
  r.set(0, 0, 0xffffff);
  return r;
}
