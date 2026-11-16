// The animated looks out of the gachapon (data/gacha.js, kind 'paint_fx'): the colour laid over the hull at a
// moment. Plain numbers in and out, so it runs in tests without a browser.

const mix = (a, b, f) => {
  const ch = (s) => Math.round(((a >> s) & 255) + (((b >> s) & 255) - ((a >> s) & 255)) * f);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
};

/** A colour of the rainbow: hue 0..1, a saturation, full value. */
export function hue(h, s = 1) {
  const k = (n) => {
    const x = (n + h * 6) % 6;
    return Math.round(255 * (1 - s * Math.max(0, Math.min(x, 4 - x, 1))));
  };
  return (k(5) << 16) | (k(3) << 8) | k(1);
}

/**
 * The hull's tint at time t (s). `anim`: { tints, speed } flows through its colours, `speed` of them a second
 * (step: jumps from one to the next); { hue: true, speed, sat } goes round the rainbow, `speed` turns a second.
 */
export function fxTint(anim, t) {
  if (anim.hue) return hue((t * anim.speed) % 1, anim.sat ?? 0.45);
  const n = anim.tints.length;
  const k = (t * anim.speed) % n;
  const i = Math.floor(k);
  return anim.step ? anim.tints[i] : mix(anim.tints[i], anim.tints[(i + 1) % n], k - i);
}
