// Logical game coordinates, independent of render scale and frame rate.
export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
export const mix = (a, b, t) => a + (b - a) * t;
export function segmentDistance(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1), 0, 1);
  return Math.hypot(p.x - a.x - dx * t, p.y - a.y - dy * t);
}
export function quadratic(a, control, b, t) {
  const u = 1 - t;
  return { x: u * u * a.x + 2 * u * t * control.x + t * t * b.x,
    y: u * u * a.y + 2 * u * t * control.y + t * t * b.y };
}

// The ember first follows the aimed ray to the wind band, then the fan bends it back up.
export function emberPoint(from, inlet, end, t) {
  if (t <= 0.5) return { x: mix(from.x, inlet.x, t * 2), y: mix(from.y, inlet.y, t * 2) };
  return quadratic(inlet, { x: end.x, y: inlet.y }, end, (t - 0.5) * 2);
}
