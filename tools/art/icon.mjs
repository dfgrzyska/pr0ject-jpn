// The app's icon: the game in one picture. Drawn at 256 px (each pixel two on the 512 px icon), the ship and its
// shots taken from the 540 px sprites (sharp at that scale): a dusk sky over the sea, the striped red sun going
// down behind Mount Fuji, a pagoda on the shore, a branch of sakura shedding petals, the ship climbing on its flame
// with its needles flying ahead and an enemy's magenta shots coming down, all framed by a vermilion torii.
import { Raster, rgb, mix, scaleColor, fbm, rng, bayer } from '../lib/raster.mjs';
import { shared540 } from './shared540/index.mjs';

const N = 256;

/** A colour ramp with ordered dither between its steps, so gradients band like pixel art. */
const ramp = (stops, t, x, y) => {
  const k = Math.max(0, Math.min(0.9999, t)) * (stops.length - 1);
  const i = Math.floor(k);
  return k - i > bayer(x, y) ? stops[Math.min(stops.length - 1, i + 1)] : stops[i];
};

export function buildIcon() {
  const sprites = {};
  shared540((name, r) => (sprites[name] = r));
  const out = new Raster(N, N);
  const r = rng(2024);
  const HORIZON = 168;

  // ---------------------------------------------------------------- the sky: indigo overhead to rose and gold at the sea
  const SKY = [0x140c2a, 0x221238, 0x3a1848, 0x5a1e52, 0x8a2a58, 0xc0445a, 0xe8705a, 0xf8a86a];
  for (let y = 0; y < HORIZON; y++) for (let x = 0; x < N; x++) out.set(x, y, ramp(SKY, (y / HORIZON) ** 1.25, x, y));
  // a few stars up high, thin streaks of cloud lit from below
  for (let k = 0; k < 40; k++) {
    const x = Math.floor(r() * N);
    const y = Math.floor(r() * 70);
    out.set(x, y, k % 5 ? 0xb8a8d8 : 0xffffff);
  }
  for (let y = 60; y < 150; y++)
    for (let x = 0; x < N; x++) {
      const n = fbm(x * 0.6, y * 3, { seed: 11, scale: 40, octaves: 3 });
      if (n > 0.62) out.set(x, y, mix(out.get(x, y), y < 110 ? 0x7a3a6a : 0xf09a7a, Math.min(1, (n - 0.62) * 5) * 0.8));
    }

  // ---------------------------------------------------------------- the sun, striped across its lower half
  const SX = 128;
  const SY = 112;
  const SR = 50;
  const SUN = [0xffe89a, 0xffc860, 0xff9a48, 0xf06440, 0xd8384a];
  for (let y = SY - SR; y <= SY + SR; y++)
    for (let x = SX - SR; x <= SX + SR; x++) {
      const d = Math.hypot(x - SX, y - SY);
      if (d > SR + 6) continue;
      if (d > SR) {
        out.set(x, y, mix(out.get(x, y), 0xffb070, (1 - (d - SR) / 6) * 0.35)); // its glow
        continue;
      }
      const t = (y - (SY - SR)) / (2 * SR);
      if (t > 0.55) {
        const band = (y - (SY + 6)) % 9;
        if (band < 1 + (t - 0.55) * 9) continue; // the stripes, widening downwards
      }
      out.set(x, y, ramp(SUN, t, x, y));
    }

  // ---------------------------------------------------------------- Mount Fuji: dark against the sun, snow on its cap
  const fuji = (x) => {
    const dx = Math.abs(x - 128);
    if (dx < 12) return 96 + dx * 0.15; // the flat top
    return 98 + (dx - 12) * 0.62 + ((dx - 12) / 60) ** 2 * 30;
  };
  for (let x = 0; x < N; x++) {
    const top = Math.round(fuji(x));
    for (let y = top; y < HORIZON; y++) {
      const h = (y - top) / (HORIZON - top + 1);
      const lit = x < 128 ? 0.12 : 0;
      let c = ramp([0x2a1c46, 0x34224e, 0x402858, 0x4e3064], Math.min(1, 0.15 + h * 0.4 + lit + (y - 96) / 260), x, y);
      // snow: down from the top in long tongues
      const tongue = 12 + Math.abs(Math.sin(x * 0.42)) * 9 + Math.sin(x * 0.13) * 3;
      if (y - 96 < tongue) c = x < 128 ? (y - top < 2 ? 0xffffff : 0xe8e4f4) : (y - top < 2 ? 0xd8d4ec : 0xb4b0d4);
      out.set(x, y, c);
    }
  }
  // the pagoda on the shore, left, and a pine beside it, black against the dusk
  const DARK = 0x160e22;
  {
    const px = 46;
    let y = 168;
    for (let j = 0; j < 4; j++) for (let i = -10; i <= 10; i++) out.set(px + i, y - j, DARK);
    y -= 4;
    for (const w of [16, 14, 12, 10, 8]) {
      for (let j = 0; j < 6; j++) for (let i = -w / 2 + 2; i <= w / 2 - 2; i++) out.set(px + i, y - j, DARK);
      y -= 6;
      for (let j = 0; j < 3; j++) for (let i = -w / 2 - 3 + j; i <= w / 2 + 3 - j; i++) out.set(px + i, y - j, DARK);
      out.set(px - w / 2 - 3, y, 0x3a2848); // the upturned eaves catching the light
      out.set(px + w / 2 + 3, y, 0x3a2848);
      y -= 3;
    }
    for (let j = 0; j < 12; j++) out.set(px, y - j, DARK);
    for (let j = 0; j < 4; j++) out.set(px + 1, y - j - 4, 0xffd080); // a lamp in it
  }

  // ---------------------------------------------------------------- the sea: waves in the seigaiha pattern, the sun's path on it
  for (let y = HORIZON; y < N; y++)
    for (let x = 0; x < N; x++) {
      const t = (y - HORIZON) / (N - HORIZON);
      let c = ramp([0x2a1a48, 0x22184a, 0x1a1640, 0x121034, 0x0c0a26], t, x, y);
      // seigaiha: rows of overlapping arcs, growing towards us
      const s = 8 + t * 14;
      const row = Math.floor((y - HORIZON) / (s * 0.5));
      const ox = (row % 2) * s * 0.5;
      const cx = Math.floor((x + ox) / s) * s + s / 2 - ox;
      const cy = HORIZON + (row + 1) * s * 0.5;
      const d = Math.hypot(x - cx, (y - cy) * 1.4) / (s * 0.5);
      if (d < 1 && (d * 3) % 1 < 0.28) c = mix(c, 0x5a4a8a, 0.55);
      // the sun's path: broken strokes of gold
      const path = Math.abs(x - 128) < 18 + t * 30 && (y + Math.floor(x / 9)) % 4 === 0 && Math.sin(x * 0.7 + y) > -0.2;
      if (path) c = mix(0xffb860, 0xff7a50, t);
      out.set(x, y, c);
    }
  for (let x = 0; x < N; x++) out.set(x, HORIZON, mix(out.get(x, HORIZON), 0xffc890, 0.5));

  // ---------------------------------------------------------------- the ship, climbing on its flame, its needles ahead
  const put = (src, cx, cy) => out.blit(src, Math.round(cx - src.w / 2), Math.round(cy - src.h / 2));
  const glow = (cx, cy, rad, c, a) => {
    for (let y = cy - rad; y <= cy + rad; y++)
      for (let x = cx - rad; x <= cx + rad; x++) {
        const d = Math.hypot(x - cx, y - cy) / rad;
        if (d < 1 && x >= 0 && y >= 0 && x < N && y < N) out.set(x, y, mix(out.get(x, y), c, (1 - d) ** 2 * a));
      }
  };
  // (the ship twice the size of everything else, so it reads on a small icon)
  const big = (src) => {
    const o = new Raster(src.w * 2, src.h * 2);
    for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) if (src.alpha(x >> 1, y >> 1) > 0) o.set(x, y, src.get(x >> 1, y >> 1), src.alpha(x >> 1, y >> 1) / 255);
    return o;
  };
  const SHX = 128;
  const SHY = 172;
  glow(SHX, SHY + 64, 30, 0xff9a40, 0.7);
  put(big(sprites.flame_2), SHX, SHY + 66); // (one flame, centred, as in the game)
  glow(SHX, SHY, 64, 0x8ad8ff, 0.16);
  put(big(sprites.ship), SHX, SHY);
  for (const [dx, dy] of [[-10, -72], [10, -72], [-10, -98], [10, -98], [-10, -124], [10, -124]]) {
    glow(SHX + dx, SHY + dy, 6, 0xfff0a0, 0.45);
    put(sprites.ps_needle, SHX + dx, SHY + dy);
  }
  // the enemy's shots coming down: magenta orbs with white cores and a dark ring, as in the game
  for (const [x, y] of [[66, 112], [84, 92], [174, 90], [196, 114], [58, 140], [204, 146]]) {
    glow(x, y, 8, 0xff40c0, 0.45);
    for (let j = -5; j <= 5; j++)
      for (let i = -5; i <= 5; i++) {
        const d = Math.hypot(i, j);
        if (d > 5) continue;
        out.set(x + i, y + j, d > 4.2 ? 0x2a0a2a : d > 3 ? 0xf040c8 : d > 1.6 ? 0xff9ae8 : 0xffffff);
      }
  }

  // ---------------------------------------------------------------- the torii framing it all, vermilion, lit from the left
  const VER = [0x7a1810, 0xa8261a, 0xd83a24, 0xf0603a, 0xff8a5a];
  const beam = (y0, h, x0, x1, curve) => {
    for (let x = x0; x <= x1; x++) {
      const t = (x - x0) / (x1 - x0);
      const up = curve ? Math.round(((Math.abs(t - 0.5) * 2) ** 3) * curve) : 0;
      for (let j = 0; j < h; j++) {
        const y = y0 + j - up;
        const v = j < 2 ? 0.95 : j > h - 3 ? 0.1 : 0.55 - j / h * 0.3;
        out.set(x, y, ramp(VER, v, x, y));
      }
      out.set(x, y0 - up - 1, 0x1a0e10); // its outline
      out.set(x, y0 + h - up, 0x1a0e10);
    }
  };
  // the kasagi: black-capped, sweeping up at the ends
  beam(18, 12, -2, N + 1, 10);
  for (let x = -2; x <= N + 1; x++) {
    const t = (x + 2) / (N + 3);
    const up = Math.round(((Math.abs(t - 0.5) * 2) ** 3) * 10);
    for (let j = 0; j < 4; j++) out.set(x, 14 + j - up, j === 0 ? 0x4a4248 : 0x1e1a1e);
  }
  beam(44, 9, 18, N - 19, 0); // the nuki
  // the plaque between the beams, gold lettering
  for (let y = 30; y < 44; y++) for (let x = 116; x < 140; x++) out.set(x, y, x === 116 || x === 139 ? 0x1a0e10 : y < 32 ? 0xf0603a : 0x2a1418);
  for (const [x, y] of [[121, 34], [122, 35], [123, 36], [124, 37], [121, 38], [130, 34], [131, 35], [132, 36], [133, 37], [134, 38], [132, 40], [128, 39]]) out.set(x, y, 0xf8d070);
  // the pillars, round, lit on their left, black at the foot
  for (const cx of [32, N - 33]) {
    for (let y = 30; y < N; y++)
      for (let x = cx - 9; x <= cx + 9; x++) {
        const a = (x - (cx - 9)) / 18;
        const foot = y > N - 26;
        out.set(x, y, x === cx - 9 || x === cx + 9 ? 0x1a0e10 : foot ? ramp([0x1a1418, 0x2e2830, 0x4a4248], 0.8 - a, x, y) : ramp(VER, 0.95 - a * 0.85, x, y));
      }
  }

  // ---------------------------------------------------------------- the sakura branch over the top left, petals drifting
  {
    const br = rng(77);
    let x = -2;
    let y = 72;
    const pts = [];
    for (let k = 0; k < 80; k++) {
      x += 1.05;
      y -= 0.18 + Math.sin(k * 0.12) * 0.45;
      pts.push([x, y, 3.4 - k * 0.035]);
    }
    for (const [px, py, w] of pts) for (let j = -w; j <= w; j++) out.set(Math.round(px), Math.round(py + j), j < 0 ? 0x5a3a3a : 0x2e1a20);
    const blossom = (cx, cy) => {
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2 + 0.3;
        for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (i * i + j * j <= 4) out.set(Math.round(cx + Math.cos(a) * 3 + i), Math.round(cy + Math.sin(a) * 3 + j), i + j < 0 ? 0xffe0ec : 0xf8a8c8);
      }
      out.set(cx, cy, 0xd84a7a);
      out.set(cx + 1, cy, 0xffe070);
    };
    for (let k = 0; k < 40; k++) {
      const [px, py] = pts[Math.floor(br() * pts.length)];
      blossom(Math.round(px + (br() - 0.5) * 14), Math.round(py + (br() - 0.5) * 12));
    }
    for (let k = 0; k < 18; k++) {
      const cx = Math.round(20 + br() * 220);
      const cy = Math.round(60 + br() * 170);
      if (Math.abs(cx - SHX) < 30 && Math.abs(cy - SHY) < 40) continue;
      for (const [i, j, c] of [[0, 0, 0xffd0e0], [1, 0, 0xf8a8c8], [0, 1, 0xf8a8c8], [1, 1, 0xe880a8]]) out.set(cx + i, cy + j, c);
    }
  }

  // ---------------------------------------------------------------- a soft vignette
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const d = Math.hypot((x - 128) / 128, (y - 128) / 128);
      if (d > 0.9) {
        const [cr, cg, cb] = rgb(out.get(x, y));
        const k = 1 - Math.min(0.35, (d - 0.9) * 0.9);
        out.set(x, y, (Math.round(cr * k) << 16) | (Math.round(cg * k) << 8) | Math.round(cb * k));
      }
    }
  void scaleColor;
  return out;
}

/** The picture shrunk to n x n by averaging (area filter), for the smaller icon. */
export function downsample(src, n) {
  const out = new Raster(n, n);
  const k = src.w / n;
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let w = 0;
      for (let sy = Math.floor(y * k); sy < Math.ceil((y + 1) * k); sy++)
        for (let sx = Math.floor(x * k); sx < Math.ceil((x + 1) * k); sx++) {
          const wx = Math.min(sx + 1, (x + 1) * k) - Math.max(sx, x * k);
          const wy = Math.min(sy + 1, (y + 1) * k) - Math.max(sy, y * k);
          const a = wx * wy;
          const [cr, cg, cb] = rgb(src.get(Math.min(src.w - 1, sx), Math.min(src.h - 1, sy)));
          r += cr * a;
          g += cg * a;
          b += cb * a;
          w += a;
        }
      out.set(x, y, (Math.round(r / w) << 16) | (Math.round(g / w) << 8) | Math.round(b / w));
    }
  return out;
}
