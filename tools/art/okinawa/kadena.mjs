// Kadena air base, between Shuri and the northern forest: Route 58 along its western fence, two long runways with their
// markings, the parallel taxiway, the ramp with the tankers parked on it, the control tower, the big hangars, rows of hardened
// shelters with fighters out in front, the base housing by the gate with its ball field. A fighter taxis, another one takes off.
import { S, hashPx, scaleColor, rampColor, rng, fbm, mix } from '../nagasaki/canvas.mjs';
import { W, L, BASE, landD, beachW, kindAt, smooth } from './geo.mjs';
import { C } from './common.mjs';

const [B0, B1] = BASE;
const FENCE_X = 14;
const RWY = [
  { x: 27, hw: 6, u0: 3866, u1: 4238 },
  { x: 49, hw: 6, u0: 3878, u1: 4226 },
];
const PAD = { x: 60, u: 4050 }; // (the turret's place: the taxiway bends round it)
// the parallel taxiway, bending east round the gun pit
const taxiX = (u) => 68 + 12 * Math.exp(-(((u - PAD.u) / 20) ** 2));
const TAXI = [3884, 4236];
const STUBS = [3892, 3996, 4118, 4224]; // the links from the runways to the taxiway
const RAMP = [3940, 4010];
const HANGARS = [[84, 4030], [84, 4072]];
const SHELTERS = [];
for (let u = 4118; u <= 4222; u += 21) for (const x of [80, 98]) SHELTERS.push({ x, u });
const HOUSING = [3862, 3934];

const GREY = [0x8e8e88, 0xa2a29a, 0xb4b4ac, 0xc6c6be];
const TARMAC = [0x34363a, 0x3e4044, 0x484a4e, 0x54565a];
const MOWN = [0x3e6a2e, 0x4a7834, 0x58863c, 0x689646];
const JET = [0x4a5258, 0x606870, 0x78828a, 0x98a2aa, 0xc0c8ce];

export function paintBase(k) {
  const { img, Y, kit, objects } = k;
  const g = rng(5001);
  const land = (x, u) => landD(x, u) > beachW(kindAt(x, u));

  // ------------------------------------------------------------ the ground: mown grass, runways, taxiways, the ramp
  const onRunway = (x, u) => RWY.find((r) => Math.abs(x - r.x) <= r.hw && u >= r.u0 - 6 && u <= r.u1 + 6);
  const onTaxi = (x, u) => {
    if (u >= TAXI[0] && u <= TAXI[1] && Math.abs(x - taxiX(u)) < 2.8) return true;
    for (const s of STUBS) if (Math.abs(u - s) < 2.6 && x > RWY[0].x && x < taxiX(u)) return true;
    return false;
  };
  const onRamp = (x, u) => {
    if (u > RAMP[0] && u < RAMP[1] && x > taxiX(u) + 2 && x < 132) return true;
    if (u > 4024 && u < 4112 && x > taxiX(u) + 2 && x < 118) return true; // before the hangars
    for (const s of SHELTERS) if (u > s.u - 9 && u < s.u + 9 && x > taxiX(u) + 2 && x < s.x + 2) return true; // the shelters' aprons
    return false;
  };
  img.fine(0, Y(B1), W, B1 - B0, (X, Yy, x, y) => {
    const u = L - y;
    if (!land(x, u)) return null;
    if (u < HOUSING[1] && x > 92) return k.lawnPx(X, Yy, 0.3 + fbm(x, y, { seed: 501, scale: 6 }) * 0.5, C.grass, true);
    const rw = onRunway(x, u);
    if (rw) {
      const a = x - rw.x;
      const ends = u < rw.u0 || u > rw.u1;
      if (ends) {
        // the blast pads beyond the thresholds: yellow chevrons on darker asphalt
        const t = Math.abs(u < rw.u0 ? rw.u0 - u : u - rw.u1);
        const chev = (t + Math.abs(a) * 0.6) % 3 < 0.7;
        return chev ? 0xd8b830 : rampColor(TARMAC, 0.1, X, Yy);
      }
      let c = rampColor(TARMAC, 0.25 + hashPx(X >> 2, Yy >> 3, 502) * 0.5, X, Yy);
      // rubber laid down where the wheels touch
      const td = Math.min(u - rw.u0, rw.u1 - u);
      if (td > 8 && td < 60 && Math.abs(a) < 3.6 && fbm(x * 3, u * 0.3, { seed: 503, scale: 2 }) > 0.55) c = scaleColor(c, 0.7);
      const white = 0xe8e8e2;
      if (Math.abs(Math.abs(a) - (rw.hw - 0.5)) < 0.2) return white; // the edge lines
      if (Math.abs(a) < 0.22 && Math.floor(u / 4) % 2 === 0 && td > 14) return white; // the centreline
      if (td < 6 && Math.abs(a) < rw.hw - 1 && (Math.abs(a) * S) % 3 < 1.5) return white; // the piano keys
      if (td > 22 && td < 30 && Math.abs(a) > 1.5 && Math.abs(a) < 3.6) return white; // the aiming points
      if ((Math.abs(td - 40) < 2 || Math.abs(td - 52) < 1.5) && Math.abs(a) > 1.2 && Math.abs(a) < 4.2 && (Math.abs(a) * S) % 2 < 1) return white; // touchdown zone
      return c;
    }
    if (onTaxi(x, u)) {
      const c = rampColor(TARMAC, 0.45 + hashPx(X >> 2, Yy >> 2, 504) * 0.4, X, Yy);
      const along = u >= TAXI[0] && u <= TAXI[1] && Math.abs(x - taxiX(u)) < 2.8;
      if (along && Math.abs(x - taxiX(u)) < 0.2) return 0xe0c040; // the yellow centreline
      if (!along) for (const s of STUBS) if (Math.abs(u - s) < 0.2) return 0xe0c040;
      return c;
    }
    if (onRamp(x, u)) {
      // concrete slabs, joints, oil stains
      if (X % 15 === 0 || Yy % 15 === 0) return 0x8a8a84;
      let c = rampColor(GREY, 0.3 + hashPx(Math.floor(X / 15), Math.floor(Yy / 15), 505) * 0.5, X, Yy);
      if (fbm(x, y, { seed: 506, scale: 2 }) > 0.68) c = scaleColor(c, 0.86);
      return c;
    }
    // the infield, mown in stripes; the fence's verge
    const stripe = Math.floor(Yy / 9) % 2;
    let c = rampColor(MOWN, 0.35 + stripe * 0.25 + (fbm(x, y, { seed: 507, scale: 7 }) - 0.5) * 0.3, X, Yy);
    if (hashPx(X, Yy, 508) < 0.05) c = scaleColor(c, 0.9);
    return c;
  });
  k.reserve(0, Y(B1), W, B1 - B0);

  // ------------------------------------------------------------ the gun pit where the turret stands: a ring of sandbags on concrete
  img.fine(PAD.x - 11, Y(PAD.u) - 11, 22, 22, (X, Yy, x, y) => {
    const d = Math.hypot(x - PAD.x, y - Y(PAD.u));
    if (d > 10.4) return null;
    if (d > 8.4) return hashPx(Math.floor(Math.atan2(y - Y(PAD.u), x - PAD.x) * 8), Math.floor(d), 509) < 0.5 ? 0xa89870 : 0x8a7a58;
    return rampColor(GREY, 0.4 + hashPx(X >> 2, Yy >> 2, 510) * 0.3, X, Yy);
  });

  // ------------------------------------------------------------ the fence: chain-link on posts, round the whole field
  const fence = (X0, Y0, X1, Y1) => {
    const n = Math.max(Math.abs(X1 - X0), Math.abs(Y1 - Y0));
    for (let q = 0; q <= n; q++) {
      const X = Math.round(X0 + ((X1 - X0) * q) / n);
      const Yy = Math.round(Y0 + ((Y1 - Y0) * q) / n);
      img.px(X, Yy, q % 9 === 0 ? 0x5a5e62 : 0xb8bcc0);
      img.px(X + 1, Yy + 1, 0x000000, 0.25);
      if (q % 9 === 0) img.px(X, Yy - 1, 0x3a3e42);
    }
  };
  fence(FENCE_X * S, Y(B1 - 4) * S, FENCE_X * S, Y(B0 + 8) * S);
  fence(FENCE_X * S, Y(B0 + 8) * S, 98 * S, Y(B0 + 8) * S);
  fence(104 * S, Y(B0 + 8) * S, 180 * S, Y(B0 + 8) * S);
  {
    let x1 = FENCE_X;
    while (x1 < W && land(x1 + 1, B1 - 4)) x1++;
    fence(FENCE_X * S, Y(B1 - 4) * S, (x1 - 2) * S, Y(B1 - 4) * S);
  }

  // ------------------------------------------------------------ painting aircraft on the ground (nose towards `dir`: -1 west, 1 east)
  /** Paint a shape given as fine pixels [i, j, colour] around (X0, Y0), its shadow thrown first. */
  const shape = (X0, Y0, dir, pts, sh, put) => {
    if (sh) for (const [i, j] of pts) img.tintPx(X0 + i * dir + sh, Y0 + j + sh, 0.62);
    for (const [i, j, c] of pts) (put ?? ((X, Yy, q) => img.px(X, Yy, q)))(X0 + i * dir, Y0 + j, c);
  };
  /** A fighter: swept wings, twin fins, grey, nose towards dir (1 east, -1 west); about 9 long. */
  const fighterPts = () => {
    const pts = [];
    const P = (i, j, c) => pts.push([i, j, c]);
    for (let s = -1; s <= 1; s += 2)
      for (let w = 0; w < 11; w++) for (let i = -6 - w * 0.6; i <= 4 - w * 0.9; i++) P(Math.round(i), s * (2 + w), w > 9 ? JET[1] : JET[2]);
    for (let s = -1; s <= 1; s += 2) for (let w = 0; w < 5; w++) for (let i = -13; i <= -10 + w * 0.2; i++) P(Math.round(i), s * (2 + w), JET[1]); // the tailplanes
    for (let i = -13; i <= 13; i++) for (let j = -2; j <= 2; j++) if (Math.abs(j) < 2 || (i > -10 && i < 8)) P(i, j, Math.abs(j) < 1 ? JET[3] : JET[2]);
    for (let i = 13; i <= 15; i++) P(i, 0, JET[1]);
    for (let i = 3; i <= 7; i++) P(i, 0, 0x2a3440); // the canopy
    P(5, -1, 0x6a8aa0);
    for (const s of [-1, 1]) for (let i = -12; i <= -7; i++) P(i, s * 2, JET[4]); // the fins, catching the sun
    return pts;
  };
  const fighter = (cx, cy, dir) => shape(Math.round(cx * S), Math.round(cy * S), dir, fighterPts(), 5);
  /** A tanker: long body, four engines under swept wings; about 22 long. */
  const tanker = (cx, cy, dir) => {
    const pts = [];
    const P = (i, j, c) => pts.push([i, j, c]);
    for (let s = -1; s <= 1; s += 2) {
      for (let w = 0; w < 30; w++) for (let i = -4 - w * 0.7; i <= 8 - w * 0.75; i++) P(Math.round(i), s * (3 + w), w > 28 ? 0x8a9096 : 0xa8aeb4);
      for (const e of [9, 20]) for (let i = -5 - e * 0.7; i <= 1 - e * 0.7; i++) for (let j = -1; j <= 1; j++) P(Math.round(i), s * (3 + e) + j, 0x6a7076);
      for (let w = 0; w < 10; w++) for (let i = -33; i <= -28 + w * 0.2; i++) P(Math.round(i), s * (3 + w), 0xa8aeb4);
    }
    for (let i = -33; i <= 34; i++) for (let j = -3; j <= 3; j++) if (Math.abs(j) < 3 || (i > -28 && i < 30)) P(i, j, Math.abs(j) < 2 ? 0xd4d8dc : 0xb4b8bc);
    for (let i = 26; i <= 29; i++) P(i, 0, 0x2a3440);
    for (let i = -31; i <= -27; i++) P(i, 0, 0x8a9096);
    shape(Math.round(cx * S), Math.round(cy * S), dir, pts, 8);
  };

  // ------------------------------------------------------------ the ramp: two tankers on their stands, a fuel truck, the tower
  for (const [x, u] of [[100, 3962], [100, 3992]]) {
    const y = Y(u);
    objects.push({ y: y + 12, draw: () => tanker(x, y, -1) });
    for (let i = 0; i < 40; i++) img.px(Math.round((taxiX(u) + 2) * S + i), Math.round(y * S), 0xe0c040); // its lead-in line
  }
  {
    // the control tower: a block with the glazed cab on top, the base operations building beside it
    const tx = 126;
    const tu = 4022;
    const ty = Y(tu);
    objects.push({
      y: ty + 6,
      shadow: () => k.shadowRect(tx + 2, ty - 6, 8, 12, 0.5),
      draw: () => {
        img.fine(tx - 4, ty - 4, 8, 8, (X, Yy, x, y) => (x - (tx - 4) < 0.6 || y - (ty - 4) < 0.6 ? 0xe8e8e2 : 0xc4c4bc));
        for (let j = 0; j < 12; j++) for (let i = 0; i < 24; i++) img.px((tx - 4) * S + i, (ty + 4) * S + j, j < 2 ? 0x8a8a84 : 0xd0d0c8);
        img.fine(tx - 3.2, ty - 3.2, 6.4, 6.4, (X, Yy, x, y) => {
          const d = Math.max(Math.abs(x - tx), Math.abs(y - ty)) + Math.min(Math.abs(x - tx), Math.abs(y - ty)) * 0.42;
          if (d > 3.6) return null;
          if (d > 2.9) return 0x2a4a5a;
          return d > 2.2 ? 0x6a9ab0 : 0x3a3e44;
        });
        k.glow(tx, ty - 3.4, 0xff3a2a, 1); // the beacon
      },
    });
    k.t.flat(tx - 18, ty - 2, 12, 9, 3, { wall: 0xd8d4c8, reserve: false });
  }
  // ------------------------------------------------------------ the hangars: ribbed roofs, open doors, a fighter inside one
  for (const [hx, hu] of HANGARS) {
    const hy = Y(hu + 34);
    objects.push({
      y: hy + 34,
      shadow: () => k.shadowRect(hx + 3, hy + 3, 30, 34, 0.5),
      draw: () => {
        img.fine(hx, hy, 30, 30, (X, Yy, x) => {
          const rib = Math.round((x - hx) * S) % 6;
          const curve = Math.sin(((x - hx) / 30) * Math.PI);
          let c = rib === 0 ? 0x8a9096 : mix(0x9aa0a6, 0xdce0e4, curve);
          if (hashPx(X >> 2, Yy >> 3, 511) < 0.04) c = scaleColor(c, 0.9);
          return c;
        });
        // the doors along the front (west), one wide open on the dark inside
        for (let j = 0; j < 90; j++) for (let i = 0; i < 9; i++) img.px(hx * S - i, hy * S + j, j > 30 && j < 66 ? (i > 6 ? 0x6a7076 : 0x14181c) : i > 6 ? 0x8a9096 : 0x6a7076);
      },
    });
    k.reserve(hx - 3, hy, 34, 36);
  }
  // ------------------------------------------------------------ the hardened shelters: concrete arches, grassed over, doors to the west
  for (const [n, s] of SHELTERS.entries()) {
    const sy = Y(s.u);
    const x0 = s.x;
    const w = 15;
    const h = 13;
    objects.push({
      y: sy + h / 2,
      shadow: () => k.shadowRect(x0 + 2, sy - h / 2 + 2, w, h, 0.55),
      draw: () => {
        img.fine(x0, sy - h / 2, w, h, (X, Yy, x, y) => {
          const t = (y - (sy - h / 2)) / h; // across the arch, north to south
          const e = Math.min(x - x0, x0 + w - x);
          if (e < 0) return null;
          let c = mix(0x9a9e92, 0x5e6258, t * t);
          if (t < 0.12) c = 0xb8bcb0;
          const grass = fbm(x, y, { seed: 512 + n, scale: 3 });
          if (grass > 0.5 && e > 1.2) c = mix(c, rampColor(C.scrub, 0.3 + (1 - t) * 0.5, X, Yy), 0.7);
          if (x - x0 < 1) c = (Yy % 4 < 2 ? 0x3a3e42 : 0x4e5256); // the door, a steel leaf
          return c;
        });
      },
    });
    k.reserve(x0 - 1, sy - h / 2 - 1, w + 3, h + 3);
    if (s.x === 80 && n % 4 !== 2) objects.push({ y: sy + 3, draw: () => fighter(x0 - 5, sy, -1) }); // out on its apron
  }
  // ------------------------------------------------------------ the support area east of the ramp: warehouses, a car park, the fuel farm
  const shed = (x, y, w, h, roof) => {
    objects.push({
      y: y + h + 2,
      shadow: () => k.shadowRect(x + 2, y + 2, w, h + 2, 0.5),
      draw: () => {
        img.fine(x, y, w, h, (X, Yy, xx, yy) => {
          const t = (yy - y) / h;
          let c = (Yy % 6 === 0) ? scaleColor(roof, 0.8) : scaleColor(roof, t < 0.5 ? 1.12 : 0.9);
          if (hashPx(X >> 3, Yy >> 2, 520) < 0.04) c = scaleColor(c, 0.9);
          return c;
        });
        for (let i = 0; i < w * S; i++) for (let j = 0; j < 6; j++) img.px(x * S + i, (y + h) * S + j, j < 1 ? 0x5a5a56 : i % 21 > 4 && i % 21 < 16 && j > 1 ? 0x4a5058 : 0xc8c4b8);
      },
    });
    k.reserve(x - 1, y - 1, w + 2, h + 4);
  };
  shed(138, Y(3990), 34, 12, 0x9aa0a4);
  shed(138, Y(3966), 30, 11, 0xa49a8a);
  k.road([[132, 3946], [132, 4014]], 2, { side: 0, lanes: false, piece: true });
  img.fine(138, Y(4024), 30, 16, (X, Yy) => (X % 9 === 0 && Yy % 30 > 4 ? 0xe8e8e0 : k.asphaltPx(X, Yy)));
  k.reserve(138, Y(4024), 30, 16);
  for (let q = 0; q < 14; q++) {
    if (g() < 0.25) continue;
    k.t.parked(138.6 + (q % 7) * 3 + 0.2, Y(4022 - Math.floor(q / 7) * 7), [0xe8e8ec, 0x2c3038, 0xc43a30, 0x3a609c, 0x9aa2aa, 0xe8d69c][Math.floor(g() * 6)], true);
  }
  {
    // the fuel farm: white tanks inside their earth berm
    const fx = 150;
    const fu = 4062;
    img.fine(fx - 18, Y(fu + 16), 36, 30, (X, Yy, x, y) => {
      const e = Math.min(x - (fx - 18), fx + 18 - x, y - Y(fu + 16), Y(fu - 14) - y);
      if (e > 1.6 || !land(x, L - y)) return null;
      return rampColor(C.scrub, 0.3 + e * 0.3, X, Yy);
    });
    k.reserve(fx - 18, Y(fu + 16), 36, 30);
    for (const [dx, du] of [[-9, 7], [3, 7], [-9, -6], [3, -6], [13, 1]]) {
      const cx = fx + dx;
      const cy = Y(fu + du);
      if (!land(cx + 6, fu + du)) continue;
      objects.push({
        y: cy + 5,
        shadow: () => k.shadowEllipse(cx + 1.6, cy + 1.6, 5, 5, 0.55),
        draw: () => {
          img.fine(cx - 5, cy - 5, 10, 10, (X, Yy, x, y) => {
            const d = Math.hypot(x - cx, y - cy);
            if (d > 4.8) return null;
            if (d > 4.3) return 0xa8aaa8;
            return mix(0xf4f4f0, 0xc4c6c4, Math.max(0, (x - cx + y - cy) / 7 + 0.4));
          });
        },
      });
    }
  }

  // ------------------------------------------------------------ the base housing by the gate: lawns, houses, the ball field
  {
    const streets = [[96, 3872, 180, 3872], [96, 3912, 136, 3912], [110, 3858, 110, 3934]];
    for (const [x0, u0, x1, u1] of streets) k.road([[x0, u0], [x1, u1]], 2.2, { side: 1, lanes: false, pave: [0xc8c8c0, 0xd8d8d0, 0xe4e4dc] });
    k.road([[101, B0 + 2], [101, B0 + 14], [110, 3872]], 2.4, { side: 0, lanes: false, piece: true });
    // the gate: a booth in the middle of the road in, a barrier, the flags
    objects.push({
      y: Y(B0 + 9) + 1,
      draw: () => {
        const X = 101 * S;
        const Yb = Y(B0 + 9) * S;
        img.rectPx(X - 3, Yb - 6, 7, 6, 0xe8e8e2);
        img.rectPx(X - 3, Yb - 8, 7, 2, 0x4a4e52);
        for (let i = -12; i <= -4; i++) img.px(X + i, Yb - 3, i % 2 ? 0xd83a2a : 0xf0f0e8);
        for (const [fx, c] of [[-16, 0xb8282a], [16, 0xf0f0f0]]) {
          for (let j = 0; j < 20; j++) img.px(X + fx, Yb - j, 0x8a8e92);
          img.rectPx(X + fx + 1, Yb - 20, 8, 5, c);
          if (fx > 0) img.discPx(X + fx + 5, Yb - 18, 1.4, 0xd8302a);
          else for (let j = 0; j < 5; j += 2) for (let i = 1; i < 9; i++) img.px(X + fx + i, Yb - 20 + j, 0xe8e8e8);
        }
      },
    });
    // houses: low and white, hipped grey roofs, a lawn each, the car in the drive
    const house = (x, y, w, h, roof) => {
      objects.push({
        y: y + h + 2,
        shadow: () => k.shadowRect(x + 2, y + 2, w, h + 2, 0.55),
        draw: () => {
          img.fine(x, y, w, h, (X, Yy, xx, yy) => {
            const t = (yy - y) / h;
            const e = Math.min(xx - x, x + w - xx);
            let c = t < 0.45 ? scaleColor(roof, 1.12) : scaleColor(roof, 0.86);
            if (e < Math.min(t, 1 - t) * h) c = e < 0.5 ? scaleColor(roof, 0.7) : xx - x < w / 2 ? scaleColor(roof, 1.25) : scaleColor(roof, 0.78);
            if (Math.abs(t - 0.45) < 0.04 && e > h * 0.45) c = scaleColor(roof, 1.4);
            return c;
          });
          for (let i = 0; i < w * S; i++) for (let j = 0; j < 6; j++) img.px(x * S + i, (y + h) * S + j, j < 1 ? 0x6a6a64 : i % 12 > 3 && i % 12 < 8 && j > 1 && j < 5 ? 0x3a4a5a : 0xf0f0e8);
        },
      });
      k.reserve(x - 1, y - 1, w + 2, h + 4);
    };
    const ROOFS = [0x6a6e72, 0x7a6a5a, 0x5a6a62, 0x7e8286, 0x8a7a6a];
    for (let u = 3878; u < 3908; u += 15)
      for (let x = 112; x < 130; x += 13) {
        house(x + 1, Y(u + 11), 10, 7, ROOFS[Math.floor(g() * ROOFS.length)]);
        if (g() < 0.7) k.t.parked(x + 1.5, Y(u + 1.5), [0xe8e8ec, 0x2c3038, 0xc43a30, 0x3a609c, 0x9aa2aa][Math.floor(g() * 5)]);
      }
    for (let x = 114; x < 180; x += 15) if (land(x + 6, 3926)) house(x + 1, Y(3931), 10, 7, ROOFS[Math.floor(g() * ROOFS.length)]);
    // the ball field: the diamond of red clay, the bases, the outfield fence
    {
      const hx = 160;
      const hu = 3880;
      img.fine(138, Y(3914), 42, 36, (X, Yy, x, y) => {
        const u = L - y;
        const dx = x - hx;
        const du = u - hu;
        const d = Math.hypot(dx, du);
        if (du < -1 || d > 34 || !land(x, u)) return null;
        if (d > 32.5) return 0xd0d0c8; // the fence
        const ang = Math.atan2(dx, du);
        if (Math.abs(ang) > 0.82) return null;
        const inf = Math.abs(dx) + Math.abs(du - 7) < 7;
        if (inf && Math.abs(dx) + Math.abs(du - 7) > 4.6) return 0xb8743e; // the base paths
        if (d < 3.4 || (inf && Math.abs(dx) + Math.abs(du - 7) <= 4.6 && d < 1)) return 0xb8743e;
        const c = rampColor(MOWN, 0.4 + (Math.floor(Yy / 6) % 2) * 0.3, X, Yy);
        return c;
      });
      for (const [bx, bu] of [[hx, hu], [hx + 7, hu + 7], [hx, hu + 14], [hx - 7, hu + 7]]) img.rectPx(Math.round(bx * S) - 1, Math.round(Y(bu) * S) - 1, 3, 3, 0xf8f8f0);
      k.reserve(138, Y(3914), 42, 36);
    }
  }
  const truck = (c) => k.sprite(7, 4, 3980, (r) => {
    for (let i = 0; i < 21; i++) for (let j = 0; j < 9; j++) r.px(i, j + 1, i > 15 ? (j > 1 && j < 7 ? 0x2a3440 : c) : i === 15 ? 0x2a2a30 : j === 0 || j === 8 ? scaleColor(c, 0.7) : c);
    for (let i = 0; i < 22; i++) r.px(i + 1, 10, 0x000000, 0.35);
  });
  // ------------------------------------------------------------ the airfield's furniture: lights, hold lines, signs, arresting gear
  const lamp = (x, y, c) => {
    const X = Math.round(x * S);
    const Yy = Math.round(y * S);
    img.px(X, Yy, 0x2a2a2e);
    img.px(X + 1, Yy, c);
    img.px(X, Yy + 1, 0x000000, 0.35);
  };
  for (const r of RWY) {
    for (let u = r.u0; u <= r.u1; u += 7) for (const s2 of [-1, 1]) lamp(r.x + s2 * (r.hw + 0.4) - 0.3, Y(u), 0xf8f4d8); // edge lights
    for (const [u, c] of [[r.u0 - 0.5, 0x40e060], [r.u1 + 0.5, 0xe04040]]) for (let x = r.x - r.hw + 0.5; x < r.x + r.hw; x += 1.2) lamp(x, Y(u), c); // threshold bars
    // the arresting gear: a cable across the runway a quarter of the way in from each end, its housings yellow
    for (const u of [r.u0 + (r.u1 - r.u0) * 0.22, r.u1 - (r.u1 - r.u0) * 0.22]) {
      for (let X = Math.round((r.x - r.hw) * S); X <= Math.round((r.x + r.hw) * S); X++) img.px(X, Math.round(Y(u) * S), 0x1a1a1e);
      for (const s2 of [-1, 1]) img.fine(r.x + s2 * (r.hw + 1.4) - 0.8, Y(u) - 0.8, 1.6, 1.6, () => 0xe0c030);
    }
    // distance-remaining boards along its west side: black with a white bar
    for (let u = r.u0 + 40; u < r.u1 - 20; u += 46) {
      const X = Math.round((r.x - r.hw - 2.6) * S);
      const Yy = Math.round(Y(u) * S);
      img.rectPx(X - 2, Yy - 2, 5, 4, 0x141414);
      img.rectPx(X - 1, Yy - 1, 3, 1, 0xf0f0f0);
      img.rectPx(X - 1, Yy + 2, 4, 1, 0x000000, 0.3);
    }
  }
  // the approach lights beyond the northern ends: bars of lamps in a line out from each runway
  for (const r of RWY)
    for (let u = r.u1 + 8; u < B1 - 6; u += 3) for (let x = r.x - 2; x <= r.x + 2; x += 1) lamp(x, Y(u), 0xfff4c8);
  // the taxiway's blue edge lamps; the hold lines where the links meet runway B; the yellow and black signs
  for (let u = TAXI[0]; u <= TAXI[1]; u += 6) for (const s2 of [-1, 1]) lamp(taxiX(u) + s2 * 3.2 - 0.3, Y(u), 0x4a7aff);
  for (const st of STUBS) {
    for (const [dx, dash] of [[RWY[1].x + RWY[1].hw + 2.2, false], [RWY[1].x + RWY[1].hw + 2.9, true]])
      for (let Yy = Math.round(Y(st + 2.5) * S); Yy <= Math.round(Y(st - 2.5) * S); Yy++) if (!dash || Yy % 3) img.px(Math.round(dx * S), Yy, 0xe8c838);
    const X = Math.round((taxiX(st) - 5) * S);
    const Yy = Math.round(Y(st + 4.6) * S);
    img.rectPx(X, Yy, 9, 4, 0x141414);
    img.rectPx(X + 1, Yy + 1, 3, 2, 0xf0c818);
    img.rectPx(X + 5, Yy + 1, 3, 2, 0xf0c818);
    img.rectPx(X + 1, Yy + 4, 9, 1, 0x000000, 0.35);
  }
  // the glide slope antenna beside runway A's touchdown zone, its shadow long on the grass
  {
    const X = Math.round((RWY[0].x + RWY[0].hw + 4) * S);
    const Yb = Math.round(Y(3912) * S);
    objects.push({ y: Y(3912) + 1, shadow: () => { for (let q = 0; q < 24; q++) img.tintPx(X + 2 + q, Yb + 1 + (q >> 2), 0.6); }, draw: () => {
      for (let j = 0; j < 22; j++) img.px(X, Yb - j, j % 5 === 0 ? 0xd83a2a : 0xe8e8e2);
      img.rectPx(X - 2, Yb - 22, 5, 3, 0xc8c8c4);
    } });
  }

  // ------------------------------------------------------------ sunshades on the south ramp: open canopies, a fighter under each
  img.fine(70, Y(3940), 22, 54, (X, Yy, x, y) => {
    const u = L - y;
    if (x < taxiX(u) + 2.5) return null;
    if (X % 15 === 0 || Yy % 15 === 0) return 0x8a8a84;
    return rampColor(GREY, 0.3 + hashPx(Math.floor(X / 15), Math.floor(Yy / 15), 530) * 0.5, X, Yy);
  });
  k.reserve(70, Y(3940), 22, 54);
  for (const u of [3893, 3906, 3919, 3932]) {
    const y = Y(u);
    objects.push({ y: y + 1, draw: () => fighter(80, y, -1) });
    objects.push({
      y: y + 5,
      shadow: () => k.shadowRect(79, y - 3, 12, 9, 0.55),
      draw: () => img.fine(79, y - 5, 12, 8.4, (X, Yy, x, yy) => {
        const t = (yy - (y - 5)) / 8.4;
        if (x - 79 < 0.5 || 91 - x < 0.5) return 0x6a6e72;
        return (X % 6 === 0) ? 0x9aa0a4 : t < 0.5 ? 0xd4d8dc : 0xb8bcc0;
      }),
    });
  }

  // ------------------------------------------------------------ a C-130 on the ramp: straight wing, four propellers, high tail
  {
    const cx = 122;
    const cy = Y(3992);
    const pts = [];
    const P = (i, j, c) => pts.push([i, j, c]);
    for (let s2 = -1; s2 <= 1; s2 += 2) {
      for (let w = 0; w < 20; w++) for (let i = 1; i <= 7; i++) P(i, s2 * (3 + w), w > 18 ? 0x5e6a58 : 0x7a8672);
      for (const e of [7, 14]) {
        for (let i = 6; i <= 11; i++) for (let j = -1; j <= 1; j++) P(i, s2 * (3 + e) + j, 0x5a6454);
        for (let j = -3; j <= 3; j++) P(12, s2 * (3 + e) + j, 0x2a2a2e); // the propeller
      }
      for (let w = 0; w < 8; w++) for (let i = -17; i <= -13; i++) P(i, s2 * (2 + w), 0x7a8672);
    }
    for (let i = -18; i <= 17; i++) for (let j = -3; j <= 3; j++) if (Math.abs(j) < 3 || (i > -14 && i < 14)) P(i, j, Math.abs(j) < 2 ? 0x8a9682 : 0x6e7a66);
    for (let i = 13; i <= 16; i++) P(i, 0, 0x2a3440);
    shape(Math.round(cx * S), Math.round(cy * S), -1, pts, 6);
    k.reserve(cx - 8, cy - 8, 16, 16);
  }
  // ground equipment by the tankers: tugs, a baggage train, stairs, chocks of cones
  for (const [x, u, c, w2, h2] of [[86, 3972, 0xf0c020, 6, 3], [114, 3958, 0xe8e8e2, 9, 2], [86, 3998, 0x3a6a3a, 5, 3], [114, 4004, 0xd8d8d0, 4, 4]]) {
    const X = Math.round(x * S);
    const Yy = Math.round(Y(u) * S);
    img.rectPx(X + 1, Yy + 1, w2 * 2, h2 * 2, 0x000000, 0.35);
    img.rectPx(X, Yy, w2 * 2, h2 * 2, c);
    img.rectPx(X, Yy, w2 * 2, 1, scaleColor(c, 1.2));
  }
  for (const [x, u] of [[92, 3962], [92, 3992], [108, 3970], [108, 4000]]) img.px(Math.round(x * S), Math.round(Y(u) * S), 0xff7a1a);

  // ------------------------------------------------------------ the helipad with a Black Hawk, the radome, the water tower
  {
    const hx = 150;
    const hu = 3944;
    img.fine(hx - 7, Y(hu) - 7, 14, 14, (X, Yy, x, y) => {
      const d = Math.hypot(x - hx, y - Y(hu));
      if (d > 6.6) return null;
      if (d > 6) return 0xe8e8e2;
      const ax = Math.abs(x - hx);
      const ay = y - Y(hu);
      if ((ax > 2 && ax < 3 && Math.abs(ay) < 3.2) || (ax < 2.6 && Math.abs(ay) < 0.5)) return 0xf0f0e8; // the H
      return rampColor(GREY, 0.2 + hashPx(X >> 2, Yy >> 2, 531) * 0.3, X, Yy);
    });
    k.reserve(hx - 7, Y(hu) - 7, 14, 14);
    const heli = (r2) => {
      for (let i = -12; i <= 10; i++) for (let j = -2; j <= 2; j++) if (Math.abs(j) < 2 || (i > -5 && i < 8)) r2.px(24 + i, 24 + j, Math.abs(j) < 1 ? 0x4a523e : 0x3a4232);
      for (let i = -20; i <= -12; i++) r2.px(24 + i, 24, 0x3a4232);
      for (let j = -3; j <= 3; j++) r2.px(5, 24 + j, 0x2a2e26);
      for (let i = 5; i <= 8; i++) r2.px(24 + i, 24, 0x1e2a34);
    };
    const rot = [0, 1, 2].map((f) => k.sprite(16, 16, hu, (r2) => {
      heli(r2);
      for (let a = 0; a < 4; a++) {
        const ang = a * (Math.PI / 2) + f * 0.52;
        for (let q = 3; q < 22; q++) r2.px(24 + Math.cos(ang) * q, 24 + Math.sin(ang) * q, 0x1a1a1e, 0.55);
      }
    }, true));
    kit.loop(hx - 8, hu + 8, rot, { fps: 14, d: 0.45 });
    // the radome: a white sphere on its tower
    const rx = 128;
    const ry = Y(3944);
    objects.push({ y: ry + 5, shadow: () => k.shadowEllipse(rx + 2, ry + 2, 5, 5, 0.55), draw: () => img.fine(rx - 5, ry - 5, 10, 10, (X, Yy, x, y) => {
      const d = Math.hypot(x - rx, y - ry);
      if (d > 4.6) return null;
      const lit = 0.65 + 0.35 * Math.max(0, -((x - rx) + (y - ry)) / 6.5);
      return hashPx(X >> 1, Yy >> 1, 532) < 0.1 ? scaleColor(0xf4f4f0, lit * 0.92) : scaleColor(0xf4f4f0, lit);
    }) });
    k.reserve(rx - 5, ry - 5, 10, 10);
    // the water tower: a tank on legs, its long shadow
    const wx = 172;
    const wy = Y(3946);
    objects.push({ y: wy + 4, shadow: () => k.shadowEllipse(wx + 6, wy + 5, 4, 3, 0.55), draw: () => {
      for (const [dx, dy] of [[-2, 2], [2, 2], [-2, -2], [2, -2]]) for (let j = 0; j < 9; j++) img.px(Math.round((wx + dx) * S), Math.round((wy + dy) * S) - j, 0x8a8e92);
      img.fine(wx - 4, wy - 7, 8, 8, (X, Yy, x, y) => {
        const d = Math.hypot(x - wx, y - (wy - 3));
        if (d > 3.8) return null;
        return d > 3.2 ? 0xa8acb0 : (x - wx) < 0 ? 0xe8ecf0 : 0xc8ccd0;
      });
    } });
    k.reserve(wx - 5, wy - 8, 10, 12);
  }

  // ------------------------------------------------------------ the fire station by the runways: red doors, the crash trucks out front
  {
    const fx = 124;
    const fy = Y(4100);
    shed(fx, fy, 20, 9, 0xb0aca4);
    objects.push({ y: fy + 12, draw: () => {
      for (let q = 0; q < 4; q++) img.rectPx(Math.round((fx + 1 + q * 4.8) * S), Math.round((fy + 9) * S) + 1, 11, 4, 0xc8281e);
    } });
    for (const [tx, tu] of [[127, 4088], [134, 4088]]) {
      const X = Math.round(tx * S);
      const Yy = Math.round(Y(tu) * S);
      img.rectPx(X + 1, Yy + 1, 12, 24, 0x000000, 0.35);
      img.rectPx(X, Yy, 12, 24, 0xd0281e);
      img.rectPx(X + 2, Yy + 2, 8, 5, 0x2a3440);
      img.rectPx(X + 3, Yy + 12, 6, 6, 0xe8e8e2);
    }
  }
  // the radar: its antenna turning on a lattice mast
  {
    const rx = 140;
    const ru = 4112;
    if (land(rx + 3, ru)) {
      const frames = [0, 1, 2, 3, 4, 5].map((f) => k.sprite(10, 10, ru, (r2) => {
        const ang = (f / 6) * Math.PI;
        for (let q = -12; q <= 12; q++) for (let w = -1; w <= 1; w++) r2.px(15 + Math.cos(ang) * q - Math.sin(ang) * w, 15 + Math.sin(ang) * q + Math.cos(ang) * w, w ? 0x8a9096 : 0xd8dce0);
        r2.discPx(15, 15, 2, 0x4a4e52);
      }));
      kit.loop(rx - 5, ru + 5, frames, { fps: 4, d: 0.5 });
      img.discPx(rx * S + 3, Y(ru) * S + 3, 5, 0x000000, 0.35);
      k.reserve(rx - 5, Y(ru) - 5, 10, 10);
    }
  }
  // the windsock on its mast between the runways, flapping
  {
    const sx = 38;
    const su = 4060;
    const sock = [0, 1, 2].map((f) => k.sprite(8, 4, su, (r2) => {
      for (let i = 0; i < 18; i++) {
        const w = 3 - i * 0.12;
        const dy = Math.sin(i / 3 + f * 2) * (i / 9);
        for (let j = -w; j <= w; j++) r2.px(3 + i, 6 + j + dy, Math.floor(i / 4) % 2 ? 0xf0f0e8 : 0xf06a1a);
      }
      for (let j = 0; j < 6; j++) r2.px(2, 6 + j, 0x6a6e72);
    }, true));
    kit.loop(sx, su + 2, sock, { fps: 5, d: 0.5 });
  }
  // traffic on the ramp: a fuel truck from the fuel farm to the tankers and back, a follow-me car along the taxiway
  const car = (c) => k.sprite(6, 4, 4000, (r2) => {
    for (let i = 0; i < 16; i++) for (let j = 0; j < 8; j++) r2.px(i + 1, j + 2, i > 10 ? (j > 0 && j < 7 ? 0x2a3440 : c) : j === 0 || j === 7 ? scaleColor(c, 0.75) : c);
    for (let i = 0; i < 17; i++) r2.px(i + 2, 10, 0x000000, 0.35);
    r2.px(8, 2, 0xffd040);
    r2.px(8, 9, 0xffd040);
  });
  kit.path([[132, 4044], [132, 4014], [128, 4012], [116, 4012], [100, 4012]], [truck(0xd8d8d0)], { sp: 4, mode: 'pp', hold: 8, turn: 'rot', fps: 1, d: 0.45 });
  kit.path([[taxiX(3890) + 0.5, 3890], ...[3960, 4030, 4050, 4070, 4130, 4200].map((u) => [taxiX(u) + 0.5, u])], [car(0xf0c818)], { sp: 9, mode: 'pp', hold: 3, turn: 'rot', fps: 1, d: 0.45, s0: 0.6 });

  // palms along the housing's streets
  for (let x = 116; x < 178; x += 9) if (!k.anyRes(x - 2, Y(3868) - 2, 4, 4)) k.palm(x, Y(3867.5), 3.4, 5100 + x);
  for (let u = 3878; u < 3932; u += 9) if (!k.anyRes(105.5, Y(u) - 2, 3, 4)) k.palm(106.5, Y(u), 3.2, 5200 + u);

  // ------------------------------------------------------------ what moves: a fighter taxiing, another taking off, trucks on the ramp
  const jf = k.sprite(12, 10, 4000, (r) => shape(18, 15, 1, fighterPts(), 0, (X, Yy, c) => r.px(X, Yy, c)));
  kit.path([[taxiX(TAXI[0] + 10), TAXI[0] + 10], ...[3940, 4000, 4030, 4050, 4070, 4110].map((u) => [taxiX(u), u])], [jf], { sp: 7, mode: 'pp', hold: 5, turn: 'rot', fps: 1, d: 0.45 });
  kit.path([[RWY[0].x, RWY[0].u0 + 4], [RWY[0].x, RWY[0].u1 - 6]], [jf], { sp: 46, mode: 'wrap', turn: 'rot', fps: 1, d: 0.45 });
  kit.wander(121, 3958, 6, 9, [truck(0xe8e8e2), truck(0xd8b830)], { n: 2, sp: 5, turn: 'rot', fps: 1, idle: 0.5, d: 0.45 });
  void mix;
  void smooth;
}
