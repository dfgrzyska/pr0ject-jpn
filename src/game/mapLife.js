import { RENDER_SCALE } from '../config.js';
import { INSET, project } from '../data/japan.js';

// Life on the map (docs/plan-mapa.md, iteration 6; drawn in tools/art/maplife.mjs): only what floats, runs or flies
// moves, and it moves along the map, never the ground with it. The ferries cross on their lines and back, the
// Shinkansen run their lines (keeping left), Sakurajima's ash and Aso's smoke rise and drift east, Beppu's steam
// rises off the town and off its pond, the shadows of clouds pass over. The ways are the ones drawn on the map
// (map_paths.json, written with the map by tools/art/japan.mjs).

const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const FERRY = 0.35; // map units a second (a ferry; much faster than a real one, or nothing would seem to move)
const TRAIN = 2.4; // (a Shinkansen)
const TURN = Math.PI / 16; // (headings in sixteenths of a half turn: the pixels don't crawl as it turns)

/** A polyline with its lengths so far. */
function track(pts) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, cum, len: cum[cum.length - 1] };
}

/** The point s along a track and its heading there. */
function along(tr, s) {
  const { pts, cum } = tr;
  let lo = 0;
  let hi = cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= s) lo = mid;
    else hi = mid;
  }
  const seg = cum[hi] - cum[lo] || 1;
  const u = Math.max(0, Math.min(1, (s - cum[lo]) / seg));
  const [a, b] = [pts[lo], pts[hi]];
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, Math.atan2(b[1] - a[1], b[0] - a[0])];
}

/** Out along the track and back, resting at either end: where it is at time t, and whether it is on the way back. */
function shuttle(tr, speed, rest, t) {
  const leg = tr.len / speed;
  const cycle = 2 * (leg + rest);
  const k = ((t % cycle) + cycle) % cycle;
  if (k < leg) return [k * speed, false];
  if (k < leg + rest) return [tr.len, false];
  if (k < 2 * leg + rest) return [tr.len - (k - leg - rest) * speed, true];
  return [0, true];
}

const inInsetBox = ([x, y]) => x >= INSET.x && x <= INSET.x + INSET.w && y >= INSET.y && y <= INSET.y + INSET.h;

// where smoke and steam rise: the place, the landmark it comes off when that shows (and where on it, screen units from
// its foot), its tint, how many puffs, how long each lives, how fast it climbs and drifts, how big it grows
const PLUMES = [
  { at: [130.66, 31.58], mark: 'kagoshima', from: [1, -7.7], tint: [0x8a8488, 0xc4bec2, 0x6a6468], n: 10, life: 4.4, rise: 2.6, drift: 1.8, size: 1.9, alpha: 1 }, // Sakurajima's ash
  { at: [131.09, 32.885], tint: [0xd8d4d0, 0xf4f0ec], n: 7, life: 3.6, rise: 2.3, drift: 1.3, size: 1.4, alpha: 0.95 }, // Aso's Naka-dake
  { at: [131.468, 33.316], tint: [0xffffff], n: 3, life: 2.2, rise: 1.7, drift: 0.6, size: 0.6, alpha: 0.5 }, // Beppu's steam: Kannawa
  { at: [131.452, 33.333], tint: [0xffffff], n: 3, life: 2.2, rise: 1.6, drift: 0.6, size: 0.55, alpha: 0.5 }, // (Myōban)
  { at: [131.497, 33.29], tint: [0xffffff], n: 3, life: 2, rise: 1.6, drift: 0.6, size: 0.5, alpha: 0.45 }, // (the town)
  { at: [131.49, 33.28], mark: 'beppu', only: true, from: [-1.3, -1.8], tint: [0xffffff], n: 4, life: 2.6, rise: 2, drift: 0.8, size: 0.75, alpha: 0.55 }, // off Umi Jigoku
  { at: [131.49, 33.28], mark: 'beppu', only: true, from: [-3.3, -2.3], tint: [0xffffff], n: 3, life: 2.3, rise: 1.8, drift: 0.8, size: 0.6, alpha: 0.5 },
];

export class MapLife {
  constructor(scene, depth) {
    const paths = scene.cache.json.get('map_paths') ?? { ferries: [], shinkansen: [] };
    const add = (frame, d) => scene.add.image(0, 0, 'map_life', frame).setScale(1 / RENDER_SCALE).setDepth(depth + d).setVisible(false);
    this.ferries = paths.ferries.map((p, n) => ({ tr: track(p), inset: inInsetBox(p[0]), phase: hash(n) * 60, img: add('ferry', 0.015) }));
    // two trains on each line, the second setting out from the other end
    this.trains = paths.shinkansen.flatMap((p, n) => {
      const tr = track(p);
      return [0, 0.5].map((k) => ({ tr, k, phase: hash(n + 40) * 10, img: add('shinkansen', 0.015) }));
    });
    this.plumes = PLUMES.map((p) => ({ p, puffs: Array.from({ length: p.n }, () => add('puff0', 0.03)) }));
    // the clouds' shadows, wandering east over the whole map
    this.clouds = Array.from({ length: 18 }, (_, n) => ({
      x: hash(n + 90) * 200,
      y: 40 + hash(n + 120) * 310,
      w: 5 + hash(n + 150) * 6,
      speed: 0.18 + hash(n + 170) * 0.12,
      img: scene.add.image(0, 0, 'map_clouds', `cloud${n % 2}`).setDepth(depth + 0.017).setVisible(false),
    }));
  }

  /** Everything placed for the camera's view at its time. */
  place(cam) {
    const { z } = cam.view;
    const t = cam.time;
    const { x0, x1, y0, y1 } = cam.area;
    const snap = (v) => Math.round(v * RENDER_SCALE) / RENDER_SCALE;
    const inView = (x, y, m = 12) => x > x0 - m && x < x1 + m && y > y0 - m && y < y1 + m;
    const onInset = cam.onInset ?? 1;
    // (the boats and the trains from close enough that they don't swamp the islands)
    const near = smooth(1.9, 2.5, z) * cam.alpha;
    const put = (img, x, y, a, angle) => {
      const on = cam.visible && a > 0.01 && inView(x, y);
      img.setVisible(on);
      if (on) img.setPosition(snap(x), snap(y)).setAlpha(a).setRotation(Math.round(angle / TURN) * TURN);
    };
    for (const f of this.ferries) {
      const [s, back] = shuttle(f.tr, FERRY, 2.5, t + f.phase);
      const [mx, my, h] = along(f.tr, s);
      const [x, y] = cam.toScreen(mx, my);
      put(f.img, x, y, near * (f.inset ? onInset : 1), back ? h + Math.PI : h);
    }
    for (const tr of this.trains) {
      const cycle = 2 * (tr.tr.len / TRAIN + 1.5);
      const [s, back] = shuttle(tr.tr, TRAIN, 1.5, t + tr.phase + tr.k * cycle);
      const [mx, my, h0] = along(tr.tr, s);
      const h = back ? h0 + Math.PI : h0;
      const [x, y] = cam.toScreen(mx, my);
      // (keeping to the left of the way)
      put(tr.img, x + Math.sin(h) * 0.8, y - Math.cos(h) * 0.8, near, h);
    }
    for (const { p, puffs } of this.plumes) {
      const mark = p.mark ? cam.marks.find((k) => k.m.key === p.mark) : null;
      const ma = mark?.img.visible ? mark.a : 0;
      const a0 = smooth(1.4, 1.9, z) * cam.alpha * (p.alpha ?? 0.8) * (p.only ? ma : 1);
      const [rx, ry] = cam.toScreen(...project(...p.at));
      // (off the landmark's crater or pond when it shows, else off the place itself)
      const ox = mark && ma ? rx + (mark.x - rx + p.from[0]) * ma : rx;
      const oy = mark && ma ? ry + (mark.y - ry + p.from[1]) * ma : ry;
      puffs.forEach((img, k) => {
        const age = ((t + (k * p.life) / p.n) % p.life) / p.life; // 0..1
        const x = ox + age * p.life * p.drift + Math.sin(t * 0.7 + k * 2.1) * age * 1.2;
        const y = oy - age * p.life * p.rise;
        const a = a0 * smooth(0, 0.12, age) * (1 - smooth(0.45, 1, age));
        const on = cam.visible && a > 0.01 && inView(x, y);
        img.setVisible(on);
        if (!on) return;
        img.setFrame(age < 0.3 ? 'puff0' : age < 0.65 ? 'puff1' : 'puff2');
        img.setTint(p.tint[k % p.tint.length]);
        img.setPosition(x, y).setScale(((0.55 + age * 0.6) * p.size) / RENDER_SCALE).setAlpha(a);
      });
    }
    const shade = smooth(1.3, 1.8, z) * cam.alpha * 0.3;
    for (const c of this.clouds) {
      const mx = ((c.x + t * c.speed) % 200) - 10;
      const [x, y] = cam.toScreen(mx, c.y);
      const [w, h] = [c.w * z, c.w * 0.66 * z];
      const on = cam.visible && shade > 0.01 && x + w / 2 > x0 && x - w / 2 < x1 && y + h / 2 > y0 && y - h / 2 < y1;
      c.img.setVisible(on);
      if (on) c.img.setPosition(x, y).setDisplaySize(w, h).setAlpha(shade);
    }
  }

  setDepth(d) {
    for (const o of [...this.ferries, ...this.trains]) o.img.setDepth(d + 0.015);
    for (const c of this.clouds) c.img.setDepth(d + 0.017);
    for (const { puffs } of this.plumes) puffs.forEach((img) => img.setDepth(d + 0.03));
  }

  destroy() {
    for (const o of [...this.ferries, ...this.trains, ...this.clouds]) o.img.destroy();
    for (const { puffs } of this.plumes) puffs.forEach((img) => img.destroy());
  }
}
