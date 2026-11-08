// The Peace Statue (Seibō Kitamura, 1955), facing south down the Peace Park: a seated, heavily muscled figure in bronze
// gone green, eyes closed in prayer; the right arm raised high and pointing up (the threat of nuclear weapons), the left
// arm held out level (peace), the right leg folded (meditation), the left leg put forward to rise (to go and help). A
// cloth over the hips, curly hair. A tall stepped granite pedestal. Sculpted at the strip's fine resolution.
import { sculpt } from './paint.mjs';

export const BRONZE = [0x12262e, 0x1d3a42, 0x285256, 0x366a6c, 0x488484, 0x62a29e, 0x88c2ba, 0xb2dcd2];
const CLOTH = [0x162c30, 0x224244, 0x305a54, 0x427268, 0x588a7a, 0x74a290];
const STONE = [0x2a3a3e, 0x3a4c50, 0x4c6064, 0x627678, 0x7a8e8e];

/** Scale a list of primitives by s. */
const up = (prims, s) =>
  prims.map((p) => (p.cap ? { ...p, cap: p.cap.map((v) => v * s), r: p.r * s, z: p.z * s } : { ...p, ell: p.ell.map((v) => v * s), rx: p.rx * s, ry: p.ry * s, z: p.z * s }));

/** Draw the statue with its seat at (sx, sy) in logical strip units; the figure rises above it. Returns its top y. */
export function peaceStatue(img, sx, sy, S = 3) {
  const X0 = Math.round(sx * S);
  const Y0 = Math.round(sy * S);
  const fine = { set: (x, y, c) => img.px(x, y, c) };
  const P = (x, y) => [X0 + x * S, Y0 + y * S];
  const stroke = (pts, c, a = 1) => {
    for (let i = 0; i + 1 < pts.length; i++) {
      const [a0, b0] = P(pts[i][0], pts[i][1]);
      const [a1, b1] = P(pts[i + 1][0], pts[i + 1][1]);
      img.linePx(Math.round(a0), Math.round(b0), Math.round(a1), Math.round(b1), c, a);
    }
  };
  // the block of rock it sits on, roughly hewn
  sculpt(fine, X0, Y0, up([
    { ell: [0, 3], rx: 16, ry: 6.4, z: -8 },
    { ell: [-7, 5], rx: 10, ry: 4.4, z: -6 },
    { ell: [8, 5], rx: 8, ry: 4, z: -6 },
  ], S), STONE, { smooth: 1 });
  // the figure, the viewer's left being the statue's right
  const body = [
    // the pelvis, the waist drawn in, the great ribcage, the lats flaring from under the arms
    { ell: [0, -5], rx: 7.8, ry: 4, z: 0 },
    { ell: [0, -10], rx: 6.4, ry: 5, z: 1 },
    { ell: [0, -19.4], rx: 9.6, ry: 6.8, z: 1 },
    { ell: [-6.8, -16], rx: 2, ry: 4.4, z: 2.4 },
    { ell: [6.8, -16], rx: 2, ry: 4.4, z: 2.4 },
    // the two slabs of the chest
    { ell: [-4.4, -21], rx: 5.2, ry: 3.2, z: 5 },
    { ell: [4.4, -21], rx: 5.2, ry: 3.2, z: 5 },
    // the abdomen in its blocks
    { ell: [-2, -15.2], rx: 1.9, ry: 1.5, z: 6.6 },
    { ell: [2, -15.2], rx: 1.9, ry: 1.5, z: 6.6 },
    { ell: [-2, -12.3], rx: 1.9, ry: 1.5, z: 6.4 },
    { ell: [2, -12.3], rx: 1.9, ry: 1.5, z: 6.4 },
    { ell: [-1.9, -9.5], rx: 1.8, ry: 1.4, z: 6 },
    { ell: [1.9, -9.5], rx: 1.8, ry: 1.4, z: 6 },
    // the shoulders: trapezius sloping from the neck, the round deltoids
    { cap: [-1, -28.2, -9, -25.6], r: 2.3, z: 2 },
    { cap: [1, -28.2, 9, -25.6], r: 2.3, z: 2 },
    { ell: [-10.8, -24.8], rx: 4.1, ry: 4, z: 3.2 },
    { ell: [10.8, -24.8], rx: 4.1, ry: 3.8, z: 3.2 },
    // the neck, the strong head bowed a little: skull, brow, cheeks and jaw, the straight nose, ears
    { cap: [0, -26, 0.3, -29.8], r: 3.1, z: 1.4 },
    { ell: [0.4, -35], rx: 4.5, ry: 4.6, z: 2.4 },
    { ell: [0.4, -31.8], rx: 3.3, ry: 2.8, z: 3.2 },
    { ell: [0.4, -35.5], rx: 3.5, ry: 0.9, z: 5.8 },
    { cap: [0.4, -35.2, 0.4, -32.6], r: 0.75, z: 6.6 },
    { ell: [-4.4, -33.8], rx: 0.8, ry: 1.5, z: 3 },
    { ell: [5.2, -33.8], rx: 0.8, ry: 1.5, z: 3 },
    // the right arm, raised: the upper arm with its biceps, the elbow, the long forearm, the wrist, the pointing hand
    { cap: [-11, -26.5, -15, -37], r: 3, z: 1 },
    { ell: [-12.6, -31.5], rx: 2.5, ry: 3.8, z: 3.4 },
    { cap: [-15, -37, -14.9, -45], r: 2.7, z: 1.5 },
    { cap: [-14.9, -45, -14.6, -52.5], r: 1.9, z: 1.5 },
    { ell: [-14.3, -55], rx: 1.9, ry: 2.6, z: 2.4 },
    { cap: [-13.9, -57, -13.7, -63], r: 0.75, z: 3 },
    { cap: [-15.2, -57, -15.1, -58.2], r: 0.7, z: 3 },
    // the left arm held out level, the hand flat with its fingers together
    { cap: [10.6, -25.2, 20, -25.6], r: 3, z: 1 },
    { ell: [15, -24.4], rx: 3.9, ry: 2.3, z: 3.2 },
    { cap: [20, -25.6, 26, -25.3], r: 2.6, z: 1.4 },
    { cap: [26, -25.3, 31.5, -24.9], r: 1.8, z: 1.4 },
    { ell: [34, -24.8], rx: 3, ry: 1.5, z: 2 },
    { cap: [36, -25.6, 39, -25.8], r: 0.42, z: 2.4 },
    { cap: [36, -24.9, 39.4, -25], r: 0.42, z: 2.4 },
    { cap: [36, -24.2, 39.2, -24.2], r: 0.42, z: 2.4 },
    { cap: [36, -23.6, 38.2, -23.5], r: 0.42, z: 2.4 },
    // the right leg folded across: the thick thigh, the kneecap, the shin coming back in front, the foot
    { cap: [-4, -3.6, -15.6, -0.8], r: 4.3, z: 3.6 },
    { ell: [-9.6, -3], rx: 5, ry: 2.7, z: 6 },
    { ell: [-16, -0.8], rx: 2.9, ry: 2.9, z: 5.6 },
    { cap: [-15.6, -0.4, -7, 2.4], r: 2.9, z: 6.4 },
    { cap: [-7, 2.4, -2, 3.2], r: 2.1, z: 6.6 },
    { cap: [-2, 3.2, 3, 3.6], r: 1.8, z: 7.2 },
    // the left leg stepping down: the thigh, the knee, the calf and shin, the foot on the rock with its toes
    { cap: [4.4, -4, 12.6, -0.6], r: 4.3, z: 3.6 },
    { ell: [8.4, -3], rx: 4.2, ry: 2.5, z: 6 },
    { ell: [12.8, -0.2], rx: 2.7, ry: 2.7, z: 5.8 },
    { cap: [12.8, 0.4, 13.2, 7], r: 2.8, z: 4.6 },
    { ell: [14, 4.4], rx: 1.7, ry: 3.4, z: 5.8 },
    { cap: [13.2, 7, 13.5, 12.6], r: 1.8, z: 4.6 },
    { cap: [13.5, 12.8, 18.2, 14], r: 1.8, z: 5.4 },
    { cap: [18, 13.2, 19.6, 13.6], r: 0.55, z: 6 },
    { cap: [18, 14, 19.8, 14.6], r: 0.55, z: 6 },
    { cap: [17.6, 14.8, 19.2, 15.5], r: 0.55, z: 6 },
  ];
  sculpt(fine, X0, Y0, up(body, S), BRONZE, { smooth: 1 });
  // the cloth: a broad wrap round the hips and over the lap, drawn in folds that sweep across it from the knot
  sculpt(fine, X0, Y0, up([
    { cap: [-8.4, -5.2, 8.4, -5.2], r: 1.5, z: 8 },
    { ell: [-7, -3], rx: 5.8, ry: 2.5, z: 8.2 },
    { ell: [6.6, -3.2], rx: 5.2, ry: 2.3, z: 8.2 },
    { ell: [0, -2.4], rx: 5, ry: 2.5, z: 8.4 },
  ], S), CLOTH, { outline: true, smooth: 2 });
  for (const [x0, y0, x1, y1] of [[-8.6, -5.4, 8.6, -5.6], [-11, -3.4, -1, -5], [-9, -1.4, 1.6, -4.2], [-3.4, -0.6, 4.4, -3.6], [11, -3, 2.6, -4.8], [8, -1.6, 2, -2]]) {
    stroke([[x0, y0], [x1, y1]], CLOTH[1], 0.8);
    stroke([[x0, y0 + 0.34], [x1, y1 + 0.34]], CLOTH[5], 0.7);
  }
  // the modelling: the grooves that make it muscle, the lit edges beside them
  const dark = BRONZE[1];
  const lit = BRONZE[6];
  stroke([[0, -24.4], [0, -8]], dark, 0.75); // the breastbone and the line down the abdomen
  stroke([[-9, -19], [-5, -18], [-1, -19]], dark, 0.7); // under the left pectoral
  stroke([[9, -19], [5, -18], [1, -19]], dark, 0.7);
  stroke([[-0.6, -25.8], [-8.6, -26.8]], lit, 0.8); // the collar bones
  stroke([[0.6, -25.8], [8.6, -26.8]], lit, 0.8);
  stroke([[-8, -23], [-7.4, -19.4]], dark, 0.7); // where the deltoids meet the chest
  stroke([[8, -23], [7.4, -19.4]], dark, 0.7);
  stroke([[-6.2, -14], [-5.2, -9.4]], dark, 0.5); // the flanks
  stroke([[6.2, -14], [5.2, -9.4]], dark, 0.5);
  stroke([[-13.8, -27.6], [-11, -34.6]], dark, 0.6); // the biceps' groove
  stroke([[13.2, -23.2], [19, -23.6]], dark, 0.6);
  stroke([[-14.7, -39], [-15.2, -49]], lit, 0.55); // the forearm's tendon
  stroke([[22, -26.2], [30, -25.6]], lit, 0.55);
  stroke([[-12, -4.8], [-5, -5.6]], lit, 0.5); // the thighs' top
  stroke([[-14, -0.6], [-8, -1.2]], dark, 0.55);
  stroke([[6, -4.6], [11.6, -2.2]], lit, 0.5);
  stroke([[14.6, 1.6], [14.8, 7]], lit, 0.5);
  // the head: the cap of tight curls, the closed lids under the heavy brow, the mouth set
  const hx = X0 + 0.4 * S;
  const hy = Y0 - 35 * S;
  for (let ring = 0; ring < 3; ring++) {
    const rr = 13.4 - ring * 3.2;
    for (let a = 0; a <= 24; a++) {
      const ang = -Math.PI * 1.04 + (a / 24) * Math.PI * 1.08;
      if ((a + ring) % 2) continue;
      const qx = hx + Math.cos(ang) * rr;
      const qy = hy - 1 + Math.sin(ang) * (rr + 0.5);
      img.discPx(qx, qy, 1.5, BRONZE[1]);
      img.discPx(qx - 0.5, qy - 0.5, 0.9, BRONZE[4]);
      img.px(Math.round(qx) - 1, Math.round(qy) - 1, BRONZE[6]);
    }
  }
  for (const s of [-1, 1]) {
    for (let i = 3; i <= 9; i++) {
      img.px(hx + s * i, hy - 1, BRONZE[1]); // under the brow
      img.px(hx + s * i, hy + 1, BRONZE[1]); // the closed lids
    }
    for (let i = 4; i <= 8; i++) img.px(hx + s * i, hy, BRONZE[5]);
    img.px(hx + s * 3, hy + 6, BRONZE[1]);
  }
  for (let j = -1; j < 6; j++) img.px(hx - 1, hy + j, BRONZE[7]);
  for (let i = -2; i <= 2; i++) img.px(hx + i, hy + 6, BRONZE[1]);
  for (let i = -4; i <= 4; i++) img.px(hx + i, hy + 9, BRONZE[1]);
  for (let i = -3; i <= 3; i++) img.px(hx + i, hy + 10, BRONZE[5]);
  // the extended index finger catches the light
  for (let j = 0; j < 7; j++) img.px(X0 + Math.round(-13.8 * S), Y0 - Math.round(63 * S) + j, BRONZE[7]);
  return sy - 63;
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
