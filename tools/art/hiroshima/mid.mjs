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
import { Raster, fbm, rng, bayer, scaleColor, rgb, mix } from '../../lib/raster.mjs';
import { RAMPS, crownPixels, rampColor } from '../nature.mjs';
import { PropKit, Window, puff, todGrade, tintTable, planTraffic } from '../props.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export const W = 180;
export const CHUNK = 512;
export const CHUNKS = 14;
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
  let img = new Raster(W, L);
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
  const kit = new PropKit(7717);
  const tod = todGrade(TOD, smooth);
  const dusk = (u) => smooth(3600, 6800, u);

  const stallSteam = [2, 3, 4].map((r) =>
    [0, 1].map((v) => kit.frame(puff(r, r * 31 + v, [0xb0b0b8, 0xd0d0d8, 0xebebf0, 0xffffff]))),
  );
  const incenseSmoke = [2, 3, 4].map((r) =>
    [0, 1].map((v) => kit.frame(puff(r, r * 43 + v, [0xc89878, 0xe4b890, 0xf8dcb8, 0xfff2dc]))),
  );
  const thinSmoke = [1, 2, 3].map((r) =>
    [0, 1].map((v) => kit.frame(puff(r, r * 57 + v, [0x9a9aa4, 0xbcbcc4, 0xdadae0, 0xf0f0f4]))),
  );

  const applyPool = (target, { x, y, r, c, k }) => {
    const [cr, cg, cb] = rgb(c);
    for (let yy = Math.floor(y - r); yy <= y + r; yy++)
      for (let xx = Math.floor(x - r); xx <= x + r; xx++) {
        const i = target.idx(xx, yy);
        if (i < 0 || !target.data[i + 3]) continue;
        const dd = Math.hypot(xx + 0.5 - x, yy + 0.5 - y) / r;
        if (dd >= 1) continue;
        const f = (1 - dd) ** 1.6 * k;
        target.data[i] = Math.min(255, target.data[i] + cr * f);
        target.data[i + 1] = Math.min(255, target.data[i + 1] + cg * f);
        target.data[i + 2] = Math.min(255, target.data[i + 2] + cb * f);
      }
  };

  /** Draw into a frame of its own (graded like its row of the strip): a mover, a flame, a ripple. */
  const capture = (x0, y0, w, h, draw, opt = {}) => {
    const keep = img;
    const nl = lights.length;
    const np = pools.length;
    img = new Window(x0, y0, w, h);
    draw();
    const out = img;
    img = keep;
    const lit = lights.splice(nl);
    const cast = opt.pools ? pools.slice(np) : pools.splice(np);
    tod.frame(out, opt.u ?? U(y0 + h / 2));
    for (const pl of cast) applyPool(out, pl);
    for (const [x, y, c, a] of lit) out.set(x, y, c, a);
    return kit.frame(out);
  };
  /** A small frame drawn by hand: fn(r) paints a w x h raster; graded for strip position u. */
  const sprite = (w, h, u, fn) => {
    const r = new Raster(w, h);
    fn(r);
    return kit.frame(tod.frame(r, u));
  };

  const glow = (x, y, c, a = 1) => lights.push([Math.round(x), Math.round(y), c, a]);
  const pool = (x, y, r, c, k = 0.45) => pools.push({ x, y, r, c, k });
  const shadowRect = (x, y, w, h, f = 0.58) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) img.tint(x + i, y + j, f);
  };
  const shadowEllipse = (cx, cy, rx, ry, f = 0.6) => {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
      for (let x = Math.floor(cx - rx); x <= cx + rx; x++)
        if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) img.tint(x, y, f);
  };
  const fill = (x0, y0, w, h, ramp, seed, scale = 5) => {
    for (let y = Math.floor(y0); y < y0 + h; y++)
      for (let x = Math.floor(x0); x < x0 + w; x++)
        img.set(x, y, rampColor(ramp, 0.2 + fbm(x, y, { seed, scale, octaves: 2 }) * 0.65, x, y));
  };
  /** Fill a strip rectangle given in u (bottom u0, top u1). */
  const fillU = (x0, x1, u0, u1, ramp, seed, scale = 5) => fill(x0, Y(u1), x1 - x0, u1 - u0, ramp, seed, scale);
  const gravelPath = (x0, x1, u0, u1, ramp = C.gravel) => {
    for (let u = u0; u < u1; u++)
      for (let x = x0; x < x1; x++) {
        const y = Y(u);
        const edge = x === x0 || x === x1 - 1;
        img.set(x, y, edge ? ramp[0] : rampColor(ramp, 0.35 + fbm(x, y, { seed: 22, scale: 3 }) * 0.55, x, y));
      }
    reserveRect(x0, Y(u1), x1 - x0, u1 - u0);
  };
  const disc = (cx, cy, r, ramp, seed) => {
    for (let y = Math.floor(cy - r); y <= cy + r; y++)
      for (let x = Math.floor(cx - r); x <= cx + r; x++)
        if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= r) img.set(x, y, rampColor(ramp, 0.3 + fbm(x, y, { seed, scale: 3 }) * 0.5, x, y));
  };

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
    const pts = crownPixels(kind, Math.round(cx), Math.round(cy), r, rng(seed), seed & 1023);
    const ramp = RAMPS[kind];
    const off = Math.round(2 + r * 0.3);
    objects.push({
      y: cy + r * 0.6,
      shadow: () => {
        for (const p of pts) img.tint(p.x + off, p.y + off, 0.6);
      },
      draw: () => {
        for (const p of pts) {
          const k = Math.max(0, ramp.indexOf(p.c));
          img.set(p.x, p.y, palette[Math.min(palette.length - 1, k)]);
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
    objects.push({
      y: y + 2,
      shadow: () => shadowRect(x + 1, y, 3, 3, 0.65),
      draw: () => {
        img.rect(x - 1, y - 2, 3, 4, C.granite[2]);
        img.rect(x - 2, y - 3, 5, 1, C.granite[3]);
        img.set(x, y - 4, C.granite[4]);
        img.set(x + 1, y - 1, C.granite[1]);
        if (lit) {
          glow(x, y - 1, 0xffcc70, 0.9);
          pool(x, y - 1, 6, C.lamp, 0.12 + dusk(u) * 0.22);
        }
      },
    });
  };
  /** A street lamp: a post and a lit head; the light pool grows towards dusk. */
  const streetLamp = (x, u, c = 0xfff0c8) => {
    const y = Y(u);
    objects.push({
      y: y + 1,
      shadow: () => shadowRect(x + 1, y - 3, 1, 4, 0.6),
      draw: () => {
        img.rect(x, y - 5, 1, 6, 0x3a3e46);
        img.set(x, y - 6, 0x5a5e66);
        glow(x, y - 6, c, 0.9);
        pool(x, y - 5, 6, C.lamp, 0.08 + dusk(u) * 0.25);
      },
    });
  };
  const bench = (x, y, w = 5) => {
    img.rect(x, y, w, 1, C.wood[2]);
    img.rect(x, y + 1, w, 1, C.wood[0]);
    img.tint(x + 1, y + 2, 0.7);
  };

  /** People standing about: a dark head over a coat, a soft shadow. */
  const crowd = (x0, y0, w, h, n, any = false, cols = COATS) => {
    for (let i = 0; i < n; i++) {
      const x = Math.round(x0 + rand() * w);
      const y = Math.round(y0 + rand() * h);
      if (!any && (isRes(x, y) || W_(x, y))) continue;
      img.set(x + 1, y + 1, 0x1e1e26, 0.45);
      img.set(x, y, rand() < 0.6 ? rand.pick(cols) : 0x3a3a4a);
      img.set(x, y - 1, rand() < 0.15 ? 0xe8e0d0 : 0x2a2024);
    }
  };
  /** Walking person frames (2 x 4): head, coat, a stride; cap = a school cap colour. */
  const walker = (c, f, u, cap) => {
    const r = new Raster(2, 4);
    r.set(0, 0, cap ?? 0x2a2026);
    r.set(0, 1, c);
    r.set(0, 2, f ? scaleColor(c, 0.75) : c);
    if (f) r.set(1, 2, scaleColor(c, 0.6));
    r.set(1, 3, 0x101018, 0.4);
    return kit.frame(tod.frame(r, u));
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
    for (let row = 0; row * 3 < h; row++) {
      let x = x0 - Math.floor(r() * 4);
      const rh = Math.min(3, h - row * 3);
      while (x < x1) {
        const sw = 3 + Math.floor(r() * 4);
        const c = C.ishi[1 + Math.floor(r() * 3)];
        for (let j = 0; j < rh; j++)
          for (let i = 0; i < sw; i++) {
            const xx = x + i;
            if (xx < x0 || xx >= x1) continue;
            let cc = c;
            if (i === sw - 1 || j === rh - 1) cc = C.ishi[0];
            else if (j === 0 || i === 0) cc = scaleColor(c, 1.12);
            cc = scaleColor(cc, 1.06 - ((row * 3 + j) / Math.max(1, h)) * 0.28);
            if ((i === sw - 1 || j === rh - 1) && r() < 0.16) cc = r() < 0.5 ? 0x4a6a3a : 0x5a7a44;
            img.set(xx, yTop + row * 3 + j, cc);
          }
        x += sw;
      }
    }
    for (const cx of [x0, x1 - 4])
      for (let j = 0; j < h; j++) {
        const long = Math.floor(j / 3) % 2;
        for (let i = 0; i < 4; i++) if (long || i < 2 || cx !== x0) img.set(cx + (cx === x0 ? i : 3 - i), yTop + j, j % 3 === 2 ? C.ishi[0] : C.ishi[long ? 4 : 3]);
      }
    img.rect(x0, yTop, x1 - x0, 1, C.ishi[4]);
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
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++) {
        const lx = x - x0;
        const rx = x0 + w - 1 - x;
        const north = y < ry;
        let c;
        if (north) c = ramp[n - 2];
        else {
          const k = (y - ry) / Math.max(1, y0 + h - ry);
          c = rampColor(ramp.slice(1, n - 1), 0.85 - k * 0.6, x, y);
          if (!bark && (y - ry) % 2 === 1) c = scaleColor(c, 0.82); // tile courses
          if (bark && fbm(x * 3, y, { seed: 61, scale: 2 }) > 0.62) c = scaleColor(c, 1.12); // layered cypress bark
          if (!bark && (lx & 1) && (y - ry) % 2 === 0) c = scaleColor(c, 1.06); // round tile rows
        }
        // hipped ends
        const dy = Math.abs(y - ry);
        if (hipW && lx < hipW - Math.floor(dy * 0.4)) c = ramp[n - 1];
        if (hipW && rx < hipW - Math.floor(dy * 0.4)) c = ramp[0];
        if (y === y0 + h - 1) c = ramp[n - 1]; // eave tile ends catching the light
        img.set(x, y, c);
      }
    // ridge
    if (opt.ridge !== false) {
      img.rect(x0 + hipW - 1, ry, w - hipW * 2 + 2, 1, ramp[0]);
      if (opt.noshi) img.rect(x0 + hipW, ry - 1, w - hipW * 2, 1, C.plaster[1]);
      // the hip ridges running down to the corners
      for (let k = 0; k < hipW; k++) {
        img.set(x0 + hipW - 1 - k, ry + Math.round(k * 0.9), ramp[0]);
        img.set(x0 + w - hipW + k, ry + Math.round(k * 0.9), ramp[0]);
      }
    }
    // lifted corners
    img.set(x0 - 1, y0 + h - 2, ramp[n - 1]);
    img.set(x0 + w, y0 + h - 2, ramp[1]);
    // the gable facing the viewer
    if (opt.gable) {
      const gw = opt.gw ?? Math.round(w * 0.32);
      const gx = Math.round(x0 + (opt.gx ?? w / 2));
      const gh = Math.round(gw / 2);
      for (let j = 0; j <= gh; j++) {
        const yy = y0 + h - 2 - j;
        const half = opt.gable === 'kara' ? Math.round(gw / 2 - (j * j) / Math.max(1, gh)) : gw / 2 - j;
        if (half < 0) break;
        for (let xx = Math.round(gx - half); xx <= Math.round(gx + half); xx++) {
          const edge = Math.abs(xx - gx) >= half - 0.5;
          img.set(xx, yy, edge ? ramp[0] : opt.gableFill ?? (j < 2 ? C.plaster[2] : C.plaster[1]));
        }
      }
      if (opt.crest !== false) img.set(gx, y0 + h - 3 - Math.floor(gh / 2), opt.crestC ?? C.gold);
    }
    // the shadow under the eave
    for (let x = x0; x < x0 + w; x++) img.tint(x, y0 + h, 0.66);
  };

  /**
   * A facade under an eave: white walls between pillars (vermilion, dark wood or none), with lattice windows,
   * or black boards under plaster. style: 'shrine' | 'temple' | 'castle' | 'plain' | 'shop'.
   */
  const facade = (x0, y, w, h, style, opt = {}) => {
    const pil = style === 'shrine' ? C.vermilion : style === 'temple' ? C.wood : style === 'oldwood' ? C.oldWood : null;
    const bay = opt.bay ?? 5;
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x0; xx < x0 + w; xx++) {
        const lx = xx - x0;
        const ly = yy - y;
        let c;
        if (style === 'castle') {
          const boards = ly >= Math.round(h * 0.42);
          c = boards ? ((ly & 1) ? C.board[1] : C.board[2]) : C.plaster[lx > w - 3 ? 0 : 1];
          if (!boards && ly === Math.round(h * 0.2) && lx % 5 === 2 && lx > 1 && lx < w - 2) c = 0x22222a; // windows
          if (!boards && ly === Math.round(h * 0.2) + 1 && lx % 5 === 2 && lx > 1 && lx < w - 2) c = 0x4a4a52;
          if (boards && ly === Math.round(h * 0.42)) c = C.board[0];
        } else if (style === 'shop') {
          c = opt.wall ?? C.oldWood[2];
          if (ly >= h - 3) c = (lx >> 1) % 2 ? opt.noren ?? 0x2a3a6a : scaleColor(opt.noren ?? 0x2a3a6a, 0.7);
          if (ly < 2) c = scaleColor(c, 0.75);
        } else {
          const isPil = pil && (lx % bay === 0 || lx === w - 1);
          c = isPil ? pil[lx === w - 1 ? 1 : 2] : opt.wall ?? C.plaster[1];
          if (!isPil && style !== 'plain' && ly >= 1 && ly < h - 1 && opt.lattice !== false && (lx + ly) % 2 === 0 && h > 3) c = scaleColor(opt.wall ?? C.plaster[1], 0.82);
          if (!isPil && opt.open && ly >= 1) c = 0x2a2026; // open front (the hall's dark interior)
        }
        if (lx === w - 1) c = scaleColor(c, 0.8);
        img.set(xx, yy, c);
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
        for (let yy = y; yy < y + h; yy++)
          for (let xx = x; xx < x + w; xx++) {
            let c = roofC;
            if (yy === y || xx === x) c = scaleColor(roofC, 1.2);
            else if (xx === x + w - 1 || yy === y + h - 1) c = scaleColor(roofC, 0.75);
            else if (yy === y + 1 || xx === x + 1) c = scaleColor(roofC, 0.86);
            else if (fbm(xx, yy, { seed: 7, scale: 3 }) > 0.68) c = scaleColor(roofC, 0.94);
            img.set(xx, yy, c);
          }
        if (opt.noItems !== true)
          for (const [kind, ix, iy] of items) {
            if (kind === 'ac') {
              for (let k = 0; k < 2; k++) {
                img.rect(ix + k * 3, iy, 2, 2, 0xb8bcc0);
                img.set(ix + k * 3, iy + 2, 0x4a4e54);
              }
            } else if (kind === 'tank') {
              img.disc(ix + 2, iy + 2, 2.2, 0xc8ccd0);
              img.set(ix + 1, iy + 1, 0xf4f6f8);
              img.set(ix + 3, iy + 3, 0x6a6e74);
            } else if (kind === 'hut') {
              img.rect(ix, iy, 6, 3, scaleColor(roofC, 1.12));
              img.rect(ix, iy + 3, 6, 2, scaleColor(wall, 0.85));
              img.set(ix + 2, iy + 4, 0x2a2a30);
            } else {
              img.rect(ix, iy, 7, 3, 0x2a3a6a);
              for (let k = 0; k < 7; k += 2) img.rect(ix + k, iy, 1, 3, 0x4a6aa0);
            }
          }
        opt.top?.();
        const fy = y + h;
        for (let yy = fy; yy < fy + faceH; yy++) {
          const r = yy - fy;
          const floor = Math.floor((r - 1) / 3);
          for (let xx = x; xx < x + w; xx++) {
            const cx = xx - x;
            let c;
            if (style === 'glass') {
              const streak = Math.abs(((cx + r * 0.6) % 22) - 6) < 2;
              c = cx % 3 === 0 ? scaleColor(wall, 0.72) : scaleColor(wall, (streak ? 1.25 : 1) * (1.12 - (r / faceH) * 0.25));
              if (r % 3 === 0) c = scaleColor(wall, 0.8);
              if (r > 0 && r % 3 !== 0 && cx % 3 !== 0 && lit[(floor * 7 + cx) % 400]) c = floor & 1 ? C.cool : C.warm;
            } else {
              c = wall;
              if (r % 3 === 2 && cx > 0 && cx < w - 1 && cx % 3 !== 0) c = lit[(floor * 11 + cx) % 400] ? (cx & 2 ? C.warm : C.cool) : style === 'shop' ? 0x3a3038 : 0x2e3846;
            }
            if (xx === x) c = scaleColor(c, 1.08);
            if (xx === x + w - 1) c = scaleColor(c, 0.78);
            if (r === 0) c = scaleColor(wall, 0.55);
            img.set(xx, yy, c);
          }
        }
        if (style === 'shop' || opt.awning) {
          const ay = fy + faceH - 3;
          for (let xx = x + 1; xx < x + w - 1; xx++) {
            img.set(xx, ay, (xx >> 1) % 2 ? awn : 0xf0ece0);
            img.set(xx, ay + 1, scaleColor(awn, 0.7));
          }
          for (let xx = x + 2; xx < x + w - 2; xx += 3) glow(xx, ay + 2, C.warm, 0.35 + dusk(u) * 0.5);
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
          r.rect(1, 2, 4, 2, 0xb8763c);
          r.set(2, 2, 0xf8eed8);
          r.set(4, 2, 0xf8eed8);
          r.rect(4, 0, 2, 2, 0xc88446);
          r.set(6, 0, 0x3a2618);
          r.set(0, 2, 0xffffff);
          r.set(1, f ? 4 : 5, 0x6e4422);
          r.set(4, f ? 5 : 4, 0x6e4422);
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
      for (let x = x0; x < x1; x++) img.set(x, Y(u), k % 2 ? C.stone[1] : C.stone[3]);
    }
  };

  // ------------------------------------------------------------ 1. water mask & ground base
  // Miyajima's shore: the pier headland on the west, the pine headland on the east, and between them the wide
  // tidal cove of the Great Torii running in to the shrine's stilts (u = 5330 on the axis)
  const miyajimaCoastU = (x) => {
    const wob = fbm(x, 0, { seed: 701, scale: 18 }) * 34;
    const base = Math.round(4510 + wob);
    const k = Math.abs(x - 90) / 64;
    if (k < 1) return Math.max(base, Math.round(4520 + (COVE_END_U - 4520) * Math.sqrt(1 - k * k) ** 0.8 + fbm(x, 1, { seed: 702, scale: 9 }) * 12));
    return base;
  };

  const isWater = (x, u) => {
    // the two branches of the Ōta delta, edge to edge
    if ((u >= MOTOYASU[0] && u < MOTOYASU[1]) || (u >= HONKAWA[0] && u < HONKAWA[1])) return true;
    // Hiroshima Bay between the mainland seawall and Miyajima
    if (u >= QUAY_U && u < miyajimaCoastU(x)) {
      if (u < 3010 && ((x >= 72 && x <= 82) || (x >= 98 && x <= 108))) return false; // Miyajimaguchi ferry piers (JR, Matsudai)
      if (u >= 4400 && u < 4545 && x >= 14 && x <= 46) return false; // Miyajima ferry pier
      for (const isl of bayIslets) {
        const n = fbm(x, L - u, { seed: 709, scale: 6 }) * 3.5;
        if (Math.hypot(x - isl.x, u - isl.u) < 14.5 + n) return false;
      }
      for (const [ix, iu, r] of [[160, 3420, 13], [18, 3650, 12], [150, 4080, 11]]) {
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

  for (let y = 0; y < L; y++) {
    const u = U(y);
    for (let x = 0; x < W; x++) {
      if (isWater(x, u)) {
        water[y * W + x] = 1;
        continue;
      }
      const n = 0.25 + fbm(x, y, { seed: 17, scale: 7, octaves: 2 }) * 0.65;
      if (u < QUAY_U) img.set(x, y, rampColor(C.walk, n, x, y));
      else if (u < MIYAJIMA_U) img.set(x, y, rampColor(C.granite, n, x, y));
      else if (u < 5900) img.set(x, y, rampColor(u < 5000 && x > 30 && x < 150 ? C.sand : C.grass, n, x, y));
      else if (u < 6560) img.set(x, y, rampColor(C.moss, n, x, y));
      else {
        const rock = fbm(x, y, { seed: 719, scale: 26, octaves: 2 });
        img.set(x, y, rock > 0.6 ? rampColor(C.granite, 0.3 + (rock - 0.6) * 1.5 + n * 0.3, x, y) : rampColor(C.moss, n, x, y));
      }
    }
  }

  const W_ = (x, y) => x >= 0 && x < W && y >= 0 && y < L && water[y * W + x];

  // stone embankments along the rivers, beaches and surf along the bay and the cove
  for (let y = 2; y < L - 2; y++) {
    const u = U(y);
    for (let x = 0; x < W; x++) {
      if (water[y * W + x]) {
        if (u >= QUAY_U - 2 && u <= COVE_END_U + 10) {
          const nearLand =
            !W_(x - 1, y) || !W_(x + 1, y) || !W_(x, y - 1) || !W_(x, y + 1) ||
            !W_(x - 2, y) || !W_(x + 2, y) || !W_(x, y - 2) || !W_(x, y + 2);
          if (nearLand) {
            const immediate = !W_(x - 1, y) || !W_(x + 1, y) || !W_(x, y - 1) || !W_(x, y + 1);
            img.set(x, y, immediate ? 0xdff6f8 : 0x4ca8b4, immediate ? 0.85 : 0.45);
          }
        } else if (u < QUAY_U) {
          // the rivers: a darker band under each bank, the bank's reflection
          if (!W_(x, y + 1) || !W_(x, y + 2)) img.set(x, y, 0x0e2a30, 0.45);
          else if (!W_(x, y - 1) || !W_(x, y - 2) || !W_(x, y - 3)) img.set(x, y, 0x5a8a8a, 0.35);
        }
        continue;
      }
      const edge = W_(x, y - 1) || W_(x, y + 1) || W_(x - 1, y) || W_(x + 1, y);
      if (!edge) continue;
      if (u >= MIYAJIMA_U - 10 && u <= COVE_END_U + 10 && x >= 30 && x <= 150) {
        img.set(x, y, C.wetSand[(x + y) % 3]);
      } else {
        img.set(x, y, C.stone[(x + y) % 3 === 0 ? 1 : 2]);
        if (!W_(x, y) && W_(x, y + 1)) img.set(x, y + 1, (x >> 1) % 2 ? C.stone[0] : C.stone[1]);
      }
    }
  }
  // the tidal flats of the cove: wet sand showing through the shallow water near the shore
  for (let u = MIYAJIMA_U; u < COVE_END_U + 4; u++)
    for (let x = 30; x < 150; x++) {
      const y = Y(u);
      if (!W_(x, y)) continue;
      let d = 99;
      for (let k = 1; k < 9 && d === 99; k++) if (!W_(x, y - k) || !W_(x - k, y) || !W_(x + k, y)) d = k;
      if (d < 9 && fbm(x, y, { seed: 733, scale: 4 }) > 0.35 + d * 0.05) img.set(x, y, 0x9a9278, 0.32 - d * 0.03);
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
    const d = x + 0.5 - WEST_CX;
    const a = Math.abs(d);
    let c;
    if (a > WEST_HW + 0.5) c = rampColor(C.paving, fbm(x, y, { seed: 33, scale: 3 }), x, y);
    else if (a > WEST_HW - 0.5) c = 0x8e9094;
    else if (a <= 4.6) {
      // the stone-set tram bed with its four rails, a green strip of sedum between the tracks
      c = rampColor(C.tramBed, fbm(x, y, { seed: 35, scale: 4 }), x, y);
      if (y % 3 === 0 && a <= 4.0) c = scaleColor(c, 0.86);
      if (x === 34) c = rampColor(C.moss, 0.4 + fbm(x, y, { seed: 36, scale: 2 }) * 0.5, x, y);
      if (RAILS.includes(x)) c = 0xc6ced6;
    } else {
      c = rampColor(C.asphalt, fbm(x, y, { seed: 31, scale: 4, octaves: 2 }), x, y);
    }
    img.set(x, y, c);
  };

  const roadPx = (x, y, across, hw, lanes = true, overWater = false) => {
    if (W_(x, y) && !overWater) return;
    const a = Math.abs(across);
    let c;
    if (a > hw + 0.5) c = rampColor(C.paving, fbm(x, y, { seed: 33, scale: 3 }), x, y);
    else if (a > hw - 0.5) c = 0x8a8a8e;
    else c = rampColor(C.asphalt, fbm(x, y, { seed: 31, scale: 4, octaves: 2 }), x, y);
    if (lanes && a < 0.6 && hw >= 4 && Math.floor(y / 3) % 2 === 0) c = 0xdad6c8;
    img.set(x, y, c);
  };

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
      for (let x = 0; x < W; x++) roadPx(x, Y(u), u + 0.5 - uc, hw, hw < 11);
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
      for (let x = WEST_CX - WEST_HW - 2; x <= WEST_CX + WEST_HW + 1; x++) {
        img.set(x, y, rampColor(C.asphalt, fbm(x, y, { seed: 31, scale: 4 }), x, y));
        if (RAILS.includes(x) && u > uc - hw + (uc === STREET_720 ? 4 : 0)) img.set(x, y, 0xc6ced6);
      }
      for (let x = EAST_CX - EAST_HW - 2; x <= EAST_CX + EAST_HW + 1; x++)
        if (u < 2700 + hw) img.set(x, y, rampColor(C.asphalt, fbm(x, y, { seed: 31, scale: 4 }), x, y));
    }
    for (const [cx, chw] of [[WEST_CX, WEST_HW], [EAST_CX, EAST_HW]]) {
      for (const s of [-1, 1]) {
        if (uc === 2700 && s === 1 && cx === EAST_CX) continue;
        if (uc === STREET_720 && s === -1) continue; // nothing south of Aioi-dōri: the castle moat
        const u0 = uc + s * (hw + 3);
        for (let k = 0; k < 3; k++)
          for (let x = cx - chw + 1; x <= cx + chw - 1; x++)
            if (x % 2 === 0 && !(cx === WEST_CX && RAILS.includes(x))) img.set(x, Y(u0 + s * k), 0xe8e8e0);
      }
    }
  }
  // the Hiroden tracks along Aioi-dōri from the east edge, curving north onto the boulevard
  const T720 = [STREET_720 - 2.5, STREET_720 + 2.5]; // westbound / eastbound track centres
  const railArc = (cx, cu, r, a0, a1) => {
    for (let a = a0; a <= a1; a += 0.02) img.set(Math.round(cx + Math.sin(a) * r - 0.5), Y(cu - Math.cos(a) * r), 0xc6ced6);
  };
  for (let x = 0; x < 26; x++)
    for (const tc of T720) {
      img.set(x, Y(tc - 1.5), 0xc6ced6);
      img.set(x, Y(tc + 1.5), 0xc6ced6);
    }
  // (the straight boulevard rails stop where the curves take over)
  for (let u = AVE_U0; u < STREET_720 + 10; u++)
    for (const x of RAILS) {
      const y = Y(u);
      img.set(x, y, u <= STREET_720 + 6 ? rampColor(C.asphalt, fbm(x, y, { seed: 31, scale: 4 }), x, y) : rampColor(C.tramBed, fbm(x, y, { seed: 35, scale: 4 }), x, y));
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
  for (let u = 2700; u <= 2820; u++) {
    const y = Y(u);
    for (let x = 28; x <= 40; x++) {
      let c = rampColor(C.tramBed, fbm(x, y, { seed: 35, scale: 4 }), x, y);
      if (y % 3 === 0) c = scaleColor(c, 0.86);
      if (RAILS.includes(x)) c = 0xc6ced6;
      img.set(x, y, c);
    }
  }
  for (const rx of [29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39]) img.set(rx, Y(2821), rx % 2 ? 0xd83224 : 0xf0e8d8);

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
          if (x === x0 || x === x1) img.set(x, y, u % 4 ? rail[2] : rail[3]);
          else if (x === x0 + 1 || x === x1 - 1) img.set(x, y, C.paving[1]);
          else if (withTram) tramRoadPx(x, y, true);
          else roadPx(x, y, x + 0.5 - cx, hw, true, true);
        }
        if (u % 16 === 0) {
          for (const px of [x0, x1]) {
            img.set(px, y, 0x3a3e46);
            glow(px, y - 1, 0xfff0c8, 0.85);
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
        img.rect(x0 + 3, Y(r0 + 14), 3, 5, C.stone[1]);
        img.rect(x1 - 5, Y(r0 + 14), 3, 5, C.stone[1]);
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
    for (let u = MOAT[0]; u < MOAT[1]; u++)
      for (let x = 0; x < W; x++) {
        const y = Y(u);
        let c = rampColor(C.moat, 0.25 + fbm(x, u * 2, { seed: 24, scale: 9, octaves: 2 }) * 0.55, x, y);
        if (fbm(x * 2, u, { seed: 25, scale: 3 }) > 0.8 && (x + u) % 2) c = scaleColor(c, 1.22);
        const nearOuter = Math.min(u - MOAT[0], MOAT[1] - u, x, W - 1 - x);
        const bed = fbm(x, u, { seed: 27, scale: 16, octaves: 2 }) - nearOuter * 0.006;
        if (bed > 0.5) {
          // leaves on a jittered grid, each a little disc lit on its top-left, some turned brown
          const cx = Math.floor(x / 5) * 5 + 2 + Math.floor(fbm(Math.floor(x / 5), Math.floor(u / 5), { seed: 28, scale: 1 }) * 2);
          const cu = Math.floor(u / 5) * 5 + 2 + Math.floor(fbm(Math.floor(u / 5), Math.floor(x / 5), { seed: 29, scale: 1 }) * 2);
          const rr = 1.6 + ((Math.floor(x / 5) * 7 + Math.floor(u / 5) * 3) % 3) * 0.35;
          const d = Math.hypot(x - cx, u - cu);
          if (d < rr) {
            const brown = (Math.floor(x / 5) * 13 + Math.floor(u / 5) * 7) % 5 === 0;
            const lit = x < cx || u > cu;
            c = brown ? (lit ? 0x9a7a3c : 0x6e5428) : lit ? C.lotus[3] : d > rr - 0.8 ? C.lotus[0] : C.lotus[2];
            if (d < 0.5) c = brown ? 0x5a4020 : C.lotus[1];
          } else if ((x * 7 + u * 13) % 97 === 0) c = 0x4a3420; // a seed head standing up
        }
        img.set(x, y, c);
      }
    setWet(0, W, MOAT[0], MOAT[1]);
    // the outer banks: a low stone edge, the promenades under autumn cherries and willows
    fillU(0, W, CASTLE[0], MOAT[0] - 2, C.paving, 141, 4);
    for (let x = 0; x < W; x++) {
      img.set(x, Y(MOAT[0] - 2), C.stone[3]);
      img.set(x, Y(MOAT[0] - 1), C.stone[1]);
      img.set(x, Y(MOAT[1]), C.stone[1]);
      img.set(x, Y(MOAT[1] + 1), C.stone[3]);
    }
    fillU(0, W, MOAT[1] + 2, 712, C.paving, 142, 4);
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
      for (let u = uTop; u < uBack; u++)
        for (let x = x0; x < x1; x++) {
          const y = Y(u);
          const n = fbm(x, y, { seed, scale: 9, octaves: 3 });
          img.set(x, y, n > 0.3 ? rampColor(C.lawn, 0.15 + n * 0.7, x, y) : rampColor(C.moss, 0.4 + n, x, y));
        }
      // the side edges catch the light on the left, fall into shade on the right
      for (let u = uFace; u < uBack; u++) {
        img.set(x0, Y(u), C.ishi[4]);
        img.set(x1 - 1, Y(u), C.ishi[0]);
      }
      stoneFace(x0, x1, Y(uTop), uTop - uFace, seed);
      // the face mirrored in the moat below it
      for (let k = 1; k <= 4; k++) for (let x = x0; x < x1; x++) img.tint(x, Y(uFace) + k, 0.72 + k * 0.05);
      setWet(x0, x1, uFace, uBack, 0);
    };
    island(HON.x0, HON.x1, HON.face, HON.top, HON.back, 151);
    island(NINO.x0, NINO.x1, NINO.face, NINO.top, NINO.back, 152);
    // the Honmaru's raised upper terrace, with a stone stair up its face
    for (let u = JODAN.top; u < HON.back; u++)
      for (let x = HON.x0 + 1; x < HON.x1 - 1; x++) {
        const y = Y(u);
        const n = fbm(x, y, { seed: 153, scale: 10, octaves: 3 });
        img.set(x, y, n > 0.3 ? rampColor(C.lawn, 0.2 + n * 0.65, x, y) : rampColor(C.moss, 0.4 + n, x, y));
      }
    stoneFace(HON.x0 + 1, HON.x1 - 1, Y(JODAN.top), JODAN.top - JODAN.face, 154);
    for (let j = 0; j < JODAN.top - JODAN.face + 2; j++) img.rect(104, Y(JODAN.top) + j - 1, 9, 1, j % 2 ? C.ishi[3] : C.ishi[1]);

    // the Omote-gomon bridge: a wooden bridge on posts across the moat to the main gate
    {
      const bx0 = 61;
      const bx1 = 72;
      for (let u = MOAT[0] - 2; u <= NINO.face + 1; u++) {
        const y = Y(u);
        for (let x = bx0; x < bx1; x++) {
          const rail = x === bx0 || x === bx1 - 1;
          img.set(x, y, rail ? (u % 5 === 0 ? C.wood[0] : C.wood[1]) : u % 2 ? C.hinoki[1] : C.hinoki[2]);
        }
        if (u % 6 === 0) for (const px of [bx0 + 1, bx1 + 1]) img.set(px, y + 2, 0x0e1e1c, 0.5); // the posts in the water
      }
      for (let u = MOAT[0]; u < NINO.face; u++) img.set(bx1, Y(u), 0x0e1e1c, 0.45);
    }
    // the Ninomaru: a gravel court, pines, the Chūgomon ruins at the back, the earthen bridge over the inner moat
    gravelPath(86, 97, NINO.top, NINO.back);
    gravelPath(86, 97, NINO.back, HON.top + 1);
    for (const sx of [80, 97]) {
      for (let u = NINO.back - 6; u < NINO.back + 2; u++) img.rect(sx, Y(u), 6, 1, C.ishi[2 + ((u + sx) % 2)]);
      img.rect(sx, Y(NINO.back + 2), 6, 1, C.ishi[4]);
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
          img.rect(gx0 + 1, wallTop, gx1 - gx0 - 2, NINO.top - NINO.face, 0x1a1410);
          for (let yy = wallTop + 1; yy < Y(NINO.face); yy++) {
            img.set(gx0 + 2, yy, C.wood[1]);
            img.set(gx0 + 3, yy, C.wood[0]);
            img.set(gx1 - 4, yy, C.wood[0]);
            img.set(gx1 - 3, yy, C.wood[1]);
          }
          for (let yy = wallTop + 2; yy < Y(NINO.face); yy += 2) {
            img.set(gx0 + 2, yy, 0x8a8a90);
            img.set(gx1 - 3, yy, 0x8a8a90);
          }
          img.rect(gx0 + 1, wallTop, gx1 - gx0 - 2, 1, C.board[0]);
        },
      });
      turret(66.5, wallTop + 1, [{ w: 19, fh: 8, rh: 7, gable: 'tri', gw: 7 }]);
    }
    turret(86, wallTop, [{ w: 12, fh: 7, rh: 6 }]); // Hira-yagura
    turret(102, wallTop, [{ w: 22, fh: 6, rh: 5 }], { sortBias: -1 }); // Tamon-yagura, the long storehouse
    turret(119, wallTop, [{ w: 15, fh: 7, rh: 6 }, { w: 10, fh: 6, rh: 7, gable: 'tri', gw: 6, balcony: true }]); // Taiko-yagura
    // the plaster wall along the rest of the Ninomaru's edge
    for (let x = NINO.x0; x < 57; x++) {
      img.set(x, wallTop - 2, C.kawara[2]);
      img.set(x, wallTop - 1, C.plaster[1]);
    }

    // ---- the Honmaru (lower): the Gokoku Shrine on the approach from the Chūgomon
    gravelPath(86, 97, HON.top, 352);
    for (const [lx, lu] of [[83, 300], [100, 300], [83, 324], [100, 324]]) stoneLantern(lx, lu, false);
    // the great torii (bronze-dark) over the approach
    objects.push({
      y: Y(312) + 1,
      shadow: () => shadowRect(81, Y(312) - 2, 24, 4, 0.6),
      draw: () => {
        const ty = Y(312);
        img.rect(81, ty - 10, 2, 11, 0x4a4038);
        img.rect(99, ty - 10, 2, 11, 0x4a4038);
        img.rect(82, ty - 10, 1, 11, 0x5e5248);
        img.rect(100, ty - 10, 1, 11, 0x5e5248);
        img.rect(79, ty - 8, 25, 1, 0x3a322c);
        for (let dx = -13; dx <= 13; dx++) {
          const lift = Math.round((dx * dx) / 130);
          img.set(91 + dx, ty - 12 - lift, 0x2a2420);
          img.set(91 + dx, ty - 11 - lift, 0x5a4e44);
        }
        img.rect(90, ty - 11, 3, 3, 0x2a2420);
      },
    });
    // haiden and honden: copper roofs gone green, white walls, the offering box and a sacred rope
    hall(72, Y(390), 39, 13, 6, C.copper, 'shrine', { gable: 'kara', gw: 13, noshi: true, bay: 6 });
    hall(78, Y(420), 27, 12, 4, C.copper, 'shrine', { gable: 'tri', gw: 9, bay: 5, sortBias: -2 });
    objects.push({
      y: Y(370) + 1,
      draw: () => {
        img.rect(88, Y(372), 7, 2, C.wood[0]);
        for (let x = 80; x < 104; x++) img.set(x, Y(377), (x & 1) ? 0xe8dcb0 : 0xc8b888); // shimenawa
      },
    });
    // the chōzuya and the ema boards
    hall(104, Y(340), 10, 6, 3, C.copper, 'temple', { open: true });
    for (let k = 0; k < 6; k++) img.rect(70 + k * 2, Y(352), 1, 2, k % 2 ? 0xe8d0a0 : 0xd8b880);
    crowd(84, Y(368), 16, 14, 14, true);
    // the Imperial General Headquarters ruins: foundation stones in the grass
    {
      const fx0 = 26;
      const fu0 = 410;
      for (let u = fu0; u < fu0 + 58; u++)
        for (let x = fx0; x < fx0 + 38; x++) {
          const y = Y(u);
          img.set(x, y, rampColor(C.lawn, 0.4 + fbm(x, y, { seed: 155, scale: 4 }) * 0.4, x, y));
          if ((x === fx0 || x === fx0 + 37 || u === fu0 || u === fu0 + 57) && (x + u) % 3) img.set(x, y, C.granite[3]);
          if ((x - fx0) % 8 === 4 && (u - fu0) % 10 === 5) {
            img.rect(x, y, 2, 2, C.granite[2]);
            img.set(x + 1, y + 1, C.granite[0]);
          }
        }
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
          for (const p of parts) shadowRect(Math.round(cx - p.ww / 2) + 12, p.wallTop - roofH[p.i] + 12, p.ww + 8, p.wallBot - p.wallTop + roofH[p.i], 0.58);
        },
        draw: () => {
          // the tenshudai: its gravel top in front of the first floor, the tall battered stone face
          for (let yy = yTop - 6; yy < yTop; yy++)
            for (let xx = cx - baseW / 2; xx < cx + baseW / 2; xx++) img.set(xx, yy, rampColor(C.gravel, 0.45 + fbm(xx, yy, { seed: 26, scale: 2 }) * 0.4, xx, yy));
          stoneFace(cx - baseW / 2, cx + baseW / 2, yTop, baseH, 156);
          // stone steps up the face to the entrance on the east side
          for (let j = 0; j < baseH; j++) img.rect(cx + 14, yTop + j, 8, 1, j % 2 ? C.ishi[3] : C.ishi[1]);
          // walls first, top to bottom, then the roofs over the foot of each wall above
          for (let k = parts.length - 1; k >= 0; k--) {
            const { i, ww, wallTop: wt, wallBot } = parts[k];
            const x0 = Math.round(cx - ww / 2);
            const top = i === parts.length - 1;
            const wh = wallBot - wt;
            const boardsFrom = top ? wh : Math.round(wh * 0.45);
            for (let yy = wt; yy < wallBot; yy++)
              for (let xx = x0; xx < x0 + ww; xx++) {
                const lx = xx - x0;
                const ly = yy - wt;
                let c;
                if (ly >= boardsFrom) c = ly === boardsFrom ? C.board[0] : (ly & 1) ? C.board[1] : C.board[2]; // shitami-itabari
                else c = lx < 2 ? C.plaster[2] : lx > ww - 4 ? C.plaster[0] : C.plaster[1];
                // windows in the plaster band: dark, with a lattice of bars
                const wy = top ? 3 : 2;
                if (ly >= wy && ly < wy + (top ? 3 : 2) && lx % 6 >= 2 && lx % 6 <= 4 && lx > 2 && lx < ww - 3) c = lx % 6 === 3 ? 0x3a3a44 : 0x16161c;
                if (lx === ww - 1) c = scaleColor(c, 0.75);
                img.set(xx, yy, c);
              }
            if (top) {
              // the top floor's balustrade, black lacquer on posts
              for (let xx = x0 - 3; xx < x0 + ww + 3; xx++) {
                img.set(xx, wallBot - 3, C.board[3]);
                img.set(xx, wallBot - 2, (xx - x0) % 3 === 0 ? C.board[3] : C.board[0]);
                img.set(xx, wallBot - 1, C.board[0]);
              }
            }
          }
          for (let k = parts.length - 1; k >= 0; k--) {
            const { i, ww, wallTop: wt } = parts[k];
            const above = parts[i + 1];
            const rh = roofH[i];
            const eave = wt + 1;
            const topW = above ? above.ww : ww - 8;
            const botW = ww + 9;
            for (let xx = Math.round(cx - ww / 2); xx < Math.round(cx + ww / 2); xx++) img.tint(xx, eave + 1, 0.7);
            for (let j = 0; j < rh; j++) {
              const yy = eave - j;
              const t = j / Math.max(1, rh - 1);
              const hw = (botW / 2) * (1 - t) ** 0.6 + (topW / 2) * (1 - (1 - t) ** 0.6);
              for (let xx = Math.round(cx - hw); xx < Math.round(cx + hw); xx++) {
                const lx = xx - (cx - hw);
                const rx = cx + hw - xx;
                const hip = Math.max(0, 3 - j);
                let c = lx < hip + 2 ? RK[3] : rx < hip + 2 ? RK[0] : j === 0 ? RK[4] : (xx & 1) ? RK[1] : RK[2];
                if (j === 1) c = (xx & 1) ? RK[3] : RK[2];
                img.set(xx, yy, c);
              }
              if (j === 0) {
                img.set(Math.round(cx - hw) - 1, yy - 1, RK[4]);
                img.set(Math.round(cx + hw), yy - 1, RK[2]);
                img.set(Math.round(cx - hw) - 1, yy - 2, RK[3]);
                img.set(Math.round(cx + hw), yy - 2, RK[1]);
              } else {
                img.set(Math.round(cx - hw) + 1, yy, RK[4]);
                img.set(Math.round(cx + hw) - 2, yy, RK[1]);
              }
            }
            // the gables on the south face: an irimoya gable low down, a pair of chidori, a curved kara-hafu
            const tri = (gx, gw, curved) => {
              for (let j = 0; j < gw / 2 + 1; j++) {
                const yy = eave - 1 - j;
                const half = curved ? gw / 2 - Math.round((j * j) / (gw / 2)) : gw / 2 - j;
                if (half < 0) break;
                for (let xx = Math.round(gx - half); xx <= Math.round(gx + half); xx++) {
                  const edge = Math.abs(xx - gx) >= half - 1;
                  img.set(xx, yy, edge ? RK[4] : j < 2 ? C.plaster[2] : C.plaster[1]);
                }
              }
              img.set(Math.round(gx), eave - 2, C.board[0]);
              img.set(Math.round(gx), eave - 3, C.gold);
            };
            if (i === 0) tri(cx, 18, false);
            if (i === 1) for (const s of [-1, 1]) tri(cx + s * 10, 9, false);
            if (i === 2) tri(cx, 12, true);
            if (i === 4) tri(cx, 10, false);
          }
          // the top ridge and its two shachihoko
          const topWall = parts[parts.length - 1].wallTop;
          const ridgeY = topWall + 1 - roofH[roofH.length - 1] + 1;
          img.rect(cx - 8, ridgeY, 16, 1, RK[0]);
          img.rect(cx - 7, ridgeY - 1, 14, 1, C.plaster[1]);
          for (const s of [-1, 1]) {
            const fx = Math.round(cx + s * 8) - (s > 0 ? 1 : 0);
            img.set(fx, ridgeY - 1, 0x5a4a28);
            img.set(fx, ridgeY - 2, C.gold);
            img.set(fx + s, ridgeY - 3, C.gold);
            glow(fx, ridgeY - 2, C.goldHi, 0.5);
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
        img.rect(x, Y(u), 2, 1, C.granite[3]);
        img.set(x, Y(u) + 1, C.granite[0]);
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
      sprite(3, 5, 400, (r) => {
        r.rect(1, 0, 1, 4, col);
        r.rect(0, 1, 3, 2, col);
        r.set(f ? 0 : 2, 4, scaleColor(col, 0.8));
        r.set(1, 1, 0xffffff);
      }),
    );
    for (const [kx, ku, col] of [[30, 230, 0xf26430], [150, 220, 0xfff0d8], [24, 400, 0xe83828], [170, 520, 0xf4a030], [140, 240, 0xffffff], [8, 600, 0xf26430]])
      kit.wander(kx, ku, 8, 14, koiF(col), { n: 2, sp: 4, turn: 'rot', fps: 3 });
    const duckF = duckF0(300);
    kit.wander(36, 232, 18, 10, duckF, { n: 3, sp: 3, turn: 'flip', fps: 2, idle: 0.4 });
    kit.wander(150, 250, 12, 14, duckF, { n: 2, sp: 3, turn: 'flip', fps: 2, idle: 0.4 });
    const heronF = [0, 1].map((f) =>
      sprite(4, 6, 190, (r) => {
        r.rect(1, 2, 2, 3, 0x9aa0a8);
        r.set(2, 1, 0xd8dce0);
        r.set(f ? 3 : 2, f ? 1 : 0, 0xe8e8ec);
        r.set(f ? 3 : 3, f ? 2 : 0, 0xd8a040);
        r.set(1, 5, 0x5a5048);
        r.set(2, 5, 0x5a5048);
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
    for (let u = g0; u < g1; u++)
      for (let x = gx0; x < gx1; x++) {
        const y = Y(u);
        const n = fbm(x, y, { seed: 171, scale: 8, octaves: 3 });
        img.set(x, y, rampColor(n > 0.5 ? C.lawn : C.moss, 0.2 + n * 0.65, x, y));
      }
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
    for (let u = g0 + 60; u < g1 - 10; u++)
      for (let x = gx0 + 2; x < gx1 - 2; x++) {
        const y = Y(u);
        const v = pondV(x, u);
        if (v < 0.62) {
          if (isle(x, u)) {
            img.set(x, y, rampColor(C.moss, 0.35 + fbm(x, y, { seed: 207, scale: 3 }) * 0.5, x, y));
            continue;
          }
          let c = rampColor(C.pond, 0.25 + fbm(x, y * 2, { seed: 208, scale: 6 }) * 0.6, x, y);
          if (pondV(x, u + 3) >= 0.62 || pondV(x, u + 2) >= 0.62) c = scaleColor(c, 0.7); // the far bank mirrored
          if (fbm(x * 2, y, { seed: 209, scale: 3 }) > 0.8 && (x + y) % 2) c = scaleColor(c, 1.25);
          img.set(x, y, c);
          wet[y * W + x] = 1;
        } else if (v < 0.68) {
          // stone edging and boulders along the water
          img.set(x, y, (x * 5 + u * 3) % 7 < 3 ? C.granite[3] : C.granite[1]);
        } else if (v > 0.86 && v < 1.0) {
          img.set(x, y, rampColor(C.gravel, 0.4 + fbm(x, y, { seed: 210, scale: 3 }) * 0.5, x, y)); // the strolling path
        }
      }
    // rocks and trimmed black pines on the islets, stone slab bridges out to two of them
    for (const [ix, iu, rx] of ISLES) {
      tree(ix, Y(iu) - 1, Math.max(3, rx * 0.55), C.pine, ix * 7 + iu, 'pine');
      img.rect(ix - rx + 2, Y(iu) + 2, 2, 2, C.granite[3]);
      img.set(ix - rx + 3, Y(iu) + 3, C.granite[0]);
    }
    for (const [x0, x1, u] of [[54, 65, 905], [116, 124, 935]]) for (let x = x0; x < x1; x++) for (let du = 0; du < 3; du++) img.set(x, Y(u + du), du === 2 ? C.granite[1] : C.granite[3]);
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
          const span = xs[1] - xs[0];
          for (let x = xs[0]; x < xs[1]; x++) {
            const t = (x - xs[0]) / (span - 1);
            const hump = Math.sin(t * Math.PI);
            const lift = Math.round(hump * 3);
            for (let du = -2; du <= 3; du++) {
              const yy = Y(bu + du) - lift;
              let c = du === 3 ? C.granite[4] : du === -2 ? C.granite[1] : hump > 0.7 ? C.granite[4] : hump > 0.35 ? C.granite[3] : C.granite[2];
              if (du > -2 && du < 3 && x % 3 === 0) c = scaleColor(c, 0.88); // the slab joints across the deck
              img.set(x, yy, c);
            }
            // the south face of the arch: stone voussoirs over the dark opening
            const open = Math.max(0, hump * 6 - 1);
            const faceY = Y(bu - 2) - lift + 1;
            for (let k = 0; k < 6; k++) {
              const yy = faceY + k;
              const inside = k >= 6 - open;
              img.set(x, yy, inside ? 0x0e2420 : k < 2 ? C.granite[2] : C.granite[1]);
            }
            // the reflection under it closes the circle
            for (let k = 0; k < open; k++) img.set(x, faceY + 6 + k, k < open - 1 ? 0x163a34 : C.granite[1], 0.75);
          }
        },
      });
      reserveRect(xs[0], Y(bu + 6), xs[1] - xs[0], 18);
    }
    // the garden walls: white plaster under tiles, a gate in the south wall
    objects.push({
      y: Y(g0) + 1,
      draw: () => {
        for (let x = gx0; x < gx1; x++) {
          if (x >= 86 && x < 99) continue;
          img.set(x, Y(g0 + 3), C.kawara[3]);
          img.set(x, Y(g0 + 2), C.kawara[1]);
          img.set(x, Y(g0 + 1), C.plaster[2]);
          img.set(x, Y(g0), C.plaster[0]);
        }
      },
    });
    for (let u = g0; u < g1; u++) {
      img.set(gx0, Y(u), C.kawara[3]);
      img.set(gx0 + 1, Y(u), C.plaster[1]);
      img.set(gx1 - 2, Y(u), C.plaster[1]);
      img.set(gx1 - 1, Y(u), C.kawara[1]);
    }
    for (let x = gx0; x < gx1; x++) {
      img.set(x, Y(g1 - 1), C.kawara[3]);
      img.set(x, Y(g1 - 2), C.plaster[1]);
    }
    hall(84, Y(g0 + 10), 17, 6, 4, C.kawara, 'temple', { open: true, gable: 'tri', gw: 7, crest: false });
    gravelPath(88, 97, g0 + 4, g0 + 62);
    fillU(56, 130, g0 + 6, g0 + 52, C.gravel, 211, 3);
    hall(122, Y(g0 + 30), 10, 5, 4, C.kawara, 'shop', { noren: 0x2a3a6a }); // the ticket office
    // Seifūkan: the thatched main tea house looking over the pond from the south-west
    hall(54, Y(856), 26, 12, 5, C.thatch, 'temple', { hip: true, ridge: true, wall: 0xe8e0c8, bay: 4 });
    for (let x = 55; x < 79; x++) img.set(x, Y(831), x % 3 ? C.hinoki[2] : C.hinoki[0]); // the veranda over the water
    // Meigetsu-tei on its little hill in the north-east, and the miniature Mt Fuji
    disc(122, Y(1140), 11, C.lawn, 212);
    hall(112, Y(1158), 18, 9, 4, C.thatch, 'temple', { wall: 0xe8e0c8, bay: 4 });
    for (let k = 0; k < 9; k++) {
      const r = 9 - k;
      for (let a = 0; a < Math.PI * 2; a += 0.08) img.set(Math.round(128 + Math.cos(a) * r), Math.round(Y(890) + Math.sin(a) * r * 0.75), rampColor(C.lawn, 0.25 + k * 0.08, k, a | 0));
    }
    // the waterfall at the north end tumbling into the pond (live), the rice paddy and the tea hedges
    for (let u = 1188; u < 1206; u++) for (let x = 88; x < 99; x++) img.set(x, Y(u), (x + u) % 4 ? C.granite[1] : C.granite[3]);
    const fallF = [0, 1, 2].map((k) =>
      sprite(5, 12, 1195, (r) => {
        for (let y = 0; y < 12; y++)
          for (let x = 0; x < 5; x++) {
            const s = (y + k * 3 + x * 2) % 6;
            r.set(x, y, s < 2 ? 0xffffff : s < 4 ? 0xc8e8ec : 0x8cbcc4, 0.85);
          }
      }),
    );
    kit.loop(91, 1198, fallF, { fps: 8, d: 0.03 });
    kit.spot([[86, 1188, 14, 6]], glintF0(), { rate: 3, fps: 6, a: 0.7 });
    for (let u = 1150; u < 1192; u++)
      for (let x = 54; x < 82; x++) {
        const y = Y(u);
        const ridge = (u - 1150) % 4 === 0 || x === 54 || x === 81;
        img.set(x, y, ridge ? C.moss[1] : (x + u) % 2 ? 0xd8b048 : 0xc09a38);
      }
    for (let u = 1152; u < 1192; u += 4) for (let x = 108; x < 134; x++) img.set(x, Y(u), rampColor(C.camphor, 0.4 + ((x * 3) % 5) * 0.1, x, Y(u)));
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
    fillU(px0, px1, DOME[0], DOME[1], C.lawn, 181, 7);
    fillU(px0, px1, DOME[0], DOME[0] + 10, C.paving, 182, 4);
    fillU(px0, px1, 1408, MOTOYASU[0], C.paving, 183, 4);
    gangi(px0, px1, MOTOYASU[0] - 1, 1);
    gangi(0, 21, MOTOYASU[0] - 1, 1);
    gangi(157, W, MOTOYASU[0] - 1, 1);
    gravelPath(px0, px1, 1312, 1320, C.paving);
    gravelPath(AXIS - 4, AXIS + 5, DOME[0] + 10, 1312, C.paving);
    // the fence round the ruin
    for (let x = 54; x <= 130; x++) {
      if (x % 2 === 0) {
        img.set(x, Y(1324), 0x3a3a40);
        img.set(x, Y(1406), 0x3a3a40);
      }
      img.set(x, Y(1324) - 1, 0x5a5a62);
    }
    for (let u = 1324; u <= 1406; u++) if (u % 2 === 0) {
      img.set(54, Y(u), 0x3a3a40);
      img.set(130, Y(u), 0x3a3a40);
    }
    reserveRect(54, Y(1406), 77, 84);

    /**
     * The Dome: Jan Letzel's Industrial Promotion Hall as it stands since 6 August 1945. Three storeys of brick
     * under stone and mortar, roofless, the wings broken to different heights round an open court, the five-storey
     * stair tower on the river side and the bare steel ribs of its oval copper dome.
     * Walls are extruded boxes: [x0, x1, u0, u1, height, ruin (0 whole .. 1 broken)].
     */
    {
      const S = C.domeStone;
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
      const jag = (x, ruin, h, seed) => {
        const n = fbm(x * 1.3, seed, { seed: 191, scale: 4 });
        return Math.max(2, Math.round(h * (1 - ruin * Math.max(0, n * 1.6 - 0.25))));
      };
      const box = ([x0, x1, u0, u1, h, ruin], seed) => {
        // the top of the wall (brick showing where it broke), then its south face with window openings
        for (let x = x0; x < x1; x++) {
          const hh = jag(x, ruin, h, seed);
          const broken = hh < h - 1;
          for (let u = u0; u < u1; u++) img.set(x, Y(u) - hh, broken ? C.brick[1 + ((x + u) % 2)] : S[4]);
          const fy = Y(u0) - hh;
          for (let k = 0; k < hh; k++) {
            const yy = fy + k + 1;
            const fromTop = k;
            const floor = Math.floor((hh - k) / 6);
            const inFloor = (hh - k) % 6;
            let c = rampColor(S, 0.75 - (k / Math.max(1, hh)) * 0.35 + fbm(x, yy, { seed: 192, scale: 2 }) * 0.25, x, yy);
            if (broken && fromTop < 2) c = C.brick[(x + k) % 3];
            // arched windows, two per bay, on each floor
            const lx = x - x0;
            if (x1 - x0 > 5 && lx % 5 >= 2 && lx % 5 <= 3 && inFloor >= 2 && inFloor <= 4 && floor < 3) c = inFloor === 4 && lx % 5 === 3 ? scaleColor(c, 0.6) : 0x1a1410;
            if (inFloor === 0 && k > 0) c = scaleColor(c, 0.82); // the string course between floors
            if (fbm(x * 2, yy, { seed: 193, scale: 3 }) > 0.74) c = scaleColor(c, 0.7); // scorching
            if (x === x1 - 1) c = scaleColor(c, 0.78);
            img.set(x, yy, c);
          }
        }
      };
      objects.push({
        y: Y(1342) + 1,
        shadow: () => {
          shadowRect(66, Y(1400) - 10, 68, 60, 0.6);
          shadowRect(90, Y(1398) - 30, 22, 24, 0.6);
        },
        draw: () => {
          // the floors inside: rubble long since cleared to brick-strewn ground, a few iron beams and the braces
          // that hold the walls up today
          for (let u = 1343; u < 1398; u++)
            for (let x = 59; x < 125; x++) {
              const y = Y(u) - 3;
              const court = x >= 80 && x < 104 && u < 1375;
              let c = court ? rampColor(C.lawn, 0.3 + fbm(x, y, { seed: 194, scale: 3 }) * 0.4, x, y) : rampColor(C.rust, 0.3 + fbm(x, y, { seed: 195, scale: 2 }) * 0.6, x, y);
              if (!court && (x * 7 + u * 11) % 23 === 0) c = C.brick[2];
              img.set(x, y, c);
            }
          // back to front so the nearer walls cover the farther ones
          const order = walls.map((w, i) => [w, i]).sort((a, b) => b[0][2] - a[0][2]);
          // the stair tower (behind the court's back wall)
          const [tx0, tx1, tu0, tu1, th] = tower;
          for (const [w, i] of order) if (w[2] >= tu1 - 2) box(w, i * 17 + 3);
          box([tx0, tx1, tu1 - 3, tu1, th, 0.05], 401);
          box([tx0, tx0 + 3, tu0, tu1, th, 0.05], 402);
          box([tx1 - 3, tx1, tu0, tu1, th, 0.05], 403);
          box([tx0, tx1, tu0, tu0 + 3, th, 0.08], 404);
          // the dome: an oval ring, the bare ribs rising to the lantern ring, the dark shaft between them
          const dcx = (tx0 + tx1) / 2;
          const dcy = Y((tu0 + tu1) / 2) - th;
          for (let a = 0; a < Math.PI * 2; a += 0.03) {
            const x = Math.round(dcx + Math.cos(a) * 11);
            const y = Math.round(dcy + Math.sin(a) * 7.5);
            img.set(x, y, C.rust[2]);
            img.set(x, y + 1, C.rust[0]);
          }
          for (let yy = Math.round(dcy - 7); yy <= dcy + 7; yy++)
            for (let xx = Math.round(dcx - 11); xx <= dcx + 11; xx++)
              if (((xx + 0.5 - dcx) / 10.5) ** 2 + ((yy + 0.5 - dcy) / 7) ** 2 < 1) img.set(xx, yy, 0x120e0c);
          const crown = [dcx, dcy - 8];
          for (let k = 0; k < 16; k++) {
            const a = (k / 16) * Math.PI * 2;
            const bx = dcx + Math.cos(a) * 11;
            const by = dcy + Math.sin(a) * 7.5;
            // each rib curves up to the crown: a short arc, lit on the west side
            for (let t = 0; t <= 1; t += 0.08) {
              const x = bx + (crown[0] + Math.cos(a) * 1.5 - bx) * t;
              const y = by + (crown[1] + Math.sin(a) * 1 - by) * t - Math.sin(t * Math.PI) * 4;
              img.set(Math.round(x), Math.round(y), Math.cos(a) < 0 ? C.rust[3] : C.rust[1]);
            }
          }
          for (let a = 0; a < Math.PI * 2; a += 0.3) img.set(Math.round(crown[0] + Math.cos(a) * 1.5), Math.round(crown[1] + Math.sin(a)), C.rust[3]);
          // a middle ring half way up
          for (let a = 0; a < Math.PI * 2; a += 0.04) img.set(Math.round(dcx + Math.cos(a) * 7), Math.round(dcy - 4.5 + Math.sin(a) * 4.6), C.rust[2]);
          for (const [w, i] of order) if (w[2] < tu1 - 2) box(w, i * 17 + 3);
          // steel braces inside the broken west wing
          img.line(62, Y(1370) - 10, 76, Y(1350) - 4, C.rust[1]);
          img.line(62, Y(1350) - 4, 76, Y(1370) - 10, C.rust[1]);
        },
      });
    }
    // the UNESCO stone, the camphors that grew back, willows by the water
    img.rect(66, Y(1316), 5, 2, C.granite[1]);
    img.rect(66, Y(1317), 5, 1, C.granite[3]);
    for (const [tx, tu, pal] of [[50, 1268, C.camphor], [134, 1272, C.camphor], [50, 1350, C.camphor], [134, 1360, C.ginkgo], [52, 1414, C.willow], [134, 1416, C.willow], [112, 1290, C.sakuraAut]])
      tree(tx, Y(tu), 5.5, pal, tx * 13 + tu);
    for (const bx of [54, 104]) {
      for (let u = 1266; u < 1300; u++)
        for (let x = bx + 4; x < bx + 26; x++) {
          const d = Math.hypot((x - bx - 15) / 11, (u - 1283) / 17);
          if (d < 1 && d > 0.55) img.set(x, Y(u), [0xf8f0e0, 0xe8c040, 0xd85a6a, 0xf8f0e0][(x + u) % 4]);
          else if (d <= 0.55) img.set(x, Y(u), rampColor(C.lawn, 0.6, x, Y(u)));
        }
      bench(bx + 2, Y(1262), 6);
      bench(bx + 24, Y(1262), 6);
    }
    grove(px0 + 2, px1 - 2, DOME[0] + 12, 1310, 10, [C.camphor, C.sakuraAut, C.ginkgo], 1790, 4, 5.5);
    strollers(92, 1300, 34, 10, 6);
    schoolGroup([[60, 1316], [124, 1316]], 9, 1316, 0.6);
    crowd(70, Y(1418), 50, 6, 14, true);

    // Genbaku Dōmu-mae: the tram stop on the boulevard, two narrow platforms under shelters, people waiting
    for (const [x0, x1] of [[27, 29], [39, 41]]) {
      for (let u = 1268; u < 1300; u++) for (let x = x0; x < x1; x++) img.set(x, Y(u), x === x0 ? C.granite[3] : C.granite[2]);
      objects.push({
        y: Y(1272),
        draw: () => {
          img.rect(x0, Y(1294), 2, 18, 0xc8ccd0);
          img.rect(x0, Y(1294), 2, 1, 0xe8ecf0);
          for (let u = 1276; u < 1294; u += 6) img.set(x0, Y(u), 0x2a6a4a);
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
        for (let yy = Y(1312); yy < Y(1312) + 24; yy++) for (let x = 158; x < 179; x++) img.set(x, yy, (x + yy) % 3 ? C.hinoki[2] : C.hinoki[1]);
        img.rect(160, Y(1312) + 3, 17, 2, 0x8a7458);
        crowd(160, Y(1312) + 6, 16, 14, 12, true);
      },
      front: (fy) => {
        for (let yy = fy + 1; yy < fy + 34; yy++)
          for (let x = 159; x < 164; x++) {
            const deep = (yy - fy) / 34;
            if (fbm(x * 3, yy * 3, { seed: 196, scale: 1.5 }) < 0.3 + deep * 0.7) img.set(x, yy, rand.pick([0xe83838, 0xf8d040, 0x3a8ae0, 0x48c060, 0xf0f0f0, 0xe868b0]));
          }
      },
    });
    district(0, 21, 1246, 1428, 'office');
    district(157, W, 1318, 1426, 'office');

    // ---- the Motoyasu: lanterns set afloat for the souls, a sightseeing boat, glints
    {
      const ru = (MOTOYASU[0] + MOTOYASU[1]) / 2;
      const toroFrames = [0, 1].map((f) =>
        sprite(5, 6, ru, (r) => {
          r.rect(0, 4, 5, 2, 0x5a3a20);
          r.rect(1, 0, 3, 4, f ? 0xffe898 : 0xffc868);
          r.set(2, 1, 0xffffff);
          r.set(1, 3, 0xe8a040);
          r.set(3, 3, 0xe8a040);
        }),
      );
      for (const [lu, sp, n, dir] of [[ru - 14, 6, 7, 1], [ru + 2, 5, 6, 1], [ru + 16, 7, 5, -1]]) {
        const pts = dir > 0 ? [[-10, lu], [W + 10, lu + 2]] : [[W + 10, lu], [-10, lu - 2]];
        kit.path(pts, toroFrames, { sp, n, gap: 34, fps: 2, d: 0.02, turn: 'none' });
      }
      const boat = capture(80, Y(ru + 5), 18, 8, () => {
        const by = Y(ru + 5);
        img.rect(81, by + 1, 16, 6, 0xeef2f6);
        img.rect(80, by + 2, 1, 4, 0xeef2f6);
        img.rect(84, by + 2, 10, 4, 0x2c5a78);
        for (let x = 85; x < 94; x += 2) img.set(x, by + 3, 0x9ad0f0);
        img.rect(81, by + 6, 16, 1, 0x2a6a9a);
      });
      kit.path([[-20, ru + 6], [W + 20, ru + 6]], [boat], { sp: 13, n: 1, d: 0.02, turn: 'none', wake: { f: wakeF0(ru), every: 5, life: 1.6 } });
      kit.spot([[0, MOTOYASU[1] - 4, W, 80]], glintF0(ru), { rate: 1.6, fps: 6, a: 0.75 });
    }

    // ---- Peace Memorial Park, u = 1520..1964
    const [p0, p1] = PARK;
    for (let u = p0; u < p1; u++)
      for (const [x0, x1] of [[0, 22], [px0, px1], [156, W]])
        for (let x = x0; x < x1; x++) {
          const y = Y(u);
          img.set(x, y, rampColor(C.lawn, 0.22 + fbm(x, y, { seed: 201, scale: 9, octaves: 3 }) * 0.6, x, y));
        }
    // the river walk along the north bank, the boat pier to Miyajima
    fillU(0, W, p0, p0 + 14, C.paving, 202, 4);
    gangi(0, W, p0, -1);
    for (let x = 4; x < W; x += 9) if (x < 22 || (x > 46 && x < 140) || x > 156) img.set(x, Y(p0 + 13), 0x4a4a52);
    objects.push({
      y: Y(p0 - 6),
      shadow: () => shadowRect(114, Y(p0 - 1), 24, 8, 0.6),
      draw: () => {
        img.rect(112, Y(p0 + 1), 24, 7, 0x8a8e94);
        img.rect(112, Y(p0 + 1), 24, 1, 0xb8bcc0);
        img.rect(113, Y(p0 - 5), 22, 1, 0xe8d848);
        img.rect(122, Y(p0 + 6), 3, 6, C.paving[2]);
      },
    });
    // the Aqua Net boat: in to the pier, a wait, then away downriver towards the sea and Miyajima
    {
      const aq = capture(60, Y(1505), 20, 8, () => {
        const by = Y(1505);
        img.rect(61, by + 1, 18, 6, 0xf4f6f8);
        img.rect(78, by + 2, 2, 4, 0xf4f6f8);
        img.rect(64, by + 2, 11, 4, 0x1e3c6a);
        for (let x = 65; x < 75; x += 2) img.set(x, by + 3, 0x8ac0f0);
        img.rect(61, by + 6, 18, 1, 0xd83a2a);
      });
      kit.path([[124, 1510], [60, 1508], [-24, 1504]], [aq], { sp: 12, mode: 'pp', hold: 8, d: 0.02, turn: 'flip', wake: { f: wakeF0(1500), every: 5, life: 1.6 } });
    }
    // the main axis walk from the Museum to the river, with the side walks
    gravelPath(AXIS - 6, AXIS + 7, p0 + 14, 1600, C.plaza);
    gravelPath(px0, px1, 1546, 1552, C.paving);
    gravelPath(px0, px1, 1760, 1766, C.paving);

    // the Peace Bell: a little domed shelter over the bell in a lotus pool
    {
      const bx = 124;
      const bu = 1574;
      for (let u = bu - 10; u <= bu + 10; u++)
        for (let x = bx - 12; x <= bx + 12; x++) {
          const d = Math.hypot(x - bx, (u - bu) * 1.2);
          const y = Y(u);
          if (d < 11) {
            img.set(x, y, fbm(x, y, { seed: 213, scale: 2 }) > 0.55 ? rampColor(C.lotus, 0.5, x, y) : rampColor(C.peacePond, 0.4 + fbm(x, y, { seed: 214, scale: 3 }) * 0.4, x, y));
            wet[y * W + x] = 1;
          } else if (d < 12.5) img.set(x, y, C.granite[3]);
        }
      objects.push({
        y: Y(bu) + 3,
        shadow: () => shadowEllipse(bx + 3, Y(bu) - 2, 6, 4, 0.6),
        draw: () => {
          const y = Y(bu);
          for (const dx of [-4, 4]) img.rect(bx + dx, y - 7, 1, 8, C.concrete[2]);
          img.rect(bx - 1, y - 5, 3, 4, 0x7a5a2a); // the bell
          img.set(bx, y - 2, 0x9a7a3a);
          for (let yy = -5; yy <= 0; yy++)
            for (let xx = -6; xx <= 6; xx++) {
              if ((xx / 6) ** 2 + ((yy + 0.5) / 5) ** 2 > 1) continue;
              img.set(bx + xx, y - 9 + yy, rampColor(C.copper, 0.85 - (xx + 6) / 16 - (yy + 5) / 14, xx, yy));
            }
          img.set(bx, y - 15, C.copper[4]);
          img.rect(bx - 1, Y(bu - 11), 3, 4, C.granite[2]); // the walkway out to it
        },
      });
      reserveRect(bx - 13, Y(bu + 11), 26, 24);
    }
    // the Children's Peace Monument: Sadako holding up her golden crane on the slender tripod, the booths of
    // paper-crane garlands sent from all over the world behind it
    {
      const mx = 60;
      const mu = 1580;
      disc(mx, Y(mu), 12, C.plaza, 215);
      for (let a = 0; a < Math.PI * 2; a += 0.05) img.set(Math.round(mx + Math.cos(a) * 12), Math.round(Y(mu) + Math.sin(a) * 12), C.granite[1]);
      objects.push({
        y: Y(mu) + 4,
        shadow: () => {
          for (let k = 0; k < 20; k++) img.tint(mx + 2 + Math.round(k * 0.6), Y(mu) + 1 + Math.round(k * 0.25), 0.6);
        },
        draw: () => {
          const y = Y(mu);
          // three tapering legs meeting near the top
          for (let k = 0; k < 20; k++) {
            const t = k / 20;
            const spread = (1 - t) * 5;
            img.set(Math.round(mx - spread), y - k, C.granite[3]);
            img.set(Math.round(mx + spread), y - k, C.granite[1]);
            if (k < 14) img.set(mx, y - k - 1, C.granite[2]);
          }
          img.rect(mx - 6, y, 13, 2, C.granite[2]);
          // the boy and the girl on the sides, Sadako at the top with arms raised, the crane above her
          img.set(mx - 4, y - 7, 0x6a5038);
          img.set(mx + 4, y - 7, 0x5a4430);
          img.rect(mx, y - 23, 1, 3, 0x5a4430);
          img.set(mx - 1, y - 24, 0x6a5038);
          img.set(mx + 1, y - 24, 0x5a4430);
          img.set(mx, y - 26, C.gold);
          img.set(mx - 1, y - 26, C.goldHi);
          img.set(mx + 1, y - 26, C.gold);
          glow(mx, y - 26, C.goldHi, 0.7);
          img.rect(mx - 1, y - 14, 3, 2, 0x7a6a3a); // the crane-shaped bell hanging inside
        },
      });
      // the booths
      for (let k = 0; k < 5; k++) {
        const bx = 40 + k * 9;
        const bu = 1598 + Math.round(Math.abs(k - 2) * -2);
        objects.push({
          y: Y(bu) + 1,
          shadow: () => shadowRect(bx + 2, Y(bu) - 6, 8, 7, 0.6),
          draw: () => {
            const y = Y(bu);
            img.rect(bx, y - 8, 8, 2, 0xd8dcde);
            img.rect(bx, y - 6, 8, 7, 0x9aa8b0);
            for (let x = bx + 1; x < bx + 7; x++)
              for (let yy = y - 5; yy < y; yy++) img.set(x, yy, [0xe83838, 0xf88838, 0xf8d040, 0x48c060, 0x3a8ae0, 0x9a58d0, 0xf06aa8, 0xf0f0f0][(x * 3 + yy * 7 + k) % 8]);
            img.rect(bx, y - 6, 1, 7, 0xe8f0f4);
            img.rect(bx + 7, y - 6, 1, 7, 0x6a7a84);
          },
        });
      }
      reserveRect(mx - 22, Y(1606), 46, 40);
    }
    // the Atomic Bomb Memorial Mound with its little stupa
    {
      const mx = 58;
      const mu = 1648;
      for (let u = mu - 9; u <= mu + 9; u++)
        for (let x = mx - 11; x <= mx + 11; x++) {
          const d = Math.hypot((x - mx) / 11, (u - mu) / 9);
          if (d < 1) img.set(x, Y(u), rampColor(C.lawn, 0.95 - d * 0.5 + (mx - x) * 0.02 + (u - mu) * 0.02, x, u));
        }
      img.rect(mx - 1, Y(mu) - 6, 3, 5, C.granite[3]);
      img.set(mx, Y(mu) - 7, C.granite[4]);
      img.set(mx, Y(mu) - 8, C.granite[2]);
      reserveRect(mx - 12, Y(mu + 10), 24, 20);
    }
    // the Pond of Peace with the Flame of Peace at its north end
    {
      const [q0, q1] = [1606, 1700];
      for (let u = q0 - 2; u < q1 + 2; u++)
        for (let x = AXIS - 11; x < AXIS + 12; x++) {
          const y = Y(u);
          const rim = u < q0 || u >= q1 || x < AXIS - 9 || x >= AXIS + 10;
          if (rim) img.set(x, y, C.granite[(x + u) % 2 ? 3 : 2]);
          else {
            let c = rampColor(C.peacePond, 0.35 + fbm(x, y * 2, { seed: 216, scale: 6 }) * 0.5, x, y);
            if (u > q1 - 4) c = scaleColor(c, 0.75);
            img.set(x, y, c);
            wet[y * W + x] = 1;
          }
        }
      reserveRect(AXIS - 12, Y(q1 + 2), 24, q1 - q0 + 6);
      // the pedestal at the pond's end towards the Dome: two upturned palms joined at the wrists, the flame
      // burning between them
      const fy = Y(q0 + 4);
      objects.push({
        y: fy + 4,
        shadow: () => shadowRect(AXIS - 4, fy - 2, 14, 6, 0.6),
        draw: () => {
          for (let k = 0; k < 7; k++) {
            img.rect(AXIS - 9 + k, fy - 2 - Math.round(k * 0.5), 2, 3, C.concrete[3 - (k > 4 ? 1 : 0)]);
            img.rect(AXIS + 8 - k, fy - 2 - Math.round(k * 0.5), 2, 3, C.concrete[k > 4 ? 1 : 0]);
          }
          img.rect(AXIS - 2, fy - 4, 5, 6, C.concrete[2]);
          img.rect(AXIS - 2, fy - 5, 5, 1, C.concrete[4]);
          pool(AXIS + 0.5, fy - 6, 14, 0xff8c38, 0.3);
        },
      });
      const flameF = [0, 1, 2].map((k) =>
        sprite(5, 7, 1700, (r) => {
          r.rect(1, 3, 3, 4, 0xe84824);
          r.rect(1 + (k === 1 ? 1 : 0), 1 + (k === 2 ? 1 : 0), 2, 4, 0xffa830);
          r.set(2, k === 0 ? 0 : 1, 0xfff4b0);
          r.set(2, 4, 0xfff8d0);
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
          img.rect(AXIS - 14, cy, 29, 2, C.granite[2]);
          img.rect(AXIS - 14, cy, 29, 1, C.granite[4]);
          // the chest, dark granite
          img.rect(AXIS - 4, cy - 4, 9, 4, 0x2a2a30);
          img.rect(AXIS - 4, cy - 4, 9, 1, 0x4a4a54);
          // the arch: legs flaring out at the foot, a curved saddle on top
          for (let dx = -12; dx <= 12; dx++) {
            const t = Math.abs(dx) / 12;
            const top = Math.round(cy - 13 + t * t * 4);
            const isLeg = Math.abs(dx) >= 10;
            if (isLeg) for (let yy = top; yy < cy; yy++) img.set(AXIS + dx, yy, dx < 0 ? C.concrete[3] : C.concrete[1]);
            img.set(AXIS + dx, top - 1, C.concrete[4]);
            img.set(AXIS + dx, top, C.concrete[3]);
            img.set(AXIS + dx, top + 1, C.concrete[2]);
            img.set(AXIS + dx, top + 2, C.concrete[1]);
          }
          // flowers laid in front
          for (let k = 0; k < 16; k++) img.set(AXIS - 8 + k, cy + 2 + (k % 2), [0xf8f8f0, 0xf8d040, 0xe85a6a, 0xf8f8f0, 0xb070d0][k % 5]);
        },
      });
      reserveRect(AXIS - 15, cy - 16, 30, 20);
      kit.emit(AXIS + 6, 1720, thinSmoke, { rate: 1, life: [1.4, 2.2], vy: 6, sx: 1, wf: 0.6, a: 0.35, tint: 1 });
    }
    // the plaza between the Cenotaph and the Museum: granite paving, benches, lamps, the Fountain of Prayer
    fillU(px0 + 4, px1 - 4, 1730, 1836, C.plaza, 217, 6);
    for (let u = 1734; u < 1836; u += 8) for (let x = px0 + 4; x < px1 - 4; x++) img.set(x, Y(u), scaleColor(C.plaza[1], 0.92));
    reserveRect(px0 + 4, Y(1836), px1 - px0 - 8, 106);
    for (const u of [1744, 1792]) {
      bench(56, Y(u), 6);
      bench(122, Y(u), 6);
      streetLamp(54, u + 14);
      streetLamp(130, u + 14);
    }
    {
      const fu = 1830;
      const fy = Y(fu);
      for (let yy = -8; yy <= 8; yy++)
        for (let xx = -16; xx <= 16; xx++) {
          const d = (xx / 16) ** 2 + (yy / 8) ** 2;
          if (d > 1) continue;
          const x = AXIS + xx;
          const y = fy + yy;
          img.set(x, y, d > 0.82 ? C.granite[3] : d > 0.36 && d < 0.46 ? C.granite[2] : rampColor(C.peacePond, 0.5 + fbm(x, y, { seed: 218, scale: 3 }) * 0.4, x, y));
          if (d <= 0.82) wet[y * W + x] = 1;
        }
      const jetF = [0, 1, 2].map((k) =>
        sprite(30, 12, fu, (r) => {
          for (let j = 0; j < 9; j++) {
            const cx = 3 + j * 3;
            const h = 4 + ((j + k) % 3) * 2 + (j === 4 ? 3 : 0);
            for (let t = 0; t < h; t++) r.set(cx, 11 - t, t > h - 2 ? 0xffffff : 0xd8f0f8, 0.75);
            r.set(cx - 1, 11 - h + 1 + ((k + j) % 2), 0xe8f8ff, 0.6);
            r.set(cx + 1, 11 - h + 2, 0xe8f8ff, 0.6);
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
          // the roof
          for (let u = fu; u < fu + depth; u++)
            for (let x = mx0; x < mx1; x++) {
              const y = Y(u) - H;
              let c = rampColor(C.concrete, 0.55 + fbm(x, y, { seed: 219, scale: 4 }) * 0.25, x, y);
              if (u === fu + depth - 1 || x === mx0) c = C.concrete[4];
              if (u === fu || x === mx1 - 1) c = C.concrete[1];
              img.set(x, y, c);
            }
          // the louvred front
          const ty = Y(fu) - H;
          for (let yy = ty; yy < ty + body; yy++)
            for (let x = mx0; x < mx1; x++) {
              const ly = yy - ty;
              let c = (x - mx0) % 3 === 0 ? C.concrete[3] : (x - mx0) % 3 === 1 ? C.concrete[2] : 0x3a3a40;
              if (ly === 0 || ly === body - 1) c = C.concrete[ly === 0 ? 4 : 1];
              if (ly === body - 2) c = 0x5a5a60;
              img.set(x, yy, c);
            }
          // under it: the open ground floor in shade, the columns
          for (let yy = ty + body; yy < Y(fu); yy++)
            for (let x = mx0; x < mx1; x++) {
              const c = img.get(x, yy);
              img.set(x, yy, scaleColor(c, 0.45));
              if ((x - mx0) % 9 === 4) img.set(x, yy, C.concrete[2]);
              if ((x - mx0) % 9 === 5) img.set(x, yy, C.concrete[0]);
            }
        },
      });
      reserveRect(mx0 - 1, Y(fu + depth) - H - 1, mx1 - mx0 + 2, depth + H + 2);
      crowd(mx0 + 4, Y(fu) - 6, mx1 - mx0 - 8, 5, 18, true);
      building(158, Y(1878), 22, 26, 14, { style: 'office', wall: C.concrete[3], roof: C.concrete[2] }); // East Building
      building(0, Y(1880), 21, 28, 14, { style: 'glass', wall: 0x7a8a94, roof: C.concrete[2] }); // the conference centre
    }
    // trees: camphors along the plaza, cherries by the river, ginkgo gold, lawns kept open on the axis
    grove(px0 + 2, px1 - 2, p0 + 18, 1726, 44, [C.camphor, C.camphor, C.sakuraAut, C.ginkgo, C.momijiR], 1801, 4, 6.5);
    grove(0, 21, p0 + 16, 1860, 14, [C.camphor, C.sakuraAut, C.ginkgo], 1802, 4, 6);
    grove(157, W, p0 + 16, 1830, 14, [C.camphor, C.sakuraAut, C.ginkgo], 1803, 4, 6);
    grove(px0 + 2, px1 - 2, 1872, p1 - 2, 18, [C.camphor, C.ginkgo, C.camphor], 1804, 4, 6);
    // people: visitors, school groups in yellow caps, doves wheeling over the plaza and taking off
    strollers(AXIS, 1780, 36, 40, 12);
    strollers(AXIS, 1640, 30, 40, 6);
    strollers(60, 1582, 12, 10, 4);
    schoolGroup([[AXIS - 3, 1728], [AXIS - 3, 1660], [70, 1612], [66, 1592]], 10, 1660, 0.2);
    schoolGroup([[118, 1800], [66, 1800], [66, 1752]], 9, 1780, 0.7);
    kit.orbit(AXIS, 1784, 28, doveF0(1784), { ry: 16, w: 0.55, n: 6, d: 0.9 });
    {
      const flock = [0, 1, 2, 3, 4, 5].map((k) =>
        sprite(19, 15, 1780, (r) => {
          for (let i = 0; i < 9; i++) {
            const a = i * 0.7 + 0.4;
            const d = 1.5 + (i % 3) + k * 1.6;
            const x = Math.round(9 + Math.cos(a) * d * 1.2 + k * 0.8);
            const y = Math.round(10 + Math.sin(a) * d * 0.6 - k * 1.4);
            if (x < 0 || x >= 19 || y < 0 || y >= 15) continue;
            r.set(x, y, 0xe8e8e4, k > 4 ? 0.5 : 1);
            if (k && (i + k) % 2) r.set(x + 1, y, 0xb8bcc4, k > 4 ? 0.4 : 0.9);
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
    fillU(px0, px1, HEIWA + 14, 2078, C.plaza, 301, 5);
    for (let u = HEIWA + 18; u < 2078; u += 7) for (let x = px0; x < px1; x++) img.set(x, Y(u), scaleColor(C.plaza[1], 0.93));
    for (const [sx, su] of [[50, 2006], [64, 2006], [106, 2006], [120, 2006], [50, 2066], [124, 2066]]) {
      const sy = Y(su);
      objects.push({
        y: sy + 10,
        shadow: () => shadowRect(sx + 2, sy + 2, 13, 9, 0.6),
        draw: () => {
          img.rect(sx, sy, 12, 5, 0xb83022);
          for (let x = sx; x < sx + 12; x++) img.set(x, sy + 1, x % 2 ? 0xdc442e : 0xf0e8d8);
          img.rect(sx + 1, sy + 5, 10, 3, 0x6a4a30);
          img.rect(sx + 2, sy + 6, 8, 1, 0x2a2a2e); // the teppan
          img.rect(sx + 1, sy + 8, 10, 1, 0xd8c8a0);
          glow(sx + 1, sy + 4, 0xff6a40, 0.95);
          glow(sx + 10, sy + 4, 0xff6a40, 0.95);
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
        img.rect(px0 + 6, fy + 2, 32, 5, 0xe8d040);
        for (let x = px0 + 8; x < px0 + 36; x += 3) img.rect(x, fy + 3, 2, 3, 0xc83a2a);
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
          for (let u = a0; u <= a1; u++) {
            const y = Y(u) - 6;
            const t = Math.sin(((u - a0) / (a1 - a0)) * Math.PI);
            for (let x = 0; x < W; x++) {
              if (Math.abs(x - WEST_CX) <= WEST_HW + 1 || Math.abs(x - EAST_CX) <= EAST_HW + 1) continue;
              const rib = x % 8 === 0;
              let c = rib ? 0xd8dfe6 : t > 0.8 ? 0xc8e4f0 : t > 0.45 ? 0x9cc8dc : 0x6e9ab0;
              if ((u - a0) % 12 === 0) c = 0xb8c4cc;
              img.set(x, y, c, rib ? 1 : 0.8);
            }
          }
          for (let x = 0; x < W; x++) {
            if (Math.abs(x - WEST_CX) <= WEST_HW + 1 || Math.abs(x - EAST_CX) <= EAST_HW + 1) continue;
            for (let k = 0; k < 6; k++) img.set(x, Y(a0) - 6 + k, k < 2 ? 0x8a929a : (x >> 2) % 3 === 0 ? 0xffe0a0 : 0x4a4048);
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
      fillU(0, W, HONKAWA[0] - 8, HONKAWA[0], C.paving, 302, 4);
      fillU(0, W, HONKAWA[1], HONKAWA[1] + 8, C.paving, 303, 4);
      gangi(0, W, HONKAWA[0] - 1, 1);
      gangi(0, W, HONKAWA[1], -1);
      for (const [x0, x1] of [[0, 22], [46, 140], [156, W]])
        for (let x = x0 + 3; x < x1; x += 14) {
          tree(x, Y(HONKAWA[0] - 5), 4, C.willow, 2100 + x);
          tree(x + 6, Y(HONKAWA[1] + 6), 4, C.sakuraAut, 2200 + x);
        }
      const row = sprite(9, 4, ru, (r) => {
        r.rect(1, 1, 7, 2, 0x8a5a34);
        r.set(0, 1, 0x8a5a34);
        r.set(4, 1, 0x3a6ad0);
        r.set(2, 0, 0xc8a878);
        r.set(6, 3, 0xc8a878);
      });
      kit.path([[20, ru - 10], [160, ru - 14]], [row], { sp: 5, mode: 'pp', hold: 2, d: 0.02, turn: 'flip', wake: { f: wakeF0(ru), every: 6, life: 1.4 } });
      const cruise = capture(80, Y(ru + 5), 16, 7, () => {
        const by = Y(ru + 5);
        img.rect(81, by + 1, 14, 5, 0xeef2f6);
        img.rect(83, by + 2, 9, 3, 0x2a6a5a);
        img.set(80, by + 3, 0xd83828);
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
      fillU(px0, px1, s0, s1, C.paving, 311, 4);
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
      for (let u = s0 + 2; u < s1 - 2; u++)
        for (let x = px0 + 2; x < px1 - 2; x++) {
          const y = Y(u);
          if (inField(x, u)) {
            const dx = x - home[0];
            const du = u - home[1];
            const r = Math.hypot(dx, du);
            let c = Math.floor((dx + du) / 6) % 2 ? C.lawn[2] : C.lawn[1];
            // the infield: dark Mazda soil with the grass square inside the bases
            const ix = Math.abs(dx - du) / Math.SQRT2;
            const iy = Math.abs(dx + du) / Math.SQRT2;
            if (r < 34 && du > -4) c = rampColor(C.dirt, 0.35 + fbm(x, y, { seed: 312, scale: 2 }) * 0.4, x, y);
            if (ix < 17 && iy < 17 && Math.max(ix, iy) < 15) c = Math.floor((dx + du) / 4) % 2 ? C.lawn[2] : C.lawn[1];
            if (Math.abs(Math.abs(dx) - du) < 0.7 && du >= 0) c = 0xf4f4f0; // the foul lines
            if (Math.hypot(dx, du - 19) < 2.5) c = C.dirt[2]; // the mound
            if (r > 104) c = 0x2a6a3a; // the warning track's padded wall
            img.set(x, y, c);
          } else if (standOf(x, u)) {
            const dx = x - home[0];
            const du = u - home[1];
            const r = Math.hypot(dx, du);
            let c = (Math.floor(r) & 1) ? C.seats[1] : C.seats[2];
            if (rand() < 0.55) c = rand() < 0.85 ? rand.pick([0xd82828, 0xe83a3a, 0xc81c1c, 0xf0f0f0]) : rand.pick([0x2a2a34, 0xe8c040]);
            if (Math.floor(r) % 9 === 0) c = C.concrete[2]; // the aisles round the bowl
            img.set(x, y, c);
            if ((x + u) % 7 === 0) seatParts.push([x, u]);
          }
        }
      // the bases and home plate
      for (const [bx, bu] of [[home[0], home[1]], [home[0] + 17, home[1] + 17], [home[0], home[1] + 34], [home[0] - 17, home[1] + 17]]) img.rect(bx, Y(bu), 2, 2, 0xf8f8f8);
      // the scoreboard beyond centre field and the light towers
      objects.push({
        y: Y(s1 - 10),
        shadow: () => shadowRect(cx - 14, Y(s1 - 2), 34, 10, 0.55),
        draw: () => {
          img.rect(cx - 18, Y(s1 - 2), 36, 9, 0x1a1c22);
          for (let x = cx - 16; x < cx + 16; x++) for (let k = 0; k < 6; k++) if ((x * 3 + k * 5) % 4 === 0) img.set(x, Y(s1 - 3) + k, k < 2 ? 0xf8e040 : 0x48d070);
          img.rect(cx - 18, Y(s1 - 2) - 1, 36, 1, 0xd82828);
          for (const lx of [px0 + 4, px1 - 6]) {
            img.rect(lx, Y(s1 - 30), 1, 12, 0x6a6e74);
            img.rect(lx - 2, Y(s1 - 30) - 3, 5, 3, 0xe8ecf0);
            glow(lx, Y(s1 - 30) - 2, 0xffffff, 0.8);
          }
        },
      });
      reserveRect(px0, Y(s1), px1 - px0, s1 - s0);
      // the players in white, the wave running round the stands (bright frames over the seats, phased by angle)
      const player = [0, 1].map((f) => sprite(2, 3, s0 + 40, (r) => {
        r.set(0, 0, 0x2a2a34);
        r.set(0, 1, 0xf4f4f0);
        r.set(f, 2, 0xd82828);
      }));
      for (const [x, u] of [[cx, s0 + 36], [cx + 14, s0 + 32], [cx - 14, s0 + 32], [cx + 30, s0 + 70], [cx - 30, s0 + 70], [cx, s0 + 92]]) kit.wander(x, u, 3, 3, player, { n: 1, sp: 2, idle: 0.8, turn: 'flip', fps: 2 });
      const fan = sprite(1, 2, s0 + 60, (r) => {
        r.set(0, 0, 0xffffff);
        r.set(0, 1, 0xf04848);
      });
      const parts = seatParts.map(([x, u]) => [0, x, u + 1, -Math.atan2(x - home[0], u - home[1]) * 2.2]);
      kit.wave([fan], parts, { w: 0.9, a0: 0, a1: 0.9, pw: 12 });
    }
    // the blocks to the coast (turret plaza kept open), the outer blocks along the delta
    fillU(px0, px1, 2516, 2546, C.plaza, 321, 5);
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
      fillU(0, W, 2708, QUAY_U, C.plaza, 331, 5);
      for (let u = 2706; u <= 2820; u++)
        for (let x = 28; x <= 40; x++) {
          const y = Y(u);
          let c = rampColor(C.tramBed, fbm(x, y, { seed: 35, scale: 4 }), x, y);
          if (y % 3 === 0) c = scaleColor(c, 0.86);
          if (RAILS.includes(x)) c = 0xc6ced6;
          img.set(x, y, c);
        }
      for (const [x0, x1] of [[22, 28], [41, 47]]) {
        fillU(x0, x1, 2712, 2822, C.granite, 332, 3);
        for (let u = 2712; u < 2822; u++) img.set(x1 - 1 === 27 ? 27 : x0, Y(u), 0xe8d848);
      }
      for (const [x0, x1] of [[22, 28], [41, 47]]) for (let u = 2716; u < 2800; u += 3) crowd(x0 + 1, Y(u), x1 - x0 - 2, 1, 1, true);
      objects.push({
        y: Y(2760),
        shadow: () => shadowRect(24, Y(2836) + 3, 26, 76, 0.55),
        draw: () => {
          for (const x0 of [21, 40]) {
            img.rect(x0, Y(2818), 8, 54, 0xd8dcde);
            for (let u = 2766; u < 2818; u += 4) img.rect(x0, Y(u), 8, 1, 0xb8bcc0);
            img.rect(x0, Y(2766), 8, 1, 0x2a6a4a);
          }
          img.rect(18, Y(2846), 34, 26, C.kawara[2]);
          img.rect(19, Y(2845), 32, 22, C.kawara[3]);
          img.rect(18, Y(2822), 34, 4, C.plaster[1]);
          img.rect(30, Y(2820), 10, 2, 0x2a6a4a);
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
          for (let u = 2822; u < 2864; u++)
            for (let x = 56; x < 126; x++) {
              const y = Y(u) - 8;
              let c = (x - 56) % 3 === 0 ? C.hinoki[1] : C.hinoki[2];
              if (u === 2822 || u === 2863) c = C.hinoki[0];
              if (x === 56 || x === 125) c = C.hinoki[3];
              img.set(x, y, c);
            }
          for (let x = 60; x < 122; x += 12) img.rect(x, Y(2850) - 8, 6, 6, 0xc8e4f0);
          for (let yy = Y(2822) - 8; yy < Y(2810); yy++)
            for (let x = 58; x < 124; x++) img.set(x, yy, (x - 58) % 6 === 0 ? C.concrete[3] : yy < Y(2822) - 4 ? 0x8ab0c8 : 0x4a6a80);
          img.rect(58, Y(2810), 66, 1, C.concrete[1]);
          for (let x = 62; x < 122; x += 6) glow(x, Y(2812), C.warm, 0.6);
        },
      });
      reserveRect(56, Y(2864) - 9, 70, 64);
      hall(128, Y(2752), 24, 10, 6, C.kawara, 'shop', { noren: 0x2a3a5a, wall: C.oldWood[2] }); // anago-meshi Ueno
      kit.emit(140, 2748, stallSteam, { rate: 1.2, life: [1.2, 2], vy: 6, sx: 2, wf: 0.6, a: 0.45, tint: 1 });
      hall(150, Y(2790), 26, 10, 6, C.kawara, 'shop', { noren: 0x8a2a2a, wall: C.oldWood[1] });
      grove(52, 128, 2716, 2800, 10, [C.camphor, C.pine], 2301, 4, 5.5);
      crowd(50, Y(2808), 80, 40, 50, true);
      strollers(90, 2760, 34, 20, 10);
      // the piers out to the pontoons, with a canopy for the queue
      for (const [x0, x1] of [[72, 83], [98, 109]]) {
        for (let u = QUAY_U; u < 3010; u++) for (let x = x0; x < x1; x++) img.set(x, Y(u), x === x0 || x === x1 - 1 ? C.concrete[1] : rampColor(C.paving, 0.5, x, Y(u)));
        for (let u = QUAY_U + 4; u < 2990; u += 14) {
          img.set(x0, Y(u), C.gold);
          img.set(x1 - 1, Y(u), C.gold);
        }
        objects.push({
          y: Y(QUAY_U + 6),
          draw: () => {
            img.rect(x0 + 1, Y(2960), x1 - x0 - 2, 86, 0xd8dcde, 0.92);
            for (let u = 2876; u < 2960; u += 6) img.rect(x0 + 1, Y(u), x1 - x0 - 2, 1, 0xb0b6bc);
          },
        });
        crowd(x0 + 2, Y(2950), x1 - x0 - 4, 70, 14, true);
        objects.push({
          y: Y(3000),
          shadow: () => shadowRect(x0 + 2, Y(3016), x1 - x0 + 4, 14, 0.6),
          draw: () => {
            img.rect(x0 - 2, Y(3016), x1 - x0 + 4, 12, 0x6a7078);
            img.rect(x0 - 2, Y(3016), x1 - x0 + 4, 1, 0x9aa0a8);
            img.rect(x0 - 2, Y(3005) - 1, x1 - x0 + 4, 1, 0xe8d848);
          },
        });
      }
    }

    // ---- live traffic: Hiroden trams (Green Mover Max, the A-bombed 650s), cars and buses, keeping left
    // (frames face right; the route turns them)
    const tramF = (len, body, band, roofC) => {
      const r = new Raster(len, 5);
      r.rect(0, 0, len, 5, body);
      r.rect(0, 1, len, 3, roofC);
      r.rect(0, 0, len, 1, band);
      r.rect(0, 4, len, 1, scaleColor(band, 0.75));
      for (let x = 3; x < len - 3; x += Math.max(6, Math.floor(len / 5))) r.rect(x, 2, 2, 1, 0x9aa2aa); // AC units / pantographs
      r.set(len - 1, 1, 0xfff4c8);
      r.set(len - 1, 3, 0xfff4c8);
      r.rect(len - 2, 1, 1, 3, 0x2a3440);
      if (len > 20) for (let x = Math.floor(len / 5); x < len; x += Math.floor(len / 5)) r.rect(x, 0, 1, 5, 0x3a3a40); // articulations
      return kit.frame(tod.frame(r, 1500));
    };
    const greenMover = tramF(30, 0xe8ecec, 0x2c7a48, 0xd0d6da);
    const t650 = tramF(14, 0xe8dcb8, 0x2c5a3a, 0x7a8a6a);
    const t653 = tramF(14, 0x3a6aa8, 0x2a4a7a, 0x8aa0b8);
    const lex = tramF(24, 0xf0f2f2, 0x48a058, 0xd8dcde);
    const carF = CARS.map((col) => {
      const r = new Raster(7, 4);
      r.rect(0, 0, 7, 4, col);
      r.rect(2, 0, 3, 4, scaleColor(col, 1.15));
      r.rect(1, 0, 1, 4, 0x283440);
      r.rect(5, 0, 1, 4, 0x283440);
      r.set(6, 0, 0xfff4c8);
      r.set(6, 3, 0xfff4c8);
      return kit.frame(tod.frame(r, 1500));
    });
    const busF = (body, band) => {
      const r = new Raster(12, 5);
      r.rect(0, 0, 12, 5, body);
      r.rect(0, 0, 12, 1, band);
      r.rect(0, 4, 12, 1, band);
      r.rect(3, 2, 6, 1, 0xb8bcc0);
      r.set(11, 1, 0xfff4c8);
      r.set(11, 3, 0xfff4c8);
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
    for (const [ix, iu] of [[160, 3420], [18, 3650], [150, 4080]]) {
      for (let k = 0; k < 4; k++) tree(ix - 6 + ((k * 7) % 13), Y(iu - 6 + ((k * 5) % 13)), 3.5 + (k % 2), C.pine, ix * 3 + iu + k, 'pine');
    }
    // a little vermilion torii on the rocks of the western islet, a lighthouse on the eastern one
    objects.push({
      y: Y(3642),
      draw: () => {
        const y = Y(3642);
        img.rect(14, y - 6, 1, 6, C.vermilion[2]);
        img.rect(21, y - 6, 1, 6, C.vermilion[2]);
        img.rect(12, y - 7, 12, 1, 0x2a2026);
        img.rect(13, y - 5, 10, 1, C.vermilion[2]);
      },
    });
    objects.push({
      y: Y(4074),
      shadow: () => shadowRect(152, Y(4074) - 3, 4, 4, 0.6),
      draw: () => {
        const y = Y(4074);
        img.rect(148, y - 12, 4, 12, 0xf4f4f0);
        img.rect(148, y - 8, 4, 2, 0xd83a2a);
        img.rect(148, y - 14, 4, 2, 0x2a2a30);
        glow(149, y - 13, 0xfff4c0, 0.95);
        glow(150, y - 13, 0xfff4c0, 0.8);
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
    ];
    for (const [rx, ru] of RAFTS) {
      const ry = Y(ru);
      const rw = 11;
      const rh = 13;
      objects.push({
        y: ry + rh + 1,
        draw: () => {
          // the ropes of oysters seen through the water, the floats along the sides
          for (let dy = -rh + 1; dy < rh; dy += 2)
            for (let dx = -rw + 1; dx < rw; dx += 2) img.set(rx + dx, ry + dy, 0x0a2028, 0.55);
          for (let dy = -rh; dy <= rh; dy += 4) {
            img.set(rx - rw - 1, ry + dy, 0xf0f2f2);
            img.set(rx + rw + 1, ry + dy, 0xe0e4e4);
          }
          // the poles: long ones down the raft, cross poles every 3 px, nodes and lashings
          for (let dy = -rh; dy <= rh; dy += 3)
            for (let dx = -rw; dx <= rw; dx++) img.set(rx + dx, ry + dy, (dx & 3) === 0 ? 0xa88850 : 0xd0b070);
          for (let dx = -rw; dx <= rw; dx += 4)
            for (let dy = -rh; dy <= rh; dy++) img.set(rx + dx, ry + dy, dy % 5 === 0 ? 0xb89458 : 0xe4c886);
          img.set(rx, ry, 0xf25c30);
        },
      });
    }
    // the oyster work boats: one moored at a raft hauling ropes on its little crane, others going about
    const workBoat = capture(60, Y(3500), 14, 7, () => {
      const y = Y(3500);
      img.rect(60, y + 1, 13, 5, 0x5a7aa0);
      img.rect(61, y + 2, 11, 3, 0xd8dcde);
      img.rect(62, y + 2, 3, 3, 0x3a5a7a); // the wheelhouse
      img.rect(68, y, 1, 4, 0xe8a030); // the crane
      img.set(73, y + 3, 0x5a7aa0);
    });
    for (const [x, u] of [[38, 3290], [108, 3490], [134, 3760]]) kit.loop(x - 7, u + 4, [workBoat], { d: 0.02 });
    kit.path([[30, 3176], [140, 3206], [110, 3496], [30, 3486]], [workBoat], { sp: 8, mode: 'pp', hold: 6, d: 0.02, turn: 'rot', wake: { f: wakeF0(3300), every: 5, life: 1.6 } });
    kit.path([[118, 3980], [152, 4240], [110, 4216]], [workBoat], { sp: 7, mode: 'pp', hold: 7, s0: 0.4, d: 0.02, turn: 'rot', wake: { f: wakeF0(4100), every: 5, life: 1.6 } });
    // a fishing boat drifting with its lines out
    const fishing = sprite(10, 5, 3800, (r) => {
      r.rect(1, 1, 8, 3, 0xe8e4d8);
      r.set(0, 2, 0xe8e4d8);
      r.set(9, 2, 0xe8e4d8);
      r.rect(3, 1, 2, 3, 0x2a5a8a);
      r.set(7, 0, 0x2a2a2a);
    });
    kit.wander(80, 3600, 14, 40, [fishing], { n: 1, sp: 2, turn: 'rot', idle: 0.6, d: 0.02 });
    kit.wander(56, 4080, 12, 30, [fishing], { n: 1, sp: 2, turn: 'rot', idle: 0.6, d: 0.02 });
    // channel buoys bobbing
    const buoy = (c) => [0, 1].map((f) => sprite(3, 4, 3600, (r) => {
      r.rect(0, f, 3, 3, c);
      r.set(1, f ? 0 : 3, 0xffffff, 0.6);
    }));
    for (const [x, u, c] of [[96, 3200, 0xd83a2a], [66, 3200, 0x2a8a4a], [84, 3700, 0xd83a2a], [54, 3700, 0x2a8a4a], [60, 4200, 0xd83a2a], [26, 4200, 0x2a8a4a]])
      kit.loop(x, u, buoy(c), { fps: 1.2 });
    // the JR and Matsudai ferries, pier to pier with their white wakes, and the Aqua Net boat in from the city
    const ferry = (band, deck) =>
      capture(80, Y(3600), 12, 28, () => {
        const fx = 80;
        const fy = Y(3600);
        img.rect(fx + 1, fy + 2, 10, 24, 0xf2f4f8);
        img.rect(fx + 2, fy, 8, 3, 0xf2f4f8);
        img.rect(fx + 3, fy + 26, 6, 2, 0xf2f4f8);
        img.rect(fx + 1, fy + 12, 10, 2, band);
        img.rect(fx + 2, fy + 5, 8, 15, deck);
        img.rect(fx + 3, fy + 6, 6, 3, 0x2c4e6c);
        img.rect(fx + 5, fy + 15, 2, 3, band);
        for (let k = 0; k < 8; k++) img.set(fx + 2 + ((k * 3) % 8), fy + 9 + ((k * 5) % 10), rand.pick(COATS));
      });
    const jrFerry = ferry(0x1e3c7a, 0xdbe4ec);
    const mtFerry = ferry(0xc8302a, 0xe4e8ec);
    kit.path([[77, 3032], [74, 3420], [52, 3960], [26, 4382]], [jrFerry], { sp: 15, mode: 'pp', hold: 4, turn: 'rot', d: 0.25, wake: { f: wakeF0(3600), every: 4, life: 1.8 } });
    kit.path([[103, 3032], [96, 3520], [70, 4020], [36, 4382]], [mtFerry], { sp: 14, s0: 0.52, mode: 'pp', hold: 4, turn: 'rot', d: 0.25, wake: { f: wakeF0(3600), every: 4, life: 1.8 } });
    const aqua = capture(60, Y(3800), 20, 8, () => {
      const by = Y(3800);
      img.rect(61, by + 1, 18, 6, 0xf4f6f8);
      img.rect(78, by + 2, 2, 4, 0xf4f6f8);
      img.rect(64, by + 2, 11, 4, 0x1e3c6a);
      img.rect(61, by + 6, 18, 1, 0xd83a2a);
    });
    kit.path([[W + 20, 3100], [120, 3600], [64, 4200], [44, 4392]], [aqua], { sp: 20, mode: 'pp', hold: 6, turn: 'rot', d: 0.25, s0: 0.25, wake: { f: wakeF0(3800), every: 4, life: 1.6 } });
    // gulls wheeling over the rafts, glints across the bay
    const gullF = [0, 1].map((f) => sprite(5, 3, 3600, (r) => {
      r.set(2, 1, 0xffffff);
      r.set(1, f ? 0 : 1, 0xffffff);
      r.set(3, f ? 0 : 1, 0xffffff);
      r.set(0, f ? 0 : 2, 0xd0d8e0);
      r.set(4, f ? 0 : 2, 0xd0d8e0);
    }));
    kit.orbit(40, 3240, 20, gullF, { ry: 14, w: 0.7, n: 3, d: 0.7 });
    kit.orbit(140, 3500, 22, gullF, { ry: 16, w: -0.65, n: 3, d: 0.7 });
    kit.orbit(130, 4000, 20, gullF, { ry: 14, w: 0.6, n: 2, d: 0.7 });
    kit.spot([[0, 3400, W, 500], [0, 3950, W, 520], [0, 4450, W, 480]], glintF0(3800), { rate: 3, fps: 6, a: 0.7 });
  }

  // ------------------------------------------------------------ 8. Miyajima, u = 4400..5900
  {
    // ---- the ferry pier and terminal, the pontoons where the ferries come in
    fillU(14, 47, 4400, 4540, C.paving, 401, 4);
    for (let u = 4400; u < 4540; u++) {
      img.set(14, Y(u), C.concrete[1]);
      img.set(46, Y(u), C.concrete[1]);
    }
    for (const px of [20, 34]) {
      objects.push({
        y: Y(4392),
        shadow: () => shadowRect(px + 2, Y(4404), 12, 12, 0.6),
        draw: () => {
          img.rect(px - 2, Y(4404), 12, 12, 0x6a7078);
          img.rect(px - 2, Y(4404), 12, 1, 0x9aa0a8);
          img.rect(px - 2, Y(4393) - 1, 12, 1, 0xe8d848);
        },
      });
    }
    hall(10, Y(4520), 40, 16, 10, C.kawara, 'plain', { wall: 0xe0dcd0, ridgeAt: 0.4, gable: 'tri', gw: 14, crest: false, extra: () => {
      for (let x = 14; x < 46; x += 4) img.rect(x, Y(4520) + 18, 2, 6, 0x5a7a94);
    } });
    crowd(16, Y(4470), 28, 60, 30, true);
    // ---- the shore: the stone-lantern promenade round the cove, Omotesandō behind it to the west
    const coastW = (u) => {
      for (let x = 30; x < 92; x++) if (W_(x, Y(u))) return x;
      return 92;
    };
    const coastE = (u) => {
      for (let x = 150; x > 92; x--) if (W_(x, Y(u))) return x;
      return 92;
    };
    for (let u = 4540; u < 5340; u++) {
      const xl = coastW(u);
      const xr = coastE(u);
      for (let x = Math.max(24, xl - 12); x < xl - 1; x++) img.set(x, Y(u), rampColor(C.paving, 0.45 + fbm(x, u, { seed: 402, scale: 4 }) * 0.4, x, Y(u)));
      for (let x = xr + 2; x < Math.min(W - 18, xr + 13); x++) img.set(x, Y(u), rampColor(C.paving, 0.45 + fbm(x, u, { seed: 403, scale: 4 }) * 0.4, x, Y(u)));
      if (u % 46 === 0 && u > 4560) {
        stoneLantern(xl - 4, u, true);
        stoneLantern(xr + 5, u, true);
      }
    }
    // Omotesandō: the shopping street of tiled two-storey shops, noren, the momiji-manju bakers steaming, the
    // great o-shamoji rice scoop on show
    for (let u = 4546; u < 5040; u++) for (let x = 6; x < 22; x++) img.set(x, Y(u), rampColor(C.paving, 0.4 + fbm(x, u, { seed: 404, scale: 3 }) * 0.4, x, Y(u)));
    {
      const noren = [0x2a3a6a, 0x8a2a2a, 0x2a5a3a, 0x6a3a6a, 0xd8c8a0];
      for (let u = 4556, k = 0; u < 5030; u += 20, k++) {
        hall(-2, Y(u + 18), 9, 9, 6, C.kawara, 'shop', { noren: noren[k % 5], wall: C.oldWood[k % 3 + 1], hip: false, sortBias: 0 });
        hall(21, Y(u + 14), 9, 8, 5, C.kawara, 'shop', { noren: noren[(k + 2) % 5], wall: C.oldWood[(k + 1) % 3 + 1], hip: false });
        if (k % 3 === 1) kit.emit(18, u + 4, stallSteam, { rate: 1.2, life: [1.2, 2], vy: 5, sx: 1, wf: 0.6, a: 0.45, tint: 1 });
        if (k % 2 === 0) glow(8, Y(u + 2), 0xffb040, 0.9);
      }
      // the o-shamoji, eight metres of wood in its case at the street's end
      objects.push({
        y: Y(5040),
        shadow: () => shadowRect(10, Y(5062), 10, 24, 0.6),
        draw: () => {
          const y = Y(5060);
          img.rect(8, y, 10, 22, 0x9aa8b0, 0.6);
          img.rect(8, y, 10, 1, 0xd8dcde);
          img.rect(11, y + 2, 4, 9, C.hinoki[3]);
          img.rect(12, y + 11, 2, 9, C.hinoki[2]);
          img.set(11, y + 2, C.hinoki[2]);
          img.set(14, y + 2, C.hinoki[2]);
          img.set(12, y + 4, 0x2a2026);
          img.set(13, y + 6, 0x2a2026);
        },
      });
      for (let k = 0; k < 10; k++) {
        const c = COATS[k % COATS.length];
        const x = 9 + (k % 4) * 3;
        kit.path([[x, 4552], [x, 5030]], [walker(c, 0, 4800), walker(c, 1, 4800)], { sp: 3 + (k % 3), mode: 'pp', hold: 2, turn: 'none', fps: 3, s0: (k * 0.29) % 1 });
      }
    }
    // the inns and houses along the east shore
    for (let u = 4580, k = 0; u < 5160; u += 36, k++) {
      if (padNear(158, u, 22)) continue;
      hall(162, Y(u + 26), 18, 12, 7, C.kawara, 'plain', { wall: k % 2 ? 0xe8e0d0 : C.oldWood[2], bay: 4 });
    }
    // the deer of Miyajima, everywhere
    const deerF = [0, 1].map((f) => sprite(7, 6, 4900, (r) => {
      r.rect(1, 2, 4, 2, 0xb8763c);
      r.set(2, 2, 0xf8eed8);
      r.set(4, 2, 0xf8eed8);
      r.rect(4, 0, 2, 2, 0xc88446);
      r.set(6, 0, 0x3a2618);
      r.set(0, 2, 0xffffff);
      r.set(1, f ? 4 : 5, 0x6e4422);
      r.set(4, f ? 5 : 4, 0x6e4422);
    }));
    kit.wander(30, 4620, 6, 40, deerF, { n: 2, sp: 5, turn: 'flip', fps: 3, idle: 0.6 });
    kit.wander(14, 4800, 6, 120, deerF, { n: 3, sp: 4, turn: 'flip', fps: 3, idle: 0.6 });
    kit.wander(156, 4760, 6, 100, deerF, { n: 3, sp: 5, turn: 'flip', fps: 3, idle: 0.5 });
    kit.wander(40, 5160, 8, 50, deerF, { n: 2, sp: 4, turn: 'flip', fps: 3, idle: 0.6 });
    strollers(40, 4700, 6, 120, 6);
    strollers(152, 4900, 6, 160, 6);
    // a rickshaw puller trotting along the west shore
    const rick = [0, 1].map((f) => sprite(8, 5, 4900, (r) => {
      r.rect(0, 1, 4, 3, 0x2a2a30);
      r.rect(1, 1, 2, 2, 0xc83a2a);
      r.set(0, f ? 4 : 0, 0x1a1a1e);
      r.rect(4, 2, 3, 1, 0x5a3a20);
      r.set(7, 2, 0x2a2026);
      r.set(7, 1, 0x2a2a34);
      r.set(6, f ? 3 : 1, 0x2a2a34);
    }));
    kit.path([[28, 4560], [28, 4760], [40, 4900], [50, 5120]], rick, { sp: 6, mode: 'pp', hold: 4, turn: 'rot', fps: 4 });

    // ---- the Great Torii: two camphor pillars and four sleeve pillars in vermilion, the black kasagi with its
    // upswept ends, the tablet; drawn as its own layer so the boats rowing out at high tide pass under it
    {
      const tx = 90;
      const tu = 4842;
      const ty = Y(tu);
      for (let x = tx - 22; x <= tx + 26; x++) for (let k = 0; k < 4; k++) if (W_(x, ty + 2 + k)) img.set(x, ty + 2 + k, 0x08161c, 0.28);
      for (const s of [-1, 1]) for (let k = 0; k < 9; k++) img.set(tx + s * 10 + (k & 1), ty + 3 + k, C.vermilion[2], 0.4 - k * 0.04); // the reflection
      const torii = capture(tx - 24, ty - 30, 49, 34, () => {
        for (const s of [-1, 1]) {
          const px = tx + s * 10;
          // the sleeve pillars, front and back, on their tie-beams
          for (const dx of [-4, 4]) {
            img.rect(px + dx, ty - 10, 2, 12, C.vermilion[1]);
            img.rect(px + dx, ty + 1, 2, 1, 0x241c20);
          }
          img.rect(px - 4, ty - 6, 10, 1, C.vermilion[2]);
          img.rect(px - 4, ty - 9, 10, 2, 0x241c20);
          // the main pillar
          img.rect(px - 1, ty - 20, 4, 22, C.vermilion[2]);
          img.rect(px - 1, ty - 20, 1, 22, C.vermilion[3]);
          img.rect(px + 2, ty - 20, 1, 22, C.vermilion[1]);
          img.rect(px - 1, ty, 4, 2, 0x241c20);
        }
        img.rect(tx - 15, ty - 15, 33, 2, C.vermilion[2]);
        img.rect(tx - 15, ty - 15, 33, 1, C.vermilion[3]);
        for (let dx = -21; dx <= 22; dx++) {
          const lift = Math.round((dx - 0.5) ** 2 / 120);
          img.set(tx + dx, ty - 23 - lift, 0x2a2428);
          img.set(tx + dx, ty - 22 - lift, 0x16121a);
          img.set(tx + dx, ty - 21 - lift, 0x16121a);
          if (Math.abs(dx) <= 18) img.set(tx + dx, ty - 20 - lift, C.vermilion[2]);
          if (Math.abs(dx) <= 18) img.set(tx + dx, ty - 19 - lift, C.vermilion[1]);
        }
        img.rect(tx - 1, ty - 19, 4, 5, 0x16121a);
        img.rect(tx, ty - 18, 2, 3, C.gold);
      }, { u: tu });
      kit.loop(tx - 24, tu + 30, [torii], { d: 0.3 });
      const ripF = [0, 1, 2].map((f) => sprite(48, 14, tu, (r) => {
        for (const px of [14, 34]) {
          const rad = 3.5 + f * 1.6;
          for (let a = 0; a < Math.PI * 2; a += 0.15) r.set(Math.round(px + Math.cos(a) * rad), Math.round(7 + Math.sin(a) * rad * 0.45), 0xd8f8ff, 0.55 - f * 0.12);
        }
      }));
      kit.loop(tx - 24, tu + 5, ripF, { fps: 2, d: 0.1, fx: 1 });
      // sappa boats rowing out under the torii and back
      const sappa = sprite(5, 10, tu, (r) => {
        r.rect(1, 1, 3, 8, 0x8a5a34);
        r.rect(2, 0, 1, 10, 0x8a5a34);
        r.set(2, 3, 0xe8e8e8);
        r.set(2, 6, 0x3a6ad0);
        r.set(0, 4, 0xc8a878);
        r.set(4, 5, 0xc8a878);
      });
      kit.path([[90, 4600], [90, 4842], [92, 5000]], [sappa], { sp: 5, mode: 'pp', hold: 5, d: 0.05, turn: 'none', wake: { f: wakeF0(tu), every: 6, life: 1.6 } });
      kit.path([[60, 4640], [86, 4830], [120, 4900]], [sappa], { sp: 4, mode: 'pp', hold: 7, s0: 0.5, d: 0.05, turn: 'none', wake: { f: wakeF0(tu), every: 6, life: 1.6 } });
      kit.spot([[40, 5000, 100, 420]], glintF0(4800), { rate: 2, fps: 6, a: 0.7 });
    }

    // ---- Itsukushima Shrine, standing on its stilts over the tide: cypress-bark roofs, vermilion everywhere
    {
      const HW = C.hiwada;
      /** A deck of grey weathered planks on stilts, its shadow on the water, vermilion rails round it. */
      const deck = (x0, x1, u0, u1, rails = true) => {
        for (let u = u0; u < u1; u++)
          for (let x = x0; x < x1; x++) {
            const y = Y(u);
            img.set(x, y, (u - u0) % 2 ? 0x8a8478 : 0x9e988a);
            if ((x - x0) % 9 === 0) img.set(x, y, 0x7a7468);
          }
        for (let x = x0 + 1; x < x1 + 3; x++) for (let k = 1; k <= 3; k++) if (W_(x, Y(u0) + k)) img.set(x, Y(u0) + k, 0x081418, 0.4);
        for (let u = u0; u < u1; u++) for (let k = 1; k <= 2; k++) if (W_(x1 - 1 + k, Y(u))) img.set(x1 - 1 + k, Y(u), 0x081418, 0.35);
        if (rails) {
          for (let x = x0; x < x1; x++) {
            img.set(x, Y(u0), C.vermilion[2]);
            img.set(x, Y(u1 - 1), C.vermilion[3]);
          }
          for (let u = u0; u < u1; u++) {
            img.set(x0, Y(u), C.vermilion[3]);
            img.set(x1 - 1, Y(u), C.vermilion[1]);
          }
        }
        // the stilts showing at the front edge
        for (let x = x0 + 2; x < x1; x += 5) img.rect(x, Y(u0) + 1, 1, 2, 0x5a2a20);
      };
      /** A kairō corridor: a cypress-bark roof along it, vermilion posts on the open side, bronze lanterns hung
       * from the eaves. horizontal: [x0, x1, u]; vertical: [x, u0, u1]. */
      const corridorH = (x0, x1, u) => {
        objects.push({
          y: Y(u) + 2,
          shadow: () => shadowRect(x0 + 2, Y(u + 7) + 2, x1 - x0, 9, 0.6),
          draw: () => {
            deck(x0, x1, u - 1, u + 7, false);
            roof(x0, Y(u + 9), x1 - x0, 6, HW, { bark: true, hip: false, ridgeAt: 0.4 });
            for (let x = x0; x < x1; x++) {
              const y = Y(u + 3);
              img.set(x, y, (x - x0) % 4 === 0 ? C.vermilion[2] : 0x2a1a18);
              img.set(x, y + 1, (x - x0) % 4 === 0 ? C.vermilion[1] : 0x8a8478);
              if ((x - x0) % 4 === 2) glow(x, y, 0xd8a040, 0.6);
            }
          },
        });
      };
      const corridorV = (x, u0, u1) => {
        objects.push({
          y: Y(u0) + 2,
          shadow: () => shadowRect(x + 4, Y(u1), 9, u1 - u0 + 2, 0.6),
          draw: () => {
            deck(x - 1, x + 8, u0, u1, false);
            for (let u = u0; u < u1; u++) {
              const y = Y(u) - 4;
              for (let k = 0; k < 8; k++) {
                const c = k < 3 ? HW[3] : k === 3 || k === 4 ? HW[0] : HW[1];
                img.set(x + k, y, (u - u0) % 3 === 0 ? scaleColor(c, 0.9) : c);
              }
              img.set(x - 1, y + 1, (u - u0) % 4 === 0 ? C.vermilion[3] : 0x2a1a18);
              img.set(x + 8, y + 1, (u - u0) % 4 === 0 ? C.vermilion[1] : 0x1a1210);
              if ((u - u0) % 4 === 2) glow(x - 1, y + 2, 0xd8a040, 0.55);
            }
            for (let x2 = x - 1; x2 < x + 9; x2++) img.set(x2, Y(u0) - 3, C.vermilion[2]);
          },
        });
      };
      // the main sanctuary on the axis: Hitasaki, Hirabutai with the Takabutai and the Gakubō, then the
      // Haraiden, Haiden and Honden rising behind one another
      objects.push({ y: Y(5004), draw: () => deck(84, 101, 5002, 5024) });
      objects.push({
        y: Y(5004) + 1,
        draw: () => {
          const y = Y(5006);
          img.rect(91, y - 6, 3, 5, 0x5a5048);
          img.rect(90, y - 7, 5, 1, 0x3a322c);
          glow(92, y - 4, 0xffc870, 0.95);
          pool(92, y - 3, 10, C.lamp, 0.25 + dusk(5000) * 0.25);
        },
      });
      objects.push({ y: Y(5024) - 1, draw: () => deck(66, 119, 5024, 5070) });
      objects.push({
        y: Y(5040) + 1,
        shadow: () => shadowRect(86, Y(5058), 18, 16, 0.6),
        draw: () => {
          const y0 = Y(5058);
          img.rect(84, y0, 17, 14, 0x1a1418);
          img.rect(85, y0 + 1, 15, 11, 0x2a2026);
          for (let x = 84; x < 101; x++) {
            img.set(x, y0, C.vermilion[3]);
            img.set(x, y0 + 13, C.vermilion[2]);
            img.set(x, y0 + 14, x % 3 ? 0x1a1418 : C.vermilion[1]);
          }
          for (let yy = y0; yy < y0 + 14; yy++) {
            img.set(84, yy, C.vermilion[3]);
            img.set(100, yy, C.vermilion[1]);
          }
          for (let k = 0; k < 4; k++) img.rect(90, y0 + 15 + k, 5, 1, k % 2 ? 0x2a2026 : C.vermilion[2]); // the steps
          for (const px of [84, 100]) for (const py of [y0, y0 + 13]) img.set(px, py, C.gold);
        },
      });
      hall(66, Y(5080), 13, 7, 4, HW, 'shrine', { bark: true, bay: 4, reserve: false });
      hall(106, Y(5080), 13, 7, 4, HW, 'shrine', { bark: true, bay: 4, reserve: false });
      hall(68, Y(5106), 49, 14, 6, HW, 'shrine', { bark: true, bay: 6, gable: 'tri', gw: 12, noshi: false, reserve: false }); // Haraiden
      hall(72, Y(5132), 41, 14, 5, HW, 'shrine', { bark: true, bay: 6, gable: 'tri', gw: 10, reserve: false, sortBias: -2 }); // Haiden
      hall(70, Y(5168), 45, 18, 6, HW, 'shrine', { bark: true, bay: 5, gable: 'kara', gw: 14, crestC: C.gold, reserve: false, sortBias: -4 }); // Honden
      // the corridors east and west, out to the shore
      corridorH(102, 124, 5030);
      corridorH(60, 84, 5030);
      corridorV(118, 5038, 5196);
      corridorV(58, 5038, 5196);
      corridorH(118, 146, 5196);
      corridorH(36, 66, 5196);
      // Marōdo-jinja, the guest shrine by the east entrance; the floating Noh stage and its bridge on the west
      hall(126, Y(5176), 18, 10, 4, HW, 'shrine', { bark: true, bay: 4, reserve: false });
      objects.push({ y: Y(5108), draw: () => deck(38, 54, 5108, 5126) });
      hall(38, Y(5144), 17, 11, 5, HW, 'oldwood', { bark: true, bay: 5, gable: 'tri', gw: 7, reserve: false, sortBias: 1 });
      objects.push({ y: Y(5118), draw: () => deck(54, 59, 5114, 5120, true) });
      // Sorihashi, the steep arched bridge behind the sanctuary
      objects.push({
        y: Y(5216),
        draw: () => {
          for (let u = 5204; u < 5232; u++) {
            const t = Math.sin(((u - 5204) / 27) * Math.PI);
            for (let x = 88; x < 97; x++) img.set(x, Y(u) - Math.round(t * 3), x === 88 || x === 96 ? C.vermilion[x === 88 ? 3 : 1] : t > 0.6 ? C.hinoki[2] : C.hinoki[1]);
          }
        },
      });
      reserveRect(36, Y(5240), 112, 250);
      // priests, miko and visitors along the corridors; a bugaku dancer on the stage
      for (const [pts, s0, c] of [
        [[[121, 5040], [121, 5190]], 0.2, 0xf4f4f0],
        [[[62, 5040], [62, 5190]], 0.6, 0xd83a2a],
        [[[70, 5032], [116, 5032]], 0.4, 0x3a6ad0],
        [[[124, 5198], [144, 5198]], 0.1, 0xe8c040],
        [[[40, 5198], [64, 5198]], 0.8, 0xf4f4f0],
      ])
        kit.path(pts, [walker(c, 0, 5100), walker(c, 1, 5100)], { sp: 3, mode: 'pp', hold: 3, turn: 'flip', fps: 3, s0 });
      const dancer = [0, 1, 2, 1].map((f) => sprite(5, 6, 5050, (r) => {
        r.rect(1, 1, 3, 4, 0xd83a2a);
        r.set(2, 0, 0xe8c040);
        r.set(f === 0 ? 0 : 4, f === 2 ? 1 : 2, 0xd83a2a);
        r.set(f === 0 ? 4 : 0, 3, 0xf0e0c0);
        r.set(1, 5, 0x2a2026);
        r.set(3, 5, 0x2a2026);
      }));
      kit.loop(90, 5054, dancer, { fps: 2 });
    }

    // ---- the hill above the shrine: the Gojūnotō and the great unpainted Senjōkaku among the pines
    {
      for (let u = 5250; u < 5480; u++)
        for (let x = 130; x < W; x++) {
          if (W_(x, Y(u))) continue;
          img.set(x, Y(u), rampColor(C.grass, 0.3 + fbm(x, u, { seed: 451, scale: 7 }) * 0.5, x, Y(u)));
        }
      // the stone stairs up the hill
      for (let u = 5236; u < 5300; u++) img.rect(146, Y(u), 6, 1, u % 2 ? C.granite[3] : C.granite[1]);
      const pg = { cx: 166, u: 5318 };
      objects.push({
        y: Y(pg.u) + 2,
        shadow: () => shadowRect(pg.cx - 4, Y(pg.u) - 40, 22, 44, 0.55),
        draw: () => {
          const y0 = Y(pg.u);
          img.rect(pg.cx - 9, y0 - 2, 19, 3, C.granite[2]);
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
          for (let k = 0; k < 11; k++) img.set(pg.cx, y - k, k % 2 ? 0x8a7a3a : 0x6a5a2a);
          img.set(pg.cx - 1, y - 3, 0x6a5a2a);
          img.set(pg.cx + 1, y - 3, 0x6a5a2a);
          img.set(pg.cx, y - 11, C.gold);
          glow(pg.cx, y - 11, C.goldHi, 0.5);
        },
      });
      reserveRect(pg.cx - 12, Y(pg.u) - 70, 26, 74);
      // Senjōkaku, "the hall of a thousand mats": huge, unpainted, its grey-tiled irimoya roof
      hall(128, Y(5446), 50, 24, 10, C.kawara, 'oldwood', { bay: 4, wall: C.oldWood[1], gable: 'tri', gw: 16, crest: false, noshi: true, ridgeAt: 0.36 });
      grove(130, W, 5250, 5480, 18, [C.pine, C.pine, C.momijiR, C.momijiO], 4501, 4, 6);
    }

    // ---- Miyajima town behind the shrine: lanes of old houses, the path up to Daishō-in, pines and maples
    {
      for (let u = 5330; u < 5900; u++) {
        const bend = Math.round(Math.sin((u - 5330) / 120) * 6);
        for (let dx = -5; dx <= 5; dx++) {
          const x = 92 + bend + dx;
          img.set(x, Y(u), Math.abs(dx) === 5 ? C.stone[2] : rampColor(C.paving, 0.5 + fbm(x, u, { seed: 461, scale: 3 }) * 0.3, x, Y(u)));
        }
      }
      reserveRect(84, Y(5900), 22, 570);
      for (let u = 5480, k = 0; u < 5860; u += 34, k++) {
        for (const x of [10, 112]) {
          if (padNear(x + 12, u + 12, 26) || anyRes(x, Y(u + 26), 24, 28)) continue;
          hall(x + ((k * 7) % 12), Y(u + 24), 22, 11, 7, C.kawara, 'plain', { wall: k % 2 ? 0xe8e0d0 : C.oldWood[2], bay: 4 });
        }
      }
      hall(50, Y(5560), 30, 14, 7, C.kawara, 'temple', { gable: 'tri', gw: 9, bay: 5 }); // Daigan-ji
      grove(4, 176, 5300, 5895, 150, [C.pine, C.pine, C.momijiR, C.momijiO, C.momijiY, C.camphor], 4601, 4, 6.5);
      kit.wander(70, 5650, 16, 80, deerF, { n: 3, sp: 4, turn: 'flip', fps: 3, idle: 0.6 });
      kit.wander(140, 5700, 14, 60, deerF, { n: 2, sp: 4, turn: 'flip', fps: 3, idle: 0.6 });
      for (const s0 of [0.1, 0.45, 0.8]) {
        const c = COATS[(s0 * 10) | 0];
        kit.path([[92, 5340], [94, 5600], [90, 5890]], [walker(c, 0, 5600), walker(c, 1, 5600)], { sp: 3, mode: 'pp', hold: 3, turn: 'none', fps: 3, s0 });
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
      fillU(60, 124, 5902, 6160, C.gravel, 501, 4);
      // the stairway: stone steps either side of the line of brass sutra wheels
      for (let u = s0; u < s1; u++)
        for (let x = 80; x < 105; x++) {
          const y = Y(u);
          let c = (u - s0) % 3 === 0 ? C.granite[1] : (u - s0) % 3 === 1 ? C.granite[3] : C.granite[2];
          if (x === 80 || x === 104) c = C.stone[1];
          if (x >= 90 && x <= 94) c = x === 90 || x === 94 ? 0x3a3a40 : (u & 1) ? 0xc8a040 : 0x8a6a28;
          img.set(x, y, c);
        }
      reserveRect(78, Y(s1), 29, s1 - s0);
      // the wheels glint as people spin them going up (a glint running up the stairs)
      const wheelGlint = sprite(3, 2, 6000, (r) => {
        r.set(1, 0, 0xfff4b0);
        r.set(0, 1, 0xf8d860);
        r.set(2, 1, 0xf8d860);
      });
      const parts = [];
      for (let u = s0 + 2; u < s1; u += 4) parts.push([0, 91, u, -(u - s0) * 0.09]);
      kit.wave([wheelGlint], parts, { w: 1.6, a0: 0, a1: 0.9, pw: 6 });
      // the rakan: small stone figures in rows, each in a knitted cap of its own colour
      for (const x0 of [70, 106])
        for (let u = s0 + 4; u < s1 - 2; u += 5)
          for (let k = 0; k < 3; k++) {
            const x = x0 + k * 3;
            const y = Y(u);
            img.set(x + 1, y + 1, 0x1e1e26, 0.4);
            img.rect(x, y - 1, 2, 2, C.granite[2 + (k & 1)]);
            img.set(x, y - 2, [0xd83a2a, 0x3a6ad0, 0xf0f0f0, 0xe8c040, 0x6aaa5a, 0xe86aa0][(u + k + x0) % 6]);
            img.set(x + 1, y - 2, [0xd83a2a, 0x3a6ad0, 0xf0f0f0, 0xe8c040, 0x6aaa5a, 0xe86aa0][(u + k + x0) % 6]);
          }
      // the Niōmon at the foot of the steps, its two guardians in their bays
      hall(76, Y(5926), 33, 12, 8, C.kawara, 'temple', {
        gable: 'tri', gw: 11, open: true, bay: 11, noshi: true,
        extra: () => {
          const fy = Y(5926) + 12;
          for (const gx of [80, 102]) {
            img.rect(gx, fy + 2, 3, 5, 0xc83a2a);
            img.set(gx + 1, fy + 1, 0xe8b070);
          }
        },
      });
      // the main hall (Maniden), the Daishi-dō, the bell tower; lanterns along the eaves
      hall(68, Y(6132), 49, 20, 10, C.kawara, 'shrine', { gable: 'kara', gw: 16, bay: 7, noshi: true, open: false, crestC: C.gold });
      for (let x = 70; x < 116; x += 4) glow(x, Y(6132) + 21, 0xffb040, 0.85);
      hall(120, Y(6092), 24, 12, 7, C.kawara, 'temple', { gable: 'tri', gw: 8, bay: 6 });
      hall(126, Y(6140), 14, 9, 8, C.kawara, 'temple', { open: true, bay: 13 });
      objects.push({ y: Y(6124), draw: () => img.rect(131, Y(6127), 4, 4, 0x6a5a2a) });
      // Henjōkutsu: the cave of the 88 temples, its dark mouth in the rock with candles inside
      for (let u = 6050; u < 6096; u++)
        for (let x = 40; x < 70; x++) {
          const d = Math.hypot((x - 55) / 15, (u - 6073) / 23);
          if (d < 1) img.set(x, Y(u), rampColor(C.granite, 0.95 - d * 0.6 + fbm(x, u, { seed: 502, scale: 3 }) * 0.2, x, Y(u)));
        }
      objects.push({
        y: Y(6058),
        draw: () => {
          const y = Y(6058);
          for (let yy = -8; yy <= 0; yy++)
            for (let xx = -5; xx <= 5; xx++) if ((xx / 5) ** 2 + ((yy + 1) / 8) ** 2 < 1) img.set(55 + xx, y + yy, 0x0e0a0c);
          for (const cx of [52, 55, 58]) glow(cx, y - 2, 0xffc060, 0.95);
          pool(55, y - 2, 9, 0xff9a40, 0.35);
        },
      });
      reserveRect(40, Y(6096), 30, 46);
      // the incense burner before the main hall, smoke drifting; prayer candles burning
      objects.push({ y: Y(6060), draw: () => {
        img.rect(89, Y(6064), 7, 4, 0x5a4a3a);
        img.rect(88, Y(6065), 9, 1, 0x7a6a4a);
        glow(92, Y(6063), 0xff8a40, 0.8);
      } });
      kit.emit(92, 6066, incenseSmoke, { rate: 1.6, life: [1.6, 2.6], vy: 7, sx: 2, wf: 0.8, a: 0.45, tint: 1 });
      for (let x = 72; x < 82; x += 2) glow(x, Y(6080), 0xffd070, 0.9);
      for (let k = 0; k < 4; k++) {
        const c = COATS[k * 2];
        kit.path([[86 + k * 4, 5928], [86 + k * 4, 6044]], [walker(c, 0, 6000), walker(c, 1, 6000)], { sp: 2.5, mode: 'pp', hold: 4, turn: 'none', fps: 3, s0: k * 0.27 });
      }
      strollers(92, 6080, 24, 12, 5);
      grove(4, 66, 5905, 6160, 26, [C.momijiR, C.momijiO, C.pine, C.momijiY], 5101, 4, 6.5);
      grove(124, 176, 5905, 6160, 22, [C.momijiR, C.momijiO, C.pine, C.momijiR], 5102, 4, 6.5);
    }

    // ---- Momijidani: the mountain stream over its boulders under the maples, the vermilion bridge, the inn
    {
      // boulders in the stream, white water round them (live)
      const foam = [0, 1, 2].map((k) => sprite(9, 5, 6200, (r) => {
        for (let i = 0; i < 9; i++) r.set(i, 2 + Math.round(Math.sin(i * 0.9 + k * 2) * 1.5), 0xf4fcff, 0.75);
        r.set((k * 3) % 9, 0, 0xffffff, 0.6);
      }));
      for (let k = 0; k < 14; k++) {
        const x = 6 + k * 13 + ((k * 7) % 5);
        if (x > 78 && x < 104) continue;
        const bend = Math.sin(x / 24) * 8;
        const u = Math.round(STREAM[0] + 14 + bend + ((k * 11) % 26));
        const y = Y(u);
        for (let yy = -3; yy <= 3; yy++)
          for (let xx = -4; xx <= 4; xx++)
            if ((xx / 4) ** 2 + (yy / 3) ** 2 < 1) img.set(x + xx, y + yy, yy > 1 ? C.moss[1] : rampColor(C.granite.slice(0, 3), 0.7 - (xx + yy) * 0.1, x + xx, y + yy));
        kit.loop(x - 4, u - 2, foam, { fps: 4, d: 0.02, fx: 1 });
      }
      kit.spot([[0, STREAM[1] + 8, W, 70]], glintF0(6200), { rate: 2.5, fps: 7, a: 0.8 });
      // Momiji-bashi: arched, vermilion, with gilded post caps
      {
        const bx0 = 82;
        const bx1 = 99;
        objects.push({
          y: Y(STREAM[0] - 8) + 3,
          shadow: () => shadowRect(bx1, Y(STREAM[1] + 12), 3, STREAM[1] - STREAM[0] + 20, 0.55),
          draw: () => {
            for (let u = STREAM[0] - 8; u <= STREAM[1] + 12; u++) {
              const t = Math.sin(((u - STREAM[0] + 8) / (STREAM[1] - STREAM[0] + 20)) * Math.PI);
              const lift = Math.round(t * 4);
              const y = Y(u) - lift;
              for (let x = bx0; x <= bx1; x++) {
                const rail = x === bx0 || x === bx1;
                const post = rail && u % 8 === 0;
                img.set(x, y, post ? C.gold : rail ? C.vermilion[x === bx0 ? 3 : 1] : u % 3 === 0 ? C.hinoki[1] : C.hinoki[2]);
              }
              img.set(bx1 + 1, y + 1, C.vermilion[0]);
            }
          },
        });
        reserveRect(bx0 - 3, Y(STREAM[1] + 16), bx1 - bx0 + 7, STREAM[1] - STREAM[0] + 30);
      }
      // the trail on up through the valley
      for (let u = STREAM[1] + 14; u < 6960; u++) {
        const bend = u < 6560 ? Math.round(Math.sin((u - 6240) / 90) * 8) : 0;
        const cx = 90 + bend;
        for (let dx = -4; dx <= 4; dx++) {
          if (W_(cx + dx, Y(u))) continue;
          const step = u > 6560 && u % 4 === 0;
          img.set(cx + dx, Y(u), Math.abs(dx) === 4 ? C.stone[1] : step ? C.granite[3] : rampColor(C.paving, 0.5, cx + dx, Y(u)));
        }
        if (u < 6560) reserveRect(cx - 5, Y(u), 11, 1);
      }
      for (let u = 5900; u < STREAM[0] - 8; u++) for (let dx = -4; dx <= 4; dx++) img.set(90 + dx, Y(u), Math.abs(dx) === 4 ? C.stone[1] : rampColor(C.paving, 0.5, 90 + dx, Y(u)));
      // Iwasō, the old inn on the far bank, its wooden wings and tiled roofs
      hall(118, Y(6290), 40, 14, 9, C.kawara, 'oldwood', { bay: 5, wall: C.oldWood[2], noshi: true });
      hall(132, Y(6318), 30, 12, 7, C.kawara, 'oldwood', { bay: 5, wall: C.oldWood[1], sortBias: -2 });
      for (let x = 122; x < 156; x += 6) glow(x, Y(6290) + 15, 0xffc070, 0.8);
      kit.emit(150, 6300, thinSmoke, { rate: 0.8, life: [1.6, 2.4], vy: 6, sx: 1, wf: 0.8, a: 0.35, tint: 1 });
      // the Momijidani ropeway station on the left, its cable away up the mountain
      hall(2, Y(6372), 30, 12, 12, C.concrete, 'plain', { wall: 0xd8d4c8, hip: false, ridgeAt: 0.5 });
      // the maple canopy: crimson, scarlet and gold, thick on both sides of the trail
      grove(2, 176, STREAM[1] + 14, 6600, 330, [C.momijiR, C.momijiR, C.momijiO, C.momijiR, C.momijiY, C.pine, C.momijiO], 5201, 4, 7.5);
      strollers(70, 6420, 16, 60, 3);
      strollers(110, 6280, 10, 30, 3);
      kit.wander(60, 6460, 20, 80, deerF0(), { n: 2, sp: 4, turn: 'flip', fps: 3, idle: 0.6 });
    }

    // ---- the ropeway across the valley: twin cables edge to edge, the steel pylon, gondolas
    {
      const uL = 6375;
      const uR = 6525;
      objects.push({
        y: Y(uL) + 12,
        draw: () => {
          for (let x = 0; x < W; x++) {
            const cu = uL + ((uR - uL) * x) / (W - 1);
            img.set(x, Y(cu) - 14, 0xd0d8e0);
            img.set(x, Y(cu + 5) - 14, 0xb8c2cc);
          }
          const py = Y(uL + ((uR - uL) * 148) / (W - 1)) - 14;
          img.rect(146, py, 5, 18, 0x707c88);
          for (let k = 0; k < 18; k += 3) img.set(147 + (k % 2) * 2, py + k, 0xa0aab4);
          img.rect(144, py - 2, 9, 2, 0x9aa6b2);
        },
      });
      const gondola = sprite(9, 10, 6450, (r) => {
        r.rect(4, 0, 1, 3, 0x58626c);
        r.rect(1, 3, 7, 6, C.vermilion[2]);
        r.rect(2, 4, 5, 2, 0xd8f0ff);
        r.rect(1, 8, 7, 1, 0xf2ead8);
        r.set(1, 3, C.vermilion[3]);
      });
      kit.path([[-12, uL - 10 + 14], [W + 12, uR + 10 + 14]], [gondola], { sp: 16, n: 3, gap: 72, turn: 'none', d: 0.78 });
      kit.path([[W + 12, uR + 15 + 14], [-12, uL - 5 + 14]], [gondola], { sp: 16, n: 2, gap: 96, s0: 0.35, turn: 'none', d: 0.78 });
    }

    // ---- the summit of Misen: granite boulders, Kuguri-iwa, Misen Hondō and Sankidō, the courtyard (where
    // Sankibō comes down), Reikadō with its 1,200-year flame and the kettle over it, the observatory
    {
      const boulder = (bx, bu, rx, ry, seed) => {
        const by = Y(bu);
        objects.push({
          y: by + ry,
          shadow: () => shadowEllipse(bx + 3, by + 3, rx, ry * 0.8, 0.6),
          draw: () => {
            for (let dy = -ry; dy <= ry; dy++)
              for (let dx = -rx; dx <= rx; dx++) {
                const d = (dx / rx) ** 2 + (dy / ry) ** 2 - fbm(bx + dx, by + dy, { seed: seed + 800, scale: 4 }) * 0.25;
                if (d > 0.85) continue;
                const shade = 0.4 + (-dx * 0.3 - dy * 0.4) / rx + fbm(bx + dx, by + dy, { seed: 809, scale: 3 }) * 0.35;
                let c = rampColor(C.granite, Math.max(0.05, Math.min(0.98, shade)), bx + dx, by + dy);
                if (fbm(bx + dx, by + dy, { seed: 810, scale: 2 }) > 0.72) c = scaleColor(c, 0.8); // cracks and lichen
                img.set(bx + dx, by + dy, c);
              }
          },
        });
        reserveRect(bx - rx, by - ry, rx * 2, ry * 2);
      };
      for (const [bx, bu, rx, ry] of [[30, 6620, 14, 10], [150, 6640, 15, 11], [24, 6790, 14, 12], [34, 7040, 15, 11], [146, 7050, 15, 11], [64, 7112, 11, 8], [118, 7116, 11, 8], [22, 6930, 10, 9], [158, 6930, 10, 9]])
        boulder(bx, bu, rx, ry, bx + bu);
      // Kuguri-iwa: a great slab resting on two boulders, a passage under it
      boulder(138, 6744, 10, 9, 21);
      boulder(162, 6748, 9, 9, 22);
      objects.push({
        y: Y(6738) + 2,
        shadow: () => shadowRect(136, Y(6770), 34, 14, 0.55),
        draw: () => {
          const y = Y(6764);
          for (let yy = 0; yy < 10; yy++)
            for (let xx = 0; xx < 34; xx++) {
              const e = Math.min(xx, 33 - xx, yy * 2, (9 - yy) * 3);
              if (e < 1 && fbm(xx, yy, { seed: 811, scale: 2 }) > 0.4) continue;
              img.set(132 + xx, y + yy, rampColor(C.granite, 0.85 - yy * 0.06 - xx * 0.008, xx, yy));
            }
          img.rect(146, y + 10, 8, 8, 0x14100e);
        },
      });
      // Misen Hondō and the vermilion Sankidō, hall of the great tengu Sankibō
      hall(36, Y(6830), 34, 14, 8, C.kawara, 'temple', { gable: 'tri', gw: 10, bay: 6, noshi: true });
      hall(116, Y(6830), 30, 13, 8, C.kawara, 'shrine', { gable: 'kara', gw: 10, bay: 5, crestC: C.gold });
      glow(131, Y(6830) + 18, 0xffb040, 0.9);
      kit.emit(131, 6806, incenseSmoke, { rate: 1, life: [1.5, 2.4], vy: 6, sx: 1, wf: 0.8, a: 0.4, tint: 1 });
      // the courtyard, where the boss fight is: paved granite, kept clear
      for (let u = 6840; u <= 7045; u++)
        for (let x = 52; x <= 128; x++) {
          const border = x === 52 || x === 128 || u === 6840 || u === 7045;
          let c = border ? C.stone[3] : (x - 52) % 8 === 0 || (u - 6840) % 8 === 0 ? C.granite[1] : C.granite[2];
          if (!border && fbm(x, u, { seed: 812, scale: 3 }) > 0.7) c = scaleColor(c, 1.08);
          img.set(x, Y(u), c);
        }
      reserveRect(50, Y(7047), 81, 209);
      // the stone torii at the courtyard's foot
      objects.push({
        y: Y(6835),
        shadow: () => shadowRect(84, Y(6840), 22, 3, 0.6),
        draw: () => {
          img.rect(81, Y(6848), 3, 12, C.granite[3]);
          img.rect(97, Y(6848), 3, 12, C.granite[3]);
          img.rect(81, Y(6848), 1, 12, C.granite[4]);
          img.rect(97, Y(6848), 1, 12, C.granite[4]);
          for (let dx = -12; dx <= 12; dx++) {
            const lift = Math.round((dx * dx) / 110);
            img.set(90 + dx, Y(6850) - lift, C.granite[4]);
            img.set(90 + dx, Y(6849) - lift, C.granite[2]);
          }
          img.rect(80, Y(6846), 21, 2, C.granite[3]);
        },
      });
      // Reikadō: the hall of the spirit flame Kōbō Daishi lit in 806, the great iron kettle hung over it
      objects.push({
        y: Y(6970),
        shadow: () => shadowRect(75, Y(7032) + 3, 37, 56, 0.52),
        draw: () => {
          roof(72, Y(7032), 37, 40, C.kawara, { noshi: true, gable: 'tri', gw: 12, crest: false, ridgeAt: 0.4 });
          facade(73, Y(6992), 35, 9, 'temple', { bay: 5, open: true });
          // the hearth, the kettle, the flame
          img.rect(84, Y(6985), 13, 2, 0x3a3030);
          img.rect(86, Y(6990), 9, 5, 0x2a2628);
          img.rect(87, Y(6991), 7, 1, 0x4a4448);
          img.rect(87, Y(6986), 7, 2, 0xffb848);
          img.rect(88, Y(6986), 5, 1, 0xfff0a0);
          glow(90, Y(6986), 0xfff0a0, 1);
          pool(90, Y(6985), 18, 0xff8c38, 0.42);
        },
      });
      reserveRect(70, Y(7034), 41, 50);
      const fireF = [0, 1, 2].map((k) => sprite(9, 4, 6986, (r) => {
        for (let x = 0; x < 9; x++) {
          const h = 1 + ((x * 3 + k * 2) % 3);
          for (let y = 4 - h; y < 4; y++) r.set(x, y, y === 4 - h ? 0xffd060 : 0xff7a28);
        }
        r.set(2 + k * 2, 0, 0xfff4b0);
      }));
      kit.loop(86, 6986, fireF, { fps: 7, d: 0.05 });
      kit.emit(90, 6992, stallSteam, { rate: 1.3, life: [1.5, 2.4], vy: 7, sx: 2, wf: 0.8, a: 0.45, tint: 1 }); // the kettle steaming
      // two braziers of the sacred fire in the courtyard
      for (const fx of [64, 116]) {
        const fu = 6940;
        const fy = Y(fu);
        objects.push({
          y: fy + 3,
          draw: () => {
            img.disc(fx, fy, 4, 0x2c2830);
            img.disc(fx, fy, 2.5, 0xe84824);
            glow(fx, fy, 0xffd878, 1);
            pool(fx, fy, 14, 0xff7a30, 0.38);
          },
        });
        const f = [0, 1].map((k) => sprite(5, 6, fu, (r) => {
          r.rect(1, 2, 3, 3, 0xe83820);
          r.rect(1 + (k ? 0 : 1), 1, 2, 3, 0xffa830);
          r.set(2, k ? 0 : 1, 0xfff8b8);
        }));
        kit.loop(fx - 2, fu + 3, f, { fps: 6, d: 0.55 });
        kit.emit(fx, fu + 2, incenseSmoke, { rate: 1.5, life: [1.5, 2.4], vy: 7, sx: 2, a: 0.5 });
      }
      // the observatory on the very top: a timber deck under a slatted roof, people looking out over the Seto Sea
      objects.push({
        y: Y(7086),
        shadow: () => shadowRect(64, Y(7150) + 4, 56, 64, 0.55),
        draw: () => {
          for (let u = 7096; u < 7150; u++)
            for (let x = 60; x < 120; x++) {
              const y = Y(u) - 8;
              let c = (u - 7096) % 3 === 0 ? C.oldWood[1] : C.oldWood[2];
              if (x === 60 || x === 119 || u === 7096 || u === 7149) c = C.oldWood[0];
              if ((x - 60) % 12 === 0) c = C.oldWood[0];
              img.set(x, y, c);
            }
          for (let yy = Y(7096) - 8; yy < Y(7090); yy++) for (let x = 62; x < 118; x++) img.set(x, yy, (x - 62) % 7 === 0 ? C.hinoki[0] : 0x2a2a30);
          for (let x = 64; x < 118; x += 9) img.rect(x, Y(7090), 1, 4, C.concrete[2]);
        },
      });
      reserveRect(58, Y(7152) - 10, 64, 66);
      crowd(64, Y(7090) + 1, 52, 4, 12, true);
      // wind-twisted summit pines and maples, kites wheeling over the summit
      for (const [tx, tu, pal] of [[44, 6880, C.momijiR], [136, 6890, C.momijiO], [42, 6990, C.pine], [138, 6990, C.pine], [48, 7092, C.momijiR], [132, 7095, C.momijiY], [20, 6700, C.pine], [100, 6680, C.pine], [70, 6740, C.momijiR], [160, 6860, C.pine]])
        tree(tx, Y(tu), 6, pal, tx * 29 + tu, pal === C.pine ? 'pine' : 'broadleaf');
      const kite = [0, 1].map((f) => sprite(9, 4, 6900, (r) => {
        for (let i = 0; i < 4; i++) {
          r.set(4 - i - 1, f ? 1 + (i >> 1) : 2 - (i >> 1), 0x5a4030);
          r.set(4 + i + 1, f ? 1 + (i >> 1) : 2 - (i >> 1), 0x5a4030);
        }
        r.set(4, 2, 0x3a2a20);
        r.set(4, 3, 0x6a5040);
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

  // turret pads: octagonal Seto granite with a vermilion lantern ring
  for (const p of pads) {
    const y = Y(p.u);
    for (let yy = y - 9; yy <= y + 9; yy++)
      for (let xx = p.x - 9; xx <= p.x + 9; xx++) {
        const d = Math.hypot(xx + 0.5 - p.x, yy + 0.5 - y);
        if (d > 9.2) continue;
        img.set(xx, yy, d > 7.8 ? C.stone[1] : d > 6.4 ? C.vermilion[2] : (xx + yy) % 4 === 0 ? C.granite[2] : C.granite[3]);
      }
  }

  // ------------------------------------------------------------ time-of-day grade, warm light pools, lamps
  const tint = TOD.map(([, , t]) => rgb(t));
  for (let y = 0; y < L; y++) {
    const u = U(y);
    let i = 0;
    while (i < TOD.length - 2 && u >= TOD[i + 1][0]) i++;
    const t = smooth(TOD[i][0], TOD[i + 1][0], u);
    const mul = TOD[i][1].map((m, k) => m + (TOD[i + 1][1][k] - m) * t);
    const tc = tint[i].map((c, k) => c + (tint[i + 1][k] - c) * t);
    const amt = TOD[i][3] + (TOD[i + 1][3] - TOD[i][3]) * t;
    for (let x = 0; x < W; x++) {
      const p = (y * W + x) * 4;
      const d = img.data;
      if (!d[p + 3]) continue;
      for (let k = 0; k < 3; k++) {
        const v = d[p + k] * mul[k];
        d[p + k] = v + (tc[k] - v) * amt;
      }
    }
  }
  for (const pl of pools) applyPool(img, pl);
  for (const [x, y, c, a] of lights) img.set(x, y, c, a);

  const chunks = [];
  for (let i = 0; i < CHUNKS; i++) chunks.push(img.crop(0, i * CHUNK, W, CHUNK));
  return {
    strip: img,
    chunks,
    props: kit.pack(),
    meta: { width: W, chunkHeight: CHUNK, chunks: CHUNKS, length: L, tint: tintTable(L, tod.white) },
  };
}
