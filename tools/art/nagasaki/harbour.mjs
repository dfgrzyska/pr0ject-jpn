// The way in: the coasts closing in from Hashima, channel buoys and the breakwater lights, Megami Ōhashi across
// the harbour mouth, then the inner harbour: the Mitsubishi shipyard with the Giant Cantilever Crane (1909) and an
// LNG carrier at the fitting-out quay on the west, the Matsugae cruise terminal with a liner on the east.
import { rng, fbm } from '../../lib/raster.mjs';
import { rampColor } from '../nature.mjs';
import { C, night, scaleColor, mix } from './canvas.mjs';
import { W, leftShore, rightShore, MEGAMI_U } from './geo.mjs';

const PINE = Object.assign([0x16301f, 0x234629, 0x34603a, 0x4c7a48], { kind: 'pine' });
const OAK = [0x1c3824, 0x2a5030, 0x3e6a3c, 0x5a8648];
const CAMPHOR = [0x1a3422, 0x284a2c, 0x3a6236, 0x527c44];

export function paintHarbour(k) {
  const { img, kit, Y, objects, glow, pool } = k;
  const R = rng(1390);

  // ------------------------------------------------------------ the coasts: wooded hills, terraces, houses
  k.forest(0, 60, 990, 1560, [PINE, OAK, CAMPHOR], 101, 4, 7, (x, u) => x < leftShore(u) - 6);
  k.forest(120, W, 1100, 1560, [PINE, OAK], 102, 4, 6, (x, u) => x > rightShore(u) + 4 && (x < 150 || x > 178));
  // a few houses up the western slope, each on its own stone terrace with a path down
  for (const [x, u, w] of [[4, 1236, 14], [12, 1290, 12], [2, 1460, 16], [14, 1500, 11]]) {
    if (x + w > leftShore(u) - 6) continue;
    img.rect(x - 1, Y(u) + 6, w + 2, 2, C.granite[1]);
    k.house(x, Y(u + 14), w, 7, 5, 'jp', { reserve: true });
  }
  // the breakwater lights: red to starboard (east), green to port, entering the harbour
  const breakwater = (x0, x1, u, lightX, red) => {
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) {
      img.rect(x, Y(u) - 2, 1, 5, (x + u) % 3 ? C.concrete[2] : C.concrete[1]);
      img.set(x, Y(u) + 3, C.concrete[0]);
      if (x % 3 === 0) img.set(x, Y(u) + 4, 0xd8ecea, 0.6);
    }
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x += 4) img.disc(x + 1, Y(u) + 4, 1.5, C.concrete[3]); // tetrapods
    const y = Y(u);
    objects.push({
      y: y + 2,
      shadow: () => k.shadowRect(lightX + 2, y - 2, 4, 4, 0.6),
      draw: () => {
        img.rect(lightX - 2, y - 14, 5, 14, red ? 0xd8382c : 0xe8ece8);
        img.rect(lightX - 2, y - 14, 1, 14, red ? 0xf06048 : 0xffffff);
        img.rect(lightX + 2, y - 14, 1, 14, red ? 0x8a2018 : 0xa8b0ac);
        for (const b of [y - 10, y - 5]) img.rect(lightX - 2, b, 5, 1, red ? 0xf0e8e0 : 0x3a9a5a);
        img.rect(lightX - 3, y - 16, 7, 2, 0x3a3e46);
        img.rect(lightX - 1, y - 18, 3, 2, red ? 0xff8a70 : 0x8affb0);
      },
    });
    const blink = [k.sprite(7, 7, u, (r) => { r.disc(3, 3, 3, red ? 0xff5040 : 0x50ff90, 0.45); r.disc(3, 3, 1.5, 0xffffff, 0.9); }, false)];
    kit.loop(lightX - 3, u + 20, blink, { fps: 1, seq: [0, -1, -1, 0, -1, -1, -1, -1], fx: 1 });
  };
  breakwater(rightShore(1060) + 2, 128, 1060, 130, true);
  breakwater(leftShore(1160) - 2, 52, 1160, 50, false);
  // channel buoys, green to port and red to starboard, blinking
  for (const [x, u, red] of [[62, 1000, false], [124, 990, true], [70, 1230, false], [116, 1250, true], [76, 1530, false], [108, 1520, true]]) {
    const y = Y(u);
    img.disc(x, y, 2.5, 0x0a1a24, 0.4);
    img.disc(x, y - 1, 2, red ? 0xc8302a : 0x2a8a4a);
    img.set(x - 1, y - 2, red ? 0xf06a5a : 0x5ac87a);
    img.rect(x, y - 5, 1, 3, 0x3a3e46);
    img.set(x - 2, y + 2, 0xd8ecea, 0.5);
    img.set(x + 2, y + 2, 0xd8ecea, 0.5);
    const f = [k.sprite(5, 5, u, (r) => { r.disc(2, 2, 2.4, red ? 0xff5a40 : 0x5aff90, 0.5); r.set(2, 2, 0xffffff); }, false)];
    kit.loop(x - 2, u + 7, f, { fps: 1.2, seq: [0, -1, -1, -1], fx: 1 });
  }

  // ------------------------------------------------------------ R1 along the eastern shore, the bridge deck
  // the guard rail between the road and the shore rocks, lamps along it
  for (let u = 1000; u < 1880; u++) {
    const x = Math.round(rightShore(u) + 2);
    if (u < 1560 && x < 153) img.set(x, Y(u), u % 4 ? 0xb0b4b4 : 0x6a7070);
  }
  for (let u = 1110; u < 1880; u += 36) k.streetLamp(155, u, 0xfff0c8, 7);

  // Megami Ōhashi: the deck (a frame of its own so ships pass under it), two A-shaped pylons with fans of stays
  const DU = MEGAMI_U;
  const deckFrame = k.capture(0, Y(DU + 10), W, 20, () => {
    for (let u = DU - 9; u <= DU + 9; u++)
      for (let x = 0; x < W; x++) {
        const a = Math.abs(u + 0.5 - DU);
        const y = Y(u);
        let c;
        if (a > 8) c = 0xe8ecec; // the white box girder's south face shows under the deck
        else if (a > 7) c = 0xa8aeb4;
        else if (a > 6) c = 0xd4d8d8;
        else c = rampColor(C.asphalt, fbm(x, y, { seed: 31, scale: 4 }), x, y);
        if (a < 0.6 && Math.floor(x / 3) % 2 === 0) c = 0xdad6c8;
        if (Math.abs(a - 3) < 0.5 && x % 6 < 3) c = 0xbcbab0;
        if (u < DU - 8) c = (x >> 1) % 2 ? 0xe0e4e6 : 0xb8bec4;
        img.set(x, y, c);
      }
    // girder joints, lamp posts with their light on the deck
    for (let x = 4; x < W; x += 16) {
      img.rect(x, Y(DU - 9), 1, 2, 0x8a9096);
      img.rect(x + 8, Y(DU + 8), 1, 2, 0x5a6066);
      glow(x + 8, Y(DU + 9), 0xf4f8ff, 0.8);
      pool(x + 8, Y(DU + 6), 5, 0xc8dcff, 0.12 + night(DU) * 0.2);
    }
  }, DU);
  kit.loop(0, DU + 10, [deckFrame], { d: 0.04 });
  // the deck's shadow on the water, the piers under it
  for (let u = DU - 22; u < DU - 9; u++) for (let x = 0; x < W; x++) if (k.wet(x, Y(u))) img.set(x, Y(u), 0x061420, 0.35 * (1 - (DU - 9 - u) / 13));
  k.reserve(0, Y(DU + 10), W, 20);
  for (const px of [50, 130]) {
    const frame = k.capture(px - 44, Y(DU + 84), 89, 76, () => {
      const top = DU + 80;
      // the A: two legs from either side of the deck meeting under the crown
      for (const s of [-1, 1]) {
        img.line(px + s * 7, Y(DU + 8), px + s * 2, Y(top - 10), 0xf2f4f4);
        img.line(px + s * 8, Y(DU + 8), px + s * 3, Y(top - 10), s < 0 ? 0xffffff : 0xb8c2c8);
        img.line(px + s * 6, Y(DU + 8), px + s * 1, Y(top - 10), 0xd8dee0);
      }
      img.rect(px - 6, Y(DU + 40), 13, 2, 0xd0d6d8);
      img.rect(px - 2, Y(top), 5, 12, 0xeef0f0);
      img.rect(px + 2, Y(top), 1, 12, 0xa8b2b8);
      img.rect(px - 3, Y(top + 1), 7, 1, 0xc8d0d4);
      // stays: a fan each way to the deck edges
      for (let q = 1; q <= 11; q++) {
        const d = 3 + q * 3.6;
        const hu = top - 2 - q * 1.6;
        for (const s of [-1, 1]) {
          img.line(px + s, Y(hu), px + s * d, Y(DU + 8), 0xe4e8e4, 0.85);
          img.line(px + s, Y(hu - 0.5), px + s * (d + 1), Y(DU - 7), 0xbcc6c8, 0.5);
        }
      }
      // floodlights up the legs, the aircraft warning light on the crown
      for (let u = DU + 14; u < top - 8; u += 9) {
        glow(px - 5 + (u - DU) * 0.06, Y(u), 0xeaf4ff, 0.35 + night(DU) * 0.3);
        glow(px + 5 - (u - DU) * 0.06, Y(u), 0xeaf4ff, 0.35 + night(DU) * 0.3);
      }
      glow(px, Y(top + 1), 0xff6050, 1);
    }, DU);
    kit.loop(px - 44, DU + 84, [frame], { d: 0.05 });
    // the pier in the water, surf round it
    img.ellipse(px, Y(DU - 12), 10, 4, C.concrete[2]);
    img.ellipse(px, Y(DU - 11), 9, 3, C.concrete[3]);
    for (let a = 0; a < 6.3; a += 0.5) img.set(px + Math.cos(a) * 12, Y(DU - 12) + Math.sin(a) * 5, 0xd8ecea, 0.5);
  }
  // the road park under the eastern end: a little lawn with benches and a lookout rail
  k.fill(150, Y(DU - 12), 6, 14, C.grass, 7);
  for (let u = DU - 26; u < DU - 12; u += 5) img.rect(151, Y(u), 3, 1, C.wood[2]);

  // ------------------------------------------------------------ the shipyard (west), u = 1560..1900
  const SX = 58;
  k.fill(0, Y(1880), SX, 330, C.concrete, 41, 6);
  for (let u = 1560; u < 1880; u += 2) img.set(SX - 1, Y(u), C.granite[3]);
  // bollards and fenders along the fitting-out quay
  for (let u = 1590; u < 1870; u += 14) {
    img.rect(SX - 3, Y(u), 2, 2, 0x2a2e34);
    img.rect(SX, Y(u) - 2, 1, 5, 0x1a1c20);
  }
  // sawtooth-roofed workshops and the steel stockyard
  const workshop = (x, u, w, h) => {
    const y = Y(u + h);
    objects.push({
      y: Y(u),
      shadow: () => k.shadowRect(x + 3, y + 3, w, h, 0.5),
      draw: () => {
        for (let yy = y; yy < y + h - 4; yy++)
          for (let xx = x; xx < x + w; xx++) {
            const t = (yy - y) % 5;
            img.set(xx, yy, t === 0 ? 0x9ab8c4 : t < 3 ? 0x7a8890 : 0x5a666e);
          }
        img.rect(x, y + h - 4, w, 4, 0x8e9498);
        for (let xx = x + 2; xx < x + w - 2; xx += 5) k.panes(xx, y + h - 4, 3, 3, u, { pw: 2, ph: 1, bay: 3, row: 3, sill: false });
        img.rect(x + Math.floor(w / 2) - 3, y + h - 4, 6, 4, 0x3a3e44);
      },
    });
    k.reserve(x - 1, y - 1, w + 2, h + 2);
  };
  workshop(2, 1578, 36, 34);
  workshop(2, 1842, 40, 32);
  for (let i = 0; i < 9; i++) {
    const x = 6 + (i % 3) * 10;
    const u = 1628 + Math.floor(i / 3) * 9;
    img.rect(x, Y(u), 8, 4, [0x6a4a3a, 0x7a5a48, 0x5a5048][i % 3]);
    img.rect(x, Y(u), 8, 1, 0xa08a78);
  }
  // the dry dock opening east onto the harbour, a coaster on its keel blocks inside, the gate caisson
  {
    const u0 = 1790;
    const u1 = 1822;
    const y0 = Y(u1);
    for (let y = y0; y < Y(u0); y++)
      for (let x = 4; x < SX; x++) {
        const edge = Math.min(x - 4, y - y0, Y(u0) - 1 - y);
        img.set(x, y, edge < 4 ? (edge % 2 ? C.concrete[1] : C.concrete[3]) : 0x4a4a48);
      }
    // the ship: red bottom, grey topsides, white bridge at the stern
    k.poly([[10, y0 + 8], [44, y0 + 8], [52, y0 + 16], [44, y0 + 24], [10, y0 + 24]], 0x8a2a24);
    k.poly([[11, y0 + 9], [43, y0 + 9], [50, y0 + 16], [43, y0 + 23], [11, y0 + 23]], 0x5a646c);
    img.rect(13, y0 + 11, 28, 10, 0x6e7a82);
    for (let x = 16; x < 40; x += 6) img.rect(x, y0 + 12, 4, 8, 0x4a545c);
    img.rect(11, y0 + 10, 8, 12, 0xe8e8e4);
    img.rect(12, y0 + 8, 6, 2, 0xf4f4f0);
    for (let x = 12; x < 44; x += 4) img.rect(x, y0 + 25, 2, 2, 0x3a3a38);
    img.rect(SX - 3, y0 + 3, 3, 26, 0x5a6268);
    img.rect(SX - 3, y0 + 3, 1, 26, 0x8a9298);
  }
  // the goliath gantry crane straddling the dock, red and white
  {
    const y = Y(1830);
    objects.push({
      y: Y(1786),
      shadow: () => k.shadowRect(4, y + 6, 54, 6, 0.55),
      draw: () => {
        for (const x of [4, 54]) {
          img.rect(x, y, 3, 44, 0xd8d8d4);
          img.rect(x + 2, y, 1, 44, 0x9a9a96);
          for (let yy = y + 3; yy < y + 44; yy += 6) img.line(x, yy, x + 2, yy + 4, 0xb03a30);
        }
        img.rect(3, y - 6, 56, 6, 0xc83a30);
        img.rect(3, y - 6, 56, 1, 0xf06a5a);
        for (let x = 6; x < 56; x += 4) img.line(x, y - 5, x + 2, y - 1, 0x8a2018);
        img.rect(26, y - 9, 10, 4, 0xe8e8e4);
        glow(4, y - 7, 0xff5040, 1);
        glow(58, y - 7, 0xff5040, 1);
      },
    });
  }
  // the LNG carrier at the fitting-out quay: four spherical tank covers, a white superstructure aft
  {
    const x0 = 60;
    const x1 = 86;
    const ua = 1600;
    const ub = 1770;
    const y0 = Y(ub);
    const y1 = Y(ua);
    objects.push({
      y: y1,
      shadow: () => {
        for (let y = y0 + 4; y < y1 + 4; y++) for (let x = x1; x < x1 + 4; x++) if (k.wet(x, y)) img.set(x, y, 0x061420, 0.4);
      },
      draw: () => {
        // hull: bow to the south, a dark red boot top at the waterline
        k.poly([[x0, y0 + 6], [x0 + 4, y0], [x1 - 4, y0], [x1, y0 + 6], [x1, y1 - 14], [(x0 + x1) / 2, y1], [x0, y1 - 14]], 0x2a3238);
        k.poly([[x0 + 1, y0 + 6], [x0 + 4, y0 + 1], [x1 - 4, y0 + 1], [x1 - 1, y0 + 6], [x1 - 1, y1 - 14], [(x0 + x1) / 2, y1 - 1], [x0 + 1, y1 - 14]], 0x6a7a6e);
        img.line(x1, y0 + 6, x1, y1 - 14, 0x8a2a24);
        img.line(x1 - 1, y1 - 14, (x0 + x1) / 2, y1 - 1, 0x8a2a24);
        // deck piping run down the middle
        for (let y = y0 + 30; y < y1 - 12; y++) img.set(x0 + 4, y, y % 4 ? 0xa8a8a0 : 0x6a6a64);
        // the four domes, shaded spheres with a pale equator band
        for (let i = 0; i < 4; i++) {
          const cy = y0 + 44 + i * 30;
          const cx = (x0 + x1) / 2 + 1;
          for (let yy = -12; yy <= 12; yy++)
            for (let xx = -12; xx <= 12; xx++) {
              const d = Math.hypot(xx + 0.5, yy + 0.5) / 11.5;
              if (d > 1) continue;
              const nz = Math.sqrt(1 - d * d);
              const v = ((-(xx + 0.5) / 11.5) * 0.55 - ((yy + 0.5) / 11.5) * 0.6 + nz * 0.58) * 0.6 + 0.45;
              img.set(cx + xx, cy + yy, rampColor([0x8a8676, 0xb4ae9a, 0xd8d2bc, 0xf2ecd8], v, cx + xx, cy + yy));
            }
          img.rect(cx - 2, cy - 2, 4, 3, 0x9a9688);
          img.set(cx - 1, cy - 1, 0xe8e4d4);
        }
        // the superstructure aft (north end), its lit bridge windows facing forward
        img.rect(x0 + 3, y0 + 4, x1 - x0 - 6, 18, 0xe8e8e4);
        img.rect(x0 + 3, y0 + 4, x1 - x0 - 6, 2, 0xf8f8f4);
        img.rect(x1 - 4, y0 + 4, 1, 18, 0xa8aca8);
        k.panes(x0 + 4, y0 + 14, x1 - x0 - 8, 6, 1700, { bay: 3, row: 3 });
        img.rect(x0 + 10, y0 + 1, 6, 4, 0x2a5a8a);
        img.rect(x0 + 10, y0, 6, 1, 0x1a1a1e);
      },
    });
    k.reserve(x0, y0, x1 - x0 + 4, y1 - y0);
    // gangway to the quay, mooring lines
    img.rect(SX, Y(1712), 4, 2, 0xc8c8c0);
    for (const u of [1620, 1660, 1740]) img.line(SX - 2, Y(u), x0 + 1, Y(u + 4), 0xd8d4c0, 0.7);
  }
  // the Giant Cantilever Crane (1909): a lattice tower on the quay, its long hammerhead jib out over the ship
  {
    const cx = 44;
    const base = Y(1690);
    const top = base - 58;
    objects.push({
      y: base,
      shadow: () => k.shadowRect(cx - 2, base - 6, 14, 10, 0.5),
      draw: () => {
        const steel = 0x2e3a44;
        const hi = 0x5a6a76;
        for (const s of [-1, 1]) img.line(cx + s * 6, base, cx + s * 4, top, steel);
        for (let y = base; y > top; y -= 5) {
          img.line(cx - 6 + (base - y) / 29, y, cx + 4 - (base - y) / 29, y - 5, hi);
          img.line(cx + 6 - (base - y) / 29, y, cx - 4 + (base - y) / 29, y - 5, steel);
          img.rect(cx - 5, y, 11, 1, steel);
        }
        // the jib: a deep lattice girder, long arm east, short counterweight arm west
        const jx0 = cx - 22;
        const jx1 = cx + 56;
        img.rect(jx0, top - 6, jx1 - jx0, 1, hi);
        img.rect(jx0, top, jx1 - jx0, 1, steel);
        for (let x = jx0; x < jx1; x += 4) {
          img.line(x, top, x + 2, top - 6, steel);
          img.line(x + 2, top - 6, x + 4, top, hi);
        }
        img.rect(jx0, top - 5, 8, 5, 0x3a3e44);
        img.rect(cx - 4, top - 12, 9, 6, 0x4a5660);
        img.rect(cx - 4, top - 12, 9, 1, 0x7a8a96);
        // trolley and hook above the ship
        img.rect(cx + 30, top + 1, 4, 2, 0x8a6a2a);
        img.line(cx + 32, top + 3, cx + 32, top + 30, 0x9aa0a4, 0.8);
        img.rect(cx + 30, top + 30, 4, 3, 0xd8a020);
        glow(jx0, top - 6, 0xff4030, 1);
        glow(jx1 - 1, top - 6, 0xff4030, 1);
        glow(cx, top - 13, 0xff4030, 1);
      },
    });
  }

  // ------------------------------------------------------------ Matsugae terminal (east), u = 1560..1900
  {
    const QX = 124;
    k.fill(QX, Y(1880), 31, 320, C.quay, 43, 6);
    for (let u = 1580; u < 1880; u += 12) {
      img.rect(QX + 1, Y(u), 2, 2, 0x2a2e34);
      img.rect(QX - 1, Y(u) - 2, 1, 5, 0x1a1c20);
    }
    // the terminal: a long low hall with a curved green roof and a glazed waiting room facing the ship
    const ty = Y(1730);
    objects.push({
      y: Y(1660),
      shadow: () => k.shadowRect(QX + 8, ty + 4, 26, 70, 0.5),
      draw: () => {
        for (let y = ty; y < ty + 60; y++)
          for (let x = QX + 6; x < QX + 28; x++) {
            const t = (x - (QX + 6)) / 22;
            const c = rampColor(C.copper, 0.9 - Math.abs(t - 0.35) * 1.3, x, y);
            img.set(x, y, (y - ty) % 6 === 0 ? scaleColor(c, 0.85) : c);
          }
        img.rect(QX + 6, ty + 60, 22, 10, 0xd8dcd8);
        k.panes(QX + 7, ty + 61, 20, 8, 1700, { bay: 3, row: 4, pw: 2, ph: 3 });
        img.rect(QX + 15, ty + 66, 4, 4, 0x3a4048);
      },
    });
    k.reserve(QX + 5, ty - 1, 24, 72);
    // the boarding bridge from the terminal to the liner's side
    img.rect(QX - 4, Y(1696), 11, 3, 0xc8ccd0);
    img.rect(QX - 4, Y(1696), 11, 1, 0xeef0f0);
    // buses and taxis waiting in the forecourt
    for (const [u, c, l] of [[1620, 0xe8e8e0, 10], [1640, 0x3a7a5a, 10], [1772, 0xe8c040, 5], [1782, 0x2a2a30, 5], [1792, 0xe8c040, 5]]) {
      img.rect(QX + 30 - l, Y(u), l, 4, c);
      img.rect(QX + 30 - l, Y(u), l, 1, scaleColor(c, 1.15));
      img.rect(QX + 31 - l, Y(u) + 1, l - 2, 1, 0x5a7080);
    }
    // the cruise liner moored along the quay: white hull, decks, pools, lifeboats, funnel
    const x0 = 96;
    const x1 = 122;
    const y0 = Y(1772);
    const y1 = Y(1588);
    objects.push({
      y: y1,
      shadow: () => {
        for (let y = y0 + 6; y < y1 + 5; y++) for (let x = x0 - 5; x < x0; x++) if (k.wet(x, y)) img.set(x, y, 0x061420, 0.25);
      },
      draw: () => {
        const mid = (x0 + x1) / 2;
        // hull outline: a fine bow to the south, a transom stern north
        k.poly([[x0, y0 + 2], [x1, y0 + 2], [x1, y1 - 26], [mid, y1], [x0, y1 - 26]], 0x1e2a36);
        k.poly([[x0 + 1, y0 + 3], [x1 - 1, y0 + 3], [x1 - 1, y1 - 26], [mid, y1 - 2], [x0 + 1, y1 - 26]], 0xf2f2ee);
        // the west side's rows of balconies catching the low sun
        for (let y = y0 + 8; y < y1 - 26; y += 3) {
          img.rect(x0 + 1, y, 2, 2, 0x3a5a7a);
          img.set(x0 + 1, y, 0xffd8a0);
        }
        // stepped decks
        k.poly([[x0 + 4, y0 + 10], [x1 - 4, y0 + 10], [x1 - 4, y1 - 36], [mid, y1 - 22], [x0 + 4, y1 - 36]], 0xe4e6e4);
        k.poly([[x0 + 7, y0 + 18], [x1 - 7, y0 + 18], [x1 - 7, y1 - 50], [x0 + 7, y1 - 50]], 0xd8dcdc);
        // teak promenade, the pool deck with two blue pools and loungers, the sports deck
        img.rect(x0 + 3, y0 + 10, 1, y1 - y0 - 46, 0xa87a4a);
        img.rect(x1 - 4, y0 + 10, 1, y1 - y0 - 46, 0xa87a4a);
        for (const py of [y0 + 70, y0 + 96]) {
          img.rect(mid - 5, py, 10, 12, 0x2aa8d8);
          img.rect(mid - 5, py, 10, 1, 0x8ae0f8);
          img.rect(mid - 4, py + 2, 2, 8, 0x5ac8f0);
          for (let ly = py - 1; ly < py + 13; ly += 2) {
            img.set(mid - 8, ly, 0xf8f4e8);
            img.set(mid + 7, ly, 0xf8f4e8);
          }
        }
        img.rect(mid - 6, y0 + 32, 12, 14, 0x3a7a5a);
        img.rect(mid - 6, y0 + 38, 12, 1, 0xf0f0e8);
        // funnel: red with a black top, a plume of exhaust
        img.rect(mid - 4, y0 + 52, 8, 10, 0xc8302a);
        img.rect(mid - 4, y0 + 52, 8, 3, 0x1a1a1e);
        img.rect(mid - 4, y0 + 55, 1, 7, 0xf06a5a);
        // the bridge wings across the bow end of the superstructure, lit windows
        img.rect(x0 + 1, y1 - 54, x1 - x0 - 2, 3, 0xf8f8f4);
        k.panes(x0 + 3, y1 - 51, x1 - x0 - 6, 3, 1700, { bay: 2, row: 3, pw: 1, ph: 2 });
        // lifeboats in orange along both sides
        for (let y = y0 + 24; y < y1 - 60; y += 9) {
          img.rect(x0 + 2, y, 2, 6, 0xf08a2a);
          img.rect(x1 - 4, y, 2, 6, 0xf08a2a);
        }
        // mast and the forecastle mooring gear
        img.rect(mid, y1 - 60, 1, 6, 0x5a5e66);
        glow(mid, y1 - 61, 0xffffff, 1);
        img.rect(mid - 3, y1 - 16, 6, 3, 0x7a7e84);
        // windows on the stern face (north end) catching the light
        k.panes(x0 + 2, y0 + 3, x1 - x0 - 4, 5, 1700, { bay: 2, row: 2, pw: 1, ph: 1 });
      },
    });
    k.reserve(x0 - 1, y0, x1 - x0 + 2, y1 - y0);
    // the Gunkanjima tour boat pier at the north end
    img.rect(110, Y(1874), 14, 5, C.concrete[2]);
    img.rect(110, Y(1874), 14, 1, C.concrete[4]);
    for (let x = 111; x < 124; x += 3) img.rect(x, Y(1869), 1, 2, 0x2a2e34);
  }
  // plaza trees between the terminal and the road
  for (const [x, u] of [[140, 1600], [146, 1758], [140, 1804]]) k.tree(x, Y(u), 3.5, CAMPHOR, u);
}
