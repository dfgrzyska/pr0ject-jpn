// The first miniboss of Tokyo (docs/plan-tokyo.md, 6.1): KASA-OBAKE, the umbrella of the scramble. An old oil-paper
// umbrella come to life, as the folk tales have it: one eye, a long tongue, its handle a single leg in a wooden geta.
// Our own drawing: a red bull's-eye umbrella (red, a white ring, red), a lacquered cap and a ring of coloured stitching
// at the top, ten bamboo ribs.
//
// The canopy is worked out as a solid (ribs bending from the top, the paper between them bellying or pleating) and
// seen from the game's camera, a little from above: so it opens, spins, bows and falls apart all of a piece. The
// parts the game moves on their own are drawn apart: the leg (it springs and stretches), the eye (it looks about and
// blinks), the tongue (a chain of segments), the shadow; KASA_ANCHORS says where on each canopy frame they sit.
// Also here: the three little umbrellas it splits into, the big walk signal over the crossing, its bullets (rain
// drops, splinters of rib) and the clear umbrella it ends as.
import { HiSprite, tones, mottle, speckle, mix2, hash } from '../../lib/hisprite.mjs';
import { Raster } from '../../lib/raster.mjs';

const TAU = Math.PI * 2;
const INK = 0x14101c;
const N = 10; // ribs
const TILT = 0.5; // the camera: this far (radians) above level, looking on
const SUN = norm([-0.55, 0.7, 0.55]); // light from the top left, a little in front

const RAMPS = {
  r: tones([0x58081a, 0xa81a2a, 0xf0524a]), // the red paper, oiled
  w: tones([0x8a7a66, 0xdcd0b8, 0xfff8e8]), // the white ring
  u: tones([0x3a0610, 0x7a1420, 0xb83a3a]), // the paper seen from under, the light through it
  k: tones([0x0e0a0a, 0x2e2220, 0x7a5e50]), // the lacquered cap
  b: tones([0x5a3c16, 0xb08840, 0xf0d890]), // bamboo
  B: tones([0x3a2810, 0x7a5a2c, 0xb89058]), // bamboo, old and dark (the handle)
  f: tones([0x9a5a40, 0xe0a882, 0xffd8bc]), // the leg's skin
  h: tones([0x2a1a14, 0x5a3a28, 0x8a6448]), // the hair on it
  g: tones([0x5a3a1c, 0xa8783e, 0xe0b878]), // the geta's wood
  q: tones([0x6a0c12, 0xd8283a, 0xff8a8a]), // its red thong; the tongue
  t: tones([0x7a1830, 0xe04a6a, 0xffa0b8]), // the tongue
  m: tones([0x1a0408, 0x3a0a14, 0x6a1a28]), // inside the mouth
  e: tones([0xb8b0a0, 0xf4f0e4, 0xffffff]), // the eye's white
  c: [0x5a7a90, 0x9ab8cc, 0xcfe2ee, 0xeef6fb, 0xffffff], // clear vinyl
  s: tones([0x3a3e46, 0x8a909a, 0xe0e6ee]), // steel
  y: tones([0x1a1c22, 0x3a3e48, 0x6a7080]), // the signal's housing
  d: [0x0e3a6a, 0x2a7ac8, 0x7ac8f8, 0xd0f0ff, 0xffffff], // a rain drop, glowing
};
const THREADS = [0xe8c040, 0x2a8a5a, 0xf4f0e8, 0x2a4a9a, 0xe04a7a, 0x8a3ab0];

function norm(v) {
  const l = Math.hypot(...v);
  return v.map((c) => c / l);
}
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const angDist = (a, b) => {
  const d = (((a - b) % TAU) + TAU) % TAU;
  return d > Math.PI ? TAU - d : d;
};

// how far open: the ribs' angle from the shaft at the top and at the rim, how deep the paper pleats between them,
// how much the closed bundle bellies
export const STATES = {
  shut: { bt: 0.13, br: 0.07, sag: 0.5, bulge: 0.075 },
  half: { bt: 0.8, br: 0.36, sag: 0.24, bulge: 0.03 },
  wide: { bt: 1.22, br: 0.66, sag: 0.1, bulge: 0 },
  open: { bt: 1.45, br: 0.95, sag: 0.05, bulge: 0 },
};

/**
 * The umbrella as a solid: ribs of length L from the top T (the origin), the shaft Ls down from it.
 * o: { state, spin (radians the whole thing is turned), lean (tipped towards us), roll (to the side), wear 0-3, sx }
 * Returns { point(s, phi), frame(x, y, z) -> screen [X, Y, depth] }.
 */
function solid(L, o) {
  const st = typeof o.state === 'string' ? STATES[o.state] : o.state;
  // the rib's outline: integrate its bend from the top down
  const K = 160;
  const R = new Float32Array(K + 1);
  const Y = new Float32Array(K + 1);
  for (let k = 1; k <= K; k++) {
    const s = (k - 0.5) / K;
    const b = st.bt + (st.br - st.bt) * s;
    R[k] = R[k - 1] + (L / K) * Math.sin(b);
    Y[k] = Y[k - 1] - (L / K) * Math.cos(b);
  }
  const at = (arr, s) => {
    const f = Math.max(0, Math.min(1, s)) * K;
    const i = Math.min(K - 1, Math.floor(f));
    return arr[i] + (arr[i + 1] - arr[i]) * (f - i);
  };
  const wear = o.wear ?? 0;
  // where the paper hangs off a broken rib: a panel (its middle) that droops from s0 on
  const FLAPS = wear >= 2 ? [[7.5, 0.5, wear >= 3 ? 0.8 : 0.45]] : [];
  if (wear >= 3) FLAPS.push([2.5, 0.6, 0.55]);
  const BROKEN = wear >= 3 ? [[2, 0.62], [8, 0.55], [5, 0.75]] : wear >= 2 ? [[8, 0.6]] : [];
  const droop = (s, phi) => {
    let d = 0;
    for (const [k, s0, amt] of FLAPS) {
      const c = (k / N) * TAU;
      const w = Math.max(0, 1 - angDist(phi, c) / (TAU / N) / 0.95);
      if (s > s0) d += (s - s0) * L * amt * w;
    }
    for (const [i, s0] of BROKEN) {
      const w = Math.max(0, 1 - angDist(phi, (i / N) * TAU) / (TAU / N) / 0.5);
      if (s > s0) d += (s - s0) * L * 0.9 * w;
    }
    return d;
  };
  const panel = (phi) => {
    const q = (((phi / TAU) * N) % 1 + 1) % 1; // 0 at a rib, .5 mid-panel
    return (1 - Math.cos(q * TAU)) / 2; // 0 at a rib, 1 mid-panel
  };
  const point = (s, phi, inset = 0) => {
    const p = panel(phi);
    let r = at(R, s) * (1 - st.sag * p) + L * st.bulge * Math.sin(Math.PI * Math.min(1, s * 1.15)) * (1 - 0.6 * p) - inset;
    let y = at(Y, s) + (st.sag > 0.3 ? 0 : -L * 0.02 * p * s); // (the open paper bellies a little between the ribs)
    const d = droop(s, phi);
    r -= d * 0.35;
    y -= d;
    return [Math.sin(phi) * r, y, Math.cos(phi) * r];
  };
  // turned, tipped, rolled, then seen by the camera
  const [ca, sa] = [Math.cos(o.spin ?? 0), Math.sin(o.spin ?? 0)];
  const [cl, sl] = [Math.cos(o.lean ?? 0), Math.sin(o.lean ?? 0)];
  const [cr, sr] = [Math.cos(o.roll ?? 0), Math.sin(o.roll ?? 0)];
  const [ct, stt] = [Math.cos(TILT), Math.sin(TILT)];
  const world = ([x, y, z]) => {
    [x, z] = [x * ca + z * sa, -x * sa + z * ca]; // spin about the shaft
    [y, z] = [y * cl - z * sl, y * sl + z * cl]; // lean: the top comes towards us
    [x, y] = [x * cr - y * sr, x * sr + y * cr]; // roll
    return [x, y, z];
  };
  const view = (w) => [w[0], -(w[1] * ct - w[2] * stt), w[1] * stt + w[2] * ct]; // screen x, screen y (down), depth
  return { point, world, view, droop, panel, R: (s) => at(R, s), Y: (s) => at(Y, s), wear, broken: BROKEN, st };
}

/** Is the paper gone here? Holes (wear 1+), torn panels (2+), most of a panel ripped away (3). */
function torn(s, phi, wear, L, Rs) {
  if (wear < 1) return false;
  const holes = [[0.66, 1.2, 4], [0.8, 4.4, 5], [0.48, 5.5, 3.4], [0.9, 2.6, 3.6]];
  if (wear >= 2) holes.push([0.74, 0.6, 6], [0.58, 3.4, 5], [0.86, 5.0, 4.5]);
  if (wear >= 3) holes.push([0.4, 2.0, 4], [0.7, 3.9, 6.5], [0.55, 0.15, 3]);
  for (const [s0, p0, r] of holes) {
    const d = Math.hypot((s - s0) * L, angDist(phi, p0) * Rs);
    const rag = (hash(Math.floor(s * 60), Math.floor(phi * 40), 17) - 0.5) * 2.2;
    if (d < r + rag) return true;
  }
  if (wear >= 2) {
    // a panel torn from its rim inward, ragged
    const c = (3.5 / N) * TAU;
    const w = 1 - angDist(phi, c) / (TAU / N / 2);
    const edge = (wear >= 3 ? 0.32 : 0.62) + 0.08 * Math.sin(phi * 37) + (hash(Math.floor(phi * 90), 3, 5) - 0.5) * 0.06;
    if (w > 0.12 && s > edge + (1 - w) * 0.3) return true;
  }
  if (wear >= 3) {
    const c = (8.5 / N) * TAU;
    const w = 1 - angDist(phi, c) / (TAU / N / 2);
    if (w > 0.2 && s > 0.45 + 0.1 * Math.sin(phi * 23) + (1 - w) * 0.25) return true;
  }
  return false;
}

/**
 * The canopy and the shaft, drawn into the HiSprite `spr` with the top at (tx, ty). Returns the places the parts
 * go: { eye: [x, y, seen 0-1, scaleX], mouth, tongue, foot (the shaft's end), top }.
 * o: solid()'s options and { L, Ls, clear (vinyl), eyeS, mouthS, struts }
 */
function canopy(spr, tx, ty, o) {
  const L = o.L;
  const U = solid(L, o);
  const { w: W, h: H } = spr;
  const depth = new Float32Array(W * H).fill(-Infinity);
  const mat = new Array(W * H).fill(null);
  const lit = new Float32Array(W * H);
  const sAt = new Float32Array(W * H);
  const pAt = new Float32Array(W * H);
  const flag = new Uint8Array(W * H); // 1: a rib's ridge, 2: the rim, 3: a torn edge
  const camV = [0, Math.sin(TILT), Math.cos(TILT)];
  const put = (wp, n, m, s, phi, f = 0) => {
    const [X, Y, Z] = U.view(wp);
    const x = Math.floor(tx + X);
    const y = Math.floor(ty + Y);
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = y * W + x;
    if (Z <= depth[i]) return;
    depth[i] = Z;
    mat[i] = m;
    let l = 0.28 + 0.52 * Math.max(0, dot(n, SUN));
    if (m === 'u') l = 0.3 + 0.35 * Math.max(0, -dot(n, SUN)) + 0.2; // seen from under: lit through
    lit[i] = l;
    sAt[i] = s;
    pAt[i] = phi;
    flag[i] = f;
  };
  // the paper
  const spin = o.spin ?? 0;
  for (let s = 0.004; s <= 1; s += 0.6 / (L * 3)) {
    const Rs = Math.max(2, U.R(s));
    const dphi = 0.5 / (Rs * 3);
    const scal = 1 - 0.035 * Math.max(0, s - 0.9) / 0.1; // (the rim, scalloped between the ribs)
    for (let phi = 0; phi < TAU; phi += dphi) {
      const lphi = phi - spin; // (the pattern turns with it)
      if (s > scal + 0.035 * U.panel(phi) - 0.035) continue;
      if (torn(s, phi, U.wear, L, Rs)) continue;
      const p = U.point(s, phi);
      const a = U.world(p);
      const b = U.world(U.point(s + 0.004, phi));
      const c = U.world(U.point(s, phi + 0.01));
      let n = norm(cross([b[0] - a[0], b[1] - a[1], b[2] - a[2]], [c[0] - a[0], c[1] - a[1], c[2] - a[2]]));
      // outward: away from the shaft
      const out = U.world([p[0], 0, p[2]]);
      if (dot(n, [out[0], out[1] - 0.001, out[2]]) < 0 && s > 0.05) n = n.map((v) => -v);
      if (s <= 0.05) n = norm(U.world([p[0] * 0.3, 1, p[2] * 0.3]));
      const front = dot(n, camV) >= 0;
      let m;
      if (o.clear) m = front ? 'c' : 'c';
      else if (!front) m = 'u';
      else if (s < 0.1) m = 'k';
      else if (s < 0.16) m = 'w'; // (the stitching goes over it)
      else if (s > 0.44 && s < 0.56) m = 'w';
      else m = 'r';
      const rib = angDist(phi, Math.round((phi / TAU) * N) / N * TAU) * Rs < 0.9;
      const edge = s > scal + 0.035 * U.panel(phi) - 0.035 - 0.012;
      const nearTear = U.wear && torn(s + 0.012, phi, U.wear, L, Rs);
      put(a, n, m, s, lphi, edge ? 2 : rib ? 1 : nearTear ? 3 : 0);
    }
  }
  // the ribs under the paper (seen where it is torn) and the bare ends of the broken ones
  if (!o.clear)
    for (let i = 0; i < N; i++) {
      const phi = (i / N) * TAU;
      for (let s = 0.08; s <= 1.02; s += 0.003) {
        const p = U.point(s, phi, 1.2);
        const a = U.world(p);
        for (const [dx, dy] of [[0, 0], [0.7, 0], [0, 0.7]]) put([a[0] + dx, a[1] + dy, a[2]], norm(U.world([p[0], 0.4, p[2]])), 'b', s, phi, 0);
      }
    }
  // the shaft, and the struts from its runner up to the ribs (they show through the holes)
  const shaft = (y0, y1, r, m) => {
    for (let y = y0; y >= y1; y -= 0.25)
      for (let a = 0; a < TAU; a += 0.15) {
        const n = [Math.sin(a), 0, Math.cos(a)];
        put(U.world([n[0] * r, y, n[2] * r]), norm(U.world(n)), m, 0, 0, 0);
      }
  };
  const Ls = o.Ls;
  shaft(L * 0.1, -Ls, o.clear ? 1.4 : 2.2, o.clear ? 's' : 'b');
  if (!o.clear) {
    const ry = -Ls * (STATES.shut === U.st ? 0.92 : 0.5);
    shaft(ry + 2.5, ry - 2.5, 3.6, 'k'); // the runner
    for (let i = 0; i < N; i++) {
      const phi = (i / N) * TAU;
      const top = U.point(0.48, phi, 2);
      for (let t = 0; t <= 1; t += 0.01) put(U.world([top[0] * t, ry + (top[1] - ry) * t, top[2] * t]), [0, -1, 0], 'b', 0.5, phi, 0);
    }
    // the cap's knob
    for (let k = 0; k < 40; k++) {
      const a = (k / 40) * TAU;
      for (let r = 0; r < 3.4; r += 0.4) put(U.world([Math.sin(a) * r, L * 0.04 + 2.6 - r * 0.5, Math.cos(a) * r]), norm(U.world([Math.sin(a), 1.2, Math.cos(a)])), 'k', 0.01, a, 0);
    }
  }
  // into the sprite, material by material, with the paper's grain
  const box = [0, 0, W - 1, H - 1];
  const paper = mix2(mottle({ amt: 0.07, scale: 5, seed: 31 }), speckle({ amt: 0.12, dark: 0.04, light: 0.03, seed: 32 }));
  for (const m of new Set(mat.filter(Boolean)))
    spr.paint(box, (x, y) => mat[Math.floor(y) * W + Math.floor(x)] === m, m, (x, y) => lit[Math.floor(y) * W + Math.floor(x)], m === 'r' || m === 'w' || m === 'u' ? { pat: paper } : m === 'c' ? { glow: true } : {});
  // the details, by where on the umbrella each pixel is
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const m = mat[i];
      if (!m) continue;
      const s = sAt[i];
      const phi = pAt[i];
      if (o.clear) {
        if (flag[i] === 1) spr.px(x, y, 0xffffff, 0.85);
        if (flag[i] === 2) spr.px(x, y, 0xf0f8ff, 0.9);
        continue;
      }
      if (m === 'r' || m === 'w' || m === 'k') {
        if (flag[i] === 1) spr.shade([x, y, x, y], () => true, m === 'k' ? 0.15 : 0.1); // the ribs' ridges
        if (flag[i] === 2) spr.px(x, y, m === 'w' ? 0xc8b8a0 : 0x4a0810); // the rim's hem
        if (flag[i] === 3) spr.px(x, y, 0xf4ead8); // the torn paper's frayed edge
      }
      // the stitching: threads of six colours criss-crossing between the ribs
      if (s >= 0.1 && s < 0.16 && m !== 'u' && m !== 'b') {
        const q = ((phi / TAU) * N * 6 + (s - 0.1) * 40) % 6;
        const col = THREADS[((Math.floor(q) % 6) + 6) % 6];
        if ((Math.floor(phi * 60) + Math.floor(s * 200)) % 3) spr.px(x, y, col);
        else spr.px(x, y, 0x2a1a14);
      }
      // the paper's oily sheen
      if ((m === 'r' || m === 'w') && lit[i] > 0.82 && hash(x >> 1, y, 3) < 0.5) spr.shade([x, y, x, y], () => true, 0.08);
      // the ribs drawn as bamboo on the underside
      if (m === 'u' && angDist(phi, Math.round((phi / TAU) * N) / N * TAU) * U.R(s) < 1) spr.px(x, y, 0x8a6a34);
    }
  // where the parts go: points on the umbrella, seen
  const see = (s, phi) => {
    const p = U.point(s, phi);
    const a = U.world(p);
    const [X, Y] = U.view(a);
    const b = U.world(U.point(s, phi + 0.02));
    const c = U.world(U.point(s + 0.01, phi));
    const n = norm(cross([b[0] - a[0], b[1] - a[1], b[2] - a[2]], [c[0] - a[0], c[1] - a[1], c[2] - a[2]]));
    const faces = -dot(n, camV); // (the cross product points inward here)
    const [bx] = U.view(b);
    const sx = Math.min(1, Math.abs(bx - X) / (0.02 * Math.max(1, U.R(s))));
    return [tx + X, ty + Y, Math.max(0, Math.min(1, faces * 2)), sx];
  };
  const [fx, fy] = U.view(U.world([0, -Ls, 0]));
  const eye = see(o.eyeS ?? 0.66, spin);
  const mouth = see(o.mouthS ?? 0.86, spin);
  const [kx, ky] = U.view(U.world([0, L * 0.06 + 2.6, 0]));
  // the mouth: a wide grin across the front panels, the dark inside, a lip
  if (!o.clear && !o.noMouth && mouth[2] > 0.15) {
    const ms = o.mouthS ?? 0.86;
    const hw = (o.mouthW ?? 0.42) * (o.mouthGrin ?? 1);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (!mat[i] || mat[i] === 'u' || mat[i] === 'b') continue;
        const d = angDist(pAt[i], 0);
        if (d > hw) continue;
        const curve = ms + 0.05 * (d / hw) ** 2 * -1 + 0.02;
        const open = (o.mouthOpen ?? 0.05) * (1 - (d / hw) ** 2);
        const ds = sAt[i] - curve;
        if (ds > -open && ds < open + 0.012) spr.px(x, y, ds > open - 0.004 || ds < -open + 0.006 ? 0x2a0408 : 0x4a0a16);
        else if (Math.abs(ds - open - 0.02) < 0.006 && d < hw * 0.9) spr.px(x, y, 0x8a1420); // the lower lip's crease
      }
  }
  return { eye, mouth, foot: [tx + fx, ty + fy], top: [tx + kx, ty + ky] };
}

// ---------------------------------------------------------------- the big umbrella
export const CW = 162; // its frame, fine px (54 x 42 logical)
export const CH = 126;
const TX = 81; // the top of its shaft in the frame
const TY = 30;
const BIG = { L: 76, Ls: 70 };
export const KASA_ANCHORS = {}; // frame name -> { eye, mouth, foot, top } in logical px from the frame's middle

function rel(a) {
  return a && [Math.round(((a[0] - CW / 2) / 3) * 10) / 10, Math.round(((a[1] - CH / 2) / 3) * 10) / 10, ...a.slice(2).map((v) => Math.round(v * 100) / 100)];
}

function bigFrame(name, o) {
  const s = new HiSprite(CW, CH, RAMPS);
  const at = canopy(s, TX + (o.dx ?? 0), TY + (o.dy ?? 0), { ...BIG, ...o });
  KASA_ANCHORS[name] = { eye: rel(at.eye), mouth: rel(at.mouth), foot: rel(at.foot), top: rel(at.top) };
  return s.render({ outline: 2, rim: 0.08 });
}

// ---------------------------------------------------------------- the leg: the old handle, then a bare leg in a geta
// poses: stand, crouch (two depths), stretch (pushing off), air (tucked, the geta dangling), land (the knee giving)
export const LW = 48;
export const LH = 84;
const LEG = {
  stand: { knee: [4, 0.52], foot: 58, toe: 0 },
  crouch1: { knee: [9, 0.5], foot: 48, toe: 0 },
  crouch2: { knee: [14, 0.48], foot: 38, toe: 0 },
  stretch: { knee: [1, 0.5], foot: 66, toe: 0.5 },
  air: { knee: [7, 0.45], foot: 52, toe: 0.9 },
  land: { knee: [11, 0.5], foot: 44, toe: 0 },
};
export const LEG_FOOT = {}; // pose -> the sole's distance below the top, logical px

function leg(pose) {
  const p = LEG[pose];
  const s = new HiSprite(LW, LH, RAMPS);
  const cx = LW / 2;
  const top = 2;
  const handle = 14; // the bamboo handle before the leg comes out of it
  const fy = top + handle + p.foot; // the ankle
  // the leg: thigh to the knee (out to the right), shin back to the ankle
  const kx = cx + p.knee[0];
  const ky = top + handle + p.foot * p.knee[1];
  s.tube(cx, top + handle - 2, kx, ky, 3.6, 'f', { rb: 3.2 });
  s.tube(kx, ky, cx, fy, 3.2, 'f', { rb: 2.4 });
  s.ellipse(kx, ky, 3.6, 3.2, 'f', { bias: 0.04 }); // the knee
  // hairs on the shin, a crease behind the knee
  for (let k = 0; k < 9; k++) {
    const t = 0.15 + k * 0.08;
    const x = kx + (cx - kx) * t + 1.5;
    const y = ky + (fy - ky) * t;
    s.line(x, y, x + 1.5, y - 1, 0x5a3a28, 1, 0.8);
  }
  s.line(kx - 3, ky + 1, kx - 1, ky + 2, 0x9a5a40, 1);
  // the foot, toes forward (down the screen); pointed in the air
  const toe = p.toe;
  s.ellipse(cx, fy + 3 + toe * 3, 3.4, 4 + toe * 2, 'f', { bias: 0.05 });
  for (let k = -1; k <= 1; k++) s.dot(cx + k * 1.9, fy + 6.5 + toe * 5, 1.1, 0xe8b490);
  // the geta: a board of wood with one tall tooth, its red thong between the toes
  const gy = fy + 7 + toe * 6;
  const tip = toe * 0.25;
  s.poly([[cx - 6.5, gy - 1], [cx + 6.5, gy - 1 + tip * 4], [cx + 6, gy + 6 + tip * 4], [cx - 6, gy + 6]], 'g', { flat: 0.62, pat: speckle({ amt: 0.1, dark: 0.08, seed: 41 }) });
  s.line(cx - 6, gy - 1, cx + 6, gy - 1 + tip * 4, 0xf0c88a, 1); // its lit top edge
  s.poly([[cx - 2, gy + 6], [cx + 2, gy + 6], [cx + 2, gy + 10 - toe * 2], [cx - 2, gy + 10 - toe * 2]], 'g', { flat: 0.4 }); // the tooth
  s.line(cx - 4.5, gy, cx, gy + 3.5, 0xd8283a, 2);
  s.line(cx + 4.5, gy + tip * 4, cx, gy + 3.5, 0xd8283a, 2);
  s.dot(cx, gy + 3.5, 1.2, 0xff8a8a);
  // the handle: old bamboo, a node, a wrap of rattan, the thread where it meets the leg
  s.tube(cx, top - 2, cx, top + handle + 1, 2.4, 'B');
  for (const y of [top + 4, top + 11]) s.line(cx - 2.4, y, cx + 2.4, y, 0x2a1c0a, 1);
  for (let y = top + 6; y < top + 10; y += 1.2) s.line(cx - 2.6, y, cx + 2.6, y + 0.6, y % 2.4 < 1.2 ? 0x8a2a1a : 0xc8a060, 1);
  s.line(cx - 3, top + handle, cx + 3, top + handle + 1, 0xd8283a, 2);
  LEG_FOOT[pose] = Math.round(((gy + 10 - toe * 2 - top) / 3) * 10) / 10;
  return s.render({ outline: 2 });
}

// ---------------------------------------------------------------- the eye: one, big, red-rimmed, never still
export const EW = 51;
export const EH = 39;
function eye(kind) {
  const s = new HiSprite(EW, EH, RAMPS);
  const [cx, cy] = [EW / 2, EH / 2];
  const look = { l2: -6, l1: -3, c: 0, r1: 3, r2: 6, wide: 0, angry: 0, glow: 0 }[kind] ?? 0;
  if (kind === 'shut' || kind === 'happy') {
    // shut: a curve of the lid and its lashes (happy: the curve the other way)
    const up = kind === 'happy' ? -1 : 1;
    for (let x = -15; x <= 15; x += 0.5) {
      const y = cy + up * (4 - (x * x) / 60);
      s.dot(cx + x, y, 1.6, INK);
    }
    for (const k of [-10, -4, 3, 9]) s.line(cx + k, cy + up * (4 - (k * k) / 60), cx + k * 1.25, cy + up * (8.5 - (k * k) / 70), INK, 1.5);
    return s.render({ outline: 0 });
  }
  if (kind === 'hurt') {
    s.ellipse(cx, cy, 16, 12, 'e', { bias: 0.05 });
    for (let a = 0; a < 5 * TAU; a += 0.05) s.dot(cx + Math.cos(a) * a * 0.42, cy + Math.sin(a) * a * 0.33, 0.9, INK);
    return s.render({ outline: 2 });
  }
  const half = kind === 'half';
  const wide = kind === 'wide';
  const rx = wide ? 17 : 16;
  const ry = wide ? 14 : half ? 6.5 : 12;
  const oy = half ? 4 : 0;
  s.ellipse(cx, cy + oy, rx, ry, 'e', { bias: 0.05 });
  // veins at the corners, redder when it is angry or straining
  const veins = kind === 'angry' || wide ? 7 : 3;
  for (let k = 0; k < veins; k++) {
    const side = k % 2 ? 1 : -1;
    const y = cy + oy + (hash(k, 1, 3) - 0.5) * ry;
    s.line(cx + side * (rx - 1), y, cx + side * (rx - 6 - k), y + (hash(k, 2, 3) - 0.5) * 4, 0xd04a4a, 1, 0.75);
  }
  // the iris: amber round a red ring, the pupil (small when it stares)
  const ix = cx + look;
  const iy = cy + oy + (half ? 1 : 0);
  const ir = wide ? 6.4 : 8;
  s.dot(ix, iy, ir + 1, 0x5a0a10);
  s.dot(ix, iy, ir, 0xd0402a);
  s.dot(ix - 0.6, iy - 0.6, ir - 2.2, 0xf0a030);
  for (let a = 0; a < TAU; a += TAU / 14) s.line(ix + Math.cos(a) * 2.5, iy + Math.sin(a) * 2.5, ix + Math.cos(a) * (ir - 1), iy + Math.sin(a) * (ir - 1), 0xc06a1a, 1, 0.6);
  s.dot(ix, iy, wide ? 2 : 3.6, 0x120808);
  s.dot(ix - 2.6, iy - 2.8, 1.6, 0xffffff);
  s.px(ix + 2.5, iy + 2, 0xffffff, 0.7);
  // the lids: a heavy upper lid with lashes, a thin lower one; angry: the upper lid slants down
  const slant = kind === 'angry' ? 5 : 0;
  for (let x = -rx; x <= rx; x += 0.5) {
    const t = x / rx;
    const yTop = cy + oy - ry * Math.sqrt(Math.max(0, 1 - t * t)) + (slant ? slant * (1 - Math.abs(t + 0.4)) : 0);
    s.dot(cx + x, yTop, 1.4, INK);
    if (slant) for (let y = cy + oy - ry - 2; y < yTop; y++) s.px(cx + x, y, 0x6a0c16); // the lid's skin
    s.px(cx + x, cy + oy + ry * Math.sqrt(Math.max(0, 1 - t * t)), 0x4a0a10);
  }
  for (const k of [-13, -8, -3, 3, 8, 13]) {
    const t = k / rx;
    const y = cy + oy - ry * Math.sqrt(Math.max(0, 1 - t * t)) - 1;
    const len = (wide ? 5 : 4) - Math.abs(t) * 1.5;
    s.line(cx + k, y, cx + k + Math.sign(k) * len * 0.7, y - len, INK, 1); // (lashes, swept outward)
  }
  return s.render({ outline: 2 });
}

/** The ring round the eye while it is open to hits (mint), glowing. */
function eyeRing() {
  const r = new Raster(EW + 12, EH + 12);
  const [cx, cy] = [(EW + 12) / 2, (EH + 12) / 2];
  for (let y = 0; y < r.h; y++)
    for (let x = 0; x < r.w; x++) {
      const d = Math.hypot((x + 0.5 - cx) / 25, (y + 0.5 - cy) / 19.5);
      if (d > 0.86 && d < 1) r.set(x, y, d > 0.96 ? 0xffffff : 0x81f3cc, d > 0.96 ? 0.9 : 0.85);
      else if (d > 0.74 && d <= 0.86) r.set(x, y, 0x81f3cc, (d - 0.74) * 3);
    }
  return r;
}

// ---------------------------------------------------------------- the tongue: a chain of segments and its tip
function tongueSeg() {
  const s = new HiSprite(15, 15, RAMPS);
  s.ellipse(7.5, 7.5, 5.2, 5.2, 't', { bias: 0.06 });
  s.line(7.5, 3.5, 7.5, 11.5, 0xb02a48, 1); // its groove down the middle
  s.px(5, 5, 0xffd0dc);
  return s.render({ outline: 1 });
}
function tongueTip(f) {
  const s = new HiSprite(24, 27, RAMPS);
  const curl = [0, 2.5][f];
  s.ellipse(12 + curl * 0.4, 12, 9, 11, 't', { bias: 0.06 });
  s.ellipse(12 - curl, 21 - curl * 0.5, 7, 4.5, 't', { bias: 0.12 });
  s.line(12, 3, 12 - curl * 0.5, 19, 0xb02a48, 1);
  for (let k = 0; k < 6; k++) s.px(8 + hash(k, 1, 9) * 8, 6 + hash(k, 2, 9) * 10, 0xff8aa4); // its rough surface
  s.dot(8, 7, 1.4, 0xffe0e8);
  return s.render({ outline: 2 });
}

// ---------------------------------------------------------------- the little ones (phase 2), whole in one frame
export const MW = 75;
export const MH = 87;
function mini(f) {
  const s = new HiSprite(MW, MH, RAMPS);
  const pose = [
    { state: 'open', lean: 0, roll: 0, foot: 'stand', eye: 'c' },
    { state: 'wide', lean: 0, roll: 0, foot: 'crouch', eye: 'c' },
    { state: 'half', lean: -0.25, roll: 0.15, foot: 'air', eye: 'c' }, // hop: up, the canopy pulled in
    { state: 'half', lean: -0.25, roll: -0.15, foot: 'air', eye: 'c' },
    { state: 'wide', lean: 0, roll: 0, foot: 'land', eye: 'shut' },
    { state: 'open', lean: 0, roll: 0, foot: 'stand', eye: 'shut' }, // blink
    { state: 'open', lean: 0, roll: 0, foot: 'stand', eye: 'hurt' },
  ][f];
  const legLen = { stand: 22, crouch: 17, air: 20, land: 16 }[pose.foot];
  const tx = MW / 2;
  const ty = 18 + (22 - legLen);
  // its leg first (behind the canopy's rim): a short bamboo handle, a thin leg, a geta
  const fx = tx + Math.sin(pose.roll) * 10;
  const base = ty + 30;
  const kneeX = fx + (pose.foot === 'crouch' || pose.foot === 'land' ? 5 : 2);
  const footY = base + legLen;
  s.tube(fx, base - 6, fx, base + 2, 1.6, 'B');
  s.tube(fx, base + 2, kneeX, base + legLen * 0.5, 1.8, 'f');
  s.tube(kneeX, base + legLen * 0.5, fx, footY, 1.6, 'f', { rb: 1.3 });
  const toe = pose.foot === 'air' ? 3 : 0;
  s.poly([[fx - 4, footY + 1 + toe], [fx + 4, footY + 1 + toe], [fx + 4, footY + 4 + toe], [fx - 4, footY + 4 + toe]], 'g', { flat: 0.6 });
  s.line(fx - 3, footY + 1 + toe, fx, footY + 3 + toe, 0xd8283a, 1);
  s.line(fx + 3, footY + 1 + toe, fx, footY + 3 + toe, 0xd8283a, 1);
  s.line(fx - 1, footY + 4 + toe, fx + 1, footY + 6 + toe, 0x7a5030, 2);
  const at = canopy(s, tx, ty, { L: 32, Ls: 30, state: pose.state, lean: pose.lean, roll: pose.roll, eyeS: 0.62, mouthS: 0.86, mouthW: 0.5 });
  // its eye, painted on (small: one blink and one wince are frames of their own)
  const [ex, ey] = at.eye;
  if (pose.eye === 'shut') for (let x = -4; x <= 4; x += 0.5) s.dot(ex + x, ey + 1 - (x * x) / 16, 0.8, INK);
  else if (pose.eye === 'hurt') {
    s.dot(ex, ey, 4.5, 0xf4f0e4);
    for (let a = 0; a < 4 * TAU; a += 0.1) s.px(ex + Math.cos(a) * a * 0.16, ey + Math.sin(a) * a * 0.14, INK);
  } else {
    s.dot(ex, ey, 4.6, INK);
    s.dot(ex, ey, 3.8, 0xf4f0e4);
    s.dot(ex, ey + 0.4, 2.4, 0xd0402a);
    s.dot(ex, ey + 0.4, 1.2, 0x120808);
    s.px(ex - 1, ey - 1, 0xffffff);
  }
  // a stub of tongue
  const [mx, my] = at.mouth;
  s.ellipse(mx, my + 3, 2.4, 3.2, 't', { bias: 0.08 });
  return s.render({ outline: 2 });
}

// ---------------------------------------------------------------- the walk signal hung over the crossing
export const SW = 72;
export const SH = 81;
function signal(kind) {
  const s = new HiSprite(SW, SH, RAMPS);
  // the arm it hangs from (from the right edge), its clamp
  s.tube(SW - 1, 6, 30, 6, 2.6, 's');
  s.tube(36, 6, 36, 13, 1.8, 's');
  // the housing: two lamps one over the other, hoods over each, the countdown's frame down its left side
  s.poly([[14, 12], [56, 12], [56, 78], [14, 78]], 'y', { flat: 0.5, pat: speckle({ amt: 0.06, seed: 51 }) });
  s.line(14, 12, 56, 12, 0x8a909a, 1);
  for (const y0 of [16, 47]) {
    s.poly([[19, y0], [53, y0], [53, y0 + 28], [19, y0 + 28]], 'y', { flat: 0.3 });
    s.line(18, y0 - 1, 54, y0 - 1, 0x6a7080, 2); // the hood
  }
  const red = kind === 'red';
  const go = kind === 'go0' || kind === 'go1';
  // the lamps: off they are a dark glass with the figure faint in it; lit, the figure glows, the glass round it too
  const lamp = (y0, on, col, dim) => {
    for (let y = y0 + 2; y < y0 + 26; y++) for (let x = 21; x < 51; x++) s.px(x, y, on ? col : dim, 1);
  };
  lamp(16, red, 0x3a0808, 0x1a0c0e);
  lamp(47, go, 0x06301e, 0x0c1612);
  // the standing figure (red) and the walking one (green), in a block of lamp-dots
  const fig = (x0, y0, walk, c) => {
    const dots = [];
    const add = (x, y) => dots.push([x, y]);
    // head
    for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) if (x * x + y * y <= 5) add(x, y - 9);
    // body
    for (let y = -6; y <= 2; y++) for (let x = -2; x <= 2; x++) add(x, y);
    if (walk == null) {
      for (let y = 3; y <= 10; y++) for (const x of [-2, -1, 1, 2]) add(x, y); // legs together
      for (let y = -5; y <= 1; y++) for (const x of [-4, 4]) add(x, y); // arms down
    } else {
      const k = walk ? 1 : -1;
      for (let y = 3; y <= 10; y++) {
        add(Math.round(k * (y - 2) * 0.5), y);
        add(Math.round(k * (y - 2) * 0.5) + 1, y);
        add(Math.round(-k * (y - 2) * 0.45), y);
        add(Math.round(-k * (y - 2) * 0.45) - 1, y);
      }
      for (let y = -5; y <= 0; y++) {
        add(Math.round(k * (y + 6) * 0.6) + 3, y);
        add(Math.round(-k * (y + 6) * 0.6) - 3, y);
      }
    }
    for (const [x, y] of dots) s.px(x0 + x, y0 + y, c);
  };
  fig(36, 31, null, red ? 0xff5040 : 0x4a1a18);
  fig(36, 62, kind === 'go1' ? 1 : 0, go ? 0x50f0a0 : 0x1a3a2a);
  if (red) for (let y = 18; y < 42; y++) for (let x = 22; x < 50; x++) if (hash(x, y, 2) < 0.2) s.px(x, y, 0x6a1410);
  if (go) for (let y = 49; y < 73; y++) for (let x = 22; x < 50; x++) if (hash(x, y, 2) < 0.2) s.px(x, y, 0x0e5a34);
  // rain on its top, a drop at the corner
  for (let x = 16; x < 55; x += 3) s.px(x, 13, 0xc8e0f0, 0.8);
  s.dot(55, 79, 1.2, 0xc8e8ff);
  return s.render({ outline: 2 });
}

// ---------------------------------------------------------------- its bullets, drawn pointing down the screen
function drop() {
  const s = new HiSprite(15, 21, RAMPS);
  s.paint([0, 0, 14, 20], (x, y) => {
    const dy = y - 13;
    const r = dy > 0 ? 6 - dy * 0.05 : 6 * (1 + dy / 12);
    return dy > -12 && Math.hypot(x - 7.5, Math.max(0, dy)) <= Math.max(0.6, r) && (dy > 0 ? Math.hypot(x - 7.5, dy) <= 6 : Math.abs(x - 7.5) <= r);
  }, 'd', (x, y) => 0.6 + (y > 12 ? -(y - 12) * 0.03 : 0.1) - Math.abs(x - 7.5) * 0.02, { glow: true });
  s.dot(7.5, 13.5, 2.6, 0xffffff);
  s.dot(6, 11, 1, 0xffffff);
  return s.render({ outline: 2 });
}
function rib() {
  // a splinter of rib: split bamboo, its frayed end, a scrap of red paper still on it
  const s = new HiSprite(12, 27, RAMPS);
  s.poly([[5, 1], [8, 2], [7, 24], [4, 25]], 'b', { flat: 0.62 });
  s.line(5, 2, 5, 24, 0xf0d890, 1);
  for (const [x, y] of [[3, 23], [8, 25], [4, 26]]) s.px(x, y, 0xb08840);
  s.poly([[7, 6], [11, 8], [10, 13], [7, 11]], 'r', { flat: 0.55 });
  return s.render({ outline: 2 });
}

/** Its shadow on the wet asphalt (shrinks as it jumps: the game scales it). */
function shadow() {
  const r = new Raster(54, 21);
  for (let y = 0; y < r.h; y++)
    for (let x = 0; x < r.w; x++) {
      const d = Math.hypot((x + 0.5 - 27) / 27, (y + 0.5 - 10.5) / 10.5);
      if (d < 1) r.set(x, y, 0x0a0816, 0.42 * Math.min(1, (1 - d) * 3));
    }
  return r;
}

/** A ring of water where it lands, spreading (the game fades it). */
function ripple(f) {
  const r = new Raster(66, 27);
  const k = [0.45, 0.7, 1][f];
  for (let y = 0; y < r.h; y++)
    for (let x = 0; x < r.w; x++) {
      const d = Math.hypot((x + 0.5 - 33) / (33 * k), (y + 0.5 - 13.5) / (13.5 * k));
      if (d > 0.84 && d < 1) r.set(x, y, 0xd8ecff, 0.75 * (1 - f * 0.25));
      else if (d > 0.7 && d <= 0.84 && f < 2) r.set(x, y, 0x8ab0d0, 0.35);
    }
  return r;
}

// ---------------------------------------------------------------- the clear umbrella it ends as, hopping off on its hook
function clear(f) {
  const s = new HiSprite(66, 78, RAMPS);
  const roll = [0.18, -0.18][f];
  const at = canopy(s, 33, 16, { L: 28, Ls: 40, state: 'open', clear: true, roll, lean: 0.1, noMouth: true });
  // the hook of its handle
  const [fx, fy] = at.foot;
  for (let a = 0; a <= Math.PI; a += 0.1) s.dot(fx + 3 - Math.cos(a) * 3, fy + Math.sin(a) * 3.4, 1.2, 0x3a3e46);
  return s.render({ outline: 1 });
}

export function kasaEnemies(add) {
  const canopyStates = ['shut', 'half', 'wide', 'open'];
  for (let w = 0; w < 4; w++) for (const st of canopyStates) add(`ko_${st}_${w}`, bigFrame(`ko_${st}_${w}`, { state: st, wear: w }));
  // spinning shut (phase 1: a quarter of a panel a frame) and spinning open like a top, torn (phase 3), wobbling
  for (let f = 0; f < 4; f++) {
    for (const w of [0, 1]) add(`ko_spin_${f}_${w}`, bigFrame(`ko_spin_${f}_${w}`, { state: 'shut', wear: w, spin: (f / 4) * (TAU / N) * 2 }));
    for (const w of [2, 3]) add(`ko_top_${f}_${w}`, bigFrame(`ko_top_${f}_${w}`, { state: 'wide', wear: w, spin: (f / 4) * (TAU / N) * 2, roll: [0.12, 0.04, -0.12, -0.04][f], lean: [0, 0.1, 0, -0.08][f] }));
  }
  // in the air: pulled in, tipped back; landing: flattened open
  for (const w of [0, 1, 2, 3]) {
    add(`ko_air_${w}`, bigFrame(`ko_air_${w}`, { state: 'half', wear: w, lean: -0.3 }));
    add(`ko_squash_${w}`, bigFrame(`ko_squash_${w}`, { state: { bt: 1.56, br: 1.18, sag: 0.05, bulge: 0 }, wear: w, dy: 4 }));
  }
  // the bow at the end: shut, its top coming down towards us, twice
  for (const [k, lean] of [[0, 0.3], [1, 0.6]]) add(`ko_bow_${k}`, bigFrame(`ko_bow_${k}`, { state: 'shut', wear: 3, lean, dy: 6 }));
  // bursting into three (the paper splitting along three ribs) and pulling back together
  add('ko_split', bigFrame('ko_split', { state: { bt: 1.62, br: 1.4, sag: 0.32, bulge: 0 }, wear: 2, dy: 8 }));
  for (const pose of Object.keys(LEG)) add(`ko_leg_${pose}`, leg(pose));
  for (const k of ['l2', 'l1', 'c', 'r1', 'r2', 'half', 'shut', 'angry', 'wide', 'hurt', 'happy']) add(`ko_eye_${k}`, eye(k));
  add('ko_eye_ring', eyeRing());
  add('ko_tongue', tongueSeg());
  add('ko_tongue_tip_0', tongueTip(0));
  add('ko_tongue_tip_1', tongueTip(1));
  for (let f = 0; f < 7; f++) add(`ko_mini_${f}`, mini(f));
  for (const k of ['off', 'red', 'go0', 'go1']) add(`ko_sig_${k}`, signal(k));
  add('ko_drop', drop());
  add('ko_rib', rib());
  add('ko_shadow', shadow());
  for (let f = 0; f < 3; f++) add(`ko_ripple_${f}`, ripple(f));
  add('ko_clear_0', clear(0));
  add('ko_clear_1', clear(1));
  add('ko_portrait', portrait());
}

/** For the album and the ending: the umbrella open, standing on its leg, looking at us (the parts as the game sets them). */
function portrait() {
  const can = bigFrame('ko_open_0', { state: 'open', wear: 0 });
  const at = KASA_ANCHORS.ko_open_0;
  const [cx, cy] = [CW / 2, CH / 2];
  const legR = leg('stand');
  const eyeR = eye('c');
  const top = Math.round(cy + at.foot[1] * 3) - 2; // (the handle's top row in the leg's frame)
  const r = new Raster(CW, top + LH);
  r.blit(legR, Math.round(cx + at.foot[0] * 3 - legR.w / 2), top);
  r.blit(can, 0, 0);
  r.blit(eyeR, Math.round(cx + at.eye[0] * 3 - eyeR.w / 2), Math.round(cy + at.eye[1] * 3 - eyeR.h / 2));
  return r;
}
