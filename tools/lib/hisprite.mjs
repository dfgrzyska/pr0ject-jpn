// Sprites drawn at 540 px (S = 3 fine pixels per logical one): shapes painted with a material and a way of
// shading (a ball, a tube, flat), lit from the top left; a texture can roughen the light; the light is cut
// into a material's five tones with an ordered dither, the edges facing the light catch a rim, the ones
// facing away fall into shadow; details go on top in plain colours; a dark outline goes round the whole
// silhouette (`outline` fine pixels thick), but not round what glows.
//
// Coordinates are fine pixels of the frame. A frame drawn here is exactly S times the size of the old one, so
// the sprite's centre (its pivot in the game) stays where it was.
import { Raster, mix, fbm, bayer } from './raster.mjs';
import { MATERIALS, OUTLINE } from './spritekit.mjs';

export const S = 3;
const LIGHT = (() => {
  const v = [-0.5, -0.62, 0.6];
  const l = Math.hypot(...v);
  return v.map((c) => c / l);
})();

/** Five tones from a material's three: [deep, shadow, base, light, highlight]. */
export function tones([sh, base, hi]) {
  return [mix(sh, 0x0a0812, 0.38), sh, base, mix(base, hi, 0.5), hi];
}

export const RAMPS = Object.fromEntries(Object.entries(MATERIALS).map(([k, v]) => [k, tones(v)]));

export class HiSprite {
  /** A w x h fine-pixel frame; `ramps`: material name -> five tones (RAMPS and your own). */
  constructor(w, h, ramps = {}) {
    this.w = w;
    this.h = h;
    this.ramps = { ...RAMPS, ...ramps };
    this.mat = new Array(w * h).fill(null); // material name, or null
    this.v = new Float32Array(w * h); // light 0..1
    this.glow = new Uint8Array(w * h); // glowing: no outline, no rim
    this.over = new Map(); // detail pixels: index -> [colour, alpha]
  }

  inside(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  /**
   * Paint every pixel where `test(x + .5, y + .5)` holds, within the box [x0, y0, x1, y1]. `light(px, py)`
   * gives its light 0..1 (see ball, tube, flat); `tex` adds roughness (amplitude), `seed` varies it.
   */
  paint(box, test, mat, light, { tex = 0, seed = 1, texScale = 3, glow = false, pat = null } = {}) {
    const [x0, y0, x1, y1] = box.map(Math.floor);
    for (let y = Math.max(0, y0); y <= Math.min(this.h - 1, y1); y++)
      for (let x = Math.max(0, x0); x <= Math.min(this.w - 1, x1); x++) {
        const px = x + 0.5;
        const py = y + 0.5;
        if (!test(px, py)) continue;
        const i = y * this.w + x;
        let v = light(px, py);
        if (tex) v += (fbm(x, y, { seed, scale: texScale, octaves: 2 }) - 0.5) * tex;
        if (pat) v += pat(px, py);
        this.mat[i] = mat;
        this.v[i] = v;
        this.glow[i] = glow ? 1 : 0;
        this.over.delete(i);
      }
    return this;
  }

  /** An ellipse shaded as a ball (or lit evenly with `flat`). */
  ellipse(cx, cy, rx, ry, mat, opts = {}) {
    const light = opts.flat != null ? () => opts.flat : ball(cx, cy, rx, ry, opts.bias ?? 0);
    return this.paint([cx - rx - 1, cy - ry - 1, cx + rx + 1, cy + ry + 1], (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1, mat, light, opts);
  }

  /** A polygon [[x, y], ...], lit evenly (`flat`, default .55) or as part of a ball round (bx, by, brx, bry). */
  poly(pts, mat, opts = {}) {
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const light = opts.ball ? ball(...opts.ball, opts.bias ?? 0) : () => opts.flat ?? 0.55;
    return this.paint([Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], (x, y) => inPoly(pts, x, y), mat, light, opts);
  }

  /** A tube from (ax, ay) to (bx, by), radius r (or ra to rb), shaded round its axis. */
  tube(ax, ay, bx, by, ra, mat, opts = {}) {
    const rb = opts.rb ?? ra;
    const dx = bx - ax;
    const dy = by - ay;
    const l2 = dx * dx + dy * dy || 1;
    const at = (x, y) => Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2));
    const test = (x, y) => {
      const t = at(x, y);
      return Math.hypot(x - (ax + dx * t), y - (ay + dy * t)) <= ra + (rb - ra) * t;
    };
    const l = Math.sqrt(l2);
    const nx = -dy / l;
    const ny = dx / l;
    const light = (x, y) => {
      const t = at(x, y);
      const r = ra + (rb - ra) * t;
      const s = Math.max(-1, Math.min(1, ((x - (ax + dx * t)) * nx + (y - (ay + dy * t)) * ny) / r));
      const nz = Math.sqrt(1 - s * s);
      return 0.36 + 0.56 * Math.max(0, s * nx * LIGHT[0] + s * ny * LIGHT[1] + nz * LIGHT[2]) + (opts.bias ?? 0);
    };
    const m = Math.max(ra, rb) + 1;
    return this.paint([Math.min(ax, bx) - m, Math.min(ay, by) - m, Math.max(ax, bx) + m, Math.max(ay, by) + m], test, mat, light, opts);
  }

  /** Change the light of what is already painted inside `test` (a crease, a shadow cast, a sheen). */
  shade(box, test, dv) {
    const [x0, y0, x1, y1] = box.map(Math.floor);
    for (let y = Math.max(0, y0); y <= Math.min(this.h - 1, y1); y++)
      for (let x = Math.max(0, x0); x <= Math.min(this.w - 1, x1); x++) {
        const i = y * this.w + x;
        if (this.mat[i] && test(x + 0.5, y + 0.5)) this.v[i] += typeof dv === 'function' ? dv(x + 0.5, y + 0.5) : dv;
      }
    return this;
  }

  /** A detail pixel in a plain colour (eyes, glints, painted lines), over whatever is there. */
  px(x, y, c, a = 1) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (!this.inside(x, y)) return this;
    const i = y * this.w + x;
    if (!this.mat[i]) {
      this.mat[i] = '_';
      this.glow[i] = 0;
    }
    this.over.set(i, [c, a]);
    return this;
  }

  /** A detail line, `w` fine pixels wide. */
  line(x0, y0, x1, y1, c, w = 1, a = 1) {
    const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2) || 1;
    for (let k = 0; k <= n; k++) {
      const x = x0 + ((x1 - x0) * k) / n;
      const y = y0 + ((y1 - y0) * k) / n;
      for (let j = 0; j < w; j++) for (let i = 0; i < w; i++) this.px(x + i - (w - 1) / 2, y + j - (w - 1) / 2, c, a);
    }
    return this;
  }

  /** A filled disc of a plain colour. */
  dot(cx, cy, r, c, a = 1) {
    for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) this.px(x, y, c, a);
    return this;
  }

  /**
   * To a raster: tones by light (dithered), a rim where the light comes from, shadow on the far edges, a
   * darker line where two materials meet (`seams`), detail on top, the outline round it all.
   */
  render({ outline = 2, rim = 0.1, dither = 0.85, grain = 0.12, seams = true, outlineColor = OUTLINE } = {}) {
    const { w, h } = this;
    const r = new Raster(w, h);
    const solid = (x, y) => this.inside(x, y) && this.mat[y * w + x] !== null;
    const same = (x, y, m) => this.inside(x, y) && this.mat[y * w + x] === m;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const m = this.mat[i];
        if (!m) continue;
        if (this.over.has(i) || m === '_') {
          const [c, a] = this.over.get(i) ?? [0, 0];
          if (m === '_' || a >= 1) {
            r.set(x, y, c, a);
            continue;
          }
        }
        const ramp = this.ramps[m];
        if (!ramp) throw new Error(`no ramp for material ${m}`);
        let v = this.v[i];
        if (!this.glow[i]) {
          v += (hash(x, y, 7) - 0.5) * grain;
          // rim towards the light, shadow on the far side, both a couple of pixels deep
          if (!same(x - 1, y - 1, m) || !same(x, y - 1, m)) v += rim;
          else if (!same(x - 2, y - 2, m)) v += rim * 0.5;
          if (!same(x + 1, y + 1, m) || !same(x, y + 1, m)) v -= rim * 1.1;
          else if (!same(x + 2, y + 2, m)) v -= rim * 0.5;
          if (seams && (solid(x + 1, y) && !same(x + 1, y, m) || solid(x, y + 1) && !same(x, y + 1, m))) v -= 0.22;
        }
        const t = Math.max(0, Math.min(4, Math.floor(v * 5 + (bayer(x, y) - 0.5) * dither)));
        r.set(x, y, ramp[t]);
        const ov = this.over.get(i);
        if (ov) r.set(x, y, ov[0], ov[1]);
      }
    if (outline > 0) {
      const core = (x, y) => solid(x, y) && !this.glow[y * w + x];
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          if (solid(x, y)) continue;
          let near = false;
          for (let dy = -outline; dy <= outline && !near; dy++)
            for (let dx = -outline; dx <= outline && !near; dx++) if (dx * dx + dy * dy <= outline * outline + outline && core(x + dx, y + dy)) near = true;
          if (near) r.set(x, y, outlineColor);
        }
    }
    return r;
  }
}

/** Light of a ball (ellipse) round (cx, cy). */
export function ball(cx, cy, rx, ry, bias = 0) {
  return (x, y) => {
    const nx = (x - cx) / rx;
    const ny = (y - cy) / ry;
    const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
    const l = Math.hypot(nx, ny, nz) || 1;
    return 0.36 + 0.56 * Math.max(0, (nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) / l) + bias;
  };
}

export function inPoly(pts, x, y) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

/** A quick hash of a pixel in [0, 1). */
export function hash(x, y, seed = 1) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// ---- textures for paint({ pat }): each returns (x, y) -> a change of light

/**
 * Hair or fur: strands `w` px apart running at `angle` (or angle(x, y) for fur that flows), broken into lengths
 * of about `len`, each strand and length a little lighter or darker, with dark gaps between some strands.
 */
export function fur(angle, { amt = 0.34, len = 7, w = 1.6, seed = 3, gap = 0.12 } = {}) {
  return (x, y) => {
    const a = typeof angle === 'function' ? angle(x, y) : angle;
    const u = x * Math.cos(a) + y * Math.sin(a);
    const v = -x * Math.sin(a) + y * Math.cos(a);
    const strand = Math.floor(v / w);
    const off = hash(strand, 0, seed) * len;
    const seg = Math.floor((u + off) / len);
    const t = (u + off) / len - seg; // along this length of hair: lit at its root end, darker at its tip
    let dv = (hash(strand, seg, seed + 1) - 0.5) * amt + (0.5 - t) * amt * 0.5;
    if (hash(strand, seg, seed + 2) < gap) dv -= amt * 0.9;
    return dv;
  };
}

/** Fine dark and light flecks (stone, rough clay, paper). */
export function speckle({ amt = 0.3, dark = 0.1, light = 0.05, seed = 5 } = {}) {
  return (x, y) => {
    const h = hash(Math.floor(x), Math.floor(y), seed);
    return h < dark ? -amt : h > 1 - light ? amt * 0.7 : 0;
  };
}

/** A crackle of thin dark lines (old glaze, lacquer, dry clay). */
export function crackle({ amt = 0.35, scale = 9, width = 0.035, seed = 9 } = {}) {
  return (x, y) => (Math.abs(fbm(x, y, { seed, scale, octaves: 2 }) - 0.5) < width ? -amt : 0);
}

/** Mottling: broad uneven patches of light and dark (paper lit from inside, ash glaze, weathered paint). */
export function mottle({ amt = 0.25, scale = 7, seed = 11 } = {}) {
  return (x, y) => (fbm(x, y, { seed, scale, octaves: 3 }) - 0.5) * amt * 2;
}

/** Several textures at once. */
export function mix2(...pats) {
  return (x, y) => pats.reduce((sum, p) => sum + p(x, y), 0);
}
