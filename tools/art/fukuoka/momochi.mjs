// Momochi (u 0-800, docs/plan-fukuoka.md phase 3): Hakata Bay at night and the seaside town before it. The beach's
// sand with the surf breaking along it, the pier out to the little white chapel on the water, the seaside park with
// its palms, lamps and benches, the tower (three-sided, its mirror glass lit in bands of colour, a plaza round its
// foot), the dome of the stadium (its roof's ribs and panels, floodlights round its rim, the car parks), the hotel
// built like a ship beside it, the old stone wall along the former shore in the pines, the city museum with its
// colonnade and fountain, the library; blocks of flats with their windows lit, the expressway on its piers, the
// avenues with their traffic; fishing boats putting out into the bay with their lamps. No names or signs.
import { PAL, shade } from '../tokyo/kit.mjs';
import { hashPx } from '../hires.mjs';
import { ROADS, FERRIES, bayShore } from './route.mjs';
import { freeMap } from './free.mjs';

const [U0, U1] = [0, 800];
const FLATS = [0xd8d0c4, 0xcfc8bc, 0xe0dad0, 0xbdb6aa, 0xc8bca8];
const ROOFS = [0x7c7e84, 0x8a8880, 0x70747c, 0x9a958a];

export function momochi(ctx) {
  const { kit, plot, props, S, pave, W } = ctx;
  const { house, building, mark, ground, rand, pick, P, R, FX, FY, queue, shadowBox, hi, lamp, person, crowd, E, ER, halo, car, trafficOn, tree } = kit;
  const { boxFree, claim } = freeMap(U0, U1);

  // ---- the surf breaking along the beach: a white line of foam at the water's edge, a second further out, the wet
  // sand darker behind it; the foam lines moving in and out a little (frames)
  ground(() => {
    for (let X = 0; X < W * S; X++) {
      const x = X / S;
      const Y = FY(bayShore(x));
      for (let d = 1; d <= 7; d++) hi.tint(X, Y + d, 0.82 + d * 0.025); // the wet sand just above the water line (Y grows down)
      if (hashPx(X, 1, 3) < 0.8) P(X, Y - 1, 0xe8f0f0);
      if (hashPx(X >> 1, 2, 4) < 0.55) P(X, Y - 2, 0xc8dcdc);
      const out = Y + 8 + Math.round(3 * Math.sin(x / 9));
      if (hashPx(X >> 2, 5, 6) < 0.5) P(X, out + 14, 0xd0e4e4); // a breaker further out, broken
    }
  });
  // footprints and a raked strip, a lifeguard tower, a volleyball net, a beach hut
  ground(() => {
    for (let k = 0; k < 140; k++) {
      const [x, u] = [rand() * W, 304 + rand() * 30];
      if (u < bayShore(x) + 3) continue;
      P(FX(x), FY(u), 0xbca878);
    }
  });
  for (const x of [26, 132]) {
    mark(x, 318, (X, Y) => {
      R(X - 3, Y - 9, 7, 2, 0xe8e4d8); // the lifeguard's chair seen from above: its seat, its legs' shadow
      R(X - 3, Y - 7, 1, 7, 0x8a7a5a);
      R(X + 3, Y - 7, 1, 7, 0x8a7a5a);
      for (let d = 1; d < 6; d++) hi.tint(X + 3 + d, Y - 4 + d, 0.8);
    });
  }
  mark(150, 312, (X, Y) => {
    for (let i = -14; i <= 14; i++) P(X + i, Y, i % 2 ? 0xf0f0e8 : 0x8a8a8a); // a volleyball net
    R(X - 15, Y - 1, 1, 3, 0x5a5a5a);
    R(X + 15, Y - 1, 1, 3, 0x5a5a5a);
  });

  // ---- the pier out to the chapel on the water: a deck round it with lamps at its corners, the chapel white under a
  // pale roof with its spire, a little garden of clipped shrubs before its door; lamps down the pier
  {
    const [x, u, w, h] = ctx.ground('marizon').rect;
    ground(() => {
      const [X, Y] = [FX(x), FY(u)];
      const [dw, dh] = [FX(x + w) - X, Y - FY(u + h)];
      for (let j = 0; j < dh; j++) for (let i = 0; i < dw; i++) P(X + i, Y - dh + j, (j + (i >> 2)) % 3 ? 0x9a7a52 : 0x86684a); // the deck's boards
      for (let i = 0; i < dw; i++) { P(X + i, Y - dh, 0xd8d4cc); P(X + i, Y - 1, 0xd8d4cc); } // its rails
      for (let j = 0; j < dh; j++) { P(X, Y - dh + j, 0xd8d4cc); P(X + dw - 1, Y - dh + j, 0xd8d4cc); }
      for (const [ex, ey] of [[X + 2, Y - 3], [X + dw - 3, Y - 3], [X + 2, Y - dh + 2], [X + dw - 3, Y - dh + 2]]) {
        E(ex, ey, 0xfff0c8);
        halo(ex, ey, 8, 8, 0xffe0a0, 0.32);
      }
      // its garden before the door: round clipped shrubs, a path of white stones
      for (let k = 0; k < 6; k++) {
        const [gx, gy] = [X + 8 + (k % 3) * 18, Y - 8 - Math.floor(k / 3) * 7];
        for (let j = -2; j <= 2; j++) for (let i = -3; i <= 3; i++) if (i * i / 9 + j * j / 4 <= 1) P(gx + i, gy + j, shade(0x3a5a34, 1 + (i < 0 ? 0.15 : -0.1)));
      }
      for (let j = 4; j < 18; j++) P(X + (dw >> 1), Y - j, 0xe8e4dc);
      halo(X + (dw >> 1), Y - (dh >> 1), 34, 28, 0xffe8c0, 0.16);
    });
    house(x + 4, u + 9, w - 8, h - 11, { tile: 0xb8bcc4, hip: false, wall: 0xf0ece4, face: 3, s: 12011 });
    mark(x + w / 2, u + h - 6, (X, Y) => {
      R(X - 1, Y - 9, 3, 9, 0xf4f0e8); // the spire, standing up the strip from its base on the ridge
      R(X - 3, Y - 7, 7, 1, 0xf4f0e8); // its cross
      E(X, Y - 10, 0xfff4d0);
      halo(X, Y - 6, 8, 10, 0xfff0d0, 0.3);
    }, u + h - 2);
    for (let uu = 290; uu < 338; uu += 8) mark(65.4, uu, (X, Y) => {
      E(X, Y, 0xfff0c8);
      halo(X, Y, 6, 6, 0xffe0a0, 0.28);
    });
  }

  // ---- the seaside park: palms in a row along the promenade, lamps, benches, people out in the evening
  const palm = (x, u, r = 3.2) =>
    queue(FY(u) + 1, () => {
      const [X, Y] = [FX(x), FY(u)];
      for (let k = 0; k < 9; k++) {
        const a = (k / 9) * Math.PI * 2 + hashPx(X, Y, k) * 0.4;
        const len = Math.round(r * S * (0.8 + hashPx(X, Y, k + 9) * 0.3));
        for (let t = 1; t <= len; t++) {
          const droop = (t / len) ** 2 * 2;
          const [px, py] = [X + Math.round(Math.cos(a) * t), Y + Math.round(Math.sin(a) * t + droop)];
          const c = t < len * 0.5 ? 0x2e5a2a : t % 2 ? 0x3a6e30 : 0x4a8236;
          P(px, py, c);
          if (t > 2 && t < len - 1) {
            P(px + Math.round(-Math.sin(a)), py + Math.round(Math.cos(a)), shade(c, 0.85)); // its leaflets
            P(px - Math.round(-Math.sin(a)), py - Math.round(Math.cos(a)), shade(c, 1.1));
          }
        }
      }
      R(X - 1, Y - 1, 3, 3, 0x6a5a3a); // the crown's heart
    }, () => {
      const [X, Y] = [FX(x), FY(u)];
      for (let d = 2; d < 10; d++) hi.tint(X + d, Y + d, 0.75);
    });
  for (let x = 6; x < W; x += 11) if (Math.abs(x - 65) > 5 && Math.abs(x - 100) > 6) palm(x + (hashPx(x, 3, 1) - 0.5) * 3, 351 + (hashPx(x, 4, 2) - 0.5) * 3, 3.6 + hashPx(x, 5, 3));
  for (let x = 12; x < W; x += 22) if (Math.abs(x - 65) > 8 && Math.abs(x - 100) > 8) palm(x, 372 + (hashPx(x, 6, 3) - 0.5) * 4, 4 + hashPx(x, 7, 4));
  for (let x = 4; x < W; x += 22) mark(x, 344, (X, Y) => lamp(X, Y));
  for (let x = 14; x < W; x += 22) mark(x, 346, (X, Y) => {
    R(X - 3, Y - 1, 7, 2, 0x8a6a4a); // a bench
    R(X - 3, Y - 2, 7, 1, 0xa8845a);
  });
  for (let k = 0; k < 22; k++) mark(4 + rand() * (W - 8), 337 + rand() * 6, (X, Y) => person(X, Y, 1200 + k));
  // the park's lawns between its paths: beds of winter pansies and kale edged in brick, a ring of benches round a
  // sculpture, a playground of a slide and swings
  ground(() => {
    for (const bx of [20, 46, 128, 156]) {
      const [X, Y] = [FX(bx), FY(364)];
      for (let j = 0; j < 12; j++) for (let i = 0; i < 30; i++) {
        const rim = i === 0 || j === 0 || i === 29 || j === 11;
        P(X + i, Y - j, rim ? 0x8a4a3a : [0xe8d040, 0xc84a8a, 0xf0ece0, 0x8a5ac8, 0x6a8a5a][((i >> 1) + (j >> 1) * 2) % 5]);
      }
    }
  });
  mark(84, 366, (X, Y) => {
    for (let a = 0; a < 12; a++) R(X + Math.round(Math.cos(a / 2) * 12) - 1, Y + Math.round(Math.sin(a / 2) * 8) - 1, 3, 2, 0xa8845a); // the ring of benches
    R(X - 2, Y - 7, 4, 7, 0x8a8a86); // the sculpture
    R(X - 2, Y - 7, 1, 7, 0xb4b4ac);
    halo(X, Y - 3, 10, 8, 0xffe0b0, 0.25);
  });
  mark(143, 380, (X, Y) => {
    R(X - 6, Y - 2, 13, 2, 0x8a3a2a); // the swings' frame, its seats
    for (const i of [-4, 0, 4]) R(X + i, Y, 2, 1, 0x2a2a30);
    R(X + 10, Y - 8, 3, 9, 0xd8b040); // the slide
    R(X + 10, Y - 8, 3, 1, 0xf0d060);
  });

  // ---- the tower: 234 m of three-sided mirror glass, drawn the way the game shows height (a point z above the ground
  // is z up the strip), so it rises from its plaza up over the pines. Its sharp edge faces the bay (down the strip), so
  // two faces show, each lit at night in bands of colour - blue at its foot rising through violet to rose - the
  // observation deck a ring of lit glass two thirds up, the open frame of its top over it, a red lamp at the tip.
  {
    const p = plot('fukuoka_tower');
    pave(p.x, p.u, p.w, 14, 'plaza', 1201);
    const [CX, CY] = [FX(p.x + p.w / 2), FY(p.u + 8)];
    const Z = 274; // (fine pixels: its height)
    const [a, b, c] = [8, 11, 5]; // the triangle: its point a down the strip, its back corners b across and c up
    const sideX = (j) => (j <= -c ? b : Math.round(b * (a - j) / (a + c))); // half its width at row j of a slice
    const LED = (z) => {
      const t = z / Z;
      const k = Math.floor(z / 6) % 2;
      const col = t < 0.4 ? 0x3a6aff : t < 0.7 ? 0x7a5aff : 0xd86ad8;
      return shade(col, k ? 1.15 : 0.82);
    };
    queue(CY + a + 2, () => {
      for (let z = 0; z <= Z; z++) {
        const top = z === Z;
        for (let j = -c; j <= a; j++) {
          const hw = sideX(j);
          for (let i = -hw; i <= hw; i++) {
            const edge = Math.abs(i) === hw || j === -c;
            const [X, Y] = [CX + i, CY + j - z];
            if (top) { P(X, Y, edge ? 0x6a6e78 : 0x9aa0aa); continue; }
            // only the front of each slice shows below the top: its two faces either side of the sharp edge
            if (j < a - 1 && !(Math.abs(i) >= hw - 1)) continue;
            if (z > 236) { if ((z + i) % 4 === 0 || Math.abs(i) >= hw - 1) E(X, Y, 0x8a7aa8); continue; } // the open frame
            if (z >= 140 && z <= 150) { E(X, Y, (z + i) % 3 ? 0xe8f0ff : 0x9ab0d0); continue; } // the observation deck
            const face = i < 0 ? 1.08 : 0.86;
            E(X, Y, i === 0 ? 0xc0d0ff : shade(LED(z), face));
          }
        }
      }
      ER(CX - 1, CY - Z - c - 2, 2, 2, 0xff4030);
      halo(CX, CY - Z - c, 8, 8, 0xff6040, 0.4);
      for (let z = 0; z < Z; z += 30) halo(CX, CY - z, 20, 26, z < 120 ? 0x5a7aff : 0x9a6aff, 0.16);
      halo(CX, CY - 145, 22, 14, 0xd8e8ff, 0.25);
    }, () => shadowBox(CX - b, CY - c, 2 * b, a + c, 4, 0.66));
    // the hall at its foot, the plaza's lamps, people looking up
    building(p.x + 1, p.u + 1, 7, 7, { style: 'glass', face: 2.4, wall: 0xc8d0d8, roof: 0x8a9098, s: 12012 });
    for (const [lx, lu] of [[p.x + 2, p.u + 10], [p.x + p.w - 2, p.u + 10], [p.x + p.w - 2, p.u + 2]]) mark(lx, lu, (X, Y) => lamp(X, Y));
    crowd(p.x + 10, p.u + 1, 10, 4, 6);
    for (let u = p.u + 18; u < p.u + p.h - 2; u += 5.5) for (const x of [p.x + 2.6, p.x + p.w - 2.6]) tree(hashPx(u, x, 1) < 0.5 ? 'pine' : 'broadleaf', x + (hashPx(u, x, 2) - 0.5), u, 2 + hashPx(u, x, 3));
  }

  // ---- the stadium's dome: a silver roof of ribbed panels in rings, floodlights round its rim, its car parks
  {
    const p = plot('dome');
    pave(p.x, p.u, p.w, p.h, 'plaza', 1202);
    const [cx, cu, rx, ru] = [p.x + p.w / 2, p.u + p.h / 2, p.w / 2 - 1, p.h / 2 - 1];
    queue(FY(p.u), () => {
      const [X, Y, RX, RY] = [FX(cx), FY(cu), Math.round(rx * S), Math.round(ru * S)];
      for (let j = -RY; j <= RY; j++)
        for (let i = -RX; i <= RX; i++) {
          const d = (i / RX) ** 2 + (j / RY) ** 2;
          if (d > 1) continue;
          const ang = Math.atan2(j / RY, i / RX);
          const rib = Math.abs(((ang / (Math.PI * 2)) * 36) % 1 - 0.5) > 0.44; // its radial ribs
          const ring = Math.abs(((Math.sqrt(d) * 5) % 1) - 0.5) > 0.45; // the rings of panels
          let c = shade(0xb8bcc4, 1.18 - Math.sqrt(d) * 0.3 + (i < 0 && j < 0 ? 0.08 : -0.06));
          if (rib || ring) c = shade(c, 0.82);
          if (d > 0.93) c = 0x6a6e76; // its rim
          P(X + i, Y + j, c);
        }
      for (let k = 0; k < 24; k++) {
        const a = (k / 24) * Math.PI * 2;
        const [lx, ly] = [X + Math.round(Math.cos(a) * (RX + 2)), Y + Math.round(Math.sin(a) * (RY + 2))];
        E(lx, ly, 0xf8f4e0);
        halo(lx, ly, 6, 6, 0xfff0d0, 0.3);
      }
    }, () => shadowBox(FX(cx - rx), FY(cu + ru), Math.round(2 * rx * S), Math.round(2 * ru * S), 5, 0.66));
    // the car parks round it: rows of bays, cars in some
    for (let k = 0; k < 30; k++) {
      const a = (k / 30) * Math.PI * 2;
      const [x, u] = [cx + Math.cos(a) * (rx + 3.5), cu + Math.sin(a) * (ru + 3.5)];
      if (x < p.x + 1 || x > p.x + p.w - 1 || u < p.u + 1 || u > p.u + p.h - 1) continue;
      if (hashPx(k, 7, 1) < 0.5) car(x, u, Math.abs(Math.cos(a)) > 0.7, pick(PAL.cars));
    }
  }

  // ---- the hotel built like a ship: a long hull of rooms round a glass atrium, its windows lit
  {
    const p = plot('hotel_kaihin');
    pave(p.x, p.u, p.w, p.h, 'plaza', 1203);
    building(p.x + 1, p.u + 2, p.w - 2, p.h - 3, { style: 'balcony', face: 7, wall: 0xe0dcd4, roof: 0x8a8e96, s: 12031, tiers: [{ in: [2, 3, 2, 3], face: 2, roof: 0x5a7aa0, style: 'glass' }] });
    mark(p.x + p.w / 2, p.u + p.h - 6, (X, Y) => halo(X, Y, 14, 20, 0xffe8b0, 0.22));
  }

  // ---- the old stone wall along the former shore: a low bank of rounded stones in the pines, broken here and there
  {
    const p = plot('borui');
    mark(p.x, p.u + p.h / 2, (X, Y) => {
      const len = FX(p.x + p.w) - X;
      for (let i = 0; i < len; i++) {
        if (hashPx(i >> 3, 1, 7) < 0.12) continue; // (a gap)
        for (let j = -4; j <= 4; j++) {
          const st = hashPx((i + (j & 1) * 2) >> 2, j >> 1, 9);
          const c = j === -4 ? 0x5a564c : shade(0x8a867a, 0.86 + st * 0.3);
          P(X + i, Y + j, c);
        }
        hi.tint(X + i + 2, Y + 6, 0.7);
      }
    });
  }
  for (let k = 0; k < 46; k++) {
    const [x, u] = [130 + rand() * 48, 402 + rand() * 116];
    if (u > 466 && u < 480) continue;
    tree('pine', x, u, 2.4 + rand() * 1.6);
  }

  // ---- the museum: a long low hall of stone behind a colonnade, a plaza with a round fountain lit from under the water
  {
    const p = plot('hakubutsukan_m');
    pave(p.x, p.u, p.w, p.h, 'plaza', 1204);
    building(p.x + 2, p.u + 12, p.w - 4, p.h - 13, { style: 'granite', face: 4, wall: 0xc8c0b0, roof: 0x9a968c, s: 12041, tiers: [{ in: [6, 4, 6, 4], face: 2, roof: 0x7a8a96 }] });
    mark(p.x + 2, p.u + 12, (X, Y) => {
      const w = FX(p.x + p.w - 2) - X;
      for (let i = 2; i < w - 2; i += 4) R(X + i, Y - 2, 2, 3, 0xe8e4d8); // the colonnade's columns
      R(X, Y + 1, w, 1, 0x6a665e);
    });
    mark(p.x + p.w / 2, p.u + 6, (X, Y) => {
      for (let j = -7; j <= 7; j++) for (let i = -9; i <= 9; i++) {
        const d = (i / 9) ** 2 + (j / 7) ** 2;
        if (d <= 1) E(X + i, Y + j, d > 0.8 ? 0xb8b4a8 : d < 0.12 ? 0xe8f8ff : shade(0x3a8ab0, 1.1 - d * 0.4));
      }
      halo(X, Y, 16, 12, 0x8ad0ff, 0.3);
    });
  }
  {
    const p = plot('toshokan');
    pave(p.x, p.u, p.w, p.h, 'plaza', 1205);
    building(p.x + 1, p.u + 4, p.w - 2, p.h - 5, { style: 'glass', face: 4, wall: 0xb8c0c8, roof: 0x7a8088, s: 12051 });
  }

  // ---- what is left: tall blocks of flats along the avenues (lit windows, balconies), a school with its sports
  // ground, a car park, convenience stores lit white all night with a car or two before them, houses on the back
  // streets with their yard trees; keyaki trees along the avenues
  const rowsAlong = (id, side, every = 9) => {
    const r = ROADS.find((q) => q.id === id);
    const [[x0, u0], [x1, u1]] = [r.pts[0], r.pts.at(-1)];
    const off = r.w / 2 + 2.6;
    const n = Math.floor(Math.hypot(x1 - x0, u1 - u0) / every);
    for (let k = 1; k < n; k++) {
      const [x, u] = [x0 + ((x1 - x0) * k) / n, u0 + ((u1 - u0) * k) / n];
      const [tx, tu] = x0 === x1 ? [x + side * off, u] : [x, u + side * off];
      if (boxFree(tx - 0.5, tu - 0.5, 1, 1)) tree('broadleaf', tx, tu, 1.4);
    }
  };
  for (const id of ['yokatopia_dori', 'kaihin_dori']) for (const side of [-1, 1]) rowsAlong(id, side);
  for (const side of [-1, 1]) rowsAlong('tower_dori', side, 8);
  let school = false;
  let lots = 0;
  for (let u = 384; u < U1 - 4; u += 1)
    for (let x = 0; x < W - 6; x += 1) {
      const big = !school && u > 620 && boxFree(x, u, 40, 30);
      if (big) {
        // the school: a three-storey block along the lot's top, its sports ground with a running track
        school = true;
        claim(x - 1, u - 1, 42, 32);
        building(x + 1, u + 20, 38, 9, { style: 'plain', face: 4, wall: 0xe4e0d8, roof: 0x7a8088, s: 12061 });
        ground(() => {
          const [X0, Y0, w, h] = [FX(x + 2), FY(u + 18), FX(x + 38) - FX(x + 2), FY(u + 2) - FY(u + 18)];
          for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
            const d = Math.hypot((i - w / 2) / (w / 2 - 6), (j - h / 2) / (h / 2 - 4));
            P(X0 + i, Y0 + j, d > 0.86 && d < 1 ? 0xb85a3a : d >= 1 ? 0x9a8a70 : 0xb8a888);
            if (d > 0.9 && d < 0.94) P(X0 + i, Y0 + j, 0xe8e4dc); // the track's lane line
          }
        });
        for (const [gx, gu] of [[x + 4, u + 10], [x + 36, u + 10]]) mark(gx, gu, (X, Y) => { R(X - 1, Y - 4, 1, 8, 0xe8e4dc); R(X - 1, Y - 4, 3, 1, 0xe8e4dc); R(X - 1, Y + 3, 3, 1, 0xe8e4dc); });
        x += 40;
        continue;
      }
      const w = 9 + Math.floor(rand() * 14);
      const h = 9 + Math.floor(rand() * 10);
      if (!boxFree(x, u, w, h)) continue;
      claim(x - 1, u - 1, w + 2, h + 2);
      const v = rand();
      lots++;
      if (v < 0.07 && w >= 14) {
        // a car park: painted bays, cars in some, a lamp
        pave(x + 0.5, u + 0.5, w - 1, h - 1, 'plaza', 1207);
        ground(() => {
          for (let i = FX(x + 1); i < FX(x + w - 1); i += 7) for (let j = FY(u + h - 1); j < FY(u + 1); j++) if ((j - FY(u + h - 1)) % 22 < 12) P(i, j, 0xd8d4c8);
        });
        for (let k = 0; k < (w * h) / 30; k++) car(x + 2 + rand() * (w - 4), u + 3 + rand() * (h - 6), true);
        mark(x + 1, u + 1, (X, Y) => lamp(X, Y));
      } else if (v < 0.14) {
        // a convenience store, lit white, its forecourt with a car and people
        const sw = Math.min(w - 2, 9);
        pave(x + 0.5, u + 0.5, w - 1, h - 1, 'plaza', 1208);
        building(x + 1, u + h - 6, sw, 5, { style: 'plain', face: 2.4, wall: 0xf0f0ec, roof: 0x8a8e96, shop: true, s: Math.floor(rand() * 1e6) });
        mark(x + 1 + sw / 2, u + h - 7, (X, Y) => halo(X, Y + 6, 18, 12, 0xf0f8ff, 0.35));
        car(x + 3, u + 3, true);
        crowd(x + 1, u + 1, sw, 2, 2);
      } else if (u > 640 && v < 0.4) {
        house(x + 0.5, u + 0.5, Math.min(w, 10) - 1, Math.min(h, 9) - 1, { tile: pick(PAL.tile), s: Math.floor(rand() * 1e6) });
        if (w > 12) tree(rand() < 0.4 ? 'pine' : 'broadleaf', x + w - 2, u + 2, 1.6 + rand());
      } else {
        const tall = u < 640 && w >= 12;
        building(x + 0.5, u + 0.5, w - 1, h - 1, {
          style: 'balcony', face: tall ? 9 + Math.floor(rand() * 5) : 5 + Math.floor(rand() * 4), wall: pick(FLATS), roof: pick(ROOFS),
          tiers: tall && rand() < 0.5 ? [{ in: [1.5, 1.5, 1.5, 1.5 + rand() * 3], face: 3, style: 'balcony' }] : [],
        });
        if (rand() < 0.35) tree('broadleaf', x + 1, u + 1, 1.2 + rand() * 0.6);
      }
      x += w;
    }
  void lots;

  // ---- traffic: the expressway and the avenues; the fishing boats' lamps going out into the bay
  for (const id of ['toshi_kosoku', 'yokatopia_dori', 'kaihin_dori']) {
    const r = ROADS.find((q) => q.id === id);
    trafficOn(r.pts, { sp: id === 'toshi_kosoku' ? 34 : 20, gap: 120, s0: rand() });
    trafficOn([...r.pts].reverse(), { sp: id === 'toshi_kosoku' ? 30 : 18, gap: 140, s0: rand() });
  }
  const boat = kit.frame(5 / 3, 11 / 3, 150, (put) => {
    for (let j = 1; j < 10; j++) for (let i = 0; i < 5; i++) if (Math.abs(i - 2) <= Math.min(2, j / 2)) put(i, j, j > 7 ? 0x3a3a40 : 0xe0dcd0);
    put(2, 4, 0x6a6a70);
    put(2, 1, 0xfff4c0); // its lamp at the bow
  });
  for (const [k, f] of FERRIES.entries()) props.path(f.pts, [boat], { sp: 4, n: 1, mode: 'wrap', turn: 'rot', s0: k * 0.5, d: 0.02 });
}
