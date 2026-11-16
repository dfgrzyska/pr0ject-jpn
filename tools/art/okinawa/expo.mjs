// The Ocean Expo Park at Bise's foot, between the coast road and the village. West of the lane the Churaumi aquarium: a car
// park with coaches, the plaza with the whale shark in bronze, the long concrete building under its pergolas, and through the
// glass over the Kuroshio tank two whale sharks, mantas and a school of fish going round. East of it the Okichan theatre,
// dolphins leaping in their lagoon before the stands, and the sea turtles' pool with its strip of sand.
import { S, hashPx, scaleColor, rampColor, rng, fbm, mix } from '../nagasaki/canvas.mjs';
import { W, ROAD_U } from './geo.mjs';
import { C, COATS } from './common.mjs';

export const PARK = [1163, 1340];
const LANE = [84.5, 95.5]; // Bise's main lane, through the middle

export function paintExpo(k) {
  const { img, Y, kit, objects } = k;
  const { plant, parked } = k.t;
  const yT = Y(PARK[1]);
  const yB = Y(PARK[0]);

  // what was reserved here before the park (the lane, a turret's pad): the planting at the end draws its random numbers by it
  {
    const y0 = yT - 12;
    const h = yB - yT + 24;
    const grid = new Uint8Array(W * h);
    for (let j = 0; j < h; j++) for (let x = 0; x < W; x++) grid[j * W + x] = k.isRes(x, y0 + j) ? 1 : 0;
    k.parkWas = (x, y) => {
      const j = Math.floor(y) - y0;
      return j < 0 || j >= h || x < 0 || x >= W ? k.isRes(x, y) : grid[j * W + Math.floor(x)] === 1;
    };
  }
  const padAt = (x, y) => k.pads.some((p) => Math.hypot(x - p.x, y - Y(p.u)) < 11.5);
  const onLane = (x) => x > LANE[0] && x < LANE[1];

  // ------------------------------------------------------------ the ground: mown lawn; paths of pale flags
  const PAVE = [0xcfc4a8, 0xdcd2b8, 0xe8dfc8];
  const paths = [
    // [x0, u0, x1, u1, half-width]
    [8, 1214, 84, 1214, 2.4], // the plaza's walk, from the lane to the doors
    [96, 1206, 132, 1206, 1.8], // from the lane to the turtles
    [150, 1228, 150, 1268, 1.8], // from the turtles up to the stands
    [96, 1279, 106, 1279, 1.8], // from the lane to the stands
    [40, 1163, 40, 1196, 1.6], // from the car park up to the plaza (beside the drive)
  ];
  const pathD = (x, u) => {
    let best = 99;
    for (const [x0, u0, x1, u1, hw] of paths) {
      const t = Math.max(0, Math.min(1, ((x - x0) * (x1 - x0) + (u - u0) * (u1 - u0)) / ((x1 - x0) ** 2 + (u1 - u0) ** 2)));
      best = Math.min(best, Math.hypot(x - (x0 + (x1 - x0) * t), u - (u0 + (u1 - u0) * t)) - hw);
    }
    return best;
  };
  const TURTLE = [150, 1208, 17, 13]; // the turtles' pool: x, u, half-width, half-height
  const LAGOON = [138, 1308, 31, 19]; // the dolphins'
  img.fine(0, yT, W, yB - yT, (X, Yy, x, y) => {
    if (onLane(x) || padAt(x, y)) return null;
    const u = 7168 - y;
    const n = fbm(x, y, { seed: 301, scale: 7, octaves: 2 });
    const pd = pathD(x, u);
    const ring = Math.hypot((x - TURTLE[0]) / (TURTLE[2] + 4), (u - TURTLE[1]) / (TURTLE[3] + 4));
    const ringL = Math.hypot((x - LAGOON[0]) / (LAGOON[2] + 4), (u - LAGOON[1]) / (LAGOON[3] + 4));
    if (pd < 0 || ring < 1 || ringL < 1) return pd > -0.4 && ring >= 1 && ringL >= 1 ? PAVE[0] : k.settPx(X, Yy, 302, PAVE);
    // mown in stripes, a little worn beside the paths
    const c = k.lawnPx(X, Yy, 0.42 + n * 0.4 + (Math.floor((x + y) / 5) % 2 ? 0.08 : 0), C.grass);
    return pd < 0.8 ? mix(c, PAVE[0], 0.35) : c;
  });

  // ------------------------------------------------------------ the car park off the coast road
  {
    const [x0, x1, u0, u1] = [6, 80, 1164, 1194];
    img.fine(x0, Y(u1), x1 - x0, u1 - u0, (X, Yy, x, y) => {
      const u = 7168 - y;
      const e = Math.min(x - x0, x1 - x, u - u0, u1 - u);
      if (e < 0.5) return 0xb8b4a8; // kerb
      const bay = (u > 1166 && u < 1174) || (u > 1184 && u < 1192);
      if (bay && Math.abs(((x - x0) % 7.4) - 0.2) < 0.2) return 0xe8e6dc;
      if (Math.abs(u - 1174) < 0.17 || Math.abs(u - 1184) < 0.17) return 0xe8e6dc;
      return k.asphaltPx(X, Yy);
    });
    // its mouth on the road
    img.fine(22, Y(u0), 10, u0 - (ROAD_U + 9), (X, Yy) => k.asphaltPx(X, Yy));
    k.reserve(x0, Y(u1), x1 - x0, u1 - ROAD_U - 9);
    const g = rng(311);
    const CARC = [0xe8e8ec, 0x2a5ab0, 0xc8302a, 0x3a3a42, 0xd8d8d0, 0x4a8a6a, 0xe8d69c, 0x8a8e94];
    for (const u of [1173, 1191])
      for (let x = x0 + 1.6; x < x1 - 20; x += 7.4) {
        if (g() < 0.28 || (u === 1173 && x > 20 && x < 33)) continue;
        parked(x + 0.4, Y(u), CARC[Math.floor(g() * CARC.length)], true);
      }
    // two coaches at the far end, each across three bays: white, a band of colour, the cooler on the roof
    for (const [bu, col] of [[1173.5, 0x2a8ac8], [1191.5, 0xe86a2a]]) {
      const X0 = 61 * S;
      const Y0 = Y(bu) * S;
      for (let j = 0; j < 15; j++)
        for (let i = 0; i < 50; i++) {
          if ((i === 0 || i === 49) && (j === 0 || j === 14)) continue;
          let c = j === 0 ? 0xffffff : j === 14 ? 0xa8a8a8 : 0xecece8;
          if (j === 2 || j === 12) c = col;
          if (i > 42 && i < 47 && j > 0 && j < 14) c = 0x26384a;
          if (i > 14 && i < 24 && j > 4 && j < 10) c = 0xb0b4b8;
          img.px(X0 + i, Y0 + j, c);
        }
      for (let i = -2; i < 52; i++) for (let j = 0; j < 3; j++) img.tintPx(X0 + i + 2, Y0 + 15 + j, 0.68);
    }
    for (const x of [8, 20, 50, 64, 78]) plant('palm', x, Y(1196.5), 4.2, 320 + x);
    k.standing(34, Y(1196), 12, 3, 5, 321);
  }

  // ------------------------------------------------------------ the plaza: flags, the whale shark in bronze, booths
  {
    const [x0, x1, u0, u1] = [10, 78, 1198, 1232];
    img.fine(x0, Y(u1), x1 - x0, u1 - u0, (X, Yy, x, y) => {
      const u = 7168 - y;
      const d = Math.hypot(x - 44, (u - 1214) * 1.15);
      if (Math.abs(d - 12) < 0.5 || Math.abs(d - 7) < 0.3) return 0x8ab0c0; // a ring of blue tiles round the monument
      return k.settPx(X, Yy, 303, d < 12 ? [0xd8cfb6, 0xe4dcc6, 0xefe8d4] : PAVE);
    });
    k.reserve(x0, Y(u1), x1 - x0, u1 - u0);
    // the monument: a whale shark on its plinth of coral stone, spotted, its mouth to the east
    objects.push({
      y: Y(1212),
      shadow: () => k.shadowEllipse(46, Y(1212.6), 8, 3, 0.56),
      draw: () => {
        const CX = 44 * S;
        const CY = Y(1215) * S;
        for (let j = 0; j < 9; j++) for (let i = -15; i <= 15; i++) img.px(CX + i, CY + 4 + j, j === 0 ? C.coral[4] : j > 6 ? C.coral[0] : rampColor(C.coral, 0.3 + hashPx(i >> 1, j >> 1, 304) * 0.5, CX + i, CY + j));
        for (let i = -20; i <= 20; i++) {
          const w0 = i > 14 ? 5 : 5.6 * Math.sqrt(Math.max(0, 1 - ((i - 6) / 27) ** 2)) * (i < -8 ? 0.5 + (i + 20) / 24 : 1);
          for (let j = -w0; j <= w0; j++) img.px(CX + i, CY + j, j < -w0 + 1.2 ? 0x8aa4b4 : j > w0 - 1.2 ? 0x2a3a48 : (i * 3 + Math.round(j) * 5) % 7 === 0 ? 0xc8dce8 : 0x4a6478);
        }
        for (let t = 0; t < 7; t++) for (const s of [-1, 1]) img.rectPx(CX - 20 - t * 0.6, CY + s * t, 2, 2, 0x3a5064); // the tail
        for (let t = 0; t < 6; t++) for (const s of [-1, 1]) img.rectPx(CX + 6 - t, CY + s * (5 + t), 3, 2, s < 0 ? 0x6a8496 : 0x2a3a48); // the fins
        img.rectPx(CX + 19, CY - 3, 2, 7, 0x1a2630);
      },
    });
    // ticket booths in a row under blue awnings, a queue at each
    for (let q = 0; q < 4; q++) {
      const bx = 14 + q * 8;
      objects.push({
        y: Y(1226) + 4,
        shadow: () => k.shadowRect(bx + 1.2, Y(1229) + 1.4, 6, 5, 0.6),
        draw: () => {
          const X0 = bx * S;
          const Y0 = Y(1229) * S;
          for (let j = 0; j < 9; j++) for (let i = 0; i < 18; i++) img.px(X0 + i, Y0 + j, (i >> 1) % 2 ? 0x2a7ac0 : 0xf4f4f0);
          for (let j = 9; j < 15; j++) for (let i = 1; i < 17; i++) img.px(X0 + i, Y0 + j, j === 9 ? 0x1a2a3a : i > 4 && i < 13 && j < 13 ? 0x3a5a7a : 0xe8e4d8);
        },
      });
      k.standing(bx + 1, Y(1223.5), 4, 5, 3, 330 + q);
    }
    k.standing(30, Y(1222), 30, 14, 16, 335);
    k.strollers(44, 1210, 26, 8, 5, { idle: 0.5 });
    k.walkers([[84, 1214], [60, 1214], [44, 1226]], 3, 1200, { sp: 3, gap: 14 });
    for (const [x, u] of [[14, 1203], [26, 1201], [62, 1201], [74, 1203], [74, 1226]]) plant('palm', x, Y(u), 4.6, 340 + x);
    for (const [x, u] of [[20, 1208], [68, 1208]]) plant('hibiscus', x, Y(u), 3.4, 345 + x);
  }

  // ------------------------------------------------------------ the aquarium
  {
    const [x0, x1, u0, u1] = [6, 80, 1238, 1334];
    const TK = [14, 72, 1266, 1326]; // the Kuroshio tank under its glass
    const ROOFC = [0xb4ac9a, 0xc4bcaa, 0xd2cab8, 0xdfd8c8];
    const fh = 6;
    k.reserve(x0 - 1, Y(u1) - 1, x1 - x0 + 2, u1 - u0 + fh + 2);
    const tg = rng(351);
    const rocks = [];
    for (let q = 0; q < 9; q++) rocks.push([TK[0] + 3 + tg() * (TK[1] - TK[0] - 6), TK[2] + 2 + tg() * 7, 2 + tg() * 3]);
    objects.push({
      y: Y(u0) + fh,
      shadow: () => k.shadowRect(x0 + 3, Y(u1) + 3.4, x1 - x0, u1 - u0 + fh, 0.5),
      draw: () => {
        img.fine(x0, Y(u1), x1 - x0, u1 - u0, (X, Yy, x, y) => {
          const u = 7168 - y;
          const e = Math.min(x - x0, x1 - x, u - u0, u1 - u);
          const te = Math.min(x - TK[0], TK[1] - x, u - TK[2], TK[3] - u);
          if (te > 0) {
            // the tank from above, through its glass: deep blue, paler where the daylight falls in, the sand and the
            // rockwork at its southern end, ripples of light, the glazing bars across it
            const gx = (x - TK[0]) % 9.67;
            if (te < 0.5) return 0x1a2a3a;
            if (gx < 0.34 || Math.abs(u - (TK[2] + TK[3]) / 2) < 0.17) return 0x9ab4c4;
            const n = fbm(x, y, { seed: 352, scale: 9, octaves: 2 });
            let c = rampColor([0x082a5c, 0x0c3a78, 0x124e96, 0x1a66b4, 0x2a84cc], 0.2 + n * 0.45 + Math.min(te, 16) / 60, X, Yy);
            const rk = rocks.reduce((m, [rx, ru, rr]) => Math.min(m, Math.hypot(x - rx, (u - ru) * 1.3) - rr), 9);
            if (rk < 0) c = mix(rampColor([0x4a5a68, 0x6a7a84, 0x8a989e], 0.5 - rk * 0.2 + hashPx(X >> 1, Yy >> 1, 353) * 0.4, X, Yy), c, 0.35);
            else if (u < TK[2] + 9 + n * 5) c = mix(c, 0xc8d8c8, 0.3);
            const caust = Math.abs(fbm(x * 1.2, y, { seed: 354, scale: 3.4, octaves: 2 }) - 0.5);
            if (caust < 0.014) c = scaleColor(c, 1.28);
            if (hashPx(X, Yy, 355) < 0.006) c = 0xc8e8f8; // bubbles, small fry
            return c;
          }
          if (te > -1.2) return te > -0.5 ? 0xf0ece0 : 0x8a8676; // the glass's kerb
          if (e < 0.4) return x - x0 < 0.4 || u1 - u < 0.4 ? 0xf0ece0 : 0x8a8676;
          // the roof terraces: concrete in great flags, pergolas over the walks (their slats, their shade), planters
          const perg = (u < 1256 && u > 1244) || x < 12 || x > 74;
          if (perg && e > 1.4) {
            const slat = u < 1256 && u > 1244 ? X % 6 : Yy % 6;
            return slat < 2 ? 0xe8e4d8 : slat === 2 ? 0x6a6658 : rampColor(ROOFC, 0.25 + hashPx(X >> 3, Yy >> 3, 356) * 0.3, X, Yy);
          }
          if (u < 1244 && e > 1.4 && Math.abs(((x - x0) % 18) - 9) < 5.5 && u > 1240.4 && u < 1243) return k.lawnPx(X, Yy, 0.5 + hashPx(X >> 1, Yy >> 1, 357) * 0.4, C.scrub); // planters along the front
          const c = rampColor(ROOFC, 0.3 + hashPx(X >> 4, Yy >> 4, 358) * 0.5, X, Yy);
          return X % 24 === 0 || Yy % 24 === 0 ? scaleColor(c, 0.86) : hashPx(X, Yy, 359) < 0.05 ? scaleColor(c, 0.92) : c;
        });
        // the keepers' stage over the tank's north end, a bucket, a diver's ladder
        const PX = 40 * S;
        const PY = Y(TK[3]) * S + 2;
        for (let j = 0; j < 9; j++) for (let i = 0; i < 24; i++) img.px(PX + i, PY + j, j === 8 ? 0x3a4a5a : i % 4 === 0 ? 0x8a949c : 0xb8c0c8);
        img.rectPx(PX + 18, PY + 2, 3, 3, 0x2a6ad0);
        k.personPx(PX + 6, PY + 2, rng(360), { coat: 0x1a4a8a });
        k.personPx(PX + 12, PY + 3, rng(361), { coat: 0x1a4a8a });
        // the front: an arcade of concrete arches in deep shade, the doors in the middle, the name over them
        const X0 = x0 * S;
        const FY = Y(u0) * S;
        for (let j = 0; j < fh * S; j++)
          for (let i = 0; i < (x1 - x0) * S; i++) {
            const q = i % 15;
            let c = 0xddd6c4;
            if (j < 2) c = 0x7a7464;
            else if (j < 5) c = 0xeee8d8;
            else if (q > 2 && q < 13 && j > 5 + (Math.abs(q - 7.5) > 3.5 ? 2 : Math.abs(q - 7.5) > 2 ? 1 : 0)) c = hashPx(i >> 1, j >> 1, 362) < 0.12 ? 0x5a7a9a : 0x1e2a36;
            if (j >= fh * S - 1) c = scaleColor(c, 0.6);
            if (i >= (x1 - x0) * S - 2) c = scaleColor(c, 0.72);
            img.px(X0 + i, FY + j, c);
          }
        for (let i = 0; i < 44; i++) for (let j = 0; j < 4; j++) if (hashPx(i >> 1, j, 363) < 0.62) img.px(X0 + 89 + i, FY + 1 + j, 0x1a5a9a);
      },
    });
    // the gallery's skylight south of the tank: the crowd before the great window, in the blue light
    objects.push({
      y: Y(u0) + fh + 0.1,
      draw: () => {
        const X0 = (TK[0] + 2) * S;
        const Y0 = Y(1262) * S;
        const WW = (TK[1] - TK[0] - 4) * S;
        for (let j = 0; j < 12; j++)
          for (let i = 0; i < WW; i++) {
            const head = j > 3 && j < 9 && hashPx(Math.floor(i / 3), j >> 1, 364) < 0.5;
            img.px(X0 + i, Y0 + j, j === 0 || j === 11 || i === 0 || i === WW - 1 ? 0x8a8676 : i % 29 === 0 ? 0x9ab4c4 : head ? 0x0a1420 : mix(0x12365e, 0x2a6aa8, (11 - j) / 11));
          }
      },
    });
    // in the tank (live): the whale sharks on their rounds, mantas, a school turning
    const jinbei = (f, sc) => k.sprite(18, 9, 1296, (r) => {
      const cy = 13;
      for (let i = 6; i <= 50; i++) {
        const t = (i - 6) / 44;
        const w0 = (t > 0.9 ? 6 : 7 * Math.sin(Math.min(1, t / 0.72) * 1.5708) ** 0.8 * (t > 0.72 ? 1 - (t - 0.72) * 0.6 : 1)) * sc;
        const sway = (1 - t) ** 2 * (f ? 2.4 : -2.4);
        for (let j = -w0; j <= w0; j++) {
          const yy = cy + j + sway;
          const edge = Math.abs(j) > w0 - 1.3;
          const spot = (i * 5 + Math.round(j) * 7) % 11 === 0 || (i % 6 === 0 && Math.round(j) % 2 === 0);
          r.px(i, yy, edge ? 0x1e3246 : spot ? 0xd0e4f0 : Math.abs(j) < 1 ? 0x4e6a84 : 0x34506a);
        }
      }
      for (let t = 0; t < 8; t++) for (const s of [-1, 1]) r.rectPx(6 - t * 0.5, cy + (f ? 2.4 : -2.4) + s * t * 0.9, 2, 2, 0x2a4058); // the tail's two lobes
      for (let t = 0; t < 8 * sc; t++) for (const s of [-1, 1]) r.rectPx(36 - t * 1.2, cy + s * (6 * sc + t), 4, 2, 0x2a4058); // the long fins
      r.rectPx(50, cy - 4 * sc, 1, 8 * sc + 1, 0x16222e); // the wide mouth
    });
    const loopA = [[22, 1274], [44, 1270], [64, 1276], [67, 1298], [62, 1318], [42, 1322], [22, 1316], [19, 1296], [22, 1274]];
    const loopB = [[56, 1312], [34, 1314], [26, 1300], [32, 1284], [52, 1282], [60, 1296], [56, 1312]];
    kit.path(loopA, [jinbei(0, 1), jinbei(1, 1)], { sp: 4.2, mode: 'wrap', turn: 'rot', fps: 1.4, a: 0.94, d: -0.3, s0: 0.1 });
    kit.path(loopB, [jinbei(0, 0.8), jinbei(1, 0.8)], { sp: 3.4, mode: 'wrap', turn: 'rot', fps: 1.2, a: 0.9, d: -0.32, s0: 0.6 });
    const manta = [0, 1].map((f) => k.sprite(9, 9, 1296, (r) => {
      const span = f ? 10 : 12;
      for (let j = -span; j <= span; j++) {
        const w0 = 7 * (1 - Math.abs(j) / span) ** 0.8;
        for (let i = -w0; i <= w0 * 0.6; i++) r.px(14 + i, 13 + j, Math.abs(j) > span - 3 ? 0x8aa0b4 : 0x18283a);
      }
      for (const s of [-1, 1]) for (let q = 0; q < 3; q++) r.px(18 + q, 13 + s * 2, 0xd8e4ec);
      for (let i = 1; i <= 8; i++) r.px(14 - 7 - i, 13, 0x18283a, 0.8);
    }));
    kit.wander(43, 1297, 22, 22, manta, { n: 3, sp: 5, idle: 0.05, turn: 'rot', fps: 1.4, a: 0.88, d: -0.34 });
    const school = [0, 1].map((f) => k.sprite(9, 7, 1296, (r) => {
      const g = rng(370 + f);
      for (let i = 0; i < 30; i++) {
        const a = g() * 6.283;
        const d = Math.sqrt(g()) * 8;
        const X = 13 + Math.cos(a) * d * 1.4;
        const Yy = 10 + Math.sin(a) * d;
        r.px(X, Yy, g() < 0.5 ? 0xe8f0f4 : 0xa8c4d8);
        r.px(X - 1, Yy, 0x6a8aa4, 0.8);
      }
    }));
    kit.wander(40, 1300, 20, 18, school, { n: 2, sp: 8, idle: 0, turn: 'rot', fps: 2, a: 0.85, d: -0.36 });
    kit.wander(50, 1286, 14, 10, school, { n: 1, sp: 9, idle: 0, turn: 'rot', fps: 2, a: 0.85, d: -0.36 });
  }

  // ------------------------------------------------------------ the sea turtles' pool: a kidney of clear water, a beach
  {
    const [cx, cu, rx, ry] = TURTLE;
    img.fine(cx - rx - 1, Y(cu + ry + 1), rx * 2 + 2, ry * 2 + 2, (X, Yy, x, y) => {
      const u = 7168 - y;
      const e = Math.hypot((x - cx) / rx, (u - cu) / ry) + (fbm(x, y, { seed: 381, scale: 9 }) - 0.5) * 0.16;
      if (e > 1) return null;
      if (e > 0.93) return e > 0.965 ? 0x8a8676 : 0xf0ece0; // the low wall, its rail
      const beach = (x - cx) * 0.5 + (u - cu) + 3 + Math.sin(x * 0.6) * 1.2; // the sand at its southern side
      if (beach < -4) return rampColor(C.whiteSand, 0.3 + hashPx(X, Yy, 382) * 0.5, X, Yy);
      if (beach < -3) return C.foam;
      return hashPx(X >> 1, Yy, 383) < 0.06 ? 0xd0f6f8 : rampColor([0x2aa8c0, 0x38b8cc, 0x56cad8, 0x86e0e6], 0.75 - Math.min(1, (beach + 4) / 12) * 0.6 + fbm(x, y, { seed: 384, scale: 4 }) * 0.2, X, Yy);
    });
    k.reserve(cx - rx - 4, Y(cu + ry + 4), rx * 2 + 8, ry * 2 + 8);
    // two hauled out on the sand
    for (const [tx, tu] of [[146, 1200], [156, 1199]]) {
      const X = tx * S;
      const Yy = Y(tu) * S;
      img.discPx(X + 1, Yy + 2, 4, 0x000000, 0.25);
      img.discPx(X, Yy, 4, 0x4a5a34);
      for (let q = 0; q < 5; q++) img.px(X - 2 + (q % 3) * 2, Yy - 1 + (q >> 1) * 2, 0x7a8a4a);
      img.discPx(X + 5, Yy, 1.6, 0x6a7a44);
      for (const s of [-1, 1]) img.rectPx(X + 2, Yy + s * 4, 3, 2, 0x5a6a3c);
    }
    const turtle = [0, 1].map((f) => k.sprite(7, 6, 1208, (r) => {
      r.discPx(9, 9, 5, 0x3e5230);
      r.discPx(8, 8, 3.4, 0x5a7040);
      for (let q = 0; q < 6; q++) r.px(6 + (q % 3) * 3, 7 + (q >> 1) * 3, 0x8a9a54);
      r.discPx(16, 9, 2, 0x6a7e48);
      for (const s of [-1, 1]) {
        for (let t = 0; t < 5; t++) r.rectPx(12 - t * (f ? 0.2 : 0.8), 9 + s * (4 + t), 2, 2, 0x5a6e3e);
        for (let t = 0; t < 2; t++) r.rectPx(4 - t, 9 + s * (4 + t), 2, 2, 0x5a6e3e);
      }
    }));
    kit.wander(cx + 1, cu + 4, rx - 7, ry - 8, turtle, { n: 4, sp: 2.4, idle: 0.2, turn: 'rot', fps: 1.4, a: 0.9, d: -0.3 });
    for (let q = 0; q < 12; q++) {
      const a = (q / 12) * 6.283 + 0.3;
      if (Math.sin(a) > 0.5) continue; // (nobody on the planted side)
      k.standing(cx + Math.cos(a) * (rx + 2.2) - 0.5, Y(cu - Math.sin(a) * (ry + 2.2)) - 0.5, 1, 1, 1, 385 + q);
    }
    for (const [x, u] of [[130, 1226], [170, 1224], [172, 1194], [128, 1190], [150, 1180]]) plant('palm', x, Y(u), 4.8, 390 + x);
    for (const [x, u] of [[138, 1226], [162, 1226], [112, 1196], [104, 1222], [168, 1178], [110, 1176], [132, 1176]]) plant('hibiscus', x, Y(u), 3.4, 395 + x + u);
    k.walkers([[96, 1206], [130, 1206]], 2, 1200, { sp: 3, gap: 12 });
  }

  // ------------------------------------------------------------ the Okichan theatre: the lagoon, the stage, the stands
  {
    const [cx, cu, rx, ry] = LAGOON;
    img.fine(cx - rx - 1, Y(cu + ry + 1), rx * 2 + 2, ry * 2 + 2, (X, Yy, x, y) => {
      const u = 7168 - y;
      const e = Math.hypot((x - cx) / rx, (u - cu) / ry);
      if (e > 1) return null;
      if (e > 0.94) return e > 0.97 ? 0x8a8676 : 0xf4f0e4;
      const n = fbm(x, y, { seed: 401, scale: 5, octaves: 2 });
      let c = rampColor([0x1a86b4, 0x24a0c4, 0x3cb8d0, 0x6cd0dc], 0.2 + (1 - e) * 0.45 + n * 0.3, X, Yy);
      if (Math.abs(fbm(x * 1.3, y, { seed: 402, scale: 3, octaves: 2 }) - 0.5) < 0.016) c = scaleColor(c, 1.22);
      return c;
    });
    k.reserve(cx - rx - 3, Y(cu + ry + 8), rx * 2 + 6, ry * 2 + 44);
    // the stage along the pool's north side: a deck of pale boards, the trainers, hoops on their poles, the gates
    // to the holding pools behind
    objects.push({
      y: Y(cu + ry) + 6,
      shadow: () => k.shadowRect(cx - 21, Y(cu + ry + 6) + 1.6, 44, 9, 0.6),
      draw: () => {
        const X0 = (cx - 22) * S;
        const Y0 = Y(cu + ry + 6) * S;
        for (let j = 0; j < 27; j++)
          for (let i = 0; i < 132; i++) {
            const hold = j < 12 && ((i > 8 && i < 44) || (i > 88 && i < 124));
            img.px(X0 + i, Y0 + j, hold ? (j === 0 || j === 11 || i === 9 || i === 43 || i === 89 || i === 123 ? 0xf4f0e4 : rampColor([0x24a0c4, 0x3cb8d0, 0x6cd0dc], hashPx(i >> 2, j >> 1, 403), X0 + i, Y0 + j)) : j === 26 ? 0x6a6250 : i % 9 === 0 ? 0xb8ae94 : 0xd8cfb4);
          }
        for (const hx of [30, 102]) {
          for (let a = 0; a < 6.3; a += 0.2) img.px(X0 + hx + Math.cos(a) * 4, Y0 + 30 + Math.sin(a) * 4, a % 1.2 < 0.6 ? 0xe83a2a : 0xf4f4f0);
          img.rectPx(X0 + hx, Y0 + 20, 1, 7, 0x8a8e94);
        }
        for (const [i, c] of [[52, 0x1a4a8a], [66, 0xe8502a], [80, 0x1a4a8a]]) k.personPx(X0 + i, Y0 + 17, rng(404 + i), { coat: c });
      },
    });
    // the stands: five rows in an arc round the pool's south side, their steps, full; a roof of white sailcloth on
    // masts over the back rows
    const su0 = cu - ry - 4;
    objects.push({
      y: Y(su0 - 16),
      shadow: () => k.shadowRect(cx - 30 + 1.6, Y(su0) + 1.6, 62, 17, 0.5),
      draw: () => {
        const g = rng(405);
        for (let row = 0; row < 6; row++) {
          const hw = 26 + row * 1.2;
          for (let X = Math.round((cx - hw) * S); X < (cx + hw) * S; X++) {
            const xx = X / S - cx;
            const bow = (xx / hw) ** 2 * 5;
            const Y0 = Math.round((Y(su0 - row * 2.6) + 1 - bow) * S);
            const aisle = Math.abs(Math.abs(xx) - 12) < 1 || Math.abs(xx) < 0.7;
            for (let j = 0; j < 8; j++) img.px(X, Y0 + j, aisle ? (j % 3 === 0 ? 0xf0ece0 : 0xc8c0a8) : j < 2 ? 0xe8e2d0 : j === 7 ? 0x7a7462 : 0xa49c86);
            if (!aisle && X % 4 === 0 && g() < 0.86) {
              const coat = COATS[Math.floor(g() * COATS.length)];
              img.rectPx(X, Y0 + 2, 3, 3, coat);
              img.rectPx(X, Y0, 3, 2, g() < 0.25 ? 0xf4f0e0 : g() < 0.5 ? 0x2a2026 : 0xe8c0a0);
            }
          }
        }
        // the sail roof: three peaks, translucent, the back rows in its shade showing through
        for (let q = 0; q < 3; q++) {
          const mx = (cx - 21 + q * 21) * S;
          const my = Y(su0 - 13.5) * S;
          for (let j = -10; j <= 10; j++)
            for (let i = -30; i <= 30; i++) {
              const dd = Math.abs(i) / 30 + Math.abs(j) / 10;
              if (dd > 1) continue;
              img.px(mx + i, my + j, i + j * 2 < 0 ? 0xffffff : 0xdcdcd6, dd > 0.92 ? 1 : 0.62);
            }
          img.rectPx(mx - 1, my - 1, 3, 3, 0x6a6e74);
        }
      },
    });
    // dolphins (live): their shapes under the water going round, and now and again one clean out of it, over and in
    const fin = [0, 1].map((f) => k.sprite(8, 4, cu, (r) => {
      for (let i = 2; i <= 21; i++) {
        const t = (i - 2) / 19;
        const w0 = 3.2 * Math.sin(Math.min(1, t / 0.6) * 1.5708) * (t > 0.6 ? 1 - (t - 0.6) * 1.6 : 1);
        for (let j = -w0; j <= w0; j++) r.px(i, 6 + j + (1 - t) ** 2 * (f ? 1.6 : -1.6), Math.abs(j) < 1 ? 0x4a6a80 : 0x2c4c62);
      }
      for (const s of [-1, 1]) r.rectPx(1, 6 + (f ? 1.6 : -1.6) + s * 2, 2, 2, 0x2c4c62);
      for (const s of [-1, 1]) r.rectPx(13, 6 + s * 4, 3, 1, 0x2c4c62);
    }));
    kit.wander(cx, cu - 1, rx - 9, ry - 7, fin, { n: 4, sp: 9, idle: 0.02, turn: 'rot', fps: 3, a: 0.7, d: -0.3 });
    const SZ = 15;
    const leap = (q) => k.sprite(SZ, SZ, cu, (r) => {
      const c = 22;
      const ring = (rr, a) => {
        for (let n = 0; n < rr * 5; n++) {
          const ang = (n / (rr * 5)) * 6.283;
          r.px(c + Math.cos(ang) * rr * 1.5, c + 8 + Math.sin(ang) * rr * 0.8, 0xf4fcfc, a);
        }
      };
      const body = (px, py, ang, len) => {
        // a dolphin in the air, side on: grey back, pale belly, the fin, the flukes
        for (let i = -len; i <= len; i++) {
          const w0 = 3 * Math.sqrt(Math.max(0, 1 - (i / (len + 1)) ** 2));
          for (let j = -w0; j <= w0; j++) r.px(px + Math.cos(ang) * i - Math.sin(ang) * j, py + Math.sin(ang) * i + Math.cos(ang) * j, j > w0 * 0.3 ? 0xd8e4ea : j < -w0 + 1 ? 0x8aa4b6 : 0x5a788e);
        }
        for (let t = 0; t < 4; t++) r.px(px - Math.sin(ang) * (-3 - t) - Math.cos(ang) * t, py + Math.cos(ang) * (-3 - t) - Math.sin(ang) * t, 0x4a6880);
        for (const s of [-1, 1]) for (let t = 0; t < 3; t++) r.px(px - Math.cos(ang) * (len + 1) - Math.sin(ang) * s * t, py - Math.sin(ang) * (len + 1) + Math.cos(ang) * s * t, 0x4a6880);
        r.px(px + Math.cos(ang) * (len + 1), py + Math.sin(ang) * (len + 1), 0x5a788e);
      };
      if (q === 0) ring(3, 0.6);
      if (q === 1) {
        ring(5, 0.8);
        body(c - 8, c + 3, -1.1, 6);
      }
      if (q === 2) body(c - 4, c - 6, -0.5, 8);
      if (q === 3) body(c + 2, c - 9, 0.1, 8);
      if (q === 4) body(c + 8, c - 5, 0.7, 8);
      if (q === 5) {
        body(c + 12, c + 3, 1.2, 6);
        r.discPx(c + 14, c + 8, 4, 0xf4fcfc, 0.9);
      }
      if (q === 6) {
        r.discPx(c + 14, c + 8, 6, 0xf4fcfc, 0.7);
        for (let n = 0; n < 10; n++) r.px(c + 14 + Math.cos(n * 0.7) * 9, c + 5 - Math.abs(Math.sin(n * 0.7)) * 7, 0xffffff);
      }
      if (q === 7) for (const rr of [5, 7]) for (let n = 0; n < rr * 5; n++) r.px(c + 14 + Math.cos(n / (rr * 0.8)) * rr * 1.5, c + 8 + Math.sin(n / (rr * 0.8)) * rr * 0.8, 0xf4fcfc, 0.5);
    });
    kit.spot([[cx - 22, cu + 6, 30, 12]], [0, 1, 2, 3, 4, 5, 6, 7].map(leap), { rate: 0.55, fps: 7, a: 1, d: 0.2 });
    for (const [x, u] of [[104, 1300], [104, 1322], [172, 1322], [173, 1296], [172, 1262], [104, 1262]]) plant('palm', x, Y(u), 4.8, 410 + x + u);
    k.walkers([[150, 1228], [150, 1266]], 3, 1250, { sp: 3, gap: 10 });
    k.walkers([[96, 1279], [106, 1279]], 1, 1280, { sp: 2.6 });
  }

  // ------------------------------------------------------------ between them: a kiosk under parasols, beds of flowers
  {
    const [x, u] = [108, 1240];
    objects.push({
      y: Y(u) + 5,
      shadow: () => k.shadowRect(x + 1.4, Y(u) + 1.6, 9, 6, 0.6),
      draw: () => {
        const X0 = x * S;
        const Y0 = Y(u) * S;
        for (let j = 0; j < 12; j++) for (let i = 0; i < 27; i++) img.px(X0 + i, Y0 + j, (i >> 1) % 2 ? 0xe83a5a : 0xfff4f0);
        for (let j = 12; j < 18; j++) for (let i = 1; i < 26; i++) img.px(X0 + i, Y0 + j, j === 12 ? 0x2a1a1a : i > 6 && i < 20 && j < 16 ? 0x4a5a6a : 0xf0ece0);
      },
    });
    k.reserve(x - 1, Y(u) - 1, 11, 9);
    for (const [px, pu, c] of [[100, 1232, 0x2a9ad0], [106, 1229, 0xf4d040], [113, 1231, 0xe86a2a]]) {
      objects.push({
        y: Y(pu) + 2,
        shadow: () => k.shadowEllipse(px + 1.6, Y(pu) + 1.8, 3, 2, 0.6),
        draw: () => {
          for (let a = 0; a < 6.3; a += 0.05) for (let rr = 0; rr < 8; rr++) img.px(px * S + Math.cos(a) * rr, Y(pu) * S + Math.sin(a) * rr * 0.86, Math.floor((a / 6.283) * 8) % 2 ? c : 0xfff8f0);
          img.px(px * S, Y(pu) * S, 0x6a6e74);
        },
      });
      k.standing(px - 2, Y(pu) + 1.4, 4, 1, 2, 420 + px);
    }
    for (const [fx, fu, c] of [[100, 1318, 0xe8303a], [100, 1250, 0xf4c030], [170, 1244, 0xe86aa8], [100, 1190, 0xf4c030], [100, 1172, 0xe8303a]])
      img.fine(fx - 3, Y(fu) - 3, 6, 6, (X, Yy, xx, yy) => {
        const d = Math.hypot(xx - fx, yy - Y(fu));
        if (d > 3) return null;
        if (d > 2.5) return C.coral[2];
        return hashPx(X, Yy, 425) < 0.45 ? (hashPx(X >> 1, Yy >> 1, 426) < 0.3 ? 0xfff0f0 : c) : k.lawnPx(X, Yy, 0.4, C.scrub);
      });
    for (const [px, pu] of [[98, 1168], [98, 1196], [98, 1226], [98, 1262], [98, 1296], [98, 1332], [82, 1236], [82, 1336], [176, 1336], [140, 1336], [120, 1336], [160, 1336], [176, 1170], [150, 1166]]) plant('palm', px, Y(pu), 4.4, 430 + px + pu);
    for (const [px, pu] of [[2, 1200], [2, 1226], [3, 1262], [3, 1296], [3, 1326], [30, 1338], [56, 1338]]) plant('fukugi', px, Y(pu), 4.6, 440 + px + pu);
    k.strollers(126, 1236, 14, 5, 3, { idle: 0.5 });
  }
}
