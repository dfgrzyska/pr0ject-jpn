// The Valley of Gangala and the caverns of Gyokusendō (Nanjō, the island's south). Gangala is a cave whose roof fell in long ago:
// a gorge of subtropical forest between limestone walls, tree ferns and banyans, the Cave Café in a hollow of the rock at its foot,
// the old prayer caves in its walls, the great banyan Ufushu Gajumaru letting its roots down the cliff. At its head the path goes
// down into Gyokusendō: halls of stalagmites lit in gold, green, blue and violet, an underground river glowing blue over its
// sandbars, a waterfall, a forest of spears, rimstone pools, steel walkways with their lamps, and the stairs back up to the day.
import { S, hashPx, scaleColor, rampColor, rng, fbm, mix } from '../nagasaki/canvas.mjs';
import { puff } from '../props.mjs';
import { W, L, GANGALA, CAVE, smooth } from './geo.mjs';
import { C } from './common.mjs';

const [G0, G1] = GANGALA;
const [C0, C1] = CAVE;
const FACE = 12; // the valley walls: from the rim to the foot

// the valley's floor between the feet of its walls: it swings right and narrows into the cave mouth at its head
const valleyL = (u) => 32 + (fbm(0, u, { seed: 301, scale: 30, octaves: 2 }) - 0.5) * 12 + 52 * smooth(2040, 2090, u);
const valleyR = (u) => 148 + (fbm(9, u, { seed: 302, scale: 30, octaves: 2 }) - 0.5) * 12 - 12 * smooth(2040, 2090, u);
const faceW = (u) => FACE * smooth(1766, 1784, u);
// the boardwalk up the valley, from the village lane to the stairs down into the cave
const pathX = (u) => {
  const v = 90 + 18 * Math.sin((u - 1772) / 50 + 0.9);
  return v + (104 - v) * smooth(2074, 2092, u);
};
// in the cave: the steel walkway, and the river (from its spring to where it sinks away)
const caveTh = (u) => (u - C0) / 75 + 0.486;
export const walkX = (u) => 90 + 30 * Math.sin(caveTh(u));
const RIVER = [2135, 2508];
const riverX = (u) => 90 - 30 * Math.sin(caveTh(u)) + 7 * Math.sin(caveTh(u) * 2.3 + 1);
const BLUE_POOL = [2192, 2242];
const FALLS = 2302;
const riverW = (u) => {
  if (u < RIVER[0] || u > RIVER[1]) return 0;
  let w = 2.8 + fbm(3, u, { seed: 311, scale: 12 }) * 1.6;
  w += 5.5 * smooth(BLUE_POOL[0], BLUE_POOL[0] + 14, u) * (1 - smooth(BLUE_POOL[1] - 14, BLUE_POOL[1], u));
  return w * smooth(RIVER[0], RIVER[0] + 8, u) * (1 - smooth(RIVER[1] - 8, RIVER[1], u)) + (u < RIVER[0] + 10 ? 2.5 : 0);
};
// the chamber's walls: narrow at the mouth, squeezed at the falls, narrowing again to the way out
const caveL = (u) => {
  const base = 12 + (fbm(0, u, { seed: 321, scale: 26, octaves: 2 }) - 0.5) * 12;
  let x = 84 + (base - 84) * smooth(C0, C0 + 60, u);
  x += 24 * Math.exp(-(((u - 2312) / 18) ** 2));
  return x + (86 - x) * smooth(2492, 2550, u);
};
const caveR = (u) => {
  const base = 168 + (fbm(5, u, { seed: 322, scale: 26, octaves: 2 }) - 0.5) * 12;
  let x = 136 + (base - 136) * smooth(C0, C0 + 60, u);
  x -= 16 * Math.exp(-(((u - 2312) / 18) ** 2));
  return x + (122 - x) * smooth(2492, 2550, u);
};

const WOOD = [0x5a3e24, 0x74522e, 0x8e683c, 0xa8804c];
const STEEL = [0x3e444c, 0x565e68, 0x727a84, 0x9aa2ac, 0xc8d0d8];

export function paintGangala(k) {
  const { img, Y, kit, objects } = k;
  const g = rng(3001);
  const FLOOR = [0x16301a, 0x1f4222, 0x2c562c, 0x3e6c36];
  const ROCK = [0x6a6658, 0x86806e, 0xa29a84, 0xbcb39a, 0xd6cdb2];
  const pads = k.pads.filter((p) => p.u > G0 - 12 && p.u < G1 + 12);

  // ------------------------------------------------------------ the ground: plateau, walls, floor
  img.fine(0, Y(G1), W, G1 - G0, (X, Yy, x, y) => {
    const u = L - y;
    const n = fbm(x, y, { seed: 303, scale: 6, octaves: 2 });
    const fw = faceW(u);
    const dl = x - valleyL(u);
    const dr = valleyR(u) - x;
    if (u < 1768 || (fw < 0.5 && dl > -2 && dr > -2)) return k.lawnPx(X, Yy, 0.2 + n * 0.6, C.grass, true); // (the village's edge)
    const face = (d, east) => {
      // the limestone face, from the rim (d = -fw) down to the foot (0): streaked by rain, ledged, mossy, the shaded one darker
      const t = 1 + d / fw;
      let c = rampColor(ROCK, 0.85 - t * 0.55 + (hashPx(X >> 1, Yy >> 3, 304) - 0.5) * 0.3, X, Yy);
      if ((Yy + Math.floor(hashPx(X >> 3, 0, 305) * 6)) % 11 < 1) c = scaleColor(c, 0.78);
      if (hashPx(X, Yy >> 2, 306) < 0.06) c = scaleColor(c, 0.82);
      const moss = fbm(x, y, { seed: 307, scale: 3, octaves: 2 });
      if (moss > 0.6 - t * 0.12) c = mix(c, rampColor(C.scrub, 0.2 + moss * 0.5, X, Yy), 0.75);
      c = scaleColor(c, 1.1 - t * 0.55); // darker down towards the foot, in the gorge's shade
      if (d < -fw + 0.6) return 0xece4cc; // the lit lip of the rim
      if (d < -fw + 1.3) return scaleColor(c, east ? 0.7 : 1.25);
      return scaleColor(c, east ? 0.55 : 1.02);
    };
    if (dl <= 0 && dl > -fw) return face(dl, true);
    if (dr <= 0 && dr > -fw) return face(dr, false);
    if (dl <= -fw || dr <= -fw) {
      // the plateau above the walls: scrub, the forest is planted on it below
      const c = k.lawnPx(X, Yy, 0.15 + n * 0.55, C.scrub, true);
      const rim = Math.min(-fw - dl, -fw - dr);
      return rim < 1.2 && hashPx(X, Yy, 308) < 0.5 ? scaleColor(c, 1.18) : c; // grass tufts over the rim
    }
    // the floor, deep in the gorge: dark undergrowth, leaf litter, darker still at the walls' feet
    let c = k.lawnPx(X, Yy, 0.12 + n * 0.62, FLOOR, true);
    const foot = Math.min(dl, dr);
    if (foot < 9) c = scaleColor(c, 0.5 + foot * 0.055);
    if (dl < 16) c = scaleColor(c, 0.62 + dl * 0.024); // the west wall's shadow over the floor
    // the head of the valley: the ground falling away into the dark mouth
    const mouth = smooth(2078, 2091, u);
    if (mouth > 0) c = mix(c, 0x0c0a0a, mouth * 0.92);
    return c;
  });
  k.reserve(0, Y(G1), W, 2); // (the head is the cave's)

  // ------------------------------------------------------------ the boardwalk, steps where it climbs
  const plank = (X, Yy, across, along) => {
    const q = Math.floor(along * S) % 4;
    let c = q === 0 ? WOOD[0] : rampColor(WOOD, 0.4 + hashPx(Math.floor(along * S / 4), 0, 309) * 0.5, X, Yy);
    if (Math.abs(across) > 1.1) c = scaleColor(c, 0.82);
    return c;
  };
  const route = [[90, 1756]];
  for (let u = 1768; u <= 2092; u += 6) route.push([pathX(u), u]);
  for (let q = 0; q < route.length - 1; q += 10) k.road(route.slice(q, q + 12), 1.5, { side: 0, kerb: WOOD[0], paint: plank, piece: true });
  for (const [u0, u1] of [[1912, 1922], [2062, 2072]]) {
    // stone steps where the path climbs a rock step
    const x = pathX((u0 + u1) / 2);
    k.stairs(x - 2, Y(u1), 4, u1 - u0, ROCK);
  }
  // the steps down into the dark at the head
  img.fine(98, Y(2092), 12, 12, (X, Yy, x, y) => {
    const u = L - y;
    if (Math.abs(x - 104) > 3.4) return null;
    const q = Yy % 5;
    const dark = smooth(2080, 2093, u);
    const c = q === 0 ? ROCK[3] : q >= 3 ? ROCK[0] : ROCK[2];
    return mix(c, 0x0c0a0a, dark * 0.9);
  });

  // ------------------------------------------------------------ the Cave Café: a hollow under the left wall at the valley's foot
  {
    const u0 = 1778;
    const u1 = 1806;
    const xL = valleyL(1792) - FACE - 5;
    const xR = valleyL(1792) + 3;
    img.fine(xL, Y(u1), xR - xL, u1 - u0, (X, Yy, x, y) => {
      const u = L - y;
      const e = Math.min((x - xL) / 4, (xR - x) / 2, (u - u0) / 3, (u1 - u) / 5);
      if (e < 0) return null;
      if (e < 0.35) return 0x1a1612; // the hollow's lip, in shadow
      // the floor of the hollow, beaten earth and flags, warm under the strings of bulbs
      const c = hashPx(X >> 3, Yy >> 3, 312) < 0.5 ? 0x6a5a48 : 0x5e5040;
      return (X >> 3) % 2 === (Yy >> 3) % 2 ? c : scaleColor(c, 0.9);
    });
    k.reserve(xL, Y(u1), xR - xL, u1 - u0);
    // tables, the counter, people at coffee; bulbs strung across; the warm light in the hollow
    for (let q = 0; q < 5; q++) {
      const tx = xL + 6 + (q % 3) * 6 + (q > 2 ? 3 : 0);
      const tu = u0 + 8 + (q > 2 ? 10 : 0);
      const X = tx * S;
      const Yy = Y(tu) * S;
      img.discPx(X + 1, Yy + 2, 3, 0x000000, 0.35);
      img.discPx(X, Yy, 3, 0xe8e0d0);
      img.discPx(X - 1, Yy - 1, 1.2, 0xffffff);
      for (const [dx, dy] of [[-5, 0], [5, 0]]) img.rectPx(X + dx - 1, Yy + dy - 1, 3, 3, WOOD[1]);
    }
    k.standing(xL + 4, Y(u0 + 20), 18, 10, 6, 313);
    img.rectPx(Math.round((xL + 2) * S), Math.round(Y(u1 - 7) * S), 24, 5, WOOD[2]); // the counter
    for (let q = 0; q <= 14; q++) {
      const x = xL + 2 + (q / 14) * (xR - xL - 4);
      const sag = Math.sin((q / 14) * Math.PI) * 2;
      k.glow(x, Y(u1 - 3) + sag, q % 2 ? 0xffd890 : 0xfff0c0, 0.9);
    }
    k.pool(xL + 9, Y((u0 + u1) / 2), 14, 0xffb060, 0.22);
  }

  // ------------------------------------------------------------ the prayer caves in the walls: a dark hollow, a stone altar, an offering
  for (const [side, u] of [[-1, 1878], [1, 1928]]) {
    const xf = side < 0 ? valleyL(u) : valleyR(u);
    const cx = xf - side * FACE * 0.45;
    img.fine(cx - 5, Y(u + 6), 10, 12, (X, Yy, x, y) => {
      const d = ((x - cx) / 4.2) ** 2 + ((y - Y(u)) / 5.2) ** 2;
      if (d >= 1) return null;
      return d > 0.8 ? 0x2a2620 : mix(0x0a0808, 0x1a1612, d);
    });
    const X = Math.round(cx * S);
    const Yy = Math.round(Y(u - 3) * S);
    img.rectPx(X - 4, Yy - 2, 9, 4, ROCK[2]);
    img.rectPx(X - 4, Yy - 2, 9, 1, ROCK[4]);
    img.px(X - 1, Yy - 3, 0xf0f0e8);
    img.px(X + 1, Yy - 3, 0xd8302a);
    k.reserve(cx - 5, Y(u + 6), 10, 12);
  }

  // ------------------------------------------------------------ Ufushu Gajumaru: the great banyan, its roots down the east wall
  const BX = 127;
  const BU = 1978;
  {
    const wallX = valleyR(BU);
    // the curtain of aerial roots over the face of the wall, and those standing on the floor like pillars
    objects.push({
      y: Y(BU - 20),
      draw: () => {
        const gr = rng(3002);
        for (let q = 0; q < 70; q++) {
          const x0 = wallX - FACE + gr() * (FACE + 2);
          const u0 = BU + 22 - gr() * 12;
          const len = 10 + gr() * 26;
          const X0 = x0 * S;
          for (let j = 0; j < len * S; j++) {
            const X = Math.round(X0 + Math.sin(j / 9 + q) * 1.2);
            img.px(X, Y(u0) * S + j, q % 3 ? 0x5a4a38 : 0x8a7a62);
            if (q % 4 === 0) img.px(X + 1, Y(u0) * S + j, 0x3a3026);
          }
        }
        for (let q = 0; q < 9; q++) {
          const X = Math.round((BX - 12 + gr() * 20) * S);
          const Yb = Math.round(Y(BU - 14 - gr() * 4) * S);
          for (let j = 0; j < 30; j++) for (let i = 0; i < 2; i++) img.px(X + i, Yb - j, i ? 0x5a4a38 : 0x8a7a62);
        }
      },
    });
    k.tree(BX, Y(BU), 17, [0x123a1c, 0x1e5626, 0x2e7430, 0x56963e], 3003, 'tropic');
    k.tree(BX - 12, Y(BU + 8), 9, [0x123a1c, 0x1e5626, 0x2e7430, 0x56963e], 3004, 'tropic');
    k.reserve(BX - 20, Y(BU + 18), 36, 40);
    // a deck at its foot, a group looking up
    img.fine(BX - 16, Y(BU - 16), 16, 6, (X, Yy) => (Yy % 6 < 1 ? 0x5a4026 : (X >> 2) % 2 ? 0x9a7a4a : 0xb89a68));
    k.standing(BX - 15, Y(BU - 16) + 1, 13, 4, 5, 3005);
  }

  // ------------------------------------------------------------ the forests: in the gorge, dense and dark; on the plateau, sunlit
  const DEEP = Object.assign([0x0f2c16, 0x184420, 0x26602a, 0x46803a], { kind: 'tropic' });
  const FERN = Object.assign([0x123a1c, 0x22602a, 0x3c8a36, 0x76bc56], { kind: 'fern' });
  const DARK = Object.assign([0x0c2414, 0x143a1c, 0x205024, 0x387032], { kind: 'tropic' });
  const SUN = Object.assign([0x1c4a22, 0x2f7a2e, 0x52a83a, 0x9ad25a], { kind: 'tropic' });
  const PAND = Object.assign([0x24502a, 0x3e7a34, 0x62a044, 0xa0cc6a], { kind: 'palm' });
  const clear = (x, u) => pads.every((p) => Math.hypot(p.x - x, p.u - u) > 15);
  k.forest(0, W, 1770, G1 - 4, [DEEP, FERN, DARK, FERN, DEEP], 3006, 3, 5.6, (x, u) => {
    const dl = x - valleyL(u);
    const dr = valleyR(u) - x;
    return dl > 4 && dr > 4 && Math.abs(x - pathX(u)) > 4.6 && clear(x, u) && u < 2072 && hashPx(Math.round(x * 3), Math.round(u * 3), 318) < 0.5;
  });
  k.forest(0, W, 1770, G1 - 2, [SUN, SUN, PAND, SUN], 3007, 4.5, 7.5, (x, u) => {
    const fw = faceW(u);
    return (x - valleyL(u) < -fw - 6 || valleyR(u) - x < -fw - 6) && fw > 4;
  });
  // tree ferns (hego) standing up out of the undergrowth along the path
  for (let u = 1790; u < 2060; u += 9 + g() * 8) {
    const side = g() < 0.5 ? -1 : 1;
    const x = pathX(u) + side * (5 + g() * 3);
    if (!clear(x, u) || k.isRes(Math.round(x), Y(u))) continue;
    k.palm(x, Y(u), 3.4 + g() * 1.2, Math.floor(g() * 1e8));
  }
  // the tour, walking up the boardwalk with its guide
  const tour = route.slice(1, -3);
  k.walkers(tour, 5, 1900, { sp: 2.2, gap: 9, hold: 6 });

  // ------------------------------------------------------------ light falling through the canopy in shafts, slowly breathing
  const shaft = k.sprite(16, 30, 1900, (r) => {
    for (let j = 0; j < 90; j++)
      for (let i = 0; i < 48; i++) {
        const c = (i - 6) - j * 0.38;
        const a = Math.max(0, 1 - Math.abs(c - 8) / 8) * Math.min(1, j / 20, (90 - j) / 24);
        if (a > 0.02) r.px(i, j, 0xfff2c4, a * 0.55);
      }
  }, false);
  kit.wave([shaft], [[0, 52, 1872, 0], [0, 96, 1952, 2.1], [0, 64, 2030, 4]], { w: 0.45, a0: 0.15, a1: 0.65, pw: 1.5, d: 0.6 });

  // ------------------------------------------------------------ the mouth of the cave: the overhang across the valley's head
  img.fine(0, Y(G1 + 5), W, 9, (X, Yy, x, y) => {
    const u = L - y;
    const top = G1 + 3 + (fbm(x, 0, { seed: 314, scale: 6 }) - 0.5) * 3;
    if (u > top) return null;
    const open = x > valleyL(2088) + 1 && x < valleyR(2088) - 1;
    if (open) {
      // the lintel's front: rock, then the fringe of stalactites hanging in front of the dark
      if (u > G1 + 0.5) return rampColor(ROCK, 0.25 + hashPx(X >> 1, Yy >> 1, 315) * 0.4, X, Yy);
      const fr = (G1 + 0.5 - u) * S;
      const tooth = hashPx(X >> 1, 0, 316) * 7 * (0.4 + 0.6 * hashPx(X >> 3, 1, 316));
      return fr < tooth ? rampColor(ROCK, 0.2 + (1 - fr / Math.max(1, tooth)) * 0.4, X, Yy) : null;
    }
    return rampColor(ROCK, 0.35 + fbm(x, y, { seed: 317, scale: 3 }) * 0.5, X, Yy);
  });
  k.reserve(0, Y(G1 + 5), W, 9);
  void puff;
}

export function paintCave(k) {
  const { img, Y, kit } = k;
  const g = rng(4001);
  const pads = k.pads.filter((p) => p.u > C0 && p.u < C1);
  const FW = W * S;
  const yTop = Y(C1);
  const rows = (C1 - C0) * S;
  const uOf = (Yy) => L - (Yy + 0.5) / S;

  // ------------------------------------------------------------ where things are
  const TERRACES = [2462, 2506];
  const terraceAt = (x, u) => {
    const n = (fbm(x, u, { seed: 342, scale: 8 }) - 0.5) * 10;
    return u > TERRACES[0] + n && u < TERRACES[1] - n && x > caveL(u) + 2 && x < walkX(u) - 7 + n * 0.4;
  };
  const nearWalk = (x, u, m) => Math.abs(x - walkX(u)) < m;
  const nearRiver = (x, u, m) => riverW(u) > 0 && Math.abs(x - riverX(u)) < riverW(u) + m;
  const free = (x, u, r) => x > caveL(u) + r + 1 && x < caveR(u) - r - 1 && !nearWalk(x, u, r + 4) && !nearRiver(x, u, r + 2) && !terraceAt(x, u) && pads.every((p) => Math.hypot(p.x - x, p.u - u) > r + 13) && u > C0 + 14 + r && u < C1 - 22;

  // the formations: stalagmites, columns in the halls, the forest of spears; each cone of limestone a height
  const forms = [];
  const FK = { mite: 1, spear: 2, column: 3, dome: 4, block: 5 };
  const tryForm = (x, u, r, h, kind, overlap = 0.75) => {
    if (!free(x, u, kind === 'dome' ? r * 0.6 : r)) return false;
    for (const f of forms) if (Math.hypot(f.x - x, f.u - u) < (f.r + r) * (f.kind === 'dome' || kind === 'dome' ? 0.3 : overlap)) return false;
    // a stalagmite is seldom round from above: leaning, grown together with a neighbour, drawn out along a crack
    const el = kind === 'mite' || kind === 'block' ? 1 + g() * (kind === 'block' ? 0.5 : 0.7) : 1;
    const ang = g() * Math.PI;
    forms.push({ x, u, r, h, kind, fk: FK[kind], el, ca: Math.cos(ang), sa: Math.sin(ang) });
    return true;
  };
  const COLUMNS = [[132, 2168], [44, 2252], [140, 2390], [96, 2440], [120, 2520]];
  for (const [x, u] of COLUMNS) tryForm(x, u, 6.5, 16, 'column') || tryForm(x + 10, u + 6, 6.5, 16, 'column');
  // flowstone domes first, low and wide, the stalagmites growing on and round them
  for (let q = 0; q < 220; q++) {
    const u = C0 + 20 + g() * (C1 - C0 - 50);
    const x = 14 + g() * (W - 28);
    if (fbm(x, u, { seed: 343, scale: 20, octaves: 2 }) < 0.5) continue;
    tryForm(x, u, 5 + g() * 5, 2.4 + g() * 1.6, 'dome');
  }
  for (let q = 0; q < 5200; q++) {
    const u = C0 + g() * (C1 - C0);
    const x = g() * W;
    const spears = u > 2335 && u < 2455;
    // breakdown: blocks fallen from the roof, here and there
    if (!spears && g() < 0.015) {
      const r = 1.5 + g() * 1.6;
      tryForm(x, u, r, 1.6 + g() * 2.2, 'block');
      continue;
    }
    const r = spears ? 0.9 + g() * 1.4 : 1.4 + g() * g() * 4.6;
    // they grow in clusters, open floor between (the forest of spears thicker, but in clumps too)
    const m = fbm(x, u, { seed: 343, scale: 20, octaves: 2 });
    if (g() > (m - (spears ? 0.34 : 0.4)) * 3.6) continue;
    if (!tryForm(x, u, r, r * (spears ? 3.4 : 2.6 + g() * 0.8), spears ? 'spear' : 'mite')) continue;
    // and the little ones round a big one
    if (!spears && r > 3.2)
      for (let n = 2 + Math.floor(g() * 4); n > 0; n--) {
        const a = g() * 6.283;
        const rr = 0.7 + g() * 1.3;
        const dd = r + rr * (0.6 + g() * 0.8);
        tryForm(x + Math.cos(a) * dd, u + Math.sin(a) * dd, rr, rr * 2.8, 'mite', 0.6);
      }
  }
  const CELL = 8;
  const gw = Math.ceil(W / CELL) + 1;
  const grid = new Map();
  for (const f of forms) {
    const ext = f.r * f.el * 1.25; // (drawn out, knobbly: it reaches past its radius)
    for (let cx = Math.max(0, Math.floor((f.x - ext) / CELL)); cx <= Math.min(gw - 1, Math.floor((f.x + ext) / CELL)); cx++)
      for (let cu = Math.floor((f.u - ext) / CELL); cu <= Math.floor((f.u + ext) / CELL); cu++) {
        const key = cu * gw + cx;
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key).push(f);
      }
  }

  // the lights: lamps along the walkway, floods on the great columns and over the halls, lamps under the river
  const HALL = (u) =>
    u < 2190 ? [0xffb048, 0xffd878] : u < 2290 ? [0x3ad0c0, 0x4aa8ff] : u < 2335 ? [0xa8dcff, 0xe0f4ff] : u < 2455 ? [0xffc050, 0x6a7aff, 0x58ff9a] : [0xff9a48, 0xffc860];
  const lights = [];
  const light = (x, u, c, r, amt, z = 9, water = 0) => lights.push({ x, y: Y(u), u, c: [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255], r, k: amt, z, water });
  for (let u = C0 + 10, i = 0; u < C1 - 8; u += 15, i++) light(walkX(u) + (i % 2 ? 2.4 : -2.4), u, 0xffcc88, 14, 0.9, 4);
  for (const f of forms) if (f.kind === 'column') {
    const cs = HALL(f.u);
    light(f.x - 8, f.u - 7, cs[0], 30, 1.3, 7);
    light(f.x + 7, f.u + 5, cs[cs.length - 1], 22, 1.0, 7);
  }
  for (let u = C0 + 26, i = 0; u < C1 - 20; u += 16 + g() * 8, i++) {
    // floods along the walls, raking the flowstone, and over the open floor between
    const cs = HALL(u);
    const x = i % 3 === 2 ? 40 + g() * 100 : i % 3 ? caveL(u) + 4 + g() * 6 : caveR(u) - 4 - g() * 6;
    light(x, u, cs[Math.floor(g() * cs.length)], 26, 1.25, 8);
  }
  for (let u = RIVER[0] + 4; u < RIVER[1] - 2; u += 13) light(riverX(u), u, 0x38c8ff, 8, 1.2, 1.2, 1);
  for (const u of [2205, 2228, 2380]) light(riverX(u) + 2, u, 0xf8fcff, 9, 1.0, 5); // floods on the sandbars
  for (const p of pads) light(p.x, p.u + 6, 0xffe8c0, 16, 0.8, 8);
  light(36, 2486, 0xffc060, 24, 1.3, 6); // the rimstone pools, lit warm from among them
  const LCELL = 16;
  const lgw = Math.ceil(W / LCELL) + 1;
  const lgrid = new Map();
  for (const l of lights)
    for (let cx = Math.max(0, Math.floor((l.x - l.r) / LCELL)); cx <= Math.min(lgw - 1, Math.floor((l.x + l.r) / LCELL)); cx++)
      for (let cy = Math.floor((l.y - l.r) / LCELL); cy <= Math.floor((l.y + l.r) / LCELL); cy++) {
        const key = cy * lgw + cx;
        if (!lgrid.has(key)) lgrid.set(key, []);
        lgrid.get(key).push(l);
      }
  // daylight in at the mouth and at the way out
  const day = (u) => 0.55 * Math.max(1 - smooth(C0 - 4, C0 + 22, u), smooth(C1 - 22, C1 + 2, u));

  // ------------------------------------------------------------ the height of the rock, fine pixel by fine pixel
  const H = new Float32Array(FW * rows);
  const KIND = new Uint8Array(FW * rows); // 0 floor, 1 wall, 2 formation, 3 water, 4 terrace pool, 5 terrace rim
  const FKP = new Uint8Array(FW * rows); // which kind of formation the pixel is on
  const RIM = new Float32Array(FW * rows); // where on it (0 at its foot .. 1 at its top), for the growth rings
  const TIP = new Uint8Array(FW * rows); // the wet tips of the formations, catching every light
  const AO = new Float32Array(FW * rows); // the floor darkening where it meets a formation
  for (let j = 0; j < rows; j++) {
    const Yy = yTop * S + j;
    const u = uOf(Yy);
    const cl = caveL(u);
    const cr = caveR(u);
    const rw = riverW(u);
    const rx = riverX(u);
    for (let X = 0; X < FW; X++) {
      const x = (X + 0.5) / S;
      const i = j * FW + X;
      let h = fbm(x, u, { seed: 331, scale: 2.2, octaves: 2 }) * 0.6;
      let kind = 0;
      const wd = Math.max(cl - x, x - cr);
      if (wd > 0) {
        h += 2 + wd * 1.4 + fbm(x, u, { seed: 332, scale: 1.6, octaves: 2 }) * 3;
        kind = 1;
      } else if (rw > 0 && Math.abs(x - rx) < rw) {
        h = -0.8;
        kind = 3;
      } else if (terraceAt(x, u)) {
        // rimstone: little dams of calcite holding pools, stepped
        const v = fbm(x, u * 1.3, { seed: 333, scale: 9, octaves: 3 }) + (u - TERRACES[0]) * 0.012;
        const ring = (v * 8) % 1;
        h = 0.2 + Math.floor(v * 8) * 0.35;
        kind = ring > 0.84 ? 5 : 4;
      }
      const cell = grid.get(Math.floor(u / CELL) * gw + Math.floor(x / CELL));
      if (cell && kind !== 3)
        for (const f of cell) {
          const ex = x - f.x;
          const eu = u - f.u;
          const qa = (ex * f.ca + eu * f.sa) / f.el;
          const qb = -ex * f.sa + eu * f.ca;
          let d = f.kind === 'block' ? (Math.max(Math.abs(qa), Math.abs(qb)) * 0.6 + Math.hypot(qa, qb) * 0.5) + (fbm(x * 2, u * 2, { seed: 345, scale: 1.2 }) - 0.5) * f.r * 0.5 : Math.hypot(qa, qb);
          if (f.kind === 'mite' || f.kind === 'spear') d += (fbm(x * 2, u * 2, { seed: 346, scale: 1.5 }) - 0.5) * f.r * 0.25; // knobbly
          if (d >= f.r) continue;
          const t = 1 - d / f.r;
          const fh = f.kind === 'dome' ? f.h * Math.sqrt(1 - (1 - t) ** 2) : f.kind === 'block' ? f.h * Math.min(1, t * 4) : f.h * t ** (f.kind === 'column' ? 0.7 : 1.35);
          if (d > f.r * 0.86 && kind !== 1) AO[i] = Math.max(AO[i], 1 - (d - f.r * 0.86) / (f.r * 0.14));
          const top = f.kind === 'dome' && kind === 2 ? h + fh * 0.5 : fh; // (a stalagmite on a dome stands on it)
          if (top > h) {
            TIP[i] = d < f.r * 0.16 && f.kind !== 'dome' && f.kind !== 'block' ? 1 : 0;
            h = top + (kind === 1 ? h * 0.3 : 0);
            kind = 2;
            FKP[i] = f.fk;
            RIM[i] = t;
          }
        }
      if (kind === 0 && fbm(x, u, { seed: 344, scale: 7, octaves: 2 }) > 0.67) {
        kind = 6; // a pool of still water on the floor, mirroring the lights
        h = -0.2;
      }
      H[i] = h;
      KIND[i] = kind;
    }
  }
  // the falls: a step down in the river's bed
  // (drawn as a moving sheet below)

  // ------------------------------------------------------------ light it
  const at = (X, j) => H[Math.max(0, Math.min(rows - 1, j)) * FW + Math.max(0, Math.min(FW - 1, X))];
  for (let j = 0; j < rows; j++) {
    const Yy = yTop * S + j;
    const y = (Yy + 0.5) / S;
    const u = L - y;
    const dl = day(u);
    for (let X = 0; X < FW; X++) {
      const i = j * FW + X;
      const x = (X + 0.5) / S;
      const kind = KIND[i];
      const h = H[i];
      // the surface's normal from the heights (in logical units)
      const nx = (at(X - 1, j) - at(X + 1, j)) * (S / 2);
      const ny = (at(X, j - 1) - at(X, j + 1)) * (S / 2);
      const nl = Math.hypot(nx, ny, 1);
      // its colour by day: pale limestone, cream on the formations, banded flowstone on the walls, wet and dark low down
      let alb;
      const v = hashPx(X >> 1, Yy >> 1, 334);
      if (kind === 3) alb = 0x0a2a44;
      else if (kind === 4) alb = 0x6ab0b8;
      else if (kind === 5) alb = 0xe8dcc0;
      else if (kind === 6) alb = 0x141c22;
      else if (kind === 2) {
        const fk = FKP[i];
        const t = RIM[i];
        if (fk === 4) {
          // flowstone: rings of orange and cream laid down layer on layer
          const band = (t * 2.2 + fbm(x, u, { seed: 347, scale: 3 }) * 0.8) % 1;
          alb = band < 0.2 ? 0xd09a64 : band < 0.55 ? 0xf0dab4 : band < 0.7 ? 0xc48c58 : 0xfaecd0;
        } else if (fk === 5) {
          alb = rampColor([0x5e5448, 0x766a5a, 0x8e806c, 0xa49680], 0.3 + t * 0.4 + (v - 0.5) * 0.3, X, Yy);
          if (hashPx(X >> 1, Yy, 348) < 0.05 || hashPx(X, Yy >> 1, 349) < 0.05) alb = 0x3a342c; // its fractures
        } else {
          alb = rampColor([0xb0a080, 0xcec0a0, 0xe4d8ba, 0xf6eed8], 0.35 + Math.min(1, h / 10) * 0.6 + (v - 0.5) * 0.2, X, Yy);
          if ((t * (fk === 3 ? 9 : 5)) % 1 < 0.14) alb = scaleColor(alb, 0.82); // growth rings
          if (fk === 2 && h > 1.5) alb = mix(alb, 0xf4ecd8, 0.4);
          else if (fbm(x, u, { seed: 350, scale: 3 }) > 0.62) alb = mix(alb, 0xd8a468, 0.35); // iron-stained
        }
      } else if (kind === 1) {
        const wd = Math.max(caveL(u) - x, x - caveR(u));
        if (wd < 7) {
          // draperies hanging down the foot of the wall: thin curtains of calcite, light shining through their edges
          const fold = (u * 0.8 + fbm(x, u, { seed: 351, scale: 3 }) * 2.4) % 1;
          alb = fold < 0.18 ? 0x5a4030 : fold < 0.42 ? 0xe8c890 : fold < 0.6 ? 0xc89060 : fold < 0.8 ? 0xf4e2bc : 0xa87048;
        } else {
          const band = (h * 0.55 + fbm(x, u, { seed: 335, scale: 5 }) * 2.2) % 1;
          alb = band < 0.3 ? 0xa87a52 : band < 0.55 ? 0xd2b48a : band < 0.75 ? 0x8a6a4c : 0xe2ccaa;
        }
      } else {
        alb = rampColor([0x4a4234, 0x5a5040, 0x6a604c, 0x7a705a], 0.3 + v * 0.4 + h * 0.3, X, Yy);
        const crust = fbm(x, u, { seed: 352, scale: 4 });
        if (crust > 0.58) alb = mix(alb, 0xb8a888, 0.45); // a crust of calcite
        if (hashPx(X >> 1, Yy >> 1, 353) < 0.04) alb = scaleColor(alb, 0.7); // grit, pebbles
      }
      // the lights falling on it
      let lr = 0.13 + dl * 0.87;
      let lg = 0.12 + dl * 0.88;
      let lb = 0.16 + dl * 0.82;
      const cand = lgrid.get(Math.floor(y / LCELL) * lgw + Math.floor(x / LCELL));
      if (cand)
        for (const l of cand) {
          const dx = l.x - x;
          const dy = l.y - y;
          const d = Math.hypot(dx, dy);
          if (d >= l.r) continue;
          if (l.water && kind !== 3) continue;
          const dz = l.z - h;
          const dd = Math.hypot(dx, dy, dz) || 1;
          const lam = Math.max(0, (nx * dx + ny * dy + dz) / (nl * dd));
          const f = (1 - d / l.r) ** 1.5 * l.k * (l.water ? 1 : 0.3 + 0.7 * lam);
          lr += l.c[0] * f;
          lg += l.c[1] * f;
          lb += l.c[2] * f;
        }
      if (kind === 2 && TIP[i]) {
        lr = lr * 1.5 + 0.12;
        lg = lg * 1.5 + 0.12;
        lb = lb * 1.5 + 0.14;
      } else if (kind !== 2 && AO[i] > 0) {
        const o = 1 - 0.45 * AO[i];
        lr *= o;
        lg *= o;
        lb *= o;
      }
      let r = ((alb >> 16) & 255) * lr;
      let gg = ((alb >> 8) & 255) * lg;
      let b = (alb & 255) * lb;
      if (kind === 3) {
        // the river: lit from under the water, ripples catching it
        const rip = fbm(x * 2, u * 0.7, { seed: 336, scale: 2, octaves: 2 });
        const glow = Math.min(1, (lb - 0.08) * 0.9);
        r = 6 + glow * 40 + (rip > 0.62 ? glow * 60 : 0);
        gg = 26 + glow * 150 + (rip > 0.62 ? glow * 80 : 0);
        b = 52 + glow * 200 + (rip > 0.62 ? glow * 50 : 0);
        r = r * (1 - dl) + 40 * dl;
      } else if (kind === 6) {
        // still water: dark, the lights mirrored in it, a bright rim where it laps the rock
        r = 14 + (lr - 0.1) * 210;
        gg = 18 + (lg - 0.1) * 210;
        b = 26 + (lb - 0.1) * 220;
        if (KIND[Math.max(0, i - 1)] !== 6 || KIND[Math.min(KIND.length - 1, i + 1)] !== 6 || KIND[Math.max(0, i - FW)] !== 6) {
          r += 30;
          gg += 30;
          b += 34;
        }
      } else if (kind === 4) {
        // the rimstone pools: still water over pale calcite, the light deep in them
        r *= 0.8;
        gg *= 1.1;
        b *= 1.3;
      }
      // a wet sparkle where the light is strong
      if (kind !== 3 && kind !== 6 && (lr + lg + lb) > (kind === 2 ? 0.9 : 1.2) && hashPx(X, Yy, 337) > (kind === 2 ? 0.984 : 0.992)) {
        r += 70;
        gg += 70;
        b += 70;
      }
      img.px(X, Yy, (Math.min(255, Math.round(r)) << 16) | (Math.min(255, Math.round(gg)) << 8) | Math.min(255, Math.round(b)));
    }
  }

  // ------------------------------------------------------------ the walkway: steel grating between railings, its lamps; stairs at the ends
  const STAIRS = [[C0, C0 + 20], [C1 - 30, C1]];
  img.fine(0, yTop, W, C1 - C0, (X, Yy, x, y) => {
    const u = L - y;
    const wx = walkX(u);
    const slope = Math.hypot(1, (walkX(u + 0.5) - walkX(u - 0.5)));
    const a = Math.abs(x - wx) / slope;
    if (a > 1.9) return null;
    const lit = Math.max(day(u), 0.4 + 0.6 * Math.max(0, 1 - (((u - C0 - 10) % 15) - 7.5) ** 2 / 60));
    let c;
    if (a > 1.45) c = a > 1.7 ? 0x14161a : STEEL[4]; // the railing, and its shadow
    else if (STAIRS.some(([s0, s1]) => u >= s0 && u < s1)) c = Yy % 5 === 0 ? STEEL[4] : Yy % 5 > 2 ? STEEL[0] : STEEL[2];
    else c = X % 3 === 0 || Yy % 3 === 0 ? STEEL[0] : STEEL[2];
    return scaleColor(c, lit);
  });
  for (let u = C0 + 10, i = 0; u < C1 - 8; u += 15, i++) k.glow(walkX(u) + (i % 2 ? 1.7 : -1.7), Y(u), 0xffe0a0, 1);
  // the turrets' places: steel platforms bolted to the floor
  for (const p of pads)
    img.fine(p.x - 10, Y(p.u) - 10, 20, 20, (X, Yy, x, y) => {
      const d = Math.hypot(x - p.x, y - Y(p.u));
      if (d > 9.6) return null;
      if (d > 8.6) return STEEL[0];
      return scaleColor((X + Yy) % 6 < 1 ? STEEL[1] : STEEL[2], d < 1.5 ? 0.6 : 0.42);
    });

  // ------------------------------------------------------------ the roof: rock and hanging formations over the flight, nearer the
  // eye than the floor, so they pass faster (Props' z): the overhang of the mouth going over, the rock closing in at the sides,
  // clumps of stalactites drifting by, and the overhang of the way out. All under the enemies and their bullets.
  const ROOF = [0x120e0c, 0x221c18, 0x342c26, 0x4c4038, 0x6c5e52, 0x94826e];
  const rr = rng(4100);
  const hex = (c) => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
  const shade = (c, k2) => scaleColor(c, k2);
  /** A stalactite in fine pixels: from (X, Yy) pointing along (dx, dy), base half-width w, length n; lit by c from its tip side. */
  const stal = (r, X, Yy, dx, dy, w, n, c, glow) => {
    for (let q = 0; q < n; q++) {
      const t = q / n;
      const hw = Math.max(0.5, w * (1 - t) ** 0.8);
      for (let a = -Math.ceil(hw); a <= Math.ceil(hw); a++) {
        if (Math.abs(a) > hw) continue;
        const side = a / hw; // -1..1 across
        const lit = 0.35 + 0.65 * Math.max(0, 0.5 - side * 0.5) * (0.4 + 0.6 * t);
        const col = mix(ROOF[2 + Math.min(3, Math.floor(t * 3))], c, Math.min(1, t * 0.8) * 0.7);
        r.px(Math.round(X + dx * q - dy * a), Math.round(Yy + dy * q + dx * a), shade(col, lit + (q % 7 === 0 ? -0.1 : 0)));
      }
    }
    if (glow) r.px(Math.round(X + dx * n), Math.round(Yy + dy * n), 0xfff4d8, 0.9); // the drop at the tip
  };
  /** A frame of roof rock: inside(fx, fy) says where the rock is, edge(fx, fy) how near its rim (0..1, lit there by c). */
  const roofFrame = (w, h, inside, edge, c, extra) =>
    k.sprite(w, h, 2300, (r) => {
      for (let j = 0; j < h * S; j++)
        for (let i = 0; i < w * S; i++) {
          if (!inside(i, j)) continue;
          const e = edge(i, j);
          const n = fbm(i / 4, j / 4, { seed: 4101, scale: 3, octaves: 3 });
          let col = rampColor(ROOF, 0.1 + n * 0.55 + e * 0.35, i, j);
          if (e > 0.6) col = mix(col, c, (e - 0.6) * 1.6);
          if (hashPx(i >> 1, j >> 1, 4102) < 0.04) col = shade(col, 0.7);
          r.px(i, j, col);
        }
      extra(r);
    }, false);
  // the overhang at the mouth: rock across the whole way, its front lit by the day, stalactites hanging from it
  const archFrame = (flip, c) => {
    const w = 192;
    const h = 84;
    const lip = (i) => (40 + (fbm(i / 9, flip ? 7 : 3, { seed: 4103, scale: 4 }) - 0.5) * 22 + 8 * Math.sin(i / 40)) * S;
    const sy = (j) => (flip ? h * S - 1 - j : j);
    return roofFrame(w, h, (i, j) => sy(j) < lip(i), (i, j) => Math.max(0, 1 - (lip(i) - sy(j)) / 30), c, (r) => {
      for (let q = 0; q < 90; q++) {
        const i = Math.floor(rr() * w * S);
        const len = (6 + rr() * rr() * 34) * S * 0.5;
        const wb = 2 + rr() * 5;
        const j0 = lip(i) - 3;
        stal(r, i, flip ? h * S - 1 - j0 : j0, 0, flip ? -1 : 1, wb, len, c, rr() < 0.5);
      }
    });
  };
  const ARCH_IN = archFrame(false, 0xffdcaa);
  const ARCH_OUT = archFrame(true, 0xfff0d0);
  kit.loop(-6, C0 + 62, [ARCH_IN], { z: 0.75, ax: 90, au: C0 + 20, d: 0.97 });
  kit.loop(-6, C1 + 30, [ARCH_OUT], { z: 0.75, ax: 90, au: C1 - 12, d: 0.97 });
  // the rock closing in at the sides, one piece after another, its rim lit in the colour of the hall
  const sideFrame = (right, c, seed) => {
    const w = 40;
    const h = 120;
    const rim = (j) => (12 + fbm(seed, j / 10, { seed: 4104, scale: 3, octaves: 2 }) * 16 + Math.sin(j / 40 + seed) * 4) * S;
    const sx = (i) => (right ? w * S - 1 - i : i);
    const fade = (j) => Math.min(1, j / 30, (h * S - 1 - j) / 30); // the ends tapering into the next piece
    return roofFrame(w, h, (i, j) => sx(i) < rim(j) * (0.55 + 0.45 * fade(j)), (i, j) => Math.max(0, 1 - (rim(j) * (0.55 + 0.45 * fade(j)) - sx(i)) / 24), c, (r) => {
      for (let q = 0; q < 26; q++) {
        const j = Math.floor(rr() * h * S);
        const i0 = rim(j) * (0.55 + 0.45 * fade(j)) - 3;
        const len = (4 + rr() * rr() * 16) * S * 0.5;
        stal(r, right ? w * S - 1 - i0 : i0, j, right ? -1 : 1, 0.15 * (rr() - 0.5), 1.5 + rr() * 3.5, len, c, rr() < 0.4);
      }
    });
  };
  const sides = {};
  for (let u = C0 + 46, n = 0; u < C1 - 60; u += 104, n++) {
    const c = HALL(u)[0];
    const key = (k2) => `${c}_${k2}_${n % 2}`;
    sides[key('l')] ??= sideFrame(false, c, n % 2 ? 3 : 9);
    sides[key('r')] ??= sideFrame(true, c, n % 2 ? 6 : 12);
    kit.loop(-14, u + 120, [sides[key('l')]], { z: 0.45, ax: 90, au: u + 60, d: 0.96, a: 0.95 });
    kit.loop(W - 26, u + 172, [sides[key('r')]], { z: 0.45, ax: 90, au: u + 112, d: 0.96, a: 0.95 });
  }
  // clumps of stalactites hanging from the roof, nearer than the floor: soda straws, a drop shining on every tip
  const clump = (c) => k.sprite(26, 26, 2300, (r) => {
    const cx = 39;
    const cy = 39;
    for (let j = 0; j < 78; j++)
      for (let i = 0; i < 78; i++) {
        const d = Math.hypot(i - cx, j - cy) / (12 + fbm(i / 6, j / 6, { seed: 4105, scale: 2 }) * 8);
        if (d < 1) r.px(i, j, rampColor(ROOF, 0.15 + (1 - d) * 0.3, i, j), Math.min(1, (1 - d) * 3));
      }
    for (let q = 0; q < 34; q++) {
      const a = rr() * 6.283;
      const r0 = 6 + rr() * 8;
      const len = 6 + rr() * 22;
      stal(r, cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, Math.cos(a) * 0.4, 0.92, 1 + rr() * 2.4, len, c, true);
    }
  }, false);
  const clumps = {};
  for (let q = 0; q < 16; q++) {
    const u = C0 + 40 + rr() * (C1 - C0 - 100);
    const x = 18 + rr() * (W - 62);
    const c = HALL(u)[q % HALL(u).length];
    clumps[c] ??= clump(c);
    kit.loop(x, u + 13, [clumps[c]], { z: 0.3, ax: 90, au: u, d: 0.95, a: 0.85 });
  }
  void hex;

  // ------------------------------------------------------------ what moves: the falls, light on the water, drips, the colours changing
  {
    const fw = Math.ceil(riverW(FALLS) * 2 + 2);
    const fx0 = riverX(FALLS) - fw / 2;
    img.fine(fx0, Y(FALLS + 0.6), fw, 1.2, (X, Yy, x) => (Math.abs(x - riverX(FALLS)) < riverW(FALLS) ? 0xd8f4ff : null));
    const frames = [0, 1, 2].map((f) => k.sprite(fw, 5, FALLS, (r) => {
      for (let j = 0; j < 15; j++)
        for (let i = 0; i < fw * S; i++) {
          const streak = (j + f * 5 + (i * 7) % 11) % 15;
          const edge = i < 2 || i > fw * S - 3;
          if (edge && (j + i + f) % 5 < 2) continue;
          r.px(i, j, streak < 4 ? 0xffffff : 0x9adcff, (edge ? 0.6 : 0.95) * (1 - j / 22));
        }
    }, false));
    kit.loop(fx0, FALLS, frames, { fps: 10 });
    const spray = [6, 9].map((r) => [0, 1].map((v) => kit.frame(puff(r, r * 5 + v + 41, [0x5a8aa8, 0x7aaac8, 0xa8d4ec, 0xd8f0ff]))));
    kit.emit(riverX(FALLS), FALLS - 6, spray, { rate: 1.6, life: [0.8, 1.4], vy: 3, sx: 3, wf: 0, a: 0.4 });
  }
  const glint = k.sprite(5, 2, 2300, (r) => {
    for (let i = 0; i < 15; i++) for (let j = 0; j < 6; j++) if (Math.abs(j - 3) < 2 - Math.abs(i - 7) / 5) r.px(i, j, 0xc8f4ff, 0.8);
  }, false);
  const glints = [];
  for (let u = RIVER[0] + 8; u < RIVER[1] - 6; u += 11) glints.push([0, riverX(u) - 2.5, u, (u * 0.37) % 6.28]);
  kit.wave([glint], glints, { w: 1.6, a0: 0, a1: 0.9, pw: 3 });
  const ring = [5, 8, 11].map((r) => k.sprite(r / 1.5 + 2, r / 3 + 2, 2300, (q) => {
    for (let a = 0; a < 6.3; a += 0.06) q.px(r + 3 + Math.cos(a) * r, r / 2 + 3 + Math.sin(a) * r * 0.5, 0xd8f4ff, 0.7);
  }, false));
  kit.spot([[riverX(2215) - 6, 2236, 10, 40], [30, 2504, 30, 40]], ring, { rate: 2.2, fps: 6, a: 0.8 });
  // the motion-sensor lights: soft colour washing over the great columns, one hue into the next
  const wash = [0xffb848, 0x58ff9a, 0x5a8aff].map((c) => k.sprite(28, 28, 2300, (r) => {
    for (let j = 0; j < 84; j++)
      for (let i = 0; i < 84; i++) {
        const d = Math.hypot(i - 42, j - 42) / 42;
        if (d < 1) r.px(i, j, c, 0.45 * (1 - d) ** 2);
      }
  }, false));
  const washes = [];
  for (const f of forms) if (f.kind === 'column') washes.push([0, f.x - 14, f.u + 14, f.u * 0.1], [1, f.x - 14, f.u + 14, f.u * 0.1 + 2.09], [2, f.x - 14, f.u + 14, f.u * 0.1 + 4.19]);
  kit.wave(wash, washes, { w: 0.6, a0: 0, a1: 0.8, pw: 2 });

  // ------------------------------------------------------------ the way out: the portal in the rock, the stairs up into the day
  img.fine(0, Y(C1), W, 14, (X, Yy, x, y) => {
    const u = L - y;
    const open = Math.abs(x - walkX(u)) < 5 + (C1 - u) * 0.6;
    const lip = C1 - 9 + (fbm(x, 0, { seed: 338, scale: 6 }) - 0.5) * 3;
    if (u < lip) return null;
    if (open && u < C1 - 3) return null;
    if (u > C1 - 3) return k.lawnPx(X, Yy, 0.25 + fbm(x, y, { seed: 339, scale: 5 }) * 0.5, C.grass, true); // the day, the grass at Naha's edge
    return rampColor([0x4a463c, 0x6a6454, 0x8a8270, 0xa89e88], 0.25 + fbm(x, y, { seed: 340, scale: 3 }) * 0.6 + (hashPx(X >> 1, Yy >> 1, 341) - 0.5) * 0.3, X, Yy);
  });
  k.reserve(0, yTop, W, C1 - C0);
}
