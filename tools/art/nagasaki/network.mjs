// The road network, painted before the districts so their buildings keep clear of it: R1 (the coast road and the
// tramway north of the Ishibashi terminus), the east-west streets edge to edge with their junctions on R1, the road
// over the Urakami harbour bridge to Fuchi Shrine and the Inasa driveway to the summit car park.
// Bridges over the Nakashima and the harbour are drawn by the districts (river.mjs, urakami.mjs).
import { C, S } from './canvas.mjs';
import { W, R1, R1_HW, r1X, TRAM_U0, STREETS, MEGAMI_U, CHINA_X, EMBANK, B_X, FUCHI, DRIVE, DRIVE_HW, PARK } from './geo.mjs';

export function paintNetwork(k) {
  const { img, Y, hashPx } = k;
  // the east-west streets (Megami's deck is a bridge frame of its own)
  for (const s of STREETS) {
    if (s.u === MEGAMI_U) continue;
    const walk = s.kind === 'walk';
    k.road([[-14, s.u], [W + 14, s.u]], s.hw, walk ? { surface: C.stoneSet, side: 2, pave: C.paving } : { side: 2 });
  }
  // Shinchi's main street, stone setts from the Omotemon bridge's landing to the street north of the north gate
  k.road([[CHINA_X, EMBANK + 18], [CHINA_X, 3654]], 7, { surface: C.stoneSet, side: 0 });
  // B: from the 5112 street north over the harbour bridge (deck drawn in urakami.mjs) to the Fuchi roundabout. It meets each
  // street at the carriageway's edge: a T at the 5112, a crossroads at the 5458, the streets running on unbroken through them.
  const BU = [5112, 5458].map((u) => STREETS.find((st) => st.u === u));
  k.road([[B_X, BU[0].u + BU[0].hw], [B_X, BU[1].u - BU[1].hw]], 5, { side: 2, over: false, piece: true });
  k.road([[B_X, BU[1].u + BU[1].hw], [B_X, FUCHI.u - FUCHI.r + 2]], 5, { side: 2, over: false, piece: true });
  const mouth = (u0, u1) => img.fine(B_X - 5, Y(u1), 10, u1 - u0, (X, Yy) => k.asphaltPx(X, Yy));
  mouth(BU[0].u + BU[0].hw - 2, BU[0].u + BU[0].hw + 1);
  mouth(BU[1].u + BU[1].hw - 2, BU[1].u + BU[1].hw + 1);
  mouth(BU[1].u - BU[1].hw - 1, BU[1].u - BU[1].hw + 2);
  // the crossings: over B beside each junction, over the street either side of it
  k.zebraH(B_X - 4, B_X + 4, BU[0].u + BU[0].hw + 3);
  k.zebraH(B_X - 4, B_X + 4, BU[1].u - BU[1].hw - 6);
  k.zebraH(B_X - 4, B_X + 4, BU[1].u + BU[1].hw + 3);
  for (const st of BU) {
    k.zebraV(B_X - 10, st.u - st.hw + 1, st.u + st.hw - 1);
    k.zebraV(B_X + 7, st.u - st.hw + 1, st.u + st.hw - 1);
  }
  // the driveway with its verge and white edge lines, the summit car park with its bays, lamps and parked cars
  k.road(DRIVE, DRIVE_HW, { side: 1, pave: C.granite, lanes: true });
  img.fine(PARK.x0, Y(PARK.u1), PARK.x1 - PARK.x0, PARK.u1 - PARK.u0, (X, Yy, x, y) => {
    const u = 7168 - y;
    const e = Math.min(x - PARK.x0, PARK.x1 - x, u - PARK.u0, PARK.u1 - u);
    if (e < 0.67) return (X >> 2) % 2 ? C.granite[3] : C.granite[2];
    const inRow = (PARK.u1 - u) % 20;
    if ((inRow < 7 || inRow > 13) && X % 18 < 2) return 0xe4e4dc;
    return k.asphaltPx(X, Yy);
  });
  k.reserve(PARK.x0, Y(PARK.u1), PARK.x1 - PARK.x0, PARK.u1 - PARK.u0);
  // the Fuchi roundabout: a ring road round a planted island with a stone lantern
  const fy = Y(FUCHI.u);
  img.fine(FUCHI.x - FUCHI.r - 3, fy - FUCHI.r - 3, FUCHI.r * 2 + 7, FUCHI.r * 2 + 7, (X, Yy, x, y) => {
    const d = Math.hypot(x - FUCHI.x, y - fy);
    if (d > FUCHI.r + 2.5) return null;
    if (d > FUCHI.r + 1.5) return k.pavePx(X, Yy);
    if (d > FUCHI.r + 0.5) return 0x8a8a8e;
    if (d > 5.34) return Math.abs(d - (FUCHI.r + 5) / 2) < 0.17 && Math.floor(Math.atan2(y - fy, x - FUCHI.x) * 7) % 2 ? 0xd8d4c6 : k.asphaltPx(X, Yy);
    if (d > 4.67) return (X + Yy) % 3 ? C.granite[3] : C.granite[1];
    const g = hashPx(X >> 1, Yy >> 1, 5601);
    return g < 0.15 ? 0xe86a9a : g < 0.25 ? 0xf8f0e0 : k.lawnPx(X, Yy, 0.3 + g * 0.5, C.lawn);
  });
  k.reserve(FUCHI.x - FUCHI.r - 3, fy - FUCHI.r - 3, FUCHI.r * 2 + 7, FUCHI.r * 2 + 7);

  // R1 in short pieces (a long curved road is painted segment by segment), tracks from the terminus on
  for (let i = 0; i < R1.length - 1; i += 12) {
    const piece = R1.slice(i, i + 14);
    const tram = piece[0][1] >= TRAM_U0;
    k.road(piece, R1_HW, { side: 2, tram, lanes: !tram, piece: true });
  }
  // the streets run on through R1's pavements at the junctions
  for (const st of STREETS) {
    const cx = Math.round(r1X(st.u));
    if (cx > W + 4) continue;
    img.fine(cx - R1_HW - 3, Y(st.u + st.hw - 1), 3, st.hw * 2 - 2, (X, Yy) => (k.wetPx(X, Yy) ? null : st.kind === 'walk' ? k.settPx(X, Yy, 37, C.stoneSet) : k.asphaltPx(X, Yy)));
    img.fine(cx + R1_HW + 1, Y(st.u + st.hw - 1), 3, st.hw * 2 - 2, (X, Yy) => (k.wetPx(X, Yy) ? null : st.kind === 'walk' ? k.settPx(X, Yy, 37, C.stoneSet) : k.asphaltPx(X, Yy)));
  }
  // the tracks end at Ishibashi with buffer stops
  for (const dx of [-3, 3]) {
    const X = Math.round((r1X(TRAM_U0) + dx) * S);
    for (let i = -5; i <= 5; i++) for (let j = 0; j < 4; j++) img.px(X + i, Y(TRAM_U0 - 1) * S + j, (i + 8) % 4 < 2 ? 0xd83224 : 0xf0e8d8);
  }
  // zebra crossings either side of every junction on R1
  for (const s of STREETS) {
    const cx = Math.round(r1X(s.u));
    if (cx > W + 4) continue;
    for (const side of [-1, 1]) {
      k.zebraH(cx - R1_HW + 1, cx + R1_HW - 1, s.u + side * (s.hw + 3) - (side < 0 ? 2 : 0));
      const zx = side < 0 ? cx - R1_HW - 6 : cx + R1_HW + 3;
      if (zx > 0 && zx < W - 3) k.zebraV(zx, s.u - s.hw + 1, s.u + s.hw - 1);
    }
  }
}
