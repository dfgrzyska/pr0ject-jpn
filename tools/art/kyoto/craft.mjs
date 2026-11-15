// High-resolution (540px wide, S = 3) procedural pixel-art primitives for Stage 1 (Kyoto).
// All layout arguments use logical units (W = 180, L = 7168) or explicit pixel coordinates where noted,
// rendering true 1px detail onto the 540 x 21504 strip and prop frames.
import { Raster, fbm, rng, bayer, mix, scaleColor, pack } from '../../lib/raster.mjs';
import { crownPixels, rampColor, RAMPS } from '../nature.mjs';

export const S = 3;

// Fast deterministic 2D integer hash in [0, 1) for crisp 1px micro-texture without heavy fbm calls
export function hashPx(x, y, seed = 1) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Radial soft light halo accumulated into the post-grade lights list or directly onto a raster. */
export function radialGlow(addLight, cx, cy, rx, ry, color, peakAlpha = 0.45) {
  const ix0 = Math.floor(cx - rx);
  const ix1 = Math.ceil(cx + rx);
  const iy0 = Math.floor(cy - ry);
  const iy1 = Math.ceil(cy + ry);
  for (let y = iy0; y <= iy1; y++)
    for (let x = ix0; x <= ix1; x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      const d2 = dx * dx + dy * dy;
      if (d2 >= 1) continue;
      const fall = (1 - d2) * (1 - d2);
      addLight(x, y, color, peakAlpha * fall);
    }
}

/** Coursed granite flagstones (Hanamikōji, Sando, Shrine walks, Gojō-zaka) in 540px pixel coords. */
export function drawFlagstonesPx(img, px0, py0, pw, ph, ramp, seed = 5, rowH = 9, colW = 16) {
  for (let y = py0; y < py0 + ph; y++) {
    if (y < 0 || y >= img.h) continue;
    const ry = y - py0;
    const row = Math.floor(ry / rowH);
    const inRow = ry % rowH;
    // Slight deterministic per-row width variation
    const stagger = (row & 1) * (colW >> 1) + ((row * 7) % 5);
    for (let x = px0; x < px0 + pw; x++) {
      if (x < 0 || x >= img.w || !img.alpha(x, y)) continue;
      const rx = x - px0 + stagger;
      const col = Math.floor(rx / colW);
      const inCol = rx % colW;
      const stoneHash = hashPx(col, row, seed);
      const grain = hashPx(x, y, seed + 19);
      const hJoint = inRow === rowH - 1;
      const vJoint = inCol === colW - 1;
      let c;
      if (hJoint || vJoint) {
        // Dark mortar joint, occasionally mossy near edges
        const edgeDist = Math.min(x - px0, px0 + pw - 1 - x);
        const mossy = edgeDist < 9 && hashPx(x >> 1, y >> 1, seed + 31) < 0.35;
        c = mossy ? 0x354d2c : scaleColor(ramp[0], 0.82);
      } else if (inRow === 0 && inCol < colW - 2) {
        // Top bevel highlight from overhead-NW light
        c = mix(ramp[2], ramp[3], 0.45 + stoneHash * 0.4);
      } else if (inCol === 0 && inRow < rowH - 2) {
        c = mix(ramp[2], ramp[3], 0.3 + stoneHash * 0.35);
      } else if (inRow === rowH - 2 || inCol === colW - 2) {
        c = mix(ramp[0], ramp[1], 0.5 + stoneHash * 0.3);
      } else {
        const v = 0.32 + stoneHash * 0.42 + (grain - 0.5) * 0.18;
        c = rampColor(ramp, v, x, y);
        // Subtle warm porphyry / weathered granite tint on occasional slabs
        if (stoneHash > 0.82) c = mix(c, 0x9c8e80, 0.22);
        else if (stoneHash < 0.14) c = mix(c, 0x6e7682, 0.2);
      }
      img.set(x, y, c);
    }
  }
}

/** Detailed 3/4 traditional building (shrine, gate, temple, hondo, machiya) at 3x scale. */
export function buildHallObject({
  lx,
  ly,
  lw,
  lRoofH,
  lFaceH,
  style = 'shrine',
  C,
  rand,
  getImg,
  addGlow,
}) {
  const x = Math.round(lx * S);
  const y = Math.round(ly * S);
  const w = Math.round(lw * S);
  const roofH = Math.round(lRoofH * S);
  const faceH = Math.round(lFaceH * S);

  const bark = style === 'shrine' || style === 'gate' || style === 'hondo';
  const ramp = bark ? C.roofBark : style === 'temple' ? C.roofTileDark : rand() < 0.32 ? C.roofTileDark : C.roofTile;
  const ridge = y + Math.round(roofH * 0.32);
  const hi = Math.round(roofH * 0.42);
  const norenColor = rand.pick([0x283a78, 0x7e1c2a, 0x28583a, 0xe8dfd0, 0x4c3468, 0x8a5228]);
  const norenW = Math.min(Math.max(12, Math.round(w * 0.32)), 21);
  const nx = x + 8 + Math.floor(rand() * Math.max(1, w - norenW - 18));
  const bengara = style === 'machiya' && rand() < 0.18;
  const hasHisashi = style === 'machiya' && faceH >= 10;
  const props = [];
  if (style === 'machiya') {
    for (let px = x + 4; px < x + w - 8; px += 9 + Math.floor(rand() * 11)) {
      props.push([px, rand.pick(['pot', 'pot', 'inu', 'inu', 'bike', 'sign', 'bench', 'none'])]);
    }
  }

  return {
    y: (ly + lRoofH + lFaceH) * S,
    shadow: () => {
      const img = getImg();
      for (let j = 0; j < roofH + faceH + 4; j++)
        for (let i = 0; i < w + 4; i++) {
          const edge = i > w || j > roofH + faceH;
          img.tint(x + 9 + i, y + 11 + j, edge ? 0.72 : 0.5);
        }
    },
    draw: () => {
      const img = getImg();
      // 1. Main irimoya (hipped-gable) roof with individual kawara tile ribs or hiwadabuki bark grain
      for (let yy = y; yy < y + roofH; yy++) {
        const north = yy <= ridge;
        const t = north ? (ridge - yy) / Math.max(1, ridge - y) : (yy - ridge) / Math.max(1, y + roofH - 1 - ridge);
        // Subtle upward curve (sori) near eaves
        const curve = Math.pow(1 - t, 0.88);
        const inset = hi * curve;
        for (let xx = x; xx < x + w; xx++) {
          const lxPx = xx - x;
          const rxPx = x + w - 1 - xx;
          const onLeftHip = lxPx < inset;
          const onRightHip = rxPx < inset;
          let c;
          if (onLeftHip) c = mix(ramp[2], ramp[3], 0.75);
          else if (onRightHip) c = ramp[0];
          else c = north ? ramp[2] : mix(ramp[1], ramp[2], (1 - t) * 0.35);

          if (bark) {
            // Fine fibrous cypress-bark thatch texture
            const fiber = hashPx(xx, yy >> 1, 91);
            const band = (yy - y) % 5 === 0 ? 0.92 : 1;
            c = scaleColor(c, (0.93 + fiber * 0.14) * band);
          } else {
            // Individual kawara roof tile courses: ridge-to-eave ribs every 3px + horizontal tile overlaps every 4px
            if (onLeftHip || onRightHip) {
              const course = (yy - y) % 3;
              if (course === 0) c = scaleColor(c, 0.84);
              else if (course === 1) c = scaleColor(c, 1.07);
            } else {
              const rib = (xx - x) % 3;
              const lap = (yy - y) % 5 === 4;
              if (rib === 0) c = scaleColor(c, 0.82); // shadow furrow between round tiles
              else if (rib === 1) c = scaleColor(c, 1.08); // round marugawara highlight
              if (lap) c = scaleColor(c, 0.91);
            }
          }
          // Diagonal hip rafters (kudarimune) with lime-mortar trim
          const dLeft = Math.abs(lxPx - inset);
          const dRight = Math.abs(rxPx - inset);
          if (dLeft < 1.3) c = bark ? C.K : 0x8e99ac;
          else if (dLeft < 2.2) c = ramp[0];
          else if (dRight < 1.3) c = bark ? C.K : 0x5c6576;

          img.set(xx, yy, c);
        }
      }

      // Eave edge: thick hinoki-bark cut face or nokimarugawara round end-tiles
      for (let xx = x + 1; xx < x + w - 1; xx++) {
        if (bark) {
          img.set(xx, y + roofH - 4, scaleColor(ramp[0], 0.85));
          img.set(xx, y + roofH - 3, 0x8e7668);
          img.set(xx, y + roofH - 2, (xx % 2 === 0) ? 0xa68c78 : 0x967c6a);
          img.set(xx, y + roofH - 1, 0x281c18);
        } else {
          img.set(xx, y + roofH - 3, ramp[0]);
          // Round eave end-tiles (nokimarugawara) every 3px catching light
          const endTile = (xx - x) % 3 === 1;
          img.set(xx, y + roofH - 2, endTile ? mix(ramp[3], 0xd8dce6, 0.38) : ramp[1]);
          img.set(xx, y + roofH - 1, 0x1a1c22);
        }
        // North eave highlight
        img.set(xx, y, bark ? scaleColor(ramp[3], 0.9) : mix(ramp[3], 0xbac4d4, 0.28));
      }
      // Trim upturned roof corners
      for (const cxCorner of [x, x + w - 1]) {
        img.clear(cxCorner, y);
        img.clear(cxCorner, y + roofH - 1);
      }

      // Main ridge beam (ōmune) + ornamental end tiles (onigawara / gold fittings)
      const r0 = x + Math.max(2, hi - 1);
      const r1 = x + w - Math.max(2, hi - 1);
      for (let xx = r0; xx < r1; xx++) {
        if (bark) {
          img.set(xx, ridge - 2, 0x463a3e);
          img.set(xx, ridge - 1, C.K);
          img.set(xx, ridge, 0x382c30);
          if ((xx - r0) % 9 === 4) img.set(xx, ridge - 1, C.gold); // gold ridge straps
        } else {
          img.set(xx, ridge - 2, 0xa8b2c4); // white/silver noshi mortar line
          img.set(xx, ridge - 1, (xx & 1) ? 0x6c7688 : 0x7e889a);
          img.set(xx, ridge, ramp[0]);
        }
      }
      // Onigawara / gilded ridge end-caps
      for (const gx of [r0, r1 - 1]) {
        for (let dy = -3; dy <= 1; dy++) {
          img.set(gx, ridge + dy, bark ? C.gold : 0x8e98aa);
          if (bark && dy === -2) img.set(gx, ridge + dy, C.goldHi);
        }
      }
      // Irimoya gable triangle peek (chidorihafu /妻壁) just under hip apex
      if (hi >= 6 && w > hi * 2 + 6) {
        for (const gx of [r0 + 1, r1 - 2]) {
          img.set(gx, ridge + 1, style === 'shrine' || style === 'gate' ? C.white : 0xd8d0c0);
          img.set(gx, ridge + 2, bark ? C.R1 : C.wood[2]);
        }
      }

      // 2. Facade under the eave
      if (faceH <= 0) return;
      const fy = y + roofH;
      const midY = fy + Math.floor(faceH * 0.46);
      const bayW = style === 'machiya' ? 12 : 18;

      for (let yy = fy; yy < fy + faceH; yy++) {
        const dy = yy - fy;
        const upper = yy < midY;
        for (let xx = x + 2; xx < x + w - 2; xx++) {
          const lxPx = xx - (x + 2);
          const inBay = lxPx % bayW;
          let c;
          if (dy === 0) {
            c = 0x140e0c; // deep eave shadow
          } else if (dy === 1 && (style === 'shrine' || style === 'gate' || style === 'temple')) {
            // Kumimono bracket frieze under the eave!
            c = inBay % 4 < 2 ? (style === 'temple' ? C.wood[3] : C.R1) : (style === 'temple' ? 0x1e1610 : 0xdad2c2);
          } else if (style === 'shrine' || style === 'gate') {
            if (inBay < 3) c = inBay === 0 ? C.R1 : inBay === 1 ? C.R2 : C.R3;
            else if (dy === midY - fy) c = C.R2; // nageshi tie-beam
            else if (upper) {
              // White plaster with subtle vertical mullion shadow
              c = inBay === Math.floor(bayW / 2) ? 0xcfc6b4 : C.white;
            } else {
              // Lower vermilion wainscot / slatted grille
              c = inBay % 2 === 0 ? C.R2 : C.R3;
            }
          } else if (style === 'temple') {
            if (inBay < 2) c = inBay === 0 ? C.wood[2] : C.wood[0];
            else if (dy === midY - fy) c = C.wood[1];
            else if (upper) c = inBay % 4 === 0 ? 0xd2cab8 : C.white;
            else c = (xx % 2 === 0) ? C.wood[1] : C.wood[2]; // shitomido / renji panels
          } else if (style === 'hondo') {
            if (inBay < 2) c = C.wood[1];
            else if (dy === midY - fy) c = C.wood[0];
            else c = (xx % 3 === 0) ? C.hinoki[0] : (yy & 1) ? C.hinoki[1] : C.hinoki[2];
          } else {
            // Machiya townhouse facade!
            if (inBay === 0) {
              c = bengara ? 0x4a1612 : C.wood[0];
            } else if (upper) {
              // Tsushi-nikai earthen plaster upper wall (kabe)
              c = bengara ? ((xx + yy) % 3 === 0 ? 0x8c2d22 : 0x9e3528) : ((xx + yy) % 5 === 0 ? 0x4e4034 : 0x5c4c3e);
            } else {
              // 1st floor: fine 1px vertical koshi wooden lattice slats!
              const slat = xx % 2 === 0;
              const warmInside = hashPx(Math.floor(xx / bayW), y, 73) > 0.45 && dy > (midY - fy) + 1 && dy < faceH - 2;
              if (bengara) c = slat ? 0x5c1c16 : warmInside ? 0xc87a48 : 0x8e2c22;
              else c = slat ? C.wood[0] : warmInside ? 0xb88c58 : C.wood[2];
            }
          }
          // Right-edge building shade
          if (xx >= x + w - 4) c = scaleColor(c, 0.78);
          img.set(xx, yy, c);
        }
      }

      // Machiya specifics: 2nd-floor mushiko-mado windows, overhanging hisashi eave, noren curtain, chochin & street-front details
      if (style === 'machiya' && faceH >= 9) {
        // Mushiko-mado slatted windows on upper floor
        for (let xx = x + 6; xx < x + w - 6; xx++) {
          if ((xx - x) % 16 >= 3 && (xx - x) % 16 < 12) {
            for (let wy = fy + 2; wy < midY - 1; wy++) {
              img.set(xx, wy, (xx % 2 === 0) ? 0x261c16 : 0xbcae92);
            }
          }
        }
        // Lower hisashi pent roof separating 2nd and 1st floor
        if (hasHisashi) {
          for (let xx = x + 1; xx < x + w - 1; xx++) {
            img.set(xx, midY - 1, (xx % 2 === 0) ? ramp[2] : ramp[1]);
            img.set(xx, midY, (xx % 3 === 1) ? ramp[3] : ramp[0]);
          }
        }
        // Split noren shop curtain with 3-4 cloth panels & pale kamon crest
        const ny = hasHisashi ? midY + 1 : fy + 2;
        const nh = Math.min(6, faceH - (ny - fy) - 2);
        const panels = 3;
        const pw = Math.max(3, Math.floor(norenW / panels));
        for (let p = 0; p < panels; p++) {
          const px0 = nx + p * pw;
          for (let py = 0; py < nh; py++)
            for (let px = 0; px < pw - 1; px++) {
              const fold = px === 0 ? 1.12 : px === pw - 2 ? 0.85 : 1;
              let nc = scaleColor(norenColor, fold);
              // Tiny white shop crest (mon) in middle of panel
              if (py === Math.floor(nh / 2) && px === Math.floor((pw - 1) / 2)) nc = 0xf2ece0;
              img.set(px0 + px, ny + py, nc);
            }
          // Dark doorway behind noren below it
          for (let py = nh; py < faceH - (ny - fy); py++)
            for (let px = 0; px < pw - 1; px++) img.set(px0 + px, ny + py, 0x18100e);
        }
        // Hanging chochin lantern beside doorway
        const lxLantern = Math.min(x + w - 5, nx + norenW + 2);
        drawChochinPx(img, addGlow, lxLantern, ny + 1, bengara ? 0xf2dfc0 : 0xe8452a);

        // Street-front details along base
        const by = fy + faceH;
        for (const [px, kind] of props) {
          if (px >= nx - 2 && px <= nx + norenW + 4) continue;
          if (px + 7 >= x + w - 2) continue;
          if (kind === 'pot') {
            // Ceramic pot + leafy shrub / camellia
            img.rect(px, by - 1, 4, 3, 0x6e4a38);
            img.rect(px, by - 1, 4, 1, 0x8c624c);
            img.disc(px + 1.8, by - 3, 2.4, 0x2d6230);
            img.disc(px + 1.3, by - 3.6, 1.5, 0x589648);
            if (hashPx(px, by, 7) > 0.5) img.set(px + 2, by - 4, 0xe85a70);
          } else if (kind === 'inu') {
            // Inuyarai curved bamboo lattice fender
            for (let i = 0; i < 8; i++) {
              img.set(px + i, by - 3, (i & 1) ? 0xbfa26e : 0x9c7e4e);
              img.set(px + i, by - 2, (i & 1) ? 0xa88a58 : 0x866a3e);
              img.set(px + i, by - 1, 0x6c5432);
            }
          } else if (kind === 'bike') {
            // Parked bicycle with two dark wheels, frame & basket
            img.disc(px + 1, by, 1.5, 0x22242a);
            img.disc(px + 6, by, 1.5, 0x22242a);
            const fc = rand.pick([0xc83a2a, 0x3a6aa8, 0xdad8d0, 0x3c7a52]);
            img.line(px + 1, by - 1, px + 4, by - 2, fc);
            img.line(px + 3, by - 2, px + 6, by - 1, fc);
            img.set(px + 5, by - 3, 0x8a7452); // front basket
            img.set(px + 2, by - 3, 0x2a2424); // saddle
          } else if (kind === 'sign') {
            // Standing wooden andon menu board with warm inner glow
            img.rect(px, by - 5, 4, 6, 0x3a2618);
            img.rect(px + 1, by - 4, 2, 4, 0xf2e4c2);
            img.set(px + 1, by - 3, 0x2a201c);
            addGlow(px + 1, by - 3, 0xffd88a, 0.35);
          } else if (kind === 'bench') {
            // Red cloth-covered床几 (shōgi) tea bench
            img.rect(px, by - 2, 8, 3, 0xc82e24);
            img.rect(px, by - 2, 8, 1, 0xe24838);
            img.set(px + 1, by + 1, 0x2a1c14);
            img.set(px + 6, by + 1, 0x2a1c14);
          }
        }
      }

      // Gate passage + ceremonial shimenawa / gold fittings
      if (style === 'gate') {
        const gw = Math.max(10, Math.round(w * 0.24));
        const gx0 = x + Math.floor((w - gw) / 2);
        img.rect(gx0, fy + 3, gw, faceH - 3, 0x120b0a);
        // Archway beam & framed plaque above passage
        img.rect(gx0 - 1, fy + 2, gw + 2, 2, C.R1);
        img.rect(gx0 + Math.floor(gw / 2) - 3, fy + 1, 6, 3, C.K);
        img.rect(gx0 + Math.floor(gw / 2) - 2, fy + 2, 4, 1, C.gold);
        // Hanging chochin lanterns flanking the gate passage
        drawChochinPx(img, addGlow, gx0 - 4, fy + 4, 0xf2dfc0);
        drawChochinPx(img, addGlow, gx0 + gw + 3, fy + 4, 0xf2dfc0);
      }

      // Shrine / hondo suzu bell-rope & offering box (saisen-bako) at center
      if ((style === 'shrine' || style === 'hondo') && w >= 48 && faceH >= 12) {
        const cx = x + Math.floor(w / 2);
        // Shimenawa sacred straw rope under eave
        for (let sx = cx - 10; sx <= cx + 10; sx++) {
          const sag = Math.round((1 - ((sx - cx) / 10) ** 2) * 2);
          img.set(sx, fy + 2 + sag, (sx & 1) ? 0xd8c28a : 0xb89e68);
          if ((sx - cx) % 5 === 0) {
            img.set(sx, fy + 4 + sag, 0xf6f4ee); // white shide zigzag paper
            img.set(sx, fy + 5 + sag, 0xf6f4ee);
          }
        }
        // Wooden saisen-bako offering chest
        img.rect(cx - 5, fy + faceH - 4, 10, 4, C.wood[2]);
        img.rect(cx - 5, fy + faceH - 4, 10, 1, C.wood[3]);
      }

      // Stone foundation plinth (kidan) along base
      for (let xx = x + 1; xx < x + w - 1; xx++) {
        img.set(xx, fy + faceH, (xx % 8 === 0) ? C.stone[0] : C.stone[2]);
        img.set(xx, fy + faceH + 1, C.stone[0]);
      }
    },
  };
}

/** Hanging paper lantern (chōchin) in pixel coordinates, with black lacquer rims & warm halo. */
export function drawChochinPx(img, addGlow, px, py, color = 0xe8452a, big = false) {
  const rx = big ? 3.2 : 2.1;
  const ry = big ? 4.2 : 2.8;
  for (let dy = -Math.ceil(ry); dy <= Math.ceil(ry); dy++)
    for (let dx = -Math.ceil(rx); dx <= Math.ceil(rx); dx++) {
      if ((dx / rx) ** 2 + (dy / ry) ** 2 > 1) continue;
      const rib = Math.abs(dy) % 2 === 1;
      const lit = 1 - (dx * dx + dy * dy) / (rx * rx + ry * ry) * 0.45;
      const base = mix(color, 0xfff2c0, Math.max(0, 0.45 - Math.hypot(dx, dy) * 0.14));
      img.set(px + dx, py + dy, scaleColor(base, rib ? lit * 0.88 : lit));
    }
  // Top & bottom lacquer caps (kaza)
  img.rect(px - 1, Math.round(py - ry), 3, 1, 0x1c1418);
  img.rect(px - 1, Math.round(py + ry), 3, 1, 0x1c1418);
  radialGlow(addGlow, px, py, big ? 11 : 7, big ? 10 : 6, mix(color, 0xffe29a, 0.55), big ? 0.42 : 0.34);
  addGlow(px, py, 0xfff4c8, 0.75);
}

/** Carved stone lantern (tōrō) in logical coords -> drawn at 3x pixel coords. */
export function buildStoneLantern({ lx, ly, lit = true, C, getImg, addGlow }) {
  const x = Math.round(lx * S) + 3;
  const y = Math.round(ly * S) + 4;
  return {
    y: y + 10,
    shadow: () => {
      const img = getImg();
      for (let j = 0; j < 9; j++)
        for (let i = 0; i < 10; i++) img.tint(x + i, y + 4 + j, 0.54);
    },
    draw: () => {
      const img = getImg();
      // Base pedestal (kiso)
      img.rect(x - 4, y + 8, 9, 3, C.stone[0]);
      img.rect(x - 4, y + 7, 9, 1, C.stone[2]);
      // Cylindrical shaft (sao)
      img.rect(x - 2, y + 3, 5, 4, C.stone[1]);
      img.rect(x - 2, y + 3, 2, 4, C.stone[2]);
      // Middle platform (chūdai)
      img.rect(x - 4, y + 2, 9, 1, C.stone[2]);
      // Firebox (hibukuro) with carved lattice window
      img.rect(x - 3, y - 2, 7, 4, C.stone[1]);
      img.set(x - 3, y - 2, C.stone[2]);
      if (lit) {
        img.rect(x - 1, y - 1, 3, 2, 0xffd47e);
        img.set(x, y - 1, 0xfff4c8);
        radialGlow(addGlow, x, y, 10, 8, 0xffc868, 0.32);
        addGlow(x, y - 1, 0xfff2c0, 0.85);
      } else {
        img.rect(x - 1, y - 1, 3, 2, C.stone[0]);
      }
      // Curved hexagonal umbrella roof (kasa) with warabite corner scrolls & hōju finial
      img.rect(x - 6, y - 3, 13, 1, C.stone[0]);
      img.rect(x - 5, y - 4, 11, 1, C.stone[2]);
      img.rect(x - 3, y - 5, 7, 1, C.stone[2]);
      img.set(x - 6, y - 4, C.stone[3]);
      img.set(x + 6, y - 4, C.stone[1]);
      img.rect(x - 1, y - 7, 3, 2, C.stone[3]);
      img.set(x, y - 8, C.stone[3]);
    },
  };
}

/** Guardian Inari fox statue (komagitsune) or temple lion-dog (komainu) on stone plinth, at 3x. */
export function buildGuardianStatue({ lx, ly, flip = false, kind = 'fox', C, getImg }) {
  const x = Math.round(lx * S) + 4;
  const y = Math.round(ly * S) + 4;
  const dir = flip ? -1 : 1;
  return {
    y: y + 16,
    shadow: () => {
      const img = getImg();
      for (let j = 2; j < 16; j++)
        for (let i = -3; i < 12; i++) img.tint(x + i + 3, y + j + 2, 0.54);
    },
    draw: () => {
      const img = getImg();
      // Stepped stone pedestal with moss touches
      img.rect(x - 5, y + 10, 14, 7, C.stone[0]);
      img.rect(x - 5, y + 9, 14, 2, C.stone[2]);
      img.rect(x - 4, y + 9, 6, 1, C.stone[3]);
      img.rect(x - 4, y + 7, 12, 2, C.stone[1]);
      if (kind === 'komainu') {
        // Muscular stone lion-dog
        img.ellipse(x + 2, y + 3, 4.5, 4.2, C.stone[2]);
        img.disc(x + 2 + dir * 2, y - 2, 3.2, C.stone[2]);
        img.disc(x + 1 + dir * 2, y - 2.5, 2.0, C.stone[3]);
        img.disc(x + 2 - dir * 3, y + 2, 2.2, C.stone[1]); // curled tail
        img.set(x + 2 + dir * 3, y - 2, 0x2a2424);
      } else {
        // Seated porcelain/stone Inari fox with pointed ears, fluffy upright tail, vermilion maekake bib & key/jewel
        const bodyLight = 0xe4ded2;
        const bodyMid = 0xc8c0b2;
        const bodyShade = 0x968e82;
        // Fluffy upright tail
        const tx = x + 2 - dir * 4;
        img.ellipse(tx, y + 2, 2.3, 4.5, bodyMid);
        img.ellipse(tx - 0.5, y + 1, 1.4, 3.2, bodyLight);
        // Seated torso & haunches
        img.ellipse(x + 2, y + 4, 3.4, 4.2, bodyMid);
        img.ellipse(x + 1.2, y + 3.5, 2.2, 3.2, bodyLight);
        img.rect(x + 2 + dir * 1, y + 5, 2, 3, bodyShade);
        // Head & snout
        const hx = x + 2 + dir * 2;
        img.disc(hx, y - 1, 2.6, bodyLight);
        img.rect(hx + (dir > 0 ? 1 : -3), y - 1, 3, 2, bodyMid);
        // Tall pointed ears
        for (const ex of [hx - 1, hx + 1]) {
          img.line(ex, y - 3, ex, y - 6, bodyLight);
          img.set(ex, y - 4, 0xc86a62);
        }
        // Vermilion votive bib (yodarekake) draped over chest
        img.rect(x, y + 2, 5, 3, C.R1);
        img.rect(x + 1, y + 4, 3, 2, C.R2);
        // Golden key / sacred jewel in mouth
        img.set(hx + dir * 3, y, C.goldHi);
        img.set(hx + dir * 1, y - 2, 0x2c2220); // eye
      }
    },
  };
}

/** Vermilion or unbarked black-wood (kuroki) torii gate in 3/4 view at 3x scale. */
export function drawToriiPx(img, cx, y, hw, C, tone = 1, black = false, tunnelInterior = true) {
  const R1 = black ? 0x524034 : scaleColor(C.R1, tone);
  const R2 = black ? 0x382b23 : scaleColor(C.R2, tone);
  const R3 = black ? 0x241b16 : scaleColor(C.R3, tone);

  // Dark shadowed tunnel interior between closely-spaced gates
  if (tunnelInterior) {
    for (let r = 5; r <= 15; r++)
      for (let xx = cx - hw + 2; xx <= cx + hw - 2; xx++) img.set(xx, y + r, C.IN, 0.88);
  }
  // Cylindrical pillars (hashira) with nemaki black base collars
  for (const px of [cx - hw, cx + hw]) {
    for (let r = 3; r <= 17; r++) {
      const collar = r >= 15;
      img.set(px - 1, y + r, collar ? C.K : R1);
      img.set(px, y + r, collar ? 0x2e2428 : R2);
      img.set(px + 1, y + r, collar ? C.K : R3);
    }
  }
  // Lower tie-beam (nuki) protruding through pillars with black wedges
  for (let xx = cx - hw - 4; xx <= cx + hw + 4; xx++) {
    img.set(xx, y + 8, R1);
    img.set(xx, y + 9, R2);
    img.set(xx, y + 10, R3);
  }
  img.set(cx - hw - 2, y + 8, C.K);
  img.set(cx + hw + 2, y + 8, C.K);
  // Central strut (gakuzuka) & small plaque
  for (let r = 3; r <= 8; r++) {
    img.set(cx - 1, y + r, C.K);
    img.set(cx, y + r, r >= 4 && r <= 7 ? (black ? 0x9c8862 : C.gold) : C.K);
    img.set(cx + 1, y + r, C.K);
  }
  // Upper lintel: curved black kasagi cap + vermilion shimagi below
  for (let xx = cx - hw - 7; xx <= cx + hw + 7; xx++) {
    const wing = Math.max(0, Math.abs(xx - cx) - (hw + 1));
    const lift = wing >= 4 ? -2 : wing >= 2 ? -1 : 0;
    img.set(xx, y + lift, black ? 0x2c221c : C.K);
    img.set(xx, y + 1 + lift, black ? 0x3e3028 : 0x2e2228);
    if (Math.abs(xx - cx) <= hw + 5) {
      img.set(xx, y + 2 + lift, R1);
      img.set(xx, y + 3 + lift, R2);
    }
  }
}

export function drawToriiShadowPx(img, cx, y, hw) {
  for (let r = 0; r <= 18; r++) {
    for (let dx = 6; dx <= 11; dx++) img.tint(cx + hw + dx, y + r + 3, dx < 9 ? 0.56 : 0.74);
  }
}

/** Monumental Ōtorii (Great Torii) at Fushimi Inari Sando in 3x pixel coords. */
export function buildGreatTorii({ lcx, ly, lhw, C, getImg }) {
  const cx = Math.round(lcx * S);
  const y = Math.round(ly * S);
  const hw = Math.round(lhw * S);
  const paint = (sh) => {
    const img = getImg();
    const put = (px, py, c) => (sh ? img.tint(px + 14, py + 16, 0.52) : img.set(px, py, c));
    // Massive cylindrical pillars with stone plinths & black iron nemaki collars
    for (const px of [cx - hw, cx + hw]) {
      for (let py = y + 11; py <= y + 40; py++) {
        const base = py >= y + 35;
        for (let dx = -6; dx <= 6; dx++) {
          const shade = dx < -2 ? C.R1 : dx > 2 ? C.R3 : C.R2;
          const col = base ? (dx < -2 ? 0x3c3438 : C.K) : shade;
          put(px + dx, py, col);
        }
      }
      if (!sh) {
        img.rect(px - 8, y + 40, 17, 3, C.stone[2]);
        img.rect(px - 8, y + 42, 17, 1, C.stone[0]);
      }
    }
    // Nuki tie-beam with black wedges
    for (let px = cx - hw - 13; px <= cx + hw + 13; px++) {
      for (let dy = 22; dy <= 28; dy++) {
        put(px, y + dy, dy < 24 ? C.R1 : dy > 26 ? C.R3 : C.R2);
      }
    }
    // Sweeping kasagi & shimagi lintel with dramatic upturned ends
    for (let px = cx - hw - 22; px <= cx + hw + 22; px++) {
      const dist = Math.max(0, Math.abs(px - cx) - (hw + 4));
      const lift = Math.round((dist / 18) ** 1.6 * 6);
      for (let dy = 0; dy < 5; dy++) put(px, y + dy - lift, dy === 0 ? 0x42363c : C.K);
      if (Math.abs(px - cx) <= hw + 18) {
        for (let dy = 5; dy < 11; dy++) put(px, y + dy - lift, dy < 8 ? C.R1 : C.R2);
      }
    }
    // Gilded central Inari plaque (shinmei-gaku)
    for (let py = y + 10; py <= y + 22; py++)
      for (let px = cx - 8; px <= cx + 8; px++) {
        const frame = Math.abs(px - cx) >= 6 || py <= y + 11 || py >= y + 21;
        const callig = !frame && Math.abs(px - cx) <= 1 && py >= y + 13 && py <= y + 19;
        put(px, py, frame ? C.K : callig ? C.goldHi : py % 2 ? C.gold : 0xaa7820);
      }
  };
  return {
    y: y + 42,
    shadow: () => paint(true),
    draw: () => paint(false),
  };
}

/** Multi-storey Pagoda (5-storey Yasaka Hōkan-ji, 3-storey Kiyomizu & Koyasu) at 3x scale. */
export function buildPagoda({ lcx, luBase, L, tiers, opt = {}, C, getImg }) {
  const { w0 = 30, step = 4, floorH = 7, roofH = 6, wall = 'vermilion', ramp = C.roofTileDark } = opt;
  const cx = Math.round(lcx * S);
  const y0 = Math.round((L - luBase) * S);
  const pw0 = w0 * S;
  const pStep = step * S;
  const pFloorH = floorH * S;
  const pRoofH = roofH * S;

  const parts = [];
  let y = y0;
  for (let i = 0; i < tiers; i++) {
    const ww = pw0 - i * pStep;
    parts.push({ ww, wallTop: y - pFloorH, wallBot: y });
    y = y - pFloorH - pRoofH + 6;
  }
  const top = y;
  return {
    y: y0 + 12,
    shadow: () => {
      const img = getImg();
      for (const p of parts) {
        const sx0 = Math.round(cx - p.ww / 2) + 26;
        for (let j = 0; j < p.wallBot - p.wallTop + pRoofH; j++)
          for (let i = 0; i < p.ww + 22; i++) img.tint(sx0 + i, p.wallTop + 22 + j, 0.54);
      }
      for (let k = 0; k < 52; k++) {
        img.tint(cx + 28 + Math.floor(k * 0.45), top + 24 - k, 0.58);
        img.tint(cx + 29 + Math.floor(k * 0.45), top + 24 - k, 0.68);
      }
    },
    draw: () => {
      const img = getImg();
      // Carved stone kidan platform with central stair steps
      const kx0 = Math.round(cx - pw0 / 2) - 12;
      const kw = pw0 + 24;
      img.rect(kx0, y0, kw, 11, C.stone[1]);
      img.rect(kx0, y0, kw, 2, C.stone[3]);
      img.rect(kx0, y0 + 9, kw, 2, C.stone[0]);
      for (let sx = kx0 + 6; sx < kx0 + kw - 6; sx += 12) img.rect(sx, y0 + 2, 1, 7, C.stone[0]);
      for (let s = 0; s < 5; s++) {
        img.rect(cx - 9, y0 + 2 + s * 2, 18, 1, s % 2 ? C.stone[3] : C.stone[0]);
      }

      // Storeys from top to bottom for walls, then roofs with upturned eaves & balconies
      for (let k = parts.length - 1; k >= 0; k--) {
        const { ww, wallTop, wallBot } = parts[k];
        const x0 = Math.round(cx - ww / 2);
        const bay = Math.max(8, Math.floor(ww / 3));
        for (let yy = wallTop; yy < wallBot; yy++) {
          const dy = yy - wallTop;
          for (let xx = x0; xx < x0 + ww; xx++) {
            const lxPx = xx - x0;
            const isPost = lxPx < 2 || lxPx >= ww - 2 || lxPx % bay < 2;
            const inBay = lxPx % bay;
            let c;
            if (dy < 3) {
              // Bracket complex (tokyō) under deep eave shadow
              c = (lxPx % 4 < 2) ? (wall === 'vermilion' ? C.R2 : C.wood[2]) : 0x18100d;
            } else if (wall === 'vermilion') {
              if (isPost) c = lxPx < 4 ? C.R1 : C.R2;
              else if (dy >= 5 && dy < pFloorH - 4 && inBay >= 4 && inBay < bay - 3) {
                // Green renji-mado slatted window or white plaster bay
                c = (lxPx & 1) ? 0x4c7c62 : C.white;
              } else c = C.R2;
            } else {
              if (isPost) c = lxPx < 4 ? C.wood[3] : C.wood[0];
              else if (dy >= 5 && dy < pFloorH - 4 && inBay >= 4 && inBay < bay - 3) {
                c = (lxPx & 1) ? C.wood[1] : 0xd8cfc0;
              } else c = C.wood[2];
            }
            if (lxPx >= ww - 4) c = scaleColor(c, 0.72);
            img.set(xx, yy, c);
          }
        }
        // Kōran balcony railing around upper storeys
        if (k > 0) {
          for (let xx = x0 - 3; xx <= x0 + ww + 2; xx++) {
            const bal = (xx - x0) % 3 === 0;
            img.set(xx, wallBot - 2, wall === 'vermilion' ? C.R1 : C.wood[3]);
            if (bal) img.set(xx, wallBot - 1, wall === 'vermilion' ? C.R2 : C.wood[1]);
          }
        }
      }

      // Sweeping tiled pagoda roofs with hip rafters, tile ribs & corner wind-bells
      for (let k = parts.length - 1; k >= 0; k--) {
        const { ww, wallTop } = parts[k];
        const above = parts[k + 1];
        const eave = wallTop + 3;
        const botW = ww + 38;
        const topW = above ? above.ww : 16;
        for (let xx = Math.round(cx - ww / 2); xx < Math.round(cx + ww / 2); xx++) {
          img.tint(xx, eave + 1, 0.62);
          img.tint(xx, eave + 2, 0.78);
        }
        for (let j = 0; j < pRoofH; j++) {
          const t = j / Math.max(1, pRoofH - 1);
          const hw = (botW / 2) * Math.pow(1 - t, 0.56) + (topW / 2) * (1 - Math.pow(1 - t, 0.56));
          const leftEdge = Math.round(cx - hw);
          const rightEdge = Math.round(cx + hw);
          for (let xx = leftEdge; xx < rightEdge; xx++) {
            const lxPx = xx - leftEdge;
            const rxPx = rightEdge - 1 - xx;
            let c;
            if (lxPx < 7) c = ramp[3];
            else if (rxPx < 8) c = ramp[0];
            else if (j === 0) c = ((xx - cx) % 3 === 0) ? mix(ramp[3], 0xd8dee8, 0.35) : ramp[2];
            else if (j === 1) c = ramp[0];
            else {
              const rib = (xx - cx) % 3;
              c = rib === 0 ? scaleColor(ramp[1], 0.85) : rib === 1 ? ramp[2] : ramp[1];
            }
            // Diagonal hip rafters
            const hipPos = Math.round(t * (ww * 0.36) + 4);
            if (Math.abs(lxPx - hipPos) <= 1) c = 0x8e98aa;
            else if (Math.abs(rxPx - hipPos) <= 1) c = ramp[0];
            img.set(xx, eave - j, c);
          }
          // Upturned warabite eave tips & tiny bronze wind-bell (fūtaku)
          if (j === 0) {
            for (let u = 1; u <= 3; u++) {
              img.set(leftEdge - u, eave - u, ramp[3]);
              img.set(rightEdge - 1 + u, eave - u, ramp[1]);
            }
            img.set(leftEdge - 2, eave + 1, 0x9c8248);
            img.set(rightEdge + 1, eave + 1, 0x7c6434);
          }
        }
      }

      // Bronze/gold sōrin spire: roban basin, lotus ukebana, 9 kurin rings, suien flame & sacred jewel
      const spireBase = top + 6;
      img.rect(cx - 4, spireBase - 2, 9, 3, 0x5c5248);
      img.rect(cx - 4, spireBase - 2, 5, 1, 0x8c7e6c);
      img.rect(cx - 3, spireBase - 4, 7, 2, C.gold);
      for (let j = 0; j < 42; j++) {
        const sy = spireBase - 5 - j;
        const ring = j < 28 && j % 3 === 1;
        img.set(cx, sy, ring ? C.goldHi : C.gold);
        img.set(cx - 1, sy, ring ? C.gold : 0x7c5c2e);
        img.set(cx + 1, sy, 0x5e4420);
        if (ring) {
          const rw = j < 14 ? 3 : 2;
          img.set(cx - rw, sy, C.gold);
          img.set(cx + rw, sy, 0x8a6830);
        }
        // Suien flame filigree near top
        if (j >= 30 && j <= 37 && j % 2 === 0) {
          img.set(cx - 2, sy, C.gold);
          img.set(cx + 2, sy, 0x9a7434);
        }
      }
      img.disc(cx, spireBase - 48, 1.8, C.goldHi);
    },
  };
}

/** 540px Tree & Mōsō Bamboo generator (returns object { y, shadow, draw }). */
export function buildTreeHD({ kind, lx, ly, lr, rand, PW, PL, isResPx, getImg, canopy }) {
  const seed = Math.floor(rand() * 1e9);
  const cx = Math.round(lx * S);
  const cy = Math.round(ly * S);
  const r = lr * S;

  if (kind === 'bamboo') {
    const h = (45 + (seed % 19)) * S;
    const lean = (seed % 5 - 2) * S;
    const nodePeriod = 22 + (seed % 7);
    const stalk = (yy) => cx + Math.round((lean * (cy - yy)) / h + Math.sin((cy - yy) * 0.025 + seed) * 1.4);
    const put = (img, x, y, c, leaf = false) => {
      if (x < 0 || x >= PW || y < 0 || y >= PL || isResPx(x, y)) return;
      img.set(x, y, c);
      if (leaf) canopy[y * PW + x] = 1;
    };
    return {
      y: cy,
      shadow: () => {
        const img = getImg();
        for (let j = 0; j < h; j++) {
          const sx = stalk(cy - j) + 8;
          if (!isResPx(sx, cy - j)) {
            img.tint(sx, cy - j, 0.68);
            img.tint(sx + 1, cy - j, 0.76);
          }
        }
      },
      draw: () => {
        const img = getImg();
        // Cylindrical Mōsō bamboo culm (5px wide at base tapering to 3px at crown) with crisp node rings
        for (let yy = cy - h; yy <= cy; yy++) {
          const x = stalk(yy);
          const taper = (cy - yy) > h * 0.72;
          if (!taper) {
            put(img, x - 2, yy, 0x1e3826);
            put(img, x - 1, yy, 0x3b663c);
            put(img, x, yy, 0x709a52);
            put(img, x + 1, yy, 0xa2be6e);
            put(img, x + 2, yy, 0x5c8244);
          } else {
            put(img, x - 1, yy, 0x325834);
            put(img, x, yy, 0x78a056);
            put(img, x + 1, yy, 0xa8c474);
          }
          // Prominent bamboo culm node ring & dark sheath scar
          if ((cy - yy + seed) % nodePeriod === 0) {
            const nw = taper ? 2 : 3;
            for (let dx = -nw; dx <= nw; dx++) put(img, x + dx, yy, dx <= 0 ? 0xc8cc92 : 0x9aa468);
            for (let dx = -nw + 1; dx <= nw - 1; dx++) put(img, x + dx, yy + 1, 0x2c4e2e);
          }
        }
        // Feathery pointed bamboo leaf sprays along upper nodes
        const pr = rng(seed ^ 0x5a5a);
        for (let j = 0; j < 5; j++) {
          const by = cy - h + j * 11;
          for (const side of [-1, 1]) {
            const reach = 13 + (j % 3) * 4;
            for (let k = 1; k <= reach; k++) {
              const bx = stalk(by) + side * k;
              const branchY = by - Math.floor(k * 0.28) + Math.floor((k * k) / 48);
              put(img, bx, branchY, 0x5a7e3e, true);
              if (k % 3 === 1) {
                // Pair of slender lance-shaped leaflets
                const leafLen = 6 + Math.floor(pr() * 5);
                const cLit = pr() > 0.45 ? 0xaac46c : 0x86aa56;
                const cMid = 0x628a42;
                const cDark = 0x3c6230;
                for (let q = 1; q <= leafLen; q++) {
                  put(img, bx + side * Math.ceil(q * 0.7), branchY + q, q < 3 ? cLit : q < leafLen - 1 ? cMid : cDark, true);
                  if (q < leafLen - 1) put(img, bx + side * Math.ceil(q * 0.7) + side, branchY + q, cMid, true);
                  put(img, bx + side * q, branchY - Math.floor(q * 0.45), q < 3 ? cLit : cMid, true);
                }
              }
            }
          }
        }
      },
    };
  }

  // Multi-clump high-res sakura, pine, cedar & broadleaf crowns
  const buildPx = () => {
    const tr = rng(seed);
    const baseRamp = RAMPS[kind] ?? RAMPS.broadleaf;
    // Richer 6-step ramps at 540px so blossom clusters & pine pads have crisp depth
    const ramp =
      kind === 'sakura'
        ? [0x5e2c48, 0x884468, 0xb8688c, 0xdf92b0, 0xf5bdd2, 0xffe6f0]
        : kind === 'pine'
          ? [0x0f2217, 0x1a3522, 0x284c2e, 0x3b6639, 0x548248, 0x74a05c]
          : kind === 'cedar'
            ? [0x0d1c17, 0x162c22, 0x224031, 0x325843, 0x487258, 0x628e6e]
            : [0x152b1b, 0x224226, 0x335d31, 0x4b7d3f, 0x6c9e50, 0x8fbd66];

    const clumps = [];
    const spiky = kind === 'cedar';
    if (spiky) {
      clumps.push([0, 2, r * 0.98], [0, -r * 0.22, r * 0.72], [0, -r * 0.42, r * 0.46]);
    } else if (kind === 'pine') {
      // Japanese garden/mountain pine: distinct horizontal cloud-pads (tamamono)
      const pads = 5 + Math.floor(tr() * 3);
      clumps.push([0, -r * 0.15, r * 0.62]);
      for (let i = 0; i < pads; i++) {
        const a = (i / pads) * Math.PI * 2 + tr() * 0.5;
        const d = r * (0.38 + tr() * 0.34);
        clumps.push([Math.cos(a) * d, Math.sin(a) * d * 0.82, r * (0.38 + tr() * 0.18)]);
      }
    } else {
      // Sakura & broadleaf: lush overlapping blossom/foliage domes + sub-clusters
      const n = kind === 'tiny' ? 4 : 6 + Math.floor(tr() * 4);
      clumps.push([0, 0, r * 0.74]);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + (tr() - 0.5) * 0.55;
        const d = r * (0.34 + tr() * 0.38);
        clumps.push([Math.cos(a) * d, Math.sin(a) * d * 0.92, r * (0.42 + tr() * 0.24)]);
      }
    }

    const out = [];
    const R = Math.ceil(r * 1.38) + 2;
    const spikes = 9 + (seed % 5);
    const ph = (seed % 628) * 0.01;
    // Trunk / gnarled branch glimpse under southern rim of sakura & pine
    const showTrunk = (kind === 'sakura' || kind === 'pine') && r >= 15;
    if (showTrunk) {
      const tw = Math.max(2, Math.round(r * 0.12));
      const th = Math.round(r * 0.48);
      for (let ty = 0; ty <= th; ty++)
        for (let tx = -tw; tx <= tw; tx++) {
          out.push({ x: cx + tx, y: cy + Math.round(r * 0.42) + ty, c: tx < 0 ? 0x563c2c : 0x36241a, trunk: true });
        }
    }

    for (let y = -R; y <= R; y++)
      for (let x = -R; x <= R; x++) {
        let best = null;
        for (let ci = 0; ci < clumps.length; ci++) {
          const [ox, oy, cr] = clumps[ci];
          const dx = x + 0.5 - ox;
          const dy = (y + 0.5 - oy) * (kind === 'pine' ? 1.22 : 1);
          let rr = cr;
          if (spiky) {
            const ang = Math.atan2(dy, dx);
            rr = cr * (0.76 + 0.24 * Math.cos(spikes * ang + ph + ci));
          } else {
            // Scalloped leafy rim so crowns never look like smooth plastic spheres
            const ang = Math.atan2(dy, dx);
            rr = cr * (0.91 + 0.09 * Math.sin(7 * ang + ci * 1.7) + 0.05 * Math.cos(13 * ang - ph));
          }
          const d2 = (dx * dx + dy * dy) / (rr * rr);
          if (d2 > 1) continue;
          const h = Math.sqrt(1 - d2) * cr + (spiky ? (1 - Math.sqrt(d2)) * cr * 0.8 + ci * 3 : 0);
          if (!best || h > best.h) best = { h, nx: dx / rr, ny: dy / rr, nz: Math.sqrt(1 - d2), ci };
        }
        if (!best) continue;
        const ax = cx + x;
        const ay = cy + y;
        const macro = fbm(ax, ay, { seed: seed & 1023, scale: 6.5, octaves: 2 });
        const leaf = hashPx(ax >> 1, ay >> 1, seed + 41);
        let v = (-best.nx * 0.52 - best.ny * 0.58 + best.nz * 0.62) * 0.68 + 0.34;
        v += (macro - 0.5) * 0.42 + (leaf - 0.5) * 0.24;
        // Dark ambient-occlusion crease where sub-clumps tuck under upper clumps
        if (best.nz < 0.36 && best.ny > 0.15) v -= 0.16;
        out.push({ x: ax, y: ay, c: rampColor(ramp, v, ax, ay) });
      }
    return out;
  };

  let cached = null;
  const px = () => (cached ??= buildPx());
  const off = Math.round(5 + r * 0.24);
  return {
    y: cy + r * 0.62,
    shadow: () => {
      const img = getImg();
      for (const p of px()) {
        if (!p.trunk) img.tint(p.x + off, p.y + off + 3, 0.52);
      }
      // Fallen sakura petals scattered around the shadow on ground & paths!
      if (kind === 'sakura') {
        const pr = rng(seed ^ 0x7711);
        const count = Math.round(r * 2.2);
        for (let i = 0; i < count; i++) {
          const a = pr() * Math.PI * 2;
          const d = r * (0.82 + pr() * 0.65);
          const x2 = Math.round(cx + Math.cos(a) * d);
          const y2 = Math.round(cy + Math.sin(a) * d);
          if (img.alpha(x2, y2)) {
            const pc = pr() < 0.4 ? 0xf2bdd0 : pr() < 0.75 ? 0xd888a6 : 0xa85e7c;
            img.set(x2, y2, pc);
            if (pr() < 0.35 && img.alpha(x2 + 1, y2)) img.set(x2 + 1, y2, pc);
          }
        }
      }
    },
    draw: () => {
      const img = getImg();
      for (const p of px()) img.set(p.x, p.y, p.c);
    },
  };
}

/** Recognizable 540px top-down/3/4 person (tourist or Gion maiko with obi & kanzashi) at pixel coords. */
export function drawPersonPx(img, px, py, isMaiko, kimonoColors, pr) {
  if (!img.alpha(px, py)) return;
  // Soft ground shadow
  img.ellipse(px + 2, py + 2, 3.2, 1.6, 0x0e1218, 0.46);
  if (isMaiko) {
    const col = kimonoColors[Math.floor(pr() * kimonoColors.length)];
    const obi = pr() < 0.5 ? 0xe8b840 : 0xd83c38;
    // Trailing hem & white tabi
    img.set(px - 1, py + 2, 0xf4f2ee);
    img.set(px + 1, py + 2, 0xf4f2ee);
    // Patterned kimono sleeves & body
    img.rect(px - 2, py - 2, 5, 4, col);
    img.set(px - 2, py, scaleColor(col, 0.8)); // left sleeve drape
    img.set(px + 2, py, scaleColor(col, 0.75)); // right sleeve drape
    img.set(px - 1, py - 1, mix(col, 0xffffff, 0.45)); // floral kimono accent
    // Trailing darari-obi sash on back
    img.rect(px - 1, py, 3, 1, obi);
    img.set(px, py + 1, scaleColor(obi, 0.85));
    // White nape/collar, glossy black nihongami chignon & floral kanzashi hairpin!
    img.set(px, py - 2, 0xf6f0ea);
    img.disc(px, py - 4, 1.8, 0x161218);
    img.set(px + 1, py - 5, pr() < 0.5 ? 0xf6d878 : 0xf2789c);
    img.set(px - 1, py - 4, 0xe84858);
  } else {
    const jacket = pr() < 0.55 ? [0xc83e3c, 0x3868c2, 0xe2b842, 0xe6e6ee, 0x569c54, 0x7e58a0][Math.floor(pr() * 6)] : 0x383c4c;
    const pants = 0x242836;
    img.set(px - 1, py + 1, pants);
    img.set(px + 1, py + 2, pants);
    img.rect(px - 2, py - 2, 4, 3, jacket);
    img.set(px + 1, py - 1, scaleColor(jacket, 0.78));
    img.disc(px, py - 3.6, 1.5, 0xd8bca6);
    img.rect(px - 1, py - 5, 3, 1, pr() < 0.3 ? 0x5c402c : 0x221c20);
  }
}

/** Traditional Japanese wagasa oiled-paper umbrella in pixel coords (radius ~12px). */
export function buildUmbrellaHD({ lx, ly, c1, c2, C, getImg }) {
  const cx = Math.round(lx * S);
  const cy = Math.round(ly * S);
  const r = 12.5;
  return {
    y: cy + 12,
    shadow: () => {
      const img = getImg();
      for (let j = -13; j <= 13; j++)
        for (let i = -13; i <= 13; i++) if (i * i + j * j <= r * r) img.tint(cx + i + 6, cy + j + 8, 0.52);
    },
    draw: () => {
      const img = getImg();
      const litCol = scaleColor(c1, 1.16);
      const darkCol = scaleColor(c1, 0.84);
      for (let j = -13; j <= 13; j++)
        for (let i = -13; i <= 13; i++) {
          const d2 = i * i + j * j;
          if (d2 > r * r) continue;
          const d = Math.sqrt(d2);
          const ang = Math.atan2(j, i);
          // 16 fine bamboo ribs + white inner snake-eye ring (janome-gasa!)
          const rib = Math.abs(Math.sin(ang * 8)) < 0.13;
          const janome = d > 4.2 && d < 6.4;
          let c = i + j < -3 ? litCol : i + j > 5 ? darkCol : c1;
          if (janome) c = mix(0xf6f0e4, c, 0.25);
          if (rib) c = janome ? scaleColor(c, 0.82) : c2;
          if (d > r - 1.1) c = scaleColor(c2, 0.78);
          img.set(cx + i, cy + j, c);
        }
      img.disc(cx, cy, 1.8, C.gold);
      img.set(cx - 1, cy - 1, C.goldHi);
    },
  };
}

/** Detailed 540px Jinrikisha (rickshaw) drawn into `img` inside a 15x24px box at (px, py). */
export function drawRickshawPx(img, px, py, up = false, step = 0) {
  // Cab sits at rear, runner between wooden shafts at front
  const cabY = up ? py + 11 : py + 1;
  const runY = up ? py + 2 : py + 17;
  // Two large spoked wheels flanking the cab
  for (const wx of [px + 1, px + 13]) {
    for (let wy = 0; wy < 12; wy++) {
      const rim = wy === 0 || wy === 11;
      img.set(wx, cabY + wy, rim ? 0x3a322e : 0x1c1618);
      if (wy === 5 || wy === 6) img.set(wx + (wx === px + 1 ? 1 : -1), cabY + wy, 0x8a7652); // axle hub
    }
  }
  // Black lacquered cab body with brass trim & crimson velvet seat
  img.rect(px + 3, cabY, 9, 11, 0x1e161a);
  img.rect(px + 4, cabY + 1, 7, 9, 0x9c2222); // crimson velvet seat & backrest
  // Folded dark hood at rear of cab
  const hoodY = up ? cabY + 8 : cabY;
  img.rect(px + 2, hoodY, 11, 3, 0x2c2428);
  img.rect(px + 3, hoodY + 1, 9, 1, 0x483c42);
  // Passenger seated inside cab (kimono shoulders + dark hair)
  const passY = up ? cabY + 3 : cabY + 4;
  img.rect(px + 5, passY, 5, 3, 0xe882a6);
  img.disc(px + 7, passY + (up ? 0 : 1), 1.6, 0x181216);
  // Wooden pulling shafts (kajibo) extending to runner's hands
  const shaftY0 = up ? py + 3 : cabY + 11;
  const shaftH = 8;
  for (let sy = 0; sy < shaftH; sy++) {
    img.set(px + 4, shaftY0 + sy, 0xb89662);
    img.set(px + 10, shaftY0 + sy, 0x9a7a4c);
  }
  // Runner (shafu) in dark indigo happi coat & round bamboo sugegasa hat!
  const legOff = step ? 1 : -1;
  img.set(px + 6, runY + 4 + (legOff > 0 ? 1 : 0), 0xf0ece2); // white tabi stride
  img.set(px + 8, runY + 4 + (legOff < 0 ? 1 : 0), 0xf0ece2);
  img.rect(px + 5, runY + 1, 5, 3, 0x222c44); // happi coat
  img.set(px + 7, runY + 2, 0xe8e2d4); // white crest on back of happi
  // Conical sugegasa bamboo hat
  img.disc(px + 7, runY, 2.8, 0xdcc696);
  img.disc(px + 6.5, runY - 0.5, 1.6, 0xf0deb2);
  img.set(px + 7, runY, 0x9a8054);
}

