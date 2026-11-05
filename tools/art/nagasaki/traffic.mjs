// What moves on the Nagasaki strip, every route from somewhere to somewhere: cars keeping left on R1 from edge to
// edge and on every street, the trams in a loop from the Ishibashi terminus to the north edge and back, cars up
// the Inasa driveway round the summit car park and back down, the Gunkanjima tour boat from Hashima's landing to
// the Tokiwa pier, a tug at the harbour mouth, boats under the harbour bridge, a sightseeing boat round Dejima.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Raster } from '../../lib/raster.mjs';
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
  // cars face right (the props turn them to their heading); headlights and tail lights for the dusk
  const carF = (col, u) => {
    const r = new Raster(7, 4);
    r.rect(0, 0, 7, 4, col);
    r.rect(2, 0, 3, 4, scaleColor(col, 1.15));
    r.rect(1, 0, 1, 4, 0x283440);
    r.rect(5, 0, 1, 4, 0x283440);
    const f = frame(r, u);
    // the lights stay bright: put them on after the grade
    const fr = k.kit.frames.get(f);
    fr.set(6, 0, 0xfff4c8);
    fr.set(6, 3, 0xfff4c8);
    fr.set(0, 0, 0xff4030);
    fr.set(0, 3, 0xff4030);
    return f;
  };
  const busF = (body, band, u) => {
    const r = new Raster(12, 5);
    r.rect(0, 0, 12, 5, body);
    r.rect(0, 0, 12, 1, band);
    r.rect(0, 4, 12, 1, band);
    r.rect(3, 2, 6, 1, 0xb8bcc0);
    const f = frame(r, u);
    const fr = k.kit.frames.get(f);
    fr.set(11, 1, 0xfff4c8);
    fr.set(11, 3, 0xfff4c8);
    return f;
  };
  // Nagasaki trams: short single cars, green and cream, or in advertising colours
  const tramF = (body, band, roof, u) => {
    const r = new Raster(16, 5);
    r.rect(0, 0, 16, 5, body);
    r.rect(0, 0, 16, 1, band);
    r.rect(0, 4, 16, 1, band);
    r.rect(2, 1, 12, 3, roof);
    r.rect(7, 1, 2, 3, 0x5a5e66);
    const f = frame(r, u);
    const fr = k.kit.frames.get(f);
    for (let x = 1; x < 15; x += 2) {
      fr.set(x, 0, 0xffe0a0);
      fr.set(x, 4, 0xffe0a0);
    }
    fr.set(15, 1, 0xfff4c8);
    fr.set(15, 3, 0xfff4c8);
    return f;
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

  // ---- boats (with their wakes drawn into the frame; they face down the screen, turn: 'none')
  // a boat heading up the screen, its wake trailing below; down = the same turned round
  const flipV = (name) => {
    const src = k.kit.frames.get(name);
    const r = new Raster(src.w, src.h);
    for (let y = 0; y < src.h; y++) r.data.set(src.data.subarray((src.h - 1 - y) * src.w * 4, (src.h - y) * src.w * 4), y * src.w * 4);
    return kit.frame(r);
  };
  const boat = (w, h, hull, deck, u, cabin = 0xe8e8e0) => {
    const r = new Raster(w + 4, h + 8);
    const cx = (w + 4) / 2;
    for (let j = 0; j < 7; j++) {
      r.set(Math.round(cx - 1 - j * 0.6), h + j, 0xd8ecea, 0.5 - j * 0.06);
      r.set(Math.round(cx + j * 0.6), h + j, 0xd8ecea, 0.5 - j * 0.06);
    }
    r.ellipse(cx - 0.5, h / 2, w / 2, h / 2, 0x101418);
    r.ellipse(cx - 0.5, h / 2, w / 2 - 0.6, h / 2 - 0.6, hull);
    r.rect(cx - w / 2 + 1.5, 2, w - 3, h - 5, deck);
    r.rect(cx - w / 2 + 2, h / 2 - 2, w - 4, 4, cabin);
    return frame(r, u);
  };
  const tourUp = (() => {
    const r = new Raster(11, 26);
    r.ellipse(5, 13, 3.5, 9, 0x101418);
    r.ellipse(5, 13, 3, 8.5, 0x2a5a8a);
    r.rect(3, 7, 5, 11, 0xe8e8e0);
    r.rect(3, 10, 5, 3, 0x3a6a8a);
    for (let j = 0; j < 6; j++) {
      r.set(4 - Math.round(j * 0.6), 22 + j * 0.6, 0xd8ecea, 0.45);
      r.set(6 + Math.round(j * 0.6), 22 + j * 0.6, 0xd8ecea, 0.45);
    }
    return frame(r, 1000);
  })();
  const both = (up) => ({ fu: [up], fd: [flipV(up)] });
  kit.path([[160, 516], [152, 900], [110, 1180], [92, 1390], [91, 1590], [91, 1780], [112, 1862]], [tourUp], { sp: 11, mode: 'pp', hold: 8, turn: 'none', fps: 1, d: 0.02, ...both(tourUp) });
  const tug = boat(6, 11, 0xc8302a, 0x2a2a30, 1200, 0xe8e8e0);
  kit.path([[96, 1020], [84, 1180], [100, 1300]], [tug], { sp: 7, mode: 'pp', hold: 5, turn: 'none', d: 0.02, ...both(tug) });
  const sight = boat(6, 14, 0xe8e8e0, 0xc8c8c0, 2700, 0x3a7a5a);
  kit.path([[12, 2650], [12, 2780], [60, 2770], [120, 2740]], [sight], { sp: 8, mode: 'pp', hold: 6, turn: 'none', d: 0.02, ...both(sight) });
  // fishing boats on the Urakami harbour, in under the bridge from the west and out to the east
  const side = (col, u) => {
    const r = new Raster(16, 7);
    r.ellipse(8, 3, 6, 2.5, 0x101418);
    r.ellipse(8, 3, 5.5, 2, col);
    r.rect(5, 2, 4, 2, 0xe8e8e0);
    for (let x = 0; x < 3; x++) r.set(x, 3 + (x % 2 ? 1 : -1), 0xd8ecea, 0.5);
    const f = frame(r, u);
    k.kit.frames.get(f).set(6, 2, 0xffd890);
    return f;
  };
  kit.path([[-20, 5300], [W + 20, 5320]], [side(0xe8e8e0, 5300), side(0x3a6a9a, 5300)], { sp: 9, n: 2, gap: 120, turn: 'flip', cars: 1, d: 0.02 });
  kit.path([[W + 20, 5372], [-20, 5360]], [side(0xd8c8a0, 5300)], { sp: 7, n: 1, turn: 'flip', d: 0.02 });
}
