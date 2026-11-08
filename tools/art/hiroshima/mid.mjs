// Middle layer (Hiroshima & Sacred Miyajima), seen from above in 3/4 pixel-art view, the stage flying west
// along the Hiroden Miyajima line from the castle to the sacred island:
//   1. u = 0..712     — Hiroshima Castle (Rijō, the Carp Castle): the wide lotus moat with koi, ducks and a heron;
//                       the Ninomaru with the Omote-gomon gate, Hira-yagura, Tamon-yagura and two-storey Taiko-yagura
//                       on their ishigaki; the Honmaru with the Gokoku Shrine, the Imperial HQ ruins, the surviving
//                       eucalyptus, and the five-storey keep (black shitami-itabari boards under white plaster,
//                       chidori and kara gables, a balustraded top floor) on its tall stone base.
//   2. u = 712..1240  — Shukkeien: Takuei Pond with its pine islets and the arched stone Kokokyō bridge, the thatched
//                       Seifūkan tea house, Meigetsu-tei on its hill, a waterfall, the little rice paddy and tea rows.
//   3. u = 1240..1990 — the A-Bomb Dome (the ruined Industrial Promotion Hall, Jan Letzel 1915) on the Motoyasu bank by
//                       the Genbaku Dōmu-mae tram stop and Orizuru Tower; Tōrō-nagashi lanterns on the river; Peace
//                       Memorial Park on Kenzō Tange's axis: Peace Bell, Children's Peace Monument with the crane booths,
//                       the Memorial Mound, the Flame of Peace, the Pond of Peace, the saddle-arched Cenotaph, the
//                       Fountain of Prayer and the Museum on its pilotis, then the green Heiwa Ōdōri. A quiet stretch.
//   4. u = 1990..2870 — Okonomimura and the Hondōri arcade, the Honkawa, Mazda Stadium full of red Carp fans,
//                       downtown blocks, Hiroden Miyajimaguchi terminus and the ferry terminal.
//   5. u = 2870..4520 — Hiroshima Bay: bamboo oyster rafts with their work boats, pine islets, JR and Matsudai
//                       ferries, the Aqua Net boat from the Peace Park, fishing boats, gulls.
//   6. u = 4520..5900 — Miyajima: the ferry pier, Omotesandō with the giant o-shamoji and momiji-manju steam, deer
//                       everywhere, the Great Torii (six pillars, black kasagi) in the tide with boats passing under it,
//                       Itsukushima Shrine on its stilts (cypress-bark roofs, kairō corridors with hanging lanterns,
//                       Hitasaki, Hirabutai and Takabutai, the floating Noh stage, Sorihashi), the Gojūnotō and
//                       the great unpainted Senjōkaku on the hill.
//   7. u = 5900..7168 — Daishō-in (Niōmon, the stairway of prayer wheels, rakan in knitted caps, Henjōkutsu),
//                       Momijidani's stream and vermilion bridge in the maples, the ropeway, and the granite summit of
//                       Misen: Kuguri-iwa, Sankidō, Reikadō with its 1,200-year flame and kettle, the observatory.
// Live: Hiroden trams (Green Mover, the A-bombed 650s), cars and buses keeping left, koi and ducks in the moat,
// visitors and school groups in yellow caps, doves over the Peace Park, the Flame flickering, the fountain playing,
// lanterns and river boats, the stadium wave, boats and ferries with wakes, deer, rickshaws, the prayer wheels
// glinting, incense and steam, the stream, gondolas and kites over Misen.
//
// Coordinates: u = distance from the bottom of the strip (stage start), strip y = L - u.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fbm, rng, bayer, scaleColor, rgb, mix } from '../../lib/raster.mjs';
import { RAMPS, crownPixels, rampColor } from '../nature.mjs';
import { HiCanvas, hashPx } from '../hires.mjs';
import { PropKit, puff, todGrade, tintTable, planTraffic } from '../props.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export const W = 180;
const S = 3; // fine pixels per logical one
export const CHUNK = 896;
export const CHUNKS = 8;
export const L = CHUNK * CHUNKS; // 7168

// the layout along the strip
const CASTLE = [152, 708];
const STREET_720 = 720; // Aioi-dōri: the trams come in from the east here and turn west along the boulevard
const GARDEN = [732, 1228];
const DOME = [1246, 1428];
const MOTOYASU = [1430, 1520];
const PARK = [1520, 1964];
const HEIWA = 1980; // Heiwa Ōdōri, the hundred-metre road
const HONKAWA = [2200, 2290];
const STADIUM = [2300, 2448];
const QUAY_U = 2870;
const MIYAJIMA_U = 4520;
const COVE_END_U = 5330;
const STREAM = [6175, 6230];
const AXIS = 92; // the Peace Park axis: Museum, Cenotaph, Flame and the Dome in one line

const C = {
  grass: [0x3d6b34, 0x4d7e3e, 0x60904a, 0x76a25a],
  lawn: [0x48743a, 0x588646, 0x6a9852, 0x80aa60],
  moss: [0x355c32, 0x46703c, 0x588448, 0x6e9856],
  sand: [0xa89c7e, 0xbcb090, 0xcfc2a2, 0xe0d4b6],
  wetSand: [0x6e7c74, 0x829086, 0x96a298],
  gravel: [0xa69c88, 0xb8ae98, 0xc8bea8, 0xd8ceb8],
  granite: [0x787a7e, 0x929498, 0xacaeaf, 0xc8cac8, 0xe0e0dc],
  asphalt: [0x3b3c42, 0x47484f, 0x53545c],
  tramBed: [0x585450, 0x68645e, 0x78746c],
  walk: [0x86888c, 0x96989a, 0xa6a8aa],
  paving: [0x928c82, 0xa29c90, 0xb2aca0],
  plaza: [0xa8a296, 0xb8b2a6, 0xc8c2b4, 0xd6d0c2],
  stone: [0x66645e, 0x7e7c74, 0x98948a, 0xb2aea2],
  ishi: [0x4e4c46, 0x66645c, 0x7e7a70, 0x989488, 0xb4b0a2],
  moat: [0x1e4442, 0x285450, 0x33645e, 0x44786e],
  pond: [0x1c4e48, 0x26625a, 0x34786c, 0x489082],
  peacePond: [0x1e3c4e, 0x284e62, 0x346278, 0x4a7a90],
  vermilion: [0x8c1c16, 0xb8281e, 0xdc3828, 0xf4543c],
  wood: [0x583a22, 0x744e2e, 0x90643c, 0xac7c4e],
  oldWood: [0x5a4a3a, 0x6e5c48, 0x847058, 0x9a866c],
  hinoki: [0x7e5a34, 0x9c7244, 0xba8c56, 0xd4a86e],
  kawara: [0x22262e, 0x30343e, 0x3e434e, 0x505662, 0x6a707c],
  tileRoof: [0x2a2e36, 0x383d46, 0x484e58, 0x5e6470],
  hiwada: [0x3a2a24, 0x4e3a30, 0x644a3c, 0x7c5c4a, 0x947058], // cypress-bark roofs of Itsukushima
  copper: [0x2e5a4e, 0x3e7262, 0x548c78, 0x6eaa92, 0x94c8b0],
  thatch: [0x5a4224, 0x7a5a30, 0x9a763e, 0xb8925a],
  board: [0x141418, 0x1c1c22, 0x26262e, 0x34343e], // black shitami-itabari boards
  plaster: [0xc8ccd0, 0xe2e4e4, 0xf6f6f2],
  concrete: [0x84827c, 0x9e9c94, 0xb8b6ae, 0xd2d0c8, 0xe6e4dc],
  domeStone: [0x6a6052, 0x847a6a, 0x9e9482, 0xb8ae9a, 0xcec4ae],
  brick: [0x5a3a2c, 0x74503a, 0x8e664a],
  rust: [0x2a2420, 0x3e3029, 0x584234, 0x6e5440],
  roofs: [0x7c828c, 0x9a948c, 0x6e645a, 0x54606e, 0x8c5244, 0x627066, 0xaca498],
  walls: [0xdad2c2, 0xc6c4be, 0xbca892, 0xe2ded4, 0x9ca6b0, 0xcebea8],
  glass: [0x5a7a94, 0x6a8aa4, 0x4a6a84, 0x7a9ab0],
  pine: [0x1e4028, 0x2a5434, 0x386a42, 0x4a7e50],
  camphor: [0x1e3c22, 0x2c5430, 0x40703c, 0x5e8c4c],
  momijiR: [0x7a1618, 0xa8221e, 0xd63424, 0xf25430],
  momijiO: [0x8e3214, 0xbc4c1c, 0xe46e24, 0xf89632],
  momijiY: [0x8e5c16, 0xb87e1e, 0xe0a628, 0xf8cc46],
  ginkgo: [0x8a6a14, 0xb8901c, 0xe0b82a, 0xf8dc5a],
  sakuraAut: [0x6a3a1e, 0x8e5226, 0xb46e34, 0xd08e48], // cherry trees in autumn, rust and brown
  willow: [0x3a5a2a, 0x547a36, 0x6e9644, 0x8eb058],
  lotus: [0x4a5a2a, 0x627634, 0x7a8e40, 0x96a452],
  seats: [0x7a1616, 0xa01e1e, 0xc42a2a, 0xe04040],
  dirt: [0x8a5e36, 0xa47448, 0xbc8c5c],
  gold: 0xe8b830,
  goldHi: 0xfff0a0,
  lamp: 0xffb868,
  warm: 0xffe49c,
  cool: 0xc8e4f4,
};

const CARS = [0xe8e8ec, 0x2c3038, 0xc43a30, 0x3a609c, 0x9aa2aa, 0xe8d69c, 0x6a2a3a, 0xd8d8d0];
const COATS = [0xd04040, 0x3a6ad0, 0xe8c040, 0xe8e8f0, 0x3a3a4a, 0xff9ac0, 0x6aaa5a, 0x8a5a3a, 0x2a2a34];

// Afternoon sunlight over Hiroshima -> golden Seto sea -> crimson-amber sunset on Mount Misen
const TOD = [
  [0, [1.0, 0.99, 0.95], 0xfff0d0, 0.03],
  [2800, [1.02, 0.96, 0.9], 0xffe0b0, 0.05],
  [4600, [1.04, 0.9, 0.8], 0xffb068, 0.08],
  [6000, [1.02, 0.82, 0.74], 0xff8848, 0.11],
  [L, [0.92, 0.72, 0.72], 0xd86048, 0.14],
];

const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function buildMid() {
  const stage = JSON.parse(readFileSync(join(root, 'src', 'data', 'stage7.json'), 'utf8'));
  const { mid: V, anchor } = stage.scroll;
  let img = new HiCanvas(W, L, S);
  const FW = W * S;
  const FH = L * S;
  const rand = rng(7707);
  const Y = (u) => Math.round(L - u);
  const U = (y) => L - y;
  const reserved = new Uint8Array(W * L);
  const water = new Uint8Array(W * L);
  const wet = new Uint8Array(W * L); // painted water (moat, ponds): no trees there
  const setWet = (x0, x1, u0, u1, v = 1) => {
    for (let u = u0; u < u1; u++) for (let x = Math.max(0, x0); x < Math.min(W, x1); x++) wet[Y(u) * W + x] = v;
  };

  const isRes = (x, y) => x >= 0 && x < W && y >= 0 && y < L && reserved[Math.floor(y) * W + Math.floor(x)];
  const anyRes = (x0, y0, w, h) => {
    for (let y = Math.floor(y0); y < y0 + h; y++)
      for (let x = Math.max(0, Math.floor(x0)); x < Math.min(W, x0 + w); x++)
        if (isRes(x, y)) return true;
    return false;
  };
  const reserveRect = (x0, y0, w, h) => {
    for (let y = Math.max(0, Math.floor(y0)); y < Math.min(L, y0 + h); y++)
      for (let x = Math.max(0, Math.floor(x0)); x < Math.min(W, x0 + w); x++) reserved[y * W + x] = 1;
  };

  const objects = [];
  const lights = [];
  const pools = [];
  const kit = new PropKit(7717, { artScale: S });
  const frame0 = kit.frame.bind(kit);
  kit.frame = (r, name) => frame0(r.hi ?? r, name); // (frames are drawn on HiCanvases)
  const lightsFine = []; // lamps as single fine pixels
  const glowPx = (X, Yy, c, a = 1) => lightsFine.push([Math.round(X), Math.round(Yy), c, a]);
  const crownMask = new Uint8Array(FW * FH); // (each crown its own 1..15: the wind runs through them)
  const crownHash = new Uint8Array(FW * FH); // (what it drew there, to know if something was drawn over it)
  const tod = todGrade(TOD, smooth);
  const dusk = (u) => smooth(3600, 6800, u);

  const stallSteam = [2, 3, 4].map((r) =>
    [0, 1].map((v) => kit.frame(puff(r * S, r * 31 + v, [0xb0b0b8, 0xd0d0d8, 0xebebf0, 0xffffff]))),
  );
  const incenseSmoke = [2, 3, 4].map((r) =>
    [0, 1].map((v) => kit.frame(puff(r * S, r * 43 + v, [0xc89878, 0xe4b890, 0xf8dcb8, 0xfff2dc]))),
  );
  const thinSmoke = [1, 2, 3].map((r) =>
    [0, 1].map((v) => kit.frame(puff(r * S, r * 57 + v, [0x9a9aa4, 0xbcbcc4, 0xdadae0, 0xf0f0f4]))),
  );

  const applyPool = (target, { x, y, r, c, k }) => {
    const [cr, cg, cb] = rgb(c);
    const CX = x * S;
    const CY = y * S;
    const R = r * S;
    for (let FYr = Math.floor(CY - R); FYr <= CY + R; FYr++)
      for (let FXr = Math.floor(CX - R); FXr <= CX + R; FXr++) {
        const q = target.rgbaPx(FXr, FYr);
        if (!q || !q[3]) continue;
        const dd = Math.hypot(FXr + 0.5 - CX, FYr + 0.5 - CY) / R;
        if (dd >= 1) continue;
        const f = (1 - dd) ** 1.6 * k;
        target.setRGBAPx(FXr, FYr, Math.min(255, q[0] + cr * f), Math.min(255, q[1] + cg * f), Math.min(255, q[2] + cb * f), q[3]);
      }
  };

  /** Draw into a frame of its own (graded like its row of the strip): a mover, a flame, a ripple. */
  const capture = (x0, y0, w, h, draw, opt = {}) => {
    const keep = img;
    const nl = lights.length;
    const np = pools.length;
    const nf = lightsFine.length;
    img = new HiCanvas(w, h, S, x0, y0);
    draw();
    const out = img;
    img = keep;
    const lit = lights.splice(nl);
    const litFine = lightsFine.splice(nf);
    const cast = opt.pools ? pools.slice(np) : pools.splice(np);
    tod.frame(out, opt.u ?? U(y0 + h / 2));
    for (const pl of cast) applyPool(out, pl);
    for (const [x, y, c, a] of lit) out.light(x, y, c, a);
    for (const [X, Yy, c, a] of litFine) out.px(X, Yy, c, a);
    return kit.frame(out);
  };
  /** A small frame drawn by hand: fn(r) paints a w x h raster; graded for strip position u. */
  const sprite = (w, h, u, fn) => {
    const r = new HiCanvas(w, h);
    fn(r);
    return kit.frame(tod.frame(r, u));
  };

  const glow = (x, y, c, a = 1) => lights.push([Math.round(x), Math.round(y), c, a]);
  const pool = (x, y, r, c, k = 0.45) => pools.push({ x, y, r, c, k });
  const shadowRect = (x, y, w, h, f = 0.58) => {
    const X0 = Math.round(x * S);
    const Y0 = Math.round(y * S);
    const X1 = Math.round((x + w) * S);
    const Y1 = Math.round((y + h) * S);
    for (let Yy = Y0; Yy < Y1; Yy++)
      for (let X = X0; X < X1; X++) img.tintPx(X, Yy, X === X0 || X === X1 - 1 || Yy === Y0 || Yy === Y1 - 1 ? 1 - (1 - f) * 0.55 : f);
  };
  const shadowEllipse = (cx, cy, rx, ry, f = 0.6) =>
    img.fine(cx - rx, cy - ry, 2 * rx + 1, 2 * ry + 1, (X, Yy, x, y) => {
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) img.tintPx(X, Yy, f);
      return null;
    });
  /** A patch of ground in a ramp: broad noise from the game's units, a fine grain over it. */
  const fill = (x0, y0, w, h, ramp, seed, scale = 5) =>
    img.fine(x0, y0, w, h, (X, Yy, x, y) => {
      const c = rampColor(ramp, 0.2 + fbm(x, y, { seed, scale, octaves: 2 }) * 0.65, X, Yy);
      const g = hashPx(X, Yy, seed);
      return g < 0.07 ? scaleColor(c, 0.9) : g > 0.94 ? scaleColor(c, 1.09) : c;
    });
  /** A lawn in fine pixels over a rectangle: blades, tufts, a soft broad mottling; a daisy or fallen leaf here and there. */
  const lawnFill = (x0, y0, w, h, ramp, seed) =>
    img.fine(x0, y0, w, h, (X, Yy, x, y) => {
      let c = rampColor(ramp, 0.22 + fbm(x, y, { seed, scale: 9, octaves: 3 }) * 0.6, X, Yy);
      const t = hashPx(X >> 1, Yy >> 1, seed);
      if (t < 0.13) c = scaleColor(c, 0.86);
      else if (t > 0.9) c = scaleColor(c, 1.13);
      const g = hashPx(X, Yy, seed + 1);
      if (g > 0.9992) c = 0xf4f0e0;
      else if (g < 0.0008) c = 0xe0a030;
      return c;
    });
  /** Flagged granite over a rectangle: flags of `flag` fine pixels with their joints, each its own tone, worn and stained. */
  const flagFill = (x0, y0, w, h, ramp, seed, flag = 18) =>
    img.fine(x0, y0, w, h, (X, Yy, x, y) => {
      if (X % flag === 0 || Yy % flag === 0) return scaleColor(ramp[0], 0.86);
      const t = hashPx(Math.floor(X / flag), Math.floor(Yy / flag), seed);
      let c = rampColor(ramp, 0.3 + t * 0.4 + (fbm(x, y, { seed, scale: 8 }) - 0.5) * 0.3, X, Yy);
      const g = hashPx(X, Yy, seed + 1);
      if (g < 0.05) c = scaleColor(c, 0.92);
      else if (g > 0.97) c = scaleColor(c, 1.05);
      return c;
    });
  /** Fill a strip rectangle given in u (bottom u0, top u1). */
  const fillU = (x0, x1, u0, u1, ramp, seed, scale = 5) => fill(x0, Y(u1), x1 - x0, u1 - u0, ramp, seed, scale);
  const gravelPath = (x0, x1, u0, u1, ramp = C.gravel) => {
    img.fine(x0, Y(u1), x1 - x0, u1 - u0, (X, Yy) => {
      const e = Math.min(X - x0 * S, x1 * S - 1 - X);
      const g = hashPx(X, Yy, 22);
      if (e < 2) return g < 0.5 ? ramp[0] : scaleColor(ramp[0], 0.88);
      return g < 0.1 ? scaleColor(ramp[0], 0.84) : g > 0.92 ? scaleColor(ramp[ramp.length - 1], 1.06) : rampColor(ramp, hashPx(X >> 1, Yy >> 1, 23), X, Yy);
    });
    reserveRect(x0, Y(u1), x1 - x0, u1 - u0);
  };
  const disc = (cx, cy, r, ramp, seed) =>
    img.fine(cx - r, cy - r, 2 * r + 1, 2 * r + 1, (X, Yy, x, y) => {
      const d = Math.hypot(x - cx, y - cy) / r;
      if (d > 1) return null;
      return rampColor(ramp, 0.3 + fbm(x, y, { seed, scale: 3 }) * 0.45 - ((x - cx) + (y - cy)) / r * 0.15, X, Yy);
    });

  const pads = stage.waves
    .filter((w) => w.type === 'turret')
    .map((w) => ({ x: w.x, u: anchor + V * w.t + 10 }));
  for (const p of pads) reserveRect(p.x - 12, Y(p.u) - 12, 24, 24);
  const padNear = (x, u, r = 16) => pads.some((p) => Math.abs(p.x - x) < r && Math.abs(p.u - u) < r);

  // Reef islets in Hiroshima Bay under any bay turret pad (e.g. t = 90 -> u = 3130)
  const bayIslets = pads.filter((p) => p.u > QUAY_U + 40 && p.u < MIYAJIMA_U - 40);

  // ------------------------------------------------------------ shared drawing helpers
  /** A tree crown (any nature.mjs shape) recoloured with its own palette, shadow thrown to the lower right. */
  const tree = (cx, cy, r, palette, seed, kind = 'broadleaf') => {
    const CX = Math.round(cx) * S + 1;
    const CY = Math.round(cy) * S + 1;
    const pts = crownPixels(kind, CX, CY, r * S, rng(seed), seed & 1023);
    const ramp = RAMPS[kind];
    const off = Math.round((2 + r * 0.3) * S);
    objects.push({
      y: cy + r * 0.6,
      shadow: () => {
        for (const p of pts) img.tintPx(p.x + off, p.y + off, 0.6);
      },
      draw: () => {
        const inCrown = new Set(pts.map((p) => p.x * 65536 + p.y));
        for (const p of pts) {
          const k = Math.max(0, ramp.indexOf(p.c));
          let c = palette[Math.min(palette.length - 1, k)];
          if (!inCrown.has(p.x * 65536 + p.y + 1) || !inCrown.has((p.x + 1) * 65536 + p.y)) c = scaleColor(c, 0.78);
          // leaves: flecks of the next shade up and down
          const g = hashPx(p.x >> 1, p.y >> 1, seed & 255);
          if (g > 0.86) c = scaleColor(c, 1.14);
          else if (g < 0.12) c = scaleColor(c, 0.88);
          img.px(p.x, p.y, c);
          if (p.x >= 0 && p.x < FW && p.y >= 0 && p.y < FH) crownMask[p.y * FW + p.x] = 1 + (seed % 15);
        }
        for (const p of pts) {
          if (p.x < 0 || p.x >= FW || p.y < 0 || p.y >= FH) continue;
          const q = img.rgbaPx(p.x, p.y);
          if (q) crownHash[p.y * FW + p.x] = (q[0] ^ (q[1] << 1) ^ (q[2] << 2)) & 255;
        }
      },
    });
  };
  /** A loose grove: n trees inside a rectangle (u0..u1), skipping reserved ground and water. */
  const grove = (x0, x1, u0, u1, n, pals, seed, rMin = 3.5, rMax = 6.5, kind = 'broadleaf') => {
    const g = rng(seed);
    for (let k = 0; k < n; k++) {
      const x = x0 + g() * (x1 - x0);
      const u = u0 + g() * (u1 - u0);
      const r = rMin + g() * (rMax - rMin);
      const y = Y(u);
      if (anyRes(x - r * 0.6, y - r * 0.6, r * 1.2, r * 1.2) || W_(Math.round(x), y) || wet[y * W + Math.round(x)]) continue;
      const pal = pals[Math.floor(g() * pals.length)];
      tree(x, y, r, pal, seed * 7 + k * 131, pal === C.pine ? 'pine' : kind);
    }
  };

  const stoneLantern = (x, u, lit = true) => {
    const y = Y(u);
    const X = x * S;
    const Yy = y * S;
    objects.push({
      y: y + 2,
      shadow: () => {
        for (let k = 0; k < 10; k++) for (let t = -1; t <= 1; t++) img.tintPx(X + 3 + k, Yy + 3 + Math.floor(k * 0.55) + t, 0.68);
      },
      draw: () => {
        for (let i = -1; i < 4; i++) for (let j = 5; j < 7; j++) img.px(X + i, Yy + j, j === 5 ? C.granite[3] : C.granite[1]);
        for (let j = 1; j < 5; j++) img.px(X + 1, Yy + j, C.granite[2]);
        for (let j = -2; j < 1; j++) for (let i = -1; i < 4; i++) img.px(X + i, Yy + j, i === 3 ? C.granite[1] : C.granite[2]);
        for (let i = -3; i < 6; i++) img.px(X + i, Yy - 3, i < 1 ? C.granite[4] : C.granite[3]);
        for (let i = -2; i < 5; i++) img.px(X + i, Yy - 4, C.granite[3]);
        img.px(X + 1, Yy - 5, C.granite[4]);
        img.px(X + 1, Yy - 6, C.granite[4]);
        if (lit) {
          glowPx(X + 1, Yy - 1, 0xffcc70, 0.95);
          glowPx(X + 1, Yy - 2, 0xffe0a0, 0.95);
          pool(x, y - 1, 6, C.lamp, 0.12 + dusk(u) * 0.22);
        } else img.px(X + 1, Yy - 1, 0x2a2622);
      },
    });
  };
  /** A street lamp: a post and a lit head; the light pool grows towards dusk. */
  const streetLamp = (x, u, c = 0xfff0c8) => {
    const y = Y(u);
    const X = x * S + 1;
    const Yy = y * S;
    objects.push({
      y: y + 1,
      shadow: () => {
        for (let k = 0; k < 12; k++) img.tintPx(X + 1 + k, Yy + 1 + Math.floor(k * 0.55), 0.68);
      },
      draw: () => {
        for (let j = -15; j < 1; j++) {
          img.px(X, Yy + j, 0x4a4e56);
          img.px(X + 1, Yy + j, 0x2e323a);
        }
        for (let i = -1; i < 5; i++) img.px(X + i, Yy - 16, 0x4a4e56);
        img.px(X + 4, Yy - 15, c);
        img.px(X + 5, Yy - 15, c);
        glowPx(X + 4, Yy - 15, c, 0.95);
        glowPx(X + 5, Yy - 15, c, 0.95);
        pool(x, y - 5, 6, C.lamp, 0.08 + dusk(u) * 0.25);
      },
    });
  };
  const bench = (x, y, w = 5) => {
    const X = x * S;
    const Yy = y * S;
    for (let i = 0; i < w * S; i++) {
      img.px(X + i, Yy, C.wood[3]);
      img.px(X + i, Yy + 1, C.wood[2]);
      img.px(X + i, Yy + 3, C.wood[2]);
      img.px(X + i, Yy + 4, C.wood[0]);
      img.tintPx(X + i + 1, Yy + 6, 0.72);
    }
    for (const i of [1, w * S - 2]) img.px(X + i, Yy + 5, 0x2a2a30);
  };

  /** A person seen from above in fine pixels: hair or a cap, the face, shoulders and arms, legs, a shadow. */
  const personPx = (X, Yy, pr, o = {}) => {
    const coat = o.coat ?? pr.pick(COATS);
    const hair = o.cap ?? pr.pick([0x1a1418, 0x2a2024, 0x3a2a20, 0x5a3a28, 0x8a8a8a]);
    for (let i = 0; i < 4; i++) img.px(X + i, Yy + 5, 0x141824, 0.4);
    img.px(X, Yy - 2, hair);
    img.px(X + 1, Yy - 2, scaleColor(hair, 1.2));
    img.px(X + 2, Yy - 2, hair);
    img.px(X, Yy - 1, 0xe8c0a0);
    img.px(X + 1, Yy - 1, 0xf0d0b0);
    img.px(X + 2, Yy - 1, o.cap ? hair : 0xe0b898);
    for (let j = 0; j < 3; j++) for (let i = -1; i < 4; i++) if (!(j === 2 && (i < 0 || i > 2))) img.px(X + i, Yy + j, i < 0 || i > 2 ? scaleColor(coat, 0.75) : i === 0 ? scaleColor(coat, 1.12) : coat);
    const leg = pr() < 0.5 ? 0x2a2a3a : 0x4a4a5a;
    img.px(X, Yy + 3, leg);
    img.px(X + 2, Yy + 3, leg);
    img.px(X, Yy + 4, 0x1a1418);
    img.px(X + 2, Yy + 4, 0x1a1418);
  };
  /** People standing about. */
  const crowd = (x0, y0, w, h, n, any = false, cols = COATS) => {
    for (let i = 0; i < n; i++) {
      const x = Math.round(x0 + rand() * w);
      const y = Math.round(y0 + rand() * h);
      if (!any && (isRes(x, y) || W_(x, y))) continue;
      const coat = rand() < 0.6 ? rand.pick(cols) : 0x3a3a4a;
      const cap = rand() < 0.15 ? 0xe8e0d0 : undefined;
      personPx(x * S + (i % 3), y * S + (i % 2), rng(x * 977 + y * 13), { coat, cap });
    }
  };
  /** Somebody walking, in two steps; cap = a school cap colour. */
  const walker = (c, f, u, cap) => {
    const r = new HiCanvas(4, 3);
    const c0 = scaleColor(c, 0.82);
    const hair = cap ?? 0x2a2026;
    r.px(2, 0, hair);
    r.px(3, 0, scaleColor(hair, 1.2));
    r.px(4, 0, hair);
    r.px(2, 1, cap ? hair : 0xe8c0a0);
    r.px(3, 1, 0xf0d0b0);
    r.px(4, 1, 0xe0b898);
    for (let j = 2; j < 5; j++) for (let i = 1; i < 6; i++) if (!(j === 4 && (i < 2 || i > 4))) r.px(i, j, i === 1 || i === 5 ? c0 : i === 2 ? scaleColor(c, 1.12) : c);
    r.px(f ? 2 : 3, 5, 0x2a2a3a);
    r.px(f ? 4 : 3, 6, 0x2a2a3a);
    r.px(f ? 2 : 4, 6, 0x1a1418);
    for (let i = 1; i < 6; i++) r.px(i, 7, 0x141824, 0.35);
    return kit.frame(tod.frame(r, u));
  };
  /** A few people as objects, so what stands in front of them hides them. */
  const folk = (x, y, o = {}) => {
    const X = Math.round(x * S);
    const Yy = Math.round(y * S);
    objects.push({ y: y + 1.7, draw: () => personPx(X, Yy, rng(X * 977 + Yy * 13), o) });
  };
  /** A stone stair: treads lit on their nosing, the riser's shade, worn in the middle. x, y, w, h in game units. */
  const stairs = (x, y, w, h) =>
    img.fine(x, y, w, h, (X, Yy) => {
      const k = (Yy - y * S) % 6;
      const a = Math.abs(X - (x + w / 2) * S) / (w * 1.5);
      if (k === 0) return C.ishi[4];
      if (k >= 4) return k === 5 ? 0x2e2c28 : C.ishi[0];
      const c = a < 0.5 ? C.ishi[3] : C.ishi[2];
      return hashPx(X, Yy, 42) < 0.08 ? scaleColor(c, 0.9) : c;
    });
  /** A boulder at fine (CX, CY), lit from the top left, sitting in its own shadow. */
  const rockPx = (CX, CY, r, ramp = C.granite, seed = 0) => {
    for (let Yy = Math.floor(CY - r); Yy <= CY + r + 2; Yy++)
      for (let X = Math.floor(CX - r); X <= CX + r + 2; X++) if (((X + 0.5 - CX - 1.5) / r) ** 2 + ((Yy + 0.5 - CY - 1.5) / r) ** 2 <= 1) img.tintPx(X, Yy, 0.74);
    for (let Yy = Math.floor(CY - r); Yy <= CY + r; Yy++)
      for (let X = Math.floor(CX - r); X <= CX + r; X++) {
        const dx = (X + 0.5 - CX) / r;
        const dy = (Yy + 0.5 - CY) / r;
        const lump = (hashPx(X >> 1, Yy >> 1, seed) - 0.5) * 0.35;
        if (dx * dx + dy * dy + lump * 0.5 > 1) continue;
        img.px(X, Yy, rampColor(ramp, Math.max(0, Math.min(0.98, 0.5 - dx * 0.5 - dy * 0.5 + lump)), X, Yy));
      }
  };
  /** A memorial stone at (x, y), small: a dark upright slab on a plinth, its inscription; size 1..3. */
  const monument = (x, y, size = 2) => {
    const X = Math.round(x * S);
    const Yy = Math.round(y * S);
    const w = 2 + size;
    const h = 5 + size * 2;
    const r = rng(X + Yy);
    objects.push({
      y: y + 1,
      shadow: () => {
        for (let k = 0; k < h; k++) for (let t = -w + 1; t < w; t++) img.tintPx(X + 2 + k + t, Yy + 2 + Math.floor(k * 0.55), 0.78);
      },
      draw: () => {
        for (let j = 0; j < 3; j++) for (let i = -w - 2; i <= w + 2; i++) img.px(X + i, Yy + j, j === 0 ? C.granite[4] : j === 2 ? C.granite[0] : C.granite[2]);
        for (let j = -h; j < 0; j++)
          for (let i = -w; i <= w; i++) {
            let c = i === -w ? C.granite[3] : i === w ? C.granite[0] : C.granite[1];
            if (j === -h) c = C.granite[4];
            if (i > -w && i < w && j > -h + 1 && j < -1 && j % 2 === 0 && hashPx(X + i, j, 41) < 0.5) c = C.granite[0];
            img.px(X + i, Yy + j, c);
          }
        if (r() < 0.6) for (const [i, c] of [[-3, 0xf8f8f0], [-1, 0xe8c040], [2, 0xf8f8f0]]) {
          img.px(X + i, Yy + 3, c);
          img.px(X + i, Yy + 4, 0x3e6a34);
        }
      },
    });
    if (x >= 0 && x < W && y >= 0 && y < L) reserved[Math.floor(y) * W + Math.floor(x)] = 1;
  };
  /** n people strolling inside an ellipse (a plaza, a garden walk). */
  const strollers = (x, u, rx, ry, n, opt = {}) => {
    const cols = opt.cols ?? COATS;
    for (let k = 0; k < n; k++) {
      const c = cols[(k * 3 + Math.floor(x + u)) % cols.length];
      kit.wander(x, u, rx, ry, [walker(c, 0, u, opt.cap), walker(c, 1, u, opt.cap)], { n: 1, sp: opt.sp ?? 4, turn: 'flip', fps: 3, idle: opt.idle ?? 0.6 });
    }
  };
  /** A line of school children in yellow caps following their teacher back and forth along a route. */
  const schoolGroup = (pts, n, u, s0) => {
    const kid = [0xf0f0f0, 0x2a3a6a, 0x3a3a4a];
    const f = [];
    for (let k = 0; k < n; k++) {
      const c = kid[k % kid.length];
      f.push(k === 0 ? [walker(0x5a2a3a, 0, u), walker(0x5a2a3a, 1, u)] : [walker(c, 0, u, 0xf4d020), walker(c, 1, u, 0xf4d020)]);
    }
    kit.path(pts, f, { sp: 4, n, gap: 3, mode: 'pp', hold: 5, turn: 'flip', fps: 3, cars: 1, s0 });
  };

  /**
   * The visible south face of an ishigaki wall: big fitted stones in courses, long and short corner stones
   * (sangi-zumi), moss in the joints, darkening towards the foot. yTop = the wall's top edge on screen.
   */
  const stoneFace = (x0, x1, yTop, h, seed = 1) => {
    const r = rng(seed * 977 + x0 * 31 + yTop);
    const X0 = x0 * S;
    const X1 = x1 * S;
    const Y0 = yTop * S;
    const H = h * S;
    for (let row = 0; row * 8 < H; row++) {
      let X = X0 - Math.floor(r() * 10);
      const rh = Math.min(8, H - row * 8);
      while (X < X1) {
        const sw = 7 + Math.floor(r() * 12);
        const c = C.ishi[1 + Math.floor(r() * 3)];
        for (let j = 0; j < rh; j++)
          for (let i = 0; i < sw; i++) {
            const XX = X + i;
            if (XX < X0 || XX >= X1) continue;
            let cc = c;
            if (i === sw - 1 || j === rh - 1) cc = C.ishi[0];
            else if (j === 0 || i === 0) cc = scaleColor(c, 1.14);
            else if (hashPx(XX, Y0 + row * 8 + j, 371) < 0.1) cc = scaleColor(c, 0.9);
            cc = scaleColor(cc, 1.06 - ((row * 8 + j) / Math.max(1, H)) * 0.28);
            if ((i === sw - 1 || j === rh - 1) && r() < 0.14) cc = r() < 0.5 ? 0x4a6a3a : 0x5a7a44;
            img.px(XX, Y0 + row * 8 + j, cc);
          }
        X += sw;
      }
    }
    // the long and short corner stones
    for (const side of [0, 1])
      for (let j = 0; j < H; j++) {
        const long = Math.floor(j / 9) % 2;
        const wide = long ? 12 : 7;
        for (let i = 0; i < wide; i++) {
          const XX = side ? X1 - 1 - i : X0 + i;
          img.px(XX, Y0 + j, j % 9 === 8 ? C.ishi[0] : i === wide - 1 ? C.ishi[1] : C.ishi[long ? 4 : 3]);
        }
      }
    for (let X = X0; X < X1; X++) {
      img.px(X, Y0, C.ishi[4]);
      img.px(X, Y0 + 1, scaleColor(C.ishi[4], 0.9));
    }
  };

  /**
   * A Japanese roof seen from above in 3/4: the north slope lit, the ridge, the south slope in tile courses (or
   * bark layers), hipped ends lit on the left and shaded on the right, an eave line with a dark shadow under it.
   * opt: ridge (true), hip (ends hipped, default true), noshi (white ridge line), gable ('tri' | 'kara' | null:
   * a gable facing the viewer in the middle), gw (gable width), crest (gold crest).
   */
  const roof = (x0, y0, w, h, ramp, opt = {}) => {
    const n = ramp.length;
    const ry = y0 + Math.max(1, Math.round(h * (opt.ridgeAt ?? 0.32)));
    const hipW = opt.hip === false ? 0 : Math.max(2, Math.round(Math.min(w * 0.18, h * 0.7)));
    const bark = opt.bark;
    const X0 = x0 * S;
    const X1 = (x0 + w) * S;
    const Y0 = y0 * S;
    const Y1 = (y0 + h) * S;
    const RY = ry * S + 1;
    const HW = hipW * S;
    const seed = (x0 * 31 + y0) & 1023;
    const south = ramp.slice(1, n - 1);
    for (let Yy = Y0; Yy < Y1; Yy++)
      for (let X = X0; X < X1; X++) {
        const lx = X - X0;
        const rx = X1 - 1 - X;
        const north = Yy < RY;
        let c;
        if (north) c = ramp[n - 2];
        else {
          const k = (Yy - RY) / Math.max(1, Y1 - RY);
          const t = 0.85 - k * 0.6;
          const v = Math.max(0, Math.min(0.999, t)) * (south.length - 1);
          c = mix(south[Math.floor(v)], south[Math.min(south.length - 1, Math.floor(v) + 1)], v - Math.floor(v));
        }
        if (bark) {
          // layered cypress bark: long shingled courses, the odd lighter strip
          const course = (Yy - Y0) >> 2;
          const b = hashPx((X + course * 7) >> 3, course, seed);
          if (b > 0.7) c = scaleColor(c, 1.12);
          else if (b < 0.25) c = scaleColor(c, 0.9);
          if ((Yy - Y0) % 4 === 0) c = scaleColor(c, 0.82);
        } else {
          // rolled tiles: light and dark across each column, the courses staggered
          const col = (X + ((Yy - Y0) >> 2) % 2) % 3;
          if (col === 0) c = scaleColor(c, 1.13);
          else if (col === 2) c = scaleColor(c, 0.82);
          if ((Yy - Y0) % 4 === 0) c = scaleColor(c, 0.86);
          const t = hashPx(X >> 2, (Yy - Y0) >> 2, seed);
          if (t < 0.08) c = scaleColor(c, 0.9);
          else if (t > 0.94) c = scaleColor(c, 1.1);
        }
        // hipped ends
        const dy = Math.abs(Yy - RY);
        const inset = HW - dy * 0.4;
        if (HW && lx < inset) c = scaleColor(ramp[n - 1], (Yy - Y0) % 3 === 0 ? 0.84 : 1);
        if (HW && rx < inset) c = scaleColor(ramp[0], (Yy - Y0) % 3 === 0 ? 0.84 : 1);
        if (HW && (Math.abs(lx - inset) < 1 || Math.abs(rx - inset) < 1)) c = scaleColor(ramp[n - 1], 1.15);
        // the eave: end tiles catching the light, their shade under them
        if (Yy >= Y1 - 2) c = Yy === Y1 - 1 ? ramp[0] : X % 3 === 0 ? scaleColor(ramp[n - 1], 1.2) : ramp[n - 1];
        img.px(X, Yy, c);
      }
    // the ridge and its end tiles
    if (opt.ridge !== false) {
      for (let X = X0 + HW - 2; X < X1 - HW + 2; X++) {
        img.px(X, RY - 1, scaleColor(ramp[n - 1], 1.15));
        img.px(X, RY, ramp[0]);
        img.px(X, RY + 1, scaleColor(ramp[0], 0.8));
        if (opt.noshi) {
          img.px(X, RY - 3, C.plaster[2]);
          img.px(X, RY - 2, C.plaster[1]);
        }
      }
      if (HW) for (const ox of [X0 + HW - 3, X1 - HW]) for (let j = -3; j <= 1; j++) for (let i = 0; i < 3; i++) img.px(ox + i, RY + j, j < -1 ? scaleColor(ramp[n - 1], 1.2) : ramp[0]);
    }
    // lifted corners
    for (const [X, c] of [[X0 - 2, ramp[n - 1]], [X0 - 1, ramp[n - 1]], [X1, ramp[1]], [X1 + 1, ramp[1]]]) {
      img.px(X, Y1 - 4, c);
      img.px(X, Y1 - 3, scaleColor(c, 0.8));
    }
    // the gable facing the viewer
    if (opt.gable) {
      const gw = opt.gw ?? Math.round(w * 0.32);
      const gx = Math.round(x0 + (opt.gx ?? w / 2));
      const GH = Math.round((gw / 2) * S);
      const GW = gw * S;
      const CX = gx * S + 1;
      const YB = Y1 - 4;
      for (let j = 0; j <= GH; j++) {
        const half = opt.gable === 'kara' ? GW / 2 - (j * j) / Math.max(1, GH) : GW / 2 - j;
        if (half < 0) break;
        for (let X = Math.round(CX - half); X <= Math.round(CX + half); X++) {
          const e = Math.abs(X - CX) - half;
          // bargeboards in pale wood, the triangle plastered or as asked, its slats
          let c = opt.gableFill ?? (j < S * 2 ? C.plaster[2] : C.plaster[1]);
          if ((X - CX) % 6 === 0 && !opt.gableFill) c = C.plaster[0];
          if (e >= -1.5) c = ramp[0];
          else if (e >= -3) c = ramp[n - 1];
          img.px(X, YB - j, c);
        }
      }
      if (opt.crest !== false) {
        const cy = YB - Math.floor(GH / 2);
        const cc = opt.crestC ?? C.gold;
        img.discPx(CX, cy, 2.4, cc);
        img.px(CX - 1, cy - 1, C.goldHi);
      }
    }
    // the shadow under the eave
    for (let X = X0; X < X1; X++) for (let j = 0; j < 3; j++) img.tintPx(X, Y1 + j, 0.6 + j * 0.12);
  };

  /**
   * A facade under an eave: white walls between pillars (vermilion, dark wood or none), with lattice windows,
   * or black boards under plaster. style: 'shrine' | 'temple' | 'castle' | 'plain' | 'shop'.
   */
  const facade = (x0, y, w, h, style, opt = {}) => {
    const pil = style === 'shrine' ? C.vermilion : style === 'temple' ? C.wood : style === 'oldwood' ? C.oldWood : null;
    const bay = (opt.bay ?? 5) * S;
    const X0 = x0 * S;
    const Y0 = y * S;
    const FW2 = w * S;
    const FH2 = h * S;
    const wall = opt.wall ?? C.plaster[1];
    for (let j = 0; j < FH2; j++)
      for (let i = 0; i < FW2; i++) {
        let c;
        if (j < 2) c = j === 0 ? 0x151014 : 0x2a2224; // (the shade of the eave)
        else if (style === 'castle') {
          const boards = j >= Math.round(FH2 * 0.42);
          c = boards ? ((j >> 1) % 2 ? C.board[1] : C.board[2]) : (i > FW2 - 7 ? C.plaster[0] : C.plaster[1]);
          if (boards && j === Math.round(FH2 * 0.42)) c = C.board[0];
          if (boards && i % 9 === 0) c = C.board[0];
          const wy = Math.round(FH2 * 0.16);
          if (!boards && j >= wy && j < wy + 5 && i % 15 >= 5 && i % 15 < 10 && i > 3 && i < FW2 - 4) c = (i % 15 === 7) ? 0x4a4a52 : 0x22222a;
        } else if (style === 'shop') {
          c = opt.wall ?? C.oldWood[2];
          if (i % 6 === 0) c = scaleColor(c, 0.84);
          if (j >= FH2 - 8) {
            const nc = opt.noren ?? 0x2a3a6a;
            c = (i >> 3) % 2 ? nc : scaleColor(nc, 0.7);
            if (j === FH2 - 8) c = 0x1a1414;
          }
        } else {
          const isPil = pil && (i % bay < 3 || i >= FW2 - 3);
          if (isPil) c = i % bay === 0 ? scaleColor(pil[2], 1.15) : i % bay === 2 ? pil[1] : pil[2];
          else c = wall;
          if (!isPil && style !== 'plain' && opt.lattice !== false && j >= 3 && j < FH2 - 2 && h > 3) {
            // the koshi lattice over paper
            if (i % 3 === 0 || j % 3 === 0) c = scaleColor(wall, 0.74);
          }
          if (!isPil && opt.open && j >= 3) c = j < 5 ? 0x14100e : 0x2a2026;
          if (j >= FH2 - 2) c = scaleColor(c, 0.7);
        }
        if (i >= FW2 - 3) c = scaleColor(c, 0.8);
        img.px(X0 + i, Y0 + j, c);
      }
  };

  /**
   * A hall in 3/4 view: a roof and a front face below it, as one object (shadow to the lower right).
   * The roof covers rows y..y+roofH, the face roofH..roofH+faceH. Returns the bottom y.
   */
  const hall = (x0, y, w, roofH, faceH, ramp, style, opt = {}) => {
    const by = y + roofH + faceH;
    objects.push({
      y: by + (opt.sortBias ?? 0),
      shadow: () => shadowRect(x0 + 3, y + 3, w, roofH + faceH, opt.shade ?? 0.55),
      draw: () => {
        const inset = opt.inset ?? 1;
        if (opt.base) {
          img.rect(x0 + inset - 1, by - 1, w - inset * 2 + 2, 2, opt.base);
        }
        facade(x0 + inset, y + roofH, w - inset * 2, faceH, style, opt);
        roof(x0, y, w, roofH, ramp, opt);
        opt.extra?.();
      },
    });
    if (opt.reserve !== false) reserveRect(x0 - 1, y - 1, w + 2, roofH + faceH + 2);
    return by;
  };

  /** A modern block in 3/4 view: flat roof with rooftop clutter, a front of windows (lit towards dusk). */
  const building = (x, y, w, h, faceH, opt = {}) => {
    const style = opt.style ?? 'office';
    const roofC = opt.roof ?? rand.pick(C.roofs);
    const wall = opt.wall ?? (style === 'glass' ? rand.pick(C.glass) : rand.pick(C.walls));
    const u = U(y);
    const litP = 0.12 + dusk(u) * 0.4;
    const items = [];
    const nItems = Math.max(1, Math.floor((w * h) / 120));
    for (let i = 0; i < nItems; i++) items.push([rand.pick(['ac', 'ac', 'tank', 'hut', 'solar']), x + 2 + Math.floor(rand() * Math.max(1, w - 9)), y + 2 + Math.floor(rand() * Math.max(1, h - 7))]);
    const lit = [];
    for (let k = 0; k < 400; k++) lit.push(rand() < litP);
    const awn = rand.pick([0xc83a2a, 0x2a6a3a, 0x2a4a8a, 0xd8a020, 0x8a2a5a]);
    const off = 3 + Math.round(faceH * 0.3);
    objects.push({
      y: y + h + faceH,
      shadow: () => shadowRect(x + off, y + off, w, h + faceH, 0.5),
      draw: () => {
        const X0 = x * S;
        const X1 = (x + w) * S;
        const Y0 = y * S;
        const Y1 = (y + h) * S;
        for (let Yy = Y0; Yy < Y1; Yy++)
          for (let X = X0; X < X1; X++) {
            const e = Math.min(X - X0, Yy - Y0);
            const e2 = Math.min(X1 - 1 - X, Y1 - 1 - Yy);
            let c;
            if (e < 2) c = scaleColor(roofC, e === 0 ? 1.25 : 1.12);
            else if (e2 < 2) c = scaleColor(roofC, e2 === 0 ? 0.62 : 0.78);
            else if (e === 2) c = scaleColor(roofC, 0.8);
            else {
              c = roofC;
              if ((X - X0) % 15 === 0 || (Yy - Y0) % 12 === 0) c = scaleColor(roofC, 1.06);
              if (hashPx(X >> 3, Yy >> 3, x + y) > 0.9) c = scaleColor(c, 0.94);
              const g = hashPx(X, Yy, 8);
              if (g < 0.06) c = scaleColor(c, 0.9);
              else if (g > 0.96) c = scaleColor(c, 1.08);
            }
            img.px(X, Yy, c);
          }
        if (opt.noItems !== true)
          for (const [kind, ix, iy] of items) {
            const IX = ix * S;
            const IY = iy * S;
            if (kind === 'ac') {
              for (let k = 0; k < 2; k++) {
                const UX = IX + k * 9;
                for (let j = 0; j < 8; j++)
                  for (let i = 0; i < 7; i++) {
                    if (j === 7) {
                      img.px(UX + i + 1, IY + j, 0x101018, 0.4);
                      continue;
                    }
                    const d = Math.hypot(i - 3, j - 3.5);
                    img.px(UX + i, IY + j, i === 0 || j === 0 ? 0xdadee2 : i === 6 || j === 6 ? 0x7a7e84 : d < 2.6 ? (d < 1 ? 0x8a8e94 : (i + j) % 2 ? 0x3a3e44 : 0x5a5e64) : 0xb8bcc0);
                  }
              }
            } else if (kind === 'tank') {
              for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) if (Math.hypot(i - 7, j - 7) < 6) img.tintPx(IX + i + 2, IY + j + 2, 0.6);
              img.discPx(IX + 6, IY + 6, 6, 0x8a8e94);
              img.discPx(IX + 5.5, IY + 5.5, 5, 0xc8ccd0);
              img.discPx(IX + 4.5, IY + 4.5, 2.4, 0xf0f2f4);
            } else if (kind === 'hut') {
              for (let j = 0; j < 15; j++)
                for (let i = 0; i < 18; i++) {
                  const top = j < 9;
                  let c = top ? (i === 0 || j === 0 ? scaleColor(roofC, 1.14) : i === 17 || j === 8 ? scaleColor(roofC, 0.76) : scaleColor(roofC, 0.94)) : j === 9 ? scaleColor(wall, 0.6) : scaleColor(wall, 0.9);
                  if (!top && i >= 7 && i <= 10 && j > 9) c = j === 10 ? 0x4a4a50 : 0x2a2a30;
                  img.px(IX + i, IY + j, c);
                }
            } else {
              for (let j = 0; j < 9; j++)
                for (let i = 0; i < 21; i++) img.px(IX + i, IY + j, i % 7 === 6 || j % 5 === 4 ? 0x7a8aa0 : j % 5 === 0 ? 0x3a4e80 : 0x24346a);
              for (let i = 0; i < 21; i++) img.px(IX + i, IY + 9, 0x101018, 0.45);
            }
          }
        opt.top?.();
        const fy = y + h;
        const FY0 = fy * S;
        const FH2 = faceH * S;
        const FLOOR = 9;
        for (let j = 0; j < FH2; j++) {
          const row = j % FLOOR;
          const fl = Math.floor(j / FLOOR);
          for (let X = X0; X < X1; X++) {
            const cx = X - X0;
            let c;
            if (style === 'glass') {
              const streak = Math.abs(((cx + j * 0.6) % 66) - 18) < 6;
              c = scaleColor(wall, (streak ? 1.25 : 1) * (1.12 - (j / FH2) * 0.25));
              if (cx % 9 < 1 || row === 0) c = scaleColor(wall, 0.7);
              else if (lit[(fl * 7 + Math.floor(cx / 9)) % 400]) {
                glowPx(X, FY0 + j, fl & 1 ? C.cool : C.warm, 0.92);
                continue;
              }
            } else {
              c = cx < 2 ? scaleColor(wall, 1.08) : cx >= X1 - X0 - 2 ? scaleColor(wall, 0.8) : wall;
              if (row === 0) c = scaleColor(wall, 0.82);
              else if (cx >= 2 && cx < X1 - X0 - 2) {
                const bay2 = (cx - 2) % 9;
                const bi = Math.floor((cx - 2) / 9);
                if (row >= 2 && row <= 6 && bay2 >= 1 && bay2 <= 7) {
                  if (lit[(fl * 11 + bi) % 400]) {
                    if (bay2 !== 4) {
                      glowPx(X, FY0 + j, bi & 1 ? C.warm : C.cool, 0.92);
                      continue;
                    }
                    c = 0x6a6e74;
                  } else c = bay2 === 4 ? 0x6a6e74 : hashPx(bi, fl, x) < 0.2 && row < 4 ? 0xc8c4b8 : row === 2 && bay2 < 4 ? 0x6a7c8c : style === 'shop' ? 0x3a3038 : 0x2e3846;
                }
              }
            }
            if (j < 2) c = scaleColor(wall, 0.55);
            img.px(X, FY0 + j, c);
          }
        }
        if (style === 'shop' || opt.awning) {
          const AY = (fy + faceH - 3) * S;
          for (let X = X0 + 3; X < X1 - 3; X++) {
            for (let j = 0; j < 4; j++) img.px(X, AY + j, (X >> 2) % 2 ? awn : 0xf0ece0);
            for (let j = 4; j < 6; j++) img.px(X, AY + j, scaleColor(awn, 0.7));
            img.px(X, AY + 6, 0x14100e);
          }
          for (let X = X0 + 4; X < X1 - 4; X += 3) if ((X >> 1) % 4) glowPx(X, AY + 7, C.warm, 0.35 + dusk(u) * 0.5);
        }
        opt.front?.(fy);
      },
    });
    reserveRect(x - 1, y - 1, w + 2, h + faceH + 2);
  };
  /** Pack a rectangle (u0..u1) with blocks in columns. */
  const district = (x0, x1, u0, u1, kind = 'town') => {
    const S = {
      office: { w: [14, 26], bh: [30, 52], face: [0.3, 0.45], styles: ['office', 'office', 'glass'], gap: 2 },
      shop: { w: [10, 18], bh: [20, 32], face: [0.28, 0.4], styles: ['shop'], gap: 1 },
      town: { w: [12, 20], bh: [22, 34], face: [0.25, 0.35], styles: ['office', 'shop'], gap: 1 },
    }[kind];
    let x = x0;
    while (x < x1 - 7) {
      const w = Math.min(x1 - x, S.w[0] + Math.floor(rand() * (S.w[1] - S.w[0])));
      const cw = x1 - x - w < 8 ? x1 - x : w;
      let u = u0;
      while (u < u1 - 14) {
        let bh = Math.min(u1 - u, S.bh[0] + Math.floor(rand() * (S.bh[1] - S.bh[0])));
        if (u1 - u - bh < 14) bh = u1 - u;
        const ww = cw - S.gap;
        if (anyRes(x, Y(u + bh), ww, bh)) {
          bh = Math.max(14, Math.floor(bh / 2));
          if (anyRes(x, Y(u + bh), ww, bh)) {
            u += 6;
            continue;
          }
        }
        const face = Math.max(5, Math.round(bh * (S.face[0] + rand() * (S.face[1] - S.face[0]))));
        building(x, Y(u + bh), ww, bh - face, face, { style: rand.pick(S.styles) });
        u += bh + S.gap;
      }
      x += cw;
    }
  };

  // shared little animals and sparkles (one set of frames per stretch of the strip, graded for it)
  const memo = new Map();
  const shared = (key, u, make) => {
    const k = `${key}:${Math.round(u / 800)}`;
    if (!memo.has(k)) memo.set(k, make(Math.round(u / 800) * 800));
    return memo.get(k);
  };
  const glintF0 = (u = 1000) =>
    shared('glint', u, (gu) =>
      [0, 1, 2].map((k) =>
        sprite(3, 3, gu, (r) => {
          if (k === 1) {
            r.set(1, 0, 0xffffff, 0.8);
            r.set(0, 1, 0xffffff, 0.8);
            r.set(2, 1, 0xffffff, 0.8);
            r.set(1, 2, 0xffffff, 0.8);
          }
          r.set(1, 1, 0xffffff, k === 2 ? 0.5 : 0.95);
        }),
      ),
    );
  const duckF0 = (u = 1000) =>
    shared('duck', u, (gu) =>
      [0, 1].map((f) =>
        sprite(4, 3, gu, (r) => {
          r.rect(0, 1, 3, 2, 0x7a6a50);
          r.set(3, 0, 0x2a5a3a);
          r.set(3, 1, 0xe8a040);
          r.set(f ? 0 : 1, 2, 0xd8f0f0, 0.6);
        }),
      ),
    );
  const doveF0 = (u = 1700) =>
    shared('dove', u, (gu) =>
      [0, 1].map((f) =>
        sprite(5, 3, gu, (r) => {
          r.set(2, 1, 0xf4f4f0);
          r.set(1, f ? 0 : 1, 0xe8e8e4);
          r.set(3, f ? 0 : 1, 0xe8e8e4);
          r.set(0, f ? 0 : 2, 0xc8c8cc);
          r.set(4, f ? 0 : 2, 0xc8c8cc);
        }),
      ),
    );

  const deerF0 = (u = 6400) =>
    shared('deer', u, (gu) =>
      [0, 1].map((f) =>
        sprite(7, 6, gu, (r) => {
          // a sika deer in its autumn coat: spotted back, white rump, a slim neck and head, legs in step, its shadow
          for (let i = 2; i < 17; i++) for (let j = 11; j < 14; j++) r.px(i, j + 3, 0x101018, 0.22);
          for (let j = 6; j < 12; j++)
            for (let i = 3; i < 14; i++) {
              if ((i === 3 || i === 13) && (j === 6 || j === 11)) continue;
              r.px(i, j, j === 6 ? 0xd09458 : j > 9 ? 0x9a6030 : 0xb8763c);
            }
          for (const [i, j] of [[5, 7], [8, 8], [11, 7], [6, 9], [10, 9]]) r.px(i, j, 0xf8eed8);
          for (let j = 6; j < 10; j++) for (const i of [2, 3]) r.px(i, j, 0xf8f4ec);
          r.px(1, 6, 0x4a3020);
          for (let j = 2; j < 7; j++) for (let i = 13; i < 15; i++) r.px(i, j, i === 13 ? 0xc88446 : 0xa86a34);
          for (let j = 0; j < 3; j++) for (let i = 14; i < 19; i++) r.px(i, j, j === 0 ? 0xd89a58 : 0xc88446);
          r.px(19, 1, 0x2a1a10);
          r.px(17, 0, 0x1a1008);
          r.px(13, 0, 0xc88446);
          r.px(14, -1, 0xa86a34);
          const fr = f ? 1 : 0;
          for (const [i, st] of [[4, fr], [6, 1 - fr], [11, fr], [13, 1 - fr]])
            for (let j = 12; j < 16 + st; j++) r.px(i, j, j > 14 ? 0x3a2618 : 0x7a4e28);
        }),
      ),
    );
  const wakeF0 = (u = 1500) =>
    shared('wake', u, (gu) => [
      sprite(9, 7, gu, (r) => {
        for (let i = 0; i < 6; i++) {
          r.set(4 - Math.floor(i * 0.6), i, 0xe8faff, 0.75 - i * 0.1);
          r.set(4 + Math.floor(i * 0.6), i, 0xe8faff, 0.75 - i * 0.1);
        }
      }),
    ]);

  /** Gangi: the stone stairs down to the water along Hiroshima's rivers (side = +1: water above, -1: below). */
  const gangi = (x0, x1, uEdge, side) => {
    for (let k = 0; k < 4; k++) {
      const u = uEdge - side * k;
      img.fine(x0, Y(u), x1 - x0, 1, (X, Yy) => {
        const j = Yy - Y(u) * S;
        return j === 0 ? C.stone[3] : j === 2 ? 0x3e3c36 : X % 12 === 0 ? C.stone[0] : k % 2 ? C.stone[1] : C.stone[2];
      });
    }
  };

  // ------------------------------------------------------------ 1. water mask & ground base
  // Miyajima's shore: the pier headland on the west, the pine headland on the east, and between them the wide
  // tidal cove of the Great Torii running in to the shrine's stilts (u = 5330 on the axis)
  /** Grass or moss in fine pixels: blades in flecks, tufts of a darker shade, fallen leaves in the woods. */
  const lawnPx = (X, Yy, n, ramp, leaves = false) => {
    let c = rampColor(ramp, n, X, Yy);
    const t = hashPx(X >> 1, Yy >> 1, 24);
    if (t < 0.13) c = scaleColor(c, 0.85);
    else if (t > 0.9) c = scaleColor(c, 1.14);
    if (leaves) {
      const g = hashPx(X, Yy, 25);
      if (g > 0.992) c = 0xd65a28;
      else if (g > 0.984) c = 0xe0a030;
    }
    return c;
  };

  const miyajimaCoastU = (x, u = 4800) => {
    const wob = fbm(x, 0, { seed: 701, scale: 18 }) * 34;
    const base = 4510 + wob;
    // the sides of the cove wander in and out: little bays, sand spits, rocks
    const jig = (fbm(u, 7, { seed: 703, scale: 46, octaves: 3 }) - 0.5) * 22;
    const k = Math.abs(x + (x < 90 ? jig : -jig) - 90) / 56;
    if (k < 1) return Math.max(base, 4520 + (COVE_END_U - 4520) * Math.sqrt(1 - k * k) ** 0.8 + fbm(x, 1, { seed: 702, scale: 9 }) * 12);
    return base;
  };

  const isWater = (x, u) => {
    // the two branches of the Ōta delta, edge to edge
    if ((u >= MOTOYASU[0] && u < MOTOYASU[1]) || (u >= HONKAWA[0] && u < HONKAWA[1])) return true;
    // Hiroshima Bay between the mainland seawall and Miyajima
    if (u >= QUAY_U && u < miyajimaCoastU(x, u)) {
      if (u < 3010 && ((x >= 72 && x <= 82) || (x >= 98 && x <= 108))) return false; // Miyajimaguchi ferry piers (JR, Matsudai)
      if (u >= 4400 && u < 4545 && x >= 14 && x <= 46) return false; // Miyajima ferry pier
      for (const isl of bayIslets) {
        const n = fbm(x, L - u, { seed: 709, scale: 6 }) * 3.5;
        if (Math.hypot(x - isl.x, u - isl.u) < 14.5 + n) return false;
      }
      for (const [ix, iu, r] of [[160, 3420, 13], [18, 3650, 12], [22, 3990, 10], [150, 4080, 11], [152, 4345, 9]]) {
        const n = fbm(x, L - u, { seed: 711, scale: 6 }) * 4;
        if (Math.hypot(x - ix, (u - iu) * 0.8) < r + n) return false;
      }
      return true;
    }
    // Momijidani's mountain stream, edge to edge
    if (u >= STREAM[0] - 10 && u < STREAM[1] + 10) {
      const bend = Math.sin(x / 24) * 8;
      if (u >= STREAM[0] + bend && u < STREAM[1] + bend) return true;
    }
    // the Seto Sea far below the summit cliffs
    if (u > 6720 && (x < 10 - fbm(x, L - u, { seed: 712, scale: 12 }) * 6 || x > W - 11 + fbm(x, L - u, { seed: 713, scale: 12 }) * 6))
      return true;
    return false;
  };

  // the water, cell by cell, and fine along the shores
  const fineWater = new Uint8Array(FW * FH);
  for (let y = 0; y < L; y++) {
    const u = U(y);
    for (let x = 0; x < W; x++) if (isWater(x + 0.5, u - 0.5)) water[y * W + x] = 1;
  }
  const W_ = (x, y) => x >= 0 && x < W && y >= 0 && y < L && water[y * W + x];
  for (let y = 0; y < L; y++)
    for (let x = 0; x < W; x++) {
      const v = water[y * W + x];
      let same = true;
      for (let dy = -1; dy <= 1 && same; dy++) for (let dx = -1; dx <= 1; dx++) if (x + dx >= 0 && x + dx < W && y + dy >= 0 && y + dy < L && water[(y + dy) * W + x + dx] !== v) same = false;
      for (let j = 0; j < S; j++)
        for (let i = 0; i < S; i++) {
          const X = x * S + i;
          const Yy = y * S + j;
          fineWater[Yy * FW + X] = same ? v : isWater((X + 0.5) / S, L - (Yy + 0.5) / S) ? 1 : 0;
        }
    }
  // how far each fine pixel is from the shore (either way)
  const shoreD = new Uint8Array(FW * FH).fill(255);
  {
    const R = 22;
    for (let Yy = 1; Yy < FH - 1; Yy++)
      for (let X = 1; X < FW - 1; X++) {
        const i = Yy * FW + X;
        if (fineWater[i] === fineWater[i + 1] && fineWater[i] === fineWater[i + FW]) continue;
        for (let j = -R; j <= R; j++) {
          const yy = Yy + j;
          if (yy < 0 || yy >= FH) continue;
          for (let k = -R; k <= R; k++) {
            const xx = X + k;
            if (xx < 0 || xx >= FW) continue;
            const d = Math.round(Math.hypot(k, j));
            if (d < shoreD[yy * FW + xx]) shoreD[yy * FW + xx] = d;
          }
        }
      }
  }
  const nRow = new Float32Array(W);
  for (let Yy = 0; Yy < FH; Yy++) {
    const y = (Yy + 0.5) / S;
    const u = L - y;
    if (Yy % S === 0) for (let x = 0; x < W; x++) nRow[x] = 0.25 + fbm(x, Math.floor(y), { seed: 17, scale: 7, octaves: 2 }) * 0.65;
    for (let X = 0; X < FW; X++) {
      const x = (X + 0.5) / S;
      const i = Yy * FW + X;
      const d = shoreD[i];
      const g = hashPx(X, Yy, 18);
      if (fineWater[i]) {
        // (the water itself is the far layer, seen through this one)
        if (u >= QUAY_U - 2 && u <= COVE_END_U + 10) {
          if (d < 3) img.px(X, Yy, 0xe6f6f6, 0.9 - d * 0.14);
          else if (d < 8) img.px(X, Yy, 0x4ca8b4, 0.5 - d * 0.04);
          // the tidal flats of the cove: wet sand showing through near the shore
          if (d < 22 && u >= MIYAJIMA_U && u < COVE_END_U + 4 && x >= 30 && x < 150 && fbm(x, y, { seed: 733, scale: 4 }) > 0.33 + d * 0.016) img.px(X, Yy, 0x9a9278, 0.34 - d * 0.012);
        } else if (u < QUAY_U && d < 12) {
          // the rivers: a darker band under each bank, the bank's reflection
          img.px(X, Yy, fineWater[Math.max(0, Yy - 12) * FW + X] ? 0x5a8a8a : 0x0e2a30, (0.45 - d * 0.03));
        }
        continue;
      }
      const n = nRow[Math.floor(x)];
      let c;
      if (u < QUAY_U) {
        // the city's paving, patched and stained
        const t = hashPx(X >> 3, Yy >> 3, 19);
        c = rampColor(C.walk, n * 0.7 + t * 0.2, X, Yy);
        if (X % 15 === 0 || Yy % 15 === 0) c = scaleColor(c, 0.92);
        if (g < 0.05) c = scaleColor(c, 0.92);
      } else if (u < MIYAJIMA_U) {
        const t = hashPx(X >> 1, Yy >> 1, 20);
        c = rampColor(C.granite, n * 0.8 + (t - 0.5) * 0.2, X, Yy);
        if (t < 0.1) c = scaleColor(c, 0.86);
        else if (t > 0.92) c = 0xd8d8d0;
      } else if (u < 5900) {
        if (u < 5000 && x > 30 && x < 150) {
          c = rampColor(C.sand, n, X, Yy);
          if (g < 0.1) c = scaleColor(c, 0.9);
          else if (g > 0.94) c = 0xe8dcc0;
        } else c = lawnPx(X, Yy, n, C.grass);
      } else if (u < 6560) c = lawnPx(X, Yy, n, C.moss, true);
      else {
        const rock = fbm(x, y, { seed: 719, scale: 26, octaves: 2 });
        if (rock > 0.6) {
          c = rampColor(C.granite, 0.3 + (rock - 0.6) * 1.5 + n * 0.3, X, Yy);
          if (g < 0.1) c = scaleColor(c, 0.84);
          else if (g > 0.93) c = scaleColor(c, 1.1);
          // the cracks in the granite
          if (Math.abs(fbm(x, y, { seed: 720, scale: 5 }) - 0.5) < 0.012) c = scaleColor(c, 0.66);
        } else c = lawnPx(X, Yy, n, C.moss, true);
      }
      // the shore: stone embankment on the rivers and the bay, wet sand in the cove
      if (d <= 4) {
        if (u >= MIYAJIMA_U - 10 && u <= COVE_END_U + 10 && x >= 30 && x <= 150) c = C.wetSand[Math.floor(g * 3)];
        else if (fineWater[Math.min(FH - 1, Yy + 5) * FW + X]) {
          // a wall facing us, down to the water: courses of dressed stone, dark at its foot
          const XX = X + ((Yy >> 2) % 2) * 5;
          c = Yy % 4 === 0 || XX % 10 === 0 ? 0x4e4a44 : scaleColor(C.stone[Math.floor(hashPx(XX >> 3, Yy >> 2, 21) * 2) + 1], 1.02 - d * 0);
        } else c = d < 2 ? C.stone[0] : X % 9 === 0 ? C.stone[1] : C.stone[3];
      }
      img.px(X, Yy, c);
    }
  }

  // ------------------------------------------------------------ 2. roads, tramways & bridges (traffic keeps left)
  // West boulevard (cx = 34, hw = 10): car lanes and the double Hiroden track, u = 714..2705
  // East avenue    (cx = 148, hw = 6): two-way, u = 714..2705. Both start at Aioi-dōri (u = 720) north of the castle.
  const WEST_CX = 34;
  const WEST_HW = 10;
  const EAST_CX = 148;
  const EAST_HW = 6;
  const AVE_U0 = STREET_720 - 6;
  const RAILS = [30, 33, 35, 38];

  const tramRoadPx = (x, y, overWater = false) => {
    if (W_(x, y) && !overWater) return;
    img.fine(x, y, 1, 1, (X, Yy) => {
      const fx = (X + 0.5) / S;
      const a = Math.abs(fx - WEST_CX);
      const g = hashPx(X, Yy, 37);
      if (a > WEST_HW + 0.5) return pavePx(X, Yy);
      if (a > WEST_HW - 0.2) return a > WEST_HW + 0.1 ? 0xa8a8a8 : 0x6e6e72;
      if (a <= 4.6) {
        // the stone-set tram bed: its four rails in their grooves, a green strip of sedum between the tracks
        let c = rampColor(C.tramBed, hashPx(X >> 3, Yy >> 2, 35), X, Yy);
        if (Yy % 4 === 0 || (X + ((Yy >> 2) % 2) * 3) % 6 === 0) c = scaleColor(c, 0.82);
        if (x === 34) return g < 0.5 ? 0x4e7a3e : g < 0.85 ? 0x3e6a34 : 0x5e8a48;
        if (RAILS.includes(x)) {
          const i = X - x * S;
          return i === 1 ? 0xd8e0e8 : i === 0 ? 0x4a4a4e : 0x8a8e94;
        }
        return c;
      }
      let c = rampColor(C.asphalt, 0.2 + hashPx(X >> 3, Yy >> 3, 31) * 0.5, X, Yy);
      if (g < 0.08) c = scaleColor(c, 0.9);
      else if (g > 0.96) c = scaleColor(c, 1.14);
      return c;
    });
  };
  /** Paving flags beside a street. */
  const pavePx = (X, Yy) => {
    if (X % 6 === 0 || Yy % 6 === 0) return scaleColor(C.paving[0], 0.84);
    let c = rampColor(C.paving, 0.2 + hashPx(X >> 2, Yy >> 2, 34) * 0.7, X, Yy);
    if (hashPx(X >> 3, Yy >> 3, 32) < 0.05) c = scaleColor(c, 0.9);
    return c;
  };
  const asphaltPx = (X, Yy) => {
    const g = hashPx(X, Yy, 38);
    const c = rampColor(C.asphalt, 0.2 + hashPx(X >> 3, Yy >> 3, 31) * 0.5, X, Yy);
    return g < 0.08 ? scaleColor(c, 0.9) : g > 0.96 ? scaleColor(c, 1.14) : c;
  };
  /** One logical cell of a street; across is measured along x, or along u when horiz. */
  const roadPx = (x, y, across, hw, lanes = true, overWater = false, horiz = false) => {
    if (W_(x, y) && !overWater) return;
    const cross = horiz ? L - y + 0.5 - across : x + 0.5 - across; // (the street's middle)
    img.fine(x, y, 1, 1, (X, Yy) => {
      const a = Math.abs(horiz ? L - (Yy + 0.5) / S - cross : (X + 0.5) / S - cross);
      if (a > hw + 0.5) return pavePx(X, Yy);
      if (a > hw - 0.2) return a > hw + 0.1 ? 0xa8a8a8 : 0x6e6e72;
      if (lanes && hw >= 4 && a < 0.3 && Math.floor((horiz ? X : Yy) / 15) % 2) return 0xdad6c8;
      let c = asphaltPx(X, Yy);
      if (Math.abs(Math.abs(a - hw / 2) - hw / 4) < 0.35) c = scaleColor(c, 1.07); // (the wheels' tracks)
      if (a > hw - 0.7 && hashPx(X, Yy >> 1, 39) < 0.7) c = scaleColor(c, 0.82);
      return c;
    });
  };

  /** A cell of a zebra crossing: painted in stripes along the street, the paint worn. */
  const zebraCell = (x, y) =>
    img.fine(x, y, 1, 1, (X, Yy) => (X % 7 < 4 && hashPx(X, Yy, 40) > 0.1 ? 0xdcdcd4 : null));
  // East-west streets first, edge to edge
  const CROSS_STREETS = [
    [145, 5], // Jōnan-dōri, along the castle's south moat
    [STREET_720, 6], // Aioi-dōri (with the tram tracks coming in from the east)
    [1238, 4],
    [HEIWA, 11], // Heiwa Ōdōri: lanes both ways about a green median, tree belts on both sides
    [2460, 4],
    [2700, 5], // Route 2 along the coast at Miyajimaguchi
  ];
  for (const [uc, hw] of CROSS_STREETS) {
    for (let u = Math.floor(uc - hw - 2); u <= uc + hw + 1; u++)
      for (let x = 0; x < W; x++) roadPx(x, Y(u), u + 0.5 - uc, hw, hw < 11, false, true);
    reserveRect(0, Y(uc + hw + 3), W, hw * 2 + 6);
  }
  // Heiwa Ōdōri's green median with its lane lines
  for (let x = 0; x < W; x++) {
    for (let u = HEIWA - 1; u <= HEIWA + 1; u++) img.set(x, Y(u), rampColor(C.lawn, 0.4 + fbm(x, u, { seed: 41, scale: 3 }) * 0.4, x, Y(u)));
    img.set(x, Y(HEIWA - 2), 0x9a9a9e);
    img.set(x, Y(HEIWA + 2), 0x9a9a9e);
    if (Math.floor(x / 3) % 2 === 0) {
      img.set(x, Y(HEIWA - 6), 0xdad6c8);
      img.set(x, Y(HEIWA + 6), 0xdad6c8);
    }
  }

  // North-south avenues, u = 714..2705 (merging into Route 2 at u = 2700)
  for (let u = AVE_U0; u <= 2705; u++) {
    const y = Y(u);
    for (let x = WEST_CX - WEST_HW - 2; x <= WEST_CX + WEST_HW + 1; x++) tramRoadPx(x, y, false);
    for (let x = EAST_CX - EAST_HW - 2; x <= EAST_CX + EAST_HW + 1; x++) roadPx(x, y, x + 0.5 - EAST_CX, EAST_HW, true, false);
  }
  reserveRect(WEST_CX - WEST_HW - 3, Y(2845), WEST_HW * 2 + 6, 2845 - AVE_U0 + 4);
  reserveRect(EAST_CX - EAST_HW - 3, Y(2706), EAST_HW * 2 + 6, 2706 - AVE_U0 + 4);

  // intersections: clean asphalt boxes, the rails running straight through, zebra crossings outside
  for (const [uc, hw] of CROSS_STREETS) {
    if (uc < AVE_U0) continue;
    for (let u = uc - hw; u <= uc + hw; u++) {
      const y = Y(u);
      img.fine(WEST_CX - WEST_HW - 2, y, WEST_HW * 2 + 4, 1, (X, Yy) => {
        const x = Math.floor(X / S);
        if (RAILS.includes(x) && u > uc - hw + (uc === STREET_720 ? 4 : 0)) {
          const i = X - x * S;
          return i === 1 ? 0xd8e0e8 : i === 0 ? 0x4a4a4e : 0x8a8e94;
        }
        return asphaltPx(X, Yy);
      });
      if (u < 2700 + hw) img.fine(EAST_CX - EAST_HW - 2, y, EAST_HW * 2 + 4, 1, asphaltPx);
    }
    for (const [cx, chw] of [[WEST_CX, WEST_HW], [EAST_CX, EAST_HW]]) {
      for (const s of [-1, 1]) {
        if (uc === 2700 && s === 1 && cx === EAST_CX) continue;
        if (uc === STREET_720 && s === -1) continue; // nothing south of Aioi-dōri: the castle moat
        const u0 = uc + s * (hw + 3);
        for (let k = 0; k < 3; k++)
          for (let x = cx - chw + 1; x <= cx + chw - 1; x++)
            if (!(cx === WEST_CX && RAILS.includes(x))) zebraCell(x, Y(u0 + s * k));
      }
    }
  }
  // the Hiroden tracks along Aioi-dōri from the east edge, curving north onto the boulevard
  const T720 = [STREET_720 - 2.5, STREET_720 + 2.5]; // westbound / eastbound track centres
  const railArc = (cx, cu, r, a0, a1) => {
    for (let a = a0; a <= a1; a += 0.004) {
      const X = (cx + Math.sin(a) * r) * S;
      const Yy = (L - cu + Math.cos(a) * r) * S;
      img.px(X, Yy, 0xd8e0e8);
      img.px(X + 1, Yy, 0x8a8e94);
      img.px(X - 1, Yy, 0x4a4a4e);
    }
  };
  for (let X = 0; X < 26 * S; X++)
    for (const tc of T720)
      for (const off of [-1.5, 1.5]) {
        const Yy = Math.round((L - tc - off) * S);
        img.px(X, Yy, 0xd8e0e8);
        img.px(X, Yy + 1, 0x8a8e94);
        img.px(X, Yy - 1, 0x4a4a4e);
      }
  // (the straight boulevard rails stop where the curves take over)
  for (let u = AVE_U0; u < STREET_720 + 10; u++)
    for (const x of RAILS) {
      const y = Y(u);
      img.fine(x, y, 1, 1, (X, Yy) => (u <= STREET_720 + 6 ? asphaltPx(X, Yy) : rampColor(C.tramBed, hashPx(X >> 3, Yy >> 2, 35), X, Yy)));
    }
  // north-bound: from the eastbound track (u = 722.5) round to x = 31.5; south-bound: x = 36.5 round to u = 717.5
  const ARC_C = [24, STREET_720 + 10];
  for (const dr of [-1.5, 1.5]) {
    railArc(ARC_C[0], ARC_C[1], 7.5 + dr, 0, Math.PI / 2);
    railArc(ARC_C[0], ARC_C[1], 12.5 + dr, 0, Math.PI / 2);
  }
  const arcPts = (r, rev) => {
    const out = [];
    for (let k = 0; k <= 4; k++) {
      const a = ((rev ? 4 - k : k) / 4) * (Math.PI / 2);
      out.push([ARC_C[0] + Math.sin(a) * r, ARC_C[1] - Math.cos(a) * r]);
    }
    return out;
  };

  // the Hiroden track on into the Miyajimaguchi terminus (u = 2700..2820), buffer stops at the end
  /** The tram bed over a stretch: stone setts, the rails in their grooves. */
  const tramBedFill = (u0, u1) =>
    img.fine(28, Y(u1), 13, u1 - u0, (X, Yy) => {
      const x = Math.floor(X / S);
      if (RAILS.includes(x)) {
        const i = X - x * S;
        return i === 1 ? 0xd8e0e8 : i === 0 ? 0x4a4a4e : 0x8a8e94;
      }
      if (x === 34) {
        const g = hashPx(X, Yy, 37);
        return g < 0.5 ? 0x4e7a3e : g < 0.85 ? 0x3e6a34 : 0x5e8a48;
      }
      let c = rampColor(C.tramBed, hashPx(X >> 3, Yy >> 2, 35), X, Yy);
      if (Yy % 4 === 0 || (X + ((Yy >> 2) % 2) * 3) % 6 === 0) c = scaleColor(c, 0.82);
      return c;
    });
  tramBedFill(2700, 2821);
  // the buffer stops at the end, striped
  img.fine(29, Y(2822), 11, 1, (X) => ((X >> 2) % 2 ? 0xd83224 : 0xf0e8d8));

  // bridges carrying the boulevard and the avenue over both rivers (live decks: boats and lanterns pass under)
  const makeBridge = (cx, hw, r0, r1, withTram, rail = C.stone) => {
    const u0 = r0 - 4;
    const u1 = r1 + 4;
    const x0 = cx - hw - 3;
    const x1 = cx + hw + 2;
    const deck = () => {
      for (let u = u0; u <= u1; u++) {
        const y = Y(u);
        for (let x = x0; x <= x1; x++) {
          if (x === x0 || x === x1) img.fine(x, y, 1, 1, (X, Yy) => (Yy % 12 < 2 ? rail[0] : X - x * S === 1 ? rail[3] : X - x * S === 0 ? rail[1] : rail[2]));
          else if (x === x0 + 1 || x === x1 - 1) img.fine(x, y, 1, 1, pavePx);
          else if (withTram) tramRoadPx(x, y, true);
          else roadPx(x, y, x + 0.5 - cx, hw, true, true);
        }
        if (u % 16 === 0) {
          for (const px of [x0, x1]) {
            for (let j = -8; j < 3; j++) img.px(px * S + 1, y * S + j, 0x3a3e46);
            glowPx(px * S + 1, y * S - 9, 0xfff0c8, 0.95);
            glowPx(px * S + 2, y * S - 9, 0xfff0c8, 0.8);
          }
        }
      }
    };
    kit.loop(x0, u1, [capture(x0, Y(u1), x1 - x0 + 1, u1 - u0 + 1, deck)], { d: 0.04 });
    objects.push({
      y: Y(u0),
      shadow: () => {
        shadowRect(x1 + 1, Y(u1), 3, u1 - u0, 0.55);
        // the deck's shadow on the water
        for (let u = r0; u < r1; u++) for (let x = x0 + 2; x <= x1 + 3; x++) if (W_(x, Y(u))) img.set(x, Y(u), 0x081418, 0.35);
      },
      draw: () => {

        deck();
      },
    });
  };
  for (const riv of [MOTOYASU, HONKAWA]) {
    makeBridge(WEST_CX, WEST_HW, riv[0], riv[1], true, riv === MOTOYASU ? C.concrete : C.stone); // (the Aioi-bashi first)
    makeBridge(EAST_CX, EAST_HW, riv[0], riv[1], false);
  }

  // ------------------------------------------------------------ 3. Hiroshima Castle (Rijō), u = 152..708
  {
    const MOAT = [175, 700];
    const NINO = { x0: 52, x1: 128, face: 200, top: 208, back: 252 }; // the Ninomaru, out in front
    const HON = { x0: 16, x1: 164, face: 268, top: 280, back: 690 }; // the Honmaru
    const JODAN = { face: 520, top: 530 }; // the raised upper Honmaru with the keep

    // the moat, painted: still green water, the walls mirrored darker under their faces, lotus beds along the
    // outer banks going brown with the autumn, a few seed heads
    img.fine(0, Y(MOAT[1]), W, MOAT[1] - MOAT[0], (X, Yy, x, y) => {
      const u = L - y;
      const fb = fbm(x, u * 2, { seed: 24, scale: 9, octaves: 2 });
      let c = rampColor(C.moat, 0.25 + fb * 0.55, X, Yy);
      const r = Math.sin(y * 2.6 + fb * 9);
      if (r > 0.97) c = scaleColor(c, 1.2);
      else if (r < -0.96) c = scaleColor(c, 0.9);
      return c;
    });
    // the lotus beds, one leaf at a time: round, a notch, veined from the middle, lit at the top left, some gone brown and
    // curling at the edge, stems of seed heads standing up among them
    {
      const lr = rng(141);
      const nearOuter = (x, u) => Math.min(u - MOAT[0], MOAT[1] - u, x, W - 1 - x);
      const leaves = [];
      for (let k = 0; k < 9000 && leaves.length < 2600; k++) {
        const x = lr() * W;
        const u = MOAT[0] + lr() * (MOAT[1] - MOAT[0]);
        const bed = fbm(x, u, { seed: 27, scale: 16, octaves: 2 }) - nearOuter(x, u) * 0.006;
        if (bed > 0.5 + lr() * 0.06) leaves.push([x, u, 1.4 + lr() * 1.3, lr()]);
      }
      leaves.sort((a, b) => b[1] - a[1]);
      for (const [x, u, r0, v] of leaves) {
        const CX = x * S;
        const CY = (L - u) * S;
        const R = r0 * S;
        const brown = v < 0.2;
        const notch = v * 6.28;
        for (let Yy = Math.floor(CY - R - 1); Yy <= CY + R + 2; Yy++)
          for (let X = Math.floor(CX - R - 1); X <= CX + R + 2; X++) {
            const dx = X + 0.5 - CX;
            const dy = Yy + 0.5 - CY;
            const d = Math.hypot(dx, dy);
            if (d > R) {
              if (d < R + 2 && dx + dy > 0) img.tintPx(X, Yy, 0.78);
              continue;
            }
            const a = Math.atan2(dy, dx);
            if (Math.abs(((a - notch + 9.42) % 6.28) - 3.14) < 0.16 && d > 1.5) continue;
            const l = (dx + dy) / R;
            let c = brown ? (l < -0.3 ? 0xa8843c : l < 0.4 ? 0x866430 : 0x5e4620) : l < -0.45 ? C.lotus[3] : l < 0.25 ? C.lotus[2] : C.lotus[1];
            if (Math.sin(a * 9) > 0.92) c = scaleColor(c, 1.12);
            if (d > R - 1) c = brown ? 0x4e3a1a : scaleColor(c, 0.82);
            if (d < 1) c = brown ? 0x5a4020 : C.lotus[0];
            img.px(X, Yy, c);
          }
        if (v > 0.94) {
          for (let j = 0; j < 6; j++) img.px(CX + 3, CY - j, 0x3e3420);
          img.discPx(CX + 3.5, CY - 7, 1.6, 0x6a5228);
          img.px(CX + 3, CY - 8, 0x8a7038);
        }
      }
    }
    setWet(0, W, MOAT[0], MOAT[1]);
    // the outer banks: a low stone edge, the promenades under autumn cherries and willows
    flagFill(0, Y(MOAT[0] - 2), W, MOAT[0] - 2 - CASTLE[0], C.paving, 141);
    flagFill(0, Y(712), W, 712 - MOAT[1] - 2, C.paving, 142);
    for (const [u, c0, c1] of [[MOAT[0] - 1, C.stone[1], C.stone[3]], [MOAT[1] + 1, C.stone[3], C.stone[1]]])
      img.fine(0, Y(u), W, 2, (X, Yy) => {
        const j = Yy - Y(u) * S;
        const XX = X + ((j >> 1) % 2) * 5;
        return XX % 10 === 0 ? C.stone[0] : j < 3 ? c1 : c0;
      });
    for (let x = 6; x < W; x += 22) {
      if (x > 56 && x < 78) continue;
      tree(x, Y(166), 5, x % 44 ? C.sakuraAut : C.willow, 1400 + x);
      if (x % 44 === 6) streetLamp(x + 11, 158);
    }
    for (let x = 10; x < W; x += 26) tree(x, Y(704), 4.5, x % 52 ? C.sakuraAut : C.ginkgo, 1500 + x);
    for (let k = 0; k < 6; k++) bench(16 + k * 30, Y(156), 5);
    district(0, W, 2, 137, 'town');

    /** An island of the castle: its top in gravel and lawn, its stone face towards the viewer. */
    const island = (x0, x1, uFace, uTop, uBack, seed) => {
      lawnFill(x0, Y(uBack), x1 - x0, uBack - uTop, C.lawn, seed);
      // the side edges catch the light on the left, fall into shade on the right
      img.fine(x0, Y(uBack), 1, uBack - uFace, (X, Yy) => (Yy % 9 === 0 ? C.ishi[1] : C.ishi[4]));
      img.fine(x1 - 1, Y(uBack), 1, uBack - uFace, (X, Yy) => (Yy % 9 === 0 ? 0x2a2824 : C.ishi[0]));
      stoneFace(x0, x1, Y(uTop), uTop - uFace, seed);
      // the face mirrored in the moat below it
      for (let j = 0; j < 14; j++) for (let X = x0 * S; X < x1 * S; X++) img.tintPx(X, Y(uFace) * S + 3 + j, 0.62 + j * 0.026);
      setWet(x0, x1, uFace, uBack, 0);
    };
    island(HON.x0, HON.x1, HON.face, HON.top, HON.back, 151);
    island(NINO.x0, NINO.x1, NINO.face, NINO.top, NINO.back, 152);
    // the Honmaru's raised upper terrace, with a stone stair up its face
    lawnFill(HON.x0 + 1, Y(HON.back), HON.x1 - HON.x0 - 2, HON.back - JODAN.top, C.lawn, 153);
    stoneFace(HON.x0 + 1, HON.x1 - 1, Y(JODAN.top), JODAN.top - JODAN.face, 154);
    stairs(104, Y(JODAN.top) - 1, 9, JODAN.top - JODAN.face + 2);

    // the Omote-gomon bridge: a wooden bridge on posts across the moat to the main gate
    {
      const bx0 = 61;
      const bx1 = 72;
      const YT = Y(NINO.face + 1) * S;
      const YB = Y(MOAT[0] - 2) * S;
      for (let Yy = YT; Yy < YB + 5; Yy++) for (let X = bx1 * S; X < bx1 * S + 7; X++) if (Yy > YT + 3) img.tintPx(X, Yy, 0.68);
      for (let Yy = YT; Yy < YB; Yy++)
        for (let X = bx0 * S; X < bx1 * S; X++) {
          const e = Math.min(X - bx0 * S, bx1 * S - 1 - X);
          // planks across it, nailed, worn pale down the middle; the rails with their bronze caps
          let c;
          if (e < 3) c = Yy % 15 < 3 ? 0xa88a4a : e === 0 ? C.wood[2] : e === 2 ? C.wood[0] : C.wood[1];
          else {
            c = Yy % 4 === 0 ? C.wood[0] : hashPx(X >> 4, Yy >> 2, 143) < 0.5 ? C.hinoki[1] : C.hinoki[2];
            if (Yy % 4 && hashPx(X, Yy, 144) < 0.06) c = scaleColor(c, 0.88);
            if (Math.abs(X - (bx0 + bx1) * 1.5) < 9 && Yy % 4) c = scaleColor(c, 1.08);
          }
          img.px(X, Yy, c);
        }
      for (let Yy = YT + 12; Yy < YB; Yy += 18) for (const X of [bx0 * S + 4, bx1 * S - 5]) for (let j = 0; j < 8; j++) img.px(X, YB + 0 + j - (YB - Yy) + 6, 0x0e1e1c, 0.3);
    }
    // the Ninomaru: a gravel court, pines, the Chūgomon ruins at the back, the earthen bridge over the inner moat
    gravelPath(86, 97, NINO.top, NINO.back);
    gravelPath(86, 97, NINO.back, HON.top + 1);
    for (const sx of [80, 97]) {
      stoneFace(sx, sx + 6, Y(NINO.back + 2), 8, sx);
    }
    for (const [tx, tu] of [[60, 236], [118, 238], [74, 246]]) tree(tx, Y(tu), 4.5, C.pine, tx * 7 + tu, 'pine');

    // ---- the Ninomaru's south front, reconstructed in wood in 1994: Omote-gomon, Hira-yagura, Tamon-yagura,
    // Taiko-yagura, all white plaster over black boards on the stone wall
    const wallTop = Y(NINO.top);
    /** A castle turret: floors from the bottom up ({ w, fh, rh, gable }), centred at cx, standing at yBase. */
    const turret = (cx, yBase, tiers, opt = {}) => {
      const floors = [];
      let y = yBase;
      for (const t of tiers) {
        const fy = y - t.fh;
        floors.push({ ...t, fy, x: Math.round(cx - t.w / 2) });
        y = fy - t.rh + 3;
      }
      objects.push({
        y: yBase + (opt.sortBias ?? 0),
        shadow: () => {
          for (const f of floors) shadowRect(f.x + 4, f.fy - f.rh + 4, f.w + 2, f.fh + f.rh, 0.55);
        },
        draw: () => {
          for (let i = floors.length - 1; i >= 0; i--) {
            const f = floors[i];
            facade(f.x, f.fy, f.w, f.fh, 'castle');
            if (f.balcony) for (let xx = f.x - 1; xx <= f.x + f.w; xx++) {
              img.set(xx, f.fy + f.fh - 2, (xx & 1) ? C.board[0] : C.board[2]);
              img.set(xx, f.fy + f.fh - 1, C.board[0]);
            }
            roof(f.x - 2, f.fy - f.rh, f.w + 4, f.rh, C.kawara, { noshi: i === floors.length - 1, gable: f.gable, gw: f.gw, crestC: C.gold });
            if (i === floors.length - 1) {
              // shachihoko on the ridge ends
              const ry = f.fy - f.rh + Math.max(1, Math.round(f.rh * 0.32));
              img.set(f.x + 2, ry - 1, 0x4a4430);
              img.set(f.x + f.w + 1, ry - 1, 0x4a4430);
              img.set(f.x + 2, ry - 2, C.gold);
              img.set(f.x + f.w + 1, ry - 2, C.gold);
            }
          }
          opt.extra?.();
        },
      });
    };
    // Omote-gomon: a two-storey gate tower over the passage, its iron-studded doors open at the foot of the wall
    {
      const gx0 = 59;
      const gx1 = 74;
      objects.push({
        y: Y(NINO.face) + 1,
        draw: () => {
          const X0 = (gx0 + 1) * S;
          const X1 = (gx1 - 1) * S;
          const Y0 = wallTop * S;
          const Y1 = Y(NINO.face) * S;
          for (let Yy = Y0; Yy < Y1; Yy++)
            for (let X = X0; X < X1; X++) {
              const lx = X - X0;
              const rx = X1 - 1 - X;
              let c = mix(0x0e0a08, 0x241a14, (Yy - Y0) / (Y1 - Y0));
              // the iron-studded doors folded back to either side
              if (lx >= 2 && lx < 8) c = (lx % 3 === 2 ? C.wood[0] : C.wood[1]);
              else if (rx >= 2 && rx < 8) c = (rx % 3 === 2 ? C.wood[0] : C.wood[1]);
              if ((lx >= 2 && lx < 8 || rx >= 2 && rx < 8) && (Yy - Y0) % 6 === 2 && (lx % 3 === 1 || rx % 3 === 1)) c = 0x8a8a90;
              if (Yy < Y0 + 3) c = C.board[0];
              img.px(X, Yy, c);
            }
        },
      });
      turret(66.5, wallTop + 1, [{ w: 19, fh: 8, rh: 7, gable: 'tri', gw: 7 }]);
    }
    turret(86, wallTop, [{ w: 12, fh: 7, rh: 6 }]); // Hira-yagura
    turret(102, wallTop, [{ w: 22, fh: 6, rh: 5 }], { sortBias: -1 }); // Tamon-yagura, the long storehouse
    turret(119, wallTop, [{ w: 15, fh: 7, rh: 6 }, { w: 10, fh: 6, rh: 7, gable: 'tri', gw: 6, balcony: true }]); // Taiko-yagura
    // the plaster wall along the rest of the Ninomaru's edge
    img.fine(NINO.x0, wallTop - 2, 57 - NINO.x0, 2, (X, Yy) => {
      const j = Yy - (wallTop - 2) * S;
      return j === 0 ? C.kawara[4] : j < 3 ? (X % 3 === 0 ? C.kawara[3] : C.kawara[2]) : j === 3 ? C.kawara[0] : X % 15 === 0 ? C.plaster[0] : C.plaster[1];
    });

    // ---- the Honmaru (lower): the Gokoku Shrine on the approach from the Chūgomon
    gravelPath(86, 97, HON.top, 352);
    for (const [lx, lu] of [[83, 300], [100, 300], [83, 324], [100, 324]]) stoneLantern(lx, lu, false);
    // the great torii (bronze-dark) over the approach
    objects.push({
      y: Y(312) + 1,
      shadow: () => shadowRect(81, Y(312) - 2, 24, 4, 0.6),
      draw: () => {
        const ty = Y(312);
        const X = 91 * S;
        const Yy = ty * S;
        // bronze-dark, the wedge and tablet between its beams
        for (const dx of [-29, 28])
          for (let j = -31; j < 3; j++) for (let i = 0; i < 5; i++) img.px(X + dx + i, Yy + j, i === 0 ? 0x6e6054 : i === 4 ? 0x2a2420 : 0x4a4038);
        for (let i = -36; i <= 36; i++) for (let j = 0; j < 3; j++) img.px(X + i, Yy - 24 + j, j === 0 ? 0x5e5248 : 0x3a322c);
        for (let i = -40; i <= 40; i++) {
          const lift = Math.round((i * i) / 400);
          for (let j = 0; j < 6; j++) img.px(X + i, Yy - 37 - lift + j, j < 2 ? 0x2a2420 : j < 4 ? 0x5a4e44 : 0x3a322c);
        }
        for (let j = -31; j < -24; j++) for (let i = -3; i <= 3; i++) img.px(X + i, Yy + j, 0x2a2420);
      },
    });
    // haiden and honden: copper roofs gone green, white walls, the offering box and a sacred rope
    hall(72, Y(390), 39, 13, 6, C.copper, 'shrine', { gable: 'kara', gw: 13, noshi: true, bay: 6 });
    hall(78, Y(420), 27, 12, 4, C.copper, 'shrine', { gable: 'tri', gw: 9, bay: 5, sortBias: -2 });
    objects.push({
      y: Y(370) + 1,
      draw: () => {
        // the offering box, the sacred rope with its paper streamers
        img.fine(88, Y(372), 7, 3, (X, Yy) => (Yy - Y(372) * S < 2 ? 0x8a6a40 : X % 3 === 0 ? 0x2a1c12 : C.wood[1]));
        for (let X = 80 * S; X < 104 * S; X++) {
          const sag = Math.sin(((X - 80 * S) / (24 * S)) * Math.PI) * 3;
          for (let j = 0; j < 3; j++) img.px(X, Y(377) * S + sag + j, (X + j * 2) % 5 < 2 ? 0xa89468 : 0xe8dcb0);
        }
        for (const x of [84, 92, 100]) for (let j = 4; j < 11; j++) img.px(x * S, Y(377) * S + j, (j >> 1) % 2 ? 0xf8f4ec : 0xd8d4c8);
      },
    });
    // the chōzuya and the ema boards
    hall(104, Y(340), 10, 6, 3, C.copper, 'temple', { open: true });
    // the rack of ema boards
    img.fine(68, Y(354), 13, 4, (X, Yy) => {
      const j = Yy - Y(354) * S;
      if (j < 2) return 0x4a3424;
      if (j > 9) return 0x2a1c12;
      const k = X % 6;
      return k === 0 ? 0x4a3424 : (j >> 1) % 2 ? 0xe8d0a0 : hashPx(X >> 2, j, 145) < 0.3 ? 0xc83a2a : 0xd8b880;
    });
    crowd(84, Y(368), 16, 14, 14, true);
    // the Imperial General Headquarters ruins: foundation stones in the grass
    {
      const fx0 = 26;
      const fu0 = 410;
      // (a low kerb, the rows of foundation stones, each a little sunk in the grass)
      img.fine(fx0, Y(fu0 + 58), 38, 58, (X, Yy) => {
        const e = Math.min(X - fx0 * S, (fx0 + 38) * S - 1 - X, Yy - Y(fu0 + 58) * S, Y(fu0) * S - 1 - Yy);
        return e < 2 ? (X % 12 < 9 && Yy % 12 < 9 ? (e === 0 ? C.granite[3] : C.granite[1]) : null) : null;
      });
      for (let u = fu0 + 5; u < fu0 + 58; u += 10) for (let x = fx0 + 4; x < fx0 + 38; x += 8) rockPx(x * S, Y(u) * S, 2.6 + hashPx(x, u, 146), C.granite, x + u);
      reserveRect(fx0, Y(fu0 + 58), 38, 58);
      stoneLantern(fx0 + 19, fu0 - 6, false);
    }
    // the A-bombed eucalyptus and willow by the moat (they still grow there), and the castle woods
    tree(146, Y(300), 7, [0x3a5a4a, 0x4e7260, 0x6a8c78, 0x8eaa96], 1601);
    tree(28, Y(296), 6, C.willow, 1602);
    gravelPath(104, 113, 352, JODAN.face);
    gravelPath(40, 104, 474, 481);
    grove(HON.x0 + 4, HON.x1 - 4, HON.top + 6, JODAN.face - 6, 70, [C.camphor, C.camphor, C.pine, C.ginkgo, C.momijiR, C.sakuraAut], 1610, 4, 7);
    strollers(92, 450, 40, 30, 6);
    strollers(56, 360, 20, 30, 3);

    // ---- the keep: five storeys on the tenshudai at the north-west of the upper Honmaru
    const castleKeep = (cx, uBase) => {
      const y0 = Y(uBase);
      const baseH = 16;
      const baseW = 60;
      const yTop = y0 - baseH;
      const floors = [
        [46, 12],
        [39, 10],
        [32, 9],
        [26, 8],
        [20, 10],
      ];
      const roofH = [9, 8, 7, 6, 11];
      const parts = [];
      {
        let y = yTop - 5;
        for (let i = 0; i < floors.length; i++) {
          const [ww, wh] = floors[i];
          const wallTop2 = y - wh;
          parts.push({ i, ww, wallTop: wallTop2, wallBot: y });
          y = wallTop2 - roofH[i] + 3;
        }
      }
      const RK = C.kawara;
      objects.push({
        y: y0 + 2,
        shadow: () => {
          shadowRect(cx - baseW / 2 + 8, yTop + 4, baseW, baseH, 0.55);
          // the storeys' shadows as one shape, its steps softened
          const rowMax = new Map();
          for (const p of parts) {
            const x1 = Math.round(cx - p.ww / 2) + 12 + p.ww + 8;
            for (let y = p.wallTop - roofH[p.i] + 12; y < p.wallBot + 12; y++) rowMax.set(y, Math.max(rowMax.get(y) ?? 0, x1));
          }
          const ys = [...rowMax.keys()].sort((a, b) => a - b);
          const x0 = Math.round(cx - parts[0].ww / 2) + 12;
          for (const y of ys) {
            let m = 0;
            for (let k = -4; k <= 4; k++) m += rowMax.get(y + k) ?? rowMax.get(y);
            const end = (m / 9) * S;
            for (let Yy = y * S; Yy < (y + 1) * S; Yy++) for (let X = x0 * S; X < end; X++) img.tintPx(X, Yy, end - X < 2 ? 0.8 : 0.6);
          }
        },
        draw: () => {
          // the tenshudai: its gravel top in front of the first floor, the tall battered stone face
          img.fine(cx - baseW / 2, yTop - 6, baseW, 6, (X, Yy) => {
            const g = hashPx(X, Yy, 26);
            return g < 0.1 ? C.gravel[0] : g > 0.9 ? C.gravel[3] : rampColor(C.gravel, 0.3 + hashPx(X >> 1, Yy >> 1, 27) * 0.5, X, Yy);
          });
          stoneFace(cx - baseW / 2, cx + baseW / 2, yTop, baseH, 156);
          // stone steps up the face to the entrance on the east side
          stairs(cx + 14, yTop, 8, baseH);
          // walls first, top to bottom, then the roofs over the foot of each wall above
          for (let k = parts.length - 1; k >= 0; k--) {
            const { i, ww, wallTop: wt, wallBot } = parts[k];
            const x0 = Math.round(cx - ww / 2);
            const top = i === parts.length - 1;
            const WW = ww * S;
            const WH = (wallBot - wt) * S;
            const boardsFrom = top ? WH : Math.round(WH * 0.45);
            for (let j = 0; j < WH; j++)
              for (let i2 = 0; i2 < WW; i2++) {
                let c;
                if (j >= boardsFrom) {
                  // the black shitami boards, overlapping downwards, battens across them
                  c = j === boardsFrom ? C.board[0] : (j - boardsFrom) % 4 === 3 ? C.board[0] : (j - boardsFrom) % 4 === 0 ? C.board[3] : C.board[2];
                  if (i2 % 18 === 0) c = C.board[0];
                } else {
                  // the white plaster, cooler on the shaded side, a little weather under the eaves
                  c = i2 < 6 ? C.plaster[2] : i2 > WW - 10 ? C.plaster[0] : C.plaster[1];
                  if (j < 3) c = scaleColor(c, 0.74);
                  else if (hashPx(i2 >> 1, j >> 1, 157) < 0.06) c = scaleColor(c, 0.96);
                }
                // windows in the plaster band: dark, bars across them
                const wy = (top ? 3 : 2) * S;
                const wh = (top ? 3 : 2) * S;
                const b = i2 % 18;
                if (j >= wy && j < wy + wh && b >= 5 && b <= 13 && i2 > 8 && i2 < WW - 9) c = b === 5 || b === 13 || j === wy || j === wy + wh - 1 ? 0x3a3a44 : b % 3 === 0 ? 0x4a4a54 : 0x16161c;
                if (i2 >= WW - 3) c = scaleColor(c, 0.75);
                img.px(x0 * S + i2, wt * S + j, c);
              }
            if (top) {
              // the top floor's balustrade, black lacquer on posts
              for (let X = (x0 - 3) * S; X < (x0 + ww + 3) * S; X++) {
                img.px(X, wallBot * S - 8, C.board[3]);
                img.px(X, wallBot * S - 7, C.board[1]);
                for (let j = -6; j < -2; j++) if ((X - x0 * S) % 6 === 0) img.px(X, wallBot * S + j, C.board[3]);
                img.px(X, wallBot * S - 2, C.board[2]);
                img.px(X, wallBot * S - 1, C.board[0]);
              }
            }
          }
          for (let k = parts.length - 1; k >= 0; k--) {
            const { i, ww, wallTop: wt } = parts[k];
            const above = parts[i + 1];
            const rh = roofH[i] * S;
            const eave = (wt + 1) * S + 2;
            const topW = (above ? above.ww : ww - 8) * S;
            const botW = (ww + 9) * S;
            const CX = cx * S;
            for (let X = Math.round(CX - (ww * S) / 2); X < Math.round(CX + (ww * S) / 2); X++) for (let j = 0; j < 4; j++) img.tintPx(X, eave + 1 + j, 0.6 + j * 0.1);
            for (let j = 0; j < rh; j++) {
              const yy = eave - j;
              const t = j / Math.max(1, rh - 1);
              const hw = (botW / 2) * (1 - t) ** 0.6 + (topW / 2) * (1 - (1 - t) ** 0.6);
              for (let X = Math.round(CX - hw); X < Math.round(CX + hw); X++) {
                const lx = X - (CX - hw);
                const rx = CX + hw - X;
                const hip = Math.max(0, 9 - j);
                let c;
                if (lx < hip + 6) c = lx < 2 ? RK[4] : RK[3];
                else if (rx < hip + 6) c = rx < 2 ? RK[1] : RK[0];
                else {
                  const col = (X + (j >> 2) % 2) % 3;
                  c = col === 0 ? RK[2] : col === 1 ? RK[1] : scaleColor(RK[1], 0.78);
                  if (j % 4 === 3) c = scaleColor(c, 0.82);
                  if (t > 0.92) c = RK[3];
                }
                if (j < 2) c = j === 0 ? RK[0] : X % 3 === 0 ? 0xc0c4cc : RK[4];
                img.px(X, yy, c);
              }
              // the corners turning up
              if (j < 3) {
                for (const [X, c] of [[Math.round(CX - hw) - 1, RK[4]], [Math.round(CX - hw) - 2, RK[3]], [Math.round(CX + hw), RK[2]], [Math.round(CX + hw) + 1, RK[1]]]) img.px(X, yy - 3, c);
              }
            }
            // the gables on the south face: an irimoya gable low down, a pair of chidori, a curved kara-hafu
            const tri = (gx, gw, curved) => {
              const GX = gx * S;
              const G = gw * S;
              for (let j = 0; j < G / 2 + 3; j++) {
                const yy = eave - 3 - j;
                const half = curved ? G / 2 - (j * j) / (G / 2) : G / 2 - j;
                if (half < 0) break;
                for (let X = Math.round(GX - half); X <= Math.round(GX + half); X++) {
                  const e = half - Math.abs(X - GX);
                  let c = e < 2 ? RK[4] : e < 4 ? RK[1] : j < 6 ? C.plaster[2] : (X - Math.round(GX)) % 5 === 0 ? C.plaster[0] : C.plaster[1];
                  if (X > GX + 1 && e >= 4) c = scaleColor(c, 0.9);
                  img.px(X, yy, c);
                }
              }
              img.discPx(GX, eave - 9, 2.2, C.gold);
              img.px(GX - 1, eave - 10, C.goldHi);
            };
            if (i === 0) tri(cx, 18, false);
            if (i === 1) for (const s2 of [-1, 1]) tri(cx + s2 * 10, 9, false);
            if (i === 2) tri(cx, 12, true);
            if (i === 4) tri(cx, 10, false);
          }
          // the top ridge and its two shachihoko
          const topWall = parts[parts.length - 1].wallTop;
          const ridgeY = (topWall + 1 - roofH[roofH.length - 1] + 1) * S;
          for (let X = (cx - 8) * S; X < (cx + 8) * S; X++) {
            img.px(X, ridgeY, RK[0]);
            img.px(X, ridgeY + 1, RK[0]);
            img.px(X, ridgeY - 1, C.plaster[1]);
            img.px(X, ridgeY - 2, C.plaster[2]);
            img.px(X, ridgeY - 3, RK[4]);
          }
          for (const s2 of [-1, 1]) {
            const FX = (cx + s2 * 8) * S;
            for (let j = 0; j < 7; j++) for (let w = 0; w < 3 - (j >> 2); w++) img.px(FX + s2 * (w + (j >> 2)), ridgeY - 3 - j, j < 2 ? 0x5a4a28 : C.gold);
            img.px(FX + s2 * 3, ridgeY - 10, C.goldHi);
            glowPx(FX + s2 * 2, ridgeY - 8, C.goldHi, 0.6);
          }
        },
      });
      reserveRect(cx - baseW / 2 - 2, y0 - 120, baseW + 4, 124);
    };
    castleKeep(58, 560);
    // the upper Honmaru: the palace's foundation stones in the lawn, pines and a great camphor behind the keep
    for (let u = 572; u < 640; u += 9)
      for (let x = 112; x < 150; x += 8) {
        if ((x * 3 + u) % 5 === 0) continue;
        rockPx(x * S, Y(u) * S, 2.6, C.granite, x + u);
      }
    gravelPath(104, 113, JODAN.top, 560);
    gravelPath(80, 113, 553, 560);
    grove(HON.x0 + 3, HON.x1 - 3, JODAN.top + 6, HON.back - 2, 44, [C.pine, C.pine, C.camphor, C.momijiO, C.ginkgo], 1620, 4, 6.5);
    grove(92, HON.x1 - 3, JODAN.top + 4, HON.back - 2, 30, [C.camphor, C.pine, C.momijiR, C.sakuraAut, C.ginkgo], 1621, 4, 6);
    grove(HON.x0 + 3, 40, JODAN.top + 4, HON.back - 2, 14, [C.pine, C.camphor, C.momijiO], 1622, 4, 6);
    strollers(128, 600, 22, 30, 4);
    schoolGroup([[108, 536], [108, 552], [86, 556]], 8, 550, 0.3);

    // ---- life on the moat: koi in the clear water, ducks paddling, a grey heron fishing by the bridge,
    // glints, visitors crossing to the gate
    const koiF = (col) => [0, 1].map((f) =>
      sprite(4, 6, 400, (r) => {
        // a koi from above: head to the right, a white patch on its back, its tail swinging
        const ph = f ? 1 : -1;
        for (let i = 0; i < 12; i++) {
          const t = i / 11;
          const hw = Math.sin(t * Math.PI * 0.9 + 0.1) * 2.6;
          const cy = 8 + Math.sin(t * 3) * ph * (1 - t);
          for (let j = -hw; j <= hw; j += 0.5) r.px(i, cy + j, j > hw * 0.4 ? scaleColor(col, 0.75) : (i > 3 && i < 8 && col !== 0xffffff) ? 0xfff4e8 : col);
        }
        r.px(10, 7, 0x1a1414);
        r.px(10, 9, 0x1a1414);
        for (const j of [-3, -2, 2, 3]) r.px(0, 8 + j * 1 + ph, scaleColor(col, 0.85), 0.8);
      }),
    );
    for (const [kx, ku, col] of [[30, 230, 0xf26430], [150, 220, 0xfff0d8], [24, 400, 0xe83828], [170, 520, 0xf4a030], [140, 240, 0xffffff], [8, 600, 0xf26430]])
      kit.wander(kx, ku, 8, 14, koiF(col), { n: 2, sp: 4, turn: 'rot', fps: 3 });
    const duckF = duckF0(300);
    kit.wander(36, 232, 18, 10, duckF, { n: 3, sp: 3, turn: 'flip', fps: 2, idle: 0.4 });
    kit.wander(150, 250, 12, 14, duckF, { n: 2, sp: 3, turn: 'flip', fps: 2, idle: 0.4 });
    const heronF = [0, 1].map((f) =>
      sprite(5, 7, 190, (r) => {
        // a grey heron, standing in the shallows, its neck folded or stretched for a strike
        for (let j = 7; j < 15; j++) for (let i = 3; i < 9; i++) if (Math.abs(i - 5.5) < 3 - Math.abs(j - 11) * 0.3) r.px(i, j, i < 5 ? 0xb8bec6 : 0x8a9098);
        for (let j = 9; j < 15; j += 2) r.px(5, j, 0x5a6068);
        for (let j = 15; j < 20; j++) {
          r.px(4, j, 0x5a5048);
          r.px(6, j, 0x5a5048);
        }
        const nx = f ? 10 : 8;
        for (let k = 0; k < 6; k++) r.px(6 + (k * (nx - 6)) / 6, 7 - k, 0xe8e8ec);
        r.px(nx, 1, 0x2a2a30);
        for (let k = 1; k < 5; k++) r.px(nx + k, 1 + (k >> 1), 0xd8a040);
        for (let i = 2; i < 10; i++) r.px(i, 20, 0xe8f4f4, 0.5);
      }),
    );
    kit.loop(76, 190, heronF, { fps: 1, seq: [0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0] });
    const glintF = glintF0(400);
    kit.spot([[2, 266, 46, 80], [134, 266, 44, 80], [2, 640, 12, 300], [166, 640, 12, 300]], glintF, { rate: 1.2, fps: 6, a: 0.75 });
    for (const s0 of [0.1, 0.55]) kit.path([[66, 168], [66, 205], [72, 214]], [walker(COATS[(s0 * 10) | 0], 0, 190), walker(COATS[(s0 * 10) | 0], 1, 190)], { sp: 4, mode: 'pp', hold: 4, turn: 'none', fps: 3, s0 });
    strollers(92, 230, 26, 12, 4);
    strollers(90, 160, 80, 6, 6, { idle: 0.3 });
  }

  // ------------------------------------------------------------ 4. Shukkeien, u = 732..1228 (and the blocks along it)
  {
    const gx0 = 48;
    const gx1 = 138;
    const [g0, g1] = GARDEN;
    // moss and lawn inside the garden walls
    img.fine(gx0, Y(g1), gx1 - gx0, g1 - g0, (X, Yy, x, y) => {
      const n = fbm(x, y, { seed: 171, scale: 8, octaves: 3 });
      return lawnPx(X, Yy, 0.2 + n * 0.65, n > 0.5 ? C.lawn : C.moss, true);
    });
    // Takuei Pond: a long serpentine pond pinched in the middle, where Kokokyō spans it
    const PC = [93, 1000];
    const pondV = (x, u) => {
      const w = 1 - 0.72 * Math.exp(-(((u - PC[1]) / 16) ** 2));
      const dx = (x - PC[0]) / (40 * w);
      const du = (u - PC[1]) / 186;
      return dx * dx + du * du - fbm(x, u, { seed: 205, scale: 14 }) * 0.28;
    };
    const ISLES = [[72, 905, 8, 11], [110, 935, 6, 8], [80, 1080, 8, 10], [108, 1125, 7, 8], [96, 858, 4, 5]];
    const isle = (x, u) => ISLES.some(([ix, iu, rx, ry]) => ((x - ix) / rx) ** 2 + ((u - iu) / ry) ** 2 < 1 - fbm(x, u, { seed: 206, scale: 3 }) * 0.3);
    img.fine(gx0 + 2, Y(g1 - 10), gx1 - gx0 - 4, g1 - g0 - 70, (X, Yy, x, y) => {
      const u = L - y;
      const v = pondV(x, u);
      if (v >= 1) return null;
      if (v < 0.62) {
        if (isle(x, u)) {
          const c = lawnPx(X, Yy, 0.35 + fbm(x, y, { seed: 207, scale: 3 }) * 0.5, C.moss);
          return c;
        }
        wet[Math.floor(y) * W + Math.floor(x)] = 1;
        const fb = fbm(x, y * 2, { seed: 208, scale: 6 });
        let c = rampColor(C.pond, 0.25 + fb * 0.6, X, Yy);
        if (pondV(x, u + 2.6) >= 0.62) c = scaleColor(c, 0.7); // (the far bank mirrored)
        const r = Math.sin(y * 3 + fb * 8);
        if (r > 0.96) c = scaleColor(c, 1.25);
        return c;
      }
      if (v < 0.68) return hashPx(X >> 2, Yy >> 2, 209) < 0.45 ? C.granite[3] : hashPx(X >> 1, Yy >> 1, 210) < 0.5 ? C.granite[1] : C.granite[2];
      if (v > 0.86) {
        const g = hashPx(X, Yy, 211);
        return g < 0.1 ? C.gravel[0] : g > 0.92 ? C.gravel[3] : rampColor(C.gravel, 0.3 + hashPx(X >> 1, Yy >> 1, 212) * 0.5, X, Yy);
      }
      return null;
    });
    // the boulders of its shore, one by one, and the stepping stones
    {
      const pr = rng(206);
      for (let k = 0; k < 220; k++) {
        const x = gx0 + 4 + pr() * (gx1 - gx0 - 8);
        const u = g0 + 62 + pr() * (g1 - g0 - 76);
        const v = pondV(x, u);
        if (v > 0.6 && v < 0.7 && !isle(x, u)) rockPx(x * S, (L - u) * S, 1.8 + pr() * 3.2, C.granite, k);
      }
    }
    // rocks and trimmed black pines on the islets, stone slab bridges out to two of them
    for (const [ix, iu, rx] of ISLES) {
      tree(ix, Y(iu) - 1, Math.max(3, rx * 0.55), C.pine, ix * 7 + iu, 'pine');
      rockPx((ix - rx + 3) * S, (Y(iu) + 3) * S, 3.6, C.granite, ix);
      rockPx((ix + rx - 3) * S, (Y(iu) + 1) * S, 2.8, C.granite, iu);
    }
    for (const [x0, x1, u] of [[54, 65, 905], [116, 124, 935]])
      img.fine(x0, Y(u + 2), x1 - x0, 3, (X, Yy) => {
        const j = Yy - Y(u + 2) * S;
        return X % 15 === 0 ? C.granite[0] : j === 0 ? C.granite[4] : j > 6 ? C.granite[0] : C.granite[3];
      });
    // Kokokyō: the arched stone bridge over the pond's waist, its arch and its reflection making a full ring
    {
      const bu = PC[1];
      const xs = [79, 108];
      objects.push({
        y: Y(bu - 4) + 4,
        shadow: () => {
          for (let x = xs[0] + 2; x < xs[1] + 2; x++) img.tint(x, Y(bu - 4) + 2, 0.6);
        },
        draw: () => {
          const X0 = xs[0] * S;
          const X1 = xs[1] * S;
          const span = X1 - X0;
          for (let X = X0; X < X1; X++) {
            const t = (X - X0) / (span - 1);
            const hump = Math.sin(t * Math.PI);
            const lift = Math.round(hump * 9);
            // the deck, its slab joints across it
            for (let j = -9; j <= 9; j++) {
              const Yr = Y(bu) * S + j - lift;
              let c = j === -9 ? C.granite[4] : j >= 8 ? C.granite[1] : hump > 0.7 ? C.granite[4] : hump > 0.35 ? C.granite[3] : C.granite[2];
              if (X % 9 === 0 && j > -9 && j < 8) c = scaleColor(c, 0.84);
              else if (hashPx(X, Yr, 213) < 0.06) c = scaleColor(c, 0.92);
              img.px(X, Yr, c);
            }
            // the south face of the arch: stone voussoirs over the dark opening
            const open = Math.max(0, hump * 18 - 3);
            const faceY = Y(bu - 2) * S - lift + 3;
            for (let k = 0; k < 18; k++) {
              const yy = faceY + k;
              const inside = k >= 18 - open;
              let c = inside ? 0x0e2420 : k < 6 ? C.granite[2] : C.granite[1];
              if (!inside && k >= 18 - open - 4 && X % 6 === 0) c = C.granite[0];
              img.px(X, yy, c);
            }
            // the reflection under it closes the circle
            for (let k = 0; k < open; k++) img.px(X, faceY + 18 + k, k < open - 3 ? 0x163a34 : C.granite[1], 0.75);
          }
        },
      });
      reserveRect(xs[0], Y(bu + 6), xs[1] - xs[0], 18);
    }
    // the garden walls: white plaster under tiles, a gate in the south wall
    objects.push({
      y: Y(g0) + 1,
      draw: () => {
        for (let X = gx0 * S; X < gx1 * S; X++) {
          if (X >= 86 * S && X < 99 * S) continue;
          const Y0 = Y(g0 + 3) * S;
          for (let j = 0; j < 12; j++) {
            let c;
            if (j < 2) c = C.kawara[4];
            else if (j < 6) c = X % 3 === 0 ? C.kawara[3] : X % 3 === 1 ? C.kawara[2] : C.kawara[1];
            else if (j === 6) c = C.kawara[0];
            else c = X % 24 === 0 ? C.plaster[0] : j > 9 ? C.plaster[0] : C.plaster[2];
            img.px(X, Y0 + j, c);
          }
          for (let j = 12; j < 15; j++) img.tintPx(X, Y0 + j, 0.7);
        }
      },
    });
    img.fine(gx0, Y(g1), 2, g1 - g0, (X, Yy) => (X - gx0 * S < 3 ? (Yy % 3 === 0 ? C.kawara[3] : C.kawara[4]) : C.plaster[1]));
    img.fine(gx1 - 2, Y(g1), 2, g1 - g0, (X, Yy) => (X - (gx1 - 2) * S < 3 ? C.plaster[1] : Yy % 3 === 0 ? C.kawara[0] : C.kawara[1]));
    img.fine(gx0, Y(g1 - 1), gx1 - gx0, 2, (X, Yy) => (Yy - Y(g1 - 1) * S < 3 ? (X % 3 === 0 ? C.kawara[3] : C.kawara[2]) : C.plaster[1]));
    hall(84, Y(g0 + 10), 17, 6, 4, C.kawara, 'temple', { open: true, gable: 'tri', gw: 7, crest: false });
    gravelPath(88, 97, g0 + 4, g0 + 62);
    img.fine(56, Y(g0 + 52), 74, 46, (X, Yy) => {
      const g = hashPx(X, Yy, 211);
      return g < 0.1 ? C.gravel[0] : g > 0.92 ? C.gravel[3] : rampColor(C.gravel, 0.3 + hashPx(X >> 1, Yy >> 1, 212) * 0.5, X, Yy);
    });
    hall(122, Y(g0 + 30), 10, 5, 4, C.kawara, 'shop', { noren: 0x2a3a6a }); // the ticket office
    // Seifūkan: the thatched main tea house looking over the pond from the south-west
    hall(54, Y(856), 26, 12, 5, C.thatch, 'temple', { hip: true, ridge: true, wall: 0xe8e0c8, bay: 4 });
    img.fine(55, Y(831), 24, 2, (X, Yy) => (X % 6 === 0 ? C.hinoki[0] : Yy % 3 === 0 ? C.hinoki[3] : C.hinoki[2])); // the veranda over the water
    // Meigetsu-tei on its little hill in the north-east, and the miniature Mt Fuji
    disc(122, Y(1140), 11, C.lawn, 212);
    hall(112, Y(1158), 18, 9, 4, C.thatch, 'temple', { wall: 0xe8e0c8, bay: 4 });
    img.fine(118, Y(890) - 8, 20, 16, (X, Yy, x, y) => {
      const dx = (x - 128) / 9;
      const dy = (y - Y(890)) / 6.75;
      const d = dx * dx + dy * dy;
      if (d >= 1) return null;
      return lawnPx(X, Yy, Math.max(0.05, Math.min(0.97, 0.6 + (1 - d) * 0.35 - dx * 0.3 - dy * 0.3)), C.lawn);
    });
    // the waterfall at the north end tumbling into the pond (live), the rice paddy and the tea hedges
    for (let k = 0; k < 26; k++) rockPx((86 + (k % 7) * 2.2) * S, Y(1190 + (k >> 2) * 3) * S, 3 + hashPx(k, 2, 214) * 3, C.granite, k);
    const fallF = [0, 1, 2].map((k) =>
      sprite(5, 12, 1195, (r) => {
        for (let y = 0; y < 36; y++)
          for (let x = 0; x < 15; x++) {
            const s = (y + k * 9 + (x >> 1) * 5) % 18;
            r.px(x, y, s < 6 ? 0xffffff : s < 12 ? 0xc8e8ec : 0x8cbcc4, 0.82);
          }
      }),
    );
    kit.loop(91, 1198, fallF, { fps: 8, d: 0.03 });
    kit.spot([[86, 1188, 14, 6]], glintF0(), { rate: 3, fps: 6, a: 0.7 });
    // the little rice paddy, ripe and leaning, its bunds; the tea rows
    img.fine(54, Y(1192), 28, 42, (X, Yy) => {
      const e = Math.min(X - 54 * S, 82 * S - 1 - X);
      const row = (Yy >> 1) % 6;
      if (e < 3 || (Yy % 36) < 3) return hashPx(X, Yy, 215) < 0.5 ? C.moss[1] : C.moss[2];
      const t = hashPx(X >> 1, Yy >> 2, 216);
      return row < 2 ? 0x8a6e28 : t < 0.35 ? 0xe8c058 : t < 0.8 ? 0xd8b048 : 0xc09a38;
    });
    img.fine(108, Y(1192), 26, 40, (X, Yy) => {
      const k = Yy % 12;
      if (k > 8) return k === 9 ? 0x2a3a22 : 0x6a5a3a;
      const t = hashPx(X >> 1, Yy >> 1, 217);
      return k < 2 ? 0x6e9650 : t < 0.3 ? 0x2c5430 : t < 0.8 ? 0x40703c : 0x5e8c4c;
    });
    reserveRect(54, Y(1192), 28, 42);
    reserveRect(108, Y(1192), 26, 42);
    // stone lanterns by the water, the autumn maples and pines, a bamboo grove in the north-west corner
    for (const [lx, lu] of [[60, 880], [126, 960], [70, 1030], [118, 1060], [62, 1130], [100, 820]]) stoneLantern(lx, lu, false);
    grove(gx0 + 4, 70, 1196, g1 - 6, 10, [C.moss], 1701, 2.5, 3.5, 'bamboo');
    grove(gx0 + 4, gx1 - 4, g0 + 54, g1 - 8, 70, [C.momijiR, C.momijiR, C.momijiO, C.momijiY, C.pine, C.camphor, C.momijiR], 1702, 3.5, 6);
    // life in the garden: big koi, ducks, visitors on the strolling path, kimono at the tea house
    const bigKoi = (col, spot) => [0, 1].map((f) =>
      sprite(4, 7, 1000, (r) => {
        r.rect(1, 0, 2, 5, col);
        r.rect(0, 1, 4, 3, col);
        r.set(1, 2, spot);
        r.set(2, 1, spot);
        r.set(f ? 0 : 3, 6, scaleColor(col, 0.8));
        r.set(1, 5, scaleColor(col, 0.9));
        r.set(2, 5, scaleColor(col, 0.9));
      }),
    );
    for (const [kx, ku, col, sp] of [[92, 900, 0xf8f4ec, 0xe83828], [96, 940, 0xf26430, 0xffffff], [90, 1060, 0xf4c030, 0x2a2a2a], [94, 1110, 0xe83828, 0xf8f4ec], [84, 1150, 0x2a2a30, 0xf26430]])
      kit.wander(kx, ku, 9, 24, bigKoi(col, sp), { n: 2, sp: 3, turn: 'rot', fps: 2, idle: 0.3 });
    kit.wander(96, 1020, 10, 30, duckF0(), { n: 2, sp: 2.5, turn: 'flip', fps: 2, idle: 0.5 });
    strollers(93, 1000, 46, 175, 9, { idle: 0.5, sp: 3 });
    strollers(67, 826, 8, 4, 3, { cols: [0xd84868, 0x6a4aa8, 0xe8a0c0, 0x3a6ab0] });
    kit.spot([[60, 1170, 60, 330]], glintF0(), { rate: 1.1, fps: 6, a: 0.7 });
    // the city blocks either side of the garden and the A-Bomb Dome block
    district(0, 21, 732, 1232, 'town');
    district(157, W, 732, 1232, 'town');
  }

  // ------------------------------------------------------------ 5. the A-Bomb Dome, the Motoyasu, Peace Memorial Park
  {
    const px0 = 46;
    const px1 = 140;
    // ---- the Dome's block, u = 1246..1428: lawn inside a low fence, the riverside walk with its gangi
    lawnFill(px0, Y(DOME[1]), px1 - px0, DOME[1] - DOME[0], C.lawn, 181);
    flagFill(px0, Y(DOME[0] + 10), px1 - px0, 10, C.paving, 182);
    flagFill(px0, Y(MOTOYASU[0]), px1 - px0, MOTOYASU[0] - 1408, C.paving, 183);
    gangi(px0, px1, MOTOYASU[0] - 1, 1);
    gangi(0, 21, MOTOYASU[0] - 1, 1);
    gangi(157, W, MOTOYASU[0] - 1, 1);
    gravelPath(px0, px1, 1312, 1320, C.paving);
    gravelPath(AXIS - 4, AXIS + 5, DOME[0] + 10, 1312, C.paving);
    // the fence round the ruin
    {
      const fence = (X0, Y0, X1, Y1) => {
        img.linePx(X0, Y0 - 2, X1, Y1 - 2, 0x6a6a72);
        img.linePx(X0 + 1, Y0 + 1, X1 + 1, Y1 + 1, 0x101014, 0.25);
        const n = Math.max(Math.abs(X1 - X0), Math.abs(Y1 - Y0));
        for (let k = 0; k <= n; k += 8) for (let j = -3; j < 1; j++) img.px(X0 + ((X1 - X0) * k) / n, Y0 + ((Y1 - Y0) * k) / n + j, 0x2e2e36);
      };
      fence(54 * S, Y(1324) * S, 130 * S, Y(1324) * S);
      fence(54 * S, Y(1406) * S, 130 * S, Y(1406) * S);
      fence(54 * S, Y(1406) * S, 54 * S, Y(1324) * S);
      fence(130 * S, Y(1406) * S, 130 * S, Y(1324) * S);
    }
    reserveRect(54, Y(1406), 77, 84);

    /**
     * The Dome: Jan Letzel's Industrial Promotion Hall as it stands since 6 August 1945. Three storeys of brick
     * under stone and mortar, roofless, the wings broken to different heights round an open court, the five-storey
     * stair tower on the river side and the bare steel ribs of its oval copper dome.
     * Walls are extruded boxes: [x0, x1, u0, u1, height, ruin (0 whole .. 1 broken)].
     */
    {
      const DS = C.domeStone;
      const walls = [
        [58, 126, 1396, 1400, 18, 0.2], // the river front
        [58, 61, 1342, 1400, 13, 0.85], // west wing, outer wall, broken low
        [77, 80, 1342, 1378, 15, 0.6], // west wing, court side
        [58, 80, 1342, 1345, 11, 0.9], // west wing, south end (breached)
        [61, 77, 1360, 1363, 9, 0.7],
        [104, 107, 1342, 1378, 18, 0.25], // east wing, court side
        [123, 126, 1342, 1400, 18, 0.3], // east wing, outer wall
        [104, 126, 1342, 1345, 18, 0.35], // east wing, south end, still three storeys of windows
        [107, 123, 1362, 1365, 16, 0.4],
        [77, 107, 1376, 1379, 17, 0.45], // the court's back wall
        [61, 77, 1379, 1382, 12, 0.6],
        [107, 123, 1379, 1382, 17, 0.3],
      ];
      const tower = [81, 104, 1380, 1399, 36];
      const jag = (X, ruin, h, seed) => {
        const n = fbm((X / S) * 1.3, seed, { seed: 191, scale: 4 });
        const v = h * S * (1 - ruin * Math.max(0, n * 1.6 - 0.25));
        return Math.max(6, Math.round(v - (ruin > 0.15 ? hashPx(X >> 1, seed, 196) * 4 : 0)));
      };
      const BRICK = [0x5a3a2c, 0x74503a, 0x8e664a, 0xa07a58];
      const box = ([x0, x1, u0, u1, h, ruin], seed) => {
        const X0 = x0 * S;
        const X1 = x1 * S;
        const base = Y(u0) * S;
        const depth = (u1 - u0) * S;
        const wide = x1 - x0 > 5;
        for (let X = X0; X < X1; X++) {
          const hh = jag(X, ruin, h, seed);
          const broken = hh < h * S - 5;
          // the top of the wall, brick showing where it broke
          for (let j = 0; j < depth; j++) {
            const yy = base - hh - j;
            const t = hashPx(X >> 1, yy >> 1, seed);
            img.px(X, yy, broken ? (t < 0.5 ? DS[1] : t < 0.8 ? DS[2] : BRICK[1]) : j % 6 === 0 ? DS[2] : DS[4]);
          }
          // the south face: dressed stone on the lowest floor, render over brick above, arched windows two to a bay,
          // string courses, the render gone in patches and the brick scorched
          for (let k = 0; k < hh; k++) {
            const yy = base - hh + k;
            const up = base - yy; // (fine pixels above the ground)
            const floor = Math.floor(up / 18);
            const inFloor = up % 18;
            const lx = X - X0;
            const fx = X / S;
            const fy = yy / S;
            const bare = fbm(fx * 1.2, fy, { seed: 197 + (seed & 7), scale: 5, octaves: 2 });
            let c;
            if (bare > 0.7 || (broken && k < 5)) {
              // bare brick in its courses
              const row = yy >> 1;
              const XX = X + (row % 2) * 2;
              c = yy % 2 === 0 || XX % 5 === 0 ? 0x46302a : BRICK[1 + Math.floor(hashPx(XX >> 2, row, 198) * 3)];
            } else {
              c = rampColor(DS, 0.78 - (k / Math.max(1, hh)) * 0.34 + (fbm(fx, fy, { seed: 192, scale: 2 }) - 0.5) * 0.4, X, yy);
              if (floor === 0 && (yy % 6 === 0 || (X + ((yy >> 2) % 2) * 6) % 12 === 0)) c = scaleColor(c, 0.82); // (the dressed courses)
              if (inFloor === 17) c = scaleColor(c, 1.2);
              else if (inFloor === 16 || inFloor === 0) c = scaleColor(c, 0.74);
            }
            if (wide && floor < 3) {
              const b = lx % 15;
              const off = Math.abs(b - 7.5);
              const top = 12 + Math.sqrt(Math.max(0, 6.25 - off * off));
              if (off < 2.6 && inFloor >= 4 && inFloor < top) c = inFloor < 6 ? 0x120d0a : b < 7 ? 0x241a14 : 0x0e0a08;
              else if (off < 3.6 && inFloor >= 3 && inFloor < top + 1.4) c = scaleColor(c, b < 7 ? 1.14 : 0.78);
            }
            const sc = fbm(fx * 2, fy, { seed: 193, scale: 3 });
            if (sc > 0.72) c = scaleColor(c, 0.7); // (scorching)
            else if (hashPx(X, yy, 199) < 0.05) c = scaleColor(c, 0.88);
            if (X >= X1 - 2) c = scaleColor(c, 0.78);
            img.px(X, yy, c);
          }
        }
      };
      objects.push({
        y: Y(1342) + 1,
        shadow: () => {
          shadowRect(66, Y(1400) - 10, 66, 58, 0.62);
          shadowRect(90, Y(1398) - 30, 20, 24, 0.62);
        },
        draw: () => {
          // the floors inside: rubble long since cleared to brick-strewn ground, a few iron beams and the braces
          // that hold the walls up today
          img.fine(59, Y(1398) - 3, 66, 55, (X, Yy, x, y) => {
            const u = L - y - 3;
            const court = x >= 80 && x < 104 && u < 1375;
            const t = hashPx(X >> 1, Yy >> 1, 195);
            if (court) return lawnPx(X, Yy, 0.5 + (t - 0.5) * 0.2, C.lawn);
            const c = mix(0x4a3e34, 0x5e5044, fbm(x, y, { seed: 195, scale: 2 }));
            return t > 0.97 ? BRICK[1] : t < 0.04 ? 0x342c26 : c;
          });
          // back to front so the nearer walls cover the farther ones
          const order = walls.map((w, i) => [w, i]).sort((a, b) => b[0][2] - a[0][2]);
          // the stair tower (behind the court's back wall)
          const [tx0, tx1, tu0, tu1, th] = tower;
          for (const [w, i] of order) if (w[2] >= tu1 - 2) box(w, i * 17 + 3);
          box([tx0, tx1, tu1 - 3, tu1, th, 0.05], 401);
          box([tx0, tx0 + 3, tu0, tu1, th, 0.05], 402);
          box([tx1 - 3, tx1, tu0, tu1, th, 0.05], 403);
          box([tx0, tx1, tu0, tu0 + 3, th, 0.08], 404);
          // the dome: its bare steel ribs, all that was left of the copper; the far ones dim through the near ones, the
          // rings that held them, the small crown ring, nothing inside it but the dark of the shaft
          {
            const dcx = ((tx0 + tx1) / 2) * S;
            const dcy = (Y((tu0 + tu1) / 2) - th) * S;
            const RX = 33;
            const RY = 22;
            const RISE = 30;
            for (let Yy = Math.floor(dcy - RY); Yy <= dcy + RY; Yy++)
              for (let X = Math.floor(dcx - RX); X <= dcx + RX; X++) {
                const d = ((X + 0.5 - dcx) / (RX - 1)) ** 2 + ((Yy + 0.5 - dcy) / (RY - 1)) ** 2;
                if (d < 1) img.px(X, Yy, mix(0x0c0908, 0x241a15, Math.max(0, d - 0.3)));
              }
            /** A point on the dome: a = round it, t = 0 at the rim .. 1 at the crown. */
            const P = (a, t) => {
              const k = Math.cos(t * Math.PI * 0.46);
              const r = 0.12 + 0.88 * k;
              return [dcx + Math.cos(a) * RX * r, dcy + Math.sin(a) * RY * r - RISE * Math.sin(t * Math.PI * 0.5)];
            };
            const STEEL = [0x241a14, 0x4a3224, 0x6e4a30, 0x9a6e48];
            const rib = (a, c, c2) => {
              let [x0, y0] = P(a, 0);
              for (let t = 0.05; t <= 1.001; t += 0.05) {
                const [x1, y1] = P(a, t);
                img.linePx(x0, y0, x1, y1, c);
                if (c2) img.linePx(x0 + 1, y0, x1 + 1, y1, c2);
                x0 = x1;
                y0 = y1;
              }
            };
            const ring = (t, front, c) => {
              for (let a = 0; a < Math.PI * 2; a += 0.012) {
                if (Math.sin(a) > 0 !== front) continue;
                const [x, y] = P(a, t);
                img.px(x, y, c);
              }
            };
            // the far half first
            for (const t of [0, 0.3, 0.58, 0.8]) ring(t, false, STEEL[1]);
            for (let k = 0; k < 32; k++) {
              const a = (k / 32) * Math.PI * 2;
              if (Math.sin(a) <= 0) rib(a, STEEL[1]);
            }
            // then the near half, lit from the west
            for (let k = 0; k < 32; k++) {
              const a = (k / 32) * Math.PI * 2;
              if (Math.sin(a) > 0) rib(a, Math.cos(a) < 0 ? STEEL[3] : STEEL[2], k % 4 === 0 ? STEEL[0] : 0);
            }
            for (const t of [0.3, 0.58, 0.8]) ring(t, true, STEEL[2]);
            ring(1, true, STEEL[3]);
            ring(1, false, STEEL[3]);
            // the rim it sits on: a stone ring, broken in places
            for (let a = 0; a < Math.PI * 2; a += 0.01) {
              const x = dcx + Math.cos(a) * (RX + 2);
              const y = dcy + Math.sin(a) * (RY + 1.5);
              if (hashPx(Math.floor(a * 20), 3, 407) < 0.14) continue;
              const lit = Math.cos(a) < 0.2;
              for (let j = 0; j < 3; j++) img.px(x, y + j, j === 2 ? DS[0] : lit ? DS[4] : DS[2]);
            }
          }
          for (const [w, i] of order) if (w[2] < tu1 - 2) box(w, i * 17 + 3);
          // steel braces inside the broken west wing
          for (const [a, b, c, d] of [[62, Y(1370) - 10, 76, Y(1350) - 4], [62, Y(1350) - 4, 76, Y(1370) - 10]]) {
            img.linePx(a * S, b * S, c * S, d * S, C.rust[3]);
            img.linePx(a * S, b * S + 1, c * S, d * S + 1, C.rust[1]);
            img.linePx(a * S, b * S + 2, c * S, d * S + 2, C.rust[0]);
          }
        },
      });
    }
    // the UNESCO stone, the camphors that grew back, willows by the water
    monument(68, Y(1322), 2);
    for (const [tx, tu, pal] of [[50, 1268, C.camphor], [134, 1272, C.camphor], [50, 1350, C.camphor], [134, 1360, C.ginkgo], [52, 1414, C.willow], [134, 1416, C.willow], [112, 1290, C.sakuraAut]])
      tree(tx, Y(tu), 5.5, pal, tx * 13 + tu);
    for (const bx of [54, 104]) {
      // an oval bed in the lawn: a clipped hedge round it, rows of white and yellow chrysanthemums, a low stone edge
      const cx = bx + 15;
      const cu = 1283;
      img.fine(bx + 2, Y(1302), 26, 38, (X, Yy, x, y) => {
        const d = Math.hypot((x - cx) / 12, (L - y - cu) / 18);
        if (d > 1) return null;
        if (d > 0.93) return hashPx(X, Yy, 26) < 0.3 ? C.stone[3] : C.stone[2];
        if (d > 0.74) {
          const t = hashPx(X >> 1, Yy >> 1, 27);
          return t < 0.25 ? 0x4e7a44 : t < 0.7 ? 0x34603a : 0x2a4e30;
        }
        const row = Math.floor(d * 7);
        const t = hashPx(X >> 1, Yy >> 1, 28 + row);
        const col = [0xf4f0e0, 0xe8c040, 0xf4f0e0, 0xe8a030, 0xf4f0e0][row % 5];
        return t < 0.5 ? col : t < 0.62 ? scaleColor(col, 0.8) : t < 0.85 ? 0x2e5e30 : 0x3e7a3a;
      });
      reserveRect(bx + 2, Y(1302), 26, 38);
      bench(bx + 2, Y(1262), 6);
      bench(bx + 24, Y(1262), 6);
    }
    grove(px0 + 2, px1 - 2, DOME[0] + 12, 1310, 10, [C.camphor, C.sakuraAut, C.ginkgo], 1790, 4, 5.5);
    strollers(92, 1300, 34, 10, 6);
    schoolGroup([[60, 1316], [124, 1316]], 9, 1316, 0.6);
    crowd(70, Y(1418), 50, 6, 14, true);
    // the Peace Clock Tower by the Aioi bridge: a slim concrete frame, a globe in it, a clock each way
    {
      const x = 134;
      const y = Y(1414);
      const X = x * S;
      const Yy = y * S;
      objects.push({
        y: y + 1,
        shadow: () => {
          for (let k = 0; k < 44; k++) for (let t = -2; t <= 2; t++) img.tintPx(X + 3 + k, Yy + 2 + Math.floor(k * 0.55) + t, 0.72);
        },
        draw: () => {
          for (let i = -7; i <= 7; i++) for (let j = 0; j < 4; j++) img.px(X + i, Yy + j, j === 0 ? C.granite[3] : C.granite[1]);
          for (const sx of [-4, 3])
            for (let j = -46; j < 1; j++) {
              img.px(X + sx, Yy + j, sx < 0 ? C.concrete[4] : C.concrete[2]);
              img.px(X + sx + 1, Yy + j, sx < 0 ? C.concrete[3] : C.concrete[1]);
            }
          img.discPx(X, Yy - 38, 6.4, C.concrete[1]);
          img.discPx(X, Yy - 38, 5.4, 0xf0f0e8);
          img.linePx(X, Yy - 38, X, Yy - 42, 0x1a1a20);
          img.linePx(X, Yy - 38, X + 3, Yy - 36, 0x1a1a20);
          for (let i = -6; i <= 6; i++) img.px(X + i, Yy - 47, C.concrete[4]);
        },
      });
    }

    // Genbaku Dōmu-mae: the tram stop on the boulevard, two narrow platforms under shelters, people waiting
    for (const [x0, x1] of [[27, 29], [39, 41]]) {
      img.fine(x0, Y(1300), x1 - x0, 32, (X, Yy) => {
        const e = X - x0 * S;
        return e === 0 || e === 5 ? 0xe8c840 : Yy % 12 === 0 ? C.granite[1] : rampColor(C.granite, 0.45 + hashPx(X >> 2, Yy >> 2, 29) * 0.3, X, Yy);
      });
      objects.push({
        y: Y(1272),
        draw: () => {
          for (let Yy = Y(1294) * S; Yy < Y(1276) * S; Yy++)
            for (let i = 0; i < 6; i++) img.px(x0 * S + i, Yy, Yy % 12 === 0 ? 0x5a7a8a : i === 0 ? 0xe8ecf0 : i === 5 ? 0x8a9098 : 0xc8ccd0);
          for (let u = 1276; u < 1294; u += 6) for (let i = 1; i < 5; i++) img.px(x0 * S + i, Y(u) * S, 0x2a6a4a);
        },
      });
      crowd(x0, Y(1298), 1, 26, 6, true);
    }
    // Orizuru Tower east of the avenue: glass, the folded-crane wall glowing with colour at its foot, the wooden
    // observation deck on its roof
    building(157, Y(1312), 23, 24, 34, {
      style: 'glass',
      wall: 0x6a8aa4,
      roof: 0x9a8a72,
      noItems: true,
      top: () => {
        img.fine(158, Y(1312), 21, 24, (X, Yy) => (Yy % 6 === 0 ? C.hinoki[0] : hashPx(X >> 4, Yy >> 2, 30) < 0.5 ? C.hinoki[2] : C.hinoki[1]));
        img.rect(160, Y(1312) + 3, 17, 2, 0x8a7458);
        crowd(160, Y(1312) + 6, 16, 14, 12, true);
      },
      front: (fy) => {
        // the wall of paper cranes visitors folded and dropped, heaping up at its foot
        const cr = rng(1312);
        img.fine(159, fy + 1, 5, 33, (X, Yy, x, y) => {
          const deep = (y - fy) / 34;
          if (hashPx(X >> 1, Yy >> 1, 196) >= 0.2 + deep * 0.8) return null;
          return [0xe83838, 0xf8d040, 0x3a8ae0, 0x48c060, 0xf0f0f0, 0xe868b0, 0xf88838][Math.floor(hashPx(X >> 1, Yy >> 1, 197) * 7)];
        });
        void cr;
      },
    });
    district(0, 21, 1246, 1428, 'office');
    district(157, W, 1318, 1426, 'office');

    // ---- the Motoyasu: lanterns set afloat for the souls, a sightseeing boat, glints
    {
      const ru = (MOTOYASU[0] + MOTOYASU[1]) / 2;
      const toroFrames = [0, 1].map((f) =>
        sprite(6, 7, ru, (r) => {
          // a paper lantern on its little raft, lit from within, its reflection and glow on the water
          for (let j = 15; j < 21; j++) for (let i = 3; i < 15; i++) r.px(i, j, 0xffb868, (0.32 * (21 - j)) / 6);
          for (let j = 11; j < 15; j++) for (let i = 2; i < 16; i++) r.px(i, j, j === 11 ? 0x8a6a40 : j === 14 ? 0x2a1c10 : 0x5a3a20);
          for (let j = 0; j < 11; j++)
            for (let i = 4; i < 14; i++) {
              const e = i === 4 || i === 13 || j === 0;
              const v = 1 - Math.abs(i - 8.5) / 6;
              r.px(i, j, e ? 0x7a5a30 : mix(0xffa848, f ? 0xfff0b0 : 0xffdc90, v));
            }
          for (let i = 5; i < 13; i++) r.px(i, 4, 0xd89850);
          for (let j = 5; j < 10; j++) r.px(8, j, 0x8a5a28, 0.6); // (a character brushed on it)
          r.px(7, 7, 0x8a5a28, 0.6);
          r.px(9, 7, 0x8a5a28, 0.6);
        }),
      );
      for (const [lu, sp, n, dir] of [[ru - 14, 6, 7, 1], [ru + 2, 5, 6, 1], [ru + 16, 7, 5, -1]]) {
        const pts = dir > 0 ? [[-10, lu], [W + 10, lu + 2]] : [[W + 10, lu], [-10, lu - 2]];
        kit.path(pts, toroFrames, { sp, n, gap: 34, fps: 2, d: 0.02, turn: 'none' });
      }
      /** A river boat from above, its bow to the right: hull, deck, cabin roof, a window strip, the rail. */
      const riverBoat = (w, h, roofC, stripe, u) =>
        sprite(w, h, u, (r) => {
          const FL = w * S;
          const FH = h * S;
          const mid = (FH - 1) / 2;
          for (let X = 0; X < FL; X++) {
            const t = FL - 1 - X;
            const hw = Math.min(FH / 2 - 1, 1 + Math.pow(t, 0.7) * 1.1);
            for (let Yy = 0; Yy < FH; Yy++) {
              const a = Math.abs(Yy - mid);
              if (a > hw) continue;
              const e = hw - a;
              let c = e < 1 ? (Yy > mid ? 0x8a9098 : 0xffffff) : e < 2.2 ? stripe : 0xeef2f6;
              if (X < 2) c = 0x6a7078;
              r.px(X, Yy, c);
            }
          }
          for (let Yy = 5; Yy < FH - 5; Yy++)
            for (let X = 8; X < FL - 15; X++) {
              const e = Math.min(Yy - 5, FH - 6 - Yy);
              r.px(X, Yy, e === 0 ? (Yy === 5 ? 0xffffff : 0x8a9098) : e < 3 ? ((X >> 1) % 3 ? 0x9ad0f0 : 0x2c3e50) : (X - 8) % 15 === 0 ? scaleColor(roofC, 0.8) : roofC);
            }
          for (const [X, Yy, c] of [[FL - 12, 6, 0xd04040], [FL - 10, FH - 8, 0xe8e8f0], [5, 7, 0xe8c040]]) {
            r.px(X, Yy, c);
            r.px(X, Yy + 1, 0x2a2024);
          }
        });
      const boat = riverBoat(18, 8, 0x2c5a78, 0x2a6a9a, ru);
      kit.path([[-20, ru + 6], [W + 20, ru + 6]], [boat], { sp: 13, n: 1, d: 0.02, turn: 'none', wake: { f: wakeF0(ru), every: 5, life: 1.6 } });
      kit.spot([[0, MOTOYASU[1] - 4, W, 80]], glintF0(ru), { rate: 1.6, fps: 6, a: 0.75 });
    }

    // ---- Peace Memorial Park, u = 1520..1964
    const [p0, p1] = PARK;
    for (const [x0, x1] of [[0, 22], [px0, px1], [156, W]]) lawnFill(x0, Y(p1), x1 - x0, p1 - p0, C.lawn, 201);
    // the river walk along the north bank, the boat pier to Miyajima
    flagFill(0, Y(p0 + 14), W, 14, C.paving, 202);
    gangi(0, W, p0, -1);
    for (let x = 4; x < W; x += 9)
      if (x < 22 || (x > 46 && x < 140) || x > 156) {
        // bollards with a chain between them
        img.rectPx(x * S, Y(p0 + 13) * S - 3, 2, 5, 0x4a4a52);
        img.px(x * S, Y(p0 + 13) * S - 4, 0x8a8a92);
        for (let k = 2; k < 27; k++) img.px(x * S + k, Y(p0 + 13) * S - 1 + Math.round(Math.sin((k / 27) * Math.PI) * 2), 0x3a3a42, 0.8);
      }
    objects.push({
      y: Y(p0 - 6),
      shadow: () => shadowRect(114, Y(p0 - 1), 24, 8, 0.6),
      draw: () => {
        // the floating pier: steel deck, a yellow edge, tyres along the side, the gangway to it
        img.fine(122, Y(p0 + 6), 3, 6, (X, Yy) => (Yy % 3 === 0 ? C.paving[0] : (X % 3 === 0 ? C.paving[1] : C.paving[2])));
        img.fine(112, Y(p0 + 1), 24, 7, (X, Yy) => {
          const j = Yy - Y(p0 + 1) * S;
          if (j < 2) return 0xb8bcc0;
          if (j >= 7 * S - 3) return X % 9 < 5 ? 0x24242a : 0x8a8e94;
          if (j >= 7 * S - 6) return 0xe8d848;
          return X % 18 === 0 || j % 6 === 0 ? 0x6a6e74 : 0x8a8e94;
        });
      },
    });
    // the Aqua Net boat: in to the pier, a wait, then away downriver towards the sea and Miyajima
    {
      const aq = sprite(20, 8, 1505, (r) => {
        const FL = 60;
        const FH = 24;
        const mid = (FH - 1) / 2;
        for (let X = 0; X < FL; X++) {
          const t = FL - 1 - X;
          const hw = Math.min(FH / 2 - 1, 1 + Math.pow(t, 0.7) * 1.1);
          for (let Yy = 0; Yy < FH; Yy++) {
            const a = Math.abs(Yy - mid);
            if (a > hw) continue;
            const e = hw - a;
            r.px(X, Yy, e < 1 ? (Yy > mid ? 0x8a9098 : 0xffffff) : e < 2.4 ? 0xd83a2a : 0xf4f6f8);
          }
        }
        for (let Yy = 5; Yy < FH - 5; Yy++)
          for (let X = 9; X < FL - 15; X++) {
            const e = Math.min(Yy - 5, FH - 6 - Yy);
            r.px(X, Yy, e === 0 ? (Yy === 5 ? 0xffffff : 0x4a5a70) : e < 3 ? ((X >> 1) % 3 ? 0x8ac0f0 : 0x14283e) : 0x1e3c6a);
          }
      });
      kit.path([[124, 1510], [60, 1508], [-24, 1504]], [aq], { sp: 12, mode: 'pp', hold: 8, d: 0.02, turn: 'flip', wake: { f: wakeF0(1500), every: 5, life: 1.6 } });
    }
    // the main axis walk from the Museum to the river, with the side walks
    flagFill(AXIS - 6, Y(1600), 13, 1600 - p0 - 14, C.plaza, 203);
    reserveRect(AXIS - 6, Y(1600), 13, 1600 - p0 - 14);
    gravelPath(px0, px1, 1546, 1552, C.paving);
    gravelPath(px0, px1, 1760, 1766, C.paving);

    // the Peace Bell: a little domed shelter over the bell in a lotus pool
    {
      const bx = 124;
      const bu = 1574;
      img.fine(bx - 13, Y(bu) - 12, 26, 24, (X, Yy, x, y) => {
        const d = Math.hypot(x - bx, (y - Y(bu)) * 1.2);
        if (d >= 12.5) return null;
        if (d >= 11) return d < 11.6 ? C.granite[0] : C.granite[3];
        wet[Math.floor(y) * W + Math.floor(x)] = 1;
        // the lotus pool, its leaves browning for the autumn, a few seed heads
        const n = fbm(x, y, { seed: 213, scale: 1.7, octaves: 2 });
        if (n > 0.56) {
          const t = hashPx(X >> 1, Yy >> 1, 214);
          return n > 0.72 ? 0x8a7a40 : t < 0.3 ? C.lotus[3] : t < 0.75 ? C.lotus[2] : C.lotus[1];
        }
        return rampColor(C.peacePond, 0.4 + fbm(x, y, { seed: 214, scale: 3 }) * 0.4, X, Yy);
      });
      objects.push({
        y: Y(bu) + 3,
        shadow: () => shadowEllipse(bx + 3, Y(bu) - 2, 6, 4, 0.6),
        draw: () => {
          const y = Y(bu);
          const X = bx * S + 1;
          const Yy = y * S;
          img.fine(bx - 1, Y(bu - 11), 3, 4, (Xx, Yr) => (Yr % 4 === 0 ? C.granite[1] : C.granite[3])); // (the walk out to it)
          for (const dx of [-13, 12]) for (let j = -24; j < 3; j++) for (let i = 0; i < 3; i++) img.px(X + dx + i, Yy + j, i === 0 ? C.concrete[4] : i === 2 ? C.concrete[1] : C.concrete[2]);
          // the bell, a world map without borders on it, the sounding log on its chains
          for (let j = -16; j < -3; j++) {
            const hw = 3.2 + (j + 16) * 0.22;
            for (let i = -Math.round(hw); i <= hw; i++) img.px(X + i, Yy + j, i < -hw * 0.3 ? 0xa8863e : i > hw * 0.5 ? 0x5a4220 : 0x7a5a2a);
          }
          for (let i = -6; i <= 6; i++) img.px(X + i, Yy - 3, 0x9a7a3a);
          for (let k = 0; k < 9; k++) img.px(X - 13 + k, Yy - 9, 0x6a4a2a);
          // the dome over it, green copper, like the sky held up
          for (let j = -15; j <= 0; j++)
            for (let i = -18; i <= 18; i++) {
              if ((i / 18) ** 2 + ((j + 0.5) / 15) ** 2 > 1) continue;
              let c = rampColor(C.copper, 0.92 - (i + 18) / 48 - (j + 15) / 42, i, j);
              if (j === 0 || j === -1) c = C.copper[0];
              if ((i + 60) % 9 === 0 && j < -2) c = scaleColor(c, 0.88);
              img.px(X + i, Yy - 27 + j, c);
            }
          img.discPx(X, Yy - 43, 2, C.copper[4]);
        },
      });
      reserveRect(bx - 13, Y(bu + 11), 26, 24);
    }
    // the Children's Peace Monument: Sadako holding up her golden crane on the slender tripod, the booths of
    // paper-crane garlands sent from all over the world behind it
    {
      const mx = 60;
      const mu = 1580;
      img.fine(mx - 13, Y(mu) - 13, 26, 26, (X, Yy, x, y) => {
        const d = Math.hypot(x - mx, y - Y(mu));
        if (d > 12) return null;
        if (d > 11.3) return C.granite[1];
        const ring = Math.floor(d / 2.6);
        const a = Math.atan2(y - Y(mu), x - mx);
        const n = 8 + ring * 6;
        if (d % 2.6 < 0.3 || Math.abs(((a * n) / Math.PI) % 1) < 0.05) return C.plaza[0];
        return rampColor(C.plaza, 0.4 + hashPx(ring, Math.floor((a * n) / Math.PI), 215) * 0.4, X, Yy);
      });
      objects.push({
        y: Y(mu) + 4,
        shadow: () => {
          for (let k = 0; k < 60; k++) for (let t = -1; t <= 1; t++) img.tintPx(mx * S + 5 + Math.round(k * 0.6), Y(mu) * S + 3 + Math.round(k * 0.25) + t, 0.65);
        },
        draw: () => {
          const y = Y(mu);
          const X = mx * S + 1;
          const Yy = y * S;
          // a slender three-legged arch of grey stone, tapering up, on its round base
          for (let i = -19; i <= 19; i++) for (let j = 0; j < 5; j++) if (Math.abs(i) < 19 - j * 0.2) img.px(X + i, Yy + j, j === 0 ? C.granite[4] : j === 4 ? C.granite[0] : i < 0 ? C.granite[3] : C.granite[2]);
          for (let k = 0; k < 60; k++) {
            const t = k / 60;
            const spread = (1 - t) ** 1.25 * 16;
            for (const [dx, c, c2] of [[-spread, C.granite[4], C.granite[2]], [spread, C.granite[2], C.granite[0]]]) {
              img.px(X + dx, Yy - k, c);
              img.px(X + dx + 1, Yy - k, c2);
            }
          }
          // the crane-shaped wind chime hanging inside, its bell underneath
          for (let j = -44; j < -30; j++) img.px(X, Yy + j, 0x7a6a3a, 0.8);
          for (let j = -30; j < -24; j++) for (let i = -3; i <= 3; i++) if (Math.abs(i) <= 1 + (j + 30) * 0.4) img.px(X + i, Yy + j, i < 0 ? 0xc8a860 : 0x7a6a3a);
          // the boy and the girl on the sides
          for (const [dx, c] of [[-13, 0x7a6a50], [13, 0x5a4a38]]) {
            for (let j = -24; j < -12; j++) for (let i = -1; i < 2; i++) img.px(X + dx + i, Yy + j, c);
            img.discPx(X + dx, Yy - 26, 2, c);
          }
          // Sadako at the top, arms raised, holding up the golden crane
          for (let j = -68; j < -58; j++) for (let i = -1; i < 2; i++) img.px(X + i, Yy + j, i < 0 ? 0x6a5a44 : 0x4a3e30);
          img.discPx(X, Yy - 70, 2, 0x6a5a44);
          for (let k = 0; k < 5; k++) {
            img.px(X - 2 - Math.floor(k * 0.5), Yy - 68 - k, 0x6a5a44);
            img.px(X + 2 + Math.floor(k * 0.5), Yy - 68 - k, 0x4a3e30);
          }
          for (let i = -6; i <= 6; i++) {
            const up = Math.round(Math.abs(i) * 0.4);
            img.px(X + i, Yy - 76 - up, C.goldHi);
            img.px(X + i, Yy - 75 - up, C.gold);
          }
          glowPx(X, Yy - 77, C.goldHi, 0.9);
          glowPx(X + 1, Yy - 77, C.goldHi, 0.9);
        },
      });
      // the booths: glass cases under little roofs, full of the garlands of paper cranes sent from all over the world
      for (let k = 0; k < 5; k++) {
        const bx = 40 + k * 9;
        const bu = 1598 + Math.round(Math.abs(k - 2) * -2);
        objects.push({
          y: Y(bu) + 1,
          shadow: () => shadowRect(bx + 2, Y(bu) - 6, 8, 7, 0.6),
          draw: () => {
            const y = Y(bu);
            const X0 = bx * S;
            const Y0 = (y - 8) * S;
            for (let j = 0; j < 6; j++) for (let i = -1; i < 25; i++) img.px(X0 + i, Y0 + j, j === 0 ? 0xf0f4f4 : j === 5 ? 0x5a6a74 : i < 8 ? 0xe0e4e6 : 0xc8ced2);
            for (let j = 6; j < 27; j++)
              for (let i = 0; i < 24; i++) {
                if (i < 2 || i > 21) {
                  img.px(X0 + i, Y0 + j, i < 2 ? 0xe8f0f4 : 0x6a7a84);
                  continue;
                }
                // the garlands hang in long strands, each a thousand tiny colours
                const strand = i >> 1;
                const c = [0xe83838, 0xf88838, 0xf8d040, 0x48c060, 0x3a8ae0, 0x9a58d0, 0xf06aa8, 0xf0f0f0][Math.floor(hashPx(strand, (j + strand * 3) >> 1, k + 3) * 8)];
                img.px(X0 + i, Y0 + j, i % 2 ? scaleColor(c, 0.8) : c);
              }
          },
        });
      }
      for (let k = 0; k < 18; k++) folk(mx - 10 + rand() * 20, Y(mu) + 4 + rand() * 7);
      reserveRect(mx - 22, Y(1606), 46, 40);
    }
    // the Atomic Bomb Memorial Mound with its little stupa
    {
      const mx = 58;
      const mu = 1648;
      img.fine(mx - 12, Y(mu) - 10, 24, 20, (X, Yy, x, y) => {
        const dx = (x - mx) / 11;
        const dy = (y - Y(mu)) / 9;
        const d = Math.hypot(dx, dy);
        if (d >= 1) return null;
        const v = 0.62 + (1 - d) * 0.2 - dx * 0.3 - dy * 0.3;
        return lawnPx(X, Yy, Math.max(0.1, Math.min(0.98, v)), C.lawn);
      });
      {
        const X = mx * S + 1;
        const Yy = (Y(mu) - 1) * S;
        // the little stone stupa on top, a low stone rail, incense and flowers before it
        for (let i = -5; i <= 5; i++) for (let j = 0; j < 3; j++) img.px(X + i, Yy + j, j === 0 ? C.granite[4] : C.granite[1]);
        for (let j = -12; j < 0; j++) for (let i = -2; i <= 2; i++) img.px(X + i, Yy + j, i < 0 ? C.granite[4] : i > 0 ? C.granite[1] : C.granite[2]);
        for (let i = -4; i <= 4; i++) img.px(X + i, Yy - 13, C.granite[4]);
        for (let j = -19; j < -13; j++) img.px(X, Yy + j, C.granite[3]);
        for (const [i, c] of [[-5, 0xf8f8f0], [-3, 0xe8c040], [3, 0xf8f8f0], [5, 0xe85a6a]]) img.px(X + i, Yy + 4, c);
      }
      reserveRect(mx - 12, Y(mu + 10), 24, 20);
    }
    // the Pond of Peace with the Flame of Peace at its north end
    {
      const [q0, q1] = [1606, 1700];
      img.fine(AXIS - 11, Y(q1 + 2), 23, q1 - q0 + 4, (X, Yy, x, y) => {
        const u = L - y;
        const e = Math.min(x - (AXIS - 9), AXIS + 10 - x, u - q0, q1 - u);
        if (e < 0) {
          // the granite kerb, its coping lit on the north and west
          if (e > -0.34) return 0x4e4a44;
          return X % 18 === 0 || Yy % 18 === 0 ? C.granite[1] : rampColor(C.granite, 0.62 + hashPx(X >> 4, Yy >> 4, 216) * 0.25, X, Yy);
        }
        wet[Math.floor(y) * W + Math.floor(x)] = 1;
        // still water with the sky in it, the kerb's shadow along its north and west
        let c = rampColor(C.peacePond, 0.35 + fbm(x, y * 2, { seed: 216, scale: 6 }) * 0.5, X, Yy);
        const r = Math.sin(y * 3 + fbm(x, y, { seed: 217, scale: 7 }) * 7);
        if (r > 0.96) c = scaleColor(c, 1.22);
        if (u > q1 - 1.5 || x < AXIS - 8) c = scaleColor(c, 0.72);
        return c;
      });
      reserveRect(AXIS - 12, Y(q1 + 2), 24, q1 - q0 + 6);
      // the pedestal at the pond's end towards the Dome: two upturned palms joined at the wrists, the flame
      // burning between them
      const fy = Y(q0 + 4);
      objects.push({
        y: fy + 4,
        shadow: () => shadowRect(AXIS - 4, fy - 2, 14, 6, 0.6),
        draw: () => {
          // two palms, upturned, joined at the wrists: the pedestal curving up either side of the flame
          const X = AXIS * S + 1;
          const Yy = fy * S;
          for (let i = -27; i <= 27; i++) {
            const a = Math.abs(i) / 27;
            const up = Math.round(a * a * 16);
            for (let j = 0; j < 9 - a * 3; j++) {
              const c = j === 0 ? C.concrete[4] : j > 6 - a * 3 ? C.concrete[0] : i < 0 ? C.concrete[3] : C.concrete[2];
              img.px(X + i, Yy - 3 - up + j, c);
            }
          }
          for (let j = 4; j < 9; j++) for (let i = -8; i <= 8; i++) img.px(X + i, Yy + j, i < -5 ? C.concrete[3] : i > 5 ? C.concrete[0] : C.concrete[2]);
          for (let i = -10; i <= 10; i++) img.px(X + i, Yy + 9, 0x2a2622, 0.5);
          pool(AXIS + 0.5, fy - 6, 14, 0xff8c38, 0.3);
        },
      });
      const flameF = [0, 1, 2].map((k) =>
        sprite(5, 7, 1700, (r) => {
          const CX = 7.5;
          const lean = [0, 0.8, -0.7][k];
          for (let j = 0; j < 21; j++) {
            const t = j / 20; // (0 at the tip)
            const hw = Math.sin(t * Math.PI * 0.72) * 5.2 + 0.4;
            const cx = CX + lean * (1 - t) * 2;
            for (let i = 0; i < 15; i++) {
              const d = Math.abs(i + 0.5 - cx);
              if (d > hw) continue;
              const v = 1 - d / hw;
              r.px(i, j, v > 0.62 && t > 0.3 ? 0xfff6c8 : v > 0.3 ? (t < 0.3 ? 0xffb840 : 0xffc850) : t < 0.5 ? 0xe85820 : 0xf07028);
            }
          }
        }),
      );
      kit.loop(AXIS - 2, q0 + 4 + 12, flameF, { fps: 7, d: 0.4 });
      kit.spot([[AXIS - 8, 1696, 16, 86]], glintF0(1650), { rate: 0.9, fps: 6, a: 0.7 });
    }
    // the Cenotaph: the saddle-shaped arch like an ancient haniwa house, over the stone chest that holds the
    // names; flowers and incense before it, the axis framed through it to the Flame and the Dome
    {
      const cy = Y(1724);
      objects.push({
        y: cy + 3,
        shadow: () => shadowRect(AXIS - 8, cy - 9, 26, 10, 0.55),
        draw: () => {
          const X = AXIS * S + 1;
          const Yy = cy * S;
          // the plinth
          for (let i = -44; i <= 44; i++) for (let j = 0; j < 7; j++) img.px(X + i, Yy + j, j === 0 ? C.granite[4] : j === 6 ? C.granite[0] : i % 18 === 0 ? C.granite[1] : C.granite[2]);
          // the stone chest that holds the names, dark and polished
          for (let j = -13; j < 0; j++)
            for (let i = -13; i <= 13; i++) {
              let c = j < -10 ? 0x4a4a54 : i < -8 ? 0x34343c : 0x24242a;
              if (j === -10) c = 0x16161c;
              if (j > -9 && (i + 13) % 13 === 0) c = 0x16161c;
              img.px(X + i, Yy + j, c);
            }
          // the saddle: the shape of the houses of ancient Japan, rising at both ends, resting on two flared legs
          for (let i = -38; i <= 38; i++) {
            const t = Math.abs(i) / 38;
            const top = -40 + Math.round(t * t * 13) - Math.round(t ** 6 * 8);
            const th = 11 - t * 3;
            for (let j = 0; j < th; j++) {
              const c = j === 0 ? C.concrete[4] : j < 3 ? C.concrete[3] : j > th - 3 ? C.concrete[0] : i < 0 ? C.concrete[2] : C.concrete[1];
              img.px(X + i, Yy + top + j, c);
            }
          }
          for (const s of [-1, 1])
            for (let j = -31; j < 0; j++) {
              const flare = 24 + (j + 31) * 0.4;
              for (let w = 0; w < 9 + (j + 31) * 0.14; w++) {
                const i = s * (flare + w);
                img.px(X + i, Yy + j, w === 0 ? C.concrete[0] : s < 0 ? (w > 6 ? C.concrete[4] : C.concrete[3]) : w > 6 ? C.concrete[0] : C.concrete[1]);
              }
            }
          // flowers laid in front, white for the most part
          const fr = rng(1724);
          for (let k = 0; k < 44; k++) {
            const FX = X - 30 + fr() * 60;
            const FY = Yy + 8 + fr() * 6;
            const c = fr() < 0.6 ? 0xf8f8f0 : [0xf8d040, 0xe85a6a, 0xb070d0][Math.floor(fr() * 3)];
            img.px(FX, FY, c);
            img.px(FX + 1, FY, scaleColor(c, 0.85));
            img.px(FX, FY + 1, 0x3e6a34);
          }
        },
      });
      reserveRect(AXIS - 15, cy - 16, 30, 20);
      kit.emit(AXIS + 6, 1720, thinSmoke, { rate: 1, life: [1.4, 2.2], vy: 6, sx: 1, wf: 0.6, a: 0.35, tint: 1 });
    }
    // the plaza between the Cenotaph and the Museum: granite paving, benches, lamps, the Fountain of Prayer
    flagFill(px0 + 4, Y(1846), px1 - px0 - 8, 116, C.plaza, 217, 24);
    img.fine(px0 + 4, Y(1846), px1 - px0 - 8, 116, (X, Yy) => {
      // a darker band of granite down the axis and every ten flags across, its kerbs
      const a = Math.abs(X - AXIS * S);
      if (a === 36 || (Yy % 240 === 0)) return scaleColor(C.plaza[0], 0.82);
      return null;
    });
    reserveRect(px0 + 4, Y(1846), px1 - px0 - 8, 116);
    for (const u of [1744, 1792]) {
      bench(56, Y(u), 6);
      bench(122, Y(u), 6);
      streetLamp(54, u + 14);
      streetLamp(130, u + 14);
    }
    {
      const fu = 1830;
      const fy = Y(fu);
      img.fine(AXIS - 17, fy - 9, 34, 18, (X, Yy, x, y) => {
        const d = ((x - AXIS) / 16) ** 2 + ((y - fy) / 8) ** 2;
        if (d > 1) return null;
        if (d > 0.94) return C.granite[0];
        if (d > 0.82) return x - AXIS + y - fy < 0 ? C.granite[4] : C.granite[2];
        wet[Math.floor(y) * W + Math.floor(x)] = 1;
        if (d > 0.36 && d < 0.44) return C.granite[2];
        const r = Math.sin(Math.sqrt(d) * 40 + fbm(x, y, { seed: 218, scale: 3 }) * 3);
        let c = rampColor(C.peacePond, 0.5 + fbm(x, y, { seed: 218, scale: 3 }) * 0.4, X, Yy);
        if (r > 0.9) c = scaleColor(c, 1.25);
        return c;
      });
      const jetF = [0, 1, 2].map((k) =>
        sprite(30, 12, fu, (r) => {
          // the fountain's jets, an arc of fine water, each falling as spray
          for (let j = 0; j < 9; j++) {
            const cx = 9 + j * 9;
            const h = 12 + ((j + k) % 3) * 6 + (j === 4 ? 9 : 0);
            for (let t = 0; t < h; t++) {
              r.px(cx, 35 - t, t > h - 4 ? 0xffffff : 0xd8f0f8, 0.8);
              if (t > 3) r.px(cx + ((t + k) % 2), 35 - t, 0xe8f8ff, 0.4);
            }
            for (let t = 0; t < 6; t++) {
              const dx = 1 + t * 0.6;
              r.px(cx - dx, 35 - h + 1 + t * 0.9, 0xe8f8ff, 0.7 - t * 0.09);
              r.px(cx + dx, 35 - h + 1 + t * 0.9, 0xe8f8ff, 0.7 - t * 0.09);
            }
          }
        }),
      );
      kit.loop(AXIS - 15, fu + 9, jetF, { fps: 5, d: 0.05 });
    }
    // the Museum main building, raised on twenty pilotis, its long front of concrete louvres; the axis runs
    // under it. East Building and the conference centre to either side.
    {
      const mx0 = 50;
      const mx1 = 134;
      const fu = 1846; // the front at ground level
      const depth = 22;
      const pil = 8;
      const body = 12;
      const H = pil + body;
      objects.push({
        y: Y(fu) + 1,
        shadow: () => shadowRect(mx0 + 6, Y(fu + depth) - H + 6, mx1 - mx0, depth + H, 0.55),
        draw: () => {
          // the long concrete roof: slabs, its gravel, the plant housed in the middle, a parapet lit along north and west
          const X0 = mx0 * S;
          const X1 = mx1 * S;
          const YR0 = (Y(fu + depth) - H) * S;
          const YR1 = (Y(fu) - H) * S;
          for (let Yy = YR0; Yy < YR1; Yy++)
            for (let X = X0; X < X1; X++) {
              const e = Math.min(X - X0, Yy - YR0);
              const e2 = Math.min(X1 - 1 - X, YR1 - 1 - Yy);
              let c;
              if (e < 2) c = C.concrete[4];
              else if (e2 < 2) c = C.concrete[1];
              else if (e === 2) c = C.concrete[1];
              else {
                c = rampColor(C.concrete, 0.6 + (fbm(X / S, Yy / S, { seed: 219, scale: 9 }) - 0.5) * 0.25, X, Yy);
                if ((X - X0) % 27 === 0 || (Yy - YR0) % 21 === 0) c = scaleColor(c, 0.9);
                const g = hashPx(X, Yy, 220);
                if (g < 0.06) c = scaleColor(c, 0.92);
                else if (g > 0.96) c = scaleColor(c, 1.06);
              }
              img.px(X, Yy, c);
            }
          // the louvred front: deep concrete fins, the shade between them, a band top and bottom
          const ty = (Y(fu) - H) * S;
          const BODY = body * S;
          for (let j = 0; j < BODY; j++)
            for (let X = X0; X < X1; X++) {
              const k = (X - X0) % 9;
              let c = k < 2 ? C.concrete[4] : k < 4 ? C.concrete[2] : k === 4 ? C.concrete[0] : j < 6 ? 0x2a2a30 : hashPx(Math.floor((X - X0) / 9), 2, 221) < 0.08 ? 0x4a5a6a : 0x3a3a40;
              if (j < 3) c = j === 0 ? C.concrete[4] : C.concrete[3];
              if (j >= BODY - 4) c = j === BODY - 1 ? 0x1a1a1e : C.concrete[1];
              img.px(X, ty + j, c);
            }
          // under it: the open ground floor in shade with the axis running through it, the columns
          const YB = Y(fu) * S;
          for (let Yy = ty + BODY; Yy < YB; Yy++)
            for (let X = X0; X < X1; X++) {
              const k = (X - X0) % 27;
              if (k >= 12 && k < 14) img.px(X, Yy, C.concrete[3]);
              else if (k >= 14 && k < 17) img.px(X, Yy, C.concrete[1]);
              else {
                img.tintPx(X, Yy, 0.42);
              }
            }
        },
      });
      reserveRect(mx0 - 1, Y(fu + depth) - H - 1, mx1 - mx0 + 2, depth + H + 2);
      for (let k = 0; k < 22; k++) folk(mx0 + 4 + rand() * (mx1 - mx0 - 8), Y(fu) + 2 + rand() * 6);
      building(158, Y(1878), 22, 26, 14, { style: 'office', wall: C.concrete[3], roof: C.concrete[2] }); // East Building
      building(0, Y(1880), 21, 28, 14, { style: 'glass', wall: 0x7a8a94, roof: C.concrete[2] }); // the conference centre
    }
    // the Rest House: the kimono shop of 1929, its basement the only room here that came through; a plain three-storey block
    building(110, Y(1660), 24, 14, 12, { style: 'office', wall: 0xd8ccb4, roof: 0x8a8678, door: true });
    // the phoenix trees that were scorched and lived, on their props, by the Museum's north side
    {
      const x = 126;
      const y = Y(1886);
      tree(x, y, 6.5, C.camphor, 1886);
      objects.push({
        y: y + 5,
        draw: () => {
          const X = x * S;
          const Yy = y * S;
          for (let j = 0; j < 14; j++) {
            img.px(X, Yy + 4 + j, 0x5a4a3a);
            img.px(X + 1, Yy + 4 + j, 0x3a2e24);
          }
          img.linePx(X - 8, Yy + 16, X, Yy + 7, 0x8a7a5a);
          img.linePx(X + 8, Yy + 16, X, Yy + 7, 0x6a5a44);
          for (let i = -10; i <= 10; i++) if (i % 2 === 0) img.px(X + i, Yy + 19, C.granite[2]);
        },
      });
      reserveRect(x - 4, y - 4, 8, 10);
    }
    // the park's memorial stones along its walks, each small, a few people before them, flowers at some
    for (const [x, u] of [[56, 1558], [130, 1558], [66, 1706], [118, 1706], [52, 1690], [60, 1880], [100, 1880]]) monument(x, Y(u), 1);
    // trees: camphors along the plaza, cherries by the river, ginkgo gold, lawns kept open on the axis
    grove(px0 + 2, px1 - 2, p0 + 18, 1726, 70, [C.camphor, C.camphor, C.sakuraAut, C.ginkgo, C.momijiR], 1801, 4, 6.5);
    grove(0, 21, p0 + 16, 1860, 14, [C.camphor, C.sakuraAut, C.ginkgo], 1802, 4, 6);
    grove(157, W, p0 + 16, 1830, 14, [C.camphor, C.sakuraAut, C.ginkgo], 1803, 4, 6);
    grove(px0 + 2, px1 - 2, 1872, p1 - 2, 18, [C.camphor, C.ginkgo, C.camphor], 1804, 4, 6);
    // people: visitors, school groups in yellow caps, doves wheeling over the plaza and taking off
    strollers(AXIS, 1780, 36, 40, 12);
    strollers(AXIS, 1640, 30, 40, 6);
    strollers(60, 1582, 12, 10, 4);
    schoolGroup([[AXIS - 3, 1728], [AXIS - 3, 1660], [70, 1612], [66, 1592]], 10, 1660, 0.2);
    schoolGroup([[118, 1800], [66, 1800], [66, 1752]], 9, 1780, 0.7);
    // a school party standing in rows before the Cenotaph, in their yellow caps, and their teacher
    for (let k = 0; k < 24; k++) folk(AXIS - 18 + (k % 8) * 5, Y(1742 + Math.floor(k / 8) * 5), { coat: k % 3 ? 0x2a3a6a : 0xf0f0f0, cap: 0xf4d020 });
    folk(AXIS + 24, Y(1746), { coat: 0x5a2a3a });
    kit.orbit(AXIS, 1784, 28, doveF0(1784), { ry: 16, w: 0.55, n: 6, d: 0.9 });
    {
      const flock = [0, 1, 2, 3, 4, 5].map((k) =>
        sprite(19, 15, 1780, (r) => {
          const fr = rng(31);
          for (let i = 0; i < 9; i++) {
            const a = i * 0.7 + 0.4;
            const d = 1.5 + (i % 3) + k * 1.6;
            const x = Math.round((9 + Math.cos(a) * d * 1.2 + k * 0.8) * S);
            const y = Math.round((10 + Math.sin(a) * d * 0.6 - k * 1.4) * S);
            const flap = (i + k) % 2;
            const al = k > 4 ? 0.5 : 1;
            for (let w = -3; w <= 3; w++) r.px(x + w, y - (flap ? Math.abs(w) : -Math.abs(w) * 0.5), Math.abs(w) > 1 ? 0xd8d8dc : 0xf4f4f0, al);
            void fr;
          }
        }),
      );
      kit.spot([[60, 1820, 64, 80]], flock, { rate: 0.35, fps: 6 });
    }

    // ---- Heiwa Ōdōri: tree belts on both sides of the hundred-metre road
    for (let x = 4; x < W; x += 12) {
      if (Math.abs(x - WEST_CX) < 13 || Math.abs(x - EAST_CX) < 9) continue;
      tree(x, Y(HEIWA - 14), 4.5, x % 24 ? C.camphor : C.ginkgo, 1900 + x);
      tree(x + 6, Y(HEIWA + 15), 4.5, x % 24 ? C.ginkgo : C.camphor, 1950 + x);
    }
  }


  // ------------------------------------------------------------ 6. downtown: Okonomimura, Hondōri, the Honkawa,
  // Mazda Stadium, the blocks to the coast, Miyajimaguchi; and all the traffic
  {
    const px0 = 46;
    const px1 = 140;
    // the plaza north of Heiwa Ōdōri: yatai griddles steaming under red lanterns (turret pads stand here)
    flagFill(px0, Y(2078), px1 - px0, 2078 - HEIWA - 14, C.plaza, 301);
    for (const [sx, su] of [[50, 2006], [64, 2006], [106, 2006], [120, 2006], [50, 2066], [124, 2066]]) {
      const sy = Y(su);
      objects.push({
        y: sy + 10,
        shadow: () => shadowRect(sx + 2, sy + 2, 13, 9, 0.6),
        draw: () => {
          // a yatai: its striped awning sagging over the counter, the griddle with okonomiyaki, stools, red lanterns
          const X = sx * S;
          const Yy = sy * S;
          for (let j = 0; j < 15; j++) for (let i = 0; i < 36; i++) img.px(X + i, Yy + j, j === 14 ? 0x7a1e16 : j < 2 ? 0xe85a3e : (i >> 2) % 2 ? 0xdc442e : 0xf0e8d8);
          for (let i = 0; i < 36; i++) if (i % 8 < 5) img.px(X + i, Yy + 15, (i >> 2) % 2 ? 0x8a2418 : 0xc8c0b0);
          for (let j = 15; j < 24; j++) for (let i = 2; i < 34; i++) img.px(X + i, Yy + j, j === 15 ? 0x2a1a12 : i % 6 === 0 ? 0x4a3020 : 0x6a4a30);
          for (let j = 18; j < 22; j++) for (let i = 5; i < 31; i++) img.px(X + i, Yy + j, j === 18 ? 0x4a4a50 : 0x2a2a2e);
          for (const i of [8, 16, 24]) {
            img.discPx(X + i, Yy + 20, 2.6, 0xc88a48);
            img.px(X + i, Yy + 19, 0x6a3a20);
            img.px(X + i + 1, Yy + 20, 0xf0e8c0);
          }
          for (let i = 3; i < 33; i++) for (let j = 24; j < 27; j++) img.px(X + i, Yy + j, j === 24 ? 0xe8d8b0 : 0xb89868);
          for (const i of [7, 18, 29]) img.discPx(X + i, Yy + 29, 1.6, 0x8a2418);
          for (const i of [3, 32]) {
            for (let j = 8; j < 14; j++) for (let k = -2; k <= 2; k++) if (Math.abs(k) + Math.abs(j - 11) < 4) glowPx(X + i + k, Yy + j, j % 2 ? 0xff6a40 : 0xff9a60, 0.95);
          }
          pool(sx + 6, sy + 7, 9, C.lamp, 0.22);
        },
      });
      reserveRect(sx, sy, 13, 10);
      kit.emit(sx + 6, su - 5, stallSteam, { rate: 1.6, life: [1.2, 2], vy: 6, sx: 2, wf: 0.6, a: 0.5, tint: 1 });
      crowd(sx, sy + 10, 12, 4, 5, true);
    }
    strollers(92, 2040, 40, 20, 8);
    // Okonomimura: a block of okonomiyaki counters, its big sign and lantern-hung front
    building(px0 + 2, Y(2132), 40, 30, 22, {
      style: 'shop',
      wall: 0xd8c8a8,
      roof: 0x8a7a6a,
      front: (fy) => {
        // its big sign, yellow with red letters, its strings of lanterns
        const sr = rng(2132);
        const X = (px0 + 6) * S;
        const Yy = (fy + 2) * S;
        for (let j = 0; j < 15; j++) for (let i = 0; i < 96; i++) img.px(X + i, Yy + j, j === 0 ? 0xfff0a0 : j === 14 ? 0x8a6a20 : i === 0 || i === 95 ? 0x8a6a20 : 0xe8d040);
        for (let k = 0; k < 9; k++) {
          const gx = X + 5 + k * 10;
          for (let i = 0; i < 7; i++) {
            img.px(gx + i, Yy + 3, 0xc83a2a);
            if (sr() < 0.5) img.px(gx + i, Yy + 10, 0xc83a2a);
          }
          const vx = gx + 1 + Math.floor(sr() * 5);
          for (let j = 3; j < 11; j++) img.px(vx, Yy + j, 0xc83a2a);
        }
        for (let x = px0 + 4; x < px0 + 40; x += 4) glow(x, fy + 9, 0xff5a30, 0.95);
      },
    });
    building(px0 + 46, Y(2130), 46, 26, 20, { style: 'glass', wall: 0x6a7a8a });
    // the Hondōri arcade: a long glass barrel vault over the shopping street, people walking under it (live)
    {
      const a0 = 2140;
      const a1 = 2186;
      objects.push({
        y: Y(a0) + 2,
        shadow: () => shadowRect(2, Y(a1) + 4, W, a1 - a0, 0.55),
        draw: () => {
          const YT = (Y(a1) - 6) * S;
          const YB = (Y(a0) - 6) * S;
          const skip = (X) => Math.abs((X + 0.5) / S - WEST_CX) <= WEST_HW + 1 || Math.abs((X + 0.5) / S - EAST_CX) <= EAST_HW + 1;
          for (let Yy = YT; Yy < YB; Yy++) {
            const t = Math.sin(((Yy - YT) / (YB - YT)) * Math.PI);
            for (let X = 0; X < FW; X++) {
              if (skip(X)) continue;
              const k = X % 24;
              // the barrel vault: steel ribs, purlins, panes of glass taking the sky, the shoppers dim below
              if (k < 2) img.px(X, Yy, k === 0 ? 0xe8eef2 : 0x8a949c);
              else if ((Yy - YT) % 36 < 2) img.px(X, Yy, (Yy - YT) % 36 === 0 ? 0xd0d8de : 0x8a949c);
              else {
                let c = t > 0.8 ? 0xc8e4f0 : t > 0.45 ? 0x9cc8dc : 0x6e9ab0;
                if (Math.abs(((X + (Yy - YT) * 0.6) % 96) - 30) < 7) c = scaleColor(c, 1.14);
                img.px(X, Yy, c, 0.82);
              }
            }
          }
          // the front: the lit shop signs along its foot
          for (let X = 0; X < FW; X++) {
            if (skip(X)) continue;
            for (let j = 0; j < 18; j++) {
              const Yr = YB + j;
              if (j < 5) img.px(X, Yr, j === 0 ? 0xc0c8d0 : 0x6a7078);
              else {
                const b = Math.floor(X / 21);
                const col = [0xffe0a0, 0xe84a3a, 0x4a4048, 0xf0f0e8, 0x3a8ac8, 0xffe0a0][b % 6];
                img.px(X, Yr, X % 21 < 2 ? 0x24242a : j < 12 ? (j === 5 ? 0x24242a : col) : hashPx(X >> 2, b, 303) < 0.5 ? 0x4a4048 : 0x3a3438);
              }
            }
          }
        },
      });
      reserveRect(0, Y(a1) - 7, W, a1 - a0 + 8);
      for (let k = 0; k < 10; k++) {
        const c = COATS[k % COATS.length];
        const lane = a0 + 10 + ((k * 7) % 28);
        const pts = k % 2 ? [[px0 + 2, lane], [px1 - 2, lane]] : [[px1 - 2, lane], [px0 + 2, lane]];
        kit.path(pts, [walker(c, 0, lane), walker(c, 1, lane)], { sp: 4 + (k % 3), mode: 'pp', hold: 1, turn: 'flip', fps: 3, s0: (k * 0.37) % 1, a: 0.75 });
      }
    }
    // the Honkawa: gangi on both banks, a rowing boat, a cruise boat, glints
    {
      const ru = (HONKAWA[0] + HONKAWA[1]) / 2;
      flagFill(0, Y(HONKAWA[0]), W, 8, C.paving, 302);
      flagFill(0, Y(HONKAWA[1] + 8), W, 8, C.paving, 303);
      gangi(0, W, HONKAWA[0] - 1, 1);
      gangi(0, W, HONKAWA[1], -1);
      for (const [x0, x1] of [[0, 22], [46, 140], [156, W]])
        for (let x = x0 + 3; x < x1; x += 14) {
          tree(x, Y(HONKAWA[0] - 5), 4, C.willow, 2100 + x);
          tree(x + 6, Y(HONKAWA[1] + 6), 4, C.sakuraAut, 2200 + x);
        }
      const row = sprite(9, 5, ru, (r) => {
        // a rowing boat: planks, thwarts, somebody at the oars
        for (let i = 0; i < 27; i++) {
          const hw = Math.min(5, 1 + (26 - i) * 0.45, 1 + i * 0.7);
          for (let j = -hw; j <= hw; j++) r.px(i, 7 + j, hw - Math.abs(j) < 1 ? 0x5e3a20 : i % 7 === 0 ? 0x6a4428 : 0xa8784a);
        }
        r.discPx(13, 7, 2.4, 0x3a6ad0);
        r.px(13, 6, 0x2a2024);
        r.px(14, 6, 0xe8c0a0);
        for (let j = 0; j < 14; j++) r.px(12, j, 0xc8a878);
      });
      kit.path([[20, ru - 10], [160, ru - 14]], [row], { sp: 5, mode: 'pp', hold: 2, d: 0.02, turn: 'flip', wake: { f: wakeF0(ru), every: 6, life: 1.4 } });
      const cruise = sprite(16, 7, ru, (r) => {
        const FL = 48;
        const FH = 21;
        const mid = (FH - 1) / 2;
        for (let X = 0; X < FL; X++) {
          // (its bow to the left: it goes west)
          const hw = Math.min(FH / 2 - 1, 1 + Math.pow(X, 0.7) * 1.1);
          for (let Yy = 0; Yy < FH; Yy++) {
            const a = Math.abs(Yy - mid);
            if (a > hw) continue;
            const e = hw - a;
            r.px(X, Yy, e < 1 ? (Yy > mid ? 0x8a9098 : 0xffffff) : e < 2.2 ? 0xd83828 : 0xeef2f6);
          }
        }
        for (let Yy = 5; Yy < FH - 5; Yy++)
          for (let X = 14; X < FL - 7; X++) {
            const e = Math.min(Yy - 5, FH - 6 - Yy);
            r.px(X, Yy, e === 0 ? (Yy === 5 ? 0xffffff : 0x1e4a3e) : e < 2 ? ((X >> 1) % 3 ? 0x9ad0d0 : 0x14342c) : 0x2a6a5a);
          }
      });
      kit.path([[W + 18, ru + 10], [-18, ru + 10]], [cruise], { sp: 11, d: 0.02, turn: 'none', wake: { f: wakeF0(ru), every: 5, life: 1.6 } });
      kit.spot([[0, HONKAWA[1] - 4, W, 82]], glintF0(ru), { rate: 1.4, fps: 6, a: 0.75 });
    }
    // Mazda Stadium: red seats full of Carp fans in red, the grass in mown stripes, the diamond, the scoreboard;
    // a wave runs round the stands now and then (live)
    {
      const [s0, s1] = STADIUM;
      const cx = 93;
      const home = [cx, s0 + 16];
      flagFill(px0, Y(s1), px1 - px0, s1 - s0, C.paving, 311);
      const inField = (x, u) => {
        const dx = x - home[0];
        const du = u - home[1];
        const r = Math.hypot(dx, du);
        const a = Math.atan2(dx, du); // 0 = straight out to centre field
        return du > -6 && Math.abs(a) < Math.PI * 0.27 + (r < 14 ? 1.2 : 0) && r < 112;
      };
      const standOf = (x, u) => {
        const dx = x - home[0];
        const du = u - home[1];
        const r = Math.hypot(dx, du);
        const a = Math.abs(Math.atan2(dx, du));
        if (inField(x, u)) return 0;
        if (r < 128 && du > -14 && a < Math.PI * 0.62) return 1;
        return 0;
      };
      const seatParts = [];
      for (let u = s0 + 2; u < s1 - 2; u++) for (let x = px0 + 2; x < px1 - 2; x++) if (!inField(x, u) && standOf(x, u) && (x + u) % 7 === 0) seatParts.push([x, u]);
      const sr = rng(312);
      img.fine(px0 + 2, Y(s1 - 2), px1 - px0 - 4, s1 - s0 - 4, (X, Yy, x, y) => {
        const u = L - y;
        const dx = x - home[0];
        const du = u - home[1];
        const r = Math.hypot(dx, du);
        if (inField(x, u)) {
          // grass, mown in two ways; the dark infield soil; the white lines; the warning track and its padded wall
          let c = Math.floor((dx + du) / 6) % 2 ? C.lawn[2] : C.lawn[1];
          if (Math.floor((dx - du) / 6) % 2) c = scaleColor(c, 1.05);
          const g = hashPx(X, Yy, 313);
          if (g < 0.12) c = scaleColor(c, 0.93);
          else if (g > 0.92) c = scaleColor(c, 1.06);
          const ix = Math.abs(dx - du) / Math.SQRT2;
          const iy = Math.abs(dx + du) / Math.SQRT2;
          if (r < 34 && du > -4) {
            c = rampColor(C.dirt, 0.3 + fbm(x, y, { seed: 312, scale: 2 }) * 0.4, X, Yy);
            if (g < 0.1) c = scaleColor(c, 0.9);
          }
          if (ix < 17 && iy < 17 && Math.max(ix, iy) < 15) c = Math.floor((dx + du) / 4) % 2 ? C.lawn[2] : C.lawn[1];
          if (Math.abs(Math.abs(dx) - du) < 0.3 && du >= 0) c = 0xf4f4f0;
          if (Math.hypot(dx, du - 19) < 2.5) c = Math.hypot(dx, du - 19) < 0.7 ? 0xf4f4f0 : C.dirt[2];
          if (r > 100 && r <= 104) c = rampColor(C.dirt, 0.4, X, Yy);
          if (r > 104) c = r > 106 ? 0x2a6a3a : 0xe8d040;
          return c;
        }
        if (standOf(x, u)) {
          // the rows of the bowl, the aisles; fans in Carp red, a few banners and the white of a shirt
          const row = Math.floor(r * 1.5);
          const a = Math.atan2(dx, du);
          if (r % 9 < 0.5) return C.concrete[2];
          if (Math.abs((a * 18) % 1) < 0.07 && r % 9 > 0.5) return C.concrete[1];
          if (row % 2 === 0 && Yy % 3 === 0) return 0x5a1414;
          const seat = hashPx(Math.floor(a * 90), row, 314);
          if (seat < 0.6) {
            const k = (X + row) % 3;
            const h = hashPx(Math.floor(a * 90), row, 315);
            const col = h < 0.72 ? 0xd82828 : h < 0.82 ? 0xf0f0f0 : h < 0.92 ? 0xe83a3a : h < 0.97 ? 0x2a2a34 : 0xe8c040;
            return k === 0 ? 0xe8c0a0 : col;
          }
          return (row & 1) ? C.seats[1] : C.seats[2];
        }
        return null;
      });
      void sr;
      // the bases and home plate
      for (const [bx, bu] of [[home[0], home[1]], [home[0] + 17, home[1] + 17], [home[0], home[1] + 34], [home[0] - 17, home[1] + 17]]) img.rectPx(bx * S, Y(bu) * S, 4, 4, 0xf8f8f8);
      // the scoreboard beyond centre field and the light towers
      objects.push({
        y: Y(s1 - 10),
        shadow: () => shadowRect(cx - 14, Y(s1 - 2), 34, 10, 0.55),
        draw: () => {
          const X0 = (cx - 18) * S;
          const Y0 = Y(s1 - 2) * S;
          const br = rng(s1);
          for (let j = -3; j < 27; j++)
            for (let i = 0; i < 108; i++) {
              let c = j < 0 ? (j === -3 ? 0xf05a4a : 0xd82828) : i < 2 || i > 105 || j > 24 ? 0x3a3c44 : 0x14161c;
              if (j > 2 && j < 8 && i > 6 && i < 60 && (i % 5) < 3 && br() < 0.7) c = 0xf8e040;
              if (j > 10 && j < 22 && i > 6 && i < 102 && (i % 9) > 1 && ((j - 10) % 4) < 3 && br() < 0.5) c = (i % 18) < 9 ? 0x48d070 : 0xf8f4e8;
              img.px(X0 + i, Y0 + j, c);
            }
          for (const lx of [px0 + 4, px1 - 6]) {
            const X = lx * S;
            const Yy = Y(s1 - 30) * S;
            for (let j = 0; j < 36; j++) {
              img.px(X, Yy + j, 0x8a8e94);
              img.px(X + 1, Yy + j, 0x4a4e54);
            }
            for (let j = -9; j < 0; j++)
              for (let i = -6; i <= 7; i++) {
                const lamp = (i + 6) % 3 !== 2 && (j + 9) % 3 !== 2;
                if (lamp) glowPx(X + i, Yy + j, 0xffffff, 0.9);
                else img.px(X + i, Yy + j, 0x4a4e54);
              }
          }
        },
      });
      reserveRect(px0, Y(s1), px1 - px0, s1 - s0);
      // the players in white, the wave running round the stands (bright frames over the seats, phased by angle)
      const player = [walker(0xf4f4f0, 0, s0 + 40, 0xc81c1c), walker(0xf4f4f0, 1, s0 + 40, 0xc81c1c)];
      for (const [x, u] of [[cx, s0 + 36], [cx + 14, s0 + 32], [cx - 14, s0 + 32], [cx + 30, s0 + 70], [cx - 30, s0 + 70], [cx, s0 + 92]]) kit.wander(x, u, 3, 3, player, { n: 1, sp: 2, idle: 0.8, turn: 'flip', fps: 2 });
      const fan = sprite(1, 2, s0 + 60, (r) => {
        for (let i = 0; i < 3; i++) {
          r.px(i, 0, 0xffffff);
          r.px(i, 1, 0xf0d0b0);
          r.px(i, 2, 0xf04848);
          r.px(i, 3, 0xf04848);
          r.px(i, 4, 0xd82828);
        }
      });
      const parts = seatParts.map(([x, u]) => [0, x, u + 1, -Math.atan2(x - home[0], u - home[1]) * 2.2]);
      kit.wave([fan], parts, { w: 0.9, a0: 0, a1: 0.9, pw: 12 });
    }
    // the blocks to the coast (turret plaza kept open), the outer blocks along the delta
    flagFill(px0, Y(2546), px1 - px0, 30, C.plaza, 321);
    reserveRect(px0, Y(2546), px1 - px0, 30);
    district(px0, px1, 2468, 2690, 'office');
    district(0, 21, 1996, 2192, 'town');
    district(157, W, 1996, 2192, 'town');
    district(0, 21, 2298, 2690, 'office');
    district(157, W, 2298, 2690, 'office');
    strollers(92, 2530, 40, 10, 6);

    // ---- Miyajimaguchi: the Hiroden terminus, the ferry terminal under its long wooden-louvred roof, the old
    // anago-meshi shop, the ferry piers
    {
      flagFill(0, Y(QUAY_U), W, QUAY_U - 2708, C.plaza, 331);
      tramBedFill(2706, 2821);
      for (const [x0, x1] of [[22, 28], [41, 47]]) {
        flagFill(x0, Y(2822), x1 - x0, 110, C.granite, 332, 12);
        // the tactile yellow line along the platform's edge
        img.fine(x1 === 28 ? 27 : x0, Y(2822), 1, 110, (X) => (X % S === 1 ? 0xe8d848 : null));
      }
      for (const [x0, x1] of [[22, 28], [41, 47]]) for (let u = 2716; u < 2800; u += 3) crowd(x0 + 1, Y(u), x1 - x0 - 2, 1, 1, true);
      objects.push({
        y: Y(2760),
        shadow: () => shadowRect(24, Y(2836) + 3, 26, 76, 0.55),
        draw: () => {
          for (const x0 of [21, 40]) {
            // the platform roofs: ribbed sheet, a green fascia
            img.fine(x0, Y(2818), 8, 54, (X, Yy) => {
              const i = X - x0 * S;
              if (i < 2) return 0xf0f2f4;
              if (i > 21) return 0x7a8088;
              return (Yy - Y(2818) * S) % 12 < 2 ? 0x9aa0a8 : i % 6 === 0 ? 0xb8bcc0 : 0xd8dcde;
            });
            for (let X = x0 * S; X < (x0 + 8) * S; X++) for (let j = 0; j < 3; j++) img.px(X, Y(2766) * S + j, j === 2 ? 0x1a4a30 : 0x2a6a4a);
          }
          // the terminus building
          roof(18, Y(2846), 34, 22, C.kawara, { hip: true, noshi: false });
          facade(18, Y(2824), 34, 6, 'plain', { wall: C.plaster[1] });
          img.fine(30, Y(2820), 10, 2, (X, Yy) => (Yy - Y(2820) * S < 1 ? 0x4a8a6a : 0x2a6a4a));
          glow(24, Y(2821), C.warm, 0.8);
          glow(46, Y(2821), C.warm, 0.8);
        },
      });
      reserveRect(18, Y(2846), 34, 88);
      // the ferry terminal
      objects.push({
        y: Y(2808),
        shadow: () => shadowRect(60, Y(2862) + 4, 72, 52, 0.55),
        draw: () => {
          // the long roof of wooden louvres, skylights let into it; a glass front on slim columns, lit in the evening
          const X0 = 56 * S;
          const X1 = 126 * S;
          const Y0 = (Y(2864) - 8) * S;
          const Y1 = (Y(2822) - 8) * S;
          for (let Yy = Y0; Yy < Y1; Yy++)
            for (let X = X0; X < X1; X++) {
              const e = Math.min(X - X0, Yy - Y0);
              const e2 = Math.min(X1 - 1 - X, Y1 - 1 - Yy);
              let c = (X - X0) % 6 < 2 ? C.hinoki[1] : hashPx((X - X0) >> 3, (Yy - Y0) >> 4, 333) < 0.5 ? C.hinoki[2] : C.hinoki[3];
              if ((Yy - Y0) % 30 < 2) c = C.hinoki[0];
              if (e < 2) c = C.hinoki[3];
              else if (e2 < 2) c = C.hinoki[0];
              img.px(X, Yy, c);
            }
          for (let x = 60; x < 122; x += 12) img.fine(x, Y(2850) - 8, 6, 6, (X, Yy) => (X % 6 === 0 || Yy % 6 === 0 ? 0x8a9aa8 : Yy % 12 < 6 ? 0xc8e4f0 : 0xa8c8dc));
          const FY = Y1;
          const FB = Y(2810) * S;
          for (let Yy = FY; Yy < FB; Yy++)
            for (let X = 58 * S; X < 124 * S; X++) img.px(X, Yy, (X - 58 * S) % 18 < 2 ? C.concrete[3] : Yy < FY + 12 ? ((X + Yy) % 36 < 8 ? 0xb0d0e4 : 0x8ab0c8) : (Yy - FY) % 12 === 0 ? 0x8a9aa8 : 0x4a6a80);
          for (let X = 58 * S; X < 124 * S; X++) for (let j = 0; j < 3; j++) img.px(X, FB + j, j === 0 ? C.concrete[1] : C.concrete[0]);
          for (let x = 62; x < 122; x += 6) glow(x, Y(2812), C.warm, 0.6);
        },
      });
      reserveRect(56, Y(2864) - 9, 70, 64);
      // the piers out to the pontoons, with a canopy for the queue
      for (const [x0, x1] of [[72, 83], [98, 109]]) {
        img.fine(x0, Y(3010), x1 - x0, 3010 - QUAY_U, (X, Yy) => {
          const e = Math.min(X - x0 * S, x1 * S - 1 - X);
          if (e === 0) return C.concrete[4];
          if (e < 3) return C.concrete[1];
          return X % 15 === 0 || Yy % 15 === 0 ? C.paving[0] : rampColor(C.paving, 0.4 + hashPx(X >> 3, Yy >> 3, 334) * 0.3, X, Yy);
        });
        for (let u = QUAY_U + 4; u < 2990; u += 14) for (const X of [x0 * S + 1, x1 * S - 2]) img.discPx(X, Y(u) * S, 1.6, C.gold);
        objects.push({
          y: Y(QUAY_U + 6),
          draw: () => {
            // the queue's canopy, translucent, its ribs and gutters
            img.fine(x0 + 1, Y(2960), x1 - x0 - 2, 86, (X, Yy) => {
              const e = Math.min(X - (x0 + 1) * S, (x1 - 1) * S - 1 - X);
              if (e < 2) return [e === 0 ? 0xf0f4f6 : 0x8a9098, 1];
              if ((Yy - Y(2960) * S) % 18 < 2) return [0xb0b6bc, 1];
              return [(X + (Yy >> 2)) % 24 < 3 ? 0xf0f4f6 : 0xd8dcde, 0.88];
            });
          },
        });
        crowd(x0 + 2, Y(2950), x1 - x0 - 4, 70, 14, true);
        objects.push({
          y: Y(3000),
          shadow: () => shadowRect(x0 + 2, Y(3016), x1 - x0 + 4, 14, 0.6),
          draw: () => {
            // the pontoon where the ferries berth: steel plate, tyres, the yellow edge
            img.fine(x0 - 2, Y(3016), x1 - x0 + 4, 12, (X, Yy) => {
              const j = Yy - Y(3016) * S;
              const e = Math.min(X - (x0 - 2) * S, (x1 + 2) * S - 1 - X);
              if (j < 2) return 0xb8bcc2;
              if (e < 2 || j > 30) return X % 9 < 5 ? 0x24242a : 0x6a7078;
              if (j > 27) return 0xe8d848;
              return X % 18 === 0 || j % 12 === 0 ? 0x565c64 : (X + j) % 4 === 0 ? 0x7a8088 : 0x6a7078;
            });
          },
        });
      }
    }

    // ---- live traffic: Hiroden trams (Green Mover Max, the A-bombed 650s), cars and buses, keeping left
    // (frames face right; the route turns them)
    const tramF = (len, body, band, roofC) => {
      const r = new HiCanvas(len, 5);
      const FL = len * S;
      const FH = 15;
      const segs = len > 20 ? 5 : 1;
      for (let Yy = 0; Yy < FH; Yy++)
        for (let X = 0; X < FL; X++) {
          const e = Math.min(Yy, FH - 1 - Yy);
          if ((X < 2 || X > FL - 3) && e < 2) continue;
          let c = e < 1 ? (Yy === 0 ? scaleColor(band, 1.15) : scaleColor(band, 0.7)) : e < 3 ? band : Yy < 7 ? scaleColor(roofC, 1.08) : roofC;
          if (X % Math.floor(FL / segs) < 2 && segs > 1) c = 0x2a2a30;
          if (X > FL - 6 && e >= 2) c = 0x2a3440;
          if (X < 4 && e >= 2) c = 0x2a3440;
          r.px(X, Yy, c);
        }
      // the air conditioners and pantograph on its roof
      for (let X = 9; X < FL - 12; X += Math.max(18, Math.floor(FL / 5))) for (let j = 5; j < 10; j++) for (let i = 0; i < 9; i++) r.px(X + i, j, j === 5 ? 0xc8ccd0 : i % 3 === 0 ? 0x6a6e74 : 0x9aa2aa);
      const PX = Math.floor(FL / 2);
      r.linePx(PX - 6, 7, PX + 6, 7, 0x2a2a30);
      r.linePx(PX, 3, PX, 11, 0x2a2a30);
      for (const j of [3, 11]) {
        r.px(FL - 1, j, 0xfff4c8);
        r.px(FL - 2, j, 0xfff4c8);
      }
      return kit.frame(tod.frame(r, 1500));
    };
    const greenMover = tramF(30, 0xe8ecec, 0x2c7a48, 0xd0d6da);
    const t650 = tramF(14, 0xe8dcb8, 0x2c5a3a, 0x7a8a6a);
    const t653 = tramF(14, 0x3a6aa8, 0x2a4a7a, 0x8aa0b8);
    const lex = tramF(24, 0xf0f2f2, 0x48a058, 0xd8dcde);
    const carF = CARS.map((col) => {
      const r = new HiCanvas(7, 4);
      const FL = 21;
      const FH = 12;
      for (let j = 0; j < FH; j++)
        for (let i = 0; i < FL; i++) {
          if ((i === 0 || i === FL - 1) && (j === 0 || j === FH - 1)) continue;
          let c = j === 0 ? scaleColor(col, 1.2) : j === FH - 1 ? scaleColor(col, 0.7) : col;
          const a = FL - 1 - i;
          const inner = j > 0 && j < FH - 1;
          if (a >= 4 && a < 7) c = inner ? 0x283440 : scaleColor(col, 0.6);
          else if (a >= 7 && a < 15 && inner) c = scaleColor(col, 1.14);
          else if (a >= 15 && a < 17) c = inner ? 0x34404c : scaleColor(col, 0.6);
          r.px(i, j, c);
        }
      for (const j of [1, FH - 2]) {
        r.px(FL - 1, j, 0xfff4c8);
        r.px(0, j, 0xd82820);
      }
      for (const j of [-1, FH]) r.px(13, j, scaleColor(col, 0.8));
      return kit.frame(tod.frame(r, 1500));
    });
    const busF = (body, band) => {
      const r = new HiCanvas(12, 5);
      const FL = 36;
      const FH = 15;
      for (let j = 0; j < FH; j++)
        for (let i = 0; i < FL; i++) {
          if ((i === 0 || i === FL - 1) && (j === 0 || j === FH - 1)) continue;
          const e = Math.min(j, FH - 1 - j);
          let c = e < 1 ? scaleColor(band, j === 0 ? 1.15 : 0.7) : e < 3 ? band : body;
          if (i > FL - 5 && e >= 1) c = 0x2a3440;
          if (i >= 6 && i < FL - 8 && j >= 5 && j < 10) c = (i - 6) % 9 < 6 ? (j === 5 ? 0xe0e4e8 : (i + j) % 2 ? 0x8a8e94 : 0xb8bcc0) : body;
          r.px(i, j, c);
        }
      for (const j of [2, FH - 3]) r.px(FL - 1, j, 0xfff4c8);
      return kit.frame(tod.frame(r, 1500));
    };
    const busRed = busF(0xf0ece0, 0xc8302a);
    const busGreen = busF(0xf0ece0, 0x2c7a48);
    const visible = (u) => {
      const tMid = (u - anchor) / V;
      return [Math.max(0, tMid - 16), tMid + 6];
    };
    const [wb, eb] = T720;
    const nbArc = arcPts(7.5, false);
    const sbArc = arcPts(12.5, true);
    const trafficDefs = [
      // the trams: in along Aioi-dōri, round the curve and up the boulevard to Miyajimaguchi, and back
      { pts: [[-34, eb], ...nbArc, [31.5, 2805]], sp: 24, n: 5, gap: 560, s0: 0.12, size: [31, 5], frames: [greenMover, t650, lex, t653, greenMover], cars: 1 },
      { pts: [[36.5, 2805], ...sbArc, [-34, wb]], sp: 24, n: 5, gap: 560, size: [31, 5], frames: [t650, greenMover, greenMover, lex, t653], cars: 1 },
      // the boulevard's car lanes, turning in and out at Aioi-dōri and Route 2
      { pts: [[-15, eb], [26.5, eb], [26.5, 2697.5], [-15, 2697.5]], sp: 34, n: 6, gap: 460, size: [7, 4], frames: [carF[0], carF[2], busGreen, carF[4]], cars: 1 },
      { pts: [[-15, 2702.5], [41.5, 2702.5], [41.5, wb], [-15, wb]], sp: 32, n: 6, gap: 460, size: [12, 5], frames: [carF[1], busRed, carF[3], carF[5]], cars: 1 },
      // the east avenue
      { pts: [[192, wb], [145, wb], [145, 2702.5], [192, 2702.5]], sp: 35, n: 5, gap: 520, size: [12, 5], frames: [carF[4], carF[6], busRed, carF[0]], cars: 1 },
      { pts: [[192, 2697.5], [151, 2697.5], [151, eb], [192, eb]], sp: 31, n: 5, gap: 520, size: [7, 4], frames: [carF[3], carF[7], carF[1]], cars: 1 },
      // through traffic on the cross streets
      { pts: [[-12, 147.5], [192, 147.5]], sp: 30, n: 3, gap: 80, size: [12, 5], frames: [carF[2], busGreen, carF[5]], cars: 1 },
      { pts: [[192, 142.5], [-12, 142.5]], sp: 28, n: 3, gap: 90, size: [7, 4], frames: [carF[6], carF[0], carF[3]], cars: 1 },
      { pts: [[-12, 1240.5], [192, 1240.5]], sp: 30, n: 2, gap: 96, size: [7, 4], frames: [carF[2], carF[7]], cars: 1 },
      { pts: [[192, 1235.5], [-12, 1235.5]], sp: 30, n: 2, gap: 96, size: [7, 4], frames: [carF[5], carF[1]], cars: 1 },
      { pts: [[-12, HEIWA + 5], [192, HEIWA + 5]], sp: 34, n: 3, gap: 70, size: [12, 5], frames: [carF[0], busRed, carF[4]], cars: 1 },
      { pts: [[-12, HEIWA + 9], [192, HEIWA + 9]], sp: 28, n: 2, gap: 110, size: [7, 4], frames: [carF[3], carF[6]], cars: 1 },
      { pts: [[192, HEIWA - 5], [-12, HEIWA - 5]], sp: 33, n: 3, gap: 76, size: [12, 5], frames: [carF[1], carF[2], busGreen], cars: 1 },
      { pts: [[192, HEIWA - 9], [-12, HEIWA - 9]], sp: 27, n: 2, gap: 120, size: [7, 4], frames: [carF[7], carF[5]], cars: 1 },
      { pts: [[-12, 2462.5], [192, 2462.5]], sp: 30, n: 2, gap: 96, size: [7, 4], frames: [carF[0], carF[6]], cars: 1 },
      { pts: [[192, 2457.5], [-12, 2457.5]], sp: 30, n: 2, gap: 96, size: [7, 4], frames: [carF[4], carF[2]], cars: 1 },
    ];
    const s0s = planTraffic(trafficDefs, visible, { seed: 7721 });
    trafficDefs.forEach((r, idx) => {
      kit.path(r.pts, r.frames, { sp: r.sp, n: r.n, gap: r.gap, s0: s0s[idx], turn: 'rot', cars: r.cars, d: 0.45 });
    });
  }


  // ------------------------------------------------------------ 7. Hiroshima Bay, u = 2870..4520
  {
    // pine islets (the bay turret pads stand on two of them): granite, a fringe of black pines, a tiny shrine
    for (const isl of bayIslets) {
      tree(isl.x - 9, Y(isl.u + 5), 4, C.pine, isl.x + 1, 'pine');
      tree(isl.x + 9, Y(isl.u - 6), 4.5, C.pine, isl.x + 2, 'pine');
    }
    for (const [ix, iu] of [[160, 3420], [18, 3650], [22, 3990], [150, 4080], [152, 4345]]) {
      for (let k = 0; k < 4; k++) tree(ix - 6 + ((k * 7) % 13), Y(iu - 6 + ((k * 5) % 13)), 3.5 + (k % 2), C.pine, ix * 3 + iu + k, 'pine');
    }
    // a little vermilion torii on the rocks of the western islet, a lighthouse on the eastern one
    objects.push({
      y: Y(3642),
      draw: () => {
        const X = 18 * S;
        const Yy = Y(3642) * S;
        for (const dx of [-10, 9]) for (let j = -18; j < 1; j++) for (let i = 0; i < 2; i++) img.px(X + dx + i, Yy + j, i ? C.vermilion[1] : C.vermilion[3]);
        for (let i = -14; i <= 14; i++) {
          const up = Math.round((i * i) / 90);
          img.px(X + i, Yy - 21 - up, 0x2a2026);
          img.px(X + i, Yy - 20 - up, 0x2a2026);
          img.px(X + i, Yy - 19 - up, C.vermilion[3]);
          img.px(X + i, Yy - 18 - up, C.vermilion[2]);
        }
        for (let i = -11; i <= 11; i++) for (let j = 0; j < 2; j++) img.px(X + i, Yy - 14 + j, j ? C.vermilion[1] : C.vermilion[2]);
      },
    });
    objects.push({
      y: Y(4074),
      shadow: () => shadowRect(152, Y(4074) - 3, 4, 4, 0.6),
      draw: () => {
        const y = Y(4074);
        const X = 148 * S;
        const Yy = y * S;
        // a little white lighthouse with a red band, its gallery and lamp
        for (let j = -36; j < 0; j++) {
          const hw = 5 + (j + 36) * 0.08;
          for (let i = -Math.round(hw); i <= hw; i++) {
            let c = i < 0 ? 0xffffff : i > hw * 0.5 ? 0xb8bcc2 : 0xe8e8e4;
            if (j > -26 && j < -18) c = i < 0 ? 0xe84a3a : i > hw * 0.5 ? 0x8a2418 : 0xd83a2a;
            img.px(X + 6 + i, Yy + j, c);
          }
        }
        for (let i = -7; i <= 7; i++) {
          img.px(X + 6 + i, Yy - 37, 0x2a2a30);
          img.px(X + 6 + i, Yy - 38, 0x4a4a52);
        }
        for (let j = -43; j < -38; j++) for (let i = -3; i <= 3; i++) glowPx(X + 6 + i, Yy + j, 0xfff4c0, 0.95);
        for (let i = -4; i <= 4; i++) img.px(X + 6 + i, Yy - 44, 0x2a2a30);
      },
    });

    // the bamboo oyster rafts (kaki-ikada): poles lashed in a grid, the floats under them, the ropes of oysters
    // hanging into the water between; the work boats moored alongside
    const RAFTS = [
      [22, 3170], [48, 3190], [150, 3200],
      [22, 3290], [134, 3300], [160, 3320],
      [22, 3480], [122, 3490], [150, 3520],
      [24, 3740], [116, 3730], [146, 3760],
      [96, 3980], [126, 4010], [154, 3990],
      [104, 4210], [136, 4230], [160, 4250],
      [60, 3200], [74, 3200], [122, 3320], [46, 3290], [136, 3490], [164, 3530],
      [46, 3620], [60, 3620], [116, 3600], [130, 3600], [38, 3740], [62, 3860], [76, 3860],
      [130, 3880], [144, 3880], [82, 4060], [96, 4060], [88, 4190], [60, 4300], [74, 4300],
    ];
    for (const [rx, ru] of RAFTS) {
      const ry = Y(ru);
      const rw = 11;
      const rh = 13;
      objects.push({
        y: ry + rh + 1,
        draw: () => {
          const CX = rx * S;
          const CY = ry * S;
          const RW = rw * S;
          const RH = rh * S;
          const rr = rng(rx * 31 + ru);
          // the ropes of oysters hanging into the water, dark and pale shells catching the light under the surface
          for (let j = -RH - 3; j < RH + 5; j++) for (let i = -RW - 3; i < RW + 5; i++) img.px(CX + i, CY + j, 0x061820, 0.34);
          for (let j = -RH + 3; j < RH; j += 6)
            for (let i = -RW + 3; i < RW; i += 6) {
              img.discPx(CX + i, CY + j, 2, 0x0a2028, 0.6);
              if (rr() < 0.7) img.px(CX + i, CY + j, rr() < 0.5 ? 0xa8b8b0 : 0x6a8a84, 0.7);
            }
          // the shadow of the raft on the water
          for (let j = -RH + 4; j <= RH + 4; j++) for (let i = -RW + 4; i <= RW + 4; i++) if (i % 12 < 3 || (j + 40) % 9 < 2) img.px(CX + i, CY + j, 0x061820, 0.22);
          // the floats along its sides: white drums, rocking a little
          for (let i = -RW + 3; i <= RW; i += 12) {
            for (const sy of [-RH - 4, RH + 4]) {
              const c = (i + sy) % 5 === 0 ? 0x2a4a6a : 0xf4f6f6;
              img.discPx(CX + i, CY + sy, 2.6, scaleColor(c, 0.8));
              img.discPx(CX + i - 0.5, CY + sy - 0.5, 1.8, c);
            }
          }
          for (let j = -RH; j <= RH; j += 12) {
            for (const sx of [-RW - 4, RW + 4]) {
              const X = CX + sx;
              const Yy = CY + j;
              img.discPx(X, Yy, 3, 0xc8ccd0);
              img.discPx(X - 0.6, Yy - 0.6, 2.2, 0xf4f6f6);
            }
          }
          // the poles: bamboo with its nodes, long ones down the raft, cross poles; lashings where they meet
          for (let j = -RH; j <= RH; j += 6) {
            const off = Math.floor(rr() * 15);
            const old = rr() < 0.3;
            const heavy = (j + RH) % 18 === 0;
            for (let i = -RW - 4 - (j % 4 === 0 ? 2 : 0); i <= RW + 4 + (j % 4 === 0 ? 1 : 0); i++) {
              const node = (i + 300 + off) % 15 === 0;
              img.px(CX + i, CY + j, node ? 0x8a6e38 : old ? 0xb8ac88 : 0xe4c886);
              if (heavy) img.px(CX + i, CY + j + 1, node ? 0x6a5228 : old ? 0x8a8064 : 0xa88850);
            }
          }
          for (let i = -RW; i <= RW; i += 6) {
            const off = Math.floor(rr() * 15);
            const old = rr() < 0.3;
            const heavy = (i + RW) % 12 === 0;
            for (let j = -RH - 4; j <= RH + 4; j++) {
              const node = (j + 300 + off) % 15 === 0;
              img.px(CX + i, CY + j, node ? 0x8a6e38 : old ? 0xc0b490 : 0xecd08e);
              if (heavy) img.px(CX + i + 1, CY + j, node ? 0x6a5228 : old ? 0x8a8064 : 0xb89458);
            }
          }
          for (let j = -RH; j <= RH; j += 6) for (let i = -RW; i <= RW; i += 6) if ((i + j) % 4 === 0) img.px(CX + i, CY + j, 0x4a3a20);
          // the flag that says whose it is; a worker's plank and a pile of baskets on some
          for (let k = 0; k < 7; k++) img.px(CX, CY - k, 0x4a3a20);
          for (let k = 0; k < 5; k++) for (let j = 0; j < 3; j++) img.px(CX + 1 + k, CY - 6 + j, 0xf25c30);
          if ((rx + ru) % 3 === 0) {
            for (let j = -14; j < -5; j++) for (let i = 6; i < 24; i++) img.px(CX + i, CY + j, j === -14 ? 0xc8a878 : (i >> 1) % 3 ? 0xa8845a : 0x6a5238);
          }
        },
      });
    }
    // the oyster work boats: one moored at a raft hauling ropes on its little crane, others going about
    /** A boat from above, its bow to the right: a pointed hull, its deck, and whatever paint() puts on it. */
    const hullF = (w, h, u, hullC, deck, paint) =>
      sprite(w, h, u, (r) => {
        const FL = w * S;
        const FH = h * S;
        const mid = (FH - 1) / 2;
        for (let X = 0; X < FL; X++) {
          const t = FL - 1 - X;
          const hw = Math.min(FH / 2 - 0.5, 1 + Math.pow(t, 0.72) * (FH / 2 / Math.pow(FL * 0.3, 0.72)));
          for (let Yy = 0; Yy < FH; Yy++) {
            const a = Math.abs(Yy - mid);
            if (a > hw) continue;
            const e = hw - a;
            let c = e < 1.2 ? (Yy > mid ? scaleColor(hullC, 0.66) : scaleColor(hullC, 1.2)) : e < 2.4 ? hullC : deck;
            if (X < 2) c = scaleColor(hullC, 0.66);
            r.px(X, Yy, c);
          }
        }
        paint(r, FL, FH);
      });
    const workBoat = hullF(14, 7, 3500, 0x5a7aa0, 0xd8dcde, (r, FL, FH) => {
      // the wheelhouse aft, oyster baskets heaped on the deck, the little crane over the side
      for (let j = 5; j < FH - 5; j++) for (let i = 6; i < 16; i++) r.px(i, j, j === 5 ? 0xffffff : j === FH - 6 ? 0x2a4a6a : i > 13 ? 0x2c3e50 : 0x3a5a7a);
      for (let k = 0; k < 9; k++) {
        const i = 19 + (k % 3) * 4;
        const j = 6 + (k >> 1) * 2;
        r.rectPx(i, j, 3, 2, k % 2 ? 0xa8845a : 0x7a8a7a);
      }
      r.linePx(26, FH / 2, 34, 1, 0xe8a030);
      r.linePx(26, FH / 2 + 1, 34, 2, 0xb87a20);
    });
    for (const [x, u] of [[38, 3290], [108, 3490], [134, 3760]]) kit.loop(x - 7, u + 4, [workBoat], { d: 0.02 });
    kit.path([[30, 3176], [140, 3206], [110, 3496], [30, 3486]], [workBoat], { sp: 8, mode: 'pp', hold: 6, d: 0.02, turn: 'rot', wake: { f: wakeF0(3300), every: 5, life: 1.6 } });
    kit.path([[118, 3980], [152, 4240], [110, 4216]], [workBoat], { sp: 7, mode: 'pp', hold: 7, s0: 0.4, d: 0.02, turn: 'rot', wake: { f: wakeF0(4100), every: 5, life: 1.6 } });
    // a fishing boat drifting with its lines out
    const fishing = hullF(10, 5, 3800, 0xe8e4d8, 0xc8c0b0, (r, FL, FH) => {
      for (let j = 3; j < FH - 3; j++) for (let i = 8; i < 14; i++) r.px(i, j, j === 3 ? 0x5a8aba : i > 11 ? 0x1a3a5a : 0x2a5a8a);
      r.px(20, 7, 0xd04040);
      r.px(20, 6, 0x2a2024);
      for (let k = 0; k < 12; k++) r.px(20 + k, 6 - Math.floor(k * 0.4), 0x2a2a2a, 0.7);
    });
    kit.wander(80, 3600, 14, 40, [fishing], { n: 1, sp: 2, turn: 'rot', idle: 0.6, d: 0.02 });
    kit.wander(56, 4080, 12, 30, [fishing], { n: 1, sp: 2, turn: 'rot', idle: 0.6, d: 0.02 });
    // channel buoys bobbing
    const buoy = (c) => [0, 1].map((f) => sprite(4, 5, 3600, (r) => {
      // a channel buoy: a cage on a float, its reflection and the ripple round it
      for (let i = 1; i < 11; i++) r.px(i, 12 + f, 0xe8f4f4, 0.5);
      for (let j = 0; j < 12; j++) {
        const hw = 1 + j * 0.25;
        for (let i = -Math.round(hw); i <= hw; i++) r.px(6 + i, j + f, i < 0 ? scaleColor(c, 1.2) : i > hw * 0.5 ? scaleColor(c, 0.7) : c);
      }
      r.px(6, f, 0xffffff);
    }));
    for (const [x, u, c] of [[96, 3200, 0xd83a2a], [66, 3200, 0x2a8a4a], [84, 3700, 0xd83a2a], [54, 3700, 0x2a8a4a], [60, 4200, 0xd83a2a], [26, 4200, 0x2a8a4a]])
      kit.loop(x, u, buoy(c), { fps: 1.2 });
    // the JR and Matsudai ferries, pier to pier with their white wakes, and the Aqua Net boat in from the city
    // (frames face right, bow first: the route turns them to their heading)
    const ferry = (band, deck) =>
      hullF(30, 13, 3600, band, 0xf2f4f8, (r, FL, FH) => {
        // the car deck aft with its cars, the passenger saloon, its rows of windows, the funnel, the bridge forward, people at the rail
        for (let k = 0; k < 6; k++) {
          const i = 4 + (k % 3) * 9;
          const j = 7 + (k >> 1) * 8;
          const col = CARS[k % CARS.length];
          for (let a = 0; a < 7; a++) for (let b = 0; b < 4; b++) r.px(i + a, j + b, a > 1 && a < 5 ? scaleColor(col, 1.14) : col);
        }
        for (let j = 9; j < FH - 9; j++)
          for (let i = 30; i < 72; i++) {
            const e = Math.min(j - 9, FH - 10 - j);
            r.px(i, j, e === 0 ? (j === 9 ? 0xffffff : 0x8a96a2) : e < 3 ? ((i >> 1) % 3 ? 0x2c4e6c : deck) : (i - 30) % 12 === 0 ? 0xb8c0c8 : deck);
          }
        for (let j = 12; j < FH - 12; j++) for (let i = 57; i < 69; i++) r.px(i, j, i === 57 ? 0xc8ccd0 : i > 65 ? 0x2c4e6c : 0xf8f8fa);
        r.discPx(45, FH / 2, 4.5, band);
        r.discPx(45, FH / 2, 2.4, 0x2a2a30);
        const pr = rng(band & 1023);
        for (let k = 0; k < 14; k++) {
          const i = 28 + Math.floor(pr() * 46);
          const j = pr() < 0.5 ? 6 + Math.floor(pr() * 2) : FH - 8 + Math.floor(pr() * 2);
          r.px(i, j, 0x2a2024);
          r.px(i, j + 1, pr.pick(COATS));
        }
      });
    const jrFerry = ferry(0x1e3c7a, 0xdbe4ec);
    const mtFerry = ferry(0xc8302a, 0xe4e8ec);
    kit.path([[77, 3032], [74, 3420], [52, 3960], [26, 4382]], [jrFerry], { sp: 15, mode: 'pp', hold: 4, turn: 'rot', d: 0.25, wake: { f: wakeF0(3600), every: 4, life: 1.8 } });
    kit.path([[103, 3032], [96, 3520], [70, 4020], [36, 4382]], [mtFerry], { sp: 14, s0: 0.52, mode: 'pp', hold: 4, turn: 'rot', d: 0.25, wake: { f: wakeF0(3600), every: 4, life: 1.8 } });
    const aqua = hullF(20, 8, 3800, 0xd83a2a, 0xf4f6f8, (r, FL, FH) => {
      for (let j = 5; j < FH - 5; j++)
        for (let i = 9; i < FL - 15; i++) {
          const e = Math.min(j - 5, FH - 6 - j);
          r.px(i, j, e === 0 ? (j === 5 ? 0xffffff : 0x4a5a70) : e < 3 ? ((i >> 1) % 3 ? 0x8ac0f0 : 0x14283e) : 0x1e3c6a);
        }
    });
    kit.path([[W + 20, 3100], [120, 3600], [64, 4200], [44, 4392]], [aqua], { sp: 20, mode: 'pp', hold: 6, turn: 'rot', d: 0.25, s0: 0.25, wake: { f: wakeF0(3800), every: 4, life: 1.6 } });
    // gulls wheeling over the rafts, glints across the bay
    const gullF = [0, 1].map((f) => sprite(5, 3, 3600, (r) => {
      for (let i = 0; i < 15; i++) {
        const a = Math.abs(i - 7);
        const y = f ? 3 + a * 0.35 : 5 - a * 0.25;
        r.px(i, y, a > 5 ? 0x4a5058 : 0xffffff);
        if (a < 5) r.px(i, y + 1, 0xd0d8e0);
      }
      r.px(7, 3, 0xffffff);
      r.px(8, 4, 0xe8a030);
    }));
    kit.orbit(40, 3240, 20, gullF, { ry: 14, w: 0.7, n: 3, d: 0.7 });
    kit.orbit(140, 3500, 22, gullF, { ry: 16, w: -0.65, n: 3, d: 0.7 });
    kit.orbit(130, 4000, 20, gullF, { ry: 14, w: 0.6, n: 2, d: 0.7 });
    kit.spot([[0, 3400, W, 500], [0, 3950, W, 520], [0, 4450, W, 480]], glintF0(3800), { rate: 3, fps: 6, a: 0.7 });
    // cat's-paws of wind and small swells running across the bay (slow, faint, on the water only)
    {
      const cp = [0, 1, 2].map((k) =>
        sprite(26, 12, 3800, (r) => {
          const cr = rng(900 + k);
          for (let n = 0; n < 60; n++) {
            const X = 6 + Math.floor(cr() * 66);
            const Yy = 4 + Math.floor(cr() * 28);
            const d = Math.hypot((X - 39) / 36, (Yy - 18) / 16);
            if (d > 1) continue;
            const len = 3 + Math.floor(cr() * 6);
            for (let i = 0; i < len; i++) r.px(X + i, Yy, 0xd8f0f4, 0.5 * (1 - d));
          }
        }),
      );
      kit.spot([[8, 3300, 150, 260], [8, 3900, 150, 300], [8, 4400, 150, 260]], cp, { rate: 0.5, fps: 3, a: 0.55 });
    }
  }

  // ------------------------------------------------------------ helpers of the island (sections 8 and 9)
  /** Setts laid in courses: long stones, staggered, each its own tone. */
  const settPx = (X, Yy, seed = 0, ramp = C.paving) => {
    const r = Math.floor(Yy / 5);
    const XX = X + r * 4;
    if (Yy % 5 === 0 || XX % 9 === 0) return scaleColor(ramp[0], 0.82);
    let c = rampColor(ramp, 0.15 + hashPx(Math.floor(XX / 9), r, seed + 81) * 0.75, X, Yy);
    const g = hashPx(X, Yy, seed + 82);
    if (g < 0.06) c = scaleColor(c, 0.91);
    else if (g > 0.97) c = scaleColor(c, 1.07);
    return c;
  };
  /** A beaten earth trail with roots, pebbles and fallen leaves. */
  const earthPx = (X, Yy, seed = 0) => {
    let c = rampColor(C.dirt, 0.2 + hashPx(X >> 2, Yy >> 1, seed + 83) * 0.55, X, Yy);
    const g = hashPx(X, Yy, seed + 84);
    if (g > 0.985) c = 0xd65a28;
    else if (g > 0.97) c = 0xe0a030;
    else if (g < 0.05) c = 0x6e6a60;
    else if (g < 0.12) c = scaleColor(c, 0.88);
    return c;
  };
  /**
   * A way through the island: everything within hw of the polyline pts [x, u], with round corners and a kerb, so
   * branches join their road cleanly. paint(X, Yy, d, x, y) gives the surface (default setts); kerb: its colour.
   */
  const way = (pts, hw, opt = {}) => {
    const P = pts.map(([x, u]) => [x, L - u]);
    const x0 = Math.floor(Math.min(...P.map((p) => p[0])) - hw - 1);
    const x1 = Math.ceil(Math.max(...P.map((p) => p[0])) + hw + 1);
    const y0 = Math.floor(Math.min(...P.map((p) => p[1])) - hw - 1);
    const y1 = Math.ceil(Math.max(...P.map((p) => p[1])) + hw + 1);
    const kerb = opt.kerb === undefined ? C.stone[1] : opt.kerb;
    const paint = opt.paint ?? ((X, Yy) => settPx(X, Yy, opt.seed ?? 0));
    img.fine(Math.max(0, x0), y0, Math.min(W, x1) - Math.max(0, x0), y1 - y0, (X, Yy, x, y) => {
      if (fineWater[Yy * FW + X] && !opt.overWater) return null;
      let d = 1e9;
      for (let k = 0; k + 1 < P.length; k++) {
        const [ax, ay] = P[k];
        const [bx, by] = P[k + 1];
        const vx = bx - ax;
        const vy = by - ay;
        const t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy || 1)));
        d = Math.min(d, Math.hypot(x - ax - t * vx, y - ay - t * vy));
      }
      if (d > hw) return null;
      if (kerb !== null && d > hw - 0.55) return hashPx(X >> 1, Yy >> 1, 85) < 0.5 ? kerb : scaleColor(kerb, 1.14);
      return paint(X, Yy, d, x, y);
    });
    for (let k = 0; k + 1 < P.length; k++) {
      const n = Math.ceil(Math.hypot(P[k + 1][0] - P[k][0], P[k + 1][1] - P[k][1]) / 2);
      for (let i = 0; i <= n; i++) {
        const cx = P[k][0] + ((P[k + 1][0] - P[k][0]) * i) / Math.max(1, n);
        const cy = P[k][1] + ((P[k + 1][1] - P[k][1]) * i) / Math.max(1, n);
        reserveRect(cx - hw, cy - hw, hw * 2, hw * 2);
      }
    }
  };
  /** Woods: n trees in a rectangle, skipping reserved ground, water and whatever skip(x, y) refuses. */
  const woods = (x0, x1, u0, u1, n, pals, seed, rMin, rMax, skip) => {
    const g = rng(seed);
    for (let k = 0; k < n; k++) {
      const x = x0 + g() * (x1 - x0);
      const u = u0 + g() * (u1 - u0);
      const r = rMin + g() * (rMax - rMin);
      const pal = pals[Math.floor(g() * pals.length)];
      const y = Y(u);
      if (anyRes(x - r * 0.7, y - r * 0.5, r * 1.4, r * 1.2) || W_(Math.round(x), y) || wet[y * W + Math.round(x)] || skip?.(x, y)) continue;
      tree(x, y, r, pal, seed * 7 + k * 131, pal === C.pine ? 'pine' : 'broadleaf');
    }
  };
  /** People standing on something drawn as an object (a deck, a terrace), so they stay on top of it. */
  const standing = (x0, y0, w, h, n, seed, cols = COATS) => {
    const g = rng(seed);
    for (let i = 0; i < n; i++) {
      const x = x0 + g() * w;
      const y = y0 + g() * h;
      const coat = g() < 0.65 ? cols[Math.floor(g() * cols.length)] : 0x3a3a4a;
      const X = Math.round(x * S);
      const Yy = Math.round(y * S);
      objects.push({ y: y + 1.7, draw: () => personPx(X, Yy, rng(X * 977 + Yy * 13), { coat }) });
    }
  };
  /** A granite boulder: lumpy outline, facets catching the low sun, cracks, lichen and moss on its top. */
  const boulderPx = (bx, bu, rx, ry, seed, moss = 0.5) => {
    const by = Y(bu);
    const sc = Math.max(2.4, rx * 0.3);
    objects.push({
      y: by + ry,
      shadow: () => shadowEllipse(bx + 3, by + 3, rx, ry * 0.8, 0.6),
      draw: () =>
        img.fine(bx - rx - 2, by - ry - 2, 2 * rx + 4, 2 * ry + 4, (X, Yy, x, y) => {
          const dx = x - bx;
          const dy = y - by;
          const d = (dx / rx) ** 2 + (dy / ry) ** 2 + (fbm(x, y, { seed: seed + 800, scale: rx * 0.7, octaves: 2 }) - 0.5) * 0.7;
          if (d > 0.84) return null;
          const h = fbm(x, y, { seed: seed + 801, scale: sc, octaves: 3 });
          const h2 = fbm(x + 0.8, y + 0.8, { seed: seed + 801, scale: sc, octaves: 3 });
          const sh = 0.5 - (dx / rx) * 0.3 - (dy / ry) * 0.42 + (h - h2) * 6;
          let c = rampColor(C.granite, Math.max(0.02, Math.min(0.98, sh)), X, Yy);
          if (Math.abs(fbm(x, y, { seed: seed + 802, scale: sc * 1.4 }) - 0.5) < 0.012) c = scaleColor(c, 0.62);
          if (dy < 0 && fbm(x, y, { seed: seed + 803, scale: 2.4, octaves: 2 }) > 1.02 - moss * (0.6 - dy / ry * 0.5)) c = rampColor(C.moss, 0.3 + hashPx(X >> 1, Yy >> 1, 86) * 0.6, X, Yy);
          if (d > 0.72 && dx + dy > 0) c = scaleColor(c, 0.78);
          const g = hashPx(X, Yy, seed & 255);
          return g < 0.07 ? scaleColor(c, 0.9) : g > 0.96 ? scaleColor(c, 1.08) : c;
        }),
    });
    reserveRect(bx - rx * 0.9, by - ry * 0.9, rx * 1.8, ry * 1.8);
  };
  /** A boat from above, its bow to the right: a pointed hull, its deck, and whatever paint() puts on it. */
  const hullIsle = (w, h, u, hullC, deck, paint) =>
    sprite(w, h, u, (r) => {
      const FL = w * S;
      const FHh = h * S;
      const mid = (FHh - 1) / 2;
      for (let X = 0; X < FL; X++) {
        const t = FL - 1 - X;
        const hw = Math.min(FHh / 2 - 0.5, 1 + Math.pow(t, 0.72) * (FHh / 2 / Math.pow(FL * 0.3, 0.72)));
        for (let Yy = 0; Yy < FHh; Yy++) {
          const a = Math.abs(Yy - mid);
          if (a > hw) continue;
          const e = hw - a;
          let c = e < 1.2 ? (Yy > mid ? scaleColor(hullC, 0.66) : scaleColor(hullC, 1.2)) : e < 2.4 ? hullC : deck;
          if (X < 2) c = scaleColor(hullC, 0.66);
          r.px(X, Yy, c);
        }
      }
      paint(r, FL, FHh);
    });

  // the island's woods stand on a floor of moss and leaf litter, its slopes catching the low sun
  {
    const cell = new Float32Array(W * (L + 2));
    const hAt = (x, y) => fbm(x, y, { seed: 731, scale: 34, octaves: 3 });
    for (let y = Y(6570); y < Y(5000); y++) for (let x = 0; x < W; x++) cell[y * W + x] = (hAt(x + 1.5, y + 1.5) - hAt(x - 1.5, y - 1.5)) * 4.2;
    const yEnd = Y(4530);
    img.fine(0, Y(6570), W, yEnd - Y(6570), (X, Yy, x, y) => {
      const i = Yy * FW + X;
      if (fineWater[i] || shoreD[i] <= 5) return null;
      const u = L - y;
      if (u < 5000 && x > 30 && x < 150) return null;
      const n = 0.12 + fbm(x, y, { seed: 732, scale: 8, octaves: 2 }) * 0.62;
      const cy = Math.max(0, Math.min(L, Math.floor(y)));
      const rel = cell[cy * W + Math.floor(x)];
      const c = lawnPx(X, Yy, n, C.moss, true);
      return scaleColor(c, Math.max(0.68, Math.min(1.14, 0.86 + rel)));
    });
  }

  // ---- Miyajimaguchi's forecourt (drawn here for the helpers above): the bus and taxi loop round its garden, the
  // stops, the row of anago-meshi shops along their lanes, the car park, bicycles, the lamps along the quay
  {
    const cx = 91;
    const cu = 2752;
    const bx = 36;
    const by = 26;
    const rr = 18;
    const cy = L - cu;
    const sd = (x, y) => {
      const qx = Math.abs(x - cx) - bx + rr;
      const qy = Math.abs(y - cy) - by + rr;
      return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rr;
    };
    const kerbC = C.concrete[2];
    const road = { paint: (X, Yy) => asphaltPx(X, Yy), kerb: kerbC };
    // the two stems off Route 2: square onto its edge, kerbs either side
    for (const sx of [70, 112])
      img.fine(sx - 6, Y(2732), 12, 2732 - 2704, (X, Yy, x) => (Math.abs(x - sx) > 5.2 ? kerbC : asphaltPx(X, Yy)));
    void road;
    img.fine(cx - bx - 8, Math.floor(cy - by - 8), 2 * bx + 16, 2 * by + 16, (X, Yy, x, y) => {
      const d = sd(x, y);
      if (d > 6.4) return null;
      const stem = y > cy && (Math.abs(x - 70) < 5 || Math.abs(x - 112) < 5);
      if (d > 5.6) return stem ? asphaltPx(X, Yy) : kerbC;
      if (d > -5.6) {
        if (Math.abs(x - 91) < 4.5 && (y < cy - 8 || y > cy + 8)) return X % 6 < 3 ? 0xe4e4dc : asphaltPx(X, Yy);
        if (Math.abs(d) < 0.3 && Math.floor((Math.atan2((y - cy) / by, (x - cx) / bx) + 4) * 22) % 2) return 0xd8d4c0;
        return asphaltPx(X, Yy);
      }
      if (d > -6.4) return kerbC;
      // the garden in the middle: lawn, a flagged walk across it, a round bed of chrysanthemums with a stone at its heart
      const r = Math.hypot(x - cx, y - cy);
      if (r < 2) return (X + Yy) % 3 ? C.granite[3] : C.granite[4];
      if (r < 9.4) {
        const ring = Math.floor(r / 2.4) % 3;
        const g = hashPx(X >> 1, Yy >> 1, 261);
        if (g < 0.22) return 0x3e6a34;
        return [0xf4d040, 0xe85a30, 0xf4f0e0][ring];
      }
      if (r < 11) return settPx(X, Yy, 26, C.granite);
      if (Math.abs(x - 91) < 3) return settPx(X, Yy, 27, C.granite);
      return lawnPx(X, Yy, 0.25 + fbm(x, y, { seed: 262, scale: 7 }) * 0.55, C.lawn, true);
    });
    reserveRect(cx - bx - 7, cy - by - 7, 2 * bx + 14, 2 * by + 14);
    for (const [x, u] of [[66, 2742], [66, 2762], [116, 2742], [116, 2762], [76, 2770], [106, 2770], [76, 2734], [106, 2734]]) tree(x, Y(u), 4.6, x % 4 ? C.camphor : C.pine, x * 7 + u, x % 4 ? 'broadleaf' : 'pine');
    for (const [x, u] of [[74, 2752], [104, 2752]]) bench(x, Y(u), 5);
    // the forecourt under the terminal's front: people, planters, the stops with their shelters
    crowd(56, Y(2808), 70, 14, 34, true);
    for (const x of [58, 124]) tree(x, Y(2800), 4.4, C.camphor, x + 2800, 'broadleaf');
    for (const sx of [62, 78, 98, 114]) {
      crowd(sx, Y(2790), 10, 2, 4, true);
      objects.push({
        y: Y(2787),
        shadow: () => shadowRect(sx + 1, Y(2792), 12, 3, 0.72),
        draw: () => {
          const X0 = sx * S;
          const Y0 = Y(2793) * S;
          for (let i = 0; i < 36; i++)
            for (let j = 0; j < 8; j++) img.px(X0 + i, Y0 + j, j === 0 ? 0xf4f6f8 : j === 7 ? 0x4a5058 : i % 6 === 0 ? 0x9aa2aa : 0xd0e0e8);
          for (const i of [2, 33]) img.rectPx(X0 + i, Y0 + 8, 1, 10, 0x4a5058);
          img.rectPx(X0 + 16, Y0 + 8, 2, 12, 0x2a3a6a);
          img.rectPx(X0 + 14, Y0 + 8, 6, 5, 0xf4f4f0);
          img.rectPx(X0 + 15, Y0 + 9, 4, 1, sx < 90 ? 0x2a6a4a : 0xc83a2a);
        },
      });
    }
    strollers(90, 2798, 30, 6, 6);
    // buses and taxis round the loop, keeping left (clockwise), and up and down the two stems
    const vehicle = (len, wid, body, top, glass = 0x2a3440) =>
      sprite(len, wid, 2760, (r) => {
        const FL = len * S;
        const FW2 = wid * S;
        for (let Yy = 0; Yy < FW2; Yy++)
          for (let X = 0; X < FL; X++) {
            const e = Math.min(Yy, FW2 - 1 - Yy);
            if ((X < 2 || X > FL - 3) && e < 2) continue;
            let c = e < 1 ? (Yy === 0 ? scaleColor(body, 1.16) : scaleColor(body, 0.66)) : e < 2 ? body : top;
            if (X > FL - 7 && e >= 2) c = glass;
            if (X < 3 && e >= 2) c = glass;
            r.px(X, Yy, c);
          }
        if (len > 10) for (let X = 9; X < FL - 12; X += 12) for (let j = 5; j < FW2 - 5; j++) for (let i = 0; i < 6; i++) r.px(X + i, j, j === 5 ? 0xd8dce0 : i % 2 ? 0x8a9098 : 0xa8aeb4);
        else for (let X = 5; X < FL - 9; X++) for (let j = 4; j < FW2 - 4; j++) r.px(X, j, glass);
        for (const j of [2, FW2 - 3]) r.px(FL - 1, j, 0xfff4c8);
      });
    const d45 = 23.5 * 0.7071;
    const a = (dx, dy) => [cx + dx, cu + dy];
    const loop = [a(-18, 28.5), a(18, 28.5), a(18 + d45, 8 + d45), a(38.5, 8), a(38.5, -8), a(18 + d45, -8 - d45), a(18, -28.5), a(-18, -28.5), a(-18 - d45, -8 - d45), a(-38.5, -8), a(-38.5, 8), a(-18 - d45, 8 + d45), a(-18, 28.5)];
    kit.path(loop, [vehicle(16, 5, 0x2a7a5a, 0xe8ecec)], { sp: 12, n: 1, turn: 'rot', d: 0.45, s0: 0.1 });
    kit.path(loop, [vehicle(16, 5, 0xc83a2a, 0xf4f0e8)], { sp: 12, n: 1, turn: 'rot', d: 0.45, s0: 0.6 });
    kit.path(loop, [vehicle(8, 4, 0xe8c040, 0xf0e8c8)], { sp: 12, n: 1, turn: 'rot', d: 0.45, s0: 0.32 });
    kit.path(loop, [vehicle(8, 4, 0x2a3a6a, 0xdfe4ec)], { sp: 12, n: 1, turn: 'rot', d: 0.45, s0: 0.82 });
    // the shop rows east of the loop, on their sett lanes: tiles, noren, signboards, the anago-meshi steaming
    const NOR = [0x2a3a5a, 0x8a2a2a, 0x2a5a3a, 0x6a3a6a, 0x1e2a44, 0xa84a20];
    for (const [u0, u1] of [[2728, 2742], [2758, 2772]]) {
      img.fine(134, Y(u1), 46, u1 - u0, (X, Yy) => settPx(X, Yy, 28));
      reserveRect(134, Y(u1), 46, u1 - u0);
      const lu = (u0 + u1) / 2;
      for (let k = 0; k < 3; k++) {
        const c = COATS[(k * 2 + u0) % COATS.length];
        kit.path(k % 2 ? [[176, lu - 2 + k * 2], [136, lu - 2 + k * 2]] : [[136, lu - 2 + k * 2], [176, lu - 2 + k * 2]], [walker(c, 0, 2760), walker(c, 1, 2760)], { sp: 3, mode: 'pp', hold: 3, turn: 'flip', fps: 3, s0: k * 0.3 });
      }
      // paper lanterns strung over the lane
      for (let X = 136 * S; X < 178 * S; X++) img.px(X, Y(lu) * S, 0x2a2a30, 0.45);
      for (let X = 139 * S; X < 178 * S; X += 18) {
        img.rectPx(X, Y(lu) * S + 1, 3, 4, 0xe83a24);
        glowPx(X + 1, Y(lu) * S + 2, 0xffd080, 0.8);
      }
    }
    for (const rowU of [2712, 2742, 2772]) {
      let x = 136;
      let k = rowU % 7;
      while (x < 176) {
        const w = Math.min([13, 16, 11, 15, 18][k % 5], 180 - x);
        const hx = x;
        const nc = NOR[k % NOR.length];
        const kk = k;
        hall(hx, Y(rowU + 16), w - 1, 10, 6, kk % 3 === 2 ? C.tileRoof : C.kawara, 'shop', {
          noren: nc,
          wall: C.oldWood[1 + (kk % 3)],
          noshi: kk % 2 === 0,
          extra: () => {
            const fy = (Y(rowU + 16) + 10) * S;
            // the signboard over the door, its characters; a red lantern
            const SW = (w - 5) * S;
            img.rectPx((hx + 2) * S, fy + 2, SW, 5, 0x2a1a14);
            img.rectPx((hx + 2) * S + 1, fy + 3, SW - 2, 3, 0xe8d8b0);
            for (let i = 3; i < SW - 3; i += 4) img.rectPx((hx + 2) * S + i, fy + 4, 2, 1, 0x2a1a14);
            img.rectPx((hx + 1) * S, fy + 8, 3, 5, 0xe83a24);
            glowPx((hx + 1) * S + 1, fy + 10, 0xffd080, 0.8);
          },
        });
        x += w;
        k++;
      }
    }
    kit.emit(142, 2724, stallSteam, { rate: 1.2, life: [1.2, 2], vy: 6, sx: 2, wf: 0.6, a: 0.45, tint: 1 }); // anago-meshi Ueno
    kit.emit(160, 2752, stallSteam, { rate: 0.9, life: [1.2, 2], vy: 6, sx: 2, wf: 0.6, a: 0.4, tint: 1 });
    // the car park behind them: asphalt, white bays, cars nose in, its drive off the loop
    way([[122, 2770], [128, 2780], [128, 2806], [138, 2806]], 3.8, { paint: (X, Yy) => asphaltPx(X, Yy), kerb: null });
    img.fine(136, Y(2858), 43, 62, (X, Yy, x, y) => {
      const e = Math.min(x - 136, 179 - x, y - Y(2858), Y(2796) - y);
      if (e < 0.6) return kerbC;
      const rowY = Math.floor((y - Y(2858)) / 20);
      const inRow = (y - Y(2858)) % 20;
      if ((inRow < 7 || inRow > 13) && X % 18 < 2) return 0xe4e4dc;
      return asphaltPx(X, Yy) + 0 * rowY;
    });
    reserveRect(136, Y(2858), 43, 62);
    {
      const g = rng(2761);
      for (let row = 0; row < 3; row++)
        for (let k = 0; k < 7; k++) {
          if (g() < 0.22) continue;
          const col = CARS[Math.floor(g() * CARS.length)];
          const X0 = 138 * S + k * 18 + 2 + 3;
          const Y0 = (Y(2858) + row * 20) * S + (row === 2 ? 39 : 3);
          objects.push({
            y: (Y0 + 18) / S,
            shadow: () => {
              for (let j = 0; j < 18; j++) for (let i = 0; i < 12; i++) img.tintPx(X0 + i + 2, Y0 + j + 2, 0.72);
            },
            draw: () => {
              for (let j = 0; j < 18; j++)
                for (let i = 0; i < 12; i++) {
                  const e = Math.min(i, 11 - i);
                  if ((j < 1 || j > 16) && e < 1) continue;
                  let c = e < 1 ? (i === 0 ? scaleColor(col, 1.16) : scaleColor(col, 0.68)) : col;
                  if ((j > 3 && j < 7 && e >= 1) || (j > 12 && j < 15 && e >= 1)) c = 0x2a3440;
                  img.px(X0 + i, Y0 + j, c);
                }
            },
          });
        }
    }
    // the west side, under the terminus: two small shops, the covered bicycle stands
    for (const [u, nc] of [[2714, 0x2a5a3a], [2742, 0x8a2a2a]]) hall(1, Y(u + 16), 15, 10, 6, C.kawara, 'shop', { noren: nc, wall: C.oldWood[1] });
    {
      const X0 = 2 * S;
      const g = rng(2762);
      for (let Yy = Y(2846) * S; Yy < Y(2776) * S; Yy += 6) {
        const c = [0xc83a2a, 0x3a6ad0, 0xe8e8e8, 0x2a2a34, 0xe8c040, 0x6aaa5a][Math.floor(g() * 6)];
        if (g() < 0.14) continue;
        img.rectPx(X0, Yy + 1, 30, 1, c);
        img.rectPx(X0, Yy, 2, 3, 0x1a1a20);
        img.rectPx(X0 + 28, Yy, 2, 3, 0x1a1a20);
        img.rectPx(X0 + 8, Yy, 2, 3, scaleColor(c, 0.8));
        img.tintPx(X0 + 14, Yy + 3, 0.8);
      }
      objects.push({
        y: Y(2776),
        shadow: () => shadowRect(2, Y(2846), 13, 72, 0.72),
        draw: () =>
          img.fine(1, Y(2846) - 1, 13, 26, (X, Yy) => {
            const i = X - S;
            if (i < 2 || i > 36) return i === 0 ? 0xf0f4f6 : 0x8a9098;
            return (Yy % 18 < 2) ? 0x9aa2aa : (X + (Yy >> 2)) % 24 < 3 ? 0xf0f4f6 : 0xc4ccd2;
          }),
      });
    }
    // the quay: a rail along the water, lamps and benches; people looking out at the ferries
    {
      const Yq = Y(QUAY_U) * S + 7;
      for (let X = 0; X < FW; X++) {
        const x = X / S;
        if ((x > 70 && x < 84) || (x > 96 && x < 110)) continue;
        img.px(X, Yq, 0xd8dce0);
        img.px(X, Yq + 1, 0x4a5058);
        if (X % 21 < 2) for (let j = 0; j < 7; j++) img.px(X, Yq + j, 0x6a7078);
      }
      for (const x of [8, 32, 56, 122, 146, 170]) {
        streetLamp(x, QUAY_U - 6);
        bench(x + 6, Y(QUAY_U - 7), 5);
      }
      crowd(2, Y(QUAY_U - 3), 66, 3, 10, true);
      crowd(112, Y(QUAY_U - 3), 66, 3, 10, true);
    }
  }

  // ------------------------------------------------------------ 8. Miyajima, u = 4400..5900
  {
    // ---- the ferry pier: flagged, with its kerbs and bollards; covered gangways out to the two pontoons, the
    // yellow guide lines down them, the terminal with its glass front; the queue between its rails
    flagFill(14, Y(4546), 33, 146, C.plaza, 401, 15);
    img.fine(14, Y(4546), 33, 146, (X, Yy) => {
      const e = Math.min(X - 14 * S, 47 * S - 1 - X);
      if (e < 2) return e === 0 ? C.concrete[0] : C.concrete[3];
      if (e === 2) return 0x4a4a4c;
      return null;
    });
    for (const gx of [30.5]) for (let u = 4406; u < 4494; u++) for (let j = 0; j < S; j++) {
      const Yy = Y(u) * S + j;
      if ((Yy >> 1) % 2) for (let i = 0; i < 4; i++) img.px(gx * S + i - 2, Yy, 0xe8c838);
    }
    // the queue rails either side of the middle walk
    for (const gx of [27.5, 33.5]) {
      for (let u = 4410; u < 4490; u++) for (let j = 0; j < S; j++) img.px(gx * S, Y(u) * S + j, 0x88909a);
      for (let u = 4410; u < 4490; u += 8) {
        img.rectPx(gx * S - 1, Y(u) * S, 3, 4, 0x4a5058);
        img.tintPx(gx * S + 2, Y(u) * S + 3, 0.72);
      }
    }
    crowd(28, Y(4488), 5, 76, 18, true);
    crowd(16, Y(4488), 3, 80, 6, true);
    crowd(43, Y(4488), 3, 80, 6, true);
    // planters with little pines, bollards at the edge
    for (const u of [4416, 4446, 4476]) for (const x of [16, 44]) {
      objects.push({
        y: Y(u) + 2,
        shadow: () => shadowRect(x + 1, Y(u) - 1, 4, 4, 0.72),
        draw: () => {
          img.fine(x - 1, Y(u) - 1, 4, 3, (X, Yy, xx, yy) => ((Yy - (Y(u) - 1) * S) < 2 ? C.concrete[4] : yy > Y(u) ? C.concrete[1] : C.concrete[2]));
          img.fine(x, Y(u) - 1, 2, 1, () => 0x3a2a20);
        },
      });
      tree(x + 1, Y(u) - 2, 2.6, C.pine, u + x, 'pine');
    }
    for (let u = 4410; u < 4540; u += 15) for (const x of [14.6, 46]) {
      img.rectPx(x * S, Y(u) * S, 2, 3, 0x2a2e34);
      img.px(x * S, Y(u) * S, 0x6a7078);
    }
    const gangway = (px) => {
      const y0 = Y(4494);
      const y1 = Y(4400);
      objects.push({
        y: y1 + 1,
        shadow: () => shadowRect(px + 1, y0 + 2, 8, y1 - y0, 0.68),
        draw: () =>
          img.fine(px - 1, y0, 8, y1 - y0, (X, Yy, x) => {
            const i = X - (px - 1) * S;
            if (i < 2 || i > 21) return i === 0 || i === 23 ? 0x4a525c : 0xd8dce0;
            const k = (Yy - y0 * S) % 12;
            if (k < 2) return 0xe8ecf0;
            const c = i < 12 ? 0x7aa0c0 : 0x5a84a8;
            return k === 2 ? scaleColor(c, 0.82) : hashPx(X >> 3, Yy >> 3, 402) > 0.9 ? scaleColor(c, 1.08) : c;
          }),
      });
    };
    gangway(19);
    gangway(36);
    // the pontoons: steel decks, their tyres, the yellow edge, a little ramp
    for (const px of [20, 36]) {
      objects.push({
        y: Y(4392),
        shadow: () => shadowRect(px + 1, Y(4404) + 2, 12, 12, 0.62),
        draw: () => {
          const X0 = (px - 3) * S;
          const Y0 = Y(4404) * S;
          for (let j = 0; j < 36; j++)
            for (let i = 0; i < 36; i++) {
              let c = (i >> 1) % 2 ^ (j >> 1) % 2 ? 0x6a7078 : 0x62686f;
              if (i % 12 === 0 || j % 12 === 0) c = 0x4a5058;
              if (i < 2 || i > 33 || j < 2 || j > 33) c = (i + j) % 4 < 2 ? 0xe8d848 : 0x2a2a2c;
              img.px(X0 + i, Y0 + j, c);
            }
          for (let i = 3; i < 36; i += 6) {
            img.rectPx(X0 + i, Y0 + 36, 4, 2, 0x18181c);
            img.px(X0 + i + 1, Y0 + 36, 0x3a3a40);
          }
        },
      });
    }
    // the terminal: grey-tiled gable over a glazed front, its doors, the sign along the eave
    hall(10, Y(4522), 41, 16, 10, C.kawara, 'plain', { wall: 0xe4e0d4, ridgeAt: 0.4, gable: 'tri', gw: 14, crest: false, extra: () => {
      const fy = (Y(4522) + 16) * S;
      for (let X = 13 * S; X < 48 * S; X++) {
        const b = (X - 13 * S) % 12;
        for (let j = 7; j < 27; j++) img.px(X, fy + j, b < 2 ? 0x3a4048 : j < 9 ? 0x8ab0c8 : (X + j) % 7 === 0 ? 0xc0dcec : 0x5a84a0);
      }
      for (let X = 26 * S; X < 35 * S; X++) for (let j = 12; j < 27; j++) img.px(X, fy + j, (X - 26 * S) % 13 < 2 ? 0x2a2e34 : 0x2e4252);
      for (let i = 0; i < 39; i++) img.rectPx(21 * S + i * 1.6, fy + 3, 1, 2, i % 3 === 2 ? 0xe4e0d4 : 0x1a2a50);
    } });
    // the walk from the terminal round to the street and to the shore
    way([[12, 4544], [46, 4544]], 7);
    for (const x of [13, 47]) streetLamp(x, 4534);

    // ---- the shore round the cove: the stone-lantern promenade and the old pines along the water, the sand of
    // Mikasa-hama by the pier where the deer lie about
    const rowsW = new Float32Array(L + 2);
    const rowsE = new Float32Array(L + 2);
    {
      const rawW = (u) => {
        for (let x = 24; x < 92; x++) if (W_(x, Y(u))) return x;
        return 92;
      };
      const rawE = (u) => {
        for (let x = 156; x > 92; x--) if (W_(x, Y(u))) return x;
        return 92;
      };
      for (let u = 4536; u < 5350; u++) {
        let a = 0;
        let b = 0;
        for (let k = -10; k <= 10; k++) {
          a += rawW(Math.max(4546, Math.min(5340, u + k)));
          b += rawE(Math.max(4546, Math.min(5340, u + k)));
        }
        rowsW[u] = a / 21;
        rowsE[u] = b / 21;
      }
    }
    const coastW = (u) => rowsW[Math.round(u)];
    const coastE = (u) => rowsE[Math.round(u)];
    img.fine(25, Y(5342), W - 25, 5342 - 4546, (X, Yy, x, y) => {
      const i = Yy * FW + X;
      if (fineWater[i]) return null;
      const u = L - y;
      const k = Math.floor(u);
      const f = u - k;
      const xl = rowsW[k] + (rowsW[k + 1] - rowsW[k]) * f;
      const xr = rowsE[k] + (rowsE[k + 1] - rowsE[k]) * f;
      const west = x < xl + 9 && x < 92;
      const east = x > xr - 9 && x >= 92;
      if (!west && !east) return null;
      const out = west ? xl - x : x - xr;
      if (out > 12) return null;
      const beach = u < 4760 ? 4.2 : 2.6;
      const sand = () => {
        if (shoreD[i] <= 4) return null;
        const g = hashPx(X, Yy, 404);
        const c = rampColor(C.sand, 0.35 + fbm(x, y, { seed: 404, scale: 4 }) * 0.55, X, Yy);
        return g < 0.09 ? scaleColor(c, 0.9) : g > 0.96 ? 0xe8dcc0 : g < 0.012 ? 0x8a8478 : c;
      };
      if (out < beach) return sand();
      if (out < beach + 0.7) return hashPx(X >> 1, Yy >> 2, 405) < 0.5 ? C.stone[2] : C.stone[3];
      if (out > 11.3) return hashPx(X >> 1, Yy >> 2, 406) < 0.5 ? C.stone[1] : C.stone[2];
      return settPx(X, Yy, 3);
    });
    for (let u = 4546; u < 5340; u++) {
      reserveRect(Math.max(25, Math.floor(coastW(u) - 12)), Y(u), 12, 1);
      reserveRect(Math.ceil(coastE(u)), Y(u), 13, 1);
      if (u % 36 === 0 && u > 4560) {
        stoneLantern(Math.max(27, Math.round(coastW(u) - (u < 4760 ? 6 : 4))), u, true);
        stoneLantern(Math.round(coastE(u) + (u < 4760 ? 6 : 4)), u, true);
      }
      // old pines leaning out over the sand, a bench to sit and look at the torii
      if (u % 52 === 18 && u > 4570 && u < 5150) tree(coastE(u) + 12, Y(u), 5.5, C.pine, u + 7, 'pine');
      if (u % 68 === 40 && u > 4570 && u < 5000) tree(Math.max(27, coastW(u) - 10), Y(u), 4.2, C.pine, u + 19, 'pine');
      if (u % 76 === 30 && u < 5100) {
        const by = Y(u);
        const bx = Math.round(coastE(u) + 7);
        bench(bx, by, 4);
        const bx2 = Math.max(28, Math.round(coastW(u) - 9));
        if (u < 4900) bench(bx2, by + 18, 4);
      }
    }

    // ---- Omotesandō: the covered shopping street from the pier to the shrine. Old two-storey shops along both
    // sides with tiled roofs, noren and red lanterns at the street, wooden signboards on the roofs, momiji-manju
    // bakers steaming; the arcade's glass roof over the street; the great o-shamoji at its end
    {
      const st = [8, 17]; // the street
      img.fine(st[0], Y(5062), st[1] - st[0], 5062 - 4542, (X, Yy) => {
        const c = settPx(X, Yy, 5);
        return (X === st[0] * S + 1 || X === st[1] * S - 2) ? scaleColor(c, 0.74) : c;
      });
      reserveRect(st[0], Y(5062), st[1] - st[0], 520);
      const noren = [0x2a3a6a, 0x8a2a2a, 0x2a5a3a, 0x6a3a6a, 0xd8c8a0, 0x1e2a44, 0xa84a20];
      /** A row of shops along the street: roofs end-on to it, their fronts a strip of noren, lanterns and wares. */
      const row = (x0, x1, front) => {
        const toSt = front > x0 ? 1 : -1; // towards the street
        let u = 4550;
        let k = 0;
        while (u < 5050) {
          const len = 10 + ((k * 7) % 3) * 4 + (k % 7 === 3 ? 4 : 0);
          const y = Y(u + len);
          const w = x1 - x0;
          const two = k % 3 !== 1;
          const ramp = k % 4 === 3 ? C.tileRoof : k % 9 === 5 ? C.hiwada : C.kawara;
          const nc = noren[(k + x0 + 7) % noren.length];
          const uu = u;
          const kk = k;
          objects.push({
            y: y + len,
            shadow: () => shadowRect(x0 + 2, y + 2, w, len, 0.55),
            draw: () => {
              roof(x0, y, w, len - 1, ramp, { ridgeAt: 0.45, noshi: two, bark: ramp === C.hiwada });
              const FX = front * S + (toSt > 0 ? 0 : 2);
              const Y0 = y * S + 2;
              const Y1 = (y + len - 1) * S - 2;
              // the timber front and the noren hung along it, split into its panels
              for (let Yy = Y0; Yy < Y1; Yy++) {
                img.px(FX - toSt, Yy, C.oldWood[1]);
                img.px(FX, Yy, Yy % 6 === 0 ? 0x1a1414 : (Yy >> 1) % 2 ? nc : scaleColor(nc, 0.72));
                img.px(FX + toSt, Yy, Yy % 6 === 0 ? 0x1a1414 : scaleColor(nc, 0.86));
                img.tintPx(FX + toSt * 2, Yy, 0.7);
              }
              // the wares out on the street: a table of boxes, a red-covered bench, baskets of shamoji
              const WX = FX + toSt * 2;
              const kind = kk % 4;
              const Yw = Y0 + 4;
              const Hw = Math.min(14, Y1 - Yw - 3);
              for (let j = 0; j < Hw; j++)
                for (let i = 0; i < 4; i++) {
                  const XX = WX + toSt * i;
                  let c;
                  if (kind === 0) c = j % 3 === 2 ? 0x6a4a2a : [0xd8483a, 0xe8c040, 0xf0ece0, 0x3a7a5a][(j >> 1 ^ i >> 1) & 3];
                  else if (kind === 1) c = j % 5 === 4 ? 0x5a3a22 : 0xc83a2a; // a bench under red felt
                  else if (kind === 2) c = (i + j) % 3 ? 0xd4a86e : 0x9c7244; // wooden rice-paddles in a rack
                  else c = j % 4 === 3 ? 0x5a4a3a : (j >> 2) % 2 ? 0xc89050 : 0xe4b070; // momiji-manju trays
                  img.px(XX, Yw + j, c);
                }
              // the paper lantern, the shop's light on the street
              img.rectPx(FX + toSt * 1 - 1, Y0 + 1, 3, 4, 0xe83a24);
              img.px(FX + toSt, Y0 + 2, 0xff8a50);
              glowPx(FX + toSt, Y0 + 2, 0xffd080, 0.8);
              pool(front + toSt * 2, y + len / 2, 5, C.lamp, 0.16 + dusk(uu) * 0.2);
              if (two && kk % 2 === 0) {
                // a signboard on the roof, its characters
                const SX = (x0 + 2) * S;
                const SY = (y + 2) * S;
                const SW = (w - 4) * S;
                img.rectPx(SX, SY + 6, SW, 1, 0x141014);
                img.rectPx(SX, SY, SW, 6, 0x3a2a1c);
                img.rectPx(SX + 1, SY + 1, SW - 2, 4, 0xe8d8b0);
                for (let i = 3; i < SW - 3; i += 4) img.rectPx(SX + i, SY + 2, 2, 2, 0x2a1a14);
              }
            },
          });
          if (k % 4 === 1) kit.emit(front + toSt * 2, u + len / 2, stallSteam, { rate: 1.1, life: [1.1, 1.8], vy: 5, sx: 1, wf: 0.6, a: 0.42, tint: 1 }); // momiji-manju fresh from the irons
          u += len + (k % 5 === 4 ? 3 : 0);
          k++;
        }
      };
      row(-1, st[0], st[0] - 1);
      row(st[1], 25, st[1]);
      reserveRect(0, Y(5060), 25, 520);
      // the arcade roof: glass between steel ribs, the street showing through, its banners
      objects.push({
        y: Y(4546),
        draw: () => {
          for (let Yy = (Y(5040) - 4) * S; Yy < (Y(4552) - 4) * S; Yy++)
            for (let X = st[0] * S; X < st[1] * S; X++) {
              const rib = Yy % 36 < 2;
              const side = X - st[0] * S < 2 || st[1] * S - 1 - X < 2;
              const pane = X % 9 === 0;
              if (rib || side) img.px(X, Yy, 0xa8b2ba, 0.9);
              else if (pane) img.px(X, Yy, 0xc0ccd4, 0.32);
              else img.px(X, Yy, 0xd4ecf4, (X + Yy) % 19 === 0 ? 0.3 : 0.1);
              if (Yy % 108 < 9 && Yy % 108 > 2 && !side && X - st[0] * S > 8 && st[1] * S - X > 8) img.px(X, Yy, (Yy % 216) < 108 ? 0xc83a2a : 0x2a4a7a, 0.8);
            }
        },
      });
      crowd(st[0], Y(5040), st[1] - st[0] - 1, 488, 70, true);
      // the o-shamoji, eight metres of wood in its case at the street's end
      objects.push({
        y: Y(5040),
        shadow: () => shadowRect(10, Y(5066), 11, 26, 0.6),
        draw: () => {
          const X0 = 8 * S;
          const Y0 = Y(5066) * S;
          const CX = X0 + 13;
          img.rectPx(X0 - 2, Y0 + 72, 31, 6, C.granite[2]);
          img.rectPx(X0 - 2, Y0 + 72, 31, 1, C.granite[4]);
          // the paddle: a broad blade, its long handle, the grain, brushed characters
          for (let j = 2; j < 72; j++) {
            const hw = j < 30 ? 8.5 - Math.max(0, 4 - j) * 0.9 : j < 36 ? 8.5 - (j - 30) * 0.9 : 3;
            for (let i = -Math.round(hw); i <= Math.round(hw); i++) {
              let c = i < -hw * 0.5 ? C.hinoki[3] : i > hw * 0.5 ? C.hinoki[1] : C.hinoki[2];
              if ((i * 3 + (j >> 3)) % 5 === 0) c = scaleColor(c, 0.9);
              img.px(CX + i, Y0 + j, c);
            }
          }
          for (const [i, j] of [[-2, 7], [-1, 7], [0, 7], [1, 7], [0, 8], [0, 9], [-1, 10], [1, 10], [-2, 15], [-1, 14], [0, 13], [1, 14], [2, 15], [-1, 17], [1, 17], [0, 19], [0, 20], [-2, 23], [2, 23], [-1, 22], [1, 22]]) img.px(CX + i, Y0 + j, 0x1a1214);
          // the glass case round it: a frame, a pale sheen
          for (let j = 0; j < 72; j++)
            for (let i = 0; i < 27; i++) {
              const edge = i < 2 || i > 24 || j < 2;
              img.px(X0 + i, Y0 + j, edge ? 0x6a7078 : 0xd4ecf4, edge ? 1 : (i + j) % 11 < 2 ? 0.32 : 0.1);
            }
          for (let i = 0; i < 27; i++) img.px(X0 + i, Y0, 0xd8dcde);
        },
      });
      for (let k = 0; k < 12; k++) {
        const c = COATS[k % COATS.length];
        const x = st[0] + 1 + (k % 3) * 2;
        kit.path([[x, 4552], [x, 5034]], [walker(c, 0, 4800), walker(c, 1, 4800)], { sp: 3 + (k % 3), mode: 'pp', hold: 2, turn: 'none', fps: 3, s0: (k * 0.29) % 1 });
      }
      kit.wander(12, 4800, 2, 200, deerF0(4800), { n: 2, sp: 3, turn: 'flip', fps: 3, idle: 0.7 });
    }
    // the east shore: inns of dark timber, white storehouses, a souvenir house; each behind its clipped hedge with
    // a raked garden and a stone walk out to the promenade
    {
      const KINDS = [
        { w: 21, r: 12, f: 8, st: 'oldwood', wall: C.oldWood[1], bay: 4, roofR: C.kawara, len: 40, lit: true, gable: 'kara' },
        { w: 13, r: 8, f: 7, st: 'plain', wall: 0xf0ece4, roofR: C.kawara, len: 28, kura: true },
        { w: 18, r: 11, f: 7, st: 'oldwood', wall: C.oldWood[2], bay: 3, roofR: C.tileRoof, len: 36, lit: true },
        { w: 22, r: 11, f: 6, st: 'shop', wall: C.oldWood[1], roofR: C.kawara, len: 34, noren: 0x2a3a6a },
        { w: 16, r: 10, f: 8, st: 'oldwood', wall: C.oldWood[0], bay: 3, roofR: C.hiwada, bark: true, len: 32, lit: true },
      ];
      let u = 4556;
      let k = 0;
      while (u < 5150) {
        const K = KINDS[(k * 3 + (k >> 2)) % KINDS.length];
        const x = Math.min(W - K.w + 3, 160 + ((k * 5) % 3) * 2);
        const fu = u + 5; // the foot of the front
        const top = fu + K.r + K.f;
        const cy = coastE(u + 3);
        // the walk from the promenade to the door
        const door = x + Math.floor(K.w / 2);
        way([[cy + 12, u + 2], [door, u + 2], [door, fu]], 1.6, { kerb: null, seed: 7 });
        // the garden in front: raked gravel, a clipped hedge along it
        img.fine(x - 1, Y(fu), Math.min(K.w + 2, W - x + 1), 3, (X, Yy) => {
          if (hashPx(X >> 1, Yy >> 1, 407) < 0.02) return C.gravel[0];
          return (Yy >> 1) % 2 ? C.gravel[2] : C.gravel[3];
        });
        for (let X = (x - 3) * S; X < Math.min(FW, (x + K.w + 2) * S); X++) {
          if (Math.abs(X - door * S) < 7) continue;
          for (let j = 0; j < 6; j++) {
            const g = hashPx(X >> 1, (Y(u) * S + j) >> 1, 408);
            img.px(X, Y(u) * S + j, j === 5 ? 0x1a2a1c : g < 0.4 ? C.camphor[1] : g < 0.8 ? C.camphor[2] : C.camphor[3]);
          }
        }
        const uu = u;
        hall(x, Y(top), K.w, K.r, K.f, K.roofR, K.st, {
          wall: K.wall,
          bay: K.bay,
          noshi: true,
          bark: K.bark,
          noren: K.noren,
          gable: K.gable,
          gw: 8,
          crest: false,
          extra: () => {
            const fy = (Y(top) + K.r) * S;
            if (K.lit) for (let X = (x + 2) * S; X < (x + K.w - 2) * S; X += 9) glowPx(X, fy + K.f * S - 8, 0xffe0a0, 0.5 + dusk(uu) * 0.45);
            if (K.kura) {
              // a white storehouse: the namako wall along its foot, one small dark window
              for (let X = (x + 1) * S; X < (x + K.w - 1) * S; X++) for (let j = 0; j < 9; j++) img.px(X, fy + K.f * S - 9 + j, ((X + j) % 6 === 0 || (X - j) % 6 === 0) ? 0xe8e8e4 : 0x4a4a52);
              img.rectPx((x + K.w / 2 - 1) * S, fy + 5, 6, 5, 0x1a1a20);
              img.rectPx((x + K.w / 2 - 1) * S - 1, fy + 4, 8, 1, 0x7a7a80);
            }
          },
        });
        if (k % 2) stoneLantern(door + 3, fu - 1, true);
        tree(Math.min(177, x + K.w + 1), Y(fu + 4), 3.5, k % 3 ? C.momijiR : C.pine, u + 31, k % 3 ? 'broadleaf' : 'pine');
        if (k % 3 === 1) kit.emit(x + 4, top - 2, thinSmoke, { rate: 0.5, life: [1.4, 2.2], vy: 5, sx: 1, wf: 0.6, a: 0.28, tint: 1 });
        u += K.len + 4;
        k++;
      }
    }
    // the deer of Miyajima, everywhere; visitors; a rickshaw along the west shore
    const deerF = deerF0(4900);
    kit.wander(36, 4600, 4, 40, deerF, { n: 3, sp: 4, turn: 'flip', fps: 3, idle: 0.8 });
    kit.wander(30, 4840, 3, 120, deerF, { n: 2, sp: 4, turn: 'flip', fps: 3, idle: 0.6 });
    kit.wander(150, 4760, 4, 100, deerF, { n: 3, sp: 5, turn: 'flip', fps: 3, idle: 0.5 });
    kit.wander(46, 5180, 5, 40, deerF, { n: 2, sp: 4, turn: 'flip', fps: 3, idle: 0.6 });
    strollers(31, 4800, 2, 220, 6, { sp: 3 });
    strollers(150, 4900, 3, 220, 6, { sp: 3 });
    const rick = [0, 1].map((f) => sprite(9, 6, 4900, (r) => {
      // from above, going right: the hooded seat and its passenger, big wheels, the shafts and the puller in black
      for (let i = 2; i < 13; i++) for (const j of [1, 14]) r.px(i, j, (i + f) % 3 ? 0x1a1a1e : 0x4a4a52);
      for (let j = 3; j < 13; j++) for (let i = 2; i < 13; i++) r.px(i, j, i < 6 ? 0x2a2a30 : j === 3 || j === 12 ? 0x7a1a14 : 0xc83a2a);
      for (let j = 5; j < 11; j++) for (let i = 7; i < 11; i++) r.px(i, j, j < 8 ? 0x3a6ad0 : 0x5a86e0);
      r.rectPx(8, 6, 2, 2, 0xf0d0b0);
      for (let i = 13; i < 21; i++) {
        r.px(i, 4, 0x5a3a20);
        r.px(i, 11, 0x5a3a20);
      }
      for (let j = 5; j < 11; j++) for (let i = 20; i < 24; i++) r.px(i, j, 0x24242c);
      r.rectPx(21, 7, 2, 2, 0xe8d8b0);
      r.px(22, f ? 4 : 11, 0x24242c);
    }));
    kit.path([[29, 4560], [30, 4800], [36, 4980], [46, 5150]], rick, { sp: 6, mode: 'pp', hold: 4, turn: 'rot', fps: 4 });

    // ---- the Great Torii: two camphor pillars and four sleeve pillars in vermilion, the black kasagi with its
    // upswept ends, the tablet; drawn as its own layer so the boats rowing out at high tide pass under it
    {
      const tx = 90;
      const tu = 4842;
      const ty = Y(tu);
      // on the wet sand under it: its shadow, the pillars' reflection trembling in the tide
      for (let X = (tx - 22) * S; X < (tx + 28) * S; X++) for (let j = 0; j < 12; j++) if (fineWater[(ty * S + 6 + j) * FW + X]) img.tintPx(X, ty * S + 6 + j, 0.72 + j * 0.01);
      for (const s of [-1, 1])
        for (let j = 0; j < 36; j++) {
          const wob = Math.round(Math.sin(j * 0.7) * (1 + j * 0.05));
          for (let i = -4; i < 6; i++) img.px((tx + s * 10) * S + i + wob, ty * S + 6 + j, i < 0 ? C.vermilion[3] : C.vermilion[2], (0.42 - j * 0.011) * (j % 3 === 2 ? 0.55 : 1));
        }
      const pillar = (CX, Y0, Y1, hw) => {
        for (let Yy = Y0; Yy < Y1; Yy++)
          for (let i = -hw; i <= hw; i++) {
            const k = (i + hw) / (2 * hw);
            let c = k < 0.2 ? C.vermilion[3] : k < 0.65 ? C.vermilion[2] : k < 0.88 ? C.vermilion[1] : C.vermilion[0];
            if (hashPx(CX + i, Yy >> 2, 411) < 0.1) c = scaleColor(c, 0.9);
            if (Y1 - Yy < 7) c = hashPx(CX + i, Yy, 412) < 0.4 ? 0x3a2a24 : 0x241c20; // weed and barnacles to the tide line
            img.px(CX + i, Yy, c);
          }
        for (let j = 0; j < 2; j++) for (let i = -hw - 1; i <= hw + 1; i++) img.px(CX + i, Y0 + 4 + j, j ? 0x241c20 : 0x4a3a30);
      };
      const torii = capture(tx - 24, ty - 30, 50, 35, () => {
        const CX = tx * S + 1;
        const Yb = (ty + 2) * S;
        for (const s of [-1, 1]) {
          const PX = (tx + s * 10) * S + 1;
          // the sleeve pillars, front and back, tied by their beams
          for (const dx of [-12, 12]) pillar(PX + dx, (ty - 11) * S, Yb + 1, 2);
          for (const Yy of [(ty - 6) * S, (ty - 3) * S]) for (let i = -13; i <= 13; i++) for (let j = 0; j < 3; j++) img.px(PX + i, Yy + j, j === 0 ? C.vermilion[3] : j === 1 ? C.vermilion[2] : C.vermilion[0]);
          for (let i = -15; i <= 15; i++) for (let j = 0; j < 6; j++) img.px(PX + i, (ty - 11) * S + j, j === 0 ? 0x3a3438 : j < 4 ? 0x1a1620 : 0x0e0c12);
          // the great pillar
          pillar(PX, (ty - 20) * S, Yb + 2, 6);
        }
        // the tie-beam, its wedges at the pillars
        for (let i = -45; i <= 45; i++) for (let j = 0; j < 6; j++) img.px(CX + i, (ty - 15) * S + j, j === 0 ? C.vermilion[3] : j < 4 ? C.vermilion[2] : C.vermilion[0]);
        // the double lintel, sweeping up to its ends
        for (let dX = -66; dX <= 67; dX++) {
          const lift = Math.round(((dX - 0.5) ** 2) / 360);
          const Yt = (ty - 24) * S - lift;
          const end = Math.abs(dX) > 60;
          for (let j = 0; j < (end ? 8 : 10); j++) img.px(CX + dX, Yt + j, j < 2 ? 0x48424a : j < 4 ? 0x2a2428 : j < 8 ? 0x16121a : 0x0c0a0e);
          if (Math.abs(dX) <= 54) for (let j = 10; j < 17; j++) img.px(CX + dX, Yt + j, j < 12 ? C.vermilion[3] : j < 15 ? C.vermilion[2] : C.vermilion[0]);
          if (Math.abs(dX) % 18 === 0 && Math.abs(dX) <= 54) img.px(CX + dX, Yt + 12, 0xd8b850);
        }
        // the tablet: dark with a gold frame, its characters
        for (let j = 0; j < 17; j++)
          for (let i = -6; i <= 7; i++) {
            const e = i === -6 || i === 7 || j === 0 || j === 16;
            img.px(CX + i, (ty - 20) * S + j, e ? C.gold : 0x14101a);
          }
        for (const [i, j] of [[-3, 3], [-2, 3], [-1, 3], [0, 3], [1, 3], [2, 3], [3, 3], [0, 5], [-2, 6], [-1, 6], [1, 6], [2, 6], [-3, 9], [-2, 9], [-1, 9], [1, 9], [2, 9], [3, 9], [0, 10], [-1, 12], [1, 12], [0, 13]]) img.px(CX + i, (ty - 20) * S + j, C.goldHi);
      }, { u: tu });
      kit.loop(tx - 24, tu + 30, [torii], { d: 0.3 });
      const ripF = [0, 1, 2].map((f) => sprite(48, 14, tu, (r) => {
        for (const px of [14, 34]) {
          const rad = (3.5 + f * 1.6) * S;
          for (let a = 0; a < Math.PI * 2; a += 0.05) r.px(Math.round(px * S + Math.cos(a) * rad), Math.round(7 * S + Math.sin(a) * rad * 0.45), 0xd8f8ff, 0.5 - f * 0.12);
        }
      }));
      kit.loop(tx - 24, tu + 5, ripF, { fps: 2, d: 0.1, fx: 1 });
      // sappa boats rowing out under the torii and back: a wooden skiff, its passengers, the oarsman at the stern
      const sappa = hullIsle(11, 5, tu, 0x8a5a34, 0xb88a58, (r, FL, FHh) => {
        for (let j = 3; j < FHh - 3; j++) for (const i of [10, 16, 22]) r.px(i, j, 0x6a4424);
        for (const [i, c] of [[12, 0xe8e8e8], [18, 0x3a6ad0]]) r.rectPx(i, 5, 3, 5, c);
        for (const i of [13, 19]) r.px(i, 7, 0xf0d0b0);
        r.rectPx(3, 5, 3, 5, 0x2a2a34);
        r.px(4, 7, 0xe8d8b0);
        r.linePx(4, 7, 0, 1, 0xc8a878);
      });
      kit.path([[90, 4600], [90, 4842], [92, 4990]], [sappa], { sp: 5, mode: 'pp', hold: 5, d: 0.05, turn: 'rot', wake: { f: wakeF0(tu), every: 6, life: 1.6 } });
      kit.path([[60, 4640], [86, 4830], [120, 4900]], [sappa], { sp: 4, mode: 'pp', hold: 7, s0: 0.5, d: 0.05, turn: 'rot', wake: { f: wakeF0(tu), every: 6, life: 1.6 } });
      // a yakatabune: the roofed pleasure boat with its paper lanterns, going round the torii (live)
      const yakata = hullIsle(25, 9, 4700, C.wood[1], C.wood[3], (r, FL, FHh) => {
        for (let j = 6; j < FHh - 6; j++)
          for (let i = 8; i < 56; i++) {
            const mid = Math.abs(j - FHh / 2 + 0.5);
            let c = mid < 1.5 ? C.kawara[0] : j < FHh / 2 ? C.kawara[3] : C.kawara[1];
            if ((i + ((j >> 1) % 2)) % 3 === 0) c = scaleColor(c, 0.84);
            r.px(i, j, c);
          }
        for (let i = 9; i < 56; i += 6) {
          r.rectPx(i, 4, 2, 2, 0xff5a30);
          r.rectPx(i, FHh - 6, 2, 2, 0xff5a30);
          r.px(i, 4, 0xffc080);
          r.px(i, FHh - 6, 0xffc080);
        }
      });
      kit.path([[58, 4760], [90, 4720], [124, 4770], [124, 4900], [90, 4960], [56, 4900], [58, 4760]], [yakata], { sp: 6, d: 0.05, turn: 'rot', wake: { f: wakeF0(4800), every: 6, life: 1.8 } });
      kit.spot([[40, 5000, 100, 420]], glintF0(4800), { rate: 2, fps: 6, a: 0.7 });
    }

    // ---- Itsukushima Shrine, standing on its stilts over the tide: cypress-bark roofs, vermilion everywhere
    {
      const HW = C.hiwada;
      const DK = [0x6e685c, 0x8a8478, 0x9e988a, 0xb4ae9e];
      const SAFE = (X, Yy) => X >= 0 && X < FW && Yy >= 0 && Yy < FH;
      /** A deck of weathered silver planks on vermilion stilts, its shadow on the water, a balustrade round it. */
      const deckNow = (x0, x1, u0, u1, rails = true) => {
        const X0 = x0 * S;
        const X1 = x1 * S;
        const Y0 = (Y(u1) + 1) * S;
        const Y1 = (Y(u0) + 1) * S;
        for (let X = X0; X < X1 + 9; X++) for (let j = 0; j < 13; j++) if (SAFE(X, Y1 + j) && fineWater[(Y1 + j) * FW + X]) img.tintPx(X, Y1 + j, 0.56 + j * 0.03);
        for (let Yy = Y0 + 6; Yy < Y1; Yy++) for (let i = 0; i < 9; i++) if (SAFE(X1 + i, Yy) && fineWater[Yy * FW + X1 + i]) img.tintPx(X1 + i, Yy, 0.56 + i * 0.04);
        for (let X = X0 + 4; X < X1 - 1; X += 15)
          for (let j = 0; j < 8; j++) {
            img.px(X, Y1 + j, j < 6 ? C.vermilion[1] : C.vermilion[0]);
            img.px(X + 1, Y1 + j, j < 6 ? C.vermilion[0] : 0x3a1410);
            if (j > 5) img.px(X + 2, Y1 + j, 0xe8f8f8, 0.25);
          }
        for (let Yy = Y0; Yy < Y1; Yy++) {
          const b = Math.floor((Yy - Y0) / 4);
          for (let X = X0; X < X1; X++) {
            if ((Yy - Y0) % 4 === 3) {
              img.px(X, Yy, 0x3e3a32);
              continue;
            }
            const XX = X + b * 13;
            let c = rampColor(DK, 0.25 + hashPx(Math.floor(XX / 40), b, 421) * 0.55, X, Yy);
            if (XX % 40 === 0) c = 0x4a463c;
            const g = hashPx(XX >> 1, Yy, 422);
            if (g < 0.1) c = scaleColor(c, 0.92);
            else if (g > 0.95) c = scaleColor(c, 1.07);
            img.px(X, Yy, c);
          }
        }
        if (rails) {
          for (let X = X0; X < X1; X++) {
            img.px(X, Y0, C.vermilion[1]);
            img.px(X, Y0 + 1, C.vermilion[2]);
            // the front rail: a top bar and a low one with the planks seen between them
            img.px(X, Y1 - 7, C.vermilion[3]);
            img.px(X, Y1 - 6, C.vermilion[2]);
            img.px(X, Y1 - 3, C.vermilion[2]);
            img.px(X, Y1 - 1, C.vermilion[1]);
            if ((X - X0) % 12 < 2) for (let j = -7; j < 0; j++) img.px(X, Y1 + j, (X - X0) % 12 === 0 ? C.vermilion[3] : C.vermilion[1]);
            if ((X - X0) % 12 === 0) {
              img.rectPx(X, Y1 - 9, 2, 2, C.gold);
              img.px(X, Y1 - 9, C.goldHi);
            }
          }
          for (let Yy = Y0; Yy < Y1; Yy++) {
            img.px(X0, Yy, C.vermilion[3]);
            img.px(X0 + 1, Yy, C.vermilion[1]);
            img.px(X1 - 2, Yy, C.vermilion[2]);
            img.px(X1 - 1, Yy, C.vermilion[0]);
            if ((Yy - Y0) % 12 === 0) {
              img.rectPx(X0, Yy, 2, 2, C.gold);
              img.rectPx(X1 - 2, Yy, 2, 2, C.gold);
            }
          }
        }
      };
      /** A deck as an object, under whatever stands on it. */
      const deck = (x0, x1, u0, u1, rails = true) => objects.push({ y: Y(u1) - 90, draw: () => deckNow(x0, x1, u0, u1, rails) });
      /** A lantern of old bronze hung from the eaves. */
      const bronze = (X, Yy) => {
        img.px(X, Yy - 2, 0x3a3228);
        img.rectPx(X - 1, Yy - 1, 3, 3, 0x8a7a3a);
        img.px(X, Yy, 0xffd890);
        glowPx(X, Yy, 0xffd080, 0.75);
      };
      /** A kairō corridor across: a bark roof along it, vermilion posts on the open side, lanterns under the eaves. */
      const corridorH = (x0, x1, u) => {
        deck(x0, x1, u - 2, u + 6);
        objects.push({
          y: Y(u) + 2,
          shadow: () => shadowRect(x0 + 2, Y(u + 11) + 2, x1 - x0, 12, 0.6),
          draw: () => {
            facade(x0, Y(u + 4), x1 - x0, 3, 'shrine', { open: true, bay: 4, lattice: false });
            roof(x0, Y(u + 11), x1 - x0, 7, HW, { bark: true, hip: false, ridgeAt: 0.42 });
            for (let X = x0 * S + 6; X < x1 * S; X += 12) bronze(X, Y(u + 4) * S + 3);
          },
        });
      };
      /** A kairō corridor along u: the ridge down the middle, the bark in long courses, the walk open on its inner
       * side (side = -1: the walk to its left) with the balustrade, posts and bronze lanterns. */
      const corridorV = (x, u0, u1, side) => {
        const dx0 = side < 0 ? x - 5 : x - 2;
        const dx1 = side < 0 ? x + 10 : x + 13;
        deck(dx0, dx1, u0, u1);
        objects.push({
          y: Y(u0) + 1,
          shadow: () => shadowRect(x + 3, Y(u1) - 2, 8, u1 - u0 + 3, 0.62),
          draw: () => {
            const Xa = x * S;
            const Xb = (x + 8) * S;
            const Xc = (Xa + Xb) / 2;
            const Ya = (Y(u1) + 1) * S - 12;
            const Yb = (Y(u0) + 1) * S - 12;
            // the front of the walk under its roof
            for (let X = Xa; X < Xb; X++)
              for (let j = 0; j < 12; j++) {
                const post = (X - Xa) % 12 < 3;
                img.px(X, Yb + j, j < 2 ? 0x141014 : post ? ((X - Xa) % 12 === 0 ? C.vermilion[3] : C.vermilion[2]) : j < 8 ? 0x1e1618 : DK[1]);
              }
            for (let Yy = Ya; Yy < Yb; Yy++)
              for (let X = Xa; X < Xb; X++) {
                const t = (X - Xc) / ((Xb - Xa) / 2);
                let c = t < 0 ? mix(HW[2], HW[4], 1 + t) : mix(HW[2], HW[0], t);
                const course = (X - Xa) >> 2;
                const g = hashPx(course, (Yy + course * 5) >> 3, 423);
                if (g > 0.72) c = scaleColor(c, 1.11);
                else if (g < 0.24) c = scaleColor(c, 0.9);
                if ((X - Xa) % 4 === 0) c = scaleColor(c, 0.84);
                if (Math.abs(t) < 0.11) c = Yy % 18 < 2 ? HW[4] : t < 0 ? HW[3] : HW[1];
                if (Math.abs(t) > 0.92) c = t < 0 ? HW[4] : HW[0];
                if (Yy >= Yb - 2) c = Yy === Yb - 1 ? HW[0] : HW[4];
                img.px(X, Yy, c);
              }
            // posts and lanterns down the open side, a dark strip where the eave shades the walk
            const EX = side < 0 ? Xa - 1 : Xb;
            const dir = side < 0 ? -1 : 1;
            for (let Yy = Ya + 2; Yy < Yb + 12; Yy++) {
              img.tintPx(EX, Yy, 0.5);
              img.tintPx(EX + dir, Yy, 0.68);
              img.tintPx(EX + dir * 2, Yy, 0.82);
              if ((Yy - Ya) % 12 < 2) {
                img.px(EX, Yy, C.vermilion[2]);
                img.px(EX + dir, Yy, C.vermilion[3]);
              }
              if ((Yy - Ya) % 24 === 6) bronze(EX + dir, Yy);
            }
          },
        });
      };
      // the main sanctuary on the axis: Hitasaki with its bronze lantern, Hirabutai with the Takabutai and the
      // Gakubō, then the Haraiden, Haiden and Honden rising behind one another, each on its own deck
      deck(84, 101, 5002, 5024);
      objects.push({
        y: Y(5008),
        shadow: () => shadowRect(93, Y(5012), 3, 3, 0.7),
        draw: () => {
          const CX = 92 * S + 1;
          const y = Y(5008) * S;
          img.rectPx(CX - 5, y - 2, 11, 3, C.granite[2]);
          img.rectPx(CX - 5, y - 2, 11, 1, C.granite[4]);
          img.rectPx(CX - 2, y - 11, 5, 9, 0x5a5048);
          img.rectPx(CX - 1, y - 18, 3, 7, 0x6a6048);
          img.rectPx(CX - 3, y - 19, 7, 1, 0x7e7258);
          for (let j = 0; j < 6; j++) img.rectPx(CX - 6 + j, y - 26 + j * 0 - j, 13 - j * 2, 1, j === 0 ? 0x3a322c : 0x5a5240);
          for (const i of [-1, 1]) img.px(CX + i, y - 14, 0xffd890);
          img.px(CX, y - 15, 0xfff0b0);
          glowPx(CX, y - 15, 0xffc870, 0.95);
          pool(92, Y(5008) - 5, 10, C.lamp, 0.22 + dusk(5000) * 0.25);
        },
      });
      deck(66, 119, 5024, 5070); // Hirabutai
      deck(86, 99, 5070, 5086);
      deck(66, 119, 5084, 5109);
      deck(70, 115, 5109, 5136);
      deck(88, 97, 5136, 5144);
      deck(68, 117, 5142, 5172);
      deck(50, 53, 5114, 5120, false);
      // the walks from the two outer corridors in to the halls
      deck(67, 68, 5092, 5100, false);
      deck(115, 118, 5092, 5100, false);
      objects.push({
        y: Y(5040) + 1,
        shadow: () => shadowRect(86, Y(5058), 18, 16, 0.6),
        draw: () => {
          // the Takabutai: a lacquered dais for the bugaku, its black floor polished, a vermilion rail with gilt caps
          const X0 = 84 * S;
          const Y0 = Y(5058) * S;
          const WW = 17 * S;
          const HH = 14 * S;
          for (let j = 0; j < HH; j++)
            for (let i = 0; i < WW; i++) {
              let c = (j >> 2) % 2 ? 0x1e181c : 0x281f24;
              if (i % 12 === 0) c = 0x141014;
              if (i + j < 24 && (i + j) % 6 < 2) c = 0x3a3036;
              img.px(X0 + i, Y0 + j, c);
            }
          for (let i = 0; i < WW; i++) {
            img.px(X0 + i, Y0, C.vermilion[2]);
            img.px(X0 + i, Y0 + 1, C.vermilion[3]);
            img.px(X0 + i, Y0 + HH - 5, C.vermilion[3]);
            img.px(X0 + i, Y0 + HH - 4, C.vermilion[2]);
            for (let j = 0; j < 5; j++) img.px(X0 + i, Y0 + HH + j, j === 0 ? 0x0e0a0c : (i % 12 < 2 ? C.vermilion[1] : 0x1a1418));
          }
          for (let j = 0; j < HH; j++) {
            img.px(X0, Y0 + j, C.vermilion[3]);
            img.px(X0 + 1, Y0 + j, C.vermilion[1]);
            img.px(X0 + WW - 1, Y0 + j, C.vermilion[0]);
            img.px(X0 + WW - 2, Y0 + j, C.vermilion[2]);
          }
          for (let k = 0; k < 4; k++) {
            const X = X0 + (k % 2 ? WW - 3 : 0);
            const Yy = Y0 + (k < 2 ? 0 : HH - 6);
            img.rectPx(X, Yy - 2, 3, 3, C.gold);
            img.px(X + 1, Yy - 2, C.goldHi);
          }
          // the front steps, between the gilt posts
          for (let j = 0; j < 15; j++) for (let i = 18; i < WW - 18; i++) img.px(X0 + i, Y0 + HH + j, j % 3 === 0 ? C.vermilion[3] : j % 3 === 1 ? C.vermilion[1] : 0x1a1418);
        },
      });
      hall(66, Y(5080), 13, 7, 4, HW, 'shrine', { bark: true, bay: 4, reserve: false });
      hall(106, Y(5080), 13, 7, 4, HW, 'shrine', { bark: true, bay: 4, reserve: false });
      hall(68, Y(5106), 49, 14, 6, HW, 'shrine', { bark: true, bay: 6, gable: 'tri', gw: 12, noshi: false, reserve: false }); // Haraiden
      hall(72, Y(5132), 41, 14, 5, HW, 'shrine', { bark: true, bay: 6, gable: 'tri', gw: 10, reserve: false }); // Haiden
      hall(70, Y(5168), 45, 18, 6, HW, 'shrine', { bark: true, bay: 5, gable: 'kara', gw: 14, crestC: C.gold, reserve: false }); // Honden
      // the corridors east and west, out to the shore at either end
      corridorV(122, 5026, 5184, -1);
      corridorV(54, 5026, 5184, 1);
      corridorH(130, 150, 5180);
      corridorH(32, 54, 5180);
      // Marōdo-jinja, the guest shrine by the east corridor; the floating Noh stage and its bridge on the west
      deck(135, 153, 5150, 5172);
      hall(136, Y(5170), 16, 10, 4, HW, 'shrine', { bark: true, bay: 4, reserve: false });
      deck(134, 137, 5158, 5164, false);
      deck(34, 50, 5108, 5126);
      hall(34, Y(5144), 17, 11, 5, HW, 'oldwood', { bark: true, bay: 5, gable: 'tri', gw: 7, reserve: false, sortBias: 1 });
      // Sorihashi, the steep arched bridge behind the sanctuary; the plank walk on from it to the town
      deck(90, 95, 5230, 5342, false);
      objects.push({
        y: Y(5216) + 4,
        shadow: () => shadowRect(97, Y(5236), 2, 30, 0.6),
        draw: () => {
          const X0 = 87 * S;
          const Xw = 11 * S;
          const Y0 = Y(5172) * S;
          for (let u = 5172; u < 5236; u += 1 / S) {
            const t = u < 5204 ? 0 : Math.sin(((u - 5204) / 32) * Math.PI);
            const Yy = Math.round((L - u) * S - t * 11);
            if (Yy > Y0 + 2) continue;
            for (let i = 0; i < Xw; i++) {
              let c = (Yy >> 1) % 2 ? C.hinoki[1] : C.hinoki[2];
              if (u < 5204) c = (Yy >> 1) % 2 ? DK[1] : DK[2];
              if (i < 2 || i >= Xw - 2) c = i === 0 ? C.vermilion[3] : i === Xw - 1 ? C.vermilion[0] : C.vermilion[2];
              img.px(X0 + i, Yy, c);
              if ((Math.round(u * S) % 18 < 2) && (i < 2 || i >= Xw - 2)) img.px(X0 + i, Yy, C.gold);
            }
          }
        },
      });
      // priests, miko and visitors along the corridors' walks; a bugaku dancer on the stage
      for (const [pts, s0, c] of [
        [[[118, 5032], [118, 5180]], 0.2, 0xf4f4f0],
        [[[63, 5032], [63, 5180]], 0.6, 0xd83a2a],
        [[[118, 5180], [118, 5032]], 0.7, 0x3a6ad0],
        [[[63, 5180], [63, 5032]], 0.1, 0xe8c040],
      ])
        kit.path(pts, [walker(c, 0, 5100), walker(c, 1, 5100)], { sp: 3, mode: 'pp', hold: 3, turn: 'flip', fps: 3, s0 });
      const dancer = [0, 1, 2, 1].map((f) => sprite(6, 7, 5050, (r) => {
        // the bugaku robe, its long red train, the gold helmet, arms changing as he turns
        for (let i = 2; i < 16; i++) r.px(i, 19, 0x141824, 0.4);
        for (let j = 5; j < 17; j++) for (let i = 5; i < 13; i++) r.px(i, j, j > 13 ? 0xa8221e : i < 7 ? 0xf0543c : i > 10 ? 0xa8221e : 0xd83a2a);
        for (let j = 7; j < 15; j += 3) for (let i = 6; i < 12; i += 2) r.px(i, j, 0xe8c040);
        r.rectPx(7, 0, 4, 4, 0xe8c040);
        r.px(8, 0, 0xfff0a0);
        r.rectPx(7, 3, 4, 2, 0xe8c090);
        const up = f === 0 ? 3 : f === 2 ? 9 : 6;
        for (let k = 0; k < 4; k++) {
          r.px(4 - k, up + k * (f === 0 ? 1 : -1) + 2, 0xd83a2a);
          r.px(13 + k, 12 - up + 2 - k * (f === 2 ? 1 : -1), 0xd83a2a);
        }
        r.rectPx(6, 17, 2, 2, 0x2a2026);
        r.rectPx(10, 17, 2, 2, 0x2a2026);
      }));
      kit.loop(89, 5056, dancer, { fps: 2 });
      // musicians either side of the stage
      standing(86, Y(5042), 2, 2, 2, 4211, [0xd83a2a]);
      standing(98, Y(5042), 2, 2, 2, 4212, [0x2a6a4a]);
      // a Shinto wedding walking the east corridor under the red umbrella: priest, miko, the bride in white, the
      // groom, the families
      {
        const fig = (c, cap) => [walker(c, 0, 5100, cap), walker(c, 1, 5100, cap)];
        const bride = [0, 1].map((f) => sprite(6, 6, 5100, (r) => {
          for (let i = 3; i < 13; i++) r.px(i, 17, 0x141824, 0.35);
          for (let j = 6; j < 17; j++) for (let i = 5; i < 11; i++) r.px(i, j, i < 7 ? 0xffffff : 0xe8e8e4);
          r.px(f ? 6 : 9, 16, 0xc8c8c4);
          for (let j = 0; j < 8; j++) {
            const hw = j < 2 ? 2 + j * 2 : 7 - (j >> 2);
            for (let i = -hw; i <= hw; i++) r.px(8 + i, j, (i + 12) % 4 === 0 ? 0xa8221e : j === 7 ? 0xb8281e : 0xd83a2a);
          }
          r.rectPx(7, 2, 2, 2, 0xf4a040);
        }));
        const party = [fig(0xf4f4f0, 0x2a2026), fig(0xd83a2a), bride, fig(0x1a1a20), fig(0x2a2a34), fig(0x5a3a6a), fig(0x2a2a34, 0xd8d0c8)];
        kit.path([[118, 5176], [118, 5040], [108, 5030]], party, { sp: 2, n: party.length, gap: 5, mode: 'pp', hold: 6, turn: 'none', fps: 2, cars: 1, s0: 0.2 });
      }
      // visitors on the Hirabutai, on the lantern pier and round the halls, the vermilion shimmering in the tide
      standing(68, Y(5066), 15, 38, 16, 4213);
      standing(103, Y(5066), 14, 38, 16, 4214);
      standing(86, Y(5022), 13, 13, 6, 4215);
      standing(86, Y(5084), 12, 10, 4, 4216);
      strollers(75, 5046, 5, 16, 2);
      strollers(110, 5046, 5, 16, 2);
      {
        const shimmer = sprite(9, 2, 5100, (r) => {
          for (let X = 0; X < 27; X++) r.px(X, X % 7 < 3 ? 3 : 1, C.vermilion[2], 0.5);
        });
        const parts = [];
        for (let x = 40; x < 140; x += 8) for (const u of [5000, 5020, 5138]) if (W_(x, Y(u))) parts.push([0, x, u, x * 0.21 + u * 0.01]);
        for (let u = 5030; u < 5180; u += 8) for (const x of [50, 134]) if (W_(x, Y(u))) parts.push([0, x, u, u * 0.05]);
        if (parts.length) kit.wave([shimmer], parts, { w: 1.1, a0: 0, a1: 0.85, pw: 2 });
      }
      // the shore paths meet the corridors' ends
      way([[42, 5176], [40, 5166]], 3);
      way([[148, 5176], [152, 5166]], 3);
      reserveRect(30, Y(5240), 124, 240);
    }

    // ---- the hill above the shrine: the Gojūnotō and the great unpainted Senjōkaku among the pines
    {
      // the stone stairs up the hill, the way on from the corridor's end, the terrace walls
      const gravelP = (X, Yy) => {
        const g = hashPx(X, Yy, 451);
        return g < 0.1 ? scaleColor(C.gravel[0], 0.84) : g > 0.92 ? scaleColor(C.gravel[3], 1.06) : rampColor(C.gravel, hashPx(X >> 1, Yy >> 1, 452), X, Yy);
      };
      way([[150, 5176], [150, 5240]], 3, { paint: gravelP });
      way([[149, 5300], [149, 5412]], 2.6, { paint: gravelP });
      way([[149, 5310], [166, 5310]], 2.6, { paint: gravelP });
      stairs(146, Y(5300), 7, 62);
      reserveRect(146, Y(5300), 7, 62);
      const pg = { cx: 166, u: 5318 };
      // the pagoda's stone terrace
      img.fine(pg.cx - 11, Y(pg.u) - 3, 23, 8, (X, Yy) => {
        const j = Yy - (Y(pg.u) - 3) * S;
        if (j < 10) return settPx(X, Yy, 9, C.granite);
        return null;
      });
      stoneFace(pg.cx - 11, pg.cx + 12, Y(pg.u) + 1, 4, 3);
      objects.push({
        y: Y(pg.u) + 2,
        shadow: () => shadowRect(pg.cx - 4, Y(pg.u) - 40, 22, 44, 0.55),
        draw: () => {
          const y0 = Y(pg.u);
          let y = y0 - 2;
          for (let i = 0; i < 5; i++) {
            const ww = 12 - i * 1.2;
            const fh = 5;
            const x0 = Math.round(pg.cx - ww / 2);
            facade(x0, y - fh, Math.round(ww), fh, 'shrine', { bay: 3, wall: 0xe8dcc0 });
            const rw = Math.round(ww + 7 - i * 0.6);
            roof(Math.round(pg.cx - rw / 2), y - fh - 5, rw, 5, C.hiwada, { bark: true, ridge: false });
            y = y - fh - 3;
          }
          // the sōrin: nine bronze rings and the flame-shaped finial
          const CX = pg.cx * S + 1;
          const Yt = y * S;
          for (let j = 0; j < 30; j++) {
            img.px(CX, Yt - j, j % 3 === 0 ? 0x4a3e1e : 0x6a5a2a);
            if (j > 3 && j < 24 && j % 3 === 0) for (const i of [-2, -1, 1, 2]) img.px(CX + i, Yt - j, i < 0 ? 0x9a8a44 : 0x5a4a22);
          }
          for (let j = 0; j < 5; j++) img.rectPx(CX - 2 + (j >> 1), Yt - 30 - j, 5 - (j >> 1) * 2, 1, j > 2 ? C.goldHi : C.gold);
          glowPx(CX, Yt - 33, C.goldHi, 0.6);
        },
      });
      reserveRect(pg.cx - 12, Y(pg.u) - 70, 26, 74);
      // Senjōkaku, "the hall of a thousand mats": huge, unpainted, open between its pillars, on a stone terrace
      flagFill(126, Y(5412), 54, 10, C.granite, 453, 12);
      stoneFace(126, 180, Y(5402), 3, 4);
      hall(128, Y(5446), 50, 24, 10, C.kawara, 'oldwood', { bay: 4, wall: C.oldWood[1], gable: 'tri', gw: 16, crest: false, noshi: true, ridgeAt: 0.36, open: true });
      reserveRect(126, Y(5412), 54, 12);
      standing(132, Y(5411), 40, 4, 6, 4531);
    }

    // ---- Miyajima town behind the shrine: the road up to Daishō-in, Machiya-dōri's merchant houses along their
    // lane, the Treasure Hall, Kiyomori Shrine, Daigan-ji, the two-storey Tahōtō on its knoll, the aquarium, the lanes
    // and small houses among the trees
    {
      const noren2 = [0x2a3a6a, 0x8a2a2a, 0x2a5a3a, 0x6a3a6a, 0x1e2a44];
      const roadX = (u) => 92 + Math.sin((u - 5330) / 120) * 6;
      const roadPts = [];
      for (let u = 5328; u <= 5904; u += 12) roadPts.push([roadX(u), u]);
      // the side lanes first, the road over them
      const lane = [5500, 5512];
      way([[-4, 5506], [186, 5506]], 6, { seed: 11 });
      way([[32, 5512], [32, 5584]], 2.4, { seed: 12 }); // to the Tahōtō's steps
      way([[roadX(5606), 5606], [137, 5606], [137, 5612]], 2.6, { seed: 13 }); // the Treasure Hall
      way([[roadX(5690), 5690], [30, 5690]], 2.6, { seed: 14 }); // the aquarium
      way([[roadX(5445), 5445], [64, 5445], [64, 5448]], 2.6, { seed: 15 }); // Daigan-ji
      way([[roadX(5449), 5449], [146, 5449]], 2, { seed: 16 }); // Kiyomori Shrine
      way([[roadX(5790), 5790], [40, 5790], [40, 5830]], 2.2, { seed: 17 });
      way([[roadX(5760), 5760], [150, 5760], [150, 5820]], 2.2, { seed: 18 });
      way(roadPts, 5.4);
      for (let u = 5345; u < 5900; u += 30) {
        if (Math.abs(u - 5506) < 16) continue;
        const bx = roadX(u);
        stoneLantern(Math.round(bx - 7), u, true);
        stoneLantern(Math.round(bx + 7), u, true);
      }
      // the merchant houses: lattice fronts, noren, a red lantern each, on both sides of the lane
      const house = (x, ww, k, x0) => {
        const nc = noren2[(k + x0) % noren2.length];
        const y = Y(lane[1] + 22);
        hall(x, y, ww - 1, 11, 9, k % 3 === 2 ? C.tileRoof : C.kawara, 'oldwood', {
          wall: C.oldWood[1 + (k % 2)],
          bay: 2,
          noshi: k % 2 === 0,
          extra: () => {
            const fy = (y + 11) * S;
            const X0 = (x + 1) * S;
            const X1 = (x + ww - 2) * S;
            for (let X = X0; X < X1; X++) {
              for (let j = 15; j < 25; j++) img.px(X, fy + j, (X - X0) % 9 === 0 ? 0x141014 : (X >> 1) % 2 ? nc : scaleColor(nc, 0.72));
              img.px(X, fy + 14, 0x1a1414);
            }
            img.rectPx(X0 + 2, fy + 12, 3, 5, 0xe83a24);
            img.px(X0 + 3, fy + 14, 0xffb080);
            glowPx(X0 + 3, fy + 14, 0xffd080, 0.8);
            pool(x + ww / 2, y + 22, 6, C.lamp, 0.18 + dusk(5500) * 0.25);
          },
        });
      };
      for (const [x0, x1] of [[2, 26], [38, 82], [108, 178]]) {
        let x = x0;
        let k = 0;
        while (x < x1 - 8) {
          const ww = Math.min(12 + ((k * 5 + x0) % 3) * 3, x1 - x);
          house(x, ww, k, x0);
          x += ww;
          k++;
        }
      }
      // the houses on the lane's lower side, their backs to us: roofs, a wall, a yard
      for (const [x0, x1] of [[4, 84], [108, 176]]) {
        let x = x0;
        let k = 0;
        while (x < x1 - 8) {
          const ww = Math.min(11 + ((k * 7 + x0) % 4) * 3, x1 - x);
          const hx = x;
          hall(hx, Y(lane[0] - 2), ww - 1, 10, 2, k % 3 === 1 ? C.tileRoof : C.kawara, 'oldwood', { wall: C.oldWood[1], bay: 3, noshi: k % 2 === 1 });
          x += ww + (k % 4 === 2 ? 3 : 0);
          k++;
        }
      }
      for (let k = 0; k < 6; k++) {
        const c = COATS[(k * 3) % COATS.length];
        const lu = lane[0] + 2 + (k % 3) * 3;
        kit.path(k % 2 ? [[4, lu], [176, lu]] : [[176, lu], [4, lu]], [walker(c, 0, 5500), walker(c, 1, 5500)], { sp: 3 + (k % 2), mode: 'pp', hold: 2, turn: 'flip', fps: 3, s0: k * 0.17 });
      }
      kit.wander(50, lane[0] + 6, 30, 3, deerF0(5500), { n: 2, sp: 3, turn: 'flip', fps: 3, idle: 0.8 });
      // Daigan-ji by the shrine, and the little Kiyomori Shrine among the pines behind its own torii
      hall(48, Y(5470), 32, 14, 7, C.kawara, 'temple', { gable: 'tri', gw: 9, bay: 5, noshi: true });
      hall(138, Y(5476), 18, 9, 5, C.hiwada, 'shrine', { bark: true, bay: 4 });
      way([[146, 5449], [146, 5462]], 2, { seed: 16 });
      objects.push({
        y: Y(5451),
        shadow: () => shadowRect(141, Y(5453), 13, 2, 0.7),
        draw: () => {
          const Yb = Y(5451) * S;
          const CX = 146 * S + 1;
          for (const s of [-1, 1]) for (let j = -18; j < 0; j++) for (let i = 0; i < 3; i++) img.px(CX + s * 13 + i, Yb + j, i === 0 ? C.vermilion[3] : i === 1 ? C.vermilion[2] : C.vermilion[0]);
          for (let d = -19; d <= 21; d++) {
            const lift = Math.round((d * d) / 200);
            img.px(CX + d, Yb - 21 - lift, 0x48424a);
            img.px(CX + d, Yb - 20 - lift, 0x16121a);
            img.px(CX + d, Yb - 19 - lift, 0x16121a);
            if (Math.abs(d) < 17) img.px(CX + d, Yb - 14, C.vermilion[2]);
            if (Math.abs(d) < 17) img.px(CX + d, Yb - 13, C.vermilion[0]);
          }
        },
      });
      // the Treasure Hall: white storehouse walls under grey tiles, a namako wall along its foot, a low stone yard
      flagFill(112, Y(5612), 50, 6, C.granite, 463, 12);
      hall(112, Y(5640), 50, 18, 10, C.kawara, 'plain', {
        wall: 0xf0ece4,
        noshi: true,
        ridgeAt: 0.4,
        extra: () => {
          const fy = (Y(5640) + 18) * S;
          for (let X = 114 * S; X < 160 * S; X++)
            for (let j = 16; j < 29; j++) img.px(X, fy + j, (X + j) % 8 === 0 || (X - j) % 8 === 0 ? 0xf0f0ec : 0x4a4a54);
          for (let X = 133 * S; X < 141 * S; X++) for (let j = 8; j < 29; j++) img.px(X, fy + j, (X - 133 * S) % 8 < 2 ? 0x2a2018 : C.oldWood[(j >> 1) % 2]);
          for (const wx of [120, 150]) {
            img.rectPx(wx * S, fy + 6, 9, 6, 0x1a1a20);
            for (let i = 0; i < 9; i += 3) img.rectPx(wx * S + i, fy + 6, 1, 6, 0xb8b8b4);
            img.rectPx(wx * S - 1, fy + 5, 11, 1, C.kawara[3]);
          }
        },
      });
      // the Tahōtō on its knoll: a square lower storey with a skirt roof, the white drum, the square upper roof
      {
        const tx = 32;
        const tu = 5600;
        img.fine(tx - 21, Y(tu + 22), 42, 39, (X, Yy, x, y) => {
          const d = Math.hypot((x - tx) / 20, (L - y - tu - 3) / 19);
          if (d >= 1) return null;
          const c = rampColor(C.moss, Math.max(0.05, Math.min(0.98, 0.85 - d * 0.55 + (tx - x) * 0.012 + (y - Y(tu)) * -0.006)), X, Yy);
          const t = hashPx(X >> 1, Yy >> 1, 464);
          return t < 0.13 ? scaleColor(c, 0.85) : t > 0.9 ? scaleColor(c, 1.13) : c;
        });
        stairs(tx - 3, Y(tu), 7, 16);
        reserveRect(tx - 3, Y(tu), 7, 16);
        objects.push({
          y: Y(tu) + 2,
          shadow: () => shadowRect(tx - 2, Y(tu) - 30, 18, 32, 0.55),
          draw: () => {
            const y0 = Y(tu);
            facade(tx - 6, y0 - 7, 13, 7, 'shrine', { bay: 4, wall: 0xf0e8d0 });
            roof(tx - 10, y0 - 13, 21, 6, C.hiwada, { bark: true, ridge: false });
            const CX = tx * S + 1;
            const Yd = (y0 - 13) * S;
            for (let j = -15; j <= 0; j++)
              for (let i = -13; i <= 13; i++) {
                if ((i / 13.5) ** 2 + ((j + 1) / 16) ** 2 >= 1) continue;
                img.px(CX + i, Yd + j, i < -6 ? C.plaster[2] : i < 4 ? C.plaster[1] : C.plaster[0]);
              }
            facade(tx - 4, y0 - 20, 9, 4, 'shrine', { bay: 4, wall: 0xf0e8d0 });
            roof(tx - 9, y0 - 26, 19, 7, C.hiwada, { bark: true, ridge: false });
            const Yt = (y0 - 27) * S;
            for (let j = 0; j < 30; j++) {
              img.px(CX, Yt - j + 3, j % 3 === 0 ? 0x4a3e1e : 0x6a5a2a);
              if (j > 3 && j < 22 && j % 3 === 0) for (const i of [-2, -1, 1, 2]) img.px(CX + i, Yt - j + 3, i < 0 ? 0x9a8a44 : 0x5a4a22);
            }
            for (let j = 0; j < 5; j++) img.rectPx(CX - 2 + (j >> 1), Yt - 26 - j, 5 - (j >> 1) * 2, 1, j > 2 ? C.goldHi : C.gold);
          },
        });
        reserveRect(tx - 12, Y(tu) - 40, 25, 44);
      }
      // the aquarium: low halls in the island's style round a sea-lion pool with its rocks and railing
      {
        const ax0 = 10;
        const au = 5716;
        flagFill(ax0 - 1, Y(au + 2), 42, 26, C.plaza, 465, 12);
        hall(ax0, Y(au + 40), 40, 14, 8, C.tileRoof, 'plain', {
          wall: 0xe8e4dc,
          noshi: true,
          extra: () => {
            const fy = (Y(au + 40) + 14) * S;
            for (let wx = ax0 + 3; wx < ax0 + 36; wx += 5) {
              for (let j = 6; j < 21; j++) for (let i = 0; i < 9; i++) img.px(wx * S + i, fy + j, i === 0 || i === 8 || j === 6 ? 0x3a4048 : (i + j) % 7 === 0 ? 0x9ac4dc : 0x5a8aa8);
            }
          },
        });
        const CX = ax0 + 20;
        const CY = Y(au - 9);
        img.fine(ax0 + 2, Y(au), 36, 20, (X, Yy, x, y) => {
          const d = Math.hypot((x - CX) / 16, (y - CY) / 9);
          if (d >= 1) return null;
          if (d > 0.93) return (X >> 1) % 2 ? C.granite[4] : C.granite[3];
          if (d > 0.87) return 0x3a5a6a;
          const c = rampColor([0x1e5a7a, 0x2a7a9a, 0x3a94b4, 0x5ab4d0], 0.15 + fbm(x, y, { seed: 466, scale: 4 }) * 0.6 + (y - CY) * 0.02, X, Yy);
          return hashPx(X >> 1, Yy, 467) > 0.985 ? 0xd8f4ff : c;
        });
        setWet(ax0 + 2, ax0 + 38, au - 20, au);
        reserveRect(ax0, Y(au), 40, 22);
        rockPx((CX + 6) * S, CY * S, 8, C.granite, 468);
        rockPx((CX - 8) * S, (CY - 2) * S, 6, C.granite, 469);
        const seal = [0, 1].map((f) => sprite(7, 3, au, (r) => {
          for (let i = 1; i < 15; i++) for (let j = 2; j < 7; j++) if (Math.abs(j - 4) + (i < 4 ? 1 : 0) + (i > 12 ? 1 : 0) < 3) r.px(i, j, j < 4 ? 0x5a4a3c : 0x3a3028);
          r.rectPx(15, f ? 1 : 3, 3, 3, 0x4a3a30);
          r.px(17, f ? 1 : 3, 0x18120e);
          r.px(5, f ? 8 : 1, 0x2a2420);
          r.px(11, f ? 1 : 8, 0x2a2420);
          r.px(0, 4, 0x2a2420);
        }));
        kit.wander(ax0 + 20, au - 9, 12, 5, seal, { n: 2, sp: 6, turn: 'rot', fps: 3, idle: 0.3 });
        kit.spot([[ax0 + 8, au - 2, 24, 14]], glintF0(au), { rate: 1.5, fps: 6, a: 0.8 });
      }
      // little houses at the ends of the lanes in the trees
      const cottage = (x, u, k) => {
        const wf = [14, 17, 12, 15][k % 4];
        hall(x, Y(u + 16), wf, 10, 6, k % 2 ? C.kawara : C.tileRoof, 'oldwood', { wall: C.oldWood[k % 3], bay: 3, noshi: k % 3 === 0 });
      };
      for (const [x, u, k] of [[33, 5832, 0], [20, 5808, 1], [50, 5812, 2], [143, 5822, 3], [158, 5800, 4], [133, 5790, 5], [60, 5560, 6], [112, 5540, 7], [150, 5548, 8]]) cottage(x, u, k);
      way([[roadX(5556), 5556], [66, 5556]], 1.8, { seed: 19 });
      way([[roadX(5536), 5536], [156, 5536], [156, 5548]], 1.8, { seed: 20 });
      // the woods over all of it: pine and camphor, maples turning, thick right up the slopes
      woods(0, W, 5340, 5900, 1000, [C.pine, C.pine, C.camphor, C.camphor, C.momijiR, C.momijiO, C.momijiY, C.camphor], 4601, 4, 7.5);
      woods(0, 30, 5062, 5340, 60, [C.pine, C.camphor, C.pine, C.momijiO], 4602, 4, 7);
      woods(30, 62, 5180, 5345, 40, [C.pine, C.camphor, C.momijiR], 4603, 4, 7);
      woods(120, W, 5170, 5420, 120, [C.pine, C.pine, C.camphor, C.momijiR, C.momijiO], 4501, 4, 7);
      woods(150, W, 4540, 5170, 40, [C.pine, C.camphor, C.momijiR], 4604, 3, 5);
      kit.wander(70, 5650, 8, 40, deerF0(5650), { n: 2, sp: 4, turn: 'flip', fps: 3, idle: 0.6 });
      kit.wander(116, 5680, 8, 30, deerF0(5650), { n: 2, sp: 4, turn: 'flip', fps: 3, idle: 0.6 });
      for (const s0 of [0.1, 0.45, 0.8]) {
        const c = COATS[(s0 * 10) | 0];
        kit.path([[92, 5340], [98, 5500], [94, 5600], [86, 5890]], [walker(c, 0, 5600), walker(c, 1, 5600)], { sp: 3, mode: 'pp', hold: 3, turn: 'none', fps: 3, s0 });
      }
    }
  }

  // ------------------------------------------------------------ 9. Daishō-in, Momijidani, Mount Misen, u = 5900..7168
  {
    // ---- Daishō-in at the foot of Misen: the Niōmon, the stairway with its prayer wheels down the middle and the
    // rakan in knitted caps along it, the halls on their terraces, Henjōkutsu cave, incense and candles
    {
      const s0 = 5930;
      const s1 = 6040;
      // the temple's ground: raked gravel inside a low stone kerb, moss along its edges
      img.fine(60, Y(6160), 64, 258, (X, Yy, x, y) => {
        const e = Math.min(x - 60, 124 - x, y - Y(6160), Y(5902) - y);
        if (e < 0.6) return hashPx(X >> 2, Yy >> 2, 501) < 0.5 ? C.stone[1] : C.stone[2];
        const g = hashPx(X, Yy, 502);
        const c = rampColor(C.gravel, 0.2 + fbm(x, y, { seed: 503, scale: 6 }) * 0.6, X, Yy);
        if (e < 2.2 && hashPx(X >> 1, Yy >> 1, 504) < 0.55 - e * 0.2) return rampColor(C.moss, g, X, Yy);
        return g < 0.08 ? scaleColor(c, 0.86) : g > 0.94 ? scaleColor(c, 1.08) : (Yy % 6 === 0 ? scaleColor(c, 0.95) : c);
      });
      reserveRect(60, Y(6160), 64, 258);
      // the flagged ways round the halls
      way([[92, 5900], [92, 5908]], 5);
      way([[92, 6040], [92, 6102]], 5);
      way([[92, 6096], [64, 6096], [64, 6140], [92, 6140], [92, 6168]], 3.5);
      way([[122, 6072], [132, 6072], [132, 6076]], 2.5); // to the Daishi-dō
      way([[94, 6072], [122, 6072]], 2.5);
      // the stairway: stone treads either side of the line of brass sutra wheels
      const CX = 92 * S + 1;
      img.fine(79, Y(s1), 27, s1 - s0, (X, Yy) => {
        const i = X - CX;
        const a = Math.abs(i);
        const k = Yy % 9;
        // the wheels: brass drums in their dark frame, one above another
        if (a <= 7) {
          if (a >= 6) return a === 7 ? 0x1e1e24 : 0x3a3a40;
          const w = Yy % 7;
          if (w === 0) return 0x2a2a2e;
          let c = a < 2 ? 0xe8c860 : i < 0 ? 0xc8a040 : 0x8a6a28;
          if (w === 1) c = scaleColor(c, 1.18);
          if ((X + Yy) % 5 === 0) c = scaleColor(c, 0.86);
          return c;
        }
        if (a > 38) return a === 40 ? C.stone[0] : C.stone[2];
        if (k === 0) return C.granite[4];
        if (k >= 7) return k === 8 ? 0x4e4c46 : C.granite[0];
        const c = a < 22 ? C.granite[3] : C.granite[2];
        return hashPx(X, Yy, 505) < 0.09 ? scaleColor(c, 0.9) : c;
      });
      reserveRect(78, Y(s1), 29, s1 - s0);
      // the wheels glint as people spin them going up (a glint running up the stairs)
      const wheelGlint = sprite(3, 2, 6000, (r) => {
        r.px(4, 0, 0xfff4b0);
        for (let i = 2; i < 7; i++) r.px(i, 1, 0xf8d860, i === 4 ? 1 : 0.7);
        r.px(4, 2, 0xf8d860, 0.6);
      });
      const parts = [];
      for (let u = s0 + 2; u < s1; u += 3) parts.push([0, 91, u, -(u - s0) * 0.09]);
      kit.wave([wheelGlint], parts, { w: 1.6, a0: 0, a1: 0.9, pw: 6 });
      // the rakan: small stone figures on stepped ledges, each with its own face and knitted cap and red bib
      const CAPS = [0xd83a2a, 0x3a6ad0, 0xf0f0f0, 0xe8c040, 0x6aaa5a, 0xe86aa0, 0x8a5ad0, 0xe87a30];
      for (const x0 of [69, 107]) {
        img.fine(x0 - 1, Y(s1 - 2), 11, s1 - s0 - 4, (X, Yy) => {
          const k = Yy % 15;
          return k < 2 ? C.stone[3] : k < 3 ? C.stone[0] : (hashPx(X >> 1, Yy >> 1, 506) < 0.3 ? C.moss[1] : C.stone[1]);
        });
        reserveRect(x0 - 1, Y(s1 - 2), 11, s1 - s0 - 4);
        for (let Yy = Y(s1 - 4) * S + 12; Yy < Y(s0 + 4) * S; Yy += 15)
          for (let k = 0; k < 4; k++) {
            const X = x0 * S + k * 7 + (Yy % 2);
            const cap = CAPS[(hashPx(X, Yy, 507) * CAPS.length) | 0];
            img.rectPx(X + 1, Yy + 6, 5, 1, 0x1e1e26, 0.45);
            img.rectPx(X, Yy, 5, 6, C.granite[2]);
            img.rectPx(X, Yy, 1, 6, C.granite[3]);
            img.rectPx(X + 4, Yy, 1, 6, C.granite[0]);
            img.rectPx(X, Yy + 1, 5, 2, 0xc83a2a);
            img.rectPx(X + 1, Yy - 3, 3, 3, C.granite[3]);
            img.px(X + 3, Yy - 2, C.granite[1]);
            img.rectPx(X + 1, Yy - 5, 3, 2, cap);
            img.px(X + 2, Yy - 6, scaleColor(cap, 1.15));
          }
      }
      // the Niōmon at the foot of the steps, its two guardians glaring from their bays behind the grilles
      hall(76, Y(5926), 33, 12, 8, C.kawara, 'temple', {
        gable: 'tri', gw: 11, open: true, bay: 11, noshi: true,
        extra: () => {
          const fy = (Y(5926) + 12) * S;
          for (const gx of [79, 101]) {
            const X = gx * S;
            img.rectPx(X, fy + 7, 11, 14, 0xb8281e);
            img.rectPx(X, fy + 7, 3, 14, 0xdc3828);
            img.rectPx(X + 8, fy + 7, 3, 14, 0x8c1c16);
            img.rectPx(X + 3, fy + 3, 5, 5, 0xe8b070);
            img.px(X + 4, fy + 5, 0x1a1414);
            img.px(X + 6, fy + 5, 0x1a1414);
            for (let i = 0; i < 12; i += 3) img.rectPx(X + i, fy + 3, 1, 19, 0x2a1a14);
          }
          // the great straw sandals and the lantern in the gate
          img.rectPx(90 * S, fy + 3, 9, 12, 0xc83a2a);
          img.rectPx(90 * S, fy + 3, 9, 1, 0x1a1414);
          img.rectPx(90 * S, fy + 14, 9, 1, 0x1a1414);
          for (let j = 5; j < 13; j += 2) img.rectPx(90 * S + 3, fy + j, 3, 1, 0x1a1414);
          glowPx(90 * S + 4, fy + 8, 0xffd080, 0.6);
        },
      });
      // the main hall (Maniden), the Daishi-dō, the bell tower; lanterns along the eaves
      hall(68, Y(6132), 49, 20, 10, C.kawara, 'shrine', { gable: 'kara', gw: 16, bay: 7, noshi: true, open: false, crestC: C.gold });
      for (let X = 70 * S; X < 116 * S; X += 9) {
        img.rectPx(X - 1, (Y(6132) + 21) * S, 3, 4, 0xe8d8a0);
        glowPx(X, (Y(6132) + 21) * S + 2, 0xffb040, 0.85);
      }
      hall(120, Y(6092), 24, 12, 7, C.kawara, 'temple', { gable: 'tri', gw: 8, bay: 6 });
      hall(126, Y(6140), 14, 9, 8, C.kawara, 'temple', { open: true, bay: 13 });
      objects.push({
        y: Y(6124),
        draw: () => {
          // the bell in its open tower
          const CXb = 133 * S;
          const Yb = (Y(6140) + 11) * S;
          for (let j = 0; j < 14; j++) {
            const hw = 3 + (j >> 2) + (j > 11 ? 1 : 0);
            for (let i = -hw; i <= hw; i++) img.px(CXb + i, Yb + j, i < -hw * 0.3 ? 0x8a8a4a : i < hw * 0.5 ? 0x6a6a3a : 0x46462a);
            if (j % 4 === 2) for (let i = -hw; i <= hw; i++) img.px(CXb + i, Yb + j, 0x3a3a22);
          }
        },
      });
      // Henjōkutsu: the cave of the 88 temples: a rock face of piled boulders, moss in its joints, its dark mouth
      // with candles burning inside, a path of worn stone to it
      way([[48, 6053], [64, 6053]], 2.8);
      for (const [bx, bu, r] of [[34, 6064, 7], [57, 6064, 4], [32, 6078, 6], [42, 6076, 7], [54, 6078, 6], [46, 6090, 8], [36, 6090, 6], [56, 6090, 5]]) boulderPx(bx, bu, r, Math.round(r * 0.85), bx * 13 + bu, 0.8);
      objects.push({
        y: Y(6058),
        draw: () => {
          const Yb = Y(6058) * S;
          const CXc = 48 * S;
          for (let j = -30; j <= 0; j++)
            for (let i = -20; i <= 20; i++) {
              const d = (i / 18) ** 2 + ((j + 1) / 28) ** 2 + (hashPx(i >> 1, j >> 1, 508) - 0.5) * 0.14;
              if (d > 1.32) continue;
              img.px(CXc + i, Yb + j, d > 1 ? rampColor(C.granite, 0.15 + hashPx(i, j, 509) * 0.3 - (j + 15) * 0.008, i, j) : d > 0.86 ? 0x241c18 : 0x0e0a0c);
            }
          for (const cx of [-9, -3, 3, 9]) {
            img.rectPx(CXc + cx, Yb - 6, 1, 4, 0xf0e8d0);
            img.px(CXc + cx, Yb - 7, 0xffd060);
            glowPx(CXc + cx, Yb - 8, 0xffc060, 0.95);
          }
          pool(48, Y(6058) - 2, 9, 0xff9a40, 0.35);
        },
      });
      reserveRect(24, Y(6098), 36, 48);
      // the incense burner before the main hall, smoke drifting; prayer candles burning on their rack
      objects.push({
        y: Y(6060),
        shadow: () => shadowEllipse(94, Y(6060) + 1, 6, 2, 0.7),
        draw: () => {
          const CXi = 92 * S + 1;
          const Yb = Y(6060) * S;
          for (const s of [-8, 0, 8]) img.rectPx(CXi + s - 1, Yb - 3, 3, 4, 0x3a2e24);
          for (let j = 0; j < 10; j++) {
            const hw = 11 - (j > 6 ? j - 6 : 0) - (j < 2 ? 2 - j : 0);
            for (let i = -hw; i <= hw; i++) img.px(CXi + i, Yb - 3 - j, i < -hw * 0.4 ? 0x7a6a4a : i < hw * 0.5 ? 0x5a4a3a : 0x3a2e24);
          }
          for (let i = -8; i <= 8; i++) img.px(CXi + i, Yb - 13, (i & 1) ? 0x1a1414 : 0xff8a40);
          for (const i of [-5, 0, 5]) glowPx(CXi + i, Yb - 13, 0xff8a40, 0.8);
        },
      });
      kit.emit(92, 6066, incenseSmoke, { rate: 1.6, life: [1.6, 2.6], vy: 7, sx: 2, wf: 0.8, a: 0.45, tint: 1 });
      {
        const Yb = Y(6078) * S;
        for (let i = 0; i < 39; i++) {
          img.px(70 * S + i, Yb, 0x3a3a40);
          img.px(70 * S + i, Yb + 1, 0x1e1e24);
          if (i % 3 === 0) {
            img.px(70 * S + i, Yb - 1, 0xf0e8d0);
            img.px(70 * S + i, Yb - 2, 0xf0e8d0);
            glowPx(70 * S + i, Yb - 3, 0xffd070, 0.9);
          }
        }
      }
      for (const u of [6046, 6058, 6084, 6096]) for (const x of [84, 100]) stoneLantern(x, u, true);
      for (const u of [6146, 6154]) for (const x of [84, 100]) stoneLantern(x, u, true);
      // the chōzuya: a little open roof over the stone trough, its dippers
      hall(106, Y(6066), 13, 7, 4, C.kawara, 'temple', {
        open: true, bay: 12, reserve: false,
        extra: () => {
          const fy = (Y(6066) + 7) * S;
          img.rectPx(109 * S, fy + 6, 21, 5, C.granite[3]);
          img.rectPx(110 * S, fy + 7, 19, 2, 0x3a7a94);
          img.px(112 * S, fy + 7, 0xd8f4ff);
          for (let i = 3; i < 18; i += 4) img.rectPx(109 * S + i, fy + 5, 1, 2, C.hinoki[3]);
        },
      });
      // the rack of ema, wooden prayer plaques in rows
      objects.push({
        y: Y(6044),
        shadow: () => shadowRect(108, Y(6050), 14, 3, 0.7),
        draw: () => {
          const X0 = 106 * S;
          const Y0 = Y(6052) * S;
          for (const i of [0, 41]) img.rectPx(X0 + i, Y0, 2, 21, C.wood[1]);
          for (let j = 0; j < 3; j++) {
            img.rectPx(X0, Y0 + 2 + j * 6, 43, 1, C.wood[0]);
            for (let i = 2; i < 40; i += 3) img.rectPx(X0 + i, Y0 + 3 + j * 6, 2, 3, hashPx(i, j, 519) < 0.25 ? C.hinoki[2] : C.hinoki[3]);
          }
          for (let i = -2; i < 45; i++) {
            img.px(X0 + i, Y0 - 2, C.kawara[3]);
            img.px(X0 + i, Y0 - 1, C.kawara[1]);
          }
        },
      });
      for (const [tx, tu, pal] of [[68, 5936, C.pine], [116, 5936, C.pine], [68, 6026, C.momijiR], [116, 6018, C.pine], [70, 6156, C.momijiO], [112, 6152, C.pine], [68, 6048, C.pine]]) tree(tx, Y(tu), 3.8, pal, tx * 31 + tu, pal === C.pine ? 'pine' : 'broadleaf');
      for (let k = 0; k < 4; k++) {
        const c = COATS[k * 2];
        kit.path([[86 + k * 4, 5928], [86 + k * 4, 6044]], [walker(c, 0, 6000), walker(c, 1, 6000)], { sp: 2.5, mode: 'pp', hold: 4, turn: 'none', fps: 3, s0: k * 0.27 });
      }
      strollers(92, 6080, 24, 12, 5);
      woods(0, 60, 5905, 6165, 90, [C.momijiR, C.momijiO, C.pine, C.momijiY, C.camphor], 5101, 4, 7);
      woods(124, W, 5905, 6165, 80, [C.momijiR, C.momijiO, C.pine, C.momijiR, C.camphor], 5102, 4, 7);
    }

    // ---- Momijidani: the mountain stream over its boulders under the maples, the vermilion bridge, the inn
    {
      // boulders in the stream, white water round them (live)
      const foam = [0, 1, 2].map((k) => sprite(11, 6, 6200, (r) => {
        for (let X = 0; X < 33; X++) {
          const a = 0.75 - Math.abs(X - 16) * 0.025;
          r.px(X, Math.round(9 + Math.sin(X * 0.42 + k * 2) * 4), 0xf4fcff, a);
          if ((X + k * 4) % 5 < 2) r.px(X, Math.round(13 + Math.sin(X * 0.31 + k) * 2), 0xe0f4f8, a * 0.7);
        }
      }));
      for (let k = 0; k < 18; k++) {
        const x = 5 + k * 10 + ((k * 7) % 5);
        if (x > 76 && x < 106) continue;
        const bend = Math.sin(x / 24) * 8;
        const u = Math.round(STREAM[0] + 12 + bend + ((k * 11) % 32));
        const rr = 3 + (k % 3);
        boulderPx(x, u, rr + 1, rr, k * 37 + 200, 0.45);
        kit.loop(x - 5, u - 1, foam, { fps: 4, d: 0.02, fx: 1 });
      }
      kit.spot([[0, STREAM[1] + 8, W, 70]], glintF0(6200), { rate: 2.5, fps: 7, a: 0.8 });
      // Momiji-bashi: arched, vermilion, its planks under a pair of rails with gilded post caps
      {
        const bx0 = 84;
        const bx1 = 98;
        const uA = STREAM[0] - 10;
        const uB = STREAM[1] + 14;
        objects.push({
          y: Y(uA) + 3,
          shadow: () => shadowRect(bx0 + 3, Y(uB), bx1 - bx0 + 1, uB - uA + 4, 0.6),
          draw: () => {
            const X0 = bx0 * S;
            const X1 = bx1 * S;
            for (let u = uA; u <= uB; u += 1 / S) {
              const t = Math.sin(((u - uA) / (uB - uA)) * Math.PI);
              const Yy = Math.round((L - u) * S - t * 12);
              const m = Math.round(u * S);
              for (let k = 0; k < 2; k++)
                for (let X = X0; X < X1; X++) {
                  const i = X - X0;
                  const e = Math.min(i, X1 - 1 - X);
                  let c = m % 7 === 0 ? C.hinoki[0] : (m >> 3) % 2 ? C.hinoki[1] : C.hinoki[2];
                  if (hashPx(X >> 2, m >> 1, 511) < 0.08) c = scaleColor(c, 0.9);
                  c = scaleColor(c, 1 + Math.cos(((u - uA) / (uB - uA)) * Math.PI) * -0.22);
                  if (e < 3) c = e === 0 ? C.vermilion[i < 10 ? 3 : 0] : i < 10 ? C.vermilion[2] : C.vermilion[1];
                  if (e < 3 && m % 48 < 3) c = m % 48 === 0 ? C.goldHi : C.gold;
                  img.px(X, Yy + k, c);
                }
              // the near side's beam and arch rib, a line of shadow under it on the water
              for (let j = 2; j < 6; j++) img.px(X1 + 0, Yy + j, C.vermilion[0]);
            }
          },
        });
        reserveRect(bx0 - 3, Y(uB + 4), bx1 - bx0 + 7, uB - uA + 10);
      }
      // the trail on up through the valley; below the bridge the way down to the temple
      const trailPts = [];
      for (let u = STREAM[1] + 14; u <= 6564; u += 14) trailPts.push([90 + Math.sin((u - 6240) / 90) * 8, u]);
      trailPts.push([90, 6568]);
      way(trailPts, 4.6, { kerb: 0x5a4a3a, paint: (X, Yy) => earthPx(X, Yy, 3) });
      const stepPaint = (X, Yy, d) => {
        const k = Yy % 15;
        if (k < 2) return k === 0 ? C.granite[4] : C.granite[3];
        if (k < 4) return 0x3a3028;
        const c = rampColor(C.stone, 0.45 + hashPx((X + (Yy >> 3) * 7) >> 3, Yy >> 3, 513) * 0.5, X, Yy);
        return hashPx(X, Yy, 514) < 0.07 ? scaleColor(c, 0.88) : c;
      };
      const stepPts = [];
      for (let u = 6564; u <= 6840; u += 8) stepPts.push([90 + (u < 6790 ? Math.sin((u - 6564) / 36) * 7 : 0), u]);
      way(stepPts, 4.6, { kerb: C.stone[0], paint: stepPaint });
      way([[90, 6160], [90, STREAM[0] - 8]], 4.6);
      // Iwasō, the old inn on the far bank, its wooden wings and tiled roofs; a lane to its door, a stream-side garden
      way([[trailPts[1][0], STREAM[1] + 34], [138, STREAM[1] + 34], [138, 6275]], 2.2, { seed: 21 });
      hall(118, Y(6290), 40, 14, 9, C.kawara, 'oldwood', { bay: 5, wall: C.oldWood[2], noshi: true, gable: 'kara', gw: 10, crest: false });
      hall(132, Y(6318), 30, 12, 7, C.kawara, 'oldwood', { bay: 5, wall: C.oldWood[1], sortBias: -2 });
      for (let X = 122 * S; X < 156 * S; X += 12) {
        img.rectPx(X - 1, (Y(6290) + 15) * S, 3, 5, 0xe8d8a0);
        glowPx(X, (Y(6290) + 15) * S + 2, 0xffc070, 0.8);
      }
      kit.emit(150, 6300, thinSmoke, { rate: 0.8, life: [1.6, 2.4], vy: 6, sx: 1, wf: 0.8, a: 0.35, tint: 1 });
      // the Momijidani ropeway station on the left: concrete and glass under a low roof, its cable away up the mountain
      way([[trailPts[7][0], 6344], [17, 6344]], 3, { seed: 22 });
      flagFill(2, Y(6348), 30, 8, C.plaza, 512, 12);
      reserveRect(2, Y(6348), 30, 8);
      hall(2, Y(6372), 30, 12, 12, C.concrete, 'plain', {
        wall: 0xd8d4c8, hip: false, ridgeAt: 0.5,
        extra: () => {
          const fy = (Y(6372) + 12) * S;
          for (let X = 4 * S; X < 30 * S; X++)
            for (let j = 6; j < 33; j++) {
              const b = (X - 4 * S) % 12;
              img.px(X, fy + j, b < 2 || j === 6 ? 0x3a4048 : j < 19 ? ((X + j) % 7 === 0 ? 0xa8ccdc : 0x5a8aa8) : (X + j) % 9 === 0 ? 0x4a6a80 : 0x2e4252);
            }
          for (let i = 0; i < 30; i++) img.rectPx(7 * S + i * 2, fy + 2, 1, 2, i % 3 === 2 ? 0xd8d4c8 : 0xb8281e);
        },
      });
      // the ropeway across the valley: twin cables edge to edge, the steel lattice pylon, gondolas
      const uL = 6375;
      const uR = 6525;
      const cableY = (x, du) => (L - (uL + du + ((uR - uL) * x) / (W - 1)) - 14) * S;
      objects.push({
        y: Y(uL) + 12,
        draw: () => {
          for (let X = 0; X < FW; X++) {
            const x = X / S;
            for (const du of [0, 5]) {
              img.px(X, Math.round(cableY(x, du)), 0xf0f4f8);
              img.px(X, Math.round(cableY(x, du)) + 1, 0x3a4048, 0.9);
            }
          }
          const py = Math.round(cableY(148, 0));
          const CXp = 148 * S + 1;
          for (let j = 0; j < 54; j++) {
            const hw = 3 + (j >> 3);
            for (const k of [0, 1]) {
              img.px(CXp - hw + k, py + j, 0xc8d4dc);
              img.px(CXp + hw - k, py + j, 0x5a646e);
            }
            if (j % 6 < 2) for (let i = -hw + 1; i < hw; i++) img.px(CXp + i, py + j, 0x8a96a2);
            else for (let i = -hw + 2; i < hw - 1; i++) if ((i + j) % 6 === 0 || (i - j) % 6 === 0) img.px(CXp + i, py + j, 0x8a96a2);
            img.tintPx(CXp + hw + 2, py + j, 0.8);
          }
          for (let i = -12; i <= 12; i++) {
            img.px(CXp + i, py - 2, 0xa8b2bc);
            img.px(CXp + i, py - 1, 0x4a545e);
          }
          for (const i of [-11, 11]) img.rectPx(CXp + i - 1, py - 3, 3, 1, 0xe8d848);
        },
      });
      const gondola = sprite(9, 10, 6450, (r) => {
        const CXg = 13;
        for (let j = 0; j < 8; j++) r.px(CXg, j, 0x58626c);
        for (let i = -3; i <= 3; i++) r.px(CXg + i, 1, 0x7a8690);
        for (let j = 8; j < 27; j++)
          for (let i = 3; i < 24; i++) {
            const e = Math.min(i - 3, 23 - i, j - 8, 26 - j);
            if (e === 0 && (i === 3 || i === 23) && (j === 8 || j === 26)) continue;
            let c = i < 6 ? C.vermilion[3] : i > 20 ? C.vermilion[0] : C.vermilion[2];
            if (j < 10) c = 0xf4f4f0;
            if (j >= 12 && j < 19 && i > 5 && i < 21) c = (i + j) % 7 === 0 ? 0xf0fcff : (i - 6) % 5 === 0 ? 0x3a4048 : 0x9ac4dc;
            if (j >= 22) c = 0xf2ead8;
            r.px(i, j, c);
          }
      });
      kit.path([[-12, uL - 10 + 14], [W + 12, uR + 10 + 14]], [gondola], { sp: 16, n: 3, gap: 72, turn: 'none', d: 0.78 });
      kit.path([[W + 12, uR + 15 + 14], [-12, uL - 5 + 14]], [gondola], { sp: 16, n: 2, gap: 96, s0: 0.35, turn: 'none', d: 0.78 });
      // the maple canopy: crimson, scarlet and gold, thick on both sides of the trail; a footbridge's worth of
      // clearing for the path, the woods closing again up to the rocks
      woods(0, W, STREAM[1] + 14, 6600, 620, [C.momijiR, C.momijiR, C.momijiO, C.momijiR, C.momijiY, C.pine, C.momijiO, C.camphor], 5201, 4, 8);
      strollers(70, 6420, 16, 60, 3);
      strollers(110, 6280, 10, 30, 3);
      kit.wander(60, 6460, 20, 80, deerF0(), { n: 2, sp: 4, turn: 'flip', fps: 3, idle: 0.6 });
    }

    // ---- the summit of Misen: granite boulders, Kuguri-iwa, Misen Hondō and Sankidō, the courtyard (where
    // Sankibō comes down), Reikadō with its 1,200-year flame and the kettle over it, the observatory
    {
      const onRock = (x, y) => fbm(x, y, { seed: 719, scale: 26, octaves: 2 }) > 0.58;
      for (const [bx, bu, rx, ry] of [[30, 6620, 14, 10], [150, 6640, 15, 11], [24, 6790, 14, 12], [34, 7040, 15, 11], [146, 7050, 15, 11], [64, 7112, 11, 8], [118, 7116, 11, 8], [22, 6930, 10, 9], [158, 6930, 10, 9], [14, 6700, 8, 7], [120, 6600, 7, 6], [60, 6660, 6, 5], [142, 6690, 7, 6], [16, 6860, 7, 6], [166, 6840, 7, 6], [162, 7010, 8, 7], [20, 7100, 8, 7]])
        boulderPx(bx, bu, rx, ry, bx + bu, 0.5);
      // Kuguri-iwa: a great slab resting on two boulders, a passage under it
      boulderPx(138, 6744, 10, 9, 21, 0.4);
      boulderPx(162, 6748, 9, 9, 22, 0.4);
      objects.push({
        y: Y(6738) + 2,
        shadow: () => shadowRect(136, Y(6764) + 4, 34, 13, 0.55),
        draw: () => {
          const Yt = Y(6764);
          // the dark under it, then the slab itself, its upper face lit and a sheer front
          img.fine(146, Yt + 10, 8, 8, (X, Yy) => (Yy % 5 === 0 ? 0x1e1814 : 0x14100e));
          img.fine(131, Yt - 1, 36, 12, (X, Yy, x, y) => {
            const dx = x - 149;
            const dy = y - (Yt + 5);
            const d = (dx / 18) ** 2 + (dy / 6.2) ** 2 + (fbm(x, y, { seed: 811, scale: 7, octaves: 2 }) - 0.5) * 0.5;
            if (d > 1) return null;
            const front = dy > 1.6 + (fbm(x, 0, { seed: 812, scale: 6 }) - 0.5) * 2;
            let c = rampColor(C.granite, Math.max(0.02, Math.min(0.98, (front ? 0.22 - dy * 0.03 : 0.72 - dx * 0.012) + (hashPx(X >> 2, Yy >> 1, 813) - 0.5) * 0.25)), X, Yy);
            if (Math.abs(fbm(x, y, { seed: 814, scale: 5 }) - 0.5) < 0.012) c = scaleColor(c, 0.62);
            return c;
          });
        },
      });
      // Misen Hondō and the vermilion Sankidō, hall of the great tengu Sankibō
      hall(36, Y(6830), 34, 14, 8, C.kawara, 'temple', { gable: 'tri', gw: 10, bay: 6, noshi: true });
      hall(116, Y(6830), 30, 13, 8, C.kawara, 'shrine', { gable: 'kara', gw: 10, bay: 5, crestC: C.gold });
      glowPx(131 * S, (Y(6830) + 18) * S, 0xffb040, 0.9);
      kit.emit(131, 6806, incenseSmoke, { rate: 1, life: [1.5, 2.4], vy: 6, sx: 1, wf: 0.8, a: 0.4, tint: 1 });
      way([[90, 6800], [53, 6800], [53, 6806]], 3);
      way([[90, 6800], [131, 6800], [131, 6807]], 3);
      // the courtyard, where the boss fight is: granite flags, worn down the middle, moss in the outer joints, a
      // low kerb, kept clear
      img.fine(52, Y(7045), 77, 206, (X, Yy, x, y) => {
        const e = Math.min(x - 52, 129 - x, y - Y(7045), Y(6840) - y);
        if (e < 1) return e < 0.34 ? C.stone[0] : (X >> 2) % 3 ? C.stone[3] : C.stone[2];
        const fl = 24;
        const XX = X + (Math.floor(Yy / fl) % 2) * 12;
        const joint = XX % fl === 0 || Yy % fl === 0;
        const wear = Math.exp(-(((x - 90) / 14) ** 2));
        if (joint) return e < 12 && hashPx(X >> 1, Yy >> 1, 815) < 0.5 - e * 0.03 ? C.moss[1] : scaleColor(C.granite[0], 0.86);
        const t = hashPx(Math.floor(XX / fl), Math.floor(Yy / fl), 816);
        let c = rampColor(C.granite, 0.25 + t * 0.32 + wear * 0.18 + (fbm(x, y, { seed: 817, scale: 7 }) - 0.5) * 0.25, X, Yy);
        const g = hashPx(X, Yy, 818);
        if (g < 0.05) c = scaleColor(c, 0.92);
        else if (g > 0.97) c = scaleColor(c, 1.06);
        return c;
      });
      reserveRect(50, Y(7047), 81, 209);
      // the stone torii at the courtyard's foot
      objects.push({
        y: Y(6835),
        shadow: () => shadowRect(84, Y(6840), 22, 3, 0.6),
        draw: () => {
          const CXt = 90 * S + 1;
          const Yb = Y(6836) * S;
          for (const s of [-1, 1])
            for (let j = -36; j < 0; j++)
              for (let i = -3; i <= 3; i++) {
                const k = i + 3;
                img.px(CXt + s * 27 + i, Yb + j, k < 2 ? C.granite[4] : k < 5 ? C.granite[2] : C.granite[0]);
              }
          for (let i = -33; i <= 33; i++) {
            for (let j = 0; j < 5; j++) img.px(CXt + i, Yb - 28 + j, j === 0 ? C.granite[4] : j < 4 ? C.granite[3] : C.granite[0]);
            if (Math.abs(i) <= 39) {
              const lift = Math.round((i * i) / 330);
              for (let j = 0; j < 8; j++) img.px(CXt + i, Yb - 45 - lift + j, j < 2 ? C.granite[4] : j < 6 ? C.granite[2] : C.granite[0]);
            }
          }
          for (let i = -39; i <= 39; i++) {
            if (Math.abs(i) <= 33) continue;
            const lift = Math.round((i * i) / 330);
            for (let j = 0; j < 7; j++) img.px(CXt + i, Yb - 45 - lift + j, j < 2 ? C.granite[4] : j < 5 ? C.granite[2] : C.granite[0]);
          }
          for (let j = -37; j < -28; j++) for (let i = -2; i <= 3; i++) img.px(CXt + i, Yb + j, i < 0 ? C.granite[4] : C.granite[2]);
        },
      });
      // Reikadō: the hall of the spirit flame Kōbō Daishi lit in 806, the great iron kettle hung over it
      objects.push({
        y: Y(6970),
        shadow: () => shadowRect(75, Y(7032) + 3, 37, 49, 0.52),
        draw: () => {
          roof(72, Y(7032), 37, 40, C.kawara, { noshi: true, gable: 'tri', gw: 12, crest: false, ridgeAt: 0.4 });
          facade(73, Y(6992), 35, 9, 'temple', { bay: 5, open: true });
          // the hearth, the kettle on its chain, the flame
          const CXk = 90 * S + 1;
          const Yk = Y(6992) * S;
          for (let j = 0; j < 8; j++) img.px(CXk, Yk + 2 + j, 0x4a4448);
          for (let j = 0; j < 12; j++) {
            const hw = Math.round(11 - Math.abs(j - 5) * 0.9);
            for (let i = -hw; i <= hw; i++) img.px(CXk + i, Yk + 9 + j, j < 2 ? 0x4a4448 : i < -hw * 0.4 ? 0x3a3438 : 0x241e22);
          }
          img.rectPx(CXk - 5, Yk + 8, 11, 1, 0x5a5458);
          img.rectPx(CXk - 18, Yk + 25, 37, 3, 0x3a3030);
          img.rectPx(CXk - 18, Yk + 25, 37, 1, 0x5a4a40);
          for (let k = -9; k <= 9; k += 2) {
            const h = 2 + ((k + 10) % 3);
            for (let j = 0; j < h; j++) img.px(CXk + k, Yk + 24 - j, j === h - 1 ? 0xfff0a0 : 0xffb848);
          }
          glowPx(CXk, Yk + 22, 0xfff0a0, 1);
          pool(90, Y(6985), 18, 0xff8c38, 0.42);
        },
      });
      reserveRect(70, Y(7034), 41, 50);
      const fireF = [0, 1, 2].map((k) => sprite(9, 4, 6986, (r) => {
        for (let X = 2; X < 25; X++) {
          const h = 3 + ((X * 5 + k * 7) % 7);
          for (let j = 0; j < h; j++) r.px(X, 11 - j, j === h - 1 ? 0xfff4b0 : j > h - 4 ? 0xffd060 : 0xff7a28, j > h - 2 ? 0.8 : 1);
        }
      }));
      kit.loop(86, 6986, fireF, { fps: 7, d: 0.05 });
      kit.emit(90, 6992, stallSteam, { rate: 1.3, life: [1.5, 2.4], vy: 7, sx: 2, wf: 0.8, a: 0.45, tint: 1 }); // the kettle steaming
      // two braziers of the sacred fire in the courtyard
      for (const fx of [64, 116]) {
        const fu = 6940;
        const fy = Y(fu);
        objects.push({
          y: fy + 3,
          shadow: () => shadowEllipse(fx + 2, fy + 2, 4.5, 3.5, 0.66),
          draw: () => {
            const CXf = fx * S + 1;
            const CYf = fy * S + 1;
            img.discPx(CXf, CYf, 12.5, 0x1e1a20);
            img.discPx(CXf, CYf, 11, 0x3a3438);
            for (let a = 0; a < 8; a++) img.px(CXf + Math.round(Math.cos(a * 0.785) * 11.5), CYf + Math.round(Math.sin(a * 0.785) * 11.5), 0x5a5458);
            img.discPx(CXf, CYf, 8.5, 0x7a2412);
            img.discPx(CXf, CYf, 7, 0xe84824);
            for (let k = 0; k < 16; k++) img.px(CXf + Math.round(Math.cos(k * 2.4) * (k % 7)), CYf + Math.round(Math.sin(k * 2.4) * (k % 7)), k % 3 ? 0xffa030 : 0xfff0a0);
            glowPx(CXf, CYf, 0xffd878, 1);
            pool(fx, fy, 14, 0xff7a30, 0.38);
          },
        });
        const f = [0, 1].map((k) => sprite(5, 6, fu, (r) => {
          for (let j = 2; j < 17; j++) {
            const hw = Math.round(Math.sin(((j - 1) / 16) * Math.PI) * 5);
            const ox = Math.round(Math.sin(j * 0.6 + k * 3) * 1.4);
            for (let i = -hw; i <= hw; i++) r.px(7 + i + ox, j, Math.abs(i) > hw - 2 ? 0xe83820 : j < 8 ? 0xffc040 : 0xff8a30);
          }
          r.rectPx(7, 1 + k, 2, 3, 0xfff8b8);
        }));
        kit.loop(fx - 2, fu + 3, f, { fps: 6, d: 0.55 });
        kit.emit(fx, fu + 2, incenseSmoke, { rate: 1.5, life: [1.5, 2.4], vy: 7, sx: 2, a: 0.5 });
      }
      // the observatory on the very top: a timber deck on its posts, an open slatted roof over the middle, benches
      // and a telescope, people along the rail looking out over the Seto Sea
      {
        const dx0 = 60;
        const dx1 = 120;
        const dY0 = Y(7150) - 8;
        const dY1 = Y(7096) - 8;
        way([[90, 7045], [90, 7092]], 4.6, { kerb: C.stone[0], paint: (X, Yy) => { const k = Yy % 15; if (k < 2) return k === 0 ? C.granite[4] : C.granite[3]; if (k < 4) return 0x3a3028; return rampColor(C.stone, 0.45 + hashPx((X + (Yy >> 3) * 7) >> 3, Yy >> 3, 513) * 0.5, X, Yy); } });
        objects.push({
          y: Y(7086),
          shadow: () => shadowRect(dx0 + 4, dY0 + 6, dx1 - dx0, dY1 - dY0 + 10, 0.55),
          draw: () => {
            const X0 = dx0 * S;
            const X1 = dx1 * S;
            const Y0 = dY0 * S;
            const Y1 = dY1 * S;
            for (let Yy = Y0; Yy < Y1; Yy++)
              for (let X = X0; X < X1; X++) {
                const b = Math.floor((Yy - Y0) / 4);
                let c = (Yy - Y0) % 4 === 3 ? C.oldWood[0] : rampColor(C.oldWood, 0.45 + hashPx(Math.floor((X + b * 17) / 30), b, 821) * 0.5, X, Yy);
                if ((X + b * 17) % 30 === 0) c = C.oldWood[0];
                if ((Yy - Y0) % 4 !== 3 && hashPx(X, Yy, 822) < 0.05) c = scaleColor(c, 0.9);
                img.px(X, Yy, c);
              }
            // the rail round it: timber posts and a top bar, pale with weather
            for (let X = X0; X < X1; X++) {
              img.px(X, Y0, C.oldWood[3]);
              img.px(X, Y0 + 1, C.oldWood[1]);
              img.px(X, Y1 - 6, C.oldWood[3]);
              img.px(X, Y1 - 5, C.oldWood[1]);
              img.px(X, Y1 - 2, C.oldWood[1]);
              if ((X - X0) % 18 < 2) for (let j = -6; j < 0; j++) img.px(X, Y1 + j, C.oldWood[2]);
            }
            for (let Yy = Y0; Yy < Y1; Yy++) {
              img.rectPx(X0, Yy, 2, 1, C.oldWood[3]);
              img.rectPx(X1 - 2, Yy, 2, 1, C.oldWood[0]);
            }
            // the posts down to the rock, in the deck's shade, and the steps up the middle
            for (let X = X0; X < X1; X++) for (let j = 0; j < 24; j++) {
              if ((X - X0) % 36 < 4) img.px(X, Y1 + j, (X - X0) % 36 < 2 ? C.oldWood[2] : C.oldWood[0]);
              else img.tintPx(X, Y1 + j, 0.55 + j * 0.012);
            }
            for (let j = 0; j < 24; j++) for (let i = -12; i <= 12; i++) img.px(90 * S + i, Y1 + j, j % 4 === 0 ? C.oldWood[3] : j % 4 === 3 ? C.oldWood[0] : C.oldWood[1]);
            // the slatted roof over the middle of the deck, its shade falling through the slats
            const RX0 = (dx0 + 12) * S;
            const RX1 = (dx1 - 12) * S;
            const RY0 = Y0 + 21;
            const RY1 = Y1 - 42;
            for (let Yy = RY0; Yy < RY1 + 9; Yy++) for (let X = RX0 + 6; X < RX1 + 9; X++) if ((X - RX0) % 8 < 4) img.tintPx(X, Yy, 0.8);
            for (let Yy = RY0; Yy < RY1; Yy++)
              for (let X = RX0; X < RX1; X++) {
                const slat = (X - RX0) % 8;
                const frame = Yy - RY0 < 3 || RY1 - Yy <= 3 || X - RX0 < 3 || RX1 - X <= 3 || (Yy - RY0) % 36 < 2;
                if (frame) img.px(X, Yy, Yy - RY0 < 2 ? C.hinoki[2] : C.hinoki[0]);
                else if (slat < 3) img.px(X, Yy, slat === 0 ? C.hinoki[2] : C.hinoki[1]);
              }
            // benches and the coin telescope at the rail
            const benchAt = (bx, by) => {
              img.rectPx(bx, by, 24, 2, C.wood[3]);
              img.rectPx(bx, by + 2, 24, 3, C.wood[1]);
              img.rectPx(bx + 2, by + 5, 2, 2, 0x2a2026);
              img.rectPx(bx + 20, by + 5, 2, 2, 0x2a2026);
            };
            benchAt(X0 + 8, Y0 + 30);
            benchAt(X1 - 32, Y0 + 30);
            benchAt(X0 + 8, Y1 - 36);
            benchAt(X1 - 32, Y1 - 36);
            for (const tx of [X0 + 24, X1 - 24]) {
              img.rectPx(tx, Y0 + 7, 2, 6, 0x3a4048);
              img.rectPx(tx - 2, Y0 + 4, 6, 3, 0x6a7680);
              img.px(tx - 2, Y0 + 4, 0xc8d4dc);
            }
          },
        });
        reserveRect(dx0 - 2, dY0, dx1 - dx0 + 4, dY1 - dY0 + 18);
        standing(dx0 + 3, dY1 - 8, dx1 - dx0 - 6, 3, 13, 8231);
        standing(dx0 + 3, dY0 + 2, dx1 - dx0 - 6, 3, 10, 8232);
        standing(dx0 + 2, dY0 + 5, 6, dY1 - dY0 - 12, 3, 8233);
        standing(dx1 - 8, dY0 + 5, 6, dY1 - dY0 - 12, 3, 8234);
      }
      // wind-twisted summit pines and maples, thicker on the shoulders below the rocks, kites wheeling over the summit
      for (const [tx, tu, pal] of [[44, 6880, C.momijiR], [136, 6890, C.momijiO], [42, 6990, C.pine], [138, 6990, C.pine], [48, 7092, C.momijiR], [132, 7095, C.momijiY], [20, 6700, C.pine], [106, 6680, C.pine], [70, 6740, C.momijiR], [160, 6860, C.pine]])
        tree(tx, Y(tu), 6, pal, tx * 29 + tu, pal === C.pine ? 'pine' : 'broadleaf');
      woods(10, 170, 6580, 6840, 220, [C.pine, C.pine, C.camphor, C.momijiR, C.momijiO], 5301, 3.5, 7, onRock);
      woods(10, 50, 6840, 7160, 70, [C.pine, C.pine, C.camphor, C.momijiO], 5302, 3, 6, onRock);
      woods(132, 170, 6840, 7160, 70, [C.pine, C.pine, C.camphor, C.momijiR], 5303, 3, 6, onRock);
      const kite = [0, 1].map((f) => sprite(11, 5, 6900, (r) => {
        const CXk = 16;
        for (let i = 1; i < 15; i++) {
          const dy = f ? Math.round(i * 0.32) : Math.round(i * -0.2 + (i > 8 ? (i - 8) * 0.5 : 0));
          for (let j = 0; j < (i > 11 ? 1 : 2); j++) {
            r.px(CXk - i, 7 + dy + j, i > 10 ? 0x3a2a20 : 0x5a4030);
            r.px(CXk + i, 7 + dy + j, i > 10 ? 0x3a2a20 : 0x5a4030);
          }
        }
        for (let j = 4; j < 11; j++) for (let i = -1; i <= 1; i++) r.px(CXk + i, j, i < 0 ? 0x6a5040 : 0x3a2a20);
        for (let j = 11; j < 14; j++) for (let i = -2; i <= 2; i++) if (Math.abs(i) <= j - 10) r.px(CXk + i, j, 0x6a5040);
      }));
      kit.orbit(90, 6760, 40, kite, { ry: 26, w: 0.25, n: 2, d: 2.2, a: 0.85 });
      kit.orbit(70, 7060, 30, kite, { ry: 20, w: -0.3, n: 1, d: 2.2, a: 0.85 });
      strollers(90, 6900, 30, 40, 4);
    }
  }

  // ==== ZONES END ====

  // ------------------------------------------------------------ compose the 3/4 objects, then the turret pedestals
  for (const o of objects) o.shadow?.();
  objects.sort((a, b) => a.y - b.y);
  for (const o of objects) o.draw();

  // a crown something else was drawn over no longer sways there
  {
    const D = img.hi.data;
    for (let k = 0; k < crownMask.length; k++) {
      if (!crownMask[k]) continue;
      const i = k * 4;
      if (((D[i] ^ (D[i + 1] << 1) ^ (D[i + 2] << 2)) & 255) !== crownHash[k] || !D[i + 3]) crownMask[k] = 0;
    }
  }
  // turret pads: Seto granite in an octagon, a vermilion lantern ring let into it
  for (const p of pads) {
    const y = Y(p.u);
    img.fine(p.x - 10, y - 10, 20, 20, (X, Yy, xx, yy) => {
      const dx = xx - p.x;
      const dy = yy - y;
      const d = Math.max(Math.abs(dx), Math.abs(dy), (Math.abs(dx) + Math.abs(dy)) * 0.71) + 0.1;
      if (d > 9.2) return null;
      if (d > 8.7) return C.stone[0];
      if (d > 7.8) return dx + dy < 0 ? C.stone[3] : C.stone[1];
      if (d > 6.4) return Math.floor(Math.atan2(dy, dx) * 5) % 2 ? C.vermilion[2] : C.vermilion[1];
      if (d > 6) return 0x4a4640;
      return rampColor(C.granite, 0.45 + hashPx(X >> 2, Yy >> 2, 2) * 0.3 - (dx + dy) * 0.02, X, Yy);
    });
  }

  // ------------------------------------------------------------ time-of-day grade, warm light pools, lamps
  const tint = TOD.map(([, , t]) => rgb(t));
  {
    const d = img.hi.data;
    for (let Yy = 0; Yy < FH; Yy++) {
      const u = L - (Yy + 0.5) / S;
      let i = 0;
      while (i < TOD.length - 2 && u >= TOD[i + 1][0]) i++;
      const t = smooth(TOD[i][0], TOD[i + 1][0], u);
      const mul = TOD[i][1].map((m, k) => m + (TOD[i + 1][1][k] - m) * t);
      const tc = tint[i].map((c, k) => c + (tint[i + 1][k] - c) * t);
      const amt = TOD[i][3] + (TOD[i + 1][3] - TOD[i][3]) * t;
      for (let X = 0; X < FW; X++) {
        const p = (Yy * FW + X) * 4;
        if (!d[p + 3]) continue;
        for (let k = 0; k < 3; k++) {
          const v = d[p + k] * mul[k];
          d[p + k] = Math.min(255, v + (tc[k] - v) * amt);
        }
      }
    }
  }
  for (const pl of pools) applyPool(img, pl);
  for (const [x, y, c, a] of lights) img.light(x, y, c, a);
  for (const [X, Yy, c, a] of lightsFine) img.px(X, Yy, c, a);

  // the shadows of the clouds drifting over the land, at the fine resolution: soft-edged instead of dithered
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

  // the crowns go into the strip's alpha last of all (240..254: which crown; the game restores them to opaque)
  {
    const D = img.hi.data;
    for (let k = 0; k < crownMask.length; k++) {
      const a = D[k * 4 + 3];
      if (a >= 240 && a < 255) D[k * 4 + 3] = 236; // (only a crown may use these)
      const v = crownMask[k];
      if (v && a === 255) D[k * 4 + 3] = 239 + v;
    }
  }
  const chunks = [];
  for (let i = 0; i < CHUNKS; i++) chunks.push(img.crop(0, i * CHUNK, W, CHUNK));
  return {
    strip: img.hi,
    chunks,
    props: kit.pack(),
    meta: { width: W, artScale: S, chunkHeight: CHUNK, chunks: CHUNKS, length: L, sway: true, tint: tintTable(L, tod.white) },
  };
}
