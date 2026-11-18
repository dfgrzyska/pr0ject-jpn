// The lake (u 2100-3900, docs/plan-kawaguchiko.md phase 3): the golden hour on the water. The Ohashi bridge on its
// piers over the narrows, their shadows on the water, cars crossing; Unoshima, wooded, its shrine's torii standing in
// the shallows; anglers drifting, swan boats paddling about by the marina, a motorboat cutting across, the
// sightseeing boat out round the island and back; grebes, kites wheeling over, rings where fish rise; the south
// shore's beach with boats drawn up, kayaks, people at the water. (Fuji's reflection lies under it all, in the far
// layer: phase 6.)
import { shade } from '../tokyo/kit.mjs';
import { makeUmi } from '../tokyo/umi.mjs';
import { makeParts, VERMILION } from './parts.mjs';
import { swan, rowboat, anglerBoat, motorboat, sightseer, rowboatFrame } from './boats.mjs';

export function lake(ctx) {
  const { kit, props, S, L, ROADS } = ctx;
  const { tree, crowd, mark, rand, P, R, FX, FY, hi } = kit;
  const { torii } = makeParts(ctx);
  const { wake, buoy } = makeUmi(ctx);

  // ---------------------------------------------------------------- the bridge: its girder's face, piers, shadow on the water, traffic
  {
    const bridge = ROADS.find((r) => r.id === 'ohashi');
    const [u, w] = [bridge.pts[0][1], bridge.w];
    const [X0, X1] = [FX(76), FX(180)];
    const Yb = FY(u - w / 2); // (the deck's south edge)
    mark(76, u - w / 2, () => {
      R(X0, Yb, X1 - X0, 3, 0x6a6e74); // the girder's face under the deck
      R(X0, Yb + 2, X1 - X0, 1, 0x4a4e54);
      for (let X = X0 + 20; X < X1; X += 54) {
        R(X, Yb + 3, 8, 5, 0x9a9890); // a pier, its foot in the water
        R(X, Yb + 3, 2, 5, 0xb8b6ae);
        R(X - 1, Yb + 7, 10, 1, 0xc8d8e0);
      }
    });
    kit.after(({ d, FW }) => {
      // the bridge's shadow lying on the water to the lower right (the strip is clear there: water from the far layer)
      for (let Y = Yb + 3; Y < Yb + 3 + 16; Y++)
        for (let X = X0 + 6; X < X1; X++) {
          const o = (Y * FW + X) * 4;
          if (d[o + 3]) continue;
          d[o] = 10;
          d[o + 1] = 20;
          d[o + 2] = 34;
          d[o + 3] = 70;
        }
    });
    const way = [[-14, 2004], [64, 2004], [72, 2030], [72, 2282], [194, 2282]];
    kit.trafficOn(kit.offset(way, 2), { sp: 18, gap: 120, s0: 0.4, u: 2280 });
    kit.trafficOn(kit.offset([...way].reverse(), 2), { sp: 18, gap: 140, s0: 0.9, u: 2280 });
  }

  // ---------------------------------------------------------------- Unoshima: its trees, rocks round it, the shrine and its torii in the water
  {
    const [cx, cu] = [128, 3080];
    for (let k = 0; k < 26; k++) {
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * 9;
      tree(rand() < 0.5 ? 'pine' : 'broadleaf', cx + Math.cos(a) * r * 1.1, cu + 2 + Math.sin(a) * r * 0.8, 2.2 + rand() * 1.2);
    }
    mark(cx, cu - 10, (X, Y) => {
      for (let k = 0; k < 18; k++) {
        const a = (k / 18) * Math.PI * 2;
        R(X + Math.round(Math.cos(a) * 44), Y + 30 + Math.round(Math.sin(a) * 30), 3, 2, k % 3 ? 0x6a6458 : 0x8a8478);
      }
    }, cu - 12);
    torii(124.5, 131.5, 3064.5, VERMILION, 3); // (on the south shore, its feet in the shallows)
  }

  // ---------------------------------------------------------------- the boats
  const frame = (painter, len, wid, ...args) => kit.frame(len / S, wid / S, 2800, (put) => painter((a, b, c) => put(a, b, c), ...args));
  const swans = [0xe86a8a, 0x6aa8e0, 0xf0c040].map((c) => frame(swan, 25, 12, c)); // (their seats pink, sky blue and yellow)
  const rowF = frame(rowboat, 14, 6);
  const anglers = [0x2a6aa0, 0xc04a30, 0x3a7a4a].map((c) => frame(anglerBoat, 16, 7, c));
  const motorF = frame(motorboat, 20, 8);
  const sightF = frame(sightseer, 60, 18);
  // anglers drifting in the bays, never in the miniboss's water
  props.wander(36, 2560, 22, 70, anglers, { n: 3, sp: 0.7, turn: 'rot', fps: 1, idle: 0.6, d: -0.4 });
  props.wander(150, 2980, 18, 60, [anglers[1], anglers[2]], { n: 2, sp: 0.7, turn: 'rot', fps: 1, idle: 0.6, d: -0.4 });
  props.wander(40, 3700, 26, 60, [anglers[0], rowF], { n: 3, sp: 0.8, turn: 'rot', fps: 1, idle: 0.5, d: -0.4 });
  props.wander(60, 3080, 30, 90, anglers, { n: 3, sp: 0.6, turn: 'rot', fps: 1, idle: 0.6, d: -0.4 });
  props.wander(140, 3620, 24, 70, [anglers[2], rowF, anglers[0]], { n: 3, sp: 0.7, turn: 'rot', fps: 1, idle: 0.6, d: -0.4 });
  props.wander(110, 2560, 30, 80, [rowF, anglers[1]], { n: 3, sp: 0.8, turn: 'rot', fps: 1, idle: 0.5, d: -0.4 });
  // swan boats and rowing boats out from the marina
  props.wander(126, 2232, 28, 32, [...swans, swans[0], rowF], { n: 7, sp: 1.6, turn: 'rot', fps: 1, idle: 0.4, d: -0.4 });
  props.wander(40, 2470, 22, 26, swans, { n: 3, sp: 1.4, turn: 'rot', fps: 1, idle: 0.5, d: -0.4 }); // (a few further out along the shore)
  // a motorboat across the lake, the sightseeing boat out round the island and back to its landing
  props.path([[-30, 2620], [50, 2660], [130, 2740], [210, 2790]], [motorF], { sp: 16, n: 1, mode: 'wrap', turn: 'rot', s0: 0.2, d: -0.4, wake: { f: wake, every: 6, life: 2.4 } });
  props.path([[210, 3560], [120, 3600], [40, 3680], [-30, 3700]], [motorF], { sp: 14, n: 1, mode: 'wrap', turn: 'rot', s0: 0.7, d: -0.4, wake: { f: wake, every: 6, life: 2.4 } });
  props.path([[143, 2150], [150, 2400], [120, 2800], [154, 3040], [150, 3150], [110, 3150], [96, 2900], [130, 2500], [143, 2150]], [sightF], { sp: 6, n: 1, mode: 'pp', hold: 8, turn: 'rot', s0: 0.1, d: -0.4, wake: { f: wake, every: 9, life: 3 } });

  // ---------------------------------------------------------------- what lives on the water and over it
  {
    // grebes: little dark birds that dive and come up somewhere else
    const grebe = [0, 1].map((k) => kit.frame(1.67, 1.34, 2800, (put) => {
      for (let i = 0; i < 4; i++) put(i, 2, 0x3a3228);
      put(3, 1, 0x2a2420);
      put(4, 1 + k, 0xe0a030);
      put(1, 1, 0x5a4a38);
    }));
    for (const [x, u] of [[20, 2900], [160, 3600], [70, 2460]]) props.wander(x, u, 10, 14, grebe, { n: 3, sp: 1.2, turn: 'flip', fps: 1, idle: 0.6, d: -0.3 });
    // kites wheeling high over the lake
    const kite = [0, 1].map((k) => kit.frame(4, 2, 2800, (put) => {
      for (let i = 0; i < 12; i++) put(i, 3 + (Math.abs(i - 5.5) > 3 && k ? -1 : 0), i > 4 && i < 7 ? 0x5a4030 : 0x7a5a40);
      put(5, 2, 0x5a4030);
      put(6, 4, 0x5a4030);
      put(5, 5, 0x6a4a34);
    }, true));
    props.wander(90, 2900, 70, 300, kite, { n: 3, sp: 8, turn: 'rot', fps: 1, idle: 0, d: 0.4 });
    // rings where a fish rises
    const ring = [2, 4, 6].map((r) => kit.frame(5, 3.4, 2800, (put) => {
      for (let k = 0; k < 24; k++) {
        const a = (k / 24) * Math.PI * 2;
        put(7 + Math.round(Math.cos(a) * r), 5 + Math.round(Math.sin(a) * r * 0.66), 0xd8e8f0, 0.6 - r * 0.07);
      }
    }, true));
    props.spot([[10, 2700, 60, 200], [110, 3000, 60, 200], [20, 3600, 140, 200], [100, 2500, 70, 150]], ring, { rate: 0.5, fps: 3, d: -0.3 });
  }

  // ---------------------------------------------------------------- reeds in the shallows along the shores
  {
    const lakeShape = ctx.ROADS && ctx.wet; // (the water mask: 1 where the lake is)
    const FW = ctx.W * S;
    const wetAt = (x, u) => ctx.wet[Math.round((L - u) * S) * FW + Math.round(x * S)] === 1;
    const beds = [[4, 2430, 26, 90], [150, 2150, 28, 40], [0, 3760, 34, 90], [148, 3790, 32, 66], [80, 2370, 6, 20]];
    for (const [x0, u0, w, h] of beds)
      for (let k = 0; k < (w * h) / 6; k++) {
        const [x, u] = [x0 + rand() * w, u0 + rand() * h];
        if (!wetAt(x, u)) continue;
        let near = false;
        for (let d = 2; d <= 14 && !near; d += 2) near = !wetAt(x - d, u) || !wetAt(x + d, u) || !wetAt(x, u - d) || !wetAt(x, u + d);
        if (!near) continue;
        mark(x, u, (X, Y) => {
          for (let q = 0; q < 4; q++) {
            const dx = Math.round((q - 1.5) * 1.2);
            for (let j = 0; j < 4 + (q % 2); j++) P(X + dx + (j > 2 ? 1 : 0), Y - j, j > 3 ? 0x8a7a40 : q % 2 ? 0x5a7a34 : 0x6a8a3c);
          }
        });
      }
    void lakeShape;
  }
  // the swimming area's line of buoys off the beach
  for (let x = 24; x <= 156; x += 22) buoy(x, 3832, x % 44 ? 0xe8e8e0 : 0xe05a30);

  // ---------------------------------------------------------------- the south shore's beach
  {
    for (let k = 0; k < 7; k++) {
      const x = 8 + k * 24 + rand() * 6;
      mark(x, 3884, (X, Y) => rowboatFrame((i, j, c) => P(X + i, Y - 14 + j, c)));
    }
    for (let k = 0; k < 6; k++) {
      const x = 14 + k * 27 + rand() * 4;
      const c = [0xe04a30, 0xe8c040, 0x2a8ac0, 0x3aa060][k % 4];
      mark(x, 3890, (X, Y) => {
        for (let i = 0; i < 14; i++) {
          const w = i < 2 || i > 11 ? 1 : 2;
          R(X + i, Y - w, 1, w * 2, i === 6 || i === 7 ? 0x2a2a30 : c); // a kayak drawn up the sand
        }
      });
    }
    for (const x of [30, 96, 150]) mark(x, 3892, (X, Y) => kit.parasol(X, Y - 3, [0x2a6ab0, 0xd04848, 0xe8c040][x % 3]));
    crowd(4, 3878, 170, 20, 30);
  }
  void shade;
  void hi;
  void L;
}
