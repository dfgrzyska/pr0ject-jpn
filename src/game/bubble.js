import { hue } from './premiumFx.js';

/**
 * The bubble the wing turrets keep round the ship, on a Graphics: at (cx, cy), r across its half; gold with two
 * turrets, flashing (0..1) after it took a hit. `shield`: its colours out of the gachapon ({ one, two }: a fill
 * and a rim each, or { cycle }: round the rainbow); `shape`: its shape (a honeycomb's cell, an octagon, a star, a
 * lotus, a paper parasol, a ring of talismans; else the plain bubble). The game draws it (Player) and so does the
 * hangar's stage.
 */
export function drawBubble(g, cx, cy, r, t, { gold = false, flash = 0, shield = null, shape = null } = {}) {
  const [col, edge] = shield?.cycle ? [hue((t * 0.35) % 1, gold ? 0.75 : 0.55), 0xffffff] : shield ? (gold ? shield.two : shield.one) : gold ? [0xffd860, 0xfff0b0] : [0x6ab8ff, 0xa8dcff];
  const fillA = (gold ? 0.16 : 0.12) + flash * 0.25;
  const lineA = (gold ? 0.75 : 0.55) + flash * 0.25;
  g.fillStyle(col, fillA);
  g.lineStyle(1, edge, lineA);
  const ring = (n, k, turn) => Array.from({ length: n }, (_, i) => {
    const a = turn + (i / n) * Math.PI * 2;
    const q = Array.isArray(k) ? k[i % k.length] : k;
    return { x: cx + Math.cos(a) * r * q, y: cy + Math.sin(a) * r * 0.9 * q };
  });
  if (shape === 'hex' || shape === 'oct' || shape === 'star') {
    const pts = shape === 'hex' ? ring(6, 1.08, t * 0.5) : shape === 'oct' ? ring(8, 1.05, -t * 0.4) : ring(16, [1.14, 0.88], t * 0.6);
    g.fillPoints(pts, true);
    g.strokePoints(pts, true);
    if (shape !== 'star') g.lineStyle(1, edge, lineA * 0.4).strokePoints(shape === 'hex' ? ring(6, 0.8, t * 0.5) : ring(8, 0.8, -t * 0.4), true);
  } else if (shape === 'lotus') {
    for (const p of ring(8, 0.62, t * 0.35)) {
      g.fillEllipse(p.x, p.y, r * 0.86, r * 0.8);
      g.strokeEllipse(p.x, p.y, r * 0.86, r * 0.8);
    }
  } else {
    g.fillEllipse(cx, cy, r * 2, r * 1.8);
    g.strokeEllipse(cx, cy, r * 2, r * 1.8);
    if (shape === 'wagasa') {
      // the parasol's ribs turning, its hub
      g.lineStyle(1, edge, lineA * 0.55);
      for (const p of ring(12, 1, t * 0.7)) g.lineBetween(cx, cy, p.x, p.y);
      g.strokeEllipse(cx, cy, r * 1.3, r * 1.17);
    } else if (shape === 'ofuda') {
      // paper talismans going round on the rim, a red sign on each
      for (const p of ring(8, 1, t * 0.9)) {
        g.fillStyle(0xfff4e0, Math.min(1, lineA + 0.25)).fillRect(p.x - 1.5, p.y - 3, 3, 6);
        g.fillStyle(0xd2361f, Math.min(1, lineA + 0.25)).fillRect(p.x - 0.5, p.y - 1.5, 1, 3);
      }
    }
  }
  // a highlight sliding round the bubble (a bright glint on the gold one)
  const a = t * (gold ? 2.6 : 1.4);
  g.fillStyle(0xffffff, gold ? 0.8 : 0.45);
  g.fillCircle(cx + Math.cos(a) * r * 0.72, cy + Math.sin(a) * r * 0.64, gold ? 1.3 : 1);
}
