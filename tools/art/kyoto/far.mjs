// Far layer of stage 1 (Kyoto) at native 540px density (540 x 1152, seamless vertical loop):
// deep Yamashina/Fushimi valley far below the Inari mountain ridge — terraced rice paddies,
// meandering river with gravel bars, boulders and rustic footbridges, tiled hamlet roofs,
// and a dense layered canopy of Japanese cedar, broadleaf and wild mountain sakura.
import { Raster, fbm, rng, bayer, mix, scaleColor } from '../../lib/raster.mjs';
import { crownPixels, grade, rampColor, RAMPS } from '../nature.mjs';

export const S = 3;
export const FAR_W = 180 * S; // 540
export const FAR_H = 384 * S; // 1152

function drawCedarHD(img, cx, cy, r, rand, seed) {
  const ramp = RAMPS.cedar;
  const tiers = 3;
  // Drop shadow on canopy/ground below-right
  const shOffX = Math.round(r * 0.35) + 2;
  const shOffY = Math.round(r * 0.45) + 3;
  for (let y = -Math.ceil(r); y <= Math.ceil(r); y++)
    for (let x = -Math.ceil(r); x <= Math.ceil(r); x++) {
      if (x * x + y * y <= r * r * 0.85) img.tint(cx + x + shOffX, cy + y + shOffY, 0.58);
    }
  for (let t = 0; t < tiers; t++) {
    const tr = r * (1 - t * 0.26);
    const ty = cy - t * Math.round(r * 0.22);
    const spikes = 9 + ((seed + t * 3) % 5);
    const ph = ((seed * 0.7 + t * 1.9) % 6.28);
    const R = Math.ceil(tr * 1.2) + 1;
    for (let y = -R; y <= R; y++)
      for (let x = -R; x <= R; x++) {
        const ang = Math.atan2(y, x);
        const rad = tr * (0.76 + 0.24 * Math.cos(spikes * ang + ph) + 0.08 * Math.sin((spikes * 2) * ang));
        const d2 = (x * x + y * y) / (rad * rad);
        if (d2 > 1) continue;
        const ax = cx + x;
        const ay = ty + y;
        const n = fbm(ax, ay, { seed: seed & 511, scale: 3.5, octaves: 2 });
        const lit = (-x * 0.52 - y * 0.58) / (rad + 1) * 0.55 + 0.48 + t * 0.08 + (n - 0.5) * 0.42;
        img.set(ax, ay, rampColor(ramp, lit, ax, ay));
      }
  }
  img.set(cx - 1, cy - Math.round(r * 0.45), ramp[3]);
}

function drawCrownHD(img, kind, cx, cy, r, rand, seed) {
  if (kind === 'cedar') {
    drawCedarHD(img, cx, cy, r, rand, seed);
    return;
  }
  const px = crownPixels(kind, cx, cy, r, rand, seed & 1023);
  const sx = Math.round(2 + r * 0.28);
  const sy = Math.round(3 + r * 0.32);
  for (const p of px) img.tint(p.x + sx, p.y + sy, 0.56);
  for (const p of px) {
    // Add fine 1px leaf cluster micro-contrast at 540px
    const leaf = fbm(p.x * 1.4, p.y * 1.4, { seed: (seed + 17) & 511, scale: 2.2, octaves: 2 });
    const c = leaf > 0.72 ? scaleColor(p.c, 1.12) : leaf < 0.26 ? scaleColor(p.c, 0.88) : p.c;
    img.set(p.x, p.y, c);
  }
}

function drawHamletHouse(img, cx, cy, w, h, vertical, seed) {
  const rw = vertical ? h : w;
  const rh = vertical ? w : h;
  const x0 = Math.round(cx - rw / 2);
  const y0 = Math.round(cy - rh / 2);
  // Soft eave shadow
  for (let j = 0; j < rh + 3; j++)
    for (let i = 0; i < rw + 3; i++) img.tint(x0 + i + 2, y0 + j + 3, 0.52);

  const tiles = seed % 3 === 0 ? [0x35313a, 0x48434f, 0x5d5766, 0x767080] : [0x2a3340, 0x3b4656, 0x505e72, 0x6b7b92];
  const ridgeY = y0 + Math.round(rh * 0.42);
  const hip = Math.max(3, Math.round(Math.min(rw, rh) * 0.28));

  for (let y = y0; y < y0 + rh; y++) {
    const north = y <= ridgeY;
    const t = north ? (ridgeY - y) / Math.max(1, ridgeY - y0) : (y - ridgeY) / Math.max(1, y0 + rh - 1 - ridgeY);
    const ins = hip * (1 - t);
    for (let x = x0; x < x0 + rw; x++) {
      const lx = x - x0;
      const rx = x0 + rw - 1 - x;
      let c;
      if (lx < ins) c = tiles[3];
      else if (rx < ins) c = tiles[0];
      else c = north ? tiles[2] : tiles[1];
      // Individual tile rib lines every 2px
      const rib = lx < ins || rx < ins ? (y - y0) % 2 === 0 : (x - x0) % 2 === 0;
      if (rib) c = scaleColor(c, 0.88);
      if (y === y0 + rh - 1) c = tiles[0];
      if (y === y0) c = tiles[3];
      img.set(x, y, c);
    }
  }
  // Ridge beam (mune) with white lime mortar edge & end caps (onigawara)
  for (let x = x0 + hip; x < x0 + rw - hip; x++) {
    img.set(x, ridgeY - 1, 0x9aa4b6);
    img.set(x, ridgeY, tiles[0]);
  }
  img.set(x0 + hip, ridgeY - 1, 0xc2c8d4);
  img.set(x0 + rw - hip - 1, ridgeY - 1, 0x828c9e);
  // Timber south wall peek under eave
  for (let y = y0 + rh; y < y0 + rh + 3; y++)
    for (let x = x0 + 1; x < x0 + rw - 1; x++) {
      const post = (x - x0) % 5 === 0;
      img.set(x, y, y === y0 + rh ? 0x1c1512 : post ? 0x423022 : 0x8c7b65);
    }
}

export function buildFar() {
  const W = FAR_W;
  const H = FAR_H;
  const img = new Raster(W, H);
  img.wrapY = true;
  const rand = rng(1234);
  const TAU = Math.PI * 2;

  // Meandering river centre & width in 540px valley coordinates (matching logical path x3)
  const riverX = (y) => (118 + 26 * Math.sin((TAU * y) / H) + 9 * Math.sin((2 * TAU * y) / H + 1.3)) * S + 3.5 * Math.sin((5 * TAU * y) / H + 0.4);
  const riverW = (y) => (7 + 2 * Math.sin((3 * TAU * y) / H)) * S + 1.8 * Math.cos((4 * TAU * y) / H);
  // River curvature for placing point-bar shingle on inside bends
  const riverCurve = (y) => riverX(y - 12) + riverX(y + 12) - 2 * riverX(y);

  // 1. Forested valley floor & subtle slope relief
  const ground = [0x142218, 0x1c2e1f, 0x253924, 0x30472a, 0x3d5632];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const macro = fbm(x, y, { seed: 5, scale: 96, octaves: 4, periodY: H });
      const micro = fbm(x, y, { seed: 19, scale: 14, octaves: 2, periodY: H });
      const v = macro * 0.72 + micro * 0.28;
      img.set(x, y, rampColor(ground, v, x, y));
    }

  // 2. Terraced rice paddies (tanada) nestled in valley clearings near the river
  const paddyPatches = [
    { x: 46 * S, y: 82 * S, rx: 22 * S, ry: 26 * S },
    { x: 152 * S, y: 196 * S, rx: 20 * S, ry: 24 * S },
    { x: 52 * S, y: 298 * S, rx: 24 * S, ry: 22 * S },
  ];
  const paddyWater = [0x244248, 0x2e5258, 0x3b6668, 0x52827c];
  for (const p of paddyPatches) {
    for (let dy = -p.ry; dy <= p.ry; dy++)
      for (let dx = -p.rx; dx <= p.rx; dx++) {
        const x = p.x + dx;
        const y = p.y + dy;
        if (x < 0 || x >= W) continue;
        const wy = ((y % H) + H) % H;
        if (Math.abs(x - riverX(wy)) < riverW(wy) + 18) continue;
        const d = (dx / p.rx) ** 2 + (dy / p.ry) ** 2 + (fbm(x, wy, { seed: 61, scale: 28, periodY: H }) - 0.5) * 0.35;
        if (d > 1) continue;
        // Curved contour terrace steps
        const elev = dy * 0.22 + dx * 0.08 + fbm(x, wy, { seed: 63, scale: 48, periodY: H }) * 18;
        const step = ((elev % 9) + 9) % 9;
        if (step < 1.3) {
          // Earthen grass bund (aze) + shadow below it
          img.set(x, y, step < 0.65 ? 0x4b5c34 : 0x22301c);
        } else {
          // Flooded paddy with tiny green rice shoots in rows
          const wc = rampColor(paddyWater, 0.25 + (1 - d) * 0.45, x, wy);
          const shoot = x % 3 === 0 && (wy % 3 === 0) && d < 0.85;
          img.set(x, y, shoot ? mix(wc, 0x5c8c42, 0.55) : wc);
        }
      }
  }

  // 3. Valley river with shingle point-bars, deep channel, submerged rocks & riffles
  const shingle = [0x4c483e, 0x625c4e, 0x78705e, 0x8e8571];
  for (let y = 0; y < H; y++) {
    const cx = riverX(y);
    const w = riverW(y);
    const curve = riverCurve(y);
    const barL = Math.max(0, curve * 1.4) + 5 + fbm(cx - w, y, { seed: 3, scale: 16, periodY: H }) * 6;
    const barR = Math.max(0, -curve * 1.4) + 5 + fbm(cx + w, y, { seed: 4, scale: 16, periodY: H }) * 6;
    for (let x = Math.floor(cx - w - barL - 4); x <= Math.ceil(cx + w + barR + 4); x++) {
      if (x < 0 || x >= W) continue;
      const off = x + 0.5 - cx;
      const d = Math.abs(off);
      const bankW = off < 0 ? barL : barR;
      if (d <= w) {
        const depth = 1 - d / w;
        const flowN = fbm(x * 0.55, y * 1.5, { seed: 9, scale: 18, octaves: 3, periodY: H });
        const ripN = fbm(x * 0.9, y * 2.4, { seed: 14, scale: 8, octaves: 2, periodY: H * 2 });
        let c;
        if (depth < 0.16) c = mix(0x365f60, shingle[1], 0.42);
        else if (depth < 0.36) c = 0x265258;
        else c = mix(0x1b4250, 0x153543, Math.min(1, (depth - 0.36) * 1.3 + (0.5 - flowN) * 0.3));
        if (ripN > 0.69 && bayer(x, y) > 0.45) c = depth < 0.3 ? 0x6ea6ac : 0x4e8892;
        if (ripN > 0.80 && (x + y) % 3 === 0) c = 0x8ec2c6;
        img.set(x, y, c);
      } else if (d <= w + bankW) {
        const bt = (d - w) / Math.max(1, bankW);
        const gn = fbm(x, y, { seed: 11, scale: 6, octaves: 2, periodY: H });
        if (bt > 0.78 && gn < 0.45) img.set(x, y, mix(shingle[0], 0x304528, 0.5));
        else img.set(x, y, rampColor(shingle, (1 - bt * 0.55) * 0.65 + (gn - 0.5) * 0.35, x, y));
      }
    }
  }

  // River boulders & whitewater wakes
  const rockRng = rng(4411);
  for (let i = 0; i < 42; i++) {
    const y = Math.floor(rockRng() * H);
    const w = riverW(y);
    const x = Math.round(riverX(y) + (rockRng() - 0.5) * w * 1.4);
    const rr = 1.4 + rockRng() * 1.8;
    // Whitewater V-riffle downstream (higher y)
    for (let k = 1; k <= 6; k++) {
      const sp = k * 0.45;
      img.set(x - sp, y + k, 0x8cc2c6, 0.45 * (1 - k / 7));
      img.set(x + sp, y + k, 0x8cc2c6, 0.45 * (1 - k / 7));
    }
    img.disc(x + 1, y + 1, rr, 0x122832, 0.7);
    img.disc(x, y, rr, 0x52565e);
    img.disc(x - rr * 0.3, y - rr * 0.3, rr * 0.55, 0x848892);
  }

  // 4. Valley hamlets, country dirt lanes & a wooden footbridge across the river
  const clearZones = [];
  for (let i = 0; i < 4; i++) {
    const y = Math.floor((i + rand() * 0.55) * (H / 4));
    const side = i % 2 ? -1 : 1;
    const baseRx = riverX(y);
    const baseRw = riverW(y);
    const hx = Math.round(baseRx + side * (baseRw + (9 + rand() * 5) * S));

    // Dirt lane from river bank to hamlet cluster
    for (let t = 0; t <= 1; t += 0.03) {
      const lx = Math.round(baseRx + side * baseRw + (hx - (baseRx + side * baseRw)) * t);
      const ly = Math.round(y + Math.sin(t * 3.1) * 6);
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++) img.set(lx + dx, ly + dy, Math.abs(dy) === 2 ? 0x464034 : 0x6b604e);
    }

    // Small rustic wooden footbridge at two of the hamlets
    if (i % 2 === 0) {
      const by = y + 4;
      const bx0 = Math.round(riverX(by) - riverW(by) - 6);
      const bx1 = Math.round(riverX(by) + riverW(by) + 6);
      for (let bx = bx0; bx <= bx1; bx++) {
        img.tint(bx + 2, by + 5, 0.55);
        img.tint(bx + 2, by + 6, 0.65);
        img.set(bx, by - 2, 0x3d2c1e);
        img.set(bx, by - 1, bx % 3 === 0 ? 0x7c6244 : 0x967856);
        img.set(bx, by, bx % 3 === 0 ? 0x745a3e : 0x8c6e4c);
        img.set(bx, by + 1, bx % 3 === 0 ? 0x6c5238 : 0x826646);
        img.set(bx, by + 2, 0x2c1e14);
      }
    }

    // 4-5 houses + tiny fenced garden plots per hamlet
    const count = 4 + (i % 2);
    for (let k = 0; k < count; k++) {
      const rx = hx + (k - 1.5) * 18 * side + Math.round((rand() - 0.5) * 10);
      const ry = y + (k - 1) * 15 + Math.round((rand() - 0.5) * 6);
      if (rx < 18 || rx > W - 18) continue;
      clearZones.push({ x: rx, y: ((ry % H) + H) % H, r: 16 });
      // Courtyard gravel patch & stone wall hint
      for (let py = -8; py <= 10; py++)
        for (let px = -11; px <= 11; px++) {
          if (Math.abs(px) === 11 || py === 10) img.set(rx + px, ry + py, 0x4e4c50, 0.7);
          else img.set(rx + px, ry + py, (px + py) % 2 ? 0x5c5548 : 0x686052, 0.85);
        }
      const w = 16 + Math.floor(rand() * 7);
      const h = 10 + Math.floor(rand() * 4);
      drawHamletHouse(img, rx, ry, w, h, rand() < 0.3, i * 31 + k * 7);
    }
  }

  // 5. Dense multi-layered valley forest canopy (avoiding river, paddies & hamlet roofs)
  const inPaddy = (x, y) =>
    paddyPatches.some((p) => {
      const dy = Math.min(Math.abs(y - p.y), H - Math.abs(y - p.y));
      return ((x - p.x) / (p.rx + 8)) ** 2 + (dy / (p.ry + 8)) ** 2 < 0.92;
    });
  const inHamlet = (x, y) =>
    clearZones.some((c) => {
      const dy = Math.min(Math.abs(y - c.y), H - Math.abs(y - c.y));
      return Math.hypot(x - c.x, dy) < c.r;
    });

  const trees = [];
  const step = 13;
  for (let gy = 0; gy < H; gy += step)
    for (let gx = -10; gx < W + 10; gx += step) {
      const x = gx + rand() * step;
      const y = (gy + rand() * step) % H;
      const d = Math.abs(x - riverX(y));
      if (d < riverW(y) + 11) continue;
      if (inPaddy(x, y) || inHamlet(x, y)) continue;
      const density = fbm(x, y, { seed: 77, scale: 180, octaves: 2, periodY: H });
      if (rand() > 0.42 + density * 0.58) continue;
      const roll = rand();
      const kind = roll < 0.13 ? 'sakura' : roll < 0.48 ? 'cedar' : roll < 0.78 ? 'broadleaf' : 'tiny';
      const r = kind === 'cedar' ? 6.5 + rand() * 4.2 : kind === 'sakura' ? 7.5 + rand() * 4.8 : 7.0 + rand() * 5.0;
      trees.push({ x, y, kind, r, seed: Math.floor(rand() * 1e6) });
    }
  trees.sort((a, b) => a.y - b.y);
  // Draw across wrap boundary seamlessly (img.wrapY = true handles top/bottom overflow automatically!)
  for (const t of trees) {
    drawCrownHD(img, t.kind, Math.round(t.x), Math.round(t.y), t.r, rng(t.seed), t.seed);
  }

  // 6. Atmospheric depth: cool mountain valley haze so the ridge above pops cleanly
  grade(img, { sat: 0.56, bright: 0.62, tint: 0x1a2440, tintAmt: 0.22 });
  return img;
}
