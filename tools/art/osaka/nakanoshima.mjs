// Nakanoshima's three great buildings, in fine pixels, each on the ground its old block-drawn self stood on:
// the Central Public Hall (red brick banded in white granite, copper roofs, the barrel vault over its hall, the great
// arched window of its front, a domed turret at every corner), City Hall (a granite block round a glazed court, the
// city's mark on its front, flags), and the Nakanoshima Library (pale stone, a portico of four columns under a
// pediment, the copper dome with its lantern).
import { scaleColor, mix } from '../../lib/raster.mjs';
import { hashPx } from '../hires.mjs';

const COPPER = [0x2a6252, 0x3a7c6a, 0x4e9682, 0x6ab09c, 0x98cebe];
const BRICK = [0x7a3020, 0x96402a, 0xb25236, 0xc66442];
const GRANITE = [0xa8a294, 0xc4beb0, 0xdcd6c8, 0xf0ece0];

/** A small copper dome on a drum, lit from the upper left, a gilt finial. */
function dome(img, CX, CY, R, drum = BRICK[1]) {
  for (let j = 0; j < 5; j++) for (let i = -R; i <= R; i++) img.px(CX + i, CY + R - 2 + j, j === 0 || j === 4 ? GRANITE[3] : i > R * 0.4 ? scaleColor(drum, 0.75) : drum);
  for (let j = -R; j <= R; j++)
    for (let i = -R; i <= R; i++) {
      const d = Math.hypot(i, j * 1.12);
      if (d > R) continue;
      const lit = (-i - j * 1.1) / (R * 1.5); // -1 (lower right) .. 1 (upper left)
      let c = COPPER[Math.max(0, Math.min(4, Math.round(2 + lit * 2.2 - (d / R) ** 3 * 0.8)))];
      const mer = Math.abs((Math.atan2(j, i) * 8) / Math.PI) % 2;
      if (d > R * 0.25 && (mer < 0.16 || mer > 1.84)) c = scaleColor(c, 0.82); // the ribs
      if (d > R - 1) c = COPPER[0];
      img.px(CX + i, CY + j, c);
    }
  img.px(CX - Math.round(R * 0.35), CY - Math.round(R * 0.4), 0xd8f0e8);
  for (let j = 0; j < 3; j++) img.px(CX, CY - 1 - j, j === 2 ? 0xfff0a0 : 0xe8b830);
  img.px(CX + 1, CY - 1, 0xb88a20);
}

/** The Central Public Hall: 40 logical wide; (x, y) the roof's upper left, 24 of roof, 14 of front below it. */
export function publicHall({ img, S, glowPx }, x, y) {
  const X0 = x * S;
  const Y0 = y * S;
  const WW = 40 * S;
  const RH = 24 * S;
  const FH = 14 * S;
  // the roofs: copper in standing seams, hipped to a granite cornice
  for (let j = 0; j < RH; j++)
    for (let i = 0; i < WW; i++) {
      const e = Math.min(i, WW - 1 - i, j, RH - 1 - j);
      let c;
      if (e < 2) c = e === 0 ? (i === WW - 1 || j === RH - 1 ? GRANITE[0] : GRANITE[3]) : GRANITE[2];
      else if (e < 4) c = BRICK[e === 2 ? 2 : 0];
      else {
        const side = e === i ? 3 : e === WW - 1 - i ? 1 : e === j ? 2 : 3;
        c = COPPER[side];
        const seam = e === i || e === WW - 1 - i ? j % 4 : i % 4;
        if (seam === 0) c = scaleColor(c, 0.84);
        else if (seam === 1) c = scaleColor(c, 1.08);
        if (hashPx(i >> 2, j >> 2, 501) < 0.12) c = mix(c, 0x6a8a6a, 0.3); // verdigris, streaked
        if (e === 4) c = COPPER[0];
      }
      img.px(X0 + i, Y0 + j, c);
    }
  // the barrel vault over the great hall, north to south; ox-eye windows along its flanks
  const [b0, b1] = [36, 83];
  for (let j = 5; j < RH; j++)
    for (let i = b0; i <= b1; i++) {
      const t = ((i - b0) / (b1 - b0)) * 2 - 1; // across the vault
      let c = COPPER[Math.max(0, Math.min(4, Math.round(2.4 - t * 1.6 - Math.abs(t) ** 3 * 1.2)))];
      if (j % 8 === 5) c = scaleColor(c, 0.8); // the ribs
      else if (j % 8 === 6) c = scaleColor(c, 1.1);
      if (i === b0 || i === b1) c = COPPER[0];
      if (j === 5) c = COPPER[4];
      img.px(X0 + i, Y0 + j, c);
    }
  for (let j = 14; j < RH - 8; j += 16)
    for (const [ci, s] of [[b0 + 7, -1], [b1 - 7, 1]]) {
      for (let dj = -3; dj <= 3; dj++) for (let di = -2; di <= 2; di++) if ((di / 2.4) ** 2 + (dj / 3.4) ** 2 <= 1) img.px(X0 + ci + di, Y0 + j + dj, Math.abs(di) === 2 || Math.abs(dj) === 3 ? GRANITE[3] : s < 0 ? 0x4a6a80 : 0x24303c);
    }
  // a lantern on the vault's crown, the ridge
  for (let j = 8; j < RH - 4; j++) img.px(X0 + 59, Y0 + j, COPPER[4]);
  for (let dj = 0; dj < 7; dj++) for (let di = -3; di <= 3; di++) img.px(X0 + 59 + di, Y0 + 30 + dj, dj === 0 ? COPPER[4] : di === -3 ? GRANITE[3] : di === 3 ? GRANITE[0] : dj < 3 ? COPPER[2] : 0x2a3844);
  // dormers on the side roofs
  for (const ci of [18, 101])
    for (const cj of [22, 46]) {
      for (let dj = 0; dj < 8; dj++) for (let di = -4; di <= 4; di++) if (Math.abs(di) <= dj + 1) img.px(X0 + ci + di, Y0 + cj + dj, dj > 4 ? (Math.abs(di) === 4 ? GRANITE[2] : 0x2a3844) : di < 0 ? COPPER[4] : COPPER[1]);
    }
  // the front: brick banded in granite, the great arch with its fan of glazing, three doors under it, tall
  // windows in the wings, pilasters, a granite base; the steps
  const FY = Y0 + RH;
  const [ax, ay, ar] = [59.5, 27, 21];
  for (let j = 0; j < FH; j++)
    for (let i = 0; i < WW; i++) {
      let c = j % 6 === 4 ? GRANITE[2] : BRICK[1 + ((i + (j >> 1) * 3) % 5 === 0 ? 0 : hashPx(i >> 1, j, 502) < 0.3 ? 2 : 1)];
      if (j < 2) c = j ? GRANITE[1] : GRANITE[3]; // the cornice
      if (j > FH - 5) c = GRANITE[j === FH - 1 ? 0 : 1];
      const pil = i < 4 || i > WW - 5 || (i > 29 && i < 34) || (i > 85 && i < 90);
      if (pil && j > 1) c = j % 6 === 4 ? GRANITE[3] : i % 2 ? GRANITE[2] : GRANITE[1];
      const d = Math.hypot(i - ax, (j - ay) * 1.0);
      if (j <= ay && d < ar + 2.5) {
        // the arch
        if (d > ar) c = (Math.atan2(ay - j, i - ax) * 14) % 2 < 1 ? GRANITE[3] : BRICK[2];
        else {
          const fan = (Math.atan2(ay - j, i - ax) * 16) / Math.PI;
          c = Math.abs(fan - Math.round(fan)) < 0.09 || Math.abs(d - ar * 0.5) < 0.6 || Math.abs(d - ar + 1) < 0.6 ? GRANITE[3] : d < ar * 0.5 ? 0x3a5068 : (i + j) % 7 < 2 ? 0x5a7a94 : 0x2c3e52;
        }
      } else if (j > ay && j < FH - 1 && i > ax - ar - 1 && i < ax + ar + 1) {
        // under the arch: a granite band, the three doors
        const q = (i - (ax - ar)) % 14;
        c = j < ay + 3 ? GRANITE[j === ay + 1 ? 3 : 2] : q > 2 && q < 12 ? (q === 7 ? 0x6a4a2a : j < ay + 5 ? 0x8a6a3a : 0x2a1c16) : GRANITE[2];
      } else if (!pil && j > 7 && j < FH - 6) {
        // the wings' windows, two storeys of them
        const q = (i < 30 ? i - 4 : i - 90) % 9;
        const upper = j < 22;
        if (q > 2 && q < 7 && (upper ? j > 8 : j > 25 && j < 35)) c = q === 3 || (upper ? j === 9 : j === 26) ? GRANITE[3] : (j + q) % 5 === 0 ? 0x6a8aa0 : 0x283642;
      }
      if (i >= WW - 2) c = scaleColor(c, 0.72);
      img.px(X0 + i, FY + j, c);
    }
  for (let j = 0; j < 6; j++) for (let i = 34 - j; i < 86 + j; i++) img.px(X0 + i, FY + FH + j, j % 2 ? GRANITE[1] : GRANITE[3]);
  for (const i of [44, 59, 74]) glowPx(X0 + i, FY + ay + 6, 0xffd890, 0.6);
  // a turret at every corner, the front pair taller
  for (const [ci, cj, r] of [[8, -6, 7], [WW - 9, -6, 7], [8, RH - 12, 8], [WW - 9, RH - 12, 8]]) dome(img, X0 + ci, Y0 + cj, r);
}

/** City Hall: 32 wide; 22 of roof, 14 of front. */
export function cityHall({ img, S, glowPx }, x, y) {
  const X0 = x * S;
  const Y0 = y * S;
  const WW = 32 * S;
  const RH = 22 * S;
  const FH = 14 * S;
  for (let j = 0; j < RH; j++)
    for (let i = 0; i < WW; i++) {
      const e = Math.min(i, WW - 1 - i, j, RH - 1 - j);
      let c;
      if (e < 3) c = e === 0 ? (i === 0 || j === 0 ? GRANITE[3] : GRANITE[0]) : e === 1 ? GRANITE[2] : 0x7a766c;
      else {
        c = [0x8e8a80, 0x9a968c, 0xa6a298][Math.floor(hashPx(i >> 3, j >> 3, 511) * 3)];
        if (i % 12 === 0 || j % 12 === 0) c = scaleColor(c, 0.9);
        // the glazed court in its middle: a grid of panes, the sky in them, a truss across
        const [ci, cj] = [i - 26, j - 14];
        if (ci >= 0 && ci < 44 && cj >= 0 && cj < 34) {
          const ee = Math.min(ci, 43 - ci, cj, 33 - cj);
          c = ee < 2 ? (ee ? 0x5a5e66 : GRANITE[3]) : ci % 7 === 1 || cj % 8 === 1 ? 0xb8c4cc : (ci + cj * 2) % 23 < 9 ? 0x8ab0cc : 0x5a84a8;
          if (ee >= 2 && Math.abs(ci - cj * 1.3) < 1) c = 0xd8e8f0;
        }
        // the roof garden along its south edge: box hedges, a walk
        if (j > RH - 15 && j < RH - 5 && i > 6 && i < WW - 7 && !(ci >= -2 && ci < 46 && cj < 36)) c = (i >> 1) % 9 < 6 ? (hashPx(i, j, 512) < 0.5 ? 0x3e6e34 : 0x528644) : 0xc8bea8;
      }
      img.px(X0 + i, Y0 + j, c);
    }
  // plant on the roof: two cooling towers with their fans, a machine room
  for (const [ci, cj] of [[10, 12], [10, 30], [84, 12]]) {
    for (let dj = 0; dj < 12; dj++) for (let di = 0; di < 11; di++) img.px(X0 + ci + di, Y0 + cj + dj, dj === 0 || di === 0 ? 0xd8d8d4 : di === 10 || dj === 11 ? 0x5a5c60 : 0xa8aaac);
    for (let a = 0; a < 6.3; a += 0.3) img.px(X0 + ci + 5 + Math.cos(a) * 3.4, Y0 + cj + 5 + Math.sin(a) * 3.4, 0x3a3c42);
    img.px(X0 + ci + 5, Y0 + cj + 5, 0x1a1c20);
  }
  for (let dj = 0; dj < 16; dj++) for (let di = 0; di < 14; di++) img.px(X0 + 78 + di, Y0 + 30 + dj, dj < 3 ? 0xe8e4d8 : di > 11 ? 0x6a665c : 0xb8b2a4);
  // the front: granite piers the whole height, bands of dark glass between, the city's mark over the doors, a
  // canopy, the doors lit
  const FY = Y0 + RH;
  for (let j = 0; j < FH; j++)
    for (let i = 0; i < WW; i++) {
      let c = GRANITE[1];
      const q = i % 8;
      if (j < 3) c = GRANITE[j === 0 ? 3 : 2];
      else if (j > FH - 9) c = q < 2 ? GRANITE[2] : j > FH - 3 ? GRANITE[0] : (i >> 3) % 2 ? 0x2a3440 : 0x3e5264; // the colonnade at its foot
      else if (q >= 2 && q < 7) c = j % 5 === 3 ? 0x8a8e94 : hashPx(i >> 3, Math.floor(j / 5), 513) < 0.35 ? 0x6a90ac : 0x34485a;
      else c = q === 0 ? GRANITE[3] : GRANITE[1];
      if (i >= WW - 2) c = scaleColor(c, 0.72);
      img.px(X0 + i, FY + j, c);
    }
  // (the mark: a miotsukushi, the old channel post of the harbour, in blue on a white field)
  for (let dj = 0; dj < 13; dj++) for (let di = 0; di < 13; di++) img.px(X0 + 42 + di, FY + 5 + dj, di === 0 || di === 12 || dj === 0 || dj === 12 ? GRANITE[0] : 0xf4f4f0);
  for (let dj = 2; dj < 11; dj++) img.px(X0 + 48, FY + 5 + dj, 0x1a4a9a);
  for (let t = 0; t < 4; t++) for (const s of [-1, 1]) {
    img.px(X0 + 48 + s * (t + 1), FY + 8 - t, 0x1a4a9a);
    img.px(X0 + 48 + s * (t + 1), FY + 11 - Math.min(t, 2), 0x1a4a9a);
  }
  for (let i = 30; i < 66; i++) for (let j = 0; j < 3; j++) img.px(X0 + i, FY + FH - 10 + j, j ? 0x5a5e66 : 0xe8e8e4);
  for (let i = 38; i < 58; i += 3) glowPx(X0 + i, FY + FH - 4, 0xffe0a0, 0.6);
}

/** The library: 32 wide; 20 of roof, 9 of front. */
export function library({ img, S }, x, y) {
  const X0 = x * S;
  const Y0 = y * S;
  const WW = 32 * S;
  const RH = 20 * S;
  const FH = 9 * S;
  const STONE = [0xb0a894, 0xc8c0ac, 0xdcd4c0, 0xeee8d8];
  // the roofs: a cross of low pitched roofs in slate over the halls, flat leads in the corners, a stone balustrade
  for (let j = 0; j < RH; j++)
    for (let i = 0; i < WW; i++) {
      const e = Math.min(i, WW - 1 - i, j, RH - 1 - j);
      let c;
      if (e < 3) c = e === 0 ? (i === 0 || j === 0 ? STONE[3] : STONE[0]) : e === 1 ? (i + j) % 3 ? STONE[2] : STONE[0] : STONE[1];
      else {
        const inNS = i > 34 && i < 61;
        const inEW = j > 16 && j < 43;
        if (inNS || inEW) {
          const ridge = inNS && !(inEW && Math.abs(j - 29.5) < Math.abs(i - 47.5)) ? i - 47.5 : j - 29.5;
          c = [0x4a525e, 0x5a6470, 0x6c7884, 0x808c98][ridge < 0 ? 2 : 1];
          if (Math.abs(ridge) < 0.6) c = 0x9aa6b0;
          else if ((ridge === i - 47.5 ? j : i) % 3 === 0) c = scaleColor(c, 0.88);
        } else c = [0x8a8678, 0x969284, 0xa29e90][Math.floor(hashPx(i >> 2, j >> 2, 521) * 3)];
      }
      img.px(X0 + i, Y0 + j, c);
    }
  // the dome over the crossing: a stone drum with its round windows, copper above, the lantern
  const [CX, CY, R] = [X0 + 47, Y0 + 29, 15];
  for (let a = 0; a < 6.3; a += 0.02) for (let rr = R; rr < R + 3; rr++) img.px(CX + Math.cos(a) * rr, CY + Math.sin(a) * rr * 0.92 + 2, rr === R + 2 ? STONE[0] : Math.floor(a * 5) % 2 ? STONE[3] : STONE[1]);
  dome(img, CX, CY, R, STONE[1]);
  for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) if (Math.abs(di) + Math.abs(dj) < 4) img.px(CX + di, CY - 2 + dj, di < 0 ? STONE[3] : STONE[1]);
  img.px(CX, CY - 5, 0xfff0a0);
  img.px(CX, CY - 4, 0xe8b830);
  // the front: rusticated stone, tall windows under little pediments, and in the middle the portico: four columns
  // on their plinths, the pediment above them casting its shade, the door in the dark behind, the steps
  const FY = Y0 + RH;
  for (let j = 0; j < FH; j++)
    for (let i = 0; i < WW; i++) {
      let c = j < 2 ? STONE[j ? 2 : 3] : j > FH - 4 ? STONE[0] : j % 4 === 1 ? STONE[1] : STONE[2];
      const q = (i - 4) % 11;
      if ((i < 30 || i > 65) && q > 3 && q < 8 && j > 6 && j < FH - 6) c = j === 7 || q === 4 ? STONE[3] : (j + q) % 6 === 0 ? 0x7a94a8 : 0x2e3c48;
      if ((i < 30 || i > 65) && q > 2 && q < 9 && j > 3 && j < 7 && Math.abs(q - 5.5) < j - 3) c = STONE[3];
      if (i >= WW - 2) c = scaleColor(c, 0.72);
      img.px(X0 + i, FY + j, c);
    }
  const [p0, p1] = [30, 65];
  for (let j = -9; j < FH; j++)
    for (let i = p0; i <= p1; i++) {
      const t = Math.abs(i - 47.5) / 18;
      let c;
      if (j < 3) {
        if (j < -9 + t * 11) continue; // the pediment's slope
        c = j === Math.ceil(-9 + t * 11) || j === 2 ? STONE[3] : j > -3 + t * 3 ? STONE[1] : STONE[2];
        if (j > -5 && j < 1 && t < 0.3) c = 0x8a8474; // (a wreath carved in its tympanum)
      } else if (j < 6) c = j === 3 ? 0x6a6456 : STONE[j === 5 ? 3 : 2]; // the entablature, in the pediment's shade
      else {
        const col = (i - p0 - 2) % 10;
        c = col < 4 ? [STONE[3], STONE[3], STONE[2], STONE[0]][col] : j > FH - 4 ? STONE[1] : i > 42 && i < 53 ? (j < 10 ? 0x4a3a2a : (i === 47 || i === 48 ? 0x1a1410 : 0x2a2018)) : 0x3a3830;
        if (col < 4 && (j === 6 || j >= FH - 3)) c = STONE[3];
      }
      img.px(X0 + i, FY + j, c);
    }
  for (let j = 0; j < 6; j++) for (let i = p0 - 2 - j; i <= p1 + 2 + j; i++) img.px(X0 + i, FY + FH + j, j % 2 ? STONE[1] : STONE[3]);
}
