// The arena of encounter 3 (ex3): a namazu-e. After the Ansei earthquake of 1855, Edo was flooded with prints of the
// giant catfish (namazu) that lives under the land and shakes it when the god holding it down looks away, pinned
// by the kaname-ishi stone, townsfolk pulling on its whiskers (long in the public domain). Here a building site in
// an Edo street of grey-tiled roofs has dug down onto it: its huge back in the mud of the pit, the stone on its
// head with its sacred rope, its whiskers trailing out across the site with little figures hauling on them,
// cracks running out into the town. The strip creeps up through the fight. What moves: the mallets coming down on its head, a sheen running out along
// its whiskers as it twitches them, its eyes blinking, bubbles in the pit's mud, dust off the cracks, hearth smoke over
// the roofs.
import { Raster, fbm, rng, mix, scaleColor } from '../../lib/raster.mjs';
import { rampColor, grade } from '../nature.mjs';
import { tintTable, PropKit } from '../props.mjs';

export const S = 3;
const W = 180;
const L = 896;
const FW = W * S;
const FH = L * S;

const TILE = [0x3a3c44, 0x50545e, 0x6a6e7a, 0x8a8e9a];
const EARTH = [0x6a5038, 0x8a6a48, 0xa88a62, 0xc4a87e];
const MUD = [0x1e1a14, 0x2e281e, 0x403828, 0x5a4e38];
const FISH = [0x101a1c, 0x1c2a2c, 0x2a3e40, 0x46605e, 0x7a948a];
const INK = 0x1a1420;

export function buildFar() {
  const r = new Raster(FW, 1152);
  for (let y = 0; y < r.h; y++) for (let x = 0; x < FW; x++) r.set(x, y, rampColor(TILE, 0.4 + (fbm(x, y, { seed: 3, scale: 30, periodX: FW, periodY: 1152 }) - 0.5) * 0.3, x, y));
  return r;
}

// smooth ramps (no dither at 540 px)
const ROOF = [0x2a2c34, 0x3e424c, 0x565a66, 0x747884, 0x9a9eaa];
const LANE = [0x6a5438, 0x8a7050, 0xa88a64, 0xc4a87e, 0xdcc49a];
const DIRT = [0x3a2c1c, 0x54402a, 0x6e563a, 0x8a6e4c, 0xa88a64];
const SLIME = [0x1e2418, 0x34402a, 0x4e5a38, 0x6e7a4a, 0x9aa06a]; // the catfish's olive-brown hide
const STONE = [0x4a4844, 0x6a6862, 0x8e8a82, 0xb4b0a6, 0xd4d0c6];
const WOOD = [0x5a4028, 0x7a5a38, 0x9a7a50, 0xbc9c6c, 0xdcc090];
function sm(r, v) {
  const t = Math.max(0, Math.min(r.length - 1.0001, v * (r.length - 1)));
  const i = Math.floor(t);
  return mix(r[i], r[i + 1], t - i);
}

/**
 * The strip: an Edo town from above, blocks of houses under grey tiled roofs (rows of round tiles, ridges, the
 * eaves' shadow on the lanes), wells and pines in the yards, people about; in the middle the building site behind its
 * plank hoarding: churned earth, plank walkways, stacks of timber, a sand heap, a wheelbarrow; and the pit, shored
 * with planks, where the digging has come down onto the namazu: its broad flat head up out of the mud, little eyes,
 * pale lips, the kaname-ishi on its head with the sacred rope and paper streamers, its long whiskers out over the
 * hoarding with townsfolk hauling on them, others at it with mallets, as in the prints of 1855; cracks running out
 * into the town.
 */
export function buildMid() {
  const img = new Raster(FW, FH);
  const rand = rng(1855);
  const set = (x, y, c, a = 1) => img.set(x, y, c, a);
  const disc = (x, y, r, c, a = 1) => {
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r) set(x + i, y + j, c, a);
  };
  // ---- the town: blocks between the lanes, no two alike. A block is one of three kinds: long houses right across
  // it; two rows back to back with an alley between; or houses round a yard. Most roofs are grey tile, some wooden
  // shingle, a few thatch. One block is a temple's precinct.
  const SHINGLE = [0x2a2018, 0x4a3826, 0x6a5236, 0x8a6e4a, 0xa88a60];
  const KAYA = [0x4a3a1e, 0x6e5a30, 0x927a46, 0xb09a60, 0xc8b47c];
  const BW = 130;
  const BH = 170;
  const blockAt = (x, y) => {
    const by = Math.floor(y / BH);
    const off = (by % 2) * 60;
    return [Math.floor((x + off) / BW), by, (x + off) % BW, y % BH];
  };
  const TEMPLE = [2, 6];
  const isTemple = (bx, by) => bx === TEMPLE[0] && by === TEMPLE[1];
  const kindOf = (bx, by) => (isTemple(bx, by) ? 'temple' : ['long', 'long', 'long', 'rows', 'rows', 'rows', 'rows', 'yard', 'yard', 'long'][Math.floor(hashy(bx, by, 7) * 10)]);
  const matOf = (bx, by, house) => {
    const h = hashy(bx * 5 + house, by, 11);
    return h < 0.7 ? 0 : h < 0.88 ? 1 : 2; // tile, shingle, thatch
  };
  /** A gabled roof's colour: v across it (0 the eave in the light, 1 the one in shade), a px along the ridge, q px across. */
  const roofPx = (v, a, q, len, tone, mat, x, y) => {
    const ridge = Math.abs(v - 0.5) * len < 2;
    const base = v < 0.5 ? 0.78 - v * 0.7 : 0.3 + (v - 0.5) * 0.25;
    if (mat === 0) {
      if (ridge) return a % 9 < 3 ? 0xd8d4cc : ROOF[0]; // (the white ridge caps)
      if (a < 2) return ROOF[0];
      return sm(ROOF, base + (q % 6 < 1 ? -0.14 : a % 5 < 1 ? -0.06 : 0.03) + tone);
    }
    if (mat === 1) {
      if (ridge) return a % 12 < 2 ? SHINGLE[0] : SHINGLE[4]; // (a ridge board held down with battens)
      if (a < 2) return SHINGLE[0];
      return sm(SHINGLE, base + (q % 4 < 1 ? -0.14 : (a + ((q >> 2) % 2) * 3) % 7 < 1 ? -0.09 : 0.02) + tone + (fbm(x, y, { seed: 61, scale: 5 }) - 0.5) * 0.12);
    }
    if (ridge) return a % 10 < 2 ? 0x3a2c18 : KAYA[4]; // (bundles of reed along the ridge, tied down)
    if (a < 2) return KAYA[0];
    return sm(KAYA, base + (fbm(x * 0.6, y * 3, { seed: 63, scale: 4 }) - 0.5) * 0.3 + tone * 0.6 + (q < 3 || q > len - 4 ? -0.16 : 0));
  };
  for (let y = 0; y < FH; y++)
    for (let x = 0; x < FW; x++) {
      const [bx, by, lx, ly] = blockAt(x, y);
      const street = lx < 16 || ly < 18;
      const lane = () => sm(LANE, 0.55 + (fbm(x, y, { seed: 5, scale: 8 }) - 0.5) * 0.4);
      let c;
      if (street) {
        c = lane();
        // the eaves' shadow along the lane's sides, cart ruts down its middle
        if ((lx >= 10 && lx < 16) || (ly >= 12 && ly < 18)) c = mix(c, 0x14100a, 0.32);
        else if ((ly < 18 && (ly === 6 || ly === 10)) || (lx < 16 && ly >= 18 && (lx === 5 || lx === 9))) c = mix(c, 0x3a2a18, 0.22);
      } else {
        const X = lx - 16; // 0..113
        const Yl = ly - 18; // 0..151
        const kind = kindOf(bx, by);
        const tone = (h) => (hashy(bx, by, h) - 0.5) * 0.18;
        if (kind === 'temple') {
          // raked gravel inside the wall
          c = sm(STONE, 0.62 + (fbm(x, y, { seed: 71, scale: 3 }) - 0.5) * 0.2 + ((x + y) % 7 === 0 ? -0.05 : 0));
        } else if (kind === 'long') {
          const hw = 38 + ((hashy(bx, by, 1) * 3) | 0) * 4;
          const house = Math.floor(X / hw);
          c = roofPx(Yl / 152, X % hw, Yl, 152, tone(house), matOf(bx, by, house), x, y);
        } else if (kind === 'rows') {
          const row = Yl < 72 ? 0 : Yl >= 80 ? 1 : -1;
          if (row < 0) {
            // the alley between the rows: dark, a gutter down it, planks over the gutter
            c = mix(lane(), 0x14100a, Yl < 75 ? 0.5 : 0.28);
            if (Yl === 76) c = 0x2a3038;
            if (Yl === 76 && X % 24 < 6) c = sm(WOOD, 0.5);
          } else {
            const hw = 30 + ((hashy(bx, by, 3 + row) * 3) | 0) * 6;
            const house = Math.floor(X / hw) + row * 9;
            const q = Yl - row * 80;
            c = roofPx(q / 72, X % hw, q, 72, tone(house), matOf(bx, by, house), x, y);
          }
        } else {
          // round a yard: a row along the top and one along the bottom, a wing down each side
          if (Yl < 46) c = roofPx(Yl / 46, X % 38, Yl, 46, tone(Math.floor(X / 38)), matOf(bx, by, Math.floor(X / 38)), x, y);
          else if (Yl >= 106) c = roofPx((Yl - 106) / 46, X % 57, Yl - 106, 46, tone(5 + Math.floor(X / 57)), matOf(bx, by, 5 + Math.floor(X / 57)), x, y);
          else if (X < 34) c = roofPx(X / 34, Yl - 46, X, 34, tone(8), matOf(bx, by, 8), x, y);
          else if (X >= 80) c = roofPx((X - 80) / 34, Yl - 46, X - 80, 34, tone(9), matOf(bx, by, 9), x, y);
          else {
            // the yard: trodden earth, moss in its corners, the eaves' shadow down its top and left
            const n = fbm(x, y, { seed: 73, scale: 6 });
            c = sm(LANE, 0.42 + (n - 0.5) * 0.4);
            if (n > 0.56) c = mix(c, 0x4a6a3a, 0.5);
            if (Yl < 52 || X < 39) c = mix(c, 0x14100a, 0.3);
          }
        }
      }
      set(x, y, c);
    }
  // ---- what stands on the roofs and in the lanes, block by block
  const dark = (x, y, w, h, f = 0.7) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) img.tint(Math.round(x + i), Math.round(y + j), f);
  };
  const pineAt = (x, y, r) => {
    dark(x - r + 3, y - r + 4, r * 2, r * 2, 0.8);
    for (let j = -r; j <= r; j++)
      for (let i = -r; i <= r; i++)
        if (i * i + j * j <= r * r && fbm(x + i, y + j, { seed: 77, scale: 3 }) > 0.3 + (i * i + j * j) / (r * r * 3)) set(x + i, y + j, mix(0x1e3a22, 0x4a7a44, 0.5 - (i + j) / (r * 4) + (fbm(x + i, y + j, { seed: 3, scale: 2 }) - 0.5) * 0.5));
  };
  const CLOTH = [0x24365e, 0xe8e4d8, 0x8a3a2a, 0x3a5a8a, 0xd8c8a0, 0x5a7a5a];
  for (let by = 0; by <= Math.floor(FH / BH); by++)
    for (let bx = 0; bx <= 5; bx++) {
      const x0 = bx * BW - (by % 2) * 60 + 16;
      const y0 = by * BH + 18;
      const kind = kindOf(bx, by);
      const lr = rng(bx * 131 + by * 17 + 5);
      if (kind === 'temple') continue;
      // the houses' ridges, to stand things on: [x, y of the ridge's middle, the house's width, the roof's depth, its kind]
      const houses = [];
      if (kind === 'long') {
        const hw = 38 + ((hashy(bx, by, 1) * 3) | 0) * 4;
        for (let k = 0; k * hw + hw <= 114; k++) houses.push([x0 + k * hw, y0 + 76, hw, 152, matOf(bx, by, k), true]);
      } else if (kind === 'rows') {
        for (const row of [0, 1]) {
          const hw = 30 + ((hashy(bx, by, 3 + row) * 3) | 0) * 6;
          for (let k = 0; k * hw + hw <= 114; k++) houses.push([x0 + k * hw, y0 + row * 80 + 36, hw, 72, matOf(bx, by, k + row * 9), row === 1]);
        }
      } else {
        for (let k = 0; k < 3; k++) houses.push([x0 + k * 38, y0 + 23, 38, 46, matOf(bx, by, k), false]);
        for (let k = 0; k < 2; k++) houses.push([x0 + k * 57, y0 + 129, 57, 46, matOf(bx, by, 5 + k), true]);
      }
      for (const [hx, hy, hw, depth, mat, front] of houses) {
        const pick = lr();
        if (mat === 0 && pick < 0.3) {
          // a rain tub on the ridge against fire, its pyramid of buckets
          const tx = hx + 8 + Math.floor(lr() * (hw - 20));
          dark(tx + 2, hy + 1, 9, 6, 0.72);
          img.rect(tx, hy - 4, 8, 7, sm(WOOD, 0.46));
          img.rect(tx, hy - 4, 8, 1, sm(WOOD, 0.9));
          img.rect(tx + 1, hy - 3, 6, 3, 0x1e2a3a);
          img.set(tx + 2, hy - 2, 0x6a8aaa);
          for (const [i, j] of [[1, -7], [4, -7], [3, -9]]) {
            img.rect(tx + i, hy + j, 3, 2, sm(WOOD, 0.8));
            img.set(tx + i, hy + j + 1, sm(WOOD, 0.3));
          }
        } else if (pick < 0.46 && depth > 60) {
          // a drying platform built out over the lower slope: its frame of poles, the wash on the lines
          const tx = hx + 6 + Math.floor(lr() * (hw - 26));
          const ty = hy + 10 + Math.floor(lr() * 12);
          dark(tx + 3, ty + 3, 18, 13, 0.76);
          for (let j = 0; j < 13; j++) for (let i = 0; i < 18; i++) if (i === 0 || i === 17 || j === 0 || j === 12 || i % 6 === 0) set(tx + i, ty + j, sm(WOOD, i === 0 || j === 0 ? 0.86 : 0.5));
          for (const j of [3, 8])
            for (let i = 2; i < 16; i += 4) {
              const col = CLOTH[Math.floor(lr() * CLOTH.length)];
              img.rect(tx + i, ty + j, 3, 3, col);
              img.set(tx + i, ty + j, mix(col, 0xffffff, 0.35));
            }
        } else if (mat !== 2 && pick > 0.9) {
          // a skylight for the smoke, propped open
          const tx = hx + 10 + Math.floor(lr() * (hw - 22));
          img.rect(tx, hy - 16, 7, 6, 0x14100c);
          img.rect(tx - 1, hy - 18, 9, 2, sm(WOOD, 0.7));
        }
        if (front && lr() < 0.55) {
          // a shop: its noren hung under the eave on the lane, the mark dyed white on indigo; goods out by the door
          const nw = hw - 14;
          const ny = hy + depth / 2 + 1;
          const col = [0x24365e, 0x24365e, 0x6a2a24, 0x2a4a3a][Math.floor(lr() * 4)];
          for (let i = 0; i < nw; i++)
            for (let j = 0; j < 4; j++) {
              let c = j === 0 ? sm(WOOD, 0.3) : i % 7 === 6 ? mix(col, 0x000000, 0.5) : col;
              if (j === 2 && i % 7 === 3) c = 0xf0ece0;
              set(hx + 7 + i, ny + j, c);
            }
          if (lr() < 0.6) {
            const gx = hx + 8 + Math.floor(lr() * (nw - 12));
            for (let k = 0; k < 3; k++) {
              img.disc(gx + k * 5, ny + 7, 2, sm(WOOD, 0.4));
              img.disc(gx + k * 5, ny + 7, 1.2, [0xe8a070, 0x7aac4e, 0xdce8f0, 0xd0aa40][Math.floor(lr() * 4)]);
            }
          }
        }
      }
      if (kind === 'yard') {
        // the yard's own things: a pine, a well with its curb and bucket, a stone lantern, a line of washing,
        // stepping stones across
        const [yx, yy] = [x0 + 34, y0 + 46]; // 46 x 60
        for (let k = 0; k < 5; k++) img.ellipse(yx + 8 + k * 7, yy + 34 + (k % 2) * 4, 2.6, 2, sm(STONE, 0.6 + (k % 3) * 0.1));
        if (lr() < 0.7) pineAt(yx + 34, yy + 16, 9);
        img.rect(yx + 6, yy + 10, 10, 10, sm(WOOD, 0.5));
        img.rect(yx + 6, yy + 10, 10, 1, sm(WOOD, 0.9));
        img.rect(yx + 8, yy + 12, 6, 6, 0x0e1a2a);
        img.set(yx + 10, yy + 14, 0x5a8ac0);
        img.disc(yx + 20, yy + 18, 2, sm(WOOD, 0.36));
        dark(yx + 37, yy + 46, 6, 5, 0.74);
        img.rect(yx + 35, yy + 43, 5, 5, sm(STONE, 0.5));
        img.rect(yx + 36, yy + 44, 3, 3, sm(STONE, 0.84));
        img.set(yx + 37, yy + 45, 0xf0c060);
        img.line(yx + 4, yy + 52, yx + 30, yy + 52, 0x2a2018);
        for (let i = 6; i < 28; i += 5) {
          const col = CLOTH[Math.floor(lr() * CLOTH.length)];
          img.rect(yx + i, yy + 52, 4, 4, col);
          img.set(yx + i, yy + 52, mix(col, 0xffffff, 0.35));
        }
      }
    }
  // ---- the temple: a plastered wall under a coping of tiles, the gate on the lane, a path of flagstones to the main
  // hall under its great hipped roof, the bell tower, an incense burner, gravestones under a ginkgo, pines
  {
    const x0 = TEMPLE[0] * BW - (TEMPLE[1] % 2) * 60 + 16;
    const y0 = TEMPLE[1] * BH + 18;
    const [w, h] = [114, 152];
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const e = Math.min(i, w - 1 - i, j, h - 1 - j);
        if (e > 4) continue;
        if (j > h - 6 && Math.abs(i - w / 2) < 9) continue; // (the gateway)
        set(x0 + i, y0 + j, e === 0 || e === 4 ? ROOF[0] : e === 2 ? sm(ROOF, 0.8) : (i + j) % 5 === 0 ? sm(ROOF, 0.3) : sm(ROOF, 0.55));
      }
    dark(x0 + 5, y0 + 5, w - 10, 4, 0.72);
    dark(x0 + 5, y0 + 5, 4, h - 10, 0.72);
    // the flagstones from the gate
    for (let j = 62; j < h - 2; j++) for (let i = -5; i <= 5; i++) set(x0 + w / 2 + i, y0 + j, (j % 8 === 0 || i === 0) ? sm(STONE, 0.4) : sm(STONE, 0.78 + ((j >> 3) % 2) * 0.06));
    // the gate's own roof across the gateway
    dark(x0 + w / 2 - 12 + 3, y0 + h - 12 + 3, 24, 12, 0.7);
    for (let j = 0; j < 11; j++) for (let i = -12; i < 12; i++) set(x0 + w / 2 + i, y0 + h - 12 + j, roofPx(j / 11, i + 12, j, 11, 0.04, 0, 0, 0));
    // the main hall: a hipped roof, four slopes, the ridge with its end ornaments in gilt
    {
      const [hx, hy, hw, hh] = [x0 + 22, y0 + 12, 70, 50];
      dark(hx + 6, hy + 7, hw, hh, 0.62);
      for (let j = 0; j < hh; j++)
        for (let i = 0; i < hw; i++) {
          const dT = j;
          const dB = hh - 1 - j;
          const dL = i;
          const dR = hw - 1 - i;
          const m = Math.min(dT, dB, dL, dR);
          let v = m === dT ? 0.82 : m === dL ? 0.66 : m === dR ? 0.34 : 0.24;
          const along = m === dT || m === dB ? i : j;
          v += m % 5 === 0 ? -0.14 : along % 5 === 0 ? -0.05 : 0.03;
          let c = sm(ROOF, v - m / 160);
          if (Math.abs(dT - dL) < 1 || Math.abs(dT - dR) < 1 || Math.abs(dB - dL) < 1 || Math.abs(dB - dR) < 1) c = ROOF[0]; // (the hips)
          if (m === 0) c = ROOF[0];
          if (Math.abs(j - hh / 2) < 2 && i > hh / 2 - 2 && i < hw - hh / 2 + 2) c = (i % 9 < 3) ? 0xd8d4cc : ROOF[0];
          set(hx + i, hy + j, c);
        }
      for (const i of [hh / 2 - 3, hw - hh / 2 + 2]) {
        img.rect(hx + i - 1, hy + hh / 2 - 3, 4, 6, 0x8a6a2a);
        img.rect(hx + i, hy + hh / 2 - 2, 2, 3, 0xe8c860);
      }
      // the steps before it, the incense burner with its thread of smoke, the offering box
      for (let k = 0; k < 3; k++) img.rect(hx + 22, hy + hh + k * 2, 26, 2, sm(STONE, 0.5 + k * 0.14));
      img.disc(x0 + w / 2, y0 + 84, 4, 0x3a4a44);
      img.disc(x0 + w / 2, y0 + 84, 2.6, 0x9a9488);
      img.set(x0 + w / 2, y0 + 84, 0xf08040);
      for (let k = 0; k < 9; k++) img.set(x0 + w / 2 + Math.round(Math.sin(k * 0.9) * 2), y0 + 80 - k * 2, 0xe8e8ee, 0.5 - k * 0.05);
    }
    // the bell tower: a little square roof on four posts, the bell's green dome between them
    {
      const [tx, ty] = [x0 + 82, y0 + 96];
      dark(tx + 4, ty + 5, 22, 22, 0.66);
      for (let j = 0; j < 22; j++)
        for (let i = 0; i < 22; i++) {
          const m = Math.min(i, 21 - i, j, 21 - j);
          const c = m === 0 ? ROOF[0] : sm(ROOF, (m === j ? 0.8 : m === i ? 0.64 : m === 21 - i ? 0.34 : 0.24) + (m % 4 === 0 ? -0.12 : 0));
          set(tx + i, ty + j, c);
        }
      img.disc(tx + 11, ty + 11, 2.4, 0x4a7a62);
      img.set(tx + 10, ty + 10, 0xa8d8c0);
    }
    // gravestones in rows under the ginkgo, a stone lantern each side of the path, pines by the wall
    for (let k = 0; k < 12; k++) {
      const [gx, gy] = [x0 + 10 + (k % 4) * 8, y0 + 96 + Math.floor(k / 4) * 11];
      dark(gx + 1, gy + 2, 5, 6, 0.76);
      img.rect(gx, gy, 4, 6, sm(STONE, 0.5 + (k % 3) * 0.12));
      img.rect(gx, gy, 4, 1, sm(STONE, 0.95));
      img.rect(gx - 1, gy + 6, 6, 2, sm(STONE, 0.36));
    }
    {
      const [gx, gy, r] = [x0 + 24, y0 + 80, 12];
      dark(gx - r + 4, gy - r + 5, r * 2, r * 2, 0.78);
      for (let j = -r; j <= r; j++)
        for (let i = -r; i <= r; i++)
          if (i * i + j * j <= r * r && fbm(gx + i, gy + j, { seed: 79, scale: 3 }) > 0.26 + (i * i + j * j) / (r * r * 3.4)) set(gx + i, gy + j, mix(0xa87a1a, 0xf0d050, 0.5 - (i + j) / (r * 4) + (fbm(gx + i, gy + j, { seed: 81, scale: 2 }) - 0.5) * 0.5));
    }
    for (const dx of [-12, 12]) {
      img.rect(x0 + w / 2 + dx - 2, y0 + 118, 5, 5, sm(STONE, 0.44));
      img.rect(x0 + w / 2 + dx - 1, y0 + 119, 3, 3, sm(STONE, 0.86));
      img.set(x0 + w / 2 + dx, y0 + 120, 0xf0c060);
    }
    pineAt(x0 + 98, y0 + 74, 8);
    pineAt(x0 + 14, y0 + 18, 7);
    pineAt(x0 + 102, y0 + 20, 7);
    for (const [px, py, c] of [[w / 2 - 3, 104, 0x3a4a6a], [w / 2 + 4, 132, 0x6a3a3a], [w / 2 - 2, 70, 0x4a4a3a]]) {
      disc(x0 + px, y0 + py, 3.4, c);
      disc(x0 + px, y0 + py - 3, 2, 0x1a1414);
    }
  }
  // ---- fire watch towers where lanes cross: a ladder up to a little roofed platform, the alarm bell under it; the
  // long shadow they throw
  for (const [tx, ty] of [[528, 8 * BH + 9], [528, 14 * BH + 9], [8, 10 * BH + 9], [138, 6 * BH + 9], [398, 4 * BH + 9]]) {
    for (let k = 0; k < 34; k++) dark(tx - 4 + k * 0.5, ty - 4 + k, 12, 1, 0.74);
    for (let j = 0; j < 26; j++) {
      set(tx - 3, ty + j, sm(WOOD, 0.8));
      set(tx + 3, ty + j, sm(WOOD, 0.34));
      if (j % 4 === 1) for (let i = -2; i <= 2; i++) set(tx + i, ty + j, sm(WOOD, 0.56));
    }
    for (let j = -8; j <= 8; j++)
      for (let i = -8; i <= 8; i++) {
        const m = Math.min(i + 8, 8 - i, j + 8, 8 - j);
        set(tx + i, ty - 6 + j, m === 0 ? ROOF[0] : sm(ROOF, (m === j + 8 ? 0.84 : m === i + 8 ? 0.66 : m === 8 - i ? 0.36 : 0.26) + (m % 3 === 0 ? -0.1 : 0)));
      }
    img.disc(tx, ty - 6, 1.6, 0xc8a040);
    img.set(tx, ty - 7, 0xfff0b0);
  }
  // yards: a pine here and there, a well, people in the lanes
  for (let k = 0; k < 40; k++) {
    const y = rand() * FH;
    const x = rand() * FW;
    const r = 9 + rand() * 6;
    pineAt(Math.round(x), Math.round(y), Math.round(r));
  }
  for (let k = 0; k < 60; k++) {
    const y = Math.floor(rand() * (FH / 170)) * 170 + 9;
    const x = rand() * FW;
    disc(x, y, 3.4, [0x2a3a6a, 0x7a2a2a, 0x4a3a28, 0x2a4a3a][k % 4]);
    disc(x, y - 3, 2, 0x1a1414);
  }
  // ---- the building site: its plank hoarding, the churned earth inside
  const [sx0, sy0, sx1, sy1] = [34, 1240, 506, 2600];
  for (let y = sy0; y < sy1; y++)
    for (let x = sx0; x < sx1; x++) {
      const edge = Math.min(x - sx0, sx1 - 1 - x, y - sy0, sy1 - 1 - y);
      const n = fbm(x, y, { seed: 7, scale: 12 }) - 0.5;
      let c = sm(DIRT, 0.58 + n * 0.45 + (fbm(x * 3, y * 3, { seed: 8, scale: 3 }) - 0.5) * 0.15);
      // wheel tracks
      for (const tx of [120, 140, 400, 420]) if (Math.abs(x - tx - Math.sin(y * 0.01) * 8) < 3) c = mix(c, 0x2a1e12, 0.3);
      if (edge < 10) {
        // the hoarding: pale boards, their joints, a dark top edge
        const along = x - sx0 < 10 || sx1 - 1 - x < 10 ? y : x;
        c = edge < 2 ? 0x3a2a18 : along % 22 < 2 ? sm(WOOD, 0.4) : sm(WOOD, 0.78 - edge / 40);
      }
      set(x, y, c);
    }
  // plank walkways, timber stacks, a sand heap, a wheelbarrow, cones
  const plank = (x0, y0, x1, y1) => {
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) set(x, y, (x0 < x1 - y1 + y0 ? (x - x0) % 16 < 1 : (y - y0) % 16 < 1) ? 0x4a3420 : sm(WOOD, 0.62 + (fbm(x, y, { seed: 21, scale: 4 }) - 0.5) * 0.25));
  };
  plank(70, 1300, 110, 1900);
  plank(430, 1360, 470, 2000);
  for (let k = 0; k < 5; k++) for (let y = 1290 + k * 12; y < 1300 + k * 12; y++) for (let x = 160; x < 270; x++) set(x, y, y % 12 === 0 ? 0x3a2810 : sm(WOOD, 0.7 - (y % 12) / 30));
  for (let j = -34; j <= 34; j++) for (let i = -44; i <= 44; i++) {
    const d = (i / 44) ** 2 + (j / 34) ** 2;
    if (d < 1) set(380 + i, 1340 + j, sm([0x9a8a60, 0xb8a878, 0xd4c494, 0xe8dcb0], 0.9 - d * 0.6 - (i + j) / 200));
  }
  for (let j = 0; j < 22; j++) for (let i = 0; i < 30; i++) set(140 + i, 2440 + j, j < 3 || i < 2 || i > 27 ? 0x3a3a42 : 0x6a7a8a);
  disc(155, 2468, 5, 0x1a1a20);
  for (const [x, y] of [[90, 2000], [460, 2100], [120, 2520], [430, 2500]]) {
    disc(x, y, 8, 0xf06a18);
    disc(x, y, 5, 0xf0f0e8);
    disc(x, y, 2.5, 0xf06a18);
  }
  // ---- cracks from the pit out across the site and into the town
  const crack = (x, y, a, len) => {
    for (let k = 0; k < len; k++) {
      x += Math.cos(a) * 2;
      y += Math.sin(a) * 2;
      a += (rand() - 0.5) * 0.5;
      for (let w = -1; w <= 1; w++) set(x + w, y, w ? 0x2a2014 : 0x0a0806);
      if (rand() < 0.03) crack(x, y, a + (rand() < 0.5 ? 0.8 : -0.8), len - k - 10);
    }
  };
  const [cx, cy] = [270, 2130];
  for (let k = 0; k < 10; k++) crack(cx, cy, (k / 10) * Math.PI * 2, 150);
  // ---- the pit: an irregular hole shored with planks, mud and black water at the bottom
  const pit = (x, y) => ((x - cx) / 230) ** 2 + ((y - cy) / 250) ** 2 + (fbm(x, y, { seed: 9, scale: 22 }) - 0.5) * 0.22;
  for (let y = cy - 290; y < cy + 290; y++)
    for (let x = cx - 260; x < cx + 260; x++) {
      const e = pit(x, y);
      if (e > 1.08) continue;
      if (e > 0.96) {
        // the shoring: upright planks round the rim
        const a = Math.atan2(y - cy, x - cx);
        set(x, y, Math.floor(a * 40) % 2 ? sm(WOOD, 0.62) : sm(WOOD, 0.4));
        continue;
      }
      const n = fbm(x, y, { seed: 11, scale: 5 }) - 0.5;
      let c = sm(DIRT, 0.2 + (1 - e) * 0.18 + n * 0.25);
      if (e < 0.55 && fbm(x * 0.6, y * 0.6, { seed: 12, scale: 9 }) > 0.62) c = mix(0x10181c, 0x4a6a7a, 0.2 + n); // puddles
      set(x, y, c);
    }
  // ---- the namazu: its broad flat head up out of the mud, the body sinking back into it
  for (let y = cy - 240; y < cy + 210; y++)
    for (let x = cx - 220; x < cx + 220; x++) {
      const t = (y - (cy - 240)) / 450; // 0: where it goes under .. 1: the snout
      if (t < 0) continue;
      const half = t < 0.45 ? 40 + t * 220 : t < 0.9 ? 139 + (t - 0.45) * 60 : 166 * Math.sqrt(Math.max(0, 1 - ((t - 0.9) / 0.11) ** 2));
      const d = Math.abs(x - cx);
      if (d > half) continue;
      const k = d / half;
      const mottle = fbm(x, y, { seed: 13, scale: 7 });
      let c = sm(SLIME, 0.28 + (1 - k * k) * 0.4 + (mottle - 0.5) * 0.4 - (x - cx) / 1200 + t * 0.08);
      if (mottle > 0.66) c = mix(c, 0x1a1e12, 0.5); // dark blotches
      if (k > 0.88) c = mix(c, 0xb8b890, 0.5); // the paler flank
      if (t < 0.12) c = mix(c, sm(DIRT, 0.25), (0.12 - t) / 0.12); // sinking into the mud
      set(x, y, c);
    }
  // its eyes: small, gold, far apart; its lips, pale, a wide mouth; the slime's sheen
  for (const sx of [-1, 1]) {
    disc(cx + sx * 98, cy + 120, 9, 0x1a1408);
    disc(cx + sx * 98, cy + 120, 7, 0xd8b840);
    disc(cx + sx * 98, cy + 121, 3.5, 0x0a0806);
    disc(cx + sx * 96, cy + 117, 1.6, 0xffffff);
  }
  for (let x = cx - 130; x <= cx + 130; x++) for (let w = 0; w < 6; w++) set(x, cy + 184 - Math.abs(x - cx) * 0.22 + w, w < 2 ? 0x2a2018 : w < 5 ? 0xd8c8a0 : 0x8a7a5a);
  for (const [x, y, l] of [[cx - 60, cy - 40, 50], [cx + 40, cy + 30, 40], [cx - 20, cy + 90, 30]]) for (let t = 0; t < l; t++) set(x + t, y - t * 0.3, 0xe8f0d0, 0.5);
  // its whiskers: two long ones out from the corners of its mouth, over the hoarding into the lanes, the townsfolk
  // hauling on them; two short ones under the chin
  const whisker = (x, y, a, len, curl) => {
    const pts = [];
    for (let k = 0; k < len; k++) {
      x += Math.cos(a) * 2;
      y += Math.sin(a) * 2;
      a += curl;
      pts.push([x, y]);
      const r = 4.2 - (k / len) * 2.2;
      for (let w = -r; w <= r; w++) for (let v = -r; v <= r; v++) if (w * w + v * v <= r * r) set(x + w, y + v, sm(SLIME, w + v < 0 ? 0.6 : 0.25));
    }
    return pts;
  };
  const left = whisker(cx - 130, cy + 180, Math.PI * 1.25, 240, 0.004);
  const right = whisker(cx + 130, cy + 180, -Math.PI * 0.25, 240, -0.004);
  whisker(cx - 40, cy + 200, Math.PI * 0.62, 40, 0.012);
  whisker(cx + 40, cy + 200, Math.PI * 0.38, 40, -0.012);
  const person = (x, y, robe, lean = 0) => {
    for (let j = -9; j <= 9; j++) for (let i = -6; i <= 6; i++) if ((i * i) / 36 + (j * j) / 81 < 1) set(x + i + lean * j * 0.2, y + j, mix(robe, 0x000000, (i + 6) / 30));
    for (let i = -6; i <= 6; i++) set(x + i, y + 2, 0xd8c890); // the sash
    disc(x - lean * 2, y - 12, 4.4, 0xe8c8a0);
    for (let i = -4; i <= 4; i++) for (let j = -2; j <= 0; j++) set(x - lean * 2 + i, y - 15 + j, 0x1a1414); // the hair, a topknot
  };
  const ROBES = [0x2a3a6a, 0x8a2a2a, 0x4a3a28, 0x2a5a4a, 0x6a3a6a];
  for (const pts of [left, right])
    for (let k = 60, n = 0; k < pts.length; k += 26, n++) {
      const [x, y] = pts[k];
      person(x + 6, y + 12, ROBES[(n + (pts === left ? 0 : 2)) % ROBES.length], pts === left ? 1 : -1);
      for (let q = 0; q < 9; q++) set(x + q * 0.7, y + 6 - q * 0.5, 0xe8c8a0); // arms on the whisker
    }
  // townsfolk at it with mallets, round its head
  for (const [x, y, sx] of [[cx - 190, cy + 60, 1], [cx + 190, cy + 40, -1], [cx - 170, cy + 150, 1], [cx + 175, cy + 160, -1]]) {
    person(x, y, ROBES[(x + y) % 5], 0);
    void sx; // (their mallets are moving parts, below)
  }
  // ---- the kaname-ishi on its head: a rounded boulder, its shadow, the sacred rope with its zigzag paper streamers
  {
    const [bx, by, R] = [cx, cy + 50, 60];
    for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) if (Math.hypot(i, j * 1.15) <= R) set(bx + i + 12, by + j + 16, 0x0a0808, 0.45);
    for (let j = -R; j <= R; j++)
      for (let i = -R; i <= R; i++) {
        const d = Math.hypot(i, j * 1.15) / R;
        if (d > 1) continue;
        set(bx + i, by + j, sm(STONE, 0.78 - (i + j) / (R * 3) - d * 0.28 + (fbm(i, j, { seed: 15, scale: 6 }) - 0.5) * 0.3));
      }
    for (let i = -R + 4; i <= R - 4; i++) for (let w = 0; w < 8; w++) set(bx + i, by + 4 + w + Math.sin(i * 0.4) * 1.6, w === 0 || w === 7 ? 0x8a7a40 : (i + w) % 5 < 1 ? 0xb8a050 : 0xe0c878);
    for (const i of [-38, -14, 12, 36]) for (let k = 0; k < 22; k++) for (let w = 0; w < 4; w++) set(bx + i + ((Math.floor(k / 5) % 2) ? 5 : 0) + w, by + 13 + k, w === 3 ? 0xb8b4a8 : 0xfaf8f0);
  }
  const GRADE = { sat: 0.82, bright: 0.84, tint: 0x182030, tintAmt: 0.05 };
  grade(img, GRADE);
  // ---------------------------------------------------------------- the moving parts
  const kit = new PropKit(1855, { artScale: S });
  const lx = (x) => Math.round((x / S) * 10) / 10;
  const lu = (y) => Math.round(((FH - y) / S) * 10) / 10;
  const graded = (r) => {
    grade(r, GRADE);
    return kit.frame(r);
  };
  // the mallets: raised, half way, down on the catfish (a puff where each lands)
  const mallet = (sx, k) => {
    const r = new Raster(66, 54);
    const ox = sx > 0 ? 8 : 58;
    const a = [-1.25, -0.6, 0.1][k]; // the handle's angle: up, across, down
    const hx = ox + sx * Math.cos(a) * 26;
    const hy = 40 + Math.sin(a) * 26;
    for (let q = 0; q <= 26; q++) for (let w = 0; w < 3; w++) r.set(Math.round(ox + sx * Math.cos(a) * q), Math.round(40 + Math.sin(a) * q + w), 0x5a4020);
    for (let j = -6; j <= 6; j++) for (let i = -8; i <= 8; i++) r.set(Math.round(hx + i), Math.round(hy + j), Math.abs(i) === 8 || Math.abs(j) === 6 ? 0x3a2814 : sm(WOOD, 0.62 - j / 30));
    if (k === 2) for (let i = 0; i < 7; i++) r.disc(Math.round(hx + (i - 3) * 4), Math.round(hy + 9 + (i % 2) * 3), 2, 0xd8d0b8, 0.7);
    return graded(r);
  };
  for (const [n, [x, y, sx]] of [[cx - 190, cy + 60, 1], [cx + 190, cy + 40, -1], [cx - 170, cy + 150, 1], [cx + 175, cy + 160, -1]].entries()) {
    kit.loop(lx(sx > 0 ? x - 8 : x - 58), lu(y - 50), [0, 1, 2].map((k) => mallet(sx, k)), { fps: 5 + (n % 2), seq: [0, 0, 0, 1, 2, 2, 1], ph: n * 0.27 });
  }
  // the whiskers twitching: a sheen running out along each from the mouth
  const sheen = (() => {
    const r = new Raster(11, 11);
    for (let j = -5; j <= 5; j++) for (let i = -5; i <= 5; i++) if (i * i + j * j < 26) r.set(i + 5, j + 5, 0xdce8b8, 0.75 * (1 - Math.hypot(i, j) / 5.2));
    return kit.frame(r);
  })();
  const run = [];
  for (const pts of [left, right]) for (let k = 4; k < pts.length; k += 8) run.push([0, lx(pts[k][0]) - 1.8, lu(pts[k][1]) + 1.8, -k * 0.09]);
  kit.wave([sheen], run, { w: 5, a0: 0, a1: 1, pw: 5 });
  // its eyes blinking: a lid of its own hide over each for a moment
  for (const sx of [-1, 1]) {
    const r = new Raster(22, 22);
    for (let j = -10; j <= 10; j++) for (let i = -10; i <= 10; i++) if (i * i + j * j <= 100) r.set(i + 11, j + 11, Math.abs(j - 2) < 1.5 ? 0x1a1408 : sm(SLIME, 0.5 - (i + j) / 60));
    kit.loop(lx(cx + sx * 98 - 11), lu(cy + 120 - 11), [graded(r)], { fps: 8, seq: [...Array(44).fill(-1), 0, 0], ph: 0 });
  }
  // bubbles coming up through the mud of the pit and bursting; dust shaken off the cracks; hearth smoke over the town
  const pop = (k) => {
    const r = new Raster(21, 21);
    const rr = [3, 5, 7, 8][k];
    for (let a = 0; a < Math.PI * 2; a += 0.08) if (k < 3 || Math.floor(a * 3) % 2) r.set(Math.round(10 + Math.cos(a) * rr), Math.round(10 + Math.sin(a) * rr), 0xc8d0b8, k < 3 ? 0.85 : 0.6);
    if (k < 3) r.set(Math.round(10 - rr * 0.4), Math.round(10 - rr * 0.4), 0xffffff, 0.9);
    return kit.frame(r);
  };
  kit.spot([[lx(cx - 200), lu(cy - 230), 45, 26], [lx(cx - 215), lu(cy - 100), 22, 90], [lx(cx + 150), lu(cy - 100), 22, 90], [lx(cx - 60), lu(cy + 215), 40, 12]], [0, 1, 2, 3].map(pop), { rate: 2.2, fps: 7, a: 0.9 });
  const cloud = (r0, seed, c) => {
    const r = new Raster(r0 * 2 + 1, r0 * 2 + 1);
    for (let y = -r0; y <= r0; y++) for (let x = -r0; x <= r0; x++) {
      const d = Math.hypot(x, y) / r0 + (fbm(x + seed * 31, y, { seed, scale: 5 }) - 0.5) * 0.5;
      if (d < 1) r.set(x + r0, y + r0, c, Math.min(0.5, (1 - d) * 0.8));
    }
    return kit.frame(r);
  };
  const smoke = [[cloud(6, 1, 0xd8d4cc), cloud(6, 2, 0xd8d4cc)], [cloud(10, 3, 0xd8d4cc), cloud(10, 4, 0xd8d4cc)], [cloud(15, 5, 0xd8d4cc), cloud(15, 6, 0xd8d4cc)]];
  // (over the houses outside the site: left and right of it, and the blocks above)
  for (const [x, y] of [[14, 2300], [526, 2100], [12, 1700], [528, 1500], [120, 1100], [330, 1020], [470, 800], [200, 640], [60, 380], [400, 300]]) kit.emit(lx(x), lu(y), smoke, { rate: 0.7, life: [3, 4.5], vy: 7, sx: 2, wf: 1, a: 0.5, tint: 1 });
  const dust = [[cloud(5, 7, 0xb8a888), cloud(5, 8, 0xb8a888)], [cloud(9, 9, 0xb8a888), cloud(9, 10, 0xb8a888)]];
  for (const [x, y] of [[cx - 250, cy - 120], [cx + 250, cy + 60], [cx + 60, cy - 290], [cx - 120, cy + 280]]) kit.emit(lx(x), lu(y), dust, { rate: 0.5, life: [1.2, 2], vy: 5, sx: 8, wf: 0.4, a: 0.45, burst: 0.3, tint: 1 });
  return {
    strip: img,
    props: kit.pack(),
    meta: { width: W, artScale: S, chunkHeight: L, chunks: 1, length: L, tint: tintTable(L, () => [255, 255, 255]) },
  };
}

function hashy(a, b, c) {
  const h = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453;
  return h - Math.floor(h);
}
