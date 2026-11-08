// The Peace Statue (Seibō Kitamura, 1955), facing south down the Peace Park: a seated muscular figure in bronze gone
// green, eyes closed in prayer; the right arm raised high and pointing up (the threat of nuclear weapons), the left arm
// held out level (peace), the right leg folded (meditation), the left leg put forward to rise (to go and help). A cloth
// over the hips, curly hair. A tall stepped granite pedestal. Sculpted at the strip's fine resolution.
import { sculpt } from './paint.mjs';

export const BRONZE = [0x12262e, 0x1d3a42, 0x285256, 0x366a6c, 0x488484, 0x62a29e, 0x88c2ba, 0xb2dcd2];
const CLOTH = [0x14282c, 0x203e40, 0x2e544f, 0x3e6a62, 0x528274, 0x6c9a8a];

/** Scale a list of primitives by s. */
const up = (prims, s) =>
  prims.map((p) => (p.cap ? { ...p, cap: p.cap.map((v) => v * s), r: p.r * s, z: p.z * s } : { ...p, ell: p.ell.map((v) => v * s), rx: p.rx * s, ry: p.ry * s, z: p.z * s }));

/** Draw the statue with its seat at (sx, sy) in logical strip units; the figure rises above it. Returns its top y. */
export function peaceStatue(img, sx, sy, S = 3) {
  const X0 = Math.round(sx * S);
  const Y0 = Math.round(sy * S);
  const fine = { set: (x, y, c) => img.px(x, y, c) };
  // the figure, the viewer's left being the statue's right
  const body = [
    // the rock it sits on
    { ell: [0, 2], rx: 15, ry: 6, z: -6, tone: -0.12 },
    { ell: [-6, 4], rx: 9, ry: 4, z: -5, tone: -0.15 },
    // torso: abdomen, chest, the two pectorals, the shoulders, the lats
    { ell: [0, -9], rx: 9.5, ry: 6, z: 0 },
    { ell: [0, -18], rx: 10.5, ry: 8, z: 1 },
    { ell: [-4.2, -21.5], rx: 5, ry: 3.6, z: 4.5 },
    { ell: [4.4, -21.2], rx: 5, ry: 3.6, z: 4.3 },
    { ell: [-9.5, -24], rx: 4.2, ry: 3.6, z: 2 },
    { ell: [9.5, -24], rx: 4.2, ry: 3.4, z: 2 },
    { ell: [-2.2, -13], rx: 2.1, ry: 1.7, z: 6.2 },
    { ell: [2.2, -13], rx: 2.1, ry: 1.7, z: 6.2 },
    { ell: [-2.2, -9.8], rx: 2.1, ry: 1.6, z: 6 },
    { ell: [2.2, -9.8], rx: 2.1, ry: 1.6, z: 6 },
    { ell: [-2.1, -6.8], rx: 2, ry: 1.5, z: 5.6 },
    { ell: [2.1, -6.8], rx: 2, ry: 1.5, z: 5.6 },
    // neck and head, tilted a little down in prayer
    { cap: [0, -26, 0.4, -29.5], r: 3.3, z: 1 },
    { ell: [0.4, -34], rx: 4.6, ry: 5.2, z: 2.5 },
    { ell: [-4.3, -33.6], rx: 0.9, ry: 1.6, z: 3 },
    { ell: [5, -33.6], rx: 0.9, ry: 1.6, z: 3 },
    // the right arm, raised: upper arm out and up, its deltoid and biceps, forearm straight up, the pointing hand
    { cap: [-10, -25, -15, -36], r: 3.4, z: 1 },
    { ell: [-13, -32], rx: 2.6, ry: 3.6, z: 3.6 },
    { cap: [-15, -36, -14.5, -52], r: 2.8, z: 1.5 },
    { ell: [-14.9, -42], rx: 2.2, ry: 4, z: 3.2 },
    { cap: [-14.5, -52, -14, -56], r: 2.1, z: 2 },
    { cap: [-13.8, -56, -13.6, -61], r: 0.9, z: 2.5 },
    // the left arm held out level, the hand flat
    { cap: [10, -24.5, 20, -25], r: 3.2, z: 1 },
    { ell: [15, -23.8], rx: 4, ry: 2.4, z: 3.2 },
    { cap: [20, -25, 31, -24.5], r: 2.6, z: 1.2 },
    { ell: [34.5, -24.3], rx: 3.4, ry: 1.6, z: 1.5 },
    { cap: [36, -25.2, 38.4, -25.4], r: 0.45, z: 2 },
    { cap: [36, -24.2, 38.8, -24.3], r: 0.45, z: 2 },
    { cap: [36, -23.2, 38.3, -23.2], r: 0.45, z: 2 },
    // the right leg folded across in front, the left leg stepping down off the rock
    { cap: [-5, -5, -15, -1.5], r: 4.4, z: 4 },
    { cap: [-15, -1.5, -3, 2.5], r: 3.4, z: 6 },
    { cap: [-3, 2.5, 2, 3.5], r: 2, z: 7 },
    { cap: [5, -5, 12, -0.5], r: 4.4, z: 4 },
    { ell: [12, -0.8], rx: 3, ry: 2.8, z: 6.6 },
    { cap: [12, -0.5, 13, 12], r: 3.4, z: 4.5 },
    { ell: [12.7, 5], rx: 2.5, ry: 4, z: 6.4 },
    { cap: [13, 12, 17.5, 13.5], r: 2, z: 5.5 },
  ];
  sculpt(fine, X0, Y0, up(body, S), BRONZE, { smooth: 2 });
  // the cloth over the hips and between the knees, in folds
  sculpt(fine, X0, Y0, up([
    { ell: [0, -4], rx: 7.4, ry: 2.8, z: 7 },
    { cap: [-2, -3, 1, 4.5], r: 3.6, z: 6.5 },
    { cap: [5, -3, 9, 0], r: 2.4, z: 7.2 },
  ], S), CLOTH, { outline: false, smooth: 1 });
  for (const [x0, y0, x1, y1] of [[-5, -5, -1, 3], [1, -6, 3, 4], [5, -4, 8, -1], [-3, -6, 0, 2], [3, -5, 5.5, 1]]) {
    img.linePx(X0 + x0 * S, Y0 + y0 * S, X0 + x1 * S, Y0 + y1 * S, CLOTH[1]);
    img.linePx(X0 + x0 * S + 1, Y0 + y0 * S, X0 + x1 * S + 1, Y0 + y1 * S, CLOTH[4]);
  }
  // the head: curly hair as a cap of little lit curls, closed eyes, the brow, nose and mouth
  const hx = X0 + 0.4 * S;
  const hy = Y0 - 34 * S;
  for (let a = 0; a < 36; a++) {
    const ang = -Math.PI + (a / 35) * Math.PI;
    for (const rr of [13.5, 11, 8.5]) {
      const qx = Math.round(hx + Math.cos(ang) * rr + (rr === 11 ? 1 : 0));
      const qy = Math.round(hy - 2 + Math.sin(ang) * (rr + 1.5));
      if ((a + Math.round(rr)) % 3) continue;
      img.discPx(qx, qy, 1.4, BRONZE[2]);
      img.px(qx - 1, qy - 1, BRONZE[6]);
    }
  }
  // the brow, the closed lids, the long straight nose, the set mouth
  for (let i = -8; i <= 8; i++) img.px(hx + i, hy - 1 - Math.abs(i) * 0.1, BRONZE[6]);
  for (const s of [-1, 1]) {
    for (let i = 2; i <= 7; i++) img.px(hx + s * i, hy + 1, BRONZE[1]);
    for (let i = 3; i <= 6; i++) img.px(hx + s * i, hy, BRONZE[2]);
  }
  for (let j = 0; j < 6; j++) {
    img.px(hx, hy + j, BRONZE[6]);
    img.px(hx + 1, hy + j, BRONZE[2]);
  }
  for (let i = -3; i <= 3; i++) img.px(hx + i, hy + 9, BRONZE[1]);
  for (let i = -2; i <= 2; i++) img.px(hx + i, hy + 10, BRONZE[5]);
  // muscle lines: the breastbone, the collar bones
  img.linePx(X0, Y0 - 24 * S, X0, Y0 - 16 * S, BRONZE[2]);
  img.linePx(X0 + 1, Y0 - 25 * S, X0 + 9 * S, Y0 - 26 * S, BRONZE[6]);
  img.linePx(X0 - 1, Y0 - 25 * S, X0 - 9 * S, Y0 - 26 * S, BRONZE[6]);
  // the extended index finger catches the light
  for (let j = 0; j < 6; j++) img.px(X0 - 41, Y0 - 61 * S + j, BRONZE[7]);
  return sy - 62;
}

/** The pedestal under it, its top at y (the seat's level), centred on x. Returns the bottom y. */
export function pedestal(img, x, y, S = 3) {
  const steps = [[22, 5, 0xc8c6bc], [27, 10, 0xb4b2a8], [32, 4, 0xa4a298], [38, 3, 0x96948a]];
  const CX = x * S;
  let Yy = (y + 4) * S;
  for (const [hw, h, c] of steps) {
    const HW = hw * S;
    const H = h * S;
    for (let i = -HW; i < HW; i++) {
      img.px(CX + i, Yy, 0xf2f0e6);
      img.px(CX + i, Yy + 1, 0xe2e0d6);
    }
    for (let j = 2; j < H; j++)
      for (let i = -HW; i < HW; i++) {
        const row = j >> 3;
        const XX = i + row * 11 + 400;
        let col = c;
        if (j % 8 === 0 || XX % 27 === 0) col = 0x7e7c72;
        else if ((XX >> 2) % 7 === 0) col = 0xd4d2c8;
        if (i > HW - 7) col = 0x7a786e;
        if (i < -HW + 3) col = 0xe8e6dc;
        img.px(CX + i, Yy + j, col);
      }
    Yy += H;
  }
  // the bronze inscription plate on the main block, its rows of characters
  const PX = CX - 27;
  const PY = (y + 11) * S;
  for (let j = 0; j < 21; j++)
    for (let i = 0; i < 54; i++) {
      const e = Math.min(i, 53 - i, j, 20 - j);
      img.px(PX + i, PY + j, e < 1 ? 0x8a9a84 : e < 2 ? 0x1a2a26 : j % 4 === 1 && i % 3 && i > 3 && i < 50 ? 0x8aaa9a : 0x2a3a36);
    }
  return Yy / S;
}
