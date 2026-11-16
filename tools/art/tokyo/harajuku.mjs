// Harajuku (u 2100-2900), late in the afternoon, the light going orange and the shadows long:
//   the forest of Meiji Jingū - a thousand trees over the gravel way in, the great wooden torii across it, the
//     wall of sake barrels facing the wine casks, the shrine in its cloister under copper roofs with the pair of
//     camphor trees in the court, the inner garden's pond with its irises and tea house, the lawn in the clearing;
//   the Yamanote line along the forest's edge, its trains in green, the old wooden station with its little spire;
//   Takeshita-dōri - a lane a few steps wide between sweet shops in every colour, crêpes and candy floss on the
//     roofs, bunting across it, a crowd from end to end;
//   Omotesandō under its zelkovas, shops of glass along it; the back lanes of Ura-Harajuku;
//   Yoyogi - the gymnasium's roof hung from two masts like a pair of commas, the small one coiled round its one.
// Live: the trains, the cars of Meiji-dōri.
import { lots } from './blocks.mjs';
import { PAL, shade, blend } from './kit.mjs';
import { hashPx } from '../hires.mjs';

const COPPER = 0x5c8a78;

export function harajuku(ctx) {
  const { kit, blocks, pave, plot, near, ROADS } = ctx;
  const { building, house, tree, crowd, mark, ground, rand, pick, P, R, FX, FY, queue, shadowBox } = kit;
  kit.setSun(0.9);
  const road = (id) => ROADS.find((r) => r.id === id).pts;

  // ---- the forest: every tree its own, clear of the ways through it, the shrine, the pond and the lawn
  const sando = road('meiji_sando');
  const michi = road('meiji_gyoen_michi');
  const inBox = (x, u, id, pad) => {
    const p = plot(id);
    return x > p.x - pad && x < p.x + p.w + pad && u > p.u - pad && u < p.u + p.h + pad;
  };
  const LAWN = [36, 2710, 22, 26];
  const open = (x, u) =>
    near(sando, x, u).d < 6 || near(michi, x, u).d < 3.6 || inBox(x, u, 'meiji_honden', 3) || inBox(x, u, 'otorii', 3) || inBox(x, u, 'sake_daru', 2) ||
    (x > 45 && x < 54 && u > 2327 && u < 2359) || Math.hypot((x - 66) / 13, (u - 2620) / 25) < 1 || (x > 49 && x < 57 && u > 2598 && u < 2646) || (x > 57 && x < 74 && u > 2644 && u < 2658) ||
    Math.hypot((x - LAWN[0]) / (LAWN[2] + 2), (u - LAWN[1]) / (LAWN[3] + 2)) < 1;
  for (let k = 0; k < 1500; k++) {
    const [x, u] = [1 + rand() * 82, 2113 + rand() * 644];
    if (open(x, u)) continue;
    tree(pick(['broadleaf', 'broadleaf', 'broadleaf', 'broadleaf', 'cedar', 'pine']), x, u, 2.8 + rand() * 2.4);
  }

  // ---- a torii across the way: two pillars, the tie beam, the long lintel with its ends turned up, gold crests
  const torii = (cx, u, half, wood = 0xa87848) => {
    const [X, Y, h] = [FX(cx), FY(u), Math.round(half * 3)];
    queue(Y + 1, () => {
      for (const sx of [-1, 1]) {
        const px = X + sx * (h - 4) - 1;
        R(px, Y - 17, 4, 17, wood);
        R(px, Y - 17, 1, 17, shade(wood, 1.25));
        R(px + 3, Y - 17, 1, 17, shade(wood, 0.7));
        R(px - 1, Y - 1, 6, 2, 0x4a4038);
      }
      R(X - h + 2, Y - 13, 2 * h - 4, 2, shade(wood, 0.8));
      R(X - h - 5, Y - 20, 2 * h + 10, 3, wood);
      R(X - h - 5, Y - 21, 2 * h + 10, 1, shade(wood, 1.3));
      R(X - h - 5, Y - 17, 2 * h + 10, 1, shade(wood, 0.6));
      for (const sx of [-1, 1]) R(X + sx * (h + 5) - (sx < 0 ? 1 : 0), Y - 22, 1, 2, shade(wood, 1.3));
      for (const dx of [-Math.round(h / 2), 0, Math.round(h / 2)]) R(X + dx, Y - 19, 2, 2, 0xf0c848);
    }, () => {
      shadowBox(X - h - 5 + 9, Y + 5, 2 * h + 10, 3, 2, 0.68);
      for (const sx of [-1, 1]) shadowBox(X + sx * (h - 4) - 1, Y - 1, 4, 2, 8, 0.68);
    });
  };
  {
    const p = plot('otorii');
    pave(p.x, p.u, p.w, p.h, 'gravel', 71);
    torii(p.x + p.w / 2, p.u + 2, p.w / 2 - 0.5);
    torii(48.6, 2214, 5.2); // (the first one, where the way comes in from the bridge)
    crowd(37, 2262, 8, 20, 6);
    crowd(38, 2300, 6, 24, 5);
  }

  // ---- the barrels: sake in straw and paper on the left of the way, wine casks from far away facing them
  const rack = (x, u, w, h, wine) =>
    mark(x, u + h, (X, Y) => {
      const [fw, fh] = [w * 3, h * 3];
      R(X - 1, Y - 1, fw + 2, fh + 2, 0x4a3628);
      R(X - 2, Y - 4, fw + 4, 3, 0x626a78);
      R(X - 2, Y - 4, fw + 4, 1, 0x8a94a0);
      for (let j = 0; j + 6 <= fh; j += 6)
        for (let i = 0; i + 6 <= fw; i += 6) {
          const v = hashPx(X + i, Y + j, 3);
          for (let b = 0; b < 5; b++)
            for (let a = 0; a < 5; a++) {
              if ((a === 0 || a === 4) && (b === 0 || b === 4)) continue;
              let c;
              if (wine) c = b === 1 || b === 3 ? 0x3a2a20 : a === 2 && b === 2 ? 0x2a1c16 : shade(0x8a5a38, 0.9 + v * 0.25);
              else if (b === 0 || b === 4) c = 0xc8b070;
              else if (a >= 1 && a <= 3 && b === 2) c = PAL.sign[Math.floor(v * PAL.sign.length)] === 0xf4f0e8 ? 0xc03020 : PAL.sign[Math.floor(v * PAL.sign.length)];
              else c = a + b < 3 ? 0xfaf6ec : 0xe8e2d2;
              P(X + i + a, Y + j + b, c);
            }
        }
      for (let k = 1; k <= 3; k++) for (let i = 0; i < fw + 2; i++) ctx.img.hi.tint(X + i + k, Y + fh + k, 0.72);
    });
  {
    const p = plot('sake_daru');
    pave(p.x, p.u, p.w, p.h, 'gravel', 72);
    rack(p.x, p.u, p.w, p.h, false);
    ctx.paint(46, 2328, 53, 2358, (x, u, X, Y) => [0xb0a690, 0xbcb29c, 0xc6bca6][Math.floor(hashPx(X, Y, 73) * 3)]);
    rack(47, 2330, 4, 26, true);
    crowd(32, 2332, 5, 22, 5);
  }

  // ---- the shrine: the south gate, the cloister round the court, the hall of worship, the sanctuary behind it
  {
    const p = plot('meiji_honden');
    pave(p.x, p.u, p.w, p.h, 'gravel', 74);
    ground(() => {
      // the flagged way from the gate to the hall, the court's stone border
      for (let u = p.u + 9; u < p.u + 36; u += 1 / 3) for (let i = -9; i < 9; i++) P(FX(p.x + p.w / 2) + i, FY(u), (Math.floor(u * 3) % 6 === 0 || (i + 90) % 6 === 0) ? 0x9a948a : 0xb4aea2);
    });
    const hall = (x, u, w, h, o = {}) => house(p.x + x, p.u + u, w, h, { tile: COPPER, wall: 0x9a6a48, ...o });
    hall(19, 1, 16, 9, { s: 11, lantern: true }); // the south gate
    hall(2, 3, 16, 5, { hip: false, s: 12 });
    hall(36, 3, 16, 5, { hip: false, s: 13 });
    for (let u = 9; u < 46; u += 12) {
      hall(2, u, 5, 11.4, { hip: false, s: 14 + u });
      hall(47, u, 5, 11.4, { hip: false, s: 15 + u });
    }
    hall(11, 36, 32, 11, { s: 20, face: 2 }); // the hall of worship
    hall(8, 50, 38, 18, { s: 21, face: 3 }); // the sanctuary
    hall(2, 48, 5, 20, { hip: false, s: 22 });
    hall(47, 48, 5, 20, { hip: false, s: 23 });
    // the two camphors tied together, the rack of wishes round the third
    tree('broadleaf', p.x + 12, p.u + 24, 3.6);
    tree('broadleaf', p.x + 16.5, p.u + 25, 3.4);
    tree('broadleaf', p.x + 41, p.u + 24, 3.8);
    mark(p.x + 41, p.u + 18.6, (X, Y) => {
      for (let k = 0; k < 24; k++) {
        const a = (k / 24) * Math.PI * 2;
        const [i, j] = [Math.round(Math.cos(a) * 15), Math.round(Math.sin(a) * 9)];
        R(X + i, Y + j, 2, 2, k % 3 ? 0xd8b880 : 0xc49a60);
      }
    });
    mark(p.x + p.w / 2, p.u + 33, (X, Y) => {
      R(X - 6, Y - 3, 12, 3, 0x7a5a38); // the offering box
      R(X - 6, Y - 3, 12, 1, 0xa88050);
    });
    crowd(p.x + 10, p.u + 11, 34, 22, 26);
    for (const dx of [16, 37]) mark(p.x + dx, p.u, (X, Y) => kit.lantern(X, Y - 5));
  }

  // ---- the inner garden: irises along the pond's edge, the tea house above it, the old well
  ground(() => {
    for (let u = 2600; u < 2644; u += 1 / 3)
      for (let x = 49.4; x < 60; x += 1 / 3) {
        const edge = 66 - 10 * Math.sqrt(Math.max(0, 1 - ((u - 2620) / 22) ** 2));
        if (x > edge - 0.8 || x < edge - 5.4) continue;
        const v = hashPx(FX(x), FY(u), 75);
        P(FX(x), FY(u), v < 0.3 ? 0x7a50c0 : v < 0.44 ? 0xb090e0 : v < 0.5 ? 0xf4f0f8 : v < 0.8 ? 0x3e7a3c : 0x2f5a30);
      }
    for (let u = 2645; u < 2657; u += 1 / 3) for (let x = 58; x < 73; x += 1 / 3) P(FX(x), FY(u), hashPx(FX(x), FY(u), 76) < 0.5 ? 0x5a8a48 : 0x66964e);
  });
  house(60, 2646.4, 11, 8, { tile: 0x7c6050, wall: 0xe4dccc, s: 31 });
  mark(71.6, 2596, (X, Y) => {
    for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) if (Math.hypot(i, j) < 3.5) P(X + i, Y + j, Math.hypot(i, j) > 2 ? 0x8a8a84 : 0x3c7a8c);
  });
  crowd(48, 2604, 3, 34, 4);

  // ---- the lawn in the clearing
  ground(() => {
    for (let u = LAWN[1] - LAWN[3]; u < LAWN[1] + LAWN[3]; u += 1 / 3)
      for (let x = LAWN[0] - LAWN[2]; x < LAWN[0] + LAWN[2]; x += 1 / 3) {
        const d = ((x - LAWN[0]) / LAWN[2]) ** 2 + ((u - LAWN[1]) / LAWN[3]) ** 2;
        if (d < 1 && hashPx(FX(x), FY(u), 5) > (d - 0.8) * 5) P(FX(x), FY(u), hashPx(FX(x), FY(u), 6) < 0.5 ? 0x76a455 : 0x6c9a4e);
      }
  });
  for (let k = 0; k < 9; k++) {
    const a = rand() * Math.PI * 2;
    const [x, u] = [LAWN[0] + Math.cos(a) * rand() * 15, LAWN[1] + Math.sin(a) * rand() * 18];
    const c = pick([0x4870c8, 0xd04848, 0xe8c040, 0xf0a0b8, 0xe8e8e8]);
    mark(x, u, (X, Y) => {
      R(X, Y, 9, 6, c);
      R(X, Y, 9, 1, shade(c, 1.2));
      kit.person(X + 1, Y - 2, k);
      kit.person(X + 6, Y - 1, k + 30);
    });
  }

  // ---- Yoyogi: the gymnasium, its roof hung from two masts - two half shells slid past each other
  {
    const p = plot('yoyogi_1');
    pave(p.x, p.u, p.w, p.h, 'plaza', 77);
    const [X0, YT, w, h] = [FX(p.x), FY(p.u + p.h), p.w * 3, p.h * 3];
    const [cx, cy, rx, ry, sl] = [w / 2, h / 2, w * 0.39, h * 0.45, w * 0.075];
    queue(FY(p.u), () => {
      for (let j = 0; j < h; j++)
        for (let i = 0; i < w; i++) {
          const [dx, dy] = [i + 0.5 - cx, j + 0.5 - cy];
          const top = dy < 0;
          const ex = (dx + (top ? sl : -sl)) / rx;
          const ey = dy / ry;
          const q = ex * ex + ey * ey;
          if (q > 1) continue;
          // the shell sags from the cables and lifts to its rim: light where it faces up and left
          let c = shade(0x93a29c, top ? 1.02 + 0.2 * (1 - Math.abs(ey)) - 0.1 * ex : 0.78 + 0.2 * Math.abs(ey) - 0.08 * ex);
          if (Math.floor(Math.abs(dx + (top ? sl : -sl)) + Math.abs(dy) * 0.25) % 7 === 0) c = shade(c, 0.86); // the ribs, raked
          if (q > 0.86) c = q > 0.96 ? 0x5c6062 : top ? 0xdcdfd8 : 0xb4b8b2; // the concrete rim
          if (Math.abs(dy) < 1.6) c = Math.abs(dy) < 0.6 ? 0x5a6064 : 0xeceeea; // the two main cables and the slot of light between
          P(X0 + i, YT + j, c);
        }
      for (const sx of [-1, 1]) {
        const mx = Math.round(cx + sx * (rx + sl + 1));
        R(X0 + mx - 3, YT + cy - 5, 7, 9, 0xc8c8c0);
        R(X0 + mx - 3, YT + cy - 5, 7, 2, 0xecece6);
        R(X0 + mx - 3, YT + cy + 3, 7, 1, 0x6a6a64);
        for (let k = 4; k < 14; k++) P(X0 + mx + sx * k, YT + Math.round(cy) + (k >> 2), 0x6a6e70); // the anchor cable
        R(X0 + mx + sx * 14 - 2, YT + cy + 2, 4, 4, 0xb0b0a8);
      }
    }, () => shadowBox(X0 + Math.round(w * 0.1), YT + Math.round(h * 0.1), Math.round(w * 0.8), Math.round(h * 0.82), 9, 0.66));
  }
  // the small one: a shell coiled round its single mast, a tail swept out to the door
  {
    const p = plot('yoyogi_2');
    pave(p.x, p.u, p.w, p.h, 'plaza', 78);
    const [X0, YT, w, h] = [FX(p.x), FY(p.u + p.h), p.w * 3, p.h * 3];
    const [cx, cy, r] = [w * 0.46, h * 0.5, h * 0.44];
    const [mx, my] = [cx + r * 0.42, cy - r * 0.3];
    queue(FY(p.u), () => {
      for (let j = 0; j < h; j++)
        for (let i = 0; i < w; i++) {
          const d = Math.hypot(i - cx, j - cy);
          const tail = i > cx && j > cy + r * 0.2 && j < cy + r * 0.2 + (w - i) * 0.34 && i < w - 3;
          if (d > r && !tail) continue;
          const a = Math.atan2(j - my, i - mx);
          const dm = Math.hypot(i - mx, j - my);
          let c = shade(0x93a29c, 0.86 + 0.24 * (0.5 - 0.5 * Math.sin(a + 0.8)));
          if (Math.floor((a + Math.PI) * 9 + dm * 0.05) % 2 === 0 && dm > 5) c = shade(c, 0.9);
          if (!tail && d > r - 3) c = d > r - 1 ? 0x5c6062 : 0xd4d8d2;
          P(X0 + i, YT + j, c);
        }
      R(X0 + Math.round(mx) - 3, YT + Math.round(my) - 4, 6, 8, 0xc8c8c0);
      R(X0 + Math.round(mx) - 3, YT + Math.round(my) - 4, 6, 2, 0xecece6);
    }, () => shadowBox(X0 + Math.round(cx - r * 0.8), YT + Math.round(cy - r * 0.8), Math.round(r * 1.7), Math.round(r * 1.7), 7, 0.66));
  }
  // the square between them: trees in rows, the stalls of a weekend market, people
  for (let x = 4; x < 82; x += 8) {
    tree('broadleaf', x, 2764, 2.4);
    if (x < 14 || x > 58) tree('broadleaf', x, 2884 + (x % 3), 2.6);
  }
  for (const u of [2782, 2800, 2818]) tree('broadleaf', 6, u, 2.6);
  for (const u of [2776, 2796, 2816]) tree('broadleaf', 79, u, 2.4);
  for (let k = 0; k < 8; k++)
    mark(60 + (k % 2) * 10, 2842 + Math.floor(k / 2) * 11, (X, Y) => {
      const c = [0xf4f0e8, 0xe8c040, 0xf4f0e8, 0xd04848, 0x4870c8, 0xf4f0e8, 0x48a868, 0xf4f0e8][k];
      for (let i = 1; i <= 3; i++) for (let q = 0; q < 21; q++) ctx.img.hi.tint(X + q + i, Y + 12 + i, 0.75);
      R(X, Y, 21, 13, c);
      R(X, Y, 21, 1, shade(c, 1.15));
      R(X, Y + 6, 21, 1, shade(c, 0.8));
      R(X, Y + 12, 21, 1, shade(c, 0.6));
    });
  crowd(56, 2838, 26, 48, 26);
  crowd(4, 2828, 14, 60, 12);
  crowd(10, 2764, 66, 5, 14);
  for (const [x, u] of [[10, 2832], [58, 2832], [78, 2832], [8, 2896], [44, 2896]]) mark(x, u, (X, Y) => kit.lamp(X, Y));

  // ---- the Yamanote line: trains in green, one each way, round and round; the bridge to the shrine over them
  {
    const pts = road('jingu_bashi') && ctx.RAILS.find((r) => r.id === 'yamanote_minami').pts;
    const run = [[194, 2135], ...pts.slice(0), [194, 3655]];
    kit.trainOn(kit.offset(run, 2.5), 0x8cc63c, { n: 7, sp: 40, s0: 0.1, u: 2600 });
    kit.trainOn(kit.offset([...run].reverse(), 2.5), 0x8cc63c, { n: 7, sp: 36, s0: 0.62, u: 2600 });
    ctx.cover(84, 2175, 20, 10);
    crowd(86, 2178, 16, 4, 9);
  }

  // ---- Harajuku station: the old wooden house with its spire, the platform under its canopy
  {
    const p = plot('harajuku_eki');
    pave(p.x, p.u, p.w, p.h, 'plaza', 79);
    ground(() => {
      for (let u = p.u; u < p.u + p.h; u += 1 / 3) {
        R(FX(p.x + 1.4), FY(u), 8, 1, 0xbdb9b0);
        P(FX(p.x + 1.4), FY(u), 0xe8c840);
      }
    });
    mark(p.x + 1.4, p.u + 46, (X, Y) => {
      // the canopy over the platform's middle
      for (let j = 0; j < 114; j++) for (let i = 0; i < 8; i++) P(X + i, Y + j, kit.canopy(j, i, 8));
    });
    house(p.x + 5, p.u + 12, 10.4, 24, { tile: 0x4c6658, wall: 0xf0e8d8, hip: true, s: 41 });
    mark(p.x + 10, p.u + 27, (X, Y) => {
      // the spire: a little square tower, a copper cap, a vane
      R(X - 4, Y - 4, 8, 8, 0xf0e8d8);
      R(X - 4, Y + 3, 8, 1, 0x4a3a30);
      for (let k = 0; k < 5; k++) R(X - 5 + k, Y - 6 + k - 4, 10 - k * 2, 1, shade(COPPER, 1.2 - k * 0.08));
      R(X - 5, Y - 5, 10, 2, COPPER);
      R(X, Y - 13, 1, 4, 0x3a3a40);
      for (let k = 1; k <= 4; k++) ctx.img.hi.tint(X + 4 + k, Y + 2 + k, 0.72);
    }, p.u + 12);
    // half-timber on its front
    mark(p.x + 5, p.u + 12, (X, Y) => {
      for (let i = 2; i < 30; i += 5) R(X + i, Y - 5, 1, 4, 0x5a4030);
    }, p.u + 12 - 0.4);
    crowd(p.x + 5, p.u + 3, 10, 8, 14);
    crowd(p.x + 2, p.u + 2, 2, 44, 10);
  }

  // ---- Takeshita-dōri: sweet shops shoulder to shoulder, their treats on the roofs, bunting, a gate, a crowd
  {
    const PASTEL = [0xf8c8d8, 0xc8e4f4, 0xfae8b0, 0xd4f0cc, 0xe8d0f4, 0xfdf6ec, 0xffd4b8, 0xc8f0e8];
    // what stands on a roof: a crêpe, candy floss, an ice cream, a heart, a star, a doughnut
    const treat = (kind) => ({ X, Y, w, h }) => {
      const [x, y] = [X + (w >> 1), Y + (h >> 1)];
      if (w < 9 || h < 9) return;
      for (let k = 1; k <= 2; k++) for (let i = -4; i <= 4; i++) ctx.img.hi.tint(x + i + k, y + 6 + k, 0.75);
      if (kind === 0) {
        for (let j = 0; j < 8; j++) R(x - 4 + (j >> 1), y - 2 + j, 8 - j, 1, j % 3 ? 0xe8c078 : 0xc89850); // the cone
        R(x - 4, y - 5, 9, 3, 0xfdf8f0);
        R(x - 2, y - 6, 2, 2, 0xe04860);
        R(x + 2, y - 6, 2, 2, 0x7ac040);
      } else if (kind === 1) {
        for (let j = -5; j <= 3; j++) for (let i = -5; i <= 5; i++) if (Math.hypot(i, j + 1) < 5.2 - hashPx(i, j, 3) * 1.2) P(x + i, y + j, i + j < -2 ? 0xffe4f0 : i + j > 3 ? 0xe890c0 : 0xf8b4d8);
        R(x, y + 4, 1, 4, 0xf4f0e8);
      } else if (kind === 2) {
        for (let j = 0; j < 6; j++) R(x - 3 + (j >> 1), y + j, 6 - j, 1, 0xd8a860);
        for (let j = -5; j < 0; j++) for (let i = -3; i <= 3; i++) if (Math.hypot(i, j + 2) < 3.6) P(x + i, y + j, j < -3 ? 0xfdf4e0 : (i + j) % 2 ? 0x8ad8c8 : 0x70c4b4);
      } else if (kind === 3) {
        for (let j = -4; j <= 4; j++) for (let i = -5; i <= 5; i++) if ((Math.abs(i) - 2.5) ** 2 + (j + 1.5) ** 2 < 8 || (j >= -1 && Math.abs(i) <= 4.5 - j)) P(x + i, y + j, i < -1 && j < 0 ? 0xff9ab0 : 0xe84070);
      } else if (kind === 4) {
        for (let j = -5; j <= 5; j++) for (let i = -5; i <= 5; i++) if (Math.abs(i) + Math.abs(j) < 4 || (Math.abs(i) < 2 && Math.abs(j) < 6) || (Math.abs(j) < 2 && Math.abs(i) < 6)) P(x + i, y + j, i + j < 0 ? 0xfff0a0 : 0xf0c020);
      } else {
        for (let j = -4; j <= 4; j++) for (let i = -5; i <= 5; i++) {
          const d = Math.hypot(i, j * 1.2);
          if (d < 5.2 && d > 1.6) P(x + i, y + j, j < 0 ? (hashPx(i, j, 9) < 0.25 ? 0xfdf8f0 : 0xf090b8) : 0xc88848);
        }
      }
    };
    const k = plot('takeshita_kita');
    let n = 0;
    // the north side: fronts on the lane, a second row behind
    for (const [x, u, w, h] of lots([k.x, k.u, k.w, 15], rand, { depth: [15, 15], width: [6, 10], lane: 0 })) building(x, u, w - 0.34, h, { style: 'plain', wall: PASTEL[n % 8], roof: pick([0xd8c8c0, 0xc8d0d4, 0xe0d4b8, 0xcfc0d0]), face: 5 + (n % 3), shop: true, sign: true, top: treat(n++ % 6), lit: 0.6 });
    for (const [x, u, w, h] of lots([k.x, k.u + 16, k.w, k.h - 16], rand, { depth: [20, 20], width: [9, 15], lane: 0 })) building(x, u, w - 0.34, h, { style: pick(['plain', 'balcony']), wall: PASTEL[(n + 3) % 8], face: 6 + (n++ % 4), shop: false });
    // the south side: their backs to us, so their roofs carry the show
    const m = plot('takeshita_minami');
    for (const [x, u, w, h] of lots([m.x, m.u + m.h - 16, m.w, 16], rand, { depth: [16, 16], width: [6, 10], lane: 0 })) building(x, u, w - 0.34, h, { style: 'plain', wall: PASTEL[(n + 5) % 8], roof: PASTEL[(n + 2) % 8], face: 4, top: treat(n++ % 6) });
    for (const [x, u, w, h] of lots([m.x, m.u, m.w, m.h - 17], rand, { depth: [13, 14], width: [9, 14], lane: 1 })) building(x, u, w - 0.34, h, { style: pick(['plain', 'office']), wall: PASTEL[n++ % 8], face: 5 + (n % 3), shop: true, sign: true });
    // awnings out over the lane from the south side, bunting across it, the gate at the station end
    ground(() => {
      for (let x = m.x; x < m.x + m.w; x += 1 / 3) {
        const c = PAL.awning[Math.floor(hashPx(Math.floor(x / 7), 2, 81) * PAL.awning.length)];
        for (let j = 0; j < 3; j++) P(FX(x), FY(m.u + m.h) - 3 + j, Math.floor(x * 3) % 4 < 2 ? c : 0xf8f4ec);
      }
    });
    for (let x = 106; x < 158; x += 6.5)
      mark(x, 2542.4, (X, Y) => {
        for (let j = 0; j < 15; j++) {
          const i = Math.round(Math.sin((j / 14) * Math.PI) * 2);
          P(X + i, Y + j, 0x6a6a70);
          if (j % 3 === 1) R(X + i + 1, Y + j, 2, 2, PAL.cloth[(j + Math.round(x)) % PAL.cloth.length]);
        }
      });
    mark(101.4, 2536.6, (X, Y) => {
      R(X, Y - 24, 3, 24, 0xf06aa0);
      R(X + 1, Y - 24, 1, 24, 0xfdd0e0);
      for (let j = 0; j < 22; j++) R(X - 1, Y - 23 + j, 5, 1, j % 6 < 3 ? 0xf06aa0 : 0xfdf6ec);
      for (const [i, j, c] of [[-2, -27, 0xe84070], [2, -29, 0x4ab0e0], [5, -26, 0xf0c020], [0, -31, 0x8ad060]]) {
        R(X + i, Y + j, 3, 3, c);
        P(X + i, Y + j, shade(c, 1.4));
      }
    });
    crowd(102, 2538.4, 57, 3.2, 110);
    for (const x of [112, 126, 141, 153]) mark(x, 2545, (X, Y) => kit.parasol(X, Y, pick(PAL.awning)));
  }

  // ---- Omotesandō: zelkovas down both pavements, lamps between them, people strolling
  {
    const pts = road('omotesando');
    const [ax, au, bx, bu] = [...pts[0], ...pts[1]];
    const len = Math.hypot(bx - ax, bu - au);
    const [dx, du] = [(bx - ax) / len, (bu - au) / len];
    for (let s = 16; s < len - 12; s += 10.5)
      for (const side of [-1, 1]) {
        const [x, u] = [ax + dx * s + du * side * 8.4, au + du * s - dx * side * 8.4];
        if (x > 156) continue;
        if (Math.round(s / 10.5) % 4 === 3) mark(x, u, (X, Y) => kit.lamp(X, Y));
        else tree('broadleaf', x, u, 3.3 + rand() * 0.7);
      }
    for (let k = 0; k < 44; k++) {
      const s = 14 + rand() * (len - 26);
      const side = k % 2 ? -1 : 1;
      const [x, u] = [ax + dx * s + du * side * 7, au + du * s - dx * side * 7];
      if (x < 157) crowd(x - 0.5, u - 0.5, 1, 1, 1);
    }
    crowd(131, 2420, 3, 60, 14); // (the back way to Takeshita)
  }

  // ---- the blocks: shops of glass along Omotesandō, small houses and shops in the lanes behind
  const omo = road('omotesando');
  for (const b of blocks(2100, 2900, 6, 8, true)) {
    const grand = near(omo, b[0] + b[2] / 2, b[1] + b[3] / 2).d < 34 && b[1] > 2150;
    for (const [x, u, w, h] of lots(b, rand, grand ? { depth: [14, 20], width: [11, 18], small: true } : { depth: [10, 14], width: [8, 14], small: true })) {
      if (w < 6 || h < 7) continue;
      const v = rand();
      if (grand) building(x, u, w - 1, h, { style: pick(['glass', 'glass', 'plain', 'office']), glass: pick([[0x3a5a80, 0x9cc4dc], [0x5a4634, 0xdcbc8c], [0x2c5c58, 0xa4d8cc], [0x4a4a5a, 0xc8c8d8]]), wall: pick([0xf0ece4, 0xe4dccc, 0xd8d4cc, 0x3a3a42]), face: 6 + Math.floor(rand() * 6), shop: true, sign: rand() < 0.5 });
      else if (v < 0.42) house(x, u, w - 1, h - 1, { hip: rand() < 0.6 });
      else if (v < 0.8) building(x, u, w - 1, h, { style: pick(['plain', 'balcony', 'office']), wall: pick([...PAL.walls, 0xf8c8d8, 0xc8e4f4, 0xfae8b0]), face: 4 + Math.floor(rand() * 4), shop: rand() < 0.7, sign: rand() < 0.5 });
      else if (v < 0.9) {
        pave(x, u, w - 1, h - 1, 'park');
        for (let k = 0; k < 2 + Math.floor((w * h) / 60); k++) tree(pick(['broadleaf', 'sakura', 'tiny']), x + 2 + rand() * (w - 5), u + 2 + rand() * (h - 5), 2 + rand() * 1.4);
      } else {
        pave(x, u, w - 1, h - 1, 'asphalt');
        for (let i = 3; i < w - 3; i += 4) if (rand() < 0.6) kit.car(x + i, u + h - 5, true);
      }
    }
  }
  // what the slanting avenue leaves between the lots: a small shop, a pocket of green, a tree in a planter
  for (const [x, u, w, h] of blocks(2100, 2900, 4, 5, true)) {
    if (w >= 7 && h >= 8) building(x, u, w - 1, Math.min(h, 16), { style: pick(['plain', 'glass']), face: 4 + Math.floor(rand() * 3), shop: true, sign: rand() < 0.5 });
    else {
      pave(x, u, w - 0.67, h - 0.67, 'park');
      for (let k = 0; k < 1 + Math.floor((w * h) / 30); k++) tree(pick(['broadleaf', 'tiny', 'sakura']), x + 1.5 + rand() * (w - 3), u + 1.5 + rand() * (h - 3), 1.6 + rand() * 1.2);
    }
  }
  crowd(128.4, 2590, 3, 270, 40); // (Ura-Harajuku's lane)

  // ---- Meiji-dōri: street trees, and the cars - keeping left, in and out under the viaduct at the bend
  for (let u = 1822; u < 2796; u += 17) {
    if ([2096, 2262, 2376, 2540, 2660, 2760].some((c) => Math.abs(u - c) < 12)) continue;
    tree('broadleaf', 158.6, u, 2.1);
    if (u > 2110) tree('broadleaf', 173.6, u + 8, 2.1);
  }
  {
    const lane = [[166, 1812], [166, 2800], [150, 2850], [110.6, 2892.8]];
    const back = [...lane].reverse();
    kit.trafficOn(kit.offset(lane, 1.5), { sp: 24, gap: 150, s0: 0.15, u: 2400 });
    kit.trafficOn(kit.offset(lane, 4.6), { sp: 19, gap: 210, s0: 0.6, u: 2400 });
    kit.trafficOn(kit.offset(back, 1.5), { sp: 23, gap: 170, s0: 0.4, u: 2400 });
    kit.trafficOn(kit.offset(back, 4.6), { sp: 18, gap: 230, s0: 0.85, u: 2400 });
    ctx.cover(102, 2882, 17, 22, -0.1); // (the viaduct over the bend, shown again over the cars)
  }
  void blend;
}
