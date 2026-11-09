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
  // the Arimura lookout on the 1914 flow: a spur off the road, a little car park, a domed shelter against bombs, a boardwalk winding
  // over the blocks with people on it
  {
    const ru = 5786;
    const rx = lavaRoadX(ru);
    k.road([[rx, ru], [68, ru - 6]], 2.6, { side: 0, lanes: false, piece: true });
    img.fine(50, Y(ru + 8), 22, 18, (X, Yy, x, y) => {
      const inRow = (y - Y(ru + 8)) % 9;
      return inRow < 1 && X % 15 < 2 ? 0xe4e4dc : k.asphaltPx(X, Yy);
    });
    k.reserve(50, Y(ru + 8), 22, 18);
    for (let q = 0; q < 5; q++) {
      const X = (52 + q * 4) * S;
      const Yy = Y(ru + 6) * S;
      const c = [0xe8e8ec, 0xc43a30, 0x3a609c, 0x2c3038, 0xe8d69c][q];
      for (let j = 0; j < 15; j++) for (let i = 0; i < 9; i++) img.px(X + i, Yy + j, (j === 4 || j === 10) && i > 0 && i < 8 ? 0x2a3440 : c);
    }
    // the shelter: a half-buried concrete dome, its dark mouth
    objects.push({
      y: Y(ru + 10),
      shadow: () => k.shadowEllipse(40, Y(ru + 10), 9, 3, 0.5),
      draw: () => {
        const X = 38 * S;
        const Yb = Y(ru + 10) * S;
        for (let j = 0; j < 24; j++) {
          const hw = Math.sqrt(Math.max(0, 1 - (j / 24) ** 2)) * 27;
          for (let i = -hw; i <= hw; i++) img.px(X + i, Yb - j, i < -hw * 0.4 ? 0xd8d4cc : i < hw * 0.5 ? 0xb8b4ac : 0x8a867e);
        }
        for (let j = 0; j < 12; j++) {
          const hw = Math.sqrt(Math.max(0, 1 - (j / 12) ** 2)) * 9;
          for (let i = -hw; i <= hw; i++) img.px(X + i, Yb - j, 0x121216);
        }
      },
    });
    const BW0 = [[50, ru - 1], [34, ru - 5], [18, ru + 6], [12, ru + 26], [24, ru + 46], [42, ru + 42], [46, ru + 22], [50, ru + 6]];
    const BW = [];
    for (let i = 0; i + 1 < BW0.length; i++) {
      const p0 = BW0[Math.max(0, i - 1)];
      const p1 = BW0[i];
      const p2 = BW0[i + 1];
      const p3 = BW0[Math.min(BW0.length - 1, i + 2)];
      for (let q = 0; q < 8; q++) {
        const t = q / 8;
        const at = (a, b, c, d) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t);
        BW.push([at(p0[0], p1[0], p2[0], p3[0]), at(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    BW.push(BW0[BW0.length - 1]);
    k.road(BW, 1.5, {
      side: 0,
      kerb: 0x3a2c1e,
      piece: true,
      paint: (X, Yy, across, along) => {
        const a = Math.abs(across);
        if (a > 1) return 0x5a4630;
        if (Math.floor(along * 2.2) % 2 === 0) return 0x7a6246;
        return hashPx(Math.floor(along * 2.2), 1, 5410) < 0.4 ? 0x9a8058 : 0x8a7050;
      },
    });
    for (let i = 0; i < BW.length; i += 3) {
      const [x, u] = BW[i];
      const X = x * S;
      const Yy = Y(u) * S;
      for (let j = 0; j < 6; j++) img.px(X + 6, Yy - j, 0x3a2c1e);
    }
    // a signboard at its start, a lookout platform at its far bend
    k.noticeBoard?.(42, ru + 3);
    {
      const X = 11 * S;
      const Yy = Y(ru + 30) * S;
      for (let j = -12; j <= 12; j++) for (let i = -12; i <= 12; i++) if (Math.abs(i) + Math.abs(j) < 18) img.px(X + i, Yy + j, (j + 40) % 6 < 2 ? 0x7a6246 : 0x9a8058);
      k.standing(9, Y(ru + 30) - 1, 4, 3, 3, 5411, undefined);
    }
    k.reserve(4, Y(ru + 56), 50, 54);
    k.walkers(BW.filter((_, i) => i % 4 === 0), 5, ru + 20, { sp: 2.2, gap: 26 });
  }
  // ---- past the observatory people stop: a fence and its signs across the slope, a gate on the service track up to the volcanologists'
  // station, its mast and dome and solar panels; an old bomb shelter half way
  {
    const TRK = [[50, 6122], [72, 6160], [100, 6196], [122, 6240], [140, 6290], [146, 6318]];
    const trk = [];
    for (let i = 0; i + 1 < TRK.length; i++) {
      const p0 = TRK[Math.max(0, i - 1)];
      const p1 = TRK[i];
      const p2 = TRK[i + 1];
      const p3 = TRK[Math.min(TRK.length - 1, i + 2)];
      for (let q = 0; q < 6; q++) {
        const t = q / 6;
        const at = (a, b, c, d) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t);
        trk.push([at(p0[0], p1[0], p2[0], p3[0]), at(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    trk.push(TRK[TRK.length - 1]);
    k.road(trk, 1.6, { side: 0, kerb: ROCK[1], piece: true, paint: (X, Yy, across) => (Math.abs(Math.abs(across) - 0.8) < 0.3 ? rampColor(ROCK, 0.2, X, Yy) : rampColor(ASH, 0.3 + hashPx(X >> 2, Yy, 5412) * 0.5, X, Yy)) });
    const fenceU = (x) => 6196 + Math.sin(x * 0.05) * 5;
    objects.push({
      y: Y(6190),
      draw: () => {
        let last = null;
        for (let x = 2; x < W; x += 5) {
          const X = x * S;
          const Yb = Math.round((7168 - fenceU(x)) * S);
          const open = Math.abs(x - 100) < 6;
          if (!open) for (let j = 0; j < 10; j++) img.px(X, Yb - j, 0x7a7670);
          if (last && !open) for (const h of [4, 9]) img.linePx(last[0], last[1] - h, X, Yb - h, 0xc8c4bc, 0.7);
          last = open ? null : [X, Yb];
        }
        // the signs, in yellow, hazard red and black
        for (const x of [14, 42, 70, 128, 158]) {
          const X = x * S;
          const Yb = Math.round((7168 - fenceU(x)) * S);
          for (let j = 0; j < 12; j++) for (let i = 0; i < 18; i++) img.px(X + i - 9, Yb - 16 + j, j < 3 ? 0xc8301a : j > 10 ? 0x2a2a2e : hashPx(i >> 1, j >> 1, 5413) < 0.34 ? 0x1a1a1e : 0xe8c030);
        }
        // the gate's boom, lowered, red and white
        const GX = 94 * S;
        const Gy = Math.round((7168 - fenceU(94)) * S);
        for (let i = 0; i < 36; i++) for (let j = 0; j < 2; j++) img.px(GX + i, Gy - 8 + j, (i >> 2) % 2 ? 0xd83a2a : 0xf0ece0);
        for (let j = 0; j < 10; j++) img.px(GX, Gy - j, 0x3a3a3e);
      },
    });
    // the old shelter by the track
    objects.push({
      y: Y(6256),
      shadow: () => k.shadowEllipse(112, Y(6256), 8, 3, 0.5),
      draw: () => {
        const X = 110 * S;
        const Yb = Y(6256) * S;
        for (let j = 0; j < 21; j++) {
          const hw = Math.sqrt(Math.max(0, 1 - (j / 21) ** 2)) * 24;
          for (let i = -hw; i <= hw; i++) img.px(X + i, Yb - j, hashPx(i >> 1, j >> 1, 5414) < 0.14 ? 0x5a5650 : i < -hw * 0.4 ? 0xa8a49c : i < hw * 0.5 ? 0x8a867e : 0x5e5a54);
        }
        for (let j = 0; j < 10; j++) {
          const hw = Math.sqrt(Math.max(0, 1 - (j / 10) ** 2)) * 8;
          for (let i = -hw; i <= hw; i++) img.px(X + i, Yb - j, 0x0e0e12);
        }
      },
    });
    k.reserve(100, Y(6264), 24, 12);
    // the station: a gravel square inside its own fence, the hut, the mast with its guy wires, a dome, solar panels
    const sx = 134;
    const su = 6318;
    img.fine(sx, Y(su + 36), 30, 36, (X, Yy, x, y) => {
      const e = Math.min(x - sx, sx + 30 - x, y - Y(su + 36), Y(su) - y);
      if (e < 0.7) return (X + Yy) % 6 < 3 ? 0x9a968e : 0x4a4640;
      return rampColor(ASH, 0.3 + hashPx(X >> 1, Yy >> 1, 5415) * 0.5, X, Yy);
    });
    k.reserve(sx, Y(su + 36), 30, 36);
    k.house(sx + 3, Y(su + 32), 14, 8, 6, 'block', { roofC: 0x6a6e74, wall: 0xc8c4bc, plainRoof: false, shop: false, reserve: false });
    objects.push({
      y: Y(su + 10),
      shadow: () => k.shadowRect(sx + 18, Y(su + 12), 10, 3, 0.5),
      draw: () => {
        // the mast and its guys
        const X = (sx + 24) * S;
        const Yb = Y(su + 14) * S;
        for (let j = 0; j < 72; j++) {
          img.px(X - 1, Yb - j, 0xc8ccd0);
          img.px(X + 1, Yb - j, 0x6a6e74);
          if (j % 6 === 0) img.linePx(X - 1, Yb - j, X + 1, Yb - j - 6, 0x8a8e94);
        }
        for (const s of [-1, 1]) img.linePx(X, Yb - 60, X + s * 24, Yb + 6, 0x8a8e94, 0.55);
        for (let i = -6; i <= 6; i++) img.px(X + i, Yb - 66, 0xc8ccd0);
        // the white dome of the GPS, on a post
        const DX = (sx + 8) * S;
        const DY = Y(su + 8) * S;
        for (let j = 0; j < 6; j++) img.px(DX, DY - j, 0x6a6e74);
        for (let j = -7; j <= 0; j++) for (let i = -7; i <= 7; i++) if (i * i + j * j < 50) img.px(DX + i, DY - 6 + j, i + j < -5 ? 0xffffff : i > 3 ? 0xb8bcc0 : 0xe8ecec);
        // the panels
        const PX = (sx + 14) * S;
        const PY = Y(su + 7) * S;
        for (let q = 0; q < 2; q++) for (let j = 0; j < 12; j++) for (let i = 0; i < 18; i++) img.px(PX + q * 21 + i, PY + j - (i >> 3), j % 4 === 0 || i % 6 === 0 ? 0x5a6a7a : 0x1e3a5a);
      },
    });
    const beacon = [k.sprite(5, 5, su, (r) => {
      r.discPx(7, 7, 7, 0xff5040, 0.28);
      r.discPx(7, 7, 2.2, 0xffd0c0);
    }, false)];
    kit.loop(sx + 22, su + 40, beacon, { fps: 1, seq: [0, -1, -1, -1], fx: 1 });
    k.standing(sx + 6, Y(su + 14), 8, 4, 2, 5416, [0xe8e8e0, 0xf0a020]);
  }
  // burnt snags: what's left of the forests the ash has killed, bare and silver-black, in stands
  for (let q = 0; q < 16; q++) {
    const cx = R() * W;
    const cu = 6130 + R() * 460;
    const n = 3 + R.int(0, 6);
    for (let i = 0; i < n; i++) {
      const x = cx + (R() - 0.5) * 26;
      const u = cu + (R() - 0.5) * 20;
      if (k.isRes(x, Y(u))) continue;
      const h = 15 + R() * 21;
      const lean = (R() - 0.5) * 0.3;
      const seed2 = q * 31 + i;
      objects.push({
        y: Y(u),
        shadow: () => {
          for (let j = 0; j < 15; j++) img.tintPx(x * S + j, Y(u) * S + 1 + (j >> 1), 0.68);
        },
        draw: () => {
          const X = x * S;
          const Yb = Y(u) * S;
          for (let j = 0; j < h; j++) {
            const w0 = j < h * 0.3 ? 1 : 0;
            for (let s = -w0; s <= w0 + 1; s++) img.px(X + lean * j + s, Yb - j, s < 0 || (w0 === 0 && s === 0) ? 0x6e6660 : 0x1e1a1a);
          }
          for (let b = 0; b < 4; b++) {
            const j0 = h * (0.45 + b * 0.13);
            const dir = b % 2 ? 1 : -1;
            const len = 4 + hashPx(b, seed2, 5417) * 7;
            img.linePx(Math.round(X + lean * j0), Math.round(Yb - j0), Math.round(X + lean * j0 + dir * len), Math.round(Yb - j0 - len * 0.7), 0x2e2826);
          }
        },
      });
    }
  }
  // bomb craters: blown out of the ash with a pale rim of what they threw up, the rock lying cracked in the middle
  for (let q = 0; q < 54; q++) {
    const x = R() * W;
    const u = 6280 + R() * 720;
    if (k.isRes(x, Y(u))) continue;
    const r = 2.6 + R() * R() * 6;
    const cy = Y(u);
    const seed2 = 5420 + q;
    img.fine(x - r * 1.9, cy - r * 1.5, r * 3.8, r * 3, (X, Yy, xx, yy) => {
      const d = Math.hypot(xx - x, (yy - cy) * 1.25);
      const ang = Math.atan2(yy - cy, xx - x);
      if (d < r * 0.72) {
        // the pit: its far (upper) wall lit, its near wall in shadow
        return rampColor(ROCK, 0.08 + ((cy - yy) / r) * -0.2 + 0.1 + hashPx(X >> 1, Yy >> 1, seed2) * 0.14, X, Yy);
      }
      if (d < r * (0.86 + fbm(xx, yy, { seed: seed2, scale: 3, octaves: 2 }) * 0.4)) return hashPx(X >> 2, Yy >> 2, seed2 + 2) < 0.2 ? null : rampColor(ASH, 0.22 + Math.sin(ang) * 0.24 + hashPx(X >> 1, Yy >> 1, seed2) * 0.2, X, Yy);
      const ray = Math.abs(Math.sin(ang * 5 + q));
      if (d < r * 1.8 && hashPx(X >> 1, Yy >> 1, seed2 + 1) < (1 - (d - r) / (r * 0.8)) * 0.6 * ray) return rampColor(ASH, 0.15 + hashPx(X, Yy, seed2) * 0.3, X, Yy);
      return null;
    });
    if (q % 5 === 0) k.rockPx((x + 1) * S, cy * S + 2, r * 0.7 + 0.6, ROCK, q);
  }
  // fumaroles: crusts of sulphur, dull yellow, round a vent breathing steam
  for (let q = 0; q < 13; q++) {
    const x = 8 + R() * (W - 16);
    const u = 6260 + R() * 640;
    if (k.isRes(x, Y(u))) continue;
    const seed2 = 5500 + q;
    const rx = 5 + R() * 7;
    const ry = 3.4 + R() * 4;
    const cy = Y(u);
    img.fine(x - rx, cy - ry, rx * 2, ry * 2, (X, Yy, xx, yy) => {
      const e = ((xx - x) / rx) ** 2 + ((yy - cy) / ry) ** 2 + (fbm(xx, yy, { seed: seed2, scale: 3, octaves: 2 }) - 0.5) * 0.9;
      if (e > 1) return null;
      if (e < 0.05) return 0x2a2422;
      if (hashPx(X, Yy, seed2) > 1.2 - e) return null;
      return e < 0.4 ? (hashPx(X >> 1, Yy >> 1, seed2 + 1) < 0.5 ? 0xc8ba6e : 0xa89c58) : hashPx(X >> 1, Yy >> 1, seed2 + 1) < 0.5 ? 0x8a8250 : 0x6e6a48;
    });
    kit.emit(Math.round(x), u + 1, vapour, { rate: 0.8, life: [2.2, 3.2], vy: 6, sx: 1, wf: 1, a: 0.34, tint: 1 });
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
        const lean = (b - 7) * 0.09 + 0.14;
        const h = 13 + hashPx(b, q, 5407) * 9;
        for (let j = 0; j < h; j++) {
          const t = j / h;
          img.px(X + (b - 7) * 0.5 + lean * j * (0.4 + t * 0.9), Yy - j * (1 - t * 0.1), t > 0.74 ? 0xf0e4bc : t > 0.4 ? 0xb8a87a : 0x7a7a50);
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
