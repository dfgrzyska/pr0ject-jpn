// What the hulls that move are drawn with (houou540.mjs and the others): a HiSprite on which every shape is
// laid in one of the livery's colours (a role: 0 the main one, then the others), so the same drawing gives the
// ship in its own colours, the ship in neutral white (layer 'g') and each colour's panels alone (layer 0, 1...)
// for the paint jobs (src/game/shipSkin.js).
import { HiSprite, ball, inPoly } from '../../lib/hisprite.mjs';

export function hullSheet(W, H, mats, layer = null, ramps = {}) {
  const s = new HiSprite(W, H, ramps);
  const role = new Int8Array(W * H).fill(-1);
  const one = typeof layer === 'number' ? layer : null;
  const mat = (r) => (layer != null ? 'W' : mats[r]);
  /** Any shape: test(x, y) inside the box, in role r, lit by light(x, y). */
  const shape = (box, test, r, light, tex = 0.05) => {
    const [x0, y0, x1, y1] = box.map(Math.floor);
    for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) if (test(x + 0.5, y + 0.5)) role[y * W + x] = r;
    if (one != null && r !== one) {
      // (what lies under it on another layer is covered: cut out of that layer)
      if (one != null) for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) if (test(x + 0.5, y + 0.5)) { s.mat[y * W + x] = null; s.over.delete(y * W + x); }
      return;
    }
    s.paint(box, test, mat(r), light, { tex, seed: 3 });
  };
  const box = (pts) => [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))];
  const kit = {
    s,
    shape,
    role,
    W,
    H,
    /** A flat facet: a polygon in one light; clip(x, y) keeps a part of it. */
    facet(pts, r, v, clip = null) {
      shape(box(pts), (x, y) => inPoly(pts, x, y) && (!clip || clip(x, y)), r, () => v);
    },
    /** A polygon in the livery's colours by u(x, y): `bands` = [[from, role], ...] in rising order. */
    striped(pts, v, u, bands) {
      bands.forEach(([from, r], i) => {
        const to = bands[i + 1]?.[0] ?? Infinity;
        kit.facet(pts, r, v, (x, y) => u(x, y) >= from && u(x, y) < to);
      });
    },
    /** An ellipse rounded as a ball (bias: lighter or darker); clip keeps a part of it. */
    ell(cx, cy, rx, ry, r, bias = 0, clip = null) {
      shape([cx - rx - 1, cy - ry - 1, cx + rx + 1, cy + ry + 1], (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 && (!clip || clip(x, y)), r, ball(cx, cy, rx, ry, bias));
    },
    /** A detail pixel, only on what is drawn (and, in a layer, on that layer's own panels). */
    mark(x, y, c, a = 1) {
      const i = Math.floor(y) * W + Math.floor(x);
      if (x < 0 || y < 0 || x >= W || y >= H || role[i] < 0 || (one != null && role[i] !== one)) return;
      s.px(x, y, c, a);
    },
    line(x0, y0, x1, y1, c = 0x6c6a86, a = 0.5) {
      const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2) || 1;
      for (let k = 0; k <= n; k++) kit.mark(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n, c, a);
    },
    dot(cx, cy, rad, c, a = 1) {
      for (let y = Math.floor(cy - rad); y <= cy + rad; y++) for (let x = Math.floor(cx - rad); x <= cx + rad; x++) if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= rad * rad) kit.mark(x, y, c, a);
    },
    /** Lighter or darker where test holds, on what is drawn. */
    shade(bx, test, dv) {
      s.shade(bx, (x, y) => role[Math.floor(y) * W + Math.floor(x)] >= 0 && test(x, y), dv);
    },
    /** A feather (or a blade, a fin): from `base` along `angle` (radians; 0: right, PI/2: down), tapering to a point. */
    feather(base, angle, len, w, v, bands) {
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      const at = (t, side) => [base[0] + dx * len * t - dy * side, base[1] + dy * len * t + dx * side];
      const pts = [at(0, -w / 2), at(0.62, -w * 0.55), at(1, 0), at(0.62, w * 0.55), at(0, w / 2)];
      const u = (x, y) => ((x - base[0]) * dx + (y - base[1]) * dy) / len;
      kit.striped(pts, v, u, bands);
      kit.line(base[0], base[1], base[0] + dx * len * 0.9, base[1] + dy * len * 0.9, 0x2a1a22, 0.28);
    },
    render() {
      return s.render({ outline: one != null ? 0 : 2 });
    },
  };
  return kit;
}
