// Oura and Glover Garden, Dejima, Shinchi Chinatown, in fine pixels.
//   Oura: the Ishibashi tram terminus and Oura Tenshudō stop on the seawall road, Glover-dori's castella and souvenir
//   shops climbing to Oura Cathedral (white Gothic front, octagonal spire, the white Virgin before the door), then
//   Glover Garden on its terraces: the Alt and Ringer houses, Glover House (tiled clover-plan bungalow, veranda,
//   conservatory) with its pond and the Miura Tamaki statue, the No. 2 Dock House and Walker House, the moving
//   walkway, the upper gate to Oranda-zaka's cobbles.
//   Dejima: the Wharf boardwalk, the fan island in its stone walls with the tile-capped wall, rows of restored houses
//   along their lanes: namako-walled warehouses, the Chief Factor's residence with its outside stair, the Protestant
//   seminary and club house, the Dutch flag, the 1:15 model, the water gate, the Omotemon gate and bridge.
//   Shinchi: four gates on a cross of streets, lanterns overhead, red and green shops, steamers of kakuni-manju.
import { rng, fbm } from '../../lib/raster.mjs';
import { C, S, night, scaleColor, rampColor, hashPx } from './canvas.mjs';
import { rightShore, r1X, R1_HW, TRAM_U0, DEJIMA, dejimaSouth, dejimaNorth, EMBANK, CHINA_X, STREETS } from './geo.mjs';

const CAMPHOR = [0x1a3422, 0x284a2c, 0x3a6236, 0x527c44];
const SAKURA = Object.assign([0x7a4a5e, 0xa66a7c, 0xc88a9a, 0xe8b4c0], { kind: 'broadleaf' });
const CAMELLIA = [0x16301e, 0x22462a, 0x305c34, 0x44743e];
const PINE = Object.assign([0x16301f, 0x234629, 0x34603a, 0x4c7a48], { kind: 'pine' });

/** A tram stop on R1: a platform either side of the tracks, a shelter with its glass roof, people waiting. */
/**
 * The houses along the far side of R1, cut by the screen's edge: never a row of the same thing. Different widths and
 * heights, one or two side streets with a lamp at the corner, a tree or a parked van in the odd gap.
 */
export function eastEdge(k, u0, u1, seed, style = 'jp') {
  const R = rng(seed);
  const { img, Y } = k;
  const roofs = [C.kawara, C.kawara, C.redTile, C.slate, [0x4a5a58, 0x5a6c68, 0x6a7e78, 0x7e928a, 0x96a89e]];
  const walls = [0xd8ccb4, 0xc8bca4, 0xb8ac94, 0xe4dccc, 0x8a7a68, 0xa89a88];
  for (let u = u0; u < u1 - 8; ) {
    const r = R();
    if (r < 0.15) {
      // a side street running off beyond the edge, its corner lamp, its pavement crossing
      const w = R.int(6, 9);
      if (!k.anyRes(174, Y(u + w), 6, w)) {
        img.fine(174, Y(u + w), 6, w, (X, Yy) => k.asphaltPx(X, Yy));
        for (let i = 0; i < 3; i++) img.rectPx(172 * S, Y(u + 1 + i * 2) * S, 6, 2, 0xd8d4c6);
        k.streetLamp(175, u + w + 1, 0xffe0a8);
        k.reserve(174, Y(u + w), 6, w);
      }
      u += w + 1;
      continue;
    }
    if (r < 0.28) {
      // a tree in somebody's plot, a wall along it
      const h = R.int(8, 13);
      if (!k.anyRes(174, Y(u + h), 6, h)) {
        k.fill(174, Y(u + h), 6, h, [0x4a4438, 0x56503e, 0x625c48], u, 4);
        for (let X = 174 * S; X < 180 * S; X++) for (let j = 0; j < 3; j++) img.px(X, (Y(u) - 1) * S + j, j === 0 ? C.granite[3] : C.granite[1]);
        k.tree(178, Y(u + 3), 3.6, [0x1e3a2a, 0x2a4e34, 0x3a6240, 0x4a7a4c], u + 7);
      }
      u += h + 1;
      continue;
    }
    const h = r < 0.5 ? R.int(10, 14) : r < 0.82 ? R.int(14, 20) : R.int(20, 30);
    const w = R.int(7, 14);
    const y = Y(u + h);
    if (!k.anyRes(174, y, 6, h)) {
      if (h > 19) {
        k.house(174, y, w, 6, h - 6, 'block', { roofC: R.pick([0x5a6068, 0x6a6e74, 0x4e5660]), plainRoof: R() < 0.5 });
      } else if (style === 'china' && R() < 0.6) {
        k.house(174, y, w, Math.round(h * 0.46), h - Math.round(h * 0.46), 'china', { ramp: R.pick(roofs), wall: R.pick([0x8a3a32, 0xa8483a, 0xd8c8a8, 0x7a5a48]), noren: R.pick([0xc8302a, 0xe8b830]) });
      } else {
        const rh = Math.round(h * 0.52);
        k.house(174, y, w, rh, h - rh, 'jp', { ramp: R.pick(roofs), wall: R.pick(walls), noren: R() < 0.3 ? R.pick([0x2a4a8a, 0x8a2a2a, 0xe8d8b0]) : undefined, door: R() < 0.7, bay: R.int(3, 5) });
      }
    }
    u += h + R.int(0, 2);
  }
}

export function tramStop(k, u0, u1, cx = 162) {
  const { img, Y } = k;
  for (const [x0, x1] of [[cx - 8, cx - 5.5], [cx + 5.5, cx + 8]]) {
    img.fine(x0, Y(u1), x1 - x0, u1 - u0, (X, Yy) => {
      const e = Math.min(X - Math.round(x0 * S), Math.round(x1 * S) - 1 - X);
      if (e < 1) return C.concrete[4];
      return Yy % 9 === 0 ? C.concrete[1] : e < 2 ? 0xe8c838 : C.concrete[3];
    });
    const SX = Math.round(x0 * S);
    const SW = Math.round((x1 - x0) * S);
    const YS = Y(u1 - 3) * S;
    k.objects.push({
      y: Y(u0 + 8),
      draw: () => {
        const LL = (u1 - u0 - 12) * S;
        for (let j = 0; j < LL; j++) for (let i = 0; i < SW; i++) img.px(SX + i, YS + j, i < 1 || i >= SW - 1 ? 0x4a5a64 : j % 12 < 2 ? 0x6a8a9a : 0xa8d0dc, 0.92);
        k.glowPx(SX + (SW >> 1), YS + (LL >> 1), 0xe8f4ff, 0.6 + night(u0) * 0.35);
        k.glowPx(SX + (SW >> 1), YS + (LL >> 1) + 12, 0xe8f4ff, 0.6 + night(u0) * 0.35);
      },
    });
    k.crowd(x0 + 0.5, Y(u1 - 5), 1, u1 - u0 - 10, 4);
  }
}

/** A stone retaining wall along a terrace edge: its face shows below a wavering top line. */
function terrace(k, x0, x1, u, amp = 3, ph = 0, h = 4) {
  const { img, Y } = k;
  for (let X = x0 * S; X < x1 * S; X++) {
    const x = X / S;
    const top = (7168 - (u + Math.sin(x * 0.07 + ph) * amp)) * S;
    for (let j = -1; j < h * S; j++) {
      const row = Math.floor((j + 0.5) / 6);
      const XX = X + row * 7;
      let c;
      if (j < 1) c = C.granite[4];
      else if (j % 6 === 5 || XX % 14 === 0) c = scaleColor(C.granite[0], 0.8);
      else c = scaleColor(C.granite[1 + Math.floor(hashPx(Math.floor(XX / 14), row, 201) * 3)], 1.05 - (j / (h * S)) * 0.28);
      if ((j % 6 === 5 || XX % 14 === 0) && hashPx(X, j, 202) < 0.1) c = 0x4a6a3a;
      img.px(X, Math.round(top + j), c);
    }
    for (let j = 0; j < 4; j++) img.tintPx(X, Math.round(top + h * S + j), 0.62 + j * 0.09);
  }
  k.reserve(x0, Y(u + amp + 1), x1 - x0, h + amp * 2 + 2);
}

/** A garden path or lane. */
const path = (k, pts, hw = 1.5, surface = C.paving) => k.road(pts, hw, { side: 0, surface, kerb: scaleColor(surface[1], 0.8) });

/** A Western house of the foreign settlement: hipped roof, white or stone walls, shuttered sashes, a veranda of posts. */
function westernHouse(k, x, footU, w, rh, fh, opt = {}) {
  const { img, Y } = k;
  const y = Y(footU) - rh - fh;
  const u = footU;
  const wall = opt.wall ?? C.cream[3];
  const ramp = opt.ramp ?? C.kawara;
  const bits = rng(x * 37 + footU);
  const lit = Array.from({ length: 32 }, () => bits() < 0.15 + night(u) * 0.7);
  k.objects.push({
    y: Y(footU),
    shadow: () => k.shadowRect(x + 3, y + 3, w, rh + fh, 0.5),
    draw: () => {
      const X0 = x * S;
      const WW = w * S;
      const Y0 = (y + rh) * S;
      const HH = fh * S;
      const bay = (opt.bay ?? 7) * S;
      const midF = opt.floors === 2 ? HH >> 1 : -1;
      for (let j = 0; j < HH; j++)
        for (let i = 0; i < WW; i++) {
          let c = wall;
          if (opt.stone) {
            const row = j >> 2;
            const XX = i + row * 5;
            c = j % 4 === 3 || XX % 10 === 0 ? scaleColor(wall, 0.76) : scaleColor(wall, 0.92 + hashPx(XX >> 3, row, 203) * 0.16);
          } else if (j % 3 === 0) c = scaleColor(wall, 0.93); // clapboard
          if (j < 3) c = scaleColor(c, 0.55); // the eave's shade
          // tall sash windows with green shutters
          const q = i % bay;
          const b = Math.floor(i / bay);
          const fl = midF > 0 && j > midF ? 1 : 0;
          const wy = fl ? j - midF : j;
          const wh = midF > 0 ? midF : HH;
          if (q >= 6 && q < 15 && wy >= 5 && wy < wh - 6) {
            const sq = q - 6;
            if (sq < 2 || sq > 6) c = (wy >> 1) % 2 ? opt.shutter ?? 0x3a6a5a : scaleColor(opt.shutter ?? 0x3a6a5a, 0.78);
            else if (wy % 6 === 2 || sq === 4) c = 0xf0ece0;
            else if (lit[(b * 3 + fl * 7) & 31]) {
              k.glowPx(X0 + i, Y0 + j, C.warm, 0.55 + night(u) * 0.4);
              continue;
            } else c = 0x34404c;
          }
          if (i >= WW - 2) c = scaleColor(c, 0.74);
          img.px(X0 + i, Y0 + j, c);
        }
      if (midF > 0) for (let i = 0; i < WW; i++) for (let j = 0; j < 3; j++) img.px(X0 + i, Y0 + midF + j, j === 0 ? 0xffffff : scaleColor(wall, 0.72));
      // the veranda: white posts and a rail in front, its stone floor, its shade on the wall
      if (opt.veranda !== false) {
        const gap = (opt.postGap ?? 4) * S;
        const post = opt.post ?? 0xf8f4ea;
        for (let i = 0; i < WW; i += gap) for (let j = 0; j < HH; j++) {
          img.px(X0 + i, Y0 + j, post);
          img.px(X0 + i + 1, Y0 + j, scaleColor(post, 0.72));
        }
        for (let i = 0; i < WW; i++) {
          img.px(X0 + i, Y0 + HH - 8, opt.rail ?? 0xf0ead8);
          img.px(X0 + i, Y0 + HH - 7, scaleColor(opt.rail ?? 0xf0ead8, 0.7));
          if (i % 3 === 0) for (let j = -6; j < 0; j++) img.px(X0 + i, Y0 + HH + j, scaleColor(opt.rail ?? 0xf0ead8, 0.86));
          if (midF > 0) {
            img.px(X0 + i, Y0 + midF - 7, opt.rail ?? 0xf0ead8);
            if (i % 3 === 0) for (let j = -6; j < 0; j++) img.px(X0 + i, Y0 + midF + j, scaleColor(opt.rail ?? 0xf0ead8, 0.86));
          }
        }
      }
      for (let i = -3; i < WW + 3; i++) for (let j = 0; j < 6; j++) img.px(X0 + i, Y0 + HH + j, j === 0 ? C.granite[4] : j > 4 ? C.granite[0] : C.granite[2]);
      if (opt.portico) {
        // a stone portico of Tuscan columns in the middle of the front
        const PX = X0 + (WW >> 1) - 24;
        for (let i = -3; i < 51; i++) for (let j = -9; j < 0; j++) img.px(PX + i, Y0 + j, j === -9 ? 0xfff8e8 : j > -3 ? 0x9a9484 : scaleColor(wall, 1.1));
        for (let c2 = 0; c2 < 4; c2++) {
          const CX = PX + c2 * 15;
          for (let j = 0; j < HH; j++) for (let i = 0; i < 6; i++) img.px(CX + i, Y0 + j, i < 1 ? 0xfff8e8 : i < 4 ? 0xece6d4 : 0xb8b09e);
          for (let i = -2; i < 8; i++) {
            img.px(CX + i, Y0, 0xf4eee0);
            img.px(CX + i, Y0 + HH - 1, 0xc8c0a8);
          }
        }
      }
      k.roof(x - 2, y, w + 4, rh, ramp, { courses: !opt.slate });
      for (const cx of opt.chimneys ?? [x + 5, x + w - 7]) {
        const CX = cx * S;
        const brick = opt.brick ?? 0x8a5a44;
        for (let j = 0; j < 15; j++) for (let i = 0; i < 9; i++) img.px(CX + i, (y + 1) * S + j, j < 3 ? 0x3a2a24 : j % 3 === 0 || (i + (j >> 1)) % 4 === 0 ? scaleColor(brick, 0.72) : i > 6 ? scaleColor(brick, 0.74) : brick);
        for (let i = -1; i < 10; i++) img.px(CX + i, (y + 1) * S + 3, 0xc8b8a0);
        for (let i = 0; i < 10; i++) for (let j = 0; j < 5; j++) img.tintPx(CX + i + 2, (y + 1) * S + 15 + j, 0.72);
      }
      opt.extra?.(y);
    },
  });
  k.reserve(x - 2, y - 1, w + 4, rh + fh + 3);
  return y;
}

// ---------------------------------------------------------------------------------------------- Oura & Glover
export function paintOura(k) {
  const { img, Y, kit, objects, glowPx, pool } = k;
  const R = rng(1863);

  // the seawall promenade: its rail, lamps, stone steps down to the water, a moored pleasure boat
  for (let Yy = Y(2560) * S; Yy < Y(1990) * S; Yy++) {
    const u = 7168 - Yy / S;
    const X = Math.round((rightShore(u) + 1) * S);
    img.px(X, Yy, Yy % 15 < 2 ? 0x5a5e66 : 0xd8d4c8);
    img.px(X + 1, Yy, 0x6a6e72);
  }
  for (let u = 1998; u < 2560; u += 36) k.streetLamp(rightShore(u) + 2, u);
  // the harbour head between the terminal and Oura: a hotel and offices on the curving shore, a palm-lined drive
  k.slab(128, Y(1960), 30, 18, 12, { roofC: 0x7a7e84, wall: 0xd8d0c0 });
  k.slab(100, Y(1984), 24, 16, 10, { roofC: 0x6e7076, wall: 0xc8c0b0 });
  k.slab(160, Y(2010), 20, 22, 16, { roofC: 0x5e6670, wall: 0xb8b8c0 });
  for (const [x, u] of [[126, 1930], [156, 1930], [98, 1958], [158, 1984]]) k.palm(x, Y(u), 6, x + u);
  k.way([[r1X(1940) - 11, 1950], [128, 1944]], 2.2, { seed: 21 });
  k.grove(70, 180, 1930, 2080, 30, [CAMPHOR, CAMELLIA], 1901, 3, 5.5);

  // the Ishibashi terminus and the Oura Tenshudō stop: platforms and shelters beside the tracks
  tramStop(k, TRAM_U0 + 2, TRAM_U0 + 26, r1X(TRAM_U0 + 14));
  tramStop(k, 2140, 2164, r1X(2152));

  // Glover-dori: the stone-paved shopping slope from the tram road up to the cathedral steps
  const GD = [[r1X(2084) + R1_HW + 2, 2084], [100, 2090], [124, 2097], [140, 2103]];
  path(k, GD, 4, C.stoneSet);
  const NOREN = [0x2a4a8a, 0xe8d8b0, 0x8a2a2a, 0xf0e8d0, 0x2a5a3a];
  const shop = (x, footU, w, noren) => {
    const fy = Y(footU);
    const kind = R.int(0, 3);
    k.house(x, fy - 18, w, 10, 8, 'jp', {
      noren,
      wall: R.pick([0xd8ccb0, 0xc8b898, 0xe0d4bc]),
      roof: { gable: R() < 0.4 ? 'tri' : null, gw: 6 },
      extra: () => {
        // the shop's sign over the eave, its wares out on the street: castella in yellow boxes, souvenirs
        const SX = (x + 1) * S;
        const SW = (w - 2) * S;
        for (let j = 0; j < 7; j++) for (let i = 0; i < SW; i++) img.px(SX + i, (fy - 8) * S + j, j === 0 || j === 6 ? 0x3a2a1c : 0xe8d8b0);
        for (let i = 3; i < SW - 3; i += 4) img.rectPx(SX + i, (fy - 8) * S + 2, 2, 3, 0x2a1a14);
        const WX = (x + 1) * S;
        for (let i = 0; i < SW; i++)
          for (let j = 0; j < 6; j++) {
            const q = kind === 0 ? (j < 2 ? 0xe8c040 : (i >> 2) % 2 ? 0xf0d868 : 0x8a5a2a) : kind === 1 ? ((i + j) % 4 ? 0x3a6aa8 : 0xf0f0e8) : kind === 2 ? ((i >> 1) % 3 ? 0xd8483a : 0xf0e8d0) : ((i >> 2) % 2 ? 0x5a8a5a : 0xe8a050);
            img.px(WX + i, fy * S + 1 + j, j === 5 ? 0x2a2018 : q);
          }
      },
    });
  };
  let sx = 66;
  for (const w of [12, 10, 14, 11]) {
    shop(sx, 2108 - (sx - 66) * 0.12, w, R.pick(NOREN));
    sx += w + 1;
  }
  sx = 68;
  for (const w of [13, 12, 11, 14, 12]) {
    if (sx + w > 136) break;
    shop(sx, 2066 + (sx - 68) * 0.1, w, R.pick(NOREN));
    sx += w + 1;
  }
  k.walkers(GD.map(([x, u]) => [x, u + 1]), 5, 2090, { sp: 3 });
  k.crowd(70, Y(2096), 60, 6, 16);

  // ---- Oura Cathedral: Japan's oldest church (1864), a National Treasure
  {
    const x0 = 114;
    const x1 = 164;
    const foot = 2116;
    const fy = Y(foot);
    const faceH = 18;
    const roofTop = Y(2196);
    terrace(k, 100, 172, 2106, 0, 0, 3);
    k.stairs(128, Y(2118), 24, 14);
    k.reserve(x0 - 2, roofTop - 30, x1 - x0 + 4, fy - roofTop + 34);
    objects.push({
      y: fy,
      shadow: () => k.shadowRect(x0 + 4, roofTop + 4, x1 - x0, fy - roofTop, 0.5),
      draw: () => {
        const X0 = x0 * S;
        const X1 = x1 * S;
        const Yr = roofTop * S;
        const Yf = (fy - faceH) * S;
        const CX = Math.round((X0 + X1) / 2);
        // the long nave roof running north in grey slate, lit to the left of the ridge, slates in courses
        for (let Yy = Yr; Yy < Yf; Yy++)
          for (let X = X0 + 6; X < X1 - 6; X++) {
            const t = (X - (X0 + 6)) / (X1 - X0 - 12);
            let c = t < 0.5 ? rampColor(C.slate, 0.75 - t * 0.4, X, Yy) : rampColor(C.slate, 0.45 - (t - 0.5) * 0.6, X, Yy);
            if ((X + ((Yy >> 1) % 2) * 2) % 4 === 0) c = scaleColor(c, 0.86);
            if (Yy % 3 === 0) c = scaleColor(c, 0.88);
            if (Math.abs(X - CX) < 2) c = X < CX ? C.slate[4] : C.slate[0];
            img.px(X, Yy, c);
          }
        // aisle roofs either side, lower, a clerestory line between; buttresses
        for (const [ax, aw, lit] of [[X0, 24, 1], [X1 - 24, 24, 0]])
          for (let Yy = Yr + 24; Yy < Yf; Yy++)
            for (let X = ax; X < ax + aw; X++) {
              let c = lit ? C.slate[3] : C.slate[1];
              if (Yy % 3 === 0) c = scaleColor(c, 0.84);
              if ((Yy - Yr) % 36 < 4 && (X - ax) % 24 < 8) c = 0xe0dcd0;
              img.px(X, Yy, c);
            }
        for (let Yy = Yr + 24; Yy < Yf; Yy++) {
          for (const q of [X0 + 24, X1 - 25]) for (let i = 0; i < 2; i++) img.tintPx(q + i, Yy, 0.5);
        }
        // the white front: three bays, pointed windows of stained glass, corner pinnacles
        const WH = faceH * S;
        for (let j = 0; j < WH; j++)
          for (let X = X0; X < X1; X++) {
            const i = X - X0;
            let c = i > X1 - X0 - 3 ? 0xb8b4a8 : i < 6 ? 0xfaf8f0 : 0xeeeae0;
            if (j > 0 && (j % 9 === 0)) c = scaleColor(c, 0.94); // the stucco's false courses
            if (j >= WH - 5) c = j === WH - 5 ? 0xf8f6ee : 0xc4c0b4;
            img.px(X, Yf + j, c);
          }
        const lancet = (WX, WY, w, h) => {
          for (let j = 0; j < h; j++) {
            const hw = j < w ? Math.sqrt(Math.max(0, (w / 2) ** 2 - ((w - j) * 0.5) ** 2)) : w / 2;
            for (let i = -hw; i <= hw; i++) {
              const e = hw - Math.abs(i);
              if (e < 1) img.px(WX + i, WY + j, 0xfdfbf2);
              else {
                const col = [0xffc070, 0xe8604a, 0x5a8ad8, 0xffe090, 0x8a5ac8][Math.floor(hashPx(Math.round(i / 2), j >> 2, WX) * 5)];
                if ((Math.round(i) + j) % 5 === 0) img.px(WX + i, WY + j, 0x2a2a3a);
                else if (night(foot) > 0.06) glowPx(WX + i, WY + j, col, 0.5 + night(foot) * 0.45);
                else img.px(WX + i, WY + j, scaleColor(col, 0.55));
              }
            }
          }
        };
        for (const [gx, gw] of [[x0 + 2, 14], [x1 - 16, 14]]) {
          // the gable over each side bay
          const GX = gx * S;
          const GW = gw * S;
          for (let j = 0; j < 15; j++) for (let i = j; i < GW - j; i++) img.px(GX + i, Yf - j, i - j < 2 ? 0xfffdf4 : GW - j - i < 3 ? 0xb8b4a8 : 0xf4f2e8);
          lancet(GX + 12, Yf + 9, 9, 33);
          lancet(GX + GW - 12, Yf + 9, 9, 33);
        }
        // the corner pinnacles with their little crockets
        for (const px of [x0, x1 - 3, x0 + 16, x1 - 19]) {
          const PX = px * S;
          for (let j = 0; j < (faceH + 6) * S; j++) for (let i = 0; i < 9; i++) img.px(PX + i, Yf - 18 + j, i < 2 ? 0xfffdf4 : i > 6 ? 0xc0bcb0 : j % 15 === 0 ? 0xc8c4b8 : 0xf8f6ee);
          for (let j = 0; j < 9; j++) for (let i = j >> 1; i < 9 - (j >> 1); i++) img.px(PX + i, Yf - 18 - j, i < 4 ? 0xfffdf4 : 0xd8d4c8);
        }
        // the tower: a white square body, the octagonal grey-green spire and its gilded cross
        const TW = 36;
        const TX = CX - 18;
        const TTop = Yf - 60;
        for (let j = TTop; j < fy * S; j++)
          for (let i = 0; i < TW; i++) img.px(TX + i, j, i < 2 ? 0xffffff : i > TW - 5 ? 0xc4c0b4 : (j - TTop) % 21 === 0 ? 0xd8d4c8 : 0xf6f4ec);
        for (let i = -2; i < TW + 2; i++) for (let j = 0; j < 3; j++) img.px(TX + i, TTop + j, j === 0 ? 0xffffff : 0xd8d4c8);
        // the door (lit), the rose window, the belfry's louvres
        for (let j = 0; j < 30; j++) {
          const hw = j < 9 ? Math.sqrt(Math.max(0, 81 - (9 - j) ** 2)) : 9;
          for (let i = -hw; i <= hw; i++) img.px(CX + i, fy * S - 30 + j, Math.abs(i) > hw - 2 ? 0xc8c4b8 : night(foot) > 0.05 ? (i === 0 ? 0x5a3a24 : 0xffc880) : i === 0 ? 0x1e1410 : 0x3a2a24);
        }
        const RY = fy * S - 42;
        img.discPx(CX, RY, 8.5, 0xfdfbf2);
        for (let a = 0; a < 16; a++) for (let q = 1; q < 7; q++) {
          const X = CX + Math.cos((a / 16) * 6.283) * q;
          const Yy = RY + Math.sin((a / 16) * 6.283) * q;
          const col = a % 4 === 0 ? 0xffe090 : a % 2 ? 0xe8604a : 0x5a8ad8;
          if (night(foot) > 0.05) glowPx(X, Yy, col, 0.85);
          else img.px(X, Yy, scaleColor(col, 0.6));
        }
        img.px(CX, RY, 0xfff4c8);
        for (const q of [-9, 3]) for (let j = 0; j < 18; j++) for (let i = 0; i < 6; i++) img.px(CX + q + i, TTop + 15 + j, j < 2 ? 0x1a1e28 : j % 3 === 0 ? 0xc8c4b8 : 0x2a3240);
        // the spire in eight facets, lit to the left, banded
        const SPH = 42;
        for (let j = 0; j < SPH; j++) {
          const hw = 18 * (1 - j / SPH);
          for (let i = -hw; i <= hw; i++) {
            const q = i / Math.max(1, hw);
            let c = q < -0.55 ? C.copper[4] : q < -0.1 ? C.copper[3] : q < 0.5 ? C.copper[2] : C.copper[1];
            if (j % 6 === 0) c = scaleColor(c, 0.84);
            img.px(CX + i, TTop - 1 - j, c);
          }
        }
        for (let j = 0; j < 17; j++) {
          img.px(CX, TTop - 42 - j, 0xf0d890);
          img.px(CX + 1, TTop - 42 - j, 0xc8a850);
        }
        for (let i = -5; i <= 6; i++) {
          img.px(CX + i, TTop - 53, 0xf0d890);
          img.px(CX + i, TTop - 52, 0xc8a850);
        }
        glowPx(CX, TTop - 54, 0xfff0c0, 0.75);
        // the white Virgin on her pedestal at the top of the steps, floodlit, flowers at her feet
        const VX = CX;
        const VY = fy * S + 18;
        for (let j = 0; j < 9; j++) for (let i = -6; i <= 6; i++) img.px(VX + i, VY + j, j < 1 ? 0xe8e4d8 : i > 4 ? 0x8a8678 : 0xb8b4a8);
        for (let j = 0; j < 15; j++) {
          const hw = 2.5 + j * 0.16;
          for (let i = -hw; i <= hw; i++) img.px(VX + i, VY - 15 + j, i < -1 ? 0xffffff : i < hw - 1 ? 0xf0ecdf : 0xc8c4b8);
        }
        img.discPx(VX, VY - 18, 2.8, 0xf8f4ea);
        for (let q = 0; q < 7; q++) img.px(VX - 9 + q * 3, VY + 9, q % 2 ? 0xf4f0e0 : 0xe86a9a);
        pool(x0 + 25, fy + 4, 12, 0xfff4d8, 0.14 + night(foot) * 0.22);
      },
    });
    k.palm(x0 - 4, fy + 2, 7, 11);
    k.palm(x1 + 3, fy + 2, 7, 12);
    k.crowd(128, fy + 4, 24, 3, 8);
    // the path past the cathedral's east side up to the garden's lower gate
    path(k, [[150, 2104], [168, 2118], [172, 2150], [172, 2200]], 1.5);
  }

  // ---- Glover Garden on its terraces (walls at 2200, 2290, 2400, 2480), the moving walkway on the east
  img.fine(64, Y(2560), 102, 360, (X, Yy, x, y) => {
    if (k.isRes(x, y)) return null;
    const n = 0.3 + fbm(x, y, { seed: 2207, scale: 7, octaves: 3 }) * 0.55;
    const c = k.lawnPx(X, Yy, n, [0x2e5a30, 0x3c6e38, 0x4e8444, 0x64984e]);
    // mown stripes across the terraces
    return (Yy >> 3) % 2 ? c : scaleColor(c, 0.96);
  });
  for (const [u, amp, ph] of [[2200, 2, 0.3], [2290, 3, 1.2], [2400, 3, 2.1], [2480, 2, 0.6]]) terrace(k, 64, 166, u, amp, ph, 4);
  {
    // the covered moving walkway: a glazed tube on posts, landings at every terrace
    const wx = 168;
    img.fine(wx, Y(2486), 10, 290, (X, Yy, x, y) => {
      const u = 7168 - y;
      const i = X - wx * S;
      const landing = [2200, 2290, 2400, 2480].some((t) => Math.abs(u - t) < 5);
      if (landing) return i < 2 || i > 27 ? C.granite[3] : k.settPx(X, Yy, 22, C.granite);
      if (i < 2 || i > 27) return i === 0 ? 0xe8f0f4 : 0x5a6a74;
      if (Yy % 18 < 2) return 0x6a7a84;
      const c = i < 9 ? 0xc8e0e8 : i < 21 ? 0x9ab4c0 : 0x7a98a6;
      return (i + (Yy >> 1)) % 13 === 0 ? 0xe8f4f8 : c;
    });
    for (let u = 2204; u < 2480; u += 6) if (night(u) > 0.1) glowPx((wx + 5) * S, Y(u) * S, 0xe8f4ff, 0.5);
    k.reserve(wx, Y(2486), 10, 290);
  }
  // paths: along each terrace from the walkway landings, stairs through the walls at the west end
  path(k, [[168, 2205], [66, 2205], [r1X(2205) + R1_HW + 2, 2205]], 1.5);
  path(k, [[168, 2296], [76, 2296], [72, 2292], [72, 2208]], 1.5);
  path(k, [[168, 2406], [72, 2406], [68, 2400], [68, 2300]], 1.5);
  path(k, [[168, 2486], [128, 2486], [126, 2492], [126, 2540]], 1.5);
  for (const [x, u0, u1] of [[70, 2196, 2210], [66, 2286, 2300], [66, 2396, 2410]]) k.stairs(x, Y(u1), 5, u1 - u0);

  // Former Alt House: stone, a portico of Tuscan columns
  westernHouse(k, 70, 2214, 40, 15, 10, { stone: true, wall: 0xb8b0a0, portico: true, ramp: C.kawara, chimneys: [76, 102] });
  // Former Ringer House: stone and timber, a long veranda
  westernHouse(k, 120, 2214, 42, 14, 9, { stone: true, wall: 0xa8a294, ramp: C.kawara, post: 0xe8e0d0, chimneys: [126, 154] });
  // Former Glover House: Japanese-tiled clover-plan bungalow, a veranda round the front, a glazed conservatory
  {
    const foot = 2328;
    westernHouse(k, 94, foot + 6, 40, 18, 10, { ramp: C.kawara, postGap: 3, chimneys: [100, 126] });
    for (const [wx, ww] of [[78, 22], [128, 24]]) {
      const y = westernHouse(k, wx, foot, ww, 14, 9, { ramp: C.kawara, postGap: 3, chimneys: [wx + ww - 6], bay: 6 });
      // the rounded bay of each wing: its veranda curves out on the lawn
      objects.push({
        y: Y(foot) + 1,
        draw: () => {
          for (let X = (wx + 1) * S; X < (wx + ww - 1) * S; X++) {
            const dy = Math.round(Math.sin(((X - (wx + 1) * S) / ((ww - 2) * S)) * Math.PI) * 6);
            for (let j = 0; j < 4; j++) img.px(X, (y + 23) * S + dy + j, j === 0 ? C.granite[4] : C.granite[2]);
            if ((X - wx * S) % 9 === 0) for (let j = -24; j < 0; j++) img.px(X, (y + 23) * S + dy + j, 0xf8f4ea);
          }
        },
      });
    }
    // the conservatory at the west end: a glasshouse with plants inside
    objects.push({
      y: Y(foot) + 1,
      shadow: () => k.shadowRect(68, Y(foot) - 14, 10, 14, 0.6),
      draw: () => {
        const Y0 = (Y(foot) - 15) * S;
        for (let j = 0; j < 45; j++)
          for (let i = 0; i < 36; i++) {
            let c;
            if (i % 9 === 0 || j % 12 === 0) c = 0xe8f0ec;
            else if (j < 18) c = (i + j) % 7 === 0 ? 0xd8f0f4 : 0x9ac4c8;
            else {
              const g = hashPx(i >> 1, j >> 1, 204);
              c = g < 0.2 ? 0xd87a9a : g < 0.3 ? 0xf0e070 : g < 0.7 ? 0x4a7a5a : 0x3a6a4a;
            }
            img.px(66 * S + i, Y0 + j, c);
          }
        if (night(foot) > 0.1) for (let i = 4; i < 36; i += 9) glowPx(66 * S + i, Y0 + 30, C.warm, 0.5);
      },
    });
    k.reserve(65, Y(foot) - 16, 14, 17);
    // the pond with its stone edge, lilies, the little bridge, the Miura Tamaki statue (Madame Butterfly) by it
    const py = Y(2310);
    img.fine(140, py - 10, 32, 20, (X, Yy, x, y) => {
      const d = Math.hypot((x - 156) / 15, (y - py) / 9);
      if (d >= 1) return null;
      if (d > 0.87) return Math.floor(Math.atan2(y - py, x - 156) * 9) % 2 ? C.granite[3] : C.granite[2];
      const c = rampColor([0x123a40, 0x1e4a4e, 0x2a5e5e, 0x3a7270], 0.2 + fbm(x, y, { seed: 2310, scale: 5 }) * 0.5 + (y - py) * 0.02, X, Yy);
      return hashPx(X >> 1, Yy, 205) > 0.985 ? 0xc8e8e4 : c;
    });
    for (const [x, y] of [[151, py + 2], [162, py - 3], [147, py - 1], [159, py + 4], [165, py + 1]]) {
      img.discPx(x * S, y * S, 3, 0x3a7a4a);
      img.px(x * S - 1, y * S - 1, 0x6aaa6a);
      if ((x + y) % 2) img.discPx(x * S + 1, y * S, 1, 0xf4b0c8);
    }
    const koi = (col) => [0, 1].map((f) => k.sprite(4, 3, 2310, (r) => {
      for (let i = 0; i < 9; i++) {
        const hw = Math.sin((i / 8) * Math.PI) * 1.6;
        const cy = 4 + (f ? 1 : -1) * Math.sin(i * 0.5) * 0.7;
        for (let j = -hw; j <= hw; j += 0.5) r.px(i, cy + j, i > 2 && i < 6 ? 0xfff4e8 : col);
      }
    }, false));
    kit.wander(156, 2310, 10, 5, koi(0xf08a3a), { n: 2, sp: 4, turn: 'rot', fps: 3 });
    kit.wander(154, 2310, 9, 4, koi(0xe85a2a), { n: 1, sp: 3, turn: 'rot', fps: 3 });
    for (let X = 143 * S; X < 150 * S; X++) {
      const dy = Math.round(Math.sin(((X - 143 * S) / (7 * S)) * Math.PI) * 6);
      for (let j = 0; j < 6; j++) img.px(X, py * S - dy + j, j < 1 || j > 4 ? 0x8a5a2a : X % 3 ? 0xb08a5a : 0x8a6a42);
    }
    k.reserve(140, py - 10, 32, 20);
    objects.push({
      y: Y(2306),
      shadow: () => k.shadowRect(135, Y(2306) - 2, 6, 3, 0.66),
      draw: () => {
        const X = 136 * S;
        const Yb = Y(2306) * S;
        for (let j = 0; j < 9; j++) for (let i = -7; i <= 7; i++) img.px(X + i, Yb - j, j > 6 ? C.granite[4] : i > 5 ? C.granite[0] : C.granite[2]);
        for (let j = 0; j < 15; j++) {
          const hw = 2.4 + j * 0.2;
          for (let i = -hw; i <= hw; i++) img.px(X + i, Yb - 24 + j, i < -1 ? 0x8ab0a0 : i < hw - 1 ? 0x6a8a7a : 0x4a6a5a);
        }
        img.discPx(X, Yb - 26, 2.4, 0x6a8a7a);
        for (let q = 0; q < 8; q++) img.px(X + 3 + q, Yb - 18 - (q >> 1), 0x8ab0a0);
      },
    });
  }
  // Mitsubishi No. 2 Dock House: two storeys of verandas, and the small Walker House
  westernHouse(k, 104, 2414, 52, 15, 16, { floors: 2, ramp: C.slate, slate: true, shutter: 0x4a7a6a, rail: 0x8aba9a, postGap: 4, chimneys: [112, 146] });
  westernHouse(k, 70, 2412, 28, 12, 9, { ramp: C.kawara, wall: 0xe8dcc4, chimneys: [76] });
  // ---- the garden as a garden: each terrace's walk winds from one set of steps to the next through planned beds
  const GRAVEL = [0x8e8674, 0xa09886, 0xb2aa98, 0xc2baa8];
  /** A curve through the given points (they stay where they are, so the walks still meet what they join). */
  const curved = (pts) => {
    if (pts.length < 3) return pts;
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
  const WALKS = [
    // north of the Alt and Ringer houses: up between them from the lower path, round a fountain, on to steps through the wall
    [[115, 2206], [115, 2252], [115, 2259]],
    [[72, 2262], [92, 2270], [108, 2262], [122, 2262], [138, 2270], [152, 2262], [156, 2280], [152, 2287]],
    // behind the Glover house: from the west steps, under the wisteria, down past its east wing to the statue
    [[68, 2372], [90, 2381], [116, 2375], [140, 2383], [160, 2372], [158, 2334], [138, 2322], [130, 2300]],
    // above the Dock House: from the west walk to the bandstand and on to the top landing
    [[68, 2412], [65, 2440], [88, 2456], [112, 2461], [140, 2454], [160, 2462], [166, 2484]],
    // the top lawn: out to the lookout over the harbour; and round to the east
    [[126, 2516], [110, 2532], [92, 2538]],
    [[126, 2510], [146, 2520], [160, 2508], [166, 2490]],
    // from the Oura stop along the wood's edge to the Lourdes grotto
    [[r1X(2152) + R1_HW + 2, 2152], [78, 2148], [94, 2140], [108, 2146]],
  ].map(curved);
  for (const w of WALKS) k.road(w, 1.3, { side: 0, surface: GRAVEL, kerb: 0x6a6a5a });
  // steps through the wall from the fountain walk to the path above
  k.stairs(150, Y(2298), 5, 12);
  // flowering hedges banked along the foot of each retaining wall, as they plant them on this hill
  for (const [a, b, u0, col, seed2] of [
    [76, 148, 2278, 0x5a7ae0, 2601], [156, 166, 2278, 0x8a6ae0, 2602],
    [76, 166, 2390, 0xe85a90, 2603],
    [72, 166, 2470, 0x7a6ae8, 2604],
  ]) k.hedge(a, b, u0, u0 + 7, seed2, col, 0.68);
  /** A bed cut in the lawn: a clipped box edge, a band of one flower round another. */
  const bed = (x, u, w, h, outer, inner, seed2) => {
    img.fine(x, Y(u + h), w, h, (X, Yy, xx, yy) => {
      const e = Math.min(xx - x, x + w - xx, yy - Y(u + h), Y(u) - yy);
      if (e < 0.5) return C.granite[2];
      if (e < 1.1) return (X + Yy) % 3 ? 0x2a4a2c : 0x3a5a36;
      const g = hashPx(X >> 1, Yy >> 1, seed2);
      const c = e < 2.6 ? outer : inner;
      if (g < 0.1) return 0x2e5032;
      return g < 0.16 ? 0xfff0f4 : g < 0.66 ? c : scaleColor(c, 0.82);
    });
    k.reserve(x, Y(u + h), w, h);
  };
  // the parterre in front of the Glover house, symmetrical round its steps
  bed(84, 2302, 18, 8, 0xf0e4c0, 0xd85a70, 2611);
  bed(106, 2302, 18, 8, 0xf0e4c0, 0xd85a70, 2612);
  bed(84, 2313, 18, 7, 0x8a6ae0, 0xf0d060, 2613);
  bed(106, 2313, 18, 7, 0x8a6ae0, 0xf0d060, 2614);
  // along the fountain walk, along the upper walks
  for (const [x, u, w, h, a, b] of [
    [78, 2248, 12, 7, 0xf0e4c0, 0x5a7ae0], [96, 2246, 10, 7, 0xf0e4c0, 0x8a6ae0], [128, 2246, 12, 7, 0xf0e4c0, 0x5a7ae0], [146, 2248, 10, 7, 0xf0e4c0, 0x8a6ae0],
    [82, 2360, 12, 6, 0xe85a90, 0xf8e8f0], [98, 2386, 14, 6, 0xf0d060, 0xe85a70], [128, 2388, 14, 6, 0xf0d060, 0xe85a70], [146, 2360, 8, 8, 0xe85a90, 0xf8e8f0],
    [78, 2444, 12, 6, 0xe85a90, 0xf0d060], [128, 2441, 14, 5, 0xe85a70, 0xf0e4c0], [146, 2466, 12, 5, 0xe85a90, 0xf0d060],
    [132, 2524, 14, 7, 0xf0d060, 0xe85a70], [100, 2518, 8, 6, 0xf0d060, 0xe85a90], [150, 2496, 12, 6, 0xe85a90, 0xf8e8f0],
  ]) bed(x, u, w, h, a, b, x * 3 + u);
  // the fountain: a stone basin at the walks' meeting, its jet and ring of ripples
  {
    const FU = 2262;
    const fy = Y(FU);
    img.fine(108, fy - 6, 14, 12, (X, Yy, x, y) => {
      const d = Math.hypot((x - 115) / 7, (y - fy) / 5.4);
      if (d > 1) return null;
      if (d > 0.82) return Math.floor(Math.atan2(y - fy, x - 115) * 8) % 2 ? C.granite[4] : C.granite[3];
      return hashPx(X >> 1, Yy, 2621) < 0.14 ? 0xb8dce4 : rampColor([0x1e4a5a, 0x2a5e6e, 0x3a7482], 0.2 + (y - fy + 5) * 0.06, X, Yy);
    });
    k.reserve(108, fy - 6, 14, 12);
    const jet = [0, 1, 2].map((f) => k.sprite(8, 12, FU, (r) => {
      for (let q = 0; q < 26; q++) {
        const a = (q * 2.399 + f) % 6.283;
        const t = ((q * 0.137 + f * 0.33) % 1);
        const h = 30 * t * (2 - t);
        r.px(12 + Math.cos(a) * t * 8, 32 - h, 0xe8f6fa, 0.82);
      }
      for (let j = 8; j < 34; j++) r.px(12, j, 0xf0fafc, 0.6);
    }, false));
    kit.loop(111, FU + 9, jet, { fps: 6, fx: 1 });
  }
  // the wisteria pergola over the walk behind the house: posts, beams, its long purple racemes hanging
  objects.push({
    y: Y(2374),
    shadow: () => k.shadowRect(100, Y(2382), 34, 8, 0.4),
    draw: () => {
      const X0 = 100 * S;
      const WW = 32 * S;
      const Yb = Y(2374) * S;
      for (let i = 0; i <= WW; i += 24) for (const q of [0, -24]) for (let j = 0; j < 18; j++) img.px(X0 + i, Yb + q - j, j < 2 ? C.wood[3] : C.wood[1]);
      for (const q of [-18, -42]) for (let i = -3; i < WW + 3; i++) for (let j = 0; j < 2; j++) img.px(X0 + i, Yb + q + j, j ? C.wood[0] : C.wood[3]);
      for (let i = 0; i < WW; i++)
        for (let j = -44; j < -18; j++) {
          const g = hashPx(i >> 1, (j + 60) >> 1, 2631);
          if (g < 0.4) continue;
          img.px(X0 + i, Yb + j, g < 0.55 ? 0x3e6a3e : g < 0.82 ? 0x8a6ae0 : 0xb89af0);
        }
      for (let i = 2; i < WW; i += 5) {
        const n = 4 + Math.floor(hashPx(i, 1, 2632) * 9);
        for (let j = 0; j < n; j++) img.px(X0 + i, Yb - 18 + j, j % 2 ? 0x8a6ae0 : 0xb89af0);
      }
    },
  });
  // the bandstand on the walk above the Dock House: white posts, a slate roof, a little dome
  {
    const CX = 112;
    const yb = Y(2466);
    k.fill(CX - 8, yb - 8, 16, 11, C.granite, 2640, 3);
    objects.push({
      y: yb + 2,
      shadow: () => k.shadowEllipse(CX + 3, yb, 10, 4, 0.5),
      draw: () => {
        const X = CX * S;
        const Yb = yb * S;
        for (const i of [-18, -6, 6, 18]) for (let j = 0; j < 21; j++) img.px(X + i, Yb - j, j < 2 ? 0xc8c4b8 : 0xf8f4ea);
        for (let i = -21; i <= 21; i++) for (let j = 0; j < 3; j++) img.px(X + i, Yb - 21 - j, j ? 0xd8d4c8 : 0xfffcf4);
        for (let j = 0; j < 16; j++) {
          const hw = 24 - j * 1.3;
          for (let i = -hw; i <= hw; i++) {
            const q = i / hw;
            img.px(X + i, Yb - 24 - j, q < -0.3 ? C.slate[3] : q < 0.4 ? C.slate[2] : C.slate[1]);
          }
        }
        img.discPx(X, Yb - 41, 2, C.gold);
        pool(CX, yb - 2, 8, 0xffe4b0, 0.08 + night(2466) * 0.2);
      },
    });
    k.reserve(CX - 8, yb - 8, 16, 11);
    k.crowd(CX - 6, yb - 2, 12, 2, 5);
  }
  // the lookout at the end of the top walk: flagged, a rail along the bank, a telescope, people pointing out the harbour
  {
    const ly = Y(2538);
    k.fill(80, ly - 5, 14, 10, C.granite, 2650, 3);
    for (let X = 79 * S; X < 94 * S; X++) for (let j = 0; j < 3; j++) img.px(X, (ly + 5) * S + j, j === 0 ? 0xe8e4d8 : X % 9 < 2 ? 0x5a5e66 : 0x8a8a84);
    k.bench(82, ly - 4, 5);
    k.reserve(79, ly - 5, 15, 11);
    k.crowd(83, ly - 1, 9, 3, 4);
  }
  // the grotto: rough boulders in an arch, a white figure in it, candles lit before it, someone kneeling
  {
    const gu = 2150;
    k.boulder(106, gu + 8, 5, 3, 2661, 0.7, C.rock);
    k.boulder(114, gu + 7, 5, 3, 2662, 0.7, C.rock);
    k.boulder(110, gu + 12, 6, 3, 2663, 0.8, C.rock);
    objects.push({
      y: Y(gu) + 1,
      draw: () => {
        const X = 110 * S;
        const Yb = Y(gu) * S;
        for (let j = 0; j < 27; j++) for (let i = -9; i <= 9; i++) if ((i / 9) ** 2 + ((j - 6) / 21) ** 2 < 1) img.px(X + i, Yb - j, 0x1a1a1e);
        for (let j = 0; j < 12; j++) for (let i = -2; i <= 2; i++) img.px(X + i, Yb - 4 - j, i < 0 ? 0xffffff : 0xd8d4c8);
        img.discPx(X, Yb - 18, 2, 0xf8f4ea);
        for (let i = -9; i <= 9; i += 3) glowPx(X + i, Yb - (i % 2 ? 1 : 0), 0xffd070, 0.95);
        pool(110, Y(gu) - 2, 7, 0xffc878, 0.14 + night(gu) * 0.24);
      },
    });
    k.reserve(103, Y(gu + 14), 16, 16);
    k.crowd(104, Y(gu) + 1, 12, 2, 3);
  }
  // specimen trees with room round them, palms by the houses, a few camellias at the walks' bends; no more scattered flowers
  for (const [x, u] of [[163, 2252], [84, 2350], [116, 2352], [158, 2440], [96, 2452], [90, 2256]]) k.palm(x, Y(u), 6, x + u);
  for (const [x, u, r, kind] of [[90, 2286, 5.5, CAMPHOR], [134, 2252, 4, SAKURA], [78, 2238, 3.4, SAKURA], [160, 2240, 4.5, CAMELLIA], [72, 2388, 5.5, CAMPHOR], [162, 2392, 5, CAMPHOR], [150, 2346, 3.6, SAKURA], [92, 2474, 5, CAMPHOR], [130, 2478, 4, SAKURA], [72, 2476, 3.4, CAMELLIA], [106, 2506, 3.6, SAKURA], [122, 2546, 3.4, CAMELLIA], [152, 2532, 5, CAMPHOR], [162, 2528, 3.4, SAKURA], [78, 2522, 4.5, CAMPHOR], [88, 2274, 4.5, CAMPHOR], [134, 2274, 4.5, CAMELLIA], [162, 2268, 3.6, SAKURA], [76, 2366, 4, CAMELLIA], [130, 2362, 3.4, SAKURA], [150, 2392, 3.6, SAKURA], [96, 2466, 3.6, SAKURA], [126, 2466, 3.6, CAMELLIA], [162, 2448, 4, CAMPHOR], [142, 2500, 3.6, CAMELLIA]]) {
    if (!k.anyRes(x - 1, Y(u) - 1, 2, 2)) k.tree(x, Y(u), r, kind, x * 7 + u);
  }
  k.grove(66, 166, 2490, 2560, 7, [CAMELLIA, SAKURA], 2211, 3, 4.5);
  for (const [x, u] of [[92, 2274], [140, 2274], [88, 2383], [142, 2385], [86, 2458], [142, 2456], [112, 2536], [150, 2522], [80, 2149]]) k.stoneLantern(x, u, true);
  // along the walks: benches, little groups stopping to look at the beds, someone with a camera
  for (const [x, u] of [[94, 2276], [132, 2276], [120, 2386], [96, 2462], [132, 2462], [116, 2520]]) k.bench(x, Y(u), 5);
  k.strollers(115, 2264, 36, 4, 4);
  k.strollers(110, 2378, 34, 4, 4);
  k.strollers(110, 2458, 30, 3, 3);
  k.strollers(146, 2514, 12, 4, 2);
  k.walkers(WALKS[1].map(([x, u]) => [x, u + 1]), 2, 2262, { sp: 2.4, gap: 60 });
  k.walkers(WALKS[3].map(([x, u]) => [x, u + 1]), 2, 2450, { sp: 2.4, gap: 70 });
  k.walkers(WALKS[6].map(([x, u]) => [x, u + 1]), 1, 2150, { sp: 2.4, gap: 60 });
  // the corner below the cathedral, thick with camellias and cherries round the walk to the grotto
  k.grove(66, 114, 2108, 2196, 40, [CAMELLIA, CAMPHOR, SAKURA], 2109, 3, 5);
  for (const u of [2208, 2300, 2410, 2490]) {
    for (let x = 80; x < 166; x += 22) k.streetLamp(x, u);
    for (let x = 90; x < 160; x += 44) k.bench(x, Y(u + 3), 5);
  }
  k.strollers(116, 2300, 40, 6, 5);
  k.strollers(116, 2208, 40, 4, 3);
  k.strollers(116, 2410, 40, 4, 3);
  k.strollers(146, 2490, 18, 3, 2);
  // the upper gate of the garden
  k.house(120, Y(2552), 12, 6, 5, 'jp', { wall: 0xc8b898, doorX: 5, bay: 4 });

  // ---- Oranda-zaka: the Dutch Slope's cobbles from the upper gate down to the coast road, wooden houses on it
  path(k, [[126, 2540], [128, 2570], [122, 2596], [r1X(2602) + R1_HW + 2, 2602]], 3, C.stoneSet);
  westernHouse(k, 140, 2556, 30, 12, 9, { wall: 0xdcd4c0, ramp: C.slate, slate: true, shutter: 0x6a4a3a, chimneys: [146] });
  westernHouse(k, 136, 2610, 36, 12, 10, { wall: 0xe8e0cc, ramp: C.kawara, shutter: 0x3a6a5a, chimneys: [160] });
  westernHouse(k, 96, 2574, 22, 11, 8, { wall: 0xd8ccb4, ramp: C.kawara, chimneys: [100] });
  k.walkers([[128, 2545], [128, 2570], [122, 2596], [70, 2600]], 3, 2570, { sp: 3 });
  k.grove(80, 180, 2540, 2660, 24, [CAMELLIA, CAMPHOR, SAKURA], 2541, 3, 5);
  k.grove(170, 180, 2660, 2990, 10, [CAMPHOR], 2661, 2.5, 3.5);
}

// ---------------------------------------------------------------------------------------------- Dejima
export function paintDejima(k) {
  const { img, Y, kit, objects, glowPx, pool } = k;
  const R = rng(1636);
  const { x0, x1, gate } = DEJIMA;

  // the Wharf: a timber boardwalk on piles along the bay's east shore, restaurants with lamps and parasols
  img.fine(128, Y(2792), 22, 130, (X, Yy) => {
    const i = X - 128 * S;
    const b = i >> 2;
    if (i % 4 === 3) return C.wood[0];
    const XX = Yy + b * 13;
    if (XX % 40 === 0) return C.wood[0];
    const c = rampColor(C.wood, 0.45 + hashPx(b, Math.floor(XX / 40), 206) * 0.5, X, Yy);
    return hashPx(X, Yy, 207) < 0.06 ? scaleColor(c, 0.9) : c;
  });
  for (let Yy = Y(2792) * S; Yy < Y(2662) * S; Yy++) {
    img.px(127 * S, Yy, C.wood[0]);
    img.px(127 * S + 1, Yy, Yy % 12 < 2 ? 0x2a1c14 : C.wood[3]);
    if (Yy % 24 === 0) for (let i = 0; i < 9; i++) img.px(127 * S - 1 - i, Yy, 0x061420, 0.4 - i * 0.04);
  }
  k.reserve(127, Y(2792), 24, 132);
  for (let u = 2670; u < 2790; u += 30) {
    k.house(140, Y(u + 20), 10, 8, 10, 'jp', { wall: R.pick([0xc8a878, 0xb89868, 0xd8c098]), noren: R.pick([0x8a2a2a, 0x2a4a8a, 0xe8d8b0]), bay: 4 });
    for (const dy of [4, 14]) {
      // a table under its parasol, chairs, a lamp under it
      const c = R.pick([0xe8e4d8, 0xd85a4a, 0x3a7a5a]);
      const CX = 134 * S;
      const CY = Y(u + dy) * S;
      objects.push({
        y: Y(u + dy) + 1,
        draw: () => {
          for (let j = -11; j <= 11; j++) for (let i = -11; i <= 11; i++) if (i * i + j * j <= 121) img.tintPx(CX + i + 3, CY + j + 4, 0.74);
          for (let j = -10; j <= 10; j++)
            for (let i = -10; i <= 10; i++) {
              if (i * i + j * j > 100) continue;
              const seg = Math.floor(((Math.atan2(j, i) + 3.15) / 6.3) * 8);
              img.px(CX + i, CY + j, seg % 2 ? c : scaleColor(c, 0.78));
            }
          img.discPx(CX, CY, 1.4, 0xf8f0d8);
          for (const [q, r] of [[-13, 0], [13, 0], [0, -13], [0, 13]]) img.rectPx(CX + q - 1, CY + r - 1, 3, 3, C.wood[3]);
          pool(134, Y(u + dy), 5, 0xffd090, 0.1 + night(u) * 0.22);
        },
      });
    }
    k.streetLamp(129, u + 22, 0xffe0a8);
  }
  k.strollers(136, 2730, 6, 50, 6);

  // the island: earth and stone flags, the walls drawn with the shores, the lanes along the fan
  const span = (x, t) => dejimaSouth(x) + (dejimaNorth(x) - dejimaSouth(x)) * t;
  img.fine(x0, Y(2950), x1 - x0 + 1, 155, (X, Yy, x, y) => {
    const u = 7168 - y;
    if (k.fineWater[Yy * k.FW + X] || u < dejimaSouth(x) || u > dejimaNorth(x)) return null;
    if (k.shoreD[Yy * k.FW + X] <= 5) return null;
    const t = (u - dejimaSouth(x)) / (dejimaNorth(x) - dejimaSouth(x));
    // the main street and two lanes in tamped earth edged in stone
    for (const [lane, hw] of [[0.5, 0.032], [0.255, 0.018], [0.76, 0.018]]) {
      const d = Math.abs(t - lane) / hw;
      if (d < 1) return d > 0.82 ? C.granite[2] : k.settPx(X, Yy, 23, [0x8e8470, 0xa49a84, 0xb8ae96, 0xc8bea4]);
      // the gutter that runs beside each street
      if (d < 1.34) return d < 1.12 ? 0x4a463c : C.granite[1];
    }
    // the cross lanes between the streets, each plot's side alley
    for (const lx of [50, 74, 110, 128]) {
      const d = Math.abs(x - lx);
      if (d < 1.4 && t > 0.05 && t < 0.95) return d > 1.1 ? C.granite[1] : k.settPx(X, Yy, 29, [0x7e7462, 0x8e8472, 0xa09684, 0xb0a694]);
    }
    // plots of beaten earth, each its own shade, swept in lines
    const plot = hashPx(Math.floor(x / 13), Math.floor(t * 9), 1642);
    const n0 = fbm(x, y, { seed: 1641, scale: 5 });
    const c = rampColor([0x5e5648, 0x6e6454, 0x7c7260, 0x8a806c], 0.12 + plot * 0.32 + n0 * 0.42, X, Yy);
    const g = hashPx(X, Yy, 208);
    if (hashPx(X >> 2, Yy, 1643) < 0.05) return scaleColor(c, 0.92);
    return g < 0.08 ? scaleColor(c, 0.88) : g > 0.96 ? scaleColor(c, 1.08) : c;
  });
  // the perimeter wall: a white wall capped with dark tiles, all round the fan (south and north arcs)
  for (let X = (x0 + 1) * S; X < x1 * S; X++) {
    const x = X / S;
    if (Math.abs(x - gate) < 8) {
      const YN = Math.round((7168 - dejimaNorth(x) + 1) * S);
      for (let j = 0; j < 6; j++) img.px(X, YN + j, C.granite[3]);
    }
    for (const [uu, inward] of [[dejimaSouth(x) + 2, 1], [dejimaNorth(x) - 2, -1]]) {
      if (inward < 0 && Math.abs(x - gate) < 7) continue;
      const Yy = Math.round((7168 - uu) * S);
      for (let j = -3; j <= 3; j++) img.px(X, Yy + j, j < -1 ? (X % 3 ? 0x4a505a : 0x5a606a) : j === -1 ? 0x2a2e36 : j < 2 ? 0xf0ece0 : j === 2 ? 0xc8c4b8 : 0x6a6a62);
    }
  }
  k.reserve(x0, Y(2950), x1 - x0 + 1, 155);

  /** A house on the island. kind: 'kura' (namako-walled storehouse), 'home' (upper floor white, lower timber), 'hall'. */
  const dejimaHouse = (x, w, t, kind, opt = {}) => {
    const foot = Math.round(span(x + w / 2, t));
    const rh = opt.rh ?? 10;
    const fh = opt.fh ?? 8;
    const y = Y(foot) - rh - fh;
    const bits = rng(x * 17 + foot);
    const lit = Array.from({ length: 16 }, () => bits() < 0.18 + night(2900) * 0.6);
    objects.push({
      y: Y(foot),
      shadow: () => k.shadowRect(x + 2, y + 2, w, rh + fh, 0.55),
      draw: () => {
        const X0 = x * S;
        const WW = w * S;
        const FY = (y + rh) * S;
        const HH = fh * S;
        for (let j = 0; j < HH; j++)
          for (let i = 0; i < WW; i++) {
            let c;
            if (kind === 'kura') {
              // namako: dark tiles under a white diagonal grid, plaster above
              const high = j < HH * 0.34;
              const grid = (i + j) % 9 < 1 || (i - j + 900) % 9 < 1;
              c = high ? (i > WW - 3 ? 0xc8c4b8 : 0xf2eee4) : grid ? 0xf4f0e8 : 0x3e4450;
              if (j >= 6 && j < 13 && Math.abs(i - (WW >> 1)) < 5) c = i % 3 === 0 ? 0x2a2e34 : 0x1a1a20;
            } else if (kind === 'home') {
              const mid = HH >> 1;
              if (j < mid) {
                c = 0xe6dcc4;
                const q = i % 15;
                if (j >= 3 && j < mid - 2 && q > 2 && q < 12) {
                  const on = lit[Math.floor(i / 15) & 15];
                  if (q % 3 === 0 || j % 3 === 0) c = C.oldWood[1];
                  else if (on) {
                    k.glowPx(X0 + i, FY + j, 0xffe4a8, 0.5 + night(2900) * 0.45);
                    continue;
                  } else c = 0xf0ead8;
                }
              } else if (j === mid || j === mid + 1) c = C.oldWood[j === mid ? 3 : 0];
              else c = i % 3 === 0 ? C.oldWood[0] : (j >> 2) % 2 ? C.oldWood[3] : C.oldWood[2];
              if (i % 24 < 2) c = C.oldWood[0];
            } else {
              // the seminary or club: white clapboard, sash windows
              c = j % 3 === 0 ? scaleColor(opt.wall ?? 0xf4f0e8, 0.93) : opt.wall ?? 0xf4f0e8;
              const q = i % 15;
              if (q > 3 && q < 11 && j > 3 && j < HH - 4) {
                if (j === (HH >> 1) || q === 7) c = 0xffffff;
                else if (lit[Math.floor(i / 15) & 15]) {
                  k.glowPx(X0 + i, FY + j, C.warm, 0.55 + night(2900) * 0.4);
                  continue;
                } else c = 0x3a4a5a;
              }
            }
            if (j < 3) c = scaleColor(c, 0.6);
            if (i >= WW - 2) c = scaleColor(c, 0.76);
            img.px(X0 + i, FY + j, c);
          }
        k.roof(x - 1, y, w + 2, rh, opt.ramp ?? C.kawara, { noshi: kind === 'kura', courses: kind !== 'west' });
        if (opt.stair) {
          // the Chief Factor's outside stair under its own little roof, up to the first floor
          const SX = (x + w - 9) * S;
          for (let j = 0; j < 18; j++) for (let i = 0; i < 9; i++) img.px(SX + j + i, FY + HH - 1 - j, i < 1 ? C.oldWood[3] : j % 2 ? C.oldWood[2] : C.oldWood[1]);
          for (let j = 0; j < 9; j++) for (let i = 0; i < 30; i++) img.px(SX + i, FY - 3 + j, j < 1 ? C.kawara[4] : (i % 3 ? C.kawara[2] : C.kawara[3]));
        }
      },
    });
    k.reserve(x, y, w, rh + fh);
  };
  // the four rows of the fan, near sea to near town; the flag's garden and the model's courtyard left open
  const row = (t, items) => {
    let x = x0 + 8;
    let n = 0;
    for (const it of items) {
      if (typeof it === 'number') x += it;
      else {
        if (x + it[0] > x1 - 6) break;
        dejimaHouse(x, it[0], t, it[1], it[2]);
        x += it[0] + 1;
      }
    }
    // whatever room is left to the far wall takes one more storehouse or home
    while (x + 8 <= x1 - 6) {
      const w = Math.min(x1 - 6 - x, 9 + ((x + n * 5) % 5));
      dejimaHouse(x, w, t, n++ % 2 ? 'kura' : 'home', { ramp: C.kawara });
      x += w + 1;
    }
  };
  const roofDark = { ramp: C.kawara };
  const K = (w, o) => [w, 'kura', o ?? roofDark];
  const H = (w, o) => [w, 'home', o ?? roofDark];
  row(0.04, [K(12), K(11), H(13), K(12), 30, K(12), H(12), [16, 'hall', { rh: 10, fh: 12, ramp: C.slate, wall: 0xf4f0e8 }]]);
  row(0.28, [H(14), H(10), K(10), H(13), K(7), H(12), K(10), H(14), K(9), H(10)]);
  row(0.54, [[14, 'hall', { rh: 9, fh: 9, ramp: C.slate, wall: 0xb8c8c8 }], H(13), H(11), K(8), H(14), 9, [24, 'home', { rh: 12, fh: 11, stair: true, ramp: C.kawara }], H(11), H(11)]);
  row(0.78, [K(10), H(12), H(11), K(10), 24, K(10), H(12), H(11), K(10)]);
  // the Dutch tricolour on its tall pole in the Chief Factor's garden, a pine and camphor by it, a little lawn
  {
    const fx = 90;
    const fu = Math.round(span(fx, 0.58));
    k.lawnFill(fx - 9, Y(fu) - 3, 20, 7, C.lawn, 2910);
    objects.push({
      y: Y(fu) + 1,
      shadow: () => k.shadowRect(fx + 1, Y(fu) - 1, 8, 2, 0.6),
      draw: () => {
        for (let j = 0; j < 104; j++) {
          img.px(fx * S, Y(fu) * S - j, 0xf0ece0);
          img.px(fx * S + 1, Y(fu) * S - j, 0xa8a498);
        }
        img.discPx(fx * S, Y(fu) * S - 105, 1.6, C.gold);
      },
    });
    const flag = [0, 1, 2].map((f) => k.sprite(12, 9, fu, (r) => {
      for (let X = 0; X < 33; X++) {
        const dy = Math.round(Math.sin(X * 0.2 + f * 2) * (X / 12));
        for (let j = 0; j < 18; j++) r.px(X, 4 + j + dy, j < 6 ? 0xc8302a : j < 12 ? 0xf4f0e8 : 0x2a4a9a);
      }
    }));
    kit.loop(fx + 1, fu + 34, flag, { fps: 3 });
    k.niwaki(fx - 6, fu + 1, 1, 1636);
    k.tree(fx + 6, Y(fu + 2), 3.5, CAMPHOR, 1637);
  }
  // the 1:15 model of Dejima in its courtyard: a tiny fan with tiny roofs in a blue moat, visitors round it
  {
    const cx = 88;
    const cy = Y(Math.round(dejimaSouth(88) + 15));
    img.fine(cx - 13, cy - 7, 26, 14, (X, Yy, x, y) => {
      const d = Math.hypot((x - cx) / 13, (y - cy) / 7);
      if (d > 1) return null;
      if (d > 0.92) return C.granite[3];
      return (X + (Yy >> 1)) % 11 === 0 ? 0x8ac0d8 : 0x3a7a9a;
    });
    const CX = cx * S;
    const CY = cy * S;
    for (let X = -27; X <= 27; X++) {
      const c0 = Math.round((X * X) / 90);
      for (let j = -6; j <= 6; j++) img.px(CX + X, CY + j + c0 - 3, Math.abs(j) > 5 ? 0xf0ece0 : 0xc8b890);
    }
    for (let X = -24; X <= 24; X += 5) {
      const c0 = Math.round((X * X) / 90);
      for (const dy of [-7, 1]) {
        img.rectPx(CX + X, CY + c0 + dy, 4, 2, 0x3a3e48);
        img.rectPx(CX + X, CY + c0 + dy + 2, 4, 2, 0xe8e0d0);
      }
    }
    img.px(CX, CY - 8, 0xd83a2a);
    img.px(CX, CY - 7, 0xf4f0e8);
    k.crowd(cx - 14, cy + 5, 28, 2, 7);
    k.reserve(cx - 14, cy - 8, 28, 16);
  }
  k.niwaki(122, Math.round(span(122, 0.26)) + 1, 0.8, 2);
  k.niwaki(50, Math.round(span(50, 0.5)) + 1, 0.8, 3);
  for (const x of [40, 62, 82, 106, 126]) k.stoneLantern(x, Math.round(span(x, 0.5) - 3), true);
  // the water gate on the seaward wall: steps down to the landing stage, a sampan tied up
  {
    const Yb = Y(Math.round(dejimaSouth(46))) * S;
    for (let j = 0; j < 12; j++) for (let i = 0; i < 18; i++) img.px(44 * S + i, Yb + j, j % 3 === 0 ? C.granite[4] : j % 3 === 1 ? C.granite[2] : C.granite[0]);
    for (let j = 0; j < 7; j++) for (let i = -6; i < 24; i++) img.px(44 * S + i, Yb + 12 + j, j < 1 ? C.wood[3] : i % 6 < 1 ? C.wood[0] : C.wood[2]);
    for (let j = 0; j < 5; j++) for (let i = -9; i < 27; i++) img.tintPx(44 * S + i, Yb + 19 + j, 0.7);
  }
  // the Omotemon gate and its bridge over the channel to the town
  {
    const gy = Y(Math.round(dejimaNorth(gate)));
    objects.push({
      y: gy + 3,
      draw: () => {
        const GX = gate * S;
        for (const q of [-18, 15]) for (let j = -21; j < 3; j++) for (let i = 0; i < 6; i++) img.px(GX + q + i, gy * S + j, i < 1 ? C.oldWood[3] : i > 4 ? 0x2a2018 : C.oldWood[0]);
        for (let i = -15; i < 15; i++) for (let j = -18; j < 3; j++) img.px(GX + i, gy * S + j, j < -15 ? C.oldWood[1] : Math.abs(i) < 1 ? 0x1a1410 : (i >> 2) % 2 ? 0x3a2c22 : 0x2e2218);
        k.roof(gate - 8, gy - 12, 17, 5, C.kawara, { noshi: true });
      },
    });
    k.way([[gate, EMBANK + 8], [gate, Math.round(dejimaNorth(gate)) + 1]], 5, {
      overWater: true,
      kerb: 0x8a6a4a,
      paint: (X, Yy) => {
        if (Yy % 3 === 0) return C.wood[0];
        const c = rampColor(C.wood, 0.45 + hashPx(X >> 2, Yy >> 1, 209) * 0.5, X, Yy);
        return c;
      },
    });
    for (let X = (gate - 5) * S; X < (gate + 5) * S; X++) for (let j = 0; j < 4; j++) img.tintPx(X, gy * S + 3 + j, 0.66);
    k.walkers([[gate, EMBANK + 10], [gate, Math.round(dejimaNorth(gate)) - 2]], 2, 2950, { sp: 3 });
  }
  // the Dutch garden behind the north row: gravel walks, box-edged beds of flowers the Company brought, a sundial, two pines
  {
    const gx0 = 77;
    const gu0 = 2902;
    img.fine(gx0, Y(gu0 + 22), 21, 22, (X, Yy, x, y) => {
      const u = 7168 - y;
      const dx = x - gx0;
      const dy = u - gu0;
      const walk = Math.abs(dx - 10.5) < 1.2 || Math.abs(dy - 11) < 1.2;
      if (dx < 0.7 || dx > 20.3 || dy < 0.7 || dy > 21.3) return C.granite[2];
      if (Math.hypot(dx - 10.5, dy - 11) < 2.6) return 0xb8ac94;
      if (walk) return rampColor([0x9a9080, 0xaea494, 0xc0b6a4], hashPx(X, Yy, 1644), X, Yy);
      const bx = dx < 10.5 ? dx - 1.5 : dx - 12;
      const by = dy < 11 ? dy - 1.5 : dy - 12.5;
      if (bx < 0.7 || bx > 7.3 || by < 0.7 || by > 7.6) return (X + Yy) % 3 ? 0x2a4a2c : 0x3a5a36;
      const b = hashPx(X >> 1, Yy >> 1, 1645);
      const hue = [0xe85a70, 0xf0d060, 0xf0ece0, 0xb070d0][Math.floor((dx + dy * 3) / 11) & 3];
      return b < 0.34 ? hue : b < 0.42 ? 0xffffff : rampColor(C.lawn, 0.2 + b * 0.6, X, Yy);
    });
    objects.push({
      y: Y(gu0 + 11),
      draw: () => {
        const CX = Math.round((gx0 + 10.5) * S);
        const CY = Y(gu0 + 11) * S;
        img.rectPx(CX - 2, CY - 9, 5, 9, C.granite[3]);
        img.rectPx(CX - 4, CY - 11, 9, 2, C.granite[4]);
        for (let i = 0; i < 5; i++) img.px(CX + i, CY - 11 - i, 0x8a7030);
      },
    });
    k.niwaki(gx0 + 3, gu0 + 19, 0.7, 1646);
    k.niwaki(gx0 + 18, gu0 + 19, 0.7, 1647);
    k.strollers(gx0 + 10, gu0 + 6, 7, 1.5, 2);
  }
  /** What the Company shipped: casks, bales of sugar, crates, stacked against the walls and in the yards. */
  const cargo = (x, u, seed2) => {
    objects.push({
      y: Y(u),
      shadow: () => k.shadowRect(x + 1, Y(u) - 3, 7, 4, 0.5),
      draw: () => {
        const X = x * S;
        const Yb = Y(u) * S;
        const g = rng(seed2);
        for (let q = 0; q < 5; q++) {
          const a = X + Math.floor(g() * 15);
          const b = Yb - Math.floor(g() * 7);
          const kind = g();
          if (kind < 0.42) {
            // a cask, its hoops
            for (let j = 0; j < 8; j++) for (let i = -3; i <= 3; i++) img.px(a + i, b - j, j === 1 || j === 6 ? 0x3a3028 : i > 1 ? C.wood[0] : i < -1 ? C.wood[3] : C.wood[2]);
            for (let i = -2; i <= 2; i++) img.px(a + i, b - 8, C.wood[3]);
          } else if (kind < 0.74) {
            // a bale, corded
            for (let j = 0; j < 6; j++) for (let i = -5; i <= 5; i++) img.px(a + i, b - j, i === 0 || j === 3 ? 0x6a5a40 : j < 2 ? 0xd8ccb0 : i > 3 ? 0x98886c : 0xbcae90);
          } else {
            // a crate, its slats
            for (let j = 0; j < 7; j++) for (let i = -4; i <= 4; i++) img.px(a + i, b - j, j < 2 ? C.wood[3] : (i + 8) % 3 === 0 ? C.wood[0] : C.wood[2]);
          }
        }
      },
    });
  };
  for (const [t, xs] of [[0.17, [24, 135]], [0.4, [24, 135]], [0.62, [135]], [0.72, [24]], [0.9, [28, 133]]]) for (const x of xs) cargo(x, Math.round(span(x, t)), x * 13 + Math.round(t * 100));
  // the well in the street's bend, its cover and bucket; a hand cart left by a door
  {
    const wx = 62;
    const wu = Math.round(span(wx, 0.455));
    objects.push({
      y: Y(wu),
      shadow: () => k.shadowEllipse(wx + 2, Y(wu), 4, 2, 0.5),
      draw: () => {
        const X = wx * S;
        const Yb = Y(wu) * S;
        for (let j = 0; j < 7; j++) for (let i = -6; i <= 6; i++) img.px(X + i, Yb - j, i > 4 ? C.granite[0] : i < -4 ? C.granite[3] : j % 3 === 0 ? C.granite[1] : C.granite[2]);
        for (let j = -3; j <= 3; j++) for (let i = -6; i <= 6; i++) if ((i / 6.4) ** 2 + (j / 3.4) ** 2 < 1) img.px(X + i, Yb - 8 + j, i % 3 === 0 ? C.wood[0] : C.wood[3]);
      },
    });
  }
  // along the main street: banners on their poles outside the shops, paper lanterns over the door
  for (const [x, c] of [[36, 0x2a3a7a], [46, 0x8a2a2a], [58, 0x2a3a7a], [70, 0xe8d8b0], [86, 0x8a2a2a], [100, 0x2a3a7a], [116, 0xe8d8b0], [132, 0x8a2a2a]]) {
    const u = Math.round(span(x, 0.53));
    objects.push({
      y: Y(u),
      draw: () => {
        const X = x * S;
        const Yb = Y(u) * S;
        for (let j = 0; j < 27; j++) img.px(X, Yb - j, C.wood[1]);
        for (let j = 3; j < 21; j++) for (let i = 1; i < 7; i++) img.px(X + i, Yb - 27 + j, (i === 3 || i === 4) && j % 4 < 2 ? scaleColor(c, 1.8) : i > 5 ? scaleColor(c, 0.74) : c);
      },
    });
  }
  for (const x of [41, 54, 66, 80, 96, 106, 122, 134]) {
    const u = Math.round(span(x, 0.47));
    const cc = x % 3 ? 0xffc070 : 0xff9a58;
    objects.push({
      y: Y(u),
      draw: () => {
        const X = x * S;
        const Yb = Y(u) * S;
        for (let j = 0; j < 15; j++) img.px(X, Yb - j, 0x3a2a20);
        for (let j = -3; j <= 3; j++) for (let i = -2; i <= 2; i++) if (i * i + j * j < 10) glowPx(X + i, Yb - 18 + j, cc, 0.95);
        pool(x, Y(u) - 3, 6, 0xffc888, 0.12 + night(2880) * 0.2);
      },
    });
  }
  // the visitors: strolling the back lanes too, a guide with a little group, someone looking in at a storehouse
  k.walkers([[34, Math.round(span(34, 0.255)) + 1], [76, Math.round(span(76, 0.255)) + 1], [132, Math.round(span(132, 0.255)) + 1]], 3, 2826, { sp: 2.6, gap: 50 });
  k.walkers([[132, Math.round(span(132, 0.76)) + 1], [84, Math.round(span(84, 0.76)) + 1], [34, Math.round(span(34, 0.76)) + 1]], 3, 2900, { sp: 2.8, gap: 44 });
  for (const lx of [50, 110]) k.walkers([[lx, Math.round(span(lx, 0.26))], [lx, Math.round(span(lx, 0.5))], [lx, Math.round(span(lx, 0.76))]], 1, 2850 + lx, { sp: 2.2, gap: 60 });
  k.crowd(52, Y(Math.round(span(52, 0.505))) - 1, 16, 2, 5);
  k.crowd(104, Y(Math.round(span(104, 0.5))) - 1, 14, 2, 4);
  // visitors in the street, a boat or two moored in the bay
  k.walkers([[34, Math.round(span(34, 0.5)) + 1], [88, Math.round(span(88, 0.5)) + 1], [130, Math.round(span(130, 0.5)) + 1]], 5, 2870, { sp: 3, gap: 40 });
  k.strollers(88, Math.round(span(88, 0.5)), 40, 1.5, 4);
  for (const [x, u, col] of [[60, 2720, 0xe8e4d8], [16, 2860, 0x3a6a8a], [112, 2690, 0xe8e4d8]]) {
    const f = k.hull(5, 13, u, col, 0xc8c0a8, (r, FL, FHh) => {
      for (let j = 6; j < 24; j++) for (let i = 4; i < FL - 4; i++) r.px(i, j, 0xe8e4d8);
    });
    kit.loop(x, u + 13, [f], { d: 0.02 });
  }
}

// ---------------------------------------------------------------------------------------------- Shinchi
export function paintShinchi(k) {
  const { img, Y, kit, objects, glowPx, pool } = k;
  const R = rng(1698);
  const CROSS = STREETS.find((s) => s.u === 3330);
  const roofs = [C.chinaGreen, C.redTile, C.chinaGreen, C.kawara];
  // quadrants of shops: rows facing south, red and green, lanterns and signs, steam from the kitchens
  const quads = [[31, 84, 2998, 3322], [100, 151, 2998, 3322], [31, 84, 3338, 3652], [100, 151, 3338, 3652]];
  // Minato Park at the corner of the quarter: the heart of the Lantern Festival. A paved square, a Chinese pavilion, a
  // little stage, a wall of red lanterns and the great lantern figures standing on it
  {
    const px0 = 104;
    const px1 = 150;
    const pu0 = 3004;
    const pu1 = 3064;
    k.flagFill(px0, Y(pu1), px1 - px0, pu1 - pu0, [0x8a4a3a, 0x9a5a48, 0xaa6a56, 0xba7a64], 3005, 15);
    k.reserve(px0, Y(pu1), px1 - px0, pu1 - pu0);
    k.house(116, Y(pu1 - 2), 22, 10, 8, 'china', { ramp: C.chinaGreen, wall: 0xa8483a, reserve: false, doorX: 9 });
    for (const [x, u] of [[108, 3020], [142, 3020], [108, 3046], [142, 3046]]) k.tree(x, Y(u), 3.6, CAMPHOR, x + u);
    const figure = (x, u, c, kind) => {
      objects.push({
        y: Y(u) + 1,
        shadow: () => k.shadowEllipse(x + 2, Y(u) + 1, 6, 2, 0.6),
        draw: () => {
          const X = x * S;
          const Yb = Y(u) * S;
          // its stand
          for (let j = 0; j < 9; j++) {
            img.px(X, Yb - j, 0x4a2a1c);
            img.px(X + 1, Yb - j, 0x2e1a12);
          }
          for (let i = -6; i <= 6; i++) img.px(X + i, Yb, 0x4a2a1c);
          if (kind === 1) {
            // a tower of three gold lanterns, one above another
            for (let t = 0; t < 3; t++) {
              const cy = Yb - 15 - t * 15;
              const R0 = 10 - t * 2;
              for (let j = -6; j <= 6; j++)
                for (let i = -R0; i <= R0; i++) {
                  if ((i / R0) ** 2 + (j / 6.6) ** 2 > 1) continue;
                  const rib = Math.abs(Math.round(i * 0.5)) % 2 === 0 && i % 4 === 0;
                  glowPx(X + i, cy + j, rib ? 0xc87a18 : j < -2 ? 0xfff0a0 : 0xffc838, 0.96);
                }
              for (let i = -R0 + 2; i <= R0 - 2; i++) {
                img.px(X + i, cy - 7, 0xc82a1a);
                img.px(X + i, cy + 7, 0xc82a1a);
              }
            }
          } else {
            // a great round lantern: red paper, ribs, gold caps, a tassel
            const cy = Yb - 27;
            const R0 = 18;
            for (let j = -16; j <= 16; j++)
              for (let i = -R0; i <= R0; i++) {
                const q = (i / R0) ** 2 + (j / 16.5) ** 2;
                if (q > 1) continue;
                const w = R0 * Math.sqrt(Math.max(0.01, 1 - (j / 16.5) ** 2));
                const rib = Math.abs(((i / w) * 3 + 6) % 1) < 0.14;
                const lit = 1 - q * 0.45;
                const col = rib ? 0x8a1410 : (Math.floor((j + 20) / 5) % 2 ? c : scaleColor(c, 1.14));
                glowPx(X + i, cy + j, scaleColor(col, lit + 0.1), 0.97);
              }
            for (const yy of [cy - 17, cy + 17]) for (let j = 0; j < 4; j++) for (let i = -8; i <= 8; i++) img.px(X + i, yy + j - 2, j < 1 ? C.goldHi : C.gold);
            for (let j = 0; j < 9; j++) img.px(X, cy + 19 + j, 0xe8b830);
            for (let i = -2; i <= 2; i++) img.px(X + i, cy + 28, 0xe8b830);
          }
          pool(x, Y(u) - 6, 11, c, 0.24);
        },
      });
      k.reserve(x - 2, Y(u) - 2, 4, 4);
    };
    figure(112, 3032, 0xe8301e, 0);
    figure(127, 3026, 0xffc040, 1);
    figure(141, 3034, 0xe8301e, 0);
    // strings of red lanterns across the square
    for (const u of [3014, 3040, 3056]) {
      for (let X = (px0 + 1) * S; X < (px1 - 1) * S; X += 9) {
        const sag = Math.round(Math.sin(((X - px0 * S) / ((px1 - px0) * S)) * Math.PI) * 5);
        const Yy = Y(u) * S + sag;
        for (let j = 0; j < 7; j++) for (let i = -2; i <= 2; i++) if (Math.abs(i) < 3 - Math.abs(j - 3) * 0.3) k.glowPx(X + i, Yy + j, j === 0 || j === 6 ? C.gold : i < 0 ? 0xff7a5a : 0xe83a2a, 0.95);
      }
    }
    k.crowd(px0 + 2, Y(pu1 - 16), px1 - px0 - 4, 44, 26);
    k.strollers(127, 3024, 18, 12, 4);
  }
  // the alleys across the quarters: narrow lanes of setts, red lanterns on a wire overhead, little kitchens' back doors
  for (const [ax0, ax1, au] of [[31, 84, 3092], [100, 151, 3126], [31, 84, 3212], [100, 151, 3246], [31, 84, 3430], [100, 151, 3412], [31, 84, 3544], [100, 151, 3530]]) {
    const pts = [];
    for (let x = ax0; x <= ax1; x += 8) pts.push([x, au + Math.sin(x * 0.2 + au) * 1.2]);
    k.way(pts, 2.2, { paint: (X, Yy) => k.settPx(X, Yy, 33, C.stoneSet), kerb: null });
    for (let X = (ax0 + 2) * S; X < (ax1 - 2) * S; X += 12) {
      const Yy = Y(au) * S - 2;
      img.px(X, Yy - 1, 0x2a2026);
      for (let j = 0; j < 5; j++) for (let i = -1; i <= 1; i++) k.glowPx(X + i, Yy + j, j === 0 || j === 4 ? C.gold : 0xe8482a, 0.92);
    }
    k.crowd(ax0 + 2, Y(au) - 1, ax1 - ax0 - 4, 2, 5);
  }
  // along the river's west side: willows between stalls on the walk; a line of red lanterns
  for (let u = 3010; u < 3650; u += 58) {
    if (Math.abs(u - CROSS.u) < 16) continue;
    objects.push({
      y: Y(u) + 3,
      shadow: () => k.shadowRect(29, Y(u + 6), 3, 7, 0.66),
      draw: () => {
        const X = 28 * S;
        const Yy = Y(u + 6) * S;
        for (let j = 0; j < 18; j++) for (let i = 0; i < 9; i++) img.px(X + i, Yy + j, i > 7 ? 0x6a1e16 : (j >> 2) % 2 ? 0xdc442e : 0xf0e8d8);
        k.glowPx(X + 4, Yy + 9, 0xffd890, 0.9);
      },
    });
  }
  for (const [qx0, qx1, qu0, qu1] of quads) {
    for (let u = qu0; u + 16 <= qu1; u += 24) {
      const h = Math.min(23, qu1 - u);
      let x = qx0 + Math.floor(R() * 3);
      while (x < qx1 - 5) {
        let w = 8 + Math.floor(R() * 11);
        if (qx1 - x - w < 7) w = qx1 - x;
        const yTop = Y(u + h);
        if (k.anyRes(x, yTop, w, h)) {
          x += 3;
          continue;
        }
        if (!k.anyRes(x, yTop, w, h)) {
          const tall = R() < 0.3;
          const style = tall ? 'block' : 'china';
          const rh = tall ? 9 : Math.round(h * 0.45);
          const hx = x;
          const hw = w;
          const hu = u;
          const signC = R.pick([0xe8b830, 0xc8302a, 0x2aa86a]);
          const signSide = R() < 0.5;
          k.house(x, yTop, w - 1, rh, h - rh, style, {
            ramp: R.pick(roofs),
            wall: R.pick([0x8a3a32, 0xa8483a, 0x7a5a48, 0xd8c8a8, 0x6a7a6a, 0xc8a070]),
            roofC: R.pick([0x6a6e74, 0x5a6068, 0x7a7068]),
            noren: R.pick([0xc8302a, 0xe8b830, 0x2a6a4a]),
            door: !tall,
            extra: (by) => {
              // an upright signboard with its characters, a pair of paper lanterns on the front
              if (hw > 10) {
                const SX = (signSide ? hx + 1 : hx + hw - 4) * S;
                const SY = (by - 11) * S;
                for (let j = 0; j < 27; j++)
                  for (let i = 0; i < 7; i++) {
                    const e = Math.min(i, 6 - i, j, 26 - j);
                    let c = e < 1 ? 0x2a2026 : signC;
                    if (e > 1 && j % 7 > 1 && hashPx(i, j >> 1, hx) < 0.5) c = 0xfff8e0;
                    if (night(hu) > 0.3 && e >= 1) glowPx(SX + i, SY + j, c, 0.85);
                    else img.px(SX + i, SY + j, c);
                  }
              }
              for (const lx of [hx + 2, hx + hw - 3]) {
                const LX = lx * S;
                const LY = (by - 5) * S;
                img.px(LX, LY - 2, 0x2a2026);
                for (let j = 0; j < 7; j++) for (let i = -2; i <= 2; i++) if (Math.abs(i) < 3 - Math.abs(j - 3) * 0.3) img.px(LX + i, LY + j, j === 0 || j === 6 ? C.gold : i < 0 ? 0xff6a4a : 0xe83a2a);
                glowPx(LX, LY + 3, 0xffa070, 0.7 + night(hu) * 0.3);
              }
              k.pool(hx + hw / 2, by, 7, 0xff7040, 0.08 + night(hu) * 0.16);
            },
          });
          // a kitchen's vent steaming on the roof now and then
          if (R() < 0.08) kit.emit(x + w / 2, u + h - 2, [[k.kit.frame(k.puff(5, u & 255, [0xb0b0b8, 0xd0d0d8, 0xebebf0, 0xffffff]))]], { rate: 0.8, life: [1.1, 1.8], vy: 5, sx: 1, wf: 0.6, a: 0.28 });
        }
        x += w + 1;
      }
    }
  }
  for (const [qx0, qx1, qu0, qu1] of quads)
    k.fillGaps(qx0, qx1, qu0, qu1, (x, u, w, h) => {
      const rh = Math.round(h * 0.46);
      const tall = R() < 0.22;
      k.house(x, Y(u + h), w - 1, tall ? Math.max(6, h - 8) : rh, tall ? Math.min(8, h - 6) : h - rh, tall ? 'block' : 'china', {
        ramp: R.pick(roofs),
        wall: R.pick([0x8a3a32, 0xa8483a, 0x7a5a48, 0xd8c8a8, 0x6a7a6a, 0xc8a070]),
        roofC: R.pick([0x6a6e74, 0x5a6068, 0x7a7068]),
        noren: R.pick([0xc8302a, 0xe8b830, 0x2a6a4a]),
        door: !tall,
      });
    });
  // the main street: strings of lanterns overhead, swaying gently; red pillars; steamers of kakuni-manju; crowds
  const string = [0, 1, 2].map((f) =>
    k.sprite(15, 8, 3300, (r) => {
      for (let X = 0; X < 45; X++) r.px(X, 3 + Math.round(Math.sin((X / 44) * Math.PI) * 3), 0x4a3a2a);
      for (let X = 3; X < 45; X += 9) {
        const dy = Math.round(Math.sin((X / 44) * Math.PI) * 3) + ((Math.floor(X / 9) + f) % 2);
        for (let j = 0; j < 11; j++) {
          const hw = 3.6 - Math.abs(j - 5) * 0.32;
          for (let i = -hw; i <= hw; i++) r.px(X + i, 6 + dy + j, j === 0 || j === 10 ? 0xe8b830 : j % 3 === 2 ? 0xc8282a : i < -1 ? 0xff9a6a : 0xe83a2a);
        }
        r.px(X, 18 + dy, 0xe8b830);
        r.px(X, 19 + dy, 0xe8b830);
      }
    }, false),
  );
  for (let u = 3020; u < 3640; u += 26) kit.loop(CHINA_X - 7, u, string, { fps: 1.2, d: 0.6 });
  for (let u = 3020; u < 3640; u += 26) for (let x = CHINA_X - 6; x < CHINA_X + 7; x += 4) k.pool(x, Y(u) + 5, 4, 0xff5a30, 0.12 + night(u) * 0.2);
  // across the cross street too
  for (const x of [46, 64, 112, 130]) kit.loop(x, CROSS.u + 6, string, { fps: 1.2, d: 0.6 });
  for (let u = 3006; u < 3646; u += 38) k.crowd(CHINA_X - 6, Y(u + 30), 12, 30, 7);
  k.crowd(40, Y(CROSS.u + 4), 40, 8, 14);
  k.crowd(104, Y(CROSS.u + 4), 40, 8, 14);
  k.walkers([[CHINA_X - 3, 3006], [CHINA_X - 3, 3646]], 6, 3300, { sp: 3, gap: 90 });
  k.walkers([[CHINA_X + 3, 3646], [CHINA_X + 3, 3006]], 6, 3300, { sp: 3, gap: 100 });
  k.walkers([[34, CROSS.u + 2], [150, CROSS.u + 2]], 4, 3330, { sp: 3, gap: 30 });
  const steam = [[0, 1].map((v) => k.kit.frame(k.puff(6, 71 + v, [0xb0b0b8, 0xd0d0d8, 0xebebf0, 0xffffff])))];
  // the steamer carts: bamboo baskets stacked on a red cart, the steam off them
  for (const [x, u] of [[CHINA_X - 9, 3110], [CHINA_X + 8, 3240], [CHINA_X - 9, 3420], [CHINA_X + 8, 3560], [CHINA_X - 9, 3200], [CHINA_X + 8, 3480]]) {
    objects.push({
      y: Y(u) + 3,
      shadow: () => k.shadowRect(x, Y(u), 5, 3, 0.66),
      draw: () => {
        const X = x * S - 2;
        const Yy = Y(u) * S;
        for (let j = 0; j < 9; j++) for (let i = 0; i < 15; i++) img.px(X + i, Yy + j, j < 1 ? 0xe85a3e : i % 5 === 0 ? 0x7a1a14 : 0xa8261e);
        for (const q of [0, 1, 2]) for (let j = 0; j < 4; j++) for (let i = 1; i < 14; i++) img.px(X + i, Yy - 3 - q * 3 + j, j === 0 ? 0xe8d8a0 : i % 2 ? 0xc8a868 : 0xa88848);
      },
    });
    kit.emit(x + 2, u + 7, steam, { rate: 1.3, life: [1.1, 1.8], vy: 6, sx: 2, wf: 0.6, a: 0.4 });
  }
  // the four gates: south and north across the main street, west and east across the cross street
  const paifang = (cx, footU, half) => {
    const y = Y(footU);
    objects.push({
      y: y + 1,
      shadow: () => k.shadowRect(cx - half + 3, y - 2, half * 2, 4, 0.55),
      draw: () => {
        const CX = cx * S;
        const Yb = y * S;
        const H3 = half * S;
        // four red pillars on their carved stone bases, with gold bands
        for (const px of [-H3, -Math.round(H3 / 3), Math.round(H3 / 3) - 6, H3 - 6]) {
          for (let j = -48; j < 3; j++) for (let i = 0; i < 6; i++) img.px(CX + px + i, Yb + j, (j + 60) % 18 < 2 ? C.gold : i < 1 ? C.vermilion[3] : i > 4 ? C.vermilion[0] : C.vermilion[2]);
          for (let j = 0; j < 6; j++) for (let i = -2; i < 8; i++) img.px(CX + px + i, Yb + j, j < 1 ? C.granite[4] : i > 6 ? C.granite[0] : C.granite[2]);
        }
        // the beams, painted in bands, the tablet in dark blue with its gold characters
        for (let j = 0; j < 9; j++) for (let i = -H3 - 3; i < H3 + 3; i++) img.px(CX + i, Yb - 42 + j, j < 1 ? C.vermilion[3] : j > 7 ? C.vermilion[0] : (i >> 3) % 2 ? C.vermilion[2] : 0x2a6a4a);
        for (let j = 0; j < 12; j++) for (let i = -15; i < 15; i++) {
          const e = Math.min(i + 15, 14 - i, j, 11 - j);
          img.px(CX + i, Yb - 39 + j, e < 1 ? C.gold : e > 1 && hashPx(i >> 1, j >> 1, cx) < 0.45 ? C.goldHi : 0x1a3a5a);
        }
        k.roof(cx - half - 4, y - 22, half * 2 + 8, 7, C.chinaGreen, { curl: true, ridgeC: C.vermilion[2] });
        k.roof(cx - Math.round(half / 2) - 2, y - 27, half + 4, 5, C.chinaGreen, { curl: true, ridgeC: C.gold });
        for (const s of [-H3, H3 - 1]) {
          glowPx(CX + s, Yb - 30, 0xff6a3a, 0.9);
          glowPx(CX + s, Yb - 29, 0xffa070, 0.9);
        }
      },
    });
  };
  paifang(CHINA_X, 3004, 11);
  paifang(CHINA_X, 3648, 11);
  const sideGate = (cx, u) => {
    const y = Y(u);
    objects.push({
      y: y + CROSS.hw + 2,
      shadow: () => k.shadowRect(cx + 2, y - CROSS.hw, 4, CROSS.hw * 2 + 2, 0.55),
      draw: () => {
        const X = cx * S;
        for (const py of [y - CROSS.hw - 1, y + CROSS.hw]) for (let j = -36; j < 3; j++) for (let i = 0; i < 6; i++) img.px(X + i, py * S + j, (j + 40) % 15 < 2 ? C.gold : i < 1 ? C.vermilion[3] : i > 4 ? C.vermilion[0] : C.vermilion[2]);
        // its long roof seen end-on along the street, green tiles, the red ridge, the tablet on its beam
        const Y0 = (y - CROSS.hw - 17) * S;
        const Y1 = (y + CROSS.hw - 9) * S;
        for (let Yy = Y0; Yy < Y1; Yy++)
          for (let i = -6; i < 15; i++) {
            const q = (i - 4) / 10;
            let c = rampColor(C.chinaGreen, 0.8 - (q + 1) * 0.35, X + i, Yy);
            if (Yy % 3 === 0) c = scaleColor(c, 0.84);
            if (Math.abs(i - 4) < 2) c = C.vermilion[2];
            img.px(X + i, Yy, c);
          }
        for (let j = 0; j < 12; j++) for (let i = 0; i < 6; i++) img.px(X + i, y * S - 18 + j, i === 0 || j === 0 || j === 11 ? C.gold : hashPx(i, j >> 1, cx) < 0.4 ? C.goldHi : 0x1a3a5a);
      },
    });
  };
  sideGate(36, CROSS.u);
  sideGate(148, CROSS.u);
  // the Tsukimachi tram stop on R1, and R1's east verge: a row of narrow buildings at the very edge
  tramStop(k, 3090, 3118);
  eastEdge(k, 2998, 3650, 2998, 'china');
}
