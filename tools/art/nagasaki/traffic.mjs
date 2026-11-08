// What moves on the Nagasaki strip, every route from somewhere to somewhere: cars keeping left on R1 from edge to
// edge and on every street, the trams in a loop from the Ishibashi terminus to the north edge and back, cars up
// the Inasa driveway round the summit car park and back down, the Gunkanjima tour boat from Hashima's landing to
// the Tokiwa pier, a tug at the harbour mouth, boats under the harbour bridge, a sightseeing boat round Dejima.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HiCanvas } from '../hires.mjs';
import { planTraffic } from '../props.mjs';
import { CARS, scaleColor } from './canvas.mjs';
import { W, R1, TRAM_U0, STREETS, MEGAMI_U, B_X, FUCHI, DRIVE, PARK, offset } from './geo.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export function paintTraffic(k) {
  const { kit, tod } = k;
  const stage = JSON.parse(readFileSync(join(root, 'src', 'data', 'stage8.json'), 'utf8'));
  const { mid: V, anchor } = stage.scroll;
  const visible = (u) => {
    const tMid = (u - anchor) / V;
    return [Math.max(0, tMid - 16), tMid + 6];
  };
  const frame = (r, u) => kit.frame(tod.frame(r, u));
  // cars face right (the props turn them to their heading); the headlights and tail lights stay bright
  const carF = (col, u) => {
    const r = new HiCanvas(7, 4);
    const FL = 21;
    const FHh = 12;
    for (let j = 0; j < FHh; j++)
      for (let i = 0; i < FL; i++) {
        if ((i === 0 || i === FL - 1) && (j === 0 || j === FHh - 1)) continue;
        let c = j === 0 ? scaleColor(col, 1.2) : j === FHh - 1 ? scaleColor(col, 0.7) : col;
        const q = FL - 1 - i;
        const inner = j > 0 && j < FHh - 1;
        if (q >= 4 && q < 7) c = inner ? 0x283440 : scaleColor(col, 0.6);
        else if (q >= 7 && q < 15 && inner) c = scaleColor(col, 1.14);
        else if (q >= 15 && q < 17) c = inner ? 0x34404c : scaleColor(col, 0.6);
        r.px(i, j, c);
      }
    tod.frame(r, u);
    for (const j of [1, FHh - 2]) {
      r.px(FL - 1, j, 0xfff4c8);
      r.px(FL - 2, j, 0xfff4c8);
      r.px(0, j, 0xff4030);
    }
    return kit.frame(r);
  };
  const busF = (body, band, u) => {
    const r = new HiCanvas(12, 5);
    const FL = 36;
    const FHh = 15;
    for (let j = 0; j < FHh; j++)
      for (let i = 0; i < FL; i++) {
        if ((i === 0 || i === FL - 1) && (j === 0 || j === FHh - 1)) continue;
        const e = Math.min(j, FHh - 1 - j);
        let c = e < 1 ? scaleColor(band, j === 0 ? 1.15 : 0.7) : e < 3 ? band : body;
        if (i > FL - 5 && e >= 1) c = 0x2a3440;
        if (i >= 6 && i < FL - 8 && j >= 5 && j < 10) c = (i - 6) % 9 < 6 ? (j === 5 ? 0xe0e4e8 : (i + j) % 2 ? 0x8a8e94 : 0xb8bcc0) : body;
        r.px(i, j, c);
      }
    tod.frame(r, u);
    for (const j of [2, FHh - 3]) r.px(FL - 1, j, 0xfff4c8);
    return kit.frame(r);
  };
  // Nagasaki trams: short single cars, green and cream, or in advertising colours, lit windows along the sides
  const tramF = (body, band, roof, u) => {
    const r = new HiCanvas(16, 5);
    const FL = 48;
    const FHh = 15;
    for (let j = 0; j < FHh; j++)
      for (let i = 0; i < FL; i++) {
        if ((i < 2 || i >= FL - 2) && (j < 2 || j >= FHh - 2)) continue;
        const e = Math.min(j, FHh - 1 - j);
        let c = e < 1 ? scaleColor(band, j === 0 ? 1.15 : 0.7) : e < 3 ? band : j < 7 ? scaleColor(roof, 1.08) : roof;
        if (i > FL - 6 && e >= 2) c = 0x2a3440;
        if (i < 4 && e >= 2) c = 0x2a3440;
        r.px(i, j, c);
      }
    for (let i = 9; i < FL - 12; i += 12) for (let j = 5; j < 10; j++) for (let q = 0; q < 9; q++) r.px(i + q, j, j === 5 ? 0xc8ccd0 : q % 3 === 0 ? 0x6a6e74 : 0x9aa2aa);
    r.linePx(18, 7, 30, 7, 0x2a2a30);
    r.linePx(24, 3, 24, 11, 0x2a2a30);
    tod.frame(r, u);
    for (let i = 4; i < FL - 6; i += 5) {
      r.px(i, 1, 0xffe0a0);
      r.px(i + 1, 1, 0xffe0a0);
      r.px(i, FHh - 2, 0xffe0a0);
      r.px(i + 1, FHh - 2, 0xffe0a0);
    }
    for (const j of [3, FHh - 4]) r.px(FL - 1, j, 0xfff4c8);
    return kit.frame(r);
  };
  const cars = (u) => CARS.map((c) => carF(c, u));
  const day = cars(1300);
  const dusk = cars(3600);
  const nightC = cars(5600);
  const busD = busF(0xf0ece0, 0xc8302a, 1300);
  const busN = busF(0xf0ece0, 0x2a6aa8, 3600);
  const trams = [tramF(0x2a7a5a, 0xe8e0c8, 0xd8d4c0, 3200), tramF(0xe8e4d8, 0x2a7a5a, 0xc8c4b8, 3200), tramF(0xd8a030, 0xc8302a, 0xe8e0c8, 3200), tramF(0x3a5a9a, 0xe8e4d8, 0xd8dce0, 3200)];

  const routes = [];
  // the trams: a closed loop on the two tracks, crossing over at the Ishibashi terminus (off-screen at the north)
  const track = R1.filter(([, u]) => u >= TRAM_U0);
  const north = offset(track, 3);
  const south = offset([...track].reverse(), 3);
  routes.push({ pts: [...north, [230, 5240], [230, 5180], ...south, north[0]], sp: 20, n: 8, gap: 760, s0: 0.05, size: [16, 5], frames: trams, cars: 1 });
  // R1's cars, north and south, edge to edge (they keep left; the tracks run between them)
  const r1n = offset(R1, 7);
  const r1s = offset([...R1].reverse(), 7);
  routes.push({ pts: r1n, sp: 26, n: 12, gap: 340, size: [7, 4], frames: [day[0], busD, day[3], dusk[2], dusk[5], nightC[1]], cars: 1 });
  routes.push({ pts: r1s, sp: 31, n: 12, gap: 320, size: [12, 5], frames: [day[2], day[6], busN, dusk[0], dusk[4], nightC[7]], cars: 1 });
  // the streets, edge to edge both ways
  for (const s of STREETS) {
    if (s.kind !== 'car') continue;
    const set = s.u < 2400 ? day : s.u < 4200 ? dusk : nightC;
    const lane = s.u === MEGAMI_U ? 3 : 2.5;
    routes.push({ pts: [[-14, s.u + lane], [W + 14, s.u + lane]], sp: 30, n: 2, gap: 110, size: [7, 4], frames: [set[(s.u / 2) % 9 | 0], set[(s.u / 3 + 4) % 9 | 0]], cars: 1 });
    routes.push({ pts: [[W + 14, s.u - lane], [-14, s.u - lane]], sp: 27, n: 2, gap: 120, size: [7, 4], frames: [set[(s.u / 5 + 1) % 9 | 0], set[(s.u / 7 + 6) % 9 | 0]], cars: 1 });
  }
  // up to the summit: in from the east on the 5112 street, north over the bridge, round the roundabout, up the
  // switchbacks, round the car park, down again and out east the way they came
  const up = offset(DRIVE, 2);
  const down = offset([...DRIVE].reverse(), 2);
  const ring = (a0, a1, r) => {
    const out = [];
    for (let i = 0; i <= 6; i++) {
      const a = a0 + ((a1 - a0) * i) / 6;
      out.push([FUCHI.x + Math.cos(a) * r, FUCHI.u + Math.sin(a) * r]);
    }
    return out;
  };
  const summit = [
    [W + 14, 5112 + 2.5], [B_X + 2.5, 5112 + 2.5], [B_X + 2.5, FUCHI.u - FUCHI.r - 2], ...ring(-Math.PI / 2, -Math.PI * 1.1, FUCHI.r - 3),
    ...up, [PARK.x1 - 6, PARK.u0 + 6], [PARK.x1 - 6, PARK.u1 - 6], [PARK.x0 + 6, PARK.u1 - 6], [PARK.x0 + 6, PARK.u0 + 10], [DRIVE.at(-1)[0] - 2, PARK.u0 + 4],
    ...down, ...ring(Math.PI * 0.9, Math.PI * 1.5, FUCHI.r - 3), [B_X - 2.5, FUCHI.u - FUCHI.r - 2], [B_X - 2.5, 5112 - 2.5], [W + 14, 5112 - 2.5],
  ];
  routes.push({ pts: summit, sp: 22, n: 6, gap: 420, size: [7, 4], frames: [nightC[0], nightC[4], nightC[2], nightC[7], nightC[3], nightC[5]], cars: 1 });

  // (NOPLAN=1 skips the slow planning in quick previews)
  const s0s = process.env.NOPLAN ? routes.map((r, i) => r.s0 ?? (i * 0.37) % 1) : planTraffic(routes, visible, { seed: 8121 });
  routes.forEach((r, i) => kit.path(r.pts, r.frames, { sp: r.sp, n: r.n, gap: r.gap, s0: s0s[i], turn: 'rot', cars: r.cars, d: 0.45 }));

  // ---- boats: hulls from above with the bow to the right, turned by the props along their routes, wakes behind them
  const wake = (u) => ({ f: k.wakeF(u), every: 5, life: 1.6 });
  const tour = k.hull(26, 9, 1000, 0x2a5a8a, 0xe8e8e0, (r, FL, FHh) => {
    for (let j = 6; j < FHh - 6; j++) for (let i = 12; i < 54; i++) r.px(i, j, j === 6 ? 0xffffff : j === FHh - 7 ? 0x8a8e94 : (i - 12) % 7 === 0 ? 0x4a5a6a : i > 48 ? 0x3a5a7a : 0xdcdcd4);
    for (let i = 14; i < 50; i += 7) for (let j = 9; j < FHh - 9; j++) r.px(i + 2, j, 0x3a6a8a);
  });
  kit.path([[160, 516], [152, 900], [110, 1180], [92, 1390], [91, 1590], [91, 1780], [112, 1862]], [tour], { sp: 11, mode: 'pp', hold: 8, turn: 'rot', d: 0.02, wake: wake(1200) });
  const tug = k.hull(13, 6, 1200, 0xc8302a, 0x2a2a30, (r, FL, FHh) => {
    for (let j = 4; j < FHh - 4; j++) for (let i = 10; i < 26; i++) r.px(i, j, j === 4 ? 0xffffff : i > 22 ? 0x2a3a4a : 0xe8e8e0);
    r.rectPx(4, 7, 4, 4, 0xe8a030);
  });
  kit.path([[96, 1020], [84, 1180], [100, 1300]], [tug], { sp: 7, mode: 'pp', hold: 5, turn: 'rot', d: 0.02, wake: wake(1200) });
  const sight = k.hull(16, 6, 2700, 0xe8e8e0, 0xc8c8c0, (r, FL, FHh) => {
    for (let j = 4; j < FHh - 4; j++) for (let i = 8; i < 34; i++) r.px(i, j, j === 4 ? 0xf8f8f4 : (i - 8) % 5 === 0 ? 0x4a5a5a : 0x3a7a5a);
    for (let i = 10; i < 32; i += 5) r.px(i, 2, 0xffd890);
  });
  kit.path([[12, 2650], [12, 2780], [60, 2770], [120, 2740]], [sight], { sp: 8, mode: 'pp', hold: 6, turn: 'rot', d: 0.02, wake: wake(2700) });
  // fishing boats on the Urakami harbour, in under the bridge from the west and out to the east
  const fisher = (col, u) => k.hull(14, 6, u, col, 0xc8c0b0, (r, FL, FHh) => {
    for (let j = 4; j < FHh - 4; j++) for (let i = 8; i < 18; i++) r.px(i, j, j === 4 ? 0xffffff : i > 15 ? 0x2a3a4a : 0xe8e8e0);
    r.px(12, 3, 0xffd890);
  });
  kit.path([[-20, 5300], [W + 20, 5320]], [fisher(0xe8e8e0, 5300), fisher(0x3a6a9a, 5300)], { sp: 9, n: 2, gap: 120, turn: 'rot', cars: 1, d: 0.02, wake: wake(5300) });
  kit.path([[W + 20, 5372], [-20, 5360]], [fisher(0xd8c8a0, 5300)], { sp: 7, n: 1, turn: 'rot', d: 0.02, wake: wake(5300) });
}
