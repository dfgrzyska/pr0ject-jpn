// Naha, on the way up to Shuri: a limestone hillside of turtle-back tombs with one family at its Shīmī picnic; Tsuboya's potters' lane,
// its old climbing kiln, workshops, galleries and shisa; Makishi market under its glass roof and the Heiwa-dōri arcade; Kokusai-dōri,
// closed to traffic for an eisa parade, with its shops, palms and flags, a Ryūkyū restaurant and a sanshin band on a stage.
import { S, hashPx, scaleColor, rampColor, rng, fbm, mix } from '../nagasaki/canvas.mjs';
import { W, NAHA, KOKUSAI_RD } from './geo.mjs';
import { C, COATS } from './common.mjs';

const LIME = [0x8a8470, 0xa8a28a, 0xc6c0a6, 0xe0dac4];
const PAVE = [0x8e8676, 0xa69e8c, 0xbcb4a0, 0xd0c8b4];
const SIGNS = [0xd8302a, 0x2a6ac8, 0xf0c030, 0x2a9a5a, 0xe85a8a, 0xf0ece0, 0x8a3a9a];

export function paintNaha(k) {
  const { img, Y, kit, objects } = k;
  const { plant, house, flat, wall, shisa, pot, parked } = k.t;
  const R = rng(1899);
  const pick = (a) => a[Math.floor(R() * a.length)];
  const [n0, n1] = NAHA;
  const TOMBS = [n0, 2690];
  const TSUBOYA = [2690, 2860];
  const MARKET = [2860, 2990];
  const KOKUSAI = [2990, n1];
  const pavePx = (X, Yy) => {
    const yy = Yy + Math.round(fbm(X / 3, 0, { seed: 501, scale: 9 }) * 6);
    const row = Math.floor(yy / 12);
    const xx = X + row * 15 + (row % 3) * 6;
    const col = Math.floor(xx / 21);
    if (yy % 12 < 1 || xx % 21 < 1) return 0x6e685a;
    let c = rampColor(PAVE, 0.32 + ((row * 13 + col * 7) % 5) * 0.09 + hashPx(X >> 2, Yy >> 2, 503) * 0.12, X, Yy);
    if (hashPx(X, Yy, 504) < 0.05) c = scaleColor(c, 0.92);
    return c;
  };

  // ---- the ground: a grassy limestone hillside, the potters' quarter, then the city
  img.fine(0, Y(n1), W, n1 - n0, (X, Yy, x, y) => {
    const u = 7168 - y;
    if (u < TOMBS[1]) {
      const n = fbm(x, y, { seed: 511, scale: 7, octaves: 3 });
      if (n > 0.66) {
        const c = rampColor(LIME, 0.3 + (n - 0.66) * 2 + hashPx(X >> 1, Yy >> 1, 512) * 0.3, X, Yy);
        return hashPx(X, Yy, 513) < 0.08 ? scaleColor(c, 0.74) : c;
      }
      return k.lawnPx(X, Yy, 0.2 + n * 0.8, C.grass, true);
    }
    if (u < TSUBOYA[1]) return rampColor(C.lane, 0.25 + fbm(x, y, { seed: 513, scale: 4 }) * 0.5 + (hashPx(X >> 1, Yy >> 1, 514) - 0.5) * 0.14, X, Yy);
    return k.pavePx(X, Yy, [0x78766e, 0x88867e, 0x98968c]);
  });
  // a farm road and a coral wall where the fields end
  k.road([[-6, n0 + 3], [W + 6, n0 + 3]], 2.4, { side: 0, kerb: C.lane[0], paint: (X, Yy) => rampColor(C.lane, 0.3 + hashPx(X >> 2, Yy, 515) * 0.5, X, Yy) });
  wall([[0, Y(n0 + 8)], [60, Y(n0 + 8)]]);
  wall([[76, Y(n0 + 8)], [W, Y(n0 + 8)]]);

  // ---- 1. the hillside of turtle-back tombs (kamekōbaka)
  const tomb = (cx, by, w, opt = {}) => {
    const st = opt.old ? [0x55524a, 0x726e62, 0x928c7e, 0xb0aa98] : [0x948e80, 0xb4ae9e, 0xd0caba, 0xe6e0d0];
    const rx = Math.round(w * 0.42);
    const ry = Math.max(5, Math.round(rx * 0.55));
    const fy = by - 11;
    const ftop = fy - 5;
    const seed = Math.floor(R() * 1000);
    const fam = opt.shiimi ? Array.from({ length: 8 }, () => [pick(COATS), R()]) : null;
    objects.push({
      y: by,
      shadow: () => {
        k.shadowRect(cx - rx + 4, ftop - ry + 3, rx * 2 + 3, ry + 4, 0.6);
        k.shadowRect(cx + rx + 2, ftop + 1, 4, by - ftop, 0.6);
      },
      draw: () => {
        // the forecourt between the curving wing walls, widening to the front, laid with flat stones
        img.fine(cx - w / 2 - 3, fy, w + 6, by - fy + 2, (X, Yy, x, y) => {
          const f = (y - fy) / (by - fy);
          if (f < 0 || f > 1.05) return null;
          const hw = rx + 1 + Math.pow(Math.min(1, f), 0.6) * (w / 2 - rx - 1);
          const a = Math.abs(x - cx);
          if (a > hw + 1.6) return null;
          if (a > hw + 0.9) return x > cx ? st[0] : st[1];
          if (a > hw) return st[3];
          const joint = Yy % 12 < 1 || (X + (Yy >> 3) * 9) % 18 < 1;
          return joint ? st[1] : rampColor(st, 0.42 + hashPx((X + (Yy >> 3) * 9) >> 4, Yy >> 3, 520 + seed) * 0.3, X, Yy);
        });
        // the facade: courses of cut stone, the door sealed with a slab under its lintel
        img.fine(cx - rx - 2, ftop, rx * 2 + 5, fy - ftop + 1, (X, Yy, x, y) => {
          const j = Yy - ftop * S;
          if (j < 3) return st[3];
          const joint = j % 6 < 1 || (X + (j >> 3) * 9) % 15 < 1;
          if (x > cx + rx + 1.5) return st[1];
          return joint ? st[1] : st[2];
        });
        const CX = cx * S;
        const FY = fy * S;
        for (let i = -9; i <= 9; i++) for (let j = 0; j < 3; j++) img.px(CX + i, FY - 13 + j, st[3]);
        for (let j = 0; j < 13; j++) for (let i = -7; i <= 7; i++) img.px(CX + i, FY - 10 + j, Math.abs(i) > 5 ? st[0] : st[1]);
        // the shell: a low dome of stone courses, lit from the top left, spotted with lichen, streaked by rain
        img.fine(cx - rx - 1, ftop - ry - 1, rx * 2 + 2, ry + 2, (X, Yy, x, y) => {
          const nx = (x - cx) / rx;
          const ny = (y - ftop) / ry;
          const d = nx * nx + ny * ny;
          if (d > 1 || ny > 0) return null;
          const rd = Math.sqrt(d);
          let v = 0.5 - nx * 0.3 - ny * 0.15 + Math.sqrt(1 - d) * 0.25 + (fbm(x, y, { seed: 530 + seed, scale: 3 }) - 0.5) * 0.25;
          if (Math.abs(rd - 0.42) < 0.05 || Math.abs(rd - 0.76) < 0.04) v -= 0.22;
          let c = rampColor(st, v, X, Yy);
          if (fbm(x, y, { seed: 540 + seed, scale: 2 }) > (opt.old ? 0.64 : 0.78)) c = opt.old ? 0x4a5636 : 0x8a9478;
          if ((X * 7 + seed) % 37 === 0 && ny > -0.5) c = scaleColor(c, 0.85);
          return c;
        });
        if (opt.flowers || opt.shiimi) {
          for (const s of [-1, 1]) {
            const VX = (cx + s * (rx - 2)) * S;
            const VY = (fy + 3) * S;
            for (let j = 0; j < 5; j++) for (let i = -1; i <= 1; i++) img.px(VX + i, VY + j, st[0]);
            img.discPx(VX, VY - 2, 3, 0x3a7a2a);
            for (let q = 0; q < 5; q++) img.px(VX - 2 + q, VY - 3 + (q % 2) * 2, 0xf0e8b8);
          }
          for (let j = 0; j < 6; j++) for (let i = -3; i <= 3; i++) img.px(CX + i, (fy + 2) * S + j, j < 2 ? 0x9a8a78 : 0x4a3a2a);
        }
        if (fam) {
          // Shīmī: the family picnicking on a mat in the forecourt, lacquered boxes of food between them
          const MY = (fy + 5) * S;
          for (let j = 0; j < 15; j++) for (let i = -24; i < 24; i++) img.px(CX + i, MY + j, ((i + 40) >> 3) % 2 === (j >> 3) % 2 ? 0xc83a3a : 0x3a5aa8);
          for (const q of [-15, -3, 9]) {
            for (let j = 0; j < 9; j++) for (let i = 0; i < 9; i++) img.px(CX + q + i, MY + 3 + j, j < 1 || i < 1 ? 0xb8302a : 0x1a1214);
            for (let n = 0; n < 8; n++) img.rectPx(CX + q + 1 + hashPx(n, q + 40, 521) * 6, MY + 4 + hashPx(n, q + 40, 522) * 6, 2, 2, [0xe8c040, 0xe86a2a, 0x5ab040, 0xf0e8e0][n % 4]);
          }
          fam.forEach(([c, r], i) => {
            const a = (i / fam.length) * 6.283 + r * 0.4;
            k.personPx(CX + Math.cos(a) * 31, MY + 6 + Math.sin(a) * 12 - 4, R, { coat: c });
          });
        }
      },
    });
    k.reserve(cx - w / 2 - 3, ftop - ry - 2, w + 7, by - (ftop - ry) + 4);
  };
  const stair = (u) => 66 + 7 * Math.sin((u - n0) / 16);
  const SP = [];
  for (let u = n0 + 8; u <= TOMBS[1] + 2; u += 4) SP.push([stair(u), u]);
  for (let q = 0; q < SP.length - 1; q += 12) k.road(SP.slice(q, q + 14), 2.2, { side: 0, kerb: LIME[0], piece: true, paint: (X, Yy) => (Yy % 9 < 2 ? LIME[0] : hashPx(X >> 2, Yy >> 3, 516) < 0.5 ? LIME[2] : LIME[1]) });
  // the path on over to the potters' lane
  k.road([[stair(TOMBS[1] + 2), TOMBS[1] + 2], [96, TOMBS[1] + 2]], 2.2, { side: 0, kerb: LIME[0], piece: true, paint: (X, Yy) => (hashPx(X >> 2, Yy >> 2, 517) < 0.5 ? LIME[2] : LIME[1]) });
  k.walkers(SP.filter((_, i) => i % 5 === 0), 3, 2620, { sp: 2.4, gap: 40 });
  for (const [tu, list] of [
    [2604, [[28, 34, { old: true }], [112, 30, { flowers: true }], [158, 32, { shiimi: true }]]],
    [2658, [[34, 30, { flowers: true }], [100, 36, { old: true }], [150, 28, {}]]],
  ]) {
    wall([[0, Y(tu - 3)], [56, Y(tu - 3)]]);
    wall([[76, Y(tu - 3)], [W, Y(tu - 3)]]);
    for (const [x, w, opt] of list) if (!k.anyRes(x - w / 2, Y(tu) - 26, w, 26)) tomb(x, Y(tu), w, opt);
  }
  for (let q = 0; q < 34; q++) {
    const x = 4 + R() * 172;
    const u = n0 + 12 + R() * (TOMBS[1] - n0 - 16);
    if (k.anyRes(x - 4, Y(u) - 4, 8, 8)) continue;
    const kind = R() < 0.4 ? 'palm' : R() < 0.5 ? 'hibiscus' : 'tropic';
    plant(kind, x, Y(u), kind === 'palm' ? 3.5 : kind === 'hibiscus' ? 3 : 6 + R() * 3, q + 2650);
  }

  // ---- 2. Tsuboya: the potters' lane and the old climbing kiln
  const lane = (u) => 96 + 8 * Math.sin((u - TSUBOYA[0]) / 40);
  const LP = [];
  for (let u = TSUBOYA[0] - 2; u <= TSUBOYA[1] + 8; u += 8) LP.push([lane(u), u]);
  for (let q = 0; q < LP.length - 1; q += 12) k.road(LP.slice(q, q + 14), 6.4, { side: 0, kerb: 0x7a7466, piece: true, paint: pavePx });
  // where the turret stands, the lane opens into a little paved square
  img.fine(76, Y(2756), 34, 32, (X, Yy, x, y) => (((x - 92) / 17) ** 2 + ((y - Y(2740)) / 15) ** 2 < 1 ? pavePx(X, Yy) : null));
  k.reserve(76, Y(2756), 34, 32);
  // the climbing kiln: a sandy work yard, the vaulted chambers stepping up the hill, stoking ports, the shelter's posts, firebox and flue
  {
    const x0 = 6;
    const u0 = 2772;
    img.fine(x0, Y(u0 + 96), 56, 96, (X, Yy, x, y) => {
      const c = rampColor(C.sand, 0.15 + fbm(x, y, { seed: 2780, scale: 4 }) * 0.5, X, Yy);
      return hashPx(X, Yy, 2781) < 0.05 ? scaleColor(c, 0.84) : c;
    });
    k.reserve(x0, Y(u0 + 96), 56, 96);
    const kx = 22;
    const kw = 22;
    const ch = 9;
    const n = 8;
    const top = Y(u0 + 8 + n * ch);
    objects.push({
      y: Y(u0 + 8),
      shadow: () => k.shadowRect(kx + 3, top + 3, kw, n * ch + 2, 0.5),
      draw: () => {
        for (let q = 0; q < n; q++) {
          const cy = top + q * ch;
          img.fine(kx, cy, kw, ch, (X, Yy, x, y) => {
            const nx = (x - kx - kw / 2) / (kw / 2);
            const j = y - cy;
            // a brick barrel-vault, lit on the left, soot-streaked, its joints
            const v = 0.62 - nx * 0.32 - (j / ch) * 0.24 + (hashPx(X >> 2, Yy >> 1, 2782) - 0.5) * 0.2;
            let c = rampColor([0x4e2a1c, 0x6e3e28, 0x8e5232, 0xaa6a44], v, X, Yy);
            if (Yy % 6 === 0 || (X + ((Yy >> 2) % 2) * 6) % 12 === 0) c = scaleColor(c, 0.7);
            if (j > ch - 1) return 0x241410; // the step down to the next
            if (Math.abs(nx) < 0.1 && j > 3 && j < 7) return 0x1a1210;
            return c;
          });
          // the stoking ports along the sides, the shelter's posts
          for (const s of [kx - 1, kx + kw]) {
            img.rectPx(s * S, (cy + 3) * S, 3, 9, 0x241410);
            img.rectPx(s * S + (s < 30 ? -3 : 3), cy * S, 3, 3, C.wood[1]);
          }
        }
        // the firebox's arched mouth, black with soot, ash raked out before it
        const FX = (kx + kw / 2) * S;
        const FY = (top + n * ch) * S;
        for (let j = 0; j < 12; j++) for (let i = -12; i <= 12; i++) if ((i / 12) ** 2 + ((j - 12) / 12) ** 2 < 1) img.px(FX + i, FY + j, 0x0e0a08);
        for (let q = 0; q < 40; q++) img.px(FX + (hashPx(q, 1, 2783) - 0.5) * 42, FY + 12 + hashPx(q, 2, 2783) * 12, 0x8a847a);
        // the flue
        for (let j = 0; j < 12; j++) for (let i = -9; i <= 9; i++) img.px(FX + i, top * S - j, i < -6 ? 0x8e5232 : i > 6 ? 0x3a2418 : 0x5e3424);
        for (let i = -6; i <= 6; i++) for (let j = 12; j < 15; j++) img.px(FX + i, top * S - j, 0x0e0a08);
      },
    });
    // stacks of firewood, boards of unfired pots drying in the sun, a potter at work
    for (const [x, u] of [[8, 2790], [8, 2812], [48, 2790]]) {
      const X = x * S;
      const Yy = Y(u) * S;
      for (let j = 0; j < 18; j++) for (let i = 0; i < 24; i++) {
        const lx = i % 6;
        const ly = j % 6;
        img.px(X + i, Yy + j, (lx - 2.5) ** 2 + (ly - 2.5) ** 2 < 5 ? (hashPx(i >> 2, j >> 2, 2784) < 0.5 ? 0xc8a878 : 0xb09060) : 0x3a2a1c);
      }
    }
    for (const [x, u] of [[48, 2830], [48, 2846], [48, 2810]]) {
      const X = x * S;
      const Yy = Y(u) * S;
      for (let i = 0; i < 36; i++) for (let j = 0; j < 3; j++) img.px(X + i, Yy + 7 + j, j ? C.wood[1] : C.wood[3]);
      for (let q = 0; q < 6; q++) {
        img.discPx(X + 3 + q * 6, Yy + 4, 3, 0xb89878);
        img.px(X + 2 + q * 6, Yy + 2, 0xd8bc9a);
      }
    }
    k.standing(10, Y(2850), 8, 30, 2, 2785, [0x3a4a5a, 0x5a4a3a]);
    kit.wander(50, 2790, 8, 10, [k.walker(0x3a4a5a, 0, 2800), k.walker(0x3a4a5a, 1, 2800)], { n: 1, sp: 2, idle: 0.7, turn: 'flip', fps: 3, d: 0.45 });
    // smoke seeping from the kiln's top: it's firing
    kit.emit(kx + kw / 2, u0 + 8 + n * ch + 6, [6, 9, 12, 15].map((r) => [0, 1].map((v) => kit.frame(k.puff(r, r * 7 + v + 91, [0x8a8a90, 0xa8a8b0, 0xc8c8cc, 0xe8e8ea])))), { rate: 0.7, life: [3, 4], vy: 7, sx: 1, wf: 1, a: 0.42, d: 1 });
  }
  // the workshops and galleries either side of the lane, a coral wall with a gate and a shisa on each gatepost, pots out in the yard
  const atelier = (x, u, w, gallery) => {
    const h = 34;
    if (k.anyRes(x, Y(u + h), w, h)) return;
    img.fine(x, Y(u + 14), w, 14, (X, Yy) => rampColor(C.lane, 0.15 + hashPx(X >> 2, Yy >> 2, 2786) * 0.4, X, Yy));
    if (gallery) flat(x + 1, Y(u + 32), w - 2, 13, 5, { wall: 0xf4f0e6, reserve: false });
    else house(x + 1, Y(u + 32), w - 2, 13, { faceH: 5, reserve: false });
    k.reserve(x, Y(u + h), w, h);
    const gate = x + Math.round(w / 2);
    wall([[x, Y(u + 2)], [gate - 3, Y(u + 2)]]);
    wall([[gate + 3, Y(u + 2)], [x + w, Y(u + 2)]]);
    objects.push({
      y: Y(u + 2) + 2,
      draw: () => {
        shisa((gate - 3) * S, (Y(u + 2) + 1) * S, false);
        shisa((gate + 3) * S, (Y(u + 2) + 1) * S, true);
      },
    });
    const g = rng(x * 7 + u);
    for (let q = 0; q < 16; q++) pot((x + 2 + g() * (w - 4)) * S, Y(u + 5 + g() * 9) * S, Math.floor(g() * 40));
  };
  for (const [xs, us] of [[[58], [2700, 2738, 2780, 2820]], [[114, 146], [2700, 2738, 2780, 2820]]])
    for (const x of xs)
      for (const u of us) {
        const w = x === 58 ? 24 : 28;
        atelier(x + (u % 3), u, w, (x + u) % 3 === 0);
      }
  // along the lane: pots stacked at its edges, browsers, cats, banyans with hanging roots
  for (let u = TSUBOYA[0] + 4; u < TSUBOYA[1]; u += 4) {
    const cx = lane(u);
    for (const s of [-1, 1]) if (hashPx(u, s + 3, 2787) < 0.6) pot((cx + s * 5.4) * S, Y(u) * S, Math.floor(hashPx(u, s + 5, 2788) * 40));
  }
  const LP2 = LP.filter((_, i) => i % 3 === 0);
  k.walkers(LP2, 6, 2780, { sp: 2.4, gap: 34 });
  k.crowd(82, Y(2750), 22, 8, 9);
  const cat = (c, f) => k.sprite(4, 3, 2780, (r) => {
    for (let i = 1; i < 8; i++) for (let j = 3; j < 6; j++) r.px(i, j, c);
    r.discPx(9, 3, 1.6, c);
    r.px(0, 3 - f, c);
    r.px(2 + f, 6, c);
    r.px(6 - f, 6, c);
  });
  kit.wander(lane(2720), 2720, 5, 12, [cat(0xe8a040, 0), cat(0xe8a040, 1)], { n: 1, sp: 1.6, idle: 0.8, turn: 'flip', fps: 2, d: 0.45 });
  kit.wander(lane(2810), 2810, 5, 14, [cat(0x3a3a40, 0), cat(0x3a3a40, 1)], { n: 1, sp: 1.6, idle: 0.8, turn: 'flip', fps: 2, d: 0.45 });

  // ---- 3. the Makishi public market and the Heiwa-dōri arcade
  const AR = [84, 100]; // the arcade's width
  img.fine(AR[0] - 8, Y(MARKET[1]), AR[1] - AR[0] + 16, MARKET[1] - MARKET[0] - 6, (X, Yy) => pavePx(X, Yy));
  img.fine(62, Y(2978), 24, 26, (X, Yy, x, y) => (((x - 74) / 12) ** 2 + ((y - Y(2965)) / 13) ** 2 < 1 ? pavePx(X, Yy) : null));
  // the shops down both sides of the arcade, their goods spilling out: colour and more colour
  for (const [a, b, s] of [[AR[0] - 8, AR[0] - 1, -1], [AR[1] + 1, AR[1] + 8, 1]])
    for (let u = MARKET[0] + 6; u < MARKET[1] - 8; ) {
      const h = 7 + Math.floor(R() * 7);
      if (!k.anyRes(a, Y(u + h), b - a, h)) {
        const c = pick(SIGNS);
        img.fine(a, Y(u + h), b - a, h - 0.5, (X, Yy, x, y) => {
          const q = s < 0 ? b - x : x - a;
          if (q < 2.2) {
            const v = hashPx(X >> 1, Yy >> 1, 2861);
            return v < 0.4 ? pick2(v) : v < 0.8 ? c : scaleColor(c, 0.7);
          }
          if (q < 3) return 0x2a2a30;
          return (Yy >> 2) % 2 ? scaleColor(c, 1.1) : c;
        });
      }
      u += h + 0.5;
    }
  function pick2(v) {
    return [0xf0ece0, 0xf0c030, 0xe85a8a, 0x2a9a5a, 0xd8302a, 0x2a6ac8][Math.floor(v * 15) % 6];
  }
  k.crowd(AR[0] + 1, Y(MARKET[1] - 2), AR[1] - AR[0] - 2, MARKET[1] - MARKET[0] - 8, 110);
  k.reserve(AR[0] - 8, Y(MARKET[1]), AR[1] - AR[0] + 16, MARKET[1] - MARKET[0] - 6);
  // the arcade's roof: translucent panels on ribs, the shoppers and the light showing through
  objects.push({
    y: Y(MARKET[0]) + 2,
    draw: () =>
      img.fine(AR[0], Y(MARKET[1] - 2), AR[1] - AR[0], MARKET[1] - MARKET[0] - 6, (X, Yy, x) => {
        if (x < AR[0] + 0.5 || x > AR[1] - 0.5) return x < 90 ? 0xd8d8d8 : 0x6a6e76;
        if (Yy % 24 < 2) return 0x8a929a;
        if (Math.abs(x - (AR[0] + AR[1]) / 2) < 0.5) return 0xe8ecf0;
        return [x < (AR[0] + AR[1]) / 2 ? 0xdcecf0 : 0xc0d4dc, 0.54];
      }),
  });
  // the shoppers' shimmer through the roof, from place to place
  const shimmer = [0, 1].map((f) => k.sprite(16, 16, 2900, (r) => {
    for (let q = 0; q < 16; q++) r.discPx(hashPx(q, f, 2862) * 48, hashPx(q, f + 2, 2862) * 48, 1.6, [0xd04040, 0x3a6ad0, 0xe8c040, 0x3a3a4a][q % 4], 0.5);
  }));
  for (let u = MARKET[0] + 24; u < MARKET[1] - 6; u += 18) kit.loop(AR[0] + 0.5, u, shimmer, { fps: 2, ph: u * 0.1 });
  // the market hall east of the arcade: its glass roof over stalls of tropical fish on ice, lobsters, sea grapes, fruit; the entrance
  {
    const x0 = 112;
    const x1 = 172;
    const u0 = 2876;
    const u1 = 2984;
    const stall = (x, y) => {
      if (Math.floor(x / 4) % 3 === 2) return 0x9a9e9c; // the aisle
      const v = hashPx(Math.floor(x / 8), Math.floor(y / 5), 2863);
      const fy = y % 5;
      if (fy < 0.5) return 0x6a6e74;
      if (v < 0.4) {
        // fish on ice: blue, red, parrot-green
        const f = hashPx(Math.floor(x * 1.4), Math.floor(y * 3), 2864);
        return f < 0.34 ? 0xe8f4f8 : f < 0.55 ? 0x2a7ac8 : f < 0.75 ? 0xd84a3a : f < 0.9 ? 0x2ab08a : 0xf0c030;
      }
      if (v < 0.7) return hashPx(Math.floor(x * 2), Math.floor(y * 2), 2865) < 0.5 ? 0x5a9a3a : 0xf0a030;
      return hashPx(Math.floor(x * 2), Math.floor(y * 3), 2866) < 0.4 ? 0xe86a2a : 0x8a2a3a;
    };
    objects.push({
      y: Y(u0) + 1,
      shadow: () => k.shadowRect(x0 + 3, Y(u1) + 3, x1 - x0, u1 - u0, 0.5),
      draw: () => {
        img.fine(x0, Y(u1), x1 - x0, u1 - u0, (X, Yy, x, y) => {
          const e = Math.min(x - x0, x1 - x, y - Y(u1), Y(u0) - y);
          if (e < 0.7) return x - x0 < 0.7 || y - Y(u1) < 0.7 ? 0xe8ecf0 : 0x6a6e76;
          if (X % 36 < 2 || Yy % 36 < 2) return 0x7a8288;
          // the stalls showing through the glass, greenish, with the sky's glare in streaks
          const q = mix(stall(x, y), 0xcfe6e0, 0.84);
          return (X + (Yy >> 1)) % 72 < 2 ? scaleColor(q, 1.12) : q;
        });
        // the front: a band of signs, the doors standing open, people
        const X0 = x0 * S;
        const FY = Y(u0) * S;
        for (let j = 0; j < 15; j++)
          for (let i = 0; i < (x1 - x0) * S; i++) {
            let c = j < 5 ? ((i >> 3) % 2 ? 0xd8302a : 0xf0ece0) : (i % 27 < 21 ? 0x14141a : 0x8a8e94);
            if (j >= 5 && i % 27 < 21 && hashPx(i >> 2, j >> 2, 2867) < 0.3) c = pick2(hashPx(i, j, 2868));
            img.px(X0 + i, FY + j, c);
          }
      },
    });
    k.reserve(x0 - 1, Y(u1) - 1, x1 - x0 + 2, u1 - u0 + 8);
    k.crowd(x0 + 6, Y(u0) + 6, x1 - x0 - 12, 4, 18);
  }
  // west of the arcade: souvenir shops, a sanshin maker, a sata andagi stall, palms on the little square
  const shop = (x, y, w, rh, fh, opt = {}) => {
    const c = opt.c ?? pick(SIGNS);
    const seed = Math.floor(R() * 1e6);
    const vert = R() < 0.5;
    objects.push({
      y: y + rh + fh,
      shadow: () => k.shadowRect(x + 2.4, y + 3, w, rh + fh, 0.5),
      draw: () => {
        img.fine(x, y, w, rh, (X, Yy, xx, yy) => {
          const e = Math.min(xx - x, x + w - xx, yy - y, y + rh - yy);
          if (e < 0.34) return yy - y < 0.5 || xx - x < 0.5 ? 0xe8e6de : 0x7a7870;
          const q = rampColor([0x9c9a90, 0xa8a69c, 0xb0aea4], 0.3 + hashPx(X >> 5, Yy >> 5, seed) * 0.4, X, Yy);
          return q;
        });
        const g = rng(seed);
        if (g() < 0.5) {
          // the billboard along the back of the roof
          for (let j = 0; j < 12; j++) for (let i = 3; i < w * S - 3; i++) img.px(x * S + i, y * S + 2 + j, j < 1 || j > 10 ? 0x24242a : hashPx(i >> 1, j >> 1, seed) < 0.3 ? 0xfffff0 : c);
        } else {
          for (let q = 0; q < 2; q++) {
            const CX = (x + 4 + q * 4) * S;
            const CY = (y + rh - 3) * S;
            img.discPx(CX, CY, 4, 0x18181e);
            img.discPx(CX - 1, CY - 1, 2, 0x4a4a56);
          }
        }
        if (w > 12 && g() < 0.8) {
          const PX = (x + w - 6) * S;
          const PY = (y + rh - 7) * S;
          for (let j = 0; j < 15; j++) for (let i = 0; i < 12; i++) img.px(PX + i, PY + j, j < 2 ? 0xe8e6de : j > 9 ? (i > 3 && i < 9 ? 0x3a3a42 : 0x8a887f) : i > 9 ? 0x8a887f : 0xb8b6ac);
        }
        for (let q = 0; q < 2 + Math.floor(g() * 3); q++) {
          const PX = (x + 2 + g() * (w - 6)) * S;
          const PY = (y + 3 + g() * (rh - 6)) * S;
          for (let j = 0; j < 6; j++) for (let i = 0; i < 9; i++) img.px(PX + i, PY + j, j < 1 ? 0xf0eee6 : (i - 4) ** 2 + (j - 3) ** 2 < 6 ? 0x4a4e54 : 0xb8bab4);
          for (let i = 0; i < 9; i++) img.tintPx(PX + i + 1, PY + 6, 0.7);
        }
        if (g() < 0.25) {
          const PX = (x + 2) * S;
          const PY = (y + rh - 5) * S;
          for (let j = 0; j < 9; j++) for (let i = 0; i < (w - 8) * S; i++) img.px(PX + i, PY + j, j < 1 || j > 7 ? 0x8a887f : hashPx(i >> 1, j >> 1, seed) < 0.6 ? 0x4e7c30 : 0x3a6628);
        }
        const FY = (y + rh) * S;
        const FH = fh * S;
        const WW = w * S;
        for (let j = 0; j < FH; j++)
          for (let i = 0; i < WW; i++) {
            let cc = opt.wall ?? 0xd8d4c8;
            const base = FH - j;
            if (j < 2) cc = 0x4a4a52;
            else if (base <= 15) {
              // the shop front: an awning, the goods, the dark door
              if (base > 11) cc = (i >> 2) % 2 ? c : 0xf0ece0;
              else if (i > WW / 2 - 6 && i < WW / 2 + 6) cc = 0x1a1a22;
              else cc = hashPx(i >> 2, j >> 2, seed + 1) < 0.4 ? pick2(hashPx(i >> 2, j >> 2, seed + 2)) : 0x4a5a6a;
            } else if ((j - 2) % 12 < 2) cc = scaleColor(opt.wall ?? 0xd8d4c8, 0.82);
            else if (i % 15 > 2 && i % 15 < 12 && (j - 2) % 12 > 3 && (j - 2) % 12 < 10) cc = hashPx(i >> 3, j >> 3, seed + 3) < 0.3 ? 0x8ab0c8 : 0x3a4a5a;
            if (i >= WW - 2) cc = scaleColor(cc, 0.74);
            img.px(x * S + i, FY + j, cc);
          }
        if (vert && fh > 8) {
          const c2 = pick2(hashPx(x, y, seed + 4));
          for (let j = 2; j < FH - 15; j++) for (let i = 0; i < 7; i++) img.px(x * S + WW - 8 + i, FY + j, i === 0 || i === 6 ? 0x24242a : hashPx(i >> 1, j >> 2, seed) < 0.5 && j % 7 < 5 ? 0xfffff0 : c2);
        }
        if (hashPx(x, y, seed + 5) < 0.34) {
          for (let i = -2; i < WW + 2; i++) for (let j = 0; j < 7; j++) img.px(x * S + i, FY + FH - 22 + j, j === 6 ? 0x4a2418 : (i >> 2) % 2 ? C.tile[1] : C.tile[2]);
          shisa(x * S + (WW >> 1) - 9, FY + FH - 1, false);
          shisa(x * S + (WW >> 1) + 9, FY + FH - 1, true);
        }
        opt.extra?.();
      },
    });
    k.reserve(x - 1, y - 1, w + 2, rh + fh + 2);
  };
  const row = (x0, x1, u0, u1) => {
    for (let u = u0; u < u1 - 16; ) {
      const rh = 11 + Math.floor(R() * 6);
      const fh0 = 10 + Math.floor(R() * 7);
      for (let x = x0 + Math.floor(R() * 3); x < x1 - 11; ) {
        const w = Math.min(x1 - x, 14 + Math.floor(R() * 13));
        const fh = R() < 0.2 ? fh0 + 5 : fh0;
        if (w >= 11 && !k.anyRes(x, Y(u + rh + fh0), w, rh + fh0 + 2)) shop(x, Y(u + rh + fh0), w - 1, rh - (fh - fh0), fh, { wall: pick([0xd8d4c8, 0xe4dccc, 0xc8ccd0, 0xd8c8b0, 0xb8c8c8]) });
        x += w + 1;
      }
      u += rh + fh0 + 3;
    }
  };
  row(2, 62, MARKET[0] + 6, MARKET[1] - 8);
  row(174, W, MARKET[0] + 6, MARKET[1] - 8);
  for (const [x, u] of [[64, 2880], [62, 2940], [108, 2875]]) plant('palm', x, Y(u), 4.6, x + u);
  plant('tropic', 68, Y(2910), 9, 2869);
  k.crowd(64, Y(2972), 20, 18, 12);
  k.reserve(62, Y(2978), 24, 26);

  // ---- 4. Kokusai-dōri: closed for an eisa parade
  const [r0, r1] = KOKUSAI_RD;
  k.road([[(r0 + r1) / 2, KOKUSAI[0]], [(r0 + r1) / 2, n1]], (r1 - r0) / 2, { side: 8, lanes: true, pave: [0xa89880, 0xb8a890, 0xc8b8a0], piece: true });
  const CROSS = [KOKUSAI[0] + 6, 3094, n1 - 8];
  for (const cu of CROSS) {
    k.road([[-6, cu], [W + 6, cu]], 4.4, { side: 1, lanes: true, pave: [0xa89880, 0xb8a890, 0xc8b8a0] });
    img.fine(r0 - 8, Y(cu + 4), r1 - r0 + 16, 8, (X, Yy) => k.asphaltPx(X, Yy));
    for (const s of [-1, 1]) k.zebraH(r0 + 1, r1 - 1, cu + s * 7 - (s < 0 ? 2 : 0));
    for (const zx of [r0 - 7, r1 + 4]) k.zebraV(zx, cu - 3, cu + 3);
  }
  // a Ryūkyū-style restaurant: a big red-tile house round a courtyard garden with stone lanterns
  {
    const x = 6;
    const u = 3104;
    img.fine(x, Y(u + 40), 60, 40, (X, Yy, xx, yy) => k.lawnPx(X, Yy, 0.3 + fbm(xx, yy, { seed: 541, scale: 4 }) * 0.5, C.grass));
    wall([[x, Y(u + 40)], [x + 60, Y(u + 40)], [x + 60, Y(u)], [x + 32, Y(u)]]);
    wall([[x + 26, Y(u)], [x, Y(u)], [x, Y(u + 40)]]);
    house(x + 4, Y(u + 36), 36, 16, { faceH: 5, reserve: false });
    house(x + 42, Y(u + 30), 14, 12, { faceH: 4, reserve: false });
    for (const [sx, su] of [[x + 10, u + 10], [x + 30, u + 8]]) k.stoneLantern(sx, su, false);
    plant('hibiscus', x + 48, Y(u + 8), 3.5, 3010);
    plant('palm', x + 20, Y(u + 6), 4, 3011);
    objects.push({
      y: Y(u) + 2,
      draw: () => {
        shisa((x + 26) * S, (Y(u) + 1) * S, false);
        shisa((x + 32) * S, (Y(u) + 1) * S, true);
      },
    });
    k.reserve(x - 1, Y(u + 41), 63, 43);
  }
  // an event square across the street: a little stage under its awning, a crowd watching a sanshin band
  {
    const x = 114;
    const u = 3104;
    img.fine(x, Y(u + 34), 62, 34, (X, Yy) => ((X >> 3) + (Yy >> 3)) % 2 ? 0xc8b8a0 : 0xb8a890);
    const X = (x + 20) * S;
    const Yy = Y(u + 32) * S;
    for (let j = 0; j < 24; j++) for (let i = 0; i < 66; i++) img.px(X + i, Yy + j, j < 2 ? 0x8a6a4a : j > 21 ? 0x3a2418 : (j >> 2) % 2 ? 0x5a3a24 : 0x6a4a2e);
    for (let q = 0; q < 4; q++) {
      k.personPx(X + 8 + q * 15, Yy + 8, R, { coat: 0xf0ece0, cap: 0x2a2026 });
      img.linePx(X + 12 + q * 15, Yy + 9, X + 18 + q * 15, Yy + 4, 0x1a1214);
    }
    k.crowd(x + 4, Y(u + 22), 54, 18, 70);
    plant('palm', x + 6, Y(u + 30), 4.5, 3012);
    plant('palm', x + 56, Y(u + 30), 4.5, 3013);
    k.reserve(x - 1, Y(u + 35), 64, 37);
  }
  for (const [x0, x1] of [[0, r0 - 9], [r1 + 9, W]])
    for (const [u0, u1] of [[KOKUSAI[0] + 12, 3088], [3100, n1 - 14]]) row(x0, x1, u0, u1);
  // parked at the side streets' kerbs
  for (const [x, cu, c] of [[10, CROSS[1], 0xe8e8ec], [30, CROSS[1], 0x3a609c], [130, CROSS[1], 0xc43a30], [160, CROSS[1], 0x2c3038], [20, CROSS[0], 0x9aa2aa], [150, CROSS[0], 0xe8d69c]]) parked(x, Y(cu) + 2, c);
  // palms along the pavements, the crowds lining the street
  for (let u = KOKUSAI[0] + 16; u < n1 - 12; u += 22) {
    if (Math.abs(u - 3094) < 10) continue;
    for (const x of [r0 - 5, r1 + 4]) plant('palm', x, Y(u), 5, x + u);
  }
  k.crowd(r0 - 8, Y(n1 - 12), 7, n1 - KOKUSAI[0] - 24, 130);
  k.crowd(r1 + 1, Y(n1 - 12), 7, n1 - KOKUSAI[0] - 24, 130);
  // strings of festival flags across the street, stirring
  const flags = [0, 1].map((f) => k.sprite(r1 - r0 + 16, 6, 3090, (r) => {
    const w0 = (r1 - r0 + 16) * S;
    for (let i = 0; i < w0; i++) {
      const sag = Math.round(Math.sin((i / (w0 - 1)) * Math.PI) * 6);
      r.px(i, sag + 1, 0x3a3a40);
      if (i % 12 === 3) {
        const c = [0xd8302a, 0xf0d040, 0x2a6ac8, 0xf0ece0, 0x2a9a5a][(i >> 3) % 5];
        for (let j = 0; j < 7; j++) for (let q = 0; q < 7 - j; q++) r.px(i + q + (f && j > 3 ? 1 : 0), sag + 2 + j, c);
      }
    }
  }));
  for (const u of [3036, 3070, 3130, 3166]) kit.loop(r0 - 8, u, flags, { fps: 2.5 });
  // ---- the eisa parade: banner, rows of big-drum and small-drum dancers, sleeves flung out, a white-faced chondārā clowning at the back
  const figure = (shirt, sash, head, extra) =>
    [0, 1].map((f) => k.sprite(7, 9, 3090, (r) => {
      for (let i = 4; i < 15; i++) r.px(i, 25, 0x1e1e26, 0.35);
      for (let j = 12; j < 20; j++) for (let i = 6; i < 15; i++) r.px(i, j, Math.abs(i - 10) < 2 ? 0x1a1a22 : shirt);
      for (let j = 18; j < 20; j++) for (let i = 6; i < 15; i++) r.px(i, j, sash);
      for (const i of [7, 12]) for (let j = 20; j < 25; j++) for (let q = 0; q < 2; q++) r.px(i + q, j, j > 23 ? 0xe8e4d8 : 0x1a1a22);
      r.discPx(10, 8, 2.8, head);
      for (let i = 7; i <= 13; i++) r.px(i, 6, 0x6a3a9a);
      r.px(14, 7 + f, 0x6a3a9a);
      extra(r, f);
    }));
  const banner = figure(0xf0eee8, 0xe8c030, 0xe8c8a8, (r) => {
    for (let j = 0; j < 24; j++) r.px(15, j, 0x5a3a22);
    for (let j = 0; j < 12; j++) for (let i = 16; i < 21; i++) r.px(i, j, j > 3 && j < 8 && i === 18 ? 0xf0ece0 : 0xd8302a);
  });
  const odaiko = figure(0xf0eee8, 0xd8302a, 0xe8c8a8, (r, f) => {
    r.discPx(4, 16, 4, 0xb03a2a);
    r.discPx(4, 16, 2.6, 0xe8dcc0);
    r.linePx(f ? 2 : 15, f ? 6 : 8, f ? 4 : 12, f ? 12 : 14, 0x8a5a2a);
  });
  const shime = figure(0xf0eee8, 0xe8c030, 0xe8c8a8, (r, f) => {
    r.discPx(17, 15, 2.6, 0xe8dcc0);
    r.linePx(f ? 2 : 6, f ? 8 : 12, f ? 6 : 12, 14, 0x8a5a2a);
  });
  const dancer = figure(0x8a3a9a, 0xe86a9a, 0xe8c8a8, (r, f) => {
    r.linePx(f ? 2 : 15, 12, f ? 6 : 19, f ? 10 : 8, 0xe8c8a8);
    r.linePx(f ? 15 : 2, 14, f ? 19 : 6, 16, 0x8a3a9a);
  });
  const chondara = figure(0x3a5aa8, 0xe8c030, 0xf8f8f4, (r, f) => {
    r.px(10, 5, 0x1a1a22);
    r.discPx(f ? 3 : 18, f ? 12 : 16, 1.6, 0xf8f8f4);
  });
  const order = [banner, odaiko, odaiko, odaiko, shime, shime, shime, dancer, dancer, chondara];
  const sp = 7;
  const total = 392;
  const at = (s) => {
    const t = (3094 - 235) / 30;
    return ((((s - sp * t) % total) + total) % total) / total;
  };
  kit.path([[-12, 3000], [86, 3000], [86, 3188], [192, 3188]], order, { sp, n: 10, gap: 9, turn: 'none', cars: 1, fps: 3, s0: at(192), d: 0.45 });
  kit.path([[-12, 2996], [94, 2996], [94, 3192], [184, 3192]], order, { sp, n: 10, gap: 9, turn: 'none', cars: 1, fps: 3, s0: at(192), d: 0.45 });
}
