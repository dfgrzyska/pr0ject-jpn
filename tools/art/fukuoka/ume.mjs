// Plum trees in flower seen from above (docs/plan-fukuoka.md, 4.1): unlike a cherry's cloud of blossom, a plum's crown
// is open - dark, crooked boughs reaching out from a short trunk, the flowers sitting on the twigs as dots - so the
// branches show through. Three colours (white, pink, a deep red), a weeping one whose twigs hang down in curtains, old
// ones with their boughs propped on wooden crutches, and the petals fallen on the moss under them.
import { shade } from '../tokyo/kit.mjs';
import { hashPx } from '../hires.mjs';

export const UME = {
  white: [0xf4f2ee, 0xe8e2e4, 0xffffff],
  pink: [0xf4b8cc, 0xe898b4, 0xfad0dc],
  red: [0xd8406a, 0xc02a58, 0xe8607e],
};

/** ume(kit)(x, u, r, colour, { weeping, old, petals, bloom }) - queues the tree at (x, u), r across its crown (logical);
 * bloom 0..1: how far into full flower (Dazaifu's groves at their best: 1). */
export function umeKit(kit, S = 3) {
  const { P, FX, FY, queue, hi } = kit;
  return (x, u, r, colour = 'white', { weeping = false, old = false, petals = true, seed = 0, bloom = 0 } = {}) => {
    const [cx, cy] = [FX(x), FY(u)];
    const s = seed || Math.floor(hashPx(cx, cy, 77) * 1e6);
    const h = (a, b) => hashPx(cx + a, cy + b, s);
    const R = Math.round(r * S);
    const pal = UME[colour];
    // the boughs: a few crooked lines out from the trunk, each forking once or twice
    const segs = [];
    const bough = (x0, y0, ang, len, depth) => {
      let [px, py] = [x0, y0];
      for (let t = 0; t < len; t++) {
        ang += (h(t * 7 + depth, len) - 0.5) * 0.7; // (crooked)
        const [nx, ny] = [px + Math.cos(ang), py + Math.sin(ang)];
        segs.push([Math.round(nx), Math.round(ny), depth, t / len]);
        [px, py] = [nx, ny];
        if (depth < 2 && t > len * 0.4 && h(t, depth * 13) < 0.09) bough(px, py, ang + (h(t, 3) < 0.5 ? -0.8 : 0.8), len * 0.55, depth + 1);
      }
    };
    const n = 4 + Math.floor(h(1, 1) * 3);
    for (let k = 0; k < n; k++) bough(cx, cy, (k / n) * Math.PI * 2 + h(k, 2) * 0.8, R * (0.75 + h(k, 5) * 0.35), 0);
    queue(cy + R * 0.5, () => {
      if (petals)
        for (let k = 0; k < R * R * (0.5 + bloom * 0.4); k++) {
          const [a, d] = [h(k, 31) * Math.PI * 2, Math.sqrt(h(k, 32)) * R * 1.15];
          P(cx + Math.round(Math.cos(a) * d), cy + Math.round(Math.sin(a) * d) + 2, pal[k % 3]); // fallen petals on the moss
        }
      for (const [X, Y, depth] of segs) {
        const c = depth === 0 ? 0x3a2a24 : depth === 1 ? 0x4a3830 : 0x5a463a;
        P(X, Y, c);
        if (depth === 0) P(X + 1, Y, 0x2a1e1a);
      }
      // the flowers along the twigs, thicker towards their ends; a weeping tree's twigs hang down in curtains
      for (const [X, Y, depth, t] of segs) {
        if (h(X, Y) > 0.45 + t * 0.55 + bloom * 0.3) continue;
        const c = pal[Math.floor(h(Y, X) * 3)];
        // a cluster of two or three flowers on the twig, the lit side up and left
        P(X + (h(X, 1) < 0.5 ? 1 : -1), Y + (h(Y, 1) < 0.5 ? 1 : -1), c);
        P(X - 1, Y - 1, shade(c, 1.06));
        if (t > 0.35) P(X + 1, Y, shade(c, 0.9));
        if (t > 0.5) P(X, Y - 1, shade(c, 0.95));
        if (depth > 0 && t > 0.6) P(X, Y + 1, shade(c, 0.85));
        if (bloom && t > 0.3 && h(X, Y + 7) < bloom * 0.6) { P(X + 2, Y - 1, c); P(X - 1, Y + 2, shade(c, 0.92)); } // in full flower: more along every twig
        if (weeping && t > 0.6 && h(X, Y + 3) < 0.35) for (let d = 1; d < 4 + h(X, 9) * 4; d++) P(X, Y + d, d % 2 ? c : 0x5a463a);
      }
      // the trunk, and an old tree's crutches: poles propping its longest boughs
      for (let j = -2; j <= 1; j++) for (let i = -1; i <= 1; i++) P(cx + i, cy + j, i < 0 ? 0x4a362c : 0x2a1e1a);
      if (old)
        for (let k = 0; k < 2; k++) {
          const [X, Y] = segs[Math.floor(h(k, 41) * segs.length)];
          for (let d = 0; d < 4; d++) P(X + d, Y + 1 + d, 0x9a7a52);
        }
    }, () => {
      for (const [X, Y] of segs) if (h(X, Y + 1) < 0.5) hi.tint(X + 3, Y + 3, 0.8);
    });
  };
}
