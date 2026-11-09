// The climb, u = 5400..: the 1914 lava in blocks and plates with its road, black pines, silver grass, knotweed and pale lichen, the
// Yunohira observatory where the road stops, a network of cracks that begins to glow towards the top, flows creeping from the
// rim, volcanic bombs thudding down; then the summit crater, its gullied cone, banded inner walls and lake of molten rock under
// floating plates of crust, with its two side vents, where Sakurajima wakes. The lava breathes, patch by patch, out of step.
import { C, S, hashPx, scaleColor, rampColor, rng, fbm, HiCanvas, mix } from '../nagasaki/canvas.mjs';
import { puff } from '../props.mjs';
import { W, L, LAVA, LAVA_ROAD, ROAD_END, CRATER, VENTS, lavaRoadX, smooth } from './geo.mjs';
import { vapourOf } from './coast.mjs';
import { LEAF } from './city.mjs';

const ROCK = [0x1e1a1c, 0x2c2628, 0x3c3436, 0x4e4648, 0x625a5a, 0x7a7270];
const ASH = [0x4e4c4c, 0x5e5c5a, 0x6e6c68, 0x807e78];
const HOT = [0xc82a08, 0xff4a10, 0xff8a20, 0xffc040, 0xffe890];

/** Jittered cells: how near the next cell's edge, which cell, where in it. */
const cell = (x, y, scale, seed) => {
  const gx = Math.floor(x / scale);
  const gy = Math.floor(y / scale);
  let d1 = 1e9;
  let d2 = 1e9;
  let id = 0;
  let cx = 0;
  let cy = 0;
  for (let j = -1; j <= 1; j++)
    for (let i = -1; i <= 1; i++) {
      const px = (gx + i + hashPx(gx + i + 4096, gy + j + 4096, seed)) * scale;
      const py = (gy + j + hashPx(gx + i + 4096, gy + j + 4096, seed + 1)) * scale;
      const d = Math.hypot(x - px, y - py);
      if (d < d1) {
        d2 = d1;
        d1 = d;
        id = hashPx(gx + i + 4096, gy + j + 4096, seed + 2);
        cx = px;
        cy = py;
      } else if (d < d2) d2 = d;
    }
  return { edge: d2 - d1, id, dx: (x - cx) / scale, dy: (y - cy) / scale };
};

/** One fine pixel of the 1914 lava. Returns its colour; `hot` tells whether a crack here glows. */
export function lavaPx(k, X, Yy, x, y, u) {
  const big = fbm(x, y, { seed: 13, scale: 22, octaves: 2 });
  // the flow's levees, running down the mountain in long tongues
  const levee = Math.sin(x * 0.13 + fbm(x, y, { seed: 15, scale: 30 }) * 7);
  const wx = x + (fbm(x, y, { seed: 16, scale: 12 }) - 0.5) * 8;
  const wy = y + (fbm(x + 40, y, { seed: 16, scale: 12 }) - 0.5) * 8;
  const a = big > 0.5 ? cell(wx, wy, 7, 61) : cell(wx, wy, 4.4, 60);
  const b = cell(wx, wy, 1.7, 62);
  // aa: rough blocks, each lit on its upper left, tumbled every way
  const lit = 0.34 + a.id * 0.2 - (a.dx + a.dy) * 0.34 + levee * 0.09 + (big - 0.5) * 0.3 + (b.id - 0.5) * 0.14 - (b.dx + b.dy) * 0.1;
  let c = rampColor(ROCK, lit, X, Yy);
  if (a.edge < 0.34) c = ROCK[0];
  else if (a.edge < 0.62) c = scaleColor(c, 0.74);
  else if (b.edge < 0.14) c = scaleColor(c, 0.82);
  // ash lying in the hollows: it settles between the blocks first, drifting smooth where it's deep
  const drift = fbm(x, y, { seed: 18, scale: 18, octaves: 3 });
  const lim = 0.56 - (a.edge < 0.8 ? 0.05 : 0);
  if (drift > lim && hashPx(X, Yy, 63) < (drift - lim) * 11) {
    const ripple = Math.sin(y * 3.4 + x * 0.5 + fbm(x, y, { seed: 19, scale: 7 }) * 6) * 0.1;
    c = rampColor(ASH, (drift - 0.5) * 2 + ripple + (hashPx(X, Yy, 64) - 0.5) * 0.14, X, Yy);
  } else if (u < 6300 && hashPx(X >> 1, Yy >> 1, 65) > 0.9 && fbm(x, y, { seed: 66, scale: 9 }) > 0.56) {
    c = hashPx(X, Yy, 67) < 0.5 ? 0x8a9a8c : 0x6e7e70; // pale stereocaulon lichen, the very first thing to grow
  }
  // near the top the cracks are alive
  const heat = smooth(5850, 6900, u);
  if (heat > 0 && a.edge < 0.2) {
    const q = fbm(x, y, { seed: 77, scale: 16, octaves: 2 });
    if (q > 0.74 - heat * 0.12) k.lavaGlow(X, Yy, a.edge < 0.1 && q > 0.76 ? 0xd84a14 : hashPx(X >> 1, Yy >> 1, 68) < 0.5 ? 0xb8300c : 0x8e2208);
  }
  return c;
}

export function paintLava(k) {
  const { img, Y, kit, objects, pool, glowPx } = k;
  const R = rng(5400);
  const vapour = vapourOf(k);

  // ------------------------------------------------------------ the road, on from the village over the lava to the observatory
  const pts = [];
  for (let u = LAVA_ROAD[0] - 4; u <= ROAD_END; u += 8) pts.push([lavaRoadX(u), u]);
  for (let i = 0; i < pts.length - 1; i += 12) k.road(pts.slice(i, i + 14), 4, { side: 1, lanes: true, piece: true, pave: [0x4e4a46, 0x5e5a54, 0x6e6a62] });
  // crash barriers and marker posts on its bends, a lay-by with a shelter
  for (let i = 0; i < pts.length; i += 3) {
    const [x, u] = pts[i];
    for (const s of [-6.4, 6.4]) if (x + s > 1 && x + s < W - 1) img.rectPx((x + s) * S, Y(u) * S - 4, 2, 6, i % 2 ? 0xe8e4dc : 0xd83a2a);
  }
  // the Yunohira observatory: its car park at the road's end, the low building, the crescent terrace looking at the crater
  {
    const rx = lavaRoadX(ROAD_END);
    k.road([[rx, ROAD_END - 2], [34, ROAD_END + 4]], 3, { side: 0, lanes: false, piece: true });
    img.fine(10, Y(6122), 46, 22, (X, Yy, x, y) => {
      const inRow = (y - Y(6122)) % 11;
      if ((inRow < 1 || inRow > 8) && X % 18 < 2) return 0xe4e4dc;
      return k.asphaltPx(X, Yy);
    });
    k.reserve(8, Y(6124), 50, 26);
    for (let q = 0; q < 10; q++) {
      const X = (12 + (q % 7) * 6) * S + 3;
      const Yy = (Y(6120) + (q > 6 ? 12 : 1)) * S;
      const c = [0xe8e8ec, 0x2c3038, 0xc43a30, 0x3a609c, 0x9aa2aa, 0xe8d69c, 0x6a2a3a][q % 7];
      for (let j = 0; j < 15; j++) for (let i = 0; i < 9; i++) img.px(X + i, Yy + j, (j === 4 || j === 10) && i > 0 && i < 8 ? 0x2a3440 : c);
    }
    k.house(14, Y(6150), 34, 14, 6, 'block', { roofC: 0x8a867e, wall: 0xc8c4bc, plainRoof: false });
    // the terrace: flagged, a stone rail in an arc, people at it with cameras, all looking up the mountain
    img.fine(6, Y(6176), 58, 24, (X, Yy, x, y) => {
      const u = 7168 - y;
      const e = ((x - 34) / 28) ** 2 + ((u - 6152) / 24) ** 2;
      if (e > 1 || u < 6152) return null;
      if (e > 0.92) return (X >> 2) % 3 ? 0xd0ccc4 : 0x5a5a5e;
      return k.settPx(X, Yy, 5401, C.granite);
    });
    k.reserve(6, Y(6176), 58, 24);
    k.crowd(16, Y(6168), 36, 8, 14);
    k.streetLamp(12, 6126);
    k.streetLamp(52, 6126);
    k.strollers(30, 6112, 16, 6, 3);
  }
  // black pines, in clumps, the first trees back on the lava, thinning out up the slope; boulders; silver grass; knotweed
  for (let q = 0; q < 24; q++) {
    const cx = R() * W;
    const cu = LAVA[0] + R() * 560;
    const n = 4 + R.int(0, 8);
    for (let i = 0; i < n; i++) {
      const x = cx + (R() - 0.5) * 22;
      const u = cu + (R() - 0.5) * 18;
      if (!k.isRes(x, Y(u))) k.tree(x, Y(u), 2.6 + R() * 2.4, i % 3 ? [0x14221c, 0x1e3024, 0x2c4230, 0x3e5840] : LEAF.pine, q * 37 + i + 5402, 'pine');
    }
  }
  for (let q = 0; q < 40; q++) {
    const x = R() * W;
    const u = LAVA[0] + 400 + R() * 500;
    if (!k.isRes(x, Y(u))) k.tree(x, Y(u), 2 + R() * 1.4, [0x14221c, 0x1e3024, 0x2c4230, 0x3e5840], q * 11 + 5500, 'pine');
  }
  for (let q = 0; q < 460; q++) {
    const x = Math.round(R() * W);
    const u = LAVA[0] + R() * (CRATER.u - LAVA[0] - 60);
    const y = Y(u);
    if (k.isRes(x, y)) continue;
    const X = x * S;
    const Yy = y * S;
    const roll = R();
    if (roll < 0.34) {
      k.rockPx(X, Yy, 3 + R() * 7, ROCK.slice(1), q);
    } else if (roll < 0.74 && u < 6300) {
      // susuki: a fountain of thin pale blades, plumes on their tips, its shadow on the rock
      for (let i = 0; i < 12; i++) img.tintPx(X + i - 3, Yy + 1, 0.7);
      for (let b = 0; b < 15; b++) {
        const lean = (b - 7) * 0.13 + 0.3;
        const h = 9 + hashPx(b, q, 5407) * 8;
        for (let j = 0; j < h; j++) {
          const t = j / h;
          img.px(X + lean * j * (0.5 + t * 1.1), Yy - j * (1 - t * 0.16), t > 0.76 ? 0xf0e4bc : t > 0.4 ? 0xb8a87a : 0x7a7a50);
        }
      }
    } else if (u < 6100) {
      // knotweed, the brightest green up here, a red stem here and there
      for (let j = 0; j < 40; j++) {
        const px = X + (hashPx(j, q, 5403) - 0.5) * 34;
        const py = Yy + (hashPx(j, q, 5404) - 0.5) * 21;
        img.rectPx(px, py, 2, 2, hashPx(j, q, 5405) < 0.16 ? 0x8a3a3a : hashPx(j, q, 5406) < 0.5 ? 0x4e7a34 : 0x6e9a44);
      }
    }
  }
  // steam off the fissures (live), a stain of pale sulphur round each
  for (let q = 0; q < 36; q++) {
    const x = R() * W;
    const u = LAVA[0] + 300 + R() * 1250;
    if (k.isRes(x, Y(u))) continue;
    for (let j = 0; j < 30; j++) img.rectPx(x * S + (hashPx(j, q, 5408) - 0.5) * 24, Y(u) * S + (hashPx(j, q, 5409) - 0.5) * 15, 2, 1, 0xc8c088, 0.5);
    kit.emit(Math.round(x), u + 1, vapour, { rate: 0.8, life: [2.4, 3.4], vy: 6, sx: 1, wf: 1, a: 0.4, tint: 1 });
  }
  // the flows creeping down from the rim: a molten thread in a crusted channel, its glow on the rock
  for (const [x0, u0, len, seed2] of [[56, 7026, 150, 1], [84, 7018, 210, 2], [118, 7024, 130, 4], [154, 7014, 110, 6]]) {
    let x = x0;
    const hi = [];
    for (let q = 0; q < len * S; q++) {
      const u = u0 - q / S;
      x += (fbm(u, seed2 * 13, { seed: 71, scale: 24, octaves: 2 }) - 0.5) * 0.9;
      const w = 0.7 + Math.sin(q * 0.012 + seed2) * 0.24 + (1 - q / (len * S)) * 0.7;
      const X = x * S;
      const Yy = Math.round((7168 - u) * S);
      for (let i = -w * S - 3; i <= w * S + 3; i++) {
        const a = Math.abs(i) / (w * S);
        if (a > 1) img.px(X + i, Yy, a > 1.3 ? ROCK[3] : ROCK[0]);
        else img.px(X + i, Yy, ROCK[1]);
        if (a < 0.72 && hashPx((X + i) >> 3, (Yy + i * 2) >> 3, 72 + seed2) < 0.9 - (q / (len * S)) * 0.7) {
          const col = a < 0.26 ? 0xf08a30 : a < 0.5 ? 0xd85a18 : 0xa8300c;
          glowPx(X + i, Yy, col, 0.9);
          hi.push([X + i, Yy]);
        }
      }
      if (q % 120 === 0) pool(x, Y(u), 7 + w * 3, 0xff5a20, 0.16);
    }
    k.breathe(hi, u0 * 0.3 + seed2);
  }
  // volcanic bombs thudding down on the slopes under the crater: a shadow coming in, the hit, ash thrown up, the rock still glowing
  const bomb = [0, 1, 2, 3, 4, 5, 6].map((f) => {
    const r = new HiCanvas(13, 13);
    const c = 19;
    if (f === 0) r.discPx(c, c, 2, 0x1a1414, 0.5);
    if (f === 1) r.discPx(c, c, 4, 0x1a1414, 0.6);
    if (f === 2) {
      r.discPx(c, c, 7, 0xff8a20);
      r.discPx(c, c, 3.4, 0xfff0a0);
    }
    if (f >= 3) {
      const rr = (f - 1) * 3;
      for (let a = 0; a < 6.3; a += 0.2) r.px(c + Math.cos(a) * rr, c + Math.sin(a) * rr * 0.8, 0x7a7470, 0.8 - (f - 3) * 0.15);
      r.discPx(c, c, 4, f < 5 ? 0xff6a10 : 0xa83a10);
    }
    return kit.frame(r);
  });
  kit.spot([[8, 6980, 164, 300]], bomb, { rate: 0.5, fps: 7 });
  void objects;
  void mix;
  void L;
}

export function paintCrater(k) {
  const { img, Y, kit, pool, glowPx } = k;
  const { x: cx, u: cu, rx, ry } = CRATER;
  const cy = Y(cu);
  const R = rng(7088);
  const molten = [];
  const y0 = cy - ry - 34;
  const hh = Math.min(ry * 2 + 96, 7168 - y0);
  img.fine(0, y0, W, hh, (X, Yy, x, y) => {
    const ang = Math.atan2((y - cy) * (rx / ry), x - cx);
    const jag = (fbm(x, y, { seed: 41, scale: 8, octaves: 3 }) - 0.5) * 0.14;
    const r = Math.hypot((x - cx) / rx, (y - cy) / ry) + jag;
    if (r > 1.72) return null;
    const grain = hashPx(X >> 1, Yy >> 1, 7089);
    // light from the upper left: how squarely this bit of the cone faces it
    const out = -(Math.cos(ang) * 0.6 + Math.sin(ang) * 0.8);
    if (r > 1.08) {
      if (r > 1.4 && hashPx(X, Yy, 7094) < (r - 1.4) / 0.32) return null; // it runs out into the lava
      const g = Math.abs(Math.sin(ang * 17 + fbm(x, y, { seed: 44, scale: 9 }) * 4));
      const scree = cell(x, y, 2, 69);
      let v = 0.36 + out * 0.22 + (g - 0.5) * 0.34 + (1.72 - r) * 0.16 + (grain - 0.5) * 0.14 - (scree.dx + scree.dy) * 0.08;
      if (scree.edge < 0.16) v -= 0.14;
      let c = rampColor(ROCK, v, X, Yy);
      // ash streaks run down the gullies, red dust nearer the rim
      if (g < 0.26 && hashPx(X, Yy >> 2, 7095) < 0.6) c = rampColor(ASH, 0.3 + grain * 0.4, X, Yy);
      if (r < 1.26 && hashPx(X >> 1, Yy, 7096) < 0.3) c = mix(c, 0x6a3020, 0.5);
      return c;
    }
    if (r > 0.93) {
      // the rim, sharp and bright where the light catches it, its inner lip lit red from below
      const v = 0.72 + out * 0.2 + (grain - 0.5) * 0.3 - (r - 1) * 2;
      const c = rampColor(ROCK, v, X, Yy);
      return r < 0.97 ? mix(c, 0xa83a18, 0.34) : c;
    }
    if (r > 0.56) {
      // the inner walls, falling away in bands of old lava and tuff, facing the light on the far side, glowing near the floor
      const band = Math.floor(r * 26 + fbm(x, y, { seed: 45, scale: 14 }) * 2);
      const v = 0.34 - out * 0.3 + (band % 2 ? 0.1 : -0.06) + (grain - 0.5) * 0.14;
      const c = rampColor(ROCK, v, X, Yy);
      const near = (0.93 - r) / 0.37;
      if (band % 3 === 0 && hashPx(X >> 2, Yy, 7097) < 0.2) return mix(c, 0xc8c088, 0.3);
      return mix(c, 0x9a2a10, near * near * 0.62);
    }
    // the lake: plates of black crust drifting on molten rock, the cracks between them widest in the middle
    const t = r / 0.56;
    const px = x + (fbm(x, y, { seed: 46, scale: 9, octaves: 2 }) - 0.5) * 12;
    const py = y + (fbm(x + 30, y, { seed: 46, scale: 9, octaves: 2 }) - 0.5) * 12;
    const p = cell(px, py, t < 0.5 ? 4.2 : 6.4, 70);
    const gap = 0.16 + (1 - t) ** 1.6 * 1.7 + (p.id < 0.3 ? 0.3 : 0);
    if (p.edge < gap || t < 0.3) {
      const q = Math.min(1, (1 - p.edge / gap) * 0.34 + (1 - t) * 0.92 + (fbm(x, y, { seed: 47, scale: 4 }) - 0.5) * 0.3);
      const col = q > 0.82 ? HOT[4] : q > 0.62 ? HOT[3] : q > 0.42 ? HOT[2] : q > 0.24 ? HOT[1] : HOT[0];
      glowPx(X, Yy, hashPx(X >> 1, Yy >> 1, 7098) < 0.08 ? scaleColor(col, 0.8) : col, 0.97);
      molten.push([X, Yy]);
      return col;
    }
    return mix(rampColor(ROCK, 0.1 + p.id * 0.24 - (p.dx + p.dy) * 0.14 + (grain - 0.5) * 0.1, X, Yy), 0x8a2010, p.edge < gap + 0.3 ? 0.5 : 0.14);
  });
  k.reserve(0, y0, W, hh);
  pool(cx, cy, rx * 0.9, 0xff4a10, 0.5);
  pool(cx, cy, rx * 0.46, 0xffa040, 0.34);
  k.breathe(molten.filter((q) => (q[0] + q[1]) % 2 === 0), 1);
  // the eruption column (live): ash billowing out of the crater, leaning with the wind; steam off the vents
  const ash = [15, 21, 27, 33, 39, 45].map((r) => [0, 1, 2].map((v) => kit.frame(puff(r, r * 7 + v * 3, [0x4a4246, 0x625a5c, 0x7e7676, 0x9e9692]))));
  for (const [dx, du] of [[0, 4], [-14, 0], [12, -2]]) kit.emit(cx + dx, cu + du, ash, { rate: 1.3, life: [4.5, 6], vy: 11, sx: 5, wf: 1.2, a: 0.62, burst: 0.06, d: 1.1, tint: 1 });
  for (const [vx, vu] of VENTS) {
    const vy = Y(vu);
    // a parasitic cone: its flanks lit from the upper left, a throat of dark rock glowing at the bottom
    const throat = [];
    img.fine(vx - 15, vy - 13, 30, 26, (X, Yy, x, y) => {
      const d = Math.hypot((x - vx) / 14, (y - vy) / 12) + (hashPx(X >> 2, Yy >> 2, 7091) - 0.5) * 0.1;
      if (d >= 1) return null;
      const ang = Math.atan2(y - vy, x - vx);
      const lit = -(Math.cos(ang) * 0.6 + Math.sin(ang) * 0.8);
      if (d > 0.5) return rampColor(ROCK, 0.4 + lit * 0.34 * (d - 0.5) * 2 + (Math.abs(Math.sin(ang * 12)) - 0.5) * 0.2 + (hashPx(X >> 1, Yy >> 1, 7092) - 0.5) * 0.18, X, Yy);
      if (d > 0.42) return rampColor(ROCK, 0.76 + lit * 0.2, X, Yy);
      if (d < 0.2) {
        const col = d < 0.1 ? HOT[3] : HOT[1];
        glowPx(X, Yy, col, 0.95);
        throat.push([X, Yy]);
        return col;
      }
      return mix(rampColor(ROCK, 0.12 - lit * 0.12, X, Yy), 0x8a2010, (0.42 - d) / 0.22);
    });
    k.reserve(vx - 15, vy - 13, 30, 26);
    pool(vx, vy, 16, 0xff6020, 0.42);
    k.breathe(throat, vx);
    kit.emit(vx, vu, ash.slice(0, 3), { rate: 1.2, life: [2.5, 3.5], vy: 8, sx: 2, wf: 1, a: 0.45, d: 1.1, tint: 1 });
  }
  // steam drifting off the rim
  for (let q = 0; q < 40; q++) {
    const a = R() * Math.PI * 2;
    const X = (cx + Math.cos(a) * rx * 1.04) * S;
    const Yy = (cy + Math.sin(a) * ry * 1.04) * S;
    for (let j = 0; j < 18; j++) img.px(X + j * 0.5, Yy - j, 0xffffff, 0.25 - j * 0.012);
  }
}
