// Hakata station and the airport (u 3800-4400, docs/plan-fukuoka.md phase 5) on a clear morning. The station square
// with its buses, taxis and people, trees and lamps; the station: its concourse building, the platforms between the
// main line's six tracks under long canopies, local trains coming and going, the shinkansen on its viaduct pulling in
// (white, a plain grey band: no company's colours); the Mikasa river with trees along it; the airport: the terminal
// with its jet bridges and planes at the stands, the apron's markings, service cars, the control tower, the hangar,
// the runway with its marks and edge lights, a plane coming in to land over the roofs and another taxiing out. No
// names, no airlines' colours.
import { PAL, shade } from '../tokyo/kit.mjs';
import { hashPx } from '../hires.mjs';
import { ROADS, RAILS } from './route.mjs';
import { railHalf } from '../tokyo/geom.mjs';
import { freeMap } from './free.mjs';

const [U0, U1] = [3790, 4400];
const road = (id) => ROADS.find((r) => r.id === id);

/** A plane seen from above, nose up the strip or down it (down), fine pixels on put: wings, tailplane, engines, windows. */
const plane = (put0, k = 1, down = false) => {
  const [W2, H] = [Math.round(18 * k), Math.round(20 * k)];
  const put = down ? (i, j, ...c) => put0(i, H * 2 - 1 - j, ...c) : put0;
  for (let j = 0; j < H * 2; j++) {
    const t = j / (H * 2);
    const half = t < 0.08 ? Math.round(t * 20) : t > 0.85 ? 1 : 2; // the fuselage: its nose, its tail
    for (let i = -half; i <= half; i++) put(W2 + i, j, i === -half ? 0xc8ccd2 : i === half ? 0xb0b4ba : 0xf0f2f4);
    if (j > H * 0.6 && j < H * 1.3) {
      const span = Math.round(W2 * Math.min(1, (j - H * 0.6) / (H * 0.5)) * (1 - Math.max(0, j - H * 1.1) / (H * 0.25)));
      for (let i = 3; i <= span; i++) for (const s of [-1, 1]) put(W2 + s * i, j, i === span ? 0x9aa0a8 : 0xe0e4e8); // the wings, swept
      if (j > H * 0.8 && j < H * 0.95) for (const s of [-1, 1]) for (let i = 6; i <= 8; i++) put(W2 + s * Math.round(i * k), j, 0x6a6e76); // the engines
    }
    if (j > H * 1.75 && j < H * 1.95) for (let i = 2; i <= Math.round(W2 * 0.4); i++) for (const s of [-1, 1]) put(W2 + s * i, j, 0xd8dce0); // the tailplane
    if (j > 4 && j < H * 1.6 && j % 3 === 0) { put(W2 - half + 1, j, 0x4a5a6a); put(W2 + half - 1, j, 0x4a5a6a); } // windows
  }
  put(W2, Math.round(H * 1.85), 0x8a949e); // the fin
};

export function kuko(ctx) {
  const { kit, plot, props, S, pave, W, GROUNDS } = ctx;
  const { house, building, mark, ground, rand, pick, P, R, FX, FY, queue, shadowBox, hi, lamp, crowd, E, ER, halo, car, trafficOn, tree, glint, trainOn, canopy } = kit;
  const { boxFree, claim } = freeMap(U0, U1);

  // ---- the station square: a bus terminal along its side, taxis in a row, trees and lamps, people
  {
    const [x, u, w, h] = GROUNDS.find((g) => g.id === 'ekimae').rect;
    for (let k = 0; k < 4; k++) mark(x + 4 + k * 5, u + 4, (X, Y) => {
      R(X - 2, Y - 18, 6, 18, 0xe8ecf0); // a bus at its stand, its roof and the units on it
      R(X - 1, Y - 15, 4, 4, 0x9aa4ae);
      R(X - 2, Y - 18, 6, 1, 0x3a6aa8);
      hi.tint(X + 4, Y - 16, 0.7);
    });
    for (let k = 0; k < 6; k++) car(x + 34 + k * 3.2, u + 4, true, k % 2 ? 0x2a2a30 : 0xe8d8a0);
    for (const tx of [x + 56, x + 64, x + 72]) tree('broadleaf', tx, u + h - 4, 2);
    for (let k = 0; k < 5; k++) mark(x + 30 + k * 10, u + h - 2, (X, Y) => lamp(X, Y));
    crowd(x + 28, u + 8, 46, 14, 26);
  }
  // ---- the station: the concourse along the square, canopies over the platforms between the tracks
  {
    const p = plot('hakata_eki');
    building(p.x, p.u, p.w, 9, { style: 'glass', face: 6, wall: 0xb8c4cc, roof: 0x7a8088, shop: true, s: 24001, tiers: [{ in: [20, 1, 20, 1], face: 5, style: 'office', wall: 0xc8ccd0 }] });
    const main = RAILS.find((r) => r.id === 'kagoshima_honsen');
    const top = main.pts[0][1] + railHalf(main);
    const bot = main.pts[0][1] - railHalf(main);
    // the platforms between pairs of tracks, each under a long canopy
    for (let k = 0; k < 3; k++) {
      const u = bot + 2.6 + k * 10;
      queue(FY(u) + 1, () => {
        const [X0, X1, Y] = [FX(p.x + 6), FX(p.x + p.w - 6), FY(u + 2.4)];
        for (let j = 0; j < 7; j++) for (let i = X0; i < X1; i++) P(i, Y + j, canopy(i - X0, j, 7));
      }, () => shadowBox(FX(p.x + 6), FY(u + 2.4), FX(p.x + p.w - 6) - FX(p.x + 6), 7, 3, 0.7));
    }
    void top;
    // local trains on the main line, the shinkansen on its viaduct (white, a grey band)
    trainOn([[-20, main.pts[0][1] - 5], [W + 20, main.pts[0][1] - 5]], 0xa8b0b8, { n: 6, sp: 30, mode: 'pp', hold: 8, s0: 0.1 });
    trainOn([[W + 20, main.pts[0][1] + 5], [-20, main.pts[0][1] + 5]], 0x6a7a8a, { n: 5, sp: 28, mode: 'pp', hold: 8, s0: 0.6 });
    const shin = RAILS.find((r) => r.id === 'shinkansen');
    trainOn([[-30, shin.pts[0][1] - 2.5], [W + 30, shin.pts[0][1] - 2.5]], 0x8a9098, { n: 8, sp: 40, mode: 'pp', hold: 10, s0: 0.35 });
  }

  // ---- the Mikasa river: trees along its banks, the morning light on the water
  for (let x = 4; x < W; x += 8) {
    const u = 3950 + x * (20 / 200);
    for (const off of [-9, 9]) if (boxFree(x - 1, u + off - 1, 2, 2)) tree('broadleaf', x, u + off, 1.6);
    glint(FX(x), FY(u), 5, 0xfff8e0, 0.4);
  }

  // ---- the airport: the terminal and its jet bridges, planes at the stands, the apron's marks and service cars, the
  // control tower, the hangar, the runway's marks and lights
  {
    const t = plot('kuko_terminal');
    building(t.x, t.u, t.w, t.h, { style: 'glass', face: 5, wall: 0xa8b8c8, roof: 0xc8ccd0, s: 24011, tiers: [{ in: [3, 4, 3, 4], face: 2, roof: 0xd8dce0, style: 'glass' }] });
    const stands = [4112, 4136, 4160];
    for (const [k, u] of stands.entries()) {
      mark(t.x + t.w, u, (X, Y) => {
        for (let i = 0; i < 18; i++) for (let j = -1; j <= 1; j++) P(X + i, Y + j, j === 0 ? 0xd8dce0 : 0x9aa0a8); // a jet bridge
      });
      const f = kit.frame(12, 13.4, u, (put) => plane(put, 1));
      props.loop(t.x + t.w + 8 - 6, u + 6.5 + (k % 2), [f], { fps: 1, d: 0.1 });
      car(t.x + t.w + 3, u - 4, false, 0xe0c040); // a service car by it
    }
    ground(() => {
      // the apron's taxi lines to the stands, the stands' marks
      for (const u of stands) for (let x = FX(t.x + t.w + 6); x < FX(106); x++) if ((x >> 1) % 2) P(x, FY(u - 7), 0xe0c040);
      for (let u = FY(4392); u < FY(4000); u += 1) if ((u >> 2) % 3 === 0) P(FX(104), u, 0xe0c040);
    });
    // remote stands: planes parked on the apron, baggage carts in trains, light masts
    for (const [x, u] of [[90, 4206], [90, 4246], [64, 4206], [64, 4246]])
      queue(FY(u), () => plane((i, j, c) => P(FX(x) - 18 + i, FY(u) - 20 + j, c), 1), () => shadowBox(FX(x) - 14, FY(u) - 18, 28, 36, 3, 0.75));
    for (let k = 0; k < 4; k++) mark(56 + k * 9, 4186, (X, Y) => {
      for (let c = 0; c < 4; c++) { R(X + c * 5, Y - 3, 4, 3, 0x8a9098); R(X + c * 5, Y - 3, 4, 1, 0xb8bcc0); }
      R(X - 4, Y - 3, 3, 3, 0xe0c040); // the tug
    });
    for (const [x, u] of [[44, 4196], [100, 4196], [44, 4280], [100, 4280]]) mark(x, u, (X, Y) => {
      R(X, Y - 2, 2, 2, 0x6a6e76);
      for (let d = 1; d < 14; d++) hi.tint(X + d, Y - 1 + (d >> 2), 0.82); // its long morning shadow
    });
    const ct = plot('kanseito');
    building(ct.x + 2, ct.u + 2, ct.w - 4, ct.h - 4, { style: 'glass', face: 14, wall: 0xd8dce0, roof: 0x5a6a7a, s: 24021 });
    const hg = plot('kakunoko');
    building(hg.x, hg.u, hg.w, hg.h, { style: 'plain', face: 6, wall: 0xc8ccd0, roof: 0xb8bcc0, s: 24031 });
    mark(hg.x + hg.w / 2, hg.u + 1, (X, Y) => {
      for (let i = -14; i <= 14; i++) P(X + i, Y - 1, (i & 1) ? 0x5a6068 : 0x8a9098); // its doors
    });
    // the runway: its threshold bars, numbers left out, the touchdown marks, the edge lights
    const [rx, ru, rw, rh] = GROUNDS.find((g) => g.id === 'kassoro').rect;
    ground(() => {
      for (const u0 of [ru + 4, ru + rh - 10]) for (let j = 0; j < 12; j++) for (let i = 2; i < FX(rx + rw) - FX(rx) - 2; i++) if ((i >> 1) % 3 !== 2) P(FX(rx) + i, FY(u0 + j / S * 2) , 0xe8e8e0);
      for (const u0 of [ru + 30, ru + 50, ru + rh - 40, ru + rh - 60]) for (const side of [0.3, 0.62]) R(FX(rx + rw * side), FY(u0 + 6), 6, 18, 0xe0e0d8);
      for (let u = ru; u < ru + rh; u += 6) for (const x of [rx + 0.4, rx + rw - 0.6]) P(FX(x), FY(u), 0xf0f0d8);
    });
    // a plane coming in to land over the city (flying: it moves, nose first, down the strip to the runway), and its
    // shadow on the ground, offset
    const air = kit.frame(16, 18, 4200, (put) => plane(put, 1.35, true));
    const shade_ = kit.frame(16, 18, 4200, (put) => plane((i, j) => put(i, j, 0x000000, 0.28), 1.35, true));
    props.path([[126, 4560], [126, 3700]], [shade_], { sp: 22, n: 1, mode: 'wrap', turn: 'none', s0: 0.15, d: -0.1 });
    props.path([[118, 4600], [118, 3740]], [air], { sp: 22, n: 1, mode: 'wrap', turn: 'none', s0: 0.15, d: 0.6 });
    // another taxiing along the runway and back, nose first both ways
    const taxiing = kit.frame(12, 13.4, 4200, (put) => plane(put, 1));
    const taxiingDown = kit.frame(12, 13.4, 4200, (put) => plane(put, 1, true));
    props.path(road('yudo_ro').pts, [taxiing], { sp: 4, n: 1, mode: 'pp', hold: 12, turn: 'none', fu: [taxiing], fd: [taxiingDown], s0: 0.5, d: 0.05 });
  }
  // the airport's grass: its fence, lights in rows past the runway's end
  {
    const [x, u, w, h] = GROUNDS.find((g) => g.id === 'kuko_shiba').rect;
    ground(() => {
      for (let Y = FY(u + h); Y < FY(u); Y++) if (Y % 3 === 0) P(FX(x + w - 1), Y, 0x8a8a86);
    });
    for (let k = 0; k < 12; k++) mark(x + 4 + (k % 3) * 12, u + 20 + Math.floor(k / 3) * 90, (X, Y) => R(X, Y, 3, 2, 0xe8e0a0));
  }

  // ---- the rest: offices and hotels by the station, houses and small works towards the river
  for (let u = U0; u < U1; u += 1)
    for (let x = 0; x < W - 4; x += 1) {
      const w = 9 + Math.floor(rand() * 12);
      const h = 9 + Math.floor(rand() * 10);
      if (!boxFree(x, u, w, h)) continue;
      claim(x - 1, u - 1, w + 2, h + 2);
      if (u < 3940) building(x + 0.5, u + 0.5, w - 1, h - 1, { style: pick(['office', 'glass', 'balcony']), face: 6 + Math.floor(rand() * 8), wall: pick(PAL.walls), roof: pick(PAL.roofs), shop: true });
      else if (rand() < 0.6) house(x + 0.5, u + 0.5, Math.min(w, 10) - 1, Math.min(h, 9) - 1, { tile: pick(PAL.tile) });
      else building(x + 0.5, u + 0.5, w - 1, h - 1, { style: 'plain', face: 3 + Math.floor(rand() * 3), wall: pick(PAL.walls), roof: pick(PAL.roofs) });
      x += w;
    }
  for (const id of ['kuko_dori', 'kuko_dori_2', 'mikasa_bashi']) trafficOn(road(id).pts, { sp: 16, gap: 60, s0: rand() });
  void E;
  void ER;
  void halo;
  void shade;
  void hashPx;
}
