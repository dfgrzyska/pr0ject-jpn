// The road network, painted before the districts so their buildings keep clear of it: R1 (the coast road and the
// tramway north of the Ishibashi terminus), the east-west streets edge to edge with their junctions on R1, the
// road over the Urakami harbour bridge to Fuchi Shrine and the Inasa driveway to the summit car park.
// Bridges over the Nakashima and the harbour are drawn by the districts (river.mjs, urakami.mjs).
import { C } from './canvas.mjs';
import { W, R1, R1_HW, r1X, TRAM_U0, STREETS, MEGAMI_U, CHINA_X, EMBANK, B_X, FUCHI, DRIVE, DRIVE_HW, PARK } from './geo.mjs';

export function paintNetwork(k) {
  const { img, Y } = k;
  // the east-west streets (Megami's deck is a bridge frame of its own)
  for (const s of STREETS) {
    if (s.u === MEGAMI_U) continue;
    const walk = s.kind === 'walk';
    k.road([[-14, s.u], [W + 14, s.u]], s.hw, walk ? { surface: C.stoneSet, side: 2, pave: C.paving } : { side: 2 });
  }
  // Shinchi's main street, stone setts from the Omotemon bridge's landing to the street north of the north gate
  k.road([[CHINA_X, EMBANK + 18], [CHINA_X, 3654]], 7, { surface: C.stoneSet, side: 0 });
  // B: from the 5112 street north over the harbour bridge (deck drawn in urakami.mjs) to the Fuchi roundabout
  k.road([[B_X, 5112], [B_X, FUCHI.u - FUCHI.r + 2]], 5, { side: 2, over: false });
  // the driveway, the summit car park
  k.road(DRIVE, DRIVE_HW, { side: 1, pave: C.granite, lanes: true });
  for (let u = PARK.u0; u < PARK.u1; u++)
    for (let x = PARK.x0; x < PARK.x1; x++) {
      const edge = x === PARK.x0 || x === PARK.x1 - 1 || u === PARK.u0 || u === PARK.u1 - 1;
      img.set(x, Y(u), edge ? C.granite[3] : (x - PARK.x0) % 6 === 0 && (u - PARK.u0) % 20 > 3 ? 0xd8d6cc : C.asphalt[1 + ((x + u) % 2)]);
    }
  k.reserve(PARK.x0, Y(PARK.u1), PARK.x1 - PARK.x0, PARK.u1 - PARK.u0);
  // the Fuchi roundabout: a ring road round a planted island with a stone lantern
  const fy = Y(FUCHI.u);
  for (let y = fy - FUCHI.r - 3; y <= fy + FUCHI.r + 3; y++)
    for (let x = FUCHI.x - FUCHI.r - 3; x <= FUCHI.x + FUCHI.r + 3; x++) {
      const d = Math.hypot(x + 0.5 - FUCHI.x, y + 0.5 - fy);
      if (d > FUCHI.r + 2.5) continue;
      img.set(x, y, d > FUCHI.r + 1.5 ? C.walk[1] : d > FUCHI.r + 0.5 ? 0x8a8a8e : d > 5 ? C.asphalt[(x + y) % 3] : d > 4 ? C.granite[3] : C.grass[1 + ((x * 3 + y) % 3)]);
    }
  k.reserve(FUCHI.x - FUCHI.r - 3, fy - FUCHI.r - 3, FUCHI.r * 2 + 7, FUCHI.r * 2 + 7);

  // R1 in short pieces (a long curved road is painted segment by segment), tracks from the terminus on
  for (let i = 0; i < R1.length - 1; i += 12) {
    const piece = R1.slice(i, i + 14);
    const tram = piece[0][1] >= TRAM_U0;
    k.road(piece, R1_HW, { side: 2, tram, lanes: !tram });
  }
  // the streets run on through R1's pavements at the junctions
  for (const st of STREETS) {
    const cx = Math.round(r1X(st.u));
    if (cx > W + 4) continue;
    for (let u = st.u - st.hw + 1; u <= st.u + st.hw - 1; u++)
      for (const x of [cx - R1_HW - 3, cx - R1_HW - 2, cx - R1_HW - 1, cx + R1_HW + 1, cx + R1_HW + 2, cx + R1_HW + 3]) {
        const y = Y(u);
        if (!k.wet(x, y)) img.set(x, y, st.kind === 'walk' ? C.stoneSet[2] : C.asphalt[(x + u) % 3]);
      }
  }
  // the tracks end at Ishibashi with buffer stops
  for (const dx of [-3, 3]) {
    const x = Math.round(r1X(TRAM_U0) + dx - 0.5);
    for (let i = -1; i <= 1; i++) img.set(x + i, Y(TRAM_U0 - 1), (x + i) % 2 ? 0xd83224 : 0xf0e8d8);
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
