// Middle layer (Nagasaki), seen from above in 3/4 pixel-art view at 3x the game's resolution, sailing in from Hashima
// through the harbour mouth and north through the city to the night summit of Mount Inasa. The map (shores, river,
// roads) is in geo.mjs; the districts are painted by the modules below, in order along the strip. The water is the far
// layer showing through, with the sky's colour laid over it: gold, then sunset, then the blue hour, then night.
import { readFileSync } from 'node:fs';
import { fbm, hashPx, makeCanvas, C, S, scaleColor, rampColor, smooth, HiCanvas } from './canvas.mjs';
import { rng } from '../../lib/raster.mjs';
import { W, L, RIDGE, leftShore, rightShore, EMBANK, uraSouth, uraNorth } from './geo.mjs';
import { paintHashima } from './hashima.mjs';
import { paintHarbour } from './harbour.mjs';
import { paintOura, paintDejima, paintShinchi } from './town.mjs';
import { paintNakashima, paintSuwa } from './river.mjs';
import { paintUrakami, paintInasa } from './urakami.mjs';
import { paintTraffic } from './traffic.mjs';
import { paintNetwork } from './network.mjs';

export { W, L };
export { buildFar } from './far.mjs';

/** Where the stage's ground turrets stand: they spawn just above the screen and ride on the strip. */
export function turretPads() {
  const stage = JSON.parse(readFileSync(new URL('../../../src/data/stage8.json', import.meta.url), 'utf8'));
  const { mid, anchor } = stage.scroll;
  return stage.waves.filter((w) => w.type === 'turret').map((w) => ({ x: w.x, u: Math.round(anchor + mid * w.t + 10) }));
}

/** The ground a district stands on before anything is built (land only). */
function groundAt(x, u) {
  if (u < 900) return C.concrete; // Hashima
  if (u < 1960) {
    const shore = x < 90 ? x - leftShore(u) : rightShore(u) - x;
    return shore > -7 ? C.rock : C.grass;
  }
  if (u < EMBANK) return x < 70 && u > 2560 ? C.paving : C.grass;
  if (u < 4280) return C.paving;
  if (u < 4650) return C.moss;
  if (u < 5100) return C.grass;
  if (u < 5700) return u < uraSouth(x) || u > uraNorth(x) + 40 ? C.paving : C.quay;
  return C.forest;
}

/** The sky's colour on the water: [colour, alpha]. */
function waterSky(u) {
  const stops = [
    [0, 0xe8a060, 0.1],
    [900, 0xe88a50, 0.14],
    [1500, 0xc85a48, 0.24],
    [2200, 0x6a3a70, 0.34],
    [3000, 0x2a2a60, 0.46],
    [4000, 0x0e1838, 0.58],
    [7168, 0x081028, 0.62],
  ];
  let i = 0;
  while (i < stops.length - 2 && u >= stops[i + 1][0]) i++;
  const t = smooth(stops[i][0], stops[i + 1][0], u);
  const a = stops[i][2] + (stops[i + 1][2] - stops[i][2]) * t;
  const c0 = stops[i][1];
  const c1 = stops[i + 1][1];
  const c = [16, 8, 0].reduce((acc, sh) => acc | (Math.round(((c0 >> sh) & 255) + (((c1 >> sh) & 255) - ((c0 >> sh) & 255)) * t) << sh), 0);
  return [c, a];
}

/** What moves on the night panorama, at fine resolution: harbour ferries and their wakes, firework bursts, a shooting star. */
function paintViewFrames(k) {
  const { kit } = k;
  for (let f = 0; f < 2; f++) {
    const r = new HiCanvas(9, 5);
    // a little ferry far below: a dark hull, a white deckhouse, rows of lit windows, her lights trailing in the water
    for (let X = 0; X < 27; X++) {
      const taper = X > 21 ? (X - 21) * 0.6 : 0;
      for (let j = 8 + Math.round(taper * 0.5); j < 11; j++) r.px(X, j, j === 8 ? 0x9aa8b0 : 0x101a24);
    }
    for (let X = 3; X < 21; X++) for (let j = 4; j < 8; j++) r.px(X, j, j === 4 ? 0xc8d4d8 : X % 3 < 2 ? (f && X % 6 < 2 ? 0xfff4c8 : 0xffd898) : 0x4a5864);
    for (let X = 8; X < 16; X++) for (let j = 2; j < 4; j++) r.px(X, j, j === 2 ? 0xc8d4d8 : X % 2 ? 0xffe4b0 : 0x4a5864);
    r.px(12, 0, 0xffffff);
    r.px(12, 1, 0x8a98a0);
    r.px(26, 8, f ? 0x92ffa1 : 0x60c080);
    r.px(0, 7, 0xff6a50);
    for (let q = 0; q < 9; q++) r.px(3 + q * 2 + (f ? 1 : 0), 11 + (q % 3), 0xffd898, 0.4 - (q % 3) * 0.1);
    kit.frame(r, 'view_ferry_' + f);
  }
  const w = new HiCanvas(14, 4);
  for (let q = 0; q < 39; q++) {
    const al = (q / 39) * 0.34;
    w.px(q, 2 + q / 12, 0xa8c8d8, al);
    w.px(q, 10 - q / 12, 0xa8c8d8, al);
  }
  kit.frame(w, 'view_wake');
  // headlights and tail lights moving on the roads, single fine pixels and their halo
  for (const [name, c] of [['view_car_0', 0xfff4d8], ['view_car_1', 0xff3a28]]) {
    const r = new HiCanvas(1, 1);
    r.px(1, 1, c);
    r.px(0, 1, c, 0.35);
    r.px(2, 1, c, 0.35);
    r.px(1, 0, c, 0.35);
    r.px(1, 2, c, 0.35);
    kit.frame(r, name);
  }
  // the bursts are white: the game tints each one. Rings of falling sparks, growing, thinning.
  const rng2 = rng(777);
  const rays = Array.from({ length: 64 }, () => [rng2() * 6.283, 0.5 + rng2() * 0.5]);
  for (let f = 0; f < 6; f++) {
    const r = new HiCanvas(70, 70);
    const CX = 105;
    const CY = 105;
    const grow = 1 - (1 - (f + 1) / 6) ** 2.4;
    if (f < 2) {
      r.discPx(CX, CY, 16 - f * 7, 0xffffff, 0.35);
      r.discPx(CX, CY, 8 - f * 3, 0xffffff, 0.9);
    }
    for (const [ang, len] of rays) {
      const R = 96 * len * grow;
      const fall = f * f * 0.9;
      const tail = 14 - f * 2;
      for (let t = 0; t < tail; t++) {
        const q = R - t * 3;
        if (q < 0) continue;
        const X = CX + Math.cos(ang) * q;
        const Yy = CY + Math.sin(ang) * q + fall * (q / 96);
        const al = (1 - t / tail) * (f > 3 ? 0.7 : 1);
        r.px(X, Yy, 0xffffff, al);
        r.px(X + 1, Yy, 0xffffff, al * 0.7);
        r.px(X, Yy + 1, 0xffffff, al * 0.7);
      }
      r.discPx(CX + Math.cos(ang) * R, CY + Math.sin(ang) * R + fall * (R / 96), f > 3 ? 1.2 : 2, 0xffffff, f > 4 ? 0.7 : 1);
    }
    kit.frame(r, 'view_fw_' + f);
  }
  const st = new HiCanvas(26, 9);
  for (let q = 0; q < 75; q++) {
    const al = (q / 75) ** 2;
    st.px(q, Math.round(q * 0.36), 0xffffff, al);
    if (q > 50) st.px(q, Math.round(q * 0.36) + 1, 0xc8d8ff, al * 0.5);
  }
  kit.frame(st, 'view_star');
}

export function buildMid() {
  const k = makeCanvas(8088);
  const { img, Y, U, fineWater, shoreD, FW, FH } = k;
  const R = rng(8089);

  // ------------------------------------------------------------ water and ground, in fine pixels
  const nRow = new Float32Array(W);
  const relief = new Float32Array(W);
  for (let Yy = 0; Yy < FH; Yy++) {
    const y = (Yy + 0.5) / S;
    const u = L - y;
    if (u >= RIDGE) continue; // above the summit ridge: left clear, the night view shows through
    if (Yy % S === 0)
      for (let x = 0; x < W; x++) {
        nRow[x] = 0.2 + fbm(x, Math.floor(y), { seed: 17, scale: 7, octaves: 2 }) * 0.65;
        relief[x] = (fbm(x + 1.5, y + 1.5, { seed: 731, scale: 28, octaves: 2 }) - fbm(x - 1.5, y - 1.5, { seed: 731, scale: 28, octaves: 2 })) * 4;
      }
    const [skyC, skyA] = Yy % S === 0 || !k.sky ? (k.sky = waterSky(u)) : k.sky;
    const natural = u > 900 && u < 1540;
    const river = u > EMBANK && u < 4400;
    for (let X = 0; X < FW; X++) {
      const i = Yy * FW + X;
      const d = shoreD[i];
      const x = (X + 0.5) / S;
      const g = hashPx(X, Yy, 18);
      if (fineWater[i]) {
        // the water itself is the far layer seen through this one, with the sky's colour laid over it
        let c = skyC;
        let a = skyA;
        if (river) {
          // a river's green water, darker under its banks
          c = 0x0e2428;
          a = 0.42 + skyA * 0.5;
          if (d < 12) a = Math.min(0.92, a + (12 - d) * 0.03);
        } else if (d < 3) {
          c = 0xe6f6f6;
          a = (natural || u < 900 ? 0.85 : 0.5) - d * 0.14;
        } else if (d < 9) {
          c = natural ? 0x4ca8b4 : 0x0c2028;
          a = natural ? 0.46 - d * 0.04 : 0.4 - d * 0.03;
        } else if (natural && d < 20 && hashPx(X >> 1, Yy >> 2, 19) > 0.5 + d * 0.02) {
          c = 0x4ca8b4;
          a = 0.2;
        }
        if (a > 0.003) img.px(X, Yy, c, a);
        continue;
      }
      const cell = Math.floor(x);
      const ramp = groundAt(x, u);
      const n = nRow[cell];
      let c;
      if (ramp === C.grass || ramp === C.moss || ramp === C.forest) {
        c = k.lawnPx(X, Yy, n, ramp, true);
        c = scaleColor(c, Math.max(0.74, Math.min(1.16, 0.95 + relief[cell])));
      } else if (ramp === C.rock) {
        c = rampColor(ramp, n, X, Yy);
        if (g < 0.12) c = scaleColor(c, 0.84);
        else if (g > 0.92) c = scaleColor(c, 1.1);
      } else if (ramp === C.concrete) {
        const t = hashPx(X >> 2, Yy >> 2, 21);
        c = rampColor([0x6e6a5e, 0x7e7a6c, 0x8e8a7a, 0x9c9888], n * 0.8 + (t - 0.5) * 0.25, X, Yy);
        if (g < 0.1) c = scaleColor(c, 0.86);
        else if (g > 0.95) c = 0xb0ac9a;
      } else {
        c = k.pavePx(X, Yy, ramp);
      }
      if (d <= 5) {
        // the edge: rock and spray on the open coasts, a stone wall in the city; a face shows under land with water south
        const south = fineWater[Math.min(FH - 1, Yy + 6) * FW + X];
        if (natural) c = rampColor(C.rock, 0.3 + (5 - d) * 0.1 + (g - 0.5) * 0.4, X, Yy);
        else if (south) {
          const XX = X + ((Yy >> 2) % 2) * 5;
          c = Yy % 4 === 0 || XX % 10 === 0 ? 0x4e4a44 : scaleColor(C.granite[Math.floor(hashPx(XX >> 3, Yy >> 2, 22) * 2) + 1], 0.92);
        } else c = d < 2 ? C.granite[0] : X % 9 === 0 ? C.granite[1] : C.granite[3];
      }
      img.px(X, Yy, c);
    }
  }
  // boulders in the shallows off the rocky coasts
  for (let i = 0; i < 90; i++) {
    const u = 980 + R() * 560;
    const side = R() < 0.5;
    const x = side ? leftShore(u) + 2 + R() * 7 : rightShore(u) - 2 - R() * 7;
    const y = Y(u);
    if (!k.wet(Math.round(x), y)) continue;
    const r = 2.5 + R() * 4;
    k.rockPx(x * S, y * S, r, C.rock, i);
    for (let a = 0; a < 6.3; a += 0.4) if (R() < 0.7) img.px(x * S + Math.cos(a) * (r + 2), y * S + Math.sin(a) * (r + 1) + 1, 0xe0f0f0, 0.5);
  }

  // ------------------------------------------------------------ districts, south to north
  // the turrets' pads: kept clear of buildings, a concrete ring with hazard stripes, drawn last
  for (const p of turretPads()) {
    const y = Y(p.u);
    k.reserve(p.x - 10, y - 10, 21, 21);
    k.late.push(() =>
      img.fine(p.x - 11, y - 11, 22, 22, (X, Yy, xx, yy) => {
        const dx = xx - p.x;
        const dy = yy - y;
        const d = Math.hypot(dx, dy);
        if (d > 10.2) return null;
        if (d > 9.5) return C.concrete[0];
        if (d > 9) return dx + dy < 0 ? C.concrete[4] : C.concrete[1];
        if (d > 7.6) return Math.floor(Math.atan2(dy, dx) * 5) & 1 ? 0x2a2a2e : 0xe8c040;
        if (d > 7.2) return 0x3a3a3e;
        return rampColor(C.concrete, 0.4 + hashPx(X >> 2, Yy >> 2, 2) * 0.35 - (dx + dy) * 0.02, X, Yy);
      }),
    );
  }
  paintHashima(k);
  paintNetwork(k);
  paintHarbour(k);
  paintOura(k);
  paintDejima(k);
  paintShinchi(k);
  paintNakashima(k);
  paintSuwa(k);
  paintUrakami(k);
  paintInasa(k);
  paintTraffic(k);
  paintViewFrames(k);

  const { strip, props, tint } = k.finish();
  return { strip, props, meta: { width: W, artScale: S, chunkHeight: 896, chunks: 8, length: L, sway: true, tint } };
}

export { scaleColor };
