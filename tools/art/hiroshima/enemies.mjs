// Hiroshima's enemies at 540 px (docs/enemies-540-plan.md): mischievous red maple-leaf spirits; the rough, flaking oysters of the Seto Inland Sea with a pearl in the
// mantle; Miyajima's shamoji paddles come alive as tsukumogami; momiji manjū, the maple-leaf cakes, branded
// and baked golden; the stone lanterns of the shore at Itsukushima; the Heike crab with the scowling face of
// a drowned Heike samurai in its shell (now the taka-ashi-gani, the long-legged spider crab: crab540.mjs); and Sankibō, the great tengu of Mount Misen, in yamabushi dress with
// his crow's wings, feather fan and ringed staff, and the iron braziers of Misen's flame that has never gone out.
// Every frame is three times the old one's size (old mask coordinate m -> fine (m + 1) * 3).
import { HiSprite, tones, fur, speckle, crackle, mottle, mix2 } from '../../lib/hisprite.mjs';
import { sankibo as sankibo540 } from './tengu540.mjs';
import { crab } from './crab540.mjs';

const INK = 0x14101c;
const TAU = Math.PI * 2;
const M = (m) => (m + 1) * 3;
const RAMPS = {
  r: tones([0x8a1420, 0xd02a3a, 0xff7a80]), // chiyogami red
  p: tones([0xb0a8b8, 0xece8f0, 0xffffff]), // the paper's white side
  o: tones([0x4a4248, 0x8e8690, 0xd0c8d0]), // oyster shell
  m: tones([0xa06a6a, 0xe0b0a8, 0xfff0e8]), // its mantle
  w: tones([0x8a6a3a, 0xd0a868, 0xf8e0a8]), // shamoji wood
  b: tones([0x7a3a10, 0xc8782a, 0xf0c070]), // baked manjū
  E: tones([0x4a4846, 0x8a8884, 0xc8c4be]), // lantern stone
  c: tones([0x5a1408, 0xa83a1a, 0xe07a40]), // Heike crab
  t: tones([0x6a0e0c, 0xb8261c, 0xe85a40]), // tengu red
  k: tones([0x0e0e1c, 0x1e2034, 0x3e4260]), // crow-black, indigo
  i: tones([0x2a2628, 0x4a4648, 0x7a7678]), // iron
  s: tones([0x8a3a10, 0xd8702a, 0xf8b070]), // the hakama's persimmon-saffron
  f: [0xa0400a, 0xe06a10, 0xff9a30, 0xffd070, 0xffffff], // flame
  q: [0x7a90a8, 0xb8c8d8, 0xe8f0f8, 0xffffff, 0xffffff], // pearl
};

// ---------------------------------------------------------------- popcorn: a mischievous maple-leaf spirit.
// Legacy atlas keys stay tsuru_* for save/asset compatibility; this is no longer a bird.
export function tsuru(f) {
  const s = new HiSprite(45, 39, RAMPS);
  const sway = [0, 2, 0, -2][f];
  const leaf = [[22+sway,2],[26,13],[35,6],[32,18],[43,15],[35,25],
    [39,29],[27,30],[24,35],[18,30],[5,31],[10,25],[2,17],[14,18],[10,7],[19,13]];
  s.poly(leaf, 'r', { flat: 0.62 });
  s.poly([[22+sway,2],[22,28],[14,18],[10,7],[19,13]], 's', { flat: 0.78 });
  for (const [x,y] of [[22+sway,4],[12,10],[4,18],[39,17],[33,9]]) s.line(22,28,x,y,0xffb04c,1);
  s.line(22,28,24+sway,37,0x733c20,2);
  // A broad impish face, without a beak, neck, tail or wings.
  for (const x of [16,27]) {
    s.ellipse(x,21,3.4,4,'k');
    s.ellipse(x-0.5,20,1.5,2,'p');
  }
  s.line(18,27,22,29,0x35121e,1.5);
  s.line(22,29,26,26,0x35121e,1.5);
  return s.render();
}

// ---------------------------------------------------------------- shooter: a Seto oyster (17 -> 57): shut, cracking, wide open on its pearl
export function kaki(f) {
  const s = new HiSprite(57, 57, RAMPS);
  const c = 28.5;
  const gap = [0, 6, 12][f];
  const shell = (seed) => ({ pat: mix2(crackle({ amt: 0.25, scale: 4, width: 0.06, seed }), speckle({ amt: 0.2, dark: 0.08, light: 0.08, seed: seed + 1 })) });
  // the frilled edges: layer on layer of flaking shell, purple-dark at the rims
  const valve = (cy, up, seed) => {
    s.paint([4, cy - 18, 53, cy + 18], (x, y) => {
      const a = Math.atan2(y - cy, x - c);
      const rr = Math.hypot((x - c) / 22, (y - cy) / 14.4) + Math.sin(a * 11 + seed) * 0.05;
      return rr < 1 && (up ? y < cy + 6 : y > cy - 6);
    }, 'o', (x, y) => 0.4 + 0.5 * Math.max(0, 1 - Math.hypot(x - c + 8, y - cy + 8) / 30), shell(seed));
    for (let k = 1; k < 4; k++) for (let a = 0; a < TAU; a += 0.03) {
      const x = c + Math.cos(a) * 22 * (1 - k * 0.2);
      const y = cy + Math.sin(a) * 14.4 * (1 - k * 0.2) + Math.sin(a * 9 + k) * 0.8;
      if (up ? y < cy + 5 : y > cy - 5) s.px(x, y, 0x3a3248, 0.6);
    }
    for (const rx of [-15, -8, 0, 8, 15]) s.line(c, cy + (up ? -10 : 10), c + rx, cy + (up ? -1 : 1), 0xd0c8d0, 1, 0.45);
  };
  valve(c - 6 - gap * 0.55, true, 3);
  valve(c + 6 + gap * 0.55, false, 7);
  if (f === 0) {
    for (let x = 8; x <= 49; x++) s.px(x, c + Math.sin(x * 0.9) * 1.2, 0x2a2638);
  } else {
    // the soft frilled mantle inside, and the pearl
    s.ellipse(c, c, 17, gap * 0.9 + 1.5, 'm', { flat: 0.55, pat: mottle({ amt: 0.15, scale: 3 }) });
    for (let x = -16; x <= 16; x += 0.5) s.px(c + x, c + Math.sin(x * 1.3) * (gap * 0.25), 0x8a4a4a, 0.6);
    const pr = f === 2 ? 7 : 4;
    s.ellipse(c, c, pr, pr, 'q', { glow: f === 2, bias: 0.05 });
    s.dot(c - pr * 0.35, c - pr * 0.35, pr * 0.3, 0xffffff);
    s.px(c + pr * 0.4, c + pr * 0.3, 0xffc8e8);
  }
  return s.render();
}

// ---------------------------------------------------------------- diver: a Miyajima shamoji come to life (13 x 17 -> 45 x 57)
export function shamoji(f) {
  const s = new HiSprite(45, 57, RAMPS);
  const cx = 22.5;
  const grain = { pat: mix2(fur(Math.PI / 2, { amt: 0.18, len: 20, w: 1.6, gap: 0.04 }), speckle({ amt: 0.08 })) };
  // the handle, a twist of red-and-white shrine cord with its paper streamer fluttering
  s.tube(cx, 3, cx, 26, 4.2, 'w', { rb: 3.6, ...grain });
  s.tube(cx - 4, 12, cx + 4, 12, 1.6, 'r');
  const fl = [0, 3, 1, -2][f];
  s.poly([[cx + 4, 11], [cx + 11, 8 + fl], [cx + 13, 14 + fl], [cx + 5, 14]], 'p', { flat: 0.75 });
  s.line(cx + 7, 10 + fl, cx + 8, 14 + fl, 0xc8c0c8, 1);
  // the broad blade, its grain, a brushed character in ink and the vermilion stamp of the shrine
  s.ellipse(cx, 37, 15, 17, 'w', { bias: 0.04, ...grain });
  s.line(cx - 3, 31, cx + 3, 31, INK, 1);
  s.line(cx, 29, cx, 44, INK, 2);
  s.line(cx - 4, 37, cx + 4, 35.5, INK, 1);
  s.line(cx - 3, 41, cx + 3, 43, INK, 1);
  s.poly([[cx + 6, 44], [cx + 11, 44], [cx + 11, 49], [cx + 6, 49]], 'r', { flat: 0.55 });
  // the tsukumogami's eyes opening in the wood, rice grains stuck to the blade
  const blink = f === 2;
  for (const sx of [-1, 1]) {
    if (blink) s.line(cx + sx * 6 - 2, 33, cx + sx * 6 + 2, 33, INK, 1);
    else {
      s.ellipse(cx + sx * 7.5, 33, 3, 2.6, 'W', { flat: 0.85 });
      s.dot(cx + sx * 7.5, 33.4, 1.4, INK);
    }
  }
  for (const [x, y] of [[-9, 43], [10, 38], [-5, 49], [3, 51]]) s.ellipse(cx + x, y, 1.4, 1, 'W', { flat: 0.9 });
  return s.render();
}

// ---------------------------------------------------------------- carrier: momiji manjū (17 -> 57), its filling the colour of its weapon
const FILL = { red: 0xd8203a, blue: 0x3a72f0, green: 0x37b35a, purple: 0x9c50f0 };
export function manju(color, f) {
  const s = new HiSprite(57, 57, RAMPS);
  const cx = 28.5;
  const cy = M(8.8);
  // a maple leaf of five pointed lobes, the edges serrated
  const lobes = [[8.5, 2.5], [2.5, 6.0], [14.5, 6.0], [4.2, 12.2], [12.8, 12.2]].map(([x, y]) => [M(x), M(y)]);
  s.paint([0, 0, 57, 57], (x, y) => {
    if (Math.hypot(x - cx, y - cy) < 13) return true;
    for (const [lx, ly] of lobes) {
      const dx = lx - cx;
      const dy = ly - cy;
      const l = Math.hypot(dx, dy);
      const t = ((x - cx) * dx + (y - cy) * dy) / (l * l);
      if (t < 0 || t > 1.08) continue;
      const d = Math.abs((x - cx) * dy - (y - cy) * dx) / l;
      const w = 9 * (1 - t * 0.85) + Math.abs(Math.sin(t * 18)) * 1.6;
      if (d < w) return true;
    }
    return false;
  }, 'b', (x, y) => 0.42 + 0.5 * Math.max(0, 1 - Math.hypot(x - cx + 10, y - cy + 10) / 34), { pat: mix2(speckle({ amt: 0.14, dark: 0.05, light: 0.06 }), mottle({ amt: 0.12, scale: 4 })) });
  // the branded veins, a darker bake
  for (const [lx, ly] of lobes) s.line(cx, cy, cx + (lx - cx) * 0.85, cy + (ly - cy) * 0.85, 0x7a3a10, 1);
  s.tube(cx, cy + 10, cx, 54, 1.6, 'b', { bias: -0.15 });
  // the filling glowing through a crack at the heart
  const r = f % 2 ? 6.4 : 5.4;
  s.ellipse(cx, cy, r, r, 'b', { flat: 0.32 });
  s.dot(cx, cy, r - 1.4, FILL[color]);
  s.dot(cx - 1.2, cy - 1.2, 1.2, 0xffffff, 0.8);
  s.dot(cx - 12, cy - 9, 1.8, 0xfff0c0, 0.6);
  return s.render();
}

// ---------------------------------------------------------------- turret: a shore stone lantern (base 19 -> 57, head 17 -> 51)
export function hidoroBase(wreck) {
  const s = new HiSprite(57, 57, RAMPS);
  const c = 28.5;
  const stone = { pat: mix2(speckle({ amt: 0.3, dark: 0.12, light: 0.06, seed: 9 }), mottle({ amt: 0.14, scale: 6 })) };
  if (wreck) {
    s.ellipse(c, c, 22, 22, 'E', { ...stone, bias: -0.1 });
    s.ellipse(c, c, 14, 14, 'K', { flat: 0.25 });
    for (const [x0, y0, x1, y1] of [[15, 18, 39, 39], [39, 18, 18, 36]]) s.line(x0, y0, x1, y1, INK, 2);
    s.dot(c, c, 1.8, 0xff7a20);
    return s.render();
  }
  // the octagonal footing, moss and barnacles from the tide on it
  const oct = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => [c + Math.cos((k / 8) * TAU + 0.39) * 23, c + Math.sin((k / 8) * TAU + 0.39) * 23]);
  s.poly(oct, 'E', { ball: [c, c, 26, 26], ...stone });
  const oct2 = oct.map(([x, y]) => [c + (x - c) * 0.72, c + (y - c) * 0.72]);
  s.poly(oct2, 'E', { flat: 0.42, ...stone });
  for (const [x, y] of [[12, 16], [43, 34], [16, 42], [38, 11]]) s.dot(x, y, 1.6, 0x4a7a3a, 0.9);
  for (const [x, y] of [[9, 30], [46, 22], [27, 48]]) s.dot(x, y, 1, 0xd8d4c8);
  s.ellipse(c, c, 9.5, 9.5, 'E', { flat: 0.3 });
  return s.render();
}

export function hidoroHead(i) {
  const s = new HiSprite(51, 51, RAMPS);
  const c = 25.5;
  const a = (i / 16) * TAU;
  const dx = -Math.sin(a);
  const dy = Math.cos(a);
  const stone = { pat: mix2(speckle({ amt: 0.25, dark: 0.1, light: 0.06 }), mottle({ amt: 0.12, scale: 5 })) };
  // the fire box's window towards the target, glowing
  s.tube(c + dx * 6, c + dy * 6, c + dx * 19, c + dy * 19, 4.6, 'E', { rb: 4, ...stone });
  s.tube(c + dx * 10, c + dy * 10, c + dx * 19, c + dy * 19, 2, 'f', { glow: true });
  // the hexagonal kasa roof seen from above, its ridges, the hōju jewel on top
  const hex = [0, 1, 2, 3, 4, 5].map((k) => [c + Math.cos((k / 6) * TAU + a) * 16, c + Math.sin((k / 6) * TAU + a) * 16]);
  s.poly(hex, 'E', { ball: [c, c, 18, 18], ...stone });
  for (const [x, y] of hex) s.line(c, c, x, y, 0x3a3836, 1);
  for (let k = 0; k < 6; k++) s.line(hex[k][0], hex[k][1], hex[(k + 1) % 6][0], hex[(k + 1) % 6][1], 0xd8d4cc, 1, 0.6);
  s.ellipse(c, c, 5, 5, 'E', { bias: 0.15 });
  s.dot(c - 1.5, c - 1.5, 1.2, 0xffffff, 0.7);
  return s.render();
}

// ---------------------------------------------------------------- heavy: the Heike crab (42 x 30 -> 132 x 96): two strides, and its guard
/** The carapace split by a blow: cracks running out from one spot, a lit lip on their upper side, a chip gone. */
function crackedShell(r) {
  const cx = 66;
  const cy = 38;
  const onShell = (x, y) => {
    const t = (y - (cy - 20)) / 40;
    return t > 0.05 && t < 0.95 && Math.abs(x - cx) < 17 * Math.sin(Math.PI * Math.min(1, 0.25 + t * 0.85)) * (1 - Math.max(0, t - 0.7) * 1.1) && r.alpha(x, y);
  };
  const hit = [cx + 5, cy - 4];
  let sd = 77;
  const rnd = () => ((sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296);
  const crack = (x, y, a, n, w) => {
    for (let i = 0; i < n; i++) {
      const b = a + (i % 2 ? 1 : -1) * (0.3 + rnd() * 0.4);
      const nx = x + Math.cos(b) * 3;
      const ny = y + Math.sin(b) * 3;
      for (let t = 0; t <= 1; t += 0.2) {
        const px = Math.round(x + (nx - x) * t);
        const py = Math.round(y + (ny - y) * t);
        if (!onShell(px, py)) return;
        r.set(px, py, 0x2a0a04);
        if (w > 1) r.set(px + 1, py, 0x2a0a04);
        if (onShell(px, py - 1)) r.set(px, py - 1, 0xffc890, 0.8);
      }
      if (i === 1 && n > 3) crack(nx, ny, a + (rnd() < 0.5 ? 1 : -1) * 0.9, 3, 1);
      x = nx;
      y = ny;
    }
  };
  for (const a of [-2.6, -1.4, -0.4, 0.7, 1.6, 2.4]) crack(hit[0], hit[1], a, 9, 2);
  // the chip knocked out where the blow landed: darker flesh of the shell showing
  for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) if (x * x + y * y <= 8 && onShell(hit[0] + x, hit[1] + y)) r.set(hit[0] + x, hit[1] + y, x + y < 0 ? 0x3a1004 : 0x6a2410);
  return r;
}

export function heike(mode) {
  const s = new HiSprite(132, 96, RAMPS);
  const cx = 66;
  const shell = { pat: mix2(speckle({ amt: 0.22, dark: 0.08, light: 0.05 }), mottle({ amt: 0.16, scale: 7 })) };
  const guard = mode === 'guard';
  const step = guard ? 0 : mode;
  // eight jointed, spiny legs
  for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) {
    const lift = guard ? 0 : ((k + step) % 2 ? -5 : 5) * (step >= 2 ? -1 : 1);
    const y0 = M(9 + k * 4);
    const knee = [cx + sx * (45 + (k % 2) * 6), y0 - 6 + lift];
    const tip = [cx + sx * (60 - Math.abs(k - 1.5) * 3), y0 + 12 + lift];
    s.tube(cx + sx * 28, y0, knee[0], knee[1], 4.4, 'c', { rb: 3.6, ...shell });
    s.tube(knee[0], knee[1], tip[0], tip[1], 3.2, 'c', { rb: 1.2, ...shell });
    for (let j = 1; j < 3; j++) s.px(knee[0] + (tip[0] - knee[0]) * j / 3, knee[1] + (tip[1] - knee[1]) * j / 3 - 2.5, 0xf0d0b0);
  }
  // the carapace, its ridges forming the furious face of a drowned samurai
  s.ellipse(cx, M(13), 39, 29, 'c', { bias: 0.02, ...shell });
  for (const sx of [-1, 1]) for (const [x, y] of [[36, 30], [39, 36], [36, 44]]) s.poly([[cx + sx * x, y - 3], [cx + sx * (x + 5), y], [cx + sx * x, y + 3]], 'c', { flat: 0.6 });
  for (const sx of [-1, 1]) {
    // the brows ridged up in rage
    s.tube(cx + sx * 6, 30, cx + sx * 22, 22, 3.6, 'c', { rb: 2.6, bias: 0.2 });
    s.tube(cx + sx * 6, 30.5, cx + sx * 22, 22.5, 1, 'c', { bias: -0.3 });
    // the eye hollows
    s.ellipse(cx + sx * 13, 33, 6.5, 4.4, 'c', { flat: 0.25 });
    s.dot(cx + sx * 12, 33.5, 1.8, 0xf0c040);
    // the cheekbones, the scowl's creases
    s.tube(cx + sx * 8, 42, cx + sx * 22, 45, 2.6, 'c', { bias: 0.15 });
    s.line(cx + sx * 4, 37, cx + sx * 8, 44, 0x3a0e06, 1);
  }
  s.tube(cx, 30, cx, 42, 3, 'c', { rb: 4, bias: 0.12 }); // the nose
  s.poly([[cx - 16, 50], [cx - 6, 47], [cx + 6, 47], [cx + 16, 50], [cx + 10, 54], [cx - 10, 54]], 'K', { flat: 0.2 }); // the grimace
  for (const sx of [-1, 1]) s.poly([[cx + sx * 9, 48], [cx + sx * 6, 48], [cx + sx * 7.5, 52]], 'W', { flat: 0.8 });
  // the eyes on their stalks at the front
  for (const sx of [-1, 1]) {
    s.tube(cx + sx * 9, 58, cx + sx * 11, 66, 1.6, 'c');
    s.ellipse(cx + sx * 11, 67, 2.6, 2.6, 'K', { bias: 0.1 });
    s.px(cx + sx * 11 - 1, 66, 0xffffff);
  }
  if (guard) {
    // both claws locked across the front, a shield wall
    for (const sx of [-1, 1]) {
      s.tube(cx + sx * 30, 54, cx + sx * 27, 70, 5.5, 'c', shell);
      s.ellipse(cx + sx * 16, 76, 19, 11.5, 'c', { bias: 0.05, ...shell });
      s.ellipse(cx + sx * 16, 76, 13, 7.2, 'c', { bias: 0.18 });
    }
    s.line(cx - 27, 77, cx + 27, 77, 0x3a0e06, 1);
    s.dot(cx - 12, 70, 1.6, 0xffffff);
    s.dot(cx + 12, 70, 1.6, 0xffffff);
    return s.render();
  }
  // the claws poised wide, snapping (frames 1 and 3)
  const open = step % 2;
  for (const sx of [-1, 1]) {
    s.tube(cx + sx * 30, 52, cx + sx * 42, 64, 5.5, 'c', shell);
    s.ellipse(cx + sx * 42, 73, 13, 11.5, 'c', { bias: 0.04, ...shell });
    s.poly([[cx + sx * 46, 78], [cx + sx * 52, 78], [cx + sx * (46 + open * 3), 93]], 'c', { flat: 0.6 });
    s.poly([[cx + sx * 34, 78], [cx + sx * 39, 78], [cx + sx * (36 - open * 3), 92]], 'c', { flat: 0.45 });
    for (let k = 0; k < 3; k++) s.px(cx + sx * (47 + open * 1.5), 82 + k * 3, 0xf0d0b0);
  }
  return s.render();
}

// ---------------------------------------------------------------- boss: Sankibō, the great tengu of Misen (52 x 44 -> 156 x 132)
export function sankibo(pose) {
  const s = new HiSprite(156, 132, RAMPS);
  const cx = M(25);
  const fanPose = pose === 'fan_l' || pose === 'fan_r';
  const wingUp = pose === '0' || pose === '2' || pose === 'fan_l';
  const flap = { 0: 0, 1: 1, 2: 0.4, 3: 1.4, fan_l: 0, fan_r: 1 }[pose];
  const feathers = (seed) => ({ pat: mix2(fur(Math.PI / 2, { amt: 0.3, len: 8, w: 2, gap: 0.12, seed }), speckle({ amt: 0.06 })) });
  // the great crow's wings, feather on feather, the primaries fanned at the tips
  for (const sx of [-1, 1]) {
    for (let i = 5; i >= 0; i--) {
      const wx = cx + sx * (24 + i * 9.5);
      const wy = (wingUp ? 48 - i * 6 : 57 + i * 4.8) + flap * 3;
      s.tube(cx + sx * 18, 54, wx, wy, 6 - i * 0.4, 'k', { rb: 4.5, ...feathers(i) });
      s.poly([[wx - 4, wy - 2], [wx + 4, wy - 2], [wx + sx * 6, wy + 24 - i], [wx + sx * 2, wy + 26 - i]], 'k', { flat: 0.42 + (i % 2) * 0.06, ...feathers(10 + i) });
      s.line(wx, wy, wx + sx * 4, wy + 22 - i, 0x4a5272, 1, 0.8);
    }
  }
  // the yamabushi robe: the white suzukake, the saffron hakama, the gold pom-poms of the yuigesa
  s.ellipse(cx, M(25), 25, 28, 'W', { pat: fur(Math.PI / 2, { amt: 0.08, len: 14, w: 2 }) });
  s.poly([[cx - 17, 80], [cx + 17, 80], [cx + 26, 113], [cx - 26, 113]], 's', { flat: 0.56, pat: fur(Math.PI / 2, { amt: 0.14, len: 10, w: 2 }) });
  for (const d of [-12, -4, 4, 12]) s.line(cx + d * 0.7, 82, cx + d * 1.15, 112, 0x8a3a10, 1); // the hakama's pleats
  s.line(cx - 17, 81, cx + 17, 81, 0xf4f0e8, 2); // its white waistband
  for (const px of [-15, -6, 6, 15]) for (const py of [66, 77]) {
    s.ellipse(cx + px, py, 3.6, 3.6, 'Y', { pat: fur((x, y) => Math.atan2(y - py, x - cx - px), { amt: 0.3, len: 2, w: 1 }) });
  }
  for (const sx of [-1, 1]) s.ellipse(cx + sx * 8, 116, 5, 3.6, 'w', { flat: 0.6 }); // geta
  // the feather fan (hauchiwa) in one hand, the ringed staff (shakujō) in the other
  const fanSide = pose === 'fan_l' ? -1 : 1;
  const fx = fanPose ? cx + fanSide * 48 : cx + 39;
  const fy = fanPose ? M(22) : wingUp ? M(22) : M(25);
  s.tube(cx + fanSide * 21, 69, fx, fy + 8, 2.6, 't');
  for (let k = -4; k <= 4; k++) {
    const a = -Math.PI / 2 + k * 0.28;
    s.poly([[fx, fy + 6], [fx + Math.cos(a) * 17 - 2.5, fy + Math.sin(a) * 17], [fx + Math.cos(a) * 19, fy + Math.sin(a) * 19 - 1], [fx + Math.cos(a) * 17 + 2.5, fy + Math.sin(a) * 17]], 'W', { flat: 0.6 + (k % 2) * 0.1, pat: fur(a, { amt: 0.2, len: 3, w: 1 }) });
  }
  s.ellipse(fx, fy + 6, 3, 3, 'r', { flat: 0.6 });
  const sx2 = cx - fanSide * 36;
  s.tube(sx2, 34, sx2, 102, 1.6, 'w');
  s.ellipse(sx2, 30, 6.5, 7.5, 'Y', { flat: 0.4 });
  for (let k = 0; k < 3; k++) for (const d of [-1, 1]) s.ellipse(sx2 + d * 5.5, 26 + k * 4.4, 2, 2, 'Y', { bias: 0.1 });
  s.tube(sx2 + fanSide * 3, 66, sx2, 68, 4.5, 't');
  // the head: the deep red face, the long nose, the white brows and beard, the black tokin cap
  s.ellipse(cx, M(13), 19, 18, 't', { bias: 0.04, pat: speckle({ amt: 0.1 }) });
  for (let k = 0; k < 9; k++) {
    const a = Math.PI * 0.15 + (k / 8) * Math.PI * 0.7;
    s.tube(cx + Math.cos(a) * 12, 50 + Math.sin(a) * 3, cx + Math.cos(a) * 15, 53 + Math.sin(a) * 9, 2.8, 'W', { rb: 0.8, pat: fur(a, { amt: 0.2, len: 4, w: 1 }) });
  }
  for (const sx of [-1, 1]) {
    s.tube(cx + sx * 4, 33, cx + sx * 24, 26, 3, 'W', { rb: 1.2, pat: fur(0, { amt: 0.2, len: 3, w: 1 }) });
    s.ellipse(cx + sx * 8, 37, 3.6, 2.8, 'W', { flat: 0.85 });
    s.dot(cx + sx * 8, 37.5, 1.6, 0xd8a020);
    s.px(cx + sx * 8, 37.5, INK);
  }
  // the long nose of a daitengu, jutting out at the viewer: a thick cone foreshortened, lit on its left, the tip
  // tilting up a little, wrinkles at the bridge, its shadow thrown across the beard
  // the nose sticks out sideways and a little up, the head turned three quarters, as in the masks: a thick cone
  // from the brow to a blunt tip, lit along its top, its shadow on the cheek and beard below
  s.poly([[cx + 1, 46], [cx + 17, 50], [cx + 16, 54], [cx + 2, 53]], 'K', { flat: 0.08 });
  s.poly([[cx - 3, 37], [cx + 3, 39], [cx + 20, 43.5], [cx + 21, 46.5], [cx + 3, 49], [cx - 3, 46]], 't', { ball: [cx + 4, 41, 18, 8], bias: 0.1 });
  s.ellipse(cx + 20, 45, 2.6, 2.4, 't', { bias: 0.2 });
  s.line(cx, 39.5, cx + 19, 43.2, 0xff9a80, 1, 0.85);
  s.px(cx + 19, 47, 0x3a0806);
  for (let k = 0; k < 3; k++) s.line(cx - 3 + k * 1.6, 36, cx - 3 + k * 1.6, 41, 0x6a0e0c, 1, 0.8);
  s.dot(cx - 1.5, 42, 1.2, 0xffb8a0);
  s.poly([[cx - 6, 14], [cx + 6, 14], [cx + 5, 24], [cx - 5, 24]], 'K', { flat: 0.45 });
  s.dot(cx, 19, 1.8, 0xe2aa32);
  // the gale (fan poses): air torn into streaks
  if (fanPose) for (let k = -3; k <= 3; k++) s.tube(fx + fanSide * 20, fy + k * 6, fx + fanSide * 26, fy + k * 6 + 2, 1, 'q', { glow: true });
  return s.render();
}

// ---------------------------------------------------------------- the iron braziers of Misen's undying flame (15 x 17 -> 51 x 57)
export function brazier(f) {
  const s = new HiSprite(51, 57, RAMPS);
  const cx = 25.5;
  // the tripod legs, the iron bowl, its rim
  for (const [x0, x1] of [[-12, -15], [12, 15], [0, 0]]) s.tube(cx + x0, 40, cx + x1, 53, 1.8, 'i');
  s.ellipse(cx, 37, 17, 10.5, 'i', { pat: speckle({ amt: 0.2, dark: 0.08 }) });
  s.ellipse(cx, 34, 15, 5, 'i', { flat: 0.75 });
  // the flame, tall and alive
  const sway = [0, 1.6, 0, -1.6][f];
  const pts = [];
  for (let k = 0; k <= 30; k++) {
    const t = k / 30;
    const hw = 11 * Math.sin(Math.PI * Math.min(1, (1 - t) * 0.8 + 0.2)) * Math.pow(1 - t, 0.55);
    pts.push([cx + hw + sway * t * t * 4, 34 - t * 32]);
  }
  for (let k = 30; k >= 0; k--) {
    const t = k / 30;
    const hw = 11 * Math.sin(Math.PI * Math.min(1, (1 - t) * 0.8 + 0.2)) * Math.pow(1 - t, 0.55);
    pts.push([cx - hw + sway * t * t * 4, 34 - t * 32]);
  }
  s.poly(pts, 'f', { glow: true, flat: 0.45 });
  s.ellipse(cx + sway * 0.4, 25, 7, 9, 'f', { glow: true, flat: 0.7 });
  s.ellipse(cx + sway * 0.2, 28, 3.6, 5, 'f', { glow: true, flat: 0.95 });
  for (const [x, y] of f % 2 ? [[-7, 6], [6, 2]] : [[5, 8], [-5, 3]]) s.dot(cx + x, y, 0.9, 0xffd070);
  return s.render();
}

export function hiroshimaEnemies(add) {
  for (let f = 0; f < 4; f++) {
    add(`tsuru_${f}`, tsuru(f));
    add(`shamoji_${f}`, shamoji(f));
    for (const c of ['red', 'blue', 'green', 'purple']) add(`manju_${c}_${f}`, manju(c, f));
    add(`heike_${f}`, crab(f)); // the taka-ashi-gani, crab540.mjs
    add(`brazier_${f}`, brazier(f));
  }
  for (let f = 0; f < 3; f++) add(`kaki_${f}`, kaki(f));
  add('heike_guard', crab('guard'));
  // step 2a: phase 2's cracked shell (PĘKNIĘTY PANCERZ): the same crab, its carapace split from a blow
  for (let f = 0; f < 4; f++) add(`heike_${f}_c`, crackedShell(crab(f)));
  add('heike_guard_c', crackedShell(crab('guard')));
  add('hidoro_base', hidoroBase(false));
  add('hidoro_wreck', hidoroBase(true));
  for (let i = 0; i < 16; i++) add(`hidoro_head_${i}`, hidoroHead(i));
  for (const p of ['0', '1', '2', '3', 'fan_l', 'fan_r']) add(`sankibo_${p}`, sankibo540(p)); // tengu540.mjs
  for (const p of ['fan_up_l', 'fan_up_r']) add(`sankibo_${p}`, sankibo540(p)); // step 2a: the wind-up before a sweep
}
export const HIROSHIMA_PORTRAITS = ['heike_0', 'sankibo_0', 'brazier_0'];
