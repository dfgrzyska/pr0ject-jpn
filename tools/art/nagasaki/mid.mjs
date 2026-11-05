// Middle layer (Nagasaki), seen from above in 3/4 pixel-art view, sailing in from Hashima through the harbour
// mouth and north through the city to the night summit of Mount Inasa. The map (shores, river, roads) is in
// geo.mjs; the districts are painted by the modules below, in order along the strip.
import { readFileSync } from 'node:fs';
import { Raster, fbm, mix, rng } from '../../lib/raster.mjs';
import { rampColor } from '../nature.mjs';
import { makeCanvas, C, scaleColor } from './canvas.mjs';
import { W, L, RIDGE, leftShore, rightShore, EMBANK, uraSouth, uraNorth } from './geo.mjs';
import { paintHashima } from './hashima.mjs';
import { paintHarbour } from './harbour.mjs';
import { paintOura, paintDejima, paintShinchi } from './town.mjs';
import { paintNakashima, paintSuwa } from './river.mjs';
import { paintUrakami, paintInasa } from './urakami.mjs';
import { paintTraffic } from './traffic.mjs';
import { paintNetwork } from './network.mjs';

export { W, L };

/** Where the stage's ground turrets stand: they spawn just above the screen and ride on the strip. */
export function turretPads() {
  const stage = JSON.parse(readFileSync(new URL('../../../src/data/stage8.json', import.meta.url), 'utf8'));
  const { mid, anchor } = stage.scroll;
  return stage.waves.filter((w) => w.type === 'turret').map((w) => ({ x: w.x, u: Math.round(anchor + mid * w.t + 10) }));
}

export function buildFar() {
  const r = new Raster(W, 384);
  for (let y = 0; y < r.h; y++)
    for (let x = 0; x < W; x++) {
      const v = fbm(x * 0.6, y, { seed: 81, scale: 16, periodY: 384 });
      r.set(x, y, mix(0x071c30, 0x275064, v));
      if ((x * 17 + y * 31) % 167 === 0) r.rect(x, y, 3, 1, 0x78969f, 0.45);
    }
  return r;
}

/** The ground a district stands on before anything is built (land only). */
function groundAt(x, u) {
  if (u < 1960) {
    // the coasts: rocky shore, then wooded hillside (the shipyard and the terminal pave their own)
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

export function buildMid() {
  const k = makeCanvas(8088);
  const { img, Y, U } = k;
  const R = rng(8089);

  // ------------------------------------------------------------ water and ground
  for (let y = 0; y < L; y++) {
    const u = U(y);
    if (u >= RIDGE) continue; // above the summit ridge: left clear, the night view shows through
    for (let x = 0; x < W; x++) {
      if (k.wet(x, y)) {
        const river = u > EMBANK;
        const ramp = river ? C.river : C.sea;
        const n = fbm(x, y, { seed: 71, scale: 22, octaves: 3 });
        const ripple = fbm(x * 0.35, y * 2.2, { seed: 72, scale: 6, octaves: 2 });
        let v = 0.18 + n * 0.45 + (ripple > 0.62 ? 0.18 : 0);
        // shallows lighten towards the shore
        let near = 9;
        for (let d = 1; d < 9 && near === 9; d++) if (!k.wet(x - d, y) || !k.wet(x + d, y) || !k.wet(x, y - d) || !k.wet(x, y + d)) near = d;
        if (!river && near < 9) v += (9 - near) * 0.03;
        img.set(x, y, rampColor(ramp, Math.min(0.98, v), x, y));
        continue;
      }
      const ramp = groundAt(x, u);
      const n = 0.2 + fbm(x, y, { seed: 17, scale: ramp === C.rock ? 3 : 7, octaves: 2 }) * 0.65;
      img.set(x, y, rampColor(ramp, n, x, y));
    }
  }
  // edges: stone quays and walls in the city, rocks and surf on the open coasts. In 3/4 view a wall's face shows
  // under land that has water to its south; its top edge catches the light.
  for (let y = 1; y < L - 3; y++) {
    const u = U(y);
    if (u >= RIDGE) continue;
    const natural = u < 1540;
    for (let x = 0; x < W; x++) {
      if (!k.wet(x, y)) {
        if (k.wet(x, y + 1) || k.wet(x, y - 1) || k.wet(x - 1, y) || k.wet(x + 1, y)) img.set(x, y, natural ? C.rock[3] : C.granite[3]);
        continue;
      }
      if (!k.wet(x, y - 1)) {
        // the face of the wall (or rock) below the land
        for (let j = 0; j < 3; j++) {
          if (!k.wet(x, y + j)) break;
          const c = natural ? rampColor(C.rock, 0.5 - j * 0.15 + fbm(x, y + j, { seed: 77, scale: 2 }) * 0.3, x, y + j) : (x + j * 2) % 5 === 0 ? C.granite[0] : C.granite[2 - Math.min(1, j)];
          img.set(x, y + j, c);
        }
        if (k.wet(x, y + 3)) img.set(x, y + 3, 0x081820, 0.45);
        if (k.wet(x, y + 4)) img.set(x, y + 4, 0x081820, 0.25);
      }
      if (natural) {
        // surf against the rocks: broken white lines a pixel or two off the shore
        let d = 9;
        for (let q = 1; q < 6 && d === 9; q++) if (!k.wet(x - q, y) || !k.wet(x + q, y) || !k.wet(x, y + q)) d = q;
        if (d <= 2 && fbm(x, y * 2, { seed: 79, scale: 3 }) > 0.45) img.set(x, y, 0xe6f2f0, d === 1 ? 0.75 : 0.4);
        else if (d <= 4 && fbm(x, y, { seed: 80, scale: 2 }) > 0.72) img.set(x, y, 0xa8ccd0, 0.35);
      }
    }
  }
  // boulders in the shallows off the rocky coasts
  for (let i = 0; i < 70; i++) {
    const u = 980 + R() * 560;
    const side = R() < 0.5;
    const x = side ? leftShore(u) + 2 + R() * 6 : rightShore(u) - 2 - R() * 6;
    const y = Y(u);
    if (!k.wet(Math.round(x), y)) continue;
    const r = 1 + R() * 1.6;
    img.disc(x, y, r, C.rock[2]);
    img.set(Math.round(x - r * 0.4), Math.round(y - r * 0.4), C.rock[4]);
    img.set(Math.round(x + r * 0.5), Math.round(y + r * 0.6), C.rock[0]);
    img.set(Math.round(x), Math.round(y + r + 1), 0xd8eceb, 0.5);
  }

  // ------------------------------------------------------------ districts, south to north
  paintHashima(k);
  paintNetwork(k);
  // the harbour winch turrets' pads: kept clear of buildings, a concrete ring with hazard stripes, drawn last
  for (const p of turretPads()) {
    const y = Y(p.u);
    k.reserve(p.x - 10, y - 10, 21, 21);
    k.late.push(() => {
      for (let yy = y - 10; yy <= y + 10; yy++)
        for (let xx = p.x - 10; xx <= p.x + 10; xx++) {
          const d = Math.hypot(xx + 0.5 - p.x, yy + 0.5 - y);
          if (d > 10.2) continue;
          const stripe = (Math.floor(Math.atan2(yy - y, xx - p.x) * 4) & 1) ? 0x2a2a2e : 0xe8c040;
          img.set(xx, yy, d > 9 ? C.concrete[1] : d > 7.6 ? stripe : (xx + yy) % 4 === 0 ? C.concrete[2] : C.concrete[3]);
        }
      img.set(p.x + 3, y + 10, 0x101418, 0.4);
    });
  }
  paintHarbour(k);
  paintOura(k);
  paintDejima(k);
  paintShinchi(k);
  paintNakashima(k);
  paintSuwa(k);
  paintUrakami(k);
  paintInasa(k);
  paintTraffic(k);

  const { strip, props, tint } = k.finish();
  return { strip, props, meta: { width: W, chunkHeight: 512, chunks: 14, length: L, tint } };
}

export { scaleColor };
