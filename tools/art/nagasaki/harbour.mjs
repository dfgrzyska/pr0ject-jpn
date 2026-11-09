// The way in: the coasts closing in from Hashima, a fishing cove and terraced hamlets on the western slope, channel
// buoys and the breakwater lights, Megami Ōhashi across the harbour mouth, then the inner harbour: the Mitsubishi
// shipyard with the Giant Cantilever Crane (1909), a ship in the dry dock and an LNG carrier at the fitting-out quay on
// the west, the Matsugae cruise terminal with a liner on the east. All in fine pixels.
import { rng, fbm } from '../../lib/raster.mjs';
import { C, S, night, scaleColor, mix, rampColor, hashPx, CARS, COATS } from './canvas.mjs';
import { W, leftShore, rightShore, MEGAMI_U } from './geo.mjs';

const PINE = Object.assign([0x16301f, 0x234629, 0x34603a, 0x4c7a48], { kind: 'pine' });
const OAK = [0x1c3824, 0x2a5030, 0x3e6a3c, 0x5a8648];
const CAMPHOR = [0x1a3422, 0x284a2c, 0x3a6236, 0x527c44];
const MIKAN = [0x24482a, 0x34603a, 0x487a44, 0x629248];

export function paintHarbour(k) {
  const { img, kit, Y, objects, glowPx, pool } = k;
  const R = rng(1390);
  const line = (x0, y0, x1, y1, c, a = 1) => img.linePx(Math.round(x0), Math.round(y0), Math.round(x1), Math.round(y1), c, a);

  // ------------------------------------------------------------ the coasts: wooded hills, terraces, hamlets, a cove
  // the fishing cove under the western slope: a stone jetty, boats drawn up, net sheds, a little shrine's torii
  const coveU = 1300;
  {
    const sx = Math.round(leftShore(coveU));
    k.fill(2, Y(coveU + 26), sx, 46, C.paving, 1301, 4);
    k.reserve(2, Y(coveU + 26), sx, 46);
    // the jetty: dressed stone, bollards, a lamp at its head
    img.fine(sx - 3, Y(coveU + 3), 25, 7, (X, Yy) => {
      const j = Yy - Y(coveU + 3) * S;
      if (j < 1) return C.granite[4];
      if (j > 17) return j > 19 ? [0x081820, 0.4] : (X % 9 < 1 ? C.granite[0] : C.granite[1]);
      return k.settPx(X, Yy, 14, C.granite);
    });
    for (let x = sx + 3; x < sx + 21; x += 6) img.rectPx(x * S, Y(coveU + 1) * S, 3, 3, 0x24262a);
    k.streetLamp(sx + 20, coveU + 2);
    // sheds along the shore, nets hung to dry, fish boxes
    k.house(4, Y(coveU + 22), 12, 7, 5, 'jp', { wall: 0x7a6a56, bay: 4 });
    k.house(17, Y(coveU + 22), Math.max(8, sx - 19), 7, 5, 'jp', { wall: 0x6e6050, bay: 4 });
    img.fine(4, Y(coveU - 6), 14, 5, (X, Yy) => ((X + Yy) % 4 === 0 || (X - Yy) % 4 === 0 ? 0x3a5a6a : null));
    for (let q = 0; q < 8; q++) img.rectPx((20 + (q % 4) * 2) * S, (Y(coveU - 4) + (q >> 2) * 2) * S, 5, 4, q % 3 ? 0x3a6aa8 : 0xd8d0b8);
    k.crowd(6, Y(coveU - 8), 16, 4, 4);
    // boats moored off the jetty
    const moored = (x, u, col) => objects.push({
      y: Y(u) + 3,
      draw: () => {
        const X0 = x * S;
        const Yy = Y(u) * S;
        for (let i = 0; i < 39; i++) {
          const hw = Math.min(6, 1 + Math.pow(38 - i, 0.72) * 1.5);
          for (let j = -hw; j <= hw; j++) img.px(X0 + i, Yy + j, hw - Math.abs(j) < 1.2 ? (j > 0 ? scaleColor(col, 0.66) : scaleColor(col, 1.2)) : 0xc8c0b0);
          img.px(X0 + i, Yy + hw + 1, 0x081820, 0.4);
        }
        img.rectPx(X0 + 7, Yy - 3, 12, 7, 0xe8e8e0);
        img.rectPx(X0 + 7, Yy - 3, 12, 2, 0x3a4048);
        img.px(X0 + 15, Yy, 0x2a3a4a);
      },
    });
    moored(sx + 3, coveU - 8, 0x2a5a8a);
    moored(sx + 6, coveU + 12, 0xe8e4d8);
    moored(sx + 22, coveU - 2, 0x3a7a5a);
  }
  // the terraced hamlets up the slope: stone walls, mikan orchards in rows, houses, lanes joining the cove
  const terraced = (x0, x1, u0, u1, seed2) => {
    const g = rng(seed2);
    for (let u = u0; u < u1; u += 22) {
      const wob = g() * 4;
      const xr = Math.min(x1, leftShore(u) - 6);
      if (xr - x0 < 6) continue;
      k.stoneFace(x0, xr, Y(u + wob), 2, u, C.rock);
      k.reserve(x0, Y(u + wob + 20), xr - x0, 22);
      img.fine(x0, Y(u + wob + 20), xr - x0, 20, (X, Yy) => k.lawnPx(X, Yy, 0.3 + hashPx(X >> 3, Yy >> 2, 1302) * 0.5, C.grass));
      for (let x = x0 + 3; x < xr - 2; x += 5) for (let q = 0; q < 2; q++) k.tree(x, Y(u + wob + 6 + q * 8), 2.4, MIKAN, x * 7 + u + q);
      if (g() < 0.55) k.house(x0 + Math.floor(g() * Math.max(1, xr - x0 - 13)), Y(u + wob + 18), 12, 6, 5, 'jp', { reserve: true, wall: R.pick(C.walls) });
    }
  };
  terraced(0, 26, 1080, 1270, 1303);
  terraced(0, 30, 1340, 1540, 1304);
  k.road([[8, 1080], [11, 1270], [12, 1274]], 1.5, { side: 0, surface: C.stoneSet });
  k.road([[12, 1340], [10, 1540]], 1.5, { side: 0, surface: C.stoneSet });
  // the shore path, from the cove along the foot of the terraces in both directions
  for (const [a, b] of [[1084, 1286], [1322, 1536]]) {
    const pts = [];
    for (let u = a; u <= b; u += 8) pts.push([leftShore(u) - 3.4, u]);
    k.road(pts, 1.1, { side: 0, surface: C.stoneSet });
  }
  k.forest(0, 60, 990, 1560, [PINE, OAK, CAMPHOR], 101, 4, 7, (x, u) => x < leftShore(u) - 6);
  k.forest(120, W, 1100, 1560, [PINE, OAK], 102, 4, 6, (x, u) => x > rightShore(u) + 4 && (x < 150 || x > 178));

  // the breakwater lights: red to starboard (east), green to port, entering the harbour
  const breakwater = (x0, x1, u, lightX, red) => {
    const a = Math.min(x0, x1);
    const b = Math.max(x0, x1);
    img.fine(a, Y(u) - 2, b - a, 6, (X, Yy) => {
      const j = Yy - (Y(u) - 2) * S;
      if (j < 1) return C.concrete[4];
      if (j < 12) return X % 15 === 0 ? C.concrete[1] : hashPx(X >> 1, Yy >> 1, 1305) < 0.2 ? C.concrete[2] : C.concrete[3];
      return j < 14 ? C.concrete[0] : null;
    });
    // tetrapods heaped along its seaward side, surf among them
    const g = rng(u);
    for (let X = a * S; X < b * S; X += 4) {
      const CX = X + g() * 2;
      const CY = (Y(u) + 4) * S + g() * 6;
      img.discPx(CX, CY, 2.6, C.concrete[1]);
      img.discPx(CX - 0.6, CY - 0.6, 1.6, C.concrete[3]);
      if (g() < 0.5) img.px(CX, CY + 4, 0xe8f4f4, 0.7);
    }
    const y = Y(u);
    const CX = lightX * S + 1;
    objects.push({
      y: y + 2,
      shadow: () => k.shadowRect(lightX + 2, y - 2, 4, 4, 0.6),
      draw: () => {
        const base = red ? [0x8a2018, 0xd8382c, 0xf06048] : [0xa8b0ac, 0xe8ece8, 0xffffff];
        for (let j = 0; j < 42; j++) {
          const hw = 7 - j * 0.05;
          for (let i = -hw; i <= hw; i++) {
            const q = (i + hw) / (2 * hw);
            let c = q < 0.25 ? base[2] : q < 0.75 ? base[1] : base[0];
            if (j % 14 < 3) c = red ? 0xf0e8e0 : 0x3a9a5a;
            img.px(CX + i, y * S - j, c);
          }
        }
        for (let i = -9; i <= 9; i++) for (let j = 0; j < 3; j++) img.px(CX + i, y * S - 43 - j, j === 0 ? 0x5a5e66 : 0x2a2e36);
        for (let i = -9; i <= 9; i += 3) for (let j = 0; j < 3; j++) img.px(CX + i, y * S - 46 - j, 0x3a3e46);
        for (let j = 0; j < 6; j++) for (let i = -3; i <= 3; i++) img.px(CX + i, y * S - 47 - j, red ? 0xff8a70 : 0x8affb0);
        for (let i = -4; i <= 4; i++) img.px(CX + i, y * S - 53, 0x2a2e36);
      },
    });
    const blink = [k.sprite(7, 7, u, (r) => { r.discPx(10, 10, 10, red ? 0xff5040 : 0x50ff90, 0.3); r.discPx(10, 10, 5, red ? 0xff8070 : 0x90ffb0, 0.6); r.discPx(10, 10, 2.4, 0xffffff, 0.95); }, false)];
    kit.loop(lightX - 3, u + 22, blink, { fps: 1, seq: [0, -1, -1, 0, -1, -1, -1, -1], fx: 1 });
  };
  breakwater(rightShore(1060) + 2, 128, 1060, 130, true);
  breakwater(leftShore(1160) - 2, 52, 1160, 50, false);
  // channel buoys, green to port and red to starboard, blinking
  for (const [x, u, red] of [[62, 1000, false], [124, 990, true], [70, 1230, false], [116, 1250, true], [76, 1530, false], [108, 1520, true]]) {
    const y = Y(u);
    const CX = x * S + 1;
    const CY = y * S;
    const col = red ? [0x8a1c18, 0xc8302a, 0xf06a5a] : [0x1a5a30, 0x2a8a4a, 0x5ac87a];
    for (let a = 0; a < 6.3; a += 0.3) img.px(CX + Math.cos(a) * 8, CY + 2 + Math.sin(a) * 4, 0xe8f6f6, 0.55);
    img.discPx(CX + 1, CY + 2, 6.5, 0x061420, 0.5);
    img.discPx(CX, CY, 6, col[0]);
    img.discPx(CX - 0.6, CY - 0.6, 4.8, col[1]);
    img.discPx(CX - 2, CY - 2, 1.6, col[2]);
    for (let j = 0; j < 13; j++) {
      img.px(CX, CY - 2 - j, j % 4 === 0 ? 0xe8e8e0 : col[1]);
      img.px(CX + 1, CY - 2 - j, col[0]);
    }
    img.rectPx(CX - 3, CY - 15, 7, 1, 0x3a3e46);
    const f = [k.sprite(5, 5, u, (r) => { r.discPx(7, 7, 7, red ? 0xff5a40 : 0x5aff90, 0.3); r.discPx(7, 7, 2.4, 0xffffff); }, false)];
    kit.loop(x - 2, u + 7, f, { fps: 1.2, seq: [0, -1, -1, -1], fx: 1 });
  }
  // an anchored freighter waiting for its berth, and a small tanker off the western shore
  const anchored = (x, u, len, wid, hullC, deckC, kind) => {
    const y = Y(u);
    objects.push({
      y,
      shadow: () => {
        for (let Yy = (y - len) * S; Yy < y * S + 6; Yy++) for (let i = 0; i < 8; i++) if (k.wetPx((x + wid) * S + i, Yy)) img.px((x + wid) * S + i, Yy, 0x061420, 0.28 - i * 0.03);
      },
      draw: () => {
        const X0 = x * S;
        const WW = wid * S;
        const Y0 = (y - len) * S;
        const LL = len * S;
        for (let j = 0; j < LL; j++) {
          const t = LL - 1 - j; // the bow at the foot
          const hw = Math.min(WW / 2, 1 + Math.pow(t, 0.62) * (WW / 2 / Math.pow(LL * 0.24, 0.62)));
          for (let i = -hw; i <= hw; i++) {
            const e = hw - Math.abs(i);
            let c = e < 1.3 ? (i > 0 ? scaleColor(hullC, 0.66) : scaleColor(hullC, 1.2)) : e < 3 ? hullC : deckC;
            if (e >= 3 && j % 24 === 0) c = scaleColor(deckC, 0.8);
            img.px(X0 + WW / 2 + i, Y0 + j, c);
          }
        }
        // the white accommodation aft; hatches or pipes
        for (let j = 6; j < 26; j++) for (let i = 5; i < WW - 5; i++) img.px(X0 + i, Y0 + j, j < 8 ? 0xffffff : j > 22 ? 0xa8aca8 : (i + (j >> 2)) % 5 === 0 ? 0x3a4a5a : 0xe8e8e4);
        if (kind === 'cargo') for (let j = 34; j < LL - 26; j += 22) for (let jj = 0; jj < 17; jj++) for (let i = 6; i < WW - 6; i++) img.px(X0 + i, Y0 + j + jj, jj === 0 ? scaleColor(hullC, 1.2) : i % 6 === 0 ? 0x2a4a5a : 0x3a6a7a);
        else for (let j = 30; j < LL - 20; j++) for (const i of [(WW >> 1) - 3, WW >> 1, (WW >> 1) + 3]) img.px(X0 + i, Y0 + j, j % 12 === 0 ? 0xc8c8c0 : 0x8a8a84);
        glowPx(X0 + WW / 2, Y0 + 4, 0xfff4c8, 0.9);
      },
    });
    k.reserve(x, y - len, wid, len);
  };
  anchored(64, 1060, 44, 10, 0x8a3a2a, 0x5a6058, 'cargo');
  anchored(66, 1480, 34, 8, 0x3a5a7a, 0xa8988a, 'tanker');

  // ------------------------------------------------------------ R1 along the eastern shore, the bridge deck
  // the guard rail between the road and the shore rocks; lamps along it
  for (let Yy = Y(1880) * S; Yy < Y(1000) * S; Yy++) {
    const u = 7168 - Yy / S;
    const x = rightShore(u) + 2;
    if (u < 1560 && x < 153) {
      img.px(Math.round(x * S), Yy, Yy % 12 < 2 ? 0x5a6070 : 0xc8ccd0);
      img.px(Math.round(x * S) + 1, Yy, 0x6a7070);
    }
  }
  for (let u = 1110; u < 1880; u += 36) k.streetLamp(155, u);

  // Megami Ōhashi: the deck (a frame of its own so ships pass under it), two A-shaped pylons with fans of stays
  const DU = MEGAMI_U;
  const deckFrame = k.capture(0, Y(DU + 10), W, 20, () => {
    img.fine(0, Y(DU + 10), W, 20, (X, Yy, x, y) => {
      const u = 7168 - y;
      const a = Math.abs(u - DU);
      if (u < DU - 8) {
        // the white box girder's south face, ribbed, darkening down to the water
        const q = (DU - 8 - u) / 2;
        return X % 45 < 2 ? 0x8a9096 : X % 9 < 1 ? scaleColor(0xc8ced2, 1 - q * 0.3) : scaleColor(0xe8ecec, 1 - q * 0.26);
      }
      if (a > 8.34) return null;
      if (a > 7.5) return Yy % 2 ? 0xf4f6f6 : 0xc0c6ca;
      if (a > 6.5) return X % 12 < 2 ? 0x8a9096 : 0xb8bec2;
      let c = k.asphaltPx(X, Yy);
      if (a < 0.5) return X % 9 < 2 ? 0x6a6e72 : 0xc8ccc8; // the median barrier
      if (Math.abs(a - 3.3) < 0.2 && X % 18 < 9) c = 0xd8d4c6;
      if (Math.abs(a - 6) < 0.17) c = 0xc8c4b6;
      return c;
    });
    // lamp posts down both sides, each with its pool on the deck
    for (let x = 8; x < W; x += 16) {
      const X = x * S;
      for (const [uu, dy] of [[DU + 8, -4], [DU - 7, -4]]) {
        const Yy = Y(uu) * S;
        for (let j = 0; j < 9; j++) img.px(X, Yy - j, 0x8a9096);
        for (let i = 0; i < 4; i++) img.px(X + i, Yy - 9, 0x8a9096);
        for (const i of [3, 4]) glowPx(X + i, Yy - 9 + dy * 0, 0xf4f8ff, 0.95);
      }
      pool(x, Y(DU + 3), 5, 0xc8dcff, 0.1 + night(DU) * 0.2);
      pool(x, Y(DU - 3), 5, 0xc8dcff, 0.1 + night(DU) * 0.2);
    }
  }, DU);
  kit.loop(0, DU + 10, [deckFrame], { d: 0.04 });
  // the deck's shadow on the water, soft
  for (let Yy = Y(DU - 9) * S; Yy < Y(DU - 26) * S; Yy++) {
    const q = (Yy - Y(DU - 9) * S) / (17 * S);
    for (let X = 0; X < W * S; X++) if (k.wetPx(X, Yy)) img.px(X, Yy, 0x061420, 0.42 * (1 - q) ** 1.4);
  }
  k.reserve(0, Y(DU + 10), W, 20);
  for (const px of [50, 130]) {
    const frame = k.capture(px - 44, Y(DU + 84), 89, 76, () => {
      const top = DU + 80;
      const CX = px * S + 1;
      const Y8 = Y(DU + 8) * S;
      const YT = Y(top) * S;
      const YC = Y(top - 12) * S; // the legs meet under the crown
      // the stays behind first, the far fan, fine as thread
      for (let q = 1; q <= 13; q++) {
        const d = (3 + q * 3.1) * S;
        const hu = Y(top - 2 - q * 1.5) * S;
        for (const s of [-1, 1]) line(CX + s * 3, hu, CX + s * d, Y(DU - 7) * S, 0xaebcc4, 0.55);
      }
      // the A: two box legs from either side of the deck, tapering to the crown, lit on the left, a cross beam
      for (const s of [-1, 1]) {
        for (let Yy = YC; Yy <= Y8; Yy++) {
          const t = (Yy - YC) / (Y8 - YC);
          const c0 = CX + s * (3 + t * 19);
          const hw = 2.5 + t * 1.8;
          for (let i = -hw; i <= hw; i++) {
            const q = (i + hw) / (2 * hw);
            img.px(Math.round(c0 + i), Yy, q < 0.2 ? 0xffffff : q < 0.65 ? 0xeef0f0 : q < 0.88 ? 0xc0c8ce : 0x96a0a8);
          }
        }
      }
      for (const yy of [Y(DU + 42) * S]) {
        const t = (yy - YC) / (Y8 - YC);
        const hw = 3 + t * 19;
        for (let i = -hw; i <= hw; i++) for (let j = 0; j < 6; j++) img.px(CX + i, yy + j, j < 1 ? 0xffffff : j < 4 ? 0xdde2e4 : 0x9aa4aa);
      }
      // the crown and its anchor boxes
      for (let Yy = YT; Yy < YC + 3; Yy++)
        for (let i = -5; i <= 5; i++) img.px(CX + i, Yy, Yy === YT ? 0xffffff : i < -3 ? 0xffffff : i < 3 ? 0xe4e8ea : 0xa8b2b8);
      for (let Yy = YT + 6; Yy < YC; Yy += 6) for (const i of [-5, 5]) img.rectPx(CX + i - 1, Yy, 3, 2, 0x7a8690);
      // the near fan of stays to the deck's edge
      for (let q = 1; q <= 13; q++) {
        const d = (3 + q * 3.1) * S;
        const hu = Y(top - 2 - q * 1.5) * S;
        for (const s of [-1, 1]) line(CX + s * 2, hu, CX + s * d, Y8, 0xf0f4f4, 0.85);
      }
      // floodlights up the legs, the aircraft warning light on the crown
      for (let Yy = YC + 12; Yy < Y8; Yy += 18) {
        const t = (Yy - YC) / (Y8 - YC);
        for (const s of [-1, 1]) glowPx(CX + s * (3 + t * 19), Yy, 0xeaf4ff, 0.4 + night(DU) * 0.4);
      }
      for (const [i, j, a] of [[0, 0, 1], [1, 0, 0.6], [-1, 0, 0.6], [0, 1, 0.6], [0, -1, 0.6]]) glowPx(CX + i, YT - 2 + j, 0xff6050, a);
    }, DU);
    kit.loop(px - 44, DU + 84, [frame], { d: 0.05 });
    // the pier in the water: a dressed concrete footing, surf round it
    {
      const CX = px * S + 1;
      const CY = Y(DU - 12) * S;
      for (let j = -13; j <= 13; j++)
        for (let i = -33; i <= 33; i++) {
          const d = (i / 32) ** 2 + (j / 12) ** 2;
          if (d > 1) continue;
          img.px(CX + i, CY + j, d > 0.82 ? (i + j > 0 ? C.concrete[0] : C.concrete[4]) : k.settPx(CX + i, CY + j, 13, C.concrete));
        }
      for (let a = 0; a < 6.3; a += 0.08) if (hashPx(Math.round(a * 20), 1, 1306) < 0.65) img.px(CX + Math.cos(a) * 36, CY + Math.sin(a) * 15 + 2, 0xe0f0f0, 0.6);
      for (let i = 0; i < 60; i += 4) for (const s of [-1, 1]) img.px(CX + s * (i * 0.5 + 8), CY + 18 + i * 0.45, 0xd8ecf0, 0.4 - i * 0.005);
    }
  }
  // the road park under the eastern end: a little lawn with benches and a lookout rail, people looking at the bridge
  k.lawnFill(150, Y(DU - 12), 6, 14, C.lawn, 7);
  for (let u = DU - 26; u < DU - 12; u += 6) k.bench(150.5, Y(u), 4);
  k.reserve(150, Y(DU - 12), 6, 14);
  k.crowd(150, Y(DU - 14), 4, 10, 3);

  // ------------------------------------------------------------ the shipyard (west), u = 1560..1900
  const SX = 58;
  img.fine(0, Y(1880), SX, 330, (X, Yy, x, y) => {
    // great concrete slabs, joints and old stains, the craneway's two rails down the quay
    const flag = 45;
    if (X % flag === 0 || Yy % flag === 0) return 0x4e4c48;
    let c = rampColor(C.quay, 0.3 + hashPx(Math.floor(X / flag), Math.floor(Yy / flag), 1307) * 0.4 + (fbm(x, y, { seed: 1308, scale: 9 }) - 0.5) * 0.4, X, Yy);
    const g = hashPx(X, Yy, 1309);
    if (g < 0.05) c = scaleColor(c, 0.9);
    else if (g > 0.98) c = scaleColor(c, 1.08);
    if (fbm(x, y, { seed: 1310, scale: 4, octaves: 2 }) > 0.68) c = scaleColor(c, 0.84);
    for (const rx of [47, 53]) {
      const q = Math.abs(x - rx);
      if (q < 0.34) c = 0xc8ccd0;
      else if (q < 0.67) c = 0x3a3c40;
    }
    if (Math.abs(x - 44.5) < 0.2 && Yy % 18 < 9) c = 0xe8c838; // the yellow safety line
    return c;
  });
  for (let u = 1590; u < 1870; u += 14) {
    // bollards and fenders along the fitting-out quay
    const Yy = Y(u) * S;
    img.discPx((SX - 2) * S, Yy, 2.6, 0x24262a);
    img.px((SX - 2) * S - 1, Yy - 1, 0x6a6e74);
    for (let j = -4; j < 8; j++) for (let i = 0; i < 3; i++) img.px(SX * S + i - 1, Yy + j, i ? 0x14161a : 0x2a2c30);
  }
  // sawtooth-roofed workshops
  const workshop = (x, u, w, h) => {
    const y = Y(u + h);
    objects.push({
      y: Y(u),
      shadow: () => k.shadowRect(x + 3, y + 3, w, h, 0.5),
      draw: () => {
        const X0 = x * S;
        const WW = w * S;
        const Y0 = y * S;
        const HH = (h - 5) * S;
        for (let j = 0; j < HH; j++)
          for (let i = 0; i < WW; i++) {
            const t = j % 15;
            let c = t < 4 ? (i % 6 < 1 ? 0x5a7a8a : 0xa8c8d4) : t < 5 ? 0x4a5a64 : scaleColor(0x8a949a, 1 - (t - 5) * 0.03);
            if (t >= 5 && i % 3 === 0) c = scaleColor(c, 0.9);
            if (i < 2) c = scaleColor(c, 1.14);
            if (i >= WW - 2) c = scaleColor(c, 0.7);
            img.px(X0 + i, Y0 + j, c);
          }
        const FY = Y0 + HH;
        for (let j = 0; j < 15; j++)
          for (let i = 0; i < WW; i++) {
            let c = j < 2 ? 0x4a5058 : (i >> 1) % 4 === 0 ? 0x7e8488 : 0x8e9498;
            if (j >= 3 && j < 8 && i % 12 > 2 && i % 12 < 10) c = night(u) > 0.2 && hashPx(Math.floor(i / 12), u, 1311) < 0.7 ? 0xffe8b0 : 0x3a4a58;
            if (i >= WW - 2) c = scaleColor(c, 0.7);
            img.px(X0 + i, FY + j, c);
          }
        const DX = X0 + (WW >> 1) - 12;
        for (let j = 2; j < 15; j++) for (let i = 0; i < 24; i++) img.px(DX + i, FY + j, j % 3 === 0 ? 0x2a2e34 : 0x3e4248);
      },
    });
    k.reserve(x - 1, y - 1, w + 2, h + 2);
  };
  workshop(2, 1578, 36, 34);
  workshop(2, 1842, 40, 32);
  // the stockyard: stacks of steel plate, pipes, hull blocks under construction, containers; hard hats going about
  for (let i = 0; i < 12; i++) {
    const x = 5 + (i % 3) * 11;
    const u = 1622 + Math.floor(i / 3) * 10;
    const col = [0x6a4a3a, 0x7a5a48, 0x5a5048][i % 3];
    const X = x * S;
    const Yy = Y(u) * S;
    for (let q = 0; q < 4; q++) for (let ii = 0; ii < 27; ii++) for (let j = 0; j < 5; j++) img.px(X + ii + q, Yy - q * 2 + j, j === 0 ? scaleColor(col, 1.3) : j === 4 ? scaleColor(col, 0.6) : (ii + q) % 7 === 0 ? scaleColor(col, 0.8) : col);
    img.rectPx(X + 2, Yy + 8, 29, 2, 0x101418, 0.4);
  }
  // pipes in a heap
  for (let q = 0; q < 14; q++) {
    const row = q < 5 ? 0 : q < 9 ? 1 : q < 12 ? 2 : 3;
    const Yy = (Y(1668) * S) - row * 4 + 8 * q % 2;
    for (let i = 0; i < 48; i++) {
      img.px(6 * S + i, Yy + (q % 5) * 4, 0xa8b2ba);
      img.px(6 * S + i, Yy + (q % 5) * 4 + 1, 0x6a7680);
    }
    img.px(6 * S, Yy + (q % 5) * 4, 0x1a1e24);
  }
  // a hull block on its stands: a curved steel section, primer red, its ribs showing
  {
    const X0 = 8 * S;
    const Y0 = Y(1712) * S;
    for (let j = 0; j < 66; j++)
      for (let i = 0; i < 96; i++) {
        const e = Math.min(i, 95 - i, j, 65 - j);
        const curve = (i / 95 - 0.5) ** 2 * 18;
        let c = 0x8a3a2a;
        if (i % 12 < 2) c = 0xa84a34;
        if (j % 12 < 1) c = 0x6a2a20;
        if (e < 2) c = 0xc06040;
        c = scaleColor(c, 1 - curve * 0.05);
        if (hashPx(i >> 2, j >> 2, 1312) < 0.08) c = 0x7a7a70;
        img.px(X0 + i, Y0 + j, c);
      }
    for (let i = 0; i < 96; i++) for (let j = 0; j < 7; j++) img.tintPx(X0 + i + 4, Y0 + 66 + j, 0.62);
  }
  // containers
  for (const [x, u, c] of [[4, 1730, 0x2a5a8a], [18, 1730, 0xa83a2a], [32, 1730, 0x3a7a5a], [4, 1742, 0xc8a030], [18, 1742, 0x5a6a7a]]) {
    const X = x * S;
    const Yy = Y(u) * S;
    for (let j = 0; j < 18; j++) for (let i = 0; i < 36; i++) img.px(X + i, Yy + j, j === 0 ? scaleColor(c, 1.3) : j === 17 ? scaleColor(c, 0.6) : i % 3 === 0 ? scaleColor(c, 0.84) : c);
    for (let i = 0; i < 36; i++) for (let j = 0; j < 3; j++) img.tintPx(X + i + 2, Yy + 18 + j, 0.66);
  }
  k.reserve(0, Y(1760), 44, 180);
  for (const [x, y, n] of [[20, Y(1700), 4], [6, Y(1776), 4], [28, Y(1610), 3], [40, Y(1770), 3]]) k.crowd(x, y, 16, 8, n, [0x3a5a8a, 0x2a3a5a, 0xc86a2a]);
  // the dry dock opening east onto the harbour, a coaster on its keel blocks inside, the caisson gate
  {
    const u0 = 1790;
    const u1 = 1822;
    const y0 = Y(u1);
    const y1 = Y(u0);
    img.fine(4, y0, SX - 4, y1 - y0, (X, Yy) => {
      const e = Math.min(X - 4 * S, Yy - y0 * S, y1 * S - 1 - Yy);
      if (e < 12) {
        // the altars: stepped walls down to the dock floor
        const q = e % 3;
        return q === 0 ? scaleColor(C.concrete[3], 1 - e * 0.04) : q === 1 ? scaleColor(C.concrete[1], 1 - e * 0.04) : scaleColor(C.concrete[0], 0.8 - e * 0.02);
      }
      const c = rampColor([0x34302c, 0x403c36, 0x4a4640], hashPx(X >> 2, Yy >> 2, 1313), X, Yy);
      return Yy % 18 < 2 ? 0x2a2824 : c;
    });
    // the ship: red bottom, grey topsides, a white bridge at the stern; its keel blocks and shores
    const HY0 = (y0 + 7) * S;
    const HY1 = (y0 + 25) * S;
    const HX0 = 10 * S;
    const HX1 = 52 * S;
    const mid = (HY0 + HY1) / 2;
    for (let i = 0; i < 12; i++) img.rectPx(HX0 + i * 10, HY1 + 4, 6, 3, 0x7a6a50);
    for (let X = HX0; X < HX1; X += 15) for (const s of [HY0 - 7, HY1 + 1]) for (let j = 0; j < 6; j++) img.px(X, s + j, 0x8a7a58);
    for (let X = HX0; X < HX1; X++) {
      const t = HX1 - 1 - X;
      const hw = Math.min((HY1 - HY0) / 2, 1 + Math.pow(t, 0.66) * 3);
      for (let j = -hw; j <= hw; j++) {
        const e = hw - Math.abs(j);
        let c = e < 3 ? 0x8a2a24 : e < 5 ? 0x4a525a : 0x6e7a82;
        if (e >= 5 && (X - HX0) % 24 < 2) c = 0x4a545c;
        if (e >= 7 && X - HX0 > 36 && X - HX0 < 96 && (X - HX0) % 24 > 3) c = 0x56606a;
        if (j < 0 && e < 2) c = 0xc05048;
        img.px(X, mid + j, c);
      }
    }
    for (let j = -16; j <= 16; j++) for (let i = 0; i < 27; i++) img.px(HX0 + 4 + i, mid + j, Math.abs(j) > 14 ? 0xc8c8c4 : j < -11 ? 0xffffff : (i >> 2) % 3 === 0 && Math.abs(j) < 9 ? 0x3a4a5a : 0xe8e8e4);
    img.rectPx(HX0 + 18, mid - 5, 6, 10, 0xc83a2a);
    img.rectPx(HX0 + 18, mid - 5, 6, 3, 0x1a1a1e);
    // the caisson closing the dock
    for (let j = (y0 + 3) * S; j < (y0 + 29) * S; j++) for (let i = 0; i < 9; i++) img.px((SX - 3) * S + i, j, i < 2 ? 0xa8b0b6 : i > 6 ? 0x3a4248 : j % 12 < 2 ? 0x4a5258 : 0x5a6268);
    k.reserve(4, y0, SX - 4, y1 - y0);
    // welding sparks on the ship's flank
    const spark = [0, 1, 2].map((f) => k.sprite(5, 5, 1800, (r) => {
      for (let q = 0; q < 8; q++) {
        const a = q * 0.8 + f;
        r.px(7 + Math.cos(a) * (2 + f * 2), 7 + Math.sin(a) * (2 + f * 2), q % 2 ? 0xffd080 : 0xffffff, 0.9 - f * 0.25);
      }
      r.discPx(7, 7, 1.5, 0xffffff);
    }, false));
    kit.loop(30, 1800, spark, { fps: 9, seq: [0, 1, 2, -1, -1, -1, 0, 1, 2, -1, -1, -1, -1, -1, -1, -1], fx: 1 });
    kit.loop(40, 1814, spark, { fps: 8, seq: [-1, -1, -1, -1, 0, 1, 2, -1, -1, 0, 1, 2, -1, -1, -1], fx: 1 });
  }
  // the goliath gantry crane straddling the dock, red and white
  {
    const y = Y(1830);
    objects.push({
      y: Y(1786),
      shadow: () => k.shadowRect(4, y + 6, 54, 6, 0.55),
      draw: () => {
        for (const x of [4, 54]) {
          const X = x * S;
          for (let j = 0; j < 44 * S; j++)
            for (let i = 0; i < 9; i++) {
              const c = i < 2 ? 0xffffff : i > 6 ? 0x8a8a86 : (j >> 4) % 2 ? 0xc83a30 : 0xe8e8e4;
              img.px(X + i, y * S + j, c);
            }
          img.rectPx(X - 3, (y + 44) * S - 3, 15, 5, 0x3a3e44);
        }
        for (let j = 0; j < 21; j++)
          for (let i = 3 * S; i < 59 * S; i++) {
            let c = j < 2 ? 0xf06a5a : j > 18 ? 0x7a1e16 : 0xc83a30;
            if (j >= 4 && j <= 16) c = (i + j) % 18 < 2 || (i - j) % 18 < 2 ? 0xe85848 : 0x5a1a14;
            img.px(i, (y - 7) * S + j, c);
          }
        // the trolley with its operator's cab and the lifting tackle
        for (let j = 0; j < 15; j++) for (let i = 0; i < 33; i++) img.px(25 * S + i, (y - 11) * S + j, j < 2 ? 0xffffff : i > 29 ? 0x9a9e9e : (i >> 2) % 3 === 0 && j > 5 && j < 11 ? 0x3a4a5a : 0xe8e8e4);
        for (let j = 0; j < 60; j++) for (const i of [8, 24]) img.px(25 * S + i, (y - 2) * S + j, 0x2a2e34, 0.75);
        for (const X of [4 * S + 3, 58 * S]) glowPx(X, (y - 8) * S, 0xff5040);
      },
    });
  }
  // the LNG carrier at the fitting-out quay: four Moss spheres, the pipe gallery, a white superstructure aft
  {
    const x0 = 60;
    const x1 = 86;
    const y0 = Y(1770);
    const y1 = Y(1600);
    objects.push({
      y: y1,
      shadow: () => {
        for (let Yy = (y0 + 4) * S; Yy < (y1 + 4) * S; Yy++) for (let i = 0; i < 14; i++) if (k.wetPx(x1 * S + i, Yy)) img.px(x1 * S + i, Yy, 0x061420, 0.34 - i * 0.022);
      },
      draw: () => {
        const X0 = x0 * S;
        const WW = (x1 - x0) * S;
        const Y0 = y0 * S;
        const LL = (y1 - y0) * S;
        const CX = X0 + WW / 2;
        for (let j = 0; j < LL; j++) {
          const t = LL - 1 - j;
          const hw = Math.min(WW / 2, 1.5 + Math.pow(t, 0.56) * (WW / 2 / Math.pow(LL * 0.14, 0.56)));
          const aft = Math.min(WW / 2, WW / 2 - Math.max(0, 12 - j) * 0.8);
          const H = Math.min(hw, aft);
          for (let i = -H; i <= H; i++) {
            const e = H - Math.abs(i);
            let c;
            if (e < 1.5) c = i > 0 ? 0x8a2a24 : 0xc04a3e;
            else if (e < 4) c = i > 0 ? 0x1e262c : 0x3e4a52;
            else {
              // the deck in faded green, its seams and fittings
              c = 0x5e6e60;
              if (j % 30 < 2) c = 0x4a584c;
              if ((Math.round(i) + 200) % 18 === 0) c = 0x6a7a6c;
              if (hashPx(Math.round(CX + i) >> 2, j >> 2, 1314) < 0.05) c = 0x4e5c50;
            }
            img.px(CX + i, Y0 + j, c);
          }
        }
        // the long pipe gallery down the deck, its walkway above the domes
        for (let j = 64; j < LL - 40; j++) {
          for (let i = -3; i <= 3; i++) img.px(CX + i - 22, Y0 + j, j % 15 === 0 ? 0xc8c8c0 : i % 2 ? 0xa8a8a0 : 0x6a6a64);
        }
        // the four domes: shaded spheres with a pale equator band, a ladder over the top, the dome house
        for (let i = 0; i < 4; i++) {
          const cy = Y0 + 132 + i * 90;
          const r = 35;
          for (let yy = -r - 2; yy <= r + 8; yy++) for (let xx = -r - 2; xx <= r + 8; xx++) if (Math.hypot(xx - 5, yy - 6) < r) img.tintPx(CX + xx, cy + yy, 0.8);
          for (let yy = -r; yy <= r; yy++)
            for (let xx = -r; xx <= r; xx++) {
              const d = Math.hypot(xx + 0.5, yy + 0.5) / r;
              if (d > 1) continue;
              const nz = Math.sqrt(1 - d * d);
              const v = ((-(xx + 0.5) / r) * 0.55 - ((yy + 0.5) / r) * 0.6 + nz * 0.58) * 0.6 + 0.45;
              let c = rampColor([0x8a8676, 0xb4ae9a, 0xd8d2bc, 0xf2ecd8], v, CX + xx, cy + yy);
              if (Math.abs(yy + r * 0.05) < 2 && d > 0.3) c = scaleColor(c, 0.84);
              if (Math.abs(xx) < 1.2 && yy < 0) c = hashPx(0, yy >> 1, 1315) < 0.5 ? 0x7a7a70 : 0x5a5a52;
              img.px(CX + xx, cy + yy, c);
            }
          // the tank dome on its crown
          img.discPx(CX - 1, cy - 2, 7, 0x8a8676);
          img.discPx(CX - 2, cy - 3, 5.4, 0xc8c2ac);
          for (const q of [-4, 0, 4]) img.rectPx(CX + q - 1, cy - 3, 2, 2, 0x5a5a50);
          // a mooring light at its top
          glowPx(CX, cy - 8, 0xfff4c8, 0.7 + night(1700) * 0.3);
        }
        // the superstructure aft, in steps, its lit bridge windows facing forward
        const SY = Y0 + 12;
        for (let j = 0; j < 54; j++)
          for (let i = 9; i < WW - 9; i++) {
            const c = j < 3 ? 0xffffff : i > WW - 12 ? 0xa8aca8 : j >= 42 ? 0xe8e8e4 : 0xf0f0ec;
            img.px(X0 + i, SY + j, c);
          }
        for (let j = 0; j < 4; j++) for (let i = 3; i < WW - 3; i++) img.px(X0 + i, SY + 36 + j, j < 1 ? 0xffffff : 0xc8c8c4); // the bridge wings
        k.panes(x0 + 4, (SY + 40) / S, x1 - x0 - 8, 5, 1700, { bay: 2, row: 2, pw: 1, ph: 1 });
        for (let j = 0; j < 15; j++) for (let i = 0; i < 18; i++) img.px(X0 + 30 + i, SY + 6 + j, j < 5 ? 0x1a1a1e : i < 3 ? 0x4a8aba : 0x2a5a8a);
        for (let j = 0; j < 6; j++) for (const i of [12, 66]) img.px(X0 + i, SY + 22 + j, 0xf08a2a);
      },
    });
    k.reserve(x0, y0, x1 - x0 + 4, y1 - y0);
    // the gangway and the mooring lines to the quay
    for (let j = 0; j < 6; j++) for (let i = 0; i < 12; i++) img.px(SX * S + i, Y(1712) * S + j, j < 1 || j > 4 ? 0xe8e8e0 : i % 3 ? 0xa8aca8 : 0x6a7078);
    for (const u of [1620, 1660, 1740]) line((SX - 2) * S, Y(u) * S, (x0 + 1) * S, Y(u + 4) * S, 0xd8d4c0, 0.85);
  }
  // the Giant Cantilever Crane (1909): a lattice tower on the quay, its long hammerhead jib out over the ship
  {
    const cx = 44;
    const base = Y(1690);
    const top = base - 58;
    objects.push({
      y: base,
      shadow: () => {
        k.shadowRect(cx - 2, base - 6, 14, 10, 0.5);
        for (let i = 0; i < 40; i++) for (let j = 0; j < 3; j++) img.tintPx(cx * S + 20 + i * 6, (base + 2) * S + j, 0.82);
      },
      draw: () => {
        const steel = 0x2e3a44;
        const hi = 0x6a7a86;
        const CX = cx * S + 1;
        const YB = base * S;
        const YT = top * S;
        const half = (Yy) => 18 - ((YB - Yy) / (YB - YT)) * 6;
        // the four legs, the panels between them with their diagonal braces, rivets catching the light
        for (let Yy = YT; Yy < YB; Yy++) {
          const h = half(Yy);
          for (const [s, c] of [[-1, hi], [1, steel]])
            for (let i = 0; i < 3; i++) img.px(CX + s * h + i - 1, Yy, c);
          img.px(CX - h * 0.4, Yy, 0x1e2830);
          img.px(CX + h * 0.4, Yy, 0x1e2830);
        }
        for (let Yy = YB - 15; Yy > YT; Yy -= 15) {
          const h = half(Yy);
          const h2 = half(Yy + 15);
          line(CX - h2, Yy + 15, CX + h, Yy, hi);
          line(CX + h2, Yy + 15, CX - h, Yy, steel);
          for (let i = -h; i <= h; i++) {
            img.px(CX + i, Yy, hi);
            img.px(CX + i, Yy + 1, steel);
          }
        }
        // the jib: a deep lattice girder, long arm east over the ship, short counterweight arm west
        const JX0 = (cx - 22) * S;
        const JX1 = (cx + 56) * S;
        const JT = YT - 21;
        for (let X = JX0; X < JX1; X++) {
          for (let j = 0; j < 2; j++) {
            img.px(X, JT + j, j ? steel : hi);
            img.px(X, YT - 1 + j, j ? 0x1e2830 : steel);
          }
        }
        for (let X = JX0; X < JX1; X += 12) {
          line(X, YT, X + 6, JT, hi);
          line(X + 6, JT, X + 12, YT, steel);
          for (let j = JT; j < YT; j += 2) img.px(X, j, 0x1e2830);
        }
        // the counterweight in the short arm; the machinery house on top with its row of windows
        for (let j = JT + 2; j < YT; j++) for (let i = 0; i < 24; i++) img.px(JX0 + i, j, i < 2 ? 0x5a5e66 : i > 21 ? 0x1e2228 : 0x3a3e44);
        for (let j = 0; j < 18; j++)
          for (let i = -15; i <= 15; i++) {
            let c = j < 2 ? 0x8a9aa6 : i > 13 ? 0x2e3840 : 0x4a5660;
            if (j > 6 && j < 12 && (i + 30) % 6 < 3) c = night(1690) > 0.1 ? 0xffe0a0 : 0x8ab0c4;
            img.px(CX + i, JT - 18 + j, c);
          }
        // the trolley and the hook over the ship, its load
        const TX = (cx + 30) * S;
        img.rectPx(TX, YT + 1, 15, 5, 0x8a6a2a);
        img.rectPx(TX, YT + 1, 15, 1, 0xc89a44);
        for (let j = 0; j < 72; j++) {
          img.px(TX + 4, YT + 6 + j, 0xa8b0b6, 0.85);
          img.px(TX + 10, YT + 6 + j, 0xa8b0b6, 0.85);
        }
        img.rectPx(TX + 3, YT + 78, 9, 6, 0xd8a020);
        img.px(TX + 7, YT + 85, 0x2a2a2a);
        for (const [X, Yy] of [[JX0, JT], [JX1 - 1, JT], [CX, JT - 19]]) {
          glowPx(X, Yy, 0xff4030);
          glowPx(X + 1, Yy, 0xff4030, 0.6);
        }
      },
    });
  }

  // ------------------------------------------------------------ Matsugae terminal (east), u = 1560..1900
  {
    const QX = 124;
    img.fine(QX, Y(1880), 31, 320, (X, Yy, x, y) => {
      const flag = 36;
      const XX = X + (Math.floor(Yy / flag) % 2) * 18;
      if (XX % flag === 0 || Yy % flag === 0) return scaleColor(C.plaza[0], 0.76);
      let c = rampColor(C.plaza, 0.25 + hashPx(Math.floor(XX / flag), Math.floor(Yy / flag), 1316) * 0.4 + (fbm(x, y, { seed: 1317, scale: 8 }) - 0.5) * 0.25, X, Yy);
      const g = hashPx(X, Yy, 1318);
      if (g < 0.05) c = scaleColor(c, 0.92);
      if (Math.abs(x - (QX + 2.5)) < 0.2 && Yy % 18 < 9) c = 0xe8c838;
      return c;
    });
    k.reserve(QX, Y(1880), 31, 320);
    for (let u = 1580; u < 1880; u += 12) {
      const Yy = Y(u) * S;
      img.discPx((QX + 1) * S, Yy, 2.4, 0x24262a);
      img.px((QX + 1) * S - 1, Yy - 1, 0x6a6e74);
      for (let j = -4; j < 8; j++) for (let i = 0; i < 3; i++) img.px((QX - 1) * S + i, Yy + j, i < 2 ? 0x14161a : 0x2a2c30);
    }
    // the terminal: a long low hall under a curved green roof, its glazed waiting room facing the ship, skylights
    const ty = Y(1730);
    objects.push({
      y: Y(1660),
      shadow: () => k.shadowRect(QX + 8, ty + 4, 26, 70, 0.5),
      draw: () => {
        const X0 = (QX + 6) * S;
        const WW = 22 * S;
        const Y0 = ty * S;
        const HH = 60 * S;
        for (let Yy = Y0; Yy < Y0 + HH; Yy++)
          for (let i = 0; i < WW; i++) {
            const t = i / WW;
            let c = rampColor(C.copper, 0.9 - Math.abs(t - 0.35) * 1.3, X0 + i, Yy);
            if ((Yy - Y0) % 18 < 2) c = scaleColor(c, 0.8);
            if (i % 9 === 0) c = scaleColor(c, 0.92);
            if (Math.abs(t - 0.35) < 0.05 && (Yy - Y0) % 36 > 6 && (Yy - Y0) % 36 < 30) c = (i + Yy) % 5 === 0 ? 0xd8f0f4 : 0x9ac8d4; // the roof light
            img.px(X0 + i, Yy, c);
          }
        for (let j = 0; j < 30; j++)
          for (let i = 0; i < WW; i++) {
            let c = j < 3 ? 0xe8ecec : j > 26 ? 0x6a6e72 : 0x5a84a0;
            if (j >= 3 && j <= 26) {
              if (i % 12 < 2) c = 0xc8ccd0;
              else if (j % 12 < 1) c = 0x8a9aa4;
              else if (night(1700) > 0.1) c = hashPx(Math.floor(i / 12), Math.floor(j / 12), 1319) < 0.7 ? 0xffe4a8 : 0x4a6a80;
              else if ((i + j) % 11 === 0) c = 0xb0d4e4;
            }
            if (i >= WW - 2) c = scaleColor(c, 0.7);
            img.px(X0 + i, Y0 + HH + j, c);
          }
        for (let j = 9; j < 30; j++) for (let i = 24; i < 42; i++) img.px(X0 + i, Y0 + HH + j, (i - 24) % 9 < 1 ? 0x2a2e34 : 0x3a4a58);
      },
    });
    k.reserve(QX + 5, ty - 1, 24, 72);
    // the boarding bridge from the terminal to the liner's side, covered
    for (let j = 0; j < 9; j++) for (let i = 0; i < 39; i++) img.px((QX - 6) * S + i, Y(1696) * S + j, j < 1 ? 0xffffff : j > 7 ? 0x6a7078 : i % 6 < 1 ? 0xa8aeb4 : 0xd8e8ec);
    // buses and taxis waiting in the forecourt, people queueing to board
    const parked = (x, u, l, c, bus) => {
      const X = x * S;
      const Yy = Y(u) * S;
      const LL = l * S;
      const HH = (bus ? 5 : 4) * S;
      for (let j = 0; j < HH; j++)
        for (let i = 0; i < LL; i++) {
          if ((i < 1 || i >= LL - 1) && (j < 1 || j >= HH - 1)) continue;
          const e = Math.min(j, HH - 1 - j);
          let col = e < 1 ? scaleColor(c, j === 0 ? 1.2 : 0.7) : c;
          if (bus && i >= 6 && i < LL - 8 && j >= 5 && j < 10) col = (i - 6) % 9 < 6 ? (j === 5 ? 0xe0e4e8 : 0xa8aeb4) : c;
          if (!bus && i >= 4 && i < 7 && e > 0) col = 0x283440;
          if (!bus && i >= LL - 6 && i < LL - 4 && e > 0) col = 0x34404c;
          if (bus && i > LL - 5 && e > 0) col = 0x2a3440;
          img.px(X + i, Yy + j, col);
        }
      for (let i = 0; i < LL; i++) for (let j = 0; j < 3; j++) img.tintPx(X + i + 1, Yy + HH + j, 0.7);
    };
    for (const [u, c, l] of [[1612, 0xe8e8e0, 12], [1626, 0x3a7a5a, 12], [1640, 0xe8e8e0, 12]]) parked(QX + 18, u, l, c, true);
    for (const [u, c] of [[1752, 0xe8c040], [1764, 0x2a2a30], [1776, 0xe8c040], [1788, 0x3a609c], [1800, 0xe8c040]]) parked(QX + 23, u, 7, c, false);
    k.crowd(QX + 8, Y(1660), 14, 6, 14);
    k.crowd(QX + 2, Y(1706), 4, 12, 8);
    for (const [x, u] of [[QX + 3, 1612], [QX + 12, 1612], [QX + 3, 1640], [QX + 12, 1640], [QX + 4, 1790], [QX + 14, 1790]]) k.stoneLantern(x, u, true);
    k.strollers(QX + 12, 1760, 8, 40, 4);
    // the cruise liner moored along the quay: bow to the south, terraced white decks, balconies, pools, funnel, lifeboats
    const x0 = 96;
    const x1 = 122;
    const y0 = Y(1772);
    const y1 = Y(1588);
    objects.push({
      y: y1,
      shadow: () => {
        for (let Yy = (y0 + 6) * S; Yy < (y1 + 5) * S; Yy++) for (let i = 0; i < 15; i++) if (k.wetPx(x0 * S - 1 - i, Yy)) img.px(x0 * S - 1 - i, Yy, 0x061420, 0.3 - i * 0.018);
      },
      draw: () => {
        const X0 = x0 * S;
        const WW = (x1 - x0) * S;
        const Y0 = y0 * S;
        const LL = (y1 - y0) * S;
        const CX = X0 + WW / 2;
        const hwAt = (j) => {
          const t = LL - 1 - j;
          return Math.min(WW / 2, 1.5 + Math.pow(t, 0.54) * (WW / 2 / Math.pow(LL * 0.16, 0.54)));
        };
        const nt = night(1700);
        for (let j = 0; j < LL; j++) {
          const H = hwAt(j);
          for (let i = -H; i <= H; i++) {
            const e = H - Math.abs(i);
            let c;
            if (e < 1.3) c = i > 0 ? 0xc8ccd0 : 0xffffff;
            else if (e < 7 && j < LL - 110) {
              // the balconies down the ship's side, each with its window, some lit
              const row = j % 9;
              c = row < 2 ? 0xffffff : e < 3 ? 0xd8dcdc : 0x3a5a7a;
              if (row >= 2 && hashPx(Math.round(i), Math.floor(j / 9), 1320) < 0.25 + nt * 0.5) c = 0xffe0a0;
            } else if (e < 15 && j > 40 && j < LL - 140) {
              // the teak promenade with its row of loungers, the rail
              c = (j >> 1) % 3 === 0 ? 0xa87a4a : 0xba8c5a;
              if (e < 8.5) c = 0xffffff;
              if (e > 11 && j % 9 < 5) c = 0xf8f4e8;
            } else {
              c = 0xeceeea;
              if (j % 45 < 1) c = 0xc8cccc;
              if ((Math.round(i) + 200) % 27 === 0) c = 0xd8dcdc;
            }
            img.px(CX + i, Y0 + j, c);
          }
        }
        // lifeboats in orange along both sides, under their davits
        for (let j = 72; j < LL - 170; j += 27) {
          for (const s of [-1, 1])
            for (let jj = 0; jj < 18; jj++)
              for (let q = 0; q < 6; q++) {
                const X = CX + s * (WW / 2 - 10 - q);
                img.px(X, Y0 + j + jj, jj < 2 || jj > 15 ? 0xc86a1a : q < 2 && s < 0 ? 0xf8a84a : 0xf08a2a);
              }
        }
        // the pool deck: two blue pools and a sliding roof, loungers, the sports court, the buffet's skylights
        const pool2 = (py, hh) => {
          for (let j = -3; j < hh + 3; j++)
            for (let i = -17; i < 17; i++) {
              const e = Math.min(i + 17, 16 - i, j + 3, hh + 2 - j);
              let c = e < 2 ? 0xa87a4a : e < 3 ? 0xf0f0ec : (i + j * 2) % 13 === 0 ? 0xa8ecff : j < 3 ? 0x7ad8f4 : 0x2aa8d8;
              img.px(CX + i, Y0 + py + j, c);
            }
          for (let q = -2; q < hh + 2; q += 5) for (const s of [-24, 21]) img.rectPx(CX + s, Y0 + py + q, 4, 3, q % 2 ? 0xf8f4e8 : 0xe8a050);
        };
        pool2(222, 30);
        pool2(300, 30);
        for (let j = 0; j < 45; j++) for (let i = -21; i <= 21; i++) img.px(CX + i, Y0 + 96 + j, Math.abs(i) > 19 || j < 2 || j > 42 ? 0xf0f0e8 : j === 22 ? 0xf0f0e8 : Math.abs(i) === 0 ? 0xf0f0e8 : 0x3a7a5a);
        for (let j = 0; j < 30; j++) for (let i = -18; i <= 18; i++) img.px(CX + i, Y0 + 262 + j, j % 6 === 0 || (i + 40) % 6 === 0 ? 0xc8cccc : nt > 0.1 ? 0xffe4a8 : 0x9ac8dc);
        // the funnel: red with a black top and a gold crest, its plume
        for (let j = 0; j < 36; j++)
          for (let i = -13; i <= 13; i++) {
            const c = j < 9 ? 0x1a1a1e : i < -10 ? 0xf06a5a : i > 10 ? 0x8a1c18 : 0xc8302a;
            img.px(CX + i, Y0 + 162 + j, c);
          }
        img.discPx(CX, Y0 + 184, 5, C.gold);
        for (let i = -15; i <= 15; i++) for (let j = 0; j < 4; j++) img.tintPx(CX + i + 3, Y0 + 198 + j, 0.7);
        // the bridge across the bow end of the superstructure, its wings, lit windows; the mast above it
        const BR = LL - 170;
        for (let j = 0; j < 15; j++) for (let i = -WW / 2 + 1; i < WW / 2 - 1; i++) img.px(CX + i, Y0 + BR + j, j < 2 ? 0xffffff : j > 12 ? 0xb8bcbc : (i + 60) % 5 < 3 && j > 4 ? (nt > 0.1 ? 0xffe0a0 : 0x3a5a7a) : 0xf0f0ec);
        for (let j = 0; j < 21; j++) img.px(CX, Y0 + BR - 21 + j, 0x5a5e66);
        for (let i = -6; i <= 6; i++) img.px(CX + i, Y0 + BR - 15, 0x5a5e66);
        glowPx(CX, Y0 + BR - 22, 0xffffff);
        // the helipad and the mooring gear on the forecastle
        const HY = LL - 104;
        for (let j = -18; j <= 18; j++)
          for (let i = -18; i <= 18; i++) {
            const d = Math.hypot(i, j);
            if (d > 18) continue;
            img.px(CX + i, Y0 + HY + j, d > 16 ? 0xffffff : (Math.abs(i) < 8 && Math.abs(i) > 4 && Math.abs(j) < 9) || (Math.abs(i) <= 5 && Math.abs(j) < 2) ? 0xffffff : 0x4e7a8a);
          }
        for (const [q, jj] of [[-8, LL - 62], [8, LL - 62], [0, LL - 44]]) {
          img.discPx(CX + q, Y0 + jj, 3.4, 0x5a5e66);
          img.discPx(CX + q - 0.6, Y0 + jj - 0.6, 2, 0x8a8e94);
        }
        for (let j = LL - 56; j < LL - 8; j++) img.px(CX, Y0 + j, 0xc8cccc);
        // windows on the stern (north end)
        for (let j = 3; j < 18; j += 4) for (let i = -WW / 2 + 5; i < WW / 2 - 5; i += 4) img.rectPx(CX + i, Y0 + j, 2, 2, hashPx(i, j, 1321) < 0.3 + nt * 0.5 ? 0xffe0a0 : 0x3a5a7a);
        pool((x0 + x1) / 2, y0 + 30, 26, C.warm, 0.05 + nt * 0.14);
      },
    });
    k.reserve(x0 - 1, y0, x1 - x0 + 2, y1 - y0);
    // the funnel's plume, and passengers along the promenade
    kit.emit((x0 + x1) / 2, 1772 - 60, [[k.kit.frame(k.puff(6, 41, [0x8a8a92, 0xa8a8b0, 0xc8c8d0, 0xe0e0e4]))]], { rate: 0.6, life: [2, 3], vy: 5, sx: 2, wf: 1.2, a: 0.28 });
    // the Gunkanjima tour boat pier at the north end
    img.fine(110, Y(1874), 14, 5, (X, Yy) => {
      const j = Yy - Y(1874) * S;
      return j < 1 ? C.concrete[4] : j > 12 ? C.concrete[0] : k.settPx(X, Yy, 12, C.concrete);
    });
    for (let x = 111; x < 124; x += 3) img.rectPx(x * S, Y(1869) * S, 3, 6, 0x2a2e34);
    k.crowd(112, Y(1874), 10, 3, 4);
  }
  // plaza trees between the terminal and the road
  for (const [x, u] of [[140, 1600], [146, 1758], [140, 1804], [150, 1680], [150, 1830]]) k.tree(x, Y(u), 3.5, CAMPHOR, u);
  void CARS;
  void COATS;
  void mix;
}
