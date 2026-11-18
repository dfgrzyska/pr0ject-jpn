// Kawaguchiko's enemies at 540 px (docs/plan-kawaguchiko.md, section 5 and phase 9): the red dragonflies of autumn,
// akatombo, in swarms; a largemouth bass, the anglers' fish of the lake, leaping in its arc; kasagumo, the cap
// cloud that settles on Fuji's summit, as a sleepy spirit that spits drops; a pilgrims' wooden wayside shrine whose
// round bronze mirror turns to the ship and flashes; strings of persimmons drying (hoshigaki), carrying a charm in
// the colour of their power. Seen from above like every city's, drawn with HiSprite (tools/lib/hisprite.mjs).
import { HiSprite, tones, speckle, mottle, mix2, fur } from '../../lib/hisprite.mjs';

const INK = 0x14101c;
const TAU = Math.PI * 2;
const RAMPS = {
  r: tones([0x7a1410, 0xd0321e, 0xff7a4a]), // the dragonfly's red
  g: tones([0x2a3a1a, 0x5a6a2e, 0x9aa858]), // the bass's olive back
  b: tones([0x8a8a70, 0xd8d8c0, 0xfffff0]), // its pale belly
  c: tones([0x8a7aa0, 0xe4dcef, 0xffffff]), // cloud, lit pink-white by the low sun
  w: tones([0x4a2e18, 0x8a5a32, 0xc8925a]), // weathered wood
  m: tones([0x6a4a1a, 0xc8a050, 0xfff0b0]), // the bronze mirror
  k: tones([0x7a2a0a, 0xd8601a, 0xffa858]), // persimmon, drying
  s: tones([0x6a5a30, 0xb8a060, 0xe8d8a0]), // straw rope
  t: tones([0x3a3a40, 0x6a6a74, 0xa8a8b4]), // the shrine's roof, its copper gone dark
};
const FILL = { red: 0xd8203a, blue: 0x3a72f0, green: 0x37b35a, purple: 0x9c50f0 };

// ---------------------------------------------------------------- popcorn: akatombo, a red dragonfly (45 x 45), its four wings beating
export function tombo(f) {
  const s = new HiSprite(45, 45, { ...RAMPS, v: tones([0x7a8a9a, 0xc8d8e4, 0xf4fbff]) });
  const cx = 22.5;
  // the wings, long and narrow, glassy, veined, a dark spot near each tip; up and down by turns (foreshortened)
  const beat = [1, 0.78, 0.55, 0.78][f];
  for (const [y, len, w, lean] of [[17, 20, 2.8, -1.2], [22, 18, 3.2, 1.4]])
    for (const sx of [-1, 1]) {
      const tip = cx + sx * len * beat;
      s.paint([Math.min(cx, tip) - 1, y - w - 4, Math.max(cx, tip) + 1, y + w + 4], (x, yy) => {
        const t = ((x - cx) * sx) / (len * beat);
        if (t < 0.06 || t > 1) return false;
        return Math.abs(yy - y - t * lean) < w * Math.sin(Math.PI * Math.min(1, t * 1.05 + 0.12));
      }, 'v', (x) => 0.6 + 0.3 * (1 - Math.abs(x - cx) / 22));
      s.line(cx + sx * 2, y, tip - sx, y + lean, 0x5a6a7a, 1, 0.7); // the leading vein
      for (let k = 1; k < 4; k++) s.line(cx + sx * (2 + k * 4), y - 1, cx + sx * (4 + k * 4), y + 1.6, 0x8a9aaa, 1, 0.4);
      s.dot(tip - sx * 3, y + lean * 0.9, 1.1, 0x5a2a18, 0.85); // the pterostigma
    }
  // the body: big eyes at the bottom (it flies down the screen), the thorax, the long red abdomen in segments
  s.ellipse(cx, 24, 3.6, 5, 'r', { bias: 0.04 });
  for (const sx of [-1, 1]) s.ellipse(cx + sx * 2.4, 31, 2.6, 2.6, 'r', { bias: 0.18 });
  s.tube(cx, 19, cx, 1.5, 2.3, 'r', { rb: 1.6 });
  for (let y = 4; y < 18; y += 2.6) s.line(cx - 1.8, y, cx + 1.8, y, 0x6a1008, 1, 0.8);
  for (const sx of [-1, 1]) s.dot(cx + sx * 2.6, 31.6, 0.9, 0x3a0a0a);
  return s.render();
}

// ---------------------------------------------------------------- diver: a largemouth bass (45 x 66), leaping out of the lake head first
export function bass(f) {
  const s = new HiSprite(45, 66, RAMPS);
  const cx = 22.5;
  const flick = [0, 3, 0, -3][f];
  const scales = { pat: mix2(speckle({ amt: 0.18, dark: 0.08, light: 0.05, seed: 3 }), fur(Math.PI / 2, { amt: 0.08, len: 3, seed: 4 })) };
  // the tail fin and the soft dorsal, then the body: olive back, the dark band along its flank, a pale belly
  s.poly([[cx, 12], [cx - 9 + flick, 1], [cx + 9 + flick, 1]], 'g', { flat: 0.5 });
  for (let k = -3; k <= 3; k++) s.line(cx, 12, cx + k * 2.4 + flick, 2, 0x2a3a1a, 1, 0.6);
  s.paint([4, 8, 41, 60], (x, y) => {
    const t = (y - 10) / 48;
    if (t < 0 || t > 1) return false;
    const w = 4 + 13 * Math.sin(Math.PI * Math.min(1, t * 0.9 + 0.12)) + (t > 0.8 ? -(t - 0.8) * 20 : 0);
    return Math.abs(x - cx - Math.sin(t * 3 + 1) * flick * 0.3 * (1 - t)) < w;
  }, 'g', (x, y) => 0.32 + 0.55 * Math.max(0, 1 - Math.abs(x - cx + 4) / 16), scales);
  s.shade([4, 8, 41, 60], (x, y) => Math.abs(x - cx) < 3 + Math.sin(y * 0.7) * 1.4 && y > 16 && y < 50, -0.22); // the lateral band
  for (const sx of [-1, 1]) {
    s.poly([[cx + sx * 10, 36], [cx + sx * 20, 40 + f % 2], [cx + sx * 12, 44]], 'g', { flat: 0.45 }); // pectoral fins
    s.ellipse(cx + sx * 9.5, 48, 3, 3.2, 'b', { bias: 0.1 }); // its cheeks, pale
  }
  // the head, the great mouth gaping (it is a largemouth), the eye
  s.ellipse(cx, 54, 9.5, 7, 'g', { bias: 0.04, ...scales });
  s.ellipse(cx, 61, 7.5, 4.2, 'b', { flat: 0.5 });
  s.ellipse(cx, 61.5, 5.6, 2.6 + (f % 2), 'K', { flat: 0.2 });
  for (const sx of [-1, 1]) {
    s.dot(cx + sx * 6.6, 52, 2.2, 0xe8c840);
    s.dot(cx + sx * 6.6, 52.2, 1.2, INK);
  }
  // water shed off it
  for (const [x, y] of [[cx - 15, 20], [cx + 16, 26], [cx - 17, 40], [cx + 15, 54]]) s.dot(x + flick * 0.5, y, 1.2, 0xd8f0ff, 0.8);
  return s.render();
}

// ---------------------------------------------------------------- shooter: kasagumo, the cap cloud (66 x 51), drowsy, puffing, spitting a drop
export function kasagumo(f) {
  const s = new HiSprite(66, 51, RAMPS);
  const cx = 33;
  const puff = [0, 1, 2, 1][f];
  const soft = { pat: mottle({ amt: 0.12, scale: 5, seed: 7 }) };
  // the lens of layered cloud, each layer a lit rim over a violet shadow, like a stack of hats
  for (const [y, rx, ry] of [[34, 30 + puff, 9], [26, 26 + puff, 9], [18, 19 + puff, 8], [12, 11, 5]])
    s.ellipse(cx, y, rx, ry, 'c', { bias: 0.05, ...soft });
  for (const [y, rx] of [[34, 30], [26, 26], [18, 19]]) for (let x = -rx + 3; x <= rx - 3; x++) s.px(cx + x + puff * 0, y + 6.5 - Math.abs(x) * 0.08, 0x8a7aa0, 0.5);
  // its face: heavy-lidded eyes, rosy cheeks, the mouth a little O when it spits
  for (const sx of [-1, 1]) {
    if (f === 2) s.line(cx + sx * 8 - 2.5, 26, cx + sx * 8 + 2.5, 26, INK, 1.5);
    else {
      s.ellipse(cx + sx * 8, 26, 2.6, 2.2, 'K', { flat: 0.2 });
      s.line(cx + sx * 8 - 3, 24.4, cx + sx * 8 + 3, 24.4, 0x8a7aa0, 1.5); // the drooping lid
      s.dot(cx + sx * 8 - 0.8, 25.6, 0.7, 0xffffff);
    }
    s.ellipse(cx + sx * 13, 30, 3, 1.6, 'c', { flat: 0.95 });
    s.dot(cx + sx * 13, 30, 1.4, 0xf0a0b0, 0.6);
  }
  if (f === 3) {
    s.ellipse(cx, 33, 2.4, 2.4, 'K', { flat: 0.2 });
    s.ellipse(cx, 40, 2, 3, 'c', { flat: 0.85, glow: true }); // the drop on its way
    s.dot(cx, 41, 1.2, 0x9ad0ff);
  } else s.line(cx - 2, 33, cx + 2, 33, 0x6a5a80, 1);
  return s.render();
}

// ---------------------------------------------------------------- carrier: a string of persimmons drying (45 x 66), a charm of its colour
export function hoshigaki(color, f) {
  const s = new HiSprite(45, 66, RAMPS);
  const cx = 22.5;
  const sway = [0, 1.2, 0, -1.2][f];
  // the straw rope from its knot at the top, the fruit hung by their stalks, peeled, wrinkled, dark orange
  s.tube(cx, 2, cx + sway, 52, 1.2, 's');
  s.ellipse(cx, 4, 3, 2.4, 's', { bias: 0.05 });
  for (let k = 0; k < 4; k++) {
    const y = 12 + k * 11;
    const x = cx + sway * (y / 52) + (k % 2 ? 6 : -6);
    s.line(cx + sway * (y / 52), y - 2, x, y - 1, 0x6a4a1a, 1);
    s.ellipse(x, y + 3, 5.4, 6.2, 'k', { bias: 0.04, pat: mix2(mottle({ amt: 0.18, scale: 2, seed: k + 3 }), speckle({ amt: 0.12, dark: 0.1, seed: k })) });
    s.poly([[x - 2.4, y - 2.8], [x + 2.4, y - 2.8], [x, y - 1]], 'g', { flat: 0.4 }); // the calyx
    s.dot(x - 1.8, y + 1, 1, 0xffd8a0, 0.7);
  }
  // the charm at its foot: a paper disc in the power's colour, glowing, on a red cord
  s.line(cx + sway, 52, cx + sway, 56, 0xc8302a, 1);
  s.dot(cx + sway, 60, 5, FILL[color]);
  s.dot(cx + sway, 60, 3.2 + (f % 2) * 0.6, 0xffffff, 0.5);
  s.ellipse(cx + sway, 60, 5, 5, 'W', { flat: 0.9, glow: true });
  s.dot(cx + sway, 60, 4, FILL[color]);
  s.dot(cx + sway - 1.4, 58.6, 1.2, 0xffffff, 0.8);
  return s.render();
}

// ---------------------------------------------------------------- turret: a pilgrims' wayside shrine (base 57 x 57) and its mirror (head 51 x 51)
export function hokoraBase(wreck) {
  const s = new HiSprite(57, 57, RAMPS);
  const c = 28.5;
  const grain = { pat: mix2(fur(0, { amt: 0.14, len: 10, seed: 3 }), speckle({ amt: 0.1, seed: 5 })) };
  // the stone footing, the little gabled roof of dark copper seen from above, a straw rope with papers under its eave
  s.poly([[6, 10], [51, 10], [51, 50], [6, 50]], 'E', { flat: 0.45, tex: 0.3 });
  if (wreck) {
    s.poly([[10, 16], [47, 20], [44, 46], [12, 42]], 'w', { flat: 0.35, ...grain });
    for (const [x0, y0, x1, y1] of [[12, 18], [44, 22], [20, 44], [40, 40]].map(([x, y]) => [x, y, c, c])) s.line(x0, y0, x1, y1, INK, 2);
    for (const [x, y] of [[18, 26], [36, 30], [26, 38], [31, 21]]) s.poly([[x, y], [x + 4, y + 1], [x + 1, y + 4]], 'm', { flat: 0.85 }); // the mirror in shards
    return s.render();
  }
  s.poly([[9, 13], [48, 13], [48, 47], [9, 47]], 't', { flat: 0.5, pat: speckle({ amt: 0.16, seed: 9 }) });
  s.poly([[9, 13], [28.5, 13], [28.5, 47], [9, 47]], 't', { flat: 0.68, pat: speckle({ amt: 0.16, seed: 9 }) }); // the slope to the light
  s.line(c, 12, c, 48, 0x22242a, 2); // the ridge
  for (let x = 11; x < 47; x += 4) s.line(x, 47, x + 1, 51, 0xe8e4d8, 1); // the papers hanging from the rope
  s.line(9, 47.5, 48, 47.5, 0xb8a060, 1.5);
  for (const [x, y] of [[13, 16], [44, 44]]) s.dot(x, y, 1.6, 0x4a7a4a, 0.8); // lichen
  return s.render({ outline: 2 });
}

export function hokoraHead(i) {
  const s = new HiSprite(51, 51, RAMPS);
  const c = 25.5;
  const a = (i / 16) * TAU;
  const dx = -Math.sin(a);
  const dy = Math.cos(a);
  // the round bronze mirror on its wooden stand, its face turned towards the ship; a lit crescent on the face
  s.tube(c - dx * 6, c - dy * 6, c + dx * 4, c + dy * 4, 3, 'w', { rb: 2.4 });
  const [mx, my] = [c + dx * 7, c + dy * 7];
  s.ellipse(mx, my, 11, 11, 'm', { bias: 0.05 });
  s.ellipse(mx, my, 8, 8, 'm', { flat: 0.92, glow: true });
  s.paint([mx - 8, my - 8, mx + 8, my + 8], (x, y) => Math.hypot(x - mx, y - my) < 8 && (x - mx) * dx + (y - my) * dy > 2.5, 'W', () => 0.95, { glow: true });
  for (let k = 0; k < 12; k++) {
    const b = (k / 12) * TAU;
    s.px(mx + Math.cos(b) * 10, my + Math.sin(b) * 10, 0x6a4a1a); // the cast rim's pattern
  }
  return s.render();
}

/** Every frame, under the names the skins use (src/game/skins.js: kawaguchiko). */
export function kawaguchikoEnemies(add) {
  for (let f = 0; f < 4; f++) {
    add(`k_tombo_${f}`, tombo(f));
    add(`k_bass_${f}`, bass(f));
    add(`k_kasagumo_${f}`, kasagumo(f));
    for (const c of ['red', 'blue', 'green', 'purple']) add(`k_hoshigaki_${c}_${f}`, hoshigaki(c, f));
  }
  add('k_hokora_base', hokoraBase(false));
  add('k_hokora_wreck', hokoraBase(true));
  for (let i = 0; i < 16; i++) add(`k_hokora_head_${i}`, hokoraHead(i));
}
export const KAWAGUCHIKO_PORTRAITS = [];
