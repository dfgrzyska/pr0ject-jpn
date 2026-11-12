// North of Naha: Shuri castle on its hill, the pine-lined stone approach, Shureimon, Sonohyan-utaki's stone gate, Ryūtan pond with its
// ducks, the curved limestone walls, Kankaimon, the red-and-white courtyard and the great Seiden. Then the Yanbaru forest with its road,
// kuina, the Hiji falls and the suspension footbridge; and the Kōri bridge over the emerald shallows to Kōri island, its cane, its
// shrimp wagon, its beach and the Heart Rocks.
import { S, hashPx, scaleColor, rampColor, rng, fbm, mix } from '../nagasaki/canvas.mjs';
import { puff } from '../props.mjs';
import { W, NAHA, ROAD, JUNGLE, FOREST0, BRIDGE, ISLAND_ROAD, roadX, isWater, landD } from './geo.mjs';
import { C, KURO } from './common.mjs';

const STONE = [0x7e786a, 0x9a9482, 0xb2ac98, 0xcac4ae];
const PINE = [0x1a3024, 0x28442c, 0x3a5a36, 0x527040];

export function paintShuri(k) {
  const { img, Y, kit, objects, glowPx } = k;
  const { plant, house, wall, tileRoof } = k.t;
  const R = rng(3200);
  const flagged = (X, Yy) => {
    const row = Math.floor(Yy / 15);
    const xx = X + (row % 2) * 9;
    if (Yy % 15 < 1 || xx % 18 < 1) return STONE[0];
    return rampColor(STONE, 0.5 + hashPx(xx >> 4, row, 54) * 0.35, X, Yy);
  };
  // the approach from where Kokusai-dōri ends, up to the gateway
  k.road([[90.5, NAHA[1]], [90.5, 3518]], 5, { side: 0, kerb: STONE[0], paint: flagged, piece: true });
  // pines down both sides, a low stone kerb, lanterns
  for (let u = NAHA[1] + 10; u < 3500; u += 15) for (const s of [-1, 1]) if (!k.anyRes(90.5 + s * 8 - 2, Y(u) - 2, 4, 4)) k.tree(90.5 + s * (8 + hashPx(u, s + 2, 55) * 2), Y(u), 4.2 + hashPx(u, s + 3, 55) * 1.6, PINE, u + s, 'tropic');
  for (let u = NAHA[1] + 22; u < 3500; u += 45) for (const s of [-1, 1]) k.stoneLantern(90.5 + s * 6.4, u, false);
  k.walkers([[88, NAHA[1] + 6], [88, 3510]], 7, 3350, { sp: 2.6, gap: 38 });
  k.walkers([[93, 3510], [93, NAHA[1] + 6]], 6, 3350, { sp: 2.6, gap: 42, cols: [0xf0d030, 0xf0d030, 0xe8e8f0] });
  // Shureimon: its gate of honour, two tiers of red tile on vermilion posts, the gold tablet, the crowd taking pictures
  {
    const gx = 76;
    const gy = Y(3300);
    img.fine(66, gy + 8, 50, 30, (X, Yy) => flagged(X, Yy));
    k.reserve(66, gy + 8, 50, 30);
    objects.push({
      y: gy + 14,
      shadow: () => k.shadowRect(gx + 3, gy + 4, 30, 12, 0.5),
      draw: () => {
        for (const px of [2, 9, 18, 25]) for (let j = 0; j < 15; j++) for (let i = 0; i < 6; i++) img.px((gx + px) * S + i, (gy + 9) * S + j, j > 11 ? STONE[3] : i < 2 ? C.shuri[3] : i > 4 ? C.shuri[0] : C.shuri[2]);
        tileRoof(gx, gy + 4, 28, 6, { shisa: false, seed: 3301 });
        tileRoof(gx + 4, gy, 20, 5, { shisa: false, seed: 3302 });
        const X = (gx + 11) * S;
        for (let j = 0; j < 6; j++) for (let i = 0; i < 18; i++) img.px(X + i, (gy + 3) * S + j, j === 0 || j === 5 ? 0x5a3a14 : (i >> 1) % 3 ? C.gold : 0x8a2a1a);
      },
    });
    k.reserve(gx - 2, gy - 2, 34, 20);
    k.crowd(68, gy + 16, 46, 16, 22);
  }
  // Sonohyan-utaki's stone gate, a sacred grove behind it
  {
    const x = 112;
    const u = 3452;
    objects.push({
      y: Y(u) + 1,
      shadow: () => k.shadowRect(x + 2, Y(u) - 5, 18, 6, 0.5),
      draw: () => {
        const X = x * S;
        const Yb = Y(u) * S;
        for (let j = 0; j < 21; j++) for (let i = 0; i < 54; i++) {
          const door = i > 20 && i < 34 && j < 15;
          img.px(X + i, Yb - j, door ? (i === 27 ? 0x14100c : 0x3a2418) : j % 6 < 1 || (i + (j >> 3) * 6) % 15 < 1 ? STONE[0] : i > 50 ? STONE[1] : STONE[2]);
        }
        for (let j = 21; j < 27; j++) for (let i = -3; i < 57; i++) img.px(X + i, Yb - j, j > 25 ? STONE[3] : (i >> 1) % 3 ? STONE[1] : STONE[2]);
      },
    });
    k.reserve(x, Y(u) - 9, 19, 10);
    k.road([[96, u - 8], [x + 9, u - 8]], 1.2, { side: 0, kerb: STONE[0], paint: flagged, piece: true });
    k.forest(108, 136, u, u + 34, [KURO, PINE], 3453, 4, 6);
  }
  // Ryūtan, the dragon's pond under the castle's walls: a stone rim, lotus, ducks, a little arched bridge
  {
    const cx = 34;
    const cu = 3388;
    const eAt = (x, u) => ((x - cx) / 25) ** 2 + ((u - cu) / 24) ** 2 + (fbm(x, u, { seed: 3389, scale: 9, octaves: 2 }) - 0.5) * 0.3;
    img.fine(cx - 29, Y(cu + 28), 58, 56, (X, Yy, x, y) => {
      const e = eAt(x, 7168 - y);
      if (e > 1.12) return null;
      if (e > 1) return hashPx(X >> 2, Yy >> 2, 3390) < 0.5 ? STONE[3] : STONE[1];
      const c = rampColor([0x123a40, 0x1e4c50, 0x2a6060, 0x3a7470], 0.2 + fbm(x, y, { seed: 3391, scale: 5 }) * 0.5 + (1 - e) * 0.15, X, Yy);
      return hashPx(X >> 1, Yy, 3392) > 0.985 ? 0xb8dcd8 : c;
    });
    k.reserve(cx - 29, Y(cu + 28), 58, 56);
    for (let q = 0; q < 36; q++) {
      const x = cx - 22 + R() * 44;
      const u = cu - 20 + R() * 40;
      if (eAt(x, u) > 0.8) continue;
      img.discPx(x * S, Y(u) * S, 3, 0x3a7a4a);
      img.px(x * S - 1, Y(u) * S - 1, 0x6aaa6a);
      if (q % 3 === 0) img.discPx(x * S + 1, Y(u) * S, 1, 0xf4b0c8);
    }
    const duck = [0, 1].map((f) => k.sprite(4, 3, cu, (r) => {
      for (let i = 1; i < 8; i++) for (let j = 3; j < 6; j++) r.px(i, j, j < 4 ? 0xf0ece0 : 0xc8c4b8);
      r.discPx(9, 3 + f * 0.4, 1.6, 0x2a6a4a);
      r.px(11, 3, 0xe8a020);
    }, false));
    kit.wander(cx, cu, 16, 12, duck, { n: 4, sp: 2, turn: 'rot', fps: 1.5, idle: 0.3 });
    k.bench(cx + 26, Y(cu - 10), 4);
    k.strollers(cx + 30, cu - 18, 6, 22, 3);
  }
  // the castle's walls: curved limestone, two rings, open where the approach passes through; the crown of each catches the sun
  for (const [rx, ry, a0, a1] of [[90, 120, -2.9, -0.25], [90, 96, -2.7, -0.45]]) {
    const cy = Y(3420);
    const sides = [[], []];
    for (let a = a0; a <= a1; a += 0.03) {
      const x = 90 + Math.cos(a) * rx * 0.62;
      if (Math.abs(x - 90) >= 9) sides[x < 90 ? 0 : 1].push([x, cy + Math.sin(a) * ry * 0.9]);
    }
    for (const pts of sides) {
      wall(pts, 3.4);
      const low = pts.reduce((a, b) => (b[1] > a[1] ? b : a));
      objects.push({
        y: low[1] + 5,
        shadow: () => k.shadowEllipse(low[0] + 3, low[1] + 3, 6, 4, 0.55),
        draw: () => {
          const X = low[0] * S;
          const Yy = low[1] * S;
          for (let j = 0; j < 9; j++) for (let i = -15; i <= 15; i++) if ((i / 15) ** 2 < 1) img.px(X + i, Yy + 3 + j, (i + j * 3) % 7 === 0 ? STONE[0] : i > 9 ? STONE[1] : STONE[2]);
          for (let j = -11; j <= 11; j++) for (let i = -15; i <= 15; i++) if ((i / 15) ** 2 + (j / 11) ** 2 < 1) img.px(X + i, Yy + j, (i / 15) ** 2 + (j / 11) ** 2 > 0.7 ? STONE[3] : k.settPx(X + i, Yy + j, 3404, C.coral));
        },
      });
      k.reserve(low[0] - 6, low[1] - 5, 12, 10);
    }
  }
  // Kankaimon, over the gateway in the walls: a tiled tower, stone below, the arch dark
  {
    const ty = Y(3512);
    objects.push({
      y: ty + 8,
      shadow: () => k.shadowRect(83, ty + 3, 20, 7, 0.5),
      draw: () => {
        tileRoof(80, ty - 1, 20, 7, { shisa: true, seed: 3512 });
        for (let j = 0; j < 15; j++) for (let i = 0; i < 60; i++) {
          const arch = Math.abs(i - 30) < 12 && j > 2;
          img.px(240 + i, (ty + 6) * S + j, arch ? 0x1a100c : j % 5 === 0 || (i + (j >> 2) * 6) % 12 === 0 ? STONE[0] : STONE[2]);
        }
      },
    });
    k.reserve(79, ty - 2, 22, 13);
  }
  // Una, the courtyard: red and white striped tiles, its stone apron; the banners on their poles
  const cyTop = Y(3600);
  img.fine(42, Y(3636), 96, cyTop + 84 - Y(3636), (X, Yy) => flagged(X, Yy));
  img.fine(62, cyTop, 56, 40, (X, Yy, x) => {
    const q = Math.floor((x - 62) / 2) % 2;
    const c = q ? 0xd8cfc0 : 0xb8503a;
    return hashPx(X >> 1, Yy >> 1, 3601) < 0.1 ? scaleColor(c, 0.9) : Yy % 9 === 0 ? scaleColor(c, 0.92) : c;
  });
  k.reserve(40, Y(3638), 100, Y(3514) - Y(3638));
  for (const [bx, c1, c2] of [[50, 0xe8c030, 0xc8302a], [128, 0xc8302a, 0xe8c030]])
    for (const by of [cyTop + 6, cyTop + 60]) {
      const flag = [0, 1, 2].map((f) => k.sprite(6, 12, 3560, (r) => {
        for (let j = 0; j < 36; j++) for (let i = 0; i < 2; i++) r.px(i, j, i ? 0x2a1c14 : 0x6a4c34);
        for (let j = 3; j < 27; j++) {
          const wv = f === 0 ? 0 : Math.round(Math.sin(j * 0.27 + f * 1.7) * 2);
          for (let i = 2; i < 13; i++) r.px(i, j + (i > 8 ? wv : 0), j < 9 ? c2 : c1);
        }
      }));
      kit.loop(bx, 7168 - (by - 10), flag, { seq: [0, 1, 2, 1], fps: 3.5 });
    }
  k.crowd(60, cyTop + 4, 60, 36, 22);
  k.crowd(62, cyTop + 50, 56, 22, 10);
  // the side halls, Hokuden and Nanden
  house(18, Y(3560), 24, 16, { shisa: false, wall: C.shuri[2], faceH: 5 });
  house(138, Y(3560), 24, 16, { shisa: false, wall: C.shuri[2], faceH: 5 });
  // Hōshinmon, the three-doored gate into the courtyard
  objects.push({
    y: Y(3552),
    shadow: () => k.shadowRect(66, Y(3552) - 7, 50, 8, 0.5),
    draw: () => {
      const X0 = 62 * S;
      const Yb = Y(3552) * S;
      for (let j = 0; j < 15; j++)
        for (let i = 0; i < 168; i++) {
          const b = i % 56;
          const door = b > 16 && b < 40 && j < 12;
          img.px(X0 + i, Yb - j, door ? 0x2a1410 : j < 2 ? STONE[2] : (i >> 3) % 2 ? C.shuri[2] : C.shuri[1]);
        }
      tileRoof(61, Y(3552) - 10, 58, 6, { shisa: false, seed: 3523 });
    },
  });
  // the Seiden: the great two-tier roof, its karahafu gable over the steps, gilded dragons, vermilion walls, the great stair and its dragon pillars
  {
    const sx = 40;
    const sy = Y(3680);
    objects.push({
      y: sy + 46,
      shadow: () => k.shadowRect(sx + 5, sy + 6, 100, 46, 0.5),
      draw: () => {
        tileRoof(sx, sy + 12, 100, 22, { shisa: false, seed: 3681 });
        tileRoof(sx + 14, sy, 72, 16, { shisa: false, seed: 3682 });
        // the ridge's dragon heads, gold
        const RY = sy * S + Math.round(16 * S * 0.42);
        for (const X of [(sx + 22) * S, (sx + 78) * S]) {
          for (let j = 0; j < 15; j++) for (let i = -4; i <= 4; i++) if (Math.abs(i) + j * 0.3 < 5) img.px(X + i, RY - j, (i + j) % 3 === 0 ? 0x9a6a14 : C.gold);
          img.discPx(X, RY - 16, 2.6, 0xfff0a0);
        }
        for (let i = -18; i <= 18; i++) for (let j = -3; j <= 3; j++) if (Math.abs(i) < 18 - Math.abs(j) * 2) img.px((sx + 50) * S + i, RY + j, (i + 40) % 5 === 0 ? 0x9a6a14 : C.gold);
        // vermilion walls with their columns, the deep shadow under the eaves, gold-framed lattices
        const FY = (sy + 34) * S;
        for (let j = 0; j < 36; j++)
          for (let i = 6; i < 294; i++) {
            const b = (i - 6) % 24;
            let c = j < 3 ? 0x24100c : b < 5 ? (b < 2 ? C.shuri[3] : C.shuri[0]) : j < 18 ? (j % 6 === 3 ? C.gold : C.shuri[2]) : C.shuri[1];
            if (b >= 5 && j > 5 && j < 30 && (i + j) % 6 < 2) c = scaleColor(c, 0.74);
            img.px(sx * S + i, FY + j, c);
          }
        // the karahafu gable over the entrance
        const GX = (sx + 50) * S;
        const GY = (sy + 16) * S;
        for (let j = 0; j < 36; j++) {
          const hw = 42 - Math.abs(j - 16) * 0.6 - (j < 16 ? (16 - j) * 1.2 : 0);
          for (let i = -hw; i <= hw; i++) img.px(GX + i, GY + j, j > 32 ? C.tile[0] : (i + 90) % 4 === 3 ? mix(C.tile[2], C.mortar, 0.6) : j < 16 ? C.tile[3] : C.tile[1]);
        }
        for (let i = -15; i <= 15; i++) for (let j = 0; j < 12; j++) img.px(GX + i, GY + 36 + j, j < 2 ? 0x5a3a14 : (i + 40) % 7 === 0 ? 0x9a6a14 : C.gold);
        // the doors, the great stairs, the dragon pillars
        for (let j = 0; j < 24; j++) for (let i = -18; i <= 18; i++) img.px(GX + i, FY + 12 + j, Math.abs(i) < 3 ? 0x1a100c : (i + 40) % 9 < 1 ? C.shuri[0] : C.gold);
        for (let j = 0; j < 21; j++) for (let i = -21 - j * 0.2; i <= 21 + j * 0.2; i++) img.px(GX + i, FY + 36 + j, j % 4 === 0 ? STONE[0] : j % 4 === 1 ? STONE[3] : STONE[2]);
        for (const s of [-1, 1]) {
          const X = GX + s * 27;
          for (let j = 0; j < 30; j++) for (let i = -2; i <= 2; i++) img.px(X + i, FY + 33 + 21 - j, (i + j) % 4 === 0 ? 0x4a5a48 : STONE[1]);
          glowPx(X, FY + 22, 0xfff0c0, 0.9);
        }
      },
    });
    k.reserve(sx - 2, sy - 2, 104, 54);
    k.crowd(70, sy + 54, 40, 10, 12);
  }
  // the gardens and walls behind the palace
  k.forest(8, 172, 3692, 3845, [KURO, PINE, Object.assign([0x1c4a22, 0x2f7a2e, 0x52a83a, 0x9ad25a], { kind: 'tropic' })], 3690, 4.2, 7);
  void plant;
  void isWater;
  void JUNGLE;
}

export function paintYanbaru(k) {
  const { img, Y, kit, objects } = k;
  const { wall } = k.t;
  const yr = rng(2207);
  // the stream: from the hills off the west edge, over the falls, down to the sea at the cliffs
  const STREAM = [[-6, 4590], [10, 4566], [22, 4540], [30, 4522], [30, 4504], [40, 4482], [54, 4452], [68, 4426], [86, 4398], [104, 4368], [116, 4344], [128, 4326]];
  const FALL = [4522, 4506];
  const WATER = [0x24666e, 0x34848a, 0x4c9e9c, 0x78c0b8];
  for (const pass of [0, 1])
    for (let i = 0; i < STREAM.length - 1; i++) {
      const [ax, au] = STREAM[i];
      const [bx, bu] = STREAM[i + 1];
      const n = Math.ceil(Math.hypot(bx - ax, bu - au) * 1.5);
      for (let q = 0; q <= n; q++) {
        const x = ax + ((bx - ax) * q) / n;
        const u = au + ((bu - au) * q) / n;
        const w0 = 2.3 + (i / STREAM.length) * 1.6;
        img.fine(x - w0 - 2, Y(u) - w0 - 2, (w0 + 2) * 2, (w0 + 2) * 2, (X, Yy, xx, yy) => {
          const d = Math.hypot(xx - x, yy - Y(u));
          if (landD(xx, 7168 - yy) < 5) return null;
          if (pass && d < w0) return hashPx(X >> 1, Yy >> 1, 61) > 0.84 ? 0xe0f2ee : rampColor(WATER, 0.2 + hashPx(X >> 2, Yy >> 1, 62) * 0.7, X, Yy);
          if (!pass && d < w0 + 1.6) return hashPx(X >> 2, Yy >> 2, 63) > 0.66 ? rampColor(C.rock, 0.55, X, Yy) : 0x2c3a22;
          return null;
        });
        if (pass) k.reserve(x - w0 - 1, Y(u) - w0 - 1, w0 * 2 + 2, w0 * 2 + 2);
      }
    }
  // the rock step across the gorge, layers of limestone streaked with moss; the pool, rimmed with rock
  img.fine(8, Y(FALL[0] + 7), 46, FALL[0] + 7 - FALL[1] + 6, (X, Yy, x, y) => {
    const half = 22 - Math.abs(x - 30);
    if (half < 0) return null;
    const u = 7168 - y;
    const lip = FALL[0] + (fbm(x, 0, { seed: 64, scale: 4 }) - 0.5) * 4 + Math.min(4, half * 0.4);
    const foot = FALL[1] + (fbm(x, 9, { seed: 64, scale: 3 }) - 0.5) * 3;
    if (u > lip || u < foot) return null;
    const f = (u - foot) / Math.max(1, lip - foot);
    let c = rampColor(C.rock, 0.1 + f * 0.75 + (hashPx(X >> 1, Yy >> 1, 65) - 0.5) * 0.35, X, Yy);
    if (Yy % 12 < 2 && f < 0.9) c = scaleColor(c, 0.75);
    if (fbm(x, y, { seed: 66, scale: 3 }) > 0.64) c = rampColor(C.scrub, 0.3 + f * 0.5, X, Yy);
    return c;
  });
  img.fine(16, Y(FALL[1] + 1), 32, 18, (X, Yy, x, y) => {
    const n = (fbm(x, y, { seed: 67, scale: 4 }) - 0.5) * 0.5;
    const d = ((x - 31) / 10.5) ** 2 + ((y - Y(FALL[1] - 6)) / 7) ** 2 + n;
    if (d >= 1) return null;
    return d > 0.86 ? rampColor(C.rock, 0.3 + hashPx(X >> 1, Yy >> 1, 68) * 0.4, X, Yy) : rampColor([0x14424e, 0x1e5a66, 0x2c7078, 0x4a9696], 0.1 + (1 - d) * 0.55 + hashPx(X >> 2, Yy >> 1, 69) * 0.25, X, Yy);
  });
  k.reserve(10, Y(FALL[0] + 6), 42, 36);
  {
    // the falls, pouring; the spray, the ripples in the pool
    const fh = FALL[0] + 1 - (FALL[1] - 1);
    const frames = [0, 1, 2].map((f) => k.sprite(6, fh, 4514, (r) => {
      for (let j = 0; j < fh * S; j++)
        for (let i = 0; i < 18; i++) {
          const streak = (j + f * 9 + i * 5) % 21;
          const edge = i < 3 || i > 14;
          if (edge && (j + i + f) % 7 < 3) continue;
          r.px(i, j, streak < 6 ? 0xffffff : edge ? 0xa8d8dc : 0xd8f0f2, edge ? 0.8 : 1);
        }
    }, false));
    kit.loop(28, FALL[0] + 1, frames, { fps: 9 });
    const spray = [9, 12, 15].map((r) => [0, 1].map((v) => kit.frame(puff(r, r * 7 + v + 31, [0xc8dcdc, 0xdcecec, 0xeef8f8, 0xffffff]))));
    kit.emit(31, FALL[1] - 3, spray, { rate: 2.2, life: [0.9, 1.6], vy: 5, sx: 4, wf: 0.4, a: 0.55 });
    const ripple = [9, 15, 21].map((r) => k.sprite(r / 1.5 + 2, r / 3 + 2, 4500, (q) => {
      for (let a = 0; a < 6.3; a += 0.05) q.px(r + 3 + Math.cos(a) * r, r / 2 + 3 + Math.sin(a) * r * 0.5, 0xe8f6f6, 0.6);
    }));
    kit.spot([[25, FALL[1] - 2, 12, 6]], ripple, { rate: 1.6, fps: 5, a: 0.8 });
  }
  // the road: asphalt with white edge lines, red earth on its verges; a concrete bridge over the stream, kuina warning signs
  const pts = [];
  for (let u = ROAD[0]; u <= ROAD[1] + 12; u += 8) pts.push([roadX(u), u]);
  for (let q = 0; q < pts.length - 1; q += 12) k.road(pts.slice(q, q + 14), 3.2, { side: 1, lanes: true, pave: C.redEarth, piece: true });
  {
    const bu = 4419;
    const bx = roadX(bu);
    for (const dx of [-5, 4.6]) img.fine(bx + dx, Y(bu + 5), 1, 10, (X, Yy) => (Yy % 6 === 0 ? 0x8a887f : 0xe0ded6));
  }
  for (const [u, side] of [[4290, -1], [4560, 1], [4410, -1]]) {
    const x = roadX(u) + side * 6.6;
    objects.push({
      y: Y(u) + 1,
      draw: () => {
        const X = Math.round(x * S);
        const Yb = Y(u) * S;
        for (let j = 0; j < 9; j++) img.px(X, Yb - j, 0x5a5e66);
        for (let j = -5; j <= 5; j++) for (let i = -5 + Math.abs(j); i <= 5 - Math.abs(j); i++) img.px(X + i, Yb - 14 + j, Math.abs(i) + Math.abs(j) > 3 ? 0x1a1a14 : 0xf0c818);
        img.rectPx(X - 1, Yb - 15, 3, 3, 0x1a1a14);
        img.px(X + 2, Yb - 15, 0xd8302a);
      },
    });
    k.reserve(x - 2, Y(u) - 6, 5, 7);
  }
  // a roadside stall with bananas and a rest stop at the forest's foot, the road's lay-by
  {
    const x = roadX(4350) + 7;
    const u = 4350;
    img.fine(x, Y(u + 12), 30, 16, (X, Yy) => k.asphaltPx(X, Yy));
    k.reserve(x, Y(u + 12), 30, 16);
    k.t.house(x + 3, Y(u + 11), 22, 7, { faceH: 3.6, reserve: false, shisa: true, seed: 4041 });
    k.t.parked(x + 2, Y(u - 2), 0xe8e8ec);
    k.t.parked(x + 10, Y(u - 2), 0x3a609c);
    k.t.parked(x + 18, Y(u - 2), 0xc43a30);
    for (let q = 0; q < 5; q++) for (let j = 0; j < 9; j++) for (let i = 0; i < 6; i++) img.px((x + 5 + q * 3) * S + i, (Y(u + 3)) * S + j, hashPx(i, j + q, 4042) < 0.6 ? 0xf0d040 : 0x8ab83a);
    k.standing(x + 4, Y(u + 3) - 2, 18, 4, 4, 4043, undefined);
  }
  // the trail from the road to the falls: over the stream on a suspension footbridge, to a viewing deck
  const trail = [[roadX(4470) - 4, 4470], [60, 4471], [52, 4473]];
  const trail2 = [[41, 4475], [38, 4476], [24, 4490], [16, 4500]];
  for (const t of [trail, trail2]) k.road(t, 1.2, { side: 0, kerb: 0x5a4a30, piece: true, paint: (X, Yy) => (hashPx(X >> 2, Yy >> 2, 70) < 0.5 ? 0x8a6a44 : 0x7a5e3a) });
  {
    const X0 = 52 * S;
    const X1 = 41 * S;
    for (let q = 0; q <= 33; q++) {
      const X = X0 + ((X1 - X0) * q) / 33;
      const Yy = Y(4473) * S + (q / 33) * 6 + Math.sin((q / 33) * Math.PI) * 3;
      for (let j = -3; j <= 3; j++) img.px(X, Yy + j, Math.abs(j) === 3 ? 0xc83a2a : q % 3 ? 0xb08a58 : 0x8a6a40);
      img.tintPx(X + 2, Yy + 9, 0.6);
    }
    // the deck
    img.fine(12, Y(4502), 7, 5, (X, Yy) => (Yy % 6 < 1 ? 0x6a5034 : (X >> 2) % 2 ? 0x9a7a4a : 0xb89a68));
    k.reserve(11, Y(4503), 9, 7);
    k.standing(13, Y(4502), 5, 3, 3, 4503, undefined);
    k.walkers(trail, 1, 4470, { sp: 2, gap: 30 });
  }
  // the forest: dense chinquapin, its pale cauliflower crowns breaking the green; tree ferns, palms
  const ITAJI = Object.assign([0x4a6a2a, 0x7a8a3a, 0xa8a84a, 0xd0c868], { kind: 'tropic' });
  const TROPIC = Object.assign([0x1c4a22, 0x2f7a2e, 0x52a83a, 0x9ad25a], { kind: 'tropic' });
  const FERN = Object.assign([0x174222, 0x2a6a30, 0x48963c, 0x86c860], { kind: 'fern' });
  const DEEP = Object.assign([0x123a1c, 0x1e5a26, 0x348030, 0x5ca044], { kind: 'tropic' });
  k.forest(0, W, FOREST0 + 4, JUNGLE[1] + 14, [DEEP, TROPIC, TROPIC, DEEP, FERN, TROPIC, DEEP, ITAJI, TROPIC, FERN], 3851, 5, 8.5, (x, u) => landD(x, u) > 7 && Math.abs(x - roadX(u)) > 12.5 && k.pads.every((p) => Math.hypot(p.x - x, p.u - u) > 15));
  // kuina darting across the road, a flash of red bill
  const kuina = [0, 1].map((f) => k.sprite(5, 4, 4200, (r) => {
    for (let i = 0; i < 9; i++) for (let j = 1; j < 6; j++) r.px(i, j, j < 2 ? 0x5e5640 : 0x4a4434);
    for (let i = 3; i < 8; i++) r.px(i, 7, (i + 1) % 2 ? 0x2a2a2a : 0xe8e8e8);
    for (let i = 9; i < 14; i++) r.px(i, 2 + (i > 11 ? 1 : 0), 0xd8302a);
    r.rectPx(f ? 3 : 1, 8, 1, 3, 0xd8302a);
    r.rectPx(f ? 6 : 8, 8, 1, 3, 0xd8302a);
  }));
  for (const u of [4285, 4380, 4520]) kit.path([[roadX(u) - 8, u], [roadX(u) + 8, u + 3]], kuina, { sp: 7, mode: 'pp', hold: 4 + yr() * 4, turn: 'flip', fps: 8, s0: yr(), d: 0.45 });
  // mist drifting over the canopy
  const mist = [36, 45, 54].map((r, i) => kit.frame(puff(r, 71 + i * 13, [0xc8d4d0, 0xd8e2de, 0xe6eeea, 0xf4f8f6])));
  for (const [u, s0] of [[4310, 0.4], [4480, 0.9], [4600, 0.1]]) kit.path([[-40, u], [220, u + 20]], mist, { sp: 2.5, n: 2, gap: 130, turn: 'none', fps: 0.2, a: 0.32, d: 0.7, fx: 1, s0 });
  // birds over the forest
  void wall;
  void W;
  void mix;
}

export function paintKori(k) {
  const { img, Y, kit, objects } = k;
  const { house, flat, parked } = k.t;
  const kb = rng(2211);
  const [B0, B1] = BRIDGE;
  // the bridge: straight over the emerald shallows on its piers, two lanes and lamp posts, its shadow on the water
  for (let u = B0 + 14; u < B1 - 8; u += 34) {
    const CY = Y(u) * S;
    for (let a = 0; a < 6.3; a += 0.25) img.px(91 * S + Math.cos(a) * 21, CY + 15 + Math.sin(a) * 4, 0xd8f0f0, 0.35);
  }
  for (let Yy = Y(B1) * S; Yy < Y(B0) * S; Yy++) for (let i = 0; i < 12; i++) if (k.wetPx(97 * S + i, Yy)) img.px(97 * S + i, Yy, 0x0a1a2a, 0.3 - i * 0.02);
  img.fine(85.5, Y(B1), 11, B1 - B0, (X, Yy, x, y) => {
    const u = 7168 - y;
    const a = x - 91;
    if (Math.abs(a) > 5) return (Yy >> 1) % 6 < 1 ? 0x8a887f : 0xe4e2da;
    if (Math.abs(a) > 4.3) return 0x9a9890;
    if (Math.abs(a) < 0.25 && u % 8 < 4) return 0xe8e4d0;
    if (Math.abs(Math.abs(a) - 3.9) < 0.15) return 0xd8d4c8;
    return k.asphaltPx(X, Yy);
  });
  k.reserve(83, Y(B1 + 2), 17, B1 - B0 + 4);
  for (let u = B0 + 6; u < B1; u += 26) {
    for (const [x, dir] of [[85.7, 1], [96.2, -1]]) {
      const X = x * S;
      const Yb = Y(u) * S;
      for (let j = 0; j < 15; j++) img.px(X, Yb - j, 0x4a4a52);
      for (let i = 0; i < 6; i++) img.px(X + i * dir, Yb - 15, 0x4a4a52);
      img.rectPx(X + 5 * dir, Yb - 15, 2, 2, 0xfff0c0);
    }
  }
  // the island road, round to the parking by Tinu beach
  k.road(ISLAND_ROAD, 3, { side: 1, lanes: true, piece: true, pave: C.lane });
  const pk = [126, 5128, 26, 14];
  img.fine(pk[0], Y(pk[1] + pk[3]), pk[2], pk[3], (X, Yy) => (X % 15 < 2 ? 0xe0ded6 : k.asphaltPx(X, Yy)));
  k.reserve(pk[0] - 1, Y(pk[1] + pk[3]) - 1, pk[2] + 2, pk[3] + 2);
  parked(127, Y(pk[1] + pk[3]) + 1, 0xe8e8ec, true);
  parked(137, Y(pk[1] + pk[3]) + 1, 0xc43a30, true);
  parked(142, Y(pk[1] + pk[3]) + 1, 0x3a609c, true);
  // the shrimp wagon: a little red van, its awning and a queue; the sea-urchin shop; a trellis of bougainvillea by the road
  objects.push({
    y: Y(5098) + 1,
    shadow: () => k.shadowRect(127, Y(5098) - 6, 13, 7, 0.55),
    draw: () => {
      const X = 126 * S;
      const Yb = Y(5098) * S;
      for (let j = 0; j < 21; j++) for (let i = 0; i < 36; i++) img.px(X + i, Yb - j, j < 3 ? 0xf8f4ea : j > 18 ? 0x2a2a30 : i > 28 ? 0x3a5a7a : j > 6 && j < 15 && i > 4 && i < 26 ? 0xfff0c8 : 0xd83a2a);
      for (let i = -3; i < 30; i++) for (let j = 0; j < 6; j++) img.px(X + i, Yb - 9 + j, (i >> 2) % 2 ? 0xf0ece0 : 0xe8c030);
    },
  });
  k.reserve(125, Y(5098) - 8, 14, 9);
  k.crowd(126, Y(5098) + 2, 12, 4, 7);
  // red roofs round the road, each its own; cane patches behind
  const onLand = (x, u, w, h, d = 9) => [[x, u], [x + w, u], [x, u + h], [x + w, u + h]].every(([a, b]) => landD(a, b) > d);
  for (const [x, u, w, h] of [[120, 5052, 20, 12], [140, 5090, 16, 12], [80, 5060, 14, 10], [104, 5104, 12, 10], [150, 5116, 12, 8]]) {
    if (k.anyRes(x, Y(u + h), w, h) || !onLand(x, u, w, h, 7.5)) continue;
    img.fine(x, Y(u + h), w, h, (X, Yy) => {
      const col = (X - x * S) % 9;
      if (col < 2) return rampColor(C.redEarth, 0.3, X, Yy);
      const leaf = hashPx(X >> 1, Yy >> 2, 5075);
      return leaf < 0.14 ? C.cane[3] : leaf < 0.5 ? C.cane[2] : col < 5 ? C.cane[1] : C.cane[0];
    });
    k.reserve(x, Y(u + h), w, h);
  }
  let built = 0;
  for (let u = 5038; u < 5132 && built < 10; u += 5)
    for (let x = 70 + (u % 3) * 2; x < 170 && built < 10; x += 5) {
      const w = 12 + (x + u) % 3;
      if (k.anyRes(x - 2, Y(u + 13) - 2, w + 4, 17) || !onLand(x, u, w, 13, 7.5)) continue;
      if ((x + u) % 4 === 0) flat(x, Y(u + 12), w, 8, 3.4);
      else house(x, Y(u + 10), w, 8, { faceH: 3 });
      built++;
    }
  // the beach below the parking: umbrellas, a shower hut; Tinu's walkers
  for (const [x, u, c] of [[122, 5140, 0xe0402a], [156, 5136, 0x2a7ad0], [166, 5118, 0xf0b020], [112, 5122, 0x2aa060], [148, 5142, 0xe0402a]]) {
    if (landD(x, u) < 1.5 || landD(x, u) > 6) continue;
    const X = x * S;
    const Yy = Y(u) * S;
    for (let j = -8; j <= 8; j++) for (let i = -8; i <= 8; i++) if (i * i + j * j < 64) img.tintPx(X + i + 3, Yy + j + 4, 0.74);
    for (let j = -8; j <= 8; j++) for (let i = -8; i <= 8; i++) if (i * i + j * j < 62) img.px(X + i, Yy + j, Math.floor(((Math.atan2(j, i) + 3.15) / 6.3) * 8) % 2 ? c : scaleColor(c, 1.25));
  }
  k.strollers(135, 5146, 18, 2, 3);
  // Tinu beach: umbrellas on the sand, swimmers; the Heart Rocks standing in the shallows, undercut by the waves, scrub on top
  for (const [rx, ru, r] of [[130, 5156, 4.5], [140, 5160, 5.5]]) {
    const X = rx * S;
    const Yy = Y(ru) * S;
    const RR = r * S;
    for (let a = 0; a < 6.3; a += 0.12) if (kb() < 0.6) img.px(X + Math.cos(a) * (RR + 4), Yy + 5 + Math.sin(a) * (RR * 0.7 + 3), C.foam, 0.8);
    img.discPx(X + 6, Yy + 9, RR, 0x0a1a2a, 0.35);
    // a dark undercut foot, a pale rock face, its green cap
    for (let j = -RR; j <= RR; j++)
      for (let i = -RR; i <= RR; i++) {
        if (i * i + j * j > RR * RR) continue;
        const v = hashPx((X + i) >> 1, (Yy + j) >> 1, 5157);
        let c = j > RR * 0.5 ? C.rock[1] : rampColor(C.rock, 0.5 - i / (RR * 3) - j / (RR * 3) + (v - 0.5) * 0.3, X + i, Yy + j);
        if (j < -RR * 0.15 && v > 0.18) c = rampColor(C.scrub, 0.3 + v * 0.7 - i / (RR * 2), X + i, Yy + j);
        img.px(X + i, Yy + j, c);
      }
  }
  // cars: up the Yanbaru road, over the bridge, round the island to the beach and back
  const carF = (col) => k.sprite(7, 4, 4800, (r) => {
    for (let j = 0; j < 12; j++)
      for (let i = 0; i < 21; i++) {
        if ((i === 0 || i === 20) && (j === 0 || j === 11)) continue;
        let c = j === 0 ? scaleColor(col, 1.2) : j === 11 ? scaleColor(col, 0.7) : col;
        const q = 20 - i;
        const inner = j > 0 && j < 11;
        if (q >= 4 && q < 7) c = inner ? 0x283440 : scaleColor(col, 0.6);
        else if (q >= 7 && q < 15 && inner) c = scaleColor(col, 1.14);
        else if (q >= 15 && q < 17) c = inner ? 0x34404c : scaleColor(col, 0.6);
        r.px(i, j, c);
      }
  });
  const route = [];
  for (let u = ROAD[0]; u < B0; u += 16) route.push([Math.round(roadX(u)) - 1.6, u]);
  route.push([89, B0], [89, B1], ...ISLAND_ROAD.slice(1).map(([x, u]) => [x - 1.6, u]));
  for (const [c, s0] of [[0xf0f0f0, 0.35], [0xd8343a, 0.62], [0x3a6ac8, 0.82], [0x2a2a30, 0.15]]) kit.path(route, [carF(c)], { sp: 16, mode: 'pp', hold: 3, turn: 'rot', s0, d: 0.45 });
  // and along the coast road, either way
  for (const [dir, u, n, sp] of [[1, 1157.5, 3, 24], [-1, 1152.5, 3, 27]]) kit.path(dir > 0 ? [[-14, u], [W + 14, u]] : [[W + 14, u], [-14, u]], [carF(0xe8e8ec), carF(0xc43a30), carF(0x3a609c)], { sp, n, gap: 70, turn: 'rot', cars: 1, d: 0.45 });
  // boats on the shallows
  const skiff = (c) => k.hull(14, 5, 4800, c, 0xc8c0b0, (r, FL, FHh) => {
    for (let j = 4; j < FHh - 4; j++) for (let i = 6; i < 16; i++) r.px(i, j, j === 4 ? 0xffffff : i > 13 ? 0x2a3a4a : 0xe8e8e0);
  });
  const wake = { f: k.wakeF(4800), every: 4, life: 1.8 };
  kit.path([[-20, 4760], [60, 4780], [78, 4900]], [skiff(0xe8e4dc)], { sp: 5, mode: 'pp', hold: 5, turn: 'rot', d: 0.02, s0: 0.4, wake });
  kit.path([[W + 20, 4830], [120, 4860], [110, 4960]], [skiff(0x2a5a8a)], { sp: 5, mode: 'pp', hold: 5, turn: 'rot', d: 0.02, s0: 0.7, wake });
  kit.loop(60, 4930, [skiff(0x3a7a5a)], { d: 0.02 });
  kit.loop(124, 4730, [skiff(0xe8e4dc)], { d: 0.02 });
  void objects;
}
