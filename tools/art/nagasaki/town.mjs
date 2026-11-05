// Oura and Glover Garden, Dejima, Shinchi Chinatown.
//   Oura: the Ishibashi tram terminus and Oura Tenshudō stop on the seawall road, Glover-dori climbing to
//   Oura Cathedral (white Gothic front, octagonal spire, the white Virgin before the door), then Glover Garden on
//   its terraces: the Alt and Ringer houses, Glover House (tiled clover-plan bungalow, veranda, conservatory)
//   with its pond and the Miura Tamaki statue, the Mitsubishi No. 2 Dock House and Walker House, the covered
//   moving walkway, the upper gate to Oranda-zaka's cobbles.
//   Dejima: the Wharf boardwalk, the fan island in its stone walls with the tile-capped perimeter wall, the
//   Chief Factor's residence with its outside stair, the namako-walled warehouses, the Protestant seminary and
//   the club house, the Dutch flag, the 1:15 model of Dejima, the water gate, the Omotemon gate and bridge.
//   Shinchi: four gates on a cross of streets, lanterns overhead, red and green shops, steamers of kakuni-manju.
import { rng, fbm } from '../../lib/raster.mjs';
import { rampColor } from '../nature.mjs';
import { C, night, scaleColor, mix } from './canvas.mjs';
import { W, rightShore, r1X, R1_HW, TRAM_U0, DEJIMA, dejimaSouth, dejimaNorth, EMBANK, CHINA_X, STREETS } from './geo.mjs';
import { masonry } from './paint.mjs';

const CAMPHOR = [0x1a3422, 0x284a2c, 0x3a6236, 0x527c44];
const SAKURA = Object.assign([0x5a3a46, 0x7e4e5e, 0xa66a7c, 0xc88a9a], { kind: 'broadleaf' });
const CAMELLIA = [0x16301e, 0x22462a, 0x305c34, 0x44743e];
const PINE = Object.assign([0x16301f, 0x234629, 0x34603a, 0x4c7a48], { kind: 'pine' });
const HYDRANGEA = [0x5a6ad0, 0x7a8ae8, 0x9a7ad8, 0xb48ae0, 0xd890c8, 0xe8e0f0];

/** A stone retaining wall along a terrace edge: its face shows below the top line. */
function terrace(k, x0, x1, u, amp = 3, ph = 0, h = 4) {
  const { img, Y } = k;
  for (let x = x0; x < x1; x++) {
    const uu = Math.round(u + Math.sin(x * 0.07 + ph) * amp);
    const y = Y(uu);
    img.set(x, y - 1, C.granite[4]);
    for (let j = 0; j < h; j++) {
      const row = Math.floor(j / 2);
      const joint = (x + row * 3) % 6 === 0 || j % 2 === 1;
      img.set(x, y + j, joint ? C.granite[0] : rampColor(C.granite, 0.7 - j * 0.12 + fbm(x, y + j, { seed: 9, scale: 2 }) * 0.2, x, y + j));
    }
    img.set(x, y + h, 0x101818, 0.35);
  }
  k.reserve(x0, Y(u + amp + 1), x1 - x0, h + amp * 2 + 2);
}

/** A garden path or lane: a narrow paved line along a polyline. */
const path = (k, pts, hw = 1.5, surface = C.paving) => k.road(pts, hw, { side: 0, surface, kerb: scaleColor(surface[1], 0.8) });

/** Flower beds: dabs of colour over a dark leafy ground. */
function flowers(k, x0, y0, w, h, cols, n, seed) {
  const R = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = Math.round(x0 + R() * w);
    const y = Math.round(y0 + R() * h);
    if (k.isRes(x, y) || k.wet(x, y)) continue;
    k.img.set(x + 1, y + 1, 0x1a2e1e, 0.5);
    k.img.set(x, y, R() < 0.35 ? 0x2e5032 : R.pick(cols));
  }
}

/** A Western house of the foreign settlement: hipped roof, white or stone walls, a veranda of posts. */
function westernHouse(k, x, footU, w, rh, fh, opt = {}) {
  const { img, Y } = k;
  const y = Y(footU) - rh - fh;
  const u = footU;
  const wall = opt.wall ?? C.cream[3];
  const ramp = opt.ramp ?? C.kawara;
  k.objects.push({
    y: Y(footU),
    shadow: () => k.shadowRect(x + 3, y + 3, w, rh + fh, 0.5),
    draw: () => {
      // the walls (stone coursing for the stone houses)
      for (let yy = y + rh; yy < y + rh + fh; yy++)
        for (let xx = x; xx < x + w; xx++) {
          let c = wall;
          if (opt.stone) c = (yy + (Math.floor((xx + (yy % 4 < 2 ? 0 : 3)) / 6) % 2)) % 2 ? scaleColor(wall, 0.92) : wall;
          if (xx === x + w - 1) c = scaleColor(c, 0.78);
          img.set(xx, yy, c);
        }
      // tall sash windows with shutters
      for (let xx = x + 3; xx + 3 < x + w - 2; xx += opt.bay ?? 7) {
        const on = night(u) > 0.15 && (xx * 7 + u) % 5 < 3;
        img.rect(xx - 1, y + rh + 2, 1, fh - 4, opt.shutter ?? 0x3a6a5a);
        img.rect(xx + 2, y + rh + 2, 1, fh - 4, opt.shutter ?? 0x3a6a5a);
        img.rect(xx, y + rh + 2, 2, fh - 4, on ? C.warm : 0x34404c);
        img.set(xx, y + rh + 1, scaleColor(wall, 1.1));
        if (on) for (let j = 0; j < fh - 4; j++) k.glow(xx, y + rh + 2 + j, C.warm, 0.4 + night(u) * 0.4);
      }
      // a second floor
      if (opt.floors === 2) img.rect(x, y + rh + Math.floor(fh / 2), w, 1, scaleColor(wall, 0.7));
      // the veranda: white posts and a rail, a stone floor in front
      if (opt.veranda !== false) {
        for (let xx = x; xx < x + w; xx += opt.postGap ?? 4) img.rect(xx, y + rh, 1, fh, opt.post ?? 0xf8f4ea);
        img.rect(x, y + rh + fh - 3, w, 1, opt.rail ?? 0xe8e2d0);
        if (opt.floors === 2) img.rect(x, y + rh + Math.floor(fh / 2) - 2, w, 1, opt.rail ?? 0xe8e2d0);
        img.rect(x - 1, y + rh + fh, w + 2, 2, C.granite[3]);
      }
      if (opt.portico) {
        // a stone portico of Tuscan columns in the middle of the front
        const px = x + Math.floor(w / 2) - 8;
        img.rect(px - 1, y + rh - 3, 18, 3, scaleColor(wall, 1.08));
        for (let c2 = 0; c2 < 4; c2++) {
          img.rect(px + c2 * 5, y + rh, 2, fh, 0xece6d4);
          img.set(px + c2 * 5 + 1, y + rh, 0xc8c0a8);
          img.rect(px + c2 * 5 - 1, y + rh, 4, 1, 0xf4eee0);
        }
      }
      k.roof(x - 2, y, w + 4, rh, ramp, { courses: !opt.slate });
      for (const cx of opt.chimneys ?? [x + 5, x + w - 7]) {
        img.rect(cx, y + 1, 3, 5, opt.brick ?? 0x8a5a44);
        img.rect(cx, y + 1, 3, 1, 0x4a3a34);
        img.set(cx + 2, y + 2, scaleColor(opt.brick ?? 0x8a5a44, 0.7));
      }
      opt.extra?.(y);
    },
  });
  k.reserve(x - 2, y - 1, w + 4, rh + fh + 3);
  return y;
}

// ---------------------------------------------------------------------------------------------- Oura & Glover
export function paintOura(k) {
  const { img, Y, kit, objects, glow, pool } = k;
  const R = rng(1863);

  // the seawall promenade: rail, lamps, a moored pleasure boat or two
  for (let u = 1990; u < 2560; u++) {
    const x = Math.round(rightShore(u)) + 1;
    if (u % 3 === 0) img.set(x, Y(u) - 1, 0xc8c4b8);
    if (u % 36 === 0) k.streetLamp(x + 1, u, 0xfff0c8, 6);
  }
  // the harbour head between the terminal and Oura: a hotel and offices on the curving shore
  k.slab(128, Y(1960), 30, 18, 12, { roofC: 0x7a7e84, wall: 0xd8d0c0 });
  k.slab(100, Y(1984), 24, 16, 10, { roofC: 0x6e7076, wall: 0xc8c0b0 });
  k.slab(160, Y(2010), 20, 22, 16, { roofC: 0x5e6670, wall: 0xb8b8c0 });
  k.grove(70, 180, 1930, 2080, 18, [CAMPHOR, CAMELLIA], 1901, 3, 5);

  // the Ishibashi terminus and the Oura Tenshudō stop: platforms and shelters beside the tracks
  const stop = (u0, u1) => {
    const cx = r1X((u0 + u1) / 2);
    for (let u = u0; u < u1; u++) {
      img.rect(Math.round(cx + 5.5), Y(u), 2, 1, u % 4 ? C.concrete[3] : C.concrete[2]);
      img.rect(Math.round(cx - 7.5), Y(u), 2, 1, u % 4 ? C.concrete[3] : C.concrete[2]);
    }
    for (const sx of [Math.round(cx + 5.5), Math.round(cx - 7.5)]) {
      img.rect(sx, Y(u1 - 4), 2, 8, 0x5a7a8a);
      img.rect(sx, Y(u1 - 4), 2, 1, 0x8ab0c0);
      glow(sx, Y(u1 - 6), 0xe8f4ff, 0.5 + night(u0) * 0.4);
    }
  };
  stop(TRAM_U0 + 2, TRAM_U0 + 26);
  stop(2140, 2164);

  // Glover-dori: the stone-paved shopping slope from the tram road up to the cathedral steps
  const GD = [[r1X(2084) + R1_HW + 2, 2084], [100, 2090], [124, 2097], [140, 2103]];
  path(k, GD, 4, C.stoneSet);
  const shop = (x, footU, w, noren) =>
    k.house(x, Y(footU) - 18, w, 10, 8, 'jp', { noren, wall: R.pick([0xd8ccb0, 0xc8b898, 0xe0d4bc]), roof: { gable: R() < 0.4 ? 'tri' : null } });
  // north side, facing the street; south side, their backs to it
  let sx = 66;
  for (const w of [12, 10, 14, 11]) {
    shop(sx, 2108 - (sx - 66) * 0.12, w, R.pick([0x2a4a8a, 0xe8d8b0, 0x8a2a2a, 0xf0e8d0]));
    sx += w + 1;
  }
  sx = 68;
  for (const w of [13, 12, 11, 14, 12]) {
    if (sx + w > 136) break;
    shop(sx, 2066 + (sx - 68) * 0.1, w, R.pick([0x2a4a8a, 0xe8d8b0, 0x8a2a2a]));
    sx += w + 1;
  }
  k.walkers(GD.map(([x, u]) => [x, u + 1]), 4, 2090, { sp: 3 });

  // ---- Oura Cathedral
  {
    const x0 = 114;
    const x1 = 164;
    const foot = 2116;
    const fy = Y(foot);
    const faceH = 18;
    const roofTop = Y(2196);
    // the precinct wall and the steps up from the end of Glover-dori
    terrace(k, 100, 172, 2106, 0, 0, 3);
    for (let u = 2102; u < foot; u += 2) for (let x = 130; x < 150; x++) img.set(x, Y(u), u % 4 ? C.granite[3] : C.granite[1]);
    k.reserve(x0 - 2, roofTop - 30, x1 - x0 + 4, fy - roofTop + 34);
    objects.push({
      y: fy,
      shadow: () => k.shadowRect(x0 + 4, roofTop + 4, x1 - x0, fy - roofTop, 0.5),
      draw: () => {
        // the long nave roof running north, grey slate, lit to the left of the ridge
        for (let y = roofTop; y < fy - faceH; y++)
          for (let x = x0 + 2; x < x1 - 2; x++) {
            const t = (x - (x0 + 2)) / (x1 - x0 - 4);
            let c = t < 0.5 ? rampColor(C.slate, 0.75 - t * 0.4, x, y) : rampColor(C.slate, 0.45 - (t - 0.5) * 0.6, x, y);
            if ((y - roofTop) % 3 === 0) c = scaleColor(c, 0.88);
            img.set(x, y, c);
          }
        img.rect((x0 + x1) / 2, roofTop, 1, fy - faceH - roofTop, C.slate[4]);
        // aisle roofs either side, lower
        for (const [ax, aw] of [[x0, 6], [x1 - 6, 6]])
          for (let y = roofTop + 8; y < fy - faceH; y++) for (let x = ax; x < ax + aw; x++) img.set(x, y, (y % 3 ? C.slate[1] : C.slate[0]));
        // the white front: three bays, pointed windows, corner pinnacles
        for (let y = fy - faceH; y < fy; y++)
          for (let x = x0; x < x1; x++) img.set(x, y, x === x1 - 1 ? 0xb8b4a8 : x < x0 + 2 ? 0xfaf8f0 : 0xeeeae0);
        // gable lines over the side bays
        for (const [gx, gw] of [[x0 + 2, 14], [x1 - 16, 14]]) {
          for (let j = 0; j < 5; j++) img.rect(gx + j, fy - faceH - j, gw - j * 2, 1, j === 4 ? 0xb8b4a8 : 0xf4f2e8);
          for (const wx of [gx + 3, gx + gw - 6]) {
            img.rect(wx, fy - faceH + 4, 3, 9, 0x3a4c6a);
            img.set(wx + 1, fy - faceH + 3, 0x3a4c6a);
            img.rect(wx, fy - faceH + 8, 3, 1, 0x8a7a5a);
            if (night(foot) > 0.1) {
              for (let j = 0; j < 8; j++) glow(wx + 1, fy - faceH + 4 + j, j % 3 ? 0xffd890 : 0xff9a7a, 0.35 + night(foot) * 0.35);
            }
          }
        }
        for (const px of [x0, x1 - 3, x0 + 16, x1 - 19]) {
          img.rect(px, fy - faceH - 6, 3, faceH + 6, 0xf8f6ee);
          img.rect(px + 2, fy - faceH - 6, 1, faceH + 6, 0xc0bcb0);
          img.set(px + 1, fy - faceH - 8, 0xf8f6ee);
          img.set(px + 1, fy - faceH - 7, 0xd8d4c8);
        }
        // the tower: a white square body, the octagonal grey-green spire and its cross
        const tx = (x0 + x1) / 2 - 6;
        const tTop = fy - faceH - 20;
        img.rect(tx, tTop, 12, fy - tTop, 0xf6f4ec);
        img.rect(tx + 10, tTop, 2, fy - tTop, 0xc4c0b4);
        img.rect(tx, tTop, 12, 1, 0xfffcf4);
        // its doorway (lit), rose window and the louvred belfry
        img.rect(tx + 3, fy - 9, 6, 9, 0x3a2a24);
        img.rect(tx + 4, fy - 10, 4, 1, 0x3a2a24);
        if (night(foot) > 0.05) for (let j = 0; j < 8; j++) glow(tx + 5, fy - 8 + j, C.warm, 0.55);
        img.disc(tx + 6, fy - 14, 2.5, 0x4a5a7a);
        img.set(tx + 6, fy - 14, 0xffd890);
        img.rect(tx + 3, tTop + 5, 2, 6, 0x2a3240);
        img.rect(tx + 7, tTop + 5, 2, 6, 0x2a3240);
        for (let j = 0; j < 14; j++) {
          const half = Math.max(0, 6 - Math.floor(j / 2.3));
          img.rect(tx + 6 - half, tTop - j, half * 2, 1, j % 3 === 0 ? C.copper[1] : half > 3 ? C.copper[2] : C.copper[3]);
          img.set(tx + 6 - half, tTop - j, C.copper[4]);
        }
        img.rect(tx + 5, tTop - 19, 1, 6, 0xf0d890);
        img.rect(tx + 3, tTop - 17, 5, 1, 0xf0d890);
        glow(tx + 5, tTop - 18, 0xfff0c0, 0.7);
        // the white Virgin on her pedestal at the top of the steps
        img.rect(tx + 4, fy + 4, 4, 3, 0xb8b4a8);
        img.rect(tx + 5, fy - 1, 2, 5, 0xffffff);
        img.set(tx + 5, fy - 2, 0xf4f0e8);
        img.set(tx + 4, fy + 1, 0xe8e4dc);
        img.set(tx + 7, fy + 1, 0xd8d4cc);
        pool(tx + 6, fy, 8, 0xfff4d8, 0.12 + night(foot) * 0.18);
      },
    });
    k.palm(x0 - 4, fy + 2, 7, 11);
    k.palm(x1 + 3, fy + 2, 7, 12);
    // the path past the cathedral's east side up to the garden's lower gate
    path(k, [[150, 2104], [168, 2118], [172, 2150], [172, 2200]], 1.5);
  }

  // ---- Glover Garden on its terraces (walls at 2200, 2290, 2400, 2480), the moving walkway on the east
  for (const [u, amp, ph] of [[2200, 2, 0.3], [2290, 3, 1.2], [2400, 3, 2.1], [2480, 2, 0.6]]) terrace(k, 64, 166, u, amp, ph, 4);
  for (let y = Y(2560); y < Y(2200); y++)
    for (let x = 64; x < 166; x++) {
      if (k.isRes(x, y)) continue;
      const v = 0.45 + fbm(x, y, { seed: 2207, scale: 5 }) * 0.45;
      img.set(x, y, rampColor([0x2e5a30, 0x3c6e38, 0x4e8444, 0x64984e], v, x, y));
      if ((x + y * 3) % 11 === 0) img.set(x, y, 0x5a9050);
    }
  {
    // the covered moving walkway: a glazed tube on posts, landings at every terrace
    const wx = 168;
    for (let u = 2196; u < 2486; u++) {
      const y = Y(u);
      const landing = [2200, 2290, 2400, 2480].some((t) => Math.abs(u - t) < 5);
      for (let x = wx; x < wx + 10; x++) {
        let c = x === wx || x === wx + 9 ? 0x8a9aa4 : x < wx + 3 ? 0xb8d0d8 : 0x9ab4c0;
        if (landing) c = x === wx || x === wx + 9 ? C.granite[3] : C.granite[2];
        else if (u % 6 === 0) c = 0x6a7a84;
        img.set(x, y, c);
      }
      if (!landing && u % 6 === 3 && night(u) > 0.1) glow(wx + 5, y, 0xe8f4ff, 0.45);
    }
    k.reserve(wx, Y(2486), 10, 290);
  }
  // paths: along each terrace from the walkway landings, stairs through the walls at the west end
  path(k, [[168, 2205], [66, 2205], [r1X(2205) + R1_HW + 2, 2205]], 1.5);
  path(k, [[168, 2296], [76, 2296], [72, 2292], [72, 2208]], 1.5);
  path(k, [[168, 2406], [72, 2406], [68, 2400], [68, 2300]], 1.5);
  path(k, [[168, 2486], [128, 2486], [126, 2492], [126, 2540]], 1.5);
  for (const [x, u0, u1] of [[71, 2196, 2210], [67, 2286, 2300], [67, 2396, 2410]]) for (let u = u0; u < u1; u += 2) img.rect(x, Y(u), 3, 1, C.granite[1]);

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
      // the rounded bay of each wing
      k.objects.push({
        y: Y(foot) + 1,
        draw: () => {
          for (let i = 0; i < ww - 2; i++) {
            const dy = Math.round(Math.sin((i / (ww - 3)) * Math.PI) * 2);
            img.set(wx + 1 + i, y + 23 + dy, C.granite[3]);
            if (i % 3 === 0) img.rect(wx + 1 + i, y + 14 + dy, 1, 9, 0xf8f4ea);
          }
        },
      });
    }
    // the conservatory at the west end: a glasshouse with plants inside
    k.objects.push({
      y: Y(foot) + 1,
      shadow: () => k.shadowRect(68, Y(foot) - 14, 10, 14, 0.6),
      draw: () => {
        const y = Y(foot) - 15;
        for (let yy = y; yy < y + 15; yy++)
          for (let x = 66; x < 78; x++) img.set(x, yy, (x - 66) % 3 === 0 || (yy - y) % 4 === 0 ? 0xd8e4e0 : yy < y + 6 ? 0x9ac4c8 : 0x4a7a5a);
        for (let i = 0; i < 6; i++) img.set(67 + i * 2, y + 9 + (i % 2), 0xd87a9a);
        if (night(foot) > 0.1) for (let i = 0; i < 4; i++) glow(68 + i * 3, y + 10, C.warm, 0.4);
      },
    });
    k.reserve(65, Y(foot) - 16, 14, 17);
    // the pond with its stone edge, carp and lilies, the little bridge, the Miura Tamaki statue
    const py = Y(2310);
    k.shadowEllipse(156, py, 15, 9, 1);
    img.ellipse(156, py, 15, 9, C.granite[3]);
    img.ellipse(156, py, 13, 7, 0x1e4a4e);
    img.ellipse(154, py - 1, 9, 4, 0x2a5e5e);
    for (const [cx, cy, c] of [[150, py + 1, 0xf08a3a], [158, py - 2, 0xf4f0e8], [161, py + 2, 0xe85a2a], [153, py - 3, 0x5a8a5a], [163, py - 1, 0x4a7a4a]]) {
      img.set(cx, cy, c);
      img.set(cx + 1, cy, scaleColor(c, 0.8));
    }
    for (let i = 0; i < 6; i++) img.set(144 + i, py - Math.round(Math.sin((i / 5) * Math.PI) * 2), 0xb08a5a);
    k.reserve(140, py - 10, 32, 20);
    objects.push({
      y: Y(2306),
      draw: () => {
        const y = Y(2306);
        img.rect(134, y - 2, 5, 3, C.granite[2]);
        img.rect(135, y - 8, 3, 6, 0x6a8a7a);
        img.set(136, y - 9, 0x4a5a52);
        img.rect(134, y - 6, 1, 3, 0x6a8a7a);
        img.set(138, y - 6, 0x8ab0a0);
      },
    });
  }
  // Mitsubishi No. 2 Dock House: two storeys of verandas, and the small Walker House
  westernHouse(k, 104, 2414, 52, 15, 16, { floors: 2, ramp: C.slate, slate: true, shutter: 0x4a7a6a, rail: 0x6a9a7a, postGap: 4, chimneys: [112, 146] });
  westernHouse(k, 70, 2412, 28, 12, 9, { ramp: C.kawara, wall: 0xe8dcc4, chimneys: [76] });
  // planting: palms, camellias, cherry, hydrangea and azalea beds, lamps along the walks
  for (const [x, u] of [[92, 2240], [150, 2250], [84, 2350], [116, 2360], [158, 2440], [96, 2452]]) k.palm(x, Y(u), 6, x + u);
  k.grove(66, 166, 2210, 2560, 40, [CAMELLIA, CAMPHOR, SAKURA], 2211, 3, 5);
  flowers(k, 66, Y(2290) + 2, 100, 80, HYDRANGEA, 260, 3);
  flowers(k, 66, Y(2400) + 2, 100, 100, [0xe86a9a, 0xf4a0c0, 0xffffff, 0xd84a7a], 220, 4);
  flowers(k, 66, Y(2480) + 2, 100, 70, HYDRANGEA, 180, 5);
  flowers(k, 66, Y(2560) + 2, 100, 70, [0xe86a9a, 0xf4a0c0, 0xd84a7a, 0xf8e070], 160, 6);
  for (const u of [2208, 2300, 2410, 2490]) for (let x = 80; x < 166; x += 22) k.streetLamp(x, u, 0xfff0c8, 5);
  k.strollers(116, 2300, 40, 6, 5);
  k.strollers(116, 2208, 40, 4, 3);
  k.strollers(116, 2410, 40, 4, 3);

  // ---- Oranda-zaka: the Dutch Slope's cobbles from the upper gate down to the coast road, wooden houses on it
  path(k, [[126, 2540], [128, 2570], [122, 2596], [r1X(2602) + R1_HW + 2, 2602]], 3, C.stoneSet);
  for (let u = 2540; u < 2600; u += 3) img.set(126 + Math.round((u - 2540) * 0.05), Y(u), 0x5a5a56);
  westernHouse(k, 140, 2556, 30, 12, 9, { wall: 0xdcd4c0, ramp: C.slate, slate: true, shutter: 0x6a4a3a, chimneys: [146] });
  westernHouse(k, 136, 2610, 36, 12, 10, { wall: 0xe8e0cc, ramp: C.kawara, shutter: 0x3a6a5a, chimneys: [160] });
  westernHouse(k, 96, 2574, 22, 11, 8, { wall: 0xd8ccb4, ramp: C.kawara, chimneys: [100] });
  k.grove(80, 180, 2540, 2660, 16, [CAMELLIA, CAMPHOR, SAKURA], 2541, 3, 5);
  k.grove(170, 180, 2660, 2990, 6, [CAMPHOR], 2661, 2.5, 3.5);
}

// ---------------------------------------------------------------------------------------------- Dejima
export function paintDejima(k) {
  const { img, Y, kit, objects, glow, pool } = k;
  const R = rng(1636);
  const { x0, x1, gate } = DEJIMA;
  const mid = (x) => (dejimaSouth(x) + dejimaNorth(x)) / 2;

  // the Wharf: a timber boardwalk on piles along the bay's east shore, restaurants with lamps and parasols
  for (let u = 2662; u < 2792; u++) {
    const y = Y(u);
    for (let x = 128; x < 150; x++) img.set(x, y, (x + Math.floor(u / 2)) % 4 === 0 ? C.wood[1] : (u % 2 ? C.wood[2] : C.wood[3]));
    img.set(127, y, C.wood[0]);
    if (u % 8 === 0) img.set(127, y + 1, 0x101418, 0.5);
  }
  k.reserve(127, Y(2792), 24, 132);
  for (let u = 2670; u < 2790; u += 30) {
    k.house(140, Y(u + 20), 10, 8, 10, 'jp', { wall: R.pick([0xc8a878, 0xb89868, 0xd8c098]), noren: R.pick([0x8a2a2a, 0x2a4a8a, 0xe8d8b0]) });
    for (const dy of [4, 14]) {
      const c = R.pick([0xe8e4d8, 0xd85a4a, 0x3a7a5a]);
      img.disc(134, Y(u + dy), 3, c);
      img.set(133, Y(u + dy) - 1, scaleColor(c, 1.15));
      glow(134, Y(u + dy), 0xffd090, 0.3 + night(u) * 0.4);
    }
    k.streetLamp(129, u + 22, 0xffe0a8, 5);
  }
  k.strollers(136, 2730, 6, 50, 6);

  // the island: earth and stone flags, its walls (faces drawn with the shores), the tile-capped perimeter wall
  for (let u = 2795; u < 2950; u++)
    for (let x = x0; x <= x1; x++) {
      if (!k.wet(x, Y(u)) && u >= dejimaSouth(x) && u <= dejimaNorth(x)) img.set(x, Y(u), rampColor(C.sand, 0.3 + fbm(x, u, { seed: 1641, scale: 4 }) * 0.6, x, Y(u)));
    }
  for (let x = x0 + 1; x < x1; x++) {
    for (const [uu, inward] of [[dejimaSouth(x) + 1, 1], [dejimaNorth(x) - 1, -1]]) {
      const y = Y(Math.round(uu));
      img.set(x, y, 0xe8e4d8);
      img.set(x, y - inward, 0x3a3e46);
      img.set(x, y - inward * 2, x % 2 ? 0x4a505a : 0x5a606a);
    }
  }
  // the island's lane, curving with the fan, and the buildings either side of it
  for (let x = x0 + 4; x < x1 - 4; x++) for (let j = -2; j <= 2; j++) img.set(x, Y(Math.round(mid(x)) + j), j === 0 && x % 3 ? C.paving[3] : C.paving[2]);
  for (let x = x0 + 4; x < x1 - 4; x++) k.reserve(x, Y(Math.round(mid(x)) + 3), 1, 6);
  const at = (x, side) => Math.round(side > 0 ? dejimaNorth(x) - 6 : mid(x) - 4);
  // namako-walled warehouses on the seaward side: dark tiles under a white diagonal grid
  const kura = (x, w) => {
    const foot = Math.round(dejimaSouth(x + w / 2) + 6);
    const top = Math.round(mid(x + w / 2) - 4);
    const y = Y(top);
    const h = top - foot;
    objects.push({
      y: Y(foot),
      shadow: () => k.shadowRect(x + 2, y + 2, w, h, 0.55),
      draw: () => {
        k.roof(x - 1, y, w + 2, Math.round(h * 0.55), C.kawara, { ridgeC: 0xe8e4d8 });
        const fy = y + Math.round(h * 0.55);
        for (let yy = fy; yy < y + h; yy++)
          for (let xx = x; xx < x + w; xx++) {
            const top2 = yy - fy < 3;
            const grid = (xx + yy) % 4 === 0 || (xx - yy + 400) % 4 === 0;
            img.set(xx, yy, top2 ? 0xf2eee4 : grid ? 0xe8e4d8 : 0x3e4450);
          }
        img.rect(x + Math.floor(w / 2) - 2, y + h - 5, 4, 5, 0x5a4232);
        img.rect(x + Math.floor(w / 2) - 2, y + h - 5, 4, 1, 0x2a2a2a);
      },
    });
    k.reserve(x, y, w, h);
  };
  kura(30, 18);
  kura(50, 16);
  kura(98, 16);
  // the 1:15 model of Dejima in its courtyard: a tiny fan with tiny roofs in a blue moat
  {
    const cx = 79;
    const cy = Y(Math.round(dejimaSouth(79) + 12));
    k.objects.push({
      y: cy + 4,
      draw: () => {
        img.ellipse(cx, cy, 11, 5, 0x3a7a9a);
        for (let x = -8; x <= 8; x++) for (let j = 0; j < 4; j++) img.set(cx + x, cy - 2 + j + Math.round((x * x) / 30), 0xc8b890);
        for (let x = -7; x <= 7; x += 2) img.set(cx + x, cy - 1 + Math.round((x * x) / 30), 0x4a4e58);
        img.set(cx, cy - 4, 0xd83a2a);
      },
    });
    k.reserve(cx - 12, cy - 6, 24, 11);
  }
  // the Protestant seminary (white, two storeys, 1878) and the club house at either end of the seaward row
  westernHouse(k, 118, Math.round(dejimaSouth(128) + 6), 20, 10, 12, { floors: 2, wall: 0xf4f0e8, ramp: C.slate, slate: true, veranda: false, chimneys: [122], shutter: 0x5a6a7a });
  westernHouse(k, 24, Math.round(dejimaNorth(30) - 34), 18, 10, 10, { wall: 0xb8c8c8, ramp: C.slate, slate: true, veranda: false, chimneys: [28], shutter: 0x4a5a6a });
  // landward row: the Chief Factor's residence by the gate with its outside stair, other residences, the flag
  const residence = (x, w, big = false) => {
    const foot = Math.round(mid(x + w / 2) + 4);
    const top = Math.round(dejimaNorth(x + w / 2) - 4);
    const y = Y(top);
    const h = top - foot;
    objects.push({
      y: Y(foot),
      shadow: () => k.shadowRect(x + 2, y + 2, w, h, 0.55),
      draw: () => {
        const rh = Math.round(h * 0.5);
        k.roof(x - 1, y, w + 2, rh, C.kawara, {});
        for (let yy = y + rh; yy < y + h; yy++)
          for (let xx = x; xx < x + w; xx++) img.set(xx, yy, (yy - y - rh) < (h - rh) / 2 ? 0xe6dcc4 : (xx % 4 === 0 ? C.oldWood[1] : C.oldWood[3]));
        img.rect(x, y + rh + Math.floor((h - rh) / 2), w, 1, C.oldWood[0]);
        k.panes(x + 1, y + rh + 1, w - 2, Math.floor((h - rh) / 2) - 1, 2900, { bay: 3, row: 3, pw: 2, ph: 1, sill: false });
        if (big) {
          // the outside stair under its own little roof, up to the first floor
          const sx = x + w - 9;
          for (let j = 0; j < 7; j++) img.rect(sx + j, y + h - 1 - j, 2, 1, C.oldWood[2]);
          img.rect(sx, y + rh - 3, 10, 3, C.kawara[2]);
          img.rect(sx, y + rh - 3, 10, 1, C.kawara[3]);
        }
      },
    });
    k.reserve(x, y, w, h);
  };
  residence(30, 20);
  residence(54, 14);
  residence(98, 24, true);
  residence(124, 14);
  // the Dutch tricolour on its tall pole in the Chief Factor's garden
  {
    const fx = 86;
    const fu = Math.round(mid(86) + 6);
    objects.push({
      y: Y(fu) + 1,
      shadow: () => k.shadowRect(fx + 1, Y(fu) - 1, 8, 2, 0.6),
      draw: () => {
        img.rect(fx, Y(fu) - 34, 1, 34, 0xd8d4c8);
        img.set(fx, Y(fu) - 35, C.gold);
      },
    });
    const flag = [0, 1, 2].map((f) =>
      k.sprite(12, 9, fu, (r) => {
        for (let x = 0; x < 11; x++) {
          const dy = Math.round(Math.sin(x * 0.6 + f * 2) * (x / 10));
          r.set(x, 1 + dy, 0xc8302a);
          r.set(x, 2 + dy, 0xc8302a);
          r.set(x, 3 + dy, 0xf4f0e8);
          r.set(x, 4 + dy, 0xf4f0e8);
          r.set(x, 5 + dy, 0x2a4a9a);
          r.set(x, 6 + dy, 0x2a4a9a);
        }
      }),
    );
    kit.loop(fx + 1, fu + 34, flag, { fps: 3 });
    k.tree(74, Y(fu) - 6, 4, PINE, 1636, 'pine');
    k.tree(66, Y(fu) - 2, 3.5, CAMPHOR, 1637);
  }
  // the water gate on the seaward wall: steps down to the landing stage
  for (let j = 0; j < 4; j++) img.rect(44, Y(Math.round(dejimaSouth(46))) + j, 6, 1, j % 2 ? C.granite[1] : C.granite[3]);
  img.rect(42, Y(Math.round(dejimaSouth(46))) + 4, 10, 2, C.wood[2]);
  // the Omotemon gate and its bridge over the channel to the town
  {
    const gy = Y(Math.round(dejimaNorth(gate)));
    objects.push({
      y: gy + 3,
      draw: () => {
        img.rect(gate - 6, gy - 7, 2, 8, C.oldWood[0]);
        img.rect(gate + 5, gy - 7, 2, 8, C.oldWood[0]);
        k.roof(gate - 8, gy - 12, 17, 5, C.kawara, {});
        img.rect(gate - 4, gy - 5, 9, 6, 0x2a2622);
      },
    });
    const by0 = Y(EMBANK + 8);
    for (let y = by0; y <= gy; y++)
      for (let x = gate - 5; x <= gate + 5; x++) {
        const edge = Math.abs(x - gate) >= 4;
        img.set(x, y, edge ? (y % 3 ? 0x8a6a4a : 0x5a4232) : (y % 2 ? C.wood[2] : C.wood[3]));
      }
    for (let x = gate - 5; x <= gate + 5; x++) img.set(x, gy + 1, 0x101418, 0.4);
    k.reserve(gate - 6, by0, 13, gy - by0 + 1);
    k.walkers([[gate, EMBANK + 10], [gate, Math.round(dejimaNorth(gate)) - 2]], 2, 2950, { sp: 3 });
  }
  k.strollers(80, Math.round(mid(80)), 40, 2, 6);
  // a few boats in the bay
  for (const [x, u] of [[60, 2720], [16, 2860], [112, 2690]]) {
    img.rect(x, Y(u), 4, 9, 0xe8e4d8);
    img.rect(x + 1, Y(u) + 2, 2, 4, 0x3a6a8a);
    img.set(x + 4, Y(u) + 8, 0x061420, 0.4);
  }
}

// ---------------------------------------------------------------------------------------------- Shinchi
export function paintShinchi(k) {
  const { img, Y, kit, objects, glow, pool } = k;
  const R = rng(1698);
  const CROSS = STREETS.find((s) => s.u === 3330);
  const roofs = [C.chinaGreen, C.redTile, C.chinaGreen, C.kawara];
  // quadrants of shops: rows facing south, red and green, lanterns and signs, steam from the kitchens
  const quads = [[33, 84, 2998, 3322], [100, 152, 2998, 3322], [33, 84, 3338, 3652], [100, 152, 3338, 3652]];
  for (const [qx0, qx1, qu0, qu1] of quads) {
    for (let u = qu0; u + 16 <= qu1; u += 24) {
      const h = Math.min(23, qu1 - u);
      let x = qx0;
      while (x < qx1 - 5) {
        let w = 9 + Math.floor(R() * 9);
        if (qx1 - x - w < 7) w = qx1 - x;
        const yTop = Y(u + h);
        if (!k.anyRes(x, yTop, w, h)) {
          const tall = R() < 0.3;
          const style = tall ? 'block' : 'china';
          const rh = tall ? 9 : Math.round(h * 0.45);
          k.house(x, yTop, w - 1, rh, h - rh, style, {
            ramp: R.pick(roofs),
            wall: R.pick([0x8a3a32, 0xa8483a, 0x7a5a48, 0xd8c8a8, 0x6a7a6a, 0xc8a070]),
            roofC: R.pick([0x6a6e74, 0x5a6068, 0x7a7068]),
            noren: R.pick([0xc8302a, 0xe8b830, 0x2a6a4a]),
            extra: (by) => {
              // signboards and a pair of lanterns on the front
              if (w > 10) {
                const sx = x + 1;
                img.rect(sx, by - 10, 2, 8, R.pick([0xe8b830, 0xc8302a, 0x2aa86a]));
                img.set(sx, by - 11, 0x2a2026);
                glow(sx, by - 8, 0xffd080, 0.35 + night(u) * 0.4);
              }
              for (const lx of [x + 2, x + w - 4]) {
                img.set(lx, by - 4, 0xe83a2a);
                img.set(lx, by - 5, 0xc8302a);
                glow(lx, by - 4, 0xff6a3a, 0.5 + night(u) * 0.4);
              }
              pool(x + w / 2, by, 6, 0xff7040, 0.08 + night(u) * 0.14);
            },
          });
        }
        x += w + 1;
      }
    }
  }
  // the main street: lanterns strung overhead, sways gently; steamers of kakuni-manju; people everywhere
  const string = [0, 1, 2].map((f) =>
    k.sprite(15, 8, 3300, (r) => {
      r.line(0, 1, 14, 1, 0x6a4a3a);
      for (let x = 1; x < 15; x += 4) {
        const dy = (x + f) % 2;
        r.ellipse(x + 0.5, 4 + dy, 1.6, 2.2, 0xe83a2a);
        r.set(x, 3 + dy, 0xff9a6a);
        r.set(x, 6 + dy, 0xe8b830);
      }
    }, false),
  );
  for (let u = 3020; u < 3640; u += 26) kit.loop(CHINA_X - 7, u, string, { fps: 1.2, d: 0.6 });
  for (let u = 3020; u < 3640; u += 26) for (let x = CHINA_X - 6; x < CHINA_X + 7; x += 4) k.pool(x, Y(u) + 5, 4, 0xff5a30, 0.12 + night(u) * 0.2);
  for (let u = 3006; u < 3646; u += 38) k.crowd(CHINA_X - 6, Y(u + 30), 12, 30, 6);
  k.walkers([[CHINA_X - 3, 3006], [CHINA_X - 3, 3646]], 6, 3300, { sp: 3, gap: 90 });
  k.walkers([[CHINA_X + 3, 3646], [CHINA_X + 3, 3006]], 6, 3300, { sp: 3, gap: 100 });
  k.walkers([[34, CROSS.u + 2], [150, CROSS.u + 2]], 4, 3330, { sp: 3, gap: 30 });
  const steam = Array.from({ length: 4 }, (_, f) =>
    k.sprite(12, 19, 3300, (r) => {
      for (let q = 0; q < 4; q++) r.ellipse(5 + Math.sin(q + f) * 2, 16 - q * 4 - f, 2 + q, 2, 0xe8e0d0, 0.2 - q * 0.04);
    }, false),
  );
  for (const [x, u] of [[CHINA_X - 9, 3110], [CHINA_X + 8, 3240], [CHINA_X - 9, 3420], [CHINA_X + 8, 3560]]) {
    img.rect(x - 1, Y(u), 4, 3, 0x9a8a6a);
    img.rect(x - 1, Y(u), 4, 1, 0xd8c8a0);
    kit.loop(x - 5, u + 18, steam, { fps: 3, fx: 1 });
  }
  // the four gates: south and north across the main street, west and east across the cross street
  const paifang = (cx, footU, half) => {
    const y = Y(footU);
    objects.push({
      y: y + 1,
      shadow: () => k.shadowRect(cx - half + 3, y - 2, half * 2, 4, 0.55),
      draw: () => {
        for (const px of [cx - half, cx - Math.round(half / 3), cx + Math.round(half / 3) - 1, cx + half - 2]) {
          img.rect(px, y - 16, 2, 17, C.vermilion[2]);
          img.set(px + 1, y - 16, C.vermilion[3]);
          img.rect(px - 1, y, 4, 1, C.granite[2]);
        }
        img.rect(cx - half - 1, y - 14, half * 2 + 2, 2, C.vermilion[1]);
        img.rect(cx - 5, y - 13, 10, 4, 0x1a3a5a);
        img.rect(cx - 4, y - 12, 8, 2, C.gold);
        k.roof(cx - half - 4, y - 22, half * 2 + 8, 7, C.chinaGreen, { curl: true, ridgeC: C.vermilion[2] });
        k.roof(cx - Math.round(half / 2) - 2, y - 27, half + 4, 5, C.chinaGreen, { curl: true, ridgeC: C.gold });
        glow(cx - half, y - 10, 0xff6a3a, 0.7);
        glow(cx + half - 1, y - 10, 0xff6a3a, 0.7);
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
        for (const py of [y - CROSS.hw - 1, y + CROSS.hw]) {
          img.rect(cx, py - 12, 2, 13, C.vermilion[2]);
          img.set(cx + 1, py - 12, C.vermilion[3]);
        }
        for (let yy = y - CROSS.hw - 16; yy < y + CROSS.hw - 9; yy++)
          for (let x = cx - 3; x < cx + 6; x++) img.set(x, yy, (yy - y) % 2 ? C.chinaGreen[2] : C.chinaGreen[3]);
        img.rect(cx - 4, y - CROSS.hw - 17, 11, 1, C.vermilion[2]);
        img.rect(cx - 3, y + CROSS.hw - 9, 9, 1, C.chinaGreen[0]);
        img.rect(cx, y - 6, 2, 4, C.gold);
      },
    });
  };
  sideGate(36, CROSS.u);
  sideGate(148, CROSS.u);
  // the Tsukimachi tram stop on R1
  for (let u = 3090; u < 3118; u++) {
    img.rect(162 + 6, Y(u), 2, 1, u % 4 ? C.concrete[3] : C.concrete[2]);
    img.rect(162 - 7, Y(u), 2, 1, u % 4 ? C.concrete[3] : C.concrete[2]);
  }
  for (const sx of [168, 155]) {
    img.rect(sx, Y(3114), 2, 8, 0x5a7a8a);
    glow(sx, Y(3112), 0xe8f4ff, 0.7);
  }
  // R1's east verge: a row of narrow buildings at the very edge
  for (let u = 2998; u < 3650; u += 20) if (!k.anyRes(174, Y(u + 18), 6, 18)) k.house(174, Y(u + 18), 6, 8, 9, 'block', { roofC: 0x5a6068 });
}
