// Every city's ambusher (src/game/enemies/ambush.js), drawn at 540 px for the shared atlas: 60 x 60 fine pixels
// (20 x 20 in the game), seen from above the way the cities are, facing down the screen, the hiding place under it
// a little low in the frame. Five frames each: 0 the hiding place at rest; 1 stirring (eyes in the dark, a shake);
// 2 half out; 3 out; 4 out and shooting.
//   Kyoto: a white Inari fox out of an azalea bush        Okinawa: a hermit crab out of the sand
//   Sapporo: a mountain hare out of a snowdrift            Osaka: a little octopus out of a manhole
//   Beppu: a mud bōzu out of a boiling mud pool            Hiroshima: an anago eel out of its hole in the flats
//   Nagasaki: a hook-tailed cat out of a crate on the quay Tokyo: a rat out of a storm drain
// (Kagoshima has its kappa already.) The manhole's lid is a pattern of our own, no city's emblem.
import { HiSprite, tones, speckle, mottle, fur, mix2 } from '../lib/hisprite.mjs';

const TAU = Math.PI * 2;
const INK = 0x14101c;
const RAMPS = {
  lf: tones([0x1a3a1c, 0x356a2c, 0x6aa04a]), // azalea leaves
  wf: tones([0xa8a4b0, 0xeae8ee, 0xffffff]), // white fur
  rd: tones([0x7a0e14, 0xd02a30, 0xff7a6a]), // vermilion
  ff: [0x10306a, 0x2a5ad0, 0x7ab8ff, 0xc8e8ff, 0xf0fbff], // fox fire, glowing
  sd: tones([0xa88a5a, 0xe8d4a4, 0xfff4d8]), // coral sand
  sh: tones([0x9a6a5a, 0xe0b8a0, 0xfff0e4]), // a turban shell, cream and pink
  cl: tones([0x8a2a10, 0xe0602a, 0xffb07a]), // a hermit crab's claws
  sn: tones([0x7a8eb0, 0xdce6f4, 0xffffff]), // snow, blue in its shadows
  ir: tones([0x18161c, 0x3a3842, 0x6a6672]), // cast iron
  ho: tones([0x050408, 0x0e0c12, 0x1e1a24]), // the dark in a hole
  oc: tones([0x7a1a20, 0xd84a4a, 0xff9a8a]), // octopus red
  hb: tones([0xc8c0c8, 0xf6f2f6, 0xffffff]), // a headband's white cotton
  md: tones([0x3a3632, 0x6e6860, 0xa8a094]), // grey mud
  mh: [0x6a1808, 0xc84a10, 0xff9a30, 0xffd080, 0xfff4d0], // the heat in the mud, glowing
  ws: tones([0x4a4034, 0x7a6a54, 0xb0a084]), // wet sand of the flats
  wa: tones([0x2a4a5a, 0x4a7a8a, 0x9ac0c8]), // a skin of water on it
  ag: tones([0x2e2618, 0x5e4e34, 0x9a8660]), // anago brown
  ab: tones([0xa89a80, 0xe0d4bc, 0xfff8e8]), // its pale belly
  cr: tones([0x5a3a1c, 0x9a6a3a, 0xd8a868]), // crate boards
  st: tones([0x8a6a30, 0xd8b060, 0xf4dc98]), // straw
  ca: tones([0x8a4a14, 0xe08a3a, 0xffc890]), // a calico's orange
  bk: tones([0x0e0c12, 0x26222c, 0x4a4652]), // a calico's black
  co: tones([0x5a5c60, 0x9a9ca0, 0xd0d2d4]), // concrete kerb
  rt: tones([0x2e2a2a, 0x5e5650, 0x948a80]), // a rat's grey-brown
  pk: tones([0x9a4a5a, 0xe08a9a, 0xffc8d0]), // pink: ears, paws, tail, noses
  gm: [0x6a0820, 0xc0204a, 0xff6a8a, 0xffc0d0, 0xffffff], // a glow of red (a mouth about to shoot)
  ea: tones([0x2a1c14, 0x4e3626, 0x7e5e44]), // fresh dark earth
  ml: tones([0x16141a, 0x2e2a34, 0x5a5466]), // a mole's velvet
  lv: tones([0x5a1a0c, 0xb83a1c, 0xe8803a]), // a fallen maple leaf
  tp: tones([0x4a2412, 0x8a4e2c, 0xc8865a]), // an octopus pot's fired clay
  pw: tones([0x14302a, 0x2a5a4c, 0x5a8a78]), // a pond's green water
  sf: tones([0x2a2e1e, 0x5a6244, 0x98a07a]), // a soft-shell turtle's leathery olive
  sb: tones([0x8a8466, 0xd4ceb0, 0xf6f2e0]), // its pale throat and belly
};
const sprite = () => new HiSprite(60, 60, RAMPS);
const shadow = (s, cx, cy, rx, ry, a = 0.32) => {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
    for (let x = Math.floor(cx - rx); x <= cx + rx; x++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1) s.px(x, y, 0x0a0812, a);
};
/** A shot gathering in front of a mouth: a glowing ball with a few sparks round it. */
const charge = (s, x, y, r, mat, spark) => {
  s.ellipse(x, y, r, r, mat, { flat: 0.75, glow: true });
  s.dot(x - r * 0.3, y - r * 0.3, r * 0.35, 0xffffff);
  for (let i = 0; i < 6; i++) s.dot(x + Math.cos(i * 1.05) * (r + 3), y + Math.sin(i * 1.05) * (r + 2.4), 0.8, spark);
};

// ---------------------------------------------------------------- Kyoto: a white fox of Inari out of an azalea bush
function kyoto(f) {
  const s = sprite();
  const shake = f === 1 ? 1 : 0;
  // the bush: clumps of small glossy leaves, pink azalea flowers here and there; its back half first
  const clumps = [[-12, -4, 8, 6], [0, -8, 9, 6], [12, -4, 8, 6], [-15, 4, 7, 6], [15, 4, 7, 6], [-7, 8, 9, 6], [7, 8, 9, 6], [0, 4, 9, 6]];
  const bush = (front) => clumps.forEach(([dx, dy, rx, ry], i) => {
    if ((dy > 2) !== front) return;
    const x = 30 + dx + (shake && i % 2 ? 1 : 0) - (shake && !(i % 2) ? 1 : 0);
    s.ellipse(x, 40 + dy, rx, ry, 'lf', { bias: 0.02, pat: mix2(speckle({ amt: 0.22, seed: i + 3 }), mottle({ amt: 0.12, scale: 3, seed: i })) });
    for (let k = 0; k < 5; k++) s.line(x - rx * 0.6 + k * rx * 0.3, 40 + dy - ry * 0.4, x - rx * 0.5 + k * rx * 0.3 + 1, 40 + dy - ry * 0.4 - 1.4, 0x8ac060, 1, 0.8); // leaf glints
    if (i % 3 === 0) for (let k = 0; k < 3; k++) s.dot(x - 3 + k * 3, 40 + dy + (k % 2) * 2 - 1, 1.1, k % 2 ? 0xf06aa0 : 0xff9ac8); // flowers
  });
  shadow(s, 33, 46, 19, 8);
  bush(false);
  const ears = (y) => {
    for (const sx of [-1, 1]) {
      s.poly([[30 + sx * 3, y + 7], [30 + sx * 9, y + 6], [30 + sx * 7.5, y - 4]], 'wf', { flat: 0.62 });
      s.poly([[30 + sx * 4.6, y + 5.6], [30 + sx * 7.8, y + 5.2], [30 + sx * 7, y - 0.6]], 'rd', { flat: 0.55 });
    }
  };
  const face = (y, open) => {
    s.ellipse(30, y, 8.5, 7, 'wf', { bias: 0.05, pat: fur(Math.PI / 2, { amt: 0.12, len: 4, seed: 4 }) });
    s.poly([[25, y + 2], [35, y + 2], [32, y + 9], [28, y + 9]], 'wf', { flat: 0.6 }); // the muzzle, toward us
    for (const sx of [-1, 1]) {
      s.line(30 + sx * 2.4, y - 0.6, 30 + sx * 6, y - 2, INK, 1); // eyes narrowed, a fox's
      s.line(30 + sx * 2.2, y - 2.6, 30 + sx * 6.6, y - 4.6, 0xd02a30, 1); // the red marks over them (kumadori)
      s.line(30 + sx * 3, y - 3.6, 30 + sx * 5.6, y - 5.4, 0xff6a5a, 1, 0.8);
    }
    s.dot(30, y + 8.6, 1.3, INK); // the nose
    if (open) s.ellipse(30, y + 10.6, 2.4, 1.6, 'gm', { flat: 0.6, glow: true });
  };
  if (f === 1) {
    ears(26); // only the ears above the leaves, and eyes glinting between them
    for (const sx of [-1, 1]) s.dot(30 + sx * 4, 36, 0.9, 0xffe080);
  } else if (f === 2) {
    ears(18);
    face(28, false);
  } else if (f >= 3) {
    // the tail, a flame of white behind it, its tip gone to fox fire when it shoots
    for (let k = 0; k < 7; k++) s.ellipse(41 + Math.sin(k * 0.7) * 3, 30 - k * 3, 5 - k * 0.4, 4.4 - k * 0.3, 'wf', { bias: 0.06, pat: fur(-Math.PI / 2, { amt: 0.14, len: 4, seed: k }) });
    s.ellipse(43, 10, 3, 3, f === 4 ? 'ff' : 'wf', { flat: f === 4 ? 0.8 : 0.7, glow: f === 4 });
    s.ellipse(30, 32, 9, 8, 'wf', { bias: 0.04, pat: fur(Math.PI / 2, { amt: 0.14, len: 5, seed: 2 }) }); // sitting up
    s.poly([[22, 30], [38, 30], [34, 38], [26, 38]], 'rd', { flat: 0.6, pat: speckle({ amt: 0.08 }) }); // its red bib
    for (let k = 0; k < 4; k++) s.line(24 + k * 4, 31, 27 + k * 2.6, 37, 0xff8a7a, 1, 0.5);
    ears(10);
    face(20, f === 4);
    if (f === 4) charge(s, 30, 36, 3.6, 'ff', 0xc8ecff); // a ball of fox fire in front of it
  }
  bush(true);
  return s;
}

// ---------------------------------------------------------------- Okinawa: a hermit crab out of the sand
function okinawa(f) {
  const s = sprite();
  const out = [0, 0, 6, 12, 12][f];
  // the sand heaped up over it, ripples round it, a scatter of coral bits
  s.ellipse(30, 42, 18, 10, 'sd', { bias: 0.08, pat: speckle({ amt: 0.25, seed: 4 }) });
  for (let k = 0; k < 3; k++) s.paint([10, 30, 50, 54], (x, y) => Math.abs(Math.hypot((x - 30) / (19 - k * 4), (y - 43) / (10.5 - k * 2.2)) - 1) < 0.06, 'sd', () => 0.85);
  for (const [x, y, c] of [[14, 46, 0xff9a8a], [46, 38, 0xfff4e8], [40, 50, 0xf0c0b0]]) s.dot(x, y, 1, c);
  if (f >= 2) s.ellipse(30, 43, 9, 5, 'ho', { flat: 0.4 }); // the pit it comes out of
  // the shell: a turban, its whorl going round to the tip
  const sy = 34 - out;
  const sr = f === 0 ? 0.55 : f === 1 ? 0.7 : 1;
  s.ellipse(30, sy, 11 * sr, 9.5 * sr, 'sh', { bias: 0.06, pat: mix2(speckle({ amt: 0.12, seed: 9 }), mottle({ amt: 0.1, scale: 4 })) });
  for (let t = 0; t < 3.2 * TAU; t += 0.05) {
    const r = (10 - t * 0.48) * sr;
    if (r < 0.6) break;
    s.px(30 + Math.cos(t) * r, sy + Math.sin(t) * r * 0.85, 0x8a5a4a, 0.85);
  }
  for (let k = 0; k < 7; k++) s.dot(30 + Math.cos(k * 0.9) * 6 * sr, sy + Math.sin(k * 0.9) * 5 * sr, 0.7, 0xb0705a); // brown flecks
  if (f === 0 || f === 1) {
    // sand over the shell's lower half
    s.ellipse(30, sy + 5, 13, 5, 'sd', { bias: 0.1, pat: speckle({ amt: 0.3, seed: 2 }) });
    if (f === 1) {
      for (const sx of [-1, 1]) { s.line(30 + sx * 2, 40, 30 + sx * 3.4, 36, 0xc04a20, 1); s.dot(30 + sx * 3.4, 35.6, 1, INK); } // eyes up on their stalks
      for (let k = 0; k < 6; k++) s.dot(20 + k * 4, 38 + (k % 2) * 3, 0.8, 0xfff4d8); // sand jumping
    }
    return s;
  }
  // out: legs, the claws (the big one on its left), the eyes on their stalks
  for (const sx of [-1, 1]) for (let k = 0; k < 2; k++) s.tube(30 + sx * 6, sy + 8, 30 + sx * (14 + k * 3), sy + 14 + k * 3, 1.4, 'cl', { rb: 1 });
  const up = f === 4 ? -6 : 0;
  s.ellipse(22, sy + 12 + up, 5.4, 4.2, 'cl', { bias: 0.06 }); // the big claw
  s.ellipse(38, sy + 12 + up, 3.6, 3, 'cl', { bias: 0.06 });
  if (f === 4) for (const [x, w] of [[22, 2], [38, 1.4]]) s.line(x - w, sy + 7, x + w, sy + 7, INK, 1); // claws open, raised
  for (const sx of [-1, 1]) {
    s.line(30 + sx * 2, sy + 10, 30 + sx * 3.6, sy + 5, 0xc04a20, 1);
    s.dot(30 + sx * 3.6, sy + 4.6, 1.2, INK);
    s.px(30 + sx * 3.6 - 0.5, sy + 4, 0xffffff);
  }
  if (f === 4) charge(s, 30, sy + 17, 3.2, 'ff', 0xe8f8ff); // a froth of bubbles shot at the player
  return s;
}

// ---------------------------------------------------------------- Sapporo: a mountain hare out of a snowdrift
function sapporo(f) {
  const s = sprite();
  const drift = (front) => {
    if (!front) {
      shadow(s, 34, 46, 19, 7, 0.2);
      s.ellipse(30, 40, 18, 11, 'sn', { bias: 0.1, pat: speckle({ amt: 0.08, seed: 5 }) });
    } else {
      s.paint([10, 38, 50, 54], (x, y) => ((x - 30) / 19) ** 2 + ((y - 45) / 8) ** 2 < 1 && y > 40 + Math.sin(x * 0.5) * 0.8, 'sn', (x, y) => 0.75 - (y - 40) * 0.03 - Math.max(0, x - 36) * 0.02, { pat: speckle({ amt: 0.08, seed: 7 }) });
      for (let k = 0; k < 7; k++) s.px(15 + k * 5, 42 + (k % 3), 0xffffff); // sparkles in the snow
    }
  };
  drift(false);
  const ears = (y, tall) => {
    for (const sx of [-1, 1]) {
      s.tube(30 + sx * 2.6, y, 30 + sx * 5.4, y - tall, 2.4, 'sn', { rb: 1.8 });
      s.ellipse(30 + sx * 5.4, y - tall + 0.6, 1.8, 2.2, 'bk', { flat: 0.5 }); // the black tips
    }
  };
  const head = (y, open) => {
    s.ellipse(30, y, 7.4, 6.4, 'sn', { bias: 0.08, pat: fur(Math.PI / 2, { amt: 0.1, len: 3, seed: 3 }) });
    for (const sx of [-1, 1]) {
      s.ellipse(30 + sx * 3.8, y - 1, 1.6, 1.8, 'bk', { flat: 0.4 });
      s.px(30 + sx * 3.8 - 0.4, y - 1.8, 0xffffff);
      for (const dy of [-0.6, 0.8]) s.line(30 + sx * 2.4, y + 3.4, 30 + sx * 8, y + 3 + dy * 2, 0x9aa4b4, 1, 0.7); // whiskers
    }
    s.dot(30, y + 3, 1, 0xe08a9a); // the nose
    if (open) s.line(29, y + 5, 31, y + 5, 0x7a3a4a, 1);
  };
  if (f === 1) {
    ears(36, 7); // the tips of its ears, the snow falling off them
    for (let k = 0; k < 5; k++) s.dot(24 + k * 3, 30 + (k % 2) * 2, 0.8, 0xffffff);
  } else if (f === 2) {
    ears(30, 10);
    head(33, false);
  } else if (f >= 3) {
    s.ellipse(30, 34, 9, 8, 'sn', { bias: 0.06, pat: fur(Math.PI / 2, { amt: 0.12, len: 4, seed: 6 }) });
    for (const sx of [-1, 1]) s.ellipse(30 + sx * 4.5, 40 + (f === 4 ? -4 : 0), 2.2, 2.6, 'sn', { bias: 0.1 }); // forepaws (up, throwing)
    ears(20, 13);
    head(24, f === 4);
    if (f === 4) charge(s, 30, 34, 3.6, 'ff', 0xffffff); // a snowball, packed hard
  }
  drift(true);
  return s;
}

// ---------------------------------------------------------------- Osaka: a little octopus out of a manhole
function osaka(f) {
  const s = sprite();
  const lid = (x, y, tilt) => {
    s.ellipse(x, y, 11, 8 * tilt, 'ir', { flat: 0.5, pat: speckle({ amt: 0.1, seed: 4 }) });
    s.paint([x - 12, y - 9, x + 12, y + 9], (px, py) => { const d = Math.hypot((px - x) / 11, (py - y) / (8 * tilt)); return d > 0.82 && d < 1; }, 'ir', () => 0.7);
    // a pattern of our own cast in it: rings and rays, the bumps that keep a shoe from slipping
    for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; s.line(x + Math.cos(a) * 3, y + Math.sin(a) * 3 * tilt, x + Math.cos(a) * 7.4, y + Math.sin(a) * 6 * tilt, 0x6a6672, 1, 0.8); }
    s.paint([x - 4, y - 4, x + 4, y + 4], (px, py) => Math.abs(Math.hypot((px - x) / 3, (py - y) / (3 * tilt)) - 1) < 0.18, 'ir', () => 0.78);
  };
  // the road round it: a ring of darker asphalt where the frame is set
  s.ellipse(30, 42, 14, 10, 'ir', { flat: 0.3, pat: speckle({ amt: 0.2, seed: 1 }) });
  if (f === 0) { lid(30, 42, 1); return s; }
  s.ellipse(30, 42, 11, 8, 'ho', { flat: 0.4 }); // the shaft
  if (f === 1) {
    for (const sx of [-1, 1]) s.dot(30 + sx * 3.4, 45, 1, 0xffe080); // eyes under the lifted lid
    s.tube(38, 46, 42, 42, 1.4, 'oc', { rb: 0.8 });
    lid(31, 39, 0.85);
    return s;
  }
  lid(48, 50, 0.7); // pushed aside
  const tent = (front) => {
    for (let k = 0; k < 6; k++) {
      const sx = k < 3 ? -1 : 1;
      const j = k % 3;
      if ((j === 1) !== front) continue;
      const ax = 30 + sx * (3 + j * 2);
      const ay = 38;
      const bx = 30 + sx * (10 + j * 4);
      const by = 42 + j * 4 - (f === 4 ? 3 : 0);
      s.tube(ax, ay, bx, by, 2.6, 'oc', { rb: 1.2 });
      s.tube(bx, by, bx + sx * 2, by - 3, 1.2, 'oc', { rb: 0.6 }); // its tip curling
      for (let t = 0.25; t < 1; t += 0.25) s.dot(ax + (bx - ax) * t, ay + (by - ay) * t + 1.4, 0.7, 0xffd8c8); // suckers
    }
  };
  if (f === 2) {
    s.ellipse(30, 38, 9, 7, 'oc', { bias: 0.06 }); // its head rising
    for (const sx of [-1, 1]) { s.ellipse(30 + sx * 3.4, 41, 2, 1.6, 'hb', { flat: 0.8 }); s.line(30 + sx * 3.4 - 1, 41, 30 + sx * 3.4 + 1, 41, INK, 1); }
    tent(true);
    return s;
  }
  tent(false);
  s.ellipse(30, 24, 10, 11.5, 'oc', { bias: 0.06, pat: mottle({ amt: 0.1, scale: 3 }) }); // the mantle
  for (let k = 0; k < 6; k++) s.dot(26 + (k % 3) * 4, 18 + Math.floor(k / 3) * 5, 0.8, 0xff9a8a); // its spots
  // a twisted headband (hachimaki), knotted at the side
  s.paint([19, 19, 41, 25], (x, y) => Math.abs(y - (22 + ((x - 30) / 10) ** 2 * 1.2)) < 1.6 && Math.abs(x - 30) < 10.4, 'hb', (x) => (Math.floor(x / 2) % 2 ? 0.8 : 0.5));
  for (let x = 21; x < 40; x += 3) s.line(x, 21, x + 1.4, 23, 0xd02a30, 1, 0.8);
  s.tube(40, 22, 44, 19, 1, 'hb'); s.tube(40, 22, 45, 24, 1, 'hb');
  for (const sx of [-1, 1]) {
    s.ellipse(30 + sx * 4, 31, 2.6, 2.2, 'hb', { flat: 0.85 });
    s.line(30 + sx * 4 - 1.6, 31, 30 + sx * 4 + 1.6, 31, INK, 1); // the bar of an octopus's pupil
  }
  tent(true);
  if (f === 4) charge(s, 30, 38, 3.4, 'gm', 0x3a1a3a); // a gob of ink, hot
  else s.ellipse(30, 36, 1.6, 1.2, 'oc', { flat: 0.3 }); // its funnel
  return s;
}

// ---------------------------------------------------------------- Beppu: a mud bōzu out of a boiling mud pool
function beppu(f) {
  const s = sprite();
  // the pool of grey mud, rings spreading on it, bubbles: the round bald heads Oniishibozu Jigoku is named for
  s.ellipse(30, 42, 19, 11, 'md', { bias: 0.04, pat: mottle({ amt: 0.12, scale: 4, seed: 3 }) });
  for (let k = 0; k < 3; k++) s.paint([10, 30, 50, 54], (x, y) => Math.abs(Math.hypot((x - 30) / (16 - k * 4), (y - 42) / (9 - k * 2.2)) - 1) < 0.07, 'md', () => 0.82);
  const bubbles = [[18, 44, 2.4], [42, 40, 2], [37, 48, 1.6], [22, 37, 1.4]];
  for (const [x, y, r] of bubbles) { s.ellipse(x, y, r, r * 0.85, 'md', { bias: 0.18 }); s.px(x - r * 0.4, y - r * 0.4, 0xe8e0d4); }
  const dome = (y, rx, ry) => {
    s.ellipse(30, y, rx, ry, 'md', { bias: 0.12, pat: mottle({ amt: 0.08, scale: 3, seed: 5 }) });
    s.ellipse(30 - rx * 0.35, y - ry * 0.4, rx * 0.25, ry * 0.18, 'md', { flat: 1 }); // the wet shine on its crown
  };
  if (f === 0) return s;
  if (f === 1) { dome(41, 7, 5); return s; } // a bubble swelling, bigger than the rest
  if (f === 2) {
    dome(36, 9, 8);
    for (const sx of [-1, 1]) s.ellipse(30 + sx * 3.4, 39, 1.4, 1.1, 'mh', { flat: 0.6, glow: true });
    return s;
  }
  // out: head and shoulders of mud, drips running off them, eyes lit by the heat inside
  s.ellipse(30, 38, 13, 7, 'md', { bias: 0.04 });
  dome(26, 10, 11);
  for (const [x, y, l] of [[22, 30, 6], [37, 28, 7], [27, 34, 4], [40, 34, 4]]) s.tube(x, y, x, y + l, 1.1, 'md', { bias: 0.1, rb: 0.8 });
  for (const sx of [-1, 1]) {
    s.ellipse(30 + sx * 4, 26, 1.8, 1.4, 'mh', { flat: 0.7, glow: true });
    s.line(30 + sx * 2, 22.4, 30 + sx * 6, 23, 0x2a2622, 1); // brows of mud
  }
  if (f === 4) {
    s.ellipse(30, 32, 3.4, 2.6, 'mh', { flat: 0.8, glow: true }); // its mouth open on the heat
    for (let k = 0; k < 4; k++) s.dot(26 + k * 3, 14 - (k % 2) * 3, 1.2, 0xf0ece4, 0.6); // steam off its crown
  } else s.line(28, 32, 32, 32, 0x2a2622, 1);
  return s;
}

// ---------------------------------------------------------------- Hiroshima: an anago eel out of its hole in the flats
function hiroshima(f) {
  const s = sprite();
  // wet sand with a skin of water over it, the hole, ripples round it
  s.ellipse(30, 44, 18, 10, 'ws', { bias: 0.05, pat: mix2(speckle({ amt: 0.18, seed: 2 }), mottle({ amt: 0.1, scale: 4 })) });
  s.ellipse(30, 44, 14, 7, 'wa', { flat: 0.45, pat: mottle({ amt: 0.12, scale: 5, seed: 8 }) });
  for (let k = 0; k < (f === 1 ? 3 : 2); k++) s.paint([10, 34, 50, 54], (x, y) => Math.abs(Math.hypot((x - 30) / (6 + k * 4), (y - 44) / (3.4 + k * 2.2)) - 1) < 0.08, 'wa', () => 0.95);
  s.ellipse(30, 44, 3.6, 2.4, 'ho', { flat: 0.4 });
  const head = (x, y, open) => {
    s.ellipse(x, y, 4.6, 5.4, 'ag', { bias: 0.08 });
    s.ellipse(x, y + 3.4, 3, 2.4, 'ab', { bias: 0.1 }); // the pale jaw
    for (const sx of [-1, 1]) { s.dot(x + sx * 2.4, y - 1, 1, 0xd8e0e8); s.px(x + sx * 2.4, y - 1, INK); }
    if (open) { s.ellipse(x, y + 4, 2.4, 2.2, 'gm', { flat: 0.6, glow: true }); for (const sx of [-1, 1]) s.px(x + sx * 1.6, y + 2.4, 0xffffff); }
  };
  if (f === 0) return s;
  if (f === 1) { for (let k = 0; k < 3; k++) s.dot(28 + k * 2, 41 - k, 0.8, 0xe8f4f8); return s; } // bubbles from the hole
  if (f === 2) { s.tube(30, 44, 30, 36, 3.4, 'ag', { bias: 0.04 }); head(30, 34, false); return s; }
  // out: its long body in an S from the hole, the row of white dots along its side, the fin's pale edge
  const pts = [[30, 44], [36, 38], [36, 30], [26, 26], [24, 18], [30, 14]];
  for (let i = 0; i < pts.length - 1; i++) s.tube(...pts[i], ...pts[i + 1], 3.6 - i * 0.2, 'ag', { bias: 0.04, rb: 3.4 - i * 0.2 });
  for (let i = 0; i < pts.length - 1; i++) for (let t = 0.2; t < 1; t += 0.33) { const [ax, ay] = pts[i]; const [bx, by] = pts[i + 1]; s.dot(ax + (bx - ax) * t + 1, ay + (by - ay) * t, 0.7, 0xfff4e0); }
  for (let i = 0; i < pts.length - 1; i++) s.line(pts[i][0] - 3, pts[i][1], pts[i + 1][0] - 3, pts[i + 1][1], 0xb8a880, 1, 0.6);
  head(30, 13, f === 4); // facing down at us, coiled over its hole
  if (f === 4) charge(s, 30, 22, 2.8, 'gm', 0xffc0d0);
  return s;
}

// ---------------------------------------------------------------- Nagasaki: a hook-tailed cat out of a crate on the quay
function nagasaki(f) {
  const s = sprite();
  const shake = f === 1 ? 1 : 0;
  shadow(s, 33, 47, 18, 6);
  // the crate seen from above, open: its boards, the dark inside, a bed of straw
  const bx = shake;
  s.poly([[14 + bx, 32], [46 + bx, 32], [47 + bx, 50], [13 + bx, 50]], 'cr', { flat: 0.55, tex: 0.3, seed: 6 });
  s.poly([[17 + bx, 35], [43 + bx, 35], [44 + bx, 47], [16 + bx, 47]], 'ho', { flat: 0.6 });
  for (let k = 0; k < 9; k++) s.line(18 + bx + k * 3, 46, 20 + bx + k * 3 - (k % 2) * 3, 42, 0xd8b060, 1, 0.8); // straw
  for (const y of [32.5, 49.5]) s.line(13 + bx, y, 47 + bx, y, 0x4a2e14, 1, 0.9);
  for (const x of [14, 46]) for (const y of [33, 49]) s.dot(x + bx, y, 0.6, 0x2a2622); // nails
  const ears = (y) => { for (const sx of [-1, 1]) { s.poly([[30 + sx * 2.6, y + 3], [30 + sx * 8.4, y + 3.4], [30 + sx * 7, y - 4]], sx < 0 ? 'ca' : 'bk', { flat: 0.6 }); s.poly([[30 + sx * 4.4, y + 2.4], [30 + sx * 7.4, y + 2.6], [30 + sx * 6.6, y - 1.6]], 'pk', { flat: 0.6 }); } };
  const head = (y, open) => {
    s.ellipse(30, y, 8.6, 7.4, 'wf', { bias: 0.06, pat: fur(Math.PI / 2, { amt: 0.1, len: 3, seed: 8 }) });
    s.paint([20, y - 8, 30, y + 2], (x, py) => ((x - 30) / 8.6) ** 2 + ((py - y) / 7.4) ** 2 < 1 && x < 28 - (py - y) * 0.4, 'ca', () => 0.6, { pat: fur(Math.PI / 2, { amt: 0.12, len: 3, seed: 2 }) }); // a calico's patches
    s.paint([31, y - 8, 39, y - 2], (x, py) => ((x - 30) / 8.6) ** 2 + ((py - y) / 7.4) ** 2 < 1 && py < y - 3 + (x - 33) * 0.3, 'bk', () => 0.5);
    for (const sx of [-1, 1]) {
      s.ellipse(30 + sx * 3.6, y - 0.6, 1.8, 1.6, 'lf', { flat: 0.9 });
      s.line(30 + sx * 3.6, y - 1.8, 30 + sx * 3.6, y + 0.6, INK, 1); // slit pupils
      for (const dy of [-0.5, 0.9]) s.line(30 + sx * 3, y + 3, 30 + sx * 9.6, y + 2.4 + dy * 2, 0xe8e4ee, 1, 0.7);
    }
    s.dot(30, y + 2.4, 0.9, 0xe08a9a);
    if (open) { s.ellipse(30, y + 4.6, 2.4, 2, 'pk', { flat: 0.3 }); for (const sx of [-1, 1]) s.line(30 + sx * 1.4, y + 3.4, 30 + sx * 1.4, y + 5, 0xffffff, 1); }
  };
  if (f === 0) return s;
  if (f === 1) { for (const sx of [-1, 1]) s.dot(30 + sx * 3.6 + bx, 40, 1, 0xd8f060); return s; } // eyes in the dark of it
  if (f === 2) { ears(30); head(36, false); return s; }
  // out: up on the crate's edge, paws over it, the tail up behind with the hook at its end Nagasaki's cats are known for
  s.tube(42, 40, 45, 26, 2, 'ca', { rb: 1.8 });
  s.tube(45, 26, 43, 21, 1.8, 'ca', { rb: 1.5 });
  s.tube(43, 21, 39, 22, 1.5, 'bk', { rb: 1.3 }); // the hook
  for (const y of [37, 33, 29]) s.line(41.4 + (40 - y) * 0.2, y, 45 + (40 - y) * 0.2, y - 0.6, 0x8a4a14, 1, 0.8); // its rings
  s.ellipse(30, 34, 9, 7, 'wf', { bias: 0.05, pat: fur(Math.PI / 2, { amt: 0.1, len: 3, seed: 1 }) });
  for (const sx of [-1, 1]) { s.ellipse(30 + sx * 5, 34.5, 2.6, 2, 'wf', { bias: 0.1 }); for (let k = -1; k <= 1; k++) s.px(30 + sx * 5 + k, 35.6, 0xa8a4b0); } // paws on the edge
  ears(17);
  head(24, f === 4);
  if (f === 4) charge(s, 30, 34, 3, 'gm', 0xffe080);
  return s;
}

// ---------------------------------------------------------------- Tokyo: a rat out of a storm drain in the kerb
function tokyo(f) {
  const s = sprite();
  // the kerb's concrete, the iron grate in it, its slots dark
  s.poly([[10, 36], [50, 36], [50, 50], [10, 50]], 'co', { flat: 0.55, tex: 0.25, seed: 3 });
  s.poly([[15, 38], [45, 38], [45, 48], [15, 48]], 'ir', { flat: 0.45, pat: speckle({ amt: 0.12, seed: 6 }) });
  for (let x = 17; x < 44; x += 3) s.poly([[x, 39.5], [x + 1.6, 39.5], [x + 1.6, 46.5], [x, 46.5]], 'ho', { flat: 0.4 });
  s.line(15, 48.5, 45, 48.5, 0x2a2622, 1, 0.7);
  const head = (y, open) => {
    s.ellipse(30, y, 6, 5.2, 'rt', { bias: 0.06, pat: fur(Math.PI / 2, { amt: 0.12, len: 3, seed: 4 }) });
    s.poly([[26.4, y + 2], [33.6, y + 2], [30.8, y + 7.6], [29.2, y + 7.6]], 'rt', { flat: 0.6 }); // the snout
    s.dot(30, y + 7.6, 0.9, 0xe08a9a);
    for (const sx of [-1, 1]) {
      s.ellipse(30 + sx * 5.6, y - 3.4, 2.8, 2.6, 'pk', { bias: 0.04 }); // round ears
      s.dot(30 + sx * 2.8, y - 0.6, 1, INK); s.px(30 + sx * 2.8 - 0.4, y - 1.2, 0xffffff);
      for (const dy of [-0.6, 0.8]) s.line(30 + sx * 1.2, y + 5.6, 30 + sx * 7.6, y + 5 + dy * 2.2, 0x9a9ca0, 1, 0.7);
    }
    if (open) { s.ellipse(30, y + 8.4, 1.8, 1.4, 'gm', { flat: 0.6, glow: true }); s.line(29.4, y + 7.6, 30.6, y + 7.6, 0xfff0a0, 1); } // teeth bared
  };
  if (f === 0) return s;
  if (f === 1) { for (const x of [26.6, 32.6]) s.px(x, 42, 0xff3a2a).px(x + 0.6, 42, 0xff3a2a); return s; } // red eyes between the bars
  if (f === 2) { head(39, false); return s; }
  // out: sitting up on the grate, its tail over the kerb
  s.tube(30, 30, 38, 22, 1.2, 'pk', { rb: 0.8 });
  s.tube(38, 22, 44, 24, 0.8, 'pk', { rb: 0.5 });
  s.ellipse(30, 31, 7.4, 8.6, 'rt', { bias: 0.04, pat: fur(-Math.PI / 2, { amt: 0.14, len: 4, seed: 9 }) });
  s.ellipse(30, 35, 4.4, 4.6, 'wf', { flat: 0.42, pat: fur(Math.PI / 2, { amt: 0.12, len: 3, seed: 5 }) }); // its paler belly
  for (let k = 0; k < 4; k++) s.line(24 + k * 1.2, 26 + k * 2.4, 26 + k * 1.2, 27 + k * 2.4, 0x7a7068, 1, 0.6); // a scruffy coat
  for (const sx of [-1, 1]) s.ellipse(30 + sx * 3.6, 42 + (f === 4 ? -3 : 0), 1.6, 1.4, 'pk', { bias: 0.1 }); // its forepaws
  head(34, f === 4);
  if (f === 4) charge(s, 30, 46, 2.6, 'gm', 0xffe080);
  return s;
}

// ---------------------------------------------------------------- Kawaguchiko: a mole out of its hill in a garden
function kawaguchiko(f) {
  const s = sprite();
  shadow(s, 33, 40, 15, 6);
  // the molehill: a mound of fresh dark earth, crumbs round it, fallen leaves on it; heaving as it stirs
  const heave = f === 1 ? 1.6 : 0;
  s.ellipse(30, 36 - heave, 15 + heave, 10 + heave, 'ea', { bias: 0.02, pat: speckle({ amt: 0.3, dark: 0.12, light: 0.06, seed: 4 }) });
  for (const [x, y] of [[20, 40], [40, 39], [24, 31], [37, 31]]) s.dot(x, y, 1.2, 0x7e5e44); // crumbs on it
  for (const [x, y, a] of [[22, 30, 0.4], [38, 38, 2.2]]) s.poly([[x, y], [x + 4 * Math.cos(a), y + 3 * Math.sin(a)], [x + 2, y + 3]], 'lv', { flat: 0.6 });
  if (f === 1) for (const [x0, y0, x1, y1] of [[24, 30, 30, 34], [30, 34, 37, 30]]) s.line(x0, y0, x1, y1, 0x1a120c, 1);
  if (f < 2) return s;
  s.ellipse(30, 32, 6, 3, 'ho', { flat: 0.2 }); // the hole it came up by
  const head = (y, open) => {
    s.ellipse(30, y, 7.5, 6.5, 'ml', { bias: 0.06, pat: fur(Math.PI / 2, { amt: 0.1, len: 3, seed: 6 }) });
    s.poly([[27, y + 4], [33, y + 4], [31, y + 9], [29, y + 9]], 'pk', { flat: 0.6 }); // the long pink snout
    s.dot(30, y + 9, 1, 0xe08a9a);
    for (const sx of [-1, 1]) s.dot(30 + sx * 3, y + 1, 0.7, 0x05040a); // its eyes, mere pinpricks in the fur
    if (open) charge(s, 30, y + 13, 2.6, 'gm', 0xffe080);
  };
  if (f === 2) {
    head(33, false);
    for (const sx of [-1, 1]) s.ellipse(30 + sx * 8, 36, 3.6, 2.6, 'pk', { bias: 0.1 }); // the great digging paws on the rim
    return s;
  }
  // out: the velvet body risen from the hill, its spade paws spread
  s.ellipse(30, 26, 9, 9, 'ml', { bias: 0.04, pat: fur(-Math.PI / 2, { amt: 0.1, len: 4, seed: 9 }) });
  for (const sx of [-1, 1]) {
    s.ellipse(30 + sx * 10, 32, 4.4, 3, 'pk', { bias: 0.1 });
    for (let k = -2; k <= 2; k++) s.line(30 + sx * 12, 32 + k * 0.9, 30 + sx * 15, 32 + k * 1.3, 0xf0e0d0, 1, 0.8); // its claws
  }
  head(35, f === 4);
  return s;
}

// ---------------------------------------------------------------- Onomichi: an octopus out of its clay pot on the harbour
function onomichi(f) {
  const s = sprite();
  shadow(s, 33, 40, 16, 7);
  // the pots: three lying in a row on the quay, mouths to the bottom of the screen, this one in the middle
  for (const [x, y] of [[13, 30], [47, 30]]) {
    s.ellipse(x, y, 7, 9, 'tp', { bias: 0.04, tex: 0.25 });
    s.ellipse(x, y + 6, 4, 2.6, 'ho', { flat: 0.2 });
  }
  s.ellipse(30, 30, 9, 11, 'tp', { bias: 0.04, tex: 0.25 });
  s.line(21.5, 27, 38.5, 27, 0x3a1a0c, 1, 0.6); // the cord round its neck
  s.ellipse(30, 38, 5.4, 3.4, 'ho', { flat: 0.2 }); // its mouth, dark
  if (f === 0) return s;
  // stirring: the tips of its arms feeling out of the mouth
  const arm = (x0, y0, x1, y1, w = 1.3) => {
    s.tube(x0, y0, x1, y1, w, 'oc', { rb: 0.6 });
    s.dot(x1, y1, 0.6, 0xffd0c8);
  };
  if (f === 1) {
    arm(27, 39, 24, 43);
    arm(33, 39, 36, 44);
    return s;
  }
  if (f === 2) {
    // half out: the head over the rim, the eyes on it, more arms
    s.ellipse(30, 40, 5.4, 4.4, 'oc', { bias: 0.08, pat: speckle({ amt: 0.2, seed: 7 }) });
    for (const sx of [-1, 1]) s.dot(30 + sx * 2.6, 41.4, 1, 0xf0d040);
    for (const [x, y] of [[22, 44], [38, 45], [26, 47]]) arm(30, 41, x, y);
    return s;
  }
  // out: on top of its pot, its arms spread over the quay, its siphon turned at the ship (glowing when it shoots)
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU + 0.2;
    arm(30 + Math.cos(a) * 4, 38 + Math.sin(a) * 3, 30 + Math.cos(a) * 15, 40 + Math.sin(a) * 9, 1.6);
  }
  s.ellipse(30, 33, 7.6, 8.6, 'oc', { bias: 0.06, pat: speckle({ amt: 0.2, seed: 8 }) });
  for (const sx of [-1, 1]) {
    s.ellipse(30 + sx * 3.4, 38, 1.8, 1.6, 'W', { flat: 0.9 });
    s.dot(30 + sx * 3.4, 38.6, 0.9, 0x14101c);
  }
  if (f === 4) charge(s, 30, 46, 2.6, 'gm', 0xffe080);
  return s;
}

// ---------------------------------------------------------------- Fukuoka: a soft-shell turtle out of a pond
function fukuoka(f) {
  const s = sprite();
  // the pond's green water, still, a reed or two at its edge
  s.ellipse(30, 36, 24, 15, 'pw', { flat: 0.55, pat: mottle({ amt: 0.1, scale: 4, seed: 3 }) });
  for (const [x, y] of [[9, 30], [11, 26], [50, 28]]) s.line(x, y + 8, x + 1, y, 0x5a7a3a, 1.2);
  const rings = (x, y, n) => {
    for (let k = 0; k < n; k++) for (let a = 0; a < TAU; a += 0.25) s.px(x + Math.cos(a) * (4 + k * 3), y + Math.sin(a) * (2.4 + k * 1.8), 0x9ac0b0, 0.55 - k * 0.12);
  };
  if (f === 0) {
    // at rest: only the tip of its long snout up through the water, breathing, rings round it
    s.dot(30, 37, 1.2, 0x5a6244);
    s.dot(29.6, 36.6, 0.5, 0x14101c);
    s.dot(30.6, 36.6, 0.5, 0x14101c);
    rings(30, 37, 2);
    return s;
  }
  if (f === 1) {
    // stirring: the round shadow of its shell under the water, bubbles, two eyes catching the light
    s.ellipse(30, 33, 12, 9, 'sf', { flat: 0.25 });
    for (const sx of [-1, 1]) s.dot(30 + sx * 2, 42, 0.9, 0xf0d040);
    for (let i = 0; i < 5; i++) s.dot(24 + i * 3, 30 + (i % 2) * 3, 0.8, 0xc8e8e0, 0.8);
    rings(30, 42, 2);
    return s;
  }
  // half out and out: the flat leathery shell, its soft rim, the feet paddling, the long neck, the snout like a
  // little trunk, the mouth (which bites)
  const out = f >= 3;
  s.ellipse(30, 31, 13, 10.5, 'sf', { bias: 0.05, pat: mix2(speckle({ amt: 0.18, dark: 0.12, seed: 6 }), mottle({ amt: 0.12, scale: 3, seed: 7 })) });
  s.paint([16, 20, 44, 42], (x, y) => { const q = ((x - 30) / 13) ** 2 + ((y - 31) / 10.5) ** 2; return q < 1 && q > 0.72; }, 'sf', () => 0.75); // the soft rim
  for (let k = 0; k < 7; k++) s.dot(24 + (k % 4) * 4, 27 + Math.floor(k / 4) * 5, 0.8, 0x2a2e1e, 0.7);
  if (out)
    for (const [sx, sy] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
      s.ellipse(30 + sx * 13, 31 + sy * 6, 4, 2.6, 'sf', { bias: 0.08 });
      for (let k = -1; k <= 1; k++) s.dot(30 + sx * 16.4, 31 + sy * 6 + k * 1.2, 0.6, 0xe8e0c8); // its claws
    }
  const ny = out ? 46 : 43;
  s.tube(30, 40, 30, ny, out ? 3 : 2.6, 'sf');
  s.ellipse(30, ny + 1.4, 3.4, 3, 'sf', { bias: 0.08 });
  s.ellipse(30, ny + 2.4, 2.2, 1.6, 'sb', { flat: 0.8 }); // its pale throat
  s.tube(30, ny + 3, 30, ny + 6, 0.9, 'sf'); // the snout
  for (const sx of [-1, 1]) {
    s.dot(30 + sx * 2, ny + 0.4, 1.1, 0xf0d040);
    s.dot(30 + sx * 2, ny + 0.6, 0.5, 0x14101c);
  }
  if (out) s.line(28, ny + 3.6, 32, ny + 3.6, 0x14101c, 1.2); // the mouth, open
  rings(30, 31, out ? 3 : 2);
  if (f === 4) charge(s, 30, ny + 9, 2.6, 'gm', 0xffe080);
  return s;
}

const DRAW = { kyoto, okinawa, sapporo, osaka, beppu, hiroshima, nagasaki, tokyo, kawaguchiko, onomichi, fukuoka };
export const AMBUSH_CITIES = Object.keys(DRAW);

/** Every ambusher's five frames, for the shared 540 px atlas. */
export function ambushSprites540(add) {
  for (const [city, draw] of Object.entries(DRAW)) for (let f = 0; f < 5; f++) add(`amb_${city}_${f}`, draw(f).render({ outline: 2 }));
}
