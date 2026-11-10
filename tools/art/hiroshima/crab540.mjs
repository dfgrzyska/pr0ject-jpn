// Hiroshima's heavy at 540 px (44 x 32 -> 132 x 96): the taka-ashi-gani, the Japanese spider crab of the deep
// water, crawling up out of the Inland Sea. A small pear-shaped carapace knobbed with tubercles and spines, the
// grooves of its regions, two short horns at the front, eyes on stalks; its legs four times its width, orange
// mottled with white, the joints knobbed and the segments spined, the tips dark and pointed; short claws held in
// front. Frames 0..3 the stride (alternate legs lifting); guard: the legs drawn in and the claws crossed.
import { HiSprite, tones, speckle, mottle, mix2 } from '../../lib/hisprite.mjs';

const INK = 0x14101c;
const RAMPS = {
  o: tones([0x6a2008, 0xd0582a, 0xffa860]), // the orange shell
  e: tones([0x3a1406, 0x6a2a10, 0xa04a20]), // the dark tips, the grooves
};
const shell = (seed) => ({ pat: mix2(speckle({ amt: 0.2, dark: 0.08, light: 0.06, seed }), mottle({ amt: 0.18, scale: 4, seed: seed + 1 })) });

function segment(s, a, b, ra, rb, k, seed) {
  s.tube(a[0], a[1], b[0], b[1], ra, 'o', { rb, ...shell(seed) });
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  const nx = -dy / l;
  const ny = dx / l;
  // white mottling along it, a row of small spines on its upper edge, a darker line along the underside
  for (let t = 0.18; t < 0.9; t += 0.2) {
    const x = a[0] + dx * t;
    const y = a[1] + dy * t;
    const r = ra + (rb - ra) * t;
    s.dot(x + nx * r * 0.2, y + ny * r * 0.2, r * 0.42, 0xfff0e0, 0.85);
    s.px(x - nx * r, y - ny * r - 0.5, 0xffd8b0);
    s.px(x - nx * (r + 1), y - ny * (r + 1), 0x8a3a10);
  }
  s.line(a[0] + nx * ra * 0.8, a[1] + ny * ra * 0.8, b[0] + nx * rb * 0.8, b[1] + ny * rb * 0.8, 0x8a3010, 1, 0.6);
}

/** A walking leg: coxa near the body, a long merus up to the knee, the carpus, the long propodus, the dark dactyl. */
function leg(s, root, angs, L, r0, seed) {
  const p = [root];
  for (let k = 0; k < angs.length; k++) p.push([p[k][0] + Math.cos(angs[k]) * L[k], p[k][1] + Math.sin(angs[k]) * L[k]]);
  const R = [r0, r0 * 0.85, r0 * 0.7, r0 * 0.5];
  for (let k = 0; k < p.length - 1; k++) {
    if (k === p.length - 2) {
      s.tube(p[k][0], p[k][1], p[k + 1][0], p[k + 1][1], R[k], 'e', { rb: 0.5, bias: 0.05 });
      continue;
    }
    segment(s, p[k], p[k + 1], R[k], R[k] * 0.9, k, seed + k);
    s.ellipse(p[k + 1][0], p[k + 1][1], R[k] * 1.1, R[k] * 1.1, 'o', { bias: 0.12, ...shell(seed + 9) }); // the knobbed joint
    s.px(p[k + 1][0] - R[k] * 0.4, p[k + 1][1] - R[k] * 0.5, 0xfff0e0);
  }
}

export function crab(mode) {
  const s = new HiSprite(132, 96, RAMPS);
  const cx = 66;
  const cy = 38;
  const guard = mode === 'guard';
  const stride = guard ? 0 : mode;
  // ---- the eight walking legs: up and out, the knee high, the long shins arching down to the tips
  for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) {
    const lift = guard ? 0 : ((k + stride) % 2 ? -1 : 1) * (stride % 2 ? 0.1 : 0.16);
    const tuck = guard ? 0.35 : 0;
    const base = (sx > 0 ? 0 : Math.PI) + sx * (-0.55 + k * 0.42);
    const angs = [base - sx * 0.7 + lift, base - sx * 0.1 + lift + sx * tuck, base + sx * 0.42 + lift + sx * tuck * 1.6, base + sx * 0.8 + lift + sx * tuck * 2];
    const L = [7, 27, 11, 25].map((v, i) => v * (guard && i > 1 ? 0.8 : 1) * (1 - k * 0.03));
    leg(s, [cx + sx * 10, cy - 7 + k * 5.5], angs, L, 3.3, 10 * (k + 1) + (sx > 0 ? 5 : 0));
  }
  // ---- the claws: short, held out in front, or crossed over each other on guard
  for (const sx of [-1, 1]) {
    const root = [cx + sx * 6, cy + 14];
    const elbow = guard ? [cx + sx * 9, cy + 24] : [cx + sx * 14, cy + 24];
    const wrist = guard ? [cx - sx * 4, cy + 30] : [cx + sx * 12, cy + 33];
    segment(s, root, elbow, 3, 2.8, 0, 70 + sx);
    s.ellipse(elbow[0], elbow[1], 3.2, 3.2, 'o', { bias: 0.12 });
    segment(s, elbow, wrist, 2.8, 3.4, 1, 72 + sx);
    // the hand, swollen, its two fingers dark-tipped
    s.ellipse(wrist[0], wrist[1] + 2, 4, 5, 'o', { bias: 0.08, ...shell(74 + sx) });
    const open = stride % 2 ? 1.6 : 0.6;
    s.tube(wrist[0], wrist[1] + 5, wrist[0] - sx * open, wrist[1] + 11, 1.4, 'e', { rb: 0.5 });
    s.tube(wrist[0], wrist[1] + 5, wrist[0] + sx * (open + 1.5), wrist[1] + 10, 1.2, 'e', { rb: 0.5 });
  }
  // ---- the carapace: pear-shaped, broad at the back, spined round its edge, knobbed all over
  s.paint([cx - 24, cy - 24, cx + 24, cy + 24], (x, y) => {
    const t = (y - (cy - 20)) / 40;
    const a = Math.atan2(y - cy, x - cx);
    return t > 0 && t < 1 && Math.abs(x - cx) < (18 + Math.max(0, Math.sin(a * 9)) * 2.6) * Math.sin(Math.PI * Math.min(1, 0.25 + t * 0.85)) * (1 - Math.max(0, t - 0.7) * 1.1);
  }, 'o', (x, y) => 0.4 + 0.52 * Math.max(0, 1 - Math.hypot(x - cx + 7, y - cy + 8) / 24), shell(3));
  // the grooves between its regions: an H over the middle, the gastric bulge, the branchial swellings
  for (const sx of [-1, 1]) {
    for (let t = 0; t < 1; t += 0.04) s.px(cx + sx * (5 + Math.sin(t * Math.PI) * 2), cy - 10 + t * 18, 0x7a2a10, 0.85);
    s.ellipse(cx + sx * 11, cy - 3, 5, 7, 'o', { bias: 0.1, ...shell(5 + sx) });
  }
  for (let x = -5; x <= 5; x += 0.5) s.px(cx + x, cy - 1 + Math.abs(x) * 0.2, 0x7a2a10, 0.85);
  s.ellipse(cx, cy - 8, 4.6, 5, 'o', { bias: 0.12, ...shell(8) });
  // tubercles and spines, each with its pale tip
  for (let k = 0; k < 30; k++) {
    const a = k * 2.399;
    const r = 2 + Math.sqrt(k) * 3.2;
    const x = cx + Math.cos(a) * r * 1.05;
    const y = cy - 2 + Math.sin(a) * r * 1.2;
    if (Math.abs(x - cx) > 16 || y < cy - 17 || y > cy + 17) continue;
    s.ellipse(x, y, 1.5 + (k % 3) * 0.4, 1.5 + (k % 3) * 0.4, 'o', { bias: 0.2 });
    s.px(x - 0.5, y - 0.9, 0xffe8c8);
  }
  // the two short horns at the front, the eyes on their stalks, the mouthparts
  for (const sx of [-1, 1]) {
    s.tube(cx + sx * 2.5, cy + 17, cx + sx * 4, cy + 23, 1.6, 'o', { rb: 0.6 });
    s.px(cx + sx * 4, cy + 23, 0xffe8c8);
    s.tube(cx + sx * 6, cy + 13, cx + sx * 8, cy + 17, 1.2, 'o');
    s.dot(cx + sx * 8.2, cy + 17.6, 1.6, INK);
    s.px(cx + sx * 8.2 - 0.6, cy + 17, 0xffffff);
  }
  s.poly([[cx - 3, cy + 14], [cx + 3, cy + 14], [cx + 2, cy + 18], [cx - 2, cy + 18]], 'e', { flat: 0.4 });
  return s.render();
}
