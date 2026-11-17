// What flies over Tokyo, for the near layer (docs/plan-tokyo.md, phase 8): crows, advertising balloons, and an
// airship with no name on it. Their frames go into the stage's own atlas (props) under names the game asks for;
// when and where each comes is a schedule in meta.json (sky), read by Parallax. Also the soft shadows of clouds
// drifting over the city by day (cshadow_*), finer than the shared ones.
//   sky: [from u, to u, kind, every (s), first (s)] - while the middle of the screen is in [from, to), one of a
//   kind about every `every` seconds, the first after `first`.
import { HiCanvas, hashPx } from '../hires.mjs';
import { fbm } from '../../lib/raster.mjs';

const TAU = Math.PI * 2;

export const SKY = [
  [0, 2200, 'crows', 9, 3],
  [2100, 2900, 'crows', 5, 1], // (the crows going home to the forest of Meiji at dusk)
  [700, 2100, 'balloon', 11, 4],
  [2900, 4400, 'balloon', 16, 6],
  [6150, 7250, 'blimp', 70, 6],
  [10800, 11400, 'blimp', 70, 4],
];

export function sky(ctx) {
  const { props, S } = ctx;
  const frame = (w, h, name, draw) => {
    const c = new HiCanvas(w, h, S);
    draw((X, Y, col, a = 1) => c.hi.set(X, Y, col, a));
    props.frame(c.hi, name);
  };

  // ---- cloud shadows, soft-edged
  for (const [i, w, h, lobes, seed] of [
    [0, 96, 56, [[30, 30, 26, 20], [56, 24, 30, 20], [74, 34, 20, 16]], 41],
    [1, 80, 44, [[26, 22, 22, 16], [52, 20, 24, 17]], 57],
  ])
    frame(w, h, `cshadow_${i}`, (put) => {
      for (let Y = 0; Y < h * S; Y++)
        for (let X = 0; X < w * S; X++) {
          const [x, y] = [X / S, Y / S];
          let v = 0;
          for (const [cx, cy, rx, ry] of lobes) v = Math.max(v, 1 - Math.hypot((x - cx) / rx, (y - cy) / ry));
          v += (fbm(x, y, { seed, scale: 14, octaves: 4 }) - 0.5) * 0.35;
          const a = Math.max(0, Math.min(1, (v - 0.02) / 0.22));
          if (a > 0) put(X, Y, 0x000000, a);
        }
    });

  // ---- a crow, its head to the right, in three beats of its wings (down, level, up)
  for (let k = 0; k < 3; k++)
    frame(7, 7, `tcrow_${k}`, (put) => {
      const [cx, cy] = [10, 10];
      // the body and the head with its heavy beak, a wedge of a tail
      for (let i = -6; i <= 5; i++) for (let j = -1; j <= 1; j++) if (Math.abs(j) <= (i > 3 ? 1 : i < -4 ? 0 : 1)) put(cx + i, cy + j, j < 0 ? 0x2a2a34 : 0x16161c);
      for (let i = 4; i <= 7; i++) put(cx + i, cy - 1, 0x1c1c22);
      put(cx + 8, cy - 1, 0x3a3a40);
      put(cx + 8, cy, 0x3a3a40);
      put(cx + 6, cy - 2, 0x6a6a74); // (the light on its eye)
      for (let q = 0; q < 4; q++) for (let j = -q; j <= q; j++) put(cx - 7 - q, cy + j, 0x16161c);
      // the wings: spread across the body, each feather's tip apart
      const lift = [-0.5, 0, 0.6][k];
      for (const s of [-1, 1]) {
        const span = k === 1 ? 9 : 7;
        for (let q = 1; q <= span; q++) {
          const i = Math.round(-1 + q * lift * 0.5 * (k === 0 ? -1 : 1) - (q > span - 3 ? q - span + 3 : 0));
          for (let w = -2; w <= 1; w++) put(cx + i + w, cy + s * q, q > span - 2 && w === -2 ? 0x3a3a44 : 0x1c1c24);
        }
        if (k !== 1) for (let q = 2; q <= span; q += 2) put(cx - 3, cy + s * q, 0x2a2a34);
      }
    });

  // ---- balloons: round, a band of colour about each, a tether and a long banner of stripes (no writing)
  const BAL = [
    [0xe84a40, 0xf4f0e8, [0xf0c020, 0xe84a40, 0xf4f0e8]],
    [0x3a7ad0, 0xf4f0e8, [0x3a7ad0, 0xf4f0e8, 0x60c0f0]],
    [0xf0c020, 0x2a2a34, [0xe84a8a, 0xf0c020, 0x40b070]],
  ];
  BAL.forEach(([c, band, stripes], k) =>
    frame(12, 26, `tballoon_${k}`, (put) => {
      const [cx, cy, r] = [18, 15, 14];
      for (let j = -r; j <= r; j++)
        for (let i = -r; i <= r; i++) {
          const d = Math.hypot(i, j) / r;
          if (d > 1) continue;
          const lam = Math.max(0, Math.min(1, 0.65 - (i + j) / (2.4 * r) + Math.sqrt(1 - d * d) * 0.25));
          const base = Math.abs(j) < 3 ? band : c;
          const mix = (a, b, t) => {
            const f = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
            return (f(16) << 16) | (f(8) << 8) | f(0);
          };
          put(cx + i, cy + j, d > 0.94 ? mix(base, 0x000000, 0.4) : lam > 0.85 ? mix(base, 0xffffff, 0.45) : mix(base, 0x000000, (1 - lam) * 0.45));
        }
      for (let q = 0; q < 4; q++) put(cx - 1 + (q % 2), cy + r + q, 0x3a3a40); // the knot, the tether
      for (let q = 4; q < 30; q++) put(cx + Math.round(Math.sin(q * 0.3) * 1.2), cy + r + q, 0x8a8a90, 0.8);
      // the banner hanging from it, rippling
      for (let j = 0; j < 36; j++)
        for (let i = 0; i < 7; i++) {
          const x = cx + 3 + i + Math.round(Math.sin(j * 0.35 + i * 0.2) * 1.6);
          put(x, cy + r + 6 + j, i === 0 || i === 6 ? 0x4a4a52 : stripes[Math.floor(j / 6) % stripes.length]);
        }
    }),
  );

  // ---- the airship: a long silver hull, fins, a gondola under it, a lit panel down its flank showing slow bands
  // of colour (no letters), lamps on its nose, tail and fin tips - two frames, the lamps and the panel changing
  for (let k = 0; k < 2; k++)
    frame(54, 20, `tblimp_${k}`, (put) => {
      const [L, R0] = [150, 22];
      const [x0, cy] = [6, 30];
      // the fins at the tail, two seen spread, a third pointing up (toward the camera) as a short dark bar
      for (const s of [-1, 1]) for (let q = 0; q < 12; q++) for (let i = 0; i < 14 - q; i++) put(x0 + 4 + i, cy + s * (R0 - 6 + q), q > 9 ? 0x6a7078 : 0x9aa0aa);
      for (let j = -R0; j <= R0; j++)
        for (let i = 0; i < L; i++) {
          const t = (i - L / 2) / (L / 2);
          const hw = R0 * Math.sqrt(Math.max(0, 1 - t ** 2)) * (t < 0 ? 1 - (-t) * 0.15 : 1);
          if (Math.abs(j) > hw) continue;
          const n = j / Math.max(1, hw);
          let c = n < -0.55 ? 0xe8eef4 : n < -0.1 ? 0xc8d0da : n < 0.5 ? 0xa0a8b4 : 0x6a727e;
          if (i % 18 === 0) c = 0x8a929e; // the seams of its envelope
          put(x0 + i, cy + j, c);
        }
      // the panel: bands of colour sliding slowly
      for (let j = -6; j <= 6; j++)
        for (let i = 40; i < 110; i++) {
          const band = Math.floor((i + k * 6) / 12) % 4;
          const col = [0xff5a8a, 0x60d0ff, 0xffd060, 0x80f0a0][band];
          put(x0 + i, cy + j, Math.abs(j) === 6 || i === 40 || i === 109 ? 0x2a2e38 : (i + j) % 3 === 0 ? 0xffffff : col);
        }
      // the gondola, lit windows
      for (let j = 0; j < 7; j++) for (let i = 0; i < 26; i++) put(x0 + 62 + i, cy + R0 - 2 + j, j === 0 || j === 6 || i === 0 || i === 25 ? 0x4a5058 : i % 3 ? 0xfff0c0 : 0x6a7078);
      // lamps: white on the nose and tail, red and green at the fins, the beacon blinking
      put(x0 + L - 1, cy, 0xffffff);
      put(x0 + 1, cy, 0xffffff);
      put(x0 + 8, cy - R0 - 3, 0xff3030);
      put(x0 + 8, cy + R0 + 3, 0x30ff60);
      if (k === 0) for (const [i, j] of [[75, -R0], [76, -R0], [75, -R0 - 1], [76, -R0 - 1]]) put(x0 + i, cy + j, 0xff4040);
    });

  ctx.sky = SKY;
  void TAU;
  void hashPx;
}
