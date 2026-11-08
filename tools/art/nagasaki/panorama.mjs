import { Raster, rng, mix, fbm, rgb } from '../../lib/raster.mjs';
import { polygon, glow } from './paint.mjs';
import { farShore, nearShore, hillRoad } from '../../../src/data/nagasakiView.js';

// The "ten-million-dollar night view" from Mount Inasa, hand-composed at 3x the game's resolution (648 x 1260, shown at
// 216 x 420). Looking east over the harbour: left the station's towers and Urakami, then Mt Kompira with its masts, the
// downtown neon, Dejima's wharf; right Oura Cathedral, Glover Hill, the cruise liner and Megami Ōhashi at the harbour
// mouth. In front the Mitsubishi shipyard with its hammerhead crane, the near slope's houses, the road, the summit's
// own terrace and trees. Lighting, materials, haze and broken reflections are baked offline; the game composites seven
// layers and a few moving things.
const S = 3;

export function buildPanorama() {
  const W = 216 * S;
  const H = 420 * S;
  const random = rng(333081);
  const sky = new Raster(W, H);
  const city = new Raster(W, H);
  const near = new Raster(W, H);
  const lights = Array.from({ length: 4 }, () => new Raster(W, H));
  const warm = [0xffdb9a, 0xf6b966, 0xffedbd, 0xe9a35b, 0xffc880];
  const cool = [0xa5d6ec, 0xd4e9ef, 0x81b8cf];
  const neon = [0xff5a6a, 0xff8ab0, 0x6ae0ff, 0xffe068, 0xb898ff, 0x7aff9a];
  // the geography in fine pixels
  const fS = (X) => farShore(X / S) * S;
  const nS = (X) => nearShore(X / S) * S;
  const hR = (X) => hillRoad(X / S) * S;
  const ridge = (X) => (105 + 7 * Math.sin((X / S) * 0.039) + 5 * Math.sin((X / S) * 0.099) + 1.2 * Math.sin((X / S) * 0.37)) * S;
  const treeLine = (X) => (391 - (X / S) * 0.22 + Math.sin((X / S) * 0.046) * 13) * S;
  const woodedHill = (X, Y) => {
    const x = X / S;
    const y = Y / S;
    return y < 176 - 0.035 * (x - 162) ** 2 || (x > 186 && y < 151 - 0.02 * (x - 216) ** 2);
  };
  const line = (r, x0, y0, x1, y1, c, a = 1) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) r.set(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), c, a);
  };
  const light = (x, y, c, group = random.int(0, 3), bright = 1) => {
    city.set(x, y, mix(c, 0x233b53, 0.18));
    lights[group].set(x, y, c, bright);
  };

  // ---- the sky: deep indigo overhead, the last of the dusk along the horizon, the Milky Way, stars, moon and thin cloud
  const MOON = [132 * S, 58 * S];
  for (let y = 0; y < H; y++) {
    const t = Math.min(1, y / (118 * S));
    let c0 = t < 0.55 ? mix(0x050f28, 0x12284a, t / 0.55) : t < 0.86 ? mix(0x12284a, 0x3a4a72, (t - 0.55) / 0.31) : mix(0x3a4a72, 0x9a6a78, (t - 0.86) / 0.14);
    for (let x = 0; x < W; x++) {
      let c = c0;
      // the Milky Way, a faint band across the upper sky
      const band = Math.exp(-(((y - (46 * S - (x - W / 2) * 0.16)) / (20 * S)) ** 2));
      if (band > 0.05) c = mix(c, 0x6a7a9a, band * 0.22 * fbm(x / S, y / S, { seed: 4, scale: 14, octaves: 3 }));
      const cloud = fbm(x / (2 * S), (y / S) * 3, { seed: 9, scale: 40, octaves: 3 });
      if (cloud > 0.55) {
        const md = Math.hypot(x - MOON[0], y - MOON[1]) / (120 * S);
        c = mix(c, mix(0x8aa0b8, 0x4a5a78, Math.min(1, md)), (cloud - 0.55) * 1.1);
      }
      sky.set(x, y, c);
    }
  }
  // the stars, faint and bright, some coloured, thinning towards the horizon and the moon
  for (let i = 0; i < 1400; i++) {
    const x = random.int(1, W - 2);
    const y = Math.floor(random() ** 1.6 * 92 * S);
    if (Math.hypot(x - MOON[0], y - MOON[1]) < 60) continue;
    const a = random.range(0.2, 0.75);
    sky.set(x, y, random.pick([0xc8d8f0, 0xffffff, 0xe8d8c8, 0xb8c8f0]), a);
  }
  for (let i = 0; i < 40; i++) {
    const x = random.int(4, W - 5);
    const y = random.int(6, 74 * S);
    if (Math.hypot(x - MOON[0], y - MOON[1]) < 80) continue;
    sky.set(x, y, 0xffffff);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) sky.set(x + dx, y + dy, 0xc8d8f0, 0.5);
  }
  // the moon, nearly full, its seas, its halo
  glow(sky, MOON[0], MOON[1], 150, 0xa8c0d8, 0.16);
  glow(sky, MOON[0], MOON[1], 66, 0xd8e4f0, 0.3);
  for (let j = -21; j <= 21; j++)
    for (let i = -21; i <= 21; i++) {
      const d = Math.hypot(i, j);
      if (d > 20.5) continue;
      const n = fbm((MOON[0] + i) * 0.5, (MOON[1] + j) * 0.5, { seed: 44, scale: 6, octaves: 3 });
      const limb = Math.max(0, (d / 20.5 - 0.7) * (i + j > 0 ? 1 : 0.4));
      sky.set(MOON[0] + i, MOON[1] + j, mix(n > 0.56 ? 0xc4ced4 : 0xf8f6e8, 0x9aa8b4, limb));
    }
  // the far ridges, layered in the haze, a mast's lights on one of them
  for (let n = 0; n < 4; n++)
    for (let x = 0; x < W; x++) {
      const y0 = (84 + n * 7 + 7 * Math.sin((x / S) * 0.024 + n * 2) + 3 * Math.sin((x / S) * 0.13 + n) + 0.8 * Math.sin((x / S) * 0.5 + n)) * S;
      const c = [0x3a4a6a, 0x2e4260, 0x243850, 0x1c3046][n];
      for (let y = Math.round(y0); y < H; y++) sky.set(x, y, c);
    }

  // ---- the ground of the view: hillside, harbour, near slope
  for (let x = 0; x < W; x++)
    for (let y = Math.floor(ridge(x)); y < H; y++) {
      const water = y > fS(x) && y < nS(x);
      if (water) {
        const n = fbm(x / S, (y / S) * 2.4, { seed: 31, scale: 16, octaves: 3 });
        let c = mix(0x06182c, 0x1c3c56, n * 0.7 + ((y - fS(x)) / (nS(x) - fS(x))) * 0.25);
        // long wind streaks on the water
        const st = fbm(x * 0.08, y * 0.7, { seed: 33, scale: 3, octaves: 2 });
        if (st > 0.66) c = mix(c, 0x4a6a82, 0.28);
        else if (st < 0.3) c = mix(c, 0x041020, 0.3);
        city.set(x, y, c);
      } else {
        const n = fbm(x / S, y / S, { seed: 31, scale: 24, octaves: 3 });
        let c = mix(0x10262e, 0x2a3e4c, n * 0.9);
        if (woodedHill(x, y) || y > nS(x) + 36) {
          const foliage = fbm(x * 0.5, y * 0.5, { seed: 718, scale: 5, octaves: 3 });
          c = mix(0x081e28, 0x24424a, Math.round(foliage * 5) / 5);
          if ((x + y) % 2 === 0 && foliage > 0.62) c = mix(c, 0x4a6a6a, 0.3);
        }
        city.set(x, y, c);
      }
    }
  // the city's own glow on its air
  for (const [x, y, rad] of [[32, 208, 45], [82, 189, 30], [135, 183, 22], [176, 158, 18], [58, 170, 26]]) glow(city, x * S, y * S, rad * S, 0xe4a36c, 0.2);

  /** A building on the hillside: a roof, its lit windows in rows; depth 0 (far) .. 1 (near). */
  const house = (x, y, w, h, depth = 0.5) => {
    const wall = mix(random.pick([0x1e2c3a, 0x243442, 0x28303e, 0x20323a, 0x2c2e3c]), 0x3a4656, depth * 0.3);
    city.rect(x + 2, y - h + 4, w + 2, h + 2, 0x081e30, 0.6);
    city.rect(x, y - h, w, h, wall);
    city.rect(x + w - 2, y - h + 1, 3, h - 1, mix(wall, 0x091c2b, 0.4));
    city.rect(x, y - h, 1, h, mix(wall, 0xb8c0c8, 0.08));
    const roof = mix(random.pick([0x24344a, 0x2c3c50, 0x1e2c40, 0x243a44, 0x30344a]), 0x4a5a6a, 0.1 + depth * 0.2);
    if (w > 9 && random() < 0.6) polygon(city, [[x - 2, y - h], [x + w / 2, y - h - 5], [x + w + 2, y - h], [x + w, y - h + 2]], roof);
    else city.rect(x - 1, y - h - 1, w + 2, 2, roof);
    const stepX = depth > 0.5 ? 4 : 3;
    const stepY = depth > 0.5 ? 5 : 4;
    const pw = depth > 0.5 ? 2 : 1;
    for (let yy = y - h + 2; yy < y - 1; yy += stepY)
      for (let xx = x + 1; xx < x + w - 2; xx += stepX) {
        if (random() < 0.34) continue;
        const c = random() < 0.2 ? random.pick(cool) : random.pick(warm);
        const g = random.int(0, 3);
        const br = 0.5 + depth * 0.5;
        for (let i = 0; i < pw; i++) light(xx + i, yy, c, g, br);
        if (depth > 0.5 && random() < 0.5) for (let i = 0; i < pw; i++) light(xx + i, yy + 1, c, g, br * 0.8);
        if (depth > 0.6 && random() < 0.12) glow(city, xx, yy, 7, c, 0.14);
      }
    if (w > 15 && random() < 0.4) {
      city.rect(x + 3, y - h - 6, 5, 6, 0x60717a);
      city.rect(x + 3, y - h - 6, 5, 1, 0x9aabad);
    }
  };
  // irregular terraces and dark ravines: the houses climbing the hills in their thousands
  for (let y = 111 * S; y < 249 * S; y += random.int(4, 7))
    for (let x = -12; x < W; x += random.int(6, 15)) {
      const yy = y + random.int(-5, 5);
      if (yy < ridge(x) + 9 || yy > fS(x) - 15 || woodedHill(x, yy)) continue;
      const ravine = Math.abs(x / S - (74 + Math.sin((y / S) * 0.044) * 16)) < 5 || Math.abs(x / S - (152 + Math.sin((y / S) * 0.057) * 12)) < 4;
      if ((ravine && random() < 0.8) || random() < 0.12) continue;
      const depth = Math.max(0, (yy - 110 * S) / (130 * S));
      house(x, yy, random.int(5, 9 + Math.floor(depth * 16)), random.int(5, 9 + Math.floor(depth * 18)), depth);
    }
  // the streets following the contours, strings of sodium and white lamps, the odd temple's floodlit roof
  for (let n = 0; n < 11; n++) {
    let prev;
    for (let x = 0; x < W; x++) {
      const y = (118 + n * 10.5 - (x / S) * 0.065 + Math.sin((x / S) * 0.035 + n) * (6 + n)) * S;
      if (y < ridge(x) + 12 || y > fS(x) - 15 || woodedHill(x, y)) {
        prev = null;
        continue;
      }
      if (prev) city.set(x, y, 0x4a4c50, 0.5);
      if ((x + n * 7) % 7 === 0) light(x, Math.round(y), n % 3 === 2 ? 0xc8d8e0 : n > 5 ? 0xffcf89 : 0xe8c890, n % 4, 0.8);
      prev = [x, y];
    }
  }
  // Mt Kompira's masts on the ridge, red lights top and middle; its road of lamps
  for (const [mx, mh] of [[46 * S, 66], [54 * S, 48], [40 * S, 42]]) {
    const y = Math.round(ridge(mx)) + 6;
    for (let j = 0; j < mh; j++) {
      const hw = Math.max(1, 5 - (j / mh) * 4);
      city.set(mx - hw, y - j, 0x8a9aa8);
      city.set(mx + hw, y - j, 0x4a5a68);
      if (j % 6 === 0) line(city, mx - hw, y - j, mx + hw, y - j, 0x6a7a88);
    }
    for (const [yy, g] of [[y - mh, 0], [y - Math.round(mh * 0.55), 2]]) {
      for (const [i, j] of [[0, 0], [1, 0], [0, 1], [1, 1]]) light(mx + i, yy + j, 0xff5040, g);
      glow(city, mx, yy, 9, 0xff4030, 0.4);
    }
  }
  // along the far shore: towers and hotels, tallest at the station end; downtown's neon; Dejima's wharf; the waterfront
  for (let x = -12; x < 435; x += random.int(21, 42)) {
    const y = Math.floor(fS(x)) - 8;
    const lX = x / S;
    const tall = lX < 45 ? random.int(36, 66) : lX < 95 ? random.int(30, 48) : random.int(18, 36);
    house(x, y, random.int(18, 30), tall, 1);
    if (x % 3 === 0) {
      city.rect(x + 3, y - 27, 6, 21, 0x90bbc6);
      light(x + 3, y - 24, 0xb2e0e8, 2);
    }
  }
  // the station's twin hotel towers
  for (const [tx, tw, th] of [[14 * S, 30, 96], [25 * S, 24, 78]]) {
    const y = Math.floor(fS(tx)) - 8;
    city.rect(tx, y - th, tw, th, 0x2a3a4c);
    city.rect(tx + tw - 3, y - th, 3, th, 0x1a2a3c);
    for (let yy = y - th + 3; yy < y; yy += 4) for (let xx = tx + 2; xx < tx + tw - 3; xx += 3) if (random() < 0.72) light(xx, yy, random.pick(random() < 0.5 ? warm : cool), random.int(0, 3), 0.9);
    for (let i = 0; i < tw; i += 3) light(tx + i, y - th - 1, 0xff6a50, 1);
    glow(city, tx + tw / 2, y - th / 2, 30, 0xa8c8e0, 0.12);
    for (const i of [2, tw - 3]) light(tx + i, y - th - 3, 0xff4030, 0);
  }
  // downtown's neon: upright signs and bright strips, reds and pinks, their colour on the air
  for (let i = 0; i < 30; i++) {
    const x = Math.round((58 + random() * 36) * S);
    const y = Math.round(fS(x)) - random.int(12, 54);
    const c = random.pick(neon);
    const up = random() < 0.5;
    const g = random.int(0, 3);
    for (let q = 0; q < (up ? 7 : 5); q++) light(up ? x : x + q, up ? y + q : y, c, g);
    glow(city, x, y, 8, c, 0.18);
  }
  // Dejima's wharf: a warm string along the water, the shape of the fan's dark roofs behind it
  {
    const X0 = 100 * S;
    for (let i = 0; i < 90; i += 2) {
      const X = X0 + i;
      const y = Math.round(fS(X)) - 2;
      light(X, y, i % 8 === 0 ? 0xff9a5a : 0xffd890, i % 4, 1);
      if (i % 10 === 0) glow(city, X, y, 8, 0xffb060, 0.24);
    }
    for (let i = 0; i < 80; i += 12) {
      const X = X0 + i;
      const y = Math.round(fS(X)) - 8;
      polygon(city, [[X, y], [X + 6, y - 5], [X + 12, y], [X + 10, y + 3], [X + 2, y + 3]], 0x2a3a4a);
    }
  }
  // Oura Cathedral on its hill: white, floodlit, its spire and cross; a soft glow round it
  {
    const cx = 129 * S;
    const cy = Math.round(fS(cx)) - 39;
    glow(city, cx, cy - 12, 30, 0xd8e8f8, 0.24);
    city.rect(cx - 12, cy - 12, 24, 15, 0xc8d4dc);
    city.rect(cx + 9, cy - 12, 3, 15, 0x8a9aa4);
    polygon(city, [[cx - 12, cy - 12], [cx - 6, cy - 18], [cx, cy - 12]], 0xe8f0f4);
    polygon(city, [[cx, cy - 12], [cx + 6, cy - 18], [cx + 12, cy - 12]], 0xc8d4dc);
    city.rect(cx - 3, cy - 24, 6, 27, 0xf0f8fc);
    city.rect(cx + 2, cy - 24, 1, 27, 0xa8b8c0);
    polygon(city, [[cx - 3, cy - 24], [cx, cy - 36], [cx + 3, cy - 24]], 0x8ac0b8);
    for (let j = 0; j < 7; j++) light(cx, cy - 36 - j, 0xfff4c8, 0);
    for (let i = -2; i <= 2; i++) light(cx + i, cy - 40, 0xfff4c8, 0);
    for (const i of [-9, -5, 5, 9]) for (let j = 0; j < 5; j++) light(cx + i, cy - 8 + j, j % 2 ? 0xffa070 : 0x8ab8e8, 1);
    light(cx, cy - 14, 0xffd890, 1);
    light(cx, cy - 2, 0xffd890, 2);
    light(cx, cy - 1, 0xffd890, 2);
  }
  // the cruise liner at Matsugae on the far shore: a white cliff of lit decks, her reflection under her
  {
    const lx = 144 * S;
    const ly = Math.round(fS(lx)) + 6;
    const L = 96;
    const dy = (i) => Math.round(-i * 0.285);
    for (let i = 0; i < L; i++) {
      const top = 21 - (i > L - 18 ? (i - (L - 18)) * 0.9 : 0) - (i < 8 ? (8 - i) * 0.4 : 0);
      for (let j = 0; j < top; j++) city.set(lx + i, ly + dy(i) - j, j < 6 ? 0xe8ecf0 : j % 3 === 0 ? 0xc8ccd0 : 0x8a96a0);
      for (let j = 7; j < top - 1; j += 3) if ((i + j) % 2 === 0 && random() < 0.86) light(lx + i, ly + dy(i) - j, random.pick(warm), (i >> 3) % 4, 0.95);
      for (let q = 2; q < 30; q += 2) if (random() < 0.5 - q * 0.012) lights[(i >> 2) % 4].set(lx + i + random.int(-1, 1), ly + dy(i) + q, 0xffd898, 0.34 - q * 0.009);
    }
    city.rect(lx + 42, ly + dy(42) - 30, 12, 9, 0xc83a30);
    city.rect(lx + 42, ly + dy(42) - 30, 12, 3, 0x1a1a1e);
    glow(city, lx + 48, ly + dy(48) - 12, 42, 0xffd8a0, 0.14);
    for (const i of [6, 30, 66, 90]) light(lx + i, ly + dy(i) - 24, 0xffffff, 3);
  }
  // Tapered, fragmented warm and cool reflections reach into the water, thicker under the bright stretches
  for (let x = 0; x < W; x += 1) {
    const y = Math.round(fS(x));
    if (x % 3 === 0) {
      city.set(x, y, 0x394d5b);
      city.set(x, y + 1, 0x394d5b);
    }
    if (x % 4 !== 0) continue;
    const c = random.pick(x / S > 58 && x / S < 94 && random() < 0.4 ? neon : [...warm, ...cool]);
    light(x, y, c);
    glow(city, x, y, 9, c, 0.2);
    const length = random.int(24, 110);
    for (let q = 6; q < length && y + q < nS(x) - 9; q += random.int(1, 3)) {
      if (random() < 0.3) continue;
      const xx = x + Math.round(Math.sin(q * 0.3 + x) * (1 + q * 0.03));
      const a = (1 - q / length) ** 1.3 * 0.55;
      city.rect(xx, y + q, random.int(2, 6), 1, c, a);
      lights[Math.floor(x / 4) % 4].rect(xx, y + q, 3, 1, c, a * 0.6);
    }
  }
  // the moon's path on the water towards the harbour mouth
  for (let i = 0; i < 700; i++) {
    const y = fS(MOON[0]) + 9 + random() * (nS(MOON[0]) - fS(MOON[0]) - 12);
    const spread = 18 + (y - fS(MOON[0])) * 0.26;
    const x = Math.round(MOON[0] + (random() - 0.5) * spread * 2);
    if (y > fS(x) + 4 && y < nS(x) - 4) city.rect(x, Math.round(y), random.int(2, 7), 1, 0xd8e4f0, random.range(0.12, 0.42));
  }
  // squid boats far out at the mouth under their green-white lamps, each with its pool on the water
  for (const [x, y] of [[196, 214], [206, 204], [188, 226], [200, 228]]) {
    const X = x * S;
    const Y = y * S;
    glow(city, X, Y, 18, 0xb8ffd8, 0.24);
    city.rect(X - 6, Y, 13, 2, 0x18242c);
    for (let i = -5; i <= 5; i += 2) light(X + i, Y - 2, 0xf0fff0, i & 3);
    for (let q = 3; q < 18; q += 2) city.rect(X - 3 + (q % 3), Y + q, 6, 1, 0xc8ffe0, 0.3 - q * 0.015);
  }

  // ---- the near shore: the Mitsubishi shipyard. Hangars with sawtooth roofs, lit gantries, a ship fitting out at its
  // quay with deck lights, the 1909 hammerhead crane, the goliath's red-lit bridge; their lights in the water
  for (let x = -18; x < 456; ) {
    const y = Math.round(nS(x));
    const w = random.pick([30, 39, 48, 24]);
    const rows = w > 36 ? 3 : 2;
    const dy = (w * 18) / 51;
    polygon(city, [[x, y], [x + w, y - dy], [x + w + 9, y - dy + 12 * rows], [x + 9, y + 12 * rows]], 0x263642);
    line(city, x, y, x + w, y - dy, 0x8a9aa4);
    for (let q = 0; q < rows; q++) {
      polygon(city, [[x + 3, y + q * 12], [x + w, y - dy + 3 + q * 12], [x + w + 6, y - dy + 9 + q * 12], [x + 8, y + 6 + q * 12]], q % 2 ? 0x34485a : 0x2a3e50);
      line(city, x + 6, y + 3 + q * 12, x + w, y - dy + 6 + q * 12, 0x6a7a86);
      for (let i = 8; i < w; i += 6) if (random() < 0.5) light(x + i, Math.round(y + 7 + q * 12 - (i * dy) / w), 0xf2cb86, 1, 0.8);
    }
    // a gantry beside it, its lit jib, its light on the yard
    if (random() < 0.5) {
      const gx = x + w + 12;
      const gy = Math.round(nS(gx)) + 6;
      for (const s of [-6, 6]) line(city, gx + s, gy, gx + s * 0.4, gy - 33, 0x5a7a8e);
      for (let j = 3; j < 33; j += 6) line(city, gx - 6 + j * 0.1, gy - j, gx + 6 - j * 0.1, gy - j - 6, 0x4a6478);
      line(city, gx - 15, gy - 33, gx + 24, gy - 36, 0x8aa4b4);
      light(gx + 24, gy - 37, 0xff6a50, 2);
      glow(city, gx, gy - 6, 21, 0xf2cb86, 0.2);
      for (let i = -6; i <= 6; i += 3) light(gx + i, gy - 33, 0xfff0c8, i & 3);
    }
    for (let q = 0; q < 60; q += 3) if (random() < 0.5) city.rect(x + 12 + random.int(-3, 3), y - dy - q, random.int(2, 5), 1, 0xf2cb86, 0.22 - q * 0.003);
    x += w + random.pick([21, 30, 42]);
  }
  // the ship at the fitting-out quay: long dark hull, deck lamps, a white superstructure, a string of work lights
  {
    const X0 = 30 * S;
    const nX = (i) => nS(X0 + i) - 24;
    for (let i = 0; i < 120; i++) {
      const y = Math.round(nX(i));
      for (let j = 0; j < 12; j++) city.set(X0 + i, y + j, j < 2 ? 0x8a9aa4 : j < 8 ? 0x2a3640 : 0x6a2a24);
      if (i % 5 === 0) light(X0 + i, y - 1, 0xffe8b8, i % 4);
      if (i % 3 === 0) city.rect(X0 + i, y + 12, 2, 1, 0xffe0a0, 0.3);
    }
    const y0 = Math.round(nX(12));
    city.rect(X0 + 6, y0 - 18, 18, 18, 0xd8dce0);
    for (let yy = y0 - 15; yy < y0 - 1; yy += 3) for (let i = 8; i < 22; i += 2) if (random() < 0.8) light(X0 + i, yy, random.pick(warm), i & 3);
    city.rect(X0 + 10, y0 - 25, 6, 7, 0xc83a30);
    glow(city, X0 + 60, nX(60), 33, 0xffe0a0, 0.14);
  }
  // the Giant Cantilever Crane: a dark lattice tower, its long hammerhead, floodlit, red lights at both ends
  {
    const cx = 62 * S;
    const yB = Math.round(nS(cx)) + 12;
    const yT = yB - 96;
    for (let j = 0; j < 96; j++) {
      const hw = 9 - (j / 96) * 4;
      city.set(cx - hw, yB - j, 0x7a9aae);
      city.set(cx + hw, yB - j, 0x4a6478);
      if (j % 9 === 0) {
        const h2 = 9 - ((j + 9) / 96) * 4;
        line(city, cx - hw, yB - j, cx + h2, yB - j - 9, 0x5a7a8e);
        line(city, cx + hw, yB - j, cx - h2, yB - j - 9, 0x4a6478);
      }
    }
    const a = cx - 36;
    const b = cx + 84;
    const slope = -0.06;
    for (let X = a; X < b; X++) {
      const y1 = yT + (X - cx) * slope;
      city.set(X, y1, 0x5a7a8e);
      city.set(X, y1 - 12, 0x9ab4c1);
      if ((X - a) % 8 === 0) {
        line(city, X, y1, X + 4, y1 - 12, 0x6d8b9d);
        line(city, X + 4, y1 - 12, X + 8, y1, 0x5a7a8e);
      }
    }
    city.rect(a, yT - 12 + (a - cx) * slope, 15, 12, 0x2a3640);
    city.rect(cx - 9, yT - 21, 18, 9, 0x3a4a58);
    for (let i = 0; i < 12; i += 3) light(cx - 6 + i, yT - 18, 0xffe0a0, 1);
    for (const [X, g] of [[a, 0], [b - 1, 2], [cx, 3]]) {
      const Yy = Math.round((X === cx ? yT - 22 : yT - 13 + (X - cx) * slope));
      for (const [i, j] of [[0, 0], [1, 0], [0, 1], [1, 1]]) light(X + i, Yy + j, 0xfb6b52, g);
      glow(city, X, Yy, 9, 0xff4030, 0.38);
    }
    glow(city, cx, yT, 42, 0x8ab0c8, 0.14);
  }
  // Megami Ōhashi, floodlit: both A-shaped pylons, the suspended deck, its fans of stays, its string of lamps
  {
    const deck = (x) => (228 - (x / S - 130) * 0.3) * S;
    for (let x = 129 * S; x < 211 * S; x++) {
      city.set(x, deck(x), 0xd8ecf2);
      city.set(x, deck(x) + 1, 0xa8c4d0);
      city.set(x, deck(x) + 4, 0x3b6279);
      if (x % 9 === 0) light(x, Math.round(deck(x)) - 1, 0xe8f4ff, x & 3, 0.95);
      if (x % 6 === 0) city.rect(x, deck(x) + 6 + random.int(0, 40), 3, 1, 0x8ac0e0, 0.18);
    }
    for (const x of [151 * S, 185 * S]) {
      const y = deck(x);
      const top = y - 84;
      glow(city, x, top + 42, 36, 0x7eafcf, 0.24);
      for (const s of [-1, 1]) {
        line(city, x + s * 9, y + 9, x + s * 1, top, s < 0 ? 0xf4fafc : 0xc8dee6);
        line(city, x + s * 8, y + 9, x + s * 1, top, 0xe5eff0);
      }
      line(city, x - 6, y - 27, x + 6, y - 27, 0xf2e7ce);
      for (const d of [-63, -56, -49, -42, -35, -28, -21, -14, 14, 21, 28, 35, 42, 49, 56, 63]) line(city, x, top + 6 + Math.abs(d) * 0.1, x + d, deck(x + d), 0x9abfd5, 0.8);
      for (const [i, j] of [[0, 0], [1, 0], [0, -1], [1, -1]]) light(x + i, top + j, 0xffc6ad, 0);
      glow(city, x, top, 8, 0xff8a70, 0.3);
    }
  }
  // the near slope: Inasa's own houses going down to the yard, larger now, their streets, gardens dark between
  for (let y = 269 * S; y < 377 * S; y += 9)
    for (let x = 12; x < W; x += random.int(15, 27)) {
      if (y < nS(x) + 57 || y > treeLine(x) - 9) continue;
      if (fbm(x / S, y / S, { seed: 735, scale: 12, octaves: 2 }) > 0.38) house(x, y, random.int(10, 20), random.int(8, 16), 0.8);
    }
  for (let x = 15; x < W - 15; x++) {
    const y = (338 - (x / S) * 0.23 + Math.sin((x / S) * 0.065) * 6) * S;
    city.set(x, y, 0x55646a);
    if (x % 18 === 0) {
      light(x, Math.round(y), 0xc8d9cf, 1, 0.85);
      glow(city, x, y, 10, 0x9cc6ca, 0.18);
    }
  }
  for (let x = 0; x < W; x++) {
    const y = hR(x);
    city.rect(x, y, 1, 7, 0x3d474e);
    city.set(x, y, 0x8b8170);
    city.set(x, y + 6, 0x6a6458);
    if (x % 15 === 0) {
      light(x, Math.round(y) - 3, 0xf5ad62, 3);
      light(x + 1, Math.round(y) - 3, 0xf5ad62, 3, 0.7);
      glow(city, x, y, 13, 0xffad57, 0.3);
    }
    if (x % 39 === 0) house(x, Math.round(y) - 9, 22, 20, 1);
  }

  // ---- the near layer: the summit's own trees, crown by crown, their edges lit by the city, and the terrace's corner with
  // its rail, a coin telescope and people at the rail looking out
  {
    for (let x = 0; x < W; x++) for (let y = Math.floor(treeLine(x)) + 16; y < H; y++) near.set(x, y, 0x061820);
    const crowns = [];
    for (let i = 0; i < 620; i++) {
      const x = random() * W;
      const y = treeLine(x) + random() * (H - treeLine(x) + 30) - 6;
      crowns.push([x, y, 14 + random() * 22]);
    }
    crowns.sort((a, b) => a[1] - b[1]);
    for (const [cx, cy, r] of crowns) {
      for (let j = -r; j <= r; j++)
        for (let i = -r; i <= r; i++) {
          const d = (i / r) ** 2 + (j / (r * 0.8)) ** 2;
          const n = fbm((cx + i) * 0.34, (cy + j) * 0.34, { seed: 128, scale: 3, octaves: 3 });
          if (d + (n - 0.5) * 0.9 > 1) continue;
          const lit = 0.46 - (j / r) * 0.5 + (i / r) * -0.08 + (n - 0.5) * 0.7;
          const c = [0x051418, 0x0a2024, 0x102c2e, 0x183a3a, 0x24484a][Math.max(0, Math.min(4, Math.floor(lit * 5)))];
          near.set(cx + i, cy + j, c);
        }
    }
    // the terrace's corner, low on the right: flags, the rail, three people and a telescope against the lights
    const tx = 168 * S;
    const ty = 366 * S;
    polygon(near, [[tx - 30, ty + 30], [tx, ty], [W + 4, ty - 39], [W + 4, H], [tx - 30, H]], 0x1a2c34);
    for (let i = 0; i < 300; i += 6) {
      const X = tx + i;
      const Y = ty - i * 0.2;
      line(near, X, Y + 3, X - 30, Y + 60, 0x233a44, 0.8);
    }
    for (let X = tx - 24; X < W; X++) {
      const Y = ty - 12 - (X - tx) * 0.2;
      near.set(X, Y, 0x8aa4b0);
      near.set(X, Y + 1, 0x2a3e4a);
      near.set(X, Y + 6, 0x4a6470, 0.9);
      if ((X - tx) % 21 < 2) for (let j = 0; j < 18; j++) near.set(X, Y + j, 0x2a3e4a);
      if ((X - tx) % 42 === 0) glow(near, X, Y + 21, 15, 0xffd8a0, 0.2);
    }
    const person = (X, Y, h, c) => {
      for (let j = 0; j < h; j++) {
        const hw = j < h * 0.2 ? 3 : j < h * 0.6 ? 5.5 - (j / h) * 2 : 3.6;
        for (let i = -hw; i <= hw; i++) near.set(X + i, Y - h + j + 7, i > hw - 1.5 ? c : 0x0a1418);
      }
      for (let j = -5; j <= 3; j++) for (let i = -3; i <= 3; i++) if (i * i + j * j <= 12) near.set(X + i, Y - h + j + 2, i > 1 ? c : 0x0a1418);
    };
    person(tx + 75, ty - 27, 42, 0x4a5a64);
    person(tx + 87, ty - 29, 36, 0x7a4a5a);
    person(tx + 123, ty - 36, 42, 0x3a5a7a);
    // a coin telescope on its post
    {
      const X = tx + 42;
      const Y = ty - 12;
      near.rect(X - 2, Y - 21, 5, 33, 0x2a3e4a);
      near.rect(X - 2, Y - 21, 1, 33, 0x6a8490);
      near.rect(X - 12, Y - 33, 21, 9, 0x3a5664);
      near.rect(X - 12, Y - 33, 21, 2, 0x8aa4b0);
      near.set(X - 12, Y - 29, 0xc8f0ff);
    }
  }

  // Do not let lights from a distant roof float through a nearer roof drawn over it.
  for (const mask of lights)
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        if (mask.alpha(x, y) < 130) continue;
        const sum = (c) => rgb(c).reduce((a, b) => a + b, 0);
        if (sum(city.get(x, y)) < sum(mask.get(x, y)) * 0.42) mask.clear(x, y);
      }
  return { sky, city, near, ...Object.fromEntries(lights.map((r, i) => [`lights${i}`, r])) };
}
