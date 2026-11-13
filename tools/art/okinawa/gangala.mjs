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
const RIVER = [2200, 2470];
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
      // old Ryukyu limestone: rounded bosses and pits worn by the rain, strata, a darker band under the overhang of the rim
      const boss = fbm(x * 1.6, y * 1.6, { seed: 309, scale: 1.8, octaves: 2 });
      let c = rampColor(ROCK, 0.85 - t * 0.55 + (boss - 0.5) * 0.7 + (hashPx(X >> 1, Yy >> 3, 304) - 0.5) * 0.2, X, Yy);
      if (Math.abs(boss - 0.5) < 0.025) c = scaleColor(c, 0.62); // the pits between the bosses
      const ledge = (Yy + Math.floor(hashPx(X >> 3, 0, 305) * 6)) % 11;
      if (ledge < 1) c = scaleColor(c, 0.78);
      // little stalactites hanging under the ledges, pale, and the dark pockets of the karst
      else if (ledge < 1 + hashPx(X >> 1, Math.floor((Yy + Math.floor(hashPx(X >> 3, 0, 305) * 6)) / 11), 314) * 7 && hashPx(X >> 1, Math.floor(Yy / 11), 315) < 0.22) c = scaleColor(0xd8d0bc, 0.75 + (X & 1) * 0.2);
      if (fbm(x * 2.4, y * 2.4, { seed: 316, scale: 1.2 }) > 0.7) c = scaleColor(c, 0.4);
      if (hashPx(X, Yy >> 2, 306) < 0.06) c = scaleColor(c, 0.82);
      if (t > 0.06 && t < 0.2) c = scaleColor(c, 0.72);
      const moss = fbm(x, y, { seed: 307, scale: 3, octaves: 2 });
      if (moss > 0.6 - t * 0.12) c = mix(c, rampColor(C.moss, 0.2 + moss * 0.6, X, Yy), 0.8);
      // vines and fig roots let down over the face from the plateau's edge
      const vine = hashPx(X >> 1, Math.floor(u / 40), 310);
      if (vine < 0.16 && t < 0.25 + hashPx(X >> 1, 7, 311) * 0.8) c = (X & 1) ? 0x1e4a22 : vine < 0.05 ? 0x6a5a44 : 0x2e6a2c;
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

  // ------------------------------------------------------------ the path: worn concrete, damp and mossy at its edges, an iron
  // railing along its west side; steps where it climbs
  const concrete = (X, Yy, across) => {
    let c = rampColor([0x8a8676, 0x9e9a88, 0xb2ad9a, 0xc4bfac], 0.35 + hashPx(X >> 1, Yy >> 1, 309) * 0.4, X, Yy);
    if (hashPx(X, Yy, 312) < 0.04) c = scaleColor(c, 0.8);
    if (Math.abs(across) > 1.4 && hashPx(X >> 1, Yy >> 2, 313) < 0.5) c = mix(c, 0x4a6a3a, 0.5);
    return c;
  };
  const route = [[90, 1756]];
  for (let u = 1768; u <= 2092; u += 6) route.push([pathX(u), u]);
  for (let q = 0; q < route.length - 1; q += 10) k.road(route.slice(q, q + 12), 1.9, { side: 0, kerb: 0x5a5a4e, paint: concrete, piece: true });
  objects.push({
    y: Y(1768),
    draw: () => {
      for (let u = 1772; u < 2076; u += 0.34) {
        const X = Math.round((pathX(u) - 2.4) * S);
        const Yy = Math.round(Y(u) * S);
        img.px(X, Yy - 4, 0x2a2a2a); // the rail
        if (Math.round(u * 3) % 9 === 0) for (let j = 0; j < 4; j++) img.px(X, Yy - j, 0x3a3a38); // a post
      }
    },
  });
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

  // ------------------------------------------------------------ Ufushu Gajumaru, as it stands: before a dark cave in the east wall
  // (stalactites hanging from its overhang), its trunk a column of a hundred pale roots grown together, fluted and twisted, and
  // from its branches more pale roots hanging straight down, most of them to the ground; high above, an airy crown of pale grey
  // limbs and small light leaves with the sky showing through; ferns on the rock round it, elephant ears at its feet.
  const BX = 124;
  const BU = 1980;
  {
    const by = Y(BU); // the ground at the trunk's foot
    const top = Y(BU + 36); // the crown's underside
    const gr = rng(3002);
    const BARK = [0x5e5a4e, 0x7e786a, 0xa09886, 0xbeb6a0, 0xd8d0b8];
    // the cave behind it: a dark mouth cut into the wall and the floor, stalactites hanging from its lip
    const mx = valleyR(BU + 14);
    img.fine(mx - FACE - 14, Y(BU + 34), FACE + 18, 30, (X, Yy, x, y) => {
      const u = L - y;
      const e = ((x - (mx - 4)) / 13) ** 2 + ((u - (BU + 18)) / 14) ** 2 + (fbm(x, y, { seed: 3017, scale: 3 }) - 0.5) * 0.5;
      if (e > 1) return null;
      if (e > 0.82) return rampColor([0x3a3830, 0x5a5648, 0x7a7462], (1 - e) * 4, X, Yy); // its lip
      return mix(0x08090a, 0x16160f, hashPx(X >> 2, Yy >> 2, 3018) * (1 - e));
    });
    objects.push({
      y: Y(BU + 22),
      draw: () => {
        for (let q = 0; q < 46; q++) {
          const x = mx - 16 + gr() * 22;
          const u0 = BU + 31 - Math.abs(x - (mx - 4)) * 0.5 - gr() * 2;
          const len = (2 + gr() * gr() * 9) * S;
          const w = 0.5 + gr() * 1.4;
          for (let j = 0; j < len; j++) for (let i = -w * S * (1 - j / len); i <= w * S * (1 - j / len); i++) img.px(Math.round(x * S + i), Math.round(Y(u0) * S) + j, i < 0 ? 0xc8c0aa : 0x8a8270);
        }
      },
    });
    // the trunk: many roots grown into one, fluted, twisting a little, wider at the foot, climbing into the crown
    objects.push({
      y: by + 0.6,
      shadow: () => k.shadowEllipse(BX + 3, by + 1, 14, 4, 0.6),
      draw: () => {
        const Y0 = Math.round(top * S);
        const Y1 = Math.round(by * S);
        for (let Yy = Y0; Yy <= Y1; Yy++) {
          const t = (Yy - Y0) / (Y1 - Y0); // 0 under the crown .. 1 at the foot
          const half = (4.2 + t ** 3 * 4.5) * S;
          const cx = BX * S + Math.sin(t * 3.2) * 4;
          for (let i = -half; i <= half; i++) {
            const a2 = (i + half) / (2 * half);
            const flute = Math.sin((i + t * 14) * 0.9 + Math.sin(Yy / 13) * 1.5);
            let c = rampColor(BARK, 0.15 + (1 - a2) * 0.65 + flute * 0.15, Yy, Yy);
            if (flute < -0.8) c = BARK[0];
            img.px(Math.round(cx + i), Yy, c);
          }
        }
        // the hanging roots, pale and straight, thin and thick; nearly all reach the ground; some still in mid-air
        for (let q = 0; q < 85; q++) {
          // (they come down from the limbs, so from all over under the crown, in bunches)
          const bunch = Math.floor(gr() * 7);
          const x0 = BX + (bunch - 3) * 7.5 + (gr() - 0.5) * 6;
          if (Math.abs(x0 - BX) < 4) continue;
          const reach = gr() < 0.6;
          const y0 = top - 16 + gr() * 12 + Math.abs(x0 - BX) * 0.35;
          const y1 = reach ? by - gr() * 1.5 + Math.abs(x0 - BX) * 0.04 : y0 + (by - y0) * (0.3 + gr() * 0.5);
          const w = gr() < 0.15 ? 0.6 + gr() * 0.5 : 0.17 + gr() * 0.12;
          for (let Yy = Math.round(y0 * S); Yy <= Math.round(y1 * S); Yy++) {
            const xc = x0 + Math.sin(Yy / 23 + q) * 0.25;
            for (let i = -w; i <= w; i += 1 / S) img.px(Math.round((xc + i) * S), Yy, i < -w * 0.3 ? BARK[4] : i > w * 0.4 ? BARK[1] : BARK[3]);
          }
          if (reach && w > 0.5) for (let i = -2; i <= 2; i++) img.px(Math.round(x0 * S + i * 2), Math.round(y1 * S), BARK[1]); // its foot taking hold
        }
      },
    });
    // the crown: pale grey limbs spreading from the top of the trunk, small light leaves in loose clumps, gaps between
    const CROWN = [0x1a3e1a, 0x2a5e26, 0x427e34, 0x62a044, 0x88bc5a, 0xb0d47e];
    const cx = BX - 2;
    const cy = Y(BU + 48);
    objects.push({
      y: by + 1,
      shadow: () => k.shadowEllipse(cx + 4, cy + 26, 30, 9, 0.5),
      draw: () => {
        const cr = rng(3013);
        // the limbs
        for (let q = 0; q < 11; q++) {
          const a2 = -Math.PI / 2 + (q / 10 - 0.5) * 3.2 + (cr() - 0.5) * 0.3;
          let x = cx;
          let y = top + 2;
          let w = 1.6;
          for (let n = 0; n < 36; n++) {
            x += Math.cos(a2 + Math.sin(n / 5 + q) * 0.3) * 0.9;
            y += Math.sin(a2 + Math.sin(n / 5 + q) * 0.3) * 0.5;
            w = Math.max(0.35, w - 0.035);
            for (let i = -w; i <= w; i += 1 / S) for (let j = -w; j <= w; j += 1 / S) img.px(Math.round((x + i) * S), Math.round((y + j) * S), j < 0 ? BARK[4] : BARK[2]);
          }
        }
        // the leaves
        const clumps = [];
        for (let q = 0; q < 420; q++) {
          const a2 = cr() * 6.283;
          const d = Math.sqrt(cr());
          const x = cx + Math.cos(a2) * d * 33 * (0.85 + 0.15 * Math.sin(a2 * 3));
          const y = cy + Math.sin(a2) * d * 15;
          if (fbm(x, y, { seed: 3019, scale: 5 }) < 0.4) continue; // the gaps, the sky showing through
          clumps.push([x, y, 0.8 + cr() * 1.5, cr()]);
        }
        clumps.sort((p1, p2) => p1[1] - p2[1]);
        for (const [x, y, r2, v] of clumps) {
          const X0 = Math.round(x * S);
          const Y0 = Math.round(y * S);
          const R2 = r2 * S;
          for (let j = -R2; j <= R2; j++)
            for (let i = -R2; i <= R2; i++) {
              const dd = Math.hypot(i, j) / R2;
              if (dd > 1 || hashPx(X0 + i, Y0 + j, 3021) < 0.12) continue; // (loose: single leaves at the edge)
              const lit = 0.3 + (1 - dd) * 0.25 - (i + j) / (R2 * 6) + (cy - y) / 40 + v * 0.25;
              img.px(X0 + i, Y0 + j, rampColor(CROWN, Math.max(0.02, Math.min(0.98, lit + 0.15)), X0 + i, Y0 + j));
            }
        }
      },
    });
    k.reserve(BX - 34, Y(BU + 66), 66, 70);
    // a concrete landing off the path at its foot, a group looking up into the roots
    img.fine(BX - 31, Y(BU - 1), 16, 7, (X, Yy) => rampColor([0x8a8676, 0x9e9a88, 0xb2ad9a, 0xc4bfac], 0.35 + hashPx(X >> 1, Yy >> 1, 3022) * 0.4, X, Yy));
    k.standing(BX - 29, Y(BU - 2) + 1, 11, 4, 5, 3005);
    // light falling through its crown in specks, drifting as the leaves move
    const fleck = k.sprite(4, 3, BU, (r2) => {
      for (let j = 0; j < 9; j++) for (let i = 0; i < 12; i++) {
        const d = Math.hypot((i - 5.5) / 6, (j - 4) / 4.5);
        if (d < 1) r2.px(i, j, 0xfff0b0, (1 - d) * 0.6);
      }
    }, false);
    const flecks = [];
    for (let q = 0; q < 18; q++) flecks.push([0, BX - 30 + gr() * 52, BU + 2 - gr() * 26, gr() * 6.28]);
    kit.wave([fleck], flecks, { w: 0.8, a0: 0, a1: 0.8, pw: 2 });
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
    return dl > 4 && dr > 4 && Math.abs(x - pathX(u)) > 4.6 && clear(x, u) && u < 2072 && hashPx(Math.round(x * 3), Math.round(u * 3), 318) < 0.3;
  });
  k.forest(0, W, 1770, G1 - 2, [SUN, SUN, PAND, SUN], 3007, 4.5, 7.5, (x, u) => {
    const fw = faceW(u);
    return (x - valleyL(u) < -fw - 2.5 || valleyR(u) - x < -fw - 2.5) && fw > 4;
  });
  // tree ferns (hego) standing up out of the undergrowth along the path
  for (let u = 1790; u < 2060; u += 9 + g() * 8) {
    const side = g() < 0.5 ? -1 : 1;
    const x = pathX(u) + side * (5 + g() * 3);
    if (!clear(x, u) || k.isRes(Math.round(x), Y(u))) continue;
    k.palm(x, Y(u), 3.4 + g() * 1.2, Math.floor(g() * 1e8));
  }
  // mossy boulders fallen from the walls, low ferns spread over the floor, specks of sun breaking through
  for (let q = 0; q < 40; q++) {
    const u = 1790 + g() * 270;
    const side = g() < 0.5;
    const x = side ? valleyL(u) + 2 + g() * 10 : valleyR(u) - 2 - g() * 10;
    if (!clear(x, u) || Math.abs(x - pathX(u)) < 6 || k.anyRes(x - 3, Y(u) - 2, 6, 4)) continue;
    k.boulder(x, u, 2 + g() * 2.6, 1.5 + g() * 1.6, 3100 + q, 0.9);
  }
  for (let q = 0; q < 260; q++) {
    const u = 1785 + g() * 285;
    const x = valleyL(u) + 2 + g() * (valleyR(u) - valleyL(u) - 4);
    if (Math.abs(x - pathX(u)) < 3.5 || !clear(x, u)) continue;
    const X = Math.round(x * S);
    const Yy = Math.round(Y(u) * S);
    const n = 5 + Math.floor(g() * 4);
    const len = 4 + g() * 6;
    const c = [0x2a6a2c, 0x3a8236, 0x4e9a40][Math.floor(g() * 3)];
    for (let f = 0; f < n; f++) {
      const a2 = (f / n) * 6.283 + g() * 0.4;
      for (let q2 = 0; q2 < len; q2++) img.px(Math.round(X + Math.cos(a2) * q2), Math.round(Yy + Math.sin(a2) * q2 * 0.6), q2 % 2 ? c : scaleColor(c, 1.2));
    }
  }
  const sun = k.sprite(8, 5, 1900, (r2) => {
    for (let j = 0; j < 15; j++) for (let i = 0; i < 24; i++) {
      const d = Math.hypot((i - 11.5) / 12, (j - 7) / 7.5) + (hashPx(i >> 1, j >> 1, 3020) - 0.5) * 0.3;
      if (d < 1) r2.px(i, j, 0xfff4c0, (1 - d) * 0.45);
    }
  }, false);
  const suns = [];
  for (let q = 0; q < 22; q++) {
    const u = 1795 + g() * 260;
    suns.push([0, valleyL(u) + 4 + g() * (valleyR(u) - valleyL(u) - 16), u, g() * 6.28]);
  }
  kit.wave([sun], suns, { w: 0.5, a0: 0, a1: 0.75, pw: 2 });
  // elephant ears (big heart-shaped leaves, bright, veined) in clumps by the path and round the banyan's foot
  const ear = (cx, cy, n, size, seed) => {
    const er = rng(seed);
    objects.push({
      y: cy + 1.5,
      draw: () => {
        for (let q = 0; q < n; q++) {
          const a2 = -Math.PI / 2 + (er() - 0.5) * 2.6;
          const len = size * (0.7 + er() * 0.5);
          const lx = cx + Math.cos(a2) * len * 0.45;
          const ly = cy + Math.sin(a2) * len * 0.35;
          img.fine(lx - len, ly - len, len * 2, len * 2, (X, Yy, x, y) => {
            const dx = x - lx;
            const dy = y - ly;
            const qa = dx * Math.cos(a2) + dy * Math.sin(a2);
            const qb = -dx * Math.sin(a2) + dy * Math.cos(a2);
            const half = len * 0.55 * Math.sqrt(Math.max(0, 1 - ((qa / len) * 1.15) ** 2)) * (qa < -len * 0.6 ? 0.6 : 1);
            if (Math.abs(qb) > half) return null;
            if (Math.abs(qb) < 0.18) return 0xb8d890; // the midrib
            if (Math.abs((qa * 1.6 + Math.abs(qb)) % 1.4) < 0.14) return 0x5a9a3a; // the veins
            return qb < 0 ? 0x62aa42 : 0x4a8a34;
          });
        }
      },
    });
  };
  for (let q = 0; q < 34; q++) {
    const u = 1790 + g() * 275;
    const x = pathX(u) + (g() < 0.5 ? -1 : 1) * (5 + g() * 6);
    if (!clear(x, u) || k.anyRes(x - 2, Y(u) - 2, 4, 3) || x < valleyL(u) + 2 || x > valleyR(u) - 2) continue;
    ear(x, Y(u), 3 + Math.floor(g() * 3), 3 + g() * 2.5, 3200 + q);
  }
  for (const dx of [-26, -18, 14, 22]) ear(BX + dx, Y(BU - 3), 4, 4.2, 3260 + dx);
  // bird's-nest ferns and pothos growing out of the walls
  for (let q = 0; q < 40; q++) {
    const u = 1790 + g() * 280;
    const side = g() < 0.5 ? -1 : 1;
    const fw = faceW(u);
    const x = side < 0 ? valleyL(u) - fw * (0.2 + g() * 0.6) : valleyR(u) + fw * (0.2 + g() * 0.6);
    const X = Math.round(x * S);
    const Yy = Math.round(Y(u) * S);
    const n = 9 + Math.floor(g() * 5);
    for (let f = 0; f < n; f++) {
      const a2 = (f / n) * 6.283;
      const len = 5 + g() * 6;
      for (let q2 = 0; q2 < len; q2++) for (const w of [0, 1]) img.px(Math.round(X + Math.cos(a2) * q2 + w * Math.sin(a2)), Math.round(Yy + Math.sin(a2) * q2 * 0.7), q2 < 2 ? 0x2a5a24 : w ? 0x5aa83a : 0x7cc44c);
    }
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
  // the halls in turn: a dry hall of stalagmites at the mouth; the Blue Spring, half its floor glowing water between shelves
  // of flowstone; the falls; the forest of spears, dry; the cascade of rimstone pools down to the way out
  const SPRING = [2172, 2296];
  const CASCADE = [2452, 2540];
  const springW = (u) => smooth(SPRING[0], SPRING[0] + 22, u) * (1 - smooth(SPRING[1] - 20, SPRING[1], u));
  const padClear = (x, u, m) => pads.every((p) => Math.hypot(p.x - x, p.u - u) > m);
  const inside = (x, u, m) => x > caveL(u) + m && x < caveR(u) - m;
  const terraceAt = (x, u) => {
    const n = (fbm(x, u, { seed: 342, scale: 8 }) - 0.5) * 10;
    return u > CASCADE[0] + n && u < CASCADE[1] - n * 0.5 && inside(x, u, 2.5) && padClear(x, u, 13);
  };
  /** Water: the river, and the pools of the Blue Spring (a few small ones in the other halls). */
  const wetAt = (x, u) => {
    if (!inside(x, u, 2.5) || !padClear(x, u, 13)) return false;
    if (riverW(u) > 0 && Math.abs(x - riverX(u)) < riverW(u)) return true;
    if (u < SPRING[0] + 2 || terraceAt(x, u)) return false;
    const thr = u > 2336 && u < CASCADE[0] ? 0.72 : 0.7 - 0.27 * springW(u);
    return fbm(x, u, { seed: 360, scale: 13, octaves: 3 }) > thr;
  };
  const nearWalk = (x, u, m) => Math.abs(x - walkX(u)) < m;
  const nearWater = (x, u, m) => wetAt(x, u) || wetAt(x + m, u) || wetAt(x - m, u) || wetAt(x, u + m) || wetAt(x, u - m);
  const free = (x, u, r) => inside(x, u, r + 1) && !nearWalk(x, u, r + 4) && !nearWater(x, u, r + 1.5) && !terraceAt(x, u) && padClear(x, u, r + 13) && u > C0 + 14 + r && u < C1 - 22;

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
  const COLUMNS = [[132, 2168], [140, 2390], [96, 2440]];
  for (const [x, u] of COLUMNS) tryForm(x, u, 6.5, 16, 'column') || tryForm(x + 10, u + 6, 6.5, 16, 'column');
  // and in the Blue Spring, pillars rising straight out of the water
  for (const [x, u] of [[54, 2228], [140, 2258], [70, 2282]]) if (!nearWalk(x, u, 10)) forms.push({ x, u, r: 5.2, h: 16, kind: 'column', fk: 3, el: 1, ca: 1, sa: 0, wet: true });
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
    u < 2190 ? [0xffb048, 0xffd878] : u < 2290 ? [0xffb060, 0x4aa8ff, 0xffd090] : u < 2335 ? [0xa8dcff, 0xe0f4ff] : u < 2455 ? [0xffc050, 0x6a9aff, 0xe0ecff] : [0xff9a48, 0xffc860];
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
  // where the water is (river, pools, the cascade's basins), and how far every point is from it (fine pixels)
  const WET = new Uint8Array(FW * rows); // 1 river or pool, 2 a basin of the cascade, 3 the lip of a basin
  const LEVEL = new Float32Array(FW * rows);
  for (let j = 0; j < rows; j++) {
    const u = uOf(yTop * S + j);
    for (let X = 0; X < FW; X++) {
      const x = (X + 0.5) / S;
      const i = j * FW + X;
      if (terraceAt(x, u)) {
        // rimstone: little dams of calcite holding pools, stepping down towards the way out
        const v = fbm(x, u * 1.2, { seed: 333, scale: 16, octaves: 2 }) + (u - CASCADE[0]) * 0.008;
        const ring = (v * 4.5) % 1;
        LEVEL[i] = Math.floor(v * 4.5);
        WET[i] = ring > 0.88 ? 3 : 2;
      } else if (wetAt(x, u)) WET[i] = 1;
    }
  }
  /** Chamfer distance (fine pixels) from every pixel to the nearest one where `seed` is true. */
  const distance = (seed) => {
    const D = new Float32Array(FW * rows);
    for (let i = 0; i < D.length; i++) D[i] = seed(i) ? 0 : 1e6;
    const step = (i, j, di, dj, c) => {
      const jj = j + dj;
      const ii = (i % FW) + di;
      if (jj < 0 || jj >= rows || ii < 0 || ii >= FW) return;
      const q = jj * FW + ii;
      if (D[q] + c < D[i]) D[i] = D[q] + c;
    };
    for (let j = 0; j < rows; j++)
      for (let X = 0; X < FW; X++) {
        const i = j * FW + X;
        step(i, j, -1, 0, 1); step(i, j, 0, -1, 1); step(i, j, -1, -1, 1.414); step(i, j, 1, -1, 1.414);
      }
    for (let j = rows - 1; j >= 0; j--)
      for (let X = FW - 1; X >= 0; X--) {
        const i = j * FW + X;
        step(i, j, 1, 0, 1); step(i, j, 0, 1, 1); step(i, j, 1, 1, 1.414); step(i, j, -1, 1, 1.414);
      }
    return D;
  };
  const DW = distance((i) => WET[i] === 1 || WET[i] === 2); // how far from the water (on dry rock)
  const DI = distance((i) => WET[i] !== 1 && WET[i] !== 2); // how deep in (in the water)
  for (let j = 0; j < rows; j++) {
    const Yy = yTop * S + j;
    const u = uOf(Yy);
    const cl = caveL(u);
    const cr = caveR(u);
    for (let X = 0; X < FW; X++) {
      const x = (X + 0.5) / S;
      const i = j * FW + X;
      let h = fbm(x, u, { seed: 331, scale: 2.2, octaves: 2 }) * 0.6;
      let kind = 0;
      const wd = Math.max(cl - x, x - cr);
      const dw = DW[i] / S;
      if (wd > 0) {
        h += 2 + wd * 1.4 + fbm(x, u, { seed: 332, scale: 1.6, octaves: 2 }) * 3;
        kind = 1;
      } else if (WET[i] === 1) {
        h = -0.8;
        kind = 3;
      } else if (WET[i] >= 2) {
        h = 0.2 + LEVEL[i] * 0.3 + (WET[i] === 3 ? 0.5 : 0);
        kind = WET[i] === 3 ? 5 : 4;
      } else if (dw < 5.5) {
        // the shelves of flowstone round the water: a raised lip at its edge, smooth lobes rising behind
        const lip = dw < 1.2 ? 1.1 * (1 - Math.abs(dw - 0.6) / 0.6) : 0;
        h = 0.3 + lip + smooth(1, 5, dw) * (1.3 + (fbm(x, u, { seed: 362, scale: 4 }) - 0.5) * 1.2);
        kind = 7;
      }
      const cell = grid.get(Math.floor(u / CELL) * gw + Math.floor(x / CELL));
      if (cell && (kind !== 3 || cell.some((f) => f.wet)))
        for (const f of cell) {
          if (kind === 3 && !f.wet) continue;
          const ex = x - f.x;
          const eu = u - f.u;
          const qa = (ex * f.ca + eu * f.sa) / f.el;
          const qb = -ex * f.sa + eu * f.ca;
          let d = f.kind === 'block' ? (Math.max(Math.abs(qa), Math.abs(qb)) * 0.6 + Math.hypot(qa, qb) * 0.5) + (fbm(x * 2, u * 2, { seed: 345, scale: 1.2 }) - 0.5) * f.r * 0.5 : Math.hypot(qa, qb);
          if (f.kind === 'mite' || f.kind === 'spear') d += (fbm(x * 2, u * 2, { seed: 346, scale: 1.5 }) - 0.5) * f.r * 0.25; // knobbly
          if (d >= f.r) continue;
          const t = 1 - d / f.r;
          if (f.kind !== 'dome') {
            // (the stalagmites, columns and blocks stand up out of the floor: drawn in 3/4 further on; here only the
            // floor darkening round their feet)
            if (kind !== 1) AO[i] = Math.max(AO[i], Math.min(1, t * 2.2));
            continue;
          }
          const fh = f.h * Math.sqrt(1 - (1 - t) ** 2);
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
      if (kind === 3 || kind === 4) alb = 0x0a2a44;
      else if (kind === 5) alb = 0xf4c880;
      else if (kind === 7) {
        // flowstone shelves, amber and cream in rings, wet and smooth
        const band = (h * 1.6 + fbm(x, u, { seed: 363, scale: 3 }) * 0.9) % 1;
        alb = band < 0.22 ? 0xb87436 : band < 0.6 ? 0xeab46a : band < 0.78 ? 0xd08c48 : 0xf8d8a0;
      }
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
      if (kind !== 3 && kind !== 4 && kind !== 5) {
        // the glow of the water thrown up on the rock beside it
        const bnc = 0.7 * Math.exp(-DW[i] / (S * 2.4));
        lr += 0.25 * bnc;
        lg += 0.78 * bnc;
        lb += 0.95 * bnc;
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
      if (kind === 3 || kind === 4) {
        // the water lights itself from below: milky turquoise in the shallows over the white calcite, deeper blue
        // in the middle; the bottom showing through, a net of light rippling over it, the walkway's shadow across it
        const depth = DI[i] / S + (kind === 4 ? 0.4 + (LEVEL[i] % 3) * 0.3 : 0);
        let c = depth < 1.6 ? mix(0xe4fcff, 0x5ad8f2, depth / 1.6) : mix(0x5ad8f2, 0x1878c0, smooth(1.6, 7, depth));
        const pebble = fbm(x * 3, u * 3, { seed: 364, scale: 1.4, octaves: 2 });
        c = scaleColor(c, 0.88 + pebble * 0.24);
        if (Math.abs(fbm(x * 1.4, u * 1.4, { seed: 365, scale: 2, octaves: 2 }) - 0.5) < 0.03) c = mix(c, 0xffffff, 0.35);
        const glow = Math.min(1.25, 0.72 + 0.25 * (lr + lg + lb - 0.4));
        const shadow = Math.abs(x - walkX(u) - 2.6) < 1.6 ? 0.55 : 1;
        r = ((c >> 16) & 255) * glow * shadow;
        gg = ((c >> 8) & 255) * glow * shadow;
        b = (c & 255) * glow * shadow;
      } else if (kind === 5) {
        // the lip of a basin: a crisp dam of calcite, lit warm and blue from the pools either side
        const w2 = 0.75 + 0.3 * smooth(0.2, 1.4, lr + lg);
        r = Math.min(255, 238 * w2);
        gg = Math.min(255, 186 * w2);
        b = Math.min(255, 118 * w2);
      }
      // a wet sparkle where the light is strong
      if (kind !== 3 && kind !== 4 && (lr + lg + lb) > (kind === 2 ? 0.9 : 1.2) && hashPx(X, Yy, 337) > (kind === 2 ? 0.984 : 0.992)) {
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

  // ------------------------------------------------------------ standing formations, in 3/4 like the rest of the game: every
  // stalagmite a cone rising from its foot (lit on whichever side faces a lamp, growth rings round it, drip streaks down
  // it, a wet drop shining at its tip), the columns as pillars climbing into the dark of the roof, fallen blocks squat
  // and angular; draperies standing along the feet of the walls. Drawn back to front, so the nearer cover the farther.
  const lightAt = (px, py, pz, nx, ny, nz) => {
    let lr = 0.1;
    let lg = 0.1;
    let lb = 0.14;
    const cand = lgrid.get(Math.floor(py / LCELL) * lgw + Math.floor(px / LCELL));
    if (cand)
      for (const l of cand) {
        if (l.water) continue;
        const dx = l.x - px;
        const dy = l.y - py;
        const d = Math.hypot(dx, dy);
        if (d >= l.r * 1.15) continue;
        const dz = l.z - pz;
        const dd = Math.hypot(dx, dy, dz) || 1;
        const lam = Math.max(0, (nx * dx + ny * dy + nz * dz) / dd);
        const f = Math.max(0, 1 - d / (l.r * 1.15)) ** 1.4 * l.k * (0.15 + 0.95 * lam);
        lr += l.c[0] * f;
        lg += l.c[1] * f;
        lb += l.c[2] * f;
      }
    return [lr, lg, lb];
  };
  const fineAt = (x, y) => {
    const X = Math.floor(x * S);
    const j = Math.floor(y * S) - yTop * S;
    return j >= 0 && j < rows && X >= 0 && X < FW ? j * FW + X : -1;
  };
  const standing = forms.filter((f) => f.kind !== 'dome').sort((a, b) => b.u - a.u); // (the farthest, highest up the strip, first)
  for (const f of standing) {
    const by = Y(f.u); // the foot, on the screen's y
    const r = f.r * (f.kind === 'block' ? 1 : 0.92);
    const Hv = f.kind === 'column' ? 30 : f.kind === 'block' ? f.h * 0.9 : f.h * (f.kind === 'spear' ? 1.05 : 0.95);
    const lean = (hashPx(Math.round(f.x * 7), Math.round(f.u * 7), 370) - 0.5) * (f.kind === 'spear' ? 0.25 : 0.5);
    const near = fineAt(f.x, by);
    const bounce = near >= 0 ? 0.6 * Math.exp(-DW[near] / (S * 2.4)) : 0;
    const wet = f.wet;
    const prof = (t) => f.kind === 'column' ? 0.62 + 0.38 * (1 - t) ** 3 + 0.25 * t ** 4 : f.kind === 'block' ? 1 - t ** 4 : (1 - t) ** (f.kind === 'spear' ? 0.75 : 0.95);
    const X0 = Math.floor((f.x - r * 1.4 - Math.abs(lean) * Hv * 0.2) * S);
    const X1 = Math.ceil((f.x + r * 1.4 + Math.abs(lean) * Hv * 0.2) * S);
    const Y0 = Math.floor((by - Hv - 1) * S);
    const Y1 = Math.ceil((by + r * 0.55) * S);
    // its shadow on the floor, thrown down and away a little
    for (let Yy = Math.floor(by * S); Yy <= Y1 + 2; Yy++)
      for (let X = X0; X <= X1 + 4; X++) {
        const dx = X / S - f.x - 0.8;
        const dy = Yy / S - by - 0.3;
        if ((dx / (r * 1.2)) ** 2 + (dy / (r * 0.6)) ** 2 < 1) img.tintPx(X, Yy, wet ? 0.8 : 0.6);
      }
    for (let Yy = Y0; Yy <= Y1; Yy++)
      for (let X = X0; X <= X1; X++) {
        const dy = (Yy + 0.5) / S - by; // negative up the formation
        const t = Math.max(0, Math.min(1, -dy / Hv));
        const cx = f.x + lean * t * Hv * 0.2;
        const knob = f.kind === 'column' ? 1 + 0.08 * Math.sin(-dy * 1.7 + f.x) : 1 + 0.16 * (fbm(f.x * 3 + X * 0.2, -dy * 0.8, { seed: 371, scale: 1.4 }) - 0.5);
        const w = r * prof(t) * knob;
        const dx = (X + 0.5) / S - cx;
        let inBody = dy <= 0 && dy >= -Hv && Math.abs(dx) <= w;
        const inFoot = (dx / r) ** 2 + (dy / (r * 0.5)) ** 2 <= 1;
        if (!inBody && !inFoot) continue;
        if (f.kind === 'column' && t > 0.7 && hashPx(X, Yy, 372) > 1 - (t - 0.7) * 2.4) continue; // into the dark above
        // the surface: round across, leaning back, facing the viewer
        const s2 = Math.max(-1, Math.min(1, dx / Math.max(0.3, inBody ? w : r)));
        const nx = s2;
        const ny = Math.sqrt(Math.max(0, 1 - s2 * s2)) * 0.85;
        const nz = inBody ? (f.kind === 'column' ? 0.15 : 0.45) : 0.9;
        const pz = inBody ? t * Hv * 1.2 : 0;
        const [lr, lg, lb] = lightAt(cx + dx, by, pz, nx, ny, nz);
        // its stone: cream, paler up the cone, rings of growth, streaks where the drips run down, rust stains
        let alb;
        if (f.kind === 'block') alb = rampColor([0x5e5448, 0x766a5a, 0x8e806c, 0xa49680], 0.35 + t * 0.4 + (hashPx(X >> 1, Yy >> 1, 373) - 0.5) * 0.3, X, Yy);
        else {
          alb = rampColor([0xa89676, 0xc8b894, 0xe2d4b2, 0xf6ecd4], 0.3 + t * 0.55 + (hashPx(X >> 1, Yy >> 1, 374) - 0.5) * 0.15, X, Yy);
          if ((t * (f.kind === 'column' ? 14 : 6) + fbm(X * 0.1, 0, { seed: 375, scale: 2 })) % 1 < 0.12) alb = scaleColor(alb, 0.84);
          if (hashPx(X, 0, 376) < 0.12) alb = scaleColor(alb, 0.9); // the drip streaks, top to bottom
          if (fbm(f.x * 5 + dx, -dy, { seed: 377, scale: 2.5 }) > 0.64) alb = mix(alb, 0xc8884a, 0.4);
        }
        let rr = ((alb >> 16) & 255) * (lr + bounce * 0.25);
        let gg = ((alb >> 8) & 255) * (lg + bounce * 0.75);
        let bb = (alb & 255) * (lb + bounce * 0.95);
        // the outline against what is behind: a thin darker edge, and the rim of light on the lit side
        if (inBody && Math.abs(dx) > w - 0.34) {
          rr *= 0.7;
          gg *= 0.7;
          bb *= 0.7;
        }
        if (inBody && f.kind !== 'block' && t > 0.9 && Math.abs(dx) < 0.5 && f.kind !== 'column') {
          rr = 255;
          gg = 250;
          bb = 235; // the drop at the tip
        }
        img.px(X, Yy, (Math.min(255, Math.round(rr)) << 16) | (Math.min(255, Math.round(gg)) << 8) | Math.min(255, Math.round(bb)));
      }
    if (wet)
      // where a pillar stands in the water: a ring of ripples lit from below
      for (let a = 0; a < 6.3; a += 0.04) img.px(Math.round((f.x + Math.cos(a) * r * 1.25) * S), Math.round((by + Math.sin(a) * r * 0.62) * S), 0xd8faff, 0.7);
  }
  // draperies: thin curtains of calcite standing along the feet of the walls, light glowing through their folds
  for (let u = C0 + 30; u < C1 - 30; u += 0.34) {
    for (const side of [-1, 1]) {
      if (fbm(side * 50, u, { seed: 378, scale: 9 }) < 0.5) continue;
      const foot = side < 0 ? caveL(u) + 0.3 : caveR(u) - 0.3;
      const y = Y(u);
      const near = fineAt(foot - side * 1.5, y);
      if (near < 0 || KIND[near] === 3 || KIND[near] === 4) continue;
      const hh = 4 + fbm(side * 9, u, { seed: 379, scale: 3 }) * 9;
      const fold = (u * 2.3 + fbm(side, u, { seed: 380, scale: 1.2 }) * 2) % 1;
      const X = Math.round((foot - side * (0.4 + fold * 1.4)) * S);
      const [lr, lg, lb] = lightAt(foot - side * 2, y, 3, -side * 0.6, 0.6, 0.3);
      for (let q = 0; q < hh * S; q++) {
        const tq = q / (hh * S);
        const band = fold < 0.25 ? 0.62 : fold < 0.6 ? 1.05 : 0.85;
        const c = mix(0xf0d098, 0xd89058, tq * 0.6);
        const k2 = band * (1 - tq * 0.35);
        img.px(X, Math.round(y * S) - q, (Math.min(255, ((c >> 16) & 255) * lr * k2) << 16) | (Math.min(255, ((c >> 8) & 255) * lg * k2) << 8) | Math.min(255, (c & 255) * lb * k2), 0.85 - tq * 0.4);
      }
    }
  }

  // ------------------------------------------------------------ the glow: whatever is bright (the water, the lamps, the lit tips)
  // bleeds a soft light round itself, as it does in the real cave (worked out at a third of the resolution, blurred, added)
  {
    const LW = W;
    const LH = C1 - C0;
    const glow = [new Float32Array(LW * LH), new Float32Array(LW * LH), new Float32Array(LW * LH)];
    for (let j = 0; j < LH; j++)
      for (let x = 0; x < LW; x++) {
        let r = 0;
        let gg = 0;
        let b = 0;
        for (let q = 0; q < 9; q++) {
          const c = img.rgbaPx(x * S + (q % 3), (yTop + j) * S + Math.floor(q / 3));
          if (!c) continue;
          const lum = 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
          const k2 = Math.max(0, lum - 120) / 135;
          r += c[0] * k2;
          gg += c[1] * k2;
          b += c[2] * k2;
        }
        glow[0][j * LW + x] = r / 9;
        glow[1][j * LW + x] = gg / 9;
        glow[2][j * LW + x] = b / 9;
      }
    const blur = (a, rad) => {
      const t = new Float32Array(a.length);
      for (let pass = 0; pass < 3; pass++) {
        for (let j = 0; j < LH; j++) {
          let acc = 0;
          for (let x = -rad; x <= rad; x++) acc += a[j * LW + Math.max(0, Math.min(LW - 1, x))];
          for (let x = 0; x < LW; x++) {
            t[j * LW + x] = acc / (2 * rad + 1);
            acc += a[j * LW + Math.min(LW - 1, x + rad + 1)] - a[j * LW + Math.max(0, x - rad)];
          }
        }
        for (let x = 0; x < LW; x++) {
          let acc = 0;
          for (let j = -rad; j <= rad; j++) acc += t[Math.max(0, Math.min(LH - 1, j)) * LW + x];
          for (let j = 0; j < LH; j++) {
            a[j * LW + x] = acc / (2 * rad + 1);
            acc += t[Math.min(LH - 1, j + rad + 1) * LW + x] - t[Math.max(0, j - rad) * LW + x];
          }
        }
      }
    };
    for (const ch of glow) blur(ch, 3);
    for (let Yy = yTop * S; Yy < (yTop + LH) * S; Yy++)
      for (let X = 0; X < FW; X++) {
        const c = img.rgbaPx(X, Yy);
        if (!c || !c[3]) continue;
        // (bilinear from the third-resolution glow)
        const gx = Math.max(0, Math.min(LW - 1.001, (X + 0.5) / S - 0.5));
        const gy = Math.max(0, Math.min(LH - 1.001, (Yy + 0.5) / S - 0.5 - yTop));
        const x0 = Math.floor(gx);
        const y0 = Math.floor(gy);
        const fx = gx - x0;
        const fy = gy - y0;
        const at2 = (a) => a[y0 * LW + x0] * (1 - fx) * (1 - fy) + a[y0 * LW + x0 + 1] * fx * (1 - fy) + a[(y0 + 1) * LW + x0] * (1 - fx) * fy + a[(y0 + 1) * LW + x0 + 1] * fx * fy;
        const k2 = 0.9;
        img.setRGBAPx(X, Yy, Math.min(255, c[0] + at2(glow[0]) * k2), Math.min(255, c[1] + at2(glow[1]) * k2), Math.min(255, c[2] + at2(glow[2]) * k2), c[3]);
      }
  }

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

  // ------------------------------------------------------------ the roof's great draperies, and beams of light through the air
  {
    const curtain = (c, seed) => k.sprite(34, 30, 2300, (r2) => {
      const g2 = rng(seed);
      const folds = 9 + Math.floor(g2() * 5);
      for (let q = 0; q < folds; q++) {
        const x0 = 6 + (q / folds) * 90 + g2() * 6;
        const len = 30 + g2() * 55;
        const wv = 4 + g2() * 6;
        for (let j = 0; j < len; j++) {
          const t = j / len;
          const half = wv * (1 - t * 0.7);
          const sway = Math.sin(j / 9 + q) * 2;
          for (let i = -half; i <= half; i++) {
            const a = 1 - Math.abs(i) / (half + 0.5);
            const band = ((j + q * 7) % 11) < 2 ? 0.72 : 1;
            const lit = (0.45 + 0.55 * a) * band * (0.6 + t * 0.5);
            const col = mix(ROOF[3], c, Math.min(1, t * 1.2));
            r2.px(x0 + i + sway, j, scaleColor(col, lit), Math.min(1, 0.95 - t * 0.25));
          }
          if (j === Math.floor(len) - 1) r2.px(x0 + sway, j + 1, 0xfff4d8, 0.9);
        }
      }
      for (let i = 0; i < 102; i++) for (let j = 0; j < 8 + Math.sin(i / 7) * 4; j++) r2.px(i, j, rampColor(ROOF, 0.1 + j * 0.04, i, j)); // the rock they hang from
    }, false);
    const curtains = {};
    for (let q = 0; q < 9; q++) {
      const u = C0 + 70 + q * ((C1 - C0 - 130) / 8) + rr() * 14;
      const x = q % 2 ? 4 + rr() * 30 : W - 38 - rr() * 30;
      const c = HALL(u)[0];
      curtains[c] ??= curtain(c, 4200 + q);
      kit.loop(x, u + 15, [curtains[c]], { z: 0.6, ax: 90, au: u, d: 0.965, a: 0.95 });
    }
    // beams of the floods, slanting down through the damp air
    const beam = (c) => k.sprite(20, 50, 2300, (r2) => {
      for (let j = 0; j < 150; j++)
        for (let i = 0; i < 60; i++) {
          const cx = 10 + j * 0.27;
          const half = 4 + j * 0.09;
          const a = Math.max(0, 1 - Math.abs(i - cx) / half) * Math.min(1, j / 20) * Math.max(0, 1 - j / 150);
          if (a > 0.02) r2.px(i, j, c, a * 0.32);
        }
    }, false);
    const beams = {};
    for (let q = 0; q < 10; q++) {
      const u = C0 + 50 + rr() * (C1 - C0 - 100);
      const x = 10 + rr() * (W - 40);
      const c = HALL(u)[q % HALL(u).length];
      beams[c] ??= beam(c);
      kit.loop(x, u + 30, [beams[c]], { z: 0.35, ax: 90, au: u + 10, d: 0.955, a: 0.8 });
    }
  }

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
  const ring = [5, 8, 11].map((r) => k.sprite(r / 1.5 + 2, r / 3 + 2, 2300, (q) => {
    for (let a = 0; a < 6.3; a += 0.06) q.px(r + 3 + Math.cos(a) * r, r / 2 + 3 + Math.sin(a) * r * 0.5, 0xd8f4ff, 0.7);
  }, false));
  const glint = k.sprite(5, 2, 2300, (r) => {
    for (let i = 0; i < 15; i++) for (let j = 0; j < 6; j++) if (Math.abs(j - 3) < 2 - Math.abs(i - 7) / 5) r.px(i, j, 0xc8f4ff, 0.8);
  }, false);
  const glints = [];
  for (let u = RIVER[0] + 8; u < RIVER[1] - 6; u += 11) glints.push([0, riverX(u) - 2.5, u, (u * 0.37) % 6.28]);
  kit.wave([glint], glints, { w: 1.6, a0: 0, a1: 0.9, pw: 3 });
  // light rippling over the pools: nets of brightness swelling and fading, out of step with one another
  const caustic = [0, 1, 2].map((v) => k.sprite(18, 14, 2240, (r) => {
    for (let j = 0; j < 42; j++)
      for (let i = 0; i < 54; i++) {
        const n = Math.abs(fbm(i / 3 + v * 40, j / 3, { seed: 366, scale: 2.2, octaves: 2 }) - 0.5);
        const edge = Math.min(1, Math.min(i, 53 - i, j, 41 - j) / 10);
        if (n < 0.05) r.px(i, j, 0xf0ffff, (1 - n / 0.05) * 0.75 * edge);
      }
  }, false));
  const ripples = [];
  for (let q = 0; q < 400 && ripples.length < 46; q++) {
    const x = 8 + g() * (W - 16);
    const u = C0 + 60 + g() * (C1 - C0 - 80);
    const i = Math.floor((Y(u) - yTop) * S) * FW + Math.floor(x * S);
    if ((WET[i] === 1 || WET[i] === 2) && DI[i] / S > 2.5) ripples.push([ripples.length % 3, x - 9, u + 7, g() * 6.28]);
  }
  kit.wave(caustic, ripples, { w: 0.9, a0: 0.05, a1: 0.7, pw: 2 });
  // drips falling from the roof into the pools: rings spreading; a mist hanging low over the water; motes of light drifting
  const dripRects = [];
  const mistAt = [];
  for (let q = 0; q < 900 && dripRects.length < 30; q++) {
    const x = 10 + g() * (W - 20);
    const u = C0 + 40 + g() * (C1 - C0 - 70);
    const i = Math.floor((Y(u) - yTop) * S) * FW + Math.floor(x * S);
    if ((WET[i] === 1 || WET[i] === 2) && DI[i] / S > 3) {
      dripRects.push([x - 4, u + 4, 8, 8]);
      if (dripRects.length % 3 === 0) mistAt.push([x, u]);
    }
  }
  kit.spot(dripRects, ring, { rate: 4, fps: 7, a: 0.85 });
  const mist = [10, 14, 18].map((r2) => [0, 1].map((v) => kit.frame(puff(r2, r2 * 3 + v + 61, [0x7ab8c8, 0x9ad0dc, 0xbce4ec, 0xdcf4f8]))));
  for (const [x, u] of mistAt) kit.emit(x, u - 2, mist, { rate: 0.5, life: [4, 6], vy: 1.5, sx: 6, wf: 0.3, a: 0.16 });
  const mote = k.sprite(2, 2, 2300, (r2) => {
    for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) {
      const d = Math.hypot(i - 2.5, j - 2.5) / 3;
      if (d < 1) r2.px(i, j, 0xfff6d8, (1 - d) ** 1.5);
    }
  }, false);
  for (let q = 0; q < 14; q++) kit.wander(20 + g() * (W - 40), C0 + 40 + g() * (C1 - C0 - 80), 16, 22, [mote], { n: 3, sp: 2.5, turn: 'none', fps: 1, idle: 0.1, a: 0.75 });
  kit.spot([[riverX(2215) - 6, 2236, 10, 40], [30, 2504, 30, 40]], ring, { rate: 2.2, fps: 6, a: 0.8 });
  // the motion-sensor lights: soft colour washing over the great columns, one hue into the next
  const wash = [0xffb848, 0x9ae8ff, 0x5a8aff].map((c) => k.sprite(28, 28, 2300, (r) => {
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
