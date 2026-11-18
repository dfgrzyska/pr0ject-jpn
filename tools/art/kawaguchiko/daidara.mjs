// DAIDARABOTCHI, Kawaguchiko's boss (docs/plan-kawaguchiko.md, 6.2 and phases 12-13): the giant of the old tales
// who dug the earth and heaped it into Fuji, the hollows he left filling with water. Our own design: a giant of
// earth and stone, overgrown with moss and autumn's rusty grass, red maples and a pine or two on his shoulders like
// a hillside, his eyes two little lakes with the sky in them, a cave of a mouth, great hands of stone. He stands
// waist-deep in the lake in front of the mountain, facing us (the panorama is seen from the side). His tools: a
// carrying pole over his shoulder and a great woven basket for earth (mokko) on ropes. Nothing see-through, no glow
// of the forest: he must not recall the forest spirits of well-known films.
//
// Phase 12 starts with the design: three poses for the author (digging, with the basket, a silhouette against the
// setting sun). Size: 360 x 300 fine pixels (120 x 100 in the game), his waist at the frame's foot.
import { HiSprite, tones, speckle, mottle, mix2, fur } from '../../lib/hisprite.mjs';
import { Raster } from '../../lib/raster.mjs';

export const DW = 360;
export const DH = 300;
const CX = DW / 2;
const RAMPS = {
  e: tones([0x3a2618, 0x6a4a30, 0x9a7650]), // earth
  E: tones([0x4a4844, 0x7e7a72, 0xb4aea2]), // stone
  g: tones([0x2e3a1e, 0x52602e, 0x82904a]), // moss
  y: tones([0x5a3a18, 0x9a6a2a, 0xd8a050]), // autumn grass, rusty
  r: tones([0x5a1410, 0xb8301e, 0xf06a3a]), // maple
  p: tones([0x14281c, 0x24442c, 0x3e6a40]), // pine
  b: tones([0x2a4a7a, 0x6a9ad0, 0xd8ecff]), // his eyes: water with the sky in it
  s: tones([0x6a5228, 0xb8944a, 0xe8cc88]), // straw of the basket
  w: tones([0x3a2414, 0x6a4628, 0xa0744a]), // the pole
};
const earthPat = () => ({ pat: mix2(mottle({ amt: 0.22, scale: 9, seed: 3 }), speckle({ amt: 0.18, dark: 0.1, light: 0.05, seed: 4 })) });
const stonePat = () => ({ pat: mix2(mottle({ amt: 0.18, scale: 5, seed: 7 }), speckle({ amt: 0.25, dark: 0.12, light: 0.08, seed: 8 })) });

/** Moss, grass and stones laid over a part of him, along an ellipse's upper side (where things grow and settle). */
function overgrow(s, cx, cy, rx, ry, seed) {
  let h = seed;
  const rnd = () => ((h = (h * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < (rx * ry) / 45; k++) {
    const a = Math.PI + rnd() * Math.PI; // (the upper half)
    const r = Math.sqrt(rnd());
    const [x, y] = [cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r];
    const v = rnd();
    if (v < 0.22) s.ellipse(x, y, 3 + rnd() * 5, 2 + rnd() * 2.5, 'g', { bias: -0.05, pat: mottle({ amt: 0.2, scale: 2, seed: k }) });
    else if (v < 0.78) for (let i = 0; i < 5; i++) s.line(x + i - 2, y, x + i - 2 + (rnd() - 0.5) * 3, y - 3 - rnd() * 4, [0xd8a050, 0x9a6a2a, 0xb8843a][i % 3], 1);
    else s.ellipse(x, y, 3 + rnd() * 4, 2.4 + rnd() * 3, 'E', { bias: 0.08, ...stonePat() });
  }
}
/** A small tree on him: a maple (red), or a pine. */
function treeOn(s, x, y, r, kind) {
  s.line(x, y, x, y + r * 0.8, 0x3a2414, 2);
  const mat = kind === 'pine' ? 'p' : 'r';
  for (const [dx, dy, k] of [[0, -r * 0.4, 1], [-r * 0.5, 0, 0.75], [r * 0.5, 0, 0.75], [0, r * 0.2, 0.8]]) s.ellipse(x + dx, y + dy, r * k, r * k * 0.85, mat, { bias: 0.06, pat: mottle({ amt: 0.25, scale: 2, seed: x | 0 }) });
}

/** His trunk, shoulders and head: a hill of a body. */
function body(s, { lean = 0 } = {}) {
  // the trunk rising out of the water, wide as a hill
  s.paint([CX - 120, 120, CX + 120, DH], (x, y) => {
    const t = (y - 120) / (DH - 120);
    return Math.abs(x - CX - lean * (1 - t)) < 78 + t * 30 + Math.sin(y * 0.08) * 3;
  }, 'e', (x, y) => 0.32 + 0.5 * Math.max(0, 1 - Math.hypot(x - CX + 40, y - 150) / 150), earthPat());
  // the shoulders: two rounded hills, stone showing through on the left (lit) one
  for (const sx of [-1, 1]) s.ellipse(CX + sx * 72 + lean, 138, 54, 36, 'e', { bias: 0.04, ...earthPat() });
  s.ellipse(CX - 92 + lean, 132, 18, 12, 'E', { bias: 0.1, ...stonePat() });
  // the chest: two slabs of rock either side of a seam, the seam a dark fissure (where he will crack open)
  for (const sx of [-1, 1]) s.poly([[CX + lean + sx * 4, 166], [CX + lean + sx * 44, 172], [CX + lean + sx * 40, 214], [CX + lean + sx * 6, 222]], 'E', { ball: [CX + lean - 20, 170, 80, 60], ...stonePat() });
  s.paint([CX + lean - 6, 160, CX + lean + 6, 226], (x, y) => Math.abs(x - CX - lean - Math.sin(y * 0.3) * 2) < 1.6 + Math.sin(((y - 160) / 66) * Math.PI) * 1.4, 'K', () => 0.15);
  overgrow(s, CX + lean, 210, 100, 60, 11);
  overgrow(s, CX - 72 + lean, 140, 50, 30, 23);
  overgrow(s, CX + 72 + lean, 140, 50, 30, 37);
  // the head: a smaller hill sunk between the shoulders, a brow of rock, the lake-eyes, a cave of a mouth
  const hx = CX + lean * 1.2;
  s.ellipse(hx, 104, 44, 40, 'e', { bias: 0.05, ...earthPat() });
  s.ellipse(hx, 84, 40, 14, 'E', { bias: 0.1, ...stonePat() }); // the brow
  overgrow(s, hx, 82, 40, 24, 51);
  return hx;
}
/** The eyes: two little lakes, the sky in them, reeds at their edge; shut (a line of reeds) when blinking. */
function eyes(s, hx, { shut = false, glow = false } = {}) {
  for (const sx of [-1, 1]) {
    const [x, y] = [hx + sx * 17, 104];
    if (shut) {
      s.line(x - 9, y, x + 9, y + 1, 0x2a1a10, 2);
      for (let i = -8; i <= 8; i += 3) s.line(x + i, y, x + i + 1, y - 4, 0x82904a, 1);
      continue;
    }
    s.ellipse(x, y, 10, 7, 'b', { bias: -0.05, glow });
    s.ellipse(x - 2, y - 2, 4, 1.8, 'W', { flat: 0.95, glow: true }); // the sky's light on the water
    for (let i = -9; i <= 9; i += 3) s.line(x + i, y + 6, x + i + (i % 2), y + 2, 0x52602e, 1); // reeds round its shore
  }
  // the mouth, a low cave under them, dark inside
  s.ellipse(hx, 126, 14, 6, 'K', { flat: 0.18 });
  s.line(hx - 14, 123, hx + 14, 123, 0x5a4a3a, 1);
}
/** An arm of earth from the shoulder to a hand of stone (fingers spread or cupped round a clod). */
function arm(s, x0, y0, x1, y1, { cup = false, clod = false } = {}) {
  s.tube(x0, y0, x1, y1, 22, 'e', { rb: 16, ...earthPat() });
  overgrow(s, (x0 + x1) / 2, (y0 + y1) / 2 - 6, 18, 12, (x0 * 3) | 0);
  s.ellipse(x1, y1 + 8, 24, 18, 'E', { bias: 0.04, ...stonePat() });
  for (let k = -2; k <= 1; k++) s.tube(x1 + k * 10 + 4, y1 + 16, x1 + k * 11 + 4, y1 + (cup ? 26 : 34), 5, 'E', { rb: 4, ...stonePat() }); // the fingers
  s.tube(x1 + (x1 < CX ? 22 : -22), y1 + 4, x1 + (x1 < CX ? 30 : -30), y1 + 14, 5, 'E', { rb: 4 }); // the thumb
  if (clod) {
    s.ellipse(x1, y1 + 10, 20, 12, 'e', { bias: 0.06, ...earthPat() });
    overgrow(s, x1, y1 + 8, 18, 10, (y1 * 7) | 0);
    for (let k = 0; k < 6; k++) s.ellipse(x1 - 14 + k * 6, y1 + 26 + (k % 3) * 6, 1.6, 2.4, 'b', { flat: 0.7 }); // water running off it
  }
}
/** The basket for earth (mokko): woven straw, heaped with earth, hung by four ropes; `gold`: the ropes lit. */
function basket(s, x, y, ropeTop, { gold = false } = {}) {
  for (const dx of [-22, -8, 8, 22]) s.line(x + dx, y - 12, ropeTop[0] + dx * 0.15, ropeTop[1], gold ? 0xffd84a : 0xb8944a, gold ? 3 : 2);
  s.poly([[x - 32, y - 12], [x + 32, y - 12], [x + 24, y + 22], [x - 24, y + 22]], 's', { flat: 0.6, pat: speckle({ amt: 0.12 }) });
  for (let i = -30; i <= 30; i += 6) s.line(x + i, y - 12, x + i * 0.8, y + 22, 0x6a5228, 1, 0.8); // the weave
  for (let j = -6; j <= 18; j += 6) s.line(x - 30 + j * 0.2, y + j, x + 30 - j * 0.2, y + j, 0x8a6a34, 1, 0.6);
  s.ellipse(x, y - 14, 30, 9, 'e', { bias: 0.06, ...earthPat() }); // heaped with earth
  overgrow(s, x, y - 16, 26, 7, 77);
}

/** One of the three poses: 'dig' (both hands scooping), 'basket' (the pole on his shoulder), 'dusk' (a silhouette). */
export function daidara(pose) {
  const s = new HiSprite(DW, DH, RAMPS);
  if (pose === 'basket') {
    // the pole over his right shoulder (our left), the basket hanging from its far end, swinging out
    s.tube(CX - 168, 118, CX + 40, 112, 4.5, 'w', { bias: 0.05 });
    basket(s, CX - 146, 200, [CX - 156, 120], { gold: true });
    arm(s, CX + 92, 150, CX + 120, 236);
  } else arm(s, CX - 92, 150, CX - 130, 226, { cup: true, clod: pose !== 'basket' });
  const hx = body(s, { lean: pose === 'dig' ? -6 : 0 });
  if (pose === 'basket') {
    arm(s, CX - 84, 150, CX - 96, 120); // his hand up on the pole, by his shoulder
  } else {
    arm(s, CX + 92, 150, CX + 130, 226, { cup: true, clod: true });
  }
  // trees on his shoulders: maples aflame, a pine
  for (const [x, y, r, k] of [[CX - 104, 118, 10, 'maple'], [CX - 84, 108, 8, 'maple'], [CX + 78, 112, 9, 'pine'], [CX + 100, 120, 11, 'maple'], [CX + 60, 118, 7, 'maple']]) treeOn(s, x, y, r, k);
  eyes(s, hx, { glow: pose === 'dusk' });
  // the water at his waist: a ring of ripples and foam
  for (let x = 20; x < DW - 20; x += 2) s.px(x, DH - 4 + Math.sin(x * 0.2) * 1.5, 0xd8ecff, 0.8);
  const out = s.render({ outline: 3 });
  return pose === 'dusk' ? silhouette(out) : out;
}

/** Against the setting sun: the whole of him dark violet, a burning rim on the side the sun is (the right), his eyes
 * still holding the sky's light. */
function silhouette(r) {
  const o = new Raster(r.w, r.h);
  const a = (x, y) => (x < 0 || y < 0 || x >= r.w || y >= r.h ? 0 : r.data[(y * r.w + x) * 4 + 3]);
  for (let y = 0; y < r.h; y++)
    for (let x = 0; x < r.w; x++) {
      const i = (y * r.w + x) * 4;
      if (!r.data[i + 3]) continue;
      const [R, G, B] = [r.data[i], r.data[i + 1], r.data[i + 2]];
      const eye = B > 160 && B > R + 40; // (the lake-eyes keep their light)
      let rim = 0;
      for (let k = 1; k <= 4; k++) if (!a(x + k, y) || !a(x + k, y - k)) { rim = 1 - (k - 1) / 4; break; }
      const lum = (R + G + B) / 765;
      let c = [38 + lum * 30, 26 + lum * 20, 54 + lum * 30];
      if (eye) c = [R * 0.9, G * 0.85, B];
      if (rim) c = c.map((v, k) => v + ([255, 150, 70][k] - v) * rim * 0.95);
      o.setRGBA(x, y, c[0], c[1], c[2], 255);
    }
  return o;
}
