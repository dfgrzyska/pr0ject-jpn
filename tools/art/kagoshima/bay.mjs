// Kinkō Bay, u = 2850..4250: the ferry terminal and aquarium at the bay's head, a cruise ship at her pier with balconies and pools,
// the orange Sakurajima ferries crossing day and night, the fish farms' rings of floats with their feeding boat, fishing boats,
// gulls, dolphins leaping, and the shadow of the ash plume drifting over the water. The water itself is the far layer.
import { C, S, night, hashPx, scaleColor, rampColor, rng, fbm } from '../nagasaki/canvas.mjs';
import { W, BAY, ISLAND } from './geo.mjs';

export function paintBay(k) {
  const { img, Y, U, kit, objects, glowPx } = k;
  const R = rng(2850);
  const wake = (u) => ({ f: k.wakeF(u), every: 3, life: 2.2 });

  // ------------------------------------------------------------ the bay's head
  // Io World, the aquarium: a long blue hall with its whale shark on the roof's great window
  k.house(6, Y(2902), 30, 20, 7, 'block', {
    roofC: 0x7a8a94, wall: 0x4a8ab0, plainRoof: true,
    extra: () => {
      const X = 21 * S;
      const Yc = (Y(2902) + 10) * S;
      for (let j = -14; j <= 14; j++) for (let i = -36; i <= 36; i++) if ((i / 36) ** 2 + (j / 14) ** 2 < 1) img.px(X + i, Yc + j, 0x1e4a70);
      for (let i = -24; i <= 22; i++) {
        const hw = Math.max(1, 6 - Math.abs(i + 2) * 0.2);
        for (let j = -hw; j <= hw; j++) img.px(X + i, Yc + j, j > 1 ? 0x8ab0c0 : 0x3a5a70);
      }
      for (let q = 0; q < 12; q++) img.px(X - 16 + q * 3, Yc - 2 + (q % 2), 0xe8f4f8);
      img.linePx(X + 22, Yc, X + 30, Yc - 7, 0x3a5a70);
      img.linePx(X + 22, Yc, X + 30, Yc + 6, 0x3a5a70);
    },
  });
  k.crowd(8, Y(2874), 26, 3, 10);
  k.road([[40, 2870], [82, 2870]], 2, { side: 0, surface: C.paving, kerb: C.granite[1], piece: true });
  // the ferry terminal at the root of the pier, the ramp, cars queueing for the boat
  k.house(62, Y(2908), 22, 12, 6, 'block', { roofC: 0x8a8e96, wall: 0xd8d4cc, plainRoof: false });
  for (let i = 0; i < 6; i++) {
    const X = (44 + i * 3) * S;
    const Yy = Y(2880) * S;
    const c = [0xe8e8ec, 0xc43a30, 0x3a609c, 0x2c3038, 0x9aa2aa, 0xe8d69c][i];
    for (let j = 0; j < 12; j++) for (let q = 0; q < 8; q++) img.px(X + q, Yy + j, j > 2 && j < 8 ? scaleColor(c, 1.14) : j < 3 || j > 8 ? c : 0x2a3440);
  }
  // the pier, a ship's length of concrete
  {
    const qx = 84;
    const q0 = 2868;
    const q1 = 3006;
    img.fine(qx - 2, Y(q1) - 1, 11, q1 - q0 + 6, (X, Yy, x, y) => {
      const a = x - qx;
      const u = 7168 - y;
      if (a > 7.1) return [0x081820, 0.34];
      if (a < 0 || a > 7) return null;
      if (a < 0.5 || a > 6.5) return (u | 0) % 14 < 1 ? 0x2a2a2e : 0x7a7670;
      return k.pavePx(X, Yy, C.concrete);
    });
    k.reserve(qx - 1, Y(q1), 9, q1 - q0);
    k.standing(qx + 1, Y(2960), 4, 60, 8, 2851, undefined);
  }
  // the cruise ship, bow out towards Sakurajima: balconies down both sides, lifeboats along them, pools and loungers, a slide,
  // a sports court on the bow, the funnel aft, her shadow on the water, her lines to the pier
  {
    const sx = 92;
    const s0 = 2896;
    const s1 = 2994;
    const len = s1 - s0;
    const yTop = Y(s1);
    const half = (j) => (j < 20 ? 1.5 + (j / 20) ** 0.6 * 7 : j > len - 4 ? 8.5 - (j - (len - 4)) * 0.4 : 8.5);
    const cx = sx + 9;
    objects.push({
      y: yTop + len,
      shadow: () => {
        for (let Yy = yTop * S; Yy < (yTop + len + 5) * S; Yy++) {
          const j = Yy / S - yTop - 4;
          if (j < 0 || j > len) continue;
          const h = half(j);
          for (let X = (cx - h + 4) * S; X < (cx + h + 4) * S; X++) if (k.wetPx(Math.round(X), Yy)) img.px(X, Yy, 0x0a1418, 0.3);
        }
      },
      draw: () => {
        img.fine(cx - 10, yTop, 20, len + 1, (X, Yy, x, y) => {
          const j = y - yTop;
          const h = half(j);
          const a = Math.abs(x - cx);
          if (a > h) return null;
          if (a > h - 0.7) return x < cx ? 0x3a4a64 : 0x1a2438;
          // balconies, in their rows, a lit window behind each
          if (a > h - 2 && j > 22 && j < len - 6) {
            const q = Yy % 6;
            if (q === 0) return 0xc8ccd0;
            return (X >> 1) % 2 ? 0x5a7a98 : hashPx(X >> 1, Yy >> 2, 2852) < 0.12 ? 0xffe8b8 : 0x8aa4bc;
          }
          if (a > h - 2.7) return 0xc8c4bc; // the promenade's rail
          return (Yy >> 1) % 9 === 0 ? 0xe4e4de : x < cx ? 0xf8f8f4 : 0xe8e8e2;
        });
        const CX = cx * S;
        // the sports court on the bow, the bridge across
        img.rectPx(CX - 9, (yTop + 10) * S, 19, 27, 0x3a7a4a);
        img.rectPx(CX - 7, (yTop + 10) * S + 3, 15, 21, 0x4a8a5a);
        img.rectPx(CX - 9, (yTop + 10) * S + 12, 19, 1, 0xf0f0f0);
        img.rectPx(CX - 22, (yTop + 22) * S, 45, 9, 0xd8dce0);
        img.rectPx(CX - 19, (yTop + 22) * S, 39, 3, 0x24344c);
        // the pools with their decks, the loungers in rows, the yellow-and-red slide
        for (const [py, pw, ph] of [[34, 8, 6], [52, 6, 5]]) {
          img.rectPx(CX - (pw / 2 + 1) * S, (yTop + py - 1) * S, (pw + 2) * S, (ph + 2) * S, 0xb8a888);
          for (let j = 0; j < ph * S; j++) for (let i = 0; i < pw * S; i++) img.px(CX - (pw / 2) * S + i, (yTop + py) * S + j, j < 3 ? 0x8ad8f0 : hashPx(i, j >> 1, 2853) < 0.1 ? 0xd8f4fa : 0x3ab0d8);
        }
        for (let j = 30; j < 66; j += 2) {
          if (j > 33 && j < 41) continue;
          for (const dx of [-6, 6]) for (let q = 0; q < 3; q++) for (let i = 0; i < 6; i++) img.px(CX + dx * S + i, (yTop + j) * S + q, q ? 0xf0e8d8 : 0x3a6ac8);
        }
        for (let q = 0; q < 30; q++) {
          const X = CX + 9 + Math.round(Math.sin(q * 0.26) * 6);
          const Yy = (yTop + 44) * S + q;
          for (let i = 0; i < 3; i++) img.px(X + i, Yy, q % 6 < 3 ? 0xf0c020 : 0xe0402a);
        }
        // the funnel, gold with a black top; the lifeboats along both sides
        for (let j = -15; j <= 15; j++) for (let i = -10; i <= 10; i++) if ((i / 10) ** 2 + (j / 15) ** 2 < 1) img.px(CX + i, (yTop + 77) * S + j, j < -9 ? 0x1a1a1e : i > 4 ? 0xb87a18 : 0xe8a020);
        for (let j = 28; j < 70; j += 7)
          for (const side of [-1, 1]) {
            const X = CX + side * 28;
            for (let q = 0; q < 12; q++) for (let i = -2; i <= 2; i++) img.px(X + i, (yTop + j) * S + q, q < 2 || q > 9 ? 0xc85a14 : i < 0 ? 0xf8a050 : 0xf07a20);
          }
        img.rectPx(CX - 15, (yTop + 84) * S, 33, 18, 0xd8dce0);
        img.rectPx(CX - 12, (yTop + 85) * S, 27, 3, 0x9aa0a8);
        // her lines
        for (const j of [8, 30, 70, 92]) img.linePx(90 * S, (yTop + j + (j < 50 ? 3 : -3)) * S, (sx + 1) * S, (yTop + j) * S, 0x3a3a3e);
      },
    });
    k.reserve(sx - 2, yTop - 2, 24, len + 10);
    // passengers on her decks
    k.standing(cx - 5, yTop + 40, 10, 24, 8, 2854, undefined);
  }

  // ------------------------------------------------------------ the fish farms
  const pen = (x, u, r, seed2) => {
    const X = x * S;
    const Yy = Y(u) * S;
    const RR = r * S;
    // the net in the water: a dark ring of mesh, fish turning in it
    for (let j = -RR; j <= RR; j++)
      for (let i = -RR; i <= RR; i++) {
        const d = Math.hypot(i, j);
        if (d >= RR - 1) continue;
        if ((i + j) % 9 === 0 || (i - j) % 9 === 0) img.px(X + i, Yy + j, 0x06161c, 0.34);
        else if (hashPx(i >> 2, j >> 2, seed2) < 0.05) img.px(X + i, Yy + j, 0xb8c8d0, 0.42);
        else img.px(X + i, Yy + j, 0x06161c, 0.18);
      }
    // the ring of floats, red and white, the walkway on them
    for (let a = 0; a < 6.283; a += 0.5 / RR) {
      const q = Math.floor((a * RR) / 7) % 2;
      for (let t = 0; t < 3; t++) img.px(X + Math.cos(a) * (RR + t - 1), Yy + Math.sin(a) * (RR + t - 1), t === 2 ? 0x081820 : q ? 0xe8e4d8 : 0xd84a2a);
    }
  };
  // the big farm, eight pens linked by walkways, a shed on its raft
  const pens = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) pens.push([20 + c * 22, 3286 + r * 22]);
  for (const [x, u] of pens) {
    for (let i = 9; i < 13; i += 0.34) {
      for (let j = -1; j < 2; j++) {
        if (x < 40) img.px((x + i) * S, Y(u) * S + j, j ? 0xb8b4a8 : 0x8a8678);
        if (u < 3350) img.px(x * S + j, (Y(u) - i) * S, j ? 0xb8b4a8 : 0x8a8678);
      }
    }
    pen(x, u, 9, x + u);
  }
  img.fine(8, Y(3376), 14, 9, (X, Yy) => (X % 12 === 0 ? 0x5a4a3a : Yy % 6 === 0 ? 0x6a5a48 : 0x8a7a64));
  k.house(10, Y(3376) - 1, 10, 4, 4, 'block', { roofC: 0x5a6a7a, wall: 0xc8c4bc, plainRoof: true, reserve: false, shop: false, door: false });
  k.standing(12, Y(3368), 8, 2, 2, 2855, [0x2a3a5a, 0xc86a2a]);
  const feeder = k.hull(12, 5, 3320, 0xd8d4c8, 0xf0ece0, (r) => {
    for (let j = 4; j < 11; j++) for (let i = 6; i < 18; i++) r.px(i, j, j === 4 ? 0xffffff : i > 14 ? 0x3a5a8a : 0xe8e8e0);
    r.rectPx(22, 5, 5, 5, 0x8a7a64);
  });
  kit.path([[54, 3270], [54, 3380], [6, 3384], [6, 3274], [54, 3270]], [feeder], { sp: 4, mode: 'wrap', turn: 'rot', d: 0.02, s0: 0.3, wake: wake(3320) });
  // and the lesser ones across the bay
  for (const [x, u, r] of [[146, 3020, 10], [128, 3070, 8], [30, 3520, 11], [150, 3620, 9], [58, 4060, 10], [36, 4120, 8]]) pen(x, u, r, x * 3 + u);

  // ------------------------------------------------------------ the ferries, day and night, in Sakurajima orange and white
  const ferry = (u) => k.hull(36, 12, u, 0xe0a020, 0xc8c4bc, (r, FL, FHh) => {
    // the car deck, lanes of cars, the upper deck over it, her bridge across the middle, the funnel
    for (let j = 4; j < FHh - 4; j++) for (let i = 14; i < 92; i++) r.px(i, j, (j === 4 || j === FHh - 5) ? 0xffffff : (i - 14) % 12 < 1 ? 0xb8bcc0 : 0xf2f0ea);
    for (let q = 0; q < 8; q++) {
      const i = 16 + q * 9;
      const c = [0xc43a30, 0x3a609c, 0xe8e8ec, 0x2c3038][q % 4];
      if (q % 3 !== 2) r.rectPx(i, 8, 7, 4, c);
      if (q % 2) r.rectPx(i, FHh - 12, 7, 4, c);
    }
    for (let j = 7; j < FHh - 7; j++) for (let i = 46; i < 62; i++) r.px(i, j, j < 9 ? 0xffffff : i > 58 ? 0x2a3a5a : 0xd8dce0);
    r.discPx(40, FHh >> 1, 4, 0xe0a020);
    r.discPx(40, FHh >> 1, 2, 0x1a1a1e);
  });
  kit.path([[77, 2962], [77, 4206]], [ferry(3300)], { sp: 10, mode: 'pp', hold: 5, turn: 'rot', s0: 0.2, d: 0.02, wake: wake(3300) });
  kit.path([[77, 4206], [77, 2962]], [ferry(3880)], { sp: 10, mode: 'pp', hold: 5, turn: 'rot', s0: 0.1, d: 0.02, wake: wake(3880) });
  // fishing boats working, each with its gulls, one coming home
  const fisher = (u, col) => k.hull(16, 6, u, col, 0xc8c0b0, (r, FL, FHh) => {
    for (let j = 4; j < FHh - 4; j++) for (let i = 8; i < 20; i++) r.px(i, j, j === 4 ? 0xffffff : i > 16 ? 0x2a3a4a : 0xe8e8e0);
    r.rectPx(28, 6, 8, FHh - 12, 0x3a5a4a);
  });
  kit.path([[-24, 3130], [80, 3160], [W + 24, 3120]], [fisher(3150, 0xe8e4dc)], { sp: 5, turn: 'rot', d: 0.02, wake: wake(3150) });
  kit.path([[W + 24, 3440], [110, 3470], [-24, 3430]], [fisher(3450, 0x2a5a8a)], { sp: 4.5, turn: 'rot', d: 0.02, wake: wake(3450) });
  kit.path([[W + 24, 3780], [120, 3740], [-24, 3770]], [fisher(3760, 0x3a7a5a)], { sp: 5, turn: 'rot', d: 0.02, wake: wake(3760) });
  for (const [x, u, c] of [[100, 3210, 0xe8e4dc], [20, 3720, 0x3a5a8a], [160, 3420, 0xe8e4dc], [124, 3960, 0xc83a2a]]) kit.loop(x, u, [fisher(u, c)], { d: 0.02 });
  const gull = [0, 1].map((f) => k.sprite(9, 4, 3300, (r) => {
    for (let i = 1; i < 12; i++) {
      const dy = f ? Math.round(i * 0.3) : Math.round(i * -0.24 + (i > 7 ? (i - 7) * 0.5 : 0));
      for (let j = 0; j < (i > 8 ? 1 : 2); j++) {
        r.px(13 - i, 6 + dy + j, i > 9 ? 0x3a3a40 : 0xe8ecec);
        r.px(13 + i, 6 + dy + j, i > 9 ? 0x3a3a40 : 0xc8ccd0);
      }
    }
    for (let j = 4; j < 9; j++) for (let i = -1; i <= 1; i++) r.px(13 + i, j, 0xf8f8f8);
  }));
  for (const [x, u, rr, n, w] of [[50, 3320, 34, 3, 0.3], [110, 3190, 26, 2, -0.26], [130, 3640, 30, 2, 0.28], [50, 4080, 26, 2, -0.3], [150, 3030, 22, 2, 0.32]]) kit.orbit(x, u, rr, gull, { ry: rr * 0.7, w, n, d: 2.2, a: 0.9 });

  // a pod of dolphins, backs showing; every few seconds one of them leaps
  for (const [x, u] of [[126, 3560], [134, 3572], [120, 3584], [138, 3590], [112, 3604]]) {
    const X = x * S;
    const Yy = Y(u) * S;
    for (let i = 0; i < 15; i++) {
      const h = Math.sin((i / 14) * Math.PI) * 3;
      for (let j = 0; j < h + 1; j++) img.px(X + i, Yy - j, j > h - 1 ? 0x8a9aa6 : 0x5a6a76);
    }
    for (let j = 0; j < 4; j++) img.px(X + 7, Yy - 3 - j, 0x3a4a56);
    for (let i = 0; i < 9; i++) img.px(X + i + 12, Yy + 1, 0xeaf0f0, 0.5 - i * 0.05);
  }
  const leap = [0, 1, 2, 3, 4, 5].map((f) => k.sprite(13, 9, 3570, (r) => {
    const cx = 18;
    const cy = 14;
    if (f === 0) r.discPx(cx, cy, 2, 0xd8e4e8);
    if (f === 1) {
      r.rectPx(cx - 4, cy, 9, 3, 0x4a5a66);
      r.rectPx(cx - 1, cy - 3, 3, 3, 0x3a4a56);
      r.rectPx(cx - 8, cy + 3, 3, 2, 0xeaf0f0);
    }
    if (f === 2 || f === 3) {
      const o = f === 2 ? -3 : 3;
      for (let i = -11; i <= 11; i++) {
        const h = 4 - Math.abs(i) * 0.3;
        for (let j = -h; j <= h; j++) r.px(cx + o + i, cy - 7 + Math.abs(i) * 0.3 + j, j < 0 ? 0x8a9aa6 : 0x5a6a76);
      }
      r.rectPx(cx + o - 1, cy - 13, 3, 3, 0x4a5a66);
      for (let q = 0; q < 5; q++) r.px(cx + o - 13 + q * 2, cy + 6, 0xeaf0f0);
    }
    if (f >= 4) for (let a = 0; a < 6.3; a += 0.4) r.px(cx + Math.cos(a) * (f * 3 - 6), cy + Math.sin(a) * (f * 2 - 5), 0xeaf0f0, f === 4 ? 0.9 : 0.5);
  }));
  kit.spot([[100, 3640, 70, 120]], leap, { rate: 0.45, fps: 6 });

  // the shadow of a plume of ash blown out over the bay, drifting across the water
  const plume = k.sprite(100, 60, 3300, (r) => {
    for (let j = 0; j < 180; j += 1)
      for (let i = 0; i < 300; i += 1) {
        const x = i / 3;
        const y = j / 3;
        const d = ((x - 50) / 48) ** 2 + ((y - 30) / 28) ** 2 + (fbm(x, y, { seed: 83, scale: 14, octaves: 2 }) - 0.5) * 0.9;
        if (d >= 1) continue;
        if (d > 0.7 && (d - 0.7) / 0.3 > hashPx(i >> 1, j >> 1, 2860)) continue;
        r.px(i, j, 0x1e1812);
      }
  }, false);
  kit.path([[-80, 2980], [260, 3420]], [plume], { sp: 4, turn: 'none', a: 0.22, d: 0.3, fx: 1, s0: 0.45 });
  kit.path([[260, 3700], [-80, 4100]], [plume], { sp: 3, turn: 'none', a: 0.18, d: 0.3, fx: 1, s0: 0.2 });
  void night;
  void rampColor;
  void R;
  void U;
  void glowPx;
  void BAY;
  void ISLAND;
}
