// The player's three ships at 540 px (docs/graphics-540-plan.md, step 6, group C), from the same masks as the
// 1x sprites (shipmasks.mjs) so the silhouette, the nozzles and the hit dot stay where they were: each mask cell
// becomes 3 x 3 fine pixels, the stair-steps rounded off into diagonals, every panel shaded as a bevelled
// surface lit from the upper left, the seams between liveries inked, a glint on the canopy.
import { HiSprite } from '../../lib/hisprite.mjs';
import { Mask } from '../../lib/spritekit.mjs';
import { SHIP, SHIP_ONI, SHIP_TSUBAME } from './shipmasks.mjs';

function bankMask(rows, bank) {
  const m = Mask.fromRows(rows, true);
  if (bank) {
    for (let y = 0; y < m.h; y++) {
      const row = m.g[y];
      if (bank < 0) {
        for (let x = 3; x >= 1; x--) row[x] = row[x - 1];
        row[0] = '.';
      } else {
        for (let x = m.w - 4; x < m.w - 1; x++) row[x] = row[x + 1];
        row[m.w - 1] = '.';
      }
    }
  }
  return m;
}

export function ship540(rows, bank = 0) {
  const m = bankMask(rows, bank);
  const W = (m.w + 2) * 3;
  const H = (m.h + 2) * 3;
  const cell = (x, y) => m.get(x, y);
  const mat = new Array(W * H).fill('.');
  for (let Y = 0; Y < H; Y++)
    for (let X = 0; X < W; X++) {
      const cx = Math.floor(X / 3) - 1;
      const cy = Math.floor(Y / 3) - 1;
      const sx = X % 3;
      const sy = Y % 3;
      const c = cell(cx, cy);
      let v = c;
      if (sx !== 1 && sy !== 1) {
        const dx = sx === 0 ? -1 : 1;
        const dy = sy === 0 ? -1 : 1;
        const a = cell(cx + dx, cy);
        const b = cell(cx, cy + dy);
        if (c !== '.' && a === '.' && b === '.') v = '.'; // a convex corner: rounded off
        else if (c === '.' && a !== '.' && a === b) v = a; // a concave one: filled in
      }
      mat[Y * W + X] = v === 'c' ? 'C' : v;
    }
  // how each pixel faces: towards the open space round it (a bevel), lit from the upper left
  const open = (x, y) => x < 0 || y < 0 || x >= W || y >= H || mat[y * W + x] === '.';
  const light = (x, y) => {
    let vx = 0;
    let vy = 0;
    for (let j = -4; j <= 4; j++)
      for (let i = -4; i <= 4; i++) {
        if (!i && !j) continue;
        const d2 = i * i + j * j;
        if (d2 > 16 || !open(x + i, y + j)) continue;
        vx += i / d2;
        vy += j / d2;
      }
    const len = Math.hypot(vx, vy);
    let l = 0.5 + ((W / 2 - x) / W) * 0.18; // the left flank a little lighter
    if (len > 0.05) l += 0.38 * Math.min(1, len * 1.6) * ((vx / len) * -0.55 + (vy / len) * -0.83);
    if (Math.abs(x + 0.5 - W / 2) < 1.6 && mat[y * W + x] === 'W') l += 0.12; // the spine catching the light
    return l;
  };
  const s = new HiSprite(W, H, {});
  for (const L of new Set(mat)) if (L !== '.') s.paint([0, 0, W, H], (x, y) => mat[Math.floor(y) * W + Math.floor(x)] === L, L, (x, y) => light(Math.floor(x), Math.floor(y)), { tex: 0.04, seed: 5 });
  // panel seams down the hull either side of the spine, rivets along them, from below the canopy
  const cxw = W / 2;
  let canopyEnd = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (mat[y * W + x] === 'C') canopyEnd = y;
  for (const sx of [-1, 1]) {
    const x = Math.round(cxw - 0.5 + sx * 5);
    for (let y = canopyEnd + 3; y < H; y++) {
      if (mat[y * W + x] !== 'W' || mat[(y + 1) * W + x] !== 'W') continue;
      s.px(x, y, 0x6a7090, 0.75);
      if ((y - canopyEnd) % 6 === 0) s.px(x - sx, y, 0xffffff, 0.8); // a rivet head, lit
    }
  }
  // short cross seams where the wings join, every few rows
  for (let y = canopyEnd + 6; y < H; y += 7)
    for (let x = 0; x < W; x++) if (mat[y * W + x] === 'W' && Math.abs(x + 0.5 - cxw) > 6 && mat[(y - 1) * W + x] === 'W') s.px(x, y, 0x8d93b0, 0.6);
  // inside the nozzles: dark, a hot orange glow at the mouth
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (mat[y * W + x] !== 'D') continue;
      const below = y + 1 >= H || mat[(y + 1) * W + x] !== 'D';
      const below2 = y + 2 >= H || mat[(y + 2) * W + x] !== 'D';
      if (below) s.px(x, y, 0xffb040);
      else if (below2) s.px(x, y, 0xe0501a, 0.8);
    }
  // the canopy's glint: a short bright streak across the upper left of the glass
  let gx = -1;
  let gy = -1;
  for (let y = 0; y < H && gx < 0; y++) for (let x = 0; x < W; x++) if (mat[y * W + x] === 'C') { gx = x; gy = y; break; }
  if (gx >= 0) for (let k = 0; k < 4; k++) s.px(gx + 1 + (k >> 1), gy + 2 + k, 0xffffff, 0.9);
  return s.render({ outline: 2 });
}

export function ships540(add) {
  for (const [name, rows] of [['ship', SHIP], ['ship_oni', SHIP_ONI], ['ship_tsubame', SHIP_TSUBAME]]) {
    add(name, ship540(rows, 0));
    add(`${name}_l`, ship540(rows, -1));
    add(`${name}_r`, ship540(rows, 1));
  }
}
