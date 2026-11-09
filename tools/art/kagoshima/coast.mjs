// North of the river: Sengan-en, the Shimadzu family's garden by the sea (u = 1345..2200): its gate and white wall, the great
// pond with its pine islet, the winding stream for poetry parties, the residence's linked halls, the lion rock lantern, the cat
// shrine, bamboo, the cannon battery aimed at the bay, the stone Shūseikan factory hall of 1865 and the Satsuma-kiriko glass
// furnace; the coast road and the Nippō line coming out of their tunnel. Then the coast (u = 2200..2850): hot sand baths on
// the black beach, bathers buried to the neck; the black-vinegar jar fields of Fukuyama.
import { C, S, night, hashPx, scaleColor, rampColor, fbm, rng, mix } from '../nagasaki/canvas.mjs';
import { puff } from '../props.mjs';
import { W, SENGAN, COAST, BAY, TUNNEL, coastX, railX, seaX, sandBeach, landD } from './geo.mjs';
import { LEAF } from './city.mjs';

const GRAVEL = [0x9a9280, 0xaea694, 0xc0b8a6, 0xd0c8b6];
const MOSSY = [0x2e5a30, 0x3c6e38, 0x4e8444, 0x64984e];
const BAMBOO = [0x2a5a2a, 0x3a7234, 0x4e8a40, 0x6aa24e];
const PLUM = [0x8a4a5a, 0xb0687a, 0xd490a0, 0xf0c0c8];
const TILE = C.kawara;

/** The vapour that rises off hot ground, as growth stages for kit.emit. */
export const vapourOf = (k) => [6, 9, 12, 15].map((r) => [0, 1].map((v) => k.kit.frame(puff(r, r * 19 + v, [0x9a9696, 0xbcb8b6, 0xdcd8d4, 0xf4f0ec]))));

export function paintSengan(k) {
  const { img, Y, kit, objects, pool, glowPx } = k;
  const R = rng(1345);
  const vapour = vapourOf(k);

  // ------------------------------------------------------------ the coast road and the railway
  const coastPts = [];
  for (let u = SENGAN[0] - 6; u < BAY[0] + 160; u += 8) {
    const cx = coastX(u);
    if (cx < -24) break;
    coastPts.push([cx, u]);
  }
  for (let i = 0; i < coastPts.length - 1; i += 12) k.road(coastPts.slice(i, i + 14), 4, { side: 1, lanes: true, piece: true });
  const railPts = [];
  for (let u = TUNNEL; u < BAY[0] + 160; u += 8) {
    const cx = railX(u);
    if (cx < -24) break;
    railPts.push([cx, u]);
  }
  const railPaint = (X, Yy, across, along) => {
    const a = Math.abs(across);
    if (Math.abs(a - 1) < 0.2) return 0xc4c8cc;
    if (Math.floor(along * 1.5) % 2 === 0 && a < 1.9) return 0x5a4a3a;
    return rampColor([0x5e5a54, 0x706c64, 0x827e74], hashPx(X >> 1, Yy >> 1, 1346), X, Yy);
  };
  for (let i = 0; i < railPts.length - 1; i += 12) k.road(railPts.slice(i, i + 14), 2.4, { side: 0, paint: railPaint, kerb: 0x4a4640, piece: true });
  // the palms down the sea side of the road
  for (let u = 1420; u < BAY[0]; u += 26) {
    const cx = coastX(u) + 7;
    if (cx > 2 && landD(cx, u) > 2) k.palm(cx, Y(u), 4.6, u);
  }
  // the tunnel mouth: a grassy hump over the line, a concrete portal with its dark arch facing up the coast
  {
    const tx = railX(TUNNEL);
    const ty = Y(TUNNEL);
    img.fine(tx - 16, ty - 1, 32, 26, (X, Yy, x, y) => {
      const e = ((x - tx + 2) / 15) ** 2 + ((y - ty - 11) / 13) ** 2;
      if (e > 1) return null;
      return k.lawnPx(X, Yy, 0.8 - e * 0.55 - (y - ty) * 0.012 + fbm(x, y, { seed: 451, scale: 3 }) * 0.2, [0x2e4a2a, 0x3e5e34, 0x527440, 0x688a4c]);
    });
    objects.push({
      y: ty + 5,
      draw: () => {
        const X = Math.round(tx * S);
        const Yb = (ty + 4) * S;
        for (let j = 0; j < 15; j++) for (let i = -21; i <= 21; i++) img.px(X + i, Yb - j, j > 11 ? 0xd8d4cc : Math.abs(i) > 15 ? (i > 0 ? 0x7a7670 : 0xb4b0a8) : 0xa8a49c);
        for (let j = 0; j < 12; j++) {
          const hw = j > 7 ? Math.sqrt(Math.max(0, 1 - ((j - 7) / 5) ** 2)) * 9 : 9;
          for (let i = -hw; i <= hw; i++) img.px(X + i, Yb - j, 0x0c0c10);
        }
      },
    });
    k.reserve(tx - 16, ty - 1, 32, 26);
  }

  // ------------------------------------------------------------ the gate and the white wall along the river
  {
    const wy = Y(SENGAN[0] + 6);
    img.fine(0, wy, 72, 4, (X, Yy) => {
      if (Math.abs(X / S - 30) < 8) return null;
      const j = Yy - wy * S;
      if (j < 4) return X % 4 === 0 ? 0x2a2e36 : TILE[3 - (j >> 1)];
      if (j < 10) return j === 4 ? 0x8a867a : (X + (j >> 1)) % 18 === 0 ? 0xd0c8b8 : 0xeee8da;
      return 0xb8b0a0;
    });
    for (let X = 0; X < 72 * S; X++) if (Math.abs(X / S - 30) >= 8) for (let j = 0; j < 4; j++) img.tintPx(X, (wy + 4) * S + j, 0.68 + j * 0.07);
    k.reserve(0, wy - 1, 72, 6);
    // the roofed gate, its posts and doors standing open; the way in off the bridge
    k.road([[30, SENGAN[0] - 6], [30, SENGAN[0] + 16]], 3, { side: 0, surface: GRAVEL, kerb: C.granite[1], piece: true });
    objects.push({
      y: wy + 5,
      shadow: () => k.shadowRect(23, wy - 1, 17, 6, 0.55),
      draw: () => {
        const X = 21 * S;
        const Yb = (wy + 5) * S;
        for (const q of [3, 49]) for (let j = 0; j < 18; j++) for (let i = 0; i < 6; i++) img.px(X + q + i, Yb - j, i < 2 ? C.oldWood[3] : C.oldWood[0]);
      },
    });
    k.house(21, wy - 7, 18, 8, 3, 'jp', { ramp: TILE, wall: 0x3a2c22, door: false, reserve: false, bias: 6, roof: { gable: 'tri', gw: 5 } });
    k.stoneLantern(18, SENGAN[0] + 10, false);
    k.stoneLantern(42, SENGAN[0] + 10, false);
    k.strollers(30, SENGAN[0] + 20, 5, 6, 4);
  }

  // ------------------------------------------------------------ the great pond
  {
    const px = 92;
    const pu = 1465;
    const eAt = (x, u) => ((x - px) / 30) ** 2 + ((u - pu) / 32) ** 2 + (fbm(x, u, { seed: 38, scale: 10 }) - 0.5) * 0.3;
    img.fine(px - 34, Y(pu + 36), 68, 72, (X, Yy, x, y) => {
      const u = 7168 - y;
      const e = eAt(x, u);
      if (e > 1.14) return null;
      if (e > 1) return hashPx(X >> 2, Yy >> 2, 1347) < 0.4 ? C.granite[3] : C.granite[1]; // rocks round the rim
      const isle = ((x - 100) / 9) ** 2 + ((u - 1474) / 7) ** 2;
      if (isle < 1) return isle > 0.8 ? C.granite[2] : k.lawnPx(X, Yy, 0.5, MOSSY);
      const c = rampColor([0x12382e, 0x1c4a3e, 0x2a5e4e, 0x3a7464], 0.2 + fbm(x, y, { seed: 39, scale: 5 }) * 0.5 + (1 - e) * 0.2, X, Yy);
      if (hashPx(X >> 1, Yy, 1348) > 0.985) return 0xb0d4cc;
      // the sky's pale reflection in it
      return fbm(x * 0.6, y * 2, { seed: 40, scale: 5 }) > 0.66 ? scaleColor(c, 1.3) : c;
    });
    k.reserve(px - 34, Y(pu + 36), 68, 72);
    // water lilies
    for (let i = 0; i < 40; i++) {
      const x = px - 26 + R() * 52;
      const u = pu - 28 + R() * 56;
      if (eAt(x, u) > 0.86 || ((x - 100) / 11) ** 2 + ((u - 1474) / 9) ** 2 < 1) continue;
      img.discPx(x * S, Y(u) * S, 3, 0x3a7a4a);
      img.px(x * S - 1, Y(u) * S - 1, 0x6aaa6a);
      if (i % 4 === 0) img.discPx(x * S + 1, Y(u) * S, 1, 0xf4b0c8);
    }
    // the islet's pines, its arched wooden bridge from the near shore
    k.niwaki(98, 1472, 1.1, 1349);
    k.niwaki(103, 1476, 0.8, 1350);
    k.stoneLantern(96, 1468, false);
    for (let X = 61 * S; X < 93 * S; X++) {
      const t = (X - 61 * S) / (32 * S);
      const dy = Math.round(Math.sin(t * Math.PI) * 10);
      const Yy = (Y(1468) + 2 - t * 2) * S - dy;
      for (let j = 0; j < 12; j++) img.tintPx(X + 3, Yy + 12 + j, 0.72);
      for (let j = 0; j < 12; j++) img.px(X, Yy + j, j < 2 || j > 9 ? 0xa82a20 : X % 3 ? 0xc85040 : 0x8a3a2a);
      if (X % 15 === 0) for (let j = -6; j < 0; j++) img.px(X, Yy + j, 0xd8483a);
    }
    k.strollers(78, 1466, 12, 1, 2);
    const koi = (col) => [0, 1].map((f) => k.sprite(4, 3, 1465, (r) => {
      for (let i = 0; i < 9; i++) {
        const hw = Math.sin((i / 8) * Math.PI) * 1.6;
        const cy = 4 + (f ? 1 : -1) * Math.sin(i * 0.5) * 0.7;
        for (let j = -hw; j <= hw; j += 0.5) r.px(i, cy + j, i > 2 && i < 6 ? 0xfff4e8 : col);
      }
    }, false));
    kit.wander(82, 1445, 14, 12, koi(0xf08a3a), { n: 3, sp: 4, turn: 'rot', fps: 3 });
    kit.wander(92, 1490, 12, 8, koi(0xe85a2a), { n: 2, sp: 3, turn: 'rot', fps: 3 });
  }

  // ------------------------------------------------------------ the garden's walks, gate to Shūseikan, round the pond, through the plums
  /** A curve through the given points (they stay where they are, so the walks still meet what they join). */
  const curved = (pts) => {
    const out = [];
    for (let i = 0; i + 1 < pts.length; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let q = 0; q < 6; q++) {
        const t = q / 6;
        const at = (a, b, c, d) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t);
        out.push([at(p0[0], p1[0], p2[0], p3[0]), at(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  };
  const MAIN = curved([[30, SENGAN[0] + 14], [34, 1385], [46, 1412], [50, 1440], [44, 1470], [46, 1505], [34, 1528], [32, 1552], [44, 1575], [52, 1600], [50, 1628], [42, 1650], [38, 1690], [46, 1722], [42, 1750], [48, 1790], [44, 1840], [50, 1880], [44, 1906]]);
  const ROUND = curved([[46, 1412], [70, 1420], [100, 1424], [128, 1432], [132, 1470], [124, 1508], [100, 1524], [72, 1532], [60, 1548], [52, 1570]]);
  const PLUMS = curved([[124, 1508], [118, 1560], [110, 1600], [112, 1632]]);
  const VIEW = curved([[46, 1732], [80, 1738], [110, 1750], [128, 1790], [114, 1838]]);
  const walks = [MAIN, ROUND, PLUMS, VIEW];
  for (const w of walks) for (let i = 0; i < w.length - 1; i += 12) k.road(w.slice(i, i + 14), 1.5, { side: 0, surface: GRAVEL, kerb: 0x7a7a6a, piece: true });
  k.walkers(MAIN.filter((_, i) => i % 12 === 0), 8, 1650, { sp: 2.6, gap: 60 });
  k.walkers(ROUND.filter((_, i) => i % 8 === 0), 4, 1470, { sp: 2.6, gap: 60 });
  k.walkers(VIEW.filter((_, i) => i % 6 === 0), 3, 1770, { sp: 2.6, gap: 60 });
  /** Clipped azalea mounds, the satsuki-karikomi of a Japanese garden: rounded, overlapping, some in flower. */
  const mounds = (x, u, n, col, seed2) => {
    const g = rng(seed2);
    for (let q = 0; q < n; q++) {
      const CX = (x + (g() - 0.5) * n * 3.4) * S;
      const CY = Y(u + (g() - 0.5) * n * 1.6) * S;
      const r = 6 + g() * 5;
      if (k.isRes(CX / S, CY / S)) continue;
      for (let j = -r; j <= r; j++) for (let i = -r; i <= r + 2; i++) if (i * i + j * j * 1.6 < r * r) img.tintPx(CX + i + 2, CY + j + 3, 0.7);
      for (let j = -r; j <= r; j++)
        for (let i = -r; i <= r; i++) {
          if (i * i + j * j * 1.5 > r * r) continue;
          const v = 0.6 - (i + j * 1.4) / (r * 2.4);
          const h = hashPx((CX + i) >> 1, (CY + j) >> 1, seed2);
          img.px(CX + i, CY + j, col && h > 0.62 ? (h > 0.9 ? 0xf8e0ea : col) : rampColor([0x264a2a, 0x34603a, 0x467844, 0x5e904e], v + (h - 0.5) * 0.2, CX + i, CY + j));
        }
    }
  };
  for (const [x, u, n, c, s2] of [[20, 1378, 5, 0xe85a90, 1], [62, 1404, 6, 0xe85a90, 2], [134, 1406, 4, null, 3], [26, 1440, 6, null, 4], [26, 1500, 6, 0xf080a8, 5], [20, 1600, 7, 0xe85a90, 6], [34, 1620, 4, null, 7], [100, 1544, 5, 0xe85a90, 8], [84, 1640, 4, null, 9], [136, 1680, 6, 0xf080a8, 10], [140, 1740, 5, 0xe85a90, 11], [70, 1760, 7, 0xf080a8, 12], [100, 1810, 7, 0xe85a90, 13], [70, 1846, 6, null, 14], [132, 1880, 6, 0xe85a90, 15], [100, 1900, 5, null, 16], [90, 1404, 7, null, 17], [114, 1400, 5, 0xe85a90, 18], [24, 1408, 6, null, 19], [20, 1534, 7, 0xf080a8, 20], [70, 1554, 5, null, 21], [46, 1648, 3, 0xe85a90, 22], [108, 1860, 5, null, 23], [78, 1796, 8, 0xe85a90, 24], [124, 1818, 6, null, 25], [90, 1754, 7, null, 26]]) mounds(x, u, n, c, 1370 + s2);
  // lanterns along the walks, benches at the turns; a thatched arbour looking over the pond
  for (const [x, u] of [[50, 1398], [58, 1416], [36, 1460], [52, 1480], [132, 1450], [40, 1540], [58, 1596], [34, 1700], [52, 1760], [38, 1820], [120, 1770]]) k.stoneLantern(x, u, false);
  for (const [x, u] of [[54, 1425], [136, 1490], [66, 1525], [118, 1745]]) k.bench(x, Y(u), 4);
  k.house(134, Y(1458), 11, 6, 4, 'jp', { ramp: [0x5a4a30, 0x6e5c3c, 0x84704a, 0x9a8458, 0xb09a68], wall: 0x8a7a5a, door: false, reserve: true });
  // the plum grove in its rows, a low bamboo fence along the walk, the little tea pavilion among them
  for (let u = 1530; u < 1636; u += 13)
    for (let x = 92; x < 140; x += 12) {
      const tx = x + hashPx(x, u, 1375) * 4 + ((u >> 3) % 2) * 5;
      if (!k.anyRes(tx - 3, Y(u) - 3, 6, 6)) k.tree(tx, Y(u), 3.2, u % 2 ? PLUM : [0xc8c0b8, 0xe0d8d0, 0xf0ece4, 0xfff8f4], Math.round(tx + u));
    }
  k.house(94, Y(1622), 12, 7, 4, 'jp', { ramp: C.kawara, wall: 0xd8ccb0, noren: 0x8a2a2a, door: true });
  k.strollers(116, 1580, 16, 36, 5);

  // the winding stream for poetry parties (Kyokusui-no-en): a stone-edged rill looping over the moss, cups floating on it
  {
    const sw = (u) => 76 + 11 * Math.sin((u - 1560) / 10) + 3 * Math.sin((u - 1560) / 4);
    img.fine(58, Y(1626), 36, 66, (X, Yy, x, y) => {
      const u = 7168 - y;
      if (u < 1562 || u > 1624) return null;
      const d = Math.abs(x - sw(u));
      if (d < 1) return hashPx(X, Yy >> 1, 1351) < 0.14 ? 0xc0dce0 : 0x2a5a60;
      if (d < 1.6) return hashPx(X >> 1, Yy >> 1, 1352) < 0.5 ? C.granite[3] : C.granite[1];
      if (d > 7 + (hashPx(X >> 2, Yy >> 2, 1354) - 0.5) * 3) return null;
      return k.lawnPx(X, Yy, 0.3 + hashPx(X >> 2, Yy >> 2, 1353) * 0.4, MOSSY);
    });
    k.reserve(60, Y(1626), 32, 66);
    for (let u = 1572; u < 1622; u += 12) k.bench(sw(u) + 4, Y(u), 3);
    k.strollers(70, 1600, 8, 14, 4, { cols: [0xe8d8e0, 0x8a2a5a, 0x2a3a6a, 0xd8c8a0] });
    k.tree(88, Y(1630), 4, PLUM, 1354);
    k.tree(62, Y(1590), 3.6, PLUM, 1355);
  }

  // ------------------------------------------------------------ the residence: a walled court, raked gravel, linked halls, the lion rock
  {
    const x0 = 58;
    const x1 = 128;
    const u0 = 1640;
    const u1 = 1728;
    img.fine(x0, Y(u1), x1 - x0, u1 - u0, (X, Yy, x, y) => {
      const u = 7168 - y;
      // the raked gravel swept in long waves round each group of stones
      const v = Math.sin(u * 2.2 + Math.sin(x * 0.2) * 2.4);
      if (fbm(x, y, { seed: 1376, scale: 9 }) > 0.62) return k.lawnPx(X, Yy, 0.3 + hashPx(X >> 2, Yy >> 2, 1377) * 0.5, MOSSY);
      return v > 0 ? 0xc8c0ae : 0xb6ae9c;
    });
    k.reserve(x0, Y(u1), x1 - x0, u1 - u0);
    // its white wall under dark tile, all round, a roofed gate on the walk's side
    const wallH = (u, a, b) => {
      img.fine(a, Y(u), b - a, 3, (X, Yy) => {
        const j = Yy - Y(u) * S;
        if (j < 3) return X % 4 === 0 ? TILE[0] : TILE[3];
        return j === 3 ? 0x8a867a : (X + (j >> 1)) % 18 === 0 ? 0xd0c8b8 : 0xeee8da;
      });
    };
    wallH(u1 + 1, x0, x1);
    wallH(u0 + 1, x0, x1);
    for (const x of [x0, x1 - 2]) img.fine(x, Y(u1), 2, u1 - u0, (X, Yy) => ((X % 6 < 3) === (x === x0) ? 0xeee8da : (Yy % 4 === 0 ? TILE[0] : TILE[3])));
    k.house(x0 - 2, Y(1696), 10, 5, 3, 'jp', { ramp: TILE, wall: 0x3a2c22, door: false, reserve: false, roof: { gable: 'tri', gw: 3 } });
    k.road([[47, 1686], [x0 + 4, 1686]], 1.5, { side: 0, surface: GRAVEL, kerb: 0x7a7a6a, piece: true });
    const halls = [[66, 1700, 34, 14, 7], [98, 1684, 26, 13, 6], [76, 1656, 26, 12, 6]];
    for (const [x, u, w, rh, fh] of halls) k.house(x, Y(u + rh + fh), w, rh, fh, 'jp', { ramp: TILE, wall: 0xece4d0, door: true, bay: 6, reserve: false, roof: { gable: 'tri', gw: 7 } });
    for (const [x, y, w] of [[92, Y(1694), 8], [88, Y(1676), 12]]) k.house(x, y, w, 3, 2, 'jp', { ramp: TILE, wall: 0x4a3a2a, door: false, reserve: false, bias: -2 });
    for (const [x, u, s] of [[62, 1664, 1], [120, 1660, 0.9], [62, 1716, 0.9], [118, 1716, 1.1], [106, 1652, 0.8]]) k.niwaki(x, u, s, Math.round(x * 3 + u));
    // the Shishi-iwa, the lion rock, and the great lantern on it, in the court's front
    k.boulder(112, 1652, 8, 5, 1356, 0.6, C.granite);
    objects.push({
      y: Y(1652) + 1,
      draw: () => {
        const X = 112 * S;
        const Yb = (Y(1652) - 3) * S;
        for (let j = 0; j < 9; j++) for (let i = -2; i <= 2; i++) img.px(X + i, Yb - j, i < 0 ? C.granite[4] : C.granite[2]);
        for (let j = 9; j < 16; j++) for (let i = -4; i <= 4; i++) img.px(X + i, Yb - j, i < -2 ? C.granite[4] : j % 3 === 0 && Math.abs(i) < 2 ? 0x2a2a2e : C.granite[3]);
        for (let j = 16; j < 21; j++) {
          const hw = 9 - (j - 16) * 1.6;
          for (let i = -hw; i <= hw; i++) img.px(X + i, Yb - j, i < 0 ? C.granite[3] : C.granite[1]);
        }
      },
    });
    k.strollers(90, 1670, 26, 14, 6);
    k.crowd(96, Y(1648), 16, 4, 4);
  }
  // the cat shrine: two small cats of stone under a little vermilion torii, offerings of fish
  {
    const x = 58;
    const u = 1754;
    k.fill(x - 7, Y(u + 8), 14, 12, GRAVEL, 1360, 3);
    objects.push({
      y: Y(u),
      draw: () => {
        const X = x * S;
        const Yb = Y(u) * S;
        for (const s of [-1, 1]) for (let j = 0; j < 21; j++) for (let i = 0; i < 2; i++) img.px(X + s * 9 + i, Yb - j, C.vermilion[2]);
        for (let i = -13; i <= 13; i++) for (let j = 0; j < 2; j++) img.px(X + i, Yb - 21 - j, j ? C.vermilion[2] : C.vermilion[3]);
        for (const s of [-5, 5]) {
          for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) if (i * i + j * j < 10) img.px(X + s + i, Yb - 4 + j, 0xd8d4c8);
          img.discPx(X + s, Yb - 9, 2.4, 0xe8e4d8);
          img.px(X + s - 2, Yb - 12, 0xe8e4d8);
          img.px(X + s + 2, Yb - 12, 0xe8e4d8);
        }
      },
    });
    k.reserve(x - 7, Y(u + 8), 14, 12);
  }
  // the bamboo grove on the slope, thick, a stone path through it
  k.forest(0, 38, 1650, 1906, [BAMBOO, BAMBOO, [0x2a5228, 0x386a30, 0x4a823c, 0x60984a]], 1361, 3.2, 4.6);
  k.forest(52, 74, 1770, 1890, [BAMBOO, [0x2a5228, 0x386a30, 0x4a823c, 0x60984a]], 1378, 3.2, 4.4);
  // the Satsuma cannon battery on its stone parapet, aimed at the bay
  {
    const x0 = 100;
    img.fine(x0 - 2, Y(1868), 30, 24, (X, Yy, x, y) => {
      const u = 7168 - y;
      if (u > 1864) return k.settPx(X, Yy, 1362, C.granite);
      return k.gravelPx(X, Yy);
    });
    k.reserve(x0 - 2, Y(1868), 30, 24);
    for (const q of [0, 1, 2]) {
      const u = 1848 + q * 6;
      objects.push({
        y: Y(u) + 3,
        shadow: () => k.shadowRect(x0 + 3, Y(u), 20, 3, 0.55),
        draw: () => {
          const X = x0 * S;
          const Yy = Y(u) * S;
          // the wooden carriage, its wheels, the long black barrel with its rings
          for (let j = 0; j < 12; j++) for (let i = 0; i < 24; i++) img.px(X + i, Yy + j - 3, j < 2 ? C.wood[3] : C.wood[1]);
          for (const i of [4, 20]) {
            img.discPx(X + i, Yy + 8, 4, C.wood[0]);
            img.discPx(X + i, Yy + 8, 1.4, 0x2a2a2e);
          }
          for (let i = 6; i < 60; i++) {
            const r = 4 - i * 0.02;
            for (let j = -r; j <= r; j++) img.px(X + i, Yy + j, (i % 16 < 2 ? 0x5a5a62 : j < -1 ? 0x5a5a62 : j > 1 ? 0x0a0a0c : 0x24242a));
          }
          for (let j = -2; j <= 2; j++) img.px(X + 60, Yy + j, 0x000000);
        },
      });
    }
    k.crowd(x0, Y(1848), 22, 3, 5);
  }
  // Shūseikan: the machine factory of 1865, long walls of dressed stone, arched windows, a dark tiled roof
  {
    const x = 14;
    const fy = Y(1917);
    const w = 60;
    const rh = 15;
    const fh = 9;
    objects.push({
      y: fy,
      shadow: () => k.shadowRect(x + 3, fy - rh - fh + 3, w, rh + fh, 0.5),
      draw: () => {
        img.fine(x, fy - fh, w, fh, (X, Yy) => {
          const i = X - x * S;
          const j = Yy - (fy - fh) * S;
          const q = i % 21;
          if (j > 4 && j < fh * S - 4 && q > 5 && q < 16) {
            const hw = Math.min(5, Math.sqrt(Math.max(0, 25 - (Math.max(0, 9 - j) ** 2))));
            if (Math.abs(q - 10.5) < hw) return Math.abs(q - 10.5) < 0.6 || j % 6 === 0 ? 0x8a8a84 : night(1917) > 0.1 ? 0xffd890 : 0x2a3a4a;
          }
          const r = Math.floor(j / 4);
          const XX = i + r * 7;
          if (j % 4 === 0 || XX % 14 === 0) return 0x5e5a50;
          return rampColor([0x8a8678, 0x9e9a8a, 0xb2ae9c], hashPx(XX >> 3, r, 1363), X, Yy);
        });
        k.roof(x - 1, fy - fh - rh, w + 2, rh, TILE, { noshi: true });
      },
    });
    k.reserve(x - 1, fy - fh - rh - 1, w + 2, rh + fh + 2);
    k.fill(x, fy, w, 8, GRAVEL, 1364, 4);
    k.crowd(x + 6, fy + 1, 40, 4, 10);
  }
  // the Satsuma-kiriko glassworks: a brick shed, its chimney smoking, its furnace glowing through the door
  {
    k.house(80, Y(1946), 22, 11, 6, 'jp', { ramp: C.redTile, wall: 0x8a5a44, door: true, doorX: 9 });
    objects.push({
      y: Y(1929),
      draw: () => {
        const X = 100 * S;
        const Yb = Y(1934) * S;
        for (let j = 0; j < 48; j++) {
          const hw = 5 - j * 0.03;
          for (let i = -hw; i <= hw; i++) img.px(X + i, Yb - j, j % 3 === 0 ? 0x5a3a2c : i < -1 ? 0xa06e54 : 0x7a4e3c);
        }
        for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) if (i * i + j * j < 10) glowPx(89 * S + i, Y(1930) * S + j, 0xff9a40, 0.92);
      },
    });
    kit.emit(100, 1950, vapour.slice(0, 3), { rate: 0.8, life: [2.6, 3.6], vy: 8, sx: 1.4, wf: 1, a: 0.32, tint: 1 });
  }
  // garden trees: great camphors and trained pines over the walks, in the room that's left
  k.grove(2, 140, 1362, 1430, 18, [LEAF.pine, LEAF.camellia, LEAF.camphor], 1365, 4, 7);
  k.grove(2, 42, 1436, 1650, 22, [LEAF.pine, LEAF.camphor, LEAF.camellia], 1366, 4.5, 7.5);
  k.grove(128, 150, 1460, 1880, 22, [LEAF.pine, LEAF.camellia, LEAF.camphor], 1367, 3.6, 6);
  k.grove(76, 130, 1732, 1846, 14, [LEAF.pine, LEAF.camphor, PLUM], 1368, 3.6, 6);
  for (const [x, u, s] of [[62, 1400, 1.1], [38, 1486, 1], [128, 1400, 1], [74, 1542, 1], [44, 1610, 0.9], [122, 1730, 1], [96, 1872, 1.1]]) if (!k.anyRes(x - 1, Y(u) - 1, 2, 2)) k.niwaki(x, u, s, x + u);
  k.forest(0, 170, 1958, 2196, [LEAF.pine, LEAF.camphor, LEAF.camellia], 1369, 4.2, 7.5, (x, u) => landD(x, u) > 22 && Math.abs(x - railX(u)) > 8);
  // a pine-backed strip of lawn with paths behind the sea wall, people looking out at the volcano
  for (let u = 1500; u < 2190; u += 34) {
    const x = coastX(u) + 8;
    if (landD(x, u) > 2) k.bench(x, Y(u), 3);
  }
  k.strollers(coastX(1760) + 8, 1760, 3, 60, 4);
}

export function paintCoast(k) {
  const { img, Y, kit, objects, glowPx, pool } = k;
  const sr = rng(4421);
  const vapour = vapourOf(k);

  // ------------------------------------------------------------ the hot sand baths on the black beach
  const S0 = 2236;
  const S1 = 2420;
  const shoreX = (u) => seaX(u) + sandBeach(u);
  img.fine(Math.floor(coastX(S1)) - 2, Y(S1 + 10), W - Math.floor(coastX(S1)) + 2, S1 - S0 + 20, (X, Yy, x, y) => {
    const u = 7168 - y;
    if (k.fineWater[Yy * k.FW + X] || x < coastX(u) + 6) return null;
    const d = shoreX(u) - x;
    // wet and shining at the water, dimpled and raked above it
    if (d < 3) return rampColor([0x1a1614, 0x24201e, 0x302a28], hashPx(X >> 1, Yy, 2201), X, Yy);
    const rake = Math.sin(u * 2.4) * 0.05;
    let c = rampColor([0x302c2a, 0x403c3a, 0x504c48, 0x625e5a], 0.1 + fbm(x, y, { seed: 81, scale: 3 }) * 0.5 + rake, X, Yy);
    if (hashPx(X, Yy, 2202) < 0.05) c = scaleColor(c, 1.3);
    return c;
  });
  k.reserve(Math.floor(coastX(S1)) + 6, Y(S1 + 10), W, S1 - S0 + 20);
  // two rows of bathers lying across the beach, heads towards the land
  const shades = [[2300, 2324], [2356, 2380]];
  for (const dd of [6, 16])
    for (let u = S0 + 14; u < S1 - 10; u += 5) {
      if (sr() < 0.18) continue;
      const x1 = shoreX(u) - dd;
      const x0 = x1 - 7;
      if (x0 < coastX(u) + 8) continue;
      const X0 = Math.round(x0 * S);
      const Yb = Y(u) * S;
      const yuk = [0x3a5a9a, 0xe8e8f0, 0x9a3a4a, 0x4a7a5a][Math.floor(sr() * 4)];
      // the mound of sand over the body, knees and feet showing in it, catching the light; its shadow
      for (let i = 0; i < 21; i++) {
        const h = 3 + Math.sin((i / 21) * Math.PI) * 2 + (i > 12 && i < 16 ? 1 : 0);
        for (let j = 0; j < h; j++) img.px(X0 + i, Yb - j, j === Math.floor(h) - 1 ? 0xa09a92 : j > h - 3 ? 0x7a746e : 0x5a5450);
        img.px(X0 + i, Yb + 1, 0x141210);
        img.px(X0 + i, Yb + 2, 0x201c1a);
      }
      // the yukata at the neck, the towel round the head, the face, a hand
      for (let j = 0; j < 4; j++) for (let i = -1; i < 2; i++) img.px(X0 + i, Yb - j, yuk);
      for (let j = -5; j < 1; j++) for (let i = -7; i < -1; i++) img.px(X0 + i, Yb + j, j < -3 || i < -5 ? 0xf8f4ea : 0xd8d0c0);
      for (let j = -3; j < 0; j++) for (let i = -4; i < -1; i++) img.px(X0 + i, Yb + j, 0xe0b090);
      img.px(X0 - 2, Yb - 2, 0x2a1a14);
    }
  // reed shades on poles over part of the rows
  for (const [a, b] of shades) {
    const x0 = shoreX((a + b) / 2) - 26;
    objects.push({
      y: Y(a),
      shadow: () => k.shadowRect(x0 + 3, Y(b) + 4, 18, b - a, 0.6),
      draw: () => {
        img.fine(x0, Y(b), 18, b - a, (X, Yy) => {
          const j = Yy - Y(b) * S;
          if (j < 2) return 0x6a5232;
          if (j % 6 === 0) return 0x8a6e44;
          return (X >> 1) % 5 === 0 ? 0xa88a58 : hashPx(X >> 1, j, 2203) < 0.3 ? 0xd0b480 : 0xc0a470;
        });
        for (const [xx, uu] of [[x0, a], [x0 + 17, a]]) for (let j = 0; j < 15; j++) img.px(xx * S, Y(uu) * S - j, 0x4a3a24);
      },
    });
  }
  // steam seeping out of the sand (live), the attendants with their shovels
  for (let q = 0; q < 8; q++) {
    const u = S0 + 20 + Math.floor(sr() * (S1 - S0 - 40));
    kit.emit(Math.round(shoreX(u) - 4 - sr() * 18), u, vapour.slice(0, 2), { rate: 0.5, life: [1.4, 2.2], vy: 5, sx: 3, wf: 1, a: 0.3, tint: 1 });
  }
  const attendant = (f) => k.sprite(5, 6, 2330, (r) => {
    r.discPx(6, 3, 2, 0xe8d8a0); // the sedge hat
    for (let j = 5; j < 11; j++) for (let i = 4; i < 8; i++) r.px(i, j, 0x2a3a6a);
    for (let j = 11; j < 15; j++) for (const i of [4, 7]) r.px(i, j, 0x1a2036);
    r.linePx(8, 7, f ? 13 : 12, f ? 11 : 13, 0x8a6a44);
    r.rectPx(f ? 12 : 11, f ? 11 : 13, 3, 3, 0x9a9aa0);
  });
  kit.wander(shoreX(2330) - 14, 2330, 5, 60, [attendant(0), attendant(1)], { n: 3, sp: 4, idle: 0.7, turn: 'flip', fps: 2 });
  // the bathhouse behind the beach, a walkway over the road and rails down to the sand, people in yukata on it
  k.house(60, Y(2288), 30, 15, 7, 'jp', { ramp: TILE, wall: 0xd8ccb0, noren: 0x2a3a6a, bay: 5, door: true });
  {
    const u0 = 2256;
    const rx = railX(u0);
    const cx = coastX(u0);
    k.road([[74, u0], [rx - 3, u0]], 1.2, { side: 0, surface: C.stoneSet, kerb: C.granite[1], piece: true, over: false });
    // a level crossing over the rails with its striped barriers, zebra over the road, on down to the sand
    img.fine(rx - 3, Y(u0 + 2), 6, 4, (X, Yy) => ((X % 6) < 2 && Yy % 12 > 3 ? 0xc4c8cc : (Yy % 6 === 0 ? 0x5a4a3a : 0x8a7a64)));
    k.zebraH(cx - 3, cx + 3, u0 - 1);
    for (const s of [-4, 4]) {
      const X = (rx + s) * S;
      const Yy = Y(u0 + 2 + (s > 0 ? 0 : 3)) * S;
      for (let i = 0; i < 15; i++) img.rectPx(X, Yy + i, 2, 1, (i >> 2) % 2 ? 0xe8c030 : 0x1a1a1e);
    }
    k.walkers([[76, u0], [rx - 2, u0], [cx + 7, u0], [cx + 16, u0 + 4]], 3, 2260, { sp: 2.4, cols: [0x3a5a9a, 0xe8e8f0, 0x9a3a4a] });
    kit.emit(70, 2292, vapour.slice(0, 2), { rate: 0.7, life: [1.8, 2.6], vy: 6, sx: 2, wf: 1, a: 0.26, tint: 1 });
  }
  k.tree(50, Y(2260), 5, LEAF.camphor, 2204);
  k.tree(56, Y(2300), 4, LEAF.camellia, 2205);

  // ------------------------------------------------------------ the black-vinegar jars of Fukuyama
  /** One big black jar, glazed, its conical sedge lid tied on. */
  const jar = (x, u, seed2) => {
    const X = Math.round(x * S);
    const Yy = Y(u) * S;
    for (let j = -3; j <= 7; j++) for (let i = -8; i <= 9; i++) if ((i - 1) ** 2 / 64 + (j - 2) ** 2 / 20 < 1) img.tintPx(X + i + 2, Yy + j + 3, 0.62);
    for (let j = -7; j <= 7; j++)
      for (let i = -7; i <= 7; i++) {
        if (i * i + j * j > 50) continue;
        const lit = 0.5 - i * 0.05 - j * 0.05;
        img.px(X + i, Yy + j, lit > 0.86 ? 0x8a8078 : lit > 0.7 ? 0x4e4640 : lit > 0.4 ? 0x2a2420 : 0x161210);
      }
    if (hashPx(seed2, 1, 2206) < 0.86) {
      // the lid
      const c = 0xc0a878;
      for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) if (i * i + j * j < 19) img.px(X + i, Yy + j - 2, i + j < -1 ? 0xe0cca0 : i + j > 3 ? 0x8a7450 : (i + j) % 3 ? c : 0xa89060);
      img.px(X, Yy - 3, 0x5a4a2a);
    } else {
      // open for tasting: the dark vinegar in it
      for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) if (i * i + j * j < 15) img.px(X + i, Yy + j - 2, i * i + j * j > 11 ? 0x4e4640 : 0x3a1c0c);
      img.px(X - 1, Yy - 3, 0xa86a3a);
    }
  };
  for (let u = COAST[0] + 10; u < BAY[0] + 20; u += 64) {
    const fh = 52;
    for (let x0 = 4; x0 < 130; x0 += 46) {
      const u1 = u + fh;
      // only where there's room inland of the railway
      const ok = (x) => x < railX(u1) - 6 && x < railX(u) - 6;
      if (!ok(x0 + 10)) continue;
      const xr = Math.min(x0 + 42, railX(u1) - 6, railX(u) - 6);
      // the field: pale gravel, a low fence, an earth path round it
      img.fine(x0, Y(u1), xr - x0, fh, (X, Yy, x, y) => {
        if (k.isRes(x, y)) return null;
        const e = Math.min(x - x0, xr - x, y - Y(u1), Y(u) - y);
        if (e < 0.6) return (X + Yy) % 9 < 3 ? C.wood[0] : 0x5a5040;
        return k.gravelPx(X, Yy);
      });
      for (let jy = 0; jy < fh; jy += 7)
        for (let jx = 0; jx < xr - x0 - 3; jx += 7) {
          const x = x0 + jx + 3.5;
          const uu = u1 - jy - 3.5;
          if (k.anyRes(x - 3, Y(uu) - 3, 6, 6)) continue;
          jar(x, uu, Math.round(x * 13 + uu));
        }
      k.reserve(x0, Y(u1), xr - x0, fh);
      // the farmers going round with their ladles and sedge hats
      if ((x0 + u) % 3 < 2) k.strollers((x0 + xr) / 2, u + 26, (xr - x0) / 2 - 3, 20, 2, { hat: 0xd8c898, sp: 2.4, cols: [0x2a3a5a, 0x4a4a3a] });
    }
    // the path between the rows of fields, a farmhouse at the end, its sign
    if (u < BAY[0] - 60) {
      k.house(8, Y(u + fh + 11), 24, 7, 4, 'jp', { ramp: C.kawara, wall: 0xd8ccb0, noren: 0x1a1a1a, door: true, bay: 5 });
      k.tree(38, Y(u + fh + 8), 3.2, LEAF.camellia, u + 2207);
    }
  }
  void glowPx;
  void pool;
  void objects;
  void mix;
}
