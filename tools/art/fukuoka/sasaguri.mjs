// Sasaguri and Nanzo-in (u 4400-5200, docs/plan-fukuoka.md phase 5) at noon. Wooded mountains - cedar plantations in
// their dark rows, bamboo groves, broadleaf wood - with a stream running down the valley; villages along the valley
// road, their fields after winter with rape in flower on the bunds, the local line and its little station with a
// train; the pilgrims' paths between the little temples of the 88, each with its small hall and stone statues in red
// caps and bibs, pilgrims in white on the paths. Nanzo-in's terrace: its gate, rows of little stone Buddhas, the hall,
// the Fudo falls with statues in the rock, and the great bronze Buddha lying on his side among the trees - drawn with
// care, nothing of the fight comes near him (docs/plan-fukuoka.md, D6).
import { PAL, shade } from '../tokyo/kit.mjs';
import { hashPx } from '../hires.mjs';
import { inShape } from '../tokyo/geom.mjs';
import { ROADS, RAILS, GROUNDS, WATER } from './route.mjs';
import { freeMap } from './free.mjs';
import { umeKit } from './ume.mjs';

const [U0, U1] = [4400, 5200];
const road = (id) => ROADS.find((r) => r.id === id);

export function sasaguri(ctx) {
  const { kit, plot, props, S, pave, W, near } = ctx;
  const { house, building, mark, ground, rand, pick, P, R, FX, FY, queue, shadowBox, hi, lamp, person, crowd, E, halo, trafficOn, tree, glint, trainOn, smoke } = kit;
  const { boxFree, claim } = freeMap(U0, U1);
  const stream = WATER.find((w) => w.id === 'tatara_gawa');
  const nearPath = (x, u, d = 2.5) => ROADS.some((r) => near(r.pts, x, u).d < r.w / 2 + d);
  const inPlotPad = (x, u, pad = 2) => ctx.plot && ['fudasho_1', 'fudasho_2', 'fudasho_3', 'fudasho_4', 'nanzoin_sanmon', 'nehanzo', 'nanzoin_hondo', 'fudo_taki', 'ishibotoke', 'sasaguri_eki'].some((id) => {
    const p = plot(id);
    return x > p.x - pad && x < p.x + p.w + pad && u > p.u - pad && u < p.u + p.h + pad;
  });

  // ---- the wooded mountains: cedar in rows on the plantations, bamboo groves, broadleaf wood; thick, but clear of the
  // paths, the stream and the plots
  for (const id of ['yama_w', 'yama_e', 'yama_n']) {
    const [gx, gu, gw, gh] = GROUNDS.find((g) => g.id === id).rect;
    for (let k = 0; k < (gw * gh) / 14; k++) {
      const [x, u] = [gx + rand() * gw, gu + rand() * gh];
      if (nearPath(x, u) || inShape(stream, x, u) || inPlotPad(x, u, 3) || near(stream.chain.map(([a, b]) => [a, b]), x, u).d < 4) continue;
      if (GROUNDS.some((g) => g.id === 'nanzoin_keidai' && inShape(g, x, u))) continue;
      const zone = hashPx(Math.floor(x / 24), Math.floor(u / 30), 5);
      const kind = zone < 0.45 ? 'cedar' : zone < 0.62 ? 'bamboo' : 'broadleaf';
      tree(kind, x, u, kind === 'cedar' ? 1.6 + rand() * 0.8 : 2 + rand() * 1.4);
    }
  }
  // the stream: its light, stones in it, little bridges where the paths cross
  for (let k = 0; k + 1 < stream.chain.length; k++) {
    const [[ax, au], [bx, bu]] = [stream.chain[k], stream.chain[k + 1]];
    for (let t = 0; t < 1; t += 0.08) glint(FX(ax + (bx - ax) * t), FY(au + (bu - au) * t), 3, 0xf0f8ff, 0.5);
  }
  // and the light running on it with the water, down the valley towards the bay
  const ripple = [0, 1].map((k) => kit.frame(1, 1, 4800, (put) => {
    put(1, 1, 0xffffff);
    put(k ? 0 : 2, 1, 0xd8f0f8);
    put(1, k ? 0 : 2, 0xd8f0f8);
  }));
  props.path(stream.chain.map(([x, u]) => [x, u]).reverse(), ripple, { sp: 7, n: 14, gap: 30, mode: 'wrap', turn: 'none', s0: 0.1, d: 0.01 });

  // ---- the fields after winter: stubble in rows, puddles in the low ones, a farmer, rape along the bunds
  for (const id of ['tanbo_s1', 'tanbo_s2']) {
    const [gx, gu, gw, gh] = GROUNDS.find((g) => g.id === id).rect;
    ground(() => {
      for (let Y = FY(gu + gh); Y < FY(gu); Y++) for (let X = FX(gx); X < FX(gx + gw); X++) if (Y % 4 === 0 && hashPx(X, Y, 3) < 0.4) P(X, Y, 0xa89060); // the stubble's rows
      for (let k = 0; k < 6; k++) {
        const [X, Y] = [FX(gx + 4 + hashPx(k, gu, 1) * (gw - 8)), FY(gu + 4 + hashPx(k, gu, 2) * (gh - 8))];
        for (let j = -2; j <= 2; j++) for (let i = -5; i <= 5; i++) if (i * i / 25 + j * j / 4 < 1) P(X + i, Y + j, 0x8aa8b8); // a puddle with the sky in it
      }
    });
    mark(gx + gw / 2, gu + gh / 2, (X, Y) => person(X, Y, 4400 + gu));
  }
  // ---- the villages along the valley: farmhouses under tile with their yards, sheds, persimmon trees
  for (let u = U0; u < 4760; u += 1)
    for (let x = 0; x < W - 4; x += 1) {
      const w = 8 + Math.floor(rand() * 5);
      const h = 7 + Math.floor(rand() * 4);
      if (!boxFree(x, u, w, h)) continue;
      claim(x - 1, u - 1, w + 2, h + 2);
      house(x + 0.5, u + 0.5, w - 1.5, h - 1.5, { tile: pick([0x4e5662, 0x5e6670, 0x6c625a]), s: Math.floor(rand() * 1e6) });
      if (rand() < 0.5) tree('broadleaf', x + w - 1, u + h - 1, 1.4);
      x += w + 2;
    }
  // the line along the valley and its station: a short two-car train stopping
  {
    const st = plot('sasaguri_eki');
    building(st.x + 2, st.u + 7, st.w - 4, st.h - 8, { style: 'plain', face: 2.4, wall: 0xe0dcd4, roof: 0x7a7e86, s: 25001 });
    const line = RAILS.find((r) => r.id === 'sasaguri_sen').pts;
    trainOn(line, 0x8a9aa8, { n: 2, sp: 26, mode: 'pp', hold: 9, s0: 0.4 });
  }
  trafficOn(road('sasaguri_kaido').pts, { sp: 14, gap: 70, s0: rand() });

  // ---- the pilgrims' little temples: a small hall, statues in red caps and bibs before it, a lantern; pilgrims in
  // white with their hats and staffs on the paths
  for (let k = 1; k <= 4; k++) {
    const p = plot(`fudasho_${k}`);
    pave(p.x, p.u, p.w, p.h, 'gravel', 2500 + k);
    house(p.x + 1.5, p.u + 3, p.w - 3, p.h - 3.5, { tile: 0x4e5662, wall: 0x8a6a4a, face: 1.6, s: 25010 + k });
    mark(p.x + 1, p.u + 1.6, (X, Y) => {
      for (let i = 0; i < 18; i += 3) {
        R(X + i, Y - 3, 2, 3, 0x9a968c); // a statue
        P(X + i, Y - 3, 0xc8302a); // its red cap
        P(X + i + 1, Y - 1, 0xd8402a); // its bib
      }
    });
  }
  const pilgrim = kit.frame(1, 1.67, 4800, (put) => {
    for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) put(i, j, j === 0 ? 0xd8c890 : 0xf4f2ec); // a sedge hat, white clothes
  });
  props.path(road('henro_michi').pts, [pilgrim], { sp: 1.6, n: 2, gap: 40, mode: 'pp', hold: 6, turn: 'none', s0: 0.2 });
  props.path(road('henro_michi_2').pts, [pilgrim], { sp: 1.4, n: 3, gap: 60, mode: 'pp', hold: 8, turn: 'none', s0: 0.6 });

  // ---- Nanzo-in's terrace (u 4760-4860): moss between walks of stone slabs from the gate to the forecourt before the
  // Buddha, round him by both sides to the hall and the tea houses at the top; the pilgrims' paths come in at its sides
  const ume = umeKit(kit, S);
  const [kx, ku, kw, kh] = GROUNDS.find((g) => g.id === 'nanzoin_keidai').rect;
  pave(kx, ku, kw, kh, 'ume', 2601);
  const WALKS = [[67, 4760, 6, 17], [54, 4776, 68, 6], [52, 4776, 4, 70], [120, 4776, 4, 42], [56, 4838, 42, 7], [56, 4802, 4, 4]];
  for (const [x, u, w, h] of WALKS) pave(x, u, w, h, 'plaza', 2602);
  pave(58, 4805, 32, 12, 'gravel', 2603); // raked before the hall
  ground(() => {
    for (const [x, u, w, h] of WALKS)
      for (let Y = FY(u + h); Y < FY(u); Y++)
        for (let X = FX(x); X < FX(x + w); X++) {
          const [i, j] = [X - FX(x), Y - FY(u + h)];
          if (j % 6 === 0 || (i + (Math.floor(j / 6) % 2) * 3) % 6 === 0) P(X, Y, 0x8a867c); // the slabs' joints
        }
    for (let Y = FY(4817); Y < FY(4805); Y++) for (let X = FX(58); X < FX(90); X++) if (Y % 3 === 0) P(X, Y, 0xa49a84); // the rake's lines
  });
  // a stone lantern drawn tall; the long banners of the pilgrims' temples on their poles
  const toro = (x, u) => {
    const [X, Y] = [FX(x), FY(u)];
    queue(Y, () => {
      R(X - 2, Y - 1, 5, 2, 0x7e7a72);
      R(X - 1, Y - 6, 3, 5, 0x9a968c);
      R(X - 2, Y - 9, 5, 3, 0xa8a49a);
      P(X, Y - 8, 0x3a3630); // the fire box's window
      R(X - 3, Y - 11, 7, 2, 0xb4b0a6);
      R(X - 2, Y - 11, 5, 1, 0xccc8be);
      P(X, Y - 12, 0xa8a49a);
    }, () => shadowBox(X - 2, Y - 2, 5, 2, 4, 0.7));
  };
  const NOBORI = [0xc8302a, 0xece8dc, 0xe0b030, 0xc8302a, 0x6a3a7a, 0xece8dc];
  const nobori = (x, u, k) => mark(x, u, (X, Y) => {
    R(X, Y - 15, 1, 16, 0x5a4a3a);
    const c = NOBORI[k % NOBORI.length];
    for (let j = 0; j < 11; j++) for (let i = 1; i <= 3; i++) P(X + i + (j > 6 && i === 3 ? 0 : 0), Y - 14 + j, j === 0 ? 0x3a3a40 : i === 3 && j % 3 === 0 ? shade(c, 0.8) : shade(c, 1 - j * 0.01));
    if (c !== 0xece8dc) for (let j = 2; j < 10; j += 2) P(X + 2, Y - 14 + j, 0xf4f0e4); // its lettering, too small to read
  });

  // ---- Nanzo-in: its gate, the rows of little stone Buddhas, the hall, the falls with the statues in the rock
  {
    const g = plot('nanzoin_sanmon');
    house(g.x + 1, g.u + 1, g.w - 2, g.h - 2, { tile: 0x4a4e58, wall: 0x8a6a4a, hip: false, face: 2, s: 25021 });
    const b = plot('ishibotoke');
    mark(b.x, b.u + 1, (X, Y) => {
      for (let row = 0; row < 3; row++)
        for (let i = 0; i < FX(b.x + b.w) - X - 2; i += 3) {
          const [px, py] = [X + i + (row % 2), Y - row * 9];
          R(px, py - 4, 2, 4, shade(0x9a968c, 0.9 + hashPx(i, row, 3) * 0.2)); // a little stone Buddha
          P(px, py - 5, 0x8a867e); // its head
          if (hashPx(i, row, 4) < 0.3) P(px + 1, py - 2, 0xc8302a); // a red bib on some
          else if (hashPx(i, row, 6) < 0.15) P(px, py - 6, 0xe8c040); // a little offering of flowers on another
        }
    });
    const h = plot('nanzoin_hondo');
    house(h.x, h.u, h.w, h.h, { tile: 0x4a4e58, wall: 0x8a6a4a, hip: true, face: 2.8, s: 25031 });
    const f = plot('fudo_taki');
    mark(f.x, f.u + f.h, (X, Y) => {
      const [w, hh] = [FX(f.x + f.w) - X, FY(f.u) - Y];
      for (let j = 0; j < hh; j++) for (let i = 0; i < w; i++) P(X + i, Y + j, shade(0x6a665e, 0.8 + hashPx(i >> 2, j >> 2, 5) * 0.4)); // the rock
      for (let j = 0; j < hh - 6; j++) for (let i = (w >> 1) - 3; i < (w >> 1) + 3; i++) P(X + i, Y + j, (i + j) % 3 ? 0xe8f4f8 : 0xc8e0e8); // the falls
      for (let i = 2; i < w - 2; i++) for (let j = hh - 6; j < hh; j++) P(X + i, Y + j, shade(0x4a8aa0, 1 + (i % 4) * 0.04)); // the pool
      for (const sx of [3, w - 6]) { R(X + sx, Y + 8, 3, 6, 0x7a7670); R(X + sx, Y + 7, 3, 1, 0xd84a3a); } // statues in the rock
    });
    props.loop(f.x + f.w / 2 - 1, f.u + f.h - 2, [0, 1, 2].map((k) => kit.frame(2, 6, f.u, (put) => {
      for (let j = 0; j < 18; j++) if ((j + k * 2) % 6 < 2) put(3, j, 0xffffff);
    })), { fps: 6, d: 0.02 });
    // the tea houses at the top of the terrace, red benches and parasols before them; a small hall beside the falls
    for (const [x, s] of [[57, 1], [69, 2], [81, 3]]) {
      house(x, 4846, 10, 8, { tile: pick([0x5a5048, 0x4e5662]), wall: 0x8a6a4a, face: 1.8, s: 25040 + s });
      mark(x + 2, 4843.5, (X, Y) => { R(X, Y, 8, 2, 0xc8302a); R(X, Y + 2, 1, 1, 0x3a2a24); R(X + 7, Y + 2, 1, 1, 0x3a2a24); });
      mark(x + 8, 4843, (X, Y) => {
        for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) if (i * i + j * j <= 18) P(X + i, Y - 6 + j, (i * i + j * j) % 7 === 0 ? 0xa82a24 : i + j < 0 ? 0xe04a3a : 0xc8302a);
        R(X, Y - 2, 1, 3, 0x3a2a24);
      });
    }
    crowd(56, 4839.5, 40, 4, 9);
    house(104, 4847, 10, 8, { tile: 0x4a4e58, wall: 0x8a6a4a, hip: true, face: 2, s: 25051 });
    mark(105, 4846, (X, Y) => { for (let i = 0; i < FX(113) - X; i++) if (i % 3 !== 1) P(X + i, Y, 0xb8402a); }); // its vermilion railing
  }
  // ---- the great reclining Buddha: bronze, lying on his right side along the terrace on a stone pedestal, his head
  // to the left resting on his hand with the elbow on a pillow, the face calm, the eyes half shut; the robe in long
  // folds, the left arm along his side; his feet together at the right, the toes towards us. He is drawn tall
  // (the game shows height up the strip), the light of noon along his back; offerings and people small before him
  {
    const p = plot('nehanzo');
    pave(p.x, p.u, p.w, p.h, 'plaza', 2541);
    const [X0, X1] = [FX(p.x + 3), FX(p.x + p.w - 3)];
    const w = X1 - X0;
    const Yb = FY(p.u + 5); // the front edge of the pedestal's top
    const Yf = Yb - 3; // where he lies on it
    const BR = [0x2e2010, 0x4a3418, 0x664a22, 0x84622e, 0xa27e3c, 0xbe9a4e, 0xd8b868, 0xeed490];
    const tone = (v) => BR[Math.max(0, Math.min(7, Math.round(v * 7)))];
    // the height of his top above the pedestal along him (fine px), from behind the head to the ankles
    const TOP = [[20, 22], [30, 33], [38, 35], [50, 32], [64, 28], [84, 22], [100, 25], [112, 24], [136, 18], [146, 15], [w, 15]];
    const top = (i) => {
      for (let k = 0; k + 1 < TOP.length; k++) {
        const [[a, ha], [b, hb]] = [TOP[k], TOP[k + 1]];
        if (i <= b) {
          const t = (i - a) / (b - a);
          return ha + (hb - ha) * t * t * (3 - 2 * t);
        }
      }
      return 0;
    };
    const [hi_, hy, A, B] = [18, 39, 12, 9.5]; // the head: its middle, half its height (crown to chin) and width
    const [dx, dy] = [-0.42, 0.91]; // towards his crown: up, leaning to the left
    const [ex, ey] = [0.91, 0.42]; // across his face
    const put = (i, y, c) => P(X0 + i, Yf - y, c);
    queue(Yb + 6, () => {
      // the pedestal: its top of stone slabs, its front carved with a band of lotus petals
      const [PX0, PX1] = [X0 - 8, X1 + 8];
      for (let X = PX0; X < PX1; X++) {
        for (let Y = Yb - 8; Y < Yb; Y++) P(X, Y, (X - PX0) % 14 === 0 ? 0x8e8a80 : shade(0xb8b4aa, 0.96 + hashPx(X >> 2, Y, 3) * 0.06));
        for (let j = 0; j < 6; j++) {
          const m = (X - PX0) % 8;
          const petal = j >= 1 && j <= 4 && j - 1 >= Math.abs(m - 4) - 1;
          P(X, Yb + j, j === 0 ? 0x6e6a62 : j === 5 ? 0x5e5a52 : petal ? shade(0x9a968c, 1 + (m < 4 ? 0.06 : -0.04)) : 0x7a766e);
        }
      }
      for (let j = -8; j < 6; j++) { P(PX0, Yb + j, 0x5e5a52); P(PX1 - 1, Yb + j, 0x5e5a52); }
      // the pillow under his elbow, its end with a flower on it
      for (let i = -2; i < 24; i++)
        for (let y = 0; y <= 9; y++) {
          if ((i < 0 || i > 22) && (y === 0 || y === 9)) continue;
          let s = 0.3 + (y / 9) * 0.35;
          if (y === 9) s = 0.75;
          if ((y === 2 || y === 7) && i % 3 === 0) s += 0.3; // its bands
          put(i, y, tone(s));
        }
      for (let j = -4; j <= 4; j++)
        for (let i = -4; i <= 4; i++)
          if (i * i + j * j <= 16) {
            const r = Math.hypot(i, j);
            put(i + 2, j + 4.5, tone(r < 1.5 ? 0.85 : r > 3.4 ? 0.3 : Math.abs(r - 2.6) < 0.5 && (i + j) % 2 === 0 ? 0.72 : 0.48)); // a round flower, petals in a ring
          }
      // his body under the robe: dark low, lit along his back; the robe's long folds; its hem on the pedestal
      for (let i = 20; i < 148; i++) {
        const H = top(i);
        for (let y = 0; y <= H; y++) {
          let s = 0.28 + (y / H) * 0.46;
          const fold = (i * 0.9 + y * 1.7 + Math.sin(i / 17) * 6) % 14;
          if (i > 40 && i < 140) { if (fold < 1.4) s -= 0.18; else if (fold < 2.6) s += 0.1; }
          if (y < 2 + (i % 8 < 4 ? 1 : 0) && i < 140) s = 0.14; // the hem's scallops
          if (i >= 138 && i < 141) s -= 0.12; // the robe ends above his ankles
          if (H - y < 1) s = 0.02;
          else if (H - y < 3) s = 0.95;
          put(i, Math.round(y), tone(s));
        }
      }
      // the robe across his chest from the neck down to his side
      for (let t = 0; t <= 1; t += 0.02) {
        const [i, y] = [26 + t * 30, 28 - t * 22];
        put(Math.round(i), Math.round(y), BR[1]);
        put(Math.round(i) - 1, Math.round(y), BR[5]);
      }
      // his left arm along his side, the hand open on his hip
      for (let i = 40; i < 114; i++) {
        const H = top(i);
        put(i, Math.round(H - 7), BR[1]);
        for (let y = Math.round(H - 6); y < H - 2; y++) put(i, y, tone(0.62 + (y - H + 6) * 0.05));
      }
      for (let i = 104; i < 116; i++) for (let y = Math.round(top(i) - 7); y < top(i) - 1; y++) put(i, y, i % 3 === 0 && i > 106 ? BR[3] : BR[6]);
      // the feet together, one on the other, their toes towards us
      for (let k = 0; k < 2; k++)
        for (let i = 146; i < w; i++) {
          const H = 15 + ((i - 146) / (w - 146)) * 9;
          const [y0, y1] = [(k * H) / 2, ((k + 1) * H) / 2];
          for (let y = Math.ceil(y0); y < y1; y++) {
            let s = 0.4 + ((y - y0) / (y1 - y0)) * 0.35;
            if (y >= y1 - 1) s = k ? 0.95 : 0.2;
            if (i >= w - 4) s = (y - Math.ceil(y0)) % 2 ? 0.3 : 0.78; // his toes
            if (i === w - 1) s = 0.2;
            put(i, y, tone(s));
          }
        }
      // the sleeve of the arm he leans on, hanging over the pillow in folds; the forearm in it
      for (let y = 9; y <= 25; y++) {
        const [l, r] = [3 + (25 - y) * 0.12, 19 - (25 - y) * 0.05];
        for (let i = Math.round(l); i <= r; i++) put(i, y, tone(((i + Math.round(y * 0.2)) % 4 === 0 ? 0.3 : 0.5) + (i === Math.round(l) ? -0.2 : 0)));
      }
      // the neck with its three rings, then the head: the hair in curls, the knot on the crown, the face lit from
      // the upper left, the half-shut eyes, the long ears
      for (let y = 24; y < 36; y++) for (let i = 18; i < 34; i++) {
        const [a, b] = [(i - hi_) * dx + (y - hy) * dy, (i - hi_) * ex + (y - hy) * ey];
        if (a < -A + 1 && a > -A - 6 && Math.abs(b) < 5.5) put(i, y, Math.round(-a) % 2 === 0 && a < -A ? BR[3] : tone(0.55 - Math.abs(b) * 0.03));
      }
      for (let y = hy - 20; y <= hy + 20; y++)
        for (let i = hi_ - 20; i <= hi_ + 20; i++) {
          const [a, b] = [(i - hi_) * dx + (y - hy) * dy, (i - hi_) * ex + (y - hy) * ey];
          const [na, nb] = [a / A, b / B];
          const r2 = na * na + nb * nb;
          const knot = (a - A - 1) ** 2 / 20 + b * b / 20 <= 1;
          const ear = Math.abs(b) > B - 1 && Math.abs(b) < B + 2 && a > -10 && a < 1.5 && (Math.abs(b) - B) < 2 - Math.max(0, -a - 7) * 0.4;
          if (r2 > 1 && !knot && !ear) continue;
          const nz = Math.sqrt(Math.max(0, 1 - Math.min(1, r2)));
          const [sx, sy] = [na * dx + nb * ex, na * dy + nb * ey];
          let s = 0.3 + 0.62 * Math.max(0, (-0.5 * sx + 0.7 * sy + 0.55 * nz) / 1.0);
          if (r2 > 1 && ear) {
            s = 0.45 + (b < 0 ? 0.15 : 0);
            if (Math.abs(Math.abs(b) - B - 0.6) < 0.5 && a > -4) s = 0.22; // the hollow of the ear
            if (a < -7 && a > -8.4 && Math.abs(Math.abs(b) - B - 0.5) < 0.6) s = 0.2; // the long lobe's slit
          } else if (knot || a > 2.4 - b * b * 0.012) {
            const [ia, ib] = [Math.round(a), Math.round(b)];
            s = s * 0.75 + ((ia & 1) === 0 && ((ib + (ia >> 1)) & 1) === 0 ? 0.14 : -0.08); // the curls
          } else {
            const ab = Math.abs(b);
            if (ab > 1.4 && ab < 5.4 && Math.abs(a - (-2.4 + 0.06 * (ab - 3.4) ** 2)) < 0.5) s = 0.08; // the eyes, half shut
            else if (ab > 1.4 && ab < 5.4 && a > -2.4 + 0.06 * (ab - 3.4) ** 2 && a < -1.2) s -= 0.12; // the lids
            if (ab > 1.2 && ab < 6 && Math.abs(a - (0.4 - 0.05 * (ab - 3.4) ** 2)) < 0.45) s = 0.25; // the brows
            if (ab < 0.8 && a > 0.8 && a < 1.8) s = 1; // the mark between them
            if (ab < 0.9 && a > -5.6 && a < -2.4) s += b < 0 ? 0.1 : -0.12; // the nose
            if (ab < 1.7 && Math.abs(a + 5.9) < 0.5) s = 0.2;
            if (ab < 3 && Math.abs(a - (-8.2 + 0.03 * b * b)) < 0.45) s = 0.18; // the mouth's calm line
          }
          if (r2 > 0.9 && r2 <= 1 && !knot && sy < 0) s -= 0.1;
          put(i, y, tone(s));
        }
      // the hand under his cheek, the fingers along it
      for (let y = 24; y <= 31; y++)
        for (let i = 5; i <= 17; i++) {
          if ((i - 11) ** 2 / 36 + (y - 27.5) ** 2 / 12.25 > 1) continue;
          put(i, y, tone(y > 29 ? 0.5 : (i - 2) % 3 === 0 && y > 26 ? 0.35 : 0.72));
        }
    }, () => shadowBox(X0 - 8, Yf - 26, w + 16, 34, 6, 0.64));
    // before him: a low table of offerings with flowers, flowers laid along the pedestal's foot, the incense burner
    // smoking in the forecourt, people
    mark(p.x + p.w / 2, p.u + 3, (X, Y) => {
      for (let i = -24; i <= 24; i += 2) P(X + i, Y, [0xe8c040, 0xf0ece0, 0xd84a3a][((i / 2) % 3 + 3) % 3]);
      R(X - 6, Y + 2, 13, 2, 0x8a2a20);
      R(X - 6, Y + 2, 13, 1, 0xb83a2a);
      for (const i of [-4, 0, 4]) { P(X + i, Y + 1, 0x4a6a3a); P(X + i, Y, 0xf0d040); P(X + i + 1, Y, 0xf4f2ea); }
    });
    {
      const [X, Y] = [FX(88), FY(4778.6)];
      queue(Y, () => {
        for (const i of [-4, 0, 4]) R(X + i, Y - 2, 1, 3, 0x3a2a1a); // its legs
        for (let j = -3; j <= 3; j++) for (let i = -7; i <= 7; i++) if (i * i / 49 + j * j / 9 <= 1) P(X + i, Y - 5 + j, j < -1 ? (Math.abs(i) < 5 && j > -3 ? 0x8a8478 : 0x8a6a3a) : shade(0x5a4224, 1 - j * 0.04));
        R(X - 7, Y - 8, 15, 1, 0xa88a4e); // its rim
      }, () => shadowBox(X - 6, Y - 4, 13, 4, 3, 0.68));
      smoke(88, 4780, { rate: 1.4, a: 0.38 });
    }
    crowd(56, 4776.5, 64, 4.5, 16);
  }
  // ---- the terrace's lanterns, banners, plum trees in flower, old cedars at its edge
  for (const [x, u] of [[62.5, 4773.5], [77.5, 4773.5], [55, 4777], [121, 4777], [53.5, 4836], [57, 4818], [91, 4818]]) toro(x, u);
  for (let k = 0; k < 9; k++) nobori(51.4, 4786 + k * 6, k);
  for (let k = 0; k < 5; k++) nobori(124.6, 4784 + k * 6, k + 3);
  for (const [x, u, r, c, o] of [[104, 4810, 3.2, 0, { weeping: true }], [114, 4812, 2.6, 1, {}], [94, 4823, 2.8, 2, { old: true }], [95, 4834, 2.4, 0, {}], [92, 4852, 2.6, 1, { old: true }], [121, 4850, 2.6, 2, {}]])
    ume(x, u, r, ['white', 'pink', 'red'][c], { ...o, seed: x * 7 + u });
  for (const [x, u, r] of [[122, 4828, 3.2], [122.5, 4840, 2.8], [53, 4856, 3]]) tree('cedar', x, u, r);
  void smoke;
  void E;
  void halo;
  void hi;
  void building;
  void PAL;
}
