// Middle layer (Beppu) at 540 px, seen from above in 3/4 view like the other cities: the bay and the black-sand
// beach of the sand baths, a seafront of tall hotels, the station and downtown (Beppu Tower, the covered
// arcade, the old Takegawara bathhouse, the Harukigawa canal, Beppu Park with Global Tower), then Kannawa: a dense hillside of tiled roofs with
// white plumes of hot-spring steam rising from wellheads between the houses everywhere. Then the Hells in their
// gardens (the cobalt Umi Jigoku with its red shrine and giant lily pads, the grey mud of Oniishibozu, Kamado's
// coloured pools and its oni cook, the milky Shiraike), the crocodile pens of Oniyama with the red oni
// statue, the monkey woods of Takasakiyama, the stone pit of the Tatsumaki geyser, and the blood-red
// pond of Chinoike where the boss rises. Above Kannawa the thatched yu-no-hana huts of Myōban; the Tsurumi
// ropeway strung over the monkey woods. Misty morning turning into a red dusk.
//
// The steam is live: only a wet patch and a low haze are painted at each source, the plumes themselves
// are puffs the game keeps sending up (shaded like clouds, lit from the top left), swelling and bending
// with the breeze. The hot pools bubble (the grey mud in "monks' heads"), waves wash the black sand,
// boats cross the bay, trains pass the station, crocodiles swim in their pens, the macaques of
// Takasakiyama wander their clearing, the ropeway's cabins glide over the woods (macaques watching from its
// pylons), steam seeps from the Myōban huts, bathers in yukata stroll Kannawa's lane as its lanterns brighten
// one after another, eggs cook in a basket in Umi Jigoku with visitors round its railing, attendants shovel
// the sand baths, traffic goes round the islands of Ekimae-dōri, the crowns sway (see TreeSway.js), and lights chase
// up Beppu Tower (see ../props.mjs). Vents and turret pads come from the wave file.
// Coordinates: u = distance from the bottom of the strip (stage start), y = L - u. Layout in logical units (180
// wide), drawing in fine pixels (540 wide).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Raster, fbm, rng, scaleColor, rgb } from '../../lib/raster.mjs';
import { crownPixels, palmPixels, rampColor } from '../nature.mjs';
import { HiCanvas, hashPx } from '../hires.mjs';
import { PropKit, puff, todGrade, tintTable } from '../props.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export const W = 180;
const S = 3; // fine pixels per logical one
export const CHUNK = 896;
export const CHUNKS = 8;
export const L = CHUNK * CHUNKS;

const BAY = [0, 1000];
const TOWN = [1000, 2100];
const KANNAWA = [2100, 3300];
const HELLS = [3300, 4700];
const ONIYAMA = [4700, 5450];
const TAKASAKI = [5450, 6300];
const TATSUMAKI = [6300, 6650];
const SEAWALL = 350; // the top of the beach

// roof ramps: [shaded hip, south slope, north slope, lit hip]
const ROOF = {
  kawara: [0x2a303c, 0x3c4452, 0x515b6c, 0x6a7588],
  dark: [0x262426, 0x37333a, 0x4a454e, 0x605a64],
  brown: [0x3a2a22, 0x523c30, 0x6a4e3c, 0x86664e],
  blue: [0x22364a, 0x324c66, 0x446486, 0x6084a4],
  red: [0x5a2620, 0x7a3428, 0x984634, 0xb46048],
  green: [0x24402e, 0x34583e, 0x487050, 0x628c68],
  orange: [0x6a3a22, 0x8a4e2c, 0xa8663a, 0xc4824e],
};
const C = {
  sea: [0x2a5c6c, 0x3a707e, 0x4e8490, 0x6a9aa4],
  sand: [0x24201e, 0x302b28, 0x3e3834, 0x504842],
  grass: [0x34522e, 0x42643a, 0x547846, 0x6c8e54],
  lawn: [0x3e6036, 0x4c7040, 0x5e824c, 0x76985a],
  forest: [0x1a2c1c, 0x223822, 0x2c4628],
  alley: [0x58565c, 0x636168, 0x6e6c72],
  oldAlley: [0x5e5a54, 0x6a665e, 0x767268],
  asphalt: [0x3c3c42, 0x46464c, 0x525258],
  walk: [0x8a867e, 0x98948c, 0xa6a29a],
  gravel: [0xa09482, 0xb0a490, 0xc0b49e],
  rock: [0x5a5650, 0x6e6a62, 0x847e74, 0x9a948a],
  stone: [0x6a665e, 0x827e74, 0x9a968a, 0xb2aea0],
  clay: [0x7a3e2c, 0x8a4c36, 0x9a5c42, 0xaa6c50],
  ballast: [0x5a524a, 0x6a6258, 0x7a7266],
  flat: [0x9a9894, 0xaaa6a0, 0xbab6ae, 0x8e949c, 0xc4beb2],
  walls: [0xece4d4, 0xddd4c2, 0xc8c0b0, 0xf2efe8, 0xd8ccb8],
  wood: [0x4a3424, 0x5e4430, 0x76583e],
  cobalt: [0x1a6aa8, 0x2a88c8, 0x48a8e0, 0x7ac8f0],
  mud: [0x5a5652, 0x6e6a64, 0x86827a, 0x9e9a92],
  milk: [0x8ab0c0, 0xa8c8d4, 0xc8dce4, 0xe0ecf0],
  blood: [0x8a1a14, 0xb02a1e, 0xc84028, 0xe0603a],
  jade: [0x2a7a6a, 0x3a9a84, 0x5ab8a0, 0x8ad4bc],
  steam: [0xa4acb6, 0xc8ced6, 0xe6eaee, 0xffffff],
  glass: [0x2e3a48, 0x3a4858],
  warm: 0xffd88a,
};
const CARS = [0xe8e8ec, 0x2a2a30, 0xc03a30, 0x3a5a9a, 0x9aa0a8, 0xe8d8a0, 0x4a7a5a];
const COATS = [0xd04040, 0x3a6ad0, 0xe8c040, 0xe8e8f0, 0x6a9a5a, 0xf0a0b0, 0x3a3a4a, 0x3a3a4a, 0x2a2a34];
const YUKATA = [0x2b3c78, 0xe8e0d0, 0x8a2a3a, 0x3a5a7a, 0xd8a0b0, 0xf0ece0, 0x2b3c78];

const TOD = [
  [0, [0.97, 0.97, 0.98], 0xd0d8e0, 0.07],
  [3300, [0.93, 0.9, 0.89], 0xc8b0a8, 0.07],
  [5450, [0.86, 0.75, 0.72], 0x8a4a3a, 0.11],
  [L, [0.76, 0.6, 0.57], 0x5a1a1a, 0.14],
];

const LIGHT = (() => {
  const v = [-0.55, -0.6, 0.58];
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
})();

const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const clamp01 = (v) => Math.max(0, Math.min(1, v));

export function buildMid() {
  const stage = JSON.parse(readFileSync(join(root, 'src', 'data', 'stage6.json'), 'utf8'));
  const { mid: V, anchor } = stage.scroll;
  let img = new HiCanvas(W, L, S);
  const rand = rng(6606);
  const Y = (u) => Math.round(L - u);
  const U = (y) => L - y;
  const reserved = new Uint8Array(W * L);
  const padMask = new Uint8Array(W * L); // turret pads and geyser vents: nothing may cover them
  const margin = new Uint8Array(W * L); // the strip kept round a building: a lane, where people may walk
  const isRes = (x, y) => x >= 0 && x < W && y >= 0 && y < L && reserved[Math.floor(y) * W + Math.floor(x)];
  const anyRes = (x0, y0, w, h) => {
    for (let y = Math.floor(y0); y < y0 + h; y++) for (let x = Math.max(0, Math.floor(x0)); x < Math.min(W, x0 + w); x++) if (isRes(x, y)) return true;
    return false;
  };
  const reserveRect = (x0, y0, w, h) => {
    for (let y = Math.max(0, Math.floor(y0)); y < Math.min(L, y0 + h); y++)
      for (let x = Math.max(0, Math.floor(x0)); x < Math.min(W, x0 + w); x++) reserved[y * W + x] = 1;
  };
  /** Reserve a building's foot, and remember the margin of `m` round it as a lane people can walk in. */
  const reserveFoot = (x, y, w, h, m = 1) => {
    for (let yy = y - m; yy < y + h + m; yy++)
      for (let xx = x - m; xx < x + w + m; xx++) {
        if (xx < 0 || xx >= W || yy < 0 || yy >= L) continue;
        const foot = xx >= x && xx < x + w && yy >= y && yy < y + h;
        if (foot) margin[yy * W + xx] = 0;
        else if (!reserved[yy * W + xx]) margin[yy * W + xx] = 1;
        reserved[yy * W + xx] = 1;
      }
  };
  const padFree = (x, y) => {
    const i = Math.floor(y) * W + Math.floor(x);
    return i < 0 || i >= W * L || !padMask[i];
  };
  const objects = [];
  const lights = [];
  const lightsFine = []; // the same, single fine pixels: panes, flames, sparks
  const pools = []; // soft pools of light on the ground, added after the grade
  const glow = (x, y, c, a = 1) => lights.push([Math.round(x), Math.round(y), c, a]);
  const glowPx = (X, Yy, c, a = 1) => lightsFine.push([Math.round(X), Math.round(Yy), c, a]);
  const pool = (x, y, r, c, k = 0.3) => pools.push({ x, y, r, c, k });
  const kit = new PropKit(6616, { artScale: S }); // the moving parts
  const frame0 = kit.frame.bind(kit);
  kit.frame = (r, name) => frame0(r.hi ?? r, name); // (frames are drawn on HiCanvases)
  const tod = todGrade(TOD, smooth);
  const crownMask = new Uint8Array(W * S * L * S); // (the crowns of the trees, each its own 1..15: the wind runs through them)
  const crownHash = new Uint8Array(W * S * L * S); // (what each crown drew there, to know if something was drawn over it)
  /** Draw with the stage's own helpers into a small frame at (x0, y0) (strip pixels), graded for its place, lights on top. */
  const capture = (x0, y0, w, h, draw, u = U(y0 + h / 2)) => {
    const keep = img;
    const nl = lights.length;
    const nf = lightsFine.length;
    img = new HiCanvas(w, h, S, x0, y0);
    draw();
    const out = img;
    img = keep;
    const lit = lights.splice(nl);
    const litFine = lightsFine.splice(nf);
    tod.frame(out, u);
    for (const [x, y, c, a] of lit) out.light(x, y, c, a);
    for (const [X, Yy, c, a] of litFine) out.px(X, Yy, c, a);
    return kit.frame(out);
  };
  const shadowRect = (x, y, w, h, f = 0.6) => {
    const X0 = Math.round(x * S);
    const Y0 = Math.round(y * S);
    const X1 = Math.round((x + w) * S);
    const Y1 = Math.round((y + h) * S);
    for (let Yy = Y0; Yy < Y1; Yy++)
      for (let X = X0; X < X1; X++) {
        const edge = X === X0 || X === X1 - 1 || Yy === Y0 || Yy === Y1 - 1;
        img.tintPx(X, Yy, edge ? 1 - (1 - f) * 0.55 : f);
      }
  };
  const fill = (x0, y0, w, h, ramp, seed, scale = 5) =>
    img.fine(x0, y0, w, h, (X, Yr, x, y) => {
      const g = hashPx(X, Yr, seed);
      const c = rampColor(ramp, 0.2 + fbm(x, y, { seed, scale, octaves: 2 }) * 0.65, X, Yr);
      return g < 0.06 ? scaleColor(c, 0.88) : g > 0.95 ? scaleColor(c, 1.1) : c;
    });
  // dusk: more and more windows lit towards the end of the stage
  const litChance = (u) => 0.05 + smooth(3000, L, u) * 0.4;
  const dark = (u) => smooth(4700, 6200, u); // (lamps show from here on)

  const pads = stage.waves.filter((w) => w.type === 'turret').map((w) => ({ x: w.x, u: anchor + V * w.t + 10 }));
  const vents = stage.waves.filter((w) => w.type === 'geyser').map((w) => ({ x: w.x, u: anchor + V * w.t + 10, mud: w.kind === 'mud' }));
  const pond = stage.waves.find((w) => w.type === 'boss').pond;
  for (const p of [...pads, ...vents]) {
    reserveRect(p.x - 12, Y(p.u) - 12, 24, 24);
    for (let y = Y(p.u) - 12; y < Y(p.u) + 12; y++) for (let x = Math.max(0, p.x - 12); x < Math.min(W, p.x + 12); x++) padMask[y * W + x] = 1;
  }

  // ------------------------------------------------------------ 1. ground
  const shoreAt = (x) => 210 + 18 * Math.sin(x / 30) + (fbm(x, 1, { seed: 61, scale: 14 }) - 0.5) * 14;
  const shoreT = new Float32Array(W * S);
  const edgeT = new Float32Array(W * S);
  for (let X = 0; X < W * S; X++) {
    shoreT[X] = shoreAt((X + 0.5) / S);
    edgeT[X] = (fbm((X + 0.5) / S, 5, { seed: 70, scale: 16, octaves: 2 }) - 0.5) * 22;
  }
  const shore = (x) => shoreT[Math.max(0, Math.min(W * S - 1, Math.floor(x * S)))];
  /** The ground at a fine pixel; n is a broad noise for its logical cell. */
  const groundAt = (X, Yr, x, y, u, n, uRaw) => {
    const g = hashPx(X, Yr, 5);
    if (uRaw < SEAWALL) {
      // black volcanic sand with pale grains, ripples the tide left, darker where it is damp
      let c = rampColor(C.sand, 0.3 + n * 0.6, X, Yr);
      if (Math.sin(uRaw * 2.2 + n * 14) > 0.82) c = scaleColor(c, 0.9);
      if (g > 0.975) c = 0x7a7268;
      else if (g > 0.95) c = scaleColor(c, 1.25);
      else if (g < 0.05) c = scaleColor(c, 0.78);
      return c;
    }
    if (u < TOWN[1]) {
      // patched asphalt
      let c = rampColor(C.alley, 0.2 + n * 0.7, X, Yr);
      if (hashPx(X >> 4, Yr >> 4, 6) < 0.05) c = scaleColor(c, 0.92);
      if (g < 0.06) c = scaleColor(c, 0.9);
      else if (g > 0.96) c = scaleColor(c, 1.1);
      return c;
    }
    if (u < KANNAWA[1]) {
      // old paving: worn stone slabs in courses, moss in the joints
      const row = Yr >> 3;
      const XX = X + (row % 2) * 7;
      const joint = Yr % 8 === 0 || XX % 14 === 0;
      const t = hashPx(XX >> 4, row, 8);
      let c = rampColor(C.oldAlley, 0.2 + t * 0.3 + n * 0.4, X, Yr);
      if (joint) return hashPx(X >> 1, Yr >> 1, 7) < 0.2 ? 0x4e5a3c : scaleColor(c, 0.84);
      if (g < 0.05) c = scaleColor(c, 0.88);
      return c;
    }
    if (u < HELLS[1]) {
      // a mown lawn: blades in flecks, tufts of darker clover, the odd daisy
      let c = rampColor(C.lawn, 0.25 + n * 0.6, X, Yr);
      const t = hashPx(X >> 1, Yr >> 1, 9);
      if (t < 0.12) c = scaleColor(c, 0.84);
      else if (t > 0.9) c = scaleColor(c, 1.14);
      if (g > 0.9985) c = 0xf4f0e0;
      else if (g < 0.0012) c = 0xf0d040;
      return c;
    }
    if (u < ONIYAMA[1]) {
      // concrete paving flags, stained by the steam
      const t = hashPx(Math.floor(X / 15), Math.floor(Yr / 15), 10);
      let c = rampColor(C.walk, 0.25 + n * 0.4 + (t - 0.5) * 0.2, X, Yr);
      if (X % 15 === 0 || Yr % 15 === 0) return scaleColor(c, 0.9);
      if (g < 0.05) c = scaleColor(c, 0.92);
      return c;
    }
    if (u < TAKASAKI[1]) {
      // the forest floor: leaf litter, moss, dark earth
      let c = rampColor(C.forest, 0.2 + n * 0.7, X, Yr);
      const t = hashPx(X >> 1, Yr >> 1, 11);
      if (t > 0.985) c = 0x4a3a22;
      else if (t > 0.97) c = 0x3e3a22;
      else if (t < 0.14) c = 0x2e4e2a;
      else if (t < 0.24) c = 0x263e24;
      return c;
    }
    if (u < TATSUMAKI[1]) {
      // bare hot rock with a pale mineral crust
      let c = rampColor(C.rock, 0.2 + n * 0.6, X, Yr);
      if (n > 0.62 && g > 0.6) c = 0xb0a890;
      else if (g < 0.08) c = scaleColor(c, 0.8);
      return c;
    }
    // red earth stained by the iron in the water, pale salts where it dried
    let c = rampColor(C.clay, 0.2 + n * 0.6, X, Yr);
    if (g > 0.985) c = 0xc89878;
    else if (g < 0.07) c = scaleColor(c, 0.86);
    return c;
  };
  {
    const nRow = new Float32Array(W);
    for (let Yr = 0; Yr < L * S; Yr++) {
      const y = (Yr + 0.5) / S;
      const u = L - y;
      if (Yr % S === 0) {
        const ly = Math.floor(y);
        const lu = L - ly;
        for (let x = 0; x < W; x++) nRow[x] = fbm(x, ly, { seed: lu < TOWN[1] ? 62 : lu < KANNAWA[1] ? 64 : lu < HELLS[1] ? 65 : lu < TAKASAKI[1] ? 66 : 67, scale: 6, octaves: 2 });
      }
      for (let X = 0; X < W * S; X++) {
        const x = (X + 0.5) / S;
        const n = nRow[Math.floor(x)];
        const d = u - shoreT[X];
        if (d < 0) {
          // the bay: foam at the edge, ripples running in, fading out into the far layer
          const t = -d;
          const a = t < 12 ? 1 : 1 - (t - 12) / 30;
          if (a <= 0) continue;
          const nn = fbm(x, y, { seed: 71, scale: 5, octaves: 2 });
          let c;
          if (t < 1 + nn * 1.8) c = 0xe8f0f0;
          else {
            const wob = fbm(x * 0.6, y * 1.4, { seed: 72, scale: 4 });
            const rip = Math.sin((t + wob * 9) * 2.1);
            c = rampColor(C.sea, clamp01(0.8 - t / 44 + (nn - 0.5) * 0.4), X, Yr);
            if (t < 14 && rip > 0.93 && nn > 0.42) c = 0xcfe2e4;
            else if (rip > 0.84) c = scaleColor(c, 1.14);
            else if (rip < -0.88) c = scaleColor(c, 0.86);
            if (hashPx(X, Yr, 73) > 0.9985) c = 0xf0f8f8;
          }
          const [r, g, b] = rgb(c);
          // (partly clear water stays out of the alpha values that mark the crowns)
          img.setRGBAPx(X, Yr, r, g, b, a >= 1 ? 255 : Math.round(a * 236));
          continue;
        }
        if (d < 9) {
          // the wet edge of the beach, the sky in it, the last of the foam
          const g = hashPx(X, Yr, 74);
          let c = scaleColor(C.sand[0], 0.8 + d * 0.03);
          const sk = fbm(x, y, { seed: 75, scale: 3 });
          if (d < 5 && sk > 0.58) c = d < 2.5 ? 0x6a8088 : 0x4a5a60;
          if (d < 3 && g > 0.9) c = 0xd8e4e4;
          else if (g > 0.97) c = 0x6e665c;
          img.hi.set(X, Yr, c);
          continue;
        }
        img.hi.set(X, Yr, groundAt(X, Yr, x, y, u + edgeT[X], n, u));
      }
    }
  }

  // ------------------------------------------------------------ helpers
  /** One fine pixel of a street, `across` logical units from its middle: pavement flags, kerb, worn asphalt, the dashes. */
  const roadPx = (X, Yr, across, hw, line, along) => {
    const a = Math.abs(across);
    const g = hashPx(X, Yr, 33);
    let c;
    if (a > hw + 0.5) {
      const joint = X % 6 === 0 || Yr % 6 === 0;
      c = joint ? scaleColor(C.walk[0], 0.82) : rampColor(C.walk, 0.2 + hashPx(X >> 2, Yr >> 2, 34) * 0.7, X, Yr);
      if (hashPx(X >> 3, Yr >> 3, 35) < 0.05) c = scaleColor(c, 0.9);
    } else if (a > hw - 0.2) c = a > hw + 0.1 ? 0xa8a8a8 : 0x6e6e72; // kerb, and the gutter by it
    else {
      c = rampColor(C.asphalt, 0.2 + hashPx(X >> 3, Yr >> 3, 36) * 0.5, X, Yr);
      // the wheels' two polished tracks in each lane
      const lane = a - hw / 2;
      if (Math.abs(Math.abs(lane) - hw / 4) < 0.35) c = scaleColor(c, 1.07);
      if (g < 0.08) c = scaleColor(c, 0.9);
      else if (g > 0.96) c = scaleColor(c, 1.14);
      if (line && a < 0.3 && Math.floor(along / 15) % 2) c = 0xd8d8d0;
      if (a > hw - 0.7 && hashPx(X, Yr >> 1, 37) < 0.7) c = scaleColor(c, 0.82);
    }
    img.hi.set(X, Yr, c);
  };
  /** A street running up the screen, optionally winding (amp, period). Returns its centre function. */
  const vRoad = (cx, hw, u0, u1, amp = 0, period = 80, phase = 0) => {
    const at = (u) => cx + amp * Math.sin(u / period + phase);
    for (let Yr = Math.round((L - u1) * S); Yr < Math.round((L - u0) * S); Yr++) {
      const c = at(L - (Yr + 0.5) / S);
      for (let X = Math.max(0, Math.floor((c - hw - 2) * S)); X < Math.min(W * S, Math.ceil((c + hw + 2) * S)); X++) roadPx(X, Yr, (X + 0.5) / S - c, hw, hw >= 4, Yr);
    }
    for (let u = u0; u < u1; u++) reserveRect(at(u) - hw - 3, Y(u), hw * 2 + 6, 1);
    return at;
  };
  const hRoad = (uc, hw, x0 = 0, x1 = W) => {
    for (let Yr = Math.round((L - uc - hw - 2) * S); Yr < Math.round((L - uc + hw + 2) * S); Yr++) {
      const across = L - (Yr + 0.5) / S - uc;
      for (let X = Math.max(0, x0 * S); X < Math.min(W * S, x1 * S); X++) roadPx(X, Yr, across, hw, false, X);
    }
    reserveRect(x0, Y(uc + hw + 3), x1 - x0, hw * 2 + 6);
  };
  /** Zebra stripes over x0..x1, rows Y0..Y1 (fine), running across a street. */
  const zebra = (X0, Y0, X1, Y1, vertical) => {
    for (let Yy = Y0; Yy < Y1; Yy++) for (let X = X0; X < X1; X++) if ((vertical ? X : Yy) % 7 < 4 && hashPx(X, Yy, 38) > 0.08) img.px(X, Yy, 0xd4d4cc);
  };
  /** A small car seen from above: a rounded body lit along one side, bonnet, windscreen, roof, rear window, mirrors. */
  const carPx = (target, X0, Y0, vertical, color) => {
    const FW = (vertical ? 4 : 7) * S;
    const FH = (vertical ? 7 : 4) * S;
    for (let j = 0; j < FH; j++)
      for (let i = 0; i < FW; i++) {
        if ((i === 0 || i === FW - 1) && (j === 0 || j === FH - 1)) continue;
        const a = vertical ? j : FW - 1 - i;
        const n = vertical ? FH : FW;
        const side = vertical ? i : j;
        const sn = vertical ? FW : FH;
        let c = side === 0 ? scaleColor(color, 1.2) : side === sn - 1 ? scaleColor(color, 0.7) : color;
        if (a >= n * 0.22 && a < n * 0.34) c = side === 0 || side === sn - 1 ? scaleColor(color, 0.6) : 0x2a3440;
        else if (a >= n * 0.34 && a < n * 0.7 && side > 0 && side < sn - 1) c = scaleColor(color, 1.12);
        else if (a >= n * 0.7 && a < n * 0.8) c = side === 0 || side === sn - 1 ? scaleColor(color, 0.6) : 0x34404c;
        target.px(X0 + i, Y0 + j, c);
      }
    if (vertical) {
      target.px(X0 - 1, Y0 + Math.round(FH * 0.3), scaleColor(color, 0.8));
      target.px(X0 + FW, Y0 + Math.round(FH * 0.3), scaleColor(color, 0.8));
    } else {
      target.px(X0 + Math.round(FW * 0.68), Y0 - 1, scaleColor(color, 0.8));
      target.px(X0 + Math.round(FW * 0.68), Y0 + FH, scaleColor(color, 0.8));
    }
  };
  const car = (x, y, vertical, color = rand.pick(CARS)) => {
    const w = vertical ? 4 : 7;
    const h = vertical ? 7 : 4;
    objects.push({
      y: y + h,
      shadow: () => shadowRect(x + 1, y + 1, w, h, 0.6),
      draw: () => carPx(img, Math.round(x * S), Math.round(y * S), vertical, color),
    });
  };
  /** A written character from afar: strokes in an s x s box at fine (X, Y). */
  const glyph = (X, Yy, sz, c, r, put = (gx, gy, gc) => img.px(gx, gy, gc)) => {
    for (let k = 0; k < sz; k++) {
      put(X + k, Yy, c);
      if (r() < 0.5) put(X + k, Yy + sz - 1, c);
    }
    const vx = X + 1 + Math.floor(r() * Math.max(1, sz - 2));
    for (let k = 0; k < sz; k++) put(vx, Yy + k, c);
    if (r() < 0.6) for (let k = 0; k < sz - 1; k++) put(X + k, Yy + Math.floor(sz / 2), c);
  };
  /** A roof in fine pixels: tiles in rows or standing-seam metal, hips and ridge caps, the end tiles, the eave. */
  const roofPx = (x, y, w, roofH, ridge, hi, ramp, hip, kind, seed) => {
    const X0 = x * S;
    const X1 = (x + w) * S;
    const Y0 = y * S;
    const Y1 = (y + roofH) * S;
    const RY = ridge * S + 1;
    const HI = hi * S;
    for (let Yy = Y0; Yy < Y1; Yy++) {
      const north = Yy <= RY;
      const t = north ? (RY - Yy) / Math.max(1, RY - Y0) : (Yy - RY) / Math.max(1, Y1 - 1 - RY);
      const inset = HI * (1 - t);
      for (let X = X0; X < X1; X++) {
        const lx = X - X0;
        const rx = X1 - 1 - X;
        if (hip && (lx < 2 || rx < 2) && Yy < Y0 + 2) continue;
        const onHip = hip && (lx < inset || rx < inset);
        let c = hip && lx < inset ? ramp[3] : hip && rx < inset ? ramp[0] : north ? ramp[2] : ramp[1];
        if (onHip) {
          if ((Yy - Y0) % 3 === 0) c = scaleColor(c, 0.82);
          if (Math.abs(lx - inset) < 1 || Math.abs(rx - inset) < 1) c = scaleColor(ramp[3], 1.15);
        } else if (kind === 'tile') {
          // rolled tiles: light and dark down each course, rows staggered, one here and there a shade off
          const k = (X + ((Yy - Y0) >> 2) % 2) % 3;
          c = k === 0 ? scaleColor(c, 1.14) : k === 2 ? scaleColor(c, 0.8) : c;
          if ((Yy - Y0) % 4 === 0) c = scaleColor(c, 0.86);
          const tile = hashPx(X >> 2, (Yy - Y0) >> 2, seed);
          if (tile < 0.1) c = scaleColor(c, 0.9);
          else if (tile > 0.93) c = scaleColor(c, 1.1);
        } else {
          // sheet metal: standing seams, streaks of rust from the fixings
          const k = (X - X0) % 9;
          if (k === 0) c = scaleColor(c, 1.2);
          else if (k === 1) c = scaleColor(c, 0.78);
          const rust = hashPx(X >> 1, 7, seed);
          if (rust > 0.95 && hashPx(X, Yy >> 2, seed + 1) > 0.4) c = scaleColor(c, 0.84);
        }
        img.px(X, Yy, c);
      }
    }
    if (!hip)
      for (let Yy = Y0; Yy < Y1; Yy++) {
        img.px(X0, Yy, ramp[0]);
        img.px(X0 + 1, Yy, scaleColor(ramp[0], 1.3));
        img.px(X1 - 1, Yy, ramp[0]);
        img.px(X1 - 2, Yy, scaleColor(ramp[0], 0.8));
      }
    // the ridge: a pale capping course, its shadow, the end tiles
    for (let X = X0 + HI; X < X1 - HI; X++) {
      img.px(X, RY, scaleColor(ramp[3], 1.22));
      img.px(X, RY - 1, scaleColor(ramp[3], 1.05));
      img.px(X, RY + 1, scaleColor(ramp[0], 0.82));
    }
    if (kind === 'tile') for (const ox of [X0 + HI - 2, X1 - HI - 1]) for (let j = -2; j <= 1; j++) for (let i = 0; i < 3; i++) img.px(ox + i, RY + j, j < 0 ? scaleColor(ramp[3], 1.25) : ramp[0]);
    // the eave: the row of round end tiles, the shade under it
    for (let X = X0; X < X1; X++) {
      img.px(X, Y1 - 2, kind === 'tile' && X % 3 === 0 ? 0xb8bcc4 : scaleColor(ramp[3], 1.05));
      img.px(X, Y1 - 1, ramp[0]);
    }
  };
  /** The hot-spring mark at fine (X, Yy), big (11 px) or small (7 px): three wavy threads of steam over a bath. */
  const onsenMark = (X, Yy, c, big = true, put = (px, py, pc) => img.px(px, py, pc)) => {
    const n = big ? 11 : 7;
    const threads = big ? [2, 5, 8] : [1, 3, 5];
    const h = big ? 6 : 4;
    for (const t of threads)
      for (let j = 0; j < h; j++) {
        put(X + t + (j % 4 < 2 ? 0 : 1), Yy + j, c);
        if (big) put(X + t + (j % 4 < 2 ? 0 : 1) - 1, Yy + j, c);
      }
    const a = (n - 1) / 2;
    const R = a;
    const ry = big ? 3 : 2;
    for (let i = 0; i <= n * 3; i++) {
      const t = (i / (n * 3)) * Math.PI;
      put(X + Math.round(a + Math.cos(t) * R), Yy + h - 1 + Math.round(Math.sin(t) * ry), c);
    }
  };
  /** A signboard with the mark on two posts at (x, y); lit once it gets dark. */
  const signPost = (x, y, c = 0xc8302a) => {
    const X = Math.round(x * S);
    const Yy = Math.round(y * S);
    objects.push({
      y: y + 1,
      shadow: () => {
        for (let k = 0; k < 14; k++) for (let t = -2; t <= 2; t++) img.tintPx(X + 6 + k, Yy + 1 + Math.floor(k * 0.55) + t, 0.74);
      },
      draw: () => {
        for (const i of [1, 13]) for (let j = -5; j < 1; j++) img.px(X + i, Yy + j, 0x3a2a1c);
        const lit = L - y > 2500;
        for (let j = -19; j < -4; j++)
          for (let i = -1; i < 16; i++) {
            const e = i === -1 || i === 15 || j === -19 || j === -5;
            if (e) img.px(X + i, Yy + j, 0x2a1e18);
            else if (lit) glowPx(X + i, Yy + j, c, 0.96);
            else img.px(X + i, Yy + j, c);
          }
        onsenMark(X + 2, Yy - 17, 0xfff8e8, true, lit ? (px, py, pc) => glowPx(px, py, pc, 1) : (px, py, pc) => img.px(px, py, pc));
      },
    });
    if (x >= 0 && x < W && y >= 0 && y < L) reserved[Math.floor(y) * W + Math.floor(x)] = 1;
    if (L - y > 2500) pool(x + 2.5, y, 7, c, 0.14);
  };
  /** A board with the mark up on a roof's ridge at (x, y) (a bath house among the homes). */
  const roofSign = (x, y, sort, c = 0xc8302a) => {
    const X = Math.round(x * S);
    const Yy = Math.round(y * S);
    objects.push({
      y: sort + 0.05,
      draw: () => {
        for (const i of [2, 10]) for (let j = -3; j < 2; j++) img.px(X + i, Yy + j, 0x2a2a30);
        const lit = L - y > 2500;
        for (let j = -14; j < -2; j++)
          for (let i = 0; i < 13; i++) {
            const e = i === 0 || i === 12 || j === -14 || j === -3;
            if (e) img.px(X + i, Yy + j, 0x2a1e18);
            else if (lit) glowPx(X + i, Yy + j, c, 0.96);
            else img.px(X + i, Yy + j, c);
          }
        onsenMark(X + 1, Yy - 13, 0xfff8e8, true, lit ? (px, py, pc) => glowPx(px, py, pc, 1) : (px, py, pc) => img.px(px, py, pc));
      },
    });
  };
  /** A rectangle of window in a wall: frame, glass or a lit paper screen, mullion. */
  const windowPx = (X, Yy, w, h, on, seed) => {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const fr = i === 0 || j === 0 || i === w - 1 || j === h - 1;
        const mid = i === w >> 1;
        if (fr) img.px(X + i, Yy + j, 0x5a5048);
        else if (on) (mid ? img.px(X + i, Yy + j, 0x8a6a40) : glowPx(X + i, Yy + j, C.warm, 0.95));
        else {
          const curtain = hashPx(X, Yy, seed) < 0.3 && j < 2;
          img.px(X + i, Yy + j, mid ? 0x6a6058 : curtain ? 0xc8c0b0 : j === 1 && i < 2 ? 0x6a7c8c : C.glass[(i + j) & 1]);
        }
      }
  };
  /** A house's plot at (x, y, w, h): a low block wall, gravel or moss inside, a yard in front as deep as the lane allows, the gate, the gutter outside. */
  const plot = (x, y, w, h) => {
    let depth = 0;
    for (let d = 0; d < 4; d++) {
      let ok = true;
      for (let xx = x - 1; xx <= x + w; xx++) if (isRes(xx, y + h + d)) ok = false;
      if (!ok) break;
      depth = d + 1;
    }
    const X0 = (x - 1) * S;
    const X1 = (x + w + 1) * S;
    const Y0 = (y - 1) * S;
    const Y1 = (y + h + depth) * S;
    const GX = (x + Math.floor(w / 2)) * S;
    const seed = x * 37 + y * 11;
    const moss = hashPx(x, y, 777) < 0.45;
    const inner = moss ? [0x3e5238, 0x4a6040, 0x567048] : [0x7e786c, 0x8c867a, 0x9a9488];
    for (let Yr = Y0; Yr < Y1; Yr++)
      for (let X = X0; X < X1; X++) {
        const cx = Math.floor(X / S);
        const cy = Math.floor(Yr / S);
        if (isRes(cx, cy)) continue;
        const e = Math.min(X - X0, X1 - 1 - X, Yr - Y0, Y1 - 1 - Yr);
        if (e < 2) {
          if (Yr >= Y1 - 2 && Math.abs(X - GX) < 5) img.px(X, Yr, 0x8a867a);
          else img.px(X, Yr, e === 0 ? 0xb8b4a8 : (X + Yr) % 8 === 0 ? 0x6e6a60 : 0x8e8a7e);
        } else {
          const t = hashPx(X >> 1, Yr >> 1, seed);
          img.px(X, Yr, rampColor(inner, t, X, Yr));
        }
      }
    if (depth >= 2) {
      // stepping stones from the gate to the door, a shrub each side, a bicycle's parking mark of oil
      for (let k = 0; k < depth * S - 2; k += 4) img.discPx(GX + (k % 8 ? 1 : -1), (y + h) * S + 1 + k, 1.4, 0xb0ac9e);
      for (const sx of [X0 + 6, X1 - 7]) {
        img.discPx(sx, Y1 - 6, 2.8, 0x2a5a2a);
        img.discPx(sx - 1, Y1 - 7, 1.6, 0x4e8a3e);
      }
    }
    // gate posts, the gutter with its steel covers
    for (const sx of [GX - 6, GX + 5]) img.rectPx(sx, Y1 - 3, 2, 3, 0x5a564e);
    for (let X = X0; X < X1; X++) {
      if (isRes(Math.floor(X / S), Math.floor((Y1 + 1) / S))) continue;
      img.px(X, Y1, 0x34343a);
      img.px(X, Y1 + 1, X % 7 === 0 ? 0x6a6a70 : 0x48484e);
    }
    reserveFoot(x - 1, y - 1, w + 2, h + 1 + depth, 1);
  };
  /** Japanese house in 3/4 view: hip or gable roof of tiles or metal, plaster or wooden front with windows, life round it. */
  const house = (x, y, w, roofH, faceH, opt = {}) => {
    if (opt.plot) plot(x, y, w, roofH + faceH);
    const ramp = opt.ramp ?? rand.pick(opt.roofs ?? [ROOF.kawara, ROOF.kawara, ROOF.dark, ROOF.brown, ROOF.blue, ROOF.red]);
    const hip = opt.hip ?? rand() < 0.65;
    const wall = opt.wall ?? rand.pick(C.walls);
    const wood = opt.wood ?? rand() < 0.25;
    const ridge = y + Math.round(roofH * 0.42);
    const hi = hip ? Math.min(Math.round(roofH * 0.45), Math.floor(w / 3)) : 0;
    const lit = litChance(U(y));
    const wins = [];
    for (let xx = x + 2; xx < x + w - 3; xx += 4) wins.push([xx, rand() < lit]);
    const seed = Math.floor(rand() * 1e6);
    const metal = (ramp === ROOF.blue || ramp === ROOF.red || ramp === ROOF.green) && seed % 5 < 3;
    objects.push({
      y: y + roofH + faceH,
      shadow: () => shadowRect(x + 3, y + 3, w, roofH + faceH, 0.55),
      draw: () => {
        const er = rng(seed);
        roofPx(x, y, w, roofH, ridge, hi, ramp, hip, metal ? 'metal' : 'tile', seed & 1023);
        const fy = y + roofH;
        const FX0 = (x + 1) * S;
        const FX1 = (x + w - 1) * S;
        const FY0 = fy * S;
        const FH = faceH * S;
        for (let j = 0; j < FH; j++)
          for (let X = FX0; X < FX1; X++) {
            let c;
            if (j < 2) c = j === 0 ? 0x1c1612 : 0x2e2620; // the shade under the eaves
            else if (j >= FH - 2) c = j === FH - 1 ? 0x4a4640 : 0x6a665c; // the footing
            else if (wood) {
              const b = Math.floor((X - FX0) / 3);
              const t = hashPx(b, 3, seed);
              c = (X - FX0) % 3 === 0 ? C.wood[0] : t < 0.33 ? C.wood[1] : t < 0.66 ? scaleColor(C.wood[1], 1.1) : scaleColor(C.wood[1], 0.92);
            } else {
              c = (X - FX0) % 18 === 0 ? C.wood[1] : wall;
              if (hashPx(X, FY0 + j, seed) < 0.08) c = scaleColor(c, 0.95);
            }
            img.px(X, FY0 + j, c);
          }
        if (faceH >= 3) for (const [xx, on] of wins) if (xx * S + 6 < FX1) windowPx(xx * S, FY0 + 3, 6, Math.min(6, FH - 5), on, seed);
        // an air conditioner's outdoor unit on the wall, a downpipe, pots at the door
        if (er() < 0.3) {
          const ax = FX1 - 8;
          for (let j = 0; j < 5; j++) for (let i = 0; i < 6; i++) img.px(ax + i, FY0 + FH - 7 + j, j === 0 ? 0xdadee2 : Math.hypot(i - 2.5, j - 2.5) < 2 ? 0x4a4e54 : 0xb8bcc0);
        }
        if (er() < 0.4) for (let j = 2; j < FH - 1; j++) img.px(FX0 + 1, FY0 + j, 0x8a8e94);
        if (er() < 0.35) {
          const px0 = FX0 + 4 + Math.floor(er() * Math.max(1, FX1 - FX0 - 12));
          for (let k = 0; k < 3; k++) {
            const pc = er() < 0.5 ? 0x3a6a30 : 0x4e8a3e;
            img.px(px0 + k * 2, FY0 + FH - 2, 0xa85a3a);
            img.px(px0 + k * 2, FY0 + FH - 3, pc);
            img.px(px0 + k * 2 + 1, FY0 + FH - 3, scaleColor(pc, 0.85));
          }
        }
        // things up on the roof: a solar water heater with its tank, a television aerial, washing on a pole
        const slopeY0 = ridge * S + 4;
        const slopeH = fy * S - slopeY0 - 3;
        const inner = (w - 2 * hi) * S;
        const v = er();
        if (v < 0.13 && slopeH > 8 && inner > 26) {
          const px0 = (x + hi) * S + 3 + Math.floor(er() * (inner - 24));
          for (let j = 0; j < slopeH - 2; j++)
            for (let i = 0; i < 18; i++) {
              const panel = i % 6 === 5 ? 0x8a8e94 : j === 0 ? 0x5a6a8a : j % 3 === 0 ? 0x2a3a5a : 0x22304e;
              img.px(px0 + i, slopeY0 + 1 + j, panel);
            }
          for (let i = -1; i < 19; i++) {
            img.px(px0 + i, slopeY0 - 1, 0xd8dce0);
            img.px(px0 + i, slopeY0, 0xa0a4aa);
          }
        } else if (v < 0.32) {
          const ax = (x + hi) * S + Math.floor(er() * Math.max(1, inner - 10)) + 2;
          const ay = ridge * S;
          for (let j = -7; j < 1; j++) img.px(ax, ay + j, 0x2a2a30);
          for (const [k, hw2] of [[-7, 4], [-5, 3], [-3, 2]]) for (let i = -hw2; i <= hw2; i++) img.px(ax + i, ay + k, 0x3a3a40);
        } else if (v < 0.44 && !wood && w > 12) {
          const lx0 = FX0 + 3;
          const lx1 = Math.min(FX1 - 3, lx0 + 30);
          for (let X = lx0; X < lx1; X++) img.px(X, FY0 + 2, 0x8a8e94);
          for (let X = lx0 + 1; X < lx1 - 3; X += 4 + Math.floor(er() * 3)) {
            const lc = er.pick([0xf0ece4, 0xe8e0d0, 0x4a6aa0, 0xd8a0a8, 0xf0ece4, 0xc8d8a0]);
            for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) img.px(X + i, FY0 + 3 + j, j === 4 && i === 1 ? scaleColor(lc, 0.85) : lc);
          }
        }
        if (opt.noren) {
          // the noren over the door: its cloth split in three, a pale crest, a lamp to one side
          const nx = (x + Math.floor(w / 2) - 3) * S;
          const NH = Math.max(4, FH - 5);
          for (let j = 0; j < NH + 2; j++) for (let i = -2; i < 20; i++) img.px(nx + i, FY0 + 2 + j, 0x1e1814);
          for (let j = 0; j < NH; j++)
            for (let i = 0; i < 18; i++) {
              if (j > 3 && i % 6 === 5) continue;
              img.px(nx + i, FY0 + 2 + j, j === 0 ? scaleColor(opt.noren, 1.3) : i % 6 === 2 && j === 2 ? 0xf0e8d8 : opt.noren);
            }
          if (w > 16) {
            const BX = (x + 2) * S;
            for (let j = 0; j < 9; j++) for (let i = 0; i < 9; i++) img.px(BX + i, FY0 + 2 + j, i === 0 || j === 0 || i === 8 || j === 8 ? 0x2a1e18 : 0xc8302a);
            onsenMark(BX + 1, FY0 + 3, 0xfff8e8, false);
          }
          glowPx(nx + 21, FY0 + 3, 0xff7a4a, 0.9);
          glowPx(nx + 21, FY0 + 4, 0xffb060, 0.9);
          glowPx(nx - 4, FY0 + 3, 0xff7a4a, 0.9);
          glowPx(nx - 4, FY0 + 4, 0xffb060, 0.9);
          if (dark(U(y)) > 0.1) pool(x + w / 2, fy + faceH + 1, 9, 0xff9a50, 0.22);
        }
      },
    });
    reserveFoot(x, y, w, roofH + faceH);
  };
  /** A rooftop fitting of a concrete building, at fine (IX, IY). */
  const rooftop = (kind, IX, IY, roof, wall) => {
    if (kind === 'ac') {
      for (let k = 0; k < 3; k++) {
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
      img.rectPx(IX + 6, IY + 5, 1, 2, 0x5a5e64);
    } else if (kind === 'hut') {
      for (let j = 0; j < 15; j++)
        for (let i = 0; i < 18; i++) {
          const top = j < 9;
          let c = top ? (i === 0 || j === 0 ? scaleColor(roof, 1.14) : i === 17 || j === 8 ? scaleColor(roof, 0.76) : scaleColor(roof, 0.94)) : j === 9 ? scaleColor(wall, 0.6) : scaleColor(wall, 0.9);
          if (!top && i >= 7 && i <= 10 && j > 9) c = j === 10 ? 0x4a4a50 : 0x2a2a30;
          img.px(IX + i, IY + j, c);
        }
    } else if (kind === 'solar') {
      for (let j = 0; j < 12; j++)
        for (let i = 0; i < 24; i++) {
          const gridline = i % 8 === 7 || j % 6 === 5;
          img.px(IX + i, IY + j, gridline ? 0x7a8aa0 : j % 6 === 0 ? 0x3a4e80 : 0x24346a);
        }
      for (let i = 0; i < 24; i++) img.px(IX + i, IY + 12, 0x101018, 0.45);
    } else if (kind === 'garden') {
      fill(IX / S, IY / S, 8, 5, C.grass, 71);
      for (let i = 0; i < 24; i++) {
        img.px(IX + i, IY, 0x8a867e);
        img.px(IX + i, IY + 14, 0x6a665e);
      }
      img.discPx(IX + 7, IY + 7, 3.4, 0x2a5a2a);
      img.discPx(IX + 6, IY + 6, 2, 0x4a8a3e);
      img.discPx(IX + 17, IY + 9, 2.4, 0x2a5a2a);
    } else if (kind === 'bath') {
      // a ryokan's rooftop open-air bath: a stone rim, milky water, somebody in it, a bamboo screen behind
      for (let j = 0; j < 15; j++)
        for (let i = 0; i < 24; i++) {
          const rim = i < 2 || j < 2 || i > 21 || j > 12;
          let c = rim ? (hashPx(i >> 1, j >> 1, IX + IY) < 0.5 ? C.stone[1] : C.stone[2]) : rampColor(C.milk, 0.4 + ((i + j) % 7) * 0.05, IX + i, IY + j);
          if (!rim && hashPx(IX + i, IY + j, 5) > 0.96) c = 0xffffff;
          img.px(IX + i, IY + j, c);
        }
      for (let i = 0; i < 24; i++) for (let j = -3; j < 0; j++) img.px(IX + i, IY + j, i % 2 ? 0x8a7a4a : 0xa89a5a);
      img.discPx(IX + 9, IY + 7, 1.6, 0xe8c8a8);
      img.px(IX + 9, IY + 6, 0x2a2024);
      img.rectPx(IX + 8, IY + 5, 3, 1, 0xf4f0e6);
      img.discPx(IX + 15, IY + 9, 1.6, 0xe8c8a8);
      img.px(IX + 15, IY + 8, 0x1a1418);
    }
  };
  /** Concrete building: a roof of membrane panels with a parapet and fittings, floors of windows and balconies, a door. */
  const block = (x, y, w, h, faceH, opt = {}) => {
    const roof = opt.roof ?? rand.pick(C.flat);
    const wall = opt.wall ?? rand.pick(C.walls);
    const off = 3 + Math.round(faceH * 0.45);
    const lit = litChance(U(y));
    const items = [];
    const n = Math.max(1, Math.floor((w * h) / 110));
    for (let k = 0; k < n; k++) items.push([rand.pick(opt.items ?? ['ac', 'ac', 'tank', 'hut', 'solar']), x + 2 + Math.floor(rand() * Math.max(1, w - 10)), y + 2 + Math.floor(rand() * Math.max(1, h - 7))]);
    const seed = Math.floor(rand() * 1e6);
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
            if (e < 2) c = scaleColor(roof, e === 0 ? 1.25 : 1.12);
            else if (e2 < 2) c = scaleColor(roof, e2 === 0 ? 0.62 : 0.78);
            else if (e === 2) c = scaleColor(roof, 0.8);
            else {
              c = roof;
              if ((X - X0) % 15 === 0 || (Yy - Y0) % 12 === 0) c = scaleColor(roof, 1.06);
              const st = hashPx(X >> 3, Yy >> 3, seed);
              if (st > 0.9) c = scaleColor(c, 0.94);
              const g = hashPx(X, Yy, 8);
              if (g < 0.06) c = scaleColor(c, 0.9);
              else if (g > 0.96) c = scaleColor(c, 1.08);
            }
            img.px(X, Yy, c);
          }
        const fy = y + h;
        for (const [kind, ix, iy] of items) {
          if (opt.bigMark && ix + 9 > x + Math.floor(w / 2) - 9 && ix < x + Math.floor(w / 2) + 9) continue;
          rooftop(kind, ix * S, iy * S, roof, wall);
        }
        const FY0 = fy * S;
        const FH = faceH * S;
        const FLOOR = 9;
        for (let j = 0; j < FH; j++) {
          const row = j % FLOOR;
          const fl = Math.floor(j / FLOOR);
          for (let X = X0; X < X1; X++) {
            let c = X < X0 + 2 ? scaleColor(wall, 1.08) : X >= X1 - 2 ? scaleColor(wall, 0.8) : wall;
            if (j < 2) c = scaleColor(wall, 0.58);
            else if (row === 0) c = scaleColor(wall, 0.82);
            else if (X >= X0 + 2 && X < X1 - 2) {
              const bay = (X - X0 - 2) % 9;
              const bayI = Math.floor((X - X0 - 2) / 9);
              if (row >= 2 && row <= 6 && bay >= 1 && bay <= 7) {
                const on = hashPx(bayI, fl, seed) < lit;
                if (bay === 4) c = 0x6a6e74;
                else if (on) {
                  glowPx(X, FY0 + j, C.warm, 0.95);
                  continue;
                } else {
                  const shade = hashPx(bayI, fl, seed + 1);
                  c = shade < 0.2 && row < 4 ? 0xc8c4b8 : row === 2 && bay < 4 ? 0x6a7c8c : C.glass[(X >> 1) & 1];
                }
              } else if (opt.balcony && row >= 7) c = X % 3 === 0 ? 0x6a6e74 : scaleColor(wall, 0.9);
            }
            img.px(X, FY0 + j, c);
          }
        }
        if (opt.sign) {
          // a vertical sign on the corner, lit, with big white letters
          const SX = (x + w - 4) * S;
          const SH = Math.min(faceH - 3, 16) * S;
          const sr = rng(seed + 3);
          for (let j = 0; j < SH; j++) for (let i = 0; i < 9; i++) img.px(SX + i, FY0 + 6 + j, i === 0 || i === 8 || j === 0 || j === SH - 1 ? scaleColor(opt.sign, 0.7) : opt.sign);
          onsenMark(SX + 1, FY0 + 8, 0xf8f4ec, false);
          for (let k = 9; k + 7 < SH; k += 8) glyph(SX + 2, FY0 + 8 + k, 5, 0xf8f4ec, sr);
        }
        if (opt.bigMark) {
          // the great mark on the roof: a red hoarding on a steel frame
          const BX = (x + Math.floor(w / 2) - 8) * S;
          const BY = (y + 1) * S;
          const lit2 = L - y > 2500;
          for (let j = 0; j < 8; j++) for (let i = 0; i < 48; i++) if ((i + j) % 6 === 0 || j === 7) img.px(BX + i, BY + 30 + j, 0x4a4e54);
          for (let j = 0; j < 30; j++)
            for (let i = 0; i < 48; i++) {
              const e = i < 2 || i > 45 || j < 2 || j > 27;
              if (e) img.px(BX + i, BY + j, 0x8a1e18);
              else if (lit2) glowPx(BX + i, BY + j, 0xd8302a, 0.96);
              else img.px(BX + i, BY + j, 0xd8302a);
            }
          // (the mark itself, large)
          const put = lit2 ? (px, py, pc) => glowPx(px, py, pc, 1) : (px, py, pc) => img.px(px, py, pc);
          for (const t of [14, 23, 32])
            for (let j = 0; j < 15; j++) for (let w2 = 0; w2 < 3; w2++) put(BX + t + w2 + Math.round(Math.sin(j * 0.6) * 1.6), BY + 4 + j, 0xfff8e8);
          for (let i = 0; i <= 80; i++) {
            const a = (i / 80) * Math.PI;
            for (let w2 = 0; w2 < 3; w2++) put(BX + 24 + Math.round(Math.cos(a) * (17 - w2 * 0.4)), BY + 18 + Math.round(Math.sin(a) * (7 - w2 * 0.4)), 0xfff8e8);
          }
        }
        if (opt.door !== false) {
          // the glass doors under a canopy
          const dx = (x + Math.floor(w / 2) - 3) * S;
          const dy = FY0 + FH - 7;
          for (let j = 0; j < 7; j++) for (let i = 0; i < 18; i++) img.px(dx + i, dy + j, i % 6 === 0 ? 0x8a8e94 : j < 2 ? 0x4a5a6a : 0x2a3440);
          for (let i = -3; i < 21; i++) {
            img.px(dx + i, dy - 3, scaleColor(wall, 0.7));
            img.px(dx + i, dy - 2, scaleColor(wall, 0.92));
            img.px(dx + i, dy - 1, 0x2a2622);
          }
          if (lit > 0.15) {
            for (let i = 1; i < 18; i++) if (i % 6) glowPx(dx + i, dy + 3, C.warm, 0.8);
            pool(x + w / 2, fy + faceH + 1, 8, C.warm, 0.2);
          }
        }
      },
    });
    reserveFoot(x, y, w, h + faceH);
  };
  const tree = (kind, x, y, r) => {
    const seed = Math.floor(rand() * 1e9);
    const cx = Math.round(x);
    const cy = Math.round(y);
    const px = () => (kind === 'palm' ? palmPixels(cx * S + 1, cy * S + 1, r * S, rng(seed)) : crownPixels(kind, cx * S + 1, cy * S + 1, r * S, rng(seed), seed & 1023));
    const off = Math.round((2 + r * 0.3) * S);
    objects.push({
      y: cy + r * 0.6,
      shadow: () => {
        for (const p of px()) img.tintPx(p.x + off, p.y + off + S, 0.55);
      },
      draw: () => {
        const list = px();
        const inCrown = new Set(list.map((p) => p.x * 65536 + p.y));
        for (const p of list) {
          const rim = !inCrown.has(p.x * 65536 + p.y + 1) || !inCrown.has((p.x + 1) * 65536 + p.y);
          img.px(p.x, p.y, rim ? scaleColor(p.c, 0.78) : p.c);
          if (p.x >= 0 && p.x < W * S && p.y >= 0 && p.y < L * S) crownMask[p.y * W * S + p.x] = 1 + (seed % 15);
        }
        if (kind === 'sakura') for (const p of list) if (((p.x * 7 + p.y * 13 + seed) & 31) === 0) img.px(p.x, p.y, (p.x + p.y) & 1 ? 0xffe8f0 : 0xfff6fa);
        for (const p of list) {
          if (p.x < 0 || p.x >= W * S || p.y < 0 || p.y >= L * S) continue;
          const q = img.rgbaPx(p.x, p.y);
          if (q) crownHash[p.y * W * S + p.x] = (q[0] ^ (q[1] << 1) ^ (q[2] << 2)) & 255;
        }
      },
    });
  };
  /** A boulder at fine (CX, CY), lit from the top left, sitting in its own shadow. */
  const rockPx = (CX, CY, r, ramp = C.rock, seed = 0) => {
    for (let Yy = Math.floor(CY - r); Yy <= CY + r + 2; Yy++)
      for (let X = Math.floor(CX - r); X <= CX + r + 2; X++) {
        const dx = (X + 0.5 - CX - 1.5) / r;
        const dy = (Yy + 0.5 - CY - 1.5) / r;
        if (dx * dx + dy * dy <= 1) img.tintPx(X, Yy, 0.72);
      }
    for (let Yy = Math.floor(CY - r); Yy <= CY + r; Yy++)
      for (let X = Math.floor(CX - r); X <= CX + r; X++) {
        const dx = (X + 0.5 - CX) / r;
        const dy = (Yy + 0.5 - CY) / r;
        const lump = (hashPx(X >> 1, Yy >> 1, seed) - 0.5) * 0.35;
        const d = dx * dx + dy * dy + lump * 0.5;
        if (d > 1) continue;
        const v = clamp01(0.5 - dx * 0.5 - dy * 0.5 + lump);
        img.px(X, Yy, rampColor(ramp, v, X, Yy));
      }
  };
  /** A stone lantern at (x, y): the base, shaft, firebox with its lit window, the cap. */
  const stoneLantern = (x, y, lit = true) => {
    objects.push({
      y: y + 3,
      draw: () => {
        const X = Math.round(x * S);
        const Yy = Math.round(y * S);
        for (let i = 0; i < 6; i++) img.px(X - 1 + i, Yy + 7, 0x101418, 0.35);
        for (let i = -1; i < 4; i++) for (let j = 5; j < 7; j++) img.px(X + i, Yy + j, j === 5 ? C.stone[3] : C.stone[1]);
        for (let j = 1; j < 5; j++) img.px(X + 1, Yy + j, C.stone[2]);
        for (let j = -2; j < 1; j++) for (let i = -1; i < 4; i++) img.px(X + i, Yy + j, i === 1 && j === -1 ? 0x2a2622 : i === 3 ? C.stone[1] : C.stone[2]);
        for (let i = -2; i < 5; i++) img.px(X + i, Yy - 3, i < 1 ? C.stone[3] : C.stone[2]);
        for (let i = -1; i < 4; i++) img.px(X + i, Yy - 4, C.stone[3]);
        img.px(X + 1, Yy - 5, C.stone[3]);
        if (lit) glowPx(X + 1, Yy - 1, 0xffd080, 0.95);
      },
    });
  };
  /** A pocket garden between houses: grass or moss, a tree or two, stepping stones, maybe a stone lantern or a tiny pond. */
  const garden = (x, y, w, h) => {
    fill(x, y, w, h, C.grass, 72 + x, 4);
    const gr = rng(x * 37 + y);
    // a low wall of the plot
    img.fine(x, y, w, h, (X, Yr) => {
      const e = Math.min(X - x * S, Yr - y * S, (x + w) * S - 1 - X, (y + h) * S - 1 - Yr);
      return e < 1 ? C.stone[2] : e < 2 ? C.stone[0] : null;
    });
    if (w > 12 && h > 10 && gr() < 0.4) {
      const px0 = (x + w * 0.65) * S;
      const py0 = (y + h * 0.65) * S;
      for (let Yr = py0 - 11; Yr < py0 + 11; Yr++)
        for (let X = px0 - 15; X < px0 + 15; X++) {
          const e = ((X - px0) / 12) ** 2 + ((Yr - py0) / 8) ** 2;
          if (e < 1) img.px(X, Yr, e > 0.72 ? 0x7a7468 : rampColor([0x2a4a4a, 0x3a5e5a, 0x4e7470], 1 - e, X, Yr));
        }
    }
    for (let k = 0; k < 4; k++) {
      const X = Math.round((x + 2 + (k + gr() * 0.4) * ((w - 4) / 4)) * S);
      const Yr = Math.round((y + h - 3 - gr() * 2) * S);
      img.discPx(X, Yr, 2.1, C.stone[2]);
      img.px(X - 1, Yr - 1, C.stone[3]);
    }
    tree(rand.pick(['broadleaf', 'pine', 'broadleaf', 'sakura']), x + w / 2, y + h / 2, Math.min(w, h) * 0.38 + 1);
    if (w > 14 && gr() < 0.5) stoneLantern(x + 2.5, y + h - 5, dark(U(y)) > 0.05);
    reserveRect(x, y, w, h);
  };
  /** A short gravel walk over x0..x1, rows u0..u1: a way from a path to a building or gate beside it. */
  const walk = (x0, x1, u0, u1) => {
    const across = x1 - x0 >= u1 - u0 + 1; // (edged along its length only, so it runs into the path it joins)
    const YT = Y(u1) * S;
    const YB = (Y(u0) + 1) * S;
    const X0 = Math.max(0, Math.floor(x0)) * S;
    const X1 = Math.min(W, x1) * S;
    for (let Yr = YT; Yr < YB; Yr++)
      for (let X = X0; X < X1; X++) {
        const e = across ? Math.min(Yr - YT, YB - 1 - Yr) : Math.min(X - X0, X1 - 1 - X);
        const g = hashPx(X, Yr, 191);
        img.px(X, Yr, e < 2 ? (g < 0.5 ? C.gravel[0] : scaleColor(C.gravel[0], 0.86)) : g < 0.1 ? scaleColor(C.gravel[0], 0.82) : g > 0.92 ? 0xd0c4ae : rampColor(C.gravel, hashPx(X >> 1, Yr >> 1, 192), X, Yr));
      }
    reserveRect(x0 - 1, Y(u1 + 1), x1 - x0 + 2, u1 - u0 + 3);
  };
  const parking = (x, y, w, h) => {
    fill(x, y, w, h, C.asphalt, 73, 4);
    for (let xx = x + 1; xx < x + w - 4; xx += 6) {
      img.rectPx(xx * S, (y + 1) * S, 2, 8 * S, 0xd0d0c8);
      img.rectPx(xx * S, (y + 9) * S - 2, 2 * S, 2, 0xd0d0c8);
      if (rand() < 0.75) car(xx + 1, y + 2, true);
    }
    reserveRect(x, y, w, h);
  };
  /**
   * Shaded clumps of steam (a cloud lit from the top left with a cauliflower outline), drawn into the
   * strip or into a frame, on fine pixels. Clumps in logical units.
   */
  const steamBall = (target, clumps, seed, base, a = 1) => {
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    for (const c of clumps) {
      x0 = Math.min(x0, c.x - c.r);
      x1 = Math.max(x1, c.x + c.r);
      y0 = Math.min(y0, c.y - c.r);
      y1 = Math.max(y1, c.y + c.r);
    }
    for (let Yy = Math.floor(y0 * S); Yy <= y1 * S; Yy++)
      for (let X = Math.floor(x0 * S); X <= x1 * S; X++) {
        const xx = (X + 0.5) / S;
        const yy = (Yy + 0.5) / S;
        let best = null;
        for (const c of clumps) {
          const dx = xx - c.x;
          const dy = yy - c.y;
          const d2 = (dx * dx + dy * dy) / (c.r * c.r);
          if (d2 > 1) continue;
          const h = Math.sqrt(1 - d2) * c.r + (c.y < base ? (base - c.y) * 0.05 : 0);
          if (!best || h > best.h) best = { h, d2, nx: dx / c.r, ny: dy / c.r, nz: Math.sqrt(1 - d2) };
        }
        if (!best) continue;
        const nse = fbm(xx, yy, { seed: 140 + seed, scale: 3, octaves: 2 });
        const v = (best.nx * LIGHT[0] + best.ny * LIGHT[1] + best.nz * LIGHT[2]) * 0.6 + 0.55 + (nse - 0.5) * 0.3;
        target.px(X, Yy, rampColor(C.steam, v, X, Yy), a * (1 - best.d2) ** 1.3);
      }
  };
  // live puffs, shared by every plume: three variants per radius, drawn ungraded (the game tints them)
  const puffs = new Map();
  const puffFrames = (r) => {
    if (!puffs.has(r)) puffs.set(r, [0, 1, 2].map((v) => kit.frame(puff(r * S, r * 31 + v * 7 + 1, C.steam))));
    return puffs.get(r);
  };
  /** The head of a hot-spring well: a concrete box in the ground, its steel pipe with a valve, stained with minerals. */
  const wellhead = (x, y) => {
    const X = Math.round(x * S);
    const Yy = Math.round(y * S);
    const hr = rng(X * 7 + Yy);
    objects.push({
      y: y + 1,
      draw: () => {
        for (let j = 0; j < 8; j++) for (let i = 0; i < 13; i++) img.tintPx(X - 6 + i + 2, Yy - 2 + j + 2, 0.7);
        for (let j = 0; j < 8; j++)
          for (let i = 0; i < 13; i++) {
            const e = i === 0 || j === 0;
            const e2 = i === 12 || j === 7;
            let c = e ? 0xb4b0a4 : e2 ? 0x5e5a52 : rampColor(C.stone, 0.4 + hashPx(X + i, Yy + j, 3) * 0.4, X + i, Yy + j);
            if (!e && !e2 && hashPx(i, j, X) < 0.25) c = 0xd8ccb0; // (the mineral crust)
            img.px(X - 6 + i, Yy - 2 + j, c);
          }
        const pipe = hr() < 0.6 ? 0x8a4a2e : 0x4a6a8a;
        for (let j = -5; j < 3; j++) {
          img.px(X - 1, Yy + j, scaleColor(pipe, 1.3));
          img.px(X, Yy + j, pipe);
          img.px(X + 1, Yy + j, scaleColor(pipe, 0.7));
        }
        for (let i = -3; i <= 3; i++) img.px(X + i, Yy - 6, i < 0 ? 0x9a9ea4 : 0x6a6e74);
        img.px(X + 4, Yy, 0xc83a2a);
        img.px(X + 3, Yy, 0x8a8e94);
        img.px(X + 5, Yy, 0xc83a2a);
        img.px(X + 4, Yy - 1, 0xe85a4a);
        img.px(X + 4, Yy + 1, 0x8a2a1a);
      },
    });
  };
  /**
   * A plume of hot-spring steam rising from (x, y). Painted: the damp patch it rises from and a low
   * haze; the column itself is live, puffs swelling as they rise and bending with the breeze.
   */
  const plume = (x, y, size, opt = {}) => {
    const r = rng(Math.floor(rand() * 1e9));
    const r0 = 2 + size * 1.5;
    const haze = [{ x, y: y - r0 * 0.3, r: r0 }, { x: x - r0 * 0.6, y: y + 0.5, r: r0 * 0.6 }, { x: x + r0 * 0.6, y: y + 0.5, r: r0 * 0.6 }];
    const seed = Math.floor(r() * 1000);
    objects.push({
      y: y + (opt.front ? 30 : 0),
      draw: () => {
        const R = (r0 + 3) * S;
        for (let Yy = Math.floor((y - r0 - 3) * S); Yy <= (y + r0 + 3) * S; Yy++)
          for (let X = Math.floor((x - r0 - 3) * S); X <= (x + r0 + 3) * S; X++) {
            const d = Math.hypot(X + 0.5 - x * S, (Yy + 0.5 - y * S) * 1.4) / R;
            if (d < 1) img.tintPx(X, Yy, 1 - (1 - d) * 0.22);
          }
        steamBall(img, haze, seed, y, 0.34);
      },
    });
    const radii = [];
    const top = Math.round(4.5 + size * 5.5);
    for (let rr = Math.round(r0); rr <= top; rr += Math.max(1, Math.round((top - r0) / 6))) radii.push(rr);
    const height = 10 + size * 22;
    kit.emit(Math.round(x), Math.round(U(y)) + 1, radii.map(puffFrames), {
      rate: 2.6 + size * 1.3,
      life: [3, 4.2],
      vy: height * 0.48,
      sx: Math.max(1, size),
      wf: 0.6 * (opt.wind ?? 1) + size * 0.2,
      a: 0.86,
      burst: 0.05,
      d: 1.1,
      tint: 1,
    });
  };
  // bubbles rising in the hot pools (frames in each pool's colours, ungraded: the game tints them)
  const bubbleSets = new Map();
  const bubbleFrames = (ramp) => {
    const key = ramp.join();
    if (bubbleSets.has(key)) return bubbleSets.get(key);
    const names = [];
    const ring = (out, c, r, col, every = 1, a = 1) => {
      const n = Math.ceil(r * S * 7);
      for (let i = 0; i < n; i++) {
        if (every > 1 && (i * every) % n < n / 2) continue;
        const t = (i / n) * Math.PI * 2;
        out.set(Math.round(c + Math.cos(t) * r * S), Math.round(c + Math.sin(t) * r * S * 0.8), col, a);
      }
    };
    if (ramp === C.mud) {
      // Oniishibozu: a grey dome swells like a shaven head, bursts, and its ring spreads out
      const N = 13 * S;
      const mid = (N - 1) / 2;
      for (const r of [1.4, 2.4, 3.4, 4.2, 4.6]) {
        const out = new Raster(N, N);
        for (let y = 0; y < N; y++)
          for (let x = 0; x < N; x++) {
            const dx = (x - mid) / (r * S);
            const dy = (y - mid) / (r * S * 0.85);
            const d = dx * dx + dy * dy;
            if (d > 1) continue;
            const l = dx + dy;
            let c = l < -0.75 ? 0xe4e0d8 : l < -0.2 ? ramp[3] : l < 0.5 ? ramp[2] : l < 0.95 ? ramp[1] : ramp[0];
            if (d > 0.84) c = scaleColor(c, 0.8);
            out.set(x, y, c);
          }
        names.push(kit.frame(out));
      }
      for (const [r, every] of [[4.6, 1], [5.6, 2]]) {
        const out = new Raster(N, N);
        ring(out, mid, r, ramp[3], every);
        ring(out, mid, r - 0.35, ramp[0], every, 0.7);
        if (every === 1) {
          for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (Math.hypot(x - mid, y - mid) < 1.5 * S) out.set(x, y, ramp[0]);
        }
        names.push(kit.frame(out));
      }
    } else {
      // a bubble breaking the surface and its ring spreading
      const N = 7 * S;
      const mid = (N - 1) / 2;
      for (const [r, every, k] of [[0, 1, 3], [1.2, 1, 3], [2.2, 1, 3], [3, 2, 2]]) {
        const out = new Raster(N, N);
        if (!r) {
          out.set(mid, mid, 0xffffff);
          out.set(mid + 1, mid, ramp[3]);
          out.set(mid, mid + 1, ramp[3]);
          out.set(mid - 1, mid, ramp[3]);
          out.set(mid, mid - 1, ramp[3]);
        } else ring(out, mid, r, ramp[k], every);
        names.push(kit.frame(out));
      }
    }
    bubbleSets.set(key, names);
    return names;
  };
  const poolsMade = [];
  /** A hot-spring pool: an irregular pond deepening to its middle, a crust of salts, wet rock and boulders round it. It bubbles (live). */
  const hotPool = (cx, cu, rx, ry, ramp, seed, rim = C.rock) => {
    const mud = ramp === C.mud;
    poolsMade.push({ cx, cu, rx, ry, ramp });
    kit.spot([[Math.round(cx - rx * 0.6), Math.round(cu + ry * 0.55), Math.round(rx * 1.2), Math.round(ry * 1.1)]], bubbleFrames(ramp), {
      rate: (rx * ry) / (mud ? 110 : 130),
      fps: mud ? 5 : 8,
      tint: 1,
    });
    const cy = Y(cu);
    const eAt = (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + (fbm(x, y, { seed, scale: 9 }) - 0.5) * 0.35;
    const crust = mud ? 0x9a9488 : ramp === C.blood ? 0xc87a50 : ramp === C.milk ? 0xe8e4d4 : ramp === C.jade ? 0xc8d4b0 : 0xd8d4c0;
    const minR = Math.min(rx, ry);
    const crustE = 1 + 3 / minR;
    const rimE = Math.min(1.34, 1 + 9 / minR);
    const pad = Math.ceil((Math.sqrt(rimE + 0.18) - 1) * Math.max(rx, ry)) + 3;
    img.fine(cx - rx - pad, cy - ry - pad, 2 * rx + 2 * pad, 2 * ry + 2 * pad, (X, Yr, x, y) => {
      if (x < 0 || x >= W || padMask[Math.floor(y) * W + Math.floor(x)]) return null;
      const e = eAt(x, y);
      if (e >= rimE) return null;
      const g = hashPx(X, Yr, seed);
      if (e >= 1) {
        if (e < crustE) return g < 0.2 ? scaleColor(crust, 0.86) : crust; // salts crusting the edge
        const t = 0.2 + hashPx(X >> 1, Yr >> 1, seed + 2) * 0.8;
        return (e - crustE) / (rimE - crustE) > 0.7 && hashPx(X >> 1, Yr >> 1, seed + 3) < 0.5 ? null : rampColor(rim, t, X, Yr);
      }
      const fb = fbm(x, y, { seed: seed + 1, scale: 4 });
      let c = rampColor(ramp, 0.2 + (1 - e) * 0.5 * (mud ? 0.6 : 1) + fb * 0.3, X, Yr);
      // the bank's shadow on the water, a paler shallow, slow rings in the water or the mud
      if (eAt(x + 1.5, y + 1.5) >= 1) c = scaleColor(c, 0.72);
      else if (e > 0.82) c = scaleColor(c, 1.1);
      const rip = Math.sin((Math.sqrt(Math.max(0, e)) + fb * 0.18) * (mud ? 26 : 34));
      if (rip > 0.93) c = scaleColor(c, mud ? 1.1 : 1.14);
      else if (rip < -0.95) c = scaleColor(c, 0.92);
      if (!mud && g > 0.9992) c = 0xffffff;
      return c;
    });
    // boulders along the bank, not too regular
    const pr = rng(seed * 13 + 5);
    const nRocks = Math.round((rx + ry) * 0.55);
    for (let k = 0; k < nRocks; k++) {
      const a = (k / nRocks) * Math.PI * 2 + pr() * 0.5;
      let rr = 1.05;
      const dx = Math.cos(a) * rx;
      const dy = Math.sin(a) * ry;
      while (rr < 1.5 && eAt(cx + dx * rr, cy + dy * rr) < crustE + 0.02) rr += 0.01;
      const x = cx + dx * rr;
      const y = cy + dy * rr;
      if (x < 1 || x > W - 2 || !padFree(x, y) || pr() < 0.25) continue;
      rockPx(x * S, y * S, 2.4 + pr() * 3.6, rim, seed + k);
    }
    for (let y = Math.floor(cy - ry - 3); y <= cy + ry + 3; y++) for (let x = Math.floor(cx - rx - 3); x <= cx + rx + 3; x++) if (x >= 0 && x < W) reserved[y * W + x] = reserved[y * W + x] || (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 < 1.3 ? 1 : 0);
  };
  /** A car for the traffic, nose to the right, with its shadow (the game turns it along its way). */
  const carF = (c, u) =>
    capture(0, 0, 9, 6, () => {
      for (let j = 0; j < 12; j++) for (let i = 0; i < 21; i++) img.px(4 + i, 5 + j, 0x000000, 0.28);
      carPx(img, 3, 3, false, c);
    }, u);
  /** A street lamp at (x, y): its post, the arm, the lamp, a pool of light once it gets dark. */
  const lampPost = (x, y) => {
    const X = Math.round(x * S);
    const Yy = Math.round(y * S);
    const on = dark(L - y);
    objects.push({
      y: y + 1,
      shadow: () => {
        for (let k = 0; k < 14; k++) img.tintPx(X + 1 + k, Yy + 1 + Math.floor(k * 0.55), 0.7);
      },
      draw: () => {
        for (let j = -14; j < 1; j++) {
          img.px(X, Yy + j, 0x5a5e64);
          img.px(X + 1, Yy + j, 0x3a3e44);
        }
        for (let i = -1; i < 5; i++) img.px(X + i, Yy - 15, 0x4a4e54);
        img.px(X + 4, Yy - 14, on > 0.05 ? 0xfff0c8 : 0xd8dce0);
        img.px(X + 5, Yy - 14, on > 0.05 ? 0xfff0c8 : 0xc8ccd0);
        if (on > 0.05) {
          glowPx(X + 4, Yy - 14, 0xfff0c8, 1);
          glowPx(X + 5, Yy - 14, 0xfff0c8, 1);
          pool(x + 1.5, y, 7, 0xffd890, 0.2 * on);
        }
      },
    });
    if (x >= 0 && x < W && y >= 0 && y < L) reserved[Math.floor(y) * W + Math.floor(x)] = 1;
  };
  /** A person seen from above in fine pixels: hair or a hat, the face, shoulders and arms, legs, a shadow. */
  const personPx = (X, Yy, pr, o = {}) => {
    const coat = o.coat ?? pr.pick(COATS);
    const hair = o.hat ? pr.pick([0xe8e0d0, 0xd8b070, 0x2a2a34, 0xc83a3a]) : pr.pick([0x1a1418, 0x2a2024, 0x3a2a20, 0x5a3a28, 0x8a8a8a]);
    for (let i = 0; i < 4; i++) img.px(X + i, Yy + 5, 0x141824, 0.4);
    img.px(X, Yy - 2, hair);
    img.px(X + 1, Yy - 2, scaleColor(hair, 1.2));
    img.px(X + 2, Yy - 2, hair);
    img.px(X, Yy - 1, 0xe8c0a0);
    img.px(X + 1, Yy - 1, 0xf0d0b0);
    img.px(X + 2, Yy - 1, o.hat ? hair : 0xe0b898);
    for (let j = 0; j < 3; j++) for (let i = -1; i < 4; i++) if (!(j === 2 && (i < 0 || i > 2))) img.px(X + i, Yy + j, i < 0 || i > 2 ? scaleColor(coat, 0.75) : i === 0 ? scaleColor(coat, 1.12) : coat);
    if (o.yukata) {
      // a robe to the ankles, tied with a sash, a towel over the shoulder
      for (let i = 0; i < 3; i++) {
        img.px(X + i, Yy + 1, o.sash ?? 0xc83a3a);
        img.px(X + i, Yy + 3, coat);
        img.px(X + i, Yy + 4, scaleColor(coat, 0.85));
      }
      img.px(X - 1, Yy, 0xf4f0e6);
      return;
    }
    const leg = pr() < 0.5 ? 0x2a2a3a : 0x4a4a5a;
    img.px(X, Yy + 3, leg);
    img.px(X + 2, Yy + 3, leg);
    img.px(X, Yy + 4, 0x1a1418);
    img.px(X + 2, Yy + 4, 0x1a1418);
  };
  /** A few people as objects, so what stands in front of them hides them. */
  const folk = (x, y, o = {}) => {
    if (!padFree(x, y)) return;
    const X = Math.round(x * S);
    const Yy = Math.round(y * S);
    objects.push({
      y: y + 1.7,
      draw: () => {
        const pr = rng(X * 977 + Yy * 13);
        personPx(X, Yy, pr, o.yukata ? { yukata: true, coat: pr.pick(YUKATA), sash: pr.pick([0xc83a3a, 0xe8c040, 0x2a2a34]), ...o } : o);
        o.extra?.(X, Yy);
      },
    });
  };
  const crowd = (x0, y0, w, h, n, any = false, o = {}) => {
    for (let i = 0; i < n; i++) {
      const x = Math.round(x0 + rand() * w);
      const y = Math.round(y0 + rand() * h);
      const keep = any || !isRes(x, y);
      const hat = rand() < 0.15;
      if (keep) folk(x, y, { hat, ...o });
    }
  };
  /** Somebody on foot, in two steps, for the routes people take: `yk` in a robe. */
  const stepper = (c, step, u, yk = false) => {
    const r = new HiCanvas(4, 3);
    const c0 = scaleColor(c, 0.82);
    const legs = yk ? c0 : 0x2a2a3a;
    r.px(2, 0, 0x2a2024);
    r.px(3, 0, 0x3a2e30);
    r.px(4, 0, 0x2a2024);
    r.px(2, 1, 0xe8c0a0);
    r.px(3, 1, 0xf0d0b0);
    r.px(4, 1, 0xe0b898);
    for (let j = 2; j < 5; j++) for (let i = 1; i < 6; i++) if (!(j === 4 && (i < 2 || i > 4))) r.px(i, j, i === 1 || i === 5 ? c0 : i === 2 ? scaleColor(c, 1.12) : c);
    if (yk) {
      for (let i = 2; i < 5; i++) r.px(i, 3, 0xc83a3a);
      r.px(1, 2, 0xf4f0e6);
      for (let i = 2; i < 5; i++) r.px(i, 5, c0);
    }
    r.px(step ? 2 : 3, 5, legs);
    r.px(step ? 4 : 3, 6, legs);
    r.px(step ? 2 : 4, 6, 0x1a1418);
    for (let i = 1; i < 6; i++) r.px(i, 7, 0x141824, 0.35);
    return kit.frame(tod.frame(r, u));
  };
  /** Dense town fill: rows of houses of varied size, some concrete blocks, pocket gardens, parking. */
  const town = (u0, u1, opt = {}) => {
    const { roofH = [10, 15], maxW = 26, pBlock = 0.15, pGarden = 0.07, pPark = 0.03, roofs } = opt;
    let u = u0;
    while (u < u1 - 12) {
      const rh = roofH[0] + Math.floor(rand() * (roofH[1] - roofH[0] + 1));
      const fh = 3 + Math.floor(rand() * 2);
      const bh = rh + fh;
      let x = -Math.floor(rand() * 8);
      while (x < W - 5) {
        let w = 11 + Math.floor(rand() * (maxW - 11));
        const y = Y(u + bh);
        if (anyRes(x, y, w, bh)) w = Math.floor(w / 2);
        if (w >= 8 && !anyRes(x, y, w, bh)) {
          const r = rand();
          if (r < pGarden) garden(x, y, w, bh);
          else if (r < pGarden + pPark && w >= 14) parking(x, y, w, bh);
          else if (r < pGarden + pPark + pBlock && w >= 14) block(x, y + bh - 8 - Math.min(rh, 14), w, Math.min(rh, 14), 8, { balcony: rand() < 0.5 });
          else house(x, y, w, rh, fh, { roofs, plot: true });
        }
        x += w + 1 + Math.floor(rand() * 2);
      }
      u += bh + 2 + Math.floor(rand() * 3);
    }
  };
  /** Steam plumes scattered over a band, rising from wellheads in the lanes and yards, `every` px of strip apart on average. */
  const plumes = (u0, u1, every, size) => {
    for (let u = u0; u < u1; u += every * (0.6 + rand() * 0.8)) {
      let x = 8 + rand() * 164;
      let y = Y(u);
      let found = false;
      for (let k = 0; k < 60 && !found; k++) {
        x = 8 + rand() * 164;
        y = Y(u + (k % 8) * 2);
        if ((margin[y * W + Math.floor(x)] || !isRes(x, y)) && padFree(x, y)) found = true;
      }
      if (found) {
        wellhead(x, y);
        plume(x, y, size[0] + rand() * (size[1] - size[0]), { wind: 0.6 + rand() * 0.8 });
      }
    }
  };

  /** Move a winding way's centre c at u out from under the turret stands and vents it would run into. */
  const dodge = (c, u, hw) => {
    let out = c;
    for (const o of [...pads, ...vents]) {
      const du = Math.abs(u - o.u);
      if (du > 34) continue;
      const need = hw + 15;
      const dx = out - o.x;
      if (Math.abs(dx) >= need) continue;
      out += (dx === 0 ? 1 : Math.sign(dx)) * (need - Math.abs(dx)) * smooth(34, 12, du);
    }
    return Math.max(hw + 1, Math.min(W - hw - 1, out));
  };
  /** A vermilion torii at (cx, y): two posts on stone feet, the black-topped lintel curving up at its ends, the tie beam. */
  const torii = (cx, y, span, h = 8) => {
    const X = Math.round(cx * S);
    const Yy = Math.round(y * S);
    const HW = Math.round((span * S) / 2);
    const H = h * S;
    const VER = 0xd8402e;
    const VER2 = 0x9a2a1e;
    objects.push({
      y: y + 1,
      shadow: () => {
        for (let k = 0; k < H; k++) for (const sx of [-HW, HW]) for (let i = 0; i < 3; i++) img.tintPx(X + sx + i + k, Yy + Math.floor(k * 0.6), 0.72);
      },
      draw: () => {
        for (const sx of [-HW, HW]) {
          for (let j = 0; j < 3; j++) for (let i = -3; i < 5; i++) img.px(X + sx + i, Yy - j, j === 2 ? C.stone[3] : C.stone[1]);
          for (let j = 0; j < H; j++) for (let i = -1; i < 3; i++) img.px(X + sx + i, Yy - 3 - j, i === -1 ? 0xf0604a : i === 2 ? VER2 : VER);
        }
        const BY = Yy - 3 - Math.round(H * 0.72);
        for (let i = -HW; i <= HW; i++) for (let j = 0; j < 3; j++) img.px(X + i, BY + j, j === 2 ? VER2 : VER);
        const TY = Yy - 3 - H;
        for (let i = -HW - 6; i <= HW + 6; i++) {
          const up = Math.round((Math.abs(i) / (HW + 6)) ** 3 * 4);
          for (let j = 0; j < 3; j++) img.px(X + i, TY - up + j, j === 2 ? VER2 : VER);
          for (let j = 0; j < 2; j++) img.px(X + i, TY - up - 2 + j, j === 0 ? 0x4a4248 : 0x1e1a1e);
        }
      },
    });
  };
  /** An open-air bath at (x, y) in a corner of a garden: rocks round milky or clear water, bathers, a bamboo fence, steam. */
  const rotenburo = (x, y, w, h, ramp = C.milk, seed = 300) => {
    const cx = x + w / 2;
    const cy = y + h / 2;
    img.fine(x, y, w, h, (X, Yr, xx, yy) => {
      const e = Math.max(Math.abs(xx - cx) / (w / 2), Math.abs(yy - cy) / (h / 2));
      if (e > 0.97) return (X >> 1) % 2 ? 0x8a7a4a : 0xa89a5a;
      return rampColor(C.stone, 0.3 + hashPx(X >> 2, Yr >> 2, seed) * 0.3, X, Yr);
    });
    const rx = w / 2 - 2.5;
    const ry = h / 2 - 2.5;
    img.fine(x, y, w, h, (X, Yr, xx, yy) => {
      const e = ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 + (hashPx(X >> 3, Yr >> 3, seed + 1) - 0.5) * 0.1;
      if (e > 1) return null;
      const r = Math.sin(Math.sqrt(e) * 16 + hashPx(X >> 3, Yr >> 3, seed + 2) * 2);
      const c = rampColor(ramp, 0.3 + (1 - e) * 0.4, X, Yr);
      return r > 0.9 ? scaleColor(c, 1.12) : c;
    });
    const n = Math.round((w + h) * 0.7);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      rockPx((cx + Math.cos(a) * (rx + 0.5)) * S, (cy + Math.sin(a) * (ry + 0.5)) * S, 1.6 + hashPx(k, 1, seed) * 1.6, C.rock, seed + k);
    }
    const br = rng(seed);
    for (let k = 0; k < Math.max(1, (w * h) / 110); k++) {
      const X = Math.round((cx + (br() - 0.5) * rx * 1.3) * S);
      const Yr = Math.round((cy + (br() - 0.5) * ry * 1.2) * S);
      img.discPx(X, Yr, 1.7, 0xe8c8a8);
      img.px(X, Yr - 1, br() < 0.5 ? 0x2a2024 : 0xf4f0e6);
      img.px(X + 1, Yr - 1, 0x2a2024);
      for (let i = -3; i < 4; i++) img.px(X + i, Yr + 2, 0xf4f8f8, 0.5);
    }
    reserveRect(x, y, w, h);
    kit.emit(Math.round(cx), Math.round(U(cy)), [2, 3, 4].map(puffFrames), { rate: 1.1, life: [1.8, 2.8], vy: 5, sx: Math.max(2, rx * 0.6), wf: 0.6, a: 0.4, d: 1.1, tint: 1 });
  };
  /** A walk of flagstones along a polyline (x, u), a darker kerb, reserved; returns the points, for those who walk it. */
  const flagPaths = [];
  const flags = (pts0, hw = 2.6) => {
    const snap = ([x, u]) => {
      let best = null;
      let bd = 9;
      for (const p of flagPaths)
        for (const [px, pu] of p) {
          const d = Math.hypot(px - x, pu - u);
          if (d < bd) {
            bd = d;
            best = [px, pu];
          }
        }
      return best ?? [x, u];
    };
    const ends = pts0.map((p, i) => (i === 0 || i === pts0.length - 1 ? snap(p) : p));
    const pts = [ends[0]];
    for (let i = 1; i + 1 < ends.length; i++) {
      const [ax, au] = ends[i - 1];
      const [px, pu] = ends[i];
      const [bx, bu] = ends[i + 1];
      const la = Math.hypot(px - ax, pu - au) || 1;
      const lb = Math.hypot(bx - px, bu - pu) || 1;
      const d = Math.min(14, la / 2.2, lb / 2.2);
      const s0 = [px - ((px - ax) / la) * d, pu - ((pu - au) / la) * d];
      const s1 = [px + ((bx - px) / lb) * d, pu + ((bu - pu) / lb) * d];
      for (let t = 0; t <= 1.001; t += 1 / 6) {
        const a = (1 - t) * (1 - t);
        const b = 2 * t * (1 - t);
        const c = t * t;
        pts.push([a * s0[0] + b * px + c * s1[0], a * s0[1] + b * pu + c * s1[1]]);
      }
    }
    pts.push(ends[ends.length - 1]);
    flagPaths.push(pts);
    for (const pass of [0, 1])
      for (let k = 0; k + 1 < pts.length; k++) {
        const [x0, u0] = pts[k];
        const [x1, u1] = pts[k + 1];
        const n = Math.ceil(Math.hypot(x1 - x0, u1 - u0) * 3);
        for (let t = 0; t <= n; t++) {
          const x = x0 + ((x1 - x0) * t) / n;
          const u = u0 + ((u1 - u0) * t) / n;
          for (let Yr = Math.floor((L - u - hw - 1) * S); Yr <= (L - u + hw + 1) * S; Yr++)
            for (let X = Math.floor((x - hw - 1) * S); X <= (x + hw + 1) * S; X++) {
              const d = Math.hypot((X + 0.5) / S - x, L - (Yr + 0.5) / S - u);
              if (d > (pass ? hw : hw + 0.5) || !padFree((X + 0.5) / S, (Yr + 0.5) / S)) continue;
              if (!pass) {
                img.px(X, Yr, 0x6e6a60);
                continue;
              }
              const XX = X + ((Yr >> 3) % 2) * 5;
              const joint = Yr % 8 === 0 || XX % 10 === 0;
              img.px(X, Yr, joint ? 0x8a867a : rampColor(C.stone, 0.62 + hashPx(XX >> 3, Yr >> 3, 415) * 0.34, X, Yr));
            }
          reserveRect(x - hw - 1, L - u - hw - 1, hw * 2 + 2, hw * 2 + 2);
        }
      }
    return pts;
  };
  /** A low rail on posts round a pool, a few people leaning on it. */
  const poolRail = (cx, cu, rx, ry, n = 5) => {
    const cy = Y(cu);
    const r = rng(cx * 31 + cu);
    const pts = [];
    for (let a = 0; a < Math.PI * 2; a += 0.05) pts.push([cx + Math.cos(a) * (rx + 4), cy + Math.sin(a) * (ry + 3.4), a]);
    objects.push({
      y: cy + ry + 3.4,
      draw: () => {
        for (let k = 0; k < pts.length; k++) {
          const [x, y] = pts[k];
          const [x1, y1] = pts[(k + 1) % pts.length];
          if (!padFree(x, y) || !padFree(x1, y1)) continue;
          img.linePx(x * S, y * S - 2, x1 * S, y1 * S - 2, 0x8e6a4a);
          if (k % 5 === 0) for (let j = -2; j < 2; j++) img.px(Math.round(x * S), Math.round(y * S) + j, 0x3a2a1c);
        }
      },
    });
    for (let k = 0; k < n; k++) {
      const a = 0.25 + r() * (Math.PI - 0.5);
      folk(cx + Math.cos(a) * (rx + 4), cy + Math.sin(a) * (ry + 3.4) + 2.4);
    }
  };
  /** A vent in the ground: a dark crack in a crust of sulphur, yellow going to orange at its edge, a thread of steam (live). */
  const fumarole = (x, y, r = 3) => {
    const CX = x * S;
    const CY = y * S;
    const R = r * S;
    const seed = Math.floor(x * 13 + y);
    for (let Yr = Math.floor(CY - R * 1.3); Yr <= CY + R * 1.3; Yr++)
      for (let X = Math.floor(CX - R * 1.5); X <= CX + R * 1.5; X++) {
        const d = Math.hypot((X - CX) / 1.2, Yr - CY) / R + (hashPx(X >> 1, Yr >> 1, seed) - 0.5) * 0.5;
        if (d > 1) continue;
        const g = hashPx(X, Yr, seed + 1);
        // a thin wandering crack, hardly more than a shadow, in a crust of pale salts yellowing towards it
        const crackY = Math.sin((X - CX) * 0.4 + seed) * 1.6 + Math.sin((X - CX) * 0.13) * 2;
        const crack = Math.abs(Yr - CY - crackY) < 0.8 && Math.abs(X - CX) < R * 0.65;
        let c = crack ? 0x4a4238 : d < 0.3 ? 0xdcc870 : d < 0.6 ? 0xd8cc98 : 0xc8bea0;
        if (!crack && g > 0.92) c = 0xf0e8c8;
        else if (!crack && g < 0.12) c = scaleColor(c, 0.88);
        if (d > 0.6 && g < (d - 0.6) * 2.2) continue;
        img.px(X, Yr, c);
      }
    reserveRect(x - r - 1, y - r - 1, 2 * r + 2, 2 * r + 2);
    kit.emit(Math.round(x), Math.round(U(y)), [2, 3].map(puffFrames), { rate: 0.9, life: [1.2, 2], vy: 6, sx: 1, wf: 0.5, a: 0.5, d: 1.1, tint: 1 });
  };
  /** Scatter fumaroles over a rectangle's free ground. */
  const fumaroles = (x0, u0, x1, u1, n, seed) => {
    const fr = rng(seed);
    for (let k = 0, made = 0; k < n * 12 && made < n; k++) {
      const x = x0 + fr() * (x1 - x0);
      const y = Y(u0 + fr() * (u1 - u0));
      if (anyRes(x - 5, y - 5, 10, 10)) continue;
      fumarole(x, y, 2 + fr() * 2.2);
      made++;
    }
  };
  /** The hot water running off the pools in this rectangle, a stained thread wandering away over the ground, salts along it. */
  const runoffs = (x0, u0, x1, u1, seed) => {
    const fr = rng(seed);
    for (const { cx, cu, rx, ry, ramp } of poolsMade) {
      if (cx < x0 || cx > x1 || cu < u0 || cu > u1) continue;
      for (let n = 0; n < 2; n++) {
        let a = fr() * Math.PI * 2;
        let x = cx + Math.cos(a) * rx * 1.18;
        let y = Y(cu) + Math.sin(a) * ry * 1.18;
        const len = 36 + fr() * 70;
        const trail = [];
        for (let i = 0; i < len; i++) {
          a += (fr() - 0.5) * 0.5;
          x += Math.cos(a) * 0.5;
          y += Math.sin(a) * 0.5;
          if (x < x0 + 6 || x > x1 - 6 || L - y < u0 + 6 || L - y > u1 - 6) break;
          if (i > 8 && isRes(x, y)) break;
          trail.push([Math.round(x * S), Math.round(y * S), i]);
        }
        // (first the pale salts along its banks, then the water in them; thinner as it goes)
        // (fading as it seeps away into the ground)
        const stain = ramp === C.mud ? C.mud[1] : ramp[1];
        trail.forEach(([X, Yr, i]) => {
          const k = 1 - i / len;
          if (i % 2 === 0) img.discPx(X, Yr, 1.3 + k * 1.6, 0xcfc8b0, 0.14 + k * 0.2);
        });
        trail.forEach(([X, Yr, i]) => {
          const k = 1 - i / len;
          if (i % 2 === 0) img.discPx(X, Yr, 0.8 + k * 0.8, stain, 0.16 + k * 0.42);
        });
        for (const [X, Yr] of trail) reserveRect(X / S - 1, Yr / S - 1, 2, 2);
        // (the next things planted keep off it)
      }
    }
  };
  /** A clump of flowering azalea at (x, y): a dark bush thick with blossom. */
  const azalea = (x, y, r, c = 0xe86a9a) => {
    const CX = x * S;
    const CY = y * S;
    const R = r * S;
    for (let Yy = Math.floor(CY - R); Yy <= CY + R + 2; Yy++)
      for (let X = Math.floor(CX - R); X <= CX + R + 2; X++) {
        const d = Math.hypot(X + 0.5 - CX - 1.5, Yy + 0.5 - CY - 1.5) / R;
        if (d < 1) img.tintPx(X, Yy, 0.75);
      }
    for (let Yy = Math.floor(CY - R); Yy <= CY + R; Yy++)
      for (let X = Math.floor(CX - R); X <= CX + R; X++) {
        const dx = (X + 0.5 - CX) / R;
        const dy = (Yy + 0.5 - CY) / R;
        if (dx * dx + dy * dy + (hashPx(X >> 1, Yy >> 1, 411) - 0.5) * 0.3 > 1) continue;
        const t = hashPx(X, Yy, 412);
        const b = hashPx(X >> 1, Yy >> 1, 413);
        img.px(X, Yy, b < 0.5 ? (t < 0.2 ? 0xffffff : dx + dy < 0 ? scaleColor(c, 1.14) : c) : dx + dy < 0 ? 0x3e7a3a : 0x2a5a2a);
      }
  };
  /** A bench of slats at (x, y), somebody on it now and then. */
  const bench = (x, y) => {
    const X = Math.round(x * S);
    const Yy = Math.round(y * S);
    objects.push({
      y: y + 2,
      draw: () => {
        for (let i = 0; i < 15; i++) {
          img.px(X + i, Yy, 0x7a583e);
          img.px(X + i, Yy + 1, 0x8e6a4a);
          img.px(X + i, Yy + 3, 0x8e6a4a);
          img.px(X + i, Yy + 4, 0x5e4430);
          img.px(X + i, Yy + 6, 0x101418, 0.3);
        }
        for (const i of [1, 13]) img.px(X + i, Yy + 5, 0x2a2a30);
      },
    });
  };
  /** A vending machine at (x, y): lit front, rows of bottles, its shadow. */
  const vending = (x, y) => {
    const X = Math.round(x * S);
    const Yy = Math.round(y * S);
    const c = hashPx(X, Yy, 415) < 0.5 ? 0xc8302a : 0x2a6ac8;
    objects.push({
      y: y + 2,
      shadow: () => {
        for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) img.tintPx(X + i + 2, Yy + j + 2, 0.65);
      },
      draw: () => {
        for (let j = 0; j < 4; j++) for (let i = 0; i < 7; i++) img.px(X + i, Yy + j, j === 0 ? scaleColor(c, 1.25) : c);
        for (let j = 4; j < 9; j++)
          for (let i = 0; i < 7; i++) {
            const shelf = j === 6 || i === 0 || i === 6;
            const col = shelf ? scaleColor(c, 0.7) : 0xe8f0f0;
            if (!shelf && dark(L - y) > 0.1) glowPx(X + i, Yy + j, 0xf0f4e8, 0.9);
            else img.px(X + i, Yy + j, !shelf && (i + j) % 2 ? 0xd8a040 : col);
          }
      },
    });
  };
  /** A parked bicycle at (x, y). */
  const bicycle = (x, y) => {
    const X = Math.round(x * S);
    const Yy = Math.round(y * S);
    objects.push({
      y: y + 2,
      draw: () => {
        for (let i = 0; i < 11; i++) img.px(X + i, Yy, i === 0 || i === 10 ? 0x1a1a22 : 0x3a6ad0);
        for (const i of [0, 10]) for (let j = -2; j <= 2; j++) img.px(X + i, Yy + j, 0x1a1a22);
        img.px(X + 8, Yy - 2, 0xa8a8b0);
        img.px(X + 8, Yy - 1, 0xa8a8b0);
        img.px(X + 3, Yy - 1, 0x2a2a30);
        for (let i = 1; i < 11; i++) img.px(X + i, Yy + 3, 0x101418, 0.3);
      },
    });
  };
  /** A utility pole at (x, y) with its transformer and cross-arm; returns the point the wires hang from. */
  const pole = (x, y) => {
    const X = Math.round(x * S);
    const Yy = Math.round(y * S);
    objects.push({
      y: y + 0.5,
      shadow: () => {
        for (let k = 0; k < 18; k++) img.tintPx(X + 1 + k, Yy + 1 + Math.floor(k * 0.6), 0.72);
      },
      draw: () => {
        for (let j = -19; j < 1; j++) {
          img.px(X, Yy + j, 0x8a8a84);
          img.px(X + 1, Yy + j, 0x5e5e58);
        }
        for (let i = -4; i <= 5; i++) img.px(X + i, Yy - 19, 0x4a4a46);
        for (let j = -14; j < -9; j++) for (let i = 2; i < 5; i++) img.px(X + i, Yy + j, i === 2 ? 0xa8acb0 : 0x7a7e84);
      },
    });
    return [X, Yy - 19];
  };
  /** A wire between two poles, sagging a little, its thin shadow on the ground far below. */
  const wire = ([X0, Y0], [X1, Y1]) => {
    const n = Math.max(Math.abs(X1 - X0), Math.abs(Y1 - Y0));
    if (n < 6 || n > 160) return;
    objects.push({
      y: Math.max(Y0, Y1) / S + 8,
      draw: () => {
        for (let k = 0; k <= n; k++) {
          const t = k / n;
          const sag = Math.sin(t * Math.PI) * Math.min(5, n * 0.06);
          img.px(Math.round(X0 + (X1 - X0) * t), Math.round(Y0 + (Y1 - Y0) * t + sag), 0x1a1a20, 0.5);
        }
      },
    });
  };
  /**
   * Fill what is left of a town: small houses and yards where a gap is big enough, then the life of the lanes (poles
   * and their wires, vending machines, bicycles, planters, people, a manhole or two, patches and cracks in the paving).
   */
  const lanes = (u0, u1, density = 1, o = {}) => {
    const lr = rng(u0 * 3 + 11);
    for (let y = Y(u1); y < Y(u0) - 12; y += 3)
      for (let x = 0; x < W - 8; x += 2) {
        const w = 9 + Math.floor(lr() * 9);
        const h = 12;
        if (x + w > W + 3 || anyRes(x - 1, y - 1, w + 2, h + 2)) continue;
        if (lr() < 0.2) garden(x, y, w, h);
        else if (lr() < 0.12) {
          // a small lot behind a low wall: a car, or a yard with a shed
          parking(x, y, w, h);
        } else house(x, y, w, 9, 3, { roofs: o.roofs, plot: true });
        x += w;
      }
    const free = (x, y) => {
      const i = Math.floor(y) * W + Math.floor(x);
      return i >= 0 && i < W * L && x >= 0 && x < W && padFree(x, y) && (margin[i] || !reserved[i]);
    };
    const area = (u1 - u0) * W;
    const n = Math.round((area / 240) * density);
    const poles = [];
    for (let k = 0; k < n; k++) {
      const x = 2 + lr() * (W - 4);
      const y = Y(u0 + lr() * (u1 - u0));
      if (!free(x, y) || !free(x + 1, y + 1) || !free(x - 1, y)) continue;
      const v = lr();
      if (v < 0.52) folk(x, y, { yukata: lr() < (o.yukata ?? 0.2), hat: lr() < 0.12 });
      else if (v < 0.62) bicycle(x, y);
      else if (v < 0.68) vending(x, y);
      else if (v < 0.76) poles.push(pole(x, y));
      else if (v < 0.86) {
        // pots of plants by a wall
        const X = Math.round(x * S);
        const Yy = Math.round(y * S);
        for (let i = 0; i < 3; i++) {
          img.rectPx(X + i * 3, Yy + 1, 2, 2, 0xa85a3a);
          img.discPx(X + i * 3 + 1, Yy, 1.5, i % 2 ? 0x3a6a30 : 0x4e8a3e);
        }
      } else if (v < 0.93) {
        // a manhole cover
        const X = Math.round(x * S);
        const Yy = Math.round(y * S);
        img.discPx(X, Yy, 3.4, 0x2a2a2e);
        img.discPx(X, Yy, 2.6, 0x4a4a50);
        for (let i = -2; i <= 2; i += 2) img.px(X + i, Yy, 0x2a2a2e);
      } else {
        // a crack in the paving
        let X = Math.round(x * S);
        let Yy = Math.round(y * S);
        for (let i = 0; i < 18; i++) {
          img.tintPx(X, Yy, 0.72);
          X += lr() < 0.6 ? 1 : 0;
          Yy += lr() < 0.5 ? 1 : lr() < 0.5 ? -1 : 0;
        }
      }
    }
    // the wires go from each pole to the nearest ones along the same lanes
    for (let i = 0; i < poles.length; i++) {
      let best = null;
      let bd = 1e9;
      for (let j = 0; j < poles.length; j++) {
        if (i === j) continue;
        const d = Math.hypot(poles[i][0] - poles[j][0], (poles[i][1] - poles[j][1]) * 1.2);
        if (d < bd) {
          bd = d;
          best = poles[j];
        }
      }
      if (best && bd < 96) wire(poles[i], best);
    }
  };

  /**
   * Narrow side streets: h [u, x0, x1, hw = 2], v [x, u0, u1], asphalt joined where they cross, a lamp here and there, somebody
   * on foot along each.
   */
  const streets = (hs, vs) => {
    const sr = rng(hs.length * 97 + (hs[0]?.[0] ?? 1));
    for (const [x, u0, u1] of vs) vRoad(x, 2, u0, u1);
    for (const [u, x0, x1, hw = 2] of hs) hRoad(u, hw, x0, x1);
    for (const [u, x0, x1, hw = 2] of hs)
      for (const [x, u0, u1] of vs) {
        if (x < x0 || x >= x1 || u < u0 || u > u1) continue;
        img.fine(x - 2, Y(u) - hw, 4, 2 * hw, (X, Yr) => rampColor(C.asphalt, 0.2 + hashPx(X >> 3, Yr >> 3, 36) * 0.5, X, Yr));
      }
    for (const [u, x0, x1, hw = 2] of hs) {
      for (let x = x0 + 12 + Math.floor(sr() * 20); x < x1 - 8; x += 44) if (!vs.some(([vx]) => Math.abs(vx - x) < 6)) lampPost(x, Y(u + hw + 2));
      const c = sr.pick(COATS);
      const off = sr() < 0.5 ? hw + 1.5 : -hw - 1.5;
      kit.path([[x0 + 2, u + off], [x1 - 2, u + off]], [stepper(c, 0, u), stepper(c, 1, u)], { sp: 3.5, mode: 'pp', hold: 2, turn: 'none', fps: 3, s0: sr() });
    }
    for (const [x, u0, u1] of vs) {
      const c = sr.pick(COATS);
      const off = sr() < 0.5 ? 3 : -3;
      kit.path([[x + off, u0 + 2], [x + off, u1 - 2]], [stepper(c, 0, u0), stepper(c, 1, u0)], { sp: 3.5, mode: 'pp', hold: 2, turn: 'none', fps: 3, s0: sr() });
    }
  };
  /** A row of little shops facing the street at u from its north side: noren, a lit vertical board, customers on the pavement. */
  const shopRow = (x0, x1, u) => {
    const r = rng(u * 3 + x0);
    let x = x0;
    while (x < x1 - 9) {
      const w = 10 + Math.floor(r() * 6);
      if (x + w > x1) break;
      const y = Y(u + 5 + 13);
      if (!anyRes(x, y, w, 13)) {
        const fy = y + 8;
        house(x, y, w, 8, 5, { noren: r.pick([0x2b3c78, 0x8a2a2a, 0x2a5a3a, 0xe8e0d0, 0x5a2a6a]), hip: r() < 0.5, wood: r() < 0.4, roofs: [ROOF.kawara, ROOF.dark, ROOF.brown, ROOF.red, ROOF.orange] });
        const c = r.pick([0xc8302a, 0x2a6ac8, 0xe8a020, 0x2a8a5a, 0xc8306a]);
        const SX = (x + w - 3) * S;
        const gr = rng(x * 7 + u);
        objects.push({
          y: fy + 5.1,
          draw: () => {
            for (let j = -9; j < 15; j++) for (let i = -1; i < 6; i++) img.px(SX + i, fy * S + j, i === -1 || i === 5 || j === -9 || j === 14 ? 0x2a1e18 : c);
            for (let k = 0; k + 5 < 22; k += 6) glyph(SX + 1, fy * S - 7 + k, 3, 0xf8f4ec, gr);
          },
        });
        if (r() < 0.8) folk(x + 2 + r() * (w - 4), y + 14 + r() * 2, { yukata: r() < 0.2 });
      }
      x += w + 1;
    }
  };

  // the turret stands and vents out in the town stand on small paved terraces with planters round them, not on the street
  for (const p of [...pads, ...vents]) {
    if (p.u < 404 || p.u > KANNAWA[1] || (p.u > 1832 && p.u < 2056) || (p.x === 90 && p.u < TOWN[1])) continue;
    const y = Y(p.u);
    img.fine(p.x - 17, y - 17, 34, 34, (X, Yr, xx, yy) => {
      const d = Math.hypot(xx - p.x, yy - y);
      if (d > 16.4) return null;
      if (d > 15.8) return 0xb8b4a8;
      if (d > 15.2) return 0x5e5a52;
      const a = Math.atan2(yy - y, xx - p.x);
      const ring = Math.floor(d / 2.4);
      const joint = ((d % 2.4) < 0.3) || Math.abs(((a * (6 + ring * 2)) / Math.PI) % 1) < 0.08;
      return joint ? 0x6e6a60 : rampColor(C.stone, 0.45 + hashPx(ring, Math.floor((a * (6 + ring * 2)) / Math.PI), p.x + p.u) * 0.3, X, Yr);
    });
    for (const [dx, dy] of [[-12, -12], [12, -12], [-12, 12], [12, 12]]) azalea(p.x + dx, y + dy, 2.6, rand.pick([0xe86a9a, 0xf0a0c0, 0xe8e8e8]));
    reserveRect(p.x - 17, y - 17, 34, 34);
  }

  // ------------------------------------------------------------ A. the bay, the sand baths, the seafront hotels
  {
    // live: the ferry from Osaka crossing the bay and two fishing boats, their wakes spreading behind;
    // seen from above, bow to the right (the game turns them along their course)
    const hull = (len, w, color, trim, paint) => {
      const out = new HiCanvas(len, w);
      const FL = len * S;
      const FW = w * S;
      const mid = (FW - 1) / 2;
      for (let X = 0; X < FL; X++) {
        const t = FL - 1 - X; // px from the bow
        const hw = Math.min(FW / 2, 1 + Math.pow(t, 0.72) * (FW / 2 / Math.pow(FL * 0.34, 0.72)));
        for (let Yy = 0; Yy < FW; Yy++) {
          const a = Yy - mid;
          if (Math.abs(a) > hw) continue;
          const e = hw - Math.abs(a);
          let c = e < 1.2 ? (a > 0 ? scaleColor(color, 0.62) : scaleColor(color, 1.12)) : e < 2.4 ? trim : color;
          if (X < 2) c = scaleColor(color, 0.6);
          out.px(X, Yy, c);
        }
      }
      paint(out, FL, FW);
      return kit.frame(tod.frame(out, 120));
    };
    const ferry = hull(36, 13, 0xf2f0ea, 0x2a5aa8, (o, FL, FW) => {
      // the car deck's tail, the white superstructure with rows of windows, the bridge, the funnel with its band,
      // orange lifeboats down each side, a few passengers at the rail
      for (let Yy = 7; Yy < FW - 7; Yy++)
        for (let X = 18; X < 84; X++) {
          const e = Math.min(Yy - 7, FW - 8 - Yy);
          let c = e === 0 ? 0xeef0f4 : Yy === FW - 8 ? 0x9aa0aa : 0xd8dce4;
          if (e === 1 && (X - 18) % 3 < 2) c = C.glass[1];
          if (e > 2 && (X - 18) % 12 === 0) c = 0xb8bcc4;
          o.px(X, Yy, c);
        }
      for (let Yy = 9; Yy < FW - 9; Yy++) for (let X = 72; X < 84; X++) o.px(X, Yy, X > 80 ? C.glass[0] : X === 72 ? 0x9aa0aa : 0xeef0f4);
      for (let j = 0; j < 9; j++) for (let i = 0; i < 10; i++) if (Math.hypot(i - 4.5, j - 4) < 4.6) o.px(32 + i, 15 + j, i < 3 ? 0xf4a828 : i < 6 ? 0xe8a020 : 0x2a2a30);
      o.discPx(37, 19.5, 2, 0x18181c);
      for (const X of [24, 44, 58]) for (const Yy of [5, FW - 8]) for (let j = 0; j < 3; j++) for (let i = 0; i < 9; i++) o.px(X + i, Yy + j, j === 0 ? 0xf8a040 : 0xe87a20);
      for (const [X, Yy, c] of [[92, 15, 0xd04040], [90, 22, 0x3a6ad0], [12, 12, 0xe8c040], [10, 24, 0xe8e8f0]]) {
        o.px(X, Yy, c);
        o.px(X, Yy + 1, 0x2a2024);
      }
    });
    const boat = (len, w, color, deck, cabinC, u0) =>
      hull(len, w, color, deck, (o, FL, FW) => {
        const mid = Math.floor(FW / 2);
        const cx = Math.floor(FL * 0.42);
        for (let j = -4; j <= 4; j++)
          for (let i = 0; i < 12; i++) {
            const e = Math.min(i, 11 - i, j + 4, 4 - j);
            o.px(cx + i, mid + j, e === 0 ? scaleColor(cabinC, 1.2) : j === 3 ? scaleColor(cabinC, 0.7) : i > 9 ? C.glass[1] : cabinC);
          }
        for (let k = 0; k < 8; k++) o.px(4 + k, mid - 3 + (k * 5) % 7, u0 ? 0x8a9a5a : 0xc84a3a);
        for (let k = 0; k < 6; k++) o.px(6 + k, mid + 2 - (k * 3) % 5, 0xe8c040);
        o.px(cx - 6, mid - 1, 0x2a2024);
        o.px(cx - 6, mid, 0x3a6ad0);
      });
    const fishing = [boat(13, 6, 0xf0ece4, 0xb8b4ac, 0x3a6aa0, 0), boat(11, 6, 0x3a5a8a, 0x2a4a72, 0xf0ece4, 1)];
    const wake = (spread) =>
      [0, 1, 2].map((k) => {
        const s = spread + k * 2;
        const out = new HiCanvas(1, s * 2 + 1);
        const FH = (s * 2 + 1) * S;
        for (let i = 0; i < S; i++)
          for (let j = 0; j < FH; j++) {
            const e = Math.min(j, FH - 1 - j);
            if (e < 2) out.px(i, j, 0xeaf0f0, 1 - k * 0.22);
            else if (e < 5 && k === 0) out.px(i, j, 0xc8d8dc, 0.55);
          }
        return kit.frame(tod.frame(out, 120));
      });
    kit.path([[-40, 112], [230, 112]], [ferry], { sp: 9, turn: 'rot', wake: { f: wake(6), every: 3, life: 2.2 }, s0: 0.42 });
    kit.path([[-20, 158], [210, 158]], [fishing[0]], { sp: 7, turn: 'rot', wake: { f: wake(2), every: 3, life: 1.6 }, s0: 0.25 });
    kit.path([[210, 181], [-20, 181]], [fishing[1]], { sp: 5, turn: 'rot', wake: { f: wake(2), every: 3, life: 1.6 }, s0: 0.5 });
    // waves washing up the black sand: lines of foam rolling in towards the beach, one after another
    {
      const lines = [];
      for (let k = 0; k < 4; k++) {
        const dk = 3 + k * 4;
        let y0 = Infinity;
        let y1 = -Infinity;
        for (let x = 0; x < W; x++) {
          y0 = Math.min(y0, Y(shore(x) - dk + 2));
          y1 = Math.max(y1, Y(shore(x) - dk - 3));
        }
        const out = new HiCanvas(W, y1 - y0 + 1, S, 0, y0);
        for (let Yr = y0 * S; Yr <= y1 * S + 2; Yr++)
          for (let X = 0; X < W * S; X++) {
            const x = (X + 0.5) / S;
            const y = (Yr + 0.5) / S;
            const d = L - y - shoreT[X] + dk;
            if (d > 1.4 || d < -2.6) continue;
            const n = fbm(x, k * 40 + y * 0.2, { seed: 71 + k, scale: 6 });
            if (n < 0.32 + k * 0.05) continue;
            const a = hashPx(X, Yr, 76 + k);
            if (d > -0.4) out.px(X, Yr, a < 0.15 ? 0xc8dcdc : 0xf2f6f6, k ? 0.92 : 1);
            else if (a < 0.45 + d * 0.1) out.px(X, Yr, 0xd8e8e8, 0.7);
          }
        lines.push([kit.frame(tod.frame(out, 210)), U(y0)]);
      }
      kit.wave(
        lines.map((l) => l[0]),
        lines.map(([, u], k) => [k, 0, u, k * 1.1]),
        { w: 1.5, a0: 0, a1: 0.85, pw: 3 },
      );
    }
    // the sea wall at the head of the beach: a concrete face streaked by the spray, a rail along its top, two
    // flights of steps down to the sand, the sand bath's hall at its foot
    const STEPS = [24, 128];
    {
      const FY = (L - SEAWALL) * S;
      for (let Yr = FY; Yr < FY + 7 * S; Yr++)
        for (let X = 0; X < W * S; X++) {
          const j = Yr - FY;
          const inSteps = STEPS.some((sx) => X >= sx * S && X < (sx + 12) * S);
          let c;
          if (inSteps) {
            const k = j % 4;
            c = k === 0 ? 0xc0bcb0 : k === 1 ? 0xa8a498 : k === 2 ? 0x8a8678 : 0x5a564e;
            if (X % (12 * S) < 2) c = 0x6a665c;
          } else {
            c = rampColor(C.stone, 0.45 - j * 0.015 + hashPx(X >> 2, 3, 77) * 0.2, X, Yr);
            if (X % 36 === 0) c = scaleColor(c, 0.78);
            if (hashPx(X >> 1, 9, 78) > 0.86 && j > 3) c = scaleColor(c, 0.82); // (the streaks)
            if (j >= 7 * S - 2) c = 0x1a1614;
          }
          img.px(X, Yr, c);
        }
      for (let X = 0; X < W * S; X++) for (let j = 0; j < 4; j++) img.tintPx(X, FY + 7 * S + j, 0.62 + j * 0.08);
      // the rail on top
      for (let X = 0; X < W * S; X++) {
        if (STEPS.some((sx) => X >= sx * S && X < (sx + 12) * S)) continue;
        img.px(X, FY - 4, 0xc8ccd0);
        img.px(X, FY - 3, 0x5a5e64);
        if (X % 15 === 0) for (let j = -3; j < 1; j++) img.px(X, FY + j, 0x7a7e84);
      }
    }
    // the promenade along its top: flags in a herringbone, a low planter of palms, benches and lamps
    img.fine(0, L - 384, W, 384 - SEAWALL, (X, Yr) => {
      const a = (X + (Yr >> 3) * 4) % 16;
      const joint = a === 0 || Yr % 8 === 0;
      const t = hashPx(((X + (Yr >> 3) * 4) >> 4), Yr >> 3, 79);
      return joint ? 0x8a8478 : rampColor([0xb8ae9c, 0xc4bcaa, 0xd0c8b6], t, X, Yr);
    });
    reserveRect(0, L - 386, W, 386 - SEAWALL + 8);
    // people buried in the warm black sand to the neck, towels on their heads, sunshades over them: rows of them
    // with the attendants shovelling the sand back over them (live)
    {
      const br = rng(6641);
      const bury = (x, y) => {
        const X = x * S;
        const Yr = y * S;
        // the mound of sand over the body, the trench's edge round it, a towel for a pillow, the head
        for (let Yy = Yr; Yy < Yr + 30; Yy++)
          for (let Xx = X - 10; Xx < X + 14; Xx++) {
            const dx = (Xx + 0.5 - X - 1.5 - 2) / 8.2;
            const dy = (Yy + 0.5 - Yr - 14 - 2) / 14.5;
            if (dx * dx + dy * dy < 1) img.tintPx(Xx, Yy, 0.72);
          }
        img.fine(x - 3, y, 7, 10, (Xx, Yy) => {
          const dx = (Xx + 0.5 - X - 1.5) / 7.4;
          const dy = (Yy + 0.5 - Yr - 14) / 13.5;
          const d = dx * dx + dy * dy;
          if (d > 1) return null;
          const h = 1 - d;
          const v = 0.3 + h * 0.5 - dx * 0.45 - dy * 0.15;
          const c = rampColor([0x2e2a26, 0x443e38, 0x544e46, 0x665e54], v + (hashPx(Xx, Yy, 41) - 0.5) * 0.18, Xx, Yy);
          return hashPx(Xx, Yy, 42) > 0.97 ? 0x8a8276 : c;
        });
        for (let j = -2; j < 1; j++) for (let i = -2; i < 6; i++) img.px(X + i, Yr + j, j === -2 ? 0xd8d0c0 : 0xf4f0e6);
        img.discPx(X + 1.5, Yr - 1, 2.6, 0xe8c8a8);
        img.px(X, Yr - 2, 0xf4f0e6);
        img.px(X + 1, Yr - 3, 0xf4f0e6);
        img.px(X + 2, Yr - 3, 0xf4f0e6);
        img.px(X, Yr, 0x2a2024);
        img.px(X + 3, Yr, 0x2a2024);
      };
      const parasol = (x, y, c) => {
        objects.push({
          y: y + 6,
          shadow: () => {
            for (let j = -13; j <= 13; j++) for (let i = -13; i <= 13; i++) if (i * i + j * j <= 160) img.tintPx(Math.round(x * S) + i + 9, Math.round(y * S) + j + 11, 0.6);
          },
          draw: () => {
            const X = Math.round(x * S);
            const Yr = Math.round(y * S);
            for (let j = -13; j <= 13; j++)
              for (let i = -13; i <= 13; i++) {
                const d2 = i * i + j * j;
                if (d2 > 160) continue;
                const seg = Math.floor(((Math.atan2(j, i) + Math.PI) / (Math.PI * 2)) * 8);
                let col = seg % 2 ? c : 0xf6f2e6;
                const l = (-i - j) / 26;
                col = scaleColor(col, 1 + l * 0.35);
                if (d2 > 130) col = scaleColor(col, 0.76);
                img.px(X + i, Yr + j, col);
              }
            img.discPx(X, Yr, 1.2, 0xf8f4ec);
          },
        });
      };
      const spots = [];
      for (let row = 0; row < 4; row++)
        for (let k = 0; k < 11; k++) {
          const x = Math.round(7 + k * 15.5 + (br() - 0.5) * 4 + (row % 2) * 6);
          const u = 262 + row * 24 + br() * 5;
          const y = Y(u);
          if (STEPS.some((sx) => Math.abs(x - sx - 6) < 9) || x > W - 6 || (x > 138 && x < 166) || (row >= 2 && x > 60 && x < 132) || (row === 3 && (x < 40 || x > 118))) continue;
          if (br() < 0.2) continue;
          bury(x, y);
          parasol(x + 5, y - 4, br.pick([0xe04a3a, 0x3a7ad0, 0xf0b020, 0x3aa060, 0xd86aa0]));
          spots.push([x, y]);
        }
      // the attendants, a robe tied up and a towel round the head, shovel by shovel
      const shoveller = (f) =>
        capture(0, 0, 9, 9, () => {
          personPx(12, 8, rng(5), { coat: 0x2b3c78, hat: true });
          const v = f % 2;
          img.linePx(16, 10, 20 + v, 13 + v * 2, 0x8a6a40);
          for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) img.px(20 + v + i, 13 + v * 2 + j, 0xa8a8a8);
          if (v) {
            img.px(23, 15, 0x4a4238);
            img.px(25, 13, 0x4a4238);
            img.px(24, 17, 0x3e3834);
          }
        }, 280);
      const shovelF = [shoveller(0), shoveller(1)];
      for (let k = 0; k < spots.length; k += 4) {
        const [x, y] = spots[k];
        kit.loop(x - 12, U(y - 6), shovelF, { fps: 2 + (k % 3) * 0.4 });
      }
      // footprints from the steps to the bathers and down to the water
      for (const sx of STEPS)
        for (let tr = 0; tr < 3; tr++) {
          const toX = sx + 6 + (tr - 1) * 38;
          const toU = 215 + tr * 16;
          let n = 0;
          for (let t = 0; t < 1; t += 0.018) {
            const x = sx + 6 + (toX - sx - 6) * t + 4 * Math.sin(t * 7 + tr);
            const u = SEAWALL - 8 - (SEAWALL - 8 - toU) * t;
            const off = n++ % 2 ? 2 : -2;
            for (let j = 0; j < 3; j++) for (let i = 0; i < 2; i++) img.tintPx(Math.round(x * S) + off + i, Math.round((L - u) * S) + j, 0.72);
          }
        }
      // a dinghy drawn up on the sand, nets drying on it; driftwood; a few walkers with their shoes in their hands
      {
        const X = 22 * S;
        const Yr = Y(238) * S;
        for (let j = 0; j < 18; j++)
          for (let i = 0; i < 54; i++) {
            const hw = Math.min(9, 1 + i * 0.6);
            if (Math.abs(j - 8.5) > hw) continue;
            const e = hw - Math.abs(j - 8.5);
            img.px(X + 53 - i, Yr + j, e < 1 ? 0xd8d4c8 : e < 2 ? 0x3a6a9a : (i % 9) < 1 ? 0x8a6a40 : 0x6a5038);
          }
        for (let k = 0; k < 16; k++) img.tintPx(X + 54 + k % 3, Yr + 6 + k, 0.7);
        for (const [dx, dy] of [[12, 5], [20, 9], [28, 6], [34, 11]]) img.rectPx(X + dx, Yr + dy, 6, 2, 0x5a7a4a);
      }
      for (const [x, u, a] of [[120, 246, 0.3], [70, 236, -0.2], [160, 300, 0.5]]) {
        const n = 16;
        for (let i = 0; i < n; i++) {
          const X = Math.round(x * S + Math.cos(a) * i);
          const Yr = Math.round((L - u) * S + Math.sin(a) * i);
          img.px(X, Yr, 0x8a7a64);
          img.px(X, Yr + 1, 0x5a4e40);
          img.px(X, Yr + 2, 0x2a2420, 0.5);
        }
      }
      kit.wander(40, 250, 34, 16, [stepper(0xd04040, 0, 250), stepper(0xd04040, 1, 250)], { n: 2, sp: 3, idle: 0.5, turn: 'flip', fps: 3 });
      kit.wander(140, 240, 30, 14, [stepper(0xe8e8f0, 0, 240), stepper(0xe8e8f0, 1, 240)], { n: 2, sp: 3, idle: 0.5, turn: 'flip', fps: 3 });
    }
    // the sand bath hall on the beach: its veranda, a wooden deck, steam from its vents
    img.fine(66, Y(344), 58, 24, (X, Yr) => (X % 12 === 0 || Yr % 12 === 0 ? 0x4a3424 : hashPx(X >> 3, Yr >> 2, 80) < 0.5 ? C.wood[1] : C.wood[2]));
    reserveRect(66, Y(350), 58, 30);
    house(70, Y(346), 50, 15, 6, { ramp: ROOF.dark, hip: true, wood: true, noren: 0x2b3c78 });
    crowd(70, Y(323), 48, 2, 6, true, { yukata: true });
    signPost(66, Y(320));
    plume(76, Y(342), 1.1);
    plume(112, Y(344), 0.9);
    // the jetty out over the sand and into the water, anglers along it, a dinghy tied up at its end
    {
      const X0 = 148 * S;
      const X1 = 156 * S;
      const YT = (L - 350) * S;
      const YB = (L - 186) * S;
      for (let Yr = YT; Yr < YB + 4; Yr++)
        for (let X = X0 + 2; X < X1 + 5; X++) img.tintPx(X + 3, Yr + 3, 0.62);
      for (let Yr = YT; Yr < YB; Yr++)
        for (let X = X0; X < X1; X++) {
          const e = Math.min(X - X0, X1 - 1 - X);
          const c = e === 0 ? 0xc8c4b8 : e === 1 ? 0x8a867c : Yr % 18 === 0 ? 0x6a665c : rampColor(C.stone, 0.45 + hashPx(X >> 1, Yr >> 1, 81) * 0.3, X, Yr);
          img.px(X, Yr, c);
        }
      for (let Yr = YT; Yr < YB; Yr += 36) for (const X of [X0 + 1, X1 - 2]) img.rectPx(X, Yr, 2, 2, 0x2a2a30);
      img.rectPx(X0, YB, X1 - X0, 3, 0x4a4640);
      reserveRect(146, L - 352, 12, 170);
      for (const [xx, u, side] of [[154, 262, 1], [150, 232, -1], [154, 206, 1], [149, 196, -1]]) {
        folk(xx, L - u, { hat: true, extra: (X, Yy) => {
          const dx = side * 20;
          img.linePx(X + 1, Yy + 1, X + dx, Yy - 4, 0x2a2a30, 0.7);
          img.px(X + dx, Yy - 3, 0xf0f0f0);
        } });
      }
      const X = 158 * S;
      const Yr = (L - 194) * S;
      for (let j = 0; j < 12; j++)
        for (let i = 0; i < 28; i++) {
          const hw = Math.min(6, 1 + (27 - i) * 0.5);
          if (Math.abs(j - 5.5) <= hw) img.px(X + i, Yr + j, hw - Math.abs(j - 5.5) < 1 ? 0xf0ece4 : i % 7 ? 0x4a7aa8 : 0x3a5a7a);
        }
    }
    // the swimmers' line of buoys off the beach, its rope; the lifeguard's high chair
    {
      for (let x = 6; x < 146; x++) img.px(x * S, Y(174) * S, 0xe8e8e0, 0.55);
      for (let x = 8; x < 146; x += 15) {
        img.discPx(x * S, Y(174) * S, 3.2, 0xe87a20);
        img.discPx(x * S - 1, Y(174) * S - 1, 1.4, 0xffc070);
        for (let i = -4; i < 5; i++) img.px(x * S + i, Y(174) * S + 4, 0xe8f4f4, 0.5);
      }
      const x = 92;
      const y = Y(238);
      const X = x * S;
      const Yy = y * S;
      objects.push({
        y: y + 2,
        shadow: () => {
          for (let k = 0; k < 30; k++) for (let t = -3; t <= 3; t++) img.tintPx(X + 3 + k, Yy + 3 + Math.floor(k * 0.55) + t, 0.7);
        },
        draw: () => {
          for (const sx of [-5, 5]) for (let j = -20; j < 4; j++) img.px(X + sx, Yy + j, 0xe8e4d8);
          for (const k of [-14, -6, 2]) for (let i = -5; i <= 5; i++) img.px(X + i, Yy + k, 0xc8c4b8);
          for (let j = -26; j < -18; j++) for (let i = -6; i <= 6; i++) img.px(X + i, Yy + j, j < -24 ? 0xd8402e : 0xf4f0e6);
          personPx(X - 1, Yy - 23, rng(9), { coat: 0xd8402e, hat: true });
        },
      });
      reserveRect(x - 3, y - 8, 6, 10);
      folk(100, y + 8);
      folk(56, Y(250));
    }
    // the promenade's dressing, the coast road and the traffic on it
    {
      const pr = rng(6642);
      for (let x = 6; x < 176; x += 22) {
        const x1 = Math.round(x + (rand() - 0.5) * 4);
        // a square bed of grass and stones round each palm
        img.fine(x1 - 5, Y(372), 10, 9, (X, Yr) => {
          const e = Math.min(X - (x1 - 5) * S, Yr - Y(372) * S, (x1 + 5) * S - 1 - X, (Y(372) + 9) * S - 1 - Yr);
          return e < 2 ? (e === 0 ? 0xc8c4b8 : 0x8a867c) : rampColor(C.grass, 0.4 + hashPx(X >> 1, Yr >> 1, 83) * 0.4, X, Yr);
        });
        tree('palm', x1, Y(368), 7);
      }
      // benches facing the sea, lamps between the palms, a stand selling ramune and ice
      for (let x = 17; x < 176; x += 44) {
        const X = x * S;
        const Yr = Y(358) * S;
        objects.push({
          y: Y(358) + 3,
          draw: () => {
            for (let i = 0; i < 18; i++) {
              img.px(X + i, Yr, 0x7a583e);
              img.px(X + i, Yr + 1, 0x8e6a4a);
              img.px(X + i, Yr + 3, 0x8e6a4a);
              img.px(X + i, Yr + 4, 0x5e4430);
              img.px(X + i, Yr + 6, 0x101418, 0.3);
            }
            for (const i of [1, 16]) img.px(X + i, Yr + 5, 0x2a2a30);
          },
        });
        if (pr() < 0.7) folk(x + 2, Y(359), { yukata: pr() < 0.5 });
      }
      for (let x = 28; x < 176; x += 44) lampPost(x, Y(378));
      house(83, Y(384), 18, 7, 4, { ramp: ROOF.orange, wood: true, hip: false });
      crowd(82, Y(372), 20, 2, 5, true);
      // walkers up and down the promenade (live)
      const wr = rng(6643);
      for (const [c, u, yk] of [[0x2b3c78, 362, true], [0xe8e0d0, 375, true], [0xd04040, 370, false], [0x3a6ad0, 356, false], [0xe8c040, 380, false]]) {
        const a = wr() < 0.5;
        kit.path(a ? [[-8, u], [188, u]] : [[188, u], [-8, u]], [stepper(c, 0, u, yk), stepper(c, 1, u, yk)], { sp: 4 + wr() * 2, n: 2, gap: 90, turn: 'flip', fps: 3, s0: wr() });
      }
    }
    hRoad(392, 6);
    {
      const traffic = (u, right, sp, s0, cs) => {
        for (const [k, c] of cs.entries())
          kit.path(right ? [[-20, u], [200, u]] : [[200, u], [-20, u]], [carF(c, u)], { sp, turn: 'flip', fps: 1, s0: (s0 + k * 0.37) % 1 });
      };
      traffic(389, false, 24, 0.1, [0xe8e8ec, 0x3a5a9a]);
      traffic(396, true, 27, 0.4, [0xc03a30, 0x9aa0a8, 0x2a2a30]);
      for (let X = 0; X < W * S; X++) if (Math.floor(X / 15) % 2) img.px(X, Y(392) * S, 0xd8d8d0);
      for (const cx of [38, 142]) zebra(cx * S, Y(398) * S, (cx + 8) * S, Y(386) * S, true);
    }
    // the streets behind the seafront, up to the railway, where an underpass leads through to the station
    streets(
      [[625, 0, W], [720, 0, W], [880, 0, W], [1008, 0, W]],
      [[56, 397.7, 625], [122, 397.7, 625], [14, 625, 1008], [90, 625, 1018], [166, 625, 1008]],
    );
    shopRow(20, 86, 625);
    shopRow(96, 160, 625);
    shopRow(20, 86, 880);
    {
      const X = 84 * S;
      const Yy = Y(1020) * S;
      objects.push({
        y: Y(1014),
        shadow: () => shadowRect(85, Y(1020) + 1, 12, 7, 0.66),
        draw: () => {
          for (let j = 0; j < 18; j++)
            for (let i = 0; i < 36; i++) {
              const e = i === 0 || i === 35 || j === 0;
              img.px(X + i, Yy + j, e ? 0xd8dce0 : i % 6 === 0 ? 0x5a6e80 : j < 9 ? 0x8aa0b0 : 0x6e8496);
            }
          for (let j = 18; j < 24; j++) for (let i = 2; i < 34; i++) img.px(X + i, Yy + j, j % 2 ? 0x2a2a30 : 0x8a8e94);
          for (let j = 2; j < 9; j++) for (let i = 13; i < 23; i++) img.px(X + i, Yy + j, 0x2a5aa8);
          glyph(X + 15, Yy + 3, 5, 0xf8f4ec, rng(1020));
        },
      });
      for (let X2 = 0; X2 < W * S; X2++) {
        if (X2 >= X && X2 < X + 36) continue;
        const FY = Y(1021) * S;
        img.px(X2, FY - 2, 0x8a8e94);
        if (X2 % 3 === 0) img.px(X2, FY - 1, 0x6a6e74);
        if (X2 % 18 === 0) for (let j = -4; j < 2; j++) img.px(X2, FY + j, 0x4a4e54);
      }
      crowd(84, Y(1012), 12, 3, 5, true);
    }
    // tall hotels along the bay with gardens and pools in between
    block(4, Y(560), 46, 18, 34, { roof: 0xc4beb2, wall: 0xece6da, balcony: true, sign: 0xc8302a, bigMark: true, items: ['ac', 'tank', 'bath'] });
    block(62, Y(600), 54, 20, 40, { roof: 0xaaa6a0, wall: 0xf2efe8, balcony: true, items: ['ac', 'hut', 'tank', 'garden', 'bath'] });
    block(128, Y(552), 48, 16, 30, { roof: 0xb8b0a4, wall: 0xe0d6c4, sign: 0x2a6ac8, bigMark: true, items: ['ac', 'tank', 'bath'] });
    // the hotels' pools: blue tiles and lane ropes, loungers and umbrellas on the deck, swimmers (live)
    for (const [x, u] of [[10, 450], [130, 448]]) {
      const y = Y(u);
      img.fine(x - 4, y - 5, 38, 22, (X, Yr) => (X % 9 === 0 || Yr % 9 === 0 ? 0xa8a498 : rampColor([0xc8c0ae, 0xd4ccba, 0xe0d8c6], hashPx(X >> 2, Yr >> 2, 84), X, Yr)));
      img.fine(x, y, 30, 12, (X, Yr, xx, yy) => {
        const e = Math.min(X - x * S, Yr - y * S, (x + 30) * S - 1 - X, (y + 12) * S - 1 - Yr);
        if (e < 2) return 0xf0ece4;
        if (e < 3) return 0x2a7aa8;
        const r = Math.sin(xx * 3 + 2 * Math.sin(yy * 1.7));
        return r > 0.9 ? 0xa8e8f8 : r > 0.4 ? 0x5ac0e4 : 0x4ab0d8;
      });
      for (const ly of [4, 8]) for (let i = 2; i < 28 * S; i++) img.px(x * S + 3 + i, y * S + ly * S, i % 6 < 3 ? 0xf0f0f0 : 0xd04040, 0.9);
      for (let k = 0; k < 4; k++) {
        const X = (x + 3 + k * 7) * S;
        const Yr = (y + 13) * S;
        for (let j = 0; j < 9; j++) for (let i = 0; i < 4; i++) img.px(X + i, Yr + j, j < 2 ? 0xf0ece4 : 0x3a6ad0);
        if (k % 2) {
          img.discPx(X + 2, Yr + 2, 1.6, 0xe8c8a8);
        }
      }
      for (const [dx, dy] of [[34, 2], [-2, 16]]) {
        for (let j = -8; j <= 8; j++)
          for (let i = -8; i <= 8; i++) {
            if (i * i + j * j > 62) continue;
            const seg = Math.floor(((Math.atan2(j, i) + Math.PI) / (Math.PI * 2)) * 8);
            img.px((x + dx) * S + i, (y + dy) * S + j, scaleColor(seg % 2 ? 0x2a8a7a : 0xf4f0e6, 1 + (-i - j) / 40));
          }
      }
      reserveRect(x - 4, y - 5, 38, 22);
      const sw = [0, 1].map((f) => {
        const r = new HiCanvas(4, 2);
        r.px(4, 2, 0xe8c8a8);
        r.px(4, 3, 0x2a2024);
        r.px(5, 3, 0xe8c8a8);
        r.px(f ? 2 : 7, 2, 0xe8c8a8);
        r.px(2, f ? 4 : 3, 0xc8f0f8, 0.8);
        r.px(8, f ? 3 : 4, 0xc8f0f8, 0.8);
        return kit.frame(tod.frame(r, u));
      });
      kit.wander(x + 15, u - 6, 11, 3, sw, { n: 2, sp: 2.5, idle: 0.2, turn: 'flip', fps: 2 });
    }
    for (let k = 0; k < 14; k++) {
      const x = 4 + rand() * 172;
      const u = 410 + rand() * 60;
      if (!anyRes(x - 4, Y(u) - 4, 8, 8)) tree(rand() < 0.5 ? 'palm' : 'broadleaf', x, Y(u), 5);
    }
    town(404, 612, { pBlock: 0.2, pGarden: 0.35, pPark: 0.25 });
    town(615, BAY[1] - 10, { pBlock: 0.25 });
  }

  // ------------------------------------------------------------ B. the station, downtown, Takegawara
  {
    // JR Nippō line along the coast: ballast, sleepers, rails, an island platform and the station's own one
    const [r0, r1] = [1022, 1058];
    img.fine(0, Y(r1), W, r1 - r0, (X, Yr) => {
      const g = hashPx(X >> 1, Yr >> 1, 81);
      return g < 0.3 ? 0x5a524a : g < 0.65 ? 0x6a6258 : g < 0.9 ? 0x7a7266 : 0x8e8678;
    });
    for (const tu of [1033, 1045]) {
      for (let X = 0; X < W * S; X += 5) for (let j = -9; j < 9; j++) {
        img.px(X, Y(tu) * S + j, 0x3a2e24);
        img.px(X + 1, Y(tu) * S + j, 0x4a3a2c);
        img.px(X + 2, Y(tu) * S + j, 0x34281e);
      }
      for (const off of [-6, 5])
        for (let X = 0; X < W * S; X++) {
          img.px(X, Y(tu) * S + off, 0xb8b8c0);
          img.px(X, Y(tu) * S + off + 1, 0x5a5a62);
        }
    }
    const platform = (x0, x1, u0, u1, seed) => {
      const YT = Y(u1) * S;
      const YB = Y(u0) * S;
      for (let Yr = YT; Yr < YB + 2; Yr++)
        for (let X = x0 * S; X < x1 * S; X++) {
          const e = Math.min(Yr - YT, YB - 1 - Yr);
          let c;
          if (Yr >= YB) c = 0x2a2622;
          else if (e < 1) c = 0xd8d4c8;
          else if (e < 3) c = X % 4 < 2 ? 0xe8c840 : 0xd8b830; // the tactile yellow line
          else c = X % 12 === 0 || Yr % 12 === 0 ? 0x8a867c : rampColor([0xa8a498, 0xb4b0a4, 0xc0bcb0], hashPx(X >> 3, Yr >> 3, seed), X, Yr);
          img.px(X, Yr, c);
        }
    };
    /** A platform's long canopy: ribbed sheet on a line of posts, its shadow to the south-east. */
    const canopy = (x0, x1, u0, u1) => {
      const YT = Y(u1) * S;
      const YB = Y(u0) * S;
      for (let Yr = YT + 3; Yr < YB + 3; Yr++) for (let X = x0 * S + 3; X < x1 * S + 3; X++) img.tintPx(X, Yr, 0.72);
      for (let Yr = YT; Yr < YB; Yr++)
        for (let X = x0 * S; X < x1 * S; X++) {
          const e = Math.min(Yr - YT, YB - 1 - Yr);
          let c = (X % 6 === 0 ? 0x5a6e80 : Yr < (YT + YB) / 2 ? 0x8a9eb0 : 0x74889a);
          if (e === 0) c = Yr === YT ? 0xb8c8d4 : 0x3e4e5c;
          if (Math.abs(Yr - (YT + YB) / 2) < 1) c = 0x9ab0c0;
          img.px(X, Yr, c);
        }
    };
    platform(46, 134, 1037, 1041, 85);
    platform(40, 140, 1050, 1058, 86);
    canopy(58, 122, 1038, 1040);
    canopy(52, 128, 1053, 1057);
    reserveRect(0, Y(r1), W, r1 - r0);
    {
      const pr = rng(6651);
      for (let k = 0; k < 16; k++) folk(48 + pr() * 84, Y(1038 + pr() * 2), { hat: pr() < 0.1 });
      for (let k = 0; k < 14; k++) folk(44 + pr() * 92, Y(1051 + pr() * 2));
    }
    // live: a white-and-blue local train through the station, a red limited express the other way
    const coach = (body, stripe, nose) => {
      const out = new HiCanvas(39, 7);
      const FL = 39 * S;
      const FH = 7 * S;
      for (let j = 0; j < FH; j++)
        for (let X = 0; X < FL; X++) {
          if ((X < 1 || X > FL - 2) && (j < 1 || j > FH - 2)) continue;
          let c;
          if (j < 12) {
            // the roof seen from above: curved, its ventilators and air conditioners
            c = j < 2 ? scaleColor(body, 1.1) : j < 10 ? scaleColor(body, 0.82) : scaleColor(body, 0.62);
            if ((X - 6) % 39 < 12 && j > 2 && j < 9) c = j === 3 ? 0xd0d4d8 : (X + j) % 3 ? 0x8a8e94 : 0x5a5e64;
            if (X % 39 === 24 && j > 2 && j < 10) c = 0x4a4e54;
          } else {
            c = j >= FH - 4 ? stripe : body;
            if (j >= 13 && j <= 15 && X % 12 < 8 && X % 12 > 1) c = C.glass[(X >> 2) & 1];
            if (X % 39 < 5 && j >= 13) c = j === FH - 1 ? 0x2a2a30 : X % 39 === 2 ? 0x3a4858 : scaleColor(body, 0.92);
            if (j === FH - 1) c = 0x2a2a30;
          }
          out.px(X, j, c);
        }
      if (nose) {
        const Xs = nose > 0 ? FL - 9 : 0;
        for (let j = 12; j < 18; j++) for (let i = 0; i < 9; i++) out.px(Xs + i, j, C.glass[0]);
        const Xh = nose > 0 ? FL - 2 : 1;
        out.px(Xh, FH - 3, 0xfff0c8);
        out.px(Xh, 13, 0xfff0c8);
      }
      for (let X = 0; X < FL; X += 1) if (X % 117 === 0) for (let j = 0; j < FH; j++) out.px(X, j, 0x1a1a20);
      return kit.frame(tod.frame(out, 1040));
    };
    const local = [coach(0xeef0f2, 0x2a5aa8, 1), coach(0xeef0f2, 0x2a5aa8), coach(0xeef0f2, 0x2a5aa8), coach(0xeef0f2, 0x2a5aa8, -1)];
    const express = [coach(0xc8302a, 0xf0ece4, -1), coach(0xc8302a, 0xf0ece4), coach(0xc8302a, 0xf0ece4), coach(0xc8302a, 0xf0ece4, 1)];
    kit.path([[-200, 1046], [400, 1046]], local, { sp: 38, n: 4, gap: 41, turn: 'none', cars: 1, s0: 0.55 });
    kit.path([[400, 1034], [-200, 1034]], express, { sp: 52, n: 4, gap: 41, turn: 'none', cars: 1, s0: 0.05 });
    // the station, a clock on its gable, its plaza north of it: patterned flags, flower beds, the taxi rank and bus
    // bays, the hand bath and on it the bronze of old Kumahachi, who made Beppu's name, his arms up, a small oni
    // clinging to his coat
    block(56, Y(1092), 68, 16, 12, { roof: 0xb4aea4, wall: 0xe8e2d6, items: ['ac', 'hut'], door: true, sign: 0x2a5aa8 });
    objects.push({
      y: Y(1092) + 16.5,
      draw: () => {
        // the concourse's long gabled roof with a skylight along its ridge, a clock on the gable
        roofPx(70, Y(1092) + 1, 40, 13, Y(1092) + 6, 0, ROOF.blue, false, 'metal', 77);
        const X0 = 74 * S;
        const YR = (Y(1092) + 6) * S;
        for (let X = X0; X < 106 * S; X++) for (let j = -3; j < 4; j++) img.px(X, YR + j, X % 12 === 0 ? 0x5a6e80 : j < 0 ? 0xc8dce4 : 0x9ab8c8);
        const CX = 90 * S;
        const CY = (Y(1092) + 11) * S;
        img.discPx(CX, CY, 5.4, 0x3a3e44);
        img.discPx(CX, CY, 4.4, 0xf4f4ee);
        for (let k = 0; k < 4; k++) img.px(CX, CY - k, 0x1a1a20);
        for (let k = 0; k < 3; k++) img.px(CX + k, CY, 0x1a1a20);
      },
    });
    {
      const X0 = 30 * S;
      const X1 = 150 * S;
      const YT = Y(1118) * S;
      const YB = Y(1093) * S;
      for (let Yr = YT; Yr < YB; Yr++)
        for (let X = X0; X < X1; X++) {
          const inBand = (X >> 4) % 4 === 0 || (Yr >> 4) % 4 === 0;
          const joint = X % 8 === 0 || Yr % 8 === 0;
          const t = hashPx(X >> 3, Yr >> 3, 87);
          img.px(X, Yr, joint ? 0x7a766c : inBand ? rampColor([0x8a7a6a, 0x968676, 0xa29282], t, X, Yr) : rampColor([0xa8a498, 0xb4b0a4, 0xc0bcb0], t, X, Yr));
        }
      reserveRect(30, Y(1118), 120, 26);
      // the kerbed road round the plaza: taxis on the east, buses on the west
      const bay = (x0, x1) => {
        for (let Yr = Y(1114) * S; Yr < Y(1098) * S; Yr++)
          for (let X = x0 * S; X < x1 * S; X++) {
            const e = Math.min(X - x0 * S, x1 * S - 1 - X, Yr - Y(1114) * S, Y(1098) * S - 1 - Yr);
            img.px(X, Yr, e < 2 ? 0xa8a8a8 : rampColor(C.asphalt, 0.3 + hashPx(X >> 2, Yr >> 2, 88) * 0.4, X, Yr));
          }
      };
      bay(34, 70);
      bay(110, 146);
      const bus = (x, y, c, c2) => {
        objects.push({
          y: y + 6,
          shadow: () => shadowRect(x + 1, y + 1, 18, 6, 0.6),
          draw: () => {
            for (let j = 0; j < 18; j++)
              for (let i = 0; i < 54; i++) {
                if ((i === 0 || i === 53) && (j === 0 || j === 17)) continue;
                let col = j < 1 ? scaleColor(c, 1.2) : j > 15 ? c2 : j > 12 ? scaleColor(c, 0.82) : c;
                if (j > 11 && j < 15 && i % 7 > 1) col = C.glass[1];
                if (j > 1 && j < 10 && (i - 8) % 16 < 8) col = (j === 2 || i % 3 === 0) ? 0xd8dce0 : 0x9a9ea4;
                if (i > 49 && j > 1 && j < 16) col = C.glass[0];
                img.px(x * S + i, y * S + j, col);
              }
          },
        });
      };
      bus(38, Y(1110), 0xe8d8a0, 0x3a6a4a);
      bus(38, Y(1102), 0xe8e8ec, 0xc8302a);
      for (let k = 0; k < 5; k++) car(114 + k * 6, Y(1110), true, k % 2 ? 0xf0e8d0 : 0x2a2a30);
      car(120, Y(1100), false, 0xf0e8d0);
      // bus shelters, a queue in each, a flower bed down the middle of the plaza
      for (const x of [40, 56]) {
        objects.push({
          y: Y(1116) + 4,
          shadow: () => shadowRect(x + 1, Y(1116) + 1, 10, 3, 0.7),
          draw: () => {
            for (let j = 0; j < 9; j++) for (let i = 0; i < 30; i++) img.px(x * S + i, Y(1116) * S + j, j === 0 ? 0xc8d4dc : j > 6 ? 0x4a5a6a : i % 6 === 0 ? 0x6a7e90 : 0x8aa0b0);
          },
        });
        crowd(x, Y(1114), 10, 1, 3, true);
      }
      const bed = (x0, x1, y0, h) =>
        img.fine(x0, y0, x1 - x0, h, (X, Yr) => {
          const e = Math.min(X - x0 * S, Yr - y0 * S, x1 * S - 1 - X, (y0 + h) * S - 1 - Yr);
          if (e < 2) return e === 0 ? 0xd8d4c8 : 0x8a867c;
          const t = hashPx(X >> 1, Yr >> 1, 89);
          return t < 0.12 ? 0xe86a9a : t < 0.22 ? 0xf0d040 : t < 0.3 ? 0xf0f0e8 : t < 0.65 ? 0x3e7a3a : 0x2e5e2e;
        });
      bed(96, 106, Y(1116), 18);
      // the hand bath, steam off its basin; the bronze on his plinth
      {
        const CX = 79 * S;
        const CY = Y(1110) * S;
        const cx = 79;
        img.discPx(CX, CY, 12, 0x6a665e);
        img.discPx(CX, CY, 10.5, 0x9a968a);
        img.discPx(CX, CY, 8, rampColor(C.milk, 0.5, CX, CY));
        img.discPx(CX - 2, CY - 2, 3.4, 0xc8e4ec);
        objects.push({
          y: Y(1110) + 3,
          draw: () => {
            for (let j = 0; j < 12; j++) for (let i = 0; i < 9; i++) img.px(CX - 4 + i, CY - 10 + j, i === 0 ? C.stone[3] : i === 8 ? C.stone[0] : C.stone[2]);
            const bz = 0x5a7a68;
            const bz2 = 0x3a5a4c;
            for (let j = 0; j < 12; j++) for (let i = 0; i < 5; i++) img.px(CX - 2 + i, CY - 21 + j, i === 0 ? bz : i === 4 ? bz2 : j < 3 ? 0x4e6e5c : bz);
            img.discPx(CX + 0.5, CY - 24, 2.6, bz);
            img.px(CX - 1, CY - 25, 0x7a9a88);
            for (let k = 0; k < 6; k++) {
              img.px(CX - 3 - k, CY - 21 - k, bz);
              img.px(CX + 3 + k, CY - 21 - k, bz2);
            }
            img.rectPx(CX + 2, CY - 13, 3, 4, 0x8a4a3a); // the little oni on his cloak
            img.px(CX + 2, CY - 14, 0xc8c0a0);
            img.px(CX + 4, CY - 14, 0xc8c0a0);
          },
        });
        plume(cx, Y(1110), 0.5, { front: true });
        crowd(cx - 7, Y(1104), 14, 2, 5, true);
      }
      // people crossing the plaza from the station to the avenue (live)
      const pr = rng(6652);
      for (const [c, x0, x1] of [[0x3a6ad0, 84, 88], [0xd04040, 96, 92], [0xe8e8f0, 86, 90], [0x2b3c78, 94, 92]])
        kit.path([[x0, 1094], [x1, 1120]], [stepper(c, 0, 1100), stepper(c, 1, 1100)], { sp: 3.5, mode: 'pp', hold: 2, turn: 'none', fps: 3, s0: pr() });
    }
    // Ekimae-dōri up from the station, cross streets; the turret's stand on an island the traffic goes round
    {
      const ISLES = [...pads, ...vents].filter((p) => p.x === 90 && p.u > 1120 && p.u < TOWN[1]).sort((a, b) => a.u - b.u);
      vRoad(90, 6, 1112, TOWN[1]);
      for (const u of [1300, 1560, 1820, 2064]) hRoad(u, 4);
      // (the road crossings: the kerbs give way, zebras on all sides)
      for (const u of [1300, 1560, 1820, 2064]) {
        img.fine(84, Y(u + 5), 12, 10, (X, Yr) => rampColor(C.asphalt, 0.3 + hashPx(X >> 3, Yr >> 3, 36) * 0.4, X, Yr));
        zebra(84 * S, Y(u - 5) * S, 96 * S, Y(u - 8) * S, true);
        zebra(84 * S, Y(u + 8) * S, 96 * S, Y(u + 5) * S, true);
        zebra(76 * S, Y(u + 4) * S, 83 * S, Y(u - 4) * S, false);
        zebra(97 * S, Y(u + 4) * S, 104 * S, Y(u - 4) * S, false);
      }
      const R = 24;
      for (const P of ISLES) {
        const CU = P.u;
        img.fine(90 - R - 3, Y(CU) - R - 3, 2 * R + 6, 2 * R + 6, (X, Yr, x, y) => {
          const d = Math.hypot(x - 90, y - Y(CU));
          if (d > R + 2.5) return null;
          if (d > R + 0.8) return rampColor(C.walk, hashPx(X >> 2, Yr >> 2, 34), X, Yr);
          if (d > R) return 0xa8a8a8;
          if (d > 13) {
            const c = rampColor(C.asphalt, 0.2 + hashPx(X >> 3, Yr >> 3, 36) * 0.5, X, Yr);
            return Math.abs(d - 18.5) < 0.25 && Math.floor(Math.atan2(y - Y(CU), x - 90) * 9) % 2 ? 0xd8d8d0 : c;
          }
          if (d > 11.8) return 0xc8c8c0;
          const t = hashPx(X >> 1, Yr >> 1, 90);
          return t < 0.1 ? 0xe86a9a : t < 0.18 ? 0xf0f0e8 : t < 0.6 ? 0x3e7a3a : 0x2e5e2e;
        });
        reserveRect(90 - R - 2, Y(CU) - R - 2, 2 * R + 4, 2 * R + 4);
      }
      // live: the traffic on the avenue, keeping left, round the islands clockwise
      const up = [[87, 1116]];
      for (const P of ISLES) {
        up.push([87, P.u - 26]);
        for (let a = -Math.PI / 2 + 0.35; a <= Math.PI / 2 - 0.35; a += 0.25) up.push([90 - Math.cos(a) * 18.5, P.u + Math.sin(a) * 18.5]);
        up.push([87, P.u + 26]);
      }
      up.push([87, TOWN[1] + 10]);
      const dn = up.map(([x, u]) => [180 - x, u]).reverse();
      for (const [c, s0] of [[0xe8e8ec, 0.04], [0xc03a30, 0.22], [0x3a5a9a, 0.41], [0x2a2a30, 0.63], [0xe8d8a0, 0.82]]) kit.path(up, [carF(c, 1500)], { sp: 22, turn: 'rot', fps: 1, s0 });
      for (const [c, s0] of [[0x9aa0a8, 0.11], [0xf0e8d0, 0.33], [0x4a7a5a, 0.55], [0xe8e8ec, 0.77], [0x2a2a30, 0.93]]) kit.path(dn, [carF(c, 1500)], { sp: 22, turn: 'rot', fps: 1, s0 });
    }
    // the side streets of downtown, off the avenue and the cross streets; shops along the busiest
    streets(
      [[1190, 0, 84], [1190, 96, W], [1424, 0, 84, 3], [1430, 131, W], [1640, 0, 84], [1640, 96, W], [1785, 0, 84], [1785, 96, W]],
      [[24, 1190, 1296], [164, 1190, 1296], [60, 1304, 1556], [150, 1304, 1556], [20, 1564, 1816], [162, 1564, 1816]],
    );
    shopRow(30, 82, 1190);
    shopRow(98, 152, 1190);
    shopRow(26, 84, 1640);
    shopRow(98, 156, 1640);
    shopRow(26, 84, 1785);
    for (let u = 1130; u < TOWN[1]; u += 28) {
      if (!anyRes(79, Y(u), 2, 2)) tree('broadleaf', 81, Y(u), 2.5);
      if (!anyRes(99, Y(u + 14), 2, 2)) tree('broadleaf', 99, Y(u + 14), 2.5);
    }
    // the Harukigawa: a walled canal across downtown, warm water with mist on it, the avenue over it on a bridge, red
    // footbridges up and down, ducks
    {
      const CU = (x) => 1700 + 6 * Math.sin(x / 40);
      const HW = 9;
      const seedC = 93;
      for (let Yr = Y(1700 + 6 + HW + 3) * S; Yr < Y(1700 - 6 - HW - 3) * S; Yr++)
        for (let X = 0; X < W * S; X++) {
          const x = (X + 0.5) / S;
          const a = L - (Yr + 0.5) / S - CU(x);
          const d = Math.abs(a);
          if (d > HW + 2.5) continue;
          if (x > 80 && x < 100) continue;
          let c;
          if (d > HW + 1.5) c = 0xb0ac9e;
          else if (d > HW) c = a > 0 ? rampColor(C.stone, 0.4 + hashPx(X >> 2, Yr >> 1, seedC) * 0.3, X, Yr) : 0x5a564e; // (the north wall's face shows; the south is its top)
          else {
            const r = Math.sin(x * 1.1 + a * 2.6 + 2 * fbm(x, a, { seed: 94, scale: 5 }));
            c = rampColor([0x2e5a60, 0x3a6c70, 0x4e8280, 0x6a9a94], 0.5 + r * 0.25 - a * 0.015, X, Yr);
            if (r > 0.94) c = 0xa8ccc8;
            if (a > HW - 2) c = scaleColor(c, 0.68);
          }
          img.px(X, Yr, c);
        }
      for (let u = 1700 - 6 - HW - 3; u < 1700 + 6 + HW + 3; u++) for (let x = 0; x < W; x++) if (Math.abs(u - CU(x)) < HW + 3.5) reserved[Y(u) * W + x] = 1;
      // the avenue's bridge: stone parapets carrying lamps
      for (const X of [83 * S, 97 * S - 1])
        for (let Yr = Y(CU(90) + HW + 3) * S; Yr < Y(CU(90) - HW - 3) * S; Yr++) for (let i = 0; i < 3; i++) img.px(X + i, Yr, i === 0 ? 0xb8b4a8 : i === 1 ? 0x9a968a : 0x5a564e);
      for (const x of [84, 96]) for (const off of [-HW - 2, HW + 2]) lampPost(x, Y(CU(90) + off));
      const foot = (x) => {
        const c = CU(x);
        const XL = (x - 4) * S;
        const XR = (x + 4) * S;
        const YT = Y(c + HW + 3) * S;
        const YB = Y(c - HW - 3) * S;
        for (let Yr = YT; Yr < YB + 4; Yr++) for (let X = XL + 2; X < XR + 5; X++) img.tintPx(X, Yr + 3, 0.72);
        for (let Yr = YT; Yr < YB; Yr++)
          for (let X = XL; X < XR; X++) {
            const e = Math.min(X - XL, XR - 1 - X);
            img.px(X, Yr, e < 2 ? (Yr % 12 < 2 ? 0x8a2a20 : 0xd8402e) : Yr % 4 === 0 ? 0x5e4430 : hashPx(X >> 2, Yr >> 2, 95) < 0.5 ? 0x8e6a4a : 0x76583e);
          }
        folk(x - 2, Y(c + 4));
      };
      foot(20);
      foot(162);
      const ducks = [0, 1].map((f) => {
        const r = new HiCanvas(5, 3);
        for (let i = 2; i < 10; i++) for (let j = 3; j < 6; j++) r.px(i, j, j === 3 ? 0x8a6a4a : 0x6a5038);
        r.px(10, 3, 0x2e6a3a);
        r.px(11, 3, 0x2e6a3a);
        r.px(12, 3, 0xe8b830);
        r.px(9, 4, 0xf4f0e6);
        r.px(1, f ? 4 : 5, 0xd8e8e8, 0.6);
        r.px(0, f ? 5 : 4, 0xd8e8e8, 0.4);
        return kit.frame(tod.frame(r, 1700));
      });
      kit.wander(50, 1700, 22, 3, ducks, { n: 3, sp: 2.5, idle: 0.4, turn: 'flip', fps: 2 });
      kit.wander(130, 1704, 20, 3, ducks, { n: 2, sp: 2.5, idle: 0.4, turn: 'flip', fps: 2 });
      kit.emit(58, 1706, [3, 4, 5].map(puffFrames), { rate: 0.7, life: [2.5, 3.5], vy: 4, sx: 8, wf: 0.8, a: 0.34, d: 1.1, tint: 1 });
      kit.emit(120, 1694, [3, 4, 5].map(puffFrames), { rate: 0.7, life: [2.5, 3.5], vy: 4, sx: 8, wf: 0.8, a: 0.34, d: 1.1, tint: 1 });
    }
    // Beppu Tower: a steel lattice tower, its four legs braced, the observation deck, the lit sign down its face
    {
      const x = 156;
      const y = Y(1150);
      const CX = (x + 7) * S + 1;
      const YB = y * S;
      const H = 46 * S;
      const hwAt = (j) => 18 - (j / H) * 13.5 - Math.max(0, 4 - j * 0.4);
      objects.push({
        y: y + 6,
        shadow: () => {
          for (let k = 0; k < 40 * S; k++) {
            const sw = 1 + Math.max(0, 12 - k / 8);
            for (let t = -sw; t <= sw; t++) img.tintPx(x * S + 18 + k, y * S + 12 + Math.floor(k * 0.55) + t, 0.72);
          }
        },
        draw: () => {
          img.fine(x, y, 14, 6, (X, Yr) => (X % 9 === 0 || Yr % 6 === 0 ? 0x6a665e : rampColor(C.stone, 0.4 + hashPx(X >> 2, Yr >> 2, 96) * 0.4, X, Yr)));
          for (let j = 0; j < H; j++) {
            const hw = hwAt(j);
            const Yr = YB - j;
            for (const sx of [-1, 1]) {
              const c = sx < 0 ? 0xa0a6ae : 0x62686f;
              img.px(Math.round(CX + sx * hw), Yr, c);
              img.px(Math.round(CX + sx * hw) + sx, Yr, scaleColor(c, 0.8));
              img.px(Math.round(CX + sx * hw * 0.38), Yr, sx < 0 ? 0x8a9098 : 0x565c64);
            }
            // the bracing, crossing every panel
            const panel = j % 18;
            const t = panel / 18;
            const a = Math.round(CX - hw + t * 2 * hw);
            const b = Math.round(CX + hw - t * 2 * hw);
            img.px(a, Yr, 0xb0b6be);
            img.px(b, Yr, 0x7a8088);
            if (panel === 0) for (let i = Math.ceil(CX - hw); i <= CX + hw; i++) img.px(i, Yr, 0x8a9098);
          }
          // the deck
          const DY = YB - H - 15;
          for (let j = 0; j < 21; j++)
            for (let i = -18; i < 18; i++) {
              let c = 0xe8ecef;
              if (j === 0) c = 0xffffff;
              else if (j < 5) c = 0xc8ccd0;
              else if (j >= 7 && j < 16) c = (i + 18) % 4 === 0 ? 0x8a9098 : C.glass[j < 11 ? 1 : 0];
              else if (j >= 18) c = 0x8a9098;
              if (i === -18) c = 0xffffff;
              if (i === 17) c = scaleColor(c, 0.7);
              img.px(CX + i, DY + j, c);
            }
          for (let j = 0; j < 30; j++) {
            img.px(CX, DY - j, 0x7a7e84);
            if (j < 12) img.px(CX + 1, DY - j, 0x5a5e64);
          }
          for (const k of [6, 14]) for (let i = -3; i <= 3; i++) img.px(CX + i, DY - k, 0x8a8e94);
          glowPx(CX, DY - 30, 0xff4a3a, 1);
          glowPx(CX + 1, DY - 30, 0xff8a7a, 0.8);
          // the sign down the face, big letters in red
          const sr = rng(1150);
          for (let j = 0; j < 72; j++) for (let i = 0; i < 9; i++) img.px(CX - 4 + i, YB - 12 - j, 0xf4f0e6);
          for (let k = 0; k + 8 < 72; k += 9) glyph(CX - 3, YB - 80 + k, 7, 0xd8302a, sr);
          glow(x + 7, y - 62, 0xff4a3a);
        },
      });
      reserveRect(x - 2, y - 62, 18, 70);
      // the tower's light strings chasing up its legs, all day long (live)
      const frames = [0, 1, 2, 3].map((k) => {
        const r = new HiCanvas(15, 64);
        for (let j = 0; j < H; j += 5) {
          if (Math.floor(j / 5) % 4 !== k) continue;
          const hw = hwAt(j);
          for (const sx of [-1, 1]) {
            const X = Math.round(22 + sx * hw);
            const Yr = 62 * S - j;
            r.px(X, Yr, 0xfff0a0);
            r.px(X + 1, Yr, 0xfff0a0, 0.6);
            r.px(X - 1, Yr, 0xfff0a0, 0.6);
            r.px(X, Yr + 1, 0xfff0a0, 0.6);
          }
        }
        return kit.frame(r);
      });
      kit.loop(x, U(y - 62), frames, { fps: 8, fx: 1 });
    }
    // the covered shopping arcade (Yayoi Tengai): a long ribbed roof with a band of skylight down the middle, its
    // gates at both ends on the cross streets, a crowd going in and out
    {
      const x = 114;
      const YT = Y(1550) * S;
      const YB = Y(1310) * S;
      const X0 = x * S;
      const X1 = (x + 13) * S;
      for (let Yr = YT; Yr < YB; Yr++) for (let X = X1; X < X1 + 8; X++) img.tintPx(X, Yr + 4, 0.6);
      for (let Yr = YT; Yr < YB; Yr++)
        for (let X = X0; X < X1; X++) {
          const a = X - X0;
          const rib = (Yr - YT) % 24 < 2;
          const mid = Math.abs(a - 19) < 5;
          let c;
          if (a < 2 || a > 36) c = a < 2 ? 0x8a8e94 : 0x4a4e54;
          else if (a < 4 || a > 34) c = 0x6a6e74;
          else if (rib) c = 0x7a8088;
          else if (mid) c = (Yr - YT) % 6 === 0 ? 0xa8c4cc : Math.abs(a - 19) < 1 ? 0xe0ecf0 : 0xc8dce0;
          else c = a < 19 ? ((a % 3 === 0) ? 0xc4cac8 : 0xd8dedc) : a % 3 === 0 ? 0xa8b0ae : 0xbcc4c2;
          if (hashPx(X >> 2, Yr >> 3, 97) < 0.05 && !mid) c = scaleColor(c, 0.9);
          img.px(X, Yr, c);
        }
      for (const end of [YT - 6, YB]) {
        const r = rng(end);
        for (let j = 0; j < 6; j++) for (let i = -3; i < X1 - X0 + 3; i++) img.px(X0 + i, end + j, j === 0 ? 0xe8e4d8 : j === 5 ? 0x2a2622 : 0xc8302a);
        for (let k = 0; k < 5; k++) glyph(X0 + 5 + k * 6, end + 1, 4, 0xf8f4ec, r);
      }
      reserveRect(x - 1, Y(1550), 15, 240);
      for (let u = 1320; u < 1550; u += 40) glow(x + 6, Y(u), C.warm, 0.7);
      {
        const YW0 = Y(1436) * S;
        const YW1 = Y(1426) * S;
        const XW = 100 * S;
        for (let Yr = YW0 + 4; Yr < YW1 + 8; Yr++) for (let X = XW; X < X0; X++) img.tintPx(X, Yr, Yr >= YW1 ? 0.62 : 1);
        for (let Yr = YW0; Yr < YW1; Yr++)
          for (let X = XW; X < X0; X++) {
            const a = Yr - YW0;
            const mid = Math.abs(a - 15) < 4;
            img.px(X, Yr, a < 2 ? 0x8a8e94 : a > 27 ? 0x4a4e54 : (X - XW) % 24 < 2 ? 0x7a8088 : mid ? (Math.abs(a - 15) < 1 ? 0xe0ecf0 : 0xc8dce0) : a < 15 ? 0xd8dedc : 0xbcc4c2);
          }
        const r = rng(1431);
        for (let Yr = YW0 - 2; Yr < YW1 + 2; Yr++) for (let i = 0; i < 6; i++) img.px(XW + i, Yr, i === 0 ? 0xe8e4d8 : i === 5 ? 0x2a2622 : 0xc8302a);
        for (let k = 0; k < 4; k++) glyph(XW + 1, YW0 + 1 + k * 7, 4, 0xf8f4ec, r);
        reserveRect(99, Y(1437), 16, 12);
        crowd(99, Y(1426), 3, 3, 3, true);
        // the shops' awnings stick out along the east flank
        const aw = rng(1432);
        for (let u = 1320; u < 1545; u += 18) {
          const c = aw.pick([0xc8302a, 0x2a6ac8, 0xe8c040, 0x3a8a4a, 0xf0ece4]);
          const YY = Y(u) * S;
          for (let j = 0; j < 30; j++) for (let i = 0; i < 6; i++) img.px(X1 + i, YY + j, i === 5 ? scaleColor(c, 0.6) : (j >> 2) % 2 ? c : 0xf4f0e6);
        }
        reserveRect(127, Y(1550), 4, 240);
      }
      crowd(x, Y(1308), 13, 2, 6, true);
      crowd(x, Y(1558), 13, 4, 7, true);
    }
    // Takegawara Onsen: the dark-tiled wooden bathhouse with its curved karahafu gable and its own little street
    {
      const x = 8;
      const y = Y(1470);
      const X0 = x * S;
      const Y0 = y * S;
      objects.push({
        y: y + 38,
        shadow: () => shadowRect(x + 4, y + 4, 44, 38, 0.5),
        draw: () => {
          const ramp = ROOF.dark;
          roofPx(x, y, 44, 26, y + 10, 12, ramp, true, 'tile', 41);
          // the ridge's demon-faced end tiles
          for (const ox of [x + 12, x + 31]) for (let j = -2; j < 5; j++) for (let i = 0; i < 4; i++) img.px(ox * S + i, (y + 10) * S + j, j < 1 ? 0x8a8e96 : 0x4a4850);
          // the karahafu over the entrance: its roof swelling out and curving down to both sides, the white bargeboard
          const GX = (x + 22) * S;
          for (let X = (x + 9) * S; X < (x + 35) * S; X++) {
            const k = Math.abs(X - GX) / (13 * S);
            const top = (y + 18) * S + Math.round((Math.sin(k * Math.PI - Math.PI / 2) * 0.5 + 0.5) * 15) - Math.round((1 - k) * 4);
            const bot = (y + 28) * S;
            for (let Yr = top; Yr < bot; Yr++) {
              const e = Yr - top;
              let c = e < 2 ? 0xd8d0c0 : e < 4 ? 0xa8a090 : e % 3 === 0 ? scaleColor(ramp[2], 0.8) : X % 3 === 0 ? scaleColor(ramp[2], 1.1) : ramp[2];
              if (X < GX - 18 && e > 3) c = scaleColor(c, 1.1);
              img.px(X, Yr, c);
            }
          }
          const FY = (y + 28) * S;
          const FH = 10 * S;
          for (let j = 0; j < FH; j++)
            for (let X = X0 + 3; X < X0 + 43 * S; X++) {
              let c;
              if (j < 2) c = 0x1a1410;
              else if (j >= FH - 2) c = 0x5a564c;
              else if ((X - X0) % 12 === 0) c = C.wood[0];
              else if (j < 12) c = (X - X0) % 4 === 0 ? C.wood[0] : (X - X0) % 2 ? 0xd8c8a8 : C.wood[2];
              else c = (X - X0) % 2 === 0 ? C.wood[0] : C.wood[1];
              img.px(X, FY + j, c);
            }
          // the doorway, the indigo noren, the lanterns
          for (let j = 2; j < FH; j++) for (let i = 0; i < 24; i++) img.px((x + 18) * S + i, FY + j, 0x1e1814);
          for (let j = 2; j < 13; j++)
            for (let i = 1; i < 23; i++) {
              if (j > 8 && i % 7 === 0) continue;
              img.px((x + 18) * S + i, FY + j, j === 2 ? 0x3a4e98 : i % 7 === 3 && j === 6 ? 0xf0e8d8 : 0x2b3c78);
            }
          for (const lx of [x + 16, x + 27]) {
            for (let j = 0; j < 6; j++) for (let i = 0; i < 5; i++) if (Math.hypot(i - 2, j - 2.5) < 3) glowPx(lx * S + i, FY + 3 + j, j % 2 ? 0xffd080 : 0xffb050, 0.95);
          }
          pool(x + 22, y + 39, 11, 0xffb050, 0.2);
        },
      });
      reserveRect(x - 2, y - 2, 48, 42);
      // the forecourt down to its street
      img.fine(x + 2, y + 38, 40, 7, (X, Yr) => (X % 10 === 0 || Yr % 6 === 0 ? 0x6a665e : rampColor(C.stone, 0.45 + hashPx(X >> 2, Yr >> 2, 98) * 0.3, X, Yr)));
      reserveRect(x + 2, y + 38, 40, 7);
      crowd(x + 6, y + 40, 32, 3, 7, true, { yukata: true });
      signPost(x + 42, y + 44);
      plume(x + 6, y + 2, 1.3);
      plume(x + 40, y + 4, 1);
    }
    // people and bicycles along the cross streets, up to the avenue and back: its traffic has the crossing
    {
      const cyclist = (c, f, u) => {
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
        for (let i = 4; i < 11; i++) out.px(i, 7, 0x101418, 0.3);
        return kit.frame(tod.frame(out, u));
      };
      const pr = rng(6741);
      for (const u of [1300, 1560, 1820, 2064]) {
        for (const [x0, x1] of [[-8, 72], [108, 188]]) {
          const c = pr.pick([0x3a6ad0, 0xe8e8f0, 0xc83a2a, 0x2a2a30]);
          const ou = pr() < 0.5 ? 2 : -3;
          kit.path([[x0, u + ou], [x1, u + ou]], [cyclist(c, 0, u), cyclist(c, 1, u)], { sp: 11 + pr() * 4, mode: 'pp', hold: 1, turn: 'flip', fps: 4, s0: pr() });
          for (let k = 0; k < 2; k++) {
            const p = pr.pick(COATS);
            const off = pr() < 0.5 ? 6 : -5;
            kit.path([[x0, u + off], [x1, u + off]], [stepper(p, 0, u), stepper(p, 1, u)], { sp: 3.5 + pr(), mode: 'pp', hold: 2, turn: 'none', fps: 3, s0: pr() });
          }
        }
      }
      kit.path([[2, 1421], [80, 1421]], [stepper(0x2b3c78, 0, 1424, true), stepper(0x2b3c78, 1, 1424, true)], { sp: 3, mode: 'pp', hold: 3, turn: 'none', fps: 3, s0: 0.3 });
      kit.path([[8, 1427], [78, 1427]], [cyclist(0xe8c040, 0, 1424), cyclist(0xe8c040, 1, 1424)], { sp: 9, mode: 'pp', hold: 1, turn: 'flip', fps: 4, s0: 0.6 });
    }
    // a few taller hotels and inns downtown
    if (!anyRes(26, Y(1774), 40, 42)) block(26, Y(1774), 40, 16, 26, { balcony: true, sign: 0xc8302a, bigMark: true, items: ['ac', 'tank', 'bath'] });
    town(1060, 1300, { pBlock: 0.4, pPark: 0.06 });
    town(1306, 1560, { pBlock: 0.35, pPark: 0.04 });
    town(1566, 1820, { pBlock: 0.3 });
    // Beppu Park, under its old pines: gravel walks crossing at a round pond, a playground, picnics, the slender Global
    // Tower by its north-west corner, the turret stands on two round terraces
    {
      const U0 = 1832;
      const U1 = 2056;
      const edge = 0xb0ac9e;
      const free = [];
      const gravelW = (pts, hw) => {
        for (let k = 0; k + 1 < pts.length; k++) {
          const [x0, u0] = pts[k];
          const [x1, u1] = pts[k + 1];
          const n = Math.ceil(Math.hypot(x1 - x0, u1 - u0) * 2);
          for (let t = 0; t <= n; t++) {
            const x = x0 + ((x1 - x0) * t) / n;
            const u = u0 + ((u1 - u0) * t) / n;
            free.push([x, u, hw + 3]);
            for (let Yr = Math.floor((L - u - hw) * S); Yr <= (L - u + hw) * S; Yr++)
              for (let X = Math.floor((x - hw) * S); X <= (x + hw) * S; X++) {
                const d = Math.hypot((X + 0.5) / S - x, L - (Yr + 0.5) / S - u);
                if (d > hw) continue;
                const g = hashPx(X, Yr, 191);
                img.px(X, Yr, d > hw - 0.4 ? C.gravel[0] : g < 0.1 ? scaleColor(C.gravel[0], 0.82) : g > 0.92 ? 0xd0c4ae : rampColor(C.gravel, hashPx(X >> 1, Yr >> 1, 192), X, Yr));
              }
          }
        }
      };
      // the lawn
      img.fine(0, Y(U1), W, U1 - U0, (X, Yr, x, y) => {
        if (x > 82 && x < 98) return null;
        let c = rampColor(C.lawn, 0.25 + fbm(x, y, { seed: 65, scale: 7, octaves: 2 }) * 0.6, X, Yr);
        const t = hashPx(X >> 1, Yr >> 1, 9);
        if (t < 0.12) c = scaleColor(c, 0.84);
        else if (t > 0.9) c = scaleColor(c, 1.14);
        return c;
      });
      // its low wall along the streets
      for (const u of [U0, U1]) for (let X = 0; X < W * S; X++) if (X < 82 * S || X >= 98 * S) for (let j = 0; j < 3; j++) img.px(X, Y(u) * S + j, j === 0 ? 0xd0ccc0 : j === 1 ? edge : 0x6a665c);
      const padsHere = pads.filter((p) => p.u > U0 && p.u < U1);
      const CX = 136;
      const CU = 1944;
      gravelW([[0, 1950], [40, 1944], [82, 1946]], 3);
      gravelW([[98, 1946], [CX - 26, CU], [CX + 26, CU], [W, 1958]], 3);
      gravelW([[CX, U0 + 2], [CX, CU - 14]], 3);
      gravelW([[CX, CU + 14], [CX, U1 - 2]], 3);
      gravelW([[40, U0 + 2], [40, 1944], [40, U1 - 2]], 3);
      for (const p of padsHere) gravelW([[p.x, 1950], [p.x, p.u - 14]], 2.5);
      // the terraces under the stands
      for (const p of padsHere) {
        const y = Y(p.u);
        img.fine(p.x - 16, y - 16, 32, 32, (X, Yr, xx, yy) => {
          const d = Math.hypot(xx - p.x, yy - y);
          if (d > 15) return null;
          if (d > 14.2) return 0xd0ccc0;
          return (X + Yr) % 12 === 0 ? 0x8a867c : rampColor(C.stone, 0.5 + hashPx(X >> 2, Yr >> 2, 99) * 0.3, X, Yr);
        });
        free.push([p.x, p.u, 20]);
      }
      // the round pond and its island, the bridge to it
      hotPool(CX, CU, 22, 13, [0x2e5a60, 0x3a6c70, 0x4e8280, 0x6a9a94], 201, C.stone);
      free.push([CX, CU, 30]);
      {
        const X = CX * S;
        const Yr = Y(CU) * S;
        img.discPx(X, Yr, 13, 0x4a4438);
        img.discPx(X - 1, Yr - 1, 11, 0x4e7a3e);
        for (let i = -2; i <= 2; i++) img.discPx(X + i * 2, Yr - 2 + (i & 1) * 2, 3.4, i % 2 ? 0x2a5a2a : 0x3a6e30);
      }
      // the playground: slide, swings and sand, children (live)
      {
        const x0 = 104;
        const y0 = Y(1920);
        img.fine(x0, y0, 34, 24, (X, Yr) => rampColor([0xc8b48a, 0xd4c098, 0xe0cca8], hashPx(X >> 1, Yr >> 1, 100), X, Yr));
        free.push([x0 + 17, 1908, 20]);
        const X = x0 * S;
        const Yr = y0 * S;
        for (let k = 0; k < 24; k++) for (let i = 0; i < 6; i++) img.px(X + 12 + i, Yr + 12 + k, i === 0 || i === 5 ? 0xc83a2a : 0xe8e8e0);
        for (let j = 0; j < 12; j++) for (let i = 0; i < 10; i++) img.px(X + 10 + i, Yr + 3 + j, j === 0 ? 0xe8c040 : 0x3a6ad0);
        for (let i = 0; i < 36; i++) img.px(X + 34 + i, Yr + 12, 0x4a6aa0);
        for (const k of [8, 22]) {
          for (let j = 0; j < 9; j++) img.px(X + 34 + k, Yr + 12 + j, 0x8a8e94);
          for (let i = 0; i < 5; i++) img.px(X + 32 + k + i, Yr + 21, 0xc83a2a);
        }
        kit.wander(x0 + 16, 1908, 13, 8, [stepper(0xe8c040, 0, 1908), stepper(0xe8c040, 1, 1908)], { n: 4, sp: 7, idle: 0.5, turn: 'flip', fps: 5 });
      }
      // picnics under the trees: a blue sheet and a family
      const pr = rng(6661);
      for (const [x, u] of [[16, 1880], [60, 2000], [20, 2010], [158, 1890], [160, 2030], [66, 1880]]) {
        const X = x * S;
        const Yr = Y(u) * S;
        for (let j = 0; j < 12; j++) for (let i = 0; i < 18; i++) img.px(X + i, Yr + j, (i >> 2) % 2 === (j >> 2) % 2 ? 0x3a6ad0 : 0x7a9ae0);
        for (let k = 0; k < 3; k++) folk(x + 1 + pr() * 4, Y(u) + 1 + pr() * 2);
        free.push([x + 3, u - 2, 7]);
      }
      // Global Tower: a slim white blade with its deck, on a concourse
      {
        const x = 18;
        const u = 1960;
        const y = Y(u);
        const CXt = x * S;
        free.push([x, u - 2, 12], [x, u + 30, 14]);
        img.fine(x - 11, y - 3, 22, 13, (X, Yr) => (X % 9 === 0 || Yr % 9 === 0 ? 0x8a867c : rampColor(C.stone, 0.6 + hashPx(X >> 2, Yr >> 2, 101) * 0.3, X, Yr)));
        objects.push({
          y: y + 8,
          shadow: () => {
            for (let k = 0; k < 40 * S; k++) for (let t = -3; t <= 3; t++) img.tintPx(CXt + 12 + k, y * S + 15 + Math.floor(k * 0.55) + t, 0.72);
          },
          draw: () => {
            const H = 52 * S;
            for (let j = 0; j < H; j++) {
              const hw = 7 - (j / H) * 3;
              const Yr = (y + 6) * S - j;
              for (let i = Math.round(-hw); i <= hw; i++) img.px(CXt + i, Yr, i < -hw + 1.5 ? 0xffffff : i > hw - 2 ? 0x9aa0a8 : i === 0 ? 0xc8ccd0 : (j % 21 < 2 ? 0xc8ccd0 : 0xeef0f2));
            }
            const DY = (y + 6) * S - H - 9;
            for (let j = 0; j < 15; j++) for (let i = -12; i <= 12; i++) img.px(CXt + i, DY + j, j === 0 ? 0xffffff : j < 3 ? 0xd8dce0 : j < 12 ? (i % 4 === 0 ? 0x8a9098 : C.glass[1]) : 0x8a9098);
            for (let j = 0; j < 24; j++) img.px(CXt, DY - j, 0xc8ccd0);
            glowPx(CXt, DY - 24, 0xff4a3a, 1);
          },
        });
        crowd(x - 8, y + 2, 16, 6, 7, true);
      }
      // benches and lamps along the walks, people on them (live)
      for (const [xx, u] of [[60, 1950], [70, 1940], [120, 1950], [150, 1950], [46, 1990], [32, 1900]]) {
        lampPost(xx, Y(u + 7));
        free.push([xx, u + 7, 3]);
      }
      const nearFree = (x, u) => free.some(([fx, fu, r]) => Math.hypot(x - fx, u - fu) < r) || (x > 79 && x < 101) || u < U0 + 5 || u > U1 - 5;
      for (let k = 0; k < 16; k++) {
        const x = 4 + rand() * (W - 8);
        const u = U0 + 8 + rand() * (U1 - U0 - 16);
        if (nearFree(x, u)) continue;
        free.push([x, u, 5]);
        azalea(x, Y(u), 2.2 + rand() * 1.6, rand.pick([0xe86a9a, 0xf0a0c0, 0xe8e8e8]));
      }
      for (let k = 0; k < 400; k++) {
        const x = rand() * W;
        const u = U0 + rand() * (U1 - U0);
        if (nearFree(x, u)) continue;
        free.push([x, u, 4]);
        tree(rand.pick(['pine', 'pine', 'pine', 'broadleaf', 'sakura', 'tiny']), x, Y(u), 4 + rand() * 4);
      }
      for (const [pts, c, yk] of [
        [[[0, 1950], [40, 1944], [82, 1946]], 0x2b3c78, true],
        [[[82, 1946], [40, 1944], [40, U1 - 2]], 0xd04040, false],
        [[[98, 1946], [110, 1944], [162, 1944], [W, 1958]], 0xe8e0d0, true],
        [[[CX, U1 - 2], [CX, CU + 14]], 0x3a6ad0, false],
      ])
        kit.path(pts, [stepper(c, 0, 1950, yk), stepper(c, 1, 1950, yk)], { sp: 3.5, n: 2, gap: 60, mode: 'pp', hold: 2, turn: 'none', fps: 3, s0: rand() });
      reserveRect(0, Y(U1), W, U1 - U0);
    }
    town(2074, TOWN[1] + 8, { pBlock: 0.25, pGarden: 0.1 });
    plumes(640, BAY[1], 70, [0.7, 1.3]);
    lanes(404, 612, 0.8, { yukata: 0.15 });
    lanes(615, BAY[1] - 10, 1, { yukata: 0.15 });
    lanes(TOWN[0] + 60, 1826, 1, { yukata: 0.2 });
    lanes(2072, TOWN[1], 1, { yukata: 0.3 });
    plumes(TOWN[0] + 80, 1820, 46, [0.8, 1.6]);
    plumes(2060, TOWN[1], 46, [0.8, 1.6]);
  }

  // ------------------------------------------------------------ C. Kannawa: a hillside of roofs and steam
  {
    // Ideyu-zaka: the old stone-paved lane winding up the slope, its setts worn, lanterns on posts along it, the hot
    // water's two lagged pipes running up one side
    const laneX = (u) => dodge(64 + 12 * Math.sin(u / 95 + 0.6), u, 6);
    const stairMask = new Uint8Array(W * L); // (ways up the slope: where a terrace wall meets one, it turns into steps)
    {
      for (let Yr = Y(KANNAWA[1]) * S; Yr < Y(KANNAWA[0]) * S; Yr++) {
        const u = L - (Yr + 0.5) / S;
        const c = laneX(u);
        for (let X = Math.floor((c - 7) * S); X < Math.ceil((c + 7) * S); X++) {
          const a = Math.abs((X + 0.5) / S - c);
          if (a > 6.5) {
            img.px(X, Yr, 0x3a3630);
            continue;
          }
          if (a > 5.6) {
            img.px(X, Yr, (Yr >> 2) % 2 ? C.stone[0] : scaleColor(C.stone[0], 0.86));
            continue;
          }
          const row = Yr >> 2;
          const XX = X + (row % 2) * 3;
          const joint = Yr % 4 === 0 || XX % 7 === 0;
          const t = hashPx(XX >> 3, row, 91);
          let col = joint ? 0x4e4a44 : rampColor(C.stone, 0.32 + t * 0.48, X, Yr);
          if (!joint && hashPx(X, Yr, 92) < 0.05) col = scaleColor(col, 0.88);
          if (!joint && a < 2.6 && hashPx(X >> 1, Yr >> 1, 93) < 0.3) col = scaleColor(col, 1.08); // (worn smooth down the middle)
          img.px(X, Yr, col);
        }
        // the pipes
        const Xp = Math.round((c + 6.8) * S);
        img.px(Xp, Yr, 0x8a4a2e);
        img.px(Xp + 1, Yr, 0x5e3020);
        img.px(Xp + 2, Yr, 0x4a6a8a);
        img.px(Xp + 3, Yr, 0x2e4a66);
        if (Yr % 24 === 0) for (let i = -1; i < 5; i++) img.px(Xp + i, Yr, 0x2a2622);
      }
      for (let u = KANNAWA[0]; u < KANNAWA[1]; u++) {
        reserveRect(laneX(u) - 8, Y(u), 16, 1);
        for (let x = Math.floor(laneX(u) - 5); x <= laneX(u) + 5; x++) if (x >= 0 && x < W) stairMask[Y(u) * W + x] = 1;
      }
      for (let u = KANNAWA[0]; u < KANNAWA[1]; u++)
        if (u % 34 === 0) {
          // a lantern on its post each side
          for (const [ux, side] of [[u, -5.8], [u + 17, 5.8]]) {
            if (ux >= KANNAWA[1]) continue;
            const x = laneX(ux) + side;
            const y = Y(ux);
            const X = Math.round(x * S);
            const Yy = y * S;
            objects.push({
              y: y + 0.5,
              draw: () => {
                for (let j = -7; j < 1; j++) img.px(X, Yy + j, 0x4a3424);
                for (let j = 0; j < 5; j++) for (let i = -2; i < 3; i++) if (Math.abs(i) + Math.abs(j - 2) < 4) glowPx(X + i, Yy - 12 + j, j === 0 || j === 4 ? 0xc85a30 : 0xffb868, 0.95);
              },
            });
            pool(x, y, 6, 0xff8a4a, 0.14);
          }
        }
    }
    // live: bathers in yukata, towels over their shoulders, strolling the lane from one bath to the next, and
    // the lane's lanterns brightening one after another up the slope
    {
      const yr = rng(6621);
      for (const c of [0x2b3c78, 0xe8e0d0, 0x8a2a3a, 0x3a5a7a, 0xd8a0b0, 0xf0ece0, 0x2b3c78, 0x8a2a3a]) {
        const side = yr() < 0.5 ? -2 : 2;
        const pts = [];
        for (let u = KANNAWA[0] + 8; u <= KANNAWA[1] - 8; u += 16) pts.push([Math.round(laneX(u)) + side, u]);
        kit.path(pts, [stepper(c, 0, 2700, true), stepper(c, 1, 2700, true)], { sp: 3, mode: 'pp', hold: 4, turn: 'none', fps: 3, s0: yr() });
      }
      const glowF = new HiCanvas(3, 3);
      for (let j = 0; j < 9; j++)
        for (let i = 0; i < 9; i++) {
          const d = Math.hypot(i - 4, j - 4) / 4.6;
          if (d < 1) glowF.px(i, j, 0xffc070, (1 - d) ** 1.4);
        }
      const parts = [];
      for (let u = KANNAWA[0]; u < KANNAWA[1]; u++)
        if (u % 34 === 0) {
          parts.push([0, Math.round(laneX(u) - 7), u + 5, -u * 0.012]);
          parts.push([0, Math.round(laneX(u + 17) + 4), u + 22, -(u + 17) * 0.012]);
        }
      kit.wave([kit.frame(glowF)], parts, { w: 0.8, a0: 0, a1: 0.85, pw: 3 });
      // shops along the lane: awnings, tubs of hot-spring eggs and steamed buns, baskets, little crowds
      for (let u = KANNAWA[0] + 46; u < KANNAWA[1] - 30; u += 58 + Math.floor(yr() * 24)) {
        const side = yr() < 0.5 ? -1 : 1;
        const c = laneX(u);
        const x = Math.round(c + side * 11);
        const y = Y(u);
        if (anyRes(x - 4, y - 4, 8, 8)) continue;
        reserveRect(x - 4, y - 3, 8, 7);
        const aw = yr.pick([0xc83a2a, 0x2b3c78, 0x3a7a4a, 0xe8c040]);
        const X = x * S;
        const Yy = y * S;
        objects.push({
          y: y + 4,
          shadow: () => {
            for (let j = 0; j < 18; j++) for (let i = 0; i < 24; i++) img.tintPx(X - 12 + i + 3, Yy - 9 + j + 3, 0.7);
          },
          draw: () => {
            for (let j = 0; j < 12; j++) for (let i = 0; i < 24; i++) img.px(X - 12 + i, Yy - 9 + j, (i >> 2) % 2 ? aw : 0xf4f0e6);
            for (let i = 0; i < 24; i++) img.px(X - 12 + i, Yy + 3, 0x2a2420);
            for (let j = 4; j < 8; j++) for (let i = 0; i < 24; i++) img.px(X - 12 + i, Yy + j, j === 4 ? 0x76583e : 0x4a3424);
            for (let k = 0; k < 7; k++) img.px(X - 10 + k * 3, Yy + 4, k % 2 ? 0xf4f0e6 : 0xd8a040);
          },
        });
        crowd(x - 5, y + 4, 10, 3, 3, true, { yukata: true });
      }
    }
    /** A road along the contour of the slope, bending round the stands and vents; returns where it runs at x. */
    const contourRoad = (uc, hw, ph) => {
      const at = (x) => {
        let u = uc + 8 * Math.sin(x / 37 + ph);
        for (const o of [...pads, ...vents]) {
          const dx = Math.abs(x - o.x);
          const du = u - o.u;
          if (dx < 44 && Math.abs(du) < 26) u += (du === 0 ? 1 : Math.sign(du)) * (26 - Math.abs(du)) * smooth(44, 16, dx);
        }
        return u;
      };
      for (let X = 0; X < W * S; X++) {
        const x = (X + 0.5) / S;
        const c = at(x);
        for (let Yr = Math.round((L - c - hw - 2) * S); Yr < Math.round((L - c + hw + 2) * S); Yr++) roadPx(X, Yr, L - (Yr + 0.5) / S - c, hw, true, X);
      }
      for (let x = 0; x < W; x++) reserveRect(x, Y(at(x) + hw + 3), 1, hw * 2 + 6);
      // the zebra where the old lane crosses it
      const lx = laneX(uc);
      for (let X = Math.round((lx - 7) * S); X < Math.round((lx + 7) * S); X++) {
        if (X % 7 >= 4) continue;
        const c = at((X + 0.5) / S);
        for (let Yr = Math.round((L - c - hw + 0.4) * S); Yr < Math.round((L - c + hw - 0.4) * S); Yr++) if (hashPx(X, Yr, 38) > 0.08) img.px(X, Yr, 0xd4d4cc);
      }
      return at;
    };
    const kRoads = [contourRoad(2380, 3, 0.4), contourRoad(2700, 3, 2.2), contourRoad(3010, 3, 4.4)];
    // the steam kitchen (jigoku-mushi): food cooked in stone boxes over the vents, steam from each lid
    {
      const x = 104;
      const y = Y(2500);
      house(x, y, 46, 13, 5, { ramp: ROOF.kawara, wood: true, noren: 0x8a2a2a });
      fill(x, y + 20, 46, 14, C.stone, 92, 2);
      for (let k = 0; k < 4; k++) {
        const bx = x + 3 + k * 11;
        img.fine(bx, y + 23, 8, 6, (X, Yr) => {
          const i = X - bx * S;
          const j = Yr - (y + 23) * S;
          if (j < 7) return i % 4 === 0 ? 0x4a3424 : j === 0 ? 0xa0805a : 0x76583e; // the lid
          return j === 7 ? 0x1a1612 : i === 0 ? C.stone[3] : rampColor(C.stone, 0.3 + hashPx(i, j, bx) * 0.3, X, Yr);
        });
        plume(bx + 4, y + 24, 0.8, { front: true });
      }
      // their benches, a counter
      for (let i = 0; i < 40 * S; i++) for (let j = 0; j < 3; j++) img.px((x + 3) * S + i, (y + 21) * S + j, j === 0 ? 0xa0805a : 0x5e4430);
      reserveRect(x, y + 20, 46, 14);
      crowd(x + 2, y + 30, 42, 3, 10, true, { yukata: true });
      signPost(x - 2, y + 28);
    }
    // a foot bath under an open shelter: the slats of its roof, people sitting along both edges, feet in the milky water
    {
      const x = 122;
      const y = Y(2880);
      img.fine(x - 2, y - 2, 34, 18, (X, Yr) => (X % 12 === 0 || Yr % 12 === 0 ? 0x6a665e : rampColor(C.stone, 0.4 + hashPx(X >> 2, Yr >> 2, 95) * 0.3, X, Yr)));
      img.fine(x, y, 30, 12, (X, Yr, xx, yy) => {
        const e = Math.min(xx - x, yy - y, x + 30 - xx, y + 12 - yy);
        if (e < 0.8) return X % 6 === 0 ? 0x4a3424 : 0x76583e;
        if (e < 2) return e < 1.1 ? 0x2a2018 : 0x5e4430;
        const r = Math.sin(xx * 1.8 + yy * 2.2);
        return r > 0.86 ? C.milk[3] : rampColor(C.milk, 0.45 + r * 0.2, X, Yr);
      });
      for (let k = 0; k < 7; k++) {
        const X = (x + 3 + k * 4) * S;
        for (const Yr of [(y + 3) * S, (y + 8) * S]) {
          img.rectPx(X, Yr, 2, 3, 0xe8c8a8);
          img.rectPx(X + 2, Yr, 2, 3, 0xd8b898);
        }
      }
      crowd(x, y - 1, 30, 1, 9, true, { yukata: true });
      crowd(x, y + 12, 30, 1, 9, true, { yukata: true });
      reserveRect(x - 2, y - 3, 34, 19);
      plume(x + 15, y + 6, 0.9, { front: true });
      signPost(x - 5, y + 14, 0x2a6ac8);
      objects.push({
        y: y + 20,
        draw: () => {
          // the shelter's beams and posts: thin, so the bath stays in sight
          for (const yy of [y - 5, y + 13]) {
            for (let i = -3; i < 33 * S; i++) {
              img.px(x * S + i, yy * S, 0x76583e);
              img.px(x * S + i, yy * S + 1, 0x4a3424);
            }
          }
          for (const xx of [x, x + 15, x + 29]) for (let j = (y - 5) * S; j < (y + 16) * S; j++) img.px(xx * S, j, 0x5e4430);
        },
      });
    }
    // big old ryokan with tiled roofs, inner gardens and open-air baths
    for (const [x, u, w] of [[4, 2620, 40], [128, 3080, 46], [100, 2260, 52]]) {
      if (anyRes(x, Y(u), w, 36)) continue;
      house(x, Y(u), w, 20, 6, { ramp: rand.pick([ROOF.dark, ROOF.kawara]), hip: true, wall: 0xeee6d6, noren: 0x2b3c78 });
      roofSign(x + Math.floor(w / 2) - 2, Y(u) + 9, Y(u) + 26);
      garden(x + 4, Y(u) + 28, Math.round(w * 0.45), 10);
      rotenburo(x + 6 + Math.round(w * 0.45), Y(u) + 28, Math.round(w * 0.42), 12, rand.pick([C.milk, C.jade]), x + u);
    }
    // Hyōtan Onsen: a bath yard round a gourd-shaped pool and a row of hot waterfalls under a timber frame
    {
      const x = 118;
      const y = Y(2358);
      if (!anyRes(x, y, 56, 40)) {
        img.fine(x, y, 56, 40, (X, Yr) => (X % 15 === 0 || Yr % 12 === 0 ? 0x5a564e : rampColor(C.stone, 0.32 + hashPx(X >> 3, Yr >> 3, 96) * 0.3, X, Yr)));
        img.fine(x, y, 56, 40, (X, Yr) => {
          const e = Math.min(X - x * S, Yr - y * S, (x + 56) * S - 1 - X, (y + 40) * S - 1 - Yr);
          return e < 4 ? ((X + Yr) % 3 ? 0x8a7a4a : 0xa89a5a) : null; // a bamboo fence round it
        });
        for (const [cx, cy, r] of [[x + 16, y + 22, 10], [x + 30, y + 22, 7]]) {
          img.discPx(cx * S, cy * S, (r + 1.4) * S, C.stone[0]);
          for (let k = 0; k < 16; k++) {
            const a = (k / 16) * Math.PI * 2;
            rockPx((cx + Math.cos(a) * (r + 0.8)) * S, (cy + Math.sin(a) * (r + 0.8)) * S, 2.6, C.rock, k + cx);
          }
        }
        for (const [cx, cy, r] of [[x + 16, y + 22, 10], [x + 30, y + 22, 7]])
          img.fine(cx - r, cy - r, r * 2, r * 2, (X, Yr, xx, yy) => {
            const d = Math.hypot(xx - cx, yy - cy) / r;
            if (d > 1) return null;
            return Math.sin(d * 13) > 0.84 ? C.jade[3] : rampColor(C.jade, 0.35 + (1 - d) * 0.45, X, Yr);
          });
        // the falls: spouts from a beam, water in white threads, bathers under them
        for (let i = 0; i < 18 * S; i++) for (let j = 0; j < 4; j++) img.px((x + 36) * S + i, (y + 8) * S + j, j === 0 ? 0xa0805a : 0x4a3424);
        for (let k = 0; k < 5; k++) {
          const X = (x + 37 + k * 3.4) * S;
          for (let j = 4; j < 20; j++) img.px(Math.round(X) + (j % 3 === 0 ? 1 : 0), (y + 8) * S + j, 0xf0f8f8, 0.85);
          img.discPx(X, (y + 15) * S, 1.7, 0xe8c8a8);
        }
        for (let i = 0; i < 18 * S; i++) for (let j = 0; j < 6; j++) img.px((x + 36) * S + i, (y + 15) * S + j, j % 3 ? C.jade[2] : C.jade[3]);
        reserveRect(x, y, 56, 40);
        folk(x + 16, y + 22, { yukata: true });
        house(x + 8, y + 40, 40, 9, 4, { ramp: ROOF.dark, hip: true, wood: true, noren: 0x8a2a2a });
        plume(x + 16, y + 22, 1.2, { front: true });
        plume(x + 30, y + 22, 0.9, { front: true });
        plume(x + 44, y + 16, 0.8, { front: true });
        signPost(x + 2, y + 56);
      }
    }
    // a yuzamashi: a tall timber tower of bamboo where the scalding water runs down and cools, steam off it
    for (const [x, u] of [[10, 2560], [150, 2980]]) {
      const y = Y(u);
      if (anyRes(x, y - 4, 22, 28) || !padFree(x, y)) continue;
      objects.push({
        y: y + 22,
        shadow: () => shadowRect(x + 6, y + 8, 20, 18, 0.55),
        draw: () => {
          const X0 = x * S;
          const Y0 = y * S;
          for (let j = 0; j < 22 * S; j++)
            for (let i = 0; i < 20 * S; i++) {
              const post = i < 4 || i > 55 || i % 21 < 2;
              const wet = hashPx(i, j >> 2, x) < 0.12;
              img.px(X0 + i, Y0 + j, post ? (i < 4 ? 0x76583e : 0x4a3424) : wet ? 0xd8e8e8 : (i + (j >> 1)) % 3 === 0 ? 0x6a7a3a : (i * 3 + j) % 5 === 0 ? 0x8a9a4a : 0x5a6a30);
            }
          for (let i = -3; i < 20 * S + 3; i++) for (let j = 0; j < 5; j++) img.px(X0 + i, Y0 - 3 + j, j === 0 ? 0xa0805a : j === 4 ? 0x3a2a1c : 0x76583e);
          for (let i = 0; i < 20 * S; i++) for (let j = 0; j < 4; j++) img.px(X0 + i, Y0 + 22 * S + j, j === 0 ? 0xe8e4d4 : C.jade[1]);
        },
      });
      reserveRect(x - 1, y - 3, 23, 28);
      plume(x + 5, y, 1.3, { front: true });
      plume(x + 15, y + 4, 1.1, { front: true });
    }
    // the Yukemuri viewpoint: a wooden deck on a green rise at the top of the town
    {
      const x = 118;
      const u = 3230;
      fill(x, Y(u + 50), 62, 56, C.grass, 93, 6);
      reserveRect(x, Y(u + 50), 62, 56);
      const DX = (x + 14) * S;
      const DY = Y(u + 30) * S;
      for (let j = 0; j < 14 * S + 4; j++) for (let i = 0; i < 34 * S + 4; i++) if (j > 3 || i > 3) img.tintPx(DX + i, DY + j, j > 14 * S || i > 34 * S ? 0.7 : 1);
      for (let j = 0; j < 14 * S; j++) for (let i = 0; i < 34 * S; i++) img.px(DX + i, DY + j, j < 2 ? 0x5e4430 : j % 6 === 0 ? 0x4a3424 : (hashPx(i >> 3, j >> 3, 97) < 0.5 ? 0x8e6a4a : 0x76583e));
      for (let i = 0; i < 34 * S; i += 6) for (let j = -4; j < 1; j++) img.px(DX + i, DY + j, 0x3a2a1c);
      for (let i = 0; i < 34 * S; i++) img.px(DX + i, DY - 4, 0xa0805a);
      // a coin telescope or two at the rail
      for (const k of [20, 66]) {
        img.rectPx(DX + k, DY + 2, 2, 5, 0x3a3e44);
        img.rectPx(DX + k - 2, DY - 1, 6, 3, 0x6a7e90);
      }
      crowd(x + 16, Y(u + 28), 30, 10, 14, true);
      for (let k = 0; k < 7; k++) tree('broadleaf', x + 6 + rand() * 50, Y(u + 44 - rand() * 8), 4 + rand() * 2);
      azalea(x + 8, Y(u + 12), 3);
      azalea(x + 52, Y(u + 10), 3.4, 0xf0a0c0);
      lampPost(x + 12, Y(u + 16));
      bench(x + 20, Y(u + 8));
      bench(x + 36, Y(u + 8));
      // the steps down the slope to the road and the lane
      walk(x, x + 16, u + 4, u + 8);
    }
    // Myōban: terraces of thatched yu-no-hana huts on the slope above town, where the bath salts grow on beds
    // of blue clay under the straw in the hot-spring gas; wisps of it seep out under the eaves
    {
      const mr = rng(6611);
      const clay = [0x6a7a80, 0x7e8e94, 0x92a2a6];
      const ventNear = (x, u, r) => vents.some((v) => Math.hypot(v.x - x, v.u - u) < r);
      for (let u = 3128; u < 3292; u++)
        for (let x = 2; x < 56; x++) {
          const y = Y(u);
          if (ventNear(x, u, 14)) continue;
          img.fine(x, y, 1, 1, (X, Yr) => {
            const wall = (u - 3128) % 42 < 3;
            if (wall) return (X + (Yr >> 3) * 5) % 10 === 0 || Yr % 4 === 0 ? 0x5a564e : rampColor(C.stone, 0.45 + hashPx(X >> 2, Yr >> 2, 161) * 0.3, X, Yr);
            const t = hashPx(X >> 1, Yr >> 1, 162);
            return rampColor(clay, 0.2 + t * 0.6, X, Yr);
          });
          reserved[y * W + x] = 1;
        }
      for (let row = 0; row < 4; row++)
        for (let col = 0; col < 3; col++) {
          const hx = 4 + col * 17 + Math.floor(mr() * 2);
          const hu = 3134 + row * 42 + 34;
          const hy = Y(hu);
          if (ventNear(hx + 6, hu - 14, 18)) continue;
          const hs = Math.floor(mr() * 999);
          objects.push({
            y: hy + 30,
            shadow: () => shadowRect(hx + 3, hy + 3, 13, 30, 0.55),
            draw: () => {
              // an A-frame of thatch from above: the lit slope and the shaded one meeting at the ridge, the straw
              // in bundled strands, darker where the rain gets at it
              const X0 = hx * S;
              const Y0 = hy * S;
              const FW = 13 * S;
              const FH = 30 * S;
              const RX = X0 + Math.floor(FW / 2);
              for (let j = 0; j < FH; j++)
                for (let i = 0; i < FW; i++) {
                  const X = X0 + i;
                  const left = X < RX;
                  const strand = hashPx(left ? i : FW - i, j >> 2, hs);
                  const dist = Math.abs(X - RX) / (FW / 2);
                  let c = left ? (strand < 0.2 ? 0xd8b878 : strand < 0.6 ? 0xc8a868 : 0xb89858) : strand < 0.2 ? 0x9a7e4a : strand < 0.6 ? 0x8a6e40 : 0x7a5e34;
                  if (j % 12 < 2) c = scaleColor(c, 0.86); // (the courses of bundles)
                  if (dist > 0.86) c = scaleColor(c, 0.76 + (1 - dist) * 0.5);
                  if (Math.abs(X - RX) < 1.5) c = 0x5a4428;
                  img.px(X, Y0 + j, c);
                }
              for (const yy of [Y0 + 6, Y0 + FH - 8]) for (let i = -4; i < 5; i++) for (let j = 0; j < 3; j++) img.px(RX + i, yy + j, j === 1 ? 0x2a1e12 : 0x3a2a1a);
              // a dark gable end at the near side, the blue clay showing in the doorway
              for (let j = 0; j < 7; j++) for (let i = -8 + j; i <= 8 - j; i++) img.px(RX + i, Y0 + FH - 1 - j, j === 0 ? 0x2a1e12 : Math.abs(i) < 3 ? 0x6a7a80 : 0x3a2a1a);
            },
          });
          kit.emit(hx + (mr() < 0.5 ? 1 : 12), hu - 6 - Math.floor(mr() * 18), [2, 3].map(puffFrames), { rate: 0.7, life: [1.4, 2.2], vy: 5, sx: 1, wf: 0.6, a: 0.45, d: 1.1, tint: 1 });
        }
    }
    const KR = [ROOF.kawara, ROOF.kawara, ROOF.dark, ROOF.dark, ROOF.brown, ROOF.blue];
    // the alleys climbing away from the old lane, narrow and crooked, until they meet a road or a garden wall
    {
      const ar = rng(6721);
      for (const [u0, side, slope] of [[2190, 1, 0.3], [2230, -1, 0.25], [2330, -1, 0.4], [2445, 1, 0.2], [2478, -1, -0.2], [2580, 1, 0.35], [2650, -1, -0.3], [2772, 1, 0.3], [2840, -1, 0.35], [2930, 1, -0.2], [2960, -1, 0.2], [3060, 1, -0.2], [3200, 1, -0.15]]) {
        const x0 = laneX(u0) + side * 7;
        const pts = [];
        for (let t = 0; t < 110; t += 1) {
          const x = x0 + side * t;
          const u = u0 + t * slope + 4 * Math.sin(t / 9 + u0) * Math.min(1, t / 12);
          if (x < -2 || x > W + 2) break;
          if (t > 7 && anyRes(x - 2, L - u - 2, 4, 4)) break;
          pts.push([x, u]);
        }
        if (pts.length < 14) continue;
        for (const pass of [0, 1])
          for (const [x, u] of pts) {
            const HW = pass ? 2.3 : 3;
            for (let Yr = Math.floor((L - u - HW) * S); Yr <= (L - u + HW) * S; Yr++)
              for (let X = Math.floor((x - HW) * S); X <= (x + HW) * S; X++) {
                const d = Math.hypot((X + 0.5) / S - x, L - (Yr + 0.5) / S - u);
                if (d > HW) continue;
                if (!pass) {
                  img.px(X, Yr, 0x3a3630);
                  continue;
                }
                const row = Yr >> 2;
                const XX = X + (row % 2) * 2;
                img.px(X, Yr, Yr % 4 === 0 || XX % 5 === 0 ? 0x4e4a44 : rampColor(C.stone, 0.25 + hashPx(XX >> 2, row, 94) * 0.4, X, Yr));
              }
          }
        for (const [x, u] of pts) {
          reserveRect(x - 3, L - u - 3, 6, 6);
          for (let yy = Math.floor(L - u - 2); yy <= L - u + 2; yy++) for (let xx = Math.floor(x - 2); xx <= x + 2; xx++) if (xx >= 0 && xx < W && yy >= 0 && yy < L) stairMask[yy * W + xx] = 1;
        }
        // a lantern and a few people along it, one strolling (live)
        for (let k = 8; k < pts.length; k += 22) {
          const [x, u] = pts[k];
          glowPx(x * S + 7, (L - u) * S - 4, 0xffb868, 0.95);
          glowPx(x * S + 7, (L - u) * S - 3, 0xff8a4a, 0.95);
          pool(x + 2, L - u, 5, 0xff8a4a, 0.1);
          folk(x + (ar() - 0.5) * 2, L - u, { yukata: ar() < 0.6 });
        }
        const walk2 = pts.filter((_, i) => i % 6 === 0).map(([x, u]) => [Math.round(x), Math.round(u) + 2]);
        const c = ar.pick(YUKATA);
        kit.path(walk2, [stepper(c, 0, u0, true), stepper(c, 1, u0, true)], { sp: 2.6, mode: 'pp', hold: 4, turn: 'none', fps: 3, s0: ar() });
      }
    }
    // the terraces: walls of dressed stone following the slope, a step in the ground every few rows of houses, steps
    // where they meet a way up
    const contour = (x, k) => 9 * Math.sin(x / 41 + k * 1.3) + 4 * Math.sin(x / 15 + k * 2.1);
    const wallsAt = [];
    for (let u = 2152, k = 0; u < KANNAWA[1] - 20; u += 66, k++) {
      const near = kRoads.some((at) => Math.abs(at(90) - u) < 18);
      wallsAt.push([near ? u + 22 : u, k]);
    }
    for (const [u0, k] of wallsAt) {
      for (let X = 0; X < W * S; X++) {
        const x = (X + 0.5) / S;
        const uw = u0 + contour(x, k);
        const YT = Math.round((L - uw) * S);
        for (let j = 0; j < 16; j++) {
          const Yr = YT + j;
          const cx = Math.floor(x);
          const cy = Math.floor(Yr / S);
          const res = reserved[cy * W + cx];
          if (stairMask[cy * W + cx] && j < 12) {
            img.px(X, Yr, j % 4 === 0 ? 0x3e3a34 : j % 4 === 1 ? 0xb0ac9e : rampColor(C.stone, 0.45, X, Yr));
            continue;
          }
          if (res) continue;
          if (j >= 12) {
            img.tintPx(X, Yr, 0.6 + (j - 12) * 0.1);
            continue;
          }
          const row = j >> 2;
          const XX = X + (row % 2) * 6;
          let c;
          if (j < 2) c = j === 0 ? 0xc4c0b2 : 0xa8a498;
          else if (j === 11) c = 0x2e2a26;
          else if (j % 4 === 0 || XX % 12 === 0) c = 0x4a4640;
          else c = rampColor(C.stone, 0.3 + hashPx(XX >> 3, row + k * 5, 95) * 0.4 + (hashPx(X >> 2, 3, k) < 0.12 ? -0.15 : 0), X, Yr);
          if (j > 3 && hashPx(X >> 1, Yr >> 1, 96) < 0.05) c = 0x3e5a34; // (moss and ferns in its joints)
          img.px(X, Yr, c);
        }
      }
      for (let x = 0; x < W; x++) reserveRect(x, Y(u0 + contour(x + 0.5, k)) - 1, 1, 6);
    }
    // the houses in stepped, broken rows along each terrace
    const slopeRows = (u0, u1, k, roofs) => {
      let u = u0;
      while (u < u1 - 14) {
        const rh = 9 + Math.floor(rand() * 4);
        const fh = 3 + Math.floor(rand() * 2);
        const bh = rh + fh;
        let x = -Math.floor(rand() * 8);
        while (x < W - 5) {
          let w = 11 + Math.floor(rand() * 9);
          const uh = u + contour(x + w / 2, k) + (rand() - 0.5) * 5;
          const y = Y(uh + bh);
          if (anyRes(x, y, w, bh)) w = Math.floor(w / 2);
          if (w >= 8 && !anyRes(x, y, w, bh)) {
            const r = rand();
            if (r < 0.13) garden(x, y, w, bh);
            else if (r < 0.15 && w >= 14) parking(x, y, w, bh);
            else if (r < 0.22 && w >= 14) block(x, y + bh - 8 - Math.min(rh, 14), w, Math.min(rh, 14), 8, { balcony: rand() < 0.5, items: ['ac', 'tank', 'bath'] });
            else {
              house(x, y, w, rh, fh, { roofs, plot: true });
              if (w >= 14 && rand() < 0.14) roofSign(x + Math.floor(w / 2) - 2, y + Math.round(rh * 0.42), y + bh, rand() < 0.7 ? 0xc8302a : 0x2a6ac8);
            }
          }
          x += w + 1 + Math.floor(rand() * 3);
        }
        u += bh + 6 + Math.floor(rand() * 3);
      }
    };
    const stops = [KANNAWA[0] - 2, ...wallsAt.map(([u]) => u), KANNAWA[1] - 6];
    stops.forEach((u, i) => {
      if (i + 1 < stops.length) slopeRows(u + 9, stops[i + 1] - 1, Math.max(0, i - 1), i % 3 === 2 ? [ROOF.kawara, ROOF.dark, ROOF.brown, ROOF.blue, ROOF.red] : i % 3 === 1 ? KR : [ROOF.kawara, ROOF.dark, ROOF.brown, ROOF.green]);
    });
    // mist lying in the hollows of a morning, lifting slowly off the lanes
    {
      const mr2 = rng(6722);
      for (let u = KANNAWA[0] + 40; u < KANNAWA[1]; u += 74) {
        const x = 20 + mr2() * 140;
        kit.emit(Math.round(x), u, [5, 6, 7].map(puffFrames), { rate: 0.55, life: [4.5, 6.5], vy: 2.4, sx: 26, wf: 0.7, a: 0.2, d: 1.1, tint: 1 });
      }
    }
    // walkers along the contour roads
    {
      const wr = rng(6723);
      for (const at of kRoads)
        for (const [c, off, yk] of [[0x2b3c78, 5, true], [0xd04040, -5, false], [0xe8e0d0, 5, true]]) {
          const pts = [];
          for (let x = -8; x <= 188; x += 12) pts.push([x, Math.round(at(Math.max(0, Math.min(W - 1, x))) + off)]);
          if (wr() < 0.5) pts.reverse();
          kit.path(pts, [stepper(c, 0, 2700, yk), stepper(c, 1, 2700, yk)], { sp: 3.5, turn: 'none', fps: 3, s0: wr() });
        }
    }
    lanes(KANNAWA[0] + 4, KANNAWA[1] - 6, 1.1, { roofs: KR, yukata: 0.55 });
    // Kannawa's famous view: white plumes rising from between the roofs all over the slope
    plumes(KANNAWA[0], KANNAWA[1], 21, [1, 2.1]);
  }

  // ------------------------------------------------------------ D. the Hells in their gardens
  {
    const vr = rng(6671);
    // the paths winding through the hells, gravel raked by feet, visitors on them (some live)
    const gravelPath = (at, u0, u1, hw = 4) => {
      for (let Yr = Y(u1) * S; Yr < Y(u0) * S; Yr++) {
        const u = L - (Yr + 0.5) / S;
        const c = at(u);
        for (let X = Math.floor((c - hw - 0.5) * S); X < Math.ceil((c + hw + 0.5) * S); X++) {
          const a = Math.abs((X + 0.5) / S - c);
          const g = hashPx(X, Yr, 101);
          if (a > hw) img.px(X, Yr, g < 0.5 ? 0x4a4a3a : 0x3a3a2e);
          else img.px(X, Yr, a > hw - 0.5 ? C.gravel[0] : g < 0.1 ? scaleColor(C.gravel[0], 0.82) : g > 0.92 ? 0xd0c4ae : rampColor(C.gravel, hashPx(X >> 1, Yr >> 1, 102), X, Yr));
        }
      }
      for (let u = Math.floor(u0); u < u1; u++) reserveRect(at(u) - hw - 1, Y(u), hw * 2 + 2, 1);
    };
    const eastX = (u) => dodge(156 + 10 * Math.sin(u / 120 + 0.3), u, 4);
    const westX = (u) => dodge(20 + 6 * Math.sin(u / 60 + 1.2), u, 4);
    gravelPath(eastX, HELLS[0], HELLS[1]);
    gravelPath(westX, HELLS[0], 3560);
    {
      for (let u = HELLS[0] + 6; u < HELLS[1]; u += 9) if (vr() < 0.35) crowd(eastX(u) - 3, Y(u), 6, 2, 2, true);
      for (let u = HELLS[0] + 6; u < 3556; u += 9) if (vr() < 0.35) crowd(westX(u) - 3, Y(u), 6, 2, 2, true);
      const tr = (c, u0, u1, at, s0, yk) => {
        const pts = [];
        for (let u = u0; u <= u1; u += 16) pts.push([Math.round(at(u)) + (vr() < 0.5 ? -2 : 2), u]);
        kit.path(pts, [stepper(c, 0, u0, yk), stepper(c, 1, u0, yk)], { sp: 3.5, mode: 'pp', hold: 3, turn: 'none', fps: 3, s0 });
      };
      for (const [c, s0, yk] of [[0xd04040, 0.1, false], [0x3a6ad0, 0.3, false], [0xe8e8f0, 0.5, false], [0x2b3c78, 0.7, true], [0xe8c040, 0.85, false], [0x8a2a3a, 0.2, true], [0x3a3a4a, 0.6, false]]) tr(c, HELLS[0] + 10, HELLS[1] - 10, eastX, s0, yk);
    }
    /** A hell's courtyard: raked gravel inside a low stone wall, a clipped hedge outside it, rocks and shrubs. */
    const yard = (x0, u0, x1, u1, seed) => {
      for (let Yr = Y(u1) * S; Yr < Y(u0) * S; Yr++)
        for (let X = x0 * S; X < x1 * S; X++) {
          const x = (X + 0.5) / S;
          const y = (Yr + 0.5) / S;
          if (isRes(x, y) && padFree(x, y)) continue; // (the ground goes on under the vents)
          const u = L - y;
          const e = Math.min(x - x0, x1 - x, u - u0, u1 - u);
          let c;
          if (e < 0.7) c = (X + Yr) % 9 === 0 ? 0x6e6a60 : C.stone[3]; // the wall's coping
          else if (e < 1.5) c = C.stone[0];
          else if (e < 4) {
            // the clipped hedge
            const t = hashPx(X >> 1, Yr >> 1, seed);
            c = e > 3.4 ? 0x1e3a22 : t < 0.2 ? 0x4e7a44 : t < 0.65 ? 0x34603a : 0x2a4e30;
          } else {
            // raked gravel: combed lines swinging gently round the yard
            const wob = Math.sin(x / 13 + seed) * 2.2;
            const rake = Math.sin((u + wob) * 2.2);
            c = rampColor(C.gravel, 0.35 + rake * 0.2 + (fbm(x, u, { seed, scale: 9 }) - 0.5) * 0.4, X, Yr);
            const g = hashPx(X, Yr, seed + 1);
            if (g < 0.06) c = scaleColor(c, 0.86);
            else if (g > 0.96) c = 0xd4c8b2;
          }
          img.px(X, Yr, c);
        }
    };
    const dress = (x0, u0, x1, u1) => {
      for (let k = 0; k < ((x1 - x0) * (u1 - u0)) / 420; k++) {
        const x = x0 + 6 + rand() * (x1 - x0 - 12);
        const y = Y(u0 + 6 + rand() * (u1 - u0 - 12));
        if (anyRes(x - 2, y - 2, 4, 4)) continue;
        const v = rand();
        if (v < 0.5) rockPx(x * S, y * S, 2.8 + rand() * 4.4, C.rock, Math.floor(x * y));
        else if (v < 0.78) tree(rand() < 0.5 ? 'tiny' : 'pine', x, y, 2.5 + rand() * 1.5);
        else azalea(x, y, 2 + rand() * 1.6, rand.pick([0xe86a9a, 0xf0a0c0, 0xe8e8e8]));
      }
    };
    yard(30, 3330, 146, 3500, 171);
    yard(8, 3560, 146, 3830, 172);
    yard(8, 4040, 146, 4400, 173);
    yard(52, 4404, 146, 4490, 174);
    /** A hell's enclosure: an entrance gate building with a tiled roof, a ticket window, a signboard on two posts. */
    const gate = (x, u, w, name) => {
      house(x, Y(u), w, 11, 5, { ramp: ROOF.kawara, hip: true, wood: true, noren: name });
      const X = (x + 1) * S;
      const Yy = (Y(u) + 17) * S;
      const sr = rng(x + u);
      objects.push({
        y: Y(u) + 22,
        draw: () => {
          for (let j = 0; j < 10; j++) for (let i = 0; i < 15; i++) img.px(X + i, Yy + j, i === 0 || i === 14 || j === 0 || j === 9 ? 0x2a1e18 : 0xf0e8d8);
          for (let k = 0; k < 2; k++) glyph(X + 2 + k * 6, Yy + 2, 5, 0x2a1a14, sr);
          for (const i of [2, 12]) for (let j = 10; j < 15; j++) img.px(X + i, Yy + j, 0x4a3424);
        },
      });
    };
    // Umi Jigoku: the cobalt "sea hell", a red shrine, giant lily pads, a greenhouse of them
    hotPool(76, 3420, 46, 30, C.cobalt, 81, C.rock);
    plume(70, Y(3410), 2.2);
    plume(98, Y(3428), 1.6);
    plume(50, Y(3432), 1.4);
    {
      const x = 128;
      const y = Y(3478);
      house(x, y, 22, 11, 6, { ramp: ROOF.dark, hip: true, wall: 0xc8382a });
      torii(x + 11, y + 29, 12, 7);
      reserveRect(x + 2, y + 21, 18, 10);
      lampPost(x - 2, y + 28);
    }
    hotPool(118, 3365, 24, 12, [0x2a5a3a, 0x3a6a46, 0x4a7a52, 0x5a8a5e], 82, C.rock);
    /** A Victoria lily pad: veined from its middle, its rim turned up, red on the outside. */
    const lily = (x, y, r, flower) => {
      const CX = x * S;
      const CY = y * S;
      const R = r * S;
      for (let Yy = Math.floor(CY - R - 1); Yy <= CY + R + 1; Yy++)
        for (let X = Math.floor(CX - R - 1); X <= CX + R + 1; X++) {
          const dx = X + 0.5 - CX;
          const dy = Yy + 0.5 - CY;
          const d = Math.hypot(dx, dy);
          if (d > R) continue;
          const a = Math.atan2(dy, dx);
          let c;
          if (d > R - 1.3) c = a > 0.5 && a < 2.4 ? 0xb84a4a : 0x9a3a3a;
          else if (d > R - 2.4) c = 0xa8c858;
          else {
            c = dx + dy < 0 ? 0x6eb048 : 0x5a9a3a;
            if (Math.sin(a * 14) > 0.86) c = scaleColor(c, 1.2);
            if (Math.sin(d * 1.6) > 0.9) c = scaleColor(c, 0.9);
          }
          img.px(X, Yy, c);
        }
      for (let k = 0; k < 4; k++) img.px(CX + k, CY, 0x3a5a2a);
      if (flower) {
        img.discPx(CX + R + 2, CY - R + 1, 3.2, 0xf8d0e0);
        img.discPx(CX + R + 2, CY - R + 1, 1.6, 0xfff4c8);
      }
    };
    for (let k = 0; k < 9; k++) lily(100 + (k % 5) * 8 + (rand() - 0.5) * 3, Y(3365) + (k < 5 ? -4 : 4) + (rand() - 0.5) * 2, 3.2 + rand() * 0.6, k % 4 === 0);
    // the greenhouse: a glass vault on a white frame, tropical green showing through
    {
      const x = 42;
      const y = Y(3384);
      const w = 40;
      const h = 15;
      objects.push({
        y: y + h + 6,
        shadow: () => shadowRect(x + 3, y + 3, w, h + 6, 0.6),
        draw: () => {
          const X0 = x * S;
          const Y0 = y * S;
          for (let j = 0; j < h * S; j++)
            for (let i = 0; i < w * S; i++) {
              const v = j / (h * S);
              const n = hashPx((X0 + i) >> 3, (Y0 + j) >> 3, 103);
              let c = n < 0.45 ? 0x4a7a50 : n < 0.8 ? 0x5e8e60 : 0x7aa074;
              c = scaleColor(c, 1.32 - Math.abs(v - 0.35) * 0.6);
              if (i % 15 === 0 || j % 9 === 0) c = 0xe8ecec;
              if (i < 2 || i >= w * S - 2) c = 0xf4f4f0;
              if (Math.abs(j - 16) < 2) c = 0xf8f8f4;
              img.px(X0 + i, Y0 + j, c);
            }
          for (let j = 0; j < 6 * S; j++)
            for (let i = 0; i < w * S; i++) {
              let c = i % 9 === 0 || j === 8 ? 0xe8ecec : j < 2 ? 0x8a9a94 : j < 8 ? 0x6a8a78 : 0x5a7a68;
              if (j >= 6 * S - 3) c = 0x8a867c;
              img.px(X0 + i, Y0 + h * S + j, c);
            }
          for (let j = 4; j < 18; j++) for (let i = 54; i < 66; i++) img.px(X0 + i, Y0 + h * S + j, i === 60 ? 0xe8ecec : 0x2e3a48);
        },
      });
      reserveRect(x - 1, y - 1, w + 2, h + 8);
      // a walk from its door to the pond's bridge path
    }
    gate(8, 3330, 34, 0x2b3c78);
    {
      const ring = [];
      for (let a = 2.95; a >= 0.15; a -= 0.14) ring.push([76 + Math.cos(a) * 53, 3420 - Math.sin(a) * 37]);
      flags([[westX(3402), 3402], ...ring, [Math.round(eastX(3404)), 3404]], 2.6);
      flags([[62, 3370], [62, 3383]], 2.2);
      flags([[62, 3370], [62, 3362], [90, 3362]], 2.2);
    }
    // eggs cooking in Umi Jigoku: a basket hung from a bamboo frame into the cobalt water, steam boiling off it;
    // a railing round the near shore with visitors along it (some strolling, live)
    {
      const er = rng(6631);
      const bx = 44;
      const by = Y(3400);
      const BX = bx * S;
      const BY = by * S;
      objects.push({
        y: by + 4,
        draw: () => {
          for (const X of [BX - 12, BX + 15]) for (let j = -18; j < 8; j++) {
            img.px(X, BY + j, 0x8a7a4a);
            img.px(X + 1, BY + j, 0x6a5a34);
            if ((j + 18) % 7 === 0) img.px(X, BY + j, 0xc8b878);
          }
          for (let i = -12; i < 16; i++) {
            img.px(BX + i, BY - 18, 0xc8b878);
            img.px(BX + i, BY - 17, 0x8a7a4a);
          }
          for (let j = -17; j < -8; j++) img.px(BX + 1, BY + j, 0x5a4a30);
          for (let j = 0; j < 9; j++)
            for (let i = -6; i < 9; i++) {
              if (Math.abs(i - 1.5) + Math.abs(j - 4) * 0.4 > 8) continue;
              img.px(BX + i, BY - 9 + j, (i + j) % 2 ? 0xb8945a : 0x9a7a44);
            }
          for (const [i, j] of [[-3, -9], [0, -10], [3, -9], [6, -10], [-1, -7], [2, -7], [5, -7]]) {
            img.px(BX + i, BY + j, 0xf8f4ea);
            img.px(BX + i + 1, BY + j, 0xf0ece2);
            img.px(BX + i, BY + j + 1, 0xd8d0c0);
          }
        },
      });
      kit.emit(bx, 3402, [2, 3, 4].map(puffFrames), { rate: 2, life: [1.6, 2.4], vy: 7, sx: 1, wf: 0.5, a: 0.7, d: 1.1, tint: 1 });
      const rail = [];
      for (let a = 0.2; a <= Math.PI - 0.2; a += 0.04) rail.push([76 + Math.cos(a) * 49, Y(3420) + Math.sin(a) * 33]);
      objects.push({
        y: Y(3420) + 33,
        draw: () => {
          for (let k = 0; k + 1 < rail.length; k++) {
            const [x0, y0] = rail[k];
            const [x1, y1] = rail[k + 1];
            img.linePx(x0 * S, y0 * S, x1 * S, y1 * S, 0x6a5a44);
            img.linePx(x0 * S, y0 * S + 1, x1 * S, y1 * S + 1, 0x3a2e22);
            if (k % 4 === 0) for (let j = 0; j < 5; j++) img.px(Math.round(x0 * S), Math.round(y0 * S) + j, 0x2a2018);
          }
        },
      });
      rail.forEach(([x, y]) => reserveRect(x - 1, y - 1, 3, 4));
      for (const [x, y] of rail.filter(() => er() < 0.28)) folk(x, y + 2.6);
      for (const [c, s0] of [[0xd04040, 0.2], [0x3a6ad0, 0.6], [0xe8e8f0, 0.9]])
        kit.path(rail.filter((_, i) => i % 6 === 0).map(([x, y]) => [Math.round(x), U(Math.round(y) + 3)]), [stepper(c, 0, 3400), stepper(c, 1, 3400)], { sp: 3, mode: 'pp', hold: 3, turn: 'none', fps: 3, s0 });
    }
    // Oniishibozu: grey mud pools with bubbles like shaven monks' heads, boardwalks to look from
    for (const [x, u, rx, ry] of [[66, 3610, 30, 17], [112, 3770, 28, 16], [40, 3770, 20, 13], [124, 3612, 16, 11], [76, 3700, 12, 8]]) {
      hotPool(x, u, rx, ry, C.mud, 90 + u, C.stone);
      for (let k = 0; k < rx / 2; k++) {
        const bx = x + (rand() - 0.5) * rx * 1.3;
        const by = Y(u) + (rand() - 0.5) * ry * 1.3;
        if (((bx - x) / rx) ** 2 + ((by - Y(u)) / ry) ** 2 > 0.6) continue;
        const r = (1.5 + rand() * 2.2) * S;
        const CX = bx * S;
        const CY = by * S;
        for (let Yy = Math.floor(CY - r - 1); Yy <= CY + r + 1; Yy++)
          for (let X = Math.floor(CX - r - 1); X <= CX + r + 1; X++) {
            const dx = (X + 0.5 - CX) / r;
            const dy = (Yy + 0.5 - CY) / r;
            const d = dx * dx + dy * dy;
            if (d > 1) continue;
            const l = dx + dy;
            let c = l < -0.8 ? 0xe4e0d8 : l < -0.25 ? C.mud[3] : l < 0.45 ? C.mud[2] : l < 0.95 ? C.mud[1] : C.mud[0];
            if (d > 0.82) c = scaleColor(c, 0.78);
            img.px(X, Yy, c);
          }
      }
      plume(x, Y(u), 1.2);
    }
    // a boardwalk across the yard between the big pools, a rail each side, its people
    {
      const a = flags([[22, 3562], [22, 3698]], 2.6);
      const b = flags([[92, 3700], [97, 3700], [98, 3640], [100, 3596], [146, 3586], [Math.round(eastX(3586)), 3586]], 2.6);
      const c = flags([[97, 3700], [78, 3745], [76, 3802]], 2.6);
      const vr2 = rng(6672);
      for (const pts of [[...a, ...b], c]) {
        for (let k = 0; k + 1 < pts.length; k++) {
          const n = Math.floor(Math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1]) / 16);
          for (let i = 0; i < n; i++) {
            if (vr2() < 0.5) continue;
            const t = i / n;
            folk(pts[k][0] + (pts[k + 1][0] - pts[k][0]) * t + (vr2() - 0.5) * 3, Y(pts[k][1] + (pts[k + 1][1] - pts[k][1]) * t));
          }
        }
      }
      for (const [c1, s0] of [[0xd04040, 0.1], [0x3a6ad0, 0.5], [0xe8e8f0, 0.8]]) kit.path([...a, ...b], [stepper(c1, 0, 3650), stepper(c1, 1, 3650)], { sp: 3.5, mode: 'pp', hold: 3, turn: 'none', fps: 3, s0 });
      for (const [x, u, rx, ry] of [[66, 3610, 30, 17], [112, 3770, 28, 16], [40, 3770, 20, 13]]) poolRail(x, u, rx, ry, 6);
      const yy = Y(3700);
      const X0 = 12 * S;
      const X1 = 92 * S;
      for (let Yr = (yy - 3) * S; Yr < (yy + 3) * S + 3; Yr++) for (let X = X0; X < X1 + 3; X++) img.tintPx(X + 2, Yr + 2, 0.8);
      for (let Yr = (yy - 3) * S; Yr < (yy + 3) * S; Yr++)
        for (let X = X0; X < X1; X++) img.px(X, Yr, Yr < (yy - 3) * S + 2 || Yr >= (yy + 3) * S - 2 ? 0x4a3424 : X % 6 === 0 ? 0x4a3424 : hashPx(X >> 3, Yr >> 2, 104) < 0.5 ? 0x8e6a4a : 0x76583e);
      reserveRect(12, yy - 3, 80, 6);
      crowd(16, yy - 2, 72, 3, 9, true);
    }
    gate(4, 3560, 32, 0x5a5a5a); // (on the south wall, where the west path comes up)
    // Kamado Jigoku: pools in different colours and the red oni cook on his giant pot
    for (const [x, u, ramp] of [[36, 4090, C.milk], [80, 4130, C.blood], [126, 4100, C.cobalt], [108, 4320, C.mud], [48, 4340, C.jade], [86, 4260, C.milk], [26, 4254, C.cobalt]]) {
      hotPool(x, u, 17, 10, ramp, x + u);
      plume(x, Y(u), 1.1);
      poolRail(x, u, 17, 10, 6);
    }
    {
      const main = flags([[89, 4041], [100, 4082], [106, 4116], [100, 4160], [88, 4205], [62, 4240], [60, 4285], [75, 4312], [78, 4362], [78, 4399]], 2.8);
      flags([[100, 4082], [62, 4088]], 2.4);
      flags([[61, 4256], [50, 4256]], 2.4);
      flags([[78, 4362], [66, 4352]], 2.4);
      flags([[75, 4312], [90, 4316]], 2.4);
      const wr = rng(6673);
      for (const [c, s0, yk] of [[0xd04040, 0.1, false], [0x3a6ad0, 0.3, false], [0xe8e8f0, 0.55, false], [0x2b3c78, 0.75, true], [0xe8c040, 0.9, false]]) kit.path(main, [stepper(c, 0, 4200, yk), stepper(c, 1, 4200, yk)], { sp: 3.5, mode: 'pp', hold: 3, turn: 'none', fps: 3, s0 });
      for (let k = 0; k + 1 < main.length; k++) {
        const n = Math.floor(Math.hypot(main[k + 1][0] - main[k][0], main[k + 1][1] - main[k][1]) / 12);
        for (let i = 0; i < n; i++) {
          if (wr() < 0.45) continue;
          const t = i / n;
          folk(main[k][0] + (main[k + 1][0] - main[k][0]) * t + (wr() - 0.5) * 3, Y(main[k][1] + (main[k + 1][1] - main[k][1]) * t));
        }
      }
    }
    {
      const x = 106;
      const y = Y(4190);
      const X = x * S;
      const Yy = y * S;
      objects.push({
        y: y + 22,
        shadow: () => {
          for (let j = -40; j <= 40; j++) for (let i = -46; i <= 46; i++) if ((i / 46) ** 2 + (j / 40) ** 2 < 1) img.tintPx(X + 54 + i, Yy + 50 + j, 0.62);
        },
        draw: () => {
          // the stone hearth, fire glowing in its mouth, the iron pot, and the cook on its rim with his ladle: red
          // skin, yellow horns, a tiger-striped loincloth
          img.fine(x + 1, y + 12, 24, 10, (Xx, Yr) => {
            const j = Yr - (y + 12) * S;
            return (Xx + (j >> 2) * 6) % 12 === 0 || j % 5 === 0 ? 0x4a4640 : rampColor(C.stone, 0.3 + hashPx(Xx >> 2, Yr >> 2, 105) * 0.4, Xx, Yr);
          });
          for (let j = 0; j < 12; j++) for (let i = -9; i < 10; i++) if (Math.abs(i) < 9 - j * 0.2) glowPx(X + 39 + i, Yy + 54 + j, j > 6 ? 0xffd060 : 0xff7a2a, 0.9);
          img.disc(x + 13, y + 12, 11, 0x1e1a18);
          img.disc(x + 13, y + 12, 10.3, 0x34302c);
          img.disc(x + 12.5, y + 11.5, 8.4, 0x4a4642);
          img.disc(x + 12.5, y + 11.5, 7.3, 0x2a2826);
          img.fine(x + 5, y + 4, 16, 16, (Xx, Yr, xx, yy) => {
            const d = Math.hypot(xx - x - 12.5, yy - y - 11.5);
            if (d > 7) return null;
            return Math.sin(d * 4 + xx) > 0.7 ? 0xa8c0a0 : rampColor([0x5a6a48, 0x6a7a54, 0x7a8a60], 0.5 + (7 - d) * 0.05, Xx, Yr);
          });
          const RED = 0xd8302a;
          const RED2 = 0xe85a4a;
          const RED3 = 0x9a1e1a;
          for (let j = 0; j < 36; j++)
            for (let i = 0; i < 24; i++) {
              const e = Math.min(i, 23 - i);
              if (j < 6 && e < 2) continue;
              let c = i < 6 ? RED2 : i > 18 ? RED3 : RED;
              if (j > 12 && j < 15 && i > 3 && i < 20) c = RED3;
              img.px(X + 27 + i, Yy - 18 + j, c);
            }
          // the loincloth
          for (let j = 18; j < 28; j++) for (let i = 0; i < 24; i++) img.px(X + 27 + i, Yy - 18 + j, (i + j * 2) % 7 < 2 ? 0x2a1e12 : j > 25 ? 0xb88a20 : 0xf0c030);
          // the arms
          for (let k = 0; k < 16; k++) {
            for (const w2 of [0, 1, 2, 3]) {
              img.px(X + 26 - Math.floor(k * 0.3) + w2 - 2, Yy - 16 + k, RED2);
              img.px(X + 52 + Math.floor(k * 0.5) + w2 - 2, Yy - 16 + k, RED3);
            }
          }
          // the head: wild black hair, horns, glaring eyes, tusks
          img.discPx(X + 39, Yy - 26, 12.4, 0x1a1418);
          img.discPx(X + 39, Yy - 25, 10.4, RED);
          img.discPx(X + 36, Yy - 28, 5.4, RED2);
          for (let k = 0; k < 6; k++) {
            for (const [ox, sx] of [[32, -1], [46, 1]])
              for (let w2 = 0; w2 < Math.max(1, 3 - k * 0.5); w2++) img.px(X + ox + sx * k + w2, Yy - 34 - k, k > 3 ? 0xf8e8a0 : 0xf0c030);
          }
          for (const ox of [34, 43]) {
            img.rectPx(X + ox, Yy - 28, 4, 3, 0xf8f4ec);
            img.px(X + ox + 2, Yy - 27, 0x1a1418);
          }
          img.rectPx(X + 34, Yy - 21, 11, 3, 0x2a0e0e);
          for (const ox of [34, 43]) img.rectPx(X + ox, Yy - 22, 2, 3, 0xf8f4ec);
          // the ladle
          img.linePx(X + 58, Yy - 2, X + 66, Yy + 22, C.wood[2]);
          img.linePx(X + 59, Yy - 2, X + 67, Yy + 22, C.wood[0]);
          img.discPx(X + 67, Yy + 24, 3.4, 0x6a665e);
        },
      });
      reserveRect(x - 2, y - 16, 30, 40);
      plume(x + 13, y + 8, 1.8, { front: true });
      pool(x + 13, y + 20, 11, 0xff7a2a, 0.26);
      crowd(x - 4, y + 25, 34, 3, 8, true);
    }
    // Kamado's gate in the middle of its south wall, a walk to it from the main path (between the turret stands)
    gate(74, 4040, 30, 0x8a2a2a);
    walk(86, 93, 4012, 4023);
    walk(86, Math.round(eastX(4008)), 4006, 4011);
    // Shiraike: the milky white pond in a Japanese garden, a little red bridge, stone lanterns, a stone pagoda; its gate
    // on the north wall by the main path
    hotPool(96, 4440, 30, 16, C.milk, 95, C.rock);
    gate(114, 4506, 30, 0x2b3c78);
    walk(128, Math.round(eastX(4509)), 4507, 4512);
    {
      const X0 = 62 * S;
      const X1 = 130 * S;
      const YC = Y(4441) * S;
      for (let X = X0; X < X1; X++) {
        const t = (X - X0) / (X1 - X0);
        const arch = Math.round(Math.sin(t * Math.PI) * 9);
        for (let j = 0; j < 12; j++) {
          const yr = YC - 6 + j - arch;
          const e = Math.min(j, 11 - j);
          img.px(X, yr, e < 2 ? (j < 6 ? 0xf0604a : 0x9a2a1e) : X % 5 === 0 ? 0x8a6a4a : 0xa0805a);
        }
        for (let j = 0; j < 3; j++) img.tintPx(X + 3, YC + 7 + j - Math.floor(arch / 3), 0.72);
        // the rails, a post at every step
        if (X % 12 === 0) for (const yr of [YC - 6 - arch, YC + 4 - arch]) for (let j = -3; j < 0; j++) img.px(X, yr + j, 0x9a2a1e);
      }
      folk(84, Y(4441) - 3.6, { yukata: true });
      folk(104, Y(4441) - 4, {});
      kit.path([[64, 4441], [128, 4441]], [stepper(0xe8e0d0, 0, 4440, true), stepper(0xe8e0d0, 1, 4440, true)], { sp: 3, mode: 'pp', hold: 3, turn: 'none', fps: 3, s0: 0.3 });
    }
    plume(110, Y(4446), 1.4);
    for (const [x, u] of [[62, 4420], [134, 4420], [130, 4462]]) stoneLantern(x, Y(u));
    {
      // the many-roofed stone pagoda
      const x = 92;
      const y = Y(4478);
      const X = x * S;
      const Yy = y * S;
      objects.push({
        y: y + 1,
        shadow: () => {
          for (let k = 0; k < 26; k++) for (let t = -3; t <= 3; t++) img.tintPx(X + 3 + k, Yy + Math.floor(k * 0.55) + t, 0.74);
        },
        draw: () => {
          for (let j = 0; j < 4; j++) for (let i = -9; i <= 9; i++) img.px(X + i, Yy - j, j === 3 ? C.stone[3] : C.stone[1]);
          let yy = Yy - 4;
          for (const hw of [8, 7, 6, 5, 4]) {
            for (let j = 0; j < 5; j++) for (let i = -hw + 3; i <= hw - 3; i++) img.px(X + i, yy - j, i < 0 ? C.stone[2] : C.stone[1]);
            yy -= 5;
            for (let j = 0; j < 3; j++) for (let i = -hw - j; i <= hw + j; i++) img.px(X + i, yy - 2 + j, j === 2 ? C.stone[0] : i < 0 ? C.stone[3] : C.stone[2]);
            yy -= 3;
          }
          for (let j = 0; j < 7; j++) img.px(X, yy - j, C.stone[3]);
        },
      });
    }
    {
      const pts = flags([[129, 4490], [129, 4470], [112, 4466], [70, 4470], [62, 4446], [64, 4426], [88, 4418], [130, 4420], [132, 4440], [129, 4470]], 2.4);
      kit.path(pts, [stepper(0x2b3c78, 0, 4450, true), stepper(0x2b3c78, 1, 4450, true)], { sp: 3.5, n: 2, gap: 70, turn: 'none', fps: 3 });
      kit.path(pts, [stepper(0xd04040, 0, 4450), stepper(0xd04040, 1, 4450)], { sp: 3.2, n: 2, gap: 90, turn: 'none', fps: 3, s0: 0.4 });
      for (const [x, u] of [[129, 4480], [100, 4467], [70, 4460], [64, 4436], [110, 4419], [131, 4430]]) crowd(x - 3, Y(u), 6, 2, 2, true);
    }
    runoffs(30, 3330, 146, 3500, 6601);
    runoffs(8, 3560, 146, 3830, 6602);
    runoffs(8, 4040, 146, 4400, 6603);
    fumaroles(36, 3340, 140, 3495, 5, 6604);
    fumaroles(14, 3566, 140, 3825, 10, 6605);
    fumaroles(14, 4046, 140, 4395, 12, 6606);
    dress(30, 3330, 146, 3500);
    dress(8, 3560, 146, 3830);
    dress(8, 4040, 146, 4400);
    dress(52, 4404, 146, 4490);
    // the souvenir row off the coach park: stalls of eggs and steamed buns, combs and hot-spring powder under their awnings, a
    // paved street from the main path to the west, steam off the steamers; flags on from it to Kamado's gate
    {
      const U0 = 3944;
      const HW = 6;
      const xEnd = Math.round(eastX(U0)) - 4;
      for (let Yr = Y(U0 + HW) * S; Yr < Y(U0 - HW) * S; Yr++)
        for (let X = 6 * S; X < xEnd * S; X++) {
          const row = Yr >> 3;
          const XX = X + (row % 2) * 6;
          const e = Math.min(Yr - Y(U0 + HW) * S, Y(U0 - HW) * S - 1 - Yr);
          img.px(X, Yr, e < 2 ? 0x6e6a60 : Yr % 8 === 0 || XX % 12 === 0 ? 0x7e7a70 : rampColor(C.stone, 0.5 + hashPx(XX >> 3, row, 217) * 0.35, X, Yr));
        }
      reserveRect(6, Y(U0 + HW), xEnd - 6, HW * 2);
      flags([[100, 3919], [100, U0 - 5]], 3);
      flags([[122, U0 + 5], [122, 4006], [94, 4008]], 2.6);
      const sr = rng(6731);
      const stall = (x, y, north) => {
        const aw = sr.pick([0xc83a2a, 0x2b3c78, 0x3a7a4a, 0xe8c040, 0xd86a2a]);
        const X = x * S;
        const Yy = y * S;
        const goods = sr.pick([[0xf8f4ea, 0xe8e0d0], [0xd8a040, 0xb88a30], [0x6a9a5a, 0x4a7a3a], [0xe89aa0, 0xd87a84]]);
        objects.push({
          y: y + 8,
          shadow: () => shadowRect(x + 1, y + 1, 14, 8, 0.66),
          draw: () => {
            for (let j = 0; j < 15; j++) for (let i = 0; i < 42; i++) img.px(X + i, Yy + j, j === 7 ? scaleColor((i >> 3) % 2 ? aw : 0xf4f0e6, 1.12) : (i >> 3) % 2 ? aw : 0xf4f0e6);
            for (let i = 0; i < 42; i++) if (i % 8 < 4) img.px(X + i, Yy + 15, (i >> 3) % 2 ? scaleColor(aw, 0.7) : 0xc8c4b8);
            for (let j = 16; j < 24; j++)
              for (let i = 0; i < 42; i++) {
                const shelf = j === 16 || i === 0 || i === 41;
                img.px(X + i, Yy + j, shelf ? 0x5e4430 : (i + (j >> 1) * 3) % 5 < 3 ? ((i >> 1) + j) % 3 ? goods[0] : goods[1] : 0x76583e);
              }
          },
        });
        reserveRect(x, y, 14, 8);
        void north;
      };
      let k = 0;
      for (let x = 10; x < xEnd - 16; x += 16 + Math.floor(sr() * 4), k++) {
        if (!anyRes(x, Y(U0 + HW + 9), 14, 8) && x + 14 < 92) stall(x, Y(U0 + HW + 9), true);
        if (!anyRes(x, Y(U0 - HW) + 1, 14, 8)) stall(x, Y(U0 - HW) + 1, false);
        if (k % 3 === 1) kit.emit(x + 6, U0 + HW + 4, [2, 3, 4].map(puffFrames), { rate: 1.3, life: [1.4, 2.2], vy: 6, sx: 2, wf: 0.6, a: 0.55, d: 1.1, tint: 1 });
      }
      for (let i = 0; i < 44; i++) folk(10 + sr() * (xEnd - 14), Y(U0 + (sr() - 0.5) * (HW * 1.6)), { yukata: sr() < 0.25 });
      for (const [c, s0, yk] of [[0xd04040, 0.1, false], [0x3a6ad0, 0.4, false], [0x2b3c78, 0.6, true], [0xe8e8f0, 0.85, false]])
        kit.path([[10, U0 + (s0 > 0.5 ? 3 : -2)], [xEnd, U0 + (s0 > 0.5 ? 3 : -2)]], [stepper(c, 0, U0, yk), stepper(c, 1, U0, yk)], { sp: 3.2, mode: 'pp', hold: 2, turn: 'none', fps: 3, s0 });
      signPost(3, Y(U0 + HW) + 1);
    }
    /** A hill of hot rock: boulders piled up to a crest, salts and sulphur on them, steam from its cracks (Yama Jigoku). */
    const rockHill = (cx, cu, rx, ry, seed) => {
      const hr = rng(seed);
      const cy = Y(cu);
      const RUST = [0x5a4a3c, 0x74604e, 0x8e7860, 0xa89278];
      const PALE = [0x7e7a6c, 0x9a9484, 0xb4ae9a, 0xccc6b0];
      // scree running out onto the lawn
      for (let k = 0; k < (rx + ry) * 7; k++) {
        const a = hr() * Math.PI * 2;
        const d = 0.95 + hr() * 0.3;
        rockPx((cx + Math.cos(a) * d * rx) * S, (cy + Math.sin(a) * d * ry) * S, 0.8 + hr() * 1.4, C.rock, seed + k);
      }
      img.fine(cx - rx - 2, cy - ry - 2, 2 * rx + 4, 2 * ry + 4, (X, Yr, x, y) => {
        const e = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + (fbm(x, y, { seed, scale: 6 }) - 0.5) * 0.3;
        if (e > 1) return null;
        const v = 0.2 + (1 - e) * 0.5 - ((x - cx) / rx + (y - cy) / ry) * 0.2;
        const patch = fbm(x, y, { seed: seed + 5, scale: 11, octaves: 2 }) + (hashPx(X, Yr, seed + 7) - 0.5) * 0.26;
        const ramp = patch > 0.58 ? RUST : patch < 0.38 ? PALE : C.rock;
        const c = rampColor(ramp, v + (hashPx(X >> 1, Yr >> 1, seed) - 0.5) * 0.3, X, Yr);
        return hashPx(X, Yr, seed + 1) > 0.992 ? 0xe8dcc0 : c;
      });
      const stones = [];
      for (let k = 0; k < (rx * ry) / 11; k++) {
        const a = hr() * Math.PI * 2;
        const d = Math.sqrt(hr()) * 0.92;
        stones.push([cx + Math.cos(a) * d * rx, cy + Math.sin(a) * d * ry, 1 - d]);
      }
      stones.sort((a, b) => a[1] - b[1]);
      stones.forEach(([x, y, h], k) => {
        const patch = fbm(x, y, { seed: seed + 5, scale: 11, octaves: 2 }) + (hr() - 0.5) * 0.26;
        const ramp = patch > 0.58 ? RUST : patch < 0.38 ? PALE : C.rock;
        const size = hr() < 0.2 ? 6 + hr() * 4 : 2 + hr() * 3;
        rockPx(x * S, y * S, size + h * 2, ramp.map((c) => scaleColor(c, 0.85 + h * 0.4)), seed + k);
      });
      // dark cracks between them, yellow crusted, steam from each
      for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) if (x >= 0 && x < W && ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1.1) reserved[y * W + x] = 1;
      for (let k = 0; k < 4; k++) {
        const a = hr() * Math.PI * 2;
        const d = hr() * 0.6;
        const x = cx + Math.cos(a) * d * rx;
        const y = cy + Math.sin(a) * d * ry;
        let CXp = x * S;
        let CYp = y * S;
        for (let i = 0; i < 26; i++) {
          CXp += hr() < 0.5 ? 1 : 0;
          CYp += hr() < 0.6 ? 1 : -1;
          img.px(Math.round(CXp), Math.round(CYp), 0x1a1612);
          img.px(Math.round(CXp) + 1, Math.round(CYp), 0x2e2a26);
          if (hr() < 0.6) img.px(Math.round(CXp + (hr() - 0.5) * 8), Math.round(CYp + (hr() - 0.5) * 6), 0xe0d068);
        }
        plume(x, y, 0.9 + hr() * 0.6, { front: true });
      }
    };
    rockHill(28, 4446, 22, 30, 7111);
    rockHill(134, 4600, 17, 20, 7112);
    {
      // the rail and the view from its foot
      poolRail(28, 4446, 19, 27, 8);
      flags([[28, 4408], [52, 4402], [100, 4402], [100, 4394]], 2.4);
      poolRail(134, 4600, 14, 17, 5);
      flags([[134, 4576], [Math.round(eastX(4572)), 4572]], 2.4);
      signPost(46, Y(4410));
    }
    // gift shops and trees between the hells
    for (let k = 0; k < 6; k++) {
      const x = 4 + rand() * 140;
      const u = HELLS[0] + 260 + rand() * 1200;
      const w = 22 + rand() * 12;
      if (!anyRes(x, Y(u), w, 22)) {
        house(Math.round(x), Y(u), Math.round(w), 11, 5, { ramp: rand.pick([ROOF.kawara, ROOF.brown, ROOF.red]), noren: rand.pick([0x2b3c78, 0x8a2a2a]) });
        crowd(x + 2, Y(u) + 17, w - 4, 3, 4, true);
      }
    }
    // between the hells: rest houses, a coach park, an inn
    parking(4, Y(3900), 60, 14);
    parking(4, Y(3920), 60, 14);
    fill(64, Y(3920), Math.round(eastX(3905)) - 64, 34, C.asphalt, 75, 4); // the coaches' apron, out to the main path
    reserveRect(64, Y(3920), Math.round(eastX(3905)) - 64, 34);
    {
      const coach = (x, y, c, c2) => {
        objects.push({
          y: y + 6,
          shadow: () => shadowRect(x + 1, y + 1, 18, 6, 0.6),
          draw: () => {
            for (let j = 0; j < 18; j++)
              for (let i = 0; i < 54; i++) {
                if ((i === 0 || i === 53) && (j === 0 || j === 17)) continue;
                let col = j < 1 ? scaleColor(c, 1.2) : j > 15 ? c2 : j > 12 ? scaleColor(c, 0.82) : c;
                if (j > 11 && j < 15 && i % 7 > 1) col = C.glass[1];
                if (j > 1 && j < 10 && (i - 8) % 16 < 8) col = j === 2 || i % 3 === 0 ? 0xd8dce0 : 0x9a9ea4;
                if (i > 49 && j > 1 && j < 16) col = C.glass[0];
                img.px(x * S + i, y * S + j, col);
              }
          },
        });
      };
      coach(70, Y(3906), 0xe8d8a0, 0xc8302a);
      coach(92, Y(3906), 0x3a6aa0, 0xf0ece4);
      coach(114, Y(3906), 0xf0ece4, 0x2a7a4a);
      crowd(70, Y(3897), 60, 3, 14, true);
    }
    house(14, Y(3990), 46, 14, 6, { ramp: ROOF.kawara, hip: true, noren: 0x2b3c78 });
    house(76, Y(3984), 40, 13, 6, { ramp: ROOF.brown, hip: true, wood: true, noren: 0x8a2a2a });
    block(8, Y(4600), 52, 18, 14, { roof: 0xb8b0a4, wall: 0xeee6d6, balcony: true, bigMark: true, items: ['ac', 'bath', 'garden'] });
    house(70, Y(4590), 44, 15, 6, { ramp: ROOF.dark, hip: true, wall: 0xeee6d6, noren: 0x2b3c78 });
    rotenburo(74, Y(4590) + 23, 34, 12, C.milk, 402);
    parking(12, Y(4650), 70, 14);
    fill(82, Y(4648), Math.round(eastX(4644)) - 82, 10, C.asphalt, 76, 4); // its drive out to the main path
    reserveRect(82, Y(4648), Math.round(eastX(4644)) - 82, 10);
    for (const [y0, y1] of [[3330, 3500], [3560, 3830], [4040, 4400], [4404, 4490]]) reserveRect(0, Y(y1), 146, y1 - y0);
    for (let k = 0; k < 700; k++) {
      const x = rand() * W;
      const u = HELLS[0] + rand() * 1400;
      if (!anyRes(x - 3, Y(u) - 3, 6, 6)) tree(rand.pick(['pine', 'broadleaf', 'broadleaf', 'palm', 'sakura', 'tiny', 'pine']), x, Y(u), 3 + rand() * 3.5);
    }
    // flowerbeds of azaleas along the lawns, benches on them, people resting
    for (let k = 0; k < 50; k++) {
      const x = rand() * W;
      const y = Y(HELLS[0] + rand() * 1400);
      if (anyRes(x - 3, y - 3, 6, 6)) continue;
      azalea(x, y, 2 + rand() * 1.8, rand.pick([0xe86a9a, 0xf0a0c0, 0xe8e8e8, 0xd84a7a]));
    }
    for (let k = 0; k < 26; k++) {
      const x = 4 + rand() * (W - 8);
      const y = Y(HELLS[0] + rand() * 1400);
      if (anyRes(x - 1, y - 1, 7, 4)) continue;
      bench(x, y);
      reserveRect(x - 1, y - 1, 7, 4);
      if (rand() < 0.6) folk(x + 2, y - 0.5);
    }
  }

  // ------------------------------------------------------------ E. Oniyama: the crocodile pens, the hippos' pool, the red oni statue
  {
    /** A crocodile from above, its snout at the -len/2 end along angle a, scutes down its back. */
    const croc = (cx, cy, a, len, tone = 0) => {
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const N = len * S;
      const CX = cx * S;
      const CY = cy * S;
      const base = tone ? [0x6a7a48, 0x34402a, 0x4e5e3a, 0x3e4e30] : [0x5a6a3a, 0x2e3a22, 0x445432, 0x3a4a2a];
      const sc = Math.min(1, len / 18);
      const drawn = new Set();
      const put = (X, Yy, c, a2 = 1) => {
        const rx = Math.round(X);
        const ry = Math.round(Yy);
        if (a2 >= 1) drawn.add(rx * 100000 + ry);
        img.px(rx, ry, c, a2);
      };
      // first the legs, under the body
      for (const [t0, spread] of [[0.27, 7], [0.55, 8]])
        for (const s of [-1, 1])
          for (let k = 0; k < spread; k++) {
            const j = t0 * N + (k * 0.5 - 1);
            const off = s * (6 + k * 0.7) * sc;
            for (const w of [0, 0.7]) put(CX + ca * (j - N / 2) - sa * off + w, CY + sa * (j - N / 2) + ca * off + w, k > spread - 3 ? base[3] : base[0]);
          }
      for (let j = 0; j < N; j += 0.5) {
        const t = j / N;
        const hw = (t < 0.18 ? 0.6 + t * 8 : t < 0.6 ? 2.2 : Math.max(0.4, 2.2 - (t - 0.6) * 5)) * S * 0.95 * sc;
        const px0 = CX + ca * (j - N / 2);
        const py0 = CY + sa * (j - N / 2);
        for (let k = -hw; k <= hw; k += 0.5) {
          const dark0 = k / hw;
          let c = dark0 < -0.35 ? base[0] : dark0 > 0.45 ? base[1] : base[2];
          // the armoured back: rows of square scutes, two ridges along it
          if (t > 0.2) {
            const row = Math.floor(j / 3.2);
            if (Math.abs(k) < hw * 0.75 && (j % 3.2 < 0.8 || Math.floor((k + hw) / 2.6) % 2 === row % 2)) c = scaleColor(c, 0.8);
            if (Math.abs(Math.abs(k) - hw * 0.45) < 0.5) c = scaleColor(c, 1.22);
          } else if (t < 0.16 && hashPx(Math.round(j), Math.round(k), 7) < 0.14) c = scaleColor(c, 0.84);
          put(px0 - sa * k, py0 + ca * k, c);
        }
        // the eyes
        if (t > 0.13 && t < 0.15)
          for (const s of [-1, 1]) {
            put(px0 - sa * s * 3 * sc, py0 + ca * s * 3 * sc, 0xd8c040);
            put(px0 - sa * s * 3 * sc + 1, py0 + ca * s * 3 * sc, 0x1a1a10);
          }
      }
    };
    // a crocodile swimming, snout to the right (the game turns it as it goes), only its back above water
    const swimmer = capture(0, Y(ONIYAMA[0] + 300) - 5, 22, 11, () => croc(11, Y(ONIYAMA[0] + 300) + 0.5, Math.PI, 18));
    // the red oni statue on his rock by the entrance, club raised (the boss, before he wakes)
    {
      const x = 152;
      const y = Y(ONIYAMA[0] + 24);
      const X = x * S;
      const Yy = y * S;
      objects.push({
        y: y + 12,
        shadow: () => {
          for (let k = 0; k < 18 * S; k++) for (let t = -7; t <= 7; t++) img.tintPx(X + 6 + k, Yy + 12 + Math.floor(k / 2) + t, 0.74);
        },
        draw: () => {
          rockPx(X, Yy + 21, 24, C.rock, 5);
          rockPx(X - 8, Yy + 25, 15, C.rock, 6);
          const RED = 0xd8302a;
          const RED2 = 0xe85a4a;
          const RED3 = 0x9a1e1a;
          // legs, body, belly, tiger skin
          for (let j = 0; j < 39; j++)
            for (let i = -13; i < 13; i++) {
              let c = i < -7 ? RED2 : i > 7 ? RED3 : RED;
              if (j > 6 && j < 20 && Math.abs(i) < 6) c = 0xe85040;
              if (j >= 25 && j < 33) c = (i + j * 2) % 7 < 2 ? 0x2a1e12 : j > 31 ? 0xb88a20 : 0xf0c030;
              if (j >= 33 && Math.abs(i) < 2) continue;
              img.px(X + i, Yy - 24 + j, c);
            }
          // the arm with the club, the other on his hip
          for (let k = 0; k < 16; k++) for (let w = 0; w < 5; w++) img.px(X + 12 + w + Math.floor(k * 0.3), Yy - 22 + k - 6, w < 2 ? RED : RED3);
          for (let k = 0; k < 14; k++) for (let w = 0; w < 5; w++) img.px(X - 17 + w, Yy - 22 + k, w < 2 ? RED2 : RED);
          // the head: the black mane, horns, glare, tusks, roar
          img.discPx(X, Yy - 33, 13.4, 0x1a1418);
          img.discPx(X, Yy - 32, 11.4, RED);
          img.discPx(X - 4, Yy - 36, 5, RED2);
          for (let k = 0; k < 9; k++) {
            for (const [ox, sx] of [[-8, -1], [7, 1]])
              for (let w = 0; w < Math.max(1, 3 - k * 0.35); w++) img.px(X + ox + sx * Math.floor(k * 0.55) + w, Yy - 43 - k, k > 5 ? 0xfff0c0 : 0xf0e0b0);
          }
          for (const ox of [-6, 2]) {
            img.rectPx(X + ox, Yy - 36, 5, 4, 0xf8f4ec);
            img.px(X + ox + 3, Yy - 35, 0x1a1418);
            img.px(X + ox + 2, Yy - 34, 0x1a1418);
          }
          img.rectPx(X - 6, Yy - 29, 13, 4, 0x2a0e0e);
          for (const ox of [-6, 5]) img.rectPx(X + ox, Yy - 30, 2, 4, 0xf8f4ec);
          // the iron club, studded, high over him
          for (let j = 0; j < 54; j++) {
            const hw = 2 + (j < 30 ? 2 : 0);
            for (let i = -hw; i <= hw; i++) img.px(X + 21 + i, Yy - 60 + j, i < 0 ? 0x3a3a42 : i > 1 ? 0x101014 : 0x1a1a1e);
            if (j < 30 && j % 5 === 2) for (const sx of [-5, 5]) {
              img.px(X + 21 + sx, Yy - 60 + j, 0xc0c0c8);
              img.px(X + 21 + sx + Math.sign(sx), Yy - 60 + j, 0x8a8a92);
            }
          }
        },
      });
      reserveRect(x - 10, y - 22, 22, 32);
    }
    // the belts of lawn and palms down the sides of the park, clipped hedges along them
    {
      const b0 = ONIYAMA[0] + 66;
      const b1 = ONIYAMA[1] - 30;
      for (const [x0, x1] of [[2, 15], [165, 178]]) {
        img.fine(x0, Y(b1), x1 - x0, b1 - b0, (X, Yr, xx, yy) => {
          const e = Math.min(xx - x0, x1 - xx, yy - Y(b1), Y(b0) - yy);
          if (e < 0.5) return 0xb8b4a8;
          if (e < 2) {
            const t = hashPx(X >> 1, Yr >> 1, 215);
            return t < 0.2 ? 0x4e7a44 : t < 0.65 ? 0x34603a : 0x2a4e30;
          }
          let c = rampColor(C.lawn, 0.3 + hashPx(X >> 2, Yr >> 2, 216) * 0.5, X, Yr);
          if (hashPx(X, Yr, 217) > 0.995) c = 0xf4f0e0;
          return c;
        });
        reserveRect(x0, Y(b1), x1 - x0, b1 - b0);
        for (let u = b0 + 16, k = 0; u < b1 - 8; u += 34, k++) {
          if (k % 3 === 2) azalea((x0 + x1) / 2, Y(u), 3.2, 0xe86a9a);
          else tree(k % 2 ? 'palm' : 'broadleaf', (x0 + x1) / 2 + (k % 2 ? 1 : -1), Y(u), 5.5);
        }
      }
      // the middle walk in red brick, a bed of flowers where the cross walks meet it
      img.fine(85, Y(b1), 12, b1 - b0, (X, Yr) => {
        const row = Yr >> 2;
        const XX = X + (row % 2) * 4;
        return Yr % 4 === 0 || XX % 8 === 0 ? 0x6a5a50 : rampColor([0x8a5a48, 0x9a6a54, 0xa87a60], hashPx(XX >> 3, row, 218), X, Yr);
      });
      for (let u = ONIYAMA[0] + 30; u < ONIYAMA[1] - 60; u += 72) {
        const y = Y(u + 65);
        azalea(88, y, 2.2, 0xf0a0c0);
        azalea(94, y, 2.2, 0xe8e8e8);
      }
    }
    house(96, Y(ONIYAMA[0] + 40), 40, 12, 6, { ramp: ROOF.red, hip: true, wall: 0xe8e0d0, noren: 0x8a2a2a });
    crowd(96, Y(ONIYAMA[0] + 21), 40, 3, 8, true);
    const penWater = [0x2e4e42, 0x3e5e4e, 0x4e6e58, 0x6a8a6e];
    let pen = 0;
    for (let u = ONIYAMA[0] + 30; u < ONIYAMA[1] - 60; u += 72)
      for (const x0 of [24, 98]) {
        const y = Y(u + 58);
        if (anyRes(x0, y, 60, 58)) continue;
        const kind = pen++ % 5;
        // a concrete pen: a warm green pool with a sandy ledge where the crocodiles bask, a rail around; no two alike.
        // One of them is the hippos'
        const hippo = pen === 6;
        const nursery = pen % 7 === 2;
        if (pen === 4) {
          // the show ring: a round pool with a rock in it, benches rising in a half circle to the south of it, a full house, the
          // keeper on his plank over the water
          const cx = x0 + 30;
          const cy = y + 22;
          img.fine(x0, y, 60, 58, (X, Yr, xx, yy) => {
            const e = Math.min(xx - x0, yy - y, x0 + 60 - xx, y + 58 - yy);
            if (e < 0.6) return C.stone[3];
            if (e < 2) return e < 1 ? C.stone[0] : rampColor(C.stone, 0.4 + hashPx(X >> 2, Yr >> 2, 110) * 0.3, X, Yr);
            const d = Math.hypot(xx - cx, yy - cy);
            if (d < 15) {
              const n = fbm(xx, yy, { seed: 111, scale: 5 });
              const r = Math.sin(d * 1.8 + n * 5);
              let c = rampColor(penWater, 0.25 + n * 0.5 + (15 - d) * 0.015, X, Yr);
              if (r > 0.92) c = scaleColor(c, 1.2);
              if (d > 13.6) c = scaleColor(c, 0.74);
              return c;
            }
            if (d < 16.4) return (X + Yr) % 7 === 0 ? 0x4a4a42 : 0x6a665c;
            if (yy > cy + 3 && d > 18.5) {
              const k = (d - 18.5) % 5;
              if (k < 3.2) return k < 0.7 ? 0xa0805a : Math.floor(Math.atan2(yy - cy, xx - cx) * 22) % 7 === 0 ? 0x4a3424 : hashPx(X >> 2, Yr >> 1, 112) < 0.5 ? C.wood[2] : C.wood[1];
              return 0x3a2a1c;
            }
            const t = hashPx(X >> 1, Yr >> 1, 112);
            return t < 0.1 ? 0x9a8e72 : t > 0.9 ? 0xd8ccae : rampColor([0xa89c80, 0xb8ac90, 0xc8bca0], fbm(xx, yy, { seed: 113, scale: 4 }), X, Yr);
          });
          rockPx(cx * S, cy * S, 15, C.rock, 411);
          rockPx((cx - 4) * S, (cy + 2) * S, 9, C.rock, 412);
          croc(cx + 1, cy - 1, 0.3, 18, 0);
          kit.wander(cx, U(cy), 10, 9, [swimmer], { n: 2, sp: 3, idle: 0.5, turn: 'rot' });
          const ar = rng(u + x0);
          for (let k = 0; k < 46; k++) {
            const a = 0.12 + ar() * (Math.PI - 0.24);
            const d = 20.2 + Math.floor(ar() * 3) * 5;
            const fx = cx + Math.cos(a) * d;
            const fy = cy + Math.sin(a) * d;
            if (fx > x0 + 3 && fx < x0 + 57 && fy < y + 55 && fy > cy + 4) folk(fx, fy, { hat: ar() < 0.15 });
          }
          // the plank, the keeper, a fowl on his long pole
          const PX = cx * S;
          for (let j = (cy - 20) * S; j < (cy - 8) * S; j++) for (let i = -5; i < 6; i++) img.px(PX + i, j, Math.abs(i) > 4 ? 0x4a3424 : j % 6 === 0 ? 0x5e4430 : 0x8e6a4a);
          folk(cx, cy - 15, { coat: 0x3a6a4a, hat: true, extra: (X, Yy) => {
            img.linePx(X + 2, Yy + 1, X + 9, Yy + 14, 0x8a6a40);
            for (let j = 0; j < 4; j++) img.px(X + 9, Yy + 14 + j, 0xf0e8d8);
          } });
          for (let X = x0 * S; X < (x0 + 60) * S; X++) {
            img.px(X, y * S, X % 12 === 0 ? 0x5a5e64 : 0xc8c8c8);
            img.px(X, y * S + 1, 0x4a4e54);
          }
          tree('palm', x0 + 6, y + 8, 5.5);
          tree('palm', x0 + 54, y + 8, 5.5);
          reserveRect(x0 - 2, y - 2, 64, 62);
          crowd(x0, y + 59, 60, 2, 12, true);
          continue;
        }
        const water = hippo ? [0x4a5a50, 0x5a6a5c, 0x6a7a68, 0x8a9a84] : penWater;
        const shape = (xx, yy) => {
          const nx = (xx - (x0 + 30)) / (nursery ? 15 : 25);
          const ny = (yy - (y + 31)) / (nursery ? 12 : 19);
          if (kind === 1) return nx * nx + ny * ny; // round
          if (kind === 2) return nx ** 4 + ny ** 4; // a rounded square
          if (kind === 3) return Math.max(0, Math.abs(nx) - 0.45) ** 2 / 0.3 + ny * ny; // a long pool with round ends
          return Math.max(Math.abs(nx), Math.abs(ny)) ** 8;
        };
        img.fine(x0, y, 60, 58, (X, Yr, xx, yy) => {
          const e = Math.min(xx - x0, yy - y, x0 + 60 - xx, y + 58 - yy);
          if (e < 0.6) return C.stone[3];
          if (e < 2) return e < 1 ? C.stone[0] : rampColor(C.stone, 0.4 + hashPx(X >> 2, Yr >> 2, 110) * 0.3, X, Yr);
          const s = shape(xx, yy);
          if (s < 1) {
            const n = fbm(xx, yy, { seed: 111, scale: 5 });
            const r = Math.sin((xx + 4 * n) * 1.7 + (yy + 6 * n) * 2.3);
            let c = rampColor(water, 0.25 + n * 0.5 + (1 - s) * 0.2, X, Yr);
            if (r > 0.92) c = scaleColor(c, 1.2);
            if (s > 0.86) c = scaleColor(c, 0.74);
            return c;
          }
          if (s < 1.14) return (X + Yr) % 7 === 0 ? 0x4a4a42 : 0x6a665c; // the kerb of the pool
          // the sand of the ledge, tramped by the crocodiles
          const t = hashPx(X >> 1, Yr >> 1, 112);
          return t < 0.1 ? 0x9a8e72 : t > 0.9 ? 0xd8ccae : rampColor([0xa89c80, 0xb8ac90, 0xc8bca0], fbm(xx, yy, { seed: 113, scale: 4 }), X, Yr);
        });
        // their rocks and a palm in the corner of the pen, the rail along the front
        const pr = rng(u * 3 + x0);
        if (!hippo && kind !== 1 && !nursery) {
          // a rock breaking the water for the crocodile on it
          rockPx((x0 + 18 + pr() * 24) * S, (y + 26 + pr() * 12) * S, 7 + pr() * 4, C.rock, u + x0);
        }
        for (let k = 0; k < 4; k++) rockPx((x0 + 5 + pr() * 50) * S, (y + 5 + pr() * 4) * S, 3 + pr() * 5, C.rock, k + u);
        tree('palm', x0 + (kind % 2 ? 6 : 53), y + 8, 5.5);
        for (let X = x0 * S; X < (x0 + 60) * S; X++) {
          for (const yr of [y * S, (y + 57) * S + 2]) {
            img.px(X, yr, X % 12 === 0 ? 0x5a5e64 : 0xc8c8c8);
            img.px(X, yr + 1, 0x4a4e54);
          }
        }
        for (let Yr = y * S; Yr < (y + 58) * S; Yr++)
          for (const X of [x0 * S, (x0 + 60) * S - 2]) {
            img.px(X, Yr, Yr % 12 === 0 ? 0x5a5e64 : 0xc8c8c8);
            img.px(X + 1, Yr, 0x4a4e54);
          }
        if (hippo) {
          // two hippos in the warm water, ears and backs above it, one basking on the ledge
          const bulk = (cx, cy, rx, ry, c) => {
            img.fine(cx - rx - 1, cy - ry - 1, 2 * rx + 3, 2 * ry + 3, (X, Yr, xx, yy) => {
              const dx = (xx - cx) / rx;
              const dy = (yy - cy) / ry;
              const d = dx * dx + dy * dy;
              if (d > 1) return null;
              return scaleColor(c, 1.2 - (dx + dy) * 0.3 - d * 0.1);
            });
          };
          const hip = (x, yy, swim) => {
            const BX = x * S;
            const BY = yy * S;
            if (swim) {
              // the water closing round it, a thin ring of light
              img.fine(x - 11, yy - 7, 27, 14, (X, Yr, xx, y2) => {
                const d = Math.hypot((xx - x - 2) / 12, (y2 - yy) / 6);
                if (d > 1 || d < 0.88) return null;
                return [0xb8c8b0, 0.7];
              });
            } else {
              img.fine(x - 8, yy - 4, 28, 13, (X, Yr, xx, y2) => (Math.hypot((xx - x - 3) / 13, (y2 - yy - 3) / 6) < 1 ? [0x101410, 0.3] : null));
              // the stumps of its legs
              for (const [lx, ly] of [[-5, 3.6], [4, 3.6], [-5, -3.6], [4, -3.6]]) img.discPx(BX + lx * S, BY + ly * S, 4.4, 0x483e42);
            }
            bulk(x, yy, 9, 5, 0x5e5458);
            // the sheen along its back, the folds behind the head, the little tail
            for (let i = -18; i < 15; i++) {
              img.px(BX + i, BY - 7 - Math.round(((i + 2) / 18) ** 2 * 3), 0x8a7e82);
              img.px(BX + i, BY - 8 - Math.round(((i + 2) / 18) ** 2 * 3), 0x74686c);
            }
            for (const fx of [14, 18]) for (let j = -9; j < 10; j++) if (Math.abs(j) < 10 - (fx - 14)) img.px(BX + fx + (j % 3 === 0 ? 1 : 0), BY + j, 0x483e42);
            for (let i = 0; i < 4; i++) img.px(BX - 27 - i, BY + (i >> 1), 0x3e3438);
            // the great head: brow, broad pink muzzle, nostrils, eyes up top, ears
            bulk(x + 9, yy, 4.2, 3.6, 0x665a5e);
            bulk(x + 13, yy, 2.8, 3.8, 0x8a6e72);
            for (const sy of [-1, 1]) {
              img.rectPx(BX + 44, BY + sy * 6 - 1, 3, 2, 0x2a1c1e);
              img.px(BX + 30, BY + sy * 6, 0x1a1418);
              img.px(BX + 30, BY + sy * 7, 0xf0e8e0);
              img.rectPx(BX + 22, BY + sy * 11 - 1, 3, 3, 0x8a7074);
              img.px(BX + 23, BY + sy * 11, 0xc89098);
            }
            for (let j = -8; j < 9; j++) if (Math.abs(j) > 1) img.px(BX + 48, BY + j, 0x5a3e42);
          };
          hip(x0 + 18, y + 7);
          hip(x0 + 26, y + 30, true);
          hip(x0 + 34, y + 42, true);
        } else {
          if (nursery) {
            // the nursery: hatchlings by the dozen sunning all round a little pool
            for (let k = 0; k < 26; k++) {
              const hx = x0 + 7 + pr() * 46;
              const hy = y + 14 + pr() * 34;
              if (shape(hx, hy) < 1.3) continue;
              croc(hx, hy, pr() * Math.PI * 2, 7 + pr() * 4, k % 2);
            }
          }
          for (let k = 0; k < 2; k++) croc(x0 + 14 + k * 26 + rand() * 6, y + 6 + rand() * 2, (rand() - 0.5) * 0.3 + (k ? Math.PI : 0), 18, k);
          // more of them, along the south ledge and one or two half in the water, snouts on the kerb
          if (pen % 2) croc(x0 + 18 + pr() * 22, y + 53, Math.PI + (pr() - 0.5) * 0.3, 20, 0);
          if (pen % 3 === 0) croc(x0 + 40 - pr() * 8, y + 52, (pr() - 0.5) * 0.3, 16, 1);
          if (pen % 4 === 1) croc(x0 + 12 + pr() * 6, y + 26 + pr() * 10, Math.PI / 2 + (pr() - 0.5) * 0.5, 15, 1);
          if (pen % 4 === 3) croc(x0 + 50 - pr() * 6, y + 26 + pr() * 10, -Math.PI / 2 + (pr() - 0.5) * 0.5, 15, 0);
          if (pen % 7 === 5) {
            // a corrugated shade roof over the south ledge, on four posts
            const SX0 = (x0 + 8) * S;
            const SX1 = (x0 + 52) * S;
            const SY0 = (y + 48) * S;
            const SY1 = (y + 55) * S;
            objects.push({
              y: y + 56,
              shadow: () => {
                for (let Yr = SY0; Yr < SY1; Yr++) for (let X = SX0; X < SX1; X++) img.tintPx(X + 6, Yr + 8, 0.66);
              },
              draw: () => {
                for (let Yr = SY0; Yr < SY1; Yr++)
                  for (let X = SX0; X < SX1; X++) {
                    const e = Math.min(Yr - SY0, SY1 - 1 - Yr);
                    img.px(X, Yr, e === 0 ? 0xb8bcc0 : (X - SX0) % 6 < 3 ? 0x9aa0a6 : 0x7e848a);
                  }
                for (const X of [SX0 + 1, SX1 - 2]) for (let j = 0; j < 6; j++) img.px(X, SY1 + j, 0x3a3e44);
              },
            });
          }
          // two more swim about the pool (live)
          kit.wander(x0 + 30, U(y + 31), nursery ? 8 : 18, nursery ? 6 : 11, [swimmer], { n: 2, sp: 3, idle: 0.5, turn: 'rot' });
        }
        reserveRect(x0 - 2, y - 2, 64, 62);
        plume(x0 + 16 + rand() * 28, y + 34, 1.1);
        crowd(x0, y + 59, 60, 2, 10, true);
        // the pen's board on the rail, a pergola to wait under
        {
          const X = (x0 + 3) * S;
          const Yy = (y + 58) * S;
          const sr = rng(u + x0);
          objects.push({
            y: y + 60,
            draw: () => {
              for (let j = 0; j < 9; j++) for (let i = 0; i < 18; i++) img.px(X + i, Yy - 6 + j, i === 0 || i === 17 || j === 0 || j === 8 ? 0x2a1e18 : 0xf0e8d8);
              for (let k = 0; k < 3; k++) glyph(X + 2 + k * 5, Yy - 4, 4, hippo ? 0x3a3a60 : 0x2a5a2a, sr);
              for (const i of [3, 14]) for (let j = 3; j < 7; j++) img.px(X + i, Yy + j, 0x3a2a1c);
            },
          });
          if (pen % 2 === 0) {
            const PX0 = (x0 + 12) * S;
            const PX1 = (x0 + 48) * S;
            const PY0 = (y + 60) * S;
            const PY1 = (y + 67) * S;
            objects.push({
              y: y + 68,
              shadow: () => {
                for (let Yr = PY0; Yr < PY1; Yr++) for (let X2 = PX0; X2 < PX1; X2++) img.tintPx(X2 + 5, Yr + 7, 0.7);
              },
              draw: () => {
                for (let Yr = PY0; Yr < PY1; Yr++)
                  for (let X2 = PX0; X2 < PX1; X2++) {
                    const ridge = Math.abs(Yr - (PY0 + PY1) / 2) < 1;
                    const c = (X2 >> 3) % 2 ? 0x3a7a5a : 0xe8e4d8;
                    img.px(X2, Yr, ridge ? scaleColor(c, 1.1) : Yr < (PY0 + PY1) / 2 ? c : scaleColor(c, 0.8));
                  }
                for (let X2 = PX0; X2 < PX1; X2++) {
                  img.px(X2, PY1, (X2 >> 3) % 2 ? 0x2a5a42 : 0xc8c4b8);
                  if (X2 % 4 === 0) img.px(X2, PY1 + 1, (X2 >> 3) % 2 ? 0x2a5a42 : 0xc8c4b8);
                }
                for (const X2 of [PX0 + 1, PX1 - 2]) for (let j = 1; j < 6; j++) img.px(X2, PY1 + j, 0x3a3e44);
              },
            });
          }
        }
        // a keeper on the walkway, a fowl on the end of a long pole held over the pen for the show
        if (kind === 2 && !hippo) {
          const KX = (x0 + 30) * S;
          const KY = (y + 59) * S;
          folk(x0 + 30, y + 60, { coat: 0x3a6a4a, hat: true, extra: () => {
            img.linePx(KX + 1, KY + 1, KX + 4, KY - 36, 0x8a6a40);
            img.linePx(KX + 2, KY + 1, KX + 5, KY - 36, 0x5e4430);
            for (let j = 0; j < 6; j++) img.px(KX + 4, KY - 36 + j, 0xf0e8d8);
          } });
          crowd(x0 + 16, y + 60, 28, 2, 14, true);
        }
      }
    // the entrance plaza: stalls of crocodile souvenirs, a clipped bed round the statue, the queue at the ticket window
    {
      const py = Y(ONIYAMA[0] + 14);
      for (const [x, c] of [[60, 0xc83a2a], [78, 0x2b3c78]]) {
        const X = x * S;
        const Yy = (py - 8) * S;
        objects.push({
          y: py,
          shadow: () => shadowRect(x + 1, py - 7, 15, 8, 0.7),
          draw: () => {
            for (let j = 0; j < 18; j++) for (let i = 0; i < 45; i++) img.px(X + i, Yy + j, (i >> 2) % 2 ? c : 0xf4f0e6);
            for (let j = 18; j < 24; j++) for (let i = 0; i < 45; i++) img.px(X + i, Yy + j, j === 18 ? 0x2a2420 : i % 5 === 0 ? 0x4a3424 : (i * 3 + j) % 7 === 0 ? 0xd8a040 : 0x76583e);
          },
        });
        reserveRect(x, py - 8, 15, 8);
        crowd(x, py + 1, 15, 3, 5, true);
      }
      for (let k = 0; k < 6; k++) azalea(140 + k * 5, Y(ONIYAMA[0] + 6 + (k % 2) * 3), 2, 0xe86a9a);
      crowd(106, Y(ONIYAMA[0] + 32), 40, 6, 14, true);
      for (const x of [10, 44]) {
        fill(x, Y(ONIYAMA[0] + 28), 16, 12, C.grass, 214, 4);
        tree('palm', x + 8, Y(ONIYAMA[0] + 22), 6);
        reserveRect(x, Y(ONIYAMA[0] + 28), 16, 12);
      }
    }
    // the walks between the pens: planters of palms, benches, the route the visitors take (live)
    for (let u = ONIYAMA[0] + 30; u < ONIYAMA[1] - 60; u += 72) {
      bench(17, Y(u + 30));
      bench(87, Y(u + 12));
      lampPost(90, Y(u + 40));
      lampPost(162, Y(u + 20));
    }
    {
      const wr = rng(6681);
      for (const [c, x] of [[0xd04040, 19], [0x3a6ad0, 91], [0xe8e8f0, 90], [0xe8c040, 161], [0x2b3c78, 20], [0x3a3a4a, 92]])
        kit.path([[x, ONIYAMA[0] + 40], [x + (wr() - 0.5) * 3, ONIYAMA[1] - 30]], [stepper(c, 0, 5000), stepper(c, 1, 5000)], { sp: 3.5, mode: 'pp', hold: 3, turn: 'none', fps: 3, s0: wr() });
    }
    for (let k = 0; k < 30; k++) {
      const x = rand() * W;
      const u = ONIYAMA[0] + rand() * 750;
      if (!anyRes(x - 3, Y(u) - 3, 6, 6)) tree(rand.pick(['palm', 'broadleaf', 'tiny', 'palm']), x, Y(u), 3 + rand() * 3);
    }
  }

  // ------------------------------------------------------------ F. Takasakiyama: woods full of monkeys, a temple
  // (with the Tsurumi ropeway's cables strung high over the woods: pylons, stations at both ends, two red
  // cabins gliding up and down with their shadows sliding over the trees below)
  {
    const R0 = [8, TAKASAKI[0] + 30];
    const R1 = [168, TAKASAKI[1] - 20];
    const at = (t) => [R0[0] + (R1[0] - R0[0]) * t, R0[1] + (R1[1] - R0[1]) * t];
    for (const [x, u] of [R0, R1]) {
      const y = Y(u);
      objects.push({
        y: y + 10,
        shadow: () => shadowRect(x - 5, y - 3, 14, 12, 0.55),
        draw: () => {
          // the station: a grey shed with its wheel house, the lit bay the cabins come into
          for (let j = 0; j < 30; j++)
            for (let i = 0; i < 42; i++) {
              const e = Math.min(i, j);
              const e2 = Math.min(41 - i, 29 - j);
              let c = e === 0 ? 0xc0c2c8 : e2 === 0 ? 0x5a5c62 : (i % 9 === 0 ? 0x7a7c82 : 0x8a8c92);
              if (j > 12 && j < 25 && i > 4 && i < 37) c = (i - 5) % 8 === 0 ? 0x5a6a7a : j < 15 ? 0x6a8aa8 : 0x3a5a7a;
              img.px((x - 7) * S + i, (y - 5) * S + j, c);
            }
          img.discPx(x * S, (y - 1) * S, 3, 0x4a4a50);
          img.discPx(x * S, (y - 1) * S, 1.4, 0xc8cad0);
        },
      });
      reserveRect(x - 9, y - 7, 18, 14);
    }
    objects.push({
      y: L + 1, // over everything: the cables run high above the trees
      draw: () => {
        const [x0, u0] = at(0);
        const [x1, u1] = at(1);
        for (const off of [-2, 2]) {
          img.linePx((x0 + off) * S, Y(u0) * S, (x1 + off) * S, Y(u1) * S, 0xc8cad0);
          img.linePx((x0 + off + 4) * S, (Y(u0) + 6) * S, (x1 + off + 4) * S, (Y(u1) + 6) * S, 0x101410, 0.22); // their shadow far below
        }
        for (const t of [0.25, 0.5, 0.75]) {
          const [xf, u] = at(t);
          const x = Math.round(xf);
          const y = Y(u);
          const X = x * S;
          const Yy = y * S;
          for (let j = 0; j < 15; j++) for (let i = 0; i < 15; i++) img.px(X + 12 + i, Yy + 12 + j, 0x101410, 0.3);
          // a lattice pylon seen from above, tapering down into the woods
          for (let j = -10; j <= 10; j++)
            for (let i = -10; i <= 10; i++) {
              const onFrame = Math.abs(i) >= 9 || Math.abs(j) >= 9 || Math.abs(i - j) < 1 || Math.abs(i + j) < 1;
              if (onFrame) img.px(X + i, Yy + j, i + j < 0 ? 0x9a9ca2 : 0x5a5c62);
            }
          for (let i = -16; i <= 16; i++) {
            img.px(X + i, Yy, 0x6a6c72);
            img.px(X + i, Yy + 1, 0x3a3a40);
          }
          for (const sx of [-6, 6]) img.discPx(X + sx, Yy, 2, 0x2a2a30);
          // a macaque or two sitting up on the crossbar, watching the cabins go by
          for (const dx of t === 0.5 ? [-12, 9] : [6]) {
            const MX = X + dx;
            for (let j = -6; j < 0; j++) for (let i = 0; i < 6; i++) img.px(MX + i, Yy + j, i === 0 ? 0x9a7a5a : i === 5 ? 0x5a4030 : 0x7a5a40);
            img.discPx(MX + 3, Yy - 8, 2.4, 0x7a5a40);
            img.rectPx(MX + 2, Yy - 8, 3, 2, 0xd87a6a);
            for (let j = 0; j < 7; j++) img.px(MX + 1, Yy + j, 0x5a4030); // the tail hanging down
          }
        }
      },
    });
    const cabin = capture(0, 0, 7, 6, () => {
      for (let j = 0; j < 15; j++)
        for (let i = 0; i < 18; i++) {
          const e = Math.min(i, j);
          const e2 = Math.min(17 - i, 14 - j);
          let c = e === 0 ? 0xf07a6a : e2 === 0 ? 0x8a2a1e : 0xc83a2a;
          if (j >= 7 && j <= 11 && i > 1 && i < 16) c = i % 4 === 0 ? 0xc83a2a : C.glass[1];
          if (j < 3 && i > 5 && i < 12) c = 0x2a2a30;
          img.px(i + 1, j + 2, c);
        }
      for (let j = 0; j < 3; j++) img.px(9, j, 0x3a3a40);
    }, 5900);
    const shade = new HiCanvas(6, 5);
    shade.rect(0, 0, 6, 5, 0x101410);
    const sf = kit.frame(shade);
    const pts = [at(0.02), at(0.98)];
    for (const s0 of [0.15, 0.85]) {
      kit.path(pts, [cabin], { sp: 9, mode: 'pp', hold: 3, turn: 'none', d: 1.2, s0 });
      kit.path(pts.map(([x, u]) => [x + 8, u - 12]), [sf], { sp: 9, mode: 'pp', hold: 3, turn: 'none', a: 0.3, d: 0.6, s0 });
    }
  }
  {
    const stairX = (u) => dodge(120 + 14 * Math.sin(u / 70), u, 4);
    // a stone stairway up the mountain: treads and risers, moss on their edges, stone lanterns up its sides, a torii
    // at its foot and a stream crossing under it
    for (let Yr = Y(TAKASAKI[1]) * S; Yr < Y(TAKASAKI[0]) * S; Yr++) {
      const u = L - (Yr + 0.5) / S;
      const c = stairX(u);
      for (let X = Math.floor((c - 5) * S); X < Math.ceil((c + 5) * S); X++) {
        const a = Math.abs((X + 0.5) / S - c);
        if (a > 4.3) {
          img.px(X, Yr, hashPx(X >> 1, Yr >> 1, 141) < 0.5 ? 0x34402a : 0x4a4640);
          continue;
        }
        if (a > 3.5) {
          img.px(X, Yr, C.stone[0]);
          continue;
        }
        const k = Yr % 9;
        const t = hashPx(X >> 3, Yr >> 3, 142);
        let col = k < 2 ? 0x4a4640 : k < 3 ? C.stone[3] : rampColor(C.stone, 0.42 + t * 0.34 - (k - 3) * 0.02, X, Yr);
        if (hashPx(X >> 1, (Yr >> 3) + 3, 143) < 0.1) col = 0x4a6a3a;
        img.px(X, Yr, col);
      }
    }
    for (let u = TAKASAKI[0]; u < TAKASAKI[1]; u++) reserveRect(stairX(u) - 5, Y(u), 10, 1);
    torii(stairX(TAKASAKI[0] + 10), Y(TAKASAKI[0] + 10), 10, 9);
    for (let u = TAKASAKI[0] + 40; u < TAKASAKI[1] - 20; u += 72) {
      stoneLantern(stairX(u) - 6.5, Y(u), true);
      stoneLantern(stairX(u + 36) + 6.5, Y(u + 36), true);
    }
    {
      const wr = rng(6691);
      for (const [c, s0] of [[0xe8e8f0, 0.2], [0xd04040, 0.45], [0x3a6ad0, 0.7], [0x3a3a4a, 0.92]]) {
        const pts = [];
        for (let u = TAKASAKI[0] + 8; u <= TAKASAKI[1] - 8; u += 16) pts.push([Math.round(stairX(u)) + (wr() < 0.5 ? -2 : 1), u]);
        kit.path(pts, [stepper(c, 0, 5900), stepper(c, 1, 5900)], { sp: 3, mode: 'pp', hold: 3, turn: 'none', fps: 3, s0 });
      }
    }
    // the stream down through the woods, stones in it, a little bridge where the stairs cross
    {
      const SU = (x) => 5960 + 22 * Math.sin(x / 30) + (x - 90) * 0.18;
      for (let X = 0; X < W * S; X++) {
        const x = (X + 0.5) / S;
        const uc = SU(x);
        for (let Yr = Math.floor((L - uc - 4) * S); Yr < (L - uc + 4) * S; Yr++) {
          const a = Math.abs(L - (Yr + 0.5) / S - uc);
          if (a > 3.6) continue;
          const c0 = stairX(uc);
          if (Math.abs(x - c0) < 5.2) continue;
          const r = hashPx(X >> 1, Yr >> 1, 144);
          img.px(X, Yr, a > 2.7 ? (r < 0.5 ? 0x5a5650 : 0x3a3a34) : r > 0.9 ? 0xe8f0f0 : rampColor([0x3a5e6a, 0x4e7a84, 0x6a98a0], 0.5 + Math.sin(x * 1.3 + a) * 0.3, X, Yr));
        }
      }
      for (let x = 0; x < W; x++) reserveRect(x, Y(SU(x) + 4), 1, 8);
      for (let k = 0; k < 18; k++) {
        const x = 4 + rand() * 172;
        rockPx(x * S, (L - SU(x) + (rand() - 0.5) * 3) * S, 1.6 + rand() * 1.6, C.rock, k);
      }
      kit.spot([[20, Math.round(SU(30)) + 2, 40, 2], [130, Math.round(SU(150)) + 2, 40, 2]], bubbleFrames(C.milk), { rate: 1, fps: 8, tint: 1 });
    }
    // the feeding ground: an open clearing full of macaques, a keeper scattering wheat, a low rail for visitors
    {
      const cx = 60;
      const cu = 5760;
      for (let y = Y(cu) - 40; y < Y(cu) + 40; y++)
        for (let x = 4; x < 120; x++) {
          const e = ((x - cx) / 56) ** 2 + ((y - Y(cu)) / 38) ** 2 + (fbm(x, y, { seed: 151, scale: 8 }) - 0.5) * 0.4;
          if (e < 1 && !isRes(x, y)) {
            img.fine(x, y, 1, 1, (X, Yr) => {
              const t = hashPx(X, Yr, 152);
              const c = rampColor([0x8a7458, 0x9a8468, 0xa89476, 0xb4a282], 0.25 + fbm(x, y, { seed: 152, scale: 3 }) * 0.6, X, Yr);
              return e > 0.86 && hashPx(X >> 1, Yr >> 1, 153) < (e - 0.86) * 7 ? 0x2e4e2a : t < 0.012 ? 0xd8b868 : t > 0.96 ? scaleColor(c, 0.8) : c;
            });
            reserved[y * W + x] = 1;
          }
        }
      const pr = rng(6692);
      /** A macaque: sitting (with the red face up) or on all fours, in fine pixels. */
      const macaquePx = (X, Yy, big, target = img) => {
        const f = big ? 0x5e4c3c : 0x6e5a48;
        const f2 = big ? 0x3e3026 : 0x4a3a2e;
        for (let j = 0; j < 3; j++) for (let i = 0; i < 9; i++) target.px(X - 2 + i, Yy + 4 + j, 0x1e1a16, 0.32);
        target.discPx(X + 2.2, Yy + 2, 3.2, f2);
        target.discPx(X + 1.8, Yy + 1.6, 2.5, f);
        target.discPx(X + 1, Yy + 0.8, 1.2, scaleColor(f, 1.25));
        target.discPx(X + 2, Yy - 2.2, 2.4, f);
        target.rectPx(X + 1, Yy - 3, 3, 2, 0xe88a7a);
        target.px(X + 1, Yy - 3, 0x2a1a14);
        target.px(X + 3, Yy - 3, 0x2a1a14);
        for (let i = 0; i < 3; i++) target.px(X + 5 + i, Yy + 4 + (i >> 1), f2);
      };
      // (in knots round the grain, grooming, the odd one by itself)
      const knots = [];
      for (let k = 0; k < 9; k++) knots.push([cx + (pr() - 0.5) * 84, Y(cu) + (pr() - 0.5) * 50]);
      for (let k = 0; k < 110; k++) {
        const kn = knots[k % knots.length];
        const near = k % 5 === 0;
        const x = Math.round(near ? cx + (pr() - 0.5) * 100 : kn[0] + (pr() + pr() - 1) * 16);
        const y = Math.round(near ? Y(cu) + (pr() - 0.5) * 66 : kn[1] + (pr() + pr() - 1) * 11);
        if (((x - cx) / 54) ** 2 + ((y - Y(cu)) / 36) ** 2 > 0.9) continue;
        const big = pr() < 0.2;
        objects.push({ y: y + 2, draw: () => macaquePx(x * S, y * S, big) });
        if (pr() < 0.15) {
          // a mother with her baby on her back
          objects.push({ y: y + 2.1, draw: () => {
            img.discPx(x * S + 2, y * S + 2, 1.4, 0x8a7460);
            img.px(x * S + 2, y * S + 1, 0xe89a8a);
          } });
        }
      }
      // live: a troop scampering about the clearing, stopping to sit (walking: tail up)
      const monkey = (tail) =>
        capture(0, 0, 5, 5, () => {
          macaquePx(5, 6, false);
          img.px(10, tail ? 3 : 10, 0x6a4a32);
          img.px(9, tail ? 4 : 10, 0x6a4a32);
          img.px(9, tail ? 5 : 11, 0x6a4a32);
        }, cu);
      kit.wander(cx, cu, 46, 28, [monkey(false), monkey(true)], { n: 16, sp: 11, idle: 0.9, turn: 'flip', fps: 6 });
      // the keeper, a basket, grain thrown in an arc
      folk(cx, Y(cu) - 2, { coat: 0x3a6a4a, hat: true, extra: (X, Yy) => {
        img.rectPx(X + 5, Yy + 1, 4, 4, 0xb8945a);
        for (let k = 0; k < 18; k++) {
          const a = pr() * Math.PI;
          img.px(X + Math.round(Math.cos(a) * (6 + pr() * 14)), Yy + 4 + Math.round(Math.sin(a) * (4 + pr() * 9)), 0xe8d080);
        }
      } });
      // grain scattered about the knots
      for (const [kx, ky] of knots) for (let k = 0; k < 26; k++) img.px(Math.round((kx + (pr() + pr() - 1) * 10) * S), Math.round((ky + (pr() + pr() - 1) * 7) * S), 0xe8d890);
      // the wardens' shed at the wood's edge
      for (const [x, u] of [[6, 5806], [96, 5806], [8, 5716]])
        if (!anyRes(x, Y(u), 22, 16)) {
          house(x, Y(u), 20, 9, 4, { ramp: ROOF.green, hip: false, wood: true });
          break;
        }
      // a rail along the near side, visitors at it, and the walk to it from the stairs
      walk(112, Math.round(stairX(5722)), 5720, 5725);
      for (let X = 72 * S; X < 112 * S; X++) {
        img.px(X, Y(5728) * S, 0xa8a8a0);
        img.px(X, Y(5728) * S + 1, 0x4a4a42);
        if (X % 12 === 0) for (let j = 2; j < 6; j++) img.px(X, Y(5728) * S + j, 0x4a4a42);
      }
      crowd(74, Y(5724) - 2, 36, 3, 12, true);
    }
    // the temple hall among the cedars: its approach of stone flags, a bell tower, a pair of lanterns, an old monk sweeping
    house(16, Y(6080), 54, 18, 7, { ramp: ROOF.dark, hip: true, wood: true, noren: 0x7a1a1a });
    walk(43, Math.round(stairX(6052)), 6049, 6054); // from the stairway to its door
    walk(Math.round(stairX(6278)), 160, 6276, 6281); // to the ropeway's top station
    walk(5, 12, ONIYAMA[1] - 2, TAKASAKI[0] + 24); // from its bottom station down to the crocodile park
    stoneLantern(34, Y(6052));
    stoneLantern(50, Y(6052));
    folk(40, Y(6050), { coat: 0x2a2a30 });
    {
      // the bell tower
      const x = 78;
      const y = Y(6082);
      house(x, y, 16, 10, 8, { ramp: ROOF.dark, hip: true, wood: true });
      reserveRect(x - 1, y - 1, 18, 20);
    }
    // ferns and bamboo grass on the floor of the wood
    {
      const fr = rng(6694);
      for (let k = 0; k < 1100; k++) {
        const x = fr() * W;
        const y = Y(TAKASAKI[0] + fr() * (TAKASAKI[1] - TAKASAKI[0]));
        if (isRes(x, y)) continue;
        const X = Math.round(x * S);
        const Yy = Math.round(y * S);
        const c = fr() < 0.5 ? 0x3e6a34 : 0x2e5a2e;
        for (let n = 0; n < 5; n++) {
          const a = fr() * Math.PI * 2;
          for (let t = 1; t < 4 + fr() * 2; t++) img.px(X + Math.round(Math.cos(a) * t), Yy + Math.round(Math.sin(a) * t * 0.7), t > 3 ? scaleColor(c, 1.2) : c);
        }
      }
    }
    for (let k = 0; k < 1500; k++) {
      const x = rand() * W;
      const u = TAKASAKI[0] + rand() * (TAKASAKI[1] - TAKASAKI[0]);
      if (!anyRes(x - 3, Y(u) - 3, 6, 6)) tree(rand.pick(['broadleaf', 'broadleaf', 'broadleaf', 'cedar', 'cedar', 'cedar', 'bamboo', 'tiny', 'tiny', 'sakura']), x, Y(u), 4 + rand() * 4);
    }
    {
      // monkeys in the trees and on the stairs (they go over everything: drawn with the crowns already down)
      const mr = rng(6693);
      for (let k = 0; k < 60; k++) {
        const x = Math.round(mr() * W);
        const y = Y(TAKASAKI[0] + mr() * 850);
        objects.push({
          y: y + 12,
          draw: () => {
            const X = x * S;
            const Yy = y * S;
            img.discPx(X + 2, Yy + 2, 3, 0x5e4c3c);
            img.discPx(X + 1.4, Yy + 1.4, 1.8, 0x7e6a56);
            img.discPx(X + 2, Yy - 2, 2.2, 0x6e5a48);
            img.rectPx(X + 1, Yy - 2, 3, 2, 0xd87a6a);
            for (let j = 0; j < 4; j++) img.px(X + 5, Yy + 3 + j, 0x4a3a2e);
          },
        });
      }
    }
  }

  // ------------------------------------------------------------ G. Tatsumaki: the geyser pit behind stone walls
  {
    const [t0, t1] = TATSUMAKI;
    img.fine(10, Y(t1 - 20), 160, t1 - t0 - 40, (X, Yr, x, y) => {
      if (isRes(x, y) && padFree(x, y)) return null;
      const u = L - y;
      const n = fbm(x, u, { seed: 121, scale: 4, octaves: 2 });
      let c = rampColor(C.rock.map((v) => scaleColor(v, 0.85)), 0.2 + n * 0.6, X, Yr);
      const g = hashPx(X, Yr, 122);
      // veins of hot water running from the vents, crusted with salts
      const st = fbm(x, u, { seed: 123, scale: 20, octaves: 2 });
      if (st > 0.56) {
        const a = Math.min(0.42, (st - 0.56) * 2.4) * (0.8 + hashPx(X, Yr, 128) * 0.4);
        const [cr, cg, cb] = rgb(c);
        c = (Math.round(cr + (0xb0 - cr) * a) << 16) | (Math.round(cg + (0xa6 - cg) * a) << 8) | Math.round(cb + (0x90 - cb) * a);
      }
      if (g < 0.06) c = scaleColor(c, 0.82);
      else if (g > 0.975) c = 0xb8b09a;
      return c;
    });
    // the walls: dressed stones in courses, a capping lit on top, their shadow on the pit
    const hWall = (u) => {
      const YT = Y(u + 3) * S;
      for (let Yr = YT; Yr < YT + 3 * S; Yr++)
        for (let X = 8 * S; X < 172 * S; X++) {
          const j = Yr - YT;
          const XX = X + ((j >> 2) % 2) * 6;
          img.px(X, Yr, j < 2 ? C.stone[3] : j % 4 === 0 || XX % 12 === 0 ? 0x4a4640 : rampColor(C.stone, 0.4 + hashPx(XX >> 3, j >> 2, 124) * 0.4, X, Yr));
        }
      for (let X = 8 * S; X < 172 * S; X++) for (let j = 0; j < 4; j++) img.tintPx(X, YT + 3 * S + j, 0.6 + j * 0.08);
    };
    hWall(t0 + 19);
    hWall(t1 - 21);
    for (let Yr = Y(t1 - 18) * S; Yr < Y(t0 + 22) * S; Yr++) {
      for (let i = 0; i < 9; i++) {
        img.px(8 * S + i, Yr, i < 2 ? C.stone[3] : (Yr >> 3) % 2 === 0 && i === 5 ? 0x4a4640 : Yr % 8 === 0 ? 0x4a4640 : C.stone[2]);
        img.px(169 * S + i, Yr, i > 6 ? C.stone[0] : Yr % 8 === 0 ? 0x4a4640 : i < 2 ? C.stone[3] : C.stone[1]);
      }
      for (let j = 0; j < 4; j++) img.tintPx(11 * S + j, Yr, 0.6 + j * 0.08);
    }
    // steaming pools around the vents, the stone hood over the main geyser
    for (const [x, u, rx, ry] of [[90, 6380, 24, 9], [36, 6500, 16, 9], [146, 6480, 14, 8], [90, 6600, 30, 8]]) {
      hotPool(x, u, rx, ry, C.jade, 180 + u, C.rock);
      plume(x, Y(u), 1);
    }
    objects.push({
      y: Y(6340) - 8,
      shadow: () => {
        const X = 90 * S + 8;
        const Yy = Y(6340) * S - 58;
        for (let j = 0; j < 36; j++) for (let i = -46 + j * 0.5; i < 46 - j * 0.5; i++) img.tintPx(X + Math.round(i), Yy + j, 0.68);
      },
      draw: () => {
        const X = 90 * S;
        const Yy = Y(6340) * S;
        // a corbelled vault of big stones, stained by a hundred years of spray, over the mouth of the geyser
        const VY = Yy - 66;
        for (let j = 0; j < 30; j++) {
          const hw = 46 - j * 0.85;
          for (let i = -Math.round(hw); i < hw; i++) {
            const row = Math.floor(j / 6);
            const XX = i + 60 + (row % 2) * 7;
            const joint = j % 6 === 0 || XX % 14 === 0;
            const tone = hashPx(XX >> 3 >> 1, row, 125);
            let c = joint ? 0x4a4640 : rampColor(C.stone, 0.25 + tone * 0.4 + (1 - j / 30) * 0.25 - i * 0.003, X + i, VY + j);
            const st = hashPx((X + i) >> 1, (VY + j) >> 1, 126);
            if (!joint && st < 0.1) c = 0xd8ccb0;
            else if (!joint && st > 0.93) c = scaleColor(c, 0.8);
            if (Math.abs(i) >= hw - 1.5) c = i < 0 ? C.stone[3] : 0x4a4640;
            img.px(X + i, VY + j, c);
          }
        }
        // its two stone piers, down to the rim of the vent
        for (const [ox, sh] of [[-34, 1], [27, 0]])
          for (let j = 0; j < 24; j++)
            for (let i = 0; i < 8; i++) {
              const joint = j % 6 === 0 || i === 0 || i === 7;
              img.px(X + ox + i, VY + 30 + j, joint ? 0x3a3630 : rampColor(C.stone, sh ? 0.55 : 0.3, X + ox + i, VY + 30 + j));
            }
      },
    });
    // spectator benches below the pit, everyone waiting for the next eruption, the board with its time
    for (let r = 0; r < 3; r++) {
      const YT = Y(t0 + 6 - r * 5) * S;
      for (let j = 0; j < 8; j++)
        for (let X = 14 * S; X < 166 * S; X++) {
          const c = j < 2 ? 0xa0805a : j === 7 ? 0x2a2018 : (X >> 3) % 3 === 0 ? C.wood[1] : C.wood[2];
          img.px(X, YT + j, X % 60 === 0 ? 0x2a2a30 : c);
        }
    }
    crowd(14, Y(t0 + 12), 152, 12, 130, true);
    {
      // the rope along the wall, a tea stall at the end of the benches
      for (let X = 14 * S; X < 166 * S; X++) {
        const k = X % 27;
        img.px(X, Y(t0 + 15) * S + Math.round(Math.sin((k / 27) * Math.PI) * 2), 0xc8b878);
        if (k === 0) for (let j = -4; j < 3; j++) img.px(X, Y(t0 + 15) * S + j, 0x3a2a1c);
      }
      house(148, Y(t0 + 2), 22, 8, 4, { ramp: ROOF.brown, hip: false, wood: true, noren: 0x8a1a1a });
      crowd(146, Y(t0 + 2) + 13, 24, 2, 7, true);
    }
    {
      const X = 80 * S;
      const Yy = (Y(t0 + 22) + 6) * S;
      const sr = rng(6701);
      objects.push({
        y: Y(t0 + 22) + 14,
        draw: () => {
          for (let j = 0; j < 15; j++) for (let i = 0; i < 60; i++) img.px(X + i, Yy + j, i === 0 || j === 0 || i === 59 || j === 14 ? 0x2a1e18 : 0xf0e8d8);
          for (let k = 0; k < 8; k++) glyph(X + 3 + k * 7, Yy + 4, 6, k > 5 ? 0xc8302a : 0x2a1a14, sr);
          for (const i of [8, 50]) for (let j = 15; j < 22; j++) img.px(X + i, Yy + j, 0x3a2a1c);
        },
      });
    }
    runoffs(12, t0 + 24, 168, t1 - 22, 6607);
    fumaroles(16, t0 + 28, 164, t1 - 28, 14, 6608);
    for (let k = 0; k < 40; k++) {
      const x = 16 + rand() * 148;
      const y = Y(t0 + 28 + rand() * (t1 - t0 - 56));
      if (!anyRes(x - 3, y - 3, 6, 6)) rockPx(x * S, y * S, 2 + rand() * 5, C.rock, k);
    }
    // the walk round the pit's east wall, from the benches to the path up to Chinoike
    walk(160, W, t0 - 4, t0 + 1);
    walk(173, W, t0 - 4, t1);
    walk(100, W, t1 - 6, t1);
    for (let k = 0; k < 6; k++) {
      const x = 20 + rand() * 140;
      const u = t0 + 60 + rand() * 230;
      if (padFree(x, Y(u))) plume(x, Y(u), 0.8 + rand() * 0.6);
    }
  }

  // ------------------------------------------------------------ H. Chinoike: the blood-red pond
  {
    const [px, pu] = pond;
    hotPool(px, pu, 72, 44, C.blood, 131, C.clay.map((c) => scaleColor(c, 0.8)));
    // wooden walkways and the rail around the pond, visitors, a foot bath of red water, a shop
    const boards = (u) => {
      const YT = Y(u + 4) * S;
      for (let Yr = YT; Yr < YT + 4 * S; Yr++)
        for (let X = 6 * S; X < 174 * S; X++) {
          const j = Yr - YT;
          img.px(X, Yr, j < 2 ? 0x3a2a1c : X % 8 === 0 ? 0x4a3424 : hashPx(X >> 3, j >> 2, 132) < 0.5 ? C.wood[2] : C.wood[1]);
        }
      for (let X = 6 * S; X < 174 * S; X++) for (let j = 0; j < 3; j++) img.tintPx(X + 2, YT + 4 * S + j, 0.7);
      // its rail: posts and a top bar
      for (let X = 6 * S; X < 174 * S; X++) {
        img.px(X, YT - 3, 0x8e6a4a);
        img.px(X, YT - 2, 0x3a2a1c);
        if (X % 15 === 0) for (let j = -2; j < 1; j++) img.px(X, YT + j, 0x3a2a1c);
      }
    };
    boards(pu - 52);
    boards(pu + 52);
    crowd(10, Y(pu - 47), 160, 5, 50, true);
    crowd(10, Y(pu + 56), 160, 3, 20, true);
    {
      // the viewing deck out over the pond
      const X0 = 106 * S;
      const X1 = 122 * S;
      const YT = Y(pu - 26) * S;
      const YB = Y(pu - 48) * S;
      for (let Yr = YT + 3; Yr < YB + 3; Yr++) for (let X = X0 + 3; X < X1 + 4; X++) img.tintPx(X, Yr, 0.68);
      for (let Yr = YT; Yr < YB; Yr++)
        for (let X = X0; X < X1; X++) {
          const e = Math.min(X - X0, X1 - 1 - X, Yr - YT);
          img.px(X, Yr, e < 2 ? 0x3a2a1c : Yr % 6 === 0 ? 0x4a3424 : hashPx(X >> 3, Yr >> 2, 133) < 0.5 ? C.wood[2] : C.wood[1]);
        }
      for (let X = X0; X < X1; X++) {
        img.px(X, YT - 3, 0x8e6a4a);
        img.px(X, YT - 2, 0x3a2a1c);
        if (X % 9 === 0) for (let j = -2; j < 1; j++) img.px(X, YT + j, 0x3a2a1c);
      }
      for (let k = 0; k < 11; k++) folk(107 + (k * 37 % 13), Y(pu - 28 - (k * 17) % 18), { hat: k % 5 === 0 });
    }
    house(110, Y(TATSUMAKI[1] + 110), 50, 13, 6, { ramp: ROOF.brown, hip: true, wood: true, noren: 0x8a1a1a });
    house(12, Y(TATSUMAKI[1] + 190), 40, 12, 5, { ramp: ROOF.kawara, hip: true, noren: 0x2b3c78 });
    const pathX = (u) => dodge(90 + 18 * Math.sin(u / 50), u, 4);
    walk(Math.round(pathX(TATSUMAKI[1] + 87)), 136, TATSUMAKI[1] + 85, TATSUMAKI[1] + 90); // from the path to their doors
    walk(32, Math.round(pathX(TATSUMAKI[1] + 169)), TATSUMAKI[1] + 167, TATSUMAKI[1] + 172);
    // a gravel path up to the pond, a stream of red water running from it
    for (let Yr = Y(pu - 50) * S; Yr < Y(TATSUMAKI[1]) * S; Yr++) {
      const u = L - (Yr + 0.5) / S;
      const c = pathX(u);
      for (let X = Math.floor((c - 4.5) * S); X < (c + 4.5) * S; X++) {
        const a = Math.abs((X + 0.5) / S - c);
        const g = hashPx(X, Yr, 191);
        img.px(X, Yr, a > 3.7 ? C.gravel[0] : g < 0.1 ? scaleColor(C.gravel[0], 0.82) : g > 0.92 ? 0xd0c4ae : rampColor(C.gravel, hashPx(X >> 1, Yr >> 1, 192), X, Yr));
      }
      const sc = 140 + 10 * Math.sin(u / 23) + 60 * (1 - smooth(TATSUMAKI[1] + 10, TATSUMAKI[1] + 80, u)); // (away off the east edge)
      for (let X = Math.floor((sc - 2) * S); X < (sc + 2) * S; X++) {
        if (X < 0 || X >= W * S) continue;
        const a = Math.abs((X + 0.5) / S - sc);
        const r = Math.sin(u * 1.7 + a * 2);
        img.px(X, Yr, a > 1.5 ? 0x5a2a20 : r > 0.86 ? C.blood[3] : rampColor(C.blood, 0.4 + (1.5 - a) * 0.3, X, Yr));
      }
    }
    for (let u = TATSUMAKI[1]; u < pu - 50; u++) {
      reserveRect(pathX(u) - 5, Y(u), 10, 1);
      const sc = 140 + 10 * Math.sin(u / 23) + 60 * (1 - smooth(TATSUMAKI[1] + 10, TATSUMAKI[1] + 80, u));
      reserveRect(sc - 3, Y(u), 6, 1);
    }
    {
      const cr = rng(6712);
      for (let u = TATSUMAKI[1] + 8; u < pu - 54; u += 9) if (cr() < 0.35) folk(pathX(u) + (cr() - 0.5) * 6, Y(u));
    }
    // a foot bath off the path, fed from the stream; a stall of the pond's red clay ointment; an old iron chimney of steam
    rotenburo(24, Y(pu - 60), 34, 14, C.blood, 501);
    crowd(26, Y(pu - 60) + 15, 30, 1, 8, true, { yukata: true });
    walk(58, Math.round(pathX(pu - 66)), pu - 68, pu - 64);
    {
      const x = 122;
      const y = Y(pu - 78);
      if (!anyRes(x, y, 22, 20)) {
        house(x, y, 22, 9, 4, { ramp: ROOF.red, hip: false, wood: true, noren: 0x8a1a1a });
        crowd(x, y + 15, 22, 3, 6, true);
      }
    }
    {
      // the old shop and bath house with its iron chimney, a mark on its roof, red clay ointment by the door
      const x = 8;
      const y = Y(pu - 94);
      if (!anyRes(x, y, 46, 30)) {
        house(x, y, 46, 18, 6, { ramp: ROOF.dark, hip: true, wood: true, noren: 0x8a1a1a });
        roofSign(x + 20, y + 7, y + 24);
        walk(Math.round(x + 22), Math.round(pathX(pu - 122)), pu - 124, pu - 120);
        const CX = (x + 40) * S;
        const CY = (y + 8) * S;
        objects.push({
          y: y + 24.1,
          shadow: () => {
            for (let k = 0; k < 90; k++) for (let t = -3; t <= 3; t++) img.tintPx(CX + 2 + k, CY + 8 + Math.floor(k * 0.55) + t, 0.74);
          },
          draw: () => {
            for (let j = 0; j < 66; j++)
              for (let i = -6; i <= 6; i++) {
                let c = i < -3 ? 0x6a4a3a : i > 3 ? 0x2a1c16 : 0x4a3228;
                if (j % 18 < 2) c = 0x1e1410;
                img.px(CX + i, CY - j + 6, c);
              }
            img.discPx(CX, CY - 60, 6.4, 0x1a1210);
            img.discPx(CX, CY - 60, 4, 0x0a0806);
          },
        });
        kit.emit(x + 40, Math.round(U(y + 8)) + 20, [3, 4, 5, 6].map(puffFrames), { rate: 2.2, life: [3, 4], vy: 12, sx: 1, wf: 1, a: 0.74, d: 1.1, tint: 1 });
        crowd(x + 10, y + 25, 26, 3, 7, true);
      }
    }
    for (let k = 0; k < 8; k++) plume(px + (rand() - 0.5) * 110, Y(pu) + (rand() - 0.5) * 56, 1 + rand() * 0.8);
    fumaroles(6, TATSUMAKI[1] + 14, 176, pu - 60, 8, 6609);
    for (let k = 0; k < 40; k++) {
      const x = 4 + rand() * 172;
      const y = Y(TATSUMAKI[1] + 12 + rand() * (pu - TATSUMAKI[1] - 70));
      if (!anyRes(x - 3, y - 3, 6, 6)) rockPx(x * S, y * S, 2 + rand() * 4, C.clay.map((c) => scaleColor(c, 0.75)), k);
    }
    for (let k = 0; k < 110; k++) {
      const x = rand() * W;
      const u = TATSUMAKI[1] + 10 + rand() * (pu - TATSUMAKI[1] - 70);
      if (!anyRes(x - 4, Y(u) - 4, 8, 8)) tree(rand.pick(['pine', 'broadleaf', 'tiny']), x, Y(u), 3 + rand() * 3);
    }
    // round the end of the pond to the far boardwalk, and from it up to a small shrine in the pines above
    walk(2, 7, pu - 52, pu + 56);
    walk(171, 178, pu - 52, pu + 56);
    {
      const sx = 90;
      flags([[sx, pu + 56], [sx, pu + 74]], 3);
      torii(sx, Y(pu + 70), 12, 8);
      house(sx - 13, Y(pu + 104), 26, 13, 6, { ramp: ROOF.dark, hip: true, wall: 0xc8382a, noren: 0xf0e8d8 });
      stoneLantern(sx - 8, Y(pu + 78));
      stoneLantern(sx + 8, Y(pu + 78));
      crowd(sx - 6, Y(pu + 82), 12, 2, 4, true);
      for (let k = 0; k < 90; k++) {
        const x = rand() * W;
        const u = pu + 62 + rand() * (L - pu - 62);
        if (!anyRes(x - 4, Y(u) - 4, 8, 8) && Math.abs(x - sx) > 16) tree(rand.pick(['pine', 'pine', 'broadleaf', 'cedar']), x, Y(u), 3.5 + rand() * 3.5);
      }
    }
    // the path's lamps, lit by now, and walkers going up to the pond
    for (let u = TATSUMAKI[1] + 30; u < pu - 60; u += 60) lampPost(pathX(u) + 6, Y(u));
    const wr = rng(6711);
    for (const [c, s0] of [[0xe8e8f0, 0.1], [0xd04040, 0.4], [0x2b3c78, 0.7]]) {
      const pts = [];
      for (let u = TATSUMAKI[1] + 6; u <= pu - 54; u += 12) pts.push([Math.round(pathX(u)) + (wr() < 0.5 ? -2 : 1), u]);
      kit.path(pts, [stepper(c, 0, 6800), stepper(c, 1, 6800)], { sp: 3.5, mode: 'pp', hold: 3, turn: 'none', fps: 3, s0 });
    }
  }

  // ------------------------------------------------------------ compose
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

  // geyser vents: wet dark holes with a rim of mineral deposits in terraces
  for (const v of vents) {
    const y = Y(v.u);
    img.fine(v.x - 11, y - 11, 22, 22, (X, Yr, xx, yy) => {
      const d = Math.hypot(xx - v.x, yy - y) + (fbm(xx, yy, { seed: 161, scale: 2 }) - 0.5) * 2;
      if (d > 10) return null;
      const g = hashPx(X, Yr, 162);
      if (d < 3.2) return d < 2.2 ? 0x0e0c0a : 0x1e1a18;
      if (d < 6) {
        const c = v.mud ? C.mud[1] : 0x7a98a2;
        return Math.sin(d * 7) > 0.5 ? scaleColor(c, 1.14) : g < 0.2 ? scaleColor(c, 0.84) : c;
      }
      const c = Math.sin(d * 5.2) > 0.1 ? 0xe8dcc0 : 0xd0c098;
      return d > 9.2 ? scaleColor(c, 0.7) : g < 0.12 ? scaleColor(c, 0.88) : g > 0.92 ? 0xf8f0dc : c;
    });
    // a wisp of steam always rising from the hole
    kit.emit(v.x, Math.round(v.u), [2, 3, 4, 5].map(puffFrames), { rate: 2.4, life: [2, 2.8], vy: 10, sx: 1, wf: 0.4, a: 0.7, d: 1.1, tint: 1 });
  }
  // turret pads: stone steam stands, dressed stones in a ring round a worn iron plate
  for (const p of pads) {
    const y = Y(p.u);
    img.fine(p.x - 10, y - 10, 20, 20, (X, Yr, xx, yy) => {
      const dx = xx - p.x;
      const dy = yy - y;
      const d = Math.hypot(dx, dy);
      if (d > 9) return null;
      if (d > 8.4) return C.stone[0];
      if (d > 5.4) {
        const a = Math.floor(((Math.atan2(dy, dx) + Math.PI) / (Math.PI * 2)) * 14);
        const joint = Math.abs(((((Math.atan2(dy, dx) + Math.PI) / (Math.PI * 2)) * 14) % 1) - 0.5) > 0.44;
        if (joint) return C.stone[0];
        const t = 0.35 + hashPx(a, 3, p.x * 13 + y) * 0.5 - (dx + dy) * 0.02;
        return rampColor(C.stone, t, X, Yr);
      }
      if (d > 4.9) return 0x4e4a44;
      return rampColor(C.rock, 0.25 + hashPx(X >> 1, Yr >> 1, 2) * 0.4 - (dx + dy) * 0.03, X, Yr);
    });
  }

  // ------------------------------------------------------------ atmosphere, then lights on top
  {
    const tint = TOD.map(([, , t]) => rgb(t));
    const d = img.hi.data;
    const FW = W * S;
    for (let Yr = 0; Yr < L * S; Yr++) {
      const u = L - (Yr + 0.5) / S;
      let i = 0;
      while (i < TOD.length - 2 && u >= TOD[i + 1][0]) i++;
      const t = smooth(TOD[i][0], TOD[i + 1][0], u);
      const mul = TOD[i][1].map((m, k) => m + (TOD[i + 1][1][k] - m) * t);
      const tc = tint[i].map((c, k) => c + (tint[i + 1][k] - c) * t);
      const amt = TOD[i][3] + (TOD[i + 1][3] - TOD[i][3]) * t;
      for (let X = 0; X < FW; X++) {
        const p = (Yr * FW + X) * 4;
        if (!d[p + 3]) continue;
        for (let k = 0; k < 3; k++) {
          const v = d[p + k] * mul[k];
          d[p + k] = v + (tc[k] - v) * amt;
        }
      }
    }
  }
  /** Add a pool of light (after the grade): brightens the pixels around (x, y). */
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
  // the blood pond glows a little at dusk
  pool(pond[0], Y(pond[1]), 70, 0xff5030, 0.22);
  for (const p of pools) applyPool(img, p);
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
      const v = crownMask[k];
      if (v && D[k * 4 + 3] === 255) D[k * 4 + 3] = 239 + v;
    }
  }
  const chunks = [];
  for (let i = 0; i < CHUNKS; i++) chunks.push(img.crop(0, i * CHUNK, W, CHUNK));
  return { strip: img.hi, chunks, props: kit.pack(), meta: { width: W, artScale: S, chunkHeight: CHUNK, chunks: CHUNKS, length: L, sway: true, tint: tintTable(L, tod.white) } };
}
