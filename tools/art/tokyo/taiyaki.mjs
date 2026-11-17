// The second miniboss of Tokyo (docs/plan-tokyo.md, 6.2): TAIYAKI, the school out of the iron mould. Over the stall
// that bakes fish of batter in front of Sensō-ji floats its iron: a cast-iron mould in the shape of a fish, two halves
// on a hinge, long iron handles with wooden grips. It opens in a cloud of steam and lets out a school of little fish
// of batter - golden, scaled, crisp at the seam - which bite marks open to show what is inside (sweet beans, custard,
// green tea); at the last it glows red and out jumps one great golden fish with wings of lacy crisp batter.
// Frames: the mould closed to open and its glow, the little fish swimming (plain, and bitten three ways for each
// filling), the great fish (swimming, charging, spent; its wings breaking), its two halves, the bullets, a shadow.
import { HiSprite, tones, mottle, speckle, mix2, hash } from '../../lib/hisprite.mjs';
import { Raster } from '../../lib/raster.mjs';

const TAU = Math.PI * 2;
const INK = 0x14101c;
const RAMPS = {
  g: tones([0x6a300a, 0xc0701c, 0xf4b45a]), // the batter, baked golden brown
  G: tones([0x3a1806, 0x7a3c10, 0xb0682a]), // where it browned in the iron's ridges
  p: tones([0xb08840, 0xecd090, 0xfff4d0]), // the crumb inside, the crisp skirt at the seam
  o: tones([0x8a4a08, 0xe0a020, 0xfff07a]), // the great fish: gold
  a: tones([0x1a060a, 0x4a1424, 0x8a3a48]), // sweet bean paste
  k: tones([0xb08018, 0xf0cc50, 0xfff4b0]), // custard
  m: tones([0x24420e, 0x5a8a28, 0xa8d070]), // green tea cream
  i: tones([0x0a0a0e, 0x26262e, 0x62626e]), // cast iron
  w: tones([0x3a1c0c, 0x7a4424, 0xb87a4a]), // the grips' wood
  e: tones([0x7a6a50, 0xd8ccb0, 0xffffff]), // steam, flour
};
const FILL = { a: 'a', k: 'k', m: 'm' };

// ---------------------------------------------------------------- a fish of batter, facing right, centred at (cx, cy)
// o: { L, H, mat, tail (bend, radians), bite 0-3, fill ('a' | 'k' | 'm'), wings 0-3 (0: none; 1 whole ... 3 broken),
//      mouth (open 0-1), eye ('dot' | 'shut' | 'swirl' | 'wide'), stretch (charge) }
function fish(s, cx, cy, o) {
  const { L, H } = o;
  const mat = o.mat ?? 'g';
  const st = o.stretch ?? 1;
  const Lx = L * st;
  const Hy = H / Math.sqrt(st);
  // the body: a round head going into a body that narrows to the tail's root
  const body = (x, y) => {
    const t = (x - cx) / Lx + 0.5; // 0 at the tail end of the body, 1 at the nose
    if (t < 0.12 || t > 1) return false;
    const head = t > 0.72 ? Math.sqrt(Math.max(0, 1 - ((t - 0.72) / 0.28) ** 2)) : 1;
    const half = (Hy / 2) * (0.38 + 0.62 * Math.sin(Math.min(1, (t - 0.12) / 0.62) * Math.PI * 0.5)) * head;
    const mouth = o.mouth && t > 0.9 && Math.abs(y - cy - Hy * 0.06) < Hy * 0.09 * o.mouth;
    return Math.abs(y - cy) <= half && !mouth;
  };
  // the tail: a fan off the body's root, bent
  const tb = o.tail ?? 0;
  const root = [cx - Lx * 0.36, cy];
  const turn = ([x, y]) => {
    const [dx, dy] = [x - root[0], y - root[1]];
    return [root[0] + dx * Math.cos(tb) - dy * Math.sin(tb), root[1] + dx * Math.sin(tb) + dy * Math.cos(tb)];
  };
  const tailPts = [[cx - Lx * 0.33, cy - Hy * 0.16], [cx - Lx * 0.56, cy - Hy * 0.5], [cx - Lx * 0.5, cy], [cx - Lx * 0.56, cy + Hy * 0.5], [cx - Lx * 0.33, cy + Hy * 0.16]].map(turn);
  const bites = [];
  if (o.bite >= 1) bites.push([cx + Lx * 0.4, cy - Hy * 0.42, Hy * 0.32]); // a bite out of the head
  if (o.bite >= 2) bites.push([cx + Lx * 0.02, cy + Hy * 0.5, Hy * 0.34]); // out of the belly
  if (o.bite >= 3) bites.push([cx - Lx * 0.14, cy - Hy * 0.36, Hy * 0.44]); // out of the back: half gone
  const inBite = (x, y) => bites.some(([bx, by, r]) => Math.hypot(x - bx, y - by) < r + Math.sin(Math.atan2(y - by, x - bx) * 9) * 0.9); // (scalloped: teeth)
  const edgeOfBite = (x, y) => Math.min(...bites.map(([bx, by, r]) => r - Math.hypot(x - bx, y - by)));
  const inTail = (x, y) => inPolyT(tailPts, x, y);
  // the crisp wings of batter (the great fish): a lacy skirt round the body, broken off in pieces as it wears
  if (o.wings) {
    const lost = o.wings - 1; // pieces gone
    const sc = [cx + Lx * 0.02, cy];
    const skirt = (x, y) => {
      if (body(x, y)) return false;
      const a = Math.atan2(y - sc[1], (x - sc[0]) * 0.62);
      const r = Math.hypot((x - sc[0]) / (Lx * 0.5), (y - sc[1]) / (Hy * 0.82));
      const k = Math.floor(((a + Math.PI) / TAU) * 14);
      if (k === 0 || k === 13 || k === 6 || k === 7) return false; // (none off the nose or the tail)
      if (lost >= 1 && [2, 9, 11].includes(k)) return false;
      if (lost >= 2 && [3, 4, 8, 12].includes(k)) return false;
      const ragged = 1 - hash(Math.floor(a * 40), 1, 9) * 0.1 - Math.abs(Math.sin(a * 21)) * 0.05;
      return r < ragged;
    };
    s.paint([cx - Lx * 0.6, cy - Hy, cx + Lx * 0.55, cy + Hy], skirt, 'p', (x, y) => 0.62 + ((y < cy ? -1 : 1) * (y - cy)) * -0.002, { pat: mix2(speckle({ amt: 0.22, dark: 0.1, light: 0.1, seed: 33 }), mottle({ amt: 0.14, scale: 4, seed: 34 })) });
  }
  const box = [cx - Lx * 0.7, cy - Hy * 0.75, cx + Lx * 0.55, cy + Hy * 0.75];
  const light = (x, y) => {
    const nx = (x - cx) / (Lx * 0.5);
    const ny = (y - cy) / (Hy * 0.5);
    return 0.42 + 0.4 * Math.max(0, -0.5 * nx - 0.7 * ny + 0.5 * Math.sqrt(Math.max(0, 1 - nx * nx * 0.5 - ny * ny * 0.6)));
  };
  // the tail and body in batter (gold for the great one), the cut faces where it was bitten
  s.paint(box, (x, y) => inTail(x, y) && !inBite(x, y), mat, light, { pat: mottle({ amt: 0.08, scale: 4, seed: 21 }) });
  s.paint(box, (x, y) => body(x, y) && !inBite(x, y), mat, light, { pat: mix2(mottle({ amt: 0.1, scale: 5, seed: 22 }), speckle({ amt: 0.12, dark: 0.05, seed: 23 })) });
  if (bites.length) {
    s.paint(box, (x, y) => body(x, y) && inBite(x, y) && edgeOfBite(x, y) < 3.4 && edgeOfBite(x, y) > 1.6, 'p', () => 0.62, { pat: speckle({ amt: 0.2, dark: 0.15, seed: 24 }) });
    s.paint(box, (x, y) => body(x, y) && inBite(x, y) && edgeOfBite(x, y) <= 1.6, FILL[o.fill] ?? 'a', () => 0.66, {});
    if (o.fill === 'a') for (let k = 0; k < 30; k++) {
      // beans in the paste
      const [bx, by, r] = bites[k % bites.length];
      const a = hash(k, 1, 4) * TAU;
      const x = bx + Math.cos(a) * (r - 0.8);
      const y = by + Math.sin(a) * (r - 0.8);
      if (body(x, y)) s.px(x, y, 0x6a2a34);
    }
  }
  // the iron's marks: scales on the back two thirds, a gill, the fins' ribs, the eye, the mouth
  const scale = Math.max(3, Hy * 0.16);
  for (let y = Math.floor(cy - Hy / 2); y <= cy + Hy / 2; y++)
    for (let x = Math.floor(cx - Lx * 0.32); x < cx + Lx * 0.18; x++) {
      if (!body(x + 0.5, y + 0.5) || inBite(x + 0.5, y + 0.5)) continue;
      const row = Math.floor((y - cy) / scale);
      const sx = (x - cx + (row % 2 ? scale * 0.5 : 0)) / scale;
      const fx = sx - Math.floor(sx);
      const fy = (y - cy) / scale - row;
      if (Math.abs(Math.hypot(fx - 0.5, fy - 0.9) - 0.55) < 0.12) s.shade([x, y, x, y], () => true, -0.14); // a scale's crescent
    }
  const gx = cx + Lx * 0.22;
  for (let y = cy - Hy * 0.3; y <= cy + Hy * 0.3; y += 0.5) {
    const x = gx - Math.abs(y - cy) * 0.35;
    if (body(x, y) && !inBite(x, y)) s.shade([x, y, x + 1, y], () => true, -0.18);
  }
  for (let k = 0; k < 4; k++) {
    // the pectoral fin: four ribs fanning back
    const a = 2.6 + k * 0.18;
    for (let r = 0; r < Hy * 0.32; r += 0.5) {
      const x = cx + Lx * 0.12 + Math.cos(a) * r;
      const y = cy + Hy * 0.12 + Math.sin(a) * r * 0.6;
      if (body(x, y) && !inBite(x, y)) s.shade([x, y, x, y], () => true, 0.12);
    }
  }
  // the dorsal fin's ridge along the back
  for (let x = cx - Lx * 0.25; x < cx + Lx * 0.15; x += 1) {
    const t = (x - cx) / Lx + 0.5;
    const half = (Hy / 2) * (0.38 + 0.62 * Math.sin(Math.min(1, (t - 0.12) / 0.62) * Math.PI * 0.5));
    for (const y of [cy - half + 2, cy + half - 2]) if (body(x, y) && !inBite(x, y) && Math.floor(x) % 3 === 0) s.shade([x, y - 1, x, y + 1], () => true, -0.16);
  }
  const ex = cx + Lx * 0.36;
  const ey = cy - Hy * 0.12;
  const er = Math.max(1.6, Hy * 0.1);
  if (!inBite(ex, ey)) {
    if (o.eye === 'shut') s.line(ex - er, ey, ex + er, ey, INK, 1);
    else if (o.eye === 'swirl') for (let a = 0; a < 3 * TAU; a += 0.2) s.px(ex + Math.cos(a) * a * er * 0.06, ey + Math.sin(a) * a * er * 0.06, INK);
    else {
      s.dot(ex, ey, er + 0.8, o.mat === 'o' ? 0x6a3a08 : 0x4a2208);
      s.dot(ex, ey, er, o.eye === 'wide' ? 0xfff8e0 : 0x2a1406);
      if (o.eye === 'wide') s.dot(ex, ey, er * 0.45, INK);
      s.px(ex - er * 0.4, ey - er * 0.4, 0xfff0c0);
    }
  }
  if (!o.mouth) s.line(cx + Lx * 0.46, cy + Hy * 0.06, cx + Lx * 0.42, cy + Hy * 0.12, 0x5a2a08, 1);
  else {
    const [mx, my] = [cx + Lx * 0.44, cy + Hy * 0.08];
    const [rx, ry] = [Lx * 0.05, Hy * 0.12 * o.mouth];
    for (let y = Math.floor(my - ry - 2); y <= my + ry + 2; y++)
      for (let x = Math.floor(mx - rx - 2); x <= mx + rx + 2; x++) {
        const d = Math.hypot((x + 0.5 - mx) / rx, (y + 0.5 - my) / ry);
        if (d < 1) s.px(x, y, d > 0.75 ? 0x5a2408 : y > my ? 0x6a1a20 : 0x2a0a06); // (a tongue at the bottom)
        else if (d < 1.35) s.px(x, y, o.mat === 'o' ? 0xffe890 : 0xf8d898);
      }
  }
  // the seam: a pale crisp edge where the two halves of the iron met, a fleck of flour
  for (let x = Math.floor(cx - Lx * 0.5); x < cx + Lx * 0.5; x++)
    for (const sgn of [-1, 1]) {
      for (let y = cy; Math.abs(y - cy) < Hy; y += sgn) {
        if (!body(x + 0.5, y + sgn + 0.5)) {
          if (body(x + 0.5, y + 0.5) && !inBite(x + 0.5, y + 0.5) && hash(x, y, 31) < 0.7) s.px(x, y, mat === 'o' ? 0xfff0a0 : 0xf8d898);
          break;
        }
      }
    }
  return { eye: [ex, ey], mouth: [cx + Lx * 0.48, cy + Hy * 0.06], bites };
}

function inPolyT(pts, x, y) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

// ---------------------------------------------------------------- the little fish
export const FW = 75;
export const FH = 48;
const TAILS = [0.28, 0.08, -0.28, -0.08];
function smallFish(f, o = {}) {
  const s = new HiSprite(FW, FH, RAMPS);
  fish(s, FW / 2 + 4, FH / 2, { L: 56, H: 30, tail: TAILS[f], ...o });
  return s.render({ outline: 2 });
}

// ---------------------------------------------------------------- the great golden fish
export const BW = 228;
export const BH = 150;
function bigFish(kind, f, wings) {
  const s = new HiSprite(BW, BH, RAMPS);
  const base = { L: 150, H: 72, mat: 'o', wings: wings + 1 };
  if (kind === 'swim') fish(s, BW / 2 + 12, BH / 2, { ...base, tail: TAILS[f] * 0.9 });
  if (kind === 'charge') fish(s, BW / 2 + 10, BH / 2, { ...base, tail: 0.04, stretch: 1.14, mouth: 1, eye: 'wide' });
  if (kind === 'tired') fish(s, BW / 2 + 12, BH / 2 + 2, { ...base, tail: [0.12, -0.12][f % 2], mouth: 0.6, eye: 'swirl' });
  // a glint on the gold, moving along it frame by frame
  const gx = 60 + f * 26;
  for (let k = 0; k < 6; k++) s.px(gx + k, 54 - k * 0.4, 0xffffe0, 0.9);
  return s.render({ outline: 2 });
}

/** A half of the great fish, broken open: the crust outside, the bean paste and its steam inside. */
function half(side) {
  const s = new HiSprite(BW / 2 + 12, BH, RAMPS);
  const full = new HiSprite(BW, BH, RAMPS);
  fish(full, BW / 2 + 12, BH / 2, { L: 150, H: 72, mat: 'o', wings: 3 });
  // take the half (front for 1, back for -1), and draw the broken face along the cut
  const cut = BW / 2 + 12 + (side > 0 ? -2 : 2);
  for (let y = 0; y < BH; y++)
    for (let x = 0; x < s.w; x++) {
      const fx = side > 0 ? x + cut - 12 : x;
      const i = y * BW + fx;
      if (fx < 0 || fx >= BW || !full.mat[i]) continue;
      const jag = Math.sin(y * 0.7) * 3 + hash(y, 1, 5) * 3;
      if (side > 0 ? fx < cut + jag : fx > cut + jag) continue;
      const j = y * s.w + x;
      s.mat[j] = full.mat[i];
      s.v[j] = full.v[i];
      if (full.over.has(i)) s.over.set(j, full.over.get(i));
      const d = side > 0 ? fx - (cut + jag) : cut + jag - fx;
      if (d < 7 && full.mat[i] === 'o') {
        s.mat[j] = d < 2.5 ? 'p' : 'a';
        s.v[j] = 0.6 + (hash(x, y, 8) - 0.5) * 0.2;
        s.over.delete(j);
      }
    }
  return s.render({ outline: 2 });
}

// ---------------------------------------------------------------- the iron
// facing left (its handles go off to the right), the lid hinged along its far edge: shut, cracked, half, open
export const KW = 270;
export const KH = 138;
function mould(state, heat = false) {
  const s = new HiSprite(KW, KH, RAMPS);
  const [cx, cy] = [96, 88]; // the bottom half's middle
  const L = 132;
  const H = 62;
  const shape = (x, y, y0, hh, flip = false) => {
    const t = (cx - x) / L + 0.5; // facing left: 1 at the nose (left)
    if (t < 0.02 && t >= -0.2) {
      // the tail: a fan with a notch in it
      const k = (0.02 - t) / 0.22;
      const w = (hh / 2) * (0.3 + 0.62 * k) + 5;
      return Math.abs(y - y0) <= w && !(k > 0.7 && Math.abs(y - y0) < (k - 0.7) * hh * 0.6);
    }
    if (t < 0.02 || t > 1) return false;
    const head = t > 0.74 ? Math.sqrt(Math.max(0, 1 - ((t - 0.74) / 0.26) ** 2)) : 1;
    const half = (hh / 2) * (0.5 + 0.5 * Math.sin(Math.min(1, (t - 0.02) / 0.6) * Math.PI * 0.5)) * head + 5;
    return Math.abs(y - y0) <= half;
  };
  const lidK = { shut: 1, crack: 0.86, half: 0.18, open: -0.62 }[state];
  const glow = heat ? 1 : 0;
  const put = (test, mat, light) => {
    if (heat) {
      // (the glow: the same shapes, lit red; the game lays it over the iron, stronger as it heats)
      for (let y = 0; y < KH; y++)
        for (let x = 0; x < KW; x++) {
          if (!test(x + 0.5, y + 0.5)) continue;
          const d = Math.min(1, Math.hypot((x - cx) / 80, (y - cy) / 40)); // (hottest in the middle, over the fire)
          if (mat === 'i') s.px(x, y, d < 0.45 ? 0xff7a20 : 0xe03a10, 0.2 + 0.55 * (1 - d) + (hash(x >> 1, y >> 1, 5) - 0.5) * 0.12);
        }
      return;
    }
    s.paint([0, 0, KW - 1, KH - 1], test, mat, light, { pat: speckle({ amt: 0.16, dark: 0.1, light: 0.06, seed: 51 }) });
  };
  const ironLight = (x, y) => 0.42 + 0.25 * Math.max(0, 1 - Math.hypot((x - cx + 30) / 90, (y - cy + 20) / 50));
  // the handles: two iron rods from the tail out to the right, wooden grips, a ring joining them
  for (const [dy, lift] of [[6, 0], [-6, lidK]]) {
    const y0 = cy + dy - (dy < 0 ? (1 - Math.min(1, Math.max(0, lidK))) * 18 : 0);
    put((x, y) => x > cx + 70 && x < KW - 30 && Math.abs(y - y0 - (x - cx - 50) * 0.04) < 2.6, 'i', () => 0.5);
    put((x, y) => x >= KW - 32 && x < KW - 4 && Math.abs(y - y0 - (x - cx - 50) * 0.04) < 4.2, 'w', (x, y) => 0.5 + (y < y0 ? 0.15 : -0.05));
    void lift;
  }
  // the bottom half: an iron dish in the shape of a fish, its rim
  const base = (x, y) => shape(x, y, cy, H);
  put(base, 'i', ironLight);
  if (!heat) {
    // inside, when it is open: the hollow of a fish, and a fish of batter baking in it
    if (lidK < 0.9) {
      const inner = (x, y) => shape(x, y, cy, H - 14);
      s.paint([0, 0, KW, KH], inner, 'i', (x, y) => 0.26 + 0.1 * Math.max(0, (y - cy) / 30));
      if (lidK < 0.5) {
        const f = new HiSprite(KW, KH, RAMPS);
        fish(f, cx, cy + 1, { L: L - 26, H: H - 22, tail: 0 });
        // (mirrored: it faces left as the iron does)
        for (let y = 0; y < KH; y++)
          for (let x = 0; x < KW; x++) {
            const sx = 2 * cx - x;
            if (sx < 0 || sx >= KW) continue;
            const i = y * KW + sx;
            if (!f.mat[i] || !inner(x + 0.5, y + 0.5)) continue;
            const j = y * KW + x;
            s.mat[j] = f.mat[i];
            s.v[j] = f.v[i] - 0.05;
            s.glow[j] = 0;
            if (f.over.has(i)) s.over.set(j, f.over.get(i));
            else s.over.delete(j);
          }
      }
    }
    // the rim's ridge, the hinge's knuckles at the back, bolts
    for (let x = 0; x < KW; x++) for (let y = 0; y < KH; y++) if (base(x + 0.5, y + 0.5) && !shape(x + 0.5, y + 0.5, cy, H - 4)) s.shade([x, y, x, y], () => true, y < cy ? 0.14 : -0.1);
  }
  // the lid: over the base when shut; tipped back, its outside foreshortened; open, its inside towards us
  if (lidK > 0) {
    const ly = cy - (1 - lidK) * 30;
    const lh = H * lidK;
    const lid = (x, y) => shape(x, (y - ly) / Math.max(0.15, lidK) + ly, ly, H);
    put(lid, 'i', (x, y) => ironLight(x, y) + 0.05);
    if (!heat) {
      // its outside: the fish in relief - scales, a fin, the eye's boss
      for (let y = 0; y < KH; y++)
        for (let x = 0; x < KW; x++) {
          if (!lid(x + 0.5, y + 0.5)) continue;
          const yy = (y - ly) / Math.max(0.15, lidK);
          if (!shape(x + 0.5, yy + ly, ly, H - 12)) continue;
          const sc = 8;
          const row = Math.floor(yy / (sc * 0.8));
          const fx = ((x + (row % 2 ? sc / 2 : 0)) / sc) % 1;
          const fy = yy / (sc * 0.8) - row;
          if (x > cx - 40 && Math.abs(Math.hypot(fx - 0.5, fy - 0.9) - 0.55) < 0.1) s.shade([x, y, x, y], () => true, 0.16);
        }
      s.dot(cx - L * 0.36, ly - lh * 0.1, 4 * Math.max(0.4, lidK), 0x3a3a44);
      s.dot(cx - L * 0.36 - 1, ly - lh * 0.1 - 1, 1.4, 0x8a8a96);
      // the crack of light and steam along the seam
      if (state === 'crack') for (let x = cx - L * 0.45; x < cx + L * 0.45; x += 0.5) {
        const y = cy - H * 0.5 * 0.86 + 6;
        if (base(x, y + 6)) s.px(x, ly + lh / 2 + 1, 0xffd080);
      }
    }
    for (const k of [-1, 1]) s.dot(cx + 66, cy + k * 6 - (1 - lidK) * 8, 3.5, 0x4a4a54); // the hinge
  } else if (lidK < 0) {
    // open: the lid's inside above the base, a hollow fish facing the other way, batter stuck in it
    const lh = H * -lidK;
    const ly = cy - H * 0.5 - lh * 0.5 - 4;
    const lid = (x, y) => shape(x, (y - ly) / -lidK + ly, ly, H);
    put(lid, 'i', (x, y) => 0.32 + 0.12 * Math.max(0, (ly - y) / 20));
    if (!heat) {
      for (let y = 0; y < KH; y++)
        for (let x = 0; x < KW; x++) {
          if (!lid(x + 0.5, y + 0.5)) continue;
          const yy = (y - ly) / -lidK + ly;
          if (shape(x + 0.5, yy, ly, H - 14)) s.shade([x, y, x, y], () => true, -0.12);
          if (shape(x + 0.5, yy, ly, H - 14) && hash(x >> 1, y >> 1, 61) < 0.012) s.px(x, y, 0xc8781e); // batter left in it
        }
      for (const k of [-1, 1]) s.dot(cx + 66, cy - H * 0.5 + k * 4, 3.5, 0x4a4a54);
    }
  }
  if (heat) return s.render({ outline: 0, rim: 0, grain: 0 });
  // grease and soot: drips on the underside, a sheen along the top
  for (let k = 0; k < 18; k++) {
    const x = cx - L * 0.4 + hash(k, 1, 71) * L * 0.8;
    const y = cy + H * 0.36 + hash(k, 2, 71) * 6;
    if (base(x, y)) s.px(x, y, 0x5a4a30, 0.8);
  }
  return s.render({ outline: 2 });
}

// ---------------------------------------------------------------- bullets, drawn pointing down the screen
function bean() {
  const s = new HiSprite(12, 15, RAMPS);
  s.ellipse(6, 7.5, 4, 5.4, 'a', { bias: 0.15 });
  s.line(6, 4, 6, 8, 0xf0e0d0, 1); // its white keel
  return s.render({ outline: 2 });
}
function anko() {
  const s = new HiSprite(21, 21, RAMPS);
  s.ellipse(10.5, 10.5, 7.5, 7.5, 'a', { bias: 0.12 });
  for (let k = 0; k < 7; k++) s.dot(10.5 + Math.cos(k) * 4, 10.5 + Math.sin(k * 1.7) * 4, 1.1, 0x8a3a48);
  s.dot(8, 7.5, 1.6, 0xffd0d8);
  return s.render({ outline: 2 });
}
function cream(f) {
  const s = new HiSprite(21, 21, RAMPS);
  const wob = [0, 0.8][f];
  s.paint([0, 0, 20, 20], (x, y) => Math.hypot((x - 10.5) / (7.4 + wob), (y - 10.5) / (7.4 - wob)) < 1, 'k', () => 0.7, { glow: true });
  s.dot(8, 7.5, 2, 0xffffff);
  s.dot(12, 13, 1, 0xfff4c0);
  return s.render({ outline: 2 });
}
function matcha() {
  const s = new HiSprite(15, 21, RAMPS);
  s.paint([0, 0, 14, 20], (x, y) => {
    const t = (y - 2) / 17;
    return t >= 0 && t <= 1 && Math.abs(x - 7.5) < Math.sin(t * Math.PI) * 5.6;
  }, 'm', (x, y) => 0.55 + (x < 7.5 ? 0.12 : -0.05), {});
  s.line(7.5, 3, 7.5, 18, 0xc8f090, 1);
  return s.render({ outline: 2 });
}
function crumb(f) {
  const s = new HiSprite(12, 12, RAMPS);
  const pts = Array.from({ length: 6 }, (_, k) => {
    const a = (k / 6) * TAU + f;
    const r = 3.4 + hash(k, f, 81) * 2;
    return [6 + Math.cos(a) * r, 6 + Math.sin(a) * r];
  });
  s.poly(pts, f % 2 ? 'o' : 'g', { flat: 0.62 });
  s.px(5, 4, 0xfff0c0);
  return s.render({ outline: 2 });
}
function shadow() {
  const r = new Raster(84, 24);
  for (let y = 0; y < r.h; y++)
    for (let x = 0; x < r.w; x++) {
      const d = Math.hypot((x + 0.5 - 42) / 42, (y + 0.5 - 12) / 12);
      if (d < 1) r.set(x, y, 0x0a0816, 0.4 * Math.min(1, (1 - d) * 3));
    }
  return r;
}

export function taiyakiEnemies(add) {
  for (const st of ['shut', 'crack', 'half', 'open']) {
    add(`ty_kata_${st}`, mould(st));
    add(`ty_heat_${st}`, mould(st, true));
  }
  for (let f = 0; f < 4; f++) {
    add(`ty_fish_${f}`, smallFish(f));
    for (const fl of ['a', 'k', 'm']) for (let b = 1; b <= 3; b++) add(`ty_fish_${fl}${b}_${f}`, smallFish(f, { bite: b, fill: fl }));
  }
  for (let w = 0; w < 3; w++) {
    for (let f = 0; f < 4; f++) add(`ty_big_${w}_${f}`, bigFish('swim', f, w));
    add(`ty_charge_${w}`, bigFish('charge', 0, w));
    for (let f = 0; f < 2; f++) add(`ty_tired_${w}_${f}`, bigFish('tired', f, w));
  }
  add('ty_half_l', half(-1));
  add('ty_half_r', half(1));
  add('ty_bean', bean());
  add('ty_anko', anko());
  add('ty_cream_0', cream(0));
  add('ty_cream_1', cream(1));
  add('ty_matcha', matcha());
  add('ty_crumb_0', crumb(0));
  add('ty_crumb_1', crumb(1));
  add('ty_shadow', shadow());
}
