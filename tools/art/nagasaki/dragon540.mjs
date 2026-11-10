// The Ja-odori dragon at 540 px, drawn the way the old dyed and painted dragons are (kimono, temple ceilings):
// an indigo body in rows of light-edged scales over banded green belly plates; flames of red and orange licking
// from its brows, its elbows and along its spine; a spiky dark mane and beard; antler horns, long whiskers, the
// fierce open jaws. The head (39 -> 117), lengths of body (19 -> 57): plain, with a clawed leg, the tail's end,
// and the gyoku, the flaming pearl it chases (11 -> 33).
import { HiSprite, tones, fur, speckle, mottle, mix2 } from '../../lib/hisprite.mjs';

const INK = 0x14101c;
const TAU = Math.PI * 2;
const RAMPS = {
  b: tones([0x161a3a, 0x34406e, 0x6a7cae]), // indigo scales
  g: tones([0x1a3a1e, 0x3a7038, 0x7ab060]), // green belly plates
  f: [0x8a1a10, 0xd8381e, 0xf0702a, 0xffa848, 0xffe0a0], // flame
  m: tones([0x120c18, 0x2a1e30, 0x4e3e56]), // the dark mane
  h: tones([0x6a7480, 0xb0b8c4, 0xeef2f6]), // horn
  y: tones([0x8a5a10, 0xe2aa32, 0xfff0a0]), // gold
  r: tones([0x6a0e10, 0xb8202a, 0xf0605a]), // mouth
};
const SCALE_EDGE = 0xa8b8e0;

/** Scales over whatever indigo is painted in the box: overlapping arcs, light-edged, each a touch darker at its foot. */
function scales(s, box, size = 5) {
  const [x0, y0, x1, y1] = box;
  for (let y = y0; y < y1; y += size * 0.8)
    for (let x = x0 + ((Math.round((y - y0) / (size * 0.8)) % 2) * size) / 2; x < x1; x += size) {
      for (let a = 0.15; a < Math.PI - 0.15; a += 0.12) {
        const px = x + Math.cos(a) * size * 0.55;
        const py = y + Math.sin(a) * size * 0.55;
        const i = Math.floor(py) * s.w + Math.floor(px);
        if (s.inside(px, py) && s.mat[i] === 'b') s.px(px, py, SCALE_EDGE, 0.8);
      }
      const i = Math.floor(y + 1) * s.w + Math.floor(x);
      if (s.inside(x, y + 1) && s.mat[i] === 'b') s.px(x, y + 1, 0x101430, 0.5);
    }
}

/** A flame tuft: a few licks of fire from a root, curling to their tips, red outside, gold inside. */
function flame(s, x, y, ang, len, w, seed = 1) {
  for (let k = -1; k <= 1; k++) {
    const a = ang + k * 0.38;
    const L = len * (1 - Math.abs(k) * 0.22);
    const curl = (seed % 2 ? 1 : -1) * 0.5;
    const pts = [];
    for (let j = 0; j <= 14; j++) {
      const t = j / 14;
      const aa = a + curl * t * t;
      const ww = w * (1 - t) * (k === 0 ? 1 : 0.75);
      pts.push([x + Math.cos(aa) * L * t - Math.sin(aa) * ww, y + Math.sin(aa) * L * t + Math.cos(aa) * ww]);
    }
    for (let j = 14; j >= 0; j--) {
      const t = j / 14;
      const aa = a + curl * t * t;
      const ww = w * (1 - t) * (k === 0 ? 1 : 0.75);
      pts.push([x + Math.cos(aa) * L * t + Math.sin(aa) * ww * 0.6, y + Math.sin(aa) * L * t - Math.cos(aa) * ww * 0.6]);
    }
    s.poly(pts, 'f', { flat: 0.38 + (k === 0 ? 0.12 : 0), pat: fur(a, { amt: 0.18, len: 4, w: 1, seed: seed + k }) });
    s.line(x + Math.cos(a) * L * 0.1, y + Math.sin(a) * L * 0.1, x + Math.cos(a + curl * 0.4) * L * 0.6, y + Math.sin(a + curl * 0.4) * L * 0.6, 0xffd070, 1, 0.8);
  }
}

/** A spiky tuft of the dark mane: needles radiating from a root. */
function spikes(s, x, y, ang, spread, len, n, seed = 1) {
  for (let k = 0; k < n; k++) {
    const a = ang + (k / (n - 1) - 0.5) * spread;
    const L = len * (0.7 + ((k * 7 + seed) % 5) * 0.08);
    s.poly([[x - Math.sin(a) * 1.8, y + Math.cos(a) * 1.8], [x + Math.cos(a) * L, y + Math.sin(a) * L], [x + Math.sin(a) * 1.8, y - Math.cos(a) * 1.8]], 'm', { flat: 0.42 + (k % 2) * 0.08 });
  }
}

// ---------------------------------------------------------------- the head (39 -> 117), facing down at the player
export function jaHead(f) {
  const s = new HiSprite(117, 117, RAMPS);
  const cx = 58.5;
  const jaw = f % 2;
  const sway = [0, 2, 0, -2][f];
  // flames behind: from the back of the head, licking up and out
  for (const sx of [-1, 1]) {
    flame(s, cx + sx * 18, 30, -Math.PI / 2 + sx * 0.9, 34, 6, 3 + sx);
    flame(s, cx + sx * 30, 52, sx > 0 ? -0.25 : Math.PI + 0.25, 26, 5, 5 + sx);
  }
  // the horns: antlers, ringed, branching
  for (const sx of [-1, 1]) {
    s.tube(cx + sx * 12, 30, cx + sx * 30, 2, 3.2, 'h', { rb: 1.4 });
    s.tube(cx + sx * 21, 16, cx + sx * 34, 12, 1.8, 'h', { rb: 0.8 });
    s.tube(cx + sx * 25, 10, cx + sx * 24, 2, 1.4, 'h', { rb: 0.6 });
    for (let k = 1; k < 5; k++) s.line(cx + sx * (12 + k * 3.6) - 2.4, 30 - k * 5.6, cx + sx * (12 + k * 3.6) + 2.4, 30 - k * 5.6 + 1, 0x6a7480, 1);
  }
  // the mane and beard: spiky dark tufts round the jaw and cheeks
  for (const sx of [-1, 1]) {
    spikes(s, cx + sx * 26, 60, sx > 0 ? 0.3 : Math.PI - 0.3, 1.3, 20, 7, 11 + sx);
    spikes(s, cx + sx * 20, 80, sx > 0 ? 0.9 : Math.PI - 0.9, 1.1, 18, 6, 21 + sx);
  }
  spikes(s, cx, 96, Math.PI / 2, 1.4, 20, 9, 31);
  // the skull: indigo scales over the crown, the heavy brow ridges, the eyes
  s.ellipse(cx, 42, 24, 19, 'b', { bias: 0.02, pat: mix2(speckle({ amt: 0.1 }), mottle({ amt: 0.12, scale: 6 })) });
  scales(s, [cx - 26, 22, cx + 26, 50], 5);
  for (const sx of [-1, 1]) {
    s.tube(cx + sx * 4, 36, cx + sx * 24, 30, 4.6, 'b', { rb: 3, bias: 0.16 });
    flame(s, cx + sx * 20, 31, -Math.PI / 2 + sx * 0.5, 14, 3.4, 41 + sx); // flame from the brow
    // the eyes: long and slanted under the brow, gold, a slit pupil, rimmed red
    s.poly([[cx + sx * 6, 44], [cx + sx * 14, 39], [cx + sx * 22, 38], [cx + sx * 19, 44], [cx + sx * 11, 46]], 'y', { flat: 0.82 });
    s.line(cx + sx * 14, 39.5, cx + sx * 14, 45.5, INK, 2);
    s.px(cx + sx * 12, 41, 0xffffff);
    s.line(cx + sx * 6, 44, cx + sx * 22, 38, 0xb8202a, 1);
    s.line(cx + sx * 6, 44.5, cx + sx * 19, 44.5, 0x101430, 1);
  }
  // the long snout, its ridges, the nostrils flaring and curling up
  s.ellipse(cx, 62, 16, 17, 'b', { bias: 0.08, pat: speckle({ amt: 0.1 }) });
  scales(s, [cx - 16, 50, cx + 16, 76], 4.4);
  for (let k = 0; k < 3; k++) s.line(cx - 10 + k * 2, 52 + k * 3, cx + 10 - k * 2, 52 + k * 3, 0x101430, 1, 0.7);
  for (const sx of [-1, 1]) {
    s.ellipse(cx + sx * 8, 64, 5.2, 4.4, 'b', { bias: 0.18 });
    s.ellipse(cx + sx * 8.5, 65.5, 2.6, 1.8, 'K', { flat: 0.1 });
    for (let a = 0; a < Math.PI * 1.6; a += 0.1) s.px(cx + sx * (8 + Math.cos(a) * (3 + a)), 61 - Math.sin(a) * (3 + a), SCALE_EDGE, 0.8);
  }
  // the jaws open, red inside, the fangs, the tongue curling out
  s.poly([[cx - 18, 72], [cx + 18, 72], [cx + 14, 86 + jaw * 4], [cx - 14, 86 + jaw * 4]], 'r', { flat: 0.3 });
  for (let x = cx - 15; x < cx + 15; x += 4.5) s.poly([[x, 72], [x + 3.6, 72], [x + 1.8, 76]], 'W', { flat: 0.85 });
  for (const sx of [-1, 1]) {
    s.poly([[cx + sx * 17, 72], [cx + sx * 12, 72], [cx + sx * 15, 83]], 'W', { flat: 0.92 });
    s.poly([[cx + sx * 13, 86 + jaw * 4], [cx + sx * 9, 86 + jaw * 4], [cx + sx * 11, 78]], 'W', { flat: 0.8 });
  }
  s.tube(cx, 80, cx + 3 + sway, 96, 3, 'r', { rb: 1.6, bias: 0.15 });
  s.ellipse(cx, 89 + jaw * 4, 15, 4.4, 'g', { flat: 0.5 }); // the lower jaw, its green underside
  // the long whiskers, streaming back from the lip
  for (const sx of [-1, 1]) for (let k = 0; k < 2; k++) {
    let px = cx + sx * 12;
    let py = 68 + k * 3;
    for (let t = 0; t < 1; t += 0.02) {
      const nx = cx + sx * (12 + t * 44);
      const ny = 68 + k * 3 + Math.sin(t * 7 + f + k) * 6 * t + t * 26;
      s.line(px, py, nx, ny, 0x1a1428, 1);
      px = nx;
      py = ny;
    }
  }
  return s.render();
}

// ---------------------------------------------------------------- lengths of the body (19 -> 57)
export function jaSegment(kind = 'body') {
  const s = new HiSprite(57, 57, RAMPS);
  const c = 28.5;
  // a clawed leg reaching out from under it
  if (kind === 'leg') {
    for (const sx of [-1, 1]) {
      s.tube(c + sx * 14, c + 6, c + sx * 25, c + 14, 3.6, 'b', { rb: 2.6 });
      s.tube(c + sx * 25, c + 14, c + sx * 26, c + 15, 2.6, 'b');
      flame(s, c + sx * 20, c + 8, sx > 0 ? -0.8 : Math.PI + 0.8, 12, 3, 51 + sx); // the elbow flame
      for (let k = -1; k <= 1; k++) s.tube(c + sx * 25, c + 14, c + sx * (27 + k * 1.5), c + 20 + Math.abs(k), 1.2, 'h', { rb: 0.4 });
    }
  }
  // the body: a length of serpent running up and down the screen, rows of scales over its back, the green belly
  // plates showing along both flanks, the ridge of its spine down the middle
  const w = kind === 'tail' ? 16 : 21;
  const hh = kind === 'tail' ? 15 : 19;
  // flat-lit: the pieces overlap into one long body, so none of them may read as a ball
  s.paint([c - w - 1, c - hh - 1, c + w + 1, c + hh + 1], (x, y) => ((x - c) / w) ** 2 + ((y - c) / hh) ** 2 < 1, 'b', (x, y) => 0.6 - (x - c) / 70 - (y - c) / 160, { pat: mottle({ amt: 0.1, scale: 6 }) });
  scales(s, [c - w, c - hh, c + w, c + hh], 5.2);
  for (const sx of [-1, 1]) {
    s.paint([0, 0, 57, 57], (x, y) => s.mat[Math.floor(y) * 57 + Math.floor(x)] === 'b' && (x - c) * sx > w * 0.72, 'g', (x) => 0.56 - (x - c) / 80, { pat: speckle({ amt: 0.08 }) });
    for (let y = 2; y < 56; y += 3.6) for (let x = 0; x < 57; x++) if (s.mat[Math.floor(y) * 57 + x] === 'g' && (x - c) * sx > 0) s.px(x, y, 0x1a3a1e, 0.85);
  }
  // the dark crest of its spine, spiking up at the top of each length
  spikes(s, c, c - hh + 6, -Math.PI / 2, 0.9, 12, 5, kind === 'tail' ? 7 : 3);
  // the flames along the spine
  flame(s, c - w + 4, c - 4, Math.PI + 0.35, kind === 'tail' ? 14 : 12, 3.2, kind === 'tail' ? 61 : 71);
  if (kind === 'tail') {
    // the tail's end: a great flame and a spiky tuft
    flame(s, c, c + 6, Math.PI / 2 + 0.3, 26, 6, 81);
    spikes(s, c + 6, c + 10, Math.PI / 2 - 0.2, 1.2, 14, 6, 91);
  }
  return s.render();
}

// ---------------------------------------------------------------- the gyoku, the flaming pearl (11 -> 33)
export function jaPearl() {
  const s = new HiSprite(33, 33, RAMPS);
  for (let k = 0; k < 5; k++) flame(s, 16.5, 17, -Math.PI / 2 + (k - 2) * 0.55, 15, 3, 101 + k);
  s.ellipse(16.5, 18, 8.5, 8.5, 'y', { bias: 0.1, glow: true });
  s.dot(13.5, 15, 2.4, 0xfff8e0);
  for (let a = 0; a < Math.PI * 1.4; a += 0.1) s.px(16.5 + Math.cos(a) * 5, 18 + Math.sin(a) * 5, 0xb07a10, 0.7);
  return s.render();
}
