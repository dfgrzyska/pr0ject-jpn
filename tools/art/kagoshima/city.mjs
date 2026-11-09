// Kagoshima city, u = 0..1345: the palm avenue with its trams on lawn-covered tracks; Chūō station with the Amuran wheel on its
// roof and the Young Pioneers on their plinth in the forecourt; the railway viaduct; the samurai-era lane along the Kajiya;
// Tenmonkan's glass arcade through its blocks of signs and the big white bear over the ice-cream shop; Yamakataya; Central
// Park; Saigō in bronze at the foot of Shiroyama, Terukuni Shrine, the old castle's stone walls and moat under the camphor
// forest; the tram depot; the Kōtsuki and its five-arched stone bridges. Yellow ash bags on the corners, ash on everything.
import { C, S, night, hashPx, scaleColor, rampColor, mix, fbm, rng } from '../nagasaki/canvas.mjs';
import { W, STREETS, STREET_HW, COLUMNS, VIADUCT, DEPOT, ARCADE, RIVER, SENGAN } from './geo.mjs';

export const LEAF = {
  camphor: [0x1e3424, 0x2c4a2e, 0x3e6038, 0x567a48],
  camellia: [0x18301f, 0x264630, 0x345c38, 0x4a7040],
  pine: [0x1a3024, 0x28442c, 0x3a5a36, 0x527040],
  ashen: [0x2a3a2c, 0x3c4e38, 0x526448, 0x6e7c5e],
};
const BED = [0x3e7a32, 0x4e8c3a, 0x62a048];
const ROOFS = [0x6a6e74, 0x7a7e82, 0x5e6268, 0x8a8a8a, 0x6e6a64, 0x74787e, 0x8a8478];
const WALLS = [0xc8c4bc, 0xd8d4ca, 0xb8b4ac, 0xe0dcd2, 0xa8acb0, 0xc8bca8, 0xd0c8b4, 0x9aa2aa];
const SIGNS = [0xd83a2a, 0x2a6ab8, 0xe8b830, 0x2a8a5a, 0xe85a8a, 0xf0f0e8];

/** The city's yellow ash bags, piled at a kerb for collection. */
export const ashBags = (k, x, y, n = 4) => {
  const { img } = k;
  const X = Math.round(x * S);
  const Yy = Math.round(y * S);
  for (let q = 0; q < n; q++) {
    const CX = X + (q % 3) * 7 + (q > 2 ? 3 : 0);
    const CY = Yy + (q > 2 ? 5 : 0);
    for (let j = 0; j < 9; j++) for (let i = 0; i < 8; i++) img.tintPx(CX + i - 2, CY + j, 0.72);
    for (let j = 0; j < 8; j++)
      for (let i = 0; i < 6; i++) {
        const corner = (j < 1 || j > 6) && (i < 1 || i > 4);
        if (!corner) img.px(CX + i - 3, CY + j - 3, j === 3 || j === 4 ? 0x2a2a30 : i < 2 ? 0xffe858 : i > 3 ? 0xc8a018 : 0xf0d030);
      }
    img.rectPx(CX - 1, CY - 5, 2, 2, 0xb89010);
  }
};

export function paintCity(k) {
  const { img, Y, U, kit, objects, glowPx, pool } = k;
  const R = rng(4404);
  const HW = STREET_HW;

  // ------------------------------------------------------------ the streets
  for (const u of STREETS) k.road([[-14, u], [W + 14, u]], HW, { side: 2 });
  const avenue = (X, Yy, across) => {
    const a = Math.abs(across);
    // the lawn the trams run on, two tracks in it, cut short and bright
    if (a < 5.2) {
      for (const t of [-3, 3]) {
        const q = Math.abs(across - t);
        if (Math.abs(q - 1) < 0.34) return 0xb8bcc0;
        if (Math.abs(q - 1) < 0.67) return 0x3e4238;
      }
      if (a < 0.34 && Yy % 42 < 3) return 0x4a4e54; // the overhead wires' poles
      return k.lawnPx(X, Yy, 0.25 + hashPx(X >> 2, Yy >> 2, 451) * 0.5, BED);
    }
    if (a < 5.6) return C.granite[2];
    if (Math.abs(a - 7.8) < 0.17 && (Yy >> 3) % 3 === 0) return 0xdad6c8;
    return k.asphaltPx(X, Yy);
  };
  const AV_TOP = DEPOT.u0 + 2;
  k.road([[90, -14], [90, 1161]], 10, { side: 2, paint: avenue, piece: true });
  for (const x of [30, 150]) k.road([[x, -14], [x, RIVER[0] + 3]], 5, { side: 2, piece: true });
  // the junctions: the streets run through unbroken, the trams' rails across them, crossings all round
  for (const su of STREETS)
    for (const { x, hw } of COLUMNS) {
      if (su === 1166 && x === 90) continue;
      img.fine(x - hw - 2, Y(su + HW - 0.34), hw * 2 + 4, HW * 2 - 0.68, (X, Yy) => k.asphaltPx(X, Yy));
      for (const side of [-1, 1]) k.zebraH(x - hw + 1, x + hw - 1, su + side * (HW + 3) - (side < 0 ? 2 : 0));
      for (const zx of [x - hw - 6, x + hw + 3]) if (zx > 0 && zx < W - 3) k.zebraV(zx, su - HW + 1, su + HW - 1);
      if (x === 90)
        img.fine(84, Y(su + HW), 12, HW * 2, (X, Yy, xx) => {
          for (const t of [87, 93]) {
            const q = Math.abs(Math.abs(xx - t) - 1);
            if (q < 0.34) return 0xa8acb0;
            if (q < 0.5) return 0x24262a;
          }
          return null;
        });
    }
  // the avenue's end at the 1166: its tracks carry on over the street to the depot's gate
  img.fine(84, Y(1176), 12, 15, (X, Yy, xx) => {
    for (const t of [87, 93]) {
      const q = Math.abs(Math.abs(xx - t) - 1);
      if (q < 0.34) return 0xa8acb0;
      if (q < 0.5) return 0x24262a;
    }
    return null;
  });
  img.fine(78, Y(1166 - HW + 0.34) - 0, 24, 3, (X, Yy) => k.asphaltPx(X, Yy));
  k.reserve(78, Y(AV_TOP), 24, AV_TOP);

  // the railway on its viaduct: its shadow on the street, the concrete deck, two tracks of ballast, the piers' feet
  {
    const [v0, v1] = VIADUCT;
    img.fine(0, Y(v1 + 1), W, v1 - v0 + 2, (X, Yy, x, y) => {
      const u = 7168 - y;
      const e = Math.min(u - v0, v1 - u);
      if (e < 0.5) return e < 0.25 ? 0xd0ccc4 : 0x8a867e;
      for (const t of [v0 + 3, v1 - 3]) {
        const q = Math.abs(u - t);
        if (Math.abs(q - 1) < 0.2) return 0xc0c4c8;
        if (q < 2) return X % 6 === 0 ? 0x4a3a2a : rampColor(C.stone ?? C.granite, hashPx(X >> 1, Yy >> 1, 471) * 0.7, X, Yy);
      }
      return rampColor(C.concrete, 0.3 + hashPx(X >> 3, Yy >> 2, 472) * 0.3, X, Yy);
    });
    img.fine(0, Y(v0 - 1), W, 5, (X, Yy) => {
      img.tintPx(X, Yy, 0.62);
      return null;
    });
    for (let x = 6; x < W; x += 30) k.shadowRect(x, Y(v0) + 1, 4, 3, 0.4);
    // the platform under its long canopy, beside the station
    img.fine(102, Y(v1 - 4.5), 40, 3.2, (X, Yy) => ((X - 306) % 12 === 0 ? 0x7a7e86 : Yy % 3 ? 0xc8ccd4 : 0xaeb2ba));
    k.reserve(0, Y(v1 + 2), W, v1 - v0 + 9);
  }

  // ------------------------------------------------------------ what a block is made of
  const fancyRoof = (x, y, w, rh) => {
    // a billboard on the roof, standing on its frame
    const X0 = (x + 2) * S;
    const WW = (w - 4) * S;
    const Yy = (y + 1) * S;
    const c = SIGNS[Math.floor(hashPx(x, y, 460) * SIGNS.length)];
    for (let j = 0; j < 12; j++) for (let i = 0; i < WW; i++) img.px(X0 + i, Yy + j, j < 1 || j > 10 || i < 1 || i >= WW - 1 ? 0x2a2a30 : c);
    for (let i = 4; i < WW - 4; i += 5) for (let j = 3; j < 9; j++) if (hashPx(i >> 1, j, x + y) < 0.72) img.px(X0 + i + (j % 2), Yy + j, c === 0xf0f0e8 ? 0x2a2a30 : 0xfffff0);
    for (const i of [3, WW - 4]) for (let j = 12; j < 16; j++) img.px(X0 + i, Yy + j, 0x24262a);
  };
  const verticalSign = (x, by, h) => {
    const c = SIGNS[Math.floor(hashPx(x, by, 461) * SIGNS.length)];
    const X = x * S;
    const Y0 = (by - h) * S;
    for (let j = 0; j < (h - 3) * S; j++)
      for (let i = 0; i < 6; i++) {
        const g = hashPx(i >> 1, j >> 2, x + by);
        img.px(X + i, Y0 + j, i === 0 || i === 5 ? 0x24242a : g < 0.45 && j % 7 < 5 ? (c === 0xf0f0e8 ? 0x2a2a30 : 0xfffff0) : c);
      }
  };
  /** An office or department block: roof with its plant, floors of windows, shops along the street; dressed by chance. */
  const office = (x, u, w, h, opt = {}) => {
    const fh = opt.fh ?? Math.min(h - 7, 8 + Math.floor(R() * 12));
    const rh = h - fh;
    if (k.anyRes(x, Y(u + h), w, h)) return false;
    const sign = opt.sign ?? R() < 0.22;
    const vert = opt.vert ?? R() < 0.36;
    k.house(x, Y(u + h), w, rh, fh, 'block', {
      roofC: opt.roofC ?? R.pick(ROOFS),
      wall: opt.wall ?? R.pick(WALLS),
      plainRoof: !!sign,
      extra: (by) => {
        if (sign) fancyRoof(x, Y(u + h), w, rh);
        if (vert && fh > 8) verticalSign(x + w - 3, by, Math.min(fh - 1, 14));
        opt.extra?.(by);
      },
    });
    return true;
  };
  /** A low old house or shop under dark tiles. */
  const lowHouse = (x, u, w, h, noren) => {
    if (k.anyRes(x, Y(u + h), w, h)) return false;
    const rh = Math.round(h * 0.56);
    k.house(x, Y(u + h), w, rh, h - rh, 'jp', { ramp: C.kawara, wall: R.pick([0xd8ccb4, 0xc8bca4, 0xe4dccc]), noren, bay: R.int(3, 5), door: true });
    return true;
  };
  /** A pay car park: painted bays, a few cars, its machine at the gate. */
  const carPark = (x, u, w, h) => {
    if (k.anyRes(x, Y(u + h), w, h)) return;
    img.fine(x, Y(u + h), w, h, (X, Yy, xx, yy) => {
      const inRow = (yy - Y(u + h)) % 11;
      if ((inRow < 1 || inRow > 5) && X % 15 < 2 && inRow < 8) return 0xd8d4c6;
      return k.asphaltPx(X, Yy);
    });
    for (let r = 0; r * 11 + 6 < h; r++)
      for (let q = 0; (q + 1) * 5 <= w; q++) {
        if (hashPx(x + q, u + r, 462) < 0.42) continue;
        const X = (x + q * 5) * S + 2;
        const Yy = (Y(u + h) + r * 11 + 1) * S;
        const c = C.roofs[0];
        const col = [0xe8e8ec, 0x2c3038, 0xc43a30, 0x3a609c, 0x9aa2aa][Math.floor(hashPx(q, r + x, 463) * 5)];
        for (let j = 0; j < 12; j++) for (let i = 0; i < 9; i++) img.px(X + i, Yy + j, j > 3 && j < 8 ? scaleColor(col, 1.14) : j >= 2 && j < 11 && (j === 3 || j === 8) ? 0x2a3440 : i === 0 || i === 8 ? scaleColor(col, 0.7) : col);
        void c;
      }
    k.reserve(x, Y(u + h), w, h);
  };
  /** A pocket park on a corner: a square of grass, a bench, a camphor, a stone drinking fountain. */
  const pocket = (x, u, w, h) => {
    if (k.anyRes(x, Y(u + h), w, h)) return;
    k.lawnFill(x, Y(u + h), w, h, C.lawn, x + u);
    img.fine(x, Y(u + h), w, h, (X, Yy, xx, yy) => {
      const e = Math.min(xx - x, x + w - xx, yy - Y(u + h), Y(u) - yy);
      return e < 0.6 ? C.granite[2] : null;
    });
    k.tree(x + w / 2, Y(u + h * 0.6), Math.min(w, h) * 0.32, LEAF.camphor, x * 3 + u);
    k.bench(x + 2, Y(u + 2) - 2, 4);
    k.reserve(x, Y(u + h), w, h);
  };
  /** Fill a quarter with buildings of different sizes, a car park or a pocket of green now and then. */
  const quarter = (x0, x1, u0, u1) => {
    for (let x = x0; x < x1 - 7; ) {
      let w = Math.min(x1 - x, R.int(12, 24));
      if (x1 - x - w < 8) w = x1 - x;
      for (let u = u0; u < u1 - 11; ) {
        let h = Math.min(u1 - u, R.int(17, 34));
        if (u1 - u - h < 12) h = u1 - u;
        const r = R();
        if (r < 0.1) carPark(x, u, w - 1, Math.min(h, 24));
        else if (r < 0.16 && h > 14) pocket(x, u, w - 1, Math.min(h, 22));
        else if (r < 0.34 && h < 28) lowHouse(x, u, w - 1, h - 1, R() < 0.5 ? R.pick([0x2a4a8a, 0x8a2a2a, 0xe8d8b0]) : undefined);
        else office(x, u, w - 1, h - 1);
        u += h + 1;
      }
      x += w;
    }
    k.fillGaps(x0, x1, u0, u1, (x, u, w, h) => (h >= 14 ? office(x, u, w - 1, h - 1, { sign: false, vert: false }) : lowHouse(x, u, w - 1, h - 1)));
  };

  // ------------------------------------------------------------ Chūō station, the wheel, the forecourt
  const FU = 332; // the forecourt starts here, the station's face at 370
  {
    const x = 102;
    const w = 40;
    const fy = Y(370);
    const y = Y(420);
    const deck = Y(384);
    objects.push({
      y: fy,
      shadow: () => k.shadowRect(x + 3, y + 3, w, fy - y, 0.5),
      draw: () => {
        // the roof: pale decks stepping back, the wheel's platform, the plant
        img.fine(x, y, w, deck - y, (X, Yy, xx, yy) => {
          const e = Math.min(xx - x, x + w - xx, yy - y);
          if (e < 0.5) return 0xe0dcd4;
          const dx = xx - x;
          const dy = yy - y;
          // a raised deck round the wheel, a garden with its paths, the plant rooms along the back
          if (dx > 8 && dx < 32 && dy > 4 && dy < 28) {
            if (dx < 9 || dx > 31 || dy < 5 || dy > 27) return 0xe8e4dc;
            if ((X >> 2) % 3 === 0) return 0x9a7a54;
            return (X >> 2) % 3 === 1 ? 0xb0906a : 0xa28260;
          }
          if ((dx < 7 || dx > 33) && dy > 6 && dy < 30 && dy % 8 > 1) return k.lawnPx(X, Yy, 0.3 + hashPx(X >> 1, Yy >> 1, 474) * 0.5, C.lawn);
          if (dy < 4) return (X >> 3) % 2 ? 0x6a6e74 : 0x7a7e84;
          if ((X >> 3) % 8 === 0 || (Yy >> 3) % 8 === 0) return 0x8a8a8a;
          return rampColor([0xa4a09a, 0xb4b0a8, 0xc0bcb2], hashPx(X >> 3, Yy >> 3, 473), X, Yy);
        });
        for (let q = 0; q < 6; q++) {
          const X = (x + 3 + q * 6.5) * S;
          const Yy = (y + 0.5) * S;
          for (let j = 0; j < 9; j++) for (let i = 0; i < 12; i++) img.px(X + i, Yy + j, j < 2 ? 0xd8d8d0 : i % 3 === 0 ? 0x4a4e54 : 0x8a8e94);
        }
        // the glass front over the forecourt, four storeys, its name band, the entrance
        img.fine(x, deck, w, fy - deck, (X, Yy, xx, yy) => {
          const j = Yy - deck * S;
          const i = X - x * S;
          if (j < 2) return 0x5a5a60;
          if (j < 9) return (i >> 2) % 2 ? 0x2a6ab8 : 0xf0f0f0;
          const row = (j - 9) % 7;
          if (row === 0) return 0x7a7e86;
          if (i % 9 === 0) return 0x5a6068;
          const sky = 1 - (j - 9) / ((fy - deck) * S - 9);
          return hashPx(i >> 2, (j - 9) >> 3, 474) < 0.1 ? 0xffe8b8 : mix(0x3a5a78, 0x8ab0c8, sky * 0.7 + hashPx(i >> 3, row, 475) * 0.2);
        });
        const CX = (x + w / 2) * S;
        for (let j = -18; j < 0; j++) for (let i = -21; i <= 21; i++) img.px(CX + i, fy * S + j, Math.abs(i) % 7 === 0 ? 0x24262a : j < -15 ? 0x7a7e86 : 0x8ab0c8);
        // the canopy over the doors
        for (let j = -24; j < -18; j++) for (let i = -30; i <= 30; i++) img.px(CX + i, fy * S + j, j < -22 ? 0xe8e8e4 : 0xa8acb0);
      },
    });
    k.reserve(x - 1, y - 1, w + 2, fy - y + 2);
    // the wheel: red ring, twelve spokes in three steps of turning; its gondolas go round on their own
    const CXw = x + w / 2;
    const CYw = Y(402);
    objects.push({
      y: Y(385),
      draw: () => {
        const X = CXw * S;
        const Yy = CYw * S;
        // its stand: two raking legs from the deck
        for (const s of [-1, 1]) for (let j = 0; j < 42; j++) for (let i = 0; i < 4; i++) img.px(X + s * (j * 0.28) + i - 2, Yy + j, i < 2 ? 0xd8d4cc : 0x8a8680);
        for (let i = -18; i <= 18; i++) for (let j = 0; j < 4; j++) img.px(X + i, Yy + 42 + j, j < 1 ? 0xe8e4dc : 0x7a7670);
      },
    });
    const wheel = [0, 1, 2].map((s) =>
      k.capture(CXw - 17, CYw - 17, 35, 35, () => {
        const X = CXw * S + 1;
        const Yy = CYw * S + 1;
        for (let a = 0; a < 6.283; a += 0.006) {
          img.px(X + Math.cos(a) * 45, Yy + Math.sin(a) * 45, 0xd8302a);
          img.px(X + Math.cos(a) * 44, Yy + Math.sin(a) * 44, 0xf05a48);
          img.px(X + Math.cos(a) * 41, Yy + Math.sin(a) * 41, 0xa8a4a0);
        }
        for (let q = 0; q < 12; q++) {
          const a = (q / 12) * 6.283 + (s / 3) * (6.283 / 12);
          img.linePx(X, Yy, Math.round(X + Math.cos(a) * 44), Math.round(Yy + Math.sin(a) * 44), q % 2 ? 0xc8c4bc : 0xe8e4dc);
        }
        img.discPx(X, Yy, 5, 0xe8e4dc);
        img.discPx(X, Yy, 2, 0xd8302a);
      }, 402),
    );
    kit.loop(CXw - 17, U(CYw - 17), wheel, { fps: 1.5, ph: 0 });
    const gond = [0xf0c030, 0x40a0e0, 0xe85a8a, 0x5ac05a].map((c) =>
      k.sprite(4, 3, 402, (r) => {
        for (let j = 0; j < 8; j++) for (let i = 0; i < 10; i++) r.px(i, j, j < 2 ? scaleColor(c, 1.2) : j === 7 ? scaleColor(c, 0.7) : i > 1 && i < 8 && j < 5 ? 0x8ac8e0 : c);
      }),
    );
    kit.orbit(CXw, U(CYw) - 1, 15, gond, { n: 12, w: ((Math.PI * 2) / 12 / 3) * 1.5, d: 0.02 });

    // the forecourt, flagged to the avenue, the bus bays down the far side
    const fx0 = 102;
    const fx1 = 142;
    k.flagFill(fx0, Y(370), fx1 - fx0, 370 - FU, C.plaza, 476, 15);
    k.reserve(fx0, Y(370), fx1 - fx0, 370 - FU);
    for (const q of [0, 1, 2]) {
      // a bus bay with its shelter
      const bx = 128;
      const bu = FU + 3 + q * 11;
      img.fine(bx, Y(bu + 7), 14, 7, (X, Yy) => k.asphaltPx(X, Yy));
      k.sprite; // (buses are drawn as they stand)
      const col = q === 1 ? 0xe8e4dc : 0xf0ece0;
      objects.push({
        y: Y(bu),
        draw: () => {
          const X = bx * S;
          const Yy = Y(bu + 6) * S;
          for (let j = 0; j < 15; j++) for (let i = 2; i < 36; i++) img.px(X + i, Yy + j, j < 2 ? 0xffffff : j > 12 ? scaleColor(col, 0.66) : i > 30 ? 0x2a3a4a : j > 5 && j < 10 && (i - 4) % 6 < 4 ? 0x5a7a8a : q === 2 ? 0xd8483a : col);
        },
      });
    }
    // the Young Pioneers of Satsuma: seventeen students who sailed for Britain in 1865, in bronze on a tall plinth
    {
      const sx = 114;
      const su = 348;
      objects.push({
        y: Y(su),
        shadow: () => k.shadowRect(sx - 6, Y(su) - 3, 15, 4, 0.5),
        draw: () => {
          const X = sx * S;
          const Yb = Y(su) * S;
          for (let j = 0; j < 8; j++) for (let i = -16; i <= 16; i++) img.px(X + i, Yb - j, j < 2 ? C.granite[4] : i > 12 ? C.granite[0] : C.granite[2]);
          for (let j = 8; j < 16; j++) for (let i = -12; i <= 12; i++) img.px(X + i, Yb - j, j > 13 ? C.granite[4] : i > 9 ? C.granite[0] : C.granite[3]);
          // the figures, in a loose group, dark bronze lit on the left, one pointing out to sea
          for (let q = 0; q < 7; q++) {
            const fx = X - 10 + q * 3.4;
            const h = 15 + (q % 2) * 2;
            for (let j = 0; j < h; j++) for (let i = -1; i <= 1; i++) img.px(fx + i, Yb - 16 - j, i < 0 ? 0x5a7a68 : i > 0 ? 0x1e3028 : 0x3a5448);
            for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) img.px(fx + i, Yb - 17 - h + j, i < 1 ? 0x4a6a58 : 0x24382e);
          }
          img.linePx(X + 3, Yb - 26, X + 11, Yb - 34, 0x3a5448);
        },
      });
      k.reserve(sx - 6, Y(su) - 4, 13, 5);
      for (const px of [107, 121, 107, 121]) k.palm(px, Y(px === 107 ? 340 : 362), 5.5, px * 3);
      k.crowd(106, Y(346), 18, 10, 16);
      k.strollers(116, 360, 10, 6, 4);
    }
    // the taxi rank along the avenue's side, tram stop on the lawn
    for (let i = 0; i < 4; i++) {
      const Yy = Y(FU + 6 + i * 8) * S;
      const X = 103 * S;
      for (let j = 0; j < 12; j++) for (let q = 0; q < 21; q++) img.px(X + q, Yy + j, j > 3 && j < 8 && q > 5 && q < 16 ? 0xf0f0e0 : j === 0 ? 0xffe870 : j === 11 ? 0xa88a20 : q > 16 && q < 19 ? 0x2a3440 : 0xe8c830);
    }
  }
  /** A tram stop on the lawn: two narrow platforms under their roofs, people waiting. */
  const tramStop = (u0) => {
    for (const x of [79, 96]) {
      img.fine(x + 1, Y(u0 + 26), 4, 26, (X, Yy) => k.settPx(X, Yy, 480, C.granite));
      objects.push({
        y: Y(u0 + 8),
        draw: () => {
          const X = (x + 1) * S;
          const Yy = Y(u0 + 21) * S;
          for (let j = 0; j < 33; j++) for (let i = 0; i < 12; i++) img.px(X + i, Yy + j, j < 2 ? 0xe8e8e4 : i < 2 ? 0xc8ccd0 : i > 9 ? 0x6a7078 : (j >> 2) % 3 ? 0x98a4ac : 0x7a8690);
        },
      });
    }
    k.standing(80, Y(u0 + 6), 2, 4, 2, u0, undefined);
    k.standing(97, Y(u0 + 24), 2, 4, 2, u0 + 1, undefined);
  };
  tramStop(280);
  tramStop(640);
  tramStop(1020);

  // palms down both sides of the avenue, in their planters
  for (let u = 8; u < 1160; u += 22) {
    if (STREETS.some((s) => Math.abs(u - s) < 12) || (u > VIADUCT[0] - 12 && u < VIADUCT[1] + 10)) continue;
    for (const x of [78, 102]) {
      img.discPx(x * S + 1, Y(u) * S, 5, 0x4a3a2a);
      k.palm(x, Y(u), 5.2 + hashPx(x, u, 481), x + u);
    }
  }

  // ------------------------------------------------------------ the samurai-era lane along the Kajiya
  {
    const x0 = 103;
    const x1 = 143;
    const u0 = 128;
    const u1 = 243;
    img.fine(x0, Y(u1), x1 - x0, u1 - u0, (X, Yy, x, y) => {
      if (Math.abs(x - 123) < 3.4) return Math.abs(x - 123) > 3 ? C.granite[1] : k.earthPx(X, Yy, 482);
      // the stream down the lane's side, stone-edged
      if (Math.abs(x - 118.5) < 1.1) return (X + Yy) % 11 === 0 ? 0xa8d0d4 : 0x2a5a60;
      return k.lawnPx(X, Yy, 0.2 + fbm(x, y, { seed: 483, scale: 8 }) * 0.55, C.moss);
    });
    k.reserve(x0, Y(u1), x1 - x0, u1 - u0);
    const row = [[104, 132, 12], [104, 160, 12], [104, 188, 12], [104, 216, 12], [128, 134, 14], [128, 162, 14], [128, 192, 14], [128, 220, 14]];
    for (const [x, u, w] of row) k.house(x, Y(u + 20), w, 12, 8, 'jp', { reserve: false, ramp: C.kawara, wall: R.pick([0xd8ccb0, 0xc8b898]), noren: u % 3 ? 0x2a3a6a : 0xe8d8b0, bay: 4, door: true });
    // the stone-capped walls of their plots
    for (const [x, u, w] of row) k.stoneFace(x, x + w, Y(u) + 1, 2, u, C.granite);
    // a water wheel on the stream, turning
    const wf = [0, 1, 2].map((s) =>
      k.capture(114, Y(178) - 7, 13, 14, () => {
        const X = 120 * S;
        const Yy = (Y(178)) * S;
        for (let a = 0; a < 6.283; a += 0.02) {
          img.px(X + Math.cos(a) * 16, Yy + Math.sin(a) * 16, C.wood[3]);
          img.px(X + Math.cos(a) * 15, Yy + Math.sin(a) * 15, C.wood[1]);
        }
        for (let q = 0; q < 8; q++) {
          const a = (q / 8) * 6.283 + (s / 3) * (6.283 / 8);
          img.linePx(X, Yy, Math.round(X + Math.cos(a) * 15), Math.round(Yy + Math.sin(a) * 15), C.wood[0]);
          img.rectPx(X + Math.cos(a) * 16 - 1, Yy + Math.sin(a) * 16 - 1, 3, 3, C.wood[2]);
        }
      }, 178),
    );
    kit.loop(114, U(Y(178) - 7), wf, { fps: 3 });
    k.tree(109, Y(246), 4.5, LEAF.camphor, 484);
    k.tree(140, Y(150), 4, LEAF.camellia, 485);
    k.walkers([[123, 130], [123, 241]], 5, 180, { sp: 2.6, gap: 40, cols: [0x2a3a6a, 0x3a3a4a, 0x6a2a2a, 0x8a7a5a] });
  }
  // Central Park: a lawn, gravel walks from each corner, a fountain playing in the middle
  {
    const x0 = 103;
    const x1 = 143;
    const u0 = 1008;
    const u1 = 1094;
    const cx = 123;
    const cu = 1051;
    img.fine(x0, Y(u1), x1 - x0, u1 - u0, (X, Yy, x, y) => {
      const u = 7168 - y;
      const dx = x - cx;
      const du = u - cu;
      const r = Math.hypot(dx / 7, du / 7);
      const onWalk = Math.abs(dx) < 1.3 || Math.abs(du) < 1.3 || Math.abs(dx * 0.86 - du * 0.5) < 1.2 || Math.abs(dx * 0.86 + du * 0.5) < 1.2;
      if (r < 1.5 && r > 1) return k.gravelPx(X, Yy);
      if (r <= 1) return r > 0.9 ? C.granite[3] : hashPx(X >> 1, Yy, 486) < 0.12 ? 0xc0dce0 : 0x2a6070;
      if (onWalk) return k.gravelPx(X, Yy);
      if (Math.min(x - x0, x1 - x, u - u0, u1 - u) < 1) return C.granite[2];
      return k.lawnPx(X, Yy, 0.25 + fbm(x, y, { seed: 487, scale: 7, octaves: 2 }) * 0.5, C.lawn);
    });
    k.reserve(x0, Y(u1), x1 - x0, u1 - u0);
    const jet = [0, 1, 2].map((f) => k.sprite(10, 14, cu, (r) => {
      for (let q = 0; q < 34; q++) {
        const a = (q * 2.399 + f) % 6.283;
        const t = (q * 0.137 + f * 0.33) % 1;
        r.px(15 + Math.cos(a) * t * 11, 38 - 34 * t * (2 - t), 0xe8f6fa, 0.82);
      }
      for (let j = 6; j < 40; j++) r.px(15, j, 0xf0fafc, 0.6);
    }, false));
    kit.loop(cx - 5, cu + 12, jet, { fps: 6, fx: 1 });
    for (const [x, u, r, pal] of [[110, 1020, 5, LEAF.camphor], [136, 1020, 5, LEAF.camphor], [110, 1082, 5, LEAF.camphor], [136, 1082, 5, LEAF.camphor], [107, 1051, 4, LEAF.camellia], [139, 1051, 4, LEAF.camellia]]) k.tree(x, Y(u), r, pal, x * 5 + u);
    for (const [x, u] of [[115, 1036], [127, 1036], [115, 1066], [127, 1066]]) k.bench(x, Y(u), 4);
    k.strollers(cx, cu, 14, 28, 7);
  }

  // ------------------------------------------------------------ Tenmonkan
  {
    const { x0, x1, u0, u1 } = ARCADE;
    const lengths = [[u0, 846 - 2], [858 - 2, u1]];
    for (const [a, b] of lengths) {
      // the glass roof the length of the arcade, ribs across it, its ridge, the light under it
      objects.push({
        y: Y(a) + 0.5,
        shadow: () => k.shadowRect(x1, Y(b), 2.5, b - a, 0.6),
        draw: () =>
          img.fine(x0, Y(b), x1 - x0, b - a, (X, Yy, x) => {
            const q = (x - x0) / (x1 - x0);
            if (q < 0.03 || q > 0.97) return q < 0.03 ? 0xd8d8d8 : 0x6a6e76;
            if (Yy % 18 < 2) return 0x8a929a;
            if (Math.abs(q - 0.5) < 0.04) return 0xe8ecf0;
            const lit = q < 0.5 ? 0xcfe0e8 : 0xa4b8c4;
            return (X + (Yy >> 1)) % 21 === 0 ? 0xf0f6fa : hashPx(X >> 2, Yy >> 2, 488) < 0.06 ? 0xffe4b0 : lit;
          }),
      });
      // its gate on the street: a steel frame, the name in lights
      for (const u of [a, b]) {
        objects.push({
          y: Y(u) + 1,
          draw: () => {
            const X = x0 * S - 3;
            const WW = (x1 - x0) * S + 6;
            const Yy = (Y(u) - 8) * S;
            for (let j = 0; j < 27; j++) for (let i = 0; i < WW; i++) if (j < 9 || i < 3 || i >= WW - 3) img.px(X + i, Yy + j, j < 2 ? 0xe8e4dc : j < 9 ? ((i >> 1) % 7 === 0 ? 0xffffff : 0xc83a2a) : 0x6a6e76);
            for (let i = 6; i < WW - 6; i += 6) glowPx(X + i, Yy + 4, 0xfff0c8, 0.9);
          },
        });
        k.reserve(x0 - 1, Y(u) - 1, x1 - x0 + 2, 3);
      }
      k.reserve(x0 - 1, Y(b), x1 - x0 + 2, b - a);
    }
    // people pouring in and out at the gates, parasols up against the ash
    for (const u of [u0 - 8, 846 + 2, 858 - 10, u1 + 3]) k.crowd(x0, Y(u) - 2, x1 - x0, 3, 12);
    // the white bear over the ice-cream shop at the arcade's corner: Shirokuma, the city's own dessert
    objects.push({
      y: Y(612),
      draw: () => {
        const X = 72 * S;
        const Yb = Y(622) * S;
        const white = 0xfafaf4;
        const shade = 0xc8d4dc;
        for (let j = -9; j <= 9; j++) for (let i = -12; i <= 12; i++) if ((i / 12) ** 2 + (j / 9) ** 2 < 1) img.px(X + i, Yb + j, i + j > 8 ? shade : white);
        for (let j = -7; j <= 7; j++) for (let i = -7; i <= 7; i++) if (i * i + j * j < 50) img.px(X + 9 + i, Yb - 7 + j, i + j > 6 ? shade : white);
        for (const i of [4, 14]) for (let j = -2; j <= 2; j++) for (let q = -2; q <= 2; q++) if (j * j + q * q < 6) img.px(X + i + q, Yb - 14 + j, shade);
        img.px(X + 7, Yb - 8, 0x1a1a1e);
        img.px(X + 12, Yb - 8, 0x1a1a1e);
        img.rectPx(X + 8, Yb - 5, 4, 2, 0x1a1a1e);
        // a bowl of shaved ice on its head, with its fruit
        for (let i = -4; i <= 4; i++) img.px(X + 9 + i, Yb - 21, 0xf0f0f0);
        for (let j = 0; j < 4; j++) for (let i = -3 + j; i <= 3 - j; i++) img.px(X + 9 + i, Yb - 22 - j, j > 2 ? 0xe83a4a : j > 1 ? 0xf0c030 : 0xffffff);
      },
    });
  }
  // Yamakataya, the department store: a great pale block, its name across the top, awnings along the street
  office(103, 858, 40, 60, { fh: 24, roofC: 0xa8a49c, wall: 0xe8e0d0, sign: true, vert: false, extra: (by) => {
    const X = 103 * S;
    const Yt = (by - 24) * S;
    for (let i = 0; i < 40 * S; i++) for (let j = 0; j < 7; j++) img.px(X + i, Yt + j + 2, j < 1 || j > 5 ? 0x8a2a2a : (i >> 2) % 3 ? 0xe8e0d0 : 0x8a2a2a);
    for (let i = 0; i < 40 * S; i++) for (let j = 0; j < 6; j++) img.px(X + i, by * S - 15 + j, (i >> 3) % 2 ? 0x2a7a5a : 0xf0ece0);
  } });
  k.crowd(104, Y(858) + 1, 38, 2, 10);

  // ------------------------------------------------------------ Shiroyama, Saigō, Terukuni, the castle's walls
  {
    // Saigō Takamori in army dress, bronze, on his plinth in a small lawn at the corner, the visitors with cameras
    const sx = 12;
    const su = 1060;
    k.lawnFill(1, Y(1094), 21, 36, C.lawn, 490);
    k.reserve(1, Y(1094), 21, 36);
    for (const [x, u] of [[4, 1088], [19, 1088], [4, 1066]]) k.tree(x, Y(u), 3.6, LEAF.camphor, x * 3 + u);
    k.flagFill(5, Y(1076), 14, 16, C.plaza, 491, 12);
    objects.push({
      y: Y(su) + 1,
      shadow: () => k.shadowRect(sx - 3, Y(su) - 3, 9, 4, 0.5),
      draw: () => {
        const X = sx * S;
        const Yb = Y(su) * S;
        for (let j = 0; j < 18; j++) for (let i = -9; i <= 9; i++) img.px(X + i, Yb - j, j < 3 ? C.granite[4] : j > 15 ? C.granite[4] : i > 6 ? C.granite[0] : C.granite[2]);
        for (let j = 18; j < 42; j++) {
          const hw = j > 34 ? 2.6 : j > 26 ? 5 : 4;
          for (let i = -hw; i <= hw; i++) img.px(X + i, Yb - j, i < -1 ? 0x5a7464 : i > 1 ? 0x1e2e26 : 0x38504a);
        }
        img.discPx(X, Yb - 45, 3.4, 0x38504a);
        img.px(X - 1, Yb - 47, 0x5a7464);
      },
    });
    k.crowd(5, Y(1064), 14, 5, 5);
    // the castle's stone walls and moat along the street, on both sides of the road through to the bridge, the forest behind
    const wallU = 1176;
    for (const [a, b] of [[0, 21], [39, 55]]) {
      img.fine(a, Y(wallU + 14), b - a, 14, (X, Yy, x, y) => {
        const u = 7168 - y;
        if (u < wallU + 7) return hashPx(X >> 1, Yy, 492) < 0.06 ? 0x8ab0a0 : rampColor([0x1e3a34, 0x264840, 0x30564c], 0.3 + (u - wallU) * 0.06, X, Yy);
        return null;
      });
      k.stoneFace(a, b, Y(wallU + 14), 7, 493 + a, C.rock);
      k.reserve(a, Y(wallU + 22), b - a, 22);
    }
    // Terukuni Shrine, beside the road under the hill: a stone torii on the road's side, its gravel court, the hall behind
    {
      img.fine(38, Y(wallU + 66), 18, 44, (X, Yy) => k.gravelPx(X, Yy));
      k.reserve(38, Y(wallU + 66), 18, 44);
      k.road([[37, wallU + 34], [42, wallU + 34]], 2, { side: 0, surface: C.gravel, kerb: C.granite[1], piece: true });
      objects.push({
        y: Y(wallU + 30),
        draw: () => {
          const X = 47 * S;
          const Yb = Y(wallU + 30) * S;
          for (const s of [-1, 1]) for (let j = 0; j < 24; j++) for (let i = 0; i < 3; i++) img.px(X + s * 12 + i, Yb - j, i < 1 ? C.granite[4] : C.granite[2]);
          for (let i = -18; i <= 18; i++) {
            for (let j = 0; j < 3; j++) img.px(X + i, Yb - 27 + j, j < 1 ? C.granite[4] : C.granite[2]);
            if (Math.abs(i) < 15) img.px(X + i, Yb - 21, C.granite[1]);
          }
        },
      });
      k.house(39, Y(wallU + 66), 16, 13, 7, 'jp', { ramp: C.copper, wall: 0xf0ece0, door: true, reserve: false, roof: { gable: 'tri', gw: 5 } });
      k.stoneLantern(41, wallU + 40, false);
      k.stoneLantern(53, wallU + 40, false);
      k.strollers(47, wallU + 38, 5, 6, 3);
    }
    // Shiroyama: the old camphor forest, thick and deep
    k.forest(0, 56, 1200, 1302, [LEAF.camphor, LEAF.camellia, LEAF.camphor], 494, 6, 10, (x, u) => Math.abs(x - 30) > 11 && !(x > 37 && u < 1244));
    k.grove(0, 22, 1106, 1160, 9, [LEAF.camphor, LEAF.camellia], 495, 4, 7);
  }

  // ------------------------------------------------------------ the tram depot by the river
  {
    const { x0, x1, u0, u1 } = DEPOT;
    img.fine(x0, Y(u1), x1 - x0, u1 - u0, (X, Yy, x, y) => {
      const e = Math.min(x - x0, x1 - x);
      if (e < 0.6) return 0x5a5a5e;
      return rampColor(C.concrete, 0.1 + fbm(x, y, { seed: 461, scale: 4 }) * 0.32, X, Yy);
    });
    const TRACKS = [78, 88, 98, 108];
    const fan = (i, u) => {
      const from = i < 2 ? 87 : 93;
      const t = Math.max(0, Math.min(1, (u - u0 - 4) / 30));
      return from + (TRACKS[i] - from) * t * t * (3 - 2 * t);
    };
    for (let Yy = Y(u1 - 2) * S; Yy < Y(u0) * S; Yy++) {
      const u = 7168 - Yy / S;
      for (let n = 0; n < 4; n++) {
        const cx = fan(n, u) * S;
        for (let i = -9; i <= 9; i++) {
          let c = rampColor(C.granite, 0.12 + hashPx((cx + i) >> 1, Yy >> 1, 462) * 0.34, cx + i, Yy);
          if (Yy % 9 < 3 && Math.abs(i) < 9) c = 0x5a4a3a;
          if (Math.abs(i) === 6 || Math.abs(i) === 7) c = Math.abs(i) === 6 ? 0xc0c4c8 : 0x3a3a3e;
          img.px(cx + i, Yy, c);
        }
      }
    }
    // the fence along the street, its gate open over the tracks
    for (let X = x0 * S; X < x1 * S; X++) {
      if (X > 81 * S && X < 99 * S) continue;
      for (let j = 0; j < 6; j++) img.px(X, Y(u0 + 2) * S + j, X % 9 < 2 ? 0x3a3a3e : j === 0 ? 0x8a8a90 : (X + j) % 3 ? 0x6a6a70 : 0x4a4a50);
    }
    // the masts and wires over the yard
    for (let u = u0 + 20; u < u1 - 50; u += 24) {
      objects.push({
        y: Y(u),
        draw: () => {
          for (const x of [72, 114]) for (let j = 0; j < 27; j++) img.px(x * S, Y(u) * S - j, 0x2e2e34);
          for (let X = 72 * S; X < 114 * S; X++) img.px(X, Y(u) * S - 26, 0x24262a, 0.75);
        },
      });
    }
    // the shed: four bays of corrugated roof, skylights along each ridge, a door for each track
    const sy = Y(u1 - 4);
    const sh = 50;
    objects.push({
      y: sy + sh + 8,
      shadow: () => k.shadowRect(72, sy + 4, 46, sh + 8, 0.5),
      draw: () => {
        img.fine(70, sy, 46, sh, (X, Yy) => {
          const bay = (X - 70 * S) % 33;
          if (bay < 2) return 0x5a5e66;
          if (Math.abs(bay - 16) < 2 && (Yy >> 3) % 3 < 2) return 0x8ab8d0;
          const c = bay < 16 ? 0xbcc0c6 : 0x969ca4;
          return (X + 1) % 3 === 0 ? scaleColor(c, 0.9) : c;
        });
        img.fine(70, sy + sh, 46, 8, (X, Yy) => {
          const j = Yy - (sy + sh) * S;
          if (j < 2) return 0x3a3a42;
          return (X >> 1) % 5 === 0 ? 0xa8a4a0 : 0xc8c4bc;
        });
        for (const cx of TRACKS) img.rectPx(cx * S - 11, (sy + sh) * S + 3, 22, 21, 0x14141a);
      },
    });
    // the workshop, a yard crane over it, drums and spare trolleys
    office(118, u1 - 40, 21, 34, { fh: 7, roofC: 0x6a4a3a, wall: 0xb8b4ac, sign: false, vert: false });
    for (const [x, u] of [[62, 1190], [66, 1240], [122, 1190], [130, 1216], [62, 1290]]) {
      img.discPx(x * S + 3, Y(u) * S + 3, 7, 0x2a2a2e, 0.5);
      img.discPx(x * S, Y(u) * S, 7, C.wood[1]);
      img.discPx(x * S, Y(u) * S, 3, 0x2a2a2e);
    }
    k.standing(70, Y(1240), 40, 40, 6, 497, [0x3a5a8a, 0x2a3a5a, 0xc86a2a]);
    k.reserve(x0 - 1, Y(u1 + 1), x1 - x0 + 2, u1 - u0 + 2);
    // trams parked in the yard, waiting for the morning (drawn as they stand on their tracks)
    for (const [n, u, body, band] of [[0, u0 + 58, 0xe8e0d0, 0x2a7a5a], [1, u0 + 50, 0xd84a2a, 0xe8e0d0], [3, u0 + 62, 0x2a8a5a, 0xe8e0d0]]) {
      const cx = Math.round(fan(n, u));
      objects.push({
        y: Y(u),
        shadow: () => k.shadowRect(cx - 2, Y(u + 24) + 1, 6, 24, 0.5),
        draw: () =>
          img.fine(cx - 3, Y(u + 24), 6, 24, (X, Yy) => {
            const i = X - (cx - 3) * S;
            const j = Yy - Y(u + 24) * S;
            const e = Math.min(i, 17 - i);
            if (e < 2) return j % 12 === 0 ? scaleColor(band, 0.8) : band;
            if (j < 6) return 0x3a5a7a;
            if (e === 2 && j % 12 < 8) return 0x8aa8c0;
            return j % 3 === 0 ? scaleColor(body, 0.92) : body;
          }),
      });
    }
  }

  // ------------------------------------------------------------ the blocks
  const QUARTERS = [
    [0, 23, 0, 115], [37, 78, 0, 115], [103, 143, 0, 115], [157, W, 0, 115],
    [0, 23, 128, 245], [37, 78, 128, 245], [157, W, 128, 245],
    [0, 23, 258, 423], [37, 78, 258, 423], [103, 143, 258, 330], [157, W, 258, 423],
    [0, 23, 458, 595], [37, 78, 458, 595], [103, 143, 458, 595], [157, W, 458, 595],
    [0, 23, 608, 845], [37, 53, 608, 845], [67, 78, 628, 845], [103, 143, 608, 845], [157, W, 608, 845],
    [0, 23, 858, 1058], [37, 53, 858, 1095], [67, 78, 858, 1095], [103, 143, 920, 1006], [157, W, 858, 1095],
    [37, 78, 1108, 1160], [103, 143, 1108, 1160], [157, W, 1108, 1160],
    [157, W, 1174, 1294],
  ];
  for (const [a, b, c, d] of QUARTERS) quarter(a, b, c, d);
  // people on the pavements, thickest round the avenue, and a few parasols up against the ash
  const PARASOL = [0xe85a8a, 0xf0e8d8, 0x3a6ad0, 0xe8c040];
  for (const [x, w] of [[23, 2], [37, 2], [77, 2], [101, 2], [142, 2], [156, 2]]) {
    for (let u = 16; u < 1160; u += 34 + (x % 7)) {
      if (STREETS.some((s) => Math.abs(u - s) < 9) || (u > VIADUCT[0] - 8 && u < VIADUCT[1] + 8)) continue;
      const n = x === 77 || x === 101 ? 2 : 1;
      k.crowd(x, Y(u), w, 12, n);
      if (hashPx(x, u, 503) < 0.2) {
        const X = (x + 1) * S;
        const Yy = Y(u + 6) * S;
        const c = PARASOL[Math.floor(hashPx(u, x, 504) * 4)];
        objects.push({ y: Y(u + 6) + 1, draw: () => {
          k.personPx(X, Yy, R);
          for (let j = -3; j <= 3; j++) for (let i = -5; i <= 5; i++) if (i * i + j * j * 2 < 26) img.px(X + 2 + i, Yy - 3 + j, (i >> 1) % 2 ? c : scaleColor(c, 0.82));
        } });
      }
    }
  }
  for (const u of [80, 330, 520, 700, 950]) k.walkers([[100, u], [100, u + 90]], 2, u, { sp: 3, gap: 40 });
  // ash bags at every corner, the sweepers' crew, an old lady with a parasol
  for (const u of STREETS) for (const x of [23, 39, 77, 104, 142, 158]) if (!(u === 1166 && x < 60)) ashBags(k, x, Y(u + HW + 3));
  for (const [a, b] of [[4, 110], [4, 240], [160, 300], [160, 500], [4, 700], [160, 900], [160, 1140]]) ashBags(k, a, Y(b), 3);

  // ------------------------------------------------------------ the Kōtsuki and its stone bridges
  {
    const [r0, r1] = RIVER;
    img.fine(0, Y(r1), W, r1 - r0, (X, Yy, x, y) => {
      const u = 7168 - y;
      const bank = Math.min(u - r0, r1 - u);
      if (bank < 3) {
        const XX = X + ((Yy >> 2) % 2) * 5;
        return Yy % 4 === 0 || XX % 10 === 0 ? 0x4e4a44 : rampColor(C.granite, 0.15 + hashPx(XX >> 3, Yy >> 2, 498) * 0.5, X, Yy);
      }
      const c = rampColor([0x1e4a50, 0x28585e, 0x346a6c], 0.3 + fbm(x, y, { seed: 37, scale: 6 }) * 0.5 - (bank < 6 ? 0.2 : 0), X, Yy);
      return fbm(x * 0.5, y * 2, { seed: 499, scale: 3 }) > 0.68 ? 0x8ab4b8 : c;
    });
    k.reserve(0, Y(r1), W, r1 - r0);
    // five arches of Satsuma stone, the deck paved, the water showing dark under each arch along the side
    for (const bx of [30, 150]) {
      objects.push({
        y: Y(r0) + 2,
        shadow: () => k.shadowRect(bx + 7, Y(r1 + 1), 3, r1 - r0 + 2, 0.55),
        draw: () => {
          img.fine(bx - 7, Y(r1 + 3), 14, r1 - r0 + 6, (X, Yy, x) => {
            const a = Math.abs(x - bx);
            if (a > 6.3) return Yy % 9 < 2 ? C.granite[4] : C.granite[1];
            return k.settPx(X, Yy, 500, C.granite);
          });
          for (const s of [-1, 1]) {
            const X = (bx + s * 7) * S;
            for (let q = 0; q < 5; q++) {
              const YC = (Y(r1) + 3 + q * 8.2) * S;
              for (let j = -11; j <= 11; j++) {
                const d = Math.sqrt(Math.max(0, 1 - (j / 11) ** 2)) * 7;
                for (let i = 0; i < d; i++) img.px(X + s * (1 + i), YC + j, i < d - 2 ? 0x12262a : C.granite[3]);
              }
            }
          }
        },
      });
      k.walkers([[bx - 3, r0 - 4], [bx - 3, r1 + 4]], 1, 1320, { sp: 2.4 });
    }
    // willows along the bank, a heron on the weir, a boat on the water
    for (const x of [8, 56, 66, 108, 124, 172]) k.tree(x, Y(r1 + 3), 4.2, [0x3a5a30, 0x4c7038, 0x628844, 0x7c9e52], x + 501);
    const boat = k.hull(14, 5, 1320, 0x4a3a2a, 0xa88a60, (r) => {
      for (let j = 4; j < 11; j++) for (let i = 8; i < 28; i++) r.px(i, j, j === 4 ? 0xc83a2a : 0xe8e4d8);
    });
    kit.path([[-20, 1322], [W + 20, 1324]], [boat], { sp: 5, mode: 'pp', hold: 4, turn: 'rot', d: 0.02 });
  }
  void SENGAN;
}
