// Middle layer (Beppu), seen from above in 3/4 view like the other cities: the bay and the black-sand
// beach of the sand baths, a seafront of tall hotels, the station and downtown (Beppu Tower, the covered
// arcade, the old Takegawara bathhouse), then Kannawa: a dense hillside of tiled roofs with white plumes
// of hot-spring steam rising from between the houses everywhere. Then the Hells in their gardens (the
// cobalt Umi Jigoku with its red shrine and giant lily pads, the grey mud of Oniishibozu, Kamado's
// coloured pools and its oni cook, the milky Shiraike), the crocodile pens of Oniyama with the red oni
// statue, the monkey woods of Takasakiyama, the stone pit of the Tatsumaki geyser, and the blood-red
// pond of Chinoike where the boss rises. Misty morning turning into a red dusk.
//
// The steam is live: only a wet patch and a low haze are painted at each source, the plumes themselves
// are puffs the game keeps sending up (shaded like clouds, lit from the top left), swelling and bending
// with the breeze. The hot pools bubble (the grey mud in "monks' heads"), waves wash the black sand,
// boats cross the bay, trains pass the station, crocodiles swim in their pens and the macaques of
// Takasakiyama wander their clearing (see ../props.mjs). Vents and turret pads come from the wave file.
// Coordinates: u = distance from the bottom of the strip (stage start), y = L - u.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Raster, fbm, rng, bayer, scaleColor, rgb } from '../../lib/raster.mjs';
import { crownPixels, palmPixels, rampColor } from '../nature.mjs';
import { PropKit, Window, puff, todGrade, tintTable } from '../props.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export const W = 180;
export const CHUNK = 512;
export const CHUNKS = 14;
export const L = CHUNK * CHUNKS;

const BAY = [0, 1000];
const TOWN = [1000, 2100];
const KANNAWA = [2100, 3300];
const HELLS = [3300, 4700];
const ONIYAMA = [4700, 5450];
const TAKASAKI = [5450, 6300];
const TATSUMAKI = [6300, 6650];

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

export function buildMid() {
  const stage = JSON.parse(readFileSync(join(root, 'src', 'data', 'stage6.json'), 'utf8'));
  const { mid: V, anchor } = stage.scroll;
  let img = new Raster(W, L);
  const rand = rng(6606);
  const Y = (u) => Math.round(L - u);
  const U = (y) => L - y;
  const reserved = new Uint8Array(W * L);
  const padMask = new Uint8Array(W * L); // turret pads and geyser vents: nothing may cover them
  const isRes = (x, y) => x >= 0 && x < W && y >= 0 && y < L && reserved[Math.floor(y) * W + Math.floor(x)];
  const anyRes = (x0, y0, w, h) => {
    for (let y = Math.floor(y0); y < y0 + h; y++) for (let x = Math.max(0, Math.floor(x0)); x < Math.min(W, x0 + w); x++) if (isRes(x, y)) return true;
    return false;
  };
  const reserveRect = (x0, y0, w, h) => {
    for (let y = Math.max(0, Math.floor(y0)); y < Math.min(L, y0 + h); y++)
      for (let x = Math.max(0, Math.floor(x0)); x < Math.min(W, x0 + w); x++) reserved[y * W + x] = 1;
  };
  const objects = [];
  const lights = [];
  const kit = new PropKit(6616); // the moving parts
  const tod = todGrade(TOD, smooth);
  /** Draw with the stage's own helpers into a small frame at (x0, y0) (strip pixels), graded for its place. */
  const capture = (x0, y0, w, h, draw, u = U(y0 + h / 2)) => {
    const keep = img;
    img = new Window(x0, y0, w, h);
    draw();
    const out = img;
    img = keep;
    return kit.frame(tod.frame(out, u));
  };
  const glow = (x, y, c, a = 1) => lights.push([Math.round(x), Math.round(y), c, a]);
  const shadowRect = (x, y, w, h, f = 0.6) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) img.tint(x + i, y + j, f);
  };
  const fill = (x0, y0, w, h, ramp, seed, scale = 5) => {
    for (let y = Math.floor(y0); y < y0 + h; y++) for (let x = Math.floor(x0); x < x0 + w; x++) img.set(x, y, rampColor(ramp, 0.2 + fbm(x, y, { seed, scale, octaves: 2 }) * 0.65, x, y));
  };
  // dusk: more and more windows lit towards the end of the stage
  const litChance = (u) => 0.05 + smooth(3000, L, u) * 0.4;

  const pads = stage.waves.filter((w) => w.type === 'turret').map((w) => ({ x: w.x, u: anchor + V * w.t + 10 }));
  const vents = stage.waves.filter((w) => w.type === 'geyser').map((w) => ({ x: w.x, u: anchor + V * w.t + 10, mud: w.kind === 'mud' }));
  const pond = stage.waves.find((w) => w.type === 'boss').pond;
  for (const p of [...pads, ...vents]) {
    reserveRect(p.x - 12, Y(p.u) - 12, 24, 24);
    for (let y = Y(p.u) - 12; y < Y(p.u) + 12; y++) for (let x = Math.max(0, p.x - 12); x < Math.min(W, p.x + 12); x++) padMask[y * W + x] = 1;
  }

  // ------------------------------------------------------------ 1. ground
  const shore = (x) => 210 + 18 * Math.sin(x / 30) + (fbm(x, 1, { seed: 61, scale: 14 }) - 0.5) * 14;
  const groundAt = (x, y, u) => {
    const n = fbm(x, y, { seed: 64, scale: 6, octaves: 2 });
    if (u < BAY[1]) return u < 330 + 8 * Math.sin(x / 17) ? rampColor(C.sand, 0.3 + fbm(x, y, { seed: 62, scale: 5 }) * 0.6, x, y) : rampColor(C.alley, 0.2 + n * 0.7, x, y);
    if (u < TOWN[1]) return rampColor(C.alley, 0.2 + n * 0.7, x, y);
    if (u < KANNAWA[1]) return rampColor(C.oldAlley, 0.2 + n * 0.7, x, y);
    if (u < HELLS[1]) return rampColor(C.lawn, 0.25 + fbm(x, y, { seed: 65, scale: 7, octaves: 3 }) * 0.6, x, y);
    if (u < ONIYAMA[1]) return rampColor(C.walk, 0.2 + n * 0.7, x, y);
    if (u < TAKASAKI[1]) return rampColor(C.forest, 0.2 + fbm(x, y, { seed: 66, scale: 5, octaves: 3 }) * 0.7, x, y);
    if (u < TATSUMAKI[1]) return rampColor(C.rock, 0.2 + fbm(x, y, { seed: 67, scale: 5, octaves: 3 }) * 0.6, x, y);
    return rampColor(C.clay, 0.2 + fbm(x, y, { seed: 68, scale: 6, octaves: 3 }) * 0.6, x, y);
  };
  for (let y = 0; y < L; y++) {
    const u = U(y);
    for (let x = 0; x < W; x++) {
      const d = u - shore(x);
      if (d < 0) {
        // bay water: foam at the edge, dithering out into the transparent far layer
        const s = 1 + d / 30;
        if (s <= 0 || (s < 0.4 && s < bayer(x, y) * 0.4)) continue;
        img.set(x, y, d > -1.5 ? 0xdce6e8 : d > -4 && (x + y) % 3 === 0 ? 0xb8d0d4 : rampColor(C.sea, s, x, y));
        continue;
      }
      img.set(x, y, d < 6 ? (fbm(x, y, { seed: 69, scale: 2 }) > 0.6 ? 0xc8d4d4 : C.sand[0]) : groundAt(x, y, u));
    }
  }

  // ------------------------------------------------------------ helpers
  const roadPx = (x, y, across, hw, line = true) => {
    const a = Math.abs(across);
    if (a > hw + 0.5) img.set(x, y, rampColor(C.walk, fbm(x, y, { seed: 33, scale: 3 }), x, y));
    else if (a > hw - 0.5) img.set(x, y, 0x8a8a8e); // kerb
    else img.set(x, y, line && a < 0.5 && Math.floor(y / 4) % 2 ? 0xd8d8d0 : rampColor(C.asphalt, fbm(x, y, { seed: 31, scale: 4 }), x, y));
  };
  /** A street running up the screen, optionally winding (amp, period). Returns its centre function. */
  const vRoad = (cx, hw, u0, u1, amp = 0, period = 80, phase = 0) => {
    const at = (u) => cx + amp * Math.sin(u / period + phase);
    for (let u = u0; u < u1; u++) {
      const c = at(u);
      for (let x = Math.floor(c - hw - 2); x <= c + hw + 1; x++) roadPx(x, Y(u), x + 0.5 - c, hw, hw >= 4);
      reserveRect(c - hw - 3, Y(u), hw * 2 + 6, 1);
    }
    return at;
  };
  const hRoad = (uc, hw, x0 = 0, x1 = W) => {
    for (let u = Math.floor(uc - hw - 2); u <= uc + hw + 1; u++) for (let x = x0; x < x1; x++) roadPx(x, Y(u), u + 0.5 - uc, hw, false);
    reserveRect(x0, Y(uc + hw + 3), x1 - x0, hw * 2 + 6);
  };
  /** A small car seen from above (vertical or horizontal). */
  const car = (x, y, vertical, color = rand.pick(CARS)) => {
    const w = vertical ? 4 : 7;
    const h = vertical ? 7 : 4;
    objects.push({
      y: y + h,
      shadow: () => shadowRect(x + 1, y + 1, w, h, 0.6),
      draw: () => {
        img.rect(x, y, w, h, color);
        img.rect(x + (vertical ? 0 : 2), y + (vertical ? 2 : 0), vertical ? w : 3, vertical ? 3 : h, scaleColor(color, 1.12));
        if (vertical) img.rect(x, y + 1, w, 1, 0x2a3440);
        else img.rect(x + 1, y, 1, h, 0x2a3440);
      },
    });
  };
  /** Japanese house in 3/4 view: hip or gable roof of tiles or metal, plaster or wooden front with windows. */
  const house = (x, y, w, roofH, faceH, opt = {}) => {
    const ramp = opt.ramp ?? rand.pick(opt.roofs ?? [ROOF.kawara, ROOF.kawara, ROOF.dark, ROOF.brown, ROOF.blue, ROOF.red]);
    const hip = opt.hip ?? rand() < 0.65;
    const wall = opt.wall ?? rand.pick(C.walls);
    const wood = opt.wood ?? rand() < 0.25;
    const ridge = y + Math.round(roofH * 0.42);
    const hi = hip ? Math.min(Math.round(roofH * 0.45), Math.floor(w / 3)) : 0;
    const lit = litChance(U(y));
    const wins = [];
    for (let xx = x + 2; xx < x + w - 3; xx += 4) wins.push([xx, rand() < lit]);
    objects.push({
      y: y + roofH + faceH,
      shadow: () => shadowRect(x + 3, y + 3, w, roofH + faceH, 0.55),
      draw: () => {
        for (let yy = y; yy < y + roofH; yy++) {
          const north = yy <= ridge;
          const t = north ? (ridge - yy) / Math.max(1, ridge - y) : (yy - ridge) / Math.max(1, y + roofH - 1 - ridge);
          const inset = hi * (1 - t);
          for (let xx = x; xx < x + w; xx++) {
            const lx = xx - x;
            const rx = x + w - 1 - xx;
            let c = lx < inset ? ramp[3] : rx < inset ? ramp[0] : north ? ramp[2] : ramp[1];
            if (lx < inset || rx < inset ? (yy - y) % 2 === 0 : (xx - x) % 2 === 0) c = scaleColor(c, 0.88);
            img.set(xx, yy, c);
          }
        }
        // gable roofs show their triangular ends as darker edges
        if (!hip) {
          img.rect(x, y, 1, roofH, ramp[0]);
          img.rect(x + w - 1, y, 1, roofH, ramp[0]);
        }
        for (let xx = x + hi; xx < x + w - hi; xx++) img.set(xx, ridge, scaleColor(ramp[3], 1.15));
        for (let xx = x; xx < x + w; xx++) img.set(xx, y + roofH - 1, ramp[0]);
        if (hip) {
          img.clear(x, y);
          img.clear(x + w - 1, y);
        }
        const fy = y + roofH;
        for (let yy = fy; yy < fy + faceH; yy++)
          for (let xx = x + 1; xx < x + w - 1; xx++) img.set(xx, yy, yy === fy ? 0x221c18 : wood ? ((xx - x) % 3 === 0 ? C.wood[0] : C.wood[1]) : (xx - x) % 6 === 0 ? scaleColor(wall, 0.85) : wall);
        if (faceH >= 3) for (const [xx, on] of wins) img.rect(xx, fy + Math.min(2, faceH - 2), 2, 1, on ? C.warm : 0x2e3440);
        if (opt.noren) {
          img.rect(x + Math.floor(w / 2) - 2, fy + 1, 4, 2, opt.noren);
          glow(x + Math.floor(w / 2) + 3, fy + 1, 0xff7a4a, 0.9);
        }
      },
    });
    reserveRect(x - 1, y - 1, w + 2, roofH + faceH + 2);
  };
  /** Concrete building: flat roof with a parapet and rooftop clutter, a front of windows; tall ones throw long shadows. */
  const block = (x, y, w, h, faceH, opt = {}) => {
    const roof = opt.roof ?? rand.pick(C.flat);
    const wall = opt.wall ?? rand.pick(C.walls);
    const off = 3 + Math.round(faceH * 0.45);
    const lit = litChance(U(y));
    const items = [];
    const n = Math.max(1, Math.floor((w * h) / 110));
    for (let k = 0; k < n; k++) items.push([rand.pick(opt.items ?? ['ac', 'ac', 'tank', 'hut', 'solar']), x + 2 + Math.floor(rand() * Math.max(1, w - 10)), y + 2 + Math.floor(rand() * Math.max(1, h - 7))]);
    const winLit = [];
    for (let k = 0; k < 64; k++) winLit.push(rand() < lit);
    objects.push({
      y: y + h + faceH,
      shadow: () => shadowRect(x + off, y + off, w, h + faceH, 0.5),
      draw: () => {
        for (let yy = y; yy < y + h; yy++)
          for (let xx = x; xx < x + w; xx++) {
            let c = roof;
            if (yy === y || xx === x) c = scaleColor(roof, 1.18);
            else if (xx === x + w - 1 || yy === y + h - 1) c = scaleColor(roof, 0.78);
            else if (yy === y + 1 || xx === x + 1) c = scaleColor(roof, 0.86);
            img.set(xx, yy, c);
          }
        for (const [kind, ix, iy] of items) {
          if (kind === 'ac') {
            img.rect(ix, iy, 3, 2, 0xb8bcc0);
            img.rect(ix, iy + 2, 3, 1, 0x5a5e64);
            img.set(ix + 1, iy, 0x6a6e74);
          } else if (kind === 'tank') {
            img.disc(ix + 2, iy + 2, 2, 0xc8ccd0);
            img.set(ix + 1, iy + 1, 0xf0f2f4);
            img.set(ix + 3, iy + 3, 0x7a7e84);
          } else if (kind === 'hut') {
            img.rect(ix, iy, 6, 3, scaleColor(roof, 0.92));
            img.rect(ix, iy + 3, 6, 2, scaleColor(wall, 0.9));
            img.set(ix + 2, iy + 4, 0x2a2a30);
          } else if (kind === 'solar') {
            img.rect(ix, iy, 8, 4, 0x2a3a6a);
            for (let k = 0; k < 8; k += 2) img.rect(ix + k, iy, 1, 4, 0x4a6aa0);
          } else if (kind === 'garden') {
            fill(ix, iy, 8, 5, C.grass, 71);
            img.set(ix + 2, iy + 2, 0x2a5a2a);
          } else if (kind === 'bath') {
            // rooftop open-air bath of a ryokan
            img.rect(ix, iy, 8, 5, C.stone[1]);
            img.rect(ix + 1, iy + 1, 6, 3, C.milk[2]);
            img.set(ix + 2, iy + 2, 0xffffff);
          }
        }
        const fy = y + h;
        let k = 0;
        for (let yy = fy; yy < fy + faceH; yy++) {
          const row = (yy - fy) % 3;
          for (let xx = x; xx < x + w; xx++) {
            let c = xx === x ? scaleColor(wall, 1.06) : xx === x + w - 1 ? scaleColor(wall, 0.82) : wall;
            if (yy === fy) c = scaleColor(wall, 0.62);
            else if (row === 2 && xx > x && xx < x + w - 1 && (xx - x) % 3 !== 0) c = winLit[k++ % 64] ? C.warm : C.glass[(xx >> 1) & 1];
            else if (row === 0 && opt.balcony && xx > x && xx < x + w - 1) c = scaleColor(wall, 0.88);
            img.set(xx, yy, c);
          }
        }
        if (opt.sign) {
          // a vertical sign on the corner, red with white letters
          img.rect(x + w - 4, fy + 2, 3, Math.min(faceH - 3, 14), opt.sign);
          for (let j = fy + 3; j < fy + Math.min(faceH - 2, 15); j += 2) img.set(x + w - 3, j, 0xf8f4ec);
        }
        if (opt.door !== false) {
          const dx = x + Math.floor(w / 2) - 2;
          img.rect(dx, fy + faceH - 3, 4, 3, 0x1e2228);
          if (rand() < 0.7) glow(dx + 1, fy + faceH - 2, C.warm, 0.8);
        }
      },
    });
    reserveRect(x - 1, y - 1, w + 2, h + faceH + 2);
  };
  const tree = (kind, x, y, r) => {
    const seed = Math.floor(rand() * 1e9);
    const cx = Math.round(x);
    const cy = Math.round(y);
    const px = () => (kind === 'palm' ? palmPixels(cx, cy, r, rng(seed)) : crownPixels(kind, cx, cy, r, rng(seed), seed & 1023));
    const off = Math.round(2 + r * 0.3);
    objects.push({
      y: cy + r * 0.6,
      shadow: () => {
        for (const p of px()) img.tint(p.x + off, p.y + off + 1, 0.55);
      },
      draw: () => {
        for (const p of px()) img.set(p.x, p.y, p.c);
      },
    });
  };
  /** A pocket garden between houses: grass, a tree or two, maybe a stone lantern. */
  const garden = (x, y, w, h) => {
    fill(x, y, w, h, C.grass, 72 + x, 4);
    tree(rand.pick(['broadleaf', 'pine', 'broadleaf', 'sakura']), x + w / 2, y + h / 2, Math.min(w, h) * 0.38 + 1);
    if (w > 14 && rand() < 0.5) {
      img.rect(x + 2, y + h - 4, 2, 3, C.stone[2]);
      img.set(x + 2, y + h - 4, C.stone[3]);
    }
    reserveRect(x, y, w, h);
  };
  const parking = (x, y, w, h) => {
    fill(x, y, w, h, C.asphalt, 73, 4);
    for (let xx = x + 1; xx < x + w - 4; xx += 6) {
      img.rect(xx, y + 1, 1, 8, 0xd0d0c8);
      if (rand() < 0.75) car(xx + 1, y + 2, true);
    }
    reserveRect(x, y, w, h);
  };
  /**
   * Shaded clumps of steam (a cloud lit from the top left with a cauliflower outline), drawn into the
   * strip or into a frame. Returns true for a pixel it painted.
   */
  const steamBall = (target, clumps, seed, base, a = 1) => {
    const hit = (xx, yy) => {
      let best = null;
      for (const c of clumps) {
        const dx = xx + 0.5 - c.x;
        const dy = yy + 0.5 - c.y;
        const d2 = (dx * dx + dy * dy) / (c.r * c.r);
        if (d2 > 1) continue;
        const h = Math.sqrt(1 - d2) * c.r + (c.y < base ? (base - c.y) * 0.05 : 0);
        if (!best || h > best.h) best = { h, d2, nx: dx / c.r, ny: dy / c.r, nz: Math.sqrt(1 - d2) };
      }
      return best;
    };
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
    for (let yy = Math.floor(y0); yy <= y1; yy++)
      for (let xx = Math.floor(x0); xx <= x1; xx++) {
        const best = hit(xx, yy);
        if (!best) continue;
        const nse = fbm(xx, yy, { seed: 140 + seed, scale: 3, octaves: 2 });
        const v = (best.nx * LIGHT[0] + best.ny * LIGHT[1] + best.nz * LIGHT[2]) * 0.6 + 0.55 + (nse - 0.5) * 0.3;
        const rim = best.d2 > 0.7 ? 1 - (best.d2 - 0.7) / 0.3 : 1;
        if (rim < 1 && rim < bayer(xx, yy)) continue;
        target.set(xx, yy, rampColor(C.steam, v, xx, yy), a);
      }
  };
  // live puffs, shared by every plume: three variants per radius, drawn ungraded (the game tints them)
  const puffs = new Map();
  const puffFrames = (r) => {
    if (!puffs.has(r)) puffs.set(r, [0, 1, 2].map((v) => kit.frame(puff(r, r * 31 + v * 7 + 1, C.steam))));
    return puffs.get(r);
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
        for (let yy = Math.floor(y - r0 - 2); yy <= y + r0 + 2; yy++)
          for (let xx = Math.floor(x - r0 - 3); xx <= x + r0 + 3; xx++) if (Math.hypot(xx + 0.5 - x, (yy + 0.5 - y) * 1.4) < r0 + 3) img.tint(xx, yy, 0.88);
        steamBall(img, haze, seed, y, 0.7);
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
    const ring = (out, c, r, col, every = 1) => {
      for (let a = 0, i = 0; a < Math.PI * 2; a += 0.35, i++) if (i % every === 0) out.set(Math.round(c + Math.cos(a) * r), Math.round(c + Math.sin(a) * r * 0.8), col);
    };
    if (ramp === C.mud) {
      // Oniishibozu: a grey dome swells like a shaven head, bursts, and its ring spreads out
      for (const r of [1.4, 2.4, 3.4, 4.2, 4.6]) {
        const out = new Raster(13, 13);
        for (let y = 0; y < 13; y++)
          for (let x = 0; x < 13; x++) {
            const dx = (x - 6) / r;
            const dy = (y - 6) / (r * 0.85);
            const d = dx * dx + dy * dy;
            if (d > 1) continue;
            out.set(x, y, dx + dy < -0.7 ? 0xd8d4cc : dx + dy < -0.1 ? ramp[3] : dx + dy < 0.8 ? ramp[2] : ramp[0]);
          }
        names.push(kit.frame(out));
      }
      for (const [r, every] of [[4.6, 1], [5.6, 2]]) {
        const out = new Raster(13, 13);
        ring(out, 6, r, ramp[3], every);
        if (every === 1) out.disc(6, 6, 1.5, ramp[0]);
        names.push(kit.frame(out));
      }
    } else {
      // a bubble breaking the surface and its ring spreading
      for (const [r, every, k] of [[0, 1, 3], [1.2, 1, 3], [2.2, 1, 3], [3, 2, 2]]) {
        const out = new Raster(7, 7);
        if (!r) out.set(3, 3, ramp[3]);
        else ring(out, 3, r, ramp[k], every);
        names.push(kit.frame(out));
      }
    }
    bubbleSets.set(key, names);
    return names;
  };
  /** A hot-spring pool: an irregular pond filled from a ramp, a rim of rocks. It bubbles (live). */
  const hotPool = (cx, cu, rx, ry, ramp, seed, rim = C.rock) => {
    const mud = ramp === C.mud;
    kit.spot([[Math.round(cx - rx * 0.6), Math.round(cu + ry * 0.55), Math.round(rx * 1.2), Math.round(ry * 1.1)]], bubbleFrames(ramp), {
      rate: (rx * ry) / (mud ? 110 : 130),
      fps: mud ? 5 : 8,
      tint: 1,
    });
    const cy = Y(cu);
    for (let y = Math.floor(cy - ry - 3); y <= cy + ry + 3; y++)
      for (let x = Math.floor(cx - rx - 3); x <= cx + rx + 3; x++) {
        if (x < 0 || x >= W || padMask[y * W + x]) continue;
        const e = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 + (fbm(x, y, { seed, scale: 9 }) - 0.5) * 0.35;
        if (e >= 1.25) continue;
        if (e > 1) img.set(x, y, rampColor(rim, 0.2 + fbm(x, y, { seed: seed + 2, scale: 2 }) * 0.8, x, y));
        else {
          let c = rampColor(ramp, 0.25 + (1 - e) * 0.45 + fbm(x, y, { seed: seed + 1, scale: 4 }) * 0.3, x, y);
          if (e > 0.85 && (x + y) % 2) c = scaleColor(c, 0.85); // shade under the rim
          img.set(x, y, c);
        }
      }
    for (let y = Math.floor(cy - ry - 3); y <= cy + ry + 3; y++) for (let x = Math.floor(cx - rx - 3); x <= cx + rx + 3; x++) if (x >= 0 && x < W) reserved[y * W + x] = reserved[y * W + x] || (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 < 1.3 ? 1 : 0);
  };
  const crowd = (x0, y0, w, h, n, any = false) => {
    for (let i = 0; i < n; i++) {
      const x = Math.round(x0 + rand() * w);
      const y = Math.round(y0 + rand() * h);
      if (!any && isRes(x, y)) continue;
      img.set(x + 1, y + 1, 0x1e1e26, 0.5);
      img.set(x, y, rand() < 0.5 ? rand.pick([0xd04040, 0x3a6ad0, 0xe8c040, 0xe8e8f0, 0x6a9a5a, 0xf0a0b0]) : 0x3a3a4a);
      img.set(x, y - 1, 0x2a2026);
    }
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
          else house(x, y, w, rh, fh, { roofs });
        }
        x += w + 1 + Math.floor(rand() * 2);
      }
      u += bh + 2 + Math.floor(rand() * 3);
    }
  };
  /** Steam plumes scattered over a band (avoiding the streets), `every` px of strip apart on average. */
  const plumes = (u0, u1, every, size) => {
    for (let u = u0; u < u1; u += every * (0.6 + rand() * 0.8)) {
      const x = 8 + rand() * 164;
      if (isRes(x, Y(u)) && rand() < 0.5) continue;
      plume(x, Y(u), size[0] + rand() * (size[1] - size[0]), { wind: 0.6 + rand() * 0.8 });
    }
  };

  // ------------------------------------------------------------ A. the bay, the sand baths, the seafront hotels
  {
    // live: the ferry from Osaka crossing the bay and two fishing boats, their wakes spreading behind;
    // seen from above, bow to the right (the game turns them along their course)
    const hull = (len, w, color, bow, cabin, extra) => {
      const out = new Raster(len, w);
      for (let j = 0; j < len; j++) {
        const t = len - 1 - j; // px from the bow
        const hw = Math.min(w, (w % 2 ? 3 : 2) + t * 2);
        for (let i = 0; i < hw; i++) out.set(j, Math.floor((w - hw) / 2) + i, i === hw - 1 ? scaleColor(color, 0.7) : t < 2 ? bow : color);
      }
      cabin(out);
      extra?.(out);
      return kit.frame(tod.frame(out, 120));
    };
    const ferry = hull(36, 13, 0xf2f0ea, 0x2a5aa8, (o) => {
      o.rect(9, 3, 17, 7, 0xd8dce4);
      o.rect(9, 3, 17, 1, 0xeef0f4);
      o.rect(9, 3, 1, 7, 0xe8a020);
      o.rect(23, 4, 1, 5, C.glass[0]);
      for (let k = 12; k < 22; k += 3) o.set(k, 9, C.glass[1]);
      o.disc(5, 6.5, 1.5, 0xe8a020);
    });
    const fishing = [
      hull(12, 6, 0xf0ece4, 0xc8c4bc, (o) => o.rect(4, 1, 4, 4, 0x3a6aa0)),
      hull(10, 6, 0x3a5a8a, 0x2a4a72, (o) => o.rect(3, 1, 4, 4, 0xf0ece4)),
    ];
    const wake = (spread) =>
      [0, 1, 2].map((k) => {
        const s = spread + k * 2;
        const out = new Raster(1, s * 2 + 1);
        out.set(0, 0, 0xeaf0f0);
        out.set(0, s * 2, 0xeaf0f0);
        if (k === 0) {
          out.set(0, 1, 0xc8d8dc);
          out.set(0, s * 2 - 1, 0xc8d8dc);
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
          y0 = Math.min(y0, Y(shore(x) - dk + 1));
          y1 = Math.max(y1, Y(shore(x) - dk - 2));
        }
        const out = new Window(0, y0, W, y1 - y0 + 1);
        for (let y = y0; y <= y1; y++)
          for (let x = 0; x < W; x++) {
            const d = U(y) - shore(x) + dk;
            if (d > 1 || d < -2) continue;
            const n = fbm(x, k * 40, { seed: 71 + k, scale: 6 });
            if (n < 0.32 + k * 0.05) continue;
            if (d > -0.5) out.set(x, y, 0xf2f6f6, k ? 0.9 : 1);
            else if (bayer(x, y) < 0.5) out.set(x, y, 0xc8dcdc, 0.7);
          }
        lines.push([kit.frame(tod.frame(out, 210)), U(y0)]);
      }
      kit.wave(
        lines.map((l) => l[0]),
        lines.map(([, u], k) => [k, 0, u, k * 1.1]),
        { w: 1.5, a0: 0, a1: 0.85, pw: 3 },
      );
    }
    // people buried in the warm black sand to the neck, towels on their heads, sunshades over them
    for (let k = 0; k < 18; k++) {
      const x = 10 + (k % 9) * 18 + (rand() - 0.5) * 4;
      const u = 262 + Math.floor(k / 9) * 30 + rand() * 6;
      const y = Y(u);
      if (anyRes(x - 6, y - 6, 12, 12)) continue;
      img.rect(x - 2, y - 1, 5, 9, C.sand[3]);
      img.rect(x - 2, y - 1, 5, 1, C.sand[0]);
      img.disc(x + 0.5, y - 2, 1.6, 0xe8c8a8);
      img.rect(x - 1, y - 4, 3, 1, 0xf4f0e6);
      const c = rand.pick([0xe04a3a, 0x3a7ad0, 0xf0b020, 0x3aa060]);
      objects.push({
        y: y - 4,
        draw: () => {
          for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) if (i * i + j * j <= 18) img.set(x + 4 + i, y - 6 + j, Math.floor(((Math.atan2(j, i) + Math.PI) / (Math.PI * 2)) * 6) % 2 ? c : 0xf6f2e6);
        },
      });
    }
    // sand bath attendants with shovels, the sand bath hall on the beach
    crowd(10, Y(320), 160, 10, 18);
    house(118, Y(352), 50, 15, 6, { ramp: ROOF.dark, hip: true, wood: true, noren: 0x2b3c78 });
    plume(124, Y(346), 1.1);
    plume(160, Y(348), 0.9);
    // the seafront promenade with palms, the coast road
    for (let x = 6; x < 176; x += 22) tree('palm', x + (rand() - 0.5) * 4, Y(368), 7);
    hRoad(392, 6);
    for (let k = 0; k < 6; k++) car(10 + k * 30 + Math.floor(rand() * 10), Y(392) + (k % 2 ? 1 : -6), false);
    // tall hotels along the bay with gardens and pools in between
    block(4, Y(560), 46, 18, 34, { roof: 0xc4beb2, wall: 0xece6da, balcony: true, sign: 0xc8302a, items: ['ac', 'tank', 'hut', 'bath'] });
    block(62, Y(600), 54, 20, 40, { roof: 0xaaa6a0, wall: 0xf2efe8, balcony: true, items: ['ac', 'hut', 'tank', 'garden'] });
    block(128, Y(552), 48, 16, 30, { roof: 0xb8b0a4, wall: 0xe0d6c4, sign: 0x2a6ac8, items: ['ac', 'ac', 'tank', 'bath'] });
    for (const [x, u] of [[10, 450], [130, 448]]) {
      img.rect(x, Y(u), 30, 12, C.stone[3]);
      img.rect(x + 2, Y(u) + 2, 26, 8, 0x4ab0d8);
      for (let k = 0; k < 4; k++) img.rect(x + 4 + k * 6, Y(u) + 4, 3, 1, 0x8ad8f0);
      reserveRect(x, Y(u), 30, 12);
    }
    for (let k = 0; k < 14; k++) {
      const x = 4 + rand() * 172;
      const u = 410 + rand() * 60;
      if (!anyRes(x - 4, Y(u) - 4, 8, 8)) tree(rand() < 0.5 ? 'palm' : 'broadleaf', x, Y(u), 5);
    }
    town(404, 612, { pBlock: 0.2, pGarden: 0.35, pPark: 0.25 });
    town(615, BAY[1] - 10, { pBlock: 0.25 });
    plumes(640, BAY[1], 70, [0.7, 1.3]);
  }

  // ------------------------------------------------------------ B. the station, downtown, Takegawara
  {
    // JR Nippō line along the coast with a train in the station
    const [r0, r1] = [1026, 1052];
    for (let u = r0; u < r1; u++) for (let x = 0; x < W; x++) img.set(x, Y(u), rampColor(C.ballast, fbm(x, u, { seed: 81, scale: 2 }), x, Y(u)));
    for (const tu of [1033, 1045]) {
      for (let x = 0; x < W; x += 3) img.rect(x, Y(tu + 2), 1, 5, C.wood[0]);
      img.rect(0, Y(tu + 2), W, 1, 0xa8a8b0);
      img.rect(0, Y(tu - 2), W, 1, 0xa8a8b0);
    }
    reserveRect(0, Y(r1), W, r1 - r0);
    // live: a white-and-blue local train through the station, a red limited express the other way
    const coach = (body, stripe, nose) => {
      const out = new Raster(39, 7);
      out.rect(0, 0, 39, 7, body);
      out.rect(0, 5, 39, 2, stripe);
      for (let k = 2; k < 37; k += 4) out.rect(k, 2, 2, 2, C.glass[1]);
      out.rect(1, 0, 37, 1, scaleColor(body, 0.88));
      if (nose) out.rect(nose > 0 ? 36 : 0, 1, 3, 4, C.glass[0]);
      return kit.frame(tod.frame(out, 1040));
    };
    const local = [coach(0xeef0f2, 0x2a5aa8, 1), coach(0xeef0f2, 0x2a5aa8), coach(0xeef0f2, 0x2a5aa8), coach(0xeef0f2, 0x2a5aa8, -1)];
    const express = [coach(0xc8302a, 0xf0ece4, -1), coach(0xc8302a, 0xf0ece4), coach(0xc8302a, 0xf0ece4), coach(0xc8302a, 0xf0ece4, 1)];
    kit.path([[-200, 1046], [400, 1046]], local, { sp: 38, n: 4, gap: 41, turn: 'none', cars: 1, s0: 0.55 });
    kit.path([[400, 1034], [-200, 1034]], express, { sp: 52, n: 4, gap: 41, turn: 'none', cars: 1, s0: 0.05 });
    // the station and its plaza, a bus or two
    block(56, Y(1092), 68, 16, 12, { roof: 0xb4aea4, wall: 0xe8e2d6, items: ['ac', 'ac', 'hut'] });
    fill(40, Y(1112), 100, 18, C.walk, 82, 3);
    reserveRect(40, Y(1112), 100, 18);
    car(52, Y(1108), false, 0xe8e8ec);
    car(60, Y(1108), false, 0xe8e8ec);
    img.rect(110, Y(1108), 14, 5, 0xe8d8a0); // a bus
    img.rect(110, Y(1108), 14, 1, 0xd0c08a);
    // Ekimae-dōri up from the station, cross streets
    vRoad(90, 6, 1112, TOWN[1]);
    for (const u of [1300, 1560, 1820, 2064]) hRoad(u, 4);
    for (let u = 1130; u < TOWN[1]; u += 28) {
      tree('broadleaf', 81, Y(u), 2.5);
      tree('broadleaf', 99, Y(u + 14), 2.5);
      if (rand() < 0.6) car(rand() < 0.5 ? 85 : 92, Y(u + 6), true);
    }
    // Beppu Tower: a steel lattice tower with its observation deck
    {
      const x = 156;
      const y = Y(1150);
      objects.push({
        y: y + 6,
        shadow: () => {
          for (let k = 0; k < 40; k++) img.tint(x + 6 + k, y + 4 + Math.floor(k * 0.55), 0.55);
        },
        draw: () => {
          img.rect(x, y, 14, 6, C.stone[1]);
          for (let j = 0; j < 46; j++) {
            const hw = 6 - j * 0.09;
            const cx = x + 7;
            const yy = y - j;
            img.set(Math.round(cx - hw), yy, 0x8a9098);
            img.set(Math.round(cx + hw), yy, 0x5a6068);
            if (j % 6 < 3) img.set(Math.round(cx - hw + ((j % 6) * hw) / 1.5), yy, 0x9aa0a8);
          }
          img.rect(x + 1, y - 52, 12, 7, 0xe8ecef);
          img.rect(x + 1, y - 47, 12, 2, C.glass[1]);
          img.rect(x + 1, y - 52, 12, 1, 0xffffff);
          img.rect(x + 7, y - 62, 1, 10, 0x7a7e84);
          img.set(x + 7, y - 62, 0xff4a3a);
          glow(x + 7, y - 62, 0xff4a3a);
        },
      });
      reserveRect(x - 2, y - 62, 18, 70);
    }
    // the covered shopping arcade (Yayoi Tengai)
    {
      const x = 114;
      for (let u = 1310; u < 1550; u++) {
        const y = Y(u);
        for (let xx = x; xx < x + 13; xx++) img.set(xx, y, xx === x || xx === x + 12 ? 0x6a6e74 : u % 8 === 0 ? 0x9aa0a6 : (xx - x) % 6 < 3 ? 0xd4dad6 : 0xc2cac8);
      }
      reserveRect(x - 1, Y(1550), 15, 240);
      for (let u = 1320; u < 1550; u += 40) glow(x + 6, Y(u), C.warm, 0.7);
    }
    // Takegawara Onsen: the dark-tiled wooden bathhouse of 1879 with its curved karahafu gable
    {
      const x = 8;
      const y = Y(1470);
      objects.push({
        y: y + 38,
        shadow: () => shadowRect(x + 4, y + 4, 44, 38, 0.5),
        draw: () => {
          const ramp = ROOF.dark;
          for (let yy = y; yy < y + 26; yy++) {
            const t = yy < y + 10 ? (y + 10 - yy) / 10 : (yy - y - 10) / 16;
            const inset = 12 * (1 - t);
            for (let xx = x; xx < x + 44; xx++) {
              const lx = xx - x;
              const rx = x + 43 - xx;
              let c = lx < inset ? ramp[3] : rx < inset ? ramp[0] : yy < y + 10 ? ramp[2] : ramp[1];
              if ((yy - y) % 2 === 0) c = scaleColor(c, 0.86);
              img.set(xx, yy, c);
            }
          }
          img.rect(x + 12, y + 10, 20, 1, 0x7a8090);
          // the karahafu over the entrance: a curved gable stepping out
          for (let xx = x + 10; xx < x + 34; xx++) {
            const k = Math.abs(xx - x - 22) / 12;
            const top = y + 18 + Math.round(k * k * 5);
            for (let yy = top; yy < y + 28; yy++) img.set(xx, yy, yy === top ? 0xb8b0a0 : (yy - top) % 2 ? ramp[1] : ramp[2]);
          }
          for (let yy = y + 28; yy < y + 38; yy++) for (let xx = x + 1; xx < x + 43; xx++) img.set(xx, yy, yy === y + 28 ? 0x1a1410 : (xx - x) % 4 === 0 ? C.wood[0] : C.wood[1]);
          img.rect(x + 18, y + 31, 8, 7, 0x1e1814);
          img.rect(x + 19, y + 31, 6, 2, 0x2b3c78);
          glow(x + 17, y + 31, C.warm);
          glow(x + 27, y + 31, C.warm);
        },
      });
      reserveRect(x - 2, y - 2, 48, 42);
      plume(x + 6, y + 2, 1.3);
      plume(x + 40, y + 4, 1);
    }
    // a few taller hotels and inns downtown
    for (const [x, u] of [[2, 1700], [138, 1990]]) if (!anyRes(x, Y(u), 40, 44)) block(x, Y(u), 40, 16, 26, { balcony: true, sign: rand.pick([0xc8302a, 0x2a6ac8]), items: ['ac', 'tank', 'bath'] });
    town(1060, 1300, { pBlock: 0.4, pPark: 0.06 });
    town(1306, 1560, { pBlock: 0.35, pPark: 0.04 });
    town(1566, 1820, { pBlock: 0.3 });
    town(1826, TOWN[1] - 30, { pBlock: 0.25, pGarden: 0.1 });
    plumes(TOWN[0] + 80, TOWN[1], 46, [0.8, 1.6]);
  }

  // ------------------------------------------------------------ C. Kannawa: a hillside of roofs and steam
  {
    // Ideyu-zaka: the old stone-paved lane winding up the slope, lanterns along it
    const lane = (cx, u0, u1, amp, period, phase) => {
      for (let u = u0; u < u1; u++) {
        const c = cx + amp * Math.sin(u / period + phase);
        for (let x = Math.floor(c - 6); x <= c + 5; x++) {
          const a = Math.abs(x + 0.5 - c);
          img.set(x, Y(u), a > 4.5 ? C.stone[0] : u % 7 === 0 ? C.stone[1] : rampColor(C.stone, 0.4 + fbm(x, u, { seed: 91, scale: 2 }) * 0.5, x, Y(u)));
        }
        reserveRect(c - 7, Y(u), 14, 1);
        if (u % 34 === 0) {
          glow(c - 5, Y(u), 0xff8a4a, 0.9);
          glow(c + 5, Y(u + 17), 0xff8a4a, 0.9);
        }
      }
    };
    lane(64, KANNAWA[0], KANNAWA[1], 12, 95, 0.6);
    for (const u of [2380, 2700, 3010]) hRoad(u, 3);
    // the steam kitchen (jigoku-mushi): food cooked in boxes over the vents, steam from each lid
    {
      const x = 104;
      const y = Y(2500);
      house(x, y, 46, 13, 5, { ramp: ROOF.kawara, wood: true, noren: 0x8a2a2a });
      fill(x, y + 20, 46, 14, C.stone, 92, 2);
      for (let k = 0; k < 4; k++) {
        const bx = x + 3 + k * 11;
        img.rect(bx, y + 23, 8, 6, C.stone[0]);
        img.rect(bx + 1, y + 23, 6, 2, C.wood[2]);
        plume(bx + 4, y + 24, 0.8, { front: true });
      }
      reserveRect(x, y + 20, 46, 14);
      crowd(x + 2, y + 31, 42, 3, 10, true);
    }
    // a foot bath under a little roof
    {
      const x = 122;
      const y = Y(2880);
      img.rect(x, y, 30, 12, C.wood[1]);
      img.rect(x + 2, y + 2, 26, 8, C.milk[1]);
      img.rect(x + 3, y + 3, 24, 1, C.milk[3]);
      crowd(x, y - 2, 30, 1, 10, true);
      crowd(x, y + 12, 30, 1, 10, true);
      reserveRect(x - 1, y - 3, 32, 17);
      plume(x + 15, y + 6, 0.9, { front: true });
    }
    // big old ryokan with tiled roofs and inner gardens
    for (const [x, u, w] of [[4, 2620, 40], [128, 3080, 46], [100, 2260, 52]]) {
      if (anyRes(x, Y(u), w, 36)) continue;
      house(x, Y(u), w, 20, 6, { ramp: rand.pick([ROOF.dark, ROOF.kawara]), hip: true, wall: 0xeee6d6, noren: 0x2b3c78 });
      garden(x + 4, Y(u) + 28, w - 8, 10);
    }
    // the Yukemuri viewpoint: a wooden deck on a green rise at the top of the town
    {
      const x = 118;
      const u = 3230;
      fill(x, Y(u + 50), 62, 56, C.grass, 93, 6);
      reserveRect(x, Y(u + 50), 62, 56);
      img.rect(x + 14, Y(u + 30), 34, 14, C.wood[2]);
      for (let k = 0; k < 34; k += 3) img.rect(x + 14 + k, Y(u + 30), 1, 14, C.wood[1]);
      img.rect(x + 14, Y(u + 17), 34, 1, C.wood[0]);
      crowd(x + 16, Y(u + 28), 30, 10, 14, true);
      for (let k = 0; k < 5; k++) tree('broadleaf', x + 6 + rand() * 50, Y(u + 44 - rand() * 8), 4 + rand() * 2);
    }
    town(KANNAWA[0] + 4, 2376, { roofH: [9, 13], maxW: 20, pBlock: 0.08, pGarden: 0.1, roofs: [ROOF.kawara, ROOF.kawara, ROOF.dark, ROOF.dark, ROOF.brown, ROOF.blue] });
    town(2386, 2696, { roofH: [9, 13], maxW: 20, pBlock: 0.08, pGarden: 0.1, roofs: [ROOF.kawara, ROOF.dark, ROOF.dark, ROOF.brown, ROOF.blue, ROOF.red] });
    town(2706, 3006, { roofH: [9, 12], maxW: 20, pBlock: 0.1, pGarden: 0.12, roofs: [ROOF.kawara, ROOF.dark, ROOF.brown, ROOF.blue] });
    town(3016, KANNAWA[1] - 6, { roofH: [9, 12], maxW: 18, pBlock: 0.06, pGarden: 0.18, roofs: [ROOF.kawara, ROOF.dark, ROOF.brown, ROOF.green] });
    // Kannawa's famous view: white plumes rising from between the roofs all over the slope
    plumes(KANNAWA[0], KANNAWA[1], 21, [1, 2.1]);
  }

  // ------------------------------------------------------------ D. the Hells in their gardens
  {
    // the path winding through the hells, visitors on it
    const path = (cx, u0, u1, amp, period, phase) => {
      const pts = [];
      for (let u = u0; u < u1; u++) {
        const c = cx + amp * Math.sin(u / period + phase);
        for (let x = Math.floor(c - 4); x <= c + 4; x++) img.set(x, Y(u), Math.abs(x + 0.5 - c) > 3.5 ? C.gravel[0] : rampColor(C.gravel, fbm(x, u, { seed: 101, scale: 2 }), x, Y(u)));
        reserveRect(c - 5, Y(u), 10, 1);
        if (u % 9 === 0) pts.push([c, Y(u)]);
      }
      for (const [x, y] of pts) if (rand() < 0.35) crowd(x - 3, y, 6, 2, 2, true);
    };
    path(156, HELLS[0], HELLS[1], 10, 120, 0.3);
    path(20, HELLS[0], 3560, 6, 60, 1.2);
    /** A hell's courtyard: raked gravel inside a low stone wall, a hedge outside, rocks and shrubs. */
    const yard = (x0, u0, x1, u1, seed) => {
      for (let u = u0; u < u1; u++)
        for (let x = x0; x < x1; x++) {
          const y = Y(u);
          if (isRes(x, y)) continue;
          const edge = Math.min(x - x0, x1 - 1 - x, u - u0, u1 - 1 - u);
          img.set(x, y, edge < 1 ? C.stone[3] : edge < 2 ? C.stone[0] : edge < 4 ? 0x2a4a2a : rampColor(C.gravel, 0.2 + fbm(x, u, { seed, scale: 4 }) * 0.5 + ((u >> 1) % 3 === 0 ? -0.15 : 0), x, y));
        }
      for (let k = 0; k < ((x1 - x0) * (u1 - u0)) / 500; k++) {
        const x = x0 + 6 + rand() * (x1 - x0 - 12);
        const y = Y(u0 + 6 + rand() * (u1 - u0 - 12));
        if (isRes(x, y)) continue;
        if (rand() < 0.5) {
          img.disc(x, y, 1.6 + rand(), C.rock[1]);
          img.set(Math.round(x - 0.5), Math.round(y - 0.5), C.rock[3]);
        } else tree(rand() < 0.5 ? 'tiny' : 'pine', x, y, 2.5 + rand() * 1.5);
      }
    };
    yard(30, 3330, 146, 3500, 171);
    yard(8, 3560, 146, 3830, 172);
    yard(8, 4040, 146, 4400, 173);
    yard(52, 4404, 146, 4490, 174);
    /** A hell's enclosure: a low wall, an entrance gate building with a tiled roof. */
    const gate = (x, u, w, name) => {
      house(x, Y(u), w, 11, 5, { ramp: ROOF.kawara, hip: true, wood: true, noren: name });
    };
    // Umi Jigoku: the cobalt "sea hell", a red shrine, giant lily pads, a greenhouse
    hotPool(76, 3420, 46, 30, C.cobalt, 81, C.rock);
    plume(70, Y(3410), 2.2);
    plume(98, Y(3428), 1.6);
    plume(50, Y(3432), 1.4);
    {
      const x = 128;
      const y = Y(3478);
      house(x, y, 22, 11, 6, { ramp: ROOF.dark, hip: true, wall: 0xc8382a });
      img.rect(x + 4, y + 22, 14, 2, 0xd03a2a); // torii in front
      img.rect(x + 5, y + 24, 2, 6, 0xd03a2a);
      img.rect(x + 15, y + 24, 2, 6, 0xd03a2a);
      img.rect(x + 3, y + 22, 16, 1, 0x2a2224);
      reserveRect(x + 2, y + 21, 18, 10);
    }
    hotPool(118, 3365, 24, 12, [0x2a5a3a, 0x3a6a46, 0x4a7a52, 0x5a8a5e], 82, C.rock);
    for (let k = 0; k < 9; k++) {
      // Victoria lily pads with their turned-up rims
      const x = 100 + (k % 5) * 8 + (rand() - 0.5) * 3;
      const y = Y(3365) + (k < 5 ? -4 : 4) + (rand() - 0.5) * 2;
      img.disc(x, y, 3.2, 0x5a9a3a);
      img.disc(x - 0.5, y - 0.5, 2.2, 0x6eb048);
      for (let a = 0; a < Math.PI * 2; a += 0.5) img.set(Math.round(x + Math.cos(a) * 3.2), Math.round(y + Math.sin(a) * 3.2), 0x9a3a3a);
      if (k % 4 === 0) img.disc(x + 2, y - 2, 1, 0xf8d0e0);
    }
    gate(8, 3330, 34, 0x2b3c78);
    // Oniishibozu: grey mud pools with bubbles like shaven monks' heads
    for (const [x, u, rx, ry] of [[66, 3610, 30, 17], [112, 3770, 28, 16], [40, 3770, 20, 13], [124, 3612, 16, 11], [76, 3700, 12, 8]]) {
      hotPool(x, u, rx, ry, C.mud, 90 + u, C.stone);
      for (let k = 0; k < rx / 2; k++) {
        const bx = x + (rand() - 0.5) * rx * 1.3;
        const by = Y(u) + (rand() - 0.5) * ry * 1.3;
        if (((bx - x) / rx) ** 2 + ((by - Y(u)) / ry) ** 2 > 0.6) continue;
        const r = 1.5 + rand() * 2.2;
        for (let a = 0; a < Math.PI * 2; a += 0.25) img.set(Math.round(bx + Math.cos(a) * r), Math.round(by + Math.sin(a) * r), a < Math.PI ? C.mud[3] : C.mud[0]);
        img.set(Math.round(bx - r * 0.4), Math.round(by - r * 0.4), 0xd8d4cc);
      }
      plume(x, Y(u), 1.2);
    }
    gate(70, 3700, 30, 0x5a5a5a);
    // Kamado Jigoku: pools in different colours and the red oni cook on his giant pot
    for (const [x, u, ramp] of [[36, 4090, C.milk], [80, 4130, C.blood], [126, 4100, C.cobalt], [108, 4320, C.mud], [48, 4340, C.jade], [86, 4260, C.milk], [28, 4210, C.cobalt]]) {
      hotPool(x, u, 17, 10, ramp, x + u);
      plume(x, Y(u), 1.1);
    }
    {
      const x = 118;
      const y = Y(4200);
      objects.push({
        y: y + 22,
        shadow: () => shadowRect(x + 4, y + 4, 26, 22, 0.5),
        draw: () => {
          // the iron pot on its stone hearth, the cook standing on the rim with a ladle
          img.rect(x + 1, y + 12, 24, 10, C.stone[0]);
          img.disc(x + 13, y + 12, 11, 0x2a2624);
          img.disc(x + 12, y + 11, 8, 0x3e3a38);
          img.disc(x + 11, y + 10, 4, 0x4e4a48);
          img.rect(x + 9, y - 6, 8, 12, 0xd8302a);
          img.rect(x + 9, y - 6, 2, 12, 0xe85a4a);
          img.disc(x + 13, y - 9, 4.5, 0xd8302a);
          img.disc(x + 12, y - 10, 2, 0xe85a4a);
          img.set(x + 10, y - 14, 0xf0c030);
          img.set(x + 16, y - 14, 0xf0c030);
          img.rect(x + 11, y - 9, 4, 1, 0x1a1a1e);
          img.rect(x + 9, y + 1, 8, 2, 0xf0c030);
          img.line(x + 18, y - 4, x + 22, y + 6, C.wood[2]);
        },
      });
      reserveRect(x - 2, y - 16, 30, 40);
      plume(x + 13, y + 8, 1.8, { front: true });
    }
    gate(30, 4470, 32, 0x8a2a2a);
    // Shiraike: the milky white pond in a Japanese garden, a little bridge, stone lanterns
    hotPool(96, 4440, 30, 16, C.milk, 95, C.rock);
    img.rect(90, Y(4440) - 1, 14, 3, 0xc83a2a);
    img.rect(90, Y(4440) - 1, 14, 1, 0xe85a4a);
    plume(110, Y(4446), 1.4);
    for (const [x, u] of [[62, 4420], [134, 4420], [130, 4462]]) {
      img.rect(x, Y(u), 3, 4, C.stone[2]);
      img.rect(x - 1, Y(u), 5, 1, C.stone[3]);
      glow(x + 1, Y(u) + 1, C.warm, 0.6);
    }
    // gift shops and trees between the hells
    for (let k = 0; k < 6; k++) {
      const x = 4 + rand() * 140;
      const u = HELLS[0] + 260 + rand() * 1200;
      const w = 22 + rand() * 12;
      if (!anyRes(x, Y(u), w, 22)) house(Math.round(x), Y(u), Math.round(w), 11, 5, { ramp: rand.pick([ROOF.kawara, ROOF.brown, ROOF.red]), noren: rand.pick([0x2b3c78, 0x8a2a2a]) });
    }
    // between the hells: rest houses, a coach park, an inn
    parking(4, Y(3900), 60, 14);
    parking(4, Y(3920), 60, 14);
    img.rect(70, Y(3906), 18, 6, 0xe8d8a0);
    img.rect(70, Y(3906), 18, 1, 0xf8f0d0);
    img.rect(92, Y(3906), 18, 6, 0x3a6aa0);
    img.rect(92, Y(3906), 18, 1, 0x6a9ad0);
    reserveRect(68, Y(3906), 44, 8);
    house(14, Y(3990), 46, 14, 6, { ramp: ROOF.kawara, hip: true, noren: 0x2b3c78 });
    house(76, Y(3984), 40, 13, 6, { ramp: ROOF.brown, hip: true, wood: true, noren: 0x8a2a2a });
    block(8, Y(4600), 52, 18, 14, { roof: 0xb8b0a4, wall: 0xeee6d6, balcony: true, items: ['ac', 'bath', 'garden'] });
    house(70, Y(4590), 44, 15, 6, { ramp: ROOF.dark, hip: true, wall: 0xeee6d6, noren: 0x2b3c78 });
    parking(12, Y(4650), 70, 14);
    for (const [y0, y1] of [[3330, 3500], [3560, 3830], [4040, 4400], [4404, 4490]]) reserveRect(0, Y(y1), 146, y1 - y0);
    for (let k = 0; k < 700; k++) {
      const x = rand() * W;
      const u = HELLS[0] + rand() * 1400;
      if (!anyRes(x - 3, Y(u) - 3, 6, 6)) tree(rand.pick(['pine', 'broadleaf', 'broadleaf', 'palm', 'sakura', 'tiny', 'pine']), x, Y(u), 3 + rand() * 3.5);
    }
    // flowerbeds of azaleas along the lawns
    for (let k = 0; k < 40; k++) {
      const x = rand() * W;
      const y = Y(HELLS[0] + rand() * 1400);
      if (anyRes(x - 3, y - 3, 6, 6)) continue;
      for (let j = 0; j < 8; j++) img.set(Math.round(x + (rand() - 0.5) * 6), Math.round(y + (rand() - 0.5) * 4), rand() < 0.6 ? rand.pick([0xe86a9a, 0xf0a0c0, 0xffffff]) : 0x2a5a2a);
    }
  }

  // ------------------------------------------------------------ E. Oniyama: the crocodile pens, the red oni statue
  {
    const croc = (cx, cy, a, len) => {
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      for (let j = 0; j < len; j++) {
        const t = j / len; // 0 = snout, 1 = tail
        const hw = t < 0.18 ? 0.6 + t * 8 : t < 0.6 ? 2.2 : Math.max(0.4, 2.2 - (t - 0.6) * 5);
        const px = cx + ca * (j - len / 2);
        const py = cy + sa * (j - len / 2);
        for (let k = -Math.ceil(hw); k <= Math.ceil(hw); k++) {
          if (Math.abs(k) > hw + 0.3) continue;
          const c = k < 0 ? 0x5a6a3a : k > 0 ? 0x2e3a22 : j % 3 ? 0x445432 : 0x3a4a2a;
          img.set(Math.round(px - sa * k), Math.round(py + ca * k), c);
        }
        if (t > 0.25 && t < 0.3) for (const s of [-1, 1]) img.set(Math.round(px - sa * s * 3.4), Math.round(py + ca * s * 3.4), 0x3a4a2a);
        if (t > 0.52 && t < 0.57) for (const s of [-1, 1]) img.set(Math.round(px - sa * s * 3.4), Math.round(py + ca * s * 3.4), 0x3a4a2a);
        if (t > 0.1 && t < 0.14) for (const s of [-1, 1]) img.set(Math.round(px - sa * s * 1.4), Math.round(py + ca * s * 1.4), 0xd8c040);
      }
    };
    // a crocodile swimming, snout to the right (the game turns it as it goes), only its back above water
    const swimmer = capture(0, Y(ONIYAMA[0] + 300) - 4, 19, 9, () => croc(9.5, Y(ONIYAMA[0] + 300) + 0.5, Math.PI, 17));
    // the red oni statue on his rock by the entrance, club raised (the boss, before he wakes)
    {
      const x = 152;
      const y = Y(ONIYAMA[0] + 24);
      objects.push({
        y: y + 12,
        shadow: () => {
          for (let k = 0; k < 18; k++) img.tint(x + 2 + k, y + 4 + Math.floor(k / 2), 0.5);
        },
        draw: () => {
          img.disc(x, y + 7, 8, C.rock[1]);
          img.disc(x - 1, y + 6, 6, C.rock[2]);
          img.rect(x - 4, y - 8, 8, 13, 0xd8302a);
          img.rect(x - 4, y - 8, 2, 13, 0xe85a4a);
          img.rect(x - 4, y + 1, 8, 2, 0xf0c030);
          img.disc(x, y - 11, 4, 0xd8302a);
          img.set(x - 2, y - 16, 0xf0e0b0);
          img.set(x + 2, y - 16, 0xf0e0b0);
          img.set(x - 1, y - 12, 0xf0c030);
          img.set(x + 1, y - 12, 0xf0c030);
          img.rect(x - 1, y - 9, 3, 1, 0xf8f4ec);
          img.rect(x + 5, y - 20, 2, 18, 0x1a1a1e);
          for (let j = 0; j < 9; j++) img.set(x + 4 + (j % 2) * 3, y - 19 + j * 2, 0xb0b0b8);
        },
      });
      reserveRect(x - 10, y - 22, 22, 32);
    }
    house(96, Y(ONIYAMA[0] + 40), 40, 12, 6, { ramp: ROOF.red, hip: true, wall: 0xe8e0d0, noren: 0x8a2a2a });
    for (let u = ONIYAMA[0] + 30; u < ONIYAMA[1] - 60; u += 72)
      for (const x0 of [24, 98]) {
        const y = Y(u + 58);
        if (anyRes(x0, y, 60, 58)) continue;
        // a concrete pen: a warm green pool with a ledge where the crocodiles bask, a rail around
        img.rect(x0, y, 60, 58, C.stone[0]);
        img.rect(x0 + 2, y + 2, 56, 54, C.stone[2]);
        for (let yy = y + 12; yy < y + 50; yy++) for (let xx = x0 + 5; xx < x0 + 55; xx++) img.set(xx, yy, rampColor([0x2e4e42, 0x3e5e4e, 0x4e6e58, 0x6a8a6e], fbm(xx, yy, { seed: 111, scale: 5 }), xx, yy));
        img.rect(x0 + 5, y + 12, 50, 1, 0x22382e);
        for (let xx = x0; xx < x0 + 60; xx += 2) {
          img.set(xx, y, 0xc8c8c8);
          img.set(xx, y + 57, 0xc8c8c8);
        }
        for (let k = 0; k < 2; k++) croc(x0 + 14 + k * 26 + rand() * 6, y + 6 + rand() * 2, (rand() - 0.5) * 0.3 + (k ? Math.PI : 0), 18);
        // two more swim about the pool (live): the random draws stay, so the rest of the stage looks the same
        for (let k = 0; k < 8; k++) rand();
        kit.wander(x0 + 30, U(y + 31), 18, 11, [swimmer], { n: 2, sp: 3, idle: 0.5, turn: 'rot' });
        reserveRect(x0 - 2, y - 2, 64, 62);
        plume(x0 + 16 + rand() * 28, y + 34, 1.1);
        crowd(x0, y + 59, 60, 2, 10);
      }
    for (let k = 0; k < 160; k++) {
      const x = rand() * W;
      const u = ONIYAMA[0] + rand() * 750;
      if (!anyRes(x - 3, Y(u) - 3, 6, 6)) tree(rand.pick(['palm', 'broadleaf', 'tiny', 'palm']), x, Y(u), 3 + rand() * 3);
    }
  }

  // ------------------------------------------------------------ F. Takasakiyama: woods full of monkeys, a temple
  {
    // a stone stairway up the mountain
    for (let u = TAKASAKI[0]; u < TAKASAKI[1]; u++) {
      const c = 120 + 14 * Math.sin(u / 70);
      for (let x = Math.floor(c - 4); x <= c + 4; x++) img.set(x, Y(u), Math.abs(x + 0.5 - c) > 3.5 ? C.stone[0] : u % 4 === 0 ? C.stone[1] : C.stone[2]);
      reserveRect(c - 5, Y(u), 10, 1);
    }
    // the feeding ground: an open clearing full of macaques
    {
      const cx = 60;
      const cu = 5760;
      for (let y = Y(cu) - 40; y < Y(cu) + 40; y++)
        for (let x = 4; x < 120; x++) {
          const e = ((x - cx) / 56) ** 2 + ((y - Y(cu)) / 38) ** 2 + (fbm(x, y, { seed: 151, scale: 8 }) - 0.5) * 0.4;
          if (e < 1 && !isRes(x, y)) {
            img.set(x, y, rampColor(C.clay.map((c) => scaleColor(c, 0.9)), 0.3 + fbm(x, y, { seed: 152, scale: 3 }) * 0.5, x, y));
            reserved[y * W + x] = 1;
          }
        }
      for (let k = 0; k < 70; k++) {
        const x = Math.round(cx + (rand() - 0.5) * 100);
        const y = Math.round(Y(cu) + (rand() - 0.5) * 66);
        if (((x - cx) / 54) ** 2 + ((y - Y(cu)) / 36) ** 2 > 0.9) continue;
        img.set(x + 1, y + 2, 0x1e1a16, 0.5);
        img.rect(x, y, 2, 2, 0x8a6a4a);
        img.set(x, y + 2, 0x6a4a32);
        img.set(x, y, 0xe89a8a);
      }
      // live: a troop scampering about the clearing, stopping to sit (walking: tail up)
      const monkey = (tail) => {
        const out = new Raster(4, 4);
        out.set(1, 3, 0x1e1a16, 0.5);
        out.rect(0, 1, 3, 2, 0x8a6a4a);
        out.set(0, 2, 0x6a4a32);
        out.set(2, 1, 0xe89a8a);
        out.set(2, 0, 0x7a5a3e);
        out.set(0, tail ? 0 : 3, 0x6a4a32);
        return kit.frame(tod.frame(out, cu));
      };
      kit.wander(cx, cu, 46, 28, [monkey(false), monkey(true)], { n: 12, sp: 11, idle: 0.9, turn: 'flip', fps: 6 });
    }
    // the temple hall among the cedars
    house(16, Y(6080), 54, 18, 7, { ramp: ROOF.dark, hip: true, wood: true, noren: 0x7a1a1a });
    for (let k = 0; k < 700; k++) {
      const x = rand() * W;
      const u = TAKASAKI[0] + rand() * (TAKASAKI[1] - TAKASAKI[0]);
      if (!anyRes(x - 3, Y(u) - 3, 6, 6)) tree(rand.pick(['broadleaf', 'broadleaf', 'cedar', 'cedar', 'bamboo', 'sakura', 'tiny']), x, Y(u), 4 + rand() * 4);
    }
    for (let k = 0; k < 50; k++) {
      // monkeys in the trees and on the stairs
      const x = Math.round(rand() * W);
      const y = Y(TAKASAKI[0] + rand() * 850);
      img.rect(x, y, 2, 2, 0x8a6a4a);
      img.set(x, y, 0xe89a8a);
    }
  }

  // ------------------------------------------------------------ G. Tatsumaki: the geyser pit behind stone walls
  {
    const [t0, t1] = TATSUMAKI;
    for (let u = t0 + 20; u < t1 - 20; u++)
      for (let x = 10; x < 170; x++) if (!isRes(x, Y(u))) img.set(x, Y(u), rampColor(C.rock.map((c) => scaleColor(c, 0.85)), 0.2 + fbm(x, u, { seed: 121, scale: 4, octaves: 2 }) * 0.6, x, Y(u)));
    for (let x = 8; x < 172; x++) {
      img.rect(x, Y(t0 + 22), 1, 3, x % 5 ? C.stone[3] : C.stone[1]);
      img.rect(x, Y(t1 - 18), 1, 3, x % 5 ? C.stone[3] : C.stone[1]);
    }
    for (let u = t0 + 22; u < t1 - 18; u++) {
      img.rect(8, Y(u), 3, 1, C.stone[3]);
      img.rect(169, Y(u), 3, 1, C.stone[2]);
    }
    // steaming pools around the vents, the stone hood over the main geyser
    for (const [x, u, rx, ry] of [[90, 6380, 24, 9], [36, 6500, 16, 9], [146, 6480, 14, 8], [90, 6600, 30, 8]]) {
      hotPool(x, u, rx, ry, C.jade, 180 + u, C.rock);
      plume(x, Y(u), 1);
    }
    objects.push({
      y: Y(6340) - 8,
      draw: () => {
        const x = 90;
        const y = Y(6340);
        for (let j = 0; j < 6; j++) img.rect(x - 14 + j, y - 22 + j, 28 - 2 * j, 1, C.rock[3 - Math.min(3, j >> 1)]);
        img.rect(x - 14, y - 16, 3, 6, C.rock[1]);
        img.rect(x + 11, y - 16, 3, 6, C.rock[0]);
      },
    });
    // spectator benches below the pit, everyone waiting for the next eruption
    for (let r = 0; r < 3; r++) img.rect(14, Y(t0 + 6 - r * 5), 152, 2, C.wood[r % 2 ? 1 : 2]);
    crowd(14, Y(t0 + 12), 152, 12, 70, true);
    for (let k = 0; k < 6; k++) plume(20 + rand() * 140, Y(t0 + 60 + rand() * 230), 0.8 + rand() * 0.6);
  }

  // ------------------------------------------------------------ H. Chinoike: the blood-red pond
  {
    const [px, pu] = pond;
    hotPool(px, pu, 72, 44, C.blood, 131, C.clay.map((c) => scaleColor(c, 0.8)));
    // wooden walkways and the rail around the pond, visitors, a shop
    for (let x = 6; x < 174; x++) {
      img.rect(x, Y(pu - 52), 1, 4, x % 4 ? C.wood[1] : C.wood[0]);
      img.rect(x, Y(pu + 52), 1, 4, x % 4 ? C.wood[1] : C.wood[0]);
    }
    crowd(10, Y(pu - 47), 160, 5, 50, true);
    house(110, Y(TATSUMAKI[1] + 110), 50, 13, 6, { ramp: ROOF.brown, hip: true, wood: true, noren: 0x8a1a1a });
    house(12, Y(TATSUMAKI[1] + 190), 40, 12, 5, { ramp: ROOF.kawara, hip: true, noren: 0x2b3c78 });
    // a gravel path up to the pond, a stream of red water running from it
    for (let u = TATSUMAKI[1]; u < pu - 50; u++) {
      const c = 90 + 18 * Math.sin(u / 50);
      for (let x = Math.floor(c - 4); x <= c + 4; x++) img.set(x, Y(u), Math.abs(x + 0.5 - c) > 3.5 ? C.gravel[0] : rampColor(C.gravel, fbm(x, u, { seed: 191, scale: 2 }), x, Y(u)));
      reserveRect(c - 5, Y(u), 10, 1);
      const sc = 140 + 10 * Math.sin(u / 23);
      for (let x = Math.floor(sc - 1); x <= sc + 1; x++) img.set(x, Y(u), C.blood[1 + (Math.abs(x - sc) < 0.6 ? 1 : 0)]);
    }
    crowd(70, Y(pu - 60), 40, 120, 30, true);
    for (let k = 0; k < 8; k++) plume(px + (rand() - 0.5) * 110, Y(pu) + (rand() - 0.5) * 56, 1 + rand() * 0.8);
    for (let k = 0; k < 110; k++) {
      const x = rand() * W;
      const u = TATSUMAKI[1] + 10 + rand() * (pu - TATSUMAKI[1] - 70);
      if (!anyRes(x - 4, Y(u) - 4, 8, 8)) tree(rand.pick(['pine', 'broadleaf', 'tiny']), x, Y(u), 3 + rand() * 3);
    }
  }

  // ------------------------------------------------------------ compose
  for (const o of objects) o.shadow?.();
  objects.sort((a, b) => a.y - b.y);
  for (const o of objects) o.draw();

  // geyser vents: wet dark holes with a rim of mineral deposits
  for (const v of vents) {
    const y = Y(v.u);
    for (let yy = y - 10; yy <= y + 10; yy++)
      for (let xx = v.x - 10; xx <= v.x + 10; xx++) {
        const d = Math.hypot(xx + 0.5 - v.x, yy + 0.5 - y) + (fbm(xx, yy, { seed: 161, scale: 2 }) - 0.5) * 2;
        if (d > 10) continue;
        img.set(xx, yy, d < 3.5 ? 0x1e1a18 : d < 6 ? (v.mud ? C.mud[1] : 0x7a98a2) : (xx + yy) % 3 ? 0xe8dcc0 : 0xd0c098);
      }
    // a wisp of steam always rising from the hole
    kit.emit(v.x, Math.round(v.u), [2, 3, 4, 5].map(puffFrames), { rate: 2.4, life: [2, 2.8], vy: 10, sx: 1, wf: 0.4, a: 0.7, d: 1.1, tint: 1 });
  }
  // turret pads: stone steam stands
  for (const p of pads) {
    const y = Y(p.u);
    for (let yy = y - 9; yy <= y + 9; yy++)
      for (let xx = p.x - 9; xx <= p.x + 9; xx++) {
        const d = Math.hypot(xx + 0.5 - p.x, yy + 0.5 - y);
        if (d <= 9) img.set(xx, yy, d > 7.6 ? C.stone[0] : rampColor(C.stone, 0.4 + fbm(xx, yy, { seed: 2, scale: 3 }) * 0.4, xx, yy));
      }
  }

  // ------------------------------------------------------------ atmosphere, then lights on top
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
  // the blood pond glows a little at dusk
  {
    const [x, u] = pond;
    const y = Y(u);
    const [cr, cg, cb] = rgb(0xff5030);
    for (let yy = y - 70; yy <= y + 70; yy++)
      for (let xx = x - 70; xx <= x + 70; xx++) {
        const i = img.idx(xx, yy);
        if (i < 0 || !img.data[i + 3]) continue;
        const dd = Math.hypot(xx + 0.5 - x, yy + 0.5 - y) / 70;
        if (dd >= 1) continue;
        const f = (1 - dd) ** 1.6 * 0.22;
        img.data[i] += cr * f;
        img.data[i + 1] += cg * f;
        img.data[i + 2] += cb * f;
      }
  }
  for (const [x, y, c, a] of lights) img.set(x, y, c, a);

  const chunks = [];
  for (let i = 0; i < CHUNKS; i++) chunks.push(img.crop(0, i * CHUNK, W, CHUNK));
  return { strip: img, chunks, props: kit.pack(), meta: { width: W, chunkHeight: CHUNK, chunks: CHUNKS, length: L, tint: tintTable(L, tod.white) } };
}
