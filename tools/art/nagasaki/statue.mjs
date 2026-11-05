// The Peace Statue (Seibō Kitamura, 1955), facing south down the Peace Park: a seated muscular figure in
// bronze gone green, eyes closed in prayer; the right arm raised high and pointing up (the threat of nuclear
// weapons), the left arm held out level (peace), the right leg folded (meditation), the left leg put forward
// to rise (to go and help). A cloth over the hips, curly hair. A tall stepped granite pedestal.
import { sculpt } from './paint.mjs';

export const BRONZE = [0x12262e, 0x1d3a42, 0x285256, 0x366a6c, 0x488484, 0x62a29e, 0x88c2ba, 0xb2dcd2];
const CLOTH = [0x14282c, 0x203e40, 0x2e544f, 0x3e6a62, 0x528274, 0x6c9a8a];

/** Draw the statue with its seat at (sx, sy) (strip pixels); the figure rises above it. Returns its top y. */
export function peaceStatue(img, sx, sy) {
  // the figure, the viewer's left being the statue's right
  const body = [
    // the rock it sits on
    { ell: [0, 2], rx: 15, ry: 6, z: -6, tone: -0.12 },
    { ell: [-6, 4], rx: 9, ry: 4, z: -5, tone: -0.15 },
    // torso: abdomen, chest, the two pectorals, the shoulders
    { ell: [0, -9], rx: 9.5, ry: 6, z: 0 },
    { ell: [0, -18], rx: 10.5, ry: 8, z: 1 },
    { ell: [-4.2, -21.5], rx: 5, ry: 3.6, z: 4.5 },
    { ell: [4.4, -21.2], rx: 5, ry: 3.6, z: 4.3 },
    { ell: [-9.5, -24], rx: 4.2, ry: 3.6, z: 2 },
    { ell: [9.5, -24], rx: 4.2, ry: 3.4, z: 2 },
    // neck and head, tilted a little down in prayer
    { cap: [0, -26, 0.4, -29.5], r: 3.3, z: 1 },
    { ell: [0.4, -34], rx: 4.6, ry: 5.2, z: 2.5 },
    // the right arm, raised: upper arm out and up, forearm straight up, the pointing hand
    { cap: [-10, -25, -15, -36], r: 3.4, z: 1 },
    { cap: [-15, -36, -14.5, -52], r: 2.8, z: 1.5 },
    { cap: [-14.5, -52, -14, -56], r: 2.1, z: 2 },
    { cap: [-13.8, -56, -13.6, -61], r: 0.9, z: 2.5 },
    // the left arm held out level, the hand flat
    { cap: [10, -24.5, 20, -25], r: 3.2, z: 1 },
    { cap: [20, -25, 31, -24.5], r: 2.6, z: 1.2 },
    { ell: [34.5, -24.3], rx: 3.4, ry: 1.6, z: 1.5 },
    // the right leg folded across in front, the left leg stepping down off the rock
    { cap: [-5, -5, -15, -1.5], r: 4.4, z: 4 },
    { cap: [-15, -1.5, -3, 2.5], r: 3.4, z: 6 },
    { cap: [-3, 2.5, 2, 3.5], r: 2, z: 7 },
    { cap: [5, -5, 12, -0.5], r: 4.4, z: 4 },
    { cap: [12, -0.5, 13, 12], r: 3.4, z: 4.5 },
    { cap: [13, 12, 17.5, 13.5], r: 2, z: 5.5 },
  ];
  sculpt(img, sx, sy, body, BRONZE);
  // the cloth over the hips and between the knees, in folds
  sculpt(img, sx, sy, [
    { ell: [0, -4.5], rx: 8, ry: 3.6, z: 7 },
    { cap: [-2, -3, 1, 4.5], r: 3.6, z: 6.5 },
    { cap: [5, -3, 9, 0], r: 2.4, z: 7.2 },
  ], CLOTH, { outline: false });
  for (const [x0, y0, x1, y1] of [[-5, -5, -1, 3], [1, -6, 3, 4], [5, -4, 8, -1]]) img.line(sx + x0, sy + y0, sx + x1, sy + y1, CLOTH[0]);
  // the head: curly hair as a cap of little lit curls, closed eyes, the brow, nose and mouth
  const hx = sx + 0.4;
  const hy = sy - 34;
  for (const [dx, dy] of [[-3, -4], [-1, -5], [1, -5], [3, -4], [-4, -2], [4, -2], [-2, -3], [0, -3.5], [2, -3]]) {
    img.set(Math.round(hx + dx), Math.round(hy + dy), BRONZE[2]);
    img.set(Math.round(hx + dx - 0.6), Math.round(hy + dy - 0.6), BRONZE[5]);
  }
  img.set(Math.round(hx - 2), Math.round(hy + 0.5), BRONZE[1]);
  img.set(Math.round(hx - 1), Math.round(hy + 0.5), BRONZE[1]);
  img.set(Math.round(hx + 1), Math.round(hy + 0.5), BRONZE[1]);
  img.set(Math.round(hx + 2), Math.round(hy + 0.5), BRONZE[1]);
  img.set(Math.round(hx), Math.round(hy + 1.5), BRONZE[6]);
  img.set(Math.round(hx), Math.round(hy + 3), BRONZE[1]);
  // muscle lines: the abdomen's divisions, the breastbone
  for (const dy of [-12, -9, -6]) img.set(sx, sy + dy, BRONZE[2]);
  img.set(sx - 2, sy - 10, BRONZE[2]);
  img.set(sx + 2, sy - 10, BRONZE[2]);
  img.line(sx, sy - 24, sx, sy - 18, BRONZE[2]);
  // the extended index finger catches the light
  img.set(sx - 14, sy - 61, BRONZE[7]);
  return sy - 62;
}

/** The pedestal under it, its top at y (the seat's level), centred on x. Returns the bottom y. */
export function pedestal(img, x, y) {
  const steps = [[22, 5, 0xc8c6bc], [27, 10, 0xb4b2a8], [32, 4, 0xa4a298], [38, 3, 0x96948a]];
  let yy = y + 4;
  for (const [hw, h, c] of steps) {
    // top surface, then the lit front face with its right edge in shade
    img.rect(x - hw, yy, hw * 2, 1, 0xe2e0d6);
    for (let j = 1; j < h; j++) {
      for (let i = -hw; i < hw; i++) img.set(x + i, yy + j, i > hw - 3 ? 0x7a786e : (i + j * 3 + 40) % 9 === 0 ? 0x8a887e : c);
    }
    yy += h;
  }
  // the bronze inscription plate on the main block
  img.rect(x - 8, y + 12, 16, 5, 0x2a3a36);
  img.rect(x - 7, y + 13, 14, 1, 0x6a8a7a);
  img.rect(x - 7, y + 15, 10, 1, 0x4a6a5a);
  return yy;
}
