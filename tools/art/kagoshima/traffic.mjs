// What drives on the Kagoshima strip, every route from somewhere to somewhere: cars keeping left on the columns and streets, the
// trams on their lawn from the terminus to the depot and back, the coast road north past Sengan-en, Sakurajima's road from
// the port to the observatory, with the ash sweepers trundling along it in their dust.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HiCanvas } from '../hires.mjs';
import { planTraffic } from '../props.mjs';
import { CARS, scaleColor } from '../nagasaki/canvas.mjs';
import { W, STREETS, COLUMNS, DEPOT, RIVER, SENGAN, BAY, coastX, lavaRoadX, ISLAND, LAVA_ROAD, ROAD_END } from './geo.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export function paintTraffic(k) {
  const { kit, tod } = k;
  const stage = JSON.parse(readFileSync(join(root, 'src', 'data', 'stage4.json'), 'utf8'));
  const { mid: V, anchor } = stage.scroll;
  const visible = (u) => {
    const tMid = (u - anchor) / V;
    return [Math.max(0, tMid - 16), tMid + 6];
  };
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
    return kit.frame(r);
  };
  // Kagoshima's trams: red and cream, the green Yuyu, an orange, a white, lit along the sides
  const tramF = (body, band, roof, u) => {
    const r = new HiCanvas(26, 6);
    const FL = 78;
    const FHh = 18;
    for (let j = 0; j < FHh; j++)
      for (let i = 0; i < FL; i++) {
        if ((i < 2 || i >= FL - 2) && (j < 2 || j >= FHh - 2)) continue;
        const e = Math.min(j, FHh - 1 - j);
        let c = e < 1 ? scaleColor(band, j === 0 ? 1.15 : 0.7) : e < 4 ? band : j < 8 ? scaleColor(roof, 1.08) : roof;
        if (i > FL - 6 && e >= 2) c = 0x2a3440;
        if (i < 4 && e >= 2) c = 0x2a3440;
        if (i % 26 === 0) c = scaleColor(c, 0.7);
        r.px(i, j, c);
      }
    for (let i = 8; i < FL - 10; i += 14) for (let q = 0; q < 10; q++) for (const j of [2, FHh - 3]) r.px(i + q, j, 0x8aa8c0);
    r.linePx(30, 9, 48, 9, 0x2a2a30);
    return kit.frame(tod.frame(r, u));
  };
  const cars = (u) => CARS.map((c) => carF(c, u));
  const day = cars(600);
  const haze = cars(2500);
  const dusk = cars(5000);
  const bus = busF(0xf0ece0, 0xc8302a, 600);
  const bus2 = busF(0xf0e8c8, 0x2a6aa8, 600);
  const bus3 = busF(0xf0ece0, 0x3a8a5a, 5000);
  const trams = [tramF(0xd84a2a, 0xe8e0d0, 0xc8c4b8, 700), tramF(0xe8e0d0, 0x2a8a5a, 0xc8c4b8, 700), tramF(0x2a8a5a, 0xe8e0d0, 0xd8dce0, 700), tramF(0xe8a030, 0xe8e0d0, 0xd8d4c8, 700)];

  const routes = [];
  for (const [x, f] of [[87, trams[0]], [93, trams[1]], [87, trams[2]], [93, trams[3]]]) kit.path([[x, -30], [x, DEPOT.u0 + 20]], [f], { sp: 9, mode: 'pp', hold: 4, turn: 'rot', s0: (x + routes.length * 0 + (f === trams[2] || f === trams[3] ? 200 : 0)) % 0.97, d: 0.45 });
  routes.push({ pts: [[82, -14], [82, 1161], [W + 14, 1163]], sp: 26, n: 8, gap: 220, frames: [day[0], bus, day[3], day[6], day[1]] });
  routes.push({ pts: [[-14, 1169], [98, 1169], [98, -14]], sp: 28, n: 8, gap: 240, frames: [day[2], bus2, day[5], day[8], day[4]] });
  // the coast road from the city out along the shore, either way
  const coast = (side) => {
    const pts = [[150 + side * 2.4, -14]];
    for (let u = 1320; u < BAY[0] + 160; u += 12) {
      const cx = coastX(u);
      if (cx < -14) break;
      pts.push([cx + side * 2, u]);
    }
    return pts;
  };
  routes.push({ pts: coast(-1), sp: 24, n: 12, gap: 300, frames: [day[1], day[4], bus2, haze[2], haze[5], haze[7]] });
  routes.push({ pts: coast(1).reverse(), sp: 28, n: 12, gap: 320, frames: [day[7], haze[0], haze[3], bus, haze[6], haze[8]] });
  routes.push({ pts: [[28, -14], [28, RIVER[0] - 6]], sp: 22, n: 3, gap: 300, frames: [day[2], day[5], day[8]] });
  routes.push({ pts: [[32, RIVER[0] - 6], [32, -14]], sp: 24, n: 3, gap: 320, frames: [day[1], day[3], day[6]] });
  for (const u of STREETS) {
    routes.push({ pts: [[-14, u + 2.5], [W + 14, u + 2.5]], sp: 30, n: 2, gap: 120, frames: [day[(u / 2) % 9 | 0], day[(u / 3 + 4) % 9 | 0]] });
    routes.push({ pts: [[W + 14, u - 2.5], [-14, u - 2.5]], sp: 27, n: 2, gap: 130, frames: [day[(u / 5 + 1) % 9 | 0], day[(u / 7 + 6) % 9 | 0]] });
  }
  // Sakurajima: along the port's road and up through the village towards the lava
  const iu = ISLAND[0] + 110;
  routes.push({ pts: [[-14, iu + 2], [148, iu + 2], [148, LAVA_ROAD[0] - 10]], sp: 18, n: 4, gap: 300, frames: [dusk[0], bus3, dusk[3], dusk[7]] });
  routes.push({ pts: [[152, LAVA_ROAD[0] - 10], [152, iu - 2], [-14, iu - 2]], sp: 20, n: 4, gap: 280, frames: [dusk[2], dusk[5], bus3, dusk[8]] });

  const s0s = process.env.NOPLAN ? routes.map((r, i) => r.s0 ?? (i * 0.37) % 1) : planTraffic(routes.map((r) => ({ ...r, size: [7, 4], cars: 1 })), visible, { seed: 4121 });
  routes.forEach((r, i) => kit.path(r.pts, r.frames, { sp: r.sp, n: r.n, gap: r.gap, s0: s0s[i], turn: 'rot', cars: 1, d: 0.45 }));

  // the ash sweepers: white trucks with a beacon and brushes, a cloud of grey dust rolling behind them
  const sweeper = k.sprite(11, 6, 5800, (r) => {
    for (let j = 1; j < 17; j++) for (let i = 0; i < 33; i++) r.px(i, j, j < 3 ? 0xffffff : j > 14 ? 0xb8b4ac : i > 25 ? (i > 30 ? 0x2a3a4a : 0x3a5a8a) : i < 4 ? 0x2a2a2e : (i >> 2) % 2 ? 0xe8e4dc : 0xd8d4cc);
    r.rectPx(14, 7, 4, 4, 0xf0a020);
  });
  const dust = [9, 12, 15, 15].map((rad, q) => k.sprite(rad * 2 / 3 + 1, rad * 2 / 3 + 1, 5800, (r) => {
    for (let j = -rad; j <= rad; j++)
      for (let i = -rad; i <= rad; i++) {
        if (i * i + j * j > rad * rad) continue;
        if (((i + rad) * 7 + (j + rad) * 13) % 5 < 3 - q * 0.6) r.px(rad + i, rad + j, 0x9a948c, 0.7);
      }
  }));
  for (const [off, s0] of [[-2, 0.2], [2, 0.7]]) {
    const pts = [];
    for (let u = LAVA_ROAD[0] - 300; u < ROAD_END; u += 16) pts.push([Math.round(lavaRoadX(u)) + off, u]);
    kit.path(pts, [sweeper], { sp: 6, mode: 'pp', hold: 4, turn: 'rot', wake: { f: dust, every: 4, life: 2.4 }, s0, d: 0.45 });
  }
  void SENGAN;
}
