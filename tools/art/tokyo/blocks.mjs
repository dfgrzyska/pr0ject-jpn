// Cutting a city block into lots: rows from its south edge up, each row cut across into lots, a lane's width
// left between the rows. Used by every district of Tokyo to fill the ground between its streets.

/** The lots of the box [x, u, w, h] as boxes: rows `depth` deep, lots `width` wide (both [min, max]). */
export function lots([x, u, w, h], rand, { depth = [9, 14], width = [8, 16], lane = 1, small = false } = {}) {
  const cut = (total, [lo, hi], gap) => {
    if (small && total < lo) return total > 0 ? [[0, total]] : []; // (small: a block too small to cut is one lot)
    const out = [];
    let at = 0;
    while (total - at >= lo) {
      let d = lo + Math.floor(rand() * (hi - lo + 1));
      if (total - at - d - gap < lo) d = total - at; // (the last one takes what is left)
      out.push([at, Math.min(d, total - at)]);
      at += d + gap;
    }
    return out;
  };
  const out = [];
  for (const [du, d] of cut(h, depth, lane)) for (const [dx, ww] of cut(w, width, 0)) out.push([x + dx, u + du, ww, d]);
  return out;
}
